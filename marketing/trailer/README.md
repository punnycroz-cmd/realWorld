# trailer/ — animatic pipeline

Local-only pre-production assets for the launch trailer. Nothing here is or
should be published without owner approval (see `../TRAILER-PLAN.md` §9).

## Contents

| File | Purpose |
|------|---------|
| `edl.json` | Machine-readable edit decision list — the source of truth for all twelve cuts (hero 90s, teaser 15s, vertical 30s, bumper 6s, feed 50s, movein 60s, day 45s, booking 40s, cast 44s, briefing 45s, consequence 52s, loop 43s) plus the thumbnail specs. Shots, timing, cards, motion, grades (`wet` \| `night` \| `dusk`), recapture flags, audio presets, per-program `canvas`, `requestcard` `verdict` (`approved`/`denied`), `uicard` form mocks (`stamp`/`tone`, `redacted` row flag). |
| `metadata.json` | Upload-ready metadata per cut — title, description, tags, chapter markers, thumbnail pick. `{{URL}}` placeholders; owner-gated. |
| `out/animatic-feed.mp4` | Rendered 50s "Feed Cut" — alternate-concept trailer told entirely through the public feed, incl. a denied-and-refunded possession request (TRAILER-PLAN §7.2). |
| `build-animatic.py` | Renders every frame with PIL and pipes to ffmpeg. Produces the mp4s, `.srt` caption files, scratch-audio variants, and `--board` contact sheets. |
| `out/animatic-hero.mp4` | Rendered 85s hero animatic (silent master). |
| `out/animatic-teaser.mp4` | Rendered 15s teaser animatic. |
| `out/animatic-vertical.mp4` | Rendered 30s 9:16 vertical animatic (720×1280). |
| `out/animatic-bumper.mp4` | Rendered 6s bumper (pre-roll / Shorts end-screen). |
| `out/animatic-movein.mp4` | Rendered 60s "Move-In Cut" — player-journey trailer (watch → join the cast → sign the lease → first attributed request), TRAILER-PLAN §7.3. |
| `out/animatic-day.mp4` | Rendered 45s "One Day" cut — a full simulated day dawn-to-dawn on timecards; the 24/7-sim proof trailer, TRAILER-PLAN §7.4. |
| `out/animatic-booking.mp4` | Rendered 40s "Booking Cut" — scheduled-requests trailer on the game-v14 calendar seam (window pick → public calendar → it fires), TRAILER-PLAN §7.5. |
| `out/animatic-cast.mp4` | Rendered 44s "Cast Cut" — ensemble teaser: meet the eight mains via their public routines, thesis beat = the denied cast-possession request, TRAILER-PLAN §7.6. |
| `out/animatic-briefing.mp4` | Rendered 45s "Briefing Cut" — possession-briefing trailer: the hire comes with public record only, secrets sealed behind redaction bars, TRAILER-PLAN §7.7. |
| `out/animatic-consequence.mp4` | Rendered 52s "Consequence Cut" — production-3 observer-loop trailer: a ritual breaks, you leave for a week, the verified consequence waits on return; catch-up + stakeless-prediction beats are flagged concept UI, TRAILER-PLAN §7.8. |
| `out/animatic-loop.mp4` | Rendered 43s "Loop Cut" — free-observer-loop explainer: the six steps (catch up → follow → predict → inspect → revise → return) as numbered title cards; catch-up/follow/prediction cards are flagged concept UI, TRAILER-PLAN §7.9. |
| `out/thumb-{watcher,handoff,dusk,inside}.png` | The four thumbnail concepts from TRAILER-PLAN §8, rendered at 1280×720 via `--thumbs`. HUD badges and pawn name tags are redact-blurred per the `thumbnails` specs in `edl.json`. |
| `out/animatic-*-scratch.mp4` | Same cuts with a procedural temp-audio bed (room tone, swell, rain, crickets — synthesized in `synth()`). Mood/timing reference only; the ship score is a licensing task (TRAILER-PLAN §5). |
| `out/board-*.png` | Storyboard contact sheets — one frame per shot + timing/kind/recapture label. |
| `out/captions-*.srt` | Caption files generated from the EDL card timings. |
| `out/scratch-*.wav` | Intermediate audio beds (gitignored — regenerable). |

## Rebuild

```sh
python3 build-animatic.py            # all programs
python3 build-animatic.py vertical   # one program
python3 build-animatic.py --board    # storyboard sheets for all programs
python3 build-animatic.py --thumbs   # render thumbnail concepts
python3 build-animatic.py --check    # validate the EDL without rendering
```

Requires: `python3` + Pillow, `ffmpeg` (libx264 + aac). No network, no keys.

## Editing the cut

Edit `edl.json` — timings (`t`, seconds), card text, shot order, zoom/pan,
`grade` (`wet` | `night` | `dusk`), `chip` (`["AI","YOU"]` possession flip),
`timer` (draining possession bar), `uicard` fields (`title`, `sub`,
`lines` [[label, value]…] — a row may carry a third `"redacted"` element
to render a SEALED bar instead of a value, `stamp`, `tone` `good`|`warn`|`accent`),
`transition` (`cut` | `dip`),
`audio` (`room` | `swell` | `ticks` | `keys` | `thunder` | `rain` | `night` |
`resolve` | omit for silence), `redact` (crop-space rects to blur debug
name tags), per-program `canvas` (`[w,h]`), and the top-level
`thumbnails` list (`style`: `rec` | `split` | `wordmark`).
Then rebuild. The `.srt` files regenerate from the same data — captions can
never drift from the picture.

## Known limitations (deliberate)

- **Scratch audio is not music.** The `-scratch.mp4` beds exist so pacing
  review isn't sound-off-blind; the shipped score is still a
  licensing/commission decision (TRAILER-PLAN §5). To audition a licensed
  track, mux it over the silent master.
- **Stills stand in for motion.** Every shot with `"recapture": true` in the
  EDL must be re-cut from live game footage before ship — the animatic is an
  edit-timing reference, not the trailer.
- **Vertical is a center re-frame** — each still uses a 390px column of the
  HUD-free band (`y 100–794`). Watchable for review; the ship cut needs
  native portrait captures.
- **HUD is cropped out** of the published stills (region `[330,100,1440,794]`);
  the shipped trailer should capture with UI hidden per TRAILER-PLAN §4.
- **Pawn name labels remain in frame** on street shots — mains' public names
  only, no secrets. The ship cut must show a *hired* character in the
  possession beats (S9/S10), never a main. In the vertical cut the V4
  possession beat blurs them via `redact` so the AI→YOU chip can't read as
  possessing a main; consider the same for hero S9/S10 at ship.
- **`{{URL}}` placeholder** on end cards — substitute at ship time.
