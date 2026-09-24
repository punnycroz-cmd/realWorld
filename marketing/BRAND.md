# BRAND.md — Real World ("The Mission") brand identity

**Version:** v115 · 2026-09-23 · **Status:** LOCAL — launch-ready reference.
Word-level rules (which terms, which casing, which bans) live in
`marketing/BRAND-LEXICON.md` — this file wins on voice/palette/logo/motion,
the lexicon wins on vocabulary; keep both in sync.
The public-facing subset of this file now ships as `site/brand.html` (the
brand book page) — keep the two in sync when rules change.
**Scope:** positioning, naming, voice, palette, type, logo system, art direction,
motion/sonic identity, social specs, and accuracy guardrails for every public artifact this track
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

**Product surfaces** also have canonical names — unlike the product, these
*do* take a leading "The":

| Form | Use |
|---|---|
| **The Wire** | The live spectator feed surface (`wire.html`). Never "the feed page", never "Real World Wire". Lowercase "the wire" is acceptable inside a sentence after first mention. |
| **The Archive** | The public history browser (`wire-archive.html`; `archive.html` is its marketing page). Never "the history page". |
| **the block** | The neighborhood itself, in voice. Lowercase, no capitals — it's how neighbors talk, not a trademark. |

These names are owned by the world track's app shells; marketing copy uses
them verbatim and never coins new surface names without a world-track
artifact to point at.

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

**UI microcopy (interface strings, buttons, empty states):** the same voice
at smaller scale. Buttons are verbs, two words max ("Watch the block", "File
a request", "Join the cast"). Empty states admit the truth warmly ("Quiet
hour on the block. The residents are asleep — they're people, not uptime.").
Errors state what happened and what the user keeps ("Not approved — your
credits are already back."). Never blame the resident for a system limit
("Tomás declined" only if the feed says so verbatim); never use error
theater ("Oops!", "Something went wrong!" with no facts). Declined-request
wording is fixed by the feed vocabulary — `resolved · declined`,
`not approved` — reuse it verbatim, don't soften it into marketing.

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

**Contrast (WCAG 2.1, computed — not estimated).** `tools/brand_audit.py`
check 8 recomputes these from `brand-tokens.json` on every run and fails if a
palette edit drops a pair below its floor or this table drifts from the truth:

| Text on dark | on Asphalt `--bg` | on Sidewalk `--bg-2` | on Facade `--panel` |
|---|---|---|---|
| Paper `#ece7dc` | 14.7:1 AAA | 13.5:1 AAA | 13.2:1 AAA |
| Fog `#9aa0ae` | 6.9:1 AA | 6.4:1 AA | 6.2:1 AA |
| Amber `#e8a04c` | 8.2:1 AAA | 7.6:1 AAA | 7.4:1 AAA |

| Accent fills | Ratio | Rule |
|---|---|---|
| Ink `#1a1206` on amber | 8.4:1 AAA | The only text color on amber fills (CTAs, badges) |
| Asphalt on green / red | 5.5:1 / 5.0:1 | Status fills; never carry meaning by color alone |

**Banned pairs (verified unreadable):** Paper on amber 1.8:1, Paper on red
2.9:1, Fog on green 1.3:1 — text never sits directly on an accent fill except
Ink on amber. On Paper-warm `#f4f2ec` (email, §16): Ink 16.6:1 and Asphalt
16.2:1 are AAA, but Fog 2.3:1 and amber 2.0:1 are unreadable — light surfaces
take dark ink only, no Fog body text, no amber text.

**Brand rule stricter than WCAG:** amber never sets body text under 18 px even
though 8.2:1 would allow it — amber is the lit window, not a text color.
Green/red are decorative only; never carry meaning alone.

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
better build — currently `v50-D.png`).

**Motifs available to layouts:** the 3×3 window grid (section dividers,
empty states), the cornice line (hairlines), long dusk shadows, fog haze.
Photography/illustration commissions: brief lives in §11.

---

## 9. Social / surface specs

| Surface | Asset | Spec |
|---|---|---|
| Avatar (all networks) | `logo-icon.png` | 512×512 reads at 48 px; never the full lockup |
| Profile banner | `keyart-16x9.png` crop or `og-card.png` | Safe-zone: keep text in middle 60% |
| Creator embed badge | `badge-watched.svg` (+ `badge-watched-mono.svg`) | "WATCHED ON REAL WORLD" — stream overlays, video corners, article footers. Color on dark only; mono inherits text color. Ships in `press-kit/badges/` |
| OG / link card | `og-card.png` (1200×630) | Already referenced site-wide |
| Brand book page | `site/brand.html` | Public guidelines + one-click logo downloads; mirror of this file |
| Post image (feed) | `keyart-square.png` (1080²) | Tagline variant "Watch free. Pay to reach in." |
| itch.io cover | `cover-itch-630x500.png` | Built |
| Email | `templates/email/` | Light-first table layout, dark-ink lockup, one amber element; spec in §16 |
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

## 12. Motion identity

The brand watches calmly — motion follows the same rule. Applies to the
trailer cuts (`marketing/trailer/edl.json`), social clips, site animation,
and any commissioned video.

**Editing vocabulary:**
- Transitions are **cut** or **dip** (short fade through `--bg`) only. No
  whip-pans, zoom-punches, glitch/flash frames, or speed-ramps — those say
  "action game"; we're an observation.
- Camera moves are slow and motivated: push-ins (Ken Burns on stills),
  follows, and holds. Default shot length ≥ 3 s; the block sets the pace,
  not the edit.
- The only sanctioned *logo* animation is the breathing window
  (`logo-icon-animated.svg`, ~9 s, `prefers-reduced-motion` aware). UI
  elements may fade or slide on a ≤ 200 ms ease; nothing bounces or spins.
- Text cards set in the system stack: Paper `#ece7dc` on `--bg`, sentence
  case, one idea per card, held ≥ 2 s. The amber accent appears at most
  once per card (a rule, a name, a status chip).
- **End card (canonical):** the icon or breathing icon centered on `--bg`,
  one approved tagline under it ("Watch free. Pay to reach in."), held
  ≥ 1.5 s. No URL-stuffing, no subscribe-animation, no second tagline.
- **Lower thirds / labels:** Cornice `#2c303c` hairline + Paper text,
  bottom-left, ≤ 2 lines. Name residents by their cast-bible name only —
  never debug handles or harness labels. HUD/REC chrome from dev captures
  must be blurred or cropped per the EDL `redact` specs.

**Never:** lens-flare transitions, meme zooms, countdown stickers,
"possession meter" graphics that imply control over mains, motion that
implies the feed is scripted.

## 13. Sonic identity

Audio is diegetic-first: the block is the soundtrack.

- **Bed:** room tone and street ambience (muffled traffic, gulls, a bus,
  café murmur, rain when Karl is in). Music enters sparingly — one warm,
  unhurried cue per piece; licensing notes live in TRAILER-PLAN §5.
- **No narrator hype.** If voice is ever used, it reads feed lines or the
  boilerplate flatly — a documentarian, not a trailer voice.
- **No sonic logo / jingle** and no notification-style dings in brand
  assets. A single soft event tick for feed moments is allowed (the
  trailer scratch bed's `ticks` preset is the reference).
- **Silence is on-brand:** dead-hour and quiet-event stretches stay quiet.
  Never wallpaper over a calm block with a beat drop.
- Loudness target for shipped video: −16 LUFS stereo (social) / −14 LUFS
  (store caps). Captions ship with every cut (`.srt` from the EDL).

## 14. Key-art commission brief (for a future artist)

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

## 15. Lexicon

The canonical vocabulary lives in `marketing/BRAND-LEXICON.md`: canonical
product terms and casing (The Wire, the block, NPC nudge, credits, reach
in), people words (resident vs. viewer vs. player), the drift table
(banned word → approved replacement), the in-world lexicon (parody venue
names, Karl the Fog, verbatim feed strings), and grammar mechanics
(sentence case, em dashes, en-dash ranges, no exclamation marks).

The mechanical subset is enforced by `tools/brand_audit.py` check 7 on
every site page — standalone "NPC", "users", "customers", "bots",
"virtual", "influencers", "gameplay", "playthrough" all fail the gate.
New banned terms go in the lexicon's §3 *and* the audit's `LEXICON_BANS`
in the same commit.

## 16. Email identity

The inbox is a light surface — the one place the brand goes light-first.
Clients force white backgrounds, block remote images, and clip dark CSS;
the email system is designed for that reality, not against it. Executable
templates + rules live in `marketing/templates/email/` (README is the
enforcement doc; `base.html` is the only sanctioned skeleton).

- **Layout:** single 600 px table column on Paper-warm `#f4f2ec`; white
  card with a `#e3ded2` hairline. Inline styles only, no webfonts, no
  images required to read. Survives "images blocked" by design.
- **Lockup:** `logo-primary-dark` (dark ink) at 180 px in the header;
  `alt="REAL WORLD — THE MISSION"` is the text fallback and carries the
  brand when pixels don't load. Never the light-text lockup — it
  disappears on white.
- **One amber element per email** — the CTA button (`#e8a04c` fill,
  `#1a1206` bold label) or a single amber rule. No amber body text, no
  full-bleed Asphalt backgrounds (dark boxes read as a rendering bug
  in the inbox, not as brand).
- **Subject lines are sentences.** No emoji, no caps, no fake "re:",
  no urgency/countdown language — the same calm as everywhere else.
  Status mail names the fact: "Your request: not approved."
- **Preheader is written, never default** ("View in browser" is a bug).
- **Footer honesty:** every send says why the recipient got it, carries
  a real `{{unsubscribe}}`, and skips guilt copy on the way out.
- **No screenshots in email** — dev HUD + small type = illegible at
  inbox scale and a broken-image risk. Icon tile or `keyart-16x9` with
  full alt text at most; the copy must stand alone.
- **Feed vocabulary travels verbatim** — `{{status}}` renders the feed
  string (`approved`, `resolved · declined`, `not approved`), never a
  marketing-softened rewrite (lexicon §4, gate G15).

---

## 17. Governance

- Changes to palette/type/logo/taglines/lexicon = edit this file (or
  BRAND-LEXICON.md for vocabulary) + regenerate assets +
  inbox note. Palette hexes are also hardcoded in `site/css/style.css`,
  `site/assets/brand-tokens.json` (machine-readable source for
  `css/tokens.css` via `tools/make_tokens.py`), and
  `tools/make_brand_assets.py` — change all four together.
  `tools/brand_audit.py` enforces parity mechanically — plus a site-copy
  language lint (check 6: §2 naming forms, §4 hype bans, §10 real-business
  and control/cut-feature claims, negation-aware) — and runs inside
  `tools/preflight.sh` step 1c. Run it after any brand change (exit 0 =
  clean).
- New taglines/claims need a line citing the design doc section that permits
  them.
- Every shipped page/post is accountable to §10. The dry-run script checks
  mechanics; this file is the human gate for meaning.

---

## 18. Presentation & deck identity

Pitches, partner meetings, festival submissions, and press briefings all need
slides — and a slide deck is a brand surface like any other. The sanctioned
skeleton is `marketing/templates/deck/base.html` (hand-rolled, zero
dependencies, keyboard-navigable, prints one slide per page for PDF export);
rules live in `marketing/templates/deck/README.md`. Headlines:

- **Dark-first, always.** Slides are Asphalt `#14161c` with Paper text — a
  projected deck is the block at night. Never a light deck, never a gradient
  background, never a template theme.
- **One amber element per slide** — a rule, a number, a name, the lit window.
  More than one and the eye stops trusting it (same rule as §12 text cards).
- **Screenshots sit on a `--bg` plate** with a Cornice hairline and a
  "development build" caption (§8) — never full-bleed, never with the logo
  lockup on top of them.
- **Chart colors in token order:** amber → green → red → fog, then repeat.
  Data ink is Paper; gridlines Cornice. No other hues enter the deck.
- **Type ramp:** title slide wordmark ≥ 48 px equivalent; section statements
  one sentence, ≤ 12 words; body bullets ≤ 6 words each, max 5 per slide —
  decks are read at distance.
- **The end slide is the end card** (§12): icon or breathing icon on `--bg`,
  one approved tagline, held. No contact-info stuffing — the boilerplate
  (§11) goes in the speaker notes or the follow-up email, not on the slide.
- **Number honesty travels to slides:** every stat on a deck slide must trace
  to the same sources §10 requires for copy. A chart of projected revenue is
  labeled PROPOSAL like the monetization plan; a resident count is 28 because
  the world ships 28.
- **Motion between slides is a cut.** If the deck tool supports transitions,
  they stay off — the block sets the pace.
