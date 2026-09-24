#!/usr/bin/env bash
# backup_verify.sh — verify the Umami analytics backup is real, not just present.
#
# deploy/umami-backup.example's own warning: "a missed night is not an incident;
# a failed restore is." The full restore drill needs docker+Postgres on the
# host; THIS check needs neither — it proves a dump file is a valid gzip,
# is a real pg_dump, names the tables Umami can't work without, and carries
# row payload. Run it in the same cron review that checks mtimes, or wire
# `latest` mode into the backup cron itself so a hollow dump mails the owner.
#
# Modes:
#   ./tools/backup_verify.sh verify <dump.sql.gz>   # deep-check one file
#   ./tools/backup_verify.sh latest <backup-dir> [max-age-h]  # newest file
#                                                   # exists AND is fresh AND
#                                                   # passes verify (default
#                                                   # 30h > the 24h cron period)
# Exit: 0 = all checks pass, 1 = any FAIL. READ-ONLY — never writes.
#
# Cron pairing (append to the umami-backup cron line):
#   ... && /path/to/tools/backup_verify.sh latest /srv/backup/umami

set -u

mode="${1:-}"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  ok   %s\n' "$1"; }
fail() { FAIL=$((FAIL+1)); printf '  FAIL %s\n' "$1"; }

usage() {
  cat <<'EOF'
usage:
  backup_verify.sh verify <dump.sql.gz>        deep-check one pg_dump archive
  backup_verify.sh latest <dir> [max-age-h]    newest dump fresh + valid
EOF
  exit 2
}

verify_file() {
  f="$1"
  [ -f "$f" ] || { fail "missing file: $f"; return; }
  ok "exists: $f"

  # 1. gzip integrity — catches truncated uploads/copies
  if gzip -t "$f" 2>/dev/null; then ok "gzip integrity"; else fail "gzip corrupt: $f"; return; fi

  # 2. pg_dump provenance — a valid archive names itself
  if gunzip -c "$f" 2>/dev/null | head -50 | grep -q 'PostgreSQL database dump'; then
    ok "pg_dump header present"
  else
    fail "not a pg_dump archive (header missing): $f"
  fi

  # 3. Required Umami tables — schema contract the restore drill relies on.
  #    (Umami v2 core: website/session/website_event/event_data; session_data
  #    and event_data are the payload tables the funnel reads.)
  body="$(gunzip -c "$f" 2>/dev/null)"
  for t in website session website_event; do
    printf '%s' "$body" | grep -qE "(TABLE|INSERT INTO|COPY) (public\.)?\"?${t}\"?[ (]" \
      && ok "table present: $t" || fail "expected Umami table absent: $t"
  done

  # 4. Row payload — a schema-only dump restores to an empty dashboard
  rows=$(printf '%s' "$body" | grep -cE '^(INSERT INTO|COPY |[0-9a-f-]{36}\t)' || true)
  if [ "${rows:-0}" -gt 0 ]; then
    ok "row payload present (~$rows row-ish lines)"
  else
    fail "no row data found — schema-only or empty dump"
  fi
}

case "$mode" in
  verify)
    [ $# -ge 2 ] || usage
    echo "=== backup_verify — $(date '+%Y-%m-%d %H:%M %Z') ==="
    verify_file "$2"
    ;;
  latest)
    [ $# -ge 2 ] || usage
    dir="$2"; maxh="${3:-30}"
    echo "=== backup_verify latest — $dir (<${maxh}h) — $(date '+%Y-%m-%d %H:%M %Z') ==="
    newest=$(find "$dir" -name 'umami-*.sql.gz' -type f -printf '%T@ %p\n' 2>/dev/null \
             | sort -rn | head -1 | cut -d' ' -f2-)
    if [ -z "$newest" ]; then
      fail "no umami-*.sql.gz in $dir"
    else
      age_h=$(( ( $(date +%s) - $(date -r "$newest" +%s) ) / 3600 ))
      if [ "$age_h" -le "$maxh" ]; then
        ok "newest dump ${age_h}h old (<=${maxh}h): $(basename "$newest")"
      else
        fail "newest dump ${age_h}h old (> ${maxh}h) — backup cron stalled?: $(basename "$newest")"
      fi
      verify_file "$newest"
    fi
    ;;
  *) usage ;;
esac

echo "=== backup_verify: $PASS pass / $FAIL fail ==="
[ "$FAIL" -eq 0 ]
