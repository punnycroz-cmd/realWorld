# The Last Shift — how work ends and units empty (world v73)

The job board says what exists (`jobs-housing.md` §2); `applications.md` is
the ask side; `leases.json` is the paper side. This file is the **exit
layer**: how a job actually ends on this block — notice norms, who takes
the news, what the last shift feels like, what a reference is worth, what
gets left behind — and how a unit empties — notice windows, the deposit
clock, turnover scope, and the path back onto the board. Machine mirror:
`world/exits.json`. Demo: `world/exit.html` ("The Last Shift").

Standing rules (inherited, restated once):

- **Conditions, not scripts.** Every entry describes the shape an exit
  takes — the room the news lands in, the norm for timing, the honest
  texture of a last day. Nothing here obliges a character to leave,
  give notice, or say anything.
- **The other layers win on numbers.** Wages, channels, rents, notice and
  deposit clocks duplicate `jobs-housing.md`, `market.md`, and
  `leases.json`; on drift, fix this file.
- **Game dollars only.** Deposits, last checks, and turnover costs are
  in-world money; no credit figure appears anywhere in this layer.
- **The door, never the name.** Departures are private business. Feed
  shapes print a venue or an address — a card going up or coming down —
  never a leaver's name, reason, or money. Quit and eviction are never
  named events; the mechanics live in the ledger, the texture lives here.

## 1. The shape of an exit

Jobs and units leave by the same arc in both directions:

```
notice → run-out → last day → gap → relist
          ↘ abrupt exits (walked_mid_shift, evicted) skip the run-out
```

- **notice** is a norm, not a rule — `notice_days` per row is what the
  block considers decent, and giving it is what buys a reference.
- **run-out** is the texture window: the schedule board showing a gap,
  the unit half-boxed. The block reads departures before anyone says them.
- **last day** is where the venue's personality shows — a family meal, a
  sheet cake, a handshake line, an empty corner.
- **gap** is the pressure the exit leaves: a short-staffed week, a unit
  breathing before the card goes up.
- **relist** is the channel back: board card, word of mouth, the mailbox —
  `market.md`'s churn rows and `housing.json`'s lifecycle own the math;
  this file owns how it looks.

## 2. Job-exit kinds

| kind | shape |
|---|---|
| `notice_given` | the two weeks — said to a face or written on the card; the default and the only exit that buys a reference |
| `faded_out` | the slow quit — shifts drop off the board until the name does; common wherever the schedule *is* the relationship |
| `walked_mid_shift` | the apron on the counter — rare, loud, remembered |
| `seasonal_end` | the calendar did it — the posting expired; warmest exit, it was always going to happen |
| `let_go` | the employer ends it — texture belongs to the decider, dignity to the leaver |
| `retired_out` | the long goodbye — pension paper, a cake if the place is the kind |

## 3. Per-employer exits

Full rows in `exits.json.work` — one per employer on `jobs.json`'s board,
all 24. The fields:

- `notice_days` — the decent interval (0 where the job has no boss to tell:
  MuleIt, busking, hemming).
- `notice_to` — who physically takes the news and where; Marisol at the
  counter before 9:00, Tomás in the kitchen after lunch, the foreman at
  the toolbox, nobody at all on an app.
- `last_shift` — what the final day looks like at that workplace.
- `reference` — what a reference from this employer is literally worth and
  who gives it. Victor's flat delivery carries like a certification; an
  app's star rating transfers nowhere; a busker's reputation is audible,
  not written.
- `stays` — what the leaver leaves behind that outlasts them: a mug, a
  name tape, a recipe card in their handwriting.
- `texture` — the one-line read on what turnover means there (a mostly-solo
  shop absorbs it; a churn employer doesn't notice it).

## 4. Housing exits

Full rows in `exits.json.housing` — one per `housing.json` building-cards
key plus `ambient-ring` (off-registry, empty by construction).

- `notice_days` — 30 on the registry, null where there's no tenant
  (Victor's owner-occupied flat) or no paper (the ambient ring).
- `deposit_clock_days` — 21, the same clock `leases.json` runs; this file
  never restates the mechanics, only that the clock starts at move-out.
- `turnover_scope` — who walks the unit and what gets done: Victor's
  Tuesday-table owner-direct process vs the Capp/Folsom management
  mailbox vs the Geneva flat where a vacancy is a family decision first.
- `relist` — the path back: corkboard card, word of mouth through the
  hallway or the cousins' network, never a listing site.
- `texture` — what a vacancy looks like from the hallway.

Housing-exit kinds (`housing_exit_kinds`): `notice_to_vacate` (the 30-day
letter), `lease_end`, `bought_out` (the progression-arc exit — the unit
leaves rental stock), `evicted` (admin-layer only; texture is moved
boxes, never a feed name), `household_split` (the informal share
dissolves — the payer was never on the lease and leaves no paper).

## 5. Feed shapes

`exits.json.feed_shapes` is the whole public surface. Work exits render
as the venue's door (`a job opening posted — <venue>`, `a card came
down — <venue>`, `a new face behind the counter — <venue>`); housing
exits as the address (`a unit back on the board — <address>`, `a card
came down — <address>`, `a tenant gave notice — <address>` — the last is
already live vocabulary from the grievance layer). `never` lists what no
feed line may carry: leaver names, reasons, deposit amounts, declines, or
a quit/eviction as a named event. The door-not-name contract is identical
to `grievances.json`'s — the same rule at both ends of a tenancy.
