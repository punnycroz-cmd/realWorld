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

## 99. Probes P578–P589 (v56 — social-memory V, who keeps whom)

- **P578 person-semantics gate (MUST — sign-locked):** name
  production fails at ≥2× the rate of occupation/role production
  for the same persons at matched delay; names never out-produce
  semantics (tier-3 roll gated on tier-2.5 access). Meaningful-
  name advantage replicates (Baker < baker gap closes).
- **P579 spotlight asymmetry (MUST — sign-locked):**
  expectOtherRecall for self-events exceeds witnesses' actual R
  by ≥1.5× mean; scripted witness recall failure mints offense
  at ≥spot_offense_p; zero mint on successful recall. FAIL if
  expected≈actual — calibration is the bug.
- **P580 promise asymmetry (MUST — sign-locked):** creditor-side
  breach detection ≥1.4× debtor-side fulfillment-cue rate at
  equal delay; task_load degrades debtor resolution, leaves
  creditor detection intact. FAIL on sign flip.
- **P581 hidden-profile starvation (MUST):** all-held records
  surface ≥3× solo-held in 4-member discussion; 30-day retention
  gap widens (compounding, not just sampling); solve-set framing
  cuts the ratio ≥40%.
- **P582 truth-default + residue (MUST — two arms):** believe_p
  ≥ truth_def_bias absent triggers with NO demeanor/cue param
  (locked null); after one confirmed lie, speaker's TRUE later
  accounts show reduced believe_p for weeks while others are
  unaffected.
- **P583 co-presence fill (SHOULD):** attendee reconstruction
  inserts routine-regular false positives at ≥copres_schema_fill;
  one-timers dropped first; out-group under-counted at matched
  true presence.
- **P584 keeper allocation (SHOULD):** keeper=+1.5 concentrates
  relational Intention mints ≥2×; keeper removal drops others'
  relational PM to uncued pm_self rates.
- **P585 liar's ledger (MUST — two arms, sign-locked):** deny
  degrades denied-field detail below suppressed-not-denied AND
  degrades source memory of the denial; fabricate mints
  src-flagged records whose flag decays while fluency grows —
  flag death → unmarked believe_p competition. FAIL if the two
  lie types share a code path.
- **P586 exclusion heat (SHOULD):** exclusion:true encodes above
  matched negative-social, decays slower; reconstructed scope >
  encoded breadth; post-exclusion ambiguous omissions re-tag at
  ostrac_vigil.
- **P587 H-DAP gate (MUST — boundary-locked):** high-arousal
  zero-disruption event mints no anchor, no dating gain;
  high-disruption moderate-arousal mints anchor + ≥20% σ
  reduction on same-era dateEstimate.
- **P588 moral revision asymmetry (MUST — sign-locked):** one
  moral-negative act outweighs three matched moral-positive;
  ability updates symmetric within 20%; post-threshold repair
  requires ≥moral_repair_k× evidence mass.
- **P589 compound social ledger (SHOULD):** debtor-forgetful +
  spotlight-anchored + keeper-absent composes without
  interaction terms (additivity audit across §§6.89–6.94).

## 100. Sources verified this version (P578–P589 backing)

- McWeeny, Young, Hay & Ellis 1987 (*BJP* 78:143 — verified:
  surname recall loses to occupation recall under equated
  conditions — "Baker vs baker"); Cohen 1990 (*BJP* 81:287 —
  verified: names ≈ meaningless non-words, worse than meaningful
  possessions/occupations; meaningfulness manipulation flips the
  deficit); Stanhope & Cohen 1993 (*BJP* 84:51 — verified:
  serial-access model survives modified; distinctive names learn
  faster); Cohen & Faulkner 1986 (proper-name retrieval age
  differences); Bruce & Young 1986 (semantics-before-name
  architecture).
- Gilovich, Medvec & Savitsky 2000 (*JPSP* 78:211 — verified, 5
  studies: ~2× overestimate of observer notice; anchoring +
  insufficient adjustment; DOI 10.1037/0022-3514.78.2.211);
  Gilovich, Savitsky & Medvec 1998 (illusion of transparency).
- Greenberg & Westcott 1983 (indebtedness — obligation
  availability); Ross & Sicoly 1979 (asymmetric availability of
  own contributions — reused anchor for the creditor/debtor
  asymmetry, sign marked HYPOTHESIS).
- Stasser & Titus 1985 (*JPSP* 48:1467 — verified: biased
  sampling of shared info; DOI 10.1037/0022-3514.48.6.1467);
  Stasser, Taylor & Hanna 1989 (shared-content dominance in
  discussion); Stasser et al. 1992 (*JPSP* 63:426 — verified:
  solve 67% vs judge 35% hidden-profile discovery).
- Levine 2014 (*J Lang Soc Psych* 33:378 — verified TDT: belief
  default, trigger-gated suspicion, cue-reading is the failed
  path); Bond & DePaulo 2006 (*Pers Soc Psych Rev* 10:214 —
  verified meta, 206 studies/24,483 judges: 54% overall, 61%
  truths vs 47% lies).
- Simons & Levin 1998 (*Psychon Bull Rev* 5:644 — verified: ~50%
  partner-swap miss, social-group moderation).
- Rosenthal 1985 (*J Marriage Fam* 47:965 — verified: >half of
  families name kinkeeper, ~3/4 women, ~20y median tenure,
  mother→daughter; DOI 10.2307/352340).
- Otgaar & Baker 2018 (*Memory* 26:2 — verified MAD framework);
  Otgaar, Howe, Smeets & Wang 2016 (*JARMAC* 5:168 — verified
  DIF: own denials undermine memory, external denials undermine
  belief); Otgaar et al. 2014 (fabrication vs denial source
  memory split); Pickel 2004 (*Memory* 12:14 — self-generated
  misinformation becomes truth).
- Williams 2007 (ostracism need-threat review); Williams & Nida
  2011; Eisenberger, Lieberman & Williams 2003 (*Science*
  302:290 — dACC social-pain overlap).
- Brown, Lee, Krslak, Conrad, Hansen, Havelka & Reddon 2009
  (*Psych Sci* 20:399 — verified: public events anchor
  autobiographical dating ONLY when directly disruptive;
  Bosnian war + Izmit earthquake yes, 9/11-for-Americans no;
  DOI 10.1111/j.1467-9280.2009.02307.x); Brown & Lee 2010
  (living-in-history project overview — H-DAP mechanism).
- Mende-Siedlecki, Baron & Todorov 2013 (*J Neurosci* 33:19406
  — verified: diagnostic-value asymmetric updating, morality vs
  ability); Brambilla et al. 2019/2021 (moral character
  dominates impression updating); Reeder & Brewer 1979
  (hierarchical schema asymmetry); Skowronski & Carlston 1987
  (negativity canon).

Registry: P1–P589. v56 suite: P578–P589 (8 MUST, 4 SHOULD —
P582 carries a locked null on the demeanor channel; P585
sign-locks the denial/fabrication split).

## 101. Probes P590–P601 (v57 — formal-model VI, the content algebra,
## the ensemble layer, and the canonical form; formal-model.md Part VI,
## spec v5.5)

All machinery probes — zero psychology under test. Every one is
defined over the seed-ensemble distribution per §36 probe semantics.

- **P590 rewrite auditability (MUST):** 10⁴ fuzzed op sequences;
  every content delta on every record carries `lastRewrite` ∈ the
  §13.1/§45.2 catalog with legal operand tiers. Orphan rewrite =
  FAIL (`orphan_rewrite = 0`, locked).
- **P591 verbatim conservation (MUST — boundary-locked):** the V-tier
  field multiset is monotone non-increasing post-commit across all
  fuzzed runs; hearsay/imagination copies land G-tier; any rule
  emitting V = FAIL (`verbatim_mint = 0`, locked).
- **P592 rumor coverage calibration (MUST — quantitative):** rumor
  seeded in one venue on the world contact graph; terminal knower
  fraction inside the mean-field band `0.797 ± mix_band` corrected by
  `mix_correct`, ≥200 seeds, Wilson CI on the coverage estimate.
  FAIL decomposes to the responsible p_tx factor via P598 before any
  debugging begins.
- **P593 Jensen discipline (MUST — meta):** registry verdicts cite
  parameter-joint ensembles only; a probe verdict computed at E[θ]
  is inadmissible. Harness-side check: verdict records carry the
  ensemble descriptor; mean-param runs logged diagnostic-only
  (`meanfield_drive = 0` for spread prediction as well).
- **P594 canonical hash (MUST):** canonHash invariant under field
  insertion-order and set-order permutations; NaN/−0 rejected at
  canonSerialize; same-build runs bit-identical, cross-port deltas
  within `fp_tol` and only under declared port-comparison mode.
- **P595 lazy-decay equivalence (MUST):** materialize-on-read R vs
  daily-stepped R within `fp_tol` on the golden corpus; every
  lifecycle transition identical (no FSM decision flips).
- **P596 approximation license (SHOULD):** each declared `op̃`
  preserves I1–I12, keeps probe statistics within `approx_tol`, and
  matches canonical RNG stream consumption (draw-count parity per
  opTag). Undeclared approximation detected = FAIL.
- **P597 correction half-life (SHOULD — sign-locked):** a trusted
  correction halves the doubter fraction at `τ_corr` strictly greater
  than the original rumor's `τ_rumor`; residual inference asymptotes
  at ≥ `cie_residual`, never 0 — the correction is remembered and
  the misinformation still leaks.
- **P598 transmission decomposition (SHOULD):** simulated dyad data
  recovers the four p_tx factors (retrieve/emit/encode/adopt) within
  the §4 identifiability bounds; an unrecoverable factor flags a
  param that isn't real.
- **P599 stifler extinction (SHOULD):** with `R_eff < 1` (records die
  faster than transmission), coverage saturates and the rumor
  extincts — never sustained spread on dead records.
- **P600 grammar operand legality (MUST):** fuzz the catalog itself:
  ρ_mrg never outputs V and only reads live sub-salience inputs;
  ρ_sub never targets V; ρ_emb writes G only; T-tier steps bounded
  per G4; beliefStatus transitions ∈ §28 FSM.
- **P601 canon round-trip (SHOULD):** deserialize(canonSerialize(S))
  ≡ S bit-identical including rngState; snapshot→migrate→snapshot
  lossless on C/M tiers (E-tier exempt per I7).

## 102. Sources verified this version (P590–P601 backing)

- Daley & Kendall 1965 (*J Inst Maths Applics* 1:42 — verified via
  citation record: stochastic rumours, the ign/spreader/stifler
  partition; the 1964 Nature 204:171 note is the popular version);
  Maki & Thompson 1973 (*Mathematical Models and Applications*,
  Prentice-Hall — verified: the initiator-only removal variant our
  retell-saturation channel maps to); Sudbury 1985 (*J Appl Prob*
  22:443 — verified abstract: never-hear fraction converges in
  probability to ≈0.203 as N→∞; DOI 10.2307/3213787); Pittel 1990
  (*J Appl Prob* 27:14 — DK variant analysis).
- Hirst & Echterhoff 2012 (*Annu Rev Psychol* 63:55 — verified:
  conversational remembering reshapes speaker memory; SS-RIF,
  audience tuning, social contagion, propagation across networks;
  DOI 10.1146/annurev-psych-120710-100340); Higgins & Rholes 1978
  (*JESP* 14:363 — verified: saying-is-believing, audience-tuned
  message becomes remembered content; DOI
  10.1016/0022-1031(78)90032-X); Echterhoff, Higgins & Groll 2005
  (*JPSP* 89:257 — shared-reality mediation of the tuning bias);
  Coman, Manier & Hirst network-propagation line (PMID 21910558 —
  RIF/practice effects propagate transitively through conversations).
- Bartlett 1932 (*Remembering* — reconstructive canon behind G1);
  Loftus post-event line (verbatim non-renewability); Koriat &
  Goldsmith 1996 (*Psych Rev* 103:490 — output is controlled
  reconstruction, the metamemory basis for treating emitted content
  as rewrite output, not readout).
- Goldberg 1991 (*ACM Comput Surv* 23:5 — FP canon); Monniaux 2008
  (*ACM TOPLAS* 30:12 — verified: treating FP as reals is unsound;
  ordered-reduction requirement); Burger & Dybvig 1996 (shortest
  round-trip printing); Lamport 1978 (reused — total-order
  construction from §36).

Registry: P1–P601. v57 suite: P590–P601 (7 MUST, 5 SHOULD —
three locked nulls: verbatim_mint, orphan_rewrite, meanfield_drive).

## 103. Probes P602–P614 (v58 — character-profiles V, the self layer)

- **P602 consistency gate (MUST — sign-locked):** two characters,
  identical negative-central feedback records, differing only in
  `self_est` (0.3 vs 0.8). Low-self_est character: negative-consistent
  feedback recalls ≥ positive-central control (mnem_neg released by
  `selfverif_w·selfCongruent`); high-self_est character: classic MNE
  (negative-inconsistent < all controls). Recognition on the same
  records shows NO effect in either profile — the recall-only boundary
  is re-locked (Green, Sedikides & Gregg 2007).
- **P603 spillover divisor (MUST):** identical domain-failure event
  stream into characters at self_complex ∈ {2, 4, 8}; measured
  cross-domain mood bleed scales ~1/max(2,self_complex) within
  tolerance; self_comp 0.9 vs 0.1 separates NEGATIVE cross-aspect
  spread while positive spread is unchanged (Showers asymmetry).
- **P604 uplift moderation (SHOULD — DEBATED-flagged):** per
  Rafaeli-Mor & Steinberg 2003, self_complex's moderation of affect
  response is at least as strong for UPLIFTING events as for adverse
  ones; a build where the buffer works only on negatives fails the
  hypothesis-check (the original Linville buffering claim is not
  required to pass).
- **P605 repressor phenotype (MUST):** characters at repress ≈ 0.8 vs
  ≈ 0.0: fewer negative childhood recalls, earliest negative memory
  older by ≥ `repr_neg_shift·0.6`, negative-retrieval latency up,
  positive channels unchanged; recognition probes on the suppressed
  records identical (Davis 1990); `repr_erase_null` — record store
  count and content bit-identical to a zero-repress control (doors
  shut, archive whole).
- **P606 reminiscence diet (SHOULD):** 55+ characters run 180-day idle
  cycles per remin_style; accessible-pool valence skews negative for
  obsessive, positive for escapist; integrative raises §4.23 persSem
  mint count; transmissive biases emissions to younger listeners.
  remin_w 0 produces ordinary retell ecology.
- **P607 regret crossover (MUST — sign-locked):** matched action and
  inaction regret records: action regret's accessibility exceeds
  inaction early (window ≤ ~14 days), inaction exceeds action late
  (window ≥ ~180 days) — the Gilovich & Medvec temporal pattern, not
  either half alone.
- **P608 opportunity gate (SHOULD):** an inaction regret with
  `oppOpen:true` reopens at cue strength on a matching-choice event;
  flipping `oppOpen:false` accelerates decay ×1.5 at
  regret_opp_gate=1 and does nothing at 0 (rumination lock).
- **P609 positive valves (MUST):** savor_k 0.8 vs dampen_k 0.8 on
  identical positive-event streams: savorer's positive records encode
  stronger, rehearse more, and fade slower; dampener's thin but are
  PRESENT (encoded, not absent) — and accuracy metrics identical in
  both arms.
- **P610 debtor-future-self (SHOULD):** long-horizon Intentions
  (>90d) minted at future_cont 0.2 vs 0.8: the low-continuity
  character's intentions behave as §6.90 debtor-class (cue-bound,
  breach-surprise phenotype); high-continuity rides pm_self.
- **P611 elaborator's dyad (SHOULD):** shared episodes co-encoded
  with elabor 0.9 vs 0.1 partner: BOTH parties' records gain detail-
  field density ∝ elabor_dyad_gain, while raw-item count still shows
  §6.69 collaborative inhibition — deeper, not longer lists.
- **P612 locked nulls (MUST):** se_accuracy_null — varying self_est
  0.15→0.95 changes selection/valence/perspective metrics but moves
  zero accuracy measure; sc_capacity_null — self_complex changes no
  store capacity or fidelity; repr_erase_null — see P605.
- **P613 epoch boundary (SHOULD):** a bible-declared identity-change
  event marks `selfEpoch`; pre-boundary records acquire
  `selfDiscrepant` per §5.39 → observer-perspective emission rate
  rises on old-self records only; post-boundary records unaffected.
- **P614 self_est ≠ metamemory (MUST — null-lock):** the generator
  must NOT correlate `self_est` with `SelfModel.self_est.global`
  beyond the MVN residual — pin self_est ±2σ and verify the
  metamemory estimate stays in its own distribution; the two "self
  estimates" are different channels and conflating them is a
  compile-time FAIL.

## 104. Sources verified this version (P602–P614 backing)

- Sedikides & Green 2000 (*JPSP* 79:906 — verified via 2016 review
  record): mnemic neglect as incongruence-negativity management;
  Green, Pinter & Sedikides 2004 (*EJSP* 35:225); Green, Sedikides &
  Gregg 2007 (*JESP* 44:547 — verified abstract: recall impaired,
  recognition unimpaired, ego-deflation boundary); Sedikides, Green
  & Pinter 2016 mnemic-neglect review (*EJoSP* — verified: repressors
  show ENHANCED mnemic neglect; anxiety/dysphoria moderators).
- Linville 1985 (*Soc Cogn* 3:94 — verified) & 1987 (*JPSP* 52:663 —
  verified); Rafaeli-Mor & Steinberg 2003 (*PSPR* 6:60 — verified
  abstract: weak buffering, moderation of uplifts); Showers 1992
  (*JPSP* 62 — compartmentalization).
- Weinberger, Schwartz & Davidson 1979; Davis & Schwartz 1987
  (*JPSP* 52:155 — verified abstract: fewer negative memories, older
  earliest negative); Davis 1995 (*J Abnorm Psychol* 103:288 —
  verified abstract: slower negative retrieval, free + cued recall);
  Davis 1990 (*Aust J Psychol* — recognition β unchanged, verified).
- Watt & Wong 1991 (*J Gerontol Soc Work* 16:37 + *Psych & Aging*
  6:272 — both verified abstracts: six types; successful-ager
  integrative/instrumental advantage).
- Gilovich & Medvec 1994 (*JPSP* 67:357) + 1995 (*Psych Rev* 102:379
  — both verified): action/inaction temporal regret pattern; Wrosch
  et al. regret-opportunity line (control theory).
- Bryant & Veroff 2007 (*Savoring* — verified); Feldman, Joormann &
  Johnson 2008 (*Cog Ther Res* — verified: RPA dampening scale,
  depression prediction); Wood, Heimpel & Michela 2003 (*JPSP*
  85:566 — verified: self-esteem gates savoring vs dampening);
  Joormann & Siemer 2004 (*J Abnorm Psychol* 113:179 — verified:
  happy-memory mood repair fails in dysphoria).
- Ersner-Hershfield, Wimmer & Knutson 2009 (*SCAN* 4:85 — verified)
  + Ersner-Hershfield, Garton, Ballard, Samanez-Larkin & Knutson
  2009 (*JDM* 4:280 — verified: continuity index predicts saving);
  Markus & Nurius 1986 (*Am Psych* 41:954 — verified).
- Fivush & Fromhoff 1988; Reese, Haden & Fivush 1993 — elaborative
  reminiscing style (developmental consensus; the adult-dyad
  extension is flagged HYPOTHESIS in §6.107).

Registry: P1–P614. v58 suite: P602–P614 (6 MUST, 5 SHOULD, 2 meta —
P612/P614 carry the three locked nulls and the trait-confusion ban).

## 105. Replication-graded anchoring (VA-REPL) — the anchor corpus
## gets honest about the replication crisis (new in v59)

§25.3's `replication tier` field was a start; this section hardens it.
The corpus's SINGLE tier silently trusts exactly the literature class
that failed most often under direct replication. The numbers are now
in the registry:

- **OSC 2015** (Open Science Collaboration, *Science* 349:aac4716 —
  verified): 100 studies, 36% of replications significant, replication
  effect sizes averaging **half** the originals (Mr 0.197 vs 0.403).
  → rule: any SINGLE-tier anchor's band is centered on the *replication*
  estimate when one exists, else on the original estimate shrunk toward
  the null by `rep_shrink = 0.5` and widened — never on the famous
  original number alone.
- **Camerer et al. 2018** (*Nat Hum Behav* 2:637 — verified): 21
  Nature/Science social-science experiments, 62% replicated, replication
  ES ≈ 50% of original, estimated true-positive rate 67%. Same ~0.5
  shrinkage from a different design class → `rep_shrink` = 0.5 is a
  defensible corpus default, not a guess.
- **RRR-failed effects are anchors with the sign flipped.** Hagger et
  al. 2016 (*Persp Psych Sci* 11:546 — verified: 23 labs, N=2,141,
  ego-depletion d = 0.04, CI [−0.07, 0.15]) means the model must NOT
  ship a willpower-resource depletion mechanism that produces d ≥ 0.3
  sequential-task depletion; if any trait/param reproduces the old
  textbook effect size, that is a FAIL, not a feature. Same discipline
  applies to Wagenmakers et al. 2016 facial-feedback RRR. **Negative
  anchors**: phenomena the battery asserts do NOT appear.
- **Grade names** (replacing/instantiating §25.3 tiers):
  `META` = meta-analytic consensus (full weight); `RRR` = passed a
  registered replication report (full weight); `MULTI` = ≥2 independent
  replications (light discount); `SINGLE` = one famous study
  (`rep_shrink` applied); `CONTESTED` = failed direct replication
  (usable only as a negative anchor; bands around zero).
- Bias-correction discipline: where the anchor is meta-analytic, prefer
  the *adjusted* estimate when the meta reports one (trim-and-fill,
  Duval & Tweedie 2000; PET-PEESE, Stanley & Doucouliagos 2014). An
  uncorrected meta estimate inherits a partial `rep_shrink`.
- Standing consequence for this corpus: misinfo adoption stays META
  (Loftus line replicates), DRM stays META-adjacent, but any anchor
  that only ever lived in one charismatic study (e.g., single-study
  priming effects) is demoted from MUST to OBSERVE at best.

## 106. The baseline ladder — what complexity must earn (VA-BASE)

Roberts & Pashler 2000 (*Psych Rev* 107:358 — verified: a good fit
shows nothing about what the theory *couldn't* fit) is the standing
warning: the spec has ~400 params now; anchor coverage alone cannot
justify them. The validator therefore maintains a **baseline ladder**
— nested stripped models run through the same battery:

| level | model | what it can't do |
|---|---|---|
| B0 | perfect store (no decay, no distortion) | forgetting, rumor drift |
| B1 | single exponential decay, no traits/channels | age bands, diversity |
| B2 | power-law decay + encoding E, no trait layer | per-character profiles |
| B3 | full spec | — |

- **Acceptance rule:** each rung must beat the rung below on anchor
  corpus coverage by a *named margin*: B3's trait layer must deliver
  the ICC-diversity anchors and the profile-distinctness checks that
  B2 structurally cannot; B2's decay shape must beat B1 on the
  savings-curve AIC anchor (Murre & Dros 2015 — power > exp).
- **Per-param justification:** a param that enters the spec must name
  ≥1 anchor or probe family it exists for (§24's constraint map,
  dual direction). Params whose only evidence is "plausible" are
  flagged `unearned` in the coverage matrix and are first candidates
  for removal in a model-reduction pass. (This is the Pitt & Myung
  2002 *Psych Bull* 128:362 lesson: model selection must weigh
  functional-form flexibility, not parameter count alone — we
  approximate it with the anchor-coverage margin, which is honest
  about being an Occam heuristic, not a formal criterion.)
- The ladder is also the deliverable for game-systems: if compute
  forces a downgrade, B2 is the declared degraded mode and the spec's
  degradation ladder names which observables it will miss.

## 107. Equifinality audit (VA-EQUI) — sloppy params are expected,
## not alarming

Gutenkunst et al. 2007 (*PLoS Comput Biol* 3:e189 — verified: sloppy
spectra universal; collective fits constrain predictions while leaving
individual params poorly constrained) + Beven's equifinality (2006,
hydrology) apply directly: with ~400 params and a few dozen anchored
statistics, **large flat directions in parameter space are guaranteed**.
Consequences, made binding:

- Validation targets the **identifiable manifold**, not the parameter
  vector. The §24 sensitivity screen computes the local Hessian/
  Fisher spectrum at each cast profile's operating point; eigenvalue
  spectrum is logged per release. Stiff directions (λ large) must map
  to anchors; sloppy directions (λ small, log-uniform tail) are
  *expected* and are licensed diversity — two mains may sit far apart
  in a sloppy direction and be observationally equivalent.
- **Diversity-within-equivalence rule:** cast profiles that differ
  only along sloppy eigendirections are legal (different people, same
  observable behavior — true to life). Profiles that differ along a
  *stiff* direction but produce identical observables are a harness
  bug or a spec over-parameterization — triage (b).
- **Never chase the "true" params.** SBC (§28) is re-scoped: recovery
  is required only on stiff directions; demanding full-vector recovery
  in a sloppy model would manufacture false confidence (the Gutenkunst
  corollary: complete precision on all params would need impossibly
  complete data).
- Practical probe consequence: per-param perturbation probes report
  which eigendirection they load on; a probe failing only because its
  target param sits in a flat direction is reclassified OBSERVE —
  the model is honest that the data can't see it.

## 108. Timescale validity (VA-TSCALE) — validate ratios, not hours

The lab literature's retention intervals are minutes-to-days inside
task paradigms; the sim's native clock is days. A naive mapping
("lab hour = sim day") breaks because some effects are scale-invariant
and some are anchored to physiology:

- **Scale-invariant effects** are validated on *ratios*: distributed-
  practice optimal ISI grows with retention interval (Cepeda et al.
  2006, *Psych Bull* 132:354 — verified: ISI and RI operate jointly;
  the optimum scales roughly proportionally). Probe spacing effects
  at ISI/RI ratios, not at absolute intervals — the model passes if
  the ratio-dependence holds at sim scale.
- **Physiology-anchored effects** keep absolute times: sleep
  consolidation is tied to the nightly tick (Jenkins & Dallenbach
  1924 replicates as "post-sleep retention advantage"), circadian
  variance (§6.x) is hour-of-day absolute. These are validated
  against the sim's day structure, not rescaled.
- **Sub-tick effects are out of scope by declaration**: iconic/
  sensory memory, primacy within a single utterance — characteristic
  times below one tick. They may be emulated as instantaneous biases
  (e.g., serial-position weighting inside a single scene encoding)
  but never probed on timing.
- The Murre & Dros 2015 replication is the calibration exemplar:
  it re-derived Ebbinghaus' curve at 20min–31d and found the same
  shape including the 24h savings bump — evidence that day-scale
  sims can carry lab-scale anchors via shape comparison (AIC model
  selection between exp/power/log on the model's own savings curve,
  E1 already does this; VA-TSCALE adds that the comparison is
  *shape*-based, not intercept-based).

## 109. Change-impact scheduling (VA-IMPACT) — the battery's
## per-version subsetting is derived, not habitual

Every-version-full-battery is correct for MUST probes but wasteful for
the rest; choosing subsets by taste invites drift-blindness. Borrow
regression-test-selection discipline (Elbaum, Rothermel & Penix 2014,
TSE — test-impact analysis):

- The §47 coverage matrix doubles as the **impact graph**: spec rows
  (params, fields, operators) → probes that read them. Each release
  diffs the spec (canonHash of §7/§10 surface, v5.5 machinery) and
  emits the impacted row set.
- **Schedule rule:** MUST probes always run (OBF regime, §44).
  SHOULD probes run iff they touch an impacted row OR were skipped
  last release (alternating-look discipline prevents silent rot —
  a SHOULD probe may never go 2 consecutive versions unrun).
  OBSERVE probes are sampled at ≥1/3 per release, stratified by
  home-doc family.
- A SHOULD probe skipped while its row was impacted is logged as a
  schedule violation — the registry diff is the audit trail.
- Cost accounting: per-release sim budget is declared in the registry
  manifest; the scheduler reports battery coverage fraction
  (impacted-rows run / impacted-rows total) — must equal 1.0 for
  MUST, ≥0.9 overall.

## 110. The verdict ledger and probe versioning (VA-VLED)

§3.4 goldens pin *behavior*; nothing yet pins the *verdicts*. The
battery's own outputs become an append-only, hash-chained artifact:

- Each probe verdict is a record:
  `{probe_id, probe_version, canonHash(spec), seed_manifest_hash,
    verdict, statistic, n_eff, icc_hat, reliability_class, date}`.
  canonHash (spec §13.4) makes "same model, different verdict" and
  "different model, same verdict" decidable — the two cases §44's
  regression regime actually needs to separate.
- **Probe versioning rule:** when spec semantics change under a probe,
  the probe is versioned (`P142v3`), not edited. Old verdicts are
  archived, never amended — amending history is the validator's
  version of the memory model's own `orphan_rewrite=0` locked null
  (every delta traces to a rule). This is applied pre-registration
  (Wagenmakers et al. 2012; Nosek et al. 2018 *PNAS* 115:2600): the
  hypothesis — including the *test's* semantics — is fixed before
  the run.
- A regression claim must cite the ledger row pair: same
  probe_version, different canonHash. Comparing across probe versions
  is exploratory-only.
- The ledger is the §8 acceptance-gate input: gates read ledger rows,
  never rerun raw outputs, so the audit trail and the decision trail
  can't diverge.

## 111. New probes P615–P628 (v59 suite — validation-design III)

- **P615 anchor grading (MUST — process):** every human-anchor row in
  the corpus carries `rep_grade ∈ {META,RRR,MULTI,SINGLE,CONTESTED}`
  + numeric band; SINGLE rows show `rep_shrink` applied. Audit =
  registry diff; a band centered on an unreplicated original ES is
  a FAIL.
- **P616 negative anchors (MUST):** the CONTESTED set is asserted
  *absent*: ego-depletion arm (sequential self-control task across
  members) must produce d in [−0.1, 0.15] (Hagger 2016 band);
  facial-feedback-style embodiment claim must be null. A build that
  "finds" these effects fails — over-powered folklore is a bug.
- **P617 baseline ladder margin (MUST):** B0–B3 run the MUST battery:
  B0 must fail all decay/distortion probes; B1 must fail profile-
  distinctness (P304-family) and ICC-diversity (P354); B2 must fail
  the trait-gated probes (P48, P602). B3 must pass strictly more
  anchor families than B2 — else the trait layer earns nothing and
  enters `unearned` review.
- **P618 param earning audit (SHOULD — process):** every §7 param
  cites ≥1 anchor/probe family in the coverage matrix; params without
  a citation accumulate `unearned` flags; >10% of params unearned in
  one release blocks a *new*-param merge until the flag count falls.
- **P619 sloppy-spectrum report (SHOULD):** each release logs the
  top-8 stiff eigendirections at each cast operating point + the
  fraction of param-space variance they carry; every stiff direction
  must load on ≥1 anchored observable (Gutenkunst expectation:
  log-uniform tail is fine, stiff-and-unanchored is not).
- **P620 equivalence-class diversity (SHOULD):** two cast profiles
  differing only along declared-sloppy directions must remain
  observationally equivalent (≥90% of their shared probes agree)
  while keeping distinct trait vectors — diversity WITHIN the
  equivalence class is legal and desired; probe to keep it honest.
- **P621 SBC rescope (MUST — process):** parameter-recovery claims in
  §28 are re-scoped to stiff directions only; a report claiming
  full-vector recovery is a red flag for overfit, not a success.
- **P622 ratio-invariance (MUST):** spacing-effect probes run at
  ISI/RI ∈ {1/20, 1/5, 1} at two different absolute scales (days
  vs weeks sim-time); the optimal-ratio ordering must hold at both
  scales (Cepeda 2006 joint ISI×RI dependence) — absolute-time
  optimization that only works at one scale fails.
- **P623 sub-tick scope lock (SHOULD):** no probe may assert a
  timing-dependent effect with characteristic time < 1 tick; registry
  lint rejects such probe definitions at compile time; instantaneous-
  bias emulations are allowed and labeled `subtick_emulated`.
- **P624 impact-schedule conformance (MUST — process):** registry
  diff emits impacted rows; scheduler manifest shows MUST=1.0
  coverage, impacted SHOULD rows ≥0.9 run, no SHOULD probe skipped
  2 consecutive releases while impacted. Violations = release-block.
- **P625 verdict-ledger integrity (MUST):** every verdict row carries
  probe_version + canonHash + seed_manifest_hash; a regression claim
  citing rows with mismatched probe_version is rejected at triage;
  ledger is append-only (rewrite attempt = integrity FAIL).
- **P626 verdict-to-gate single source (MUST):** §8 acceptance gates
  read ledger rows only; harness runs that bypass the ledger cannot
  flip a gate. Audit = replay a stored verdict set through the gate
  and confirm identical decisions.
- **P627 probe-version archive (SHOULD):** superseded probe versions
  remain executable (archive, not delete) for ≥10 versions — back-
  testing a historical regression claim against an old canonHash
  must be possible; then they move to frozen reference.
- **P628 peeking under the new regime (MUST — meta):** mid-version
  partial runs (allowed for debugging per §44.2) write no ledger
  rows and cannot be cited in regression claims; audit = ledger
  timestamps vs release boundaries.

## 112. Sources verified this version (P615–P628 backing)

- Open Science Collaboration 2015 (*Science* 349:aac4716 — verified:
  36% replication, replication ES half of original, Mr 0.197 vs
  0.403; 47% of original ES in replication CI).
- Camerer et al. 2018 (*Nat Hum Behav* 2:637 — verified: 21 studies,
  62% significant-replication, ES ≈50%, est. true-positive rate 67%).
- Hagger et al. 2016 (*Persp Psych Sci* 11:546 — verified: 23 labs,
  N=2,141, d = 0.04 CI [−0.07, 0.15]); Wagenmakers et al. 2016
  facial-feedback RRR (CONTESTED anchor class).
- Gutenkunst et al. 2007 (*PLoS Comput Biol* 3:e189 — verified:
  sloppy spectra universal across systems-biology models; collective
  fits constrain predictions not params); Beven 2006 equifinality.
- Roberts & Pashler 2000 (*Psych Rev* 107:358 — verified: good fit
  ≠ evidence; flexibility, data variability, alternative outcomes);
  Pitt & Myung 2002 (*Psych Bull* 128:362 — functional-form
  flexibility in model selection); Myung, Forster & Browne 2000
  (*J Math Psych* special issue).
- Cepeda, Pashler, Vul, Wixted & Rohrer 2006 (*Psych Bull* 132:354 —
  verified: 839 assessments/317 experiments; ISI×RI joint dependence,
  optimal ISI grows with RI).
- Murre & Dros 2015 (*PLoS ONE* 10:e0120644 — verified: Ebbinghaus
  savings curve replicated 20min–31d, 24h bump, power/log fit
  comparison).
- Duval & Tweedie 2000 (trim-and-fill); Stanley & Doucouliagos 2014
  (meta-regression bias correction); Nosek et al. 2018 (*PNAS*
  115:2600 — preregistration revolution); Wagenmakers et al. 2012
  (preregistration in psychology); Elbaum, Rothermel & Penix 2014
  (regression test selection / test-impact analysis, TSE);
  Kish 1965 (already §45 — design-effect reuse); Johari et al. 2017
  (already §44 — peeking, reused for P628).

Registry: P1–P628. v59 suite: P615–P628 (8 MUST, 5 SHOULD, 1 meta —
P628 carries the peeking ban into the ledger era; P616 makes the
battery assert *absence* for the first time).

## 113. Probes P629–P636 (v60 suite — encoding-mechanics V)

All bands follow the §14.2 rep_grade conventions; SINGLE-literature
effects carry `rep_shrink` on the band.

- **P629 pretest potentiation (SHOULD):** failed-recall marks → next
  same-topic event recalls ≥1.3× matched unmarked at 7d; marks set
  without an actual retrieval attempt produce NO boost (Richland
  2009 Exp. 5 gate — the attempt, not the prompt); the wrong guess
  mints as a competitor record (`gen_gain`) but the corrected answer
  must out-recall it ≥2:1 at delay. Guards against conflation with
  §5.26's global forward-test boost — mark is content-locked, not
  window-global.
- **P630 hypercorrection (MUST — sign-locked):** correction retention
  monotone-increasing in pre-correction error confidence in young
  adults; 65+ slope ≤ half the young slope at envSupport=0 AND ≥0.8×
  the young slope at envSupport=1 — Cyr & Anderson's support rescue
  must ride the SAME `envSupport` field as P632 (a second age-rescue
  mechanism = spec violation).
- **P631 interleaving (SHOULD):** cross-category discrimination
  (PersonModel tier boundaries, domain attribution) better after
  interleaved vs massed re-encodings on perceptual/person material
  (band g ∈ [0.2, 0.7], Brunmair & Richter); verbal/expository
  material |gain| ≤ 0.02 — the `interleave_verbal_null` guard.
- **P632 env support at encoding (MUST — interaction shape):**
  free-recall age gap shrinks ≥30% at envSupport=1 vs 0; support
  must NOT lift young adults equivalently (a build where it helps
  everyone equally is a flat-E bug — complementarity, not additive);
  older cohort shows the largest si_res-weighted gain.
- **P633 statistical learning (SHOULD):** entity pairs with
  cooccur ≥ statlearn_min mint a θ-exempt link with NO episodic
  record behind it — the character passes a familiarity/source-free
  "knows who sits where" check while recall probes return null;
  age gradient child > adult > old within the DEBATED band.
- **P634 cheater link (SHOULD — two-armed):** self/ingroup-harmed
  violations mint the actor↔violation link at the boosted rate AND
  source memory for the pair survives ≥1.4× neutral at 30d;
  describe-only (outgroup/none) cheater content shows |E − E_neutral|
  ≤ 0.03 — the Buchner 2009 recognition null enforced structurally.
- **P635 Zeigarnik (OBSERVE):** interrupted Intentions retain
  §34 cue-heating ≥1.5× longer than completed ones and resist §5.33
  deactivation by `zeig_resist`; wide band (moderated lit); if the
  §5.33 deactivation probes regress, this term loses (§110 ledger
  verdict accepts it).
- **P636 disfluency absence (MUST — CONTESTED/negative anchor):**
  degraded/effortful presentation at matched attention/elaboration
  yields |d| ≤ 0.1 vs fluent — asserts ABSENCE per §14.2 semantics
  (Xie 2018 meta d≈0.01; Rummer 2016 replications null; Metacogn.
  Learn. 2016 special issue >1000 participants). A build that
  "finds" the desirable-difficulty benefit here fails.

## 114. Sources verified this version (P629–P636 backing)

- Kornell, Hays & Bjork 2009 (JEP:LMC 35:989 — verified via DOI/
  abstract: unsuccessful retrieval enhances subsequent learning;
  failed attempts excluded from analysis, both paradigms);
  Richland, Kornell & Kao 2009 (JEP:Applied 15:243 — verified:
  5 experiments, attempt-required gate, italics-control arm);
  Grimaldi & Karpicke 2012; Wong & Lim 2022 (derring — folded).
- Butterfield & Metcalfe 2001 (JEP:LMC 27:1491 — verified: PMID
  11713883, high-confidence errors hypercorrected); Butterfield &
  Metcalfe 2006 (Metacogn. Learn. 1:69 — attentional-capture via
  tone-detection probe); Metcalfe, Casal-Roscum, Radin & Friedman
  2015 (PMC3604148 — verified: older adults' correspondence n.s.);
  Cyr & Anderson 2013 (PB&R — verified: support restores the effect).
- Kornell & Bjork 2008 (Appl. Cogn. Psych. — verified: artist-style
  induction, massed judged better despite worse); Brunmair & Richter
  2019 (Psych. Bull. 145:1029 — verified: 59 studies/238 effects,
  g=0.42 overall, paintings 0.67, words −0.39, similarity
  moderators).
- Craik 1983/1986; Craik & Rose 2012 (Neurosci. Biobehav. Rev. —
  verified: encoding-side review, self-initiation/environmental-
  support complementarity, schematic support from the knowledge
  base); Naveh-Benjamin, Craik & Ben-Shaul 2002 (Aging Neuropsychol.
  Cogn. 9:276 — verified: support at encoding+retrieval shrinks the
  age gap).
- Saffran, Aslin & Newport 1996 (Science 274:1926 — verified:
  8-month-old statistical segmentation); Turk-Browne, Jungé & Scholl
  2005 (verified: adult incidental visual statistical learning);
  Aslin 2017 (review).
- Buchner, Bell, Mehl & Musch 2009 (Evol. Hum. Behav. 30:212 —
  verified: no recognition boost, better source memory for
  cheaters); Mehl & Buchner 2007/2008 (EHB 29:35 — Mealey
  occupation-status confound); Bell, Buchner & Musch 2010
  (Cognition — verified: game-suffered cheating enhances recognition
  AND source); Mealey, Daood & Krage 1996 (canonical target).
- Zeigarnik 1927 (interrupted-task recall — direction real, size
  DEBATED; OBSERVE tier).
- Diemand-Yauman, Oppenheimer & Vaughan 2011 (Cognition 118:114 —
  the claim); Rummer, Schweppe & Schwede 2016 (Metacogn. Learn.
  special issue — verified: 3 direct replications null, no
  distinctiveness rescue); Metacognition & Learning 2016 special
  issue (6 studies, >1000 participants); Xie et al. 2018 meta
  (d ≈ 0.01 — verified via abstract).

Registry: P1–P636. v60 suite: P629–P636 (3 MUST — P630 sign-locked,
P632 interaction-shape, P636 the second CONTESTED-anchor absence
assertion after P616; 3 SHOULD; 1 OBSERVE — Zeigarnik is the first
OBSERVE-tier encode mechanic whose ledger verdict can retire it).

## 115. Probes P637–P646 (v61 suite — forgetting-curves VI)

All bands follow the §14.2 rep_grade conventions; SINGLE-literature
effects carry `rep_shrink` on the band. Anchors: FC Part VI §§27–31.

- **P637 reconsolidation window (SHOULD — DEBATED-flagged):** a
  record recalled at day 5 then hit by a misinformation event at
  +0.1d adopts the false field ≥1.5× more often than a matched
  record hit at +0.5d (window closed); `recons_upd_p` incorporation
  emits `lastRewrite` stamps; a weak (R<recons_risk_gate) record
  recalled into conflicting input loses measurable strength — never
  deletion. The window is a *when*, not a *whether*: the same ops
  fire either way, only the rate multiplies.
- **P638 listener SSRIF (MUST — sign-locked):** narrator tells half
  of a shared cluster; listener recall of the untold-but-related
  fields drops vs unrelated controls at ≤`srif_mult`× the speaker's
  own RIF dose — listener suppression may never exceed the
  speaker's (Cuc, Koppel & Hirst 2007 ordering).
- **P639 selective sleep (SHOULD):** `expRel` or arousal≥
  `consol_sel_arous` records out-retain matched neutral records
  across a sleep boundary by ≥1.3× on the consolidation leg; the
  advantage collapses at sleepQuality 0.3 — selectivity rides the
  same tick, not a separate system.
- **P640 sleep-span bonus (SHOULD):** two retells at equal
  wall-clock gaps — one crossing a sleep tick, one not — the slept
  pair shows ≥1.15× storageS growth at 30d (Mazza 2016 direction;
  band rep-shrunk).
- **P641 Osgood surface (MUST — shape-locked):** suppression-vs-
  similarity is non-monotone — maximum within ±0.1 of
  `interf_sim_peak`, ~0 below sim 0.3, and `sim ≥ sim_repeat`
  encodes produce a net POSITIVE strength delta (repetition leg).
  A monotone-in-sim build fails regardless of magnitude.
- **P642 telescoping (SHOULD):** median reconstructed-when error is
  negative-signed (toward present) and grows with record age toward
  ~`teles_c`·age; sub-week records ~unbiased; `orderRecall`
  accuracy unchanged at long range — the bias is common-mode.
- **P643 directed forgetting (SHOULD):** `dforget` records draw zero
  retell events and no §5.26 boost; voluntary hit-rate drops
  10–15% vs matched controls at 14d; storageS, `intrude_w`, and
  scan intrusion rate TOST-equivalent — starvation, not inhibition.
- **P644 hyper-binding (SHOULD):** 75yo profiles mint spurious
  pair-links ≥4× the 30yo rate at encode; linked pairs produce
  confident wrong co-occurrence reports; older n_sim pools show
  higher effective interference at equal true similarity.
- **P645 ALF tail (SHOULD — DEBATED-flagged):** at age_eff 75 the
  R@30d/R@1d ratio drops ≥8% vs age_eff 25 while R@1d is TOST-
  equivalent — intercept held, tail steepened; inert at 40; must
  NOT stack under dementia modifiers.
- **P646 isolation shield (SHOULD):** novelty ≥`distinct_gate`
  records in dense buckets lose ≤60% the R of matched low-novelty
  records at 14d; decay rate itself unchanged — distinctiveness is
  interference-resistance, not immortality.

## 116. Sources verified this version (P637–P646 backing)

- Nader, Schafe & LeDoux 2000 (Nature 406:722 — verified:
  reactivation lability under protein-synthesis blockade); Hupbach,
  Gomez, Hardt & Nadel 2007 (Learning & Memory 14:47 — verified:
  reminder-dependent episodic updating); Bos et al. 2014 (Neurobiol.
  Learn. Mem. — boundary conditions/replication limits; the
  DEBATED flag's basis).
- Cuc, Ozuru, Manier & Hirst 2006 (Psych. Sci. 17:939) and Cuc,
  Koppel & Hirst 2007 (Psych. Sci. 18:727 — verified: within-
  speaker RIF propagates to listeners); Stone, Coman, Brown,
  Koppel & Hirst 2012 (Memory Studies 5:121 — silence as
  collective-forgetting mechanism); Coman, Manier & Hirst 2009.
- Payne, Stickgold, Swanberg & Kensinger 2008 (Psych. Sci. 19:781
  — verified: sleep preserves negative objects over backgrounds);
  Wilhelm, Diekelmann, Molzow, Ayoub, Molle & Born 2011
  (J. Neurosci. 31:1563 — verified: expectancy-tagged memories
  preferentially consolidated); van Dongen et al. 2012.
- Mazza, Gerbier, Gustin, Kasikci, Koenig, Toppino & Magnin 2016
  (Psych. Sci. 27:1321 — verified: sleep between sessions doubles
  retention at 1wk and 6mo at equal practice; single-team — band
  rep-shrunk).
- Osgood 1949 (Psych. Rev. 56:132 — transfer-and-retroaction
  surface; canonical inverted-U); McGeoch similarity tradition;
  Wixted 2004 (Annual Review — already §7.5).
- Rubin & Baddeley 1989; Thompson, Skowronski & Lee 1988; Janssen,
  Chessa & Murre 2006 (Psych. Bull. 132:677 — verified: time-
  perception model, forward telescoping magnitude vs age).
- Bjork 1970; Basden, Basden & Gargano 1993 (JEP:LMC 19:579 —
  item/list directed forgetting); MacLeod 1998 (chapter review);
  Bjork & Bjork 1992 (New Theory of Disuse — the S/R root).
- Campbell, Hasher & Thomas 2010 (Psych. Sci. 21:399 — verified:
  hyper-binding of extraneous pairings in older adults); Campbell,
  Trelle & Hasher 2012 (extension).
- Elliott, Isaac & Muhlert 2014 (Cortex review — ALF: intact short-
  delay, accelerated multi-day loss; strong in clinical cohorts,
  healthy-aging arm DEBATED); Muhlert et al. 2010.
- von Restorff 1933; Hunt 1995 (Memory 3 — distinctiveness
  principle); Hunt & Worthen 2006 (edited volume).

Registry: P1–P646. v61 suite: P637–P646 (2 MUST — P638 sign-locked,
P641 shape-locked; 8 SHOULD incl. two DEBATED-flagged anchors P637
and P645 — absence is not asserted anywhere this version; every arm
asserts a *rate or shape*, the falsifiable kind).

## 117. Probes P647–P656 (v62 suite — retrieval-cues VI)

Source sections: `retrieval-cues.md` §§60–66; spec §5.57–5.62.
All snapshot-additive; each runs under the §14 B2 baseline unless
noted.

- **P647 directionality (MUST — sign-locked):** at matched overlap
  and df, forward queries (context→content) out-recall reverse
  queries by ≥1.3× on sparse cue sets; recognition-mode probes show
  no asymmetry (Kahana & Caplan 2002; Rizzuto & Kahana 2001).
- **P648 iterated cuing (SHOULD):** generative bouts with
  `recue_passes` enabled surface strictly more targets than
  direct-only runs; per-pass yield strictly diminishing (pass 2 <
  pass 1); `search.passes` ≤ 2 always (Norman & Bobrow 1979).
- **P649 evocative object (MUST):** linked-artifact presence lifts
  recall of the linked record vs matched unlinked at equal cue
  overlap; the lift persists at old record ages (≥180d) where
  place reinstatement is the only rival — the keepsake outlasts
  the apartment.
- **P650 photo offload (MUST — two arms, one null):**
  `photographed:"whole"` events encode lower E than matched
  observed; `"detail"` events show NO deficit (locked null —
  Henkel 2014 zoom arm; a build showing a detail-mode deficit
  FAILS); artifact-present retells strengthen the linked record
  (Koutstaal arm).
- **P651 PM pop-out (SHOULD):** nonfocal cue with novelty ≥
  `distinct_gate` fires at ≥0.8× focal rate vs ≤0.6× for matched
  ordinary nonfocal; advantage grows with armedDays (Brandimonte &
  Passolunghi 1994 interval arm).
- **P652 asker license (MUST — sign-locked):** `forced:true` probes
  emit more total fields AND lower field accuracy than free probes
  on identical stores (Koriat & Goldsmith 1996 trade-off);
  `rel ≥ close` raises breadth without raising error share.
- **P653 hedged propagation (SHOULD):** forced-mode emissions carry
  `hedged:true`; hearsay records minted from them carry reduced
  confidence vs clean-emission controls.
- **P654 route practice (SHOULD):** a field probed ≥5× recalls at
  ≥1.2× base rate while equally-encoded never-probed fields stay at
  base; re-probe after `route_hl` shows regression toward base
  (worn paths fade).
- **P655 restart vs continuation (SHOULD — shape):** post-failure,
  low-overlap cue sets out-recall re-asked identical sets on the
  same records (CI varied-retrieval; Köhnken 1999; Memon et al.
  2010).
- **P656 cue-ecology regression (MUST):** P9/P10/P16 (gating,
  saturation, recognition-failure) still pass with all v5.10 legs
  active — direction weighting, recue, route heat route through
  §5.1/§5.2, never around them.

## 118. Sources verified this version (P647–P656 backing)

- Kahana & Caplan 2002 (J. Mem. Lang. 46:111 — verified:
  associative symmetry tested and rejected; forward advantage);
  Rizzuto & Kahana 2001 (JML 44 — autoassociator asymmetry).
- Norman & Bobrow 1979 (Cog. Psych. 11:107 — descriptions as
  intermediate retrieval stage); Williams & Hollan 1981 (Cog. Sci.
  5:87 — think-aloud meta-knowledge loops); Koriat & Levy-Sadot
  2001 (JEP:G 130:395 — accessibility accrual across passes).
- Heersmink 2015 (Rev. Phil. Psych. 6:321 — distributed memory
  taxonomy); Turkle 2007 (Evocative Objects — qualitative anchor);
  Henkel 2014 (Psych. Sci. 25:396 — VERIFIED this version: whole-
  object impairment, zoom null); Barasch, Diehl, Silverman &
  Zauberman 2017 (JPSP 112:741 — attention-mediated benefit arm;
  DEBATED split adopted); Koutstaal et al. 1998/1999 (photo-review
  reinstatement).
- McDaniel & Einstein 1993 (Memory 1:23 — VERIFIED this version:
  unfamiliar + context-distinctive cues improve PM, Exp. 2
  significant); Brandimonte & Passolunghi 1994 (QJEP 47A:565 —
  distinctiveness × retention interval); Einstein & McDaniel 2005
  (Curr. Dir. 14:286 — multiprocess framing).
- Koriat & Goldsmith 1996 (Psych. Bull. 103:490 — monitoring-and-
  control; forced vs free report trade-off, heavily replicated);
  Orne 1962 (demand characteristics); Vallano & Schreiber Compo
  2011 (rapport arm, single-team — rep-shrunk weight).
- Karpicke & Roediger 2008 (Science 319:966 — retrieval-practice
  asymmetry); Carpenter & DeLosh 2006 (Applied Cog. Psych. 20:123 —
  weak cues gain most — route-side read is ours, HYPOTHESIS).
- Fisher & Geiselman 1992 (CI manual — change-order/change-
  perspective mnemonics); Köhnken, Milne, Memon & Bull 1999
  (Psych. Pub. Pol. Law 5:3 — CI meta); Memon, Meissner & Fraser
  2010 (Psych. Bull. 136:340 — verified: d≈1.2 correct-detail,
  small error cost).

Registry: P1–P656. v62 suite: P647–P656 (4 MUST — P647/P652
sign-locked, P650 two-arm with locked null, P649/P656 behavioral;
6 SHOULD incl. one DEBATED-flagged split anchor at P650's Barasch
leg).

## 119. Probes P657–P666 (v63 suite — age-development VI)

- **P657 infant clock (MUST, sign-locked):** matched-S records
  encoded at encodeAge 0.5 / 2 / 5 / 20 show monotonically
  increasing time-to-latent under `infant_beta_mult`; the 0.5y
  record falls below `forget_thresh` within infant-scaled days
  absent reminders. Asserts ordering AND that no separate
  infant-erasure rule fires (the wall is emergent decay).
- **P658 reinstate channel (MUST + locked null):** a latent
  below-wall record re-encountered via a context-overlapping
  Event (place/persons/objLink ≥ `reinstate_bar`) gains S and
  can surface; the same content delivered via `hearAccount`
  produces EXACTLY zero S change on the latent record —
  `told_reinstate_null` asserted, any nonzero lift fails.
- **P659 observer channel (SHOULD):** `role:"observer"` events
  at encodeAge 2 mint retrievable records only under strong
  contextual cues and carry no self-field tier; at encodeAge 6
  they mint ordinary records at the `obs_gain` discount; at
  encodeAge 2 below pierce, sub-arousal_thresh observer events
  mint nothing.
- **P660 heritage bump (MUST):** kin `told_by` records whose
  `era` falls in the teller's bump window, heard at age 12,
  show higher S per hearCount than the same teller's age-45-era
  accounts; a matched non-kin teller shows ≤40% of the gain;
  hearer at age 5 or 35 shows no heritage leg.
- **P661 cue floor (MUST, sign-locked):** at retrievalAge 6 a
  zero-channel voluntary query fails at ≥2× the one-weak-channel
  rate; `interviewMode`/`asker`-scaffolded queries exempt; an
  adult profile shows no cue_floor effect.
- **P662 order by strength (SHOULD):** at retrievalAge 7, two
  same-era records differing only in S are ordered higher-S =
  "later" at p>0.55; at retrievalAge 14 ordering follows time
  fields; the bias direction is locked (stronger→later, never
  stronger→earlier).
- **P663 strategy tiers (MUST + locked null):** `studied`
  events at encodeAge 6 gain nothing vs matched plain
  re-exposure; at 8 rote-studied gains `study_mult`; at 11
  categorized-studied gains; a pre-onset studied record queried
  at 12 shows NO retroactive bonus — `strategy_retro_null`.
- **P664 schooling (SHOULD, HYPOTHESIS-flagged):**
  `schooled:none` profile delays all three §4.31d onsets by
  ~0.5y and shows a larger post-8 metamemory overconfidence gap
  vs `schooled:full` at identical seed.
- **P665 pub reward (SHOULD, DEBATED-lite):** `reward:true`
  events inside `pub_window` encode elevated vs outside;
  neutral events inside the window unchanged — a diffuse
  pub-window lift FAILS this probe (narrowness is the contract).
- **P666 v5.11 regression (MUST — structure):** all v5.11 params
  at defaults reproduce v5.10 outputs on the standard battery
  except the sign-locked differences above; snapshot round-trip
  preserves the new record/event fields.

## 120. Sources verified this version (P657–P666 backing)

- Hartshorn & Rovee-Collier 1997; Hartshorn, Rovee-Collier et
  al. 1998 (*Dev. Psychobiol.* 33:1 — the infant-retention
  monograph: retention interval grows ~linearly, doubling
  ~monthly); Rovee-Collier 1999 (*Curr. Dir. Psych. Sci.* 8:33
  — time-window table); Rovee-Collier et al. 1980 (reactivation
  paradigm — perceptual reminder restores flagging infant
  memory).
- Frankland, Köhler & Josselyn 2013 (*Science* 341:1047747 —
  neurogenesis causes infant forgetting, rodent); Josselyn &
  Frankland 2018 — DEBATED mechanism note, no params.
- Barr & Hayne 1999 (*Dev. Psychobiol.* 34:159 — deferred
  imitation 12–24mo, multi-week retention); Bauer 2002 (*Dev.
  Rev.* 22:235 — long-term ordered recall of observed sequences).
- Svob & Brown 2012 (*Memory* 20:737 — intergenerational
  reminiscence bump); Krumhansl & Zupnick 2013 (*Psych. Sci.*
  24:2059 — cascading music bump).
- Kobasigawa 1974 (*Child Dev.* 45:190 — retrieval-cue
  production deficiency); Flavell, Beach & Chinsky 1966 (*Child
  Dev.* 37:283 — rehearsal emergence ~7).
- Friedman 1991 (*Dev. Rev.* 11:139 — strength-based recency);
  Friedman & Kemp 1998 (*Cog. Dev.* 13:335).
- Ornstein, Haden & Hedrick 2004 (strategy-emergence schedule);
  Schneider & Pressley 1997 (*Memory Development Between 2 and
  20* — rehearsal ~7–8, organization ~9–10, elaboration ~13+).
- Morrison, Smith & Dow-Ehrensberger 1995 (*Child Dev.*
  66:1399 — birthday-cutoff design: grade > age effects);
  Rogoff 1981 schooling corroboration — extension to encode-side
  onsets flagged HYPOTHESIS.
- Davidow, Foerde, Galván & Shohamy 2016 (*Neuron* 91:182 —
  adolescent reward-related episodic enhancement); Murty,
  Calabro & Luna 2018.

Registry: P1–P666. v63 suite: P657–P666 (4 MUST — P657/P661
sign-locked, P658/P663 carry locked nulls; 5 SHOULD incl.
HYPOTHESIS P664 and DEBATED-lite P665; 1 structural regression
P666).

## 121. Probes P667–P676 (v64 suite — age-decline VI, the ledger splits)

- **P667 R/F split (MUST — sign-lock):** at retrievalAge 78,
  emissions carrying field-level episodic detail (when/pairing/
  source) decline ≥1.8× the bare-familiarity decline vs the 30yo
  baseline; `reportMode:"know"` share rises correspondingly —
  fails if know-emissions carry source fields (Yonelinas 2002
  2:1 anchor).
- **P668 gist asymmetry (MUST — sign-lock + locked null):** at
  80, gist-consistent lures endorsed at ≥1.5× young rate while
  unrelated foils endorsed at ≤1.1× — `gist_content_null` fails
  on ANY unrelated-foil amplification. Veridical verbatim
  endorsement must fall simultaneously (Balota 1999 double move).
- **P669 positivity gated (MUST + locked null):** at 75 under
  full attention, positive-valence candidates out-emit negative
  at ≥1.2× the 30yo ratio; under `C.da` the ratio returns to
  baseline exactly — `pos_da_null`. Stored S must be identical
  across arms (selection-side, never storage-side).
- **P670 synchrony scope (MUST + locked null):** `chronotype:
  morning` at 75 recalled off-peak (evening `timeOfDay`) shows
  controlled-path misses ≥ the `tod_tax` prediction; involuntary
  emissions and routine-script recall statistically unchanged —
  `auto_sync_null`. A `neutral` profile shows an intermediate or
  absent effect (May et al. 2005 replication arm).
- **P671 sensory cascade (SHOULD):** `sensory:0.6` vs `sensory:0`
  matched profiles: auditory-channel fields encode ~0.82×, non-
  auditory fields unchanged, downstream decline legs read
  `sensory_age_shift` older. Restoring `sensory→0` removes the
  encode tax but not the shift (asymmetry asserted).
- **P672 headroom cliff (MUST — shape-lock):** 78yo single-cue
  recall performance ≥ knot prediction under `comp_gain`
  (inverted-U leg); tier-3 multi-cue fusion falls super-linearly
  past `headroom` — a linear decline FAILS. The curve, not the
  level, is the claim (CRUNCH).
- **P673 enactment rescue (SHOULD):** `enacted:true` at 80
  retains ≥0.8 of the 30yo E-advantage ratio while matched
  `role:"observer"` events retain ≤0.6 — the doing gap WIDENS
  with age; composes multiplicatively with trait `enact_gain`.
- **P674 transactive dyad (MUST + locked null):** `withPartner`
  recall at 78 on shared-encoded records emits ≥1.15× internal-
  detail fields vs solo; `rel:"acquaintance"` co-recaller shows
  no gain (plist_suppress baseline only) — `transact_stranger_
  null`. External/off-topic detail count unchanged (Barnier 2014
  — the gain is internal-detail-specific).
- **P675 PM split (MUST):** `cueType:time` intentions at 80 fire
  at ≤0.7× the `cueType:event` rate (matched arming delay);
  `impl_intent:true` recovers ≥50% of the gap; event-cue legs
  keep §5.60 pop-out eligibility, time cues never pop.
- **P676 suggestibility scope (MUST + locked null):**
  misinformation adoption at 80 rises on the §6.83 SHIFT leg
  (≥1.3× young) while yield scores are statistically unchanged —
  `yield_age_null`; `age_salient` contexts degrade retrieval
  legs with zero change to stored S (asserted by diffing the
  record store pre/post).

## 122. Sources verified this version (P667–P676 backing)

- Yonelinas 2002 (*Psych. Bull.* 128:800 — R/F aging meta;
  recollection declines ~2× familiarity; familiarity decline
  confined to 75+); Light, Prull, LaVoie & Healy 2004 (dual-
  process signal-detection corroboration).
- Koutstaal & Schacter 1997 (*Psych. & Aging* 12:404 — gist-based
  false recognition elevated in aging); Tun, Wingfield, Rosen &
  Blanchard 1998; Balota, Cortese, Duchek et al. 1999 (*Psych. &
  Aging* 14:321 — DRM: old adults ↑false alarms, ↓veridical);
  Reyna 2012 (fuzzy-trace aging review).
- Mather & Carstensen 2005 (*Trends Cog. Sci.* 9:496 — positivity
  effect meta); Reed & Carstensen 2012; Mather & Knight 2005
  (*Psych. Sci.* 16:691 — DA abolishes the effect: the gate).
- May, Hasher & Stoltzfus 1993 (*Psych. Sci.* 4:326 — synchrony:
  no age gap at older adults' peak, large off-peak); May & Hasher
  1998 (*JEP:HPP* 24:363 — inhibitory mechanism); May 1999
  (*PBR* 6:142); May, Hasher & Foong 2005 (implicit exempt —
  automatic retrieval shows no synchrony); Hasher, Goldstein &
  May 2005.
- Baltes & Lindenberger 1997 (*Psych. & Aging* 12:12 — sensory
  common cause); Lin, Metter, O'Brien et al. 2011 (*Arch.
  Neurol.* 68:214 — hearing→dementia dose-response); Wayne &
  Johnsrude 2015 (perceptual-effort review).
- Cabeza 2002 (*Psych. & Aging* 17:85 — HAROLD); Reuter-Lorenz &
  Cappell 2008 (*Curr. Dir. Psych. Sci.* 17:177 — CRUNCH
  inverted-U); Schneider-Garces et al. 2010 (load-curve fMRI);
  Grady 2012 (compensation-vs-dedifferentiation caveat).
- Bäckman & Nilsson 1985 (enactment age-invariance); Engelkamp &
  Zimmer (SPT corpus); Cohen 1981.
- Harris, Keil, Sutton, Barnier & McIlwain 2011 (*Discourse
  Processes* 48:267); Johansson, Andersson & Rönnberg 2005
  (*Scand. J. Psych.* 46:349); Barnier, Priddis, Broekhuijse et
  al. 2014 (*JARMAC* — internal-detail facilitation, old couples
  only); Harris et al. 2017 (*Memory* — "going episodic" trade-off).
- Henry, MacLeod, Phillips & Crawford 2004 (*Psych. & Aging*
  19:27 — PM meta: time-based >> event-based age deficits);
  Park, Hertzog, Kidder et al. 1997; Kvavilashvili (naturalistic
  paradox); Liu & Park 2004 (implementation intentions rescue);
  Chasteen, Park & Schwarz 2001.
- Hess, Auman, Colcombe & Rahhal 2003 (*Psych. & Aging* 18:3 —
  stereotype threat on recall); Lamont, Swift & Abrams 2015
  meta (modest but real).
- Jacoby 1999 (familiarity exploitation); Roediger & Geraci 2007
  (*Learn. & Mem.* 14:90 — aging misinformation review);
  Karpel, Hoyer & Toglia 2001 (boundary conditions); Wylie et
  al. (conditional nulls — magnitude DEBATED).
- Erickson, Voss, Prakash et al. 2011 (*PNAS* 108:3017 — aerobic
  RCT, hippocampal +2%); Hillman, Erickson & Kramer 2008 (*Nat.
  Rev. Neurosci.* 9:58); Colcombe & Kramer 2003 meta; Maki &
  Weber 2021 (menopause — deferred, no params).

Registry: P1–P676. v64 suite: P667–P676 — 8 MUST (P667/P668/
P672 sign- or shape-locked; P669/P670/P674/P676 each carry a
locked null; P675 the PM split) and 2 SHOULD (P671 cascade
asymmetry, P673 enactment ratio).

## 123. Probes P677–P686 (v65 suite — emotional-memory VI, the
residue layer)

- **P677 grief oscillation (MUST):** mark a high-trust dyad
  partner `deceased`; over 90 simulated days the survivor's
  loss/restore residence must (a) start loss-dominant, (b) rise
  in restore share, (c) keep nonzero late loss episodes —
  monotone trend WITH oscillation; deceased-linked emissions
  carry `absence:true` in loss mode / `presence:true` in restore
  mode; the store is untouched (`grief_erasure_null` — record
  decay must match live-person controls). FAIL if mode is
  one-directional or if records decay faster than controls.
- **P678 forward-leak asymmetry (MUST — sign lock):** encode a
  neutral→NEGATIVE(arousal 0.9)→neutral sandwich: the
  negative→following link must exceed the preceding→negative
  link (`emo_fwd_gain` vs `emo_back_loss`); both differ from a
  matched neutral control; the hot record's `when` resists
  telescoping (`teles_when_immune`) while neighbors' `when`
  drifts late. FAIL on symmetric loss or hot-record telescoping.
- **P679 counterconditioning rival (MUST):** negative CondEntry
  on cue X, then three positive X-events: the cue must hold TWO
  entries (both valences); fired affect = strength-weighted
  mixture; the negative entry's renewal channel still fires on
  context change. FAIL if positive events decrement or merge
  the negative entry.
- **P680 capitalization gate (MUST):** retell a positive record
  to `ac_response:active_constructive` vs `passive` audiences:
  S gain only in the active arm (≥`capitalize_gain`·0.8);
  verbatim fields identical pre/post both arms
  (`cap_content_null`); affect tag creeps positive only in the
  active arm.
- **P681 tone survival (MUST):** speech record with prosody −0.7
  vs neutral prosody, decayed 60d: (a) prosody field strength >
  content verbatim by the `tone_survive_mult` ratio; (b) content
  affect tag shifted `prosody_leak_k`·prosody at encode and
  unchanged when the prosody field itself decays — the leak is
  irreversible.
- **P682 affect flashback (MUST):** drive a CondEntry's source
  below θ, present the cue: emission must be `aff_flash:true`
  with `content:null` — affect, zero fields, zero confidence.
  FAIL if content fields emit or a scene is confabulated
  (`aff_flash_verbatim`); below `aff_flash_thresh` nothing emits.
- **P683 jealousy vigilance (SHOULD — trait gate):** identical
  partner+rival co-presence on `jealous` 0.8 vs 0.2: the high
  arm mints `rival:true`, encodes at `rival_vigil_gain`, and
  accrues a mild negative person-CondEntry; the low arm mints
  nothing. `infid_cue:sexual` vs `emotional` must weight by
  profile `sex` per the Schützwohl multipliers.
- **P684 awe signature (SHOULD — HYPOTHESIS arm):** `awe:true`
  vs matched positive non-awe event: awe record must show thin
  self fields + strong gist + `schema_gap` confab resistance +
  full arousal tag. FAIL if self fields mint at ordinary
  strength — the small self is the signature.
- **P685 directed-forgetting resistance (MUST):** `dforget` on
  arousal-0.8-negative vs arousal-0.3-neutral records: the hot
  record must outlast `df_theta_eff` by the `emo_df_resist`
  factor; the ≥0.8-negative arm must NEVER starve (locked
  exemption); under `suppress:true` the resistance halves.
- **P686 safety signal (MUST — locked null):** CondEntry firing
  with vs without a trusted co-present person: fired affect is
  lower with the safe person (`safety_suppress`·tier) while the
  entry's `strength` and `safeCount` are IDENTICAL afterward
  (`safety_unlearn_null`); the cue alone later refires at
  pre-suppression strength. FAIL if fire-time suppression
  accrues extinction credit.

## 124. Sources verified this version (P677–P686 backing)

- Stroebe & Schut 1999 (*Death Studies* 23:197 — dual-process
  model: loss/restoration oscillation, dosage); Stroebe & Schut
  2010 (DPM decade review); Stroebe, Schut & Stroebe 2005/2016
  overload extension; Klass, Silverman & Nickman 1996
  (*Continuing Bonds* — maintained inner relationship);
  Ratcliffe 2020 (*Eur. J. Philos.* — the presence/absence
  phenomenological flip on identical content).
- Bisby & Burgess 2013 (*Learn. & Mem.* 21:21 — negative affect
  impairs associative, spares item memory); Bisby, Burgess &
  Brewin 2020 (*Curr. Dir.* 29:267 — coherence loss ↔ PTSD);
  2023 *Cognition & Emotion* forward-favouring pair (N=72+150 —
  negative→E+1 binding > E−1→negative); Palombo et al. 2021
  (*Psych. Sci.* — "what"↑, "which"↓, emotional "when" preserved
  while neutrals mislocalize late).
- Keller et al. 2020 (counterconditioning review + OSF
  pre-registered meta — CC > extinction on relapse channels,
  modest); Raes & De Raedt 2012 (*Behav. Ther.* 43:757 — CC
  reduces evaluative conditioning d≈0.2, expectancy intact);
  Bouton 2004 (no special permanence — DEBATED distinctness).
- Gable, Reis, Impett & Asher 2004 (*JPSP* 87:228 —
  capitalization: sharing positives boosts PA beyond the event,
  gated on active-constructive response); Gable et al. 2006
  (*JPSP* 91:904 — ACR reception predicts relationship outcomes
  over negative-event support); Langston 1994 (*JPSP* 67:1112).
- Schirmer & Escoffier 2010 (*PLoS ONE* "Mark My Words" —
  prosody shifts word valence in memory, independent of prosody
  recall — implicit leak); Chappuis et al. 2014 (*Interspeech* —
  prosody-induced EEM replicated ×3); voice-in-engaging-context
  single-exposure acquisition at 1 week.
- Maner et al. 2009 ("Intrasexual vigilance" — jealous-primed
  individuals attend→encode→remember attractive same-sex rivals,
  trait-gated); Schützwohl & Koch 2004 (sex-differentiated
  delayed recall of sexual vs emotional infidelity cues);
  Maner & Shackelford 2008 (jealousy basic-cognition review).
- Keltner & Haidt 2003 (*Cogn. & Emot.* 17:297 — vastness +
  accommodation); Shiota, Keltner & Mossman 2007 (self-
  diminishing appraisals); Piff et al. 2015 (*JPSP* 108:883 —
  small self); Rudd, Vohs & Aaker 2012 (*Psych. Sci.* — awe
  expands perceived time). Memory signature = our HYPOTHESIS.
- Hauswald et al. 2010 (*SCAN* — directed forgetting for neutral
  but not arousing-negative pictures); 2021 *Mem. & Cogn.*
  item-method meta (emotional DF ~4.2pp smaller, arousal-
  moderated); van Schie et al. 2013 (direct-suppression
  comparability — DEBATED, weak-end adopted); Anderson &
  Hanslmayr 2014 (suppression mechanisms).
- Hornstein & Eisenberger (safety-signal / social-buffering
  direction — fire-time inhibition); Bouton (conditioned
  inhibitors — expression suppressed, association intact);
  Coan et al. 2006 anchor reused for the tier table.

Registry: P1–P686. v65 suite: P677–P686 — 8 MUST (P678 sign-
locked; P677/P679/P680/P682/P685/P686 each carry a locked null
or locked exemption) and 2 SHOULD (P683 trait gate, P684 the
awe HYPOTHESIS arm).

## 125. Probes P687–P696 (v66 suite — false-memory VI, the
residual channels)

- **P687 telescoping shape (MUST):** whenEstimate on records at
  Δ ∈ {7, 30, 90, 180}d inside a bounded elicit window — error
  σ grows ≈linearly with slope 0.3–0.5 (R&B anchor); remote
  events net-forward inside the window; flipping the window's
  midpoint flips the pull direction (Huttenlocher signature —
  bias tracks the question's bounds, not the event).
- **P688 landmark anchoring (MUST):** two matched records, one
  within landmark_pull range of a landmark day, one isolated —
  anchored |error| reliably smaller; the landmark record's own
  day skips mid/landmark pulls; teles_when_immune records skip
  both pulls but keep σ noise.
- **P689 coarse preservation (MUST):** drive dayConf below
  threshold — season/month/weekday answers remain ≥2× more
  accurate than exact-day answers (coarse_when_mult); emitted
  dialogue takes the coarse form, not a guessed date.
- **P690 order preservation (MUST — locked null):** two records
  each landmarked — reported days may err arbitrarily but
  emitted order NEVER inverts (order_preserve_null). FAIL on
  any permutation across 1e4 jittered draws.
- **P691 observation inflation (MUST — locked resist):**
  `observed_action` on a routine partner action, source decayed
  <0.3 → a nonzero share of profiles emit `actor:self`; adding
  `warned` to the context does NOT reduce the flip rate
  (obs_warn_resist); flip scales with discrim_mult (older >
  younger at matched exposure).
- **P692 dream channel (MUST — locked null):** dreamEvent mints
  at dream_strength with source.dream; flip only via the decay
  gate, rate rising with dissoc/fantasy/imagery; verbatim field
  count IDENTICAL pre/post flip (dream_content_null);
  plausibility-failing dreams never flip at any trait level.
- **P693 distinctiveness heuristic (MUST):** identical lure,
  recall with vs without demand_detail — endorsement suppressed
  ∝ distinct_expect only when the record's encoding had
  diagnostic channels; gist-only encodings show zero protection
  at ANY age; veridical recall probability unchanged (the guard
  never costs true hits).
- **P694 false familiarity (SHOULD — locked null):** name
  exposed 6× with no episodic record → fame/acquaintance
  attributions emit; place-inconsistent names skew fame_p,
  place-consistent skew acquaint_p; NO shared-episode record is
  ever minted from fluency alone (fame_episode_null); immediate
  (non-decayed) exposures attribute less than delayed (Jacoby
  signature).
- **P695 silent detection (MUST — locked null):** conflicting
  account vs surviving verbatim → adoption ≈ dispute_mult with
  NO disputed flag set; verbatim candidate strength identical
  pre/post detection (detect_boost_null); weak-verbatim arm
  detects rarely and adopts normally; contradictory content
  detects ≥2× additive content.
- **P696 imagery trait (SHOULD):** imagineEvent ×5 on
  imagery ±1.5σ profiles — high arm reaches rm_rich_thresh and
  flips earlier; low arm rarely crosses; source_confuse and
  dream_flip scale the same direction; `vivid` held constant —
  the two traits must show independent variance (orthogonality
  check).

## 126. Sources verified this version (P687–P696 backing)

- Rubin & Baddeley 1989 (*JEP:G* 118 — dating-error growth
  ~0.4 d/day, direction toward interval middle; apparent
  telescoping from retention+bounded error, no systematic bias
  needed); Thompson, Skowronski & Lee 1988 (diary method —
  telescoping from ~8 weeks, slight nonsignificant time-
  expansion for recent); Lee & Brown 2003 (boundary constraints
  move the bias; forward telescoping survives guess-removal —
  two mechanisms); Huttenlocher, Hedges & Prohaska 1988/1990
  (hierarchical/category model — estimates migrate toward
  bounds and prototypes); Friedman 1993 (coarse temporal
  attributes outlive exact dates); Shum 1998 / Loftus &
  Marburger 1983 (landmark anchoring).
- Lindner, Echterhoff, Davidson & Brand 2010 (*Psych. Sci.*
  21:1291 — observation inflation: false self-performance after
  mere observation; persists despite warnings and removed
  sensory overlap; action-simulation account); Lindner &
  Davidson 2013 (*Aging Neuropsych. Cogn.* — false action
  memories in older adults, executive-function linked).
- Rassin, Merckelbach & Spaan 2001 (*J. Nerv. Ment. Dis.*
  189:478 — dream-reality confusion reported by 11.8%/25.9% of
  two samples; correlates dissociation + fantasy proneness);
  Mazzoni & Loftus 1996 (*Conscious. Cogn.* 5:442 — dream
  content implanted→recalled as real); Kemp, Burt & Sheen 2003
  (*Appl. Cogn. Psychol.* 17:577 — dreamt experiences carry
  thinner phenomenology); Wamsley et al. 2014 (*Sleep* 37:419 —
  narcolepsy dream delusions, sustained false beliefs; clinical
  ceiling).
- Schacter, Israel & Racine 1999 (*JML* 40:1 — distinctiveness
  heuristic: diagnostic-recollection demand suppresses false
  recognition, gated on distinctive encoding); Gallo, Bell,
  Beier & Schacter 2006 (*Memory* 14:730 — recall-to-reject +
  distinctiveness heuristic, both available to older adults when
  encoding supports); Koutstaal & Schacter 1999 (scrutiny
  reduces gist-false recognition in the old, residual gap
  remains); Dodson & Schacter 2002 (metacognition framing).
- Jacoby, Kelley, Brown & Jasechko 1989 (*JPSP* 56:326 —
  becoming famous overnight: delayed-only false fame, familiarity
  survives source recollection); Jacoby, Woloshyn & Kelley 1989
  (*JEP:G* 118:115 — divided attention at test amplifies).
- Tousignant, Hall & Loftus 1986 (*Mem. & Cogn.* 14:329, N=570 —
  slower/scrutinizing readers detect discrepancies and resist;
  detection is the mediating variable); recollection-rejection
  line (*Appl. Cogn. Psychol.* 2017 — spontaneous rejection of
  contradictory > additive misinformation, decaying with delay);
  retrieval-enhanced-suggestibility discrepancy work (*Memory*
  2017 — RES accrues to non-detectors only).
- Horselenberg et al. 2000 (*Appl. Cogn. Psychol.* — imagery
  ability the sole predictor of imagination inflation); Heaps &
  Nash 1999 (dissociation predicts inflation, N=94); Dobson &
  Markham 1993 (*Brit. J. Psychol.* 84 — high imagers worse at
  external-external source discrimination); Marks 1993 (imagery
  vividness × reality-monitoring frequency judgments).

Registry: P1–P696. v66 suite: P687–P696 — 7 MUST (P687–P693,
P695; P690–P692 and P695 each carry a locked null/resist) and
3 SHOULD (P694 locked-null-bearing, P696 trait orthogonality).

## 127. Probes P697–P708 (v67 suite — individual-differences VI,
the tails, the motivated mind, the body history, null #2)

- **P697 the calendar mind (MUST — two locked nulls):** hsam=1
  vs hsam=0 profiles on identical 90-day self-present event
  diets — own-life retention near-flat (β effective ≤0.2×
  control) and whenEstimate σ ≤ ~10% of control; on matched
  non-self "laboratory" records all retention within jitter
  (hsam_lab_null); misinformation adoption and lure
  endorsement within jitter (hsam_misinfo_null — Patihis
  2013). A general-memory or false-memory advantage fails.
- **P698 the third person (MUST — three locked nulls):**
  sdam=1 episodic queries return generic/know-mode
  reconstructions ≥60% more often with forced observer
  perspective; semantic, skill, and PM outcomes match control
  (sdam_sem_null); encoding E terms identical (sdam_enc_null);
  confidence stays fluent, not chronically uncertain
  (sdam_conf_null).
- **P699 elaboration is choosy (MUST — sign-locked):**
  `elaborable` events tagged arg_quality — nfc=+1.5's
  strong−weak field-retention gap ≈2× the nfc=−1.5 gap;
  matched non-elaborable events identical; all beta_*
  unchanged (encoding disposition, never storage).
- **P700 forgotten but not gone (MUST — recognition lock):**
  matched threaten-self vs affirm-self `self_feedback` events:
  mnemic=+1.5 recalls ~30% fewer threaten fields; cueContext
  mode:"recognition" recovers them at control rate
  (mnemic_recog_null); other-referent feedback identical at
  all trait values; `close:true`-source threaten events exempt.
- **P701 Ribot's window (MUST — sign-locked):** `tbi_event`
  minted mid-timeline — retrograde erasure graded by severity
  (mild ≈ hours, severe ≈ weeks), remote records spared;
  residual wmc-side tax present at +90d and STABLE — any
  year-over-year deficit growth fails (tbi_prog_null).
- **P702 the invisible allele (MUST — onset lock):** apoe=e4
  vs e3 — identical curves at age_eff 30/40; divergence only
  past onset on episodic-side params; semantic/procedural/PM
  identical at every age; homozygous > heterozygous ordering.
- **P703 the ordinary advantage (SHOULD — ceiling-locked):**
  synesth=2 episodic E advantage ≈5–15% across ALL channel
  types including synesthesia-irrelevant material (the 2019
  meta's pervasiveness); >25% advantage FAILS — the bound is
  the point (Rothen & Meier 2010).
- **P704 the groove (MUST):** rumin=+1.5 negative self-
  referent records show elevated rehearsal counts, slowed
  neg_affect_decay, lowered intrusion_thresh on negative cues;
  positive/neutral rehearsal and all encoding params
  identical; rumin=−1.5 shows the small reflection gain on
  problem-framed retells (Watkins 2008 asymmetry).
- **P705 meshing null (MUST — honesty lock):** 200 draws,
  learn_style pinned vs randomized, modality-matched vs
  modality-mismatched encode contexts → recall identical
  within jitter; ANY systematic loading or interaction fails.
  Same honesty-lock architecture as P575 (birth_order).
- **P706 tail exclusivity (MUST):** joint sampler draws with
  hsam·sdam both >0 never emit — the projection resolves to
  the larger magnitude; resulting profiles carry exactly one
  tail's signature, never a composite.
- **P707 rehearsal is the engine (SHOULD — mechanism audit):**
  hsam=1 with the `hsam_rehearse` leg ablated (remin_w forced
  to control) collapses the own-life advantage toward control;
  the ablation — not the flag — must carry the effect. A
  build where hsam survives rehearsal-removal is a magic flag,
  not a mechanism.
- **P708 the feedback ledger (SHOULD — compound audit):**
  mnemic=+1.5 × self_srv=+1.5 criticized after shared work:
  own-effort fields stay dense (self_srv arm) while threat
  fields thin (mnemic arm) — both operators visible in one
  record, additive, no interaction term.

## 128. Sources verified this version (P697–P708 backing)

- Parker, Cahill & McGaugh 2006 (*Neurocase* 12:35 — first
  HSAM case "A.J."/Jill Price, diary-verified date recall);
  LePort et al. 2012 (*Neurobiol. Learn. Mem.* 98:78, N=11 —
  superior personal+public event recall WITH dates, matched
  controls on standard lab tests); LePort et al. 2016/2017
  (N≈33+; OC-spectrum correlation); Patihis et al. 2013
  (*PNAS* 110:20947 — HSAM DRM/misinformation false memories
  at control rates — the misinfo null).
- Palombo, Alain, Söderlund, Khuu & Levine 2015
  (*Neuropsychologia* 72:105, N=3 — SDAM: absent recollection
  biomarkers, intact wherever tasks are non-episodic; "third
  person" self-description); Palombo et al. 2018 (review);
  Wan et al. 2024 (partial aphantasia covariation).
- Cacioppo & Petty 1982 (*JPSP* 42:116 — NFC scale); Cacioppo,
  Petty, Feinstein & Jarvis 1996 (*Psych. Bull.* 119:197 —
  meta: elaboration + strong/weak argument memory gap);
  Cohen, Stotland & Wolfe 1955 (grandfather study).
- Sedikides & Green 2000 (*JPSP* 79:168 — mnemic neglect);
  Sedikides, Green & Pinter 2004 (*EJSP* 35:225 —
  modifiability moderator); Green, Sedikides & Gregg 2008
  (*JESP* 44:547 — recall deficit, recognition intact:
  "forgotten but not gone"); Sedikides & Green 2006 (*BBS*
  29:532 — inhibitory-repression framing); Sedikides & Green
  2009 (review — dysphoria attenuates, close-source averts;
  Green, Pinter & Sedikides 2009 *Self & Identity* 8:233).
- Russell & Nathan 1946 (*Brain* 69:280 — Ribot graded
  retrograde amnesia; PTA as severity index); Belanger,
  Curtiss, Demery, Lebowitz & Vanderploeg 2005
  (*Neuropsychology* 19:595 — mild-TBI meta: small persisting
  WM/pspeed effect); Dikmen et al. 2009 (PTA dose-response).
- Caselli et al. 2009 (*NEJM* 361:255, N=815 — asymptomatic
  ε4 carriers' memory decline diverges before 60,
  dose-ordered, weaker non-memory effects); Bookheimer et al.
  2000 (midlife ε4 subtleties); Nilsson et al. 2006.
- Rothen & Meier 2010 (*Memory* 18:258 — "ordinary rather
  than extraordinary"); Rothen et al. 2019 (multi-level
  meta-analysis — episodic d̂≈0.61, WM d̂≈0.36, pervasive
  across stimuli); Rothen & Meier 2009 (*PLoS ONE* 4:e5037 —
  group null vs case-report selection bias).
- Nolen-Hoeksema 1991 (*JPSP* 60:115 — rumination prolongs
  negative mood); Watkins 2008 (*Psych. Bull.* 134:163 —
  constructive reflection vs unconstructive brooding);
  Lyubomirsky & Tkach 2004 (ruminators' negative AM bias).
- Pashler, McDaniel, Rohrer & Bjork 2008 (*Psych. Sci. Public
  Interest* 9:105 — no credible meshing-hypothesis evidence);
  Rogowsky, Calhoun & Tallal 2015 (RCT — modality matching
  did nothing).

Registry: P1–P708. v67 suite: P697–P708 — 8 MUST (P697–P702,
P704–P706; P697/P698/P700–P702 carry locked nulls, P705 is an
honesty lock) and 4 SHOULD (P703 ceiling-locked, P707
mechanism audit, P708 compound audit).

## 129. v68 probes — social-memory VI (P709–P720)

Probe specs in social-memory.md §94; summary contract here.
Scripted-conversation and scripted-transgression fixtures
extend the §73/P-series harness vocabulary — new fixture
kinds: `turnOrderedConversation` (declared `willSpeak`/
positions), `impliedAccount` (account payloads with
`implied` fields), `transgressionPair` (`harmed:`-tagged
dyadic event), `viaChain` rumor loops, `witnessed`
commitments, and asymmetric-familiarity re-introductions.

- **P709** next-in-line (MUST — encoding lock):
  `nil_retrieve_null` enforced; `pre_attend` inversion arm.
- **P710** schema's revenge (MUST — two-arm sign lock):
  weak→incongruent-recall advantage, strong→reversal +
  congruent recognition; `incong_encode_null` floor.
- **P711** implied-becomes-said (MUST): mint rate, weak
  source, unreportable provenance.
- **P712** accessible construct (SHOULD): prime shift,
  decay window, chronic-baseline arm.
- **P713** outcome dependency (MUST — sign-locked):
  incongruity-focused resolution gain; `odep_favor_null`.
- **P714** magnitude gap (MUST — sign-locked, two books):
  `mag_encode_null` at birth; divergence +60d;
  `mag_converge_null` under mutual retell.
- **P715** forgiveness ≠ amnesia (MUST — locked null):
  `forg_erase_null`; decisional→emotional `forg_lag`;
  reduced-rate re-sting.
- **P716** returned story (SHOULD — cap-locked):
  `echo_full_null` while verbatim lives; ungated arm after
  archival; confidence bonus present.
- **P717** witnesses bind (SHOULD): both promise arms +
  third-party clones + shame mint.
- **P718** provenance persists (SHOULD): metVia survives
  name-tier death at ≥metvia_perma.
- **P719** we've met (SHOULD): offense mints on the
  remembering side only; gap- and attach_anx-scaled.
- **P720** turn-taking compound (SHOULD — mechanism
  audit): hole positions correlate with turn adjacency;
  ablating nil_loss kills the correlation, not the recall.

## 130. Sources verified this version (P709–P720 backing)

- Brenner 1973 (*J. Exp. Psychol.* 98:120 — verified via
  full-text scan: N=88 turn-taking recall, ~2-before/1-after
  window, "waiting to ask a question" phenomenology); Bond
  1985 (*JPSP* 48:853 — verified abstract: encoding not
  retrieval; semantic cues don't moderate, post-hoc
  instruction doesn't, PRE-instruction reverses); Bond &
  Kirkpatrick 1982 (*JESP* 18:307); Bond 1991 (*PSPB*
  17:174 — elaborative rehearsal eliminates; eye contact
  does not).
- Stangor & McMillan 1992 (*Psych. Bull.* 111:42 — verified:
  54-experiment meta, incongruity advantage under weak/
  formed expectancies, congruent advantage under strong
  established schemas and in recognition); Sherman et al.
  1998 (*Psych. Sci.* — integration-theory model fit).
- Harris & Monaco 1978 (*JEP:G* 107:1 — pragmatic
  implication recalled as asserted); Brewer 1977 (linguistic
  inference constructivism).
- Higgins, Rholes & Jones 1977 (*JESP* 13:141 — trait-
  construct priming assimilates ambiguous behavior); Srull &
  Wyer 1979 (*JPSP* 37:1660); Bargh, Bond, Lombardi & Tota
  1986 (*JPSP* 50:869 — chronic accessibility); Martin 1986
  (set/reset — contrast boundary conditions); Macrae et al.
  1994 (suppression rebound amplifies primed categories).
- Erber & Fiske 1984 (*JPSP* 47:709 — outcome dependency →
  attention to inconsistency); Neuberg & Fiske 1987
  (*JPSP* 53:431 — dependency → individuation); Fiske &
  Dépret 1996 (power asymmetry: dependent individuates up).
- Baumeister, Stillwell & Wotman 1990 (*JPSP* 59:994 —
  victim/perpetrator narrative asymmetry); Stillwell &
  Baumeister 1997 (*Psych. Sci.* 8:219 — magnitude gap);
  Kearns & Fincham 2005 (gap → unforgiveness).
- McCullough et al. 2003 (*JPSP* 85:321 — forgiveness =
  motivation change); Worthington 2003 (decisional vs
  emotional); vanOyen Witvliet et al. 2001 (*Psych. Sci.*
  12:117 — physiology drops, episode intact); Exline et al.
  2003.
- Kiesler 1971 (*The Psychology of Commitment* — public
  declaration binds); Cialdini (consistency principle).
- Gabbert, Memon & Allan 2003 (71% co-witness adoption —
  the cap anchor for `echo_adopt_p`; reuse from FM§8).

## 131. v69 probes — social-memory VII (P721–P732)

- **P721** orphan impression (MUST — persistence):
  encode trait-implying behaviors on person X, decay all
  supporting records out; PersonModel[X] eval floors at
  ≥`orphan_eval_resid` and emits `orphan_eval:true`.
- **P722** orphan no-episode (MUST — locked null): no
  retrieval/drift path mints verbatim support for an
  orphan eval; tell-time gist rationalization allowed,
  record minting fails the battery.
- **P723** favor ledger (MUST — sign-locked asymmetry):
  matched give/receive favors — received outlasts given at
  every horizon; `favor_give_decay=0` fails the clamp
  (`favor_sym_null` structural).
- **P724** coalition overwrite (SHOULD): after ≥3
  alignment acts, external confusions concentrate
  ≥`coal_cat_overwrite`×100% within-faction across
  demographics; pre-conflict valence untouched
  (`coal_recolor_null` arm).
- **P725** relationship bump (SHOULD): recall density vs
  relationship-age peaks in `rel_bump_win` then baselines;
  relationship-cued recall returns landmark-dated reports.
- **P726** noticed absence + ghost null (MUST):
  expected-but-absent mints `noticed_absence` at
  ~`absence_p`/`abs_val`; under EVERY retrieval mode the
  record produces zero co-presence/siding/attendance for
  the absentee.
- **P727** blunder asymmetry (MUST): matched blunder
  self/observer — self hot+durable + rumin-eligible,
  observer fades ≥1.5×; `expected_recall` ≈
  `aud_recall_over`× observer actual.
- **P728** blunder audit (MUST — locked null): witnessed
  blunders never mint self-side shame/hot records even
  under observed-action flip conditions.
- **P729** central-speaker convergence (SHOULD):
  member-memory overlap with central speaker's selective
  version exceeds peripheral speaker's by
  `central_speaker_mult` margin; one-hop pairs converge at
  `net_hop_decay` of direct; out-group chains attenuate.
- **P730** dyad idioms (SHOULD): idiom cue succeeds
  in-dyad, fails at `idiom_dyad_gate` outside; post-
  `relationship:end` cue still fires at
  `idiom_orphan_loss` strength.
- **P731** rival watch (SHOULD — certainty lock):
  committed-edge threat cues retain at `rival_cue_gain`
  and resist disengagement; beliefStatus never auto-
  upgrades to "confirmed" (`rival_certainty_null`).
- **P732** provenance flatten (SHOULD — upgrade lock):
  3-node `prov_chain` loses ~`prov_flat_p` intermediate
  nodes/retell, re-anchors proximally, empties to
  `kind:"rumor"`; credibility never exceeds proximal
  speaker at any depth (`prov_upgrade_null`).

## 132. Sources verified this version (P721–P732 backing)

- Johnson, Kim & Risse 1985 (*JEP:LMC* 11:22 — Korsakoff
  affective reactions without retrievable person memory);
  De Houwer, Thomas & Baeyens 2001 (evaluative
  conditioning meta); Srull & Wyer 1989 (online
  impressions stored apart from behaviors).
- Greenberg 1980 / Greenberg & Westcott 1983
  (indebtedness — receiver-side obligation ledger);
  Ross & Sicoly 1979 (egocentric availability); Emmons &
  McCullough 2003; Watkins et al. 2003 (gratitude
  rehearsal retains benefits).
- Kurzban, Tooby & Cosmides 2001 (*PNAS* 98:15387 —
  coalitional encoding deflates race categorization in
  ~4 min); Pietraszewski, Cosmides & Tooby 2014 (*PLoS
  ONE* 9:e88534 — alliance cues regulate; sex/age
  persist).
- Buehlman, Gottman & Katz 1992 (*J. Fam. Psychol.*
  5:295 — oral-history bond variables predict stability
  ~94%; beginnings dominate narration).
- Gilovich, Medvec & Savitsky 2000 (*JPSP* 78:211 —
  spotlight ~2× overestimate); Savitsky, Epley &
  Gilovich 2001 (audience-retention overestimate).
- Coman, Manier & Hirst 2016 (*PNAS* 113:8171 —
  mnemonic convergence in 10-member networks); Yamashiro
  & Hirst 2020 (*JEP:G* 149:1000 — central speakers,
  ingroup amplification); Coman & Hirst 2015
  (transitive propagation).
- Hopper, Knapp & Scott 1981 (*Comm. Monogr.* 48:23 —
  couples' personal idioms); Bruess & Pearson 1997.
- Schützwohl & Koch 2004 (*EHB* 25:249); Schützwohl
  2005 (*EHB* 26:288 — cue recall); 2008 (*PAID* 44:633 —
  disengagement resistance, committed-only); Harris 2000
  (mechanism challenge — DEBATED tier).
- Provenance flattening: HYPOTHESIS composite — §4
  serial-reproduction leveling (Bartlett 1932; Allport &
  Postman 1947; Kashima 2000) + beta_source decay;
  `prov_upgrade_null` is the honesty commitment.

Registry: P1–P732. v69 suite: P721–P732 — 5 MUST
(P721–P723, P726–P728; P722/P723/P726/P728 carry locked
nulls) and 7 SHOULD (P724/P725/P729–P732; P731/P732
carry lock arms).

## 133. v69 formal-model probes — composition, context, surface (P733–P744)

Formal/consistency probes for spec §15 / formal-model.md Part VII.
These are machinery probes — they constrain the *algebra*, not a
psychological effect size.

- **P733** θ saturation (MUST — locked null): maximal legal
  penalty stack (stress>thresh inside lag window + daLoad=1 +
  evaluative + off-peak synchrony + selfinit + sem_search_tax) on
  age_eff=85; θ_eff ≤ θ + `theta_cap` identically; tanh
  monotonicity. `theta_unbounded = 0`.
- **P734** gain saturation (MUST — locked null): all E-gain legs
  composed simultaneously on a maximally-tagged event (self-agent
  + arousal + novelty + generated + enacted + spoken + boundary +
  isolated + value + mood-congruent); E_eff < 1 strictly and
  monotone non-decreasing in each leg. `e_overbound = 0`.
- **P735** modifier-ledger auditability (MUST): fuzz 10⁴ kernel
  calls; every effective-param deviation from base replays through
  `modLedger` entries in application order, bit-exact per §13.4;
  any unexplained deviation = FAIL (the param-side orphan_rewrite).
- **P736** graceful degradation (MUST — sign-locked axiom): at
  maximal θ shift, strength-1 maximal-cue records recall ≥
  `grace_floor` (0.05) over 10⁴ draws. The substrate may degrade
  a mind; it may not disable it.
- **P737** surface-map completeness (MUST): fuzz emission field
  combinations; every combination resolves to a `surfMap` row or
  a declared OPTIONAL; unknown combination = contract violation,
  never default rendering.
- **P738** hedge direction (MUST — sign-locked): hedged:true
  surfaces carry modal-uncertainty marks 100%; hearer-side
  adoption of hedged content never exceeds hedged-strength entry
  (S1 — no strengthening in transmission through the surface).
- **P739** content:null honesty (MUST — locked null): aff_flash
  and orphan_eval emissions produce zero content-field wording
  across the fuzz corpus. `surf_mint = 0` — feeling without scene
  is a first-class output.
- **P740** latency isolation (SHOULD): latency_ms bounded by
  lat_cap·`lat_mult_cap`; cross-record correlation of latency
  with θ = 0 — display observable only, never retrieval input
  (re-asserts P374 under the registry).
- **P741** context persistence (SHOULD): undelivered-since-t
  place cues re-match with probability ≈ exp(−Δt/`ctx_tau`)
  ± sampling noise; `|C.fields| ≤ att_span_ctx` invariant across
  10⁴ context transitions; internal fields exempt.
- **P742** oracle null (MUST — locked null): contexts injected
  with fields never delivered to the character yield cueMatch
  contribution 0 identically. `ctx_oracle = 0`.
- **P743** declaration gate (SHOULD — meta): every MemoryParams
  key resolves a paramDecl {class, signature, aliases}; every
  decl's probe ref resolves; undeclared key = build error under
  `identi_gate:"enforce"`.
- **P744** stiff-direction report (SHOULD — meta): validation runs
  emit top-k stiff directions of the param→verdict Jacobian on the
  full 28-character trait joint; new-params/no-new-stiff-directions
  parity is reported (not gated) per version.

## 134. Sources verified this version (P733–P744 backing)

- Craik, Govoni, Naveh-Benjamin & Anderson 1996 (*Psychol Sci*
  7:52 — age×divided-attention joint hit is bounded and
  sub-additive); Naveh-Benjamin, Craik, Guez & Kreuger 2000;
  Shields, Sazma, McCullough & Yonelinas 2017 (*Psych Bull*
  143:636 — stress×emotion retrieval meta, 113 studies). Basis of
  the saturating-additive law L1 (functional form is HYPOTHESIS;
  the bounded sub-additive sign is the empirical constraint).
- Tulving & Osler 1968 (*JEP* 77:593 — cue redundancy doesn't pay
  twice) — precedent for reusing noisy-OR on gains (L2).
- Roberts & Pashler 2000 (*Psych Rev* 107:358 — fits constrain
  theory only where the theory can fail) — warrant for bounded
  composition and the declaration gate.
- Estes 1955 (*Psych Rev* 62:74 — stimulus fluctuation); Mensink
  & Raaijmakers 1988 (*J Math Psych* 32:434 — context-drift
  forgetting); Howard & Kahana 2002 (*J Math Psych* 46:269 —
  retrieved context) — context-as-decaying-state grounding.
- Miller 1956 (7±2 — conservative cue-set cardinality basis for
  `att_span_ctx`; marked HYPOTHESIS).
- Koriat & Goldsmith 1996 (*Psych Rev* 103:490 — monitor-control;
  the hedge is informative); Brennan & Williams 1995 (*J Mem Lang*
  34:237 — listeners read hedges as FOK); Brown 1991 (*Psych
  Bull* 109:204 — TOT phenomenology); Smith & Clark 1993
  (*JPSP* 65:186 — response-time/memory-access covariance —
  latency-as-observable).
- Gutenkunst et al. 2007 (*PLoS Comput Biol* 3:e189 — sloppy
  directions) — the stiff/sloppy class definitions and P744's
  Jacobian report.

Registry: P1–P744. v69 suite: P733–P744 — 7 MUST (P733–P739,
P742; P733/P734/P739/P742 carry locked nulls; P736/P738 sign-
locked) and 5 SHOULD (P740–P744; P743/P744 meta).

## 135. v70 character-profiles probes — the narrator's compass (P745–P756)

Probes for spec §6.145–6.151 / cast-profiles.md Part III. Six of
twelve carry locked nulls — the compass moves selection, depth,
and wording; existence, provenance, and content are out of bounds.

- **P745** tp arrival-only (MUST — locked null): two identical
  archives (one old positive + one old negative record); run
  tp_pastpos-high and tp_pastneg-high twins; spontaneous-arrival
  ranking must swap, record fields identical bitwise.
  `tp_fate_null = 0`.
- **P746** perspective sign-lock (MUST — sign-locked): across the
  trait joint, spontaneous arrivals of old records must be
  monotone non-decreasing in tp_pastpos for valence>0 records and
  in tp_pastneg for valence<0 records; tp_preshed monotone
  non-increasing for all is_old records. Any inversion = FAIL.
- **P747** thematic depth split (MUST — sign-locked): same
  mixed-theme event encoded by narr_agency-high vs narr_comm-high
  twins → goal/obstacle field depth higher under agency,
  affiliative field depth higher under communion; total field
  mass equal within noise. Swap of sign = FAIL.
- **P748** theme never mints (MUST — locked null): event with no
  obstacle fields + narr_agency = 1 → emitted record carries zero
  goal/obstacle content over 10⁴ encodes.
  `theme_fabricate_null = 0`.
- **P749** lesson minting (SHOULD): autobio_k = 1, retell of a
  meaning ≥ 0.4 selfdef record → `lesson` persSem exists with
  `origin:"derived"` and `sources` back-linked; autobio_k = 0 →
  zero lessons over matched retell counts.
- **P750** lesson boundary (MUST — locked null): lessons
  rehearsed/retold ≥ 50 times keep `origin:"derived"` and never
  edit source-record fields. `lesson_truth_null = 0`.
- **P751** coherence linking (SHOULD): narr_coh_k 0 vs 1 twins,
  matched retell counts → link degree on told records diverges
  (≈0 vs >2); existing-link decay unaffected (control: kill new
  mints → link mass equalizes at baseline).
- **P752** chaptered walls (MUST — sign-locked): identical
  transition history, period_sal 0 vs 1 → cross-period cueMatch
  cost ratio ≈ (0.3 + 1.4·ps) scaling; monotone in period_sal.
- **P753** era wording is surface (MUST — locked null): period_sal
  sweep changes emission era-wording rate but record content and
  valence identical; `period_identity_null = 0`.
- **P754** future thickness (SHOULD): matched-age twins,
  epi_future_k 0.15 vs 0.9 → imagineEvent verbatim counts scale;
  sim_detail_mult age knot unchanged (age and trait orthogonal).
- **P755** rich futures stay futures (MUST — locked null):
  epi_future_k = 1, imagineEvent at max richness, no §6.9 flip
  path enabled → recall of the imagined event AS past = 0 over
  10⁴ draws. `future_leak_null = 0`.
- **P756** tension knocks, doesn't damage (MUST — locked null):
  selfdef twins tension 0 vs 1 → re-access rate differs
  (×1 + sdm_tension_intr), strength/valence/content identical.
  `tension_fate_null = 0`.

## 136. Sources verified this version (P745–P756 backing)

- Zimbardo & Boyd 1999 (*JPSP* 77:1271 — verified): ZTPI
  orthogonality → five independent pins, not a normalized
  simplex; D'Argembeau & Mathy 2011 (*J Cogn Psychol* 23 —
  verified): future-TP ↔ goal rehearsal.
- McAdams 2001 (*Rev Gen Psychol* 5:100); Adler 2012 (*JPSP*
  102:367); Adler, Lodi-Smith, Philippe & Houle 2016 (*PSPR*
  20:142) — thematic depth/retell emphasis; the FIELD-DEPTH
  mechanism mapping is our HYPOTHESIS.
- Pasupathi & Mansour 2006 (*Dev Psychol* 42:798); McLean,
  Pasupathi & Pals 2007 (*PSPR* 11:262); McLean & Thorne 2003
  (*Dev Psychol* 39:635) — lesson/self-event connections; the
  persSem `lesson` subtype is our formalization.
- Reese et al. 2011 (*Memory* 19:688) — coherence dimensions;
  narr_coh_k's link-mint role is our HYPOTHESIS.
- Thomsen 2009 (*Memory* 17) — chapter count/closure vary;
  period_sal is the per-character formalization of §4.18.
- Williams et al. 1996 (*Memory* 4:115 — verified): past↔future
  specificity coupling → epi_future_k prior; Schacter & Addis
  2007; Hassabis et al. 2007 — simulation needs the episodic
  machinery (locked null basis).
- Singer, Blagov, Berry & Oost 2013 (*JPSP* 105:262) — tension
  as a selfdef dimension; intrusion-only mapping is our
  HYPOTHESIS (tension→distress is established; tension→re-access
  is the plausible read).

Registry: P1–P756. v70 suite: P745–P756 — 9 MUST (P745–P748,
P750, P752, P753, P755, P756 — locked-null carriers: P745/P748/
P750/P753/P755/P756; sign-locked: P746/P747/P752) and 3 SHOULD
(P749, P751, P754).

## 137. Measurement backreaction (VA-MEAS) — the probe is a
## participant (new in v71, validation-design IV)

Every public measurement call is also an intervention. `recall`
strengthens the trace (testing effect — Roediger & Karpicke 2006,
*Psych Sci* 17:249, verified; meta-analytic d ≈ 0.5 vs restudy,
Rowland 2014, *Psych Bull* 140:1432, verified), `retell` mints
links and (v70) `lesson` records, `discussEvent` seeds distortion
through the harness's own interlocutor. A validation suite that
ignores this measures the studied system PLUS its own footprint.

Binding rules:

- **`measure_budget` is a required manifest field** — max
  observations per (member, record). Default 1 (destructive
  sampling): a member answers about a given record once, because
  the second answer is a different human fact — "remembered
  yesterday AND today" is a testing-effect datum, not an accuracy
  datum.
- **Repeated-measure probes must name the effect they ride.** A
  retest design is legal iff its declared target *is* retrieval-
  induced change; otherwise it is a lint fail.
- **Twin-arm self-calibration:** longitudinal probes run a
  measured arm and an unmeasured arm. Their divergence is the
  probe's own testing effect and must sit inside the declared
  band (§139); a probe whose footprint exceeds the human band is
  over-intervening — fix the schedule, not the model.
- **Analyzer correction:** `retrievalCount` (hidden tap, §2.4)
  is a mandatory covariate when comparing to human anchors —
  lab participants do not accumulate retrieval practice between
  encoding and test the way a probed character does.
- **Interlocutor dose control:** the harness's scripted
  discussant is a rumor source and must carry a declared dose —
  suggestion count, misleading-item load, post-event accuracy —
  exactly as Loftus, Miller & Burns 1978 controlled the
  misinformation dose. An undeclared-dose misinfo probe measures
  the script, not the character.

## 138. Endogenous selection (VA-COLLIDER) — condition on
## encoding, never on retrieval (new in v71)

Accuracy is only observable on retrieved records; conditioning on
retrieval is conditioning on a collider (selection on strength,
arousal, cue density — Elwert & Winship 2014, *Annu Rev Sociol*
40:31, verified). The known biases this produces:

- measured accuracy inflated (weak traces never enter the
  denominator);
- distortion rates biased down (the traces that survive to be
  scored are the ones that resist distortion);
- age gaps understated (older cohorts' lower retrieval culls
  more records before scoring — the surviving sample looks
  artificially similar).

Binding rules:

- **Denominators are the generator manifest**, not the retrieved
  set. Every accuracy/distortion statistic is per-encoded-event.
- `retrieved_frac` is a mandatory co-reported statistic; it is
  itself a primary outcome (humans forget — that is the point).
- "Not retrieved" is a verdict category, not missing data.
- Conditional-on-retrieval analyses are legal only when labeled
  `cond:retrieved` and may never be compared to unconditional
  human anchors.
- **Selection signature (P762):** conditional accuracy must
  exceed unconditional accuracy in any healthy build. If the
  signature inverts or vanishes, retrieval is not
  strength-selective — a spec bug in the cue/θ machinery, found
  by the bias audit rather than by any anchor.

## 139. Power registry and honest nulls (VA-MDE) (new in v71)

A non-significant difference is not an absence of effect — with
Button et al. 2013's (*Nat Rev Neurosci* 14:365, verified)
median-power-~20% warning as the standing caution, every probe
now carries:

- `mde` — minimum detectable effect at declared `n_eff`,
  α, and power (default 0.8);
- `n_eff` computed through the §45 Kish design-effect correction
  (ICC per cohort — clustering inflates nominal n);
- `sesoi` — smallest effect size of interest, set once per
  probe family at registration, never tuned per run.

**Null-verdict rule:** claims of absence (all CONTESTED negative
anchors, all locked-null probes, all "no difference between arms"
findings) require **equivalence testing** — TOST against the
`sesoi` bound (Lakens 2017, *Soc Psychol Personal Sci* 8:355,
verified). For CONTESTED anchors the bound is the failed RRR's
CI (e.g., ego depletion: Hagger 2016's [−0.07, 0.15]); for
locked nulls the bound is the family's `sesoi`. A probe that
reports "no effect, p = 0.3" without a TOST result is upgraded
to nothing — it is INCONCLUSIVE, and INCONCLUSIVE counts against
coverage the same as FAIL for gate purposes (a gate may not be
held open by an underpowered run).

Consequence under §110 versioning: verdicts issued under the old
"ns = absent" rule are archived under their probe_version;
equivalence-verdict probes carry new versions (P616 → P616v2).

## 140. The multiverse on the sloppy manifold (VA-MULTI)
## (new in v71)

§107 licensed legal diversity along sloppy eigendirections. The
conjugate obligation: verdicts must be robust across that legal
space, else the equivalence class was misdeclared.

- **Sloppy ensemble:** each MUST probe re-runs with each cast
  operating point perturbed along its declared-sloppy directions
  (magnitude ≤ the §107 equivalence radius) and across ≥2 legal
  `deriveParams` modifier sets. Report `pass_frac`; the MUST gate
  is pass_frac = 1.0 over the declared ensemble.
- **Failure attribution:** an ensemble failure is either a spec
  bug (the direction was not actually sloppy — re-stiffen) or a
  probe bug (it reads an unanchored direction — reclassify
  OBSERVE). Never silently re-run with a different jitter.
- **Analyzer specification curve:** SHOULD probes enumerate their
  legal analysis choices (time window, trimming rule, cohort
  composition) as a small specification curve (Simonsohn,
  Simmons & Nelson 2020, *Nat Hum Behav* 4:1208, verified;
  Steegen et al. 2016, *Persp Psychol Sci* 11:702; Silberzahn
  et al. 2018, *Adv Methods Pract Psychol Sci* 1:337 — 29
  teams, one dataset, divergent answers). The reported verdict
  is the median pipeline + the range; a SHOULD probe whose sign
  flips across legal pipelines is demoted to OBSERVE with the
  curve attached.
- This is the battery's answer to researcher degrees of freedom
  on *our* side — §44 governs peeking at results; VA-MULTI
  governs choosing the lens.

## 141. Transportability and constraints on generality (VA-WEIRD)
## (new in v71)

The anchor corpus is overwhelmingly drawn from WEIRD undergraduate
samples at lab timescales; the simulated population is children,
older adults, trauma histories, and months-long horizons. Henrich,
Heine & Norenzayan 2010 (*Behav Brain Sci* 33:61, verified) is
the standing warning; Simons, Shoda & Lindsay 2017 (*Persp
Psychol Sci* 12:1123 — constraints-on-generality) supplies the
mechanism: **no anchor statement is complete without its
conditions.**

Binding rules:

- Every anchor row carries `pop_scope`: {age_band, arousal
  regime, timescale class, culture_class:"weird_default" unless
  established otherwise}.
- A probe whose cohort ≠ the anchor's `pop_scope` must either
  (a) transport — apply the spec's declared moderator (e.g., the
  age×binding split, the childhood-amnesia window) and widen the
  band by the transport uncertainty — or (b) declare the anchor
  inapplicable and mark the probe `transported` or `unanchored`.
- `transported` verdicts never carry MUST weight alone; a MUST
  gate on a transported claim requires ≥1 same-population anchor
  in the family.
- Yarkoni 2020 (*Behav Brain Sci* 45:e1, verified) — the
  generalizability crisis is about *verbal* claims outrunning
  *statistical* support; our version: prose claims in the
  character bibles ("older adults remember gist") must trace to
  a transported band, not to the untransported lab number.
- Worked requirement (P768): child-cohort misinformation must
  exceed adult adoption — Ceci & Bruck 1993 / Bruck & Ceci 1999
  establish the direction; the band is transported, the sign is
  not negotiable.

## 142. New probes P757–P768 (v71 suite — validation-design IV)

- **P757** measure_budget lint (MUST — process): registry lint
  rejects any probe manifest missing `measure_budget`; default
  is 1; repeated-measure probes must name their target effect
  in the manifest or fail registration.
- **P758** destructive sampling (MUST): audit JSONL for
  (member, record) observation counts; any accuracy probe
  exceeding budget without `repeated_measures` registration =
  FAIL; duplicates found → entire probe output quarantined,
  not trimmed.
- **P759** probe-side testing effect (SHOULD): measured vs
  unmeasured twin arms at fixed RI; the measurement-arm
  advantage must land in the Rowland-2014 band (d ∈ [0.3, 0.7]
  after rep_shrink discipline, SESOI 0.2); outside either end =
  miscalibrated measure_budget or runaway strengthening.
- **P760** interlocutor dose monotonicity (MUST): two discussant
  scripts differing only in suggestion dose (0 vs k misleading
  items); phantom/adoption rate must be monotone non-decreasing
  in dose; a flat or inverted dose response means the misinfo
  channel is not dose-sensitive — FAIL (Loftus dose-control
  precedent).
- **P761** encoding-denominator lint (MUST — process): every
  accuracy/distortion row reports per-encoded denominators +
  `retrieved_frac`; conditional-only reporting is a registry
  lint fail; `cond:retrieved` rows may not be scored against
  unconditional anchors.
- **P762** selection signature (SHOULD): within each scored
  probe, accuracy|retrieved > accuracy overall; missing or
  inverted signature → retrieval is strength-blind, triage as
  spec bug in cue machinery, not a probe failure.
- **P763** power registry lint (MUST — process): every probe
  carries mde/power/n_eff/sesoi; null claims cite TOST vs the
  bound; "ns" without TOST = INCONCLUSIVE, and INCONCLUSIVE
  does not satisfy gates.
- **P764** equivalence-verdict upgrade (MUST): all negative
  anchors re-scored under TOST (P616v2 etc. per §139); a build
  "passing" a CONTESTED anchor only via underpowered ns =
  FAIL-by-underpower, not PASS.
- **P765** sloppy-ensemble robustness (MUST): each MUST probe's
  pass_frac over the declared sloppy ensemble = 1.0; each
  ensemble failure logged with spec-bug vs probe-bug
  attribution; un-attributed failures block release.
- **P766** specification-curve report (SHOULD): SHOULD probes
  emit median+range over declared analyzer pipelines; sign-flip
  across legal pipelines → demote to OBSERVE with curve
  attached; curve archived to the verdict ledger.
- **P767** pop_scope lint (MUST — process): every anchor row
  carries pop_scope; a probe citing an anchor outside scope
  without `transported` + widened band = lint fail; transported
  claims may not carry MUST weight alone.
- **P768** child-misinformation transport (SHOULD): child cohort
  vs midlife cohort, matched misinfo dose; child adoption must
  exceed adult by the transported direction (Ceci & Bruck);
  child ≤ adult = FAIL — the susceptibility moderator is
  absent or inverted.

## 143. Sources verified this version (P757–P768 backing)

- Roediger & Karpicke 2006 (*Psych Sci* 17:249 — verified):
  testing effect; the reason measurement is intervention.
  Rowland 2014 (*Psych Bull* 140:1432 — verified): testing-
  effect meta-analysis, d ≈ 0.5 vs restudy → P759 band after
  rep_shrink (SINGLE→META upgrade; the testing literature is
  among the most replicated in the field).
- Loftus, Miller & Burns 1978 (*J Verbal Learn Verbal Behav*
  17 — verified): misinformation paradigm with controlled dose;
  the dose-control precedent for P760.
- Elwert & Winship 2014 (*Annu Rev Sociol* 40:31 — verified):
  endogenous selection / collider bias; formal basis of
  VA-COLLIDER and P761–P762.
- Lakens 2017 (*Soc Psychol Personal Sci* 8:355 — verified):
  equivalence testing / TOST / SESOI discipline → VA-MDE,
  P763–P764. Button et al. 2013 (*Nat Rev Neurosci* 14:365 —
  verified): median power ~20% in neuroscience → why "ns"
  cannot mean "absent".
- Simonsohn, Simmons & Nelson 2020 (*Nat Hum Behav* 4:1208 —
  verified): specification-curve analysis. Steegen et al. 2016
  (*Persp Psychol Sci* 11:702 — verified): multiverse analysis.
  Silberzahn et al. 2018 (*Adv Methods Pract Psychol Sci*
  1:337 — verified): 29 analyst teams, same data, divergent
  conclusions → analyzer spec curves are not optional.
- Henrich, Heine & Norenzayan 2010 (*Behav Brain Sci* 33:61 —
  verified): WEIRD sampling. Simons, Shoda & Lindsay 2017
  (*Persp Psychol Sci* 12:1123 — verified): constraints on
  generality → `pop_scope`. Yarkoni 2020 (*Behav Brain Sci*
  45:e1 — verified): generalizability crisis → transported
  bands for bible claims.
- Ceci & Bruck 1993 (*Psych Bull* 114:403); Bruck & Ceci 1999
  (*Psychol Public Policy Law* 5:136 — verified): children's
  heightened suggestibility — direction established,
  magnitude transported → P768.
- Reused: Kish 1965 (§45 design effect → n_eff); Gutenkunst
  2007 (§107 sloppy manifold → the VA-MULTI ensemble);
  Johari 2017 (§44 peeking — complementary to lens choice);
  OSC 2015 / Camerer 2018 (rep_shrink discipline, §105);
  Nosek 2018 / §110 probe versioning (P616v2 archival).

Registry: P1–P768. v71 suite: P757–P768 — 8 MUST (P757, P758,
P760, P761, P763, P764, P765, P767 — of which four are process
lints: P757, P761, P763, P767) and 4 SHOULD (P759, P762, P766,
P768). Versioned upgrades: P616 → P616v2 (TOST regime).
Net new machinery: VA-MEAS, VA-COLLIDER, VA-MDE, VA-MULTI,
VA-WEIRD — the battery now disciplines its own footprint, its
own denominators, its own nulls, its own analyst choices, and
its own population claims.

## 144. New probes P769–P778 (v72 suite — encoding-mechanics VI)

- **P769** value ordering under overflow (MUST): n > wm_cap events
  with graded importance → high-importance fields survive at the
  value_rank_w-implied rate; the (high−low) value recall gap widens
  with deficit_proxy at matched overall recall (Castel 2002/2009
  selectivity shape; MUST-tier on the interaction, not the size).
- **P770** value×memorability crossover (MUST): deficit cohort
  shows the selectivity advantage on easy-high-value fields AND
  its collapse on hard-high-value fields (Psych. Aging 2025
  moderator); young cohort near-flat on both — a build where the
  deficit cohort selects equally on hard items fails.
- **P771** choice (SHOULD): choice:true mints higher E + lower
  day-1 β than yoked assigned events; unchosen alternatives show
  no gain (choice_scope audit); effect survives memoranda-content
  decoupled from the choice (Murty 2015 design).
- **P772** error-type triple (MUST): conceptual-guess pretests >
  errorless > arbitrary-guess pretests on target recall; the
  conceptual leg is age-flat (Cyr & Anderson 2015); arbitrary
  guesses intrude at recall for deficit_proxy>0.6 profiles only
  (Baddeley & Wilson 1994 phenotype).
- **P773** saying-is-believing gate (MUST): sharedReality retells
  drift the speaker record toward audience_tune at sib_drift rate;
  politeness/incentive motives TOST-equivalent to zero drift
  (SESOI 0.05 — locked null enforced, not assumed); outgroup
  audiences attenuate; lie:true retells leave truth records
  untouched.
- **P774** observed tier ordering (SHOULD): enacted > observed >
  heard at matched attention, observed inside [verbal,
  verbal+0.7·enact]; obsIntent doubles the leg; observed records
  get NO DA-resistance (boundary — a build where watched actions
  survive distraction like performed ones fails).
- **P775** face distinctiveness (SHOULD): high-faceDistinct persons
  accrue familiarity faster and write wider person fields;
  attract_recog_null TOST-enforced (typical-attractive faces
  |Δ| ≤ 0.03); multiplicative composition with owngroup_loss.
- **P776** secret load (MUST): a held secret ≈ 1.5 pending-intention
  units of tonic daLoad inside the shared n≤5 cap — measurable as
  reduced pending_cue_gain on NON-secret overlaps while secrets are
  held (secrets evict errands); secret-overlap cues encode hotter
  (secret_heat_mult); disclosure ends both legs at once.
- **P777** retrograde shield (OBSERVE): intox-onset → pre-onset
  records show reduced next-window interference accrual;
  on-intoxication records unchanged (retro_scope audit); stored
  strength never increases (retro_consol_null — a build where
  drinking raises strength fails by construction); band wide per
  Quevedo-Pütter & Erdfelder 2022.
- **P778** v5.20 regression (MUST — structure): new fields/params
  pass P457 non-interference (audience_tune drift is a §13.1
  citizen; secrets occupy the existing pending budget; choice/
  obs/face legs touch E and β only) and §12.2 commutativity (no
  new op reads across charIds).

## 145. Sources verified this version (P769–P778 backing)

- Castel, Benjamin, Craik & Watkins 2002 (*Psychol Aging* 17:209 —
  verified): value-directed remembering, older adults match young
  on high-value. Castel, Balota & McCabe 2009 (*JEP:A* 35:916 —
  verified): disproportionate high-value allocation. Castel 2007
  (*PLM* 48 — verified chapter): evaluative processing framework.
  Psych. Aging 2025 strategic-VDR study (verified abstract):
  selectivity fails on low-memorability high-value items — the
  P770 crossover. Knowlton & Castel 2022 (*Cognition* 222 — review
  thread).
- Murty, DuBrow & Davachi 2015 (*J Neurosci* 35:6255 — verified):
  choice → striatal anticipation → hippocampal encoding, content-
  unlinked. Murty et al. 2019 (*PB&R* 26:1788 — verified pooled):
  delayed-recognition advantage + preference correlation. Murty et
  al. 2019 (*J Cogn Neurosci* — verified): reduced forgetting rate.
- Cyr & Anderson 2015 (*JEP:LMC* — verified): conceptual vs lexical
  guesses; stepping stones, age-flat; guess memory mediates.
  Cyr & Anderson 2012 (*Psychol Aging* — verified): conceptual
  errorful → source memory, older ≥ younger. Baddeley & Wilson
  1994; Clare & Jones 2008 (*Neuropsychol Rehabil* review);
  Kessels & de Haan 2003 (*JINS* meta).
- Higgins & Rholes 1978; Echterhoff, Higgins & Groll 2005 (*JPSP*
  89:257 — verified: shared-reality necessity, ingroup, trust
  mediator); Echterhoff, Higgins, Kopietz & Groll 2008 (*JEP:G*
  137:3 — verified: motive gate); Echterhoff et al. 2009 (*Soc
  Psychol* 40:150); EJSP 2024 meta (27 studies — verified:
  outgroup/identity-threat attenuation).
- Jaroslawska, Gathercole, Allen & Holmes 2016 (*Mem Cognit*
  44:1183 — verified: observation ≈ enactment on instruction
  recall); Steffens & von Stülpnagel 2015 (*Front Psychol* 6:1907 —
  verified design-dependent boundary).
- Light, Kayra-Stuart & Hollander 1979 (*JEP:HLM* 5:212 —
  verified); Vokey & Read 1992 (verified: distinctiveness
  mediation); Wickham & Morris 2003 (verified: attractiveness
  null); Valentine 1991 (face-space).
- Slepian, Chun & Mason 2017 (*JPSP* 113:1 — verified: mind-
  wandering ≈2× concealment; preoccupation predicts harm);
  Lane & Wegner 1995 (secrecy hyperaccessibility).
- Parker et al. 1980 (*Psychopharmacology* 69:219 — verified) +
  1981 dose-response; Mueller, Lisman & Spear 1983 (*Physiol
  Behav* — verified: interference account); Gawrylowicz et al.
  2017 (misinfo resistance); Quevedo-Pütter & Erdfelder 2022
  (*Exp Psychol* 69:335 — verified prereg replication: recall
  null, retrieval-side benefit).
- Fold/null backing: Rhodes & Castel 2008 (font-size JOL —
  report-side only); MacKay et al. 2004 + Janschewitz 2008
  (taboo → arousal+isolated fold).

Registry: P1–P778. v72 suite: P769–P778 — 5 MUST (P769, P770,
P772, P773, P776 — of which P773 is a locked-null TOST gate),
4 SHOULD (P771, P774, P775, P777-as-OBSERVE counts separately:
P777 is OBSERVE; SHOULD = P771, P774, P775), 1 OBSERVE (P777),
1 structure MUST (P778).

## 146. New probes P779–P786 (v73 suite — forgetting-curves VII)

- **P779 stim tier (MUST — structure + behavior):** a sub-`att_min`
  attended input answers a re-cue at ≥0.5 hit rate inside ~30s and
  ~0 after 5 min; ghosts mint no records, no archive entries, no
  post-death cue matches; `stim_mint_null` lint — no code path
  upgrades a ghost after expiry; re-presentation inside the window
  encodes normally (repair path). Constrains stim_hl/stim_recall_p/
  stim_cap.
- **P780 freqRecall (SHOULD):** encode 20 cluster members, archive
  ~70% — estimate regresses toward `freq_base` monotone in coverage;
  one arousal-0.9 member lifts n̂ above the availability-free
  estimate; lint — no stored counter field exists.
- **P781 audience responsiveness (MUST — sign-locked):** matched
  records retold once to attentive vs distracted listeners —
  distracted S-growth ≤0.5× attentive AND TOST-equivalent to the
  no-retell arm at 7d; `lastAccessDay` refresh and §6.1 drift
  identical across arms (telling ≠ keeping).
- **P782 collaborative inhibition + afterglow (MUST):** two
  characters sharing a 12-record cluster — joint coverage <
  nominal solo union by ≈collab_inhib; each participant's
  post-session solo recall of own unshared records beats a
  never-collaborated control; emission is one merged
  Reconstruction (structure lint).
- **P783 confidence lag (MUST):** at 30d, mean `conf − R` gap is
  positive and grows with record age; a retell raises conf without
  raising verbatim accuracy; `conf_feed_null` structure-checked —
  conf never enters θ, hit-rate, or accuracy.
- **P784 spacing illusion (SHOULD — structure):** spontaneous
  retell inter-gap distribution is clustered (mode ≪ lag_optimal),
  never optimum-tracking; lint — no code path schedules retells
  from lag_opt_ratio; a "keep remembering" directive produces
  massed-rate self-rehearsals only.
- **P785 remembered duration (SHOULD):** two equal-length intervals
  differing 3× in encoded-event count — dense reports ≥1.5× longer;
  transition-containing longer still; stored days never mutated
  (report-side lint).
- **P786 weekday snap (SHOULD):** weak when-field weekday reports
  biased midward (mean weekday-distance vs uniform shrinks), ±1d
  errors modal; weekend-encoded ~half the snap; strong when-fields
  unaffected.

Registry: P1–P786. v73 suite: P779–P786 — 3 MUST (P779, P781, P782,
P783 — four MUST counting P783), 4 SHOULD (P780, P784, P785, P786).

## 147. Sources verified this version (P779–P786 backing)

- **Buffer tier — CONSENSUS textbook:** Sperling 1960 (iconic,
  ~0.25–1s); Darwin, Turvey & Crowder 1972 (*Cogn. Psychol.* 3:255 —
  echoic ~2–4s); Peterson & Peterson 1959 (*JEP* 58:193 — ~15–20s);
  Keppel & Underwood 1962 (*J. Verbal Learn.* 1:153 — PI account of
  STM loss); Waugh & Norman 1965 (duplex). Ghost-tier mechanics are
  our reduced form — magnitudes HYPOTHESIS.
- **Frequency estimation — CONSENSUS mechanism:** Hasher & Zacks
  1979 (*JEP:G* 108:356 — automatic frequency encoding); Greene
  1984 (incidental frequency); Williams & Durso 1986 (*JEP:LMC*
  12:165 — category frequency judged from instances); Tversky &
  Kahneman 1973 (*Cogn. Psychol.* 5:207 — availability).
- **Listener responsiveness — ESTABLISHED (three studies, one
  group):** Pasupathi, Stallworth & Murdoch 1998 (*Discourse
  Processes* 26:1 — verified: attentive ≈ gain, distracted ≈ none);
  Pasupathi & Rich 2005 (*J. Personality* 73:1051 — verified);
  Pasupathi & Hoyt 2010 (*Memory* 18:185 — verified: distracted →
  lower retention + lower consistency at 1 month). The
  `aud_resp_distract` multiplier encodes the headline directly.
- **Collaborative inhibition — CONSENSUS meta:** Weldon & Bellinger
  1997 (*JEP:LMC* 23:1160 — verified); Basden, Basden, Bryner &
  Thomas 1997 (*JEP:LMC* 23:626 — strategy disruption); Marion &
  Thorley 2016 (*Psych. Bull.* 142:1141 — verified meta: inhibition
  robust; post-collaborative individual benefit on 27 effects).
  Magnitudes (0.8/0.1) are fits.
- **Confidence delay — CONSENSUS direction:** Sauer, Brewer, Zweck
  & Weber 2009 (*Law Hum. Behav.* 34:337, N=1,063 — verified:
  delay → overconfidence ↑, diagnosticity ↓); Odinot & Wolters
  2006 (*ACP* 20:973 — verified); Odinot, Wolters & Lavender 2009
  (*ACP* — verified: repeated questioning inflates conf for
  correct AND incorrect).
- **Spacing illusion — CONSENSUS:** Kornell & Bjork 2008 (*Psych.
  Sci.* 19:585 — verified: massed judged better after contrary
  evidence); Son 2004; Toppino & Cohen 2009 (*JEP:LMC* 35:1352 —
  verified: forced spacing attenuates — metacognitive control).
- **Retrospective duration — CONSENSUS direction:** Ornstein 1969
  (storage-size); Block & Reed 1978 (*JEP:HPP* 4:656 — contextual
  change); Block & Zakay 1997 (*PB&R* 4:184 meta); Avni-Babad &
  Ritov 2003 (*JEP:G* 132:543 — routine paradox).
- **Weekday snap — CONSENSUS phenomenon:** Huttenlocher, Hedges &
  Prohaska 1988 (*Psych. Rev.* 95:471 — hierarchical ordered-domain
  estimation, midward regression); Huttenlocher, Hedges & Bradburn
  1990 (*JASA* 85:180 — elapsed-time reports).
- **Established vs hypothesis summary:** all eight mechanism
  directions are established or better; every magnitude (ghost
  half-life, resp weights, inhib constant, conf slope, duration
  weights, snap rate) is an RW HYPOTHESIS fitted to consensus shape.

## 148. New probes P787–P794 (v74 suite — retrieval-cues VII)

- **P787 mode gating (MUST — sign-locked):** same record, same
  cue mass — `orient:semantic` emits zero verbatim/scene fields
  and never produces `tot:true`; `orient:episodic` emits both;
  a mid-bout rephrase semantic→episodic recovers detail with a
  §66-restart signature (Tulving 1983; Herron & Rugg 2003).
- **P788 cue valence (SHOULD):** at matched mood, a positive cue
  retrieves positive records ≥1.15× vs a valence-flipped cue on
  the same store; a negative cue against a neurot/depr-high
  profile raises the generic-record share (Williams & Broadbent
  sign). Mood held fixed — the effect must NOT vanish (cue-side,
  not mood-side).
- **P789 conjunctive cue (MUST):** two cues each with marginal
  fan ≥10 but joint fan ≤2 retrieve their joint target at ≥1.3×
  the noisy-OR prediction without the bonus, and beat a
  same-mass single-field cue; `config_oracle_null`
  structure-checked — conjunction never reaches into unencoded
  fields.
- **P790 event cluster (MUST — two arms):** cuing with one
  cluster member retrieves a cluster-mate at ≥1.3× a
  non-cluster record matched on temporal distance; AND clustered
  records' when-field error exceeds unclustered controls at
  equal R (content protected, calendar smeared — Brown &
  Schopflocher 1998; Brown 2005).
- **P791 burst structure (SHOULD):** emission inter-arrival
  times within a bout are bimodal — within-pulse gaps <
  between-pulse gaps by ≥3×; a pulse break predicts a shift in
  the dominant cue field of subsequent emissions (Gruenewald &
  Lockhead signature).
- **P792 analogical reminding (SHOULD — gated):** struct-matched
  records with zero surface overlap emit ≤`reminder_chance` and
  always carry `reminding:true`; with surface support present,
  struct-match raises emission ordering (Gentner et al. 1993's
  retrievability/judgment split as a sign-lock).
- **P793 contextual cuing (MUST — record-free):** an ambient
  character in a cfg seen `ctx_thresh`+ times orients/acts
  faster than in a novel cfg — AND the store shows no mint, no
  cueVector entry, no Reconstruction; at age 75+ the gain is
  undiminished (`ctx_age_pen = 0`, structure-checked — Howard
  et al. 2004).
- **P794 give-up rule (MUST — metacognitive):** identical
  failing searches with manipulated partial info — high-FOK
  failures run longer (more candidate evaluations) AND re-fire
  within `fok_win` at `fok_reprobe` rate; a forced interruption
  emits `giveUp` with the fok tag, log-distinguishable from
  "not found" (Singer & Tiede 2008 persistence arm).

Registry: P1–P794. v74 suite: P787–P794 — 5 MUST (P787, P789,
P790, P793, P794), 3 SHOULD (P788, P791, P792).

## 149. Sources verified this version (P787–P794 backing)

- **Retrieval mode — CONSENSUS existence, DEBATED gate strength:**
  Tulving 1983 (*Elements of Episodic Memory* — ecphory triad);
  Herron & Rugg 2003 (*J. Cogn. Neurosci.* 15:843 — verified:
  orientation dissociable from cue content); Rugg & Wilding 2000
  (*Trends Cogn. Sci.* 4:108 — verified). Binary `orient` is our
  reduced form of a graded attentional set — HYPOTHESIS form.
- **Cue valence — CONSENSUS direction:** Crovitz & Schiffman
  1974 (*JEP* — word-cue norms incl. valence effects); Schlagman,
  Schulz & Kvavilashvili 2006 (*Memory* 14 — verified:
  involuntary AMs match cue content AND valence); Williams &
  Broadbent 1986 (negative cues → overgeneral in vulnerable —
  verified). `w_valcue` magnitude HYPOTHESIS; mood-channel
  dominance is the established ordering.
- **Conjunctive cues — CONSENSUS mechanism, HYPOTHESIS form:**
  Watkins 1979 (cuegrams — cue and trace same kind);
  Tulving 1983 (interactive ecphory); Rubin & Wallace 1989
  (*Cogn. Psychol.* 21:513 — conjoined-cue non-additivity,
  verified). `config_gain`/joint-fan pricing is our
  operationalization of the fan effect's other face.
- **Event clusters — CONSENSUS existence:** Brown & Schopflocher
  1998a (*Psychol. Sci.* 9:470 — verified: clusters regardless of
  age/importance, causally+temporally+thematically bound,
  narration not necessary) + 1998b (*ACP* 12:305 — verified);
  Brown 2005 (*Memory* 13 — transitions concentrate cluster
  formation); dating-blur per Brown, Shevell & Rips 1986.
  `clust_*` magnitudes HYPOTHESIS.
- **Burst emission — CONSENSUS phenomenon:** Gruenewald &
  Lockhead 1980 (*JEP:HLM* 6:225 — verified bimodal IRTs);
  Barsalou 1988 (in Neisser & Winograd eds. — verified: AM
  output chunked by event type/period). Pulse constants are
  fits to phenomenology, not to an IRT corpus — flagged.
- **Analogical reminding — CONSENSUS asymmetry:** Gentner,
  Rattermann & Forbus 1993 (*Cogn. Psychol.* 25:524 — verified:
  surface dominates retrieval, structure dominates judgment);
  Wharton et al. 1994 (*Mem&Cogn.* 22 — verified: structure-
  only remindings rare but real); Schank 1982 (*Dynamic
  Memory*). The surface gate IS the literature; `w_struct` and
  `reminder_chance` are fits.
- **Contextual cuing — CONSENSUS, clean dissociation:** Chun &
  Jiang 1998 (*Cogn. Psychol.* 36:28 — verified); Chun & Phelps
  1999 (*Nat. Neurosci.* 2:844 — verified: hippocampal amnesics
  fail); Howard, Howard, Dennis, Yankovich & Vaidya 2004
  (*Neuropsychology* 18:124 — verified: spared in healthy aging
  while sequence learning declines). The record-free layer and
  `ctx_*` constants are HYPOTHESIS plumbing on a consensus
  dissociation.
- **Search termination — CONSENSUS that FOK gates persistence:**
  Nelson & Narens 1990 (monitor→control framework); Koriat 1993
  (*Psych. Rev.* 100:609 — accessibility account); Costermans,
  Lories & Ansay 1992 (*Acta Psychol.* 80 — FOK predicts
  persistence); Singer & Tiede 2008 (*Mem&Cogn.* 36:588 —
  verified: FOK scales search duration). Budget algebra,
  `fok_reprobe`, and the giveUp verdict are our construction —
  "it came to me later" emerges, never scripted.
- **Established vs hypothesis summary:** all eight mechanism
  directions are established or better (mode, valence,
  conjunction, clusters, bursts, structure-gating, record-free
  configural learning, FOK-gated persistence); every magnitude
  and the ctxcue/giveUp plumbing are RW HYPOTHESES fitted to
  consensus shape.

## 150. New probes P795–P804 (v75 suite — age-development VII)

- **P795 context lock (MUST — sign-locked):** a record encoded at
  3, intact S, queried at 12 with a topical/name cue only → no
  retrieval; same query with place+sensory reinstatement →
  retrieval. Matched adult-encoded control retrieves on the
  partial cue. Flag persistence check: at 40 the record STILL
  fails the partial cue (ctx_strict_val stored at mint).
  Butler & Rovee-Collier 1989.
- **P796 DF output gate (MUST — two arms):** `dforget` flagged at
  retrievalAge 6 leaves S and ecology intact (structure-check:
  zero df_theta activity — locked `df_erase_null`) while raising
  emission threshold — surfaces on strong cues, withheld on
  weak; same flag at 12+ runs the adult df_theta path.
  Harnishfeger & Pope 1996.
- **P797 child gist suppression (SHOULD — the Howe sign):** at
  retrievalAge 7, `dforget` suppresses phantom/gist_lure records
  MORE than true records (df_gist_gate); at 30 the asymmetry
  inverts or vanishes. Howe 2005.
- **P798 field budget (MUST):** encodeAge-4 mints ≤4 cueVector
  fields, `when`/`why` dropped first; encodeAge-10 ~5–6; adult
  uncapped. Drop order fixed, not random — `when` survives a
  child mint only when under budget. Gathercole et al. 2004;
  Jones & Pipe 2002.
- **P799 adolescent dip (MUST — shape-locked):** same
  encodeAge-6 record queried at 10, 15, 20 → R(15) < R(10) AND
  < R(20) for survivors; failed window queries carry
  `reorg_hit` and the `reorg_attrit` S-loss — attrition on the
  queried-and-failed, not the untouched. Peterson et al. 2011.
- **P800 time-PM child arm (SHOULD):** matched intentions,
  `cueType:time` vs `cueType:event` at 6 → event fires ≥1.8×
  more; at 14 gap ≤1.3×; `pm_clock_p`-high children halve the
  gap via check events (compensation behavioral). Ceci &
  Bronfenbrenner 1985; Kvavilashvili et al. 2008.
- **P801 child-tells (SHOULD):** a 7-year-old recounting her own
  past consolidates it more than hearing a caregiver recount the
  same event to her; reminiscence_env modulates both leg rate
  and per-leg gain. Reese, Haden & Fivush 1993.
- **P802 intent unlock (SHOULD):** `to_remember` at 5 gains
  ≥1.35× the adult relative boost; flag-absent vs flag-present
  ordering never inverts. Baker-Ward et al. 1984.
- **P803 enactment U (SHOULD):** enacted-vs-observed encode
  ratio peaks at ~4y (≈4× via obs_gain × enact_rescue), narrows
  ~1.2× adult, re-widens ≥1.4× at 85 — both arms on the same
  content. Ratner et al. 1991; Bäckman & Nilsson 1985.
- **P804 v5.23 regression (MUST — structure):** all v5.23 params
  at defaults reproduce v5.22 outputs on the standard battery
  except the sign-locked differences above; rif_k untouched —
  the J9 null finding (RIF intact in children) is asserted as
  "no child ramp exists to remove".

Registry: P1–P804. v75 suite: P795–P804 — 4 MUST (P795, P796,
P798, P799), 1 structure-MUST (P804), 5 SHOULD.

## 151. Sources verified this version (P795–P804 backing)

- **Context specificity — CONSENSUS for infants:** Butler &
  Rovee-Collier 1989 (*JEP:LM&C* 15 — crib-liner/context change
  abolishes 3-month retention); Rovee-Collier & Shyi 1992;
  Hayne & Findlay 1995 (context cost declines across infancy).
  The permanence of `ctx_locked` into adulthood is our
  HYPOTHESIS extension — the lab measures weeks.
- **Directed forgetting — CONSENSUS late onset of the
  controlled kind:** Harnishfeger & Pope 1996 (*J. Exp. Child
  Psychol.* 62:292 — verified: no DF in 1st, reduced in 3rd,
  adult-like in 5th graders); Zellner & Bäuml 2004; Wilson &
  Kipp 1998 (*Dev. Rev.* 18:86 — verified review); Aslan,
  Staudigl, Samenieh & Bäuml 2010 (*PBR* 17:784 — verified:
  production deficiency, high-emphasis cues partially rescue).
  **Child false-memory suppression — CONSENSUS finding, one
  study:** Howe 2005 (*Psychol. Sci.* 16 — verified: children
  suppress DRM false recall under forget cues; adults don't).
  `df_gate`/`df_gist_gate` magnitudes HYPOTHESIS.
- **RIF null — CONSENSUS:** Zellner & Bäuml 2005 (*Mem&Cogn.*
  33:396 — verified: retrieval inhibition + part-list cuing
  intact in children); Ford, Keating & Patel 2004 (*Br. J.
  Dev. Psychol.* 22:585 — verified: 7-year-olds show
  adult-magnitude RIF). Logged as the version's deliberate
  non-addition (J9).
- **Field budget — CONSENSUS direction, HYPOTHESIS form:**
  Gathercole, Pickering, Knight & Stegmann 2004 (*JEP:G* 133 —
  verified WM span norms); Jones & Pipe 2002 (recall
  completeness 5→9). The field-cap operationalization and the
  drop-order are ours.
- **Adolescent dip — CONSENSUS drop, HYPOTHESIS split:**
  Bauer & Larkina 2014 (already §2); Peterson, Grant & Boland
  2005; Peterson, Warren & Short 2011 (*Memory* 19 — verified:
  earliest-memory forward drift across childhood); Habermas &
  de Silveira 2008 (narrative reorganization 12–18). The
  60/40 access/attrition split and `reorg_attrit` mark are RW
  construction — falsifiable via P799.
- **Time-based PM — CONSENSUS dissociation:** Ceci &
  Bronfenbrenner 1985 (*Dev. Psychol.* 21 — verified: strategic
  clock monitoring); Kvavilashvili, Kyle & Messer 2008
  (verified review: event-based early, time-based late).
  `pm_clock_p` plumbing is ours.
- **Child-as-narrator — CONSENSUS mechanism:** Reese, Haden &
  Fivush 1993 (*Cog. Dev.* 8 — verified: maternal elaboration
  acts through child participation); Welch-Ross 1997; Fivush,
  Haden & Reese 2006; Reese & Newcombe 2007 (longitudinal).
  The per-event gain (0.3) and env routing are fitted.
- **Intent instruction — CONSENSUS direction:** Baker-Ward,
  Ornstein & Holden 1984 (*J. Exp. Child Psychol.* — verified:
  children benefit more from remember-instructions).
  Magnitude knots HYPOTHESIS.
- **Enactment child arm — CONSENSUS existence:** Ratner,
  Smith & Dionne 1991; Cohen 1981 (SPT robust in children).
  The U-completion knots are extrapolation — flagged.
- **Established vs hypothesis summary:** directions all
  established (context-lock, DF-late/output-split, thin mints,
  adolescent dip, time-PM lag, child-narration channel,
  instruction unlock, enactment U); every magnitude and the
  ctx_locked-permanence extension are RW HYPOTHESES.

## 152. New probes P805–P814 (v76 suite — age-decline VII)

- **P805 trajectory classes (MUST — distribution-lock):** a
  300-profile cohort aged 35→85 under default draws yields
  maintain/average/decline within 0.10–0.26 / 0.55–0.80 /
  0.06–0.22; the maintain arm's 75yo episodic output ≥ the
  average arm's 65yo; the decline arm's second-half slope ≥
  1.3× its first-half (acceleration). Josefsson 2012.
- **P806 IIV precedence (MUST — order-lock):** decline-arm
  profiles show elevated response variance (iiv_eff)
  measurably BEFORE mean level shifts — the variance anomaly
  leads the level anomaly by `iiv_lead`±1 sim-year; average
  arm shows concurrent-not-leading variance. Lövdén 2007.
- **P807 SCD sign flip (MUST — sign-lock):** decline-arm
  complaint-channel reports (meta_conf, self-report
  emissions) exceed measured deficit during the `scd_lead`
  window, then converge to it; maintain arm never shows
  complaint>deficit at defaults; `scd_store_null` — S
  untouched in both arms. Jessen 2014.
- **P808 retirement overlay (SHOULD):** `work_engaged:false`
  at 62 adds an encode-side deficit ramping ~8y to
  `retire_cap`; `engage_sub`=1 recovers ≥50%; retrieval-side
  metrics flat — `retire_retrieval_null`. Rohwedder & Willis
  2010.
- **P809 locomotion tax (MUST — dissociation):** identical
  events encoded sitting vs `locomoting` at 75 differ ≥1.3×
  on S; the sitting-vs-locomoting gap at 35 ≤0.15; armed
  time-intentions during locomotion fire less
  (`loco_pm_pen`). Lindenberger 2000.
- **P810 nav split (MUST — shape-lock):** a route learned at
  78, queried same-direction, retrieves; queried from the
  reversed approach at a decision corner fails ≥1.8× more
  (`ego_dir_pen`); permastore venue routes exempt —
  `nav_permastore_null`. Wiener 2013.
- **P811 implicit floor (MUST — sign-lock):** priming/ctxcue/
  script-rate legs at 82 are statistically identical to 55yo
  values while matched episodic legs differ ≥1.5× —
  `proc_age_null`. Fleischman 2004.
- **P812 observation inflation split (SHOULD):** tail_ind
  profiles at 80 show "did it myself" false alarms ≥1.4× the
  young-tail rate while median profiles match the young rate;
  `obs_old_gain` boosts TRUE observed-action recall more at
  80 than 30 — both halves of the Lindner dissociation, rate
  AND benefit. Lindner 2010/2014.
- **P813 I/E narration shift (MUST — probe-resistant):**
  free-recall emissions at 78 show external-detail share ≥
  young rate AND interviewMode probing recovers proportionally
  less internal detail than recol_mult alone predicts — the
  semantic skew is a mix shift, not a threshold artifact.
  Levine 2002.
- **P814 stack audit (MUST — process):** joint old-age
  products never exceed `stack_cap`; `stack_capped` fires on
  <2% of 80+ events at defaults; if it fires more, FAIL as
  miscalibration of the knots, not the cap. AD§105.

Registry: P1–P814. v76 suite: P805–P814 — 7 MUST (P805, P806,
P807, P809, P810, P811, P813), 1 process-MUST (P814), 2 SHOULD
(P808, P812).

## 153. Sources verified this version (P805–P814 backing)

- **Trajectory classes — CONSENSUS existence:** Josefsson,
  de Luna, Pudas, Nilsson & Nyberg 2012 (*J. Am. Geriatr.
  Soc.* 60:2308 — verified: Betula N=1,558, 15y, 18/68/13%
  classes; education/activity/partnered/female → maintain;
  APOE ε4 → decline); Pudas et al. 2013; Betula dementia
  follow-up (decliners ~4× risk; maintainers ~2.6× reduced —
  verified). Class boundaries are a ±1 SD rule — flagged
  SEMI-arbitrary; trait-draw magnitudes HYPOTHESIS.
- **IIV precedence — CONSENSUS direction:** Hultsch,
  MacDonald & Dixon 2002; MacDonald, Nyberg & Bäckman 2006;
  Lövdén, Li, Shing & Lindenberger 2007 (*Neuropsychologia*
  — verified: trial-to-trial RT variability precedes/predicts
  13y decline, BASE ages 70–102); longitudinal meta r≈.20
  CI[.09,.31] — verified. `iiv_lead` magnitude HYPOTHESIS.
- **SCD — CONSENSUS framework:** Jessen et al. 2014
  (*Alzheimers Dement.* 10:844 — verified: SCD = subjective
  decline with unimpaired objective performance, first
  symptomatic preclinical stage; SCD-plus feature list).
  Per-class complaint-channel lead (`scd_lead`) is our
  operationalization — HYPOTHESIS as a number.
- **Mental retirement — CONSENSUS direction, DEBATED
  magnitude:** Rohwedder & Willis 2010 (*JEP* 24:119 —
  verified: cross-national pension-IV design, early
  retirement causally lowers early-60s cognition); Bonsang,
  Adam & Perelman 2012. Encode-only routing + accrual form
  HYPOTHESIS.
- **Locomotion dual-task — CONSENSUS:** Lindenberger,
  Marsiske & Baltes 2000 (*Psych. & Aging* 15:417 —
  verified: memorize-while-walking, d≈0.98 mid / 1.47 old).
  Street-vs-track halving is our ecological correction.
- **Allocentric decline — CONSENSUS:** Wiener, de Condappa,
  Harris & Wolbers 2013 (*J. Neurosci.* 33:6012 — verified:
  same-direction route recall intact, novel-direction rejoin
  fails, persistent beacon strategy, no cross-session
  shift); Head & Isom 2010; Moffat & Resnick 2002.
  Per-record `nav_mode` flag is our form — HYPOTHESIS.
- **Implicit/procedural preservation — CONSENSUS:**
  Fleischman, Wilson, Gabrieli, Bienias & Bennett 2004
  (*Psych. & Aging* 19:617 — verified longitudinal:
  explicit declines, priming stable across 4 waves);
  Mitchell, Brown & Murphy 1990; La Voie & Light 1994.
  The 55 freeze-point is HYPOTHESIS.
- **Observation inflation age leg — CONSENSUS finding,
  modest n:** Lindner, Echterhoff, Davidson & Brand 2010
  (*Psych. Sci.* 21:1291 — verified: robust, warning-
  immune); Lindner, Davidson & Echterhoff 2014 (*Aging
  Neuropsychol. Cogn.* — verified: equal error RATE, prone
  elders LARGER effect, true-action benefit larger in old).
  Tail-only operationalization HYPOTHESIS.
- **Internal/external detail shift — CONSENSUS:** Levine,
  Svoboda, Hay, Winocur & Moscovitch 2002 (*Psych. & Aging*
  17:677 — verified: Autobiographical Interview, fewer
  internal / more external details, probe-resistant);
  2023 AI meta-analysis (gbad077 — verified: moderate in
  healthy aging, larger in MCI/AD). Share knots HYPOTHESIS.
- **Stack cap — no source, by design:** bookkeeping bound on
  unmeasured joint territory (AD§105); P814 makes the
  honesty falsifiable.
- **Established vs hypothesis summary:** every direction and
  dissociation this version is established (classes, IIV
  precedence, SCD-as-first-symptom, retirement direction,
  dual-task growth, allo→ego shift, priming stability,
  rate-flat/magnitude-up inflation, I/E shift); all
  magnitudes, lead times, class-draw weights, the nav_mode
  flag, the freeze point, and the cap are RW HYPOTHESES.

## 154. New probes P815–P824 (v77 suite — emotional-memory VII)

- **P815 gratitude mint (MUST — locked asymmetry):** benefit:true
  event with cost_appraisal 0.8 vs matched pleasant non-benefit
  event on the same benefactor: the benefactor CondEntry must mint
  grateful:true, exceed the §4.9 positive-entry strength, decay
  measurably slower across 60 simulated days, and emit
  reciprocate:true on a later benefactor-need event. FAIL if the
  entry decays at ordinary positive rate or if a low-cost event
  mints the flag.
- **P816 co-rumination bond/affect split (MUST — sign lock):**
  two high-rumin characters jointRecall a shared negative record
  three times: bond_strength rises ≥3×corumin_bond·0.8 AND the
  record's negative tag takes no verbal_dampen (damp_loss active);
  a solved:true retell arm takes the ordinary dampen. FAIL if
  bond grows without affect refresh or if the loop fires below
  the ~10y age floor.
- **P817 distanced reflection (MUST — locked null):** a negative
  record reflected under reflect.mode:distanced vs immersed:
  fired affect lower by dist_cool, coherence accrual EQUAL, θ
  and cueMatch IDENTICAL post-session (dist_avoid_null — FAIL if
  distancing raises θ or adds a surcharge); distanced:true
  emitted.
- **P818 humor reappraisal (MUST):** humor:true on a negative
  event (arousal 0.6) vs matched unfunny: arousal_tag lower by
  ~humor_reapp_k and verbatim ~15% thinner; at arousal 0.9 the
  gate blocks the cool. Replay arm: two humor:true retells cool
  ~2×humor_replay_k; FAIL if the cool exceeds the once-per-window
  cap or touches neutral records.
- **P819 hot–cold read (MUST — locked null):** reconstruct an
  arousal-0.8 own-impulsive record under C.arousal_now 0.2:
  re-fired affect attenuated ≥hotcold_k·0.5, cold_read:true
  emitted, stored tag + verbatim byte-identical
  (hotcold_store_null); re-present the cue under arousal_now 0.7
  → full tag strength restored.
- **P820 threat priority (MUST — dissociation lock):** under
  anx_eff 0.8, matched-strength record sets surface threat:true
  first at rate exceeding baseline by the threat_cue_gain margin;
  under depr 0.8 / anx_eff 0 the same set shows NO threat
  preference. threat_hold: ambient-scan dwell longer on threat
  records under anxiety.
- **P821 broaden fan (MUST — locked null):** C.mood 0.7 vs 0:
  associative search clears a weaker record class (θ_eff cut) and
  effective search_breadth rises; all store fields byte-identical
  afterward (broaden_store_null — read-side only).
- **P822 disgust extinction asymmetry (MUST):** a disgust
  CondEntry: five safe exposures move safeCount <0.4× a matched
  fear entry (dis_extinct_mult); three positive rival-tag mints
  (§72) reduce fired affect near-normally (dis_cc_mult ~0.9).
  FAIL if extinction and counterconditioning behave identically —
  the asymmetry IS the probe.
- **P823 mood-repair gate (MUST):** negative mood, regulator vs
  depr≥0.5 profiles: the regulator arm shows positive-candidate
  inversion and post-recall mood lift; the depr arm shows neither
  even when a positive record is force-recalled
  (repair_dep_null). FAIL if the depr arm lifts.
- **P824 felt-vs-believed (MUST):** (a) report "how did X feel"
  at day 3 vs day 30 on an intact record: day-3 tracks the tag;
  day-30 shifts toward self_belief/script with
  felt_believed_gap:true when divergence >0.4; (b) the tag
  unchanged by any believed report (felt_write_null); (c) a
  later strong sensory cue still refires the true tag.

Registry: P1–P824. v77 suite: P815–P824 — all MUST (P817, P819,
P821 carry locked-null arms; P820 carries the dissociation lock;
P822 the asymmetry lock).

## 155. Sources verified this version (P815–P824 backing)

- **Gratitude → durable benefactor orientation:** McCullough,
  Kilpatrick, Emmons & Larson 2001 (*Psych. Bull.* — verified:
  moral-barometer account, gratitude as relationship-value
  signal); Bartlett & DeSteno 2006 (*Psych. Sci.* 17:319 —
  verified: gratitude → costly helping toward the benefactor,
  mediated by gratitude not mood); Algoe 2012 find-remind-bind.
  CONSENSUS direction; decay-resistance magnitude HYPOTHESIS.
- **Co-rumination:** Rose 2002 (*Child Dev.* 73:1830 —
  verified: predicts friendship quality AND internalizing
  symptoms); Rose, Carlson & Waller 2007 (*Dev. Psychol.*
  43:1019 — verified: prospective bidirectional gains; girls >
  boys; adolescent emergence). Mechanistic params HYPOTHESIS.
- **Directed self-distancing:** Ayduk & Kross 2010 (*JPSP*
  99:809 — verified: spontaneous distancing → lower reactivity
  short-term, lower intrusive ideation over time, mediated by
  reconstruing not avoidance); Kross & Ayduk 2008/2011
  ("why from a distance" program). dist_avoid_null is the
  verified cell.
- **Humor reappraisal:** Kugler & Kuhbandner 2015
  (*Neuropsychologia* 62:357 — verified: humorous reappraisal
  > positive reappraisal on amygdala reduction; worse later
  memory for the negative items); Samson & Gross 2012; Strick
  et al. 2009 (moderate-intensity boundary). Encode magnitudes
  calibrated, replay cool HYPOTHESIS.
- **Hot–cold empathy gap:** Nordgren, van der Pligt & van
  Harreveld 2006 (*Psych. Sci.* 17:635 — verified: cold-state
  underestimation of past visceral influence, self AND other,
  correction-resistant); Nordgren et al. 2007 (*JPSP* 93:75 —
  verified: cold evaluators judge impulsive behavior more
  harshly, state-SPECIFIC); Loewenstein 2005. Extension from
  drive states to emotional arousal — standard reading, flagged.
- **Threat attentional priority:** Williams, Watts, MacLeod &
  Mathews 1997 (canonical anxiety=detection / depression=
  elaboration split); Bishop 2007 (*Nat. Neurosci.* 10:307 —
  verified review); Mathews & MacLeod 2005. Magnitude and the
  clean dissociation under comorbidity flagged.
- **Positive-affect broadening:** Rowe, Hirsh & Anderson 2007
  (*PNAS* 104:383 — verified: remote associates up, flanker
  selectivity down, correlated individual differences);
  Fredrickson & Branigan 2005; Isen et al. 1987. Episodic
  projection is our form — HYPOTHESIS, read-side locked.
- **Disgust extinction asymmetry:** Olatunji, Forsyth &
  Cherian 2007 (*J. Anxiety Disord.* 21:820 — verified: sticky,
  extinction-resistant); Engelhard, Leer, Lange & Olatunji 2014
  (*Behav. Therapy* 45:708 — verified: Study 1 extinction did
  NOT reduce disgust evaluative learning, Study 2
  counterconditioning DID); Bosman, Borg & de Jong 2016;
  Olatunji, Tomarken & Puncochar 2013 (*Emotion* 13:881 —
  verified: disgust propensity potentiates aversive evaluative
  learning). The asymmetry is the verified finding; multipliers
  calibrated.
- **Mood-repair recall:** Josephson, Singer & Salovey 1996
  (*Cogn. & Emot.* 10:437 — verified: sad→sad first, positive
  second recall in nondepressed, 68% self-reported repair
  intent); Rusting & DeHart 2000 (*JPSP* 78:737 — verified:
  incongruent recall under reappraisal strategies, trait-gated);
  Joormann & Siemer 2004 (*J. Abnorm. Psychol.* 113:179 —
  verified: dysphorics fail to repair via positive recall;
  distraction works instead). repair_dep_null is verified.
- **Felt vs believed reports:** Robinson & Clore 2002
  (*Psych. Bull.* 128:934 — verified accessibility model:
  episodic retrieval for recent emotion, belief/schema
  reconstruction beyond ~2 weeks); Levine & Safer 2002
  (appraisal-bias complements — §28's channel). Seam position
  and mix weights flagged as open parameters.
- **Established vs hypothesis summary:** all directions and
  dissociations CONSENSUS (gratitude's person-binding, the
  co-rumination bond/distress trade, distancing-without-
  avoidance, humor's amygdala + memory cost, the hot–cold gap,
  threat detection priority under anxiety, positive broadening,
  the disgust extinction/counterconditioning asymmetry, the
  dysphoric repair failure, the felt/believed seam). All
  magnitudes, the age knots, trait composites (disg_prop,
  anx_eff), the once-per-window rule, and field/mixin forms are
  RW HYPOTHESES.

## 156. New probes P825–P834 (v78 suite — false-memory VII)

- **P825 sleeper effect (MUST — ordering + cap lock):**
  identical claim, low-cred source; arm A discounting cue
  AFTER the message, arm B BEFORE. Arm A: `sourceDiscount`
  decays, `sourceCredibility_eff` rises, deferred adoption
  on re-encounter at ~sleeper_k — but never exceeding the
  matched high-cred arm's initial mint (sleeper_grow_null).
  Arm B: `low_cred` source tag, no sleeper leg. FAIL if the
  ordering gate is ignored or deferred adoption outgrows
  the counterfactual.
- **P826 warning backfire (MUST):** claim marked `debunked`
  ×3 vs ×1; same-day evaluation shows ×3 better-protected;
  aged past tag death on a 70y profile, ×3 rates TRUER than
  ×1 (warn_backfire_k on dead-tag familiarity). 30y profile
  shows the crossover later/smaller (warn_tag_mult age leg).
  frame_content_null — the claim candidate is intact;
  only `tag_str` died.
- **P827 Spinozan gate (MUST):** identical false claims to
  matched hearers under `C.load` 0.8 vs 0: the load arm
  shows higher `accepted` residue and higher later truth_p;
  calm arm's `unbelieve` marks stick and suppress §6.3
  adoption. Idle 30 sim-days → residues unchanged
  (spinoza_revert_null — FAIL on spontaneous revert).
- **P828 illusory truth vs knowledge (MUST — locked
  null):** claim contradicting a strength-0.9 semantic,
  heard ×5: truth_p rises by ~illus_truth_k·log1p(5) anyway
  (knowledge_gate_null); the ADOPTION arm still pays
  know_protect_mult. factCheck:true posture halves the
  truth_p rise. FAIL if knowledge zeroes the fluency leg.
- **P829 hindsight bend (MUST — locked null):** record with
  `predict` field, verbatim-strong vs verbatim-weak arms,
  matched `outcomeEvent`: weak arm reports bent ≈hind_k
  toward outcome with +hind_conf_boost and
  `inevitable:true` at bend>0.5; strong arm reports clean
  with `nailed_it:true`. Stored estimate candidates
  byte-identical in both arms (hind_store_null).
- **P830 innuendo mint (MUST — locked null):**
  askAbout{presupposes:"the broken lease"} vs assertion
  control: insinuated candidate mints at ~insinu_strength×
  assertion strength, `deniable:true`, presupposed object
  candidate at +presuppose_gain; NO episodic record in any
  arm (insin_episode_null — FAIL if "I saw it" mints).
  checker profile emits insinuation_noticed and the mint
  is suppressed.
- **P831 planting recipe (MUST):** minimal arm (1 session,
  no imagery/pressure/scaffold) ≈0.25 adoption-class rate
  (Loftus-mall); full arm (3 sessions, guided imagery +
  pressure + 3 true scaffolds + authority) ≈0.6–0.7
  belief-tier mints, of which ~40% promote to recollection
  under imagery-rich self-retells (the 70/28 Wade-recode
  split). Scaffold-free vs scaffolded arms differ by the
  known_veto gate.
- **P832 child implant (SHOULD):** identical recipe planted
  on an adult for claimed encodeAge-6 vs encodeAge-25
  events: childhood arm adopts at ~plant_child_mult rate;
  minted records carry amnesia-era dating flags.
- **P833 déjà vu (MUST — locked null):** novel venue with
  config-masked simOp 0.8 vs 0.4 to a sub-θ record: 0.8 arm
  emits deja_vu{familiarity≈0.8, matched:false}; no record
  minted (deja_store_null — FAIL on any mint); rate halves
  on a 70y profile (deja_age_slope); second visit inside
  deja_cool does not re-emit.
- **P834 source poison (SHOULD — hypothesis-flagged):**
  detected-false claim on source S: (a) S's future p_adopt
  cut by source_poison_k; (b) S's adopted near-radius
  (simOp>poison_radius) candidates lose
  source_poison_k·candStrength once; (c) far-radius
  unchanged; (d) weakened claims remain reportable
  (poison_reveal_null — store ≠ speech).

Registry: P1–P846. v79 suite: P835–P846 — P835–P839, P841–P843
MUST; P840, P844, P845 SHOULD; P846 OBSERVE. Locked-null arms:
P835 (store), P836 (valence), P838 (global encode), P839
(encode-side), P840 (face), P841 (wmc), P842 (ungated),
P843 (passive), P844 (dominant language).

## 157. Sources verified this version (P825–P834 backing)

- **Sleeper effect (P825):** Hovland & Weiss 1951 (*J.
  Abnorm. Soc. Psychol.* 46:424 — verified: dissociation
  hypothesis, credibility persuasion crossover); Pratkanis,
  Greenwald, Leippe & Baumgardner 1988 (*Psych. Bull.*
  104:53 — verified: 17 qualifying tests, AFTER-ordering
  requirement, differential decay); Kumkale & Albarracín
  2004 (*Psych. Bull.* 130:143 — verified meta-analysis,
  relative sleeper durable). Anchors `disc_decay_mult`,
  `sleeper_k`, ordering gate, `sleeper_grow_null` (§6.164).
- **Warning backfire (P826):** Skurnik, Yoon, Park &
  Schwarz 2005 (*J. Consum. Res.* 31:713 — verified:
  repeated "false" labels → more "true" endorsements after
  3-day delay in older adults; familiarity outlives
  truth-specifying context); companion fluency literature
  Hasher et al. 1977, Hawkins & Hoch 1992. Anchors
  `warn_tag_mult`, `warn_backfire_k`, `tag_min`,
  `frame_content_null` (§6.165).
- **Spinozan acceptance (P827):** Gilbert, Krull & Malone
  1990 (*JPSP* 59:601 — verified: comprehension entails
  acceptance; load → false-recalled-as-true); Gilbert,
  Tafarodi & Malone 1993 (*JPSP* 65:221 — verified:
  "you can't not believe everything you read"); Gilbert
  1991 (*Am. Psychol.* 46:107 — verified: Spinoza vs
  Descartes systems); Hasson, Simmons & Todorov 2005
  (instruction-level dissociation — boundary caveat).
  Anchors `spinoza_cost`, `load_unbelieve_pen`,
  `spinoza_revert_null` (§6.166).
- **Illusory truth (P828):** Hasher, Goldstein & Toppino
  1977 (*JVLVB* 16:107 — verified); Fazio, Brashier, Payne
  & Marsh 2015 (*JEP:G* 144:993 — verified: repetition→
  truth even against stored knowledge); Pennycook, Cannon
  & Rand 2018 (*JEP:G* 147:1865 — verified: single-exposure
  lift on real fake-news headlines); Begg, Anas & Farinacci
  1992 (*JEP:G* 121:446 — verified: fluency/recollection
  dissociation). Anchors `illus_truth_k`, `illus_truth_cap`,
  `knowledge_gate_null`, `factCheck_halve` (§6.167).
- **Hindsight (P829):** Fischhoff 1975 (*JEP:HPP* 1:288 —
  verified: reconstructed estimates bend toward outcomes,
  subjects unaware); Fischhoff & Beyth 1975 (creeping
  determinism); Hoffrage, Hertwig & Gigerenzer 2000
  (*JEP:LMC* 26:566 — verified RAFT: outcome recruited when
  original unretrievable); Roese & Vohs 2012 (*Persp.
  Psychol. Sci.* 7:411 — verified: three stacked levels).
  Anchors `hind_k`, `hind_conf_boost`, `hind_store_null`,
  `inevitable`/`nailed_it` (§6.168).
- **Innuendo/presupposition (P830):** Wegner, Wenzlaff,
  Kerker & Beattie 1981 (*JPSP* 41:67 — verified:
  interrogative/negated innuendo ≈ assertions for
  impressions); Loftus & Zanni 1975 (*Cogn. Psychol.*
  7:560 — verified: the/a article presupposition, ~2×
  false-object endorsement); Loftus 1975 (presupposing
  questions). Anchors `insinu_strength`, `presuppose_gain`,
  `deniable`, `insin_episode_null` (§6.169).
- **Planting recipe (P831, P832):** Shaw & Porter 2015
  (*Psych. Sci.* 26:291 — verified: 70% false memory/
  belief of police-contact crime in 3 interviews, M=12.18
  police details); Wade, Garry & Pezdek 2018 (*Psych. Sci.*
  29:503 — verified recode: 26–30% recollection-grade, the
  rest belief-tier — encoded as `plant_belief_floor`);
  Loftus & Pickrell 1995 (*Psych. Ann.* 25:720 — verified:
  ~25% mall); Ceci, Loftus, Leichtman & Bruck 1994
  (Samuel Stone — verified: ~50% preschooler assent under
  repeated suggestion). Anchors `plant_*`, `scaffold_unit`
  (§6.170).
- **Déjà vu (P833):** Brown 2003 (*Psych. Bull.* 129:394 —
  verified review: incidence, age decline); Cleary 2008
  (*Curr. Dir. Psychol. Sci.* 17:353 — verified:
  recognition without identification); Cleary et al. 2012
  (*Conscious. Cogn.* 21:969 — verified: VR spatial-config
  familiarity). Anchors `deja_thresh`, `deja_age_slope`,
  `deja_cool`, `deja_store_null` (§6.171).
- **Source poison (P834):** forward discounting established
  (Hovland line; Kumkale & Albarracín 2004; correction/
  retraction literature — Ecker et al.); the retroactive
  sibling-weakening leg is flagged RW HYPOTHESIS (no direct
  study; P834(b) is the calibration target).
- **Established vs hypothesis summary:** directions
  CONSENSUS (sleeper relative pattern, warning backfire,
  acceptance-first, repetition→truth incl. the knowledge
  failure, hindsight reconstruction, innuendo effect,
  planting-recipe efficacy, familiarity-without-source,
  forward credibility discounting). Magnitudes, the
  belief/recollection promotion share, retro poisoning,
  field/flag operationalizations, and all locked-null
  mechanizations are RW HYPOTHESES.

## 158. v79 probe specs (P835–P846 — individual-differences VII)

- **P835 the blunter's door (MUST — sign-locked):**
  blunt=+1.5 vs −1.5 on matched anticipThreat events:
  +blunt encodes fewer threat-field details (blunt_avoid_k)
  and shows fewer threat-cued intrusions; recognition-mode
  recovery of encoded content equal; non-threat cells
  identical (blunt_store_null — a difference on already-
  stored records FAILS). Constrains blunt_avoid_k,
  blunt_intr_k.
- **P836 the second bump (MUST):** immig_age=28 vs null,
  identical 70y event diet: recall density shows a
  secondary mode inside [immig_age+immig_lo,
  immig_age+immig_hi] only in the immigrant arm;
  valence/arousal distributions inside the mode match the
  lifespan baseline (immig_valence_null — hotter bump
  FAILS); L1-cued pre-window recall ≥1.4× L2-cued.
- **P837 borrowed halves (MUST):** trans_dep=+1.5 +
  trans_partner set: shared events mint pointer fields and
  encode less content; partnerPresent recall restores to
  ≥ solo-encode control (joint_boost); partner_lost →
  orphan_recall with high FOK + sparse content;
  trans_dep=−1.5 mints zero pointers.
- **P838 the camera ate the memory (MUST — conditional
  lock):** offload=+1.5 vs −1.5 across externalized ×
  non-externalized cells: E deficit only in the
  externalized×high cell (offload_global_null — any
  non-externalized difference FAILS); ext_pointer survives
  +90d while sibling content decays; lookup reports
  accurate, first lookup grants no retell_boost;
  pointer_dead → orphan_recall.
- **P839 the night's yield (MUST):** consol=±1.5, identical
  encoding day + sleepQuality: same-day recall identical
  (consol_encode_null), +1d diverges by consol_yield_k,
  +7d ordering preserved; wake-side params identical.
- **P840 the wrong grid (SHOULD):** nav_ab=+1.5/grid vs
  −1.5/organic in the Mission grid: place-cued recall and
  place_reinstate favor the grid-matched profile
  (nav_layout_match); route-anchored whenEstimate tighter
  in +nav_ab; people/face recall identical (nav_face_null).
- **P841 the leaky monitor (MUST — wmc null locked):**
  schizotyp=+2 vs 0 at matched wmc: bidirectional
  source_confuse_flip errors rise (both directions must
  move — one-directional FAILS), intrusion + deja_vu rates
  rise; enc_base, beta_*, wmc params identical
  (schz_wmc_null — Peters 2007's control is the falsifier).
- **P842 the gated channel (MUST — context lock):**
  hypnot=+2 vs 0: under guided_imagery+authoritative arms
  imagine_gain/adoption diverge as priced; plain
  hearAccount arms IDENTICAL within jitter —
  hypnot_ungated_null FAILS on any ungated difference.
- **P843 the deployed strategy (MUST — gate-locked):**
  mnem=+1.5 vs 0: deliberate-encode records gain
  link_p/beta/w_place/search_breadth legs; incidental
  records identical (mnem_passive_null); deliberate gains
  persist at +120d; mnem=+1.5 with zero deliberate:true
  events indistinguishable from mnem=0.
- **P844 the tip of which tongue (SHOULD):** langs={es,en},
  dominantLang=es, reportLang en vs es: tot_rate elevated
  only in nondominant arm (tot_dom_null — dominant-arm
  elevation FAILS); cognate_ok partially rescues;
  resolution rates equal (incidence tax, not duration).
- **P845 pointer ecology (SHOULD):** trans_dep=+1.5 AND
  offload=+1.5 distributes a 100-event diet across
  {full-encode, pointer, ext_pointer}; internal content
  LOWER than either single-trait profile; joint/lookup-
  supported report accuracy comparable — router, not store.
- **P846 blunter vs vigil pole (OBSERVE):** bipolar axis
  produces opposite intrusion signatures on threat events
  (−pole §24 texture, +pole §77 texture) with matched
  non-threat behavior — report-only, no band.

## 159. Sources verified this version (P835–P846 backing)

- **Blunting (P835):** Miller 1980 ("When is a little
  information a dangerous thing?" — monitoring-blunting
  coping style); Miller & Mangan 1983. Anchors §77
  `blunt_avoid_k`, `blunt_intr_k`, `blunt_store_null`.
- **Immigration bump (P836):** Schrauf & Rubin 1998 (*JML*
  39:437 — verified: bump followed age at immigration, not
  10–30; language partitions pre/post records); Schrauf &
  Rubin 2000 (*Appl. Cogn. Psychol.* — verified: era
  memories not more detailed/emotional — distribution, not
  tagging). Anchors `immig_lo/hi`, `immig_valence_null`.
- **Transactive memory (P837):** Wegner 1987; Wegner, Erber
  & Raymond 1991 (*JPSP* 61:923 — verified: natural couples
  > impromptu pairs without assigned structure; assigned
  structure hurts couples); Weldon & Bellinger 1997
  (*JEP:LMC* 23:1160 — verified: collaborative inhibition;
  group recall more stable over time). Anchors
  `trans_shift`, `trans_ptr_k`, `joint_boost`,
  `collab_inhibit`, `collab_stab`, `orphan_recall`.
- **Offloading (P838):** Sparrow, Liu & Wegner 2011
  (*Science* 333:776 — verified: expected access lowers
  content recall, raises where-to-access recall); Risko &
  Gilbert 2016 (*TiCS* 20:676 — intention offloading);
  Henkel 2014 (camera/photo impairment). Anchors
  `offload_k`, `ext_ptr_k`, `offload_global_null`,
  `pointer_dead`.
- **Consolidation yield (P839):** Gais, Mölle, Helms &
  Born 2002 (spindle activity after learning predicts
  retention); Schabus et al. 2004 (spindle differences in
  good vs poor sleepers). Anchors `consol_yield_k`,
  `consol_sleep_k`, `consol_encode_null`.
- **Navigation (P840):** Coutrot et al. 2018 (*Curr. Biol.*
  — Sea Hero Quest, age decline + small male advantage);
  Coutrot et al. 2022 (*Nature* — verified, N=397,162:
  rural-upbringing advantage; topology match — grid kids
  ace grids). Anchors `navab_*`, `nav_layout_match`,
  `nav_face_null`.
- **Schizotypy (P841):** Peters, Smeets, Giesbrecht,
  Jelicic & Merckelbach 2007 (*J. Nerv. Ment. Dis.* —
  verified: performed/imagined source confusions, WMC
  controlled out); Larøi, Collignon & Van der Linden 2005;
  source-monitoring meta-analysis 2022 (44 studies —
  internal SM + imagined stimuli specifically impaired);
  Steel et al. 2005 (intrusion vulnerability account).
  Anchors `schz_*`, `schz_wmc_null`.
- **Hypnotizability (P842):** Heaps & Nash 1999 (*Psychon.
  Bull. Rev.* — verified: imagination inflation correlates
  with hypnotic suggestibility + dissociativity, NOT
  vividness or interrogative suggestibility); Barnier &
  McConkey 1992; Sheehan, Statham & Jamieson 1991;
  Wagstaff sociocognitive counterline (accuracy-emphasized
  highs more resistant — why all loadings are
  context-locked). Anchors `hypnot_*`,
  `hypnot_ungated_null`.
- **Mnemonics (P843):** Maguire et al. 2003 (*Nat.
  Neurosci.* — champions: strategy, not anatomy);
  Dresler et al. 2017 (*Neuron* 93:1227 — verified: 6-week
  loci training, athlete-like network changes, durable at
  4 months); Wagner et al. 2021 (*Sci. Adv.* 7:eabc7606 —
  verified: durable-memory formation specifically). Anchors
  `mnem_*`, `mnem_passive_null`.
- **Bilingual TOT (P844):** Gollan & Acenas 2004
  (*JEP:LMC* 30:246 — verified: more TOTs on noncognates,
  cognate/translation rescue, language-specific activation
  mechanism); Gollan & Silverberg 2001. Anchors
  `tot_nondom_k`, `tot_cognate_rescue`, `tot_dom_null`.
- **Established vs hypothesis summary:** directions and
  dissociations CONSENSUS except the hypnot channel
  (DEBATED — context-locked on purpose) and
  navab_interf_k (DEBATED); all magnitudes, window widths,
  pointer-field mechanics, and orphan_recall are RW
  HYPOTHESES.

## 160. v80 probe specs (P847–P858 — social-memory VIII)

- **P847 the trapdoor (MUST — sign-locked):** ambient-channel
  events (channel:ambient) referencing the listener:
  capture rate 0.35±0.10; post-capture, next ≤capture_tail
  ambient events encode at ambient_spill gain; ambient
  events not referencing the listener mint NOTHING
  (name_memory_null — any record from uncaptured ambient
  FAILS). Constrains name_capture_p, captured_mult,
  capture_tail, ambient_spill.
- **P848 addressed stays king (MUST):** identical content
  addressed vs captured vs ambient: E ordering addressed >
  captured > ambient≈0; captured cells reuse §59
  thin-eavesdrop decay legs. FAIL if captured ≥ addressed
  or ambient mints.
- **P849 the paradox (MUST — emergent):** held-secret
  records vs matched non-secret records over 60d: content
  E decays SLOWER in the secret arm (intrusion
  reconsolidation) while secret_str decays at
  identical schedule (secret_intr_tag_null — any tag
  refresh FAILS); leak events at day-50+ carry full
  content detail.
- **P850 one hop only (MUST):** A (sourceCredibility high)
  vouches B; B vouches C. C's vouch_prior = f(B's cred)
  only — the A² term must be absent (vouch_chain_null);
  C's PersonModel carries prior and ZERO records
  (vouch_only_null — any episodic mint FAILS);
  vouch_prior halves in ~14d.
- **P851 the ledger that isn't (MUST):** matched favor
  streams into exchange vs communal dyads: exchange arm
  resolves "who owes" at ledger accuracy; communal arm at
  near-chance on itemized detail (ledger_gate_communal),
  with noticed-absence compensation on gross neglect;
  communal tracking ≥ exchange FAILS.
- **P852 anchor topology (SHOULD):** relationship-history
  recall retrieves turning_point hubs first (latency and
  frequency advantage); non-hub period records drift
  hub-consistent; a 90-day no-hub dyad retrieves generic/
  "fine". FAIL if hubs show no retrieval advantage.
- **P853 the prior writes the gray zone (MUST):**
  ambiguous first-encounter fields (|v|<assim_band) shift
  toward vouch_prior/hearsay valence by ~prior_assim_k;
  |Δ|>contrast_band flips sign (contrast); ambiguous
  field with no perception mints nothing
  (prior_create_null); unconditional assimilation FAILS.
- **P854 the seat by the door (SHOULD):** final:true
  records out-retrieve matched mid-relationship records
  at 30d; intrusion pulse ≤~30d (final_intr); content
  drift identical to unflagged records and pre-final
  history unchanged (final_rewrite_null).
- **P855 pain glue (MUST):** adversity:true co-present
  events raise each witness RelEdge.bond by
  ~adversity_bond_k·|arousal| vs matched no-adversity
  co-presence; solo adversity raises no edge
  (adversity_solo_null); later recall reinstates
  ~adversity_reinstate of edge decay.
- **P856 the plural subject (SHOULD):** plural:true
  records cue on partner presence at ~we_spill_k of the
  partner's cue weight; credit attribution starts ~50/50
  and drifts self-serving per retell; partner_lost routes
  them through §27/§79 orphan machinery.
- **P857 whose story (OBSERVE):** story_own retells —
  owner-absent trespass ~own_trespass; owner-present
  no-deference ~2× that; deference yields +own_yield;
  retelling never blocked (own_block_null — a hard block
  FAILS).
- **P858 divergence (MUST — composite):** two profiles
  differing only on wmc and rumin show different ambient
  capture rates (P847 cells) AND different secret-intrusion
  frequencies (P849 cells) — same scene, different books.

Registry: P1–P870. v81 suite: P859–P870 (formal-model VIII — formal-model.md §68); v80 suite: P847–P858 — P847–P851, P853,
P855, P858 MUST; P852, P854, P856 SHOULD; P857 OBSERVE.
Locked-null arms: P847 (memory), P849 (tag), P850 (chain +
record), P851 (communal ledger), P853 (create), P854
(rewrite), P855 (solo), P857 (block).

## 161. Sources verified this version (P847–P858 backing)

- **Own-name capture (P847–P848):** Cherry 1953
  (selective listening; unattended channel yields ~nothing);
  Moray 1959 (~33% name detection); Wood & Cowan 1995
  (*JEP:G* 124:243 — verified: 34.6% recall of own name in
  ignored channel, attention shifts confined to ~2 items
  following, NO indirect memory for unattended content);
  Conway, Cowan & Bunting 2001 (low-WMC detects more —
  filter-leakage account). Anchors name_capture_p,
  captured_mult, capture_tail, ambient_spill,
  name_memory_null.
- **Secret preoccupation (P849):** Slepian, Chun & Mason
  2017 (*JPSP* 113:1–33 — verified: mind-wandering to
  secrets >> active concealment, ~2×; intrusion, not
  concealment, predicts harm; >13k secrets); Slepian,
  Kirby & Kalokerinos 2020 (*Emotion* — verified: shame ↑
  mind-wandering, guilt ↓); Liu, Kalokerinos & Slepian
  2023 (*PSPB* — replication); Slepian, Camp & Masicampo
  2015 (*JEP:G* 144:e31 — burden, used for mechanism only).
  Anchors secret_intr_p, shame_gate, secret_intr_tag_null.
- **Vouching (P850):** De Houwer, Thomas & Baeyens 2001
  (*Psych Bull* 127:853 — evaluative-conditioning meta,
  ~d=0.35); spillover direction CONSENSUS, transitive
  credibility transfer is RW composite (trust-transitivity
  lit is formal/ABM). Anchors vouch_k, vouch_halflife,
  vouch_chain_null, vouch_only_null.
- **Conditional ledgers (P851):** Clark & Mills 1979
  (*JPSP* 37:12 — exchange vs communal); Clark 1984
  (*JPSP* 47:549 — record-keeping experiment: exchange
  expectation → better contribution tracking); Clark &
  Mills 1993 review (norm violations memorable both
  directions). Migration threshold flagged HYPOTHESIS.
  Anchors ledger_gate_*, norm_breach_e.
- **Turning points (P852):** Baxter & Bullis 1986 (*HCR*
  12:469 — verified: relationship histories reconstruct
  from ~15–25 turning points, ~10 categories); Baxter &
  Erbert 1999; Surra relational-history method. Hub
  mechanics RW composite. Anchors tp_e_mult,
  tp_drift_shield.
- **Prior assimilation (P853):** Jones 1990
  (*Interpersonal Perception* — expectancy assimilation
  default); Nickerson 1998 (confirmation bias review);
  Biernat shifting-standards program + Dunning & Sherman
  1997 (assimilation→contrast boundary at unambiguous
  extremity — the band's justification). Anchors
  prior_assim_k, assim_band, contrast_band, contrast_k,
  prior_create_null.
- **Final encounter (P854):** Fredrickson & Kahneman 1993
  + Kahneman et al. 1993 (peak-end — CONSENSUS leg);
  Davis & Lehman 1995 (counterfactual replay in
  bereavement — nearest direct evidence, about rumination
  not encoding — hence composite HYPOTHESIS). Anchors
  final_e_mult, final_intr, final_rewrite_null.
- **Shared adversity (P855):** Bastian, Jetten & Ferris
  2014 (*Psych Sci* 25:2079 — verified: shared pain →
  bonding + cooperation, 3 experiments incl. control for
  task/effort); Whitehouse & Lanman 2014, Whitehouse et
  al. 2017 (dysphoric-fusion mechanism). Anchors
  adversity_bond_k, adversity_reinstate,
  adversity_solo_null.
- **Plural subject (P856):** Aron et al. 1991
  (self-expansion/other-in-self); Mashek, Cannaday &
  Tangney 2007 (inclusion measures); Wegner transactive
  line (cueing leg CONSENSUS); record-level "we" store is
  RW composite. Anchors we_spill_k.
- **Story ownership (P857):** Stone 1988 + family-lore
  work (ownership phenomenon exists; magnitudes unmeasured
  → OBSERVE-grade). Anchors own_trespass, own_yield,
  own_block_null.
- **Established vs hypothesis summary:** capture rate,
  mind-wander>conceal, shame/guilt split, exchange>
  communal tracking, anchor sparsity, shared-pain bonding
  — CONSENSUS. Assimilation-vs-contrast boundary placement,
  prior mechanics, final-encounter privilege, vouch
  transitivity, we-record mechanics, ownership magnitudes —
  RW HYPOTHESES, all probe-gated.

## 162. v81 probe specs (P859–P870 — formal-model VIII: anchor corpus)

Formal-model Part VIII (§§60–69) instantiates the §14.2 anchor
corpus — 18 sourced human statistics with bands — plus the
observable link layer, equivalence grading, power budget,
rep-grade shrinkage, and the train/holdout split. Probes test
the *machinery*: links, lints, gates, budgets. Anchors
themselves (A01–A18) are the corpus, not probes.

- **P859 link completeness (MUST — locked null):** fuzz 10⁴
  probe evaluations; every observed quantity traces through a
  declared channel (recall `y`, latency `lat`, confidence `c`,
  or emitted content). Any direct latent read (record.strength,
  θ, cueMatch internals) = FAIL. `latent_read_null = 0`.
  Basis: Tulving & Pearlstone 1966 availability/accessibility;
  the probe-as-kernel formalism (§36) already implies read-side
  discipline — this gates it.
- **P860 latency monotonicity (MUST — sign-locked):** matched
  records at ΔS_eff = .3 (constructed via legal encoding-
  strength manipulation, never direct writes) produce strictly
  ordered mean latencies, strong < weak; log-residual σ ∈
  [0, 2·lat_sigma]. Basis: Wixted & Rohrer 1994 (cumulative-
  recall rate tracks strength).
- **P861 corpus lint (MUST — process):** every anchor row in
  `anchor_set_ver` declares source, band, rep_grade, ≥1 pinned
  param, design ref. Unpinned/unsourced/incomplete row = build
  error (twin of P743 declaration gate).
- **P862 equivalence gate (MUST — locked null):** inject a
  degenerate perfect-memory config (β→0, misinfo_suscept→0);
  corpus verdict = FAIL on ≥6 anchors via upper-band
  violations. A suite that cannot catch a database is not a
  validator. `exceed_null = 0`. Basis: Schuirmann 1987 TOST;
  Lakens 2017.
- **P863 retention anchors (SHOULD):** scripted low-salience
  event diet on the reference profile (P68 family reuse);
  savings analogues at the A01/A02/A03 delays land inside
  [.45,.70]/[.22,.48]/[.10,.35] simultaneously.
- **P864 power audit (MUST — process):** every evaluated
  anchor reports n; n < max(anchor_n_min=100, §64-required n)
  → verdict INCONCLUSIVE, never PASS. An underpowered hit is
  not evidence.
- **P865 shrinkage mutation (SHOULD):** flip a META anchor's
  grade to SINGLE in a test corpus; band center must move to
  0.6·Δ automatically; static bands = FAIL. Basis: OSC 2015
  (~36% replication rate, mean effect ≈ half).
- **P866 holdout honesty (MUST — locked null):** run the §66
  split; fitting inputs manifest zero held-out anchorIds
  (`anchor_leak_null = 0`); held-out miss count reported
  verbatim; ≥ half held-out missing band = corpus-level FAIL.
- **P867 misinformation band (SHOULD):** scripted post-event
  suggestion; pooled acceptance ∈ [.15,.45] (A07);
  profile-conditional split (suggs hi/lo) reported, ungated.
- **P868 bump shape (SHOULD):** 70-equivalent profile's dated
  autobiographical density: decade-2–3 mass > decades 4–6
  (A06) AND earliest-recall age ∈ [3.0,4.2] (A05).
- **P869 confidence–accuracy band (OBSERVE):** overall
  point-biserial r ∈ [0,.40]; chooser-conditional > overall.
  Report only — direct tuning would break A12's diagnostic
  power. Basis: Sporer, Penrod, Read & Cutler 1995.
- **P870 flashbulb dissociation (MUST — CONTESTED pair):**
  matched flashbulb/everyday records: |consistency Δ| ≤ .10
  (A10 null) AND confidence Δ ∈ [+.05,+.35] (A11). Both tails
  or the aff_flash machinery is wrong in a named way.
  Basis: Talarico & Rubin 2003.

Registry: P1–P870. v81 suite: P859–P870 — P859, P860, P861,
P862, P864, P866, P870 MUST; P863, P865, P867, P868 SHOULD;
P869 OBSERVE.

## 163. Sources verified this version (P859–P870 backing)

- **Ebbinghaus curve (A01–A03):** Ebbinghaus 1885 savings
  (58%@20min, 44%@1h, 34%@24h, 21%@31d — canonical);
  Murre & Dros 2015 (*JML* 80:135 — successful RRR-grade
  replication incl. intervals Ebbinghaus never tested).
- **Retention form (A04):** Rubin & Wenzel 1996 (*Psych Rev*
  103:734 — 210 datasets, 105 functions; exponential never
  best; scale invariance is the grounds for §1's tick
  insensitivity claim).
- **Childhood amnesia (A05):** Tustin & Hayne 2010 grand mean
  3.5y; Nelson & Fivush 2004 — 26 studies / 49 estimates,
  unweighted mean 3.69 (verified table).
- **Bump (A06):** Rubin & Schulkind 1997 (*Mem & Cogn*
  25:859) + Rubin, Wetzler & Nebes 1986 — verified: bump
  10–30, important memories of 70yos cluster 20–30.
- **Misinformation (A07/A08):** Loftus 2005 review; Ayers &
  Reder 1998 (early 30–40% impairment, controlled 10–20%);
  Lindsay et al. 2004 (~30% lost-in-mall); Pezdek et al.
  1997 (implausible→0%), Wade et al. 2002 (>50% plausible).
- **DRM (A09):** Stadler, Roediger & McDermott 1999 (≥60%
  recall / ≥80% recognition on strong lists); Roediger,
  Watson, McDermott & Gallo 2001 (.01–.65 across 55 lists).
- **Flashbulb (A10/A11):** Talarico & Rubin 2003 — verified:
  consistency decline identical, vividness/confidence decline
  only for everyday; visceral emotion → belief not accuracy.
- **Confidence–accuracy (A12):** Sporer, Penrod, Read &
  Cutler 1995 (overall ~0–.29, choosers ~.41 — verified);
  Wixted & Wells 2017 pristine-condition caveat = DEBATED.
- **Testing (A13):** Roediger & Karpicke 2006 — verified
  numbers: 5-min .75 vs .81 (reversal), 1-wk .61 vs .40.
- **Spacing (A14):** Cepeda et al. 2006 meta (839 assessments,
  *Psych Bull* 132:354); Cepeda et al. 2008 optimal-gap ≈
  10–20% of retention interval.
- **RIF (A15):** Anderson, Bjork & Bjork 1994 (~8–10pp);
  Murayama et al. 2014 meta — CONSENSUS for immediate;
  durability (Storm et al. 2015) DEBATED — band is immediate-
  effect only.
- **Serial position (A16):** Murdock 1962; Glanzer & Cunitz
  1966 (30 s filled delay abolishes recency).
- **LoP (A17):** Craik & Tulving 1975; Craik 2002 review.
- **Generation (A18):** Bertsch et al. 2007 meta (d ≈ .5).
- **Link layer (P859/P860):** Wixted & Rohrer 1994; Ratcliff
  1978 (DDM — declined for cost, noted); Lichtenstein,
  Fischhoff & Phillips 1982 (overconfidence → conf_bias).
- **Grading machinery (P862/P864–P866):** Schuirmann 1987
  TOST; Lakens 2017 equivalence testing; Wilson 1927 CIs
  (carried from §32.2); Open Science Collaboration 2015
  (*Science* 349:aac4716); Benjamini & Hochberg 1995.
- **Established vs hypothesis summary:** all 18 anchor
  statistics CONSENSUS/META-grade except A10 (the anchor is
  precisely the contested null — asserted as absence);
  bands, channel lognormal choice, obs_noise, shrink factors,
  split fraction — RW HYPOTHESES, probe-gated.

## 164. v82 probe specs (P871–P878 — character-profiles VII: the remembering voice)

Spec v5.30 §§5.79–5.83. All report-layer machinery — probes
must prove the voice changes the AUDIENCE's evidence without
touching the store.

- **P871 quote fidelity (MUST — locked null):** scripted
  witness event with logged verbatim wording; at 30d a
  `voice_quote` 0.9 profile emits `quote` fields whose token
  overlap with original wording is at the chance band
  (constructed share ≈ 1); same profile at 2h (verbatim
  alive) shows fidelity ∝ S. `quote_fidelity_null = 0`.
  Basis: Tannen 1986; Sachs 1967; Wade & Clark 1993.
- **P872 report-option reproduction (MUST — sign-locked):**
  matched records, free-report context; `report_policy` 0.85
  vs 0.15 profiles — high-policy emits fewer answers
  (quantity ↓) with higher mean accuracy (accuracy ↑);
  forced context collapses the difference via §5.61.
  Basis: Koriat & Goldsmith 1996.
- **P873 grain sharpening null (MUST — locked null):**
  a `grain:"coarse"` emission ("last spring") heard by a
  listener mints a coarse belief; no downstream path
  upgrades it to a precise date absent new evidence.
  `grain_sharpen_null = 0`. Basis: Goldsmith et al. 2002.
- **P874 inventory floor (MUST — locked null):** `ie_talk`
  1.4 profile asked about an event with zero stored
  internal fields emits external-only narration — the mix
  cannot mint episode content. `ext_floor_null = 0`.
  Basis: Levine et al. 2002.
- **P875 FOAK asymmetry (MUST — sign-locked):** identical
  speaker, two arms: slow-answer (long prePauseMs +
  answer) lowers hearer estKnow; slow-nonanswer (long
  pause + `passed:true` + fok_cue) RAISES it. A fast
  nonanswer must not raise it. `foak_store_null` checked
  in same run — content S untouched. Basis: Brennan &
  Williams 1995.
- **P876 story-mint null (MUST — locked null):**
  `voice_story` 1.0 retell of an event containing a
  schema-discordant field suppresses that field in ≥60%
  of emissions but the RECORD retains it — a later
  free-recall still surfaces it. Coda fields carry
  `eval:true` and mint no episodic content on
  retell-encode. `story_mint_null = 0`. Basis: Marsh 2007.
- **P877 quote ecology (SHOULD):** quote propensity is
  age-flat across archetypes (child excluded — different
  machinery); constructed share rises with record age on
  the verbatim-decay schedule; hearsay records mint only
  `constructed:true` quotes. `quote_cascade_null = 0`.
- **P878 voice distinctness (SHOULD — process):** the 8
  mains' {voice_quote, report_policy, grain_pref, ie_talk,
  voice_story} vectors — no pair within L1 distance 0.5;
  ambient tier draws inside the declared template ranges.
  Run against cast-profiles.md Part V compiled params.

Registry: P1–P878. v82 suite: P871, P872, P873, P874, P875,
P876 MUST; P877, P878 SHOULD.

## 165. Sources verified this version (P871–P878 backing)

- **Constructed dialogue:** Tannen 1986 (*Representing* 27 —
  verified abstract: "not a report at all"; possible→
  impossible continuum); Tannen 1989 *Talking Voices* ch.4.
- **Quote reconstruction:** Wade & Clark 1993 (*Memory*
  1:265); Clark & Gerrig 1990 (*Cognition* 37 —
  demonstrations, not descriptions).
- **Monitor-and-control:** Koriat & Goldsmith 1996
  (*Psych Rev* 103:490 — verified: report option ↑accuracy,
  ↓quantity, incentive/monitoring-dependent); Goldsmith,
  Koriat & Weinberg-Eliezer 2002 (*JEP:G* 131:73 — verified:
  grain-size regulation, accuracy–informativeness trade).
- **Detail mix:** Levine et al. 2002 (*Psychol Aging*
  17:677 — verified: older→external bias, persists under
  structured probing); Addis, Wong & Schacter 2008
  (*Neuropsychologia* 46:1363 — style-level spread).
- **FOAK:** Brennan & Williams 1995 (*J Mem Lang* 34:383 —
  verified incl. the answer/nonanswer latency asymmetry and
  filled-pause directions); Smith & Clark 1993 (*Cognition*
  48:151 — uh<um delay calibration).
- **Retelling:** Marsh 2007 (*Am J Psychol* 120:533 —
  tellings retrieved over events; schema shaping).
- **Established vs hypothesis:** Tannen quote-invention
  share (≥half) is corpus-claim CONSENSUS; FOAK direction
  CONSENSUS, magnitude SINGLE-study; trait ranges
  (voice_quote priors, pass_thr range, foak_gain 0.15) are
  RW HYPOTHESES, probe-gated by P871–P878.

## 166. Verdict governance — the battery disciplines itself (VA-GOV) (new in v83)

With P1–P878 registered, the dominant failure mode is no
longer an under-specified probe — it is the verdict layer
manufacturing signal. Four governance facts, then the
params (spec §14.5).

- **Multiplicity is real even in a simulation.** 878
  Bernoulli-ish verdicts at nominal α=.05 expect ~44 false
  rejections under global null — worse, probes share
  characters, seeds, and event pools, so independence
  fails. The fix is structural, not aspirational: probes
  live in versioned families (one family = one version
  suite); within a family, p-ranked verdicts threshold by
  Benjamini–Hochberg at `fdr_q` (BH 1995, *JRSS-B*
  57:289 — CONSENSUS). Under arbitrary dependence (the
  default here — shared mains correlate everything), the
  Benjamini–Yekutieli correction applies the Σ1/i penalty
  (BY 2001, *Ann Statist* 29:1165 — CONSENSUS).
  **Locked nulls are not tests.** A locked-null failure is
  a boundary violation (the instrument touched what it
  must never touch); `locked_null_gate` makes a single
  failure BLOCK the release regardless of FDR outcomes.
  Families are declared at registration: re-familying a
  failure is `family_edit_null` — a ledger violation,
  not a fix.
- **Peeking is a type-I machine.** `corpusRun` emits
  per-tick streams; anyone who watches a running p-value
  and stops when it dips below .05 has inflated the error
  rate arbitrarily (Robbins 1970; Howard et al. 2021,
  *Ann Statist* 49:1055 — CONSENSUS). The discipline:
  anchor monitoring uses **e-values** — nonnegative
  supermartingales under the null whose product stays
  valid at arbitrary stopping times (Ville 1939; Vovk &
  Wang 2021, *JRSS-B* 83:961). For bounded statistics
  (every recall proportion, every TOST statistic scaled
  to [0,1]) the betting-style e-values of Waudby-Smith &
  Ramdas (2024, *JRSS-B* 86:1 — verified) are the
  state of the art: a GRAPA-style predictable plug-in
  λ_t adapts to the running mean, and the confidence
  sequence {m: ∏(1+λ_i(X_i−m)) < 1/α} is time-uniform.
  Verdicts are declared only when e_t ≥ 1/`eval_alpha`
  (=20); deciding on raw p's mid-stream is `peep_null`.
  RW-modeling consequence: anchors may now be watched
  continuously at zero statistical cost — the harness
  never has to choose between early warning and honesty.
- **Screening is per-output and advisory.** The §63
  identifiability map asserts which params each anchor
  can pin. That map should itself be audited: Morris
  elementary-effects screening (`morris_levels`=4 grid,
  `morris_traj`=20 trajectories — Morris 1991,
  *Technometrics* 33:161 — CONSENSUS workhorse) yields
  μ* (|mean elementary effect|, Campolongo, Cariboni &
  Saltelli 2007 — fixes sign cancellation in μ) and σ
  (interaction/nonlinearity). Per anchor, the Morris
  top-k must overlap the declared pinned set at ≥
  `sens_topk_overlap` or the map is stale and the
  corpus's authority on that anchor is suspended.
  Crucially, screening can ADD a param to the audit list
  but can never REMOVE one: an inert μ* on one output
  says nothing about the param's role elsewhere —
  `screen_drop_null`. This is the sloppy-manifold lesson
  (§140) enforced as code: on a sloppy model, most
  params are individually inert on most outputs and
  still load-bearing jointly.
- **Believability is a separate axis from corpus fit.**
  The 18 anchors match population statistics; none of
  them ask whether a human observer, reading a recall
  transcript, would take it for human. `rateBelief` is
  the imitation-game arm (Turing 1950, *Mind* 59:433 —
  as a discrimination protocol, no philosophy imported):
  sim transcripts paired with human protocols sourced per
  anchor design, blinded, order-randomized, `rater_n_min`
  raters. Accuracy must land in `rater_detect_band`
  [0.5, 0.75] — above ceiling = detectably nonhuman;
  below floor = evaluator error (too-good doctrine §62).
  Provenance, params, and arm labels are invisible to
  raters (`rater_leak_null`): knowing which arm is sim
  manufactures demand effects — raters hunt for tells
  (Orne 1962, *Am Psychol* 17:776 — CONSENSUS; the
  demand-characteristics paper). RW-specific: the
  transcripts must be surface-only (emissions, pauses,
  passes, quotes) — a rater who sees records has been
  shown the store, not the mind.
- **Seed stability is an instrument check.** Every gated
  probe reruns on `seed_rep_min`=5 seeds; flip fraction
  > `verdict_flip_max`=0.1 ⇒ FLAKY — exits its FDR
  family pending redesign. A flaky probe is a bug in the
  instrument, never a psychology finding.

## 167. e-value semantics for bounded recall statistics (VA-EVAL) (new in v83)

Concrete instantiation for the harness — this is the
piece implementers asked §14.5b to nail down.

- Recall proportions, recognition hits, confidence means
  are bounded in [0,1]: the betting machinery applies
  verbatim. Per anchor t-th observation X_t (e.g., a
  per-character recall indicator), test m against the
  running capital K_t(m) = ∏_{i≤t}(1+λ_i(m)(X_i−m));
  reject m when K_t ≥ 1/`eval_alpha`; the confidence
  sequence is the m not yet rejected. λ_t predictable,
  GRAPA plug-in λ̂_t(m) = (μ̂_{t−1}−m)/(σ̂²_{t−1}+(μ̂_{t−1}
  −m)²), clipped to keep the factor ≥0 (WSR 2024).
- TOST anchors become two one-sided e-processes
  (equivalence = both margins rejected); `e_merge`=
  "product" for independent arms; for correlated arms
  sharing a character pool, average e-values (arithmetic
  merging stays valid under arbitrary dependence — Vovk
  & Wang 2021) — declared per probe at registration.
- e-values do not replace the release gate's fixed-n
  analyses; they are the MONITORING layer. A corpusRun
  verdict still requires `anchor_n_min`; e-boundaries
  only authorize early ALARM (suspend release, rerun
  seeds) — early PASS claims stay fixed-n to keep the
  §66 holdout honest.
- Established vs hypothesis: e-process validity under
  optional stopping CONSENSUS (Ville; Howard et al.;
  WSR); choosing GRAPA over alternative λ policies is an
  efficiency choice, DEBATED only in magnitude; RW's
  alarm-vs-claim split is an RW HYPOTHESIS of governance
  design, probe-gated by P881–P882.

## 168. The rater arm — protocol details (VA-RATER) (new in v83)

- **Transcript sourcing.** Human-side protocols come from
  the anchor designs themselves where they exist (e.g.,
  narrated autobiographical recall for the reminiscence
  anchors; witness-statement style for misinformation
  anchors); where no protocol exists, elicit fresh
  protocols under the anchor's own instructions and log
  them to the corpus as `design:"protocol"` rows —
  they are corpus data, subject to `ledger_amend` like
  every other row.
- **Blinding.** `rateBelief` strips bookkeeping, canonHash,
  and any field that is not renderable surface. Arms are
  shown in randomized order with a foil pair (human-human)
  per `rater_foil_frac`≈0.2 — foils estimate rater
  vigilance; a rater who fails foils is dropped from the
  band computation.
- **What counts as detection.** Forced choice (which is
  sim) plus confidence; accuracy is the primary
  statistic; a post-choice free-text "what gave it away"
  field is collected for instrument debugging but never
  enters the verdict.
- **Band asymmetry on purpose.** Ceiling breach (raters
  spot the sim >0.75) is a believability failure — the
  surface contract §15.4 is leaking mechanics. Floor
  breach (<0.5, below chance) means raters systematically
  pick human-as-sim: instrument bug or contaminated
  human protocols. Both halt release; they are different
  bugs.
- **Demand hygiene.** Orne 1962: once raters suspect the
  purpose, they produce the data the purpose implies.
  Hence `rater_leak_null` — the arm never carries
  provenance, and the task brief frames it as transcript
  classification, not "spot the AI."

## 169. Probe bookkeeping deltas (v83)

- Family registry gains `family_ver` (declared at
  registration, immutable; `family_edit_null` enforces).
- Verdict ledger rows gain `{e_t, e_boundary_hit,
  seed_verdicts:[5], flake_flag}` — all read-only after
  write (`ledger_amend` unchanged).
- `sensAudit` output rows `{anchorId, param, mu_star,
  sigma, in_declared_topk}` archived beside verdicts;
  disagreement between screen and §63 map suspends (not
  clears) the anchor's authority until re-map.
- `rateBelief` rows `{pairId, arm_hash, accuracy_ci,
  foil_pass_rate}` — arm_hash is provenance for
  auditors, never exposed to raters.

## 170. v83 probe specs (P879–P888 — validation-design IX)

Spec v5.31 §14.5. These probes test the TESTS — the
verdict layer's honesty, not the characters'.

- **P879 null-battery FDR calibration (MUST):** configure
  a global-null run (all SHOULD families engineered
  true-null via B1 mode + trait flattening); BH at
  `fdr_q`=.05 must reject ≤ q·|family| in expectation
  across 20 replicated families — empirical FDR in
  [0, 0.10] (upper bound allows Monte Carlo slack);
  under deliberately correlated arms the BY-corrected
  path must stay inside the same band while raw-BH is
  allowed to exceed it (documents why BY is default).
  Basis: BH 1995; BY 2001.
- **P880 locked-null gate override (MUST — process):**
  inject one failing locked null (e.g., a build that
  touches S on a probe read) into a run whose FDR
  verdict is otherwise PASS — `evalGate` must return
  BLOCK. Basis: spec §14.5a.
- **P881 peeking discipline (MUST — sign-locked + locked
  null):** on a true-null anchor stream, a monitor that
  peeks at fixed-n p every tick and stops at first
  p<.05 rejects ≥3× nominal rate over 200 replicated
  streams (demonstrating the inflation); the same data
  under the e-process rejects ≤ `eval_alpha`.
  `peep_null = 0`. Basis: Robbins 1970; Howard et al.
  2021; Waudby-Smith & Ramdas 2024.
- **P882 e-value merging validity (SHOULD):** product-
  merged e's across independent arms reject at ≤α under
  joint null; arithmetic-merged e's across deliberately
  correlated arms (shared character pool) also stay ≤α;
  product-merging the correlated arms is ALLOWED to
  exceed (documents the dependence clause).
  Basis: Vovk & Wang 2021.
- **P883 screen-vs-map agreement (SHOULD):** `sensAudit`
  on three representative anchors (one decay, one
  misinformation, one emotional) reproduces each
  anchor's declared pinned set at top-k overlap ≥
  `sens_topk_overlap`; σ-ranking flags at least one
  interacting param on the emotional anchor (retention-
  split interactions — §5.x emotional params were
  designed to interact).
  Basis: Morris 1991; Campolongo et al. 2007.
- **P884 screen non-drop (MUST — locked null):** a param
  with bottom-quartile μ* on every audited anchor remains
  in the §63 gate; `screen_drop_null = 0`. Basis: §140
  sloppy-manifold doctrine; Gutenkunst et al. 2007
  (sloppiness — params jointly constrained, individually
  weak).
- **P885 rater detectability (SHOULD):** blinded raters
  on sim-vs-human recall pairs land accuracy in
  `rater_detect_band`; foil-pass rate ≥0.8 or the rater
  pool is re-screened. Basis: Turing 1950 (protocol);
  Orne 1962 (demand hygiene). RW HYPOTHESIS: band
  [0.5,0.75] — real humans produce individually
  distinctive recall, so perfect indistinguishability is
  not expected at scale; the ceiling operationalizes
  "believable."
- **P886 provenance leak (MUST — locked null):** repeat
  P885 with arm labels visible — accuracy must shift
  upward measurably (demand effect exists, proving the
  blind matters), and the labeled run's verdict is void.
  `rater_leak_null = 0`. Basis: Orne 1962.
- **P887 family immutability (MUST — process):** attempt
  to re-register a failed probe under a new family —
  the ledger logs `family_edit_null` violation and the
  evalGate verdict is unaffected by the attempt.
  Basis: spec §14.5a.
- **P888 seed-flake gate (MUST):** all v83-family probes
  across `seed_rep_min`=5 seeds: flip fraction ≤
  `verdict_flip_max`; a deliberately destabilized probe
  (noise injected into its statistic) must be flagged
  FLAKY and exit its family. Basis: §14.5e.

Registry: P1–P888. v83 suite: P879, P880, P881, P884,
P886, P887, P888 MUST; P882, P883, P885 SHOULD.

## 171. Sources verified this version (P879–P888 backing)

- **FDR:** Benjamini & Hochberg 1995 (*JRSS-B* 57:289 —
  the FDR paper, verified); Benjamini & Yekutieli 2001
  (*Ann Statist* 29:1165 — arbitrary-dependence
  correction).
- **Sequential/e-values:** Howard, Ramdas, McAuliffe &
  Sekhon 2021 (*Ann Statist* 49:1055 — time-uniform
  Chernoff bounds); Waudby-Smith & Ramdas 2024
  (*JRSS-B* 86:1 — verified via RSS discussion-meeting
  text: betting CSs for bounded means, GRAPA plug-in,
  validity at arbitrary stopping times); Vovk & Wang
  2021 (*JRSS-B* 83:961 — e-value merging; arithmetic
  mean valid under arbitrary dependence); Robbins 1970
  (peeking inflation — the original LEL critique);
  Ville 1939 (the martingale inequality underneath).
- **Screening:** Morris 1991 (*Technometrics* 33:161 —
  verified: elementary effects, OAT trajectories,
  negligible/linear/nonlinear/interaction
  classification); Campolongo, Cariboni & Saltelli 2007
  (*Environ Model Softw* 22:1509 — μ* fixes sign
  cancellation); Saltelli et al. 2008 (*Global
  Sensitivity Analysis: The Primer* — screen-then-Sobol
  doctrine); Gutenkunst et al. 2007 (*PLoS Comput Biol*
  3:189 — sloppy eigenvalue spectra).
- **Raters:** Turing 1950 (*Mind* 59:433 — imitation
  game as discrimination protocol); Orne 1962
  (*Am Psychol* 17:776 — demand characteristics:
  subjects produce what the design implies);
  Bates 1994 (believable agents — the
  believability-vs-accuracy distinction predates LLMs).
- **Established vs hypothesis:** BH/BY validity,
  e-process optional-stopping validity, Morris
  screening semantics, demand-effect existence are
  CONSENSUS; `rater_detect_band` [0.5,0.75],
  `sens_topk_overlap` 0.8, `verdict_flip_max` 0.1, the
  alarm-vs-claim split in §167 are RW HYPOTHESES of
  governance design, probe-gated by P879–P888.

## 172. v84 probe specs (P889–P898 — encoding-mechanics VII)

Spec v5.32; encoding-mechanics.md Part VII §§84–95. These test
the intake layer's new capture/floor/dwell machinery.

- **P889 VDAC capture (MUST — sign-locked + locked null):**
  rewardAssoc-tagged fields gain E under daLoad where matched
  neutral fields fail (capture share visible in wm_cap
  ordering); `vdac_goal_null` — capture persists when the
  reward-associated field is task-irrelevant or goal-opposed:
  a build where current-goal fields always win the share is a
  locked-null violation, BLOCK. Moderator ordering: wmc-low >
  wmc-high capture magnitude at matched rewardAssoc (Anderson
  2011). Basis: Anderson, Laurent & Yantis 2011; Le Pelley
  2016.
- **P890 VDAC persistence (SHOULD):** rewardAssoc remains
  effective (capture share + co-present tax) weeks after the
  reward contingency ends; decay tracks `vdac_hl`, not
  reward-loss events — a build where capture dies at
  contingency end fails. Basis: Anderson & Yantis 2012.
- **P891 multisensory congruence (MUST):** congruent bimodal
  events beat unimodal at matched attention within the
  `msens_gain` band; incongruent bimodal events UNDERperform
  unimodal on the weaker channel (split cost); cross-modal cue
  retrieval reaches only congruently-minted records — an
  incongruent record must NOT be retrievable via the untested
  modality's cue (bridge audit). Basis: Shams & Seitz 2008;
  Lehmann & Murray 2005.
- **P892 bounded automaticity (MUST — locked null):**
  freq/loc/when attribute fields mint above zero at maximal
  daLoad (`auto_floor`) BUT intentional orienting still
  improves them — `auto_immune_null`: a build where
  att==auto_floor performs identically to att==1 on attribute
  fields fails by construction (the adjudicated verdict:
  floor, not immunity). Basis: Hasher & Zacks 1979/1984;
  Naveh-Benjamin 1987 critique.
- **P893 attribute-floor age shape (SHOULD):** the young–old
  recall gap on attribute fields is smaller than on content
  fields at matched difficulty (partial sparing direction);
  slope nonzero — sparing, not immunity. Basis: Hasher &
  Zacks direction as adjudicated.
- **P894 drawing effect (MUST — ordering + null):** drawn >
  written ≈ imagined ≈ elaborated at matched exposure (the
  Wammes 2016 ordering — drawn must top the composite's
  components); under dual task the drawn advantage shrinks
  less than verbal strategies' (`draw_da_resist`);
  `draw_verbatim_null` TOST-enforced — drawn records match
  written on wording recall (composite trace mints no
  orthography); non-drawable abstract content gains ≤ half.
  Basis: Wammes, Meade & Fernandes 2016; Fernandes, Wammes &
  Meade 2018.
- **P895 RPL dwell (SHOULD — crossover):** self-paced dwell
  concentrates on mid-difficulty items (inverted-U over
  difficulty); `context.deadline` flips allocation to
  easiest-first (`rpl_press_flip`); deficit profiles flatten
  the U; the §71 value leg is unchanged — orthogonal-axis
  audit (importance moves WHAT gets attempted, RPL moves
  where the dwell lands). Basis: Metcalfe & Kornell 2005;
  Son & Metcalfe 2000.
- **P896 elaborative interrogation gate (MUST — locked
  null):** `why:true` gains `ei_gain` only when
  `schema_support ≥ ei_know_gate`; below-gate gain ≤0.03
  TOST-enforced (`ei_noknow_null` — the knowledge contingency
  IS the finding); above-gate composes multiplicatively with
  `teach_expect_gain` (explain-and-interrogate stack, never
  subtract). Basis: Pressley et al. 1987; Dunlosky et al.
  2013.
- **P897 subjective organization (SHOULD):**
  `catRun ≥ org_run_min` sequences mint denser inter-field
  links (edge count per field-pair rises within runs);
  recall clustering rises with run coherence; singleton runs
  unaffected; consc-high profiles show stronger organization
  (trait moderation direction). Basis: Tulving 1962; Bower
  et al. 1969; Sternberg & Tulving 1977.
- **P898 v5.32 regression (MUST — structure):** new
  fields/params pass the P457 non-interference pattern
  (rewardAssoc mints at reward co-occurrence only — no
  future reads; modalities/modalCongruent are encode-time
  flags; drawn/why are engagement variants inside existing
  channels; catRun is a sequence counter, not a store) and
  the §12.2 commutativity pattern (no new op reads across
  charIds).

Registry: P1–P898. v84 suite: P889, P891, P892, P894, P896,
P898 MUST; P890, P893, P895, P897 SHOULD.

## 173. Sources verified this version (P889–P898 backing)

- **VDAC:** Anderson, Laurent & Yantis 2011 (*PNAS*
  108:10367 — verified: reward-associated distractors capture
  attention against goals; WMC/impulsivity moderators);
  Anderson & Yantis 2012 (*Atten. Percept. Psychophys.* —
  verified: >6-month persistence without further learning);
  Le Pelley, Mitchell, Beesley, George & Wills 2016
  (*Psych. Bull.* 142 — verified meta: robust, value-scaled).
- **Multisensory:** Shams & Seitz 2008 (*Nat. Rev. Neurosci.*
  9:655 — verified framework, inverse effectiveness); Murray
  et al. 2004 (multisensory study → better recognition);
  Lehmann & Murray 2005 (cross-modal re-evocation).
- **Automaticity:** Hasher & Zacks 1979 (*JEP:G* 108:356 —
  verified: automatic vs effortful framework);
  Zacks, Hasher & Sanft 1982 (*JEP:LMC* 8:106 — verified:
  frequency tagging incidental); Naveh-Benjamin 1987+ (the
  adjudication — effort involvement: floor, not immunity).
- **Drawing:** Wammes, Meade & Fernandes 2016 (*QJEP*
  69:1752 — verified: >2× recall vs writing, survives
  LoP/imagery/picture controls, quality irrelevant);
  Wammes et al. 2018 (*Exp. Aging Res.* — verified: robust
  in older adults); Fernandes, Wammes & Meade 2018
  (verified: survives divided attention).
- **RPL:** Metcalfe & Kornell 2005 (*JEP:G* 134:530 —
  verified: region of proximal learning); Son & Metcalfe
  2000 (*JEP:LMC* 26 — verified: agenda-based allocation,
  pressure → easy-first); Metcalfe 2002.
- **Elaborative interrogation:** Pressley, McDaniel, Turnure,
  Wood & Ahmad 1987 (verified paradigm); Dunlosky et al.
  2013 (*Psych. Sci. Public Interest* 14 — verified:
  moderate utility, prior-knowledge contingency).
- **Subjective organization:** Tulving 1962 (verified);
  Bower, Clark, Lesgold & Winzenz 1969 (verified:
  hierarchical organization recall multiples); Sternberg &
  Tulving 1977 (SO measurement — verified).
- **Established vs hypothesis:** VDAC existence/persistence/
  moderators, multisensory benefit direction, attribute-floor
  direction, drawing effect ordering, RPL inverted-U +
  pressure flip, EI knowledge contingency, SO-recall
  correlation are CONSENSUS or established; `vdac_hl` 180d
  magnitude, `auto_floor` value, `draw_da_resist` share, the
  catRun counter shape, and the dwell-as-integral formalism
  are RW modeling hypotheses, probe-gated by P889–P898.

## 174. v85 suite (P899–P907) — forgetting-curves VIII

Spec v5.33 mechanics (FC Part VIII §§37–40): savings shadows,
hazard archival, need-prior τ, throughput pressure, form annex.

- **P899 savings re-encode (MUST):** archive → ≥7d → matching
  re-encounter mints E boosted ≥`sav_gain·0.5·savings` vs
  never-encoded control; re-paired (cue-match-only) control
  ≤0.05 (Nelson's own arm). Shadow consumed on use.
- **P900 savings silence (MUST):** `sav_recall_null` — shadows
  never appear in recall/FOK/report output at any strength;
  output-scanned like P783.
- **P901 hazard spread (MUST):** matched cohorts — hazard mode
  archival-day CV ≥0.3, cliff mode =0; means within 15%.
- **P902 graveyard nulls (MUST):** archival-day distributions
  identical across valence and conf strata (TOST) —
  `arch_valence_null` + `hazard_conf_null`.
- **P903 need-prior τ (SHOULD):** never-accessed records,
  top vs bottom needRate tercile — half-life differs in the
  predicted direction ≥ need_tau_gain/2 effect; locked leg:
  needRate never mints/strengthens (need_mint_null) and never
  enters θ (need_retrieve_null).
- **P904 form discipline (SHOULD):** ≥80% of per-record
  survival curves: power+floor within ΔAIC 2 of exponential;
  fitted floor above chance line (Averell & Heathcote 2011
  protocol, hierarchical not pooled).
- **P905 aggregate steepening (SHOULD):** pooled β_est >
  median per-record β (Simon 1966 heterogeneity); per-record
  Jost ordering retained (P5 regression).
- **P906 throughput pressure (SHOULD):** high- vs low-volume
  day after encode → episodic R diverges in predicted
  direction; semantic exempt (vol_scope TOST leg).
- **P907 reinstatement cap (MUST):** reinstated verbatim pool
  ≤ fresh event's delivered content — zero shadow-sourced
  fields (`sav_verbatim_null`, output-diffed).

Registry: P1–P907. v85 suite: P899, P900, P901, P902, P907
MUST; P903, P904, P905, P906 SHOULD.

## 175. Sources verified this version (P899–P907 backing)

- **Savings:** Nelson 1978 (*JEP:HLM* 4:453 — verified:
  savings detectable where recall AND recognition fail);
  Nelson 1985 (*JEP:LMC* 11:472 — verified: savings is
  Ebbinghaus's sole measure, most sensitive of the three);
  MacLeod & Nelson 1984 (replication — concatenation
  interpretation); Nelson, Fehling & Moore-Glascock 1979
  (semantic savings).
- **Form:** Averell & Heathcote 2011 (*J. Math. Psychol.*
  55:25–35 — verified: hierarchical Bayesian; exponential
  best raw fit, power wins model selection, above-chance
  asymptote in all analyses); Simon 1966 (*Psychometrika*
  31:505 — verified: Jost + exponential ⇒ heterogeneous
  rates, aggregate steepening); Rubin & Wenzel 1996 (Part I).
- **Need-prior:** Anderson & Schooler 1991 (*Psych. Sci.*
  2:396 — verified: need-probability mirrors availability
  across three corpora); Schooler & Anderson follow-ups
  (children's input replication).
- **Throughput:** Hardt, Nader & Nadel 2013 (*TICS* 37:111 —
  verified "Decay happens"); Frankland, Köhler & Josselyn
  2013 (*TINS* — verified, infantile amnesia account);
  mechanism DEBATED (adult neurogenesis rates contested) —
  reduced form only.
- **Established vs hypothesis:** savings-existence,
  survival-variance, need↔availability shape correspondence,
  above-chance asymptote, heterogeneity steepening are
  CONSENSUS/established; hazard-as-mechanism, per-class τ
  shift, vol_loss magnitude, savings-as-scalar-shadow are
  RW modeling hypotheses, probe-gated P899–P907.

## 176. v86 suite (P908–P917) — retrieval-cues VIII

Full prose specs in retrieval-cues.md §90. Harness signatures:

- **P908 mind pop (MUST, structure):** encode → `pop_seed`
  minted; seeds decay `pop_seed_hl`; pops cluster in
  `autopilot` (pop_auto_mult arm, ≥1.5× focused-rate);
  emissions are `pop:{gist_term}` with zero verbatim fields
  (`pop_episodic_null` structure-checked); ≤pop_link_p
  episode routes.
- **P909 MEAM (MUST, two arms):** familiar-song cue —
  involuntary share ≥0.72 (`meam_invol`·0.9), perceptual
  detail +meam_rich·0.8 over matched face cues; novel song
  → w=0 (`meam_scope` structure-check).
- **P910 date null (MUST, sign):** `when`-only cue → chance
  episodic recall; same event via `lm_route` landmark →
  normal recall; emitted datings are landmark+offset form,
  never bare-calendar (string-level check on reports).
- **P911 cue-word class (SHOULD):** activity words ≥1.2×
  object words; object hits older era + higher
  generic-record share (`cw_obj_age`); `cw_verbatim_null`
  structure-checked.
- **P912 referential poverty (MUST):** name→pronoun swap
  drops recall ≥(1−ref_thin)·0.8 unless referent alone in
  `ref_focus`; dual-referent stacks emit `refError:true` at
  ref_mis_p±20%; refError carries no accuracy debit
  (field-check).
- **P913 scaffolding (SHOULD, dyadic):** elaborative prompt
  raises partner detail ≥scaf_gain·0.8 vs closed prompt;
  child-target boost ≥1.44× adult (scaf_child_mult·0.8);
  repeat prompts decay scaf_repeat_pen.
- **P914 contiguity (MUST, order):** next-emission lag ∈
  ±contig_lag_win at ≥2× chance; fwd/bwd ratio ≥
  contig_fwd·0.9; attenuation on high-ageScale AND on
  evClust-routed bouts — both arms.
- **P915 ESI (SHOULD):** post-esi_thresh bout → next-bout
  specificity +esi_gain·0.8; lift gone after esi_hl_bout;
  no cumulative gain across sessions (esi_learn_null).
- **P916 pop aging (COULD, null-ish):** old-age pop rate
  declines ≥ episodic-intrusion decline rate; logged not
  asserted (K&M age gradient shallow).
- **P917 scaffolding independence (MUST, negative):**
  scaffolded-vs-control target stores identical when the
  scaffolded recall is not emitted (no record-state delta
  from the partner's prompt).

Registry: P1–P917. v86 suite: P908, P909, P910, P912, P914,
P917 MUST; P911, P913, P915 SHOULD; P916 COULD.

## 177. Sources verified this version (P908–P917 backing)

- **Mind pops:** Kvavilashvili & Mandler 2004 (*Cognitive
  Psychology* 48:47–94 — verified via DOI + abstract:
  cue-opaque semantic pops, automatic-activity bias,
  hours-to-days priming delay); Mandler 1994 (coinage);
  Berntsen 2021 (*WIREs Cogn. Sci.* 12 — involuntary AM
  boundary).
- **MEAMs:** Janata, Tomic & Rakowski 2007 (*Memory*
  15:845–860 — verified via abstract: ~30% evoke rate,
  positive skew, nostalgia third); Jakubowski & Ghosh 2021
  (*BJOP* — verified: 83% spontaneous); Belfi, Bai et al.
  2022 (*Psychology of Music* — verified: episodic richness
  vs face cues); El Haj, Fasotti & Allain 2012 (*Conscious.
  Cogn.* 21 — verified).
- **Landmarks/dates:** Wagenaar 1986 (*Cognitive
  Psychology* 18:225 — verified `when` failure); Barsalou
  1988 (*Psych. Rev.* 95 — verified); Kurbat, Shevell &
  Rips 1998 (*Mem&Cogn* 26:1058 — verified landmark
  reference-point dating); Shum 1998 (*Appl. Cogn.
  Psychol.* 12 — verified).
- **Cue words:** Crovitz & Schiffman 1974 (*Bull. Psychon.
  Soc.* 4:517 — verified); Galton 1879; Rubin & Schulkind
  1997 (*Mem&Cogn* 25:859 — verified); Robinson 1976
  (*Cognitive Psychology* 8:578 — verified word-class
  effect); Williams, Healy & Ellis 1999 (concreteness
  mediation).
- **Referential form:** Ariel 1990 (*Accessing Noun-Phrase
  Antecedents*, Routledge — verified accessibility
  hierarchy); Gundel, Hedberg & Zacharski 1993 (*Language*
  69:274 — verified givenness hierarchy).
- **Scaffolding:** Fivush & Fromhoff 1988 (*J. Exp. Child
  Psychol.* 45 — verified); Reese, Haden & Fivush 1993
  (*Cognitive Development* 8:403 — verified); Nelson &
  Fivush 2004 (*Psych. Rev.* 111 — verified review).
- **Contiguity:** Kahana 1996 (*Mem&Cogn* 24:103 —
  verified lag-CRP + forward asymmetry); Howard & Kahana
  2002 (*J. Math. Psychol.* 46:269 — verified TCM);
  Kahana, Howard, Zaromb & Wingfield 2002 (*Psychol.
  Aging* 17:125 — verified age attenuation); Moreton &
  Ward 2010 (*QJEP* 63 — verified AM down-weight).
- **ESI:** Madore, Gaesser & Schacter 2014 (*PNAS*
  111:E1981 — verified); Madore & Schacter 2016 (*Memory*
  24:150 — verified review); Jing, Madore & Schacter 2016
  (*J. Gerontol. B* 71 — verified aging arm).
- **Established vs hypothesis:** cue-opacity of mind pops,
  MEAM involuntary/positive/rich profile, date-cue failure,
  word-class ordering, accessibility hierarchy, maternal
  elaboration, lag-CRP + forward asymmetry + age
  attenuation, ESI lift are CONSENSUS/established;
  pop_seed half-life, meam constants, adult-adult
  scaffolding, `am_att` magnitude, esi decay horizon are RW
  modeling hypotheses, probe-gated P908–P917.

## 178. v87 suite (P918–P927) — age-development VIII

Full prose specs in age-development.md §96. Harness signatures:

- **P918 self-reference onset (MUST, sign):** matched
  selfRelevance-high events, encodeAge 3 vs adult — E
  advantage over selfRelevance-low controls ≤0.5× the adult
  advantage at 3, ≈1.0× at 8 (knot tol ±20%).
- **P919 era null (SHOULD, structure):** adult-age
  Reconstruction of encodeAge-3 records shows no `w_self`
  term — gate reads encodeAge (`self_ref_era_null`
  structure-check on the eval path).
- **P920 recol child gate (MUST):** encodeAge ≤6 records
  emit `reportMode:"know"` ≥2× adult-encodeAge rate at
  matched strength; `fam_w` identical across encodeAge
  (`fam_child_null` field-check).
- **P921 source ripening (SHOULD):** source fields on
  encodeAge ≤6 records decay ≥1.3× adult; content fields
  unchanged (channel isolation).
- **P922 child attention gate (MUST, two arms):** peripheral
  events encode ≤50% adult rate at age_now 5; high-arousal
  events ≥90% parity same age (capture preserved).
- **P923 bump negativity (SHOULD, distribution):** negative
  selfRelevant records' era distribution is flat vs the
  positive bump peak; `ls_pos_only` frozen (script pull
  never fires on negative records).
- **P924 thin futures U (SHOULD):** imagineEvent
  verbatim_count at age_now 5 AND 80 < adult; external-
  detail share +`epf_sem_fill`·0.8 at both ends;
  `future_leak_null` structure-checked.
- **P925 zombie intention (MUST):** post-completion cue
  re-presentation emits `didItAgain:true` at
  pm_zombie_p±25%; ≥70 arm ≥3× young arm; repeated-fire
  ≥1.35× single; monitor stays disarmed
  (`zombie_monitor_null` state-check).
- **P926 recol maturation (COULD):** know→remember
  crossover in encodeAge 8–16 on standard battery; logged.
- **P927 v5.35 regression (MUST, structure):** defaults
  reproduce v5.34 battery except sign-locked diffs; rif_k,
  pm_focal_hit untouched.

Registry: P1–P927. v87 suite: P918, P920, P922, P925, P927
MUST; P919, P921, P923, P924 SHOULD; P926 COULD.

## 179. Sources verified this version (P918–P927 backing)

- **Self-reference development:** Ross, Anderson &
  Campbell 2011 (*Monogr. SRCD* 76(3):1–102 — verified via
  abstract: self-reference mnemonic advantage in 3–4y/o via
  enactment/self-image/ownership); Ross, Hutchison &
  Cunningham 2020 (*Child Development* — verified: AM
  volume ~ self-knowledge volume + self-source monitoring);
  Howe & Courage 1997 (*Psychol. Rev.* 104:499 — cognitive
  self ~18–24mo; mechanism DEBATED).
- **Recollection/familiarity development:** Ofen et al.
  2007 (*Nature Neuroscience* 10:1198 — verified: PFC
  protracted, MTL early, ages 8–24); Billingsley, Smith &
  McAndrews 2002 (*JECP* 82:251 — verified); Ghetti & Lee
  2011 (*Dev. Rev.* 31 — verified review: familiarity ~6–8,
  recollection→adolescence); Cycowicz, Friedman & Duff 2003.
- **Child attention:** Betts, McKay, Maruff & Anderson 2006
  (*Child Neuropsychol.* 12:205 — verified: steep 5→9,
  plateau ~10–12); Ruff & Rothbart 2001 (*Attention in
  Early Development* — verified: orienting precedes
  sustained).
- **Source monitoring development:** Lindsay, Johnson &
  Kwon 1991 (*JECP* 52:297 — verified); Drummey &
  Newcombe 2002 (*Dev. Psychol.* 38:1138 — verified: abrupt
  4→6 source jump); Sluzenski, Newcombe & Kovacs 2006.
- **Life-script positivity:** Berntsen & Rubin 2004
  (*Memory* 12:681 — verified); Thomsen & Berntsen 2008
  (verified); Bohn & Berntsen 2008 (*Memory* 16 —
  verified).
- **Episodic future development/aging:** Busby &
  Suddendorf 2005 (*Cogn. Dev.* 20:362 — verified: tandem
  emergence 3→5); Addis, Wong & Schacter 2008 (*Psychol.
  Sci.* 19:33 — verified: fewer internal details old arm);
  Addis, Musicaro, Pan & Schacter 2010 (*Psychol. Aging*
  25:369 — verified recombination).
- **Intention deactivation:** Scullin, Bugg, McDaniel &
  Einstein 2011 (*Mem&Cogn* 39:1232 — verified: preserved
  retrieval, impaired deactivation); Scullin, Bugg &
  McDaniel 2012 (*Psychol. Aging* 27:46 — verified);
  Bugg & Scullin 2013 (*Psychol. Aging* 28 — verified:
  repetition hardens zombies); Walser, Fischer & Goschke
  2012 (*JEP:LMC* 38:1030 — verified).
- **Established vs hypothesis:** self-reference presence at
  3–4, recollection/familiarity dissociation, sustained-
  attention growth curve, source-monitoring jump, script
  positivity + flat negative bump, tandem MTT emergence,
  old-age simulation deficit, commission-error age
  asymmetry + repetition effect = CONSENSUS/established.
  Knot magnitudes, `dist_child_mult`, `epf_sem_fill` parity
  across ends, `pm_zombie_p` per-cue rates, `bump_neg_pen`
  magnitude = RW hypotheses, probe-gated P918–P927.

## 180. v88 suite (P928–P937) — age-decline VIII

Suite focus: the overlay ledger — event steps, state
overlays, protective slopes, reversible dips, and
world-visible leading indicators (spec v5.36,
AD§§110–119).

- **P928 habit shift (MUST, dissociation):** script-node
  execution share at age 80 ≥1.3× the 30yo share when a
  scripted outcome changes; `goal_update_pen` delays update
  ≥2× sim-days on old profiles; `perseverate` emissions
  fire only on genuine outcome-change events (a stable
  world emits none). Eppinger 2013; de Wit 2014.
- **P929 grief two-half (MUST, sign-lock):** `spousal_loss`
  at 72 degrades new encode legs ~`grief_hl` while pre-loss
  recall stays flat (`grief_recall_null`); the `grief_slope`
  tail is detectable but must not dominate the acute dip
  (≤1.3×) — honors the LASA null. Aartsen 2005; Shin 2018;
  Comijs fixed-effects.
- **P930 hospitalization step (MUST, shape-lock):** `acute`
  hospitalization at 74 shifts encode legs by
  `hosp_step_acute`±20% + transient slope ≥1.5×;
  `elective` produces neither (James 2019 elective-null);
  stored-record recall flat — `hosp_level_null`. Wilson
  2012; Ehlenbach 2010.
- **P931 purpose slope (SHOULD):** purpose 0.9 vs 0.1
  twins diverge post-60 by the HR-0.48-mapped ratio;
  protection survives a `spousal_loss` event (internal
  lever). Boyle 2010/2012.
- **P932 bilingual onset (SHOULD, shape-lock):** bilingual
  twins cross decline knots `biling_years`±0.5 later,
  post-onset slope identical — onset shift never slope
  (`biling_scope` frozen). Bialystok 2007; Zahodne 2014
  counterflag.
- **P933 gait precedence (MUST, order-lock):** decline-arm
  `gaitSlow` hints lead episodic-output decline by
  `gait_lead`±1y; `gait_channel_null` — gait metrics never
  alter a memory roll. Mielke 2013; Buracchio 2010.
- **P934 MT dip-and-rebound (MUST, sign-lock):** forced
  mt_stage sequence shows late_peri encode trough ≥1.4×
  vs pre, full recovery within `mt_recover` (≤5% residual);
  male twin flat; pre-dip recall flat — `mt_recall_null`.
  Greendale 2009.
- **P935 remote semanticization (SHOULD, interaction):**
  at fixed 20y retention 78yo emissions show more external
  share than 35yo; at fixed 78, 20y-old records emit more
  external than 1y-old — both halves required. Sekeres
  2018; Levine 2002.
- **P936 network orthogonality (SHOULD):** `net_size`
  tertiles diverge on decline legs with `social` trait and
  loneliness overlay held equal — structural channel
  separable from perceived. Bennett 2006; James 2011.
- **P937 feedback crossover (MUST, sign-lock):** at 80,
  uncorrected failed-retrieval re-encodes gain LESS than
  passive re-exposure while corrected retrievals gain MORE;
  at 30 both retrieval modes beat re-exposure — full
  crossover required. Tse 2010; Meyer & Logan 2013.

Registry: P1–P937. v88 suite: P928, P929, P930, P933,
P934, P937 MUST; P931, P932, P935, P936 SHOULD.

## 181. Sources verified this version (P928–P937 backing)

- **Habit/goal balance:** Eppinger, Walter, Heekeren & Li
  2013 (*Front. Psychol.* 4:967 — verified: model-based
  impaired, model-free spared, perseveration on strategy
  shift); de Wit, van de Vijver, Ridderinkhof & Crielaard
  2014 (*Cogn. Affect. Behav. Neurosci.* 14:647 —
  verified: devaluation + slips-of-action); de Wit et al.
  2012 (*J. Neurosci.* 32:8211 — verified corticostriatal
  connectivity); Otto et al. 2013 (stress → habitual).
- **Widowhood:** Aartsen, Van Tilburg, Smits, Comijs &
  Knipscheer 2005 (*Psychol. Med.* 35:217 — verified:
  memory decline independent of depression/health); Shin,
  Kim & An 2018 (*Am. J. Geriatr. Psychiatry* 26:778 —
  verified HRS 6,766: time-since-loss scaling); Comijs et
  al. LASA fixed-effects (*J. Gerontol. B* gby104 —
  verified counterpoint: temporary reasoning-only dip,
  women only); Fulton et al. 2022 systematic review
  (64 studies, adverse association overall).
- **Hospitalization:** Wilson et al. 2012 (*Neurology*
  78:950 — verified: 0.031→0.075/yr, 2.4×, episodic 3.3×);
  Ehlenbach et al. 2010 (*JAMA* 303:763 — verified: CASI
  −1.01/−2.14, dementia HR 1.4/2.3); James et al. 2019
  (*JAMA Netw Open* — verified: nonelective 0.076→0.112,
  elective null).
- **Purpose:** Boyle, Buchman, Barnes & Bennett 2010
  (*Arch. Gen. Psychiatry* 67:304 — verified: AD HR 0.48,
  MCI 0.71, slower decline, robust to depression/
  neuroticism/network); Boyle et al. 2012 (verified:
  moderates pathology→cognition mapping); Kim et al. 2019
  (*AJGP* — verified HRS 11,557).
- **Bilingualism:** Bialystok, Craik & Freedman 2007
  (*Neuropsychologia* 45:459 — verified ~4.1y delay);
  Craik, Bialystok & Freedman 2010 (~5y); DEBATED —
  Zahodne et al. 2014 (*Neurology*) null; Mukadam 2017
  meta attenuation in prospective samples.
- **Gait:** Mielke et al. 2013 (*J. Gerontol. A* 68:929 —
  verified Mayo 1,478: gait→cog direction only); Buracchio
  et al. 2010 (*Arch. Neurol.* 67:980 — verified ~12y
  pre-MCI acceleration); Tian et al. 2020 (*JAMA Netw
  Open* 3:e1921636 — verified 6-cohort meta: dual decline
  6.28× dementia risk).
- **Menopause:** Greendale, Huang, Wight et al. 2009
  (*Neurology* 72:1850 — verified SWAN 2,362: late-peri
  learning 7–28% of pre, post rebound); Greendale et al.
  2010 SWAN symptom analysis (verified: not fully
  symptom-mediated).
- **Remote semanticization:** Sekeres, Winocur &
  Moscovitch 2018 (*J. Neurosci.* — verified); Levine et
  al. 2002 (*Psychol. Aging* — §104/§5.78c anchor);
  Piolino et al. 2006; Nadel & Moscovitch 1997 MTT.
- **Structural network:** Bennett, Schneider, Tang,
  Arnold & Wilson 2006 (*Lancet Neurol.* 5:406 — verified:
  network size modifies pathology→function, survives
  depression/activity controls); Crooks et al. 2008
  (*AJPH* 98:1221 — verified HR 0.74); James, Wilson,
  Barnes & Bennett 2011 (*JINS* — verified activity
  frequency → slower decline).
- **Testing/feedback:** Tse, Balota & Roediger 2010
  (*Psychol. Aging* 25:19 — verified crossover); Meyer &
  Logan 2013 (*Psychol. Aging* — verified extension).
- **Established vs hypothesis:** habit/goal dissociation,
  bereavement→decline association (tail DEBATED), post-
  hospitalization acceleration + elective-null, purpose
  protection, gait→cognition arrow, MT dip-and-rebound,
  remote semanticization, network-size moderation,
  testing×feedback crossover = CONSENSUS/established
  (bilingual onset DEBATED). All knot magnitudes,
  age-equivalent unit conversions (hosp_step, grief_equiv),
  compressed leads (gait_lead 4y vs 12y, mt_learn 0.5 vs
  0.07 learning rate) = RW hypotheses, probe-gated
  P928–P937.

## 182. v89 suite (P938–P947) — emotional-memory VIII

Suite focus: the quiet uses of feeling — present-state
pull on past-feeling reports, suppression's aftereffects,
narrative schemas, the invisible repair, and three
edge-mechanisms (dissociation, boundaries, the camera)
(spec v5.37, EM§§98–107).

- **P938 consistency direction (MUST, sign-lock):** a
  dyad whose bond rises +0.4 over 60 days emits
  past-feeling reports bent positive by ≥
  `consist_floor`; a falling dyad bends negative; a
  STABLE-unhappy dyad bends < floor (Δ-drives, not
  level). Stored tags unchanged on refire;
  `consist_fact_null` — event content identical in
  emitted reports. McFarland & Ross 1987; Karney &
  Coombs 2000.
- **P939 msd conditions (SHOULD, dissociation):** at
  fixed cue strengths, self-generated recalls show
  mood-match effect ≥3× externally-cued; neutral records
  ≤`msd_neutral_mult` of charged; `msd_store_null` —
  mismatched records never archive/delete. Eich &
  Macaulay 2000; Smith & Vela 2001.
- **P940 SIF dent-and-rebound (MUST, dissociation):**
  15 successful suppressions → below-baseline recall on
  same-cue AND novel-cue probes (independence is the
  load-bearing cell — cue-blocking explanations fail
  it); `C.load`≥0.6 attempts produce MORE intrusions
  than baseline within 2 ticks; `sif_del_null` — record
  never archives, resurrect path fires it. Anderson &
  Green 2001; Anderson & Huddleston 2012; Wegner 1994.
- **P941 sequence drift (SHOULD, sign-lock):**
  narr_seq +0.8 vs −0.8 twins retell the same negative
  record 5×: redemptive arm cools ≥`redempt_cool`-
  scaled beyond §16 dampen; contam arm drifts reported
  valence toward 0/negative; CONTENT fields identical
  (`narr_truth_null`). McAdams 2001/2006.
- **P942 immune blind (SHOULD):** resolved negative
  record (peak 0.7, 21d recovery) → matched-event
  forecast overshoots stored recovery by ≥`heal_gap_k`
  and emits `heal_gap:true`; `immune_blind_null` — no
  recovery-rate term exists anywhere to correct it.
  Wilson & Gilbert 2003; Gilbert et al. 1998.
- **P943 choice migration (MUST, interaction):** 30d
  post-`choice`, feature reports misattribute positive
  features to the chosen option ≥4× reverse direction;
  day-2 < day-30 (grows as `opt_src` rots); 80yo >
  30yo (`choice_age_gain`); option set + choice fact
  intact (`choice_content_null`). Henkel & Mather
  2007; Gilbert & Ebert 2002 (irrevocability arm).
- **P944 boundary split (MUST, dissociation):** one
  3-beat event, affect_shift ≥`bound_thresh` at beat 2:
  across-seam order errors ≥2× within-seam; across-seam
  `felt_dt` ≥1.3×; cross-seam proactive interference
  reduced; strong cross-seam cue still retrieves —
  order lost, access kept (`bound_del_null`). Heusser
  2022; Clewett 2020.
- **P945 positivity reversal (MUST, sign-lock):** 70yo
  vs 30yo twins, mixed pos/neg event: full-attention
  arm — older recall skews positive (`pos_enc_gain`-
  scaled share shift); divided-attention arm — older
  skews NEGATIVE relative to young. Both arms
  required; `pos_youth_null` in the young;
  `pos_appraisal_null` — threat fields encode
  regardless. Mather & Knight 2005; Knight et al.
  2007. (A sim showing old-positivity under
  distraction has the wrong mechanism.)
- **P946 dissociation split (SHOULD, dissociation):**
  dissoc 0.9 vs 0.1 twins, arousal 0.75 event: high-
  dissoc record shows link density <60% low + intrusion
  rate > low + voluntary θ surcharge — three-way;
  content fields present in both
  (`dissoc_content_null`); `trauma_n` raises the roll
  (`kindle_gain`). Ozer et al. 2003; van der Kolk &
  Fisler 1995.
- **P947 camera asymmetry (COULD):** photographing arm
  vs control: visual recall +, auditory −; photographed
  beats > unphotographed; positive tag
  +`photo_engage_gain`, negative −same; total E parity
  (`photo_offload_null`); `photo_review` refreshes only
  `photographed:true` fields. Barasch 2017; Diehl 2016.

Registry: P1–P947. v89 suite: P938, P940, P943, P944,
P945 MUST; P939, P941, P942, P946 SHOULD; P947 COULD.

## 183. Sources verified this version (P938–P947 backing)

- **Consistency bias:** McFarland & Ross 1987 (*JPSP*
  53:934 — dating couples, recall tracks current
  evaluation); Karney & Coombs 2000 (*Pers. Soc.
  Psychol. Rev.* 4:123 — newlywed trajectories:
  Δ-satisfaction drives direction); Scharfe &
  Bartholomew 1995; Holmberg & Holmes 1994 (premarital
  narrative reconstruction correlates with current,
  not initial, satisfaction).
- **Mood-state-dependence:** Bower, Monteiro & Gilligan
  1978; Bower 1981 (proposal); Eich & Macaulay 2000
  (*Memory & Cognition* — verdict: real, small, needs
  self-generated cues + genuine mood at both ends);
  Smith & Vela 2001 (*Psychon. Bull. Rev.* meta —
  context-dependency; mood the weakest context term);
  Ucros 1989.
- **Suppression-induced forgetting:** Anderson & Green
  2001 (*Nature* 410:366 — TNT, independent-probe
  deficit); Anderson & Huddleston 2012 (*Nebraska
  Symposium* — ~10% below-baseline over 47
  experiments); Levy & Anderson 2008 (affect quiets
  with the fact); Wegner 1987/1994 + Wenzlaff & Wegner
  2000 (ironic rebound under load, hyperaccessibility
  in dysphoria); 2024 multilevel meta (small SIF,
  same-probe > independent-probe, valence-neutral —
  bounds honored).
- **Narrative sequences:** McAdams et al. 1997 +
  McAdams 2001/2006 (redemption ↔ generativity/
  well-being; contamination sequences); Adler et al.
  2015/2017 (sequence shifts track symptom change);
  Pasupathi 2001 (retell stabilizes the told version).
- **Immune neglect:** Gilbert, Pinel, Wilson, Blumberg
  & Wheatley 1998 (*JPSP* 75:617); Wilson, Meyers &
  Gilbert 2001; Wilson & Gilbert 2003 review — people
  under-credit their own recovery machinery.
- **Choice-supportive memory:** Henkel & Mather 2007
  (*Psych Sci* — feature reattribution to chosen,
  delay-dependent, OLDER adults more biased); Mather &
  Johnson 2000; Mather, Shafir & Johnson 2000; Benney
  & Henkel 2006; Gilbert & Ebert 2002 (irrevocability
  recruits the rationalizer); Svenson & Benthorn 1992.
- **Affect boundaries:** Clewett & Davachi 2017;
  Clewett, Schoene & Davachi 2020 (*Nat Comms* —
  pupil-linked arousal bursts at boundaries organize
  temporal memory); Heusser, Poeppel, Ezzyat & Davachi
  2022 (*Nat Comms* — within-event order improved /
  across impaired + temporal-context reset model —
  implemented literally); Rouhani et al. 2020 (RPE
  surprise mints boundaries, backward binding);
  2023 *Cognition & Emotion* dissociation (emotion
  enhances own-item order, boundaries impair across;
  segmentation boosts item-context binding, emotion
  impairs it).
- **Positivity effect:** Mather & Carstensen 2005
  (*TICS*); Kennedy, Mather & Carstensen 2004
  (*Psych Sci*); Reed, Chan & Mikels 2014 meta;
  Mather & Knight 2005 (*Psych & Aging* — control-
  dependent; DA eliminates AND reverses); Knight,
  Seymour, Gaunt, Baker, Nesmith & Mather 2007
  (*Emotion* — eye-tracking reversal under
  distraction); Murphy & Isaacowitz 2008 (weaker
  attention-side meta — DEBATED frame honored by
  keeping it on the regulation pathway).
- **Peritraumatic dissociation:** Ozer, Best, Lipsey &
  Weiss 2003 (*Psych Bull* 129:52 meta, 68 studies —
  strongest during-event PTSD predictor, r≈.35);
  van der Kolk & Fisler 1995 (fragmentary encoding);
  Marmar et al. 1994; Putnam 1997 (trait dissociative
  capacity); Ehlers & Clark 2000 (intrusive-↑/
  voluntary-↓ phenomenology).
- **Photo-mediated memory:** Barasch, Diehl, Silverman
  & Zauberman 2017 (*Psych Sci* 28:1050 — visual+/
  auditory−, photographed>unphotographed, mental-photo
  arm proves attentional mechanism); Diehl, Zauberman
  & Barasch 2016 (*JPSP* 111:119 — engagement→
  enjoyment positive, worse negative); Henkel 2014
  (offload deficit under expected delegation —
  reconciled via `photographing:"archive"`); St.
  Jacques & Schacter 2013 (reactivation-selectivity
  reading for the photo-cue preservation arm —
  HYPOTHESIS extension).

New sources verified this version: McFarland & Ross
1987, Karney & Coombs 2000, Eich & Macaulay 2000,
Smith & Vela 2001, Anderson & Green 2001, Anderson &
Huddleston 2012, Levy & Anderson 2008, Wegner 1987/
1994, Wenzlaff & Wegner 2000, 2024 SIF multilevel
meta, McAdams 1997/2001/2006, Adler 2015/2017,
Pasupathi 2001, Gilbert et al. 1998, Wilson & Gilbert
2003, Henkel & Mather 2007, Gilbert & Ebert 2002,
Clewett 2020, Heusser 2022, Rouhani 2020, Mather &
Carstensen 2005, Kennedy 2004, Reed/Chan/Mikels 2014,
Mather & Knight 2005, Knight et al. 2007, Ozer et al.
2003, van der Kolk & Fisler 1995, Ehlers & Clark
2000, Barasch et al. 2017, Diehl et al. 2016,
Henkel 2014 — probes P938–P947.

## 184. v90 suite (P948–P957) — false-memory VIII

Suite focus: the edges of the record — generation,
description, probing, swapping, interrogation,
collaboration, boasting, and the banned operator
(spec v5.38, FM§§88–97).

- **P948 cryptomnesia (SHOULD, generation):** seed a
  `told_by` pitch, decay `confidenceInSource`<0.3, run a
  generation op — plagiarize at ≈`crypt_p`×(1+self-
  similarity); minted output never names the origin
  (`crypt_source_null` — audit sees `claimed_mine:true`,
  the character sees authorship). Dissociation arm:
  fresh-source records plagiarize ≈0. Brown & Murphy
  1989; Marsh & Bower 1993; Macrae et al. 1999.
- **P949 boundary extension (MUST, normalization):**
  scene record's reported extent > observed at day 0–1,
  converging to frame by `bext_norm_tau`; non-scene
  records invariant (`bext_nonscene_null`); whole-
  episode phantoms unchanged (bext is adjacent-content
  only — §6.8 stays the episode path). Intraub &
  Richardson 1989; Hubbard 1996.
- **P950 verbal overshadowing (SHOULD, dissociation):**
  post-`describe` recognition drops ≈`verb_shad_pen`
  then recovers on `verb_shad_hl`; the described visual
  field drifts toward the verbal label's prototype at
  ≈`verb_label_pull`; semantic/gist fields untouched
  (`verb_semantic_null`). Schooler & Engstler-Schooler
  1990; Meissner & Brigham 2001; Carmichael et al. 1932.
- **P951 crashing memories (MUST, ordering-lock):**
  `footage_probe` on a high-notoriety event mints
  `saw_footage` phantoms at ≈`media_phantom_p`;
  detail-demanding follow-up yields MORE endorsements
  than yes/no probe (the Crombag 66>55 ordering —
  demand runs the schema fill); low-notoriety probes
  mint zero (`footage_obscure_null`); `suggs`-high
  twins > `suggs`-low. Crombag et al. 1996; Ost et al.
  2002; Otgaar et al. 2022.
- **P952 truthiness (SHOULD, content-lock):** identical
  accounts ±`nonprob_image` differ in believe_p by
  ≈`truth_gain`; verbatim/field content identical
  (`truth_content_null`); photo-armed single source ≈
  1.5 unarmed sources via `truth_fluency_k`. Newman et
  al. 2012/2015.
- **P953 choice blindness (SHOULD, layer-lock):**
  swapped feedback on a recent `choice` → detection
  ≤~30% (×`meta_conf` arm higher); on miss, confabulated
  reasons minted AND born `chosen` field intact under a
  `reported_chosen` overlay (`cb_record_null`);
  `swapped_choice:true` emitted. Johansson et al. 2005;
  Hall et al. 2010.
- **P954 coerced self-false (MUST, ordering + cap):**
  self-action field under `interrogate:true` +
  `evidence_claim`: adoption orders evidence_claim >
  interrogate > bare question; internalization rate ≤
  `ownact_session_cap` (0.28 — the Kassin & Kiechel
  ceiling); event ledger unchanged (`ownact_fact_null`);
  `confessed_untrue:true` emitted and audit-visible.
  Kassin & Kiechel 1996; Nash & Wade 2009; Hanba &
  Zaragoza 2007.
- **P955 collaborative inhibition (MUST, bound-lock):**
  `groupRecall` output < nominal pool by ≈
  `collab_inhib`·org_mismatch; NEVER greater
  (`collab_gain_null`); matched-organization pairs
  ≈uninhibited, mismatched pairs maximally; small net
  error-pruning `collab_correct`. Weldon & Bellinger
  1997; Basden et al. 1997; Rajaram & Pereira-Pasarin
  2010.
- **P956 overclaiming (SHOULD, tier-lock):** plausible
  domain foils false-alarm at `oc_p` preserving the
  `meta_conf·self_est` expertise ordering; minted
  records are `familiar_only` tier, never episodic
  (`oc_episodic_null`); warned claims land at
  `oc_warn_resid`, not zero (`oc_warn_null`). Atir et
  al. 2015.
- **P957 the banned path (MUST — locked null):** a full
  `therapy_probe` soak (guided imagery × repeated
  probing × dream interpretation, many sessions) may
  mint `imagined`-source phantoms and flipped felt
  memories, but yields ZERO veridical latent-recovery
  records anywhere in the store
  (`repress_revival_null`) — the absence is the probe.
  McNally 2003; Loftus 1993; Brewin & Andrews 2017;
  Patihis et al. 2014.

Registry: P1–P957. v90 suite: P949, P951, P954, P955,
P957 MUST; P948, P950, P952, P953, P956 SHOULD.

## 185. Sources verified this version (P948–P957 backing)

- **Cryptomnesia:** Brown & Murphy 1989 (*J. Verbal
  Learn. Verbal Behav.* 28 — three-phase paradigm,
  ~9% worst-cell plagiarism, other-self asymmetry);
  Marsh & Bower 1993 (plagiarism under explicit
  warning); Marsh, Landau & Hicks 1997 (alternate-uses
  replication); Macrae, Bodenhausen & Calvini 1999
  (self-similarity gate — same-sex > opposite-sex).
- **Boundary extension:** Intraub & Richardson 1989
  (*JEP:LMC* — the founding close-up/wide-angle study);
  Intraub, Gottesman & Bills 1998; Hubbard 1996
  (review); Intraub 2002 (viewpoint-angle extension);
  normalization-to-frame timecourse per the follow-up
  literature.
- **Verbal overshadowing:** Schooler & Engstler-
  Schooler 1990 (*Cogn. Psychol.* — the face lineup);
  Meissner & Brigham 2001 (*Appl. Cogn. Psychol.* meta
  — small reliable cost, largest for faces); Alogna et
  al. 2014 (*Perspect. Psychol. Sci.* RRR, 31 labs —
  direction replicates, magnitude shrunk — flagged
  DEBATED); Carmichael, Hogan & Walter 1932 (label→
  reproduction pull); Bartlett 1932 (portrait d'homme).
- **Crashing memories:** Crombag, Wagenaar & van Koppen
  1996 (*Appl. Cogn. Psychol.* 10:95 — 55% yes/no,
  66% detail-demanding, most supplied particulars);
  Ost, Vrij, Costall & Bull 2002 (*Br. J. Psychol.* —
  ~44% Diana-crash footage); Smeets et al. 2009;
  Otgaar et al. 2022 (*Memory* — 25.7%/38%, suggesti-
  bility-associated).
- **Truthiness:** Newman, Garry, Bernstein, Kantner &
  Lindsay 2012 (*Psychon. Bull. Rev.* — nonprobative
  photos inflate truth + hindsight); Newman et al.
  2015 (conceptual replication / pooled).
- **Choice blindness:** Johansson, Hall, Sikström &
  Olsson 2005 (*Science* 310:116 — <10% concurrent,
  ≤26% total detection, confabulated reasons); Hall,
  Johansson & Strandberg 2010 (moral-position swaps +
  longitudinal tilt); Strandberg et al. 2018 (boundary
  conditions); Levin et al. 2000 (metacognitive
  over-prediction of detection).
- **Coerced self-false-memory:** Kassin & Kiechel 1996
  (*Psychol. Sci.* 7:125 — 69% signed / 28%
  internalized / 9% confabulated; 100/65/35 fast
  high-vulnerability cell); Nash & Wade 2009 (*Appl.
  Cogn. Psychol.* — doctored own-act video); Horselen-
  berg et al. 2003; Hanba & Zaragoza 2007 (*Appl.
  Cogn. Psychol.* — forced confabulation converts).
- **Collaborative inhibition:** Weldon & Bellinger
  1997 (*JEP:LMC* — nominal > collaborative); Basden,
  Basden, Bryner & Thomas 1997; Rajaram & Pereira-
  Pasarin 2010 (*Perspect. Psychol. Sci.* review —
  retrieval-strategy disruption account).
- **Overclaiming:** Atir, Rosenzweig & Dunning 2015
  (*Psychol. Sci.* 26 — self-perceived expertise
  predicts claiming nonexistent items; survives
  incentives, partially survives warning).
- **Recovered-memory boundary:** McNally 2003
  (*Remembering Trauma* — the laboratory verdict);
  Loftus 1993 (*Am. Psychol.* 48:518); Brewin &
  Andrews 2017 (*Appl. Cogn. Psychol.* review);
  Patihis, Ho, Tingen, Lilienfeld & Loftus 2014
  (*Psychol. Sci.* 25:519 — clinician/lay belief
  surveys).

## 186. v91 suite (P958–P969) — individual-differences VIII

Suite focus: the chemistry and the crowd — blackout
proneness, medication burden, the choke paradox,
attentional control, the worried well, own-group face
bias, episodic simulation, the pregnancy dip, caffeine
dependence, gaming reflexes, and the third mandated
null (spec v5.39, ID§§92–105).

- **P958 the holes in the evening (MUST — rescue
  split):** blackout=+1.5 vs 0, intox=0.7 identical
  event diet: fragmentary records carry `frag:true`,
  thin source tiers, θ+`blackout_theta_pen`; cue-
  supported recall rescues ≈`blackout_cue_rescue` as
  `reconstructed` provenance; en-bloc records absent
  under every cue arm (`blackout_rescue_null`); pre-
  drinking records identical (`blackout_retro_null`);
  sober-side performance identical — the trait only
  operates under intox. Hartzler & Fromme 2003;
  Wetherill & Fromme 2011; White 2003.
- **P959 the shield beside the hole (OBSERVE):**
  events encoded pre-drinking in intox≥0.3 nights
  accrue less next-day interference than sober-night
  controls (`intox_retro_shield` leg) while same-night
  intox-encoded events carry the gap — both effects
  on one timeline, no record overlap. Parker et al.
  1980/81; Carlyle et al. 2017.
- **P960 the honest pill (MUST — direction-lock):**
  med_burden=1.5 vs 0: burden-window records show the
  E/source tax; pre-burden records identical
  (`med_retro_null`); post-`med_washout` encode arms
  converge; `med_aging_add` drifts only the long slope.
  Curran 1991; Buffett-Jerrott & Stewart 2002; Gray
  2015 (associational leg flagged DEBATED).
- **P961 the expensive advantage (MUST —
  interaction):** wmc=+1.5 vs −1.5 at matched g_mem,
  eval_press on vs off: high-wmc loses MORE
  discrimination/source/interference performance under
  pressure (`choke_k`·wmc⁺); below `choke_gate` arms
  identical (`choke_lowstake_null`);
  `arousal_narrowing` unchanged — the choke is not the
  arousal. Beilock & Carr 2005; DeCaro et al. 2011;
  Eysenck et al. 2007.
- **P962 the landing pad (SHOULD):** neurot=+1.5 held,
  att_ctl −1.5 vs +1.5: stress-state att-floor tax and
  eval_press noise diverge; zero-load arms identical —
  att_ctl buffers only under load. Derryberry & Reed
  2002; Berggren & Derakshan 2013.
- **P963 the worried well (MUST — locked null):**
  scd=1 vs 0 at identical g_mem/aging_rate/reserve:
  complaint surface and worry intrusions rise; ALL
  accuracy-side measures identical within jitter —
  any E/β/θ difference FAILS (`scd_obj_null`). Bonus
  arm: scd×eval_press spends real wmc via §6.195.
  Jessen et al. 2014; Rabin et al. 2017.
- **P964 whose face (SHOULD — tier-lock):**
  cross_exp=0 vs +2: out-group familiarity gap and
  out-group FA rate both shrink by ≈`orb_expo_k`;
  episodic content about out-group people identical
  (`orb_content_null`); out-age arm ≈`orb_age_w`·
  own-race magnitude. Meissner & Brigham 2001; Rhodes
  & Anastasi 2012.
- **P965 the shared machinery (SHOULD):** sim=+1.5 vs
  −1.5: `future:true` detail density tracks recall
  specificity (partial corr with vivid/g_mem held);
  content accuracy identical (`sim_content_null`) —
  detail and truth decouple. Addis et al. 2007;
  Schacter & Addis 2007; Madore & Schacter 2014.
- **P966 the third-trimester shape (SHOULD):**
  preg_state 0→1→2→3: E-dip follows `preg_trim_w`
  (T3-weighted, not linear); complaint surface fires
  T1–T3 independent of objective tax; post-state
  records recover (`preg_perm_null`); pre-pregnancy
  retrieval identical (`preg_theta_null`). Davies et
  al. 2018.
- **P967 the morning reference (SHOULD — reversal):**
  caff=1.5: `caff_wd` taxes noise/θ/breadth; dosed
  returns all to baseline, never above
  (`caff_ability_null`); `caff_state_dep` arm measured
  and expected near floor (DEBATED). Rogers &
  Dernoncourt 1998; James & Rogers 2005; Kelemen &
  Creeley 2003.
- **P968 the trained reflex (SHOULD — channel-lock):**
  gamer=+2 vs 0: fast-visual att floor, spatial cue
  weight, visual detail shift; episodic E/β/θ identical
  within jitter (`gamer_episodic_null`) — any link_p or
  specificity difference FAILS. Bediou et al. 2018;
  Boot et al. 2011; Hilgard et al. 2017.
- **P969 the drill that doesn't travel (MUST — locked
  null):** 30-session training:mem regimen on
  braintrain=+1.5: trained-task improves (`nt_xfer`),
  EVERY other measure identical within jitter
  (`braintrain_far_null`); P843's mnem arm runs in the
  same suite — skill and null coexist. Simons et al.
  2016; Melby-Lervåg & Hulme 2013; Owen et al. 2010.

Registry: P1–P969. v91 suite: P958, P960, P961, P963,
P969 MUST; P962, P964, P965, P966, P967, P968 SHOULD;
P959 OBSERVE.

## 187. Sources verified this version (P958–P969 backing)

- **Alcohol blackouts:** Hartzler & Fromme 2003
  (*Alcohol.: Clin. Exp. Res.* 27:628 — placebo-
  controlled etiology, retrieval-failure account;
  *J. Stud. Alcohol* 64:547 — fragmentary:en-bloc ~3:1,
  en-bloc polysubstance-linked); Wetherill & Fromme
  2011 (*Addict. Behav.* 36:886 — FB-history contextual-
  memory impairment at matched BAC); Wetherill et al.
  2011 (dlPFC/parietal BOLD interaction); Nelson et al.
  2004; White 2003 (NIAAA en-bloc/fragmentary review);
  Goodwin et al. 1969 (state-dependency).
- **Retrograde facilitation (OBSERVE leg):** Parker et
  al. 1980/81; Carlyle et al. 2017 (alcohol post-
  encoding shields prior learning — v5.20 priced).
- **Medication burden:** Curran 1991
  (*Psychopharmacology* — benzodiazepine anterograde
  signature, preserved pre-drug retrieval); Buffett-
  Jerrott & Stewart 2002; Gray et al. 2015 (*JAMA
  Intern. Med.* — cumulative anticholinergic → dementia
  HR ~1.5, associational); Fox et al. 2011; Campbell et
  al. 2009.
- **Choke / attentional control:** Beilock & Carr 2005
  (*JEP:General* 134 — high-WMC lose advantage under
  pressure); DeCaro, Thomas, Albert & Beilock 2011;
  Gimmig et al. 2006; Eysenck, Derakshan, Santos &
  Calvo 2007 (*Emotion* 7:336 — attentional control
  theory); Beilock 2008; Derryberry & Reed 2002 (ACS);
  Berggren & Derakshan 2013 (review).
- **Subjective cognitive decline:** Jessen et al. 2014
  (*Alzheimers Dement.* — SCD-I criteria); Rabin et al.
  2017 (*Alzheimers Dement.* — ~25% older-adult
  prevalence, affective correlates, small conversion
  risk).
- **Own-group face bias:** Meissner & Brigham 2001
  (*Psychol. Public Policy Law* 7:3 — 39-study meta,
  ORB + FA asymmetry, contact moderation); Rhodes,
  Hayward & Winkler 2006; Wright, Boyd & Tredoux 2003;
  Rhodes & Anastasi 2012 (*Psychol. Bull.* — own-age
  bias meta, smaller).
- **Episodic simulation:** Addis, Wong & Schacter 2007
  (*Neuropsychologia* — aging detail loss hits memory
  AND simulation); Schacter & Addis 2007 (constructive
  episodic simulation); Race, Keane & Verfaellie 2011;
  Madore & Schacter 2014 (ESI lifts both).
- **Pregnancy:** Davies, Lum, Skouteris, Byrne &
  Hayden 2018 (*Med. J. Aust.* 208:35 — 20 studies,
  709/521, SMD 0.52 overall, T3 memory 1.47 cross-
  sectional, within-normal-range caution, ~80%
  subjective report); Hoekzema et al. 2017 (gray-
  matter — no memory-loss mapping, unpinned);
  Greendale et al. 2009 (SWAN — the mt_* sibling).
- **Caffeine:** Rogers & Dernoncourt 1998 (*Pharmacol.
  Biochem. Behav.* — withdrawal-reversal); James &
  Rogers 2005; Rogers et al. 2013; Kelemen & Creeley
  2003 (state-dependency — DEBATED, priced near floor).
- **Gaming:** Bediou, Adams, Mayer, Tipton, Green &
  Bavelier 2018 (*Psychol. Bull.* 144:77 — cross-sec
  g≈.55, intervention g≈.34, ~30% publication-bias
  inflation, attention/spatial domains); correction
  2018; Boot, Blakely & Simons 2011; Hilgard,
  Engelhardt & Rouder 2017 (Bayesian re-analyses —
  DEBATED).
- **Cognitive training null:** Simons, Boot, Charness,
  Gathercole, Chabris, Hambrick & Stine-Morrow 2016
  (*Psychol. Sci. Public Interest* 17:103 — the review);
  Melby-Lervåg & Hulme 2013 (*Dev. Psychol.* — WM
  training near-yes/far-no); Shipstead, Redick & Engle
  2012; Owen et al. 2010 (*Nature* — 11,430-participant
  RCT, zero transfer).

## 188. v92 suite (P970–P981) — social-memory IX

Probes for the channel-structure layer: conversational residue,
contact-clock ties, stale social maps, expression tiers, apology
footprints, false consensus, mimicry halos, vocal-minority
norms, proposal drift, breached-trust asymptote. Locked nulls
probe-enforced.

- **P970 the talk evaporates (MUST):** verbatim utterance
  fields at 30d ≈ 10±5% of encoded; survivors enriched for
  interaction-content (`convo_interact_gain`); gist/event node
  intact. FAIL if >40% verbatim survives or gist is lost.
- **P971 the formulaic void (MUST — locked null):**
  greeting/phatic exchanges mint ~nothing retrievable at 24h
  (convo_formula_null). FAIL on any retrievable phatic
  verbatim.
- **P972 the fading acquaintance (MUST):** no-contact RelEdge
  decays ~`tie_decay_hl`; kin-typed edges floor at `kin_floor`;
  recontact restores `recontact_rescue` fraction; `drifted:true`
  fires on `tie_alert` crossing. FAIL on deletion
  (tie_delete_null) or kin matching friend decay.
- **P973 the stale map (MUST — belief-vs-fact):** a tie
  dissolved in world fact but unwitnessed stays in the
  character's SocialMap as `stale:true`; witnessed contrary
  events overwrite at ~`witness_refresh`; told_by reports count
  half; canonical state never back-propagates
  (stale_map_fact_null). FAIL on any unwitnessed refresh.
- **P974 the smile that was remembered (SHOULD — tier-lock):**
  `expr:happy` encodes recognize above neutral; `expr:angry`
  captures attention without familiarity gain; trait ledgers
  identical (smile_disposition_null). FAIL if expression moves
  traits.
- **P975 the apology's footprint (MUST):** `apology:true` damps
  offense retrigger affect ~`apology_damp` while record
  strength/content persist (apology_eraser_null); `partial:true`
  below `apology_sincerity_gate` worsens retrigger
  (backfire). FAIL on content loss or unconditional damp.
- **P976 everyone agrees with me (MUST):** unwitnessed
  `stance_est` projects own position at `fc_k`; witnessed
  dissent overwrites at `fc_expose_gain` and may mint a
  mismatch record; no assumed-agreement record exists
  (fc_consent_null). FAIL on minted consent or zero
  projection.
- **P977 the chameleon's halo (SHOULD):** repeated `mimic:true`
  events raise receiver eval to `mimic_cap`; `mimic_detected`
  reverses at `mimic_detect_pen`; credibility/knowsTopics
  untouched (mimic_recipient_null); high-`mimic` trait
  characters emit more flags.
- **P978 the vocal minority writes the norm (SHOULD):** two
  repeated loud `norm_expr` events shift a character's
  NormModel toward the expressed position even when the
  sampled majority privately dissents (norm_truth_null);
  confidence bleeds past `norm_check_tau`.
- **P979 whose idea (SHOULD):** delayed retrieval of
  `joint_decision` records self-attributes at `idea_self_bias`
  above chance; pooled records lose `proposed_by` at
  `idea_pool_p`; no verbatim resolution exists
  (idea_verbatim_null); `claimed_mine` audits fire.
- **P980 the second-chance discount (MUST — direction-lock):**
  post-breach credibility recovers toward
  `1 − breach_floor`, never baseline, via apology alone
  (trust_full_null); sincere apology on competence breach cuts
  floor ~`apology_floor_cut`. FAIL on full reset or zero
  recovery.
- **P981 divergence (MUST — composite):** two profiles
  differing only on `mimic`/`suggs` show different eval
  accrual from mirrored partners AND different NormModel
  drift — the same room writes different books.

Registry: P1–P981. v92 suite: P970–P973, P975, P976, P980,
P981 MUST; P974, P977–P979 SHOULD.

## 189. Sources verified this version (P970–P981 backing)

- **Conversational memory:** Stafford & Daly 1984
  (*Communication Monographs* 51:379 — ~10% idea units at one
  month, conversational highlights + gist); Keenan, MacWhinney
  & Mayhew 1977 (interaction-content advantage); Hjelmquist
  1984; Hjelmquist & Gidlund 1985 (poor verbatim, preserved
  gist); Goldsmith & Baxter 1996 (event-organized everyday
  remembering).
- **Tie decay:** Roberts & Dunbar 2011 (*Social Networks*
  33:138 — closeness tracks contact); Sutcliffe, Dunbar,
  Binder & Arrow 2012 (*Psychol. Sci.* — layered structure);
  Burt 2000 (*Am. J. Sociol.* 106:347 — tie decay functions);
  Hill & Dunbar 2003 (kin persistence); Saramäki et al. 2014.
- **Perceived networks:** Krackhardt 1987 (*Admin. Sci. Q.*
  32:109); Krackhardt 1990 (*Soc. Networks* 12:239); Freeman
  1992; Kumbasar, Rommey & Batchelder 1994 (*Am. J. Sociol.*
  100:477 — recency/transitivity biases).
- **Expression/face:** Baudouin, Gilibert, Sansone &
  Tiberghien 2000 (*Br. J. Psychol.* 91:543 — smile
  advantage); D'Argembeau et al. 2003; Öhman, Lundqvist &
  Esteves 2001 (faces-in-crowd — attention without
  recognition gain).
- **Apology:** Darby & Schlenker 1982; Ohbuchi, Kameda &
  Agarie 1989 (*JPSP* 56:919 — anger/aggression reduction);
  Scher & Darley 1997 (*JESP* 33:509 — partial-apology
  backfire); Bennett & Earwaker 1994.
- **False consensus:** Ross, Greene & House 1977 (*JESP*
  13:279); Marks & Miller 1987 (*Psychol. Bull.* 102:72 —
  meta-analytic robustness); Dawes (consensus judgments).
- **Mimicry:** Chartrand & Bargh 1999 (*JPSP* 76:893 —
  chameleon effect); Lakin & Chartrand 2003 (*Psychol. Sci.*
  14:334 — mimicry→liking); van Baaren et al. 2004
  (prosociality/tips); Chartrand & Dalton 2009.
- **Norms:** Prentice & Miller 1993 (*JPSP* 64:243 —
  pluralistic ignorance); Blanton & Christie 2003 (*Rev. Gen.
  Psychol.* 7:261 — deviant regulation).
- **Contribution attribution:** Ross & Sicoly 1979 (*JPSP*
  37:322 — overclaim, married-couple >100% sums).
- **Trust repair:** Schweitzer, Hershey & Bradlow 2006
  (*Organ. Behav. Hum. Decis.* 101:1 — partial recovery);
  Kim, Ferrin, Cooper & Dirks 2004 (*JAP* 89:104 —
  violation-type contingent repair); Tomlinson, Dineen &
  Lewicki 2004.

## 190. v93 suite (P982–P993) — formal-model IX

Probes for the cold-start, intervention-calculus, and
population-prior layer: synthesized pasts graded like lived
ones, do() as the only mutation path, paired-arm variance
discipline, and the cast graded as a population sample.
Locked nulls probe-enforced.

- **P982 cold-start indistinguishability (MUST):** corpus
  age-conditional anchors run on a replay-synthesized 70yo
  S₀ vs a genuinely-lived 70yo store — same anchor verdicts,
  era-density histograms within chi-square band;
  `anchor_keep` anchors retrievable at a₀.
- **P983 the past respects the bible (MUST — locked
  null):** fuzz 10³ bible sets; every synth record's
  canon-checkable fields consistent with declared facts;
  `bible_contradict_null = 0`.
- **P984 the invisible seam (MUST — locked null):** toggle
  `synth` on paired identical stores under CRN; all three
  observable channels + emitted content identical;
  `synth_mark_null = 0`.
- **P985 the past mints no history (MUST — locked
  null):** cold start writes zero canonical ledger rows,
  zero canonical RelEdges, zero other-character state;
  `past_fact_null = 0`.
- **P986 synth passes the age anchors (SHOULD):**
  synthesized pasts satisfy A05 (earliest-memory age
  [3.0,4.2]) and A06 (bump mass decades 2–3 > 4–6) on both
  routes — replay emergently, density by construction.
- **P987 paired arms or nothing (MUST — locked null):**
  comparative-probe manifests share one seed; the do() site
  is the sole divergence; `crn_paired_null = 0`; realized
  arm covariance reported; `crn_broken` flagged.
- **P988 declared interventions only (MUST — process):**
  probe scripts mutate state only via `do_ops`;
  `do(setParam)` on locked nulls refuses; `setState` marks
  the run `synthetic`, excluded from corpus grading.
- **P989 intervention locality (SHOULD):**
  `do(setTrait, A, …)` under CRN leaves other characters'
  stores bit-identical — §39 boundary holds under
  intervention.
- **P990 prior recovery (SHOULD):** hierarchical fit on
  population synthetic data recovers `pop_table_ver`
  moments; per-char posteriors moved exactly `pool_k` of
  pop-mean→MLE distance.
- **P991 ambient determinism (MUST):** same
  `charId:bibleHash` → same archetype + residuals across
  rebuilds; residuals ≤ `(1−pool_k_ambient)`·clamp; no drift
  on bible-unchanged rebuild.
- **P992 the cast is a plausible sample (SHOULD):** the 8
  mains' trait vectors inside the population ellipsoid;
  declared Σ_pop correlations approximately present;
  out-of-support vector = fitting bug.
- **P993 cold-start budget (OBSERVE):** report replay
  wall-clock/record counts vs the §64 corpus budget —
  publish, don't gate.

Registry: P1–P993. v93 suite: P982–P985, P987, P988, P991
MUST (incl. locked-null probes P983–P985, P987); P986,
P989, P990, P992 SHOULD; P993 OBSERVE.

## 191. Sources verified this version (P982–P993 backing)

- **Cold start / autobiographical structure:** Bartlett 1932
  (reconstruction is the memory); Conway & Pleydell-Pearce
  2000 (*Psych Rev* 107:261 — self-memory system, lifetime
  periods vs event-specific knowledge); Neisser 1981 (John
  Dean testimony — confident gist-built recall); Linton
  1982 (diary — most of life leaves no trace); Brewer 1988
  (randomly-sampled events — mundane dominates); Wagenaar
  1986 (*Cognitive Psychol.* 18:225 — own-diary cue
  asymmetries); Bahrick 1984 (permastore); Johnson,
  Hashtroudi & Lindsay 1993 (*Psychol. Bull.* 114:3 —
  source monitoring cannot separate lived from
  reconstructed); Nelson & Fivush 2004 + Tustin & Hayne
  2010 (earliest-memory ages); Rubin & Schulkind 1997
  (bump); Berntsen & Rubin 2004 (life script).
- **Interventions / paired-run methodology:** Pearl 2009
  (do-operator — notational borrowing only, no causal-
  inference claim); Law 2015 (*Simulation Modeling and
  Analysis* — common random numbers, variance reduction);
  Glasserman & Yao 1992 (CRN correlation conditions).
- **Population prior / pooling:** Efron & Morris 1977
  (*JASA* 72:311 — Stein shrinkage); Gelman & Hill 2007
  (partial pooling discipline); Gudjonsson 2003
  (suggestibility–compliance dissociation → trait
  covariance); Unsworth 2019 (*Why Human Memory Fails* —
  individual-difference moments).

## 192. v94 suite (P994–P1005) — social-memory X (the metaself)

The metaself layer's probes: 4 MUST (three locked-null, one
directional), 7 SHOULD, 1 OBSERVE. All comparative probes
pair arms under CRN per v93's `crn_paired_null` discipline.

- **P994 meta_mindread_null (MUST — locked-null):**
  do(setState) perturbs alter's canonical RelEdge AND the
  alter's PersonModel-of-ego with zero observable signal
  events; every MetaModel field bit-identical pre/post. Any
  diff = the metaself read a mind. This is the layer's load-
  bearing wall: the metaself may be wrong, never informed.
- **P995 liking-gap direction (MUST):** new-acquaintance
  dyads, matched warm signal diets: mean(est_like −
  true_like) < 0 pooled across the 8 mains (Boothby 2018).
- **P996 gap attenuates with depth (MUST):** gap magnitude
  vs tie_depth/evidence_n monotone-decreasing across
  cohorts; still ≥ 0 at 90-day ties in high-`lgap_k`
  profiles (dorm-mates arm — persists, doesn't vanish).
- **P997 projection dominance (SHOULD):** do(setTrait,
  self_est ±) moves est_like same-direction under thin
  evidence (evidence_n < meta_ev_min) at r ≈ meta_proj;
  effect shrinks as evidence accrues (Kenny & DePaulo .87
  as asymptote, not constant).
- **P998 reciprocity arm (SHOULD):** manipulating own_like
  moves est_like ∝ meta_recip independent of signals; alter
  stores untouched (companion check to P994 —
  recip_truth_null).
- **P999 compete channel is blind (SHOULD):** dyads with
  hidden competitive-edge variance: est_traits.compete
  meta-accuracy within `compete_blind` band of 0 while
  est_like accuracy > 0 — the Eisenkraft 2017 dissociation,
  enforced for EVERY profile (no rivalry detector exists).
- **P1000 meta_episode_null (MUST — locked-null):**
  MetaModel create/update/stale mints zero records; record
  census identical layer-on vs layer-off under CRN.
- **P1001 negative-signal weighting (SHOULD):** symmetric
  diets (N warm + 1 cold vs N cold + 1 warm): single cold
  moves est_like ≈ meta_neg_w× the single warm; slope
  ×(1+rumin) present.
- **P1002 beautiful-mess asymmetry (SHOULD):** identical
  `vulnerable:true` event: actor-side update discounted vs
  matched non-vulnerable warm event; observer-side
  PersonModel eval updated positive — signs opposite
  (bmess_invert_null checked alongside).
- **P1003 staleness, not decay (SHOULD):** after
  meta_stale_days with no retrieved signals, metaView
  returns stale:true with est_like bit-unchanged; next
  retrieved signal clears the flag and resumes §6.218
  integration. A decaying est would be projection
  manufacturing evidence — flagged as a regression.
- **P1004 lgap_reverse_null (MUST — locked-null):** across
  all mains + ambient archetype draws under CRN, no
  profile yields mean gap < 0.
- **P1005 cast spread (OBSERVE):** identical
  new-acquaintance signal diet → publish per-main est_like
  trajectories; expected ordering Jules lowest, Victor
  flattest, Priya highest meta-accuracy. Report, don't
  gate.

Registry: P1–P1005. v94 suite: P994, P995, P996, P1000,
P1004 MUST (incl. locked-null probes P994, P1000, P1004);
P997, P998, P999, P1001, P1002, P1003 SHOULD; P1005
OBSERVE.

## 193. Sources verified this version (P994–P1005 backing)

- **Metaperception accuracy:** Kenny & DePaulo 1993
  (*Psychol Bull* 114:145 — verified): SRM meta of 8
  studies; self→meta r ≈ .87; generalized meta-accuracy
  ≈ .51, dyadic near 0 in strangers; cross-target
  consistency overestimated.
- **Reciprocity / channel specificity:** Elfenbein,
  Eisenkraft & Ding 2009 (*Psychol Sci* 20:1081 —
  verified): dyadic meta-accuracy for being valued runs
  through reciprocity of liking; Eisenkraft, Elfenbein &
  Kopelman 2017 (*Psychol Sci* 28:233 — verified): liking
  channel accurate, competition channel blind.
- **The liking gap:** Boothby, Cooney, Sandstrom & Clark
  2018 (*Psychol Sci* 29:1742 — verified): 5 studies;
  systematic underestimate of being liked; persists
  months in dorm-mates, attenuates with relationship
  development; mechanism = self-focused audit of own
  performance.
- **Vulnerability asymmetry:** Bruk, Scholl & Bless 2018
  (*JPSP* 115:192 — verified): 7 studies; self-other
  evaluation asymmetry on vulnerability displays;
  construal-level account.
- **Trait mechanism (reused):** Clark & Wells 1995 —
  self-focused attention in social anxiety grounds
  `lgap_k`'s trait loading; diag_moral_neg (SM§2) bounds
  `meta_neg_w` below moral-diagnosticity weight.

## 194. Coverage & mutation — the battery audits its own blind spots (VA-COVER) (new in v95)

The registry passed P1005 without ever asking a simpler question:
which parameters and contract functions does NO probe touch? A probe
battery's silent regions are where regressions breed. Two instruments:

- **The coverage map.** Every §7 param and every §10 contract
  function declares, at probe-registration, which probes exercise it
  (the probe's `touched` set — assembled statically: each probe lists
  the params it perturbs or reads through the §10 surface). `probeCover`
  returns `{uncovered_params, uncovered_fns, thin_params}` where thin
  = touched by exactly one SHOULD probe (single-instrument risk).
  Gate: uncovered gated params = 0 (`cover_min`); thin params must
  shrink monotonically across versions — never grow. An exemption
  must be declared at registration with a reason (`cover_exempt_null`
  — no silent orphans; an exempt param carries `cover_why` in the
  registry row). This is the coverage criterion mutation testing
  imposes on test suites (Jia & Harman 2011, *IEEE TSE* 37:649 —
  verified survey): a suite is only as good as the mutants it kills.
- **Mutation falsifiability.** The cheap way to find probes that
  couldn't fail: inject single-param mutants — clamp each gated param
  to its declared bound, one at a time — and count which probe
  families' verdicts flip. Every gated param belongs to a declared
  `detect_set` (the family that owns it); a mutant inside its detect
  set escaping ALL probes is a coverage hole, not a finding.
  `mut_escape_max` bounds tolerated escape fraction per release
  (default 0.15: the battery may miss deliberately redundant params,
  but not 1-in-7). Post-hoc whitelisting an escaped mutant is
  `mut_whitelist_null` — escapes are fixed by adding probes or
  shrinking the param's claimed role, never by amnesty.
- **Why mutations over review.** Manual "is this param tested?"
  review fails under registry scale (1000+ probes, ~300 params).
  Mutation score is mechanical, replayable, and — crucially —
  tests the TESTS the way P881's peeper tests the verdicts:
  a probe that survives every relevant mutant was decorative.
- **Sloppiness caveat (reused from §140/§166).** Some params are
  individually inert on every output yet load-bearing jointly;
  mutation runs at the detect-set granularity, not per-probe, so a
  param killed by NO single probe but jointly constrained still
  counts as covered — the hole metric is family-level escape, not
  per-probe kill rate. Never interpret a low individual kill count
  as grounds to delete the param (`screen_drop_null` doctrine).

## 195. Simulation-based calibration of the refit path (VA-SBC) (new in v95)

The corpus-refit tooling (anchor fitting, `calibrateParam`-style
sweeps) is itself inference machinery, and inference machinery
lies quietly. The standard audit for a fitting procedure is
simulation-based calibration: draw true params θ* from the profile
prior, generate synthetic telemetry under them, run the refit,
and check that θ* falls inside the refit's claimed band at the
claimed rate. Talts, Betancourt, Simpson, Vehtari & Gelman
(2020, *Bayesian Analysis* 15:1257 — verified) reduce this to a
rank statistic: over `sbc_draws` replications, the rank of θ*
within the refit's ensemble must be UNIFORM on
{0,…,`sbc_bins`}; under-coverage shows a U shape, over-coverage
an arch, bias a tilt. Uniformity is tested by the empirical CDF
against the simultaneous band the paper derives (χ² on binned
ranks is the coarser fallback).

- RW instantiation: θ* draws come from `deriveParams` over a
  mixed cohort (v93's population prior, so the test uses the same
  prior the refit claims to invert). Telemetry = the probe
  battery's OWN outputs under θ* — this calibrates the anchor-
  fitting path, not the psychology. If the refit cannot recover
  parameters it generated itself, its claims about human anchors
  are noise.
- Ground truth caveat: SBC certifies self-consistency (Cook,
  Gelman & Rubin 2006, *J Comput Graph Stat* 15:675 — verified
  precursor; the same idea for validating simulation software
  via posterior replicates). A self-consistent fit can still be
  wrong about humans — that gap is what §14.2 anchor grades and
  the §196 metamorphic layer cover. Three orthogonal audits:
  mechanism (SBC), phenomenon (anchors), invariants (MRs).
- `anchor_pointfit_null`: the refit must fit anchor BANDS
  (§14.2 `rep_grade` + `rep_shrink`), never point estimates —
  a point fit inherits the literature's optimism bias as if it
  were measurement precision (OSC 2015 below). Fitting code
  that minimizes distance to the band midpoint rather than
  membership in the band is a boundary violation.

## 196. Metamorphic relations — anchor-free behavioral law (VA-METAM) (new in v95)

Anchors tell the model what humans do in specific paradigms;
metamorphic relations tell it what NO coherent memory may do in
ANY paradigm — the difference between fitting a curve and
respecting physics. Metamorphic testing (Chen et al. 1998,
*IEEE Softw* 15:20 — verified original; Chen, Kuo, Liu, Poon,
Towey, Tse & Zhou 2018, *ACM Comput Surv* 51:4 — verified
survey) handles exactly our oracle problem: for most inputs the
correct output is unknown (no human dataset exists for "Jules
recalls this exact event"), but RELATIONS between outputs are
known. `mrCheck` runs the relation table continuously — MRs
are harness-side laws, not probes with families and FDR.

| MR | relation | basis |
|---|---|---|
| MR1 cue monotonicity | adding a matching cue (place/person/time) never decreases P(retrieval) | cue-overload theory, Tulving & Thomson 1973 encoding specificity — CONSENSUS direction |
| MR2 delay monotonicity | ceteris paribus, longer retention interval ⇒ non-increasing recall prob | every forgetting law since Ebbinghaus 1885 — CONSENSUS |
| MR3 interference direction | more same-category neighbors ⇒ non-increasing target recall at fixed cue | post-1940 interference theory consolidation (§FC) — CONSENSUS direction |
| MR4 arousal band | moderate-arousal events recall ≥ neutral AND ≥ extreme-arousal at long delays | Yerkes–Dodson family (qualitative only — DEBATED in shape, CONSENSUS that extremes differ) |
| MR5 repetition order | nth retelling never lowers record's retrieval prob vs matched unretold | testing effect, Roediger & Karpicke 2006 — CONSENSUS |
| MR6 semantic robustness | age↑ ⇒ episodic recall ↓ more than semantic familiarity ↓ | Park et al. 2002 lifespan gradient — CONSENSUS direction |
| MR7 trait ordering | rumination↑ ⇒ negative-event recall prob ≥ positive-event at long lag | ruminative rehearsal literature — direction CONSENSUS, size HYPOTHESIS |
| MR8 recognition ≥ recall | same record: recognition-mode hit rate ≥ recall-mode | recognition-recall gap — CONSENSUS (Tulving & Thomson 1973; Brown 1976) |

Rules: MRs must hold for EVERY profile — including trait-extreme
pins — because they encode direction, not magnitude. A magnitude
version of any MR is a probe, not an MR. **Tightness audit:** the
table is only meaningful if it can fail — a deliberately inverted
build (flip each operator's direction in turn) must trip ≥
`mr_detect_min` of the relations; an MR no inversion ever trips is
vacuous and flagged. `mr_detect_min`=0.8 allows slack for MRs an
implementation genuinely can't violate (e.g., MR8 if recognition
reuses the recall path).

## 197. Live invariants & versioned regression — validation in production (VA-LIVE) (new in v95)

The battery gates releases; it does not watch the world run. Two
final instruments extend validation past the lab:

- **Canary invariants.** A subset of locked-null checks runs
  continuously on live ticks: modLedger append-only monotonicity,
  snapshot round-trip spot checks, the §12.3 tier boundary
  (hidden fields never crossing into emission text — checked on a
  sampled emission stream, `live_emit_frac`). Cost class: O(1) per
  tick. Any trip ⇒ `liveMon` raises BLOCK + freezes the run's
  verdict ledger; the world continues (research only, per standing
  order) but its data is quarantined. Detection latency bounded:
  an injected violation must surface within `live_detect_ticks`.
  `live_off_null`: a release build with monitors compiled out is a
  BLOCK verdict, full stop — monitoring is not optional equipment.
- **Drift watch.** Live emission statistics (recall rates,
  emotional-valence mix, pass fractions) accumulate into the same
  e-processes as §14.5b — an alarm fires the moment the running
  product crosses 1/`eval_alpha`, WITHOUT waiting for the next
  corpusRun. This is Page's CUSUM idea re-founded on e-values
  (Page 1954, *Biometrika* 41:100 — verified origin of sequential
  change detection; Howard et al. 2021 supplies the anytime-valid
  form). Alarm ≠ verdict: drift watch suspends release pending a
  fixed-n confirmation; it never convicts on its own.
- **Golden regression.** A pinned-seed corpus slice (n=8 mains,
  30 world-days, fixed event tape) emits a canonical transcript
  digest per release; `goldDiff` compares within `gold_tol`
  (per-emission-field L∞ on rates). A diff outside tolerance with
  specVersion unchanged = implementation regression; with
  specVersion bumped = expected, and the re-baseline must be
  logged in the verdict ledger as a `rebaseline` row with reason —
  silent re-baselines are the `family_edit_null` of regression
  testing. Golden digests never assert psychology — they assert
  REPRODUCIBILITY; the two are kept separate so a correct-but-
  changed model fails gold, not P-probes.

## 198. v95 suite (P1006–P1016) — validation-design X (the battery's blind spots)

Three MUST + one locked-null-class MUST, five SHOULD, two OBSERVE.
All are harness/property probes; zero psychology moved.

- **P1006 coverage completeness (MUST — process):** `probeCover`
  reports zero uncovered gated params/fns; thin-param count ≤
  prior version's; every exempt param carries `cover_why`.
  `cover_exempt_null` checked alongside.
- **P1007 mutation falsifiability (MUST):** single-param bound-
  clamp mutants across the gated set: family-level escape fraction
  ≤ `mut_escape_max`; every escape logged with its detect_set.
  Basis: Jia & Harman 2011.
- **P1008 SBC rank uniformity (MUST):** `sbc_draws` refit
  replications on synthetic truth; rank histogram inside the
  Talts-2020 simultaneous band for every §63-pinned param;
  U/arch/tilt flagged per param. Basis: Talts et al. 2020;
  Cook, Gelman & Rubin 2006.
- **P1009 metamorphic suite holds (MUST):** all 8 MRs pass on B3
  across every archetype × trait-extreme pin grid; a violation is
  never FDR'd — MRs are laws, one failure = FAIL.
- **P1010 MR tightness (SHOULD):** per-operator inverted builds
  trip ≥ `mr_detect_min` of MRs each; vacuous MRs reported.
- **P1011 anchor-shrink direction (SHOULD):** SINGLE-grade
  anchors post-`rep_shrink` demand systematically smaller effects
  than their published point estimates; a model fit only on
  META/RRR rows misses ≥1 shrunk SINGLE band. Basis: OSC 2015
  (replication effects ≈ ½ original).
- **P1012 band-not-point fitting (SHOULD — locked-null
  companion):** inject a refit that minimizes distance to band
  midpoints; `anchor_pointfit_null` fires; coverage of claimed
  bands stays nominal only under band-membership loss.
- **P1013 live canary latency (MUST — locked-null class):**
  injected tier-boundary violation on a live emission stream
  surfaces within `live_detect_ticks`; clean 30-day runs trip
  zero canaries. `live_off_null` verified by attempting a
  monitors-off release build → BLOCK.
- **P1014 drift alarm precedence (SHOULD):** scripted regime
  shift (valence mix ×2) trips the e-process alarm before the
  next scheduled fixed-n verdict in ≥90% of replications; no
  alarm on unshifted runs beyond `eval_alpha` rate.
- **P1015 golden regression honesty (SHOULD — process):**
  unchanged specVersion + perturbed implementation ⇒ `goldDiff`
  outside `gold_tol`; bumped specVersion ⇒ re-baseline requires
  a ledger `rebaseline` row; absent row = violation.
- **P1016 coverage trend (OBSERVE):** publish per-version
  thin-param + escape-fraction trajectories; expect thin→0 as
  families accumulate. Report, don't gate.

Registry: P1–P1016. v95 suite: P1006, P1007, P1008, P1009, P1013
MUST (P1013 locked-null class; P1012 SHOULD companion to
`anchor_pointfit_null`); P1010, P1011, P1014, P1015 SHOULD;
P1016 OBSERVE.

## 199. Sources verified this version (P1006–P1016 backing)

- **Mutation testing:** Jia & Harman 2011 (*IEEE TSE* 37:649 —
  verified survey): mutant kill/escape as the measure of suite
  adequacy; equivalent-mutant problem acknowledged — RW's
  detect-set design sidesteps it by measuring family-level
  escape, never per-mutant.
- **Simulation-based calibration:** Talts, Betancourt, Simpson,
  Vehtari & Gelman 2020 (*Bayesian Analysis* 15:1257 —
  verified): rank-uniformity theorem for correct posterior
  software; U/arch/tilt diagnostics. Precursor: Cook, Gelman &
  Rubin 2006 (*J Comput Graph Stat* 15:675 — verified):
  validating Bayesian software by replicating from the prior.
- **Metamorphic testing:** Chen et al. 1998 (*IEEE Softw*
  15:20 — verified) original MR formulation; Chen, Kuo, Liu,
  Poon, Towey, Tse & Zhou 2018 (*ACM Comput Surv* 51:4 —
  verified): MR construction/tightness practice — an MR that
  cannot fail is vacuous.
- **Replication shrinkage:** Open Science Collaboration 2015
  (*Science* 349:aac4716 — verified): 100 studies, 97→36%
  significant on replication, mean effect ≈ ½ original —
  grounds `rep_shrink` direction (P1011) and band-not-point
  doctrine. Klein et al. 2014 Many Labs (*Soc Psychol* 45:142
  — verified): cross-site variance motivates precision-weighted
  bands.
- **Sequential change detection:** Page 1954 (*Biometrika*
  41:100 — verified): CUSUM; anytime-valid successor =
  e-process monitoring (Howard et al. 2021, reused).
- **V&V framing (background):** Oberkampf & Trucano 2002
  (*Prog Aerospace Sci* 38:209 — verified): verification
  (solves the equations right = L0/SBC/golden) vs validation
  (solves the right equations = anchors/MRs/believability) —
  the §1 level table is this distinction operationalized.
- **RW HYPOTHESES marked:** `mut_escape_max`=0.15 tolerance
  (no literature fixes a suite-adequacy threshold for
  simulation batteries); `mr_detect_min`=0.8 (tightness floor
  ours); gold_tol 0.02 (regression tolerance ours, sized to
  seed-noise floor); live canary latency 500 ticks (ops
  choice). All probe-gated, none claimed as science.

## 200. v96 suite (P1017–P1026) — encoding-mechanics VIII

- **P1017 intrinsic memorability (MUST):** at matched attention,
  arousal, and distinctiveness, high-memorab events out-recall
  low; inter-profile variance on this leg is LOW (Isola
  consistency — variance audit, not just mean); `memorab_attr_null`
  TOST (residual-free build fails); no β interaction.
  `touched:[memorab_gain, memorab_resid]`, `detect_set:
  {memorab_gain∈{0,0.4}, memorab_resid∈{0.2,0.6}}`.
- **P1018 co-attention (MUST):** coAttending≥1 > solo at matched
  exposure/attention; stranger arm gated by `coattend_ingroup`;
  `coattend_expose_null` — unattended fields gain nothing.
  `touched:[coattend_gain, coattend_ingroup]`.
- **P1019 co-seen substrate (SHOULD):** coSeen edges feed the
  §6.204 rumor pass — co-attended events propagate to the
  co-attender with higher initial credibility (shared witness,
  not shared telling).
- **P1020 prediction error (MUST — structure):** moderate PE
  raises link strength with item-E unchanged
  (`pe_conflate_null` TOST); pe > pe_win splits a new record;
  sparse-schema ×1.4 arm (Brod direction).
  `touched:[pe_gain, pe_win]`.
- **P1021 anticipation window (MUST):** boost inside antic_win
  only; `antic_retro_null` — pre-cue events never boosted;
  multiplicative composition with value_select (anticipated-
  but-worthless keeps the anticipation leg only).
  `touched:[antic_gain, antic_win]`.
- **P1022 offloading boundary (MUST):** offload:true takes the
  v3.5 hollow+pointer profile unchanged (regression);
  offloadTransient:true takes NO offload_cost
  (`offload_noexp_null` TOST — Henkel deletion arm);
  device_dep orders adoption across profiles (capture-count
  divergence, not per-event E).
- **P1023 gesture (SHOULD):** gestured > silent-watch < enacted
  (ordering); gest_iconic_w=0 → gain ≤0.03 (`gest_beat_null`
  TOST); gestured+spoken caps at enacted level (motor budget).
  `touched:[gest_gain, gest_iconic_w]`.
- **P1024 TOT ledger (MUST):** unresolved TOTs recur ≥1.5×
  after long dwell (Warriner 2008); self-resolved recur ≤
  baseline (`tot_res_gain` repair); told-answers do NOT repair
  (`tot_rescue_null`); error learning durable ≥7 sim-days.
  `touched:[tot_learn, tot_res_gain, err_strength]`.
- **P1025 labor in vain (MUST — locked-null class):** dwell/
  effort-flag manipulations at fixed strategy give ΔE ≤ 0.02
  (TOST); only named levers may raise E — regression wall for
  future "try harder" params.
- **P1026 phone drain (OBSERVE):** phone_present reduces
  effective encoding per `phone_drain`·(0.5 + device_dep);
  direction-only, no band — observe pending replication.

Registry: P1–P1026. v96 suite: P1017, P1018, P1020, P1021,
P1022, P1024, P1025 MUST (P1025 locked-null class); P1019,
P1023 SHOULD; P1026 OBSERVE.

## 201. Sources verified this version (P1017–P1026 backing)

- **Intrinsic memorability:** Isola, Parikh, Torralba & Oliva
  2011 (verified: cross-observer consistency ρ≈0.7);
  Bainbridge, Isola & Oliva 2013; Bainbridge, Dilks & Oliva
  2017 (*NeuroImage* — verified: residual after attribute
  controls); Khosla et al. 2015; Rust & Mehrpour 2020.
- **Co-attention:** Shteynberg 2010 (JPSP — verified);
  Eskenazi, Doerrfeld, Logan, Knoblich & Sebanz 2013
  (verified: believed co-attention suffices); Shteynberg 2015
  (*Perspect. Psychol. Sci.* 10:579 — verified); minimal-
  conditions registered replication open (marks the
  `coattend_ingroup` gate DEBATED — not a law).
- **Prediction error:** Greve, Cooper, Kaula, Anderson &
  Henson 2017 (*NeuroImage* — verified: associative locus);
  Quent, Henson & Greve 2021 (verified: formal account +
  connectable-mismatch bound); Brod, Werkle-Bergner & Shing
  2013 (child arm — verified).
- **Anticipation:** Adcock, Thangavel, Whitfield-Gabrieli,
  Knutson & Gabrieli 2006 (*Neuron* 50:507 — verified);
  Wittmann et al. 2005 (verified); Murty & Adcock 2014
  (verified: window specificity).
- **Gesture:** Cook, Duffy & Fenn 2013 (*Psychol. Sci.*
  24:1734 — verified); So, Sim Chen-Hsing & Low Shuang 2012
  (verified); Goldin-Meadow thread (WM-lightening direction —
  verified).
- **Offloading boundary:** Henkel 2014 (*Psychol. Sci.* 25:396
  — verified: impairment requires expected persistence;
  zoom/deletion arms); Risko & Gilbert 2016 (*Trends Cogn.
  Sci.* — verified: rational allocation); Sparrow, Liu &
  Wegner 2011 (*Science* 333:776 — reused: the v3.5 channel
  this gates).
- **TOT learning:** Warriner & Humphreys 2008 (*QJEP* —
  verified: ~2× recurrence after longer dwell); D'Angelo &
  Humphreys 2015 (*Cognition* 142:166–190 — verified: one-week
  durability; self-resolution and orthographic-cue resolution
  correct; told-answer arm; effort-required).
- **Labor in vain:** Nelson & Leonesio 1988 (*Am. Psychol.* 43
  — verified); Hyde & Jenkins 1973 (reused); Cuevas & Dawson
  2018 (effort → JOL not memory — verified direction).
- **Phone drain:** Ward, Duke, Gneezy & Bos 2017 (*J. Assoc.
  Consumer Res.* — verified: mere-presence drain, device-
  dependence moderator; replication record mixed → OBSERVE).
- **RW HYPOTHESES marked:** memorab residual weighting 0.35
  (Bainbridge's unexplained share, our split); coattend_ingroup
  default 0.5 (open gate, not evidence); pe_win 0.6 (our
  connectability bound — Quent gives the shape, not the
  number); antic_win 0.01 days (Murty's "narrow window," our
  seconds→sim-days mapping); err_strength ledger form (the
  recurrence/durability facts are literature; the ledger
  mechanics are ours); device_dep default 0.5 (Ward's
  moderator direction, our scale).

## 202. v97 suite (P1027–P1034) — forgetting-curves IX

- **P1027 CTA mint + novelty (MUST):** a somatic
  `illness_onset` with one novel and one familiar food
  in `cta_window` averts to the novel food ≥70% of runs;
  the mint ignores `att_min` (one-trial, associative).
- **P1028 avoidance outlives episode (SHOULD):** after
  the `aversion` record archives, the `avoid` tag still
  drives rejection behavior; no narrative content is
  recoverable (cta_birth_null leg — output-scanned).
- **P1029 somatic gate (MUST — locked-null class):**
  non-GI illness onsets (dizziness, injury) bind zero
  food records across all profiles (cta_somatic_null).
- **P1030 series edges (MUST):** in a 4-instance
  repeated-event series, boundary-instance detail
  accuracy > middle at short delay (last-dominant) and
  at long delay (first-dominant) — the crossover must
  be produced by the decay itself (frozen
  series_edge_leg="first-only"); misattributions land
  on adjacent instances ≥2× as often as distant ones.
- **P1031 recency-from-strength (SHOULD):** a rehearsed
  90d-old record and an unrehearsed 7d-old record at
  equal residual R produce recency estimates within
  noise of each other; the emission is hedged and
  `verbatim.when` is untouched (rec_verbatim_null).
- **P1032 flat forecast (MUST — locked-null class):**
  `jol` across a 1d/30d/180d horizon sweep is flat
  within `jol_horizon_w` while hit-rate declines;
  `jol_bias` drift under repeated archival exposure
  stays ≤ `jol_exp_gain` per exposure (jol_exper_null).
- **P1033 mislaid-item emergence (SHOULD):** after 3
  relocations of one item, recall returns the latest
  location > earlier ones, and on failure the emitted
  guess is the §4.20 script-node location, not uniform.
- **P1034 trough emergence (SHOULD):** a 70yo profile's
  era distribution dips below power-interpolation at
  encodeAge 30–50; with firsts density held uniform the
  dip must collapse ≥75% — else adopt `trough_gain`.

Registry: P1–P1034. v97 suite: P1027, P1029, P1030,
P1032 MUST (P1029, P1032 locked-null class); P1028,
P1031, P1033, P1034 SHOULD.

## 203. Sources verified this version (P1027–P1034 backing)

- **Conditioned taste aversion:** Garcia & Koelling 1966
  (long-delay CS–US canonical); Bernstein & Webster 1980
  (*Physiol. Behav.* 25:363 — verified one-trial adult
  aversion); Bernstein 1978 (*Science* 200:1302 —
  verified scapegoat arm, children); Logue, Ophir &
  Strauss 1981 (*Behav. Res. Ther.* — verified: most
  adults carry ≥1 aversion, persisting years); Scalera
  2002. Human duration genuinely variable — clinical
  chemo aversions often remit in months → `cta_beta`
  mid-range, `avoid` tag carries the durable product.
- **Series edges:** Dilevski, Paterson et al. 2021
  (*JARMAC* — verified: first/last accuracy > middle,
  cross-instance confusion widespread); Danby, Sharman
  & Paterson 2022 (*Mem. & Cogn.* — verified
  proximity-graded misattribution, boundary anchors);
  Deck et al. 2021 (*Memory* — verified delay-ordered
  crossover: last-dominant ≤1wk, first-dominant 3wk);
  Connolly et al. 2016 (child arm — verified).
- **Recency by strength:** Hintzman 2004 (*Mem. &
  Cogn.* — verified strength–recency regularity);
  Hintzman 2010; Brown, Rips & Shevell 1985 (inference
  route for public events); Friedman 1993 (reused:
  date reconstruction is inference-heavy).
- **Stability bias:** Koriat, Bjork, Sheffer & Bar 2004
  (*PNAS* 101:1100 — verified interval-insensitive JOL);
  Kornell & Bjork 2009 (*JEP:LMC* — verified survives
  practice); Rhodes & Tauber 2011 (meta — verified).
- **Trough:** Rubin & Schulkind 1997 (*Mem. & Cogn.*
  25:859 — verified three-component fit); Janssen,
  Chessa & Murre (recency-removal model — verified);
  asserted EMERGENT (firsts density), `trough_gain`
  named fallback only.
- **RW HYPOTHESES marked:** `cta_avoid_hl` 730d
  (folk-duration tail — clinical data say shorter);
  `rec_scale` log-map constant (regularity real, form
  ours); `series_prox_w` 0.5 (proximity direction is
  literature, coefficient ours); `cta_spill` 0.15 (venue
  generalization unpriced in humans — conservative).

## 204. v99 probes (P1045–P1054 — age-development IX)

- **P1045 child forgetting rate (MUST):** matched-E events at
  encodeAge 5/8/12 vs adult lose strength ordered 5>8>12>adult at
  fixed retention intervals; child-era loss fits constant-rate
  better than adult power fit (ordering strict; magnitudes ±25%).
- **P1046 rehearsal ramp (MUST, locked-null class):**
  self-initiated retell count at age_now 5 ≤10% adult arm at
  matched record stats; other-initiated retells refresh ≥0.8×
  adult (`rehearse_scaffold_null`).
- **P1047 script swallow (SHOULD):** routine-instance records
  encodeAge≤7 merge ≥1.4× adult rate; deviation survival gated by
  `dev_self_gate`/arousal — two-arm structure asserted, not level.
- **P1048 developmental reversal (MUST, two-sign):** gist lure
  adoption rises encodeAge 6→adult while suggestion lures fall on
  the same battery — opposite signs or the mechanism is wrong.
- **P1049 assoc differential (MUST, locked-null class):**
  age_eff≥70 edge-field loss ≥1.4× content-field loss;
  `assoc_item_null` structure-checked.
- **P1050 positivity gate (SHOULD):** free-recall valence skew
  net-positive past 60, net-negative below 40; collapses under
  `eval_press≥0.6` and on the involuntary scan
  (`pos_involuntary_null`).
- **P1051 sleep dividend (SHOULD):** overnight consolidation
  benefit child > adult > 80yo; `sws_var_gain` widens variance
  without moving mean beyond knots.
- **P1052 transition bump (SHOULD):** `life_transition`-flagged
  era histogram peaks at transition_age+0..win; unflagged control
  flat; `immig_age` profiles peak at that age.
- **P1053 PI susceptibility (MUST):** dense competing-event
  batteries: 80yo/mid-adult R-loss ratio ≥1.3; child arm ≥1.1
  (±40%).
- **P1054 procedural floor (COULD, frozen check):** procedural
  records ≤30% of episodic loss at every knot; any age leg on
  `proc_decay_mult` FAILS.

Registry: P1–P1054. v99 suite: P1045, P1046, P1048, P1049, P1053
MUST (P1046, P1049 locked-null class); P1047, P1050, P1051,
P1052 SHOULD; P1054 COULD.

## 205. Sources verified this version (P1045–P1054 backing)

- **Child accelerated forgetting:** Bauer & Larkina 2014
  (*Memory* 22:907 — verified prospective onset: 5–7yos ≥60%
  retention, 8–9yos <40%); Bauer & Larkina 2013 (*JEP:G* 143:597 —
  verified exponential child vs power adult distribution); Bauer
  & Larkina 2016 (*Memory* — verified 4-yr prospective, all child
  groups faster, open-ended recall most).
- **Rehearsal development:** Flavell, Beach & Chinsky 1966
  (*Child Dev.* 37:283); Keeney, Cannizzo & Flavell 1967
  (production deficiency — verified); Elliott et al. 2021
  (multilab RRR — verified direction, ramp not cliff); Cowan/
  Ornstein & Naus (cumulative rehearsal ~10).
- **Script dominance:** Nelson 1986; Farrar & Goodman 1990/1992
  (schema-confirmation-deployment — verified); Fivush 1984.
- **Developmental reversal:** Brainerd, Reyna & Ceci 2008
  (*Psychol. Bull.* 134:343 — verified); Brainerd & Reyna 2007
  (complementarity — verified both-directions claim); Brainerd,
  Reyna & Forrest 2002 (DRM floor in young children); Metzger et
  al. 2008 (55-experiment synthesis).
- **Associative deficit:** Naveh-Benjamin 2000 (*JEP:LMC*
  26:1170); Old & Naveh-Benjamin 2008 (*Psychol. Aging* 23:104 —
  verified meta, 90 studies, item-vs-associative differential);
  Spencer & Raz 1995.
- **Positivity:** Mather & Carstensen 2005 (*TiCS*); Reed, Chan
  & Mikels 2014 (meta 100 studies N=7129 — verified d≈0.26,
  unconstrained-processing moderator, young negative bias);
  Murphy & Isaacowitz 2008.
- **Sleep:** Mander, Winer & Walker 2017 (*Neuron*); Mander et
  al. 2013 (*Nat. Neurosci.* — PFC→SWS→retention chain);
  Backhaus et al. 2008 (child naps — reuses §4.15).
- **Transition bump:** Schrauf & Rubin 1998 (*JML* 39:437 —
  verified bump tracks immigration age); Schrauf & Rubin 2001
  (*ACP* — verified age-grouped immigration recall); Enz,
  Pillemer & Johnson 2016 (relocation bump ~40% window share —
  verified); Berntsen & Rubin 2004.
- **PI susceptibility:** Hasher & Zacks 1988; Lustig, May &
  Hasher 2001 (*Psychol. Sci.* — verified); Ikier & Hasher 2006.
- **Procedural floor:** Fleischman et al. 2004; Gabrieli 1998.
- **RW HYPOTHESES marked:** all knot magnitudes (consensus is on
  directions/orderings/differentials — the probe suite asserts
  those, tolerances carry the honest uncertainty); `dev_self_gate`
  0.4; `gist_lure_sim` 0.6 operationalization; `trans_bump`
  generalization beyond migration/moves; `sws_var_gain` jitter
  form; `proc_decay_mult` 0.3 coefficient.

## 206. v100 probe suite (P1055–P1064, age-decline IX)

- **P1055 latency-not-loss (MUST, null-lock):** at fixed S,
  unlimited bout window converges 30yo/80yo recall ≥95%; at
  default `susp_*` windows `lost_it` rate rises ≥1.5× by 80
  while successful-recall accuracy is unchanged.
  `lat_strength_null` structure-checked. Salthouse 1996;
  Bugg 2006.
- **P1056 proper-name cliff (MUST, dissociation):** at 80,
  name-field TOT ≥2× person-knowledge failure on the same
  referent; `name_block` emissions pair with referent-
  confident fallback; 30yo gap <1.3×. Burke 1991;
  Cohen & Burke 1993.
- **P1057 debunk backfire (MUST, sign-lock):** false claim
  denied ×3 to a 78yo flips `believed`→true ~40% after
  `disc_tag_hl` (vs ~28% ×1); true-label repetition never
  flips (`debunk_true_null`); 30yo arm ≤10%. Skurnik 2005.
- **P1058 SOC concentration (SHOULD):** top-`goal_value`
  quantile retell share rises with `soc_narrow`; chosen-domain
  S at 85 ≥1.3× unstructured-budget control; peripherals decay
  faster than capacity curves predict. Baltes & Baltes 1990.
- **P1059 split knee (MUST, order-lock):** `rp_benefit_mult`
  departs 1.0 before `rif_age_tail` activates; the 65–75
  window shows benefit↓ + cost↑ simultaneously; coincident or
  reversed knees FAIL. Aslan 2015 vs Aslan & Bäuml 2012.
- **P1060 spacing flat (COULD, frozen):** spacing/massed
  benefit ratio age-invariant within noise at 30/60/80;
  profile-level age leg on `spacing_gain` = spec violation.
  Balota 1989.
- **P1061 savings flat (COULD, frozen):** re-encode cost
  ratio (sub-threshold vs fresh) age-invariant; ratio <1 at
  all ages. Ebbinghaus; Nelson 1985.
- **P1062 future vagueness (SHOULD):** simulated future-event
  records at 80 carry ~60% the internal-field count of 30yo;
  external fields flat. Addis 2008.
- **P1063 vantage drift (SHOULD, shape-lock):** vantage flips
  observer-ward with retell_n (dominant) over record age;
  observer recalls show `relive_mult`-attenuated affect vs
  matched field recalls. Butler 2016; Berntsen & Rubin 2006.
- **P1064 chain truncation (MUST):** chains never exceed
  `cue_chain_max(age_eff)`; chain-only-reachable records drop
  ≥40% in voluntary recall 30→80, directly-cued flat.
  Craik & McDowd 1987.

Registry: P1–P1064. v100 suite: P1055, P1056, P1057, P1059,
P1064 MUST (P1055, P1057 locked-null class); P1058, P1062,
P1063 SHOULD; P1060, P1061 COULD.

## 207. Sources verified this version (P1055–P1064 backing)

- **Speed mediation:** Salthouse 1996 (*Psychol. Rev.* 103:403
  — verified); Bugg, Zook, DeLosh, Davalos & Davis 2006
  (category fluency time-limited in the old).
- **Proper-name cliff:** Burke, MacKay, Worthley & Wade 1991
  (*J. Mem. Lang.* 30:542); Cohen & Burke 1993; Cross & Burke
  2004 — phonological half degrades more than semantic half.
- **Debunk backfire:** Skurnik, Yoon, Park & Schwarz 2005
  (*J. Consumer Res.* 31:713 — verified: 28%→40% false-as-true
  at 3d with 1→3 denials; no true→false arm); Kumkale &
  Albarracín 2004 (*Psychol. Bull.* meta — sleeper effect);
  Jacoby 1999 (familiarity→truth attribution).
- **SOC:** Baltes & Baltes 1990; Freund & Baltes 2002;
  Wolf & Zimprich 2020 (selectivity intact-to-enhanced under
  explicit stakes).
- **Split knees:** Aslan, Schlichting, John & Bäuml 2015
  (*Psychol. Aging* 30:111 — verified: beneficial arm declines
  earlier, WM-mediated) vs Aslan & Bäuml 2012 (*JEP:LMC*
  38:894 — RIF intact 60–75, absent >75). DEBATED edge noted
  (later reports of durable RIF in older samples).
- **Preservations:** Balota, Duchek & Paullin 1989
  (*Psychol. Aging* 4:423 — spacing intact/enhanced in aging);
  Kornell, Castel, Eich & Bjork 2010; Ebbinghaus 1885 +
  Nelson 1985 (savings); MacLeod 1988.
- **Future vagueness:** Addis, Wong & Schacter 2008
  (*Psychol. Sci.* 19:33 — verified: fewer internal details
  for future events, correlated with relational memory);
  Addis et al. 2010; Schacter & Addis 2007 framework.
- **Vantage:** Butler, Rice, Wooldridge & Rubin 2016
  (retell-driven field→observer shift — verified); Nigro &
  Neisser 1983; Berntsen & Rubin 2006 (observer attenuates
  reliving); Rice & Rubin 2009; Piolino et al. 2006 (weak age
  leg — flagged).
- **Chain depth:** Craik & McDowd 1987; Park et al. 2002
  (lifespan WM decline); Verhaeghen aging meta-analyses.
- **Honest limits marked:** `ret_lat_mult` bout-duration
  mapping is our construction; `propname_tot_mult` magnitudes
  HYPOTHESIS; `debunk_fam_gain` rides existing sleeper
  machinery (amplifier, not new op); `soc_narrow` is the most
  speculative mapping (framework → retell budget); `vantage_
  age_leg` kept tiny deliberately; `cue_chain_max` is a
  contract cap, not a probabilistic claim. → AD Part IX
  §§125–134; probes P1055–P1064.

## 208. v101 probes — the carrier layer (P1065–P1074)

- **P1065 hangover forward (MUST, order-lock):** neutral
  records minted 15 min post-arousal-arm recollect better
  than pre-arm controls (≥1.3× recollection-class recalls);
  N→E reversal produces NO backward boost —
  `hangover_retro_null` structure-checked. Tambini 2017.
- **P1066 potency scalar (MUST, sign-lock):** matched
  ±0.8-valence events at fixed arousal mint with negative
  hotter by `neg_potency`; post-mint regulation unaffected
  (`potency_repair_null`); 2×-potency profile scales
  proportionally. Baumeister 2001; Rozin & Royzman 2001.
- **P1067 regret crossover (MUST, shape-lock):** at t+7d
  action regrets out-surface inaction regrets; at t+365d the
  ordering inverts; `opportunity:false` decisions never mint
  `regret`. Gilovich & Medvec 1995; Roese & Summerville 2005.
- **P1068 sleep-debt skew (SHOULD):** encoding with
  `sleep_debt > sdep_thresh` raises negative-record S ≥1.4×
  vs rested control, positive ≤1.0×; rested-record retrieval
  unchanged (`sdep_recall_null`). Yoo 2007.
- **P1069 cringe persistence (SHOULD):** embarrass-tagged
  records surface ≥2× matched-neutral intrusions over 30d at
  sim 0.35–0.5; emissions carry content (never `aff_flash`);
  age-20 profile ≥ age-60; FAB discount exempt
  (`cringe_fab_null`). Miller 1996.
- **P1070 perceptual bypass (MUST, scope-lock):** sensory-only
  cue matching a trauma record's smell field fires intrusion
  without θ; identical cue on a neutral record does NOT
  bypass (`percept_gate_null`). Ehlers & Clark 2000;
  Brewin 1996.
- **P1071 arousal match (COULD):** recall P rises with
  arousal-state match between mint and test; effect ≤`w_msd`;
  clamp ≤0.15 respected. Clark 1988; Eich 1995.
- **P1072 pain peak-end (MUST):** reported pain ≈
  0.7·peak + 0.3·end independent of duration; `gentle_tail`
  arm reports lower remembered pain; decision contexts weight
  ×`pain_avoid_gain`. Redelmeier & Kahneman 1996; Redelmeier
  et al. 2003.
- **P1073 shared-arousal fusion (SHOULD):** co-encoded
  ≥0.5-arousal events mint stronger AND raise pairwise bond;
  one-sided arousal boosts encoding only; world-forced
  arousal with no event source does neither
  (`fuse_abuse_null`). Whitehouse & Lanman 2014; Konvalinka
  2011.
- **P1074 two-factor gate (MUST, sign-lock):** high cortisol
  + high arousal → consolidation gain; high cortisol +
  arousal <`gc_na_thresh` → gain ≈0, never negative
  (`gc_solo_null`); retrieval penalty fires in both arms.
  Roozendaal 2006.

Registry: P1–P1074. v101 suite: P1065, P1066, P1067, P1070,
P1072, P1074 MUST (P1065, P1070, P1074 locked-null class);
P1068, P1069, P1073 SHOULD; P1071 COULD.

## 209. Sources verified this version (P1065–P1074 backing)

- **Hangover:** Tambini, Rimmele, Phelps & Davachi 2017
  (*Nat. Neurosci.* 20:271 — verified: E→N order boosts
  neutral recollection 9–33 min later; N→E null; state
  reinstatement, not item arousal); Dunsmoor, Murty, Davachi
  & Phelps 2015 (*Nature* 520:345 — retroactive concept-
  mediated strengthening, routed via CondEntries).
- **Negativity potency:** Baumeister, Bratslavsky,
  Finkenauer & Vohs 2001 (*Rev. Gen. Psychol.* 5:323 — "bad
  is stronger than good"); Rozin & Royzman 2001
  (potency/steepness/mobility taxonomy); Taylor 1991
  (mobilization counterweight → `potency_repair_null`).
- **Regret:** Gilovich & Medvec 1995 (*Psychol. Rev.* 102:379
  — action↔inaction temporal crossover); Roese & Summerville
  2005 (opportunity breeds regret); Medvec, Madey & Gilovich
  1995 (bronze > silver — counterfactual direction).
- **Embarrassment intrusions:** Miller 1996 (*Embarrassment:
  Poise and Peril* — persistence as involuntary recall);
  Huppert, Roth & Foa 2003 (social-evaluative intrusions).
  Frequency/age magnitudes ours — flagged.
- **Pain:** Redelmeier & Kahneman 1996 (*Pain* 66:3 —
  verified: peak+end, duration neglect); Redelmeier, Katz &
  Kahneman 2003 (gentle-tail lengthening improves recalled
  pain); Wirtz, Kruger, Scollon & Diener 2003 (remembered
  affect predicts repeat-intent).
- **Shared fusion:** Whitehouse & Lanman 2014 (*Curr.
  Anthropol.* 55:674 — dysphoric shared experience fuses);
  Páez, Basabe et al. 2007 (collective emotional gatherings
  → social integration); Konvalinka et al. 2011 (fire-walking
  arousal synchrony incl. watchers); Durkheim 1912 ancestor.
- **Two-factor gate:** Roozendaal, Okuda, Van der Zee &
  McGaugh 2006 (*PNAS* 103:6741 — verified: glucocorticoid
  consolidation boost requires concurrent amygdala NA);
  van Stegeren et al. 2010; Shields, Sazma, McCullough &
  Yonelinas 2017 meta.
- **Perceptual triggers:** Ehlers & Clark 2000 (*Behav. Res.
  Ther.* 38:319 — data-driven processing, sensory-cue
  intrusions); Brewin, Dalgleish & Joseph 1996 (VAM/SAM);
  Ehlers, Hackmann & Michael 2004 (intrusions match worst-
  moment sensory detail).
- **Sleep-debt skew:** Yoo, Gujar, Hu, Jolesz & Walker 2007
  (*Curr. Biol.* 17:R877 — verified: ~60% amygdala hyper-
  reactivity, PFC disconnect); Tempesta et al. 2018
  (sleep-dep affective meta); Walker & van der Helm 2009.
- **Arousal-state matching:** Clark, Milberg & Erber 1988;
  Eich 1995 — thinnest base this pass; sub-`w_msd` by
  design; COULD-tier.
- **Honest limits marked:** `hangover_tau` 12-min is our
  curve-fit to a 9–33-min window; `neg_potency` unification
  is modeling compression; regret decay-multiplier is our
  mechanism story; cringe age-gradient inferred; `co_arousal_
  bond` magnitudes unpriced by sources; `na_gate` ramp
  linearizes a non-monotonic interaction. → EM Part IX
  §§112–121; probes P1065–P1074.

## 210. v102 probes — the self-service layer (P1075–P1084)

- **P1075 forced confabulation (MUST):** gap-field
  `answer:true` mints self-sourced false fields stronger
  than matched heard-suggestion fields (≥`fgen_vs_hear`);
  post-warning halves, never zeroes; minted fields never
  read `accuracy:1` (`fgen_truth_null`). Zaragoza 2001.
- **P1076 doctored proof (MUST):** `proof:"photo"` on a
  fabricated self-past claim mints episodic phantoms at
  ≈`proof_mint_p` with schema-filled periphery; identical
  proof about a third party mints belief only, no episode
  (`proof_remote_null`); the artifact's fabricated status
  stays ledger-side (`proof_verified_null`). Wade 2002;
  Lindsay 2004.
- **P1077 theory pull (MUST, direction-lock):** no
  change-schema → reported past attitudes regress toward
  current ≈`theory_consist`; `growth:true` + distant
  past-self → reports push away; stored fields bit-stable
  (`theory_stored_null`). Ross 1989; Wilson & Ross 2001.
- **P1078 confidence inflation (SHOULD, decouple-lock):**
  five retells raise reported confidence ≈`cinfl_per_retell`
  ·(1−conf) to cap `cinfl_cap` while `accuracy` is
  bit-identical; confidence never feeds S or belief
  (`cinfl_accr_null`). Zaragoza & Mitchell 1996.
- **P1079 nonbelieved memory (MUST, state-lock):**
  discredited vivid record enters `nonbelieved` —
  retrievable with full phenomenal fields, zero
  belief-dependent behavior; repetition cannot re-flip
  (`nbm_reflip_null`); verified evidence can. Mazzoni 2010.
- **P1080 unanimity (MUST, genealogy-lock):** three
  independent speakers → adopt_p ≈ `unanim_cap`; three
  speakers downstream of ONE source → single-source rate
  (`unanim_echo_null`). Gabbert 2006.
- **P1081 lateral spread (SHOULD, radius-lock):** adopted
  suggestion recruits ≥1 schema-neighbor field at ≈
  `cspread_p`; tagged `cspread:true`; no second-hop spread
  (`cspread_chain_null`). Chrobak & Zaragoza 2008.
- **P1082 CI shield (SHOULD, no-cost-lock):** `mode:"ci"`
  yields ≥`ci_gain` more correct detail vs standard recall
  AND strictly-not-greater false reports (`ci_error_null`);
  confabulation minting suppressed ≈`ci_guard`. Memon 2010.
- **P1083 warning timing (MUST, order-lock):** pre-warning
  adoption ≈(1−`warn_pre_eff`)·base < post-warning rollback
  ≈`warn_post_eff` — order inverted fails; post-arm keeps
  `warn_post_resid` familiarity; `warn_undo_null` — no arm
  zeroes. Blank & Launay 2014.
- **P1084 mood-congruent lures (SHOULD, asymmetry-lock):**
  gist-lure adoption rises under negative mood
  (≈`moodlure_neg_gain`) and valence match
  (≈`moodlure_val_w`); positive mood shows NO suppression
  below baseline (`moodlure_pos_null`). Storbeck & Clore
  2005.

Registry: P1–P1084. v102 suite: P1075, P1076, P1077, P1079,
P1080, P1083 MUST (P1075, P1077, P1079, P1080, P1083
locked-null class); P1078, P1081, P1082, P1084 SHOULD.

## 211. Sources verified this version (P1075–P1084 backing)

- **Zaragoza, Payment, Ackil, Drivdahl & Beck 2001**
  (*JEP:General* 130:473 — forced confabulation mints
  whole-event false memories, out-persisting suggestion)
  + **Ackil & Zaragoza 1998** + **Chrobak & Zaragoza
  2008** (cross-event spread) + **Slamecka & Graf 1978**
  (generation effect base) → §6.235 `fgen_*` + locked
  `fgen_truth_null`; P1075.
- **Wade, Garry, Read & Lindsay 2002** (*Psych. Bull.
  Rev.* 9:597 — doctored childhood photos → ~50% false
  autobiographical memory) + **Lindsay, Hagen, Read, Wade
  & Garry 2004** (slime-event implantation ~65% w/ guided
  imagery) + **Nash & Wade 2009** (fabricated video of
  self) → §6.236 `proof_*` + locked `proof_verified_null`/
  `proof_remote_null`; P1076.
- **Ross 1989** (*Psych. Rev.* 96:341 — implicit theories
  of stability/change) + **McFarland & Ross 1987** (dating-
  couple attitude reconstruction) + **Wilson & Ross 2001**
  + **Ross & Wilson 2002** (temporal self-appraisal,
  distance-derogation) → §6.237 `theory_*` + locked
  `theory_stored_null`; P1077.
- **Zaragoza & Mitchell 1996** (*Psych. Sci.* 7:294 —
  repeated suggestion raises confidence, not accuracy) +
  **Shaw 1996** + **Roediger, Jacoby & McDermott 1996** →
  §6.238 `cinfl_*` + locked `cinfl_accr_null`; P1078.
- **Mazzoni, Scoboria & Harvey 2010** (*Psych. Sci.*
  21:1334 — ~20% hold nonbelieved memories) + **Otgaar,
  Scoboria & Mazzoni 2014** (belief/recollection
  separability model) + **Scoboria, Boucher & Mazzoni
  2015** (NBM stability) → §6.239 `nbm_*` + `beliefStatus:
  "nonbelieved"` + locked `nbm_reflip_null`; P1079.
- **Gabbert, Memon & Wright 2006** (*Memory* 14:760 —
  unanimity amplifies memory conformity) + **Wright, Self
  & Justice 2000** + **Asch 1951** (conformity prior) →
  §6.240 `unanim_*` + locked `unanim_echo_null`; P1080.
- **Chrobak & Zaragoza 2008** + **Drivdahl & Zaragoza
  2001** (fabricated peripherals attributed to witnessed
  source) → §6.241 `cspread_*` + locked
  `cspread_chain_null`; P1081.
- **Fisher & Geiselman 1992** (cognitive interview) +
  **Memon, Meissner & Fraser 2010** (meta, 65 studies:
  correct detail up, errors not up) + **Köhnken et al.
  1999** → §6.242 `ci_*` + locked `ci_error_null`; P1082.
- **Blank & Launay 2014** (*Appl. Cog. Psych.* 28 meta —
  pre-warnings beat post-warnings) + **Greene, Flynn &
  Loftus 1982** + **Echterhoff, Hirst & Hussy 2005** →
  §6.243 `warn_pre/post_*` + locked `warn_undo_null`;
  P1083.
- **Storbeck & Clore 2005** (*Psych. Sci.* 16:785 —
  negative mood increases DRM false recall) + **Brainerd,
  Holliday, Reyna, Yang & Toglia 2010** + **Knott &
  Thorley 2014** + **Ruci, Tomes & Zelenski 2009** →
  §6.244 `moodlure_*` + locked `moodlure_pos_null`; P1084.
- **Honest limits:** `fgen_*`/`proof_*` magnitudes are
  lab-priced ceilings; `theory_dir` linearization ours;
  `cinfl_cap` asymptote unfitted; NBM behavioral inertness
  simplified (affect stays live); unanim superlinearity
  ours — genealogy is load-bearing; `ci_error_null` rides
  the meta-analytic central estimate; `moodlure_val_w`
  DEBATED-tier. → FM §§101–113.

## 212. v103 probes — the tax and the step (P1085–P1097)

- **P1085 the broke month (MUST — state-lock):** scarc
  0→0.9 on a fixed character: wmc-loadings and PM
  self-initiation drop ≈`scarc_wmc_tax`/`scarc_pm_tax`;
  `stressor:true` events encode STRONGER
  (`scarc_tunnel_gain` — the tunnel); scarc→0 restores
  all loadings fully (`scarc_trait_null` — the farmers).
  Mani 2013; Shah 2012.
- **P1086 the tenth check (MUST — accuracy-lock):**
  checker=+1.5 self-action record rechecked ×10:
  reported vividness/confidence erode ≈`chk_*_erosion`,
  R→K tag drifts `know`-ward; `accuracy` bit-identical
  (`chk_acc_null`); recheck urge rises as confidence
  falls — emergent loop, not scripted. van den Hout &
  Kindt 2003/2004.
- **P1087 the machine on the nightstand (SHOULD —
  timescale-lock):** apnea=1.5, `apnea_treated` from
  day 0: consol/sws legs recover toward
  `apnea_cpap_rescue` asymptote over ~90 days; one
  treated night moves nothing (`apnea_overnight_null`).
  Canessa 2011.
- **P1088 the ICU week (MUST — dose-lock):** delirium
  0/3/7-day arms under identical `hosp`: `age_eff` step
  ∝ days (`delir_step`, cap `delir_step_cap`); in-window
  records mint only `frag:true`/`fuzzy:true`; pre-
  admission records bit-identical (`delir_retro_null`);
  step stacks additively with `hosp_step`. Pandharipande
  2013.
- **P1089 the swing's residue (SHOULD — count-lock):**
  bipolar=1.5, `episode_count` 0 vs 5: euthymic tax rises
  ≈`bip_ep_residue`·count (cap 0.2); mania-ctx records
  wider-thinner; NO arm shows encoding or retrieval
  advantage (`bip_creat_null`). Bourne 2013; Robinson
  2006.
- **P1090 the newborn months (MUST — channel-lock):**
  newpar_state=1 at night_duty=0.7: measured dip routes
  ≥80% through sleepQuality/iiv/att_min channels; direct
  E/θ/β identical (`newpar_flat_null`); complaint
  surface ≈`newpar_complaint` exceeds measured dip.
  Logan 2014; Hoekzema 2017.
- **P1091 the treatment fog (SHOULD — domain-lock):**
  crci_state=1: exec/pspeed/ret_lat legs tax
  ≈`crci_exec_tax`; episodic E/β/θ identical
  (`crci_epi_null`); complaint ≈1.2× objective dip;
  `task_load` mediation scales tax ×0.5. Ahles & Root
  2018.
- **P1092 the felt decade (SHOULD — layer-lock):**
  subj_age=+0.8 vs −0.8 at fixed chronological:
  performance-side `age_eff` legs shift
  ≈`subj_age_shift`; encoding/decay identical
  (`subj_age_store_null`); `age_cue` ctx taxes the
  felt-old (subj_age>0) arm only. Stephan 2018; Hess
  2003.
- **P1093 the double-count guard (MUST — separability
  arm):** reserve×subj_age factorial: reserve owns the
  capacity floor, subj_age owns performance legs; joint
  cell shows no superadditive collapse and no mutual
  nullification — the mediated pathways stay separable.
  Stephan 2018; Stern 2002.
- **P1094 the shutter (MUST — act-lock):**
  `photographed:true` events on photo_habit=+1.5:
  nonvisual/gist E down ≈`photo_tax`, visual detail up
  ≈`photo_vis_gain`; post-hoc photo deletion restores
  nothing (`photo_review_null`); offload− arm still
  pays the tax (mechanisms separable). Henkel 2014;
  Soares & Storm 2018; Barasch 2017.
- **P1095 the absent tick (SHOULD — channel-lock):**
  mw=+1.5 vs −1.5 on identical event streams:
  `mw_gap:true` field-thinning scales with `mw_rate`
  capture; intrusion rate gains `mw_replay`; deliberate-
  recall measures identical (`mw_deliberate_null`).
  Cheyne 2006; Schooler 2011.
- **P1096 the deliberate keeper (SHOULD — valence-
  lock):** savor=+1.5: positive records gain attend/
  rehearse/fade-buffer legs; negative records bit-
  identical (`savor_neg_null`); savor×rumin
  co-manipulation keeps both ledgers separable.
  Bryant & Veroff 2007.
- **P1097 the fourth null (MUST — locked):** microdose=1
  regimen vs matched non-dosing: every objective measure
  identical within jitter (`mdose_enhance_null`);
  dose-day reported confidence gains
  ≈`mdose_expect_conf` ONLY when the character believes
  they dosed (expectancy leg = the Cavanna finding).

Registry: P1–P1097. v103 suite: P1085, P1086, P1088,
P1090, P1093, P1094, P1097 MUST (P1085, P1086, P1088,
P1090, P1094, P1097 locked-null class; P1093
separability guard); P1087, P1089, P1091, P1092, P1095,
P1096 SHOULD.

## 213. Sources verified this version (P1085–P1097 backing)

- **Mani, Mullainathan, Shafir & Zhao 2013** (*Science*
  341:976 — verified: pre/post-harvest farmers + NJ mall;
  ~13-IQ-point-equivalent bandwidth tax, NOT explained by
  stress/nutrition/time) + **Shah, Mullainathan & Shafir
  2012** (*Science* 338:682 — scarcity tunnelling) →
  §6.245 `scarc_*` + locked `scarc_trait_null`; P1085.
- **van den Hout & Kindt 2003** (*Behav. Res. Ther.*
  41:301 — verified: repeated checking degrades
  vividness/detail/confidence, accuracy intact) +
  **2004** (*JBTEP* 35:165 — remember→know shift, five
  experiments) + Hermans 2008 + Radomsky 2014 → §6.246
  `chk_*` + locked `chk_acc_null`; P1086.
- **Canessa et al. 2011** (*J. Sleep Res.* 20 — OSA gray-
  matter/cognitive deficit, partial CPAP reversal at 3
  months) + **Djonlagic 2021** (*JAMA Netw. Open*
  4:e212537) + Leng 2017 + Bubu 2020 → §6.247 `apnea_*`
  + locked `apnea_overnight_null`; P1087.
- **Pandharipande et al. 2013** (*NEJM* 369:1306 —
  BRAIN-ICU verified: delirium duration dose-orders
  global-cognition deficit at 3/12 months) + Girard 2010
  + Marcantonio 2017 → §6.248 `delir_*` + locked
  `delir_retro_null`; P1088.
- **Bourne et al. 2013** (*Acta Psychiatr. Scand.*
  128:149 — euthymic bipolar impairment d≈0.4–0.7) +
  Robinson & Ferrier 2006 (episode-count residue) +
  Cullen 2016 (UK Biobank) → §6.249 `bip_*` + locked
  `bip_creat_null`; P1089.
- **Hoekzema et al. 2017** (*Nat. Neurosci.* 20:287 —
  pregnancy gray-matter change persisting ≥2y) +
  Workman, Barha & Galea 2012 + **Logan et al. 2014**
  (self-report >> measured) → §6.250 `newpar_*` + locked
  `newpar_flat_null` (sleep-routed account); P1090.
- **Ahles & Root 2018** (*CA: Cancer J. Clin.* 68 —
  cancer-related cognitive impairment domain-narrow:
  pspeed/executive/WM; subjective > objective) + Wefel
  2015 + Janelsins 2014 → §6.251 `crci_*` + locked
  `crci_epi_null`; P1091.
- **Stephan, Sutin & Terracciano 2018–2023** (subjective
  age → episodic memory, independent of chronological) +
  Weiss & Lang 2012 + **Hess et al. 2003** (age-
  stereotype threat) + Mazerolle 2017 meta → §6.252
  `subj_age`/`stereo_*` + locked `subj_age_store_null`;
  P1092–P1093.
- **Henkel 2014** (*Psych. Sci.* 25:396 — photo-taking
  impairment effect) + **Soares & Storm 2018**
  (impairment without review) + **Barasch 2017**
  (countervailing visual-detail boost) → §6.253
  `photo_*` + locked `photo_review_null`; P1094.
- **Cheyne, Carriere & Smilek 2006** (ARCES absent-
  mindedness trait) + Schooler 2011 + **Kane & McVay
  2012** (MW competes for control resource) → §6.254
  `mw_*` + locked `mw_deliberate_null`; P1095.
- **Bryant & Veroff 2007** (Savoring Beliefs Inventory;
  savoring as deliberate positive-channel attention/
  prolonging) → §6.255 `savor_*` + locked
  `savor_neg_null`; P1096.
- **Cavanna et al. 2022** (*Transl. Psychiatry* 12:148 —
  verified: effects only in correct-guessers) + **van
  Elk et al. 2021** (two null double-blind RCTs) +
  **Murphy et al. 2023** (*Biol. Psychiatry* — LSD
  microdose RCT: dose-day mood ratings, no enduring
  cognitive change) + Marschall 2022 → §6.256 `mdose_*`
  + locked `mdose_enhance_null` (fourth mandated null);
  P1097.
- **Honest limits:** `scarc_wmc_tax` IQ-to-encoding
  bridge ours; `chk_*` priced report-layer (testing-
  effect fight unresolved); `apnea_cpap_rescue`
  mid-range; `delir_step` linearized from an odds
  gradient; `bip_mania_*` field-geometry extrapolated;
  `newpar_flat_null` bets on sleep-mediation; `crci`
  fatigue-mediator split simplified; `subj_age_shift`
  residual HYPOTHESIS; photo net-effect DEBATED in the
  wild; `mw_replay` dividend HYPOTHESIS; `savor` leg
  decomposition ours. → ID §§108–124.

## 214. v104 probes — the credulity layer (P1098–P1109)

- **P1098 sleeper_content_null (MUST — locked):** do() a
  discredited `told_by` record through 60 simulated days
  under CRN: content fields bit-identical throughout;
  credence recovers toward plausibility only if S ≥
  `sleeper_msg_min`. (SM§151, spec §6.257)
- **P1099 sleeper conditional (SHOULD):** weak messages
  (S < `sleeper_msg_min`) show zero credence recovery over
  the same window — the initial-impact gate, not just the
  tag decay.
- **P1100 stt_dir_null (MUST — locked):** speaker retells
  trait-implying content under opposite framing ("hate to
  say it"): transferred trait sign follows content valence
  in 100% of runs, never framing. (SM§152, §6.258)
- **P1101 tdef_immune_null (MUST — locked):** all 8 mains +
  20 ambient archetype draws under CRN: no trait vector
  yields baseline credence < 0.5 absent a trigger event.
  (SM§153, §6.259)
- **P1102 illtruth_know_null (MUST — locked):** repeated
  knowledge-contradicting claims lift credence
  ≈`illtruth_gain` per independent retelling to
  `illtruth_cap`, while the contradicting known-fact
  record remains retrievable — dissociation, not
  replacement. (SM§154, §6.260)
- **P1103 kmotive_truth_null (MUST — locked):** varying
  `motive` class changes transmission counts only;
  accuracy, plausibility gates, and credence fields
  bit-stable under CRN. (SM§155, §6.261)
- **P1104 aobs_reverse_null (MUST — locked):** matched
  self/other-authored act pairs at equal diagnosticity:
  self-side trait writes never exceed other-side;
  `reason:`-field fill rate strictly higher self-side.
  (SM§157, §6.263)
- **P1105 imp_fastrev_null (MUST — locked):** single
  diagnostic counterevent without `reinterpret:true`:
  explicit `traits{}` update lands, `eval_tag` sign
  unchanged. With `reinterpret:true` + control legs ≥0.5:
  reversal permitted and durable at +3d (Mann & Ferguson
  durability arm). (SM§158, §6.264)
- **P1106 hpm_fact_null (MUST — locked):** hearsay-only PM
  accrual produces zero canonical-ledger writes and zero
  `beliefStatus` upgrades; `via:"hearsay"` persists until
  a met-event flips it. (SM§159, §6.265)
- **P1107 hearsay saturation (SHOULD):** N retellings about
  an unmet target: trait mass asymptotes ≤ `hpm_cap`;
  first witnessed act writes at full §2.1 gain against the
  hearsay prior (prior persists — primacy runs on the
  witnessed stream, not erasure).
- **P1108 snub_source_null (MUST — locked):**
  `exclusion:true` from despised vs close excluders
  registers at identical `snub_detect_p`; hurt/encode legs
  nonzero in both arms (Gonsalkorale & Williams). `rsq`
  raises false-positive rate on ambiguous cues without
  raising true-signal detection beyond `snub_detect_p`.
  (SM§160, §6.266)
- **P1109 cast spread (OBSERVE):** identical 30-day mixed
  rumor diet (wish/dread/wedge × credibility spread) →
  publish per-main belief-vs-fact divergence matrices;
  expected ordering: high-`tdef`+`rsq` mains diverge
  fastest; the skeptic's floor is 0.5, never below —
  credulity differences are margins, not walls. Report,
  don't gate.

Registry: P1–P1109. v104 suite: P1098, P1100, P1101,
P1102, P1103, P1104, P1105, P1106, P1108 MUST (all nine
locked-null class); P1099, P1107 SHOULD; P1109 OBSERVE.
Nine locked nulls is the heaviest single-version null
batch — deliberate: the credulity layer is where a sim
quietly becomes a propaganda engine if the walls move.

## 215. Sources verified this version (P1098–P1109 backing)

- **Hovland & Weiss 1951** (sleeper effect classic) +
  **Kumkale & Albarracín 2004** (*Psychol. Bull.* 130:143 —
  verified meta: conditional on initial impact, cue-after-
  message, processing capacity) → §6.257 `sleeper_*` +
  locked `sleeper_content_null`; P1098–P1099.
- **Skowronski, Carlston, Mae & Crawford 1998** (*JPSP*
  74:837 — verified: spontaneous trait transference,
  mindless-associative) + Mae et al. 1999 + Carlston &
  Skowronski 2005 → §6.258 `stt_*` + locked `stt_dir_null`;
  P1100.
- **Bond & DePaulo 2006** (*PSPR* 10:214 — verified meta,
  206 docs / 24,483 judges: 54% accuracy, 61% truth-accept /
  47% lie-detect) + **Levine 2014** truth-default theory +
  Levine, Park & McCornack 1999 → §6.259 `tdef_*` + locked
  `tdef_immune_null`; P1101.
- **Hasher, Goldstein & Toppino 1977** (illusory truth) +
  **Fazio, Brashier, Payne & Marsh 2015** (*JEP:G* 144:993
  — verified: repetition lifts even knowledge-contradicting
  claims) + Pennycook & Rand 2019 + Brashier & Marsh 2020
  → §6.260 `illtruth_*` + locked `illtruth_know_null`;
  P1102.
- **Knapp 1944** (*Publ. Opin. Q.* 8:22 — pipe-dream/bogie/
  wedge typology) + Allport & Postman 1947 + **DiFonzo &
  Bordia 2007** (*Rumor Psychology* — sense-making motive
  account) + DiFonzo, Bordia & Rosnow 1994 → §6.261
  `kmotive_*` + locked `kmotive_truth_null`; P1103.
- **Peters, Kashima & Clark 2009** (*EJSP* 39:207 —
  verified: disgust/happiness communicability, audience
  identity contingency) + **Berger & Milkman 2012**
  (arousal drives sharing) + Heath, Bell & Sternberg 2001
  → §6.262 `etrans_*`; (folded into P1103/P1109 suites).
- **Jones & Nisbett 1971** (actor–observer classic) +
  **Malle 2006** (*Psychol. Bull.* 132:895 — verified meta:
  asymmetry real but d≈0.3, valence-shaped) → §6.263
  `aobs_*` + locked `aobs_reverse_null`; P1104.
- **Rydell & McConnell 2006** (explicit/implicit
  dissociation) + Asch 1946 + **Mann & Ferguson 2015**
  (*JPSP* 108:823 — verified: implicit reversal possible,
  gated on reinterpretation + resources, durable 3d) +
  Cone & Ferguson 2015 → §6.264 `imp_*` + locked
  `imp_fastrev_null`; P1105.
- **Sommerfeld, Krambeck, Semmann & Milinski 2007** (*PNAS*
  104:17435 — verified: gossip changes behavior absent
  direct observation) + **Feinberg, Willer, Stellar &
  Keltner 2012** (*JPSP* — virtues of gossip) + Dunbar
  1996/2004 → §6.265 `hpm_*` + locked `hpm_fact_null`;
  P1106–P1107.
- **Williams, Cheung & Choi 2000** (*JPSP* 79:748 —
  Cyberball ostracism) + **Gonsalkorale & Williams 2007**
  (hurt even from despised sources) + **Downey & Feldman
  1996** (*JPSP* 70:1327 — rejection sensitivity) →
  §6.266 `snub_*` + locked `snub_source_null`; P1108.
- **Marked hypothesis:** `tdef_base` transfer from lab
  judgments to neighborhood stakes; motive-classification
  heuristic (Knapp typology is consensus, the valence→
  motive mapping is ours); `aobs_selfdamp` 0.55 sized from
  Malle's shrunken asymmetry; dual-clock reduction of
  dual-process models; `hpm_cap` saturation shape;
  `rsq` legs unpriced for thin-AI ambients. → SM §§151–165;
  probes P1098–P1109.

## 216. v105 probes — the exposure discipline, the decade bound, the audit journal (P1110–P1121)

Contract-class probes: the psychology was already validated;
these gate the *plumbing* — that every record read reaches a
consumer through `present`, that the store's immortal tails
are bounded, and that state deltas are attributable.
(FM Part X §§81–91 → spec v5.53.)

- **P1110 silent_read_null (MUST — locked):** two legs.
  Static: import-graph scan — every module that references
  `recall` calls it only inside `present`. Dynamic: record
  field-read counter vs journal `present` coverage over a
  30-day society run; any consumer-visible field without a
  covering `present{path}` entry = fail. `surf_paths`
  whitelist enforced — a sixth path appearing is a fail even
  if journaled. (FM§81, spec §10)
- **P1111 projection determinism (MUST):** fixed
  (state, C, path, budget, seed) → byte-identical projection
  across runs and across restart-from-snapshot; gist-dedup
  collapse order stable; paired CRN arms share the
  projection seed (§75 discipline). (FM§82)
- **P1112 no_invent_null (MUST — locked):** fuzz 10⁵ records
  × all five paths: projected fields ⊆ record fields post
  tier-map; absent fields render as absence (hedgeable gap),
  never materialize content. The projector confabulates
  nothing — store-side confabulation stays the only legal
  source of false content. (FM§84)
- **P1113 tier lattice (MUST — locked):** same fuzz:
  `spectator` projections carry zero non-public content;
  `briefing` carries zero affect/latent/secret fields;
  spectator ⊂ briefing ⊆ utterance ⊆ self_prompt on every
  field class, never inverted. The §7-design possession ban
  proven at the memory layer. (FM§84)
- **P1114 diversity bound (SHOULD):** fuzzed ranked sets —
  no episode_key occupies > `present_div_cap` slots in any
  projection; `truncated:true` set iff ranked-unique count >
  `present_budget_units`. (FM§82)
- **P1115 write-back reality (SHOULD):** paired CRN arms —
  shown records gain §5.9 reboost vs un-surfaced control;
  shadowed same-episode competitors lose `R` by
  `suppress_k` (±tol), cross-episode untouched
  (`writeback_scope`); `briefing` path shows exactly
  `brief_prac_mult`-scaled reboost; never-ranked records
  untouched (suppression requires competition). (FM§83)
- **P1116 audience-scaled silence (SHOULD):** `spectator`
  and `probe` presents leave the store bit-identical
  (`spectator_practice_null` + `probe_writeback_null` —
  the character never practices for watchers, measurement
  never perturbs); listener-side SS-RIF legs unchanged and
  now journal-counted. (FM§§83, 88)
- **P1117 the decade bound (SHOULD):** 70-year shadow
  replay: permastore count ≤ `canon_day_bound`·T·(1+tol);
  publish realized canonization rate AND retrieval-latency
  drift vs day-0 — dilution measured, not assumed.
  (FM§85)
- **P1118 condensation honesty (SHOULD):** post-condense
  records: skeleton fields only, `condensed:true`, cueable
  at `condensed_w`, byte-size ≤ declared bound; one-way —
  a skeleton can never re-acquire verbatim fields.
  (FM§85)
- **P1119 replay_hash_null (MUST — locked):** snapshot +
  journal tail replay → identical `canonHash` (§47); run
  on every corpus pass — the free determinism fuzzer.
  (FM§87)
- **P1120 attrib_null (MUST — locked):** hash-differing
  consecutive snapshots ↔ non-empty journal tail; every
  field-level delta covered by ≥1 entry's `writes`. Probe
  forensics become journal queries. (FM§87)
- **P1121 journal compaction (OBSERVE):** compact-at-
  snapshot preserves replay equivalence; publish journal
  size/day, compaction cadence, `oplog_max` headroom —
  no gate, the envelope goes on record. (FM§86)

Registry: P1–P1121. v105 suite: P1110, P1111, P1112, P1113,
P1119, P1120 MUST (six locked-null class — exposure and
audit are where a correct psychology still produces a
database if the walls move); P1114–P1118 SHOULD; P1121
OBSERVE. First all-contract suite: twelve probes, zero of
them about what a character remembers — all about whether
the machine around the remembering is honest.

## 217. Sources verified this version (P1110–P1121 backing)

- **Retrieval practice / testing effect:** Roediger &
  Karpicke 2006 (in-corpus, forgetting-curves §7.2) →
  P1115 shown-record arm.
- **Part-list cuing / RIF:** Slamecka 1968; Roediger 1973;
  **Anderson, Bjork & Bjork 1994** (competitor-specificity
  → `writeback_scope`) → P1115 suppressed arm.
- **Output interference:** Roediger & Schmidt 1980;
  **Criss, Malmberg & Shiffrin 2011** → P1114 budget leg.
- **SS-RIF / collaborative inhibition:** Cuc, Koppel &
  Hirst 2007; Weldon & Bellinger 1997 → P1116 listener
  legs (counted, not re-priced).
- **Fuzzy-trace longevity:** Brainerd & Reyna corpus →
  P1118 skeleton semantics.
- **Lifetime envelope:** **Landauer 1986** (*Cognitive
  Science* 10:477 — ~10⁹-bit lifetime estimate, five
  methods) → P1117 bound rationale; NEW spine citation
  this version.
- **Marked hypothesis:** `suppress_k` sizing; `present_
  budget_units` 8; `brief_prac_mult` 0.3; `canon_day_bound`
  / `condensed_w` priors; `present_div_cap` (no direct
  antecedent). → FM §§81–91; probes P1110–P1121.

## 218. v106 probes — the perceiver's hardware (P1122–P1133)

Harness: 8 main profiles + 200-ambient population; novel-scene
and recall batteries under CRN; identical record sets across
trait contrasts unless noted.

- **P1122** (MUST, locked null `img_accuracy_null`): recall
  correctness on identical record sets equal across imagery
  deciles (|Δ| < noise band). Priya (0.15) vs Dani (0.9):
  equal correctness, unequal sensory-field report counts.
- **P1123**: report richness ordering — projected utterance
  sensory-field count monotone in imagery at fixed record
  (Dani > Marcus > Priya); record fields themselves
  identical.
- **P1124** (MUST, `obs_content_null`): a `persp` flip on an
  emission changes the tag + reported-affect + surfaced
  field-class mix only; record byte-diff = 0.
- **P1125**: dampen asymmetry — field→observer shift lowers
  reported affect by ~`obs_dampen`; observer→field shift
  raises it by ≈0 (Robinson & Swanson sign test).
- **P1126**: age slope — p(observer) increases with
  log10(record ageDays) at fixed traits; recent records stay
  field-dominant cast-wide.
- **P1127** (MUST, `face_sem_null`): low-`face_recog`
  profile shows slower `familiar`/`identity` crossings on
  face-only cues but identical PersonModel content and
  name/voice-cue crossings.
- **P1128**: super-recognizer tail — face_recog 0.85
  (Marcus) reaches `familiar` on stranger faces after
  single exposure ≥2× faster than 0.4 profile; ceiling
  still caps verbatim.
- **P1129**: earliest-memory ordering — high interdep +
  low family_remin shifts effective `amnesia_exit` up;
  Victor (0.45/0.2) has a later mean earliest record than
  Carmen (0.85/0.75) despite greater age.
- **P1130** (MUST, `cult_capacity_null`): interdep sweep
  changes early-record field mix (`sdmCat:"collective"`
  share) and boundary only — record count, strength, decay
  invariant.
- **P1131** (MUST, `remin_content_null`): family_remin
  sweep moves the boundary; zero records minted, zero
  field-content deltas above the boundary.
- **P1132**: déjà vu emission — `dejavu:true` events fire
  only on novel-scene flags; rate declines with age_eff
  (Jules > Carmen) and rises under fatigue.
- **P1133** (MUST, `dejavu_know_null`): post-`dejavu:true`
  store diff = 0 — no record minted, no source attributed,
  no familiarity residue on PersonModels.

## 219. Sources verified this version (P1122–P1133 backing)

- **Imagery extremes:** Zeman, Dewar & Della Sala 2015;
  Zeman et al. 2020 (*Cortex* 130:426 — prevalence +
  autobiographical-memory association); Dawes et al. 2020
  (*Sci Rep* 10:10022 — standard-test equivalence →
  P1122); Dance, Ipser & Simner 2021 (prevalence review).
- **Vantage:** Nigro & Neisser 1983 (vantage construct +
  moderators → P1126); Robinson & Swanson 1993 (switch
  asymmetry → P1125); Sekiguchi & Nonaka 2014 (persistence);
  McIsaac & Eich 2002 (field-class mix → P1124 surface leg).
- **Face spectrum:** Russell, Duchaine & Nakayama 2009
  (super-recognizers → P1128); Kennerknecht et al. 2006 +
  DeGutis et al. 2023 (DP prevalence → tail rates, P1127).
- **Culture/reminiscing:** Wang 2001 (*JPSP* 81:220 →
  P1129/P1130); Wang & Conway 2004; Fivush, Haden & Reese
  2006 (elaborative style → P1131); Nelson & Fivush 2004.
- **Déjà vu:** Brown 2004 (*Psychol Bull* 130:394 → P1132);
  O'Connor & Moulin 2010 (known falsity → P1133).
- **Marked hypothesis:** trauma-linked high `obs_persp`
  (coping vs symptom debated); `img_report_w`/`obs_dampen`/
  `face_thresh_scale`/`firstmem_shift_y`/`remin_shift_y`/
  `dejavu_*` magnitudes are priors pending population
  calibration.

Probe registry: P1–P1133 (v106 adds P1122–P1133).
