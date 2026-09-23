#!/usr/bin/env python3
"""Brand-consistency audit — the mechanical gate for BRAND.md.

Checks:
  1. Every file named in brand-tokens.json (logo.files + banner_files) exists
     in site/assets/.
  2. Palette parity three ways: tokens.json hexes == style.css :root vars ==
     the hex table in BRAND.md §5.
  3. tokens.css (generated) matches the current tokens.json.
  4. press-kit/logos copies are byte-identical to the site/assets masters.
  5. Every site/*.html page links the full icon set: favicon.svg,
     favicon-32.png, apple-touch-icon.png, site.webmanifest, mask-icon.
  6. Site-copy language lint — the mechanical subset of BRAND.md §2 (naming),
     §4 (voice bans), and §10 (accuracy guardrails) applied to every
     site/*.html page: banned product-name forms, hype words, real SF
     business names (parody-only rule), unambiguous control claims, and
     cut-feature promises. brand.html is exempt — it quotes banned forms
     deliberately in the "Never" row.

Exit 0 = clean, 1 = failures. Warnings print but don't fail.
Run: python3 marketing/tools/brand_audit.py
"""
import glob
import hashlib
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")
ASSETS = os.path.join(SITE, "assets")
KIT_LOGOS = os.path.join(ROOT, "press-kit", "logos")

fails, warns = [], []


def fail(msg):
    fails.append(msg)
    print(f"FAIL  {msg}")


def warn(msg):
    warns.append(msg)
    print(f"warn  {msg}")


def ok(msg):
    print(f"ok    {msg}")


def sha(path):
    return hashlib.sha256(open(path, "rb").read()).hexdigest()


# ── Check 6 tables (BRAND.md §2/§4/§10 in lint form) ──────────────────────
# Keep synced with BRAND.md and with tools/social_check.py, which applies
# the same bans to social drafts.

# §2 naming — banned product-name forms. Case-sensitive on purpose:
# the placeholder domain "realworld-game.example" and lowercase
# data-rw-* hooks are legitimate and stay untouched.
BANNED_NAMING = [
    (re.compile(r"\bThe Real World\b"),
     '"The Real World" — leading "The" is banned (MTV trademark collision)'),
    (re.compile(r"\bRealWorld\b"),
     '"RealWorld" — the product is always two words'),
    (re.compile(r"(?<![-\w])RW(?![-\w])"),
     '"RW" — the abbreviation is banned; write "Real World"'),
]

# §4 voice — hype words that must never appear in shipped copy.
BANNED_VOICE = [
    r"\brevolutionary\b", r"\bimmersive\b", r"\bgroundbreaking\b",
    r"\bnext[- ]gen\b", r"\bgame[- ]changer\b", r"\bAI-powered\b",
]

# §10 — famous real Mission/SF businesses (parody names only).
# Synced with social_check.py / world/businesses.md parody targets.
REAL_BUSINESSES = [
    "Philz", "Tartine", "La Taqueria", "Bi-Rite", "Ritual Coffee",
    "Four Barrel", "Delfina", "Foreign Cinema", "Mission Chinese",
    "El Farolito", "Trick Dog", "Papalote", "Puerto Alegre",
    "Pancho Villa", "Taqueria Cancun", "Gracias Madre", "Precita Eyes",
    "La Victoria", "Arinell", "Dolores Park Cafe",
]

# §10 — only unambiguous control claims; legitimate copy says
# "can't be possessed by anyone", "possess your resident", "Can I
# possess the main characters? (No.)" — none of these patterns match those.
CONTROL_CLAIMS = [
    r"\bpossess anyone\b", r"\bcontrol anyone\b", r"\btake control of\b",
    r"\bplay as any\b", r"\bbe anyone\b",
]

# §10 — cut features / banned monetization promises. These legitimately
# appear in NEGATED or QUESTION copy ("No loot boxes", "Can I cash out?
# (No.)", "the rule that blocks trading, cash-out…") — that copy is core
# brand honesty, so a match only fails when no negation/question cue sits
# nearby (70 chars before, 90 after — covers "not for sale" table cells
# and "No …" card bodies following a heading).
CUT_FEATURES = [
    r"\bvoice (chat|acting)\b", r"\bTTS\b", r"\btext-to-speech\b",
    r"\bcash[- ]?out\b", r"\breal money (out|earn|payout)\b",
    r"\bloot ?box", r"\bplay[- ]to[- ]earn\b", r"\bNFT\b",
]
NEGATION_CUE = re.compile(
    r"\b(no|never|not|n't|none|nor|without|blocks?|aren't|isn't|don't|"
    r"can't|won't|off-limits|than)\b|\bcan i\b|\bare there\b|"
    r"\bis (this|it|there)\b", re.I)

# brand.html quotes banned forms deliberately ("Never" row, boilerplate
# examples). Every other page is held to the lint.
LINT_EXEMPT = {"brand.html"}


def main():
    tokens = json.load(open(os.path.join(ASSETS, "brand-tokens.json")))

    # 1. named assets exist
    for group in ("logo", "banner_files"):
        files = tokens[group] if group == "banner_files" else tokens[group]["files"]
        for name in files:
            p = os.path.join(ASSETS, name)
            if os.path.exists(p):
                ok(f"asset exists: {name}")
            else:
                fail(f"tokens.json names missing asset: {name}")

    # 2. palette parity
    tok_hex = {k: c["value"].lower() for k, c in tokens["color"].items()}
    css = open(os.path.join(SITE, "css", "style.css")).read()
    css_vars = dict(re.findall(r"--([a-z0-9-]+):\s*(#[0-9a-f]{6})", css.lower()))
    for k, hexv in tok_hex.items():
        if k == "ink":  # ink is used as literal, not a --var, in style.css
            continue
        if css_vars.get(k) == hexv:
            ok(f"palette parity tokens↔style.css: --{k} {hexv}")
        else:
            fail(f"--{k}: tokens.json={hexv} style.css={css_vars.get(k)}")
    brand = open(os.path.join(ROOT, "BRAND.md")).read().lower()
    for k, hexv in tok_hex.items():
        if hexv in brand:
            ok(f"palette parity tokens↔BRAND.md: {hexv}")
        else:
            fail(f"BRAND.md §5 missing hex {hexv} (--{k})")

    # 3. generated tokens.css fresh
    gen = os.path.join(SITE, "css", "tokens.css")
    if not os.path.exists(gen):
        fail("css/tokens.css missing — run tools/make_tokens.py")
    else:
        body = open(gen).read()
        for k, hexv in tok_hex.items():
            if f"--rw-{k}: {hexv};" not in body:
                fail(f"tokens.css stale or missing --rw-{k} {hexv}")
        ok("tokens.css matches tokens.json (spot-checked all colors)")

    # 4. press-kit logo parity
    if os.path.isdir(KIT_LOGOS):
        for name in sorted(os.listdir(KIT_LOGOS)):
            master = os.path.join(ASSETS, name)
            copy = os.path.join(KIT_LOGOS, name)
            if not os.path.exists(master):
                warn(f"press-kit/logos/{name} has no site/assets master")
            elif sha(master) == sha(copy):
                ok(f"press-kit copy identical: {name}")
            else:
                fail(f"press-kit/logos/{name} differs from site/assets master "
                     f"— rerun build-press-kit.sh")

    # 5. icon links on every page
    required = ["assets/favicon.svg", "assets/favicon-32.png",
                "assets/apple-touch-icon.png", "assets/site.webmanifest",
                "assets/safari-pinned-tab.svg"]
    for page in sorted(glob.glob(os.path.join(SITE, "*.html"))):
        html = open(page).read()
        missing = [r for r in required if r not in html]
        rel = os.path.relpath(page, SITE)
        if missing:
            fail(f"{rel} missing icon links: {', '.join(missing)}")
        else:
            ok(f"{rel} links full icon set")

    # 6. site-copy language lint (BRAND.md §2/§4/§10, mechanical subset)
    pages = [p for p in sorted(glob.glob(os.path.join(SITE, "*.html")))
             if os.path.basename(p) not in LINT_EXEMPT]
    hits = 0
    for page in pages:
        html = open(page).read()
        rel = os.path.relpath(page, SITE)
        for rx, why in BANNED_NAMING:
            for m in rx.finditer(html):
                hits += 1
                fail(f"{rel}: banned naming {m.group(0)!r} — {why}")
        for pat in BANNED_VOICE + CONTROL_CLAIMS:
            for m in re.finditer(pat, html, re.I):
                hits += 1
                fail(f"{rel}: banned language /{pat}/ "
                     f"({m.group(0)!r}) — BRAND.md §4/§10")
        for pat in CUT_FEATURES:
            for m in re.finditer(pat, html, re.I):
                window = html[max(0, m.start() - 70):m.start()] + \
                         html[m.end():m.end() + 90]
                if NEGATION_CUE.search(window):
                    continue
                hits += 1
                fail(f"{rel}: cut-feature mention /{pat}/ "
                     f"({m.group(0)!r}) without negation — BRAND.md §10")
        for biz in REAL_BUSINESSES:
            if re.search(r"\b" + re.escape(biz) + r"\b", html):
                hits += 1
                fail(f"{rel}: real SF business {biz!r} — parody names only")
    if hits == 0:
        ok(f"language lint clean across {len(pages)} pages "
           f"(exempt: {', '.join(sorted(LINT_EXEMPT))})")

    print(f"\n{len(fails)} fail / {len(warns)} warn")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
