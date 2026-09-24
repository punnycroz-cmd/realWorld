#!/usr/bin/env python3
"""Real World — session-journey analysis (v111).

Aggregate counts answer "how many"; this answers "in what order". Groups a
capture by sid (tab-nonce, not a visitor id), sorts by ts, and reads the
pageview trail as a journey:

- top landing pages + bounce rate (single-pageview sessions)
- top exit pages
- most common journeys (consecutive dupes compressed)
- top page→page transitions
- per-target conversion analysis: for each --target event, sessions that
  reached it, median pages before the first hit, the page it fired on,
  and "assist" pages — pages over-represented in converting sessions vs
  all sessions (lift ratio). Assist = correlation, not causation; treat a
  high-lift page as a hypothesis for EXPERIMENTS.md, not a verdict.

Usage:
    python3 marketing/tools/analytics_paths.py events.ndjson
    python3 marketing/tools/analytics_paths.py events.ndjson \
        --target watch_start --target request_submitted --top 10
    python3 marketing/tools/analytics_paths.py events.ndjson --json
"""
import argparse
import json
import sys
from collections import Counter, defaultdict

DEFAULT_TARGETS = ["watch_start", "request_simulated", "request_submitted",
                   "character_created"]


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


def slug_of(evt):
    p = evt.get("props") or {}
    if p.get("page"):
        return p["page"]
    s = (evt.get("path") or "?").lstrip("/")
    if s.endswith(".html"):
        s = s[:-5]
    return s or "index"


def journeys(evts):
    """sid -> {'pages': [slug,...] from pageviews, 'events': [name,...],
    'hit': {event_name -> first index in pages-ordering}}"""
    by_sid = defaultdict(list)
    for e in evts:
        sid = e.get("sid")
        if sid:
            by_sid[sid].append(e)
    out = {}
    for sid, ev in by_sid.items():
        ev.sort(key=lambda e: e.get("ts") or 0)
        pages, seen = [], set()
        names = []
        for e in ev:
            names.append(e.get("event") or "?")
            if e.get("event") == "pageview":
                s = slug_of(e)
                if not pages or pages[-1] != s:  # compress consecutive dupes
                    pages.append(s)
                seen.add(s)
        out[sid] = {"pages": pages, "events": names}
    return out


def analyze(evts, targets, top):
    by_sid = defaultdict(list)
    for e in evts:
        if e.get("sid"):
            by_sid[e["sid"]].append(e)
    for ev in by_sid.values():
        ev.sort(key=lambda e: e.get("ts") or 0)
    J = journeys(evts)
    n = len(J)
    landings = Counter(j["pages"][0] for j in J.values() if j["pages"])
    exits = Counter(j["pages"][-1] for j in J.values() if j["pages"])
    bounced = sum(1 for j in J.values() if len(j["pages"]) <= 1)
    trails = Counter(" → ".join(j["pages"]) for j in J.values() if j["pages"])
    trans = Counter()
    page_in_sessions = Counter()
    for j in J.values():
        for a, b in zip(j["pages"], j["pages"][1:]):
            trans[f"{a} → {b}"] += 1
        for p in set(j["pages"]):
            page_in_sessions[p] += 1

    target_rows = []
    for t in targets:
        hit_sids = [sid for sid, j in J.items() if t in j["events"]]
        pages_before = []
        fired_on = Counter()
        assist = Counter()
        for sid in hit_sids:
            j = J[sid]
            idx = j["events"].index(t)
            # events before the hit that were pageviews → how far in
            pv_before = sum(1 for x in j["events"][:idx] if x == "pageview")
            pages_before.append(pv_before)
            fired_on[slug_of(by_sid[sid][idx])] += 1
            for p in set(j["pages"]):
                assist[p] += 1
        med = sorted(pages_before)
        med = med[len(med) // 2] if med else 0
        lifts = {p: (assist[p] / len(hit_sids)) / (page_in_sessions[p] / n)
                 for p in assist} if hit_sids and n else {}
        target_rows.append({
            "target": t,
            "sessions": len(hit_sids),
            "rate": len(hit_sids) / n if n else 0,
            "median_pages_before": med,
            "fired_on": fired_on.most_common(top),
            "assists": sorted(lifts.items(), key=lambda kv: -kv[1])[:top],
            "assist_counts": dict(assist),
        })

    lens = sorted(len(j["pages"]) for j in J.values())
    return {
        "sessions": n,
        "median_journey_len": lens[len(lens) // 2] if lens else 0,
        "journeys_1p": sum(1 for x in lens if x == 1),
        "journeys_2_3p": sum(1 for x in lens if 2 <= x <= 3),
        "journeys_4p": sum(1 for x in lens if x >= 4),
        "bounce_rate": bounced / n if n else 0,
        "landings": landings.most_common(top),
        "exits": exits.most_common(top),
        "trails": trails.most_common(top),
        "transitions": trans.most_common(top),
        "targets": target_rows,
    }


def md(res):
    o = []
    n = res["sessions"]
    o.append(f"### journeys — {n} sessions")
    o.append("")
    o.append(f"- journey length: 1 page {res['journeys_1p']} · "
             f"2–3 pages {res['journeys_2_3p']} · 4+ {res['journeys_4p']} · "
             f"median {res['median_journey_len']}")
    o.append(f"- bounce rate (single-page sessions): "
             f"{100 * res['bounce_rate']:.0f}%")
    if res["landings"]:
        o.append("- top landings: " + ", ".join(
            f"{p} ({c})" for p, c in res["landings"][:6]))
    if res["exits"]:
        o.append("- top exits: " + ", ".join(
            f"{p} ({c})" for p, c in res["exits"][:6]))
    if res["transitions"]:
        o.append("- top transitions: " + ", ".join(
            f"{t} ×{c}" for t, c in res["transitions"][:8]))
    if res["trails"]:
        o.append("")
        o.append("**most common journeys:**")
        for trail, c in res["trails"][:8]:
            o.append(f"  {c:>4}  {trail}")
    for t in res["targets"]:
        if not t["sessions"]:
            o.append(f"\n**→ {t['target']}:** no sessions reached it "
                     f"(0/{n}) — PENDING emitter or a real dead funnel")
            continue
        o.append(f"\n**→ {t['target']}:** {t['sessions']} sessions "
                 f"({100 * t['rate']:.0f}%), median {t['median_pages_before']} "
                 f"pages before first hit")
        if t["fired_on"]:
            o.append("  fired on: " + ", ".join(
                f"{p} ({c})" for p, c in t["fired_on"][:5]))
        shown = [(p, l) for p, l in t["assists"]
                 if l >= 1.15 and t["assist_counts"].get(p, 0) >= 3]
        if shown:
            o.append("  assist pages (≥1.15× lift, n≥3): " + ", ".join(
                f"{p} {l:.1f}×" for p, l in shown[:6]))
    return "\n".join(o)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ndjson", help="event file written by analytics_sink.py")
    ap.add_argument("--target", action="append", dest="targets",
                    help="event to analyze conversion paths for (repeatable; "
                         "default: watch_start, request_simulated, "
                         "request_submitted, character_created)")
    ap.add_argument("--top", type=int, default=10)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    evts = load(args.ndjson)
    res = analyze(evts, args.targets or DEFAULT_TARGETS, args.top)
    print(json.dumps(res, indent=2, sort_keys=True) if args.json else md(res))


if __name__ == "__main__":
    main()
