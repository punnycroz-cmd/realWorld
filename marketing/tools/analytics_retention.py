#!/usr/bin/env python3
"""Real World — return-visit report from the retention sidecar (v171).

Reads the windowed-hash TSV written by `analytics_sink.py --retention`
(one `YYYY-MM-DD\\t<hash>` line per request) and prints the retention
block for the weekly file:

  - unique viewers per day
  - returning_viewers_7d — unique hashes seen on >=2 DISTINCT days inside
    the trailing 7-day window ending at the newest day in the file.
    THIS IS THE NORTH STAR: milestone M12's counter, and step 1 of the
    production-3 monetization sequence ("prove return visits first").
  - weekly first-seen cohorts — for each ISO week of first sighting, how
    many of those hashes returned on a later day within 7 days (day-7
    return rate per cohort)
  - median days-to-first-return across all hashes seen on >=2 days
  - a same-hash-multi-day share line (what fraction of all viewers came
    back at all inside the file's span)

Privacy contract (ANALYTICS.md §1a): the input carries hashes only — a
hash that is stable for at most one N-day window, then breaks. This tool
never sees an IP, UA, or any client-side id; it cannot and must not join
the TSV to the event NDJSON (a sid is a session, not a visitor — joining
would silently rebuild a persistent profile).

Usage:
    python3 marketing/tools/analytics_retention.py retention.tsv
    python3 marketing/tools/analytics_retention.py retention.tsv --json
    python3 marketing/tools/analytics_retention.py retention.tsv --strict --min-returning 100
"""
import argparse
import json
import sys
from collections import defaultdict
from datetime import date


def load_tsv(path):
    """Return {hash: set(date)} from a day<TAB>hash sidecar."""
    days_of = defaultdict(set)
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.rstrip("\n")
            if not line:
                continue
            try:
                day_s, h = line.split("\t")
                days_of[h].add(date.fromisoformat(day_s))
            except (ValueError, IndexError):
                print(f"# warn: line {i} malformed, skipped", file=sys.stderr)
    return days_of


def median(xs):
    xs = sorted(xs)
    n = len(xs)
    if not n:
        return None
    return xs[n // 2] if n % 2 else (xs[n // 2 - 1] + xs[n // 2]) / 2


def analyze(days_of):
    all_days = sorted({d for ds in days_of.values() for d in ds})
    if not all_days:
        return None
    newest = all_days[-1]
    win7 = {date.fromordinal(newest.toordinal() - k) for k in range(7)}

    per_day = defaultdict(int)
    for ds in days_of.values():
        for d in ds:
            per_day[d] += 1

    returning_7d = sum(1 for ds in days_of.values()
                       if len(ds & win7) >= 2)
    viewers_7d = sum(1 for ds in days_of.values() if ds & win7)

    # first-seen cohorts: ISO week of the earliest day per hash
    cohorts = defaultdict(lambda: {"n": 0, "returned": 0})
    gaps = []
    for ds in days_of.values():
        first = min(ds)
        key = first.isocalendar()[:2]  # (iso_year, iso_week)
        cohorts[key]["n"] += 1
        later = [d for d in ds if d > first]
        if any((d - first).days <= 7 for d in later):
            cohorts[key]["returned"] += 1
        if later:
            gaps.append(min((d - first).days for d in later))

    multi_day = sum(1 for ds in days_of.values() if len(ds) >= 2)
    return {
        "span": (all_days[0].isoformat(), newest.isoformat()),
        "days": len(all_days),
        "viewers_total": len(days_of),
        "per_day": {d.isoformat(): per_day[d] for d in all_days},
        "viewers_7d": viewers_7d,
        "returning_viewers_7d": returning_7d,
        "return_share_7d": (returning_7d / viewers_7d) if viewers_7d else None,
        "multi_day_share": (multi_day / len(days_of)) if days_of else None,
        "median_days_to_return": median(gaps),
        "cohorts": {f"{y}-W{w:02d}": c for (y, w), c in sorted(cohorts.items())},
    }


def render(r):
    out = ["### retention — return visits (windowed-hash sidecar, §1a)", ""]
    out.append(f"- span: {r['span'][0]} → {r['span'][1]} "
               f"({r['days']} active days, {r['viewers_total']} windowed viewers)")
    out.append(f"- **returning_viewers_7d: {r['returning_viewers_7d']}** "
               f"(of {r['viewers_7d']} viewers in the trailing 7d — "
               f"{(r['return_share_7d'] or 0) * 100:.1f}% came back on "
               f"another day) — milestone M12 counter")
    share = r["multi_day_share"]
    out.append(f"- multi-day share (whole span): "
               f"{f'{share * 100:.1f}%' if share is not None else '—'}")
    out.append(f"- median days to first return: "
               f"{r['median_days_to_return'] if r['median_days_to_return'] is not None else '—'}")
    out.append("")
    out.append("| first-seen cohort | viewers | returned ≤7d | day-7 rate |")
    out.append("|---|---|---|---|")
    for wk, c in r["cohorts"].items():
        rate = f"{c['returned'] / c['n'] * 100:.1f}%" if c["n"] else "—"
        out.append(f"| {wk} | {c['n']} | {c['returned']} | {rate} |")
    out.append("")
    out.append("Windowed hashes break at every salt rotation — a viewer "
               "silent across a boundary counts as new (undercounts "
               "returns; the honest direction).")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("retention", help="day<TAB>hash TSV from --retention")
    ap.add_argument("--json", action="store_true")
    ap.add_argument("--strict", action="store_true",
                    help="exit 1 when returning_viewers_7d < --min-returning")
    ap.add_argument("--min-returning", type=int, default=100,
                    help="floor for --strict (default 100 = milestone M12)")
    args = ap.parse_args()

    days_of = load_tsv(args.retention)
    r = analyze(days_of)
    if r is None:
        print("# no retention rows — sidecar empty or missing")
        if args.strict:
            sys.exit(1)
        return
    if args.json:
        r["per_day"] = dict(r["per_day"])
        print(json.dumps(r, indent=2))
    else:
        print(render(r))
    if args.strict and r["returning_viewers_7d"] < args.min_returning:
        sys.exit(1)


if __name__ == "__main__":
    main()
