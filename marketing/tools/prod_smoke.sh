#!/usr/bin/env bash
# prod_smoke.sh — production counterpart of staging_dryrun.sh.
# Checks the LIVE site over HTTPS: pages, sitemap/robots, meta/OG, JSON-LD,
# security headers, and a placeholder sweep on the served HTML.
# Usage: ./tools/prod_smoke.sh https://<domain>     (read-only; posts nothing)
set -u
BASE="${1:?usage: prod_smoke.sh https://<domain>}"
BASE="${BASE%/}"
PASS=0; FAIL=0; WARN=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  WARN  %s\n' "$1"; }

echo "=== Real World PROD smoke — $BASE — $(date '+%Y-%m-%d %H:%M %Z') ==="

# 1. Pages 200 + TTFB
echo "[1] pages"
for p in "" index.html features.html cast.html how-it-works.html demo.html community.html journal.html rules.html pricing.html faq.html press-kit.html; do
  read -r code t < <(curl -s -o /dev/null -w '%{http_code} %{time_starttransfer}' "$BASE/$p")
  tgt="/${p:-index}"
  [ "$code" = "200" ] && ok "$tgt  $code  ${t}s" || bad "$tgt  $code"
done
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/no-such-page-smoke")
{ [ "$c" = "404" ] || [ "$c" = "200" ]; } && ok "missing URL -> $c" || bad "missing URL -> $c"

# 2. sitemap + robots reachable
echo "[2] sitemap/robots"
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/sitemap.xml"); [ "$c" = 200 ] && ok "sitemap.xml" || bad "sitemap.xml $c"
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/robots.txt");  [ "$c" = 200 ] && ok "robots.txt"  || bad "robots.txt $c"

# 3. Security headers on /
echo "[3] security headers (/)"
hdrs=$(curl -sI "$BASE/")
for h in strict-transport-security content-security-policy x-content-type-options referrer-policy; do
  echo "$hdrs" | grep -qi "^$h:" && ok "$h" || warn "$h missing"
done

# 4. Meta/OG + JSON-LD + placeholder sweep on served HTML
echo "[4] served HTML: meta + JSON-LD + placeholder sweep"
mkdir -p /tmp/rw-smoke && rm -f /tmp/rw-smoke/*.html
for p in index features cast how-it-works demo community journal rules pricing faq press-kit; do
  curl -s "$BASE/$p.html" -o "/tmp/rw-smoke/$p.html"
  grep -q 'og:title' "/tmp/rw-smoke/$p.html" && grep -q 'og:image' "/tmp/rw-smoke/$p.html" \
    && ok "$p OG tags" || bad "$p missing OG"
done
for pat in realworld-game.example 'PLACEHOLDER' 'TODO' 'lorem'; do
  hits=$(grep -lI "$pat" /tmp/rw-smoke/*.html 2>/dev/null | wc -l)
  [ "$hits" -gt 0 ] && warn "'$pat' still served in $hits page(s)" || ok "no '$pat' served"
done
python3 - <<'PY'
import json,re,glob,sys
bad=0
for f in glob.glob('/tmp/rw-smoke/*.html'):
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', open(f).read(), re.S):
        try: json.loads(m)
        except Exception as e: print(f"  FAIL  JSON-LD {f}: {e}"); bad+=1
sys.exit(1 if bad else 0)
PY
[ $? -eq 0 ] && ok "all served JSON-LD parses" || bad "JSON-LD parse errors"

# 5. Analytics state — endpoint configured?
echo "[5] analytics"
if grep -qoE 'data-endpoint="[^"]+"' /tmp/rw-smoke/*.html; then
  ok "analytics endpoint configured (collection live — verify dashboard)"
else
  warn "analytics still inert (no data-endpoint served) — expected pre-G8"
fi

# 6. www redirect (apex→www or www→apex, either fine — just report)
c=$(curl -s -o /dev/null -w '%{http_code}' "https://www.${BASE#https://}" 2>/dev/null || true)
echo "       www variant -> ${c:-unreachable} (informational)"

echo "=== RESULT: $PASS pass / $WARN warn / $FAIL fail ==="
[ "$FAIL" -eq 0 ]
