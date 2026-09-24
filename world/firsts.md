# The First-Week Layer — "the first week" (world v115)

`world/firsts.json` registers **what happens after the yes** — the week
between getting the job and having the job, and between signing the
lease and living in the unit. Two halves:

- `first_shifts[]` — one row per **live** jobs.json opening
  (`openings != 0`): day-one shape, who trains, the kit handout, the
  informal test, the first mistake everyone makes, when you stop being
  new, how the pay paper works, where breaks actually happen.
- `move_ins[]` — one row per **vacant registry unit**
  (housing.json `listings_live`) and per **listing-ladder tier**: the
  key handoff, the honest walkthrough, the first night, where
  mail/trash/laundry live, who knocks first, how the first rent moves.

Internal demo: `world/firsts.html` ("The First Week").

The application layer (`applications.md`, v45) ends at the decision.
The shift grid (`shifts.md`, v17) and the household layer
(`homes.md`, v101) describe the steady state. This layer is the seam
between them — the part a hired character actually lives first.

## 1. What a first_shifts row is

`{employer, role, trainer, trainer_note, day_one, kit, the_test,
first_mistake, not_new_when, pay_setup, break_spot}`.

- **`employer`/`role`** resolve exactly to a jobs.json row with a live
  opening. Filled and closed slots carry no row — there is no first
  week for a job nobody can get.
- **`trainer`** is a cast id **only** when that id is `held_by` a
  jobs.json row of that employer (Marisol trains at Mudhaus; Tomás at
  El Farolote; Ida at Bloom & Doom). Employers with no cast on the
  board get `null` and `trainer_note` carries who teaches instead —
  the senior clerk, the owner himself at Auerbach, the preceptor, the
  binder, or (MuleIt) nobody at all.
- **`day_one` / `kit` / `the_test` / `first_mistake` /
  `not_new_when`** are the five texture fields — all surface knowledge
  a coworker could report, all conditions that fray rather than events
  that fire. `the_test` restates the workplace card's hiring bar as
  lived texture; `not_new_when` is a social threshold, not a clock.
- **`pay_setup` / `break_spot`** close the loop: how the money paper
  actually works (weekly envelope, biweekly ledger, the app) and where
  the body goes when it's off the clock.

## 2. What a move_ins row is

`{key, label, key_handoff, walkthrough[], first_night, anchors,
first_knock, first_rent}`.

- **`key`** is a registry `unit_id` for the three listed vacancies, or
  `tier:<tier>` for the five ladder tiers (room, studio, 1br, flat,
  house). Ladder rows carry the tier's standing stock texture — the
  copy agrees with `housing/listings.md`.
- **`key_handoff`** says who physically hands over keys — Victor at the
  hardware counter for his two buildings, the manager's manila envelope
  at 9127 Capp, the leaseholder for a room share, owners for ladder
  stock.
- **`walkthrough[]`** is the honest list — the quirks the building
  discloses because they'd be discovered anyway (the taped bell, the
  temperamental buzzer, the stair that carries sound).
- **`anchors`** pins mail/trash/laundry — the three logistics a first
  week always locates.
- **`first_knock`** is the building's welcome, surface only: the
  downstairs neighbor with a plate, the nod on the stair, the knock
  about the plum tree. It names roles, never people.
- **`first_rent`** describes the paper — a torn ledger line, a bank
  transfer to an LLC-shaped landlord — never a figure.

## 3. The feed shapes

`feed_shapes` is the layer's whole public surface, same contract as
the exit layer (v73): the door, never the name. Work shapes render new
hands and cards coming down at a venue; housing shapes render boxes on
a stair and new curtains at an address. `never[]` lists what stays
ledger-held: names, trainers, trial outcomes, pay terms, tenure, a
first day as a named event.

## 4. Boundaries

- **Conditions, never scripts.** A `day_one` is what the first day is
  *like*, not what anyone must do. `not_new_when` describes how the
  room decides; it doesn't schedule a beat.
- **No money.** Wages live in `jobs.json`, rents and deposits in
  `housing.json`/`market.json`. This file describes paper, not figures.
- **No secrets, no seeds.** The contested raise, the spare-room
  arrangement, and every bible seed stay in their own files. A first
  week at 9457-2 sees that the radiator works and hears the stair —
  it never sees the dispute upstairs.
- **Not a hiring pipeline.** Nothing here screens, approves, or pays —
  that's `applications.md` upstream and `shifts.json` downstream. This
  layer is texture for the seam, not a mechanism.
- **INTERNAL tier.** The machine file is not a spectator surface;
  `feed_shapes` are the only public render.

## 5. Lifecycle

- A `jobs.json` opening closing (`openings → 0`) retires its
  `first_shifts` row; a new opening adds one. The audit gate enforces
  exact bidirectional coverage — drift is a fail, not a warning.
- A `listings_live` unit leasing moves its `move_ins` row out (the unit
  joins `homes.json`'s `homes[]` on the same event); a new vacancy adds
  a row here first — the first week arrives with the listing.
- Promotion of an ambient mints an address per spec §6; the ambient
  ring itself never carries a move-in row — off-registry housing has
  no key handoff the layer can describe honestly.
