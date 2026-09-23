# Trailer Plan — Real World ("The Mission")

**Status:** production-ready plan + rendered animatics, v50 (2026-09-24);
all stills/programs rebased to the art-v37 build in v55.
All four cuts now exist as real mp4s — hero 85s, teaser 15s, the
9:16 vertical 30s, and a 6s bumper — `trailer/out/animatic-*.mp4`, built by
`trailer/build-animatic.py` from the machine-readable EDL in
`trailer/edl.json` (§11). Each cut also has a `-scratch.mp4` variant with
a procedural temp-audio bed (mood/timing reference only — the ship score
is still a licensing task, §5) and a printable `board-*.png` contact
sheet. The three §8 thumbnail concepts are rendered PNGs
(`out/thumb-*.png`), and `--check` validates the whole EDL without
rendering. Live footage still pending; the animatic locks timing, copy,
and structure so the ship cut is a recapture job, not a rewrite.
**Owner-gated:** publishing the finished video anywhere requires explicit owner
approval. All captures come from the local dev build or the shipped game.
**Accuracy rule:** every claim below is verified against
`devin-reviews/rw-game-design-2026-09-22.md`. No feature is shown or implied that
the design does not have.

---

## 1. Product truths the trailer must convey

In priority order — if a viewer remembers only these, the trailer worked:

1. **A real SF Mission neighborhood, simulated 24/7.** 28 fictional characters
   on real streets around Dolores Park. It runs whether or not you watch.
2. **Watching is free.** The free tier (observe the world + public feeds) is
   the product's core, not a demo.
3. **Agency is paid, access is not.** File a request — drive your own hired
   character, change the weather, join the cast — priced per minute, declared
   upfront, hard cap.
4. **The cast is off-limits.** The 8 mains can never be possessed — not by
   players, not by the owner. Their drama is authored by the sim, not steered.
5. **Everything is public.** The request feed shows every intervention with
   attribution. The audience watches the players as much as the characters.

Things the trailer must **never** imply: possessing arbitrary characters,
mind-control/dialogue-steering (requests inject as *opportunities* — the AI
decides how to render them), voice chat/TTS (cut from v1), cash-out/RMT,
loot boxes, MMO scale, real SF business names (parody names only — canonical
list is `world/parody-names.json`, RESOLVED since world-v2: Mudhaus Coffee,
Dolores Perk, Auerbach Hardware, Taqueria El Farolote, Buy-Rite, etc.).

## 2. Deliverables

| Asset | Length | Ratio | Use |
|---|---|---|---|
| Hero trailer | 75–90 s | 16:9 | site hero, YouTube, press kit, store page |
| Teaser cutdown | 15 s | 16:9 + 9:16 re-frame | social launch day, paid placements if approved |
| Vertical cut | 30 s | 9:16 | TikTok/Reels/Shorts — animatic rendered (§11) |
| Bumper | 6 s | 16:9 | pre-roll, Shorts end-screen, Discord embed — rendered (§7.1) |
| Thumbnail stills | — | 16:9 | YouTube/itch — three concepts rendered (§8) |

All footage labeled **"development build — not final"** in the corner bug or
description until the game ships.

## 3. Hero trailer — script + storyboard (80 s)

Tone: quiet, warm, a little uncanny. We are *watching* a neighborhood that
doesn't know it's watched — then the audience reaches in. No narration until
the end card; on-screen text carries the argument. Think prestige-TV title
sequence meets surveillance feed.

Legend: **[T]** on-screen text card · **[VO]** optional voiceover ·
shot sources keyed to §4.

| # | Time | Shot | Visual | Text / Audio |
|---|------|------|--------|--------------|
| 1 | 0:00–0:05 | S1 | Black. A single line of feed text types on: `06:01 — Mars opened Mudhaus.` | Sound: room tone, espresso machine fades up. |
| 2 | 0:05–0:12 | S2 | Top-down dawn over the Mudhaus block (v37-A framing). Slow drift. Tiny pawns move on real streets. | **[T]** "A neighborhood in San Francisco." |
| 3 | 0:12–0:19 | S3 | Street-level follow behind a resident walking 24th St (v37-B framing). | **[T]** "Twenty-eight people live here." |
| 4 | 0:19–0:26 | S4 | Dolores Park overhead, palms and paths (v37-C). Pawns drift toward the grass. | **[T]** "They work. They fall in love. They keep secrets." |
| 5 | 0:26–0:33 | S5 | Director-mode low orbit over Victorian rooftops, water towers, laundry lines (v37-D). Long shadows. | **[T]** "None of them know you're watching." Music: first swell. |
| 6 | 0:33–0:40 | S6 | Feed overlay (UI capture): entries tick by — `Jules signed the lease on 9418 Guerrero St, Unit 3B`, `Vic unboxed a shipment at Auerbach Hardware`, `Dani ordered at Dolores Perk. Again.` | **[T]** "Watching is free. Always." |
| 7 | 0:40–0:47 | S7 | Request card UI fills on screen: `REQUEST: rain — Dolores Park, 2 h — credits/min, declared upfront, hard cap`. Cursor hovers. Approve tick. | **[T]** "Want to reach in? File a request." Sound: a held breath; first thunder. |
| 8 | 0:47–0:54 | S8 | Same park shot as S4, now raining — wet bake, dark pavement, pawns scatter. | **[T]** "Weather. Events. A character of your own." |
| 9 | 0:54–1:01 | S9 | Possession handoff: character card flips `AI → YOU`, street cam follows the pawn turning mid-block. | **[T]** "Drive the character you hired — only yours." |
| 10 | 1:01–1:08 | S10 | Hard-cap moment: timer drains, card flips `YOU → AI`, pawn keeps walking without a stutter. | **[T]** "When time's up, the sim takes the wheel back." |
| 11 | 1:08–1:14 | S11 | Montage on the public request feed: each intervention scrolls past **with attribution**. | **[T]** "Every move is public. The audience sees everything." |
| 12 | 1:14–1:20 | S12 | Night falls fast over the block — sodium lamps pool on the sidewalks (v16 dusk look). One window lit. | Music resolves. Sound: distant bus, crickets. |
| 13 | 1:20–1:25 | End card | Logo on black. | **[T]** "REAL WORLD — The Mission. Watch free. Move in when you're ready." **[VO]** (optional) "The neighborhood is live." + URL + "development build" bug. |

### Script notes for the editor

- **No fake dialogue.** Characters never speak on camera — v1 has no voice/TTS.
  Mood comes from camera, music, and feed text.
- **Feed entries are UI captures or tasteful mocks** of the real public request
  feed — never invented "player quotes."
- **The possession shots (S9/S10)** are the accuracy-critical beats: show the
  hired character only, the declared duration, and the graceful AI handoff.
  Do not cut them in a way that reads as "possess anyone."
- **Price on screen:** keep cost phrased as `credits/min · declared upfront ·
  hard cap` — final numbers are PROPOSAL pending owner sign-off (see the
  monetization plan + `PRICING-PAGE-CONTENT.md`). Swap before ship.

## 4. Shot list — capture session runbook

Capture at 1440×900 or higher, UI hidden unless the shot needs it. Pin
`W.tod`/`W.month` per shot for continuity (v14+ canonical captures pin
`tod=16.5`; dusk shots use the v15-v16 lamp engine, el < ~5°).

| ID | Framing | Settings | Source of truth |
|----|---------|----------|-----------------|
| S2 | Top-down, slow E→W drift over Mudhaus block | dawn, dry | matches `site/shots/v37-A.png` |
| S3 | Street-follow behind one walking pawn, 24th St | late afternoon, dry | matches `v37-B.png` |
| S4 | Top-down Dolores Park, palms + paths | late afternoon, dry | matches `v37-C.png` |
| S5 | Director-mode low orbit, rooftops/water towers | golden hour | matches `v37-D.png` |
| S6 | Public feed overlay, entries ticking | any | game-systems feed API (`__aiBridge` viewer state) |
| S7 | Request card UI: action + duration + credits | n/a | request pipeline, design doc §11 |
| S8 | S4 framing repeated, wet bake + rain | rain override | `GS_WX_OVR` weather override exists in the sim |
| S9 | Character card `AI → YOU` flip + follow cam | match S3 light | possession = hired character only |
| S10 | Timer expiry, `YOU → AI`, seamless resume | match S9 | forced graceful handoff at timeout |
| S11 | Feed montage w/ attribution rows | n/a | every paid intervention is public |
| S12 | Night grade, lamps pooling | civil dusk | v15-v16 `sfLampsLit()` look |

**Pre-ship substitutes:** until the game build can run these live, cut the
trailer against the existing v37 stills with slow push-ins (Ken Burns) and
mock the feed/request cards as motion graphics labeled "development build."
**This is exactly what the animatic does** — see §11. The plan marks every
shot that MUST be re-captured from live footage before the trailer ships:
**S3, S6–S11** (UI + motion beats; `"recapture": true` in `edl.json`).
S2–S5 and S12 may ship from high-res stills in a pinch.

**HUD caveat (found while building the animatic):** the published stills
carry the full debug HUD — top bar with a legacy project title, left
character card reading "Jules … CONTROLLED", bottom control strip. Showing a
main marked CONTROLLED would directly contradict the possession ban, so the
animatic crops every still to a HUD-free region (`[330,100,1440,794]`).
The ship capture must run with UI hidden — and the possession beats (S9/S10)
must feature a **player-hired** character, never one of the 8 mains.

## 5. Music & sound

- **Music:** one licensed track or commissioned cue. Requirements: sync +
  master license covering web/social/storefront use, perpetual, worldwide,
  paid-placement cleared (in case ads are ever approved). No library track
  with Content-ID conflicts on YouTube.
- **Direction:** sparse piano/felt keys + street ambience, one swell at S5,
  resolve to warmth at S12. No epic-trailer braams — wrong genre signal.
- **Sound design list:** espresso machine, room tone, page/keyboard tick for
  feed text, distant thunder (S7→S8), rain on pavement, night bus + crickets.
  All SFX from licensed libraries or recorded — keep a license manifest in
  `marketing/press-kit/` next to the finished files.

## 6. Copy deck

**Title cards** (exact strings — do not punch up past the design):

1. "A neighborhood in San Francisco."
2. "Twenty-eight people live here."
3. "They work. They fall in love. They keep secrets."
4. "None of them know you're watching."
5. "Watching is free. Always."
6. "Want to reach in? File a request."
7. "Weather. Events. A character of your own."
8. "Drive the character you hired — only yours."
9. "When time's up, the sim takes the wheel back."
10. "Every move is public. The audience sees everything."
11. End card: "REAL WORLD — The Mission" / "Watch free. Move in when you're ready." / `{{URL}}`

**YouTube/itch description (draft):**
> A real San Francisco Mission block, simulated around the clock. Twenty-eight
> fictional characters live, work, and keep secrets — and watching them is
> free. When you want to reach in, file a request: drive your own hired
> character, change the weather, join the cast. Every intervention is public.
> Development-build footage.

**Tags/keywords:** AI life sim, Truman Show game, AI villagers, simulation
game, San Francisco game, watchable world.

**Captions:** ship an `.srt` with the text cards timed as above; the trailer
must read fully muted (most social plays are sound-off).

## 7. 15-second teaser cutdown

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | S2 top-down dawn | "A neighborhood that doesn't know it's watched." |
| 0:04–0:08 | S8 rain snap (dry→wet cut) | "Watching is free." |
| 0:08–0:12 | S9 possession flip | "Reaching in costs credits." |
| 0:12–0:15 | End card | "REAL WORLD — The Mission. {{URL}}" |

9:16 re-frame: recompose to the center third; all captures are 1440×900 so the
center crop is 506×900 — re-capture vertically at ship if quality is short.

### 30-second vertical cut (v35 — now rendered)

The §2 vertical deliverable is no longer optional-future: `edl.json` carries a
`"vertical"` program (canvas `[720,1280]`) rendered to
`out/animatic-vertical.mp4` + `captions-vertical.srt`:

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | V1 feedline cold open | `06:01 — Mars opened Mudhaus.` types on black |
| 0:04–0:10 | V2 café block, center re-frame | "A neighborhood that doesn't know it's watched." |
| 0:10–0:15 | V3 park, wet grade | "Watching is free." |
| 0:15–0:21 | V4 possession chip AI→YOU | "Reaching in costs credits." |
| 0:21–0:26 | V5 night grade, lamps | — |
| 0:26–0:30 | V6 end card | "REAL WORLD — The Mission. Watch free." |

Vertical crops use the same HUD-free band (`y 100–794`) narrowed to a 390px
column — the animatic is watchable but the ship cut should re-capture native
portrait framing. Same accuracy rules: possession chip implies hired-character
only, `{{URL}}` placeholder on the end card. V4 additionally `redact`-blurs
the debug name tags in frame — the AI→YOU chip over a labeled main would
violate the possession-ban truth; consider the same redaction for hero
S9/S10 at ship.

### 7.1 Six-second bumper (v50 — rendered)

`edl.json` carries a fourth `"bumper"` program, rendered to
`out/animatic-bumper.mp4` + `captions-bumper.srt` (+ scratch bed). For
non-skippable pre-roll, Shorts end-screens, and Discord link embeds —
anywhere a 6-second loop outperforms a thumbnail alone:

| Time | Shot | Text |
|------|------|------|
| 0:00–0:03 | B1 café block, slow drift | "A neighborhood that doesn't know it's watched." |
| 0:03–0:06 | B2 end card (dip) | "REAL WORLD — THE MISSION. Watch free. {{URL}}" |

One image, one line, logo — the card is 58 characters, readable inside the
3-second window. No possession beat: a 6s cut can't carry the hired-only
nuance, so the bumper sells watchability only.

## 8. Thumbnail concepts (v50 — rendered)

All three are now real PNGs at `out/thumb-*.png` (1280×720), rendered by
`python3 build-animatic.py --thumbs` from the top-level `thumbnails` spec
in `edl.json` — same stills, brand palette, and redact machinery as the
animatics:

1. **The watcher** (`thumb-watcher.png`, style `rec`): v37-D director
   shot, vignette-darkened edges, red "REC · live — 24/7" cluster,
   title small at the bottom. The debug "DIRECTOR" badge is
   redact-blurred. Sells the Truman-Show premise instantly.
2. **The handoff** (`thumb-handoff.png`, style `split`): v37-B street
   shot split down the middle — left labeled `AI`, right `YOU` on a
   brightened half, orange seam. Pawn name tags are redact-blurred so
   the AI/YOU split can't read as possessing a main. Sells the hook
   mechanic.
3. **The block at dusk** (`thumb-dusk.png`, style `wordmark`): v37-D
   under the night grade, wordmark + accent rule only. Quietest option;
   best for press embeds.

Thumbnails carry no `{{URL}}` and no dev-build bug (that label lives on
the video footage itself). Pick one at upload; A/B test later. Reuse
`press-kit/keyart/` if a painted look is wanted.

## 9. Pre-flight accuracy checklist (run before export)

- [ ] No real SF business names in frame or copy — canonical parody names
      only (`world/parody-names.json`: Mudhaus Coffee, Dolores Perk,
      Auerbach Hardware, Taqueria El Farolote, Buy-Rite …).
      Real streets/landmarks OK.
- [ ] No debug HUD in frame (top bar, character card, controls strip) —
      animatic crops to `[330,100,1440,794]`; ship captures hide the UI.
- [ ] Possession beat shows hired character only; duration + hard cap visible.
- [ ] No voice/dialogue, no cash-out, no loot boxes, no "MMO" wording.
- [ ] Credit numbers on screen match the monetization plan *or* are generic.
- [ ] "Development build" bug present on all footage.
- [ ] Feed attribution visible in S11 — the transparency promise is a feature.
- [ ] Owner sign-off recorded in LAUNCH-CHECKLIST.md before any upload.

## 10. Handoff

Everything an editor needs is in this repo: the rendered animatics + EDL in
`marketing/trailer/` (§11), stills in `site/shots/` (v37 series + v16
interiors + v1 early-pass pair), brand assets in `site/assets/` +
`press-kit/`, voice/tone spec in `marketing/BRAND.md`, description copy in
§6, store context in `STORE-COPY.md`. Open dependencies: live UI captures
for the recapture-flagged shots (game build), final credit numbers (owner).
Parody names are RESOLVED (`world/parody-names.json`).

## 11. Animatic — rendered pre-production cut (v20; extended v35, v50)

`marketing/trailer/` contains a self-contained pipeline that turns this plan
into watchable video:

- **`edl.json`** — machine-readable edit decision list. Four programs
  (`hero` 85s, `teaser` 15s, `vertical` 30s at `[720,1280]`, `bumper` 6s)
  plus the `thumbnails` spec: every shot's
  source still, timing, card text, Ken Burns zoom/pan, color grade
  (`wet`/`night` simulated the §8 beat and the night look), possession chip +
  draining timer overlays, transition type, a `recapture` flag = the §4
  must-recapture list, and an `audio` preset naming the intended sound bed.
- **`build-animatic.py`** — PIL renders every frame (feed mock, request-card
  mock, attribution ledger, end card, `DEVELOPMENT BUILD` corner bug,
  dip-to-black transitions) and pipes to ffmpeg → mp4. Per-program canvas +
  font scaling, so the vertical cut shares every renderer. Rebuild:
  `python3 build-animatic.py [hero|teaser|vertical|all]`.
- **Scratch audio (v35):** shots' `audio` presets (`room`, `swell`, `ticks`,
  `thunder`, `rain`, `night`, `resolve`) are synthesized in pure Python →
  `out/scratch-*.wav`, muxed to `out/animatic-*-scratch.mp4`. Temp bed for
  pacing review only — the ship score is the licensing task in §5; nothing
  here is licensed or final.
- **Storyboard sheets (v35):** `python3 build-animatic.py --board [program]`
  tiles one representative frame per shot + timing/kind/recapture label +
  card text into `out/board-*.png` — the printable storyboard an editor can
  pin up next to §3/§4.
- **`out/animatic-*.mp4`** — the rendered cuts; **`out/captions-*.srt`** —
  generated from the same EDL, so captions can never drift from picture.
- **Thumbnails (v50):** `python3 build-animatic.py --thumbs` renders the
  §8 concepts to `out/thumb-*.png` (1280×720); crops/redacts are declared
  per spec in `edl.json`.
- **EDL validation (v50):** `python3 build-animatic.py --check` verifies
  every program without rendering — required fields per shot kind, still
  files exist, crops inside image bounds, audio presets/transitions valid,
  card copy ≤80 chars, per-program duration ceilings, endcard `{{URL}}`
  placeholders intact. Exits non-zero on FAIL; run after any EDL edit.

Use it to review pacing/copy with the owner before any capture session, as
the timing reference for the editor, and as the muted-safe proof that the
cut reads without sound. When the game ships UI captures, swap
`"src"` stills for footage per shot — timing and copy stay locked.
