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
  than this today."* Older days route to The Archive (`archive.html`;
  `history.html` remains the lightweight day-browser variant).
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

## 9. v33 — lean-back + control polish (world v33)

All v33 additions are **view-layer only**. No key, button, chip, or pin on
this surface can reach the world — the audit's `wire` gate enforces it.

### Zen mode — "watch like a channel"

- Header `zen` button, `z` key, or `#z=1` URL: the rails, the upsell, and the
  fine print collapse; the stream widens and its type steps up. The source
  badge (`live` / `demo stream`) and the clock stay — a lean-back viewer
  still knows what they're watching and whether it's a demo.
- `esc` or `z` again leaves zen. Zen is honest about what it is: a display
  mode, never a content tier — nothing shown in zen was hidden outside it.

### Hold — the display pauses, the world doesn't

- `hold` button / `h` key freezes rendering. Events keep accruing; a bar
  reports the honest backlog ("display held — 14 new events behind this
  bar. The world didn't pause; the display did. Click to catch up.").
- Release re-renders to current. In live mode the bridge keeps polling and
  the backlog counts bridged events; nothing is lost.
- This is deliberately the opposite of a pause-the-world affordance: the
  copy says so in words.

### "Reaching in now" strip

- Between the filters and the stream: cards for every request whose
  **latest** status is still open (`requested / in_review / approved /
  approved (modified) / queued / running`), each carrying the filer's
  handle + status chip; recent admin actions (~last 45 block-minutes) join
  as pink-bordered cards. A card opens the request's lifecycle trail.
- This is the design §5 transparency promise made glanceable: at any moment
  a viewer can see *who is reaching into the world right now* without
  scrolling. Empty strip = nothing paid is live — the strip hides entirely.

### Keyboard map

`j`/`k` move the selection through visible rows · `enter` opens the record ·
`/` focuses search · `f` toggles the following filter · `z` zen · `h` hold ·
`?` shows the help card (also a `keys` button in the stream footer) · `esc`
walks out: popover → zen → selection → search. Selection movement never
scrolls past the rendered page — `load older` still owns depth.

### `#r=<req>` request permalinks

`#e=<id>` links an event; `#r=<req>` links a **request** — it resolves to
the newest event in that request's trail, so the link stays meaningful as
the lifecycle advances. Unresolvable ids get an honest toast pointing at
The Archive, not a silent dead end.

### Mentions + pin-from-detail

- `attrs.mentions[]` render in the detail panel as chips (name resolved via
  the public roster); clicking a chip pins/unpins that character.
- `who`/`venue` on any event get inline `pin` buttons in the detail panel —
  same follows system, one less trip to the left rail.
- `attrs.sponsors[]` (co-sponsored world events) and `attrs.surge` render
  as their own meta lines — attribution is never folded into the body text.

### Density + motion

- `density` chip toggles cozy/compact rows, persisted under
  `rw_wire_density`. `prefers-reduced-motion` disables the live-dot blink.

### Copy deck — v33 strings

| Moment | Copy |
|---|---|
| Hold bar (backlog) | "display held — N new events behind this bar. The world didn't pause; the display did. Click to catch up." |
| Hold bar (clean) | "display held — the world keeps running. Click to catch up." |
| Strip label | "reaching in now" |
| Request permalink miss | "request \<id\> isn't on today's wire — try The Archive" |
| Co-sponsor line | "co-sponsors — \<handles\> (same world event, not a discount)" |
| Surge line | "surge — priced at surge (contested resource, disclosed at filing)" |
| Key-card footer | "Everything here is view-layer. No key, button, or pin on this page can touch the world." |
