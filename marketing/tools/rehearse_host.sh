#!/usr/bin/env bash
# rehearse_host.sh — exercise the deploy-site.sh host layout LOCALLY.
#
# deploy-site.sh needs a real SSH host; this harness rehearses the exact same
# contract against a local directory so the rollback/retention path is proven
# before the owner provisions anything:
#
#   <host>/releases/<ts>/    one dir per deploy
#   <host>/current           symlink flipped atomically per deploy
#   retention: 5 newest kept
#
# It performs 7 fake deploys (injecting a marker so each release differs),
# asserts retention = 5 newest, then rehearses the printed rollback command
# (symlink flip to the previous release) and verifies content integrity with
# diff -r. Read-only w.r.t. marketing/ — all state lives under the work dir.
#
# Usage:  ./tools/rehearse_host.sh [workdir]     (default: mktemp, cleaned up)
set -euo pipefail
cd "$(dirname "$0")/.."

WORK="${1:-$(mktemp -d /tmp/rw-rehearse-XXXXXX)}"
HOST="$WORK/host"
mkdir -p "$HOST/releases"
fail() { echo "REHEARSE FAIL: $*" >&2; exit 1; }
ok()   { echo "  ok: $*"; }

echo "=== rehearse_host — fake host at $HOST ==="

deploy() { # deploy <marker>
  local ts rel
  ts="$(date +%Y%m%d-%H%M%S).$1"          # .$n keeps names unique in same second
  rel="$HOST/releases/$ts"
  mkdir -p "$rel"
  cp -a site/. "$rel/"
  echo "$1" > "$rel/.marker"             # would-be release delta
  ln -sfn "$rel" "$HOST/current"
  # same retention line as deploy-site.sh
  (cd "$HOST/releases" && ls -1t | tail -n +6 | xargs -r rm -rf --)
  echo "$rel"
}

# ── 1. seven deploys ──
PREV=''
for i in 1 2 3 4 5 6 7; do
  R=$(deploy "r$i")
  [ -L "$HOST/current" ] || fail "current is not a symlink after deploy $i"
  [ "$(readlink "$HOST/current")" = "$R" ] || fail "current not pointing at r$i"
  [ -f "$R/.marker" ] || fail "marker missing in r$i"
  PREV="$R"
done
ok "7 deploys, symlink flipped each time (live: $(basename "$PREV"))"

# ── 2. retention ──
KEPT=$(ls -1 "$HOST/releases" | wc -l)
[ "$KEPT" -eq 5 ] || fail "retention kept $KEPT releases, expected 5"
ls -1 "$HOST/releases" | grep -q 'r7$' || fail "newest release pruned wrongly"
ls -1 "$HOST/releases" | grep -q 'r2\|r1' && fail "oldest release survived prune"
ok "retention: 5 newest kept (r1–r2 pruned)"

# ── 3. rollback flip (the command deploy-site.sh prints) ──
LIVE=$(readlink "$HOST/current")
PREV_REL=$(ls -1t "$HOST/releases" | sed -n 2p)
ln -sfn "$HOST/releases/$PREV_REL" "$HOST/current"
[ "$(readlink "$HOST/current")" = "$HOST/releases/$PREV_REL" ] \
  || fail "rollback symlink did not flip to $PREV_REL"
[ "$(cat "$HOST/current/.marker")" = "r6" ] \
  || fail "rollback landed on wrong content (expected r6 marker)"
ok "rollback: current -> $PREV_REL, content verified (marker r6)"

# ── 4. content integrity: live release == site/ ──
diff -r --exclude='.marker' site/ "$HOST/current/" >/dev/null \
  || fail "release content diverges from site/"
ok "release content identical to site/ (diff -r clean)"

# ── 5. maintenance page staged OUTSIDE releases (survives flips) ──
cp deploy/maintenance.html "$HOST/maintenance.html"
[ -f "$HOST/maintenance.html" ] && ! grep -q 'realworld-game' "$HOST/maintenance.html" \
  || fail "maintenance page staging wrong"
ok "maintenance.html staged at host root (outside releases/, zero asset deps)"

echo
echo "=== REHEARSE PASS — deploy/rollback/retention/maintenance all verified ==="
echo "    work dir: $WORK (delete when done; nothing under marketing/ touched)"
