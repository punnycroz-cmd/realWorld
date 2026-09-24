# The Household Layer — "the fridge door" (world v101)

`world/homes.json` registers **what each registry unit is like to live
inside**: occupants, household shape, rota, kitchen rhythm, quiet hours,
guest norms, the house kit, and one fridge-note voice line. It also
carries the **perks table** — what each jobs.json employer sends home at
the end of a shift. Internal demo: `world/homes.html` ("The Fridge Door").

The building cards (`world/housing/`) say what a *building* is like from
the hall. The lease ledger (`world/leases.json`) says who owes what.
This layer is the part a roommate knows: whose shelf is whose, when the
flat goes quiet, what the note under the magnet actually says. It is the
housing half of the loop made habitable — and it closes the jobs half of
the loop by registering what work carries home through the door.

## 1. What a household row is

A `homes[]` entry: `{unit_id, address, shape, occupants[], rota,
kitchen, quiet, guests, kit, fridge_note}`.

- **`unit_id` / `address`** are registry facts — every id is a
  `jobs-housing.md` §3 unit. Addresses stay place-not-person (spec §3).
- **`shape`** is one of `solo | couple | share | owner | ambient` —
  household geometry, not relationship detail.
- **`occupants[]`** holds cast/ambient ids in `jobs.json` `held_by`
  form, plus household lease ids (`reyes-cousins`, `ambient-household`).
  Informal arrangements read as informal: Jules "rents the spare room,"
  Dani's share is a room share — the ledger already knows; the fridge
  doesn't adjudicate.
- **`rota` / `kitchen` / `quiet` / `guests` / `kit`** are the five
  texture fields — who keeps what chore norm, how the kitchen runs, when
  the flat goes quiet, who comes over, and what the home lends and
  borrows. All norms: they fray, lapse, and get renegotiated. None of
  them is a schedule that fires.
- **`fridge_note`** is the only voice field: one short line per occupied
  home, in the household's own register — the note actually pinned under
  the magnet. Ambient households get `null` (nobody knows them well
  enough to read their fridge). Vacant units have no note at all.

## 2. The vacant rows

`vacant[]` carries the three LISTED units. An empty home has no
household — it has a **showing**: the smell of paint, which window makes
the viewing linger, the honest script the showing runs on. A signed
lease (leases.json status → active) moves the row from `vacant[]` to
`homes[]` — the address stays put; only the domestic content changes.

## 3. The perks table — what work sends home

`perks[]` closes the rent-vs-wage loop from the other side: every
jobs.json employer gets a `brings_home` line — day-old bread, the
dented-can shelf, free wash on shift nights, the staff bay on Sunday —
plus a `note` on how it circulates. The perk layer is texture, not
compensation: a staff scoop never appears in a wage figure, and the
honest nulls stay honest (Malik's owner-clerk carries nothing home; the
till is the job). Together with `budgets.json` this is the difference
between a wage and a living.

## 4. The ambient ring

Ambient cast live off-registry one ring out — house shares, SRO rooms,
a basement in-law. `ambient_ring` is a single texture row, never a list:
no ids, no addresses, no fridge notes. A promotion mints a real address
per address spec §6 and adds a `homes` row *here first* — the household
arrives with the address, not after it.

## 5. What the layer is not

- **Not secrets.** Every field is surface knowledge — a roommate or a
  regular visitor could say it. Seeds (the notebook, the blog, the
  contested-raise *why*) live in bibles and the ledger. The fridge note
  for 9457-3 mentions the heater and the counter money because both are
  ledger-public; it never says what the fight is about.
- **Not money.** No dollar figures anywhere — splits and arrears live in
  `leases.json`/`budgets.json`. "Your share is on the counter" is legal
  because the counter is texture; "$1,600 is on the counter" is not.
- **Not scripts.** A rota is a norm that frays — Priya's laminated rota
  *is registered as* abandoned during her 3-on runs. Nothing here
  obliges a character to do dishes.
- **Not spectator-facing as a table.** The machine file is INTERNAL
  tier; the spectator-safe surface is the fridge note itself — a note on
  a fridge is exactly what a visiting camera could read.
