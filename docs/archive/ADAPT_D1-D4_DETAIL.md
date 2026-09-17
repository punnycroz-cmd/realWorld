# D1–D4 DETAIL: What Exists → What We'll Do (vs the Master Document)

**Date:** 2026-09-16 · **Purpose:** walk through each item against the Master Document EP sent,
recording what's already in the code, what will be added, what's dropped/reserved, and why.
**D1 status:** EP hasn't decided on an option yet (see §D1 at the end) — this doc follows the lead's
recommended direction (Option 1: keep C3 + simple cross-effects; 12 chemicals → Phase 7).

---

## D1 — Emotion substrate: 12 chemicals vs the current C3

### What the source doc says
- 12 chemicals: ghrelin, leptin (hunger/fullness), cortisol, adrenaline (stress/fear),
  dopamine, serotonin (reward/stability), oxytocin (social),
  substanceP, endorphin (pain/pain relief), adenosine, melatonin, histamine (sleep/wake).
- Each chemical has its own production − decay formula (e.g. ghrelin decay 3.0/h),
  17 cross-effect pairs (e.g. adrenaline → cortisol +2.0, oxytocin → cortisol −0.5).
- Emotions **emerge** from chemical patterns. 3 sample causal chains:
  hunger → stress → irritability; love → peace; fear → exhaustion.

### What exists now (6C · C3 — already PASSED the Examiner)
`src/entities/02_body.js:243-290` — `deriveEmotions()` runs after `updateBody` each tick:
- **hungry → anxious**: `intensity = clamp((0.35 − satiety)/0.35, 0.1, 1.0)` (lines 275-278)
- **pain/damage → suffering**: accumulates wound + illness (lines 281-287)
- **stable → content** (baseline when nothing is wrong)
- **time-based decay**: each emotion has its own decay, intensity ≤ 0.01 gets dropped
  (except `content`) — emotions *fade gradually*, never switch on/off abruptly (lines 264-273)
- Emotions are already wired into: memory (C2 writes emotion tag `tired-but-proud`),
  utility (stress suppression), WHY trace.

**Missing vs the source doc:** no intermediate "chemical" layer; no cross-effects
(hunger doesn't raise stress, fear doesn't leave exhaustion); no chronic baselines
(weeks-long anxiety, months-long grief).

### What we'll do (Option 1 — recommended)
1. **Keep C3 as-is** — no tearing down and rebuilding a chemical layer.
2. **Add cross-effect couplings WITH DECAY** (accepting the proposal from the 2026-09-16 EP discussion —
   conditional on/off toggles aren't enough, the AI brain needs to see the *process*):
   - Each coupling is a per-villager accumulator with buildup + gradual decay over dt:
     `acc += rate(bodyState) * dtH; acc *= Math.pow(decayPerHour, dtH); signal += acc;`
     (dt-scaled to preserve determinism at any tick size.)
   - `hunger↑ → stress↑`: prolonged hunger gradually builds stress, which fades after eating —
     no abrupt on/off.
   - `fear↑↑ → exhaustion`: after a fear event, fatigue rises quickly over the next few hours.
   - `pain↑ → patience↓` in social utility (wired into the C2 modifier).
   - Each coupling is an explicit conditional (C2 discipline: no fuzzy weights), with its own discriminating test.
3. **Define the `FeelingSubstrate` interface now** (accepting the proposal from the EP discussion):
   - The contract the AI brain will read: `getFeelingScape(v)`, `getLayers(v)`.
   - Current implementation: delegates to C3 + couplings (§2).
   - Phase 7 implementation: the real 12 chemicals — **swappable without breaking the AI brain**,
     tests runnable against both implementations (test the migration path starting now).
   - Bug #13 discipline: the interface must be *actually used* (C3 goes through it), not a dangling declaration.
4. **Record the couplings as a table** (extending A3 — the world-event → signal table),
   so the Examiner can audit every causal arrow.
5. **Reserve for Phase 7:** full 12 chemicals + 17 cross-effect pairs as the AI brain's substrate,
   tuned against observed behavior (no fabricating numbers and hoping).

### Not doing / reserving (why)
- Not implementing 12 chemicals now: fabricated decay numbers (the doc states them as truth but they're parameters),
  12 state variables × 100 villagers = large test burden, dead-code risk (the bug #13 lesson),
  Robin's limited quota. This is Phase 7 in disguise.
- No new chemicals for mental illness (respecting 6C's NOT DOING).

### Real-life example (comparison)
| Situation | Source doc (12 chemicals) | Ours (Option 1 + decay accumulators) |
|---|---|---|
| Starved 2 days | ghrelin↑ → cortisol↑ → serotonin↓ → irritability, loss of appetite | satiety↓ → anxious↑ **+ stress that gradually builds and fades after eating** → irritability with a process |
| Meets a wolf, escapes | adrenaline↑↑ → racing heart → adenosine buildup → exhaustion | fear event → fatigue rises fast over the next 3h (accumulator) |
| Prolonged grief | serotonin↓ + dopamine↓ for weeks → depression | **not done** → Phase 7, through the defined `FeelingSubstrate` interface |

---

## D2 — Organs: 9-organ simulation vs vocabulary

### What the source doc says
- 9 organs (stomach, heart, lungs, muscles, skin, bladder, bowels, eyes, throat),
  each with discrete states (e.g. stomach: empty/light/full/overfull/nauseous;
  heart: slow/normal/fast/racing/irregular).
- The Organ → Quality table (stomach empty → `hollow`, heart racing → `racing`,
  skin clammy → `clammy`…).

### What exists now
Continuous body fields already exist: satiety, hydration, fatigue, pain, blood,
wetness, coreTemp, conditions (wound/illness…), workFactor/speedFactor (6C·C4).
**There is no** discrete organ layer — and none is needed, since every organ state in the doc
is just "bucketing" of an existing continuous field
(e.g. stomach empty ≈ satiety < 0.25; heart racing ≈ a fear event just happened).

### What we'll do
1. **Take the vocabulary, don't simulate organs.** The doc's Organ → Quality table is
   reused as a **vocabulary table**: each quality maps from existing body fields.
   - E.g.: `satiety<0.25 → "hollow"`, `fear just passed → "racing"`,
     `wetness>0.7 → "clammy"`, `throat: hydration<0.2 → "parched"`.
2. This vocabulary serves 2 places: **memory text** (episodic memory written in feeling words
   instead of numbers) and **D3 voice lines**.
3. The mapping table is a tunable parameter, with a test: same body state → same vocabulary (deterministic).

### Not doing / reserving (why)
- Not simulating 9 organs as separate state machines: 1-1 duplication of body fields,
  more state = more places to break = more test burden, and **generates no story**
  that body fields can't already generate (matching the directive "don't model everything").
- If Phase 7 needs the granularity (e.g. bladder urgent → seeking privacy),
  only then split it out — when a consumer (the AI brain) actually reads it.

### Real-life example (comparison)
| | Source doc | Ours |
|---|---|---|
| Marta is hungry | `stomach.state = "empty"` → quality `hollow` | `satiety = 0.18` → vocabulary `hollow` → memory records "belly hollow" |
| Bram finishes smithing | `muscles.state = "sore"`, `skin.state = "clammy"` | `fatigue = 0.8`, `wetness = 0.75` → "heavy", "clammy" |
| Difference | 9 state machines to maintain | 0 new state; same vocabulary, same story |

---

## D3 — Voice lines: generative engine vs intensity fragmenting

### What the source doc says
- 4 intensity levels: subtle (full sentence) → noticeable (short sentence) → insistent (fragments)
  → overwhelming (one word). E.g.: "My belly feels a little empty." → "Belly empty.
  Want bread." → "Empty. Empty. Bread." → "Bread. Bread. Bread."
- Style by personality (introvert = terse, extrovert = chatty…),
  by life stage (child/adult/elder), language mixing (strong emotion → mother tongue).

### What exists now
- Episodic memory stores text; the WHY trace + `#pi-why` HUD displays reasons in words
  (6A/6B already wired reasons into WHY).
- C2 writes emotion tag (`tired-but-proud`) into memory.
- **No** voice generator yet: current memory text is fixed per-event templates.

### What we'll do
1. **Intensity fragmenting** — take the doc's exact 4 levels, deterministic:
   - intensity < 0.35 → full sentence ("My belly feels a little empty. I should eat soon.")
   - 0.35–0.6 → short sentence ("Belly empty. Want bread.")
   - 0.6–0.85 → fragments ("Empty. Empty. Bread.")
   - > 0.85 → one word ("Bread. Bread. Bread.")
   - Intensity comes from C3's emotion intensity (already exists, already decays).
2. **Used in 2 places:** episodic memory text (replacing fixed templates) and the WHY HUD (dev).
   This is where Principle 2 of the doc takes shape: devs/players read *"Belly empty.
   Everything heavy."* instead of `satiety: 0.18`.
3. Vocabulary from D2 (organ qualities) + A1's 40 qualities (feeling-scape).

### Not doing / reserving (why)
- **Personality × life-stage matrix: reserve** it for when the AI brain exists — currently
  no consumer reads different styles; building it now = decoration (the bug #13 trap).
- **Language mixing:** reserved (the current game is monolingual in the sim).
- Voice doesn't affect decisions — it's only a *presentation layer* of existing feeling.
  Discipline: presentation must not drive behavior.

### Real-life example (comparison)
| Intensity | Source doc | Ours (identical in this part) |
|---|---|---|
| subtle | "My belly feels a little empty. I should eat soon." | identical — from C3 intensity < 0.35 |
| overwhelming | "Bread. Bread. Bread." | identical — from C3 intensity > 0.85 |
| Difference | + introvert/extrovert, child/elder styles | not yet — reserved for when a brain reads it |

---

## D4 — Dream: full simulation vs functional core

### What the source doc says
- REM cycles (5 cycles/night), dream composition (40% 7-day memories + 30% important
  memories + 20% old memories + 10% existential), coherence = 1 − adenosine/200,
  dream type by source (low oxytocin → longing dream, high cortisol → nightmare…),
  forgetting curve (intensity > 0.7 → becomes memory; 0.4–0.7 → affects morning mood),
  the player watches dreams (god view).

### What exists now
- Sleep: fatigue/adeno
