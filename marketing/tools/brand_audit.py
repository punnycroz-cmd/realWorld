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
  7. Lexicon lint — BRAND-LEXICON.md §3 drift table (users, customers,
     bots, virtual, influencers, gameplay, playthrough) plus the NPC rule
     (standalone "NPC"/"NPCs" banned; "NPC nudge" is canonical). Same
     exempt list as check 6.

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
KIT_BADGES = os.path.join(ROOT, "press-kit", "badges")

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

# Check 7 — BRAND-LEXICON.md §3 drift table (mechanical subset). Case-
# insensitive on purpose: these words are wrong in any casing. The NPC
# standalone rule lives inline above (needs the "nudge" lookahead).
LEXICON_BANS = [
    r"\busers?\b", r"\bcustomers?\b", r"\bbots\b", r"\bvirtual\b",
    r"\binfluencers?\b", r"\bgameplay\b", r"\bplaythrough\b",
    r"\bsentient\b", r"\bself-aware\b", r"\bhuman-like\b",
    r"\bindistinguishable\b",
]


def main():
    tokens = json.load(open(os.path.join(ASSETS, "brand-tokens.json")))

    # 1. named assets exist
    for group in ("logo", "banner_files", "badge_files"):
        if group not in tokens:
            continue
        files = tokens[group]["files"] if group == "logo" else tokens[group]
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

    # 4b. press-kit badge parity
    if os.path.isdir(KIT_BADGES):
        for name in sorted(os.listdir(KIT_BADGES)):
            master = os.path.join(ASSETS, name)
            copy = os.path.join(KIT_BADGES, name)
            if not os.path.exists(master):
                warn(f"press-kit/badges/{name} has no site/assets master")
            elif sha(master) == sha(copy):
                ok(f"press-kit badge identical: {name}")
            else:
                fail(f"press-kit/badges/{name} differs from site/assets master "
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
        # 7. lexicon lint (BRAND-LEXICON.md §3 drift table + NPC rule)
        for m in re.finditer(r"\bNPCs?\b(?!\s+nudge)", html):
            hits += 1
            fail(f"{rel}: standalone 'NPC' {m.group(0)!r} — 'residents'/"
                 f"'characters'; 'NPC' survives only in 'NPC nudge' (lexicon §2)")
        for pat in LEXICON_BANS:
            for m in re.finditer(pat, html, re.I):
                hits += 1
                fail(f"{rel}: lexicon drift /{pat}/ ({m.group(0)!r}) — "
                     f"BRAND-LEXICON.md §3")
    if hits == 0:
        ok(f"language lint clean across {len(pages)} pages "
           f"(exempt: {', '.join(sorted(LINT_EXEMPT))})")

    # 8. WCAG contrast — recompute every sanctioned text/background pair from
    #    tokens.json (no trusting the doc). Two gates: (a) each pair must clear
    #    its floor; (b) the computed "x.x:1" string must appear verbatim in
    #    BRAND.md §5 so the published matrix can't drift from the truth.
    #    paperwarm #f4f2ec is the email surface (§16), not a token.
    def _lum(hexv):
        h = hexv.lstrip("#")
        c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        c = [v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
             for v in c]
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

    def _ratio(a, b):
        la, lb = _lum(a), _lum(b)
        return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

    hexes = {k: c["value"] for k, c in tokens["color"].items()}
    hexes["paperwarm"] = "#f4f2ec"
    CONTRAST_FLOORS = [  # (fg, bg, minimum, why)
        ("text", "bg", 7.0, "body text, AAA target"),
        ("muted", "bg", 4.5, "secondary text, AA floor"),
        ("accent", "bg", 3.0, "large text/UI only per §5 brand rule"),
        ("text", "bg-2", 4.5, "body on raised surfaces"),
        ("muted", "bg-2", 4.5, "secondary on raised surfaces"),
        ("accent", "bg-2", 3.0, "accent on raised surfaces"),
        ("text", "panel", 4.5, "body on cards"),
        ("muted", "panel", 4.5, "secondary on cards"),
        ("accent", "panel", 3.0, "accent on cards"),
        ("ink", "accent", 4.5, "the only text on amber fills"),
        ("bg", "accent-2", 3.0, "status fill label"),
        ("bg", "accent-3", 3.0, "status fill label"),
        ("ink", "paperwarm", 7.0, "email body ink, AAA"),
        ("bg", "paperwarm", 7.0, "email headings, AAA"),
    ]
    brand_full = open(os.path.join(ROOT, "BRAND.md")).read()
    for fg, bg, floor, why in CONTRAST_FLOORS:
        r = _ratio(hexes[fg], hexes[bg])
        tag = f"{r:.1f}:1"
        if r < floor:
            fail(f"contrast {fg} on {bg} = {tag} < {floor}:1 floor ({why})")
        elif tag not in brand_full:
            fail(f"contrast {fg} on {bg} = {tag} passes floor but BRAND.md §5 "
                 f"doesn't state it — update the verified matrix")
        else:
            ok(f"contrast {fg} on {bg} = {tag} (floor {floor}:1, in BRAND.md)")
    for fg, bg in [("text", "accent"), ("text", "accent-3"),
                   ("muted", "paperwarm"), ("accent", "paperwarm")]:
        r = _ratio(hexes[fg], hexes[bg])
        if r >= 3.0:
            warn(f"contrast {fg} on {bg} = {r:.1f}:1 — §5 lists this pair as "
                 f"banned but it now clears 3:1; re-verify the ban")

    # 8b. deck template palette parity — templates/deck/base.html embeds the
    #     hexes directly (standalone file); it must not fork the palette.
    deck = os.path.join(ROOT, "templates", "deck", "base.html")
    if not os.path.exists(deck):
        fail("templates/deck/base.html missing — BRAND.md §18 cites it")
    else:
        body = open(deck).read()
        missing = [h for k, h in hexes.items()
                   if k != "paperwarm" and h.lower() not in body.lower()]
        if missing:
            fail(f"deck template missing palette hexes: {', '.join(missing)}")
        else:
            ok("deck template carries the full palette")

    print(f"\n{len(fails)} fail / {len(warns)} warn")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
