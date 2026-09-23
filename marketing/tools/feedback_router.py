#!/usr/bin/env python3
"""Real World — community feedback batch → shared-inbox entry router.

Implements COMMUNITY-FUNNEL.md §7 steps 2–3: takes a sanitized feedback
batch (markdown bullets, one per line) and emits a ready-to-paste
`## [marketing-community | ...]` entry for devin-reviews/sf-shared-inbox.md,
grouped by the track that owns each item. Local only — prints to stdout;
the owner pastes, the tool never appends.

Input format (see community/feedback-batch.template.md):

    - bug | <one-line, no handles/PII>
    - balance | ...
    - content-wish | ...
    - moderation-issue | ...
    - faq | <recurring question worth adding to site/faq.html>

Anything else on a bullet, or malformed lines, lands in UNROUTED for a
human to sort. Duplicates collapse with a ×N count.

Usage:
    python3 marketing/tools/feedback_router.py batch.md
    python3 marketing/tools/feedback_router.py batch.md --date 2026-09-30
"""
import argparse
import re
import sys
from collections import Counter, OrderedDict
from datetime import date

TAG_TO_TRACK = OrderedDict([
    ("bug", "game-systems"),
    ("balance", "game-systems"),
    ("content-wish", "world-builder"),
    ("moderation-issue", "owner-review"),
    ("faq", "marketing/site"),
])
TAGS = "|".join(TAG_TO_TRACK)
LINE = re.compile(rf"^\s*-\s*({TAGS})\s*\|\s*(.+?)\s*$")


def parse(path):
    routed = {t: Counter() for t in TAG_TO_TRACK}
    unrouted = []
    with open(path, encoding="utf-8") as f:
        for i, raw in enumerate(f, 1):
            m = LINE.match(raw)
            if m:
                routed[m.group(1)][m.group(2)] += 1
            elif raw.lstrip().startswith("-") and not raw.strip().startswith("---"):
                unrouted.append((i, raw.strip()))
    return routed, unrouted


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("batch", help="sanitized feedback batch (.md)")
    ap.add_argument("--date", default=date.today().isoformat())
    args = ap.parse_args()

    routed, unrouted = parse(args.batch)

    n_items = sum(sum(c.values()) for c in routed.values()) + len(unrouted)
    print(f"## [marketing-community | {args.date}]")
    print(f"- Touched: none (feedback route only — {n_items} sanitized items"
          " from community surfaces; handles/PII stripped at collection)")
    print("- Renamed/moved/deleted: none")
    print("- New APIs/hooks the other tracks may use: none")
    print("- Assumptions about the other tracks' code: none")

    by_track = OrderedDict()
    for tag, track in TAG_TO_TRACK.items():
        for text, n in routed[tag].items():
            by_track.setdefault(track, []).append((tag, text, n))

    if by_track:
        print("- Feedback for tracks:")
        for track, items in by_track.items():
            print(f"  - TO {track}:")
            for tag, text, n in items:
                suffix = f" (×{n} reports)" if n > 1 else ""
                print(f"    - [{tag}] {text}{suffix}")
    if unrouted:
        print("  - UNROUTED (needs a human to classify):")
        for i, line in unrouted:
            print(f"    - line {i}: {line}")
    print("- Merge notes: none — informational entry only.")
    print()
    if unrouted:
        print(f"# warn: {len(unrouted)} unrouted line(s)", file=sys.stderr)
    if n_items == 0:
        print("# warn: no feedback items found — is this the right file?",
              file=sys.stderr)


if __name__ == "__main__":
    main()
