#!/usr/bin/env bash
# flip_flags.sh — the three owner-gated launch switches, one command.
#
# Switches (each maps to a LAUNCH-CHECKLIST gate):
#   pricing   G4  — data-pricing="provisional|final" on site/pricing.html <body>
#   demo      G12 — data-demo-src="<url>" on site/demo.html #demo-stage
#   endpoint  G8  — data-endpoint + data-site on the js/analytics.js script tag
#                   on EVERY page (the include ships inert with no attributes)
#
# Usage:
#   ./tools/flip_flags.sh --check                          report all three states
#   ./tools/flip_flags.sh --set pricing=final              flip one switch
#   ./tools/flip_flags.sh --set endpoint=https://stats.example.com/e demo=https://play.example.com/
#   ./tools/flip_flags.sh --revert                         all three back to pre-launch
#
# Exit 0 = clean set/revert/check. Exit 1 = bad args or inconsistent state.
# Nothing here publishes; it only edits files in this worktree. Commit the
# result — the launch checklist wants the flips in ONE commit at T-48h/T-2h.
set -euo pipefail
cd "$(dirname "$0")/.."
SITE="site"

die() { echo "flip_flags: $*" >&2; exit 1; }
url_ok() { echo "$1" | grep -qE '^https://[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(/[^ "]*)?$'; }

# ── state readers ────────────────────────────────────────────────────
pricing_state() { grep -oE 'data-pricing="[^"]*"' "$SITE/pricing.html" | head -1 | cut -d'"' -f2; }
demo_state()    { grep -oE 'data-demo-src="[^"]*"' "$SITE/demo.html"  | head -1 | cut -d'"' -f2; }
endpoint_state() {
  grep -rhoE 'data-endpoint="[^"]+"' "$SITE"/*.html 2>/dev/null | sort -u | cut -d'"' -f2 || true
}
endpoint_pages() { grep -l '<script src="js/analytics.js"' "$SITE"/*.html || true; }

# ── writers ──────────────────────────────────────────────────────────
set_pricing() {
  case "$1" in
    final|provisional) ;;
    *) die "pricing must be 'final' or 'provisional' (got '$1')" ;;
  esac
  sed -i "s/data-pricing=\"[^\"]*\"/data-pricing=\"$1\"/" "$SITE/pricing.html"
  echo "   pricing.html: data-pricing -> \"$1\""
  echo "   NOTE: same-commit sync still required — faq.html, js/pricing.js,"
  echo "         social/drafts/pricing-post.md, STORE-COPY.md (LAUNCH-CHECKLIST G4)"
}

set_demo() {
  if [ -n "$1" ] && ! url_ok "$1"; then
    die "demo URL must be https://host[/path] (got '$1')"
  fi
  sed -i "s|data-demo-src=\"[^\"]*\"|data-demo-src=\"$1\"|" "$SITE/demo.html"
  if [ -n "$1" ]; then
    echo "   demo.html: data-demo-src -> \"$1\""
    echo "   NOTE: verify iframe mounts + watch_start{mode:live} (D0.3b), and"
    echo "         CSP frame-src on the host must allow this origin (deploy/Caddyfile)"
  else
    echo "   demo.html: data-demo-src cleared -> gallery fallback"
  fi
}

set_endpoint() {
  if [ -n "$1" ] && ! url_ok "$1"; then
    die "endpoint must be https://host/path (got '$1')"
  fi
  for f in $(endpoint_pages); do
    if [ -n "$1" ]; then
      # normalize the include to a canonical form, then attach attributes
      sed -i 's|<script src="js/analytics.js" defer[^>]*></script>|<script src="js/analytics.js" defer data-endpoint="'"$1"'" data-site="realworld"></script>|' "$f"
    else
      sed -i 's|<script src="js/analytics.js" defer[^>]*></script>|<script src="js/analytics.js" defer></script>|' "$f"
    fi
  done
  if [ -n "$1" ]; then
    echo "   analytics endpoint -> \"$1\" on $(endpoint_pages | wc -l) page(s)"
    echo "   NOTE: CSP connect-src on the host must allow this origin (deploy/Caddyfile);"
    echo "         re-run tools/analytics_e2e.sh against staging before D0"
  else
    echo "   analytics endpoint cleared on all pages -> shim inert"
  fi
}

# ── modes ────────────────────────────────────────────────────────────
MODE=check
case "${1:-}" in
  --check|check|'') MODE=check ;;
  --set|set)        MODE=set; shift ;;
  --revert|revert)  MODE=revert ;;
  -h|--help)        sed -n '2,20p' "$0"; exit 0 ;;
  *)                die "unknown arg '$1' (try --check, --set k=v ..., --revert)" ;;
esac

if [ "$MODE" = check ]; then
  echo "== flip_flags --check"
  P=$(pricing_state)
  echo "   pricing (G4):  ${P:-MISSING ATTR}"
  D=$(demo_state)
  echo "   demo (G12):    ${D:-<empty — gallery fallback>}"
  E=$(endpoint_state)
  if [ -z "$E" ]; then
    echo "   endpoint (G8): <unset — shim inert> ($(endpoint_pages | wc -l) pages carry the include)"
  else
    echo "   endpoint (G8): $(echo "$E" | sort -u | tr '\n' ' ')"
    N=$(echo "$E" | sort -u | wc -l)
    [ "$N" -gt 1 ] && { echo "   !! INCONSISTENT endpoints across pages"; exit 1; }
    EPAGES=$(grep -l 'data-endpoint=' "$SITE"/*.html | wc -l)
    TPAGES=$(endpoint_pages | wc -l)
    [ "$EPAGES" != "$TPAGES" ] && { echo "   !! endpoint on $EPAGES of $TPAGES pages — rerun --set endpoint=<url>"; exit 1; }
  fi
  exit 0
fi

if [ "$MODE" = revert ]; then
  echo "== flip_flags --revert (back to pre-launch state)"
  set_pricing provisional
  set_demo ""
  set_endpoint ""
  echo "== done — rerun ./tools/flip_flags.sh --check to confirm"
  exit 0
fi

# --set k=v ...
echo "== flip_flags --set"
[ "$#" -eq 0 ] && die "--set needs at least one key=value"
for kv in "$@"; do
  K="${kv%%=*}"; V="${kv#*=}"
  case "$K" in
    pricing)  set_pricing "$V" ;;
    demo)     set_demo "$V" ;;
    endpoint) set_endpoint "$V" ;;
    *)        die "unknown switch '$K' (pricing|demo|endpoint)" ;;
  esac
done
echo "== done — next: ./tools/flip_flags.sh --check && ./tools/preflight.sh"
