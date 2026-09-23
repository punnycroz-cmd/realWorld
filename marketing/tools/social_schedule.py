#!/usr/bin/env python3
"""social_schedule.py — export the canonical content calendar.

Reads social/schedule.json (the machine-readable form of
SOCIAL-LAUNCH-PLAN.md §5) and emits launch-ready queue files into
marketing/dist/:

  dist/social-queue.csv      — one row per post/channel, with UTM links,
                               importable into a scheduler or used as a
                               manual checklist.
  dist/social-calendar.ics   — the same beats as calendar events, so the
                               owner can see launch week on a real calendar.

LOCAL ONLY. This exports files; it never posts, schedules, or contacts
any platform. `launch_date` in schedule.json stays null until the owner
picks a date — pass --date YYYY-MM-DD to resolve offsets for a dry run.

Usage:
  python3 tools/social_schedule.py                 # validate + export, T-offsets
  python3 tools/social_schedule.py --date 2026-10-06
  python3 tools/social_schedule.py --check         # validate only
"""
import argparse
import csv
import json
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parent.parent
SCHEDULE = ROOT / "social" / "schedule.json"
DRAFTS = ROOT / "social" / "drafts"
DIST = ROOT / "dist"

VALID_CHANNELS = {
    "x", "bluesky", "tiktok", "youtube", "youtube-shorts",
    "reddit", "discord", "itch", "instagram",
}
UTM_CHANNEL = {"youtube-shorts": "youtube"}
VALID_MEDIA = {
    "organic", "bio", "thread", "clip", "recap", "spotlight",
}


def load():
    return json.loads(SCHEDULE.read_text())


def validate(sched):
    errors, warns = [], []
    seen = set()
    for phase in sched["phases"]:
        for post in phase["posts"]:
            pid = post["id"]
            if pid in seen:
                errors.append(f"{pid}: duplicate id")
            seen.add(pid)
            for ch in post["channels"]:
                if ch not in VALID_CHANNELS:
                    errors.append(f"{pid}: unknown channel '{ch}'")
            if post["medium"] not in VALID_MEDIA:
                errors.append(f"{pid}: unknown utm_medium '{post['medium']}'")
            d = post.get("draft")
            if d and not (DRAFTS / d).exists():
                errors.append(f"{pid}: draft file missing: social/drafts/{d}")
            if "day" not in post and "day_range" not in post:
                errors.append(f"{pid}: needs day or day_range")
            if "day" in post and "time" not in post:
                warns.append(f"{pid}: no time — default {sched['default_time_pt']}")
            if not d:
                warns.append(f"{pid}: no draft file — copy lives inline/elsewhere")
    return errors, warns


def utm_link(sched, post, channel):
    params = {
        "utm_source": UTM_CHANNEL.get(channel, channel),
        "utm_medium": post["medium"],
        "utm_campaign": post["campaign"],
    }
    return f"{sched['site_url']}?{urlencode(params)}"


def expand_rows(sched, launch):
    """One row per (post, channel). Arcs get a row per phase entry, not per
    day — the arc draft file owns its internal daily pacing."""
    rows = []
    for phase in sched["phases"]:
        for post in phase["posts"]:
            if "day" in post:
                when = post["day"]
                day_label = f"T{'+' if when >= 0 else ''}{when}"
                abs_date = (launch + timedelta(days=when)).isoformat() if launch else ""
                time = post.get("time", sched["default_time_pt"])
            else:
                lo, hi = post["day_range"]
                day_label = f"T+{lo}..T+{hi} ({post['recurrence']})"
                abs_date = (launch + timedelta(days=lo)).isoformat() if launch else ""
                time = sched["default_time_pt"]
            for ch in post["channels"]:
                rows.append({
                    "id": post["id"],
                    "phase": phase["id"],
                    "day": day_label,
                    "date": abs_date,
                    "time_pt": time,
                    "channel": ch,
                    "draft": post.get("draft") or "",
                    "link": utm_link(sched, post, ch),
                    "summary": post["summary"],
                })
    return rows


def write_csv(rows, launch):
    DIST.mkdir(exist_ok=True)
    out = DIST / "social-queue.csv"
    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return out


def write_ics(rows, launch):
    out = DIST / "social-calendar.ics"
    lines = [
        "BEGIN:VCALENDAR", "VERSION:2.0",
        "PRODID:-//real-world-marketing//social-schedule//EN",
        "CALSCALE:GREGORIAN",
    ]
    if launch is None:
        # Undated export: a single VTODO-style note per fixed post is
        # noise — emit one VEVENT per phase as a reminder instead.
        lines.append("BEGIN:VEVENT")
        lines.append("UID:social-schedule-undated@realworld")
        lines.append(f"DTSTAMP:{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}")
        lines.append("DTSTART;VALUE=DATE:20260923")
        lines.append("SUMMARY:Real World social calendar — launch_date not set (schedule.json)")
        lines.append("END:VEVENT")
    else:
        for r in rows:
            if ".." in r["day"]:
                continue  # arcs: one event is misleading; see CSV
            d = datetime.strptime(f"{r['date']} {r['time_pt']}", "%Y-%m-%d %H:%M")
            lines += [
                "BEGIN:VEVENT",
                f"UID:{r['id']}-{r['channel']}@realworld",
                f"DTSTAMP:{datetime.now(timezone.utc):%Y%m%dT%H%M%SZ}",
                f"DTSTART:{d:%Y%m%dT%H%M}00",
                f"DURATION:PT15M",
                f"SUMMARY:[{r['channel']}] {r['summary'][:60]}",
                f"DESCRIPTION:draft={r['draft'] or 'inline'} link={r['link']}",
                "END:VEVENT",
            ]
    lines.append("END:VCALENDAR")
    out.write_text("\r\n".join(lines) + "\r\n")
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", help="launch date YYYY-MM-DD (resolves T-offsets)")
    ap.add_argument("--check", action="store_true", help="validate only")
    args = ap.parse_args()

    sched = load()
    launch = None
    if args.date:
        launch = date.fromisoformat(args.date)
    elif sched.get("launch_date"):
        launch = date.fromisoformat(sched["launch_date"])

    errors, warns = validate(sched)
    for w in warns:
        print(f"WARN  {w}")
    for e in errors:
        print(f"FAIL  {e}")
    if errors:
        print(f"\nsocial_schedule: {len(errors)} FAIL")
        return 1
    if args.check:
        print(f"social_schedule: OK — {sum(len(p['posts']) for p in sched['phases'])} posts, launch={'unset' if not launch else launch}")
        return 0

    rows = expand_rows(sched, launch)
    csv_path = write_csv(rows, launch)
    ics_path = write_ics(rows, launch)
    print(f"social_schedule: OK — {len(rows)} queue rows")
    print(f"  {csv_path.relative_to(ROOT)}")
    print(f"  {ics_path.relative_to(ROOT)}")
    if launch is None:
        print("  launch_date unset — pass --date YYYY-MM-DD to resolve T-offsets")
    return 0


if __name__ == "__main__":
    sys.exit(main())
