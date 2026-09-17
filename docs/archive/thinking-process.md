# THINKING PROCESS — Willowbrook Natura: From Bugs to the Philosophy of "Imperfect Humans"

> **Purpose of this file:** records the entire thought process behind the decisions — the 3 parts below — so every future action (especially Phase 6) has something to check against.
> **Rule:** before doing any Phase 6 task, read "Part 4: Guiding Principles" and check whether the task violates any principle. Violation → stop, ask the user.
> **How to read:** Part 1 is the event log (what happened). Part 2 is agy's realism review (why it is "gamey"). Part 3 is the debate on the new direction (what to do next). Part 4 is the crystallization into actionable principles.
>
> Created: 2026-09-16. Final decision-maker: user (executive producer). Compiled by lead: Friend.

---

## Part 1 — Bug History (Original Record, Detailed)

**Source file:** `WORK_LOG.md` (623 lines) — a per-phase journal. Below is the detailed record of each bug: who found it, its nature, what mechanism fixed it, and the acceptance result.

**Notable common pattern:** most severe defects were NOT caught by Robin's test suite (suite green, yet independent Examiner probes still found bugs). Lesson recorded into process: Tier-3 mandates adversarial Examiner audits; never trust a worker's self-reported green.

### Phase 1 — Modularization (splitting the monolith → 40 modules)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 1 | Flaky fire test: the firefighter got stuck outside the wooden barn wall, unable to reach the burning cell | Dev (Robin) while running the suite | Made the test deterministic: fixed RNG seed, controlled map setup |
| 2 | Duplicate `paBlob` declaration when merging the renderer file | Dev during build | Removed the duplicate declaration, kept a single copy |
| 3 | Baseline miscount 140 vs 70 (double-counted across 2 log passes) | Lead during cross-check | Standardized: 70 checks, accept only after 10/10 consecutive green runs |

### Phase 2A — Data-driven recipes + provenance (43 modules, suite 80/80)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 4 | Provenance lost on villager → pile → villager; ghost records (the dropper keeps "ghost records") | Examiner audit round 1 (CONDITIONAL PASS, 2 defects) — hostile probe: mixed-kind piles, taking more than records | Wrote a helper that carries provenance with the item through every transfer path; cleaned ghost records when the item leaves the hand |
| 5 | Unreachable workstation → silent cancel, inputs vanish | Examiner (same round) | Thought explaining the failure reason + inputs preserved, nothing swallowed |

*Re-audit: Examiner rebuilt independently (427,497 bytes), probe 14/14 → PASS, Phase 2A accepted.*

### Phase 2B — Building entities + new locations (45 modules, suite 91/91)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 6 | River algorithm `getRiverCenter` drowned the entire east bank; the wooden bridge dead-ended mid deep-water (wx=30) | Dev/lead during implementation (pre-audit) | Generated a dry-land corridor on both banks; the bridge auto-extends until anchored on high ground |
| 7 | `doDrinkStep`/`doFishStep` demanded `depth > 0` → the whole body had to wade into the water to drink/fish | Dev/lead during implementation | Water-source interaction checked within the bank/bridge/well radius; no forcing into the water cell |
| 8 | `findBuildingTarget("the old hut")` not found → fallback demolished the nearest structure = the Sleepy Stag Inn tavern | Examiner audit (CONDITIONAL PASS, 1 defect) | Named target not found → return no-target + honest fail; fallback only for generic requests (home/nearest) |

*Re-audit: independent rebuild 466,715 bytes, suite 91/91 ×3 runs, probe 21/21 → PASS.*

### Phase 2C — Utility AI (47 modules, suite 112/112)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 9 | `handleActionFailure` scanned the stale `thoughts` array → re-triggered every tick, permanently blacklisted valid targets (campfire, bed), churned plans | Examiner audit (CONDITIONAL PASS, 1 defect) — suite 18.5 only covered the single-shot path, so it was blind | Captured the thoughts-array identity before the base tick; only processed when the array was replaced in the current tick. Added regression test 18.13 (discrimination test proving the old bug is caught) |

*Re-audit: rebuild 512,702 bytes, probe 12/12 → PASS.*

### Phase 2D — Knowledge/Belief/Memory (49 modules, suite 128/128)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 10 | `isContentConflicting` only compared 5 hardcoded keys (`kind, where, owner, amount, status`) → new information about durability/price silently overwrote, belief history lost | Examiner audit (CONDITIONAL PASS, 2 defects) | Any shared key changing value → creates a superseding belief, history preserved intact |
| 11 | Shallow copy of the evidence array in `observe` → adding evidence today retro-mutated past memories | Examiner (same round) | Deep-clone all evidence + content when freezing into `v.epistemic` |

*Re-audit: rebuild 556,720 bytes, part19 15/15 → PASS. Added observation dedup + bounded memory.*

### Phase 2E — Social life (51 modules, suite 155/155)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 12 | `doChildcareStep` raised the child's satiety without deducting any stock → created food from thin air | Examiner audit (FAIL, 6 fixes required) — suite 143/143 green but the independent probe was blind | Mandatory food sourcing from the family bag/store; empty store → honest fail |
| 13 | `calcOccupationBonus` (+25% occupation efficiency) was dead code, called by no system | Examiner (same round FAIL) | Wired into real production; measured fishing output ratio = 1.25 |
| 14 | Pregnancy without marriage (fallback to nearest male with bond > 0.7) | Examiner (same round FAIL) | Married couples only + adult/conscious/not starving |
| 15 | Unseeded `Math.random()` in pregnancy; old/sick villagers could still conceive | Examiner (same round FAIL) | Seeded RNG (`RNGS.s`) + blocked by age/menopause/malnutrition/bedridden illness |
| 16 | `marry` failed → the command silently vanished, no thought | Examiner (same round FAIL) | Explanatory thought + negative emotion + reduced bond |
| 17 | `{verb:'go', person}` failed to resolve coordinates → `undefined` into `planMoveToward` → villager `(NaN, NaN)`, then died of thirst | Examiner (same round FAIL) | Resolve person → real coordinates before moving; reject non-finite |
| 18 | Marta (player pawn, `isNPC:false`) died of thirst in a headless run because there was no `survivalGuard` | Lead during headless testing (regression after fix) | Player pawn receives survival instincts before player input is processed |

*Re-audit: rebuild 626,807 bytes, part20 26/26 → PASS, Phase 2E accepted.*

### Phase 2F — Ownership & provenance (53 modules, suite 178/178)

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 19 | Dispute fixed to 2 parties at filing → a third claimant bearing original evidence was ignored | Examiner audit (FAIL, 2 blocking) | Late claimant becomes a full party; new claim after ruling → new dispute, never rewrites the old result |
| 20 | `summarizeItem` returned the true `actualOwner` to every external query via `__aiBridge` | Examiner (same round FAIL) | Viewer-scoped getter: returns only belief-level ownership + confidence |
| 21 | Transfer log wrote "ownership stays Y" → leaked the true owner in a witnessless theft | Additional review during the fix round (lead) | Bridge sanitize copy for steal/find/abandon; internal world history untouched |
| — | A claimant mayor judged their own case | Additional review | Excluded the claimant mayor from the judge's seat |
| — | The dead-input guard generated meaningless borrow/steal candidates | Additional review | Replaced with a real craft-input check |

*Re-audit → PASS, Phase 2F accepted.*

### Phase 3 — Save/load, why-inspector, overlays (57 modules, suite 206/206) — lead implemented directly, Examiner audited 4 rounds

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 22 | Anti-recursion `WeakSet` in save clone → a villager currently being viewed by `otherPerson` was nulled on save | Examiner rounds 1–3 | Separated transient action refs from persistent entities before serializing |
| 23 | Loading a save recomputed `_ci` → villager skin/hair color drifted | Examiner | Saved/restored the seed + baked visual indices intact |
| 24 | Feed overlay died when enabled alone (renderer blocked DOM updates when no other canvas overlay was on) | Examiner | Split DOM update into an independent process |
| 25 | Non-atomic load: corrupted file (`chunks:[42]`, `villagers:[null]`, `items:{x:null}`) but the world was already wiped before the error was reported | Examiner (3 levels: field → element → object-map-value) | Atomic: validate on a temporary copy; only overwrite once everything is valid |
| 26 | Two-layer `__proto__` smuggling → forged stock/phantom records or crash | Examiner | Rejected `__proto__`/`constructor` at the parser |
| 27 | 30k-deep nested payload → recursive RangeError | Examiner | Depth limit + try/catch at the intake layer |

*Round 4: PASS + 1 minor hardening. All rejection paths fail cleanly, no world mutation.*

### Phase 4 — Long-run balance (30-day deterministic run) — 2 implementation passes, Examiner audit

| # | Bug | Found by | Fix mechanism |
|---|-----|---------------|------------|
| 28 | SurvivalGuard death spiral: starving → forced to buy at the tavern → tavern out of bread → next tick forced to buy again → starved to death in front of an empty counter (11/11 died in pass 1) | Lead while running the 30-day run (pass 1) | When the primary source fails → fallback to natural foraging |
| 29 | Every animal (even rabbits/deer/birds) triggered flee → interrupting survival plans | Lead (pass 1) | Only hostile predators cause panic |
| 30 | Berry bushes vanished forever after one harvest → resources exhausted within days | Lead (pass 1) | Kept the bush root; regrows after 3–4 warm-season days |
| 31 | Hard 1.5h drink timeout → a villager dying of thirst would give up and turn away | Lead (pass 1) | Removed the hard timeout; cancel only when the source is destroyed or under attack |
| 32 | Low blood fainted (`downedTick`), the wound had already clotted so the next tick woke immediately; still-low blood → fainted again; each faint wiped the plan (seizing in place) | Lead while analyzing the root cause (pass 2) | `isActivelyBleeding`: go down again only when the wound is actually bleeding; deep faint lasts hours |
| 33 | Wall-following treated the destination well itself as an obstacle → walked circles of 70–90px radius around the well until dying of thirst | Lead (pass 2) | Ignored collision with the destination object within the 1–1.5-cell interaction range |
| 34 | Rigid drink→eat→sleep triage order → a villager with 2h left before dying of exhaustion but 15h before dying of thirst was forced to trek across the village for a drink | Lead (pass 2) | Prioritized by time-to-death: exhaustion 14h / thirst 20h / hunger 30h |
| 35 | Wolves overtuned: 0.4h attack cooldown, 4 per winter night → massacred the whole village within nights | Lead (pass 2) | Reduced spawn/night cap/attack frequency; bite 1–2 times then retreat |

*Final result (verified): 11 → 8 alive, 3 births, 6 deaths (all bleeding after animal attacks), 0 starvation/thirst/exhaustion deaths after day 3. Examiner PASS. Release tag `v0.4.0-phase4` at commit `1aded9c` — SHA-256 artifact `5d0ce53a4344f3f82fa7d1983b34dab18470af9dadd9bbe9cc22b28c34b96781` — **not pushed yet** (needs a fresh one-time GitHub token, not stored). Warren conditional sign-off: not considered shipped until push + reverify.*

---

## Part 2 — agy's Realism Review (2026-09-16, full)

**Reviewer:** Robin (agy). **Reference docs:** `WORK_LOG.md`, `SPEC_BUILD_PLAN.md`, `src/` code. **Mode:** REVIEW ONLY.
**Method:** each bug rated on 3 points — (1) how many points (1–10) for how realistically the underlying logic modeled real life + explanation, (2) the unrealistic part, (3) improvement suggestion. Honest, sharp, no flattery.

**Average score: 1.7/10.** Lead's correction: this score rates **behavior while the bug was live** — it measures the "gameyness" of the original logic, not the quality of the game after the fix. agy's original remark: *"The villagers don't behave like medieval humans with instincts and survival wisdom; they operate like fragile, rigid, foolish state machines. They would starve next to a berry bush just because the shop ran out of bread, die of thirst while gazing at the well mouth, flee in panic from a baby rabbit, and evaporate from the world simply because someone looked at them while saving the game."*

### Phase 1

**Bug 1 — Flaky fire test (4/10).** (1) The firefighting logic modeled random water splashing to adjacent cells (`srand() < 0.5`) and hazard levels to structures — a genuine simulation attempt. (2) Unrealistic: the collision algorithm treated the barn wall as an absolute obstacle, trapping the firefighter out of reach; in real life people stand outside and throw buckets of water at the wall from 2–3 meters — nobody is forced to hug the center of the burning cell. (3) Allow ranged water dousing in an arc (radius 2–3 cells) that splashes over low obstacles.

**Bug 2 — Duplicate `paBlob` (1/10).** (1) A technical error merging the pixel-art renderer file; it modeled no natural/social law. (2) Overriding a JS global function declaration — reflects the patchwork of the original build system. (3) Encapsulate graphics primitives in an isolated namespace; separate the drawing pipeline from the core simulation.

**Bug 3 — Baseline 140 vs 70 (1/10).** (1) A dev measurement error: counting log lines / double-counting 2 passes instead of counting assertions (70 tests). (2) Like a medieval storehouse clerk checking 70 grain sacks, pacing back and forth to count 2 rounds, then reporting 140 sacks. (3) Harness that cleanly separates suite/case/assertion, no raw-text parsing over the DOM.

### Phase 2A

**Bug 4 — Lost provenance + ghost records (2/10).** (1) Tracking item history (who felled the tree, who built the table, what quality) was a great direction, but `doDropStep` wiped the whole pile's lineage on hitting the ground, while the dropper kept "ghost records". (2) A chair carved with the carpenter's mark can't lose its carving on touching dirt; a seller can't keep the "spirit" of an item already handed over. (3) Attach provenance metadata to the item entity; whether it drops or changes hands, the lineage travels intact.

**Bug 5 — Blocked workstation → silence (2/10).** (1) Classic gamey NPC behavior: blocked path to the workbench = silent cancel with no reaction. (2) A human seeing the workshop door blocked would stand and stare, get annoyed, try to clear the obstacle or switch tasks — nobody "loses their memory" and freezes. (3) Chain: movement failure → thought ("Workshop door is blocked") → deprioritize crafting, find a way to clear the path or do something else.

### Phase 2B

**Bug 6 — Drowned river + dead-end bridge (1/10).** (1) `getRiverCenter` sank the entire east bank below the waterline; the wooden bridge ended mid deep-current at wx=30. (2) Medieval villagers would never fell timber to build a bridge that plunges into rapids as a death trap. (3) Generate the riverbed with a dry-land corridor on both banks; bridge spans auto-extend until anchored on high ground.

**Bug 7 — Drink/fish required standing in water (2/10).** (1) `doDrinkStep`/`doFishStep` demanded `depth > 0` — the whole body had to wade in just to scoop a drink or cast a line. (2) Nobody jumps into an icy river soaking wet (risk of shock, freezing to death) just for a sip; people stoop from the bank or stand on a bridge. (3) Check water-source interaction within a 1–1.5-cell radius of banks/pond edges/bridge decks/well rims.

**Bug 8 — Demolished the wrong tavern (1/10).** (1) `findBuildingTarget` couldn't find "the old hut" → fallback demolished the nearest structure = the village's biggest tavern, the Sleepy Stag Inn. (2) No sane builder/villager would smash the tavern in the middle of the village just because they couldn't find the hut they were told to tear down. (3) Cancel the order + report a clear error; drop fallback entirely when a proper name is given.

### Phase 2C

**Bug 9 — Stale-thought permanent blacklist (2/10).** (1) `handleActionFailure` scanned the stale `thoughts` array; every tick re-triggered, permanently blacklisting valid targets (campfire, bed), and the character unraveled. (2) Stubbing your toe once on a doorframe doesn't make a normal person refuse to step through that door for life. (3) Blacklist with a cooldown (tens of sim-minutes); the failure flag only evaluated at the tick the action just occurred.

### Phase 2D

**Bug 10 — Conflict detection on 5 hardcoded keys (3/10).** (1) `isContentConflicting` only compared 5 fixed fields; new information about durability/price was silently overwritten, with no trace of the old belief kept. (2) It erased perceptual history; a human always remembers once thinking the item was intact before seeing it break. (3) Any conflicting attribute change → the `superseded` branch, old belief archived into history.

**Bug 11 — Shallow copy evidence (1/10).** (1) Shallow-copying the evidence array in `observe` let today's additions mutate past journal entries. (2) It violated temporal causality; today's evidence can't crawl back into last week's journal page. (3) Deep-clone evidence + content when freezing into `v.epistemic`.

### Phase 2E

**Bug 12 — Childcare creating food (1/10).** (1) `doChildcareStep` raised the child's satiety without deducting a crumb of bread or a sip of milk from stock. (2) "Medieval magic"; raising children was the biggest flour/milk/porridge burden on a household. (3) Mandatory food sourcing from the family bag/store (`HOUSEHOLDS`); empty store → the child fusses, the caretaker is stuck.

**Bug 13 — Occupation bonus dead code (2/10).** (1) `calcOccupationBonus` granted hunter/farmer/cook titles, but no production system ever called it. (2) Hollow RPG titles; a feudal guild's master smith worked no differently than an apprentice. (3) Wired the occupation factor into action time and the perfect-quality rate.

**Bug 14 — Pregnancy outside marriage (3/10).** (1) Biologically natural, but pairing fell back to the nearest male with bond > 0.7 with no marriage required. (2) A medieval village under the parish/clan's eye couldn't have casual pregnancies without scandal, fines, and village-court judgment. (3) Default: conception only between married couples of the same household; out-of-wedlock child → a scandal chain of severe honor loss.

**Bug 15 — Math.random in pregnancy (2/10).** (1) Unseeded `Math.random`; elderly (elder), exhausted, dying women could still conceive normally. (2) Ignored menopause and the body's self-defense mechanisms (severe malnutrition/illness → ovulation auto-suspension). (3) Blocked >45 years and malnourished/bedridden villagers; used seeded RNG (`RNGS.s`).

**Bug 16 — Silent failed proposal (1/10).** (1) Marriage conditions unmet → the `marry` command silently vanished, no status line. (2) Being refused marriage is a major psychological shock; a real person can't calmly turn around and go chop wood as if they never proposed. (3) Logged the event into memory with negative emotion, reduced bond, the character embarrassed/sorrowful for several sim-days.

**Bug 17 — NaN position (0/10).** (1) `{verb:'go', person}` failed to resolve coordinates → `undefined` into `planMoveToward` → `(NaN, NaN)`; the character evaporated from the physical world and then died of thirst. (2) A math error collapsing reality; a human can't decompose their body's coordinates into nothingness just because they don't know where a friend is. (3) Resolve name → real coordinates before stepping; if unknown, failure thought + safe command cancel.

**Bug 18 — Marta died of thirst for lack of survivalGuard (1/10).** (1) Marta `isNPC:false`; the player took their hands off the keyboard → the game drained her water to zero without triggering `survivalGuard`, and she stood dying of thirst next to the well. (2) Humans have survival instincts; nobody dies desiccated with eyes open in front of a water source just because they "haven't received orders from above". (3) Biological indices hitting the alarm → unconditional instinct override, self-drink/find food.

### Phase 2F

**Bug 19 — Excluding the third claimant (3/10).** (1) Dispute fixed to 2 parties at filing; a third person bearing original evidence was ignored. (2) A rustic court judges by the facts; refusing to hear an interested party just because "we already have 2" is array-programmer rigidity. (3) Keep the case open for interested parties to submit more before the elder's hearing.

**Bug 20 — actualOwner leak (1/10).** (1) `summarizeItem` returned the database's true owner to every querying entity outside. (2) The "halo of omniscience"; nobody in medieval times looks at an axe in the woods and instantly knows its legal owner without identifying marks. (3) Bridge filters per character viewpoint: only `believedOwner` + `confidence`.

**Bug 21 — Log "ownership stays Y" (2/10).** (1) A sneaky midnight theft nobody saw, yet the log wrote the victim's name outright + asserted ownership unchanged. (2) The "omniscient chronicle": no witnesses, yet the whole village read the truth on the notice board. (3) The public log only records what someone witnessed; a clean theft goes only into the thief's mind — the victim only knows something vanished.

### Phase 3

**Bug 22 — Clone nulling villagers (0/10).** (1) The anti-recursion `WeakSet` turned a villager currently viewed by `otherPerson` into `null` when saving the game. (2) A purely technical error; writing the village census made a breathing human outdoors evaporate. (3) Separate transient action refs from persistent entities before serializing.

**Bug 23 — _ci drift after load (1/10).** (1) Loading a save recomputed `_ci` for villagers, distorting the original visuals. (2) Go to sleep, wake up to find residents' skin/hair colors swapped because the universe "forgot" the parameters. (3) Save/restore the seed + baked visual indices intact, no recomputation.

**Bug 24 — Feed overlay dead when alone (2/10).** (1) The renderer blocked DOM updates if no other canvas overlay was on. (2) Reading village news forced you to also turn on the heatmap or plot boundaries. (3) Split the DOM update into a process independent of the canvas cycle.

**Bug 25 — Non-atomic load (0/10).** (1) A corrupted file (`chunks:[42]`) but the running world was already wiped before the crash. (2) "Administrative catastrophe": the clerk burned the whole village down before checking whether the new census could even be read. (3) Atomic: validate in temporary memory; overwrite only when everything is valid.

**Bug 26 — __proto__ smuggling (1/10).** (1) Inserting prototype keys to forge store data / crash the engine. (2) A modern JS vulnerability with no medieval equivalent. (3) Reject `__proto__`/`constructor` in the parser before assignment.

**Bug 27 — 30k-deep payload (1/10).** (1) Recursively scanning a 30,000-level nested structure → `RangeError`. (2) A machine stack limit, unrelated to the simulation. (3) Depth limit + try/catch at the intake layer.

### Phase 4

**Bug 28 — SurvivalGuard death spiral (2/10).** (1) Starving → guard forced a purchase at the tavern → tavern out of bread → next tick forced the purchase again → a loop of starving in front of an empty counter. (2) A medieval farmer seeing an empty tavern would go dig roots in the woods, pick wild berries, beg food from a neighbor — nobody queues up to starve at an empty shop. (3) Primary source failed → fallback to natural foraging behavior (`forage`).

**Bug 29 — Gentle animals causing flee (2/10).** (1) Every animal (rabbits, deer, birds) triggered panicked fleeing, breaking off work. (2) Farming folk live amid nature; a grown adult sprinting in terror from a grazing rabbit is utterly absurd. (3) Only trigger when the animal belongs to the dangerous predator group + is aggressive/hunting (`hostile:true`).

**Bug 30 — One-time berry bushes (2/10).** (1) A berry bush harvested once vanished forever, resources exhausted within days. (2) Medieval fruit bushes are perennials: they shed leaves, bear fruit on weather cycles — not ore veins that dissolve after one dig. (3) Keep the bush root, an "out of fruit" state, regrow after 3–4 warm-season days.

**Bug 31 — Drink timeout 1.5h (2/10).** (1) Drinking had a hard 1.5h sim limit; past the deadline it canceled and walked away even while dying of thirst. (2) A person dying of thirst at midsummer noon has exactly one supreme goal: plunge their face into water; nobody gives up because "the 90-minute timer ran out". (3) Drop the hard countdown; cancel only when the source is destroyed or an attack threatens life.

**Bug 32 — Faint-wake plan wipe (2/10).** (1) Low blood fainted (`downedTick`), the wound had already clotted so the next tick woke immediately; still-low blood → faint again; each faint wiped the survival plan → seizing in place. (2) A real person who lost a lot of blood lies in deep coma or motionless gasping; nobody springs up like a jack-in-the-box only to collapse hundreds of times per hour. (3) Fainting from blood loss → deep unconsciousness for hours; on waking, stay conscious and crawl to bed to recover.

**Bug 33 — Orbiting the well (1/10).** (1) The obstacle probe raycast hit straight at the well's center; wall-following treated the destination well as an obstacle → circled at 70–90px radius until dying of thirst. (2) The "comical scene": wanting to draw water but becoming a satellite orbiting the well mouth for fear of bumping the well wall. (3) Ignore collision with the destination object itself within interaction range (1–1.5 cells), allowing approach to the well rim to draw water.

**Bug 34 — Wrong triage order (3/10).** (1) Rigid drink→eat→sleep order; a villager with 2h left before dying of exhaustion but 15h before dying of thirst was forced to trek across the village for a drink → collapsed and died of exhaustion en route. (2) A doctor/ordinary person prioritizes the threat nearest to death, not a fixed administrative checklist. (3) Triage by time-to-death: whichever need hits its death mark first gets handled first.

**Bug 35 — Wolf massacre (3/10).** (1) 0.4h attack cooldown, 4 per winter night, too little satiety per bite → a killing machine that exterminated the village within nights. (2) Medieval wolves greatly feared fire, torches, and shouting humans; they mainly hunted sheep/chickens or a lone lost traveler in winter — they never risked genociding a guarded settlement. (3) Reduced village-incursion frequency; increased deterrence from fire/lamps; a wolf wounds 1 target or drags off a carcass → retreats to its den.

### agy's 3 Biggest Weaknesses — Premise for Part 3
1. **Brittle under failure, no survival adaptation:** death-loops on every minor hiccup (tavern out of bread → re-buy loop to death; one stumble → blacklisted for life; well 90 minutes away → give up). Needs a degradation ladder: A fails → B → C → D.
2. **Omniscience vs epistemic isolation:** the spec demanded strict layering but the code leaked truth (bridge leaked `actualOwner`, omniscient theft log, childcare food-creation, provenance lost on drop). Needs thorough epistemic isolation + material conservation.
3. **Crude RPG-style ecology:** rabbits causing panic, wolves like dungeon monsters, one-shot bushes, drinking requires wading, occupations as mere labels. Needs real biological/social laws: animals fear fire/people, herbs regrow by season, occupation affects productivity, marriage bound by community constraints.

---

## Part 3 — The 4-Persona Council Debate (2026-09-16, full)

**Context set by the user:** agy's proposed direction was "partly reasonable", but real life holds many more cases — discuss further to miss no case. The user's most important decision: **"real life is not perfect, so don't try to make everything perfect"** → every proposal must have a concrete STOPPING POINT: where is enough, what is NOT done.

**Participants:** "The Master Craftsman" + "The Old Scholar" (2 personas of lead Friend) vs "The Ecologist" + "The Epistemologist" (2 personas of agy/Robin).

**The 3 original proposals put under the knife:** (1) Degradation ladder — plan A fails then descends to B, C, D; (2) Thorough epistemic isolation — villagers act only on what eyes see / ears hear / memory holds; (3) Organic ecology — wolves fear fire, plants regrow by season, gentle animals don't cause panic.

### 3.1. The 4 Parties' Positions

**"The Master Craftsman" (lead, pragmatic):** Agrees 80%, but every improvement must be CHEAP, TESTABLE, DETERMINISTIC. Three traps: (1) A ladder too deep becomes a giant decision tree — each fallback level doubles the test cases. Maximum 3 levels, the last level always the cheapest instinctive behavior (hungry → forage in place, no long-range pathfinding). (2) 100% isolation is an illusion — some "omniscience" is harmless (internal technical logs, rendering). Isolate exactly 2 places: the villager's decision inputs, and what the villager "says/knows" outwardly. Don't refactor the whole engine over one log line. (3) Ecology: do the cheap, high-impact things first — wolves fear fire/torch/noise (a few lines), plants regrow by season. Don't simulate a full animal population. Commonly missed cases: people are LAZY (rather eat mediocre stored food than trek far to pick good fruit); people have HABITS (still go to the familiar tavern even though it was out of bread yesterday — habit beats optimal).

**"The Old Scholar" (lead, humanist):** The biggest danger of the proposed direction is creating "PERFECTLY OPTIMIZED" villagers — equally unrealistic, just in the other direction. Real people are full of flaws: PANIC (forget the whole ladder, run the wrong way, freeze); STUBBORNNESS/PRIDE (rather starve than beg at an enemy's house); GRIEF (lose appetite after a death, work half-heartedly); SUPERSTITION (dare not pass the spot where someone drowned); DRUNKENNESS (reduced judgment, brawls); curious CHILDREN (touch fire, chase butterflies far away). Proposal: the ladder must have PSYCHOLOGICAL CONDITIONS — it doesn't always run at full. And allow a small fraction of "stupid" deaths to happen — real life is like that; banning them absolutely makes an artificial paradise.

**"The Ecologist" (agy) — common position:** Agrees there should be fallback, but opposes treating nature as an "infinite warehouse" — the Master Craftsman's final level ("forage in place") is a deadly trap unless ecological carrying capacity is accounted for. On epistemics: nature doesn't care what villagers know, but it sends physical signals — smoke smell, muddy footprints, cloud color, thunder; a villager doesn't "know" where the wolf is but can smell the pack, see the flock of birds burst into panic flight. On organic ecology: welcome, but "organic" = two-way interaction — humans exhaust nature, nature counterattacks and strangles the village.

**"The Epistemologist" (agy) — common position:** Humans never fall back on objective truth; they fall back on a MENTAL MODEL — which is frequently distorted, outdated, dead wrong. On epistemics: plugging the omniscience leak is only step 1; step 2 matters more — ALLOW VILLAGERS TO HOLD FALSE BELIEFS. A world where villagers only act when information is 100% correct, seen-with-own-eyes-heard-with-own-ears, is still a lifeless "mini-omniscience". On ecology: humans view nature through the lens of superstition — lightning is not static electricity but "the gods enraged because the village-head's butcher stole".

### 3.2. 10 New Real-Life Cases (Nobody Mentioned Before)

**The Ecologist — 5 cases:**

1. **"Desperate hungry wolf" (the survival threshold breaking fear).** Reality: wolves fear fire only when full/normal. Late winter under snow, prey exhausted, survival instinct crushes fear — a starving wolf will dash through a fire to snatch a sheep, even tear a child in front of a torch-bearer. Gameplay consequence: hunger >90% → fire only makes the wolf hesitate ~2 seconds, then it attacks frenziedly.
2. **"Rotten granaries & rats".** Reality: food doesn't sit intact waiting for fallback. Rain-season damp molds the barley; warehouse rats nibble + contaminate provisions. Consequence: a villager strolls home to activate the reserve level, opens the chest to find 40% turned to mold/rat-chewed → free-falls to the next level in panic.
3. **"Water-source pollution & disease".** Reality: a deer rots dead upstream, drought leaves the well with nothing but thick mud. Drinking carelessly in thirst → diarrhea/cholera. Consequence: a dry water source causes not just thirst but poisoning — chain loss of labor, wheat production paralyzed.
4. **"Tragedy of the wasteground" (local depletion).** Reality: 10 villagers switch to picking wild mushrooms/tubers at the West forest edge → after 1 day it's bare; the 11th arrival finds nothing, having burned travel calories while facing death. Consequence: bushes/mushrooms must have a depletion index — foraging is not a magic life-buoy that's always there.
5. **"Weather blocking roads & torch-snuffing wind".** Reality: autumn downpours snuff torches (night shield lost); dirt roads become mud, movement speed drops 70%. Consequence: foraging out on a rainy day takes twice as long, body temperature drops, a torch dying mid-journey makes them prey for wild beasts.

**The Epistemologist — 5 cases:**

1. **"Rumor mill & economic freeze".** Reality: hunter A sees 1 old wolf track → tells B "there are wolf tracks at the forest edge" → B tells C "a wolf pack is stalking" → C spreads through the market "wolves are about to pour in and bite the whole village to death!". Consequence: villagers panic and lock their doors at home, nobody plows/bakes — the economy paralyzed 2 days over one ancient footprint.
2. **"Blind healers & deadly therapy".** Reality: medieval folk believed fever came from "excess blood" → bloodletting, forcing the sick to abstain from water. The healer is kind but the knowledge is utterly wrong. Consequence: the family calls the healer as the illness fallback; the healer's mud-smearing/bloodletting makes the villager exhaust and die twice as fast — death by false belief, not by calamity.
3. **"Outdated memory & death by confidence".** Reality: the old farmer remembers vividly that 10 years ago there was a giant raspberry bush by the stream; hungry, he leads the family 3 miles on foot to the spot that burned down 2 seasons ago. Consequence: memory doesn't self-update without a return visit — acting on "stale data" leads to disastrous decisions.
4. **"Prejudice labeling & scapegoating".** Reality: a flour sack goes missing, nobody saw the thief, the whole village unanimously suspects the forest-edge widow ("witch") or the outsider. Consequence: trust collapses baselessly, trade refused / the suspect isolated — though in reality the sack was dragged off by rats.
5. **"Peace illusion & risk blindness".** Reality: 3 years with no bandits/beast attacks → danger forgotten: no patrol torches lit, the sheep-pen bolt loosely fastened. Consequence: the longer the peace, the more vigilance drops; when disaster strikes, there's no time to react.

### 3.3. The Debate Rounds (verbatim gist)

**The Ecologist roasts the Master Craftsman over "cheap in-place foraging":** *"Master Craftsman, you said the final level should just forage in place to save on pathfinding and cheap testing. But that's the same old scam! If you let villagers bury their faces in the dirt and dig up tubers without deducting that soil tile's resources, you've just smuggled 'food from thin air' into the game through the back door! Does real life work like that? If 5 guys forage in one corner of the yard, that corner must turn to bare gravel, and the 6th guy must starve. You want cheap algorithms, but you're not allowed to break the law of material conservation!"*

**The Epistemologist roasts the Master Craftsman over "isolate only input/output":** *"Master Craftsman, you're very clever to fear refactoring, but you're being naive about cognition. If in memory the villager still points straight at the `actualThief_ID` pointer and you just use a `mask()` function to cover it when printing logs, sooner or later the AI logic will suffer 'implicit leakage'. A villager must not contain pointers to the truth. A villager may contain only a `Beliefs` table — that is, what it BELIEVES. If it believes A stole (though B really did), all its subsequent behavior must target A. There's no such thing as 'half-baked isolation' at the input while demanding deep behavior!"*

**Both roast the Master Craftsman over "wolves fear fire in a few if/else lines":** *"Writing `if (hasTorch) flee()` is 90s-style lazy programming. It turns the wolf into a stupid machine. Wolf-fears-fire needs exactly 1 more subtraction: `fear_level = base_fear − hunger_level`. When hunger crosses the threshold, the wolf charges in and tears apart the torch-bearer. Dirt cheap, costs just 1 arithmetic operation, but 10x more realistic — why won't you do it, Master Craftsman?"*

**The Ecologist corrects the Old Scholar on "psychology overwhelming biology":** *"Dear Old Scholar, you're romanticizing poverty and human stubbornness! You say people would 'rather starve than beg at an enemy's house' or 'stop eating until collapse when in mourning'. True, but only true at 30–50% hunger! When hunger hits 90%, when the internal organs start digesting themselves, pride, clan hatred, and grief over lost kin are all shoved aside. Medieval famine history proves it: humans will kneel to enemies, eat rotten roots, even eat their own kind. Don't turn villagers into sentimental poets. Biology is always the supreme master when life is threatened."*

**The Epistemologist corrects the Old Scholar on "stupid deaths":** *"I agree with the Old Scholar that real life is full of stupid deaths. But the biggest SOPHISTRY of game makers is confusing 'stupid deaths with cognitive causes' with 'random dice deaths (RNG bullshit)'. If a villager dies believing the quack healer's poison, the player will slap their thigh and weep because the tragedy is so true. But if a villager running from a wolf suddenly freezes and dies because you rolled `panic == true`, the player will curse it as a game bug and rage-quit! Stupidity must have the internal logic of stupidity, not meaningless randomness."*

**Internal clash — the Ecologist attacks the Epistemologist:** *"Mr. Epistemologist keeps drawing up belief mazes, rumor mills — sounds nice but costs too much memory. A village of 50 people, if each holds 20 false beliefs about one another, the relationship matrix explodes exponentially (O(N²)). Rural medieval folk are practical: wake at dawn, shoulder the hoe to the field, sleep at night. Hungry? Go find food. Don't turn them into Roman philosophers sitting around scrutinizing each other's beliefs!"*

**The Epistemologist fires back:** *"If it's only eating and sleeping, that's a herd of cattle, not a human village! It's precisely the irrational things — like taboos against stepping on the bridge where someone drowned, or factional hatreds over a stolen-chicken rumor — that make the soul of a village. Your ecology only builds a smoothly running livestock pen. My cognition is what turns it into a human society!"*

### 3.4. Agreed Stopping Points (against over-perfecting)

**The Ecologist (owns proposal 3):**
- DO: (1) 4 seasons directly affect the 3 core resources (grain, forage/wood, game) — winter regrowth = 0; (2) wolves with 2 psycho-biological thresholds (normally fear torch/fire within 5 cells; starving ignores fire to attack the weak/sheep); (3) tile depletion — bushes 3 harvests → bare for 5 days.
- DON'T DO: multi-level food chains (grass→rabbit→fox→wolf); complex microclimates; complex epidemiology (disease is just 1 status effect: drinking dirty water → −50% speed & hunger twice as fast for 3 days).

**The Epistemologist (owns proposals 1 & 2):**
- DO: (1) 3-level ladder — B1 optimal plan (buy/make by habit), B2 self-reliant (eat home stores / forage the nearest bush in memory), B3 desperate/distress (steal / beg a close neighbor / eat spoiled food); (2) minimal belief tuples — each villager stores only 3–5 fragments `[who/what, attribute, location/value, time known]`, arrive and don't see it → update immediately; (3) single-hop rumors — A sees a wolf, tells B, B believes, B does NOT pass it on to C (avoids loop explosion).
- DON'T DO: multi-layer psychoanalytic psychology; natural-text rumor generation (enum only: `RUMOR_DANGER/THIEF/SCARCITY`); eternal feuds (trust is just an int −10…+10; hunger <10% ignores trust outright).

### 3.5. The Lead's Final Strategy (verdict after the debate)

1. **The Ecologist beats the Master Craftsman** on foraging: the ladder's final level is not exempt from the conservation law → tiles/bushes have harvest counts.
2. **Synthesis of the Old Scholar + the Ecologist** (the most important piece): psychological flaws only apply at moderate need levels (30–70%); above 90%, biological instinct overrides everything → the ladder has 2 modes.
3. **Total agreement with the Epistemologist** on stupid deaths: must have internal logic (false belief); RNG bullshit banned.
4. **Draw between the Master Craftsman and the Epistemologist** on isolation: the principle belongs to the Epistemologist (villagers hold beliefs, not pointers to truth), the budget belongs to the Master Craftsman (3–5-fragment belief tuples, cheap, deterministic); internal technical logs stay as-is.

**Order of DO:** (1) 3-level ladder + 2 psycho-biological thresholds → (2) tile depletion + 4 seasons → (3) wolves' 2 thresholds (1 subtraction) → (4) belief tuples + single-hop rumors + trust → (5) new cases worth taking: moldy granaries/rats, outdated memory, scapegoats, peace illusion, quack healers.
**DON'T DO:** per stopping points 3.4. **Phase name:** Phase 6 — "Imperfect Humans" (Phase 5 per spec is Release: push `v0.4.0-phase4`, one token step remaining — do first).

---

## Part 4 — Guiding Principles for All Future Actions

> Read before doing any Phase 6 task. Violation → stop, ask the user. Each principle is recorded with its "why" — the reasoning behind it, distilled from the 3 parts above.

1. **Real life is not perfect → over-perfecting banned.** *Why:* direct decision of the user (2026-09-16). Every proposal must have a pre-written stopping point. Don't simulate anything just to be "more real" if it creates no gameplay/story. Consequence: every Phase 6 spec must have an explicit "DON'T DO" section like 3.4.

2. **Two thresholds, not one.** Psychological flaws (stubbornness, pride, superstition, panic, laziness, habit) only apply when needs are at moderate levels (30–70%). Hit the life-or-death threshold (>90%) → biological instinct overrides everything. *Why:* the Ecologist's correction of the Old Scholar — medieval famine history proves humans kneel to enemies and eat rotten roots at extreme hunger. The Old Scholar is right at moderate levels, the Ecologist at life-or-death; only together do they make a real human.

3. **Stupid deaths must have internal logic.** Allowed to die from false beliefs (quack healers, 10-year-old memories, rumors), from stubbornness, from panic. Dying to pure RNG is banned. *Why:* the Epistemologist's correction of the Old Scholar — players weep at tragedies with cognitive causes, but curse the game as broken and rage-quit over dice-roll deaths. "Stupidity must have the internal logic of stupidity."

4. **Absolute material conservation.** No food/items from thin air — not even through back doors like "in-place foraging that doesn't deduct the tile". Every survival fallback deducts real world resources. *Why:* the Ecologist's roasting of the Master Craftsman — 5 people foraging one corner of the yard means that corner turns to bare gravel, and the 6th person starves. Violating this principle is just bug #12 (childcare) reborn in another form.

5. **Villagers hold beliefs, not pointers to truth.** Maximum 3–5 fragments `[who/what, attribute, where, when]`. Decisions read only from beliefs + senses + memory. *Why:* the Epistemologist's roasting of the Master Craftsman — half-baked isolation (masking at log time while memory still points at `actualThief_ID`) causes "implicit leakage"; if the villager believes A stole (though B really did), its behavior must target A. But the budget belongs to the Master Craftsman: minimal tuples, no O(N²) matrices.

6. **The Master Craftsman's budget: cheap, deterministic, testable.** Ladder ≤ 3 levels. Single-hop rumors, enums. Trust is an int −10…+10. All RNG must be seeded. *Why:* each fallback level doubles test cases; a bloated belief system kills performance at 50+ villagers (the architecture goal already set). Lesson from Part 1: a green suite doesn't mean correct — fewer cases are easier to probe.

7. **Habit and laziness are nature, not bugs.** Humans aren't optimization machines: they still go to the familiar tavern though it was out of bread yesterday, rather eat mediocre stores than trek far. *Why:* the Master Craftsman reminded us — "fixing" this into perfect optimization just creates "optimization-machine" villagers, which the Old Scholar warned is equally unrealistic, only in the other direction.

8. **Distorted rumor is a feature, not a bug — but with limits.** Single-hop, gradually distorted — that's how a human village operates. *Why:* the Epistemologist — rumors create the "village soul" (taboos, factions, scapegoats). But explosion is banned: each villager keeps only a few fragments, no passing beyond 1 hop (the Ecologist's performance reason).

9. **Execution order: Release first, Phase 6 after.** Phase 5 (per spec) = push tag `v0.4.0-phase4` + reverify checksum. Don't mix release with new features. *Why:* the release is already accepted, only 1 token step remains; mixing new features would destroy the "clean tagged source" that Warren signed off conditionally.

---

## Current Status (2026-09-16)

- Phases 1–4: COMPLETE, Examiner PASS. Tag `v0.4.0-phase4` at commit `1aded9c`, **not pushed** (needs a fresh one-time GitHub token, not stored).
- Phase 5 (Release): stuck at the push + checksum/tag verify step.
- Phase 6 ("Imperfect Humans"): has a strategy (Part 3.5), **no detailed spec yet**.
- agy: jail removed, runs directly unjailed (`~/workspace/agents/agy.sh`); keeps Examiner review for all Tier-3 outputs.
- This file + `WORK_LOG.md` are the project's 2 source documents. Every future "what should we do" debate must be checked against Part 4 first.

---

## Part 5 — The Executive Producer's Assessment (2026-09-16, verbatim)

> The user's independent assessment after reading `WORK_LOG.md` + thinking-process (Parts 1–4). Saved verbatim because this is the strategic direction for all later phases.

Based on the two files you just sent, my assessment is quite different from just looking at the master prompt. Willowbrook Natura already has a considerable simulation foundation; the main area to improve is the **accuracy of the real-life model**, not adding a whole lot of features.

The current phases show the game has come quite far: recipe/provenance, building, utility AI, perception/knowledge/belief/memory, ownership, family/birth, and everyday activities have been implemented; these phases were also audited and accepted by the Examiner after fixes.

But if the standard is **"try to model real life as well as possible, without trying to model everything"** then the current assessment is as follows.

### 1. The Current Foundation: Right Direction

The highest-rated point is the shift from `NPC → task → execute` to **world state → perception → belief/memory → decision → action → consequence**. The separation of `REALITY / PERCEPTION / MEMORY / KNOWLEDGE / BELIEF / CLAIM / EVIDENCE / UNCERTAINTY / CONTEXT` was written clearly into the design and implemented — a very important foundation if AI Brain is added later. Similarly, making provenance a persistent history instead of items losing their origin when changing hands is also the right direction.

### 2. But It's Not Yet a "Real-World Simulation"

Not because it lacks a few features like beer/wine, swords, or armor. The biggest weaknesses match the conclusion in thinking-process: **(a)** humans are still too "adaptable"; **(b)** cognition is still fairly shallow; **(c)** ecology is still simple. And a fourth point: **(d)** society and institutions haven't truly self-formed yet.

### 3. "Don't Make Perfectly Optimized NPCs" — Fully Agreed

If the goal is realism, an NPC that `always chooses mathematically best action` is unrealistic — but it shouldn't swing to `random stupidity` either. The settled principle is right: **"stupidity must have the internal logic of stupidity"** — e.g. `false belief + habit + fear + bad memory + social pressure → stupid decision` — that is good realism.

### 4. Redefining the "Ladder" Concept

The 3-step `A ↓ fail → B ↓ fail → C` ladder is a reasonable engineering/performance decision — but in real life, **the ladder should not be the nature of cognition, only the current implementation approximation**. Later it should be thought of as: *a character has no "fallback ladder"; a character has a set of goals + beliefs + capabilities + emotions and continuously re-evaluates the situation.* Example: Bram can't reach the workshop — the essence is `goal = make table` + `new observation: workshop unreachable` → interpret the cause → possible plans (clear door / ask for help / find another workshop / do something else / wait) → different choices depending on personality/knowledge/habit. That is precisely the natural bridge to the AI Brain later.

### 5. Ownership Is on the Right Track — and the Deeper Level

The work log already has: actual owner, current holder, ownership belief, confidence, evidence, claims, witnesses, disputed ownership, historical transfer, per-villager belief — and utility AI already acts on **personal belief** instead of global truth. This is architecture to keep. The deeper level: **ownership should be a "social fact", not just a property** — WORLD TRUTH (Bram owns axe) / LEGAL-SOCIAL NORM (village recognizes it) / OBSERVED EVIDENCE (Bram's mark) / BELIEF (Finn believes) / CLAIM (Tobin claims) / DISPUTE (Alden resolves). As society grows, "owner" may depend on custom/law/institution. A later step, not needed yet.

### 6. Gap: Perception Exists, but "Attention" Is Missing

Real life isn't "seeing everything in sight range perceived equally" — humans have **selective attention**. A very hungry Marta, hunting for food, can walk past a bird unnoticed; but hearing a child cry shifts attention to the child. In the long run there should be `sensation → attention → interpretation → memory` instead of `everything visible → knowledge`. An important foundation for AI Brain.

### 7. Gap: Motivation Not Deep Enough

Utility AI already weighs hunger/thirst/fatigue/warmth/comfort/social/health/safety + personality/distance/risk/opportunities — but humans also act from identity, pride, status, duty, attachment, fear, curiosity, long-term goals, responsibility, meaning. Example: Alden knows sleeping would be better but still stays up caring for the wounded — that's not a bug, that's **conflicting motivations**. Aim for `multiple competing motives → trade-off → decision`, not `highest need wins`.

### 8. Memory Is Good, but Lacks "Autobiographical Identity"

Memory already has confidence/salience/decay/superseding/evidence/source/teaching — a very good foundation. But humans gradually form **"who I am"**: "I am a farmer. I am Pip's mother. I survived the fire. I am bad at fishing. Bram saved me once." — the self-model/identity that AI Brain will badly need later. No need for full psychology yet, but the data architecture should leave room.

### 9. Big Gap: Expectation

Humans don't just remember the past — they **predict the future**: "It usually rains in autumn", "Shop normally has bread", "The caravan comes every winter", "My husband usually comes home before sunset." Violated expectation → `expectation → prediction → reality differs → surprise → update belief/emotion`. A very powerful system for making people more real, directly connecting learning/belief/disappointment/trust/planning.

### 10. Economy Is Still Fairly "Gamey"

Already has individual money, shop, caravan, inventory, occupations, dynamic occupations — but a real economy also has scarcity/expectations/credit/debt/risk/ownership/specialization/bargaining/future planning. Not all needed — **don't add everything at once**. Priority: **scarcity + price + expectations + ownership + specialization** first. Example: scarce salt → price rises → less meat preserved → winter food changes → demand changes → the caravan brings more salt next trip. That's a truly emergent economy.

### 11. Ecology: Agree With the Current Stopping Point, Revisit Later

Agreed: no complex food-chains/microclimates/complex epidemiology in the current phase. But if the end goal is best possible real-world simulation, ecology will need a revisit: at minimum `resource regeneration + season + harvest pressure + population + weather → resource availability` — **nature must have carrying capacity** (already correctly documented under "material conservation" and tile depletion).

### 12. Biggest Gap After Cognition: SOCIETY

Already has friendship/marriage/family/household/claims/teaching/reputation — but real societies create norms/traditions/customs/roles/authority/institutions/laws/collective memory. Example: someone saves a child from a fire → everyone knows → reputation rises → more trusted → invited to be village guard → social role changes. No need to program "Bram becomes a hero" — just `action → witnessed → remembered → reputation → social trust → opportunity` and it can happen. **This is where Willowbrook can truly surpass RimWorld.**

### 13. Realism Is Not Synonymous With "Accuracy"

Concrete numbers (memory decay, 30 sim-day pregnancy cooldown, bond +0.05, elder speed 0.75x, fatigue 1.35x) are good for making the game run — but don't fool yourselves that "having numbers = science". Those are just **model parameters**. Realism comes from **parameter + relationship + feedback loop + consequence**, not from numbers being more detailed.

### 14. "No Over-Perfecting" Should Become the Project's Supreme Law

Otherwise the project easily slides into: add realism → add system → add exception → add AI → add edge case → gigantic code with no guarantee of being more real. **A good simulator must know what it deliberately does not simulate** — the current file already does this right (no multi-level food-chains, microclimates, complex epidemiology, psychoanalysis, infinite rumors).

### Overall Assessment

On **simulation architecture**: clearly on the right track. On **degree of real-life modeling**: still at `FOUNDATION OF A LIVING WORLD`, not yet a `REALISTIC SOCIETY SIMULATOR`. No need to rush into adding 50 more systems. Priority order:

```
1. Physical causality → 2. Human needs/body → 3. Perception → 4. Belief + uncertainty
→ 5. Memory → 6. Conflicting motivations → 7. Adaptive behavior → 8. Relationships/family
→ 9. Economy → 10. Knowledge/learning → 11. Social norms/reputation → 12. Institutions/law
→ 13. Ecology → 14. Generational/cultural evolution → 15. AI Brain
```

**AI Brain should come near the end, not at the start.** The foundation is right: a separate epistemic store, false beliefs that can be superseded, ownership belief separated from world truth, utility AI avoiding omniscience. And one step further: **don't build AI Brain to "make NPCs smart". Build a simulation good enough that an AI Brain has a world actually worth thinking in.** That's the difference between an NPC using an LLM and an **AI character living in a simulated world**.

*Practical note: by the project's own standard, don't call the current game "achieved realism" — this is **a fairly good foundation transitioning from game simulation to world simulation**. Phase 5 release still pending, Phase 6 has only principles so far, no detailed spec yet.*

### Lead's Notes (cross-checked after saving)

1. **Ladder:** agree "the ladder is only an approximation" — but note the current architecture already re-evaluates every tick (utility AI); the ladder is just the failure-handling branch. The delta to "goals + beliefs + capabilities + emotions continuously re-evaluated" is smaller than it looks — mainly: don't hardcode the fallback chain; generate candidate plans from goals/beliefs.
2. **Priority order:** agree with the 15-layer frame; propose moving **expectation** and **attention** earlier (right after belief/memory) because both are cheap (attention = perception with a salience gate; expectation = expected-value records + violation detector) yet are the input of every soulful decision.
3. **Society (d):** half right — the project already has proto-institutions (mayor adjudicating disputes, trust −10…+10, claims/witnesses, teaching); what's truly missing is **bottom-up norms** emerging from repeated behavior.
4. Two sentences that should become carved-in-stone law: **"Realism ≠ accuracy"** and **"No over-perfecting is the supreme law"**.

---

## Part 6 — Round-2 Council Minutes: Dissecting the Executive Producer's Assessment (2026-09-16)

> Round 2: 4 personas (the Master Craftsman and Old Scholar of the lead + the Ecologist and Epistemologist of Robin/agy) discussed Part 5 and settled on the **most real-life-like approach** for 7 topics. Verbatim gist, edited for brevity.

### 6.1. The Most Memorable Rebuttals

**The Ecologist roasts the Old Scholar — on Alden staying awake to nurse the sick:** "You're bringing poetry into physiology! At 95% fatigue the body triggers microsleep — no willpower or guilt can override neural collapse. Letting Alden stay awake to 100% then keel over dead from 'duty' is pointless suicide, anti-science." → The Old Scholar conceded: accepts forced biological override at the critical threshold.

**The Epistemologist roasts the Old Scholar — on the 15-layer warning:** "You're confusing structure with features. The 15 layers aren't 15 extra systems stuffed in — it's deepening the existing pipeline. With an Expectation Engine, we can throw away hundreds of lines of rigid state-checking code!" → Rated by the lead as the best rebuttal of the session.

**Both roast the Master Craftsman — on identity "leaving room but not letting it affect decisions":** "Do you want to repeat the bug #13 disaster (`calcOccupationBonus` dead code for phases on end)? Storing 'I am Pip's mother' to admire without letting it impact anything — why leave room for memory garbage? 'I'm Pip's mother' means Pip's crying must have salience x5!"

**The Epistemologist roasts the Master Craftsman — on salience-gated attention:** "You're turning human perception into a mousetrap! A mother worried sick about her lost child would walk past a campfire or a bread crumb blind. Filtering only by dominant biological need creates a creature living on low-level animal instinct!"

**The Ecologist roasts the Master Craftsman — on price = f(stock):** "That's 2000s-RPG cheat thinking! If the stock isn't tied to a physical transport chain, that economy is fake. A winter harvest frozen dead while the baker still raises bread prices from 'self-generating' flour breaks material conservation."

### 6.2. Three Frank Concerns With the Executive Producer's Assessment

The council was allowed to raise concerns (final decision still belongs to the user):

1. **The 15-layer waterfall trap:** The 15-layer diagram is beautiful epistemologically but dangerous if treated as a sequential roadmap — it would drown like Dwarf Fortress, 20 years unfinished. Proposal: treat the 15 layers as **parallel deepening dimensions via thin vertical slices**, not sequential stair steps.
2. **Naivety about "100% emergent norms":** Complexity Science proves a 10–50-agent population without cultural priors converges to pathological deadlock, not spontaneously to medieval village culture. Must **"seed" a minimal cultural frame** (marriage, private property, fear of the dark/the dead).
3. **Danger of erasing highest-need-wins:** Right at the social layer, but if absolute biological priority is erased at critical levels, the Phase 4 survival balance achieved through blood will collapse. Absolute loyalty to **Principle 2 (Two Thresholds)**: below 80% is trade-off/psychology territory; above 85–90% is biology's dictatorship.

### 6.3. The Seven Settled Approaches

**1. Ladder → Dynamic Candidate Generation (max 3).**
- Approach: Drop the hardcoded fallback chain `A → B → C`. When an action is blocked, query Epistemic Beliefs to generate max 2–3 alternatives based on personality + habit. Only re-plan on a "cognitive shock" (surprise/interruption), no re-evaluate every tick to avoid jitter.
- Why it's the most real: Humans follow neither soulless backup scripts nor omniscient calculation — they rely on habit and what they *believe* is available.
- Stopping point: NO full GOAP; no whole-map path scanning; no more than 3 candidates.
- Who conceded: Master Craftsman (dropped the static chain) ↔ Epistemologist (accepted the 3-candidate limit from existing templates).

**2. Selective Attention — 3-gate filter.**
- Approach: (1) Sudden-sensation gate — fire/screams/wolves seize attention instantly; (2) Emergency-state gate — biological indices >75% create tunnel vision, filtering out everything not solving the hunger/thirst; (3) Current-goal gate — only what relates to the unfinished task enters interpretation/memory, the rest is "background noise".
- Why it's the most real: Recreates the biological eyes + brain mechanism: energy saving, instant self-defense reflexes, while maintaining work focus.
- Stopping point: NO detailed FOV, no wavelength-based hearing, no smell/taste.
- Who conceded: Master Craftsman (added the top-down relevance gate) ↔ Old Scholar (accepted the sudden gate crushing every "lost-in-thought state").

**3. Conflicting Motivations — 2-tier architecture + the emotional price.**
- Approach: Tier 1 (below 80%): duty/attachment/pride/habit compete with needs via contextual utility; when a psychological motive beats a bodily need (Alden skipping sleep to nurse the sick) → suffers **suppression stress** + records an **emotion tag** (tired but proud). Tier 2 (above 85%): biology overrides 100%, fainting/panic auto-trigger.
- Why it's the most real: Humans can be heroic in the short term, but remain prisoners of the body when life runs out.
- Stopping point: NO complex moral theory; NO clinical mental illness.
- Who conceded: Old Scholar (accepted the biological override) ↔ Master Craftsman (accepted the extra stress + emotion tag).

**4. Autobiographical Identity — self-crystallized, max 3–5 tags.**
- Approach: `v.identity` holds 3–5 core self-beliefs, NOT hand-configured — self-formed when events hit extreme salience (near-drowning, saving the village from fire, betrayal, reaching Master craft). These tags are permanent biases on attention and goal selection (e.g. "Pip's mother" → Pip's crying salience x5).
- Why it's the most real: Humans are the product of their own past's biggest scars and triumphs.
- Stopping point: NO literary autobiographies; NO more than 5 tags (old ones shed when new events arrive); NO identity crisis.
- Who conceded: Master Craftsman (let identity affect decisions) ↔ Old Scholar (accepted identity as just tag enums + coefficients, no literary text).

**5. Expectation / Prediction Engine — Anchored Expectations (fastest consensus).**
- Approach: Each villager holds a few expectations `[object, attribute, predicted value, confidence]`. Prediction matches → reinforce belief, costs 0 calories. Deviation past the threshold → a `SURPRISE` event = deviation × confidence → generates emotion (disappointment/awe/anger) → forces Epistemic Store update + re-plan if needed.
- Why it's the most real: Disappointment is born only when expectation is betrayed; the brain saves maximum energy when everything is normal.
- Stopping point: NO full time-series/Bayesian forecasting; only 3 groups: tavern prices, item locations, loved ones.
- Who conceded: All 4 agreed immediately — satisfies cognitive realism, psychological drama, cheapest cost, environmental adaptation.

**6. Economy — Biophysical Scarcity.**
- Approach: Price = floor price × scarcity factor (actual stock / expected weekly consumption). Absolute material conservation: salt is really gone until the caravan arrives. Price shock → expectation violation → cancel purchase/switch to substitutes. The caravan records the demand signal, the next trip brings more following simple supply and demand.
- Why it's the most real: Price becomes the signal carrying real scarcity from nature to survival decisions — no invisible magic hand needed.
- Stopping point: NO haggling back and forth; NO complex inflation/credit.
- Who conceded: Master Craftsman (absolute material constraint) ↔ Epistemologist (take-it-or-leave-it trading, no auctions).

**7. Society — Reputation-Opportunity Pipeline + 3 seeded proto-norms.**
- Approach: Social action with witnesses → high-salience memory → distorted 1-hop rumor → trust/reputation → when a role vacancy opens (village head, guard, healer), the most reputable person in collective belief is chosen. Seed 3 proto-norms: (1) no stealing (caught red-handed → all trust lost); (2) protect small children; (3) fire mutual aid. Violation → social ostracism. Reputation has a dark side: false rumors create false reputations (the scapegoat link).
- Why it's the most real: Recreates how medieval village order forms: real behavior → rumors → collective prestige → role recognition, prejudice's dark side included.
- Stopping point: NO modern democratic legislation; NO macro class conflict; NO complex written law.
- Who conceded: Master Craftsman (let distorted rumors steer prestige) ↔ Epistemologist (accepted hardcoding 3 proto-norms as the nucleus instead of demanding 100% spontaneity).

### 6.4. Proposed Implementation Order (criteria: cheap + high leverage + story-generating)

```
[Phase 5: Release v0.4.0-phase4 — hoàn tất push token, điều kiện tiên quyết]
        ↓
[Phase 6A: Giác quan & Kỳ vọng]  1. Selective Attention (3-gate) → 2. Expectation Engine
        ↓
[Phase 6B: Thích ứng & Sinh thái]  3. Dynamic Candidate Generation → 4. Carrying capacity + tile depletion + 4 mùa
        ↓
[Phase 6C: Tâm lý sâu & Căn tính]  5. Conflicting Motivations (2 tầng) → 6. Identity kết tinh
        ↓
[Phase 6D: Kinh tế & Xã hội]  7. Scarcity pricing + demand-responsive caravan → 8. Reputation pipeline + 3 proto-norms
```

**Roadmap ahead:** Phase 7 — complex society & institutions (customary courts, guilds, inheritance, superstition/rituals); Phase 8 — inter-regional economy, medieval credit, contact epidemiology, harsh climate; **Phase 9 — AI Brain integration** (when the world has its own internal logic, authentic memories, and deep motivations for AI to truly live and reflect in, not a chatbot answering prompts).

### 6.5. Lead's Notes After Round 2

1. Agree ~90% with the council. Best rebuttal of the round: "the 15 layers mean deepening the pipeline, not stuffing in more systems — the Expectation Engine helps **throw away** hundreds of lines of rigid code."
2. Keep the Old Scholar's warning as the acceptance condition for every 6A→6D sub-phase: **each new layer must prove it creates a story the old layers couldn't** — otherwise 6A→6D could still become "add systems → gigantic code" in disguise.
3. The three concerns in 6.2 (waterfall, cultural priors, keeping highest-need-wins at critical thresholds) become mandatory constraints when writing the Phase 6 spec.

## Part 7 — Adaptation Master Document + Round-3 4-Persona Council (2026-09-16)

### 7.1. Context
The user sent Master Document v1.0 (12 chemicals, 9 organs, feeling-scape, voice, dream...) requesting selective adaptation — game logic only, drop the roadmap. The lead wrote `docs/ADAPT_MASTER_DOC.md` (ADOPT/DISCUSS D1–D4/DEFER/DROP) and `docs/ADAPT_D1-D4_DETAIL.md` (each item compared against current code with file:line). Before D1 settled on an option, the user uploaded another external build, "Hearth" (~5,300 lines, literally applying our review) — 3 lessons: misery must be bounded (or it ratchets), opinion = a list of reasons with decay (steal that for 6D), "long-run balance is not solved" (labour allocation is our blind spot → Phase 7).

### 7.2. Two Additions From the EP Discussion (settled into the doc)
1. The `FeelingSubstrate` interface right now (getFeelingScape/getLayers; C3 goes through it; a Phase 7 swap won't break AI brain).
2. Cross-effects as accumulating accumulators + dt-scaled decay (determinism), no on/off conditionals.

### 7.3. Round-3 4-Persona Council — Results (full minutes: `docs/ADAPT_4PERSONA_DEBATE.md`)
**Consensus:** A4 layering (AI reads only qualities, never numbers); D2 = vocabulary-only, 0 new organ state machines; **defer D3** (no consumer = bug #13); trim 40 qualities → ~12 core (saves quota); WHY HUD must purge float numbers after 6E.
**Sharpest rebuttals:**
- The Master Craftsman: the interface is a "polite lie" if it promises a smooth swap — 3 linear accumulators vs 12 nonlinear chemicals, signal distributions overturned, AI brain will go mad.
- The Ecologist: Option 1 is all one-way arrows, missing closed-loop feedback — it will break at the root by Phase 7.
- The Epistemologist (rebutting): the interface is honest **iff** it's a mandatory single path — all cognitive code must ask the substrate, poking `v.body` directly is forbidden. Violation = decoration.
- The Old Scholar: hourly accumulator decay discards chronic states — a mother buried her child yesterday, today eats her fill of potatoes and is `content` = a soulless robot.
- D2: the burnt-throat counterexample (drinking water gushing back out) + bladder (wetting when scared) — the Master Craftsman resolved it with a 3-line `conditions[]`, no 9 organs needed; but the vocabulary **must** read `conditions`, not just 6 fields.
- D3: the best idea — voice intensity → acoustic amplitude in A2 (a scream from 40m jolts the guard awake) — but still deferred for quota.
- D4: the Old Scholar accuses "sleep = the unfeeling reset button"; the Master Craftsman warns of a depression loop (no healing mechanism yet); the Ecologist proposes an asymmetric 10–15% `stressResidue` that dissolves only after 2–3 peaceful days.
**3 questions for the EP:** (1) 1A YAGNI vs 1B interface now; (2) smallest 6E: Alpha (A3+D1+A2) vs Beta (Alpha + A1/D2 12 qualities, the council recommends Beta); (3) 3A clean-cut D4 vs 3B add `stressResidue`.

### 7.4. Backlog From Hearth (user approved)
- Phase 7: long-day soak test + labour allocation model ("2 people on water duty today").
- 6E: accumulator floors + adaptation (anti-ratchet like Hearth's mood −100).
- 6D: relationship = a list of reasons with decay (replacing single numbers).

### 7.5. 6C PASS at Attempt 2/2 (2026-09-16)
Phase 6's biggest lesson: **green tests don't mean living gameplay**. Attempt 1 placed the guard in a planTick wrapper — but `tests/18_autotest.js` bundles AFTER `utility.js`, so it wrapped OUTSIDE and swallowed `{verb:'work'}` before the guard could run. A bleeding villager kept working, and tests stayed green because they used `wait`.
The correct fix: place the guard at the **production choke point** `brainThink` — where every decision path passes through, unreachable by any wrapper. The Examiner verified with its own adversarial probe (boundary 0.69/0.71, player not exempted, 150 ticks with no oscillation, flee not stomped) — 9/9. New rule: every gameplay guard must live in the production path, and tests must drive the real bundled chain.

## 2026-09-16 — Surviving API Flakiness With Small Tasks + Checkpoints
Google API through the egress proxy was flaky (POST streamGenerateContent dropped, 400 location filter) — not quota. A 60m task hit by an error lost everything. Strategy change: split phases into sequential ≤20m tasks, each task (1) saves a checkpoint `.phase6d_progress.md`, (2) defines the interface for the next task, (3) self-verifies with a probe driving the real production path. Losing 1 task loses only 1 slice. Plus the user's decision: default model High → flash-medium (the Examiner stays as the quality gate).

## 2026-09-16 — D1 Done, Lead Verifies Instead of Burning Quota
Robin was cut twice (20m timeout, proxy refuse). The code was on disk, so the lead self-verified: rebuild + green harness + 8/8 probe driving the real production path. No more agy quota burned. Lesson: when the code is already on-disk and only mechanical verification remains, the lead is faster than a re-dispatch. The `.phase6d_progress.md` checkpoint is the interface contract for the next task — it is what saved Task 1.

## 2026-09-16 — 6D Done: Scarcity + Caravan + Reputation, Examiner PASS on the First Attempt
Phase 6D completed in 4 sequential tasks (D1 → D2 → D3 → 27_autotest), each self-verified with a probe driving the real production path, then re-run by the lead. Harness 263 lines, 0 FAIL, part27 3/3 — the Examiner audited once and it was PASS, no fix round needed.
**6D's biggest lesson: the checkpoint is an interface contract, not just a log.** Task 2 (caravan) worked precisely because Task 1 left the full `recordDemand/getDemand/getAllDemands/consumeDemands` definitions in `.phase6d_progress.md` — when Task 2's first run died from the proxy location-filter error, the retry run didn't need to ask the lead again. Task 4 also worked thanks to Task 3's pre-recorded T2/T3 contract. The "≤20m task + checkpoint" strategy proved right for surviving flaky APIs.
**Second lesson: don't trust worker summaries, even when the numbers look beautiful.** Task 3 reported probe 31/31 — the lead wrote his own probe and found his own vacancy assert was also vacuous (winner undefined because he hadn't understood the API returning `res.winner`). Fixing the probe into a meaningful case (thief hunting 5 vs honest 3 → honest wins, thief score -1) is what really tested T2. The Examiner also re-verified everything with its own probes.
**Third lesson: the checkpoint must be corrected when an audit proves it wrong.** The lead once recorded "child harm → collapse trust" as a working feature; the Examiner proved child-harm/fire-refusal were dead API (0 production callers). Correct the checkpoint immediately; don't let a false claim stand. Acceptance still held because the spec had scoped them as "seeds" — but the record must be honest.
**Design:** reputation = a list of reasons with decay (not a single number) — matching the Hearth lesson's recommendation. Instant village-wide ostracism violates the "villagers only know through honest senses" principle — Phase 7 design debt (scope ostracism by local belief/gossip propagation).

## 2026-09-16 — Phase 6E Begins: E1 PASS on the First Audit

**Context:** The user asked "what is 6E" → explained 1B/Beta/3B → the user asked about the philosophical boundary "should the sim model only physics/physiology, and hand over all psychology/behavior to AI brain?" → settled on 3 layers: Layer 1 sim = body signals (deterministic); Layer 2 future AI brain = meaning/story; the boundary = signal vs story. User: "so should the current process just continue?" → continue, because 6E is exactly Layer 1 + the contract AI brain will read.

**E1 (substrate interface + A3 + D1):** Robin implements → Examiner Tier-3 PASS on the first attempt (independent probe 14 assertions, adversarial lint bypass-test, determinism 1.11e-16, harness 272 lines 0 FAIL). No fix round needed — like 6D, unlike 6C (6C needed 2 rounds for the "green tests but dead gameplay" bug).

**Non-blocking Examiner debt left for E2+:** (1) lint only matches literal `v.body.` — bracket access slips through, no code uses it yet; (2) `v.mood` inferred from stress — E2 aware; (3) 4-quality scape placeholder — E2 expands to 12; (4) every `domain==='danger'` routes into fearFatigueAcc — a deliberate choice, noted.

**Dispatch lesson:** the first run died prematurely leaving nothing because the checkpoint hadn't been written yet — from now on, dispatch prompts are saved in the project (`.phase6e_e1_prompt.txt`), and the brief emphasizes "write early, write often". Transient failures don't cost quota (no tokens generated); what they cost is the lead's babysitting time.

## 2026-09-16 — 6E E2: The Examiner Catches "Green Tests, Dead Gameplay" a Second Time

**What happened:** Robin submitted E2 (12 qualities, text WHY HUD, eye-read) reporting 7/7 PASS → Examiner audit round 1: **FAIL blocking B1** — the entire A3 signal→scape path had no production caller; 5/24 kinds were dead arrows; a dead relative still `content`. Exactly the 6C pattern ("survival guard never fires in the real game") recurring in the feeling layer.

**Reinforced lesson (2nd time): "probes running through game systems" must be a criterion written in the brief, not just how the Examiner checks.** The original E2 brief asked for a "real production-path probe", but Robin understood "real" = running on the compiled bundle, while signals were still hand-injected. This correction brief wrote it explicitly: "a real wildfire (running through game systems, NO hand-injecting signals) + control scenario". Once the criterion was spelled out, Robin fixed it right in round 1: wired wildfireTick/survivalGuard/killVillager/setDowned/spreadGossip/birthChild/marryVillagers → 23/23 kinds alive → Examiner re-audit PASS (independent probe 16/16, harness 277 lines 0 FAIL).

**New rule for every implementation brief from now on:** acceptance must list *negative controls* (a scenario with no stimulus → behavior unchanged) and ban *hand-injection* for the wiring part. "Runs on the bundle" ≠ "lives in the game".

**A1 eye-read (the lead reads with his own eyes):** the project's first acceptance by reading narrative — Alden's 24h arc felt seamless like a real person (hunger→fire fear→burnt throat→drinking without quenching thirst→sleep→healed→healthy). This is qualitative evidence unit tests can't give; keep this ritual for future feeling slices.

## 2026-09-16 — 6E E3: PASS on the First Audit — a Good Brief Needs No Fix Round

**E2 vs E3 contrast:** E2 FAILED because the brief wrote the vague "real production-path probe" → Robin misunderstood → 1 correction round lost. The E3 brief wrote acceptance explicitly word by word (50-cell negative control, hand-injection banned, measurable formulas) → Robin submitted 10/10 → Examiner independent probe 20/20 → PASS on the first attempt, 0 corrections. **Brief quality decides the number of correction rounds, not dev skill.**

**Notable detail:** the Examiner's first run asserted wrongly (thought the victim must hear their own scream) — the code was physically correct (source exclusion), the test was wrong. The Examiner fixed its own test instead of filing a false bug. This is the good side of "verify by running code yourself": even the verifier can be wrong, and running code catches the verifier's own mistakes.

**Small philosophy debt (N-a/N-b):** ADR-003 wrote "derived from body/mind" and "8%/day" but the implementation is default 1.0 and linear −0.08/day. Both satisfy the verifiable consequences (real ceiling, 3 days → ≈0). Noted: specs should be written in measurable consequences, not vague intent — a lesson for SPEC_PHASE7.

## 2026-09-16 — 6E E4: The Verifier Can Be Wrong Too — and Gareth Is Real

**Incident:** E4 removed `|| v.name === 'Gareth'` believing "Gareth doesn't exist" — a premise from the very doc fix 782b3ca the lead approved yesterday. The Examiner ran the code: Gareth is a real Wandering Knight from the initial commit, 11 canonical villagers not 9. Regression: Gareth went from daring to face wolves to fleeing.

**Three layers of lessons:**
1. **Verify premises with code before deleting.** Never delete character-specific code based on memory/docs — docs can be wrong too, and yesterday's doc mistake nearly became today's regression.
2. **The verifier can be wrong too.** In E3, the Examiner asserted wrongly (thought the victim must hear their own scream) then fixed its own test. In the E4 re-audit, the Examiner asserted wrongly again (thought Gareth alone should also stand) then fixed it. "Verify by code" doesn't mean the verifier is infallible — it means mistakes get caught by code, including the verifier's own.
3. **A doc is a claim, not evidence.** GAME_DESCRIPTION once wrote "9 villagers" while the code spawned 11. From now on, doc rosters must be generated/verified from `03_roster.js`, never hand-written.

**Phase 6E closed:** 4 slices, 2 FAILs (E2 dead wiring, E4 Gareth regression) both caught by the Examiner, both fixed within the attempt budget. Final harness 282 lines, 0 FAIL.
