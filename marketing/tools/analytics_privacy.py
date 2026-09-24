#!/usr/bin/env python3
"""Real World — privacy-contract static audit (ANALYTICS.md §1 gate).

analytics_coverage.py checks the site against the EVENT spec. This tool
checks the site against the PRIVACY contract — the load-bearing brand
promise ("we measure the funnel, not you"). It scans marketing/site for
anything that would contradict §1 before a deploy, no browser needed.

Checks:

  trackers    every <script src>, <img>, <iframe src>, <link> in site/*.html:
              FAIL on known tracker/tag-manager domains and on analytics
              account-id patterns (GA/GTM/UA/AW, fbq/mixpanel/amplitude/
              hotjar globals)
  storage     every storage key literal in site js/html: FAIL on
              identifier-shaped keys (sid/uid/uuid/visitor/client/distinct)
              persisted to localStorage; sessionStorage keys are session-
              scoped by design (PASS). Other localStorage keys WARN —
              user-facing state is legitimate but must be reviewed
  apis        FAIL on banned APIs in any site js/html: document.cookie,
              indexedDB, RTCPeerConnection, fingerprint surface
              (canvas readback, enumerateDevices, getBattery), and network
              egress (fetch/XHR/sendBeacon/Image-beacon) to a literal
              remote URL anywhere except analytics.js's ENDPOINT flow
  endpoint    data-endpoint / window.RW_ANALYTICS must NOT commit a live
              remote endpoint — the repo ships inert; the owner sets it at
              deploy (ANALYTICS.md §4). localhost/file: endpoints PASS.

Exit 0 = clean or warnings only, 1 = at least one FAIL.

Usage:
    python3 marketing/tools/analytics_privacy.py
    python3 marketing/tools/analytics_privacy.py --site marketing/site --json
"""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_PATH = ROOT / "site"

TRACKER_DOMAINS = [
    "google-analytics.com", "googletagmanager.com", "googlesyndication.com",
    "doubleclick.net", "googleadservices.com", "facebook.net",
    "connect.facebook.net", "fbcdn.net/ads", "segment.com", "segment.io",
    "cdn.segment", "mixpanel.com", "api.mixpanel", "amplitude.com",
    "cdn.amplitude", "hotjar.com", "static.hotjar", "fullstory.com",
    "clarity.ms", "mouseflow.com", "crazyegg.com", "heap.io",
    "heapanalytics.com", "posthog.com", "app.posthog", "sentry.io",
    "plausible.io", "cloud.umami.is", "stats.wp.com", "scorecardresearch.com",
    "quantserve.com", "chartbeat.com", "newrelic.com", "nr-data.net",
]

ACCOUNT_ID_RES = [
    (re.compile(r"\bUA-\d{4,}-\d+\b"), "Google Analytics UA id"),
    (re.compile(r"\bG-[A-Z0-9]{6,12}\b"), "GA4 measurement id"),
    (re.compile(r"\bGTM-[A-Z0-9]{5,}\b"), "Google Tag Manager id"),
    (re.compile(r"\bAW-\d{6,}\b"), "Google Ads conversion id"),
    (re.compile(r"\bfb[Kq]\s*\("), "Meta pixel global"),
    (re.compile(r"\bmixpanel\.(init|track)\b"), "Mixpanel api"),
    (re.compile(r"\bamplitude\.(init|getInstance)\b"), "Amplitude api"),
    (re.compile(r'\bhj\s*\(\s*["\x27]'), "Hotjar global"),
    (re.compile(r"\bposthog\.(init|capture)\b"), "PostHog api"),
    (re.compile(r"\bdata-website-id="), "Umami website id"),
]

BANNED_API_RES = [
    (re.compile(r"document\.cookie"), "document.cookie — §1: no cookies"),
    (re.compile(r"\bindexedDB\b"), "indexedDB — persistent client storage"),
    (re.compile(r"\bRTCPeerConnection\b"), "RTCPeerConnection — IP leak/fingerprint"),
    (re.compile(r"\.toDataURL\s*\("), "canvas.toDataURL — fingerprint readback"),
    (re.compile(r"\.getImageData\s*\("), "canvas.getImageData — fingerprint readback"),
    (re.compile(r"enumerateDevices\s*\("), "enumerateDevices — fingerprint surface"),
    (re.compile(r"getBattery\s*\("), "getBattery — fingerprint surface"),
    (re.compile(r"navigator\.plugins"), "navigator.plugins — fingerprint surface"),
]

# localStorage keys that are legitimate user-facing state, not identifiers.
# Anything else persisted to localStorage is a WARN (review), and anything
# identifier-shaped persisted anywhere beyond sessionStorage is a FAIL.
LOCAL_KEY_ALLOW = {
    "rw:no-collect",       # the opt-out itself
    "rw_watchcard_v1",     # demo watch-card state (user's own card)
    "rw_wire_follows",     # wire page follow toggles
    "rw_wire_density",     # wire page density preference
}
ID_KEY_RE = re.compile(r"(^|[._:\-])(sid|uid|uuid|visitor|client[_\-]?id|"
                       r"distinct|device[_\-]?id|anon[_\-]?id|fingerprint)([._:\-]|$)",
                       re.I)
STORE_KEY_RES = [
    ("localStorage", re.compile(r"localStorage\.(?:setItem|getItem)\s*\(\s*['\"]([^'\"]+)")),
    ("localStorage[]", re.compile(r"localStorage\s*\[\s*['\"]([^'\"]+)['\"]\s*\]")),
    ("sessionStorage", re.compile(r"sessionStorage\.(?:setItem|getItem)\s*\(\s*['\"]([^'\"]+)")),
]
# Egress: literal remote URLs inside network calls. analytics.js builds its
# body from ENDPOINT (a variable) — literal http(s) inside a call anywhere
# else is a pixel/beacon smell.
EGRESS_RE = re.compile(
    r"(fetch|XMLHttpRequest|sendBeacon|new\s+Image|navigator\.sendBeacon)"
    r"[^\n;]{0,200}?[\"']https?://([^/\"']+)")
TAG_RE = re.compile(
    r"<(?:script|img|iframe|link)\b[^>]*?(?:src|href)\s*=\s*[\"']https?://([^/\"']+)",
    re.I)
ENDPOINT_ATTR_RE = re.compile(r"data-endpoint\s*=\s*[\"']([^\"']+)")
RWCFG_ENDPOINT_RE = re.compile(r"RW_ANALYTICS[^}]*?endpoint\s*:\s*[\"']([^\"']+)")

PASS = WARN = FAIL = 0


def ok(m):
    global PASS
    PASS += 1
    print(f"  PASS  {m}")


def warn(m):
    global WARN
    WARN += 1
    print(f"  WARN  {m}")


def bad(m):
    global FAIL
    FAIL += 1
    print(f"  FAIL  {m}")


def is_local(host):
    return host.split(":")[0] in ("localhost", "127.0.0.1", "::1", "[::1]")


def scan_trackers(html_files, js_files):
    before = FAIL
    for f in html_files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for m in TAG_RE.finditer(text):
            host = m.group(1).lower()
            for dom in TRACKER_DOMAINS:
                if dom in host:
                    bad(f"{f.name}: external tag to tracker domain {host}")
                    break
        for rx, label in ACCOUNT_ID_RES:
            for m in rx.finditer(text):
                bad(f"{f.name}: {label} literal '{m.group(0)}'")
    for f in js_files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for rx, label in ACCOUNT_ID_RES:
            for m in rx.finditer(text):
                bad(f"{f.name}: {label} literal '{m.group(0)}'")
    if FAIL == before:
        ok("no tracker domains or account ids in site markup/js")


def scan_apis(files):
    hits = 0
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for rx, why in BANNED_API_RES:
            for m in rx.finditer(text):
                bad(f"{f.name}: {m.group(0).strip()} — {why}")
                hits += 1
        for m in EGRESS_RE.finditer(text):
            host = m.group(2).lower()
            if f.name == "analytics.js":
                # analytics.js only ever sends to ENDPOINT (a variable);
                # a literal URL inside a call there is still suspicious.
                bad(f"{f.name}: literal remote URL in network call → {host}")
                hits += 1
            elif not is_local(host):
                bad(f"{f.name}: literal remote egress → {host}")
                hits += 1
    if not hits:
        ok("no banned APIs or literal remote egress")


def scan_storage(files):
    seen_warn = set()
    before = FAIL
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for kind, rx in STORE_KEY_RES:
            for m in rx.finditer(text):
                key = m.group(1)
                if kind.startswith("sessionStorage"):
                    continue  # dies with the tab — contract-clean
                if key in LOCAL_KEY_ALLOW:
                    continue
                if ID_KEY_RE.search(key):
                    bad(f"{f.name}: localStorage key '{key}' looks like a "
                        f"persistent identifier — §1 forbids it")
                elif key not in seen_warn:
                    seen_warn.add(key)
                    warn(f"{f.name}: localStorage key '{key}' — user-facing "
                         f"state? confirm it stores no identifier")
    if FAIL == before:
        ok("no persistent-identifier storage keys "
           "(allowlist: " + ", ".join(sorted(LOCAL_KEY_ALLOW)) + ")")


def scan_endpoint(html_files):
    committed = []
    for f in html_files:
        text = f.read_text(encoding="utf-8", errors="replace")
        for rx in (ENDPOINT_ATTR_RE, RWCFG_ENDPOINT_RE):
            for m in rx.finditer(text):
                committed.append((f.name, m.group(1)))
    if not committed:
        ok("no endpoint committed — site ships inert (ANALYTICS.md §4)")
        return
    for name, url in committed:
        host = url.split("//")[-1].split("/")[0]
        if is_local(host):
            warn(f"{name}: local endpoint '{url}' committed — fine for dev, "
                 f"strip before deploy")
        else:
            bad(f"{name}: live endpoint '{url}' committed — the repo ships "
                f"inert; the owner sets data-endpoint at deploy (§4)")


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(SITE_PATH))
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    site = Path(args.site)
    html = sorted(site.glob("*.html"))
    js = sorted((site / "js").glob("*.js"))
    all_files = html + js

    print(f"[privacy] auditing {len(html)} pages + {len(js)} js under {site}")
    print("[privacy] trackers/account ids")
    scan_trackers(html, js)
    print("[privacy] banned APIs + egress")
    scan_apis(all_files)
    print("[privacy] storage keys")
    scan_storage(all_files)
    print("[privacy] endpoint hygiene")
    scan_endpoint(html)

    print(f"[privacy] {PASS} pass · {WARN} warn · {FAIL} fail")
    if args.json:
        print(json.dumps({"pass": PASS, "warn": WARN, "fail": FAIL}))
    sys.exit(1 if FAIL else 0)


if __name__ == "__main__":
    main()
