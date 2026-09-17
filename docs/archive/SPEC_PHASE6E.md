# SPEC PHASE 6E — "Feeling" (feeling substrate)

_Date: 2026-09-16. Status: SPEC (user approved "Ok do it" 2026-09-16, implementation started)._
_Final sub-phase of Phase 6 "Imperfect Humans". Design locked: **1B / Beta / 3B** (EP + Lead, after the round-3 four-persona council)._

## Source documents (read before implementing)

- `docs/adr/ADR-001-substrate-interface.md` — decision 1B (interface + lint rule).
- `docs/adr/ADR-002-smallest-6e-beta.md` — decision Beta (package scope).
- `docs/adr/ADR-003-stress-residue.md` — decision 3B (stressResidue + ceiling + recovery).
- `docs/thinking-process.md` **Part 7** — Adaptation Master Document + round-3 council minutes (full context: 12 chemicals, 9 organs, feeling-scape, voice, why dream was cut/deferred).
- `docs/ADAPT_D1-D4_DETAIL.md` — line-by-line adaptation vs current code (file:line).
- `SPEC_PHASE6.md` — immutable constraints of all of Phase 6 (still fully in force).

## Immutable constraints (Phase 6 + 3 ADRs)

1. **Every feature must create a story the old system could not create** (the Ông đồ condition) — otherwise, cut.
2. **The substrate is the single mandatory path.** All cognition code reads feelings through `substrate.feel(v)` / `substrate.getLayers(v)` / `substrate.getFeelingScape(v)`. **Lint rule (CI fail): no `v.body.` in `src/brain/**`.** Violation = decoration (the Epistemologist).
3. **ADR-001 states clearly: NO "smooth swap" promise.** The interface exists to consolidate the Phase 7 rewrite into one implementation, not because "3 linear accumulators swap smoothly into 12 nonlinear chemicals" — that is a polite lie; the signal distribution WILL still be upended when swapped. Write honestly, no oversell.
4. **Absolute determinism:** accumulators accumulate + decay both dt-scaled (`acc += rate*dtH; acc *= decay^dtH`), no `Math.random()` in new gameplay, no abrupt on/off conditionals for cross-effects.
5. **No new chemicals for mental illness** (respecting the 6C NOT-DOING): no PTSD, no depression, no dream narrative.
6. **WHY HUD purges float numbers after 6E** — qualities displayed as words (the Ông đồ condition).
7. Process: Robin implements → Examiner Tier-3 audit → max 2 fix rounds → re-audit PASS → commit. Only touch modular `src/`, rebuild bundle.

---

## E1 — Substrate interface + A3 + D1 (do first: the foundation)

### DO

**S1. `FeelingSubstrate` interface** (new module, e.g. `src/brain/14_substrate.js`):
- Contract: `feel(v)` → current scape; `getLayers(v)` → contributing layers; `getFeelingScape(v)` → `{dominant, secondary, tone}` (used in E2).
- Current implementation: delegates to C3 (body state) + D1 couplings. **No new state beyond D1's accumulators.**
- The WHY HUD and all decision code in `src/brain/**` read through the interface (gradually cleaning up places that poke `v.body` — the lint rule bites from this slice on).

**S2. Lint rule banning `v.body.` in `src/brain/**`** — implement as a check running in the harness/CI (build fails on violation). The Examiner verifies with a **deliberate bypass-test**: sneak one `v.body.` line into brain code in the test environment; the check must report fail.

**A3. World-event → signal table** (continuing the D1 coupling table):
- Every world event (fire, wolves, storm, death, birth, gossip, price shock, lost items...) passes through ONE table that normalizes them into signals `{kind, intensity, source, tick}` before they enter the substrate.
- Record it as a table in code/docs so the Examiner can audit each causal arrow.

**D1. 3 decay accumulators via the substrate** (exactly the 3 approved couplings, each its own accumulator on the villager, with its own discriminating test):
1. `hunger↑ → stress↑`: prolonged hunger accumulates stress gradually; it dissipates after eating.
2. `fear↑↑ → exhaustion`: after a fear event, fatigue rises quickly over the next few hours.
3. `pain↑ → patience↓`: wires into the social utility modifier (C2).
- Each coupling is an explicit conditional (C2 discipline: no fuzzy weights).

### Acceptance criteria (Examiner Tier-3)
- Bypass-test: sneaked `v.body.` in `src/brain/**` → lint fails.
- Discriminating test per coupling: villager hungry 6h without eating → stress accumulator > 0 and rising over time; eating to full → decays to ~0. Fear event → fatigue rate rises over the next 3h, then stops. Villager in pain (high pain) → patience in social utility measurably reduced.
- Same seed + same dtH → same accumulator values (determinism, including across tick sizes).

---

## E2 — A1/D2 feeling-scape, 12 qualities

### DO

**A1/D2. Core feeling-scape — exactly 12 qualities** (the cap is a quota decision; adding more requires a new ADR):
`hollow, parched, heavy, burning, anxious, terrified, enraged, content, lonely, revered, confused, vigilant`
- Each tick: A3 signals + D1 accumulators + body state → merged into a scape `{dominant, secondary, tone}`.
- **D2 vocabulary-only:** 0 new organ state machines, no 9 organs. The vocabulary **must read `conditions[]`** (wounds/illnesses), not just the 6 fields — the lesson from the council's burnt-throat counterexample (drinking water still leaves "parched" if the throat is burnt).
- **A1 eye-read probe:** a devtools script printing one villager's perception + scape per tick over 24h of sim; **the lead reads it with human eyes** (not a unit test) — guarding against the attention-filter-swallowing-signals bug à la Hearth #16. Robin writes the script, the lead reads.

**WHY HUD:** purge float numbers — display qualities as words (e.g. "anxious · heavy", not "stress 0.62").

### Acceptance criteria
- Eye-read probe 24h: the lead reads and confirms no tick has an absurdly "frozen" scape (e.g. the house burning while still `content`).
- Burnt-throat villager drinks water → still `parched` (vocabulary reads `conditions[]`, discriminating test).
- WHY HUD shows no float numbers for feelings (grep).

---

## E3 — A2 hearing + 3B stressResidue

### DO

**A2. Basic hearing (drop smell):**
- Sound propagates by physical distance (screams, loud noises): a sound event carries `amplitude`, audible within the corresponding radius.
- D3 voice intensity → acoustic amplitude was recognized as a good idea but remains **deferred** (quota) — A2 does only propagation + perception, no voice lines.
- Verification example: a scream at 40m jolts the guard awake (council-approved scenario).

**3B. `stressResidue`** (per ADR-003):
- Accumulator 0..1, **accumulates only on days with extreme stress/suffering** (threshold defined by 6E, with a discriminating test).
- **Hard ceiling:** `stressResidue ≤ 0.35 × maxStress` — assert in the substrate.
- **Recovery:** consecutive peaceful days (no threat, no loss, mood > 0) → residue −8%/day. 2–3 peaceful days ≈ fully dissipated.
- Residue slightly lowers workFactor + raises vigilance — wires into D1 accumulators.
- Sleep is no longer a reset button; no depression loop (ceiling + conditional recovery = negative feedback loop).

### Acceptance criteria
- Test: trauma day → next morning residue > 0; 3 consecutive peaceful days → residue ≈ 0.
- Examiner stacks 5 bad days in a row → residue never exceeds `0.35 × maxStress` (assert fires if exceeded).
- Scream at 40m → guard within radius hears and reacts (wake/interrupt); outside radius → nothing.

---

## E4 — Test pass + integration

### DO
- **Part 28** in `src/tests/28_autotest.js` (register in `src/_order.txt`, note in `src/MANIFEST.md`): discriminating tests for E1 couplings, E2 vocabulary-conditions, E3 residue lifecycle + hearing radius, the lint rule, determinism across tick sizes.
- Full harness 0 FAIL. Bundle rebuild.
- Clean up temp entities (no testing in the canonical settlement).

### Acceptance criteria
- Harness: 0 FAIL, Part 28 fully passes.
- Examiner Tier-3 audit PASS for all of E1→E3 (one final audit or per slice — lead decides at runtime).

---

## NOT DOING (decided, not reopened during 6E)

- Smell/olfaction, taste.
- D3 voice lines / voice intensity (no consumer = bug #13).
- Full D4 dream narrative.
- Full 12 chemicals + 17 cross-effect pairs (Phase 7).
- 9-organ state machine.
- PTSD / mental illness / depression loop.
- A5 code (stays on paper only).
- Expectations for anything beyond the 3 approved 6A groups.

---

## Combined enforcement

| # | Rule | Who verifies |
|---|---|---|
| 1 | Lint banning `v.body.` in `src/brain/**` (CI fail) | Robin implements, Examiner bypass-test |
| 2 | A1 eye-read probe 24h, lead reads by eye | Robin writes the script, lead reads |
| 3 | Assert `stressResidue ≤ 0.35 × maxStress` in the substrate | Examiner tests 5 bad days |
| 4 | WHY HUD shows no floats for feelings | grep + Examiner |
| 5 | Determinism: same seed + dtH → same results, all tick sizes | discriminating test |
| 6 | No `Math.random()` in new gameplay | Examiner grep |

## Implementation order (Robin, slices ≤20 minutes, checkpoint file `.phase6e_progress.md`)

1. **E1**: substrate interface + lint rule + A3 table + D1 3 accumulators.
2. **E2**: 12-quality scape + vocabulary conditions[] + word-only WHY HUD + eye-read probe script.
3. **E3**: hearing propagation + stressResidue + ceiling assert + recovery.
4. **E4**: Part 28 tests + full harness + rebuild + final Examiner audit.

Each slice: self-verify with a real production-path probe, write a checkpoint (files/lines changed + contract for the next slice + loose ends), end with `PROGRESS SAVED, CONTINUATION NEEDED` if cut off.
