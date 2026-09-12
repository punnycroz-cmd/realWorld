#!/usr/bin/env bash
# ==============================================================================
# Willowbrook Base Restore Script
# Instantly restores canonical Willowbrook v14 if any modifications fail.
# ==============================================================================
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$(cd "$DIR/.." && pwd)"

echo "Restoring canonical Willowbrook v14 base..."
cp -r "$DIR/dev/"* "$TARGET_DIR/dev/"
cp "$DIR/index.html" "$TARGET_DIR/index.html"
cp "$DIR/willowbrook-v14.html" "$TARGET_DIR/willowbrook-v14.html"
cp "$DIR/index.html.bak-v1" "$TARGET_DIR/index.html.bak-v1"
cp "$DIR/build.py" "$TARGET_DIR/build.py"
cp "$DIR/README.txt" "$TARGET_DIR/README.txt"

echo "✓ Willowbrook successfully restored to pristine canonical v14 base!"
