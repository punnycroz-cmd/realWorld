#!/usr/bin/env bash
# Real World — one-command analytics pipeline test (LOCAL ONLY).
#
#   ./marketing/tools/analytics_e2e.sh
#
# What it does, in order:
#   1. generates a synthetic week of events (make_analytics_fixture.py)
#   2. starts the capture sink on 127.0.0.1:8970
#   3. POSTs every fixture event through the real HTTP path
#   4. runs analytics_report.py on what the sink wrote
#   5. asserts the funnel shows up in the report
#   6. serves the site on 127.0.0.1:8080 with ?rw_endpoint= wired so a real
#      browser visit emits live events into the same sink (manual step —
#      the script prints the URL and waits; Ctrl-C when done)
#
# Nothing leaves localhost; ports are freed on exit.
set -euo pipefail
cd "$(dirname "$0")/.."

SINK_PORT=8970
SITE_PORT=8080
WORK="$(mktemp -d /tmp/rw-analytics-e2e.XXXXXX)"
PIDS=()

cleanup() {
  for p in "${PIDS[@]:-}"; do kill "$p" 2>/dev/null || true; done
  echo "[e2e] artifacts kept in $WORK"
}
trap cleanup EXIT

echo "[e2e] 1/6 generating fixture -> $WORK/fixture.ndjson"
python3 tools/make_analytics_fixture.py --sessions 220 > "$WORK/fixture.ndjson"
wc -l < "$WORK/fixture.ndjson" | xargs echo "[e2e] fixture events:"

echo "[e2e] 2/6 starting sink on :$SINK_PORT (with --uniques sidecar)"
python3 tools/analytics_sink.py --port "$SINK_PORT" --out "$WORK/captured.ndjson" \
    --uniques "$WORK/uniques.tsv" &
PIDS+=($!)
sleep 0.5

echo "[e2e] 3/6 posting fixture through the real HTTP path"
while IFS= read -r line; do
  curl -s -o /dev/null -X POST "http://127.0.0.1:$SINK_PORT/e" \
    -H 'content-type: text/plain' -d "$line"
done < "$WORK/fixture.ndjson"

sent=$(wc -l < "$WORK/fixture.ndjson")
got=$(wc -l < "$WORK/captured.ndjson")
echo "[e2e] captured $got / $sent events"
[ "$got" -eq "$sent" ] || { echo "[e2e] FAIL: sink dropped events"; exit 1; }
# uniques sidecar: one line per request, each a daily-rotating salted hash —
# never a raw IP/UA (ANALYTICS.md §1)
grep -Eq '^[0-9]{4}-[0-9]{2}-[0-9]{2}	[0-9a-f]{20}$' "$WORK/uniques.tsv" \
  || { echo "[e2e] FAIL: uniques sidecar malformed"; exit 1; }
! grep -Eq '127\.0\.0\.1|curl/' "$WORK/uniques.tsv" \
  || { echo "[e2e] FAIL: uniques sidecar leaked raw IP/UA"; exit 1; }
echo "[e2e] uniques sidecar: $(wc -l < "$WORK/uniques.tsv") hashed rows, no raw IP/UA"

echo "[e2e] 4/6 generating report -> $WORK/report.md"
python3 tools/analytics_report.py "$WORK/captured.ndjson" --week e2e \
    --uniques "$WORK/uniques.tsv" > "$WORK/report.md"

echo "[e2e] 5/6 asserting report sanity + validating capture against the spec"
for want in "pageview" "watch_start" "request_submitted" "character_created" "funnel:"; do
  grep -q "$want" "$WORK/report.md" || { echo "[e2e] FAIL: report missing '$want'"; exit 1; }
done
python3 tools/analytics_validate.py "$WORK/captured.ndjson" --warn-extra-props \
  || { echo "[e2e] FAIL: capture violates analytics-events.json"; exit 1; }
python3 tools/ab_compare.py "$WORK/captured.ndjson" > "$WORK/ab.md" \
  && echo "[e2e] ab_compare -> $WORK/ab.md"
echo "[e2e] report head:"; head -8 "$WORK/report.md"

echo "[e2e] 6/6 serving site on :$SITE_PORT (endpoint via ?rw_endpoint=)"
(cd site && python3 -m http.server "$SITE_PORT" --bind 127.0.0.1 >/dev/null 2>&1) &
PIDS+=($!)
sleep 0.5
curl -sf -o /dev/null "http://127.0.0.1:$SITE_PORT/" || { echo "[e2e] FAIL: site not serving"; exit 1; }

cat <<EOF

[e2e] PASS — pipeline verified end to end.
[e2e] For a real-browser check, open:
        http://127.0.0.1:$SITE_PORT/?rw_endpoint=http://127.0.0.1:$SINK_PORT/e
      (the ?rw_endpoint= override only works on localhost — see analytics.js)
      Scroll/click, then Ctrl-C here and run:
        python3 tools/analytics_report.py $WORK/captured.ndjson --uniques $WORK/uniques.tsv
[e2e] Waiting — Ctrl-C to stop servers.
EOF
wait
