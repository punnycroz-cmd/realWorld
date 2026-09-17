# WILLOWBROOK NATURA — Plan for implementing the 38-item spec
_Date: 2026-09-15. The project owner's full spec, audited against the current game._

## Audit result: what we have / what's missing

**Already have (don't rebuild):** body/needs 8 needs, survivalGuard, honest perception, 16+ verbs + intent planner, medieval medicine, downed/rescue, 8 skills + XP + assignWork, material-based building, layered/warm clothing, 3 meal tiers + poisoning + meat preservation, husbandry, shop + caravan, wolves/boars/bears + hunting, lightning/wildfire/firefighting, pregnancy/birth/children, burial, two-sided society (bond/rivalry/fights/making up), memory + dreams, event feed, Pawn Inspector, bridge API for the AI brain.

**Genuinely missing (must build new):**
| # | Spec item | Missing content |
|---|---|---|
| 1 | §14–15 | Data-driven recipe system: tree→wood→planks→furniture; ore→metal→tools; items have a "provenance" (who made it, from which tree, its history) |
| 2 | §8 | Utility AI replacing the current hardcoded routine (villager scores actions by needs/personality/distance/risk...) |
| 3 | §16 | Knowledge/discovery: knowledge not unlocked globally; apprenticeship (Bram teaches Marta), learning by observation, forgetting |
| 4 | §4 | Life stages infant/adolescent/elder; marriage; household as an entity; generations |
| 5 | §10 | Belief: beliefs can be wrong/outdated/uncertain (currently only honest perception) |
| 6 | §11 | Rich memory: type/participants/location/time/importance/emotional impact + fading over time |
| 7 | §22 | Building as entity: indoor temperature, hygiene, capacity, ownership, expansion/abandonment/demolition |
| 8 | §17 | Dynamic business: demand+skill+capital → new trades/shops sprouting during play |
| 9 | §32 | Save/load (localStorage) — none currently |
| 10 | §30–31 | Inspector shows "WHY" (why this action was chosen) + debug overlays (temperature, fertility, fire, vision...) |
| 11 | §24 | Everyday life: bathing, cleaning, visiting, playing, childcare |
| 12 | §2 | Missing buildings: barn, workshop, kitchen, inn (only houses/shop/well so far), river (only a pond so far) |

## Architecture (lead's decision)

The spec demands modular code, not single-file. But the game must remain **one HTML file openable from file://**.
→ Solution: source split into modules in `src/` (sim/, entities/, systems/, render/, ui/, data/, brain/), **a build script bundles everything into one single HTML**. Modular, and keeps the current way of playing.

## Phases

- **Phase 1 — Modularization:** ✅ DONE + Examiner acceptance (CONDITIONAL PASS → 2 defects fixed, 10/10 green test runs 70/70). 40 modules `src/`, thin bundler, `src/MANIFEST.md`. Node harness: `devtools/node_harness.js` (runs from project root, since /tmp can't reach Robin's jail).
- **Phase 2A — Recipe data-driven + provenance:** ✅ DONE + Examiner acceptance PASS (2026-09-16). 6 recipes + provenance API; 2 defects found after audit (provenance lost on ownership change; unreachable workstation silently ignored) fixed + re-audit PASS. Suite 80/80, 43 modules.
- **Phase 2B — Building entities + new locations:** ✅ DONE + Examiner acceptance PASS (2026-09-16). Building = full entity (indoorTemp, cleanliness, capacity, owner, expansion, abandonment, demolition); barn/workshop/kitchen/inn actually working; deterministic river (drink/fish/bridge). 1 defect after audit (ghost-target fallback demolished the wrong inn) fixed + re-audit PASS (probe 21/21). Suite 91/91, 45 modules.
- **Phase 2C — Utility AI:** ✅ DONE + Examiner acceptance PASS (2026-09-16). Utility AI scorer: candidate actions scored via 8 need deficits, personality weights, distance/proximity cost, risk modifiers, opportunity bonuses; deterministic tie-breaking (seeded RNG); failure observation -> interpretation -> knowledge -> re-evaluation chain; survivalGuard override & __aiBridge contract intact. 1 defect after audit (stale-thought re-trigger permanently stuck) fixed + re-audit PASS (probe 12/12, discrimination test proved 18.13 catches the old bug). Suite 112/112, 47 modules.
- **Phase 2D — Knowledge/Belief/Memory:** ✅ DONE (2026-09-16). Per-villager personal epistemic store (memories, active beliefs, ownership beliefs, claims & evidence). Radical separation of REALITY vs PERCEPTION vs MEMORY vs KNOWLEDGE vs BELIEF vs CLAIM vs EVIDENCE vs UNCERTAINTY. Observation -> belief per source trustworthiness; forgetting fades with sim time (sharp/average/forgetful); teaching (teach verb/intent) checks proximity and wakefulness; wrong/contradictory beliefs stored alongside world truth, new observations supersede old beliefs and keep a history trace; ownership beliefs + claims don't change world actualOwner (infrastructure prepared for 2F); Utility AI consults beliefs instead of omniscience (explores when it doesn't know where food is); +Examiner-found fixes (general conflict detection instead of 5 hardcoded keys; deep-clone evidence/content against history aliasing) + re-audit PASS. Suite 128/128, 49 modules.

### Phase 2 — new systems (small batches, each batch = Robin implements → Examiner audits → fix → only then the next)

- **2A — Recipe data-driven + provenance:** recipe table in `src/data/` (tree→wood→planks→furniture; ore→metal→tools; flax→cloth→clothing; wheat→flour→bread; meat→smoked...). Every crafted item has provenance: creator, materials, quality, condition, owner, creation time, usage history.
- **2B — Building entities + new locations:** house = full entity (temperature, cleanliness, capacity, owner, expansion, abandonment, demolition). Adds barn, workshop, kitchen, inn, river.
- **2C — Utility AI:** ✅ DONE + Examiner acceptance PASS (2026-09-16). Characters self-assess needs/opportunities and choose actions (utility scoring); `__aiBridge` kept intact for the future brain.
- **2D — Knowledge/Belief/Memory:** ✅ DONE + Examiner acceptance PASS (2026-09-16; 2 defects after audit: silent-merge outside 5 hardcoded keys + evidence aliasing — fixed + re-audit PASS). Personal knowledge (discover/teach/forget), beliefs can be wrong/outdated/uncertain, rich memory (who, where, importance, emotion, fading), ownership beliefs & claims.
- **2E — Social life:** ✅ DONE + Examiner acceptance PASS (2026-09-16; first FAIL with 5 defects + 2 bugs found during fixing: childcare "conjured" food, occupation bonus dead code, pregnancy outside marriage, Math.random in childbirth, marry silently failing, pre-existing NaN positions, player pawn not covered by survivalGuard — all fixed + re-audit PASS: independent probe 10/10, 72h×3 trace clean of NaN/thirst deaths/exhaustion deaths). Life stages (child/youth/adult/elder, real effects), marriage (mutual bond, adult, spouseId cleared on death), household, generations (deterministic births via createVillager), daily life (bathe/visit/play/childcare/clean/insult), bonds fade, real +25% occupation bonus, market stalls. Suite 155/155, 51 modules.
- **2F — Ownership, provenance & information layers:** ✅ DONE & Examiner acceptance PASS (2026-09-16). Stable object identity (Chair #104), separation of actualOwner / currentHolder / knownOwner / suspectedOwner + confidence + evidence + claims per character, transfer events (buy/sell/give/steal/borrow/lose/find/inherit/abandon) recorded into item history, material lineage (Chair→Plank→Tree), failure→observation→re-evaluation chain (no silently dropped actions). Disputes: 3+ claimants all get adjudicated, quantitative ruling per evidence scale, the village head doesn't adjudicate his own cases; __aiBridge viewer-scoped, no actualOwner leakage. Suite 183/183 (part21 27/27), 53 modules. Non-blocking find: getTransferLog still leaked the real owner in the steal result string — patched after acceptance (no re-audit needed).
- **Phase 3 — Tools:** save/load (localStorage), "why did it do that" inspector (why-action), debug overlays. ✅ IMPLEMENTED (2026-09-16, lead directly): `sim/22a_save.js` (save/load full state + RNGS.s, versioned, autosave/day, manual slot), `brain/22b_why.js` (decision trace from the real utility brain + `__aiBridge.explainAction`, WHY panel in pawn inspector), `render/22c_overlays.js` (5 debug overlays off by default), `tests/22_autotest.js` (14 assertions). Suite 198/198 (part22 14/14), 57 modules. ✅ DONE & Examiner acceptance PASS (2026-09-16, 4 audit rounds: 3 FAIL rounds on non-blocking defects → all fixed — standalone feed overlay, shape-corrupt atomicity field→element→object-map-value levels, by-name test cleanup, __proto__ smuggling 2 layers; round 4 PASS + 1 minor hardening). Final suite 206/206 (part22 21/21), 57 modules.
- **Phase 4 — Long-run:** run days/weeks/seasons/years, fix bugs, Warren release review.
- **Phase 2 — New simulation systems:** items 1–8, 11–12 in the missing table (recipe/provenance, utility AI, knowledge, life stages/household, belief, rich memory, building entity, dynamic business, everyday life, missing buildings/river).
- **Phase 3 — Tools & storage:** save/load, WHY inspector, debug overlays.
- **Phase 4 — Long testing:** run many simulated days/weeks/seasons, fix stuck agents, infinite loops, birth/death bugs, economy.
- **Phase 5 — Release:** final Examiner audit + Warren checklist.
- **Phase 6 — "Imperfect humans":** approved SPEC (2026-09-16) at `SPEC_PHASE6.md`. 4 sub-phases: 6A senses & expectations (3-gate attention, expectation engine, brain boundary) → 6B adaptation & ecology (dynamic candidates, carrying capacity, weather→fire) → 6C psychology & identity (survival guard, conflicting motivations, emotion, identity) → 6D economy & society (scarcity pricing, real caravan demand, reputation pipeline + 3 proto-norms). Integrated the approved steal list from 2 external Natura builds (GLM 5.3 / Qwen). Deferred: needs-from-body refactor (Phase 7+).

## Team assignments

- **Lead (Friend):** architecture, audit, decisions, final verify, reporting.
- **Robin (dev/agy):** implement each module per phase.
- **Examiner (QA):** adversarial audit each phase (Tier 3).
- **Sylvie:** only called when art changes (none yet).
- **Warren:** Phase 5 release checklist.

## Decisions needed from the project owner (asking)

**ART:** the spec demands "NO AI images, characters must be 100% procedural" — but the project owner's standing directive is "never replace AI raster art with procedural". The two demands directly conflict. Default: keep the current art unless the project owner changes their mind.
