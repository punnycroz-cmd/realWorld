#!/usr/bin/env bash
# preflight.sh — the ONE command between "the owner said go" and deploy.
# Runs every mechanical go-gate locally and prints a GO/NO-GO summary.
# Publishes nothing; makes no network calls except localhost staging.
#
# Usage: ./tools/preflight.sh          (run from marketing/ or repo root)
# Exit:  0 = no FAILs (warns allowed — they map to owner-gated flags)
set -u
cd "$(dirname "$0")/.."
SITE="site"
PASS=0; FAIL=0; WARN=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  WARN  %s\n' "$1"; }

echo "=== Real World PREFLIGHT — $(date '+%Y-%m-%d %H:%M %Z') ==="

# ── 1. Full staging dry-run (the real page/asset/meta/budget checks) ──
echo "[1] staging dry-run"
DRY=$(./tools/staging_dryrun.sh 8137 2>&1)
echo "$DRY" | grep -E '^\s+(FAIL|WARN)' || true
DRYLINE=$(echo "$DRY" | tail -1)
echo "       $DRYLINE"
if echo "$DRYLINE" | grep -qE '[1-9][0-9]* fail'; then
  bad "staging dry-run has failures (above)"
else
  ok "staging dry-run: $DRYLINE"
fi
# Placeholder-domain warns are EXPECTED pre-G3 — count them, don't fail.
DOMHITS=$(grep -rIl --exclude-dir=shots 'realworld-game.example' "$SITE" 2>/dev/null | wc -l)
[ "$DOMHITS" -gt 0 ] && warn "placeholder domain still in $DOMHITS file(s) — G3 swap pending (expected until domain registered)" \
                    || ok "real domain swapped everywhere (G3 clean)"

# ── 1b. On-page SEO audit (titles/descriptions/H1/JSON-LD/sitemap parity) ──
echo "[1b] seo audit"
SEO=$(./tools/seo_audit.py 2>&1)
echo "$SEO" | grep -E '^\s+FAIL' || true
SEOLINE=$(echo "$SEO" | tail -1)
echo "       $SEOLINE"
if echo "$SEOLINE" | grep -qE '[1-9][0-9]* fail'; then
  bad "seo audit has failures (above)"
else
  ok "seo audit: $SEOLINE"
fi

# ── 1c. Brand audit (asset/palette/icon parity + site-copy language lint) ──
echo "[1c] brand audit"
BR=$(./tools/brand_audit.py 2>&1)
echo "$BR" | grep -E '^\s*FAIL' || true
BRLINE=$(echo "$BR" | tail -1)
echo "       $BRLINE"
if echo "$BRLINE" | grep -qE '[1-9][0-9]* fail'; then
  bad "brand audit has failures (above)"
else
  ok "brand audit: $BRLINE"
fi

# ── 2. Secret scan — nothing key-shaped may ship in the static site ──
echo "[2] secret scan (site/ + deploy/)"
SECRETS=0
for pat in 'sk_live_' 'sk_test_' 'pk_live_' 'whsec_' 'BEGIN [A-Z ]*PRIVATE KEY' 'AKIA[0-9A-Z]{16}' 'xox[bap]-'; do
  hits=$(grep -rEl "$pat" "$SITE" deploy 2>/dev/null | grep -v '\.example$' | wc -l)
  if [ "$hits" -gt 0 ]; then
    bad "secret-shaped string '$pat' in $hits file(s):"
    grep -rEl "$pat" "$SITE" deploy 2>/dev/null | grep -v '\.example$' | sed 's/^/         /'
    SECRETS=$((SECRETS+hits))
  fi
done
[ "$SECRETS" -eq 0 ] && ok "no secret-shaped strings in shippable files"

# ── 3. Flip-flag report — the three launch switches ──
echo "[3] launch switches (informational — owner-gated flips)"
PRICE=$(grep -oE 'data-pricing="[^"]*"' "$SITE/pricing.html" | head -1 | cut -d'"' -f2)
[ "$PRICE" = "final" ] && ok "pricing: FINAL (G4 flipped)" || warn "pricing: ${PRICE:-unset} — flip to \"final\" at T-48h after owner approves numbers (G4)"
DEMO=$(grep -oE 'data-demo-src="[^"]*"' "$SITE/demo.html" | head -1 | cut -d'"' -f2)
[ -n "$DEMO" ] && ok "demo embed: $DEMO (G12 live)" || warn "demo embed: fallback gallery (G12) — set data-demo-src at T-2h"
ENDPT=$(grep -rhoE 'data-endpoint="[^"]+"' "$SITE"/*.html | head -1 | cut -d'"' -f2)
[ -n "$ENDPT" ] && ok "analytics endpoint: $ENDPT (G8 live)" || warn "analytics: inert, no data-endpoint (G8) — set after backend pick"

# ── 4. Sitemap ↔ pages parity ──
echo "[4] sitemap parity"
MISS=0
for f in "$SITE"/*.html; do
  b=$(basename "$f")
  [ "$b" = "404.html" ] && continue
  if [ "$b" = "index.html" ]; then
    grep -qE '<loc>[^<]*/</loc>' "$SITE/sitemap.xml" || { bad "index (/) missing from sitemap.xml"; MISS=$((MISS+1)); }
  else
    grep -q "/$b<" "$SITE/sitemap.xml" || { bad "$b missing from sitemap.xml"; MISS=$((MISS+1)); }
  fi
done
[ "$MISS" -eq 0 ] && ok "every page in sitemap.xml"

# ── 5. Press-kit freshness (zip newer than its newest source?) ──
echo "[5] press kit bundle"
ZIP=$(ls dist/*.zip 2>/dev/null | head -1)
if [ -z "$ZIP" ]; then
  warn "no dist/*.zip — run ./build-press-kit.sh (G9)"
else
  NEWER=$(find "$SITE" press-kit -type f -newer "$ZIP" 2>/dev/null | wc -l)
  [ "$NEWER" -gt 0 ] && warn "$ZIP older than $NEWER site/press-kit file(s) — rebuild before launch (G9)" \
                    || ok "$(basename "$ZIP") is fresher than all sources"
fi

# ── 5b. Checklist self-audit — the launch contract must match the tree ──
echo "[5b] checklist audit"
CL=$(./tools/checklist_audit.py 2>&1)
echo "$CL" | grep -E '^\s+FAIL' || true
CLLINE=$(echo "$CL" | tail -1)
echo "       $CLLINE"
if echo "$CLLINE" | grep -qE '[1-9][0-9]* fail'; then
  bad "checklist audit has failures (above)"
else
  ok "checklist audit: $CLLINE"
fi

# ── 6. Tree state (informational) ──
echo "[6] worktree"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  DIRTY=$(git status --porcelain -- "$SITE" deploy tools 2>/dev/null | wc -l)
  [ "$DIRTY" -gt 0 ] && warn "$DIRTY uncommitted change(s) under site/deploy/tools — commit before tag" \
                    || ok "site/deploy/tools committed clean"
  echo "       branch: $(git branch --show-current) @ $(git rev-parse --short HEAD)"
else
  warn "not a git worktree — skipping"
fi

echo
echo "=== PREFLIGHT RESULT: $PASS pass / $WARN warn / $FAIL fail ==="
if [ "$FAIL" -eq 0 ]; then
  echo "VERDICT: mechanically GO — owner gates (G1..G17) still apply."
  exit 0
else
  echo "VERDICT: NO-GO — fix FAILs above before requesting owner sign-off."
  exit 1
fi
