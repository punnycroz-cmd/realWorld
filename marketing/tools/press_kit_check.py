#!/usr/bin/env python3
"""press_kit_check.py — structural integrity gate for marketing/press-kit/.

The kit is hand-maintained across ~25 documents and 5 asset dirs; this
checker proves the manifest, captions, index links, and the dist zip all
agree with what's actually on disk. Accuracy of *claims* is owned by
accuracy_sweep.py — this tool only checks structure.

FAIL (exit 1):
  * manifest.json missing or invalid JSON
  * a file declared in manifest "files" does not exist on disk
  * a file on disk (top-level doc or asset-dir member) is not declared
    in the manifest
  * a local href in index.html points at a file that does not exist
  * an image asset (logos/keyart/badges/banners/screenshots) has no
    caption line in captions.txt (names may be grouped, substring match)

WARN (exit 0 if no FAILs):
  * "placeholders_pending_owner" is empty (someone forgot to update the
    manifest after filling the slots, or launch already happened)
  * dist/*.zip missing or missing declared files (rebuild:
    ./build-press-kit.sh)
"""
import json
import re
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "press-kit"
MANIFEST = KIT / "manifest.json"
CAPTIONS = KIT / "captions.txt"
INDEX = KIT / "index.html"
DIST = ROOT / "dist"
ASSET_DIRS = ("logos", "keyart", "badges", "banners", "screenshots")

P = W = F = 0


def ok(m):
    global P; P += 1; print(f"  PASS  {m}")


def warn(m):
    global W; W += 1; print(f"  WARN  {m}")


def bad(m):
    global F; F += 1; print(f"  FAIL  {m}")


print("=== press-kit integrity ===")

# ── 1. manifest parses ──
manifest = None
try:
    manifest = json.loads(MANIFEST.read_text())
    ok("manifest.json parses")
except FileNotFoundError:
    bad("manifest.json missing")
except json.JSONDecodeError as e:
    bad(f"manifest.json invalid JSON: {e}")

declared = set()          # every path the manifest claims
asset_names = []          # basenames that need captions
if manifest:
    files = manifest.get("files", {})
    for name, val in files.items():
        if isinstance(val, list):            # asset dir listing
            for member in val:
                declared.add(f"{name}{member}")
                asset_names.append(member)
        else:
            declared.add(name)

    # ── 2. declared -> disk ──
    missing = [d for d in sorted(declared) if not (KIT / d).is_file()]
    if missing:
        for m in missing:
            bad(f"manifest declares missing file: {m}")
    else:
        ok(f"all {len(declared)} declared files exist on disk")

    # ── 3. disk -> declared ──
    on_disk = set()
    for p in KIT.iterdir():
        if p.is_file():
            on_disk.add(p.name)
    for d in ASSET_DIRS:
        dd = KIT / d
        if dd.is_dir():
            for p in dd.iterdir():
                if p.is_file():
                    on_disk.add(f"{d}/{p.name}")
    undeclared = sorted(on_disk - declared)
    if undeclared:
        for m in undeclared:
            bad(f"on disk but not in manifest: {m}")
    else:
        ok("every file on disk is declared in the manifest")

    # ── 4. captions coverage ──
    if CAPTIONS.is_file():
        cap = CAPTIONS.read_text()
        nocap = [n for n in asset_names if n not in cap]
        if nocap:
            for n in nocap:
                bad(f"no captions.txt line for asset: {n}")
        else:
            ok(f"captions.txt covers all {len(asset_names)} asset files")
    else:
        bad("captions.txt missing")

    # ── 5. index.html local links resolve ──
    if INDEX.is_file():
        html = INDEX.read_text()
        hrefs = re.findall(r'href="([^"#]+?)(?:#[^"]*)?"', html)
        dead = []
        for h in hrefs:
            if re.match(r'^[a-z]+:', h):     # http:, mailto:
                continue
            if not (KIT / h).exists():
                dead.append(h)
        for h in sorted(set(dead)):
            bad(f"index.html dead link: {h}")
        if not dead:
            ok(f"index.html: all {len(set(hrefs))} local links resolve")

    # ── 6. placeholders register ──
    ph = manifest.get("placeholders_pending_owner", [])
    if ph:
        ok(f"{len(ph)} owner-pending placeholders registered")
    else:
        warn("placeholders_pending_owner is empty — stale manifest or post-launch?")

# ── 7. dist zip parity ──
zips = sorted(DIST.glob("*.zip")) if DIST.is_dir() else []
if not zips:
    warn("no dist/*.zip — run ./build-press-kit.sh (G9)")
else:
    z = zips[0]
    names = set(zipfile.ZipFile(z).namelist())
    missing_in_zip = sorted(d for d in declared if d not in names)
    if missing_in_zip:
        warn(f"{z.name} missing {len(missing_in_zip)} declared file(s) — rebuild (G9)")
    else:
        ok(f"{z.name} contains all {len(declared)} declared files")

print(f"press-kit check: {P} pass / {W} warn / {F} fail")
sys.exit(1 if F else 0)
