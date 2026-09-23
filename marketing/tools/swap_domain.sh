#!/usr/bin/env bash
# swap_domain.sh — the G3 gate, automated.
#
# Replaces the `realworld-game.example` placeholder with the real domain in
# every file that SHIPS or CONFIGURES the launch surface:
#   site/**            (canonical links, OG URLs, sitemap.xml, robots.txt, JS)
#   deploy/{Caddyfile,netlify.toml,dns-records.example,infra.env.example}
#
# Docs (*.md) and tools are intentionally NOT touched — they keep the
# placeholder as documentation, and gonogo.sh/preflight.sh only gate on site/.
#
# Usage:
#   ./tools/swap_domain.sh example.com          # placeholder -> example.com
#   ./tools/swap_domain.sh --revert example.com # example.com -> placeholder
#   ./tools/swap_domain.sh --check example.com  # verify zero leftovers (read-only)
#
# Exit 0 = clean swap / clean check. Exit 1 = leftovers found or bad args.
# Nothing here publishes; it only edits files in this worktree.
set -euo pipefail
cd "$(dirname "$0")/.."

PLACEHOLDER='realworld-game.example'
MODE=apply
DOMAIN=''

case "${1:-}" in
  --revert) MODE=revert; DOMAIN="${2:-}" ;;
  --check)  MODE=check;  DOMAIN="${2:-}" ;;
  -h|--help|'') sed -n '2,18p' "$0"; exit 0 ;;
  *)          DOMAIN="$1" ;;
esac

if ! echo "$DOMAIN" | grep -qE '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'; then
  echo "swap_domain: '$DOMAIN' does not look like a domain" >&2
  exit 1
fi

# File list = every file under the swap scope holding EITHER the placeholder
# (apply mode) or the real domain (revert/check mode).
targets() {
  local needle="$1"
  { grep -rIl --exclude-dir=shots "$needle" site/ 2>/dev/null || true
    grep -Il "$needle" deploy/Caddyfile deploy/netlify.toml \
      deploy/dns-records.example deploy/infra.env.example 2>/dev/null || true
  } | sort -u
}

leftovers() { targets "$PLACEHOLDER"; }

case "$MODE" in
  apply)
    FROM="$PLACEHOLDER"; TO="$DOMAIN" ;;
  revert)
    FROM="$DOMAIN"; TO="$PLACEHOLDER" ;;
  check)
    N=$(targets "$PLACEHOLDER" | wc -l)
    if [ "$N" -eq 0 ]; then
      echo "swap_domain --check: CLEAN — 0 files still hold $PLACEHOLDER"
      exit 0
    fi
    echo "swap_domain --check: $N file(s) still hold $PLACEHOLDER:" >&2
    targets "$PLACEHOLDER" >&2
    exit 1 ;;
esac

FILES=$(targets "$FROM")
if [ -z "$FILES" ]; then
  echo "swap_domain: no files contain '$FROM' — nothing to do"
  [ "$MODE" = apply ] && leftovers | grep . && exit 1 || exit 0
fi

echo "== swap_domain: $FROM -> $TO"
echo "$FILES" | sed 's/^/   /'
echo "$FILES" | xargs sed -i "s/${FROM//./\\.}/${TO}/g"

N=$(leftovers | wc -l)
if [ "$MODE" = apply ] && [ "$N" -ne 0 ]; then
  echo "!! $N file(s) still hold the placeholder after swap:" >&2
  leftovers >&2; exit 1
fi
echo "== done. ${MODE^} complete — post-swap verify:"
echo "   ./tools/preflight.sh        # mechanical go-gate re-run"
echo "   ./tools/staging_dryrun.sh   # expects 0 placeholder warns now"
