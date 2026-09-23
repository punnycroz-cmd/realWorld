# Demo page spec — `site/demo.html` ("Watch the block")

**Owner:** marketing track. **Status:** stub + fallback shipped (v11); live
embed pending a shippable spectator build (game-systems/world track dependency).
**Roadmap ref:** MARKETING_ROADMAP.md v12 (focus: demo-page), pulled forward to v11.

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

- Real development capture (`shots/v19-A.*`) behind a gradient overlay labeled
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

## 5. Performance budget

- Page weight (excl. shots/, excl. the game embed itself): **< 200 KB**.
- Embed iframe is `loading="lazy"` and only created when a URL resolves —
  zero game payload for fallback viewers.
- No frameworks, no webfonts, no third-party requests. `demo.js` < 4 KB.
- Game build itself should target the same-origin host at launch to keep
  the sandbox simple.

## 6. Analytics hooks

`watch_start` (live|fallback), `cta_click` on hero/share/ladder CTAs,
`screenshot_view` via the shared gallery handler. All inert until an
endpoint is configured — see ANALYTICS.md and analytics-events.json.

## 7. Dependencies on other tracks

- **Game-systems/world:** needs the spectator build URL + embed permission
  (same-origin or CSP `frame-ancestors`). Until then `data-demo-src` stays empty.
- **Art:** fallback capture is `shots/v19-A.*`; swap when a better canonical
  shot is published (same filename convention).
- Feed row labels must mirror the live feed's real vocabulary at launch —
  sync with `gsViewerState` feed events before flipping the switch.

## 8. Acceptance

- [x] Page renders with zero JS, on `file://`, and under `http.server`.
- [x] `?embed=` override works for staging (e.g. `demo.html?embed=/features.html`).
- [x] Fallback never claims to be live.
- [x] All CTAs instrumented; page listed in sitemap + dry-run page list.
- [ ] Flip `data-demo-src` + verify `watch_start{mode:"live"}` — **launch gate**
  (tracked in LAUNCH-CHECKLIST.md).
