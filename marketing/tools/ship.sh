#!/usr/bin/env bash
# ship.sh — the ONE command between "the owner said GO" and a live site.
#
# What it does, in order (each step must pass before the next runs):
#   1. tools/preflight.sh            — mechanical go-gate (dry-run, secrets,
#                                      sitemap parity, kit freshness, switches)
#   2. ./build-press-kit.sh          — rebuild dist/ zip so the kit ships current
#   3. deploy/deploy-site.sh         — rsync release + atomic symlink flip
#   4. tools/prod_smoke.sh <domain>  — live verification of what just shipped
#   5. prints the post-deploy punch list (demo flip, monitor arm, DNS/TTL notes)
#
# SAFE BY DEFAULT: without --apply, steps 3–4 run as a deploy dry-run and the
# smoke pass is skipped — nothing leaves this machine. With --apply it still
# requires the deploy env (RW_DEPLOY_HOST/RW_DEPLOY_PATH, infra.env.example).
#
# Usage:
#   ./tools/ship.sh                  # rehearse the whole pipeline (read-only)
#   ./tools/ship.sh --apply          # actually deploy (owner GO + env set)
#   RW_DOMAIN=example.com ./tools/ship.sh --apply
#
# Owner-gated flips (G3 domain sweep, G4 pricing, G8 endpoint, G12 embed)
# must already be committed — ship.sh verifies them via preflight but does
# NOT flip them for you.
set -euo pipefail
cd "$(dirname "$0")/.."

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

echo "=== Real World SHIP — $(date '+%Y-%m-%d %H:%M %Z') — apply=$APPLY ==="
echo

# ── 1. Preflight (hard gate) ─────────────────────────────────────────
echo "[1/5] preflight"
if ./tools/preflight.sh; then
  echo "       preflight GO"
else
  echo "       PREFLIGHT FAILED — ship aborted. Fix FAILs and rerun." >&2
  exit 1
fi
echo

# ── 2. Press-kit rebuild ─────────────────────────────────────────────
echo "[2/5] press kit"
if [ -x ./build-press-kit.sh ]; then
  ./build-press-kit.sh >/dev/null && echo "       dist zip rebuilt"
else
  echo "       build-press-kit.sh missing — skipped (warn)"
fi
echo

# ── 3. Deploy ────────────────────────────────────────────────────────
echo "[3/5] deploy"
if [ "$APPLY" -eq 1 ]; then
  ./deploy/deploy-site.sh --apply
else
  if [ -n "${RW_DEPLOY_HOST:-}" ] && [ -n "${RW_DEPLOY_PATH:-}" ]; then
    ./deploy/deploy-site.sh
  else
    echo "       RW_DEPLOY_HOST/RW_DEPLOY_PATH unset — dry-run skipped"
    echo "       (set them from deploy/infra.env.example to rehearse rsync)"
  fi
fi
echo

# ── 4. Live smoke ────────────────────────────────────────────────────
echo "[4/5] production smoke"
DOMAIN="${RW_DOMAIN:-}"
if [ "$APPLY" -eq 1 ] && [ -n "$DOMAIN" ]; then
  case "$DOMAIN" in
    http*) BASE="$DOMAIN" ;;
    *)     BASE="https://$DOMAIN" ;;
  esac
  ./tools/prod_smoke.sh "$BASE"
elif [ "$APPLY" -eq 1 ]; then
  echo "       RW_DOMAIN unset — smoke skipped; run manually:"
  echo "       ./tools/prod_smoke.sh https://<domain>"
else
  echo "       skipped (rehearsal mode — runs for real on --apply)"
fi
echo

# ── 5. Punch list ────────────────────────────────────────────────────
echo "[5/5] post-deploy punch list"
cat <<'EOF'
  [ ] demo embed: ./tools/flip_flags.sh --set demo=<url> → redeploy (G12)
  [ ] analytics: ./tools/flip_flags.sh --set endpoint=<url> if not yet live;
      confirm events arriving on stats.<domain> (G8)
  [ ] DNS sanity: ./tools/dns_check.sh <domain>  (read-only)
  [ ] monitor: arm uptime probes per deploy/monitoring.example
      (or cron ./tools/uptime_probe.sh https://<domain> as a stopgap)
  [ ] OG card: paste the URL in a share-preview validator once
  [ ] rollback ready: deploy printed the symlink command — keep it
EOF
echo
if [ "$APPLY" -eq 1 ]; then
  echo "=== SHIP COMPLETE — site is live. Log the run in LAUNCH-CHECKLIST §10. ==="
else
  echo "=== REHEARSAL COMPLETE — nothing deployed. --apply ships for real. ==="
fi
