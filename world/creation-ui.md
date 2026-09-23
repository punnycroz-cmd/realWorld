# Character Creation — spec & copy deck (world v7)

"Joining the cast" — the only way to play *inside* the world (address spec §9:
the mains are unpossessable, so the product's in-world agency is a character you
hire). Design §6 locks the two-part cost: **credits for the hire, game dollars
for the housing.** New characters are not exempt from the sim.

Companion artifacts:

- `world/create.html` — working demo of this spec (file://-safe; the pipeline is
  simulated locally). Every state below is reachable in it.
- `world/creation.json` — machine-readable mirror: price, slot caps, record
  schema, screening surface, sim obligations.
- Sources: `world/jobs.json` (openings), `world/housing.json` (listings),
  `world/moderation-notes.md` (screening contract — §3 rules, §4 naming
  strings always get human eyes).
- Prices: `rw-monetization-plan-2026-09-22` §2.4–2.5 (**PROPOSAL** — quote,
  never contradict): **500 cr per character**, one-time, includes basic
  wardrobe + the starter apartment hunt.

## 1. Slot caps (account)

| Tier | Characters/account |
|---|---|
| Base | 1 |
| Resident ($4.99/mo) | 2 |
| Director ($11.99/mo) | 3 |
| Hard max | 3 (compute-budget cap — open decision §9.5) |

Each character is 500 cr regardless of slot. Slots are a cap, not a purchase.

## 2. The five steps

1. **Who arrives** — name, age (18+, always: player-possessable characters are
   adults), pronouns, one line of arrival context. Name collides with no
   cast/ambient/handle — the block already has a Marisol.
2. **What neighbors see** — public bio + look pickers. The bio IS the public
   profile spectators will read; it's also the screened surface.
3. **Work** — live openings off the board (jobs.json `openings > 0` plus
   always-hiring gigs), wages + projected monthly income shown, or "arrives
   without work" on savings.
4. **A door of their own** — live listings only (housing.json). Lease signs at
   creation; first month's rent leaves the arrival bank on day one. Options the
   chosen income can't carry (rent > ~55% of projected income) are shown but
   unselectable — the honest "out of reach" state, not a surprise denial later.
5. **Review & sign** — summary card, 500 cr upfront, then the pipeline.

## 3. Pipeline (mirrors the request pipeline — creation IS a request)

```
declared → screen(name + bio + arrival) → deny? → never billed
         → human review (naming strings always queued — moderation §4)
         → charge 500 cr → mint id h## → lease signed → briefing → feed
```

- **Denied applications never bill.** Post-review denial = full auto-refund.
- **Screened surface = what the player wrote** (name, bio, arrival line). Once
  created, the character's behavior is emergent and inviolable — creation is
  initial conditions, never a script. No "personality triggers", no loyalty
  fields, no "always does X" — the form doesn't have the fields.
- **Feed attribution:** `hire — "<name>" joined the cast · resolved` +
  `housing — move-in · <address> comes off the board`. Public, like everything.

## 4. The briefing (what possession hands you)

Whitelist per design §7 — **public profile, surface relationships, daily
routine**. For a fresh hire the honest state is: profile = the bio you wrote;
surface relationships = "new in town" (supervisor, neighbors — that's the whole
list); routine = the job you picked. Secrets line reads: *"none written — none
to redact. Whatever they're hiding, they'll grow it themselves."* The same
whitelist serves the mod console (moderation §4).

## 5. Sim obligations (stated to the player before payment)

- Rent monthly in game dollars — arrears, notices, eviction, same ledger as
  everyone.
- Works the job; thin-AI auto-shifts pay baseline. Possessed sessions can earn
  the small session bonus — never the reverse (no pay-to-earn-better).
- Offline owner → thin AI; returns → full brain wakes.
- Possession only ever of characters you hired; mains never, landlord never.

## 6. Copy deck

| Moment | Copy |
|---|---|
| Header tier chip | "Resident · 2 slots" |
| Step 1 footnote | "Player-possessable characters are adults — 18 minimum, always." |
| Step 2 footnote | "Secrets aren't a field here because they don't exist yet; the character grows their own." |
| Step 3 footnote | "Wages are game dollars — rent comes out of this, not credits." |
| Step 4 unaffordable | "Out of reach on that income — pick a cheaper door or a better job." |
| Step 4 footnote | "Miss rent and the landlord's office notices — arrears, notices, eviction. Same ledger as everyone on the block." |
| Review footnote | "Denied applications never bill." |
| Deny: name collision | "That name is taken — the block already has one. Pick a name that's theirs alone." |
| Deny: real person | "New arrivals are fictional people — you can't hire a real person into the world." |
| Deny: harm-written | "Writing a character to hurt or humiliate others isn't a creation — it's a denied request." |
| Deny: secret-extraction | "Secrets are discovered by watching, never written in." |
| Deny: legal backstop | "Application not approved." (nothing more, ever) |
| Charge line | "Character hire · charged upfront — 500 cr" |
| Lease line | "Lease signed — <address> · $N/mo · first month paid in game dollars" |
| Success toast | "<name> is on the block. First rent paid; the rest is theirs." |
| Fineprint | "a person, not a puppet … secrets — theirs, everyone's — aren't in the box" |

## 7. Merge notes

- `h##` ids are disjoint from C1–C8 / A01–A20; the hire writes a lease via the
  game track's `gsApplyForLease`/`gsSignLease` path and registers in the claims
  matrix as `char:h##` (possessable target, owner-scoped).
- `creation.json` is the contract; feed events use the shared vocabulary —
  `hire` requests report `in_review`/`resolved`/`refunded`, and the `cast`
  event kind (added to feed.json this version) marks arrival on The Wire.
- Demo's `screenFields` is the §3 contract in miniature; the real classifier
  and review queue are game plumbing (moderation-notes §8, v8 spec).
- Demo account is Resident-tier (2 slots) purely so the flow is exercisable —
  slot-cap math lives in creation.json, not the page.
