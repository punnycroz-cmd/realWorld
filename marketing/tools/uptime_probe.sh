#!/usr/bin/env bash
# uptime_probe.sh — lightweight production health probe.
#
# Two jobs:
#   1. A self-hosted stopgap monitor: cron it (*/5 * * * *) on any box and it
#      exits non-zero on failure — pair with cron MAILTO or a webhook wrapper.
#   2. The check definitions any external monitor should mirror
#      (deploy/monitoring.example encodes the same list).
#
# Checks (all over HTTPS, read-only):
#   - / returns 200 and contains the brand marker string
#   - /pricing.html, /demo.html return 200 (the two money/funnel pages)
#   - /sitemap.xml returns 200
#   - TLS cert has >= RW_CERT_WARN_DAYS days left (default 14)
#
# Usage: ./tools/uptime_probe.sh https://<domain>   # exit 0 = healthy
# Cron:  */5 * * * * /path/to/tools/uptime_probe.sh https://<domain>
set -u
BASE="${1:?usage: uptime_probe.sh https://<domain>}"
BASE="${BASE%/}"
MARKER="${RW_PROBE_MARKER:-Real World}"   # <title> substring every page shares
CERT_WARN_DAYS="${RW_CERT_WARN_DAYS:-14}"
FAIL=0
note() { printf '  %s  %s\n' "$1" "$2"; }

echo "=== uptime probe — $BASE — $(date '+%Y-%m-%d %H:%M %Z') ==="

# 1. Page checks: status 200 + brand marker on /
for p in "" pricing.html demo.html sitemap.xml; do
  code=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$BASE/$p" || echo "000")
  if [ "$code" = "200" ]; then
    note "OK  " "/${p:-index} -> 200"
  else
    note "FAIL" "/${p:-index} -> $code"; FAIL=$((FAIL+1))
  fi
done
if ! curl -s -m 10 "$BASE/" | grep -q "$MARKER"; then
  note "FAIL" "brand marker '$MARKER' missing on / — wrong site or broken release?"
  FAIL=$((FAIL+1))
else
  note "OK  " "brand marker present on /"
fi

# 2. TLS expiry (apex only — openssl s_client)
host="${BASE#https://}"; host="${host%%/*}"
if command -v openssl >/dev/null 2>&1; then
  end=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null \
        | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
  if [ -n "$end" ]; then
    end_epoch=$(date -d "$end" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$end" +%s 2>/dev/null || echo 0)
    days=$(( (end_epoch - $(date +%s)) / 86400 ))
    if [ "$days" -lt "$CERT_WARN_DAYS" ]; then
      note "FAIL" "TLS cert expires in ${days}d (< $CERT_WARN_DAYS)"; FAIL=$((FAIL+1))
    else
      note "OK  " "TLS cert valid ${days}d more"
    fi
  else
    note "WARN" "could not read TLS cert enddate"
  fi
fi

echo "=== RESULT: $([ $FAIL -eq 0 ] && echo HEALTHY || echo "$FAIL FAILURE(S)") ==="
[ "$FAIL" -eq 0 ]
