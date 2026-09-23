#!/usr/bin/env python3
"""Real World — community-funnel weekly scorecard.

Computes the stage table defined in community/funnel-scorecard.md from an
NDJSON event capture (analytics_sink.py format) plus optional manual
Discord/community counts. Local only — no network, no DB.

Usage:
    python3 marketing/tools/funnel_scorecard.py events.ndjson
    python3 marketing/tools/funnel_scorecard.py events.ndjson --counts counts.json
    python3 marketing/tools/funnel_scorecard.py events.ndjson --week 2026-W40 --json

Event→stage mapping is identical to tools/analytics_report.py — keep the
two in sync or the scorecard and the metrics report will disagree.
"""
import argparse
import json
import sys
from collections import defaultdict

STAGE_EVENTS = {
    "pageview": {"pageview"},
    "engaged": {"cta_click", "scroll_depth", "screenshot_view", "share_click",
                "price_calc", "request_simulated"},
    "community": {"community_join", "recap_open", "watch_party_rsvp"},
    "watch_start": {"watch_start"},
    "request_submitted": {"request_submitted"},
    "character_created": {"character_created"},
}
STAGES = list(STAGE_EVENTS)

# Planning hypotheses from community/funnel-scorecard.md §2 — revise at
# day-30 retro only, in writing. Keys are (from_stage, to_stage).
TARGETS = {
    ("pageview", "engaged"): 0.40,
    ("engaged", "community"): 0.12,
    ("community", "watch_start"): 0.50,
    ("watch_start", "request_submitted"): 0.10,
    ("request_submitted", "character_created"): 0.20,
    ("engaged", "watch_start"): 0.25,
}


def load_ndjson(path):
    evts = []
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                evts.append(json.loads(line))
            except ValueError:
                print(f"# warn: line {i} not JSON, skipped", file=sys.stderr)
    return evts


def stage_of(evt):
    name = evt.get("event")
    for stage, names in STAGE_EVENTS.items():
        if name in names:
            return stage
    return None


def in_week(evt, week):
    """week like 2026-W40 matched against evt['ts'] ISO prefix."""
    if not week:
        return True
    ts = evt.get("ts") or ""
    try:
        import datetime
        d = datetime.date.fromisoformat(ts[:10])
        return f"{d.isocalendar().year}-W{d.isocalendar().week:02d}" == week
    except ValueError:
        return False


def scorecard(evts):
    sessions = defaultdict(set)
    for e in evts:
        st = stage_of(e)
        sid = e.get("sid")
        if st and sid:
            sessions[sid].add(st)
    counts = {s: sum(1 for reached in sessions.values() if s in reached)
              for s in STAGES}
    conv = {}
    for (a, b), target in TARGETS.items():
        if counts[a]:
            conv[(a, b)] = counts[b] / counts[a]
        else:
            conv[(a, b)] = None
    return counts, conv, len(sessions)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("events", help="NDJSON capture from analytics_sink.py")
    ap.add_argument("--counts", help="manual community counts JSON (scorecard §3)")
    ap.add_argument("--week", help="ISO week filter, e.g. 2026-W40")
    ap.add_argument("--json", action="store_true", help="machine-readable output")
    args = ap.parse_args()

    evts = [e for e in load_ndjson(args.events) if in_week(e, args.week)]
    counts, conv, nsess = scorecard(evts)

    manual = {}
    if args.counts:
        with open(args.counts, encoding="utf-8") as f:
            manual = json.load(f)

    if args.json:
        print(json.dumps({
            "week": args.week or (manual.get("week")),
            "sessions": nsess,
            "stage_counts": counts,
            "conversions": {f"{a}->{b}": v for (a, b), v in conv.items()},
            "targets": {f"{a}->{b}": t for (a, b), t in TARGETS.items()},
            "manual": manual,
        }, indent=2))
        return

    wk = args.week or manual.get("week") or "all-time"
    print(f"## Community funnel scorecard — {wk}\n")
    print(f"Sessions observed: {nsess}\n")
    print("| Stage | Sessions |")
    print("|---|---|")
    for s in STAGES:
        print(f"| {s} | {counts[s]} |")
    print("\n| Transition | Conv. | Target | Status |")
    print("|---|---|---|---|")
    red = []
    for (a, b), target in TARGETS.items():
        v = conv[(a, b)]
        if v is None:
            status = "n/a"
            vs = "—"
        else:
            vs = f"{v * 100:.1f}%"
            status = "ok" if v >= target else "BELOW"
            if v < target:
                red.append((a, b, v, target))
        print(f"| {a} → {b} | {vs} | ≥{target * 100:.0f}% | {status} |")

    if manual:
        print("\n| Community health | Value |")
        print("|---|---|")
        for k, v in manual.items():
            if k == "week":
                continue
            print(f"| {k} | {v} |")
        members = manual.get("discord_members")
        active = manual.get("discord_active_posters")
        if members and active is not None:
            print(f"| active/members ratio | {active / members * 100:.1f}%"
                  f" (healthy ≥15%) |")

    print()
    if red:
        for a, b, v, t in red:
            print(f"- BELOW TARGET: {a} → {b} at {v * 100:.1f}% vs ≥{t * 100:.0f}%"
                  " — note the segment before proposing a fix (scorecard §2).")
        print("- Reminder: two consecutive red weeks on one transition = named"
              " fix proposal at retro, not a quiet tweak.")
    else:
        print("- All measured transitions at or above planning targets.")
    print("\n_Targets are planning hypotheses (community/funnel-scorecard.md §2);"
          " counts are session counts, not unique humans._")


if __name__ == "__main__":
    main()
