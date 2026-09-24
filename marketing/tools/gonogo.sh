#!/usr/bin/env bash
# gonogo.sh — prints the §6 GO/NO-GO block pre-filled with the LIVE mechanical
# gate status, ready to paste into the owner decision thread at T-48h.
# Reads only; changes nothing; makes no network calls.
#
# Usage: ./tools/gonogo.sh           (run from marketing/ or repo root)
#
# Gate status source of truth per gate:
#   mechanical — derived from the files in this worktree (marked AUTO)
#   owner      — a decision/signature, never derivable (marked OWNER)
#   track      — another loop's build must land (marked TRACK)
set -u
cd "$(dirname "$0")/.."
SITE="site"

GREEN=0; PENDING=0
g() { # g <status-icon> <gate-id> <label>
  printf '  %-4s  G%-2s  %s\n' "$1" "$2" "$3"
}
auto_ok()   { GREEN=$((GREEN+1));   g "[x]" "$1" "$2 (AUTO: $3)"; }
auto_pend() { PENDING=$((PENDING+1)); g "[ ]" "$1" "$2 (AUTO: $3)"; }
owner()     { PENDING=$((PENDING+1)); g "[ ]" "$1" "$2 (OWNER decision)"; }
track()     { PENDING=$((PENDING+1)); g "[ ]" "$1" "$2 (TRACK: $3)"; }

echo "=== Real World GO/NO-GO worksheet — $(date '+%Y-%m-%d %H:%M %Z') ==="
echo "    branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null) @ $(git rev-parse --short HEAD 2>/dev/null)"
echo

# ── G10 — staging dry-run (run once up front, quietly) ──
DRYLINE=$(./tools/staging_dryrun.sh 8139 2>&1 | tail -1)
if echo "$DRYLINE" | grep -qE '[1-9][0-9]* fail'; then
  auto_pend 10 "staging dry-run clean" "FAILED — $DRYLINE"
elif echo "$DRYLINE" | grep -qE '[1-9][0-9]* warn'; then
  auto_pend 10 "staging dry-run clean" "$DRYLINE (warns ok pre-G3; fails not)"
else
  auto_ok 10 "staging dry-run clean" "$DRYLINE"
fi

# ── G3 — domain swap ──
DOMHITS=$(grep -rIl --exclude-dir=shots 'realworld-game.example' "$SITE" 2>/dev/null | wc -l)
if [ "$DOMHITS" -eq 0 ]; then
  auto_ok 3 "real domain swapped everywhere" "0 placeholder files"
else
  auto_pend 3 "real domain registered + swept" "$DOMHITS file(s) still hold realworld-game.example"
fi

# ── G4 — pricing flag ──
PRICING=$(grep -o 'data-pricing="[a-z]*"' "$SITE/pricing.html" | head -1 | cut -d'"' -f2)
if [ "$PRICING" = "final" ]; then
  auto_ok 4 "pricing flip" "data-pricing=\"final\""
else
  auto_pend 4 "pricing flip" "data-pricing=\"${PRICING:-missing}\" — owner approves numbers, one attribute"
fi

# ── G5 — gallery freshness vs published art ──
PUBV=$(cat /home/hatch/workspace/your_files/sf-art-evolution/published/VERSION 2>/dev/null || echo "?")
SHOTV=$(ls "$SITE/shots/" 2>/dev/null | grep -oE 'v[0-9]+' | sort -Vu | tail -1 | tr -d 'v')
if [ -n "$PUBV" ] && [ -n "$SHOTV" ] && [ "$SHOTV" -ge "$PUBV" ] 2>/dev/null; then
  auto_ok 5 "gallery at latest published art" "shots v$SHOTV >= published v$PUBV"
else
  auto_pend 5 "gallery refresh available" "shots v${SHOTV:-?} < published v${PUBV:-?} — refresh per inbox procedure"
fi

# ── G8 — analytics endpoint ──
EP=$(grep -o 'data-endpoint="[^"]*"' "$SITE/index.html" | head -1)
if [ -n "$EP" ]; then
  auto_ok 8 "analytics wired" "$EP on index"
else
  auto_pend 8 "analytics backend" "shim inert — owner picks backend, set data-endpoint"
fi

# ── G9 — press-kit zip freshness ──
ZIP="dist/real-world-press-kit.zip"
if [ -f "$ZIP" ]; then
  NEWER=$(find "$SITE" press-kit -newer "$ZIP" -type f 2>/dev/null | wc -l)
  if [ "$NEWER" -eq 0 ]; then
    auto_ok 9 "press-kit zip fresh" "0 newer source files"
  else
    auto_pend 9 "press-kit zip rebuild" "$NEWER file(s) newer than $ZIP — run ./build-press-kit.sh"
  fi
else
  auto_pend 9 "press-kit zip rebuild" "$ZIP missing — run ./build-press-kit.sh"
fi

# ── G12 — demo embed ──
DSRC=$(grep -o 'data-demo-src="[^"]*"' "$SITE/demo.html" | head -1 | cut -d'"' -f2)
if [ -n "$DSRC" ]; then
  auto_ok 12 "demo embed live" "data-demo-src=$DSRC"
else
  auto_pend 12 "demo embed" "data-demo-src empty — fallback gallery until spectator build URL"
fi

# ── G18 — public-copy accuracy sweep ──
ACC=$(./tools/accuracy_sweep.py 2>&1 | tail -1)
if echo "$ACC" | grep -qE '[1-9][0-9]* fail'; then
  auto_pend 18 "public-copy accuracy" "FAILED — $ACC"
else
  auto_ok 18 "public-copy accuracy" "$ACC"
fi

# ── Owner gates ──
owner 1  "public launch approval in writing (§6)"
track 2  "game build verified live + stable for spectators" "game-systems"
owner 6  "press email + social handles registered"
owner 7  "legal pass: payments, refunds, privacy, age posture"
owner 11 "community surfaces created (COMMUNITY-FUNNEL §3)"
owner 13 "feed display-filter option A/B/C picked (MODERATION-PLAN §2.3)"
owner 14 "infrastructure provisioned (INFRASTRUCTURE §5 runbook)"
track 15 "feed vocab diff vs world/feed.json request_status" "world"
track 16 "onboarding flow + 36 hooks verified on staging" "world-v109 contract + game emitters"
owner 17 "human playtest: 0 open blockers on launch candidate (world/playtest.html PT1-PT104)"

echo
echo "  AUTO green: $GREEN · pending (owner/track/auto): $PENDING of 18"
echo
echo "─── paste into the owner decision thread ───"
cat <<EOF
GO/NO-GO — Real World launch, <date>
Gates: $GREEN/18 auto-green, $PENDING pending (see worksheet $(date '+%Y-%m-%d'))
Blocking items: <list or none>
Known warnings: <dry-run warns accepted as non-blocking>
Accuracy sweep (G18): <0 fail>
Feed display-filter option (G13): A / B / C — <pick>
Onboarding hooks (G16): <staging run logged — 36-hook set incl. ?hired=1 return + S7 first visit + privacy/data-card/flag beats + four band paths>
Human playtest (G17): <report logged — 0 open blockers, N majors dispositioned>
Decision: GO / NO-GO — <owner name>, <timestamp>
EOF
echo "────────────────────────────────────────────"
echo "Mechanical go-gate: ./tools/preflight.sh (dry-run + secrets + switches)."
