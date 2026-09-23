# Moderation Tooling — spec & reviewer runbook (world v8)

The reviewer-facing half of the design doc §11 pipeline. Companion artifacts:

- `world/mod-console.html` — working demo of the review queue (file://-safe,
  seeded, every lane reachable). Open it; every state below is reachable in it.
- `world/screen.js` — shared intent-screening engine (`window.RWScreen`).
  Reference implementation of the §3 contract; `request.html` and
  `mod-console.html` both call it, so player-side and reviewer-side verdicts
  can never drift.
- `world/moderation.json` — machine-readable contract: reason codes, queue
  routing, SLA, whitelist, appeal flow, account-flag thresholds.
- Policy source of truth: `world/moderation-notes.md` (§11 enforcement).
  Community/chat moderation is marketing's lane (COMMUNITY-FUNNEL §6 +
  MODERATION-PLAN.md) — this file is request-pipeline only.

## 1. Scope (restated, locked)

Moderation applies ONLY to player requests (intent screening) plus a legal
backstop. Emergent AI behavior is inviolable. The console has **no "report
the AI" surface** and cannot touch the world outside the request path. If a
character does something the writers should see, that's a logged incident for
the writers' room — not a moderation action.

## 2. The console views

| View | Contents | Notes |
|---|---|---|
| Queue | lanes: All / Exclusive / Gray-zone / Appeals / Naming / Legal; per item: id, player, action→target, screen verdict, credits, wait clock | sorted oldest-first; wait goes amber >15 min, red >30 |
| Request detail | structured request object, claims/conflict state, free text, live classifier trace (matched rule + hit string), decision bar | trace re-runs `RWScreen.screenRequest` live — reviewers see the same mechanics players hit |
| Context panel | player card (history, deny count, same-target count, flags, tier) + character card | character card = whitelist fields only (§4) |
| Audit log | every decision this session: timestamp, reviewer, request id, outcome | merge target: canonical ledger `mod_decision` entries |

Metrics strip: queue depth (alert >20), oldest wait (amber >15 m, red >30 m),
median decision time vs 15-min SLA, decisions this shift.

## 3. Reason-code taxonomy

Machine-readable in `moderation.json`. Summary:

**Deny tier** (hard block, auto-refund, no human needed):
`harm-targeting` · `secret-extraction` · `possession-scope` · `admin-domain`
(rent/evictions/leases are admin-only — added v8; covers the "nudge Victor to
raise rent" class) · `real-business` · `identity-fraud` · `legal-backstop`.

**Review tier** (human queue): `gray-zone` · `surface-relationship` ·
`venue-lock` · `repeat-pattern` · `real-person-mention` · `appeal-resubmit` ·
`first-time-exclusive`.

Player-facing wording is per-code and lives in the taxonomy — reviewers pick
a code, never free-type player copy. Public feed always shows the neutral
`"request not approved"` regardless of code (no spectacle, no appeal theater).

## 4. The whitelist (structural, not procedural)

The reviewer character card is built from the SAME schema whitelist as
possession briefings: `name, age, job, home_address, public_profile,
surface_relationships, routine`. SECRETS and drama-seed fields are not
"hidden" or "redacted" — they are **not in the reviewer schema at all**.
One whitelist enforced once, reused for briefings, console, and any future
mod surface. The demo renders a black bar labeled "Not redacted — absent" to
make the construction visible.

## 5. Decisions & appeals

- **Approve** → injects as opportunity; the character's AI decides how.
  Attribution goes to the public feed.
- **Approve-modified** → duration/scope trimmed; unused credits auto-refund;
  the modification is logged (rare — resolve ambiguity against the player).
- **Deny** → reason code → canned player copy + full refund. Never bill a
  denied request.
- **Escalate legal** → kill (pre-run or mid-flight), account flag +3, owner
  notified, ledger `legal-deny`. Public wording identical to a normal deny.
- **Appeals** (72 h window) route to a **different reviewer** — the console
  shows the original reviewer id on the appeal card so the rule is checkable.
  Overturned requests re-enter the pipeline post-review at no re-charge.
  A second denial is final for that request text.

## 6. Account flags

Deny verdicts carry a `flag_w` (0–3). Thresholds (PROPOSAL, in
`moderation.json`): score 3 → all requests human-reviewed 7 d; 6 → request
privileges suspended 72 h; 9 → account review (owner decision). Flags decay
−1 per clean 30 days. Flags exist to catch fixation/abuse patterns early —
they are never shown publicly and never monetized around.

## 7. Reviewer runbook (the 90-second version)

1. **Read the stated intent, not the imagined outcome.** "Make it rain so
   the picnic fails" screens the *stated* intent; whether a picnic exists is
   the AI's business. Approve asks, deny cruelty.
2. **Check the lane.** Exclusive = mechanical review of claims + text.
   Gray-zone = the classifier saw charged wording; look for cruelty framing.
   Appeals = different-reviewer rule + is the text substantially new?
   Naming = string screen only. Legal = confirm or bounce; never improvise.
3. **Glance at context, not into it.** Repeat-target counts matter
   (`repeat-pattern`); the rest is color.
4. **When in doubt, approve-modified or deny with the softest true code.**
   The refund is automatic; the player's dignity is the product.
5. **Never** use the console to peek at, hint at, or affect drama seeds —
   they aren't in your schema; if you ever see one, that's a bug to file.

## 8. What the game track owns at merge

The queue data model, classifier plumbing, ledger writes, and SLA timers are
game-systems plumbing (`41_game_systems_requests.js` claims matrix already
exists on that branch). This version's contract points:

- `RWScreen.screenRequest` verdicts are the expected outputs for identical
  inputs — the game classifier should at minimum never be *more permissive*.
- Queue items carry `lane` derived per `queue_routing` in moderation.json.
- Feed wording comes from `reason_codes.*.feed` — never reviewer free text.
- Audit log entries become canonical-ledger `mod_decision` records.
