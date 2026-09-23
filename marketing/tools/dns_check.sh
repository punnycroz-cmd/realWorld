#!/usr/bin/env bash
# dns_check.sh — verify live DNS matches deploy/dns-records.example before
# the go-session continues (runbook step 2 → gate G3/G14).
#
# Read-only: makes DNS queries only, changes nothing.
#
# Usage:
#   ./tools/dns_check.sh example.com                  # shape checks only
#   ./tools/dns_check.sh example.com 203.0.113.10     # + apex must equal that IPv4
#   RW_PLAY_IP=203.0.113.11 RW_STATS_IP=203.0.113.10 ./tools/dns_check.sh example.com
#
# Exit 0 = every required record resolves correctly. Exit 1 = anything missing
# or mismatched. `dig` or `host` required (getent fallback for apex only).
set -uo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-}"
APEX_IP="${2:-}"
PLAY_IP="${RW_PLAY_IP:-}"
STATS_IP="${RW_STATS_IP:-}"

if ! echo "$DOMAIN" | grep -qE '^[a-z0-9]([a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$'; then
  echo "usage: $0 <domain> [apex-ipv4]   (RW_PLAY_IP/RW_STATS_IP optional env)" >&2
  exit 1
fi

PASS=0; FAIL=0
ok()  { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  FAIL  %s\n' "$1"; }

resolve_a() { # -> space-separated IPv4s, empty on failure
  if command -v dig >/dev/null; then dig +short "$1" A | grep -E '^[0-9.]+$' | tr '\n' ' '
  elif command -v host >/dev/null; then host "$1" | grep -oE 'has address [0-9.]+' | awk '{print $3}' | tr '\n' ' '
  else getent ahostsv4 "$1" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' '; fi
}
resolve_cname() {
  command -v dig >/dev/null || { echo ""; return; }
  dig +short "$1" CNAME | tr '\n' ' '
}

echo "=== Real World DNS CHECK — $DOMAIN — $(date '+%Y-%m-%d %H:%M %Z') ==="

# ── apex ─────────────────────────────────────────────────────────────
A=$(resolve_a "$DOMAIN" | xargs || true)
if [ -z "$A" ]; then bad "apex $DOMAIN has no A record"
elif [ -n "$APEX_IP" ]; then
  echo "$A" | grep -qw "$APEX_IP" && ok "apex A -> $A (matches expected $APEX_IP)" \
                                   || bad "apex A -> $A (expected $APEX_IP)"
else ok "apex A -> $A"; fi

# ── www ──────────────────────────────────────────────────────────────
W=$(resolve_cname "www.$DOMAIN" | xargs || true)
WA=$(resolve_a "www.$DOMAIN" | xargs || true)
if [ -n "$W" ]; then
  echo "$W" | grep -q "${DOMAIN}." && ok "www CNAME -> $W" || bad "www CNAME -> $W (expected $DOMAIN.)"
elif [ -n "$WA" ]; then ok "www resolves via A -> $WA (CNAME preferred per spec)"
else bad "www.$DOMAIN does not resolve"; fi

# ── play. (spectator origin) ─────────────────────────────────────────
PA=$(resolve_a "play.$DOMAIN" | xargs || true)
PC=$(resolve_cname "play.$DOMAIN" | xargs || true)
if [ -n "$PA" ]; then
  if [ -n "$PLAY_IP" ]; then
    echo "$PA" | grep -qw "$PLAY_IP" && ok "play A -> $PA" || bad "play A -> $PA (expected $PLAY_IP)"
  else ok "play resolves -> ${PC:-A} $PA"; fi
else bad "play.$DOMAIN does not resolve (demo embed origin — G12)"; fi

# ── stats. (analytics backend) ───────────────────────────────────────
SA=$(resolve_a "stats.$DOMAIN" | xargs || true)
SC=$(resolve_cname "stats.$DOMAIN" | xargs || true)
if [ -n "$SA" ]; then
  if [ -n "$STATS_IP" ]; then
    echo "$SA" | grep -qw "$STATS_IP" && ok "stats A -> $SA" || bad "stats A -> $SA (expected $STATS_IP)"
  else ok "stats resolves -> ${SC:-A} $SA"; fi
else bad "stats.$DOMAIN does not resolve (analytics endpoint — G8)"; fi

echo
echo "=== DNS RESULT: $PASS pass / $FAIL fail ==="
[ "$FAIL" -eq 0 ] && { echo "VERDICT: DNS matches spec — proceed to deploy (runbook step 3)."; exit 0; } \
                  || { echo "VERDICT: fix records above; TTL 300 means ~5 min to propagate."; exit 1; }
