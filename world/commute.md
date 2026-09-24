# The Commute Layer — "the getting there" (world v87)

`world/commute.json` registers **how every working cast member physically
connects home to work**: mode, legs, leave/arrive windows, weather deltas,
and the shared-route overlaps where two neighbors' mornings can touch.
Internal demo: `world/commute.html` ("The Getting There"). INTERNAL tier —
spectators read the street texture, never the per-person table.

The job board (`jobs-housing.md` §2) says who works where; the registry
(§3) says where they sleep. This layer is the connective tissue between
them — the ten minutes of street between the door and the shift, which is
where most unplanned contact in a real neighborhood happens.

## 1. What a route is

A `routes[]` entry: `{who, from, to, venue, mode, days[], legs[],
leave:[a,b], arrive, minutes, note, weather{}}`.

- **`who`** is a cast or ambient id in `jobs.json` `held_by` form
  (`c1-marisol`, `a01-reyes`). Every `who` must be a worker — people with
  no employer live in `non_commuters`, and minors are never routed at all.
- **`from`** is a housing registry unit id for the mains
  (`bld-g9418-A`, …) or `ambient-ring` for ambient cast. The ring is a
  direction, not an address — promotion mints a real address per address
  spec §6 and adds a `homes` row here. Never invent a ring address.
- **`to`** is a `jobs.json` employer string verbatim — the wage table and
  this table must agree by construction. `venue` is the `businesses.json`
  id when the employer has a door, else `null` (SF General, the library,
  loops, pitches).
- **`leave`/`arrive`/`minutes`** are windows, not schedules. `leave` is a
  range; `arrive` is the typical landing; `minutes` is the typical leg.
  `null` for loops — a courier's day has no single arrival.
- **`weather`** maps `rain`/`fog`/`wind` to modal deltas — suggestions the
  thin tier may take or decline (see §4).
- **Conditions, never scripts.** A route is a window the routine system
  may satisfy. It can run late, early, or be missed. A missed 49 is
  texture, not a broken script; nothing here obliges anyone to move.

## 2. The modes

`walk` is the default — the Mission is a walking neighborhood and most of
the board is under twenty minutes on foot. `bike` (Priya's hill climb),
`muni`/`muni_walk` on real lines (14, 22, 33, 48, 49, J — public facts),
`loop` for circulating work (couriers, dog-walking, busking pitches), and
`stairs` for Victor, whose commute is eighteen interior steps.

Dani's is the longest honest commute on the board — Geneva Ave is a
different weather system, and the 49 north is where her day starts
overhearing things. Hana's is the loneliest — a 3:30 walk to warm ovens.
Both are registered so the routine layer knows the dark blocks belong to
someone.

## 3. Overlaps — the incidental-contact condition table

`overlaps[]` are pairs whose routes cross in space AND time:
`{pair:[a,b], where, window, days, kind, note}`.

- `kind: "share"` = same corridor same direction (Jules + Reyes's last two
  blocks; the couriers' depot hour).
- `kind: "cross"` = opposing or intersecting flows (Hana's dark walk past
  Carmen's lamp; Tomás's mid-morning walk across Mudhaus's second rush).

An overlap is a **permission, not an event**: the window is open, the
routine layer may close it, and the AI decides what happens when it does —
a nod, a word, nothing. The feed never announces an overlap; spectators
notice them the way you notice two neighbors who always seem to arrive
together.

## 4. Weather deltas

Per-route `weather` entries adjust mode and timing, as conditions:

- `rain` — walkers add minutes or stay damp; Priya swaps the bike for the
  48; Kofe works *longer* (surge weather pays); Sam's case stays shut;
  Luz's stand stays home on a hard rain.
- `fog` — mostly unchanged; the Mission's gray is ordinary. Geneva's fog
  is thicker than Mission fog, which is Dani's problem, not the layer's.
- `wind` — the couriers' westbound legs double; Luz's umbrella comes
  down; Sam plays the lighter repertoire.

A wet cyclist is a choice, not a violation — the deltas are suggestions
the thin tier weighs, same as any routine row.

## 5. Non-commuters and building pulse

`non_commuters` registers the mains/ambients whose work doesn't produce a
route — Carmen (the hemming comes to her), Esther, Tom, Ray — so no tool
ever invents a commute for them. Their `anchor` is where their day lives.

`building_pulse` is the housing side of the same data: per registry
building, when the last tenant leaves and the first returns, and what the
building reads like in between (`bld-m9102` never empties — its pulse is
the roll-up gate). This is the layer a "who's home right now" question
answers against, at building granularity, for internal tools only.

## 6. Street texture — the spectator-legible subset

`street_texture` is anonymous by contract: "the 6:30 wave", "a baker
walking the dark block", "scrubs on the eastbound 48". These lines are
the only part of the layer that may surface — a name, a unit number, or a
route detail in a spectator line is a leak. The gate enforces it
mechanically (no cast names or ids in texture lines).

## 7. Boundaries

- **INTERNAL tier.** The per-person table is routine-layer input, not
  broadcast. `feed_contract` states the rule: routes never surface as
  named people.
- **Surface knowledge only.** A route says where someone goes — never why
  they're late, who they met, or what they're avoiding. Secrets live in
  bibles; this layer is a leak-free channel.
- **No prices.** Fares and wages live in other layers; this file moves
  bodies, not money.
- **Minors never routed** — A04/A20 have no rows by construction. The
  school wave is unnamed extras texture (crowd layer), never per-person.
- **Referential integrity:** every `to` is a `jobs.json` employer; every
  registered `from` is a `housing` unit; every overlap pair names routed
  people whose windows actually intersect. The audit gate enforces all of
  it — new employers or units land in their canonical files first.
