# trailer/ — animatic pipeline

Local-only pre-production assets for the launch trailer. Nothing here is or
should be published without owner approval (see `../TRAILER-PLAN.md` §9).

## Contents

| File | Purpose |
|------|---------|
| `edl.json` | Machine-readable edit decision list — the source of truth for both cuts (hero 85s, teaser 15s). Shots, timing, cards, motion, grades, recapture flags. |
| `build-animatic.py` | Renders every frame with PIL and pipes to ffmpeg. Produces the mp4s and `.srt` caption files. |
| `out/animatic-hero.mp4` | Rendered 85s hero animatic (silent — music per TRAILER-PLAN §5 is a licensing task). |
| `out/animatic-teaser.mp4` | Rendered 15s teaser animatic. |
| `out/captions-*.srt` | Caption files generated from the EDL card timings. |

## Rebuild

```sh
python3 build-animatic.py          # both programs
python3 build-animatic.py hero     # one program
```

Requires: `python3` + Pillow, `ffmpeg` (libx264). No network, no keys.

## Editing the cut

Edit `edl.json` — timings (`t`, seconds), card text, shot order, zoom/pan,
`grade` (`wet` | `night`), `chip` (`["AI","YOU"]` possession flip),
`timer` (draining possession bar), `transition` (`cut` | `dip`).
Then rebuild. The `.srt` files regenerate from the same data — captions can
never drift from the picture.

## Known limitations (deliberate)

- **Silent.** Music is a licensing/commission decision (TRAILER-PLAN §5).
  Drop a track under `out/audio.*` and mux with `-i` when licensed.
- **Stills stand in for motion.** Every shot with `"recapture": true` in the
  EDL must be re-cut from live game footage before ship — the animatic is an
  edit-timing reference, not the trailer.
- **HUD is cropped out** of the v22 stills (region `[330,100,1440,794]`);
  the shipped trailer should capture with UI hidden per TRAILER-PLAN §4.
- **Pawn name labels remain in frame** on street shots — mains' public names
  only, no secrets. The ship cut must show a *hired* character in the
  possession beats (S9/S10), never a main.
- **`{{URL}}` placeholder** on end cards — substitute at ship time.
