# Profile Generation — the character-memory compiler (v10)

**Track:** memory-research (sf/memory) · **Companion to:**
`character-memory-profiles.md` (archetype templates), `individual-differences.md`
(trait layer), `memory-model-spec.md` (param names/mechanics).

This doc turns "character profile" from a hand-written block into a
deterministic **compilation**: `(bible pins, seed) → MemoryParams + initial
store + self-model`. It also adds three mechanisms the profiles needed but
the spec lacked: a metamemory self-model (what a character *believes* about
their own memory), occupational expertise with real costs, and open-goal
records (the Zeigarnik layer — unresolved business that won't stay quiet).

Grounding tags: **[CONSENSUS]** textbook/meta-analytic; **[DEBATED]**
real but contested effect; **[HYPOTHESIS]** our modeling choice.

---

## 1. The pipeline — `deriveParams` made fully deterministic

v0.7 specified the recipe in four lines; this section makes it executable.
Inputs:

```
ProfileInput = {
  seed,                    // deterministic RNG root (formal-model.md §6)
  birthWorldDay,           // fixes age_now at any worldDay
  modifiers: [≤3 of §2 table in character-memory-profiles.md],
  pinnedTraits: {trait: σ-value},      // e.g. {sleep: -1.2, neurot: +0.8}
  domains: [string],       // expertise tags (§3)
  deathDay: optional,
  backstory: optional      // → §6 seeding recipe
}
```

Steps, in order (order matters — document any reordering as a spec change):

1. **Age-curve evaluation.** For every capacity param, evaluate the knot
   function (`age-development.md` §6; decline params at
   `age_eff = age_now − reserve·reserve_shift`, spec §4.8) at `age_now`,
   multiply onto the C-band default. `reserve` is itself a pinned trait
   proxy (bible "sharp for her age" → +0.2).
2. **Modifier deltas.** Apply §2 modifier multipliers/adds in the order
   listed. Modifiers that are pure trait bundles (v0.7 §6 map) SKIP this
   step — they arrive via pinned traits in step 3; applying both
   double-counts. Record-level modifiers (trauma, domain-expert) still
   apply here.
3. **Trait sampling.** Unpinned traits ~ MVN(0, R) conditioned on pins
   (individual-differences.md §4 matrix R). Conditioning is standard
   Gaussian: for pinned set P, `μ_rest = Σ_RP Σ_PP⁻¹ x_P`,
   `Σ_rest = Σ_RR − Σ_RP Σ_PP⁻¹ Σ_PR`. In practice R is sparse, so this
   is a few small solves; pinning `neurot` pulls `distrust`, `stress`,
   `fantasy` upward — a character pinned anxious should *look* anxious
   everywhere, not just in one param.
4. **Projection.** `param += Σ_traits loading(trait,param)·trait_σ`
   through the §3 loading table. Explicit nulls (g_mem↛misinfo_suscept,
   wmc↛cie_residual, vivid↛accuracy, Big Five↛distortion) must stay
   zero — they are falsifiability anchors, not omissions.
5. **Residual.** U(±5%) per numeric free param, from the seeded RNG —
   same seed + same pins = same vector (P55 demands r>0.9 for
   trait-identical clones; residual is the only break).
6. **Clamp + coherence pass.** Clamp to `character-memory-profiles.md`
   §0, then enforce hard invariants (any violation = generation bug,
   reject and resample residual):
   - `name_thresh > identity_thresh > familiar_thresh` (cascade order)
   - `mental_reinstate ≤ 0.7·place_reinstate`
   - `ss_rif_k ≤ rif_k`
   - `diag_moral_neg ≥ diag_ability_pos`
   - `misinfo_suscept` (suggestion channel) and `confab_fill` (gist
     channel) must not load on the same trait sign for the same param —
     they have opposite age gradients and the channels must stay separable
   - frozen constants (spec §7 frozen lists v0.9 + v0.9d) are NEVER
     touched — not by curves, modifiers, traits, or residual. A profile
     that emits a non-default `k`, `s_decay`, or `tau_episodic` is invalid.
7. **Emit side outputs** (not just MemoryParams):
   - `SelfModel` (§2 below) — self_est per facet, strategy_use, metamem_r
   - `DomainTable` (§3) — expertise tags with gains
   - `seedHints` (§6) — backstory-derived record skeletons, open loops,
     PersonModel priors for game-systems' world seed

**Invariants the compiler must guarantee:** no two mains share a full
vector (post-residual); identical pins + seed → identical vector;
all free params inside §0 clamps; frozen list untouched.

---

## 2. Metamemory — characters know *something* about their memory, badly

A real person's beliefs about their own memory are real, consequential,
and barely accurate. That gap is a characterization goldmine: the
character who *thinks* they never forget a face (and does), the one who
*thinks* they're sharp (and isn't), the one convinced they're losing it
(and isn't — they just read an article about forgetting).

### 2.1 Evidence

- Self-report memory questionnaires correlate with objective performance
  at **r ≈ 0.1–0.2**, often less: Herrmann 1982 review ("Know thy
  memory", Psychol. Bulletin) concluded questionnaire self-reports are
  "poor predictors" of actual performance; Troyer & Rich 2002 (MMQ):
  MMQ-Ability vs word-list r = .10, vs name memory r = .09, vs telephone
  task r = .14 — all n.s. **CONSENSUS: subjective ≁ objective.**
- Complaints track **mood, not mechanics**: memory complaints correlate
  with depression/anxiety far more than with performance (meta-analytic
  direction in Beaudoin & Desrichard 2011; "capacity" items specifically
  are the performance-correlated subscale, still weak). So `self_est`
  must load on `neurot`, not on `g_mem`.
- Older adults report *more* decline than their measured decline — the
  metamemory curve falls faster than the memory curve (lifespan
  metamemory literature: metamemory does not follow the same decline
  trajectory as performance — Hertzog & Hultsch 2000 line of work).
  **CONSENSUS direction, magnitude ours.**
- Compensation is real: high complaint / high-conscientiousness people
  adopt external strategies (lists, reminders, asking others) and can
  *outperform* low-complaint peers on everyday prospective tasks — the
  subjective–objective gap inverts when strategies are allowed
  (naturalistic PM / age-PM paradox adjacent; McDaniel & Einstein 2007).

### 2.2 Mechanism

Each character gets a `SelfModel` — three fields, compiled alongside
MemoryParams:

```
SelfModel = {
  self_est:    {global: 0..1, names: 0..1, events: 0..1, intentions: 0..1},
               // felt competence per facet; NOT derived from actual params
  metamem_r:   0.0..0.3,   // correlation felt↔actual; human range ~0.1
  strategy_use: 0..1       // external-memory reliance
}
```

Compilation rules:

```
self_est.global = clamp01(0.55 − 0.12·neurot − 0.10·distrust
                          − 0.15·age_decline_signal(age_eff)
                          + 0.08·extra + ε_self, 0.05, 0.95)
  ε_self ~ N(0, 0.15)          // the dominant term is noise — r stays ≈0.1
  age_decline_signal = max(0, (age_eff − 55)/30)   // felt decline > real
self_est.names  = self_est.global − 0.15·(name_thresh - 0.55)·metamem_r·10
                  + N(0,0.1)   // metacognition leaks *a little* truth
self_est.events = self_est.global + N(0,0.12)
self_est.intentions = self_est.global + 0.05·consc + N(0,0.1)
metamem_r = clamp(0.15 + 0.05·consc − 0.03·|neurot|, 0.0, 0.3)
strategy_use = clamp01(0.3 + 0.25·consc + 0.15·(1−self_est.global)
                       + 0.1·social, 0, 1)
  // strategies track felt deficit + conscientiousness, not real deficit
```

Uses:

- **Dialogue hedging.** When a character comments on their own memory
  ("I'm hopeless with names" / "I never forget"), sample from `self_est`
  facets — *not* from actual params. Accuracy claims and actual accuracy
  correlate at `metamem_r` only. **HYPOTHESIS wiring, CONSENSUS gap.**
- **Confidence reporting vs confidence held.** `conf_out` (spec §3) is
  report-time calibration on this recall; `self_est` is the chronic prior.
  A character with low self_est can still emit a high-conf_out specific
  recall — and should sometimes *surprise themselves*.
- **Strategy behavior.** `strategy_use` is a world-builder/behavior hook:
  high values → writes reminders, delegates recall to a transactive
  partner (§6.14 directory lookup — "ask Rosa, she remembers"), sets
  explicit intentions. Implement as `pm_self += 0.10·strategy_use`
  (reminders rescue intentions) and prefer `mode:"directory"` recall
  when `self_est < 0.4`. **[HYPOTHESIS magnitudes.]**
- **The poignant case:** high `self_est` + steep real decline (older
  adult, low reserve) = the character who insists their memory is fine
  while viewers watch it fail. No special code — falls out of the
  independence.

---

## 3. Occupational expertise — domain-locked, and it has a cost

v0's domain-expert modifier (`enc_base +0.1`, `k_verbatim ×0.7` in-domain)
was directionally right but missed two findings that make experts
interesting:

- **Boundary collapse.** Expert memory advantage is domain-locked:
  chess masters' superior recall of real positions evaporates on random
  boards (Chase & Simon 1973 — classic; replicated across domains).
  **[CONSENSUS]** → the gain is a *gain*, not a penalty out of domain;
  experts revert to baseline, they don't dip below it — except:
- **Expertise cost.** London taxi drivers — acquired, massive spatial
  expertise (posterior hippocampus grows with years on the job, Maguire
  et al. 2000 PNAS — and it is *acquired*: no correlation in non-driver
  navigational experts, Maguire et al. 2006 vs bus drivers) — are
  significantly **worse at forming new visual associations** (Woollett &
  Maguire 2009). Specialization has a bill. **[CONSENSUS direction,
  mechanism DEBATED]**
- **Child experts exist**: domain knowledge can outrun age (Recht &
  Leslie 1989 — child chess experts out-recalled adult novices on chess
  positions). Expertise must be additive with age curves, not gated by
  them. **[CONSENSUS]**

### 3.1 Mechanism — replace the v0 modifier row

```
ProfileInput.domains: [{tag, depth: 0..1, years}]   // per character
enc_base_eff = enc_base + expert_gain·depth·domMatch(event)   // §2 E formula
k_verbatim_eff = k_verbatim·(1 − 0.4·depth·domMatch)
merge_thresh_eff = merge_thresh·(1 − 0.15·depth)   // in-domain schemas
                                                  // merge faster (gist)
link_p_eff = link_p·(1 − expert_cost·depth·(1−domMatch))  // Woollett cost:
              // out-of-domain association formation slightly worse
domMatch(e) = 1 if e.cues ∩ domain.tags ≠ ∅ else 0   // boundary is sharp
```

New params: `expert_gain` 0–0.15 (default 0.10 = the old +0.1),
`expert_cost` 0–0.15 (default 0.06 — small; Woollett's deficit was
real but the taxi drivers were extreme specialists),
`expert_bound` 0.7–1.0 (fraction of gain lost across the boundary;
default 1.0 = Chase & Simon total collapse).

The profile-level rule change: **every domain costs something.** A
shopkeeper who remembers every customer's usual order pays a small tax
on learning new unrelated associations. Keeps "expert" from being a
free buff — and produces the realistic pattern: brilliant in the shop,
ordinary (slightly worse) everywhere else.

### 3.2 Example domain tags for the Mission cast slots

beverages-regulars (barista), faces-orders (server — see §4), routes-
parcels (courier — Maguire-type), stock-prices (shopkeeper), leases-
payment-history (landlord — the §3 worked example: forgets your name,
never forgets your arrears), gossip-who-said-what (the connector).

---

## 4. Open-goal records — the Zeigarnik layer

People's unfinished business will not shut up. Two classic effects:

- **Zeigarnik 1927** (dissertation, Lewin's group): interrupted tasks
  recalled better than completed ones. **Status: DEBATED** — the 2025
  meta-analysis (Liu & Einarsdóttir-style aggregation, Nat. Hum. Sci.
  Comms.) found **no reliable memory advantage** across replications;
  the effect depended on situational involvement, experimenter
  authority, task engagement — conditions richer in 1927 than in
  modern replications.
- **Ovsiankina 1928**: spontaneous resumption of interrupted tasks.
  **CONSENSUS** in the same meta-analysis — the urge to resume is
  robust even where the recall advantage isn't.
- Intention superiority (Goschke & Kuhl 1993): words associated with
  pending intentions show heightened accessibility — the retrieval-
  level cousin, direction **CONSENSUS**, size modest.

**Modeling verdict:** the memory *advantage* must be gated on
involvement (as the meta-analysis demands) and the *accessibility/
intrusion* boost is the reliable core — open business should pop up
uninvited, not merely be recalled more when asked. This is also the
mechanism drama seeds want: a secret kept, an apology owed, a loan
unrepaid should nag.

### 4.1 Mechanism

Record gains flag `open: true` — set at encoding when the event's
`selfRelevance ≥ open_self_gate` AND the event schema implies
continuation (promise made, debt incurred, conflict unresolved,
interrupted action; the event layer supplies `open:true` candidates —
world events with dangling ends). Cleared by `learnOutcome` (§6.16)
or an explicit `closeLoop(charId, recordRef)` when the loop resolves.

While open:

```
drive boost (§5.4):     drive += open_loop_gain·selfRelevance
intrusion (§5.7 scan):  intrusion_thresh_eff = intrusion_thresh − open_loop_gain/2
retell priority:        open records preferred in discussEvent sampling
```

On close: boost removed AND the record's β gets `× 1.2` permanently —
**completed business is forgotten *faster*** (the Zeigarnik flip side;
consistent with the meta-analysis: the advantage was tension, not the
task). The resumption urge is behavioral, not memorial: emit
`openLoopUrge(charId) -> [recordRef]` on the ambient scan so the
behavior layer can act on it. **[HYPOTHESIS wiring of a DEBATED
recall effect + CONSENSUS resumption.]**

New params: `open_loop_gain` 0–0.3 (default 0.12),
`open_self_gate` 0–0.7 (default 0.4 — casual interruptions of strangers'
tasks don't nag; your own half-finished row does).

Profiles: neurotic/ruminative characters raise `open_loop_gain`
(×1.4 — unresolved loops feed the rumination cycle and the cycle
feeds the loops); `consc` raises `open_self_gate`-up... no — `consc`
*lowers* the gate and raises the gain (the conscientious are nagged by
small obligations: +0.10/σ on open_loop_gain, −0.05/σ on open_self_gate,
added to the §3 loading table). Depressive modifier: open *negative*
loops get double the intrusion bonus (shame loops).

This gives game-systems the missing "why does she keep bringing it up"
knob, orthogonal to arousal: trauma intrudes via affect; open loops
intrude via incompleteness. A character can be calm and still circling.

---

## 5. State vs trait — sharpened (v0.7 §5 extension)

The two-timescale rule gains a third tier for the profile compiler:

| tier | lifetime | examples |
|---|---|---|
| trait | character's life | IndivTraits, reserve, chronotype |
| regime | months–years | job stress era, caregiving era, depression episode |
| state | hours–days | last night's sleep, acute stress, tod-vs-peak_hour |

Regimes are new: a bible should be able to say "the divorce years" —
sustained modifier deltas (chronic-stress profile) applied to encoding
*for records born in the window*, then lifted. Implement as dated
modifier overlays in the profile; encodeEvent consults the active
overlay. Era-specific because that's how human biography works —
everyone has a bad year, and the records from it carry the mark.
**[HYPOTHESIS structure over CONSENSUS state×trait evidence.]**

---

## 6. Life-history seeding — bible → initial store

A character joining the world at age `a` needs a store that *already
looks lived in*. Recipe (cheap, deterministic, all optional):

1. **Backstory epochs → density.** For each backstory event, mint one
   record with `encodeAge` set, E drawn from the era-appropriate
   encoding regime, and let the *character's own decay curves* run
   forward to worldDay 0 — seeding is simulation, not fabrication.
   Bump-era (encodeAge 10–30) events survive at `bump_beta_mult`
   automatically — do not hand-boost.
2. **Salience ordering.** Seed only the top ~30–60 backstory records —
   the rest is genuinely absent (humans don't have the footage either).
   Rank by `w_emo·arousal + w_self·selfRelevance + retell count`.
3. **Retold stories are pre-drifted.** Any backstory record marked
   "often told" in the bible gets `floor(told_count/20)` reconsolidation
   passes at compile time — it arrives polished, confident, and partly
   wrong, exactly like a real rehearsed anecdote (§6.1 drift applied
   `n` times).
4. **PersonModel priors.** Named relationships in the bible get
   PersonModels seeded at the right cascade tier: spouse =
   identity-tier saturated; "the guy at the café" = familiar-tier.
   Credibility fields seeded ±0.2 around 0.5 by relationship valence.
5. **Open loops as drama hooks.** Bible dangling threads → `open:true`
   records (§4) — they start nagging from day one. Trauma bibles seed
   `trauma:true` records per the v0.5 rules.
6. **Self-model.** SelfModel compiled per §2 — *not* seeded from actual
   store quality. The gap is the point.

---

## 7. Worked derivations (real numbers)

### 7.1 "The landlord-type", age 54, midlife curve + stress + domain

`age_now = 54`; interpolate §6 knots between 50 and 70 (weights ×
(1 + 0.2·Δknot) per 4 years):

```
enc_base   .796·0.45 ≈ 0.358 | beta_episodic 1.39·0.42 ≈ 0.584
theta      1.204·0.40 ≈ 0.482 | misinfo_suscept 1.27·0.30 ≈ 0.381
confab     1.42·0.45 ≈ 0.640 | drift_p 1.52·0.07 ≈ 0.106
neg_aff_dc 1.168·1.25 ≈ 1.46 | link_p .80·0.75 = 0.60
intrusion  .934·0.75 ≈ 0.700 | att_min 1.30·0.12 ≈ 0.156
w_emo      .94·1.0 = 0.94    | w_self .9·1.1 ≈ 0.99
```

Pinned traits `{stress:+1.2, consc:+0.6, wmc:−0.4}` → loading deltas:
enc_base −0.084·… (stress −0.07/σ·1.2 → ×0.916 → ≈0.328), theta ×1.096
→ 0.528, beta_episodic ×1.096 → 0.640, pm_self +0.072, ret_noise −0.09·σ,
misinfo_suscept ×(1−0.12·−0.4=1.048) → 0.399, source_confuse ×1.08.
Domain `[leases-payments, faces]` depth 0.8: in-domain enc_base
0.328+0.08≈0.41, out-of-domain link_p 0.60·(1−0.048)=0.57.
SelfModel: self_est.global ≈ 0.55+0.05 = 0.60 ± 0.15 — he's
*stressed* about memory only if neurot joins; strategy_use ≈
0.3+0.15+…≈0.5 — keeps a ledger because conscientious, not because
forgetful. **Emergent:** misses casual names, flawless on arrears,
slightly worse than baseline at learning new unrelated pairings.

### 7.2 "The grieving young barista", age 26

C-band knot 1.0 everywhere at 26 → defaults; pins `{neurot:+1.4,
sleep:−1.1, social:+0.9}`; modifiers: depressive (specificity 0.4,
rumin_k up via neurot loading ×1.4·0.30=+0.42 → rumin_k≈0.71) +
domain-expert `[beverages-regulars]` depth 0.7. Trauma regime overlay
(§5) for the bereavement year → records born in window get high-stress
encoding. SelfModel: self_est.global ≈ 0.55−0.168≈0.38 (feels broken,
mostly isn't — metamem_r ≈ 0.11); strategy_use ≈ 0.3+0.15·…+0.09≈0.48.
open_loop_gain 0.12·1.4≈0.17 + negative-double → her unresolved loops
about the loss intrude at roughly 2× base rate. **Emergent:** remembers
regulars' orders perfectly, describes her past in summaries ("I always
mess up"), flashes on the loss at odd triggers, insists her memory is
shot while her event recall is ~normal.

### 7.3 "The 71-year-old fixture", high reserve

`age_now 71`, `reserve 0.8` → `age_eff = 71 − 0.8·10 = 63`: decline
params read ~63 (β_episodic mult ≈ 1.31+0.65·0.4 ≈ 1.57 → β≈0.66 vs
1.71·0.42≈0.72 at 71 unreserved). Pins `{vivid:+1.0, distrust:−0.6}`;
modifiers routine-heavy. SelfModel: self_est.global ≈ 0.55−0.15·0.27
+… ≈ 0.55 — *under*estimates how steep the real curve is (real β 0.66,
felt fine); the poignant case from §2 armed. Open loops from 50 years
of shop accounts — still nagging at low priority. **Emergent:** tells
1987 like it happened last month (bump records + retold = polished
+ partly invented), blanks on last Tuesday, calls his memory "terrible"
only when distrust runs high — here low distrust → confidently wrong.

---

## 8. Falsifiable validation probes (P86–P95)

- **P86 metamemory gap:** across 20 generated characters, corr(
  self_est.global, measured 7-day recall hit-rate) must land in
  [0.0, 0.35] — the human window (Herrmann 1982; Troyer & Rich 2002).
  Outside on either side = bug.
- **P87 expert boundary:** domain expert vs novice, in-domain recall
  advantage ≥ 1.5× after 7 days; on out-of-domain random content the
  gap ≤ noise + small cost (Woollett ≤0.9× link_p). Chase & Simon.
- **P88 open-loop intrusion:** unresolved self-relevant records appear
  in ambient scans at ≥ 1.5× the rate of matched closed records;
  post-closure they decay *faster* (β×1.2) — advantage must invert.
- **P89 Zeigarnik involvement gate:** open:true on a low-selfRelevance
  event (gate fails) produces NO intrusion bonus — strangers' dropped
  tasks don't nag.
- **P90 diversity:** 8 mains generated → all pairwise parameter-vector
  distances > 0 (post-residual); trait-identical clones correlate
  r > 0.9 (P55 carried into the compiler).
- **P91 conditional coherence:** two bibles both pinned `neurot:+1.5`
  must show correlated elevations in distrust/stress/fantasy even when
  unpinned — the sparse-R conditioning must visibly propagate.
- **P92 regime scar:** a 2-year "chronic stress" overlay must mark
  *records born inside the window* (lower E, higher β) while records
  on either side decode normally — the scar is on the records, not
  the person.
- **P93 strategy compensation:** low self_est + high consc character
  on an uncued-deadline battery beats a higher-performing low-consc
  peer when reminders/directory recall are enabled (naturalistic-PM
  pattern).
- **P94 self-model commentary:** a low-self_est, normal-accuracy
  character's dialogue hedging ("I never remember…") must fire at
  >2× the rate of a matched high-self_est character — while their
  recall outputs are statistically identical.
- **P95 frozen-constant audit:** compile 100 random profiles; assert
  the v0.9/v0.9d frozen list is bitwise identical across all of them.

---

## 9. What changed upstream (spec v0.9 → v1.0)

| # | Change | Grounding |
|---|---|---|
| G1 | `SelfModel` side-output + params `metamem_r`, `self_est_bias`†, `strategy_use` | §2 (Herrmann 1982; Troyer & Rich 2002; Beaudoin & Desrichard 2011) |
| G2 | domain-expert modifier rewritten: `expert_gain`, `expert_cost`, `expert_bound`; `domMatch` boundary | §3 (Chase & Simon 1973; Maguire 2000/2006; Woollett & Maguire 2009; Recht & Leslie 1989) |
| G3 | record flag `open`; `open_loop_gain`, `open_self_gate`; closure → β×1.2; `openLoopUrge` contract | §4 (Zeigarnik 1927; Ovsiankina 1928; 2025 meta; Goschke & Kuhl 1993) |
| G4 | regime tier in the profile compiler (dated modifier overlays) | §5 |
| G5 | `deriveParams` full pipeline spec + coherence invariants + frozen-constant audit | §1 |
| G6 | life-history seeding recipe | §6 |
| G7 | probes P86–P95 | §8 |

† `self_est` is a SelfModel field; `self_est_bias` is the per-facet noise
scale if a loader wants it flattened into MemoryParams.

New MemoryParams (all optional w/ defaults — backward compatible):
`metamem_r 0.15`, `self_est_bias 0.15`, `strategy_use 0.3`,
`expert_gain 0.10`, `expert_cost 0.06`, `expert_bound 1.0`,
`open_loop_gain 0.12`, `open_self_gate 0.4`.
