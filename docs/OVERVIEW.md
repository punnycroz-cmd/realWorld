# WILLOWBROOK NATURA — Comprehensive Dossier
_Compiled: 2026-09-16. Status: developing Phase 6 ("Imperfect Humans")._
> Historical snapshot compiled 2026-09-16. For the current state, see `../WORK_LOG.md` (latest entries) and `../PROJECT_SUMMARY.md`. Live documents and the archive are indexed in `README.md`.
_Sources (paths updated to the reorganized layout): `docs/archive/SPEC_BUILD_PLAN.md`, `docs/archive/SPEC_PHASE6.md`, `docs/archive/thinking-process.md`, `../WORK_LOG.md`, `../src/MANIFEST.md`, `../GAME_DESCRIPTION.md`, `../PROJECT_SUMMARY.md`, `docs/archive/RIMWORLD_GAPS_BACKLOG.md` + cross-checked against code in `src/`. Anything that could not be verified is marked "unverified"._

---

## 1. Overview

**Willowbrook Natura** is a game simulating life in a medieval village, running entirely in the browser: **one single HTML file (`willowbrook_natura.html`), no server, no network, opens from `file://`**. The player doesn't control a single protagonist but **witnesses and guides the whole community**: villagers live, work, love, quarrel, fall ill, age, die — even when nobody is watching.

The core difference from a typical village game: every villager has a **genuinely simulated living body** (hunger/thirst/fatigue/temperature/oxygen/blood/illness obey biological laws, not abstract health bars) and a **layered cognitive architecture** (world state → perception → belief/memory → decision → action → consequence), strictly separating REALITY / PERCEPTION / MEMORY / KNOWLEDGE / BELIEF / CLAIM / EVIDENCE / UNCERTAINTY / CONTEXT. All current AI is **deterministic** (no LLM calls in-game); an LLM AI Brain is a future plug-in via `window.__aiBridge`.

**Origins:** combining "Willowbrook" (an existing web village game: pixel-art, 8 controllable villagers, daily schedules, economy) with the "Natura" philosophy (simulated living bodies, a world that truly reacts, death is real death). The original Natura build (v9, with AI brain via Ask API) is **STOPPED per the user's order** — do not restart it unless asked.

**Technical stack:**
- Source written in **plain JavaScript** (no framework, no ES modules in the output), split into modules in `src/` (67 modules (49 game + 18 test): `sim/`, `entities/`, `systems/`, `brain/`, `render/`, `ui/`, `data/`, `tests/`).
- Build: `python3 scripts/build_willowbrook_natura.py` concatenates the modules **in `src/_order.txt` order** into one `<script>` block in `willowbrook_natura.html`. All modules share one script scope → no duplicate top-level declarations allowed.
- Art: procedural pixel-art + AI raster (per the current directive: **never replace AI raster art with procedural**).
- Tests: `node devtools/node_harness.js` (run from project root) + open `willowbrook_natura.html?test` in a browser.

**How to play (summary):** sandbox, no fixed win condition. The player observes, clicks each villager to see body/skills/relationships/memories (Pawn Inspector), issues direct orders or types intentions in plain language ("go chop wood for winter"), assigns labour by aptitude, makes farming/building/trading/winter-stockpiling policy decisions, intervenes in emergencies (fire, wolves, the injured). Losing = the village withers; winning = self-defined.

---

## 2. Detailed features by system

### 2.1. Living body & needs (entities/02_body.js)
Every villager has a simulated body: **satiety (fullness), hydration (water), fatigue (tiredness), coreTemp (body temperature), oxygen (oxygen), blood (blood), injury, hygiene (cleanliness, 0..1, starts at 0.95)**. The utility AI scores on the deficits: hunger/thirst/fatigue/wounds/cold/social (+ hygiene via the bathing need, safety via risk modifiers).
- Life-or-death thresholds in `survivalGuard` (`sim/12a_events.js:123`): `fatigue ≥ 0.999` → sleep (time-to-death 14h); `hydration ≤ 0.02` → drink (20h); `satiety ≤ 0.02` → eat (30h). Ordinary alert levels: thirst `hydration < 0.12`, hunger `satiety < 0.10`, tiredness `fatigue > 0.96`, cold `coreTemp < 35.0`, hot `coreTemp > 39.5`, drowning (`drown_panic` + `oxygen < 0.3`).
- Real consequences: prolonged hunger → exhaustion → starvation; thirst → dizziness → death; over-fatigue → collapse unconscious; cold → shivering → frostbite → freezing to death; heat → heatstroke → heat shock; heavy bleeding → death; wet + prolonged cold → catching a cold/fever; raw meat 35% stomach ache; spoiled food → food poisoning.

### 2.2. survivalGuard — survival instinct
Runs every tick, **interrupting all plans** when a need hits a dangerous threshold to save oneself first (eat/drink/sleep/flee). Triages by **time-to-death** (exhaustion 14h / thirst 20h / hunger 30h — the threat closest to death is handled first, fix for bug #34). When the primary source fails (e.g. the inn runs out of bread) → fallback to natural foraging (fix for bug #28 death spiral). The player pawn (Marta, `isNPC:false`) is also guarded before player input is processed (fix for bug #18). The guard doesn't interrupt a running emergency/survival action.

### 2.3. Honest perception (brain/12b_perception.js)
Villagers only "know" what their senses honestly allow: distances in words ("a few meters away"), directions, weather/body sensations, reduced vision at night/in rain-storms. **No exact coordinates, no exact temperatures, no biology stats.** Phase 6A adds a **3-gate attention filter**: (1) startling sensations — uncontrolled fire/screams/hostile wolves-bears → preemptive interrupt; (2) need >75% → tunnel vision, filtering out objects that don't resolve the hunger/thirst; (3) current goal — only things relevant to the ongoing task enter interpretation/memory, the rest is background noise. The `__aiBridge.getPerception` contract is unchanged.

### 2.4. Utility AI + intent planner (brain/utility.js, brain/13a_intent.js)
Replaces rigid routines: each tick, a villager lists **candidate actions** from the verb set (eat, drink, sleep, work, cook, craft/recipe, clean, socialize, flee, douse, trade, warm, rest, leisure...) and scores them multi-factor:
- 6 need deficits (satiety/hydration/fatigue/injury/cold/social) + personality weights (industrious/lazy/sociable/cautious/brave/gluttonous) + distance/proximity cost + risk modifiers (nearby beast +120 flee, fire +80 douse/flee, night) + opportunity bonuses (caravan +55 trade, inn meal +18, fresh bread +18, ripe wheat +20).
- Deterministic tie-break via **FNV-1a seeded hash (`hashString18`)** — zero `Math.random()`.
- Honest failure chain: **FAILURE → OBSERVATION (thought records the reason) → INTERPRETATION → NEW KNOWLEDGE (blacklist `v.unreachable` with cooldown) → RE-EVALUATION → NEW ACTION** — never silently dropping an action.
- Don't know where food is → spawns an `explore_food` candidate (goes foraging) instead of pathing to an omnisciently-known pile (anti-omniscience, fixed from 2D).
- **Intent planner:** `postIntent(name, text)` turns plain language ("stoke the fire", "bury the dead") into real plans. Ununderstood intents → stored in `v.dreams`; repeated 3 times → logged as a global "capability gap" for the future AI brain to read.

### 2.5. Knowledge / Belief / Memory — epistemic store (brain/knowledge.js)
Each villager has `v.epistemic = { memories, beliefs, ownership, ... }`:
- Memory entry: `{ id, kind (observation/taught/belief/claim), topic, content, who, where, when, confidence 0..1, salience 0..1, evidence[], source (direct 0.95 / remembered 0.65 / hearsay 0.45 / claim 0.30), superseded, supersededBy }`.
- **Sim-time forgetting** with 3 personality presets: sharp (0.4x), average (1.0x), forgetful (2.5x); high salience lasts longer; pruned when confidence < 0.05; cap of 120 memories (dedupeWindowH 6h against spam).
- **Beliefs can be wrong/outdated/contradictory**, stored alongside world truth; new observations **supersede** old beliefs and **keep the history trace** (deep-clone evidence against aliasing — fix for bugs #10/#11).
- **Teaching** (`teach` verb): requires proximity (≤4 tiles) + both awake; the student receives knowledge as hearsay at 0.75x the teacher's confidence; children/pupils get +15% learning bonus.
- **Claims** (`claim` verb): a claim never changes world truth; bystanders who witness → record a hearsay memory.

### 2.6. 4-layer ownership + provenance + material lineage (systems/21a_ownership.js)
- **IDENTITY BOUNDARY:** important crafted items (plank, furniture) have a **stable id** (Chair #104: creator, quality, condition, material parentIds, tree lineage roots, full event history) + count mirror in inventory; bulk goods (food, wood, grain) stay count-based.
- **4 ownership layers:** `actualOwner` (world truth — only valid transfers change it) / `currentHolder` (who's holding it) / `knownOwner`+`suspectedOwner`+confidence+evidence+claims **per character**. `actualOwner` is never broadcast — the viewer-scoped bridge only returns belief-level.
- **Transfer engine** (`recordTransfer`): gift/sell/buy/inherit → holder+owner change; **steal → only holder changes** (the owner stays the victim); borrow → holder + `expectedReturnH`; return/lose/find/abandon → owner kept. Every transfer appends to the item's history + the world transfer log; participants/witnesses form beliefs/memories through 2D APIs.
- **Material lineage:** `getLineage(itemId)` → Chair #104 → Plank #77 → Tree #883 (stable tree ids, `ensureTreeId`/`recordFelledTree`).
- **Disputes:** conflicting claims → dispute; `resolveDispute` deterministic by evidence ladder (creation/direct observation > witnessed transaction/possession history > hearsay > bare claim); the village elder (Alden) judges, **may not judge his own case**; a third claimant may join; a post-ruling claim → new dispute (no rewriting history); mediation only orders POSSESSION, never rewrites actualOwner.
- Verbs: `steal` (with an awake witness within ≤12 tiles → caught red-handed, item stays + beliefs/memories/bonds; nobody sees → holder changes secretly), `borrow` (needs mutual bond ≥0.2, honest refusals), `giveback`, `mediate`.

### 2.7. Data-driven recipes + provenance (data/recipes.js, systems/16a_recipes.js)
`RECIPE_TABLE`: fell_tree → plank → furniture; harvest_crop → flour → bread; (extensions: flax→cloth→clothing, meat→smoked...). The `doRecipeStep` executor checks inputs/tools/skill/workstation; every output carries provenance (maker, ingredients, quality, condition, owner, time, usage history). Provenance **follows the item** through every hand (villager→pile→villager) via `p.prov`; `stripItemProvenance` cleans ghost records whenever inventory shrinks (drop/eat/burn/sell/craft/mend/build/cook/preserve/feed/recipe-inputs). Unreachable workstation → "Can't reach the X" thought + inputs kept intact (not silently swallowed).

### 2.8. Buildings as entities (systems/17a_buildings.js)
A house = full entity: `indoorTemp` (heating fire → 22–24°C, drops in winter), `cleanliness` 0..1 (decreases with occupants/cooking/animals, abandoned ≥3 days decays fast), `capacity` + overcrowding penalty, `owner`, `residents`, `hasFire`. Verbs: `expand` (6 logs + 4 stone → +2 capacity), `clean`, `demolish` (recovers 50% materials), `repair`. Functional structures: **barn** (livestock pen), **workshop** (crafting bench for recipes), **kitchen** (cooking fire), **inn** (Sleepy Stag Inn — lodging rooms + meal sales, Tobin serves). Deterministic river: drink/fish/bathe from the bank or bridge (`nearWater3`), the bridge auto-extends to high ground.

### 2.9. Economy: gold, Sella's shop, caravans (systems/13b_economy.js, 15c_caravan.js)
- **Gold per person**; Sella's shop buys/sells food/materials daily; Tobin's inn sells meals + lodging; market stall for in-village commerce.
- **Traveling caravans:** 1 caravan per season (1 spice trader + 2 guards) camps ~half a day–1 day: sells **salt, cloth, spices, iron tools** (things the village can't make itself), buys hides/smoked meat/eggs/farm produce. Guards chase off wolves → nights the caravan stays are peaceful nights.
- Phase 6D upgrades: **scarcity pricing** (price = floor × (1+scarcity) × seasonMult, scarcity = 1 − stock/weeklyConsumption), genuinely **demand-responsive** caravan (records sold-out → next trip brings more).

### 2.10. Two-faced social life (systems/12d_social.js, 15d_friction.js, 20_social_life.js)
- **Bright side:** talking within earshot → bond grows; working together, suffering together → closeness; visit (+0.05 bond), playing (children), hygiene routines (bathing `bathe` restores hygiene 1.0, cleaning).
- **Dark side:** `insult` (−0.12 bond + insult memory) → grudges accumulate + low bond → **hostility** (won't save/won't bandage each other) → **fistfights** causing real injuries but **stopping at knockdown, never killing**; bystanders intervene; apology via `speak` → reconciliation; grudges fade ~5%/day; bonds fade ~0.01/day after 3 days without contact.
- Social memory: who saved me / who hit me / which places are dangerous are all remembered.

### 2.11. Life stages, marriage, household, childbirth (systems/20_social_life.js, entities/12d_pregnancy.js, data/03_roster.js)
- 4 stages: **child (0–12)** — carries max 6 items (adult 20), barred from heavy work (fell/construct/demolish...), learns faster; **youth (13–17)**; **adult (18–59)**; **elder (60+)** — walks 0.75x, tires 1.35x faster, burns calories 0.85x, barred from the heaviest work.
- **Marriage:** 2 awake adults + bond ≥ 0.7 + within ≤ 4 tiles + unmarried → 2-way `spouseId`, wedding memories (salience 1.0) + witness beliefs; death → `spouseId` cleanly removed (no dangling).
- **Household** is an entity: shared house, members, `sharedInventory`, shared food preference (+0.15 to utility).
- **Childbirth:** only married couples + adult + awake + not starving; pregnancy **20 days**, 30-day cooldown after birth; all RNG seeded (`hashString18`) — zero `Math.random()`; `birthChild` uses the standard `createVillager` factory, records parentage (`motherId`/`fatherId`), household, birth memories for parents + witnesses.

### 2.12. Wild beasts (entities/14c_wildlife.js)
States: `wander / stalk / attack / flee / fight / eat`. **Wolves** hunt in packs at night — fear fire/torches/crowds/brave people; **boars** leave you alone, approach and they charge; **bears** rare but extremely dangerous, follow the smell of food. Villagers seeing a hostile wolf → run indoors; cornered → fight back with tools + shout for help. `hunt` → butcher → meat + hides. Phase 4 balance: wolf atkCd 0.55h, cap 3/night, spawn 0.22, 1–2 bites then full and retreats. Phase 6B adds 2-state wolves: normal ones fear fire; **extremely hungry ones overcome fear**.

### 2.13. Weather, fire, firefighting (sim/12d_world.js, systems/15e_firefight.js)
Day/night cycle, 4 seasons (winter: fields die, lake freezes, wolves get bold; summer: heatstroke, meat spoils 1.6x, lightning), weather sun/clouds/rain/storms/lightning. Lightning strikes → casualties + fire; wildfire spreads with wind/dryness; rain douses small fires but wets clothes (warmth lost). Villagers **fight fire themselves** (`douse`): hauling water from the well/lake, prioritizing **house → person → field → distant forest**; fire right next to them → still flee first; thick smoke → suffocation. Phase 6B adds the weather→dryness→fire causal chain (dryDays counter, fuel by terrain, wind) — stolen from the GLM build.

### 2.14. Medieval medicine + downed/rescue (systems/14a_medical.js, 14b_rescue.js)
No hospitals/antibiotics. Detailed wounds by location (arm/leg/torso/head) + severity + bleeding; **blood is a real resource** — heavy loss can kill; open wounds unbandaged → infection → fever → death. Craftable: **herbal poultice** (stops bleeding, fights infection), **wooden splint + cloth** (broken bones — a broken leg means crawling only, needs splint + enough food + many days of rest), **fever tea**. The `tend` verb (bandaging by medical skill). **Downed:** unconscious/bleeding/broken leg → `rescue` carries them to bed (walks 0.45x); kin rescue on their own when safe. The `isActivelyBleeding` predicate prevents the faint-wake loop that wiped plans (fix for bug #32).

### 2.15. Skills, XP, work assignment (systems/14d_skills.js)
8 skills 0–10: farming, cooking, construction, medicine, hunting, fishing, foraging, sewing. XP from **real work**; each person has **aptitude matching their role** (Wren excels at medicine, Finn at fishing). Level affects speed/yield/quality. 10 productive actions in a craft → **occupation** (+25% efficiency, measured fishing ratio = 1.25 — fix for bug #13 dead code). `assignWork(name, job, priority)` lets the player/AI assign work.

### 2.16. Construction & clothing (systems/14e_construction.js)
Building costs **real materials** (wood from felled trees, stone from quarries, straw); novice builders are slow + low durability; structures have their own durability, storms/fire/wolves damage → `repair`. Layered clothing (undershirt/outer/shoes/winter cloak): its only but vital function is **warmth retention**; when wet it loses most of it (PROJECT_SUMMARY says 60%, GAME_DESCRIPTION says "loses all" — not unified, see §8.3); worn long it tears → `mend` to patch or sew new from cloth (bought from caravans) / hides.

### 2.17. 3-tier meals + preservation (systems/15a_food.js)
3 meal tiers (poor/fine/lavish) by skill + ingredient variety — good meals keep you full longer. **Raw meat 35% stomach ache**; food spoils by day (1.6x in hot weather); poisoning from spoiled/carelessly cooked food. `preserve`: **salt-curing / smoking** keeps meat for dozens of days — the key to surviving winter.

### 2.18. Husbandry (entities/15b_husbandry.js)
`tame` tames **chickens and piglets** with food (skill-based; adult boars can't be tamed); fenced pens (wolves can't enter) + regular feeding → hens lay more eggs, sows farrow; **starved → sick → gone feral**. Hunting → meat + hides (hides sewn into clothing, sold to caravans).

### 2.19. Save/load (sim/22a_save.js)
Versioned save/load of **all real sim state**: clock/weather, chunks, full villager records (body/needs/skills/bonds/inventory/plans/pregnancy/wounds/memories/epistemic/thoughts/why-trace), item registry + id counters, transfer log, piles/fires/crops/chickens/wildlife/livestock, caravan/shop/inn, households, event log, UI indices, **RNGS.s** (seeded RNG stream → continues bit-identical). Autosave every sim day + manual slots (localStorage, in-memory fallback). **Atomic**: validates on a temp copy, only overwrites when valid; bad version/JSON/shape → refused without mutating the world; blocks `__proto__` smuggling on 2 layers; payload depth limit.

### 2.20. Why-inspector (brain/22b_why.js)
Wraps (doesn't replace) `evaluateVillagerUtility`, recording each villager's latest **decision trace**: winner, top-6 candidates + scores, need deficits + personality + night flag, per-candidate distance. `__aiBridge.explainAction(name)` → plan + decision + beliefs used (belief-scoped, no actualOwner) + most recent failure thought. "🧠 Why this action?" panel in the Pawn Inspector.

### 2.21. Debug overlays (render/22c_overlays.js)
5 independent overlays, **off by default** (no draw cost when off): needs bars, ownership labels (belief-scoped), belief-confidence view, building/farm zones, event feed. 🛠 Debug button + checkbox panel.

### 2.22. __aiBridge — door for the future AI brain (brain/09_bridge.js)
`listVillagers, getPerception, postAction, postIntent, setBrainControlled, assignWork/getWork, getEvents, getDreams, getCapabilityGaps, getBeliefs, getMemories, getOwnershipBeliefs, observe, teach, claim, explainAction, saveGame/loadGame/worldHash/hasSave, debugOverlays, getLifeStage, getHousehold, getRelationships, getOccupation`. Every getter is **viewer-scoped**: the AI only receives that character's beliefs, never world truth (fix for bugs #20/#21).

---

## 3. Architecture & engineering discipline

See `../PROJECT_SUMMARY.md` §2 for the canonical architecture (modular `src/` layout, bundler, build, test harness, iron rules) and `../src/MANIFEST.md` for the full module map. Live-world test discipline lives in §7 below (team & process).

---

## 4. Bug history & fixes (35 bugs by phase)

> Condensed table. The full original record is Part 1 of `docs/archive/thinking-process.md`.

*Common thread: most serious defects were NOT caught by Robin's test suite (suite green, but the Examiner's independent probe still found them). → Mandatory Tier-3 process: adversarial Examiner audit, never trust the worker's self-reported green.*

### Phase 1 — Modularization
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 1 | Flaky fire test: firefighter stuck outside the barn wall | Collision treated the wall base as an absolute barrier | Deterministic test: fixed seed, controlled setup | In real life people toss buckets from 2–3m, not hug the fire's center |
| 2 | Duplicate `paBlob` declaration when merging the renderer | Manual file merge | Removed duplicate, kept one copy | Wrap primitives in an isolated namespace |
| 3 | Wrong baseline count 140 vs 70 | Double-counting in 2 log passes | Standardized: 70 checks, 10/10 green runs to accept | The harness clearly separates suite/case/assertion |

### Phase 2A — Recipes + provenance
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 4 | Provenance lost on villager→pile→villager; ghost records | `doDropStep` didn't write provenance down to the pile; `v.itemProv` kept ghost records | `strip/add/movePileProvenance` helpers; `p.prov` mirrors `p.items`; clean ghosts whenever inventory shrinks | An item's lineage follows the item, not the person |
| 5 | Unreachable workstation → silent cancel, inputs vanish | No failure feedback | "Can't reach the X" thought + inputs kept intact | failure→observation→knowledge chain, no silent swallowing |

### Phase 2B — Building entities
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 6 | River drowned the east bank; bridge dead-ends mid-deep-water | `getRiverCenter` depressed both banks | Dry-land corridor on both sides; bridge auto-extends to high ground | Medieval folk don't build bridges into rushing water |
| 7 | Drinking/fishing required wading fully into the water | `doDrinkStep`/`doFishStep` demanded `depth > 0` | `nearWater3(v)`: interact from bank/bridge/well | People bend from the bank; they don't jump into a cold river to drink |
| 8 | "demolish the old hut" → demolished the wrong Sleepy Stag Inn | Fallback demolished the nearest structure when the name wasn't found | Unknown proper name → no-target + honest fail; fallback only for 'home'/'nearest' | No sane builder smashes the tavern because he couldn't find the shed |

### Phase 2C — Utility AI
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 9 | Each tick re-triggered an old failure → valid fire/pile blacklisted forever, plan churn | `handleActionFailure` scanned the old `thoughts` array | Snapshot the thoughts-array identity before the tick; only handle when replaced in the current tick (+ regression test 18.13) | Tripping once at a door doesn't make people avoid that door for life |

### Phase 2D — Knowledge/Belief/Memory
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 10 | New info about durability/price silently overwrote, losing belief history | `isContentConflicting` only compared 5 hardcoded keys | Any shared key changing value → supersede + keep history | People remember they thought the thing was intact before seeing it broken |
| 11 | Today's evidence mutated old memories | Shallow copy of the evidence array | Deep-clone evidence+content when freezing into `v.epistemic` | Today's evidence doesn't crawl back into last week's journal |

### Phase 2E — Social life (Examiner FAIL round 1, 6 defects)
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 12 | `doChildcareStep` raised child satiety without decrementing the store → **food from nothing** | No store lookup/decrement | Must draw from pocket/family store; empty → honest fail | Raising children is the household's biggest food burden — "magic" is absolutely banned (the ancestor of Principle 4) |
| 13 | `calcOccupationBonus` (+25%) was dead code | No system called it | Wired into real executors; measured fishing ratio = 1.25 | A title with no effect = garbage (lesson reused in Phase 6C identity) |
| 14 | Unmarried conception via fallback (nearest man with bond>0.7) | Sloppy fallback logic | Only married couples + adult/awake/not starving | A medieval village under the parish's eye has no casual pregnancies |
| 15 | `Math.random()` in pregnancy; old/ill still conceived | Unseeded RNG + missing gates | Seeded `hashString18` + age/menopause/malnutrition/bedridden gates | A body suspends ovulation under severe malnutrition on its own |
| 16 | Failed `marry` → command silently vanished | No failure path | Explanatory thought + negative emotion + bond drop | Rejected marriage is a shock — nobody calmly goes chop wood after |
| 17 | `{verb:'go', person}` → villager at **(NaN, NaN)** then died of thirst | person→coords never resolved | Resolve before moving; reject non-finite | A math error must not dissolve a body into the void |
| 18 | Marta (player pawn) died of thirst next to the well in a headless run | `updatePlayerPawn` didn't call `survivalGuard` | Guard runs before player input | The survival instinct is unconditional — it doesn't wait for "orders from above" |

### Phase 2F — Ownership (Examiner FAIL round 1, 2 blocking)
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 19 | Third plaintiff with original evidence ignored | Dispute froze the two parties when opened | Late claimant becomes a full party; post-ruling claim → new dispute | The village court judges by facts, not by a fixed array |
| 20 | `__aiBridge` leaked `actualOwner` to all outside queries | `summarizeItem` returned world truth | Viewer-scoped getters: only belief + confidence | Nobody looks at an axe in the woods and instantly knows its legal owner |
| 21 | "ownership stays Y" log leaked the true owner in a witnessless theft | Transfer log wrote the victim's name directly | Sanitize at the bridge boundary; internal world history kept intact | The public log only records what someone witnessed |

### Phase 3 — Save/load (lead implemented; Examiner 4 rounds: 3 FAIL → PASS)
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 22 | Villager being `otherPerson`-watched → `null` on save | `WeakSet` anti-recursion in the clone | Separate transient refs from durable entities before serializing | A census must not evaporate breathing people |
| 23 | Post-load skin/hair colors shifted | `_ci` recomputed itself | Save/restore the seed + baked indices intact | Nobody wants to wake up with swapped hair color |
| 24 | Feed overlay died when toggled independently | Renderer blocked DOM updates without a canvas overlay | Split DOM updates into an independent process | — |
| 25 | Corrupt file but the world was already deleted before the error was reported | Load not atomic | Validate on a temp copy; only overwrite when valid | "The clerk burns the village before checking whether the new ledger is readable" |
| 26 | 2-layer `__proto__` smuggling → forged stock/crash | Key shapes not validated | Reject `__proto__`/`constructor` at the parser | — |
| 27 | 30k-deep payload → RangeError | Unbounded recursion | Depth limit + try/catch at the intake layer | — |

### Phase 4 — Long-run balance (2 passes)
| # | Symptom | Cause | Fix | Lesson |
|---|---|---|---|---|
| 28 | Hungry → guard forced inn purchase → inn out of bread → buy loop → **starved to death in front of the empty counter** (11/11 died in pass 1) | No fallback when the primary source fails | Primary source fails → natural foraging | A farmer seeing the inn out of stock digs roots in the woods — he doesn't queue up to die of hunger |
| 29 | Rabbits/deer/birds also triggered flee → cut across survival plans | Every animal caused panic | Only hostile predators cause panic | A farmer doesn't sprint for his life because a rabbit nibbled grass |
| 30 | Berry bush harvested once → gone forever | No regrowth | Keep the bush root, regrow in 3–4 days in warm seasons | Berry bushes are perennials, not ore veins |
| 31 | Dying of thirst still gave up after 1.5h (hard drink timeout) | Hard countdown | Drop the timeout; only cancel when the source is destroyed/attacked | A dying-of-thirst person doesn't quit because "the 90-minute timer ran out" |
| 32 | Low blood faint → wound had stopped bleeding so woke instantly → faint again → each faint wiped the plan (seizing in place) | Downed at blood<0.38 regardless of wounds | `isActivelyBleeding`: only down when the wound is actually bleeding; deep faints last hours | A blood-loss person lies unconscious for hours — doesn't spring up like a jack-in-the-box |
| 33 | Wall-following treated the very well-target as an obstacle → **orbited the well to death by thirst** | Probe aimed straight at the target's center | Ignore the target object's collision within 1–1.5 tiles interaction range | Wanting to draw water but becoming a satellite of the well's mouth |
| 34 | 2h from death by exhaustion still forced to walk to the far well → collapsed on the road | Hard triage drink→eat→sleep | Triage by **time-to-death** (exhaustion 14h / thirst 20h / hunger 30h) | A doctor prioritizes the threat nearest to death, not the administrative category |
| 35 | Overtuned wolves: 0.4h attack cooldown, 4/night → massacred the whole village | Beast stats too high | atkCd 0.55h, cap 3/night, spawn 0.22, 1–2 bites then full and retreats | Medieval wolves fear fire/torches/human voices; they don't exterminate a guarded settlement |

### Phase 6A — implementing (Examiner FAIL round 1, 3 blocking — on fix attempt 1/2)
| # | Symptom | Cause | Direction of fix |
|---|---|---|---|
| A1 | Gate-1 interrupt **every tick** from calm wolves and campfires → villager moved 9.56 tiles vs 40-tile control; douse plan wiped | `perceiveSurroundings` tagged threat for EVERY wolf/bear regardless of state, `isFire` for EVERY fire; Robin deleted the Phase 4 warning comment | Only hostile states (stalk/attack/hunt/fight) + wildfire trigger; douse plan not wiped (spec updated by lead) |
| A2 | Expectations **never expired** | `decayEpistemic` never touched `v.epistemic.expectations`; no TTL constant | Add expiry sweep + discriminating test (learnedTick 10 days ago → expired) |
| A3 | Expectation location/presence API **dead** (0 in-game callers, only price wired) | Not wired into gameplay yet | Lead decision: wire `checkStashExpectation` into real take/forage (not descoped) |

---

## 5. Direction

### 5.1. Nine guiding principles

See `PRINCIPLES.md` for the canonical version (extracted verbatim from Part 4 of `docs/archive/thinking-process.md`; read before every implementation task — violation → stop and ask the user).

### 5.2. Executive Producer's strategic assessment (2026-09-16)

See `docs/archive/thinking-process.md` Part 5 for the canonical verbatim version.

### 5.3. Phase 6 — "Imperfect Humans"

Phase 6 completed 2026-09-16 (6A→6D, Examiner PASS). See `docs/archive/SPEC_PHASE6.md` for the canonical spec and `../WORK_LOG.md` for the implementation record.

### 5.4. Far roadmap

See `../SPEC_PHASE7.md` for the canonical roadmap (Phases 7–9: institutions, inter-regional economy, AI Brain) and `docs/archive/RIMWORLD_GAPS_BACKLOG.md` for the "revisit later" backlog.

---

## 6. Current status

Historical snapshot — for the current status see `../WORK_LOG.md` (latest entries at the end of the file).

- **Original Natura (v9): STOPPED** per the user's order — do not restart unless asked.

---

## 7. Team & process

| Role | Who | Duty |
|---|---|---|
| Lead (PM + tech lead) | Friend (Muse) | Architecture, briefs, audits, decisions, final verification, reports. The only one who talks to the user. |
| Junior dev | **Robin** = agy CLI (Antigravity) | Implements per brief. Persona `team/dev-robin.md` auto-applied via `~/workspace/agents/agy.sh` (currently unjailed — keep prompts scoped to the project). 30m print timeout. |
| Adversarial QA | **The Examiner** | Tier-3 audits: runs the code to verify itself, PASS/FAIL verdicts with file/line evidence, **never fixes code**, never trusts the worker's self-reported green. |
| Art director | Sylvie Moreau | Direction only (no redraws). Not engaged yet — no art changes so far. |
| Release engineer | Warren Stone | Ship checklist (clean build, artifact, cold smoke test, checksum). Never fixes. **Nothing ships red.** |
| Executive producer | User | Final say on vision, taste, what ships. |

**Review tiers:** Tier 1 (docs/config — lead eyeball) · Tier 2 (isolated script/tool — lead + targeted test) · Tier 3 (game logic/shared framework/economy/save/shipping — **full Examiner audit**).

**Iron rules:** dev never ships directly (everything through lead review) · examiner never fixes code · Sylvie never redraws · Warren never fixes · max **2 attempts** per task before lead re-scopes/does it himself · batch small tasks (each agy call costs ~13k-token overhead) · agy quota is the scarce resource (bucket ~5h + weekly cap) · "Agreement is not evidence" — every handoff must state **verified vs claimed** · commit/push stays on the user's git side (needs the user's token).

**Live-world test discipline (learned in blood):** wrap snippets in `(function(){...})()` (top-level const causes "already declared" on the 2nd evaluate) · maintain survival needs in the same evaluate when advancing time · white-box tests preferred · `simTick(24)` is not a neutral time machine · clean up temp villagers after each test · **never test in the canonical settlement / restart real minds**.

---

*End of dossier. Cross-reference sources (paths updated to the reorganized layout): `docs/archive/SPEC_BUILD_PLAN.md`, `docs/archive/SPEC_PHASE6.md`, `docs/archive/thinking-process.md` (Parts 1–6), `../WORK_LOG.md`, `../src/MANIFEST.md`, `../GAME_DESCRIPTION.md`, `../PROJECT_SUMMARY.md`, `docs/archive/RIMWORLD_GAPS_BACKLOG.md`, `../src/` code.*

---

## 8. Known documentation issues — ALL FIXED (2026-09-16, per the user's order)

> Found while compiling the dossier (2026-09-16). The user's decision: temporarily don't fix the source docs, just note them here. **The lead will re-raise these 3 (+1) issues for fixing after the agents finish all of Phase 6 (6A→6D).** → Phase 6D committed 2026-09-16, the user ordered the fix → **all 4 fixed the same day**, details below.

- **8.1. `PROJECT_SUMMARY.md` badly outdated — FIXED 2026-09-16.** Rewritten: modular architecture (`src/`, 62 modules, `src/_order.txt`; `scripts/build_willowbrook_natura.py` is just the bundler), bundle ~977 KB, the "iron rule" corrected to "only edit `src/`, rebuild the bundle, never hand-edit HTML"; test suite → 263 lines, 0 FAIL, PART 12–27 + Examiner Tier-3 audit; git → HEAD `05caf95` (Phase 6D), committed, not pushed; added Phase 2–6 summaries (2A–2F, 3, 4, 5, 6A→6D) and §7 "Canonical needs model". Updated date → 2026-09-16.
- **8.2. `GAME_DESCRIPTION.md` roster mismatch — FIXED 2026-09-16.** Roster §5: 8 → **9 villagers**, added Clara's line (silk merchant — matches `src/data/03_roster.js`); intro "community of 8 villagers" → 9. Removed "Gareth (the brave one)" from §12 (Gareth doesn't exist in roster/code); also removed the "dog" in the same sentence since the game has no dogs (grep `src/` only matches `doGiveback` on substring). Remaining sentence: "Afraid of fire, afraid of crowds." Also removed "fear of Gareth" in `PROJECT_SUMMARY.md` §3.
- **8.3. "Wet clothing" contradiction — FIXED 2026-09-16 (checked against code).** Code is the authority: `clothingInsul()` at `src/systems/14a_medical.js:126` — `wetness > 0.4` → `s *= 0.4`, i.e. **wetness removes 60% of warmth retention (40% remains)**. `PROJECT_SUMMARY.md` saying "60%" was correct, kept as-is. `GAME_DESCRIPTION.md` saying "loses all"/"loses warmth retention" was wrong → fixed all 3 places (lines 41, 97, 263) to "loses 60% of warmth retention", line 263 states the formula + code file explicitly.
- **8.4. "8 needs" not tightly mapped to code — FIXED 2026-09-16 (clarified, not invented).** Conclusion: **there is no official "8 needs" list in the code.** `brain/utility.js` computes 6 named deficits (`satiety, hydration, fatigue, injury, cold, social`) + risk modifiers; the body sim tracks 7 physiological states (hunger/thirst/fatigue/temperature/oxygen/blood/illness). The number "8" in `WORK_LOG.md:598` was just the count of need-death cases in an old test run, not a needs list. This canonical model was recorded in `PROJECT_SUMMARY.md` §7 so Phase 6E/7 have a single reference point.
