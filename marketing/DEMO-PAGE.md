# Demo page spec — `site/demo.html` ("Watch the block")

**Owner:** marketing track. **Status:** fallback + request simulator + day
strip shipped (v26); live embed pending a shippable spectator build
(game-systems/world track dependency).
**Roadmap ref:** MARKETING_ROADMAP.md v12 (focus: demo-page), pulled forward
to v11; second pass v26.

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

- Real development capture (`shots/v22-A.*`) behind a gradient overlay labeled
  "Spectator build not wired in yet" — honest, never fakes liveness.
- `noscript` notice routing to the static gallery.
- Falls back gracefully on `file://`, blocked JS, and rejected embed schemes.

## 3. Feed preview

An **illustrative** `.feed-preview` block shows what public request-feed
entries look like (running / queued / resolved / refunded), explicitly labeled
as a preview. Copy tracks design doc §5: FCFS queueing, auto-refund on expiry,
graceful AI handoff, public attribution. Do not present it as live data.

## 4. Share card

"Share this view" button: `navigator.share` where available, clipboard copy
otherwise, address-bar instruction as last resort. Emits `cta_click{cta:"demo-share"}`.
OG/Twitter cards on the page point at `assets/og-card.png`.

## 4a. Request simulator (v26)

`#request-sim` + `js/demo-sim.js` — a **local-only simulation** of the
request pipeline. Three actions: possess your resident (compatible,
1.5 cr/min, 120-min cap), reserve a venue (exclusive, 6 cr/min, 60-min cap),
call the weather (flat 40–100 cr by duration block; the sim's fixed example
is the 2 h fog block at 100 cr). Filing renders a verdict card
(classification chip + credit quote + the four real pipeline steps:
declared → screened → runs-or-queues → attributed) and appends a labeled
"simulated" row to a personal feed strip. Rates MUST stay in sync with
`js/pricing.js` and PRICING-PAGE-CONTENT.md §2.

Honesty rules: the widget never claims to file anything, the result card
says "Simulation only," and simulated feed rows are marked "filed by you
(simulated)". Emits `request_simulated` (see analytics-events.json).

## 4b. Day strip (v26)

Static "A day on the block" cards (06:10 / 12:30 / 16:30 / 23:40). All copy
restates design-doc facts — real-sun schedule, jobs/routines, lamps at dusk,
persistent world. No liveness implied.

## 5. Performance budget

- Page weight (excl. shots/, excl. the game embed itself): **< 200 KB**.
- Embed iframe is `loading="lazy"` and only created when a URL resolves —
  zero game payload for fallback viewers.
- No frameworks, no webfonts, no third-party requests. `demo.js` < 4 KB,
  `demo-sim.js` < 5 KB.

## 6. Analytics hooks

`watch_start` (live|fallback), `cta_click` on hero/share/ladder/sim CTAs,
`request_simulated` from the request widget (v26), `screenshot_view` via the
shared gallery handler. All inert until an endpoint is configured — see
ANALYTICS.md and analytics-events.json.

## 7. Dependencies on other tracks

- **Game-systems/world:** needs the spectator build URL + embed permission
  (same-origin or CSP `frame-ancestors`). Until then `data-demo-src` stays empty.
- **Art:** fallback capture is `shots/v22-A.*`; swap when a better canonical
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
- [x] Feed preview includes the `cast` arrival kind (world-v7 contract).
- [ ] Flip `data-demo-src` + verify `watch_start{mode:"live"}` — **launch gate**
  (tracked in LAUNCH-CHECKLIST.md).
