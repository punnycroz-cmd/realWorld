#!/usr/bin/env python3
"""thread_check.py — the open-loops ledger checker.

Reads social/threads.json (the registry behind the-call.md and
choice-and-consequence.md) and reports the state of every story thread:
which need a Call, which Calls owe a follow-up, which resolved threads
are Choice -> Consequence candidates, and the audience scoreboard.

LOCAL ONLY. This tool prints a report; it never posts, schedules, or
contacts anything.

Usage:
  python3 tools/thread_check.py --check                 # validate the ledger
  python3 tools/thread_check.py --report                # pipeline report
  python3 tools/thread_check.py --report --today 2026-10-10
  python3 tools/thread_check.py --report --threads social/threads.example.json
"""
import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEDGER = ROOT / "social" / "threads.json"

STATUS = {"open", "resolved", "stale", "closed-quiet"}
TONES = {"kindness", "competence", "conflict", "humor", "mixed"}
CALL_DRAFTS = {"TC1", "TC2", "TC3", "TC4", "TC5", None}
FU_DRAFTS = {"TF-yes", "TF-no", "TF-wild", None}
CC_DRAFTS = {"CC1", "CC2", "CC3", "CC4", "CC5", "CC6", None}
SOURCE_RE = re.compile(r"^(observed|request:rq-\w+|viewer-clip:.+)$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
STALE_DAYS = 14
POLL_MAX_DAYS = 2  # calls live 48h max per the-call.md production notes


def parse_date(s):
    if not s or not DATE_RE.match(str(s)):
        return None
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def validate(threads):
    errors, warns = [], []
    seen = set()
    for t in threads:
        tid = t.get("id", "?")
        if tid in seen:
            errors.append(f"{tid}: duplicate id")
        seen.add(tid)
        for field in ("id", "title", "residents", "opened", "source",
                      "status", "tone", "thread_url"):
            if field not in t:
                errors.append(f"{tid}: missing field '{field}'")
        if t.get("status") not in STATUS:
            errors.append(f"{tid}: bad status {t.get('status')!r}")
        if t.get("tone") not in TONES:
            errors.append(f"{tid}: bad tone {t.get('tone')!r}")
        if not SOURCE_RE.match(str(t.get("source", ""))):
            errors.append(f"{tid}: bad source {t.get('source')!r} — "
                          "observed | request:rq-<id> | viewer-clip:<h>")
        if parse_date(t.get("opened")) is None:
            errors.append(f"{tid}: opened not YYYY-MM-DD")
        url = t.get("thread_url")
        if not (isinstance(url, str) and url.startswith("http")):
            errors.append(f"{tid}: no feed permalink — the permalink is "
                          "the 'that's scripted' rebuttal; no url, no post")

        call = t.get("call") or {}
        res = t.get("resolution") or {}
        cc = t.get("cc_pair") or {}
        if call.get("draft") not in CALL_DRAFTS:
            errors.append(f"{tid}: call.draft {call.get('draft')!r} "
                          "not TC1-TC5")
        if res.get("followup_draft") not in FU_DRAFTS:
            errors.append(f"{tid}: followup_draft "
                          f"{res.get('followup_draft')!r} not TF-*")
        if cc.get("draft") not in CC_DRAFTS:
            errors.append(f"{tid}: cc_pair.draft {cc.get('draft')!r} "
                          "not CC1-CC6")

        if call.get("posted"):
            if not call.get("post_url"):
                errors.append(f"{tid}: call.posted without post_url")
            if parse_date(call.get("posted_date")) is None:
                errors.append(f"{tid}: call.posted without posted_date")
        if t.get("status") == "resolved":
            if parse_date(res.get("resolved_date")) is None:
                errors.append(f"{tid}: resolved without resolved_date")
            if not res.get("evidence_url"):
                errors.append(f"{tid}: resolved without evidence_url — "
                              "a consequence we can't cite didn't happen")
        if res.get("followup_posted") and not res.get("followup_url"):
            errors.append(f"{tid}: followup_posted without followup_url")
        if cc.get("posted"):
            if t.get("status") != "resolved":
                errors.append(f"{tid}: C->C posted on unresolved thread — "
                              "the consequence must exist first")
            if not cc.get("post_url"):
                errors.append(f"{tid}: cc_pair.posted without post_url")
        # soft: stale should still be technically open-past-window
        if t.get("status") == "closed-quiet" and call.get("posted"):
            warns.append(f"{tid}: a called thread closed quiet — consider "
                         "an honesty follow-up ('the block didn't answer')")
    return errors, warns


def report(threads, today):
    fails, warns, info = [], [], []
    score_yes = score_no = 0
    cc_kind = cc_conflict = 0
    for t in threads:
        tid = t.get("id", "?")
        st = t.get("status")
        call = t.get("call") or {}
        res = t.get("resolution") or {}
        cc = t.get("cc_pair") or {}
        opened = parse_date(t.get("opened"))
        age = (today - opened).days if opened else None

        if st == "resolved" and call.get("posted") \
                and not res.get("followup_posted"):
            fails.append(f"{tid}: BROKEN PROMISE — Call posted, thread "
                         "resolved, no follow-up post (the-call.md: an "
                         "unanswered Call is a broken promise)")
        if st == "open":
            if not call.get("posted"):
                info.append(f"{tid}: open, no Call yet — candidate for "
                            "the-call.md" +
                            (f" ({age}d old)" if age is not None else ""))
            elif call.get("deadline"):
                dl = parse_date(call["deadline"])
                if dl and today > dl:
                    warns.append(f"{tid}: poll deadline {call['deadline']} "
                                 "passed, thread still open — close the "
                                 "poll wording ('no deadline' next time) "
                                 "or post an interim")
            if age is not None and age > STALE_DAYS:
                warns.append(f"{tid}: open {age}d > {STALE_DAYS}d — "
                             "revisit weekly or mark 'stale'/'closed-quiet' "
                             "(window honesty rule)")
        if st == "resolved" and res.get("followup_posted") \
                and not cc.get("posted"):
            info.append(f"{tid}: resolved + follow-up posted — eligible "
                        "for a Choice -> Consequence pair (verified, both "
                        "halves on the feed)")
        if call.get("audience_right") is True:
            score_yes += 1
        elif call.get("audience_right") is False:
            score_no += 1
        if cc.get("posted"):
            if t.get("tone") == "conflict":
                cc_conflict += 1
            else:
                cc_kind += 1
    if cc_conflict > cc_kind:
        warns.append(f"C->C ratio off: {cc_conflict} conflict pairs vs "
                     f"{cc_kind} kind/competent/humor — the direction "
                     "wants >=1 non-conflict pair per conflict pair")
    if score_yes + score_no:
        info.append(f"scoreboard: the audience is {score_yes}-{score_no} "
                    "against the block")
    return fails, warns, info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true",
                    help="validate the ledger only")
    ap.add_argument("--report", action="store_true",
                    help="pipeline report")
    ap.add_argument("--threads", type=Path, default=LEDGER,
                    help="ledger file (default social/threads.json)")
    ap.add_argument("--today", default=date.today().isoformat(),
                    help="override 'today' (YYYY-MM-DD) for stale checks")
    args = ap.parse_args()

    data = json.loads(args.threads.read_text())
    threads = data.get("threads", [])
    today = parse_date(args.today) or date.today()

    errors, warns = validate(threads)
    for w in warns:
        print(f"WARN  {w}")
    for e in errors:
        print(f"FAIL  {e}")

    if args.check or (not args.report):
        print(f"\nthread_check: {len(threads)} threads · "
              f"{len(errors)} fail · {len(warns)} warn")
        return 1 if errors else 0

    fails, rwarns, info = report(threads, today)
    for w in rwarns:
        print(f"WARN  {w}")
    for f in fails:
        print(f"FAIL  {f}")
    print("\nThread pipeline report (LOCAL ONLY — nothing posts)\n")
    by_status = {}
    for t in threads:
        by_status[t.get("status")] = by_status.get(t.get("status"), 0) + 1
    print("  status: " + (", ".join(f"{k}={v}" for k, v in
                                   sorted(by_status.items())) or "none"))
    for line in info:
        print(f"  ->    {line}")
    print(f"\nthread_check: {len(threads)} threads · "
          f"{len(errors) + len(fails)} fail · "
          f"{len(warns) + len(rwarns)} warn")
    return 1 if (errors or fails) else 0


if __name__ == "__main__":
    sys.exit(main())
