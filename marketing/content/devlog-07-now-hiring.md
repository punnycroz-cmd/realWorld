# PUBLISHED — Devlog 7: "Now hiring: the block posts real jobs."

Status: PUBLISHED on `site/journal.html` (v57, dated 2026-09-24), text-only
per `templates/devlog-post.md`. Source landed at world-v31 (market layer)
+ game-v8 (the personnel office). This file records what shipped and what
it asserts.

## Claims made, and their sources

- "posted → screening → trial → filled, reposted/withdrawn" —
  `world/market.md` §1 opening lifecycle verbatim.
- "four hiring channels … gig app … institutional portal … word of mouth
  invisible to the board by construction" — market.md §2 (`board`,
  `app`, `hr_portal`, `word_of_mouth`; WOM openings never reach the board).
- "character hire filing — 500 credits, flat" — `world/requests.json`
  request matrix (`hire`: class compatible, billing flat, 500 cr) +
  game-v8 `41_game_systems_hiring.js` deferred flat-500 billing.
- "name check against the whole cast and crew" — game-v8
  `gsHireNameCheck` (cast + ambient + role words + born hires).
- "pre-payment disclosure card shows the full quote before anything is
  billed" — game-v8 `gsHireQuote` (the pre-payment disclosure card).
- "charge only lands if approved; denied applications never bill" —
  game-v8 `billOnApproval` + deferred-charge lane in `gsReviewResolve`;
  `world/moderation.json` "denied applications never bill".
- "real opening off the finite job board" — game-v8 canonical job board
  with finite openings (`gsJobBoard` mirrors `world/jobs.json`).
- "rent stays under roughly 55% of what the job pays" — game-v8 55%
  rent-to-income ceiling (hired residents); `world/jobs-housing.md` uses
  ~45% for cast pairings — the 55% figure is the hire-path rule.
- "start at the room tier" — `world/jobs-housing.md`: new hireable
  characters (500 cr slot) start at the room tier with a job.
- "hire package can only move them in through a lease that clears" —
  game-v8 hire-package move-in via the ordinary application path +
  'rehouse' request kind.
- "job-anchored routines, Friday payroll employer→character every SF
  Friday" — game-v8 job-anchored `sfSched` routines + `gsJobTick` payday.
- "On the feed … a job start, a move — as ordinary events, not spectacle"
  — game-v8 feed: hire emits `{action:'job_start'|'rehouse'|'release'}`
  feed events / cast wire entries with job detail. Deliberately avoids
  market.md's "the feed never announces a hire" phrasing — the canonical
  nuance is: no hire spectacle, but job_start/move events do post.

## Notes for future iterations

- The market layer is INTERNAL tier — the post cites only surface
  mechanics (lifecycle, channels), never churn numbers or why someone
  quit. Keep it that way on any refresh.
- `gsJobBoard` is a hand-maintained mirror of `world/jobs.json` — if the
  world track adds/removes openings, job-board claims could drift.
- If world-v32 wallet numbers ship to the site, pricing.html and this
  post's "500 credits" stay consistent (request matrix is the shared
  source).
