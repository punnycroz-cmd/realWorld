# Analytics Plan — Real World ("The Mission")

**Version:** v96 · 2026-09-23 · branch `sf/marketing` · LOCAL BUILD ONLY.
**Status:** implemented + e2e-tested locally (`tools/analytics_e2e.sh` → PASS).
**Inert until an endpoint is configured** — the site ships with analytics
wired but emitting nothing.

The product is free to *watch* and paid to *act*. Marketing analytics exist to
answer one question: **does watching convert to acting?** Everything below serves
that funnel — no vanity metrics, no surveillance.

---

## 1. Privacy posture (load-bearing — matches the product's pitch)

The site promises a world where players pay for agency, not access, and where
admins act transparently. Tracking our visitors with cookies and fingerprinting
would contradict the brand. So:

- **No cookies. No localStorage identifiers. No fingerprinting.**
- Sessions are a random nonce in `sessionStorage` — dies when the tab closes.
- Unique-visitor counting is a **server-side** concern: daily-rotating
  `hash(salt + IP + UA + date)`, salt discarded daily. Raw IPs are never stored.
  Implemented locally (v81) via `analytics_sink.py --uniques`: the sidecar
  TSV stores `day<TAB>hash` only — salts live in memory, rotate per UTC day,
  and are never written, so hashes can't be correlated across days.
- Referrer is reduced to its **host** on the client.
- Honors **Do Not Track**, **Global Privacy Control**, `?nocollect=1`,
  `localStorage["rw:no-collect"]`, and `window.rw.optOut()`.
- No third-party analytics vendor pixels. No live keys exist anywhere in the repo.

This posture is itself a marketing asset — one line on the privacy page / FAQ at
launch: *"We measure the funnel, not you: no cookies, no cross-site tracking."*

## 2. Tool choice

**Recommended: self-hosted cookieless analytics (Plausible CE or Umami) OR a
minimal first-party collector.** Rationale:

| Option | Cookieless | Self-hostable | Cost | Fit |
|---|---|---|---|---|
| **Umami (self-hosted)** | yes | yes (Node + Postgres) | infra only | Good — simple event API, easy custom events |
| **Plausible CE** | yes | yes (Elixir + ClickHouse) | infra only | Good — light, funnel-friendly |
| **First-party collector** | yes | trivial (we own `analytics_sink.py` already) | infra only | Simplest — NDJSON → any DB later |
| GA4 | no (client id cookie) | no | free | Rejected — contradicts privacy posture |
| Mixpanel/Amplitude SaaS | partial | no | free tier → $ | Rejected — third-party data sharing |

**Decision:** implement against our own event spec
(`marketing/analytics-events.json`) via `site/js/analytics.js`; point the
endpoint at whichever backend the owner stands up. If the owner picks Umami or
Plausible, their script can be loaded *instead* — our `data-rw-event` attributes
still map 1:1 onto their custom-event APIs.

## 3. Funnel & event spec

The funnel, top to bottom (stages 4–6 emit from the game build, not the
marketing site — spec'd now so the dashboard schema is stable):

```
visit      pageview                     (site — live now)
  └─engaged  cta_click, screenshot_view, scroll_depth, engaged_time,
             share_click, price_calc, scene_calc, sub_calc, request_simulated
                                        (site — live now)
    └─press    press_kit_download       (site — live once kit zip is linked)
    └─community community_join, recap_open, watch_party_rsvp
                                        (v40 — PENDING surfaces; see community/)
      └─watch  watch_start              (demo.js LIVE on demo.html in fallback
                                         mode; live game embed still PENDING)
        └─onboard  tour_started … onboard_dismissed  (game — PENDING, v36)
          └─request request_submitted, first_request_filed  (game — PENDING)
            └─create character_created  (game — PENDING)
```

**Onboarding events (v36 + v53 + v68 + v81):** the world track's onboarding contract
(`world/onboarding-ui.md` / `world/onboarding.json analytics_hooks`)
names twenty-one events emitted at merge. v11's nine: `tour_started`,
`tour_beat`, `tour_completed`, `tour_skipped` (carries `at_beat`),
`handle_set`, `wallet_explained`, `topup_shown`, `first_request_filed`,
`onboard_dismissed`. v25 added four (§17): `persona_chosen` (carries
`persona: watch|play` — the S0 fork, i.e. which promise the visitor came
for), `handle_taken_shown` (reserved-name friction), `decline_lesson_shown`
(the S4b refund-on-decline teaching moment), `returning_session` (parked/
`?returning=1` visitors — counts sessions, not users; no cross-session
identity exists). v39 added five (storage key `rw_onboard_v39`):
`review_lesson_shown` (the S4c "a human reads exclusive asks" moment),
`review_outcome_seen` (the scripted "not approved — refunded" outcome;
`outcome` prop uses feed-vocabulary values only),
`low_balance_simulated` (opt-in sim → "player session ended"; `opted_in`
flag, no amounts), `handoff_seen` (graceful session handoff state),
`hired_return` (`?hired=1` deep link → first-day card S6). v53 added
three (storage key `rw_onboard_v53`): `queue_lesson_shown` (the S4e
"filed while claimed → queued at −15%" lesson), `queue_outcome_seen`
(the scripted "queued request expired before activation" + full
auto-refund outcome — presence only, the scripted expiry is the only
value), `archive_beat_seen` (tour beat 7's feed-archive link). All
twenty-one
are in `analytics-events.json`, the sink
allowlist, the report's onboarding block (with a persona split line), and
the local dashboard. Per the world contract they carry `stage` +
`opted_out`/`persona`/`opted_in` only — **no per-step dwell, no handle
values (not even rejected ones), no amounts, no request text**. That
constraint is load-bearing (no funnel-pressure instrumentation) and
enforced by the spec's prop lists.

Full field-level spec: **`marketing/analytics-events.json`** (envelope +
per-event props + privacy contract). Site-side events already wired:

- `pageview` — auto on every page; props: title, `data-page` slug, viewport, lang.
- `cta_click` — on every primary/ghost CTA (`data-rw-event="cta_click"`,
  `data-rw-props` = slot + destination). Instrumented across all 16 pages.
- `screenshot_view` — auto on gallery lightbox opens (which shot, by filename).
- `outbound_click` — any external link not otherwise tagged.
- `scroll_depth` (v22) — auto at 25/50/75/100% marks, once each per page;
  tells us which pages actually get read.
- `engaged_time` (v22) — on `pagehide`, total **visible** seconds (background
  tabs don't count); the honest attention metric.
- `share_click` (v22) — demo-page share button, `method` = web-share /
  clipboard / manual. Feeds the viral loop panel.
- `price_calc` (v22) — pricing-page estimator (`js/pricing.js`), debounced
  900 ms; props = class / minutes / queued / surge only — **no amounts**.
  Pre-checkout demand signal: which request class and duration visitors
  actually price out.
- `scene_calc` (v67) — pricing-page scene builder (`js/pricing.js`),
  debounced 900 ms; props = item:qty csv / queued / surge / preset —
  **no amounts**. Which bundled scenes visitors price out.
- `sub_calc` (v82) — pricing-page subscription breakeven (`js/pricing.js`),
  debounced 900 ms; props = comp_min / excl_min / camera / verdict —
  **no totals**. Which payment path (packs vs Resident vs Director) the
  widget computes cheapest at the visitor's imagined pace — subscription
  demand signal before checkout exists.
- `request_simulated` (v26) — demo-page request simulator
  (`js/demo-sim.js`), fires once per simulated filing; props = action /
  class / minutes / credits quoted. Pre-launch demand signal for *which
  request type* visitors try first — complements `price_calc`.

Add an event = add `data-rw-event` + optional `data-rw-props` JSON to the
element. No JS changes needed for click events.

## 4. Enabling it (the "one command" moment)

The shim is **inert** — it emits nothing until an endpoint exists:

```html
<!-- Option A: script-tag config -->
<script src="js/analytics.js" defer
        data-endpoint="https://stats.example.com/e" data-site="realworld"></script>

<!-- Option B: before the script loads -->
<script>window.RW_ANALYTICS = { endpoint: "https://stats.example.com/e" };</script>

<!-- Option C (v22): dev-only query override, for local/staging testing -->
http://127.0.0.1:8080/?rw_endpoint=http://127.0.0.1:8970/e
```

`?rw_endpoint=` is honored **only** when the page itself is on localhost /
127.0.0.1 / [::1] / file: — a deployed URL can never be steered to another
collector by link.

Events are POSTed as JSON via `sendBeacon` (fetch keepalive fallback). The sink
must send CORS headers if hosted on another origin (`Access-Control-Allow-Origin`).

## 5. Local test runbook (v22 — one command)

```bash
./marketing/tools/analytics_e2e.sh
```

Generates a synthetic week (`tools/make_analytics_fixture.py`), starts the
sink on :8970, POSTs every event through the real HTTP path, runs
`tools/analytics_report.py` on what was captured, asserts the funnel appears,
then serves the site on :8080 with a printed `?rw_endpoint=` URL for a real-
browser check. Ctrl-C frees both ports; artifacts land in /tmp/rw-analytics-e2e.*.

Manual equivalent:

```bash
# terminal 1 — the capture sink (+ optional daily-hash uniques sidecar)
python3 marketing/tools/analytics_sink.py --port 8970 --out /tmp/rw-events.ndjson \
    --uniques /tmp/rw-uniques.tsv

# terminal 2 — serve the site
cd marketing/site && python3 -m http.server 8080
# open http://127.0.0.1:8080/?rw_endpoint=http://127.0.0.1:8970/e
# (the override only works on localhost pages)
```

### Reporting on captured data

```bash
python3 marketing/tools/analytics_report.py /tmp/rw-events.ndjson --week 2026-W39 \
    --uniques /tmp/rw-uniques.tsv
```

Prints the §8 weekly block pre-filled (sessions, sources, funnel with
session-joined conversion, top shots, 404 radar) plus a detail section —
drop it straight into MARKETINGLOG.md once live. `--json` dumps raw
aggregates. Committed reference output: `marketing/analytics/sample-report.md`
(generated from `sample-week.ndjson`, both synthetic).

### Spec validation (v66)

`tools/analytics_validate.py` — the hard gate between capture and report.
Checks an NDJSON file against `analytics-events.json`: envelope shape, event
names, per-event prop allowlists, enumerated prop domains, and the privacy
contract as lint rules (PII-shaped prop names/values, full-URL refs, stray
utm keys). Exit 1 on any FAIL — run it before trusting a report, and before
accepting a new emitter:

```bash
python3 marketing/tools/analytics_validate.py /tmp/rw-events.ndjson
```

`analytics_e2e.sh` now runs it on the captured fixture automatically. Its
first run caught real drift — the spec's page-slug and CTA-slot lists were
a version behind the site, and `watch_start` was missing the `mode` prop the
demo emitter already sends. All fixed in `analytics-events.json` (v66).

### Coverage audit — site ↔ spec (v96)

`tools/analytics_coverage.py` is the static twin of the validator: instead of
checking captured events, it checks the SITE against the spec — no browser,
no sink, no events needed. Run it after any site page or emitter change:

```bash
python3 marketing/tools/analytics_coverage.py
```

It fails (exit 1) when: a page doesn't load `js/analytics.js` or carries a
`data-page` slug outside the spec's pageview domain; a `data-rw-event` names
an unknown event or sends undeclared/invalid props; a `window.rw.track()`
call in `site/js/` does the same; or a spec event marked live on the site has
no emitter at all. PENDING game-side events warn instead of failing.

Its first run (v96) caught 18 real findings — `cta:"demo-cam"` + a `cam`
prop, `cta:"gallery-footer"`, and `data-page="gallery"` were all shipped on
the site but missing from `analytics-events.json`, and `press_kit_download`
was marked live though the kit zip link isn't published yet. All fixed in
the spec. `analytics_e2e.sh` and `metrics_weekly.sh` both gate on it.

### Weekly metrics run — one command (v96)

```bash
./marketing/tools/metrics_weekly.sh <capture.ndjson> [uniques.tsv]
```

Validates the capture → audits coverage → renders the §8 block + §7 detail
labelled with the ISO week of the newest event → writes
`marketing/analytics/weekly-<ISOweek>.md` (gitignored — the committed
reference output stays `sample-report.md`). Fill "action taken", paste the
block into MARKETINGLOG.md.

### Experiment program (v96)

A/B readouts are run through `tools/ab_compare.py`; which tests exist and
how winners get called lives in **`marketing/EXPERIMENTS.md`** — a registry
with fixed decision rules (n≥30, two-week confirmation, guardrails). Log
the test before the tagged link goes out; null results get recorded too.

### A/B / creative readout (v66)

`tools/ab_compare.py` — splits sessions by a utm dimension (default
`utm_content`, the §6 convention for creative variants) and prints a
per-variant funnel table plus a two-proportion z-test vs baseline on one
transition (default `engaged → watch_start`):

```bash
python3 marketing/tools/ab_compare.py /tmp/rw-events.ndjson \
    --dim utm_content --baseline thumb-a
```

Honesty rules are baked in: arms under n=30 get a `low-n` flag, and the
tool prints "confirm with a second week" — never call a creative winner on
one week's z-score.

### Local dashboard (v36)

`marketing/analytics/dashboard.html` — a standalone, file://-safe page.
Drop any NDJSON capture on it (or pick the file) and it renders the §7
four panels in-browser: acquisition, engagement, funnel (+ onboarding
sub-funnel when the events are present), health. No server, no upload —
parsing is local JS. Internal tool, marked `noindex`; do not deploy to
the public site. Try it with `analytics/sample-week.ndjson`.

Smoke test without a browser:

```bash
curl -X POST localhost:8970/e -H 'content-type: text/plain' \
  -d '{"v":1,"site":"realworld","event":"pageview","path":"/","props":{},"sid":"sx","utm":{},"ref":null,"ts":0}'
```

## 6. UTM conventions

Capture at landing, session-scoped, forwarded on every event. Conventions for
press/social (all drafts should use these when links go out):

| Channel | utm_source | utm_medium | utm_campaign |
|---|---|---|---|
| Social launch thread | `bsky` / `x` / `mastodon` | `social` | `launch-2026` |
| Devlog posts | `devlog` | `blog` | `devlog-w<N>` |
| Press outreach | outlet slug (`rps`, `pcgamer`…) | `press` | `press-embargo` |
| Creator/streamer embeds | creator slug | `creator` | `creator-wave-1` |
| Storefront | `itch` / `steam` | `store` | `store-launch` |
| Community (Discord/forum) | `discord` / `forum` | `community` | `launch-2026` |

Rules: all lowercase, `-` separators, no PII in any utm value, `utm_content`
for A/B creative variants (`thumb-a`, `teaser-15s`).

## 7. Dashboard spec (post-launch, owner builds)

One dashboard, four panels — everything derivable from the event spec:

1. **Acquisition:** unique visitors/day (server-side daily hash — locally:
   `analytics_sink.py --uniques` + `analytics_report.py --uniques`), top referrer
   hosts, sessions by `utm_source`/`utm_campaign`.
2. **Site engagement:** `cta_click` rate by `cta` slot; `screenshot_view` by
   shot (tells art which captures sell the game); `scroll_depth` reach per
   page (which pages get read); `engaged_time` medians (attention quality);
   `share_click` by method (viral loop health); `price_calc` + `scene_calc` +
   `sub_calc` splits (which class/duration/scene-mix/sub-verdict visitors
   price — purchase intent before checkout);
   `outbound_click` targets; `cta_click{cam}` camera-preset picks (v96 —
   which spectator angle visitors try first).
3. **Funnel:** visit → engaged → watch → request → create, session-joined by
   `sid` + same-day window. First three stages live at launch; last two turn on
   when the game embed emits.
4. **Health:** 404 pageviews by path (broken-link radar), `?nocollect` rate
   (privacy-conscious audience share — worth knowing, not optimizing).

**Targets (honest, from the research report):** the free-watch top of funnel is
the whole business — optimize `pageview → watch_start` first. TPP-class
spectator funnels convert a small fraction to payers; measure before promising
rates. `screenshot_view` per-shot ranking feeds back into gallery ordering.

## 8. Weekly metrics report template

Append to MARKETINGLOG.md weekly once live (fill `{{...}}`):

```
## metrics — week {{ISO week}}
- uniques: {{n}} (Δ{{±%}} wow) · pageviews: {{n}} · nocollect rate: {{%}}
- top sources: {{utm_source ×3 with counts}}
- funnel: visit→cta {{%}} → watch {{%}} → request {{%}} → create {{%}}
- top shots: {{shot ×3 by screenshot_view}}
- 404s: {{count}} (worst path: {{path}})
- action taken: {{one line — what we changed because of the numbers}}
```

## 9. Launch-readiness checklist additions

- [ ] Owner picks backend (Umami / Plausible CE / first-party sink) — owner-gated
- [ ] `data-endpoint` set on the analytics script tag (all 16 pages)
- [ ] `tools/analytics_e2e.sh` re-run against staging after endpoint is set
- [ ] `tools/analytics_validate.py` clean on the first real capture before
      any weekly report is trusted (v66)
- [ ] Creative variants tagged via `utm_content` per §6 so
      `tools/ab_compare.py` has arms to compare (v66)
- [ ] Privacy line added to FAQ/footer when collection goes live
- [ ] `press_kit_download` hook added when the kit zip gets a public link
- [ ] `community_join` hook added when the invite link goes live (v40);
      `recap_open` / `watch_party_rsvp` are post-launch surfaces — counted
      manually until then (community/first-100.md §4)
- [ ] Game embed emits `watch_start` / `request_submitted` / `character_created`
      per `analytics-events.json` (coordination note for game/world track)
- [ ] Game emits the twenty-one onboarding events per world-v11/v25/v39/v53
      contract (`tour_*`, `persona_chosen`, `handle_set`,
      `handle_taken_shown`, `wallet_explained`, `topup_shown`,
      `decline_lesson_shown`, `first_request_filed`, `onboard_dismissed`,
      `returning_session`, `review_lesson_shown`, `review_outcome_seen`,
      `low_balance_simulated`, `handoff_seen`, `hired_return`,
      `queue_lesson_shown`, `queue_outcome_seen`, `archive_beat_seen`) —
      stage + opted_out/persona/outcome/opted_in only
- [ ] Production collector implements the §1 daily-hash unique contract
      (or run our sink with `--uniques`); `analytics_report.py --uniques`
      renders the per-day counts
- [ ] `tools/analytics_coverage.py` clean after any page/emitter change —
      also gated inside `analytics_e2e.sh` and `metrics_weekly.sh` (v96)
- [ ] Every A/B test registered in EXPERIMENTS.md before its tagged links
      go out; decision rules there are fixed, not per-test (v96)

## 10. Hard rules

- **Nothing here collects anything today.** No endpoint is configured anywhere.
- No key, token, or analytics account id will ever be committed.
- Never add a third-party pixel or tag manager without an owner decision and a
  corresponding note in this file + LAUNCH-CHECKLIST.
- If an event starts collecting something personal (name, handle, email), it
  leaves this spec — analytics stays anonymous forever.
