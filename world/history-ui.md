# History Browser ("The Archive") — spec & copy deck (world v6)

The Archive is the **history surface of the spectator layer**: every day the
wire ever showed, browsable, searchable, replayable as text. It is free —
the spectator feed is free forever (design §5), and its archive is the same
product one day later.

Companion artifacts:

- `world/archive.html` — the full history-browser application (v20,
  v3 feature pass in v34 — threads, payer lens, whole-record search,
  transcript); spec in `world/archive-ui.md`. Supersedes history.html
  as the primary archive surface.
- `world/history.html` — working demo (file://-safe; day data inlined,
  mirrors `history.json`). Kept as the lightweight day-browser variant.
  Every state below is reachable in it.
- `world/history.json` — machine-readable archive schema + the seed days.
- Upstream contracts: `world/feed.json` (event kinds/status vocabulary —
  shared verbatim), `world/feed-ui.md` §3 (display rules — inherited
  verbatim), `world/moderation-notes.md` (§11 scope).

## 1. Scope rule — the archive's one law

**The archive shows exactly what a spectator could have observed live.**
Acceptance test (roadmap): browse any day, any character — output is
identical in scope to the live wire at that moment. Nothing added in
hindsight, nothing cut, nothing "explained." It is not a director's cut.

- Same event kinds as `feed.json`, plus `rumor` (§3).
- Same display rules as the live wire: surface-only, homes are walls,
  secrets structurally absent (no field can carry one), parody names only,
  honest timestamps.
- **Today is a day-object too**, ending at the last completed hour — the
  archive does not write the present. The day shows a "still being written"
  marker.
- **Coverage gaps are honest.** Hours with no public events render as
  gaps, not filler. "Off the feed" stretches (e.g. Dani's evenings) are
  preserved as such — the archive never interpolates where someone was.
- **Denied request text does not exist in the archive.** It was never
  written to the spectator layer; there is nothing to leak. The archive
  shows the neutral "request not approved" line, same as live.
- Admin actions and request attributions are preserved **verbatim** — the
  archive does not sanitize history or soften who paid for what.

## 2. Reading surfaces

| Surface | Behavior |
|---|---|
| **Day picker** | pill per archived day; today flagged ● and capped at last completed hour |
| **Hour strip** | 24-segment density bar; click to isolate an hour, click again to release |
| **Kind filters** | all / the block / word on the block / requests / admin / Mission Unfiltered |
| **Per-character** | dropdown of mains + ambients. Filtering is **structural**: `who` + `mentions[]` fields, not string-matching — so it can't over-match into private text that isn't there |
| **Per-venue / street** | dropdown of canonical venue ids; `block` = street-level events |
| **Search** | substring over display text + resolved names + venue names only — the index contains nothing else |
| **Event detail** | click expands: stable `id` (citeable), venue, who/seen names, request attrs (credits, compensation), rumor source-place + outcome |

## 3. The rumor layer — "word on the block"

The block talks. The archive keeps the talk **as talk**, never as fact.

- Rumor entries carry `kind:"rumor"`, a place-source (`src` — "overheard
  near Malik's"), and **never a named source**. Attribution is a place,
  not a person — that's how overhearing actually works, and it keeps the
  rumor layer from becoming a character-attribution leak.
- Always displayed with an `UNCONFIRMED` badge, visually distinct (dashed
  amber), never styled like verified events.
- **Outcome tracking:** each rumor gets an `outcome` — `debunked`,
  `faded`, or `stood` — filled in when the talk resolves, with a plain
  note ("the doorway set ran on schedule that same night"). Open rumors
  read "still open — the block hasn't settled it."
- **Safety rule (structural):** a rumor may only distort an event that
  was already public. The rumor schema cannot reference SECRETS — there
  is no seed field to point at. A rumor that happens to be *true* about a
  secret is a bug, not content; generation is constrained to public-event
  perturbation (wrong detail, wrong scale, wrong timing).
- Rumors are **not** moderation targets — they're world texture, part of
  the emergent layer (design §11 scopes moderation to player requests).

## 4. What the archive is NOT

- **Not a secrets browser.** No drama seeds, no interiors, no thoughts —
  same whitelist discipline as briefings and the mod console.
- **Not surveillance upsell.** There is no paid tier that sees more. The
  Director sub's replay-scrub (plan §2.3) is the *visual* replay inside the
  spectator view — a camera feature, not an information tier. The Archive
  sells nothing.
- **Not editable.** No annotations, no votes, no comments in v6 — the
  archive is the record, not a forum. (A comment layer is a community
  decision, not a history decision.)

## 5. Copy deck

| Moment | Copy |
|---|---|
| Header tag | `FREE` |
| Scope line | "Every day the wire ever showed — replayed exactly as a spectator saw it." |
| Today marker | "still being written — archive holds through the last completed hour" |
| Empty slice | "No entries on this slice — the block was quiet, uncovered, or the hour hasn't completed. The archive doesn't fill dead air." |
| Rumor badge | `UNCONFIRMED` (always) |
| Rumor source | "overheard near \<venue\>" / "overheard on the block" |
| Rumor open | "still open — the block hasn't settled it" |
| Rumor resolved | `debunked` / `faded` / `stood` + plain-language note |
| Day meta | "N entries · M word-on-the-block · coverage: street-level only" |
| Hour tooltip | "HH:00 — N events" |
| Fine print | "It is not a director's cut: nothing was added in hindsight and nothing was cut." |

## 6. Merge notes (for the game track)

At merge, `history.html`'s inlined `DAYS` becomes reads against the
canonical ledger: day-objects are materialized views over the same event
stream the live wire renders (world events from the ledger, request events
from `gsViewerState`). `rumor` is a new event kind the substrate's rumor
propagation (game roadmap item 4) should emit — constrained to public
antecedents per §3. `mentions[]` should be emitted by the ledger writer,
not derived by string search. Event `id`s must be stable across
live→archive promotion so archive links stay citeable.
