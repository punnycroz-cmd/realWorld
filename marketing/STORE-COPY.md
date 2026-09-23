# Store Copy — Real World ("The Mission")

**Status: v63 — store-surface depth pass (review-response templates, itch
devlog drafts, differentiation block, sale-copy rules, transcreation
glossary, `tools/store_copy_check.py` validator); v55 refresh: v37 art rebase,
2026-09-24.** Supersedes v33.
Not submitted anywhere. Capsule art is real files under `store/capsules/`
(see `store/README.md`), regenerated from the current hero shot by
`tools/make_brand_assets.py` — the only outstanding art dependency is the
Steam library hero (§4). This document is the single source of truth for
storefront copy: master copy plus per-platform variants (itch.io primary,
Steam conditional), field-length checks, capsule/hero art specs, disclosure
matrix, and a paste-ready submission packet (§9). All claims verified
against the locked design doc (`rw-game-design-2026-09-22.md`), the
monetization plan (`rw-monetization-plan-2026-09-22.md`, PROPOSAL), and the
world track's shipped contracts: `world/requests.json` (action catalog,
rates, feed vocabulary), `world/creation.json` (hire/character creation),
`world/moderation.json` (review codes + denial wording), and
`world/businesses.md` (parody names). Nothing below promises a feature that
doesn't exist in the design.

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
| A neighborhood that never stops performing. | 43 | Primary tagline |
| Watch for free. Reach in for a price. | 37 | Pricing-context pages |
| Twenty-eight lives on a real Mission block. | 43 | Social bios |
| The Truman Show, except Truman is the whole street. | 51 | Press/pitch only (comparative, not on storefront boilerplate) |
| Free to watch. Yours to change. | 31 | Short ads / social cards |

### 1.2 Short description
*(≤300 chars — Steam "short description", itch.io "short description/tagline"
allows ~256; keep under 256 to serve both)*

> A persistent AI neighborhood on a real Mission District block. 28 fictional
> residents live around the clock — watch free, forever. Ready to reach in?
> Buy a time-boxed request or move in yourself: rent, work, own the block.

(222 chars incl. spaces. Fits itch.io and Steam.)

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
over the park. Nudge a neighbor — an ask, not mind-control; they can say no.
Requests sort themselves into exclusive, compatible, or queued; expire
unfired and you're auto-refunded. When time runs out, the AI takes the
character back seamlessly.

**Or move in.** Hire a character onto the cast — the only one you'll ever
control — rent a room in game dollars, work a job at Mudhaus or Auerbach
Hardware, save toward a deed. The ladder is the Mission's oldest story:
tenant, owner, landlord. Miss rent and you can be evicted, same as anyone.

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
- **Live the ladder** — hire a character onto the cast, rent, work, buy, rent out.
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
3. **Move in** — hire a character onto the cast, rent a room, work a job, climb the tenant → owner → landlord ladder.

**The request menu (current proposal — finalized before launch)**

| Ask | Cost (1 credit ≈ $0.01) |
|---|---|
| Possess your own character | 1.5 cr/min, 15–120 min — 30 min ≈ 45 cr |
| Camera director (spectator-side only) | 10 cr / 30 min |
| NPC nudge (an ask — they can decline; 50% back if they do) | 40 cr flat |
| Weather block over the neighborhood | 40 / 70 / 100 cr for 1 / 2 / 4 h |
| Event trigger at a venue or the park | 200 cr flat |
| Hire a character onto the cast | 500 cr one-time, human name review, slot-capped |

Queued requests cost 15% less and auto-refund if they expire unfired.
Exclusive actions get human review; surge pricing (×1.5–2.5) is always shown
before you pay, and cooldowns are never purchasable. Denied requests never
bill.

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
| Screenshots | ≥3, 16:9 | `press-kit/screenshots/v43-A..D.png` (4 ready, grounded-shadow build) |
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

Screenshots order on the page: v43-D (director view — the hook), v43-B
(street level), v43-C (Dolores Park), v16-int-cafe (interior vignette),
then v43-A and the v1 before/after pair lower down for dev-minded readers.

---

## 3. Steam page copy (conditional variant — only if a wrapper ships)

Steam is a contingency. If used, it must wrap the browser build (e.g. a thin
CEF/native shell) — copy below assumes the same product.

### 3.1 Steam-specific fields

| Field | Value |
|---|---|
| Short description | §1.2 verbatim (222 ≤ 300) |
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
| itch.io | Screenshot set | 1440×900 | **Done** — `press-kit/screenshots/v43-A..D` |
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
| User-generated text | YES, moderated — player request text + hired-character names pass an intent classifier + human review before entering the world (`world/moderation.json`) | Steam UGC question, platform trust/safety forms |
| AI-generated content | YES — disclosed honestly: residents are LLM-driven; live text is screened on the way in, never sold as authored story | Steam AI-disclosure field |

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
| Steam short desc | 300 | 222 | ✓ |
| Steam about | ~unlimited (keep <8k) | ~2.4k | ✓ |
| Feature bullets | ~140 ea | ≤140 | ✓ |
| Tags (itch) | ~10 shown | 10 | ✓ |
| Tags (Steam) | 20 max | 20 | ✓ |

This table is verified mechanically — run
`python3 tools/store_copy_check.py` before every submission and after any
copy or asset edit. It recomputes every claimed char count (§1.1, §1.2,
§10, §13), checks §4 "Done" assets exist on disk, confirms the §5
disclosure rows, and scans for banned marketing words. 0 fail required.

---

## 9. Submission packet (paste-ready runbook)

When the owner says "go", submitting the itch.io page is one sitting:

| Step | Action | Source |
|---|---|---|
| 1 | Create project, title + tagline | §2.1 table |
| 2 | Paste page body | §1.3 + §2.2 (incl. request menu + honesty box) |
| 3 | Upload cover | `store/capsules/itch-cover-630x500.png` |
| 4 | Upload screenshots in order | §2.5 ordering, files in `press-kit/screenshots/` |
| 5 | Set tags, pricing $0, early-access flag | §2.3 + §2.1 |
| 6 | Embed config | §2.5 — page-only until the build ships |
| 7 | Fill disclosure/IAP forms | §5 verbatim |
| 8 | Screenshot captions | `press-kit/captions.txt` |
| 9 | Fact-check pass | `python3 tools/store_copy_check.py` (0 fail) + every number vs `world/requests.json` + PRICING-PAGE-CONTENT.md §2 |
| 10 | Set visibility draft → owner review → public | owner decision |

Steam (conditional): same packet with §3 fields + §4 capsule set; the only
missing asset is the library hero (§4 FLAG row).

**Screenshot alt-text / caption set** (store forms + a11y, keep with
`press-kit/captions.txt` as canonical): v43-D "director view" → "Aerial view
of the Mission block at golden hour — the spectator camera's home position.";
v43-B street level → "Street-level view: facades, parody storefront signage,
a resident mid-errand."; v43-C park → "Dolores Park edge — palms, lawn,
residents on routines."; v16-int-cafe → "Interior vignette behind the glass:
the café venue from the street camera."; v1 pair → "Same engine, day one —
the before/after that anchors the devlog series."

**Feed-vocabulary note for storefront copy:** if marketing ever quotes feed
statuses on a store page, the canonical vocabulary is `world/requests.json`
feed_vocabulary (requested / in_review / approved / approved (modified) /
running / queued / resolved / refunded / not approved / admin action /
player session ended). Denials are always worded "request not approved" —
never a reason in public.

---

## 10. Product Hunt launch card (conditional — owner decides launch-day roster)

Product Hunt is a launch-day surface, not a storefront — but its field
limits are stricter than itch's, so the copy lives here. All fields
drafted; submission is owner-gated like everything else.

| Field | Limit | Draft |
|---|---|---|
| Name | ~60 | `Real World — The Mission` |
| Tagline | 60 | `A neighborhood that never stops performing.` (43) |
| Description | 260 | `A persistent AI neighborhood on a real Mission District block. 28 fictional residents live around the clock — watch free, forever. Reach in with a time-boxed request, or move in yourself: rent, work, own the block.` (214) |
| Topics | 3–4 | `Simulation` `Indie Games` `Artificial Intelligence` `Free` |
| Media | — | gallery: `keyart-16x9.png` + `v43-D/B/C` stills; video slot: `trailer/out/animatic-hero.mp4` until the real trailer exists |
| Launch day | — | Tuesday–Thursday, 00:01 PT, per PH convention — fold into the LAUNCH-CHECKLIST T-minus run sheet when scheduled |

**Maker's first comment** (posted at launch, from the dev account — no
testimonials, no fake third parties):

> We built Real World because we wanted to watch a neighborhood the way
> you watch a street from a café window — and occasionally tap the glass.
> Watching is free forever; the sim doesn't pause when you leave. If you
> want in, you can file a time-boxed request or hire a character onto the
> cast and climb tenant → owner → landlord. The eight mains can't be
> possessed by anyone, including us. Happy to answer anything — the
> request feed is public, so the moderation model is too.

---

## 11. itch.io page theme (brand palette, paste-in values)

itch lets creators recolor the project page without custom CSS. Values
from `site/assets/brand-tokens.json` (canonical: BRAND.md) — keep the
page visually identical to the site so store→site→game reads as one
product.

| itch field | Value | Token |
|---|---|---|
| Background | `#14161c` | Asphalt |
| Secondary bg / panels | `#1d2029` | Facade |
| Text | `#ece7dc` | Paper |
| Subtext / secondary | `#9aa0ae` | Fog |
| Links & buttons | `#e8a04c` | Café-light amber |
| Borders / dividers | `#2c303c` | Cornice |
| Page header image | `banners/banner-x-1500x500.png` (scaled) | — |
| Font | system stack (`system-ui, -apple-system, "Segoe UI", Roboto`) | matches site |

Never recolor to match a sale/holiday — the lit-window amber is the brand.

---

## 12. Steam system requirements (conditional — only if the wrapper ships)

Real World is browser-native; the Steam build would run the same live
world in a desktop shell. Requirements stay honest and minimal —
PROVISIONAL until the wrapper exists.

| | Minimum | Recommended |
|---|---|---|
| OS | Windows 10 / macOS 12 / Ubuntu 20.04+ | same |
| Processor | any 64-bit dual-core | quad-core |
| Memory | 4 GB RAM | 8 GB RAM |
| Graphics | integrated GPU, WebGL-capable | same |
| Network | broadband — the world is a persistent shared shard; **always online** | broadband |
| Storage | 500 MB | 1 GB |

Steam "additional notes" field: `Requires a free account for paid actions;
watching the neighborhood does not. See the disclosure matrix (§5).`

---

## 13. Short-description A/B variants (test before locking §1.2)

Three field-length-safe variants (all ≤256, itch + Steam compatible).
Rotate on the itch page post-launch; measure CTR via the UTM + analytics
conventions in ANALYTICS.md. Do not promise anything §1.3 can't back up.

| Variant | Hook | Text | Chars |
|---|---|---|---|
| A (current, §1.2) | spectator-first | A persistent AI neighborhood on a real Mission District block. 28 fictional residents live around the clock — watch free, forever. Ready to reach in? Buy a time-boxed request or move in yourself: rent, work, own the block. | 222 |
| B | agency-first | Watch a real Mission District block where 28 fictional residents never stop living. Then reach in: possess your character for thirty minutes, call for rain, nudge a neighbor — every request priced upfront, refunded if it never fires. Watching stays free. | 254 |
| C | drama-first | Rent is due on the block, and everybody knows it. A persistent AI neighborhood in San Francisco's Mission — eight unpossessable mains, twenty ambient neighbors, one public feed of every intervention anyone buys. Free to watch. Yours to change. | 243 |

---

## 14. Claim ledger — every store claim mapped to its source

Pre-submission fact-check gate (§9 step 9 expands into this table). If a
source contract changes, the claim changes — never the reverse.
"PROPOSAL" rows must not harden into promises until pricing is final.

| Claim used in §1–§3 copy | Source | Status |
|---|---|---|
| 28 residents = 8 mains + 20 ambients | `world/ambients.json` + cast bibles | shipped contract |
| Watching is free forever | design doc participation model | design |
| Requests: action + duration declared, priced upfront | `world/requests.json` actions/classes | shipped contract |
| Possess own character 1.5 cr/min, 15–120 min | `requests.json` classes.compatible | contract (rate = PROPOSAL) |
| Camera director 10 cr / 30 min, spectator-side only | `requests.json` actions.camera | shipped contract |
| Nudge 40 cr, 50% back on decline | `requests.json` actions.nudge (`refund_on_decline: 0.5`) | shipped contract |
| Weather 40/70/100 cr for 1/2/4 h, global cooldown | `requests.json` actions.weather blocks | shipped contract |
| Event trigger 200 cr, venue/openair claims | `requests.json` actions.event | shipped contract |
| Hire 500 cr, human name review, slot-capped | `requests.json` actions.hire + `world/creation.json` | shipped contract |
| Queued −15%, 24 h hold, expiry auto-refund | `requests.json` classes.queued | shipped contract |
| Exclusive = human review; surge ×1.5–2.5 shown pre-pay | `requests.json` classes.exclusive + surge | shipped contract |
| Cooldowns never purchasable; FCFS; admin compensation | `requests.json` fairness_invariants | shipped contract |
| Mains + landlord unpossessable (incl. dev) | design doc possession ban + `requests.json` possess note | design + contract |
| Tenant → owner → landlord ladder; eviction possible | `world/leases.json` / lease-ui.md + monetization plan | shipped contract + design |
| Two walled currencies, no conversion, no cash-out | design doc credits/dollars + monetization plan | design |
| Credit ladder $0.99–$99.99, subs $4.99/$11.99, ads 2 cr/view cap 5/day | monetization plan §2 (PROPOSAL) | **PROPOSAL — label as such** |
| Request text + names screened (classifier + human review) | `world/moderation.json` + `screen.js` taxonomy | shipped contract |
| Public feed vocabulary (requested…player session ended) | `requests.json` feed_vocabulary | shipped contract |
| Real streets, parody businesses, generated addresses | `world/businesses.md` + user-decision 2026-09-22 | shipped contract |
| LLM-driven residents; no voice lines; no loot boxes/gacha/RMT | design doc (voice/TTS cut; monetization bans) | design |
| Screenshots = real development-build captures | `site/shots/` (art-v40 build) | shipped |

---

## 15. Store review & comment response templates

Storefronts are two-way: itch comments, Steam reviews (post-wrapper), PH
comments. Rules first, then canned replies. These mirror
`templates/mod-responses.md` tone — neutral, factual, never defensive.

**Rules**

1. Reply as the dev, first person, signed "— the Real World devs". No
   marketing voice, no copy-paste feel — rewrite each canned line 20%.
2. Never argue a reviewer's experience; correct only factual errors, once.
3. Never promise dates or unbuilt features. "On the list" is the maximum.
4. Moderation questions get the public-feed answer (§9 feed-vocabulary):
   denials read "request not approved", every deny refunds, appeals are
   72 h human review. Never discuss a specific flag.
5. Pricing complaints get the two-sentence answer: watching is free
   forever; paid actions are priced upfront and auto-refund if they never
   fire. No justifying the ladder beyond that.
6. Harassment/dogpile → do not engage; use platform report tools and the
   incident-comms drafts (`social/drafts/incident-comms.md`).

**Canned replies**

- *"It's just watching, not a game"*: "Fair — watching is the free layer and
  it's built to stand alone. The paid layer is agency, not access: requests,
  possession of your own hired character, the housing ladder."
- *"Creepy / surveillance vibes"*: "We hear this a lot. The residents are
  fictional AI characters — no real people, no real data. Every intervention
  anyone buys is on the public request feed; nothing happens off-camera."
- *"Pay-to-win"*: "There's no win state to buy. Requests are time-boxed and
  priced upfront, the mains can't be possessed by anyone (including us),
  and cooldowns aren't purchasable — queuing is first-come-first-served."
- *"My request was denied, scam"*: "Denied requests refund in full —
  automatically. If yours didn't, email the support address with the
  request ID from the public feed. We never post denial reasons publicly;
  you can appeal via the 72 h review."
- *"AI slop"*: "The residents are LLM-driven, disclosed on the store page.
  Player text is screened on the way in, and the mains' storylines are
  author-seeded — the sim is the product, and we say so."
- *Feature request*: "Thanks — logging it. The request catalog and resident
  tools are the active surface; if it lands it'll show up in a devlog here."

---

## 16. itch.io devlog posts (store-surface drafts)

itch devlogs are part of the storefront — they rank on the page and feed
followers. Three drafts keyed to launch beats; reuse the journal.html
posts' images (`press-kit/screenshots/`). Post manually — nothing here is
scheduled anywhere.

**Post 1 — launch day** · title: *The block is live — watch free, forever.*
Body: what Real World is in 3 sentences (§1.3 first paragraph), the request
menu table (§2.2 verbatim), the honesty box, link to the public request
feed. Close: "Every request anyone files shows up on the feed — the
moderation model is public too."

**Post 2 — week 1** · title: *A week on the block: what people actually
asked for.* Body: 3–5 real feed moments (pull from `tools/build_recap.py`
output — never invent), one moderation stat (approved/modified/denied
counts from the transparency report format in `world/moderation.json`),
one thing we're tuning. If the feed was quiet, say so and recap resident
storylines instead — the honesty contract applies here too.

**Post 3 — month 1** · title: *Month one: the request economy in numbers.*
Body: request mix by action type, queue wait reality, refund count,
first hire-on-cast characters (public names only), next planned request
types marked PROVISIONAL. End with the feedback channel.

Cadence target: launch + weekly for month 1, then per update. Each post
gets one screenshot and one feed pull-quote — never a wall of text.

---

## 17. "How is this different from…" (differentiation block)

For store FAQ sections, PH comments, and review replies — the honest
one-paragraph answers. Verified against the design doc; no strawmen.

| "Isn't this just…" | The accurate answer |
|---|---|
| The Sims | Sims is a dollhouse you own; Real World is a shared street you watch. One persistent shard runs 24/7 whether you're there or not, the mains can't be controlled by anyone, and intervention is time-boxed requests — not god-mode. |
| AI Town / Smallville demos | Those are research sandboxes. Real World wraps the same idea in a designed product: authored mains, a public request economy with real moderation, a housing ladder, and a spectator feed built for watching. |
| Twitch Plays / crowd-control games | Crowd input there is chaos-voting on one stream. Here each request is an individual purchase, screened, priced, logged to a public feed — and the world doesn't pause for the streamer. |
| Second Life / IMVU | Those are avatar social platforms — you *are* your character. In Real World you hire a character onto an existing cast; the other 27 residents are AI, the social fabric is simulated, and you can also never touch it — just watch. |
| A idle/incremental game | The sim isn't a numbers treadmill and watching isn't gated. The free layer is the spectator experience itself. |

Never answer with "we're like X but better" — name the mechanic, not
the adjective.

---

## 18. Sale & discount copy rules

itch.io supports sales/bundles; Steam (conditional) has discount events.
The brand rules that keep a discount honest:

1. **Only the paid agency layer ever discounts.** Watching is already
   free — never frame "free to watch" as a sale.
2. **No urgency theater.** No countdown copy, no "last chance", no
   "X% claimed". A sale is a date range and a price, stated flatly.
3. **Credits are virtual currency (PROPOSAL ladder).** Discount the
   credit pack price, never the in-world exchange rate — "50% more
   credits per dollar" is the honest phrasing, never "credits worth more".
4. **Subscriptions don't discount at launch.** First sub discount is an
   owner decision; if run, annual-frame only ("founding rate"), never a
   monthly race-to-zero.
5. **Every sale page repeats the disclosure line verbatim** (§1.5):
   credits are non-transferable, non-redeemable, purchases final except
   auto-refunds. A sale never weakens the refund story.
6. **Post-sale comms:** one devlog note (per §16 format) naming the dates
   and the restored price. No "you missed it" guilt copy.

Draft sale blurb (itch "sale" description field, ≤140 chars):

> Credit packs are 30% off through <date>. Watching stays free; every
> request is still priced upfront and auto-refunds if it never fires.

---

## 19. Transcreation glossary (extends §7)

Terms that must survive localization unchanged or be deliberately
re-created — paste this table to any future localizer.

| Term | Handling | Why |
|---|---|---|
| Real World (title) | never translate | brand + trademark surface |
| The Mission / the block | keep "The Mission" + localize "the block" as the neighborhood idiom of the locale | proper-noun pun — literal translation reads as a task |
| watch / reach in | transcreate as a verb pair | the whole funnel is the watch→act gradient |
| hire a character (onto the cast) | keep the casting metaphor | "hire" not "create" is canonical (`world/creation.json`) |
| request / request feed | translate plainly, keep "feed" as the public-ledger noun | transparency vocabulary must stay concrete |
| credits / game dollars | translate; keep the two-currency distinction explicit | confusing them is the most common monetization misunderstanding |
| resident / ambient / main | translate; keep the 8/20 hierarchy terms distinct | the cast structure is a selling point |
| Parody venue names (Mudhaus, El Farolote, Auerbach Hardware…) | never translate; gloss on first use only | `world/businesses.md` canonical |
| "request not approved" | translate verbatim-neutrally, no softer variant | feed vocabulary is a contract — euphemisms break it |

---

## 20. Versioning note

This file supersedes the v0 DRAFT (single generic template). Changes:
platform split (itch primary / Steam conditional), capsule spec sheet,
disclosure matrix, pricing phrasing aligned to the monetization plan's
PROPOSAL numbers without locking them, and the honesty box. **v18 changes:**
capsule spec → generated `store/capsules/` set + `store/README.md` manifest,
itch.io embed/project-settings table (§2.5), screenshot ordering, gallery
rebased on the v29 art build. **v33 changes:** copy re-synced to the world
track's shipped contracts — request menu table uses `world/requests.json`
verbatim rates (possess 1.5 cr/min, camera 10 cr/30 min, nudge 40 cr,
weather 40/70/100, event 200 cr, hire 500 cr + human name review), "create
a character" phrasing → "hire a character onto the cast" per
`world/creation.json`, canonical parody venues (Mudhaus, Auerbach Hardware)
in the long description, disclosure matrix gains moderated-UGC + AI-content
rows, new §9 submission packet + caption/alt-text set + feed-vocabulary
rule. Update when: monetization numbers finalize, Steam wrapper decision
made, the library hero lands, or the request catalog/feed vocabulary changes
(grep this file for the old rates). **v48 changes:** new §10 Product Hunt
launch card, §11 itch page theme palette (from brand tokens), §12 Steam
system-requirements block, §13 A/B short-description variants, §14 claim
ledger mapping every store claim to its source contract; gallery/capsules/
keyart rebased to the art-v31 build; §1.2 char count corrected (226→222).
**v50 changes:** gallery/capsules/keyart rebased to the art-v32 build
(dry-season turf, bougainvillea on sun-exposed walls); trailer EDL now
targets v32 stills and gains a 6s bumper program + thumbnail renderer.
**v55 changes:** gallery/capsules/keyart rebased to the art-v37 build (real
Mission terrain + marine-layer set); trailer EDL/animatics rebuilt on v37
stills.
**v60 changes:** gallery/keyart/capsules/og-card rebased to the art-v40
build (Mission-Revival pediments, wire shadows); trailer EDL/animatics/
thumbnails rebuilt on v40 stills.
**v63 changes:** new `tools/store_copy_check.py` validator (recomputes
every claimed char count, verifies §4 assets on disk, checks §5
disclosure rows, scans banned words) — its first run caught five real
miscounts in §1.1/§10 tagline lengths, now corrected (44→43 ×2, 50→51,
30→31). New §15 store review/comment response templates, §16 itch.io
devlog drafts (launch/week-1/month-1), §17 differentiation block
(Sims/AI Town/Twitch Plays/Second Life/idle), §18 sale & discount copy
rules + draft sale blurb, §19 transcreation glossary; versioning note
renumbered §15→§20; §8/§9 now route through the checker.

**v53 changes:** gallery/capsules/keyart rebased to the art-v36 build
(Karl's marine layer over the Mission; boom-rig/veiling-glare lens work);
trailer EDL + all animatics/thumbnails rebuilt on v36 stills.
