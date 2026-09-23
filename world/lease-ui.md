# Lease Flow — spec & copy deck (world v68; v12 base + v26/v40 depth passes + v54 paper layer + v68 hand-off layer)

The housing lifecycle end to end: listing → application → signing → rent run →
arrears/notices → repairs & disputes → move-out / eviction → purchase →
landlord. The registry (jobs-housing.md §3, address spec §4) records *what*;
this file is *how it moves*.

Companion artifacts:

- `world/lease.html` — working demo ("The Rent Book" v4), file://-safe; every
  state below is reachable in it via the day-stepper. Four viewer modes:
  spectator / tenant (h01) / licensed landlord (h02, capped tools on
  9088-5 only) / admin. localStorage `rw_lease_v68`.
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

## 20. Lease terms (the paper says how long)

Every lease file states its term in one line — demo field `term`:

- **Initial term: fixed 12 months**, then **month-to-month** — no renewal
  paperwork, no rent bump for staying. Staying is the default; the Mission
  rewards roots.
- Ending inside a fixed term is the tenant's break-fee conversation
  (documented, itemized like anything else); month-to-month ends on the
  ordinary 30-day notice of §6.
- Long-tenured files read "month-to-month (initial term served 1989)" —
  Carmen's paper says in one line what the fiction already knows.

## 21. The move-in record (the deposit's baseline)

Signing writes a **move-in condition record** in the same atomic moment —
itemized condition lines, anything pre-existing marked as such.

- At move-out, every deduction is checked against the record: a claim on a
  **pre-existing item is refused outright** — the record settles it, not an
  argument. Demo: 9457-2's record carries "entry wall scuffed —
  pre-existing"; the repaint claim is refused and the refusal is a doc line.
- The record is also dispute evidence (`deposit_deductions` ground) — it is
  a ledger object, same as a payment line.
- Copy never frames it as a favor: "Move-in condition recorded the same
  day — it's the baseline every deposit deduction is measured against."

## 22. Payment plans, for real (propose → accept → installments → breach)

v26's plan flag becomes a full document lifecycle:

```
proposed (tenant files itemized installments — demo: two paydays)
  → accepted | declined (landlord file / admin — a proposal is an offer,
      not a shield; nothing pauses until it's signed)
  → honored: fees pause, ladder holds at plan_rung
  → completed (→ cured) | breached
```

- Installments are dated lines; each due-day is checked — `paid` flag or
  breach. A missed installment **resumes the ladder at the rung it froze
  at** (`plan_rung`) — never reset to day 6, and the breach is itself a
  ledger line.
- A declined plan is a document, not a door closing — a new proposal can
  be filed. Licensed landlords decide plans on their own units only.
- Plans stay private mail; spectators see at most the status word.

## 23. Frozen raises (dispute before the 1st)

A filed dispute with `rent_next` pending sets `rent_frozen`:

- The **old rent bills on the 1st** — the raise waits for ruling or a
  signed offer. The detail line reads "(frozen by filing)".
- A ruling that reduces withdraws the posting; an accepted mediation offer
  amends to the band rate. 9457-3's passthrough posting sits frozen in its
  ledger — the claim, not the number, is what the board examines.

## 24. The no-fault path (different paper entirely)

Sale or owner move-in — admin-only, never on the for-cause ladder:

- **60-day window** (not 14), **mandatory relocation credit** of one
  month's rent posted to the ledger, ledger code `NOFAULT` — distinct so
  abuse is legible: a landlord running no-fault paper to dodge the cure
  ladder leaves a readable trail.
- Feed line is its own neutral template: "no-fault notice posted —
  <address>". Licensed landlords **cannot** issue no-fault notices — it
  stays on the owner's desk with eviction itself.
- Deposit still returns separately, itemized, against the move-in record.

## 25. Sublets (inside the lease, not around it)

- Tenant files a sublet request: named subtenant, stated dates, rent at
  or under the lease rate. Approval **not unreasonably withheld** — a
  decline needs a stated reason on the file.
- An approved sublet posts a board entry marked `(sublet)`; the tenant of
  record stays on the lease and stays liable. The owner-tier sublet unlock
  (§8) is the same document for a whole unit.
- Informal room shares (Jules, Dani) stay person-to-person and off-ledger —
  §6 stands; discovery consequences are emergent.

## 26. File scars (arrears history)

Cured arrears stay on the file (`hist`) — "arrears — cured day 12", visible
to the tenant and to the landlord of that unit. A scar is reputation
texture, never a feed event, and never a screening criterion on its own —
the screening checklist (§12) is the whole checklist.

## 27. Copy deck additions (v40)

| Moment | Copy |
|---|---|
| Term line | "fixed 12 mo → month-to-month" (stated on every file) |
| Move-in record | "Move-in condition recorded the same day — it's the baseline every deposit deduction is measured against." |
| Deduction refused | "Refused outright — it's on the move-in record as pre-existing." |
| Plan proposed | "Plan proposed — it binds only when the other side signs it." |
| Plan accepted | "Plan accepted and dated. Fees pause while it's honored; the ladder holds where it stood." |
| Installment due | "Pay installment — $N (due day N). Missed installment resumes the ladder where it froze — no reset." |
| Plan breached | "The ladder resumes at <rung> — where it froze, not back at day 6." |
| Raise frozen | "The posted raise freezes with the filing — old rent bills until ruling or a signed offer." |
| No-fault notice | "No-fault termination — 60-day window, relocation credit posted mandatory, coded NOFAULT so abuse is legible." |
| Sublet request | "Approval not unreasonably withheld — a decline needs a reason on the file." |
| Sublet live | "Board entry reads 'sublet'; you stay the tenant of record and liable." |
| File scar | "The arrears line stays on the file — a scar, not a sentence." |

## 28. Merge notes (v40)

- New seed fields on lease rows: `term`, `movein`, `hist`, `planProp`,
  `planInst`, `planRung`, `rentFrozen`, `subReq`, `sublet` — all optional,
  all documented above. LS key rolled `rw_lease_v26` → `rw_lease_v40`
  (old saves ignored by design).
- Feed vocabulary gained two templates — `Listed — <addr> (sublet)` and
  `no-fault notice posted — <addr>` — both `housing` kind, both neutral;
  no amounts, no reasons.
- No-fault notices are admin-only; licensed landlords stop at filing for
  review. The `NOFAULT` ledger code is the audit trail — engine should
  preserve it verbatim.
- `node world/audit.js` G11 now also requires the v40 surfaces (move-in
  record, installments, relocation credit, sublet, month-to-month) and
  fails on the old storage key.

## 29. Prorated first month (signing mid-month)

A lease signed after the 1st doesn't bill a full month it didn't use:

- First-month charge = `round(rent × days-remaining / 30)`, itemized on
  the ledger as `first month — prorated to day N`. The deposit stays 1×
  rent — proration never touches it.
- The sign button shows the real number before money moves: "Sign —
  $X (first month, prorated to day 6 + deposit)". Day-1 signings read
  the ordinary line — no special case copy.
- Atomicity unchanged (§12): prorated first month + deposit + lease row
  + move-in record + feed event land together or not at all.

## 30. Break fee inside a fixed term

The §20 term line has teeth, stated up front:

- 30-day notice inside the fixed 12-mo term posts an itemized **break
  fee — one month's rent** as a ledger line, deducted at deposit return
  (not a new charge to pay down — it rides the deposit clock, §33).
- Once the term flips to month-to-month, plain 30-day notice is the
  whole cost. Carmen's file would show no break fee — her paper's been
  month-to-month since 1989.
- The fee is a contract term, never a penalty vibe: same ledger, same
  itemization, same dispute rights (`deposit_deductions` ground).

## 31. Repairs with a clock (habitability SLA)

Repair requests are dated ledger objects with real statuses — the demo
runs two clocks:

|| Kind | Acknowledge | Scheduled | Done | Past SLA |
|---|---|---|---|---|
|| Routine (dripping tap) | ~3 days | ~7 | ~14 | dated, no breach |
|| Habitability (no heat) | **same day** | ~2 | **≤ 7-day target** | **SLA breach — ledger line** |

- A habitability item open past its target writes a `habitability SLA
  breach` ledger line and a doc — the breach stays on the file *after*
  the fix lands. That is the legal weight §4 promised: breach + open
  item strengthens a dispute; a ruling can order repair + rent credit.
- Tenant files two ways: "Request repair" (routine) and "Report
  habitability issue" — the second is acknowledged same-day by
  construction, not by courtesy.
- 9457-3's dead heater predates the clock — its file keeps its standing
  `open 5 mo` line; content never resolves it (§11 stands).

## 32. Roommate amendments (the swap doc)

§16's roommate swap is a real document flow:

```
tenant files (named incoming roommate — screened like any applicant)
  → approved | declined (landlord file / admin; licensed on own units)
  → approved: lease-amendment doc + deposit pro-rata ledger line,
    co-tenant jointly liable from signing day; the file keeps continuity
```

- One balance, joint liability — the ledger records the household's
  number; it never adjudicates who owes which half (9457-3 rule).
- A decline names the reason on the file; a new amendment can be filed
  — a document, not a door closing.
- Informal room shares (Jules, Dani) stay person-to-person and
  off-ledger — §6 stands; discovery stays emergent.

## 33. The deposit clock (21 days, documented)

Move-out now *starts* something instead of settling everything at once:

- `depPending` + `depDue = move-out day + 21` — the detail view shows
  the clock running ("due back by day N"); the return posts as a
  separate itemized event by admin or the unit's licensed landlord.
- An overdue return writes a `deposit return overdue` ledger line —
  board-able grounds, and the lateness stays on the file even after
  the money lands ("returned day 26 (past the 21-day window)").
- Deduction rules unchanged (§15, §21): itemized lines only, move-in
  record refuses pre-existing claims outright, wear is never a
  deduction. Break fees (§30) deduct here.
- Tenant notice, recorded move-out, and no-fault notice all start the
  same clock — the paper is the same whichever door it left through.

## 34. Copy deck additions (v54)

|| Moment | Copy |
|---|---|---|
|| Sign, mid-month | "Sign — $X (first month, prorated to day N + deposit)" |
|| Break fee | "Ending inside your fixed term posts an itemized break fee — one month's rent, deducted at deposit return." |
|| Habitability filed | "Habitability item — acknowledged same-day, target fix ≤ 7 days." |
|| SLA breach | "Open past the 7-day target — the breach is a ledger line now." |
|| Roommate filed | "Amendment filed — the incoming name screens like any applicant." |
|| Amendment signed | "Jointly liable from day N. Deposit pro-rata recorded; the file keeps continuity." |
|| Deposit clock | "Deposit $N + interest due back by day N (21-day window)." |
|| Deposit overdue | "Past the 21-day window — the delay is itself a ledger line." |
|| Deposit returned late | "Returned day N (past the 21-day window — the lateness stays on the file)." |

## 35. Merge notes (v54)

- New demo fields: `roomReq`, `roommate`, `breakFee`, `depPending`,
  `depDue`, `depLate`, `turnWire`; repair rows gain `kind`, `filed`,
  `breach`. All optional, all documented above. LS key rolled
  `rw_lease_v40` → `rw_lease_v54` (old saves ignored by design).
- leases.json v54 adds: `screening.proration`, `lease_terms.break_fee`,
  `repairs.kinds` (habitability vs routine clocks), `deposits.return_clock`,
  `amendments` (roommate swap), licensed-landlord `may` +
  `decide_roommate_amendments` / `post_itemized_deposit_returns`.
- Engine contract at merge: proration math (`round(rent ×
  days-remaining / 30)`), the 21-day depDue, and the SLA-breach ledger
  line should land verbatim; the overdue line is evidence, not a feed
  event. Feed vocabulary unchanged — no new templates.
- `node world/audit.js` G11 now also requires the v54 surfaces
  (proration, break fee, repair SLA, amendment, deposit clock) and
  fails on the old storage key.

## 36. The guarantor path (near-miss screening)

§12's income leg has a middle band, and it isn't a decline:

- Income **≥ 2.5× rent** approves; income **< 2.0×** declines (private
  mail, no feed). Income **2.0–2.5×** is a *near-miss* — the file offers
  a **guarantor path** instead of a flat no.
- The tenant names a guarantor; the guarantor is verified on the **same
  published checklist** (income, references) and co-signs the lease doc
  before signing. Liable for rent and deposit — **never a tenant, never
  an occupant line, never a feed event**.
- Screening can't finish while the flag is set and unattached: the file
  waits on the tenant, not on a vibe. A cheaper door is always the other
  honest answer — the near-miss doc says so.
- Demo: h01's $4,600/mo clears 9127-A ($1,300 needs $3,250) outright and
  near-misses 9418-B ($2,100 needs $5,250, floor $4,200) — attach
  guarantor "M. Okafor," re-run screening, sign.

## 37. Notice service (the clock runs from the door)

Notices 2–4 now carry a **service record** — because paper that never
arrived doesn't start a clock:

- Every formal notice, cure-or-quit, and eviction filing records
  **served: posted to door + mailed**, both dated. The response/cure
  window runs from **service, not the posting day**.
- The cure-or-quit states its deadline in the document: "served day N —
  cure by day N+14." The detail view shows the running deadline while
  `noticed`.
- Notice 1 (late reminder) stays informal — no service record; it isn't
  legal paper, just a nudge.
- Feed wording unchanged: the wire still says "housing notice posted" —
  service detail lives in the file, not on the block.

## 38. The move-out walkthrough (the deduction's citation)

§21's move-in record gets its closing counterpart:

- All three exits (tenant notice, recorded move-out, no-fault notice)
  write an **itemized walkthrough doc** — findings each measured against
  the move-in record: "window latch broken — new (intact on the move-in
  record)" vs "floors worn — matches move-in record, ordinary wear."
- **Every deduction must cite a walkthrough line.** The deposit return
  reads "walkthrough finding; not on the move-in record" — the
  pre-existing refusal rule (§21) is unchanged and still settles claims
  outright.
- The walkthrough is a ledger-side document, evidence under
  `deposit_deductions` — same weight as the move-in record it closes.

## 39. Receipts (proof the tenant carries)

- Any payment can issue a **dated receipt doc** on request — itemized,
  the same numbers as the ledger. The tenant's copy of the truth.
- Dispute weight: the ledger and the receipt say the same thing; a
  receipt that disagreed with the ledger would itself be a finding.
  Receipts are tenant-file documents — never feed events.
- Demo: "Request a receipt" sums payment + installment lines through the
  current day and writes the doc.

## 40. Copy deck additions (v68)

|| Moment | Copy |
|---|---|---|
|| Near-miss | "Income clears the floor but not the published 2.5× — the file asks for a guarantor, not a denial. Or a cheaper door." |
|| Guarantor attached | "Guarantor on file — liable for rent and deposit, never a tenant, never an occupant line, never a feed event." |
|| Screening waits | "The file waits on a guarantor — screening can't finish without one." |
|| Service | "Served: posted to door + mailed, day N — the clock runs from service, not the posting." |
|| Cure deadline | "Cure by day N+14 — fourteen days from service." |
|| Walkthrough | "Itemized walkthrough on file — deductions must cite a walkthrough line; anything pre-existing is refused, not argued." |
|| Receipt | "Dated and itemized, the same numbers as the ledger — carry it to any dispute." |

## 41. Merge notes (v68)

- New demo fields: `income` (demo state — h01's monthly wage, the
  screening income leg), `guar`, `guarantor`, `svc` {door, mail},
  `svcDue`, `walkthrough` — all optional, all documented above. LS key
  rolled `rw_lease_v54` → `rw_lease_v68` (old saves ignored by design).
- leases.json v68 adds: `screening.guarantor` (near-miss band, attach,
  liability), `notices[*].service` on n≥2, `deposits.walkthrough`,
  `receipts`. Feed vocabulary unchanged — no new templates; guarantor,
  service, walkthrough, and receipt detail all live in the file.
- Engine contract at merge: the near-miss band is 2.0–2.5× (below 2.0×
  declines); screening cannot complete while a guarantor is required
  and unattached; notice windows run from service date; deductions must
  cite a walkthrough line; receipts must agree with the ledger.
- `node world/audit.js` G11 now also requires the v68 surfaces
  (guarantor, service, walkthrough, receipt) and fails on the old
  storage key.
