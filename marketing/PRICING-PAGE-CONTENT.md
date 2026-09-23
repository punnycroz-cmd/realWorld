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
   SURGE_MIN / SURGE_MAX / USD_PER_CR / PACKS — all at the top of the file),
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

## 1b. Page components (v39)

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
- **Quick answers** (`#quick`) — six pricing-specific `<details>` plus a
  **FAQPage JSON-LD** block in `<head>` (same six questions, verbatim-faithful
  wording). Scoped to money questions so it doesn't duplicate faq.html's
  broader FAQPage.
- **Estimator "First pack" toggle** (`#cc-first` + `FIRST_BONUS = 1.5` in
  `pricing.js`) — applies the +50% first-purchase bonus when picking the
  smallest covering pack; `price_calc` analytics event gains a `first` bool
  (spec/sink/report/dashboard updated in the same commit).

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
