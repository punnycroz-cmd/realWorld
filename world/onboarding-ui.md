# Onboarding — spec & copy deck (world v11; v25 adds §10–16; v39 adds §18–23; v53 adds §24–29)

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

---

## v39 — the third pass

v25 taught the honest "no" a character can give. v39 teaches the two "no"s
the *system* can give — human review on exclusive asks, and the wallet
running out mid-session — plus the handoff that waits for players who
hired a character and came back.

### 18. The ask that waits (S4c) — human review, taught

Compatible requests auto-clear; **exclusive** ones go to human review
before they run (design §11 step 4). A player whose first exclusive ask
silently sat in a queue would learn the wrong lesson — so onboarding makes
the path explicit with one more optional guided ask:

- A fixed-safe **weather request** — "fog for the evening block, 60 min,
  40 cr" (the cheapest exclusive in requests.json; flat per block). Filed,
  it lands on the demo feed as `in review` — the real feed vocabulary —
  with the charge held, not spent.
- Scripted in the demo to come back **`not approved — refunded`**: every
  tester watches the neutral wording (never "denied," never a reason
  invented on the card) and the full 40 cr return to the wallet. Appeal
  exists per moderation.json but is deliberately not taught here — the
  lesson is "review is real," not "here's how to fight it."
- Copy promise, verbatim: *"Exclusive asks get a human look before they
  run. A 'not approved' costs you nothing — the refund is automatic."*
- The card also states what review is *not*: it screens the request's
  intent, never previews the AI's rendering; it can never be skipped,
  paid around, or sped up. Queued requests (−15%) are mentioned in one
  line as the patient option — no derived figure quoted.

### 19. The wallet running dry (S4d) — low balance + graceful handoff

The second systemic "no": sessions have a hard cap, and a wallet can hit
zero *inside* the cap. Taught during the running camera session:

- A **"simulate low balance"** demo affordance on the running-ask card
  drops the balance under the warning threshold (~15 min of funded time).
  The player sees the actual sequence: toast warning → at zero, the feed
  logs **"player session ended"** (neutral wording — no shaming, no
  "kicked out"), the AI view resumes, nothing is billed past the cap,
  and unused minutes inside the cap are not refunded.
- Copy, verbatim: *"When the wallet empties mid-session the world doesn't
  stop — your character (or your camera) just hands back to the AI,
  mid-motion. No debt, no overrun, no shame line on the feed."*

### 20. Coming back hired (S6) — the post-create return

`create.html` is the hire flow's home; onboarding's job ends at the S5
fork. But a player who hires and returns deserves a landing that isn't
the S0 welcome card — so `?hired=1` (the demo affordance; at merge,
create.html redirects here after approval) opens a one-time **"first day"
card**:

- What a hired character *isn't*: the briefing card you previewed before
  payment is all you get — public profile, surface relationships, daily
  routine. Secrets are redacted for everyone, including you. You learn
  the block by playing, same as a viewer learns it by watching.
- What day one costs: they arrived owing rent like everyone (game
  dollars, earned by working); possessing them is the compatible rate
  (1.5 cr/min, 15-min minimum). Possession is a visit, not ownership —
  release or timeout hands them back to their own brain mid-motion.
- The card dismisses into the checklist, never into a second funnel.

### 21. Edge cases (v39 additions)

|| Case | Behavior |
||------|----------|
|| Balance < 40 at the weather ask | "Balance too low" toast; nothing filed |
|| Exclusive ask parked mid-review | the `in review` feed entry persists; card can be ✕-parked, the ask still resolves |
|| `?hired=1` with no handle | card still renders — the hire carries its own name; handle copy gently re-offered, skippable |
|| Low-balance sim while not running | affordance hidden — it only exists on the running-ask card |
|| Review "not approved" twice in a session | identical neutral wording every time; the feed never editorializes |

### 22. v39 merge notes

- `storage_key` → `rw_onboard_v39` (state shape grew again; v25/v39 states
  coexist harmlessly but the demo reads only its own key).
- New feed-vocabulary dependencies the demo now renders: `in review`,
  `not approved`, `refunded`, `player session ended` — all already in
  `requests.json.feed_vocabulary`; no new vocabulary invented.
- New analytics hooks (v39): `review_lesson_shown`, `review_outcome_seen`
  (approved|not_approved — demo is always not_approved),
  `low_balance_simulated`, `handoff_seen`, `hired_return` — same envelope,
  stage + opted_out props only.
- At merge: `?hired=1` becomes create.html's post-approval redirect
  target; the demo keeps it as a URL affordance.

### 23. What v39 still must never do

- Never reveal why a request was not approved on the public surface —
  the reason code lives in the moderation contract, not the feed card.
- Never offer an appeal button inside onboarding — appeals live in the
  request flow; teaching dispute mechanics in minute one is funnel-think.
- Never frame review as a barrier to "beat" — no tips for getting
  approved, no success-rate numbers.
- Never let the low-balance lesson fire without the player's click —
  simulated or real, it is always opt-in.

---

## v53 — the fourth pass: the time layer

v11 built the spine, v25 the honest "no" a character gives, v39 the two
systemic "no"s. v53 teaches what remains: **a 24/7 world is bigger than any
viewer, and that's fine.** Three additions, all honesty-first.

### 24. The Archive joins the tour (beat 7)

A new coach-mark anchored to the "Yesterday on the block → the Archive" link
under the stream:

> "Nobody can watch twenty-four hours a day — you're not meant to. The
> Archive keeps the block's week: every public event, every thread, scrubbed
> by day. Catching up is free, always."

This is the tour's first pointer off the live feed — deliberately last,
deliberately free. A spectator who learns only one thing beyond "watch"
should learn that absence is not loss.

### 25. The patient ask (S4e) — the queue, taught honestly

Between the review lesson and settling in, one more optional guided ask
covers the third request class:

- A fixed-safe **weather ask filed while the sky is claimed** — rain for
  tomorrow evening, 60 min — which files as `queued` at **34 cr held**
  (tier rate −15%, arithmetic shown on the card, not invented pricing).
- The queued card states the real rules: slot holds up to **24 h**,
  **first-come first-served**, queue depth shown as a count — never a
  position you can buy.
- Scripted in the demo to **lapse unactivated**: the feed resolves with the
  locked line *"queued request expired before activation"* and all 34 cr
  return automatically. Real queues activate FCFS when the resource frees —
  queueing is a real path, not a consolation.
- Copy promise, verbatim: *"−15% off the tier rate, and a lapsed slot
  refunds every credit on its own."*
- Requires balance ≥34 to file the guided ask; with no balance the card
  renders without the file button — never a dead-end error.

### 26. The block's rhythm, named without urgency (S1w)

The watcher-fork landing card gains a texture line:

> "The block keeps human hours — the morning rush at Mudhaus, the bench
> parliament toward dusk. Come back whenever; the Archive keeps the rest.
> Nothing here is on a timer for you."

Naming good watch-hours is service, not pressure: the line must always
carry the last clause. This is the anti-FOMO formulation — the rhythm is
descriptive, never scheduled scarcity.

### 27. Closing the tab, stated as fact (S6)

The hired-return card gains one paragraph:

> "And when you close the tab, they don't wait — they go back to their own
> brain, thinner but present, and wake to full when you return. The block
> sends no 'miss you' notes. It's just here when you come back."

This teaches the offline thin-AI mechanic (design §6) in the same breath
it forswears the retention-guilt pattern. Both halves are required; a
version that taught thin-AI without the no-nag clause would be incomplete.

### 28. Edge cases (v53 additions)

| Case | Behavior |
|------|----------|
| Balance 10–33 at the queued ask | "Balance too low" toast; nothing filed, nothing held |
| Queued ask parked mid-wait | the `queued` feed entry persists; the card can ✕-park, the hold still resolves |
| Tour skipped before beat 7 | Archive link stays visible in the stream footer — the pointer isn't tour-gated |
| Watch-fork viewer hits S4e via "set up anyway" | identical card, identical price — the fork never re-prices |
| `?hired=1` return, offline line | always rendered — it's a fact about the world, not a personalization |

### 29. v53 merge notes

- `storage_key` → `rw_onboard_v53` (v39/v53 states coexist harmlessly; the
  demo reads only its own key).
- New anchors required on the real Wire at merge: `feed-archive` (the
  Archive link under the stream) joins the v25 set.
- New feed-vocabulary the demo renders: `queued`, `refunded`, and the
  locked line "queued request expired before activation" — all already in
  `requests.json`; no vocabulary invented.
- New analytics hooks (v53): `queue_lesson_shown`, `queue_outcome_seen`,
  `archive_beat_seen` — same envelope, stage + opted_out props only.
- At merge: queue holds resolve on the real resource board
  (`requests.json.resource_board` — `sky` claim, FCFS activation, review on
  activation not while waiting); the demo's fixed lapse stays demo-only.
