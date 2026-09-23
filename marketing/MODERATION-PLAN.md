# Moderation Plan — Real World ("The Mission")

**Version:** v13 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Authority:** design doc `rw-game-design-2026-09-22.md` §5 (participation),
§7 (possession), §8 (anti-grief), §11 amendment (request moderation pipeline —
user-locked). Community scope spec'd in COMMUNITY-FUNNEL.md §4, which this
document now supersedes as the canonical reference (§4 there summarizes and
points here).
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

### 2.1 Blocked-category definitions (moderator-facing)

The classifier and human reviewers apply these definitions — deliberately
written so "is this targeting harm?" is decidable in under a minute:

- **Targeting harm/humiliation/destruction** — the request's *stated intent*
  is to make a specific character suffer, be humiliated, or have their life
  destroyed. "Rain on the block party" passes (weather is world-scale).
  "Make Jules's landlord evict her" fails (targeting + the landlord is an
  admin function anyway). Test: would the reasonable reader call this
  bullying a fictional person as the point of the request?
- **Legal backstop** — threats of real-world harm, CSAM or sexual-content
  requests (characters are adults; the category is still zero-tolerance),
  defamation of *real* persons (the address system exists precisely so no
  fictional address maps to a real door — requests trying to break that
  mapping, e.g. "put a fake business at <real home address>", fail here).
- **Secret extraction** — any request whose text aims to surface drama seeds
  or redacted briefing content ("tell me what Sanna is hiding"). Always
  denied; secrets are learned by watching, like any viewer.

**Not moderated (LOCKED):** compatible requests auto-run on classifier pass —
a request to buy two characters dinner together is the best multiplayer in the
game and must never wait on a human. Emergent outcomes: if an approved request
produces an ugly scene, that scene is canon; the remedy was upstream.

### 2.2 Human review queue — owner tooling spec (SPEC)

At launch the owner *is* the review queue (28 characters, indie scale — a
single reviewer is honest, not a weakness; we say so publicly). Tooling needed
from game-systems, in priority order:

1. **Review inbox** — pending exclusive/gray-zone requests, sorted by paid-at
   timestamp. One-screen decision: approve / deny+refund / deny-no-refund
   (deny-no-refund reserved for repeated blocked-category submissions; first
   offense always refunds).
2. **Context panel** — requester's history (approved/denied ratio), resource
   contested, cooldown state, surge multiplier applied.
3. **Decision reason codes** — a fixed enum (`harm-targeting`,
   `legal-backstop`, `secret-extraction`, `policy-other`) attached to the
   feed's denial entry so the public sees *why* class, not just that.
4. **Queue depth alert** — if pending reviews exceed a threshold the owner
   sets, the site/pricing copy already warns that exclusive requests take
   review; never auto-approve to drain a queue.

**Honest-SLA rule:** copy may say "exclusive requests are reviewed by a
human before they run." Copy must never promise a review *time* — a queue
that pauses overnight is a feature of an honest small studio, not an SLA
breach. Queued/under-review requests that expire before activation are
auto-refunded per §5 — the refund system absorbs review latency.

### 2.3 Public feed display filter (OWNER-DECISION — open)

The request feed is public marketing surface AND accountability layer.
Requester-supplied text needs a display-side pass (profanity / hate / PII /
link spam) before render — separate from the intent classifier, which judges
intent not wording.

Options for the owner at game-build time:

| Option | Behavior | Trade-off |
|---|---|---|
| **A. Redact** (recommended) | Feed shows request with offending span replaced by `░░░` + `text-filtered` flag | Preserves transparency + attribution; slight legibility cost |
| **B. Withhold** | Flagged requests don't display their text; feed entry shows class + outcome only | Cleaner feed; hides what was attempted — weakens the "half the show is the attempt" pitch |
| **C. Quarantine** | Flagged text held for human review before display | Highest quality; adds review load to free content — poor trade at launch |

Marketing copy must work under any option: site says "request text is filtered
before it appears on the public feed" — true under A/B/C.

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
| Grief request wave | Review queue fills with same-target requests | Cooldowns engage automatically; deny category-matching requests with refund; note on feed is public | No — ladder runs itself |
| Credit scam in Discord | "selling credits" posts | Instant ban + pinned PSA reminder credits are non-transferable | No |
| Doxxing attempt (mapping fiction → real door) | Member posts real-address guesses | Instant ban, delete content, note in #mod-log | Owner informed after |
| CSAM/illegal request text | Classifier flags legal-backstop | Deny no-refund, preserve record, owner decides legal reporting | Yes — immediately |
| Review queue collapse (owner AFK) | Pending exclusive requests expire+refund | Working as designed — refunds are the backstop; no emergency tooling needed | Post-hoc only |
| Feed text-filter bypass | Profanity/PII renders on public feed | Option-A redact retroactively if supported; else owner hide; fix filter | Yes |
| Coordinated raid on Discord | Mass join + spam | Verification gate (pre-approved addition), timeouts, recap honesty next post | No |
| Press asks "can players do anything horrible?" | Interview question | Answer with the pipeline: screened intent, human review, attribution, hard caps — pitch is transparency, not promises | Prepared quote in PRESS-OUTREACH.md |

## 5. Appeals & refunds (requests)

- Denied at screening/review → **always refunded** (credits never move on a
  denial), except `deny-no-refund` for repeated blocked-category abuse
  (second+ offense only, reason-coded).
- Queued-and-expired → auto-refunded (design §5, LOCKED).
- Admin override of an active request → affected players compensated (§3).
- A denied requester may refile with different text — the feed will show both
  attempts. One appeal per denial to the owner; outcome is final and public
  in aggregate only ("3 denials appealed this month, 0 reversed" — a recap
  stat, not a per-person thread).

## 6. Metrics (feeds ANALYTICS.md weekly report)

| Metric | Source | Healthy direction |
|---|---|---|
| Review queue depth + median decision age | review inbox | depth < owner's daily capacity |
| Denial rate by reason code | feed `denied` entries | stable; spikes = copy is promising wrongly |
| Refund rate (queued-expired) | ledger | low; high = queue/classification oversubscribed |
| Deny-no-refund count | #mod-log | near zero |
| Community ladder actions | #mod-log | warns >> timeouts >> bans |
| Feed-filter flag rate | display filter | low; spikes = coordinated test or broken filter |

## 7. What marketing copy may and may not claim

| May say (verifiable) | May NOT say |
|---|---|
| "Every request is screened for intent before it can run" | "Safe community" (absolute) |
| "Exclusive requests get human review" | "Reviewed within X hours" / any SLA |
| "Every paid intervention is attributed on a public feed" | "Grief-free" / "toxicity-free" |
| "Denied and expired requests refund automatically" | "We can undo events" — no retcon exists |
| "The 8 main characters can't be possessed by anyone, including us" | "AI characters are supervised" — they aren't, by design |
| "Request text is filtered before appearing on the public feed" | Naming the filter option until owner decides (§2.3) |

`faq.html` and `rules.html` implement this table; if policy changes, both
pages + this table update in the same commit.

## 8. Launch wiring

- **Gate G13** (added to LAUNCH-CHECKLIST.md): owner picks feed-display
  option A/B/C (§2.3) + confirms review-inbox tooling exists in the game
  build before the demo flip (G12). Until G13 is decided, `rules.html`
  copy stays option-neutral — it already is.
- **Day-0:** pin verbatim rules in Discord; verify `#mod-log` exists;
  confirm canned responses posted to mod channel.
- **Day-7:** review queue health + denial-rate first look; confirm the
  recap can quote aggregate moderation stats.
- **Day-30:** mod recruitment decision; incident runbook retro.

## 9. Open dependencies

- Review-inbox tooling (§2.2) — game-systems build item; until then the
  owner reviews via whatever feed view exists.
- Feed display filter option (§2.3) — OWNER-DECISION.
- Denial reason codes on feed entries (§2.2 item 3) — game-systems; recaps
  want them for aggregate stats.
- Contact address for appeals — part of G6 account registration.
