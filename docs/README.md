# Documentation index — Willowbrook Natura (world-sim)

## Recommended reading order

1. `../GAME_DESCRIPTION.md` — what the game is (player-facing, no technical discussion).
2. `../PROJECT_SUMMARY.md` — technical snapshot: architecture, completed systems, tests, git status.
3. `OVERVIEW.md` — navigation-level synthesis: detailed features by system, condensed bug history, team & process.
4. `PRINCIPLES.md` — the nine guiding principles; read before any implementation task.
5. `../WORK_LOG.md` — chronological work/audit record; the current status always lives at the end of this file.
6. `../SPEC_PHASE7.md` — the active implementation spec.
7. `../src/MANIFEST.md` — module inventory (bundle order, what each module does).
8. `adr/` — architecture decision records (binding decisions with rationale).

## Live documents and their canonical topics

**One canonical home per topic.** When two documents need the same fact, one owns it and the other points to it. This is the standing rule for all future documentation work.

| Document | Owns (canonical home for) |
|---|---|
| `../PROJECT_SUMMARY.md` | Technical project snapshot: architecture, completed systems (condensed), test status, git status, bridge API, needs model. |
| `../GAME_DESCRIPTION.md` | Player-facing game description. Intentionally no technical discussion. |
| `../WORK_LOG.md` | Append-only chronological record of work and audits. **Current project status always lives at the end of this file.** |
| `../SPEC_PHASE7.md` | Active implementation contract (Phase 7). Do not archive. |
| `OVERVIEW.md` | Navigation-level synthesis: detailed per-system feature reference (§2), condensed 35-bug history table (§4), team & process (§7). Historical snapshot (2026-09-16) — pointers lead to live docs. |
| `PRINCIPLES.md` | The nine guiding principles (extracted verbatim from Part 4 of the archived thinking-process). Mandatory constraints for every implementation task. |
| `../src/MANIFEST.md` | Module inventory: bundle order, per-module contents, dependency notes. Stays in `src/`. |
| `adr/ADR-001-substrate-interface.md` | Decision: single consolidated substrate implementation (no "smooth swap" promise). |
| `adr/ADR-002-smallest-6e-beta.md` | Decision: smallest viable Phase 6E scope (Beta package). |
| `adr/ADR-003-stress-residue.md` | Decision: stress-residue mechanism. |

Related but untouched by this reorganization: `docs/phase16_visual_quality_report.md` (pixel-art quality report; stays in place).

## The archive (`docs/archive/`)

Completed specs, superseded plans, and historical records move here. **Archive files are historical evidence, not current truth** — read them for context, never as instructions for current work. They are kept byte-identical (except path references updated by the reorganization itself); nothing in the archive is ever edited for content.

| Archived file | What it is |
|---|---|
| `SPEC_PHASE6.md` | Completed Phase 6 spec (6A→6D). |
| `SPEC_PHASE6E.md` | Completed Phase 6E spec. |
| `SPEC_BUILD_PLAN.md` | Original build plan (Phases 1–4 + Phase 2A–2F). |
| `RIMWORLD_GAPS_BACKLOG.md` | "Revisit later" backlog vs RimWorld. |
| `ADAPT_MASTER_DOC.md` | Adaptation triage (ADOPT / DISCUSS D1–D4 / DEFER / DROP) for the external master document. |
| `ADAPT_D1-D4_DETAIL.md` | Per-item comparison: external doc vs code vs decision. |
| `ADAPT_4PERSONA_DEBATE.md` | Minutes of the 4-persona council debate on D1–D4. |
| `thinking-process.md` | The full thinking record: bug history (Part 1), realism review (Part 2), council debates (Parts 3, 6, 7), principles (Part 4 — canonical copy now in `docs/PRINCIPLES.md`), EP assessment (Part 5), implementation diaries. |
| `phase16_resolution_study.md` | Sprite resolution study (64×64 adoption). |
| `checkpoints/.phase6d_progress.md` | Phase 6D implementation checkpoint (per-slice interface contracts). |
| `checkpoints/.phase6e_progress.md` | Phase 6E implementation checkpoint. |
| `checkpoints/.phase7_progress.md` | Phase 7A implementation checkpoint. |

## Known overlaps and stale claims (not silently "fixed")

These were left intact deliberately — the reorganization preserves factual claims and only replaces passages with pointers where fully subsumed:

- `../PROJECT_SUMMARY.md` still states 62 modules, a 263-line harness, HEAD `05caf95`, and "next step: Phase 6E" — a snapshot from its last rewrite, not the current state.
- `../SPEC_PHASE7.md` header says "awaiting EP approval" although Phase 7A was completed (commit `5e970be`); the header predates 7A.
- `OVERVIEW.md` §6 status snapshot (2026-09-16) was replaced with a pointer to `../WORK_LOG.md`; the snapshot's facts (Warren's sign-off SHA, Phase 6A status) remain in `WORK_LOG.md`.
- `WORK_LOG.md` historical entries keep their original path references (e.g. `SPEC_BUILD_PLAN.md` at the repo root) as written at the time — they are a record, not live links. Consult this README for current paths.

## Future rule

**One canonical home per topic.** Before writing a fact into a second document, check whether it already has a canonical home in the table above. If it does, write `See <file> §<section> for the canonical version.` instead of copying it. If the fact genuinely belongs to a new home, move it and leave a pointer behind. Never let two live documents own the same claim.
