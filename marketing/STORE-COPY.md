# Store Copy — Real World ("The Mission")

**Status: v18 — launch-ready draft + generated capsule set, 2026-09-23.**
Not submitted anywhere. Capsule art is now real files under
`store/capsules/` (see `store/README.md`), regenerated from the current hero
shot by `tools/make_brand_assets.py` — the only outstanding art dependency
is the Steam library hero (§4). This
document is the single source of truth for storefront copy: master copy plus
per-platform variants (itch.io primary, Steam conditional), field-length
checks, capsule/hero art specs, disclosure matrix, and a tag plan. All claims
verified against the locked design doc (`rw-game-design-2026-09-22.md`) and the
monetization plan (`rw-monetization-plan-2026-09-22.md`, numbers marked
PROPOSAL). Nothing below promises a feature that doesn't exist in the design.

**Platform strategy (from market research):** browser-first product →
**itch.io is the natural primary storefront** (browser games live natively
there, free-with-purchases model supported). **Steam variant** is maintained
in case a downloadable wrapper ever ships — Steam is hostile to pure
browser-linked pages and takes 30%, so it stays a contingency, not a plan.

---

## 1. Master copy (canonical text, platform variants derive from this)

### 1.1 One-liner / tagline bank

Pick per context; all are ≤80 chars.

| Tagline | Chars | Use |
|---|---|---|
| A neighborhood that never stops performing. | 44 | Primary tagline |
| Watch for free. Reach in for a price. | 37 | Pricing-context pages |
| Twenty-eight lives on a real Mission block. | 44 | Social bios |
| The Truman Show, except Truman is the whole street. | 50 | Press/pitch only (comparative, not on storefront boilerplate) |
| Free to watch. Yours to change. | 30 | Short ads / social cards |

### 1.2 Short description
*(≤300 chars — Steam "short description", itch.io "short description/tagline"
allows ~256; keep under 256 to serve both)*

> A persistent AI neighborhood on a real Mission District block. 28 fictional
> residents live around the clock — watch free, forever. Ready to reach in?
> Buy a time-boxed request or move in yourself: rent, work, own the block.

(226 chars incl. spaces. Fits itch.io and Steam.)

### 1.3 Long description
*(Steam "about this game" body / itch.io page body — Markdown-safe)*

**Real World is a neighborhood, not a level.**

Set on real streets around Dolores Park in San Francisco's Mission District,
Real World is a persistent life simulation where twenty-eight fictional
residents — eight main characters with full AI minds, twenty ambient
neighbors — live, work, feud, and make up around the clock. The world runs
whether you're watching or not.

**Watching is the free heart of the game.** Follow any resident through their
day. Read the public request feed — every intervention anyone has bought,
attributed and priced in the open. Catch up on the week's drama like a
serial. Observation never costs anything.

**When watching isn't enough, buy a moment — not the world.** File a request:
a declared action with a declared duration, priced upfront in credits and
capped hard. Possess your own character for thirty minutes. Call for rain
over the park. Requests sort themselves into exclusive, compatible, or
queued; expire unfired and you're auto-refunded. When time runs out, the AI
takes the character back seamlessly.

**Or move in.** Create a character — the only one you'll ever control — rent
a room in game dollars, work a job, save toward a deed. The ladder is the
Mission's oldest story: tenant, owner, landlord. Miss rent and you can be
evicted, same as anyone.

**The one rule that matters:** the eight mains can never be possessed — not
by players, not by us. Their secrets stay theirs. What you watch is real
because nobody can fake it.

**What we don't sell:** no loot boxes, no gacha, no cash-out, no crypto, no
voice lines. Credits are non-transferable and never redeemable for money.

### 1.4 Feature bullets
*(store "key features" list — 7 bullets, each ≤140 chars)*

- **A real block, fictional people** — real Mission District streets and
  Dolores Park as the stage; every resident and address generated, so no
  fictional door is a real household's.
- **Eight unpossessable mains** — full AI minds with memory, jobs,
  relationships, and secrets. Protected from everyone, including the dev.
- **Free to watch, forever** — the spectator experience is the product's
  core, not a trial.
- **Time-boxed paid agency** — requests declare action + duration upfront,
  are auto-classified (exclusive/compatible/queued), hard-capped, and
  auto-refunded on expiry.
- **A public feed of everything** — every request, approval, refund, and
  admin action is visible to all viewers. Sunlight is the moderation model.
- **Live the ladder** — create a character, rent, work, buy, rent out.
  In-game dollars are earned only in-world; nobody buys their way up.
- **Two walled currencies** — credits buy agency; game dollars run your
  life. No conversion either way. No cash-out, ever.

### 1.5 Legal/footer line (use verbatim everywhere)

> All characters, businesses-as-populated, and addresses in Real World are
> fictional or system-generated. The streets are real; the people are not.

---

## 2. itch.io page (primary storefront)

itch.io fields: title, tagline (≤256), description (rich text), classification,
kind of project, pricing (min price / PWYW), tags, cover image 630×500,
screenshots, embed config.

### 2.1 Field-by-field

| Field | Value |
|---|---|
| Title | **Real World — The Mission** |
| Tagline | `A persistent AI neighborhood on a real Mission District block. 28 fictional residents live around the clock — watch free, forever. Reach in when you're ready.` (160 chars) |
| Kind of project | HTML / browser-playable |
| Classification | Game |
| Pricing | **$0 — free to watch** (base product). In-game purchases live inside the product, disclosed per §5. itch "pay what you want" NOT enabled (donations bypass our credit system) |
| Early access flag | Yes — label "In development / live dev build" until the sim ships publicly |

### 2.2 Page body (Markdown)

> Use §1.3 long description verbatim, then append:

**How it works**

1. **Watch** — open the neighborhood, follow anyone, read the public feed. Free forever.
2. **Request** — when you want to act, file a time-boxed request priced in credits upfront.
3. **Move in** — create a character, rent a room, work a job, climb the tenant → owner → landlord ladder.

**What a dollar buys (current proposal — will be finalized before launch)**

- A 30-minute visit inside your own character: about the price of a snack.
- Rain over Dolores Park for two hours: under a dollar.
- Creating a character: under five dollars, plus you still have to make rent.

**Honesty box**

- Everything in the screenshots is a real development-build capture.
- The eight main characters can never be possessed by anyone, including us.
- No loot boxes, no cash-out, no ads inside the sim view. Rewarded ads are
  opt-in from the wallet screen only, capped per day.

### 2.3 itch.io tags (ordered)

`life-sim` `simulation` `ai` `persistent-world` `spectator` `browser`
`drama` `economy` `sandbox` `emergent` `indie` `cozy` `real-time`
`single-player` `text-based` (partial — LLM dialogue is text) `san-francisco`

itch max is ~10 displayed tags; lead with: `life-sim` `simulation` `ai`
`persistent-world` `spectator` `browser` `drama` `economy` `sandbox` `indie`.

### 2.4 itch.io assets needed

| Asset | Spec | Status |
|---|---|---|
| Cover image | 630×500 PNG | **Done** — `store/capsules/itch-cover-630x500.png` (site copy at `site/assets/cover-itch-630x500.png`) |
| Screenshots | ≥3, 16:9 | `press-kit/screenshots/v19-A..D.png` (4 ready, grounded-shadow build) |
| Embed/splash | 1280×720 or auto | `keyart-16x9.png` ready |
| Social image | OG ≥1200×630 | `site/assets/og-card.png` ready |

### 2.5 itch.io embed / project settings

| Setting | Value |
|---|---|
| Embed type | `HTML` — embed the spectator build when it ships (`demo.html` `data-demo-src` is the same slot) |
| Viewport | 1280×720, "click to run" enabled (lazy-loads the sim, keeps page weight honest) |
| Fullscreen button | Yes |
| Mobile-friendly flag | Yes — touch input supported per design |
| Until the build ships | Publish as a **page-only project** (cover + description + screenshots, no embed) — itch allows non-playable pages; do not fake a build |

Screenshots order on the page: v19-D (director view — the hook), v19-B
(street level), v19-C (Dolores Park), v16-int-cafe (interior vignette),
then v19-A and the v1 before/after pair lower down for dev-minded readers.

---

## 3. Steam page copy (conditional variant — only if a wrapper ships)

Steam is a contingency. If used, it must wrap the browser build (e.g. a thin
CEF/native shell) — copy below assumes the same product.

### 3.1 Steam-specific fields

| Field | Value |
|---|---|
| Short description | §1.2 verbatim (226 ≤ 300) |
| About this game | §1.3 verbatim + system-requirements honesty line: "Real World is a browser-native simulation; the Steam version runs the same live world in a desktop shell." |
| Type | Simulation |
| Players | MMO? **No** — it's a single shared shard with spectator + limited actor slots. Steam requires "Massively Multiplayer" honesty; use `Single-player` + `Shared/split screen: no`; describe as "one shared world, many viewers" |
| Controller support | No — mouse/keyboard + touch |
| Early Access | Yes, with honest EA blurb (§3.3) |
| In-app purchases | Must disclose: "In-App Purchases" = credits packs + optional subscription + rewarded ads opt-in |
| Cloud saves | N/A (server-side world) — do not claim Steam Cloud |

### 3.2 Steam tags (ordered, user-facing first 5 matter most)

`Life Sim` `Simulation` `Immersive Sim` `Sandbox` `Economy` `Drama` `AI`
`Persistent` `Free to Play` `Indie` `Story Rich` `Real-Time` `Cozy` `Modern`
`America` `Choices Matter` `Replay Value` `Singleplayer` `Casual` `Relaxing`

### 3.3 Early Access blurb (Steam requires this)

> **Why Early Access?** Real World is a live simulation that grows with its
> audience. The neighborhood already runs; we're tuning the request economy,
> the social systems, and the balance between watchers and residents.
> **Current state:** free spectator mode, request system, character creation
> and housing ladder. **Planned:** more request types, deeper resident
> tools, cosmetic catalog. **Pricing:** the spectator core stays free
> forever; paid agency pricing is listed on our site and won't change without
> notice.

### 3.4 Steam review-copy note

Do NOT seed keys before the request economy is balanced — early reviewers
judging an empty feed would misrepresent the product. Gate: ≥4 weeks of
live request activity.

---

## 4. Capsule & hero art spec sheet (per platform)

Source art: `site/assets/keyart-16x9.png` (1920×1080), `keyart-square.png`
(1080×1080), `logo-primary.svg`, `logo-icon.svg`. All derivatives generated
with `tools/make_brand_assets.py` — extend it rather than hand-editing.
**v18:** every capsule below now exists as a real file in `store/capsules/`
(manifest: `store/README.md`); rerun the script to re-bake after any art
refresh.

| Platform | Asset | Size (px) | Status |
|---|---|---|---|
| itch.io | Cover image | 630×500 | **Done** — `store/capsules/itch-cover-630x500.png` |
| itch.io | Screenshot set | 1440×900 | **Done** — `press-kit/screenshots/v19-A..D` |
| Steam | Header capsule | 460×215 | **Done** — `store/capsules/steam-header-460x215.png` |
| Steam | Small capsule | 231×87 | **Done** — `store/capsules/steam-small-231x87.png` |
| Steam | Main capsule | 616×353 | **Done** — `store/capsules/steam-main-616x353.png` |
| Steam | Vertical capsule | 374×448 | **Done** — `store/capsules/steam-vertical-374x448.png` |
| Steam | Library capsule | 600×900 | **Done** — `store/capsules/steam-library-600x900.png` |
| Steam | Library hero | 3840×1240 | **FLAG** — needs commission or 2× upscale pass (art-track request) |
| Steam | Client logo | transparent PNG | **Done** — `store/capsules/steam-client-logo.png` |
| Steam | Page background | 1438×810 max | **Done** — `store/capsules/steam-page-bg-1438x810.png` (397 KB < 500 KB) |
| Social | OG / Twitter card | 1200×630 | **Done** — `site/assets/og-card.png` |
| Social | Avatar | 512×512 | **Done** — `site/assets/logo-icon.png` |

**Safe-zone rule:** keep logo + title inside the central 80% — storefronts
crop unpredictably. **Text rule:** no prices, no "free", no review scores on
capsules (Steam policy).

---

## 5. Monetization disclosure matrix (fill verbatim into store forms)

| Disclosure | Answer | Where |
|---|---|---|
| In-app purchases | YES — virtual currency packs ($0.99–$99.99 ladder, PROPOSAL) | itch, Steam, app stores |
| Subscription | YES — optional Resident $4.99/mo, Director $11.99/mo (PROPOSAL) | same |
| Ads | YES — opt-in rewarded ads only, capped 5/day; never pre-roll, never in sim view | same |
| Loot boxes / random items | NO | same |
| Cash-out / real-money trading | NO — credits non-transferable, non-redeemable | same |
| Online requirement | YES — persistent shared world | Steam "requires internet" |
| Account requirement | YES for paid actions; watching may not require one | forms |

---

## 6. Age-rating notes

- **Content:** everyday-life simulation. Relationships, secrets, rent
  disputes, gossip — soap-opera register, not explicit. No violence systems,
  no sexual content, no drug mechanics in the design.
- **Likely ratings:** ESRB **T** anticipated — mild language/themes via
  emergent AI text; PEGI **12** anticipated. Emergent LLM dialogue means the
  rating questionnaire needs honest answers about unmoderated-model risk —
  moderation machinery (input classifiers, review queue, logging) is part of
  the design.
- **COPPA/age:** request system and payments age-gated; under-13 spectators
  need a privacy pass before launch (see LAUNCH-CHECKLIST.md).

---

## 7. Localization audit (EN only at launch)

- All copy above is English; store fields claim English only.
- No date/currency/idiom strings embedded in image assets (keyart carries
  only the wordmark + "IN DEVELOPMENT" caption — safe).
- Strings in site HTML are semantic and extractable; no copy baked into SVG
  logos other than the wordmark.
- Watch-outs for future locales: "the Mission" is a proper noun pun in EN —
  do not translate literally; taglines relying on "watch/reach in" need
  transcreation, not translation.

---

## 8. Field-length checklist (pre-submission)

| Field | Limit | Current | OK? |
|---|---|---|---|
| Title | itch ~50 / Steam ~128 | 24 | ✓ |
| itch tagline | ~256 | 160 | ✓ |
| Steam short desc | 300 | 226 | ✓ |
| Steam about | ~unlimited (keep <8k) | ~2.4k | ✓ |
| Feature bullets | ~140 ea | ≤140 | ✓ |
| Tags (itch) | ~10 shown | 10 | ✓ |
| Tags (Steam) | 20 max | 20 | ✓ |

---

## 9. Versioning note

This file supersedes the v0 DRAFT (single generic template). Changes:
platform split (itch primary / Steam conditional), capsule spec sheet,
disclosure matrix, pricing phrasing aligned to the monetization plan's
PROPOSAL numbers without locking them, and the "what a dollar buys" honesty
box. **v18 changes:** capsule spec → generated `store/capsules/` set +
`store/README.md` manifest, itch.io embed/project-settings table (§2.5),
screenshot ordering, gallery rebased on the v19 art build (grounded
pawn/prop shadows). Update when: monetization numbers finalize (v8
pricing-page focus), Steam wrapper decision made, the library hero lands,
or the cast/address facts change.
