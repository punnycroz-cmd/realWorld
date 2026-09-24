#!/usr/bin/env python3
"""accuracy_sweep.py — public-copy accuracy gate (G18).

The constitution's ACCURACY RULE: every claim on public surfaces must be
verifiable in the design doc or the shipped product. This tool mechanically
sweeps the copy that ships and flags three classes of violation:

  1. REAL BUSINESS NAMES — every key of world/parody-names.json (the live
     parody map) must never appear in public copy. Multi-word names and
     distinctive single words are FAIL; a small list of ambiguous single
     words (common English) is WARN so a human can read the context.
  2. CUT-FEATURE / CLAIM-RISK TERMS — voice/TTS, cash-out/RMT, loot boxes,
     possession/control of the cast. These are legal in copy ONLY inside a
     negation ("no loot boxes", "can never be possessed"). A match with no
     negation cue on the same line is a WARN — probably fine, must be read.
  3. FABRICATION MARKERS — on site/*.html only: testimonials, "players say",
     named press outlets (invented coverage), star ratings. FAIL — the
     never-do list bans fake quotes outright.

Scope: PUBLIC-FACING copy only — site/*.html, social/drafts/, press-kit/,
STORE-COPY, PRESS-KIT, SOCIAL-LAUNCH-PLAN, PRICING-PAGE-CONTENT,
TRAILER-PLAN, community/, templates/. Internal rule docs (LAUNCH-CHECKLIST,
MODERATION-PLAN, BRAND, ANALYTICS…) legitimately NAME the banned things and
are excluded on purpose.

Usage:  ./tools/accuracy_sweep.py           (from marketing/ or repo root)
Exit:   0 = no FAILs (WARNs allowed), 1 = any FAIL.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLD = "/home/hatch/workspace/world-sim-world/world"

PASS = 0
WARN = 0
FAIL = 0
def ok(m):   global PASS; PASS += 1; print(f"  PASS  {m}")
def warn(m): global WARN; WARN += 1; print(f"  WARN  {m}")
def bad(m):  global FAIL; FAIL += 1; print(f"  FAIL  {m}")

print("=== accuracy sweep (G18) ===")

# ── collect public-copy files ──
FILES = []
site_dir = os.path.join(ROOT, "site")
for f in sorted(os.listdir(site_dir)):
    if f.endswith(".html"):
        FILES.append(("site", os.path.join(site_dir, f)))
for doc in ("STORE-COPY.md", "PRESS-KIT.md", "SOCIAL-LAUNCH-PLAN.md",
            "PRICING-PAGE-CONTENT.md", "TRAILER-PLAN.md", "STORE-COPY.md",
            "COMMUNITY-FUNNEL.md", "CONTENT-STRATEGY.md", "DEMO-PAGE.md",
            "PRESS-OUTREACH.md"):
    p = os.path.join(ROOT, doc)
    if os.path.exists(p):
        FILES.append(("doc", p))
for sub in ("social/drafts", "press-kit", "community", "templates"):
    d = os.path.join(ROOT, sub)
    if os.path.isdir(d):
        for f in sorted(os.listdir(d)):
            if f.endswith((".md", ".html", ".txt")):
                FILES.append((sub, os.path.join(d, f)))

# ── load the live parody map ──
PARODY = {}
try:
    pj = json.load(open(os.path.join(WORLD, "parody-names.json"),
                       encoding="utf-8"))
    PARODY = pj.get("parody_names", {})
except Exception as e:
    warn(f"parody-names.json unreadable ({e}) — real-name check skipped")

# Single-word keys that are also ordinary English words — a plain substring
# match would false-positive, so they get case-sensitive WARN instead of
# case-insensitive FAIL.
AMBIGUOUS = {"chase", "ria", "mixt", "landline", "arcana", "souvla",
             "reformation", "supercuts", "delfina", "teeth", "buddy",
             "smitten", "casements", "beretta", "mosto"}

# ── claim-risk terms: legal only inside a negation ──
CLAIM_TERMS = [
    (r"voiceover|voice act(or|ing)|\bTTS\b|text-to-speech|spoken dialogue|"
     r"voiced? (dialogue|lines)|voice (chat|over)\b|get voice\b",
     "voice/TTS (cut for v1)"),
    (r"cash[ -]?out|\bRMT\b|real[- ]money (trading|cash)|withdraw(al)?|payout",
     "cash-out/RMT (banned)"),
    (r"loot ?box|gacha|paid random|randomi[sz]ed (reward|item|drop)",
     "loot boxes/gacha (banned)"),
    (r"possess|possession|take control|mind[ -]?control|"
     r"control (the|your|any|each) (main|cast|resident|character)",
     "possession/control of the cast (banned for mains)"),
    (r"coming soon|available now|download (now|today)|in stores",
     "availability claim (nothing public exists yet)"),
]
NEGATION = re.compile(
    r"\b(no|never|not|n't|without|cannot|can't|won't|wouldn't|ban(ned|s)?|"
    r"prohibit|cut|defer|refuse|instead of|rather than|free of|none|"
    r"isn't|aren't|don't|doesn't|didn't|nobody|unpossessable)\b|"
    r"only (your|a hired|ever)|your own (hire|character|resident)|"
    r"possess (your own|my|— own)|own (baker|courier|hire|resident)|"
    r"a character you created|redact", re.I)

# Lines that ASK a question or label a section aren't claims — the claim is
# in the answer line, which gets checked on its own.
QUESTIONISH = re.compile(
    r"^\s*(\"name\"\s*:|<summary>|<h[1-6][ >]|##\s|[-*]\s*.{0,80}\?\s*$)")

# ── fabrication markers (site only) ──
FABRIC = [
    (r"testimonial|players (say|are saying)|critics (say|agree)|"
     r"[“\"][^”\"]{12,}[”\"]\s*—\s*[A-Z][a-z]+", "quote/testimonial"),
    (r"\b(IGN|Kotaku|Polygon|Eurogamer|PC ?Gamer|Rock Paper Shotgun|"
     r"GamesRadar|Destructoid|GameSpot)\b", "named press outlet"),
    (r"★|⭐|\b[45]/5 (stars|rating)|rated [45]\b", "star rating"),
]

real_hits = []      # (file, line_no, name)
claim_warns = []    # (file, line_no, rule, line)
fab_hits = []       # (file, line_no, rule)
negated_ok = 0
scanned = 0

for scope, path in FILES:
    try:
        lines = open(path, encoding="utf-8").read().splitlines()
    except OSError:
        continue
    scanned += 1
    rel = os.path.relpath(path, ROOT)
    for i, line in enumerate(lines, 1):
        # real business names
        for real in PARODY:
            if " " in real:
                if re.search(r"(?<![\w-])" + re.escape(real) + r"(?![\w-])",
                             line, re.I):
                    real_hits.append((rel, i, real))
            elif real.lower() in AMBIGUOUS:
                if re.search(r"(?<![\w-])" + re.escape(real) + r"(?![\w-])",
                             line):  # case-sensitive — the parody names differ
                    warn(f"{rel}:{i} ambiguous real-name word '{real}' "
                         f"(parody: {PARODY[real]}) — verify context")
            else:
                if re.search(r"(?<![\w-])" + re.escape(real) + r"(?![\w-])",
                             line, re.I):
                    real_hits.append((rel, i, real))
        # claim-risk terms
        if not QUESTIONISH.match(line):
            for pat, rule in CLAIM_TERMS:
                if re.search(pat, line, re.I):
                    if NEGATION.search(line):
                        negated_ok += 1
                    else:
                        claim_warns.append((rel, i, rule, line.strip()[:100]))
        # fabrication markers — public site pages only
        if scope == "site":
            for pat, rule in FABRIC:
                if re.search(pat, line):
                    fab_hits.append((rel, i, rule))

# ── report ──
ok(f"scanned {scanned} public-copy files")

if real_hits:
    for rel, i, name in real_hits[:15]:
        bad(f"{rel}:{i} REAL business name '{name}' — parody is "
            f"'{PARODY.get(name)}' (parody-names.json)")
    if len(real_hits) > 15:
        bad(f"... +{len(real_hits) - 15} more real-name hits")
else:
    ok(f"0 real business names ({len(PARODY)} parody keys checked)")

if fab_hits:
    for rel, i, rule in fab_hits[:15]:
        bad(f"{rel}:{i} fabrication marker — {rule}")
    if len(fab_hits) > 15:
        bad(f"... +{len(fab_hits) - 15} more fabrication hits")
else:
    ok("0 fabricated-quote / fake-coverage markers on site pages")

if claim_warns:
    seen = set()
    for rel, i, rule, snip in claim_warns:
        key = (rel, rule)
        if key in seen:
            continue
        seen.add(key)
        warn(f"{rel}:{i} {rule} — no negation cue on line: «{snip}»")
    ok(f"{negated_ok} claim-risk mention(s) correctly negated "
       f"({len(seen)} file/rule pair(s) need a human read)")
else:
    ok(f"all claim-risk mentions carry a negation cue ({negated_ok} lines)")

# positive anchor: the possession ban must be disclosed somewhere public
faq = os.path.join(ROOT, "site", "faq.html")
if os.path.exists(faq):
    t = open(faq, encoding="utf-8").read()
    if re.search(r"never", t, re.I) and re.search(r"possess", t, re.I):
        ok("possession-ban disclosure present on faq.html")
    else:
        bad("faq.html no longer discloses the possession ban")

print(f"\naccuracy sweep: {PASS} pass / {WARN} warn / {FAIL} fail")
sys.exit(1 if FAIL else 0)
