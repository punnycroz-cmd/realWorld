#!/usr/bin/env python3
"""Real World — cost-per-simulated-day ledger + report (v179).

The production-3 direction locks the proof ladder: stage 1 measures
`returning_viewers_7d` ALONGSIDE cost per simulated day — "no business
arithmetic postponed." analytics_retention.py owns the first number;
this tool owns the second. stage_gates.sh reads the --json output.

Ledger format (`analytics/cost-ledger.tsv`) — one row per line:

    YYYY-MM-DD<TAB>cost<TAB>dollars<TAB>category<TAB>note
    YYYY-MM-DD<TAB>mod_hours<TAB>hours<TAB>who<TAB>note
    YYYY-MM-DD<TAB>sim_days<TAB>days<TAB>source<TAB>note

Categories are free text; suggested: hosting, inference, tooling, other.
`mod_hours` converts to dollars at --rate (default $0 — volunteer time is
still logged so the load is visible before it is priced). `sim_days`
comes from the game track's sim clock — the owner pastes the number in;
marketing cannot derive it. `#` lines are comments.

Usage:
    python3 tools/cost_ledger.py report [ledger.tsv] [--rate 25]
    python3 tools/cost_ledger.py report [ledger.tsv] --json
    python3 tools/cost_ledger.py add cost 4.20 inference "openrouter week" \
        [--file analytics/cost-ledger.tsv] [--date 2026-09-25]
    python3 tools/cost_ledger.py add sim_days 30 game "block ran 30 sim-days"
    python3 tools/cost_ledger.py add mod_hours 2 review "queue sweep"

LOCAL ONLY. Reads/writes files under marketing/; never touches network.
"""
import argparse
import json
import sys
from collections import defaultdict
from datetime import date, timedelta

VALID_KINDS = {"cost", "mod_hours", "sim_days"}


def load(path):
    rows = []
    with open(path, encoding="utf-8") as f:
        for i, line in enumerate(f, 1):
            line = line.rstrip("\n")
            if not line or line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) < 4:
                print(f"# warn: line {i} needs >=4 fields, skipped",
                      file=sys.stderr)
                continue
            day_s, kind, val_s, cat = parts[0], parts[1], parts[2], parts[3]
            note = parts[4] if len(parts) > 4 else ""
            try:
                d = date.fromisoformat(day_s)
                v = float(val_s)
            except ValueError:
                print(f"# warn: line {i} bad date/number, skipped",
                      file=sys.stderr)
                continue
            if kind not in VALID_KINDS:
                print(f"# warn: line {i} unknown kind '{kind}', skipped",
                      file=sys.stderr)
                continue
            rows.append({"date": d, "kind": kind, "value": v,
                         "category": cat, "note": note})
    return rows


def dollars(row, rate):
    if row["kind"] == "cost":
        return row["value"]
    if row["kind"] == "mod_hours":
        return row["value"] * rate
    return 0.0


def report(rows, rate):
    if not rows:
        return {"entries": 0}
    days = sorted({r["date"] for r in rows})
    end = days[-1]
    by_cat = defaultdict(float)
    sim_total = 0.0
    spend_total = 0.0
    for r in rows:
        if r["kind"] == "sim_days":
            sim_total += r["value"]
        else:
            d = dollars(r, rate)
            spend_total += d
            by_cat[r["category"]] += d

    def window(lo, hi):
        spend = sum(dollars(r, rate) for r in rows
                    if lo <= r["date"] <= hi and r["kind"] != "sim_days")
        sim = sum(r["value"] for r in rows
                  if r["kind"] == "sim_days" and lo <= r["date"] <= hi)
        return spend, sim, (spend / sim if sim > 0 else None)

    w7 = window(end - timedelta(days=6), end)
    weekly = []
    wk_start = days[0] - timedelta(days=days[0].weekday())
    while wk_start <= end:
        wk_end = min(wk_start + timedelta(days=6), end)
        s, sim, per = window(wk_start, wk_end)
        weekly.append({"week": wk_start.isoformat(), "spend": round(s, 2),
                       "sim_days": sim, "cost_per_sim_day": per})
        wk_start += timedelta(days=7)

    return {
        "entries": len(rows),
        "span": [days[0].isoformat(), end.isoformat()],
        "spend_total": round(spend_total, 2),
        "sim_days_total": sim_total,
        "cost_per_sim_day": (round(spend_total / sim_total, 4)
                             if sim_total > 0 else None),
        "trailing_7d": {"spend": round(w7[0], 2), "sim_days": w7[1],
                        "cost_per_sim_day": w7[2]},
        "by_category": {k: round(v, 2) for k, v in sorted(by_cat.items())},
        "mod_hours_logged": round(sum(r["value"] for r in rows
                                     if r["kind"] == "mod_hours"), 2),
        "weekly": weekly,
    }


def cmd_report(a):
    try:
        rows = load(a.ledger)
    except FileNotFoundError:
        print(f"# ledger not found: {a.ledger}", file=sys.stderr)
        print("Start one:  python3 tools/cost_ledger.py add cost 12.00 "
              "hosting \"vps month\"", file=sys.stderr)
        return 1
    r = report(rows, a.rate)
    if a.json:
        print(json.dumps(r, indent=2))
        return 0
    if r["entries"] == 0:
        print("Ledger is empty.")
        return 0
    print(f"=== Real World — cost per simulated day "
          f"({r['span'][0]} → {r['span'][1]}) ===")
    print(f"  entries            {r['entries']}")
    print(f"  spend total        ${r['spend_total']:.2f}")
    for cat, v in r["by_category"].items():
        print(f"    {cat:<16} ${v:.2f}")
    if r["mod_hours_logged"]:
        print(f"  moderation hours   {r['mod_hours_logged']}h "
              f"(rated at ${a.rate:.2f}/h)")
    print(f"  sim-days total     {r['sim_days_total']:g}")
    cps = r["cost_per_sim_day"]
    print(f"  cost / sim-day     "
          + (f"${cps:.4f}" if cps is not None
             else "n/a — no sim_days rows yet (game-track number)"))
    t7 = r["trailing_7d"]
    print(f"  trailing 7d        ${t7['spend']:.2f} / {t7['sim_days']:g} "
          f"sim-days = "
          + (f"${t7['cost_per_sim_day']:.4f}/day"
             if t7["cost_per_sim_day"] is not None else "n/a"))
    print("\nWeekly trend:")
    for w in r["weekly"]:
        per = (f"${w['cost_per_sim_day']:.4f}"
               if w["cost_per_sim_day"] is not None else "   n/a")
        print(f"  {w['week']}  spend ${w['spend']:>8.2f}  "
              f"sim-days {w['sim_days']:>6g}  {per}/sim-day")
    print("\n§17 decision-log line:")
    print(f"  cost/sim-day = "
          + (f"${cps:.4f}" if cps is not None else "___")
          + f"  (spend ${r['spend_total']:.2f} over "
            f"{r['sim_days_total']:g} sim-days, "
            f"{r['span'][0]} → {r['span'][1]})")
    return 0


def cmd_add(a):
    if a.kind not in VALID_KINDS:
        print(f"# kind must be one of {sorted(VALID_KINDS)}",
              file=sys.stderr)
        return 2
    d = a.date or date.today().isoformat()
    try:
        date.fromisoformat(d)
        v = float(a.value)
    except ValueError:
        print("# bad --date or non-numeric value", file=sys.stderr)
        return 2
    cat = a.category or ("game" if a.kind == "sim_days"
                         else "mod" if a.kind == "mod_hours" else "other")
    line = "\t".join([d, a.kind, f"{v:g}", cat, a.note or ""])
    with open(a.file, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(f"added → {a.file}\n  {line}")
    return 0


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd")

    pr = sub.add_parser("report", help="cost-per-sim-day report")
    pr.add_argument("ledger", nargs="?",
                    default="analytics/cost-ledger.tsv")
    pr.add_argument("--rate", type=float, default=0.0,
                    help="$/hour for mod_hours rows (default 0 — logged, "
                         "unpriced)")
    pr.add_argument("--json", action="store_true")
    pr.set_defaults(fn=cmd_report)

    pa = sub.add_parser("add", help="append a ledger row")
    pa.add_argument("kind", choices=sorted(VALID_KINDS))
    pa.add_argument("value", help="dollars | hours | sim-days")
    pa.add_argument("category", nargs="?", default="")
    pa.add_argument("note", nargs="?", default="")
    pa.add_argument("--file", default="analytics/cost-ledger.tsv")
    pa.add_argument("--date", default="")
    pa.set_defaults(fn=cmd_add)

    a = p.parse_args()
    if not getattr(a, "fn", None):
        a = p.parse_args(["report"] + sys.argv[1:])
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())
