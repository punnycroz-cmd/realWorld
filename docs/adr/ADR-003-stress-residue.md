# ADR-003: stressResidue — Asymmetric Overnight Stress Residue (decision 3B)

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (after the 4-persona council, round 3)

## Context
The Scholar indicted D4's functional core as "sleep = a soulless reset button" (a mother buries her child yesterday, eats a potato today, and is content). The Artisan warned of a depression loop: the society has no healing mechanism, and trauma with no way out would collapse the village economy. The Ecologist proposed a middle path: no clinical illness, just one asymmetric residue variable.

## Decision
**3B with a hard ceiling:**
- `stressResidue`: accumulator 0..1, accrues only on days with extreme stress/suffering (threshold defined by 6E, with a discriminating test).
- **Ceiling:** `stressResidue ≤ 0.35 × maxStress`. Enough to "carry the marks", not enough to collapse. (A starting tuning parameter, not biological truth.)
- **Recovery:** consecutive peaceful days (no threat, no loss, mood > 0) → residue −8%/day. 2–3 peaceful days ≈ fully dissolved. This is the "healing path".
- Residue slightly reduces workFactor and raises vigilance — wired into the D1 accumulators.

## Consequences
- Sleep is no longer a reset button: history survives the night.
- No depression loop: ceiling + conditional recovery = negative feedback loop, true to the biology (cortisol doesn't accumulate without bound in healthy people).
- No dream narrative, no clinical PTSD — still deferred to Phase 7+.

## Enforcement
- **Assert the ceiling in the substrate** (the Examiner deliberately tests 5 consecutive bad days → residue must not exceed 0.35×max).
- Test: trauma day → residue > 0 the next morning; 3 peaceful days → ≈ 0.
