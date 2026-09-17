# SPEC PHASE 7 — "Institutional Society"
_Date: 2026-09-17. Status: SPEC (awaiting EP approval). Prerequisite: Phase 6E closed (commit f3a41b7)._

## Source documents (read before implementing)

- `docs/PRINCIPLES.md` — 9 guiding principles (mandatory constraints, summarized below; extracted verbatim from Part 4 of `docs/archive/thinking-process.md`).
- `docs/archive/thinking-process.md` **Part 7** — Adaptation Master Doc + round-3 four-persona council (12 chemicals, cross-effects, closed feedback loops, bounded grief).
- `docs/archive/ADAPT_D1-D4_DETAIL.md` — D1: 12 chemicals + 17 cross-effect pairs (chemical names, sample causal chains).
- `docs/adr/ADR-001-substrate-interface.md` — rewrite consolidated into one implementation, NO "smooth swap" promise.
- `docs/archive/checkpoints/.phase6e_progress.md` — E1→E4 contract (FeelingSubstrate API, signal table, acoustic falloff, stressResidue).
- Phase 6D debt (WORK_LOG.md): 5 items outstanding (see 7E).

## Immutable constraints

**Inheriting Phase 6 (summary):** the no-perfecting rule is the supreme law — every feature must prove it creates a story the old system could not create (the Scholar condition); two biological thresholds (~80% trade-off / ~85–90% override, highest-need-wins preserved); stupid deaths must have inner logic; absolute material conservation; Belief ≠ truth (3–5 tuples, no pointer to hidden truth); bounded (no full Bayes, no democratic legislation, no haggling/inflation/credit — that's Phase 8); thin slices, no waterfall; plant cultural priors, don't demand 100% emergence.

**6E lessons become law:**
1. **Don't delete character-specific code before the premise is verified in code** (the Gareth incident: the doc said "doesn't exist" while the code spawned 11 villagers).
2. **Doc rosters must be verified from `src/data/03_roster.js`**, never hand-written.
3. **Write specs as measurable consequences**, not vague intent ("8%/day" is vague → the implementer made it linear; it must say "decreases 0.08/day, 3 days → ≈0").
4. **The more explicit the brief, the fewer correction rounds** (E3: 0 rounds; E2: 1 round because the word "production-path" was vague).
5. **The verifier can be wrong too** — running code is the final arbiter, even over the verifier's mistakes.

**Process:** this SPEC gets EP approval → per slice: Robin implements → Examiner Tier-3 audit → max 2 fix rounds → re-audit PASS → separate commit → next slice.

---

## 7A — Customary court & Guilds

### DO
- **Customary court:** when a proto-norm is violated (theft already wired in 6D; child-harm/neglect/fire-refusal after 7E), NO automatic punishment — open a hearing: plaintiff, defendant, witnesses (only people who actually witnessed through their senses — local belief, connects to 7E.2). The elder presides (oldest / highest reputation). Verdict: restitution, community service, or exile. Each testimony is a belief tuple with a source → can be wrong, biased, forgotten (fidelity trait).
- **Guilds:** 3 guilds by craft (smith, baker, farmer): membership list, apprenticeship (an apprentice working alongside a master gains skill faster than self-study — measurable), selling to caravans as a bloc fetches a better price than retail (connects to 6D scarcity pricing).

### NOT DOING
Written law; democratic voting; professional police; prison; guilds squeezing villagers with monopoly pricing.

### Acceptance criteria (Examiner Tier-3, production-path, with negative control)
- Wrongful theft case: a witness carrying a wrong belief (misremembered) → the court punishes the wrong person → the wronged victim develops a grievance → a revenge story emerges (the Scholar: the old system could not create it).
- 30-day apprenticeship raises skill more than self-study (measured numerically); non-guild members get no bonus.
- Guild bloc sale of 10 loaves to a caravan gets a higher per-unit price than retail (measured numerically).

---

## 7B — Inheritance & Funerals/Rituals

### DO
- **Inheritance:** on death → assets (inventory, house, tools) pass to spouse → children → nearest kin → village commons. Two people claiming the same → the 7A court adjudicates.
- **Funeral rite:** funeral 1–2 days after death; attendees gain cohesion↑ (oxytocin), close kin gain bounded grief (connects to 7C). Skipping the funeral of someone you hated → gossip/reputation consequences.
- **Harvest festival:** seasonal, costs real food (material conservation), morale↑ for the whole village.
- **Rain ritual during drought:** belief-only — NO real effect on the weather (honest: superstition is belief, not a mechanic); but performing it together raises cohesion because it's a collective activity.

### NOT DOING
Real-effect magic; organized religion (priest class); complex weddings (marriage already in 6E).

### Acceptance criteria
- Inheritance dispute (2 claims) → the 7A court adjudicates; the loser accepts or holds a grievance (with a trace).
- Widow attending the funeral: grief dissipates faster than a widow who didn't attend (measured numerically, bounded — see 7C).
- Rain ritual after 7 drought days → rainfall unchanged (negative control) but attendees' cohesion rises.

---

## 7C — Substrate 12 chemicals (post-interface rewrite)

### DO
- **Rewrite the implementation** behind the `FeelingSubstrate` interface (ADR-001): consolidate into ONE new implementation, retire the 3 old accumulators. NO "smooth swap" promise — the Master Craftsman already warned: the signal distribution will change; this is a controlled rewrite, not an invisible swap.
- **12 chemicals:** ghrelin, leptin (hunger/satiety), cortisol, adrenaline (stress/fear), dopamine, serotonin (reward/stability), oxytocin (social), substanceP, endorphin (pain/pain relief), adenosine, melatonin, histamine (sleep/wake). Each chemical: own production − decay, dt-scaled, deterministic, bounded (no ratchet — the Hearth misery −100 lesson).
- **17 cross-effect pairs** (adrenaline→cortisol+, oxytocin→cortisol−, ...) + **closed feedback loops** (the Ecologist's requirement): prolonged high cortisol suppresses serotonin; dopamine↑ reinforces the habit loop. No more "all one-way arrows".
- **Parameters tuned from observable behavior:** every constant must carry a "tuned from scenario X" comment — no inventing numbers and hoping (ADAPT_D1).
- **Bounded grief (answering the Scholar):** death of a loved one → prolonged serotonin↓/dopamine↓, hard cap of N days, natural decay, faster recovery when attending the funeral (7B) + social contact (oxytocin). No permanent loops, no depression system.
- Output still uses the **12 qualities** vocabulary; the future AI brain still only reads qualities (A4) — the AI interface is unchanged.

### NOT DOING
A 13th chemical; depression/PTSD system; organ simulation (D2 already decided vocabulary-only); dream narrative.

### Acceptance criteria
- 3 sample causal chains reproducible: hunger→stress→irritability; love→calm; fear→exhaustion (compare each step against the ADAPT_D1 table).
- Bounded grief: a widow has no dominant grief quality after 14 days (measured numerically); no chemical touches an extreme in a 30-day soak (anti-ratchet).
- **Parity:** all 6E probes (E1/E2/E3/eyeread) re-run green after the rewrite — the observable qualities don't break.
- Every constant has a tune-source comment; a constant with no source = FAIL.

---

## 7D — Needs-from-body refactor + Labour allocation + Soak test

### DO
- **Needs-from-body refactor** (debt from Phase 6): utility deficits derived from the body sim (7 physiological states) instead of parallel-running need numbers. Remove duplication; keep highest-need-wins at critical thresholds; all decision paths still go through `brainThink` (the 6C lesson).
- **Labour allocation** (a Hearth blind spot): each morning, a coordinator (elder/high reputation) suggests assignments ("2 people on water duty today") based on skill + need + season. Villagers have the **right to refuse** (autonomy — the Phase 6 spirit); repeated refusals → gossip/reputation, no mechanical punishment.
- **30-day game soak test**, automated, measuring: no mass death; resources within bounds (no explosions/depletion); no behavioral oscillation; labour coverage — each day someone carries water/chops wood (measured % of days covered).

### NOT DOING
Centrally planned economy; forced labour; globally optimal assignment (no optimizer — suggestions + volunteers only).

### Acceptance criteria
- Refactor done: full harness 0 FAIL; discriminating probe — hunger deficit truly reflects body.satiety (no more two disagreeing number sources).
- 30-day soak: 0 mass-death; grain/wood/water within preset bounds; water coverage ≥ 90% of days.
- Villager refusing an assignment: no mechanical resource loss, only appears in gossip (discriminating test).

---

## 7E — Pay down Phase 6D debt (5 items)

1. **child-harm/neglect/fire-refusal proto-norms:** currently dead APIs (0 production callers). Either wire a real caller in production, or **cut from the spec honestly** (record the reason in the file) — no hanging APIs allowed.
2. **Ostracism → local belief:** only people who heard the gossip/witnessed directly know and shun; strangers still treat them normally (discriminating test with negative control). End of the "villagers only know through honest senses" principle violation.
3. **fillRoleVacancy():** attach an autonomous caller in production (a role empty for N days → automatically finds a replacement).
4. **Caravan salt:** salt must be *produced* somewhere (salt mine/another region in trade lore) — not spawned from nothing (Principle 4); `doSellStep` stays as pure goods transfer.
5. **getWeeklyConsumption:** filter the `T27_` name.
- **Regression:** multi-source fire peak-hold dedup (NN1/E3) still correct — no triple-counting.

### Acceptance criteria
Each item gets a discriminating test run on the production path; anything cut must have an honest WORK_LOG entry ("cut because X", not "done").

---

## NOT DOING (all of Phase 7)

Credit/inflation/haggling (Phase 8); complex contact epidemiology (Phase 8); harsh climate (Phase 8); AI Brain (Phase 9); full Bayes; modeling everything — only model what creates stories (EP directive).
