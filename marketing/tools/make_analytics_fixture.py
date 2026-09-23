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
    {"utm_source": "bsky", "utm_medium": "social", "utm_campaign": "launch-2026",
     "utm_content": "thumb-a"},
    {"utm_source": "x", "utm_medium": "social", "utm_campaign": "launch-2026",
     "utm_content": "thumb-b"},
    {"utm_source": "rps", "utm_medium": "press", "utm_campaign": "press-embargo"},
    {"utm_source": "itch", "utm_medium": "store", "utm_campaign": "store-launch"},
    {"utm_source": "discord", "utm_medium": "community", "utm_campaign": "launch-2026"},
]
REFS = ["bsky.app", "pcgamer.com", "itch.io", "news.ycombinator.com", None, None]
SHOTS = ["v44-A.png", "v44-B.png", "v44-C.png", "v44-D.png",
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
        if rnd.random() < 0.18:  # request simulator on demo page
            yield_evt("request_simulated", "/demo.html", sid,
                      {"action": rnd.choice(["possess", "venue", "weather"]),
                       "class": rnd.choice(["compatible", "exclusive", "flat"]),
                       "minutes": rnd.choice([5, 10, 30]),
                       "credits": rnd.choice([8, 45, 90, 180])},
                      utm=utm, ref=ref, ts=ts + 20000)
        if rnd.random() < 0.15:  # community intent: invite click / recap read
            yield_evt("community_join", "/community.html", sid,
                      {"surface": rnd.choice(["community.html", "demo.html", "recap-post"])},
                      utm=utm, ref=ref, ts=ts + 10000)
        if rnd.random() < 0.2:
            yield_evt("recap_open", "/recap-2026-09-20.html", sid,
                      {"issue": "recap-2026-09-20", "surface": rnd.choice(["devlog", "site"])},
                      utm=utm, ref=ref, ts=ts + 11000)
        if rnd.random() < 0.28:  # watch
            yield_evt("watch_start", "/demo.html", sid,
                      {"source": "demo-page", "mode": rnd.choice(["live", "fallback"])},
                      utm=utm, ref=ref, ts=ts + 12000)
            if rnd.random() < 0.5:  # onboarding tour (world-v11/v25/v39 hooks, game-side)
                yield_evt("persona_chosen", "/demo.html", sid,
                          {"stage": "s0", "persona": "play" if rnd.random() < 0.35 else "watch"},
                          utm=utm, ref=ref, ts=ts + 14000)
                yield_evt("tour_started", "/demo.html", sid,
                          {"stage": "s1", "opted_out": False},
                          utm=utm, ref=ref, ts=ts + 15000)
                for beat in range(1, 5):
                    if rnd.random() < 0.85:
                        yield_evt("tour_beat", "/demo.html", sid,
                                  {"beat": beat, "stage": "s1"},
                                  utm=utm, ref=ref, ts=ts + 15000 + beat * 8000)
                    else:
                        yield_evt("tour_skipped", "/demo.html", sid,
                                  {"stage": "s1", "at_beat": beat - 1},
                                  utm=utm, ref=ref, ts=ts + 15000 + beat * 8000)
                        break
                else:
                    yield_evt("tour_completed", "/demo.html", sid, {"stage": "s1"},
                              utm=utm, ref=ref, ts=ts + 52000)
                if rnd.random() < 0.6:
                    if rnd.random() < 0.25:  # reserved/taken name rejected first (v25)
                        yield_evt("handle_taken_shown", "/demo.html", sid, {"stage": "s2"},
                                  utm=utm, ref=ref, ts=ts + 55000)
                    yield_evt("handle_set", "/demo.html", sid, {"stage": "s2"},
                              utm=utm, ref=ref, ts=ts + 56000)
                if rnd.random() < 0.7:
                    yield_evt("wallet_explained", "/demo.html", sid, {"stage": "s3"},
                              utm=utm, ref=ref, ts=ts + 60000)
                    if rnd.random() < 0.4:
                        yield_evt("topup_shown", "/demo.html", sid, {"stage": "s3"},
                                  utm=utm, ref=ref, ts=ts + 62000)
                if rnd.random() < 0.3:  # declined-request refund lesson (v25 S4b)
                    yield_evt("decline_lesson_shown", "/demo.html", sid, {"stage": "s4b"},
                              utm=utm, ref=ref, ts=ts + 63000)
                if rnd.random() < 0.35:  # human-review lesson (v39 S4c)
                    yield_evt("review_lesson_shown", "/demo.html", sid, {"stage": "s4c"},
                              utm=utm, ref=ref, ts=ts + 63500)
                    yield_evt("review_outcome_seen", "/demo.html", sid,
                              {"stage": "s4c", "outcome": "not approved"},
                              utm=utm, ref=ref, ts=ts + 63600)
                if rnd.random() < 0.2:  # opt-in low-balance sim (v39)
                    yield_evt("low_balance_simulated", "/demo.html", sid,
                              {"stage": "s5", "opted_in": True},
                              utm=utm, ref=ref, ts=ts + 63700)
                    yield_evt("handoff_seen", "/demo.html", sid, {"stage": "s5"},
                              utm=utm, ref=ref, ts=ts + 63800)
                if rnd.random() < 0.08:  # post-hire return (v39 S6, ?hired=1)
                    yield_evt("hired_return", "/demo.html", sid, {"stage": "s6"},
                              utm=utm, ref=ref, ts=ts + 63900)
                if rnd.random() < 0.12:
                    yield_evt("onboard_dismissed", "/demo.html", sid,
                              {"stage": "s4", "opted_out": True},
                              utm=utm, ref=ref, ts=ts + 64000)
            elif rnd.random() < 0.15:  # returning visitor, tour skipped (v25)
                yield_evt("returning_session", "/demo.html", sid,
                          {"stage": "s0", "opted_out": False},
                          utm=utm, ref=ref, ts=ts + 14000)
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
