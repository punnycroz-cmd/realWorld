#!/usr/bin/env python3
"""Real World — goals/KPI gate for a weekly capture.

Grades an NDJSON capture (analytics_sink.py format) against
marketing/analytics/goals.json and prints a status table:

    PASS    target met
    WATCH   within the watch band (>= watch_frac * target for at_least,
            <= target / watch_frac for at_most) — not red, not fine
    MISS    outside the watch band
    LOW-N   denominator sessions < min_n (default 30, same guardrail as
            ab_compare.py) — never grade a tiny week
    NO-DATA no qualifying events at all (expected for pending game-side
            emitters when pending_ok is set)

Usage:
    python3 marketing/tools/analytics_goals.py events.ndjson
    python3 marketing/tools/analytics_goals.py events.ndjson --json
    python3 marketing/tools/analytics_goals.py events.ndjson --strict  # exit 1 on MISS

Stage/event mapping mirrors funnel_scorecard.py and analytics_report.py —
goals.json carries its own copy; keep all three in sync.
"""
import argparse
import json
import os
import sys
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
GOALS_PATH = os.path.join(HERE, "..", "analytics", "goals.json")


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


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    if not n:
        return None
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2


def build_index(evts, stages):
    """Per-session stage membership + helpers, one pass."""
    sess_stage = defaultdict(set)          # sid -> {stage}
    sess_pages = defaultdict(set)          # sid -> {path}
    sess_events = defaultdict(set)         # sid -> {event names}
    pageviews = 0
    notfound_pv = 0
    engaged_secs = defaultdict(list)       # page -> [seconds]
    for e in evts:
        sid = e.get("sid")
        name = e.get("event")
        if not sid or not name:
            continue
        sess_events[sid].add(name)
        for stage, names in stages.items():
            if name in names:
                sess_stage[sid].add(stage)
        if name == "pageview":
            pageviews += 1
            props = e.get("props") or {}
            path = e.get("path") or ""
            sess_pages[sid].add(path or props.get("page") or "?")
            if props.get("page") == "404" or path.endswith("404.html"):
                notfound_pv += 1
        elif name == "engaged_time":
            props = e.get("props") or {}
            try:
                engaged_secs[props.get("page") or "?"].append(
                    float(props.get("seconds") or 0))
            except (TypeError, ValueError):
                pass
    return sess_stage, sess_pages, sess_events, pageviews, notfound_pv, engaged_secs


def evaluate(goal, idx):
    sess_stage, sess_pages, sess_events, pageviews, notfound_pv, engaged_secs = idx
    m = goal["metric"]
    kind = m["kind"]

    if kind == "stage_conv":
        num = sum(1 for s in sess_stage.values()
                  if m["from"] in s and m["to"] in s)
        den = sum(1 for s in sess_stage.values() if m["from"] in s)
        return (num / den if den else None), den
    if kind == "stage_reach":
        den = sum(1 for s in sess_stage.values() if m["per"] in s)
        num = sum(1 for s in sess_stage.values()
                  if m["per"] in s and m["stage"] in s)
        return (num / den if den else None), den
    if kind == "event_session_rate":
        want = set(m["events"])
        den = sum(1 for s in sess_stage.values() if m["per_stage"] in s)
        num = sum(1 for sid, s in sess_stage.items()
                  if m["per_stage"] in s and sess_events[sid] & want)
        return (num / den if den else None), den
    if kind == "bounce_rate":
        den = len(sess_pages)
        num = sum(1 for p in sess_pages.values() if len(p) <= 1)
        return (num / den if den else None), den
    if kind == "notfound_pageview_share":
        return (notfound_pv / pageviews if pageviews else None), pageviews
    if kind == "median_engaged_seconds":
        secs = engaged_secs.get(m["page"]) if m.get("page") else \
            [s for v in engaged_secs.values() for s in v]
        return median(secs), len(secs)
    raise ValueError(f"unknown metric kind: {kind}")


def grade(goal, value, den, defaults):
    if value is None:
        return "NO-DATA" if goal.get("pending_ok") or den == 0 else "NO-DATA"
    if den < goal.get("min_n", defaults["min_n"]):
        return "LOW-N"
    t = goal["target"]
    wf = goal.get("watch_frac", defaults["watch_frac"])
    if goal["direction"] == "at_least":
        return "PASS" if value >= t else ("WATCH" if value >= t * wf else "MISS")
    return "PASS" if value <= t else ("WATCH" if value <= t / wf else "MISS")


def fmt(value, unit):
    if value is None:
        return "—"
    if unit == "s":
        return f"{value:.0f}s"
    return f"{value * 100:.1f}%"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("events", help="NDJSON capture from analytics_sink.py")
    ap.add_argument("--goals", default=GOALS_PATH, help="goals.json path")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 on any MISS (weekly cron hook)")
    args = ap.parse_args()

    with open(args.goals, encoding="utf-8") as f:
        spec = json.load(f)
    defaults = spec.get("defaults", {"min_n": 30, "watch_frac": 0.8})
    evts = load_ndjson(args.events)
    idx = build_index(evts, spec["stages"])
    nsess = len(idx[2])

    rows = []
    misses = 0
    for g in spec["goals"]:
        value, den = evaluate(g, idx)
        status = grade(g, value, den, defaults)
        if status == "MISS":
            misses += 1
        rows.append({"id": g["id"], "label": g["label"], "status": status,
                     "value": value, "n": den, "target": g["target"],
                     "direction": g["direction"], "unit": g.get("unit"),
                     "severity": g.get("severity", "goal")})

    if args.json:
        print(json.dumps({"sessions": nsess, "misses": misses,
                          "goals": rows}, indent=2))
    else:
        print(f"### goals — {nsess} sessions graded against goals.json\n")
        print("| goal | actual | target | n | status |")
        print("|---|---|---|---|---|")
        for r in rows:
            d = "≥" if r["direction"] == "at_least" else "≤"
            tgt = fmt(r["target"], r["unit"])
            print(f"| {r['id']} | {fmt(r['value'], r['unit'])} | "
                  f"{d} {tgt} | {r['n']} | {r['status']} |")
        print("\nPASS = target met · WATCH = within the band · MISS = red · "
              "LOW-N = under min_n · NO-DATA = emitter not live yet.")
        if misses:
            print(f"\n**{misses} MISS** — investigate before next week; "
                  "do not edit targets mid-flight (day-30 retro only).")
    if args.strict and misses:
        sys.exit(1)


if __name__ == "__main__":
    main()
