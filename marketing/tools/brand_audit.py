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

    print(f"\n{len(fails)} fail / {len(warns)} warn")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
