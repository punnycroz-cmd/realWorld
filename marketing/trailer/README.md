# trailer/ — animatic pipeline

Local-only pre-production assets for the launch trailer. Nothing here is or
should be published without owner approval (see `../TRAILER-PLAN.md` §9).

## Contents

| File | Purpose |
|------|---------|
| `edl.json` | Machine-readable edit decision list — the source of truth for all three cuts (hero 85s, teaser 15s, vertical 30s). Shots, timing, cards, motion, grades, recapture flags, audio presets, per-program `canvas`. |
| `build-animatic.py` | Renders every frame with PIL and pipes to ffmpeg. Produces the mp4s, `.srt` caption files, scratch-audio variants, and `--board` contact sheets. |
| `out/animatic-hero.mp4` | Rendered 85s hero animatic (silent master). |
| `out/animatic-teaser.mp4` | Rendered 15s teaser animatic. |
| `out/animatic-vertical.mp4` | Rendered 30s 9:16 vertical animatic (720×1280). |
| `out/animatic-*-scratch.mp4` | Same cuts with a procedural temp-audio bed (room tone, swell, rain, crickets — synthesized in `synth()`). Mood/timing reference only; the ship score is a licensing task (TRAILER-PLAN §5). |
| `out/board-*.png` | Storyboard contact sheets — one frame per shot + timing/kind/recapture label. |
| `out/captions-*.srt` | Caption files generated from the EDL card timings. |
| `out/scratch-*.wav` | Intermediate audio beds (gitignored — regenerable). |

## Rebuild

```sh
python3 build-animatic.py            # all programs
python3 build-animatic.py vertical   # one program
python3 build-animatic.py --board    # storyboard sheets for all programs
```

Requires: `python3` + Pillow, `ffmpeg` (libx264 + aac). No network, no keys.

## Editing the cut

Edit `edl.json` — timings (`t`, seconds), card text, shot order, zoom/pan,
`grade` (`wet` | `night`), `chip` (`["AI","YOU"]` possession flip),
`timer` (draining possession bar), `transition` (`cut` | `dip`),
`audio` (`room` | `swell` | `ticks` | `thunder` | `rain` | `night` |
`resolve` | omit for silence), `redact` (crop-space rects to blur debug
name tags), and per-program `canvas` (`[w,h]`).
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
- **HUD is cropped out** of the v22 stills (region `[330,100,1440,794]`);
  the shipped trailer should capture with UI hidden per TRAILER-PLAN §4.
- **Pawn name labels remain in frame** on street shots — mains' public names
  only, no secrets. The ship cut must show a *hired* character in the
  possession beats (S9/S10), never a main. In the vertical cut the V4
  possession beat blurs them via `redact` so the AI→YOU chip can't read as
  possessing a main; consider the same for hero S9/S10 at ship.
- **`{{URL}}` placeholder** on end cards — substitute at ship time.
