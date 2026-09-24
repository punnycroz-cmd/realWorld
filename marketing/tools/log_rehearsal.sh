#!/usr/bin/env bash
# log_rehearsal.sh — append a row to LAUNCH-CHECKLIST §10 the right way.
#
# §10 is the append-only rehearsal log every gate cites as evidence. Rows kept
# getting pasted at END-OF-FILE instead — orphaned under §13/§16 where
# gate_freshness.sh (which only reads between "## §10" and "## §11") can't see
# them. This tool inserts the row at the end of the §10 table so the log,
# the freshness windows, and the audit all agree on what was proven when.
#
# WRITES: LAUNCH-CHECKLIST.md only (one table row). Nothing else.
#
# Usage:
#   ./tools/log_rehearsal.sh "staging_dryrun.sh (vNN)" "41 pass / 2 warn / 0 fail"
#   ./tools/log_rehearsal.sh --date 2026-09-24 "name" "result"
set -u
cd "$(dirname "$0")/.."
CL="LAUNCH-CHECKLIST.md"

DATE="$(date +%Y-%m-%d)"
if [ "${1:-}" = "--date" ]; then
  DATE="${2:?--date needs YYYY-MM-DD}"; shift 2
fi
NAME="${1:?usage: log_rehearsal.sh [--date YYYY-MM-DD] <rehearsal> <result>}"
RESULT="${2:?usage: log_rehearsal.sh [--date YYYY-MM-DD] <rehearsal> <result>}"

[ -f "$CL" ] || { echo "no $CL" >&2; exit 1; }
case "$DATE" in
  ????-??-??) : ;;
  *) echo "bad date: $DATE" >&2; exit 2 ;;
esac
# table cells can't contain raw pipes
NAME="${NAME//|//}"; RESULT="${RESULT//|//}"
ROW="| $DATE | $NAME | $RESULT |"

# insert immediately before the "## §11" heading (end of the §10 table)
if grep -q '^## §11' "$CL"; then
  awk -v row="$ROW" '
    /^## §11/ && !done { print row; done=1 }
    { print }
    END { if (!done) exit 3 }
  ' "$CL" > "$CL.tmp" || { rm -f "$CL.tmp"; echo "§11 heading not found" >&2; exit 3; }
  mv "$CL.tmp" "$CL"
else
  echo "§11 heading not found in $CL" >&2; exit 3
fi
echo "logged: $ROW"
