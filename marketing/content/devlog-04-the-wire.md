# PUBLISHED — Devlog 4: "The Wire: every event gets a permalink."

Status: PUBLISHED on `site/journal.html` (v42, dated 2026-09-24), text-only
per `templates/devlog-post.md`. This file is the record of what shipped and
what it asserts.

## Claims made, and their sources

- "Event bus projects into the public schema; stable `d<MMDD>-<feedN>` ids;
  ids resolve in the Archive the next day" — game-v6
  `src/systems/41_game_systems_feed.js` (`gsWireArchive*`,
  history.json-shaped day objects) + `world/feed.json` permalink contract.
- "Follow-pins on venues and residents" — wire-ui.md §5 (`v:`/`c:` pins,
  free/localStorage).
- "Request lifecycle grouped into one trail" — wire-ui.md §4 (`req` id
  timeline) + feed.json `req` field (world-v19).
- "'You're caught up' marker; `quiet` honest-empty marker" — wire-ui.md §3,
  feed.json event_kinds.
- "Denied requests show only the why-class; screened text never public;
  admin actions carry compensation" — wire-ui.md §4 +
  `world/moderation.json` deny contract + `compensated_cr`.
- "Two sources, badge reads live / demo stream; demo never impersonates
  live" — wire-ui.md §2 merge seam.

## Notes for future iterations

- The recap pipeline's link rule is now mechanically satisfiable: recap
  lines link `wire.html#e=<id>` (post-launch domain TBD). See
  CONTENT-STRATEGY §4 recap step 3.
- If the world track ships a capture of wire.html (screenshot-safe per
  world-v19 inbox entry), a follow-up post or a gallery addition could
  pair it — check `published/` for wire shots.
