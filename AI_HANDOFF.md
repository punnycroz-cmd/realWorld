# AI_HANDOFF — Willowbrook Natura

> Written for both AI and humans. Any AI receiving this folder reads this file
> before touching code. A human can grasp the project state in 5 minutes.

## 1. Snapshot

- **Game**: Willowbrook Natura — a cozy village life simulator driven by a deep
  simulation (no scripted dialogue). Goal: "model real life as well as possible
  without trying to model everything".
- **State**: commit `5e970be` — **Phase 7A done** (customary court + guilds),
  Examiner PASS. **7B → 7E paused**; resume only on explicit user request.
- **Bundle**: `willowbrook_natura.html` (1.1MB). A rebuild must produce MD5
  `dde62db0896e882f7e4f8d655d906a13` — a different hash means something is off.
- **This folder holds**: 88 files sufficient to build + run + test. No git
  history, no long docs (SPECs, WORK_LOG, thinking-process live in the source
  repo `~/workspace/world-sim`).

## 2. Build & run

```bash
cd current-working-project
python3 scripts/build_willowbrook_natura.py   # bundles src/ + art -> willowbrook_natura.html
node devtools/node_harness.js                # full test suite (expects 288 lines, 0 FAIL)
```

- The bundler reads `willowbrook/dev/pa-*.js` (art) + `src/**/*.js` in
  `src/_order.txt` order, with the HTML template embedded in the script.
- **Never hand-edit `willowbrook_natura.html`** — edit `src/`, rebuild.
- Open `willowbrook_natura.html` directly from `file://` to play.
- The build runs an **S2 lint**: it fails if code under `src/brain/**` reads
  `v.body` directly (see §4).

## 3. Architecture (short)

- `src/` — 67 JS files: **49 game modules + 18 test files** (tests are bundled
  too, for `?test` mode). Per-module details: `src/MANIFEST.md`.
- All modules share **one script scope**: no duplicate top-level names, and do
  not reorder `_order.txt` without checking cross-module references.
- Directories follow phases: `sim/` (world, time), `entities/` (body),
  `brain/` (AI), `systems/` (economy, society, medicine...), `render/`, `ui/`,
  `data/` (roster, recipes), `tests/`.
- Art: `willowbrook/dev/pa-*.js` — **pixel art drawn by code at runtime**
  (no image files). The renderer `src/render/05_render.js` consumes the `PA.*`
  sprite tables.
- Newest modules: `systems/29a_court.js` (court), `systems/29b_guilds.js`
  (guilds), `brain/14_substrate.js` (FeelingSubstrate).

## 4. Standing constraints (violations are bugs, not style)

1. **Deterministic**: no new `Math.random()` in gameplay. Randomness goes
   through the game's seeded RNG. Tests must be reproducible.
2. **Brain boundary**: code under `src/brain/**` must NOT read `v.body`
   directly — only through `FeelingSubstrate` (`brain/14_substrate.js`).
   The build's S2 lint enforces this.
3. **The AI receives 12 textual qualities** from the substrate (never raw
   numbers). Feelings are words, not health bars.
4. **Roster of 11** (Marta, Bram, Sella, Tobin, Wren, Finn, Alden, Pip, Rowan,
   Clara, Gareth). Verify against `src/data/03_roster.js` — docs and memory
   are not evidence. Do not delete character-specific code without checking
   the code first.
5. **Canonical dead stay dead** (Marta Day 33, Tomas Day 35) — no resurrection.
6. **Test discipline**: wrap snippets in `(function(){...})()` (no repeated
   top-level `const`); never advance a world with living villagers without
   maintaining their survival in the same call; `simTick(24)` runs weather,
   fire, and wildlife too — it is not a neutral time machine; clean up temp
   villagers after tests.

## 5. Key decisions & why (do not "clean up" these)

- **Court replaced automatic punishment** (`29a_court.js`): thieves used to be
  punished instantly AND by the court (double-punish), and an acquittal could
  not undo ostracism. Now: a caught thief opens a hearing; plaintiff,
  defendant, and witnesses are the actual people involved; testimony can be
  wrong → wrongful convictions, grievances, and revenge against witnesses
  happen. `preferExile` only for recidivists, never hardcoded.
- **FeelingSubstrate** (`brain/14_substrate.js`): all body sensing goes through
  one mandatory gateway, so Phase 7 can swap the implementation without
  touching cognition code. ADR-001 explicitly refuses to promise a painless,
  retune-free swap.
- **stressResidue** ≤ `0.35 * maxStress`, recovers 8%/peaceful day (no threat,
  no loss, mood > 0). Sleep does not reset emotions.
- **Guilds** (`29b_guilds.js`): smith/baker/farmer. Apprentices learn 1.6x
  faster; guilds sell bloc to caravans at a 25% premium (5g vs 4g/unit).
  Masters Bram/Sella/Marta, seeded at init via `seedGuilds()`.
- **grief is bounded**: sorrow must never grow into a depression/PTSD system.
- **Superstition is belief, not magic**: the rain ritual raises cohesion only;
  it does not change the weather.

## 6. What's next (when the user says go)

- **7B — Inheritance & funerals**: estate → spouse → children → kin → village
  commons; disputes go to the 7A court; funerals speed grief recovery; the
  harvest festival consumes real food.
- **7C — 12-chemical substrate**: rewrite behind FeelingSubstrate (ghrelin,
  leptin, cortisol, adrenaline, dopamine, serotonin, oxytocin, substanceP,
  endorphin, adenosine, melatonin, histamine). dt-scaled production/decay,
  bounded, deterministic; 17 cross-effects; closed-loop; every parameter
  documents the scenario it was tuned for — no invented numbers.
- **7D — Needs-from-body + labour allocation + 30-day soak**: no mass death,
  resources neither explode nor collapse, water coverage ≥90% of days.
- **7E — Phase 6D debt**: 5 items (dead child-harm APIs, ostracism → local
  belief, fillRoleVacancy caller, caravan salt provenance,
  getWeeklyConsumption filter).

## 7. Known debt & non-blocking issues (don't forget)

1. An elder can double as witness (not yet excluded from selection).
2. Witness eligibility uses position at hearing time, not at event time.
3. `mistakenWho` (misremembered culprit) has no natural production setter yet.
4. One stale bundle byte-count in a checkpoint (does not affect the build).

## 8. Team workflow (mandatory for Tier-3)

1. **Robin** (dev) implements from the brief.
2. **The Examiner** audits Tier-3 independently: runs the code itself, never
   trusts summaries; PASS/FAIL verdicts with file/line evidence; never rewrites.
3. FAIL → at most **2 correction rounds** → re-audit.
4. PASS → **the lead verifies by running the code** before updating records and
   committing separately.
5. The lead is the only one who reports to the user.

## 9. Further reading (source repo `~/workspace/world-sim`)

- `SPEC_PHASE7.md` — detailed 7B→7E spec.
- `docs/thinking-process.md` Part 4 — the 9 guiding principles.
- `WORK_LOG.md` — log of recent decisions.
- `TONG_HOP_TOAN_DIEN.md` — comprehensive overview.
- `docs/adr/` — 3 ADRs (substrate, 6E scope, stress residue).

---
*Generated from commit 5e970be, 2026-09-17. When the project passes a phase,
regenerate this folder with `export_current_project.sh` and update this file.*
