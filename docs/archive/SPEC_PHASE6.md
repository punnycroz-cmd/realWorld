# SPEC PHASE 6 — "Humans Are Not Perfect"
_Date: 2026-09-16. Status: SPEC (not yet implemented). Prerequisite: Phase 5 release has been pushed._

## Source docs (read before implementing)

- `docs/thinking-process.md` **Part 4** — 9 guiding principles (mandatory constraints).
- `docs/thinking-process.md` **Part 5** — the Executive Producer's strategic assessment.
- `docs/thinking-process.md` **Part 6** — round-2 council minutes: 7 finalized approaches + implementation order.
- Analysis of 2 external Natura builds (GLM 5.3 / Qwen Coder) — steal list approved by the user 2026-09-16, integrated into this spec (source noted per item).

## Immutable constraints (from Part 4 + round 2, summarized)

1. **Anti-perfection is the supreme law.** Every new feature must prove it creates **stories the old system could not create** (Ông đồ's acceptance criterion).
2. **Two thresholds:** below ~80% is the domain of trade-offs/psychology; above ~85–90% biology overrides dictatorially (keep highest-need-wins at the critical threshold — do not remove it).
3. **Dying stupidly must have internal logic** (stale memory, false belief, pride, panic with a cause) — no RNG bullshit.
4. **Absolute conservation of matter** — no fallback may conjure food/materials out of thin air.
5. **Belief ≠ truth:** villagers only use senses/memories/beliefs (3–5 compact tuples), never pointers to hidden truth. Render/debug logs may be omniscient as long as it doesn't infect decisions.
6. **Bounded:** no multi-level food chains, no microclimates, no complex epidemiology, no full Bayes, no haggling/inflation/credit, no democratic legislation.
7. **No 15-layer waterfall** — implement in thin vertical slices, upgrade dimensions in parallel.
8. **Must seed cultural priors** — don't demand 100% bottom-up emergence (it will deadlock).
9. **Don't mix Phase 6 into the already-audited Phase 4 release.** Each sub-phase: Robin implements → Examiner Tier-3 audit → fixes (max 2 rounds) → re-audit PASS → only then move to the next sub-phase.

---

## 6A — Senses & Expectations (do first: cheapest, highest leverage)

### DO

**A1. Selective Attention — 3-gate filter** (placed in `brain/12b_perception.js`, at the sensation → attention → interpretation → memory pipeline position):
- Gate 1 — Sudden sensation: **uncontrolled fire (wildfire — normal-use campfires/cooking fires do NOT count)**, screams, **wolves/bears in a hostile state (stalk/attack/hunt/fight — exactly the audited Phase 4 behavior; docile beasts in wander state do NOT trigger)** → preemptive interrupt, seizes attention immediately. A firefighting (douse) plan is not wiped by the very fire being fought.
- Gate 2 — Emergency state: biological need >75% → tunnel vision, filters out everything that doesn't solve hunger/thirst/fatigue/cold.
- Gate 3 — Current goal (top-down relevance): only objects/events relevant to the in-progress task enter interpretation + memory; the rest is "background noise", skimmed without storing.
- Ông đồ's round-2 concession: gate 1 crushes every "lost in thought" state.

**A2. Expectation Engine — Anchored Expectations** (`brain/knowledge.js`):
- Record: `{subject, attribute, predictedValue, confidence, learnedTick, source}` — steal **Qwen** `KnowledgeFact` (`types.ts:292-304`) + add the `predictedValue` field.
- Rule: perception matching the prediction → +confidence, costs 0 extra processing. Deviation beyond the threshold → event `SURPRISE = |actual − predicted| × confidence` → generates emotion → forces Epistemic Store update → calls re-plan if needed.
- Applies to only 3 groups (agreed stopping point): **shop prices** (links to 6D), **household furniture positions**, **the presence of loved ones**.
- **Stale stash beliefs** — steal **GLM** `knowledge.ts` (`observeStash`/`forgetStashes`): villagers remember the locations of items they've seen; beliefs expire after N sim days; arriving to find the item gone = expectation violation → surprise. This is the first implementation of belief tuples (Principle 5).

**A3. Brain boundary refactor (pattern, NO logic change)** — steal **Qwen** `observe/think/learn` + **GLM** `brain/brain.ts` interface:
- A clean boundary between sim and decision in `brain/` (`07_ai.js`, `utility.js`): `observe()` (contains the A1 attention filter) → `think()` → `learn()`, typed perception DTOs.
- `brain/09_bridge.js` keeps its contract for the future AI brain. Architecture preparation for Phase 9.

### DON'T DO
Detailed FOV cones; hearing by sound wavelengths; smell/taste; time-series forecasting or full Bayes models; expectations for anything outside the 3 groups above.

### Acceptance criteria (Examiner Tier-3)
- A villager with hunger >75% walks past inedible objects in view without recording a memory (prove gate 2 with a discrimination test).
- Bread price shock → surprise + purchase cancellation + disappointment emotion (links A2→6D).
- Stale belief: remembers a stash from 5 days ago → arrives to find it empty → surprise + belief superseded (with a history trail).
- Deterministic attention filter: same seed → same set of attended objects.

---

## 6B — Adaptation & Ecology

### DO

**B1. Dynamic Candidate Generation — replace the hardcoded ladder** (`brain/utility.js`, `brain/13a_intent.js`):
- Drop the static `A → B → C` fallback chain. When an action stalls: query Epistemic Beliefs to generate **at most 3 candidates** from goal templates + beliefs + habit.
- Only re-plan on a "cognitive shock" (surprise from 6A / interruption), **never** re-evaluate every tick → avoid action jitter (Nhà sinh thái's round-2 warning).
- Steal the idea from both external builds: transparent candidate scoring with a `reason` (GLM `BrainDecision.reason`, Qwen candidates have scores) — wired into `brain/22b_why.js` so the WHY panel can explain decisions.

**B2. Carrying capacity & tile depletion** (`sim/12d_world.js`):
- Tile/bush depletion: harvesting genuinely depletes the tile's resource; regens by season; **winter regen can be 0**.
- 4 seasons affect: grain, forage/wood, huntable animals (links to `entities/14c_wildlife.js`).
- 2-state wolves (finalized in Part 4): normally deterred by fire/torches/crowds; **extreme hunger overcomes fear** (links to Survival Guard in 6C).

**B3. Weather → fire causal chain** — steal **GLM** `weather.ts` + `fire.ts`:
- `dryDays` counter → `dryness`; fire spread = f(terrain/tree/house fuel, wind direction, dryness); rain/snow extinguishes fire.
- Wired into `systems/15e_firefight.js` (firefighting already exists — now it gets an **ecological cause** for fire).
- Burned tiles → scorched + ash with "burned" provenance (learn from GLM `onTileBurned`) — per Principle 4.

### DON'T DO
Full GOAP; scanning the whole map for paths; multi-level food chains (grass→rabbit→fox→wolf); microclimates; complex epidemiology.

### Acceptance criteria
- Blocked bridge → Bram generates candidates from beliefs (not a hardcoded ladder); same seed → same candidates (deterministic).
- Continuously harvesting one berry bush → depleted; winter regen = 0 (test across many sim seasons).
- Long drought → high dryness → fire spreads meaningfully faster than on wet days (discrimination test).
- Extremely hungry wolves attack despite torches; fed/normal wolves are deterred by torches.

---

## 6C — Deep Psychology & Identity

### DO

**C1. Survival Guard — the mechanism implementing Principle 2** (`systems/12c_actions.js`, attached at the front of the utility AI):
- Steal **GLM** `sim.ts:survivalGuard()` + **Qwen** `brain.ts:111-155` — **both independent AIs invented this pattern on their own** (guard clauses as absolute overrides of all candidates) → the strongest signal in the steal list.
- Life-or-death thresholds: thirst<8, hunger<6, warmth<6, blood<70, fire/wolves right beside → cancel interruptible actions + re-decide; emergency/survival-category actions are never interrupted.
- **Anti-oscillation** (GLM bug #5: eat↔run loop): re-decide lock/cooldown after every guard trigger.

**C2. Conflicting Motivations — 2-layer architecture:**
- Layer 1 (below 80%): duty / attachment / pride / habit compete with needs through **contextual** utility — explicit conditional modifiers, NO fuzzy weights (Thợ cả's warning).
- When a psychological motive beats a body need (Alden skipping sleep to nurse a sick person) → **suppression stress** + **emotion tag** (tired-but-proud) recorded in memory — the trade-off must leave an emotional trace (Ông đồ's condition).
- Layer 2 (above 85%): this is exactly C1 — biology overrides 100%, forced microsleep (biology beats poetry).

**C3. Emotion derivation layer** — steal **Qwen** `character.ts:407-435` (`entities/02_body.js`, runs after updateBody):
- Emotions generated from body/needs + decay: hunger→anxious, pain→suffering, fine→content. The cheapest substrate for the C2 emotion tags.

**C4. Body-factor chain** — steal **GLM** `needs.ts` (`entities/02_body.js` + `systems/12d_illness.js`):
- Untreated wounds → infection; every condition reduces the work factor / speed factor by severity; pain + blood loss accumulate.
- `bodyWorkFactor` wired into utility scoring: a limping person knows not to travel far — supports candidate generation (B1).

**C5. Autobiographical Identity — self-crystallizing** (`brain/knowledge.js`):
- `v.identity`: at most 3–5 self-beliefs, **NEVER hand-configured** — they form on their own when events reach extreme salience (nearly drowning, saving the village from fire, being betrayed, skill reaching Master).
- Enum tags + bias coefficients on attention (6A) and goal selection. Lesson from the round-2 slap (bug #13 `calcOccupationBonus` dead code): **if it's built, it must have a real effect** — e.g. "Pip's mother" → Pip's crying gets salience ×5. Old tags fall away when new events shake them.

### DON'T DO
Complex moral-philosophy theory; clinical mental illness; literary autobiographical text; identity crises; more than 5 identity tags.

### Acceptance criteria
- Alden at fatigue 70% + a sick person needing care → duty beats sleep → suppression stress + emotion tag in memory.
- Alden at fatigue 95% → forced microsleep regardless of duty (discrimination test: poetry loses to biology).
- Guard trigger → no oscillation: after the re-decide lock, the action stays stable for ≥ N ticks (anti-loop test).
- Extreme-salience event → new identity tag forms → the tag measurably affects attention (e.g. crying salience ×5).
- Unbandaged wound → infection → work factor drops → the villager picks lighter work on their own.

---

## 6D — Scarcity Economics & Early Society

### DO

**D1. Scarcity pricing** — steal **GLM** `economy.ts:14-22`, fix the magic number (`systems/13b_economy.js`):
- Price = floor price × (1 + scarcity) × seasonMult (food costs more in winter).
- `scarcity = max(0, 1 − stock/weeklyConsumption)` — **NOT** GLM's meaningless constant 8 (per the "a number ≠ science" critique in Part 5.13).
- Absolute conservation of matter: when the salt is gone, it's really gone until the caravan arrives. Price shock → expectation violation (6A) → cancelled purchase / switching to substitutes.

**D2. Demand-responsive caravan — BUILT FOR REAL** (`systems/15c_caravan.js`):
- The GLM worklog claimed this but the code was pure RNG (lesson: never trust AI self-reporting — the Examiner verifies by reading code). We implement it for real: the caravan records sold-out items (demand signals) → next trip brings more per simple supply/demand.

**D3. Reputation-Opportunity Pipeline + 3 seeded proto-norms** (`systems/12d_social.js`, `systems/20_social_life.js`, `systems/21a_ownership.js`):
- Social actions with witnesses → high-salience memory → distorted 1-hop gossip (using the existing claims/witnesses infrastructure) → per-villager trust/reputation.
- Role vacancies (village chief, guard, healer) → elect the most reputable person **in the collective belief**.
- Seed 3 proto-norms (learned from round-2 concern #2 — don't demand 100% bottom-up): (1) no stealing — caught red-handed → trust wiped out; (2) protect small children; (3) help fight fires. Violations → social ostracism.
- **Mandatory dark side:** false rumors also create false reputations (ties to the scapegoat story) — real societies are not fair.

### DON'T DO
Back-and-forth haggling; complex inflation or debt/credit; modern democratic legislation; macro-level class conflict; elaborate written laws.

### Acceptance criteria
- Scarce salt → price rises → villagers reduce meat-curing / switch to fresh food → demand signal recorded → next caravan trip brings more salt (closed emergent loop, tested across many trips).
- Thief caught red-handed → trust collapses → when a guard vacancy opens, the thief is not elected despite being strong.
- False rumor (witness mis-seeing) → false reputation forms → the dark side of society is tested.

---

## DEFERRED — not in Phase 6

- **Needs derived from body** (steal Qwen: `thirst=(1−hydration)×100`…): a good idea, would kill an entire class of needs/body sync bugs — but current needs are stable through the 30-day run + Examiner PASS. A deep Tier-3 refactor now has risk > reward. **Phase 7+.**
- Phase 7: complex society & institutions (customary courts, guilds, inheritance, superstition/ritual).
- Phase 8: inter-regional economy, medieval credit, contact epidemiology, harsh climate.
- Phase 9: AI Brain integration — when the world has internal logic, truthful memory, and deep motivations for the AI to genuinely live and think in.

## Implementation process

1. Order: **6A → 6B → 6C → 6D** (cheapest + highest leverage first; 6A is the foundation for 6C/6D).
2. Each sub-phase is an independent package: Robin implements per this spec → Examiner Tier-3 audit → fixes (max 2 rounds) → re-audit PASS → only then move to the next package.
3. Hard rule: edit modules in `src/`, rebuild via `scripts/build_willowbrook_natura.py`; **never hand-edit `willowbrook_natura.html`**.
4. Determinism: `Math.random` only in render/comments; all gameplay RNG through seeded streams (discipline since Phase 4).
5. Tests: every new feature needs a discrimination test (fails on old code by construction) + a green harness suite; long-run probes when touching needs/survival.
