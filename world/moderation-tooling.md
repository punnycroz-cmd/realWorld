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

## 11. v50 — evasion round three: separators + accent fold

**Separator-generalized runs (engine v50).** v36 caught letters spaced out;
the same trick with any other separator was still open. Runs of ≥3
single-letter tokens joined by hyphens, underscores, asterisks, slashes, or
spaces — mixed allowed — now collapse in place exactly like v36 spaces:
`p-o-s-s-e-s-s Victor` → `possess Victor` → possession-scope deny, not a
lesser charge. A run no rule can read still routes to a human as
`obfuscation-attempt`. Multi-letter chunks never form a run — `co-op`,
`e-mail`, `Unit 3-B`, and `bi-rite` itself are untouched (pinned by
near-miss cases SC88/SC89). The real-business rule also learned the
unhyphenated collapse: `bi[- ]?rite` reads `birite` the same as `bi-rite`.

**Accent fold (engine v50).** Diacritics were a free evasion —
`pósséss`, `crý`, `bí-rite`. The normalizer now NFD-strips combining marks
and maps the letters that don't decompose (ø æ œ ß ł đ þ ð) before leet
and run handling. Legit names fold harmlessly — `Tomás`/`Echeverría` read
as `tomas`/`echeverria`, which the rules already matched.

**Corpus 80 → 94.** Fourteen cases: six separator-evasion denies across
possession/harm/admin/legal/secret/real-business, one unreadable-run
obfuscation route, two near-misses, two accent-fold denies, one leet
re-pin, one review-tier separator case, one observe-is-free near-miss.
The audit's mod gate diffs the lab mirror case-for-case as before.

**Console seed.** `rq-1044` (sable_r, review lane) carries the hyphenated
admin-domain ask `k-i-c-k Jules out of her unit` — the live trace shows
the collapse landing the real `admin-domain` charge, the teaching point
of the whole normalization layer: the evasion changes the typography,
never the charge.

## 12a. v78 — the second-eyes layer (Mod Console v4)

**Reviewer identity.** A header picker stands in for SSO (`you` / `s.oha` /
`m.chen` in the demo). Every claim, note, and decision attributes to the
active handle — the audit log and the ledger export already carried `who`;
now the handle is a first-class input, not just a label.

**Review locks.** Queue items carry `claimed_by`/`claimed_at`; one reviewer
per request. Deciding an unclaimed item claims it first (zero-friction for
the common case). An item claimed by another reviewer shows "claimed by X —
their call to make" in queue and detail and the decision bar is withheld
entirely; the claimer sees "release". `decide()` re-checks both locks so the
rule survives a stale render. A claim is a lock against double-deciding —
never a score, never a priority claim, never monetizable.

**Different-reviewer, enforced.** The appeal lane always *showed*
`orig_reviewer` so the rule was checkable; v78 makes it structural: if the
active reviewer decided the original, the decision bar is withheld and
`decide()` refuses — "appeals route to a second pair of eyes". Seed rq-1038
(orig reviewer s.oha) makes the block reachable by switching the picker.

**Appeal workspace.** Appeal items render the original decision card beside
the new text: original request id, denial date, code, reviewer, and the
original text itself. The reviewer's only question is printed on the card:
*is the new text substantially different?* If not, a second denial is final
for that request text; if yes, judge the new text on its own merits. Appeals
never re-charge the player (locked §5).

**Handoff notes.** Per-request internal notes (`{t, who, text}`) for shift
handoffs and second opinions. Internal only — never the feed, never the
ledger export, never the player. Leaving a note doesn't require holding the
claim; handoffs cross reviewers by design. Notes carry context, not verdicts
— the audit log stays the only decision record. Seed: rq-1040 carries a
handoff from s.oha on the pt/Priya pattern.

**Per-reviewer session stats.** The shift report gains one aggregate line —
"decisions this session, by reviewer" (counts only). It lives inside the
studio report and never leaves it: the public recap stays decision-counts
only, no reviewer attribution.

Contract: `moderation.json` gains `review_locks`, `appeal_workspace`,
`handoff_notes`, `reviewer_stats`. The merge note for game-systems: claims
are short-lived queue locks keyed to reviewer SSO; they release on decide,
on release, or on reviewer-offline — never interact with the request's own
expiry/refund clock.

## 12b. v64 — the roster & record layer

**Flag roster (Mod Console v3).** The flag ledger existed only inside
per-request context cards — a reviewer could see one player's score but
never the standing of the whole book. The new header "flag roster" toggle
opens an internal panel listing every account carrying flag weight, sorted
by rolling score: active tier + effect, next threshold, next decay date
(−1 per clean 30 d counted from the last `flag_log` entry), and the log
tail. Accounts at score ≥ 9 lift into a red-bordered **owner docket**
block at the top — "account review — owner decision" — with the full flag
log inline. The console recommends; it never executes an account action.
Seed `wren_404` (score 9, suspension lapsing) keeps the docket reachable
in the demo. Visibility rule is the locked one: internal only, never
shown publicly, never monetized around. Live `bumpFlag()` writes during
the session re-sort the roster on the next render.

**Ledger export.** The audit log gained "export ledger records": every
session decision emits a canonical-ledger `mod_decision` record —
`{rec, ts, reviewer, request_id, player, decision, code, flag_w,
appeal_of, feed_line}` — shaped per `moderation.json ledger_records`.
`feed_line` is always the neutral taxonomy wording (`request not
approved` on every deny class including legal; attributed wording on
approvals) — never reviewer free text. `decide()` now stores structured
decision fields on audit entries instead of the export re-parsing prose.
The seeded 30-day baseline stays aggregate and is never exported as
records.

## 12c. v92 — the real review seam (game-v14 alignment)

The console grew its production seam. When `window.__aiBridge` carries the
review surface (game-v14's `41_game_systems_*`), the page stops simulating:

- **Queue = `gsReviewQueue()`** — real bus records parked `in_review`,
  mapped verbatim: `id`, `playerId`, `kind`, `target`, `durationMin`,
  `params` (authored text reassembled the way `gsSpecText` reads it),
  `price`/`billed` (a `billed:0` appeal shows "billed on approval"),
  `screen` (the bus's own code — authoritative), `lane`, `submittedMin`,
  `reviewExpireMin` (renders as a TTL chip), `appealOf`, `origReviewer`.
  Wait times count **bus minutes** off `gsViewerState().nowMin`, not wall
  clock. Manual "refresh" pull — never a poll.
- **Decisions write through the bus.** Approve → `gsReviewResolve(id,
  true, {by, modifyMin?})`; the bus re-enters the request at approval
  time with a fresh sequence (no leapfrog), re-runs standing validity,
  and may land it `queued` at the −15% patience rate or `failed`
  honestly — the audit line reports the real landing, never "approved".
  Deny → `gsReviewResolve(id, false, {by, code})`, full refund bus-side.
  Legal → `gsEscalateLegal(id)`. A stale item returns `null` and the
  queue re-pulls — the console never pretends a decision stuck.
- **The different-reviewer rule is bus-enforced.** `gsReviewResolve`
  returns `{error:'same_reviewer'}` when `opts.by === r.origReviewer`;
  the console also withholds the bar pre-flight. Belt and suspenders.
- **Context is the door policy's own ledgers:** `gsFlagStatus` (score,
  reviewUntil, suspendedUntil, ownerHold, log — internal only) and
  `gsRepLedger` on the player card; the flag roster enumerates every
  account the queue or the session touched, `ownerHold` lifts to the
  docket. The character card is `gsPossessionBriefing` itself — the same
  whitelist object possession briefings ship; secrets absent by
  construction.
- **Metrics = `gsModMetrics()` verbatim** on the strip and in the shift
  report (reviewDepth, oldestWaitMin, medianDecisionMin vs the 15-min
  target, denialsByCode, appeals aggregate, compensatedCr,
  suppressedFeed — "privacy screens, counted not read").
- **Claims stay session-local** (`CLAIMS` map) until bus-side review
  locks land — `review_locks.merge_target`. Notes stay local always.
- **Verdict source honesty:** on a live item the bus's `screen` code is
  authoritative; the RWScreen trace is labeled "reference" — the
  reference-engine read of the same text. A disagreement files a port
  drift note (below), it is not a veto.

**Classifier drift report (NEW `devtools/screen_drift.js`).** The
`testing.drift_gate` — "the port may be stricter, never more permissive"
— is now executable. The tool runs all 94 corpus cases through both
`RWScreen` and the bus's `gsIntentScreen` (loaded with stubs; history
signals read an empty `GS_REQ`). v92 finding: **23 permissive gaps** —
13 the missing v22/v36/v50 normalization layer (leet, spaced/separated
runs, accent folds pass the bus untouched), 10 lexicon drift on plain
text (`humiliates`, `get <name> fired`, parody-venue venue-lock,
real-person names, and the absent `obfuscation-attempt` code), plus 6
player-history cases the stub can't exercise. Diagnosis is mechanical:
each gap is re-screened with normalized text — a match means the hole
is normalization, a miss means the port's lexicon itself is older.
Reported, never judged — world cannot fix the port from this branch;
the table is the merge artifact for game-systems.

Contract: `moderation.json` gains `review_seam_v92` + `drift_report`.
`devtools/smoke_mod_v92.js` (19 checks) drives the console bare and
bridged: badge flip, verbatim bus ids, resolve calls carrying
`{by, code, modifyMin}`, the `same_reviewer` refusal both directions,
legal escalation through `gsEscalateLegal`, live flag roster and
`gsModMetrics` report — and the audit's `mod` gate enforces the seam
keys plus the ledger-record `via:'bus'` marker.

## 12d. v106 — the display-filter bench (Privacy Screen Lab v1)

`display_filter` has been an OWNER-DECISION since the taxonomy landed —
options A (redact span), B (withhold text), C (quarantine pending review)
existed only as three lines in `moderation.json`. `world/filter-lab.html`
is the decision bench: nine seeded cases re-screened live through
`RWScreen.screenRequest` at render time — never stored verdicts — so the
preview can never drift from the engine. The set spans the deny tier
(harm, secret-extraction, real-business, legal-backstop, possession via
a hyphenated evasion), the review tier (unreadable-run obfuscation,
gray-zone, history-driven repeat-pattern), and one pass control to show
where no filter engages at all.

Each case renders under all three options side-by-side, plus a survival
matrix (what reaches the feed under each: the attempt, the charged span,
the reason class, attribution, the suppressedFeed counter, appeal-spectacle
risk) and an "export memo JSON" — the studio-side artifact that drops into
the moderation.json record once the owner picks.

Two honesty rules are structural:

- **The lab never picks a winner.** The header carries "owner decision —
  open"; the memo JSON exports `decision: OPEN`. moderation.json's
  "A recommended" note is reproduced verbatim as context, not rendered as
  a conclusion.
- **Option A's redact render can't fake a span.** The trace hit string is
  post-normalization; when a separator/accent evasion no longer maps
  verbatim to the original text, the card redacts the full text and prints
  "normalized match — span approximated for display". A preview that lies
  about redaction would sell option A on false evidence.

The fixed contract prints on every render: deny wording always
`request not approved`, appeals aggregate-only, no reviewer free text,
`suppressedFeed` counted-not-read under all three options. Option C's real
cost is named in the matrix — quarantine adds reviewer load to every
charged entry, not just exclusives.

Contract: `moderation.json` gains `display_filter_lab` + a `bench` pointer
on `display_filter`. Merge note: once the owner picks, the filter is a
feed-render layer in game-systems; the memo JSON is the config record.

## 12e. v120 — the writers' docket (Mod Console v10)

§1 has always said it: *"if a character does something the writers should
see, that's a logged incident for the writers' room — not a moderation
action."* Until now no tool served that sentence — a reviewer watching
Mars comp a stranger's coffee for the third morning running had nowhere
to put it except a sticky note. The new header "writers' docket" toggle
opens the panel:

- **File an incident** — character pick (built from the reviewer whitelist
  — you cannot cite a secret you cannot see, or pick "the street / no one
  in particular"), severity (`note` / `concern`), and the observation in
  the reviewer's own words. A request id in the text is refused — *that's
  a request; decide it in the queue.* The docket is for the AI's own
  behavior only.
- **It touches nothing.** An incident is not a moderation action: not the
  world, not the feed, not the player, not the AI, not the canonical
  decision ledger. There is no retcon tool and the docket is not a back
  door to one. The writers' room reads the queue and decides what, if
  anything, changes on the page — never the console.
- **`writers_incident`, never `mod_decision`.** The panel's export emits
  `writers_incident` records (`{rec, id, ts, filed_by, character,
  severity, observation}`) — a different ledger for a different room.
  The audit log stays the only decision record; the ledger export stays
  decision-only.
- **Counted, not read, in the studio view.** The shift report carries one
  aggregate line — "incidents to the writers' room: N — contents stay
  with the writers; never a moderation action". The seeded docket
  (wi-031…wi-033: Mars's comp habit, Victor's early closes, Priya's 2 a.m.
  stairs runs) keeps the three reachable states demoable and models the
  register: public behavior, specific observation, zero instructions.

Merge note: at merge the bus may carry a `writers_incident` sink for the
writers' room intake — it must never join the `mod_decision` stream or
the public feed. Contract: `moderation.json` gains `writers_docket`.
