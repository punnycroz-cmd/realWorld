#!/usr/bin/env bash
# deploy-site.sh — push marketing/site/ to the production host.
#
# SAFE BY DEFAULT: without --apply this is a pure rsync dry-run.
# Requires env (see infra.env.example):
#   RW_DEPLOY_HOST   e.g. deploy@203.0.113.10
#   RW_DEPLOY_PATH   e.g. /srv/www/realworld       (contains releases/ + current -> releases/<ts>)
# Optional:
#   RW_DEPLOY_SSH    extra ssh options
#
# Layout on the host (Caddyfile expects `current`):
#   /srv/www/realworld/releases/20260923-120000/   <- rsync target (new dir)
#   /srv/www/realworld/current                     <- symlink flipped after sync
# Rollback: ssh $RW_DEPLOY_HOST "ln -sfn releases/<prev> $RW_DEPLOY_PATH/current"
#
# Usage: ./deploy/deploy-site.sh [--apply]
set -euo pipefail
cd "$(dirname "$0")/.."
SITE_DIR="site/"

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

: "${RW_DEPLOY_HOST:?set RW_DEPLOY_HOST (see deploy/infra.env.example)}"
: "${RW_DEPLOY_PATH:?set RW_DEPLOY_PATH}"

TS="$(date +%Y%m%d-%H%M%S)"
REL="$RW_DEPLOY_PATH/releases/$TS"
SSH_OPTS="${RW_DEPLOY_SSH:-}"

echo "== deploy-site: ${SITE_DIR} -> ${RW_DEPLOY_HOST}:${REL} (apply=$APPLY)"

RSYNC_DRY=""; [ "$APPLY" -eq 0 ] && RSYNC_DRY="--dry-run"

# 1. sync files into a NEW release dir (never mutate the live one)
rsync -az --delete $RSYNC_DRY -e "ssh $SSH_OPTS" \
  --exclude '.DS_Store' \
  "$SITE_DIR" "${RW_DEPLOY_HOST}:${REL}/"

# 2. flip the symlink (atomic)
if [ "$APPLY" -eq 1 ]; then
  ssh $SSH_OPTS "$RW_DEPLOY_HOST" "ln -sfn '$REL' '$RW_DEPLOY_PATH/current'"
  echo "== live: $RW_DEPLOY_PATH/current -> $REL"
  echo "== next: run tools/prod_smoke.sh https://<domain>"
else
  cat <<EOF
== DRY RUN complete. With --apply this would also run:
   ssh $RW_DEPLOY_HOST "ln -sfn $REL $RW_DEPLOY_PATH/current"
== First-time host prep (run once, manually):
   ssh $RW_DEPLOY_HOST "mkdir -p $RW_DEPLOY_PATH/releases"
EOF
fi
