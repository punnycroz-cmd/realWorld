# Spectator Feed ("The Wire") — spec & copy deck (world v5)

The **free core** of the product (design §5): watching the neighborhood, the
characters, and the public feeds costs nothing — that is the funnel's entire
top and it is never metered, never ad-interrupted inside the sim view, never
throttled.

Companion artifacts:

- `world/feed.html` — working demo of this spec (file://-safe; the block
  clock, occupancy, and event stream are simulated locally). Every state
  below is reachable in it.
- `world/feed.json` — machine-readable event schema, event vocabulary,
  display rules, and the demo seed set.
- `world/wire-ui.md` + `world/wire.html` — **v6 (world v75):** the full
  spectator application (detail panel, permalinks, request lifecycle
  trails, follows, pagination, zen/hold/keys/live-now strip, day-so-far
  recap, earlier-today bar, declared-cost lines, Director preview rail,
  on-the-book strip, per-character day card, thread mute — spec §9–§12).
  feed.html stays the lightweight variant.
- Policy: `world/moderation-notes.md` (§11 scope). Request surface:
  `world/request-ui.md` + `world/requests.json` (status vocabulary is
  shared verbatim).

## 1. What the feed is

One stream, two provenances:

- **World events** — what a camera on the street could verify: arrivals,
  departures, venue crowd levels, recurring crowd-scene beats, weather
  (including player-called weather), public registry events (move-ins,
  listings filled), and posts to *Mission Unfiltered* (a public in-world
  blog — see §3).
- **Request events** — every paid intervention with attribution, per
  design §5/§11: `requested · in_review · approved · running · queued ·
  resolved · refunded · not approved · player session ended`. Admin
  actions appear in the same stream, always attributed `admin`, always
  carrying the compensation line when players were displaced.

Filters: **all / the block / requests / admin / followed** (followed =
venue pins, a free spectator feature).

## 2. Event vocabulary (feed.json `event_kinds`)

| kind | means | example text |
|---|---|---|
| `move` | named character changes venue | "Mars ducked into Mudhaus" |
| `scene` | recurring crowd beat (crowd-scenes §4) | "The 15:00 release — June to the park with books" |
| `venue` | crowd-level note | "Buy-Rite Creamery's line is doing the thing again" |
| `weather` | sky change | "Fog burned off over the park — full sun" |
| `request` | player request lifecycle | "weather — clear skies over Dolores Park, 2 h · running" |
| `admin` | owner/admin action | "admin action — venue window reset · affected players compensated 90 cr" |
| `press` | Mission Unfiltered post | "Mission Unfiltered posted: 'The Salsa-Bar Ledger' — anonymous, as always" |
| `housing` | public registry event | "Listing filled — 9457 Guerrero St, Unit 2 comes off the board" |
| `quiet` | honest-empty marker | "Close-down. Bar stragglers, the late kitchen, last courier runs." |

## 3. Display rules — what a camera can and cannot see

These are **structural**, not filter settings — the feed schema has no
fields for the forbidden content:

- **Surface only.** Feed text reports observable fact: who arrived, where,
  crowd size, sky. No thoughts, no dialogue, no interior-of-home content.
  Homes render as `home` / "headed home" — residential interiors are never
  a feed surface (venue interiors are the show's cameras; apartments are
  walls).
- **Secrets can't appear.** Drama seeds are absent from the feed schema —
  the same whitelist discipline as possession briefings and the mod
  console (public profile + surface relationships + routine).
- **"Off the feed" is honest.** When a main is in an uncovered/unannounced
  stretch (e.g. Dani's evenings), the feed says so in those words — it
  does not invent coverage.
- **Mission Unfiltered** is public content — the *blog* appears on the
  wire; the *author* is a C1 secret and the feed never speculates about
  authorship. Any event naming the author is a bug, not content.
- **Request text is screened text.** Denied request bodies are never
  displayed (feed shows neutral "request not approved"). Displayed text
  has already passed the §11 screen; the marketing MODERATION-PLAN §2.3
  display-filter decision (verbatim / summarized / hybrid) is still
  owner-gated — this demo shows verbatim-passed text.
- **Ambients appear by name** (public roster) but never as request
  targets; minors (A04, A20) appear only in public-space contexts.
- **Parody names only.** All venue strings come from `world/businesses.md`
  canonical names (the same strings `sfDisplayName` renders).
- **Honest metrics.** Viewer count and timestamps are real — no inflated
  social proof, no fake "someone just bought" ticks (no dark patterns).

## 4. Dayparts drive density (crowd-scenes.md §1)

The wire's rhythm is the block's rhythm. Quiet hours are *content*, not a
bug to patch — the feed goes quiet and says so ("the honestest hour —
don't fill it"). Demo clock runs ~1 block-min/sec so a sitting spans the
evening arc; production is real-time world clock.

| Daypart | wire texture |
|---|---|
| 04–06 pre-dawn | bakery lights, opening walk — sparse, lovely |
| 06–10 commute/rush | moves + Mudhaus rush scenes |
| 10–15 working/lull | venue notes, courier loops |
| 15–19 after-school | release scene, park fills — densest free hour |
| 18–24 night | 600 Club, El Farolote line, evening nurses |
| 00–04 empty | `quiet` events only; the feed says the block is asleep |

## 5. "Now on the block" + cast strip

- **Venue cards** show current occupancy (mains named, ambients as scene
  labels) with a crowd dot (low/med/high) and a free **follow** pin.
  Occupancy is computed from the mains' public routine tables + ambient
  daypart presence — in production it reads the same routine + pawn state
  the renderer already has.
- **Cast strip** = the 8 mains' public profile card + current whereabouts,
  each stamped `UNPOSSESSABLE`. The strip is briefing-safe by construction
  (public fields only).
- **Director upsell** sits in the left rail: "multi-cam, follow-mode,
  replay scrub — 10 cr/30 min. View-layer only; it changes nothing in the
  world." Honest, dismissable, never a countdown, never a badge of shame
  on the free view. (Price adopts plan §2.3 PROPOSAL verbatim.)

## 6. Copy deck — feed-facing strings

| Moment | Copy |
|---|---|
| Character home | "headed home" — never interior detail |
| Uncovered stretch | "went off the feed — her own business" |
| Empty block | "The empty block. Streetlights, a cat, nothing." |
| Admin action | "admin action — \<what\> · affected players compensated N cr" |
| Player weather | "rain over the park, 2 h — called by \<handle\>" |
| Session end | "player session ended" (neutral — no shaming) |
| Queued expiry | "queued request expired before activation — refunded" |
| Blog post | "Mission Unfiltered posted: '\<title\>' — anonymous, as always" |
| Follow pin | "follow" → "following" (free, instant, reversible) |
| Director preview toast | "View-layer only; the world doesn't notice." |

## 7. Demo limits (what's simulated)

`feed.html` simulates locally: the block clock, routine-driven move
events, scene beats, texture lines, request/admin interlopers, viewer
count. In production these become subscriptions: world events from the
canonical ledger (game substrate), request events from `gsViewerState`,
occupancy from pawn/routine state, weather from `GS_WX_OVR`/live weather.
`feed.json` is the event contract that merge targets. The copy above is
final.
