# integration-1 — local prototype

One runnable artifact joining the world track's surfaces, the game-systems
track's runtime, and the art track's renderer — local only, nothing pushed,
nothing persistent.

## The pieces (all real, no shims)

| surface | source of truth | how the prototype uses it |
|---|---|---|
| Mission sim + art renderer | `willowbrook_natura.html` bundle (`src/sf/31_sf_art.js` + `32_sf_render.js`, v40 art) | the canvas IS the spectator view — top-down `?sf=1` or Truman street view `?view=street` (V key) |
| request bus | `src/systems/41_game_systems_requests.js` | `__aiBridge.gsSubmitRequest` / `gsCancelRequest` / `gsReviewResolve` |
| spectator feed (The Wire) | `src/systems/41_game_systems_feed.js` → `world/feed.json` schema | `__aiBridge.gsViewerState().feed` polled every 1.5 s |
| two-currency ledger | `src/systems/41_game_systems_ledger.js` | `GS_LEDGER.txns`, `gsCreditBalance`, `gsDollarBalance` |
| request UI contract | `world/request.html` + `world/requests.json` | the rail's request form implements the same action catalog (possess/weather/street_event/hire/listing/buy), rate card, review lanes, briefing preview |
| spectator UI contract | `world/wire.html` + `world/feed.html` | `wire.html` already live-polls `__aiBridge.gsViewerState()` when present — the same surface the rail renders |
| the cast | `world/characters/c1..c8` bibles → `NV_CAST` in `src/sf/33_sf_cast.js` | Cast tab: brain mode (`gsBrainMode`), home (`gsHomeOf`), live state |

## Run it

```bash
# visual prototype (one file — the game + the rail)
python3 integration/build_prototype.py          # regenerate after any rebuild
# then open:  file:///…/world-sim-integration/integration/prototype.html
# (auto-appends ?sf=1 if you forget; add &view=street for the Truman camera)

# headless proof — the closed minimal loop with evidence
node integration/proto_harness.js               # exits 0 on all-pass
```

## What the rail does

- **Wire** — the formatted public feed (`gsWireTail` entries: id, block-time,
  kind, text, status, reason_code, attrs). The "quiet" placeholder is the
  contract's honest-empty marker, not a placeholder of ours.
- **Requests** — the full catalog from `requests.json`: possess (your hired
  chars only — mains are banned in the bus, not just the UI), weather,
  street_event (venue permits), hire (named → parks in human review,
  unbilled until approval), listing, buy. Live `gsPriceQuote` before filing.
  My-requests tray with meters + cancel; the **review lane** resolves parked
  filings (locally you are the reviewer — `gsReviewResolve`).
- **Ledger** — both currencies itemized (credits = player agency, dollars =
  rent/wages), conservation math shown.
- **Cast** — all 8 mains + hired characters: brain mode (full/thin/
  possessed/degraded), canonical home address, live pawn state.

## Verified loop (proto_harness.js evidence)

watch free → render (2.3M ctx ops) + clock + schedule adherence + real walk
→ hire Dana Okafor (in_review → approved → 500cr billed at approval →
pawn spawned, lease signed, $1600 arrival bank, first-month rent paid to
C7) → possess h01 5 min @ 20cr (brain suspended, briefing generated)
→ bus tick past cap → feed shows `running → player session ended →
resolved`; ledger posts every credit; conservation holds; possess on C3
denied `possession_ban` (owner too); another player `not_your_character`.

33/33 checks pass.

## Honest limits

- `world/request.html` remains a self-contained demo page — the rail is the
  bus-wired equivalent; merging the demo's visuals onto the live bridge is
  cosmetic future work.
- No server, no persistence beyond the process, no real payments — the
  "demo top-up" is the admin mint faucet, labeled as such.
- The brain modes are real state (gsBrainMode), but there is no LLM behind
  "full" — see the inbox report's brain-tier experiment for what a real
  rung ladder costs.
