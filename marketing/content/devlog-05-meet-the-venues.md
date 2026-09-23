# PUBLISHED — Devlog 5: "Meet the venues."

Status: PUBLISHED on `site/journal.html` (v57, dated 2026-09-24), text-only
per `templates/devlog-post.md`. Drafted v42 against world-v16; the publish
gate re-verified every claim against world-v30 before it went live — this
file records what shipped and what it asserts.

## Claims made, and their sources

- "twenty-five businesses" — `world/businesses.json` has 26 registry
  entries, one of which is the reserved `spares` slot (no hours, no staff,
  `tier: reserved`) → 25 live venues. Updated from the draft's "twenty-two"
  after world-v30 promoted four doors.
- Venue names — all verbatim from `businesses.json`/`businesses.md` §2:
  Mudhaus Coffee, Taqueria El Farolote, Auerbach Hardware, Buy-Rite Market,
  The 600 Club, Baguette About It Bakery, Golden Hour Laundromat, The Dusty
  Spine, Marooned Records, The Musket (the four v30 additions).
- "opens/closes by the block's own clock" — `world/directory.html`
  ("The Directory") renders open/closed by world time.
- "A 2 a.m. request at a closed bakery queues or waits" — queued request
  path per `world/requests.json` + design §11; venue hours gate requests
  per `businesses.json` `hours`/`affordances`.
- "fourteen edges … supplier runs, crowd spillover, rivalry pressure,
  shared regulars, gossip routes" — `businesses.json → web` (world-v30):
  14 edges, 7 kinds (`supplies`, `spillover`, `rivalry`, `shared_clientele`,
  `parts_run`, `gossip_route`, `loan`). Wording "the simulation may notice
  and is never obliged to act on" restates the web doc's
  "conditions, never obligations."
- "one edge is deliberately kept off public surfaces" — the `loan` edge
  carries `secret: true`; world-v30 merge notes: secret-flagged edges must
  never appear on public surfaces; `directory.html` WEB block redacts
  non-public-clearance edges.
- Naming law — `world/businesses.md` (parody businesses, real streets/
  landmarks) + real-business screening per `world/moderation.json`
  (form suggests the parody name).

## Notes for future iterations

- If world promotes the two spares hooks (The Watchbird, Café Cometa) or
  mints more doors, the "twenty-five" count and the venue list go stale —
  re-count `businesses.json` minus `tier: reserved` entries at next sweep.
- The `web` edge count (14) will grow; the post says "fourteen" verbatim —
  update or genericize if the registry drifts before launch.
- `world/directory.html` is screenshot-safe internal tooling — if the
  world/art tracks publish a venue/directory capture, this post could
  carry a real UI shot (check `published/` at next refresh).
