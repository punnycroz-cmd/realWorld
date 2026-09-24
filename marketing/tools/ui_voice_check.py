#!/usr/bin/env python3
"""UI-voice check — the mechanical half of UI-VOICE.md.

Marketing pages, templates, and social drafts quote the product's own
strings (status chips, feed lines, lifecycle lists). This gate makes sure
those quotes stay verbatim and stay in register.

Checks:
  1. Every "·"-joined status sequence (2+ tokens) in covered files uses
     only canonical feed_vocabulary tokens — catches invented/softened
     statuses ("pending", "denied by staff") in quoted product strings.
  2. Apology/hype words and exclamation marks may not share a line with a
     status token (R3/R5/R7 — decline is an ending, not an error).
  3. site/js/demo-sim.js STATUS_CLS keys ⊆ canonical vocab — simulated
     feed rows obey the same register (UI-VOICE.md §3).
  4. Title-cased status chips: a covered file rendering a canonical token
     in Title Case inside a chip-ish context (tag-, chip, class=) fails —
     chips are lowercase verbatim (R2).

Exempt: UI-VOICE.md and brand.html (quote off-voice examples deliberately),
MARKETINGLOG.md and inbox/ledger files outside marketing/.

Canonical set is synced by hand from world/requests.json feed_vocabulary
(+ spec compounds: 'resolved · declined', 'denied'→'not approved · nothing
billed', 'booked' v88). When a new status ships, update CANONICAL here and
UI-VOICE.md §1 in the same commit.

Run: python3 marketing/tools/ui_voice_check.py   (exit 0 = clean)
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

# Synced from world/requests.json → feed_vocabulary + spec compounds.
CANONICAL = {
    "requested", "in_review", "approved", "approved (modified)",
    "running", "queued", "booked", "resolved", "declined",
    "refunded", "not approved", "denied", "admin action",
    "player session ended", "nothing billed", "watching",
}

# Feed event-kind labels — a "<kind> · <status>" chip leads with one of
# these (world/feed.json `kind` field). Legal only as the first token.
KIND = {"request", "event", "nudge", "weather", "offer", "invite",
        "landing", "admin", "offer_posted"}

# Apology / hype / pressure words that must not sit next to a status (R3/R7).
SOFTENERS = re.compile(
    r"\b(sorry|apolog|unfortunately|sadly|oops|uh-oh|whoops|success|"
    r"congrat|better luck|try again|failed|failure)\b", re.I)

# A "·"-joined run of status-ish tokens (lowercase words, parens, spaces).
SEQ_RX = re.compile(r"[a-z][a-z_ ()]*(?:·\s*[a-z][a-z_ ()]*)+")

fails, warns = [], []


def fail(msg):
    fails.append(msg)
    print(f"FAIL  {msg}")


def warn(msg):
    warns.append(msg)
    print(f"warn  {msg}")


def ok(msg):
    print(f"ok    {msg}")


COVERED = (
    sorted(glob.glob(os.path.join(SITE, "*.html"))) +
    sorted(glob.glob(os.path.join(ROOT, "templates", "**", "*.*"),
                     recursive=True)) +
    sorted(glob.glob(os.path.join(ROOT, "social", "drafts", "*.md")))
)
EXEMPT = {"brand.html", "README.md"}  # enforcement docs quote banned forms

status_alt = "|".join(sorted((re.escape(s) for s in CANONICAL), key=len,
                             reverse=True))
STATUS_RX = re.compile(r"\b(" + status_alt + r")\b")

for path in COVERED:
    rel = os.path.relpath(path, ROOT)
    if os.path.basename(path) in EXEMPT or not os.path.isfile(path):
        continue
    text = open(path, encoding="utf-8", errors="replace").read()
    # Blank out HTML comments (preserving line numbers) — '<!--' contains
    # '!', and comment examples deliberately quote statuses.
    text = re.sub(r"<!--.*?-->",
                  lambda m: re.sub(r"[^\n]", " ", m.group(0)),
                  text, flags=re.S)

    # 1. ·-joined sequences: every token must be canonical
    for m in SEQ_RX.finditer(text):
        seq = m.group(0).strip()
        toks = [t.strip() for t in seq.split("·")]
        bad = [t for t in toks if t not in CANONICAL]
        if toks and toks[0] in KIND:
            bad = [t for t in bad if t != toks[0]]
        if bad:
            # Sequences like "x · y" that are pure prose (no canonical token
            # at all) are not status lists — only flag when ≥1 canonical
            # token sits in the sequence (drift on a real status list).
            if any(t in CANONICAL for t in toks):
                fail(f"{rel}: non-canonical token(s) {bad} in status "
                     f"sequence {seq!r} (UI-VOICE R2)")

    # 2/4. per-line: softener or '!' beside a status; title-cased chips
    for ln, line in enumerate(text.splitlines(), 1):
        if STATUS_RX.search(line):
            if "!" in line:
                fail(f"{rel}:{ln}: '!' on a line carrying a status token "
                     f"(R5 — no exclamation marks)")
            if SOFTENERS.search(line):
                fail(f"{rel}:{ln}: softener/hype word beside a status "
                     f"(R3/R7 — {SOFTENERS.search(line).group(0)!r})")
        for m in STATUS_RX.finditer(line):
            pass  # lowercase is canonical by definition
        # Title-cased canonical token inside chip markup
        for m in re.finditer(r'class="[^"]*(?:tag|chip)[^"]*"[^>]*>'
                             r'\s*([A-Z][a-z]+(?:\s*\(modified\))?)\s*<',
                             line):
            if m.group(1).lower() in CANONICAL:
                fail(f"{rel}:{ln}: title-cased chip {m.group(1)!r} — "
                     f"chips are lowercase verbatim (R2)")

# 3. demo-sim STATUS_CLS keys ⊆ canonical
sim = os.path.join(SITE, "js", "demo-sim.js")
if os.path.exists(sim):
    body = open(sim, encoding="utf-8").read()
    blk = re.search(r"STATUS_CLS\s*=\s*\{(.*?)\}", body, re.S)
    if blk:
        keys = re.findall(r'"([^"]+)"\s*:', blk.group(1))
        bad = [k for k in keys if k not in CANONICAL]
        if bad:
            fail(f"demo-sim.js STATUS_CLS has non-canonical keys {bad} "
                 f"(UI-VOICE §3)")
        else:
            ok(f"demo-sim STATUS_CLS keys canonical ({len(keys)})")
    else:
        warn("demo-sim.js: STATUS_CLS block not found — check moved?")

print(f"\n{len(fails)} fail / {len(warns)} warn")
sys.exit(1 if fails else 0)
