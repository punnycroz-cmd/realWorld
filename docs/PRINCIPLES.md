# Guiding Principles for All Future Actions

> Extracted verbatim from Part 4 of `docs/archive/thinking-process.md` (written 2026-09-16).
> The archive keeps the full historical text; this file is the canonical live home of the nine principles.
> Read before doing any implementation task. Violation → stop, ask the user.
> Each principle is recorded with its "why" — the reasoning behind it, distilled from the bug history, the realism review, and the 4-persona council debate.

1. **Real life is not perfect → over-perfecting banned.** *Why:* direct decision of the user (2026-09-16). Every proposal must have a pre-written stopping point. Don't simulate anything just to be "more real" if it creates no gameplay/story. Consequence: every Phase 6 spec must have an explicit "DON'T DO" section like 3.4.

2. **Two thresholds, not one.** Psychological flaws (stubbornness, pride, superstition, panic, laziness, habit) only apply when needs are at moderate levels (30–70%). Hit the life-or-death threshold (>90%) → biological instinct overrides everything. *Why:* the Ecologist's correction of the Old Scholar — medieval famine history proves humans kneel to enemies and eat rotten roots at extreme hunger. The Old Scholar is right at moderate levels, the Ecologist at life-or-death; only together do they make a real human.

3. **Stupid deaths must have internal logic.** Allowed to die from false beliefs (quack healers, 10-year-old memories, rumors), from stubbornness, from panic. Dying to pure RNG is banned. *Why:* the Epistemologist's correction of the Old Scholar — players weep at tragedies with cognitive causes, but curse the game as broken and rage-quit over dice-roll deaths. "Stupidity must have the internal logic of stupidity."

4. **Absolute material conservation.** No food/items from thin air — not even through back doors like "in-place foraging that doesn't deduct the tile". Every survival fallback deducts real world resources. *Why:* the Ecologist's roasting of the Master Craftsman — 5 people foraging one corner of the yard means that corner turns to bare gravel, and the 6th person starves. Violating this principle is just bug #12 (childcare) reborn in another form.

5. **Villagers hold beliefs, not pointers to truth.** Maximum 3–5 fragments `[who/what, attribute, where, when]`. Decisions read only from beliefs + senses + memory. *Why:* the Epistemologist's roasting of the Master Craftsman — half-baked isolation (masking at log time while memory still points at `actualThief_ID`) causes "implicit leakage"; if the villager believes A stole (though B really did), its behavior must target A. But the budget belongs to the Master Craftsman: minimal tuples, no O(N²) matrices.

6. **The Master Craftsman's budget: cheap, deterministic, testable.** Ladder ≤ 3 levels. Single-hop rumors, enums. Trust is an int −10…+10. All RNG must be seeded. *Why:* each fallback level doubles test cases; a bloated belief system kills performance at 50+ villagers (the architecture goal already set). Lesson from Part 1: a green suite doesn't mean correct — fewer cases are easier to probe.

7. **Habit and laziness are nature, not bugs.** Humans aren't optimization machines: they still go to the familiar tavern though it was out of bread yesterday, rather eat mediocre stores than trek far. *Why:* the Master Craftsman reminded us — "fixing" this into perfect optimization just creates "optimization-machine" villagers, which the Old Scholar warned is equally unrealistic, only in the other direction.

8. **Distorted rumor is a feature, not a bug — but with limits.** Single-hop, gradually distorted — that's how a human village operates. *Why:* the Epistemologist — rumors create the "village soul" (taboos, factions, scapegoats). But explosion is banned: each villager keeps only a few fragments, no passing beyond 1 hop (the Ecologist's performance reason).

9. **Execution order: Release first, Phase 6 after.** Phase 5 (per spec) = push tag `v0.4.0-phase4` + reverify checksum. Don't mix release with new features. *Why:* the release is already accepted, only 1 token step remains; mixing new features would destroy the "clean tagged source" that Warren signed off conditionally.
