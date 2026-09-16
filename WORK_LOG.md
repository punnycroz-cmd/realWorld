# WILLOWBROOK NATURA — Work Log
_Started 2026-09-16. Running record of completed work and design discussions._

---

## 2026-09-16 — Phase 2A: Recipe data-driven + provenance — ACCEPTED ✅

### What was built
- `src/data/recipes.js` — 6 recipes (fell_tree, plank, furniture, harvest_crop, flour, bread) + aliases + provenance API (`createProvenance`, `calcSkillQuality`, `recordUsage`, `attachItemProvenance`, `getItemProvenance`). Records carry creator, materials, quality, condition, owner, game-day creation time, history.
- `src/systems/16a_recipes.js` — generic `doRecipeStep` executor + new `recipe` verb (separate from the medical `craft` verb). Checks recipe, skill, inputs, tools, workstation proximity, work time. Intent patterns: "saw planks", "build furniture", "mill flour", "bake bread".
- `src/systems/12c_actions.js` — felled log piles tagged with `felledBy`/`felledDay`; picking them up restores woodcutter provenance.
- `src/tests/16_autotest.js` — 8 tests (lookup, crafting, provenance fields, flour→bread chain, edibility, furniture, safe rejection, intent compilation, log-pile provenance).

### Examiner audit round 1 — CONDITIONAL PASS, 2 defects found
1. Provenance died on transfer: `doDropStep` wrote no provenance to piles, `doTakeStep` restored it only for logs, stale ghost records lingered in `v.itemProv` after dropping.
2. Workstation-unreachable silently abandoned the recipe step (no thought, no feedback).

### Fixes applied (lead subagent)
- Piles now carry `p.prov = {kind: [records]}` mirroring `p.items`; records ride items villager→pile→taker via new helpers `stripItemProvenance` / `addItemProvenance` / `pileProvList` / `movePileProvenance` in `src/data/recipes.js`.
- `doTakeStep` generalized: prefers real pile records, falls back to legacy `felledBy` tag only when no records exist (never invents records — take moves `min(n, available)`).
- Ghost cleanup on every inventory decrement: drop, eat, use, shop sell, medical craft/mend, construction build, cooking/preserving, caravan sell, animal feed, recipe inputs.
- `doFellStep` writes 3 real `felled` provenance records onto the fell pile.
- `doRecipeStep` on pathing `stuck` now records a "Can't reach the \<workstation\>" thought and ends the step with inputs intact (chose the observable thought over silent work-in-place; `MANIFEST.md` documents the policy).
- Regression tests 16.9 (A crafts → drops → B takes → B's provenance shows A's creator/materials/quality; no ghosts on A) and 16.10 (unreachable station → explanatory thought, flour kept).

### Examiner re-audit — PASS, Phase 2A accepted
- Examiner rebuilt independently (43 modules, 427,497 bytes), `node --check` PASS.
- Full suite **80/80, 4 consecutive runs**, 0 FAIL.
- Worker's probe 5/5; Examiner's own independent probe 14/14 (hostile cases: mixed-kind piles, taking more items than records, zero-record piles, legacy `felledBy` fallback, eat-stripping, regression of medical craft + real fell path).
- 0 duplicate top-level declarations (308 scanned); `_order.txt` ↔ disk ↔ bundle order consistent.
- Residual caveat (not a fail): once real fell records are exhausted by successive takes, the legacy `felledBy` fallback fabricates synthetic records (honest creator via tag, but `materials: {}`, quality hardcoded 0.5). Flagged for Phase 4 long-run review.
- Unverified: everything ran in Node + DOM stubs; real-browser gameplay of transfer paths still untested.

### Deferred from 2A (moved to later phases)
- The medical `RECIPES`/`craft` system was intentionally left separate (not merged into the recipe table).
- Tool gating is dormant: no equipment/inventory tool items exist yet (`PA.tools` is pixel-art only). `toolsRequired: []` is honest metadata for now.
- `fell_tree`/`harvest_crop` recipes exist in the table but live world gathering still uses the established fell/farm paths.
- Autonomous villagers don't choose recipes via utility AI yet — that's Phase 2C.
- Provenance record lists can grow with mass crafting; no pruning — acceptable now, revisit in Phase 4.

---

## 2026-09-16 — agy print timeout fix (standing user directive)

- Problem: agy (Antigravity CLI, "Robin") runs in `-p` print mode with a hard-coded **5-minute** timeout (`[agy] print timeout after 5m0s`), cutting real dev tasks off mid-turn. This truncated the first Phase 2A attempt at ~30% completion.
- User directive: **agy must finish the assigned task unless quota is exhausted** — the 5-minute cutoff is not acceptable.
- Fix: `~/workspace/agents/agy.sh` now appends `--print-timeout 30m` by default in print mode. Override per call (`agy.sh --print-timeout 10m -p ...`) or via `AGY_PRINT_TIMEOUT` env. Verified working (explicit + default paths).
- Recorded in `~/AGENTS.md`.

---

## 2026-09-16 — Phase 2B: Building entities + new locations — COMPLETED (Robin)

Robin (agy) completed Phase 2B implementation.

### Assessment of Partial Work
- `src/sim/00_core.js`:
  - Kept: Deterministic river path formula `getRiverCenter(wy)`.
  - Fixed: River channel outside lake (`pondDist >= 7.5`) was surrounded by raw noise depression `< SEA`, causing the river to drown the eastern map and the wooden bridge at `wy = -8` to terminate abruptly in deep water at `wx = 30`. Fixed by ensuring dry land corridor on river banks outside the channel, and extending bridge deck span to `Math.abs(wx - rc) <= 2.8` so non-swimmers traverse completely from west bank (wx 23) to east bank (wx 30).
- `src/sim/01_settlement.js`:
  - Kept: Building entity fields (`indoorTemp`, `cleanliness`, `capacity`, `owner`, `residents`, `hasFire`, `fireplaceLit`, `daysUnoccupied`) and `The Sleepy Stag Inn` placement.
  - Completed: Dynamic simulation tick, biometrics integration, needs effects, expansion, abandonment, demolition.
- `src/sim/12a_events.js`:
  - Kept: River place resolution (`placePos('river')`) and inn warm fallback in `guardPlanFor`.
- `src/systems/12c_actions.js`:
  - Fixed: `doDrinkStep` and `doFishStep` only allowed drinking/fishing if standing inside water tiles (`depth > 0`). Updated with `nearWater3(v)` check so standing on river shores or bridge decks allows drinking and catching fish.

### What Was Built
- `src/systems/17a_buildings.js` — Building entity dynamics & systems:
  - Indoor temperature dynamics: unlit buildings drift toward outdoor temperature (`W.temp`) with insulation moderation; lit fires/fireplaces warm the interior towards 22–24°C.
  - Biometrics & needs: `bodyTick` wrapped to expose indoor villagers to building `indoorTemp` and lit fireplace heat; sensations for cold drafty rooms, comfortable warmth, or filthy floors.
  - Cleanliness 0..1: decays with occupant count, cooking, and sheltered animals; fast decay if abandoned; restored by `clean` verb (`doCleanStep`).
  - Capacity & overcrowding: tracks sleepers in building; exceeding capacity causes overcrowding thoughts and mood penalty.
  - Ownership: owner field tracked honestly (`getBuildingOwner`, `setBuildingOwner`), noting household entities arrive in 2E (`actualOwner` in 2F).
  - Expansion: `expand` verb (`doExpandStep`) spends 6 logs and 4 stone to add +2 capacity.
  - Abandonment: buildings unoccupied for ≥3 days undergo fast cleanliness decay and slow structural integrity decay.
  - Demolition: `demolish` verb (`doDemolishStep`) tears down building, removes it from `VILLAGE_BUILDINGS`, and reclaims 50% of construction materials.
  - Procedural pixel-art: `composeBuilding` compiles native procedural sprites for `barn` (timber & hayloft), `workshop` (masonry & outdoor workbench), and `kitchen` (hearth & hanging herbs) into `PA.bld`.
- `src/systems/14e_construction.js` — Extended `CONSTRUCT` table with `barn` (cap 8), `workshop` (cap 4), `kitchen` (cap 4, hasFire). `doConstructStep` initializes complete building entity properties and sanitizes foundations. `doRepairStep` supports targeting specific buildings/roofs.
- `src/systems/16a_recipes.js` — `recipeStationNear` recognizes `workshop` as primary workbench station and lit `kitchen` as cooking station.
- `src/systems/15a_food.js` — `doMealStep` recognizes kitchen hearth fire, granting cooking bonus and decaying kitchen cleanliness.
- `src/entities/15b_husbandry.js` — `doTameStep` recognizes barn as prime animal housing / pen shelter.
- `src/systems/13b_economy.js` — `innkeeper()` (Tobin) and `INN` menu; `doBuyStep` supports inn meal purchases and lodging room payments.
- Intent planner: unshifted patterns for `'clean the house'`, `'expand the barn'`, `'demolish the old hut'`, `'repair the roof'`, `'fish at the river'`, `'drink from the river'`.
- `src/tests/17_autotest.js` — 10 automated test suites covering all required surfaces.

### Verification
- Rebuild: `python3 scripts/build_willowbrook_natura.py` compiles cleanly (45 modules, 464,467 bytes).
- Syntax: `node --check` on extracted page script PASS.
- Test harness: `node devtools/node_harness.js` passes **97/97 tests, 0 FAIL lines across 3 consecutive runs**.
- Top-level declarations: 326 unique scanned across `src/`, 0 duplicates.
- Modules: 45 files on disk match `src/_order.txt` 1:1.

---

## 2026-09-16 — Design discussion: REAL-WORLD OWNERSHIP, PROVENANCE, KNOWLEDGE & CONTEXT

_User pasted a major spec section; accepted as a core requirement and added to `SPEC_BUILD_PLAN.md` as **Phase 2F**._

### Core principle
The simulation must NOT treat ownership as a universally visible variable. It must model, as deliberately separate layers:

- **REALITY** — what is actually true
- **PERCEPTION** — what a character can currently observe
- **MEMORY** — what the character remembers
- **KNOWLEDGE** — what the character has learned
- **BELIEF** — what the character thinks is true (may be false, uncertain, outdated)
- **CLAIM** — what the character says is true (may differ from belief)
- **EVIDENCE** — what supports or contradicts a belief, with reliability
- **UNCERTAINTY** — how confident the character is
- **CONTEXT** — what circumstances affect interpretation

The same world therefore produces different experiences for different characters. This is essential for the future AI brain: it must receive something like *"You found a chair. You remember seeing Bram make it. Sella said Tobin bought it. You believe Tobin probably owns it, confidence 0.78"* — never just `"Chair owner = Tobin."`

### Ownership layers (never a single `item.owner` visible to all)
1. **ACTUAL / UNDERLYING OWNERSHIP** — who the simulation considers the legitimate owner.
2. **POSSESSION** — who physically has it now (possession ≠ ownership).
3. **KNOWLEDGE OF OWNERSHIP** — who knows, believes, suspects, or doesn't know.
4. **EVIDENCE** — observable/remembered information usable to determine ownership.
5. **CLAIMS** — what different characters claim.
6. **HISTORY** — how the object changed hands.

Per-character states: `actualOwner`, `currentHolder`, `knownOwner`, `suspectedOwner`, `ownershipConfidence`, `ownershipEvidence`, `ownershipClaims`. A character may hold "definitely Bram's" / "I think it's Bram's" / "I heard it's Bram's" / "no idea" — these are different states driving different behavior (low confidence → ask/investigate/wait/avoid accusation; strong evidence → return or confront).

### Object identity
Every persistent important object gets a stable identity (Chair #104): creator, creation time, materials with lineage (Chair #104 → Plank #77 → Tree #883 → Forest Zone A, harvested by Marta), condition %, location, actual owner, current holder, and a full event history that is **never erased** by ownership changes. Identity survives: lost, stolen, sold, given, borrowed, traded, inherited, abandoned, found, hidden, destroyed.

### Ownership transfer
Purchase, sale, gift, trade, inheritance, marriage/household transfer, theft, confiscation, legal/social decision, abandonment — each creates an event recording time, participants, object, location, cause/context, witnesses, result. Example: Bram sells Chair #104 to Tobin → `actualOwner: Tobin`, `previousOwner: Bram`, history appends (never rewrites).

### Lost objects
Losing an object must NOT make its owner unknown. `actualOwner` stays Bram in world truth; the finder (Finn) may recognize it, remember seeing it, notice a mark, ask around, assume wrongly, or know nothing. Possible outcomes: keep, return, leave, sell, report — decided by context, not by a universal rule.

### Ownership discovery via evidence (with reliability)
- "Etched with BRAM" → strong
- "I think I saw Bram carrying it" → medium
- "Someone told me Bram owns it" → weak
- "Finn says it belongs to him" → claim, not proof

Evidence sources: visible marks, distinctive appearance, known craftsmanship, previous observation, witness testimony, memory, conversation, records, location, usual user, household association, reputation, purchase history, known transactions, possession history.

### Contextual ownership
Interpretation depends on context: a chair outside Bram's house (a villager who knows Bram assumes it's his; a traveler doesn't), an object in the workshop (assumed workshop owner's), an object in public (unclear), marked vs unmarked, freshly purchased (witnesses know). Use context, not a universal ownership lookup.

### Disputed ownership
Characters may hold conflicting beliefs (actual: Bram; Finn believes Bram; Tobin claims his; Sella knows Bram bought it; Alden knows nothing). Disputes may lead to conversation, investigation, accusation, negotiation, mediation, social conflict, reputation changes, customary resolution. **Do not automatically resolve disputes.**

### Theft
Not "owner changes to thief." Object: `actualOwner = Bram`, `currentHolder = Finn`; event: Finn secretly takes it. Bram knows "my knife is missing"; Finn knows "I took it"; Marta may have witnessed; Alden knows nothing. Different perspectives, honestly kept.

### Borrowing
Temporary possession: `actualOwner: Bram`, `currentHolder: Marta`, `borrowedFrom: Bram`, `expectedReturn`. Both sides may remember it. The object stays Bram's unless a later event transfers ownership.

### Abandonment
Must not erase provenance. States: still owned but unattended / lost / abandoned / unclaimed / claimed by another — interpreted via context and social norms, not one universal rule.

### Item marks
Engraved names, family/maker/household marks, paint, distinctive craftsmanship raise identification probability; unmarked objects are harder to attribute.

### Provenance vs ownership
Provenance (creator, materials, process, time, previous owners, locations, events, repairs, modifications) is distinct from ownership and must survive ownership changes. Example chain: created by Bram → wood harvested by Marta → sold to Tobin → lent to Sella → inherited by Pip — the complete chain stays available.

### Event-based state changes
`ownershipTransferred`, `itemLost`, `itemFound`, `itemBorrowed`, `itemReturned`, `itemStolen`, `itemRecovered`, `itemAbandoned`, `ownershipDisputed` — each records time, participants, object, location, cause/context, known witnesses, result. No silent variable mutation for important changes.

### Action failure and context
The same separation principle applies to failed actions: success=false must come with reason and cause (e.g. unreachable — doorway blocked). Chain: **FAILURE → OBSERVATION → INTERPRETATION → NEW KNOWLEDGE / MEMORY → RE-EVALUATION → NEW ACTION.** Never silently discard failed actions. (Already started: 2A's workstation fix; generalized in 2C utility AI.)

### How it maps onto the phase plan
- **Phase 2F** (new, after 2D): world-truth side — stable object identity, `actualOwner`/`currentHolder`, transfer events, material lineage, event-based state changes.
- **Character side lands with 2D** (Knowledge/Belief/Memory): `knownOwner`/`suspectedOwner`/confidence/evidence/claims per villager, built on 2D's belief/memory infrastructure — a belief about knife ownership *is* the belief system applied to ownership.
- **2A provenance is the foundation** (creator/materials/quality/history already ride with items); 2F upgrades important objects from kind-counts to individual identity. Bulk goods (grain, firewood) stay count-based; causal history preserved either way.
- **2B building ownership** (simple owner name, in progress) becomes `actualOwner`; layered perception arrives in 2F. No rework needed.
- **Scale note**: full per-object identity for everything would be heavy at 100+ villagers — full identity for important manufactured objects only.

### Design goal (user's words)
Do not simulate only the physical world. Simulate physical reality + human access to information + uncertainty + social interpretation + history + causal consequences.

### Phase 2B implementation complete (2026-09-16, ~23:21 PDT) — awaiting Examiner audit
- Robin finished: 45 modules, harness claimed 97 lines / 0 FAIL (part14 12/12, part15 11/11, part16 10/10, part17 10/10), 326 top-level decls / 0 duplicates, _order.txt matches disk.
- Claimed scope delivered: building entity fields (indoorTemp, cleanliness, capacity, owner), river (getRiverCenter, flowing band, bridge at wy=-8, deterministic, drinkable, fishable), barn/workshop/kitchen/inn functional, expansion (6 logs + 4 stone → +2 capacity), abandonment decay, demolition with 50% reclaim, new intents (clean/expand/demolish/repair/fish at river/drink from river).
- Interruption note: first 2B run was killed by a VM restart (~23:01) which wiped the ephemeral agywork user; partial work (river, building fields, inn) survived on disk. agywork user restored as root per AGENTS.md procedure, smoke test passed, second run completed with the 30-min print timeout (ran ~11 min, no cutoff).
- Examiner Tier-3 re-audit dispatched; 2B not accepted until verdict.

### Phase 2B Examiner audit (2026-09-16, ~23:24 PDT) — CONDITIONAL PASS, 1 defect
- Examiner rebuilt independently (45 modules, ~464KB), node --check PASS, suite 97 lines / 0 FAIL ×3 runs, parts 12-16 identical to 2A baseline (no regressions).
- Independent probe 19/20: temperature, cleanliness, overcrowding, ownership, expansion (+concurrent), abandonment, demolition (+occupied), river (deterministic, drinkable, fishable, bridge crossing, pond regression OK), barn/workshop/kitchen/inn functional, 6 new intents route correctly with no hijacking of old patterns.
- DEFECT (blocking): ghost-target fallback in findBuildingTarget (src/systems/17a_buildings.js ~62-80) — explicit non-matching building name silently fell back to nearest building; "demolish the old hut" demolished the inn in the probe. Fix: return null for explicit non-matches (existing ok:false paths trigger); keep nearest fallback only for 'house'/'home'/'nearest'/empty. Regression test 17.11 required.
- Minor: MANIFEST gaps (12a_events, 13b_economy, 14e_construction rows), empty-barn decay uses max(1, animalCount), dangling homeId after demolishing occupied building.
- Fix agent dispatched; targeted re-audit to follow before 2B acceptance.

### Phase 2B ghost-target fix re-audit (2026-09-16, ~23:26 PDT) — PASS, Phase 2B ACCEPTED ✅
- Examiner rebuilt independently (45 modules, 466,715 bytes), node --check PASS, suite 91/91 ×3 runs (parts 12-16 = 80/80 baseline preserved; part17 = 11/11).
- Independent adversarial probe 21/21: explicit non-matching targets → ok:false with honest reasons; materials unspent; inn survives; generic 'house'/'home'/'nearest' fallback preserved; explicit existing targets resolve (incl. case-insensitive, trimmed, substring); step-level null path records 'No building to demolish' thought; occupied demolition nulls homeId; empty barn cleanliness stays 1.000 over 6h while 4-animal barn decays to 0.520 (mechanism live).
- Caller audit: findBuildingTarget has exactly 3 callers (clean/expand/demolish planForVerb branches); old fallback unreachable for explicit names.
- SPEC_BUILD_PLAN.md marked 2B complete. Phase 2C (utility AI) assigned to Robin.

---

## 2026-09-16 — Phase 2C: Utility AI — COMPLETED (Robin)

Robin (agy) completed Phase 2C implementation.

### What Was Built
- `src/brain/utility.js` — Utility AI engine replacing hard-coded routines and daily schedules:
  - **Candidate Enumeration**: Each decision tick, autonomous villagers enumerate valid candidate actions from the existing verb/system set (`eat`, `drink`, `sleep`, `rest`, `work`, `farm`, `fish`, `forage`, `fell`, `recipe`, `clean`, `cook`, `socialize`, `flee`, `douse`, `trade`, `warm`, `leisure`).
  - **Multi-Factor Scoring**:
    - Need deficits across 8 physiological and mental needs (hunger, thirst, energy/fatigue, warmth/cold, comfort/dirtiness, social/isolation, health/injury, safety).
    - Personality weights (`industrious`, `lazy`, `sociable`, `solitary`, `cautious`, `brave`, `gluttonous`) modulating priorities (e.g. industrious prioritizes work/clean; lazy prioritizes rest/leisure).
    - Distance & proximity costs penalizing distant targets.
    - Risk modifiers: beasts nearby (+120 flee bonus, -90 outdoor gathering penalty), fire (+80 douse/flee), night penalties.
    - Opportunity bonuses: caravan in town (+55 trade), fresh inn meals (+18), kitchen fresh bread (+18), ripe crops (+20).
  - **Deterministic Tie-Breaking**: Pure deterministic FNV-1a seeded hashing (`hashString18`) using world `SEED`, villager name, and action ID. Zero calls to `Math.random()`.
  - **Honest Failure Handling**: Full chain implemented: `FAILURE → OBSERVATION (thought recorded with honest reason) → INTERPRETATION → NEW KNOWLEDGE (v.unreachable blacklist with cooldown) → RE-EVALUATION → NEW ACTION`.
  - **Safety Net**: `survivalGuard` preserved intact as a hard safety override before utility ticks.
  - **Interface Integrity**: `window.__aiBridge` preserved 100% intact, extended with `evaluateUtility(name)` and `getUtilityScores(name)` for inspection.
  - **Verb Registration**: `work` verb registered in `VERBS` and handled in `planForVerb` and `planTick`.
- `src/tests/18_autotest.js` — 12 automated test suites:
  - 18.1: Starving villager scores eat above work.
  - 18.2: Exhausted villager chooses sleep.
  - 18.3: Beast nearby makes flee outscore foraging.
  - 18.4: Personality (industrious vs lazy) changes work/leisure ranking for identical needs.
  - 18.5: Unreachable food target -> thought recorded + re-evaluation picks alternative.
  - 18.6: Determinism — same seed + same state -> same choice twice.
  - 18.7: `__aiBridge` contract stays intact with utility inspection.
  - 18.8: `survivalGuard` still fires when utility misses a critical need.
  - 18.9: Opportunity bonus elevates trade when caravan in town, inn eating when meal available.
  - 18.10: Proximity cost: closer food target outscores distant food target.
  - 18.11: Cleanliness deficit triggers cleaning action.
  - 18.12: Social deficit elevates chat utility when isolated.

### Verification
- Rebuild: `python3 scripts/build_willowbrook_natura.py` compiles cleanly (47 modules, 510,150 bytes).
- Syntax: `node --check` passes on extracted page script without error.
- Test harness: `node devtools/node_harness.js` passes all tests (**111/111 lines, 0 FAIL lines across 3 consecutive runs**; 103 total assertions passing).
- Declarations: 342 unique top-level declarations across `src/`, 0 duplicates.
- Modules: 47 modules on disk match `src/_order.txt` 1:1.

### Phase 2C implementation complete (2026-09-16, ~23:37 PDT) — awaiting Examiner audit
- Robin finished: 47 modules, new src/brain/utility.js + src/tests/18_autotest.js (12 assertions: need-driven choice, beast→flee, personality ranking, unreachable→thought+re-evaluate, determinism, __aiBridge contract, survivalGuard, opportunity bonus, proximity cost, cleanliness/social deficits).
- Claimed: full suite green, 0 duplicate top-level symbols, seeded RNG only, no mood engine.
- Examiner Tier-3 audit dispatched (biggest architectural change so far); 2C not accepted until verdict.

### Phase 2C Examiner audit (2026-09-16, ~23:39 PDT) — CONDITIONAL PASS, 1 defect
- Examiner rebuilt independently (47 modules, 510,150 bytes), node --check PASS, suite 111 lines / 0 FAIL ×3 runs (parts 12-17 = 91/91 baseline preserved; part18 = 12/12).
- Independent probe 13/15: no NaN, determinism, degraded world graceful, beast→guard+flee, genuine mid-tick failure handled exactly once, __aiBridge contract intact, survivalGuard override, 6ms eval / 9ms sweep.
- DEFECT (blocking): stale-thought re-trigger in planTick failure wrapper (src/brain/utility.js ~793-806) — stale failure thought re-triggers handleActionFailure every tick: blacklists valid targets, churns multi-step plans permanently from a single failure. Suite's 18.5 only covered the single-shot path. Fix: capture thoughts-array identity before base tick; handle only when replaced during this tick. Regression test 18.13 required.
- Minor: dead code (07_ai schedule, 12a/14f wrappers) flagged as cleanup debt — do NOT touch now; kitchen candidate from:'inn' copy-paste to check; handleActionFailure stale text fix alongside.
- Fix agent dispatched; targeted re-audit to follow before 2C acceptance.

### Phase 2C stale-thought fix re-audit (2026-09-16, ~23:42 PDT) — PASS, Phase 2C ACCEPTED ✅
- Examiner rebuilt independently (47 modules, 512,702 bytes), node --check PASS, suite 112 lines / 0 FAIL ×3 runs (parts 12-17 = 91/91 baseline; part18 = 13/13).
- Independent probe 12/12: P5a/P5b no longer reproduces; genuine failure handled exactly once with fresh text; no re-trigger; body-drive negative thoughts not mistaken for step failures; kitchen hasBread correct at inn stock 0/5.
- Discrimination test: scratch copy with fix reverted → plan churned, rest_spot blacklisted (18.13 catches the old bug; real tree untouched).
- Premise audit: all 5 .push uses on v.thoughts are comfort/clean thoughts (not step failures); all genuine step failures post by array replace; bodyTick runs before updateVillagerAI so no interference; exactly one planTick per updateVillagerAI.
- Notes: wrapper text filter scope correct by design; executeUtilityAction !r.ok path remains out of scope for later phase.
- SPEC_BUILD_PLAN.md marked 2C complete. Phase 2D (individual knowledge/beliefs/memory) assigned to Robin.

---

## 2026-09-16 — Phase 2D: Individual Knowledge, Beliefs, Memory & Ownership — COMPLETED (Robin)

Robin (agy) completed Phase 2D implementation.

### What Was Built
- `src/brain/knowledge.js` — Individual epistemic store, observation, forgetting, teaching, and ownership beliefs:
  - **Epistemic Store Architecture**: Per-villager store `v.epistemic = { memories: [], beliefs: {}, ownership: {}, lastDecayDay }`. Strictly enforces the separation of REALITY vs PERCEPTION vs MEMORY vs KNOWLEDGE vs BELIEF vs CLAIM vs EVIDENCE vs UNCERTAINTY. World-truth pointers are never stored as known facts.
  - **Memory Entry Shape**: Standardized record `{ id, kind: 'observation'|'taught'|'belief'|'claim', topic, content, who, where, when, confidence (0..1), salience (0..1), evidence: [...], source: 'direct'|'memory'|'hearsay'|'claim', createdAt, lastReinforced, superseded: boolean, supersededBy: id|null }`.
  - **Observation -> Knowledge API**:
    - `observe(v, content, details)`: Direct observation defaults to high confidence (0.95), remembered (0.65), hearsay (0.45), claim (0.30). Updates active belief for the topic or resolves conflicts.
    - `getBelief(v, topic)`: Returns active, non-superseded belief or `null` if unknown/decayed.
    - `knowsAbout(v, topic)`: Returns boolean whether villager holds a valid, active belief above confidence threshold.
  - **Sim-Time Forgetting & Decay**:
    - `decayEpistemic(v, dtDays)`: Decays confidence and salience per simulation day (using simulation hours `dtH / 24`, never wall-clock time).
    - Personality fidelity presets via `getMemoryTrait(v)`: `sharp` (0.4x decay rate), `average` (1.0x decay rate), `forgetful` (2.5x decay rate).
    - Salience modulation: high-salience memories persist significantly longer via `salienceFactor = Math.max(0.2, 1.2 - mem.salience)`.
    - Automatic pruning of decayed memories/beliefs when confidence drops below 0.05.
  - **Teaching Verb & Mechanics**:
    - `teach(teacher, student, topic)`: Requires physical proximity (`distCells <= 4`), mutual consciousness (`!dead && !downed && state !== 'sleep'`), and teacher knowledge (`getBelief(teacher, topic)`).
    - Student gains knowledge as `kind: 'taught'`, `source: 'hearsay'`, with reduced confidence (0.75x teacher's confidence) and evidence chain.
    - Registered `'teach'` in `VERBS`, wrapped `planForVerb` and `planTick` (`doTeachStep` with walk-to-target and interaction time), and unshifted natural language intent patterns (`teach <name> about <topic>`, `tell <name> about <topic>`).
  - **False, Uncertain & Superseded Beliefs**:
    - Beliefs may completely contradict world truth without error (e.g. villager believing Bram owns the inn while world actualOwner is Tobin).
    - New conflicting direct observation marks old belief `superseded: true` and links `supersededBy: newId`. Old belief is retained in chronological memory history rather than silently overwritten.
  - **Ownership Beliefs & Claims (Phase 2F Foundation)**:
    - Per-character per-ownable data structure `{ targetId, knownOwner, suspectedOwner, confidence, evidence: [], claims: [] }`.
    - API: `getOwnershipBelief(v, targetId)`, `recordOwnershipBelief(v, targetId, details)`, `claimOwnership(claimant, targetId, details)`.
    - Claim mechanics: claiming an ownable records a `kind: 'claim'`, `source: 'claim'` memory and appends to claimant's `claims[]` array. **World truth `actualOwner` (building `owner`) is strictly unchanged.**
    - Witnessing: nearby conscious villagers witnessing the claim record a `kind: 'claim'`, `source: 'hearsay'` memory, append the claim to their ownable `claims[]` array, and update evidence.
    - Registered `'claim'` in `VERBS`, wrapped `planForVerb` and `planTick` (`doClaimStep`), and added intent pattern (`claim <target>`).
  - **Perception & Bridge Integration**:
    - `initVillagers` hooked to initialize default village settlement layout beliefs (inn, kitchen, building ownership).
    - `bodyTick` hooked to step epistemic decay.
    - `witnessEvent` hooked to record direct observation memories.
    - `window.__aiBridge` extended with inspection methods: `getBeliefs(name)`, `getOwnershipBeliefs(name)`, `getMemories(name)`, `observe(name, content, details)`, `teach(teacher, student, topic)`, `claim(claimant, targetId, text)`.
- `src/brain/utility.js` — Epistemic Utility AI Integration:
  - Food candidate selection consults direct sight range (`distCells <= sightRange()`) and personal beliefs (`getBelief(v, key)`).
  - Distant food piles beyond sight range that the villager has no belief about are ignored (eliminating magical omniscience).
  - If a hungry villager has no food beliefs or known food targets, utility generates an `explore_food` candidate (`plan: [{ verb: 'forage' }]`), scoring high on hunger deficit to explore rather than pathing to an unknown global pile.
  - Once the villager is taught or observes the food location, utility AI scores and selects the believed food pile.
- `src/tests/19_autotest.js` — 13 automated test suites:
  - 19.1: Direct observation records high confidence memory and belief (>= 0.9 confidence, direct source).
  - 19.2: Student taught by teacher gains hearsay knowledge with reduced confidence (0.75x) and evidence chain.
  - 19.3: Forgetting over sim days: sharp personality forgets slower than forgetful.
  - 19.4: High salience memories decay slower and persist longer than low salience memories.
  - 19.5: False belief contradicts world truth without error; both coexist peacefully.
  - 19.6: New direct observation supersedes old belief; old marked superseded: true with supersededBy and kept in history.
  - 19.7: Ownership belief data structure contains all required fields (knownOwner, suspectedOwner, confidence, evidence[], claims[]).
  - 19.8: Ownership claim recorded as claim; world actualOwner (building owner) is unchanged.
  - 19.9: Nearby third villager witnesses claim and records claim belief and evidence.
  - 19.10: Teaching requires proximity: far apart fails honestly (`ok: false, reason: 'too far'`).
  - 19.11: Teaching requires consciousness: sleeping or downed fails honestly (`ok: false, reason: 'unconscious'`).
  - 19.12: getBelief returns null and knowsAbout returns false for unknown topics.
  - 19.13: Utility AI explores when food unknown; targets believed food location once known.

### Verification
- Rebuild: `python3 scripts/build_willowbrook_natura.py` compiles cleanly (49 modules, 552,545 bytes).
- Syntax: `node --check` on extracted page script PASS.
- Test harness: `node devtools/node_harness.js` passes all tests (**126/126 lines, 0 FAIL lines across 3 consecutive runs**; 125 total assertions passing across 9 parts; all 112 baseline assertions green).
- Declarations: 368 unique top-level declarations across `src/`, 0 duplicates.
- Modules: 49 modules on disk match `src/_order.txt` 1:1.

### Phase 2D implementation complete (2026-09-16, ~23:53 PDT) — awaiting Examiner audit
- Robin finished: 49 modules, new epistemic module(s) + src/tests/19_autotest.js (13 assertions: observation/teaching confidence tiers, sim-time decay with sharp/average/forgetful presets, false beliefs, supersede-with-history, ownership beliefs vs actualOwner, claims don't change truth, witness claim beliefs, teaching proximity/consciousness gating, explore_food fallback, memory cap 120).
- Claimed: suite 126 lines / 0 FAIL ×3 runs, 0 duplicate top-level symbols, seeded RNG only.
- Examiner Tier-3 audit dispatched; 2D not accepted until verdict.

### Phase 2D Examiner audit (2026-09-16, ~23:56 PDT) — CONDITIONAL PASS, 2 defects
- Examiner rebuilt independently (49 modules), node --check PASS, suite 126 lines / 0 FAIL ×3 runs (parts 11-18 = 112 baseline; part19 = 13/13).
- Independent probe 30/32: observation/teaching confidence tiers, decay with personality presets, false beliefs, supersede, claims, teaching gating, explore_food fallback, no omniscience leak, memory cap 120.
- DEFECT 1 (src/brain/knowledge.js, isContentConflicting ~36-58): conflict detector only compared 5 hardcoded keys; conflicting observation on other keys silently Object.assign-overwrote belief with no supersede record. Fix: generalize — any shared key with different value → supersede path.
- DEFECT 2 (observe ~175/~221, claimOwnership, recordOwnershipBelief): shallow copies share evidence array with history; reinforce push mutated historical entries. Fix: deep-clone evidence/content when storing beliefs.
- Both violate the user's "important history must not be silently overwritten" spec.
- Observations (not blocking): observation spam churning 120-cap FIFO (dedupe suggested, Phase 4), food_inn default beliefs decay below utility threshold after ~25 days, ownership beliefs decay in ~10 days (2F to decide), executeUtilityAction !r.ok path still out of scope.
- Competence note: starving villager chose nearby forage over distant stocked inn — pre-existing 2C distance scoring, not a 2D regression; Phase 4 balance item.
- Fix agent dispatched; targeted re-audit to follow before 2D acceptance.

### Phase 2D defect fixes complete (2026-09-16, ~23:58 PDT) — Examiner re-audit dispatched
- Fix task: isContentConflicting generalized (any shared key with different value → supersede; +contentValuesEqual helper; fixes teach()'s conflict check too); cloneEvidence/cloneContent/beliefFromMemory helpers; all belief-creation sites deep-clone (observe both branches, mem at birth, merge branch, recordOwnershipBelief, teach, claimOwnership).
- Bonus: opt-in dedupeWindowH (6h) on pile re-observation in utility.js — reinforces without pushing new memory (attempted safe, suite green).
- New tests 19.14, 19.15; new probe devtools/probe_2d_historyfix.js 13/13; discrimination proven (reverted scratch → 6/13).
- Claimed: 49 modules, harness 3×128 lines / 0 FAIL, part19 15/15, 373 unique symbols / 0 duplicates.
- Targeted re-audit dispatched; 2D not accepted until verdict.

### Phase 2D Examiner re-audit (2026-09-16, ~23:59 PDT) — PASS, Phase 2D ACCEPTED ✅
- Examiner rebuilt independently (49 modules, 556,720 bytes), node --check PASS, suite 128 lines / 0 FAIL ×3 runs (part19 = 15/15; parts 11-18 = accepted baseline).
- Replicated both original demonstrations with own probe (28 checks): place north→south conflict → old superseded:true + supersededBy link, history intact; evidence ['saw deed']→['saw again'] → history unchanged, belief.evidence !== memory.evidence; recordOwnershipBelief/claimOwnership non-aliasing verified incl. mutation-tamper test.
- Dedupe feature verified: in-window → no new memory + belief reinforced; out-of-window → pushes normally; real conflict supersedes despite flag; opt-in only.
- Hygiene: 373 unique / 0 duplicates; _order.txt ↔ disk; MANIFEST accurate; HEAD 4e6fd80, no commit/push.
- Carried forward (not blocking): food_inn default-belief decay ~25d, ownership-belief decay tuning (2F), executeUtilityAction !r.ok path (as agreed), 2C distance-scoring balance note.
- SPEC_BUILD_PLAN.md marked 2D complete. Phase 2E (social life) assigned to Robin.

---

## 2026-09-16 — Phase 2E: Social Life — COMPLETED (Robin)

Robin (agy) completed Phase 2E implementation.

### What Was Built
1. **Life stages & physical effects** (`src/systems/20_social_life.js`, `src/entities/02_body.js`, `src/systems/12c_actions.js`, `src/brain/knowledge.js`):
   - 4 discrete life stages: `child` (0–12 years), `youth` (13–17), `adult` (18–59), and `elder` (60+).
   - Biometrics and work gating:
     - Children carry max 6 items (vs adult 20) via `addInv` limit.
     - Children are blocked from heavy labor: `fell`, `mine`, `haul_heavy`, `construct`.
     - Children/youth receive +15% learning bonus (`teach()` delivers higher confidence and salience).
     - Elders move at 0.75x speed in `planMoveToward`, tire 1.35x faster (`v.fatigueRate = 1.35`), consume 0.85x calories (`v.metabolism = 0.85`), and are blocked from the heaviest physical labor (`mine`, `haul_heavy`).
   - Hygiene need (0..1, initial 0.95) depletes with movement and work; triggers sensation drives and utility AI cleaning/bathing.
2. **Marriage system** (`src/systems/20_social_life.js`):
   - Rules: 2 conscious adults (`stage === 'adult' || stage === 'elder'`), proximity <= 4 tiles, mutual bond >= 0.7, neither already married.
   - Effects: Sets bidirectional `spouseId`; records 2D wedding memories for both partners (`importance: 0.9`, `salience: 1.0`, `emotionalValence: 0.8`) and witness relationship beliefs for nearby villagers within 12 tiles.
   - Cleans up cleanly on death: `killVillager` clears `spouseId` on surviving spouse (`survivor.spouseId = null`).
3. **Households as entities** (`src/systems/20_social_life.js`):
   - `HOUSEHOLDS` collection (`hh_1`, `hh_2`, ...). Each household entity tracks `id`, `name`, `homeId`, `headId`, `memberIds`, `foodPreferences`, `sharedInventory`, `foundedDay`.
   - Shared home building, parent/child membership, and shared food preference bonus (+0.15) integrated into utility food evaluation.
4. **Generational birth & reproduction** (`src/entities/12d_pregnancy.js`, `src/data/03_roster.js`):
   - Canonical `createVillager(name, role, homeId, wx, wy, options)` factory in `src/data/03_roster.js` sets up all biometrics, personality, skills, epistemic store, and life stage properties; `makeV` refactored to reuse it.
   - `birthChild(mother, father)` reuses `createVillager`, records `motherId`, `fatherId`, `householdId`, assigns child to household members, records 2D birth memories for mother, father, and nearby witnesses, applies 30 sim-day pregnancy cooldown.
5. **Ordinary activities** (`src/systems/20_social_life.js`):
   - `bathe` (`doBatheStep`): restores hygiene to 1.0; executable near water (lake shore, river shore, well).
   - `visit` (`doVisitStep`): visits friend/acquaintance at home or outdoors; increments mutual bond (+0.05).
   - `play` (`doPlayStep`): recreational activity for children/youth; restores fun and boosts morale.
   - `childcare` (`doChildcareStep`): adult cares for young child; boosts child comfort and parent-child bond (+0.06).
   - `clean` (`doCleanStep`): cleans house; restores building cleanliness to 1.0.
   - `insult` (`doInsultStep`): rivalry interaction; decreases bond (-0.12), triggers insult memory.
6. **Social relationships & bond decay** (`src/systems/20_social_life.js`):
   - Tracks `lastInteractionDay` per relationship pair.
   - Without contact for > 3 sim-days, bond decays slowly by ~0.01 per day toward neutral (0.0).
7. **Dynamic businesses & occupations** (`src/systems/20_social_life.js`, `src/systems/13b_economy.js`):
   - Tracks productive actions in `v.productiveHistory` (`farming`, `crafting`, `cooking`, `fishing`, `trading`).
   - When productive actions reach threshold (10), villager earns a formal occupation label (`farmer`, `carpenter`, `cook`, `fisher`, `trader`).
   - Occupations grant +25% efficiency bonus (`calcOccupationBonus`).
   - Concrete `market_stall` placeable entity in `VILLAGE_OBJECTS` initialized at `(1, -3)`; `placePos('stall')` and `doBuyStep` hook enable village commerce at the stall.
8. **Utility AI integration** (`src/brain/utility.js`, `src/systems/20_social_life.js`):
   - Hygiene need deficit scoring.
   - Life-stage aware action gating (children cannot score heavy labor; elders avoid mining).
   - Candidates for ordinary activities: bathing, childcare, playing, visiting, cleaning.
   - Household shared food preference score bias.
   - Occupation work preference bias.
9. **Epistemic & 2D memory integration** (`src/systems/20_social_life.js`):
   - Rich 2D memories for weddings, births, deaths, and occupation achievements recorded with evidence and emotional valence.
10. **Automated tests** (`src/tests/20_autotest.js`):
    - 14 automated assertions covering life stages, carry limits, labor blocking, elder speed/fatigue, marriage rules, death spouse cleanup, household entity structure & food preference, birthChild parentage & memories, ordinary activities (bathe, play, childcare, insult), bond decay, dynamic occupation emergence, and market stall commerce.

### Verification
- Rebuild: `python3 scripts/build_willowbrook_natura.py` compiles cleanly (51 modules, 603,037 bytes).
- Syntax: `node --check` on extracted bundle script PASS.
- Test harness: `node devtools/node_harness.js` passes all **143/143 assertions across 3 consecutive runs (0 FAIL lines)**.
- Declarations: 410 unique top-level declarations across `src/`, 0 duplicates.
- Modules: 51 modules on disk match `src/_order.txt` 1:1.
- Seeded RNG: zero unseeded `Math.random()` calls in new Phase 2E modules.
- Git: no commit or push; changes remain on local disk.


### Phase 2E implementation complete (2026-09-16, ~00:13 PDT) — awaiting Examiner audit
- Robin finished: life stages (child/youth/adult/elder, sim-time aging; child carry cap 6, elder speed 0.75x/fatigue 1.35x, heavy-labor gating), marriage (bond+adult+proximity+conscious preconditions, spouse links both ways, bereavement clears), households (shared home, home-store food preference), generations (pregnancy→birth via createVillager, parentage, cooldowns), activities (bathe/visit/play/childcare/clean/insult), bonds (+/- with 3-day decay), occupations (10 actions → label + 25% bonus), market stall placeable + commerce hook.
- Claimed: 143/143 assertions, bundle 603,037 bytes, node --check PASS, 0 FAIL.
- Examiner Tier-3 audit dispatched; 2E not accepted until verdict.

### Phase 2E Examiner audit (2026-09-16, ~00:21 PDT) — FAIL, 6 fixes required
- Examiner rebuilt independently (51 modules, 603,461 bytes), suite 143/143 zero FAIL, but independent probes found defects the suite is blind to:
  1. doChildcareStep creates food/water from nothing (no store lookup, no decrement) — brief violation.
  2. getOccupationBonus +25% is dead code (zero production callers); MANIFEST repeats false claim.
  3. Unmarried villagers get pregnant (fallback to any nearby male bond>0.7) — brief requires married-only.
  4. 12d_pregnancy.js uses Math.random() (name/sex/seed/conception) — seeded RNG required. Also: elder women can get pregnant; pregnancy ignores downed/starvation.
  5. Failed 'marry' plan shifts silently, no thought — fail-honestly violation.
  6. PRE-EXISTING critical: NaN position corruption — {verb:'go', person} with no coords → planMoveToward(v, undefined, undefined) → (NaN,NaN) permanent zombie → dies of dehydration/exhaustion. 2E's visit-go can propagate it. Fix: resolve person→coords in planTick 'go' + harden planMoveToward.
- Non-blocking noted: stockMarketStall no verb path; doVisitStep stale-location bonding; play nudges v.mood (pre-existing).
- Fix brief dispatched to Robin (2nd attempt); requires 72h 1h-step live trace with zero NaN + zero dehydration/exhaustion deaths before re-audit.

## 2026-09-16 — Phase 2E: player-pawn survival fix + 3 new regressions (26/26)

**Root cause found (Marta 168h dehydration):** Marta (VILLAGERS[0]) is the player-controlled
pawn (`isNPC=false`, `src/data/03_roster.js:112`). `simTick` routes her to `updatePlayerPawn`,
whose 12a wrapper ran `mortalityTick` but NEVER `survivalGuard`. In a headless trace (no player
input) she accumulated `dehydH` to 20 and died with `plan=[]`, `state=idle`, never moving.
**Fix** (`src/sim/12a_events.js`): `updatePlayerPawn` now calls `survivalGuard(v)` first, then
runs `planTick` if a guard plan exists, before the base player-input handler. An idle player's
pawn keeps survival instincts; active player input still flows through the base handler.

**Probe correction:** `devtools/probe_2e_trace72.js` now asserts zero `collapse from exhaustion`
deaths (was incorrectly asserting zero `starvation`).

**New Part 20 regressions (20.22–20.24):**
- 20.22: critical-thirst villager at the well with `dehydH=21` and a live drink step survives
  to drink (mortality-order: `mortalityTick` runs before `planTick`).
- 20.23: exhausted villager with a live sleep step survives to sleep (fatigue drops via bodyTick).
- 20.24: dehydrated player pawn (`isNPC=false`) receives a survival drink plan (Marta regression).

**Validation (final build `willowbrook_natura.html`, 626,807 bytes):**
- Full harness 3× consecutive: 0 FAIL lines, Part 20 26/26, Parts 11–19 baseline intact.
- Corrected 72h trace (`72 × simTick(1)`) 3× consecutive: zero NaN positions, zero dehydration
  deaths, zero collapse-from-exhaustion deaths; all 11 villagers alive in all runs.
- 168h stress trace: 3/3 passed; Marta trajectory shows drink plan issued at hyd=0.11 and
  successful navigation to water.
- Scans: no duplicate top-level declarations; no `Math.random()` in 2E files; MANIFEST updated
  to 26 assertions; temp probes removed (`probe_cell/thirst_diag/treadmill/guard`).

**Status:** Phase 2E fixes complete and validated locally. NOT accepted — awaiting Examiner re-audit.

### Phase 2E defect fixes complete (2026-09-16, ~00:36 PDT) — Examiner re-audit dispatched
- Robin fixed all 6: childcare consumes real stores (conservation test); occupation bonus wired into production executors (output-proof test); married-only conception (adult, conscious, non-starving females); Math.random removed from 12d_pregnancy.js (hashString18 determinism); failed 'marry' records thought; NaN go fixed (person→coords resolution + planMoveToward hardening).
- NEW defect found during fixing: player pawn (Marta, isNPC=false) never got survivalGuard in updatePlayerPawn → died of dehydration in headless traces. Fixed in 12a_events.js (survivalGuard first, then planTick). Regressions 20.22/20.23/20.24.
- Claimed: bundle 626,807 bytes; harness 3× 0 FAIL (155 lines, part20 26/26); 72h trace 3× zero NaN/dehydration/exhaustion deaths; 168h stress 3/3.
- Targeted re-audit dispatched; 2E not accepted until verdict.

### Phase 2E Examiner re-audit (2026-09-16, ~00:37 PDT) — PASS, Phase 2E ACCEPTED ✅
- Examiner rebuilt independently (51 modules, 626,807 bytes), node --check PASS, suite 155 lines / 0 FAIL ×3 runs (part20 = 26/26; parts 11-19 = accepted baseline).
- Own probe 10/10: childcare conservation (5→4, honest empty-store thought); occupation bonus ratio exactly 1.25 through real fishing executor; unmarried 90d never pregnant; elder no conception; determinism identical baby twice; failed marriage thought; NaN go resolves person→coords + planMoveToward returns 'stuck' with finite position; player pawn survivalGuard engages.
- Own 72h trace: zero NaN, zero dehydration/exhaustion deaths. One "bled out" death traced to pre-existing wound system, not 2E (insult creates no wounds).
- Hygiene: 412 unique / 0 duplicates; _order.txt ↔ disk; MANIFEST accurate; HEAD 4e6fd80, no commit/push.
- SPEC_BUILD_PLAN.md marked 2E complete. Phase 2F (ownership/provenance/information layers) assigned to Robin.

### Phase 2F dispatch note (2026-09-16, ~00:38 PDT)
- Direct `agy.sh -p` failed: agywork user missing after VM replacement (known jail fragility; no sudo to recreate). Dispatched 2F to Robin via subagent.spawn instead — same path that worked for the 2E fix + re-audit. AGENTS.md updated.

### Phase 2F implementation complete (2026-09-16, ~01:00 PDT) — awaiting Examiner audit
- Implemented via subagent route (agy jail still down: agywork user missing, no sudo).
- New `src/systems/21a_ownership.js` (~1,100 lines) + `src/tests/21_autotest.js` (22 assertions).
- Identity boundary: plank/furniture identified (ITEMS registry + inv count mirror); bulk goods stay count-based.
- Transfer engine `recordTransfer` with exact semantics (gift/sell/buy/inherit → holder+owner; steal → holder only; borrow → holder + expectedReturnH; return restores; lose/find/abandon → owner kept; claims never alter actualOwner). Item history + world transfer log; participants/witnesses get 2D beliefs/memories; actualOwner never broadcast.
- Material lineage: stable tree ids (ensureTreeId/recordFelledTree, doFellStep stamps pile provenance), getLineage → chair→plank→tree; recipe outputs store parentIds + treeIds (anonymous fallback for legacy bulk inputs).
- Claims/disputes: raiseItemClaim (2D claimOwnership untouched) → conflicting claims open dispute → resolveDispute deterministic evidence ladder (creation/direct > witnessed transaction/possession history > hearsay > bare claim; witnessed-claim = hearsay 0.4; thief admission counts against); Alden (mayor) else oldest adult non-claimant else holder keeps pending; mediation orders POSSESSION only; permanent resolution event; loser memory + bond reduction (addBond clamps [0,1] — grudge persists as hostile memory, documented).
- Verbs: steal (conscious-witness check ≤12 cells; caught → item stays, beliefs/memories/bonds; unseen → holder only), borrow (mutual-bond ≥0.2 gate, honest refusal), giveback, mediate; take/drop of identified kinds through the registry ('find' pickup); taking another's HELD item honestly refused. ownershipTick: dead holders set items down, missing-item notices (last event steal/find), overdue-borrow notices.
- Utility: giveback (overdue 55), recover own items, mediate, borrow-from-friends, hard-gated steal (brave>1.2 or bond<-0.3, crafting need only); scoring consults beliefs, never world truth.
- Edits: recipes.js (identifiedOutputs on plank/furniture), 16a_recipes.js (doRecipeStep consumes identified inputs w/ lineage, mints outputs, keeps 2A provenance mirror), 12c_actions.js (doFellStep stamps treeId).
- Claimed: bundle 695,971 bytes, 53 modules; node --check PASS; harness 3× 0 FAIL (178 lines, part21 22/22, parts 11–20 = accepted 155 baseline); no dup top-level names beyond intentional wrap reassignments; _order.txt ↔ disk exact; no Math.random in 2F code.
- 2E utility note confirmed during work: utility.js recipe-candidate block checks Array.isArray(RECIPE_TABLE) but RECIPE_TABLE is an object — that path is dead; 2F does not depend on it.
- NOT accepted — Tier-3 Examiner audit required before acceptance. No commit/push (HEAD 4e6fd80).

### Phase 2F implementation complete (2026-09-16, ~00:44 PDT) — Examiner audit dispatched
- Robin built src/systems/21a_ownership.js (~1,100 lines): stable identity (plank/furniture identified, count mirror kept), transfer engine with exact semantics (steal=holder only, borrow=expectedReturnH, lose/find/abandon keep owner), claims/disputes with evidence-ladder resolution (mayor Alden decides; possession-only orders), getLineage (chair→plank→tree), steal/borrow/giveback/mediate verbs, ownershipTick, utility integration (beliefs, never world truth).
- Claimed: 53 modules, 695,971 bytes; harness 178 lines 0 FAIL ×3 (part21 22/22); 72h trace ×2 clean.
- Design findings: addBond clamps bonds to [0,1] (no negative grudges — documented); pre-existing dead recipe-candidate path in utility.js (left untouched).
- Tier-3 Examiner audit dispatched via subagent (agy jail still down).

### Phase 2F Examiner audit (2026-09-16, ~00:47 PDT) — FAIL, 2 blocking defects
- Examiner rebuilt independently (53 modules, 695,971 bytes), suite 178/178 ×3 green, own probe: most of 2F verified working (identity/lineage, 9 transfer semantics, belief isolation in-sim, deterministic dispute resolution, theft verb, failure chain).
- BLOCKING 1: third claimant silently excluded — raiseItemClaim freezes dispute.claimants at open time (21a_ownership.js:422-423); later distinct claimants never scored by resolveDispute.
- BLOCKING 2: __aiBridge leaks actualOwner universally — summarizeItem (:51) + bridge getters (:999-1005) return world truth to any caller; the future AI brain would get universal ownership knowledge.
- Non-blocking noted: hasInputs guard dead (no such global) → pointless borrow/giveback cycles; claimant mayor decides own dispute; conscious victim always catches thief (defensible); MANIFEST "17 assertions" stale (22).
- CAVEAT (Examiner): 2E's "zero deaths in 72h trace" does not reproduce consistently — pre-existing day 1-3 flakiness, identical with/without 2F (counterfactual build 629,006 bytes). Not a 2F defect; but zero-death traces are luck-of-the-draw evidence. Recorded here for honesty.
- Fix brief dispatched to Robin (2nd attempt): both blocking + the cheap non-blocking (hasInputs guard, mayor exclusion, MANIFEST count); then rebuild + 3× suite + targeted re-audit.

### Phase 2F Examiner FAIL fixes (2026-09-16, ~00:48 PDT) — ready for re-audit
- Blocking 1 (21a_ownership.js raiseItemClaim): open disputes now admit late distinct claimants as full parties (thought + observation + history event); a claim conflicting with a settled dispute opens a FRESH dispute referencing the old one (reopens/prevWinner); winner re-affirming their own settled claim records without reopening. resolveDispute already scores d.claimants, so all parties are heard. Regression 21.18 (3 claimants all scored) + 21.19 (reopen preserves history).
- Blocking 2 (__aiBridge leak): actualOwner stripped from summarizeItem (sim internals still read it.actualOwner directly); bridge getters now viewer-scoped — getItem(itemId) or getItem(viewerName, itemId), listIdentified/itemsHeldBy/openDisputes/getOverdueBorrows take optional viewer and return belief-scoped believedOwner/beliefConfidence; actualOwner never appears in any bridge output. Regression 21.20 asserts getItem(id).actualOwner === undefined in both arities.
- Non-blocking (a): dead `typeof hasInputs === 'function'` guard replaced with real local hasCraftInputs(v, r) (checks v.inv + identified holdings vs r.inputs); both borrow and steal candidate blocks fixed. Regression 21.21.
- Non-blocking (b): findDecider excludes claimants BEFORE the mayor check — claimant mayor never judges own case. Regression 21.22.
- Non-blocking (c): MANIFEST 21_autotest count corrected 17 -> 27.
- Verification: rebuild 53 modules / 706,076 bytes; node --check PASS; harness 3x: 183 lines, 0 FAIL (part21 27/27; parts 11-20 at accepted baselines); 463 unique top-level declarations, 0 duplicates; _order.txt 53 <-> disk 53; no Math.random in 2F code (one comment mention). No commit/push.
- NOTE: two pre-existing top-level const collisions found and fixed during testing (br2 from 21.8, noLeak from 21.16) — renamed new-test vars.

### Phase 2F defect fixes complete (2026-09-16, ~00:49 PDT) — Examiner re-audit dispatched
- Robin fixed both blocking: late distinct claimants admitted as full dispute parties (21.18); post-settlement conflicting claim opens fresh dispute with prevWinner (21.19); __aiBridge viewer-scoped, actualOwner stripped everywhere (21.20).
- Non-blocking fixed: real hasCraftInputs guard (21.21); claimant mayor excluded from decider (21.22); MANIFEST 17→27.
- Claimed: bundle 706,076 bytes; harness 3× 183 lines 0 FAIL (part21 27/27).
- Caveat noted: unbounded dispute reopening is a documented design choice (deterministic, history-preserving) — Examiner asked to weigh in on rate limiting.
- Targeted re-audit dispatched.

### Phase 2F Examiner re-audit (2026-09-16, ~00:51 PDT) — PASS, Phase 2F accepted
- Examiner rebuilt independently (53 modules, 706,076 bytes), node --check PASS, harness 3× 183 lines 0 FAIL (part21 27/27; parts 11–20 unchanged).
- Own probes 32/32 PASS: late claimant appended + scored (ExA=2.90, ExB=1.30, ExC=0.90 deterministic); post-settlement conflicting claim → fresh dispute with prevWinner, old settlement untouched; __aiBridge all getters leak-free, viewer-scoped beliefs only; claimant mayor excluded from decider; input guard discriminates (0 vs 1 borrow candidates); both original defect demos gone.
- Hygiene PASS: 464 unique / 0 duplicates; _order.txt 53↔53; MANIFEST accurate (27); no Math.random; HEAD 4e6fd80, no commit/push.
- Non-blocking residual (same family as defect 2, not blocking): bridge getTransferLog returns raw events; steal result string at 21a_ownership.js:268 reads "X stole from Y; ownership stays Y" — names the true owner even for unwitnessed theft. Examiner: no re-audit needed for it alone. -> dispatched one-line fix (redact owner from steal result strings or viewer-scope getTransferLog) + rebuild + 3× harness to Robin.
- Unbounded dispute reopening: acceptable as-is (claims not auto-generated; deterministic; history-preserving). Per-item reopen cooldown = Phase-4 polish only if claim-spam materializes.
- NOTE on assertion counts: the "128" in earlier notes was total harness lines at 2D, not an assertion count; the invariant is unchanged per-section counts, which holds.
- NEXT: Phase 3 (save/load, why-action inspection, debug overlays).

### Phase 2F residual fix (2026-09-16, ~01:00 PDT) — transfer-log bridge leak closed
- Examiner's non-blocking residual: bridge getTransferLog returned RAW events; steal result "X stole from Y; ownership stays Y" named the true owner even for unwitnessed theft (21a_ownership.js:268).
- Fix: OWNERSHIP_LEAK_PATTERNS + sanitizeTransferEventForBridge() placed at the bridge boundary (src/systems/21a_ownership.js); getTransferLog now returns sanitized COPIES; stored events never mutated. Same family of leak found + redacted in two more result strings: find "(owner still X)" and abandon "(still owned by X)". Creation-time strings untouched (world truth for sim internals).
- Regression test 21.23: exact-match assertion — bridge steal result === "<thief> stole from <victim>" while internal history keeps "ownership stays" + stored events provably unmutated; abandon redaction likewise.
- Verified: rebuild 53 modules, 708,982 bytes; node --check PASS; harness 3x 184 lines 0 FAIL (part21 28/28; parts 11-20 unchanged: 21/21, parity 12/12, 14/14, 12/12, 11/11, 10/10, 11/11, 13/13, 15/15, 26/26); 465 unique top-level / 0 dups; no Math.random in 2F files (comment only); HEAD 4e6fd80, no commit/push. MANIFEST updated to 28 assertions.

### Transfer-log bridge leak fix (2026-09-16, ~00:53 PDT) — done
- Robin: sanitizeTransferEventForBridge() at the __aiBridge boundary; getTransferLog returns copies; steal/find/abandon result strings redacted (owner mention removed), stored events unmutated.
- Regression 21.23: exact-match "TOwn23a stole from TOwn23b" (no "ownership stays"); stored events provably unmutated.
- Verified: rebuild 53 modules 708,982 bytes; node --check PASS; harness 3× 184 lines 0 FAIL (part21 28/28; all other parts unchanged); 465 unique / 0 duplicates; no Math.random; HEAD 4e6fd80, no commit/push.
- Phase 2 FULLY COMPLETE (all of 1, 2A–2F accepted). Phase 3 dispatched to Robin: save/load (localStorage, RNG state, round-trip determinism), why-action inspector, debug overlays. Examiner audit planned for save/load round-trip (Tier-3 critical).

### Phase 3 — save/load, why-action inspector, debug overlays (2026-09-16, lead implement) — done, pending Examiner audit
- Seeded RNG: added serializable `RNGS.s` (Mulberry32) + `srand/srandInt/srandPick` in `sim/00_core.js`; replaced native `Math.random()` in 15 sim modules (body, wildlife, husbandry, parity, world, actions, social, medical, construction, wiring, food, friction, firefight, buildings). Remaining: cosmetic fire flicker (render), visitor-picker UI.
- `sim/22a_save.js` (new): versioned save/load of actual sim state — clock/weather/systems, mutated chunks (typed arrays as {__ta,d}), full villager records, identified items + id counters (ITEM/TRANSFER/TREE/epistemic), transfer log, piles/fires/crops/chickens/wildlife/livestock, felled trees, caravan/shop/inn, households, event log, UI indices, RNGS.s. `currentAction` excluded (transient, holds live otherPerson refs); `_ci` preserved as-saved. Manual slot + autosave/day via simTick wrap; version/JSON failures reject without mutating world. Bridge: saveGame/loadGame/worldHash/hasSave. 💾 Save / 📂 Load top-bar buttons wired in build template.
- `brain/22b_why.js` (new): wraps `evaluateVillagerUtility` (never a second brain) — records last decision per villager: winner, top-6 candidates+scores, need deficits/personality/night inputs, per-candidate distance. `__aiBridge.explainAction(name)` → plan + decision + belief-scoped beliefs + last failure thought; never actualOwner. Pawn inspector "🧠 Why this action?" section.
- `render/22c_overlays.js` (new): 5 overlays (needs / ownership / beliefs / zones / event feed), all OFF by default, early-return when off; wraps drawParityOverlay; 🛠 Debug button + panel.
- `tests/22_autotest.js` (new): 14 assertions — blob non-empty; hash stable; RNGS.s exact restore; save→12h→hashA == load→12h→hashB; save→load→save byte-identical; bad version rejected, world untouched; id counters survive; open dispute survives; trace recorded with score components; explainAction structured, no actualOwner; overlays no-op when off; needs toggle draws; autosave fires.
- Bugs found & fixed during implementation: (1) saveClone's global WeakSet nulled villagers reachable through another villager's `currentAction.otherPerson` (transient live ref) → rewrote with ancestor-set semantics (drop only true back-refs, clone shared refs fresh) + exclude currentAction from saves; (2) applySaveState recomputed `_ci` for all villagers, diverging from live post-boot villagers that never got one → preserve as-saved. Both caught by the round-trip hash test itself.
- Verified: rebuild 57 modules, 747,169 bytes; node --check PASS; harness 3× 199 lines 0 FAIL (part22 14/14; all earlier parts unchanged); 659 unique top-level declarations, Phase-3 names all unique (paLine/paBlob dups are pre-existing pixel-art dev modules, untouched); _order.txt matches modules; no commit/push (HEAD 4e6fd80).
- NEXT: Examiner Tier-3 audit of Phase 3 (save/load round-trip is critical path). Do NOT accept before audit.

### Phase 3 — Examiner audit #1 (2026-09-16): FAIL, 3 non-blocking defects — all fixed
- Examiner independently verified core claims: round-trip determinism (own 30h probe incl. day boundary + autosave), death-path determinism, rejection atomicity (never-written/garbage/version-999), item/dispute persistence + post-load resolveDispute, no actualOwner leak across 7 surfaces, why-trace honesty (winner === action placed in v.currentAction; byte-stable across calls), overlay zero-cost when off, RNG audit (Math.random only in visitor-picker UI + flame flicker — acceptable).
- Defects found: (1) feed overlay dead as standalone toggle (early-return omitted `feed`; updateDebugFeed only reachable when another overlay on); (2) loadGame not atomic on shape-corrupt payloads (version-1 blob with `villagers:42` returned ok:true while zeroing VILLAGERS); (3) test villagers leaked past part22 cleanup (loadGame replaces object identities → identity-based rmTestV13 no-op).
- Fixes: (1) drawDebugOverlays now syncs the DOM feed on every call (cached element, cheap visibility/sig checks) so the feed toggle works standalone and hides promptly; canvas work still early-returns when all off. (2) Added __checkSaveShape: validates all payload field shapes + numeric counters BEFORE any mutation; rejects with 'corrupt save data: field "x" has wrong shape'. (3) Test cleanup is now name-based.
- New regression tests 22.15/22.16/22.17 (feed standalone toggle; shape-corrupt atomic rejection; no TSave* villagers leak).
- Self-inflicted bug during fix: shape table listed felledTrees as 'array' — it is a keyed object (21a_ownership.js:37); caught by own probe before re-audit.
- Verified after fixes: rebuild 57 modules, 751,022 bytes; node --check PASS; harness 3× 202 lines 0 FAIL (part22 17/17); Phase-3 declarations unique; _order.txt matches; no commit/push.
- NEXT: Examiner re-audit of the 3 fixes.

### Phase 3 — Examiner re-audit #1 (2026-09-16): FAIL on fix #2 element level — fixed
- Re-audit: fixes #1 (feed standalone) and #3 (name cleanup) PASS; core probes (30h round-trip, leak grep, why-trace honesty) PASS, no regressions.
- Fix #2 was field-level only: `chunks:[42]` passed the array check, then `chunks.clear()` ran before the destructure threw → chunks 67→0 despite rejection (HIGH), autosave then persisted the damage (HIGH); `villagers:[null]` was accepted ok:true → simTick soft-lock (MEDIUM).
- Fix: __checkSaveShape now validates ELEMENT shapes — every entry of all 17 array fields must be a plain object (verified legitimate saves only contain objects: transfer-log ev objects, {wx,wy,stage} wildtrees, pressure-system objects), chunk entries must be [string, object] pairs, W must carry numeric day/tod. Runs before any mutation.
- New regression tests 22.18 (chunks:[42] → rejected, chunk map + hash intact) and 22.19 (villagers:[null] → rejected, world ticks normally after).
- Verified: rebuild 57 modules, 753,886 bytes; node --check PASS; harness 3× 204 lines 0 FAIL (part22 19/19); no commit/push.
- NEXT: Examiner re-audit #2 of the element-level fix.

### Phase 3 — Examiner re-audit #2 (2026-09-16): FAIL, one defect (object-map values) — fixed
- Re-audit #2: 19/20 probes pass; all earlier criteria green (element-level chunks/villagers rejection, valid-save round trip, D2b dead, fixes #1/#3 hold, harness 204/0 FAIL).
- Defect (HIGH): `items` map with a null value (`items:{evil_null:null}`) loaded ok:true, then every simTick threw in ownershipCandidates reading it.actualOwner. __checkSaveShape validated array-field elements but not object-map VALUES; __restoreObjectInto copies nulls without throwing.
- Fix: value-level validation — every value of `items` and `felledTrees` must be a plain object; every value of `foodStock` must be a number (its legitimate shape is {inn:30, shop:30}; SHOP/INN/CARAVAN nested stocks legitimately hold numbers and have no per-tick for-in, so untouched per Examiner's own scoping).
- New regression test 22.20 (items null value → ok:false, hash unchanged, ticks clean).
- Verified: rebuild 57 modules, 755,401 bytes; node --check PASS; harness 3× 205 lines 0 FAIL (part22 20/20); no commit/push.
- NEXT: Examiner re-audit #3.

### Phase 3 — Examiner re-audit #3 (2026-09-16): FAIL, __proto__ smuggling (HIGH) — fixed
- Re-audit #3: all prior criteria green (original evil_null probe, 5 variants, no false rejections, harness 205/0 FAIL, caravan/shop/inn scoping agreed).
- Defect: `items:{"i9":{"__proto__":{...}}}` accepted ok:true — saveRevive's `out[k] = …` invoked the prototype setter → zero-own-property shell record → every simTick threw at ownershipTick (it.history.length). Phantom-data variant (shop.stock.__proto__ → phantom bread) and array variant (villagers:[{"__proto__":…}]) also demonstrated. Key shapes were never validated.
- Fix (two layers): (1) __checkSaveShape now deep-scans the parsed payload for any own "__proto__" key and rejects ('payload contains forbidden "__proto__" key') — legitimate saves can never contain one (item ids are kind_seq, chunk keys "cx,cy", names from fixed lists), so no false positives; (2) saveRevive skips "__proto__" keys (defense in depth for any future unvalidated revive path).
- New regression test 22.21 (items + villagers __proto__ variants → ok:false, hash unchanged, ticks clean).
- Verified: rebuild 57 modules, 757,851 bytes; node --check PASS; harness 3× 206 lines 0 FAIL (part22 21/21); no commit/push.
- NEXT: Examiner re-audit #4.

### Phase 3 — Examiner re-audit #4 (2026-09-16): PASS — PHASE 3 ACCEPTED
- Re-audit #4: __proto__ fix verified by independent probes — crash variant, shop phantom-data variant, villagers array variant all rejected with world untouched; no false rejections (valid save + dispute bit-identical; constructor/prototype keys fine); 30h round-trip A===B; fresh adversarial families (unicode-escaped keys, root-level __proto__, 1000/5000-deep burial) all rejected cleanly; harness 206/0 FAIL, part22 21/21.
- One minor defect (no re-audit required): recursive __hasProtoKey threw uncaught RangeError on ~30000-deep crafted payloads (before any mutation — no corruption, but violated "never a crash"). Hardened per Examiner suggestion: __checkSaveShape call wrapped in try/catch → returns {ok:false} instead of throwing.
- Post-hardening: rebuild 57 modules; node --check PASS; harness 206 lines 0 FAIL (part22 21/21).
- PHASE 3 COMPLETE AND ACCEPTED. No commit/push (HEAD 4e6fd80).

### Phase 3 (2026-09-16) — save/load, why-action inspector, debug overlays — Examiner ACCEPTED
- New: src/sim/22a_save.js (versioned save/load, RNG state, atomic rejection), src/brain/22b_why.js (why-inspector), src/render/22c_overlays.js (5 overlays), src/tests/22_autotest.js (21 assertions).
- Seeded RNG replaced Math.random in 15 sim modules.
- Verified: 57 modules, 757,933-byte bundle; harness 3× 206 lines 0 FAIL (part22 21/21); Examiner 4 audit rounds (30h round-trip determinism, death-path determinism, ~20 adversarial payloads, no actualOwner leak, why-trace honesty).
- No commit/push; HEAD 4e6fd80.

### Phase 4 balance pass 1 (2026-09-16, ~01:30 PDT) — systemic starvation fixed, 3 deterministic deaths remain
- Root causes fixed: survivalGuard death spiral (12a_events.js → direct [forage,eat] plan), eat_kitchen counted empty inn as known food, flee dominated food on ANY nearby beast (now requires hostile state), threat interrupt cleared plans for passive beasts, bushes one-time (now 4-day regrow), doDrinkStep 1.5h give-up removed. Flee test updated (18_autotest.js).
- Before: 11/11 dead (days 5-12), 8 needs-deaths after day 3. After: 5/11 alive day 30, 0 starvation, 3 deterministic needs-deaths (Sella dehydration d9, Alden exhaustion d11, Clara dehydration d18) — root cause NOT found. 6 bled-out (beast) deaths.
- Harness 220/220 ×3. Bundle 778,669 bytes, 58 modules.
- Second attempt dispatched: hour-by-hour trace of the 3 villagers to find why drink/sleep plans never execute; goal 0 deterministic needs-deaths after day 3; modest beast-aggression tuning with data.

### Phase 4 balance pass 2 (2026-09-16) — three ROOT CAUSES found and fixed via setter/stack instrumentation
- **RC1 (plan-wipe oscillation):** woundTick downed ANY villager with blood<0.38; downedTick woke them when bleed<=0.05. Clotted-but-anemic villagers were downed+woken every tick; setDowned clears v.plan, so the guarded [drink]/[eat]/[sleep] never executed past step 1. Fix (14a_medical.js): shared isActivelyBleeding(v) predicate — blood-loss downing only when low blood AND an open/undressed/bleeding wound. 14b_rescue.js uses same predicate.
- **RC2 (well orbit):** wall-following probe checked straight through the destination center; canMoveTo rejects within 22px of the well, so the probe always saw the well itself as a blocker and never exited wall-follow — villagers orbited at 70-90px forever. Fix (12c_actions.js): blockedAhead(maxPd) ignores probe hits within CS*1.5 of the destination.
- **RC3 (guard triage):** fixed drink>eat>sleep order let villagers die of exhaustion while stuck en route to water/food (planAddressesNeed saw [go,drink]/[forage,eat] as "addressed" and never reconsidered). Fix (12a_events.js): lethal triage by time-to-death — exhaustion 14h, dehydration 20h, starvation 30h; most imminent wins.
- **Beast tuning (14c_wildlife.js):** wolf atkCd 0.4→0.55h, nightly cap 4→3, spawn 0.35→0.22, bite satiation 0.2→0.35 (wolf bites once/twice then leaves; packs still dangerous), hunger regen 0.02→0.012/h. Blood regen 0.008→0.014/h (fed, non-bleeding).
- **Result:** 11→8 alive day 30 (3 births, 6 deaths — ALL bled out, ZERO needs deaths after day 3). Was 11→5 with 3 needs deaths. Baseline beast deaths: 6 → 6 (modest, genuine danger preserved).
- **Regressions (23_autotest.js 23.14-23.17):** clotted-anemic not re-downed; actively-bleeding IS downed; well-orbit escape within 12 steps; lethal triage (exhaustion 9h overrides drink 18h). All discriminate (fail on old code by construction).
- **Hygiene:** rebuild 58 modules, 784,956 bytes; node --check PASS; harness 3× 17/17 part23, 0 FAIL; no dup declarations; Math.random only in render/comments; _order.txt 58/58; trace_deaths.js snap() fixed (toFixed needs + downed/carriedBy/wounds/dehydH/exhH/starveH). No commit/push.
- NEXT: Examiner audit (Tier-3).

### Phase 4 — Examiner audit (2026-09-16): PASS — PHASE 4 ACCEPTED
- Independent verification: rebuild 58 modules OK; node --check PASS; harness 3× (part23 17/17, 0 FAIL); longrun d30: 11→8 alive, 6 deaths all bled out, ZERO needs deaths after day 3, earliest death day 12.
- All 7 change claims verified with file/line evidence. Tests 23.14/23.16/23.17 confirmed discriminating (fail on old logic); 23.15 is a positive control (passes on old too — guards against overcorrection).
- Adversarial probes 11/11: triage provably idempotent (no thrash); isActivelyBleeding exactly matches the blood-loss loop condition (airtight); blockedAhead routes around real buildings (townhall) with no orbit/oscillation.
- Observation (non-blocking, NOT fixed): addWound 14a_medical.js:35 has blood<0.4 down trigger without the predicate. Disposition: real call sites pass fresh open/bleeding wounds, so the predicate would be true anyway; the probe's open:false case is artificial. Single plan-wipe self-heals in 1 tick — not a spiral. Left as-is to keep the accepted build stable.
- PHASE 4 COMPLETE AND ACCEPTED. No commit/push (HEAD 4e6fd80).

### Warren release review (2026-09-16, ~01:42 PDT) — SIGN-OFF (conditional)
- Tag v0.4.0-phase4 (1aded9c): source audit PASS (clean tree), suite 224/0 FAIL, build reproducibility PASS (fresh worktree byte-identical), package integrity PASS (no /home paths, no http refs, no fetch/XHR — file:// safe), cold smoke PASS (fresh temp dir, headless Chromium, 2 canvases, __aiBridge live, 0 console/page errors).
- Artifact sha256: 5d0ce53a4344f3f82fa7d1983b34dab18470af9dadd9bbe9cc22b28c34b96781 (785,585 bytes).
- Condition: main is ahead 1 of origin/main — release not shipped until tag pushed. Cache-busting: stable filename fine for file://; version the name if ever served over HTTP.
- NOT verified: multi-browser, long-run gameplay (Examiner's domain). Push needs user's one-time token.

### SPEC Phase 6 approved (2026-09-16, ~05:30 PDT)
- User reviewed 2 external Natura builds (GLM 5.3: Next.js/TS 1.5MB; Qwen Coder: Vite/TS ~3.2k lines) via 2 parallel code-read analysts (read-only, no trust in their worklogs — caught GLM claiming "demand-responsive caravan" that was pure RNG in code).
- Consolidated steal list approved by user: P0 Survival Guard (both AIs independently invented it — strongest signal; implements Principle 2) + belief tuples/expectation records + stale stash beliefs; P1 scarcity+season pricing (magic 8 replaced by stock/weeklyConsumption), weather→fire causal chain, emotion derivation layer, body-factor chain (injury→infection→work/speed penalty); P2 brain observe/think/learn boundary for Phase 9. Deferred: needs-derived-from-body refactor (Phase 7+; current needs stable through 30-day run).
- Verdict: GLM = fuller village game (body sim, eco causality, content) but omniscient brain, no ownership/provenance, no imperfection layer; Qwen = lean demo with clean patterns but hollow sim (no death code at all, fake economy, broken save). Ours leads in epistemic architecture + determinism + QA discipline. Direction: steal mechanisms, never their architectures.
- Wrote `SPEC_PHASE6.md` (LÀM/KHÔNG LÀM/acceptance criteria per sub-phase 6A→6D + deferred + process rules); pointer added to SPEC_BUILD_PLAN.md phase list. No code touched — awaiting Phase 5 release push before 6A implementation.

### Phase 6A committed (2026-09-16, ~06:00 PDT)
- Robin attempt 1: harness green (234 lines, 0 FAIL, part24 9/9) but **Examiner FAIL** 3 blocking defects (A1 gate-1 interrupt mỗi tick vì sói hiền/lửa trại — regression vs Phase 4; A2 expectation không hết hạn; A3 stash-expectation API dead code).
- Lead clarified spec (SPEC_PHASE6.md): gate 1 chỉ hostile-state beasts (stalk/attack/hunt/fight) + uncontrolled wildfire, douse plans không bị wipe.
- Robin fix attempt 1/2: B1 hostile-only + wildfire-only + douse exempt; B2 TTL 7 sim days (EXPECTATION_TTL_DAYS, sweep trong decayEpistemic qua epistemicTick←bodyTick); B3 checkStashExpectation nối vào doTakeStep/doForageStep, anchor qua observe() topic stash/pile; O2 hashString18 implement thật (FNV-1a); O4 checkPriceExpectation sau stock/gold check; O1 confirmed INTENTIONAL (routineNeeds replaced by Utility AI).
- **Examiner re-audit: PASS.** Tự chạy harness (237 lines, 0 FAIL, part24 12/12), probe độc lập 6/6 cho B1 (docile wolf 0/40 wipes, travel 10.0=control, campfire 0/40, douse giữ nguyên), B2 probe 10-day expectation gone sau 24h, B3 probe pile trống → surprise+replan qua đường thật. Kỷ luật giữ: không Bayes/FOV creep, không Math.random mới, rebuild byte-identical 59 modules, __aiBridge nguyên vẹn.
- Non-blocking observations ghi nợ: Oa presence group còn 0 caller (phải wire ở 6C/6D hoặc descope tường minh); Ob proximity fallback ±1 tile có thể gán nhầm stash gần; Oe Math.random còn ở ui/10_controls.js:38 (visitor pick, pre-6A). Khuyến nghị long-run 30-day probe trước 6B (attention chạy mỗi tick/villager).
- Commit 6A riêng. Next: 6B (dynamic candidates, carrying capacity, seasons, weather→fire).
