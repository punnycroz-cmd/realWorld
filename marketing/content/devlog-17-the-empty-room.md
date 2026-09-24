# DRAFT → PUBLISHED — Devlog 17: "Nobody performs for an empty room."

Status: PUBLISHED on `site/journal.html` (v162, dated 2026-09-24),
text-only per the template. Accuracy checklist re-run at publish — all
four blocks verified against `world/thinai.json` (v111,
+`observation_tiers` +`lazy_thin` +`witness_record` +`compute_soak`) +
`world/thin-ai.md` §§47–52 (world-v111, "the unobserved tick"),
internal demo `world/thinai.html` (Understudy v8). Framing note: this
post describes the *written contract and its internal demo* — the
tier/lazy split is specified for the tick driver, and the post says so.
No spectator-visible behavior is claimed beyond what the demo shows:

- **Observation tiers** — per pawn, driven by spectator attention:
  `watched` (camera/venue view or live feed/ledger query → thin ticks
  per game-minute), `shadowed` (recently watched → ticks at cell edges
  only), `dark` (unwatched → no per-minute tick, resolves lazily on
  next observation). "Tier follows attention, never population — 20
  ambients dark cost ~nothing." Transitions: watched→shadowed on
  attention loss; shadowed→dark at the first unwatched cell edge;
  dark→watched resolves at the next seam, never mid-cell. Tiers are
  internal only — "no badge, no feed line, no spectator tell".
- **Lazy-thin** — a dark pawn's place + cell + needs are a closed-form
  function of resolved routine rows and elapsed minutes: "the state a
  watcher lands on is identical to what continuous ticking would have
  produced". Eager exceptions: scheduled obligations (wages, autopays,
  co-star windows) settle at their minute regardless; reflex-relevant
  conditions (rain, dusk) still evaluate at their minute. Nevers: a
  catch-up pop, a skipped obligation, re-simulation on return —
  "the past was already correct". Claim: "observational equivalence,
  not approximation — if a watcher could tell, the layer failed".
- **Witness record** — mode-blind seen-fact schema {char, place, doing,
  posture?, at_min, day}: "only what a camera could show". Never:
  intent, mood inference, seed-adjacent anything, interiority. Identical
  schema for thin/degraded/full/possessed — "a watcher never records a
  mode, so the record can't betray the seam". One record per pawn per
  place per hour. Feeds observation/rumor channels at most as
  "X was at Y" — never "X seemed", never a storyline.
- **Compute soak** — thin_min splits into watched_min (per-minute) /
  shadowed_min (per-edge) / dark_min (~zero); surfaces on
  `gsComputeStats()` if game-systems implements the tier tick —
  internal/owner tooling, never a spectator surface.

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v111</p>
  <h2>Nobody performs for an empty room.</h2>
  <p>
    The honest version of a living block isn't "everyone simulates all
    the time" — it's that nobody can tell the difference. The
    Understudy contract now spells out the tiers the spec runs on:
    watched (a camera, a venue view, a live feed or ledger query
    touching the pawn) ticks per game-minute; shadowed — recently
    watched, still warm — ticks at cell edges only; dark is unwatched
    entirely, with no per-minute tick at all. Tier follows attention,
    never population: twenty ambients gone dark cost about nothing, no
    matter how many exist.
  </p>
  <p>
    Dark doesn't mean paused. A dark pawn's state is a closed-form
    function of its resolved routine and the elapsed minutes — the spec
    calls it observational equivalence, not approximation: "if a watcher
    could tell, the layer failed." The things that must be punctual stay
    punctual — wages, autopays, co-star windows settle at their minute
    whether anyone is looking or not, and reflex conditions like rain
    and dusk still evaluate on time for the coverage contract. Never a
    catch-up pop, never a skipped obligation, never a re-simulation on
    return: the past was already correct.
  </p>
  <p>
    Watching, meanwhile, is now a defined act. What an observer may
    record is a seen-fact — who, where, doing, when — "only what a
    camera could show". The schema is mode-blind: identical whether the
    pawn is thin, degraded, full, or possessed, so the record can't
    betray the seam. It feeds the observation and rumor channels at
    most as "X was at Y" — never "X seemed", never a storyline. The
    tiers themselves stay invisible: no badge, no feed line, no
    spectator tell.
  </p>
  <p class="muted">
    Sources: the tier, lazy-resolve, witness, and cost-split contracts
    are the world track's <code>world/thinai.json</code> (v111) +
    <code>thin-ai.md</code> §§47–52, demoed internally in
    <code>world/thinai.html</code> (Understudy v8). This is the written
    contract and its demo — the tier split is specified for the sim's
    tick driver and reported on owner tooling, not yet a spectator
    surface. Quotes are from the file itself.
  </p>
</article>
```
