#!/usr/bin/env python3
"""Generate a synthetic-but-realistic week of analytics events as NDJSON.

Used by analytics_e2e.sh to exercise the sink + report pipeline locally,
and committed output (marketing/analytics/sample-week.ndjson) documents
what the collector sees once live. No real traffic involved — every sid
is fabricated.

Usage:
    python3 marketing/tools/make_analytics_fixture.py > events.ndjson
    python3 marketing/tools/make_analytics_fixture.py --sessions 400
"""
import argparse
import json
import random

PAGES = [
    ("/", "index", 30), ("/features.html", "features", 14),
    ("/how-it-works.html", "how-it-works", 14), ("/demo.html", "demo", 18),
    ("/pricing.html", "pricing", 10), ("/faq.html", "faq", 6),
    ("/cast.html", "cast", 8), ("/journal.html", "journal", 6),
    ("/community.html", "community", 4), ("/rules.html", "rules", 3),
    ("/press-kit.html", "press-kit", 3),
]
UTMS = [
    {"utm_source": "bsky", "utm_medium": "social", "utm_campaign": "launch-2026"},
    {"utm_source": "x", "utm_medium": "social", "utm_campaign": "launch-2026"},
    {"utm_source": "rps", "utm_medium": "press", "utm_campaign": "press-embargo"},
    {"utm_source": "itch", "utm_medium": "store", "utm_campaign": "store-launch"},
    {"utm_source": "discord", "utm_medium": "community", "utm_campaign": "launch-2026"},
]
REFS = ["bsky.app", "pcgamer.com", "itch.io", "news.ycombinator.com", None, None]
SHOTS = ["v19-A.png", "v19-B.png", "v19-C.png", "v19-D.png",
         "v16-int-cafe.png", "v16-int-flat.png", "v1-A.png"]
CTAS = ["hero", "walkthrough", "footer", "nav", "demo-hero", "demo-ladder",
        "pricing-teaser", "faq-exit"]


def evt(name, path, sid, props=None, utm=None, ref=None, ts=0):
    return {"v": 1, "site": "realworld", "event": name, "path": path,
            "props": props or {}, "sid": sid, "utm": utm or {},
            "ref": ref, "ts": ts}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sessions", type=int, default=220)
    ap.add_argument("--seed", type=int, default=21)
    args = ap.parse_args()
    rnd = random.Random(args.seed)

    total_w = sum(w for _, _, w in PAGES)
    base_ts = 1_758_000_000_000  # arbitrary fixed epoch ms

    for i in range(args.sessions):
        sid = f"s{i:04x}{rnd.getrandbits(24):06x}"
        ts = base_ts + rnd.randrange(7 * 24 * 3600 * 1000)
        r = rnd.randrange(total_w)
        acc = 0
        for path, slug, w in PAGES:
            acc += w
            if r < acc:
                break
        utm = rnd.choice(UTMS) if rnd.random() < 0.45 else {}
        ref = rnd.choice(REFS)
        yield_evt = lambda *a, **k: print(json.dumps(evt(*a, **k), sort_keys=True))

        yield_evt("pageview", path, sid,
                  {"title": "Real World", "page": slug, "vw": rnd.choice([390, 768, 1440, 1920]),
                   "lang": rnd.choice(["en-US", "en-GB", "en-US", "de-DE"])},
                  utm=utm, ref=ref, ts=ts)

        # session flow — each deeper stage is a subset
        if rnd.random() < 0.72:  # scrolled
            for m in (25, 50, 75, 100):
                if rnd.random() < {25: .95, 50: .8, 75: .55, 100: .3}[m]:
                    yield_evt("scroll_depth", path, sid, {"depth": m, "page": slug},
                              utm=utm, ref=ref, ts=ts + m * 900)
        if rnd.random() < 0.4:
            yield_evt("cta_click", path, sid,
                      {"cta": rnd.choice(CTAS), "dest": "demo", "href": "demo.html"},
                      utm=utm, ref=ref, ts=ts + 5000)
        if rnd.random() < 0.25:
            yield_evt("screenshot_view", path, sid,
                      {"shot": "shots/" + rnd.choice(SHOTS), "alt": "dev build capture"},
                      utm=utm, ref=ref, ts=ts + 8000)
        if rnd.random() < 0.28:  # watch
            yield_evt("watch_start", "/demo.html", sid,
                      {"source": "demo_page", "mode": rnd.choice(["live", "fallback"])},
                      utm=utm, ref=ref, ts=ts + 12000)
            if rnd.random() < 0.22:  # request
                yield_evt("request_submitted", "/demo.html", sid,
                          {"class": rnd.choice(["compatible", "exclusive", "queued"]),
                           "credits": rnd.choice([15, 60, 90]), "duration_min": rnd.choice([10, 15, 30])},
                          utm=utm, ref=ref, ts=ts + 60000)
                if rnd.random() < 0.35:  # create
                    yield_evt("character_created", "/demo.html", sid,
                              {"source": rnd.choice(["cta", "post-request"])},
                              utm=utm, ref=ref, ts=ts + 120000)
        yield_evt("engaged_time", path, sid,
                  {"seconds": rnd.randrange(4, 300), "page": slug},
                  utm=utm, ref=ref, ts=ts + 300000)


if __name__ == "__main__":
    main()
