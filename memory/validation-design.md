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
