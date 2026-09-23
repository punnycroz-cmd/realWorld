# The Archive v2 — history-browser application spec & copy deck (world v20)

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

## 10. Merge notes (for the game track)

`gsWireDays`/`gsWireArchiveDay` (game-v6) are the live contract; day
objects must keep `history.json` `day_schema` fields, with `req` emitted
on request lifecycle events so trails survive promotion. Person/venue/
ledger views need nothing new — they are projections over `who`,
`venue`, `mentions[]`, `kind`, `status`, `req`, `attrs`, `src`, `outcome`.
Rumor `outcome` writes land on the already-archived event (append-only
correction — the rumor entry itself is never rewritten, its outcome
field is).
