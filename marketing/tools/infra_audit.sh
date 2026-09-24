#!/usr/bin/env bash
# infra_audit.sh — doc-drift audit for launch infrastructure docs.
#
# INFRASTRUCTURE.md and deploy/README.md are the provisioning contract; if
# they cite a tool that was renamed, a deploy/ file that doesn't exist, or a
# page count that went stale, the "go" session gets less boring than it
# should be. checklist_audit.py guards LAUNCH-CHECKLIST.md; this guards the
# infra pair — plus the security-header claims both host configs must serve.
#
# READ-ONLY: parses docs and the filesystem; changes nothing; no network.
#
# Usage: ./tools/infra_audit.sh    (run from marketing/ or repo root)
# Exit:  0 = no FAILs (warns allowed), 1 = any FAIL.

set -u
cd "$(dirname "$0")/.."

DOCS="INFRASTRUCTURE.md deploy/README.md deploy/data-rights.md deploy/traffic-plan.md deploy/host-contract.md"
PASS=0; WARN=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  ok   %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  warn %s\n' "$1"; }
fail() { FAIL=$((FAIL+1)); printf '  FAIL %s\n' "$1"; }

echo "=== infra_audit — $(date '+%Y-%m-%d %H:%M %Z') ==="

# ── 1. Every backticked local path cited in the docs exists ──────────────
echo "[1] cited paths exist"
CITED=$(grep -ohE '`((tools|deploy|site)/[A-Za-z0-9._/-]+|[A-Z][A-Z-]+\.md)`' $DOCS \
        | tr -d '`' | sed 's/[.*]$//' | sort -u)
for p in $CITED; do
  # strip trailing prose fragments sometimes caught (e.g. path " or")
  p="${p%% *}"
  [ -e "$p" ] && ok "$p" || fail "cited but missing: $p"
done

# ── 2. Cited scripts are executable ──────────────────────────────────────
echo "[2] cited scripts executable"
for p in $CITED; do
  case "$p" in
    tools/*.sh|deploy/*.sh)
      [ -x "$p" ] && ok "exec $p" || fail "not executable: $p" ;;
  esac
done

# ── 3. Reverse drift — every deploy/ file is documented ──────────────────
echo "[3] deploy/ inventory documented"
for f in deploy/*; do
  base="$(basename "$f")"
  [ "$base" = "README.md" ] && continue   # README documents itself
  if grep -q "$base" deploy/README.md INFRASTRUCTURE.md; then
    ok "documented $f"
  else
    fail "undocumented deploy artifact: $f (add a row to deploy/README.md)"
  fi
done
# every deploy/*.md except README is also cited somewhere
for f in deploy/*.md; do
  [ "$f" = "deploy/README.md" ] && continue
  grep -q "$(basename "$f")" INFRASTRUCTURE.md deploy/README.md \
    && ok "doc-linked $f" || warn "doc not linked: $f"
done

# ── 4. Site page-count claims vs reality ─────────────────────────────────
echo "[4] page-count claims"
ACTUAL=$(ls site/*.html 2>/dev/null | wc -l | tr -d ' ')
CLAIMED=$(grep -oE '[0-9]+ pages' INFRASTRUCTURE.md deploy/README.md 2>/dev/null \
          | grep -oE '[0-9]+' | sort -u)
if [ -z "$CLAIMED" ]; then
  warn "no page-count claim found (was it reworded?)"
else
  for n in $CLAIMED; do
    [ "$n" = "$ACTUAL" ] && ok "page count claim $n == actual $ACTUAL" \
      || fail "stale page count: docs say $n, site/ has $ACTUAL html files"
  done
fi

# ── 5. Security headers claimed in §7 exist in BOTH host configs ─────────
echo "[5] §7 header contract in Caddyfile + netlify.toml"
for hdr in Strict-Transport-Security Content-Security-Policy \
           X-Content-Type-Options Referrer-Policy Permissions-Policy; do
  for cfg in deploy/Caddyfile deploy/netlify.toml; do
    grep -qi "$hdr" "$cfg" && ok "$hdr in $cfg" || fail "$hdr missing from $cfg"
  done
done
# CSP frame-src must name the play origin slot in both configs
for cfg in deploy/Caddyfile deploy/netlify.toml; do
  grep -q "frame-src" "$cfg" && ok "frame-src in $cfg" || fail "frame-src missing from $cfg"
done

# ── 6. infra.env.example vars referenced by docs are defined ─────────────
echo "[6] env vars"
for v in RW_DEPLOY_HOST RW_DEPLOY_PATH RW_DEPLOY_SSH STRIPE_SECRET_KEY \
         STRIPE_WEBHOOK_SECRET STRIPE_PUBLISHABLE_KEY RW_ANALYTICS_ENDPOINT; do
  grep -q "$v" deploy/infra.env.example && ok "$v defined" \
    || fail "$v cited in INFRASTRUCTURE.md but absent from infra.env.example"
done

# ── 7. Placeholder hygiene — no real domains/keys leaked into deploy/ ────
echo "[7] placeholder hygiene"
# real keys have ≥8 chars after the prefix; 'sk_live_...' placeholders don't
LEAKS=$(grep -rInE 'sk_live_[A-Za-z0-9]{8}|sk_test_[A-Za-z0-9]{8}|pk_live_[A-Za-z0-9]{8}|-----BEGIN [A-Z ]*PRIVATE KEY' deploy/ site/ 2>/dev/null | wc -l)
[ "$LEAKS" -eq 0 ] && ok "no key-shaped strings in deploy/ + site/" \
  || fail "key-shaped strings found: $LEAKS"
DOMS=$(grep -rl 'realworld-game.example' deploy/ 2>/dev/null | wc -l)
[ "$DOMS" -gt 0 ] && ok "placeholder domain present ($DOMS deploy files — swap_domain.sh owns the flip)" \
  || warn "placeholder domain gone from deploy/ — post-swap tree? fine if live"

echo
echo "=== infra_audit: $PASS pass / $WARN warn / $FAIL fail ==="
[ "$FAIL" -eq 0 ]
