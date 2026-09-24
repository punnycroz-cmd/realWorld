# Onboarding — spec & copy deck (world v11; v25 adds §10–16; v39 adds §18–23; v53 adds §24–29; v67 adds §30–36; v81 adds §37–43; v95 adds §44–49; v109 adds §50–55; v123 adds §56–62)

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

---

## v67 — the fifth pass: the eligibility layer

v11–v53 taught a stranger everything about *what the world is* and *how
asks behave*. What the funnel never did was ask the one compliance question
the monetization plan already mandates: **who is holding the account** —
because §2.7 restricts rewarded ads to adults and §6 makes under-13
accounts spectator-only. v67 adds that single question, placed so it can
never feel like a gate.

### 30. The age band (S2a) — who the account is

One question, rendered as a four-option fork card after the handle step and
before the wallet:

> "Money features differ by age. Pick the band that fits this account — it
> decides what the next card offers. Watching is identical for every band,
> always free, and this question never gates it."

| Band | What the next card offers |
|------|---------------------------|
| Under 13 | A watching account — no wallet, no requests, nothing to buy |
| 13–17 | Wallet and requests work; under-18 spending limits apply |
| 18 or older | The full ladder, plus the opt-in sponsored-message path |
| Rather not say | Fine — money features treat the account as under-18 |

- The band fronts **every paid stage** (`S3`, `S4*`) via `normalizeStage()` —
  unset redirects to S2a; `u13` redirects to S3u. It fronts nothing free:
  the feed, the tour, the Archive, the fork, and the handle step are
  identical for all four bands.
- The pick is stored once in session state and correctable in place via a
  **"Wrong band? Fix it"** link on both wallet variants — never re-asked,
  never nagged.
- A skip line carries the eternal exit: *"Skip — I'll only ever watch."*

### 31. The watching account (S3u) — under-13, honestly

Under-13 replaces the wallet card entirely:

> "This account watches — that's the whole product, not a restricted
> version of it. The feed, the Archive, the block's whole week: all of it,
> free, always. Wallets and requests are for older accounts. Nothing here
> is missing — there was never anything to unlock."

- No pack ladder, no top-up, no ask filing, no ads affordance — the
  affordances are absent by construction (paid handlers also bail on
  `u13`), not merely hidden.
- The checklist's money items (handle / wallet / first ask) relabel to
  *"spectator account — watching only"* — never styled as failures.
- S5 on a `u13` band drops the hire button; the settle card says watching
  is the whole show. The tone test: a child reading S3u should feel
  *done*, not *denied*.

### 32. Under-18 bands — teen and rather-not-say

`teen` and `na` share the money surface: the wallet works, requests work,
and one disclosure line rides the wallet card:

> "Under-18 accounts carry spending limits — any cap is stated before a
> purchase, never after." (`na` adds: "You chose not to say, so this
> account is treated as under-18.")

The plan (§6) hard-caps minors but sets no figure — so the card **states
that limits apply and quotes no number**. Quoting one would be inventing
pricing.

### 33. The free-credit path — rewarded ads, adults only

Plan §2.7 verbatim, surfaced for the first time: on the adult wallet card
only,

> "No card? A sponsored message earns **2 cr** — up to 5 a day, opt-in from
> this card only. Never in the stream, never before you can watch."

- The demo affordance (*"watch one (demo) — +2 cr"*) credits +2 cr with a
  `N/5 today` counter; at the cap the line reads *"That's today's five —
  the cap resets tomorrow"* — no countdown, no urgency framing.
- Eligibility is structural: the line and button render only when
  `S.band==='adult'`, and `adView()` re-checks the guard. Teen, na, u13,
  and unset accounts never see the affordance — consistent with the plan's
  "no rewarded ads to under-18 accounts."
- Placement obeys the locked rule: opt-in only, on the wallet card — never
  pre-roll, never mid-session, never inside the sim view.

### 34. Edge cases (v67 additions)

| Case | Behavior |
|------|----------|
| Band unset, saved stage is a paid one | `normalizeStage()` in `render()` redirects to S2a — stale state can't skip the question |
| u13 files nothing | every paid handler (`topup`, `fileAsk`, `fileNudge`, `fileWeather`, `fileQueue`) bails with a neutral toast even if reached |
| u13 + `?hired=1` | the first-day card still renders (the hire exists), but requests aren't offered on the account — same band rules |
| Rather-not-say | treated as under-18 on every money surface; watching identical; stated on the card, never punished |
| Wrong band picked | "Wrong band? Fix it" returns to S2a — correction is free, no confirm-shame |
| Ads at daily cap | line flips to the cap message; the affordance disappears, no countdown |

### 35. v67 merge notes

- `storage_key` → `rw_onboard_v67` (v53/v67 states coexist harmlessly; the
  demo reads only its own key).
- At merge the band comes from the **account record**, not a per-session
  self-declaration — this demo's self-pick models the shape only; any
  verification flow (age assurance, parental approval) is production work,
  out of scope here.
- New analytics hooks (v67): `band_declared` (no band value in props —
  eligibility is not funnel data), `ads_line_shown`, `ad_demo_viewed` —
  same envelope, stage + opted_out props only.
- The rewarded-ads line is the first surface of the §2.7 path; the wallet
  card in `request.html` may adopt the same wording at merge rather than
  re-derive it.

### 36. What v67 still must never do

- Never gate the feed, the tour, or any free card behind the age band.
- Never frame the under-13 spectator account as a restriction, downgrade,
  or something to grow out of.
- Never render the ads affordance for a non-adult band — the guard is
  structural, not cosmetic.
- Never quote a minor spend-cap figure the plan doesn't set.
- Never treat the band answer as targeting data — it decides which card
  renders, nothing else.

---

## v81 — the sixth pass: the house & the other hands

v11–v67 taught a stranger everything about *their own* path — watch, name,
fund, ask, settle — and every honest "no" on it. What the journey still
hadn't said: **the player is not the only hand on the world, and the people
who run it are visible too.** Three additions, all transparency-first, plus
the one piece of map a settled viewer deserves: where the arc goes from here.

### 37. The house acts in the open (tour beat 8)

A final coach-mark, anchored to an `admin` event in the stream
(`feed-admin` — every demo seed set carries one):

> "The people who run the block act on this same feed. Every admin action
> lands here — attributed, and when it bumps a player's plans, compensation
> is automatic. Nobody's hand is invisible, including ours."

This is the transparency rule (design §3 — the public request feed lists
every admin action) made legible in the tour, and it deliberately comes
**last**: you teach the viewer their own ask is public before you show them
the house is too. The beat's demo anchor is a seed event with a
compensation note (`admin action — venue window reset · players
compensated 90 cr`) — wording verbatim from `feed.json` event seeds; no new
vocabulary invented.

### 38. The other hands (S4f) — compatible coexistence, taught

The queue lesson taught "wait"; nothing yet taught "together." After the
queued ask resolves, one more optional card closes the request teachings:

- A **"watch one land"** demo affordance drops a second handle's compatible
  ask onto the feed (`marlo_v — camera director, 30 min · running`) — not
  the player's, not queued behind theirs. The card states the rule:
  compatible asks run **alongside** each other; nobody waits behind a
  compatible session. That overlap *is* the multiplayer — two players, two
  characters, one block.
- Copy promise, verbatim: *"Your session never held anyone else's. Reach in
  at the same time as a stranger and the block just gets busier — the feed
  shows both, attributed to both."*
- The card also draws the boundary honestly: exclusivity is about the
  *resource* (the sky, a venue window), never about the player — you cannot
  buy another player's session away, and nobody can buy yours.
- Requires no balance and files nothing — it's a free teaching card; it
  still sits behind the band normalizer (paid-stage context) so the
  watching account never sees ask mechanics framed at it.

### 39. Surge honesty, stated where it applies (S4c)

The exclusive-ask card gains one disclosure line, verbatim-faithful to
plan §2.2:

> "If the sky ran exclusive in the last 6 h, the request form shows a surge
> multiplier — ×1.5 to ×2.5 — **before** you pay. The price you see is the
> price filed; nothing is added after."

Quoted as a range exactly as the plan states it — no specific multiplier is
invented for the demo. The rule that matters to a new player is the
ordering: **disclosed upfront, never a surprise after.** The card does not
demonstrate surge (the demo's guided ask is fixed-price); it teaches that
the form itself is honest.

### 40. The long arc, named at settle (S5 + S6)

Settling in is the right place to show the map without pushing it. The S5
card (all non-u13 bands) gains one line:

> "And if watching ever turns into staying: tenants here can buy — listings
> on the block's market board read like normal listings, priced in game
> dollars plus a deed fee in credits — and owners can rent out a second
> unit. That's the whole arc: tenant → owner → landlord. It's not a step of
> setup; it's just what the block has."

The S6 first-day card gains the parallel line for a new hirer:

> "The listings on the market board are real places in this world — your
> character rents like everyone, and the path from there (save, buy, one
> day rent out a place of your own) runs entirely in game dollars plus a
> deed fee."

Both lines are **context, not funnel**: no button leads to the market, the
market link isn't moved into the card, and the u13 settle card stays
unchanged (no money surfaces). The arc is named because a viewer deserves
to know the world has a depth axis — the same reason the tour names the
Archive.

### 41. Edge cases (v81 additions)

|| Case | Behavior |
||------|----------|
|| Band unset / u13 reaches S4f | `normalizeStage()` redirects like any paid-context card — the watching account never sees ask mechanics |
|| "Watch one land" clicked twice | idempotent — the scripted co-ask posts once; later clicks are a no-op toast |
|| Co-ask card parked | parked like every card; the feed entry it would have added simply never posts — nothing dangles |
|| Admin beat anchor missing at merge | audit fails — the beat teaches a real feed kind; a demo without an admin event can't carry it |
|| Surge line vs queued discount | both quoted verbatim from plan §2.2 — surge as a range, queue as −15%; no derived figure anywhere |

### 42. v81 merge notes

- `storage_key` → `rw_onboard_v81` (v67/v81 states coexist harmlessly; the
  demo reads only its own key).
- New anchors required on the real Wire at merge: `feed-admin` (any admin
  event in the stream) joins the v25/v53 set.
- Feed vocabulary the demo renders: `admin action` + the compensation note
  — already in `feed.json`/`requests.json` vocabulary; nothing invented.
- New analytics hooks (v81): `admin_beat_seen`, `coask_seen`,
  `surge_line_shown` — same envelope, stage + opted_out props only.
- At merge: the scripted co-ask becomes a real spectator's compatible
  request surfacing naturally on the feed — the demo's fixed handle stays
  demo-only. The market-board pointer binds to `market.html`'s real link.

### 43. What v81 still must never do

- Never render an admin action without attribution — the house is public
  or the promise is broken.
- Never let a surge multiplier surface after payment, or quote a specific
  multiplier the plan doesn't set (the range ×1.5–2.5 only).
- Never frame coexistence as contention — no "someone else got there
  first" framing on compatible asks; only exclusives contend, and only on
  the resource.
- Never present the ownership arc as a setup step or a next funnel — it's
  named context at settle, with no button attached.
- Never imply a player can buy out, preempt, or see inside another
  player's session — attribution is public, interiors are not.

---

## v95 — the seventh pass: the stay

v11–v81 taught a stranger the whole request grammar — every class, every
honest "no," the house's own visibility — and named the ownership arc. Two
things the journey still hadn't said out loud: **what a credit actually
isn't** (the fine print nobody reads until it bites), **that a standing
order exists at all** (the plan's two subscriptions have never surfaced
anywhere in onboarding), and **what the first possession feels like** —
the hire flow ends at S6's first-day card, but nobody has ever walked a
player through stepping into their character for the first time.

### 44. The credit rules, stated once (S3)

The wallet card gains one fine-print line under the ladder, rendered for
every money-eligible band (adult / teen / na — u13 has no wallet):

> "Three things credits never do: they **never run out**, they **never
> cash out**, and they **never move between accounts**. They buy agency
> here — that's the whole job."

All three are locked design constraints (credits non-transferable /
non-redeemable / no cash-out; no expiration or dormancy fees per plan
§2.1) — this is disclosure, not a selling point. Stated once, in plain
terms, before the first purchase. It is deliberately *not* framed as a
feature list ("no fees!") — it's the shape of the thing.

### 45. The standing option — subscriptions (S3)

The wallet card gains one more line — the only place onboarding ever
mentions subscriptions:

> "If you'll be around a while, two standing orders exist — stated once,
> here, and never pushed again. **Resident — $4.99/mo:** 600 cr a month,
> a second character slot, the weekly digest. **Director — $11.99/mo:**
> everything in Resident, plus 1,500 cr a month, a third slot, camera
> director mode, and your name in the show credits. A pack is a one-time
> thing; a standing order is for regulars."

- Contents quoted verbatim from plan §2.5 (PROPOSAL) — every perk named
  is one the plan lists (stipend, slots, digest, camera director mode,
  show credits); nothing else is promised or implied.
- **Stated once, honestly:** no "best value" marker, no comparison
  styling, no default-checked toggle, no trial framing, no recurring
  prompt on later visits. The card says it exists; that's the whole
  funnel.
- A demo affordance (*"preview Resident (demo) — the 600 cr stipend
  lands"*) credits +600 cr once, labeled as the stipend, so a tester
  sees what the standing order *does* without inventing mechanics —
  second click is a no-op toast. It demos the stipend only; no other
  perk is simulated.
- Rendered inside S3, so it inherits every existing guard: u13 never
  sees it, the band normalizer fronts it, teen/na carry the spend-limit
  line alongside. The handler re-checks the band like every paid
  affordance.

### 46. The first visit (S7) — possession, walked through once

S6 tells a new hirer what a hired character *isn't*. What it never did
was walk them into the character. `?hired=1` now ends at a card with a
third option: **"Take the first visit (demo — 15 min, 22 cr)"** — the
compatible-rate minimum billable (1.5 cr/min × 15 min, plan §2.2's
≈22 cr figure quoted as-is).

Filing posts the real feed entry (`possession — first visit, 15 min ·
running`, attributed) and opens the visit card:

> "You're inside the person you hired — for the next 15 minutes you walk
> their shift, their errands, their Tuesday. The briefing is still all
> you see: public profile, surface relationships, routine — secrets stay
> redacted even to you. Step out any time — the ask ends and their own
> brain resumes mid-motion. Or let the clock run: the cap is hard, and at
> 15 minutes they take back over, mid-stride. The time was bought up
> front — stepping out early ends it; nothing is metered back."

- Two exits, both honest: **"Step out early"** resolves the feed entry
  as `player session ended` (the locked neutral wording — same line a
  zeroed wallet logs); **"Jump ahead — 15 min later"** resolves at the
  cap. Both hand back to the AI mid-motion; neither claims a refund on
  unused minutes — the plan promises none, so the card says so.
- S7 is a paid stage — it sits behind the band normalizer like every
  ask-context card (unset → S2a, u13 → S3u) and additionally requires
  `hired` + balance ≥ 22; without either, the affordance simply isn't
  offered on the S6 card.
- It teaches the one thing no other beat covers: possession is a
  *session*, not a state — entered, capped, exited, always attributed.

### 47. Edge cases (v95 additions)

| Case | Behavior |
|------|----------|
| Balance < 22 at the visit | "Balance too low" toast; nothing filed |
| `?hired=1` on u13 | S6 renders; the visit affordance doesn't — paid handlers bail on `u13` like every other paid path |
| Visit affordance without `hired` | not rendered — S7 only exists off the first-day card; `stage('S7')` without `hired` redirects to S5 |
| Stipend preview clicked twice | idempotent — +600 lands once, later clicks toast a no-op |
| Step out, then re-enter | the visit is a one-time lesson — after any exit the card offers settle; a second visit would be a normal request, not onboarding's job |
| Sub line on the watch path | identical card, identical prices — the fork never re-prices; the line is also *skippable* with everything else |

### 48. v95 merge notes

- `storage_key` → `rw_onboard_v95` (v81/v95 states coexist harmlessly;
  the demo reads only its own key).
- Feed vocabulary the demo renders: `possession — first visit` +
  `running` / `player session ended` / `resolved` — all already in
  `requests.json` vocabulary; nothing invented.
- New analytics hooks (v95): `credit_rules_seen`, `subs_line_shown`,
  `sub_stipend_previewed`, `first_visit_filed`, `visit_ended`
  (cap|stepped_out) — same envelope, stage + opted_out props only.
- At merge: the sub line's demo affordance is replaced by the real
  account record; the visit files a normal compatible possession
  request through `requests.json`'s pipeline — the demo's fixed 15-min
  block stays demo-only. S7's entry point binds to create.html's real
  post-approval redirect (`?hired=1` already is).

### 49. What v95 still must never do

- Never render the subscription line on the watching account, or
  anywhere the band normalizer hasn't cleared — it inherits S3's guards.
- Never style either subscription as better value, default-check it, or
  re-surface it after the card is seen — "stated once" is the contract.
- Never invent subscription terms the plan doesn't set — no trial, no
  cancellation promises, no perk beyond §2.5's list.
- Never promise a refund on early release — the plan prices declared
  blocks up front; the card says the time was bought, nothing metered
  back.
- Never frame the first visit as owning, keeping, or unlocking the
  character — it is a capped session inside a person you hired, and the
  briefing stays redacted throughout.
- Never let the stipend demo read as granted spend — it previews the
  standing order's mechanics, labeled as such, once.

---

## v109 — the eighth pass: the quiet contract

v11–v95 taught a stranger the world's grammar — every ask class, every
honest "no," the house's visibility, the arc, the first visit. What the
journey still hadn't said: **what watching costs you in data (nothing)**
and **what the viewer's one hand on the world is** (a flag). Three
additions, all quiet by design.

### 50. Watching is invisible (tour beat 6)

A new coach-mark inserted between the follow beat and the reach-in beat —
you learn watching is a lens before you learn it's invisible — anchored to
the feed header's "(free, always)" line (`feed-anon`):

> "Watching leaves no mark. There's no viewer list, nobody on the feed
> can see who's looking, and the block keeps no count of you. The only
> thing that ever carries a name is an ask — agency is public, presence
> is private."

The admin beat stays last (v81's ordering rationale stands); privacy
belongs early — it's a promise about the product, not a feature of it.
The promise is structural: any future "viewers watching" surface would
falsify the beat, so the never-list now bans it outright.

### 51. What this page keeps (S2b) — the data card

One free card between the handle step and the age band, stated once:

> "This build keeps your place in this checklist in **this browser's
> storage** — nothing is sent anywhere, and there's no email and no
> account to attach it to. Delete your site data and it forgets you
> entirely. When accounts arrive at launch the shape stays the same:
> **asks are public, watching is private.** The feed attributes every
> request to a handle; it never lists who's looking."

- Free-tier, outside the band normalizer — the u13 watching account sees
  it too (it says nothing about money).
- Disclosure, not reassurance theater: it states what is kept and where.
  It never claims the build collects less than it does, and it never
  promises what the launch build hasn't built — "the shape stays the
  same" is the only forward claim, and it's a design constraint, not a
  feature.
- Closable like every card; "Got it" continues to S2a.

### 52. Flagging an ask (S4g) — the viewer's one hand

After the other-hands beat, the last teaching card closes the loop:
public asks imply a public check. Copy:

> "Every ask on the feed is public — and every ask is flaggable. If a
> request reads wrong to you, flagging it **costs nothing, files
> nothing**, and sends it to the same human review the exclusive asks
> already pass through.
>
> Two honest edges: a flag is silent on the feed — it never shows who
> flagged, and the entry itself doesn't change; review happens
> off-stage. A flag is not a public vote, and nobody can be shamed for
> one. And flags attach to **player asks only, never to the residents**
> — the cast's lives aren't moderated; what they do is the story, and
> the world answers it in-world."

- The demo affordance (*"flag an ask on the feed (demo)"*) marks
  `S.flagged` once and deliberately **does not touch the feed** — the
  flag's silence is the lesson; the toast says so. At merge it calls the
  same human-review queue; a pulled ask resolves with the same neutral
  feed vocabulary as any review — no flag-specific wording is invented.
- Scope is design §11 verbatim: moderation applies to player requests.
  The card says so by teaching that flags can't reach the residents —
  emergent AI behavior is inviolable, and onboarding says it out loud.
- Free card, files nothing, needs no balance — but it lives in
  ask-context, so it sits behind the band normalizer like S4f: the
  watching account never sees flag mechanics framed at it.

### 53. Edge cases (v109 additions)

| Case | Behavior |
|------|----------|
| Tour skipped before beat 6 | the privacy promise isn't tour-gated — the data card (S2b) restates "asks public, watching private" for everyone |
| Flag clicked twice | idempotent — `S.flagged` guards; second click toasts "flagged already — review has it" |
| Flag card reached on u13 | `normalizeStage()` redirects to S3u like every ask-context card — the watching account never sees flag mechanics |
| S2b parked | parked like every card; reopens only via the footer link; no state is lost — that's the card's own point |
| `localStorage` blocked | the data card's promise degrades gracefully — nothing persisted is the existing v25 rule; the card's claim stays true (nothing sent anywhere regardless) |
| Flag with no requests on feed | affordance still works — it marks the lesson, not a specific entry; at merge the affordance binds per-entry |

### 54. v109 merge notes

- `storage_key` → `rw_onboard_v109` (`S.flagged` added; v95/v109 states
  coexist harmlessly; the demo reads only its own key).
- New anchors required on the real Wire at merge: `feed-anon` (the
  feed's "free, always" header line) joins the v25/v53/v81 set.
- Tour order changed: privacy is beat 6, reach-in/archive/admin renumber
  to 7/8/9 — admin stays deliberately last per §37.
- No feed vocabulary invented — a flag is silent on the public feed; if
  review pulls a flagged ask it resolves with existing neutral wording.
- New analytics hooks (v109): `privacy_beat_seen`, `data_card_seen`,
  `flag_lesson_shown`, `flag_demo_sent` — same envelope, stage +
  opted_out props only.
- At merge: `flagDemo` binds to the real per-entry flag affordance →
  human-review queue; the demo's mark-the-lesson behavior stays
  demo-only. `S2b`'s "browser's storage" claim must be re-verified
  against whatever account system lands — if launch adds real accounts,
  the card's forward clause ("asks are public, watching is private")
  stays verbatim.

### 55. What v109 still must never do

- Never keep a viewer list or surface presence anywhere on the feed —
  the privacy beat would be a lie the moment one existed.
- Never let a flag attach to a resident — flags route player asks to
  human review; the cast's lives are never moderated (design §11).
- Never show who flagged, a flag count, or frame a flag as a public
  vote — flagging is free, silent, and sends no verdict.
- Never claim the build collects data it doesn't — the data card states
  device-local storage, no email, no account, verbatim.
- Never teach flagging as a response to disliked drama — in-world
  consequences handle the cast; review handles asks.
- Never let the flag affordance cost credits or require a wallet — the
  viewer's check on agency is free or it isn't a check.

## v123 — the ninth pass: the loop

v11–v109 taught a stranger the world's grammar and the quiet contract —
what agency costs, what watching costs (nothing), and whose hands are on
the world. What the journey still hadn't taught is the **free product's
actual loop**: watching pays off in days, not minutes. The production-3
observer loop — catch up → follow → predict → check → revise — is the
reason anyone comes back a second time, and onboarding was ending at
settle without ever naming it. Four additions, all free, all for every
band including the watching account.

### 56. The long game (S5b) — the loop, named once

A new free card between the settle fork and done, reachable from every
exit that ends in "keep watching" — S1w, S3u, both S5 variants — so the
watching account meets it too (it says nothing about money):

> "Watching pays off in days, not minutes. The loop is simple: come
> back, catch up, pick someone to follow, make a prediction, check it
> later. Everything on this card is free — this is the product."

- Free-tier, outside the band normalizer — predictions and catch-up
  are spectator features; the u13 watching account sees the identical
  card, verbatim. There is no paid variant and never will be.
- The card replaces nothing — settle still ends onboarding; S5b is the
  last card before it, not a new step of setup. No checklist item is
  added: the loop is a habit, not a task.
- Watch-path relabeling holds: on the watcher fork this card is the
  whole point, not an "only if you ever want to act" item.

### 57. The catch-up edition — stated, not demoed

One line on the card, quoted as fact about the product the Archive
already documents:

> "When you come back, a catch-up edition waits at the top — up to
> three verified changes since your last visit, each linked to the
> moment it happened and the earlier context. Verified means
> observable: what the feed showed, never a guess at what someone was
> thinking."

- "Verified" is the honesty contract: the edition reports what was
  seen, not inferred motive. A follow must never surface a resident's
  interior as fact — that fence is the same one thread-following
  carries (never present hidden memory or an inferred motive as
  public fact).
- "Up to three" is a cap, not a quota — a quiet week can fill zero.
  The line never promises a change happened; "nothing you follow
  changed" is a legal edition.

### 58. Predictions (S5b affordance) — a note to yourself, not a bet

The card's one affordance, demo-marked like the flag lesson:

> "A prediction is a note to yourself, not a bet. It costs nothing,
> nothing rides on it, nobody wins anything. Its whole job is
> checking it later — right or wrong, you revise what you thought
> you knew about them."

- Demo: "make a prediction (demo)" offers the fixed safe pick —
  *"the bench parliament is still going at dusk"* — marks `S.pred`,
  then "jump ahead — check it" drops a world event on the feed
  (dusk, the bench parliament adjourning) and marks `S.predChecked`.
  The prediction itself **never writes a feed line** — it's private,
  like watching. Only the world event is public.
- Free, no balance, no band gate — it sits beside no ask context, so
  it does NOT ride the band normalizer; the watching account can
  predict too. Predictions are the spectator's verb.
- Never scored: no points, no streak, no leaderboard, no accuracy
  display, no "you were right" flourish beyond a plain resolution.
  A wrong prediction is the same lesson as a right one — revise.

### 59. The open invitation — stated, not demoed

One line teaching the may-ignore rule the bounded-opportunity layer
already carries (drama.json `bounded_opportunities`):

> "Sometimes the block posts an open invitation — a shared meal, a
> repair afternoon, a mural day. The characters decide whether to
> come. They may ignore it entirely, and an empty table is still the
> story — nobody rescues it."

- Uptake belongs to the characters; onboarding promises nothing about
  attendance. "May ignore" is said out loud so a viewer who watches an
  invitation sit empty reads it as consequence, not a broken feature.
- Player-sponsored invitations are a request-pipeline concern, not an
  onboarding lesson — the card teaches the *watching* of invitations
  only, and never implies a viewer can buy attendance.

### 60. Edge cases (v123 additions)

| Case | Behavior |
|------|----------|
| Prediction made, demo closed before check | `S.pred` persists at the v123 key — the card reopens with "jump ahead — check it" still offered |
| Check clicked twice | idempotent — `S.predChecked` guards; second click toasts "already checked — revise and pick the next one" |
| S5b reached with no handle | fine — predictions are private; no name is needed or asked |
| S5b on u13 band | identical card — predictions and the edition are watching-layer; nothing is normalized away |
| S5b parked | parked like every card; reopens only via the footer link |
| Returning viewer | no S5b auto-resurface — the returning rule holds; the loop card is a first-session lesson |

### 61. v123 merge notes

- `storage_key` → `rw_onboard_v123` (`S.pred`, `S.predChecked` added;
  prior keys coexist harmlessly — the demo reads only its own).
- No new tour beats — the loop is a card, not a coach-mark; the tour
  stays at nine, admin still last.
- Settle reroute: S1w, S3u, and both S5 variants now pass through S5b
  before `settle()` — a card, not a step; the checklist is unchanged.
- New analytics hooks (v123): `loop_card_seen`, `prediction_made`,
  `prediction_checked`, `edition_line_seen` — same envelope, stage +
  opted_out props only.
- At merge: the prediction affordance binds to the spectator
  predictions store (device-local until accounts exist — the S2b
  forward clause covers it); the catch-up edition binds to the
  Archive's last-visit record; the demo's fixed pick stays demo-only.
- The open-invitation line assumes the bounded-opportunity layer
  exists as public feed events the characters may ignore
  (creation.json OPENS / drama.json bounded_opportunities are the
  current instance). If no invitation has ever surfaced, the line is
  still true — it describes the kind of event, not a promise.

### 62. What v123 still must never do

- Never score a prediction — no points, streaks, accuracy stats,
  leaderboards, or prize framing; "not a bet" is the whole lesson.
- Never charge for a prediction or gate it behind a handle, a band,
  or a wallet — the spectator's verb is free or it isn't one.
- Never write a prediction to the public feed — predictions are
  private like watching; only world events are public.
- Never present an inferred motive as a verified change — the
  edition reports the observable, never the interior.
- Never promise a resident will take an invitation — "may ignore"
  stays in the copy; an ignored invitation is never framed as a bug.
- Never let the loop card read as a retention hook — no "come back
  tomorrow," no streak framing; "come back" names the viewer's own
  interest, never a debt the block is owed.
