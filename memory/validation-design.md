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
