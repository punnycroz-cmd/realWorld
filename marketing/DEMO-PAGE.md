# Demo page spec — `site/demo.html` ("Watch the block")

**Owner:** marketing track. **Status:** fallback + request simulator v2 +
block clock + theater mode + canonical-vocabulary feed preview (v41); live
embed pending a shippable spectator build (game-systems/world track
dependency).
**Roadmap ref:** MARKETING_ROADMAP.md v12 (focus: demo-page), pulled forward
to v11; second pass v26; third pass v41.

The demo page is the funnel's front door: free spectator view first, then the
watch → request → create ladder. It must work *today* (pre-build) without
pretending a live game exists, and go live with a one-attribute change.

## 1. Embed contract

`#demo-stage` carries `data-demo-src`. `js/demo.js` resolves the embed URL:

1. `?embed=<url>` query param — staging/testing override. Accepted only if
   same-origin, `https:`, or `file:`-to-`file:` (local dev). Anything else is
   ignored and the fallback shows.
2. `data-demo-src` attribute — **the launch switch.** Empty = fallback state.

When a URL resolves, demo.js swaps the fallback for a lazy-loaded `<iframe>`
(`sandbox="allow-scripts allow-same-origin allow-pointer-lock"`, `allow="autoplay;
fullscreen"`) and emits `watch_start{mode:"live"}`. With no URL it emits
`watch_start{mode:"fallback"}` — the metric still counts intent pre-launch.

**To go live at launch:** set `data-demo-src="https://<host>/spectator"` (or a
same-origin path) in demo.html. One attribute; no other page changes required.

## 2. Fallback state (pre-build)

- Real development capture (`shots/v31-A.*`) behind a gradient overlay labeled
  "Spectator build not wired in yet" — honest, never fakes liveness.
- `noscript` notice routing to the static gallery.
- Falls back gracefully on `file://`, blocked JS, and rejected embed schemes.

## 3. Feed preview

An **illustrative** `.feed-preview` block (rewritten v41) uses the canonical
vocabulary verbatim from `world/feed.json`: event kinds `move · scene ·
venue · weather · request · admin · press · housing · cast · quiet` and
`request_status` labels (`in_review`, `approved`, `running`, `queued`,
`resolved`, `refunded`, `not approved`, `player session ended`). Rows quote
the feed's own demo seeds where they exist; the `not approved` row shows
only the outcome (never screened text), the `admin` row carries
`compensated_cr`, and the `quiet` marker demonstrates the honest-empty rule.
Do not present it as live data — the intro and footnote say so.

## 4. Share card

"Share this view" button: `navigator.share` where available, clipboard copy
otherwise, address-bar instruction as last resort. Emits `cta_click{cta:"demo-share"}`.
OG/Twitter cards on the page point at `assets/og-card.png`.

## 4a. Request simulator (v26; v2 in v41)

`#request-sim` + `js/demo-sim.js` — a **local-only simulation** of the
request pipeline. Four actions: possess your resident (compatible,
1.5 cr/min, 120-min cap), reserve a venue (exclusive, 6 cr/min, 60-min cap,
surgeable ×1.5–2.5), call the weather (flat 40–100 cr block; the sim's fixed
example is the 2 h fog at 100 cr), trigger an event (one-shot 150–300 cr,
quoted as a range — the real quote appears at filing). Modifiers: a
**queued checkbox** (−15% of class rate) and a **surge checkbox** (exclusive
only, window shown before paying) — both verbatim from pricing.js.

v41 adds a **free-text field** run through a *toy* intent screen: a handful
of phrases map onto the real `world/moderation.json` reason codes
(`harm-targeting`, `secret-extraction`, `admin-domain`, `real-business` →
deny + full refund; `surface-relationship`, `venue-lock` → `in_review`).
Exclusive actions always route to `in_review` (every exclusive is
human-reviewed). The verdict card states plainly that the shipped screen
reads intent, not keywords, and that no review time is ever promised.

Filing renders a verdict card (status chip in feed vocabulary + credit
quote + the four real pipeline steps: declared → screened →
runs-or-queues → attributed) and appends a labeled "simulated" row to a
personal feed strip. Rates MUST stay in sync with `js/pricing.js` and
PRICING-PAGE-CONTENT.md §2.

Honesty rules: the widget never claims to file anything, the result card
says "Simulation only," and simulated feed rows are marked "filed by you
(simulated)". Emits `request_simulated` with `screened` prop (v41).

## 4b. Day strip (v26)

Static "A day on the block" cards (06:10 / 12:30 / 16:30 / 23:40). All copy
restates design-doc facts — real-sun schedule, jobs/routines, lamps at dusk,
persistent world. No liveness implied.

## 4c. Block clock + theater mode (v41)

- `#demo-clock` in the stage toolbar shows the real Pacific time and names
  the daypart ("windows-dark hours" etc.) — honest by construction: it is
  just the clock, which the world follows. `Intl.DateTimeFormat` with
  `America/Los_Angeles`; fails silent where unsupported.
- `#demo-fs` "Theater mode" calls `requestFullscreen()` on `#demo-stage` —
  works over the fallback capture today and the live iframe at launch.
  Hidden where the API is absent; button label toggles on
  `fullscreenchange`. Emits `cta_click{cta:"demo-fullscreen"}`.

## 5. Performance budget

- Page weight (excl. shots/, excl. the game embed itself): **< 200 KB**.
- Embed iframe is `loading="lazy"` and only created when a URL resolves —
  zero game payload for fallback viewers.
- No frameworks, no webfonts, no third-party requests. `demo.js` < 6 KB,
  `demo-sim.js` < 10 KB (raised v41 — screen table + modifiers).

## 6. Analytics hooks

`watch_start` (live|fallback), `cta_click` on hero/share/fullscreen/ladder/
sim CTAs, `request_simulated` from the request widget (+`queued`, `surge`,
`screened` props in v41), `screenshot_view` via the shared gallery handler.
All inert until an endpoint is configured — see ANALYTICS.md and
analytics-events.json.

## 7. Dependencies on other tracks

- **Game-systems/world:** needs the spectator build URL + embed permission
  (same-origin or CSP `frame-ancestors`). Until then `data-demo-src` stays empty.
- **Art:** fallback capture is `shots/v31-A.*`; swap when a better canonical
  shot is published (same filename convention).
- Feed row labels must mirror the live feed's real vocabulary at launch —
  sync with `gsViewerState` feed events before flipping the switch.

## 8. Acceptance

- [x] Page renders with zero JS, on `file://`, and under `http.server`.
- [x] `?embed=` override works for staging (e.g. `demo.html?embed=/features.html`).
- [x] Fallback never claims to be live.
- [x] All CTAs instrumented; page listed in sitemap + dry-run page list.
- [x] Simulator labels itself a simulation in control, result, and feed row
  (v26); rates match pricing.js constants.
- [x] Feed preview uses canonical `feed.json` kind/status vocabulary incl.
  `cast`, `quiet`, `not approved`, `in_review` (v41).
- [x] Toy intent screen maps to real `moderation.json` reason codes; denies
  always refund; exclusive always routes `in_review` (v41).
- [x] Block clock + theater mode degrade silently where unsupported (v41).
- [ ] Flip `data-demo-src` + verify `watch_start{mode:"live"}` — **launch gate**
  (tracked in LAUNCH-CHECKLIST.md).
