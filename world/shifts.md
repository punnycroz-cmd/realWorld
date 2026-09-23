# The Working Week — shift layer (world v17)

`world/jobs-housing.md` §2 fixes wages and headcounts; `world/jobs/` cards fix
workplace culture. This file fixes **time**: who is actually on the clock,
when, every day of the week. Machine mirror: `world/shifts.json`. Demo:
`world/timeclock.html` (internal).

Discipline, same as the job cards:

- **Conditions, not scripts.** A shift grid is a coverage obligation, not a
  behavior command. What a character *does* on shift is theirs; the grid only
  says where their body is and what the room needs.
- Grids match `ambients.json` routines and the mains' `SF_CORE_ROUTINES`
  blocks — where a routine is looser than a shift (Marcus's courier loop,
  Sam's busking), the grid records the *windows*, and the routine stays
  authoritative for what happens inside them.
- Hours are game-local decimal (19.5 = 19:30). Days are `mon`–`sun`.
  `wk` = weekday pattern, `sat`/`sun` = day-specific overrides.
- Venue hours come from `world/businesses.json`; staff grids may start
  before open (prep) and end after close (cleanup) — that's real, not an
  error.
- Wages/hours still bow to `jobs-housing.md` §2. If a grid implies more
  weekly hours than the board posts, the board wins — thin-AI workers
  compress; grids describe the *posted schedule*, not surveillance.
- No SECRETS. A gap in a grid ("Tomás never works Monday lunch") is
  scheduling texture, never a seed tell.

## Payday calendar (locked to jobs-housing §5)

| Cadence | Who | Day |
|---|---|---|
| Weekly | entry + informal (baristas, scoopers, clerks, couriers, vendors, busking cash) | Friday, end of day |
| Biweekly | mid/top (managers, lead cooks, tradespeople, librarian, nurses) | every other Friday |
| Owner draw | Victor, Malik | irregular — after the month's bills, not before |
| Rent run | everyone | due the 1st, grace through the 5th, late fee 5% capped $50 (leases.json) |

The month's bad week is the same for everyone on weekly pay: rent clears
the 1st–5th, and the Friday after the 5th is the first paycheck that's
truly theirs. The block gets quieter at the bars that week — legible on
the feed without a single dollar amount ever being public.

## Coverage rules (apply everywhere)

- `min_staff` is the floor the *venue* needs; understaffed blocks are
  ordinary bad days, not events. The feed may show "slammed" texture at a
  venue; it never names who didn't show.
- Openings (jobs.json `openings` > 0) appear in grids as `open` slots —
  those are the shifts a player-hired character steps into on hire.
- Swaps and call-outs are informal everywhere except SF General (real
  scheduling office) and the library (city payroll). Everywhere else the
  rule is: cover the floor, tell whoever has the keys.
- Nobody on this block gets benefits except hospital and city workers.
  Sick days are unpaid; that's why Reyes has never taken one.

## Per-employer grids

Full machine form lives in `shifts.json`. Summary of who carries what:

### Mudhaus Coffee (6:30–19:00 wk / 7:00–20:00 wknd)
- **C1 Marisol** opens five days (5:30–14:00) + one floating manager day
  (paperwork, ordering, the owner's quarterly email).
- **C3 Dani** mid-close five days (8:00–17:00 wk — the board says
  "closer," but the real close falls to whoever's last; Dani owns the
  17:00–19:00 tail plus Sundays off).
- **C2 Jules** mid shift (8:00–15:00 wk) — the overlap window 8–15 is
  why Mudhaus is the rumor exchange: three cast members behind one bar.
- **A01 Reyes** 7:30–18:00, six days, off Sunday — the longest schedule
  on the block. On Sundays Marisol covers his line and the whole crew
  notices the speed difference.
- **1 open slot:** barista, the low-status closes (14:00–19:00) and
  weekend floor — the hire-first-weeks shape described in the job card.
- Rush floor: 2 behind bar 7:30–9:30, 15:00–16:30 school wave. One-person
  floor is a real condition 13:00–15:00 weekdays.

### Taqueria El Farolote (10:00–1:30 wk / to 2:30 wknd)
- **C8 Tomás** lead cook 16:00–24:00 five days (dinner into the bar
  rush), off Monday. Mornings are his supplier loop — that's on his own
  time and his own dream.
- **Open: line cook** 11:00–18:00, five days — lunch plus prep for the
  evening line.
- **Open: counter/closer** 18:00–close (~1:30/2:30), five nights —
  the drunkest honest work on the block.
- Tomás's five nights leave a lead-cook-shaped hole Monday + daytimes;
  the owner cooks those himself, badly, and everyone knows it.

### Buy-Rite Market (8:00–21:00 daily) / Creamery (11:00–22:00/23:00)
- Two-aisle operation, one register of trust. **Open: grocery clerk**
  32 h — mixed 8–16 / 13–21 across five days. **Open: scooper** 24 h,
  Thu–Sun afternoons-into-evening (the only shifts worth scooping).
- Delivery hits Tue/Fri mornings; the clerk who takes the Friday
  13–21 also absorbs the weekend pre-stock crush.

### Dolores Perk (7:00–17:00 wk / to 18:00 wknd)
- **Open: counter** 30 h, 7:00–14:00 five days — the park-facing morning
  shift; they're the first caffeine the dog-walkers hit.

### Baguette About It (7:00–15:00 wk / to 16:00 wknd)
- **A16 Hana** bakes 4:00–13:00, Tue–Sat (45 h — the 4 a.m. start is why
  her afternoon walk home is a fixed landmark of the block).
- **Open: counter, afternoons** — nominal 25 h; in practice the counter
  folds into prep and the Saturday stall. Posted as afternoons because
  that's when the till needs a second pair of hands.

### Il Delfino (17:30–22:30 wk / to 23:00 wknd)
- **Open: line cook** 16:30–23:00 five nights. **Open: 2× server**
  17:00–close, ~30 h each. Closed-day texture: Mondays dark.

### Auerbach Hardware (8:00–18:00 wk / 9:00–17:00 wknd)
- **C7 Victor** counter 8:00–18:00 six days; Tuesdays he leaves the
  counter to the Guerrero repair loop and the shop runs half-staffed —
  the only scheduled understaffing on the block, and his choice.
- **Open: counter clerk** 30 h — the posting exists so Tuesdays stop
  being a one-man shop. Victor has "been meaning to fill it" for a year.

### The rest (routines carry the shape)
- **Folsom Auto & Sons:** A10 Gus 6:30–16:00 M–F (routine says work
  6.5–16; shop posts 8–17:30 — Gus opens early, leaves before close).
- **Needlepointe:** A14 Bex books Tue–Sun by appointment inside 12–20;
  Mondays the shop is dark and she is unreachable — both facts are in
  her routine.
- **Bloom & Doom:** A18 Ida 7:30–18:00 Tue–Sat; **open Saturday counter
  help** 8 h is the market-load day. Sunday/Monday she's off.
- **Malik's Mini Mart:** A03 Malik 7:30–18:00 seven days; a nephew
  covers 18:00–close off-registry (family, cash, nobody calls it a job).
- **Frutería Las Palmas:** A07 Luz 7:00–18:00, seven days, cash,
  weather-dependent — rain cuts the day, not the obligation.
- **Mission Branch Library:** A11 Vera 7:30–17:30 M–F + one Saturday
  monthly (city schedule).
- **SF General:** C4 Priya 3×12 day shifts (7:00–19:30), pattern
  Mon/Tue/Fri; A09 Asha 3×12, Wed/Thu/Sat — their routines overlap the
  hospital, never each other's days off by much.
- **Flying Pannier (C5 Marcus):** dispatch windows 10:30–14:00 and
  16:30–20:30 weekdays; co-op riders self-select inside the window —
  Marcus takes both most days, which is how ~30 posted hours become a
  thinner paycheck than the math suggests.
- **MuleIt (A06 Kofe):** app work, dinner-weighted; routine logs
  8:00–19:00 carrying but the paid hours cluster 11–14 + 17–21.
- **Dog-walking (A02 Doro):** 7–11 and 16–20 loops, seven days — dogs
  don't take weekends.
- **Construction (A17 Cole):** 6:30–16:00 M–F, Folsom lot; rain-short.
- **Nimbus9 (A13 Nadia):** remote 9–17 wk, calendar-bound not place-bound.
- **Busking (A08 Sam):** 10:00–18:00 park corners, weather-permitting;
  income is a mood, not a wage.
- **Hemming (C6 Carmen):** word-of-mouth mornings at home; $300/mo is a
  supplement, not a job.

## What this layer is for

- Feed legibility: "Mudhaus is slammed" is derivable from rush floor +
  staffing, without exposing anyone's timesheet.
- The hire flow: an `open` slot on this grid *is* the job — day-one
  players inherit real hours against real coworkers.
- Ambient/bible consistency: if a routine and a grid disagree, the grid
  is wrong. Fix the grid, not the person.
