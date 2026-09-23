# Moderation Tooling — spec & reviewer runbook (world v8; v22 adds Screen Lab)

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

## 9. Screen Lab + golden corpus (v22)

`world/screen-lab.html` is the screening workbench. Two surfaces:

- **Try a request** — compose any request (action, target, text, exclusive
  flag, player-history signals) and watch `RWScreen.screenRequest` verdict,
  code, route, canned player copy, feed wording, flag weight, and the full
  per-rule trace. A toggle shows the **normalized input** the engine actually
  matched (v22 normalization: leet chars adjacent to letters decode —
  `p0ss3ss`→`possess`; dotted-letter runs collapse — `p.a.y`→`pay`. Real
  strings like `9457 Guerrero`/`Unit 3B` are untouched).
- **Golden corpus** — runs every case in `world/screen-corpus.json`
  (mirrored inline, hand-synced per convention) and diffs expected vs
  actual verdict+code. 50 cases: every reason code ≥3, near-misses that
  must NOT trip, precedence pins (first-match-wins; rules beat history).
  Report exports as JSON — attach it to any rule change.

**Regression discipline:** a rule edit and its corpus run land in the same
commit; green or the expectations change with it. The corpus doubles as the
conformance suite for the game-track port — a stricter verdict on identical
input is acceptable, a more permissive one is a bug.

v22 engine hardening (found BY the corpus, kept honest by it): word-form
stems (`humiliates`, `confesses`, `k1ll`), `get <name> fired/evicted`
patterns, leet/dotted-letter evasion. All 50 cases green; v8 mod-console
seed texts verified unchanged.

## 10. v36 — evasion round two, calibration, flags, transparency

**Spaced-letter evasion (engine v36).** The cheapest remaining evasion was
spacing letters out: `p o s s e s s Victor`, `m a k e  h e r  c r y`. The
normalizer now collapses runs of ≥3 single-letter tokens **in place**, so a
decodable evasion still hits the real rule (`p o s s e s s Victor` →
`possess Victor` → possession-scope deny — not a lesser charge). A run no
rule can read is itself the signal: new review-tier code
`obfuscation-attempt` routes it to a human, who sees the collapsed text in
the trace. `Unit 3B`, `a, b, and c`, and comma-separated singles never form
a run — pinned by near-miss cases.

**Corpus 70 → 80.** Ten cases: five evasion-deny pins (harm ×2, possession,
legal, admin-domain), three obfuscation-attempt routes, two near-misses.
The audit's new `mod` gate diffs the inline corpus in screen-lab.html
against `screen-corpus.json` case-for-case — the hand-sync convention is
now enforced, closing the drift hole the maintenance notes called out.

**Reviewer calibration (Screen Lab v2).** A training surface under the
corpus runner: the corpus deals 12 shuffled cases blind — no expected
verdicts — and the trainee calls verdict + code on each. The scorecard
reports verdict agreement, code agreement, and a per-case diff table with
each case's "why it exists" note; exports JSON. Scoring is agreement with
the contract, not judgment: new reviewers run it before touching the live
queue; everyone re-runs after a rule change. Persistent disagreement is a
coaching item, never a player-facing one.

**Flag ledger (Mod Console v2).** `PLAYERS` now carries `flag_score` +
`flag_log`; the context card shows the rolling score, the active tier
(3 → human-review 7 d · 6 → suspend 72 h · 9 → owner review), the next
threshold, and the −1/30 d decay rule. `decide()` routes deny flag_w
through `bumpFlag()` — crossing a tier is called out in the audit line.
Thresholds mirror `moderation.json account_flags`, no numbers invented.

**Shift report (Mod Console v2).** A header "shift report" toggle opens an
**aggregate-only** transparency panel: requests screened, approve/modified/
denied + deny rate, per-code counts, appeals filed/reversed as counts only,
median decision vs the 15-min target, compensation cr paid, flag weight
issued, corpus green at engine version. Seeded 30-day baseline + live
session decisions folded in; exports JSON. Rule: never request text,
handles, or individual appeals — `appeal_flow.feed_visibility` is
"aggregate only", and this is the studio-side source for the monthly
public recap marketing's transparency template expects.
