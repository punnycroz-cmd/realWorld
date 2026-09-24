# DRAFT → PUBLISHED — Devlog 15: "The bench takes requests."

Status: PUBLISHED on `site/journal.html` (v147, dated 2026-09-24),
text-only per the template. Accuracy checklist re-run at publish — pull
protocol and coverage reads verified against `world/crowd.json` (version
99, +`pull_protocol` +`coverage`) + `world/crowd-sim.md` §§26–28
(world-v99, "the bench layer"), internal demo `world/crowd.html`
("The bench — pulled & covered" panel):

- **Pull protocol** — a request can borrow a named ambient as a co-star:
  15–90 min window, ≤3 pulls per ambient per day, ≤2 concurrent on the
  block, ≥60 min cooldown. Bounds: at most one zone step, only toward a
  zone the request already controls; never cross-map, never into "home".
  Pullable only from public/staffed states (serve/work/idle/sit/rest/
  chat/walk) — never from sleep, never from home, never mid-transit.
  Role-bound, not person-bound — the file's own example: "Reyes can be
  borrowed as 'a barista at the counter', never as 'Reyes running an
  errand'". Enters the §11 request pipeline at the same step as a
  resource claim; exclusive-class only when the ask needs sole attention.
  Minors (A04, A20) never pullable — a request naming them resolves as a
  decline.
- **Wire-invisible** — "no event type, no attribution; spectators see
  the coverage read, not the loan" (quoted).
- **Coverage** — per-ambient absence surface keyed A01–A20, four kinds:
  `understudy` (an extra covers the post — "a second apron steps up from
  the back"), `sign` (the fruit stand's chalk reads "back in 10" — "the
  stand can't run unattended and won't pretend to"), `open` (the post
  just empties — "the bench keeps her folded section"), `pack` (minors —
  "nothing moves for a request"). All `read` strings quoted verbatim.

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v99</p>
  <h2>The bench takes requests.</h2>
  <p>
    The twenty ambients are the block's bench — the barista, the dog
    walker, the fruit-stand keeper — and the bench is now borrowable. A
    request can name an ambient as a co-star, and the pull borrows their
    presence inside the routine they already have: fifteen to ninety
    minutes, at most three pulls per ambient per day, at most two
    borrowed on the block at once, an hour of cooldown between loans. The
    pull may move them one zone step and only toward a zone the request
    already controls — never across the map, never into their home. It
    enters the request pipeline at the same step as any other claim,
    exclusive only when the ask genuinely needs sole attention.
  </p>
  <p>
    The bounds are the interesting part. A pull asks the role, not the
    person — the spec's own example is that Reyes can be borrowed as "a
    barista at the counter," never as "Reyes running an errand." An
    ambient is only pullable from a public or staffed state — never from
    sleep, never from home, never mid-transit. And the minors are simply
    never pullable: a request that names one resolves as a decline, and
    their rows never enter the pool. Agency, not control, applies to the
    bench the same as the mains.
  </p>
  <p>
    What a spectator sees is not the loan but its wake. Pulls are
    wire-invisible — no event type, no attribution. Instead each ambient
    carries a coverage read, the honest absence the block shows while
    they're borrowed: an understudy where one exists ("a second apron
    steps up from the back"), a sign where the post can't run unattended
    (the fruit stand's chalk reads "back in 10"), or just the open space
    where nothing covers ("the bench keeps her folded section"). The feed
    never says someone was borrowed; the block just reads like a place
    where people sometimes get called away.
  </p>
  <p class="muted">
    Sources: the pull protocol and coverage table are the world track's
    <code>world/crowd.json</code> (v99) + <code>crowd-sim.md</code> §§26–28,
    demoed internally in <code>world/crowd.html</code> ("The bench —
    pulled &amp; covered"). Windows, caps, bounds, and coverage reads are
    quoted from the file itself.
  </p>
</article>
```
