#!/usr/bin/env bash
# stage_gates.sh — "where are we on the proof ladder?" — live status for the
# monetization stage gates in LAUNCH-CHECKLIST §17 (production-3 direction:
# prove return visits → subscriptions → capped attributed sponsorship).
#
# READ-ONLY: it inspects the worktree and reports; it never flips a switch,
# never deploys, never touches the network. The stage decision itself is an
# owner row — this script only collects the evidence for it.
#
# Usage:
#   ./tools/stage_gates.sh                          # artifact + evidence status
#   RW_RETENTION_TSV=path/to.tsv ./tools/stage_gates.sh   # + live retention numbers
#
# Exit 0 always (this is a dashboard, not a gate — the owner is the gate).
set -u
cd "$(dirname "$0")/.."
SITE="site"
GREEN=0; PEND=0

g() { GREEN=$((GREEN+1)); printf '  [done]    %s\n' "$1"; }
p() { PEND=$((PEND+1));  printf '  [pending] %s\n' "$1"; }
i() {                    printf '  [info]    %s\n' "$1"; }

echo "=== Real World STAGE GATES — $(date '+%Y-%m-%d %H:%M %Z') ==="
echo "    proof ladder vs LAUNCH-CHECKLIST §17 — read-only"
echo

# ── Stage 1: return visits (the north star) ──────────────────────────
echo "Stage 1 — return visits before anything is sold"
TSV="${RW_RETENTION_TSV:-}"
if [ -z "$TSV" ] && [ -f analytics/retention.tsv ]; then
  TSV="analytics/retention.tsv"
fi
if [ -n "$TSV" ] && [ -f "$TSV" ]; then
  J=$(python3 tools/analytics_retention.py "$TSV" --json 2>/dev/null)
  R7=$(printf '%s' "$J" | python3 -c 'import json,sys; print(json.load(sys.stdin)["returning_viewers_7d"])' 2>/dev/null)
  V7=$(printf '%s' "$J" | python3 -c 'import json,sys; print(json.load(sys.stdin)["viewers_7d"])' 2>/dev/null)
  SH=$(printf '%s' "$J" | python3 -c 'import json,sys; s=json.load(sys.stdin).get("return_share_7d"); print("%d%%" % (s*100) if s is not None else "n/a")' 2>/dev/null)
  MD=$(printf '%s' "$J" | python3 -c 'import json,sys; m=json.load(sys.stdin).get("median_days_to_return"); print(m if m is not None else "n/a")' 2>/dev/null)
  i "retention sidecar: $TSV"
  i "returning_viewers_7d = ${R7:-?} of ${V7:-?} viewers (${SH:-?}) — median days-to-return ${MD:-?}"
  i "owner compares this against the §6 threshold before any stage-2 talk"
else
  p "no retention sidecar — deploy analytics backend (G8) with sink --retention, or set RW_RETENTION_TSV=<path>"
fi
if grep -q '"id": "return-7d"' analytics/goals.json 2>/dev/null; then
  g "M12 counter wired — goals.json return-7d goal + analytics_retention.py report exist"
else
  p "goals.json missing the return-7d goal — check analytics/goals.json"
fi
CTS="${RW_COST_TSV:-}"
if [ -z "$CTS" ] && [ -f analytics/cost-ledger.tsv ]; then
  CTS="analytics/cost-ledger.tsv"
fi
if [ -n "$CTS" ] && [ -f "$CTS" ]; then
  CJ=$(python3 tools/cost_ledger.py report "$CTS" --json 2>/dev/null)
  CPS=$(printf '%s' "$CJ" | python3 -c 'import json,sys; v=json.load(sys.stdin).get("cost_per_sim_day"); print("$%.4f"%v if v is not None else "n/a")' 2>/dev/null)
  SPD=$(printf '%s' "$CJ" | python3 -c 'import json,sys; print("$%.2f"%json.load(sys.stdin).get("spend_total",0))' 2>/dev/null)
  SMD=$(printf '%s' "$CJ" | python3 -c 'import json,sys; print("%g"%json.load(sys.stdin).get("sim_days_total",0))' 2>/dev/null)
  T7=$(printf '%s' "$CJ" | python3 -c 'import json,sys; v=json.load(sys.stdin)["trailing_7d"]["cost_per_sim_day"]; print("$%.4f"%v if v is not None else "n/a")' 2>/dev/null)
  i "cost ledger: $CTS"
  i "cost/sim-day = ${CPS:-?} (trailing 7d ${T7:-?}) — ${SPD:-?} over ${SMD:-?} sim-days; sim_days rows still come from the game track's sim clock"
else
  p "no cost ledger — start one: tools/cost_ledger.py add cost|mod_hours|sim_days <value> <category> [note] (or set RW_COST_TSV=<path>); §17 needs it at T+7d"
fi
echo

# ── Stage 2: subscriptions (only after stage 1 is proven) ────────────
echo "Stage 2 — subscriptions (archival depth / editions / export tools)"
if grep -q 'id="order"' "$SITE/pricing.html" 2>/dev/null; then
  g "pricing.html #order prints the staging publicly — stage-2 copy already honest about 'only when proven'"
else
  p "pricing.html #order section missing — the public staging promise is not on the page"
fi
PRICE=$(grep -oE 'data-pricing="[^"]*"' "$SITE/pricing.html" | head -1 | cut -d'"' -f2)
if [ "$PRICE" = "final" ]; then
  i "data-pricing=final — numbers owner-approved (stage-2 flip still needs a §17 stage-1 proof first)"
else
  g "data-pricing=${PRICE:-unset} — correct for stage 1 (nothing is being sold as proven yet)"
fi
if grep -qi 'Resident' "$SITE/pricing.html" 2>/dev/null && grep -qi 'Director' "$SITE/pricing.html" 2>/dev/null; then
  g "subscription copy drafted (Resident/Director tiers on the provisional ladder)"
else
  p "subscription tier copy missing from pricing.html"
fi
i "free floor: basic watching + enough catch-up stays free — verify any stage-2 page keeps that line"
echo

# ── Stage 3: capped attributed sponsorship ───────────────────────────
echo "Stage 3 — capped, publicly attributed opportunity sponsorship"
if [ -f "$SITE/refunds.html" ]; then
  g "refunds.html exists — delivery/refusal/refund terms page ready to extend to sponsored rows"
else
  p "refunds.html missing — stage-3 needs explicit delivery/refusal/refund terms"
fi
if grep -qi 'attribut' "$SITE/pricing.html" 2>/dev/null || grep -qi 'sponsor' "$SITE/pricing.html" 2>/dev/null; then
  g "sponsorship language present on pricing page (attributed, capped, provisional)"
else
  p "no sponsorship language on pricing.html — fine while stage 3 is distant; revisit when stage 2 opens"
fi
echo

# ── the never-list ────────────────────────────────────────────────────
echo "Never-list sweep (hard NOs — should appear only negated)"
NEVER=0
for f in "$SITE"/*.html; do
  # crude: flag lines promising unlimited worlds or consciousness
  if grep -inE 'unlimited (living )?worlds' "$f" | grep -ivE 'never|no |not ' >/dev/null 2>&1; then
    p "$(basename "$f") — 'unlimited worlds' phrasing without negation cue (accuracy_sweep.py is the real check)"
    NEVER=1
  fi
  if grep -inE 'conscious|sentien' "$f" | grep -ivE 'never|no |not |claim' >/dev/null 2>&1; then
    i "$(basename "$f") mentions consciousness — verify it is a disclaimer, not a claim"
    NEVER=1
  fi
done
[ "$NEVER" -eq 0 ] && g "no un-negated never-list phrasing found by this sweep (accuracy_sweep.py remains the gate)"
echo

echo "=== $GREEN done / $PEND pending ==="
echo "The ladder moves on owner decision only — see §17's decision log."
exit 0
