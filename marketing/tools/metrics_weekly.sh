#!/usr/bin/env bash
# Real World — one-command weekly metrics run (LOCAL ONLY).
#
#   ./marketing/tools/metrics_weekly.sh <capture.ndjson> [uniques.tsv]
#
# The whole Monday ritual in one shot:
#   1. validate the capture against analytics-events.json (hard gate —
#      a dirty capture never produces a report)
#   2. audit site↔spec coverage (drift gate — catches emitters/pages that
#      changed since the spec was written)
#   3. render the ANALYTICS.md §8 weekly block + §7 detail, labelled with
#      the ISO week of the newest event in the file
#   4. write it to marketing/analytics/weekly-<ISOweek>.md and print the
#      path — drop the block into MARKETINGLOG.md after filling
#      "action taken"
#
# Optional second arg: the sink's --uniques sidecar TSV (daily-hash counts).
#
# Exit 1 if validation or coverage fails — the report is only generated
# for a capture that conforms.
set -euo pipefail
cd "$(dirname "$0")/.."

NDJSON="${1:?usage: metrics_weekly.sh <capture.ndjson> [uniques.tsv]}"
UNIQUES="${2:-}"

echo "[weekly] 1/3 validating capture"
python3 tools/analytics_validate.py "$NDJSON" --warn-extra-props

echo "[weekly] 2/3 auditing site↔spec coverage"
python3 tools/analytics_coverage.py >/dev/null || {
  echo "[weekly] FAIL: site/spec drift — fix before trusting the numbers"; exit 1; }
echo "[weekly] coverage clean"

WEEK=$(python3 - "$NDJSON" <<'PY'
import json, sys, datetime
latest = 0
with open(sys.argv[1], encoding="utf-8") as f:
    for line in f:
        try:
            ts = json.loads(line).get("ts") or 0
            latest = max(latest, ts)
        except ValueError:
            pass
d = (datetime.datetime.fromtimestamp(latest / 1000, datetime.UTC)
     if latest else datetime.datetime.now(datetime.UTC))
iso = d.isocalendar()
print(f"{iso.year}-W{iso.week:02d}")
PY
)
echo "[weekly] 3/3 reporting week $WEEK"

OUT="analytics/weekly-$WEEK.md"
if [ -n "$UNIQUES" ]; then
  python3 tools/analytics_report.py "$NDJSON" --week "$WEEK" --uniques "$UNIQUES" > "$OUT"
else
  python3 tools/analytics_report.py "$NDJSON" --week "$WEEK" > "$OUT"
fi
echo "[weekly] wrote $OUT — fill 'action taken', then paste the block into MARKETINGLOG.md"
