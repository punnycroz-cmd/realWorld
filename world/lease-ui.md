# Lease Flow — spec & copy deck (world v12)

The housing lifecycle end to end: listing → application → signing → rent run →
arrears/notices → repairs & disputes → move-out / eviction → purchase →
landlord. The registry (jobs-housing.md §3, address spec §4) records *what*;
this file is *how it moves*.

Companion artifacts:

- `world/lease.html` — working demo ("The Rent Book"), file://-safe; every
  state below is reachable in it via the day-stepper.
- `world/leases.json` — machine-readable mirror: state machine, rent-run
  calendar, notice ladder, deposit rules, dispute schema, progression gates,
  feed wording.
- Sources: `world/jobs-housing.md` §3 (registry — canonical numbers),
  `world/housing/listings.md` (listing copy + move-in costs),
  `world/creation-ui.md` §5 (sim obligations told to players up front).
- Prices: `rw-monetization-plan-2026-09-22` §2.4/§2.8 (**PROPOSAL** — quote,
  never contradict): deed fees 1,000–5,000 cr, landlord license 2,000 cr.
  Everything else here is **game dollars** — the wall stays, always.

## 0. Who may touch a lease (the power map)

| Actor | May | May not |
|---|---|---|
| **Player (own hired char)** | apply, sign, pay rent, request repairs, file a dispute, give notice, offer to buy a listed unit | touch anyone else's lease; set/raise rent; evict; see other ledgers |
| **Owner (admin tools)** | everything — raises, notices, approvals, evictions, rulings | possess anyone (locked); act invisibly (every admin action is feed-public) |
| **Requests pipeline** | nothing — `admin-domain` deny (moderation.json, v8) | "nudge Victor to raise rent," "evict Tomás" — all denied, always |
| **Landlord character (AI)** | mint addresses per spec §6 (clerk role); ordinary owner behavior | exceed the locked personality; be possessed by anyone |
| **Player-landlord (licensed)** | capped tools on *their own* units only (§8) | the game-owner's units; uncapped rents; hidden actions |

Rent is game dollars. Credits never pay rent, deposits, or late fees — the
currency wall is a lease-term fact, not a settings footnote.

## 1. Lifecycle (the state machine)

```
LISTED → APPLIED → APPROVED → ACTIVE ─┬─→ MOVE_OUT → TURNOVER → LISTED
            ↑   (signing)             ├─→ ARREARS → NOTICED → CURED → ACTIVE
            └─ declined               │       └──────────→ EVICT_REVIEW → EVICTED → TURNOVER
                                      ├─→ DISPUTED → RULING → ACTIVE (amended or upheld)
                                      └─→ (purchase) → OWNER_OCCUPIED
```

- `APPLIED` → `APPROVED` is a **screening condition, not a script** —
  listings state their criteria (income ~2.5×, references, roommate
  interview); meeting them approves. No random denials, no scripted
  drama at the door.
- Signing is atomic: lease row written + first month + deposit leave the
  arrival bank + listing comes off the board + feed `housing` event.
- `EVICT_REVIEW` is never automatic — it is a human admin decision with a
  public paper trail. Arrears alone never evicts mid-dispute.

## 2. The rent run (monthly, game $)

| Block day | Event |
|---|---|
| 1st | Rent charge posts to every active lease ledger |
| 1st–5th | Grace window — pay any time, no penalty |
| 6th | Late reminder (informal) + late fee accrues: **5% of rent, cap $50** (house rule, stated in every lease) |
| 10th | Still unpaid → `ARREARS`; formal notice issued (§3) |
| 24th+ | Unpaid + unresponsive → `NOTICED`; cure window runs (§3) |

- **Partial payments accepted**, applied oldest-charge-first. The ledger
  shows every line: charge, payment, fee, credit, adjustment.
- Payday cadence (jobs-housing §5) means entry-tier tenants often pay on
  the 3rd–4th — grace exists so the honest poor are never fee'd.
- **Rent control** is a unit flag (registry). Raises on controlled units
  need a stated basis in the ledger (annual % or a claimed passthrough);
  the claim is what a dispute examines — see 9457-3.

## 3. Notices (the ladder)

All notices are documents: dated, itemized, in the ledger, deliverable.
Tone escalates; the paper trail is the game.

| # | Notice | Trigger | Window | Who sees |
|---|---|---|---|---|
| 1 | Late reminder | day 6 unpaid | — | tenant (+ player inbox) |
| 2 | Formal notice — pay or respond | `ARREARS` at day 10 | respond within 7 days | tenant, landlord file |
| 3 | Cure-or-quit | unresponsive / balance at 30+ days | 14 days to cure | tenant, landlord file, **feed** (`housing`, neutral) |
| 4 | Eviction filing | window expired, no cure, no open dispute | admin decision | **feed** (`admin` kind, attributed) + ledger |

- A **filed dispute freezes the ladder** at its current rung — the
  9457-3 rule. You cannot be evicted while the board's ruling is open.
- Curing at any rung → `CURED` → back to `ACTIVE`; the ledger keeps the
  scar (arrears history is reputation texture, visible to landlords).
- Notices 1–2 are private mail. Notices 3–4 hit the public feed because
  they change the block — transparency rule (design §3).

## 4. Repairs & habitability

- Repair request → `acknowledged` → `scheduled` → `done`, each dated.
- **Habitability items** (heat, hot water, water intrusion, lock failure)
  expedite: acknowledged same-day, target fix ≤ 7 days. The dead heater
  at 9457-3 is the standing example — registered, unrepaired, disputed.
- An open habitability item is legal weight: it strengthens a dispute,
  and an admin ruling can order repair + rent credit (§5).

## 5. Disputes (the rent-board path)

For contested raises, passthrough claims, habitability, deposit
deductions. Styled on a real rent board but simplified — this is a game.

```
filed (tenant, itemized objection + evidence refs)
  → evidence window (7 days; ledger + repair log are the record)
  → mediation week (a stated offer may resolve it — either side can walk)
  → RULING (admin arbitration): uphold | reduce | repair+credit
```

- Evidence is real ledger objects only — repair requests, payment lines,
  the claimed passthrough math. No testimony mechanics, no scripts.
- Rulings amend the ledger: a `reduce` writes the new rent; a
  `repair+credit` schedules the fix and posts a rent credit line.
- A ruling is a feed event (`housing`, neutral wording — "rent-board
  ruling at 9457 Guerrero St, Unit 3"); the amounts stay in the file.
- Either side may live with a bad ruling — the world doesn't force
  closure; `DISPUTED` can sit as pressure (drama-notes S3 stays live).

## 6. Move-out & turnover

- Tenant gives notice (30 days, or lease-end). Deposit returns minus
  **itemized deductions** — every deduction is a ledger line with a
  reason; "cleaning fee: vibes" is not a reason.
- Unit flips `ACTIVE → TURNOVER → LISTED`; feed posts the listing
  (`housing`). Addresses are immutable (spec §3) — only the lease row
  changes.
- Informal occupants (Jules's room, Dani's share) are not leaseholders:
  their money moves person-to-person and never touches this ledger.
  Discovery consequences are emergent, never scheduled here.

## 7. Eviction (the heaviest verb)

- `EVICT_REVIEW` is an admin queue card: ledger, notice history, open
  disputes, household facts. The admin decides; nothing auto-evicts.
- A hired character who misses rent can be evicted (design §6 — new
  characters are not exempt). The player's notice is honest and early:
  notice 2 already says what notice 4 costs.
- Eviction lands on the feed as an `admin` event with neutral wording —
  "tenancy ended at 9127 Capp St, Unit A" — never the debt amount, never
  the reason text. The world reacts (rumors, reputation); the paper
  stays paperwork.
- **No-fault path** (sale, owner move-in — the S1 fuse): different
  notice, longer window, relocation credit mandatory. Distinct code in
  the ledger so abuse is legible.

## 8. Tenant → owner → landlord (progression gates)

| Step | Game-$ cost | Credit cost | Gates |
|---|---|---|---|
| Tenant | rent + deposit | — (character slot 500 cr covers the hire) | application screening |
| Owner | purchase price + mortgage/tax/HOA monthly | deed fee 1,000–5,000 cr by tier (plan §2.4) | the unit must be listed-for-sale; offer at asking — **no bidding** (anti-whale) |
| Landlord | — | license 2,000 cr | own ≥30 days + reputation threshold + clean record (plan §2.8) |

- Owner unlocks: decorate rights, sublet rights, property history on
  public record, owner-occupied status (no rent line; tax/HOA replaces it).
- Player-landlord tools are **capped**: rents inside the rent-control
  band, all actions public-record, cooldowns, and only on units they own.
- Purchase listings use the same 9xxx system and read like normal
  listings (spec §10); nothing in the UI reveals the generation rule.

## 9. Feed wording (housing events — kind `housing` / `admin`)

Public wording is neutral and surface-level. Amounts, reasons, and
screened detail never appear.

| Event | Feed text shape |
|---|---|
| Listing posted | "Listed — 9127 Capp St, Unit A (studio)" |
| Listing filled / lease signed | "Listing filled — 9457 Guerrero St, Unit 2 comes off the board" |
| Cure-or-quit issued | "housing notice posted — 9344 Folsom St, Unit 1" |
| Ruling | "rent-board ruling — 9457 Guerrero St, Unit 3" |
| Move-out / turnover | "Unit turning over — 9127 Capp St, Unit A back on the board" |
| Sale recorded | "Sold — 9476 Dolores St, Unit B changes hands" |
| Eviction (admin) | "admin action — tenancy ended at 9263 Geneva Ave, Unit 4" |

Individual rent payments are never feed events. Arrears is ledger
texture — neighbors half-know, the feed doesn't announce it.

## 10. Copy deck

| Moment | Copy |
|---|---|
| Apply (affordable) | "You make the number — sign and it's yours on the 1st." |
| Apply (out of reach) | "Out of reach on that income — pick a cheaper door or a better job." |
| Sign line | "Lease signed — <address> · $N/mo · first month + deposit paid in game dollars" |
| Pay button | "Pay rent — $N (due the 1st, grace through the 5th)" |
| Late reminder | "Rent's past grace — $N + $fee late fee. Pay by the 10th to keep the file clean." |
| Formal notice | "Formal notice: balance due within 7 days. Partial payments apply oldest-first." |
| Cure-or-quit | "Cure within 14 days or the tenancy is reviewed. Filing a dispute pauses this clock." |
| Dispute filed | "Filed with the board — your clock pauses while it reads. Evidence is your ledger, not your word." |
| Ruling: reduce | "Ruling: raise reduced to $N. Ledger amended; credit posted." |
| Ruling: repair+credit | "Ruling: repair ordered within 7 days + rent credit posted." |
| Deposit return | "Deposit returned — $N, deductions itemized below." |
| Eviction (tenant view) | "Tenancy ended. The ledger is closed; the block will see a neutral line." |
| Owner offer | "Offer at asking — $N game-$ + N,NNN cr deed fee. No bidding; first accepted offer wins." |
| Landlord license | "License — 2,000 cr. Gates: own 30 days, standing, clean record. Earned, then bought." |
| Wall reminder | "Credits buy agency, not rent. Rent is game dollars — earned in-world, owed in-world." |

## 11. Merge notes

- Game track owns the engine (`gsLease*` per jobs-housing §5): this file
  is the content contract — state names, day-numbers, and feed wording in
  `leases.json` should land verbatim at merge.
- `lease.html` simulates the ledger client-side; it is a surface demo,
  not the system of record. localStorage key `rw_lease_v12`.
- New feed vocabulary is confined to `housing`/`admin` kinds — feed.json
  unchanged; the wording table above is the contract.
- 9457-3's dispute is demoed in its *current* ambiguous state — content
  never resolves it (index rule + drama-notes S3).
