# PUBLISHED — Devlog 6: "The Archive: the block keeps its receipts."

Status: PUBLISHED on `site/journal.html` (v46, dated 2026-09-24), text-only
per `templates/devlog-post.md`. This file is the record of what shipped and
what it asserts.

## Claims made, and their sources

- "The Archive is a second spectator surface: public history browser, every
  day kept whole, browsable five ways, free" — `world/archive.html` +
  `world/archive-ui.md` §1 (world-v20); free tier per archive-ui §8 and
  `world/playtest.json` (`archive` surface, tier:free).
- "Read by day: hour-strip, still-being-written marker through the last
  completed hour" — archive-ui.md §3.
- "By person / by venue: cross-day trails from `who`/`mentions[]`/`venue`
  fields, never string-matching" — archive-ui.md §4.
- "Word on the block: place-sourced, UNCONFIRMED, outcome line on
  resolution; rumors only distort already-public events" — archive-ui.md §5.
- "The ledger: request + admin events verbatim, payer handles, declared
  credits, compensation detail" — archive-ui.md §6.
- "Off the feed gaps stated, not interpolated; person empty-state copy;
  denied requests show outcome only" — archive-ui.md §3/§4/§6 + copy deck §9.
- "Badge reads live archive / demo archive; demo never impersonates live" —
  archive-ui.md §2 merge seam.
- "`#e=`/`#d=`/`#v=` permalinks; wire ids stable live→archive" —
  archive-ui.md §7 + game-v6 `d<MMDD>-<feedN>` id contract.
- "No affordance touches the world — no comments/votes/annotations" —
  archive-ui.md §4 + §8.

## Notes for future iterations

- New `site/archive.html` is the marketing surface for this feature; keep
  its five-view descriptions synced if archive-ui.md changes.
- world archive.html is screenshot-safe — if the art/world tracks publish a
  capture of it, the archive page could carry a real UI shot (check
  `published/` and `world/` for captures at next refresh).
