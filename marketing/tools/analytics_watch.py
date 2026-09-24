#!/usr/bin/env python3
"""Real World — week-over-week capture diff / anomaly watch (v111).

Compares two NDJSON captures (current vs a previous period — same length is
the honest comparison; flag that yourself if they differ) and prints a
delta table plus WARN lines when a metric moves past its threshold:

- sessions / pageviews: |Δ| ≥ --threshold % (default 25)
- funnel stage session-rates (visit→…→create): relative drop ≥ threshold
- 404 pageviews: any increase ≥ +50% or new 404 paths
- event names in the current capture that don't exist in
  analytics-events.json (spec drift — also caught statically by
  analytics_coverage.py, this catches it in the data)
- median engaged seconds per site: drop ≥ threshold

Exit 0 normally; with --strict, exit 1 when any WARN fired — for wiring
into a cron/CI step at launch.

Usage:
    python3 marketing/tools/analytics_watch.py week2.ndjson week1.ndjson
    python3 marketing/tools/analytics_watch.py cur.ndjson prev.ndjson \
        --threshold 20 --strict
"""
import argparse
import json
import os
import sys
from collections import Counter, defaultdict

FUNNEL = ["pageview", "engaged", "community", "watch_start",
          "request_submitted", "character_created"]
ENGAGED_EVENTS = {"cta_click", "scroll_depth", "screenshot_view", "share_click",
                  "price_calc", "scene_calc", "sub_calc", "request_simulated"}
COMMUNITY_EVENTS = {"community_join", "recap_open", "watch_party_rsvp"}


def load(path):
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


def stage_of(name):
    if name == "pageview":
        return "pageview"
    if name in ENGAGED_EVENTS:
        return "engaged"
    if name in COMMUNITY_EVENTS:
        return "community"
    return name


def stats(evts):
    sids = set()
    stage_sids = defaultdict(set)
    pageviews = 0
    notfound = Counter()
    engaged_secs = []
    names = Counter()
    for e in evts:
        name = e.get("event") or "?"
        names[name] += 1
        sid = e.get("sid")
        if sid:
            sids.add(sid)
            stage_sids[stage_of(name)].add(sid)
        if name == "pageview":
            pageviews += 1
            p = e.get("props") or {}
            if p.get("page") == "404" or (e.get("path") or "").endswith("404.html"):
                notfound[e.get("path") or "?"] += 1
        elif name == "engaged_time":
            engaged_secs.append(int((e.get("props") or {}).get("seconds") or 0))
    engaged_secs.sort()
    return {
        "sessions": len(sids),
        "pageviews": pageviews,
        "stage": {s: len(stage_sids.get(s, ())) for s in FUNNEL},
        "notfound": notfound,
        "med_engaged": engaged_secs[len(engaged_secs) // 2] if engaged_secs else 0,
        "names": names,
    }


def spec_events():
    here = os.path.dirname(os.path.abspath(__file__))
    spec = os.path.join(here, "..", "analytics-events.json")
    try:
        with open(spec, encoding="utf-8") as f:
            return set(json.load(f).get("events", {}))
    except (OSError, ValueError):
        return set()


def delta(a, b):
    if b == 0:
        return None if a == 0 else float("inf")
    return (a - b) / b


def fmt(d):
    if d is None:
        return "—"
    if d == float("inf"):
        return "new"
    return f"{100 * d:+.0f}%"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("current", help="NDJSON for the period under review")
    ap.add_argument("previous", help="NDJSON for the baseline period")
    ap.add_argument("--threshold", type=float, default=25.0,
                    help="percent move that triggers a WARN (default 25)")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 if any WARN fired")
    args = ap.parse_args()

    cur, prev = stats(load(args.current)), stats(load(args.previous))
    thr = args.threshold / 100.0
    warns = []

    rows = []
    def row(label, c, p, warn=False):
        d = delta(c, p)
        rows.append((label, c, p, d, warn))
        return d

    d = row("sessions", cur["sessions"], prev["sessions"])
    if d is not None and abs(d) >= thr:
        warns.append(f"sessions moved {fmt(d)}")
    d = row("pageviews", cur["pageviews"], prev["pageviews"])
    if d is not None and abs(d) >= thr:
        warns.append(f"pageviews moved {fmt(d)}")

    for s in FUNNEL:
        c, p = cur["stage"][s], prev["stage"][s]
        d = row(f"funnel sessions: {s}", c, p)
        if d is not None and d != float("inf") and d <= -thr:
            warns.append(f"funnel stage '{s}' down {fmt(d)}")

    row("median engaged seconds", cur["med_engaged"], prev["med_engaged"])
    d = delta(cur["med_engaged"], prev["med_engaged"])
    if d is not None and d != float("inf") and d <= -thr:
        warns.append(f"median engaged seconds down {fmt(d)}")

    c404, p404 = sum(cur["notfound"].values()), sum(prev["notfound"].values())
    row("404 pageviews", c404, p404)
    new404 = set(cur["notfound"]) - set(prev["notfound"])
    if (p404 and c404 >= 1.5 * p404) or (not p404 and c404):
        warns.append(f"404s up ({p404} → {c404})"
                     + (f"; new paths: {', '.join(sorted(new404))}" if new404 else ""))

    known = spec_events()
    unknown = sorted(set(cur["names"]) - known) if known else []
    new_names = sorted(set(cur["names"]) - set(prev["names"]))
    if unknown:
        warns.append("events not in analytics-events.json: " + ", ".join(unknown))
    if new_names:
        rows.append(("new event names (vs prev)", "—", "—", None, False))

    out = ["### wow check — current vs previous capture", ""]
    out.append("| metric | prev | current | Δ |")
    out.append("|---|---|---|---|")
    for label, c, p, d, w in rows:
        flag = " **WARN**" if w else ""
        out.append(f"| {label} | {p} | {c} | {fmt(d)}{flag} |")
    if new_names:
        out.append("")
        out.append("new event names since previous capture: "
                   + ", ".join(new_names))
    out.append("")
    if warns:
        out.append("**WARNINGS:**")
        out.extend(f"- {w}" for w in warns)
    else:
        out.append("all clear — no metric moved past "
                   f"{args.threshold:g}% and no spec/404 anomalies.")
    print("\n".join(out))
    if args.strict and warns:
        sys.exit(1)


if __name__ == "__main__":
    main()
