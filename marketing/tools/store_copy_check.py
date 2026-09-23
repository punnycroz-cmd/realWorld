#!/usr/bin/env python3
"""store_copy_check.py — validate STORE-COPY.md before any submission.

Checks, all derived from the doc itself (no external state):
  1. Tagline char counts in §1.1 table match the actual string lengths.
  2. §1.2 short description recomputes to its claimed length and fits
     both itch (~256) and Steam (300) limits.
  3. §13 A/B variant char counts match actual lengths.
  4. §10 Product Hunt field char counts match actual lengths.
  5. Every "Done" capsule file in §4 exists under store/capsules/
     (or the referenced path).
  6. §5 disclosure matrix still contains the required rows (in-app
     purchases, subscription, ads, loot boxes=NO, cash-out=NO,
     moderated UGC, AI disclosure).
  7. Marketing-tone ban list never appears in store copy text
     (revolutionary, addictive, guaranteed, #1, best-in-class,
     groundbreaking, "free money").

Usage: python3 tools/store_copy_check.py
Exit 0 = clean. Exit 1 = one or more FAIL lines.
Run before: any store submission (STORE-COPY.md §9 step 9),
any art refresh, any copy edit touching §1/§10/§13.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOC = ROOT / "STORE-COPY.md"

fails = []
warns = []


def ok(msg):
    print(f"  ok   {msg}")


def fail(msg):
    fails.append(msg)
    print(f"  FAIL {msg}")


def warn(msg):
    warns.append(msg)
    print(f"  warn {msg}")


def section(text, header_re):
    """Return the text of the ## section whose heading matches header_re."""
    m = re.search(header_re, text, re.M)
    if not m:
        return None
    start = m.end()
    nxt = re.search(r"^#{2,4} ", text[start:], re.M)
    return text[start:start + nxt.start()] if nxt else text[start:]


def main():
    if not DOC.exists():
        print(f"FAIL {DOC} missing")
        return 1
    doc = DOC.read_text(encoding="utf-8")

    # --- 1. §1.1 tagline table: | tagline | chars | use |
    s = section(doc, r"^### 1\.1")
    n = 0
    for row in re.findall(r"^\|(.+)\|$", s, re.M):
        cells = [c.strip() for c in row.strip("|").split("|")]
        if len(cells) != 3 or not cells[1].isdigit():
            continue
        tagline, claimed = cells[0], int(cells[1])
        actual = len(tagline)
        n += 1
        if actual == claimed:
            ok(f"tagline len {actual} == {claimed}: {tagline[:40]!r}")
        else:
            fail(f"tagline len {actual} != {claimed}: {tagline[:40]!r}")
    if n == 0:
        fail("§1.1 tagline table parsed 0 rows")

    # --- 2. §1.2 short description: first blockquote line(s)
    s = section(doc, r"^### 1\.2")
    body = " ".join(
        ln.lstrip("> ").rstrip() for ln in s.splitlines()
        if ln.strip().startswith(">")
    ).strip()
    # strip trailing parenthetical claims like "(222 chars incl. spaces...)"
    body = re.sub(r"\s*\(\d+ chars.*$", "", body).strip()
    m = re.search(r"\((\d+) chars", s)
    claimed = int(m.group(1)) if m else None
    actual = len(body)
    if claimed and actual != claimed:
        fail(f"§1.2 short desc len {actual} != claimed {claimed}")
    elif claimed:
        ok(f"§1.2 short desc len {actual} == {claimed}")
    else:
        warn("§1.2 short desc: no claimed char count found")
    if actual > 256:
        fail(f"§1.2 short desc {actual} > 256 (itch limit)")

    # --- 3. §13 A/B variants: | label | hook | text | chars |
    s = section(doc, r"^## 13\.")
    n = 0
    for row in re.findall(r"^\|(.+)\|$", s, re.M):
        cells = [c.strip() for c in row.strip("|").split("|")]
        if len(cells) != 4 or not cells[3].isdigit():
            continue
        text, claimed = cells[2], int(cells[3])
        actual = len(text)
        n += 1
        if actual == claimed:
            ok(f"§13 variant {cells[0][:24]!r} len {actual}")
        else:
            fail(f"§13 variant {cells[0][:24]!r} len {actual} != {claimed}")
        if actual > 256:
            fail(f"§13 variant {cells[0][:24]!r} exceeds 256")
    if n == 0:
        fail("§13 A/B table parsed 0 rows")

    # --- 4. §10 Product Hunt fields with (NN) counts
    s = section(doc, r"^## 10\.")
    n = 0
    for row in re.findall(r"^\|(.+)\|$", s, re.M):
        cells = [c.strip() for c in row.strip("|").split("|")]
        if len(cells) != 3:
            continue
        draft = cells[2]
        m = re.search(r"\((\d+)\)\s*$", draft)
        if not m:
            continue
        claimed = int(m.group(1))
        text = re.sub(r"\s*\(\d+\)\s*$", "", draft).strip("` ")
        actual = len(text)
        n += 1
        if actual == claimed:
            ok(f"§10 {cells[0]} len {actual} == {claimed}")
        else:
            fail(f"§10 {cells[0]} len {actual} != {claimed}")
    if n == 0:
        warn("§10 Product Hunt table: no counted fields found")

    # --- 5. §4 "Done" capsule rows -> files exist
    s = section(doc, r"^## 4\.")
    n = 0
    for path in re.findall(r"`((?:store|press-kit|site)/[^`]+?)`", s):
        n += 1
        if ".." in path:
            # letter-range shorthand like v50-A..D — expand and require
            # every letter to exist under some image extension
            m = re.match(r"^(.*?)([A-Z])\.\.([A-Z])$", path)
            if not m:
                warn(f"range asset unparsed: {path}")
                continue
            base, a, b = m.groups()
            missing = [
                ch for ch in range(ord(a), ord(b) + 1)
                if not any((ROOT / f"{base}{chr(ch)}{ext}").exists()
                           for ext in ("", ".png", ".webp", ".jpg"))
            ]
            if missing:
                fail(f"asset range incomplete: {path} "
                     f"(missing {''.join(map(chr, missing))})")
            else:
                ok(f"asset range complete: {path}")
        elif (ROOT / path).exists():
            ok(f"asset exists: {path}")
        elif "*" in path:
            warn(f"glob asset unchecked: {path}")
        else:
            fail(f"asset missing: {path}")
    if n == 0:
        fail("§4 asset table parsed 0 paths")

    # --- 6. §5 disclosure matrix required rows
    s = section(doc, r"^## 5\.")
    required = {
        "in-app purchases": r"[Ii]n-app purchases",
        "subscription": r"[Ss]ubscription",
        "ads": r"[Aa]ds",
        "loot boxes = NO": r"[Ll]oot boxes[^\n]*\|\s*NO",
        "cash-out = NO": r"[Cc]ash-out[^\n]*\|\s*NO",
        "moderated UGC": r"[Uu]ser-generated text",
        "AI disclosure": r"AI-generated content",
    }
    for label, pat in required.items():
        if re.search(pat, s):
            ok(f"disclosure row present: {label}")
        else:
            fail(f"disclosure row missing: {label}")

    # --- 7. banned marketing tone (whole doc — these words have no
    # legitimate use in this file at all)
    banned = [r"revolutionary", r"addictive", r"guaranteed", r"#1\b",
              r"best-in-class", r"groundbreaking", r"free money",
              r"game[- ]changer", r"mind-blowing"]
    low = doc.lower()
    for w in banned:
        if re.search(w, low):
            fail(f"banned marketing word present: {w!r}")

    print(f"\n{len(fails)} fail / {len(warns)} warn — {DOC.name}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
