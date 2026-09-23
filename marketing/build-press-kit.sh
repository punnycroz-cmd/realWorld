#!/usr/bin/env bash
# Build the downloadable press-kit zip. One command, local only.
#   ./marketing/build-press-kit.sh
# Output: marketing/dist/real-world-press-kit.zip
set -euo pipefail
cd "$(dirname "$0")"

KIT="press-kit"
OUT="dist/real-world-press-kit.zip"

# Regenerate raster brand assets so the kit never ships stale files.
python3 tools/make_brand_assets.py >/dev/null

# Refresh derivative copies (logos + screenshots mirror site assets).
cp site/assets/logo-primary.svg site/assets/logo-primary.png \
   site/assets/logo-primary-dark.svg \
   site/assets/logo-icon.svg site/assets/logo-icon.png \
   site/assets/logo-icon-mono.svg site/assets/logo-primary-mono.svg \
   site/assets/logo-stacked.svg \
   site/assets/logo-icon-animated.svg \
   site/assets/pattern-windows.svg \
   site/assets/favicon.svg "$KIT/logos/"
mkdir -p "$KIT/badges"
cp site/assets/badge-watched.svg site/assets/badge-watched-mono.svg \
   "$KIT/badges/"
cp site/shots/v48-A.png site/shots/v48-B.png site/shots/v48-C.png \
   site/shots/v48-D.png site/shots/v16-int-cafe.png site/shots/v16-int-flat.png \
   site/shots/v1-A.png site/shots/v1-B.png \
   site/shots/v48-A.webp site/shots/v48-B.webp site/shots/v48-C.webp \
   site/shots/v48-D.webp \
   "$KIT/screenshots/"

mkdir -p dist
rm -f "$OUT"
( cd "$KIT" && zip -qr "../$OUT" . )
echo "Built $OUT"
unzip -l "$OUT" | tail -n +2
