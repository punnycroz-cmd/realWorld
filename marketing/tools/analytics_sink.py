#!/usr/bin/env python3
"""Local analytics capture sink for the Real World marketing site.

Receives events from site/js/analytics.js and appends them to NDJSON.
LOCAL DEV/TESTING ONLY — never deploys anything; production sinks are the
owner's choice (see ANALYTICS.md).

Usage:
    python3 marketing/tools/analytics_sink.py [--port 8970] [--out events.ndjson]

Then serve the site with the endpoint enabled, e.g.:
    cd marketing/site && python3 -m http.server 8080
    # open http://localhost:8080 with analytics pointed at http://localhost:8970/e
    # (set data-endpoint on the script tag, or ?rw_endpoint= override below)

Send a smoke-test event:
    curl -X POST localhost:8970/e -d '{"v":1,"site":"realworld","event":"pageview","path":"/","props":{},"sid":"s1","utm":{},"ref":null,"ts":0}'
"""
import argparse
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALLOWED_EVENTS = {
    "pageview", "cta_click", "screenshot_view", "outbound_click",
    "scroll_depth", "engaged_time", "share_click",
    "press_kit_download", "price_calc", "request_simulated",
    "watch_start", "request_submitted", "character_created",
    # community funnel (v39 — see marketing/community/)
    "community_join", "recap_open", "watch_party_rsvp",
    # onboarding (world-v11 onboarding.json analytics_hooks — game-side at merge)
    "tour_started", "tour_beat", "tour_completed", "tour_skipped",
    "handle_set", "wallet_explained", "topup_shown", "first_request_filed",
    "onboard_dismissed",
}


def make_handler(out_path):
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
        flag = "" if name in ALLOWED_EVENTS else "  # UNKNOWN EVENT"
        with open(out_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(evt, sort_keys=True) + "\n")
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
    args = ap.parse_args()
    print(f"[sink] listening on http://localhost:{args.port}/e -> {args.out}")
    ThreadingHTTPServer(("127.0.0.1", args.port), make_handler(args.out)).serve_forever()


if __name__ == "__main__":
    main()
