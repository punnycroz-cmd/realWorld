# The Wire v2 — spectator feed application spec & copy deck (world v19)

`world/wire.html` is the **full spectator surface**: the free core's primary
window, superseding `feed.html` (v5, kept as the lightweight minimal variant).
Everything in `feed-ui.md` §1–§4 (two provenances, event vocabulary, display
rules, daypart density) still applies — this file specifies what v2 adds on
top.

- Demo: `world/wire.html` (file://-safe; dual data source — see §2).
- Schema: `world/feed.json` (v19 additions: `req`, permalinks, follows,
  pagination contract).
- Invariants under test: playtest.json PT17.

## 1. Layout

Three columns, collapsing on small screens:

- **Left rail** — "Now on the block" venue cards (occupancy + crowd dot +
  pin), "The eight" cast strip (name, current public whereabouts,
  UNPOSSESSABLE badge, pin), Director upsell.
- **Center** — the wire itself: filter chips + search, the stream
  (newest-first, `role="log"`, `aria-live="polite"`), day separators, and the
  footer (load older / caught-up marker / Archive link).
- **Right rail** — the event detail panel (§4) and the Following list (§5).

## 2. Data source — the merge seam

One schema, two sources:

- **Live:** if `window.__aiBridge.gsViewerState` exists, wire.html polls
  `gsViewerState().feed` (game-v6 emits feed.json-shaped entries with stable
  `d<MMDD>-<feedN>` ids). Dedupe by id; sort by `(t, seq)`. The header badge
  reads `live`.
- **Demo:** otherwise a local stream driven by the mains' public routine
  tables + crowd dayparts, seeded with feed.json `demo_seeds`. The header
  badge reads `demo stream` — the demo never impersonates live.

The seam is intentionally thin: `livePoll()` is the only function that knows
`__aiBridge` exists. At merge, delete nothing — demo mode remains the
file://-safe fallback for press/playtest.

## 3. The stream

- **Newest-first**, 60 per page. "load older" extends the page (no jump);
  exhausted pages show the honest marker: *"You're caught up — nothing older
  than this today."* Older days route to The Archive (`history.html`).
- **"N new" pill.** When the viewer has scrolled away from the top, incoming
  events accumulate behind a sticky pill ("3 new — jump to top") instead of
  yanking the scroll position. The wire never moves text out from under a
  reader.
- **Day separators** mark day boundaries ("today — wednesday, sep 23") so the
  time column stays readable.
- **Followed-entity highlight:** events matching a pin get a blue left edge.
- Rows are clickable/keyboard-selectable (`Enter`); selection opens the
  detail panel and writes the permalink fragment.

## 4. Event detail + permalink

Selecting a row shows its full record in the right rail:

- id + timestamp + kind chip + full text
- venue (display name), who (character name or player handle), status
- `reason_code` on denies shown as the public why-class with the note
  *"(the screened text is never public)"* — the deny body itself is never
  rendered anywhere
- `compensated_cr` on admin actions
- **Request lifecycle trail:** request events carrying a `req` id group into
  a vertical timeline of every status that request has posted, in order, with
  the current row marked. One paid intervention = one legible story.
- **Permalink:** `wire.html#e=<id>`; a copy-link button. Ids are stable —
  the same id resolves in The Archive the next day (history.json keeps ids
  stable live→archive; game-v6 `d<MMDD>-<feedN>` ids already are).

## 5. Follows — free spectator pins

- Two target classes: `v:<venueId>` and `c:<charId>`. Pin buttons on every
  venue card and cast row; the Following panel lists them with unpin.
- The **following** chip appears only when at least one pin exists; it
  filters the stream to events whose `who`/`venue`/`attrs.mentions` hit a pin.
- Free, instant, reversible, localStorage-persisted (`rw_wire_follows`). A
  pin is a *filter*, never control — following a main never surfaces anything
  beyond public whereabouts (the panel says so).
- Character pins follow mains and ambients alike; hired residents (h##) too.
  Nobody can be pinned into visibility they don't have — pins only intersect
  what the camera already sees.
- Live mode calls `BRIDGE.gsWireFollow` where it exists so server-side
  follows survive devices; localStorage remains the demo store.

## 6. Honesty rules (carried + new)

- Viewer count and timestamps are real; no social-proof inflation.
- `quiet` events render as quiet lines; the empty-block state is honest copy,
  not filler.
- The demo badge is always visible in demo mode — "LIVE" refers to the world
  running, not to the data source.
- No affordance on this surface touches the world: no possess, no nudge, no
  tip, no report-the-AI. The only paid element is the Director upsell, and it
  is view-layer only (10 cr/30 min, plan §2.3 PROPOSAL verbatim).

## 7. Copy deck — v2 strings

| Moment | Copy |
|---|---|
| Source badge | `live` / `demo stream` |
| New events while scrolled | "N new — jump to top" |
| End of day | "You're caught up — nothing older than this today." |
| Empty wire | "The wire is quiet. The Archive holds earlier days." |
| Permalink note | "ids are stable — this event will sit in The Archive under the same id." |
| Reason-code line | "why-class — \<code\> (the screened text is never public)" |
| Following empty | "Nothing pinned. Follow a venue or a character — free, instant, reversible. It filters the wire; it never touches the world." |
| Char pin label | "(public whereabouts only)" |
| Day separator | "today — \<weekday, mmm d\>" / earlier days by date |

## 8. Demo limits

Simulated locally: block clock, routine-driven moves, scene beats, texture,
request threads (with multi-status lifecycles for the trail demo), one admin
event, viewer count. In production: feed = `gsViewerState().feed`;
occupancy = pawn/routine state; weather = `GS_WX_OVR`/live; follows = `gsWireFollow*`.
`feed.json` remains the schema contract.
