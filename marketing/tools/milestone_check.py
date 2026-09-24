#!/usr/bin/env python3
"""milestone_check.py — which milestone posts are unlocked right now?

Reads social/milestones.json (the trigger table for
social/drafts/milestone-posts.md) and a counters snapshot, then reports
which milestone posts the real numbers currently unlock.

LOCAL ONLY. This tool prints a report; it never posts, schedules, or
contacts anything.

Counters come from the live feed/analytics once those exist; until then,
pass a hand-filled JSON file or --set flags for a dry run.

Usage:
  python3 tools/milestone_check.py --check                       # lint the table
  python3 tools/milestone_check.py --show --counters c.json      # unlocked report
  python3 tools/milestone_check.py --show --set requests_filed=1042 --set watchers_peak=87
  python3 tools/milestone_check.py --show --counters c.json --fired M1,M2
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TABLE = ROOT / "social" / "milestones.json"
DRAFTS = ROOT / "social" / "drafts"
DRAFT_FILE = "milestone-posts.md"

OPS = {">=": lambda a, b: a >= b, "<=": lambda a, b: a <= b,
       ">": lambda a, b: a > b, "<": lambda a, b: a < b,
       "==": lambda a, b: a == b}


def load_table():
    return json.loads(TABLE.read_text())


def validate(table):
    errors, warns = [], []
    seen = set()
    counters = set(table.get("counter_sources", {}))
    draft_path = DRAFTS / DRAFT_FILE
    draft_text = draft_path.read_text() if draft_path.exists() else ""
    for m in table["milestones"]:
        mid = m.get("id", "?")
        if mid in seen:
            errors.append(f"{mid}: duplicate id")
        seen.add(mid)
        w = m.get("when")
        if not w or w.get("op") not in OPS:
            errors.append(f"{mid}: missing/bad when.op")
            continue
        if w["counter"] not in counters:
            errors.append(f"{mid}: counter '{w['counter']}' not declared "
                          "in counter_sources")
        if not re.search(rf"\*\*{re.escape(mid)}\b", draft_text):
            errors.append(f"{mid}: no '**{mid} —' entry in "
                          f"social/drafts/{DRAFT_FILE}")
        if m.get("fires") == "at-thresholds" and "thresholds" not in m:
            errors.append(f"{mid}: fires=at-thresholds but no thresholds list")
        if not m.get("channels"):
            warns.append(f"{mid}: no channels listed")
    return errors, warns


def unlocked(table, counters, fired):
    out = []
    for m in table["milestones"]:
        w = m["when"]
        val = counters.get(w["counter"])
        if val is None:
            out.append((m["id"], "NO-DATA", f"counter '{w['counter']}' unset"))
            continue
        if m["id"] in fired and m["fires"] == "once":
            out.append((m["id"], "FIRED", "already posted (fires once)"))
            continue
        hit = OPS[w["op"]](val, w["value"])
        if hit and m.get("min_days_since_launch"):
            dsl = counters.get("days_since_launch")
            if dsl is None or dsl < m["min_days_since_launch"]:
                hit = False
        if hit and m.get("thresholds"):
            hit = any(val >= t and f"{m['id']}@{t}" not in fired
                      for t in m["thresholds"])
        if hit:
            note = f"{w['counter']}={val} {w['op']} {w['value']}"
            if m.get("hold_until"):
                note += f" — HOLD until {m['hold_until']}"
            if m.get("owner_gate"):
                note += " — OWNER-GATED"
            out.append((m["id"], "UNLOCKED", note))
        else:
            out.append((m["id"], "locked", f"{w['counter']}={val} vs "
                       f"{w['op']} {w['value']}"))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="validate milestones.json against the draft file")
    ap.add_argument("--show", action="store_true",
                    help="print the unlock report")
    ap.add_argument("--counters", type=Path,
                    help="JSON file of counter values")
    ap.add_argument("--set", action="append", default=[], metavar="K=N",
                    help="set a counter by hand (repeatable)")
    ap.add_argument("--fired", default="",
                    help="comma-separated ids/threshold-keys already posted")
    args = ap.parse_args()

    table = load_table()
    errors, warns = validate(table)
    for w in warns:
        print(f"WARN  {w}")
    for e in errors:
        print(f"FAIL  {e}")

    if args.check or not args.show:
        print(f"\n{len(table['milestones'])} milestones · "
              f"{len(errors)} fail · {len(warns)} warn")
        return 1 if errors else 0

    counters = {}
    if args.counters:
        counters = json.loads(args.counters.read_text())
    for kv in args.set:
        k, _, v = kv.partition("=")
        counters[k.strip()] = float(v)
    fired = {s.strip() for s in args.fired.split(",") if s.strip()}

    print("Milestone unlock report (LOCAL ONLY — nothing posts)\n")
    for mid, state, note in unlocked(table, counters, fired):
        print(f"  {mid:<4} {state:<9} {note}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
