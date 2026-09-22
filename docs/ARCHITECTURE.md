# ARCHITECTURE.md — Encapsulation Law of Willowbrook Natura

Status: **binding**. These rules are enforced by
`scripts/build_willowbrook_natura.py` where marked **[lint]** and by review
elsewhere. A violation found in review is a P1-class defect even when the
build is green.

Context: `src/` modules are concatenated in `src/_order.txt` order into ONE
`<script>` block. There is no module system, no imports, no scoping between
files — every top-level name is global, and every module can see and mutate
every other module's state. Encapsulation here is law, not syntax.

## 1. Module boundaries

| Area | Owns | May touch | May NOT touch |
|---|---|---|---|
| `sim/` | world clock, weather, terrain, mainloop, events, save | all areas | UI/render details |
| `entities/` | bodies, pregnancy, wildlife, husbandry | `sim/` world state | brain internals |
| `systems/` | verbs, economy, social, medical, construction, food, caravan, ownership, court, guilds | `sim/`, `entities/` state via public fields | substrate internals; `v.body` bypasses are banned the same as brain |
| `brain/` | rule AI, perception, intent, substrate, knowledge, utility | villager body state **only** through the substrate allowlist | direct `v.body` access **[lint: substrate]** except `brain/14_substrate.js` itself and the two grandfathered lines in `brain/09_bridge.js` |
| `render/` | drawing only | read-only world state | writing sim state |
| `ui/` | HUD, controls | DOM + read world state | sim rules |
| `data/` | static rosters, recipes | nothing mutable | runtime state |
| `tests/` | autotests | everything (white-box) | being referenced by production — see §3 |

The substrate rule restated: brain code reads/writes physiology exclusively
through `brain/14_substrate.js` helpers; `v.body`, `v["body"]`, and
`v['body']` are build-failing tokens anywhere else under `src/brain/**`.

## 2. Composition: the registry is the only sanctioned extension point

New behavior is added ONLY via the choke points in `sim/00_core.js`:

- `registerSimTick(fn)` — world/systems work per sim tick (drained at
  `sim/06_mainloop.js` after villager ticks).
- `registerBodyTick(fn)` — per-villager physiology work (drained inside
  `bodyTick`, `entities/02_body.js`).
- `registerVerbHandler(verb, fn)` — plan-verb dispatch (consumed by the
  `planTick` default case, `systems/12c_actions.js`).

**[lint: no-new-wraps]** No module may reassign `planTick`, `simTick`,
`bodyTick`, or `updateVillagerAI` (`NAME = function...` / `NAME = otherFn` at
top level). The following wraps predate the registry and are grandfathered —
do not add to this list, and migrate a site only when work touches it:

| target | legacy wrap sites (file) |
|---|---|
| `planTick` | `systems/13b_economy.js`, `systems/14f_wiring.js`, `systems/15f_wiring.js`, `systems/16a_recipes.js`, `systems/17a_buildings.js`, `systems/20_social_life.js`, `systems/21a_ownership.js`, `brain/knowledge.js`, `brain/utility.js` |
| `simTick` | `sim/12d_world.js`, `sim/22a_save.js`, `systems/14f_wiring.js`, `systems/15f_wiring.js`, `systems/17a_buildings.js`, `systems/21a_ownership.js` |
| `bodyTick` | `sim/12a_events.js`, `brain/knowledge.js`, `systems/14f_wiring.js`, `systems/15a_food.js`, `systems/17a_buildings.js` |
| `updateVillagerAI` | `sim/12a_events.js`, `systems/14f_wiring.js`, `systems/15f_wiring.js`, `brain/utility.js` (outright replacement with `updateVillagerBrain`) |

Same rule, enforced by review only (not yet linted): `initVillagers`,
`updateHUD`, `renderWorld`, `socialTick` — existing wraps are legacy
(`sim/12a_events.js`, `brain/utility.js`, `brain/knowledge.js`,
`brain/22b_why.js`, `systems/13b_economy.js`, `systems/14f_wiring.js`,
`systems/15f_wiring.js`, `systems/15d_friction.js`,
`systems/20_social_life.js`); new ones are banned.

Why: stacked wrappers are invisible, order-dependent, and each layer can
short-circuit. The "two stacked raw-meat sickness paths" defect (a 15a hook
AND a 14f path both firing on one meal, ~54% vs the documented 35%) is what
an unregulated onion produces.

## 3. No production → test references **[lint: no-test-refs]**

Production modules (everything not under `src/tests/`) must never reference
an identifier that is only defined under `src/tests/`. Tests are excluded
from the shipped `willowbrook_natura.html`; a production reference to a
test-only name either breaks the release outright (the `boot` hook that
lived only in `tests/15_autotest.js` — shipped game dead on load) or makes
test code load-bearing (`mkCaravanMember` calling `mkTestV13`). If production
needs a test helper, move the helper into `data/` or `systems/` and keep the
test a thin wrapper.

## 4. No duplicate or shadowed shared names **[lint: no-duplicates]**

- A top-level `function NAME` may be defined in exactly ONE `src/` module.
  All modules share one scope; a second definition silently shadows the
  first (`hashString18` precedent — it "worked" only because the two bodies
  were identical).
- Do not redeclare a global (`const`/`let`/`var`) in two modules — it throws
  at parse time in strict mode, i.e. it kills the whole page, not just your
  feature.
- Do not re-declare a shared helper name locally inside a function
  (`const distCells = ...` inside `scoreCandidateAction` shadowing the global
  is the precedent): rename the local or use the global.

## 5. No name-keyed behavior

Behavior must never be keyed on `v.name === '...'`. Villagers are identified
by traits, ids, and roster data — names are cosmetic and renameable, and a
name-check silently breaks on renames/births (the Gareth regression).
Name-as-key is allowed only for lookups: roster seeding, `shopkeeper()`/
`innkeeper()` resolution, party-exclusion compares. If a check decides what
a villager DOES, it goes through traits (`isBrave(v)` is the canonical
example: `traits['brave'] || personality.brave > 1.2`).

## 6. `_order.txt` is load-bearing

Bundle order changes behavior: later modules wrap earlier ones, and globals
are only defined after their module's position. Rules:

- New modules go at the END of `_order.txt` unless they only register into
  SIM_TICKS/BODY_TICKS/VERB_HANDLERS (registration order among registered
  functions is drain order — still append at end for predictability).
- Never reorder existing lines casually; if you must, treat it as a
  behavioral change: rebuild, run `node devtools/node_harness.js` and the
  phase probe before considering it done.
- The boot hook `sim/99_boot_hook.js` must remain last — it is the release
  bundle's only `DOMContentLoaded → boot` trigger.

## 7. Save-schema rule

- Changes to `collectSaveState`/`applySaveState` are **additive only**: new
  keys, optional on load. Old saves must load clean with no migration code.
- Every new top-level registry (`GUILDS`, `COURT_RECORDS`, economy demand
  state…) must be serialized AND covered by `worldHash()` — a registry that
  save/load silently drops is a P1 (the Phase-7A hole: `v.guild` survived,
  `GUILDS.members` did not, bonuses died quietly).
- Never remove a serialized key without an explicit migration path recorded
  in `WORK_LOG.md`.

## 8. How to add a feature — checklist

1. Pick the owning area per §1. Put the module there; append it to the END
   of `src/_order.txt`.
2. Attach behavior ONLY through `registerSimTick` / `registerBodyTick` /
   `registerVerbHandler`. Do not reassign any tick/dispatch function.
3. All randomness through `srand()`/`srandInt()`/`srandPick()` — no
   `Math.random()` outside cosmetic render.
4. Brain-side physiology goes through substrate helpers; no `v.body` tokens
   in `src/brain/**`.
5. No references to identifiers defined under `src/tests/`; no new top-level
   names that collide with any existing `function`/`const`/`let`/`var`.
6. No `v.name ===` driving behavior — express it as a trait/flag on roster
   data instead.
7. If the feature adds a top-level mutable registry, serialize it in
   `collectSaveState`, restore it in `applySaveState` (optional key), and
   include it in `worldHash()`.
8. Villagers act on beliefs/senses/memory, not on ground truth (Principle
   5, thinking-process Part 4). A feature reachable only by injecting state
   in tests is dead gameplay — prove a real production path writes every
   field you read.
9. Verify: `python3 scripts/build_willowbrook_natura.py` (all lints green),
   `node devtools/node_harness.js` → 0 FAIL, relevant `devtools/probe_*` →
   all pass. Update `src/MANIFEST.md` and `WORK_LOG.md`.
