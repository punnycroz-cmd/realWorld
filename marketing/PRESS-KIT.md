# Press Kit — Real World ("The Mission")

**Version:** v2 · 2026-09-22 · **Status:** LOCAL DRAFT — pre-launch.
Contact fields are placeholders; no public channels exist yet. HTML mirror:
`marketing/site/press-kit.html`. Downloadable bundle:
`marketing/press-kit/` — build the zip with `./marketing/build-press-kit.sh`
(outputs `marketing/dist/real-world-press-kit.zip`). Outreach template +
pitch drafts + embargo policy: `PRESS-OUTREACH.md`.

---

## One-pager

**What it is:** *Real World* is a persistent, browser-based "Truman Show" life
simulation set on real streets around Dolores Park in San Francisco's Mission
District. Twenty-eight fictional residents — eight main characters with full AI
minds plus twenty ambient neighbors — live, work, feud, and reconcile around the
clock. Watching is free, always. Players pay only for **agency**: time-boxed
requests into the world, and characters of their own who rent, work, and climb
from tenant to landlord.

**The hook:** the eight main characters can **never** be possessed — not by
players, not by the game's owner. Their storylines stay authorial and their
secrets stay theirs. The audience trusts the world because nobody can break it.

**Tagline options:**
- "A neighborhood that's alive whether you're watching or not."
- "The Truman Show you can visit."
- "Watch free. Pay to reach in."

## Fact sheet

| Item | Detail |
|---|---|
| Title | **Real World** — first neighborhood: "The Mission" |
| Genre | Persistent life simulation / spectator sim |
| Platform | Web browser (desktop-first) |
| Status | In active development — no public build yet |
| Price model | Free to watch; paid requests, character slots, subscription (all provisional) |
| Currencies | Credits (meta, real-money/ad-earned, non-transferable) + game dollars (in-world, earned only) |
| Setting | Real Mission District street geometry around Dolores Park; all residents and house numbers fictional |
| Cast | 8 mains (full AI minds, unpossessable) + 20 ambient NPCs (lightweight AI) |
| Key systems | Time-boxed paid requests w/ auto-classification (exclusive/compatible/queued), public request feed, two-currency economy, tenant→owner→landlord progression |
| Deliberate cuts | No voice/TTS, no loot boxes, no cash-out/RMT, no crypto |
| Developer | [STUDIO NAME — placeholder] |
| Release | TBD |
| Contact | [press@ — placeholder, set at launch] |

## Boilerplate

**Short (50 words):**

> Real World is a persistent life sim set on a real Mission District block,
> where 28 fictional residents live 24/7 on AI. Watching is free. Players pay
> only for agency — time-boxed requests and characters of their own — while the
> eight main characters can never be possessed by anyone.

**Long (150 words):**

> Real World is a browser-based "Truman Show": a persistent life simulation set
> on real streets around Dolores Park in San Francisco's Mission District.
> Twenty-eight fictional residents — eight main characters with full AI minds
> and twenty ambient neighbors — live, work, feud, and make up around the clock,
> whether anyone is watching or not. Watching is free, always. Players who want
> to reach in buy agency, not access: a request declares an action and duration
> upfront, prices it in credits, caps it hard, and posts it to a public feed
> everyone can read. The eight mains can never be possessed — by players or by
> the game's own owner — and every secret stays theirs to leak. Players who move
> in rent, work, and climb the neighborhood's oldest ladder: tenant, owner,
> landlord.

## Quotes policy

No testimonials or review quotes exist yet. **Never invent one.** When real
press/players respond post-launch, quotes get added here with name + outlet +
date. The founder quote slot below stays empty until the user writes one:

> [FOUNDER QUOTE — placeholder]

## Assets

| Asset | Status | File reference |
|---|---|---|
| Logo — primary lockup | **Available** — SVG + 1600×480 PNG (light text; dark bgs) | `press-kit/logos/logo-primary.{svg,png}` |
| Logo — light-bg lockup | **Available** — SVG, dark ink for white/light surfaces | `press-kit/logos/logo-primary-dark.svg` |
| Logo — icon | **Available** — SVG + 512×512 PNG; favicon SVG | `press-kit/logos/logo-icon.{svg,png}`, `press-kit/logos/favicon.svg` |
| Logo — icon mono | **Available** — single-ink SVG (`currentColor`) | `press-kit/logos/logo-icon-mono.svg` |
| Key art | **Available** — 1920×1080 + 1080×1080 composites on a real build capture | `press-kit/keyart/keyart-16x9.png`, `keyart-square.png` |
| Screenshots | **Available** — 4 current-build shots (v16) + 2 early-pass shots (v1) | `press-kit/screenshots/` (mirrors `site/shots/`) |
| Fact sheet | **Available** — print-ready HTML, prints to PDF | `press-kit/fact-sheet.html` |
| Trailer | **Not yet produced** — see TRAILER-PLAN.md when it lands | — |

Regenerate all raster brand assets with `python3 marketing/tools/make_brand_assets.py`
(SVGs are the hand-authored vector sources; PNGs/key art are derived).

Screenshot usage: free to use with attribution and the "in development" label —
they show a pre-release build with placeholder UI (dev-build header visible).
Logo rule: don't recolor, stretch, or redraw the lit-window mark.

**Remaining placeholders (all explicitly labeled, all launch-gated):** studio
name, press@/hello@ addresses, social handles, founder quote, release date,
final domain. Everything else in this kit is a real file.

## Story angles for press

1. **The possession ban** — an AI show whose stars can't be controlled by anyone,
   including its owner. Trust as a design pillar.
2. **A real Mission block** — real streets, real park, generated addresses that
   can never be a real door. Local-press angle (SF media, Mission locals).
3. **Agency by the minute** — requests priced like coffee, hard-capped,
   publicly logged; an anti-whale, anti-gacha monetization stance.
4. **Free to watch** — the spectator product *is* the funnel; the public request
   feed doubles as a serialized drama feed.
5. **Honest economics** — LLM inference for the cast costs cents per character
   per day at current API prices; the design's real cost is moderation and
   writing, not tokens. (See internal research report for sourced figures.)

## Contact

- Press: [press@ — placeholder]
- General: [hello@ — placeholder]
- Social: [handles — none registered yet; requires explicit owner approval]

*Nothing on this page has been published. Registering accounts, sending
pitches, or posting requires the owner's explicit go.*
