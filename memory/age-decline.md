# Age Decline v4 — the machinery of normal cognitive aging, calibrated

**Track:** memory-research (sf/memory) · **Focus:** age-decline (older
adulthood, ~55+; where v3's age-development doc left off)
**Consumes:** `memory-model-spec.md` v0.3, `age-development.md` §6 knot
table, `forgetting-curves.md` §2.9 · **Feeds:** spec v0.4 (lifespan
decline layer — reserve, terminal decline, dedifferentiation;
pattern-separation decay; environmental-support asymmetry; TOT
partial retrieval; SWS-scaled consolidation; retrieval noise) and
future `validation-spec.md`.

Purpose: v3 gave us the *shape* of lifespan decline (knot curves, two
ages, binding deficit). v4 deepens the *mechanism layer* underneath:
WHY old memory fails (processing-resource / self-initiation account —
Craik; inhibition deficit — Hasher & Zacks; pattern-separation loss —
Stark/Yassa; SWS-mediated consolidation failure — Mander; dedifferentiated
noise — Li & Lindenberger), WHAT modulates it (cognitive reserve;
terminal decline; longitudinal vs. cross-sectional onset), and WHAT it
looks like behaviorally (overgeneral autobiographical recall, TOT states,
internal-detail loss). Every claim tagged **[CONSENSUS] / [DEBATED] /
[HYPOTHESIS]**; every finding lands in a spec parameter or probe.

---

## 1. The self-initiation / environmental-support asymmetry (Craik)

The single most useful organizing fact for RW: **age deficits shrink or
vanish when the environment does the retrieval work.**

- Craik 1983/1986, reviewed in Craik 2022: older adults' episodic deficit
  is disproportionately a deficit of **self-initiated processing** —
  generating cues, strategies, elaboration — attributed to frontal
  decline. Provide the support (recognition test, strong cue, enriched
  context) and the age gap narrows sharply. Recognition < free recall
  age-gap is the textbook instance. **[CONSENSUS]**
- Angel et al. 2010 (ERP): graded retrieval support — 3-letter vs
  4-letter word stems — eliminated the older-adult deficit in the
  high-support condition while leaving a large deficit in the
  low-support one. Naveh-Benjamin, Craik & Ben-Shaul 2002: support at
  BOTH encoding and retrieval helps older adults most.
  **[CONSENSUS pattern]**
- Context-reinstatement meta-analysis (2024, 33 studies, g=0.32): older
  adults benefit from place/context reinstatement **as much as** young
  adults — the §5.2 place-reinstate mechanism should NOT be
  age-penalized. This is a correction candidate to anything in the model
  that would scale cue benefit down with age. **[CONSENSUS meta]**

**Spec consequence (v0.4):** the age deficit lives in the *drive* side
(θ, search breadth, self-initiated PM — already `pm_self`), NOT in the
cue-matching machinery. New param `env_support_gain(age)` multiplies the
increment that cueMatch_ext delivers beyond threshold — richer contexts
disproportionately rescue older retrieval. Equivalently: old characters
are nearly normal when the world supplies the cue, and lost when they
must generate it. This is also why the older archetype's rumination/
remoteness should read as *cue-dependent*, not *absent*.

## 2. Processing resources and search breadth (Salthouse; Craik)

- Processing speed mediates most of the age variance in episodic memory
  in cross-sectional data (Salthouse 1996; Park et al. 2002 — the same
  dataset anchoring our §2.9 forgetting-curve slope).
  **[CONSENSUS pattern; causal status DEBATED — common-cause vs.
  mediated accounts unresolved]**
- RW has no use for literal latency, but speed's functional shadow is
  **search breadth**: a retrieval attempt samples a limited candidate
  set; slower/noisier systems sample fewer before giving up. Craik's
  processing-resource account (Craik, Rabinowitz & McIntyre): reduced
  resource → general, stereotyped encoding and shallow search.

**Spec consequence (v0.4):** `search_breadth` (max candidate records
scored per recall call) declines on a capacity curve: ~12 young → ~5 at
85. With identical cue math, older characters surface fewer candidates —
producing "I know there was something else…" without extra machinery.
Also gates the §5.7 involuntary scan breadth.

## 3. Inhibitory deficit → off-target retrieval (Hasher & Zacks)

- Hasher & Zacks 1988; reviewed Hasher, Lustig & Zacks 2007: aging
  weakens inhibition of irrelevant information — working memory admits
  more distractors, retrieval returns more off-target content.
  **[CONSENSUS pattern]**
- Autobiographical Interview meta-analysis (Sheldon et al. 2023,
  J Gerontol B gbad077; original Levine et al. 2002): older narrations
  contain **fewer internal (episodic, specific) details AND more
  external (semantic, off-target, commentary) details** — the two
  numbers move in opposite directions. Arbuckle & Gold 1993:
  off-topic verbosity increases with age. **[CONSENSUS]**

**Spec consequence (v0.4):** two knobs, not one. (a) `discrim_mult(age)`
lowers effective `interf_thresh`/`merge_thresh` — near-matches get
treated as matches (links to §4 below). (b) Retrieval reconstruction in
older profiles substitutes schema/semantic content for missing verbatim
at higher rate — our existing `confab_fill` age rise (v0.3, monotonic)
IS this; the meta-analysis gives it a second, independent anchor: the
output should literally contain more "external" detail. Validation:
count verbatim-vs-filled field ratio by age.

## 4. Pattern separation fails: lure discrimination (Stark, Yassa)

- Yassa, Lacy et al. 2011 (Hippocampus): aged humans show impaired
  pattern separation with CA3/DG hyperactivity — larger input
  dissimilarity needed to encode a new memory as *distinct*.
  **[CONSENSUS mechanism-direction]**
- Stark et al. 2013 BPS-O: lure-discrimination declines ages 20–89 even
  when recognition of repeats is intact; MCI shows both impaired.
  Stark et al. 2015: the deficit is **robust to instructions** —
  telling older adults to attend to details doesn't rescue it (it's
  representational, not strategic). **[CONSENSUS]**
- Behavioral signature: older adults endorse *similar-but-new* lures as
  "old" — overgeneralization at the record level.

**Spec consequence (v0.4):**
- Encoding: `discrim_mult(age_now)` scales `interf_thresh` and
  `merge_thresh` down (knots: 1.0 ≤50 → 0.8 at 75 → 0.72 at 85). Two
  similar evenings at Mudhaus fuse into one generic record sooner for
  old characters — pattern separation loss IS §4.3 genericization at
  elevated gain.
- Recognition (§5.6): **lure acceptance** — a cue that is similar-but-
  not-identical (same café, different day; same person, different
  event) is accepted with probability `lure_accept(age)` proportional
  to feature overlap: `P(accept) = lure_accept · overlap` for overlap
  in [0.5, 1.0). Young: ~0.05; old: ~0.3. This mechanically produces
  "yes, that's the hat she wore" — wrong hat.

## 5. Recollection vs. familiarity; overgeneral autobiographical memory

- Jacoby 1999; Jennings & Jacoby 1997: aging selectively impairs
  **recollection** (episodic, source-bound) while **familiarity**
  (gist, fluency) is relatively preserved. Older adults compensate by
  trusting familiarity — which is why their gist confidence stays high
  as verbatim dies. **[CONSENSUS]**
- Autobiographical specificity declines with age: Piolino et al. 2006,
  2009 (Neuropsychologia); Ford et al./AMT work; 2025 AMT meta —
  older adults return categoric/general memories where young adults
  return single-event ones; reduced autonoetic re-experiencing.
  **[CONSENSUS; modulated by cue type — positive cues spared]**

**Spec consequence (v0.4):** the `specificity` param (introduced in
profiles §2 for depression) is promoted to a capacity curve: knots
1.0 young → 0.75 at 70 → 0.65 at 85 — with the positivity interaction:
`specificity_eff = specificity · (1 + pos_spare·valence)` for
valence>0, pos_spare≈0.2 (positive-cue sparing, AMT meta 2025). Older
recall returns the generic/merged record where a young adult returns
the episode. Familiarity preservation = our existing rule that
`confidence` keeps rising with retellings while `accuracy` drifts —
v4 adds that verbatim survival for older characters should be gated
by `k_verbatim` knot ≥3.5 so that returned records are gist-heavy.

## 6. TOT and name retrieval — partial-retrieval states (Burke)

- Burke, MacKay, Worthley & Wade 1991 (diary + lab): older adults have
  **more TOT states**, retrieve **less partial phonological info**
  during them, and experience **more blocker words**; proper names
  are worst (Cohen & Faulkner 1986; Maylor 1990). Resolution rate once
  in TOT is similar across ages — it's access, not search.
  **[CONSENSUS]**
- Transmission-deficit account (MacKay & Burke 1990): connections
  weaken with age and disuse; recent use protects — our
  `retrievalCount`/`lastAccessDay` fields already encode recency.

**Spec consequence (v0.4):** reconstruction gains a **partial-retrieval
outcome**: when a strong record's `verbatim.who`/`verbatim.name` field
is requested, fail with probability `tot_rate(age)` even if the field
survives decay — return the record with the name slot empty but
gist+feeling-of-knowing intact ("the woman from Mudhaus, her name is
right there—"). Knots: 0.04 young → 0.12 at 70 → 0.2 at 85; ×1.5 for
proper-name fields vs. other content; reduced by `recency` of the
target's own last access (nonrecent use penalty, Rastle & Burke 1996).
A subsequent recognition-mode cue resolves the TOT at young-adult
rates (resolution is spared — Burke 1991) → TOT states are
*resolvable*, good for dialogue beats.

## 7. Sleep architecture: consolidation's age decline (Mander)

- Mander et al. 2013 (Nat Neurosci): medial-prefrontal atrophy →
  reduced NREM slow-wave activity → impaired overnight retention of
  episodic (hippocampal-dependent) memories in older adults; SWA
  statistically mediates the age-memory link. Episodic-specific:
  procedural/semantic consolidation not equivalently hit.
  **[CONSENSUS for direction; pathway details DEBATED]**
- Practical magnitude: healthy young adults ~20–25% of the night in
  SWS; older adults substantially less — consolidation benefit for
  new episodic memories falls correspondingly.

**Spec consequence (v0.4):** `sleepFactor` becomes age-scaled:
`sleepFactor_eff = sleepFactor · sws_mult(age_now)`, knots 1.0 ≤40 →
0.85 at 65 → 0.75 at 85, applied ONLY to episodic records on the
daily consolidation pass (spec §2 sleep modifier + §4.6). An old
character who sleeps poorly is double-hit (trait × age). This is a
mechanistic channel behind the β_episodic old-age knots, not a
replacement — β already encodes average decline; sws_mult makes the
daily consolidation event itself age-graded so individual variation
in sleep quality interacts with age correctly.

## 8. Cognitive reserve — same age, different decline (Stern; Valenzuela)

- Cognitive reserve hypothesis (Stern 2002): education, occupational
  complexity, and mentally/socially engaging activity buffer the
  *expression* of age-related decline. Valenzuela & Sachdev 2006 meta
  (22 cohorts, ~29k people): high reserve → incident dementia OR 0.54
  (CI .49–.59); late-life complex activity protective independently.
  2024 life-course meta (27 studies): early-life HR 0.82, midlife
  0.91, late-life 0.81. **[CONSENSUS for risk reduction; mechanism —
  neural efficiency vs. delayed pathology — DEBATED]**
- Behavioral consequence for normal (non-dementia) aging: reserve
  shifts the *onset* of noticeable decline later rather than slowing
  the terminal slope ("compression" pattern — decline starts later,
  runs at similar rate).

**Spec consequence (v0.4):** per-character `reserve ∈ [0,1]` (default
~0.4; set by world-builder from education/occupation/engagement).
Effective age for **decline-side capacity params only**:
`age_eff = age_now − reserve·reserve_shift`, `reserve_shift`≈10
(game-years). Applies to: enc_base, beta_episodic, theta, link_p,
discrim_mult, tot_rate, search_breadth, sws_mult, pm_self. Does NOT
apply to era terms (encodeAge is historical fact) or to
misinfo_suscept/confab_fill (those track meaning-machinery, not
fluid capacity). Effect: two 72-year-olds — retired professor vs.
isolated pensioner — are ~10 effective-years apart on encoding/
retrieval while being identical on era structure. **[HYPOTHESIS
implementation of CONSENSUS phenomenon; the 10y shift is our
compression-pattern simplification]**

## 9. Terminal decline — the cliff before death (Wilson; Small & Bäckman)

- Wilson et al. 2003 (Neurology, n=763 Religious Orders): decline
  **accelerates ~43 months before death** — global-cognition annual
  loss jumps from 0.026 to 0.173 units, >6×. Present in nearly all
  decedents, highly variable rate; survivors show little decline.
  Small & Bäckman 1997/1999: same pattern in the very old.
  **[CONSENSUS]**
- **Terminal dedifferentiation** (Wilson et al. 2012): before the
  terminal window, domain decline rates correlate modestly (0.25–0.46);
  *during* terminal decline they correlate 0.83–0.89 — everything falls
  together. Plaques/tangles load on preterminal rate and earlier onset,
  not terminal rate. **[CONSENSUS finding]**
- Sliwinski et al./PAQUID (PMC3164394): executive and language
  functions start terminal decline >9 years out, earlier than episodic.
  **[CONSENSUS-ish]**
- Practice effects mask decline in longitudinal test data — irrelevant
  to RW (no retesting) but explains why our knots can be
  "cross-sectional pessimistic" yet still correct on-screen.

**Spec consequence (v0.4):** optional per-character `deathDay` (set by
world design if a character is scripted to die; most characters never
set it). When `age_now ≥ 55` and `deathDay − worldDay <
terminal_window_days` (default ≈1100 game days ≈ 3y, range per Wilson
3–6y for domain onset):
```
terminal_mult applies to ALL capacity params simultaneously:
  beta_* *= (1 + terminal_gain)          // terminal_gain ≈ 1.0–3.0
  enc_base, link_p, search_breadth, sws_mult *= (1 − terminal_loss·t_frac)
  theta, tot_rate, drift_p, confab_fill += terminal_loss·t_frac·base
```
where `t_frac = 1 − (deathDay−worldDay)/terminal_window` ramps 0→1
through the window. The dedifferentiation finding is implemented as
*one global ramp on everything* rather than per-param rates — matching
the observed collapse of between-domain variance. Reserve does NOT
delay terminal decline per Wilson 2008 (not modified by education).
**[CONSENSUS phenomenon; param values HYPOTHESIS-scaled to game time]**

## 10. Dedifferentiation and noise — variability itself ages

- Li & Lindenberger 1999+: aging neural systems show reduced
  distinctiveness between representations (dedifferentiation) and
  increased moment-to-moment variability; behaviorally, older adults
  show higher *within-person* variability — the same character is less
  consistent day to day, not just lower on average.
  **[CONSENSUS pattern]**

**Spec consequence (v0.4):** `drive(m)` gains a noise term
`N(0, ret_noise(age_now))`: σ 0.05 young → 0.12 at 75 → 0.16 at 85.
Cheap, and produces the real-world texture: an old character recalls
something effortlessly on Tuesday that was unreachable on Monday —
not a bug, the signature of aging. Same noise term also perturbs
`misinfo_suscept` draws and `tot_rate` draws (shared noisiness).

## 11. Longitudinal onset is later than cross-sectional knots imply

- Rönnlund et al. 2005 (Betula, n=829+967): longitudinally, episodic
  memory shows **no decline before ~60** (vs. gradual decline from the
  30s cross-sectionally); semantic memory grows to ~55 then declines
  mildly. Cohort/education differences inflate cross-sectional
  estimates. **[CONSENSUS that longitudinal < cross-sectional onset;
  exact onset age varies by cohort]**
- v3 §10 already flagged our old-age knots as possibly pessimistic
  ~5–10y and chose pessimism deliberately. v4 makes the correction
  *selective*: the knots stay (pessimism reads on-screen), but the
  **shape** is updated so that 35–60 is flatter — the real data say
  midlife is a plateau, not a ramp. Adjusted knots appear in the §13
  table below; `age-development.md` §6 remains the development-side
  source of truth for ≤50.

## 12. What the decline layer does NOT touch

- Semantic memory: preserved to ~55, mild decline after (Rönnlund;
  Park 2002). `beta_semantic` knots stay near-flat; permastore (§4.7)
  unaffected — old characters' world knowledge is the deepest store.
- Procedural: most preserved of all (spec keeps it out of scope).
- Emotional associations: conditioned cue→affect table survives —
  an old character dreads a doorway long after forgetting why; with
  positivity effect the dread fades faster than the warmth.
- Involuntary retrieval (§5.7): spared or enhanced (mind-wandering to
  the past; `intrusion_thresh` old knots already lower). Consistent
  with environmental-support story: spontaneous cue-driven recall is
  the old system's *strength*, not its weakness.

## 13. Updated/added knot rows (extends age-development.md §6, ages ≥30 side)

Capacity params — piecewise-linear, evaluated at `age_eff` (reserve-
shifted) unless noted:

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| search_breadth (abs. count) | 12 | 11 | 9 | 7 | 6 | 5 | Craik resource; Salthouse |
| env_support_gain | 1.0 | 1.05 | 1.15 | 1.3 | 1.4 | 1.45 | Angel 2010; Craik 2022 |
| discrim_mult (×interf/merge thresh) | 1.0 | 1.0 | 0.92 | 0.8 | 0.75 | 0.72 | Stark 2013; Yassa 2011 |
| lure_accept | 0.05 | 0.07 | 0.12 | 0.2 | 0.27 | 0.3 | Stark 2013 BPS-O |
| specificity (cap) | 1.0 | 0.95 | 0.85 | 0.75 | 0.68 | 0.65 | Piolino 2009; AI meta |
| tot_rate | 0.04 | 0.06 | 0.08 | 0.12 | 0.17 | 0.2 | Burke 1991; Maylor 1990 |
| sws_mult (episodic consolidation) | 1.0 | 1.0 | 0.93 | 0.85 | 0.78 | 0.75 | Mander 2013 |
| ret_noise (σ) | 0.05 | 0.06 | 0.08 | 0.12 | 0.15 | 0.16 | Li & Lindenberger |
| reserve_shift (yrs; ×reserve) | — | — | — | — | — | 10 | Valenzuela & Sachdev; Stern |
| terminal_window (game days) | — | — | — | — | — | ~1100 | Wilson 2003 (43mo) |
| terminal_gain / terminal_loss | — | — | — | — | — | 2.0 / 0.5 | Wilson 2003 6×; dediff |

Era terms unchanged (key on encodeAge; decline never rewrites history).

**Rationale anchors:** search_breadth and env_support_gain from the
Craik tradition; discrim/lure rows from the Stark/Yassa BPS-O & MST
age curves (20–89, monotone decline); specificity from Piolino and the
Autobiographical Interview meta; tot_rate from Burke diary rates;
sws_mult from Mander 2013 mediation; terminal window/mult from Wilson
2003 change-point and dedifferentiation correlation collapse.
**[Knot interpolations are HYPOTHESIS; anchors are CONSENSUS.]**

## 14. What changed in the spec (v0.3 → v0.4)

| # | Change | Grounding |
|---|---|---|
| E1 | `drive(m)` += `N(0, ret_noise)`; recall scores at most `search_breadth` candidates | §§2,10 |
| E2 | `env_support_gain(age)` multiplies cueMatch_ext's contribution — deficits concentrate in self-initiated retrieval; place/context benefit NOT age-penalized | §1 |
| E3 | `discrim_mult(age)` scales `interf_thresh`/`merge_thresh`; recognition mode gains `lure_accept` similar-but-new false positives | §§3,4 |
| E4 | `specificity` promoted to capacity curve with positive-cue sparing (`pos_spare`) | §5 |
| E5 | TOT partial retrieval: `tot_rate(age)` blanks name/who fields with feeling-of-knowing; recognition resolves | §6 |
| E6 | `sleepFactor_eff = sleepFactor · sws_mult(age_now)` on episodic consolidation | §7 |
| E7 | `reserve` + `age_eff` shift on decline params; era terms exempt | §8 |
| E8 | `deathDay`/`terminal_window`/`terminal_gain/loss` — global dedifferentiated ramp before scripted death | §9 |
| E9 | §6 knot table: midlife plateau made flatter 35–60 (Rönnlund longitudinal correction) — applied in profiles note | §11 |

New params: `search_breadth`, `env_support_gain`, `discrim_mult`,
`lure_accept`, `specificity`, `pos_spare`, `tot_rate`, `sws_mult`,
`ret_noise`, `reserve`, `reserve_shift`, `deathDay`,
`terminal_window`, `terminal_gain`, `terminal_loss`. Clamps added in
profiles §0.

## 15. Validation probes (P23–P30; continue P1–P22)

- **P23 environmental support:** same older character, same weak record:
  retrieval succeeds at ~young rate under full context (place+people+
  topic+recognition cue) but fails ~2× more under a bare verbal probe.
- **P24 reserve offset:** two 72-year-olds differing only in `reserve`
  (0.9 vs 0.2) behave like characters ~7–9 effective-years apart on
  encoding/retrieval tests while their bump-era records are identical.
- **P25 terminal dedifferentiation:** a character inside
  `terminal_window` shows simultaneous decline across episodic,
  source, and verbatim channels (per-channel metrics move together);
  before the window they did not.
- **P26 pattern separation:** two similar-but-distinct events (two
  Mudhaus dinners, same guests, different weeks) merge or
  cross-contaminate for the 75yo far more than the 30yo; recognition
  of a lure cue ("was she wearing the blue scarf?") falsely accepted
  at `lure_accept` rate.
- **P27 TOT:** older character asked for a well-known person's name
  fails at `tot_rate` while correctly describing the person; the same
  failure resolves when shown the person (recognition) at near-young
  rate — partial retrieval, not absent memory.
- **P28 overgeneral AM:** generic cue ("tell me about your trips to
  the market") returns a merged/generic record for the 75yo
  (specificity 0.75) vs. a specific episode for the 30yo; positive
  cues reduce the gap (pos_spare).
- **P29 SWS channel:** identical event + identical sleep-quality
  input consolidates measurably worse for the 75yo (sws_mult 0.85)
  than the 30yo; semantic record of the same fact unaffected.
- **P30 noise signature:** repeated identical cue contexts on the same
  older character show higher variance in recall success than the same
  test on a young character — within-person inconsistency, not just
  lower mean.

## 16. Honest limits

- The decline layer assumes a **static world population**: characters
  don't visibly age during a season unless `birthWorldDay` ticks —
  the knots matter mainly for *where each character sits* at sim start
  plus slow drift. `deathDay` is opt-in; nothing forces its use.
- Reserve's 10-year shift is a compression-pattern simplification;
  the real literature reports hazard ratios, not year offsets
  **[HYPOTHESIS call, documented]**.
- Terminal-decline magnitudes are scaled to game days loosely
  (43 months ≈ 1100–1300 game days at 1:1); if game time compresses
  (e.g., 1 game day = 2 real hours), the window should be rescaled —
  left to game-systems, flagged here.
- We do not model dementia/MCI as such; `reserve` low + `deathDay`
  set + terminal params maxed approximates pathological aging, but
  no character should be *written* as demented via these params —
  that is a narrative choice for world-builder, not ours.
- Ret_noise is added to drive, not to stored state — aging makes
  retrieval noisy, it does not scramble archives faster than β does.

---

# Part II — v16: the compensation layer (what aging minds do *differently*, not just worse)

Part I (§§1–16) formalized the deficit machinery. Part II adds the
asymmetric side — the channels where older adults are selective,
positive, schema-scaffolded, socially compensated, and confidently
wrong in characteristic ways. Every finding lands in a spec parameter
(v0.4 → v1.6), a knot row (§30), or a probe (P145–P153). Same tagging:
[CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 17. Value-directed remembering — selectivity is the spared strategy

- Castel, Benjamin, Craik & Watkins 2002; Castel et al. 2007/2011;
  reviewed Castel 2023 (Curr Opin Psychol): on selectivity tasks (items
  carry point values, maximize score), older adults recall FEWER items
  overall but are **equally or MORE selective** — high-value items are
  recalled at young-adult rates while low-value items are abandoned.
  **[CONSENSUS pattern]**
- Murphy et al. 2020 (conative factors): older adults are MORE
  selective AND less confident; task-specific motivation, not
  self-efficacy, drives the selectivity. Hoover et al. 2025: the
  selectivity *fails* when high-value items are intrinsically hard to
  remember — value steers effort, it can't override memorability.
  **[CONSENSUS + boundary condition]**
- Functional reading: with capacity scarce, the old system prices
  importance more steeply. The deficit is not uniform — it is a
  **reweighting**.

**Spec consequence (v1.6):** `value_select(age_eff)` sharpens the
importance term in E (§2). Let `importance = max(selfRelevance,
goalRelevance)` (goalRelevance = predictionError routed to a goal;
default = selfRelevance alone). Then
`E *= (1 + value_select·(2·importance − 1))` — at value_select 0.5 a
max-importance event gets ×1.5 while a zero-importance one gets ×0.5.
Knots: 0.0 ≤40 → 0.3 at 70 → 0.5 at 85. This is the encoding-side
implementation of "grandmother forgets the errand, never the
granddaughter's visit" — and the reason older characters' surviving
records skew consequential. Reserve-applicable (it is a capacity-
sensitive strategy). **[CONSENSUS phenomenon; functional form
HYPOTHESIS]**

## 18. Positivity effect — the encoding/selection side

- Socioemotional selectivity (Carstensen 1992+; Carstensen, Isaacowitz
  & Charles 1999): shrinking time horizons reprioritize emotional
  satisfaction over information acquisition — older adults prefer,
  attend, and remember positive over negative.
- Reed, Chan & Mikels 2014 meta (100 studies, N=7,129): reliable
  age×valence interaction — older adults show positive bias
  (dbias≈+.13), young adults NEGATIVE bias (−.12); the effect is
  large only where processing is unconstrained (d=.482 vs .134
  constrained). **[CONSENSUS that the effect exists and is
  resource-dependent; SST's motivational account DEBATED vs
  neural-decline accounts]**
- Mather & Knight 2005: cognitive load abolishes the positivity
  effect — it is goal-driven and resource-hungry, not a leak.

**Spec consequence (v1.6):** `positivity_gain(age_eff)` knots
0 ≤40 → 0.15 at 60 → 0.35 at 85; effective
`pos_eff = positivity_gain·(1 − daLoad)·(1 − cueContext.stress or
encoding-stress proxy)` — under load or threat it collapses (Mather &
Knight). Applied twice: (a) encoding — `E` gets
`×(1 + pos_eff·valence)` for valence>0 and `×(1 − 0.5·pos_eff·|valence|)`
for valence<0 (positive attended more, negative filtered); (b)
retrieval selection — among near-tied candidates (drive within 0.05)
prefer the positive-valence record with probability `pos_eff`.
Note: `neg_affect_decay` (§4.5) already owns the retention-side
asymmetry; this is the encoding/attention/choice side — both needed,
they compound. Deliberately NOT reserve-shifted: positivity is
motivational reorientation, not fluid capacity (SST).

## 19. Hyper-binding — too many associations, not too few

- Campbell, Hasher & Thomas 2010 (Psych Sci): older adults
  incidentally bind task-irrelevant distractors to targets — later
  paired-associate learning shows a *preserved-pair advantage* in old
  only. Campbell & Hasher, Trelle & Hasher 2024 review (Curr Dir):
  hyper-binding is implicit-only (abolished when the relevance of the
  connection is revealed), driven by failed attentional down-
  regulation, and a plausible contributor to older adults' retained
  real-world covariation knowledge. **[CONSENSUS pattern; functional
  significance DEBATED]**
- This reframes Part I's link_p decline (associative deficit,
  Naveh-Benjamin 2000): older adults don't form FEWER associations —
  they form the WRONG ones (no control over which). Both live in the
  model: link_p down AND hyperbind_p up.

**Spec consequence (v1.6):** `hyperbind_p(age_eff)` knots
0.05 ≤40 → 0.15 at 70 → 0.3 at 85. On encodeEvent, with probability
`hyperbind_p·(1 − awareness)` (awareness = event flagged
`boundary:true` or selfRelevance ≥0.8 — explicit, goal-directed
processing suppresses it, Campbell 2024 implicit-only finding), ONE
verbatim slot is filled from a co-present but causally unrelated
context feature — a hidden `hyperbound` flag marks it. Downstream
these fields surface as confident, vivid, wrong detail ("the red
scarf — no wait, that was the funeral"). Shares machinery with
`offtarget_p` (§5.19) but is storage-side (bound at birth) vs
emission-side. Also gives old characters occasional *true* spare
associations — small `link_p` refund on co-occurring pairs.

## 20. Destination memory — "stop me if I've told you this"

- Gopie & MacLeod 2009 (Psych Sci): older adults disproportionately
  impaired on destination memory (to WHOM a fact was told) vs spared
  item memory — and critically, more CONFIDENT misses: they believe
  they hadn't told someone they had → repeated tellings to the same
  listener. Reversed direction (who told ME — source memory) showed no
  age difference in their design. **[CONSENSUS pattern]**
- El Haj, Fasotti & Allain 2012; El Haj et al. 2017 review: the
  deficit is binding-flavored (content↔destination association), and
  older adults remember OLDER destinations better — a destination-side
  own-age bias tied to social exposure. **[CONSENSUS-ish]**

**Spec consequence (v1.6):** records gain hidden `toldTo:
{personId: day}` (retell writes it). On `retell(charId, audienceId,
record)`: with probability `1 − dest_mem(age_eff)` the audience check
is skipped/misses — `dest_mem` knots 0.9 young → 0.7 at 70 → 0.55 at
85 — and the retell proceeds, emitting `alreadyTold: true` to the
dialogue layer (it can render the listener's "you told me" beat or
not). Misses not false-alarms dominate (Gopie's asymmetry): old
characters repeat stories to the same person far more than they
wrongly withhold. `dest_mem` scaled by destination familiarity —
`×min(1, familiarity(dest)·oab-share)` is left to PersonModel; the
own-age destination tilt is noted but not parametrized (small).

## 21. Context decays faster than content (Spencer & Raz)

- Spencer & Raz 1995 meta (46 studies): age differences in CONTEXT
  memory (source, time, place) are reliably LARGER than in content
  memory — greatest for contextual features encoded independently of
  content. Retrieval effort moderates content gaps, not context gaps.
  **[CONSENSUS meta]**
- We already encode this partially via `beta_source` age knots; this
  meta extends it to where/when and formalizes the ratio.

**Spec consequence (v1.6):** `ctx_loss(age_eff)` knots 1.0 ≤50 →
1.25 at 70 → 1.5 at 85 multiplies the decay on verbatim `where`,
`when`, and the source-confidence channel RELATIVE to `what`/`who`.
In §6.15: `date_sigma_eff = date_sigma·ctx_loss` and `orderBefore`'s
S-gradient denominator widens — ordering survives dating (already
true) but the gap between date error and order error widens with age.

## 22. Misrecollection — confident and wrong (Dodson & Krueger)

- Dodson & Krueger 2006 (eyewitness paradigm): matched for overall
  accuracy, older adults make suggestibility errors **most when most
  confident** — young adults err when uncertain, old adults err with
  certainty. Dodson, Bawa & Krueger 2007: metamonitoring impairment
  specific to detail-demanding tasks (source ID, cued recall) — spared
  on old/new recognition and general knowledge. Shing et al. 2008:
  lifespan — high-confidence errors are an OLD-AGE signature, children
  at matched accuracy don't show it. **[CONSENSUS pattern]**
- Mechanism: feature miscombination produces coherent-feeling false
  detail — the misrecollection account fits our phantom/merge/hyperbind
  machinery exactly.

**Spec consequence (v1.6):** `conf_inflate_old(age_eff)` knots
0 ≤50 → 0.08 at 70 → 0.15 at 85 — added into §3's `conf_out` ONLY when
the reconstruction contains any of: phantom content, merged/generic
substitution, hyperbound field, or lure-accepted recognition. Young
characters' conf_out is already best-calibrated where accuracy is
highest; this term inverts the coupling in old age — the oldest
characters are most certain exactly where they are most wrong. It is
report-side only (never stored).

## 23. Prior-knowledge scaffold — schemas carry what the trace can't

- Castel 2005; Umanath & Marsh 2014 review; Badham, Estes & Maylor
  2012: schema-consistent material is relatively SPARED in aging —
  prior knowledge scaffolds encoding and retrieval; the benefit grows
  with the density of the semantic store. Related to §1 environmental
  support but distinct: the support here is internal (knowledge), not
  external (cues). **[CONSENSUS pattern]**

**Spec consequence (v1.6):** `schema_support(age_eff)` knots
0.05 young → 0.15 at 70 → 0.25 at 85 — on encodeEvent, if the event's
cue tags overlap a semantic record with strength ≥ know_protect_thresh,
`E += schema_support·overlap` (bounded +0.15). The old professor's
domain events encode at near-midlife rates; genuinely novel content
gets no scaffold. Reserve-correlated in practice (dense stores =
bigger scaffold) — implementers should compute overlap against the
semantic store, not the trait.

## 24. Stereotype threat — evaluative contexts tax the old

- Hess et al. 2003; Lamont, Swift & Abrams 2015 meta (82 effects,
  N=3882): age-based stereotype threat d=.28 (corrected .32) —
  stereotype-based manipulations d=.52, cognitive-task outcomes d=.36.
  Armstrong et al. 2017 (J Gerontol B) episodic-memory-specific meta:
  d=.373 — and critically, the effect reaches significance for
  **free recall only** (not cued recall, not recognition) and only on
  immediate tests. **[CONSENSUS meta; moderator pattern CONSENSUS]**

**Spec consequence (v1.6):** `cueContext.evaluative: true` (the
character knows their memory is being judged — a doctor's question, a
pointed "do you remember?") applies `θ += stereo_suscept·0.06·
stereo_age_gate(age_now)` where `stereo_age_gate` = 0 below 50,
ramps to 1 by 70, and `stereo_suscept` ∈[0,1] is a TRAIT (loads on
neurot/distrust — characters who fear being seen as senile are hurt
most). **Recall mode only** — recognition mode exempt (Armstrong's
moderator). The clean behavioral read: the same elder who reminisces
fluently over dinner blanks when formally quizzed. Not
reserve-shifted (a self-presentation effect, not capacity).

## 25. Gist-based false memory scales with age

- Balota et al. 1999 (DRM in old age); Tun et al. 1998; Koutstaal &
  Schacter 1997: older adults falsely recall/recognize critical lures
  MORE than young — verbatim suppression of gist-falsity weakens
  (fuzzy-trace). False recognition is attenuated when distinctive
  verbatim survives — which §6.8 already prices via (1−verbatimStrength)
  ·discrim_mult. **[CONSENSUS]**

**Spec consequence (v1.6):** old-side age knots on the v0.6 phantom
machinery — `phantom_p` 0.02 → 0.05 at 80, `gist_lure_gain` 0.3 →
0.5 at 80 (knot table §30). No new mechanism; the knots were
informal in profiles §E and are now curve-formalized. Pairs with
§22: the inflated-confidence channel is what makes these dangerous.

## 26. Collaborative compensation — the old couple remembers together

- Harris, Keil, Sutton, Barnier & McIlwain 2011 (Discourse Proc, 12
  couples): older married couples show collaborative *facilitation*
  in some dyads, not the standard stranger-pair inhibition — strategy
  sharing predicts success. Barnier et al. 2014 (JARMAC "Reaping what
  they sow", Addis-paradigm): older long-married couples generated MORE
  internal (episodic) details together than alone; young couples
  showed no gain. Harris, Barnier, Sutton & Keil 2014 (Memory
  Studies): couples as distributed cognitive systems — transactive
  directories offload each partner's decline. **[CONSENSUS direction
  in long-term intimate dyads; NOT generalizable to strangers —
  collaborative inhibition stands there]**

**Spec consequence (v1.6):** `collab_partner_gain(age_eff)` knots
0 ≤40 → 0.15 at 70 → 0.25 at 85 — in `groupRecall` (§6.13), when a
partner's PersonModel shows high familiarity AND high credibility,
`collab_size_pen` is waived and `collab_factor` gains
`+collab_partner_gain` for the old member only. Lifelong couples
function as each other's environmental support (§1) — the rumor/
reminiscence engine gets a real dyadic scaffold, and widowed old
characters lose measurably more than their married peers (grief as
memory loss — emergent, correct).

## 27. Sensory encoding decline — the Proust channel narrows at intake

- Doty et al. 1984 (UPSIT, n>1900): olfactory identification declines
  markedly after ~60; smell loss is among the earliest sensory
  declines and predicts cognitive decline. Olfactory *cues*, when
  encoded, still reach old memories (§5 sensory_age_slope intact —
  Willander & Larsson 2007 odor-cued AMs skew earlier).
  **[CONSENSUS for the decline; interaction with our cue mechanics
  is HYPOTHESIS wiring]**

**Spec consequence (v1.6):** `w_sensory` gains old-side knots:
0.10 → 0.07 at 70 → 0.05 at 85 (encoding-side weight — fewer odor/
texture cue keys written). `sensory_age_slope` unchanged: when an old
character DID encode the smell, it still reaches the deepest archive.
Net effect: sensory-triggered reminiscence becomes rarer with age but
no shallower — consistent with involuntary-memory work showing
odor-cued AMs are old-dated in elders (Rubin & Schulkind 1997).

## 28. Misinformation in aging — the nuance is confidence, not adoption

- Dodson & Krueger 2006: matched for event memory, older adults are
  NOT dramatically more suggestible — they are more CONFIDENT in their
  suggestibility errors. Dodson, Bawa & Slotnick 2007: source memory
  deficits make misattribution the real channel. Wang et al.
  (cognitive-interview work cited there): retrieval warnings reduce
  misleading-information reporting **equally** across age.
  **[CONSENSUS-ish: adoption gap smaller than confidence gap;
  warnings work]**

**Spec consequence (v1.6):** DO NOT steepen `misinfo_suscept`'s old
knots — keep ~0.35→0.50 as now. The age signature lives in (a)
`conf_inflate_old` on adopted content (§22) and (b)
`source_confuse`/`beta_source` old knots (source loss is the
admission vector). `warn_mult` stays age-flat — warnings work on
elders (explicitly checked against the literature's warning-efficacy
finding). This is a deliberate non-change with a citation — the
wrong model here doubles the adoption gap and misses the real one.

## 29. Mechanism debate — compensation vs dedifferentiation

- HAROLD (Cabeza 2002): older brains recruit bilateral frontal
  circuits — is that compensation or dedifferentiation? CRUNCH
  (Reuter-Lorenz & Cappell 2008): over-recruitment at low load,
  capacity ceiling at high load. STAC (Park & Reuter-Lorenz 2009):
  scaffolding vs decline. **[DEBATED — neural-level, we take no
  position]**

Functional consequence only: our model already encodes the
*behavioral* shadow — `env_support_gain` (support rescues),
`ret_noise` (inconsistency), `search_breadth` (ceiling). The debate
doesn't change any parameter; it warns against interpreting
reserve/age_eff as "brain health" — it's behavioral compression.

## 30. Part II knot rows (extends §13 — all evaluated at age_eff
    unless noted; NOT reserve-shifted: positivity_gain, stereo_suscept)

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| value_select | 0.0 | 0.05 | 0.15 | 0.3 | 0.42 | 0.5 | Castel 2002/2023 |
| positivity_gain | 0.0 | 0.02 | 0.08 | 0.2 | 0.3 | 0.35 | Reed&Chan&Mikels 2014 |
| hyperbind_p | 0.05 | 0.06 | 0.1 | 0.15 | 0.25 | 0.3 | Campbell 2010/2024 |
| dest_mem | 0.9 | 0.88 | 0.8 | 0.7 | 0.6 | 0.55 | Gopie&MacLeod 2009 |
| ctx_loss | 1.0 | 1.0 | 1.1 | 1.25 | 1.4 | 1.5 | Spencer&Raz 1995 |
| conf_inflate_old | 0.0 | 0.0 | 0.03 | 0.08 | 0.12 | 0.15 | Dodson&Krueger 2006 |
| schema_support | 0.05 | 0.07 | 0.1 | 0.15 | 0.2 | 0.25 | Castel 2005; Umanath&Marsh |
| stereo_suscept (trait, ×gate) | — | — | — | — | — | trait | Lamont 2015; Armstrong 2017 |
| collab_partner_gain | 0.0 | 0.02 | 0.07 | 0.15 | 0.22 | 0.25 | Harris 2011; Barnier 2014 |
| w_sensory (old-side) | 0.10 | 0.10 | 0.08 | 0.07 | 0.055 | 0.05 | Doty 1984 |
| phantom_p (knot update) | 0.02 | 0.02 | 0.025 | 0.035 | 0.045 | 0.05 | Balota 1999; Tun 1998 |
| gist_lure_gain (knot update) | 0.3 | 0.32 | 0.36 | 0.42 | 0.47 | 0.5 | Koutstaal&Schacter 1997 |

**[All knot interpolations HYPOTHESIS; anchors CONSENSUS.]**

## 31. Spec changes v0.4 → v1.6 (delta summary)

| # | Change | Grounding |
|---|---|---|
| F1 | §2: `value_select` importance sharpening + `positivity_gain`
     valence asymmetry (load/stress-gated) + `schema_support`
     knowledge-scaffold gain + `hyperbind_p` wrong-field binding
     (hidden `hyperbound` flag) + `w_sensory` old-side knots | §§17–19, 23, 27 |
| F2 | §3: `conf_out += conf_inflate_old` when reconstruction carries
     phantom/merged/hyperbound/lure content — confident-and-wrong | §22 |
| F3 | §5.4: `evaluative` cueContext → θ bump via `stereo_suscept·
     stereo_age_gate`; RECALL ONLY | §24 |
| F4 | §6.11: `toldTo` map + `dest_mem` miss-probability; retell emits
     `alreadyTold` | §20 |
| F5 | §6.8: `phantom_p`/`gist_lure_gain` old-side knots formalized | §25 |
| F6 | §6.13: `collab_partner_gain` — intimate-pair facilitation | §26 |
| F7 | §6.15: `ctx_loss` on date_sigma/orderBefore | §21 |
| F8 | §4.8: reserve list += value_select, hyperbind_p, dest_mem,
     ctx_loss, conf_inflate_old, schema_support, collab_partner_gain | §8 |

New params: `value_select`, `positivity_gain`, `hyperbind_p`,
`dest_mem`, `ctx_loss`, `conf_inflate_old`, `schema_support`,
`stereo_suscept`, `collab_partner_gain` (+ `stereo_age_gate` frozen
shape). Knot updates: `w_sensory`, `phantom_p`, `gist_lure_gain`.
Record field: `toldTo` (hidden). Frozen constants: `stereo_age_gate`
shape (0 below 50 → 1 by 70).

## 32. Validation probes P145–P153

- **P145 value selectivity (MUST):** same event stream graded by
  importance tags → 75yo's recall rate spread between top- vs
  bottom-quartile importance ≥2× the 25yo's spread, while overall
  recall is lower (Castel signature — selectivity preserved, capacity
  lost). Constrains `value_select`.
- **P146 positivity (MUST):** valence-balanced event set → 75yo recall
  skews positive (pos_rate − neg_rate ≥ +0.15) and the skew VANISHES
  under `daLoad`/`stress` context (Mather & Knight sign-lock);
  25yo skews mildly negative (Reed meta: young dbias −.12).
  Constrains `positivity_gain`.
- **P147 hyperbinding (SHOULD):** events with salient distractor
  context → old records contain ≥3× more `hyperbound` fields; the
  fields surface with above-median confidence at recall; explicit-
  attention events suppress the rate (implicit-only sign-lock).
  Constrains `hyperbind_p`.
- **P148 destination memory (MUST):** 75yo re-tells a live record to
  the SAME listener at ≥3× the 25yo rate; withhold-from-wrong-person
  (false alarm) rate stays low both ages (Gopie's miss asymmetry).
  Constrains `dest_mem`, `toldTo`.
- **P149 context-content gap (SHOULD):** survival curves per verbatim
  field class → where/when die before what/who, and the ratio widens
  with age (~1.5× at 85). Constrains `ctx_loss` (Spencer & Raz).
- **P150 confident-and-wrong (MUST):** among reconstruction errors,
  high-confidence (≥0.8) share rises with age while overall error
  rate is matched to a young cohort — the Dodson inversion; young
  cohort's errors concentrate at LOW confidence. Constrains
  `conf_inflate_old`.
- **P151 schema scaffold (SHOULD):** domain-congruent vs novel events
  → old cohort's E gap between them ≥2× young cohort's; semantic-
  store density mediates (sparse-store elder: no scaffold).
  Constrains `schema_support`.
- **P152 stereotype threat (SHOULD):** evaluative recall context
  lowers old recall (θ gate) but NOT recognition — mode-specific
  (Armstrong sign-lock); young cohort unaffected. Constrains
  `stereo_suscept`, `stereo_age_gate`.
- **P153 couple compensation (SHOULD):** groupRecall on an old
  intimate dyad ≥ solo union output (facilitation allowed); old
  stranger pair < solo (inhibition preserved). Constrains
  `collab_partner_gain` (Barnier 2014 crossover).

## 33. Part II honest limits

- Positivity magnitudes are small (dbias .13) — the knots are tuned
  for legibility (~3× literature), flagged calibration choice as in
  Part I's pessimism note.
- `hyperbind_p` fields are written at birth — we deliberately do NOT
  model the implicit-only caveat in retrieval (awareness gate at
  encoding is the functional approximation).
- `dest_mem` reuses the PersonModel familiarity channel rather than a
  dedicated destination store — adequate for the behavior, not the
  mechanism.
- `stereo_suscept` is trait-loaded but the gate is age-only;
  stereotype-awareness × exposure history is bible-level texture we
  leave to world-builder.
- None of Part II rescues terminal decline — the §9 ramp still
  overrides all compensations (dedifferentiation is the floor).

---

# Part III — v28: the paradox layer (where aging inverts the deficit)

Parts I–II built the deficit and compensation machinery. Part III takes
the findings where age *reverses* or *dissociates* the expected effect:
prospective memory spared in the wild, knowledge that shields elders
against fluent falsehoods, involuntary recall holding while voluntary
dies, complaints that outrun the deficit. Every section lands in spec
v2.8 params (§45 knot rows), a probe (P263–P273), or a cited
non-change. Tagging: [CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 34. The prospective-memory paradox — lab deficit, life spared

- Rendell & Thomson 1999 (J Gerontol B 54B:P256, n=380): same
  participants — 60s/80+ *superior* to young on a naturalistic
  week-long PM task while showing the standard deficit on lab
  event-based and time-based PM. Rendell & Craik 2000 (Virtual Week /
  Actual Week, Appl Cogn Psychol 14:S43): the board-game version keeps
  the young advantage; the real-life week flips it.
  **[CONSENSUS phenomenon — the "age-PM paradox"]**
- Rose et al. 2009 (Psychol Aging, a0019771): within Virtual Week,
  age differences concentrate on *irregular, nonfocal* tasks; regular
  and focally-cued tasks show reduced age differences and improve over
  the week — WM predicts exactly the irregular-nonfocal cell.
  **[CONSENSUS moderator structure]**
- The paradox resolves to machinery we already have: naturalistic PM
  is cue-rich (the pill bottle on the counter, the standing Tuesday
  coffee) — environmental support (§1) applied to intentions. Lab PM
  is deliberately cue-sparse — the self-initiation tax (§5.4) applied
  prospectively.

**Spec consequence (v2.8):** split the intention channel by cue
support, mirroring the retrospective asymmetry:

- `pm_focal` — focal intentions (cue arrives inside the ongoing task's
  own cue field): **no age knots — explicit null.** Focal PM rides the
  §5.14 hit rule, which is env-supported. Guarded by P263.
- Nonfocal/time-based: `pm_self` old knots stand (declines — this IS
  the lab deficit).
- `pm_habit_gain` (new, knots 0 ≤40 → 0.2 at 70 → 0.35 at 85): an
  intention that has fired before on the same cue class gains
  `+pm_habit_gain·min(1, fires/5)` on its next fire probability —
  repeated errands become *more* reliable for old characters, not less
  (Virtual Week over-the-week improvement; habitual-PM sparing,
  Einstein & McDaniel tradition). Routine is the elder's prosthesis.
- `impl_intent_gain` gains an age gate `ii_age_gate`: 1.0 ≤60 →
  1.4 at 65–75 → 0.8 ≥76. Chasteen, Park & Schwarz 2001 (>2×
  self-initiation gain, older adults only); Schnitzspahn et al. 2009
  lifespan (benefit old, not young); Kretschmer-Trendowicz et al.
  2009 (old-old 76–90: no benefit, event-based arm impaired — the
  rescue itself needs residual resources). **[CONSENSUS that II helps
  young-old; old-old boundary CONSENSUS-ish single-study]**

## 35. Synchrony II — the antipeak breeds false memories

- Intons-Peterson, Rocchi, West, McLellan & Hackney 1999 (JEP:LMC
  25:23, 3 experiments): at *nonoptimal* times of day, older adults —
  and only they — show elevated false memory for thematically related
  lures; recall drops but recognition accuracy is matched.
  **[CONSENSUS pattern]**
- Mechanism reads cleanly off §3 (Part I): inhibition is the
  circadian-sensitive resource — off-peak, the gate that rejects
  similar-but-wrong candidates is weakest, in exactly the population
  whose `discrim_mult` is already low.

**Spec consequence (v2.8):** `lure_accept` and `gist_lure_gain` gain a
synchrony multiplier: at retrieval, if `peak_hour` set and
`Δh = |tod − peak_hour| > 6`, then
`lure_accept *= (1 + sync_lure_gain·lure_sync_gate(age_now))` with
`sync_lure_gain` ≈ 1.0 and `lure_sync_gate` = 0 below 50 ramping to 1
by 70 (same shape as `stereo_age_gate`, separate frozen function —
the mechanisms differ). Grandma's confident misidentifications cluster
at 9pm, not 9am. Recognition mode only (recall has its own θ tax via
`synchrony_gain` already).

## 36. The residual learning channels — enactment flat, errorful costly

- Rönnlund, Nyberg, Bäckman & Nilsson 2003 (Betula, n=1000, 35–80):
  subject-performed tasks and verbal tasks decline **in parallel** —
  the SPT advantage survives to 80 unchanged while the baseline falls.
  Enactment does not rescue aging; it just never stops working.
  **[CONSENSUS]**
- Tse, Balota & Roediger 2010 (Psychol Aging a0019933): face–name
  pairs — middle-aged benefit from repeated testing over restudy;
  older adults benefit only **with feedback**; without feedback,
  restudy beats testing for the old. Meyer & Logan 2013: testing
  effect intact for prose in young-old. **[CONSENSUS pattern:
  retrieval practice works for elders *when it succeeds*; errorful
  practice doesn't pay]**

**Spec consequence (v2.8):** two changes, one deliberate non-change:

- `enact_gain` gets **no old-side knots — explicit null** (the boost is
  flat; the baseline it rides on declines). P266.
- `potent_gain` (failed-recall potentiation, §4.11) gains old-side
  knots: 1.0 ≤50 → 0.75 at 70 → 0.55 at 85 — the Tse crossover,
  parameterized. But the potentiation fires only if a subsequent
  *successful* recall or correction (feedback channel: retell
  listener, re-encounter) lands within `potent_window` ≈ 2 days;
  unfed failures in old age consolidate nothing.
- `reexp_ratio` untouched — re-exposure learning is the spared channel
  for the old, matching Tse's restudy arm.

## 37. Illusory truth in aging — knowledge shields where knowledge exists

- Fazio, Brashier, Payne & Marsh 2015 (JEP:G 144:993): repetition
  inflates truth ratings *even for known-false statements* — young
  adults show "knowledge neglect," relying on fluency with knowledge
  in hand. **[CONSENSUS]**
- Brashier, Umanath, Cabeza & Marsh 2017 (Psychol Aging 32:308): the
  age interaction *reverses* the naive prediction — **older adults
  rely on knowledge in the face of fluency**; protected against the
  illusion where their (larger) knowledge store contradicts the claim,
  vulnerable where it doesn't. Parks & Toth 2006: with knowledge
  absent, fluency drives the illusion in elders normally.
  **[CONSENSUS — and a correction to the lazy "elders believe
  everything repeated" model]**

**Spec consequence (v2.8):** the rumor engine's `believe_p` (§6.7)
gains a knowledge channel: `w_corr_eff = w_corr·(1 +
know_corr_gain·know_density)` where `know_corr_gain` ≈ 0.5 and
`know_density` = share of the claim's topic tags covered by semantic
records at strength ≥ `know_protect_thresh` (reuse). Elders accumulate
density over a life → truth-checking *improves* on familiar ground
while `rep_gain` stays **age-flat (explicit null)** — the fluency
channel is unchanged. Net: an old character is *harder* to fool on
home turf (their neighborhood, their trade) and exactly as gullible
off it — the honest version of "set in their ways." P268 sign-locks
both arms.

## 38. Reality monitoring — "did I do it, or just decide to?"

- Henkel, Johnson & De Leonardis 1998 (JEP:G 127:251): older adults
  falsely claim *imagined* items were perceived — selectively for
  items **similar** to actually-seen ones; the phenomenal features of
  their true and misattributed memories overlap more than young
  adults'. Hashtroudi, Johnson & Chrosniak 1989: internal/external
  source confusion ages harder than item memory. **[CONSENSUS]**
- Cohen & Faulkner 1989: imagined vs *performed* self-actions —
  elders confuse intentions with executions (planned ≠ done).

**Spec consequence (v2.8):** `rm_self_confuse(age_eff)` — knots
0.03 ≤50 → 0.10 at 70 → 0.18 at 85 — applied when a source
resolution involves a self-action record vs an
intention/simulation record with similarity ≥ `interf_thresh`:
`P(flip imagined→done) = rm_self_confuse·sim`, half rate the other
direction. This powers the absent-mindedness beat: "I can't remember
if I locked the door or just meant to" — and feeds the existing
verify-mode (`check_conf_loss`) economy. Combines with §20
destination memory: old characters misremember *which version of
themselves* acted.

## 39. Effortful listening — the sensory tax on encoding

- Rabbitt 1968/1991 channel-capacity finding: comprehending degraded
  speech consumes the resources that would have encoded it — recall
  for heard material suffers even when comprehension succeeds.
  Pichora-Fuller effortfulness hypothesis. **[CONSENSUS mechanism]**
- Lin et al. 2011 (Arch Neurol 68:214, BLSA n=639): incident dementia
  HR 1.89 mild / 3.00 moderate / 4.94 severe hearing loss; ~1.27 per
  10 dB. Marker-vs-cause unresolved. **[CONSENSUS association; causal
  status DEBATED — we model the encoding channel only]**

**Spec consequence (v2.8):** `hearing` trait ∈[0,1] (population mean
drifts ~0.95 → ~0.7 across 50→85, trait-jittered per profile);
`noise_cost` ≈ 0.4: for verbal-channel events (conversations, spoken
instructions) in contexts flagged `noise_level` > 0.3,
`E *= 1 − noise_cost·(1 − hearing)·noise_level`. Encoding-side only —
what was never heard can't be retrieved. Long-run wiring
**[HYPOTHESIS]**: `hearing < 0.6` halves effective social-contact
accrual → feeds the §40 isolation overlay. The crowded-bar scene is a
memory-writing tax for exactly one character in it.

## 40. The isolation overlay — perceived loneliness erodes, slowly reversible

- Wilson et al. 2007 (Arch Gen Psychiatry 64:234, n=823): loneliness —
  *perceived* isolation, controlling for social network size — doubled
  AD risk and steepened cognitive decline; crucially, unrelated to AD
  pathology at autopsy. Whatever loneliness does, it does not write on
  the plaques — it writes on the state. **[CONSENSUS association;
  pathway DEBATED; reversibility HYPOTHESIS]**

**Spec consequence (v2.8):** `isolation` joins the §4.17 overlay
family. Rolling 14-day social-contact mean < `iso_floor` (≈1.5
meaningful interactions/day) sustained for `iso_onset` (≈30 days) →
overlay ON: `beta_episodic += iso_beta` (0.1), `enc_base − 0.05`,
`positivity_gain × 0.5`, nonfocal PM −0.1. Overlay OFF when contact
≥ floor for 14 days; params recover linearly over `iso_recovery`
(≈60 days) — slower to heal than to wound. Bereavement link:
`partnerDeath` event zeroes the `collab_partner_gain` channel (§26)
*and* jumps the contact ledger — widowhood is a memory intervention,
which is what Part II §26 already implied at the dyad level.
**[Overlay structure HYPOTHESIS built on CONSENSUS association]**

## 41. Metamemory split — the complaint outruns the deficit

- O'Connor et al. 1990 (Arch Neurol — memory complaints associate
  with depressed mood more than test performance); Pearman &
  Storandt 2004: only the self-efficacy factors discriminate
  complainers from non-complainers — not ability. SAGE baseline
  (n=1000): complaints vs objective ρ ≈ −.12; vs depression ρ ≈ .44.
  **[CONSENSUS — complaints track mood and self-efficacy, not
  performance]**
- FOK/monitoring accuracy by contrast is roughly spared (Hertzog &
  Dunlosky review; consistent with our `fok_age_noise` being small).

**Spec consequence (v2.8):** report-side only. `self_est_bias` gains
old-side knots: 0 → −0.06 at 70 → −0.12 at 85 (systematic
under-estimation), and `complaint_k` knots up ~1.5× by 85, plus
`complaint_k += 0.2·depress_state` (complaints ride mood, not
memory). `metamem_r` and FOK machinery get an **explicit null** —
no additional age knots: the elder knows *which* items are gone
(accurate monitoring) while believing the whole system is worse than
it is (deflated self-efficacy). The sentence "my memory isn't what it
was" is itself evidence *for* working metamemory. P272.

## 42. The involuntary highway — ambient recall holds while search fails

- Schlagman, Kvavilashvili & Schulz 2007; Schlagman, Schulz &
  Kvavilashvili 2006: involuntary AMs show **no age deficit in
  specificity** while voluntary AMs do; elders' involuntary memories
  skew more positive (content analysis). Schlagman, Kliegel, Schulz &
  Kvavilashvili 2009 (Psychol Aging, a0015785): involuntary
  *frequency* roughly preserved; voluntary slower and less specific.
  **[CONSENSUS pattern — the voluntary/involuntary asymmetry is the
  cleanest spared/impaired contrast in the aging literature]**

**Spec consequence (v2.8):** the §5.7 ambient scan gets an
**explicit null** on rate (already age-flat by v2.6 rule — now
doubly anchored) plus `invol_pos_gain` knots 0 ≤50 → 0.08 at 70 →
0.15 at 85 — a valence bias on *emitted* involuntary recalls,
compounding `positivity_gain` at the emission layer (Schlagman
content finding). And involuntary recalls earn full §5.9 reboost:
for old characters the ambient channel is the main rehearsal
economy — the past keeps itself alive through the senses while
deliberate search atrophies. `invol_remote_gain` (≈0.2 at 75+)
nudges the ambient scan's record-age prior upward — involuntary
recall skews bump-era/remote in elders (Schlagman 2009
distribution).

## 43. Crystallized keeps accreting — the semantic plateau is positive

- Park et al. 2002; Verhaeghen 2003 vocabulary meta: semantic/verbal
  knowledge grows into the 50s–60s before flattening. Rönnlund 2005
  (§11): semantic rises to ~55, mild decline after.
  **[CONSENSUS]**

**Spec consequence (v2.8):** knot-table update on semantic encoding:
`enc_sem_mult` — 1.0 ≤40 → 1.05 at 55 → 1.0 at 70 (the only
encoding term that ever goes *up* with age). Pairs with §37's
`know_density`: the old knowledge base is simultaneously the best
truth-checker and the deepest permastore. Small by design — this is
a slope, not a rescue.

## 44. Medication burden — the reversible clouding overlay

- Gray et al. 2015 (JAMA Intern Med 175:401, n=3434): cumulative
  strong-anticholinergic exposure → incident dementia HR up to ~1.5
  in the highest tertile; causality **DEBATED** (protopathic bias —
  prodromal prescribing). Acute anticholinergic impairment is the
  reversible part. **[CONSENSUS acute effect; chronic link DEBATED]**

**Spec consequence (v2.8):** `med_antichol` overlay (§4.17 family):
while active — `theta +0.05`, `enc_base −0.05`, `ret_noise +0.03`,
nonfocal PM −0.1; fully removed on stop (no permanent marks, matching
the acute-reversibility finding). Deliberately does NOT feed
`age_eff` — we model the state, not the hazard ratio. This gives
world-builder a cheap "the medication fogs her" dial that undoes
cleanly.

## 45. Part III knot rows (extends §30; age_eff unless noted)

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| pm_habit_gain | 0.0 | 0.05 | 0.1 | 0.2 | 0.3 | 0.35 | Rose 2009; Virtual Week |
| ii_age_gate (×impl_intent_gain) | 1.0 | 1.0 | 1.2 | 1.4 | 1.0 | 0.8 | Chasteen 2001; K-T 2009 |
| sync_lure_gain (antipeak ×) | 0.0 | 0.0 | 0.3 | 0.7 | 0.9 | 1.0 | Intons-Peterson 1999 |
| potent_gain (×, knot update) | 1.0 | 1.0 | 0.9 | 0.75 | 0.6 | 0.55 | Tse 2010 no-feedback arm |
| rm_self_confuse | 0.03 | 0.04 | 0.06 | 0.1 | 0.15 | 0.18 | Henkel 1998; Cohen 1989 |
| know_corr_gain (×w_corr, ×density) | 0.2 | 0.3 | 0.4 | 0.5 | 0.5 | 0.5 | Brashier 2017 |
| hearing (trait mean) | 0.98 | 0.95 | 0.9 | 0.82 | 0.74 | 0.7 | Lin 2011 severity mix |
| noise_cost (max E cut) | — | — | — | — | — | 0.4 | Rabbitt; Pichora-Fuller |
| invol_pos_gain | 0.0 | 0.0 | 0.04 | 0.08 | 0.12 | 0.15 | Schlagman 2006/2009 |
| invol_remote_gain | 0.0 | 0.0 | 0.05 | 0.12 | 0.18 | 0.2 | Schlagman 2009 |
| enc_sem_mult | 1.0 | 1.03 | 1.05 | 1.02 | 1.0 | 1.0 | Park 2002; Verhaeghen 2003 |
| self_est_bias (mean drift) | 0.0 | −0.02 | −0.04 | −0.06 | −0.1 | −0.12 | Pearman 2004; SAGE |
| complaint_k (×) | 1.0 | 1.1 | 1.2 | 1.35 | 1.5 | 1.5 | O'Connor 1990 |
| iso_beta / iso_recovery | — | — | — | — | — | 0.1 / 60d | Wilson 2007 |
| med_theta_up / med_enc_loss | — | — | — | — | — | .05/.05 | Gray 2015 (acute) |

**Explicit nulls this pass (cite-guarded non-changes):** `pm_focal`
(age-flat — env-supported PM); `enact_gain` (parallel decline —
Rönnlund 2003); `rep_gain` (fluency channel flat — Brashier 2017);
involuntary scan rate (age-flat — Schlagman 2009); `metamem_r`/FOK
(monitoring spared — Pearman 2004); `warn_mult` stays flat (v16 §28
stands).

## 46. Spec changes v2.7 → v2.8 (delta summary)

| # | Change | Grounding |
|---|---|---|
| G1 | §5.14: `pm_habit_gain` repetition rescue; `ii_age_gate` on impl_intent_gain; `pm_focal` declared env-supported (age-flat) | §34 |
| G2 | §5.6: `sync_lure_gain` antipeak multiplier on `lure_accept` (recognition only) | §35 |
| G3 | §4.11: `potent_gain` old knots + `potent_window` feedback gate | §36 |
| G4 | §6.7: `know_corr_gain` — knowledge density multiplies the corroboration/accuracy channel | §37 |
| G5 | §6.10/source resolution: `rm_self_confuse` imagined↔done flips ∝ similarity | §38 |
| G6 | §2: `hearing` trait + `noise_cost` on verbal-channel encoding | §39 |
| G7 | §4.17: `isolation` overlay (iso_floor/iso_onset/iso_beta/iso_recovery) + `med_antichol` overlay | §§40, 44 |
| G8 | §3/§10 report layer: `self_est_bias` negative drift, `complaint_k` age knots + depress coupling | §41 |
| G9 | §5.7: `invol_pos_gain` valence bias + `invol_remote_gain` age prior on the ambient scan | §42 |
| G10 | knot table: `enc_sem_mult` semantic encoding bump 45–60 | §43 |

New params: `pm_habit_gain`, `ii_age_gate`, `sync_lure_gain`,
`potent_window`, `know_corr_gain`, `rm_self_confuse`, `hearing`,
`noise_cost`, `invol_pos_gain`, `invol_remote_gain`, `enc_sem_mult`,
`iso_floor`, `iso_onset`, `iso_beta`, `iso_recovery`, `med_theta_up`,
`med_enc_loss`. New frozen constant: `lure_sync_gate` shape
(0 below 50 → 1 by 70). Knot updates: `potent_gain`,
`self_est_bias`, `complaint_k`. Event/context field: `noise_level`.

## 47. Validation probes P263–P273

- **P263 PM paradox (MUST — sign):** same 78yo: focal cue-present
  intention fires ≥90% of the 25yo rate; nonfocal/time-based ≤60%;
  a 5×-repeated habitual intention fires at ≥ the young rate. Three
  arms, one character.
- **P264 impl-intent gate (SHOULD):** II-encoded event-based
  intentions gain a 70yo ≥1.3× more than a 25yo; at 82 the gain
  collapses to ≤ young (Kretschmer-Trendowicz boundary).
- **P265 antipeak lures (SHOULD — sign):** 75yo lure acceptance at
  antipeak ≥1.5× her own at-peak rate; 25yo's peak/antipeak ratio
  <1.2. Recognition only.
- **P266 enactment flat (SHOULD):** SPT-vs-verbal benefit identical
  at 30 and 80 (within 10%) while absolute recall differs — parallel
  decline, not rescue.
- **P267 errorful cost (SHOULD):** failed-recall potentiation halves
  at 80; identical failure followed by feedback restores young-level
  potentiation.
- **P268 knowledge shield (MUST — sign):** repeated false claim on a
  dense-knowledge topic: 75yo believe_p *below* 25yo; same claim on a
  novel topic: equal adoption. Both arms required.
- **P269 imagined-vs-done (SHOULD):** planned-but-unexecuted action,
  similarity ≥ interf_thresh: flip-to-"did" rate rises ~3× from 30→85;
  unaffected for dissimilar candidates.
- **P270 noisy-room tax (SHOULD):** identical conversation at
  noise_level 0.8: hearing 0.5 elder encodes ≥30% weaker than at
  noise 0.1; young-hearing control flat.
- **P271 isolation overlay (MUST):** contact below iso_floor for
  iso_onset → measurable β_episodic rise; contact restored → params
  recover over iso_recovery; partnerDeath triggers the ledger drop.
- **P272 complaint split (MUST):** self_est drifts negative and
  complaint_k rises 30→85 faster than measured recall declines;
  complaint rate responds to depress_state, not to a β lesion.
- **P273 involuntary highway (SHOULD):** ambient-scan emission rate
  flat 30→85 while voluntary recall falls; emitted records skew
  positive and remote in the old cohort.

## 48. Part III honest limits

- The PM paradox is *ecological*: our focal/nonfocal split assumes the
  sim's cue density is real-life-dense. A sparse synthetic world could
  starve the focal channel and falsify the "spared" prediction — the
  paradox is a property of cue ecology, not of brains.
- `iso_beta`'s magnitude is calibrated to *feel* of the Wilson HR
  (~doubled risk over years), not to a measured β shift — flagged
  HYPOTHESIS scaling; the causal pathway is itself unresolved.
- `hearing` collapses a real audiogram into one scalar; the
  Lin association is modeled only through the encoding channel
  (we take no position on marker-vs-cause).
- `rm_self_confuse` reuses generic similarity rather than the
  phenomenal-feature overlap Henkel measured — adequate for the
  behavior, not the mechanism.
- `know_density` is computed against the character's own semantic
  store — a young expert can out-shield an elder on her domain; the
  age effect is population-average, not law.
- None of Part III touches `deathDay` machinery — the §9 ramp still
  overrides every rescue listed here.

---

# Part IV — v40: the residual channels (what survives intact, what
# silently repeats, what misattributes its own fluency)

Parts I–III priced the deficit, the compensations, and the paradoxes.
Part IV covers the channels Part I–III left unpriced: implicit
strength that barely ages, imagined futures that thin out with the
past, intentions that refuse to die, spacing that still pays,
offloading elders under-trust, own-age expertise, outdated versions
that refuse to stay overwritten, familiarity mistaken for fame, and
semantic search taxed while the store stays rich. Spec v3.9, probes
P399–P408. Tagging: [CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 49. The implicit channel — fluency outlives recall (mostly)

- La Voie & Light 1994 (Psychol Aging 9:539 meta, 39 effect sizes):
  repetition priming shows a small but real age deficit (weighted
  d ≈ 0.30) — versus the same experiments' explicit measures where
  the age effect is several times larger. Priming is near-spared,
  not perfectly spared. **[CONSENSUS: implicit ≫ explicit in aging;
  whether the residual priming deficit is real or explicit-
  contamination is DEBATED — Ward et al. 2020 lifespan study (Psych
  Sci) found age decline in BOTH once contamination-controlled,
  which tempers the textbook "implicit is immune" claim]**
- Fleischman & Gabrieli 1998 review: implicit memory (skill priming,
  category fluency at output, procedural) is the most preserved
  family in normal aging — consistent with our procedural-out-of-
  scope decision and with `familiar_only` mechanics already running
  on a separate familiarity accumulator.

**Spec consequence (v3.9):** records gain an implicit channel
`impl_str` — set to 1.0 at encoding, decaying at
`β_impl = beta_episodic·impl_decay_mult` (impl_decay_mult ≈ 0.5,
slow), and **never gated by θ**. `impl_str` does three report-free
things: (a) biases §5.22 competitive-emission ordering toward high-
impl_str candidates when drives tie; (b) feeds `famScore` in §5.28
(familiarity-without-source) as a positive term weighted
`impl_fam_w` ≈ 0.4; (c) speeds re-encoding of repeated stimuli —
re-exp E on a record whose impl_str ≥ 0.5 gains `impl_reexp_gain`
≈ 0.1 (savings channel, Ebbinghaus). Age knots on
`implicit_decline` (×impl_decay_mult): 1.0 ≤50 → 1.15 at 70 → 1.3
at 85 — a real but small decline, sized ~0.3 of the explicit one
per the meta. **[CONSENSUS direction; magnitudes HYPOTHESIS.]**
The behavioral read: elders "just know" the way home, choose the
familiar brand, feel the face is known — with nothing to report.

## 50. Episodic future simulation — old plans are thin plans

- Addis, Wong & Schacter 2008 (Psychol Sci 19:33): older adults
  generate fewer internal (episodic) details AND more external
  details when *imagining future events* — the §5 Autobiographical
  Interview deficit extends forward in time; past-future detail
  counts correlate within person; internal-detail count tracks
  relational-memory ability (constructive episodic simulation
  hypothesis). **[CONSENSUS]**
- Addis, Musicaro, Pan & Schacter 2010 (Psychol Aging 25:369):
  recombination paradigm — the deficit persists when recasting
  whole past events as future ones is blocked; it is a
  recombination deficit, not mere recasting (though recasting is
  also real strategy use). **[CONSENSUS]**
- Addis, Roberts & Schacter 2011: detail-generation cues rescue
  some of the deficit — env-supported simulation works better.

**Spec consequence (v3.9):** `imagineEvent` (§6.9) gains two
age-side knobs:
- `sim_detail_mult(age_eff)` knots 1.0 ≤50 → 0.8 at 70 → 0.65 at
  85 — multiplies the number of verbatim-grade fields a simulated
  record is minted with. Old characters' imagined futures are
  skeletal: the plan survives, the particulars don't.
- `recast_p(age_eff)` knots 0.1 ≤50 → 0.25 at 70 → 0.4 at 85 —
  probability an imagined-future record is minted as a decorated
  copy of ONE existing record (same place/people, new when) rather
  than recombined parts. Recast records inherit the source's
  verbatim at `sim_detail_mult` richness — cheap, vivid, wrong in
  one specific way (it already happened). Corollary worth flagging:
  imagination inflation (§6.9) should shrink for elders — thinner
  simulations inflate less — which `sim_detail_mult` produces
  for free. **[CONSENSUS phenomenon; recast_p mechanism
  HYPOTHESIS-scale — Addis 2010 shows it's not the whole story.]**

## 51. Intention deactivation — the finished errand keeps firing

- Scullin, Bugg, McDaniel & Einstein 2011 (Mem Cogn 39:1232):
  older adults show **preserved spontaneous retrieval but impaired
  deactivation** — a completed intention keeps firing on its cue.
  Scullin, Bugg & McDaniel 2012 (Psychol Aging 27:46, "Whoops, I
  did it again"): ~25% of participants commit commission errors —
  re-executing a finished PM response; older adults err more, and
  specifically for intentions that were *repeatedly performed*
  before retirement (4-target > 0-target condition, old only).
  Walser, Plessow, Goschke & Fischer 2015 (Psychol Aging): practice
  at *forgetting* intentions floors commission errors in both ages.
  **[CONSENSUS — the dual-mechanisms account: spontaneous retrieval
  intact, executive suppression of the finished intention weak]**
- This is the mirror of §34's PM paradox: the cue machinery that
  rescues old prospective memory also refuses to switch off. The
  same street cue fires the same arm whether or not the errand is
  done — stopping requires the control channel that's declining.

**Spec consequence (v3.9):** §5.14 intention lifecycle gains a
retirement path. When an intention completes, its record isn't
deleted — it decays (existing `intent_done_decay`). NEW: for
`deact_window` ≈ 7 game-days post-completion, a matching cue still
rolls the fire test at scaled probability
`comm_err_p = (1 − pm_deactivate(age_eff))·cueMatch·
(1 + fires·comm_habit_gain)` where `pm_deactivate` knots 0.95 ≤50 →
0.85 at 70 → 0.7 at 85, `comm_habit_gain` ≈ 0.1 caps at fires 5
(Scullin 2012: repetition worsens it for old — opposite the young
pattern), and `fires` = prior successful executions. A commission
fire emits `commission:true` — the character starts the action and
catches it ("I already paid the rent… didn't I?") — and, if
uncaught, re-executes (bought stamps twice). `deact_practice_gain`:
each resisted commission multiplies pm_deactivate by 1.15 within
the window (Walser 2015 forgetting practice). P401 sign-locks the
age × repetition crossover.

## 52. Spacing still pays — and contextual drift slows

- Balota, Duchek & Paullin 1989 (Psychol Aging 4:3): spacing/lag
  effects fully preserved in older adults — lower absolute recall,
  identical lag × retention-interval pattern. Model fit: elders
  (a) encode less contextual information per moment and (b) show
  **slower contextual fluctuation across time** — the context
  vector drifts more slowly for old brains. **[CONSENSUS pattern]**
- Spacing-in-aging replications (Bercovitz et al. 2017; European J
  Ageing 2023 face-name work): spacing benefit intact at 10-day
  intervals; massed vs spaced forgetting diverge at long intervals
  for both ages.

**Spec consequence (v3.9):**
- `spacing_gain` (rehearsal/retell spacing benefit) declared
  **explicit null — age-flat.** Distributed retells remain the
  elder's best rehearsal economics; massed same-session repeats
  are as worthless for her as for anyone. P402.
- `ctx_flux_mult(age_eff)` knots 1.0 ≤50 → 0.85 at 70 → 0.7 at 85
  multiplies §5.29-style `ctxShift` magnitude per boundary/day —
  slower contextual drift. Consequence (Balota's own mechanism):
  same-day records for old characters share MORE context features
  → the §4.2 interference pool is denser within-day → elders
  confuse *which* Tuesday thing happened when, even when each
  event is remembered. Cheap and mechanically derived from a
  replicated model-fit finding. **[Model-fit finding CONSENSUS;
  RW mapping HYPOTHESIS.]**

## 53. Offloading — more reminders, less faith than warranted

- Tsai, Scarampi, Kliegel & Gilbert 2023 (Psychol Aging,
  pag0000751, n=88): older adults USE more reminders (they need
  them — worse internal memory) but show **reduced pro-reminder
  bias relative to the individually-optimal strategy** — young
  adults over-value reminders, elders *under*-value them.
  Metacognitive origin: the §41 complaint sits beside an
  under-appreciation of the fix. **[CONSENSUS-ish single paradigm;
  direction replicated across Gilbert-lab work]**
- Scarampi et al. 2023 (pag0000590): offloading permission reduces
  the age gap in PM accuracy — the aid works when used.
- Knowles & Dunk? — skipped; subjective-value arm (Exp 2 of the
  PMC10524137 paper): elders offload MORE for subjectively
  important items, young for unimportant — value-directed
  offloading, consistent with §17 `value_select`.

**Spec consequence (v3.9):** two knots on the §v3.5 offload
machinery — `offload_pref(age_eff)` knots 1.0 ≤50 → 1.3 at 70 →
1.5 at 85 (raw reminder-use rate rises) applied to the *decision*
to flag `offload:true`; and `offload_bias(age_eff)` knots 1.0 →
0.8 at 70 → 0.6 at 85 multiplying the benefit term in the
offload-vs-internal choice — elders systematically underprice the
external store relative to need. Both reserve-shifted (metacognitive
capacity). Plus `offload_select(age)` knots 0.3 → 0.5 at 70 →
0.65 at 85: probability the offloaded item is the high-importance
one (elders offload the granddaughter's birthday, not the errand —
subjective-value arm). Net behavior: more notes, still not enough,
but the RIGHT notes. **[CONSENSUS direction on both arms; knot
magnitudes HYPOTHESIS.]**

## 54. Own-age bias — discriminability, not criterion

- Rhodes & Anastasi 2012 (Psych Bull 138:146 meta): own-age bias
  in face recognition is real and *diagnostic-shaped*: hits g =
  +0.23, false alarms g = −0.23, discriminability d′ g = +0.37,
  **response criterion g = −0.01 (null)** — people aren't more
  liberal toward own-age faces; they genuinely discriminate them
  better. Present in children, young, AND old — even though elders
  once belonged to the other age groups. **[CONSENSUS meta]**
- Experience account (contact hypothesis) partially supported;
  social-cognitive accounts (in-group processing depth) needed for
  full coverage. **[Mechanism DEBATED; effect CONSENSUS.]**

**Spec consequence (v3.9):** §5.10 person cascade gains
`own_age_gain` ≈ 0.15 on **discriminability terms only**: for a
target whose `ageBand` matches the recognizer's, familiarity and
identity tier rolls get `+own_age_gain` AND the lure/FA term gets
`−own_age_gain`; θ/criterion untouched (the meta's cleanest
finding). Implementation: `ageBand` = floor(age_now/15). Note the
asymmetry this creates in the cast: the two oldest mains read each
other more accurately than they read the young tenants, and vice
versa — age-segregated social worlds are partly a *perceptual*
phenomenon. Reserve-shifted? No — expertise/contact-based, follows
encodeAge-era exposure history, not decline capacity. P403.

## 55. Update resistance — the old version re-emerges

- Hartman & Hasher 1991 (Psychol Aging 6:42): older adults recall
  the *original* endings of sentences they themselves replaced —
  the superseded version stays accessible and competes. May, Zacks,
  Hasher & Multhaup 1999: garden-path updating — elders retain the
  misinterpretation after disambiguation; young discard it.
  **[CONSENSUS pattern — "productive forgetting" failure; sibling
  of §3 inhibition deficit and §51 deactivation]**
- Functionally: reconsolidation updating (§5.9) should be
  *partial* in old brains — the write lands, but the pre-write
  version keeps a shadow that can win later retrieval.

**Spec consequence (v3.9):** on a §5.9 reconsolidation write that
changes a verbatim field, with probability `update_resist(age_eff)`
— knots 0.05 ≤50 → 0.2 at 70 → 0.35 at 85 — the field becomes a
**versioned pair** `{old_v, new_v, supplantDay}` instead of an
overwrite. Later reconstructions sample `new_v` with probability
`new_v_share = 0.7` declining with days-since-supplant
(`−0.01/day`, floor 0.5) — the longer ago the correction landed,
the more the old version leaks back. Source confidence on the
resurrected old version is *inflated* (it feels original —
`conf_inflate_old` stacks). Produces: "she still lives on Folsom"
six months after the move, said with certainty; and the younger
housemate correcting her loses the argument in her head. P404.

## 56. Fluency fame — familiar reads as notable

- Bartlett, Strater & Fulton 1991 (Mem Cogn 19:348): false recency
  and **false fame** both elevated in older adults — repeated
  unfamiliar faces feel famous to elders. Dywan & Jacoby 1990:
  source-monitoring deficit turns raw fluency into attributions.
  Jacoby, Kelley, Brown & Jasechko 1989 is the young-adult
  original (fame under divided attention); the age elevation is
  the 1991 finding. **[CONSENSUS pattern]**
- Mechanism is ours already: `famScore` without a surviving source
  tag + inference machinery (§6.10). What's missing is the
  *attribution* target — "this familiarity means public
  significance."

**Spec consequence (v3.9):** `familiar_only` emissions (§5.28) gain
an attribution channel: when famScore ≥ fam_bar and source is
unresolved for `fame_window` ≈ 30+ days, an old character
misattributes the fluency to *prominence* with probability
`fame_fluency(age_eff)` — knots 0.02 ≤50 → 0.08 at 70 → 0.15 at 85 —
emitting `attribution:"known_around"` ("she's somebody in this
neighborhood," "that name rings a bell — was he in the paper?").
Young characters get a null knot — for them fluency more often
reads as déjà vu (`deja_prop` already exists). The channel matters
for rumor dynamics: an elder's repeated exposure to a name through
gossip manufactures a sense that the person is *notable* — fluency
inflates reputation salience. P405.

## 57. Semantic search tax — the store is rich, the index is slow

- Verbal/semantic fluency (letter/category generation) declines
  with age while vocabulary holds — Tombaugh, Kozak & Rees 1999
  norms; Rönnlund 2005's semantic decline is *retrieval-paced*
  (timed tasks), not store erosion; Park 2002 vocabulary rises to
  70. **[CONSENSUS: semantic *access speed/search* declines,
  semantic *content* preserved]**
- Distinguishes §43's `enc_sem_mult` (store growth) from the access
  side — the two can rise and fall independently.

**Spec consequence (v3.9):** `sem_search_tax(age_eff)` knots
0 ≤50 → 0.03 at 70 → 0.06 at 85 added to θ ONLY for open-ended
semantic retrieval (list all the vendors on the block, name the
grandchildren's friends) — search-mode semantic recall. Direct
item recognition/fact lookup exempt (that's fluent access). And
`lat_age_mult` knots 1.0 ≤50 → 1.3 at 70 → 1.6 at 85 on §5.25
`latency_ms` — Salthouse speed, priced on the observable that
already exists rather than a new channel. P406 tests that stored
semantic content is intact while list-generation slows.

## 58. What Part IV deliberately did not do

- **No age knots on `spacing_gain`, `pm_focal` reaffirmed, priming
  channel small-but-nonzero decline (not flat)** — the honest reads
  of Balota 1989, Rendell & Thomson 1999, and La Voie & Light 1994
  respectively.
- **No separate "elder wisdom" parameter** — crystallized knowledge
  (`enc_sem_mult`, `know_density`, `schema_support`) already
  produces the behavioral shadow; a wisdom knob would double-count.
- **No dementia modeling** — §16 stands; terminal machinery +
  reserve floor approximates pathological trajectories without
  naming them.

## 59. Part IV knot rows (extends §45; age_eff unless noted —
    NOT reserve-shifted: own_age_gain)

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| implicit_decline (×impl_decay) | 1.0 | 1.0 | 1.05 | 1.15 | 1.25 | 1.3 | La Voie & Light 1994 (~0.3× explicit) |
| sim_detail_mult | 1.0 | 1.0 | 0.9 | 0.8 | 0.7 | 0.65 | Addis 2008 |
| recast_p | 0.1 | 0.12 | 0.18 | 0.25 | 0.33 | 0.4 | Addis 2010 |
| pm_deactivate | 0.95 | 0.95 | 0.9 | 0.85 | 0.75 | 0.7 | Scullin 2011/2012 |
| comm_habit_gain (×fires) | 0.0 | 0.0 | 0.05 | 0.1 | 0.1 | 0.1 | Scullin 2012 4-target arm |
| ctx_flux_mult | 1.0 | 1.0 | 0.92 | 0.85 | 0.75 | 0.7 | Balota 1989 model fit |
| offload_pref | 1.0 | 1.05 | 1.15 | 1.3 | 1.42 | 1.5 | Tsai 2023 use rate |
| offload_bias | 1.0 | 1.0 | 0.9 | 0.8 | 0.7 | 0.6 | Tsai 2023 antireminder |
| offload_select | 0.3 | 0.32 | 0.4 | 0.5 | 0.6 | 0.65 | PMC10524137 value arm |
| own_age_gain | 0.15 | 0.15 | 0.15 | 0.15 | 0.15 | 0.15 | Rhodes & Anastasi d′ .37 |
| update_resist | 0.05 | 0.08 | 0.12 | 0.2 | 0.3 | 0.35 | Hartman & Hasher 1991 |
| fame_fluency | 0.02 | 0.03 | 0.05 | 0.08 | 0.12 | 0.15 | Bartlett 1991 |
| sem_search_tax | 0.0 | 0.0 | 0.02 | 0.03 | 0.05 | 0.06 | Tombaugh 1999; Rönnlund |
| lat_age_mult (×latency_ms) | 1.0 | 1.05 | 1.15 | 1.3 | 1.45 | 1.6 | Salthouse 1996 |

Frozen constants: `deact_window` = 7 game-days; `new_v_share` start
0.7 decay −0.01/day floor 0.5; `fame_window` = 30 days;
`impl_decay_mult` = 0.5; `impl_fam_w` = 0.4; `impl_reexp_gain` = 0.1;
`deact_practice_gain` = 1.15/resisted commission.
**[All knot interpolations HYPOTHESIS; anchors CONSENSUS.]**

## 60. Spec changes v3.8 → v3.9 (delta summary)

| # | Change | Grounding |
|---|---|---|
| H1 | §4.22: `ctx_flux_mult` slows ctxShift; `spacing_gain` explicit null | §52 |
| H2 | §5.33: intention deactivation — `pm_deactivate`, `comm_err_p`, `comm_habit_gain`, `deact_window`, `deact_practice_gain` | §51 |
| H3 | §5.34: `imagineEvent` gains `sim_detail_mult`, `recast_p` | §50 |
| H4 | §5.35: `impl_str` channel — emission ordering, famScore feed, re-exp savings; `implicit_decline` knots | §49 |
| H5 | §5.36: `own_age_gain` discriminability-only on person cascade | §54 |
| H6 | §6.37: `update_resist` versioned-field pairs on reconsolidation writes | §55 |
| H7 | §6.38: `fame_fluency` prominence misattribution on `familiar_only` | §56 |
| H8 | §5.4/`sem` access: `sem_search_tax` on open-ended semantic recall; §5.25 `lat_age_mult` | §57 |
| H9 | §3.5-offload: `offload_pref`, `offload_bias`, `offload_select` | §53 |

New params: `implicit_decline`, `sim_detail_mult`, `recast_p`,
`pm_deactivate`, `comm_habit_gain`, `ctx_flux_mult`, `offload_pref`,
`offload_bias`, `offload_select`, `own_age_gain`, `update_resist`,
`fame_fluency`, `sem_search_tax`, `lat_age_mult`. Frozen constants:
`deact_window`, `new_v_share`, `fame_window`, `impl_decay_mult`,
`impl_fam_w`, `impl_reexp_gain`, `deact_practice_gain`. Record
fields: `impl_str`, versioned field pairs `{old_v, new_v,
supplantDay}`, `attribution` on familiar_only emissions,
`commission:true` on intention records.

## 61. Validation probes P399–P408

- **P399 implicit spared (MUST — ratio):** matched encode; 30d
  later explicit recall collapses 30→85 as usual while `impl_str`
  effects (emission ordering, re-exp savings) decline ≤0.35× the
  explicit drop. Fails if impl_str ages at β_episodic rate.
- **P400 thin futures (MUST):** `imagineEvent` at 78 emits ≤0.7×
  the verbatim-field count of the 25yo simulation; `recast_p` share
  of old simulations traces to single source records; inflation on
  imagined events is correspondingly reduced (emergent check).
- **P401 commission errors (MUST — crossover):** completed
  intention, cue re-presented inside `deact_window`: 78yo commission
  rate ≥3× the 25yo's AND rises with prior `fires` for old but not
  young (Scullin 4-target sign-lock). Resisted commissions reduce
  subsequent rate (practice arm).
- **P402 spacing null (MUST — explicit null):** massed vs spaced
  retell schedules produce identical spacing benefit ratios at 30
  and 80 (within 15%) despite lower old absolute retention.
- **P403 own-age bias (MUST — criterion null):** same-age targets
  show higher hit AND lower FA (d′ gain, not bias shift);
  criterion measure unchanged — fails if implemented as θ shift.
- **P404 update resistance (SHOULD):** corrected field at 78 re-
  emits the superseded value ≥25% of the time at supplantDay+30;
  resurrected old values carry above-median confidence.
- **P405 fluency fame (SHOULD):** repeated sourceless exposure →
  75yo emits `attribution:"known_around"` at ≥4× the 25yo rate;
  never on first exposure (famScore gate intact).
- **P406 semantic split (SHOULD):** 80yo's open-ended semantic
  listing is slower/fewer while direct fact lookup is at young
  level — access taxed, store intact.
- **P407 same-day blur (SHOULD):** two same-day same-place events:
  cross-contamination rate rises 30→85 via the denser context pool
  (ctx_flux mechanism), while different-day pairs are unchanged.
- **P408 offload paradox (SHOULD):** 75yo chooses offload:true more
  often than 25yo yet still below her own optimal rate (bias <1);
  offloaded items skew high-importance (offload_select).

## 62. Part IV honest limits

- `impl_str` collapses perceptual/conceptual/associative priming
  into one channel — La Voie & Light's item-vs-associative split
  (associative priming ages more) is flattened; we keep one
  channel for implementation cost and note the simplification.
- `comm_err_p` treats deactivation failure and commission *action*
  as one roll — real commission errors have a catch-yourself
  stage; the `commission:true` emit is where dialogue implements
  it, unpriced.
- `update_resist`'s versioned-pair mechanism is heavier than the
  phenomenon strictly requires (a competing shadow record would
  do); chosen because it rides existing field machinery — flagged
  as an implementer's option, not a mechanism claim.
- `fame_fluency` is calibrated to feel, not rate — Bartlett 1991
  reports group differences, not per-exposure probabilities.
- Offloading knots assume the sim actually offers extref surfaces
  (notes, calendars, other people); a world with no external stores
  silently disables the channel — same caveat class as §48's cue
  ecology.
- As always: `deathDay` machinery overrides every Part IV channel —
  terminal dedifferentiation doesn't care about sparing.

---

# Part V — v52: the binding bill comes due (associative deficit
# priced; what old minds stop paying for, and what they stop doing
# spontaneously)

Parts I–IV priced the channels; Part V prices the *join*. The
associative deficit hypothesis (Naveh-Benjamin 2000) is arguably the
single best-supported account of WHAT old episodic memory loses — not
items, the links between them — and until now the model carried it only
as a motivation (`link_p` decline, hyper-binding as the inverse). This
pass gives it its own machinery, then five consequences nobody had
priced (face-name as worst-case binding, divided-attention asymmetry,
emotional-item-vs-context split, RIF's two-regime tail, feedback-gated
testing), then two composition results (event segmentation; the
important-memory draw at 70), one spontaneous-cognition result
(mind-wandering declines — an apparent tension with §42's involuntary
highway, resolved), and one monitoring result (the confidence lie is
recollection-specific). Every claim tagged; everything lands in §7
params or P535–P544.

## 63. The associative deficit hypothesis — formalized at last

- Naveh-Benjamin 2000 (JEP:LMC 26:1170 — verified): four experiments;
  older adults deficient on BOTH interitem (word–word) and intraitem
  (item–context, font/voice) associations while item memory is
  comparatively spared; competing hypotheses (general slowing,
  attention) don't fit the dissociation pattern. The deficit is in
  **merging unrelated units into a cohesive episode**.
- Old & Naveh-Benjamin 2008 (Psychol Aging 23:104 — verified meta,
  90 studies, ~3200 per age group): age effect larger on associative
  than item measures across source, context, temporal order, spatial
  location, and item-pairings — verbal AND nonverbal. **[CONSENSUS —
  the meta is the calibration anchor]**
- Two moderators that matter for pricing:
  1. **Intentional > incidental.** The associative deficit is
     pronounced under intentional learning but not clearly evident
     under incidental learning (Old & Naveh-Benjamin 2008). Read:
     incidental encoding is equally poor at both ages; what declines is
     the *intentional increment* — the extra binding work a young mind
     buys when it decides to remember. This reframes the deficit as a
     **gain loss, not a floor loss**.
  2. **Test format.** Under recall tests, item and associative
     deficits are similar size; the assoc>item split is a
     *recognition* finding. Recall already taxes item retrieval
     enough that the binding tax is invisible on top.
- Strategy rescue is real but partial: sentence-mediator instructions
  shrink the old associative deficit (Naveh-Benjamin, Brav & Levy
  2007), further when encouraged at retrieval too — but never
  eliminate it.
- **Not merely multiplicative item loss:** the .9×.9=.81 arithmetic
  fails — deficits persist when item memory is equated (Bastin & Van
  der Linden 2005; Kilb & Naveh-Benjamin 2007; the face-name arm,
  §64).

**Spec consequence (v5.0):** new param `adh_bind_tax(age_eff)`
multiplies every *link-forming* write — `cueBind_init`, field-to-
record attachment (verbatim.who/where/when vs gist), source-tag
strength, RelEdge delta from shared episodes — while item legs
(enc_base, gist storageS) keep their existing shallower knots. The
intentionality gate: the tax applies to `enc × intent` — the
intentional-encoding increment over `att_min` floor — so records
encoded at floor attention (incidental) show item≈assoc loss, records
encoded with effort show the split. Knots: 1.0 at 50 → 1.15 at 60 →
1.35 at 70 → 1.6 at 80 → 1.75 at 85 (meta: assoc deficit ≈1.5–2×
item deficit at 70+; kept sublinear since links already ride the
`link_p` decline — `adh_bind_tax` is the residual beyond it, applied
to the *intentional increment* only). In recognition-mode recall the
tax shows as source/context misses; in free recall it is masked
(item retrieval already fails first) — an emergent null to probe,
not a coded branch.

## 64. Face-name binding — the ecologically worst case

- Naveh-Benjamin, Guez, Kilb & Reedy 2004 (Psychol Aging 19:541 —
  verified): name–face pairs; older adults deficient on the PAIR test
  even when name and face recognition are matched to young — and
  reduced attentional resources are NOT the sole mediator. The most
  socially legible instance: "I know your face, your name's gone" is
  not a TOT (§6) — it's a binding failure; the link record exists,
  the association doesn't fire.
- Arbitrary vs meaningful links: a name is an arbitrary tag on a face
  — no semantic scaffold — so `schema_support` can't rescue it.
  Where a link has semantic support (doctor↔clinic), the deficit
  shrinks (Naveh-Benjamin, Hussain, Guez & Bar-On 2003: preexisting
  connections reduce the deficit). **[CONSENSUS]**
- Tse, Balota & Roediger 2010 (Psychol Aging — verified): for
  face-name pairs, repeated testing only beat repeated study in older
  adults **when feedback was given** (see §72). Raw retrieval
  practice on an arbitrary binding can consolidate the wrong pairing.

**Spec consequence:** the person cascade (§5.36's own-age machinery,
v3.2's person records) gains `namepair_tax(age_eff)` = an extra ×1.2
multiplier on `adh_bind_tax` for person↔name/person↔role links
specifically — the arbitrary-tag surcharge. `meaningful_link_rescue`
0.3: links carrying a semantic-relational tag (kinship, job,
cohabitation) subtract this fraction of the tax — the neighborhood
reason the landlord remembers "the nurse in 3B" better than
"Jennifer."

## 65. The working-memory ladder — storage holds, processing falls

- Bopp & Verhaeghen 2005 (J Gerontol B 60:P223 — verified meta):
  Brinley-plot analysis of 8 verbal span tasks; THREE distinct age
  slopes in increasing deficit order: **simple storage span <
  backward span < working-memory (complex) span** — old span is a
  linear function of young span with slope <1, and the slope gets
  worse as the task adds active processing to passive storage.
- Same ordering across domains: storage+processing dual tasks are
  the age-sensitive ones; pure maintenance is comparatively spared
  (Verhaeghen, Marcoen & Goossens 1993 — earlier meta; ~0.8 SD
  complex-span deficit).
- The RW reading: holding a thread (who said what, mid-conversation)
  while ALSO doing something with it (formulating a reply, tracking
  two topics) is exactly the storage+processing combination — the
  decline is largest where ordinary social life is densest.

**Spec consequence:** `wmc_tier` param set — three per-age knots for
the three tiers, folded into one search-breadth multiplier by task:
`wm_store_mult` (1.0 → 0.95 at 80), `wm_reorder_mult` (1.0 → 0.85),
`wm_complex_mult` (1.0 → 0.72). Retrieval-side consumers:
`search_breadth` rides `wm_complex_mult` (already on decline knots —
now justified by tier, not ad hoc); multi-cue fusion (cueMatch across
3+ simultaneous cues) rides `wm_complex_mult`; verbatim verbatim-field
recall order (reconstruction reordering) rides `wm_reorder_mult`;
plain single-cue recall rides `wm_store_mult` — nearly flat, which is
why "tell me about X" stays fluent at 80 while "wait, you said two
contradictory things" tracking fails.

## 66. Divided attention — the asymmetry is the point

- Craik, Govoni, Naveh-Benjamin & Anderson 1996 (JEP:G 125:159 —
  verified): DA at ENCODING → large memory cost, small RT cost;
  DA at RETRIEVAL → small/no memory cost, larger RT cost (esp. free
  recall). Retrieval is protected — memory accuracy doesn't yield,
  the secondary task does.
- Anderson, Craik & Naveh-Benjamin 1998 (Psychol Aging 13:405 —
  verified): the memory-cost pattern holds equally for young and old
  — but the secondary-task RT cost at retrieval is **larger for
  older adults**, graded: free recall > cued recall > recognition.
  Retrieval is MORE attention-demanding with age even though it
  succeeds; the bill shows up on whatever else is happening.
- Functional picture: an old character mid-search is *less
  interruptible* — the search commandeers what the young would spend
  on monitoring the room. Naveh-Benjamin, Craik, Guez & Kreuger 2005
  (strategy arm): the age gap under DA narrows when relatedness or
  strategy support is supplied.

**Spec consequence:** two params, asymmetric: `da_enc_tax(age_eff)`
(multiplies enc when `C.da` — divided-attention encode; knots
1.0→1.3 at 80 — old pay MORE at encode) and `da_ret_tax(age_eff)`
(applied NOT to recall success but to `latency_ms` and to a
secondary-task decrement proxy `da_ret_spill` — at free-recall mode
×1.6 latency at 80, cued ×1.3, recognition ×1.15). Locked null: DA at
retrieval does NOT raise miss rate at either age (Craik 1996) — it
raises latency and spill only. P536 sign-lock.

## 67. Emotional item vs emotional context — the split nobody priced

- Kensinger, Brierley, Medford, Growdon & Corkin 2002 (Emotion 2:118
  — verified): young AND old show better memory for emotional vs
  neutral items; but the *context* benefit (neutral items embedded in
  an emotional context) is **lost in older adults** (and in AD).
  Emotional ITEM enhancement preserved; emotional CONTEXT enhancement
  gone.
- Kensinger, Brierley et al. 2003 (Emotion 3:239 — verified): across
  35–85, the modulation pattern (gist up, visual detail down) is
  *comparable* — the amygdala-side mechanism is intact while
  overall performance declines.
- Reads coherently with §64: the context benefit IS a binding
  benefit (item↔emotional-frame link) — it falls under
  `adh_bind_tax`; the item benefit is an amygdala-side tag, spared.
  The spec's deliberate flatness of `w_emo`/`emo_consol_gain` (v0.5,
  Kensinger-grounded) is *right for items* and was silently
  over-extended to context legs.

**Spec consequence:** `emo_ctx_gain(age_eff)` — the
emotional-context encoding leg (arousal bleed onto neutral
co-encodees, §4.9-adjacent) gets decline knots 1.0 ≤60 → 0.6 at 75 →
0.4 at 85 while `w_emo`/`emo_consol_gain`/`abc_gain` remain
explicitly OFF the decline curve (reaffirmed). Behaviorally: the
75-year-old still remembers the funeral vividly (emotional item),
but the errand she ran *on the way to* the funeral no longer gets
its free ride. P539.

## 68. The mind quiets — wandering declines, thoughts go stimulus-bound

- Maillet & Schacter 2016 (Neuropsychologia 80:142 review —
  verified): older adults show reduced frequency of BOTH
  mind-wandering AND involuntary autobiographical memory; intrusive
  thoughts mixed; spontaneous PM retrieval relatively preserved.
- Jordano et al. 2019 meta (Psychol Aging — verified): the MW
  decrease is LARGE and robust across probe-caught methods.
- Maillet & Schacter 2016b (Psychol Aging — verified): within the
  reduced total, older adults' ongoing thoughts shift composition —
  proportionally MORE stimulus-dependent (SDT), FEWER
  stimulus-independent (SIT); SDT frequency predicted memory
  performance in older adults.
- **Apparent tension with §42's involuntary highway, resolved:**
  §42 claims involuntary recall *per trigger* is preserved
  (cue→memory fidelity holds); §68 claims the *rate of triggers
  that land* declines — fewer internally generated retrievals, and
  external cues face a quieter, more task-focused field. Both true:
  old involuntary recall is cue-driven (higher share of emissions
  trace to a present stimulus), young involuntary recall is
  self-seeding (thoughts spawn thoughts). The old mind doesn't
  wander *off* the world; it stays on it.

**Spec consequence:** `mw_decline(age_eff)` multiplies
`ambientMemoryScan` tick rate (self-seeded involuntary emission):
knots 1.0 ≤50 → 0.75 at 70 → 0.55 at 85. `sdt_share(age_eff)` —
fraction of involuntary emissions that must trace to a present
environmental cue vs train-of-thought chaining: 0.5 at 30 → 0.8 at
80. Emergent consequence worth noting: fewer spontaneous retrievals
→ fewer free reconsolidation cycles → a secondary rehearsal drought
for the old (compounding §13's retell economics). Intrusive-trauma
channel exempt (mixed findings — `intrusion_thresh` trauma path
stays as-is). Spontaneous PM fires keep §34's paradox machinery.

## 69. RIF's two-regime tail — inhibition's late bankruptcy

- Aslan, Bäuml & Pastötter 2007 (Psych Sci 18:72): RIF INTACT in
  young-old — a direct challenge to blanket inhibitory-deficit
  accounts. **[CONSENSUS, contested scope]**
- Aslan & Bäuml 2012 (Psychol Aging 27:1027 — verified): RIF
  reliable in young-old (60–75), **declines and becomes inefficient
  in old-old (>75)** — inhibition of competitors is a late-declining
  capability, not an early casualty.
- Ortega, Gómez-Ariza, Román & Bajo 2012: dividing attention
  eliminates RIF — but a *lighter* secondary task suffices in older
  adults (3-digit vs 5-digit updating) — the fragile flank of the
  same finding.
- Parallel result for directed forgetting: listwise DF intact in
  young-old, absent in old-old (Sahakyan, Delaney & Goodmon work;
  Bäuml-group replications) — same ~75 pivot, consistent with
  §5.48's soft-DF machinery.

**Spec consequence:** `rif_age_tail(age_eff)` — `rif_k` effectiveness
multiplier: 1.0 ≤72 → 0.5 at 80 → 0.2 at 88. Below the pivot,
retrieval practice prunes rivals as usual (and `da` at retrieval
weakens it in BOTH ages, Ortega arm — apply a ×(1−0.5·C.da) to
rif_k universally, not just old). Above the pivot: rivals survive
selective retell — an 85-year-old who keeps rehearsing the
complaint does NOT suppress the neighbor's version of events.
Cross-links: §5.23 SS-RIF and §6.69 jointRecall emissions all read
the same `rif_k` after the tail multiplier.

## 70. Event segmentation coarsens — the movie gets fewer chapters

- Zacks, Speer et al. 2006; Kurby & Zacks 2011; Bailey, Kurby,
  Giovannetti & Zacks 2013 (verified via Sargent 2013 review):
  older adults show lower agreement with normative event boundaries
  and less hierarchically organized segmentation; agreement predicts
  memory — those who segment normatively remember better.
- Sargent et al. 2013 (Cognition 129:241 — verified, n=208 lifespan
  20–79): segmentation agreement explains unique variance in event
  memory ABOVE psychometric speed/WMC/knowledge — and does so as
  strongly in old as young. Segmentation is a basic encoding
  mechanism whose decline is *orthogonal* to the resource declines.
- Mechanistic read for RW: fewer boundaries → fewer record-chunk
  transitions → larger, fewer, gist-thick records; a day reads as
  "the morning at the shop" not eleven episodes — detail count per
  record falls with boundary count even holding encoding strength.

**Spec consequence:** `seg_boundary_p(age_eff)` multiplies the
event-boundary mint rate (the §5.29 doorway machinery and record
splitting at goal/subgoal shifts): 1.0 ≤55 → 0.8 at 70 → 0.65 at
85. Records minted under low segmentation carry `coarse:true` —
higher gist share, fewer verbatim fields, wider `dateEstimate`
sigma (chapter-level uncertainty). Interacts with §4.22: coarser
segments ALSO concentrate same-context records — two mechanisms,
one behavioral signature, both kept (they respond to different
interventions: context vs boundary density).

## 71. What "most important" samples from — the bump is where old
    significance lives

- Rubin & Schulkind 1997a (Mem & Cogn 25:859 — verified): word-cued
  AMs in 70yos: childhood dip, power-function recency, AND a bump at
  10–30 — holds at individual level, holds for 124 and 921 cues.
  RT constant across decades except longer for childhood.
- Rubin & Schulkind 1997b (Psychol Aging 12:524 — verified): the
  "5 most important memories" request — in 20- and 35-year-olds
  distributes like word-cued memories, but in 70-year-olds
  **concentrates in the single 20–30 decade**. Importance sampling
  at old age is nearly synonymous with bump sampling.
- Concrete words cue older memories; no cue property predicts which
  memories come from the bump — the bump is availability, not
  cue-matching.

**Spec consequence:** the `importance` draw used by "most important
memory" / life-review / eulogy-style queries gains
`bump_emit_w(age_eff)`: at age_eff ≥60 the emission weights for
importance-ranked draws concentrate on encodeAge ∈ [18,30]
(analytic window per Rubin's 20–30 finding; uses the record's own
bump machinery rather than a hard band — multiply emission weight
by `bump_emit_w` inside the bump window). Knots 1.0 ≤55 → 2.0 at 70
→ 2.5 at 85. Old characters asked "what mattered most" answer from
their twenties — not sentiment, availability.

## 72. Testing needs feedback at old age — rehearsal economics flip

- Tse, Balota & Roediger 2010 (Psychol Aging — verified): face-name
  pairs; without feedback, middle-aged benefit from repeated testing
  over restudy while **older adults benefit more from repeated
  study** (crossover); WITH feedback, both age groups benefit from
  testing. Retrieval practice is only a free lunch when the answer
  can be checked — uncheckable retell consolidates whatever came
  out, wrong or right, and the old make more confident errors to
  consolidate (§72-adjacent Dodson chain).
- Balota, Duchek, Sergent-Marshall & Roediger 2006: expanded
  retrieval benefits over equal spacing in healthy aging AND early
  AD — schedule shape survives; it's the feedback, not the spacing,
  that's the old-age gate.

**Spec consequence:** `test_fb_req(age_eff)` — probability the
testing-effect gain (`retell_boost`, forward-testing §5.26 legs)
requires an external-correctness signal (correction, verification,
record agreement) to fire at full value; without it the leg pays
`test_nofb_mult` (0.5 at 75, 0.3 at 85) of its gain and the §6.58
confidence-inflation applies unopposed. Knots for `test_fb_req`:
0.2 at 55 → 0.5 at 70 → 0.8 at 85. Old self-quizzing without a
check is nearly restudy-shaped — the honest read of the crossover.

## 73. The confidence lie is recollection-specific — monitoring
    taxonomy

- Dodson, Bawa & Krueger 2007 (Psychol Aging 22:122 — verified):
  old adults worse at judging accuracy on source-ID and cued-recall
  EVEN WHEN matched on overall accuracy; monitoring intact for
  old-new recognition and general-knowledge questions.
- Dodson, Bawa & Slotnick 2007 (JEP:LMC 33:169 — verified):
  illusory-recollection signal-detection model — the source-memory
  d' deficit **virtually disappears** once illusory recollections
  are modeled; old source errors are misrememberings, not guesses.
- §22 priced confident-and-wrong; this prices WHERE the monitor
  fails: the calibration gap lives on recollection-demanding probes
  (source, pairing, sequence), not familiarity or semantic
  knowledge. An old character's "I'm sure it was Marta who said it"
  is overconfident; "I'm sure I've seen that face" and "I'm sure
  that's true" are calibrated. **[CONSENSUS pattern]**

**Spec consequence:** `mon_source_tax(age_eff)` — confidence
calibration penalty applied ONLY on emissions that require
recollection components (source tag, pairing, order, verbatim
field): reported confidence overstates true accuracy by up to
`mon_source_tax` (knots 0 → 0.1 at 65 → 0.2 at 80), while
familiarity-level and semantic emissions keep v2.1 metamemory
machinery unchanged. `illus_recol_p(age_eff)` — probability a
source-error emission is emitted WITH phenomenology (vivid, first-
person, `reportMode:"remember"`) rather than flagged guess: 0.05
at 50 → 0.15 at 70 → 0.3 at 85. The two params are the dialogue
difference between "…I think it was her?" and "I can picture her
saying it" — both wrong, different phenomenology.

## 74. What Part V deliberately did not do

- **No dedicated "inhibition" trait split** — Hasher & Zacks stays a
  mechanism family (§3), but the RIF/DF young-old-intact findings
  (§69) warn against any flat inhibitory-decline parameter; the
  two-regime knot is the honest form.
- **No semantic-store decline knobs** — §43's accreting crystallized
  channel stands; Bopp & Verhaeghen's simple-storage tier gives the
  flat anchor, not a new decline.
- **No "wisdom" or expertise-compensation knob** — reaffirmed from
  §58; `schema_support` + `meaningful_link_rescue` cover the
  behavioral shadow.
- **No dementia trajectories** — §16 stands; `rif_age_tail` and the
  old-old pivots are NORMAL-aging results (healthy 75+), not
  pathology gates.
- **No attention-as-cause** — Naveh-Benjamin 2004's negative result
  (reduced attentional resources not the sole mediator of ADH) is
  preserved: `da_enc_tax` and `adh_bind_tax` are independent legs,
  never collapsed into one "attention deficit."

## 75. Part V knot rows (extends §59; age_eff unless noted)

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| adh_bind_tax (×links, intent-gated) | 1.0 | 1.0 | 1.15 | 1.35 | 1.6 | 1.75 | Old & N-B 2008 (~1.5–2× item) |
| namepair_tax (×adh on person↔name) | 1.0 | 1.0 | 1.1 | 1.2 | 1.3 | 1.35 | N-B et al. 2004 |
| meaningful_link_rescue (−frac tax) | 0.3 | 0.3 | 0.3 | 0.3 | 0.3 | 0.3 | N-B et al. 2003 |
| wm_store_mult | 1.0 | 1.0 | 0.98 | 0.97 | 0.95 | 0.94 | B&V 2005 tier1 |
| wm_reorder_mult | 1.0 | 1.0 | 0.95 | 0.9 | 0.85 | 0.82 | B&V 2005 tier2 |
| wm_complex_mult | 1.0 | 1.0 | 0.92 | 0.83 | 0.72 | 0.65 | B&V 2005 tier3 |
| da_enc_tax | 1.0 | 1.0 | 1.1 | 1.2 | 1.3 | 1.4 | Anderson 1998 |
| da_ret_tax (×latency, free-recall) | 1.0 | 1.05 | 1.2 | 1.4 | 1.6 | 1.75 | Anderson 1998 |
| emo_ctx_gain | 1.0 | 1.0 | 0.9 | 0.75 | 0.5 | 0.4 | Kensinger 2002 |
| mw_decline (×ambient tick) | 1.0 | 1.0 | 0.9 | 0.75 | 0.6 | 0.55 | Jordano 2019 |
| sdt_share | 0.5 | 0.55 | 0.62 | 0.7 | 0.78 | 0.8 | Maillet & Schacter 2016b |
| rif_age_tail (×rif_k) | 1.0 | 1.0 | 1.0 | 0.9 | 0.5 | 0.3 | Aslan & Bäuml 2012 (pivot ~75) |
| seg_boundary_p | 1.0 | 1.0 | 0.9 | 0.8 | 0.7 | 0.65 | Sargent 2013; Zacks 2006 |
| bump_emit_w (importance draws) | 1.0 | 1.0 | 1.3 | 2.0 | 2.3 | 2.5 | Rubin & Schulkind 1997b |
| test_fb_req | 0.1 | 0.2 | 0.35 | 0.5 | 0.7 | 0.8 | Tse et al. 2010 |
| test_nofb_mult | 0.8 | 0.75 | 0.65 | 0.55 | 0.4 | 0.3 | Tse et al. 2010 |
| mon_source_tax | 0.0 | 0.0 | 0.05 | 0.1 | 0.2 | 0.25 | Dodson et al. 2007 |
| illus_recol_p | 0.03 | 0.05 | 0.08 | 0.15 | 0.25 | 0.3 | Dodson et al. 2007b |
| adh_intent_gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | locked ON (O&N-B 2008) |

Frozen constants: `adh_intent_gate` = apply tax to intentional
increment only; `da_rif_weak` = rif_k ×(1−0.5·C.da) at ALL ages
(Ortega); `sdt_min_cue` = involuntary emissions below sdt_share
require a present-stimulus trace. **[Knot interpolations HYPOTHESIS;
anchors CONSENSUS; the ~75 pivot class (RIF, DF) is the most
load-bearing single number this part.]**

## 76. Spec changes v4.9 → v5.0 (delta summary)

| # | Change | Grounding |
|---|---|---|
| I1 | §4.25: `adh_bind_tax`/`adh_intent_gate`/`namepair_tax`/`meaningful_link_rescue` on link writes | §63–§64 |
| I2 | §4.25: `wm_*_mult` three-tier knots on retrieval consumers | §65 |
| I3 | §4.26: `seg_boundary_p` boundary-mint decline + `coarse:true` records | §70 |
| I4 | §4.27: `emo_ctx_gain` declines; emo-item legs reaffirmed flat | §67 |
| I5 | §5.49: `da_enc_tax`/`da_ret_tax` asymmetric DA legs | §66 |
| I6 | §5.50: `rif_age_tail` + `da_rif_weak` universal | §69 |
| I7 | §5.51: `mw_decline`/`sdt_share` on ambientMemoryScan | §68 |
| I8 | §5.52: `test_fb_req`/`test_nofb_mult` on testing legs | §72 |
| I9 | §6.70: `mon_source_tax`/`illus_recol_p` recollection-only monitoring | §73 |
| I10 | §6.71: `bump_emit_w` on importance draws | §71 |

New params: `adh_bind_tax`, `adh_intent_gate`, `namepair_tax`,
`meaningful_link_rescue`, `wm_store_mult`, `wm_reorder_mult`,
`wm_complex_mult`, `da_enc_tax`, `da_ret_tax`, `emo_ctx_gain`,
`mw_decline`, `sdt_share`, `rif_age_tail`, `seg_boundary_p`,
`bump_emit_w`, `test_fb_req`, `test_nofb_mult`, `mon_source_tax`,
`illus_recol_p`. Frozen: `da_rif_weak`, `sdt_min_cue`. Record field:
`coarse:true`. Locked nulls: DA-at-retrieval → miss rate = 0;
testing legs keep schedule-shape invariance (expanded>equal holds
both ages — Balota 2006); intrusive-trauma channel exempt from
mw_decline.

## 77. Validation probes P535–P544

- **P535 ADH split (MUST — sign-lock):** matched encode with
  intentional effort: at 75, link-field recall (who/where/when
  attachments, source tags) drops ≥1.4× the item-field drop; same
  records encoded at floor attention show item≈assoc loss (the
  incidental null — fails if incidental encodes show the split).
- **P536 DA asymmetry (MUST — explicit null):** DA at retrieval
  raises latency (×1.4+ at 80, free recall) but does NOT raise miss
  rate at ANY age; DA at encoding raises miss rate, more at 80.
- **P537 face-name worst case (MUST):** person↔name links at 78 fail
  more than person↔role (meaningful) links matched on exposure;
  name failures present as intact face familiarity + blank name
  slot (not full-record miss).
- **P538 RIF pivot (MUST — sign-lock):** selective retell at 70
  suppresses rivals at ≥0.8× the 30yo rate; at 82 suppression is
  ≤0.4× — and under C.da the suppression shrinks at BOTH ages
  (Ortega arm, no age interaction coded beyond rif_age_tail).
- **P539 emo split (MUST — sign-lock):** at 78, emotional items
  retain ≥0.9 of their 30yo enhancement ratio while
  emotional-CONTEXT benefit on neutral co-encodees falls to ≤0.6× —
  fails if w_emo legs drift onto the decline curve.
- **P540 quiet mind (SHOULD):** ambientMemoryScan emission rate at
  80 ≤0.65× the 30yo rate; ≥75% of old emissions trace to a
  present-stimulus cue vs ≤55% for young; intrusive-trauma channel
  unchanged.
- **P541 coarse chapters (SHOULD):** same 2h event stream → record
  count at 78 ≤0.7× the count at 30; `coarse:true` records carry
  higher gist share and wider dateEstimate sigma.
- **P542 bump importance (MUST — sign-lock):** "most important"
  draws at 70 land ≥50% inside encodeAge 18–30 while word-cued
  draws keep the recency+power-function shape — fails if
  importance draws mirror cued draws.
- **P543 feedback gate (SHOULD):** at 78, uncorrected self-retell
  improves later accuracy ≤ restudy (crossover allowed); with a
  correctness signal the testing gain returns to ≥0.7× young level.
- **P544 recollection-only monitoring (MUST):** at 78, confidence
  inflation appears on source/pairing/order emissions but NOT on
  familiarity-level or semantic emissions; illus_recol emissions
  carry reportMode:"remember" despite being wrong.

## 78. Part V honest limits

- `adh_bind_tax` + `link_p` + `hyperbind_p` now form a three-legged
  binding system (loss, baseline, spurious-gain); the legs are
  conceptually distinct (deficit on intentional links / incidental
  overbinding) but the joint fit is ours — flagged HYPOTHESIS; the
  P535 incidental-null is the discriminating test.
- The ~75 pivot (RIF, DF, and plausibly other inhibitory controls)
  is a group-mean boundary; individual `reserve`/`aging_rate` shifts
  it via age_eff — right in spirit, unpriced per mechanism.
- `wm_complex_mult` triple-counts against `search_breadth` and
  `pm_self` if all three ride age_eff — implementers should treat
  wm_complex as the JUSTIFICATION for existing knots, applying it
  only to the new consumers (multi-cue fusion, reorder); the
  deliberate redundancy note is in §7.
- `sdt_share` is calibrated to think-aloud lab probes, not
  conversation; the conversational version likely runs hotter
  (people ARE the cues) — noted, unfit.
- `bump_emit_w`'s window (18–30) ignores the documented second-bump
  and cohort-imprint structures (§4.1 epochal); importance draws
  may show epochal spikes on public_scale≥2 records — emergent,
  not coded.
- `test_nofb_mult` consolidates whatever was retrieved INCLUDING
  errors — that's the mechanism (confidence-inflated wrong
  rehearsal); the harm is emergent and could read as punitive in
  low-feedback worlds. Watch P543 in harness.
- As always: `deathDay` machinery (§9) overrides every Part V
  channel — the binding bill accelerates off-cliff, not on-knots.
