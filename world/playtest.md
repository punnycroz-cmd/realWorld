# Playtest Harness — "Real World / The Mission" (world v107)

How a human playtests this build today, and how findings get home. Machine-readable
scenario contract: `world/playtest.json`. Runnable harness: `world/playtest.html`
(open it directly — file://-safe, no server, no build step). Machine boundary
gate: `node world/audit.js` (see §3a).

## 1. What this harness is (and is not)

The demo surfaces (`feed`, `request`, `mod-console`, `create`, `board`,
`history`, `onboarding`, `lease`, `thinai`, `cast`, `crowd`, `directory`,
`timeclock`, `market`, `storefront`, `regulars`, `grievance`, `screen-lab`)
plus `screen.js` are **local simulations of the product contracts** —
the request pipeline, the moderation queue, the spectator feed vocabulary. A
playtest here validates *content, copy, flow, and the locked boundary rules*.
It does NOT validate:

- **LLM behavior** — the persistent-society sim is STOPPED by standing order;
  nothing here exercises a real character brain. "Would the AI render this well"
  is out of scope and always will be in this harness.
- **Real payments, real concurrency, real persistence** — credits are simulated;
  multiplayer conflict is simulated; state lives in the page.
- **Game-track plumbing** — `gsViewerState`/`gsRequest*` live on sf/game-systems;
  a failure that only exists at merge is a merge note, not a playtest finding.

What IS under test — the five invariants, checked on every scenario:

1. Possession ban on C1–C8 (incl. the landlord) — no surface may offer it.
2. Moderation scope = player request text + legal backstop. No "report the AI".
3. Parody business names only; real streets/landmarks are fine; 9xxx addresses.
4. Denied requests: neutral "request not approved" + full refund, always.
5. Prices = monetization-plan §2 PROPOSAL verbatim. Any invented price = finding.

## 2. Roles

One person can wear every hat; four real testers is the intended shape.

- **Spectator** — PT1, PT6, PT8, PT31, PT32. Free-tier only; never touches a wallet.
- **Player** — PT2, PT3 (first half), PT4, PT5, PT9, PT23, PT30, PT33. Files requests, hires a character.
- **Reviewer** — PT3 (second half), PT4. Wears the mod hat; judges queue honesty.
- **Facilitator** — PT7 + session stewardship. Owns the boundary checklist,
  runs the machine audit (PT21, PT24/PT25 last steps), merges cohort reports (PT22),
  audits the harness itself (PT35), clocks time-to-first-request, and harvests findings.
  PT36 (lease v3) wears both hats — tenant mechanics first, facilitator gate last.
  PT37 (thinai v3) is facilitator + h01's owner — presence, salience, compute split, kit, archive.
  PT38 (bibles v42) is a facilitator audit — wants on three clocks, the private
  ledger, the honesty register, and the bible gate.
  PT39 (crowd v4 / ambient week, v43) is a facilitator audit — the six work
  zones, signatures + variants on all 20 ambients, claimable resources, and
  the extended crowd gate.
  PT40 (storefront layer, v44) is a facilitator audit — 20 door-tier
  storefronts, condition-resolved A-frames, flyer boards as rumor surfaces,
  and the extended biz gate.
  PT41 (application layer, v45) is a hired player + facilitator audit —
  16 live openings' ask/screen/trial/decline cards, 8 housing rows,
  channel agreement with the market layer, and the new apply gate.
  PT42 (request v46) is a player + facilitator audit — the approve-modified
  offer (trim-only, decline = full refund), honest upfront charge, queued
  hold clock + expiry, scheduled exclusives firing, and the hire route.
  PT43 (wire v4 recap layer, v47) is a spectator audit — the day-so-far
  card, missed bar, declared-cost chips, and the wire gate's v47 keys.
  PT44 (archive v4 week layer, v48) is a spectator + facilitator audit —
  week grid = day filters, day walk, around-that-time, outcome.by.
  PT45 (create v4 people layer, v49) is a hired player + facilitator
  audit — the taken-names fold agreeing with the live check, the crew
  card and building card resolving real cast/ambient rows, the named
  landlord of record, the landing window, and the registry entry.
  PT46 (moderation v50) is a reviewer + facilitator audit — separator
  evasion landing the real charge, the accent fold, hyphenated-text
  near-misses, corpus 94/94, and the console's rq-1044 live trace.
  PT47 (harness v51) is a facilitator audit — the session debrief card,
  cohort coverage + never-verdicted list, owner-routed inbox notes,
  the [ / ] scenario walk, and the harness gate's v51 marks.
  PT48 (onboarding v4, v53) is a returning tester + facilitator audit —
  the Archive as tour beat 7, the queued ask filed at −15% and lapsing
  to 'queued request expired before activation' + full auto-refund, the
  watch-path rhythm line, and the hired-return thin-AI / no-nag clause.
  PT49 (lease v4 paper layer, v54) is a hired player + facilitator
  audit — mid-month proration at signing, the roommate amendment doc,
  the two repair clocks with an SLA-breach line, the fixed-term break
  fee, and the 21-day deposit clock as a separate itemized event.
  PT50 (thinai v4 coverage layer, v55) is an ops-minded facilitator
  audit — the never-freeze routine ladder dropping rungs live
  (authored → template → home·idle), the flap-guard deadband
  (<60/≥70), the 30-min degrade dwell, and the extended thinai gate.
  PT51 (bible v56 depth pass) is a spectator + facilitator audit —
  the three new card blocks (money signature, unwatched hour, edges),
  the new fixed bible sections in order before the briefing-safe
  block, and a leak sweep on all new copy.
  PT52 (crowd v5 marine layer, v57) is a spectator + facilitator
  audit — the fog depth profile with its burn-off hour and all-day
  mode, wind as a texture condition, season shades under the day
  shades, parliament-in-exile, and the crowd gate's fog/wind +
  all-20-fog checks.
  PT53 (the House Knows, v58) is a spectator + facilitator audit —
  the regulars layer across all 20 door venues: standing orders,
  held seats, name basis, tabs in game dollars, windows that agree
  with posted hours, and the surface-knowledge bar on every line.
  PT54 (the Ear, v59) is a spectator + facilitator audit — the
  grievance layer: the five-rung ladder, per-employer/per-building
  ears, the two offstage parody tables at rung 4, door-not-name feed
  shapes, and the griev gate's coverage + surface-bar checks.
  PT55 (the Counter, v60) is a payer audit — request.html's live seam
  (mirror/live badge, capability-checked gsRequestSubmit write path),
  the free pre-flight wording check (same screen, before money moves,
  never a gate), and the per-request receipt drawer with its rq- ref.
  PT56 (the Director's rail, v61) is a spectator + facilitator audit —
  the director preview bar (cam presets marking, never filtering;
  follow-cam with "public whereabouts only"), the replay scrub over the
  wire's own events, the gsExplainRequest/gsOccupancy live reads, and
  the no-purchase-affordance rule on a spectator surface.
  PT57 (the Archive v5 reading layer, v62) is a spectator audit — the
  device-local shelf (rw_archive_shelf pins, copy-shelf transcript with
  the badge line, honest orphan count), the seen-together pair view
  (structural co-presence, never a relationship claim), person
  'seen with' chips + first/latest jumps, and the venue rhythm strip —
  all projections, nothing world-touching.
  PT58 (Join the Cast v5 — the queue & keys layer, v63) is a player
  audit — the pending application that keeps its place across a closed
  page (rw_create_app_v24 queue card, nothing-charged-while-pending),
  withdraw as a real never-billed path, the optional 'goes by' block
  name (screened + collision-checked), and the keys card's day-one
  logistics that never script the day.
  PT59 (Mod Console v3 — the roster & record layer, v64) is a reviewer
  audit — the flag roster's whole-book account standing (tier effects,
  next decay dates, the score-9+ owner docket that recommends and never
  executes), live re-sort on a tier-crossing legal confirm, and the
  'export ledger records' flow that emits canonical mod_decision records
  with neutral feed lines while the seeded baseline stays aggregate.
  PT60 (harness v65) is a facilitator audit — the finding-template
  dropdown seeding the five boundary breaks without logging on its own,
  the 'hide finished' rail filter composing with the smoke set, and the
  'Copy handoff' resume block for tester-to-tester relay.
  PT61 (drama board v66) is a showrunner-side audit — the fuse
  interference matrix covering all 15 pairs exactly once, per-seed
  suspicion ceilings at every rung, the comedy-duty roster whose only
  mechanism is a review flag, and the dormant-only residue nursery,
  checked against the §19 legality checklist.
  PT62 (onboarding v5 — the eligibility layer, v67) is a first-session
  audit — the one-question age band fronting every paid stage but never
  the feed or the tour, the under-13 'watching account' with no packs or
  asks and honestly relabeled checklist items, the under-18
  spending-limits disclosure that quotes no invented figure, and the
  adults-only rewarded-ads line at plan §2.7 verbatim.
  PT63 (lease v68 — the hand-off layer) is a tenant/admin audit — the
  guarantor path on a screening near-miss (2.0–2.5× rent; liable, never
  a tenant, never a feed event), notice service records (clocks run
  from service, not the posting), the itemized move-out walkthrough
  that every deduction must cite, and receipts that agree with the
  ledger.
  PT64 (thin-AI v69 — the long-outage layer) is an ops audit — wake
  parity (the first beat back continues the handoff note's doing;
  place/ledger/needs carry over), outage rotation on the deg_min
  credit ledger (a dwell-eligible bench swaps up within Δ≤1 salience —
  a swap is not a recovery), scene-yield on a degraded main, the
  closed co-star ask-class taxonomy (be-present / hold-space /
  walk-with / carry-item), the phrase-kit repetition guard, and the
  0% blackout floor that reads as a quiet day, never an outage
  screen.
  PT65–PT71 audit the per-version surface layers (menus, exits, the
  Book, wire v6, archive v6, create v77, mod v78). PT72 (harness v76
  relay layer) is a facilitator audit — the revisit flags, the
  directional Regressions card, the run sheet, and the doubly-filtered
  scenario walk. PT73 (onboarding v6) audits the house-&-other-hands
  pass — admin-transparency tour beat, the S4f coexistence lesson,
  surge disclosure ordering, and the settle-time ownership arc.
  PT74 (lease v82) audits the doorstep-&-deed layer — entry notices as
  file-only docs, sale-with-tenant carryover, the months-10–12 renewal
  window, returned payments that leave the ladder untouched, and the
  guarantor release request/decide pair.
  PT75 (thin-AI v83) audits the fallback-surface layer — the closed
  posture matrix (unaffected/hold/static), routine-fit vs off-routine
  asks on a degraded main with locked vocabulary, the held press
  backlog and its ≤1/daypart recovery trickle, and the deterministic
  ±15-min day-hash jitter on cell edges.
  PT76 (crowd v85) audits the company & courtesy layer — the
  kind×daypart social-unit mix with lone-only pre-dawn hours and
  family-cluster safeguards (kid-backpack never lone, never bars), the
  17 counter-courtesy beats gated on state + extra presence + cooldown,
  and the crowd gate's v85 mirror/integrity checks.
  PT77 (supply v86) audits the back-door layer — the 19 offstage
  parody suppliers and their 44 delivery runs, the Thursday flyer
  circuit, door coverage with Valencia Growers's self-supply
  exemption, the [open-3h, close] window rule, and the supply gate's
  mirror/coverage checks.
  PT78 (commute v87) audits the getting-there layer — the 22 routes
  binding registry homes to jobs.json employers, the six modes
  (walk/bike/muni/muni_walk/loop/stairs), the 10 shared-route overlaps
  as openable conditions, weather deltas as modal suggestions, minors
  never routed, and the commute gate's mirror/integrity checks.
  PT79 (request v88) audits the real bus seam — gsSubmitRequest as the
  canonical write (gsRequestSubmit legacy alias) with bus spec keys
  and event→street_event mapping, the returned record as truth
  (denied short-circuits before any charge), board/calendar/slots/
  price-quote reads, and the 'booked' feed chip. Reference stub +
  13-check run: devtools/smoke_request_v88.js.
  PT80 (wire v89) audits the real wire seam — The Wire reads the bus's
  own entry shape (top-level mentions, n as seq, day → multi-day
  separators, attempt on denials, 'booked' chip), syncs via
  gsWireSince / gsWirePage, renders the permit board and co-sessions,
  counts the withheld honestly, and writes only the viewer's own pin
  (gsWireFollow). Reference stub + 15-check run:
  devtools/smoke_wire_v89.js.
  PT81 (archive v90) audits the real archive seam — The Archive reads
  game-v14 day-objects (id→day index for w- ids, person index from
  mentions, attempt on denials, honest kind-growth chips, n tiebreak)
  and 'catch up' merges new rows by id, additive only, no polling.
  Reference stub + 20-check run: devtools/smoke_archive_v90.js.
  PT82 (create v91) audits the real hire seam — Join the Cast files the
  bus's own shape (gsSubmitRequest kind 'hire', target = unit id, full
  params), reads gsVacantUnits doors and the gsHireQuote personnel
  card, carries the hire-package truth (deposit waived, first month
  pro-rated to moveInDate), shows real deny codes, parks live filings
  in the naming lane with the bus record id — never a fake approval —
  and withdraws through gsCancelRequest. Reference stub + 27-check run:
  devtools/smoke_create_v91.js.
  PT83 (mod v92) audits the real review seam — the Mod Console queue IS
  gsReviewQueue() (bus records mapped verbatim, bus-minute waits, TTL
  chip), decisions write through gsReviewResolve/gsEscalateLegal with
  {by,code,modifyMin} and report the bus's real landing, the
  same_reviewer refusal is honored twice (UI + bus), metrics read
  gsModMetrics, flags read gsFlagStatus/gsRepLedger, and the character
  card is the gsPossessionBriefing whitelist object itself. Reference
  stub + 19-check run: devtools/smoke_mod_v92.js; the classifier drift
  gate is executable at devtools/screen_drift.js (23 port gaps reported).
  PT84 (harness v93) is a facilitator audit — the rail's surface filter
  (SURF-derived options, composes with smoke + hide-finished, persisted),
  per-finding triage status (open/fixed/wontfix/deferred — persists,
  rides both exports, gates the handoff list), the per-finding
  [world-playtest-finding] copy block, the step n/a sweep, and the
  harness gate's v93 marks (at key rw_playtest_v107 since v107 — the
  key rolls whenever persisted session state gains fields).
  PT85 (drama board v94) is a showrunner-side audit — drama.json at
  schema drama-v6 carries the cooling grammar (rung descent, afterglow,
  no refund, surfaced never cools), the double-surface contingency
  (canon + merge-not-stack + protections never mask), the fair-misfire
  register (whisper-only, retroactive fairness, never aimed), and the
  five-posture vocabulary (prefer/hold/shed/observe/recovery); the
  pressure catalog runs P-01–P-26; drama.html renders all four new
  sections; §19 legality checked line by line.
  PT86 (onboarding v95) walks the seventh pass — the wallet card's
  credit-rules line (never run out / never cash out / never move
  between accounts), the stated-once standing orders (Resident
  $4.99/mo · 600 cr, Director $11.99/mo · 1,500 cr — §2.5 verbatim, a
  one-shot idempotent stipend preview, structurally absent for u13),
  and the S7 first visit: a guided 22-cr 15-min possession off the
  first-day card, both exits (step out / hard cap) handing back
  mid-motion with no refund promised, one-time lesson then settle.
  PT87 (Rent Book v6 / leases v96) walks the counter-paper layer —
  lease assignment behind the clean-ledger gate (deposit carries,
  outgoing liability ends at signature, file-only), buyout offers
  (active-only, tenant decides, free decline + 30-day re-offer lock,
  BUYOUT credit code on accept), prepaid rent (3-month cap, draws down
  on the 1st before any balance exists), and the one-per-tenancy
  rental history letter.
  PT88 (Understudy v7 / thinai v97) probes the encounter layer — the
  nod economy when two thin pawns share a cell (gesture register,
  cap unchanged, nothing persists), a possessed player pressing thin
  (kit → deflect → silence; "are you AI?" resolves like any other
  question; attention never wakes a mode), and the request split:
  world-bound asks (rain) deliver at 0% service while brain-bound
  scene asks decline `resolved · declined` + 50% refund.
  PT89 (The Company v98 / characters.json v98) walks the receiving
  register — the two new bible sections: **Weather** (fog/heat/rain
  read through each main's own work, body, and routine) and **Being
  helped** (how each of the eight takes help, care, and gifts — the
  complement to a caretaking cast). Both render on every cast.html
  card, sit between Repairs and the briefing-safe block in all eight
  bibles, mirror as `weather`/`helped` in characters.json, and stay
  inside the observable-safe sweep — orbit, never seed.
  PT90 (The Crowd v99 / crowd.json v99) probes the bench layer — the
  pull protocol for borrowing a named ambient (15–90 min loans, ≤3/day
  each, ≤2 concurrent, ≥60 min cooldown, one-step bounds, in-role only,
  sleep/home/transit never, minors never) and the coverage map: what
  each post reads while borrowed (understudy extra / honest sign /
  honestly empty post; minors' kind is `pack` — a refusal, not a
  surface). The bench panel in crowd.html shows live pullability per
  ambient; the loan never appears on the wire — the coverage read is
  the whole spectator-facing trace.
  PT91 (The Permit Wall v100 / permits.json v100) walks the paper
  layer — the framed paper behind every door venue's counter
  (business license, health score card, occupancy, plus liquor /
  entertainment / sidewalk papers where the rules allow) and each
  door's lineage: former tenants plus the `ghost_sign` the facade
  still carries. Doors only — the two no-wall stands read "no wall
  to paint"; civic agency names stay real as facts; pending is a
  taped-up receipt, never a violation; papers carry no people and
  no money.
  PT92 (The Fridge Door v101 / homes.json v101) walks the household
  layer — what each actively-leased registry unit is like inside
  (occupants, shape, rota, kitchen, quiet, guests, kit) plus one
  pinned fridge-note voice line per named household; the ambient
  household honestly carries none. Vacant listings show texture, never
  people; the perks table covers every jobs.json employer once —
  texture, never compensation; the ambient ring stays a direction.
  PT93 (The live session layer v102 / request.html) audits the second
  bus pass — a bridged request card is driven by the bus end-to-end:
  gsRequestMeter mirrors status verbatim (own queue position that can
  only shrink, the review SLA clock, the live session's remaining /
  spent / low-credits), gsCancelRequest and gsAppealRequest are the live
  write paths, gsWatchAd/gsAdStatus run the wallet's rewarded ads,
  gsPossessionBriefing serves the §7 whitelist live, gsConflictRules
  explains the classes, and gsAppealStats surfaces in aggregate only.
  PT94 (The record layer v103 / wire.html) audits the last four wire
  endpoints — gsWireFollows pin read-back (adopt-only, never deletes a
  viewer's pin), gsWireDays archive depth ("N days on record → The
  Archive"), gsWireVocabulary status coverage in the day card, and
  gsWireAudit's self-check run on demand when the card opens.
  PT95 (The absence + lifecycle layer v104 / archive.html v8) audits the
  two new archive projections — the gaps view (every ≥2h uncovered
  stretch, same GAP_MIN rule as the day view's inline markers, boundary
  rows linked, nothing interpolated) and request trails (one card per
  req id, the wire's own statuses only, open trails first, 'not
  approved' can be the last step) — plus the settled-the-talk reverse
  edge on records a rumor's outcome.by points at.
  PT96 (The desk's answer layer v105 / create.html v8) audits the
  creation flow's refusal surfaces — the repair bench (one card for
  every refusal path, FIELD_FIX chips to the owning step, persisted
  rw_create_return_v105), the second look (one appeal on text-judgment
  refusals only, gsAppealRequest live, the demo desk never fakes a
  reversal, appeal_final on identical text), and the live desk-status
  resolution (gsExplainRequest pull on render + 'check the desk',
  approved → approval tail, denied → repair bench, closed → honest
  line).
  PT97 (the display-filter bench v106 / filter-lab.html) is an
  owner-side audit — nine seeded cases re-screen live through
  RWScreen.screenRequest at render (no stored verdicts), each flagged
  case previewed under all three display options (A redact / B withhold
  / C quarantine) with a survival matrix and an exportable memo JSON;
  the decision stays OPEN — the lab never marks a winner.
  PT98 (harness v107) is a facilitator audit — the rail search box
  (id+title+persona, case-insensitive, composes with smoke /
  hide-finished / surface, `/` focuses it) and the session planner:
  a minutes box filled with an ordered pick-list — revisit-flagged →
  unfinished → cold (never verdicted by anyone, imports included) →
  fresh — that stops before overflow, keeps an only-pick overrun with
  an honest 'over by ~N min' line, honors the surface filter, never
  picks a done scenario, and copies out as a [world-playtest-plan]
  block; the harness gate's v107 marks at key rw_playtest_v107.

## 3. Running a session

1. Open `world/playtest.html` in any browser. Enter tester name + role.
2. Pick a scenario. Read persona + goal aloud — the tester *is* that person.
3. Open the listed surfaces with the ▶ buttons (embedded viewer) or "open in tab".
   Prefer the embedded viewer so instructions and surface share one screen.
4. Tester does the step. Facilitator marks each checkpoint PASS / FAIL / N/A and
   types a one-line note on anything interesting — including passes that felt bad.
5. Anything wrong → **Log finding** with a severity (rubric below). Findings beat
   checkpoint notes; a failed checkpoint without a finding is a missed bug.
   Findings are auto-tagged with the open scenario (`ref: PT#`) — logged from
   the scenario you were in when you noticed it.
6. If PT8 ran, the facilitator types the measured minutes into the **ttfr min**
   field in the header; it lands in the report as `time_to_first_request_min`.
7. End of session: **Export report (JSON)** → file lands next to the harness, and
   **Copy report (Markdown)** → paste into the triage note / inbox reply.
8. Multiple testers? **Import report…** loads earlier exports into the current
   session (v23): a cohort panel lists every imported session, a per-scenario
   verdict matrix, and **disagreements** — checkpoints where two sessions
   verdicted differently are flagged, never averaged. Findings merge with
   attribution. The Markdown export includes the cohort summary.

Session state persists in localStorage — a crashed browser loses nothing.
**Reset session** clears verdicts, findings, and imports for the next tester.
The **smoke set only** checkbox filters the rail to PT1·PT4·PT7·PT21.

v37 harness affordances (PT35 exercises all of them):

- **Deep links** — `#pt=<id>` in the URL boots straight into a scenario;
  picking one updates the hash, so a facilitator can paste a tester a link
  that lands on the right card. Unknown ids fall back to the picker.
- **Per-scenario clock** — the rail shows `Nm spent` per scenario and the
  report carries `session.time_per_scenario` (minutes, one decimal). It
  counts time-open only — a facilitation aid, never a score.
- **Progress line** — under Scenarios: `N of M checkpoints · ~K min left`
  (smoke filter narrows the denominator honestly).
- **Keyboard map** — `?` opens the key card; `j`/`k` move a checkpoint
  cursor (clamped), `p`/`f`/`n` verdict it, `o` opens the first surface,
  `esc` closes the card then clears the cursor. All keys are inert inside
  inputs/textareas.
- **Step-ref findings** — the findings form has a step dropdown; refs read
  `PT#` or `PT#·sN` and ride both exports.
- **Copy inbox note** — emits a `[world-playtest]` block (header + blocker/
  major findings only), the paste-ready form of the §5 triage line.
- **Autosave tick** — the header flashes `autosaved` on every write, so a
  tester can see persistence working instead of trusting it.

v51 harness affordances (PT47 exercises all of them):

- **Session debrief** — a five-prompt card between findings and export,
  one row per §6 watch-list item. Each answer is a verdict chip
  (n/a / clear / stumbled / blocker) plus a one-line note, persisted in
  the session and exported as `session.debrief` + a `## Debrief`
  section in the Markdown report.
- **Cohort coverage** — under the verdict matrix, a Coverage table lists
  every scenario as `N/M` checkpoints verdicted by *anyone* (current
  session + imports) with median time-open vs the estimate; below it, a
  `never verdicted` list names the exact refs no session has touched.
- **Owner routing** — findings carry an owner (world / game-systems /
  art / marketing, default world). The inbox note groups blocker/major
  findings under owner headers — the §5 triage paste arrives pre-sorted.
- **Repro links** — every finding row has a `link` button copying
  `playtest.html#pt=PT#` — the deep link back to the scenario that
  produced it.
- **Scenario walk** — `[` / `]` move to the previous / next scenario in
  the rail order (clamped, honors the smoke filter); the deep-link hash
  updates on each hop.

v65 harness affordances (PT60 exercises all of them):

- **Finding templates** — a `template…` dropdown in the findings form
  seeds severity + title + detail + repro for the five boundary breaks:
  possession affordance on a main, real business name, price off the §2
  PROPOSAL, deny wording, AI-moderation surface. Templates seed only —
  nothing is logged until `Log finding`, and the seeded text stays
  editable.
- **Hide finished** — a rail checkbox drops scenarios whose every
  checkpoint carries a verdict; it composes with `smoke set only`
  (neither filter eats the other's meaning), narrows the progress line's
  denominator honestly, and persists in session state.
- **Copy handoff** — emits a `[world-playtest-handoff]` block for the
  next tester: build, session minutes, the exact scenario to resume at,
  per-scenario remaining counts matching the rail's N/M math, every open
  finding at any severity with refs and owner routing, and ttfr when set.

v76 harness affordances (PT72 exercises all of them):

- **Revisit flags** — a `⚑` toggle on every rail card marks a scenario
  to come back to (`S.flags`, persisted, never a verdict). Flagging does
  not select the card. Flagged ids ride the handoff note under
  `flagged for revisit:` so the relay survives a tester change.
- **Regressions card** — the cohort panel gains `#regr`: refs verdicted
  pass by an imported session but fail in the current session list as
  `regressed`; imported-fail → current-pass list as `recovered`.
  Directional (current build vs history), keyed on checkpoint refs,
  never averaged — the plain Disagreements card is unchanged. The same
  split rides the Markdown export's `## Cohort` section.
- **Copy run sheet** — `exSheet` emits a `[world-playtest-runsheet]`
  Markdown block for the filtered scenario list: header + build/estimate
  line, then per scenario the persona, goal, and `- [ ]` lines for every
  step and checkpoint. Blank by design — a paper artifact for the next
  session, not a report. Honors smoke + hide-finished, which now also
  compose on the `[` / `]` walk (previously smoke-only).

v93 harness affordances (PT84 exercises all of them):

- **Surface filter** — a `surface` dropdown in the rail lists every
  declared surface (options built from `Object.keys(SURF)` — it can
  never cite a phantom). `S.surf` narrows the rail to scenarios that
  touch the pick, composing with `smoke set only` and `hide finished`;
  the progress line, the `[` / `]` walk, and Copy run sheet all honor
  the narrowed list. Persisted; built for post-change regression passes.
- **Finding triage status** — each logged finding carries a status
  chip (`open` / `fixed` / `wontfix` / `deferred`, default `open`),
  persisted on the finding and exported in JSON + Markdown. `fixed` and
  `wontfix` drop out of the handoff's open-findings list; `deferred`
  stays listed but labeled. The statline reads `findings: N (M open)`.
- **Copy finding** — a `copy` button on every finding row emits a
  `[world-playtest-finding]` block (severity, ref, owner, status, title,
  detail, repro, `#pt=` deep link) — the single-finding paste for
  routing to an owning track without exporting the whole session.
- **n/a step** — a toggle on each step header sweeps every checkpoint
  in that step to n/a; pressed again on an all-n/a step it clears them.
  Mixed steps go all-n/a; other steps are never touched.

v107 harness affordances (PT98 exercises all of them — the storage key
rolls to `rw_playtest_v107` because session state gained `S.q` and
`S.planMin`):

- **Rail search** — a `search` box filters the rail on scenario
  id + title + persona, case-insensitive (`S.q`, persisted). It
  composes with smoke, hide-finished, and the surface filter, and the
  narrowed list is the one the `[` / `]` walk and Copy run sheet use.
  `/` focuses the box from anywhere outside a form field.
- **Session planner** — a `plan` minutes box + `pick my session`
  button builds an ordered pick-list into a card above the rail.
  Priority: revisit-flagged → partially-verdicted this session →
  cold (no checkpoint verdicted by anyone, imported reports included)
  → fresh; ties hold scenario-number order. The plan fills the box in
  order and stops before the first overflowing pick — except when the
  first pick alone overflows, which is kept and labeled
  `over by ~N min`. Fully-verdicted scenarios are never picked; ids
  always come from PTS (the planner can shrink the list, never invent
  it). With a surface filter set, only scenarios touching that surface
  are pooled — a regression pass plans inside its surface. The card
  re-renders as verdicts land, so the plan is always current.
- **Copy plan** — emits a `[world-playtest-plan]` block: build, box
  minutes, scenario count, and one line per pick with estimate +
  reason tag + title. The facilitator's paste into a session invite;
  it carries no verdicts.

v66 content under test (PT61 exercises it): the drama-direction board's
new permission structures — fuse interference matrix (§31, all 15 pairs
carry exactly one of interlocked/adjacent/independent/masked), audience
suspicion calibration (§32, per-seed per-rung ceilings), the comedy-duty
roster (§33, the `comedy_drought` flag is a review artifact, never a
world event), and the residue nursery (§34, dormant-only candidates N1–N4
promoted only at a declared season boundary). drama.html stays internal
— PT61 runs it through `audit` surface + a file:// eyeball, and it is
deliberately absent from the harness's own surface dropdown.

v67 content under test (PT62 exercises it): the onboarding flow's
eligibility layer — the S2a age-band card (under 13 / 13–17 / 18 or
older / rather not say) that fronts the wallet and the asks via
`normalizeStage()` while gating nothing free; S3u 'the watching
account' for under-13 (no packs, no asks, checklist relabeled
'spectator account — watching only', S5 drops the hire button); the
under-18 spending-limits disclosure (limits apply, no figure quoted);
and the adult-only rewarded-ads line at plan §2.7 verbatim (2 cr/view,
5/day, opt-in, never in the stream) with a demo +2 cr affordance and
N/5 counter.

A full pass (PT1–PT8) is ~2.5 h. A smoke pass is PT1 + PT4 + PT7 + PT21
(~50 min) — free-tier, every deny path, the boundary audit, and the machine gate.

## 3a. The machine audit — `world/audit.js`

PT7 is a manual sweep; PT21 runs the machine-checkable half as an executable
gate. From the repo root:

```bash
node world/audit.js          # human-readable, exits 1 on any FAIL
node world/audit.js --json   # machine report: build tag, timestamp, per-gate status+hits
```

Thirty gates: **corpus** (screen.js × screen-corpus.json — engine version,
expected-vs-actual per case, ≥3 cases + near-miss per non-pass code), **names**
(no real SF businesses in world content), **addresses** (residential = 9xxx),
**prices** (proposal §2 numbers only; on in-world surfaces only deed fees may
bill credits), **copy** (deny wording "request not approved"; no
gambling/dark-pattern vocabulary), **internal** (internal-tier surfaces carry a
never-ship marker), **mirror** (playtest.html inline data == playtest.json,
field-level drift reported as `PT# drifted: <fields>`), **coverage** (every
surface file exists; no untracked demo pages), **drama** (seed-registry
invariants + internal-only), **onboard** (onboarding.json ↔ onboarding.html
mirror, required honesty strings, dark-pattern vocabulary sweep), **lease**
(leases.json ↔ lease.html: storage key, demo states ⊆ declared states,
honesty strings, every wire push on a neutral feed template, licensed-landlord
eviction is file-only — no evictConfirm path from the landlord mode),
**thinai** (thinai.json ↔ thinai.html: storage key, inline MODES matrix matches
the json pawn modes, every wire push on locked feed vocabulary, handoff-note
writer carries no forbidden field, degrade mains-only, ambients always thin),
**bible** (characters/*.md carry the fixed 27-section order with SECRETS last,
five dated backstory beats each; characters.json mirrors roleplay/briefing
fields + v28 backstory/room/strangers; cast.html CAST ids and card fields
agree), **crowd** (crowd.json ↔ crowd.html mirror — zones, budgets, shades,
flow edges, micro-events, greeting pairs, scenes; extras carry no
identity-shaped field; minors greet in packs only; overnight
allow_deserted protected), **biz** (businesses.json ↔ directory.html:
BIZ/WEB blocks mirrored, every card exists and none orphaned,
tier/affordance/hours/staff sanity, web edges resolve to real venues,
loan edges always secret-flagged, reserved entries stay empty, the
public-clearance redaction path exists for secret edges), **market**
(market.json ↔ market.html deep mirror; every churn row resolves to a
live jobs.json opening; channels declared; ladders resolve to real
employers; vacancy/move-in tiers and rents match the housing ladder;
no credit figures in the layer), **request** (requests.json ↔
request.html: action ids, class rates, pack ladder + first-purchase
bonus + $200 cap + 2/5/25 ad numbers verbatim from the plan PROPOSAL,
72 h appeal window with the not-appealable list honored and aggregate-
only feed visibility, co-sponsor cap 4 / compatible / same-price,
required honesty strings, dark-pattern vocabulary absent, screening
routed through screen.js — never a stub), **wire** (feed.json ↔
wire.html: every event kind/status has a chip style, honesty strings +
live seam + v33 affordances present, demo seeds mirrored, no button
offers a world-touching verb), **archive** (history.json ↔ archive.html
deep mirror — DEMO_DAYS/THREADS eval'd and field-compared; thread
registry ↔ event tags agree with ≥2 members each; rumors never
person-sourced; kinds/statuses inside feed.json vocabulary; honesty
strings + v34 affordances present; no world-mutation call on the
surface), **creation** (creation.json ↔ create.html: JOBS/HOMES/LOOK
eval'd and field-compared to jobs.json/housing.json/record_schema;
filled posts visible-but-unselectable; deposit 1× / 0.5×-room rule +
stated payment plan on shortfall; payday cadence; bill-on-approval;
live-seam reads gsJobBoard/gsHireNameCheck/gsHireQuote/gsHireSlots
present and no mutation call on the surface; draft key + deny codes
agree), **mod** (taxonomy agreement, corpus↔lab case mirror, CHARS
whitelist, v36 affordances), **harness** (playtest.json ↔ playtest.html:
LS key + build tag agree with the contract version, every
harness_ui_vNN mark present, scenario integrity — unique PT ids,
declared surfaces only, ≥1 checkpoint per step, every declared surface
touched by ≥1 scenario — and the finding-surface dropdown ⊆ declared
surfaces), **regs** (regulars.json ↔ regulars.html: REG mirror, every
door venue covered, standing orders/held seats/name basis, windows
agree with posted hours, surface-knowledge bar), **menus** (menus.json ↔
menus.html: MENUS mirror, doors only, board-price agreement, game
dollars only), **supply** (suppliers.json ↔ supply.html: SUP mirror,
door coverage incl. the self-supply exemption, [open-3h, close] windows,
no prices), **apply** (applications.json ↔ apply.html: live-opening
coverage, channel agreement with the market layer, decline voices, game
dollars only), **griev** (grievances.json ↔ grievance.html:
employer/building coverage, the five-rung ladder, door-not-name feed
shapes, surface bar), **exits** (exits.json ↔ exit.html:
employer/building coverage, door-not-name feed shapes, game dollars
only), **book** (bookings.json ↔ book.html ↔ request.html BOOKW: no
repricing, feed-vocabulary reuse, seeded windows), **commute**
(commute.json ↔ commute.html: route/employer/home integrity, minors
never routed, weather deltas are suggestions, no prices).

REVIEW hits are contexts a regex can't adjudicate (e.g. a parody-name mapping
table that legitimately cites the real name). They print with `file:line` and
are eyeballed by a human — REVIEW alone does not fail the gate. Only FAIL sets
a nonzero exit code, so the audit can hang on a hook or CI step later.

## 4. Severity rubric (mirrors playtest.json)

| Severity | Use when |
|----------|----------|
| blocker | Boundary broken: possess-a-main affordance, real business name, leaked secret, scripted-AI affordance — or a surface is unusable. **Stop; report immediately.** |
| major | Core flow needs a workaround, or copy contradicts a locked rule (price, refund, review promise). |
| minor | Works, but a real user stumbles: confusion, dead-end, cosmetic defect. |
| nit | Typos, alignment, tone drift. Batch them. |
| question | Not a bug — an open decision the test surfaced (e.g. feed display-filter A/B/C). Route to the owning track, don't silently decide. |

## 5. Triage — where findings go

| Surface / area | Owner |
|---|---|
| All `world/*` surfaces, content, copy, scenario data | **world** (this branch) |
| Queue data model, classifier plumbing, `gsViewerState` vocabulary, ledger writes | **game-systems** (at merge — file as merge note) |
| Neighborhood rendering | **art** (out of scope here) |
| Public/site copy contradictions | **marketing** (flag via inbox) |

Report format: the exported JSON conforms to `playtest.json →
session_report_schema`. Facilitator appends a `[world-playtest]` note to the
shared inbox after each session with blockers/majors only.

## 6. Facilitator watch-list (things to probe, not to script)

- **First-screen clarity**: does a cold tester understand "watch free, pay to
  act" inside 90 seconds? (PT1/PT8)
- **Review trust**: does the queue card make a reviewer *faster* — trace,
  whitelist card, SLA clock — or do they ignore it? (PT3)
- **Deny dignity**: denied players should feel refunded and un-shamed. If any
  deny copy reads as accusation, that's a major. (PT4)
- **Invisible seams**: surfaces simulate independently — the same request won't
  literally appear on both pages. Judge the *vocabulary*, not the plumbing.
- **Scope leaks**: any UI that implies controlling a main, moderating AI
  behavior, or spending real money is a blocker on sight.

## 7. Maintenance

- `playtest.json` is the contract; `playtest.html`'s inline `PTS`/`SURF` mirror
  it — when scenarios change, edit the JSON first, then hand-sync the inline
  block (same convention as history.html/history.json). The `mirror` gate in
  `audit.js` enforces this — run it after any scenario edit.
- `screen-corpus.json` and screen-lab.html's inline `CORPUS` are likewise
  hand-synced; since v36 the `mod` gate diffs them case-for-case (inputs +
  expectations), so content drift fails the audit — when adding a case,
  update both.
- New surfaces get a `surfaces` entry + at least one scenario step that touches
  them. A surface no scenario touches is untested by definition. Tool surfaces
  (no HTML to embed) declare `tool` + a `run` string — see `audit` in SURF.
- New gates in `audit.js` should follow the existing shape: `gate(name, desc,
  fn)` returning hits with `file:line` refs; REVIEW for eyeballed contexts,
  FAIL for violations.
- v51: harness affordances are contract-checked — when you add a harness
  feature, declare its marks under the current `harness_ui_vNN.required_marks`
  block in playtest.json and the harness gate enforces them. Bumping the
  LS key without bumping `version` (or vice versa) FAILs the gate.
- When the game track lands real plumbing, add a `PT9 "merge wiring"` scenario
  rather than rewriting the demos — the demo contracts stay the reference.
