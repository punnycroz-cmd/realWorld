#!/usr/bin/env python3
"""Real World — multi-week trendline (the missing third time axis).

analytics_report.py reads ONE capture. analytics_watch.py diffs TWO.
This tool lines up N captures — keep each week's NDJSON and the whole
season becomes one table: sessions, funnel reach, bounce, attention, and
ASCII sparklines so a slow decline is visible before a --strict alarm
ever fires.

Usage:
    python3 marketing/tools/analytics_history.py week37.ndjson week38.ndjson ...
    python3 marketing/tools/analytics_history.py captures/*.ndjson --json

Each file is labelled by the ISO week of its newest event (same rule as
metrics_weekly.sh). Rows are sorted oldest → newest regardless of arg
order. Metrics:

  sessions    distinct sid count
  pv          pageview events
  engaged     % of sessions with any engagement-stage event
  watch       % of sessions reaching watch_start
  req         % of sessions reaching request_submitted
  bounce      % of single-pageview sessions
  attn        median engaged_time seconds
  404s        % of pageviews on the 404 page

Columns render sparklines (▁▂▃▄▅▆▇█) once there are ≥2 captures.
"""
import argparse
import datetime
import json
import sys
from collections import defaultdict
from pathlib import Path

ENGAGED = {"cta_click", "scroll_depth", "screenshot_view", "share_click",
           "price_calc", "scene_calc", "sub_calc", "request_simulated",
           "engaged_time", "community_join", "recap_open",
           "watch_party_rsvp", "press_kit_download"}

SPARK = "▁▂▃▄▅▆▇█"


def spark(vals):
    if len(vals) < 2:
        return "·"
    lo, hi = min(vals), max(vals)
    if hi == lo:
        return SPARK[0] * len(vals)
    return "".join(SPARK[min(6, int((v - lo) / (hi - lo) * 6.999))]
                   for v in vals)


def week_of(latest_ms):
    if not latest_ms:
        return "undated"
    d = datetime.datetime.fromtimestamp(latest_ms / 1000, datetime.UTC)
    iso = d.isocalendar()
    return f"{iso.year}-W{iso.week:02d}"


def metrics(path):
    sids = set()
    pv = pv404 = 0
    engaged_sids, watch_sids, req_sids, char_sids = set(), set(), set(), set()
    pv_per_sid = defaultdict(int)
    attn = []
    latest = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            try:
                e = json.loads(line)
            except ValueError:
                continue
            sid = e.get("sid")
            name = e.get("event")
            ts = e.get("ts") or 0
            latest = max(latest, ts)
            if not sid:
                continue
            sids.add(sid)
            if name == "pageview":
                pv += 1
                pv_per_sid[sid] += 1
                slug = (e.get("props") or {}).get("page") or e.get("path") or ""
                if "404" in str(slug):
                    pv404 += 1
            if name in ENGAGED:
                engaged_sids.add(sid)
            if name == "watch_start":
                watch_sids.add(sid)
            if name == "request_submitted":
                req_sids.add(sid)
            if name == "character_created":
                char_sids.add(sid)
            if name == "engaged_time":
                sec = (e.get("props") or {}).get("seconds")
                if isinstance(sec, (int, float)):
                    attn.append(sec)
    n = len(sids) or 1
    attn.sort()
    return {
        "week": week_of(latest),
        "file": Path(path).name,
        "sessions": len(sids),
        "pv": pv,
        "engaged": len(engaged_sids) / n,
        "watch": len(watch_sids) / n,
        "req": len(req_sids) / n,
        "char": len(char_sids) / n,
        "bounce": sum(1 for s in sids if pv_per_sid[s] <= 1) / n,
        "attn": attn[len(attn) // 2] if attn else 0,
        "nf": pv404 / pv if pv else 0.0,
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("captures", nargs="+", help="NDJSON captures, any order")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    rows = [metrics(p) for p in args.captures]
    rows.sort(key=lambda r: (r["week"], r["file"]))

    if args.json:
        print(json.dumps(rows, indent=2))
        return

    print("week      sessions   pv  engaged  watch    req   char  bounce  attn(s)  404s")
    print("-" * 78)
    for r in rows:
        print(f"{r['week']:<9} {r['sessions']:>7} {r['pv']:>5} "
              f"{r['engaged']:>7.0%} {r['watch']:>7.0%} {r['req']:>6.1%} "
              f"{r['char']:>6.1%} {r['bounce']:>6.0%} {r['attn']:>8} "
              f"{r['nf']:>5.1%}")

    if len(rows) >= 2:
        print("-" * 78)
        print("trends (oldest → newest)")
        for key, label, scale in (
            ("sessions", "sessions", 1),
            ("engaged", "engaged", 100),
            ("watch", "watch", 100),
            ("req", "requests", 100),
            ("bounce", "bounce", 100),
            ("attn", "attention", 1),
            ("nf", "404s", 100),
        ):
            vals = [r[key] * scale for r in rows]
            print(f"  {label:<10} {spark(vals)}  "
                  f"{vals[0]:.0f} → {vals[-1]:.0f}")


if __name__ == "__main__":
    main()
