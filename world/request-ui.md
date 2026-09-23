# Request UI — spec & copy deck (world v4, deepened v18 + v32)

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

## 9. Demo limits (what's simulated)

`request.html` ships without the game request bus (it lives on
`sf/game-systems`): classification, review, sessions, and feed are local
simulation. Screening is NOT a demo stub — it calls the shared engine
`world/screen.js` (`RWScreen.screenRequest`), the same function the mod
console (`world/mod-console.html`, v8) runs, implementing the §3 contract +
reason taxonomy in `world/moderation.json`. At merge, the demo's
`run/feedAdd` calls become `gsViewerState` subscriptions and `gsRequest*`
calls; the copy above is final.
