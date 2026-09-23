#!/usr/bin/env bash
# runofshow.sh — "where am I in the countdown?" — live status for every
# mechanical item in LAUNCH-CHECKLIST §2 (T-minus schedule).
#
# READ-ONLY: it inspects the worktree and reports; it never flips a switch,
# never deploys, never touches the network except an OPTIONAL live DNS check
# when RW_DOMAIN is set.
#
# Usage:
#   ./tools/runofshow.sh                 # status of every countdown item
#   RW_DOMAIN=example.com ./tools/runofshow.sh   # + live DNS row
#
# Exit 0 always (this is a dashboard, not a gate — preflight/gonogo gate).
set -u
cd "$(dirname "$0")/.."
SITE="site"
GREEN=0; PEND=0

g()  { GREEN=$((GREEN+1)); printf '  [done]    %s\n' "$1"; }
p()  { PEND=$((PEND+1));  printf '  [pending] %s\n' "$1"; }
i()  {                    printf '  [info]    %s\n' "$1"; }

echo "=== Real World RUN OF SHOW — $(date '+%Y-%m-%d %H:%M %Z') ==="
echo "    live status vs LAUNCH-CHECKLIST §2 — read-only"
echo

# ── worktree state ───────────────────────────────────────────────────
echo "Worktree"
DIRTY=$(git status --short -- "$SITE" deploy tools 2>/dev/null | wc -l)
if [ "$DIRTY" -eq 0 ]; then
  g "site/deploy/tools clean — content-freeze compatible (T-7d)"
else
  p "$DIRTY uncommitted file(s) under site/deploy/tools — commit or revert before freeze"
fi
BRANCH=$(git branch --show-current 2>/dev/null || echo "?")
[ "$BRANCH" = "sf/marketing" ] && g "on sf/marketing" || p "branch is '$BRANCH' — expected sf/marketing"
echo

# ── the four launch switches ─────────────────────────────────────────
echo "Owner-gated switches (tools/flip_flags.sh)"
PRICE=$(grep -oE 'data-pricing="[^"]*"' "$SITE/pricing.html" | head -1 | cut -d'"' -f2)
[ "$PRICE" = "final" ] && g "G4 pricing = final" \
                     || p "G4 pricing = ${PRICE:-unset} — flip at T-48h after owner approves numbers"
DOMHITS=$(grep -rIl --exclude-dir=shots 'realworld-game.example' "$SITE" 2>/dev/null | wc -l)
[ "$DOMHITS" -eq 0 ] && g "G3 domain swap clean (no placeholder left)" \
                    || p "G3 domain swap — placeholder in $DOMHITS file(s): ./tools/swap_domain.sh <domain>"
ENDPT=$(grep -rhoE 'data-endpoint="[^"]+"' "$SITE"/*.html 2>/dev/null | sort -u | head -1 | cut -d'"' -f2)
EPCOUNT=$(grep -rl 'data-endpoint=' "$SITE"/*.html 2>/dev/null | wc -l)
INCOUNT=$(grep -l '<script src="js/analytics.js"' "$SITE"/*.html | wc -l)
if [ -n "$ENDPT" ] && [ "$EPCOUNT" = "$INCOUNT" ]; then
  g "G8 analytics endpoint live on $EPCOUNT pages ($ENDPT)"
elif [ -n "$ENDPT" ]; then
  p "G8 endpoint PARTIAL — $EPCOUNT of $INCOUNT pages; rerun flip_flags --set endpoint=$ENDPT"
else
  p "G8 analytics inert — ./tools/flip_flags.sh --set endpoint=https://stats.<domain>/api/send"
fi
DEMO=$(grep -oE 'data-demo-src="[^"]*"' "$SITE/demo.html" | head -1 | cut -d'"' -f2)
[ -n "$DEMO" ] && g "G12 demo embed -> $DEMO" \
              || p "G12 demo fallback gallery — flip at T-2h: --set demo=<spectator-url>"
echo

# ── provisioning state ───────────────────────────────────────────────
echo "Provisioning (runbook §5)"
if [ -n "${RW_DOMAIN:-}" ] && [ "${RW_DOMAIN:-}" != "realworld-game.example" ]; then
  if ./tools/dns_check.sh "$RW_DOMAIN" >/dev/null 2>&1; then
    g "DNS live for $RW_DOMAIN (apex/www/play/stats resolve)"
  else
    p "DNS for $RW_DOMAIN not matching spec — ./tools/dns_check.sh $RW_DOMAIN"
  fi
else
  i "DNS — set RW_DOMAIN=<domain> to check live records (dns_check.sh)"
fi
if [ -n "${RW_DEPLOY_HOST:-}" ] && [ -n "${RW_DEPLOY_PATH:-}" ]; then
  g "deploy env set ($RW_DEPLOY_HOST:$RW_DEPLOY_PATH) — ship.sh --apply can run"
else
  p "deploy env unset — RW_DEPLOY_HOST/RW_DEPLOY_PATH (infra.env.example)"
fi
[ -f dist/real-world-press-kit.zip ] && g "press-kit zip staged (dist/)" \
                                   || p "press-kit zip missing — ./build-press-kit.sh"
echo

# ── next action ──────────────────────────────────────────────────────
echo "=== $GREEN done / $PEND pending ==="
if [ "$PEND" -gt 0 ]; then
  echo "NEXT: work the first [pending] row top-down; each maps to a §2 gate."
else
  echo "ALL MECHANICAL ITEMS GREEN — owner gates (G1/G17 sign-offs) are human rows."
fi
exit 0
