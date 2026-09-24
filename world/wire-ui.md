# The Wire — spectator feed application spec & copy deck (world v19; v3 @ v33 · v4 @ v47 · v5 @ v61 · v6 @ v75 · v7 @ v89 · v8 @ v103 · v9 @ v117 · v10 @ v131)

`world/wire.html` is the **full spectator surface**: the free core's primary
window, superseding `feed.html` (v5, kept as the lightweight minimal variant).
Everything in `feed-ui.md` §1–§4 (two provenances, event vocabulary, display
rules, daypart density) still applies — this file specifies what v2 adds on
top. Current page version: **v10 (world v131)** — §16.

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

## 10. v47 — the recap layer (world v47)

Still strictly view-layer. The additions answer the two questions a
leaning-back viewer actually asks — *"what kind of day is it?"* and
*"what did I miss?"* — using nothing but the feed's own events. There is
no editorial layer: every figure is the wire counted, and the UI says so.

### "the day so far" — the feed, counted

- A slim bar under the filters (`#daybar`, `d` key) always shows the live
  one-liner: `N events · <busiest venue> busiest · M requests open`.
- Opening it renders stat rows computed from `FEED` on every render:
  window covered (first → latest event time), busiest venue by event
  count, requests filed / open / closed (open = the v33 `LIVE_STATUSES`
  set), weather changes, admin actions + total compensated credits, and
  the viewer's own join time.
- The card's footer is part of the contract: *"these are the wire's own
  events counted — no editorial pick, no ranking, nothing extra a camera
  couldn't see."* It can never become a "trending" module — a ranking of
  content would invent salience the feed doesn't have.

### "earlier today" — the missed bar

- On join, everything already on the wire (seq ≤ join snapshot) is
  summarized in one dismissible bar (`#missedbar`): event count, request
  count, admin count, and the latest weather line verbatim.
- **catch me up** scrolls to the *oldest* pre-join event — the honest
  starting point for reading forward — and focuses it.
- Events with `t < join time` get a dimmed timestamp (`.early`) so the
  boundary stays visible while scrolling. There is no persistence and no
  fabricated personalization: the bar describes the feed as it stood at
  arrival, not a guess about the viewer.

### Declared-cost transparency

- `attrs.credits` / `attrs.minutes` (in the schema since v19's attrs bag,
  now emitted by demo requests and mirrored in feed.json seeds) render
  inline on request rows as `· N cr · M min`, and in the detail panel as
  *"declared — N cr · M min (paid upfront, hard cap — shown at filing)"*.
- Design §11 declares action + duration + upfront credits; the wire
  repeats them because the price was already public at filing — this is
  disclosure, not metering.

### Header weather follows the wire

- The header sky line is set by the newest `weather` event's own text
  (icon guessed from its words: fog/rain/sun/wind/cloud, else neutral).
  No fabricated temperature. Demo and live modes behave identically; a
  quiet sky keeps the last honest line.

### Copy deck — v47 strings

| Moment | Copy |
|---|---|
| Day bar (collapsed) | "the day so far — N events · \<venue\> busiest · M requests open" |
| Day card footer | "these are the wire's own events counted — no editorial pick, no ranking, nothing extra a camera couldn't see." |
| Missed bar label | "earlier today" |
| Missed bar body | "N events were already on the wire — K requests · J admin actions · latest sky: \<text\>" |
| Missed bar action | "catch me up" |
| Declared cost (detail) | "declared — N cr · M min (paid upfront, hard cap — shown at filing)" |
| Join marker | "you tuned in \<HH:MM\> — dimmed timestamps ran earlier" |

## 11. v61 — the Director's rail (world v61)

The left-rail Director upsell grows a real, free **preview** — the honest
version of "try before you pay": every control is view-layer, nothing is
gated content, and the page carries no purchase affordance (the paid pass
is filed at the Counter like any request; the bar links there, and that
is the whole monetization surface).

### The director bar

- `#dirbar`, toggled by the rail's **Preview** button, the `v` key, or
  `#dir=1`; `esc` closes it before clearing selection; zen hides it. The
  open state + choices persist per-viewer (`rw_wire_cam`) — viewer
  state, never world state.
- **Camera presets** — named chips (`park lawn`, `café row`,
  `the strip`, `clarion alley`, `the night shift`, `all cams`) mapping to
  venue sets. A live preset puts a gold edge (`.camhl`) on wire rows in
  that camera's view. A camera **marks** the wire; it never filters it —
  the stream stays whole and honest, and nothing a preset can do adds
  coverage the feed didn't already have.
- **Follow-cam** — a selector over the mains, the named ambients, and
  hired residents; rows whose `who`/`attrs.mentions` hit the pick get the
  same gold edge. Options are labeled "public whereabouts only": a
  follow-cam is a pin on existing visibility, never new visibility —
  off-the-feed stretches stay off, homes stay walls.
- **Replay scrub** — a slider spanning today's wire window
  `[earliest event .. now]`. Scrubbing shows "the wire at HH:MM — N
  events by then" plus the newest few rows at-or-before the minute,
  verbatim. It replays the feed's own record — nothing is reconstructed
  or guessed — and the card says so: *"the feed, replayed — the world
  itself kept running."* At live edge the card hides and the label reads
  `live`.
- **The pass pointer** — footer copy names the paid thing plainly:
  *"The Director pass — multi-cam, PiP, scrub inside the sim view — is
  10 cr / 30 min, filed at the Counter like any request."* Price adopts
  plan §2.3 PROPOSAL verbatim. No countdown, no trial-credit trick, no
  "unlock" verb on a button.

### Live-seam deepening (capability-checked)

- **Live receipt:** request detail panels call
  `BRIDGE.gsExplainRequest(req)` when the bus offers it, rendering a
  "live record" line (status · claim · declared cost · trail count) —
  the bus's own explainer, so the wire's account of a paid intervention
  matches the Counter's receipt word-for-word.
- **Live occupancy:** venue cards read `BRIDGE.gsOccupancy()` or
  `gsViewerState().occupancy` when offered (`{mains, labels, count}` per
  venue); absent either, the public-routine picture stands — the demo
  fallback is the contract reference, as ever.

### Copy deck — v61 strings

| Moment | Copy |
|---|---|
| Bar label | "director preview" |
| Bar honesty note | "view-layer only — cameras watch the wire, never the inside of a home" |
| Presets | "park lawn · café row · the strip · clarion alley · the night shift · all cams" |
| Follow-cam option | "\<name\> — public whereabouts only" |
| Replay label (scrubbed) | "the wire at \<HH:MM\> — N events by then" |
| Replay label (edge) | "live" |
| Replay footer | "the feed, replayed — the world itself kept running." |
| Pass pointer | "The Director pass — multi-cam, PiP, scrub inside the sim view — is 10 cr / 30 min, filed at the Counter like any request. Watching costs nothing either way." |
| Live record line | "live record — \<status · claim · declared · trail count\> (gsExplainRequest — the bus's own explainer)" |

## 12. v75 — the schedule + the person layer (world v75)

Two new answers for the two questions a settled-in viewer asks next —
*"what's already promised?"* and *"what has she been up to today?"* —
plus one comfort feature and one honesty counter. All view-layer, as ever:
the wire reads the world's public records; nothing here writes them.

### "on the book" — the wire shows the schedule

- `#bookbar` sits between the reaching-in-now strip and the missed bar.
  It lists the booked windows still ahead of the block clock
  (`HH:MM · claim · what · holder handle`), newest-first, max five.
  A window that already fired is a wire event, not a strip row — the
  strip only ever shows promises not yet kept.
- Source: an inline `BOOKW` mirror of `bookings.json` windows (the audit
  deep-compares them field-for-field — same rule as request.html's own
  BOOKW). Live mode merges `gsViewerState().calendar` (the v74 seam),
  deduped by `claim+start`, accepting `start_min` or `HH:MM`.
- Collapses on its header, the `b` key, persisted `rw_wire_book`. Footer
  links `book.html`. **No prices, no slot-picker, no claim affordance**
  on the wire — a viewer who wants a window files at the Counter.
  Copy: *"a booked window is a promise the world already made — the
  whole day's calendar lives at the Book."*

### "their wire today" — the person card

- `#cday`, a right-rail card under the event detail. Two ways in: click
  a name in the cast strip, or the "their wire today — \<name\>" button
  on any event whose `who` is a rostered character (C/A/h ids).
- The card lists every event today whose `who` or `attrs.mentions`
  touched that id — newest eight, then an honest *"…and N earlier"* —
  plus the same free pin affordance and the standing honesty line:
  *"public whereabouts only — homes are walls; off-the-feed stretches
  stay off."* An empty card says so: *"Nothing yet today — the wire
  only knows what a camera could see."*
- It is the wire counted per person — never a dossier. No invented
  activity, no inferred mood, no coverage the feed didn't already have.

### Thread mute — your screen, not the record

- A request event's detail gains **mute this thread**. That `req`'s
  lines drop out of the stream and the reaching-in-now strip for this
  viewer only (`rw_wire_mute`, persisted, reversible). The Following
  panel lists muted threads with one-click unmute.
- The honesty contract is explicit everywhere the feature appears:
  *"muted on your screen only — the wire's record is unchanged and The
  Archive keeps everything."* The day-so-far card still counts muted
  rows — it counts the wire, not your view of it. A mute is a reader's
  preference, never a moderation act; it cannot hide a paid
  intervention from anyone but the muter.

### Search match count

- The search box gains `#qcount` — a live *"N matching"* over the whole
  feed (text + `who` + resolved names + venue names). An honest count,
  never a ranking: the wire does not sort results by salience.

### Copy deck — v75 strings

| Moment | Copy |
|---|---|
| Book strip label | "on the book — N windows ahead — scheduled claims, public" |
| Book strip footer | "a booked window is a promise the world already made — the whole day's calendar lives at the Book." |
| Char card empty | "Nothing yet today — the wire only knows what a camera could see." |
| Char card honesty | "public whereabouts only — homes are walls; off-the-feed stretches stay off." |
| Char card remainder | "…and N earlier — the stream has them all." |
| Mute button / note | "mute this thread" · "muted on your screen only — the wire's record is unchanged and The Archive keeps everything." |
| Muted list label | "muted threads" |
| Search count | "N matching" |

## 13. v89 — the real wire seam (world v89)

The v6 live seam was written against the game track's *documented* feed
contract; game-v14 shipped the real one. This version aligns the page to
what `41_game_systems_feed` actually emits — same honesty rules, real
names.

### The bus's own entry shape

`gsWireTail()` entries carry `{id, n, t, day, kind, text, venue, who,
req, status, reason_code, attempt, mentions, attrs}`. The page now
reads them as they are:

- `n` is the monotonic feed sequence — it becomes the event's `seq`, so
  ordering, the missed bar, and request trails follow bus order exactly.
- `day` (PT date) drives **multi-day separators** — the stream no longer
  assumes everything is today; each day gets its own `wednesday, sep 23`
  style divider.
- `mentions` is top-level (not under `attrs`) — folded into
  `attrs.mentions` for the renderers that already speak that shape.
- `attempt` on denied entries renders an "asked for — \<kind\>" line:
  the *class* of ask is public, the screened text never is.
- `booked` (scheduled-window status on bus-forwarded entries, the v88
  seam) gets a chip and counts as open on the reaching-in-now strip.

### Incremental sync + real paging

- After the join handshake (`vs.feed` tail), polls prefer
  `BRIDGE.gsWireSince(maxN)` — a 50-line tail can drop events on a busy
  day; the cursor can't.
- **load older** calls `BRIDGE.gsWirePage({before:oldestN, limit:60})`
  live — paging the bus's own archive projection, not just the local
  array. `oldest:true` ends the stream at "the top of the record —
  earlier days live in The Archive."

### The clock is real when live

The block clock follows PT wall time (`America/Los_Angeles`) the moment
the bus attaches — the daypart label, the book strip's "still ahead"
filter, and the admin-recency window stop being demo math.

### The permit board (new right-rail panel)

`vs.board` / `gsResourceBoard()` render as a read-only claim board:
each contended resource (`sky`, `venue:<id>`, `char:<id>`, `openair`,
`paper:<unit>`, `listing:<unit>`) with its public state —
free / cool / locked / queued — honest times, queue depth, booked
markers. A spectator can see a resource is claimed; claims are filed at
the Counter, never here.

### Co-sessions + sponsored skies + the withheld count

- `vs.sessions` / `gsCoSessions()` pairs ride the reaching-in-now strip
  as "a + b · one scene" cards — the compatible-multiplayer overlaps the
  bus itself logs `session` events for.
- `vs.weather` sets the header line "player-called sky — \<wx\> until
  HH:MM · N sponsors" while a called sky holds.
- `gsWireStats()`'s real shape (`total`, `suppressed`, `displayFilter`)
  feeds a day-card line: "withheld from the wire — N, privacy screens,
  not downtime." The viewer counter only displays when the bus reports
  one — no invented audience.
- `gsExplainRequest` renders its real shape (`note`, `queuePos`,
  `blockedBy`, `behind`, `on` claim labels, review `code`) as
  "the bus says — \<note\>" plus waiting-on/blocked-by lines.
- Pins write through to `BRIDGE.gsWireFollow` with bus keys
  (`v:<venue>` / `m:<char>`) — the only write a spectator surface ever
  makes, and it's the viewer's own pin.

### Copy deck — v89 strings

| Moment | Copy |
|---|---|
| Permit board header | "the permit board — what's claimed, publicly" |
| Permit board footer | "the bus's own claim states … Read-only: claims are filed at the Counter, never here." |
| Top of record | "the top of the record — earlier days live in The Archive." |
| Withheld line | "withheld from the wire — N, privacy screens, not downtime" |
| Co-session card | "\<a\> + \<b\> · one scene" |
| Player-called sky | "player-called sky — \<wx\> until HH:MM · N sponsors" |
| Denied attempt | "asked for — \<kind\> (the class of ask only — the screened text is never public)" |
| Explainer | "the bus says — \<note\>" · "waiting on — \<claims\>" · "blocked by — \<reqs\>" |
| Queue discount | "filed queued — −15% (the queue discount, declared at filing)" |

## 14. v103 — the record layer (world v103)

v89 wired the page to the bus's wire endpoints; v103 takes the remaining
four — still strictly view-layer, still capability-checked with the demo
pipeline untouched.

- **Pin read-back** (`gsWireFollows()`): the Following panel hydrates
  from the bus's own pin set. Bus keys `v:<venue>` / `m:<char>` map to
  page keys `v:` / `c:`. `followsSync()` runs inside `livePoll`: new
  bus-side pins (set in the sim's own `gs-wire` panel or any other
  surface) are adopted into the viewer's panel; on the first sync only,
  page pins the bus lacks (localStorage carry-over) are pushed through
  `gsWireFollow`. After that the flow is one-directional — adopt, never
  delete. A viewer's unpin already wrote `false` through, so nothing
  resurrects a removed pin.
- **Archive depth** (`gsWireDays()`): the footer link stops guessing —
  "N days on record → The Archive" when the record spans more than one
  day, the classic "earlier days → The Archive" otherwise. The count is
  the bus's, not a fabricated history.
- **Vocabulary coverage** (`gsWireVocabulary()`): cached as `LIVE_VOCAB`
  (kinds/statuses/reasonCodes). The day card gains "statuses seen today
  — M of S on the bus's own vocabulary," counted from the wire's own
  events. A coverage count, never a completeness grade.
- **Self-check** (`gsWireAudit()`): runs when the day card opens — on
  demand, never per-poll (a full record scan isn't 1.5 s work). Live
  only: "the bus's self-check — N lines · self-check ok" or "M issues
  flagged by the record." Issues render as a count, never quoted — the
  audit's strings are for the console, not spectators.

### Copy deck — v103 strings

| Moment | Copy |
|---|---|
| Archive link, multi-day | "N days on record → The Archive" |
| Archive link, one day | "earlier days → The Archive" (unchanged) |
| Vocabulary coverage | "statuses seen today — M of S on the bus's own vocabulary" |
| Self-check clean | "the bus's self-check — N lines · self-check ok" |
| Self-check issues | "N lines · M issues flagged by the record" |
| Pin read-back note | (no new copy — pins adopted silently; the Following panel's standing copy already says it filters the wire and never touches the world) |

## 15. v117 — the attention layer (world v117)

Three additions that answer the settling-in viewer's next questions —
*"what kinds of things happen here?"*, *"when did today get busy?"*, and
*"tell me when that request moves"* — all strictly view-layer. Nothing in
this section writes to the bus: `gsWireFollow` remains the page's only
write, and a watch isn't even that — it's pure display state on the
viewer's own screen.

### The kind tray — the wire counted by kind

- `#kindtray`, a second filter row under the main chips: one chip per
  event kind **actually on the wire today**, each carrying its honest
  count (`weather 3 · press 1`). Kinds absent today get no chip — the
  tray describes the record, it doesn't promise coverage.
- Clicking a kind chip isolates the stream to that kind — AND-combined
  with the main filter, so `the block` + `weather` reads the way it
  sounds. Click again (or `all kinds`) clears. `g` cycles through the
  kinds present, then off.
- Footer note on the tray is the contract: *"the wire counted by kind —
  a lens, never a ranking."* Kind order is the fixed `event_kinds`
  vocabulary order, never count-sorted — a ranked tray would invent
  salience the feed doesn't have.

### The hour grid — the shape the wire drew

- The day card gains `#hourgrid`: 24 cells shaded by the wire's own
  per-hour event count (opacity ∝ count/max; empty hours sit at 7%).
  Cell text is the raw count; the tooltip reads "HH:00 — N events on
  the wire."
- Clicking an hour selects and scrolls to that hour's **first line**
  (the honest reading point — forward from there). If that hour's rows
  are older than the loaded page, an honest toast says so: *"that hour
  is older than the loaded page — load older first."* No fake jumps.
- Copy: *"the shape the wire drew today — click an hour to jump to its
  first line. Counted, not curated."* It's the day card's own counting,
  drawn — never a promise about tomorrow.

### Thread watch — the mute's mirror

- A request event's detail gains **watch this thread** beside the mute
  (`rw_wire_watch`, persisted, reversible from the Following panel).
  Watched threads' rows carry a small `◆` marker (title: *"watched
  thread — your screen only"*); their live-strip cards edge green.
- The Following panel gains a `watching` list beside `muted threads`:
  each entry shows the req id + its latest status chip + unwatch.
- Honesty copy (shared with mute): *"muted or watched — your screen
  only; the wire's record is unchanged and The Archive keeps
  everything."* Watchlist header: *"a watch flags the thread's new
  lines for you only — the record is everyone's."*
- Deliberately weaker than a pin: a watch never writes `gsWireFollow`
  (it isn't server-side state at all), never filters the stream, and
  can't surface anything — it only marks what's already public.

### The pin-aware pill

- The "N new — jump to top" pill gains a counted tail: `· M on your
  pins` when pending events hit a pinned venue/character or a watched
  thread. Same count, same click — it answers *"is any of that for
  me?"* without a notification system, a badge economy, or a sound.

### Copy deck — v117 strings

| Moment | Copy |
|---|---|
| Kind tray label / note | "kinds" · "the wire counted by kind — a lens, never a ranking" |
| Kind chip | "\<kind\> N" (count from the wire) · clear chip "all kinds" |
| Hour cell tooltip | "HH:00 — N events on the wire" |
| Hour grid note | "the shape the wire drew today — click an hour to jump to its first line. Counted, not curated." |
| Hour jump miss | "that hour is older than the loaded page — load older first" |
| Watch button | "watch this thread" → "unwatch this thread" |
| Watch/mute honesty | "muted or watched — your screen only; the wire's record is unchanged and The Archive keeps everything." |
| Watchlist label / note | "watching" · "a watch flags the thread's new lines for you only — the record is everyone's." |
| Watched row marker | "◆" (title: "watched thread — your screen only") |
| Pill tail | "· M on your pins" |
| `g` key | "cycle the kind lens — kinds today, counted" |

## 16. v131 — the return layer (world v131)

The free observer loop's missing half: a viewer who leaves and comes back
should be able to *catch up*, and a settled-in viewer should be able to
*guess and be answered*. Both additions are strictly view-layer — a call,
like a watch, never reaches the bus; `gsWireFollow` remains the page's only
write. This is the spectator-side reading of the production-3 "catch-up
edition" and "non-wager prediction" beats: the wire's own record is the
only evidence, and the UI says so.

### "since you were away" — the catch-up edition

- `#edition` sits between the day card and the director bar; `u` key,
  `#u=1`, persisted open state `rw_wire_ed`.
- The page stamps the feed's edge (`rw_wire_lastseen` = {seq, t, id}) as
  the session advances and on `pagehide`/`beforeunload`; at the next
  visit that edge is the baseline. Baseline resolution is id → seq → t
  (a demo restart can regress seq; the block clock can't).
- A **verified change** is something the wire itself recorded crossing
  the boundary: a request thread filed or moved (`rq-1038 moved —
  queued → refunded`), a sky change, a registry/housing event, a press
  post, an admin action, a new resident. Moves, scenes, and venue
  texture are deliberately *not* changes — the day happening is not
  news, and the footer says so.
- **At most three rows**, newest-first. Each row links to its own line
  (`the line`), to the thread's last pre-away line (`before that` — the
  earlier context), and to the whole trail (`the thread`). A thread
  whose latest status is still open carries `still open` — the
  unresolved follow-up, per the catch-up spec.
- Honest states: no baseline yet → "first visit on record — the wire
  keeps the edge you leave"; baseline but no changes → "The record is
  unchanged since HH:MM — quiet is a finding, not a gap." The card never
  fabricates a delta.
- Footer is the contract: *"at most three verified changes, each linked
  to its own lines — moves and street texture aren't 'changes'; the
  stream has them. Nothing inferred, nothing ranked."*

### calls — the stakeless prediction ledger

- On any request event whose thread's latest status is still open, the
  detail panel gains **call it — will run / won't run**
  (`rw_wire_calls`, `{req: {pick, t}}`). One call per thread; change or
  clear while open; locks the moment the record answers.
- Terminal statuses resolve the call: `resolved` / `player session
  ended` → it ran; `not approved` / `refunded` → it didn't. The detail
  panel and the Following panel's **your calls** list then read
  *"you called — will run at HH:MM · the record shows resolved — your
  call held / the record went the other way. kept, not scored."*
- **No stakes, no score, no share, no streak.** Nobody else sees a call;
  there is no accuracy counter anywhere — a tally would invent a game
  the spectator didn't ask for. The copy says so at the point of use:
  *"a call is a note to yourself — no stakes, no score, nobody else sees
  it. The record answers when the thread closes."*
- Calls on terminal-or-gone threads can be dismissed (✕) from the list;
  a call on an open thread can be cleared — but the record's answer is
  never erasable retroactively (the toast says "the record already
  answered — the call stands" for in-flight clears; the list ✕ removes
  settled entries as housekeeping).

### Copy deck — v131 strings

| Moment | Copy |
|---|---|
| Edition head (baseline) | "since you were away — the record since \<HH:MM\> — up to three verified changes" |
| Edition head (first visit) | "since you were away — first visit on record — the wire keeps the edge you leave" |
| First-visit body | "Nothing to compare yet — from here on, the wire remembers where you left. Come back and this card lists what verifiably changed." |
| No-change body | "The record is unchanged since \<HH:MM\> — quiet is a finding, not a gap." |
| Change row (moved) | "request \<id\> moved — \<old status\> → \<new status\>" |
| Change row (filed) | "request \<id\> filed — \<status\> · \<handle\>" |
| Change row links | "the line" · "before that" · "the thread" |
| Open marker | "still open" |
| Edition footer | "at most three verified changes, each linked to its own lines — moves and street texture aren't 'changes'; the stream has them. Nothing inferred, nothing ranked." |
| Line link miss | "that line is older than the loaded page — load older first" |
| Call affordance | "call it — will run / won't run" |
| Call honesty | "a call is a note to yourself — no stakes, no score, nobody else sees it. The record answers when the thread closes." |
| Call resolved | "you called — \<pick\> at \<HH:MM\> · the record shows \<status\> — your call held. / the record went the other way. kept, not scored." |
| Call list label / note | "your calls" · "notes to yourself — no stakes, no score, nobody else sees them. The record answers." |
| Locked call toast | "the record already answered that thread" / "the record already answered — the call stands" |
| `u` key | "since you were away — the catch-up edition" |
