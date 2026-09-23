# Analytics Plan — Real World ("The Mission")

**Version:** v21 · 2026-09-23 · branch `sf/marketing` · LOCAL BUILD ONLY.
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
  └─engaged  cta_click, screenshot_view (site — live now)
    └─press    press_kit_download       (site — live once kit zip is linked)
      └─watch  watch_start              (game embed — PENDING, roadmap v12)
        └─request request_submitted     (game — PENDING)
          └─create character_created    (game — PENDING)
```

Full field-level spec: **`marketing/analytics-events.json`** (envelope +
per-event props + privacy contract). Site-side events already wired:

- `pageview` — auto on every page; props: title, `data-page` slug, viewport, lang.
- `cta_click` — on every primary/ghost CTA (`data-rw-event="cta_click"`,
  `data-rw-props` = slot + destination). Instrumented across all 12 pages.
- `screenshot_view` — auto on gallery lightbox opens (which shot, by filename).
- `outbound_click` — any external link not otherwise tagged.
- `scroll_depth` (v21) — auto at 25/50/75/100% marks, once each per page;
  tells us which pages actually get read.
- `engaged_time` (v21) — on `pagehide`, total **visible** seconds (background
  tabs don't count); the honest attention metric.
- `share_click` (v21) — demo-page share button, `method` = web-share /
  clipboard / manual. Feeds the viral loop panel.
- `price_calc` (v22) — pricing-page estimator (`js/pricing.js`), debounced
  900 ms; props = class / minutes / queued / surge only — **no amounts**.
  Pre-checkout demand signal: which request class and duration visitors
  actually price out.

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

<!-- Option C (v21): dev-only query override, for local/staging testing -->
http://127.0.0.1:8080/?rw_endpoint=http://127.0.0.1:8970/e
```

`?rw_endpoint=` is honored **only** when the page itself is on localhost /
127.0.0.1 / [::1] / file: — a deployed URL can never be steered to another
collector by link.

Events are POSTed as JSON via `sendBeacon` (fetch keepalive fallback). The sink
must send CORS headers if hosted on another origin (`Access-Control-Allow-Origin`).

## 5. Local test runbook (v21 — one command)

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
# terminal 1 — the capture sink
python3 marketing/tools/analytics_sink.py --port 8970 --out /tmp/rw-events.ndjson

# terminal 2 — serve the site
cd marketing/site && python3 -m http.server 8080
# open http://127.0.0.1:8080/?rw_endpoint=http://127.0.0.1:8970/e
# (the override only works on localhost pages)
```

### Reporting on captured data

```bash
python3 marketing/tools/analytics_report.py /tmp/rw-events.ndjson --week 2026-W39
```

Prints the §8 weekly block pre-filled (sessions, sources, funnel with
session-joined conversion, top shots, 404 radar) plus a detail section —
drop it straight into MARKETINGLOG.md once live. `--json` dumps raw
aggregates. Committed reference output: `marketing/analytics/sample-report.md`
(generated from `sample-week.ndjson`, both synthetic).

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

1. **Acquisition:** unique visitors/day (server-side daily hash), top referrer
   hosts, sessions by `utm_source`/`utm_campaign`.
2. **Site engagement:** `cta_click` rate by `cta` slot; `screenshot_view` by
   shot (tells art which captures sell the game); `scroll_depth` reach per
   page (which pages get read); `engaged_time` medians (attention quality);
   `share_click` by method (viral loop health); `price_calc` splits
   (which class/duration visitors price — purchase intent before checkout);
   `outbound_click` targets.
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
- [ ] `data-endpoint` set on the analytics script tag (all 12 pages)
- [ ] `tools/analytics_e2e.sh` re-run against staging after endpoint is set
- [ ] Privacy line added to FAQ/footer when collection goes live
- [ ] `press_kit_download` hook added when the kit zip gets a public link
- [ ] Game embed emits `watch_start` / `request_submitted` / `character_created`
      per `analytics-events.json` (coordination note for game/world track)

## 10. Hard rules

- **Nothing here collects anything today.** No endpoint is configured anywhere.
- No key, token, or analytics account id will ever be committed.
- Never add a third-party pixel or tag manager without an owner decision and a
  corresponding note in this file + LAUNCH-CHECKLIST.
- If an event starts collecting something personal (name, handle, email), it
  leaves this spec — analytics stays anonymous forever.
