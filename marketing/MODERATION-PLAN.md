# Moderation Plan — Real World ("The Mission")

**Version:** v43 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
(v13: first canonical plan; v28: aligned to the world track's shipped
moderation contract — see §2.0; v43: aligned to game-v6's shipped wire
display filter + world-v18/v19 surfaces — see §2.3.)
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
  defers to: 7 deny + 7 review reason codes (with flag weights, refund rules,
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
`first-time-exclusive` (acct < 3 days old filing an exclusive).

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
   by keeping money.
2. **Context panel — DELIVERED.** Player card (history, deny count,
   same-target count, flags, tier) + character card built from the reviewer
   whitelist — the SAME schema as possession briefings (`name, age, job,
   home_address, public_profile, surface_relationships, routine`). Secrets
   aren't redacted; they're absent from the schema entirely.
3. **Reason codes — DELIVERED, expanded.** Canonical taxonomy in §2.1
   (7 deny + 7 review codes) replaces the v13 four-code enum. `policy-other`
   is retired — if a deny doesn't fit a code, the code list is wrong, not
   the request.
4. **Queue depth alert — DELIVERED as spec.** Threshold 20 pending → owner
   alert; wait display amber >15 min, red >30 min; **never auto-approve to
   drain a queue** (in `moderation.json`, not just convention).
5. **Audit — DELIVERED as spec.** Every decision logs timestamp, reviewer,
   request id, outcome, code; merge target is canonical-ledger
   `mod_decision` records (game-systems owns the ledger writes).

Still PENDING (game-systems plumbing at merge): the live queue data model,
classifier wiring into `41_game_systems_requests.js`, SLA timers, and
`mod_decision` ledger writes. Delivered since v28: the feed display filter
(§2.3) and admin-compensation ledgering (`compensated_cr` on
`gsAdminRevoke`, game-v6). The console demo defines expected review
behavior; `RWScreen` verdicts are the reference outputs.

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
monetized around, never appear on the feed. The marketing-relevant property:
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
  relationships, routine only.
- Offline player-characters drop to thin AI; possession is a session, not an
  ownership stake in a mind.
- Moderation relevance: a possession request is still a *request* — duration
  declared upfront, hard cap, classified, screened. "Possess my character and
  have them burn down the restaurant" fails intent screening at the text
  stage even though possession itself is legal.

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
| Naming-lane abuse | Offensive hire name / plaque string | Naming lane deny via `identity-fraud`/`legal-backstop` as applicable; string never reaches the world | No |
| Credit scam in Discord | "selling credits" posts | Instant ban + pinned PSA reminder credits are non-transferable | No |
| Doxxing attempt (mapping fiction → real door) | Member posts real-address guesses | Instant ban, delete content, note in #mod-log | Owner informed after |
| CSAM/illegal request text | Classifier flags legal-backstop | Escalate-legal: kill pre-run or mid-flight, account flag +3, owner notified, ledger legal-deny; public wording identical to a normal deny; owner decides legal reporting | Yes — immediately |
| Review queue collapse (owner AFK) | Pending exclusive requests expire+refund | Working as designed — refunds are the backstop; no emergency tooling needed | Post-hoc only |
| Feed text-filter bypass | Profanity/PII renders on public feed | Option-A redact retroactively if supported; else owner hide; fix filter | Yes |
| Coordinated raid on Discord | Mass join + spam | Verification gate (pre-approved addition), timeouts, recap honesty next post | No |
| Press asks "can players do anything horrible?" | Interview question | Answer with the pipeline: screened intent, human review, attribution, hard caps — pitch is transparency, not promises | Prepared quote in PRESS-OUTREACH.md |

## 5. Appeals & refunds (requests) — aligned to `moderation.json` appeal_flow

- Denied at screening/review → **always refunded, every deny** (credits never
  move on a denial). The v13 deny-no-refund carve-out is retired; repeat
  abuse is deterred by account flags (§2.4a), which cost privileges rather
  than money.
- Queued-and-expired → auto-refunded (design §5, LOCKED).
- Approve-modified → unused credits auto-refund; trim-only, logged.
- Admin override of an active request → affected players compensated (§3).
- **Appeal window 72 h**, routed to a **different reviewer** — the console
  shows the original reviewer id on the appeal card so the rule is checkable.
  Overturned requests re-enter the pipeline post-review at no re-charge; a
  second denial is final for that request text. Not appealable:
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

`faq.html` and `rules.html` implement this table; if policy changes, both
pages + this table update in the same commit.

## 8. Launch wiring

- **Gate G13** (added to LAUNCH-CHECKLIST.md): owner confirms the shipped
  feed display-filter default (A — `gsWireSetFilter` flips it in one call,
  §2.3) + confirms review-inbox tooling exists in the game build before the
  demo flip (G12). `rules.html` copy stays option-neutral — it already is.
- **Day-0:** pin verbatim rules in Discord; verify `#mod-log` exists;
  confirm canned responses posted to mod channel; run `gsWireAudit()` once
  on live data and record `{ok:true}` in the rehearsal log.
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
- Naming-lane enforcement for `world/creation.json` hire names (500 cr hire
  flow from world-v7 routes through the naming lane — confirm game plumbing
  wires it at merge).
