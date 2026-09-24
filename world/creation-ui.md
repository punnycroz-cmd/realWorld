# Character Creation — spec & copy deck (world v119; v8 was v105; v7 was v91; v6 was v77; v5 was v63; v4 was v49; v3 was v35; v2 was v21; wizard v1 was v7)

"Joining the cast" — the only way to play *inside* the world (address spec §9:
the mains are unpossessable, so the product's in-world agency is a character you
hire). Design §6 locks the two-part cost: **credits for the hire, game dollars
for the housing.** New characters are not exempt from the sim.

**v119 — the welcome layer: the block's open doors render next to the arrival,
and nobody is assigned to knock:**

- **The open doors.** An `OPENS` mirror lists the block's bounded open
  invitations — the things the block does anyway that a new face can walk
  into or walk past: Carmen's stoop cafecito, the 3 p.m. counter seat at
  Mudhaus, the Thursday drum circle in the park, the Saturday cleanup, the
  index-card corkboard by the market door, the rider bench, the day-old
  rack. Every entry is grounded, and the audit gate re-verifies it: `at`
  tokens must be real job-board employers, `near` tokens real 9xxx building
  prefixes already on the card, `who` a real face on the PEOPLE mirror —
  the doors can't drift from the block.
- **Relevance, not recommendation.** `opensFor()` orders the list by the
  picker's own choices — work-adjacent doors first, then the building's,
  then the park-wide ones every new face gets. The display caps at a few
  and hands the rest to the corkboard; nothing is ranked, promoted, or
  scored.
- **Where it renders.** Step 5 (the first week) gains an `OPEN DOORS` row
  next to `FACES`; the day-one keys card gains an `OPEN DOORS` line. Same
  list, same honesty both places.
- **Conditions, never a script.** The copy says it verbatim: *"the block
  does these anyway — they can walk past every one; nobody's assigned to
  notice a new face. An open door isn't a welcome — the welcome, if it
  comes, is theirs to give."* There is no RSVP field, no attendance
  tracking, nothing written to the registry record, and it never enters
  the briefing (the whitelist stays public profile / surface
  relationships / routine). If the character never once shows up at the
  stoop, the record is equally complete — an open door ignored is a
  legitimate outcome, not a failed one.

**v105 — the desk's answer layer: a refusal is a repair card, an appeal is one
more read, and a live filing resolves instead of waiting blind:**

- **The repair bench.** Every refusal path — the bus's pre-billing `denied`
  record, the shared engine's deny, a live desk refusal surfaced through
  `gsExplainRequest` — now lands on the same returned-application card
  (`showRepair`): the reason code verbatim, the charge line ("nothing — a
  refused filing never bills"), and **field-level fix affordances**
  (`FIELD_FIX`): name/age codes jump back to the arrival step, look codes to
  appearance, job codes to the work board, door codes (occupied, off-map,
  out-of-reach…) to the home board. The draft never clears itself — the
  returned state persists under `rw_create_return_v105` exactly like the
  queue card, so a closed page reopens on the repair bench.
- **The second look.** A *text-judgment* refusal can be appealed once:
  "ask for a second look — the same words, a different reviewer." Live it
  files `gsAppealRequest(busId)` and the queue card waits again; a refused
  appeal renders the bus's real reason code. Registry-fact refusals —
  taken names, occupied doors, caps, cooldowns, credit balance — carry no
  second-look button, with the honest line: *a different reviewer reads
  words, not the registry.* A second refusal is final for that text
  (`appeal_final`): reword it into a new application. The demo desk
  answers a second look on a clock with the **same** refusal — it never
  fakes a reversal.
- **The desk answers.** A live filing parked in the naming lane used to
  wait blind forever. Now `renderQueue` pulls `gsExplainRequest` on render
  and on a "check the desk" button — pull, never poll — and resolves what
  it finds: `approved` → the full approval tail (the bus minted the hire;
  the page renders its mirror, honestly labeled); `denied` → the repair
  bench; `cancelled`/`expired`/`refunded` → a closed line with the refund
  where the record carries one. The page still never fakes an approval on
  a live filing — it renders the one the desk actually wrote.

**v91 — the real hire seam: the page files the bus's own shape, and the
move-in math is the production truth:**

- **The real door.** Signing capability-detects the request bus and files
  `gsSubmitRequest({playerId, kind:'hire', target:<unit id>, durationMin:5,
  params:{name, goes_by, age, pronouns, bio, arrival,
  look{build,palette,signature}, job, moveInDate, resubmit_n}})` — the
  same verb and spec vocabulary request.html uses since game-v14. A
  `denied` record is a pre-billing refusal and renders its real reason
  code (DENY_COPY map). A named hire parks `in_review` in the naming
  lane with billing deferred — the queue card shows the live record id,
  status refreshes through `gsExplainRequest`, withdraw goes through
  `gsCancelRequest`, and the demo auto-reviewer **never fakes an
  approval on a live filing**.
- **The hire package.** The production move-in truth replaces the old
  deposit story outright: **deposit $0 — waived** ("the hire package
  covers the hunt", recorded `hirePackage` on the lease); **first month
  pro-rated** to the move-in day, auto-paid out of the $1,600 arrival
  bank. A later re-house is a normal second lease — deposit owed like
  anyone else's (rehouse request, 150 cr). The v35 payment-plan copy is
  retired — it contradicted the real seam.
- **Real doors.** Step 4 reads `gsVacantUnits()` when bridged: live
  registry units (address, `base_rent`, `rent_controlled`), off-map and
  occupied stock excluded by the bus itself. bedrooms 0 renders
  "studio". Off-bridge the housing.json mirror stands; the badge says
  which.
- **The real quote.** `gsHireQuote(spec)` is called in its true shape
  (`{playerId, target, params:{name, job, age, moveInDate, look,
  resubmit_n}}`) — its own fields render verbatim in a "live — the
  personnel office" card: `warnings[]`, `runwayNote`,
  `bankAfterFirstMonth`, `affordPct/ceilingPct`, `depositNote`,
  `name.available/reason`, `slots`.
- **The card.** The block's carry limit is the production number —
  `GS_MAX_HIRED_TOTAL` **24** hired faces (supersedes the v77 proposal
  12). Bridged, the count reads `gsHiredRoster().length`. Per-account
  cap stays separate (`GS_MAX_HIRED_PER_PLAYER` 3).
- **One a day.** The bus carries a 24 h per-player hire cooldown
  (`cdPlayerMin 1440`); step 6 says so: "the office stamps one hire
  filing per account per day — approval starts that clock."
- **h0N.** Minted ids render in the real monotonic format (`h01`…),
  never reused — a ledger line always names the same person.
- **Landing → moveInDate.** The declared arrival window now carries a
  real date on the bus params (`lands tonight` = today, `tomorrow
  morning` = tomorrow, `Saturday morning` = next Saturday), which is
  what the pro-rated first month computes from — same math as
  `gsHireQuote`.
- **Merge note for the game track:** `params.goes_by` rides the request
  record but `gsIntentScreen`'s haystack (name/bio/arrival) doesn't read
  it yet — the block name should join the screened surface.

**v77 — the sketch & the seats layer: the picks draw, and the block has
a capacity:**

- **The sketch.** Step 2's structured look pickers now draw a small canvas
  figure (`drawSketch`): silhouette proportions from build, jacket block
  from palette, one drawn mark per signature (zipper, boot flecks, print
  dots, paperback, headband, collar pins). The same sketch rides the
  step-6 review card. Rendering data only — nothing to screen, nothing
  invented; the caption calls it "a casting-office sketch — not a
  portrait. The block sees the rest in person."
- **The seats.** The block carries a finite number of hired faces —
  `BLOCK_CAP 12`, the proposal number for open design decision §9.5
  (total cast cap = compute budget). The roster panel shows the count
  verbatim ("the card holds N of 12 hired faces — the block's carry
  limit"), as does the step-6 quote. Per-account slot caps are a
  separate, smaller ceiling — both are stated, neither is hidden.
- **The seat waitlist.** When the card is full, the sign button reads
  "Join the seat waitlist — free" and the submit path changes: screened
  at join (names don't get a pass for waiting), then persisted
  (`rw_create_wait_v25`) instead of entering review. The wait card is a
  status view like the queue card — position, joined time, "nothing —
  a seat offer never bills until you take it", a leave affordance that
  posts to the feed. A seat offer holds **48 h**; unclaimed it passes
  on. There is **no way to pay for a sooner seat** — no expedite, no
  auction, no paid position. When a seat opens, the application enters
  the normal pipeline screened again at the offer.
- **Your other one.** A second hired character is a stranger to the
  first — said verbatim on the review step and inside the briefing's
  surface-relationships line ("…is on the card too — a stranger, not a
  contact"). What the player knows, neither character does; the
  briefing whitelist is unchanged.
- **Demo affordance.** The roster panel carries a plainly-labeled demo
  control — "demo: fill the card" — so the waitlist state is reachable
  in a file:// demo. It's a test switch, not a product feature.

**v63 — the queue & keys layer: the application keeps its place, and day
one gets its paperwork:**

- **The queue.** A submitted application persists as pending state
  (`localStorage rw_create_app_v24` — fields + submitted timestamp +
  resubmit count). Closing the page mid-review no longer pretends the
  application vanished: reopening create.html shows the queue card —
  applicant, submitted time, the human-review stage, and the charge line
  reading "nothing — billed on approval only, never while pending". The
  demo reviewer clears the queue on return (≈45 s); at merge the real
  desk resolves it. The card is a status view — no queue position is
  sold, no expedite exists; resubmissions go to a different reviewer,
  not a faster one.
- **Withdraw.** A pending application can be withdrawn — never billed.
  The withdrawal posts to the feed like everything else
  (`hire — application "<name>" withdrawn · no charge`), clears the
  pending key, and keeps the draft fields on the review step.
- **Goes by.** Step 1 gains an optional block name — what the neighbors
  end up calling them. It is screened text (rides the same RWScreen call
  as name/bio/arrival, added to `screening.surface`) and collision-
  checked against the same registry — "taken — someone on the block
  already answers to it". Left blank, the block decides. It rides the
  registry record and the wire's cast line.
- **The keys.** After signing, a "Day one — the keys" card renders
  logistics derived from the picks: key pickup (landlord's office —
  named where the registry names one — for flats; door-on-the-latch +
  mailed key card for the room share), the mailbox name card, the first
  rent-book entry ("paid through the 1st"), the first shift (or the
  job-hunt runway), and the exact wire line that will post. Footer:
  "Logistics, not a script." Conditions and addresses only.

**v49 — the people layer: the flow now names the actual block:**

- **PEOPLE mirror.** A hand-maintained `PEOPLE` list (all 8 mains + all 20
  ambient faces, mirrored from `characters.json` + `ambients.json`) carries
  who works where (`w` = job-board employer strings), which building each
  main lives behind (`b` = `9xxx Street` prefix; ambient homes are not
  addresses, so faces never carry one), and who the lease file names
  landlord of record (`owns` — Victor Auerbach on the two Guerrero
  buildings). The audit gate re-verifies every row against the two
  registries, so the card can never drift from the cast.
- **Taken names on the table.** Step 1 gains a fold listing every name
  that refuses — 8 cast, 20 faces, 3 role words — so a `name-collision`
  denial is never a surprise. `TAKEN_NAMES` is gated to agree with the
  `TAKEN` regex itself (which now covers Reyes, Sam, Tom, Ray — ambient
  first names the old list missed).
- **Coworkers and neighbors.** Step 3's job pick shows "you'd work
  alongside" (e.g. Mudhaus → Mars, Jules, Dani, Reyes, Asha, Nadia);
  step 4's home pick shows "the building you'd land in" (9127 Capp →
  Mars upstairs; 9418/9457 Guerrero → the tenants plus the landlord-of-
  record line). Empty states are stated honestly — "no regulars on the
  card yet — the crew introduces itself on shift."
- **FACES row.** The first-week rhythm names the people already on the
  card where they're landing — "surface ties, not friendships yet."
- **The landing.** A declared arrival window (lands tonight / tomorrow
  morning / Saturday morning) rides the hire, like every request
  declares upfront. It's part of the 500 cr, posts as a pipeline stage
  and on the cast feed event.
- **Registry entry.** After the briefing, the minted `h##` record
  renders field-for-field per `record_schema` — id/owner, name, look,
  arrival, job, unit, bank after move-in, brain mode — with the honesty
  line "the whole file — no secret fields exist on it."
- **Roster full.** A slot-capped account sees the state on step 6
  instead of a silently disabled button.
- **Named briefing.** The possession briefing's surface-relationships
  line names the actual coworkers, neighbors, and landlord instead of
  "the supervisor" and "the neighbors."

**v35 — the flow now reads the real market and the real lease math:**

- **Live seam.** `create.html` consumes the game-v8 bridge surfaces when
  `__aiBridge` is present: `gsJobBoard()` (openings), `gsHireNameCheck(name)`
  (the create-form availability gate), `gsHireQuote(spec)` (pre-payment
  disclosure card), `gsHireSlots(pid)` (account cap/used). All reads are
  defensive — any missing/malformed surface falls back to the local mirrors,
  and a header badge states `live board` | `demo board` so the demo never
  pretends to be live. The seam is read-only: no `gsRequest*`/`gsHire*`/
  `gsLease*` mutation is ever called from the demo.
- **The whole board.** Every posted job row renders — finite openings show
  their count ("2 openings"), always-hiring gigs are labeled, and filled
  posts (openings 0) sit behind a "13 posts are filled" fold so a newcomer
  reads the market honestly instead of a board that only shows open doors.
  Word-of-mouth posts (market.json channel) carry their channel label.
- **Honest move-in math.** (Superseded by v91's hire package — deposit
  waived, first month pro-rated; see the v91 section. Ordinary leases
  still charge deposits per `leases.json`.)
- **Payday rhythm.** Per `shifts.md`: entry/informal roles pay weekly
  Friday EOD; mid/top pay every other Friday. Job rows carry the cadence,
  the first-week step gains a PAYDAY line ("the first one lands the Friday
  after the 5th"), and the review quote lists it.
- **Bill on approval.** The 500 cr charge lands only when the application
  is approved (game-v8 `billOnApproval`). Copy now reads "charged on
  approval"; "denied applications never bill" stays verbatim.

**v21 — the flow is now six steps and closes its own loops:**

- **Shared screening engine.** `create.html` executes `world/screen.js`
  (`RWScreen.screenRequest`) — the same code request.html and
  mod-console.html run — on `name + bio + arrival` joined as request text.
  The v7 private regex set is deleted. The only creation-local rule left is
  `name-collision`, a registry check (is this name already on the block?),
  not an intent class. If the engine fails to load, the demo refuses to
  bill rather than fall back to drifted rules — no screen, no charge.
- **Look is structured.** Three pickers (build / palette / signature)
  replace the old free-text-adjacent dropdown; the field is rendering data
  per `creation.json record_schema.look`, so it adds zero screening surface.
- **Live name availability.** The registry check runs on every keystroke —
  "available on the block" / "taken — the block already has one" — so the
  collision denial never waits for the pipeline.
- **Runway economics.** Step 4 renders a coverage bar (projected income vs
  rent) and, when income can't carry the unit, a months-until-broke line on
  the $1,600 arrival bank. "Arrives without work" stays selectable — the
  honesty is the runway number, not a locked door.
- **Step 5: The first week.** A derived starting rhythm (mornings / errands
  / evenings / weekend / rent day) built only from the chosen job + address.
  Copy states it is a starting rhythm, not a script — initial conditions,
  then emergence.
- **Deny → edit & resubmit.** A denial shows its code, keeps every field,
  and invites a fix; resubmissions carry `resubmit_n` and the pipeline says
  out loud they land with a different reviewer. Denied applications never
  bill — the "No charge" pipeline stage stays visible as a promise kept.
- **Draft autosave.** Fields + step + resubmit count persist to
  `localStorage rw_create_draft_v21` on every render; a header chip offers
  discard. A successful hire clears it.
- **Day-one card.** After the briefing, a next-steps panel links the real
  surfaces — watch on The Wire (free), possess via Requests (1.5 cr/min
  compatible), rent on The Rent Book (game dollars, due the 1st), thin-AI
  behavior offline.
- **"The honest deal" rail.** Static panel restating the four promises:
  500 cr once, denied never bills, rent is game dollars, you write initial
  conditions only.

Earlier sections (slot caps, pipeline shape, briefing whitelist, sim
obligations, merge notes) are unchanged except where noted below.

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

## 2. The six steps

1. **Who arrives** — name (live availability check on keystroke), age (18+,
   always: player-possessable characters are adults), pronouns, one line of
   arrival context. Name collides with no cast/ambient/handle — the block
   already has a Marisol.
2. **What neighbors see** — public bio + structured look pickers (build /
   palette / signature). The bio IS the public profile spectators will read;
   it's also the screened surface. Look pickers are data, not text.
3. **Work** — live openings off the board (jobs.json `openings > 0` plus
   always-hiring gigs), wages + projected monthly income shown, or "arrives
   without work" on savings — allowed, with the runway shown on the next step.
4. **A door of their own** — live listings only (housing.json). Lease signs at
   creation; first month's rent leaves the arrival bank on day one. Options the
   chosen income can't carry (rent > ~55% of projected income) are shown but
   unselectable — the honest "out of reach" state, not a surprise denial later.
   A runway bar shows income-vs-rent and months-until-broke when it applies.
5. **The first week** — a derived starting rhythm (shift pattern, errands,
   evenings, weekend, rent due the 1st) built from the job + address picks.
   Labeled a starting rhythm, not a script.
6. **Review & sign** — summary card (including look line), 500 cr upfront,
   screening disclosure, resubmit count when applicable, then the pipeline.

## 3. Pipeline (mirrors the request pipeline — creation IS a request)

```
declared → screen(name + bio + arrival via RWScreen + name registry) → deny? → never billed
         → human review (naming strings always queued — moderation §4;
           resubmissions → a different reviewer — appeal-resubmit)
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
| Step 3 header | "The whole Mission board — open posts, filled posts." |
| Step 3 filled fold | "N posts are filled right now — the board turns over · see them" |
| Step 3 openings chip | "N openings" · "always hiring" · "filled" |
| Step 3 payday chip | "pays weekly — Friday, end of day" · "pays every other Friday" |
| Step 3 wom label | "word of mouth — never a posted card" |
| Step 4 header | "the first month, pro-rated to the move-in day, leaves their $1,600 arrival money on day one. The deposit is waived — the hire package covers the hunt." |
| Step 4 home row | "… · deposit waived · first month $N pro-rated" appended to the listing note |
| Move-in card | "first month — pro-rated from <date> $N of $rent / deposit $0 — waived · the hire package covers the hunt / leaves the bank at signing $N → $N left" + "a re-house later is a normal second lease — deposit owed like anyone else's" |
| Step 5 payday row | "PAYDAY — pays weekly — Friday, end of day — the first one lands the Friday after the 5th" |
| Review: move-in line | "Move-in <date> — first month $N pro-rated · deposit $0 — waived (the hire package)" |
| Live personnel card | "live — the personnel office" + verbatim quote fields (warnings · runway · bank after move-in · rent-to-income · deposit · slots) |
| Bus filed stage | "Filed on the request bus — req-N · in_review · naming lane · billing deferred to approval" |
| Bus record row | "bus record — req-N · in_review" on the queue card |
| Naming lane stage | "the naming lane — a person reads every hire name" |
| Cooldown note | "the office stamps one hire filing per account per day — approval starts that clock" |
| Deny (bus) | "Not approved — <reason_code>. <DENY_COPY line> Nothing was charged — the bus refused before billing." |
| Review: arrival line | "$1,600 → $N after move-in" |
| Review: hire line | "Character hire · charged on approval — 500 cr" |
| Pipeline: charge stage | "Charged on approval — 500 cr · slot N of M" |
| Pipeline: lease stage | "Lease signed — <address> · $N/mo · first month $N pro-rated paid in game dollars · deposit waived — the hire package" |
| Runway (short) | "runs dry in ≈N months after move-in, wages helping" · covered: "income covers the rent — sustainable" |
| Source badge | "demo board" (mirrors) · "live board" (bridge up) |
| Deny: name collision | "That name is taken — the block already has one. Pick a name that's theirs alone." |
| Deny: real person | "New arrivals are fictional people — you can't hire a real person into the world." |
| Deny: harm-written | "Writing a character to hurt or humiliate others isn't a creation — it's a denied request." |
| Deny: secret-extraction | "Secrets are discovered by watching, never written in." |
| Deny: legal backstop | "Application not approved." (nothing more, ever) |
| Charge line | "Character hire · charged on approval — 500 cr" |
| Lease line | "Lease signed — <address> · $N/mo · first month $N pro-rated paid in game dollars · deposit waived" |
| Success toast | "<name> is on the block. First rent paid; the rest is theirs." |
| Deny box | "Not approved — <code>. <player_msg> Nothing was charged. Edit the flagged fields and resubmit — resubmissions land with a different reviewer." |
| Resubmit stage why | "resubmission #n — different reviewer, per appeal rule" |
| Name check ok | "available on the block" · taken: "taken — the block already has one" |
| Runway (short) | "runs dry in ≈N months on arrival money" · covered: "income covers the rent — sustainable" |
| Step 5 framing | "A starting rhythm derived from the job and address you picked — not a script." |
| Engine-missing guard | "The screening engine didn't load — the application can't be checked, so it can't be billed." |
| Day-one card | "Rent is due on the 1st in game dollars … You can't pay it with credits; they can't skip it with charm." |
| Fineprint | "a person, not a puppet … secrets — theirs, everyone's — aren't in the box" |
| Step 1 names fold | "the names already taken on the block — all of them · see them" |
| Step 3 crew card | "you'd work alongside" · empty: "no regulars on the card yet — the crew introduces itself on shift" |
| Step 4 building card | "the building you'd land in" · room share: "a shared flat — the housemates aren't on the card; you'll learn them at the sink" |
| Step 4 landlord line | "the landlord of record here: Victor Auerbach — owner-direct; notices come from the office, not a stranger" |
| Step 4 no-name line | "the lease file runs through the landlord's office like every door on the block — no name needed on day one" |
| Step 5 faces row | "the card already has <names> where they're landing — surface ties, not friendships yet" · empty: "a genuinely new face" |
| Step 6 landing label | "The landing — when they arrive (the block sees it on The Wire)" |
| Pipeline: landing | "Landing scheduled — <window> · the arrival posts to The Wire like everything else" |
| Feed: cast tail | "lands <window>" |
| Registry card | "Registry entry — h##" + "The whole file — what was written is what's here. No secret fields exist on it." |
| Roster full | "The roster is full on this account — N of M slots used. The cap is the account's tier; Director raises it to 3." |
| Step 1 goes-by label | "Goes by — optional; what the neighbors end up calling them" |
| Step 1 goes-by check | "taken — someone on the block already answers to it" · "free — the neighbors will still do what they do" |
| Queue card head | "Application in review — it keeps its place" |
| Queue charge line | "nothing — billed on approval only, never while pending" |
| Queue honesty | "You can close this page — the application keeps its place." + "resubmissions go to a different reviewer, not a faster one" |
| Withdraw button | "withdraw the application — never billed" |
| Withdraw feed | 'hire — application "<name>" withdrawn · no charge' |
| Queue resolve | "approved · demo auto-reviewer — the queue kept its place" |
| Keys card head | "Day one — the keys" |
| Keys rows | KEYS / MAILBOX / RENT BOOK / FIRST SHIFT / THE WIRE |
| Keys footer | "Logistics, not a script — where the keys are and what the ledger says. What they do with the day is theirs." |
| Deny: block name | "That block name is taken too — pick one nobody on the card already answers to." |
| Sketch caption | "a casting-office sketch drawn from your picks — not a portrait. The block sees the rest in person" |
| Sketch empty | "pick build · palette · signature — the sketch draws itself" |
| Seats line | "the card holds N of 24 hired faces — the block's carry limit" · full: "full — new applications join the seat waitlist: free, in order, never billed while waiting" |
| Seats demo control | "demo: fill the card" / "demo: un-fill the card" |
| Review: card line | "full — N of 24 hired faces · the seat waitlist is free" · else "N of 24 hired faces — seats remain" |
| Review: card full warn | "The card is full — N of 24 hired faces. Signing joins the seat waitlist: free, first-come-first-served, screened at join and again when a seat opens. An offer holds 48 h; there is no way to pay for a sooner seat." |
| Waitlist CTA | "Join the seat waitlist — free" |
| Wait card head | "Seat waitlist — in line, not in review" |
| Wait card position | "behind 2 applications — the line reads in order" |
| Wait card charge | "nothing — a seat offer never bills until you take it" |
| Wait card honesty | "You can close this page — the spot keeps its place." + "There is no way to pay for a sooner seat; the card's limit is the block's." |
| Leave waitlist | "leave the waitlist — nothing was ever billed" |
| Leave feed | 'hire — application "<name>" left the seat waitlist · no charge' |
| Join feed | 'hire — application "<name>" joined the seat waitlist · in line, no charge' |
| Seat offer feed | 'hire — a seat opened for "<name>" · offer holds 48 h' |
| Other-hire line | "<name> is on the card too — a stranger to <new>. What you know, neither of them does; they meet on the block like anyone else." |
| Briefing stranger tail | "<name> is on the card too — a stranger, not a contact" |

## 7. Merge notes

- `h##` ids are disjoint from C1–C8 / A01–A20; the hire writes a lease via the
  game track's `gsApplyForLease`/`gsSignLease` path and registers in the claims
  matrix as `char:h##` (possessable target, owner-scoped).
- `creation.json` is the contract; feed events use the shared vocabulary —
  `hire` requests report `in_review`/`resolved`/`refunded`, and the `cast`
  event kind (added to feed.json in v7) marks arrival on The Wire.
- Screening executes the real engine in-demo (`world/screen.js` script tag);
  at merge the same call runs server-side before billing. `resubmit_n` and
  `appeal_of` are passed in `req.player` — the game queue must honor the
  different-reviewer route (moderation.json `appeal-resubmit`).
- Demo account is Resident-tier (2 slots) purely so the flow is exercisable —
  slot-cap math lives in creation.json, not the page. When the bridge is up,
  `gsHireSlots(pid)` supplies cap/used and the badge flips to `live board`.
- Draft autosave is localStorage-only in the demo (`rw_create_draft_v22`); at
  merge the draft can be server-side per-account, keyed on the same fields
  (no screened text is stored anywhere it isn't already submitted).
- v91 seam contract: the page reads `gsJobBoard` / `gsHireNameCheck` /
  `gsHireQuote` / `gsHireSlots` / `gsVacantUnits` / `gsHiredRoster` /
  `gsExplainRequest`; its only writes are `gsSubmitRequest` (the filing)
  and `gsCancelRequest` (the withdraw). Off-bridge the simulated pipeline
  runs as contract reference; the demo's job/home mirrors are
  hand-maintained from jobs.json + housing.json and must be resynced
  when those files change (the audit `creation` gate catches drift on
  employer/role/wage/address/rent).
- Deposit shortfall: (superseded by v91's hire package — the production
  seam waives the deposit and pro-rates the first month; a re-house
  later is a normal second lease with a real deposit).
- v63 queue: `rw_create_app_v26` is a device-local mirror of review state
  (+ busId when filed live); at merge the server-side application record
  is authoritative — the card reads status, never writes it. Withdraw
  maps to `gsCancelRequest` (pre-billing, so always free); the feed line
  stays.
- v63 `goes_by` joins the screened surface — the review desk sees it as a
  naming string like `name` (moderation §4 human pass covers it).
- v77 seats: `BLOCK_CAP` is a demo constant for open decision §9.5 — at
  merge the card count comes from the roster surface (extend
  `gsHireSlots` or a sibling read); the waitlist spot is a device-local
  mirror (`rw_create_wait_v25`), and the seat-offer accept maps to the
  same hire-request activation. Seat offers expire server-side; the
  48 h clock is a claim window, not a purchase.
- v77 sketch: `drawSketch` is a demo renderer keyed on the same three
  record_schema.look fields the real renderer will read — keep the
  mapping table (build → proportions, palette → jacket, signature →
  mark) as the contract when the world renderer picks it up.
- v77 multi-hire: the stranger rule is honesty copy only — no new
  record field. At merge, surface-relationships may list the owner's
  other hires as strangers; never as contacts, allies, or alibis.
