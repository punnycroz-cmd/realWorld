# Lease Flow — spec & copy deck (world v26; v12 base + v26 depth pass)

The housing lifecycle end to end: listing → application → signing → rent run →
arrears/notices → repairs & disputes → move-out / eviction → purchase →
landlord. The registry (jobs-housing.md §3, address spec §4) records *what*;
this file is *how it moves*.

Companion artifacts:

- `world/lease.html` — working demo ("The Rent Book" v2), file://-safe; every
  state below is reachable in it via the day-stepper. Four viewer modes:
  spectator / tenant (h01) / licensed landlord (h02, capped tools on
  9088-5 only) / admin. localStorage `rw_lease_v26`.
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
  not the system of record. localStorage key `rw_lease_v26` (was
  `rw_lease_v12` — seed shape changed: +`deposit`, `rentNext`, `plan`,
  `med`, `ownedBy` fields and the h02-owned `bld-f9088-5` row).
- New feed vocabulary is confined to `housing`/`admin` kinds — feed.json
  unchanged; the wording table above is the contract.
- 9457-3's dispute is demoed in its *current* ambiguous state — content
  never resolves it (index rule + drama-notes S3). The mediation-accept
  button exists to teach the mechanic on *other* leases; on 9457-3 the
  accepted offer still leaves the passthrough question deliberately
  half-open in copy.

## 12. Application → screening → signing (the front door)

A listing states its screening conditions *on the listing* — the same
conditions the engine evaluates. Nothing hidden, nothing random.

| Step | What happens |
|---|---|
| Apply | One click from the board; the application doc lists the published conditions verbatim |
| Screen | Admin-side checklist: income ~2.5× rent (verified against the job board — wages are registry facts), two references, roommate interview where the unit shares a wall. **First qualified application approves.** No auctions, no vibe denials, no holding a listing to shop applicants |
| Offer | `APPROVED` state — the lease waits for the tenant's signature, never auto-signed |
| Sign | Atomic: lease row written + first month + deposit (1× rent; 0.5× room share) leave the bank + listing off the board + `housing` feed event. If any leg fails, nothing lands |

- Screening is admin-only work, but the *criteria* are player-facing —
  a tenant can always see why they did or didn't make the number.
- A declined application posts nothing to the feed. Rejection is
  private mail with the failed criterion named — the block doesn't
  get to watch someone not qualify.
- Demo: `applyLease()` → `applied`; `screenApp()` (admin) → `approved`;
  `signLease()` deducts `2× rent` and flips the unit live.

## 13. Raises on controlled units (the stated-basis rule)

Every raise posts to the ledger with a **basis** — that's the whole rule.

| Basis | Cap | Notes |
|---|---|---|
| Annual band | ≤ **4%/yr** on rent-controlled units (house rule; unbanked — use it or lose it, no stacking years) | routine; still a ledger line + dated notice |
| Passthrough claim | uncapped | must be itemized math in the ledger (the claimed cost, the allocation). The claim is what a dispute examines — 9457-3's `$2,600→$3,200` lives here |
| Market (uncontrolled) | no cap | 60-day window over +10%; still a ledger line |

- A posted raise stores `rent_next`; the charge on the 1st bills the new
  number. A filed dispute before the 1st freezes the raise too — the
  old rent bills until ruling/mediation.
- Copy always names the basis in plain words: "annual raise inside the
  band (4%)" vs "passthrough claim — itemized below."

## 14. Payment plans (the humane middle rung)

Between "paid" and "noticed" there's a documented arrangement:

- Tenant proposes a plan while `arrears`/`noticed`: the balance split
  across stated installments (demo: two paydays). The plan is a **ledger
  document** — proposed, dated, itemized.
- An honored plan **pauses late-fee accrual** (the day-6 fee check
  skips) and holds the ladder where it stands. The balance still owes;
  the plan doesn't forgive, it schedules.
- A missed installment resumes the ladder exactly where it froze — no
  reset to day 6, no surprise eviction. Breach is itself a ledger line.
- Plans are private mail, never feed events. Spectators see at most the
  `arrears`/`noticed` status word.

## 15. Deposits, itemized

- Held amount: 1× rent (0.5× room share) + simple interest (~1%/yr
  texture line — the registry tracks principal; interest is flavor the
  ledger computes at return).
- Return window: within **21 days** of move-out.
- Deduction whitelist — anything deducted is a ledger line with a reason
  from this list:
  - unpaid rent or fees owed at move-out
  - damage beyond ordinary wear (named per item, e.g. "repaint scuffed wall")
  - cleaning to move-in condition (only if returned worse)
- Never deductible: ordinary wear, pre-existing damage on the move-in
  record, "vibes," or retaliation for a filed dispute. A deduction the
  tenant disputes goes to the board like anything else (`deposit_deductions`
  ground).

## 16. Roommates, joint leases, sublets

- Co-tenants on one lease are jointly liable — 9457-3 is the working
  example: Marcus's share being chronically late is a *household* fact
  the ledger records as one balance, while the fiction knows whose half
  it was. The ledger doesn't adjudicate roommate splits.
- Roommate swap = a lease amendment doc + deposit pro-rata line; the
  remaining tenant's record carries the continuity.
- Sublets: owner-tier unlock (progression §8); approval "not
  unreasonably withheld"; a live sublet posts a listing-shaped board
  entry marked sublet. Informal occupants (Jules's room, Dani's share)
  stay person-to-person and off-ledger — §6 stands.

## 17. Mediation (the offer before the ruling)

Inside `disputed`, either side may state a mediation offer — a concrete
proposal in the file, e.g. "raise at band rate, heater fixed in 7 days,
filing withdrawn."

- An accepted offer amends the ledger directly (new rent line, scheduled
  repair, filing withdrawn → `active`) and posts the same neutral
  `rent-board ruling` feed line — the feed doesn't distinguish a deal
  from a decision.
- A declined offer costs nothing but the week it took; the ruling clock
  resumes. Either side can walk — that's stated on the offer doc.
- Mediation is a mechanic, not a personality test: offers are
  ledger-shaped proposals, never dialogue scripts.

## 18. Licensed player-landlord (capped tools, own doors only)

The §8 license buys a real but small toolbox — deliberately weaker than
the owner's desk:

| Tool | Licensed landlord | Owner/admin |
|---|---|---|
| View ledgers | own units only | all |
| Late reminder / formal notice / cure-or-quit | yes, own units, cooldown per unit | yes |
| Raise | band ≤4% or itemized passthrough, own units | same rules, all units |
| Payment plan | accept/decline on own units | same |
| Mediation offer | yes, own units | yes |
| **Eviction** | **file only** — brings the paper; the owner's review decides | review + confirm |
| Mint addresses | no — landlord character (clerk) + admin only | yes |

- Every licensed-landlord action is public-record the same as admin —
  the feed wording doesn't change with the hat.
- A licensed landlord touching another's unit gets a refusal that names
  the cap ("not your unit"), not an error.
- The demo's h02 owns 9088-5 (a paying ambient tenant, day-1 balance
  outstanding) so every cap is exercisable in one click.

## 19. Copy deck additions (v26)

| Moment | Copy |
|---|---|
| Screening pass | "Approved — income verified via job board, references returned. Sign and it's yours on the 1st." |
| Screening fail | "Out of reach on that income — pick a cheaper door or a better job." (private; no feed line) |
| Sign button | "Sign — $N (first month + deposit)" |
| Partial pay | "Partial applied oldest-charge-first. The balance keeps its clock." |
| Plan proposed | "Plan filed. Fees pause while it's honored — the ladder remembers." |
| Plan honored (day 6) | "Grace lapsed but no fee — payment plan is being honored. The balance still owes." |
| Mediation offer | "Either side can walk; a declined offer just resumes the ruling clock." |
| Mediation accepted | "Ledger amended; both sides signed the offer, not a ruling." |
| Raise, banded | "Annual raise inside the band (4%): $X → $Y, effective the 1st." |
| Raise, passthrough | "Passthrough claim — itemized below. The claim is what a dispute examines." |
| Deposit return | "Deposit returned — $N of $M + interest. Deductions itemized; wear and tear is never a deduction." |
| Licensed cap | "Licensed landlords can bring the paper; only the owner's desk can end a tenancy." |
| Not-your-unit refusal | "Not your unit — licensed tools reach your own doors only." |
