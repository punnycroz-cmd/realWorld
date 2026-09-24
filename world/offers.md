# The Standing Offers Layer — "The Standing Offer" (world v129)

The production-3 direction (Astra review, user decision 2026-09-24) says the
product lives or dies on **bounded opportunities**: a public invitation, a
shared workspace, or a community project the characters may ignore. The drama
layer (§51) owns the doctrine; the crowd layer (`crowd.json occasions`, v127)
owns the population-model shadow. This layer owns the **content**: the actual
offers, written down, keyed to the places a player can see.

`world/offers.json` registers one or more standing offers for **every door
venue** (anchor + street tier, 20 keys) and **every registry building** (9
keys). Internal demo: `world/favor.html`-style page at `world/offer.html`
("The Standing Offer") with the same clearance toggle and an inline `OFF`
mirror the audit `offs` gate deep-compares.

## 1. Why this layer exists (production-3 mapping)

- **Self-chosen projects** — every offer is an *opportunity, never an
  assigned destiny*: the art wall, the prep stool, the garden bed, the
  apprentice hours. Taken up, they are exactly the kind of self-chosen
  competence track the review asks for (Victor's bench regulars stop paying
  repair shops; Bex's book gets thick in public).
- **Interdependence** — most offers only exist because a person keeps them:
  Hana unlocks the door early, Gus opens the lift, Esther signs for parcels.
  A host's choice to keep or drop the offer is a material change in someone
  else's day.
- **Unequal knowledge** — `visibility` stratifies who can even know the offer
  exists: `board` is posted (spectator-legible), `counter` is staff/regulars
  knowledge, `quiet` is household or handshake knowledge that never reaches
  public clearance.
- **Limited capacity** — `cost` makes the ask concrete in time, stuff, or a
  small game-dollar figure; `capacity` names the real bottleneck (one bench,
  two stools, a ten-seat table that has never once filled).
- **Consequence continuity** — every offer carries `changes` (the readable
  consequence *if* taken up) and `neglect` (the honest decay state *if*
  ignored). The shared-meal test is built into the schema: an organizer's
  no-show collaborator, a repaired slight, a lapsed bench — all are allowed
  readings, none are prescribed.

## 2. Schema

```json
"offers": {
  "<venue-id | building-id>": [ {
    "id": "off-<tag>-NN",        // unique; ^off-[a-z0-9]+-\d+$
    "kind": "shared_workspace|open_invitation|community_project",
    "visibility": "board|counter|quiet",
    "host": "<person id>" | "staff" | "house" | "regulars",
    "ask": "what joining looks like — one concrete line",
    "cost": { "time": "…", "bring": "…", "dollars": 0 },   // dollars optional, ≥0, game dollars
    "capacity": "the real bottleneck, one line",
    "cadence": "when it's live — 'standing', 'thursdays', 'first sunday'",
    "changes": "the readable consequence if taken up — never a promised outcome",
    "neglect": "the honest decay state if ignored — texture, not a fuse",
    "since": "the origin a counter would tell"
  } ]
}
```

- **Keys** ⊆ door-tier business ids ∪ registry building ids (`bld-*` from the
  jobs-housing.md §3 seed). Every door and every building carries ≥1 offer.
  Offstage orgs and reserved names key nothing — they have no door.
- **host** is who keeps the offer legible. A person host (`c1`–`c8`,
  `s1`–`s3`, `a01`–`a20`) may let it lapse — `fav-ndl`-style, obligations and
  upkeep attach to people, not roles. `staff`/`house`/`regulars` mean the
  offer is collectively kept.
- **cost.dollars** is the only money field: numeric, game dollars, small by
  definition. No money figures anywhere in prose fields.
- **`since` is required.** An offer has a past — a stranger should be able to
  hear where it came from.

## 3. What this layer never does

- No attendance bookkeeping. `changes` describes what *could* be read off the
  world; nothing counts who came.
- No pressure. An ignored offer is honest texture (`neglect`), never a fuse,
  never flagged for rescue — matches drama.json §51 verbatim.
- No scripts. `ask` names the condition of joining, not a character's
  behavior. The Thursday table does not compel anyone to eat.
- No secrets. `quiet` is a *knowledge tier* (who plausibly knows), not a
  drama seed — the wording bar bans `secret`/`seed`/`unfiltered`/`possess`
  and all money figures in prose.
- Housing stays minimal per the direction: building offers are constraints
  and stakes (a shared line, a shelf, a stoop), never a facilities
  administration system.

## 4. Visibility contract (enforced by the audit `offs` gate)

| Visibility | Who plausibly knows | Surfaces |
|---|---|---|
| `board` | anyone who reads the wall — spectator-legible | any clearance |
| `counter` | staff and regulars | internal + staff-brain contexts |
| `quiet` | household or handshake | internal only — redacted below internal |

`offer.html` renders all three with a clearance toggle, same discipline as
`favor.html` (quiet rows redact below internal, counter below staff) and
prints an honest hidden-count line.

## 5. Relationship to existing layers

- **`occasions`** (crowd.json v127) are the *population shadow* of three
  generic invitation shapes; `offers` are the *authored inventory* — the
  Thursday table at El Farolote (`off-far-01`) and the Malik's cork board
  (`off-mal-01`) are the named instances those shapes lift.
- **`favors`** (v128) are bilateral obligations — someone is owed;
  `offers` are open doors — nobody is owed anything yet. An offer taken up
  can *ripen into* a favor (the cull crate ↔ cull-bag overlap is deliberate).
- **`favors`/`offers` vs jobs/housing board** — the board lists openings and
  listings (positions to fill); offers are the standing texture around them
  (the bench, the shelf, the table). A hired character can hold a job *and*
  sit on the four a.m. bench — the layers don't compete.

## 6. Notes for other tracks

- **Game-systems:** read-only brain texture. An offer is a claimable *venue
  condition*, not an action — uptake, refusal, and repair all belong to
  brains. A sponsored player request may *create* an offer (same pressure as
  organic, §51 identical-twin test); it may never create an obligation.
- **Memory:** `host` and `since` are retell-ready holder nodes — who keeps
  the door open is exactly what a memory system should be able to recall
  differently.
- **Art:** nothing painted — `ask`/`neglect` describe objects the camera can
  already see (the clipboard, the jar, the folded chairs).
- **Marketing:** `board` rows are safe to quote; `counter`/`quiet` are not.
