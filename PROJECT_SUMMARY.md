# willowbrook_natura — Project summary
_Updated: 2026-09-16. Comprehensive project document for the project owner._

---

## 1. What the project is

**willowbrook_natura** is a medieval village life-sim game, running entirely in the browser, **a single HTML file, no server, no network needed**.

The project was born from merging two directions:
- **Willowbrook** — existing web village game: pixel-art graphics, 8 controllable villagers, daily schedule, trading economy, church bells, minimap.
- **Natura (v9)** — the "living body" simulation philosophy: villagers with real biological needs (hunger/thirst/fatigue/heat/oxygen), a world that reacts for real (wildfire, lightning, seasons), death is really death, memory is real memory.

**Long-term goal:** bring the game toward Natura v9's system depth, then toward **RimWorld** — but **excluding the "AI brain"** (the AI brain that would drive villagers via LLM). Every current system is **deterministic** (no LLM calls in the game). The AI brain is a future plug-in via the bridge API.

## 2. Architecture

| Component | File | Notes |
|---|---|---|
| Source (modular) | `src/` — 67 modules (49 game + 18 test), bundle order at `src/_order.txt` | Game logic lives here, one system per module |
| Bundler | `scripts/build_willowbrook_natura.py` | Just a script that **merges** the modules into 1 file, contains no game logic |
| Playable file | `willowbrook_natura.html` (~845 KB release, no tests) | **Generated** from `src/`, **never hand-edited**; `willowbrook_natura_test.html` is the test bundle |
| Build | `python3 scripts/build_willowbrook_natura.py` | Re-run whenever `src/` changes |
| Test | Node harness (`?test`, runs via Node with a simulated DOM on `willowbrook_natura_test.html`) | In-page autotest, 289 lines, **0 FAIL** |

**Iron rules:**
- Only edit modular `src/`, rebuild the bundle; never hand-edit the HTML file.
- No LLM/AI calls in the game. The AI brain is a future plug-in via the bridge API.
- Commit/push is done by the project owner (no authenticated automatic push path).

## 3. Completed systems

### Foundation (PART 12)
- **Survival & death:** death by hunger, thirst, drowning, cold, heatstroke, exhaustion. Corpses decompose (fresh → rotting → bone → gone, ~3 days), burial with tombstone.
- **survivalGuard:** "survival instinct" runs every tick — hunger/thirst/fatigue/danger at critical level **interrupts all plans** to eat/drink/sleep/hide. Survives without AI.
- **Honest perception:** villagers only "know" what their senses allow — verbal distances ("a few meters away"), directions, weather/body feeling, vision reduced at night/in rain/storms. No exact coordinates, exact temperatures, or biological stats leak.
- **Real action queue:** 16+ verbs (`go/take/drop/use/speak/eat/drink/sleep/rest/wait/fell/forage/fish/farm/build/cook/...`) become multi-step plans, interrupted mid-way by survival needs. Unknown verbs **error out clearly**, no guessing.
- **Society:** talking within earshot, bond grows through contact, social events.
- **Pregnancy & birth:** high-bond couples conceive, pregnancy ~20 game days, children need food and grow, child rendering at correct proportions (big head, short legs).
- **Interactive world:** fell trees for wood, drop/pick up items, campfires, fishing by hour/weather, 4-stage crops, wandering chickens lay eggs.
- **Disasters:** lightning strikes (casualties + fire), wildfire spreads with wind/dryness, witnesses learn "danger".
- **Basic illness & injury:** burns/lightning cause pain that reduces performance, prolonged wet + cold causes fever.
- **Economy:** per-person gold, Sella's shop (bread/fish/eggs/meat/meals), buying/selling balances gold and stock.
- **Event feed:** `getEvents(since)` — death, birth, pregnancy, bond, fire, lightning, danger lessons.

### Intent planner (PART 13)
- `postIntent(name, text)` — command in plain language: "stoke the fire", "chop wood for the winter", "bury the dead", "tend the crops"... turns into real plans.
- **Dreams:** un-understood intents are saved into `v.dreams`; repeated 3 times → records a global "capability gap". `getDreams()` / `getCapabilityGaps()` for the future AI brain to read.

### RimWorld realization (PART 14)
- **Medieval medicine:** location-detailed wounds (arm/leg/torso/head), severity, bleeding; **blood is a real resource** (severe blood loss can kill); open wounds unbandaged → infection → fever; craftable **poultices** (herbs), **wooden splints** (wood+cloth), **fever tea**; `tend` verb (bandaging per medicine skill); fractures need splint + rest + eating over many days to heal. Wren (the herbalist) forages herbs herself to make medicine.
- **Downed/rescue like real life:** unconscious / bleeding / broken leg (can only crawl); `rescue` carries victims to bed (0.45x walking speed); close ones auto-rescue when safe.
- **Dangerous beasts:** **wolves** hunt in packs at night (afraid of fire, afraid of crowds), **boars** charge when approached, **bears** rare but extremely dangerous, sniff out food; villagers run indoors, fight back with tools when cornered, shout for help; `hunt` → butcher → meat + hide.
- **Skills:** 8 skills 0–10 (farming, cooking, building, medicine, hunting, fishing, foraging, tailoring), XP from real work, **aptitude matching the role** (Wren good at medicine, Finn good at fishing...), level affects speed/yield/quality. Bridge `assignWork(name, job, priority)` for the AI brain/player to assign work.
- **Construction:** costs real wood/stone/straw, novice builders build slow + sloppy (low durability), structures have their own durability, storm/fire/wolves damage → `repair`.
- **Clothing:** multiple layers (inner/outer/shoes), warmth stat, **wet loses 60% effectiveness**, torn clothing means cold, `mend` patches, tailor makes new clothes from cloth/hide.

### Second realization batch (PART 15)
- **Food:** 3 meal tiers (poor/fine/lavish) by skill + ingredients; **raw meat 35% stomach ache**, food spoils by the day (hot spoils faster 1.6x); `preserve` salts/smokes for storage.
- **Husbandry:** `tame` tames chicks/piglets with food (by skill), penned + fed animals lay fast, starved ones get sick/go feral, pigs farrow in pens; wolves fear fenced land.
- **Traveling caravan:** each season 3 merchants camp ~14 hours, goods and prices differ from Sella's shop, guards chase wolves, gold balanced.
- **Dark side of society:** insults → bond down + grudges; 3 grudges + low bond → **hostile**; fistfights cause real injuries but **stop at downing, no killing**; bystanders intervene; apology via `speak` reconciles; grudges fade 5%/day.
- **Firefighting:** villagers fetch water from well/pond themselves to douse (`douse`), priority house > people > fields > distant forest; fire on their own person → still run first; thick smoke causes suffocation.

### Phases 2–6 (summary — details in `WORK_LOG.md` and `docs/archive/thinking-process.md`)
- **Phase 2:** 6 further realization batches (2A–2F) — deep building, medicine, society, seasons, economy, events.
- **Phase 3:** survival balance — after 6A→6D, the village survives across seasons (no more mass starvation like the old build).
- **Phase 4→7A roster:** **11 villagers** (Marta, Bram, Sella, Tobin, Wren, Finn, Alden, Pip, plus **Rowan** the bard, **Clara** the silk merchant, **Gareth** the knight). Canonical count verified against `src/data/03_roster.js`.
- **Phase 5 (Release):** tag `v0.4.0-phase4` — separate, Phase 6 not merged in.
- **Phase 6 "Imperfect humans" (completed 6A→6E; 6D at `05caf95`, 6E at `f3a41b7`):**
  - **6A Senses & Expectations** — attention gates, expectation tuples + TTL + surprise (12/12 test).
  - **6B Adaptation & Ecology** — dynamic candidates belief-first, seasonal depletion/regeneration, hungry/afraid wolves, weather → fire (11/11 test).
  - **6C Survival Guard in production `brainThink`** — Tier-2 survival-instinct override, motivation, emotion, identity (9/9 test; adversarial probe 9/9).
  - **6D Scarcity economy & society** — scarcity pricing (salt out of stock → price rises), caravan responds to real demand, reputation + gossip (false rumors can frame innocents), anti-theft proto-norm, fill vacancies by collective trust (3/3 test Part 27).

## 4. Bridge API for the AI brain (future)

The game is ready to plug in an external AI brain via `window.__aiBridge`:
- `listVillagers()` — villager list
- `getPerception(name)` — honest perception of 1 villager
- `postAction(name, action)` — command a verb
- `postIntent(name, text)` — command in plain language
- `setBrainControlled(name, enabled)` — AI takes over (turns off scripted schedule)
- `assignWork(name, job, priority)` / `getWork(name)` — assign work
- `getEvents(since)` — world event stream
- `getDreams(name)` / `getCapabilityGaps()` — things villagers "want but the game can't do yet"

## 5. Finalized design decisions

1. **Thought/mood → left to the AI brain.** No scripted ideology/emotion systems.
2. **Human-vs-human combat → left to the AI brain.** Currently conflict comes from beasts; villager fights stop at brawls, no killing.
3. **All systems must be period-correct** (medieval village): no electricity, no modern tech, no modern surgery — medicine is herbs, wooden splints, rest.
4. **Honest perception:** villagers never know "top-down" numbers.
5. **Real new verbs:** when a new action is needed, write a new verb/mechanism — never squeeze it into a near-matching verb.
6. **Never replace AI art with procedural drawings** (rule from the Character Asset Compiler).
7. **Needs model (canonical, per code):** `brain/utility.js` computes **6 named deficits** — `satiety` (hunger), `hydration` (thirst), `fatigue` (fatigue), `injury` (injury), `cold` (cold), `social` (social) — plus risk modifiers (threats, fire, beasts). The body sim tracks 7 physiological states: hunger/thirst/fatigue/body temp/oxygen/blood/illness. **There is no official "8 needs" list in the code** — the 8 in `WORK_LOG.md` was just the death-from-needs count in an old test batch.

## 6. Test status

- `node --check` on the page's JS: **PASS**
- The `?test` harness runs under Node (simulated DOM, `willowbrook_natura_test.html`): **289 lines, 0 FAIL** — covers PART 12–29 (medicine, rescue, wolf hunts, skill XP, building materials, clothing warmth, meal tiers, taming, caravan, fights, firefighting, attention/expectation, seasonal ecology, survival guard, scarcity pricing, reputation/gossip)
- Tier-3 game logic (gameplay/shared-framework changes) all goes through **independent Examiner audit** (runs the code itself, evidence-backed PASS/FAIL file:line) before commit — applied to every 6A→6D sub-phase
- Real bugs found and fixed during testing: villagers at work wouldn't go fight fires; broken-leg villagers weren't bandaged; rescue got stuck pathfinding; survival guard didn't fire while villagers were working (old test blocked the production path).
- **`?test` not yet run in a real browser** — open `willowbrook_natura_test.html?test` once (test bundle).

## 7. Git status

- Repo: `https://github.com/punnycroz-cmd/realWorld.git`, HEAD at commit `a0f5bd9` + review-fix commits (2026-09-22) — Phase 7A (customary court + guilds) committed at `5e970be`, Phase 6E closed at `f3a41b7`
- All phases 6A→7A committed separately, complete. **Not pushed** — waiting for project owner confirmation (needs a fresh one-time token for authenticated push)

## 8. "Review later" backlog (vs RimWorld)

Details in `docs/archive/RIMWORLD_GAPS_BACKLOG.md`. Summary:
- **10 missing items** (buildable, no AI needed): world map + factions, drama-tuning storyteller, deep medicine (amputation, wooden prosthetics), brewing, weapons + armor (bows/spears/swords), room concept + indoor temperature, animal training, storage zones/stockpiles/bills, soil fertility, start scenarios/win-loss.
- **4 priorities when we return:** brewing, wooden prosthetics, bows + armor, indoor temperature/rooms.
- **Intentionally not doing:** electricity, tech tree, ideology, spaceships.
- **Left for the AI brain:** thought/mood, human combat, prisoners, dialogue content.

## 9. Related projects (brief)

- **Natura v9** (`natura-v9.html`, `build_v9.py`): the original sim with an AI brain (Ask API + Hebbian memory). **STOPPED by order** — do not restart unless asked.
- **Original Willowbrook** (`village-game/`, `willowbrook/`): browser village game delivered 2026-09-10, untouched.
- **Character Asset Compiler v2**: 516 compiled character combos, complete atlas.
- **Cozy village game** (goal_ab08dcecaf15): Stardew-like farm game project with AI-driven NPCs — separate long-term goal.

## 10. Next steps

1. The project owner opens `willowbrook_natura_test.html?test` in a real browser once (test bundle; release build is `willowbrook_natura.html`).
2. Decide on pushing (needs a fresh one-time token).
3. **Phase 7B** — inheritance/rituals per `SPEC_PHASE7.md` (7A done; 7E debt resolved 2026-09-22).
