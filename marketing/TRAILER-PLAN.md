# Trailer Plan — Real World ("The Mission")

**Status:** production-ready plan + rendered animatics, v125 (2026-09-23);
all stills rebased to the **art-v62** build — the aerial-camera build
(`sfTopLean` relief displacement + lateral chromatic aberration in the
lens pass), current latest published. The v62 rebase re-pinned every
`redact` rect (pawn name tags + the DIRECTOR badge moved between builds)
and added an eighth cut: the 40s **"Booking Cut"** (§7.5) dramatizing
the game-v14 bookings/calendar seam. The §4 sunbeam caveat stays closed
(the v56 fix carried forward).
Earlier baseline: v110 rebase to art-v56 (sunbeam fix build) + the 45s
"One Day" cut and `dusk` grade; v95 rebase to art-v55 plus the art-v52
metric-projection **interior stills** (v52-INT-{cafe,flat,hw,taq}) — the
trailer goes indoors (hero S5b, Move-In M5, thumbnail #4, Day Y3).
Eight cuts now exist as real mp4s — hero 90s, teaser 15s, the
9:16 vertical 30s, a 6s bumper, the 50s "Feed Cut" alternate-concept
trailer (§7.2, added v65), the 60s "Move-In Cut" player-journey
trailer (§7.3, added v80), the 45s "One Day" cut (§7.4, v110), and the
40s "Booking Cut" (§7.5, v125) —
`trailer/out/animatic-*.mp4`, built by
`trailer/build-animatic.py` from the machine-readable EDL in
`trailer/edl.json` (§11). Upload-ready metadata (titles, descriptions,
tags, chapter markers, thumbnail picks) lives in `trailer/metadata.json`.
Each cut also has a `-scratch.mp4` variant with
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
| Feed Cut (alt concept) | 50 s | 16:9 | A/B alternate hero, press embeds, streamer cold-open — rendered (§7.2) |
| Move-In Cut (alt concept) | 60 s | 16:9 | how-it-works embed, store-page second video, onboarding ad — rendered (§7.3) |
| One Day Cut (alt concept) | 45 s | 16:9 | second social slot, store ambience video, streamer interstitial — rendered (§7.4) |
| Booking Cut (alt concept) | 40 s | 16:9 | feature-announce post, how-it-works embed, devlog on the request pipeline — rendered (§7.5) |
| Thumbnail stills | — | 16:9 | YouTube/itch — four concepts rendered (§8) |

All footage labeled **"development build — not final"** in the corner bug or
description until the game ships.

## 3. Hero trailer — script + storyboard (90 s)

Tone: quiet, warm, a little uncanny. We are *watching* a neighborhood that
doesn't know it's watched — then the audience reaches in. No narration until
the end card; on-screen text carries the argument. Think prestige-TV title
sequence meets surveillance feed.

Legend: **[T]** on-screen text card · **[VO]** optional voiceover ·
shot sources keyed to §4.

| # | Time | Shot | Visual | Text / Audio |
|---|------|------|--------|--------------|
| 1 | 0:00–0:05 | S1 | Black. A single line of feed text types on: `06:01 — Mars opened Mudhaus.` | Sound: room tone, espresso machine fades up. |
| 2 | 0:05–0:11 | S2 | Top-down dawn over the Mudhaus block (v62-A framing). Slow drift. Tiny pawns move on real streets. | **[T]** "A neighborhood in San Francisco." |
| 3 | 0:11–0:18 | S3 | Street-level follow behind a resident walking 24th St (v62-B framing). | **[T]** "Twenty-eight people live here." |
| 4 | 0:18–0:25 | S4 | Dolores Park overhead, palms and paths (v62-C). Pawns drift toward the grass. | **[T]** "They work. They fall in love. They keep secrets." |
| 5 | 0:25–0:32 | S5 | Director-mode low orbit over Victorian rooftops, water towers, laundry lines (v62-D). Long shadows. | **[T]** "None of them know you're watching." Music: first swell. |
| 5b | 0:32–0:38 | S5b | **Interior:** inside Mudhaus Coffee (v52-INT-cafe, metric-projection rebuild) — pawns at the counter, HUD-free crop. | **[T]** "Inside, the day is already moving." Sound: espresso machine returns, room tone. |
| 6 | 0:38–0:45 | S6 | Feed overlay (UI capture): entries tick by — `Jules signed the lease on 9418 Guerrero St, Unit 3B`, `Vic unboxed a shipment at Auerbach Hardware`, `Dani ordered at Dolores Perk. Again.` | **[T]** "Watching is free. Always." |
| 7 | 0:45–0:52 | S7 | Request card UI fills on screen: `REQUEST: rain — Dolores Park, 2 h — credits/min, declared upfront, hard cap`. Cursor hovers. Approve tick. | **[T]** "Want to reach in? File a request." Sound: a held breath; first thunder. |
| 8 | 0:52–0:59 | S8 | Same park shot as S4, now raining — wet bake, dark pavement, pawns scatter. | **[T]** "Weather. Events. A character of your own." |
| 9 | 0:59–1:06 | S9 | Possession handoff: character card flips `AI → YOU`, street cam follows the pawn turning mid-block. | **[T]** "Drive the character you hired — only yours." |
| 10 | 1:06–1:13 | S10 | Hard-cap moment: timer drains, card flips `YOU → AI`, pawn keeps walking without a stutter. | **[T]** "When time's up, the sim takes the wheel back." |
| 11 | 1:13–1:19 | S11 | Montage on the public request feed: each intervention scrolls past **with attribution**. | **[T]** "Every move is public. The audience sees everything." |
| 12 | 1:19–1:25 | S12 | Night falls fast over the block — sodium lamps pool on the sidewalks (v16 dusk look). One window lit. | Music resolves. Sound: distant bus, crickets. |
| 13 | 1:25–1:30 | End card | Logo on black. | **[T]** "REAL WORLD — The Mission. Watch free. Move in when you're ready." **[VO]** (optional) "The neighborhood is live." + URL + "development build" bug. |

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
| S2 | Top-down, slow E→W drift over Mudhaus block | dawn, dry | matches `site/shots/v62-A.png` |
| S3 | Street-follow behind one walking pawn, 24th St | late afternoon, dry | matches `v62-B.png` |
| S4 | Top-down Dolores Park, palms + paths | late afternoon, dry | matches `v62-C.png` |
| S5 | Director-mode low orbit, rooftops/water towers | golden hour | matches `v62-D.png` |
| S5b | Interior, Mudhaus Coffee counter | day | matches `v52-INT-cafe.png` (art-v52 metric-projection interiors) |
| S6 | Public feed overlay, entries ticking | any | game-systems feed API (`__aiBridge` viewer state) |
| S7 | Request card UI: action + duration + credits | n/a | request pipeline, design doc §11 |
| S8 | S4 framing repeated, wet bake + rain | rain override | `GS_WX_OVR` weather override exists in the sim |
| S9 | Character card `AI → YOU` flip + follow cam | match S3 light | possession = hired character only |
| S10 | Timer expiry, `YOU → AI`, seamless resume | match S9 | forced graceful handoff at timeout |
| S11 | Feed montage w/ attribution rows | n/a | every paid intervention is public |
| S12 | Night grade, lamps pooling | civil dusk | v15-v16 `sfLampsLit()` look |

**Sunbeam caveat — RESOLVED (art-v56, 2026-09-23):** the v49-D Director-mode
sunbeam glitch (hard-edged triangles) was fixed in art-v56 — beams now emit
only where real cloud-silhouette gaps sit near the sun's bearing, drawn under
the deck. All trailer stills are rebased to v62, so no capture carries the
broken look. If a future build regresses, re-check Director-mode frames only.

**Pre-ship substitutes:** until the game build can run these live, cut the
trailer against the existing v62/v52 stills with slow push-ins (Ken Burns) and
mock the feed/request cards as motion graphics labeled "development build."
**This is exactly what the animatic does** — see §11. The plan marks every
shot that MUST be re-captured from live footage before the trailer ships:
**S3, S5b, S6–S11** (UI + motion beats; `"recapture": true` in `edl.json`).
S2–S5 and S12 may ship from high-res stills in a pinch.

**HUD caveat (found while building the animatic):** the published stills
carry the full debug HUD — top bar with a legacy project title, left
character card reading "Jules … CONTROLLED", bottom control strip. Showing a
main marked CONTROLLED would directly contradict the possession ban, so the
animatic crops every exterior still to a HUD-free region
(`[330,100,1440,794]`). The v52 **interior** stills carry the same HUD plus
a venue plaque (parody name — keep it); their HUD-free crop is
`[360,60,1440,825]` — tighter on the left to clear the character card.
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
4b. "Inside, the day is already moving." (S5b interior beat, v95)
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

### 7.2 The Feed Cut — alternate-concept trailer (v65 — rendered)

`edl.json` carries a fifth `"feed"` program (50 s, 16:9) rendered to
`out/animatic-feed.mp4` + `captions-feed.srt` + `board-feed.png` (+ scratch
bed). It is a **second creative concept**, not a cutdown: the entire trailer
is told through the public feed — found-footage style — because "the
audience watches the players as much as the characters" is the product's
most differentiating truth. Use it to A/B against the hero, as the press-kit
embed (journalists get the mechanic in one watch), or as a streamer
cold-open.

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | F1 feedline cold open | `19:42 — Dani ordered at Dolores Perk. Again.` types on black |
| 0:04–0:11 | F2 ambient feed ticking | "The block writes its own feed — all day, every day." |
| 0:11–0:17 | F3 request card: rain, APPROVED | "Someone in the audience just reached in." |
| 0:17–0:23 | F4 park goes wet | "Requests become weather." |
| 0:23–0:30 | F5 attributed ledger incl. a DENIED line + compensated admin override | "Every intervention is public. Even the ones we refuse." |
| 0:30–0:36 | F6 request card: possess Mars (cast) — `× DENIED · REFUNDED` | "The cast can't be bought. Requests like this bounce." |
| 0:36–0:41 | F7 street still, AI→YOU chip (name tags redact-blurred) | "Your hire answers to you — for the minutes you paid for." |
| 0:41–0:45 | F8 feedline button | `00:12 — Mars closed Mudhaus. The block sleeps. The feed doesn't.` |
| 0:45–0:50 | F9 end card | "REAL WORLD — THE MISSION. Watch free. Move in when you're ready. {{URL}}" |

The denial beat is the point: F5/F6 dramatize the possession ban and the
deny-with-refund pipeline (design §5/§7/§11) as *content*, not fine print —
the refusal is itself on the public feed. Renderer support: `requestcard`
shots accept `"verdict": "denied"` (default `approved`), which paints the
verdict button red as `× DENIED · REFUNDED`. F7's possession chip reuses
the vertical V4 name-tag redaction remapped to the hero crop
(`[292,220,332,236]`, `[344,244,408,264]`). Same rules as every other cut:
feed entries are verbatim-accurate mocks, `{{URL}}` placeholder stands, and
every recapture-flagged shot (F2–F7) must be re-cut from live UI/footage
before ship.

### 7.3 The Move-In Cut — player-journey trailer (v80 — rendered)

`edl.json` carries a sixth `"movein"` program (60 s, 16:9) rendered to
`out/animatic-movein.mp4` + `captions-movein.srt` + `board-movein.png`
(+ scratch bed). Third creative concept: where the hero is the *watcher's*
trailer and the Feed Cut is the *world's*, this one is the *player's* —
the whole free-watch → join-the-cast → sign-a-lease → first-request arc,
narrated by the paperwork. Best fit: the how-it-works page embed, the
store page's second video slot, and any onboarding retargeting if ads are
ever approved.

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | M1 feedline cold open | `07:14 — Vic opened Auerbach Hardware.` types on black |
| 0:04–0:10 | M2 café block, slow drift | "Watching the block costs nothing." |
| 0:10–0:18 | M3 `uicard` JOIN THE CAST | "Pick a handle. Land in the next window." |
| 0:18–0:26 | M4 `uicard` LEASE — UNIT 3B | "Sign a lease like everybody else." |
| 0:26–0:31 | M5 **flat interior** (v52-INT-flat — the leased top-floor unit, HUD-free crop) | "Then it's your block too." |
| 0:31–0:38 | M6 request card: rain, APPROVED | "File a request. Your handle goes on it." |
| 0:38–0:44 | M7 park goes wet | "Requests become weather." |
| 0:44–0:51 | M8 attributed ledger incl. own handle + a DENIED row | "Every move is attributed. Yours too." |
| 0:51–0:55 | M9 feedline button | `19:02 — nightowl_415 moved in on Guerrero.` |
| 0:55–1:00 | M10 end card | "REAL WORLD — THE MISSION. Watch free. Move in when you're ready. {{URL}}" |

**New shot kind `uicard`:** a generic in-world form mock — header,
label/value rows revealed in sequence, and a stamp (`ON THE ROSTER`,
`SIGNED`) landing at ~62% — requestcard's layout language for screens that
aren't requests. Fields per shot: `title`, `sub`, `lines` ([label, value]
pairs, ≤6), `stamp`, `tone` (`good`/`warn`/`accent`).

**Accuracy anchors (verify before ship):**

- **M3** mirrors the world-v49 creation contract (`world/creation.json`
  v23 / `create.html` v4): handle, public attribution by handle (never a
  real name), a declared landing window, and roster honesty — the card
  reads "spot confirmed at submit", not "spots always open".
- **M4** mirrors the world-v54 lease contract (`world/leases.json`):
  prorated first month, 21-day deposit-return clock, habitability SLA in
  writing, named landlord of record. These are the same lines on
  `lease.html` — if the lease terms change, this card lies.
- **M6** keeps the §11 review step visible (`status: reviewed → live on
  the feed`) — no instant/anonymous intervention implied.
- **M8** shows the new resident's own handle in the ledger next to a
  DENIED row — attribution and the possession ban apply to the player too.
- The cast stays untouched: no shot implies steering a main; the only
  denied action shown is possession of a cast member, refused up front.
- `nightowl_415` is a fictional handle for a *player* resident — not a
  cast-bible name; swap if it collides with a real roster entry at ship.

### 7.4 The One Day Cut — 24/7-sim proof trailer (v110 — rendered)

`edl.json` carries a seventh `"day"` program (45 s, 16:9) rendered to
`out/animatic-day.mp4` + `captions-day.srt` + `board-day.png` (+ scratch
bed). Fourth creative concept — the *world's* trailer in the literal sense:
one full simulated day compressed to 45 seconds, dawn to dawn. Where the
hero sells watching and Move-In sells joining, this cut sells the claim
that is hardest to believe in a trailer: **it runs whether or not you
watch.** The clock is the narrator — bare timecards instead of argument.

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | Y1 feedline cold open | `05:58 — Mars unlocked Mudhaus.` types on black |
| 0:04–0:09 | Y2 café block, dawn drift | "06:01" |
| 0:09–0:14 | Y3 Mudhaus interior (v52-INT-cafe) | "09:40 — the morning rush, unsupervised" |
| 0:14–0:18 | Y4 Dolores Park, midday | "13:15" |
| 0:18–0:23 | Y5 same park, wet grade | "15:02 — a request became rain" |
| 0:23–0:28 | Y6 street level, `dusk` grade | "18:40" |
| 0:28–0:33 | Y7 rooftops, `night` grade | "22:47" |
| 0:33–0:38 | Y8 deepest night | "03:12 — nobody's watching. It's still running." |
| 0:38–0:41 | Y9 feedline button | `05:58 — Mars unlocked Mudhaus.` — the loop closes |
| 0:41–0:45 | Y10 end card | "REAL WORLD — THE MISSION. It doesn't stop when you look away. {{URL}}" |

**New grade `dusk`** (build-animatic.py): warm amber dim between the plain
day look and `night` — brightness 0.62, slight desat, amber blend. The cut
needs four distinct light states (dawn/day/dusk/night) to read as time
passing; `dusk` fills the gap the `wet`/`night` pair left.

**Accuracy anchors:**

- The thesis is design truth #1 — a 24/7 world that runs unwatched. No
  mechanic is shown; Y5's rain beat is the same approved-request→weather
  path the hero dramatizes, and it passes *through* the day rather than
  stopping it — the point is the world absorbs interventions and continues.
- Y8's "nobody's watching. It's still running." is a claim about the sim
  loop, not about a camera feature — keep it.
- No cast possession, no UI promises; only Y3 (interior still standing in
  for live footage) carries `recapture: true`. All exteriors may ship from
  stills in a pinch, like S2–S5/S12.

**Placement:** the second social slot after the hero (the answer to
"okay, but is it actually alive?"), the store page's ambience video, and
a streamer interstitial. Also the strongest loop-able cut — Y9 is Y1's
line verbatim, so a seamless-loop export is one ffmpeg trim away.

### 7.5 The Booking Cut — scheduled-requests trailer (v125 — rendered)

`edl.json` carries an eighth `"booking"` program (40 s, 16:9) rendered to
`out/animatic-booking.mp4` + `captions-booking.srt` + `board-booking.png`
(+ scratch bed). Fifth creative concept — the *planner's* trailer: it
dramatizes the bookings seam that landed in game-v14 (world/bookings.json
`live_seam` → `gsBookCalendar`/`gsBookableSlots`, `start_slot` window
grammar, `booked` status, the public calendar strip). Where the hero says
"reach in," this cut says "reach in *on schedule* — and everyone can see
it coming."

| Time | Shot | Text |
|------|------|------|
| 0:00–0:04 | K1 feedline cold open | `18:22 — @mara filed a request: a street party, tomorrow.` types on black |
| 0:04–0:12 | K2 `uicard` BOOK THE BLOCK | "Some requests need a window." |
| 0:12–0:19 | K3 public-calendar ledger | "The calendar is public. Everyone sees what's coming." |
| 0:19–0:25 | K4 street level, day | "Tomorrow comes either way." |
| 0:25–0:31 | K5 park overhead, event fires | "14:00 — it fires. The block shows up." |
| 0:31–0:35 | K6 feedline button | `16:04 — Valencia St cleared. @mara's party ran — public.` |
| 0:35–0:40 | K7 end card | "REAL WORLD — THE MISSION. Watch free. Move in when you're ready. {{URL}}" |

**Accuracy anchors (verify before ship):**

- **K2** mirrors the game-v14 booking contract: `start_slot` window
  grammar, 30-minute snap, 24-hour horizon — which is why the card says
  "tomorrow," never a date weeks out. Cost stays generic
  (`credits/min · hard cap`) pending owner sign-off on numbers.
  `booked` is a real request status — the stamp is verbatim.
- **K3** mirrors `gsViewerState().calendar` exactly: day/time, attributed
  handle, what — **no prices, no queue positions**. Keep it that way.
- **K5** shows the firing beat only: bookable `event` maps to the sim's
  `street_event` action — the world absorbs it like any other request.
- No cast involvement, no exclusivity promises; the calendar rows are
  public-information beats, same visibility class as the request feed.
- All UI shots (K2, K3, K5) carry `recapture: true` — the animatic mocks
  the seams; the ship cut recaptures them live.

**Placement:** feature-announce posts when bookings ship publicly, the
how-it-works page's request section, and a devlog clip on "the request
pipeline grew a calendar." Not a hero candidate — it's a depth cut for
viewers already sold on watching.

## 8. Thumbnail concepts (v95 — rendered)

All four are now real PNGs at `out/thumb-*.png` (1280×720), rendered by
`python3 build-animatic.py --thumbs` from the top-level `thumbnails` spec
in `edl.json` — same stills, brand palette, and redact machinery as the
animatics:

1. **The watcher** (`thumb-watcher.png`, style `rec`): v62-D director
   shot, vignette-darkened edges, red "REC · live — 24/7" cluster,
   title small at the bottom. The debug "DIRECTOR" badge is
   redact-blurred. Sells the Truman-Show premise instantly.
2. **The handoff** (`thumb-handoff.png`, style `split`): v62-B street
   shot split down the middle — left labeled `AI`, right `YOU` on a
   brightened half, orange seam. Pawn name tags are redact-blurred so
   the AI/YOU split can't read as possessing a main. Sells the hook
   mechanic.
3. **The block at dusk** (`thumb-dusk.png`, style `wordmark`): v62-D
   under the night grade, wordmark + accent rule only. Quietest option;
   best for press embeds.
4. **The inside** (`thumb-inside.png`, style `rec`, v95): v52-INT-cafe
   interior under the REC bug — the watcher premise extends indoors.
   HUD-free crop; the Mudhaus plaque (parody name) stays readable.

Thumbnails carry no `{{URL}}` and no dev-build bug (that label lives on
the video footage itself). Pick one at upload; A/B test later. Reuse
`press-kit/keyart/` if a painted look is wanted.

## 9. Pre-flight accuracy checklist (run before export)

- [ ] No real SF business names in frame or copy — canonical parody names
      only (`world/parody-names.json`: Mudhaus Coffee, Dolores Perk,
      Auerbach Hardware, Taqueria El Farolote, Buy-Rite …).
      Real streets/landmarks OK.
- [ ] No debug HUD in frame (top bar, character card, controls strip) —
      animatic crops exteriors to `[330,100,1440,794]` and v52 interiors
      to `[360,60,1440,825]`; ship captures hide the UI.
- [ ] Possession beat shows hired character only; duration + hard cap visible.
- [ ] No voice/dialogue, no cash-out, no loot boxes, no "MMO" wording.
- [ ] Credit numbers on screen match the monetization plan *or* are generic.
- [ ] "Development build" bug present on all footage.
- [ ] Feed attribution visible in S11 — the transparency promise is a feature.
- [ ] (Feed Cut) denied request reads `DENIED — refunded`, never ran; no
      denied action shown executing.
- [ ] (Move-In) create/lease cards match the live contracts
      (world/creation.json + world/leases.json at ship date); handle is a
      fictional player handle, not a cast name.
- [x] No v49-D-era sunbeam renders in frame — RESOLVED: all stills rebased
      to art-v56 (the fix build) at v110 and again to art-v62 (aerial
      camera + lens CA) at v125. Re-check only if the art track ships a
      newer canonical build before capture day.
- [ ] Owner sign-off recorded in LAUNCH-CHECKLIST.md before any upload.

## 10. Handoff

Everything an editor needs is in this repo: the rendered animatics + EDL in
`marketing/trailer/` (§11), stills in `site/shots/` (v62 series + v61/v59/v55 era sets + v52
interior quartet + v16 interiors + v1 early-pass pair), brand assets in `site/assets/` +
`press-kit/`, voice/tone spec in `marketing/BRAND.md`, description copy in
§6, store context in `STORE-COPY.md`. Open dependencies: live UI captures
for the recapture-flagged shots (game build), final credit numbers (owner).
Parody names are RESOLVED (`world/parody-names.json`).

## 11. Animatic — rendered pre-production cut (v20; extended v35, v50)

`marketing/trailer/` contains a self-contained pipeline that turns this plan
into watchable video:

- **`edl.json`** — machine-readable edit decision list. Eight programs
  (`hero` 90s, `teaser` 15s, `vertical` 30s at `[720,1280]`, `bumper` 6s,
  `feed` 50s — the §7.2 alternate concept, `movein` 60s — the §7.3
  player-journey cut, `day` 45s — the §7.4 24/7-sim cut, `booking` 40s —
  the §7.5 scheduled-requests cut)
  plus the `thumbnails` spec: every shot's
  source still, timing, card text, Ken Burns zoom/pan, color grade
  (`wet`/`night`/`dusk` — dusk added v110 for the One Day light arc), possession chip +
  draining timer overlays, `uicard` form mocks (v80 — join/lease cards),
  transition type, a `recapture` flag = the §4
  must-recapture list, and an `audio` preset naming the intended sound bed.
- **`metadata.json`** (v80) — upload-ready metadata per cut: title,
  description, tags, chapter markers, thumbnail pick, intended slot.
  `{{URL}}` placeholders throughout; the owner flips them at go.
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
