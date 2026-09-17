# ADR-001: FeelingSubstrate Interface (decision 1B)

- **Status:** Accepted (2026-09-16)
- **Deciders:** EP + Lead (after the 4-persona council, round 3)

## Context
D1 debated Option 1 (keep C3 + decay accumulators) vs the full 12 chemicals. The EP proposed defining a `FeelingSubstrate` interface now; the council countered:
- **The Artisan:** an interface promising a "smooth swap to 12 chemicals" is polite fiction — 3 linear accumulators vs 12 nonlinear chemicals, the signal distribution would be upended, the AI brain would go mad.
- **The Ecologist:** Option 1 is all one-way arrows, missing closed-loop feedback.
- **The Epistemologist (countering):** the interface is honest *iff* it is the single mandatory path through.

## Decision
Chose **1B on revised grounds**: keep the interface NOT because of a "smooth swap" (oversell), but because it is **the mechanism that enforces A4 discipline starting today** — all perception code reads feelings via `substrate.feel(v)` / `substrate.getLayers(v)`; direct pokes into `v.body` are forbidden.

## Consequences
- Phase 7 rewrites **one** implementation, not 100 scattered call sites. The signal distribution WILL still be upended at swap time — recorded honestly, no promises made.
- The WHY HUD and all decision code read through the interface.
- No new state beyond D1's accumulators.

## Enforcement
1. **Lint rule (CI fail):** `v.body.` is forbidden in `src/brain/**`. Implemented in 6E (Robin); the Examiner verifies with a deliberate bypass test.
2. This ADR is the evidence of "no smooth-swap promise" — point anyone who asks later to this document.
