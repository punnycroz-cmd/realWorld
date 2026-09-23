#!/usr/bin/env bash
# incident_drill.sh — rehearse the detect → rollback → verify loop end-to-end.
#
# rehearse_host.sh proves the deploy mechanics; this drill proves the
# INCIDENT path: a bad release goes live, our own tooling has to catch it,
# and the printed rollback flip has to restore a green site. Everything runs
# on a local fake host served over HTTP — no SSH, nothing leaves the machine.
#
# Sequence:
#   1. deploy release A (good, with release.json manifest) → serve current/
#   2. prod_smoke must be green-ish (0 fail; header warns expected on HTTP)
#   3. deploy release B (corrupted: gutted index.html) → smoke must FAIL
#      (detection proven) and release_manifest --verify must MISMATCH
#   4. flip rollback to release A → smoke green again, manifest verifies
#
# Usage: ./tools/incident_drill.sh [workdir]
set -uo pipefail
cd "$(dirname "$0")/.."

WORK="${1:-$(mktemp -d /tmp/rw-drill-XXXXXX)}"
HOST="$WORK/host"
PORT=8145
mkdir -p "$HOST/releases"
fail() { echo "DRILL FAIL: $*" >&2; kill $HTTP_PID 2>/dev/null; exit 1; }
ok()   { echo "  ok: $*"; }
cleanup() { kill $HTTP_PID 2>/dev/null; }
trap cleanup EXIT

echo "=== incident_drill — fake host $HOST, served on :$PORT ==="

deploy() { # deploy <tag> — mirrors deploy-site.sh layout incl. manifest
  local rel="$HOST/releases/$(date +%Y%m%d-%H%M%S).$1"
  mkdir -p "$rel"
  cp -a site/. "$rel/"
  ./tools/release_manifest.py "$rel" > "$rel/release.json"
  ln -sfn "$rel" "$HOST/current"
  echo "$rel"
}

smoke_fails() { # -> number of FAILs reported by prod_smoke
  ./tools/prod_smoke.sh "http://127.0.0.1:$PORT" 2>&1 | tail -1 | \
    grep -oE '[0-9]+ fail' | grep -oE '[0-9]+'
}

# ── 1-2. deploy good release, serve, baseline smoke ──
REL_A=$(deploy "good")
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$HOST/current" \
  >/dev/null 2>&1 &
HTTP_PID=$!
sleep 1

V=$(./tools/release_manifest.py --verify "$HOST/current")
echo "$V" | grep -q '^PASS' || fail "good release failed its own manifest verify ($V)"
ok "release A manifest verifies (tree_sha256 + file_count)"

F=$(smoke_fails)
[ "$F" = "0" ] || fail "baseline smoke has $F FAILs on a good release"
ok "baseline: prod_smoke 0 fail (warns expected — HTTP has no TLS/HSTS)"

# provenance check sees the manifest
./tools/prod_smoke.sh "http://127.0.0.1:$PORT" 2>&1 | grep -q 'live release:' \
  || fail "smoke did not read release.json provenance"
ok "provenance: prod_smoke read release.json off the live site"

# ── 3. inject the incident: corrupted deploy goes live ──
REL_B=$(deploy "bad")
echo '<html><body>broken</body></html>' > "$REL_B/index.html"
echo '/* truncated */' > "$REL_B/css/style.css"
echo "  incident injected: index.html + style.css gutted in $(basename "$REL_B")"

V=$(./tools/release_manifest.py --verify "$REL_B" || true)
echo "$V" | grep -q '^FAIL' \
  || fail "manifest verify did NOT catch the corrupted release ($V)"
ok "detection 1: release_manifest --verify flags the corrupt release"

F=$(smoke_fails)
[ "${F:-0}" -ge 1 ] || fail "prod_smoke did NOT fail on the broken release"
ok "detection 2: prod_smoke reports $F FAIL(s) — the drill alarm works"

# ── 4. rollback: the flip deploy-site.sh prints ──
ln -sfn "$REL_A" "$HOST/current"
V=$(./tools/release_manifest.py --verify "$HOST/current")
echo "$V" | grep -q '^PASS' || fail "post-rollback release failed manifest verify ($V)"
F=$(smoke_fails)
[ "$F" = "0" ] || fail "post-rollback smoke still has $F FAILs"
ok "rollback: symlink flip to release A restored a green site (0 fail)"

echo
echo "=== DRILL PASS — bad deploy detected by manifest + smoke, rollback verified ==="
echo "    work dir: $WORK"
