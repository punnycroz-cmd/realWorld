#!/usr/bin/env python3
"""social_check.py — automate the SOCIAL-LAUNCH-PLAN §8 pre-send checklist.

Scans social/drafts/*.md (and SOCIAL-LAUNCH-PLAN.md) for the accuracy
rules every post must pass before queueing.

Draft post bodies are contiguous `>`-quoted blocks — the copy that would
actually be posted. Everything else is metadata/rules/notes.

FAIL (exit 1):
  * real SF business names anywhere (parody names only — canon:
    world/parody-names.json; this denylist is the famous-Mission set
    that must never appear, even in notes)
  * season-one spoiler leak: Marisol + Mission Unfiltered/author in the
    same post body
  * banned voice words inside a post body ("revolutionary",
    "immersive", "AI-powered", ...)

WARN (exit 0 if no FAILs):
  * cut/never-promise features named inside a post body — often fine
    ("no cash-out" is our best sentence) but must be a human decision
  * post body over its channel's character limit (trim or split at send)
  * 'coming soon' anywhere — prefer dated wording
  * links without UTM parameters
  * a per-file count of fill-at-send {{PLACEHOLDER}} tokens
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DRAFTS = ROOT / "social" / "drafts"
PLAN = ROOT / "SOCIAL-LAUNCH-PLAN.md"

BANNED_WORDS = [
    r"\brevolutionary\b", r"\bimmersive\b", r"\bgroundbreaking\b",
    r"\bnext[- ]gen\b", r"\bgame[- ]changer\b", r"\bAI-powered\b",
]

# Famous real Mission/SF businesses that must never appear (parody only).
# Keep synced with world/businesses.md parody targets.
REAL_BUSINESSES = [
    "Philz", "Tartine", "La Taqueria", "Bi-Rite", "Ritual Coffee",
    "Four Barrel", "Delfina", "Foreign Cinema", "Mission Chinese",
    "El Farolito", "Trick Dog", "Papalote", "Puerto Alegre",
    "Pancho Villa", "Taqueria Cancun", "Gracias Madre", "Precita Eyes",
    "La Victoria", "Arinell", "Dolores Park Cafe",
]

CUT_FEATURES = [
    r"\bvoice (chat|acting|over)\b", r"\bTTS\b", r"\btext-to-speech\b",
    r"\bcash[- ]?out\b", r"\breal money (out|earn|payout)\b",
    r"\bloot ?box", r"\bplay[- ]to[- ]earn\b", r"\bNFT\b",
    r"\bpossess (a |the )?(main|cast|any)\b",
    r"\bpossess anyone\b", r"\bcontrol any (character|resident)\b",
]

# Marisol is the anonymous author — co-mention in one post body = leak.
SPOILER_PAIR = (re.compile(r"\bMarisol\b", re.I),
                re.compile(r"Mission Unfiltered|anonymous author|"
                           r"writing about (all of )?them|wrote the blog", re.I))

CHAR_LIMITS = {
    "x": 280, "bluesky": 300, "tiktok": 2200, "shorts": 2200,
}

URL_RE = re.compile(r"https?://[^\s)>]+")
PLACEHOLDER_RE = re.compile(r"\{\{[A-Z_/]+\}\}")


def post_blocks(text):
    """Yield (start_lineno, body) for each contiguous '>' block."""
    block, start = [], None
    for i, line in enumerate(text.splitlines(), 1):
        if line.lstrip().startswith(">"):
            if start is None:
                start = i
            block.append(line.lstrip()[1:].strip())
        elif block:
            yield start, " ".join(block)
            block, start = [], None
    if block:
        yield start, " ".join(block)


def channel_of(text, path):
    """Strictest declared channel from the file's Channel: header/stem."""
    head = text[:800].lower()
    m = re.search(r"channel[s]?:\s*(.+)", head)
    decl = (m.group(1) if m else "") + " " + path.stem.lower()
    for ch in ("x", "twitter", "bluesky", "bsky", "tiktok", "shorts"):
        if re.search(rf"\b{ch}\b", decl):
            return {"twitter": "x", "bsky": "bluesky"}.get(ch, ch)
    return None


def main():
    fails, warns = [], []

    files = sorted(DRAFTS.glob("*.md"))
    if PLAN.exists():
        files.append(PLAN)

    for path in files:
        rel = path.relative_to(ROOT)
        text = path.read_text(encoding="utf-8")
        chan = channel_of(text, path)

        for i, line in enumerate(text.splitlines(), 1):
            for name in REAL_BUSINESSES:
                if re.search(rf"\b{re.escape(name)}\b", line):
                    fails.append(f"{rel}:{i} real SF business name: {name!r}")
            if re.search(r"\bcoming soon\b", line, re.I):
                warns.append(f"{rel}:{i} 'coming soon' — prefer dated wording")

        for start, body in post_blocks(text):
            for pat in BANNED_WORDS:
                if re.search(pat, body, re.I):
                    fails.append(f"{rel}:{start} banned voice word /{pat}/ in post")
            if SPOILER_PAIR[0].search(body) and SPOILER_PAIR[1].search(body):
                fails.append(f"{rel}:{start} spoiler leak: Marisol + "
                             "Mission Unfiltered/author in one post")
            for pat in CUT_FEATURES:
                if re.search(pat, body, re.I):
                    warns.append(f"{rel}:{start} cut-feature term /{pat}/ "
                                 "in post — confirm it's a denial, not a promise")
            if chan and len(body) > CHAR_LIMITS[chan]:
                warns.append(f"{rel}:{start} post is {len(body)} chars — "
                             f"{chan} limit {CHAR_LIMITS[chan]}, split or trim")
            for m in URL_RE.finditer(body):
                if "utm_source=" not in m.group(0):
                    warns.append(f"{rel}:{start} link without UTM: "
                                 f"{m.group(0)[:60]}")

        n_ph = len(PLACEHOLDER_RE.findall(text))
        if n_ph:
            warns.append(f"{rel}: {n_ph} fill-at-send {{{{PLACEHOLDER}}}} tokens")

    for w in warns:
        print(f"WARN  {w}")
    for f in fails:
        print(f"FAIL  {f}")
    print(f"\nsocial_check: {len(fails)} fail / {len(warns)} warn "
          f"across {len(files)} files")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
