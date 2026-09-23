# Onboarding — spec & copy deck (world v11; v25 adds §10–16)

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

Six beats (beat 3 added in v25), each anchored to a real element of The Wire. "Next / Skip tour"
on every card; Skip ends the whole tour, not just the beat.

| # | Anchor | Copy |
|---|--------|------|
| 1 | live clock + weather | "This is the block's real clock. It runs whether you're here or not — the neighborhood doesn't wait for viewers." |
| 2 | venue occupancy list | "Who's where, right now. Names you see are the main cast — eight people with full lives, plus twenty neighbors." |
| 3 | the cast strip (v25) | "One honest limit up front: the eight mains can't be possessed — not by you, not by the people who run this. Their lives are theirs. If you want a person in the world, you hire a new one." |
| 4 | a request event in the stream | "Everything a player does is public. This line is someone paying to reach in — attributed, priced, and visible to everyone." |
| 5 | a follow pin | "Follow a face to filter the stream. Watching closer is always free — following is a lens, never a leash." |
| 6 | the 'Reach in' entry point | "Watching is free forever. If you ever want to act — call weather, nudge a neighbor, hire your own character — that's what credits buy. No action is hidden behind anything else." |

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

---

## v25 — the second pass

v11 built the spine; v25 fills in the honest parts a stranger actually trips
on: *what name can I have, what does each pack cost, what happens when the
world says no, and what does this page do the second time I visit.*

### 10. The persona fork (S0.5)

The welcome card now asks one question with two equal-weight answers:
**"I'm just watching"** or **"I might reach in."**

- `watch` → after the tour, a "That's the whole job" card (S1w): you're set,
  watching is the product, setup stays reachable but unpushed. Checklist
  optional items relabel to *"only if you ever want to act."*
- `play` → the standard S1→S5 sequence unchanged.
- The fork changes **emphasis and labeling only**. It never unlocks, hides,
  or prices anything. A watch-fork viewer who later picks up setup sees
  identical prices and steps — the fork is a reading aid, not a funnel.

### 11. Handle rules (S2)

Handles are **not request text** — §11 intent screening does not apply to
them (character *names* in the hire flow still go through the real screen per
`creation.json`). What does apply:

- **Format:** `^[a-zA-Z][a-zA-Z0-9_-]{2,19}$` — starts with a letter, 3–20
  chars, letters/digits/dash/underscore.
- **Reserved:** every main + ambient character name and surname
  (`characters.json` + `ambients.json` are the source lists; the demo carries
  an inline copy) plus system words (admin, mod, landlord, system, support,
  owner, realworld, thewire, rw, staff). The feed attributes requests by
  handle — a spectator named "Victor" would read as the resident.
  Impersonation is blocked **at input**, not by moderation after the fact.
- **On taken/invalid:** inline message + suggested variants
  (`x_sf`, `x-watch`, `ax`). Never an error page, never a strike.

### 12. The wallet shows the whole ladder (S3)

The wallet card now renders the full six-pack ladder from plan §2.1 verbatim —
Pocket 100 cr/$0.99 through Mogul 14,000 cr/$99.99 — with no "best value"
highlight, no decoy styling, and the **+50% first-purchase bonus disclosed on
the card**, not at checkout. The currency wall sentence stays one line:
credits buy agency, game dollars are rent and wages, the two never convert
in either direction. The demo top-up remains Starter-only (550 cr/$4.99).

### 13. Teaching the honest "no" (S4b)

The single most important thing a new player can learn about requests is
that they can be **declined** — and that the game is honest about it. So the
first-ask stage gains an optional second guided ask:

- A fixed-safe nudge (40 cr) aimed at Doña at El Farolote, **scripted in the
  demo to be declined** so every tester sees the path: the feed entry
  resolves with neutral declined wording and **20 cr returns to the wallet
  automatically** (refund-on-decline per requests.json).
- Copy promise, verbatim: *"You pay for the ask, never the outcome."*
- The demo labels this as scripted; real nudge outcomes are never scripted —
  the AI decides, per design §11 step 5 (inject as opportunity, never
  mind-control).

The camera ask also gained a lifecycle view: filed → `running` on the feed →
a "jump ahead" affordance resolves it so the player watches the hard cap end
the session with nothing billed past it.

### 14. Returning, parked, and deep links

- **Returning** (session 2+ with state, or `?returning=1`): no welcome card.
  At most a quiet "welcome back" line that dismisses itself into the footer
  link. The checklist, if unfinished, stays collapsed.
- **Parked** (new exit state): the card's ✕ sets `parked` — closed mid-way,
  reopens only via the footer link, never auto-resurfaces on a timer. This is
  distinct from `dismissed` (explicit don't-show) in state only; both render
  the same collapsed surface.
- **Deep links:** `?returning=1` is a demo affordance for playtesting the
  return path; no other URL parameters exist — onboarding is never
  deep-linked into a paid step.

### 15. Accessibility & motion

- `prefers-reduced-motion` strips the coach-mark anchor pulse; the tour is
  click-driven and needs no animation, hover, or drag.
- Every stage is reachable by buttons alone; the checklist is a plain list,
  not a progress bar.
- The fork cards and coach marks are real `<button>`s — keyboard focusable,
  no divs-as-buttons.

### 16. Edge cases (decided, not deferred)

| Case | Behavior |
|------|----------|
| Balance < 40 at the nudge step | "Balance too low" toast; no hidden charge, no debt |
| Handle left empty | "Pick a handle, or skip" — empty is never an error, skipping is free |
| Request filed mid-tour (returning user) | tour never auto-plays mid-request; the card stays parked |
| Dismissed then reopened via footer | full S0 fork returns — dismissal is forgiven, not remembered as a penalty |
| Onboarding finished | thanks once, collapses permanently; nothing is granted |
| `localStorage` blocked | journey still works for the session; state just doesn't persist — no nag |

### 17. v25 merge notes

- `storage_key` → `rw_onboard_v25` (schema grew; old v11 state is ignored).
- New anchors required on the real Wire at merge: `feed-cast` (the cast
  strip) joins clock/venues/request/follow/reach-in.
- Reserved-name list at merge = generated from `characters.json` +
  `ambients.json`, not the demo's inline copy.
- New analytics hooks (v25): `persona_chosen`, `handle_taken_shown`,
  `decline_lesson_shown`, `returning_session` — same envelope, stage +
  opted_out props only.
