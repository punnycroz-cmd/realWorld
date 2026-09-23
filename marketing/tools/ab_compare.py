#!/usr/bin/env python3
"""Real World — A/B / creative-variant funnel comparison.

Reads an NDJSON capture and splits sessions by a utm dimension (default
utm_content, per the conventions in ANALYTICS.md §6: thumb-a, teaser-15s…),
then prints a per-variant funnel table — sessions reaching each stage —
with a two-proportion z-test vs the --baseline variant for the transition
you actually changed.

Local only, no network. Same stage mapping as analytics_report.py and
funnel_scorecard.py — keep the three in sync.

Usage:
    python3 marketing/tools/ab_compare.py events.ndjson
    python3 marketing/tools/ab_compare.py events.ndjson --dim utm_campaign
    python3 marketing/tools/ab_compare.py events.ndjson --baseline thumb-a \\
        --transition engaged:watch_start --json

Honesty rules baked in: n<30 per arm gets a 'low-n' flag (no claims), the
z-test is a heuristic not a verdict, and the report says so. Do not ship
a winner on one week's z — log it, rerun next week.
"""
import argparse
import json
import math
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
LOW_N = 30


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
    for stage, names in STAGE_EVENTS.items():
        if name in names:
            return stage
    return None


def ztest(k1, n1, k2, n2):
    """Two-proportion z for variant (k2/n2) vs baseline (k1/n1)."""
    if not n1 or not n2:
        return None
    p = (k1 + k2) / (n1 + n2)
    se = math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2))
    if se == 0:
        return 0.0
    return (k2 / n2 - k1 / n1) / se


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("events", help="NDJSON capture from analytics_sink.py")
    ap.add_argument("--dim", default="utm_content",
                    help="utm key to split on (default utm_content)")
    ap.add_argument("--baseline", default=None,
                    help="variant to compare against (default: largest arm)")
    ap.add_argument("--transition", default="engaged:watch_start",
                    help="stage transition to z-test, e.g. engaged:watch_start")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    evts = load(args.events)

    # sid -> (variant, set-of-stages). Variant = utm[dim] seen on the
    # session's landing pageview; untagged sessions fold into '(direct)'.
    sess = {}
    for e in evts:
        sid = e.get("sid")
        if not sid:
            continue
        st = stage_of(e.get("event") or "")
        utm = e.get("utm") or {}
        variant = utm.get(args.dim) or "(direct)"
        entry = sess.setdefault(sid, [variant, set()])
        if st:
            entry[1].add(st)
        # landing pageview carries the landing utm — prefer its variant
        if e.get("event") == "pageview" and utm.get(args.dim):
            entry[0] = utm[args.dim]

    variants = defaultdict(set)   # variant -> set of stages reached lists
    for sid, (variant, stages) in sess.items():
        variants[variant].add(sid)
    stage_counts = {v: {s: 0 for s in STAGES} for v in variants}
    for sid, (variant, stages) in sess.items():
        for s in stages:
            stage_counts[variant][s] += 1

    if not variants:
        print("no sessions found", file=sys.stderr)
        sys.exit(1)

    arms = sorted(variants, key=lambda v: -len(variants[v]))
    base = args.baseline or (arms[0] if arms else None)
    t_from, _, t_to = args.transition.partition(":")

    if args.json:
        out = {"dim": args.dim, "baseline": base, "transition": args.transition,
               "arms": {}}
        for v in arms:
            n = len(variants[v])
            row = {"sessions": n, "stages": stage_counts[v]}
            if t_from in stage_counts[v] and base in stage_counts:
                bn = stage_counts[base][t_from]
                row["z_vs_baseline"] = ztest(stage_counts[base][t_to], bn,
                                             stage_counts[v][t_to],
                                             stage_counts[v][t_from]) if v != base else None
            out["arms"][v] = row
        print(json.dumps(out, indent=2))
        return

    print(f"# A/B readout — split by `{args.dim}` (baseline: {base})\n")
    print("| variant | sessions |" + "".join(f" {s} |" for s in STAGES))
    print("|---|" * (len(STAGES) + 2))
    for v in arms:
        n = len(variants[v])
        flag = " ⚠low-n" if n < LOW_N else ""
        row = f"| {v}{flag} | {n} |"
        for s in STAGES:
            c = stage_counts[v][s]
            row += f" {c} ({100 * c / n:.0f}%) |"
        print(row)

    if base in stage_counts and t_from in stage_counts.get(base, {}):
        print(f"\n**{t_from} → {t_to} vs baseline `{base}`:**")
        bn, bk = stage_counts[base][t_from], stage_counts[base][t_to]
        for v in arms:
            if v == base:
                continue
            vn, vk = stage_counts[v][t_from], stage_counts[v][t_to]
            z = ztest(bk, bn, vk, vn)
            if z is None:
                continue
            sig = "|z|≥1.96 — worth a second week" if abs(z) >= 1.96 else "within noise"
            p1 = 100 * bk / bn if bn else 0
            p2 = 100 * vk / vn if vn else 0
            print(f"- {v}: {p2:.1f}% vs {p1:.1f}% baseline · z={z:+.2f} ({sig})")
    print("\n_Session counts, not humans. z is a heuristic — confirm with a "
          "second week before calling a winner (ANALYTICS.md §7)._")


if __name__ == "__main__":
    main()
