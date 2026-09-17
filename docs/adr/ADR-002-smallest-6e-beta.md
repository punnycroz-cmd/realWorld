# ADR-002: Smallest Phase 6E = The Beta Package

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (after the 4-persona council, round 3)

## Context
The 8 proposed items for 6E (A1/A2/A3/A5/D1/D2/D3/D4) exceeded Robin's quota. The council split into 2 camps: the Artisan (A3+D1+A2, cut A1) vs the Ecologist/Epistemologist (A1 is mandatory — without it, "the AI lives on Layer 3" collapses; A2 without A1 means sound falls into the void).

## Decision
**The Beta package:** A3 (world-event → signal table) + D1 (3 decay accumulators through the substrate interface, ADR-001) + A1/D2 (core feeling-scape, **12 qualities** trimmed from 40: hollow/parched/heavy/burning, anxious/terrified/enraged/content, lonely/revered/confused/vigilant) + A2 basic hearing (**drop smell**).
**Deferred:** D3 voice lines (no consumer = bug #13), D4 dream narrative, A5 code (kept on paper only).

## Consequences
- A closed three-legged tripod: A3 normalizes signals → A2 propagates sound physically → A1 merges them into a scape (dominant + secondary + tone).
- After 6E, the WHY HUD **purges float numbers**, displaying qualities as words (the Scholar's condition).
- The D2 vocabulary must also read `conditions[]` (wounds/illnesses), not just the 6 fields (the lesson of the council's scorched-throat counterexample).

## Enforcement
- **A1 eye-read probe:** a devtools script prints one villager's perception every tick for 24h, read by human eyes (not a unit test) — guards against Hearth-style attention-filter-swallows-signal bugs (#16). Robin writes it, the lead reads it.
- The 12-quality cap is a quota decision — adding more requires a new ADR.
