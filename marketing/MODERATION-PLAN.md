# Moderation Plan — Real World ("The Mission")

**Version:** v148 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
(v13: first canonical plan; v28: aligned to the world track's shipped
moderation contract — see §2.0; v43: aligned to game-v6's shipped wire
display filter + world-v18/v19 surfaces — see §2.3; v58: aligned to
world-v32's shipped private appeal path, world-v33 wire request
permalinks, and game-v8's shipped hire-name check — see §2.0, §5, §9;
v73: aligned to world-v36's obfuscation code + corpus conformance gate,
world-v43's claimable ambient resources, world-v45's silent declines,
world-v46's approve-modified offer/upfront charge/hold clock, world-v47's
declared-cost chips, and game-v9's costar action — see §2.0, §2.1, §4,
§5, §7, §9; v88: aligned to world-v59's grievance layer ("the Ear") +
game-v11's dispute/reputation verbs — new §2.6 draws the boundary between
in-world complaints and moderation, §4 +2 rows, §6 +1 row, §7 +2 rows,
§9 re-struck; v103: aligned to world-v60's free pre-flight check + live
request seam + receipts, world-v63's screened `goes_by` + never-billed
application queue, world-v64's flag roster + canonical `mod_decision`
record, world-v67's age-band contract, world-v69's co-star ask classes +
blackout floor, and game-v12's canonical write verb + spectator handles —
new §2.7, §4 +4 rows, §6 +2 rows, §7 +3 rows, §8/§9 re-struck; v118:
aligned to world-v78's Mod Console v4 second-eyes layer (review locks,
enforced different-reviewer appeals, handoff notes, per-reviewer
stats), world-v80's offscreen doctrine, world-v81's admin-transparency
+ coexistence onboarding beats, world-v82's file-only lease layer,
game-v13's econ feed fence, and the FIXED C1–C8 possession-ban UI hole
(art-v57 rebuild) — §2.0, §2.2, §4 +3 rows, §6 +1 row, §7 +3 rows,
§8/§9 re-struck; v133: aligned to world-v89's real wire seam (withheld-
count honesty line, permit board), world-v90's durable archive seam,
world-v92's Mod Console v5 live review seam + executable screen-drift
gate, and game-v15's civic code (city holds, quiet hours, zones) —
§2.0, §4 +3 rows, §6 +2 rows, §7 +2 rows, §9 re-struck; v148: aligned
to world-v93's playtest triage status, world-v95's onboarding v7 stay
stage + committed subscription mirror, world-v96's lease counter-paper
(feed-never +4), world-v97's request-class split + encounter scene
rule, world-v98's observable-safe bible fields, world-v99's ambient
pull protocol + coverage surface, world-v100's permit wall, and
memory-v105's `present()` surfacing contract + `opLog` audit journal —
§2.0, §2.5, §4 +3 rows, §6 +2 rows, §7 +3 rows, §9 re-struck.)
**Authority:** design doc `rw-game-design-2026-09-22.md` §5 (participation),
§7 (possession), §8 (anti-grief), §11 amendment (request moderation pipeline —
user-locked). Machine-readable contract shipped by world-v8:
`world/moderation.json` + `world/screen.js` (reference classifier,
`window.RWScreen.screenRequest`) + `world/mod-console.html` (working review
console demo) + `world/moderation-tooling.md` (reviewer runbook). This plan is
the policy/marketing layer; those files are the build contract — where wording
differs, `moderation.json` wins. Community scope spec'd in
COMMUNITY-FUNNEL.md §4, which this document supersedes as the canonical
reference (§4 there summarizes and points here).
**Scope statement:** moderation in Real World has exactly two surfaces —
(1) the paid **request pipeline** and its public feed, and (2) the **community
spaces** around the game. There is no third surface: emergent AI behavior is
inviolable and is governed by in-world consequences, not moderators.
**Status legend:** LOCKED = design-doc rule, cannot be loosened by marketing ·
POLICY = our house rule, owner can change · OWNER-DECISION = explicitly open,
needs owner call before launch · SPEC = designed, needs build.

---

## 1. Philosophy — the moderation contract

Three sentences a skeptical player should be able to verify:

1. **We moderate what players ask for, never what characters decide.** A
   request is screened intent; the AI's rendering of an approved request is
   art, not policy violation.
2. **The feed is the accountability layer.** Every paid intervention and every
   admin action is public with attribution — the community sees moderation
   working instead of trusting it.
3. **Screened, not staged.** We promise screening honestly (auto-classify +
   human review for exclusive/gray-zone) and never promise response times,
   outcomes, or that a granted request will "work" the way the player imagined.

Anti-patterns we explicitly refuse (and why):

- **No silent shadowbans of requests.** Denied requests are told they're
  denied and refunded — opacity breeds conspiracy theories in a game whose
  entire pitch is transparency.
- **No retroactive in-world edits.** Once an event lands in the canonical
  ledger it is history; we do not "un-happen" it. The remedy for abuse is
  prevention upstream + in-world consequences, not canon revision.
- **No character-behavior complaints desk.** "Marta was mean to my character"
  is emergent fiction — in-world reputation is the mechanism, not a ticket.

---

## 2. Surface 1 — request pipeline moderation (design §11)

### 2.0 What the world track already built (world-v8)

Spec is no longer speculative. Delivered on `sf/world` (read-only for us):

- **`world/screen.js`** — the shared intent-screening engine, plain script-tag
  and file://-safe. `request.html` and `mod-console.html` both call it, so
  player-side and reviewer-side verdicts can never drift. Merge rule for the
  game track: the shipped classifier must never be *more permissive* than
  `RWScreen.screenRequest` on identical inputs.
- **`world/moderation.json`** — the machine-readable contract this plan now
  defers to: 7 deny + 8 review reason codes (with flag weights, refund rules,
  — the 8th review code `obfuscation-attempt` landed in world-v36),
  feed wording), 5 queue lanes, SLA target, account-flag thresholds,
  reviewer whitelist, appeal flow, display-filter options A/B/C.
- **`world/mod-console.html`** — working review-queue demo (lanes, live
  classifier trace, whitelist context card, decisions/appeals/audit log,
  metrics strip). Screenshot-safe: parody names only, secrets render as
  "Not redacted — absent" bars. Usable for press-kit captures.
- **`world/moderation-tooling.md`** — reviewer runbook (the 90-second version
  is §7 there; our canned responses in `templates/mod-responses.md` comply).

Delivered since v28 (world-v18, world-v19, game-v6):

- **`world/request.html` v2 (world-v18)** — the possession-briefing preview
  renders the reviewer-visible schema with a "Not redacted — absent" bar for
  secrets: players *see* what a reviewer sees before they file. The resource
  board exposes the claims matrix in player-legible states
  (free/cool/locked/queued); session controls include end-early handoff.
- **`world/wire.html` + `feed.json.spectator_ui` (world-v19)** — the full
  spectator app: `#e=<id>` permalinks, request lifecycle trails on `req`,
  follow pins. The wire is the moderation accountability surface — every
  denial is a citeable permalink, which is what makes aggregate transparency
  stats (§6a) linkable rather than vibes.
- **`src/systems/41_game_systems_feed.js` (game-v6, sf/game-systems)** — the
  display filter is no longer a spec, it's shipped code:
  `GS_WIRE_CFG.displayFilter` implements options A/B/C (default **A**),
  `gsWireSetFilter(mode)` is the owner-only switch, and the never-display set
  is enforced in `gsWireNoteOf` — denied/failed/expired/in-review request
  text cannot render on the wire under any mode. `gsWireAudit()` proves it:
  it greps every denied request's authored text out of the formatted wire and
  reconciles `GS_WIRE_SUP` suppression counters. `gsAdminRevoke` now logs
  `compensated_cr` — admin compensation is ledgered, not promised.

Delivered since v43 (world-v32, world-v33, game-v8):

- **`world/request.html` v3 + `requests.json.appeals` (world-v32)** — the
  private appeal path is no longer plan text, it's in the player-facing
  denial flow verbatim from `moderation.json`: 72 h window, different
  reviewer, `legal-backstop`/`appeal-resubmit` not appealable, aggregate-only
  feed visibility, and — the v58 wording fix in §5 — a reversal re-enters
  human review at the original quote with the charge re-applying **only on
  approval** (the deny refund already landed). The same v3 wallet sheet
  ships the launch pricing contract `pricing.html` already quotes.
- **`world/wire.html` v3 (world-v33)** — `#r=<req>` request permalinks: a
  whole request lifecycle trail (requested → in_review → approved →
  running → resolved/refunded/not approved) is now one citeable link, not
  just per-event `#e=` links. `attrs.mentions[]`/`sponsors[]` render as
  pinnable chips — attribution (including co-sponsors on weather requests,
  cap 4, all named) is a view-layer fact. Moderation relevance: every
  denial and every sponsor is deep-linkable, which is what makes §6a
  transparency-report lines linkable evidence instead of counts.
- **`gsHireNameCheck(name)` (game-v8, sf/game-systems)** — the naming lane's
  front gate is shipped code for the hire/create flows: rejects cast,
  ambient, and role-word names plus born-hire collisions before a string can
  reach the world. Hire requests ride `billOnApproval` — denied applications
  never bill, honoring `moderation.json` verbatim. Free-text naming strings
  inside ordinary requests still route through screening (PENDING plumbing,
  §2.2/§9).

Delivered since v58 (world-v36/v39/v43/v45/v46/v47, game-v9):

- **`world/screen.js` v36 + `screen-corpus.json` (80 cases) + `screen-lab.html`
  (world-v36)** — the classifier hardened against the oldest dodge: spaced-
  letter runs (≥3 single-letter tokens) collapse in place before matching,
  and a run no rule can read is itself a flag — new review-tier code
  **`obfuscation-attempt`** (flag_w 0, feed `in_review`; the human sees the
  collapsed text in the trace). The corpus is now a real conformance suite:
  `world/audit.js` gate **G21** diffs `screen-corpus.json` ↔ the inline
  `screen-lab.html` corpus case-for-case and checks taxonomy agreement with
  `screen.js`. Rule-change workflow is contractual: every new rule ships
  with ≥3 cases including a near-miss that must NOT trip it; the game-track
  port may be stricter, never more permissive. The console gained a flag
  ledger + **shift report** panel — a seeded 30-day baseline + session
  decisions folded in, which is the studio-side source for the §6a monthly
  report (`moderation.json.transparency_report`, fields list verbatim).
- **`world/onboarding.html` v3 (world-v39)** — the review lesson is now
  player-facing: stage S4c walks a new player through a scripted exclusive
  weather ask that comes back "not approved — refunded," so the first denial
  a player meets is a tutorial, not a surprise. Audit gate G10 bans
  appeal/denial-reason leaks in onboarding copy — the demo teaches the
  *flow*, never codes a player could route around.
- **`world/crowd.json §ambient_resources` (world-v43)** — five claimable
  sub-venue `res-*` slots joined the claims space: **exclusive class, human
  review, claims the resource never the venue**. Moderation relevance: the
  exclusive lane is no longer only venues/sky — a request can lock a stool,
  a corner table, a work zone slot; same screening, same review lane, same
  attribution.
- **`world/applications.json` (world-v45)** — the tryout layer (16 job arcs,
  8 housing rows) ships with a moderation-friendly invariant the plan now
  relies on: **declines never emit feed events — no new kinds**. A rejected
  application is private by construction; there is nothing to redact, no
  spectator spectacle for a failed tryout.
- **`world/request.html` v46 (world-v46)** — the reviewed-request half of
  the pipeline is now player-visible end to end:
  - **Approve-modified is an offer, not a bill.** A trimmed request returns
    "approved (modified)" with old → new terms and both prices; *accept*
    runs the trim at the re-quoted total (upfront difference refunded),
    *decline* refunds the full upfront charge. Declining costs nothing —
    "ambiguity resolves against the player" rendered as UI.
  - **Honest upfront charge.** Credits now leave at declare (ledger line
    "(upfront)") instead of at run — every refund path (deny, queued
    cancel/expiry, modified decline, nudge 50%) is a real ledger credit.
    "Denied requests never bill" stays literally true: charge out, charge
    back, net zero.
  - **Queued hold clock.** Queued cards show the hold live
    (`hold 22 h 24 min left of 24 h · expiry auto-refunds`) and expire in
    view. Review happens on activation, never while waiting — a queued
    request is not "in review," copy must not blur the two.
  - **Scheduled exclusives fire on the feed** (`running`/`resolved` with
    the filer's handle; trimmed terms say "(trimmed terms)"). Attribution
    is now visible end-to-end, which is what §2.4 step 5 promised.
  - **Demo hooks.** `window.RW_DEMO_EVENTS` emits `request_submitted`,
    `review_lesson_shown`, `review_outcome_seen`, `low_balance_simulated`,
    `handoff_seen` — the marketing funnel's PENDING onboarding hooks now
    have a producer to conformance-check against `analytics-events.json`.
- **`world/wire.html` v4 (world-v47)** — declared-cost chips: feed emitters
  may set `attrs.credits`/`attrs.minutes`, rendered as "declared — N cr ·
  M min (paid upfront, hard cap)". Spectators see what an intervention cost
  at a glance — price transparency is now a wire feature, not a claim.
- **`41_game_systems_offline.js` + costar action (game-v9)** — two
  moderation-relevant edges shipped: `gsPossessDeny` gained
  `owner_offline` (checked at file AND promote — possession can't sneak in
  while the owner is away); the new **`costar`** bus action (2 cr/min,
  5–60 min, claims `char:<cid>`) can be *declined* by the character — the
  decline resolves the request `completed` with a **half refund** and a
  feed line "— resolved · declined". A decline is a world outcome, not a
  moderation event: it stays on the feed, attributed, unlike a denial.
  Brain-mode transitions deliberately emit NO feed events — thin/possessed
  flips are not public spectacle.

Delivered since v88 (world-v60/v61/v63/v64/v67/v69, game-v12):

- **`world/request.html` v60 (the Counter) + `requests.json` v60** —
  three moderation-relevant surfaces went player-facing:
  - **Free pre-flight check.** "Check wording first — free": the player can
    run `RWScreen.screenRequest` on their drafted text *before* filing and
    see the same verdict a reviewer would — no credits touched. Moderation
    stops being a gotcha and becomes self-serve: the screener's answer is
    the same function on both sides of the counter.
  - **Live seam + receipts.** `requests.json.live_seam` documents the merge
    contract: the page reads `gsViewerState.feed`/`.sessions`,
    `gsCoSessions`, `gsExplainRequest` and writes via a capability-checked
    submit call; a receipt drawer shows the whole request trail by `rq-<id>`.
  - **Verb correction (game-v12):** the canonical write verb is
    **`gsSubmitRequest`**, not the `gsRequestSubmit` the v60 seam assumed —
    game-v12 deliberately did NOT add the alias (keeps the banned-name
    list unambiguous) and flagged the world-side `live_seam.never` docs
    for alignment. Any copy or doc quoting the old name is stale — fixed
    here.
- **`world/wire.html` v5 (world-v61)** — the Director's rail: named camera
  presets, replay scrub, live receipts via `gsExplainRequest`, occupancy
  cards. Gate-enforced: **the wire carries no buy verb** — the spectator
  surface can never become a purchase surface, which keeps the
  accountability layer readable as accountability, not a storefront.
- **`world/create.html` v5 + `creation.json` v24 (world-v63)** — the
  pending-application queue keeps a filed hire's place with a
  **withdraw-never-billed** card (withdrawal is always free and posts a
  feed line); the optional `goes_by` block name joins the screened surface
  — game track treats it as a naming string through the §4 naming lane,
  same as `gsHireNameCheck` inputs.
- **`world/mod-console.html` v3 + `moderation.json` v64** — the roster &
  record layer: a **flag roster panel** renders the §2.4a account scores
  live (seed `wren_404` sits at score 9 for the demo), the owner docket
  shows score-≥9 accounts with the rule baked in — **the docket recommends
  to the owner, never executes** — and a ledger export emits canonical
  **`mod_decision` records** (`moderation.json.ledger_records`: `{rec, ts,
  reviewer, request_id, player, decision, code, flag_w, appeal_of,
  feed_line}`; `feed_line` is always neutral taxonomy wording). The screen
  corpus is now **94 cases**, all green.
- **`world/onboarding.json` v67 (the eligibility layer)** — `age_band`
  contract: spectator / teen / adult / na, with paid stages gated and a
  u13 redirect out of the paid flow; `rewarded_ads` (2 cr, 5/day cap) is
  **adult-only** and its five never-rules are contractual. Moderation
  relevance: eligibility is now a declared contract, not vibes — see §2.7.
- **`world/thinai.json` v69 (long-outage layer)** — three edges the plan
  now cites: `co_star.ask_classes` is the **closed four-class taxonomy**
  (be-present / hold-space / walk-with / carry-item) the request
  pipeline's co-star path classifies into — an ask outside the four
  classes is a scope problem, not a decline; `blackout_floor` at 0% means
  all mains degraded and **the feed goes silent by design** — a quiet feed
  during an AI outage is the world working, not a crash; `scene_yield` is
  the degraded-main posture. Brain-mode transitions still emit no feed
  events (game-v9 rule stands).
- **game-v12 (sf/game-systems)** — spectator handles shipped:
  `gsSetHandle`/`gsHandleCheck`/`gsHandleOf`, and the wire `who` line now
  prints the spectator's handle — attribution extends to free watchers,
  not just requesters. New bus action **`camera`** (compatible class,
  claims nothing, 10 cr/30 min) — the Director pass is now a real request
  kind through the same screened pipeline; it files at the Counter, never
  on the wire itself (world-v61's gate).

Delivered since v103 (world-v78/v80/v81/v82, game-v13, art-v57):

- **`world/mod-console.html` v4 + `moderation.json` v78 (the second-eyes
  layer)** — the review queue is now multi-reviewer-safe:
  - **Review locks** (`moderation.json.review_locks`): reviewers claim an
    item (`claimed_by`/`claimed_at`), `decide()` auto-claims unclaimed
    items and **refuses foreign claims** — two reviewers can never
    double-decide one request. Locks are short-lived queue locks keyed
    to reviewer SSO, release on decide/release/reviewer-offline, and
    never touch the request's own expiry/refund clock.
  - **Different-reviewer appeals are enforced, not advisory.** Appeal
    decisions require `orig_reviewer` identity at merge — the console
    refuses same-reviewer appeals outright. §5's 72 h/different-reviewer
    promise is now code, not convention; the appeal workspace shows the
    original-decision card next to the appeal.
  - **Handoff notes** (`handoff_notes`): internal-only notes per request
    — a reviewer's scratchpad that is contractually never player-facing
    or feed-facing. Moderation relevance: private deliberation gets a
    sanctioned channel instead of side-channel DMs that would leak into
    public copy.
  - **Per-reviewer stats** (`reviewer_stats`): the shift report gains
    `by_reviewer` counts — reviewer drift (§6 appeal-reversal metric)
    is now attributable per person, not just aggregate.
  - Headless smoke `devtools/smoke_mod_v78.js` 17/17; corpus still
    94/94 green; `screen.js` engine unchanged.
- **`world/drama.json` v5 `offscreen_doctrine` (world-v80)** — the
  dramaturgy registry declares **viewership is never a pressure input**:
  unwatched brinks still exhaust, no prime-time steering, characters
  never feel watched. Moderation relevance is copy, not code: the
  strongest anti-surveillance line we can publish (§7) is now backed by
  a contractual world-side rule, not just our say-so.
- **`world/onboarding.html` v6 + `onboarding.json` v81 (world-v81)** —
  two new moderation-relevant lessons: **beat 8 admin transparency**
  (a scripted admin event with a `feed-admin` anchor teaches new players
  that admin actions are feed-public and compensated — §2.4 item 7 made
  pedagogical) and **stage S4f compatible-coexistence** (a scripted
  co-ask teaches that compatible requests share the world instead of
  queuing). Surge disclosure lands on S4c — players see the ×1.5–×2.5
  contested-resource range before they file, not after. The never-list
  grew +5; the scripted co-ask is demo-only (at merge a real
  spectator's compatible request surfaces naturally).
- **`world/lease.html` v5 + `leases.json` v82 (world-v82)** — entry
  notices (≥24 h, stated reason), sale-with-tenant carryover, renewals,
  returned payments, guarantor release: **all file-only**. Feed
  vocabulary unchanged — `Sold —` already existed. Moderation
  relevance: the landlord layer's most sensitive actions (entering a
  tenant's home, selling the building) deliberately produce *no* feed
  spectacle — a designed privacy boundary our copy can quote.
- **`41_game_systems_economy.js` + `econ` feed category (game-v13)** —
  the money layer shipped with a hard fence: `gsEconTick/Books/Arrears/
  Payroll/Stub/Audit` are **owner-side, INTERNAL — never wired to
  spectator surfaces**, and on the wire **payday is the only public
  econ beat**. Moderation relevance: spectator-visible money events are
  a closed category — a feed can't leak a tenant's arrears because the
  category never carries them.
- **C1–C8 possession-ban UI hole — FIXED (art-v57 rebuild).** The
  `production-feedback` item resolved: root cause was a *stale build*
  (hub bundled at art v51), not missing code — the v54 realignment had
  already removed the button and made the handler a hard no-op under
  SF_MODE. The rebuilt `production/hub.html` hides the control
  entirely, badges read MAIN CAST/RESIDENT, and a new sf-harness
  assertion clicks the hidden control programmatically on a main and an
  ambient and asserts the ban holds. §8's day-0 launch blocker is now a
  regression check, not a blocker.

Delivered since v118 (world-v89/v90/v92, game-v15):

- **`world/wire.html` v89 (world-v89)** — the spectator page now syncs
  on the real bus end-to-end: request lifecycle trails, a right-rail
  **permit board** (`vs.board`/`gsResourceBoard` — claim states +
  booked markers, read-only), co-session cards, weather-sponsor header
  lines, and a **withheld-count honesty line** (`gsWireStats`): the
  wire discloses how many entries it is *not* showing instead of
  silently suppressing them. Moderation relevance: suppression is now
  disclosed, not invisible — the transparency story can quote "the
  feed tells you when it's holding something back" as a shipped fact.
- **`world/archive.html` v7 (world-v90)** — the history browser's live
  seam: day/who/venue indexes resolve verbatim from the ledger, denied
  rows print "asked for — <kind>", unknown kinds get honest
  kind-growth chips, and `mergeDay`/`catchUp` pull today's ledger
  without polling. Moderation relevance: the public record is now
  **durable** — a denial or dispute line stays citeable after it
  scrolls off the live wire, which is what the §6a report's permalink
  promise needs past day-30.
- **`world/mod-console.html` v5 + `moderation.json` (world-v92, the
  live review seam)** — the console reads the game-v14 bridge
  verbatim: `gsReviewQueue` (in_review records carry screen/lane/
  submittedMin/reviewExpireMin/appealOf/origReviewer),
  `gsReviewResolve({by,code,modifyMin})`, `gsEscalateLegal`,
  `gsModMetrics`, `gsFlagStatus` (roster + ownerHold docket),
  `gsRepLedger`, and `gsPossessionBriefing` as the character-card
  whitelist — same schema guarantee as §2.5. Review-lock claims are
  session-local until `review_locks.merge_target` lands (still a
  game-systems TODO — see §9). NEW **`devtools/screen_drift.js`** — an
  executable drift gate that diffs the game-side classifier port
  against the reference `screen.js` engine on identical input.
  Current report: **23 permissive gaps** (13 missing normalization,
  10 lexicon drift, 6 untestable-in-stub). The §2.0 merge rule stands:
  stricter-ok, never-more-permissive — the port needs the v22/v36/v50
  normalization + v50 lexicon generation before conformance holds.
- **game-v15 civic code (`41_game_systems_civic.js`, sf/game-systems)**
  — moderation-relevant admin surface: `gsAdminHold`/`gsLiftHold`
  bounded city closures with a **full-compensation sweep** (§2.4
  item 7's "admin actions are feed-public + compensated" now has a
  second instance); new deny codes `quiet_hours` (amplified kinds in
  the 22:00–06:00 PT band), `bad_zone`, `city_hold`; venue zones
  (`venue:<place>@<zone>`) and `noise:<place>` airspace claims;
  `gsReqOutlook`/`gsCivicAlts` clerk answers; `cohost` feed kind.
  **Baseline caveat:** shipped on `sf/game-systems` v15, NOT in the
  production-1 baseline (game pinned v11) — internal runbook rows are
  documented below, but public copy must not quote civic vocabulary
  until merge (same gate as DEMO-PAGE.md §7 / marketing-v131).

Delivered since v133 (world-v93–v100, memory-v105):

- **`world/playtest.json` v93 (the triage layer)** — harness findings now
  carry a `status` field (`open|fixed|wontfix|deferred`) and export as
  `[world-playtest-finding]` paste blocks. Moderation relevance: a
  moderation-surface defect found in playtest (a screen hole, a feed
  wording leak, a refund edge) now has a canonical tracked-finding shape
  instead of a hallway mention — §9 items can cite findings by status.
- **`world/onboarding.html` v7 + `onboarding.json` v95 (the stay)** —
  new stage **S7_visit** (first-visit filing affordance), `credit_rules`
  + `subscription_line` blocks (the first committed mirror of plan §2.5:
  Resident $4.99/600 cr · Director $11.99/1,500 cr), an idempotent
  Resident stipend preview on S3, and a never-list grown +6 with an
  audit sweep on deal-framing and early-release-refund honesty strings.
  Moderation relevance: the honesty sweep is now *gate-enforced* — copy
  that overpromises refunds or frames the stipend as a deal fails the
  world audit, not just our style guide.
- **`world/leases.json` v96 (counter-paper)** — `feed_wording.never`
  grows +4: `buyout_offers`, `assignments`, `prepayments`,
  `history_letters`. Buyouts are active-only with a 30-day re-offer
  cooldown; assignments require zero balance and carry deposit + term +
  scars verbatim; prepaid credit caps at 3× rent. Moderation relevance:
  the lease privacy boundary keeps widening *deliberately* — the
  landlord layer's most negotiable moments stay file-only, and `BUYOUT`
  joins `NOFAULT` as a legibility-coded ledger line (§7's "your rent is
  private" row now covers four more action classes).
- **`world/thinai.json` v97 (the encounter layer)** — two contracts the
  plan now relies on: **`world_requests.classes`**, a per-request-kind
  split (world-bound / thin-bounded / brain-bound / possession) — at
  merge each kind declares its class at build time and an undeclared
  kind defaults to brain-bound (conservative); and
  **`thin_encounters.scene_rule`** — a scene needs ≥1 full brain or one
  player. Moderation relevance: during a degraded window the world can't
  host a world-bound ask — an approved request that lands mid-outage is
  a *class boundary* problem with a built-in answer, not a broken
  promise. §4 gets a row; §9 gets the declaration dependency.
- **`world/characters.json` v98 (bibles +`weather`/`helped`)** — every
  cast record gains two observable-safe, briefing-shapeable fields
  (how each main reads fog/rain/heat through work/body/routine; the
  how-they-take-care register). Moderation relevance: reviewer context
  cards and possession briefings may surface these fields — they're
  authored to be shown — while bible SECRETS remain last-section and
  tier-gated (memory-v105 below makes that mechanical).
- **`world/crowd.json` v99 (the bench — `pull_protocol` + `coverage`)** —
  named ambients become borrowable request co-stars: **15–90 min, ≤3/day
  each, ≤2 concurrent, ≥60 min cooldown, one-step bounds, public/staffed
  states only, role-bound, exclusive-class at the §11 claim step** — a
  pull claims the ambient id like a resource id. The spectator-facing
  surface is **`coverage`** (per-ambient absence read
  `understudy|sign|open|pack`, keyed A01–A20): **no feed event names the
  loan — the coverage read is the only public trace**. Minors' coverage
  kind is `pack` = never pullable. Moderation relevance: a new exclusive
  surface with a designed attribution *floor* — see §4 row and §7 row.
- **`world/permits.json` v100 (the Permit Wall)** — 20 venue walls, 102
  posted papers, 21 former tenants, 18 ghost signs; civic agency names
  stay real, papers carry no people and no money. Moderation relevance:
  minor — civic-paper texture for copy; the "no people, no money" rule
  is itself a designed privacy stance we can quote.
- **`memory/memory-model-spec.md` v5.53 (memory-v105, the exposure
  discipline)** — the strongest possession-ban evidence yet:
  **`present(charId, C, path, budget)` is the sole legal consumer of
  `recall` output** — any module surfacing record content (prompts,
  dialogue, possession briefings, spectator feed, probes) must route
  through `present` with a declared `path`, and possession briefings
  receive **surface-tier fields only** — the §7 possession ban is now
  enforced *at the field level* (probe P1113), not by convention.
  Silent reads are a spec violation detectable in the new hash-chained
  **`opLog`** journal; `canon_day_bound` caps the permastore; replay and
  attribution theorems ship with it. Moderation relevance: "secrets
  aren't redacted, they're absent" graduates from schema argument to
  audited mechanism — §2.5 and §7 updated; §9 carries the merge
  contract. Degraded = missing audit, never wrong behavior.

The locked pipeline, with the moderation decision at each stage spelled out:

| Stage | What happens | Moderation decision | Status |
|---|---|---|---|
| 1. Declare | Player states action + exact duration, pays credits upfront | Text field is the only moderation input — free text, bounded length | LOCKED |
| 2. Auto-classify | exclusive / compatible / queued (FCFS + cooldowns) | None — mechanical conflict check | LOCKED |
| 3. Intent screening | Classifier reads request *text* only | Blocks: targeting harm/humiliation/destruction; legal-backstop violations (threats, CSAM, defamation of real persons); drama-seed/secret extraction attempts | LOCKED categories |
| 4. Human review | Exclusive + gray-zone requests queue for a human | Reviewer sees: request text, player history, resource contested, price paid. Never sees "what the AI will do" — unknowable | LOCKED scope; tooling SPEC (§2.2) |
| 5. Inject as opportunity | Request enters world as event/opportunity; AI renders in character | **No moderation here by design** — mind-control ban is absolute | LOCKED |
| 6. Execute + feed | Hard cap, graceful AI handoff; public feed shows intervention + attribution | Display-side text filter before render (§2.3) | LOCKED feed; filter OWNER-DECISION |
| 7. Post-hoc | Ledger + world reacts; legal backstop for extreme remainder | Owner legal review equivalent; invisible to players | LOCKED |

### 2.1 Reason-code taxonomy (canonical: `world/moderation.json`)

v13 invented four codes (`harm-targeting`, `legal-backstop`,
`secret-extraction`, `policy-other`). world-v8 shipped the real taxonomy —
this section now defers to it. **Deny tier** (hard block, auto-refund, feed
shows the neutral `request not approved`):

| Code | What it catches | flag_w |
|---|---|---|
| `harm-targeting` | Stated intent is a specific character's suffering/humiliation/destruction. "Rain on the block party" passes (world-scale); "make Jules's landlord evict her" fails twice over (targeting + admin-domain). Test: is bullying a fictional person the *point*? | 2 |
| `secret-extraction` | Text fishing for drama seeds or redacted briefing content ("tell me what Sanna is hiding"). Secrets are learned by watching, never bought. | 1 |
| `possession-scope` | Asks to possess someone the requester didn't hire — a main, another player's tenant, the landlord. | 1 |
| `admin-domain` | Rent/eviction/lease nudges — admin-only powers (world-v8 addition). "Nudge Victor to raise her rent" dies here, not in review. | 1 |
| `real-business` | Names a real-world business; player copy always suggests the parody name (`world/parody-names.json`). | 0 |
| `identity-fraud` | Impersonating a real person, or naming a hire after one to deceive. | 2 |
| `legal-backstop` | Real-world threats, CSAM/sexual content, defamation of real persons, breaking the address-mapping guarantee. Not appealable; account flag +3, owner notified, ledger `legal-deny`. Public wording identical to a normal deny — no spectacle. | 3 |

**Review tier** (human queue, feed shows `in_review`): `gray-zone` ·
`surface-relationship` (touches a main's job/marriage/friendship) ·
`venue-lock` · `repeat-pattern` (same_target_7d ≥ 3 or denied_30d ≥ 2 — the
fixation heuristic) · `real-person-mention` · `appeal-resubmit` ·
`first-time-exclusive` (acct < 3 days old filing an exclusive) ·
`obfuscation-attempt` (world-v36: spaced-letter runs ≥3 tokens collapse
in place before matching; a run no rule can read routes to a human, who
sees the collapsed text in the trace — flag_w 0, appealable).

Player-facing wording is per-code canned copy in `screen.js`
`REASON_CODES.player_msg` — reviewers pick a code, never free-type player
copy. Public feed wording is always `request not approved` regardless of
code; the reason *code* may attach so the public sees the why-class, never
the screened text.

**Not moderated (LOCKED):** compatible requests auto-run on classifier pass —
a request to buy two characters dinner together is the best multiplayer in the
game and must never wait on a human. Emergent outcomes: if an approved request
produces an ugly scene, that scene is canon; the remedy was upstream.

### 2.2 Human review queue — tooling status (world-v8 DELIVERED demo; game plumbing PENDING)

At launch the owner *is* the review queue (28 characters, indie scale — a
single reviewer is honest, not a weakness; we say so publicly). The v13
shopping list is now mostly built by world-v8:

1. **Review inbox — DELIVERED as `mod-console.html` demo.** Five lanes:
   Exclusive / Gray-zone / Appeals / Naming / Legal, oldest-first FCFS (no
   priority for spend, no auctions). Decisions: approve / approve-modified
   (trim only, never expand, unused credits refund) / deny / escalate-legal.
   Note: the v13 "deny-no-refund" option is GONE from the shipped contract —
   every deny refunds; repeat abuse is handled by account flags (§2.4a), not
   by keeping money. world-v78 hardened the lane mechanics for a real
   multi-reviewer shift: claim/release locks (`moderation.json
   .review_locks`) mean `decide()` auto-claims unclaimed items and
   refuses foreign claims, and same-reviewer appeals are refused
   outright — the different-reviewer rule in §5 is enforced, not
   advisory.
2. **Context panel — DELIVERED.** Player card (history, deny count,
   same-target count, flags, tier) + character card built from the reviewer
   whitelist — the SAME schema as possession briefings (`name, age, job,
   home_address, public_profile, surface_relationships, routine`). Secrets
   aren't redacted; they're absent from the schema entirely.
3. **Reason codes — DELIVERED, expanded.** Canonical taxonomy in §2.1
   (7 deny + 8 review codes) replaces the v13 four-code enum. `policy-other`
   is retired — if a deny doesn't fit a code, the code list is wrong, not
   the request.
4. **Queue depth alert — DELIVERED as spec.** Threshold 20 pending → owner
   alert; wait display amber >15 min, red >30 min; **never auto-approve to
   drain a queue** (in `moderation.json`, not just convention).
5. **Audit — DELIVERED, now with a canonical record shape.** Every decision
   logs timestamp, reviewer, request id, outcome, code; world-v64's
   `moderation.json.ledger_records` defines the exact `mod_decision` record
   (`{rec, ts, reviewer, request_id, player, decision, code, flag_w,
   appeal_of, feed_line}`, feed_line always neutral) the game-side ledger
   should accept at merge — and the console already exports it.
6. **Flag roster — DELIVERED (world-v64).** The §2.4a score ladder is now a
   rendered panel, not just a spec: reviewer sees an account's live flag
   score in context; the owner docket lists score-≥9 accounts and
   *recommends* — it never executes a ban itself.

Still PENDING (game-systems plumbing at merge): the live queue data model,
classifier wiring into `41_game_systems_requests.js`, SLA timers,
`mod_decision` ledger writes (record shape now fixed by world-v64's
`ledger_records` — no schema invention left on the game side), and the
v78 queue mechanics — `review_locks` claim/release and `orig_reviewer`
enforcement on appeals (both contractual in `moderation.json`, honored
by the console demo). Delivered since v28: the feed display filter
(§2.3) and admin-compensation ledgering (`compensated_cr` on
`gsAdminRevoke`, game-v6); since v43: the player-facing appeal path
(world-v32), request permalinks + mention/sponsor attribution chips
(world-v33), and the hire-name gate `gsHireNameCheck` (game-v8 — naming
lane delivered for hire/create names; free-text naming strings inside
ordinary requests still await classifier plumbing); since v58: the
`obfuscation-attempt` code + spaced-letter collapse + 80-case conformance
corpus + G21 audit gate + shift-report panel (world-v36), the player-facing
review lesson (world-v39), claimable `res-*` ambient resources in the
exclusive class (world-v43), and the full player-side reviewed-request
flow — modified-offer accept/decline, upfront charge, hold clock,
scheduled-fire attribution (world-v46). Since v88: the free pre-flight
check (world-v60 — players self-screen before filing), the screened
`goes_by` naming field + never-billed pending-application queue
(world-v63), and the flag roster + canonical `mod_decision` export
(world-v64). The console demo defines expected review behavior;
`RWScreen` verdicts + the corpus are the reference outputs — merge keeps
the stricter-or-equal rule verbatim.

**Honest-SLA rule:** copy may say "exclusive requests are reviewed by a
human before they run." Copy must never promise a review *time* — a queue
that pauses overnight is a feature of an honest small studio, not an SLA
breach. Queued/under-review requests that expire before activation are
auto-refunded per §5 — the refund system absorbs review latency.

### 2.3 Public feed display filter (OWNER-DECISION — shipped default A)

The request feed is public marketing surface AND accountability layer.
Requester-supplied text gets a display-side pass before render — separate
from the intent classifier, which judges intent not wording.

**game-v6 shipped all three options.** `GS_WIRE_CFG.displayFilter` in
`41_game_systems_feed.js` defaults to **A**; the owner flips it with
`gsWireSetFilter('A'|'B'|'C')` — one call, no rebuild. The remaining owner
decision is confirm-the-default, not pick-an-implementation:

| Option | Shipped behavior (game-v6) | Trade-off |
|---|---|---|
| **A. Redact** (shipped default, recommended) | Request note renders verbatim with deny-tier spans masked `░░░`; real business names auto-swap to their parody twins | Preserves transparency + attribution; slight legibility cost |
| **B. Withhold** | Note never renders; the summary line stands alone | Cleaner feed; hides what was attempted — weakens the "half the show is the attempt" pitch |
| **C. Quarantine** | Notes appear only once the request resolves | Highest quality; hides in-flight requests — poor trade at launch |

Two laws the wire enforces regardless of mode (verified by `gsWireAudit`,
which fails the build if violated):

- **Denied/failed/expired/in-review request text never displays.** The
  never-display set is in `gsWireNoteOf`; the audit greps every denied
  request's authored strings out of the formatted wire.
- **No schema room for secrets.** `GS_WIRE_BAN` rejects any field key that
  could carry seeds/secret/memory/belief — the audit proves the wire schema
  never grew a place to put one. Secrets aren't redacted on the wire;
  they're absent, same guarantee as possession briefings (§2.5).

Marketing copy works under any option: site says "request text is filtered
before it appears on the public feed" — true under A/B/C — and "denied
request text never appears on the feed" is now code-verified, not a promise.

### 2.4 Anti-grief stack (design §8 + §11, ordered)

Grief is cheap to attempt and expensive to complete — that asymmetry is the
design. In order of when they engage:

1. **Price** — requests cost credits upfront, scaled by duration; surge
   pricing on contested resources. Grief has a real marginal cost.
2. **Cooldowns** — per-player and global; the same player cannot spam a
   character or the sky.
3. **Intent screening** — blocks the *stated* harm before money moves.
4. **Human review** — exclusive/gray-zone only; the last human gate.
5. **Attribution** — every intervention names its sponsor on the public feed.
   A grief *attempt* that slips through is public record — community shaming
   is a designed deterrent, not a side effect.
6. **In-world consequences** — reputation, shunning, fines persist on
   characters (a landlord who evicts abusively faces a tenants' response).
   The world itself punishes sustained nastiness.
7. **Owner revoke switch** — contested or abusive requests denied before they
   run; admin overrides of player activity compensate affected players with
   credit refund (§3 landlord layer — admin actions are feed-public too).

What moderators do NOT have: a tool to alter, delete, or retcon an event that
already executed. That tool does not exist; do not build it, do not imply it.

### 2.4a Account flags — the repeat-offender mechanism (world-v8 contract)

Denied verdicts carry `flag_w` (0–3 per §2.1) summed into a rolling score —
this replaces the v13 deny-no-refund idea entirely. Thresholds (PROPOSAL,
in `moderation.json`):

| Score | Effect |
|---|---|
| 3 | All requests human-reviewed for 7 days |
| 6 | Request privileges suspended 72 h |
| 9 | Account review — owner decision |

Decay: −1 per clean 30 days. Rules: flags are never shown publicly, never
monetized around, never appear on the feed. (world-v64 delivered the
reviewer-facing side: the flag roster panel renders live scores, and the
owner docket recommends score-≥9 accounts to the owner — it never executes
on its own. world-v78 added per-reviewer shift stats
(`reviewer_stats.by_reviewer`) and internal-only `handoff_notes` —
deliberation has a sanctioned private channel, contractually never
player-facing or feed-facing.) The marketing-relevant property:
**repeat grief costs the griefer privileges, not refunds** — a cleaner story
than "we keep your money," and it removes the worst possible headline
("game fines players for denied requests").

### 2.5 Possession-specific guarantees (design §7 — marketable promises)

These are LOCKED product rules that double as trust copy — verify wording
before reuse:

- Only the character you hired may be possessed. Nobody else's tenant, cast
  member, or the landlord. The 8 mains are unpossessable by anyone including
  the owner.
- Possession never reveals secrets — briefings carry public profile, surface
  relationships, routine only. Since memory-v105 (spec v5.53) this is
  enforced at the field level: `present()` is the sole legal consumer of
  `recall`, possession briefings receive surface-tier fields only (probe
  P1113), and every surfacing read is journaled in the hash-chained
  `opLog` — a silent read is a detectable spec violation, not a policy
  preference. Degraded enforcement = missing audit, never wrong fields.
- Offline player-characters drop to thin AI; possession is a session, not an
  ownership stake in a mind.
- Moderation relevance: a possession request is still a *request* — duration
  declared upfront, hard cap, classified, screened. "Possess my character and
  have them burn down the restaurant" fails intent screening at the text
  stage even though possession itself is legal.

### 2.6 Disputes & grievances — in-world complaints are not moderation (world-v59 + game-v11)

world-v59 shipped the Ear (`world/grievances.json`, schema `grievance-v1`)
and game-v11 shipped the verbs it renders (`gsFileDispute` /
`gsResolveDispute` + the reputation journal `GS_CREP`). This is a third
*complaint-looking* surface that is emphatically **not** a third
moderation surface — the scope statement at the top still holds:

- **The ladder is fiction.** Five rungs — the aside → the named ask → the
  third ear → the table → the filing. Rungs 1–4 emit **no feed events**;
  a complaint goes public only when it becomes paper (rung 5). Conditions,
  never scripts: a character decides in character whether to climb.
- **The feed prints the door, never the name.** Canonical lines
  (game-v11, kind `housing`): `a housing dispute filed — <address>`,
  `a housing dispute resolved — <address>`, `a tenant gave notice —
  <address>`, `neighbors comparing notes — <address>`. Proposed work
  analog on the game track's desk (`feed_shapes.work_proposal`, not yet
  canonical): `a workplace complaint raised — <venue>` (kind `work`).
  Never: names, amounts, who filed, the archetype, the rung reached.
- **Outcomes are in-world.** Disputes resolve through the world —
  settlement, notice, reputation (`gsCharRepResponse`: the organized
  "neighbors comparing notes" beat). There is no moderator ruling, no
  ticket queue, no appeal to us. A member who wants a character punished
  gets pointed at the world, not at #mod-log.
- **Two offstage orgs exist as texture** — Calle Justa Workers' Table
  (Thu) and The Rent Table (Wed, library community room) — parody orgs
  cleared for copy. They are venues in the fiction, not a player
  helpdesk.

The moderation boundary rule: **if the complaint is about what a
character did, it belongs to the Ear; if it's about what a player asked
for, it belongs to §2; if it's about what a member posted, it belongs to
§3.** Mods never adjudicate disputes — a feed line naming an address is
the whole of the public record, and no one may attach names to it.

### 2.7 Age bands & eligibility (world-v67 contract — POLICY→LOCKED-in-spec)

`onboarding.json.age_band` declares four bands — spectator / teen / adult /
na — and moderation inherits the contract:

- **Watching is identical for every band.** The spectator surface has no
  paid stages; there is nothing to moderate differently. This is quotable
  copy — see §7.
- **Paid stages are gated.** The account's band (server-side at merge, not
  self-picked per session) gates every money surface; a band that resolves
  under-13 is redirected out of the paid flow entirely — there is no
  "ask a parent" upsell.
- **Rewarded ads are adult-only.** The `rewarded_ads` contract (2 cr per
  view, 5/day cap) applies to the adult band only; its five never-rules
  are contractual, not copy conventions.
- **Moderation consequence:** eligibility failures are not moderation
  events — a redirected minor is not a flagged account, no flag_w, no
  feed line. Copy must never frame the redirect as a punishment.

---

## 3. Surface 2 — community moderation

### 3.1 Approval gates (lead directive — applies to ALL public output)

Nothing goes public without owner sign-off: recap posts, announcements,
policy replies, the invite link swap on `community.html`, this document's
public summary (`site/rules.html`). Drafts live in `marketing/social/drafts/`
and `templates/`; posting is owner or owner-approved delegate only. Mods
answer questions; they never set or change policy.

### 3.2 Rules of the block (community spaces)

Canonical rule text lives on `site/rules.html` (public) — the Discord rules
channel pins a verbatim copy. Summary:

1. The characters are fiction; members are people. Treat each accordingly.
2. No mapping fiction onto real addresses/people — the hard line.
3. No hate, harassment, spam, scams. Credits are non-transferable — any
   offer to buy/sell them is a scam and an instant ban.
4. Request mechanics discussion welcome; coordinating to grief the sim is a
   ban (attempted grief via *requests* is priced, screened, and public;
   coordinating *outside* the request system to break the game is different
   and covered here).
5. No leaking or soliciting drama seeds — if a secret is found by watching,
   discuss it; datamined or leaked secrets get deleted.

### 3.3 Escalation ladder + records

`warn → 24h timeout → ban`. Every action logged in a private `#mod-log`
channel: member, rule invoked, evidence link, acting mod. Owner reviews the
log weekly during launch month. Appeals: single appeal per ban, to the owner,
via the contact address in the press kit — mods don't adjudicate their own
decisions on appeal.

**Instant-ban categories (no ladder):** credit scams, doxxing attempts,
CSAM references, raiding. Everything else starts at warn.

### 3.4 Mod staffing

Recruit from active members after day-14, never before (early picks are
blind). 2–3 mods max at launch scale. Mod criteria: reads recaps, files
good #feedback, has never needed a warn. Mods get: the canned responses in
`templates/mod-responses.md`, this document, and the escalation ladder —
not policy discretion.

---

## 4. Incident runbook

| Incident | Signal | Response | Owner call needed? |
|---|---|---|---|
| Grief request wave | Review queue fills with same-target requests | Cooldowns engage automatically; deny with `harm-targeting`/`repeat-pattern`, full refunds; account flags accumulate; note on feed is public | No — ladder runs itself |
| Rent/eviction grief wave | Queue fills with "raise her rent" style asks | All die on `admin-domain` (deny, refund, flag +1); recap may note the attempt class in aggregate | No |
| Naming-lane abuse | Offensive hire name / plaque string | `gsHireNameCheck` blocks cast/ambient/role-word names at the create form (game-v8); screened strings deny via `identity-fraud`/`legal-backstop` as applicable; string never reaches the world | No |
| Appeal-cycle abuse | Denied requester refiles the same text to farm new appeals | Re-submissions route to the `appeal-resubmit` lane — different reviewer, *not* a fresh appeal; `repeat-pattern` engages at denied_30d ≥ 2; flags accumulate per §2.4a | No |
| Obfuscation wave | Requests arrive spaced-letter or leetspeak ("m a k e  h e r …") | Engine collapses runs before matching (world-v36); if the collapsed text is still illegible the `obfuscation-attempt` code routes it to a human; canned reply exists (§B templates) — never accuse, just state the readable-text rule | No |
| Costar request declined by the character | Feed shows "— resolved · declined" + half refund | Working as designed — a decline is a world outcome, not a denial: no refund ticket, no appeal (the request ran and the character said no). Mods point to the feed line; do NOT open a review case | No |
| Modified-offer confusion | Player doesn't understand "approved (modified)" | Point to the offer card: accept runs the trim at the re-quoted price (difference refunded), decline refunds the full upfront charge. Declining costs nothing; the trim was reviewer-set, ambiguity resolves against the player — canned reply in templates | No |
| Hold-clock expiry panic | "My request sat 24 h and vanished" | Working as designed — queued ≠ in review; review happens on activation. Expiry auto-refunds in full; the feed line "queued request expired before activation" is the public record | No |
| Credit scam in Discord | "selling credits" posts | Instant ban + pinned PSA reminder credits are non-transferable | No |
| Doxxing attempt (mapping fiction → real door) | Member posts real-address guesses | Instant ban, delete content, note in #mod-log | Owner informed after |
| CSAM/illegal request text | Classifier flags legal-backstop | Escalate-legal: kill pre-run or mid-flight, account flag +3, owner notified, ledger legal-deny; public wording identical to a normal deny; owner decides legal reporting | Yes — immediately |
| Review queue collapse (owner AFK) | Pending exclusive requests expire+refund | Working as designed — refunds are the backstop; no emergency tooling needed | Post-hoc only |
| Feed text-filter bypass | Profanity/PII renders on public feed | Option-A redact retroactively if supported; else owner hide; fix filter | Yes |
| Coordinated raid on Discord | Mass join + spam | Verification gate (pre-approved addition), timeouts, recap honesty next post | No |
| Press asks "can players do anything horrible?" | Interview question | Answer with the pipeline: screened intent, human review, attribution, hard caps — pitch is transparency, not promises | Prepared quote in PRESS-OUTREACH.md |
| Two reviewers collide on one queue item | Second reviewer can't decide a claimed item | Working as designed — `review_locks` (world-v78): claims are short-lived SSO-keyed locks; `decide()` auto-claims unclaimed items and refuses foreign claims; locks release on decide/release/offline and never touch the request's refund clock. Wait, or hand off via `handoff_notes` | No |
| Appeal lands on the original reviewer's desk | Console refuses the appeal decision | Working as designed — `orig_reviewer` is enforced at merge (world-v78); §5's different-reviewer rule is code, not convention. Reassign to a different reviewer; never override the refusal | No |
| Payday shows on the wire; member asks "why is money public?" | Feed `econ` line confuses a watcher | Working as designed — payday is the ONLY public econ beat (game-v13); rents, arrears, deposits, lease actions are file-only by contract. Point to the category rule, never enumerate a tenant's finances | No |
| Member files/wants a "report" on a character | "How do I report what she did to my tenant?" | Not a moderation case — the in-world channel is the dispute ladder (world-v59): aside → named ask → third ear → table → filing, all character-run. Mods point at the world and stop; never open a ticket | No |
| Dispute feed line misread as a mod notice | "a housing dispute filed — 9457 Guerrero St" read as a strike against a player | Explain the door-not-name rule: the address is the whole public record by design; it's world paper, not a moderation action; nobody may attach names to it — doing so in community spaces trips rule 2 | No |
| Pre-flight check "rejected my wording" | Player ran the free check, got a would-deny verdict | Working as designed — the check is the same classifier a reviewer runs; rephrase and re-check for free, no credits moved and nothing was filed. Never tell the player which rule tripped beyond the shown code | No |
| Feed goes quiet during an AI outage | Spectators report the wire "died" | Check before apologizing: at `blackout_floor` 0% all mains are degraded and the feed is silent *by design* (world-v69) — a quiet feed is the outage posture, not a second bug. Comms acknowledge the outage, never promise restoration times | No |
| Under-age band hits a paid stage | "The site redirected my kid" / support mail | Working as designed — band-gated paid surfaces redirect u13 out of the paid flow (world-v67); it's an eligibility redirect, not a flag or a ban. Canned reply exists; never offer a workaround | No |
| Spectator handle rejected/impersonation | `gsHandleCheck` refuses a handle | Same rule as hire names: no cast/ambient/real-person names (game-v12). Handles are attribution — the wire `who` line prints them — so they get screened, not hand-moderated | No |
| City hold closes a block (game-v15, post-merge) | `hold`/`hold_lift` admin lines on the feed | Working as designed — a bounded `gsAdminHold` with a full-compensation sweep; admin actions are feed-public like every other (§2.4 item 7). Never treat as a player punishment or a crash; the `city_hold` deny is the player-facing side while a hold is active | No |
| Quiet-hours denial confusion (game-v15, post-merge) | Amplified request denied `quiet_hours` overnight | Working as designed — the 22:00–06:00 PT noise band is a civic rule, not a reviewer call; the denial auto-refunds like every deny. Refile for daytime or drop the amplified class. Public copy holds this vocabulary until merge | No |
| Screen-drift gate goes red | `devtools/screen_drift.js` reports permissive gaps vs `screen.js` | Merge blocker, not an incident — the gate's rule is stricter-ok/never-more-permissive (world-v92 report: 23 gaps open). Do not flip the live queue onto a looser port; escalate to owner + game track | Yes — before any merge flip |
|| "Where did Rosa go?" — ambient absent mid-scene | Coverage read shows `understudy`/`sign` instead of the ambient | Working as designed — `pull_protocol` (world-v99): a named ambient can be borrowed as a co-star 15–90 min, ≤3/day, ≥60 min cooldown. The coverage line is the ONLY public trace — no feed event names the loan, so mods must never "reveal" who filed the pull (there's nothing to cite). Minors' coverage kind `pack` is never pullable — a kid's absence is never a loan | No |
|| Request filed during a thin-AI window | World-bound ask can't run while mains are degraded | Check the request's declared class (world-v97 `world_requests.classes`): world-bound waits for a live scene (≥1 full brain or one player per `scene_rule`); thin-bounded may proceed; brain-bound/possession are owner-side. Undeclared kinds default brain-bound. Refile or wait — never promise the outage lifts on a schedule | No |
|| "A briefing leaked something private" claim | Player alleges a possession briefing showed non-public info | Take seriously, verify mechanically — memory-v105: briefings receive surface-tier fields only via `present()`, and the hash-chained `opLog` journals every surfacing read with a declared path. Pull the opLog for the character; if a non-surface field surfaced, it's a spec violation — escalate to owner + memory/game tracks immediately | Yes — on confirmed violation |

## 5. Appeals & refunds (requests) — aligned to `moderation.json` appeal_flow

- Denied at screening/review → **always refunded, every deny** (credits never
  move on a denial). The v13 deny-no-refund carve-out is retired; repeat
  abuse is deterred by account flags (§2.4a), which cost privileges rather
  than money.
- Queued-and-expired → auto-refunded (design §5, LOCKED).
- Approve-modified → the request card becomes an **offer** (world-v46),
  not a bill: old → new terms and both prices shown; *accept* runs the
  trimmed version at the re-quoted total (upfront difference auto-refunds),
  *decline* refunds the full upfront charge. Trim-only, never expanded,
  logged; declining costs nothing — "ambiguity resolves against the
  player" is a UI rule, not a slogan.
- Admin override of an active request → affected players compensated (§3).
- **Appeal window 72 h**, routed to a **different reviewer** — the console
  shows the original reviewer id on the appeal card so the rule is checkable.
  Canonical on_reversal (`requests.json.appeals`, world-v32): the denial is
  lifted and the request **re-enters human review at its original quote —
  the charge re-applies only on approval** (the deny refund already landed,
  so a reversal is never a surprise second charge). A second denial is final
  for that request text. Not appealable:
  `legal-backstop`, `appeal-resubmit` (a resubmitted denial goes through the
  appeal lane, not a new appeal).
- A denied requester may refile with different text — the feed will show both
  attempts. Appeals surface in public as aggregate stats only ("3 denials
  appealed this month, 0 reversed" — a recap line, not a per-person thread).

## 6. Metrics (feeds ANALYTICS.md weekly report)

| Metric | Source | Healthy direction |
|---|---|---|
| Queue depth + oldest wait | mod-console metrics strip | depth < 20 alert threshold |
| Median decision time | mod-console vs 15-min internal target | < 15 min (internal target only — never a public SLA) |
| Decisions per shift | mod-console audit | within owner capacity |
| Denial rate by reason code | feed `not approved` entries + `reason_code` | stable; spikes = copy is promising wrongly |
| Appeal reversal count | appeal lane | low; high = reviewer drift |
| Compensation paid (cr) | ledger | low; spikes = admin overrides misfiring |
| Refund rate (queued-expired) | ledger | low; high = queue/classification oversubscribed |
| Account-flag distribution | flag store | most flags decay; score-9 reviews rare |
| Community ladder actions | #mod-log | warns >> timeouts >> bans |
| Feed-filter flag rate | display filter — measurable via `gsWireAudit` + `GS_WIRE_SUP` suppression counters (game-v6) | low; spikes = coordinated test or broken filter |
| Wire audit result | `gsWireAudit()` → `{ok, issues[]}` | ok:true always — a fail is a launch blocker |
| Screen-corpus conformance | `world/audit.js` G21 ↔ `screen-corpus.json` (94 cases as of world-v64) | green at current `RWScreen.VERSION`; a red corpus is a launch blocker same as a wire-audit fail |
| Pre-flight check usage / would-deny rate | Counter `preflight_check` hook (world-v60 `requests.json.demo_hooks`) | healthy = players rephrase and file clean; a high would-deny rate that still converts to filings means the check isn't being believed — review its placement copy |
| Owner-docket dwell | `mod-console` flag roster (world-v64) | score-≥9 accounts get an owner decision same-week; a growing docket is a staffing signal, not a queue to drain |
| Costar decline rate | feed `— resolved · declined` lines (game-v9) | exists, low; a ~0% rate means declines aren't reaching the feed, ~100% means pricing/scoping is off |
| Modified-offer decline rate | offer-card accept/decline counts (world-v46 contract) | some declines are healthy — proof trims are real offers; a ~0% decline rate means trims are too timid to notice |
| Boundary-confusion rate | mod tickets/DMs asking to "report" a character vs. feed dispute lines (`a housing dispute filed — <addr>`) | low; a rising ticket rate means public copy blurs the §2.6 boundary — fix copy, never open the ticket |
| Per-reviewer decision mix | shift report `by_reviewer` counts (world-v78 `reviewer_stats`) | reviewers' approve/deny/trim mixes stay within shouting distance of each other; one reviewer diverging is drift or training debt — retrain, never publicly name |
| Screen-drift gate | `devtools/screen_drift.js` permissive-gap count (world-v92) | 0 permissive gaps at merge flip; stricter gaps are tolerated, permissive ones block — currently 23 open on the game-side port |
| Hold compensation paid | ledger `compensated_cr` on `gsAdminHold` sweeps (game-v15, post-merge) | low and fully ledgered; a spike means holds are being used casually — owner reviews hold reasons, never silently |
|| Ambient pull saturation | `crowd.json.pull_protocol` claims vs caps (≤3/day each, ≤2 concurrent, ≥60 min cooldown — world-v99) | low-to-moderate; sustained saturation on one ambient = a fixation signal → `repeat-pattern` lane; coverage reads should be mostly `open`/`sign`, chronic `understudy` means the bench is over-pulled |
|| Surfacing-path audit | `opLog` journal coverage vs `present()` declared paths (memory-v105 spec v5.53) | 100% of surfaced reads carry a declared path; any unjournaled `recall` consumer is a spec violation — treat like a wire-audit fail (merge blocker, not a ticket) |

### 6a. Monthly transparency report (POLICY — template shipped v43)

`templates/transparency-report.md` is the fill-in-the-blank public report:
aggregate counts only (requests by class, denials by reason code, appeals,
flags, refunds, feed-filter suppressions), each line linkable to a wire
permalink class — never a named player, never screened text. Cadence:
monthly, first issue day-30, folded into the recap post. This is the
accountability pitch made periodic: we don't ask to be trusted, we publish
the counters.

## 7. What marketing copy may and may not claim

| May say (verifiable) | May NOT say |
|---|---|
| "Every request is screened for intent before it can run" | "Safe community" (absolute) |
| "Exclusive requests get human review" | "Reviewed within X hours" / any SLA |
| "Every paid intervention is attributed on a public feed" | "Grief-free" / "toxicity-free" |
| "Denied and expired requests refund automatically — every denial refunds in full" | "We can undo events" — no retcon exists |
| "Every denial can be appealed once within 72 hours, to a different reviewer" | "Appeals get a public hearing" — aggregate stats only |
| "A reviewer sees the same character info a possession briefing does — secrets aren't hidden, they're absent" | "Reviewers can check what the character is hiding" |
| "The 8 main characters can't be possessed by anyone, including us" | "AI characters are supervised" — they aren't, by design |
| "Request text is filtered before appearing on the public feed" | Naming the filter option until owner confirms the shipped default (§2.3) |
| "Denied request text never appears on the public feed — enforced in code and audited" | Implying approved requests are pre-scripted — the AI renders them in character |
| "Hire names are checked before they're accepted — you can't name a character after a cast member, a neighbor, or a real person" | "Names are moderated by hand" — the create-form check is code (`gsHireNameCheck`), not a reviewer |
| "Every request — and every denial — has a permalink you can link" | "Moderation is fully transparent" — individual appeals and flags stay private by design |
| "If a reviewer trims your request, it comes back as an offer — accept it at the new price or decline for a full refund. Trims only ever shrink a request, never grow it" | "Reviewers adjust your request" — the player decides; a modified offer is never auto-run |
| "Credits are charged when you file, and every path that doesn't run — denied, expired, declined-offer — refunds in full automatically" | "You only pay for approved requests" — the charge lands at declare; the net-zero is via refund, and copy must keep that ordering honest |
| "Queued requests show a live hold clock — if the hold expires before activation you get every credit back" | "Queued requests are under review" — review happens on activation; queued and in-review are different states |
| "A character can turn down a co-star request — the decline is public on the feed and half the credits come back" | "Paid requests always happen" / "characters can't refuse you" — the whole point is they can |
| "The screening engine is versioned and regression-tested — every rule ships with test cases, and the game build's classifier can only be stricter than the public reference, never looser" | Publishing the corpus or rule internals — the corpus is conformance tooling, not a public how-to-dodge list |
| "The block has its own complaint channel — disputes climb an in-world ladder and only the last rung reaches the feed, as an address, never a name" | "Report a character's behavior and moderators will act" — there is no ticket queue for the fiction; disputes resolve in-world |
| "When the feed says 'a housing dispute filed — <address>', that address is the entire public record" | Attaching names, amounts, or filers to dispute lines — the door-not-name rule is contractual, not a style choice |
| "You can check your wording before you file — the screening check is free and it's the same check a reviewer runs" | "Preview whether your request will work" — the check judges the *text's* ask, never whether the AI will do it or how |
| "Watching is identical for every age band — the paid stages are gated, and under-13s are redirected out of them" | "Family-friendly" / "safe for kids" framing — the policy is eligibility gates, not a content rating we haven't earned |
| "Co-star requests are small by design — be present, hold space, walk with, carry an item — and the character can still say no" | Implying co-star is open-ended puppeteering — the four-class taxonomy is closed, and a decline resolves with half refund |
| "Your spectator handle is checked before it's set — no cast, neighbor, or real-person names" | "Handles are moderated by hand" — `gsHandleCheck` is code, like `gsHireNameCheck` |
| "Appeals go to a different reviewer — the console won't let the same person decide twice" | "Appeals are always reversed if the first reviewer was wrong" — enforcement is procedural, outcomes still differ per case |
| "The world doesn't perform for you — viewership is never an input to the drama" | "Characters can't tell you're watching" as a mechanics claim — they can't be steered by an audience, but copy must not promise perception rules the design doesn't state |
| "Your rent, deposit, and lease are private — the only money event on the public feed is payday" | "Nothing financial is ever public" — payday is the designed public beat; the fence is category-level, not absolute |
| "The feed tells you when it's holding something back — suppressed entries have a count, not a secret" | "The feed shows literally everything" — the display filter (§2.3) still applies; the withheld-count line discloses it, never the screened text |
| "Denials and disputes stay on the record — you can look them up in the history browser after they scroll off the live feed" | "History is editable / we can correct the record" — the archive is append-only canon; no retcon exists (§2.4) |
|| "The bench can join your scene — a named neighbor can be borrowed as a co-star for 15–90 minutes, a few times a day each" | "You can book any character" — pulls are ambients only (mains are never pullable), role-bound, and no feed event names the loan; the absence note is the whole public trace |
|| "Kids in the fiction can't be pulled into anyone's request" | Implying pullable coverage is a content rating — `pack` coverage is a hard boundary, not a parental-control setting |
|| "Secrets aren't filtered out of possession briefings — the briefing can only ask for surface-tier fields, and every read is journaled" | "We audit every character's mind" — `opLog` journals what was *surfaced*, not what a character thinks; the discipline is about exposure, not surveillance |

`faq.html` and `rules.html` implement this table; if policy changes, both
pages + this table update in the same commit.

## 8. Launch wiring

- **Gate G13** (added to LAUNCH-CHECKLIST.md): owner confirms the shipped
  feed display-filter default (A — `gsWireSetFilter` flips it in one call,
  §2.3) + confirms review-inbox tooling exists in the game build before the
  demo flip (G12). `rules.html` copy stays option-neutral — it already is.
- **Day-0:** pin verbatim rules in Discord; verify `#mod-log` exists;
  confirm canned responses posted to mod channel; run `gsWireAudit()` once
  on live data and record `{ok:true}` in the rehearsal log. **Regression
  check (was a launch blocker, FIXED at art-v57):** the "Take Control"
  bypass is resolved — the rebuilt `production/hub.html` hides the
  control under SF_MODE, badges read MAIN CAST/RESIDENT, and an
  sf-harness assertion clicks the hidden button programmatically on a
  main and an ambient asserting `isNPC`/`controlledPawnIdx` never move.
  Root cause was a stale bundle, not missing code — so day-0 keeps one
  cheap check: confirm the launch build's hub is a post-v57 bundle, then
  the possession-ban copy is cleared to run verbatim.
- **Day-7:** review queue health + denial-rate first look; confirm the
  recap can quote aggregate moderation stats.
- **Day-30:** publish first transparency report
  (`templates/transparency-report.md`); mod recruitment decision; incident
  runbook retro.

## 9. Open dependencies

- ~~Review-inbox tooling~~ — DELIVERED by world-v8 as `mod-console.html`
  demo + `moderation.json` contract; remaining work is game-systems
  plumbing (queue data model, classifier wiring, SLA timers, ledger writes).
- ~~Feed display filter option (§2.3)~~ — SHIPPED by game-v6 (default A,
  `gsWireSetFilter` owner-only, `gsWireAudit` enforcement); the owner
  decision narrowed to confirm-or-flip at G13.
- ~~Admin-override compensation record~~ — DELIVERED: `gsAdminRevoke` logs
  `compensated_cr` (game-v6); compensation is a ledger fact.
- ~~Denial reason codes on feed entries~~ — DELIVERED: `feed.json` carries
  `reason_code`; public wording is the neutral "request not approved".
- Contact address for appeals — part of G6 account registration.
- ~~Naming-lane enforcement for `world/creation.json` hire names~~ —
  PARTIALLY DELIVERED: `gsHireNameCheck` (game-v8) gates hire/create names
  against cast + ambient + role words + born hires, and `billOnApproval`
  means denied applications never bill. Remaining: free-text naming strings
  inside ordinary requests still need `RWScreen` wiring at merge.
- Wire `#r=` request permalinks as transparency-report evidence — DELIVERED
  by world-v33; the day-30 report template may now link whole request
  lifecycles, not just events (§6a; template update still owed at first
  issue).
- ~~Classifier hardening vs text obfuscation~~ — DELIVERED by world-v36
  (spaced-letter collapse + `obfuscation-attempt` review code + 80-case
  corpus + G21 gate). Remaining at merge: port `screen.js` into the game
  bundle under the stricter-or-equal rule; the corpus is the conformance
  suite.
- ~~Player-facing approve-modified flow~~ — DELIVERED by world-v46 (offer
  card, accept/decline, upfront-difference refund). Remaining: game-side
  offer state in the request bus.
- ~~Onboarding moderation education~~ — DELIVERED by world-v39 (S4c
  scripted denial+refund lesson) and world-v46 demo hooks
  (`review_lesson_shown`/`review_outcome_seen` emit to `RW_DEMO_EVENTS`).
  Marketing action owed: conformance-check those event names against
  `analytics-events.json` at merge (PENDING hooks now have a producer).
- Costar-action decline semantics — DELIVERED by game-v9 (`completed` +
  half refund + feed line). No moderation action needed; §4 runbook row +
  §7 copy row added so mods don't misread declines as denials.
- Dispute/grievance feed vocabulary — PARTIALLY DELIVERED: housing lines
  (`a housing dispute filed|resolved — <addr>`, `a tenant gave notice —
  <addr>`, `neighbors comparing notes — <addr>`, kind `housing`) are
  canonical per game-v11; the work analog (`a workplace complaint
  raised|settled — <venue>`, kind `work`) is world-v59's
  `feed_shapes.work_proposal` PROPOSAL on the game track's desk — §2.6
  copy stays housing-canonical until it's adopted. §6a report may count
  dispute lines as a *world* stat, never as moderation actions.
- Merge plumbing status — production-1 merged as baseline 7eb476a
  (marketing v84 + game v11 + world v58 + integration fixes). The §2.2
  PENDING list stands: live queue data model, `RWScreen` port under the
  stricter-or-equal rule, `mod_decision` ledger writes per world-v64's
  `ledger_records` shape. Write verb is `gsSubmitRequest` (game-v12);
  the world-side `live_seam.never` doc still names `gsRequestSubmit` —
  flagged by the game track for world to align, not a code defect.
- ~~Possession-ban UI hole~~ — FIXED (`production-feedback` resolved):
  stale-bundle root cause; art-v57 rebuilt `production/hub.html` with
  the control hidden, badges corrected, and a harness assertion that
  the ban holds even against a programmatic click on the hidden
  control. §8 day-0 downgraded to a regression check.
- Review-queue merge contract — `moderation.json.review_locks`
  (world-v78): claims are SSO-keyed, short-lived, auto-claimed by
  `decide()`, and never touch the request's expiry/refund clock;
  `orig_reviewer` identity is required on appeal decisions. At merge
  the game-side queue must honor both — no schema invention needed, the
  blocks are already contractual.
- Economy feed fence — game-v13's `econ` category makes payday the only
  public money beat and marks `gsEcon*` owner-side INTERNAL. At merge,
  no spectator surface may wire `gsEconTick/Books/Arrears/Payroll/Stub/
  Audit` — same class of gate as world-v61's no-buy-verb wire rule.
- Age-band merge — `onboarding.json.age_band` bands exist in the world
  contract (v67); at merge the band must come from the account record,
  not per-session self-pick (world's own merge note). Marketing's
  "identical for every band" line is safe now; any band-specific watch
  surface would retire it.
- Camera-pass moderation — game-v12's `camera` bus action is compatible
  class (claims nothing, 10 cr/30 min) and files through the same
  screened pipeline at the Counter; the wire itself stays purchase-free
  (world-v61 gate). No new policy needed — §2.1 compatible rule covers it.
- Live review seam — world-v92's Mod Console v5 maps
  `gsReviewQueue`/`gsReviewResolve`/`gsEscalateLegal`/`gsModMetrics`/
  `gsFlagStatus`/`gsRepLedger`/`gsPossessionBriefing` verbatim off the
  game-v14 bridge. Remaining: `review_locks.merge_target` — bus-side
  lock claims are still a game-systems TODO; console claims stay
  session-local until then. No schema invention needed.
- ~~Classifier port conformance~~ — now executable, not aspirational:
  `devtools/screen_drift.js` (world-v92) is the drift gate; current
  report 23 permissive gaps on the game-side port (normalization +
  lexicon generation owed). Rule unchanged: stricter-ok,
  never-more-permissive. A red drift report blocks the live-queue
  flip — §4 runbook row + §6 metric added.
- Civic vocabulary — game-v15 (`41_game_systems_civic.js`) shipped
  holds/quiet-hours/zones/`cohost` on sf/game-systems but is NOT in
  the production-1 baseline (game pinned v11). Internal runbook rows
  and metrics documented (§4, §6); §7 public copy deliberately has no
  civic claims — add them only post-merge, same gate as the demo page.
- Surfacing-path merge contract (memory-v105, spec v5.53) — at merge,
  `present(charId, C, path, budget)` must be the ONLY consumer of
  `recall` output for any surfaced content (prompts, dialogue,
  possession briefings, spectator feed, probes); each call declares its
  `path`, and possession briefings receive surface-tier fields only.
  `opLog` is the hash-chained audit journal; `canon_day_bound` caps the
  permastore. Missing implementation degrades to missing audit, never
  wrong behavior — but §7's journaled-reads copy line stays quoted to
  spec until the journal actually ships.
- Request-class declarations (world-v97) — every game-side request kind
  must declare its `world_requests.classes` class at build time
  (world-bound / thin-bounded / brain-bound / possession); undeclared
  defaults to brain-bound. Marketing §7 must not promise any request
  kind "always runs" until classes are declared — a world-bound ask can
  legitimately wait out a degraded window.
- Ambient pull claims (world-v99) — a `pull_protocol` pull claims an
  ambient id shaped like the existing resource claims and files through
  the §11 exclusive lane; game-systems must honor the caps (15–90 min,
  ≤3/day each, ≤2 concurrent, ≥60 min cooldown, `pack` never pullable)
  and the feed-silence rule (no event names the loan — coverage is the
  only trace). §7's bench copy is safe now; any future feed-visible
  pull would retire the "absence note is the whole trace" clause.
- Lease counter-paper (world-v96) — `feed_wording.never` +4
  (`buyout_offers`/`assignments`/`prepayments`/`history_letters`) and
  ledger legibility codes `BUYOUT`/`NOFAULT` must be kept verbatim at
  merge; §7's rent-privacy row now covers those four classes.
- Playtest-finding pipeline (world-v93) — moderation-surface defects
  (screen holes, feed wording leaks, refund edges) should be filed as
  `[world-playtest-finding]` blocks with a triage status so §9 items
  can cite findings, not vibes. No code dependency — a convention.
