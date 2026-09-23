# BRAND.md — Real World ("The Mission") brand identity

**Version:** v2 · 2026-09-23 · **Status:** LOCAL — launch-ready reference.
The public-facing subset of this file now ships as `site/brand.html` (the
brand book page) — keep the two in sync when rules change.
**Scope:** positioning, naming, voice, palette, type, logo system, art direction,
social specs, and accuracy guardrails for every public artifact this track
produces. When a doc and this file disagree on a *number*, the monetization
plan / design doc wins; on *how we talk*, this file wins.

Canonical asset sources live in `marketing/site/assets/` (SVG masters + rendered
PNGs) and `marketing/press-kit/` (distributable copies). Regenerate rasters:
`python3 marketing/tools/make_brand_assets.py`. Rebuild the press zip:
`./marketing/build-press-kit.sh`.

---

## 1. Positioning

**Category:** persistent spectator life simulation — "Truman Show" for a
browser. Not a city builder, not a god game, not an MMO. The audience watches
for free; players pay for *agency*, never for power over the main cast.

**One-line positioning (internal):**
> The only neighborhood that keeps living when you close the tab — and the only
> cast nobody, including us, can puppet.

**Three pillars (every asset should lean on at least one):**

1. **Alive, always.** 28 residents, real Mission street geometry around Dolores
   Park, 24/7 simulation. Watching is free, forever.
2. **Agency, not control.** Requests are time-boxed, screened, and resolved as
   opportunities — never mind control. You nudge the world; you don't own it.
3. **An untouchable cast.** The 8 main characters cannot be possessed by
   anyone — players or the developer. That constraint is the product's
   integrity promise; state it plainly and proudly.

**Competitive frame (from market research):** we sit between Twitch Plays
Pokémon-style communal spectating and The Sims' parasocial attachment, with a
paid-agency layer no competitor offers. Never position against "AI girlfriend"
chat apps, NFT/metaverse projects, or gambling-adjacent mechanics — the
possession ban and no-cash-out rules exist specifically to avoid those frames.

---

## 2. Naming

| Form | Use |
|---|---|
| **Real World** | The product. Always two words, title case. |
| **Real World — The Mission** | First reference in formal contexts (press, store page, trailers). "The Mission" is the first neighborhood, styled as a subtitle after an em dash. |
| **The Mission** | In-world shorthand once "Real World" is established in the same piece. |
| Never | "RW", "RealWorld", "The Real World" (trademark collision with the MTV show — the leading "The" is banned everywhere), "Real World: The Mission" (colon reads as a subtitle in search; em dash only). |

In-world names: residents, venues, and businesses come from the world track's
bibles and **parody business-name list** (GTA-style parody names only — never
real SF businesses). The list is published and canonical:
`world/businesses.md` (naming authority) and `world/parody-names.json`
(generated mirror, ~89 mappings — Mudhaus Coffee, Taqueria El Farolote,
Auerbach Hardware, Buy-Rite Market, The 600 Club, …). Prefer canonical names
over generic descriptors in all new copy; site and social drafts were swept
to them in v22/v27. Real street/landmark names (Dolores Park, Valencia St)
are allowed and encouraged.

---

## 3. Taglines

Approved bank (do not invent new ones for shipped assets; drafts may
experiment):

| Tagline | Status | Where |
|---|---|---|
| A neighborhood that's alive whether you're watching or not. | **Primary** | Key art 16:9, index hero support, press boilerplate tail |
| A neighborhood that never stops performing. | Primary alt | Store tagline field (44 chars, fits everything) |
| Watch free. Pay to reach in. | **Punchy/short** | Square key art, social banners, trailer end card |
| The Truman Show you can visit. | Descriptive | FAQ, press one-pager — always in quotes; it's an analogy, not a title |

Rules: sentence case, period included. Never append "!" — the brand is calm,
not hyped. Never pair a tagline with a claim we can't ship ("possess anyone",
"earn real money").

---

## 4. Voice & tone

**Voice (constant):** a neighbor who knows the block. Warm, plain-spoken,
slightly wry. We describe what residents *did*, not what we *made them do*.
Second person for the player ("you"), third for residents (by name).

**Tone by context:**

| Context | Tone |
|---|---|
| Landing / store / trailer | Inviting, a little wondrous, zero hype |
| Pricing / credits | Clerk-like clarity. Numbers first, no apology |
| FAQ / moderation / safety | Direct, literal, boring on purpose |
| Social / community | Warm, specific, gossipy about *fictional* events only |
| Press | Matter-of-fact; the weirdness sells itself |

**Do:**
- Use concrete in-world detail: "Karl the Fog rolled in over the rooftops at
  dusk" beats "dynamic weather system."
- Say "requests," "residents," "the block," "reach in."
- Label every screenshot/key art "development build" until launch.
- Admit constraints ("the eight mains can't be possessed — by anyone").

**Don't:**
- Hype words: revolutionary, groundbreaking, insane, next-gen, "powered by AI"
  as a selling point (the sim runs on AI; we don't advertise the plumbing).
- Scarcity/FOMO tricks, countdown language, "limited time."
- Promise possession of mains, cash-out, voice acting, or loot mechanics —
  all explicitly cut.
- Invent testimonials, review quotes, player counts, or press coverage.
- Use real SF business names or real people's names/addresses.

**Sample lines (calibration):**

- ✅ "Tomás closes El Farolote at eleven. What he does after that is his —
  you can watch, you can ask, you can't make him."
- ✅ "Requests are screened, time-boxed, and public. If yours is declined, the
  credits come back automatically."
- ❌ "Take control of anyone in the city!" (possession ban violation)
- ❌ "The most realistic AI experience ever made." (unverifiable + hype)

---

## 5. Palette

The palette is the Mission at dusk: wet asphalt, warm windows, fog.

| Token | Hex | Name | Role |
|---|---|---|---|
| `--bg` | `#14161c` | Asphalt | Page background |
| `--bg-2` | `#1b1e27` | Sidewalk | Raised surfaces |
| `--panel` | `#1d2029` | Facade | Cards, logo tile interior |
| `--border` | `#2c303c` | Cornice | Hairlines, frames, parapets |
| `--text` | `#ece7dc` | Paper | Body text on dark |
| `--muted` | `#9aa0ae` | Fog | Secondary text, nav |
| `--accent` | `#e8a04c` | Café-light amber | Primary accent, lit window, CTAs, "THE MISSION" |
| `--accent-2` | `#4f9d69` | Park green | Secondary accent, success/affordable states |
| `--accent-3` | `#d4645c` | Mural red | Sparingly: alerts, one window in the mark |
| `--ink` | `#1a1206` | Ink on amber | Text/icons on accent fills (amber buttons, badges) |

**Ratios:** ~80% darks/neutrals, ~15% paper/fog text, ~5% accent colors.
Amber is the hero accent — green and red appear at most once per composition
(exactly as the icon's 3×3 grid uses them: one green, one red, one amber).

**Contrast (WCAG, on `--bg`):** paper `#ece7dc` ≈ 15:1 (AAA); fog `#9aa0ae`
≈ 5.6:1 (AA); amber `#e8a04c` ≈ 7.4:1 for large text/UI (AA large) — never set
amber body text under 18 px. Green/red are decorative only; never carry meaning
alone.

**Light contexts:** the palette is dark-first. On light/white surfaces use
`logo-primary-dark.svg` (ink `#14161c` wordmark) — never invert the standard
lockup and never place the light-text lockup on white.

---

## 6. Typography

**Stack (web/press docs):** `system-ui, -apple-system, "Segoe UI", Roboto,
sans-serif`. Raster assets use DejaVu Sans (Bold for display, Regular for
captions) as the guaranteed-available system face — same visual family.

| Role | Spec |
|---|---|
| Wordmark "REAL WORLD" | Bold/700–800, uppercase, +0.02–0.14em tracking |
| Subtitle "THE MISSION" | Bold, uppercase, wide tracking (~0.3em / letterspaced spaces in raster), amber |
| Headings | Bold, sentence case (no all-caps outside the lockup) |
| Body | Regular, 1.5–1.6 line-height, ≤ ~70ch measure |
| UI/labels | 600 weight, small caps or uppercase only for ≤4-word labels |

No custom webfonts — performance budget and the system stack *is* the brand
face. If a future platform requires an embedded font, license a neutral grotesk
(e.g. Inter) and record it here first.

---

## 7. Logo system

**The mark:** a dark Mission rowhouse tile — corniced facade, 3×3 window grid,
one lit amber window (center), one green, one red. It reads as "a building with
a light on" = *someone's home, someone's watching*. The lit window is the
brand's whole thesis in one glyph; protect it.

### Files (masters in `site/assets/`, copies in `press-kit/logos/`)

| File | Variant | Use |
|---|---|---|
| `logo-primary.svg` / `.png` (1600×480) | Horizontal lockup, light text | Dark backgrounds, site header (PNG fallback), press |
| `logo-primary-dark.svg` | Horizontal lockup, dark ink | Light/white backgrounds only |
| `logo-icon.svg` / `.png` (512²) | Icon tile | Avatar, favicon base, app icon, square contexts |
| `logo-icon-mono.svg` | Icon, single-ink | One-color print, engraving, watermark |
| `logo-primary-mono.svg` | Horizontal lockup, single-ink (`currentColor`) | One-color print, engraving, merch, watermark |
| `safari-pinned-tab.svg` | Black-silhouette mask icon | Safari pinned tabs (recolored by the `mask-icon` link's `color`) |
| `logo-stacked.svg` | Vertical lockup (icon over wordmark) | Square/tall placements: podcast art, profile panels, video end-cards |
| `logo-icon-animated.svg` | Living icon — lit window breathes on a ~9s ease cycle, glow behind, honors `prefers-reduced-motion` | Web embeds, loading states, trailer/teaser end-card. Never where motion would imply "live" status |
| `pattern-windows.svg` | Window-grid divider motif (cornice line + window run, one lit amber off-center) | Section breaks, textures, email/social dividers. A motif — never a logo substitute |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | Favicons | Site `<head>` (already wired) |
| `icon-192.png`, `icon-maskable.png`, `site.webmanifest` | PWA/install icons + manifest | `icon-maskable` keeps the mark inside the 80% safe zone so Android can crop any mask shape; manifest name/theme use brand values |

### Rules

- **Clear space:** ≥ half the icon tile's height on all sides.
- **Min sizes:** lockup ≥ 180 px wide (below that the subtitle dies — use the
  icon alone); icon ≥ 24 px.
- **Backgrounds:** dark photo/color → `logo-primary`; light/white →
  `logo-primary-dark`; busy screenshots → place on a `--bg`-color plate or
  the key-art gradient, never directly on imagery.
- **Don't:** recolor the windows, move the lit window off-center, stretch,
  rotate, add outlines/glows/drop-shadows, redraw it, set it in a different
  typeface, or use the 3×3 grid without the tile.
- The lit window is **always amber** — it's not a theming slot.

### Motion rule

The only sanctioned logo animation is the breathing window in
`logo-icon-animated.svg` (~9s, subtle, reduced-motion aware). No spins,
bounces, reveals, or parallax on the mark — the brand watches calmly; it
doesn't perform. Video end-cards hold the static or breathing icon on
`--bg` for ≥ 1.5 s with one approved tagline.

### Co-branding

Partner logos sit to the right of ours, separated by a hairline in Cornice
`#2c303c`, at equal optical weight. We never recolor our mark to match a
partner and never recolor theirs. Over busy footage/screenshots, use the
icon alone on a `--bg` plate — never the lockup on imagery.

---

## 8. Art direction

**Screenshots:** real development-build captures only (`site/shots/`). Always
labeled "development build" in caption or corner. Never mock up UI over a
capture unless it ships. Never use competitor or stock imagery.

**Key art:** built on real captures + cinematic bottom gradient (`#0a0b0f` →
transparent), vignette, wordmark bottom-left, amber rule, subtitle, one
tagline, "IN DEVELOPMENT" line. Recipe is executable:
`tools/make_brand_assets.py` (swap `SHOT` when the art track publishes a
better build — currently `v31-D.png`).

**Motifs available to layouts:** the 3×3 window grid (section dividers,
empty states), the cornice line (hairlines), long dusk shadows, fog haze.
Photography/illustration commissions: brief lives in §11.

---

## 9. Social / surface specs

| Surface | Asset | Spec |
|---|---|---|
| Avatar (all networks) | `logo-icon.png` | 512×512 reads at 48 px; never the full lockup |
| Profile banner | `keyart-16x9.png` crop or `og-card.png` | Safe-zone: keep text in middle 60% |
| OG / link card | `og-card.png` (1200×630) | Already referenced site-wide |
| Brand book page | `site/brand.html` | Public guidelines + one-click logo downloads; mirror of this file |
| Post image (feed) | `keyart-square.png` (1080²) | Tagline variant "Watch free. Pay to reach in." |
| itch.io cover | `cover-itch-630x500.png` | Built |
| Steam capsule (if ever) | — | Spec in STORE-COPY.md §capsules; commission before any Steam page |

Consistent handle recommendation (owner registers at go): the product name
without "The"; check availability before locking — recorded as a G-gate item in
LAUNCH-CHECKLIST.md, not assumed here.

---

## 10. Accuracy guardrails (hard rules for all copy)

Marketing may say, verbatim-safe:

- Watching is free. Paid agency = time-boxed requests + character slots +
  subscriptions (provisional until pricing flag flips).
- Requests are screened on text, classified (exclusive / compatible / queued),
  resolved as opportunities, and publicly attributed on the feed.
- The 8 mains can never be possessed — by players or the developer.
- Credits are non-transferable meta currency; game dollars are earned in-world
  only; no cash-out, no RMT, no loot boxes, no crypto.
- Setting: real street geometry, fictional residents, fictional house numbers,
  parody business names.

Marketing may never say: possession/control of mains, guaranteed request
outcomes, real-money earnings, "uncensored/unmoderated", real business or
resident names, invented reviews/testimonials/metrics, "coming soon" for cut
features (voice/TTS v1, ambient-NPC economies, cash-out, loot boxes).

**"Join the cast" language (world-v7 hire flow):** players may pay to create
a new resident (`h##`) who moves in through the same screening + human review
+ lease flow. These player-created residents are possessable by their owner —
that is the *one* sanctioned possession. Language rules: always say "join the
cast" or "move in", never "buy a character"; always pair it with "the eight
mains still can't be possessed"; never imply the hired resident is scripted or
safe from consequences — they live under the same sim rules once created.

---

## 11. Press boilerplate (quote-verbatim)

Three lengths, all claims checkable against the design doc. These also ship on
`site/brand.html` — edit both together.

**25 words:**
> Real World is a persistent browser life-sim: a Mission District
> neighborhood of AI residents who keep living whether you watch or not.
> Watching is free.

**50 words:**
> Real World is a persistent browser life-sim set on real Mission District
> street geometry. Twenty-eight AI residents keep living whether you watch
> or not. Watching is free; players pay only to file screened, public
> requests — never to control the cast.

**100 words:**
> Real World is a persistent browser life-sim — a "Truman Show" you can
> visit — set on real Mission District street geometry around Dolores Park.
> Twenty-eight AI residents keep living whether you watch or not. Watching
> is free. Players can pay for agency, not control: requests are screened
> for intent, time-boxed, resolved as opportunities the residents choose how
> to answer, and attributed on a public feed. The eight main characters can
> never be possessed by anyone — including the developer. A neighborhood
> that's alive whether you're watching or not.

---

## 12. Key-art commission brief (for a future artist)

When a commissioned key-art piece replaces the dev-capture art:

- **Subject:** a Mission rowhouse block at blue hour, one lit amber window
  center-frame, fog overhead. Human figures small and unposed — observed, not
  performing. Optional: a subtle "fourth wall" cue (reflection, lens flare
  at frame edge) referencing the spectator premise.
- **Palette:** this document's palette; the lit window is the only warm source.
- **Composition:** bottom-left clear for the lockup (see §8 layout), 16:9
  master + 1:1 + 4:5 crops.
- **Must not:** depict real SF storefronts/signage, real people, horror/dystopia
  framing (we're warm-observational, not surveillance-thriller), UI chrome.
- **Deliverables:** layered file + flattened PNGs at press-kit sizes.

---

## 13. Governance

- Changes to palette/type/logo/taglines = edit this file + regenerate assets +
  inbox note. Palette hexes are also hardcoded in `site/css/style.css`,
  `site/assets/brand-tokens.json` (machine-readable source for
  `css/tokens.css` via `tools/make_tokens.py`), and
  `tools/make_brand_assets.py` — change all four together.
  `tools/brand_audit.py` enforces parity mechanically: run it after any
  brand change (exit 0 = clean).
- New taglines/claims need a line citing the design doc section that permits
  them.
- Every shipped page/post is accountable to §10. The dry-run script checks
  mechanics; this file is the human gate for meaning.
