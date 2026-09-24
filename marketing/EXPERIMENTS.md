# Experiment Registry — Real World ("The Mission")

**Version:** v96 · 2026-09-23 · branch `sf/marketing` · LOCAL PLANNING ONLY.
Nothing here runs until the endpoint is configured and traffic exists.

One page, one rule: **an experiment is a hypothesis with a stop rule, logged
before it starts.** No peeking-and-calling, no metric shopping, no winners
declared on one week's numbers. This file is the registry — every test gets
a row before the first tagged link goes out.

---

## 1. How a test works here

- **Arms** are `utm_content` values on otherwise-identical links
  (ANALYTICS.md §6). Two arm names max per test (`thumb-a` / `thumb-b`).
  More arms = each arm takes longer to reach readable n.
- **Readout** is `tools/ab_compare.py <week.ndjson> --dim utm_content
  --baseline <control-arm> --transition <from>:<to>`.
- **Decision rule** (fixed, applies to every row below):
  - arm n < 30 sessions → `low-n`, no claims, keep running
  - |z| ≥ 1.96 on the named transition → flag for a **second week**;
    a winner is called only if week 2 repeats the direction
  - guardrail regression (see §3) → stop the arm regardless of z
- **Log everything**: started date, arms, hypothesis, primary transition,
  stop rule, and the verdict — including "no difference". A null result
  recorded is a result; an unlogged test is just noise.

## 2. Registry

| id | status | surface | arms (utm_content) | hypothesis | primary transition | stop rule | verdict |
|---|---|---|---|---|---|---|---|
| EXP-001 | planned | index hero CTA | `cta-how` vs `cta-watch` | "Watch the world live" out-converts "See how it works" for watch_start intent | `pageview:engaged` then `engaged:watch_start` | 2 weeks or arm n≥100 | — |
| EXP-002 | planned | demo page top block | `demo-trailer` vs `demo-stills` | leading with the 90s hero cut beats leading with the still gallery for `watch_start` | `pageview:watch_start` | 2 weeks | — |
| EXP-003 | planned | store/press thumbnails | `thumb-a` vs `thumb-b` (keyart vs in-sim HUD shot) | the HUD shot (shows it's a game, not a render) wins outbound→site click quality | `pageview:engaged` | 2 weeks | — |
| EXP-004 | planned | pricing teaser copy | `price-flat` vs `price-per-min` | "pay only for minutes that run" outperforms flat-pack framing on `price_calc` use | `pageview:engaged` + `price_calc` count | 2 weeks | — |
| EXP-005 | backlog | wire.html CTA order | `wire-first` vs `wire-second` | leading with the live Wire embed beats burying it under the pitch | `pageview:watch_start` | 2 weeks | — |
| EXP-006 | backlog | faq-exit CTA text | `faq-spectate` vs `faq-play` | "go watch" beats "go play" from the FAQ (watchers convert, askers browse) | `pageview:engaged` | 2 weeks | — |

Add rows only with all columns filled. `planned` = links not yet tagged;
`running` = tagged links live; `done` = verdict written.

## 3. Guardrails (checked alongside every readout)

A winning arm that regresses a guardrail loses anyway:

- **404 pageviews** — a variant that routes to a dead path is disqualified
- **`?nocollect` / opt-out rate** — if an arm's traffic opts out at
  markedly higher rates, the copy is probably overpromising; stop and read it
- **onboarding `tour_skipped` / `onboard_dismissed`** (post-launch, game-side)
  — a top-of-funnel win that produces worse onboarding is a net loss

## 4. What we will NOT test

- Anything that darkens the privacy posture (no popups, no countdowns, no
  "3 people are watching" pressure UI — the design doc bans manipulative
  mechanics in the game; the site inherits that).
- Price-level A/B (different visitors seeing different prices) — reads as
  unfair, and the pricing page is already labelled provisional.
- Copy that implies features the design doc doesn't have (accuracy rule —
  no variant may promise cash-out, voice, or cut features).

## 5. Standing analyses (not experiments — just run them)

These don't need arms; run on every weekly capture:

- `tools/funnel_scorecard.py` — the headline funnel for the week
- `ab_compare.py --dim utm_source` — which channel's sessions actually
  reach `watch_start` (source quality ≠ source volume)
- `ab_compare.py --dim utm_campaign` — `launch-2026` vs `press-embargo`
  vs `store-launch` once all three have traffic
