# Request UI — spec & copy deck (world v4, deepened v18 + v32 + v46 + v60 + v74 + v88 + v102)

The request lifecycle **as the player experiences it**: declare → classify →
screen → review → run → feed. Companion artifacts:

- `world/request.html` — working demo of this spec (file://-safe, pipeline
  simulated locally). Open it; every state below is reachable in it.
- `world/requests.json` — machine-readable action catalog, rates, feed
  vocabulary, fairness invariants.
- Policy source of truth: `world/moderation-notes.md` (design §11 enforcement).
  Prices: `rw-monetization-plan-2026-09-22` §2.2–2.3 (**PROPOSAL** — copy may
  quote them, never contradict them).

## 1. The request object (what the UI collects)

`action_class` · `target` · `duration` · `free_text` — declared **upfront**,
paid **upfront**, hard cap, no overrun. Free text is where intent lives; it is
the screened surface. The form never offers unpossessable targets (the 8 mains,
the landlord, other players' characters) — but text can still try, so the
screen reads text too.

## 2. Action catalog (player-facing labels)

| Action | Class | Billing | Notes shown in UI |
|---|---|---|---|
| Possess your character | compatible | 1.5 cr/min, 15–120 min | briefing = public profile + surface relationships + routine; mains unpossessable |
| Weather change | exclusive (`sky`) | flat by block: 1 h/40 · 2 h/70 · 4 h/100 cr | global cooldown 4–8 h; feed attributes ("rain called by X") |
| NPC nudge | compatible | 40 cr flat | "an ask, not mind-control"; declined → 50% auto-refund |
| Event trigger | exclusive (`venue:*`/`openair`) | 200 cr flat | one per place per 24 h; drama-manager-mediated |
| Camera director | compatible | 10 cr/30 min | view-layer only — changes nothing in-world |

Queued class = same rate −15%, slot held ≤24 h, expiry auto-refunds.

## 3. State machine

```
declared → classified(compatible|exclusive|queued) → screened(pass|deny|review)
  deny    → "not approved" + full auto-refund → feed
  review  → human queue (exclusive always; gray-zone wording) → approve|deny
  approve → run (session countdown | scheduled event | one-shot nudge)
          → end: graceful AI handoff → feed "player session ended" / refund lines
```

- **Classification is mechanical** (claims matrix `char:*`/`sky`/`venue:*`/
  `openair`/`paper:*`/`listing:*` — game branch `41_game_systems_requests.js`).
  The UI shows the class + why ("locks a shared resource" / "coexists").
- **Queued expiry**: clock starts at activation, not at review — queued
  requests never die waiting for a human; expired-queue = auto-refund.

## 4. Copy deck — every state, every denial path

Neutral, non-shaming, no appeal theater. Denials explain the *class*, never
accuse the person.

| Moment | Copy |
|---|---|
| Quote footer | "Charged upfront · hard cap" |
| Surge line | "Surge ×1.5 — this resource was booked recently — shown before you pay" |
| Low balance | "Heads up — about N min left on this session. Top up to extend." |
| Handoff | "player session ended" (feed); "AI resumed mid-action" (player view) |
| Deny: harm | "Requests that aim to hurt, humiliate, or ruin a character are never run." |
| Deny: secret extraction | "Secrets are discovered by watching, never by request." |
| Deny: possession scope | "The main cast is unpossessable — by anyone. You can only possess a character you hired." |
| Deny: real business | "The world can't see real business names. Try the parody — this neighborhood has its own." |
| Deny: legal backstop | "Request not approved." (nothing more, ever) |
| Nudge declined | "The ask was heard; the answer was no. 50% refunded — you bought the ask, not the outcome." |
| Queued expiry | "Queued request expired before activation — refunded." |
| Admin override | "admin action — <what> · affected players compensated N cr" |

## 5. Public feed vocabulary

`requested · in_review · approved · running · queued · resolved · refunded ·
not approved · admin action · player session ended` — must match
`gsViewerState` event types at merge (marketing's demo page labels are marked
illustrative until this sync lands; `requests.json` carries the list).

## 6. Fairness invariants surfaced in UI

Cooldowns never purchasable · surge shown pre-payment · hard cap, no overrun ·
queued-expiry auto-refund · admin overrides compensate publicly · no auctions —
FCFS within class (queued-priority ties break subscriber-favor *within queued
class only* per plan §2.5).

## 7. v18 — resource board, briefing preview, queue path, session controls

**Resource board.** A strip above the form shows every shared claim the
claims matrix cares about (`char:h01`, `sky`, `venue:*`, `openair`):
`free` / `cooldown · N left` / `locked · N left · <holder>` / queue depth.
It exists so FCFS is *legible* — a player can see why their exclusive is
busy before they spend anything. Cooldowns display a countdown and are
never skippable; the board is the anti-dark-pattern surface.

**Possession briefing preview.** Picking "possess your character" renders
the exact §7 whitelist card the player will get: public profile, surface
relationships, daily routine, scope note (only your own character, brain
suspended while driven). The secrets line reads **"not redacted — absent"**
— the schema carries no secret field, so there is nothing to leak and
nothing to redact. Same wording as the reviewer console's whitelist bar.

**Queued path.** When the chosen claim is locked or cooling, exclusive
requests cannot file directly — the submit button becomes "Resource busy —
queue to file" and a queue checkbox appears: −15% rate shown in the quote,
slot held ≤24 h, expiry auto-refunds. Queued entries land in **Your
requests** with a cancel-for-full-refund affordance. On free-up the slot
activates in order and goes to human review *on activation* (queued
requests never die waiting on a human — clock starts at activation).

**Session controls.** Running sessions show: countdown, funded-minutes
remaining on balance, brain state (possession only: "suspended — AI
resumes on release"), and a **Release early** button. Early release is
the same graceful handoff as the cap — logged "player session ended",
no partial refund (you bought the cap, not the minutes).

**Your requests tray.** Every filed request gets a private card with
status chip + timeline, mirroring what lands publicly on the feed.

### v18 copy deck additions

| Moment | Copy |
|---|---|
| Busy resource | "This resource is busy — exclusive requests can queue (−15%) or wait." |
| Queue checkbox | "Queue it — hold my slot up to 24 h at −15%; if it never activates, auto-refund." |
| Queue filed | "Queued — slot held up to 24 h. Cancel anytime for a full refund." |
| Slot reached | "slot reached — human review on activation" |
| Queued cancel | "Cancelled — N cr back. Queued requests never keep your money." |
| Resource freed | "<name> is free again — queued requests activate in order." |
| Release early | "Released early — AI resumed mid-action. Unused time inside the cap is not refunded." |
| Briefing secrets bar | "secrets, drama seeds, inner life — not redacted: absent." |

## 8. v32 — wallet sheet, appeals, co-sponsors, session extend

**Wallet sheet.** The header wallet opens a sheet, not a bare top-up: the full
six-pack ladder (plan §2.1 PROPOSAL verbatim — 100/$0.99 → 14,000/$99.99), the
one-time **first-purchase +50%** flagged on every pack until used, the **$200/day
spend cap** shown as spent-so-far (packs that would exceed it are disabled, and
the cap is never raised by a purchase), and the currency wall in plain text
("credits never expire and never convert back to money or game dollars").
Demo charges are labeled simulated — nothing real is billed.

**Rewarded ads.** Opt-in only, inside the wallet sheet (plan §2.7): +2 cr per
view, 5/day and 25/week counters visible on the button row. Never pre-roll,
never mid-session, never inside the sim view. Deliberately a taste, not a wage.

**Credits ledger.** A private itemized list under the feed: every debit
(request charge, queue hold, co-sponsor, session extend, pack buy) and every
credit (deny refund — implicit, queued cancel, nudge 50%, ad earn, appeal
re-charge). The public feed shows refunds; the ledger shows everything.

**Appeals.** A denied request card offers **appeal — different reviewer,
≤72 h** for every appealable code (moderation.json: all deny codes except
`legal-backstop` and `appeal-resubmit`, which are marked "not appealable" on
the card). Appeals are **private** — they never post to the public feed;
recaps may count them in aggregate only. On reversal the denial lifts and the
request re-enters human review at its original quote: the upfront charge
re-applies **only on approval** (the deny refund already landed). If balance
can't cover the re-charge, the card waits with a "top up to run" affordance.
Upheld is final for that request.

**Co-sponsorship.** When a shared resource is locked by a *running* request
with an identical declared intent (v32: weather only — `sky` claims carrying
`wx` intent), the form offers a third path beside queue/wait: **co-sponsor the
running call**. Same flat block price — you buy the same world event, not a
discount. It classifies **compatible** (joins a live claim, locks nothing new),
auto-runs on a passing screen, caps at 4 sponsors, and every sponsor is named
on the feed line. A different forecast still queues. Merge target:
game-v2 `GS_WX_OVR.sponsors`.

**Session extend.** A running session may buy more minutes at its own rate
while the class cap allows: possess +15 min at 1.5 cr/min (session total ≤120),
camera +30 min at 10 cr. The button disables at the cap ("the cap is the cap")
or on insufficient balance — in which case it deep-links the wallet sheet.
Extends are ledger entries; the feed sees no extra noise.

### v32 copy deck additions

|| Moment | Copy |
||---|---|
|| Wallet header | "Credits buy agency, never access — watching stays free." |
|| Currency wall | "Credits never expire and never convert back to money or game dollars." |
|| First purchase | "First purchase +50% — one time, on any pack." |
|| Spend cap hit | "That would pass the $200 daily spend cap — it is never raised by a purchase." |
|| Ad earn | "Opt-in only, from this sheet — never pre-roll, never mid-session. A taste, not a wage." |
|| Appeal offer | "appeal — different reviewer, ≤72 h" |
|| Appeal filed | "Appeals never appear on the public feed." |
|| Appeal reversed | "The deny refund stays; the charge re-applies only if it runs." |
|| Appeal upheld | "The denial stands (second review is final)." |
|| Not appealable | "this denial class is not appealable" (no button, no theater) |
|| Co-sponsor offer | "Same flat block price — you buy the same world event, not a discount. Both names go on the feed." |
|| Co-sponsor limit | "Only for an identical call; a different forecast queues." |
|| Extend at cap | "the cap is the cap" (disabled-button title) |

## 9. v46 — the reviewed request: approve-modified, honest upfront charge, hold clock, firing events, hire route, demo hooks

**Approve-modified, player side.** `moderation.json` has always carried the
reviewer outcome `approve-modified` — duration/scope trimmed only, never
expanded, unused credits auto-refund, ambiguity resolves against the player —
and `feed.json` carries the status `approved (modified)`. v46 builds the
player's half: when human review returns a trim, the pipeline shows
"approved (modified)" and the request card becomes an **offer**, not a bill.
The offer card states old → new terms and both prices; **accept** runs the
trimmed version at the re-quoted total (the upfront-charge difference is
refunded on accept), **decline** refunds the full upfront charge. Declining
costs nothing — that is "ambiguity against the player" rendered as UI. In the
demo the auto-reviewer trims only when declared intent overreaches
("all day", "everywhere", "the whole neighborhood", "forever" …) — weather
blocks step down one tier, event scopes narrow to one window.

**Honest upfront charge.** The spec has always said credits are paid upfront
at declare; before v46 the demo actually charged at run time, which made deny
refunds fictional. Now the charge lands at submit (ledger: "(upfront)") and
every refund path — deny, queued cancel/expiry, modified decline, nudge 50% —
is a real ledger credit. "Denied requests never bill" stays literally true:
charge out, charge back, net zero.

**Queued hold clock.** A queued card now shows the hold live: `hold 22 h 24
min left of 24 h · expiry auto-refunds`. At zero the request expires in view —
auto-refund, feed line "queued request expired before activation". Activation
(slot reached) stops the clock; review happens on activation, never while
waiting. Demo compresses the hold (~1 tick ≈ 48 min) so the path is reachable.

**Scheduled exclusives fire.** An approved weather change or event trigger
used to resolve at "scheduled" and vanish. It now fires on the feed —
`running` when it starts, `resolved` when it ends — with the filer's handle
on both lines (attribution is the payoff, plan §2.3). Events running under
trimmed terms say "(trimmed terms)" on the fire line. Activated queued
requests fire the same way.

**Hire routes to The Registry.** "Hire a character" is in the action catalog
(500 cr, naming strings always human-reviewed, billed only on approval) but it
is not a request — it is an intake. The form now shows its terms and the
submit button reads "File in The Registry →" and opens `create.html`.

**Demo event hooks.** `window.RW_DEMO_EVENTS` collects `{ev, at, props}` for
the analytics spec's pending hooks: `request_submitted`,
`review_lesson_shown` (first time the human-review stage renders),
`review_outcome_seen`, `low_balance_simulated`, `handoff_seen`. In-page only —
nothing leaves the file; it exists so the merge can conformance-check event
names against `analytics-events.json` before wiring the real bus.

### v46 copy deck additions

|| Moment | Copy |
|---|---|---|
|| Modified offer | "The reviewer approved a trimmed version: <old → new>. Accept and it runs at N cr (K cr comes back), or decline for a full refund." |
|| Modified rule line | "Trimmed only, never expanded — ambiguity resolves against you." |
|| Modified accept | "Accepted modified terms — N cr · K cr refunded" |
|| Modified decline | "Declined — N cr back. The modified version was an offer, not a bill." |
|| Hold clock | "hold 22 h 24 min left of 24 h · expiry auto-refunds" |
|| Hold expiry | "Queued request expired before activation — refunded." |
|| Event fires | "<event> fired" (feed `running`), "<event> ended" (feed `resolved`) |
|| Hire route | "File in The Registry →" (button); "billed only on approval — denied applications never charge" |

## 10. v60 — the live seam, pre-flight check, receipts

**Live seam (merge seam, the production-1 flag).** `request.html` was the
last major surface still purely simulated. v60 wires it the way wire.html
and create.html already are: `__aiBridge` presence flips the header badge
`mirror — local pipeline` → `live · __aiBridge` and starts a 3 s poll.
Reads: `gsViewerState().feed` renders onto the public feed (deduped by
entry id; statuses map onto the §5 vocabulary — `in_review`→review chip,
`approved (modified)`→modified chip, etc.); `gsViewerState().sessions`
drives the resource board's locked states by claim key; `gsCoSessions()`
(when present) supplies live sponsor lists; `gsExplainRequest(id)` (when
present) fills the receipt drawer's live block. Write: filing
capability-detects `gsRequestSubmit({action, target, duration_min, text,
queued, co_sponsor, quote_cr})` — the merge contract in `requests.json
live_seam.write`. Absent or refusing, the local pipeline runs unchanged;
it stays the contract reference. Demo claims stand in for resources the
bus doesn't name, so the board never lies about what it can't see.

**Pre-flight check — "check wording first — free".** A button under the
intent box runs `RWScreen.screenRequest` on the current form before any
money moves. Same engine, same verdict the pipeline would reach — just
earlier: `screens clean`, `gray-zone → a human reads it (free)`, or
`would not be approved (<code>)` with the neutral player message. It is
deliberately *not* a shadow ban: a failed preview never disables submit —
filing anyway still runs the real screen and auto-refunds in full on deny.
Screening is free; credits move only on file. Emits `preflight_check`.

**Receipt drawer.** Every "Your requests" card header is clickable and
opens a receipt: declared action · target · duration, the filed intent
text, the upfront charge, the claim key, and a timestamped status trail
(declared → screened → queued/review/co-sponsored → running → resolved/
refunded; appeals, holds, and modified terms all append). The receipt
ends with `rq-<id>` — the same request the public feed lines carry, so a
player can always reconcile their private card against the public record.

### v60 copy deck additions

||| Moment | Copy |
|---|---|---|
||| Source badge | "mirror — local pipeline" / "live · __aiBridge" |
||| Pre-flight button | "check wording first — free" |
||| Pre-flight pass | "screens clean — nothing in the text trips the intent screen." |
||| Pre-flight review | "gray-zone wording — a human reviewer would read this first (that review is already free)." |
||| Pre-flight deny | "would not be approved (<code>) — <neutral msg> Screening is free; file anyway and it refunds in full." |
||| Live file toast | "Filed live — the request bus carries it from here." |
||| Receipt ref | "rq-<id> — mirrors the public feed lines" |

## 11. v74 — the booking layer (the Book)

Exclusive requests can name **when** they run, not just what they do. Plan
§2.3 already says event triggers are "scheduled into world calendar" — the
Book (`world/book.html`, `world/bookings.json`, spec `world/bookings.md`)
is that calendar, public like the resource board: every claimed window
carries the holder's handle.

**The When picker.** Weather and event actions grow a "When" row:
`soonest free window (queue if busy)` — today's behavior — or a named
half-hour slot in the next 24 h. The picker only offers slots that can
legally fire: ≥30 min out, past any lock or cooldown tail on the claim,
never overlapping a booked span. Cooldown-blocked spans don't appear —
a slot that can't fire doesn't exist.

**Booking is scheduling, not a new state.** A booked request files,
screens, and goes to human review exactly like any exclusive; approval
lands on the calendar (`approved` chip, `booked for HH:MM` on the feed).
When the window arrives the claim locks and it fires with attribution.
The feed vocabulary gains nothing — booking reuses
`approved · running · resolved · refunded`.

**Honesty rules.** A time slot is not an upgrade — same flat block price,
never a premium tier, never an auction. Surge keys off the *window's*
local hour (18:00–23:00 primetime) and shows in the quote before payment.
Cancel until the window starts = full refund; after the start it's a live
exclusive. Bookings never skip cooldowns; a queued overlapping ask waits
for the next free window, FCFS. One event per place per 24 h, unchanged.

**Live seam.** `gsViewerState().calendar` (optional) supplies live booked
windows to the picker's avoidance set, deduped by claim+start;
`gsRequestSubmit` gains `start_slot` (minutes-from-now) when a window was
picked. Off the bus, seeded windows + the local pipeline stay the contract
reference.

### v74 copy deck additions

|||| Moment | Copy |
||||---|---|
|||| When label | "When — the book is public: pick a window or take the soonest" |
|||| Soonest option | "soonest free window (queue if busy)" |
|||| Slot option | "book 21:30 → 22:30 (tonight)" |
|||| Quote line | "Window — booked for 21:30 · cancel free until it starts" |
|||| Submit | "Book it — 21:30" |
|||| Booked card | "starts 21:30 · in ~4 h · cancel free until it starts" |
|||| Booked stage | "fires 21:30 — approved now, runs when the window arrives" |
|||| Feed: booked | "&lt;action&gt; approved · booked for 21:30" |
|||| Feed: fires | "booked window arrived — &lt;action&gt; fired" (`running`) |
|||| Feed: ends | "&lt;action&gt; ended" (`resolved`) |
|||| Booked cancel | "booked request cancelled before the window — refunded" |
|||| Surge (window) | "primetime window — surge keys off the window's hour, shown before you pay" |

## 12. Demo limits (what's simulated)

`request.html` ships without the game request bus (it lives on
`sf/game-systems`): off the bus, classification, review, sessions, and
feed are local simulation — but the live seam (§10) reads the real bus
when it's present, so the same file is the production surface. Screening
is NOT a demo stub — it calls the shared engine
`world/screen.js` (`RWScreen.screenRequest`), the same function the mod
console (`world/mod-console.html`, v8) runs, implementing the §3 contract +
reason taxonomy in `world/moderation.json`. At merge, the demo's
`run/feedAdd` calls become `gsViewerState` subscriptions and `gsRequest*`
calls; the copy above is final.

## 12. v88 — the real bus seam (game-v14 alignment)

The live seam predates the bus it was meant for: v60 guessed the merge
contract (`gsRequestSubmit`, `{action, duration_min, text}`), and game-v14
shipped a different reality — `gsSubmitRequest(spec)` with `{playerId,
kind, target, durationMin, params, note, start_slot}` plus real read
surfaces (`gsViewerState().board`, `gsResourceBoard()`, `gsBookCalendar()`,
`gsBookableSlots()`, `gsPriceQuote()`). v88 closes the gap without
dropping the local pipeline — it stays the contract reference whenever
the bridge is absent.

**Write path.** Filing calls `gsSubmitRequest` first, `gsRequestSubmit`
as a legacy alias only. The spec carries both vocabularies — bus keys
(`kind` — the event trigger files as `street_event` per the game-v14
merge note — `durationMin`, `note`, `params`, `start_slot`) alongside
the documented world keys — so either surface parses it. The returned
record is the truth: `status:"denied"` means the door refused
pre-billing (account gate, rate check, intent screen, cooldown — all
upstream of money), and **no local charge ever lands for a denied live
filing** — "denied requests never bill" holds on the bus too. `queued`
and `booked` statuses land on the request card the same way their local
counterparts do.

**Board reads.** `gsViewerState().board` (or a direct
`gsResourceBoard()` call) projects every contended claim —
`{state: free|cool|locked|queued, leftMin, holder, depth, booked[]}` —
onto the resource strip. Queue depth shows as a count, never a position
auction; `booked[]` markers render as a `booked HH:MM · who` note on the
claim. Keys the board doesn't name keep their demo state — the strip
never calls a resource free just because the bus is silent about it.

**Book reads.** `gsBookCalendar()` merges into the picker's avoidance
set alongside `vs.calendar`, deduped by claim+start.
`gsBookableSlots(spec, 6)` unions bus-offered windows into the picker's
option list — a slot the bus knows is bookable is always offerable, and
a slot it refuses simply isn't offered. Normalization accepts every
shape the bus has used: minutes-from-now, minute-of-day, `start_min`,
`startMin`, `abs`, or `start:"HH:MM"`.

**Live quote check.** When `gsPriceQuote` is present, the quote box
gains a "Live check" line running the submit path's own math without
mutating anything — total, surge, would-queue, booked start. A bus deny
renders as a warning, not a gate (same honesty rule as the pre-flight
screen): filing anyway is safe because refused requests never bill.

**Feed.** Bus feed entries carrying the v14 status `booked` render a
booked chip; the rest of the vocabulary map is unchanged.

### v88 copy deck additions

|||| Moment | Copy |
|||||---|---|
|||| Live deny | "Request not approved — nothing was billed." |
|||| Live check | "Live check — N cr · surge ×S — the bus's own math" |
|||| Live deny line | "the bus would refuse this as filed (<reason>). Filing anyway is safe: refused requests never bill." |
|||| Board booked note | "booked: 21:30 · marina_w" |

## 13. v102 — the live session layer

v88 aligned the *filing* seam with the bus; v102 wires the bus's
remaining read/write surfaces so a bridged request card is driven by the
bus end-to-end, not just at file time. Every call is capability-checked;
absent any surface the local path runs as the contract reference,
unchanged.

**The meter (`gsRequestMeter`).** Polled inside `livePoll` for every
filing that carries a `busId`. The card mirrors bus status verbatim:

- `queued` → `queuePos` renders as **"place N in line — yours can only
  shrink, never grow"** — the holder sees *their own* position only.
  That is not a position auction (the fairness invariant stands): the
  queue's order is never published, only the holder's place in it.
  `blockedBy` names the active blockers.
- `in_review` → `reviewCode` + `reviewExpiresInMin` — the human-review
  SLA clock sits on the card, matching the review-queue countdown.
- `active` → `remainingMin` / `spentSoFar` / `lowCredits` drive the
  **live session card**: real minutes, not the demo tick; the bus holds
  the clock. Possession still shows the brain line ("suspended — AI
  resumes on release"). **Release early** files `gsCancelRequest` — the
  bus settles unused minutes by its own rule (unused whole minutes at
  the applied rate), and the meter reports what came back. The demo's
  "no partial refund" wording only ever described the local pipeline;
  live, the bus's accounting is the truth and the copy says so.
- `denied` → "not approved · nothing billed" (the door refused
  pre-billing).
- `cancelled` / `completed` / `expired` / `failed` → status + `refunded`
  total mirror onto the card and into the receipt trail.

**Live writes.** `gsCancelRequest(busId)` backs the cancel affordance on
queued/booked cards filed live — queued/in-review refunds the full bill,
active refunds unused whole minutes; a `false` return is honest ("the
bus refused — it may already be running; the meter reports the
outcome"). `gsAppealRequest(busId, {playerId})` backs the appeal
affordance on live denials — the bus enforces one-appeal / 72 h /
different-reviewer itself, and refusal codes map to neutral wording
(`already_appealed`, `appeal_final`, `window_closed`, …). The wallet's
rewarded-ad button mints through `gsWatchAd(playerId)` with
`gsAdStatus(playerId)` counters; `capHit` is an honest refusal, not an
error.

**Live reads.** `gsPossessionBriefing(charId)` serves the §7 whitelist
live — same absent-by-schema bar, generic field rendering, demo card as
fallback. `gsConflictRules()` renders the claims matrix in plain English
under the resource board so "exclusive" reads as a fact about shared
resources, never as a tax. `gsAppealStats()` adds one aggregate line
under Your requests ("N filed · R% reversed — aggregate only");
individual appeals still never appear on the feed.

### v102 copy deck additions

|||||| Moment | Copy |
||||||---|---|
|||||| Queue position | "place N in line — yours can only shrink, never grow" |
|||||| Review clock | "in human review · N min left for a decision" |
|||||| Live session head | "hard cap · the bus holds the clock" |
|||||| Live low balance | "low — top up to keep the session healthy" |
|||||| Live release | "Release early — graceful handoff; the bus settles unused minutes" |
|||||| Live cancel ok | "Cancelled on the request bus — the feed will show the refund." |
|||||| Live cancel refused | "The bus refused the cancel — it may already be running. The meter reports the outcome on the card." |
|||||| Live appeal refuse | "Appeal refused — <neutral reason>." (e.g. "one appeal per request — already filed") |
|||||| Appeal aggregate | "appeals on the bus: N filed · R% reversed — aggregate only; individual appeals never appear on the feed" |
|||||| Live ad cap | "Daily cap reached — a taste, not a wage. Ads reset tomorrow." |
|||||| Rules line | "Why these classes — the bus's claims matrix: <rules>" |
