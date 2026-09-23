# Jobs & Housing — "The Mission" (world v0, index updated v17)

> **v3 depth layer:** the tables below remain canonical for numbers.
> `world/jobs/` holds per-workplace cards (shift shape, culture, hiring
> bar, play texture); `world/housing/` holds per-building cards and
> `housing/listings.md` (player-facing listing copy). Machine-readable
> mirrors: `world/jobs.json`, `world/housing.json`. In-world render:
> `world/board.html` (file://-safe corkboard page).
>
> **v17 depth layer:** `world/shifts.md` + `world/shifts.json` — the
> weekly time grid (who's on the clock when, coverage floors, payday
> calendar); `world/budgets.md` + `world/budgets.json` — per-household
> money envelopes (INTERNAL tier; spectators get texture, never named
> numbers). Internal demo for both: `world/timeclock.html`.

The rent-vs-wage loop in one file. All money below is **game dollars**
(in-world currency — the wall stays: no credit↔dollar exchange, ever).
Credit-denominated fees (deed fees, landlord license, character slots) are
marked `cr` and match `rw-monetization-plan-2026-09-22.md` §2 — those numbers
are PROPOSAL; never contradict them in player-facing copy.

Balance target (monetization §2.4): **rent ≤ ~45% of typical wage** for the
tier it pairs with — cozy, not punishing. Groceries/transit/utilities eat
most of the rest; savings rate is the difficulty knob.

---

## 1. Wage bands (locked to plan)

| Band | Rate (game $/h) | Who |
|---|---|---|
| Entry | $16–20 | barista, clerk, courier, vendor, scooper |
| Mid | $25–35 | line cook lead, manager, tradesperson, librarian, office |
| Top | $40–50 | specialist: RN, senior tech |
| Fixed income | ~$1,600–1,900/mo | retirees (pension/SSI) |
| Proprietor | draw, ~$6–10k/mo gross | store owners (Victor) — lumpy, expense-first |

Rules from the plan: **thin-AI auto-shifts pay baseline**; possessed play
can earn small bonuses (+10–20%), never the reverse. Wages below are
baseline. A work month ≈ 173 h full-time; most service jobs offer 30–38 h.

## 2. The job board (who works where, at what wage)

Cast jobs are facts of the fiction; **openings** are what player-hired
characters can apply for (v6 character-creation flow consumes this list).

| Employer (parody name) | Role | $/h | h/wk | ≈$/mo | Held by / status |
|---|---|---|---|---|---|
| Mudhaus Coffee | Manager | $30 | 40 | $5,190 | **C1 Marisol** |
| Mudhaus Coffee | Barista | $19 | 30–38 | $2,470–3,140 | **C2 Jules, C3 Dani, A01 Reyes**; 1 opening |
| Taqueria El Farolote | Lead cook | $30 | 40 | $5,190 | **C8 Tomás** |
| Taqueria El Farolote | Line cook | $26 | 35 | $3,940 | opening |
| Taqueria El Farolote | Counter/closer | $18 | 30 | $2,340 | opening |
| Flying Pannier Courier Co-op | Bike courier | $18 | ~30 variable | ~$2,300 + tips | **C5 Marcus** |
| MuleIt (app) | Delivery rider | $17 | variable | ~$2,200 + tips | **A06 Kofe**; always hiring (churn) |
| Buy-Rite Market | Grocery clerk | $19 | 32 | $2,630 | 1 opening |
| Buy-Rite Creamery | Scooper | $17 | 24 | $1,770 | 1 opening |
| Dolores Perk | Counter | $18 | 30 | $2,340 | 1 opening |
| Baguette About It Bakery | Baker | $26 | 45 (4–13 shift) | $5,070 | **A16 Hana** |
| Baguette About It Bakery | Counter, afternoons | $18 | 25 | $1,950 | 1 opening |
| Il Delfino | Line cook | $27 | 35 | $4,090 | 1 opening |
| Il Delfino | Server | $18 | 30 | $2,340 + tips | 2 openings |
| Auerbach Hardware | Counter clerk | $21 | 30 | $2,730 | 1 opening (Victor runs it alone mostly) |
| Folsom Auto & Sons | Mechanic | $34 | 40 | $5,880 | **A10 Gus** |
| Needlepointe Tattoo | Artist | $30 | commission-weighted | ~$4,500 | **A14 Bex** |
| Bloom & Doom Flowers | Florist | $25 | 40 | $4,330 | **A18 Ida** |
| Malik's Mini Mart | Clerk | $18 | 40 | $3,110 | **A03 Malik** (owner-clerk; thin margin) |
| Frutería Las Palmas | Vendor | $18 | 55 informal | ~$4,000 cash | **A07 Luz** |
| Mission Branch Library | Librarian | $31 | 40 | $5,360 | **A11 Vera** |
| SF General | RN, med-surg | $48 | 36 (3×12) | $7,490 | **C4 Priya, A09 Asha** |
| SF General | CNA/tech | $22 | 36 | $3,430 | 2 openings |
| Dog-walking (independent) | Walker | $20 | 30 | $2,600 | **A02 Doro** |
| Construction (site near Auerbach) | Laborer | $36 | 40 | $6,230 | **A17 Cole** |
| Nimbus9 (remote) | Tech worker | $50 | 40 | $8,650 | **A13 Nadia** — remote; not a job-board posting |
| Busking (park corners) | Musician | ~$12–15 equiv | — | ~$1,800 | **A08 Sam** — informal |
| Hemming/alterations (word of mouth) | Seamstress | ~$15 equiv | — | ~$300 cash | **C6 Carmen** — atop pension |

Fixed income: **C6 Carmen** $1,650/mo pension/SSI + ~$300 hemming + $700
room rent from Jules (informal). **A19 Ray** ~$1,700/mo longshore pension.
**A05 Esther** ~$1,600/mo.

## 3. Housing stock (registry per address spec §4)

All residential addresses are fictional 9xxx numbers on real streets.
`owner_id: "landlord"` = whichever main holds the landlord role (casting
TBD — Victor's fiction already owns the two Guerrero Victorians + his own
Mission St building; see `characters/_index.md`).

| Address | Style | Unit | Bed | Rent $/mo | Rent-ctrl | Tenant |
|---|---|---|---|---|---|---|
| 9418 Guerrero St | Victorian duplex | A | 2 | $950 | yes | **C6 Carmen** (since 1989) + Jules's room |
| 9418 Guerrero St | " | B | 1 | $2,100 | yes | **LISTED** |
| 9457 Guerrero St | Victorian 3-flat | 1 | 1 | $1,950 | yes | ambient household |
| 9457 Guerrero St | " | 2 | 0 | $1,350 | yes | **LISTED** |
| 9457 Guerrero St | " | 3 | 2 (upper flat) | $3,200 | yes* | **C4 Priya + C5 Marcus** |
| 9127 Capp St | 4-unit studios | C | 0 | $1,150 | yes | **C1 Marisol** |
| 9127 Capp St | " | A | 0 | $1,300 | — | **LISTED** |
| 9263 Geneva Ave | flat | 4 | 2 | $2,100 | yes | Reyes cousins' lease; **C3 Dani** pays a $700 room share (not leaseholder) |
| 9344 Folsom St | studios | 1 | 0 | $1,275 | yes | **C8 Tomás** |
| 9102 Mission St | mixed-use | 2 | 1 | — (owner-occupied) | — | **C7 Victor** |

\* 9457-3's $600 raise ($2,600 → $3,200) is **contested** — Priya disputes
the passthrough claim plus the dead heater. Keep the flag ambiguous; the
dispute is a live storyline, not a bug.

**Player-facing listings** (same tier ladder as the plan, all 9xxx):

| Tier | Example listing | Rent | Purchase | Deed fee |
|---|---|---|---|---|
| Room in shared flat | 9521 Treat Ave, Unit 2 (room) | $700 | — | — |
| Studio | 9088 Folsom St, Unit 5 | $1,300 | $90,000 | 1,000 cr |
| 1BR apartment | 9476 Dolores St, Unit B | $2,100 | $160,000 | 2,000 cr |
| Victorian upper flat | 9560 Guerrero St, Unit 2 | $3,200 | $280,000 | 3,500 cr |
| Whole Victorian house | 9812 Church St | $5,500 | $550,000 | 5,000 cr |

Ambients live in off-registry stock one ring out from the park (see
`ambients.md` §Home bases); a promotion mints a real address per spec §6
and a lease row here.

### Registry seed (JSON, spec §4 shape)

```json
{
  "buildings": [
    { "id": "bld-g9418", "address": "9418 Guerrero St, San Francisco, CA",
      "style": "Victorian", "units": ["bld-g9418-A", "bld-g9418-B"], "owner_id": "landlord" },
    { "id": "bld-g9457", "address": "9457 Guerrero St, San Francisco, CA",
      "style": "Victorian", "units": ["bld-g9457-1", "bld-g9457-2", "bld-g9457-3"], "owner_id": "landlord" },
    { "id": "bld-c9127", "address": "9127 Capp St, San Francisco, CA",
      "style": "Edwardian flats", "units": ["bld-c9127-A", "bld-c9127-B", "bld-c9127-C", "bld-c9127-D"], "owner_id": "landlord" },
    { "id": "bld-g9263", "address": "9263 Geneva Ave, San Francisco, CA",
      "style": "flat", "units": ["bld-g9263-4"], "owner_id": "landlord" },
    { "id": "bld-f9344", "address": "9344 Folsom St, San Francisco, CA",
      "style": "studios", "units": ["bld-f9344-1"], "owner_id": "landlord" },
    { "id": "bld-m9102", "address": "9102 Mission St, San Francisco, CA",
      "style": "mixed-use storefront + flat", "units": ["bld-m9102-2"], "owner_id": "landlord" }
  ],
  "units": [
    { "id": "bld-g9418-A", "unit_code": "A", "bedrooms": 2, "base_rent": 950, "rent_controlled": true },
    { "id": "bld-g9418-B", "unit_code": "B", "bedrooms": 1, "base_rent": 2100, "rent_controlled": true },
    { "id": "bld-g9457-1", "unit_code": "1", "bedrooms": 1, "base_rent": 1950, "rent_controlled": true },
    { "id": "bld-g9457-2", "unit_code": "2", "bedrooms": 0, "base_rent": 1350, "rent_controlled": true },
    { "id": "bld-g9457-3", "unit_code": "3", "bedrooms": 2, "base_rent": 3200, "rent_controlled": true },
    { "id": "bld-c9127-A", "unit_code": "A", "bedrooms": 0, "base_rent": 1300, "rent_controlled": false },
    { "id": "bld-c9127-C", "unit_code": "C", "bedrooms": 0, "base_rent": 1150, "rent_controlled": true },
    { "id": "bld-g9263-4", "unit_code": "4", "bedrooms": 2, "base_rent": 2100, "rent_controlled": true },
    { "id": "bld-f9344-1", "unit_code": "1", "bedrooms": 0, "base_rent": 1275, "rent_controlled": true },
    { "id": "bld-m9102-2", "unit_code": "2", "bedrooms": 1, "base_rent": 0, "rent_controlled": false }
  ],
  "leases": [
    { "unit_id": "bld-g9418-A", "tenant_id": "c6-carmen", "start": "1989-03-01", "monthly_rent": 950, "status": "active",
      "notes": "unpermitted occupant: c2-jules (spare room, $700 cash/mo to tenant of record; violation undiscovered)" },
    { "unit_id": "bld-g9457-1", "tenant_id": "ambient-household", "start": "2019-08-01", "monthly_rent": 1950, "status": "active" },
    { "unit_id": "bld-g9457-3", "tenant_id": "c4-priya+c5-marcus", "start": "2022-06-01", "monthly_rent": 3200, "status": "active",
      "notes": "raise 2600→3200 contested (passthrough claim + habitability: dead heater); marcus share chronically ~1mo late" },
    { "unit_id": "bld-c9127-C", "tenant_id": "c1-marisol", "start": "2018-11-01", "monthly_rent": 1150, "status": "active" },
    { "unit_id": "bld-g9263-4", "tenant_id": "reyes-cousins", "start": "2021-02-01", "monthly_rent": 2100, "status": "active",
      "notes": "c3-dani pays $700 informal room share; not on lease" },
    { "unit_id": "bld-f9344-1", "tenant_id": "c8-tomas", "start": "2020-04-01", "monthly_rent": 1275, "status": "active" },
    { "unit_id": "bld-m9102-2", "tenant_id": "c7-victor", "start": "1998-01-01", "monthly_rent": 0, "status": "owner-occupied" }
  ]
}
```

## 4. Loop balance check (rent ≤ ~45% rule)

Monthly nut on top of rent (shared texture, tune at v10): groceries ~$320,
transit ~$80, utilities share ~$90 → **~$490/mo**.

| Pairing | Income | Rent | Rent % | Nut total | Verdict |
|---|---|---|---|---|---|
| Room $700 vs barista 30 h ($19) | $2,470 | $700 | 28% | $1,190 | comfortable start — Jules's actual position |
| Room $700 vs part-time baseline (~$1,600) | $1,600 | $700 | **44%** | $1,190 | day-one affordable, tight enough to matter (plan check ✓) |
| Studio $1,300 vs barista 35 h | $2,880 | $1,300 | 45% | $1,790 | needs near-full hours — Tomás at $30/h is at 25% instead |
| Studio $1,300 vs courier | $2,300 | $1,300 | 57% | $1,790 | over line → why Marcus shares a flat |
| 1BR $2,100 vs mid $26/h | $4,160 | $2,100 | 50%→45% at $28/h | $2,590 | mid-tier solo living, deliberate stretch |
| Upper flat $3,200 split 2 ways | $4,700 combined (nurse+courier ≠ reality: $9,790 for P+M) | $1,600 ea | 21% Priya / **70% Marcus** | — | the flat itself is the pressure cooker — intended |
| House $5,500 vs two mid-high earners | $10,000+ | $5,500 | 55% | — | aspiration tier / purchase funnel |

Cast math sanity: Carmen clears ~$1,700/mo after net rent (fragile, as her
seed requires); Marisol banks ~$3,500/mo (rooted, can be generous); Marcus's
arrears are structural (courier wage vs $1,600 share) — the fiction and the
numbers tell the same story.

## 5. Wiring notes (for game-systems / merge)

- `gsLeaseSeedSF` (41_game_systems_leases.js, game-v3) already seeds housing
  + bank balances for all 28 — **this file is canonical content**; reconcile
  rents/tenants against §3 at merge (game branch seeded before this file
  existed).
- Rent run, notices, late fees, eviction all live in the game track's lease
  system; landlord power is admin-tools-only (design §3) — player landlords
  get a capped version post-license (plan §2.8).
- Jobs pay game-$ only; wages above are gross before the nut. Payday cadence:
  weekly for entry/informal, biweekly for mid/top.
- New hireable characters (500 cr slot) start at the room tier with a job
  board pick — matching the funnel: room → studio → 1BR → flat → deed.
