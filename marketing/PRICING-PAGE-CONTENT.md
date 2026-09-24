# Pricing Page Content — canonical copy & flip runbook

**Scope:** `marketing/site/pricing.html` is the rendered artifact; this file is the
source of truth for its numbers, copy intent, and the launch flip.
**Number authority:** `devin-reviews/rw-monetization-plan-2026-09-22.md` — every
figure below is adopted verbatim from that doc. All numbers are **PROPOSAL**
until owner sign-off. Do not invent conflicting prices anywhere in marketing.
**Design constraints (locked, `rw-game-design-2026-09-22.md`):** watching is
free; requests declare action + duration upfront, credits upfront, hard cap;
queued expiry auto-refunds; credits non-transferable/non-redeemable; no credit↔
game-dollar exchange; mains unpossessable by anyone; no loot boxes; cooldowns
and surge on contested resources; admin overrides compensate players.

---

## 1. The flip (launch-day runbook)

`pricing.html` renders in one of two states, driven by a **single attribute**:

```html
<body data-page="pricing" data-pricing="provisional">   <!-- pre-launch -->
<body data-page="pricing" data-pricing="final">         <!-- at launch -->
```

- `data-pricing="provisional"` (current): shows all `prov-only` elements —
  the "Provisional" hero banner, per-table provisional badges, the footer
  disclaimer. `final-only` elements are hidden by CSS.
- `data-pricing="final"`: pure-CSS switch in `css/style.css` (no JS needed —
  works with scripts disabled). Hides `prov-only`, reveals `final-only`
  (final-pricing banner + footer line).

**Flip procedure:**
1. Owner approves final numbers in writing (checklist gate).
2. If numbers changed, edit the tables **and pack cards** in `pricing.html`,
   the rate constants in `site/js/pricing.js` (CLASSES / QUEUE_DISCOUNT /
   SURGE_MIN / SURGE_MAX / USD_PER_CR / PACKS at the top of the estimator
   IIFE; ITEMS / PRESETS / the same constants again in the scene-builder
   IIFE; COMP_RATE / EXCL_RATE / CAM_CR / SUBS / PACKS / TIE in the
   breakeven IIFE — keep all three blocks in sync),
   AND update this file.
3. Change the one attribute. Done — no other edits needed for state.

Files that must be updated **in the same commit** if numbers change:
`faq.html` (subscription/surge/expiry answers), `social/drafts/pricing-post.md`,
`STORE-COPY.md` (IAP disclosure phrasing), `PRESS-KIT.md` (fact sheet),
`site/js/pricing.js` (estimator constants — the page prints "~" estimates, so
drift shows as wrong math, not wrong claims).

## 1a. Page components (v22)

- **Pack cards** (`.pack-grid` / `.pack-card`) — six visual cards replacing
  the bare table as the primary presentation; the full table survives inside
  a `<details>` ("Full pack table") for screen-reader/print completeness.
  Regular carries the "Recommended" ribbon — an editorial pick, NOT a
  sales-rank claim (never use "most popular" — unverifiable pre-launch).
- **"What a credit buys" strip** — three stat cards (~22 cr ≈ 20¢ session,
  40–100 cr weather block, 500 cr character slot) grounding the unit.
- **Cost estimator** (`#cost-calc` + `js/pricing.js`) — class select, duration
  slider clamped to the class cap, queued (−15%) and surge (×1.5–2.5)
  toggles; outputs floored credit count, ≈USD at ~1¢/cr, and the smallest
  pack that covers it. Pure progressive enhancement: without JS the rates
  table above it is the source of truth, and a `<noscript>` line says so.
  Emits `price_calc` analytics events (debounced; class/minutes/flags only,
  never amounts).

## 1b. Page components (v40)

- **In-page TOC** (`.page-toc` chips in the hero) — anchor nav to all eight
  sections; pure HTML, no JS.
- **Pack coverage lines** (`.pcover` on each `.pack-card`) — translate each
  pack into compatible-session equivalents at the canonical 15-min ≈ 22 cr
  (floor of 1.5 cr/min × 15): 100→4, 550→25, 1,150→52, 2,500→113,
  6,750→306, 14,000→636. If rates change, recompute these too.
- **The receipt** (`#receipt`, `.receipt`) — a monospace mock of the
  pre-payment receipt: worked exclusive example (30 min, surge ×2.0 →
  360 cr ≈ $3.38) with the quiet-hour (180 cr ≈ $1.69) and queued
  (153 cr ≈ $1.44) alternates in copy below it. USD conversions use the
  ~$0.0094/cr blended rate from pricing.js. Copy promise: "No charge
  appears that wasn't on this screen" — that is a product requirement,
  keep it true.
- **"What a month can cost"** (`#month`, four persona cards) — Watcher $0 /
  Tourist $1–5 / Resident $4.99 (600 cr ≈ 27 quarter-hour sessions) /
  Landlord-track $10–20 ramp. All figures derived from §2; nothing new is
  priced here.

## 1c. Page components (v52)

- **Refund ledger** (`#refunds`) — one table consolidating every refund rule
  that was previously scattered across three lists: queued expiry 100%,
  denied-in-review 100%, admin override pro-rated, nudge declined 50%,
  payment-error cash correction, and the explicit non-refundable row (time
  that already ran). Wording follows the moderation contract: a deny always
  refunds; flags track repeat abuse, not honest mistakes.
- **Compare matrix** (`#compare`, `.matrix`) — Watcher / Player / Resident /
  Director columns across 11 capabilities. The two closing rows are the
  persuasion: things nobody can buy are identical in every column.
- **Regional pricing** (`#regional`) — three cards on method (one credit
  ladder, PPP-adjusted local prices, published table; no arbitrage because
  credits are non-transferable; EU/UK tax-inclusive). No invented local
  numbers — the table itself publishes at launch. Replaces the old bullet.
- **Quick answers** (`#quick`) — pricing-specific `<details>` plus a
  **FAQPage JSON-LD** block in `<head>` (same questions, verbatim-faithful
  wording). Scoped to money questions so it doesn't duplicate faq.html's
  broader FAQPage.
- **Estimator "First pack" toggle** (`#cc-first` + `FIRST_BONUS = 1.5` in
  `pricing.js`) — applies the +50% first-purchase bonus when picking the
  smallest covering pack; `price_calc` analytics event gains a `first` bool
  (spec/sink/report/dashboard updated in the same commit).

## 1d. Page components (v67)

- **Worked scenes** (`#scenes`, `.scene-card`) — four static cards pricing a
  scene end-to-end instead of a line item: foggy morning (40–100 cr ≈
  $0.38–0.94), hour as yourself (88 cr ≈ $0.83; 76 cr queued), block-party
  headliner (event 150–300 + 30 min exclusive = 330–480 cr ≈ $3.10–4.51),
  move-in day (slot 500 + 30 min compatible = 544 cr ≈ $5.11 — Starter's 550
  covers it to the credit, a deliberate copy detail). All math is derived
  from §2 tables; no new prices invented.
- **Scene builder** (`#scene-calc`, second IIFE in `js/pricing.js`) —
  steppers for every priced ingredient (sessions in 15-min floored units,
  weather/nudge/event/camera/slot), queued −15% and surge ×1.5–2.5 flags
  applied to the right lines only. Totals print as a low–high range when
  range-priced items are in the mix; the covering pack is chosen at the TOP
  of the range, with the first-purchase bonus shown as a cheaper alternate.
  Emits `scene_calc` (item:qty csv + flags + preset — never amounts).
- **The promise** (`#promise`) — three commitments: page changes before
  checkout, purchases keep the terms they were bought on (echoes the
  final-state banner), provisional→final flips once. No new policy —
  consolidates what the banner and refund ledger already commit to.

## 1e. Page components (v82)

- **Subscription breakeven** (`#worthit`, `.sub-verdicts`, third IIFE in
  `js/pricing.js`) — two sliders (compatible 0–240 min/mo, exclusive
  0–60 min/mo) + a camera toggle priced as a **printed assumption** (~2 hrs/mo
  = 40 cr; free inside Director, where it's unlocked). The widget prices the
  month three ways — smallest covering pack, Resident $4.99 + top-up pack for
  stipend overage, Director $11.99 + top-up — and names the cheapest with a
  25¢ tie band (`TIE`), highlighting winning rows (`.sv-best`). The verdict
  can and does say "don't subscribe" and "none — watching is free". Caveats
  under the widget print the two honest limits: stipend credits never expire
  but the sub keeps charging, and bursty pacing favors packs. Emits
  `sub_calc` (knobs + verdict only — never amounts; spec/report/fixture
  updated in the same commit).
- **Price-list ledger** (`#history`) — dated public changelog of the price
  list itself. One row today (2026-09-22 provisional publication); the
  launch flip adds a row, and post-launch changes land here before checkout
  per `#promise`. The row's State cell is flip-aware (prov-only "current" /
  final-only "superseded").
- **Print support** — `@media print` block in `style.css` (nav, footer,
  widgets, CTAs drop out; cards/rows/tables break-safe) plus a
  `beforeprint`/`afterprint` handler in `pricing.js` that auto-opens every
  `<details>` so the full pack table and quick answers reach paper. An
  honest price list should survive being printed and checked later.
- **Quick answers +1** — "Is a subscription worth it?" pointing at the
  widget (deliberately not in the FAQPage JSON-LD — the answer is
  interactive, not a fixed text answer).

## 1f. Page components (v97)

- **Per-hour comparison** (`#hourly`, `.cph`) — a pure-CSS proportional bar
  strip pricing ONE HOUR four ways: watching $0, compatible ~$0.85 (90 cr),
  exclusive ~$3.30 (360 cr), and one external scale anchor (a typical US
  movie ticket ~$11/2 hr ≈ $5.50/hr — hedged in copy as "for scale, not a
  claim about anyone else's product"). All RW figures derive from §2 rates;
  the whole block is `role="img"` with a full-text `aria-label` since the
  bars are decorative proportions. No JS.
- **Shareable scene links** (`#sc-share` in the scene builder, same IIFE in
  `js/pricing.js`) — the builder's state serializes to a URL hash
  (`#scene=<item>:<qty>,...|<q><s>`): ingredient picks + queued/surge flags
  only, never amounts or identity. "Copy a link to this scene" writes the
  full URL via `navigator.clipboard` and falls back to `history.replaceState`
  + an "in the address bar" note. On load, `#scene=` hashes restore picks
  (clamped to item maxima; unknown items ignored) and set `preset:"link"` on
  the `scene_calc` event. Share completion emits `share_click` with the new
  `surface:"scene"` prop (demo.js keeps emitting without it — spec allows
  the subset). No price math lives in the hash, so a shared link stays true
  even if the ladder changes — it re-prices from the current constants.
- **Who pays for the free channel** (`#whopays`) — a three-card business-model
  explainer placed between "a month, priced" and regional pricing: watchers
  ($0, no ad breaks — rewarded ads are opt-in for players and pay credits),
  players (à-la-carte agency purchases fund the world, posted publicly),
  subscribers (the predictable floor). Deliberately carries no conversion
  percentages — qualitative only, nothing invented.
- **Quick answers +1** — "What does an hour inside the world cost?" (~90 cr
  ≈$0.85 compatible / ~76 cr queued / 360 cr ≈$3.38 exclusive, pointing at
  `#hourly`), added to BOTH the visible `<details>` list and the FAQPage
  JSON-LD so they stay verbatim-faithful.

## 1g. Page components (v112)

- **"The fine print — set in type you can actually read"** (`#fineprint`,
  `.fineprint` / `.fp-row` in style.css) — a `<dl>` of ten rows that reprints
  every catch, cap, and asterisk from the page at body size: provisional
  state (flip-aware prov/final copy), closed-loop credits, spend caps, ad
  caps + adults-only, sell-the-ask-not-the-outcome, public-feed attribution,
  subscription caveats, non-purchasable fairness, regional method, and the
  ledger-first change rule. Nothing new is disclosed here — every row is a
  restatement of a rule printed elsewhere on the page, which is the point.
  Placed between `#promise` and `#history`; TOC chip added.
- **Missing anchors fixed** — the property-ladder and cosmetics sections
  gained `id="ladder"` / `id="cosmetics"` and TOC chips; they were the only
  two major sections unreachable by anchor.
- **OfferCatalog JSON-LD** — a second structured-data block listing all six
  packs + both subscriptions as `Offer`s with `price`/`priceCurrency`,
  marked `"availability": "PreOrder"` so crawlers see the pre-launch state
  rather than live prices. At the launch flip, change PreOrder → InStock in
  this block in the same commit as the body attribute.

## 1h. Page components (v127)

- **Co-sponsor section** (`#split`, between `#scenes` and `#subs`) — the
  group-night mechanic the page never explained: when a shared resource is
  already claimed, the form offers three paths — queue (−15%, ≤24 h visible
  hold, expiry auto-refunds), wait (free, feed shows every live claim), or
  co-sign a *running* identical-intent request. Co-sponsoring is priced
  honestly per `world/requests.json` `co_sponsor` + `world/request-ui.md` §8:
  same flat block price (explicitly NOT a discount), compatible class,
  auto-runs on a passing screen, cap 4 sponsors, every sponsor named on the
  feed line, scope = declared intents (weather today, venue events later).
  Worked-example table: same-sky co-sign vs. different-forecast queues.
  Cross-links the `#scene-calc` share link for planning; TOC chip "Bring
  friends" added.
- **Fineprint +1 row** — "Co-sponsors pay full price" restates the queue-skip-
  not-discount rule at body size, keeping `#fineprint`'s every-catch promise
  true.
- **Quick answers +1** — "Can we split the cost of a request?" in BOTH the
  visible `<details>` list and the FAQPage JSON-LD (verbatim-faithful):
  credits are non-transferable so no literal splitting; co-sponsor is the
  same-price path; the scene link is the planning path. No new prices.

## 1i. Page components (v142)

- **The life of a credit** (`#journey`, `.cpath` in style.css) — a 4-step
  ordered flow between `#receipt` and `#hourly`: buy → declare → lock
  upfront → "or it comes back" (queue expiry/deny 100%, declined nudge 50%,
  admin override pro-rated). The last step is styled `cp-back` (accent-2
  border/counter) — the refund path is the visual destination, which is the
  point. Closing line: "there is no fifth outcome" — the closed loop as the
  anti-theft/anti-RMT feature. Pure HTML/CSS counters, no JS.
- **Playing at $0 — the honest math** (`#zero`, `.zero-ledger`/`.zr`) —
  between `#whopays` and `#regional`: three cards (the show $0 / rewarded
  ads 2 cr·view 5/day·25/wk → ≤50 cr ≈$0.45/wk / what that buys) plus a
  two-column ledger of free-path math: ~2 short sessions a week from ads,
  ~10 weeks of daily views to a 500-cr character slot, and the $4.99
  Starter (825 cr with the one-time +50% first-purchase bonus) as the
  printed shortcut. Deliberately says "real, but not fast" — honest funnel
  copy, not a guilt wall. Closing note restates that rep/tenure/landlord
  standing is earn-only at equal speed for everyone.
- **The vocabulary, defined** (`#terms`, reuses `.fineprint`/`.fp-row`) —
  an 8-term glossary between `#history` and `#quick`: credit, compatible,
  exclusive, queued, surge, co-sponsor, stipend, game dollars. Every
  definition restates its canonical number; nothing new is priced.
- **Quick answers +1** — "Can I play without paying anything?" in BOTH the
  visible `<details>` list and the FAQPage JSON-LD (verbatim-faithful,
  pointing at `#zero`).
- **TOC chips** — "A credit's life" (#journey), "Play at $0" (#zero),
  "Vocabulary" (#terms). Section count now 24; all anchors verified to
  resolve.

## 1j. Page components (v157)

- **"Surge, on the clock"** (`#clock`, `.clock`/`.clk`/`.clk-prime` in
  style.css) — a 24-cell pure-CSS strip between `#receipt` and `#journey`
  shading the prime-time band (18:00–23:00 server-local, hours 18–22 lit)
  where the ×1.5–2.5 exclusive-class surge can apply. The two trigger
  conditions are restated verbatim from the monetization plan (recent
  exclusive use <6 h OR prime-time window); a worked table prices the same
  30-min venue hold at 14:00 base (180 cr ≈$1.69) vs 19:30 low/high surge
  (270/450 cr ≈$2.53/4.22) vs queued-for-quiet (153 cr ≈$1.44). Bullets
  clarify the boundaries: compatible sessions never surge, the 6-h rule
  works off-peak, and weather one-shots carry their own ×2 surge proposal.
  `role="img"` with a full-text aria-label; no JS.
- **Fineprint +1 row** — "Surge is scheduled, not sprung" restates both
  surge triggers and the quiet-hours discount at body size, keeping
  `#fineprint`'s every-catch promise true.
- **Quick answers +1** — "When is it cheapest to file a request?" in BOTH
  the visible `<details>` list and the FAQPage JSON-LD (verbatim-faithful,
  pointing at `#clock`).
- **TOC chip** — "Surge hours" (#clock) between "A receipt" and "A
  credit's life". Section count now 25; all anchors verified to resolve.

## 2. Canonical numbers (PROPOSAL — from monetization plan §2)

### Credit packs (~$0.01/cr effective Schelling point)

| Pack | USD | Credits | Bonus | $/cr |
|---|---|---|---|---|
| Pocket | $0.99 | 100 | — | $0.0099 |
| Starter | $4.99 | 550 | +10% | $0.0091 |
| Regular | $9.99 | 1,150 | +15% | $0.0087 |
| Plus | $19.99 | 2,500 | +25% | $0.0080 |
| Pro | $49.99 | 6,750 | +35% | $0.0074 |
| Mogul | $99.99 | 14,000 | +40% | $0.0071 |

First purchase +50% any tier (one time). No expiration/dormancy fees.
Daily spend cap $200 default / $500 verified; minors hard-capped.
Rewarded ads: 2 cr/view, 5/day + 25/week caps, adults only, opt-in only.

### Request pricing (per-minute, declared duration, hard cap)

| Class | Rate | ≈USD/hr | Min | Max |
|---|---|---|---|---|
| Compatible | 1.5 cr/min | ~$0.85 | 15 min | 120 min |
| Exclusive | 6 cr/min | ~$3.30 | 15 min | 60 min |
| Queued | −15% of class | — | same | same |

Surge ×1.5–2.5 (recent exclusive use <6 h or prime-time 18:00–23:00 server
local) — shown pre-payment. Cooldowns never purchasable.

### One-shot actions

Weather 40–100 cr/block · NPC nudge 30–60 cr (50% refund on decline) ·
event trigger 150–300 cr · camera director 10 cr/30 min.

### Subscriptions

Resident $4.99/mo (600 cr, +1 slot →2, queued-class tie-break priority,
digest, badge) · Director $11.99/mo (1,500 cr, +1 slot →3, camera mode,
monthly cosmetic, show credits, early request types). No power perks.

### Characters, housing, progression

Character slot 500 cr, max 3/account. Rent $700–5,500 game-$/mo (credits
cannot pay rent). Deed fee 1,000–5,000 cr by tier. Landlord license 2,000 cr
+ own ≥30 days + reputation gate. Cosmetics 100–1,200 cr direct purchase.

## 3. Regional pricing policy (PROPOSAL)

Packs priced in local currency on a **published** PPP-adjusted table
(Steam-style). Publish the table; never silently geo-markup. Non-transferable
credits make arbitrage structurally impossible. EU/UK display tax-inclusive
prices (consumer law). Payment stack: Stripe + Stripe Tax at launch; merchant
of record (Paddle/Lemon Squeezy) when EU/UK volume justifies.

## 4. Founder-review table — our anchors vs. live market (verified 2026-09-22)

| RW anchor | Competitor | Their price | Source: monetization plan §1 |
|---|---|---|---|
| ~$0.01/cr | Robux | $0.0125→$0.0089 effective ($4.99→$199.99 tiers) | roblox.com/upgrades/robux |
| ~$0.01/cr | V-Bucks | $0.0112→$0.0072 (post-Mar-2026 raise) | fortnite.com/item-shop/v-bucks |
| Resident $4.99 | Roblox Plus / SL Plus / Habbo HC | $4.99 / $5.50 / $3.99 per mo | plan §1 table |
| Director $11.99 | Fortnite Crew | $11.99/mo | fortnite.com/fortnite-crew-subscription |
| Exclusive ~$3.30/hr | FiveM supporter tiers | £4.99–19.99/mo for queue priority | buy-tebex.io pricing guide |
| Deed fee $9–45 | Sims 4 DLC band | $9.99–39.99 per pack | screenrant/pixelsandbloom 2026 |
| Character slot ≈$4.50 | Sims Kits / F2P char slots | $4.99 kits; $9.99+ slot norms | plan §2.4 |
| Ads 2 cr/view | US rewarded eCPM | $15–20 ≈ $0.015–0.02/view | plan §1 eCPM row |

Note for reviewers: Roblox Plus (Apr 2026) carries NO stipend — our $4.99
with a 600 cr stipend is *more* generous than the anchor; flagged in the plan
as a deliberate funnel choice, revisit on margin data.

## 5. Copy rules for this page (voice)

- Numbers are printed, never implied. "Honest" is the brand: surge, refunds,
  and margins are explained, not hidden.
- Always pair a price with what it buys ("15-min session ≈ 20 cents").
- Never say "cheap" — say the number and let it be cheap.
- Prohibited: "cash out", "earn money", "invest", any odds language, any
  promise that a request guarantees an AI outcome ("sell the ask, not the
  outcome").

## 6. A/B backlog (post-launch, owner-gated — from plan §5)

Unit price $0.008/0.010/0.012 → first-purchase +25%/50% → min duration
10/15 min & compatible 1.0/1.5 → stipend 500/600/750 → ad reward 1/2 cr.
Never A/B fairness (cooldowns, possession rules, refunds).
