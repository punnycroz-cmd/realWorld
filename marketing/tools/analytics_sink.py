#!/usr/bin/env python3
"""Local analytics capture sink for the Real World marketing site.

Receives events from site/js/analytics.js and appends them to NDJSON.
LOCAL DEV/TESTING ONLY — never deploys anything; production sinks are the
owner's choice (see ANALYTICS.md).

Usage:
    python3 marketing/tools/analytics_sink.py [--port 8970] [--out events.ndjson]
    python3 marketing/tools/analytics_sink.py --uniques uniques.tsv

Then serve the site with the endpoint enabled, e.g.:
    cd marketing/site && python3 -m http.server 8080
    # open http://localhost:8080 with analytics pointed at http://localhost:8970/e
    # (set data-endpoint on the script tag, or ?rw_endpoint= override below)

Send a smoke-test event:
    curl -X POST localhost:8970/e -d '{"v":1,"site":"realworld","event":"pageview","path":"/","props":{},"sid":"s1","utm":{},"ref":null,"ts":0}'

v81: the event allowlist is loaded from analytics-events.json (single
source of truth — the sink can no longer drift behind the spec). The
built-in FALLBACK list only applies if the spec file is missing.

v81: --uniques PATH implements the ANALYTICS.md §1 unique-visitor contract
locally: for every request it writes one line `YYYY-MM-DD\\t<hash>` where
hash = sha256(salt_day + client_ip + user_agent + day). The salt is
generated in memory at startup and rotated at each UTC day rollover —
discarded salts are never written, so a stored hash cannot be correlated
across days and raw IPs/UAs are never persisted. Dedup per day happens
at report time (analytics_report.py --uniques).
"""
import argparse
import hashlib
import json
import secrets
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SPEC_PATH = Path(__file__).resolve().parent.parent / "analytics-events.json"

# Last-resort allowlist, used only when analytics-events.json can't be
# read (e.g. sink copied elsewhere). Keep roughly in sync, but the spec
# file is authoritative — editing the spec extends the sink with zero
# code changes.
FALLBACK_EVENTS = {
    "pageview", "cta_click", "screenshot_view", "outbound_click",
    "scroll_depth", "engaged_time", "share_click",
    "press_kit_download", "price_calc", "scene_calc", "request_simulated",
    "watch_start", "request_submitted", "character_created",
    "community_join", "recap_open", "watch_party_rsvp",
    "tour_started", "tour_beat", "tour_completed", "tour_skipped",
    "handle_set", "wallet_explained", "topup_shown", "first_request_filed",
    "onboard_dismissed",
    "persona_chosen", "handle_taken_shown", "decline_lesson_shown",
    "returning_session",
    "review_lesson_shown", "review_outcome_seen", "low_balance_simulated",
    "handoff_seen", "hired_return",
    "queue_lesson_shown", "queue_outcome_seen", "archive_beat_seen",
}


def load_allowed_events():
    try:
        spec = json.loads(SPEC_PATH.read_text(encoding="utf-8"))
        return set(spec["events"]), f"spec:{SPEC_PATH.name}"
    except Exception:
        return set(FALLBACK_EVENTS), "builtin-fallback"


class DailyHasher:
    """Daily-rotating salted hash for unique-visitor counting (§1)."""

    def __init__(self):
        self._salts = {}  # day -> salt (in memory only, never written)

    def _salt(self, day):
        if day not in self._salts:
            self._salts = {day: secrets.token_hex(16)}  # rotate: drop all old salts
        return self._salts[day]

    def hash(self, ip, ua, now=None):
        day = datetime.fromtimestamp(
            (now or time.time() * 1000) / 1000, timezone.utc).strftime("%Y-%m-%d")
        h = hashlib.sha256(
            f"{self._salt(day)}|{ip}|{ua}|{day}".encode("utf-8")).hexdigest()[:20]
        return day, h


def make_handler(out_path, uniques_path, allowed):
    hasher = DailyHasher()

    def handler(self):
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(length) if length else b"{}"
        try:
            evt = json.loads(raw.decode("utf-8", "replace"))
        except ValueError:
            self.send_response(400)
            self.end_headers()
            return
        evt.setdefault("recv_ts", int(time.time() * 1000))
        name = evt.get("event")
        flag = "" if name in allowed else "  # UNKNOWN EVENT"
        with open(out_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(evt, sort_keys=True) + "\n")
        if uniques_path:
            day, h = hasher.hash(self.client_address[0],
                                 self.headers.get("User-Agent", ""))
            with open(uniques_path, "a", encoding="utf-8") as f:
                f.write(f"{day}\t{h}\n")
        print(f"[sink] {name} {evt.get('path', '')} {json.dumps(evt.get('props', {}))}{flag}")
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "content-type")
        self.end_headers()

    class Sink(BaseHTTPRequestHandler):
        def do_POST(self):
            handler(self)

        def do_OPTIONS(self):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Headers", "content-type")
            self.end_headers()

        def do_GET(self):
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"rw analytics sink ok\n")

        def log_message(self, *a):
            pass

    return Sink


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8970)
    ap.add_argument("--out", default="events.ndjson")
    ap.add_argument("--uniques", default=None,
                    help="sidecar TSV of daily unique-visitor hashes "
                         "(ANALYTICS.md §1 contract; raw IPs never stored)")
    args = ap.parse_args()
    allowed, src = load_allowed_events()
    print(f"[sink] event allowlist: {len(allowed)} events ({src})")
    if args.uniques:
        print(f"[sink] uniques sidecar: {args.uniques} (daily-rotating salted hash)")
    print(f"[sink] listening on http://localhost:{args.port}/e -> {args.out}")
    ThreadingHTTPServer(("127.0.0.1", args.port),
                        make_handler(args.out, args.uniques, allowed)).serve_forever()


if __name__ == "__main__":
    main()
