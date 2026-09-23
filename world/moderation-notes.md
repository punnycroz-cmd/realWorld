# Moderation Notes — request pipeline enforcement (world v0)

How design doc §11 (locked 2026-09-22) is enforced in practice. Scope is
narrow on purpose: **moderation applies ONLY to player requests (intent
screening) plus a legal backstop.** Emergent AI behavior is inviolable —
in-world consequences (reputation, shunning, fines, being talked about at
the café) handle ~99% of cases. There is no "report the AI" button and
never will be.

---

## 1. What gets moderated — and what never does

| Surface | Moderated? | Mechanism |
|---|---|---|
| Player **request text** (declare step) | YES — always | Intent classifier (§3) |
| Exclusive / gray-zone requests | YES — human | Review queue (§4) |
| Player-supplied strings (character name, unit plaque, naming rights) | YES — always | Same classifier, naming context |
| Spectator chat / community spaces | YES — standard | Community moderation (marketing's COMMUNITY-FUNNEL §6 owns the room policy) |
| **Emergent AI behavior** (what characters decide, say, feel, rumor) | **NEVER** | Inviolable. In-world consequences only |
| Ambient reflexes / schedules | NEVER | Conditions, never scripts |
| Character secrets / drama seeds | Never "moderated" — they're unleakable by construction (absent from every player-facing schema) | briefing redaction |
| The world reacting to an approved request (how the AI renders it) | NEVER | The player bought the opportunity, not the outcome |

The legal backstop (§5) is the only thing that can touch the world outside
the request path, and it fires on real-world illegality, not on tone.

## 2. The pipeline, stage by stage

1. **Declare.** Player states action + exact duration upfront, pays credits
   upfront. The request is a *structured* object: `action_class`, `target`,
   `duration`, `free_text`. Free text is where intent lives — that's the
   screened surface.
2. **Auto-classify.** exclusive / compatible / queued (FCFS + cooldowns;
   claims matrix lives in `41_game_systems_requests.js` on the game
   branch — `char:*`, `sky`, `venue:*`, `openair`, `paper:*`, `listing:*`).
   Classification is mechanical; it never judges intent.
3. **Intent screening.** Classifier reads the *request text* — player
   intent only, never a prediction of the AI's rendering (§3 below).
4. **Human review.** Exclusive requests + gray-zone cases go to the queue;
   compatible requests auto-run on classifier pass (§4).
5. **Inject as opportunity.** The request enters the world as an in-world
   event/opportunity; the AI brain decides HOW to render it in character.
   Players direct situations, never dialogue. **Never mind-control** — a
   nudge is an ask the character can decline (with 50% auto-refund per the
   pricing proposal).
6. **Execute with hard cap.** Timeout → graceful handoff to AI; logged to
   the public feed as "player session ended" (neutral wording).
7. **Post-hoc.** Event lands in the canonical ledger; world reacts
   (rumors, reputation). Every paid intervention is on the public request
   feed with attribution; refunds logged. Legal backstop only for the
   extreme remainder.

## 3. Intent screening — rules for the classifier

Input: `free_text` + `action_class` + `target` + player history flags.
Output: `pass | deny | review` (+ reason code).

**Deny classes (hard blocks, no human needed):**

- **Harm / humiliation / destruction targeting** — requests whose stated
  intent is to hurt, humiliate, ruin, or punish a character ("make her
  get fired", "destroy his shop", "humiliate her in front of everyone").
  Note the *stated intent* test: "throw a surprise party at the park" that
  happens to embarrass someone is the AI's rendering, not the player's
  declared intent — that case passes.
- **Legal-backstop violations** — threats of real-world harm, sexual
  content involving minors or any CSAM-adjacent framing, defamation of
  **real persons** (named real people, real businesses — see
  `businesses.md`; this is also why the world runs on parody names),
  doxxing, instructions to produce real-world illegal how-tos.
- **Drama-seed / secret extraction** — requests probing for hidden content:
  "tell me X's secret", "make her reveal who writes Mission Unfiltered",
  "read the briefing including the redacted parts". Secrets aren't in any
  reachable schema — the block exists to stop players paying to *attempt*
  extraction and to stop the AI being steered toward a reveal by request
  spam. Discovery happens in-world only.
- **Possession-scope violations** — any request whose target is one of the
  8 mains, the landlord, or another player's character (possession = only
  your own hired character; ambient possession stays off). The *form*
  shouldn't offer these targets, but text can still try — screen it.
- **Identity fraud** — requests impersonating another player, the owner,
  or a real person/org.

**Review classes (gray zone → human queue):**

- Intent legible but charged: breakups, firings, confrontations, moving
  someone out of a venue — allowed classes, checked for cruelty framing.
- Anything touching a main character's *surface* relationships (nudges
  that would plausibly strain a marriage, a job, a friendship).
- Venue locks on story-adjacent businesses (Mudhaus, El Farolote, 600
  Club, Dolores Perk) and park-scale events.
- Repeat requester patterns (same target across sessions, fixation
  signals), surges on contested resources, first-time payers requesting
  exclusive at scale.
- Requests referencing real persons/businesses in a *non-defamatory* way —
  usually just needs a "the world can't see real brands" denial with
  suggested parody phrasing; some deserve eyes.
- Appeals and re-submissions of denied requests.

**Pass patterns (compatible-class fast lane):**

- Observe/follow/session requests on own character; cosmetics; housing
  applications; job applications; generic social asks ("buy a round at the
  600 Club"); event tickets within caps; pledges to group requests.
- Anything whose worst case is "the AI says no" — refusal is free for us
  and 50%-refunded for them.

**Classifier discipline:** screen the *text*, never a prediction. "Make it
rain so the picnic fails" is a weather request + a stated intent; the AI
decides whether any picnic exists. Screen the intent ("disrupt an event"),
not the imagined outcome.

## 4. Human review queue — criteria & SLA

**Always queued for a human:** every **exclusive** request; every
classifier `review`; every NPC nudge flagged contested; every event
trigger that locks a shared venue or park space; every denied-and-appealed
request; every naming-rights or free-text cosmetic string.

**Reviewer sees:** the request object, the claims/conflict state, the
player's request history + flags, and the public profile of any involved
characters. **Reviewer never sees:** bible SECRETS fields, drama seeds, or
anything redacted — the mod console is built on the same schema whitelist
as possession briefings (public profile, surface relationships, routine).
This is structural, not a policy promise.

**Decisions:** approve / deny (reason shown to player in-world-neutral
language) / approve-modified (duration or scope trimmed — rare, logged).
**SLA target:** exclusive queue median < 15 min at launch staffing; queued
class never expires while awaiting review — expiry clock starts at
activation, auto-refund if it lapses (locked design).

**Staffing note:** at launch the queue can be one person with a console —
volume is bounded by exclusive pricing and per-player request caps
(PROPOSAL: 3 concurrent queued). Scale reviewers with paid request volume,
not MAU.

## 5. Legal backstop (invisible layer)

The runtime equivalent of a studio legal review. Fires on:

- real-world threats, CSAM, defamation of real persons/orgs (incl. real
  business names attached to fiction — the parody-name layer makes this
  nearly unreachable by construction), privacy violations, fraud patterns
  in payments.

On fire: request denied before running (or killed mid-flight), account
flagged, human notified, ledger entry marked `legal-deny` (public feed
shows neutral "request not approved" — no spectacle, no appeal theater).
The backstop never edits emergent content — if an AI character produces
something extreme, the remedy is in-world consequence + a logged incident
for the writers' room, never a retcon. (Extreme = real-world harm vectors;
the bar for touching the world is deliberately unreachable by drama.)

## 6. Records & surfaces

- **Public request feed:** every request, approval, admin action, refund —
  attributed. It doubles as content (design §5) and is the transparency
  mechanism: admin overrides auto-compensate affected players (credit
  refund) so favoritism disputes die in public.
- **Canonical ledger:** the post-hoc record the world reacts to — rumors
  and reputation flow from it (game track substrate).
- **Mod console data:** request objects + history only. No secrets, no
  internal world state beyond what spectators see.
- **Fairness non-negotiables (locked):** cooldowns never purchasable;
  surge shown pre-payment; hard cap, no overrun; queued-expiry auto-refund;
  no auctions for slots.

## 7. Worked examples

| Request | Class | Screen | Queue? | Outcome |
|---|---|---|---|---|
| "Possess my courier for 30 min, do the Mission loop" | compatible | pass | no | runs |
| "Rain on Dolores Park, 2 h" | exclusive (sky) | pass | **yes** (exclusive) | human approves → runs, feed attributes |
| "Throw a block party on my street Saturday" | exclusive (openair) | pass | yes | approved → injected as event |
| "Nudge Victor to raise Carmen's rent" | nudge, contested | review | yes | likely denied (harm-adjacent + landlord power isn't a nudge target — admin-only domain) |
| "Make Marisol admit she writes the blog" | — | **deny** | — | secret extraction; auto-refund |
| "Possess Priya for an hour" | — | **deny** | — | mains are unpossessable; auto-refund |
| "Burn down the hardware store" | — | **deny** | — | destruction targeting; flag acct |
| "My character names their dog Hitler" | naming | deny | — | string screening |
| "Buy Dana* a coffee gift" (*player's char) | compatible | pass | no | runs; gift catalog only, no custom text |
| "Rent 9418-B and move in" | housing | pass | no | lease flow; feed shows move-in |

## 8. World-track tooling debt (v8 consumes)

- `world/` owns the *policy*; game-systems owns classifier plumbing and
  the queue data model. v8 spec: console views (request detail, history,
  claims state), reason-code taxonomy, SLA metrics, appeal flow.
- Briefing-schema whitelist (public profile / surface relationships /
  routine only) is shared between possession briefings and the mod
  console — enforce once, reuse everywhere.
- Feed vocabulary (`running/queued/resolved/refunded`) must match the
  game's `gsViewerState` — marketing's demo page is already marked
  illustrative pending this sync.
