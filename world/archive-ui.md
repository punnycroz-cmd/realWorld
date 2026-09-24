# The Archive — history-browser application spec & copy deck (world v20; v3 pass v34; v4 pass v48; v5 pass v62; v6 pass v76)

`world/archive.html` is the **full history surface**: the spectator layer of
the canonical ledger, browsable five ways. It supersedes `history.html`
(v6, kept as the lightweight day-browser variant). Everything in
`history-ui.md` §1–§4 (the one law, rumor layer rules, what the archive is
NOT) still applies — this file specifies what v2 adds on top.

- Demo: `world/archive.html` (file://-safe; dual data source — §2).
- Schema: `world/history.json` (v20 additions: `req` ids on request
  events, `archive_ui` contract block).
- Invariants under test: playtest.json PT18.

## 1. Layout

Three columns, collapsing on small screens:

- **Left rail** — "Browse" view switcher (day / person / venue / word on
  the block / the ledger) with contextual pickers, then "Days on record"
  (every archived day, newest first, with entry counts; today flagged ●),
  then the scope card.
- **Center** — the active view.
- **Right rail** — the record detail panel (§6) and "Reading the archive"
  (short honesty explainer).

## 2. Data source — the merge seam

One schema (`history.json` day-objects), two sources:

- **Live:** if `window.__aiBridge.gsWireDays` and
  `__aiBridge.gsWireArchiveDay` exist (game-v6), the app reads day keys
  from `gsWireDays()` and materializes each day via
  `gsWireArchiveDay(dateStr)` — which returns history.json-shaped day
  objects (a bare event array is also accepted). The badge reads
  `live archive`.
- **Demo:** otherwise the inlined seed week mirrors `history.json` `days`
  verbatim. The badge reads `demo archive` — the demo never impersonates
  live data.

`loadArchive()` is the only function that knows `__aiBridge` exists. At
merge, delete nothing — demo mode remains the file://-safe fallback for
press/playtest.

## 3. View: by day

The v1 browser carried forward:

- Day header: weekday + date, entry count, word-on-the-block count,
  "coverage: street-level only", and on today the **still-being-written**
  marker (the archive holds through the last completed hour).
- **Hour strip:** 24-segment density bar; click isolates an hour, click
  again releases. On today, unwritten hours render dimmed and are
  unclickable — hovering reads "not written yet".
- **Kind chips:** all / the block / word on the block / requests / admin /
  Mission Unfiltered.
- **Honest gaps:** stretches ≥2 h between public events render a
  "— off the feed (HH:MM → HH:MM) —" line. Uncovered time is stated, not
  interpolated.
- **Search:** substring over display text + resolved names + venue names +
  mentioned names only — the index contains nothing else.
- Rows are clickable; selection opens the record panel and writes the
  permalink.

## 4. Views: by person / by venue

Cross-day trails built **structurally** — `who` + `mentions[]` fields,
never string-matching — so they can't over-match into text that isn't
there.

- **Person:** header shows name, role (mains), "public whereabouts only"
  chip, and honest counts ("N sightings · M days on record"). Events are
  grouped under day separators (newest first) with an "open day →" jump.
  A person with no public record reads the empty-state copy — the archive
  never infers whereabouts (Dani's evenings stay her own business).
- **Venue:** same trail keyed on `venue`; `block` includes street-level
  events with no venue field. Headers show the canonical parody name.
- Neither view offers any affordance — a trail is reading, never reach.

## 5. View: word on the block — the rumor board

All rumor events across all days, newest first:

- **Tally strip:** open / debunked / faded / stood counts for the whole
  archive.
- Each rumor card: the talk (UNCONFIRMED badge always), time + day, the
  place it was overheard ("overheard near Buy-Rite" — never a person),
  and its outcome line or "still open — the block hasn't settled it."
- Clicking a card jumps to its day with the record open — rumors stay
  attached to the day that heard them.
- Rules unchanged from v1: rumors only ever distort already-public events;
  no field can carry a seed; a true rumor about a secret is a bug, not
  content.

## 6. View: the ledger

Every `request` + `admin` event across all days — the "who reached into
the world" record, verbatim:

- **Summary strip:** request events, distinct player handles, admin
  actions, and declared credits where `attrs.credits` exists.
- Rows keep the payer handle and status chip exactly as the live wire
  showed them — the archive does not sanitize history. Denied requests
  show "not approved" (+ why-class where the feed carried it); the
  screened text was never written and cannot be found here.
- Admin rows carry compensation detail (`attrs.compensated_cr`) when
  players were affected.

## 7. Record detail + permalinks

Selecting any row shows its full record in the right rail: id, time + day,
kind, text, venue, who/seen names, status, why-class (denies), rumor
place-source + outcome, compensation/credits lines — and, when `req` is
present, the **request lifecycle trail** (every status event that
intervention posted, in order, clickable).

Permalinks:

| Fragment | Resolves to |
|---|---|
| `#e=<id>` | the record; day auto-derived from the `d<MMDD>` id prefix |
| `#d=<YYYY-MM-DD>` | day view |
| `#v=person&who=<id>` / `#v=venue&venue=<id>` | trail views |
| `#v=word` / `#v=ledger` | board views |

`copy link` button on every record. Ids are stable live→archive — a wire
permalink resolves in The Archive the next day, unchanged (game-v6
`d<MMDD>-<feedN>` ids already satisfy this).

## 8. Honesty rules (carried + new)

- The archive is FREE — no tier sees more. The Director sub's replay-scrub
  is a camera feature, not an information tier.
- The demo badge is always visible in demo mode.
- Person/venue/ledger views are **projections of the same rows** — they
  add no information, only arrangement.
- No affordance on this surface touches the world. No comments, no votes,
  no annotations (unchanged from v1 — a comment layer is a community
  decision, not a history decision).

## 9. Copy deck — v2 additions

| Moment | Copy |
|---|---|
| Source badge | `live archive` / `demo archive` |
| Unwritten hour tooltip | "HH:00 — not written yet" |
| Honest gap | "— off the feed (HH:MM → HH:MM) —" |
| Person empty | "Nothing public on record — the archive only holds what a spectator could have seen." |
| Person head | "N sightings · M days on record" + `public whereabouts only` chip |
| Ledger head | "every paid intervention and admin action, attributed — the archive doesn't sanitize who paid" |
| Ledger stats | "N request events · M players reached in · K admin actions · X cr declared" |
| Rumor board head | "talk overheard in public — place-sourced, never person-sourced, always marked" |
| Record footer | "id \<id\> — stable; this event sat on the wire under the same id." |
| Wire back-link | "→ The Wire (live today)" |

## 10. v34 — The Archive v3

Four additions, all projections — they rearrange the same rows and add
zero information:

- **Threads view** (`#v=threads`, `#v=threads&th=<id>`). Named chains of
  already-public events. Events carry `thread:[ids]` (day_schema); the
  registry (`history.json` `threads`, mirrored inline as `THREADS`)
  carries `{label, blurb}`. List cards show member count, day span, and
  a derived open/settled state (open = a member rumor still open or a
  member request in an open status). A thread asserts nothing beyond
  its member rows — the label is archive chrome, not narration. Records
  show "on thread(s)" chips that jump to the thread.
- **Ledger payer lens.** One chip per handle on the ledger (verbatim,
  `admin` rides as its own chip). Selecting one filters the rows and
  adds a per-payer line — event count plus declared-credit total
  computed from `attrs.credits` only where declared; undeclared reads
  "no credits declared on record". Attribution stays unsanitized.
- **Whole-record search.** The day view's search gains a `whole record`
  scope chip — hits render grouped by day through the same trail
  renderer, headed "N hits across M days". The index is unchanged:
  display text + resolved names + venue names + mentions only.
- **Copy transcript.** A `copy transcript` control on the day view
  emits the day as plain text — `HH:MM  KIND  text`, rumors prefixed
  `[unconfirmed]`, statuses bracketed, honest `off the feed` lines for
  ≥2 h gaps. The header line carries the source badge
  (`live archive`/`demo archive`) so a pasted transcript can never
  impersonate live.

Copy deck additions:

| Moment | Copy |
|---|---|
| Threads head | "storylines the public record already tells — arrangement only, nothing here wasn't on the wire" |
| Thread card meta | "N events · <first day> → <last day> · still open / settled" |
| Thread detail chip | "arrangement only — every line was already public" |
| Whole-record head | "whole record — N hits across M days" |
| Whole-record empty | "Nothing in the public record matches — the archive only indexes what a spectator could have seen." |
| Payer line | "<handle> — N events · X cr declared / no credits declared on record" |
| Transcript header | "real world — the archive — <weekday>, <date> (<source badge>)" |
| Record thread chips | "on thread(s): <label>" |

## 11. v48 — The Archive v4 — the week layer

Four additions. Same rule as ever — projections of public rows, counted,
never curated. The week view is the archive's answer to the wire's
"day so far" recap (v47): every figure a count, the copy says so.

- **The week view** (`#v=week`, first chip in Browse). Three blocks:
  - *Summary strip* — days on record, total entries, requests filed
    (distinct `req` ids, falling back to the event id when `req` is
    absent), admin actions, word-on-the-block count with open count,
    and declared/compensated credit totals where `attrs` carries them.
  - *The grid* — day × filter-count table. Columns are the day view's
    own kind filters (`the block` / word / requests / admin / press) and
    each cell is exactly what that day's matching filter would show —
    press posts count under both "the block" and "press", the same way
    they do on the day view. Clicking a cell opens that day pre-filtered.
  - *Day by day* — one row per day: coverage span (first → last event),
    busiest corner (mode of the `venue` field, `null` counted as
    "the block", ties break to whichever venue peaked earliest), entry
    count, today's "still being written" flag. Click opens the day.
  - *Still open* — chips for threads whose derived state is open (same
    `threadOpen` rule as the threads view: an open member rumor or a
    member request in an open status). Empty state: "every thread on
    record has settled — for now".
- **Day-to-day walk.** `‹ prev day` / `next day ›` buttons flank the
  day header (disabled at the ends, never wrap) and ← / → arrow keys do
  the same while the day view is active — inert inside inputs, inert on
  other views. A `.keyhint` chip marks the shortcut.
- **Around that time.** The record detail gains a same-day neighbor
  trail: the ±2 adjacent rows of that day, current row marked, each
  clickable. Same rows, smaller window — no context that wasn't public.
- **Settled by.** `outcome.by` (optional, rumor events) names the id of
  the already-public event that settled the talk. The record detail
  renders it as a jump ("settled by the public record — HH:MM · kind").
  It may only ever point at an event that stood on the wire in its own
  right — never at a record written to explain the rumor. Unresolvable
  or absent ids simply don't render.

Copy deck additions:

| Moment | Copy |
|---|---|
| Week chip | "the week — the whole record at a glance — counted, not curated" |
| Week head | "N days · counted from the wire's own events — no editorial pick, no ranking" |
| Grid subhead | "each cell is what that day's filter would show; press posts also count under 'the block'" |
| Day rows subhead | "busiest corner = the most-tagged public venue; ties break to whichever peaked earlier" |
| Open threads subhead | "threads whose public record hasn't settled" |
| Open threads empty | "every thread on record has settled — for now" |
| Day walk | "‹ prev day" / "next day ›" + "← →" keyhint |
| Neighbor trail head | "around that time — same day, the wire's own rows" |
| Settled-by line | "settled by the public record — HH:MM · <kind>" |

## 12. v62 — The Archive v5 — the reading layer

Four additions. The standing rule holds — projections of public rows,
counted, never curated — plus a new one for the shelf: reader-side state
is the reader's own device, never the world's.

- **Your shelf** (`#v=shelf`). Every record detail gains a `keep on the
  shelf` toggle. Pins persist in `localStorage` under `rw_archive_shelf`
  — this browser only; nothing is sent anywhere, and the header copy
  says so ("the shelf lives in this browser — the archive doesn't
  remember you"). The shelf view lists pinned records through the same
  day-grouped trail renderer, with a summary strip: pinned count plus an
  honest "N pinned ids not in this archive source" when a pin outlives a
  demo↔live source change (ids are stable; an unserved pin is stated,
  never dropped silently or invented). `copy shelf` emits the pins as a
  transcript carrying the source badge — same honesty rule as the day
  transcript. `clear the shelf` empties it; the toast confirms nothing
  was sent.
- **Seen together** (`#v=pair&a=<id>&b=<id>`). Two pickers in the left
  rail; the trail is every event where both ids appear — structurally,
  via `who`/`mentions` only. Header: `public co-presence — the wire's
  own rows, never a claim about the relationship`. Same-name selection
  redirects to the person view with a plain explanation. Empty picker
  state explains the view without implying anyone was together.
- **Person: seen with + first/latest.** The person head gains a
  `seen with — public rows only` chip row: the top-3 co-occurring ids
  across the trail (counted, ties alphabetical), each chip opening the
  pair view for that pair. Plus `first on record` / `latest` jump chips
  that select the trail's end rows. All counted from rows; none of it
  asserts anything the rows don't.
- **Venue rhythm.** The venue view gains `the corner's rhythm` — a
  24-hour histogram of that venue's tags across the whole record,
  non-interactive, tooltips read "HH:00 — N across the record". Label:
  `counted across the whole record, not a promise` — the bars say where
  the wire happened to look, never where the corner will be.

Copy deck additions:

| Moment | Copy |
|---|---|
| Shelf chip | "pins kept on this device — the archive doesn't remember you" |
| Shelf head | "the shelf lives in this browser — the archive doesn't remember you; nothing is sent anywhere" |
| Shelf empty | "Nothing pinned — 'keep on the shelf' on any record puts it here. The shelf is this browser's, not the world's." |
| Shelf orphans | "N pinned ids not in this archive source" |
| Shelf transcript head | "real world — the archive — your shelf (<source badge>)" |
| Record toggle | "keep on the shelf" / "on the shelf — take off" |
| Pair chip | "two names, one public record — co-presence only" |
| Pair head | "public co-presence — the wire's own rows, never a claim about the relationship" |
| Pair empty | "Pick two names on the left — …the archive doesn't guess at relationships." |
| Seen-with label | "seen with — public rows only:" |
| Person jumps | "first on record — HH:MM · <day>" / "latest — HH:MM · <day>" |
| Rhythm head | "the corner's rhythm — counted across the whole record, not a promise" |
| Rhythm tooltip | "HH:00 — N across the record" |

## 13. v76 — The Archive v6 — the shape layer

Four additions. The standing rule holds — projections of public rows,
counted, never curated — plus the shelf rule: reader-side state stays
on the reader's device.

- **The same hour** (`#v=hour&h=<0-23>`). An hour-of-day picker in the
  left rail; the center lists every event the wire ever wrote inside
  that hour, across all days, through the day-grouped trail renderer.
  The head counts rows and days, names the most-tagged corner in that
  hour (same busiest-corner rule as the week rows), and counts kinds.
  Copy calls it what it is: "a shape the wire happened to draw — not a
  schedule". Empty hour: "the block keeps some hours to itself."
- **Day vs day** (`#v=cmp&d1=<day>&d2=<day>`). Two day pickers
  (default: the latest two days on record). The table counts each
  day's own rows side by side — entries, coverage span, busiest
  corner, then one row per day-view kind filter (`the block` / word /
  requests / admin / press). Kind cells open that day pre-filtered, so
  a number and its rows can never disagree. "Shared corners" lists
  venue ids the wire tagged on both days; chips open the venue view.
  Same day picked twice gets a plain explanation, not a table.
- **Person lens.** The person trail gains a cut-finer chip row:
  `all rows` / `followed` (the wire's row is theirs — `who`) /
  `named in passing` (somebody else's row named them — `mentions`).
  Same scope either way; the lens subtracts, never adds. The head
  count still reports the whole trail.
- **Copy record + j/k.** The record detail gains `copy record` — the
  single record as a badged plain-text line (`record <id>`, source
  badge in the header line, same honesty rule as the day transcript).
  On the day view, `j` / `k` walk the visible rows — selection,
  detail, and permalink move together; clamped at both ends, inert
  inside inputs and on other views.

Copy deck additions:

| Moment | Copy |
|---|---|
| Hour chip | "the same hour — one hour of day, every day on record — a shape, not a schedule" |
| Hour head | "The block at HH:00 — a shape the wire happened to draw — not a schedule" |
| Hour meta | "N rows · M days on record · most-tagged corner: <venue> (K)" |
| Hour kinds | "kinds counted — N kind · N kind …" |
| Hour empty | "Nothing public in this hour on any day — the block keeps some hours to itself." |
| Cmp chip | "day vs day — two days side by side — counted, not explained" |
| Cmp head | "<day> vs <day> — same rows, two columns — counted, not explained" |
| Shared corners | "shared corners — venue ids the wire tagged on both days" |
| Cmp footnote | "a kind cell opens that day pre-filtered — the number and the rows never disagree" |
| Cmp same-day | "Same day twice — pick two different days on the left." |
| Lens label | "the trail, cut finer:" |
| Lens chips | "all rows" / "followed" / "named in passing" |
| Copy record | "copy record" → toast "record copied — one line, badge included" |
| Record transcript head | "real world — the archive — record <id> (<source badge>)" |
| Row walk | "j / k" (in-page; no separate chip — the ← → keyhint already marks day-view keys) |

## 14. Merge notes (for the game track)

`gsWireDays`/`gsWireArchiveDay` (game-v6) are the live contract; day
objects must keep `history.json` `day_schema` fields, with `req` emitted
on request lifecycle events so trails survive promotion. Person/venue/
ledger views need nothing new — they are projections over `who`,
`venue`, `mentions[]`, `kind`, `status`, `req`, `attrs`, `src`, `outcome`.
Rumor `outcome` writes land on the already-archived event (append-only
correction — the rumor entry itself is never rewritten, its outcome
field is).

v34: `gsWireArchiveDay` day-objects may emit `thread:[ids]` on events
and an optional `threads` registry on the day-object (`{id:{label,
blurb}}`) — the page merges registries across days and skips unknown
tags, so partial tagging is safe. Threads are arrangement metadata:
game-side code may tag events into chains, but a tag must never carry
information the member events don't (no thread may exist to "reveal"
a connection that wasn't public).

v48: rumor `outcome` objects may carry `by` — the id of an already-public
event that settled the talk. Emit it only when such an event genuinely
exists on the wire; the archive drops unresolvable ids silently. The week
view needs nothing new — it counts `kind`, `venue`, `req`, `status`,
`outcome`, and `attrs` over the same day-objects.

v62: no schema change — the shelf lives in the reader's localStorage and
the pair/rhythm views project `who`/`mentions`/`venue`/`t` only. Live
sources change nothing: a pin id the current source doesn't serve is
counted honestly, never dropped or invented. If the bus ever rewrites an
id, the shelf treats the old id as absent — correct behavior, no repair
path needed.

v76: no schema change — the same-hour and day-vs-day views project `t`,
`kind`, `venue`, `who`/`mentions` over the same day-objects; the person
lens is a display filter, not a field. `copy record` carries the source
badge like every transcript. Nothing new for the bridge to emit; the
two views degrade gracefully on a one-day record (compare asks for two
days; the hour view just counts fewer rows).
