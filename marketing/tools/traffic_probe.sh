#!/usr/bin/env bash
# traffic_probe.sh — launch-day traffic readiness checks (read-only; GETs only).
#
#   headers <base-url>            verify the Caddyfile cache/security contract
#                                 is actually being served (per asset class)
#   warm <base-url>               GET every sitemap.xml URL once — primes CDN/
#                                 host caches before the announce posts go out
#   load <base-url> [conc] [n]    concurrent GET / — n requests, conc at a time;
#                                 reports status mix + min/avg/max latency
#
# Rehearse locally:
#   (cd site && python3 -m http.server 8901 &)   # or rehearse_host.sh host
#   ./tools/traffic_probe.sh headers http://localhost:8901
#   ./tools/traffic_probe.sh load    http://localhost:8901 8 40
# Notes: python http.server sends NO cache/security headers — expect WARNs
# there; the checks are written against deploy/Caddyfile, so they go green
# only behind the real config. That is the point: this is the live-contract
# verifier, not a staging-linter.
set -u
MODE="${1:?usage: traffic_probe.sh headers|warm|load <base-url> [conc] [n]}"
BASE="${2:?missing base-url}"
BASE="${BASE%/}"
PASS=0; FAIL=0; WARN=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  WARN  %s\n' "$1"; }
hdr()  { curl -sI "$1" | tr -d '\r'; }

case "$MODE" in
headers)
  echo "=== traffic_probe HEADERS — $BASE ==="
  # Security headers on / (must match deploy/Caddyfile header block)
  H=$(hdr "$BASE/")
  for h in strict-transport-security x-content-type-options referrer-policy content-security-policy; do
    echo "$H" | grep -qi "^$h:" && ok "/ serves $h" || warn "/ missing $h"
  done
  echo "$H" | grep -qi 'permissions-policy:.*camera=()' && ok "/ permissions-policy locks camera/mic/geo" \
    || warn "/ permissions-policy missing or loose"
  # Cache contract per asset class (deploy/Caddyfile: assets 86400, html 300, sitemap 3600)
  for spec in "/css/style.css:86400" "/sitemap.xml:3600"; do
    url="${spec%%:*}"; want="${spec##*:}"
    cc=$(hdr "$BASE$url" | grep -i '^cache-control:' || true)
    if echo "$cc" | grep -q "max-age=$want"; then ok "$url cache max-age=$want"
    elif [ -n "$cc" ]; then warn "$url cache = $cc (want max-age=$want)"
    else warn "$url no Cache-Control (want max-age=$want)"; fi
  done
  cc=$(hdr "$BASE/index.html" | grep -i '^cache-control:' || true)
  if echo "$cc" | grep -q 'max-age=300'; then ok "/index.html cache max-age=300 (fast launch-day edits)"
  elif [ -n "$cc" ]; then warn "/index.html cache = $cc (want max-age=300)"
  else warn "/index.html no Cache-Control"; fi
  # An actual shot asset
  shot=$(find "$(dirname "$0")/../site/shots" -name '*.webp' | head -1 | xargs -r basename)
  if [ -n "$shot" ]; then
    cc=$(hdr "$BASE/shots/$shot" | grep -i '^cache-control:' || true)
    echo "$cc" | grep -q 'max-age=86400' && ok "/shots/$shot cache max-age=86400" \
      || warn "/shots/$shot cache = ${cc:-none}"
  fi
  # Encoding negotiated
  enc=$(curl -sI -H 'Accept-Encoding: gzip' "$BASE/" | tr -d '\r' | grep -i '^content-encoding:' || true)
  [ -n "$enc" ] && ok "encoding: $enc" || warn "no content-encoding on gzip request"
  ;;
warm)
  echo "=== traffic_probe WARM — $BASE ==="
  mapfile -t urls < <(curl -s "$BASE/sitemap.xml" | grep -oE '<loc>[^<]+' | sed 's/<loc>//' \
    | sed -E 's|https?://[^/]+||')   # strip origin — warm against $BASE (loc host may be placeholder/www)
  [ "${#urls[@]}" -eq 0 ] && { bad "sitemap empty or unreachable"; echo "=== RESULT: $PASS pass / $WARN warn / $FAIL fail ==="; exit 1; }
  echo "  ${#urls[@]} sitemap URLs"
  for u in "${urls[@]}"; do
    read -r code t < <(curl -s -o /dev/null -w '%{http_code} %{time_total}' "$BASE$u")
    [ "$code" = 200 ] && ok "$(printf '%-46s' "${u#$BASE}") ${t}s" || bad "${u#$BASE} -> $code"
  done
  ;;
load)
  CONC="${3:-8}"; N="${4:-40}"
  echo "=== traffic_probe LOAD — $BASE — ${N}x GET / conc=$CONC ==="
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  export BASE tmp
  seq 1 "$N" | xargs -P "$CONC" -I{} sh -c \
    'curl -s -o /dev/null -w "%{http_code} %{time_total}\n" "$BASE/" > "$tmp/{}"'
  codes=$(cat "$tmp"/* | awk '{print $1}')
  times=$(cat "$tmp"/* | awk '{print $2}')
  n200=$(echo "$codes" | grep -c '^200$' || true)
  nother=$(( N - n200 ))
  [ "$nother" -eq 0 ] && ok "$n200/$N returned 200" || bad "$nother/$N non-200: $(echo "$codes"|sort|uniq -c|tr '\n' ' ')"
  echo "$times" | awk '{if(min==""||$1<min)min=$1; if($1>max)max=$1; s+=$1}
    END{printf "       latency min=%.3fs avg=%.3fs max=%.3fs  (%.0f req/s wall)\n",min,s/NR,max,NR/s}'
  awk -v t="$times" 'BEGIN{}' # noop
  p95=$(echo "$times" | sort -n | awk '{a[NR]=$1} END{print a[int(NR*0.95)+ (int(NR*0.95)<NR?1:0)]}')
  echo "       p95 ≈ ${p95}s"
  ;;
*) echo "unknown mode $MODE" >&2; exit 2;;
esac
echo "=== RESULT: $PASS pass / $WARN warn / $FAIL fail ==="
[ "$FAIL" -eq 0 ]
