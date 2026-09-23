# Onboarding — spec & copy deck (world v11)

The **first-session journey**: how a stranger lands on The Wire, learns the
block for free, and — only if they want agency — walks the shortest honest
path to a first request. Companion artifacts:

- `world/onboarding.html` — working demo of this spec (file://-safe; the
  journey is simulated over an inline mini-Wire so every state is reachable).
- `world/onboarding.json` — machine-readable mirror: stages, tour beats,
  checklist, triggers, exit states, copy keys.
- Surfaces it touches: `feed.html` (the tour rides on it), `request.html`
  (guided first request hands off here), `create.html` + `board.html`
  (the hire pointer). Prices: `rw-monetization-plan-2026-09-22` §2
  (**PROPOSAL** — quoted verbatim, never contradicted).

## 1. First principles (locked by tone, not by code)

1. **Watching is the product.** The free spectator tier is complete, not a
   demo. Onboarding's first job is helping someone *watch better* — never
   funneling them toward payment. A player who never spends is a success
   state, not a leak.
2. **Nothing blocks the feed.** Onboarding is a card beside the stream, never
   a modal over it, never a gate before it. No account wall to watch.
3. **Dismissal is permanent and free.** "Don't show me this" works in one
   click, with no confirm-shame, no snooze timer, no "are you sure."
4. **No invented urgency.** No countdowns, no "offer expires," no streaks, no
   "your character misses you." The block runs 24/7 — it will still be there.
5. **Money talk is math talk.** Every price in onboarding copy is quoted from
   the plan verbatim, labeled with real USD equivalents, and the first-purchase
   bonus (+50%, PROPOSAL §2.1) is disclosed where it applies — never sprung
   at checkout.
6. **Agency is taught honestly.** The tour names the limits up front: you can
   only possess a character you hired, the main cast is unpossessable by
   anyone, requests are screened, asks can be declined.

## 2. The journey — five stages

```
S0 WATCH (anonymous, free, default)
  → S1 ORIENT (tour: 5 coach-mark beats over The Wire)
  → S2 NAME  (pick a spectator handle — one field, no email in this build)
  → S3 WALLET (credits explained; optional top-up; skippable forever)
  → S4 FIRST ASK (guided compatible request; real pipeline, real quote)
  → S5 RESIDENT (pointer card: hire a character / just keep watching)
```

- S0→S1: the welcome card offers the tour; it also self-dismisses after the
  viewer has scrolled the feed (they're already oriented — don't teach what
  they just learned).
- S2 is **optional and consequences-light**: a handle is needed only to
  attribute requests on the public feed and hold a wallet. Watching needs
  nothing.
- S3 teaches the two currencies honestly: **credits buy agency, game dollars
  buy rent.** The exchange wall is stated in one sentence.
- S4 recommends the **camera director pass (10 cr / 30 min)** as the first
  ask: cheapest, view-layer only, can't hurt anyone, demonstrates the whole
  declare→classify→screen→run pipeline with zero in-world risk. A possession
  or nudge is offered as the "bigger first step" for players who already hired.
- S5 is a fork card, not a funnel: two equal-weight exits — "hire a character"
  (→ create.html) and "keep watching" (→ nothing; the checklist closes).

## 3. The checklist (progress UI)

A small persistent card, collapsible to a chip, ordered by the journey:

| # | Item | Completes when |
|---|------|----------------|
| 1 | Watch the block | viewer has spent 60s on the feed OR scrolled it |
| 2 | Take the tour | tour finished (all 5 beats) — or skipped |
| 3 | Pick a handle | S2 done |
| 4 | Fund the wallet | balance > 0 (top-up OR already funded) — or skipped |
| 5 | File a first request | any request reaches `requested` on the feed |
| 6 | Settle in | S5 fork chosen |

- Items 3–5 mark themselves **optional** in copy; the card never shows a
  percent-complete bar on the free path (progress bars on optional spending
  steps are a dark pattern — item bars only count what the player chose to do).
- Completed state: the card thanks the viewer once and collapses permanently.

## 4. Tour beats (S1, coach-mark copy)

Five beats, each anchored to a real element of The Wire. "Next / Skip tour"
on every card; Skip ends the whole tour, not just the beat.

| # | Anchor | Copy |
|---|--------|------|
| 1 | live clock + weather | "This is the block's real clock. It runs whether you're here or not — the neighborhood doesn't wait for viewers." |
| 2 | venue occupancy list | "Who's where, right now. Names you see are the main cast — eight people with full lives, plus twenty neighbors." |
| 3 | a request event in the stream | "Everything a player does is public. This line is someone paying to reach in — attributed, priced, and visible to everyone." |
| 4 | a follow pin | "Follow a face to filter the stream. Watching closer is always free — following is a lens, never a leash." |
| 5 | the 'Reach in' entry point | "Watching is free forever. If you ever want to act — call weather, nudge a neighbor, hire your own character — that's what credits buy. No action is hidden behind anything else." |

## 5. Copy deck — onboarding-specific moments

Tone: a local showing you around, not a salesperson. Neutral on spend.

| Moment | Copy |
|---|---|
| Welcome card | "You're watching a real neighborhood — eight people living their day around Dolores Park, twenty neighbors, all of it live. Watch as long as you like; it costs nothing. Want the two-minute tour?" |
| Welcome dismiss | "No problem — the block is right there." |
| S2 handle | "Pick the name the feed will attach to anything you do. Requests are public — your asks carry your name, same as everyone." |
| S3 wallet explainer | "Two kinds of money: **credits** buy agency (requests, hires) — that's what you top up. **Game dollars** are the world's money — rent and wages; your characters earn them by working. They never convert into each other." |
| S3 rates line | "Roughly 100 credits ≈ $1. A 30-minute camera pass is 10 cr — about a dime. A first purchase adds +50% once." |
| S3 skip | "Skip — watching needs no wallet. This stays here if you change your mind." |
| S4 camera walkthrough | "The cheapest way to reach in: camera director, 10 cr for 30 min. It changes nothing in the world — just your view. Watch the request land on the public feed with your handle on it." |
| S4 post-submit | "Filed. Compatible requests auto-clear screening — exclusive ones get human review before they run. Yours is the simple kind." |
| S5 hire pointer | "Ready for a person of your own? Hiring a character is 500 cr, and they arrive owing rent like everyone — you set who they are; who they become is theirs." |
| S5 watcher exit | "Settled. The block keeps running — see you around." |
| Re-open affordance | footer link only: "New here? Take the tour" — one line, bottom of page |

## 6. Exit & resume rules

- Exit states: `completed` (all chosen items done), `dismissed` (don't-show),
  `parked` (closed mid-way; reopens only from the footer link — never
  auto-resurfaces on a timer).
- State persists in `localStorage` under `rw_onboard_v11`; the demo ships a
  "reset onboarding" dev affordance, clearly marked.
- Returning viewers (state exists, session 2+): no welcome card; the footer
  link is the only surface.

## 7. What onboarding must never do (boundary list)

- Never gate, dim, delay, or nag the free feed. No paywall copy anywhere.
- Never offer possession of C1–C8 or imply it's possible at higher tiers.
- Never invent prices, discounts, or "limited-time" framing not in plan §2.
- Never count skipped-optional items as failures or show red "incomplete"
  styling on them.
- Never auto-play the tour on return visits, after dismissal, or mid-request.
- Never describe requests as guaranteed outcomes — the S4 copy says "the
  character may decline" wherever a nudge is described.
- No reward for spending: completing onboarding grants no credits, items, or
  status (a completion reward would be a conversion incentive — banned by
  the no-dark-patterns rule; the tour's reward is knowing the block).

## 8. Analytics hooks (at merge)

Emit to the same envelope marketing spec'd (`marketing/analytics-events.json`):
`tour_started`, `tour_beat` (n), `tour_completed|tour_skipped` (at beat),
`handle_set`, `wallet_explained`, `topup_shown`, `first_request_filed`,
`onboard_dismissed` — plus marketing's existing `watch_start` /
`request_submitted` / `character_created` where those actions occur.
Onboarding events carry `stage` + `opted_out` only — no funnel-pressure
data (no per-step dwell timers reported back).

## 9. Demo limits

`onboarding.html` simulates: a mini Wire feed (subset of `feed.json` seeds),
the tour overlay, handle pick, wallet explainer with demo top-up, and a guided
first-request that posts to the demo feed. It does not call `screen.js` —
guided requests use fixed safe text; free-text screening is request.html's
job and onboarding deliberately doesn't duplicate it. At merge the tour
anchors to real feed.html element ids; checklist completion subscribes to
`gsViewerState` events.
