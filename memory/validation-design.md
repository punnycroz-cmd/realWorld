# Validation Design — how we know the memory model produces humans, not databases

**Version focus:** validation-design (v11). **Status:** specification for
game-systems' test harness; no code here — every section is a contract.
**Scope of claim:** the model in `memory-model-spec.md` v1.0 makes ~95
falsifiable probes (P1–P95, scattered across ten focus docs). This document
consolidates them into one registry, wraps them in a statistical protocol,
adds the experiment-analog battery that tests *effects* rather than
*parameters*, defines population-level diversity checks, and sets the
acceptance gates that gate merge into the substrate.

Two questions this design answers:
1. **Mechanism validity** — does the implementation behave like the math
   says (unit-level, closed-form)?
2. **Phenomenon validity** — does it behave like *people* say people behave
   (effect-level, against human data)?

A third, weaker bar — **believability** — is an observational rubric, not a
pass/fail metric (§7). Conflating these three is the main way validation
suites lie to themselves.

---

## 1. Validation levels

| level | name | what it tests | failure means |
|---|---|---|---|
| **L0** | closed-form unit | each operator equals its spec formula | implementation bug |
| **L1** | probe battery | P1–P95 point predictions on instrumented runs | miscalibration or missing mechanism |
| **L2** | experiment analogs | whole-paradigm replications (DRM, misinfo, Bahrick…) run *through the public §10 contract only* | the model cannot produce the human effect even when tuned |
| **L3** | population field | distributional stats over a simulated season across a diverse cohort | the model is right in the lab but wrong as a life |
| **L4** | believability audit | human-readable transcript review | model is correct but uncanny/legible-as-machine |

L0–L2 are **pre-registered pass/fail**. L3 targets are ranges, not points.
L4 is a rubric with inter-rater agreement requirements — never a gate.

---

## 2. Harness architecture (VA-H)

### 2.1 Determinism requirement

Everything below presumes the seeded RNG `rand(seed, charId, worldDay,
opSeq)` (formal-model.md §7) and snapshot/load determinism (P69). If runs
aren't bit-identical under the same seed, *no other level can be trusted* —
a flaky probe can't be distinguished from noise. L0 therefore ships first.

### 2.2 Cohort construction

Probes never run on "a character." They run on **cohorts**:

```json
Cohort = {
  "n": 60,                       // simulated individuals
  "archetype": "midlife_adult",  // or "mixed" for population probes
  "modifiers": [],               // e.g. ["poor_sleep"] for moderator arms
  "traitPins": {},               // e.g. {"wmc": -1.5} for trait arms
  "seedBase": 90000
}
```

- `deriveParams` (profile-generation.md §1) generates each cohort member's
  params deterministically from `(archetype, modifiers, pins, seedBase+i)`.
- Between-subject designs compare cohorts; within-subject designs compare
  conditions inside each member (preferred — kills trait variance).
- **n sizing:** §3.3. Default n=60 per arm for proportion targets,
  n=100 for distribution-shape probes (P8, P79).

### 2.3 Event generators

Experiments need controlled inputs, not world telemetry:

| generator | produces | used by |
|---|---|---|
| `genNoise` | low-attention meaningless verbatim (glimpsed street number) | P1, E-Ebbinghaus |
| `genEvent` | parametric event {arousal, valence, selfRelevance, novelty, attention, cues} | most probes |
| `genDiary` | a day of realistic density: ~40–60 candidate events, mostly ambient | L3, P96 |
| `genWitness` | witnessed scene with known ground truth + controllable detail fields | E-Loftus, E-lineup |
| `genChain` | serial-reproduction chain of tellers | E-Kashima, P60s |
| `genPerson` | repeated encounters with one stranger | cascade probes, E-OAB |

Event generators are part of the contract because **probe outcomes are only
interpretable if input density is fixed.** Human diary studies put ordinary
days at ~thousands of perceptual events with a handful remembered; our
`genDiary` default (50 candidates, attention distribution skewed low) is a
deliberate miniature, flagged as a modeling choice (HYPOTHESIS).

### 2.4 Measurement interface

Probes may only observe through:

- `§10` public calls (encodeEvent, recall, hearAccount, discussEvent,
  retell, imagineEvent, dailyMemoryTick, ambientMemoryScan, dateEstimate,
  orderBefore, learnOutcome, conditionedAffect, rememberIntention,
  groupRecall, deriveParams, selfReport, closeLoop, openLoopUrge).
- **Hidden-flag read access** for validation only: `accuracy`, `phantom`,
  `retracted`, `possessed`, `sleepdep_flag`, `storageS`, `retrievalCount`.
  These are the "ground truth tap" — they exist so probes can score
  correctness; dialogue and world code must never see them.
- Snapshot/load between phases (multi-day studies are sequence:
  encode → ticks → recall → analyze).

Anything a probe needs that isn't on this list is a spec bug — add the hook,
never read internals directly (keeps probes implementation-agnostic).

### 2.5 Output schema

Every probe run emits one JSONL line per observation:

```json
{"probe":"P3","cohort":"midlife_adult","member":17,"seed":90017,
 "day":412,"arm":"witness_once","measure":"lineup_correct","value":0,
 "extra":{"foil_rank":3,"conf_out":0.81}}
```

Probe analyzers aggregate JSONL offline. This is the merge contract with
game-systems: they run the harness, we own the interpretation rules (§3, §6).

---

## 3. Statistical protocol

### 3.1 Why a protocol at all

P1–P95 were written per-version with heterogeneous criteria ("markedly",
"should sit near"). Left that way, a 95-probe battery at α=.05 expects
~5 false alarms *by construction*, and vague thresholds invite silent
researcher degrees of freedom (Simmons, Nelson & Simonsohn 2011 — the
false-positive inflation paper). So: all thresholds below are
**pre-registered**, multiplicity is controlled, and "near" is always an
interval, never a vibe.

### 3.2 Test forms

Each probe is expressed in one of three canonical forms:

- **T-point:** one proportion/mean vs fixed human target, e.g.
  `p_adopt ∈ [0.20, 0.40]`. Binomial/t CI must sit inside the band.
  *Band > point* because human targets are themselves noisy estimates —
  we apply a **replication discount**: where the anchor is a single famous
  study rather than a meta-analysis, the target band is centered on
  ~0.5× the published effect (Open Science Collaboration 2015: replication
  effects averaged r=.197 vs .403 original; only 36% reached p<.05 —
  famous effects are systematically overstated).
- **T-diff:** an ordering/contrast, e.g. `R(slept) − R(awake) ≥ 0.10`.
  Reported as an effect size with CI; minimum-meaningful bounds come from
  Funder & Ozer (2019) bands: r≈.05 very small, .1 small, .2 medium,
  .3 large. We require *direction + magnitude in-band*, not p<.05 alone.
- **T-equiv:** "must NOT differ" claims — the model's explicit nulls
  (§5.3: no g_mem→misinfo path; vivid↔accuracy independence) and
  degraded-mode equivalence (P97). Uses TOST (Lakens, Scheel & Isager
  2018): declare a smallest effect size of interest (SESOI, default
  r=.1 or 5pp, whichever the probe states) and require the 90% CI inside
  [−SESOI, +SESOI]. *Absence-of-effect is a result you prove, not a
  failure to find one.*

### 3.3 Multiplicity and power

- All P-numbers run every validation release; **Benjamini–Hochberg FDR at
  q=.05** across the active battery for any p-form tests (Benjamini &
  Hochberg 1995). Band-form probes (T-point) don't need it — a band miss is
  a miss regardless of siblings.
- Monte Carlo sizing: for a proportion target with band half-width h,
  `n ≥ z²·p(1−p)/h²` at 90% confidence; for h=.05, p=.5 → n≈270
  observations, i.e. n=60 members × 5 items. This is why cohort arms
  reuse members across repeated trials where independence of items is
  defensible (different events, same person — within-subject replication).
- Determinism means a "failed" probe can be bisected by seed — every
  failure must ship its seed list so a second implementation can
  reproduce it exactly.

### 3.4 Regression goldens

Beyond probes: **golden trajectories**. For ~20 canonical scenarios
(one per L0 operator family + the worked derivations in
profile-generation.md §7), store the expected value vector. Any change to
spec or implementation that shifts a golden by more than Monte-Carlo error
is a *behavioral change* — allowed, but must be declared in the version
log. This is how we catch "improvements" that silently kill a calibrated
effect (the most common way simulation models degrade).

### 3.5 What we do NOT validate

- Exact human percentages (lab measures ≠ our latent `strength`; see
  forgetting-curves.md §6). We validate shape, ordering, and magnitude band.
- Single-probe statistical significance theater — a bare p<.05 with a
  trivial effect does not pass a T-diff probe.
- Beauty. L4 handles believability; L1–L2 handle truth.

---

## 4. Probe registry P1–P95 (consolidated index)

Each block keeps its home doc as the normative definition; this registry
assigns **tier** (MUST / SHOULD / OBSERVE) and canonical test form.
Tier rules in §8.

| block | home doc | phenomena | tier | form |
|---|---|---|---|---|
| P1–P8 | forgetting-curves.md §5 | decay shape, sleep, eyewitness bound, Jost, flashbulb, cue asymmetry, permastore | MUST | T-point/T-diff per probe |
| P9–P16 | retrieval-cues.md | cue gating, fan, reinstatement, Proust, mood-state vs congruence, involuntary, part-list | MUST (P9–P13, P16); SHOULD (P14 mood-state — small real effect) | T-diff |
| P17–P22 | age-development.md | amnesia ramp, bump window, associative deficit, suggestion split, PM paradox | MUST (P17,19,22); SHOULD (P18,20,21) | T-point + age-curve conformance |
| P23–P30 | age-decline.md | env-support asymmetry, search breadth, lures, overgeneral AM, TOT, SWS consolidation, reserve shift, terminal ramp | MUST (P23–P27); OBSERVE (P28 terminal — needs deathDay scenarios); SHOULD (P29–P30) | T-diff + T-equiv |
| P31–P38 | emotional-memory.md | selective consolidation, blink, valence-fidelity, glucocorticoid, flashbulb floor, conditioned affect, trauma phenotype, mood bleed | MUST (P31–P35); SHOULD (P36–P38) | T-diff |
| P39–P47 | false-memory.md | misinfo moderators, CIE, sleepdep flag, sleep gist, phantom minting, imagination inflation, source inference, believe/recollect split, conformity | MUST (P39–P44); SHOULD (P45–P47) | T-point bands |
| P48–P56 | individual-differences.md | correlated trait layer, WMC→misinfo, C→PM, synchrony, sex tilts, explicit nulls | MUST for nulls (T-equiv); SHOULD for directional loadings | T-equiv + T-diff |
| P57–P67 | social-memory.md | cascade, OAB, STI, diagnosticity, Kashima crossover, cheater persistence, audience tuning, SS-RIF, collab inhibition, mnemic neglect, in-category confusion, transactive | MUST (P57–P61, P65); SHOULD (rest) | T-diff + T-point |
| P68–P75 | formal-model.md §8 | machinery: determinism, caps, ambient mode, possession, RNG, ordering | MUST — all | exact assertions |
| P76–P85 | formal-model.md §15 | S/R split, spacing, savings, telescoping, rounding, landmark, hindsight, contiguity, hard-easy, ease-of-retrieval | MUST (P76–P82); SHOULD (P83–P85) | T-diff + T-point |
| P86–P95 | profile-generation.md | compiler determinism, coherence invariants, metamemory decorrelation, expertise bill, open loops, regime overlays, frozen audit | MUST (P86–P91, P95); OBSERVE (P92 Zeigarnik recall advantage — DEBATED per 2025 meta); SHOULD (P93–P94) | exact + T-diff |
| P96–P105 | validation-design.md §9 | density, ambient equivalence, distinctness, trait structure, curves, caps, rehearsal inequality, metamemory, goldens, non-interference | MUST (P97, P99 nulls, P100, P105); SHOULD (P96, P98, P101–P104) | T-point + T-equiv |
| P106–P116 | encoding-mechanics.md §12 | generation, enactment-in-aging, doorway, boundary structure, elaboration + maintenance null, intention null, DA asymmetry, production, unitization, survival fold, lapse structure | MUST (P106, P107, P109–P112); SHOULD (P108 doorway — magnitude DEBATED, P113, P114, P116); OBSERVE (P115 survival fold) | T-diff + T-equiv |
| P117–P126 | forgetting-curves.md §10 | spacing, testing split, failed-retrieval potentiation, reminiscence, quote decay, release-from-PI, childhood ramp, suppression leak, intention persistence, retell-ecology flatness | MUST (P117, P118, P121, P122, P123, P126); SHOULD (P119, P120, P124, P125) | T-diff + T-point |
| P127–P135 | retrieval-cues.md §18 | TAP gate, output interference, focal/nonfocal PM, PM age gradient, ABA renewal, TOT resolution + recurrence, reminding chains, sleep cuing | MUST (P127–P130); SHOULD (P131–P134); SHOULD-direction/OBSERVE-magnitude (P135) | T-diff + T-point + T-equiv (P130 focal leg) |

**Registry rules:** probe numbering is frozen forever (deprecate by
marking OBSERVE-dead, never renumber). New probes append. Every MUST
probe names the parameter(s) it constrains in its home doc — a MUST probe
with no parameter constraint is a design smell (it validates behavior but
can't guide repair).

---

## 5. Experiment-analog battery (L2)

Probes test predictions; these test *paradigms*. Each is a scripted study
against the §10 contract — a miniature of the human experiment. If the
model can't reproduce the human result here, tuning can't save it.

### E1 — RW-Ebbinghaus (forgetting-curves.md §5, P1)
`genNoise` items × 8/member, no retrieval; measure `strength` at
{1, 7, 30, 90}d. **Target:** fits power-law better than exponential
(AIC); residual ≤0.25 at 31d (Murre & Dros 2015 replication anchor).

### E2 — RW-Jenkins-Dallenbach (sleep)
Two-arm within-subject: identical records, arm A crosses sleep tick at
0.5d, arm B doesn't. **Target:** ≥15% retention advantage at day 2 AND
advantage *grows* with delay (consolidation, not just less interference —
Jenkins & Dallenbach 1924; modern: Ellenbogen et al. 2006).

### E3 — RW-Bahrick (permastore)
Semantic records (e.g., "names of neighbors"), no re-activation, follow
to day 200+. **Target:** bimodal survival — frozen vs dead, few mid-decay
(P8 expanded to a distribution test: Hartigan dip test or visual bimodality
band, Hartigan & Hartigan 1985).

### E4 — RW-Wagenaar (cue diary)
`genDiary` events for 30 days, then cued recall by each cue type alone.
**Target:** ordering what>who>where>when (Wagenaar 1986); `when`-only
recall near floor (P7 quantified: what-cue ≥ 1.5× when-cue hit rate).

### E5 — RW-Loftus (misinformation three-stage)
Stage 1 `genWitness` scene; stage 2 `hearAccount` with planted false
detail (arm: warned / disputed / plain / repeated×3); stage 3 delayed
recall + `beliefStatus` audit. **Targets:** plain misinfo adoption in
[0.20, 0.45] (meta-analytic range, Loftus 2005; replication-discounted);
warned arm ≤ half plain; disputed arm ≤ 0.1; repetition×3 ≥ 1.3× single.
CIE: post-`type:"correction"`, beliefStatus="doubted" at ~retract_p but
field still leaks in inference questions at ~cie_residual rate
(Ecker et al. 2022 review).

### E6 — RW-DRM (phantom lures)
Encode ≥ `phantom_fan_min` thematically-related records sharing a gist
("the regulars at Mudhaus"); probe recall for a never-seen gist-consistent
event. **Target:** phantom rate in [0.15, 0.60] scaled by relatedness —
Roediger & McDermott 1995 ranges (0.55–0.85 in lists; we target the low
end, naturalistic gist not word lists — HYPOTHESIS band).

### E7 — RW-Kashima (rumor chain)
`genChain` of 5 tellers on a mixed schema-consistent/inconsistent story.
**Target:** crossover — early hops preserve inconsistent items
(incongruity advantage), by hop ~4 stereotype-consistent items dominate
(Kashima 2000). Assert crossover day/hop ∈ [3, 6].

### E8 — RW-Bartlett (serial reproduction shape)
Same chains as E7 but measure *form*: gist compresses (leveling —
`level_frac`), detail count falls superlinearly, affective frame
assimilates to teller norms (Bartlett 1932). **Target:** monotone
compression; no hop may *increase* detail count absent new encoding.

### E9 — RW-OAB (own-age lineup)
`genPerson` encounters: 10 own-age, 10 other-age strangers, one meeting
each; recognition cascade probe at day 7. **Target:** own-age
familiarity advantage, d'-equivalent ≈ 0.2–0.5 (Rhodes & Anastasi 2012
meta, g≈0.37 — mid-band since our `oab_loss` is a simplification).

### E10 — RW-age-PM (prospective paradox)
`rememberIntention`: event-cued arm (trigger cue present in context)
vs uncued deadline arm across age knots {25, 45, 65, 75}.
**Target:** no age deficit in event-cued arm (T-equiv, SESOI r=.1);
age deficit in uncued arm scaling with age_eff (T-diff, r≥.2 by 75)
— the age-PM paradox (McDaniel & Einstein 2007; age-development.md §7).

### E11 — RW-involuntary-day (L3 bridge)
`ambientMemoryScan` over 30 simulated days for 5 archetypes.
**Target band:** involuntary recalls ≈ 1–5/day median across cohort
(diary studies: Berntsen 1996, Kvavilashvili & Mandler 2004 — humans
report a few spontaneous retrievals daily; marked DEBATED band since
diary counts vary widely). Below 0.5/day = memory system too quiet for
believability; above 10/day = intrusive.

---

## 6. Population validation (L3)

The probes validate *a* memory. Humans also differ from each other — the
design brief requires "no two mains share a memory profile." Formalized:

### 6.1 Profile distinctness

For the 8 mains' derived MemoryParams: pairwise Mahalanobis distance on
the free-parameter subvector must exceed a floor set from the trait-layer
covariance — concretely, min pairwise distance ≥ the 25th percentile of
distances in a 1000-draw random cohort (P98). Two mains as close as
siblings-in-law is allowed; clones are not.

### 6.2 Trait-structure preservation

Over a 500-draw cohort: the empirical correlation matrix of free params
must preserve the IndivTraits structure — specifically the named edges
(wmc→misinfo_suscept positive; consc→pm_self positive) at sign and ≥0.5
of designed loading, and the named **nulls** (g_mem→misinfo_suscept,
wmc→cie_residual, vivid→accuracy) inside TOST bands (P99). A trait layer
that produces correlated flaws is the legibility mechanism — this check
is cheap and catches loading-table rot.

### 6.3 Age-curve conformance sweep

Evaluate capacity params at ages {5,10,16,25,35,50,65,75,85} for a
reference profile: monotone directions per the knot tables
(age-development.md §6, age-decline.md §13), no discontinuities except
designed ones (amnesia_exit, bump window edges, permastore_age).
Numerical audit, not a run (P100).

### 6.4 Season-field statistics

Run one mixed-archetype neighborhood (8 mains + 12 ambients, degraded
mode for ambients) for 90 simulated days with `genDiary`-class event
density. Assertions:

- Live-record counts stabilize inside caps; archive grows sublinearly
  (no memory blow-up, P101).
- Retrieval events concentrate on <20% of records (human retrieval is
  massively uneven — rehearsal inequality, P102).
- `told_by` records' beliefStatus mix stays diverse: rumor/belief/fact/
  doubted all represented; >80% rumor convergence = rumor engine runaway.
- Emotional valence distribution of surviving memories drifts positive
  over the season (fading affect bias, Walker et al. 2003 — net
  positivity by day 90, band [.55, .75] positive share).
- Metamemory: corr(self_est, measured recall success) across cohort ∈
  [−0.1, 0.4] (must stay weak — Herrmann 1982; P103).

---

## 7. Believability audit (L4)

Not a gate — a rubric, because "feels human" is judged by humans and can't
be pre-registered into a number. Protocol:

1. Generate N=10 recall transcripts per main (dialogue renderings of
   Reconstructions, including confidence hedging, TOTs, dating errors).
2. ≥3 reviewers score each on 5 rubric lines (selective / reconstructive /
   cue-driven / confidently-wrong / individuated) 1–5.
3. Report median + Krippendorff's α (Krippendorff 2004); α ≥ .4 required
   to claim the rubric means anything at all. Low agreement → fix the
   rubric, not the model.
4. Failure signature examples to flag verbatim: perfect date recall,
   verbatim quotes >2 weeks old, remembering ambient NPC small talk,
   confidence tracking accuracy.

L4 exists to catch *correct-but-uncanny* implementations: e.g., a
character who forgets exactly per β but never volunteers a wrong detail
fails humans on dimension 4.

---

## 8. Acceptance gates

| tier | meaning | merge rule |
|---|---|---|
| MUST | consensus phenomena + all machinery (P68–P75, P95) | 100% pass; any fail blocks substrate merge |
| SHOULD | established but weaker/noisier effects | ≥80% pass; failures need written waiver + follow-up probe |
| OBSERVE | debated/hypothesis effects | report only; never blocks; a dead OBSERVE probe is a finding about the model's honesty |

Plus standing gates: all L0 goldens within MC error; determinism (P68/69)
is a precondition, not a probe — if it fails, stop.

**Waiver process:** a SHOULD failure can be waived only by a note naming
the human evidence *against* full-strength reproduction (e.g., "replication
discount applied, observed .18 vs band [.20,.45], OSC-consistent — accept").
Waiving against the literature's weakness is legitimate; waiving against
the model's convenience is not.

---

## 9. New probes P96–P105 (validation-design suite)

Gaps this version found — mostly cross-cutting checks no single-mechanism
probe covered:

- **P96 ecological density:** under `genDiary` density, daily encoded-
  record count lands in [5, 25] — matches enc_quota_per_day's intent
  (selective at birth); a day that encodes >40 is an attention-model bug.
- **P97 ambient-mode equivalence:** degraded-mode characters vs full-mode
  on the *shared* operators — decay + recall only — TOST-equivalent
  within SESOI r=.1 at matched params (the cheap mode must not change
  behavior, only resolution).
- **P98 profile distinctness:** §6.1 distance floor across the 8 mains.
- **P99 trait-structure preservation:** §6.2 edges + nulls (TOST).
- **P100 age-curve conformance:** §6.3 monotone audit, all capacity
  params, reference profile.
- **P101 cap stability:** season run — live records within caps, archive
  growth sublinear, no param-dependent blowup at extreme trait pins
  (HSAM-tail recipe included).
- **P102 rehearsal inequality:** §6.4 retrieval concentration — top
  decile of records supplies ≥40% of recalls (Gini-style check; humans
  rehearse a few stories constantly).
- **P103 metamemory decorrelation:** corr(self_est, actual) ∈ [−0.1, 0.4]
  across cohort — felt memory must not track real memory.
- **P104 golden-trajectory regression:** all §3.4 goldens within
  Monte-Carlo error of stored vectors.
- **P105 cross-probe non-interference:** running the full battery as one
  session (shared world, shared characters) must not flip any MUST probe
  vs isolated runs — catches probe-design artifacts where the harness
  itself is the only thing being validated.

P96–P105 bring the registry to P1–P105; numbering stable.

---

## 11. New probes P106–P116 (v12, encoding-mechanics suite)

Normative definitions in `encoding-mechanics.md` §12; constrained params
named there. Headline additions:

- **P110 elaboration + maintenance null (MUST):** deep vs shallow
  matched-attention events → ≥1.5× recall at 7 days; AND a rote-repetition
  control (re-encoded with elaboration at floor) adds ≤0.05 — tests
  `elab_gain` and the Craik & Watkins null in one shot.
- **P111 intention null (MUST):** `intent` on/off at fixed elaboration →
  TOST-equivalent. Guards the frozen `intent_null = 0` — if intent moves
  E the constant is broken by construction.
- **P112 DA asymmetry (MUST):** daLoad=0.7 at encoding costs ≥3× the
  recall loss of daLoad=0.7 at retrieval; retrieval-side cost lands in
  `searchCost`, not hit rate (Craik et al. 1996).
- **P107 enactment & aging (MUST):** enacted>observed advantage present
  in all bands and NOT smaller at 65+ — TOST on the interaction
  (Roberts et al. 2022: patients retain the benefit).
- **P108 doorway (SHOULD):** locShift → accessibility dip on
  <lapse_window-old records + pending Intentions; flat across age;
  magnitude band wide (DEBATED size, CONSENSUS direction).
- **P115 survival fold (OBSERVE):** residual dedicated survival term
  ≤0.02 E after the elaboration fold — guards the no-param decision;
  failure reinstates the param.

Registry now P1–P116; numbering stable.

---

## 12. New probes P117–P126 (v13, forgetting-curves II suite)

Normative definitions in `forgetting-curves.md` §10; constrained params
named there. Headline additions:

- **P117 spacing analog (MUST):** 3 retells spaced weekly vs massed
  same-hour → spaced R@30d ≥1.5× massed. Constrains `lag_opt_ratio`,
  `massed_retell_mult` (Cepeda 2006 lag-optimum direction).
- **P118 testing analog (MUST):** recall-grown vs rehear-grown records
  — S_A > S_B at 14d but R_B ≥ R_A at 1d (the Roediger & Karpicke
  short-delay inversion). Constrains `s_gain_recall`/`s_gain_rehear`.
- **P121 quote decay (MUST):** verbatim.quote <0.3 of birth at 1h while
  gist is intact — wording dies in minutes, meaning persists (Sachs
  1967). Guards frozen `tau_quote`/`beta_quote`.
- **P122 release-from-PI (MUST):** 5th same-bucket record depressed vs
  1st; 6th after a category shift starts near-clean (Wickens 1970).
  Constrains `pi_ref` + bucket structure.
- **P123 childhood ramp (MUST):** adult-survival of encodeAge 3/5/8
  records is graded monotone, and coherence-gated — not a step at 7
  (Bauer & Larkina 2014/2015). Constrains `amnesia_slope`,
  `child_consol_*`.
- **P126 retell-ecology flatness (MUST):** top-decile-E gist curves
  flatten via `retrievalCount`, not params — the Linton/Wagenaar shape
  must be *emergent*.
- **P124 suppression leak (SHOULD):** suppressEvent×3 lowers voluntary
  hit-rate ≤~15%, storageS unchanged, §5.7 intrusion rate unchanged
  (Anderson & Green 2001 — small bounded effect; failure mode is
  suppression too STRONG, not too weak).

Registry now P1–P126; numbering stable.

---

## 10. Sources new to this version

- Open Science Collaboration (2015), *Science* 349:aac4716 — replication
  discount: mean effect r .403→.197, 36% significant replications. Basis
  for halving single-study effect targets.
- Lakens, Scheel & Isager (2018), *AMPPS* 1(2):259–269 — TOST
  equivalence testing, SESOI discipline; our T-equiv form.
- Funder & Ozer (2019), *AMPPS* 4(2):156–168 — effect-size
  interpretation bands (r≈.1/.2/.3); replaces "markedly/significantly".
- Simmons, Nelson & Simonsohn (2011), *Psych Sci* 22:1359–1366 —
  researcher degrees of freedom; motivates pre-registered bands and
  frozen probe numbering.
- Benjamini & Hochberg (1995), *JRSS-B* 57:289–300 — FDR control across
  the battery.
- Hartigan & Hartigan (1985) — dip test for P8/E3 bimodality claim.
- Krippendorff (2004) — inter-rater α for the L4 rubric.
- Ecker et al. (2022), *Nat Rev Psychol* — continued-influence review;
  E5's residual-leak target.
- Ellenbogen et al. (2006) — sleep benefit grows with delay (E2's second
  leg, distinguishing consolidation from reduced interference).
- Berntsen (1996); Kvavilashvili & Mandler (2004) — diary rates of
  involuntary autobiographical memory; E11's band (marked DEBATED —
  estimates vary by method).
- Anderson & Maxwell (2016) — replication planning logic behind the
  discount rule.

Established-versus-hypothesis tagging: TOST, FDR, effect bands, and the
replication discount are methodological CONSENSUS. The L3 bands (event
density, involuntary rate, valence drift share, retrieval inequality)
are HYPOTHESES calibrated to plausibility — they're stated as ranges
precisely because the literature doesn't pin them tighter.

---

## 13. New probes P127–P135 (v14, retrieval-cues II suite)

Normative definitions in `retrieval-cues.md` §18; constrained params
named there. Headline additions:

- **P127 TAP gate (MUST):** matched vs mismatched `encodeOps`/`C.ops` at
  equal feature overlap → ≥1.5× recall ratio, and P9's absent-cue zero
  must hold under either ops match. Constrains `tap_mismatch`
  (Morris, Bransford & Franks 1977).
- **P128 output interference (MUST):** a k>1 bout returns fewer total
  fields than item-wise single recalls summed; emission order is
  drive-descending; unemitted same-bucket records measurably weaker next
  day (couples §5.13 to §5.8). Constrains `out_int`.
- **P129 focal vs nonfocal PM (MUST):** event+focal ≥0.85 hit; event+
  nonfocal ≤0.6 under distraction, same character, same intention
  strength. Constrains `pm_focal_hit`/`pm_monitor_p` (Henry et al. 2004).
- **P130 PM age gradient (MUST):** time-based hit-rate declines across
  bands; event+focal leg TOST-equivalent within ±0.15. Constrains
  `pm_clock_p`, `pm_time_age_loss` (Einstein & McDaniel 1990).
- **P131 ABA renewal (SHOULD):** conditioned affect extinguished in B
  returns ≥0.5 of pre-extinction on return to A; stays suppressed in B
  until `recovery_days`. Constrains `renewal_frac`, `extinctCtx`
  scoping (Bouton 2004).
- **P132 TOT resolution asymmetry (SHOULD):** syllable cue ≈0.3
  resolution; letter cue ≤⅓ of that; semantic description ≈0.
  Constrains `tot_resolve_p` (Abrams et al. 2007).
- **P133 TOT recurrence (SHOULD):** unresolved TOT field re-TOTs at
  1.5–2.5× base rate next attempt; resolved field does not. Constrains
  `tot_persist` (Warriner & Humphreys 2008).
- **P134 reminding chain (SHOULD):** retrieved parent surfaces each
  linked record at ≈`chain_gain`-scaled probability; no depth-2; the
  surfaced record carries §5.9 reboost. Constrains `chain_gain`.
- **P135 sleep cuing (SHOULD-direction / OBSERVE-magnitude):** sensory
  cue shared with sleep context → +8–15% next-day R on day-old
  declarative records; procedural and cue-absent-at-encoding controls
  null (Rasch et al. 2007). Constrains `tmr_gain`.

Registry now P1–P135; numbering stable.

---

## 14. New probes P136–P144 (v15, age-development II suite)

Normative definitions in `age-development.md` §21; constrained params
named there. Headline additions:

- **P136 latent amnesia (MUST):** records encoded at encodeAge 1–3 are
  `latent:true` on snapshot by adulthood, zero hits via ordinary recall;
  compound sensory(≥2)+place cue surfaces at ≈`latent_recall_p`;
  single-word/partial cues NEVER (Travaglia et al. 2016 sign-lock —
  context+reinforcer jointly required). Constrains `ret_win_base`,
  `latent_recall_p`.
- **P137 reminiscence_env (MUST):** env 0.9 vs 0.1 twins → high-env
  earliest records ~2–3y earlier and denser age-5 pool; low-env child
  still functional (boundary moves, capacity doesn't). Constrains
  `reminiscence_env`→`amnesia_exit_eff`/`child_consol_gain` mapping
  (Reese & Newcombe 2007).
- **P138 production deficiency (MUST):** child self-elaborated vs
  scaffolded events at matched content → scaffolded survives
  adult-relative, self-elaborated baseline; TOST: elab/gen gains ≈0
  below age 7 (Flavell 1970). Constrains `strategy_ramp`,
  `scaffold_gain`.
- **P139 off-target verbosity (SHOULD):** 75-y/o bout emits era-mate
  intrusions ≥5× the 25-y/o rate; intrusions are real live records,
  not noise. Interpretation-free (Trunk & Abrams 2009 style/debt
  debate). Constrains `offtarget_p` curve (Arbuckle & Gold 1993).
- **P140 knowledge-protection inversion (MUST — sign-locked):** repeated
  false claim contradicting strong semantic → old adopts at HALF young
  rate; same claim on novel topic → old adopts MORE. Fails if both
  directions covary — this probe guards the v1.5 sign fix
  (Brashier et al. 2017 vs Fazio et al. 2015).
- **P141 child sleep inversion (SHOULD):** <6 char, nap vs nap-deprived
  on same-morning records → ~`nap_loss` R gap unrecovered after normal
  overnight tick; adult control null (Kurdziel et al. 2013). Constrains
  `nap_loss`, `sws_child_peak`.
- **P142 cascading bump (SHOULD):** cultural semantic records show two
  encode-age peaks (own bump + [4,10] cascade); non-cultural controls
  one. Constrains `bump_semantic_gain`, `bump_cascade_gain`
  (Krumhansl & Zupnick 2013; Svob & Brown 2012).
- **P143 metamemory calibration (SHOULD):** selfReport↔actual r ≈0
  under age 10 (TOST vs adult r≈0.15); child self-estimates ≥1.5×
  actual; 70-y/o estimates ≤ actual. Constrains the v1.5 metamem_r /
  self_est_bias knot rows.
- **P144 source-channel split (SHOULD):** child source errors ≥60%
  internal (imagined→witnessed); 75-y/o errors ≥60% external
  (wrong-speaker). Constrains `child_internal_confuse` vs old-side
  `source_confuse` knots (Foley & Johnson 1985; Henkel et al. 1998).

Registry now P1–P144; numbering stable.

---

## 15. New probes P145–P153 (v16, age-decline II suite)

Normative definitions in `age-decline.md` §32; constrained params
named there. Headline additions — the compensation layer:

- **P145 value selectivity (MUST):** importance-graded event stream →
  75yo's top-vs-bottom-quartile recall spread ≥2× the 25yo's spread
  while overall recall is lower (Castel signature — selectivity
  preserved, capacity lost). Constrains `value_select`.
- **P146 positivity (MUST):** valence-balanced events → 75yo recall
  skews positive (+0.15 rate gap) and the skew VANISHES under
  daLoad/stress contexts (Mather & Knight sign-lock); 25yo skews
  mildly negative (Reed, Chan & Mikels 2014). Constrains
  `positivity_gain`.
- **P147 hyperbinding (SHOULD):** distractor-rich events → old records
  carry ≥3× more `hyperbound` fields, surfacing at recall with
  above-median confidence; explicit-attention events suppress the rate
  (implicit-only sign-lock, Campbell et al. 2024). Constrains
  `hyperbind_p`.
- **P148 destination memory (MUST):** 75yo re-tells a live record to
  the SAME listener ≥3× the 25yo rate; withhold-false-alarms stay low
  both ages (Gopie & MacLeod 2009 miss asymmetry). Constrains
  `dest_mem`, `toldTo`.
- **P149 context-content gap (SHOULD):** per-field-class survival →
  where/when die before what/who, ratio widening to ~1.5× at 85
  (Spencer & Raz 1995). Constrains `ctx_loss`.
- **P150 confident-and-wrong (MUST):** error reconstructions only —
  high-confidence (≥0.8) share rises with age at matched error rate
  (Dodson inversion); young errors cluster at low confidence.
  Constrains `conf_inflate_old`.
- **P151 schema scaffold (SHOULD):** domain-congruent vs novel events
  → old E-gap ≥2× young; sparse-semantic-store elder shows no
  scaffold. Constrains `schema_support` (Castel 2005).
- **P152 stereotype threat (SHOULD):** evaluative cueContext lowers
  old recall, NOT old recognition (Armstrong 2017 mode sign-lock);
  young cohort unaffected. Constrains `stereo_suscept`,
  `stereo_age_gate`.
- **P153 couple compensation (SHOULD):** groupRecall on an old
  intimate dyad ≥ solo union (facilitation allowed); old stranger
  pair < solo (inhibition preserved). Constrains
  `collab_partner_gain` (Barnier et al. 2014 crossover).

Registry now P1–P153; numbering stable.

## 16. New probes P154–P162 (v17, emotional-memory II suite)

Normative definitions in `emotional-memory.md` §24; constrained
params named there. Headline additions — the affect-tag layer:

- **P154 peak-end tag (MUST):** two episodes, same mean affect and
  duration; A spikes arousal 0.9 mid-way and ends calm, B flat 0.5.
  Stored `arousal_tag` must satisfy tag(A) > tag(B) by ≥30%, and
  doubling duration moves neither tag >5% (duration neglect,
  Kahneman et al. 1993). FAIL if tag = mean. Constrains `peak_w`,
  `end_w`, `affectSeries`.
- **P155 sleep strips heat (SHOULD):** arousal-0.8 record's arousal
  tag falls faster across sleep ticks than across matched waking
  intervals; `trauma:true` control unaffected; content strength and
  arousal MUST decouple (same-ratio decay = FAIL). Constrains
  `sleep_affect_strip` (Walker & van der Helm 2009 — flagged
  DEBATED; if the harness can't distinguish, the param stays at
  default, never silently raised).
- **P156 item-context tradeoff (MUST):** arousal-0.75 event vs
  matched neutral → higher core-field accuracy, LOWER `when`/source
  accuracy, fewer links; arousal-0.4 record shows the split
  attenuated ≥50% (graded — Kensinger & Schacter 2005; Madan 2017).
  Constrains `emo_assoc_loss`.
- **P157 verbal dampening (SHOULD):** identical negative record,
  social retell ×6 vs solo rehearsal ×6 → social path arousal tag
  lower by ≈`verbal_dampen`×6, solo unchanged; strength rises in
  BOTH paths (cooler ≠ weaker — the discriminating clause, Lieberman
  2007). Constrains `verbal_dampen`.
- **P158 regulation split (SHOULD):** `regulate_style` 0.15 vs 0.85
  characters on the same hot event → suppressor record weaker
  overall; reappraiser normal strength but cooler tag. FAIL if both
  lose strength (Richards & Gross 2000 sign-lock). Constrains
  `reg_suppress_cost`, `reg_reappraise_k`.
- **P159 generalization gradient (MUST):** conditioned dread at
  place P emits detectable affect at similar place Q, none at
  dissimilar R; a 2-trauma-load character emits at intermediate
  similarity where 0-load does not (Lissek 2010 flattening).
  Constrains `gen_width`.
- **P160 FAB self-boundary (MUST — sign-locked):** matched negative
  events at selfRelevance 0.8 vs 0.2 → 30d later the self event's
  negative tag faded ~1.3× positive rate; the non-self event fades
  at POSITIVE baseline. FAIL if non-self negative affect shows the
  gated rate (Walker 2003). Constrains `fab_self_gate`.
- **P161 contagion (SHOULD):** same account, flat vs expressive
  teller, high-empathy listener → listener arousal scales with
  `speaker_express`; an arousal-0.9 expressive telling can mint a
  CondEntry on a place never personally encoded (Olsson & Phelps
  2007 vicarious conditioning). Constrains `contagion_k`,
  `empathy_trait`.
- **P162 reconsolidation extinction (SHOULD):** safe exposure inside
  `reconsol_window` of a fire → suppressor marked `deep`; after
  `recovery_days` quiet, deep suppressor intact while a normal
  suppressor decayed by `recovery_frac` (Schiller 2010 — flagged
  DEBATED). Constrains `reconsol_window`, `reconsol_extinct_gain`.

Registry now P1–P162; numbering stable.

## 17. New probes P163–P172 (v18, false-memory II suite)

Normative definitions in `false-memory.md` §24; constrained params
named there. Headline additions — the candidate/self-authored layer:

- **P163 coexistence (MUST — sign-locked):** after §6.3 adoption, a
  source-discrimination probe still recovers the original field value
  at ≥ modified-test rates; the original can resurface at long delays
  once the misinfo candidate decays (Tousignant fluctuation). FAIL if
  adoption deletes the original candidate (overwrite is banned).
  Constrains `cand_base_str`, candidate schema.
- **P164 fabrication inflation (SHOULD):** `claim:true` loops inflate
  believe_p more than matched silent `imagineEvent` loops; flip tail
  lands in the 10–16% band across jittered profiles (Polage 2004);
  low-discrim_mult profiles inflate more (Polage 2012 sign-lock).
  Constrains `fab_inflate`.
- **P165 forced confabulation (MUST):** `answerProbe(forced:true)` on
  unanswerable details surfaces confabulated content in later recall
  at ~7d; child profile > adult; suggested answers persist >
  self-generated; voluntary silence produces none. Constrains
  `forced_confab_gain`, `other_gen_gain`, `press_gain`.
- **P166 evidence boost (SHOULD):** `evidence:"photo"` false scenario
  adopts at materially higher rate than matched-plausibility
  narrative and reaches the §6.9 flip gate sooner (pre-satisfied
  richness); plaus_min-impossible content STILL never flips even
  with evidence. Constrains `evid_boost`.
- **P167 cryptomnesia (SHOULD):** decayed-source told_by content is
  emitted as self-generated at ~5–15%; recently-heard content
  cryptomnesizes MORE than remote (Brown & Murphy proximity —
  sign-flip vs ordinary recency). Constrains `crypto_p`.
- **P168 choice-supportive (SHOULD):** believed-chosen options
  attract positive-feature candidates regardless of true choice;
  believed-rejected attract negative; 75yo shows larger asymmetry
  than 25yo (Mather & Johnson 2000). Constrains
  `choice_support_gain`, `consist_pull`.
- **P169 choice blindness (SHOULD):** `swapOutcome` undetected at
  ~60–80%; undetected swaps generate `inferred`-provenance motive
  candidates at next reconstruction; detected swaps tag
  `incongruent` and confabulate NO ownership. Constrains `cb_detect`.
- **P170 content–mood paradox (MUST — sign-locked):** negative-
  CONTENT rumors phantomize/adopt MORE; negative encode-MOOD records
  keep BETTER verbatim; depressive-trait cohort phantomizes more at
  matched events — three dissociable channels (Bookbinder &
  Brainerd 2016). Constrains `neg_gist_gain`, `negmood_verbatim_gain`.
- **P171 warning timing (SHOULD):** prewarned adoption < unwarned but
  > postwarned; `inoc_mult` protection present day 1, gone by ~day
  21 (Banas & Rains decay boundary). Constrains `prewarn_mult`,
  `inoc_mult`, `inoc_days`.
- **P172 repression-null (OBSERVE):** verify NO code path removes a
  high-S record from recoverable space; "recovered" reports emerge
  only via latent/phantom/source-flip machinery (§6.19). Report-
  only, not a gate.

Registry now P1–P172; numbering stable.

## 18. New probes P173–P182 (v19, individual-differences II suite)

Normative definitions in `individual-differences.md` §§10–18;
constrained params named there. The "second axis" layer — state noise,
language, culture, metacognition, knowledge.

- **P173 IIV signature (MUST):** a 70yo low-wmc profile shows ≥1.5×
  the day-to-day retrieval hit-rate variance of a 25yo high-wmc
  profile on identical cue sets; 200-day trait rank-order still holds
  (P56 not broken). Constrains `iiv_sigma` and its age/wmc scaling.
- **P174 language-dependent recall (MUST — sign-locked):** bilingual
  profile probed in language A vs B: matching-language records
  recalled ≥1.4× mismatching (Marian & Neisser 2000 direction,
  conservative bound); monolingual profile shows no lang effect.
  Constrains `lang_mismatch`.
- **P175 self-construal boundary (SHOULD):** culture_self=+1 vs −1
  profiles differ in amnesia_exit by ~1y total, in self-vs-collective
  field density, and NOT in decay rate — the null half is part of the
  test (Wang 2001/2003). Constrains the §12 loading rows.
- **P176 checking paradox (MUST — sign-locked):** verify-mode recall
  on a high-retrievalCount record reports LOWER confidence and FEWER
  detail fields than the first recall; accuracy unchanged. FAIL if
  verification raises confidence (van den Hout & Kindt 2003; meta
  k=28, N=1662). Constrains `check_conf_loss`.
- **P177 complaint decoupling (SHOULD):** across a 500-profile cohort,
  selfReport complaint correlates with the neurot/distrust composite
  at r≥0.3 but with actual hit-rate at |r|≤0.2 (Jonker 2000; Reid &
  MacLullich 2006 bands). Constrains `complaint_k` and the complaint
  composite weights.
- **P178 expertise dark side (SHOULD):** domainMatch-on records show
  HIGHER true recall AND higher domain-consistent lure adoption vs
  matched off-domain records (Castel et al. 2007; Baird 2003 —
  sign-lock on BOTH directions). Constrains `expert_lure`.
- **P179 intoxication fragmentation (SHOULD):** an encode run at
  intox=0.9 yields ≥40% fewer records for the window; surviving
  records carry fewer peripheral fields; sober-cued retrieval of the
  window is impaired vs a matched sober window; retrieval of
  sober-learned material while intox is near-intact (anterograde
  asymmetry sign-lock; White 2003). Constrains `intox_encode_mult`.
- **P180 aging-rate spread (OBSERVE):** at age 80, aging_rate ±1.5σ
  profiles differ ~±10y of functional age on decline params with
  reserve held fixed — orthogonality of the two buffers.
- **P181 maturity drift (OBSERVE):** 20→50y trait drift moves
  neurot-linked params ~0.4σ in the maturity direction with no
  single-step discontinuity at re-anchors (Roberts et al. 2006).
- **P182 dissociative trauma (OBSERVE):** high-dissoc trauma presents
  as more, weaker fragment records with more involuntary returns —
  never as higher-S consolidated memory (Ozer 2003; Brewin
  phenomenology). Report-only, not a gate.

Registry now P1–P182; numbering stable.

## 19. New probes P183–P192 (v20, social-memory II suite)

Normative definitions in `social-memory.md` Part II (§§18–30);
constrained params named there. The "talk ecology" layer — sharing
drives, social validation of confidence, secrets, canonization.

- **P183 sharing propensity (MUST):** per-record retell probability
  rises monotonically with |affect| (≥3× across the range);
  shame-flagged negative-self records suppressed ~half.
  Constrains `share_k`, `share_shame_pen`.
- **P184 recovery illusion (MUST — sign-locked):** N retells of a
  high-arousal record raise storageS measurably while `arousal_tag`
  declines only by `verbal_dampen`·n — talk never extinguishes
  affect. FAIL if sharing reduces arousal beyond dampen. Constrains
  the frozen `share_relief = 0`.
- **P185 corroboration asymmetry (SHOULD):** matched accounts raise
  both parties' conf ≈`corroborate_conf`; the inflation persists after
  the corroborator's `credibility` drops below 0.2; contradiction
  depresses less than confirmation inflates (disagree_conf <
  corroborate_conf). Constrains §6.20.
- **P186 copresence overreach (SHOULD):** "would X know" queries
  return true for inattentive co-present X at ≈`copresent_assume_p`,
  scaled up with age_eff — false-positive knowledge attribution is a
  designed error, not a bug. Constrains §6.21.
- **P187 interpret-bias band (MUST — structure):** ambiguous acts
  (|implied| < ambig_band) encode assimilated toward PersonModel at
  ~interpret_bias rate; clearly-contrary acts still earn
  incongruity_gain. FAIL if either effect eats the other — the band
  structure is the probe. Constrains `interpret_bias`/`ambig_band`.
- **P188 secret leak (MUST — emergent):** holding content strength
  fixed, leak probability rises with secret age; fresh secrets hold,
  old secrets leak at near-baseline rates; a failed respect roll
  transmits content WITHOUT the flag (silent). FAIL if secrets never
  leak or always leak. Constrains `secret_tag_mult`.
- **P189 canonization (SHOULD):** drift variance across verbatim
  fields saturates after `canon_thresh` retells; pre-threshold
  distortions persist frozen; late misinformation adoption on
  canonized records drops by ~`canon_resist`. Constrains §6.24.
- **P190 joint attention (SHOULD):** `coAttending` events beat matched
  solo events on E AND on |valence_tag| symmetrically (positive and
  negative both amplified). Constrains `joint_attn_gain`/
  `joint_affect_amp`.
- **P191 absorption (OBSERVE):** high-hearCount self-relevant told_by
  records flip kind at low rate only after source decay; absorbed
  records carry lower verbatim richness than matched witnessed ones;
  flagged `absorbed:true` for the harness. Constrains `absorb_p`.
- **P192 transactive loss (SHOULD):** partner-unavailable recall on
  directory-listed topics degrades (~`transact_loss` θ) while the
  directory entry itself survives — "I know who would know, and
  they're gone." Constrains `transact_loss`.

Registry now P1–P192; numbering stable.

## 20. New probes P193–P200 (v21, formal-model III suite)

The measurement layer: the similarity operator, metamemory
instruments, steady-state census, and composite conformance.

- **P193 similarity-mask sensitivity (MUST — structure):** a
  same-week/same-topic/different-people pair scores above
  `interf_thresh` under `sim_interf` but below `merge_thresh` under
  `sim_merge` — interference without fusion. Name tier:
  "Mara"/"Marta" beats "Mara"/"Dolores" under `sim_person` at equal
  featural overlap (phonological confusability, Conrad & Hull 1964).
  FAIL if any mask is a no-op. Constrains the §18 mask table.
- **P194 FOK accessibility dissociation (MUST — sign):** across failed
  recalls, `fok` correlates with `partialScore`/`cueMatch_ext`, NOT
  `accuracy`; phantom/confabulated records yield fok ≥ median of true
  records (Koriat 1993 — accessibility, not correctness). FAIL if fok
  tracks accuracy — that's an oracle, not a feeling.
- **P195 FOK aging split (SHOULD):** episodic fok→recognition gamma
  ≈ chance in older characters while semantic fok stays calibrated
  (Souchay et al. 2000; Sacher et al. 2023 meta g=0.53/−0.10).
  Constrains `fok_age_noise`.
- **P196 JOL inflation (SHOULD):** fluent-shallow encodings (high
  attention, low E — lapse/DA/intox) yield `jol − P(recall@30d)` > 0.15
  while matched unfluent encodings sit near zero (Nelson & Dunlosky
  1991; Rhodes & Castel 2008). Low-jol high-stakes records raise
  strategy_use outputs. Constrains `jol_fluency`.
- **P197 census band (MUST — regression):** steady-state N_live ∈
  [0.5, 2]·λ·E[t_death] over 200 scripted sim-days at λ ∈ {10,20,40};
  cap_episodic never binds below λ=40 — forgetting regulates
  population, caps only bound bursts.
- **P198 canonization ordering (SHOULD):** T_canon orders by
  talk-frequency not age — matched-age records, weekly-retold vs
  never-retold: only the retold one canonizes. Constrains retellCount.
- **P199 chain attrition (SHOULD):** verbatim survival across n hops ∈
  [(1−level_frac−0.05)^n, (1−level_frac+0.05)^n], n ≤ 5 (~17% at
  hop 5). Constrains `level_frac`.
- **P200 composite conformance (MUST — regression golden):** measured
  episodic/semantic t½ ∈ [0.8,1.25]·τ(2^(1/β)−1); hop half-life within
  15% of n½ = ln.5/ln(1−level_frac). The eight formal-model §21
  composites are the model's published fingerprint.

Registry now P1–P200; numbering stable.

## 21. New probes P201–P210 (v22, cast-profiles suite)

- **P201 immigration bump (MUST):** seeded stores for C6/C8 profiles
  (lifeEvents immigration at age a) show a second record-density peak
  over encodeAge ∈ [a−2, a+8] vs a matched non-immigrant control; C6's
  distribution is measurably bimodal (Schrauf & Rubin 2001).
  Constrains `mig_bump_gain`, `bump_windows` emission.
- **P202 crossover retrieval (SHOULD):** `lang:"es"`-tagged records
  retrieve better under `cueContext.lang:"es"`; 20–40% of immigrant-era
  retrievals under neutral cues return crossover-flagged content
  (Schrauf & Rubin 2000). Constrains `lang_mismatch` + lang field use.
- **P203 secrecy asymmetry (MUST — sign-locked):** `confidential`
  records surface on ambient scans at ≥1.5× the rate they face
  concealment-situation suppression; wellbeing-proxy cost correlates
  with intrusion count, not concealment count (Slepian et al. 2017).
  Constrains `secret_mindwander`.
- **P204 self-concealment split (MUST — structure):** raising
  `self_share_pen` suppresses transmission only of selfRelevance≥0.6
  records; `share_k` on other-focused content is untouched (Larson &
  Chastain 1990). The two channels must remain separable.
- **P205 avoidant boundary (MUST — sign-locked):** high `attach_avoid`
  profile shows an E deficit on `attachment:true` records and a NULL
  deficit on matched non-attachment emotional records (Edelstein 2006);
  a motivational/verify cue does not rescue recall (Fraley et al. 2000).
  Constrains `attach_encode_loss`, `attach_ret_cost`.
- **P206 cast distinctness (MUST):** the 8 compiled mains' free-param
  vectors pairwise-exceed the P98 Mahalanobis floor; a blind classifier
  matching forgetting-phenotype batteries to profiles recovers ≥6/8
  identities (cast-profiles.md §4 lists the confusable pairs).
- **P207 procedural preservation (SHOULD):** C6's `type:procedural`
  domain records (sewing-craft) decay ~0 across a simulated year while
  her episodic archive declines on the E-band curve — aging splits
  stores, not people.
- **P208 transactive widowhood (SHOULD):** C7 shows `transact_loss` θ
  penalty on bookkeeping/warmth topics while PersonModel(wife).available
  =false; C6 analog on husband-linked topics; penalty partially lifts
  if a surrogate directory PersonModel forms (Harris et al. 2014).
- **P209 intention-completion confusion (OBSERVE — HYPOTHESIS):**
  heavily rehearsed `open` intentions mint low-rate false-completion
  candidates via imagineEvent-on-plans (C5 rent, C8 notebook). Modeling
  hypothesis — no literature claim; watch rate, don't constrain it yet.
- **P210 secret-load ordering (SHOULD):** an identical `confidential`
  record seeded into all 8 mains produces ambient intrusion counts
  ordered by `secret_mindwander`×(1+0.4·selfconceal): C3 > C2 > C7
  (floor). Same secret, different digestions.

Registry now P1–P210; numbering stable.

---

# Part II — validating the validator (v23 second pass)

The first pass (§§1–21) built the probe registry, the statistics protocol,
and the L0–L4 level stack. It has a hole it cannot see from inside: **210
probes test whether the model produces phenomena; nothing tests whether the
probes can diagnose failure, whether the parameters are even learnable from
behavior, or whether the battery itself is gameable.** This part adds the
meta-layer: identifiability analysis, sensitivity screening, pattern-oriented
corroboration, a lesion battery that is the dual of the probe registry,
anti-Goodhart discipline, simulation-based calibration, and measurement
invariance across cohorts. Every piece is drawn from the computational-model
validation literature; nothing here is invented notation.

Framing note (claim hygiene): per Oreskes, Shrader-Frechette & Belitz (1994,
*Science* 263:641–646), open-system models are **corroborated, never
validated** — confirmation is always relative to a finite test set. We keep
the word "validation" for the harness but every gate output is phrased as
"corroborated at version vX" — never "the model is valid."

## 22. Evaludation mapping — where L0–L4 sit in the model cycle

Augusiak, van den Brink & Grimm (2014, *Ecol. Model.* 280:117–128) argue
"validation" has been stretched to meaninglessness and propose merging it
with evaluation into **evaludation**: six elements spanning the whole
modelling cycle. Our apparatus maps cleanly — this mapping is now the
normative claim of what each layer does:

| evaludation element | our apparatus |
|---|---|
| data evaluation | human-anchor corpus (§25.3); source/tier audit of every target band |
| conceptual-model evaluation | focus docs; this doc's §3.5 exclusion list; probe→mechanism attributions |
| implementation verification | L0 closed-form goldens; determinism precondition (P68/69) |
| model output verification | L1 probes P1–P220; §3.4 golden trajectories |
| model analysis | sensitivity screening (§24), identifiability audit (§23), lesion battery (§26) |
| model output corroboration | L2 experiment analogs, L3 season field, POM incidence matrix (§25.1) |

TRACE-style documentation (Schmolke et al. 2010; Grimm et al. 2014): the
spec + this registry + golden vectors + the version log already constitute
the TRACE analog; §29's failure-triage log is the missing piece — failures
were reportable but not classifiable, which made diagnosis tribal knowledge.

## 23. Identifiability audit (VA-ID)

A probe can only constrain a parameter if behavior pins that parameter down.
Two failure modes, both named in the literature:

**Structural non-identifiability** — params that enter observables only
through a shared combination (Raue et al. 2009, *Bioinformatics* 25:1923–29;
profile-likelihood method). Documented alias families in this model
(audited against spec §§2–7):

- **storageS vs θ** — the classic availability/accessibility ambiguity
  (Tulving & Pearlstone 1966): a record with huge S and unreachable θ is
  observationally identical to a dead record *until a strong-enough cue
  arrives*. Resolved only by cue-strength titration experiments (E4-class:
  recall probability as a function of graded cue overlap separates the two —
  dead records never return, buried records do). Any probe that scores
  "absence" without a strong-cue control is measuring θ·S jointly.
- **share_k × copresent_assume_p** — observed telling rate conflates "wants
  to tell" with "assumes you already know"; disambiguated only by
  toldTo-history probes (P148-style), not by rate counts.
- **arousal encoding gain vs arousal retrieval boost** — both raise
  survival; only the encoding-side lesion (§26) separates them, plus
  matched-delay pre-sleep vs post-sleep probing.
- **elab_gain × scaffold_gain in children** — production deficiency makes
  the child's own elaboration invisible to probes (P138); scaffolding
  comparisons are the only lever.

Rule (new, binding): every §7 param gets an entry in the
**identifiability matrix** = {structural | practical | identified} with its
disambiguating probe(s). Params marked `prior-held` (structurally
unidentifiable or practically unrecoverable at feasible n) MUST NOT be
tuned to pass probes — they carry literature/prior values and are audited
by P219. This formalizes the "frozen params" convention into a typed
contract.

**Practical non-identifiability / sloppiness.** Gutenkunst et al. (2007,
*PLoS Comput Biol* 3:1871) showed multi-parameter mechanistic models are
"universally sloppy": the sensitivity spectrum decays log-linearly over
decades — a handful of stiff parameter combinations do all the work, the
rest are barely constrained even by ideal data. Predicted for our model:
τ, β, θ, level_frac, and the encoding-scale parameters are stiff; most
interaction knobs are sloppy. **Consequences, now binding:**
(1) joint fitting is banned — params are estimated along stiff directions
only; (2) sloppy params keep prior values and are declared, not fit;
(3) a probe failure may only trigger retuning of params whose
identifiability entry is `identified` and which appear in the probe's
constraint map (§24). This kills the "turn every knob until green" failure
mode before it exists.

## 24. Sensitivity screening — the constraint map is computed, not asserted

Every probe in the registry says "constrains `param`" — asserted by the
doc author, never verified. Morris (1991, *Technometrics* 33:161–174)
elementary-effects screening computes it:

- For each free param, run r≥10 randomized one-at-a-time trajectories
  across its range, holding cohort/archetype fixed; measure the elementary
  effect on each of the eight composite observables (formal-model §21) +
  each MUST probe statistic.
- Report per param: μ* (mean |effect| — ranks constraint value) and σ
  (spread — flags interactions/nonlinearity).
- Output: a **param → observable incidence matrix** shipped as a versioned
  artifact. Probe "constrains" attributions must match the matrix or be
  re-flagged; a param with σ≫μ* on an observable must have its attributed
  probe redesigned as a factorial probe (main + interaction), not read as
  a main effect.
- Cheap version for early harness days: sweep each param ±1.5σ around
  default, compute max displacement of any composite; params displacing
  nothing beyond MC error → `prior-held` candidates pending the full
  Morris run.

## 25. Pattern-oriented corroboration (VA-POM)

### 25.1 Multiple weak patterns beat one strong target

Grimm et al. (2005, *Science* 310:987–991) pattern-oriented modeling: a
bottom-up model earns confidence by reproducing **multiple independent
patterns** simultaneously, because each additional matched pattern shrinks
the space of wrong models that could fake all of them. Applied here:

- The probe registry becomes a **pattern × param incidence matrix**
  (§24's matrix restricted to probe statistics). Claimable constraint
  tiers: `identified` needs ≥2 independent patterns agreeing on the
  param's range; `provisionally constrained` = exactly 1; `prior-held` = 0.
- A probe is "independent" of another if they share neither mechanism nor
  observable family (e.g., P199 chain attrition and P102 rehearsal
  inequality both touch retellCount dynamics but measure different
  observables — counted as one pattern; P199 + E8 compression shape are
  independent patterns on level_frac).
- This upgrades §4's tier table: MUST + ≥2-pattern coverage = the only
  "locked" params; a MUST probe is no longer the unit of confidence, the
  pattern set is. New probe P220 audits coverage.

### 25.2 Realized discrepancies — passing isn't enough

Gelman, Meng & Stern (1996, *Statistica Sinica* 6:733–807): assess fit by
comparing observed data to simulated replications on **discrepancy
statistics chosen to expose the failure you fear**, not the statistic you
scored. Rule: every MUST/SHOULD probe defines one *secondary* discrepancy
beyond its pass statistic — e.g., E5 scores adoption rate but also checks
the conf_out distribution among adopters (real misinformation adopters
report moderate confidence, not ceiling); P117 scores the spacing ratio
but also the massed-arm absolute level (spacing can win while both arms
are dead). Pass-statistic inside band but discrepancy in the extreme tail
= logged "pass-with-weird-tail" (P218) — qualitatively wrong even at pass.

### 25.3 Human-anchor corpus (versioned)

The probe bands scattered across focus docs get consolidated into a
versioned table — every quantitative human target in one place, each row:
`{probe, statistic, band, source, design, replication tier, discount}`.
Replication tiers: META (meta-analytic anchor — no discount), MULTI
(replicated single studies — light discount), SINGLE (one famous study —
OSC discount applies, §3.2). Representative rows (normative set lives in
the artifact, this is the shape):

| anchor | statistic used | source | tier |
|---|---|---|---|
| savings curve shape | power>exp AIC | Murre & Dros 2015 (Ebbinghaus replication) | SINGLE-discounted |
| permastore plateau | bimodal survival at 20y+ | Bahrick 1984 | MULTI |
| cue diagnosticity order | what>who>where>when | Wagenaar 1986 | SINGLE-discounted |
| misinfo adoption | 0.20–0.45 | Loftus 2005 + meta reviews | META |
| planted rich events | ~50% w/ photo evidence | Wade et al. 2002; ~70% claim Shaw & Porter 2015 (DEBATED — not a MUST anchor) | SINGLE |
| DRM phantom | 0.15–0.60 relatedness-scaled | Roediger & McDermott 1995 | META-adjacent |
| collab inhibition | inhibited union < nominal | Weldon & Bellinger 1997; Marion & Thorley 2016 meta | META |
| PM paradox | event-based ≈0 age diff | Einstein & McDaniel 1990; Henry et al. 2004 meta | META |
| FOK dissociation | fok ⊥ accuracy | Koriat 1993 | MULTI |
| involuntary rate | 1–5/day | Berntsen 1996 (diary variance — DEBATED band) | SINGLE |

Anchor-audit rule: when a probe fails and the anchor row is SINGLE-tier,
the first question is whether the band misstates the literature — fix the
anchor before touching the model (§29 bucket (d)).

## 26. Lesion battery (VA-L) — the dual of the probe registry

Ablation is the strongest causal test of mechanism: break one thing, watch
the *predicted* probes fail and everything else stand. Lesions are
harness-only settings — `lesion(op, mode)` contract hook (spec §10 v2.3):
a switch that nulls or clamps one mechanism without touching params.

| lesion | mode | must-fail probes | must-not-move probes |
|---|---|---|---|
| decay | β→0 (no forgetting) | P1, P117–P120, P126, P197 | P194 FOK, P204 |
| encoding modulation | E→1 flat | P31, P106, P110, P154 | P9 cue gating, P213-irrelevant |
| cue context | all cue matches → 1 | P9–P13, P127, P131, P174 | decay family |
| source monitoring | srcFam never decays | P44, P163, P167, P144 | P1, P31 |
| social layer | retell/hearAccount no-op | P183–P190, P7 chain probes | P68–P75 machinery |
| candidate sets | single verbatim fields (pre-v1.8 schema) | P163, P169, P170 | P121 quote decay |
| age scaling | age_eff frozen at 25 | P17–P30, P136–P153 | P68–P75 |

Coverage rule (P213): every MUST probe must appear in ≥1 row's must-fail
column — a probe that nothing can break is unfalsifiable decoration and is
demoted to OBSERVE. Each lesion run also checks the must-not-move column
with TOST — a lesion that moves unrelated probes means hidden coupling
(machinery leak), which is a bug report against the spec's modularity, not
against the probe.

## 27. Anti-Goodhart discipline (VA-AG)

"When a measure becomes a target…" (Goodhart 1975; Strathern 1997). A
pre-registered battery that implementers can see will be tuned against;
that is fine *if* generalization is independently audited. Protocol:

1. **Seed split.** seedBase parity partitions the harness: odd seedBases =
   calibration (tuning may iterate), even = confirmation. A confirmation
   run is a logged, one-shot scored event — its result hash is committed
   before the analyzer runs. Calibration-pass + confirmation-fail counts
   as FAIL and opens a generalization review (P214).
2. **Held-out probes.** ~15% of the registry (marked `class:
   confirmation` in the registry artifact, chosen to span every home doc)
   is excluded from tuning iterations entirely — the test set. MUST-tier
   confirmation probes can't be waived.
3. **Composite re-check.** After any tuning change, the eight §21
   composites (P200) and the P98/P206 distinctness floors re-run — passing
   the battery by collapsing parameter variance or by local spike fixes
   is the classic degradation mode.
4. **Anchor drift rule.** Any param moved >2× from its literature anchor
   to pass a probe requires a written justification citing human evidence
   in the version log; silent large moves are reverted at audit (P219).
5. **Rotating examiner.** The person/tool proposing a spec change does
   not write the probe that validates it (prevents the test encoding the
   intended answer).

## 28. Inference calibration — SBC and parameter recovery (VA-SBC)

The model is generative; the fitting problem is inverse. Simulation-based
calibration (Talts, Betancourt, Simpson, Vehtari & Gelman 2018, arXiv
1804.06788 — correcting Cook, Gelman & Rubin 2006) tests whether the
inverse problem is even well-posed:

- Draw θ^sim ~ profile prior (deriveParams ranges); simulate the harness
  observables; run the recovery/fitting routine; collect where θ^sim falls
  in the fitted posterior/interval ensemble. Repeat ≥100×.
- **Uniform rank statistics = calibrated inference** (χ² test). U-shaped
  ranks = overconfident fits; ∩-shaped = under-confident; skewed = bias.
  This catches a subtle failure: a probe battery that "constrains" a param
  that was never recoverable in the first place.
- Recovery tolerances (pre-registered): `identified` params recovered
  within ±20% at n=60-cohort data volume; params failing recovery AND
  flagged sloppy (§24 σ/μ* evidence) are reclassified `prior-held` and
  their probes downgraded to prior-consistency checks.
- This is the formal version of "probe → parameter" honesty: P211/P212
  gate any claim that a MUST probe is doing real constraint work.

## 29. Measurement invariance across cohorts (VA-MI)

Every cross-cohort T-diff probe assumes the instrument measures the same
construct in both arms. Meredith (1993, *Psychometrika* 58:525–543) gives
the standard ladder, adapted:

- **Configural** — the probe taps the same construct across age bands
  (a "hit" in a child cohort = a hit in an elder cohort).
- **Weak** — the observable loads on the latent equally (cue weighting
  comparable). Required for any T-diff on rates.
- **Strong** — thresholds equal; a 0.6 hit-rate means the same latent
  recall in both arms. Required before attributing a rate gap to age
  rather than to instrument.
- **Strict** — residual variances equal. **Deliberately NOT required:**
  human age groups genuinely differ in variance (IIV rises with age,
  P173); demanding strict invariance would erase a real phenomenon.

Concrete rules: (1) cross-cohort probes must state their assumed
invariance level in the registry row; (2) where invariance fails *by
design* (child verbosity inflating field counts; off-target intrusions
inflating elder totals), the probe must use a construct-level instrument
— ranks, ratios, or accuracy-vs-foil measures — not raw counts; (3) a
T-diff that could be produced by invariance violation alone is demoted
until re-instrumented (P216 audit).

## 30. Failure triage taxonomy (VA-EP)

Every probe failure gets classified into exactly one bucket — the taxonomy
replaces ad-hoc debugging lore:

- **(a) implementation bug** — L0 golden mismatch or formula drift; fix
  code, model untouched.
- **(b) calibration miss** — right mechanism, wrong constants; retune
  along identified directions only (§23).
- **(c) misspecification** — no parameter setting produces the phenomenon
  (confirmed by a §24 sweep or §28 SBC showing the observable flat across
  the whole space); this is the only bucket that changes the spec.
- **(d) bad probe** — the target band misstates the literature (check the
  anchor row's tier first); fix the anchor, never the model, and log it.

Historical note for the log: several anchors in the corpus are already
flagged DEBATED (P115 survival, P135 TMR magnitude, P155 sleep-heat,
P162 reconsolidation, P92 Zeigarnik, E11 diary band) — when they fail,
bucket (d) is the *prior*, and the burden of proof is on (b)/(c).

## 31. New probes P211–P220 (v23, meta-validation suite)

- **P211 SBC rank uniformity (MUST):** rank statistics of θ^sim in fitted
  ensembles are uniform for every `identified` param — χ² or the Talts et
  al. graphical bands; ≥100 replications. Constrains the fitting routine
  itself; failure = battery claims unearned constraint.
- **P212 stiff-param recovery (MUST):** params in the stiff set (§24 top
  eigen-directions, expected: τ, β, θ, level_frac, encoding scale)
  recovered within ±20% of truth at standard cohort volume.
- **P213 lesion coverage (MUST — audit):** every MUST probe appears in
  ≥1 §26 must-fail row; each lesion flips ≥1 predicted probe and moves
  zero must-not-move probes (TOST, SESOI r=.1). Uncoverable MUST probes
  demote to OBSERVE.
- **P214 seed-split generalization (MUST):** confirmation-seed run
  reproduces every MUST verdict; band-probe CIs must overlap calibration
  CIs. Divergence = FAIL + generalization review.
- **P215 held-out discipline (MUST — process):** `class:confirmation`
  probes show zero tuning-commit diffs since the version they were
  designated; audit is a version-log check, not a run.
- **P216 invariance audit (SHOULD):** ≥90% of cross-cohort T-diff probes
  declare an invariance level; any probe whose gap is reproducible by
  instrument asymmetry alone is re-instrumented or demoted.
- **P217 sloppy-spectrum conformance (SHOULD):** observed sensitivity
  eigenvalues decay roughly log-linearly and ≤10 stiff directions capture
  ≥90% of composite-observable variance. A spectrum with no sloppy tail
  means the model is under-parametrized (or the sweep is broken) — both
  worth knowing. Gutenkunst 2007 expectation, flagged HYPOTHESIS for a
  memory model.
- **P218 discrepancy tails (SHOULD):** ≥90% of MUST probes keep their
  §25.2 realized discrepancy inside posterior-predictive bounds;
  pass-with-weird-tail cases are logged, not silent.
- **P219 prior-held hygiene (MUST — process):** params classified
  `prior-held` show no tuning-commit deltas in the version log; any delta
  without an identifiability reclassification is a process violation.
- **P220 POM coverage (SHOULD):** ≥80% of free §7 params participate in
  ≥2 independent patterns in the incidence matrix; singleton params are
  listed `provisionally constrained` in the artifact.

Registry now P1–P220; numbering stable.

## 32. Sources new to this version

- Oreskes, Shrader-Frechette & Belitz (1994), *Science* 263:641–646 —
  corroboration-not-proof framing for open systems.
- Augusiak, van den Brink & Grimm (2014), *Ecol. Model.* 280:117–128 —
  "evaludation" cycle; the §22 mapping.
- Grimm et al. (2005), *Science* 310:987–991 — pattern-oriented modeling;
  §25.1's multiple-weak-patterns rule.
- Schmolke et al. (2010); Grimm et al. (2014) — TRACE documentation
  analog for our spec+registry+goldens+log.
- Gutenkunst et al. (2007), *PLoS Comput Biol* 3:1871 — universal
  sloppiness; §23's stiff/sloppy governance.
- Raue et al. (2009), *Bioinformatics* 25:1923–1929 — structural vs
  practical identifiability via profile likelihood; §23's matrix.
- Morris (1991), *Technometrics* 33:161–174 — elementary-effects
  screening; §24.
- Talts et al. (2018), arXiv:1804.06788 — simulation-based calibration;
  §28. (Corrects Cook, Gelman & Rubin 2006; see also Modrák et al. 2023.)
- Gelman, Meng & Stern (1996), *Statistica Sinica* 6:733–807 — realized
  discrepancies / posterior predictive checks; §25.2.
- Meredith (1993), *Psychometrika* 58:525–543 — measurement invariance
  ladder; §29.
- Goodhart (1975); Strathern (1997) — measure-into-target pathology;
  §27.
- Wade, Garry, Read & Lindsay (2002) — doctored-photo false memories
  (~50%); anchor table SINGLE tier.
- Shaw & Porter (2015) — ~70% implanted-crime claim; anchor table,
  flagged DEBATED (single dramatic study, critiques published).

Established-vs-hypothesis tagging: SBC, TOST, Morris screening,
profile-likelihood identifiability, invariance ladder, and the
evaludation cycle are methodological CONSENSUS. Sloppy-spectrum
conformance (P217) is a borrowed *expectation* — confirmed universal in
systems biology, plausible-but-unproven for a memory model; flagged
HYPOTHESIS. The seed-split/held-out-probe protocol is our engineering
discipline, not literature.

## 33. New probes P221–P230 (v24, encoding-mechanics II suite)

Encoding-state and content-class probes; spec v2.4 terms. Tiers per
§2.1; anchors vs the encoding-mechanics.md §29 verified sources.

- **P221 attentional boost (MUST):** `detected:true` events recall
  higher than matched non-detection events (T-diff d ∈ [0.2, 0.6]) AND
  same-tick co-encoded ambient records beat surrounding ambient records;
  BOTH effects vanish when the character holds no monitoring set —
  Swallow & Jiang's task-dependence is the boundary condition, not the
  boost itself.
- **P222 curiosity spillover (SHOULD):** high-curiosity events →
  +recall on the target AND on unrelated same-window records; spillover
  absent outside `curios_window` (Murphy 2021 proximity result is the
  falsifiable edge — a sustained-anticipation implementation fails).
- **P223 wakeful rest (SHOULD):** rested vs busy-window records differ
  at 7-day retention (≥1.2× proportion retained); flat across age bands
  (Dewar's 61–87 sample); absent when the window contains ≥2 new
  same-modality events.
- **P224 implementation intentions (MUST):** ifCue+thenAct intentions
  fire ≥1.5× vague ones on the focal-cue channel at matched schedule;
  nonfocal-cue firing statistically unchanged — the mechanism is
  binding strength, not vigilance (Gollwitzer & Sheeran 2006).
- **P225 teach expectancy (SHOULD):** willTeach events → higher delayed
  recall + higher organization subscore (linked-record completeness);
  interactive > non-interactive moderator per Kobayashi 2019.
- **P226 name penalty (MUST):** unfamiliar-person `verbatim.name`
  recalled worse than same-person semantic facts at matched E (Cohen
  homonym design); penalty shrinks with familiarity tier, grows with
  age_eff — the old-cohort TOT generator (Cohen & Faulkner 1986).
- **P227 owngroup (SHOULD):** other-group PersonModels accrue
  familiarity slower; mirror pattern in recognition (fewer hits AND
  more false alarms — NOT a pure criterion shift, Meissner & Brigham
  2001); `contact_share` attenuates.
- **P228 expertise (SHOULD):** in-domain events get more populated
  verbatim fields AND higher E; out-of-domain transfer TOST-null
  (Chase & Simon random-boards null is the design's spine);
  `expert_lure` path unchanged — both edges of the sword present.
- **P229 directed forgetting (MUST):** forget-tagged records show the
  R–F gap (~30% relative at default df_loss), never delete (all
  cue-accessible at retrieval), emotional records resist ≈4% (Hall
  2021), high-neurot and older cohorts resist more (Rupprecht & Bäuml
  2016 d 1.17→0.81).
- **P230 crafted mode (SHOULD):** `engagement:"crafted"` ≥ enacted on
  recognition, preserved-or-larger at 65+ (Meade 2019 dementia ceiling);
  fold audit — residual crafted variance beyond enact+gen+concrete
  ≤0.02 E, else reinstate a dedicated param.

Registry now P1–P230; numbering stable.

## 34. New probes P231–P240 (v25, forgetting-curves III suite)

Source: `memory/forgetting-curves.md` Part III (§§12–15). Spec v2.5.
This suite tests the decay engine's *purpose* (calibration axioms) and
the population tails — several probes constrain the model against the
world's own statistics rather than lab tables (new probe family).

- **P231 slope invariance (MUST):** records spanning E ∈ [0.3, 0.95],
  same class, no retells; per-record fitted β within ±0.05 across E
  terciles. Guards the §4.1 axiom (Slamecka & McElree 1983). Fail ⇒ a
  durability term leaked into β.
- **P232 face permastore (MUST):** PersonModel familiarity 0.7 →
  recognition leg ≥0.8× of plateau at 365d; matched stranger verbatim
  archives ~day 30; name recall of the SAME person decays normally
  (Bahrick et al. 1975 dissociation).
- **P233 event time (MUST):** identical records, equal Δt_days,
  n_events_since differing 3× → high-load R lower ≥15%. Constrains
  ev_time_w / ev_day_norm.
- **P234 transformation (SHOULD):** verbatim-field death raises gist S
  ≈transf_gain once per field; §4.3 merges show the same boost.
- **P235 state-ctx drift (SHOULD):** mood-state benefit → ~e⁻¹ at 21d,
  ~0 at 60d; mood-congruence unchanged at 60d (drift hits state only).
- **P236 sleep-coupled affect (SHOULD):** |valence| drop across a
  sleepQuality-1.0 boundary ≥1.5× matched waking span; sleepQuality 0.3
  ≈ continuous rate; trauma exempt.
- **P237 tails (SHOULD):** hsam → autobio census ~flat at 365d with
  misinfo_suscept UNCHANGED (Patihis guard); sdam → autobio steeply
  decayed, semantic R intact, low conf on own-past reports.
- **P238 availability census (SHOULD):** encodeAge histogram of live
  self-records is power-decaying with bump-window elevation for
  bump-aged cohorts (Crovitz & Schiffman / Rubin & Schulkind analog) —
  system-level canary: fails if encode, decay, era terms, or archival
  break simultaneously.
- **P239 reuse calibration (MUST — new probe family):** ≥90 sim-days;
  per content class with ≥50 accesses, R at the class's median reuse
  gap ∈ [0.4, 0.7]. Fails toward over-retention as well as over-decay —
  the Anderson & Schooler economy audit. Requires §10 v2.5 access-gap
  logging. Treat as health metric during first calibration passes.
- **P240 zero-E bound (SHOULD):** E→0 strays archive on the ordinary
  schedule under every modifier combination — no class is immortal by
  construction.

Registry now P1–P240; numbering stable.

## 35. New probes P241–P250 (v26, retrieval-cues III suite)

Source: `memory/retrieval-cues.md` Part III (§§20–29). Spec v2.6.
Tiers per §2.1. This suite audits the cue machinery itself —
diagnosticity, competition, the retrieval-vs-exposure asymmetry, and
the measurement discipline for "forgotten."

- **P241 diagnosticity (MUST):** two records at identical raw overlap —
  one cued by a df≈1% feature, one by df≈40% — the diagnostic cue wins
  by ≥1.5×; a context engineered to raise match while raising df must
  NOT improve recall (Poirier, Nairne et al. 2012 design). P9 must
  hold simultaneously (unencoded cue still contributes 0).
- **P242 ratio-rule competition (MUST):** adding same-cue competitors
  lowers P(target) at constant target drive; emission order is
  drive-descending in aggregate; bouts stop after kmax consecutive
  misses. Lesion-checkable: disabling §5.22 restores the v1.4 greedy
  emission.
- **P243 testing asymmetry (MUST):** recall-leg s_gain exceeds the
  re-exposure leg by ≥1.5× at ≥3d gaps; at same-day gaps the legs
  converge within 20% (Roediger & Karpicke 2006 crossover; Pyc &
  Rawson 2009 difficulty scaling rides the existing (1−R_pre) term).
- **P244 expanding schedule (SHOULD):** expanding access gaps ≥
  equal gaps ≥ massed on 30d retention, matched retell count
  (Landauer & Bjork 1978; expanding-vs-equal superiority at long
  intervals is DEBATED — the probe asserts ordering, not magnitude).
- **P245 suppression inhibition (MUST):** records suppressed with the
  cue present show recall deficit on INDEPENDENT probes (the Anderson
  & Green 2001 signature), bounded by tnt_cap, resisted ×~0.3 by
  emotional records, never deleted; cue-absent suppression accrues
  ~no inhib. Dual property: §4.12 θ-bump behavior unchanged.
- **P246 involuntary diet (SHOULD):** ambient-scan surfaces skew
  toward sensory/peripheral-cued, verbatim-rich records vs voluntary
  retrievals on the same corpus; involuntary rate age-flat within
  ±10% across bands while voluntary recall declines (Schlagman et al.
  2007) — intrusion_thresh must have no age knots.
- **P247 intention ecology (MUST):** an armed nonfocal intention
  raises θ measurably on unrelated recall AND raises drive on the
  linked record; a completed intention refires ≥10% within 2 days on
  cue re-encounter, higher at age_eff ≥70 (Walser et al. 2012 ~25%
  base; Marsh, Hicks & Bink 1998 post-completion inhibition).
- **P248 self-initiation (MUST):** the young→old recall gap is ≥2×
  larger under cue-sparse than cue-rich conditions; lesioning
  selfinit_pen collapses the sparse-side gap only (env_support_gain
  untouched — the legs must fail independently).
- **P249 ease inversion (MUST):** judgedFreq(k=4) > judgedFreq(k=10)
  on stall-prone topics — a decreasing judgment from an increasing
  retrieval count (Schwarz et al. 1991). No other mechanism may
  produce this signature; if found, treat as a bug.
- **P250 access-gap discipline (MUST — measurement):** ≥60% of
  uncued-failing live mid-age records recover under maximal cueing
  (Tulving & Pearlstone 1966 cue-dependent forgetting); access_gap ≈ 0
  across the corpus flags a decorative cue system — the anti-database
  audit. Add access_gap to the §2.5 probe-output schema as a standard
  field on all forgetting probes.

Registry now P1–P250; numbering stable.
## 36. New probes P251–P262 (v27, age-development III suite)

Source: `memory/age-development.md` Part III (§§23–32). Spec v2.7.
Tiers per §2.1. This suite audits the bump's mechanism, the
three-channel childhood error structure, the adolescent regime, and
the reversible overlays.

- **P251 firsts fuel the bump (SHOULD — mechanism):** hold bump_gain
  fixed; redistribute `first:true` events uniformly across encodeAge
  → bump amplitude drops ≥25%. If the bump survives intact, the
  mechanism is decorative — re-flag F1 HYPOTHESIS-only.
- **P252 three-channel childhood (MUST — sign-locked):** at age 6 vs
  25: misinfo adoption higher, gist-lure (`phantom_p`) rate LOWER,
  similar-item lure FA higher (discrim_mult child knots). Fails if
  any two channels move together — they must stay dissociable.
- **P253 child interference (SHOULD):** matched event + two
  interpolated cue-similar events → delayed-recall R drops ≥1.3× more
  at encodeAge 7 than 25; a scaffolded retell rescues.
- **P254 episodic-only amnesia (MUST — structural):** semantic and
  episodic records minted at encodeAge 3–5, aged to 25 → episodic
  pool latent/absent, semantic pool adult-strength with no source
  episode. Fails if semantics go latent or episodics persist.
- **P255 teen sleep (SHOULD):** 5-day low-sleepQuality stretch at 16
  → encoding deficit persists through ≥3 recovery nights (Lo et al.
  2017 shape); identical stretch at 35 recovers overnight.
- **P256 social-evaluative encoding (MUST — sign):** peer-evaluated
  event at 15 encodes ≥1.2× matched neutral; same contrast at 35
  <1.1×. The contrast must invert with age, not just attenuate.
- **P257 co-rumination (SHOULD):** teen negative records retell more
  only with a high-closeness peer PersonModel in the roster;
  high-rumin_k teen drifts gist-ward over months; the age≥12 gate
  blocks the drift below 12 (Sumner 2011 onset).
- **P258 narrative onset (SHOULD):** retells during narr_window
  (12–25) mint cross-era links at measurably higher rate than child
  or 45+ retells; teen-era records accumulate more links.
- **P259 script dating (SHOULD):** transition-class records' date
  errors are signed toward script_age; off-script transitions (>±10y)
  date with elevated sigma vs on-script matched events.
- **P260 child PM (MUST):** uninterrupted event-based intention at
  age 6 completes near-adult rate; interruption penalty ≥1.5× adult;
  caregiverPresent:true at cue arrival restores adult rate.
- **P261 pregnancy overlay (MUST):** during the window θ penalty +
  PM cost active, recognition spared (frozen `preg_recog_spare`),
  all effects gone post-window; `self_est` drops more than θ
  warrants (complaint > deficit asymmetry).
- **P262 perimenopause stall (MUST — sign-locked):** inside the
  overlay, repeated retells produce ~no S growth vs matched
  outside-window records; growth resumes after; no elevated decay
  anywhere (stalled growth, not loss — Greendale 2009 signature).

Registry now P1–P262; numbering stable.

## 37. New probes P263–P273 (v28, age-decline III suite)

The paradox layer — each probe targets an *inversion* or *dissociation*,
which is why most are sign-locked (the finding is the direction, not
the magnitude).

- **P263 PM paradox (MUST — sign):** one 78yo, three arms: focal
  cue-present intention ≥90% of the 25yo rate; nonfocal/time-based
  ≤60%; a cue-class-repeated (≥5 fires) habitual intention ≥ young
  rate. The paradox is the *shape* — all three in one character.
- **P264 impl-intent gate (SHOULD):** `impl_intent`-encoded event-based
  PM: gain at 70 ≥1.3× the gain at 25; at 82 gain ≤ young
  (Kretschmer-Trendowicz boundary — the rescue needs residual
  resources).
- **P265 antipeak lures (SHOULD — sign):** 75yo `lure_accept` at
  antipeak ≥1.5× her at-peak rate; 25yo peak/antipeak ratio <1.2.
  Recognition mode only — recall's own synchrony channel is separate.
- **P266 enactment flat (SHOULD):** SPT-vs-verbal encoding benefit
  within 10% at 30 vs 80 while absolute recall differs — parallel
  decline (Rönnlund 2003); guards the deliberate `enact_gain` null.
- **P267 errorful cost (SHOULD):** `attempted`-flagged records at 80
  show ≤60% of the 30yo potentiation without feedback; identical
  failure + corrective re-exposure inside `potent_window` restores
  ≥90% (Tse feedback arm).
- **P268 knowledge shield (MUST — sign):** repeated false claim on a
  dense-knowledge topic: 75yo `believe_p` BELOW 25yo; same claim on a
  novel topic: adoption equal. Both arms required — guards both the
  `rep_gain` flat null and `know_corr_gain`.
- **P269 imagined-vs-done (SHOULD):** planned-but-unexecuted action
  with a similar executed sibling: `imagined→did` flip rate rises ~3×
  from 30→85; dissimilar candidates unaffected (Henkel similarity
  gate).
- **P270 noisy-room tax (SHOULD):** identical conversation at
  `noise_level` 0.8 vs 0.1: `hearing` 0.5 elder encodes ≥30% weaker;
  hearing 1.0 control flat. Encoding-side only.
- **P271 isolation overlay (MUST):** contact < `iso_floor` sustained
  `iso_onset` days → measured β_episodic rise; contact restored →
  recovery over ~`iso_recovery`; `partnerDeath` jumps the ledger.
  Reversible, no record marks.
- **P272 complaint split (MUST):** `self_est` drifts negative and
  `complaint_k` rises 30→85 faster than measured recall declines;
  complaint rate responds to `depress_state`, not to a β lesion —
  metamemory dissociation, not modesty.
- **P273 involuntary highway (SHOULD):** ambient-scan emission rate
  flat 30→85 while voluntary recall falls; emitted records skew
  positive and remote in the old cohort (Schlagman double asymmetry).

Registry now P1–P273; numbering stable.

### Sources new to this version

Rendell & Thomson 1999 (J Gerontol B 54B:P256); Rendell & Craik 2000
(Appl Cogn Psychol 14:S43, Virtual/Actual Week); Rose et al. 2009
(Psychol Aging, doi 10.1037/a0019771); Chasteen, Park & Schwarz 2001
(Psychol Sci 12:457); Schnitzspahn et al. 2009 (Appl Cogn Psychol,
10.1002/acp.1576); Kretschmer-Trendowicz et al. 2009 (Eur J Ageing,
10.1007/s10433-009-0116-x); Intons-Peterson, Rocchi, West, McLellan &
Hackney 1999 (JEP:LMC 25:23); Rönnlund, Nyberg, Bäckman & Nilsson
2003 (Aging Neuropsychol Cogn 10:182, Betula n=1000); Tse, Balota &
Roediger 2010 (Psychol Aging, doi 10.1037/a0019933); Fazio, Brashier,
Payne & Marsh 2015 (JEP:G 144:993); Brashier, Umanath, Cabeza & Marsh
2017 (Psychol Aging 32:308, doi 10.1037/pag0000156); Henkel, Johnson
& De Leonardis 1998 (JEP:G 127:251); Lin et al. 2011 (Arch Neurol
68:214); Wilson et al. 2007 (Arch Gen Psychiatry 64:234); Gray et al.
2015 (JAMA Intern Med 175:401); Schlagman, Kliegel, Schulz &
Kvavilashvili 2009 (Psychol Aging, doi 10.1037/a0015785); Schlagman,
Schulz & Kvavilashvili 2006 (Memory, content analysis); O'Connor et
al. 1990; Pearman & Storandt 2004; Verhaeghen 2003 (vocabulary meta).

## 38. New probes P274–P285 (v29, emotional-memory III suite)

Full spec of each probe is in `emotional-memory.md` §38; registry
entries below. Suite exercises the v2.9 layer: discrete-emotion tags,
inverted-U arousal, appraisal-driven emotion reconstruction, privileged
cues (odor/date), person-conditioning asymmetry, trauma coherence
repair, weapon focus, recall→mood feedback, hot-cold report gaps.

- **P274 discrete-emotion split (MUST — sign-locked):** fear vs anger
  at matched valence/arousal diverge — fear keeps detail, anger drifts
  to gist. FAIL if tag is inert.
- **P275 inverted-U (MUST — non-monotonicity):** associative-field
  strength peaks near arousal_opt and declines at 0.95 while item
  fields still rise. FAIL if monotone.
- **P276 outcome rewrite (MUST — sign):** resolved-arc valence drifts
  toward current appraisal at retrieval; arousal tag and facts
  untouched. FAIL if valence static or arousal moves.
- **P277 Proust channel (SHOULD):** smell-cued scans surface older,
  more emotional records than sight-cued; accuracy NOT improved.
- **P278 anniversary intrusion (MUST):** day-of-year match fires
  high-arousal records with `cue_source:"date"` absent any field
  overlap; no fire off-date. FAIL if field match required.
- **P279 trust asymmetry (MUST — rate-locked):** one betrayal beats
  five kindnesses on a person-cue entry; negative entry outlasts.
  FAIL if symmetric.
- **P280 coherence repair (SHOULD):** structured retells cut intrusion
  rate and engage sleep stripping while leaving core fields intact —
  repair orthogonal to strength.
- **P281 weapon focus (SHOULD):** threat-object field up, `who` down,
  total field mass ~constant (capture, not suppression).
- **P282 recall→mood loop (SHOULD):** retrieved valence measurably
  moves C.mood; sequential same-sign recalls compound.
- **P283 hot-cold gap (SHOULD):** cold-context arousal reports
  compress; stored tag unchanged (report-side only).
- **P284 nostalgia restoration (SHOULD):** qualifying old positive
  social records lift low mood more than recent positives.
- **P285 one-year battery (MUST — anti-Goodhart):** emotional vs
  neutral event at 365d under naturalistic ticks must jointly show
  consolidated core, fragmented `when`, cooled arousal, intact
  confidence; FAIL if any single parameter produces the whole
  signature — the phenotype must distribute over ≥3 mechanisms.

Registry now P1–P285; numbering stable.

## 39. New probes P286–P297 (v30, false-memory III suite)

Full spec of each probe is in `false-memory.md` §36; registry entries
below. Suite exercises the v3.0 layer: verbal overshadowing, unconscious
transference + outgroup amplifier, conjunction migration, boundary
extension, denial backfire, reactivation susceptibility, phantom
recollection bimodality, central-peripheral gradient, dyad>group
conformity, truthiness.

- **P286 verbal overshadow (MUST — sign-locked):** verbalize-then-
  identify performs WORSE than no-description control; delayed-
  adjacent description hits harder than immediate (RRR ordering).
  FAIL if describing helps nonverbal identification.
- **P287 transference (SHOULD):** dead person-slots fill with
  familiar cue-plausible persons (~5–15%); explicit "wasn't there"
  blocks; outgroup-category transplants > ingroup at matched
  familiarity (ORB direction).
- **P288 conjunction (MUST):** high-sim record pair swaps a field;
  BOTH records and true values persist; migrated candidate keeps
  `inferred` provenance; old > young.
- **P289 boundary extension (MUST — direction-locked):** spatial
  extents overshoot, never systematically undershoot; veridical
  scene judged "closer than remembered."
- **P290 denial backfire (MUST — rate-locked):** denied claim reads
  denied at T+0, affirmed at T+3d in old profiles; 3× denial >
  1× denial as planting tool at delay. FAIL if frame never dies.
- **P291 reactivation window (SHOULD):** account inside react_window
  of a recall adopts more on just-recalled fields than unrecalled
  fields of the same record; no record-wide boost.
- **P292 phantom bimodality (SHOULD):** phantomized records split
  vivid-recollect vs familiar-only (~35/65 at gate); not a
  continuum.
- **P293 central-peripheral (MUST — quantified):** matched accounts
  adopt ~2–3× more on peripheral than central; adopted central
  errors emit higher confidence.
- **P294 dyad > group (SHOULD):** same misinfo, 2- vs 4-person
  discussion → dyadic adoption higher (target ≈ 68:49).
- **P295 truthiness ≠ evidence (MUST):** dressing raises believe_p
  but never satisfies rm_rich_thresh or plaus — nonprobative
  dressing cannot flip imagined→witnessed.
- **P296 provenance audit (MUST — hidden):** all transplant/
  conjunction candidates keep `inferred`; no relabel-to-witnessed
  path except §6.9/§6.10 flip gates.
- **P297 false-memory portfolio (OBSERVE — anti-Goodhart):** over
  30d free runs, false content decomposes across ≥4 channels
  (misinfo/phantom/transplant/conjunction/denial); FAIL if any
  channel produces >70%.

Registry now P1–P297; numbering stable.

### Sources new to this version

Schooler & Engstler-Schooler 1990 (Cognitive Psychology 22:36–71);
Meissner & Brigham 2001 (Appl. Cogn. Psych. 15:603–616, VO meta
Zr=−0.12); Alogna et al. 2014 (Registered Replication Report,
Persp. Psych. Sci. — −4%/−16% timing); Loftus 1976; Ross, Ceci,
Dunning & Toglia 1994 (J. Applied Psych. 79:918–930); Read et al.
1990 (UT field nulls); Meissner & Brigham 2001 (Psych. Pub. Pol.
Law 7:3–35, ORB meta: 1.40× hits / 1.56× FA mirror); three-level
ORB re-meta 2022 (Appl. Cogn. Psych., 159 articles); Innocence
Project / Gross & Shaffer exoneration statistics (~69–76%);
Reinitz, Lammers & Cochran 1992 (M&C); Odegard & Lampinen 2004
(Memory — autobiographical conjunction); Reinitz & Hannigan 2001;
Intraub & Richardson 1989 (JEP:LMC 15:179–187); Seamon et al. 2002;
Intraub & Dickinson 2008 / Intraub 2012 multisource model; Skurnik,
Yoon, Park & Schwarz 2005 (J. Consumer Research 31:713–724);
Mayo, Schul & Burnstein 2004; Jacoby 1999; Chan, Thomas & Bulevich
2009 (Psych. Sci. 20:66–73 — reversed testing effect); Potts &
Shanks 2012 (opposing interim-test result); Brainerd, Wright,
Reyna & Mojardin 2001 (JEP:LMC 27:307–327); Brainerd & Bialer /
Chang 2022 conjoint-recognition meta (JEP:LMC, 537 datasets);
Dalton & Daneman 2006 (Memory 14:486–501); Ibabe & Sporer 2004;
Newman, Garry, Bernstein, Kantner & Lindsay 2012 (PBR 19:969–974);
Alter & Oppenheimer 2009.

## 40. New probes P298–P309 (v31, individual-differences III suite)

- **P298 face-store dissociation (MUST — sign-locked):**
  face_ability=−2σ profile fails ≥70% of tier-1 familiarity rolls on
  twice-met strangers while episodic hit-rate on the SAME encounters
  stays within ±10% of a 0σ profile. FAIL if episodic params co-move
  (the dissociation is the phenotype). Constrains `fam_gain`,
  `fam_thresh_off`.
- **P299 ADHD acquisition-not-storage (MUST — sign-locked):**
  adhd=+2σ encodes ~25% fewer records in a busy window; survivors
  show normal β_episodic and normal θ-gated recall at 7d; fresh
  records (≤consol_window) show elevated interference cost. FAIL if
  retrieval-phase measures degrade beyond the encoding loss
  (Skodzik 2017). Constrains §21 loadings.
- **P300 ASD triple signature (MUST — sign-locked):** asd=+2σ shows
  LOWER phantom/lure rates AND LOWER leading-question adoption AND
  HIGHER source_confuse flips than 0σ — three signs at once
  (Maras meta; Lind & Bowler 2009). FAIL if susceptibility and
  source-confusion move together.
- **P301 cannabis window (MUST — sign-locked):** hearAccount at
  intox.kind=cannabis@0.7 adopts ≥1.5× placebo; the same account
  heard next-day sober adopts at baseline; retrieval of
  cannabis-window records shows encoding thinness but no elevated
  adoption (Kloft 2020 acute-only). Constrains `cann_*`.
- **P302 Shift ≠ Yield (SHOULD):** negativeFeedback challenges flip
  reported fields in high-suggs profiles at ≥2× low-suggs while
  beliefStatus flips at a strictly lower rate — report outruns
  belief (GSS structure).
- **P303 vigil mode-gate (MUST — sign-locked):** vigil=+2σ recalls
  socialThreat records above baseline; recognition-mode hit-rate on
  identical records at baseline (Mitte 2008 null); non-social
  negative records unaffected (SIP gate).
- **P304 meno rebound (SHOULD):** meno=1 overlay reduces
  rehearsal-practice S-growth ≥10% during the window and returns to
  premeno trajectory at expiry — FAIL if deficit persists (SWAN
  rebound IS the phenomenon).
- **P305 pregnancy gate (SHOULD):** preg effect absent trimesters
  1–2, present (E ×0.9 + iiv bump) in trimester 3 only (Davies 2018).
- **P306 aim gate (MUST):** aim=±2σ profiles differ on affective
  records (E, links, arousal tags) and are IDENTICAL on neutral
  records — the neutral-half null is the finding (Larsen 1987).
- **P307 hand-mix retrieval-only (OBSERVE):** hand_mix=+2σ shows a
  small episodic-recall edge, null differences on face tiers, wmc
  probes, and all encoding metrics (Lyle 2008 task pattern).
- **P308 name fan (SHOULD):** identical profiles, 15 vs 250 familiar
  PersonModels — the dense store misses tier-3 name rolls ≥1.5×
  more; tiers 1–2 affected ≤half as much.
- **P309 phenotype-nulls portfolio (OBSERVE — anti-Goodhart):** in a
  500-profile cohort at population prevalences (DP ~2.5%, adhd/asd
  tails), extreme-phenotype characters are distinguishable by their
  *pattern of nulls* (which measures stay normal) at least as much
  as by their deficits — FAIL if any phenotype degrades every
  metric globally.

Registry now P1–P309; numbering stable.

### Sources new to this version

Kennerknecht et al. 2006 (AJMG — HPA prevalence 2.47%);
Kennerknecht et al. 2017 worldwide survey (0.93–2.29%);
DeGutis et al. 2023 (Cognition — cutoff-dependent 0.64–5.42%);
Russell, Duchaine & Nakayama 2009 (super-recognizers);
Ramon, Bobak & White 2019; Wilmer et al. 2010 (face-ability
specificity); Bate et al. 2019 (DP subtypes); Skodzik, Holling &
Pedersen 2017 (J. Att. Disord. meta — encoding-stage deficit,
verbal only); Alderson et al. 2013 (adult WM meta); Kofler et al.
2018 (children WM d≈1.17–1.44, episodic buffer intact); Söderlund
et al. 2022 (interference meta: PI g=−0.53 children, RI g=+0.17);
Ozel-Kizil et al. 2016 (hyperfocus, flagged weak);
Maras et al. 2019/2021 (JIDR meta — ASD decreased suggestibility
z=−2.37, ID increased z=6.10); Murphy, Ichijo, Bird & Cooper 2025
(DRM — comparable false recognition, absent implicit priming);
Lind & Bowler 2009 (ASD source-monitoring); Crane & Goddard 2008
(ASD OGM); Happé 1997 (WCC); Gudjonsson 1984/1997 (GSS Yield/
Shift); Gignac & Powell 2009 (GSS2 CFA, Yield1–Shift poorly
correlated); Drake 2010 (SEM — FAA/compliance→Shift);
Cacioppo & Hawkley 2009 (loneliness hypervigilance review);
Spithoven et al. 2017 (lonely SIP-model review); Mitte 2008
(Psych. Bull. 134:886–911 — recall-only threat memory bias,
165 studies); Larsen & Diener 1985; Larsen 1987 (AIM review);
Larsen, Diener & Cropanzano 1987 (affective-gated cognitive ops);
Propper, Christman & Phaneuf 2005; Lyle, McCabe & Roediger 2008
(Neuropsych. 22:523 — task-selective nSR advantage); Lyle et al.
2017 (fNIRS replication); Kloft, Otgaar, Blokland, Monds, Toennes,
Loftus & Ramaekers 2020 (PNAS 117:4585–4594 — acute THC false-
memory, 1-week null); Greendale et al. 2009 (SWAN, n=2362 —
perimenopausal practice-gain loss + rebound); Epperson et al. 2013
(Penn Ovarian, n=403, 14y); Davies et al. 2018 (MJA 208:35–40 —
pregnancy meta SMD 0.52/1.47-t3).

## 41. New probes P310–P321 (v32, social-memory III suite)

- **P310 morality primacy (MUST — sign-locked):** matched negative
  acts in moral vs competence dims — the moral act moves `eval`
  ≥1.5× more; positive counterevidence repairs competence
  impressions ~2.5× faster than moral ones (moral_rehab). FAIL if
  eval moves equally across dims (Brambilla 2019; Wojciszke 1998).
- **P311 FAE under load (MUST — sign-locked):** constrained-behavior
  observation at attention 0.9 vs 0.4 — busy observers' trait delta
  ≥1.5× rawer (situation discounted less); the constraint field
  itself is equally weak in both conditions (the inference differs,
  not the record). FAIL if `g_mem` partially exempts — correction is
  resource-gated, not ability-gated (Gilbert et al. 1988).
- **P312 status asymmetry (SHOULD):** equal-frequency dyads up and
  down a status ladder — the lower-status member's PersonModel
  accrues familiarity/identity faster; the higher-status member's
  model stays category-dominated longer (Ratcliff 2011; Guinote 2007).
- **P313 destination decay (MUST — sign-locked):** toldTo recall
  accuracy < source (who-told-me) recall on matched content at equal
  delay; dominant error in ≥65+ profiles is the confident miss →
  measured repeat-tell rate rises with age (Gopie 2009/2010
  direction, not a hard number).
- **P314 exposure overreach (SHOULD):** ambient-only co-presence
  (exposure events, no episodes) produces `familiar_only` cascade
  outputs and elevates that person's weight in §6.26 transplant
  scoring; identity stays ≈0 (Jacoby 1989 analog).
- **P315 gossip-evidence discount (MUST — structure):** the same
  trait-implying act witnessed vs told_by updates `traits[t]` at
  ~`heard_update_w` ratio scaled by speaker credibility; a
  zero-credibility speaker moves traits ~0 even when the claim is
  adopted at report time — believability and trait-update decoupled.
  FAIL if hearsay and witness move traits equally.
- **P316 disclosure trust loop (SHOULD):** a confidential tell →
  listener's model[speaker].credibility AND speaker's
  model[listener].eval both rise (two Collins & Miller effects as
  two writes); subsequent retell crosses shared_reality_gate sooner.
- **P317 individuation slope (SHOULD):** trait queries on a fresh
  PersonModel return ≥60% catPrior; after ~5 diagnostic encounters
  ≤20% catPrior. FAIL if models are born individuated (Fiske &
  Neuberg 1990).
- **P318 transference fill (MUST — falsifiable):** a new person at
  sim≥thresh of a high-eval donor shows schema-consistent false
  fills at ≥transference_fill rate in early reconstructions,
  declining with individuation; below thresh → none; FAIL if fill
  persists at full rate after individuation ≥0.8 (Andersen & Baum
  1994 memory effect).
- **P319 novelty-gated retell (SHOULD):** an audience whose
  shared_with⊃fields A,B hears field C ≥novel_pick_w more often;
  toldTo-decayed audiences re-hear old fields — the repeat-tell
  channel meets P313 (Clark common ground on error-prone ledgers).
- **P320 phrasing lineage (OBSERVE — forensic):** a two-chain rumor
  split retains ≥50% of hop-1 distinctive phrasing after 3 hops;
  chain-mates share phrasing tokens above base rate — usable as a
  lineage marker by the history browser (Pickering & Garrod 2004).
- **P321 contagion heat (SHOULD):** listener affect_tag after retell
  tracks `speakerArousal` (not record birth arousal) and empathy
  loading; a cooled teller's month-old rumor arrives at lower affect
  than a hot teller's same-age rumor (Hatfield 1994; Rimé 2009).

Registry now P1–P321; numbering stable.

### Sources new to this version

Gopie & MacLeod 2009 (Psych. Science 20:1492 — destination memory
weaker than source memory, self-focus mechanism); Gopie, Craik &
Hasher 2010 (Psych. Aging — disproportionate destination impairment,
confident-miss direction → repeats); El Haj, Fasotti & Allain 2012
(destination memory review); Ratcliff, Hugenberg, Shriver &
Bernstein 2011 (PSPB 37:1003 — high-status faces privileged:
recognition, attentional bias, sociospatial binding, holistic
processing); Guinote 2007 (power dampens individuating attention);
Fiske 1993 (power-as-control); Gilbert, Pelham & Krull 1988 (JPSP
54:733 — categorization→characterization→correction, correction
resource-gated); Trope 1986; Krull 1993; Wojciszke, Bazinska &
Jaworski 1998 (morality/competence dimensional primacy); Fiske,
Cuddy & Glick 2007 (SCM); Brambilla, Sacchi, Rusconi & Goodwin 2021
(EJSP — morality sought first); Brambilla et al. 2019 (moral info
drives impression REVISION); Reeder & Coovert 1986 (immoral
impressions resist counterevidence); Collins & Miller 1994 (Psych.
Bull. 116:457 — three disclosure–liking effects, meta); Sommerfeld,
Krambeck, Semmann & Milinski 2007 (PNAS — gossip substitutes for
observation, indirect reciprocity); Feinberg, Willer, Stellar &
Keltner 2012 (JPSP — prosocial gossip, ostracism); Jacoby, Woloshyn
& Kelley 1989 (famous-overnight familiarity misattribution); Fiske &
Neuberg 1990 (category→individuation continuum); Brewer 1988 (dual-
process person perception); Andersen & Baum 1994; Andersen, Glassman,
Chen & Cole 1995; Andersen & Chen 2002 (Psych. Rev. 109:619 —
relational self, transference memory effect); Pickering & Garrod
2004 (BBS interactive alignment); Garrod & Anderson 1987; Brennan &
Clark 1996 (lexical entrainment); Clark (common ground); Hatfield,
Cacioppo & Rapson 1994 (emotional contagion); Peters & Kashima 2007
(social sharing → listener emotion); Hess 1990 (older-adult schema
reliance).

## 42. New probes P322–P333 (v33, formal-model IV suite)

Machinery probes — they test the multi-agent substrate, the cache
discipline, and the fitting protocol rather than a psychological
phenomenon (full semantics in `memory/formal-model.md` Part IV).

- **P322 broadcast independence (MUST — structure):** one ledger
  event with n participants produces per-participant records whose
  E/verbatim differences follow each participant's attention and
  params; identical-records-modulo-order = FAIL.
- **P323 dyadic causal order (MUST — structure):** the transmitted
  account in `retell` reflects the speaker's post-drift record;
  pre-drift transmission = FAIL.
- **P324 tick atomicity (MUST — determinism):** dyadic ops inside a
  tick window never expose a partially-ticked counterparty; replay
  bit-identical.
- **P325 society snapshot (MUST):** societySnapshot at a ledger
  boundary → resume → identical states at t+10 across all stores.
- **P326 status hysteresis (SHOULD):** believe_p oscillating ±0.02
  across a boundary produces ≤1 status change; retracted records
  hold "doubted" ≈doubt_persist days then re-derive. Constrains
  belief_hyst and doubt_persist.
- **P327 truth-default (SHOULD — sign):** untriggered told_by
  fields adopt at ≥ truth_default_w−0.1; triggered identical
  fields below 0.3 (Levine 2014 direction).
- **P328 session termination (MUST — bound):** no session exceeds
  session_scan_cap scans; anchor chains never revisit visited
  records; anchors never cross sessions.
- **P329 age-continuity (MUST — invariant):** day-over-day
  |Δparam| bounded by knot-curve slope + declared jitter; the
  era-vs-capacity mutation test (advance worldDay on frozen
  records → encodeAge immutable).
- **P330 parameter recovery (SHOULD — falsification gate):**
  recoveryRun: all §21 composites within recov_tol; per-char
  params with named observables within 20%; twice-failing params
  get frozen per formal-model §32.1.
- **P331 probe statistics (MUST — meta):** every proportion probe
  declares n ≥ class minimum (384 cheap / 100 expensive) and
  reports Wilson CIs; BH at bh_q applied per probe family; the
  flaky-probe rerun protocol documented.
- **P332 degradation equivalence (SHOULD):** L1–L3 preserve §21
  composite means within recov_tol; L4 preserves P68/P70 only.
- **P333 malformed-input fuzz (MUST — safety):** fuzzed malformed
  events → no NaN/range escape downstream (extends P70), skip/
  clamp logs match, ledger uncorrupted.

Registry now P1–P333; numbering stable.

### Sources new to this version

Levine 2014 (J. Language & Social Psychology — Truth-Default
Theory; doubt requires triggers); Street & Masip 2015 (lie
detection within TDT); Alchourrón, Gärdenfors & Makinson 1985
(AGM belief revision — cited as REJECTED alternative); Nilsson,
Rieskamp & Wagenmakers 2011 (J. Math. Psych. 55:84 — hierarchical
Bayesian parameter recovery); Palminteri, Wyart & Koechlin 2017
(TICS 21:425 — simulation+recovery as falsification discipline);
Morris 1991 (Technometrics 33:161 — elementary-effects screening);
Wilson 1927 (score interval); Benjamini & Hochberg 1995 (JRSS-B
57:289 — FDR); Gutenkunst et al. 2007 (sloppy-model priors, reuse);
Loftus 1979 (eyewitness divergence, reuse); Gabbert, Memon & Allan
2003 (co-witness conformity, reuse); Bartlett 1932 (reuse).

## 43. New probes P334–P345 (v34, character-profiles II suite)

- **P334 anchor drift split (MUST — structure):** seed a `selfdef`
  record and a matched non-anchor at equal strength; after 30d of
  drift, the anchor's `meaning` field error ≤ 0.5× the non-anchor's
  while peripheral-field error is NOT significantly lower — anchors
  hold interpretation, not wording (Blagov & Singer). Victor vs
  Tomás versions of the same handshake event MUST diverge in
  `meaning` while agreeing in content fields.
- **P335 anchor floor (MUST):** decay an anchor below
  `forget_thresh` — it never archives while `selfdef:true`; the cap
  `selfdef_cap` demotes rather than deletes (displaced anchor then
  archives normally).
- **P336 defensiveness-specificity (MUST — sign-locked):** profiles
  at `defens` {−1, 0, +1} mint anchors whose field-population
  decreases monotonically (`selfdef_spec_mult` inverse load);
  meaning-field presence is UNAFFECTED — the repressor claims the
  point and loses the scene (Blagov & Singer 2004).
- **P337 mnemic neglect dissociation (MUST — structure):** battery
  of {self|other} × {central|peripheral} × {high|low diagnostic}
  negative feedback → recall deficit ONLY in the
  self×central×high-diagnostic cell; recognition/copy-cue probe on
  the same records shows NO deficit ("forgotten but not gone" —
  Green et al. 2008). Sign-locked on the cell pattern.
- **P338 close-source relief (MUST):** identical self-threatening
  feedback from (a) stranger, (b) `eval ≥ 0.5` close other, (c)
  `improvement:true` framing → (b,c) recall ≈ control, (a) shows
  deficit; `mnem_close_relief` scales the rescue (Green et al. 2009).
- **P339 mnem gate nulls (MUST — null family):** `mnem_neg` max does
  NOT depress recall of: positive central feedback, other-target
  feedback, peripheral-trait criticism, low-diagnosticity insults.
  All four nulls are cite-guarded (Sedikides & Green model).
- **P340 negative forward-misdating (SHOULD — direction):**
  `dateEstimate` on seeded negative records biases recent at
  `neg_now_pull`-proportional magnitude; positive controls do not
  (Rubin & Berntsen 2003 negative present-peak).
- **P341 lifescript age pull (SHOULD):** `lifescript:true` positive
  records' dateEstimates cluster nearer normative script ages than
  non-script positives at matched true ages (Berntsen & Rubin 2004);
  pull ≤ `script_age_pull` bound.
- **P342 involuntary positivity (SHOULD — rate):** ambient-scan
  involuntary retrievals' positive share ≥ ~2× negative share at
  `invol_pos_bias` default on a neutral seeded store; scales with
  param; AGE-linked via positivity curve (older cohorts higher).
- **P343 redemption meaning-drift (SHOULD):** a `script_redeem`
  +0.8 profile retelling a negative record n times shows monotone
  `meaning`-valence ascent bounded by `redeem_write·n`; content
  fields unchanged at every step — checkable facts, drifting frame
  (McAdams 2001). Contamination mirror at −0.5.
- **P344 ambient tier distinctness (MUST):**
  `deriveParams(ambient:true)` vectors (a) occupy a strictly
  narrower trait ellipsoid (`ambient_trait_sigma`), (b) hold zero
  `selfdef` records after 90 simulated days, (c) show
  `cat_prior_pull`-dominated PersonModels (type-typed recall errors
  ≥ mains'); promotion path produces a full-σ profile WITHOUT
  rewriting prior records.
- **P345 cast narrative signatures (OBSERVE):** run each main's
  compiled profile through the P337/P343 batteries; expected order
  mnem_neg effective: Victor > Priya > Marisol > Carmen > Dani >
  Jules > Tomás > Marcus; redemption retell ascent: Carmen > Tomás
  > Marcus > Marisol > Jules > Dani > Priya > Victor. Deviations
  flag compiler drift, not spec failure (v22 P206 is the binding
  distinctness gate).

Registry now P1–P345; numbering stable.

### Sources new to this version

Blagov & Singer 2004 (J. Personality 72:481); Singer & Salovey 1993;
Sedikides & Green 2000 (JPSP 79:906); Sedikides & Green 2009
(P&SC 3); Green, Sedikides & Gregg 2008 (JESP 44:547); Green et al.
2009 (Self & Identity 8:233); Berntsen & Rubin 2004 (Psych. Bull.
Rev. 11:1003); Rubin & Berntsen 2003 (Psych. Aging 18:636);
McAdams, Reynolds, Lewis, Patten & Bowman 2001 (PSPB 27:472);
Fiske & Neuberg 1990 (reuse).

---

# Part III — the statistics engine and adversarial validation (v35 third pass)

Part I built the probes; Part II made them honest (identifiability,
Goodhart discipline, invariance). Part III fixes three remaining
systematic lies: **(1) the battery is re-run every version — repeated
significance testing across releases silently inflates the effective
alpha** (each version is another "look" at accumulating evidence);
**(2) probes recycle cohort members across items, so naive n counts
overstate effective sample size**; and **(3) nothing has ever tested
the battery against known-broken implementations** — a test suite that
has never seen a fault cannot prove it catches faults. Sections 44–52
are the fixes; §53 adds probes P346–P357.

## 44. Sequential battery discipline (VA-SEQ)

### 44.1 The repeated-look problem

Every version re-runs all MUST/SHOULD probes on a model that drifts a
little each release. This is the classical repeated-significance-
testing setup (Armitage, McPherson & Rowe 1969): m unplanned looks at a
criterion inflate the family-wise false-positive rate — with ~150 MUST
probes re-run across ~35 versions, unadjusted per-look α=.05 makes
occasional spurious "regressions" a *certainty*, and each spurious
regression invites a spurious retune. The fix is not to stop looking;
it is to spend alpha.

### 44.2 Two regimes, kept separate

- **Within-version (cross-sectional):** one run, one battery — the
  existing BH-FDR q=.1 per probe family (P331) and pre-registered bands
  apply unchanged. No alpha spending needed; looks are simultaneous,
  not sequential.
- **Across-version (longitudinal):** a probe's *regression verdict*
  (was-pass → now-fail on unchanged spec semantics) is a sequential
  decision. Governed by a **Lan–DeMets alpha-spending function with an
  O'Brien–Fleming boundary** (O'Brien & Fleming 1979, *Biometrics*
  35:549–556; Lan & DeMets 1983, *Biometrika* 70:659–663; Pocock 1977
  as the rejected alternative — its flat boundary makes early alarms
  too cheap for our purposes). Concretely:
  - Information time t = versions elapsed / planned battery lifetime
    (declare t at each release: current lifetime plan = 40 versions).
  - A regression claim on a MUST probe must cross the OBF z-boundary at
    that t — at t≤0.5 the boundary is extreme (z≈2.8+): early-version
    "regressions" need overwhelming evidence before a retune is even
    permitted. At the final look the boundary relaxes to ≈1.96.
  - Rationale, verbatime from the trial literature: early-look
    "wins" on immature data are the most dangerous false alarms —
    OBF makes them almost impossible while preserving a legitimate
    late stop. Same logic applies to "regressions."
  - **Peeking ban** (Johari, Koomen, Pekelis & Walsh 2017, KDD —
    "always valid inference": uncontrolled peeking at accumulating
    A/B data inflates type-I error by factors of 2–5): mid-version
    partial-battery runs are exploratory only, never gate-eligible.

### 44.3 Futility and conditional power

Symmetric to early-stop efficacy is futility: a SHOULD probe that has
failed at the same bucket-triage classification for ≥3 consecutive
versions *with an anchor tier ≥ MULTI* enters conditional-power review
(computed vs its declared n). Conditional power <0.3 → the probe is
formally re-powered or demoted — a probe that can never pass under
any reachable parameter setting is dead weight that still costs FDR
budget (futility analysis per Lan, Simon & Halperin 1982).

### 44.4 What spending does NOT cover

Band-form probes (T-point) are verdicts about the model, not
hypothesis tests about a null; alpha spending applies to the
*regression* decision (pass→fail transitions), not to the band check
itself. A band miss remains a miss at every look — §3.2 stands.

## 45. Dependence-aware inference (VA-DEP)

### 45.1 The clustering problem

Cohort arms reuse members across items (§3.3: n=60 × 5 items = "270
observations"). Those items share member params — observations within
a member are correlated, so the effective n is the design-effect-
deflated count, not the raw count (Kish 1965 design effect:
n_eff = n / (1 + (m−1)·ICC), m items/member, ICC the intraclass
correlation). At ICC 0.2 and m=5, 300 raw observations ≈ 167
effective — silently halving a probe's real power.

### 45.2 Binding rules

- Every probe analyzer MUST report `icc_hat` (member-level variance
  share) alongside n_raw; reported CIs must use **n_eff**, via either
  (a) cluster-robust (CR2/sandwich) standard errors at member level,
  or (b) a member-level cluster bootstrap (resample members, never
  items). Item-level resampling is banned — it manufactures
  independence that doesn't exist.
- For T-diff probes on continuous observables, the canonical model is
  a **mixed-effects fit with member as random intercept** (Baayen,
  Davidson & Bates 2008, *J. Mem. Lang.* 59:390 — the psycholinguistics
  precedent for crossed random effects; we require random member
  intercepts, and random item intercepts when an item bank is used).
  Binary observables keep Wilson CIs computed on n_eff.
- Cohort-members-as-clusters is also the answer to §2.2's sizing
  tension: prefer **more members, fewer items** (ICC loss dominates
  item-count gains once ICC>0.05) — revised default n=100 members ×
  3 items for proportion probes when sim cost allows.

### 45.3 ICC as a validation output, not just a correction

`icc_hat` per probe is itself informative: a memory probe with near-
zero ICC suggests the trait layer is doing nothing on that observable
(no between-person variance = homogeneous characters — contradicts the
design brief's diversity mandate); ICC ≈1 suggests the observable is a
pure trait readout with no event-level stochasticity. Expected band
per probe is recorded in the registry; out-of-band ICC is a P354 flag.

## 46. Mutation testing of the battery (VA-MUT)

The battery has never been shown to catch a broken implementation.
Mutation testing closes that hole (Jia & Harman 2011, *IEEE TSE*
37:649–678 — three-decade survey: fault-seeded mutants are the
standard measure of test-suite adequacy; Andrews, Briand & Labiche
2005, ICSE — mutants predict real-fault detection, coupling
hypothesis validated).

### 46.1 Mutation operators (model-specific, not generic code muts)

Generic operators (negate condition, off-by-one) are fine for L0, but
the valuable mutants are **semantic lesions below the §26 lesion
granularity** — bugs a substrate implementer would actually write:

| mut class | example | expected killer probes |
|---|---|---|
| decay-shape | power→exp swap; β applied to semantic store | P1/E1, P231, P254 |
| cue-weight | drop the df-weighting in match score | P241, P9 |
| order-swap | retell transmits pre-drift record | P323 |
| scope leak | lesion/outcome applied record-wide not field-wide | P291, P293 |
| cache skip | beliefStatus recomputed without hysteresis | P326 |
| provenance | inferred→witnessed relabel on retell | P296, P163 |
| trait-wire | drop wmc→misinfo_suscept edge | P48-family, P99 |
| silent floor | clip negative affect instead of dampening | P160, P343 |
| rng aliasing | reuse member seed across items | P68/P69 + ICC collapse |

### 46.2 Protocol and acceptance

- Per release, inject ≥30 mutants sampled from the operator table
  (stratified so every home-doc family is hit ≥1× per 3 versions).
- **Mutation score ≥0.9 on MUST coverage**: each killed mutant must
  be killed by a probe in its predicted row — a mutant killed *only*
  by unrelated probes means the battery detects it but can't diagnose
  it (triage (a) vs (b) confusion, §30).
- **Equivalent-mutant discipline** (Jia & Harman; Grün, Schüler &
  Zeller 2009): a surviving mutant is either equivalent (prove it —
  argument that observable behavior is unchanged, logged) or
  **stubborn** — a live coverage hole that spawns a new probe or a
  lesion-table row. Unexamined survivors are banned.
- Mutants run on the confirmation seed split too — detection on
  calibration seeds only is Goodhart-shaped detection (§27).

## 47. Spec-coverage reverse audit (VA-COV)

P213 checks that every MUST probe is falsifiable; §24/P220 check that
every param is constrained. The remaining gap: **spec surface that no
probe touches at all** — fields, operators, and contract hooks that
are implemented but unobserved. Quarterly (every 4 versions) the
registry emits a coverage matrix:

- Rows: every §7 param, every record/event field, every §10 hook,
  every §6.x operator, every degradation-ladder mode.
- Columns: probe observables that read the row + lesion rows that
  perturb it.
- **Coverage classes:** `probed` (≥1 MUST/SHOULD probe + ≥1 lesion
  row), `observed` (≥1 OBSERVE probe or measured only via realized
  discrepancies), `blind` (no observable). Blind rows must carry a
  written rationale (e.g., internal bookkeeping) or spawn a probe.
- Fields used only as provenance/forensic markers (`phrasing` lineage,
  `latent`, `absorbed`) are `observed` by construction — they exist
  for the history browser, not for psychology.

## 48. Two-implementation goldens (VA-2IMP)

§3.4 goldens and the L0 closed-form checks currently presume the
implementation's own formulas. If the implementer misreads the spec,
the golden-generating code and the product code share the same
misreading — a **correlated-error failure** that no amount of
rerunning catches. Fix, adapted from N-version programming
(Avizienis & Chen 1977, FTCS-7 — diverse-implementations rationale;
we need only N=2):

- The **analyzer ships a reference implementation** of the spec's
  closed-form operators (decay, E-formula, match score, candidate
  weights, deriveParams) written *from the spec text by a different
  author/model than the substrate implementer* (rotating examiner,
  §27 item 5, applied to the validator itself).
- L0 goldens are generated by the reference implementation, hashed,
  and stored; the product implementation must reproduce them within
  MC error — not the reverse. A divergence is bucket (a) vs spec-
  ambiguity triage: either the code is wrong or the spec is
  underdetermined (both actionable; "the reference is wrong" is a
  valid third outcome that must be argued, not assumed).
- Determinism clause: the reference implementation uses the same
  `rand(seed, charId, worldDay, opSeq)` contract — determinism is a
  spec property, so both sides are bit-comparable.

## 49. The measurement model — latent strength to observed recall (VA-MM)

Every T-point probe silently assumes a mapping from the model's
latent `strength`/drive state to an observed hit/miss. That mapping
is an **instrument**, and instruments need their own validation —
this is the item-response-theory framing (Rasch 1960; Lord 1980):

- Define the probe-side response function R_obs = g(drive, cue,
  params). The §10 `recall` contract already realizes one g; the
  validator's job is to show g is (a) monotone in drive (an item-
  characteristic-curve audit), (b) **DIF-free** across cohorts —
  differential item functioning (Holland & Wainer 1993): at equal
  drive, a child cohort and elder cohort must emit the same hit
  probability, else every cross-cohort T-diff confounds trait with
  instrument (§29 strong-invariance, operationalized).
- g's free parts (e.g., how confidence maps to report language) are
  declared instrument constants — tunable to match response-scale
  conventions but **never** to move a probe toward its band (that's
  tuning the thermometer, §27 violation).
- P355 audits g directly; §29's invariance declarations now cite
  the DIF result as evidence.

## 50. Probe reliability budget (VA-REL)

A probe whose statistic is irreproducible across seed ensembles can't
constrain anything. Classical test theory applied to instruments:

- For every probe, run the full statistic on ≥5 disjoint seed
  ensembles; report the between-ensemble ICC of the probe *statistic*
  (not the raw observations). Reliability classes:
  `r≥0.9` excellent (point estimates usable), `0.75–0.9` standard,
  `0.5–0.75` noisy (must report CI of statistic, bands widened by
  the reliability attenuation — Spearman 1904 correction for
  attenuation: observed effect ≤ true effect × √reliability),
  `<0.5` unreliable (probe redesigned or demoted).
- The flaky-probe rerun protocol (P331) is subsumed: a probe that
  flips verdict across ensembles isn't flaky, it's underpowered —
  §44.3 conditional-power review applies.
- Reliability is reported per probe per release in the registry
  artifact; drift in a probe's reliability (without spec change) is
  itself a finding — usually means harness nondeterminism leaked in
  (P68/69 precondition violation).

## 51. Synthetic-world end-to-end benchmarks (VA-E2E)

All L1–L2 probes are micro-studies. Missing: does the assembled
model, embedded in the social substrate, produce a *recoverable
history*? Benchmark worlds with planted ground truth:

- **W-rumor:** plant one false claim at hop 0 through a scripted
  5-teller chain; 30 sim-days later, score the history-browser
  reconstruction: beliefStatus census must show the claim's
  fingerprint (planted content present, provenance chain intact,
  distortion present but bounded — E7 shape at world scale).
- **W-secret:** one `confidential` record in one character; 60 days
  of ambient simulation; audit: leak count, who-surfaced-it,
  whether the leaker's report preserves or drops the flag (P188 at
  scale).
- **W-cohort:** 8 mains + 12 ambients, 90 days (the §6.4 run
  promoted to a scored benchmark): the season-field assertions plus
  a **forensic quiz** — 20 questions about the season that a correct
  belief-vs-fact ledger answers exactly ("who currently believes X
  happened", "who saw it"), scored against ground truth. ≥90%
  required; errors classified: storage-loss vs propagation-loss vs
  ledger-vs-belief desync.

## 52. Adversarial schedule (VA-ADV)

Quarterly red-team pass — inputs chosen to break assumptions, not to
represent life:

- **Clock boundaries:** event + tick within the same opSeq;
  snapshot mid-conversation; worldDay rollover mid-session;
  leap/empty days; a day containing zero ticks and a day containing
  10 (order violations are P68 material — adversarial versions of
  them, not new probes).
- **Trait extremes:** full-corner trait cubes (all axes ±2σ);
  contradicting pins (high wmc + low wmc pin attempt — must clamp+log,
  not crash); HSAM-tail + ambient-mode promotion mid-run.
- **Compound lesions:** two simultaneous §26 lesions — interactions
  the single-lesion table can't see; required invariant: no compound
  lesion may *improve* any MUST probe's statistic (a lesion that helps
  is a bug in the mechanism or the probe).
- **Starvation:** enc_quota=0 week, then normal week — recovery must
  be clean; a store that never re-warms is a state-leak bug.
- **Crash vs silent wrongness:** every adversarial outcome classified
  crash/halt (acceptable, log + degrade) vs silent-wrong (never
  acceptable — NaN escape, beliefStatus desync, record mutation
  outside operators). Silent-wrong findings are release-blockers
  regardless of tier.

## 53. New probes P346–P357 (v35 suite)

- **P346 sequential-regression discipline (MUST — process):** every
  pass→fail regression claim on a MUST probe cites its OBF z-boundary
  at current information time; sub-boundary "regressions" may not
  trigger retunes. Audit = version-log check.
- **P347 cluster-aware CIs (MUST — meta):** ≥95% of multi-item probes
  report icc_hat + n_eff CIs; any probe whose n_eff falls below its
  §3.3 minimum is re-powered before its verdict counts.
- **P348 mutation score (MUST):** per-release mutation score ≥0.9
  on MUST coverage with predicted-row kills ≥80%; every survivor
  dispositioned equivalent-or-new-probe within one version.
- **P349 spec-coverage (SHOULD):** zero unexplained `blind` rows in
  the §47 matrix; blind→probed conversions logged.
- **P350 two-implementation divergence (MUST):** reference-vs-product
  L0 divergence rate ≈0; any divergence dispositioned in the version
  log as code-bug, spec-ambiguity, or reference-bug (third outcome
  must be argued, not defaulted).
- **P351 instrument monotonicity (MUST):** response function g
  monotone in drive on a titrated-drive ladder (≥7 points) for each
  observable family; any non-monotone cell is a §10 contract bug.
- **P352 DIF audit (MUST — sign-locked):** at matched drive, cross-
  cohort hit-probability gap ≤0.05 (Mantel-Haenszel DIF or logistic-
  regression DIF, Holland & Wainer 1993) for child/midlife/elder
  cohorts on ≥10 standardized items. FAIL = every affected cross-
  cohort probe suspended pending re-instrumentation.
- **P353 world benchmark (SHOULD):** W-rumor fingerprint present at
  day 30 (planted content + bounded distortion + provenance chain);
  forensic-quiz accuracy ≥90% on W-cohort.
- **P354 ICC health (SHOULD):** per-probe icc_hat inside its registry
  band; near-zero ICC on a trait-sensitive probe = diversity-
  mechanism failure, not a statistics footnote.
- **P355 g-invariance (MUST):** instrument constants show zero
  tuning-commit deltas correlated with probe-band misses (the
  thermometer rule, §49); audit = version-log check.
- **P356 compound-lesion monotonicity (MUST):** no §52 compound
  lesion improves any MUST probe statistic; improvement = mechanism
  or probe bug, dispositioned.
- **P357 silent-wrong census (MUST — release blocker):** adversarial
  pass produces zero silent-wrong outcomes; crash/degrade outcomes
  logged with the degradation ladder's mode name.

Registry now P1–P357; numbering stable.

## 54. Sources new to this version

Armitage, McPherson & Rowe 1969 (repeated significance testing —
the inflation theorem behind §44.1); O'Brien & Fleming 1979
(Biometrics 35:549–556 — OBF boundary shape); Pocock 1977
(Biometrika 64:191 — cited as rejected alternative); Lan & DeMets
1983 (Biometrika 70:659–663 — alpha-spending, flexible look times);
Lan, Simon & Halperin 1982 (conditional power / futility); Johari,
Koomen, Pekelis & Walsh 2017 (KDD — peeking inflation, always-valid
inference motivation); Kish 1965 (design effect, n_eff formula);
Baayen, Davidson & Bates 2008 (J. Mem. Lang. 59:390 — mixed-effects
for clustered psycholinguistic data); Jia & Harman 2011 (IEEE TSE
37:649–678 — mutation testing survey); Andrews, Briand & Labiche
2005 (ICSE — mutant→real-fault coupling); Grün, Schüler & Zeller
2009 (equivalent-mutant impact study); Avizienis & Chen 1977
(FTCS-7 — N-version diverse implementation); Rasch 1960; Lord 1980
(IRT); Holland & Wainer 1993 (DIF — Mantel-Haenszel tradition);
Spearman 1904 (correction for attenuation); Meredith 1993 (reuse —
§29 invariance now operationalized via DIF); Goodhart 1975 (reuse).

Established-vs-hypothesis tagging: alpha-spending/OBF, design effect,
cluster-robust/mixed inference, mutation testing, N-version
diversity, IRT/DIF, and attenuation correction are methodological
CONSENSUS. Applications flagged HYPOTHESIS: treating probe ICC as a
diversity health-metric (§45.3 — ours), world-benchmark forensic quiz
thresholds (§51 — ours), compound-lesion monotonicity as an
invariant (§52 — plausible, not literature-guaranteed).

## 55. New probes P358–P367 (v36 suite — encoding-mechanics III)

Full spec of each probe is in `encoding-mechanics.md` §41; registry
entries below carry tier, sign-lock, and guard role only. All bands
follow the §3 replication-discount protocol; cluster-aware CIs per §45.

- **P358 perceptual load (MUST):** perceptLoad 0.8 vs 0.2 at matched
  focal content → ≥30% fewer ambient records, thinner peripheral fields
  on survivors, central fields spared (TOST); low-load spillover
  direction required; residual primacy audit ≤0.03 rides this probe.
- **P359 load×lapse (SHOULD):** lapse incidence at high perceptLoad
  ≤60% of low-load incidence — absorbed scenes trade unexplained holes
  for filtered absences (Forster & Lavie sign-locked).
- **P360 capacity bound (MUST):** >wm_cap-element events write ≤ wm_cap
  full-strength fields; coherentUnit/DomainTable≥0.6 events exceed the
  nominal bound only via chunk-merge accounting (audit the merge math,
  not the count).
- **P361 attention residue (SHOULD):** interrupted-boundary dip >
  closedClean dip > pressured-complete dip (Leroy ordering); residue
  confined to residue_ticks.
- **P362 next-in-line (MUST):** floor_next tick → other-agent recall
  deficit NOT rescued by cued recall (encoding locus — Bond 1985);
  own-turn record exempt; deficit scales with turn complexity
  (Brenner slope).
- **P363 pending-intention ecology (MUST):** tonic drain measurable;
  goal-cue heating positive; completed/canceled intention records
  decay FASTER than never-fired matched (sign-locked — Marsh
  inhibition); reward-fold residual ≤0.02.
- **P364 offloading (MUST):** hollow-record signature — content recall
  down, extref recall ≥ content recall; offloadAttend TOST-equivalent
  to observed; extCue intentions miss more cue firings on reminder
  failure (dependency direction).
- **P365 threat capture (SHOULD):** threatCue advantage + same-tick
  neutral drain; drain scales with traitAnx, floor-preserved in
  nonanxious band (Bar-Haim moderation — bias attenuates, doesn't vanish).
- **P366 pre-sleep adjacency (SHOULD):** last-3h records outlive
  matched morning-encoded at equal objective delay (J&D direction);
  invariant under sleepFactor manipulation.
- **P367 context variability (SHOULD):** varied-context re-activated
  records retrievable across MORE cue contexts than same-context at
  matched strength — door-count, not strength.

Registry now P1–P367; numbering stable.

## 56. Sources new to this version

Lavie 1995/2005 (load theory); Cartwright-Finch & Lavie 2006 (Cognition
102:321 — verified: load-induced inattentional blindness); Forster &
Lavie 2009 (Cognition 111:345 — verified: load suppresses
mind-wandering); QJEP 2022 IB systematic review/metas (perceptual
account supported, cognitive-load account unclear — kept SHOULD-tier);
Murphy & Greene 2016 (Front. Psych. 7:1322 — verified: eyewitness load,
peripheral loss + suggestion susceptibility, cross-modal); Cowan 2001
(BBS 24 — verified: magical number 4); Leroy 2009 (OBHDP 109:168 —
verified: attention residue + moderators); Brenner 1973 (JVLVB 12:320 —
verified: scallop effect); Bond 1985 (JPSP 48:853 — verified: encoding
locus, instruction reversal); Goschke & Kuhl 1993 (JEP:LMC 19:1211 —
verified: intention superiority); Marsh, Hicks & Bink 1998 (JEP:LMC
24:350 — verified: completed < neutral); Marsh & Hicks 1998 (M&C
26:633 — verified: canceled intentions inhibited); Sparrow, Liu &
Wegner 2011 (Science 333:776 — verified); Henkel 2014 (Psych. Sci.
25:396 — verified: photo impairment + zoom exemption); Risko & Gilbert
2016 (TiCS 20:676 — verified); Öhman & Mineka 2001; Bar-Haim et al.
2007 (Psych. Bull. 133:1 — verified: 172 studies, d=.45, absent in
nonanxious); Cisler & Koster 2010 (Clin. Psych. Rev. — verified
components review); Jenkins & Dallenbach 1924 (Am. J. Psych. 35:605 —
verified); Gais, Lucas & Born 2006 (Learn. Mem. 13:259 — verified);
Glenberg 1979; Smith & Rothkopf 1984; Smith & Vela 2001 (PB&R meta —
verified). Deliberate-null citations in encoding-mechanics.md §39.

## 57. New probes P368–P377 (v37 suite — forgetting-curves IV)

Full spec of each probe is in `forgetting-curves.md` §20; registry
entries below carry tier, sign-lock, and guard role only. All bands
follow the §3 replication-discount protocol; cluster-aware CIs per §45.

- **P368 transition mints period (MUST):** registerTransition → new
  `period` id on subsequent records; first-post-transition n_sim = 0
  (measured); E exceeds matched non-transition by ~trans_bound_gain.
  Sign-locked PI-release leg.
- **P369 cross-period + valence gate (MUST):** same-strength records —
  within-period context out-recalls cross-period by ≥xperiod_pen
  margin; negative-valence records inside any bump window show NO β
  relief (Rubin & Berntsen sign-lock; the v0.3 OR-branch regression
  test).
- **P370 Ribot gradient (MUST):** strength loss graded monotone over
  2min/15min/60min/2h pre-trauma gaps (~50% at contact → ~0 at
  retro_window); pta_window encodes at ~40% reduced E, recovery after.
- **P371 rest S-coupling (SHOULD):** `rested` storageS advantage at 7d
  with zero intervening retrievals (Dewar Exp. 2 analog — R-side audit
  cannot explain); first-day n_sim = 0 under bucket-matched encodes;
  must not exceed the sleep-tick benefit.
- **P372 modality split (MUST):** olf verbatim field outlives verb
  field ≥1.5× at 30d within one record; olfactory-only cue resurrects
  an archived record a matched verbal cue cannot reach. Constrains
  k_olf / olf_cue_gain.
- **P373 intrusion decay (MUST):** non-trauma arousal-.7 record's
  surfacing rate halves by ~7d; trauma:true ≥50% of birth rate at 30d;
  each intrusion reboosts (persistence loop observable); ptsd modifier
  → no measurable decay.
- **P374 latency channel (SHOULD):** latency monotone ↓ in R, ↑ in
  n_sim; ≥lat_cap → §5.16 TOT surface (not silent null); latency must
  not feed back into θ/strength (structural audit).
- **P375 rehearsal tail (SHOULD):** 90 sim-days, retrievalCount
  distribution heavy-tailed (top-decile ≥40% of retells vs ≤20% at
  pa_gain=0); canonical-tail records correlate with §6.24 frozen
  stories. Re-fit pa_gain against P239 when the social engine lands.
- **P376 affect reconstruction (MUST):** 90d-old record's reported
  valence shifts ≥30% toward current appraisal, stored tag unchanged;
  1d-old reports ≈stored; reconciled → milder, estranged → hotter
  (sign-locked both directions).
- **P377 language cue (SHOULD):** non-encoding-language cue hits
  ~lang_mismatch less at equal overlap; bilingual_bal=1.0 attenuates
  cost → ~0 (never a bonus); monolingual = full v1.9 cost.

Registry now P1–P377; numbering stable.

## 58. Sources new to this version

Brown et al. 2012 (Memory Studies — TNT autobiographical periods);
Brown 2016 (transition theory monograph); Conway & Pleydell-Pearce
2000 (Psych. Rev. 107 — lifetime periods/self-memory system); Schrauf
& Rubin 1998 (JML 39:437 — verified: bilingual bump follows migration
age); Schrauf & Rubin 2001 (Appl. Cogn. Psych. 15 — verified:
immigration bump, effort-after-meaning + PI-release account); Rubin &
Berntsen 2003 (Psych. Aging 17:636 — verified: bump for positive
only, N=1,241); Berntsen & Rubin 2004 (M&C 32:427 — verified:
cultural life scripts, N=1,485); Zaragoza Scherman et al. 2015
(cross-cultural bump replication); Ribot 1882; Squire & Alvarez 1995
(graded RA review); Russell & Smith 1961 (PTA duration); Dewar et al.
2012 (Psych. Sci. 23:955 — verified: wakeful rest → 7-day benefit,
no retrieval); Carr, Jadhav & Frank 2011; Tambini, Ketz & Davachi 2010;
Engen & Ross 1973 (flat odor-recognition decay); Herz & Engen 1996;
Chu & Downes 2000 (odor best cue); Willander & Larsson 2007 (odor-cued
AMs older/more emotional); Cuddy & Duffin 2005 (music in dementia);
Holmes & Bourne 2008; Iyadurai et al. 2018 (Mol. Psychiatry — 6h
window cuts week-1 intrusions); Iyadurai et al. 2023 (Transl.
Psychiatry ICU RCT — week-4 median 1 vs 10); Iyadurai et al. 2024
preregistered meta (134 articles, g≈0.16); Anderson 1982 (retrieval
latency power law); Nelson & Narens 1980; Simon 1955 (preferential
attachment); Anderson & Schooler 1991 (reuse power tails); Levine &
Safer 2002; Levine, Lench & Safer 2009; Robinson & Clore 2002
(accessibility model of emotion report); Marian & Neisser 2000;
Rubin, Wetzler & Nebes 1986; Thomsen & Berntsen 2008.

## 59. New probes P378–P388 (v38 suite — retrieval-cues IV)

Full spec of each probe is in `retrieval-cues.md` §44; registry
entries below carry tier, sign-lock, and guard role only. All bands
follow the §3 replication-discount protocol; cluster-aware CIs per §45.

- **P378 cue ownership (MUST):** self-origin vs external cue at
  matched overlap/df → ≥1.5× recall; advantage ≥1.3× at ≥3-week
  gaps. Mäntylä 1986. Guard: P9 gate must hold simultaneously —
  unencoded cues contribute 0 regardless of origin tag.
- **P379 retrieval-DA asymmetry (MUST):** daLoad=1 at test →
  accuracy drop ≤15% of matched encoding-DA drop; latency +≥30%;
  ambient-scan rate unchanged; nonfocal PM fire-rate drops
  measurably more than accuracy (monitoring is the taxed leg).
  Craik et al. 1996; Rohrer & Pashler 2003.
- **P380 stress lag & valence (MUST):** θ penalty ≈0 inside
  stress_lag_min, present at lag, persists to stress_off_min;
  |valence|-high records penalized measurably more than neutral.
  Shields et al. 2017; Gagnon & Wagner 2016.
- **P381 mood repair (MUST):** sustained negative mood →
  high-repair_p second emission shifts positive vs first;
  ruminative/low-repair_p shows consecutive negatives (Josephson
  1996 ordering); successful repair recall lifts C.mood.
- **P382 forward testing (MUST):** matched encodes with vs without
  an interpolated retrieval bout → higher 24h R AND fewer
  PI-source swaps in the post-bout arm; re-exposure interpolation
  produces neither (Szpunar et al. 2008 Exp. 3 sign-lock).
- **P383 familiar-only emission (MUST):** failed bout with
  famScore ≥ fam_bar → `familiar_only` return (no content, conf
  ≤0.3); similar-but-new top match → `deja`, real unretrieved →
  `sourceless`; below bar → nothing. Cleary & Greene 2000;
  Cleary et al. 2012.
- **P384 in-group SSRIF (SHOULD):** listener suppression of own
  unspoken related records larger under in-group/credible than
  out-group speaker at matched listenerAttention. Coman & Hirst
  2015.
- **P385 PM action forgetting (MUST):** fired cue + failed action
  draw → `pm_vague`, measurably higher with age/daLoad; resolves
  on action-cue arrival inside pm_vague_win; P130's focal
  age-flatness must still hold (detection spared, content lost).
- **P386 doorway drop (SHOULD):** armed nonfocal intention
  fire-rate dips ≥15% inside post_boundary_win; shallow recent
  records take boundary_hit; focal-armed + self-origin cues
  exempt. Radvansky et al. 2011.
- **P387 interviewMode (MUST):** CI sequence ≥20% more correct
  fields than direct exhaustive questioning at accuracy rate
  within ±3%; older witnesses gain MORE (Memon et al. 2010).
  Guard: the interrogation arm must still show §5.13's trail-off.
- **P388 isolation at retrieval (SHOULD):** isolated record in a
  dense corpus recalls ≥1.5× a strength-matched non-isolated
  record and leads bout emissions disproportionately; zero effect
  on decay (survival equal at matched strength).

Registry now P1–P388; numbering stable.

## 60. Sources new to this version

Mäntylä 1986 (JEP:LMC 12:66 — verified: ~91% self-cue vs ~55%
other-cue, 500–600 items); Mäntylä & Nilsson 1983 (Scand J Psych
24) and 1988; Tullis & Finley 2018 (self-cue review); honored-vs-
dishonored cue follow-up (Mem&Cog 2022, OR≈3.8); Craik, Govoni,
Naveh-Benjamin & Anderson 1996 (JEP:G 125:159 — verified:
encoding-DA 26–33% drop vs minimal retrieval-DA); Naveh-Benjamin,
Craik, Guez & Dori 1998 (JEP:LMC 24); Naveh-Benjamin, Craik,
Gavrilescu & Anderson 2000 (M&C 28:965); Rohrer & Pashler 2003
(retrieval protected "with substantial resource"); Shields,
Sazma, McCullough & Yonelinas 2017 (Psych Bull 143:636 — 113
studies, retrieval-stress impairment, larger for valenced);
Gagnon & Wagner 2016 (NYAS — stress biases retrieval toward
reflexive modes); Schoofs et al. timing work (cortisol-peak lag);
Josephson, Singer & Salovey 1996 (Cog&Emotion 10:437 — verified:
repair shift in low-depression, consecutive negatives in high);
Rusting & DeHart 2000 (JPSP 78:737); Joormann & Siemer 2004 (J
Abnorm Psych 113:179 — dysphoric repair failure); Szpunar,
McDermott & Roediger 2008 (JEP:LMC 34:1392 — verified: testing
insulates subsequent learning from PI, retrieval-not-reexposure);
Pastötter & Bäuml 2014; Chan, Manley, Davis & Szpunar 2018
(Psych Bull — forward-testing meta); Cleary & Greene 2000
(JEP:LMC 26:1063 — recognition without identification); Cleary,
Ryals & Nomi 2009; Cleary, Brown, Sawyer et al. 2012 (Cog&Cognition
21 — configural familiarity → déjà vu in VR scenes); Brown 2003/
2004 (déjà vu base rate, age decline); Coman & Hirst 2015
(JEP:G 144:1066 — in-group gate on SSRIF, shared-identity
restoration); Radvansky, Krawietz & Tamplin 2011 (QJEP 64:1632 —
doorway forgetting); Einstein & McDaniel multiprocess framework
(PM retrospective component); Fisher & Geiselman 1992; Köhnken,
Milne, Memon & Bull 1999 (meta d=0.87/0.28, accuracy 85% vs 82%
— verified); Memon, Meissner & Fraser 2010 (PP&L 16:340 — older-
witness moderator); Hunt & McDaniel 1993 (distinctiveness
principle).

## 61. New probes P389–P398 (v39 suite — age-development IV)

- **P389 preverbal lock (MUST — structural):** record minted at
  verbal_age 0.3 retrieved at age 8 by odor cue returns sensory+
  affect fields with `verbal_void:true` and zero verbal content —
  despite full current vocabulary; retell emits the void.
- **P390 script default (MUST — sign):** 5-rep eventClass at age
  6, cueless recall → script-mode reconstruction, ≥25% of trials
  show a modal-filler intrusion; at 30 the latest occurrence
  returns. Fails on instance-first child ordering.
- **P391 sort window (MUST):** deviation inside first 4 reps at
  age 6 assimilates ≥35%; deviation at rep 6 mints with adult
  advantage. Sign-locked both arms.
- **P392 schema assimilation (MUST — sign):** schema-violating
  field at 6 drifts modal-ward or is lost ≥ adult rate; same
  violation at 25 keeps `isolated` advantage. Channels must
  diverge.
- **P393 forced pick (MUST — three sign-locks):** target-absent
  forced-mode false-pick 6 > 25; 75 ≥ 6-ish rate; free-mode at 6
  rejects; sequential widens the child–adult gap; showup worst.
- **P394 taint cascade (MUST — dose-response):** 3–4y, stereo-
  matched suggester, 4 weekly suggestive accounts → false-event
  report 40–56% free / 62–82% probe with `embellish` fields;
  neutral arm <12% (locked to Leichtman & Ceci 1995 ±10pp).
- **P395 maintain-not-taint (MUST):** same schedule, neutral
  accounts → record strengthens, subsequent suggestive adoption
  drops ≥15% vs no-interview arm.
- **P396 midlife shape (MUST):** 35→55 default sim → episodic
  decline <0.1 sd while semantic pool grows; `low_reserve`
  restores the steeper curve. Fails if midlife matches the old
  .84 knot.
- **P397 child dating (MUST — structural):** encodeAge-6 record:
  `orderBefore` near-adult; `dateEstimate` returns cyclic bucket
  (acc ~0.7) + absolute sigma ≥3× adult; no script/landmark pull.
- **P398 child stress inversion (MUST — sign):** arousal 0.9 at
  encodeAge 6 vs 25: child E higher, core misinfo adoption lower,
  peripherals still narrowed. Fails if directions match adults.

Registry now P1–P398; numbering stable.

## 62. Sources new to this version

Simcock & Hayne 2002 (Psych Sci 13:225 — verified: no child
verbally reported preverbal-vocabulary content at 6/12-mo test);
Nelson & Gruendel 1981 (GERs); Hudson & Nelson 1986 (general >
specific reports); Fivush, Hudson & Nelson 1984; Nelson 1986
(ACP review — deviations advantaged once script exists);
Brubacher, Roberts & Powell 2011; Baker-Ward et al. 2020
(invariant > variable recall; script intrusions as modal error);
Liben & Signorella 1980 (Child Dev 51:11 — verified); Signorella
& Liben 1984 (Child Dev 55:393 — nontraditional→traditional
reconstructions, difficulty-graded); Pozzulo & Lindsay 1998
(LHB 22:549 — verified: >5y adult-level hits, all ages fail
target-absent rejection incl. adolescents, sequential widens
gap, training null); Fitzgerald & Price 2015 (Psych Bull
141:1228 — verified: 91 studies/20,244; child and older-adult
discriminability deficits); Lindsay et al. 1997 (LHB 21:391 —
showup worst); Leichtman & Ceci 1995 (Dev Psych 31:568 —
verified: 46% free-narrative / 72% probe false misdeed reports
in 3–4y stereotype+suggestion arm; ~10%/5%/0% control arm);
Goodman, Bottoms, Schwartz-Kenney & Rudy 1991 (J Narr Life Hist
1:69 — verified: multiple neutral interviews maintain memory +
reduce suggestibility; support helps); Goodman, Hirschman,
Hepps & Rudy 1991 (Merrill-Palmer Q 37:109 — verified: free
recall age-invariant 3–7y; extreme distress beneficial for free
recall + suggestion resistance); Goodman, Quas, Batterman-Faunce,
Riddlesberger & Kuhn 1994 (VCAT catheterization — age diffs
3–4y vs older, understanding/support predict accuracy); Schaie
1996/2005/2013 SLS summaries (verified: no reliable avg
decrement <60 in early cycles, small 50s decrement some
abilities/cohorts, <0.2 sd pre-60, <50% individuals declining
at 81; verbal/number peak late-midlife, perceptual speed linear
from young adulthood); Friedman 1991 (Child Dev 62:139 —
verified: 4y recency+time-of-day OK, day/week/month/season 6–8);
Friedman & Kemp 1998 (Cog Dev 13:335 — recency discrimination
early, location interpretation >9); Friedman 2003 (review).

## 63. New probes P399–P408 (v40 suite — age-decline V)

- **P399 implicit spared (MUST — ratio):** matched encode; 30d
  later explicit recall collapses 30→85 as usual while `impl_str`
  effects (emission ordering, re-exp savings) decline ≤0.35× the
  explicit drop. Fails if impl_str ages at β_episodic rate.
- **P400 thin futures (MUST):** `imagineEvent` at 78 emits ≤0.7×
  the verbatim-field count of the 25yo simulation; `recast_p`
  share of old simulations traces to single source records;
  imagination inflation correspondingly reduced (emergent check).
- **P401 commission errors (MUST — crossover):** completed
  intention, cue re-presented inside `deact_window`: 78yo
  commission rate ≥3× the 25yo's AND rises with prior `fires` for
  old but not young (Scullin 4-target sign-lock); resisted
  commissions reduce subsequent rate (practice arm).
- **P402 spacing null (MUST — explicit null):** massed vs spaced
  retell schedules produce identical spacing-benefit ratios at 30
  and 80 (within 15%) despite lower old absolute retention.
- **P403 own-age bias (MUST — criterion null):** same-ageBand
  targets show higher hit AND lower FA (d′ gain, not bias shift);
  criterion measure unchanged — fails if implemented as θ shift.
- **P404 update resistance (SHOULD):** corrected field at 78
  re-emits the superseded value ≥25% of the time at
  supplantDay+30; resurrected old values carry above-median
  confidence.
- **P405 fluency fame (SHOULD):** repeated sourceless exposure →
  75yo emits `attribution:"known_around"` at ≥4× the 25yo rate;
  never on first exposure (famScore gate intact).
- **P406 semantic split (SHOULD):** 80yo's open-ended semantic
  listing is slower/fewer while direct fact lookup stays at young
  level — access taxed, store intact.
- **P407 same-day blur (SHOULD):** two same-day same-place events:
  cross-contamination rate rises 30→85 via the denser context pool
  (`ctx_flux_mult` mechanism); different-day pairs unchanged.
- **P408 offload paradox (SHOULD):** 75yo chooses `offload:true`
  more often than 25yo yet still below her own optimal rate
  (`offload_bias` <1); offloaded items skew high-importance
  (`offload_select`).

Registry now P1–P408; numbering stable.

## 64. Sources new to this version

La Voie & Light 1994 (Psychol Aging 9:539 — verified meta, 39
effect sizes, weighted age-difference d≈0.30, smaller than the
same experiments' recognition/recall effects); Ward, Berry, Kassel
et al. 2020 (Psych Sci lifespan, contamination-controlled —
implicit decline real but small, DEBATED vs spared-null);
Fleischman & Gabrieli 1998 (implicit-in-aging review); Addis, Wong
& Schacter 2008 (Psych Sci 19:33 — verified: older adults fewer
internal details past AND future; detail counts correlate with
relational memory); Addis, Musicaro, Pan & Schacter 2010 (Psychol
Aging 25:369 — recombination task, deficit survives recast
blocking); Addis, Roberts & Schacter 2011 (detail cues rescue);
Scullin, Bugg, McDaniel & Einstein 2011 (Mem Cogn 39:1232 —
preserved spontaneous retrieval, impaired deactivation); Scullin,
Bugg & McDaniel 2012 (Psychol Aging 27:46 — verified ~25%
commission errors, old > young, 4-target > 0-target in old);
Walser, Plessow, Goschke & Fischer 2015 (forgetting practice floors
commission errors both ages); Balota, Duchek & Paullin 1989
(Psychol Aging 4:3 — spacing/lag preserved; model fit: less
context encoded, slower contextual fluctuation); Bercovitz et al.
2017 + Eur J Ageing 2023 (spacing intact at 10-day lags);
Tsai, Scarampi, Kliegel & Gilbert 2023 (Psychol Aging — verified:
elders use MORE reminders, reduced pro-reminder bias vs optimum);
Scarampi et al. 2023 + Exp2 subjective-value arm (PMC10524137 —
elders offload the important items); Rhodes & Anastasi 2012
(Psych Bull 138:146 — verified: hits g=+0.23, FA g=−0.23, d′
g=+0.37, criterion g=−0.01); Hartman & Hasher 1991 (Psychol Aging
6:42 — superseded endings re-emerge); May, Zacks, Hasher &
Multhaup 1999 (garden-path persistence); Bartlett, Strater &
Fulton 1991 (Mem Cogn 19:348 — false fame/recency elevated in
old); Dywan & Jacoby 1990 (fluency misattribution); Tombaugh,
Kozak & Rees 1999 (fluency norms — access declines, vocabulary
holds); Salthouse 1996 (processing speed).

## 65. New probes P409–P420 (v41 suite — emotional-memory IV)

- **P409 excitation transfer (MUST — sign + window):** arousal-0.8
  event then ambiguous (|v|<0.3) event at Δt ∈ {5, 25, 90} min:
  second tag elevated at 5 and 25 min, gone at 90 (~4.5×carry_tau);
  `attrib_rescue` cue halves it. Fails if carryover is
  event-boundary-clean or valence rotates on a clearly-valenced
  next event.
- **P410 status inversion (MUST):** same speaker+record retold to
  peer vs higher-status audience: peer drifts at `audience_tune`,
  superior arm ≤0.4× despite identical slant (Echterhoff 2017).
- **P411 catharsis null (MUST — explicit null):** anger record;
  3 `vent:true` retells vs 3 silence days → arousal_tag under
  venting ≥ silence, `verbal_damp` never fires on vent flags.
  Any "venting relieved it" path fails.
- **P412 savor/dampen split (MUST):** matched positive record:
  high-`savor` elevates after 2 retells + fades slower at 30d;
  high-`dampen` fades ≥1.3× faster. Same record, diverging tags.
- **P413 duration dilation (MUST — valence-blind):** arousal-0.8
  events at valence ±0.6: `verbatim.duration` ~1.3× BOTH arms;
  tag untouched by duration (peak-end intact).
- **P414 secure base (MUST):** identical threat event solo vs
  co-present trusted partner: tag ~0.75–0.8× solo, verbatim/E
  identical; low-relQuality partner ≈ stranger ≈ ×0.95; no fear
  CondEntry mints on the trusted person.
- **P415 subjective distance (MUST — motivational sign):** two
  personal records, same true_age, valence ±0.5, high self_est:
  negative reports ~1.15× farther `subjDist`; `reported_age`/decay
  unchanged; acquaintance-topic records: no effect.
- **P416 distinctiveness habituation (SHOULD — emergent):**
  emo_rate forced 0.1 vs 0.5: identical arousal-0.7 event →
  quiet-life higher immediate E; gap shrinks at 30d (Talmi
  crossover — w_emo_dist fades fast, w_emo_arous persists).
- **P417 sex-gain bounds (SHOULD):** profiles differing only in
  `sex`: female advantage present but < ±1σ neurot swing — bounds
  check, not magnitude target.
- **P418 granularity gate (MUST):** emo_gran 0.9 vs 0.2: high
  mints discrete `emotion` + full reappraisal; low mints `"mixed"`
  ≥60%, ≤0.75× reappraisal damping, ≥1.25× §28/§6.11 rewrite
  acceptance.
- **P419 impact bias (SHOULD — immune-neglect lock):**
  `imagineEvent` on dreaded confrontation: forecast fields
  overshoot the eventual encoded tag by the bias factors EVEN for
  a high-coherence/high-gran character — repair capacity must not
  shrink the forecast.
- **P420 music era-cue (SHOULD):** bump-era vs post-bump song sole
  cue: era match ≥1.5× hits, `nostalgic:true` permitted;
  mismatched-era familiar song still beats a neutral-sound cue.

Registry now P1–P420; numbering stable.

## 66. Sources new to this version

Zillmann 1971 / Zillmann, Katcher & Milavsky 1972 / Zillmann &
Bryant 1974 (excitation transfer — sympathetic residue timescale,
transfer to unrelated subsequent response); Cantor, Zillmann &
Bryant 1975 (residue intensifies either sign); Schachter & Singer
1962 (epinephrine misinformed vs informed — attribution rescue);
Dutton & Aron 1974 (JPSP 30:510 — verified: Capilano bridge,
sexual imagery + callback rates, shock-anticipation replication)
with Szczucka 2012 (Curr Issues Pers Psych — verified reanalysis:
misattribution interpretation contested, DEBATED flag on
misattr_rot_k); Echterhoff, Higgins & Groll 2005 (JPSP 89:257 —
verified: shared-reality mediation, in-group gate, epistemic trust
mediator, 2-week persistence); Echterhoff, Higgins, Kopietz &
Groll 2008 (JEP:G 137:3 — goal dependence: no bias under
politeness/incentive/compliance); Echterhoff et al. 2017
(audience-status arm — equal-status produces memory bias,
higher-status doesn't); Higgins & Rholes 1978 (saying-is-believing);
Bushman, Baumeister & Stack 1999 (JPSP 76:367 — catharsis belief
licenses aggression); Bushman 2002 (PSPB 28:724 — verified:
rumination+venting angrier AND more aggressive than distraction
and control; doing nothing beats venting); Rusting &
Nolen-Hoeksema 1998 (rumination sustains anger); Bryant & Veroff
2007 (savoring); Feldman, Joormann & Johnson 2008 (Cogn Ther Res
32:507 — dampening predicts depression over and above rumination);
Coan, Schaefer & Davidson 2006 (Psych Sci 17:1032 — verified:
n=16, spousal hand-hold pervasive attenuation, stranger limited,
marital-quality moderation); Beckes & Coan 2011 (social baseline);
Droit-Volet & Meck 2007 + Droit-Volet & Gil 2009 (arousal dilates
judged duration, valence-blind, child replication); Ornstein 1969
(storage-size retrospective duration); Ross & Wilson 2002 (JPSP
82:792 — verified: 3 studies, unfavorable pasts feel farther,
stronger at high self-esteem, personal-only); Wilson & Ross 2003;
Schmidt 1991 + Schmidt & Saari 2007 (Mem Cogn 35:1905 — verified:
attention/elaboration/distinctiveness three routes); Talmi, Luk,
McGarry & Moscovitch 2007 (JML 56:555 — verified: pure-list
elimination of immediate advantage, DEBATED vs consolidation);
Canli, Desmond, Zhao & Gabrieli 2002 (PNAS 99:10789 — verified:
female advantage at equal rated arousal, left-amygdala
lateralization); Cahill et al. 2001 + Cahill 2003 (lateralization);
Andreano & Cahill 2009 (Neurosci Biobehav Rev — hormonal
modulation, modest size); Barrett 2004 + Lindquist & Barrett 2008
(emotional granularity); Kashdan, Barrett & McKnight 2015
(granularity → regulation chain); Gilbert et al. 1998 (immune
neglect); Wilson & Gilbert 2003 (impact bias review); Wilson et
al. 2000 (focalism); Janata, Tomic & Rakowski 2007 (Memory 15:845
— verified: ~30% of songs evoke AMs, nostalgia third most common);
Krumhansl 2017 (music bump); El Haj, Fasotti & Allain 2012 (MEAM
vividness); PLOS One 2025 acoustic-feature replication (low-energy
songs → slower/vivid/unique AMs).

## 67. New probes P421–P432 (v42 suite — false-memory IV, instrumented channels)

- **P421 flashbulb decoupling (MUST — sign-locked):** flashbulb:true
  records' field consistency decays at everyday-record rates while
  emitted confidence stays ≥ fb_conf_floor throughout; drifted
  consistency plateaus by ~fb_plateau (1000d) (Neisser & Harsch 1992;
  Talarico & Rubin 2003; Hirst et al. 2015). FAIL if confidence ever
  tracks accuracy on a flashbulb record, or if drift is slower than
  matched everyday records.
- **P422 verb pull (MUST):** identical events probed with
  wording_intensity −1 vs +1 → emitted quantitative estimates differ
  in the wording's direction (~±verb_pull·schemaRange); presupposed
  details ("the X") surface on previously empty/weak fields at
  ~lp_detail_p after delay (Loftus & Palmer 1974 Exp 2 direction:
  wording plants content that outlives the question).
- **P423 feedback asymmetry + content-null (MUST — sign-locked):**
  confirm → conf up AND encoding-condition candidates inflate
  (retro_inflate); disconfirm → conf down MORE than confirm raised it
  (fb_disconf > fb_conf_gain ordering); hidden accuracy and field
  candidates' values untouched in both arms. FAIL if feedback moves
  field CONTENT.
- **P424 expectancy loop (SHOULD):** answerProbe(expect:v) +
  auto-confirm produces v-congruent reports at higher rate AND higher
  confidence than matched neutral probes; the effect exceeds the
  expect_cand leak alone (the loop, not just the leak — Kassin et al.
  2003 chain).
- **P425 memory blindness (MUST — rate band + ordering):** swapReport
  detected ≤45% on fresh, ~65–70% undetected overall (Cochran et al.
  2016 "majority"); undetected arms shift later reports toward the
  alteration at HIGHER rate than matched other-sourced misinfo
  (self_cred > sourceCredibility ordering — self-authored beats
  hearsay); detected arms tag incongruent:true and do NOT adopt.
- **P426 listener SSIF (MUST — sign-locked):** after a partial
  account, the listener's unmentioned F-related candidates are weaker
  than no-account controls at ≥1 day delay; mentioned-field
  candidates are stronger — same account produces both signs
  (Cuc, Koppel & Hirst 2007); suppression persists ≥7d (Coman et al.
  2009 direction).
- **P427 omission (MUST — mechanism discriminator):** omission:true
  accounts reduce later EMISSION of the addressed record's core
  fields while discriminate-mode retrieval still recovers them —
  report-side suppression only (Oeberst & Blank 2012 undoing debate;
  our resolution is report-side). FAIL if candidates weaken or die.
- **P428 imagined actions (SHOULD):** selfAction:true imagineEvent
  loops flip to witnessed ~1.5× the matched scene-imagination rate
  (Goff & Roediger 1998); flipped candidates carry elevated verbatim
  richness (im_act_rich); bizarre-but-plausible-gated actions still
  flip (Thomas & Loftus 2002 — im_act_gain does not shrink at
  moderate implausibility; plaus_min gate still holds below it).
- **P429 discriminate mode (MUST):** mode:"discriminate" emits
  candidate lists with provenance estimates per field; emitted false
  content ~discrim_recover (0.5) below sample-mode; contested-field
  confidence lower; latency ≥1.4×; the surviving ORIGINAL candidate
  must appear in the list post-adoption (P163's instrument —
  Lindsay & Johnson 1989).
- **P430 mood-congruent lures (MUST — sign-locked):** depressive-trait
  profile phantomizes/migrates negative-valence schema details
  preferentially at MATCHED total phantom rate vs neutral profile;
  positivity-shifted elder profile the positive details
  (Joormann, Teachman & Gotlib 2009 — selection, not volume). FAIL on
  volume difference alone.
- **P431 blind-first logging (OBSERVE):** contested identifications'
  logs carry pre-feedback confidence — contract/logging check.
- **P432 collective phantoms (OBSERVE):** 8 mains + shared
  schema-rich event → correlated phantom details above independence
  baseline over 30d; guard: no dedicated collective operator may
  exist — emergence only.

Registry: P1–P432. v42 suite: P421–P432 (7 MUST, 3 SHOULD, 2
OBSERVE).

## 68. Sources new to this version

Neisser & Harsch 1992 (in Affect & Accuracy in Recall — Challenger
3-yr: consistency ~2.95/7, confidence ~4.2/5); Talarico & Rubin
2003 (Psych Sci — 9/11 flashbulb vs everyday: identical consistency
decay, divergent confidence); Hirst et al. 2015 (Psych Sci — 10-yr
9/11 follow-up: early collapse then plateau); Loftus & Palmer 1974
(J Verb Learn Verb Behav — smashed 40.8 vs hit 34.0 mph; broken
glass 32% vs 14%); Loftus & Zanni 1975 ("the" vs "a" presupposition);
Wells & Bradfield 1998 (JAP 83:360 — feedback inflates view/
attention/certainty retrospectives); Douglass & Steblay 2006 (Appl
Cogn Psych 20:859 — meta, 20 tests, N>2400, large effects);
Steblay, Wells & Douglass 2014 (PPPL 20:1 — N≈7000 re-meta);
Kassin, Goldstein & Savitsky 2003 (Psych Sci — expectancy →
pressure → guiltier-looking innocents); Kassin, Dror & Kukucka 2013
(J Forensic Sci — forensic confirmation chain); Cochran, Greenspan,
Bogart & Loftus 2016 (Mem Cogn — verified: majority fail to detect
altered own-reports, memory shifts toward alteration); Sauerland-
line sticker study 2017 (PLoS ONE — self-delivered misinformation,
majority choice-blind); Cuc, Koppel & Hirst 2007 (Psych Sci —
listener SSIF); Stone, Coman, Brown, Koppel & Hirst 2012 (review);
Coman, Manier & Hirst 2009 (Psych Sci — SSIF persists ≥30d); Oeberst
& Blank 2012 (Memory Studies — undoing debate: misinformation also
removes true reports; mechanism contested); Goff & Roediger 1998
(imagined actions → false performance claims, repetition-graded);
Thomas & Loftus 2002 (bizarre imagined actions inflate); Lindsay &
Johnson 1989 (source-discrimination test dissolves misinformation);
McCloskey & Zaragoza 1985 (modified test — coexistence instrument);
Joormann, Teachman & Gotlib 2009 (J Abnorm Psych — depression:
negative-lure false recall up, positive down); Howe & Malone 2011
(Cognition — mood-congruent DRM under induced mood); Engelkamp
(enactment gradient: performed > imagined > heard).

## 69. New probes P433–P444 (v43 suite — individual-differences IV,
## clinical phenotypes + everyday pharmacopeia)

- **P433 OGM valence split (MUST — sign-locked):** matched
  depr=+0.8 vs ptsd=+0.8 profiles: depr's specificity deficit
  concentrates on positive-cued recalls, ptsd's generic responding
  on negative-cued; depr neutral-material hit-rate within jitter of
  baseline (Ono, Devilly & Shum 2016; Williams et al. 2007). FAIL
  if the phenotypes share a signature or if depr lowers hit-rate.
- **P434 sensory-gated intrusion (MUST — sign-locked):**
  ptsd=+0.8 threat records intrude on sensory-cue matches
  (w_sensory-driven cueMatch) at ≥1.5× baseline; the same records
  under topic/people cues at baseline; non-threat records
  unaffected at any cue type (Ehlers & Clark 2000 gate).
- **P435 avoidance content-gate (MUST — sign-locked):**
  attach_avoid=+1.5 → thinner vivid_detail on attach:true records
  of BOTH valences and theta surcharge on the negative ones, while
  off-tag records stay within jitter — a global deficit fails the
  gate (Edelstein 2006 WM finding).
- **P436 depletion release (MUST — sign-locked):** same avoidant
  profile under context.depleted: suppressed negative attach
  records become MORE accessible (theta surcharge falls by
  depl_release·avoid, intrusion drive rises); non-avoidant profiles
  show no release (Kohn, Rholes & Schmeichel 2012). FAIL if
  depletion never unburies, or unburies for everyone.
- **P437 observer transform (SHOULD):** observer-flagged
  reconstructions report arousal ~persp_affect_loss lower and drop
  ~half of sensory fields vs field-mode emissions of the same
  record; stored fields unchanged; P(observer) rises with record
  age and selfDiscrepant:true (Nigro & Neisser 1983; Libby &
  Eibach 2002).
- **P438 dysphoric positive-observer (SHOULD — sign-locked):**
  depr profiles emit persp:"observer" preferentially on POSITIVE
  records (Nelis et al. 2012 — opposite of the naive
  distance-from-pain prediction, which belongs to attach_avoid's
  negative-record surcharge instead).
- **P439 suppression tax + reappraisal null (MUST — two halves):**
  suppressing:true during a social scene → people/conversation E
  reduced ~supp_enc_cost, non-social fields intact; a
  reappraising context arm shows NO encoding difference — FAIL if
  reappraisal costs anything (Richards & Gross 2000 structure).
- **P440 mindfulness double sign (MUST — both signs at once):**
  mindful +1.5 vs −1.5: higher positive-cued specificity AND higher
  lure_accept/source-flip rates — FAIL if only one sign appears
  (Wilson et al. 2015 counterintuitive half; Heeren et al. 2009
  specificity half). A "memory virtue" phenotype is a modeling
  error.
- **P441 caffeine discrimination-only (MUST — sign-locked):**
  caff>0 in consol_window → next-day lure-discrimination improved
  on the window's records; hit-rate and d′ unchanged (Borota 2014
  null half); encoding-time caffeine helps only low-arousal
  encodes (Smith 2002 arousal gate).
- **P442 smoker blind spot (MUST):** smoker profiles lose ~10%
  objective pm_self with complaint_k unchanged (Heffernan 2010);
  nic_dep deepens it; dosing restores toward baseline, never
  above (Jansari — FAIL on any above-baseline nicotine gain).
- **P443 pspeed latency-only (SHOULD):** pspeed ±2σ profiles
  differ ~15% on searchCost/latency_ms while matched-strength
  hit-rate stays within jitter — speed moves the clock, not the
  hit (Salthouse 1996).
- **P444 scc self-scope (SHOULD):** low-scc profiles show stronger
  §6.17 consistency pull and higher feedback adoption on
  self-evaluative records, identical behavior on non-self records
  — scope-locked (Campbell 1996 construct).

Registry: P1–P444. v43 suite: P433–P444 (8 MUST, 4 SHOULD).

## 70. Sources new to this version

Williams et al. 2007 (Psych Bull — CaR-FA-X OGM model); Ono,
Devilly & Shum 2016 (Psych Trauma meta — depression large OGM
effect driven by positive-cue specificity loss; trauma medium,
negative-cue general responses; PTSD amplified); Moore & Zoellner
2007 (Psych Bull 133:419 — trauma exposure alone ≠ OGM,
psychopathology carries it); Schönfeld & Ehlers 2007 (Memory —
suppression instruction → fewer/general memories in PTSD);
Ehlers & Clark 2000 (Behav Res Ther — data-driven processing,
sensory-triggered intrusions); Brittlebank et al. 1993 (OGM as
trait marker); Lloyd & Lishman 1975 (mood-congruent retrieval
latency); Jonker et al. 2000 (complaint/accuracy decoupling);
Edelstein 2006 (Emotion 6:340 — avoidant WM deficit for
attachment-related stimuli, both valences, content-gated);
Edelstein et al. 2005 (PSPB — avoidance × CSA severity memory);
Mikulincer & Orbach 1995 (JPSP 68:917 — avoidant low negative-
memory accessibility, anxious easy access + emotional spreading);
Fraley, Garner & Shaver 2000; Kohn, Rholes & Schmeichel 2012
(JESP 48 — depletion releases avoidant suppression);
Nigro & Neisser 1983 (Cog Psych 15:467 — field/observer);
Robinson & Swanson 1993 (Memory 1 — perspective shifts, affect
drop); Libby & Eibach 2002 (JPSP 82:167 — self-discrepant →
observer); Kuyken & Moulds 2009 (Memory 17:624 — observer links
depression, low mindfulness, avoidance); Nelis et al. 2012
(Memory — dysphoric observer shift for positive memories);
Richards & Gross 2000 (JPSP 79:410 — suppression memory cost,
reappraisal null); Richards, Butler & Gross 2003 (suppression
social cost); Gross & John 2003 (ERQ); Salthouse 1996 (Psych Rev
— speed mediation); Hagger et al. 2016 (depletion replication,
DEBATED); Erickson et al. 2011 (PNAS 108:3017 — 2% hippocampal
volume, ~1–2y reversal; fitness cross-ref, v1.9); Wilson, Mickes,
Stolarz-Fantino, Evrard & Fantino 2015 (Psych Sci — mindfulness
39% vs 20% DRM false recall, RM accuracy down); Williams,
Teasdale, Segal & Soulsby 2000 (J Abnorm Psych — MBCT reduces
OGM); Heeren, Van Broeck & Philippot 2009 (BRT 47:403 —
specificity up, flexibility mediation); Rosenstreich & Margalit
2015 (5-week practice: true recognition AND provoked false up);
Campbell et al. 1996 (SCC scale); Borota et al. 2014 (Nat
Neurosci 17:201 — post-encoding caffeine → 24h lure
discrimination, inverted-U, hit/d′ null); Smith 2002 (caffeine
alertness-mediated review); Jansari et al. (JEF — nicotine gum
restores deprived smokers' PM, no never-smoker benefit);
Heffernan, O'Neill & Moss 2010/2011 (Drug Alcohol Depend —
objective PM deficits in smokers, self-report unchanged).

## 71. New probes P445–P456 (v44 suite — social-memory IV, social-memory.md §63)

- **P445 STT double write (MUST — sign-locked):** a character who
  retells N moral-negative items about targets shows own-`eval` and
  own-trait drift toward the described traits at ≥stt_gain rate;
  a matched praise-teller drifts positive. FAIL if speakers are
  unaffected by their own content.
- **P446 reunion split (MUST — Bahrick sign-locked):** at
  exposure ≥ fam_permastore_exp and 15-y simulated delay,
  recognition-mode cascade pass ≥85% tier-1 and tier-3
  recognition ≥80%, while free-recall name production ≤60% of
  its early plateau. FAIL if recall and recognition decay
  together.
- **P447 balance warp (SHOULD):** unbalanced sentiment edges are
  recalled worse than balanced matched edges at equal delay;
  sign-flip errors concentrate on unbalanced triads; unit edges
  show no differential. FAIL if unit edges warp equally.
- **P448 own-share (SHOULD):** both members of coAgents dyads
  report mean own_share > 0.5 (dyad sums > 1.0); negative-outcome
  records reverse the sign. FAIL if shares sum to 1.0.
- **P449 single-voice consensus (MUST):** three hearings from ONE
  speaker produce consensusEst ≥ 0.6× the three-speaker value —
  and ≥2× the single-hearing value. FAIL if consensus requires
  distinct sources.
- **P450 retell confidence inflation (SHOULD):** conf rises
  monotonically with retellCount toward cap while measured field
  accuracy is flat-to-declining — the conf–accuracy divergence
  is the probe, not the conf alone.
- **P451 conformity split (MUST — two arms):** weak-own-field
  conflicts show stored-field change (informational); strong-own-
  field + high-status-speaker conflicts show public assent +
  `dissent_mark` with beliefStatus unchanged. FAIL if the two
  arms collapse to one outcome.
- **P452 gossip ecology (SHOULD):** moral-negative third-party
  content on cheaterLoad>0 targets is retold ≥1.4× matched
  neutral; content about targets the audience has no PersonModel
  for is suppressed ~half; rumor flow concentrates on
  friendship edges.
- **P453 sleeper (MUST — sign-locked):** a claim adopted then
  discredited shows suppressed inference while discredit_str is
  high, recovering toward baseline as the tag decays — content
  strength held constant. FAIL if discrediting is permanent OR
  never suppresses.
- **P454 PEP (SHOULD):** neurot-high profiles show covert
  rehearsal of social_eval-negative records above matched
  non-social negatives, with valence drift negative over pep_days;
  low-neurot profiles show neither.
- **P455 partner-eval pull (MUST — sign-locked):** after a
  scripted eval reversal on a high-familiarity partner,
  reconstructions of pre-reversal records shift valence toward
  the new eval; low-familiarity targets show no pull. FAIL on
  eval-neutral reconstruction.
- **P456 overhear channel (SHOULD):** overheard person-content
  encodes at ~0.5× addressed-tell strength with weak source
  binding (source_infer failures elevated), but above matched
  non-person overheard content; no shared_with write.

Registry: P1–P456. v44 suite: P445–P456 (6 MUST, 6 SHOULD).

## 72. Sources new to this version

Skowronski, Carlston, Mae & Crawford 1998 (JPSP 74:837 —
spontaneous trait transference, 4 experiments, associative basis);
Mae, Carlston & Skowronski 1999 (JPSP 77:233 — STT to familiar
communications); Crawford, Skowronski & Stiff 2006 (associative
vs attributional bases of STT/STI); Farley 2011 (negative
gossip costs teller power/liking); Bahrick, Bahrick & Wittlinger
1975 (JEP:G 104:54 — ~90% name/face recognition+matching at 15y,
free name recall −60% over 48y); Bruck & Cavanagh (Fortysomething
— 25th-reunion recognition); De Soto 1960 (J Abnorm Soc Psych
60:417 — schema-consistent social structures learn faster);
De Soto & Kuethe 1959 (symmetry attributed to likes/confides,
asymmetry+transitivity to influences); De Soto, Henley & London
1968 (JPSP 8:1 — unbalanced sentiment structures hard to learn,
unit relations exempt); Heider 1946; Cartwright & Harary 1956;
Brashears & Quintane 2015 (Social Networks — compression priors
in network recall); Ross & Sicoly 1979 (JPSP 37:322 — egocentric
availability/attribution, dyad sums >100%); Burger & Rodman 1983
(JPSP 45:1232 — delay flips other-credit to self-credit);
Campbell & Sedikides 1999 (Psych Bull 125:23 — self-serving
bias meta, threat amplification); Weaver, Garcia, Schwarz &
Miller 2007 (JPSP 92:821 — one repetitive voice ≈ chorus, 6
experiments); Shaw & McClure 1996 (repeated postevent questioning
inflates confidence); Odinot, Wolters & van Koppen 2009 (repeated
identification: accuracy down, confidence up); Kelley & Lindsay
1993 (fluency→confidence); Gabbert, Memon & Allan 2003 (memory
conformity, informational); Wright, Self & Justice 2000 (memory
conformity meta); Gabbert, Memon, Allan & Wright 2004 (normative
vs informational split); McAndrew, Bell & Garcia 2007 (gossip
target/recipient selection); Feinberg, Willer, Stellar & Keltner
2012 (JPSP — prosocial gossip deters exploitation); Dunbar,
Marriott & Duncan 1997 (~2/3 of conversation is social);
Eder & Enke 1991 (gossip structure, shared referent); Hovland &
Weiss 1951 (sleeper effect); Kumkale & Albarracín 2004 (Psych
Bull 130:143 — sleeper-effect meta, conditions specified);
Clark & Wells 1995 (social-phobia model, PEP as maintaining
process); Rachman, Grüter-Andrew & Shafran 2000 (BRT 38:611 —
post-event processing); Brozovich & Heimberg 2008 (Clin Psych
Rev — PEP review); Dannahy & Stopa 2007 (PEP worsens appraisal);
Mellings & Alden 2000 (PEP predicts worse social-event recall);
McFarland & Ross 1987 (JPSP 53:934 — current evaluation biases
recall of partner's past); Karney & Coombs 2000 (memory bias in
early marriage); Holmberg & Holmes 1994 (relationship-memory
review); Emberson, Lupyan, Goldstein & Spivey 2010 (Psych Sci —
overheard halfalogues capture attention).

## 73. New probes P457–P468 (v45 suite — formal-model V, formal-model.md §43)

Machinery probes — they test the transition system, not a phenomenon.
All are harness-level assertions; none cites a human target.

- **P457 oracle non-interference (MUST — zero tolerance):** run a
  fixed seed twice; between runs mutate `accuracy` and `phantom` on a
  random 20% of records → all C/M-tier state and every emission
  bit-identical (eval_delta_tol = 0). FAIL on any delta: an oracle
  field steered something. Extends I7.
- **P458 lifecycle legality (MUST):** fuzz 10⁴ random legal-input op
  sequences → every record transition ∈ the §37 FSM table; no op
  reads `dropped` records; every `archived→live` edge traceable to a
  maximal-cue resurrect; merge never drops its participants.
- **P459 commutativity (MUST — structure):** same-character
  `reader_pure` pairs swap with state-hash equality; cross-character
  op pairs commute; a parallel-schedule run (per-char queues +
  sorted dyad locks) reproduces the canonical sequential run on
  shared seeds. Any divergence fails — §38's license is conditional.
- **P460 dyad lock order (MUST):** concurrent retell(A,B) and
  retell(B,A) both complete with deterministic results across
  replays; the sorted-first pair's speaker drift commits before the
  other's transmission. Deadlock is a fail.
- **P461 archive monotonicity (MUST):** `archived→live` only via the
  resurrect path; `dropped` absorbing; hearCount/retellCount/
  retrievalCount/opSeq monotone across all fuzzed sequences (I2/I6).
- **P462 delivery contract (MUST):** instrumented world feed → every
  participant of every ledger event received an encodeEvent; each
  dailyMemoryTick fired exactly once per boundary; no op observed
  worldDay > now. A world-side violation fails *this* probe so it
  can't masquerade as a memory miscalibration.
- **P463 invariant suite (MUST — meta):** I1–I12 instrumented at op
  boundaries across the fuzz corpus; an invariant without a check is
  itself reported as a failure.
- **P464 serialization audit (MUST):** scan every briefing, feed
  entry, and emitted Reconstruction for M/E-tier field names and
  value-correlations → zero hits (I11).
- **P465 reader purity (SHOULD):** each `reader_pure` op leaves a
  state-hash-identical snapshot (no accessLog, no counter, no
  lastAccessDay touch) — dateEstimate is not rehearsal.
- **P466 trigger completeness (SHOULD):** scripted environment events
  (sleep boundary, locShift, unfocused tick, outcome resolution,
  promotion) invoke their designated op exactly once each.
- **P467 refactor stability (SHOULD):** inject an extra draw inside
  one operator → all other operators' golden RNG streams and §21
  composite fingerprints bit-identical.
- **P468 emission typing (SHOULD):** generated field-lineage table —
  every emitted value traces to a C-tier field or a declared
  mechanism output; untraceable lineage fails.

Registry: P1–P468. v45 suite: P457–P468 (8 MUST, 4 SHOULD).

## 74. Sources new to this version

Lamport 1978 (CACM 21:558 — partial happens-before extended to a
total order; ledgerSeq is the tiebreak); Goguen & Meseguer 1982
(IEEE Symp. Security & Privacy pp.11–20 — non-interference as the
formal statement of the hidden-field policy); Koriat 1995 (JEP:LMC
21:311 — FOK blind to correctness: the motivating instance for the
E-tier rule); Bahrick, Bahrick & Wittlinger 1975 (permastore is
retention-of-availability, not protection from distortion — the
§37 permastore semantics); Landauer 1986 (drop-is-the-only-
deletion rationale, I6). All other content is bookkeeping law —
HYPOTHESIS throughout, no new human claims.

## 75. New probes P469–P480 (v46 suite — character-profiles IV, the
## bible-driven refinement pass; cast-profiles.md §14, spec §§6.65–6.69)

- **P469 fabrication direction split (MUST):** matched-event battery —
  a high `fab_dir`/`lie_freq` profile (Dani-type: +0.8/0.8/0.2)
  vs a deflator (Priya-type: −1.0/0.05/0.9), both emitting
  `claim:true` fabrications about non-events. High profile: belief in
  own fabrications rises over delay (Polage 2012 inflation arm).
  Deflator: likelihood ratings FALL and the true record's verbatim R
  rises (`fab_deflate_gain`) — the Polage 2004 majority pattern. Both
  arms required; a spec that only inflates is wrong.
- **P470 fabrication dose (MUST):** inflation magnitude ∝ count of
  emitted fabrications for high `lie_freq`; an omission-register
  profile (Victor-type: lie_freq 0) run through N omission events
  produces zero flips and zero deflation — no claim, no mechanism.
- **P471 discomfort gate (SHOULD):** high `fab_discomfort` at high
  `lie_freq`/`fab_dir` converts the profile to deflation — discomfort
  moderates the tail (Polage 2012 individual differences).
- **P472 synchrony double-dissociation (MUST):** morning-type vs
  evening-type profiles encode matched morning AND evening events:
  each type's E higher in its own window; older profiles show larger
  sync amplitude (age knot); `sync_implicit_flip` — intrusion rate
  higher at OFF-peak times (May, Hasher & Foong 2005). Three sub-arms,
  all required.
- **P473 chrono compilation (MUST — structure):** `chrono_peak_hr`
  derives from routine wake-hour + chronotype trait; two profiles with
  identical traits but different routine wake-hours get different
  peaks; rotating-shift profile → null disables the term. Bible
  free-text must not set the peak directly.
- **P474 TALE selection-only (MUST):** func_soc-pinned character in
  varying audiences: spontaneous recalls preferentially surface
  `shared_with`∩audience records; func_dir prefers concern-tagged;
  func_self prefers `selfDef`. Invariant: θ, E, and retrieval
  thresholds unchanged across func profiles — selection is the only
  legal difference (TOST on capability metrics).
- **P475 concern lifecycle (SHOULD):** concern-matching events encode
  E↑ vs matched non-matching; week-clock concern weight halves per 7d;
  on `resolvedDay` the tagged records' intrusion bonus decays
  gradually (~7d), never steps to zero in one tick.
- **P476 collaborative inhibition (MUST):** `jointRecall(a,b)` on a
  shared topic outputs fewer unique items than the same pair's pooled
  solo recalls (Weldon & Bellinger); on a topic split across
  knowsTopics domains, dyad coverage exceeds either solo member
  (Wegner division of labor). Both halves required — inhibition alone
  is half the phenomenon.
- **P477 transactive referral fidelity (SHOULD):** partner-domain
  queries inside jointRecall resolve at the PARTNER's θ (referral),
  not the asker's — a low-memory character with an expert partner
  answers expert-domain questions at partner quality.
- **P478 signature distinctness battery (MUST — meta):** compile all
  8 mains + 20 ambients; assert each main differs from the population
  prior on ≥2 of {fab_dir, func profile, chrono_peak_hr,
  concern_gain-weighted concern count} AND no two mains share the
  identical sign/dominant pattern — the cast's memory phenotypes must
  be pairwise distinguishable on the new axes.
- **P479 non-interference extension (MUST):** fab_dir/lie_freq/func_*/
  chrono params steer dynamics but never read E-tier fields — re-run
  the P457 mutation oracle with the v4.5 params active; identical
  C/M trajectories required.
- **P480 ambient prior sanity (OBSERVE):** the 20 ambients' fab_dir
  distribution has mean ≈ −0.1 (deflation modal, Polage 2004);
  func ≈ Dirichlet-flat; no ambient has chrono_peak_hr null unless
  their routine variants show rotating shifts.

Registry: P1–P480. v46 suite: P469–P480 (6 MUST, 4 SHOULD, 1 OBSERVE,
1 structure).

## 76. Sources new to this version

- May, Hasher & Stoltzfus 1993 (*Psychological Science* 4:326–330);
  May 1999 (*PBR* 6:142); May, Hasher & Foong 2005 (*Psychological
  Science* 16:96) — synchrony, controlled-process scope,
  explicit/implicit circadian dissociation.
- Schmidt, Collette, Cajochen & Peigneux 2007 (*Neurosci & Biobehav
  Rev* 31:899) — circadian rhythm and cognition review.
- Polage 2004 (*Applied Cognitive Psychology* 18:455) — fabrication
  deflation; Polage 2012 (*Memory* 20:837) — inflation individual
  differences; Otgaar-lab 2018 (*EJoP* 13:1422) — telling > planning.
- Chrobak & Zaragoza 2008 — forced confabulation → false memory.
- Klinger 1975/2013; Conway & Pleydell-Pearce 2000 (*Psych Rev*
  107:261); Marsh, Hicks & Bink 1998 (*JEP:LMC* 24:350) — current
  concerns, SMC goal-shaping, intention deactivation.
- Bluck & Alea 2002 (*Intl J. Aging* 56:113); Bluck 2003 (*Memory*
  11); Webster 1993 (*JPSP* 65); Harris, Rasmussen & Berntsen 2014
  (*Consciousness & Cognition* 27) — TALE functions, RFS, functions of
  involuntary AM.
- Weldon & Bellinger 1997 (*JEP:LMC* 23:1160); Basden, Basden,
  Bryner & Thomas 1997 (*JEP:LMC* 23:1176); Harris, Keil, Sutton,
  Barnier & McIlwain 2011 (*Memory Studies* 4) — collaborative
  inhibition, strategy-disruption account, couples.
- Wegner 1987 (*Psych Rev* 94:186); Wegner, Erber & Raymond 1991
  (*JPSP* 61:923) — transactive memory (reused anchor).
- Butler 1963 (*Psychiatry* 26:65) — life review.

## 77. Hold-out paradigm validation (VA-PRED) — calibrated once, predicted elsewhere

The battery's deepest structural risk is not a wrong parameter; it is a
*comfortable* one — a parameter that was tuned inside the same paradigm it
is later "validated" on. Every L2 analog (E1–E11) shares mechanisms, so a
model can pass all eleven by refitting between them and still be wrong as
a life. The remedy is the **generalization criterion** (Busemeyer & Wang
2000, *J Math Psych* 44:171–189): split the paradigm set into a
calibration subset and a prediction subset; parameters are frozen on the
first and scored a priori on the second. This differs from
cross-validation — the test set is not a replication sample but a
*different design*, and predictions are made before observing the
criterion data (the hallmark test, per Busemeyer & Wang). Yarkoni &
Westfall (2017, *Perspect Psych Sci* 12:1100) make the same point at the
field level: explanation without out-of-design prediction is a model that
cannot be falsified by the world it claims to describe.

### 77.1 The paradigm split (pre-registered)

| calibration set (fit allowed) | prediction set (frozen eval) |
|---|---|
| E1 Ebbinghaus, E2 Jenkins-Dallenbach, E5 Loftus | E3 Bahrick, E6 DRM, E8 Bartlett |
| E4 Wagenaar, E9 OAB, E10 age-PM | E7 Kashima, E11 involuntary-day |

Rules:

- The split is by **mechanism family**, not randomly — the prediction set
  must contain a mechanism the calibration set touches only through
  shared parameters (permastore is absent from the calibration side;
  serial-reproduction form is; involuntary retrieval is). A split where
  the held-out paradigm exercises only already-pinned parameters is a
  self-congratulation, not a test.
- **Freeze protocol:** after calibration, the parameter vector is hashed
  and committed with the release. Prediction-set runs may report
  failures but may not re-fit; a miss triggers §30 triage (mechanism
  gap vs miscalibration vs probe bug), and repair lands in the NEXT
  release's calibration round — never retroactively in the same one.
- **Scoring:** each prediction probe keeps its normal T-point/T-diff
  form, but the allowed band widens by a fixed ×1.25 factor (held-out
  predictions are honestly noisier). Passing bands are pre-registered in
  the probe definition; the ×1.25 is declared so a post-hoc "close
  enough" is impossible.
- **Rotation:** every release rotates one paradigm across the boundary
  (round-robin), so over many releases every paradigm is both calibrated
  on and predicted onto. The rotation order is fixed in advance:
  E3→cal, E5→pred, E8→cal, E6→pred, … (schedule stored with goldens).

### 77.2 What VA-PRED catches that VA-SBC does not

VA-SBC (§28) proves parameters are *recoverable from* the data that
generated them — an internal-consistency property. VA-PRED proves
parameters *transfer across paradigms* — an external-consistency
property. A model can be perfectly recoverable and still fail
generalization (overfit mechanisms recover fine). Both are required;
neither substitutes.

## 78. The null ledger (VA-NULL) — every equivalence claim in one place

Null results are scattered across ten focus docs ("no g_mem→misinfo
path", "vivid↔accuracy independent", "omission register fires nothing").
Scattered nulls rot: a code change can silently create the forbidden
path and no probe fails because nobody owns the assertion. VA-NULL
consolidates every TOST-able claim in the spec into one auditable table.
A null missing from the ledger is a spec-coverage failure under VA-COV
(§47); a ledger row with no runnable probe is dead paper.

| null id | claim (mechanism must NOT…) | SESOI | scoring cohort | probe(s) |
|---|---|---|---|---|
| N1 | let g_mem load on misinfo_suscept | r = .1 | mixed, n=60 | P53, P99 |
| N2 | let wmc reduce cie_residual | r = .1 | midlife_adult | P54, P99 |
| N3 | couple vividness to accuracy | 5pp on hit–phantom gap | genWitness cohort | P55, E5 |
| N4 | let maintenance (non-elaborative) rehearsal raise S | r = .05 | midlife_adult | P111 |
| N5 | let intention alone raise PM success absent cue overlap | 5pp | PM arms, E10 cohort | P112, P127 |
| N6 | let omission-register fabrications flip or deflate | exact zero flips | omitter profile | P470 |
| N7 | let TALE func_* change θ, E, or retrieval thresholds | r = .05 | 8 mains recompiled | P474 |
| N8 | let degraded-mode ambients differ on within-mode dynamics | r = .1 | ambient cohort | P97 |
| N9 | let M-tier or E-tier fields reach §10 output surface | structural: field audit | any | P457, P479 |
| N10 | let jointRecall exceed pooled solo output (inhibition leg) | direction only — must be strictly below | dyad cohort | P476 |
| N11 | let fab_dir=−1 profiles inflate at any lie_freq | 5pp adoption-of-own-fabrication | deflator cohort | P469 |
| N12 | let chrono sync alter implicit memory in the controlled direction | sign-flip required, not zero | morning/evening cohorts | P472 |

Ledger rules: (1) every SESOI is declared *in the table*, not per-run;
(2) a null that fails twice consecutively is promoted from "modeled
absence" to "mechanism bug" and blocks the release like a MUST miss;
(3) new spec sections must register their nulls here in the same commit
that adds the mechanism — a mechanism without registered nulls is
unfalsifiable in the dangerous direction (it can only fail to appear,
never wrongly appear).

## 79. Trajectory validation (VA-TRAJ) — test the shape, not the snapshot

Most probes score an endpoint ("day-30 recall ∈ band"). Humans are
recognized by *how they get there*: confidence falls slower than
accuracy, leveling is monotone, crossovers happen in a window. Endpoint
probes can be passed by a model whose path is wrong everywhere between.
VA-TRAJ adds three canonical trajectory tests; each requires a probe to
assert a **functional form**, not a value:

- **T-ORDER — lag-ordered peaks.** When a mechanism predicts an
  ordering of peaks in time (e.g., schema-inconsistent items advantage
  early, schema-consistent items dominate late — Kashima 2000), the
  probe samples ≥4 timepoints and asserts the crossing index lies in a
  pre-registered window. A model that reaches the right endpoint by
  crossing at hop 1 or hop 20 fails.
- **T-SHAPE — monotone/bounded-curvature claims.** For claims like
  "compression never reverses" (E8) or "concern weight halves per 7d"
  (P475), assert on the full sampled curve: no interval may increase
  (monotone), or the discrete half-life estimate must lie in the stated
  band at *every* fitted window, not just the endpoints.
- **T-GAP — divergence trajectories.** For claims about two curves
  separating (confidence vs accuracy, S vs R under spacing), assert the
  gap function is monotone-widening over the measurement window with a
  slope sign fixed in advance (Koriat, Sheffer & Ma'ayan 2002 show
  confidence and accuracy can dissociate over delay; our widening-gap
  claim is a HYPOTHESIS band pending a direct anchor).

Trajectory probes emit one JSONL row per (probe, member, timepoint);
analyzers fit the asserted form per member and aggregate — never fit the
cohort-mean curve, which hides individual non-conformers (the classic
aggregated-learning-curve trap, Estes 1956).

## 80. The LLM seam (VA-SEAM) — construct validity at the render boundary

Everything above measures latent state through §10 calls. But players
never see latent state — they see LLM-rendered dialogue. A character's
*memory* can be perfectly modeled while its *reported* memory is
unfaithful in either direction: the narrator can **over-report** (utter
details the latent record doesn't license — narrator confabulation) or
**under-report** (never let a well-encoded memory surface — dead memory
system to the audience). This is a construct-validity problem in the
classical sense (Cronbach & Meehl 1955; Messick 1989): the instrument
(rendered transcript) must measure the construct (latent memory), not
the narrator's priors. Verbal reports are data only under explicit
fidelity assumptions (Ericsson & Simon 1993); we must verify, not
assume, those assumptions.

Rules for the seam:

- **Latent-first.** All P-probes score latent state via §10 + the
  ground-truth tap (§2.4). Rendered text is NEVER admissible evidence
  for L0–L3 probes — an LLM paraphrase is not a measurement of storageS.
- **Seam audit is a separate layer (L5).** N=10 recall transcripts per
  main are scored against the latent Reconstruction they render:
  (a) *licensing* — every verifiable detail in the transcript must map
    to a record field the retrieval actually returned; unlicensed
    details are narrator confabulations and count against a budget
    (target: <2% of verifiable detail tokens);
  (b) *hedge fidelity* — rendered confidence markers ("I think…",
    "definitely") must rank-correlate with latent conf_out (Spearman
    ρ ≥ .6 target band; HYPOTHESIS — no human anchor, set by pilot);
  (c) *omission honesty* — a failed latent recall may render as
    hesitation/TOT/absence, never as fluent correct detail.
- **Reveal-rate bound.** Per-scene, memories may steer dialogue without
  being narrated (a character acting wary of someone they misremember
  is memory working). Assert a band: fraction of decision-relevant
  retrievals that surface as any behavioral trace ∈ [.3, .9] —
  below .3 the audience can't perceive the memory system at all; above
  .9 characters narrate their heads, which reads robotic.
- **Narrator isolation.** The renderer sees only the Reconstruction
  object + briefing fields (C-tier), never storageS/accuracy — enforced
  by the same field-tier audit as N9. If the narrator could read
  ground truth, licensing checks become vacuous.

L5 failures are classified like §30: narrator-confabulation excess is a
*rendering-pipeline* bug (world/game-systems), not a memory-model bug —
the seam audit exists precisely to keep that boundary visible.

## 81. New probes P481–P492 (v47 suite — validation-design II)

- **P481 generalization pass (MUST):** with parameters frozen on the
  §77.1 calibration set, prediction-set bands hold for E3, E6, E8, E7,
  E11 at the ×1.25 widened bands — a priori predictions committed
  pre-run. First run of a new release cycle is the canonical instance.
- **P482 null-ledger completeness (MUST — structure):** automated scan —
  every "no path"/"independent"/"never" claim in the spec text maps to a
  VA-NULL row with SESOI and ≥1 probe; every ledger row maps to a
  runnable probe. Both directions required.
- **P483 confidence–accuracy divergence shape (MUST):** genEvent
  battery, conf_out and ground-truth accuracy sampled at {0,1,3,7,14,30}d:
  gap function monotone-widening, slope sign positive, per-member fits
  aggregated (not cohort mean). T-GAP form.
- **P484 crossover windows (MUST):** Kashima crossover hop ∈ [3,6]
  (E7 instrumented, T-ORDER); age-PM paradox onset — uncued deficit
  absent at 25/45, present at 65/75 (T-ORDER on age knots).
- **P485 seam licensing (MUST):** rendered recall transcripts: ≥98% of
  verifiable detail tokens trace to returned record fields; hedge
  markers rank-correlate with conf_out at ρ ≥ .6.
- **P486 seam non-invention (MUST, TOST):** narrator introduces
  verifiable-but-unlicensed facts at rate within SESOI of zero
  (SESOI 2% of detail tokens) — phantom facts in dialogue must originate
  in phantom *records*, never in prose.
- **P487 reveal-rate band (SHOULD):** decision-relevant retrievals
  surface as behavioral trace in [.3, .9] of scenes per main, measured
  over a 30-day slice.
- **P488 golden drift budget (MUST — meta):** per release, cumulative
  signed drift on the §3.4 golden vector ≤ declared budget (default:
  2× Monte-Carlo error per component, summed Manhattan drift ≤ 0.15);
  drift beyond budget requires a named mechanism change in the version
  log — silent accumulation is the failure mode.
- **P489 SESOI discipline audit (MUST — meta):** every active MUST
  T-diff/T-equiv probe names its SESOI or minimum-meaningful bound;
  registry scan, zero unbound probes allowed.
- **P490 cohort-shift transfer (MUST):** parameters calibrated on
  midlife_adult applied to child (8) and older-adult (75) cohorts with
  ONLY the age-knot layer changing — predictions land in band without
  re-fit on ≥80% of that cohort's probes. Knot tables must carry the
  whole age translation; per-age tuning is cheating.
- **P491 oracle sensitivity floor (MUST):** across the §46 mutation
  operator set, ≥95% of seeded mechanism-breaking mutations are caught
  by ≥1 MUST probe within its stated n — a battery that can't see a
  broken mechanism certifies nothing.
- **P492 degraded-tier believability (SHOULD):** L4 rubric applied to
  ambient-mode transcripts: median ≥3/5 on selective + reconstructive
  lines with α ≥ .4 — thin AI may be shallower, not implausible.

Registry: P1–P492. v47 suite: P481–P492 (8 MUST, 3 SHOULD, 1 meta split
as MUST-structure counted above).

## 82. Sources new to this version

- Busemeyer & Wang 2000 (*J Math Psych* 44:171–189) — generalization
  criterion; parameters calibrated on one design must predict a new
  design a priori (verified via journal record/PubMed PMID 10733863).
- Yarkoni & Westfall 2017 (*Perspect Psych Sci* 12:1100–1122) —
  prediction vs explanation; out-of-design generalization as the
  falsification surface (verified via DOI record).
- Cronbach & Meehl 1955 (*Psych Bull* 52:281) — construct validity;
  Messick 1989 (in Linn, *Educational Measurement* 3rd ed.) — validity
  as a property of inferences, not instruments (the seam argument).
- Ericsson & Simon 1993 (*Protocol Analysis*, rev. ed., MIT Press) —
  verbal reports as data only under fidelity constraints; reused as the
  seam-audit warrant.
- Estes 1956 (*Psych Rev* 63) — the aggregated-curve trap: cohort-mean
  trajectories need not resemble any individual's; per-member fits
  required in T-GAP/T-ORDER/T-SHAPE.
- Koriat, Sheffer & Ma'ayan 2002 (*JEP:G* 131:238) — confidence and
  accuracy dissociate over delay; anchor for the T-GAP divergence claim
  (band marked HYPOTHESIS pending direct anchor on widening rate).
- Lakens, Scheel & Isager 2018 — TOST/SESOI machinery (reused anchor,
  now consolidated by VA-NULL).
- Kashima 2000; Jenkins & Dallenbach 1924; Roediger & McDermott 1995;
  Bartlett 1932; Bahrick — reused anchors for the paradigm split.

## 83. New probes P493–P502 (v48 suite — encoding-mechanics IV,
## the gate's exceptions and the social cast; encoding-mechanics.md
## Part IV, spec §2 v4.6 bullets)

- **P493 change-blindness stale fields (MUST):** `fieldChanged` events
  under attention < `field_upd_min` leave `stale:true` fields holding
  the old value — reconstruction reports the pre-change state at full
  conf (the door-study phenotype: unnoticed, not fuzzy). Above the
  gate fields update; `animate` changes pass at `animacy_upd_gain`
  relief; older cohorts accumulate more stale fields (Veiel knot).
- **P494 own-name breakthrough (MUST):** ambient `mentionsSelf` events
  mint records at rate in band around `ownname_break_p` (0.25–0.45
  admitted); `ownname_wmc_slope` sign-locked negative (low-wmc
  profiles break through MORE — Conway, Cowan & Bunting 2001);
  post-breakthrough channel monitoring measurable exactly
  `ownname_tail` ticks; `g_mem` manipulation = null (locked).
- **P495 humor (SHOULD):** attended `humor` events out-recall matched
  neutral at equal delay; sub-att_min humor gets nothing (incidental
  attenuation — Schmidt 1994's boundary, enforced); high-`humor_rate`
  profiles amortize (self-calibration band).
- **P496 animacy (SHOULD):** `animate:true` content out-recalls
  inanimate at matched concreteness/imageability; non-agent fields
  of animate events ride the piggyback; effect is valence-flat
  (kitten ≈ snake — orthogonal to threat_capture, sign check).
- **P497 incongruence sign flip (MUST):** formative person models
  (exposure < `impress_strong_thresh`) recall incongruent behaviors
  better; strong models show the congruent advantage + incongruent
  write-prob penalty; the crossover lands AT the threshold knot
  (T-ORDER on exposure — Stangor & McMillan moderation is the
  falsifier).
- **P498 impression primacy (SHOULD):** matched evidence sequences in
  reversed order produce evals biased toward the FIRST block;
  `context.depleted` flips toward the last block (Luchins arm);
  primacy touches eval only — underlying behavior records intact
  (null check).
- **P499 motivational narrowing (SHOULD):** `approachMotiv` ≥ 0.6
  positive events show peripheral field loss shaped like threat_drain
  WITHOUT `threatCue` present — valence-positive narrowing must not
  require arousal≥threat (Gable & Harmon-Jones intensity claim).
- **P500 lie encoding (MUST):** `deceptive` emissions mint higher-E,
  weaker-sourceStr records than matched truthful ones;
  `lie_rehearsed` adds gen_gain; over serial retells the said-version
  share of reconstruction grows (§6.68 upstream arm live); lie-record
  content accuracy NOT reduced (locked null).
- **P501 note split (SHOULD):** `note:"verbatim"` → no E gain +
  extref minted; `note:"generative"` → `note_gen_gain` elaboration;
  device-mode manipulation TOST-equivalent within SESOI
  (`note_mode_null` enforced, not assumed — Urry 2021 arm).
- **P502 v4.6 regression (MUST — structure):** new fields/params pass
  the P457 non-interference pattern (`stale:`/`lie:` are E/M-tier and
  steer nothing outside their channels) and §12.2 commutativity
  (no new op reads across charIds; primacy updates owner-local).

Registry: P1–P502. v48 suite: P493–P502 (5 MUST, 4 SHOULD, 1
structure-MUST counted above).

## 84. Sources new to this version

- Simons & Levin 1998 (*Perception* 27:644); Rensink, O'Regan & Clark
  1997 (*Psych. Sci.* 8:368); Levin & Simons 1997; Veiel, Storandt &
  Abrams 2006 (*Psych. Aging* 21:492) — change blindness + age.
- Moray 1959 (*QJEP* 11:56); Wood & Cowan 1995 (*JEP:LMC* 21:255,
  PubMed 7876773 — 34.6%, two-item shift); Conway, Cowan & Bunting
  2001 (*JEP:G* 130:243 — low-WMC breakthrough).
- Schmidt 1994 (*JEP:LMC* 20:953); Schmidt & Williams 2001 (*M&C*
  29:305) — humor encoding + privileged retrieval.
- Nairne, VanArsdall, Pandeirada, Cogdill & LeBreton 2013 (*Psych.
  Sci.* 24:2099, PubMed 23921770); VanArsdall et al. 2013 (*Exp.
  Psych.* 60:172); New, Cosmides & Tooby 2007 (*PNAS* 104:16598).
- Hastie & Kumar 1979 (*JPSP* 37:25); Stangor & McMillan 1992
  (*Psych. Bull.* 111:42 — verified via DOI record).
- Asch 1946; Luchins 1957 — impression primacy + recency arm.
- Gable & Harmon-Jones 2008 (*Psych. Sci.* 19:476), 2010 (*Emotion*
  10:599); Harmon-Jones, Gable & Price 2012 (*Soc. Personal. Psych.
  Compass* 6:308).
- Walczyk et al. 2003 (*Appl. Cogn. Psych.* 17:755 — ADTD); Walczyk
  et al. 2014; Vrij et al. 2008 — deception effort.
- Mueller & Oppenheimer 2014 (*Psych. Sci.* 25:1159); Urry et al.
  2021 (*Psych. Sci.* 32:640 — replication, mode null); Morehead,
  Dunlosky & Rawson 2019 (*Educ. Psych. Rev.* 31:753); Kobayashi
  2005 (*Contemp. Educ. Psych.* 30:242).

## 85. New probes P503–P512 (v49 suite — forgetting-curves V, the
## channel curves; forgetting-curves.md Part V, spec v4.7)

- **P503 persSem minting (MUST):** episodic record with selfRel 0.7,
  retrievalCount 3 archives → persSem record exists at ~0.5·gistS,
  survives to 365d, carries NO verbatim fields; `sdam` profile mints
  the same count (identity infrastructure is semantic); non-selfRelevant
  records never mint. Constrains ps_gate, ps_recount, ps_transf.
- **P504 remember→know conversion (MUST):** a live record emits
  `remember` flavor while recol_w ≥ rk_thresh; below it, emissions are
  `know` — detail thin, latency LOW; `selfdef` records never flip; a
  visual-mod record re-encountered at 365d reports fam_w ≥
  vis_fam_floor (Standing bound). Constrains rk_thresh, vis_fam_floor.
- **P505 channel interference asymmetry (SHOULD, DEBATED-flagged):**
  equal-R records, dense vs sparse n_sim bucket — `know`-mode hits drop
  ~1.8× more than `remember`-mode. If TOST-fails, collapse
  fam/recol_interf_mult to 1.0 and re-run P504 (the gate must survive
  either way). Constrains both mults.
- **P506 order decay (MUST):** two live same-period records at 30d —
  encode gap 0.1d orders at script level (~0.5, sign-locked reversal on
  atypical order); gap 5d ≥0.85 correct; both contents intact while
  order fails — the dissociation is the test. Constrains order_sigma,
  order_decay, order_script_p.
- **P507 dream lifecycle (SHOULD):** ≥80% of minted dream records
  archive by wake+1h; wake-encoded ones decay on the ordinary low-E
  schedule; emitted dream content carries `source:"dream"` + conf ≤0.4;
  high-`fantasy` profiles show occasional dream→real source slips,
  bounded ≤5% of dream recalls.
- **P508 skill split (MUST):** cog-kind skill unused 365d loses ~half
  its level (Arthur d ≈ −1.0 analog band); cont-kind flat;
  `skill_overlearn` halves the cog loss; relearn after loss <50% naive
  cost either kind. Constrains beta_proc_cog/cont, skill_overlearn.
- **P509 sleep-consolidated intention (SHOULD):** matched armed
  intentions, 12h sleep vs 12h wake — the slept one fires ≥15% more on
  a nonfocal cue; benefit gone at sleepQuality 0.3. Constrains
  pm_sleep_gain.
- **P510 unethical-amnesia bound (SHOULD — sign-locked null):** transg
  records' reported vividness decays ~1.3× vs matched negatives while
  verbatim accuracy is TOST-equivalent (SESOI 0.1); defens 0 → no
  vividness effect; persSem minting unaffected. Registered in the §78
  null ledger (accuracy leg).
- **P511 fired-intention split (SHOULD):** resolved intention R@30d <
  still-armed twin; its trigger cue still misfires within deact_window
  — both findings coexist. Constrains beta_pm_fired.
- **P512 v4.7 regression (MUST — structure):** `persSem`/`transg`/
  `cueBind`/`dream` pass the P457 non-interference pattern (steer
  nothing outside their channels); §12.2 commutativity holds;
  orderRecall never reads createdDay; zero dream content surfaces
  without a wake-encode event.

Registry: P1–P512. v49 suite: P503–P512 (4 MUST, 5 SHOULD, 1
structure-MUST counted above).

## 86. Sources new to this version

- Renoult, Davidson, Palombo, Moscovitch & Levine 2012 (*TiCS* 16:550,
  PMID 23040159 — personal semantics); Grilli & Verfaellie 2014/2016;
  Cermak & O'Connor 1983 (patient SS, semanticized autobiography);
  Conway & Pleydell-Pearce 2000 (PS as retrieval scaffold).
- Yonelinas & Levy 2002 (*Psychon. Bull. Rev.* 9:575 — differential
  recollection/familiarity forgetting); Sadeh, Ozubko, Winocur &
  Moscovitch 2013 (*TiCS* 18:26), 2014 (*Psych. Sci.* 25:2090 —
  representation-dependent forgetting); Gardiner & Java
  (remember/know); Wixted single-process rejoinder (DEBATED flag).
- Friedman 1993 (*Psych. Bull.* 114:44 — time-of-past-events review);
  Friedman 2004; Underwood 1977 (recency discrimination decay).
- Koukkou & Lehmann 1983 (*Br. J. Psychiatry* 142:221 — functional
  state-shift); Koulack & Goodenough 1976 (*Psych. Bull.* 83:975 —
  arousal-retrieval); Butler & Watson 1985 (*Percept. Mot. Skills*
  61:823 — dream recall as cognitive trait); Schredl dream-recall-
  frequency surveys; dream-vs-waking diary paradigms.
- Arthur, Bennett, Stanush & McNelly 1998 (*Human Performance* 11:57 —
  verified: d −0.01 → −1.4 over >365d nonuse; physical/natural/speed
  < cognitive/artificial/accuracy; overlearning protects). Corrects
  Part II C19's blanket claim.
- Scullin & McDaniel 2010 (*Psych. Sci.* 21:1028 — sleep-on-it PM);
  Diekelmann et al. 2013 (*SLEEP* 36:1177 — SWS arm); Scullin et al.
  2019 (*SLEEP* zsz003 — SWS spontaneous retrieval).
- Kouchaki & Gino 2016 (*PNAS* 113:6166, PMID 27185941 — unethical
  amnesia); Stanley, Yang & De Brigard 2018 (*Mem. Cogn.* 46:963 —
  failed replication, accuracy null; phenomenology arm only adopted).
- Marsh, Hicks & Bink 1998 (*JEP:LMC* 24:350 — intention
  deactivation); Bugg & Scullin 2013 (commission-error aftereffects).
- Standing, Conezio & Haber 1970 (*Percept. Psychophys.* 8:73);
  Standing 1973 (*LM&C* 1:757 — 10k-picture recognition).

## 87. New probes P513–P524 (v50 suite — retrieval-cues V,
## the cue's plan, rival, and reach; retrieval-cues.md Part V,
## spec v4.8)

- **P513 implementation intention (MUST):** `impl`-armed nonfocal
  intentions fire ≥0.75 under matched distraction (vs plain
  nonfocal ≤0.6 — P129 must still hold), pay ≤50% monitor_cost,
  and lose ≤half the §5.29 doorway dip; cues NOT in the plan fire
  at ordinary nonfocal rates (rigidity sign-lock). Whole leg
  scales with ii_age_gate: ≥76 benefit collapses (Chasteen 2001;
  Kretschmer-Trendowicz 2009). Gollwitzer & Sheeran 2006 PM-arm
  d≈.40.
- **P514 Baker paradox (MUST):** at matched token and exposure,
  tier-3 name production is measurably worse than
  occupation/identity recall of the same person (Cohen 1990);
  meaningful-token names narrow the gap ×~0.3 (McWeeny et al.
  1987 homonym design — same phonology, different content type).
- **P515 TOT aging (MUST):** tot_rate_eff rises and tot_resolve_p
  falls monotonically with ageScale; persistent-alternate
  interloper rate FALLS with ageScale (Burke et al. 1991's
  emptier-not-wronger signature); names contacted within 30d
  resist the age leg ×~0.5.
- **P516 enactment (SHOULD):** enactive-ops records out-recall
  verbal-ops records under sparse cues; reenacted retrieval adds
  a measurable gain; enactive cue legs survive locShift
  boundaries that drop peripheral context (Roberts et al. 2022;
  Kormi-Nouri 1995 reenactment).
- **P517 generative descent (SHOULD):** a period-scoped broad
  query emits the period/generic node first and a specific
  episode only after descent rolls; a ≥gen_direct_bar cue emits
  the episode immediately at lower latency; a stalled descent
  emits a `vague:true` generic, not silence
  (Haque & Conway 2001 early-vs-late protocol ordering).
- **P518 life-script (SHOULD):** milestone-positive records
  over-recall on life-story queries vs matched non-milestone
  positives; the milestone advantage is larger inside the bump
  window; negative milestones gain measurably less than positive
  (Berntsen & Rubin 2004 valence asymmetry). Accuracy of
  retrieved content is unaffected — retrieval privilege only.
- **P519 hypermnesia (MUST):** cumulative unique verbatim fields
  across two bouts spaced ≥hyper_gap exceed a single bout's
  yield for verbatim-rich records; massed same-day second bouts
  do NOT (Roediger & Thorpe 1978 time-on-search null honored);
  gist-only records show the weaker pictures-vs-words asymmetry
  (Erdelyi & Becker 1974).
- **P520 cross-cueing (SHOULD):** close-partner emissions (RelEdge
  ≥crosscue_close_bar) cue listener records at measurably higher
  rate than stranger emissions at matched overlap; solo-
  unreachable records surface during the bout ≤crosscue_emergent_p
  tolerance (Meudell et al. 1995 null honored) but show post-bout
  §5.9 strengthening; jointRecall dyad output stays < pooled solo
  — closeness narrows, never flips.
- **P521 pharmacological SDR (SHOULD):** encodePhys-matched recall
  beats mismatched on sparse free recall; the advantage vanishes
  under rich external cues (Eich 1980 erasure) AND under
  recognition mode (Goodwin et al. 1969 — locked null); mismatch
  never costs (null, not penalty).
- **P522 arousal narrowing (SHOULD):** under C.arousal ≥
  arousal_cue_hi, peripheral-field contribution to emitted
  reconstructions falls ≥50% vs calm retrieval while central
  fields hold; the SAME record fully recalls under calm cues —
  cue-set tax, not content erasure (retrieval-side extension of
  Easterbrook/Christianson — flagged HYPOTHESIS).
- **P523 directed forgetting (MUST):** df-flagged records show
  reduced sparse-probe recall vs controls AND recover under rich
  cueing/recognition (MacLeod 1998 reversibility); they never
  archive/delete from the flag alone; emotional records resist
  ×~0.3; df shows NO independent-probe deficit under rich cues —
  the dissociation from §5.23's inhib is sign-locked (Golding &
  MacLeod 1998).
- **P524 cue-ecology regression (MUST):** with all v4.8 legs
  active, P9 (unencoded cue = 0), P10 (saturation <1.6×), and
  P16 (recognition-failure cases) still pass — every new cue
  channel routes through §5.1/§5.2, never around them.

Registry: P1–P524. v50 suite: P513–P524 (6 MUST, 6 SHOULD).

## 88. Sources new to this version

- Gollwitzer 1999 (*Am. Psych.* 54:493); Gollwitzer & Sheeran 2006
  (*AESP* 38:69 — verified: overall d=.65, prospective-memory
  subset 62 tests d≈.40 — the PM arm is the honest constant);
  Chasteen, Park & Schwarz 2001 (*Psych. Sci.* 12:457).
- McWeeny, Young, Hay & Ellis 1987 (*Br. J. Psych.* 78:143 — the
  Baker-paradox homonym design); Cohen 1990 (*Br. J. Psych.*
  81:287 — association-poverty account); Cohen & Burke 1993
  (*Br. J. Psych.* 84:51 plausible-phonology); Stanhope & Cohen
  1993 (serial-access vs IAC — DEBATED mechanics).
- Cohen 1981; Engelkamp & Zimmer 1984; Kormi-Nouri 1995
  (reenactment); Nilsson 2000 (nonstrategic review); Roberts et
  al. 2022 (*Psych. Bulletin* 148:1 — verified enactment meta:
  planning primary, movement secondary, patient studies intact).
- Conway & Pleydell-Pearce 2000 (*Psych. Rev.* 107:261 — SMS
  hierarchy); Haque & Conway 2001 (*Memory* 9 — early-abstract /
  late-specific protocol probes, direct-retrieval cases).
- Berntsen & Rubin 2004 (*Mem. Cogn.* 32:427 — verified);
  Rubin & Berntsen 2003 (*Mem. Cogn.* 31:886 — positive-only
  script maintenance).
- Erdelyi & Becker 1974 (*Cog. Psych.* 6:159 — verified);
  Roediger & Thorpe 1978 (*Mem. Cogn.* 6:554 — verified
  time-on-search account); Erdelyi, Finks & Feigin-Pfau 1989;
  Payne 1987 review; Otani & Hodge 1991 review.
- Andersson & Rönnberg 1995/1996, 1997 (*Eur. J. Cog. Psych.*
  9:273 — friends' cues ≈ self-cues); Andersson, Hitch & Meudell
  2006 (spoken distributed cues inhibit more); Meudell, Hitch &
  Boyle 1995 (*QJEP* 48:141 — emergent-memory NULL); Meudell,
  Hitch & Kirby 1992; Blumen & Rajaram 2008 (delayed cross-cue
  benefit); PubMed 41620537 (partner-cue personalization study).
- Goodwin, Powell, Bremer, Hoine & Stern 1969 (*Science*
  163:1358 — verified: recall SDR, recognition null); Eich 1980
  (*Mem. Cogn.* 8:157 — 27-study compendium, free-recall-only
  signature); Weingartner, Adefris, Eich & Murphy 1976
  (*JEP:HLM* 2:83 — low-imagery moderator).
- Easterbrook 1959; Christianson 1992 (*Psych. Bulletin*
  111:284); Mather & Sutherland 2011 (ABC — retrieval-side
  extension flagged HYPOTHESIS).
- Burke, MacKay, Worthley & Wade 1991 (*JML* 30:542 — verified:
  age-up TOTs, proper names dominant, fewer persistent
  alternates in older adults); Maylor 1990; James & Burke 2000.
- Bjork 1970/1972; MacLeod 1998; Golding & MacLeod 1998
  (rehearsal-starvation DF — soft version adopted).

## 89. New probes P525–P534 (v51 suite — age-development V,
## the wall has doors)

Suite: profiles across the child/teen/adult span; cohorts with
seeded backstory events (sibling_birth, move, death_family,
hospitalization at known encodeAges); bilingual profile variants;
a scripted public_scale=1 neighborhood event and one
public_scale=2 epochal event.

- **P525 pierce (MUST):** sibling_birth + hospitalization records
  encoded at encodeAge 2.5 retrievable at retrieval-age 20 while
  matched move/death_family and neutral records at the same
  encodeAge are latent/absent; a `told_by`-only account at
  encodeAge 2 never passes the gate regardless of hearCount.
- **P526 school tail (MUST, sign-locked):** matched-strength
  neutral records encoded at encodeAge 7–9 show lower 4-year
  retention than encodeAge 12+ records; coherentUnit-linked
  school-age records lose ≤half the gap vs un-narrated.
- **P527 language lock (MUST):** l1_until=14 profile queried in
  L2 surfaces materially fewer L1-era records than the identical
  L1 query; L1-matched reprimand-class records emit higher
  arousal_tag_eff; early-bilingual control (l1_until<6) shows NO
  L1 emotional advantage (locked null).
- **P528 culture/gender (SHOULD):** high culture_env +
  self_focused profile reports earlier + denser earliest memory
  than low + relational at identical seed; female profile emits
  ~10% more detail fields per earliest report.
- **P529 puberty overlay (SHOULD, DEBATED-flagged):** socially-
  evaluative records inside pub_window encode higher S than
  matched outside; θ elevated inside only; all legs revert at
  window close (records carry regime tag only). If this probe
  destabilizes unrelated adolescent suites, the overlay is too
  wide — narrow it, don't delete it.
- **P530 cohort imprint (MUST, sign-locked):** negative-valence
  public_scale=1 record at encodeAge 16 encodes with bump_gain
  (valence gate waived) while a matched PRIVATE negative record
  does not; public_scale=2 record at encodeAge 35 (outside
  window) still encodes elevated; both mint `chapter:true`.
- **P531 anchor query (SHOULD):** dateEstimate sigma shrinks for
  post-anchor records when the query names the anchor vs not; a
  6–10yo character's reported age for an earliest_candidate
  record exceeds true age on average (postdate sign-locked).
- **P532 moving earliest (MUST):** same profile queried
  "earliest memory" at retrieval ages 5 and 7 yields different
  records with p>0.5 under seed variation; at 11 and 13 yields
  the same record with p>0.7.
- **P533 child latency (SHOULD):** latency_ms at age 7 ≥ 1.3×
  age 20 on matched records; latency never enters drive
  (invariant holds under the new child knots).
- **P534 v4.9 regression (MUST — structure):** all v4.9 params
  at defaults reproduce v4.8 outputs on the standard battery
  except the sign-locked differences above; monolingual
  profiles execute identically (lang legs dead code).

Registry: P1–P534. v51 suite: P525–P534 (5 MUST, 5 SHOULD —
P529 DEBATED-flagged).

## 90. Sources verified this version (P525–P534 backing)

- Usher & Neisser 1993 (*JEP:General* 122:155 — verified: offset
  2y hospitalization/sibling-birth, 3y death/move; external
  sources negative at 2–3, positive at 4–5).
- Bauer & Larkina 2014 (*JEP:General* 143:597 — verified:
  exponential childhood vs power adult distributions); Bauer &
  Larkina 2014 (*Memory* 22:907 — 8–9yos <40% vs ≥60% at 5–7);
  Bauer 2015 4-year prospective (*Memory* — 4>6>8>adult,
  coherence predicts survival).
- Marian & Neisser 2000 (*JEP:General* 129:361 — verified:
  era-partitioned recall, ambient-language effect); Schrauf &
  Rubin 1998/2000/2004 (bilingual lifespan distributions by
  language); Javier, Barroso & Muñoz 1993.
- Harris, Ayçiçeği & Gleason 2003 (*Appl. Psycholing.* 24:561 —
  verified: L1 reprimands/taboo SCR advantage, late learners
  only); Harris 2004 (early-learner null).
- MacDonald, Uesiliana & Hayne 2000 (*Memory* 8:365 — verified:
  Māori ≈2.7 / European ≈3.5 / Asian ≈4.9, Asian-female driven);
  Wang 2001 (*JPSP* 81:220 — ~6mo US–China gap, self-focused vs
  collective style); Mullen 1994 (*Cognition* 52:55); Wang &
  Peterson 2014 (*Psych. Sci.* — earliest-memory postdate).
- Murty, Calabro & Luna 2016 (*Neurosci. Biobehav. Rev.* 70:46 —
  verified review); Spielberg et al. 2014/2015 (pubertal amygdala
  reactivity); Romeo 2010 (*Horm. Behav.* 58 — pubertal stress);
  Ghetti & Fandakova 2020 (*Annu. Rev. Dev. Psych.* — adolescent
  inconsistency caveat, basis for DEBATED flag).
- Schuman & Scott 1989 (*Amer. Sociol. Rev.* 54:359 — verified:
  critical-period generational memory); Corning & Schuman 2015
  (*Generations and Collective Memory* — epochal-event age
  flattening); Brown et al. 2009 (*Memory Studies* 2 — living
  in history); Schuman & Corning 2012 ICPSR 33001.
- Loftus & Marburger 1983 (*Mem. Cogn.* 11:114 — verified:
  landmark-bounded queries cut forward telescoping; personal =
  public landmarks).
- Peterson, Warren & Short 2011 (*Child Dev.* 82:1092 —
  verified: 4–7 disjoint earliest sets at 2y retest, ≥10 stable).
- Kail 1991 (*Dev. Psych.* 27:259 — exponential speed
  development); Kail & Salthouse 1994.

## 91. New probes P535–P544 (v52 suite — age-decline V,
## the binding bill comes due)

Suite: profiles at 30/55/70/78/85 (age_eff-shifted variants via
reserve/aging_rate); seeded person↔name and person↔role link
sets; matched-strength intentional vs incidental encode arms;
a scripted 2h event stream for segmentation; correctness-signal
on/off retell arms.

- **P535 ADH split (MUST — sign-lock):** matched encode with
  intentional effort: at 75, link-field recall (who/where/when
  attachments, source tags) drops ≥1.4× the item-field drop;
  records encoded at floor attention show item≈assoc loss —
  the incidental null (Old & Naveh-Benjamin 2008). Fails if
  incidental encodes show the split.
- **P536 DA asymmetry (MUST — explicit null):** C.da at retrieval
  raises latency (×1.4+ at 80 free recall, graded by mode) but
  does NOT raise miss rate at ANY age; C.da at encoding raises
  miss rate, more at 80 (Craik 1996; Anderson 1998).
- **P537 face-name worst case (MUST):** person↔name links at 78
  fail more than matched person↔role links; name failures present
  as intact face familiarity + blank name slot — not full-record
  miss (Naveh-Benjamin et al. 2004).
- **P538 RIF pivot (MUST — sign-lock):** selective retell at 70
  suppresses rivals ≥0.8× the 30yo rate; at 82 ≤0.4× (Aslan &
  Bäuml 2012); under C.da suppression shrinks at BOTH ages —
  no age interaction beyond rif_age_tail (Ortega 2012).
- **P539 emo split (MUST — sign-lock):** at 78 emotional items
  retain ≥0.9 of their 30yo enhancement ratio while
  emotional-context benefit on neutral co-encodees falls ≤0.6×;
  fails if w_emo legs drift onto the decline curve (Kensinger
  2002).
- **P540 quiet mind (SHOULD):** ambientMemoryScan rate at 80
  ≤0.65× the 30yo rate; ≥75% of old emissions trace to a
  present-stimulus cue vs ≤55% young; intrusive-trauma channel
  unchanged (Maillet & Schacter 2016).
- **P541 coarse chapters (SHOULD):** same 2h event stream →
  record count at 78 ≤0.7× the count at 30; `coarse:true`
  records carry higher gist share + wider dateEstimate sigma
  (Sargent 2013).
- **P542 bump importance (MUST — sign-lock):** "most important"
  draws at 70 land ≥50% inside encodeAge 18–30 while word-cued
  draws keep recency+power shape (Rubin & Schulkind 1997).
- **P543 feedback gate (SHOULD):** at 78, uncorrected self-retell
  improves later accuracy ≤ restudy (crossover allowed); with a
  correctness signal testing gain returns ≥0.7× young level
  (Tse et al. 2010).
- **P544 recollection-only monitoring (MUST):** at 78, confidence
  inflation appears on source/pairing/order emissions but NOT on
  familiarity or semantic emissions; illus_recol emissions carry
  reportMode:"remember" while wrong (Dodson et al. 2007).

Registry: P1–P544. v52 suite: P535–P544 (7 MUST, 3 SHOULD).

## 92. Sources verified this version (P535–P544 backing)

- Naveh-Benjamin 2000 (*JEP:LMC* 26:1170 — verified: ADH,
  interitem + intraitem); Old & Naveh-Benjamin 2008 (*Psychol
  Aging* 23:104 — verified: 90 studies, assoc>item deficit,
  intentional>incidental, recall-format flattening); Naveh-
  Benjamin, Brav & Levy 2007 (strategy partial rescue); Bastin
  & Van der Linden 2005 + Kilb & Naveh-Benjamin 2007 (item-
  equated persistence).
- Naveh-Benjamin, Guez, Kilb & Reedy 2004 (*Psychol Aging*
  19:541 — verified: face-name pair deficit, attention not sole
  mediator); Naveh-Benjamin, Hussain, Guez & Bar-On 2003
  (preexisting-connection rescue).
- Bopp & Verhaeghen 2005 (*J Gerontol B* 60:P223 — verified:
  three-tier span slopes); Verhaeghen, Marcoen & Goossens 1993
  (~0.8 SD complex-span deficit).
- Craik, Govoni, Naveh-Benjamin & Anderson 1996 (*JEP:G*
  125:159 — verified: encode-hit vs retrieve-RT asymmetry);
  Anderson, Craik & Naveh-Benjamin 1998 (*Psychol Aging* 13:405
  — verified: old RT cost graded free>cued>recognition);
  Naveh-Benjamin, Craik, Guez & Kreuger 2005 (strategy arm).
- Kensinger, Brierley, Medford, Growdon & Corkin 2002
  (*Emotion* 2:118 — verified: item preserved, context lost);
  Kensinger et al. 2003 (*Emotion* 3:239 — modulation intact
  35–85); Kensinger, Brien et al. 2008 (*J Gerontol B* 63:P13 —
  arousal-gated positivity).
- Maillet & Schacter 2016 (*Neuropsychologia* 80:142 review +
  *Psychol Aging* SDT/SIT — both verified); Jordano et al.
  2019 MW meta (*Psychol Aging* — verified large effect).
- Aslan & Bäuml 2012 (*Psychol Aging* 27:1027 — verified:
  young-old intact, old-old inefficient); Aslan, Bäuml &
  Pastötter 2007 (*Psych Sci* 18:72); Ortega, Gómez-Ariza,
  Román & Bajo 2012 (lighter-DA kills RIF in old); listwise-DF
  ~75 pivot (Bäuml-group).
- Sargent et al. 2013 (*Cognition* 129:241 — verified: unique
  variance claim, n=208); Zacks, Speer et al. 2006; Kurby &
  Zacks 2011; Bailey, Kurby, Giovannetti & Zacks 2013.
- Rubin & Schulkind 1997a (*Mem & Cogn* 25:859 — verified:
  bump+power distribution, RT flat); Rubin & Schulkind 1997b
  (*Psychol Aging* 12:524 — verified: 70yo importance →
  20–30 decade).
- Tse, Balota & Roediger 2010 (*Psychol Aging* — verified:
  no-feedback crossover, feedback restores); Balota, Duchek,
  Sergent-Marshall & Roediger 2006 (expanded>equal in aging+AD).
- Dodson, Bawa & Krueger 2007 (*Psychol Aging* 22:122 —
  verified: matched-accuracy monitoring impairment,
  recollection-specific); Dodson, Bawa & Slotnick 2007
  (*JEP:LMC* 33:169 — verified: illusory-recollection model
  absorbs source d' deficit); Dodson & Krueger 2006
  (*PB&R* 13:770).

## 93. Probes P545–P554 (v53 — emotional-memory V)

- **P545 anticipatory trace (MUST):** flag an event `anticipated`,
  run 7 dwell ticks, then encode the real event with a milder
  affectSeries: BOTH traces must exist (imagined + event), the
  anticip trace must show drift on its verbatim fields, and a
  mismatch record must mint when |Δtag|>0.4. FAIL if the anticip
  record merges into or replaces the real one (locked no-merge).
- **P546 betrayal phenotype (MUST — sign-lock):** matched negative
  events, perpetrator trust 0.8 vs 0.2: high-trust arm must show
  HIGHER arousal_tag, THINNER verbatim, LOWER voluntary-recall rate,
  and HIGHER ambientScan intrusion rate. After trust→0.1 collapse +
  30d, voluntary recall rises ≥1.5× while arousal_tag is unchanged.
  FAIL if betrayal produces amnesia — records must remain reachable
  (avoidance, never erasure; McNally-side null locked).
- **P547 vicarious acquisition (MUST):** direct victim, present
  witness, hearsay recipient of the same arousal-0.9 event:
  conditionedAffect ordering direct > witness > instructed >
  control; witness mints `witnessed:true` episodic record;
  instructed mints NO episodic record (locked).
- **P548 emotional dream draw (SHOULD):** dream mints over-sample
  high-arousal recent records (≥2× uniform) and skew negative at
  ~dream_neg_bias; forced mood<0 deepens the skew ~2×. FAIL if
  draw is uniform or purely world-supplied.
- **P549 shame/guilt split (MUST):** matched self-caused negative
  events tagged shame vs guilt: shame → lower voluntary recall +
  higher intrusion + observer-perspective emissions ≥2× base;
  guilt → higher rehearsal + rising amends_urge. FAIL on identical
  retrieval ecology.
- **P550 forgiveness thaw (MUST — direction lock):** forgive swept
  0→1 cuts rehearsal/intrusion of offender-linked records ~70%
  while strength/decay/tag profiles are unchanged; forgive held at
  0 with forced rehearsals must drift forgive downward (rumination
  drives unforgiveness — McCullough direction locked, never the
  reverse-primary).
- **P551 nostalgia regulation (SHOULD):** C.mood = −0.5 → ambient
  draws over-select old positive people-rich records; a nostalgic
  emission raises C.mood ≥0.05 after clamp; non-nostalgic
  emissions show no lift.
- **P552 mood-congruent fill (MUST):** same decayed record under
  C.mood −0.6 vs +0.6 → confabulated field valence signs differ
  matching mood; low-arousal context raises lure_accept vs
  high-arousal (criterion leg, both directions of mood_crit_shift).
- **P553 inertia (SHOULD):** emo_inertia 0.8 vs 0.1 under identical
  mood inputs → mood-congruent retrieval bias persists ≥3× as many
  ticks after the input ends; resilient (low) arm resets within
  ~2 ticks.
- **P554 repetition habituation (MUST):** five identical-signature
  conflicts → instance-5 arousal_tag < instance-1 by ≥
  rep_habit_k×4; script node gains rep_script_gain each time;
  instance-6 at arousal 0.85 resets n_recur and mints at full
  strength (locked escalation exception).

Registry: P1–P554. v53 suite: P545–P554 (7 MUST, 3 SHOULD).

## 94. Sources verified this version (P545–P554 backing)

- Van Boven & Ashworth 2007 (*JEP:G* 136:289 — verified: five
  experiments, anticipation > retrospection across positive/
  negative/routine/hypothetical events, mental simulation
  mediates); Shepperd & McNulty 2002 (expectation gap →
  relief/disappointment — mismatch-record basis).
- Freyd 1994 (*Ethics & Behavior* 4:307 — betrayal trauma theory);
  Freyd, DePrince & Zurbriggen 2001 (*J Trauma Dissoc* 2:5 —
  memory reports depend on victim-perpetrator relationship);
  Lindblom & Gray 2009 (detail deficit attenuates under avoidance
  controls); McNally 2007 (*Memory* critical appraisal — no
  convincing amnesia evidence → conservative implementation).
- Olsson & Phelps 2007 (*Nat Neurosci* 10:1095 — verified: social
  fear learning shares conditioning circuitry); Olsson, Nearing &
  Phelps 2007 (*SCAN* 2:3 — verified: observational fear engages
  amygdala, can match direct experience); Phelps et al. 2001
  (*Nat Neurosci* 4:437 — instructed-fear route).
- Valli et al. 2008 (*Cogn Emot* — verified: dream threats more
  frequent/severe than matched real events; current dream threats
  resemble PAST real threats — negative bias real, not sampling);
  Pesant & Zadra 2006 (*J Clin Psychol* — verified: PWB↔dream
  content, longitudinal); Domhoff 2003/Schredl reviews (continuity
  hypothesis — verified selective, mundane underrepresented).
- Tangney et al. 1996 (*JPSP* 70:1256 — verified: shame/guilt/
  embarrassment phenomenologically distinct); D'Argembeau-group
  *Memory* 2023 (10.1080/09658211.2023.2260571 — verified: shame →
  pronounced observer perspective, shame>guilt negative affect);
  Conway-extension shame study (2023 — shame events' post-event
  symptom cluster incl. intrusions+avoidance).
- McCullough, Bono & Root 2007 (*JPSP* 92:490 — verified: three
  longitudinal studies, rumination↑ → forgiveness↓ direction
  stronger, anger not fear mediates); McCullough et al. 2001
  (*PSPB* 27:601 — vengefulness↔rumination).
- Wildschut et al. 2006 (*JPSP* 91:975 — verified: nostalgia ↑
  positive affect, self-regard, connectedness; redemptive
  self-central narratives); Routledge et al. 2011 (*JPSP* 101:638
  — verified: meaning threat triggers nostalgia, nostalgia
  restores meaning via connectedness, buffers threat→wellbeing).
- Ruci, Tomes & Zelenski 2009 (*Cogn Emot* 23:1153 — verified:
  mood-congruent DRM lures intrude more + more "remember"
  judgments); Corson & Verrier 2007 (verified: low-arousal mood →
  liberal false recognition regardless of valence).
- Kuppens, Allen & Sheeber 2010 (*Psychol Sci* 21:984 — verified:
  inertia elevated in maladjustment, prospective depression link);
  Koval, Kuppens, Allen & Sheeber 2012 (*Cogn Emot* 26:1412 —
  verified: rumination + inertia independently predict
  depression); Koval et al. 2013 (*Emotion* 13:1132 — verified:
  inertia/variability separation).
- J. Neurosci. 2025 recurring emotional events (e2406232025 —
  verified: first-encounter amygdala + neocortical pattern
  stability across repetitions drives the advantage); Fivush 1984
  (*Dev Psychol* — GER/script formation, instances go generic);
  Brewer 1986 (repeated-event recall generic dominance).

## 95. Probes P555–P565 (v54 — false-memory V, the arrival channels;
## false-memory.md Part V, spec v5.2)

- **P555 anchor incumbency (MUST):** first credible candidate on an
  empty field vs an equally-credible later competitor → first wins
  emission at a rate above the reverse-order control; the effect
  vanishes on fields holding a surviving verbatim (no vacancy, no
  anchor).
- **P556 debrief perseverance (MUST — sign-locked):** discredit an
  anchored candidate's source → emission drops to the
  persever_resid band, not zero, and re-corroboration re-elevates;
  a mechanism-explaining correction clears the anchor entirely.
  FAIL if an ordinary correction evicts.
- **P557 reversed testing (MUST — sign-locked):** recall of a
  record followed within test_window by a misleading account →
  p_adopt HIGHER than the no-recall control. FAIL if recall
  protects — the literature's direction is backwards from
  intuition.
- **P558 encode-time schema fill (MUST):** FIRST recall of a
  schema-rich event already emits expected-absent fields at
  ~exp_fill_p with witnessed phenomenology (normal confidence;
  discriminate mode lists provenance "schema", not confab).
- **P559 evidence gate (MUST):** identical claim as narrative vs
  presentEvidence → artifact arm implants at ≥1.5× and bypasses
  plaus_min (implausible+proven implants where
  implausible+unproven dies); retro_evid candidates appear on
  encoding-condition fields.
- **P560 reason mint (SHOULD):** a never-probed "why" produces a
  fluent, normal-confidence, schema-consistent answer on first
  ask; the same answer repeats stably thereafter (anchored
  confabulation invented once).
- **P561 fiction channel (SHOULD):** story-framed misinfo lands at
  ~fic_penalty of unframed rate but far above zero on semantic
  fields; absorbed claims show fic_known_prior fluency on first
  emission.
- **P562 genealogy (MUST):** believe_p after three tellers sharing
  one origin ≈ single-teller; three independent-origin tellers
  materially higher. FAIL if teller count alone moves believe_p.
- **P563 re-appraisal (MUST — sign-locked):** flipping the event's
  current outcome appraisal shifts emitted emoTag toward it at
  ~reappr_k while emoTag_stored is ledger-identical; trauma:true
  flat. FAIL if the stored tag mutates.
- **P564 yield/shift decorrelation (SHOULD):** yield 0.6/shift 0.1
  accepts presupposing accounts but does not flip under pure
  negative feedback; the inverse profile shows the reverse; a
  GSS-style two-stage probe recovers the two factors from
  behavior.
- **P565 intention completion (SHOULD):** routine intentions
  dwelled on without firing emit "did it" claims at
  ~intent_done_p·dwells; act-monitored encodings suppress to ~0;
  fired intentions re-fire at ~comm_err_p under fatigue.

Registry: P1–P565. v54 suite: P555–P565 (7 MUST, 4 SHOULD).

## 96. Sources verified this version (P555–P565 backing)

- Ross, Lepper & Hubbard 1975 (*JPSP* 32:880 — verified: false
  feedback impressions persevere after full discrediting, actors
  AND observers; only process debriefing removes them).
- Chan, Thomas & Bulevich 2009 (*Psychol Sci* 20:66 — verified:
  immediate cued recall increases later misinformation adoption,
  both age groups; "reversed testing effect"; DOI
  10.1111/j.1467-9280.2008.02245.x).
- Brewer & Treyens 1981 (*Cogn Psychol* 13:207 — verified:
  schema-expected absent objects falsely recalled; expectancy
  predicts false inclusions; DOI 10.1016/0010-0285(81)90008-6);
  Lampinen, Copeland & Neuschatz 2001 (*Mem Cognit* 29 —
  schema-consistent false recalls carry "remember" judgments).
- Wade, Garry, Read & Lindsay 2002 (*Psychon Bull Rev* 9:597 —
  verified: doctored childhood photo → 50% complete/partial false
  memories over three sessions; DOI 10.3758/BF03196318).
- Nash & Wade 2009 (*Appl Cogn Psychol* — verified: doctored
  video of own "cheating" → confessions, internalization,
  confabulation vs told-video controls); Nash, Wade & Lindsay
  2009 (*Mem Cognit* 37:414 — verified: evidence and imagination
  each distort; combined additive/superadditive).
- Kassin & Kiechel 1996 (*Psychol Sci* 7:125 — verified: false
  incriminating evidence → signed confessions, internalized
  guilt, confabulated memory details; DOI
  10.1111/j.1467-9280.1996.tb00344.x).
- Nisbett & Wilson 1977 (*Psychol Rev* 84:231 — verified
  canonical: fluent confident causal self-reports dissociated
  from operative causes).
- Marsh, Meade & Roediger 2003 (*J Mem Lang* 49:519 — verified:
  story misinformation produced on general-knowledge tests >35%
  vs <10% baseline; persists 1 week; "knew it before"
  misattribution; DOI 10.1016/S0749-596X(03)00092-5); Marsh,
  Balota & Roediger 2005 (aging/DAT arm — verified).
- Meade & Roediger 2002 (*Mem Cognit* 30:995 — verified:
  contagion persists under warning and source-monitoring tests;
  repetition- and schema-consistency-dependent); Roediger, Meade
  & Bergman 2001 (*Psychon Bull Rev* 8:365 — verified: paradigm;
  15s encoding + schema-consistent lures worst; "know" >
  "remember" reports).
- Levine 1997 (*JEP:G* 126:165 — verified: recalled emotions
  distort toward current appraisals, Perot-supporter panel);
  Levine & Bluck 1997 (older-adult arm — verified).
- Gudjonsson 1984/1997 (GSS — verified: Yield vs Shift factorial
  split); Otgaar-line source-identification work (*Br J Psychol*
  2012 — verified: Yield mixes internalization+compliance; Shift
  mostly compliance).
- Albarracín et al. 2020 (*PSPB* 47:38 — verified: five studies,
  mundane intentions misremembered as enacted; similarity grows
  confusion; act-monitoring rescues; DOI 10.1177/0146167220929203);
  Scullin, Bugg & McDaniel 2011 (*Psychol Aging* 27:46 —
  verified: ~25% PM commission errors; DOI 10.1037/a0026112).

## 97. Probes P566–P577 (v55 — individual-differences V, the
## lived-in mind; individual-differences.md Part V, spec v5.3)

- **P566 ego ledger (MUST — sign-locked):** two characters co-do a
  chore event; self_srv=+1.5 vs −1.5 both recall own-contribution
  fields denser, but the +1.5's other-actor fields are thinner;
  summing the two reports' responsibility shares exceeds 100%
  (Ross & Sicoly signature); solo-event recall identical across
  traits (null half).
- **P567 flat-and-fluent (MUST — both signs):** alexith=+1.5 records
  carry ~30% thinner emoTag detail on emotional events AND answer
  "how did you feel" probes with fluent confabulated affect at
  near-normal confidence; neutral-event records within jitter; a
  *silent* alexith (no confabulated answer) or a globally-vague one
  both fail.
- **P568 filter leak, storage intact (MUST — sign-locked):**
  media_m=+1.5 shows elevated plist-suppression leakage and
  source_confuse under competing-representation paradigms while
  hit-rate on single-channel attended material and beta_* decay
  curves match baseline within jitter — a general memory deficit
  fails the probe (Ophir's effect is filtering).
- **P569 adversity targets control (MUST — sign-locked):**
  early_adv=1.5 shifts wmc-side params (misinfo, source_confuse,
  plist_suppress, stress_retrieve_loss) while enc_base/beta_* on
  neutral material stay within jitter — a storage deficit fails
  (Evans 2009's pathway is control).
- **P570 variance not level (MUST — null-locked):** circ_irr=+1.5 vs
  0 at matched mean sleep/chronotype: day-level peak_hour and
  sleepFactor dispersion ~1.5× wider, but 30-day mean retrieval
  performance within jitter — a mean deficit fails.
- **P571 pain is a now-tax (MUST — sign-locked):** pain_state=0.6
  during encoding → attended-E reduced ~pain_tax and routine
  omit_p up; recall of records encoded pre-pain at baseline;
  pain_state→0 next day → full recovery with no residual decay
  delta — any retrograde or residual effect fails.
- **P572 load spends monitoring (MUST):** identical pm_self profile
  under task_load 0 vs 0.8 → intention-execution miss rate rises
  ~task_load_cost; non-PM attended encoding and stored strengths
  identical; lifting the load restores baseline same-window.
- **P573 musician lock (MUST — sign-locked):** music=+2 shows
  verbal-channel enc advantage on spoken-word records with
  visual/spatial records within jitter (Chan 1998's own null is
  the bound).
- **P574 rosy arc ordering (SHOULD — sign-locked):** same event,
  rosy=+1.5: anticip trace valence > in-event emoTag valence <
  7-day-later recalled valence (the three-point ordering);
  negative-field drift faster than positive-field; fact fields
  unchanged (Mitchell 1997).
- **P575 birth-order honesty lock (MUST — null-locked):** 200
  character draws, birth_order ∈ {1st..4th} randomized vs pinned:
  all MemoryParams pairwise-correlated with birth_order at |r|<0.05
  — ANY systematic loading fails. The probe exists so a future
  "middle-child" tweak lands as a *decision*, not a drift.
- **P576 alexithymia FAB (SHOULD):** alexith=+1.5 shows reduced
  fading-affect bias — negative emoTag strength at +30d closer to
  birth value than alexith=−1.5 (Muir 2016).
- **P577 compound ledger (SHOULD):** self_srv=+1.5 × rosy=+1.5
  character retells a shared chore as both own-heavier AND
  warmer — the two operators compose without interaction term
  (additivity audit; a super-additive compound flags a bug).

## 98. Sources verified this version (P566–P577 backing)

- Ross & Sicoly 1979 (*JPSP* 37:322 — verified canonical: married
  couples'/roommates'/teams' responsibility estimates sum >100%;
  asymmetric availability of own contributions; DOI
  10.1037/0022-3514.37.3.322).
- Vermeulen & Luminet 2009 (*PAID* 47:305 — verified: alexithymia
  memory deficit concentrated on emotional words); Luminet et al.
  2005 (*J Res Pers* 40:713 — levels-of-processing: shallow affect
  encoding, not retrieval block); Muir, Madill & Brown 2016
  (*Cogn Emot* 31:1392 — reduced fading-affect bias in high
  alexithymia); systematic review PMC6497026 2019 (explicit
  emotional memory reduced, neutral intact); Camia, Desmedt &
  Luminet 2020 (narrative elaboration of negative events
  impoverished; specificity spared — small-N qualitative).
- Ophir, Nass & Wagner 2009 (*PNAS* 106:15583 — verified canonical:
  heavy media multitaskers worse at filtering/task-switching, not
  better at juggling; DOI 10.1073/pnas.0903620106); Cain & Mitroff
  2011 (distractor-filtering deficit replicated); Uncapher et al.
  2016 (*Psychon Bull Rev* — more mind-wandering, worse episodic
  task performance); Uncapher & Wagner 2018 review (cost runs
  through encoding attention, not storage).
- Evans & Schamberg 2009 (*PNAS* 106:6545 — verified: childhood
  poverty duration → adult WM capacity via allostatic load;
  survives income mobility; DOI 10.1073/pnas.0811910106); Lupien
  et al. 2009 (maternal SES/care → adult hippocampal volume);
  Evans et al. 2007 (stress-physiology mediation).
- Cho 2001 (*Nat Neurosci* 4:567 — verified direction: chronic jet
  lag → temporal-lobe/cognitive deficits in aircrew; magnitude
  DEBATED); Costa 2010 (shift-work review — sleep fragmentation
  the dominant pathway).
- Moriarty, McGuire & Finn 2011 (*Prog Neurobiol* 93:385 —
  verified: chronic pain impairs attention/executive/memory via
  continuous attentional demand); Berryman et al. 2013 (*Pain*
  meta — verified via PubMed 27583141: d ≈ −0.31..−0.57 on
  WM/verbal learning, test-dependent).
- Marsh & Hicks 1998 (*JEP:LMC* 24:350 — verified: event-based PM
  degrades under ongoing-task demands; intention intact,
  monitoring spent; DOI 10.1037/0278-7393.24.2.350); Einstein &
  McDaniel program (DA costs focal-task dependent).
- Chan, Ho & Cheung 1998 (*Nature* 396:128 — verified: childhood
  music training → better verbal memory, visual null t=1.00 n.s.;
  DOI 10.1038/24075); Ho, Cheung & Chan 2003 (child arm replicates
  the verbal/visual split).
- Mitchell, Thompson, Peterson & Cronk 1997 (*JASP* 27 — verified:
  rosy-view three-point arc; anticipated > experienced <
  remembered evaluations across event types).
- Rohrer, Egloff & Schmukle 2015 (*PNAS* 112:14224 — verified:
  N=20,186, three national panels, no birth-order effects on
  extraversion/stability/agreeableness/conscientiousness/
  imagination; ~0.1 SD intelligence tilt only; DOI
  10.1073/pnas.1506451112); Damian & Roberts 2015 concur.

Registry: P1–P577. v55 suite: P566–P577 (8 MUST, 4 SHOULD — P575
is the first null-locked honesty probe in the registry).
