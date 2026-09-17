# ADAPTATION — Master Document → Willowbrook as of Today

**Date:** 2026-09-16
**Status:** The lead's (Friend) proposal. DISCUSS items await executive producer sign-off.
**Directive:** Filter game logic only. Drop the entire roadmap/product scope (possession, influence, god view,
time control, replay, save/load infra) — that's a separate matter for EP and the lead, not this doc's business.
**Filtering principles:**
- Don't break the Phase 6 in flight (6A/6B PASS, 6C in fix round 2/2, 6D not started).
- Every adoption goes through Examiner Tier-3 as usual.
- Every biological number in the source doc (ghrelin decay 3.0/h, oxytocin 1.8/h, coherence = 1−adenosine/200…)
  is a **tunable parameter**, not design truth. State this explicitly everywhere it's used.

---

## 1. ADOPT — adopt immediately (after 6D completes, as Phase 6E or early Phase 7)

### A1. Feeling-scape composition pipeline (Tier 3)
- **Take:** the collect → merge → dominant (urgency weights) → secondary (top 3) → tone pipeline,
  + the 40-quality vocabulary (physical 16 / emotional 12 / cognitive 8 / social 4).
- **Why:** this is the *interface contract* for the future AI brain ("the AI lives only on layer 3").
  Right now it lets the WHY HUD display feeling language instead of numbers —
  matching Principle 2 of the doc (the player infers from behavior/feelings, not from reading numbers).
- **Position:** runs after 6C's C3 (emotion derivation); reads from body + emotions + senses + memory.
- **Mandatory tests:** determinism (same seed → same scape), urgency weights that discriminate.

### A2. Hearing + smell with range and modifiers (Tier 2.5)
- **Take:** the base range table (speech 15, shout 40, cry 25, wolf-howl 50, thunder 100;
  cooked-food 15, smoke 25, burning 40, blood 5…) + modifiers
  (rain ×0.7, storm ×0.5, night ×1.5, tailwind/headwind, tired ×0.7)
  + quality by distance (words → tone → presence).
- **Why:** 6A built attention/salience but has no distance–weather propagation of sound/smell.
  Deterministic, testable, true to "modeling real life".
- **Don't take:** treating specific range values as sacred constants — they're tuning parameters.

### A3. Normalized world-event → biology signal table (Tier 0)
- **Take:** the event→signal table (eating→ghrelin↓, danger→adrenaline↑↑, loss→serotonin↓↓…)
  as a single canonical table replacing the current scattered ad hoc body updates.
- **Why:** the Examiner can audit it; it stops every system from inventing its own couplings.

### A4. Layering discipline + a "good enough for the AI brain" stopping point
- Each layer knows only the layer below it. The AI never sees numbers.
- A natural stopping point: don't model deeper than the AI brain can use
  (anti-over-modeling — matching the directive "don't try to model everything").
- Applies to all new code starting now, no waiting for a new phase.

### A5. AIContext / AIResponse — keep as the target contract (design, not implemented)
- The AI receives: feelingScape + self (no needs/chemicals) + memories + relationships + knowledge + context.
- The AI returns: actionId/target/payload + reason (in-character perspective) + voice (inner monologue).
- New code gradually orients toward this contract (bring feelingScape into context).

---

## 2. DISCUSS — needs EP sign-off

### D1. Chemical substrate: 12 chemicals vs minimal vs keep C3
- Source doc: 12 chemicals + 17 cross-effect pairs.
- Current state: 6C just built C3 (body → emotion directly, already PASSED audit).
- **Option 1 (lead recommends):** keep C3; take only the *idea* of cross-effects (hunger→stress,
  fear→exhaustion) as a few simple couplings in C3. Full 12 chemicals reserved for Phase 7.
- **Option 2:** implement a minimal substrate of 6 signals (hunger, stress, fear, pain, fatigue, comfort)
  for C3 to read — a middle path, still testable.
- **Option 3:** full 12 — the lead does NOT recommend (fabricated decay numbers, large test burden,
  Robin's limited quota, bug-#13-style dead-code risk).

### D2. Organ qualities: take the vocabulary, don't simulate organs
- Take the vocabulary (hollow, racing, clammy, parched…) **inferred from existing body fields** —
  cheap, useful for voice/memory text.
- Don't simulate 9 separate organs: they duplicate body fields, more state = more places to break.

### D3. Voice lines by intensity (subtle → overwhelming)
- Intensity-based fragmenting (full sentence → short sentence → fragments → a single word)
  models human cognition under stress correctly — take it.
- Used for: memory text + WHY HUD (dev). Do **not** yet take the personality × life-stage matrix
  (reserve it for when a real brain exists to read it).

### D4. Dream — take only the functional core
- Take: sleep = memory consolidation + morning mood effect
  (high stress → nightmare → anxious the next morning).
- Don't take: detailed dream content, the fabricated coherence formula,
  "player watches dreams" (product).

---

## 3. DEFER — reserved (acknowledged, not now)

- **Full 12-chemical + cross-effects:** substrate for Phase 7.
- **Mental illness patterns:** respect 6C's NOT DOING (no clinical mental illness).
  When done, do it the doc's way: *a prolonged pattern of the same 12 chemicals, no new chemicals*;
  "incomplete recovery" PTSD is a strong narrative mechanic — reserved.
- **Dream narrative content**, **voice personality matrix**.
- **Possession / influence / replay / god-view / time-control:** product — per the directive,
  keep it separate for EP and the lead; not part of the game-logic upgrade.

## 4. DROP — dropped

- Biological numbers presented as truth (decay 3.0/h, 17 cross-effect pairs…): they're just parameters.
- The 5-phase × 2-month roadmap: doesn't match team capacity (Robin + Examiner + lead).
- Replay storage math (3.6GB/year), TypeScript file structure — the source doc was written for a different stack;
  this project is a vanilla JS bundle.
- "No visible rules" applies to the **player** — but the current numeric HUD is a dev tool,
  keep it for devs; only change what the player sees (when there's player-facing UI).

---

## 5. Proposed order

1. Finish 6C (fix round 2/2) + 6D first — no squeezing in new scope.
2. A4 (layering/stopping discipline) applies starting now.
3. After 6D: A1 + A2 + A3 + A5 as **Phase 6E "Feeling"** (or early Phase 7) — still through Examiner Tier-3.
4. D1–D4 get decided before implementing any item in §2.

## 6. Conflicts resolved

- 6C's NOT DOING "clinical mental illness" → mental illness goes to DEFER, doesn't break the earlier decision.
- Source doc "the AI doesn't see numbers" vs the current numeric HUD → the HUD is a dev tool, keep it;
  the principle applies to the AI interface and later player-facing displays.
