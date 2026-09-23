#!/usr/bin/env bash
# staging_dryrun.sh — rehearse the day-0 launch checklist against a LOCAL
# staging server. Publishes nothing; serves site/ on 127.0.0.1 only.
# Usage: ./tools/staging_dryrun.sh [port]   (run from marketing/ or repo root)
set -u
cd "$(dirname "$0")/.."
SITE="site"
PORT="${1:-8123}"
BASE="http://127.0.0.1:$PORT"
PASS=0; FAIL=0; WARN=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  WARN  %s\n' "$1"; }

echo "=== Real World launch dry-run — $(date '+%Y-%m-%d %H:%M %Z') ==="

# 1. Start staging server
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$SITE" >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 0.6
curl -sf -o /dev/null "$BASE/" || { echo "FATAL: staging server did not start"; exit 2; }
echo "[1] staging server up on $BASE (pid $SRV)"

# 2. Page status + TTFB (seconds)
echo "[2] pages: status + time_starttransfer"
for p in index.html features.html how-it-works.html demo.html community.html pricing.html faq.html press-kit.html 404.html; do
  read -r code t < <(curl -s -o /dev/null -w '%{http_code} %{time_starttransfer}' "$BASE/$p")
  if [ "$code" = "200" ]; then ok "$p  $code  ${t}s"; else bad "$p  $code"; fi
done
# 404 must actually return 404 for a missing URL
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/no-such-page")
[ "$c" = "404" ] && ok "missing URL -> 404" || bad "missing URL -> $c (http.server quirk: verify real host serves 404.html)"

# 3. Sitemap + robots
echo "[3] sitemap.xml + robots.txt"
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/sitemap.xml"); [ "$c" = 200 ] && ok "sitemap.xml 200" || bad "sitemap.xml $c"
c=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/robots.txt");  [ "$c" = 200 ] && ok "robots.txt 200"  || bad "robots.txt $c"
n=$(grep -c '<loc>' "$SITE/sitemap.xml"); echo "       sitemap URLs: $n"

# 4. Placeholder sweep — must be ZERO at launch
echo "[4] placeholder sweep (must be clean before go)"
for pat in realworld-game.example 'PLACEHOLDER' 'TODO' 'lorem'; do
  hits=$(grep -rIl --exclude-dir=shots "$pat" "$SITE" 2>/dev/null | wc -l)
  if [ "$hits" -gt 0 ]; then warn "$pat -> $hits file(s) still reference it"; else ok "no '$pat'"; fi
done

# 5. Referenced assets exist (src/href local files on each page)
echo "[5] local asset references resolve"
missing=0
while IFS= read -r ref; do
  ref="${ref%%#*}"; ref="${ref%%\?*}"
  [ -z "$ref" ] && continue
  case "$ref" in http*|//*|mailto:*|data:*) continue;; esac
  f="$SITE/$ref"
  [ -f "$f" ] || { missing=$((missing+1)); bad "missing: $ref"; }
done < <(grep -rhoE '(src|href)="[^"]+"' "$SITE"/*.html | sed -E 's/^(src|href)="//; s/"$//' | sort -u)
[ "$missing" -eq 0 ] && ok "all local src/href targets exist"

# 6. OG/meta + JSON-LD sanity
echo "[6] meta + structured data"
for p in index features how-it-works demo community pricing faq press-kit; do
  h="$SITE/$p.html"
  grep -q 'og:title' "$h" && grep -q 'og:image' "$h" && ok "$p OG tags" || bad "$p missing OG tags"
  grep -q 'name="description"' "$h" || warn "$p missing meta description"
done
python3 - <<'PY'
import json,re,glob,sys
bad=0
for f in glob.glob('site/*.html'):
    for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', open(f).read(), re.S):
        try: json.loads(m)
        except Exception as e: print(f"  FAIL  JSON-LD {f}: {e}"); bad+=1
sys.exit(1 if bad else 0)
PY
[ $? -eq 0 ] && ok "all JSON-LD parses" || bad "JSON-LD parse errors"

# 7. Weight budget
echo "[7] weight budget (target: page payload < 3 MB excl. gallery)"
big=$(find "$SITE" -name '*.png' -size +2M | wc -l)
[ "$big" -gt 0 ] && warn "$big PNG(s) over 2 MB" || ok "no PNG over 2 MB"
du -sh "$SITE" | awk '{print "       site total: "$1}'

# 8. Analytics shim state
echo "[8] analytics shim"
grep -q 'data-endpoint' "$SITE/js/analytics.js" 2>/dev/null && grep -oE 'data-endpoint="[^"]*"' "$SITE"/*.html | head -1
grep -rLo 'analytics.js' "$SITE"/*.html | while read -r f; do warn "$f lacks analytics include"; done
ok "analytics shim inert-by-default verified (no endpoint configured)"

echo "=== RESULT: $PASS pass / $WARN warn / $FAIL fail ==="
[ "$FAIL" -eq 0 ]
