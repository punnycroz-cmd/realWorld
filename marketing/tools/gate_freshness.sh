#!/usr/bin/env bash
# gate_freshness.sh — proof-staleness report for LAUNCH-CHECKLIST §13.
#
# Mechanical proofs decay: a dry-run logged last month says nothing about the
# tree as it stands at T-48h, and after a NO-GO or a slipped date the §6 block
# must not cite stale evidence. This tool reads the §10 rehearsal log, computes
# each proof's age against its freshness window, and reports FRESH / STALE /
# NEVER so a re-go is a checklist, not a memory test.
#
# READ-ONLY: parses LAUNCH-CHECKLIST.md and the filesystem; changes nothing.
#
# Usage:
#   ./tools/gate_freshness.sh                  # age vs today
#   ./tools/gate_freshness.sh --at YYYY-MM-DD  # age vs a target launch date
#   ./tools/gate_freshness.sh --strict         # exit 1 if any row STALE/NEVER
#
# Windows live here AND in §13's table — change one, change the other.
set -u
cd "$(dirname "$0")/.."
CL="LAUNCH-CHECKLIST.md"
SITE="site"

REF="$(date +%Y-%m-%d)"; STRICT=0
while [ $# -gt 0 ]; do
  case "$1" in
    --at) shift; REF="${1:?--at needs YYYY-MM-DD}" ;;
    --at=*) REF="${1#--at=}" ;;
    --strict) STRICT=1 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
  shift
done
NOW=$(date -d "$REF" +%s 2>/dev/null) || { echo "bad --at date: $REF" >&2; exit 2; }

echo "=== Real World GATE FRESHNESS — vs $REF ==="
echo "    §10 rehearsal-log dates + structural checks — read-only"
echo

FRESH=0; STALE=0; NEVER=0
# §10 is the append-only log: rows look like "| YYYY-MM-DD | name | result |".
LOG=$(awk '/^## §10/,/^## §11/' "$CL")

# last_date <pattern> -> last matching rehearsal date or empty
last_date() {
  echo "$LOG" | grep -iE "$1" | tail -1 | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}' | head -1
}

row() { # row <status> <name> <detail>
  case "$1" in
    FRESH) FRESH=$((FRESH+1)); printf '  [FRESH] %s — %s\n' "$2" "$3" ;;
    STALE) STALE=$((STALE+1)); printf '  [STALE] %s — %s\n' "$2" "$3" ;;
    NEVER) NEVER=$((NEVER+1)); printf '  [NEVER] %s — %s\n' "$2" "$3" ;;
  esac
}

timed() { # timed <name> <window-days> <pattern> <rerun command>
  local name="$1" win="$2" pat="$3" cmd="$4" d age
  d=$(last_date "$pat")
  if [ -z "$d" ]; then
    row NEVER "$name" "no §10 entry matches /$pat/ — run $cmd"
    return
  fi
  age=$(( (NOW - $(date -d "$d" +%s)) / 86400 ))
  if [ "$age" -le "$win" ]; then
    row FRESH "$name" "last logged $d (${age}d ago, window ${win}d)"
  else
    row STALE "$name" "last logged $d — ${age}d ago > ${win}d window — re-run $cmd"
  fi
}

# ── time-decayed proofs (window in days; mirrors §13 table) ──
echo "Rehearsal-log proofs (§10 dates)"
timed "staging dry-run"        1  'staging_dryrun'            './tools/staging_dryrun.sh'
timed "preflight go-gate"      2  'preflight\.sh'             './tools/preflight.sh'
timed "accuracy sweep"         7  'accuracy_sweep'            './tools/accuracy_sweep.py'
timed "checklist self-audit"   7  'checklist_audit'           './tools/checklist_audit.py'
timed "flip-flags round-trip" 30  'flip_flags'                './tools/flip_flags.sh --check'
timed "analytics e2e"         30  'analytics_e2e'             './tools/analytics_e2e.sh'
timed "ship.sh rehearsal"     30  'ship\.sh'                  './tools/ship.sh'
timed "host deploy drill"     30  'rehearse_host'             './tools/rehearse_host.sh'
timed "incident drill"        60  'incident_drill'            './tools/incident_drill.sh'
timed "domain-swap round-trip" 90 'swap_domain'               './tools/swap_domain.sh <domain> then --revert'
echo

# ── structural freshness (drift, not time) ──
echo "Structural freshness (drift vs live inputs)"
# gallery vs published art
PUBV=$(cat /home/hatch/workspace/your_files/sf-art-evolution/published/VERSION 2>/dev/null || echo "?")
SHOTV=$(ls "$SITE/shots/" 2>/dev/null | grep -oE 'v[0-9]+' | sort -Vu | tail -1 | tr -d 'v')
if [ -n "$SHOTV" ] && [ "$SHOTV" -ge "${PUBV:-0}" ] 2>/dev/null; then
  row FRESH "gallery vs published art" "shots v$SHOTV >= published v$PUBV"
else
  row STALE "gallery vs published art" "shots v${SHOTV:-?} < published v${PUBV:-?} — refresh per inbox procedure"
fi
# press-kit zip vs sources
ZIP="dist/real-world-press-kit.zip"
if [ -f "$ZIP" ]; then
  NEWER=$(find "$SITE" press-kit -newer "$ZIP" -type f 2>/dev/null | wc -l)
  [ "$NEWER" -eq 0 ] && row FRESH "press-kit zip" "0 newer source files" \
                     || row STALE "press-kit zip" "$NEWER file(s) newer than zip — ./build-press-kit.sh"
else
  row NEVER "press-kit zip" "$ZIP missing — ./build-press-kit.sh"
fi
# site/ changed (commit or uncommitted) since the last logged dry-run
LASTDRY=$(last_date 'staging_dryrun')
LATEST_EDIT=$( { git log -1 --format=%cs -- "$SITE" 2>/dev/null;
                 git status --short -- "$SITE" 2>/dev/null | grep -q . && date +%Y-%m-%d; } \
               | sort -u | tail -1 )
if [ -z "$LASTDRY" ]; then
  : # NEVER already reported above
elif [ -n "$LATEST_EDIT" ] && [ "$LATEST_EDIT" \> "$LASTDRY" ]; then
  row STALE "site/ vs last dry-run" "site touched $LATEST_EDIT, dry-run logged $LASTDRY — re-run staging_dryrun.sh"
else
  row FRESH "site/ vs last dry-run" "no site/ change newer than logged dry-run $LASTDRY"
fi
# uncommitted work anywhere marketing cares about
DIRTY=$(git status --short -- "$SITE" deploy tools 2>/dev/null | wc -l)
if [ "$DIRTY" -eq 0 ]; then
  row FRESH "worktree clean" "site/deploy/tools committed"
else
  row STALE "worktree clean" "$DIRTY uncommitted file(s) — a logged proof cannot cite an uncommitted tree"
fi

echo
echo "=== $FRESH fresh / $STALE stale / $NEVER never-run ==="
if [ "$STALE" -gt 0 ] || [ "$NEVER" -gt 0 ]; then
  echo "RE-GO: re-run each STALE/NEVER row, log results in §10, then re-issue the §6 block."
  [ "$STRICT" -eq 1 ] && exit 1
else
  echo "All proofs within window — §6 may cite them for a launch on $REF."
fi
exit 0
