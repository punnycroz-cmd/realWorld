# SEO Plan — Real World ("The Mission")

**Version:** v45 · 2026-09-24 (third pass — gallery refresh v26→v28, audit
tooling extended: srcset/og:image/CLS checks, question bank, future indexable
surfaces register). **v46 delta:** gallery refresh v28→v29; new 14th page
`/archive.html` added to §3 and §13.
**Status:** LOCAL — site is launch-ready markup against a placeholder domain
(`realworld-game.example`). Nothing published; no accounts registered.
**Truth sources:** `devin-reviews/rw-game-design-2026-09-22.md` (product truth),
`research_notes/.../report.md` (market), `devin-reviews/rw-monetization-plan-2026-09-22.md`
(pricing authority). Competitor set: InZOI, The Sims 4, Paralives, Second Life,
GTA RP/FiveM, AI Town, Twitch Plays Pokémon.

---

## 1. Positioning (the paragraph every page and post reuses)

*Real World* is a persistent, browser-based "Truman Show" life simulation set in
a real San Francisco Mission District neighborhood around Dolores Park. 28
fictional characters live there around the clock — 8 main characters with full
AI minds whose stories can never be taken over by anyone, and 20 ambient
neighbors. Watching is free, always. Players who want to reach into the world —
file a time-boxed request, possess their own hired character, join the cast —
pay for **agency**, never for access.

**Search strategy:** we flank, we don't charge head terms. "Life sim" / "Sims
alternative" belong to EA/Krafton budgets. Nobody owns "Truman Show game",
"watch AI villagers", or "persistent AI world" — and nobody else sells
spectator-first agency into a persistent AI society (research §2). Every tier
below maps to a page we already have or a journal slot already templated.

## 2. Keyword map

Volumes are directional estimates — no keyword-tool access in this environment.
Validate with Search Console + one real tool (Ahrefs/Keyword Planner) inside the
first week post-launch; re-score tiers at day-30.

### Tier 1 — niche head terms (we can win these)

| Keyword | Intent | Landing page | Why we win |
|---|---|---|---|
| truman show game | High — the pitch itself | index | Phrase does our explaining; zero incumbents |
| AI life sim / AI life simulation game | High | index, features | InZOI mainstreamed the term; ride the wake |
| watch AI villagers / AI villagers game | High | demo, features | Smallville/AI-Town interest never got a product |
| persistent AI world | Medium | features, how-it-works | "Runs 24/7 whether you watch or not" |
| AI characters you can't control | Medium-high | features, faq | The possession ban IS the differentiator — own it |
| browser life sim / life sim in browser | Medium | demo, how-it-works | Zero-install watchability |

### Tier 2 — comparison & adjacent (steal dissatisfied demand)

| Keyword | Intent | Landing page | Angle |
|---|---|---|---|
| InZOI alternative | Medium | faq + journal essay | "Sterile citizens" complaint → a written cast with secrets |
| Sims alternative free | Medium | faq + journal essay | NOT a Sims clone — pitch "watch, don't decorate" |
| games like Twitch Plays Pokémon | Low-med | journal essay | Collective-agency ancestry — honest lineage post |
| GTA RP browser game | Low | journal essay | "Second life with job and rent" is proven demand (FiveM) |
| Paralives release / Paralives alternative | Medium | faq comparison block | Waiting-audience capture; never disparage |
| cozy life sim 2026 | Medium | index support copy | Tone match, "but with stakes" |

### Tier 3 — mechanic & place long tail (cheap wins, journal fodder)

| Keyword | Landing page |
|---|---|
| possess an AI character | how-it-works, faq |
| dolores park game / mission district game | index, features (real-map hook; press loves it) |
| AI character drama / AI soap opera | journal recaps |
| virtual neighborhood you can watch | index, demo |
| public request feed game | how-it-works |
| rent controlled apartment game | journal (municipal realism post) |
| AI NPC with memory game | journal + features (memory-model angle once sf/memory lands) |
| NPC daily schedule simulation | features |

### Avoid list (never target, never imply)

- "voice AI characters", "AI girlfriend/boyfriend" — voice/TTS cut; wrong audience.
- "earn money playing", "cash out", "play to earn" — no RMT/cash-out, ever.
- "loot box", "gacha" — direct purchases only; say so.
- Real SF business names — parody names only (world/businesses.md canon:
  Mudhaus Coffee, El Farolote, Flying Pannier, Auerbach Hardware).

## 3. Page-by-page spec (all 14 URLs, as shipped)

Title ≤60 chars, meta ≤155 chars, one H1, canonical, OG+Twitter cards. ✔ = live
in markup today.

| Page | Title (shipped) | Primary keyword | Schema | Notes |
|---|---|---|---|---|
| `/` (index.html) | Real World — A Living Neighborhood You Can Watch | truman show game, AI life sim | ✔ VideoGame | Hero `v30-D` preloaded (webp, fetchpriority=high); #wire feed-strip anchor — "the wire" copy is index-owned, demo.html owns "watch" queries |
| `/features.html` | Features — The Cast, The Rules, The Economy \| Real World | AI villagers game | — | Candidate for ItemList of features later |
| `/cast.html` | The Cast — 8 Main Characters, 20 Neighbors \| Real World | AI characters game, truman show cast | ✔ WebPage | Public profiles only — no drama seeds; venues use canonical parody names |
| `/how-it-works.html` | How It Works — Watch, Request, Move In \| Real World | persistent AI world | — | 3-step funnel anchors (#watch #request #move-in) |
| `/demo.html` | Watch the block — Real World | watch AI villagers | ✔ WebPage (isAccessibleForFree) | Funnel front door; embed slot is `data-demo-src` |
| `/archive.html` | The Archive — Real World | game history browser, event archive | ✔ WebPage (isAccessibleForFree) | Explainer for the world-v20 Archive surface; owns "archive/history" queries — recap/archive *pages* stay a §17 future surface |
| `/pricing.html` | Credits & Pricing — Real World | AI life sim pricing | — | `data-pricing` provisional flag; flip runbook in PRICING-PAGE-CONTENT.md |
| `/faq.html` | FAQ — Real World | AI life sim questions, sims alternative | ✔ FAQPage | 25 Qs; JSON-LD ↔ visible parity enforced by seo_audit.py |
| `/brand.html` | Brand & Press Assets — Real World | (utility) | — | Logo downloads, palette, boilerplate; feeds press-kit |
| `/press-kit.html` | Press Kit — Real World | (utility) | — | Links the zip; fact sheet |
| `/journal.html` | The Dispatch — Real World Journal | devlog, weekly recap | — | Add Article JSON-LD per post when volume justifies |
| `/community.html` | Community — Real World | game community (soft) | — | Discord spec is owner-gated pre-launch |
| `/rules.html` | Rules & Safety — Real World | (trust signal) | — | Moderation transparency = E-E-A-T asset |
| `/404.html` | 404 — This corner isn't on the map \| Real World | — | — | noindex-equivalent UX; keeps brand voice |

**URL rules:** lowercase-hyphen, flat, no dates in URLs. Journal posts live as
cards on `/journal.html`; reserve `/journal/<slug>/` for when weekly volume
justifies (post-launch decision). Placeholder domain must be replaced in
`sitemap.xml`, `robots.txt`, canonicals, OG URLs at launch — one sed, listed in
LAUNCH-CHECKLIST G-gate.

## 4. Meta A/B variants (draft bank — test post-launch)

Swap only after Search Console gives a baseline CTR (≥2 weeks or ~1k impressions).
One variable at a time: title OR description, never both.

| Page | Variant B title | Variant B description angle |
|---|---|---|
| index | Real World — The Truman Show You Can Visit | Lead with the hook instead of the genre |
| index | 28 Neighbors. None Know You're Watching. | Mystery/serial framing |
| demo | Watch Free — A Live AI Neighborhood | "Free" first |
| features | The Cast Can't Be Controlled — Features | Differentiator-first |
| pricing | Pay for Agency, Never Access — Pricing | Values framing vs. price framing |
| faq | Real World FAQ — Watch Free, Possess Nobody | Curiosity gap |
| how-it-works | Watch. Request. Move In. — How It Works | Staccato step names |

**Rules:** never A/B into exaggeration (no "control anyone" bait — the ban is
the brand); log every variant flip + dates in MARKETINGLOG.

## 5. Structured data inventory & roadmap

| Type | Where | Status |
|---|---|---|
| VideoGame | index | ✔ shipped (genre, platform, free offer, author, `screenshot[]`, `isAccessibleForFree`) |
| WebPage + isAccessibleForFree | demo | ✔ shipped |
| FAQPage | faq | ✔ shipped — MUST mirror visible questions; sync on every edit |
| Article | journal posts | PENDING — add when posts get their own URLs |
| BreadcrumbList | all | SKIP — flat 12-page site, no breadcrumbs rendered |
| Organization | index | PENDING — add with real studio name/logo at domain flip |
| VideoObject | demo | PENDING — when a trailer/clip file exists locally |

Accuracy rule: schema must describe what exists today. No aggregateRating,
no reviewCount — we have neither and never fake them.

## 6. Internal linking

Current architecture: global nav (9 links) + footer (full map) on every page —
every page is ≤2 clicks from everywhere, which is right at 14 pages.

Contextual-link rules (apply to every new page/post):

1. Every journal post links ≥1 of demo/how-it-works/features (template enforces).
2. demo.html links "from viewer to resident" → how-it-works (already shipped).
3. pricing.html links faq for refund/request questions and vice versa.
4. Anchor text = the target's keyword phrase where natural
   ("how requests work" → how-it-works), never "click here".
5. No orphan pages: staging_dryrun.sh fails if a page isn't in nav+sitemap.

## 7. Content engine (the unfair advantage)

The world generates content for free: public request feed + history browser =
built-in content marketing (research §2.4). Cadence: 1 devlog + 1 recap/week,
plus cast spotlights and comparison essays.

### 12-week calendar (fill-in-the-blank via `templates/`)

| Wk | Sun recap | Wed devlog | Fri spotlight |
|---|---|---|---|
| 1 | format preview post (done: journal.html) | Why the main cast can never be possessed | Marisol |
| 2 | — | Watching a neighborhood is a game now (TPP ancestry) | (cast #2) |
| 3 | — | How a request works: 30 minutes of rain | (cast #3) |
| 4 | — | The Mission, mapped: real streets, fictional people | Mudhaus Coffee (venue) |
| 5 | — | Two currencies, one wall: why you can never cash out | (cast #4) |
| 6 | — | What the public request feed is for (sunlight as design) | (cast #5) |
| 7 | — | How AI memory should work (cite memory-track spec) | (cast #6) |
| 8 | — | What we cut and why — voice, loot boxes, cash-out | (cast #7) |
| 9 | — | Real World vs. life sims: watch, don't decorate | (cast #8) |
| 10 | — | The lease ledger: stakes without scripts | ambient-neighbor set |
| 11 | — | Launch-week announcement (see checklist) | recap of launch wk 1 |
| 12 | — | First post-launch numbers, honestly reported | community highlights |

Pre-launch, "Sun recap" slots run as format previews only — never fabricate
in-world events. Post-launch they pull from the real feed; a quiet week gets
reported as a quiet week.

## 8. Technical SEO — reconciled checklist

Done in markup (verified by `tools/staging_dryrun.sh` **and**
`tools/seo_audit.py` 58 pass / 0 fail at v45 — the audit runs inside
`tools/preflight.sh` step [1b], so regressions block a GO verdict):
- [x] Semantic HTML, one H1/page, alt text on every shot
- [x] `sitemap.xml` (all 12 indexable pages + image entries + lastmod) & `robots.txt`
- [x] OG/Twitter cards on all 12 indexable pages; og:image 1200×630; og:site_name (v15)
- [x] Canonical URLs on every page
- [x] VideoGame / WebPage / FAQPage JSON-LD — all parse
- [x] webp companions + lazy-loading + width/height attrs (no CLS)
- [x] Hand-rolled HTML/CSS/JS — no framework, ~35KB code per page
- [x] Analytics shim inert-by-default (no endpoint, no keys)
- [x] Every meta description ≤155 chars (8 fixed in v30 after audit found them)
- [x] VideoGame `screenshot[]` — all four current gallery shots
- [x] `llms.txt` at site root — entity briefing for AI answer engines
- [x] FAQ visible↔schema parity machine-checked (25 questions)
- [x] `<source srcset>` candidates resolve on disk — audit FAILs on a dangling
  webp/png (v45; catches stale shot names after gallery refreshes)
- [x] `og:image` resolves to a real file under `site/` (v45)
- [x] `<img>` width/height attributes machine-checked for CLS (v45)

Pending (owner-gated, launch):
- [ ] PENDING — real domain: sed `realworld-game.example` everywhere (one command)
- [ ] PENDING — Search Console + Bing Webmaster registration + sitemap submit
- [ ] PENDING — OG card validation (Twitter/FB debuggers) post-deploy
- [ ] PENDING — Core Web Vitals baseline on real hosting (expect green: static)
- [ ] PENDING — English only; no hreflang, no localization claims

Performance budget: page payload <3MB excluding gallery (gallery is lazy webp);
one PNG fallback (v30-C, 1.9MB) is under the 2MB ceiling — accepted, it only
loads on browsers without webp.

## 9. Measurement plan

- **Search Console** (post-domain): track Tier-1 queries weekly; CTR ≥3% on
  "truman show game" variants is the day-30 health bar; re-score tiers monthly.
- **Site analytics** (`analytics-events.json`): `page_view` → `watch_start` →
  `request_submitted`/`character_created` funnel; UTM conventions per
  ANALYTICS.md; cookieless, inert until endpoint configured.
- **Log line:** every variant change + every ranking milestone goes in
  MARKETINGLOG with dates, so the next iteration sees causality.

## 10. Link earning (earned only — never buy, never spam, never post unapproved)

- **Press hook 1:** "a real Mission block, fictional residents" — SF local press.
- **Press hook 2:** "the AI show where the stars can't be controlled" — games/AI press.
- **Press hook 3:** "the game whose devlog is written by its NPCs" — recap format.
- Community seeding post-launch (owner-approved only): life-sim Discords,
  gamedev/AI communities. Draft posts already in `social/drafts/`.
- Asset hooks that earn embeds: before/after v1→v30 gallery, the public request
  feed screenshot, the "same angle, seventeen iterations later" image pair.

---

## 11. SERP-feature map (v30)

Which rich result each page is built to win — checked by `seo_audit.py`:

| SERP feature | Page | Asset that earns it |
|---|---|---|
| VideoGame rich result (screenshots, free offer) | index | VideoGame JSON-LD + `screenshot[]` + `isAccessibleForFree` |
| FAQ rich result / People-Also-Ask | faq | FAQPage schema, parity-enforced 25 Qs incl. the Sims/InZOI comparison added v30 |
| Image pack | index, features, press-kit | sitemap `image:` entries + descriptive alt + real shot filenames |
| Sitelinks | index | flat nav + consistent titles — earned, not markup |
| "Free" qualifier snippets | demo, pricing | `isAccessibleForFree` + "free, always" copy in first 155 chars |
| No schema needed | rules, community, brand, cast | trust/utility pages — rank on content or not at all |

## 12. AI answer engines / GEO (v30)

A growing share of "what should I play" queries resolve inside AI answers
(ChatGPT, Perplexity, Gemini, AI Overviews) without a click. The lever isn't
rank — it's being *citable*.

- **`site/llms.txt` shipped (v30):** the canonical entity briefing — what the
  game is, the exact watch/request/move-in model, which numbers are proposed,
  and the do-not-say list (no cash-out, no voices, mains unpossessable). Every
  claim in it is verifiable in the design doc.
- **Quotable atomic facts:** keep sentences like "Watching is free, always" and
  "the eight main characters can never be possessed" verbatim-stable across
  index/features/faq — answer engines lift consistent phrasing.
- **Entity consistency:** one name ("Real World"), one subtitle ("The
  Mission"), same boilerplate in press-kit/fact-sheet/llms.txt — mismatched
  entity descriptions dilute citations.
- **Accuracy as moat:** the FAQ's honest-cut answers (no voices, no cash-out)
  are exactly the corrective text AI answers need — being the source of the
  correction is worth more than ranking for the hype term.

## 13. Cannibalization register (v30)

Two pages must never compete for the same query. Current assignments:

| Query cluster | Owner page | NOT allowed to target |
|---|---|---|
| truman show game / AI life sim | index | features (supports, doesn't lead) |
| watch AI villagers | demo | index links here, doesn't re-pitch |
| possess/control AI character | how-it-works + faq | features mentions the ban once, links over |
| pricing / credits / cost | pricing | faq answers redirect to pricing, never restate numbers |
| cast / characters | cast | features names roles only |
| sims/inzoi/paralives alternative | faq (comparison Q) | journal essays link back to faq, don't re-rank |
| mission district / dolores park | index | features keeps place as support copy |
| history / archive / past events | archive | demo owns "watch/live"; future event pages (§17) hang under this owner |

Rule: if a new page/post wants a keyword already in this table, it links to
the owner instead of competing — same rule as internal-link §6.

## 14. URL & redirect policy (v30)

- URLs are permanent once published; a retired page gets a 301 to its nearest
  successor, never a deletion. Keep a `redirects` block ready in
  `deploy/Caddyfile` for post-launch use.
- Placeholder-domain → real-domain swap is a string replacement, not a URL
  change — no redirects needed at G3.
- Journal posts stay on `/journal.html` cards until volume justifies
  `/journal/<slug>/`; if that migration happens post-launch, card anchors get
  301s, not duplicate content.
- 404.html is the only noindex-equivalent page; it must never enter sitemap
  (audit enforces).

## 15. Re-score cadence & debt register (v30)

**Cadence (post-launch, all owner-gated tooling):**
- Day 7: Search Console baseline — impressions/CTR per Tier-1 query; fix any
  page with <1% CTR and >200 impressions via §4 variant bank (one variable).
- Day 30: re-score keyword tiers against real volumes; retire Tier-3 terms
  with zero impressions; promote any surprise query into §2.
- Day 60/90: review cannibalization register vs. actual query→page mapping;
  fold learnings into the calendar's next 12 weeks.

**Debt register (carried, honest):**
1. `shots/v30-C.png` is 1.9MB and `v30-A.png` is 1.8MB (accepted — webp
   companions serve modern browsers; PNGs are fallback only). Revisit if
   CWV flags LCP.
2. `demo.html` embed slot is empty until the game ships — the page ranks on
   gallery copy until then; expect a CTR jump at G12 flip.
3. Article JSON-LD still pending (§5) — journal posts need their own URLs
   first; post-launch decision.
4. Organization schema pending real studio name at domain flip (§5).
5. No hreflang — EN only; localization is a business decision, not a task.

## 16. Question bank — People-Also-Ask mining (v45)

The FAQ is the only page allowed to own question queries (cannibalization §13).
This bank is the intake queue: every question query we see in Search Console,
press Q&A, or community drafts gets sorted here — either it joins `faq.html`
(visible Q + FAQPage twin, parity-enforced) or it's assigned to the page that
already owns the cluster.

| Question (query form) | Owner | Status |
|---|---|---|
| can you control the AI characters | faq "Can I possess the main characters?" | ✔ answered |
| is it like The Sims / InZOI | faq comparison Q | ✔ answered |
| is it free to watch | faq "Is it free?" + demo snippet | ✔ answered |
| can you make a character do something specific | faq "How does a request work?" | ✔ answered |
| what happens if a request is denied | faq "Who moderates the requests?" + rules | ✔ answered (refund + never-displayed) |
| does it run on mobile | faq "What platform?" | ✔ answered (browser, watch-first) |
| will there be voices / is it voiced | faq "Why don't characters have voices?" | ✔ answered (cut, honest) |
| can you earn money / cash out | faq "Can I cash out?" | ✔ answered (never) |
| is the map real San Francisco | faq "Is the neighborhood a real place?" | ✔ answered (parody venues, real streets) |
| what's the difference between watching and playing | how-it-works | ✔ covered on-page |
| how long is a request / what do credits buy | pricing | ✔ covered on-page |
| do the characters know you're watching | index copy ("none know you're watching") | QUEUE — graduate to faq if the query shows up |
| is it multiplayer | faq | QUEUE — asymmetric shared world; needs wording care |
| can you romance / date a character | faq | QUEUE — only if asked; no romance mechanic to promise |
| what time zone does the neighborhood run on | faq | QUEUE — add post-launch if seen |
| can you watch old events / is there a history | faq + journal recaps | QUEUE — history browser lands with game |
| is there a day/night cycle | features | QUEUE — real sun engine exists; verify wording first |
| who made it / what engine | press-kit + Organization schema | pending domain flip |

Rules: a question graduates to faq.html only when (a) a real channel shows the
query (Search Console, press email, community post) or (b) the answer removes a
purchase-blocking uncertainty. Bank additions never promise unshipped features.

## 17. Future indexable surfaces register (v45)

The world produces artifacts that could become indexable pages post-launch.
Each is a *decision*, gated on owner approval + the surface existing — none are
built today, and none must cannibalize an owner page in §13.

| Candidate surface | Source | Gate | Cannibalization note |
|---|---|---|---|
| `/journal/<slug>/` per-post URLs | journal cards already templated | volume justifies + Article JSON-LD | cards get 301s, never duplicate (§14) |
| Public event-archive URLs (`#e=<id>` → real pages) | world-v19 wire permalinks | wire must be public + feed events stable live→archive (game-v6 contract) | archive pages must not re-pitch "watch" queries — demo owns those |
| `/venues/` venue pages (22 parody businesses) | world-v16 `businesses.json` | cast.html directory must not thin out — venue pages deepen, cast keeps roster | cast owns "cast/characters"; venues own venue-name queries only |
| Recap archive pages | weekly recap pipeline (§7) | post-launch content exists first | recaps link to demo/how-it-works, never compete |
| Playable demo subdomain (`play.`) | infra contract (deploy/) | game build ships | not a page concern — noindex until G12 |

Rule: before any of these ships, add its row to §13's register with an owner
declaration. New surfaces are the #1 way a site this size starts competing
with itself.
