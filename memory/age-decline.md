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

---

# Part VI — the ledger splits: what old age keeps, rents, and loses

Parts I–V built the decline machinery (self-initiation, binding,
inhibition, consolidation). Part VI completes the ledger: the
dual-process split the spec has so far handled only implicitly
(§§79–80), the two *modulatory* rings the literature keeps pricing
and we kept deferring — motivation/emotion-regulation and circadian
state (§§81–82) — the upstream hardware (§83), the compensation
ceiling (§84), the channels that DO rescue old encoding (§§85–87),
the social context effects (§§88, 90), and the one amplifier that
makes old characters dangerous to interview (§89). Every finding
lands in params, knots, or probes as before.

## 79. Recollection vs familiarity — the dual-process ledger, priced

The spec has emitted `reportMode:"remember"` records since v5.0
(§6.70) but never priced the underlying split. Do it now — the
aging data demand it.

- Yonelinas 2002 (*Psych. Bull.* 128:800 — the definitive aging
  meta-analysis of process-dissociation and ROC estimates):
  **recollection declines steeply with age; familiarity is largely
  preserved until very old age.** The effect-size gap is roughly
  2:1, and familiarity's decline, where it appears, is confined to
  the 75+ group. Light, Prull, LaVoie & Healy 2004 reach the same
  split in dual-process signal-detection terms. **[CONSENSUS — the
  single best-replicated dissociation in the field]**
- Behavioral corollaries: older adults over-rely on familiarity
  ("I know this person, but…" — the face is warm, the context is
  gone); Jacoby 1999 shows the reliance is exploitable (familiar
  claims read as true — our §56 fluency-fame machinery already
  assumes this); item memory survives while source/context
  recollection is what fails — i.e., the ADH (§63) is the
  encoding-side cause and this is the retrieval-side readout.
- Importantly, familiarity's survival is *functional*: it does not
  carry source, order, or pairing fields. A familiarity-driven
  emission has no `when`, no `who else`, no reliable `hearCount`.

**Spec consequence (v5.12):** introduce explicit legs —
`recol_mult(retrievalAge)` scales the probability that a
successful recall carries field-level episodic detail (when/where/
pairing/source), and `fam_mult(retrievalAge)` scales the bare
recognition/familiarity channel. Reconstructed emissions at high
age degrade to `reportMode:"know"` with hot familiarity and empty
link fields rather than emitting false detail — the confab_fill
channel (existing) then decides whether the gap gets filled or
reported as blank warmth. Knots below.

## 80. Fuzzy-trace asymmetry — verbatim falls, gist holds and gets weaponized

- Brainerd & Reyna's fuzzy-trace theory applied to aging (Koutstaal
  & Schacter 1997; Tun et al. 1998; Reyna 2012): **verbatim traces
  weaken with age while gist traces are preserved — and gist-based
  responding therefore rises.** The old system doesn't just keep
  less; it keeps a different *kind* of thing.
- The dangerous corollary: **gist-consistent false memories
  increase with age.** Balota et al. 1999 (*Psych. & Aging*
  14:321 — DRM): healthy older adults show MORE false recognition
  of critical lures than young adults, while showing less
  veridical recall; AD exaggerates both directions. Koutstaal &
  Schacter 1997: category-exemplar false alarms double.
  **[CONSENSUS]** — the false memory is not noise, it is the
  preserved gist voting.
- Boundary: the lure must share gist. Unrelated foils are rejected
  at near-young rates (the old listener doesn't believe *anything*,
  just the plausible version of what happened).

**Spec consequence (v5.12):** two params. `gist_survive_mult(age)`
≥1 on gist-field strength (the *relative* preservation — verbatim
fields keep `k_verbatim` decline while gist fields get this
counter-leg). `gist_false_mult(age)` scales §6.8 gist-lure and
phantom-fusion legs — old characters endorse gist-consistent
reconstructions of their own past at ~1.6× young. Locked null
`gist_content_null`: `gist_false_mult` applies ONLY to lures
sharing the record's gist fields; unrelated foils are exempt.

## 81. The positivity effect — goal-driven, attention-gated

- Mather & Carstensen 2005 (*Trends Cog. Sci.* 9:496 meta):
  with age, attention and memory shift toward positive over
  negative material — the positivity effect, consistent with
  socioemotional selectivity theory (Carstensen): shrinking time
  horizons re-prioritize emotion regulation over information
  acquisition. Reed & Carstensen 2012 meta replicates the
  memory leg. **[CONSENSUS pattern; mechanism DEBATED — deliberate
  regulation vs automatic shift]**
- The gate that makes it implementable: Mather & Knight 2005 —
  **the positivity effect requires cognitive control and
  disappears under divided attention.** It is a goal, not a
  filter; a distracted old character doesn't show it.
- This is NOT "old people encode happy events more." Encoding is
  roughly valence-neutral; the bias lives at retrieval/reconstruction
  and in attention allocation. Our `w_emo_pos`/`w_emo_neg` knot
  (older: 1.25/0.85) already approximates the emission-side
  asymmetry — Part VI prices the retrieval-choice leg and the
  DA gate explicitly.

**Spec consequence (v5.12):** `pos_gain(age)` ≥1 multiplies the
emission-ranking score of positive-valence candidate records at
age_eff ≥55 (their retellings skew warm — the complaint, the
scandal, the insult get outcompeted, not deleted). Locked null
`pos_da_null`: under `C.da` the leg returns exactly 1.0 at all
ages. Pairs with `neg_affect_decay` (which is decay-side; this is
selection-side — both can be true at once and the data say they
are).

## 82. The synchrony effect — the older brain has a morning

- May, Hasher & Stoltzfus 1993 (*Psych. Sci.* 4:326): most older
  adults are morning types; **tested at their peak time, the age
  gap in recognition memory disappears; tested at off-peak, it's
  large.** Yoon 1997; Hasher et al. 2002/2005 replicate across
  tasks. **[CONSENSUS]**
- Mechanism is inhibitory (May & Hasher 1998 *JEP:HPP* 24:363;
  May 1999): off-peak testing weakens inhibition — more
  distraction, more intrusion — so synchrony loads on the SAME
  channel as Part III's inhibition deficit. Well-learned/automatic
  responses are exempt at both ages.
- May, Hasher & Foong 2005 (implicit/explicit split): **automatic
  retrieval shows no synchrony effect — only controlled retrieval
  pays the off-peak tax.** The involuntary highway (§42) doesn't
  keep office hours.
- Individual variation: ~75% of older adults are morning types;
  chronotype is a profile trait, not an age constant.

**Spec consequence (v5.12):** the v0.7 `peak_hour`/`synchrony_gain`
machinery already models off-peak penalty but as a flat trait —
v5.12 prices the AGE leg and the scope. Profile field
`chronotype` ∈ {morning, neutral, evening} (world-builder
assigns; most 65+ mains morning) maps onto `peak_hour` at
profile generation. `tod_tax(age)` is the age-knot on the
off-peak penalty — ~0 at 30 → ~0.25 at 80 — applied to
CONTROLLED encode/recall paths only. Locked null
`auto_sync_null`: implicit/involuntary and well-learned-routine
legs ignore `timeOfDay`/`peak_hour` entirely (May et al. 2005).

## 83. The sensory-cognitive cascade — ears before hippocampus

- Baltes & Lindenberger 1997 (*Psych. & Aging* 12:12 — Berlin
  Aging Study): vision and hearing acuity jointly mediate a large
  share of age variance in cognition — the "common cause" finding.
  **[CONSENSUS pattern; causal direction DEBATED — shared neural
  decline vs sensory-deprivation load vs both]**
- Lin et al. 2011 (*Arch. Neurol.* 68:214): hearing loss predicts
  incident dementia, dose-dependent — the strongest single-modality
  risk result. Wayne & Johnsrude 2015 (*Front. Neurosci.*):
  perceptual effort — degraded input taxes the encoding resource
  even when speech is understood (the §39 effortful-listening tax,
  now with an upstream cause).
- Practical reading for RW: an unaided hearing impairment is not
  cosmetic; it is an encoding tax that ALSO predicts faster
  decline — two legs, not one.

**Spec consequence (v5.12):** profile field `sensory` ∈ [0,1]
(unaided acuity deficit). Encode side: `sens_enc_tax` multiplies
auditory-channel field writes at (1 − 0.3·sensory). Decline side:
`sensory` ≥0.5 shifts `age_eff` by `sensory_age_shift` ~+4y
(HYPOTHESIS magnitude — Lin is epidemiological, not mechanistic).
Hearing aids = runtime fix: setting `sensory` back to ~0 removes
the encode tax prospectively (HYPOTHESIS: the age_eff shift is
set at bible-write time and does not reverse — arrested cause,
not reversed cause).

## 84. HAROLD and the headroom ceiling — compensation is finite

- Cabeza 2002 (*Psych. & Aging* 17:85 — HAROLD): older adults
  recruit bilateral PFC where young adults recruit unilateral —
  functional compensation. Reuter-Lorenz & Cappell 2008 (CRUNCH):
  **compensation engages at lower demand but saturates sooner** —
  an inverted-U: old brains run hotter on easy tasks and hit the
  ceiling on hard ones. **[CONSENSUS pattern; compensation vs
  dedifferentiation interpretation DEBATED — Grady 2012]**
- Schneider-Garces et al. 2010 (fMRI load curves): the activation
  curve peaks earlier in old adults — measurable headroom, not a
  metaphor.

**Spec consequence (v5.12):** `comp_headroom(age)` — effective
capacity ceiling on `wm_complex_mult`/`search_breadth` consumers:
old profiles reach nominal performance on LOW-demand recall
(compensation leg = a +`comp_gain` 0.05–0.1 on single-cue
retrieval at 65–75 — they can grind harder when the task allows
grinding) but pay a steeper-than-linear cliff when demand exceeds
`headroom`: multi-cue fusion and reorder at high load degrade
×(1 + `headroom_excess·(demand − headroom)`), `headroom` ~2 at
30 → ~1.1 at 80 on the §65 tier-3 scale. The observable signature:
an old character who handles the afternoon shift fine and
collapses specifically at the dinner rush — not uniformly slower,
suddenly out of room.

## 85. Enactment rescues encoding — do it, don't just watch it

- The enactment effect (subject-performed tasks; Engelkamp &
  Zimmer; Cohen 1981): enacting an instruction ("roll the
  dough") produces better memory than hearing or watching it —
  and the effect is **largely age-invariant** (Bäckman & Nilsson
  1985; Nyberg et al. meta-analyses). Older adults get the full
  rescue where verbal instructions fail them. **[CONSENSUS
  pattern; component accounts DEBATED]**
- Contrast: observer channel records (v5.11 `role:"observer"`)
  mint at a discount at ALL ages past ~8 — watching isn't doing,
  for anyone, but the gap between them is widest in old age
  because the verbal/visual legs have declined while the motoric
  leg hasn't.

**Spec consequence (v5.12):** Event field `enacted:true` (the
character physically performed the action sequence, not just
witnessed/planned it) applies `enact_rescue(age)` — a multiplier
on E that rises with age: ~1.1 at 30 → ~1.35 at 80. Composes
with the existing flat `enact_gain` trait (v1.2): `enact_gain`
is the per-character disposition to benefit from doing;
`enact_rescue` is the age-leg — the rescue grows BECAUSE the
other channels fell (the ratio is the finding, absolute strength
still declines). Implementation note for world-builder: routine
physical tasks (her bakery's dough, his tool bench) should carry
`enacted` — this is *why* procedural-adjacent daily records
survive in old mains.

## 86. The transactive dyad — old couples remember together

- Harris, Keil, Sutton, Barnier & McIlwain 2011 (*Discourse
  Processes* 48:267 — "We Remember, We Forget"): 12 older married
  couples recalling lists AND autobiographical material — some
  couples show collaborative facilitation, some inhibition;
  group-level strategy use predicts which. Johansson, Andersson &
  Rönnberg 2005 (*Scand. J. Psych.* 46:349): very old couples
  with clear division-of-responsibility and agreed expertise
  suffer least — transactive systems compensate.
- Barnier, Priddis, Broekhuijse et al. 2014 (*JARMAC* — "reaping
  what they sow"): long-married older couples generated MORE
  internal/episodic details recalling together than alone — the
  internal-detail deficit of §3 partially rescues inside the dyad;
  young couples show no such benefit (they don't need it).
- Boundary: strangers get the standard collaborative-inhibition
  result (Weldon & Bellinger; Basden et al.) — the benefit is
  earned by shared history and negotiated expertise, not by
  co-presence.

**Spec consequence (v5.12):** context field `withPartner:true`
(resolves via PersonModel `rel:"spouse"`/`long_partner` with
shared-encode overlap on the queried record) applies
`transact_gain(age)` — 1.0 at ≤50 → ~1.25 at 75+ — to emitted
internal-detail fields specifically, plus a small breadth gain
(the partner's interjections act as generated cues — env_support
through a person). Locked null `transact_stranger_null`:
non-shared-history co-recallers keep existing collaborative-
inhibition (`plist_suppress` family) — no leg.

## 87. Prospective memory's two legs — event-based holds, time-based falls

- `pm_self` (v0.4) lumped all prospective memory. The literature
  demands the split: McDaniel & Einstein's multiprocess framework
  — **event-based PM (a cue does the work: "when I see Maria,
  ask her") declines modestly with age; time-based PM ("at 3pm,"
  "in two days" — pure self-initiation, no cue) declines steeply.**
  Park, Hertzog, Kidder et al. 1997; Henry et al. 2004
  meta-analysis (d ≈ 0.4–0.8 event vs d ≈ 1.0+ time in naturalistic
  tasks). **[CONSENSUS]**
- The rescue: implementation intentions ("when X, then Y")
  convert time-based into pseudo-event-based intentions and
  disproportionately help older adults (Liu & Park 2004; Chasteen
  et al. 2001). **[CONSENSUS direction]**
- Kvavilashvili's paradox (naturalistic tasks show SMALLER age
  deficits than lab tasks — older adults compensate with external
  aids and motivation in real life) is already honored by §53
  offloading; the two legs remain.

**Spec consequence (v5.12):** Intentions gain `cueType` ∈
{event, time} at mint (world tags it — "when I next see her" vs
"Thursday"). `pm_time_tax(age)` multiplies the existing `pm_self`
decline on `cueType:time` only (×1.3 at 70, ×1.6 at 85);
`cueType:event` rides unmodified `pm_self`. `impl_intent` flag
(rephrased-as-if-then intentions) removes ~half the time tax.
PM pop-out (§5.60 `pm_popout_gain`) applies only to event cues —
by construction.

## 88. Stereotype threat — the context taxes performance

- Hess, Auman, Colcombe & Rahhal 2003 (*Psych. & Aging* 18:3):
  priming negative aging stereotypes reduces older adults' recall
  — and the damage is worse for those who value memory most.
  **[CONSENSUS that the effect exists; size DEBATED — replication
  range modest, see also Lamont et al. 2015 meta]**
- Mechanism (relevant to modeling): the threat consumes the
  working-memory resource it's testing — a contextual load on the
  already-shrunken tier-3 ladder, not a change to stored records.

**Spec consequence (v5.12):** context flag `age_salient:true`
(the situation makes age/remembrance-ness explicit — a memory
test, a "senior moment" remark, being asked to recall in front of
young people) multiplies `wm_complex_mult`/`pm_self` legs by
`stereo_tax` ~0.85 at retrieval only — records unchanged,
performance taxed. Personality moderation: high `g_mem` pride /
memory-anxious profiles take the larger hit (Hess's moderation).
Cheap, situational, reversible — the same character is sharper
an hour later.

## 89. Misinformation susceptibility amplified — the suggestible elder is specific, not general

- Jacoby 1999; Roediger & Geraci 2007 (*Learn. & Mem.* 14:90):
  older adults show heightened misinformation effects in several
  paradigms — the mechanism is our §89 stack: familiarity without
  recollection (misinformation feels warm), source-decay head
  start (`beta_source` elevated), and liberal criterion under
  forced report (§5.61). **[CONSENSUS pattern; magnitude DEBATED
  — Karpel et al. 2001, Wylie et al. find null/conditional
  effects; the honest reading: amplification appears when
  encoding was poor and delay is long — i.e., in the conditions
  old age creates by default]**
- Interaction with §6.83: yield vs shift. The literature
  suggests the age effect loads disproportionately on SHIFT
  (genuine belief change via source failure) more than YIELD
  (acquiescence) — older adults are less acquiescent to authority
  than children but worse at knowing where they heard what.

**Spec consequence (v5.12):** `sug_age_mult(age)` on the §6.83
shift leg only: 1.0 ≤50 → ~1.3 at 70 → ~1.5 at 85, applied
through the existing `misinfo_suscept` product (does not stack
with `warn_mult` floors — `dispute_mult` still governs live
dispute). Yield leg unchanged (locked null `yield_age_null`).
The older main becomes the rumor ledger's best amplifier: hears
it wrong, forgets where, believes it warm.

## 90. Fitness is a reserve component — the modifiable dial

- Erickson et al. 2011 (*PNAS* 108:3017 — RCT): aerobic training
  increased hippocampal volume ~2% and improved memory in older
  adults — one year of walking ≈ reversing 1–2 years of volume
  loss. Hillman, Erickson & Kramer 2008 (*Nat. Rev. Neurosci.*):
  the mechanism review. Colcombe & Kramer 2003 meta: fitness
  effects are largest on executive-control tasks — i.e., on the
  self-initiation channel that ages worst. **[CONSENSUS
  direction — exercise helps; exact cognitive magnitude DEBATED
  (recent large trials attenuated the effect)]**
- Distinct from `reserve` (education/IQ — a lifetime-accrual
  proxy): fitness is CURRENT, bidirectional, and character-
  behavioral. A walker and a sedentary neighbor of the same age
  and education differ.

**Spec consequence (v5.12):** the `fitness` trait already exists
(v1.9 — passthrough on age_eff offset); v5.12 re-anchors and
extends it. `fitness_shift` caps the contribution at ~3y, and
`rf_cap` 12y bounds the `reserve`+`fitness` combined shift
(diminishing returns — common-cause ceiling). Unlike `reserve`,
`fitness` DRIFTS with behavior: a main who stops walking for a
season slowly loses the offset — `fitness_drift_hl` ~1y
(HYPOTHESIS; gains require sustained activity beats, losses
accrue with sedentary seasons). This is the "modifiable" dial —
nothing else in the aging stack moves in a character's lifetime
except terminal decline and sensory fix.

## 91. What Part VI deliberately did not do

- **Menopause/estrogen** — real literature (Maki & Weber 2021
  review: verbal memory dips across the transition, partially
  recovers) but too hot and too variable to pin knots on; noted
  as a candidate `hormonal` overlay for a future pass.
- **Widowhood/grief-accelerated decline** — bereavement shows
  cognitive acceleration in some cohorts; confounded with the
  isolation overlay (§40) which already captures the durable
  part. No separate param.
- **Nutrition/supplements** — literature too weak to price.
- **Age-of-acquisition effects on the lexicon** — folded into
  §57 semantic-search tax implicitly.
- **Dementia spectra** — still out of scope (§9 `deathDay` covers
  scripted terminal ramp only; MCI/AD profiles would be a separate
  pathological doc if ever needed).

## 92. Part VI knot rows (extends §75; age_eff unless noted)

| param | 30 | 50 | 60 | 70 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| recol_mult | 1.0 | 0.95 | 0.85 | 0.7 | 0.55 | 0.45 | Yonelinas 2002 |
| fam_mult | 1.0 | 1.0 | 1.0 | 0.95 | 0.9 | 0.85 | Yonelinas 2002 |
| gist_survive_mult | 1.0 | 1.0 | 1.05 | 1.15 | 1.25 | 1.3 | Koutstaal & Schacter 1997 |
| gist_false_mult | 1.0 | 1.05 | 1.15 | 1.35 | 1.6 | 1.75 | Balota et al. 1999 |
| pos_gain | 1.0 | 1.0 | 1.08 | 1.2 | 1.3 | 1.35 | Mather & Carstensen 2005 |
| tod_tax (off-peak, controlled) | 0.0 | 0.05 | 0.1 | 0.18 | 0.25 | 0.28 | May et al. 1993 |
| sens_enc_tax | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | = (1−0.3·sensory), flat |
| comp_gain (low-demand leg) | 0.0 | 0.0 | 0.05 | 0.1 | 0.05 | 0.0 | CRUNCH inverted-U |
| headroom (tier-3 demand units) | 2.0 | 1.9 | 1.7 | 1.4 | 1.1 | 1.0 | Schneider-Garces 2010 |
| enact_rescue | 1.1 | 1.1 | 1.15 | 1.25 | 1.35 | 1.4 | Bäckman & Nilsson 1985 |
| transact_gain | 1.0 | 1.0 | 1.05 | 1.15 | 1.25 | 1.3 | Barnier et al. 2014 |
| pm_time_tax (×pm_self decline) | 1.0 | 1.0 | 1.15 | 1.3 | 1.5 | 1.6 | Henry et al. 2004 |
| impl_intent_gain (−frac of time tax) | 0.3 | 0.3 | 0.4 | 0.5 | 0.55 | 0.55 | Liu & Park 2004 |
| stereo_tax (× wm/pm, retrieval) | 1.0 | 1.0 | 0.95 | 0.88 | 0.85 | 0.85 | Hess et al. 2003 |
| sug_age_mult (shift leg) | 1.0 | 1.0 | 1.15 | 1.3 | 1.45 | 1.5 | Roediger & Geraci 2007 |
| fitness_shift (y on age_eff) | 0–3 | 0–3 | 0–3 | 0–3 | 0–3 | 0–3 | Erickson 2011 |

Frozen constants: `pos_da_null` — pos_gain →1.0 under C.da;
`auto_sync_null` — implicit/involuntary legs ignore timeOfDay;
`gist_content_null` — gist_false_mult applies only to gist-shared
lures; `transact_stranger_null` — no gain without shared-encode
history; `yield_age_null` — sug_age_mult never touches §6.83
yield; `rf_cap` 12y — reserve+fitness combined age_eff shift cap;
`fitness_drift_hl` ~1y — behavior-drift half-life on the fitness
offset (HYPOTHESIS). **[Knot
interpolations HYPOTHESIS; anchors CONSENSUS; the recol/fam 2:1
split and the DA-gated positivity are the most load-bearing
numbers this part.]**

## 93. Spec changes v5.11 → v5.12 (delta summary)

| # | Change | Grounding |
|---|---|---|
| I1 | §4.32a: `recol_mult`/`fam_mult` legs minted on recall emissions; familiarity-only output degrades to `reportMode:"know"` | §79 |
| I2 | §4.32b: `gist_survive_mult` on gist-field S; `enact_rescue` on `enacted:true` Events; `sens_enc_tax` on auditory fields via `sensory` | §§80, 85, 83 |
| I3 | §4.32c: `stereo_tax` on `age_salient` contexts (retrieval-side legs only) | §88 |
| I4 | §5.64a: `tod_tax`/`chronotype`/`timeOfDay` on controlled paths; `auto_sync_null` | §82 |
| I5 | §5.64b: `pos_gain` on emission ranking of positive candidates; `pos_da_null` | §81 |
| I6 | §5.64c: `comp_gain`/`headroom` — inverted-U demand curve on tier-3 consumers | §84 |
| I7 | §5.64d: `transact_gain` on `withPartner` recall — internal-detail fields only; `transact_stranger_null` | §86 |
| I8 | §5.64e: `cueType:{event,time}` on Intentions; `pm_time_tax`; `impl_intent` flag | §87 |
| I9 | §6.109a: `gist_false_mult` on gist-lure/phantom legs; `gist_content_null` | §80 |
| I10 | §6.109b: `sug_age_mult` on §6.83 shift leg only; `yield_age_null` | §89 |
| I11 | §7: `sensory`, `chronotype` profile fields (new); existing `fitness` trait re-anchored; `sensory_age_shift`, `fitness_shift`, `fitness_drift_hl` on age_eff; `rf_cap` 12y combined cap | §§83, 90 |

New params: `recol_mult`, `fam_mult`, `gist_survive_mult`,
`gist_false_mult`, `pos_gain`, `tod_tax`, `sens_enc_tax`,
`comp_gain`, `headroom`, `enact_rescue`, `transact_gain`,
`pm_time_tax`, `impl_intent_gain`, `stereo_tax`, `sug_age_mult`,
`sensory_age_shift`, `fitness_shift`, `fitness_drift_hl`, `rf_cap`.
New profile fields: `chronotype`, `sensory` (existing `fitness`,
`peak_hour`/`synchrony_gain` reused — v5.12 adds the age knot
`tod_tax` and the scope nulls). Event field: `enacted`. Context
fields: `timeOfDay`, `withPartner`, `age_salient`. Intention
field: `cueType`. Locked nulls: `pos_da_null`, `auto_sync_null`,
`gist_content_null`, `transact_stranger_null`, `yield_age_null`.

## 94. Validation probes P667–P676

- **P667 R/F split (MUST — sign-lock):** at retrievalAge 78,
  emissions carrying field-level episodic detail (when/pairing/
  source) decline ≥1.8× the bare-familiarity decline vs the 30yo
  baseline; `reportMode:"know"` share rises correspondingly —
  fails if know-emissions carry source fields.
- **P668 gist asymmetry (MUST — sign-lock):** at 80, gist-consistent
  lures endorsed at ≥1.5× young rate while unrelated foils are
  endorsed at ≤1.1× — `gist_content_null` fails on ANY unrelated-
  foil amplification.
- **P669 positivity gated (MUST + locked null):** at 75, positive-
  valence candidate records out-emit negative at ≥1.2× relative
  to the 30yo ratio under full attention; under C.da the ratio
  returns to baseline exactly — `pos_da_null`.
- **P670 synchrony scope (MUST + locked null):** a `morning` 75yo
  recalled off-peak (evening) shows controlled-recall misses ≥
  `tod_tax`-scaled rate, while involuntary emissions and routine-
  script recall are statistically unchanged — `auto_sync_null`.
- **P671 sensory cascade (SHOULD):** `sensory:0.6` profile encodes
  auditory-channel fields at ~0.8× matched `sensory:0` AND shows
  the `sensory_age_shift` on downstream decline legs; restoring
  sensory → 0 removes the encode tax but not the shift.
- **P672 headroom cliff (MUST — shape-lock):** 78yo on single-cue
  recall matches or exceeds knot prediction WITH `comp_gain`; on
  tier-3 multi-cue fusion, performance falls super-linearly past
  `headroom` — a linear decline FAILS this probe.
- **P673 enactment rescue (SHOULD):** `enacted:true` events at 80
  retain ≥0.8 of their 30yo S-relative advantage while matched
  `observer`-role events retain ≤0.6 — the DOING gap widens with
  age.
- **P674 transactive dyad (MUST + locked null):** `withPartner`
  recall at 78 emits ≥1.15× internal-detail fields vs solo recall
  on shared-encoded records; a `rel:"acquaintance"` co-recaller
  produces no gain — `transact_stranger_null`.
- **P675 PM split (MUST):** `cueType:time` intentions at 80 fire at
  ≤0.7× the `cueType:event` rate (matched arming delay); an
  `impl_intent` time intention recovers ≥50% of the gap.
- **P676 suggestibility scope (MUST + locked null):**
  misinformation adoption at 80 rises on the §6.83 shift leg
  (≥1.3× young) while yield scores are statistically unchanged —
  `yield_age_null`; the stereotype-tax context `age_salient`
  shows retrieval-side degradation with zero change to stored S.

## 95. Part VI honest limits

- `recol_mult`/`fam_mult` price the OUTPUT split; the spec's
  single-S record store doesn't have separate R/F substrates —
  this is a defensible implementation fiction (the dissociation
  lives at emission) but a ROC-style probe would be surface-only.
  Flagged HYPOTHESIS-layer.
- `pos_gain` rides emission ranking, meaning it also shapes what
  gets REHEARSED (retell_boost accrues on what's emitted) — the
  positivity bias compounds through the rumor ledger; that's
  plausible (and matches SST's world-level prediction) but is
  emergent, not measured.
- `tod_tax` treats chronotype as a static profile field; real
  chronotype drifts morningward with age — a main's peak time
  should arguably migrate with `retrievalAge` (HYPOTHESIS, unpinned:
  bible-set for now, note for world-builder that 65+ mains default
  morning unless a beat says otherwise).
- `comp_gain`'s inverted-U (benefit at 65–75, gone at 85) is the
  least-anchored knot in the part — CRUNCH is a demand-curve
  model, and mapping "demand" onto our tier scale is ours.
- `transact_gain` requires `rel` + shared-encode overlap — the
  ambient NPCs can't currently mint the shared history cheaply;
  this leg is main-cast-only in practice until NPC memory exists.
- `sug_age_mult` + `gist_false_mult` + `illus_recol_p` now form a
  three-route false-memory stack on old profiles — the joint
  product is likely too hot at 85; P676 measures the shift leg
  alone, and a composite stack probe is deferred to the harness
  pass (watch for elderly mains endorsing ~2× young false-alarm
  rates — that IS the literature number, but the rumor cascade
  downstream is unpriced).
- `fitness` drift is one-way-modeled (loss is easy, gain assumes
  sustained activity events); world-builder decides whether
  "joined a walking group" is a bible beat or a sim emergent —
  spec supports both, neither is scheduled.

# Part VII — v76: the trajectory layer (decline is a distribution, not a
# curve; the noise arrives before the fall; the spared floors get names)

Parts I–VI priced the MEAN decline curve. The literature's harder finding
is that the mean is a fiction of averaging: on 15-year longitudinal data
only ~2/3 of healthy adults track the age-typical slope at all — a fifth
decline nothing, an eighth fall off a shelf. Part VII splits the curve
into trajectory classes, prices the two leading indicators that arrive
before measurable loss (complaints, trial noise), taxes the everyday
ecology old characters actually live in (walking while remembering,
retiring, navigating a changed neighborhood), and names the floors that
survive (priming, the familiar route home). Everything rides the same
`age_eff` machinery; nothing here reopens the store.

## 96. The trajectory split — maintainers, averages, decliners
(Josefsson, de Luna, Pudas, Nilsson & Nyberg 2012 *J. Am. Geriatr. Soc.*
60:2308 — verified: Betula N=1,558, 15y: 18% maintainers, 68% average,
13% decliners; Pudas et al. 2013; memory-profile/dementia follow-up:
decliners ~4× dementia risk, maintainers ~2.6× reduced — CONSENSUS that
the distribution is real, class boundaries SEMI-arbitrary by ±1 SD rule).
The mean curve in Parts I–VI is now the `traj:"average"` arm; a profile
draws `traj` ∈ {maintain, average, decline} with base rates
{0.18, 0.68, 0.14} modulated by existing traits: `fitness` +, `apoe`
(ε4) −, `social`/partnered +, female `sex` + (Betula predictor table —
each shifts the draw ~±0.05 on the relevant marginal, summed, clamped
0.02–0.4 per class). Effect: `maintain` halves the post-60 slope terms
(`maint_slope_mult` 0.5), `decline` doubles them and adds an accelerating
quadratic (`decl_accel` — decline compounds, matching the 10–15y
pre-diagnosis divergence). **[Class rates CONSENSUS; the trait-draw
magnitudes and the acceleration form HYPOTHESIS. The class is drawn at
bible-write and is NOT knowable to the character — SCD §98 is its only
surface symptom.]**

## 97. The noise arrives first — IIV as leading indicator (Hultsch,
MacDonald & Dixon 2002; MacDonald, Nyberg & Bäckman 2006 — verified;
Lövdén, Li, Shing & Lindenberger 2007 BASE 13y — verified: within-person
RT variability PRECEDES and predicts decline 70–102; meta r≈.20 — Buela-
Casal? no: the longitudinal meta r=.20 CI[.09,.31] — verified).
`iiv` trait (v3.1) gains an age-linked mean: `iiv_eff = iiv ·
(1 + iiv_age_slope·(age_eff − 60)/20)` for age_eff>60, `iiv_age_slope`
≈0.6 — trial-to-trial/encounter-to-encounter variance doubles across
the seventh→ninth decade. In decliners add `iiv_lead` (~5y): the noise
rises `iiv_lead` years before the slope does — implemented as iiv_eff
evaluated on `age_eff + iiv_lead·(traj=="decline")`. Emergent: a
declining elder is INCONSISTENT first — same question answered
differently Tuesday and Thursday — before they are worse on average.
**[Direction + precedence CONSENSUS (BASE); the explicit lead-time and
its use as a class-marker are HYPOTHESIS.]**

## 98. The complaint that knows — SCD as the pre-deficit symptom (Jessen
et al. 2014 *Alzheimers Dement.* 10:844 — verified: SCD = self-
experienced decline with unimpaired test performance, first symptomatic
stage of preclinical AD; SCD-plus features: onset ≥60, progression,
confirming informant). This INVERTS §41's metamemory split by class:
maintainers/elders-on-average under-complain relative to measured
deficit (the complaint outruns… nothing — §41's gap stands for the
average arm), but `traj:"decline"` flips the sign `scd_lead` (~6y)
early: the metamemory gap goes POSITIVE (complaint > measured deficit)
while age_eff is still average-range. Mechanically: the complaint
channel (meta_conf, fok instruments, self-report emissions) samples
`age_eff + scd_lead·(traj=="decline")`, while the store samples
`age_eff` — the character FEELS the slope before the harness can
measure it. Healthy arm check: absent decline traj, SCD adds nothing —
worried-well stays worried-well, no drift on the store.
**[SCD-predicts-decline CONSENSUS (Jessen; Reisberg longitudinal);
worried-well vs true-SCD separation CONSENSUS; our per-class sign flip
is the cleanest implementable form and is HYPOTHESIS as a number.]**

## 99. Leaving work moves the slope — the mental-retirement overlay
(Rohwedder & Willis 2010 *JEP* 24:119 — verified: early retirement
causally lowers early-60s cognition, cross-country IV design; Bonsang,
Adam & Perelman 2012 — verified direction; causality size DEBATED —
selection and reverse-causality noted by the authors themselves). Char
state `work_engaged` (default true for working mains; world-set on
retirement/exit events — world-v73's Last Shift feeds this). Retirement
ramps an engagement overlay: `engage_deficit` accrues
`retire_rate` (~0.5 age_eff-years per sim-year, saturating
`retire_cap` ~4y over ~8y) added to age_eff on encode legs ONLY —
the decline is upstream (less stimulation → weaker mints), not a
retrieval failure. Substitute engagement (`engage_sub` ∈[0,1], a
sum of ongoing cognitively-social activity flags the world supplies:
clubs, projects, caregiving) recovers up to `engage_sub_recover`
(0.6) of the deficit — "use it or lose it" operationalized as a
partial refund, never a full one (retirement's own effect persists
under substitution in the IV data — DEBATED). **[Direction CONSENSUS-
leaning, magnitude and mechanism DEBATED; the encode-only routing and
the accrual form are HYPOTHESIS.]**

## 100. The street costs the memory — locomotion dual-task tax
(Lindenberger, Marsiske & Baltes 2000 *Psych. & Aging* 15:417 —
verified: memorizing while walking, dual-task cost d≈0.98 middle-aged,
d≈1.47 old vs young; sensorimotor behavior increasingly needs cognitive
control). Context `locomoting:true` (walking, stairs, carrying — world
supplies on transit events) multiplies all encode legs by
`(1 − loco_tax(age_eff))` — knots 0.05@30 → 0.15@55 → 0.30@70 →
0.40@80 — AND adds `loco_pm_pen` (0.15@70) to armed-Intention firing
thresholds (the errand forgets itself mid-walk). The symmetrical half:
the world may render walking slowdown/stops under hard encode demand —
`loco_yield` emission hint (stops-walking-when-talking, the literal
behavioral readout). **[Direction + rough magnitude CONSENSUS; mapping
lab narrow-track walking to street locomotion is a stretch we flag —
real streets are easier than narrow tracks, so the default knots are
halved relative to the lab effect size.]**

## 101. The neighborhood forgives, the map doesn't — allocentric
decline (Wiener, de Condappa, Harris & Wolbers 2013 *J. Neurosci.*
33:6012 — verified: older adults recall routes same-direction but fail
novel-direction rejoin — persistent beacon/egocentric strategy, no
allocentric shift across sessions; Head & Isom 2010; Moffat & Resnick
2002 — allocentric >> egocentric deficit, CONSENSUS). Navigation-
relevant records mint `nav_mode ∈ {allo, ego}`: young mints allo by
default; `allo_mint_p(age_eff)` falls 0.8@30 → 0.5@60 → 0.3@80. An
`ego`-mode record answers a route query only when the approach cue
matches the encoded heading (`ego_dir_pen` 0.5 on mismatched-heading
rejoin — the wrong-direction corner is unnavigable, the same-direction
corner intact). Overlearned routes (§4.20 script-node venues,
permastore-tier) are EXEMPT — the 40-year resident's neighborhood is
not this mechanism's territory; the NEW café two blocks over, entered
from the park side for the first time, is. **[Direction CONSENSUS;
per-record nav_mode flag is our operationalization — HYPOTHESIS;
interacts with §5.29 doorway boundaries naturally.]**

## 102. The floor that doesn't move — priming/procedural spared
(Fleischman, Wilson, Gabrieli, Bienias & Bennett 2004 *Psych. & Aging*
19:617 — verified longitudinal: explicit declines, priming STABLE over
4 waves; Mitchell, Brown & Murphy 1990 — procedural/episodic
dissociation; La Voie & Light 1994 meta — mild-or-null priming
reduction, CONSENSUS that implicit >> explicit preservation). The
implicit legs — §5.35 fluency channel, §5.75 ctxcue configural
competence, §4.20 script-node rate — gain `proc_age_null` semantics:
they evaluate on `min(age_eff, 55)` — frozen at late-middle-age
decline, never worsening past it. This is the deepest floor in the
model: an 85-year-old main whose episodic ledger is half-archived
still walks the morning routine whole, still feels the neighborhood
familiar, still can't tell you Tuesday. **[CONSENSUS direction; the
55 freeze-point is HYPOTHESIS — the literature says "stable," not
"stable from 55"; we pick the midlife plateau edge (§4.21).]**

## 103. "I did it" — the observation-inflation age leg (Lindner,
Echterhoff, Davidson & Brand 2010 *Psych. Sci.* 21:1291 — verified:
watching another's action → false self-performance memory, robust,
warning-immune; Lindner, Davidson & Echterhoff 2013/2014 — verified:
older adults show the effect at equal RATE but prone elders show
LARGER magnitude; AND observation boosted true action memory MORE in
older adults — the benefit side scales too). §6.117
observation-inflation gains `obs_infl_age(age_eff)` — 1.0@30 →
1.0@60 mean (rate flat) but with widened variance: prone tail
(high `fantasy`/`imagery`) reaches ~1.6@80 while the median stays
flat — modeled as `obs_infl_age = 1 + obs_tail_k·(age_eff−60)/20·
tail_ind` where `tail_ind` = top-quintile fantasy+imagery indicator.
Symmetric benefit: `obs_gain` (§4.31c child arm already minted) gets
old-side knots — observed actions encode ×(1 + obs_old_gain),
0.1@60 → 0.2@80, BELOW enact_rescue — watching helps the old more
than the young, doing still beats watching. **[Rate-flat/magnitude-
up dissociation CONSENSUS (one study, n modest); tail-only
operationalization HYPOTHESIS.]**

## 104. The story goes semantic — internal:external detail shift
(Levine, Svoboda, Hay, Winocur & Moscovitch 2002 *Psych. & Aging*
17:677 — verified: Autobiographical Interview — older adults produce
fewer internal/episodic details, MORE external/semantic; persists
under probing; meta gbad077 2023 — verified: healthy-aging effect
moderate, MCI/AD larger). Emission field selection gains an age-leg
on TOP of recol_mult: `ie_shift(age_eff)` — internal-detail emission
share declines 0.65@30 → 0.55@60 → 0.45@80 while external
(commentary, general knowledge, off-event semantic) share rises
complementarily — `ext_gain` ~1.3@80. Probe-resistance is the
signature: structured re-cuing (§5.30 interviewMode, §5.76 fok
reprobe) recovers LESS internal detail at old age than the recol_mult
alone predicts — the story doesn't get more episodic under pressure,
it gets more semantic, and reads as MORE interesting not less (James
et al. 1998). This is the narrative-level readout of the R/F split —
a 78-year-old's reminiscence is commentary-shaped, not footage-shaped.
**[Direction + probe-persistence CONSENSUS; share knots HYPOTHESIS.]**

## 105. The stack audit — what 14 multipliers do to one record
(modeling hygiene section; no new source). Part VI warned the
gist_false × sug_age × illus_recol stack is unpriced as a product.
Part VII adds recol_mult × ie_shift × loco_tax × traj on a single
encode-or-emit path — the joint product at 85 can reach 4–5×, which
no single study licenses. Rule: **every old-age leg is evaluated
against age_eff in ISOLATION, then the joint product is capped** —
`stack_cap` (3.5×) on any single record/emission's total old-age
multiplier product, with the cap logged (`stack_capped:true` audit
field) so the harness can count how often the ceiling binds. The cap
is not a mechanism — it's the honest admission that the literature
measures legs one at a time. P814 checks the cap binds rarely (<2%
of old-age events at defaults) — if it binds often, the knots are
miscalibrated, not the cap.

## 106. Part VII knot rows (extends §92; age_eff unless noted)

| param | 30 | 55 | 65 | 75 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| maint_slope_mult | 1.0 | 0.7 | 0.5 | 0.5 | 0.5 | 0.5 | Josefsson 2012 (class, not knot) |
| decl_accel | 1.0 | 1.0 | 1.1 | 1.3 | 1.5 | 1.7 | Josefsson/Pudas (quadratic leg) |
| iiv_age_slope | 0 | 0.15 | 0.3 | 0.45 | 0.55 | 0.65 | Lövdén 2007 BASE |
| iiv_lead (decline arm, y) | 0 | 0 | 5 | 5 | 5 | 5 | Lövdén 2007 (precedence) |
| scd_lead (decline arm, y) | 0 | 0 | 6 | 6 | 6 | 6 | Jessen 2014 |
| loco_tax | 0.05 | 0.15 | 0.22 | 0.30 | 0.35 | 0.40 | Lindenberger 2000 (halved) |
| loco_pm_pen | 0.0 | 0.05 | 0.1 | 0.15 | 0.18 | 0.2 | Lindenberger 2000 (ext.) |
| allo_mint_p | 0.8 | 0.7 | 0.6 | 0.45 | 0.35 | 0.3 | Wiener 2013 |
| ego_dir_pen | 0.1 | 0.2 | 0.3 | 0.4 | 0.45 | 0.5 | Wiener 2013 |
| obs_old_gain | 0.0 | 0.05 | 0.1 | 0.15 | 0.18 | 0.2 | Lindner 2014 (benefit side) |
| ie internal share | 0.65 | 0.62 | 0.58 | 0.5 | 0.45 | 0.42 | Levine 2002 |
| ext_gain | 1.0 | 1.05 | 1.15 | 1.25 | 1.3 | 1.35 | Levine 2002 |

Frozen constants: `proc_age_null` — implicit legs evaluate on
min(age_eff,55) (P811 sign-lock); `stack_cap` 3.5 + `stack_capped`
audit field (P814); `nav_permastore_null` — §4.20 script-node /
permastore venues exempt from nav_mode mechanics; `retire_retrieval_null`
— engage_deficit touches encode legs only, retrieval untouched;
`scd_store_null` — scd_lead moves the complaint channel only, never S.
**[All knot interpolations HYPOTHESIS; class rates, directions, and
the dissociations (R/F, I/E, allo/ego, implicit/explicit, complaint/
deficit) are the CONSENSUS payload.]**

## 107. Spec changes v5.23 → v5.24 (delta summary)

| # | Change | Grounding |
|---|---|---|
| J1 | §4.36a: `traj` class drawn at bible-write from {0.18,0.68,0.14} + trait modulation (fitness/apoe/social/sex); `maint_slope_mult`/`decl_accel` on post-60 slope terms | §96 |
| J2 | §4.36b: `work_engaged` state → `engage_deficit` accrual on encode legs (`retire_rate`/`retire_cap`/`engage_sub`/`engage_sub_recover`); `retire_retrieval_null` | §99 |
| J3 | §4.36c: `locomoting` context → `loco_tax` on encode legs, `loco_pm_pen` on armed intentions, `loco_yield` emission hint | §100 |
| J4 | §4.36d: nav records mint `nav_mode` under `allo_mint_p(age_eff)`; `nav_permastore_null` | §101 |
| J5 | §5.78a: `iiv_eff` on retrieval/encode roll noise; `iiv_lead` for decline arm | §97 |
| J6 | §5.78b: complaint channel (meta_conf, self-report, JOL/FOK reports) samples `age_eff + scd_lead·(decline)`; `scd_store_null` | §98 |
| J7 | §5.78c: `ego_dir_pen` on mismatched-heading route rejoin; `ie_shift`/`ext_gain` on emission field mix | §§101, 104 |
| J8 | §5.78d: implicit legs (§5.35, §5.75, §4.20 rates) evaluate on min(age_eff,55) — `proc_age_null` | §102 |
| J9 | §6.153a: `obs_infl_age` tail-widening on §6.117; `obs_old_gain` on §4.31c | §103 |
| J10 | §6.153b: `stack_cap` + `stack_capped` audit on joint old-age products | §105 |

New params: `maint_slope_mult`, `decl_accel`, `traj_maintain_p`,
`traj_decline_p`, `iiv_age_slope`, `iiv_lead`, `scd_lead`,
`retire_rate`, `retire_cap`, `engage_sub_recover`, `loco_tax` (knots),
`loco_pm_pen`, `loco_yield`, `allo_mint_p` (knots), `ego_dir_pen`,
`obs_infl_age`, `obs_tail_k`, `obs_old_gain`, `ie_shift` (knots),
`ext_gain`, `stack_cap`. New profile field: `traj` (drawn, hidden).
New state: `work_engaged`, `engage_sub`. New context: `locomoting`.
New record field: `nav_mode`. Locked nulls: `proc_age_null`,
`nav_permastore_null`, `retire_retrieval_null`, `scd_store_null`.

## 108. Validation probes P805–P814

- **P805 trajectory classes (MUST — distribution-lock):** a 300-
  profile cohort aged 35→85 under default draws yields
  maintain/average/decline within 0.10–0.26 / 0.55–0.80 / 0.06–0.22;
  maintain arm's 75yo episodic output ≥ average arm's 65yo; decline
  arm accelerates (second-half slope ≥1.3× first-half). Josefsson 2012.
- **P806 IIV precedence (MUST — order-lock):** decline-arm profiles
  show elevated response variance (iiv_eff) measurably BEFORE mean
  level shifts — the variance anomaly leads the level anomaly by
  `iiv_lead`±1 sim-year. Lövdén 2007.
- **P807 SCD sign flip (MUST — sign-lock):** decline-arm complaint-
  channel reports (meta_conf self-report) exceed measured deficit
  during the scd_lead window, then track it; maintain arm never shows
  complaint>deficit at defaults; `scd_store_null` — S is untouched in
  both arms. Jessen 2014.
- **P808 retirement overlay (SHOULD):** `work_engaged` flip at 62 adds
  encode-side deficit ramping over ~8y to `retire_cap`; `engage_sub`=1
  recovers ≥50% of the deficit; retrieval-side metrics flat —
  `retire_retrieval_null`. Rohwedder & Willis 2010.
- **P809 locomotion tax (MUST — dissociation):** identical events
  encoded sitting vs `locomoting` at 75 differ ≥1.3× on S; the
  sitting-vs-locomoting gap at 35 is ≤0.15; armed time-intentions
  during locomotion fire less (loco_pm_pen). Lindenberger 2000.
- **P810 nav split (MUST — shape-lock):** a route learned at 78,
  queried same-direction, retrieves; queried from the reversed
  approach at a decision corner fails ≥1.8× more (ego_dir_pen);
  permastore venue routes exempt — `nav_permastore_null`. Wiener 2013.
- **P811 implicit floor (MUST — sign-lock):** priming/ctxcue/script-
  rate legs at 82 are statistically identical to 55yo values while
  matched episodic legs differ ≥1.5× — `proc_age_null`. Fleischman
  2004.
- **P812 observation inflation split (SHOULD):** tail_ind profiles at
  80 show "did it myself" false alarms ≥1.4× young-tail rate while
  median profiles match young rate; `obs_old_gain` boosts TRUE
  observed-action recall more at 80 than 30 — both halves of the
  Lindner dissociation. Lindner 2010/2014.
- **P813 I/E narration shift (MUST — probe-resistant):** free-recall
  emissions at 78 show external-detail share ≥ young rate AND
  interviewMode probing recovers proportionally less internal detail
  than recol_mult predicts — the semantic skew is a mix shift, not a
  threshold artifact. Levine 2002.
- **P814 stack audit (MUST — process):** joint old-age products never
  exceed `stack_cap`; `stack_capped` fires on <2% of 80+ events at
  defaults; if it fires more, FAIL as miscalibration. §105.

## 109. Part VII honest limits

- `traj` is a latent class imposed on continuous heterogeneity —
  Betula's own classifier is a ±1 SD rule, not a discovered kind.
  We model three classes because bibles need writeable kinds, and
  flag that reality is a mixture density, not a switch.
- `scd_lead` as a class-revealing channel is fiction-shaped: real
  SCD is noisy (worried-well common; Jessen's own framework needs
  SCD-plus features). In RW the complaint channel is a *signal the
  writers can hear*, not a diagnosis — a decliner main will sound
  worried before the harness can prove anything, which is exactly
  the human phenomenology, but the harness cannot distinguish
  worried-well from true-SCD without longitudinal ground truth.
- `retire_rate` inherits all of Rohwedder-Willis's causality debate —
  direction is defensible, magnitude isn't pinned; the encode-only
  routing (stimulation → mint quality) is our mechanism choice among
  several the paper floats.
- `loco_tax` knots are HALVED from lab d's because narrow-track
  walking ≠ street walking — we chose ecological plausibility over
  literal effect size; if anything the halving may still overstate
  flat-sidewalk cost for a fit elder.
- `nav_mode` mints per-record, but real strategy choice is situational
  not per-trace — the flag is a tractable proxy; `allo_mint_p` at 30
  (0.8) means even young adults egocentric-encode 1 in 5 routes,
  which matches route-following dominance in daily navigation but
  isn't directly measured in Wiener.
- `proc_age_null`'s freeze at 55 is a convenience — the data say
  "stable," and any freeze point is defensible; we picked the §4.21
  midlife plateau edge for consistency.
- `stack_cap` is bookkeeping, not biology. The alternative (joint
  products unbounded) is worse: at 85 the record-level product of
  recol × gist_false × sug_age × loco × decline-arm reaches ~5×,
  a region no study has ever measured. The cap plus the audit field
  makes the honesty checkable.

# Part VIII — v88: the event-shaped overlay layer (decline isn't a
# slope, it's a ledger of losses; the feet report before the head does;
# and some dips come back)

Parts I–VII priced decline as mostly *continuous*: knots on
age_eff, slope multipliers, trajectory classes, IIV noise. The
longitudinal literature says that's half the story. A large share
of old-age memory decline is **event-shaped and state-shaped**:
hospitalizations take a permanent step out of the curve (Wilson
2012), widowhood costs memory bandwidth independent of depression
(Aartsen 2005), and perimenopause dips encoding and *gives it
back* (Greendale 2009). Meanwhile two cheap observables — gait
speed and habitual-routine dominance — report the decline before
any memory test does (Mielke 2013; Eppinger 2013). This Part adds
the overlay ledger: step events, protective slopes, reversible
dips, and the channels a spectator can actually see.

## 110. The habit wins — goal-directed control falls first

Eppinger, Walter, Heekeren & Li 2013 (*Front. Psychol.* 4:967 —
verified): two-stage Markov task + computational modeling — older
adults' **model-based** (goal-directed) control is impaired while
model-free (habitual) control is spared; deficit pronounced
exactly when unexpected reward demands a strategy shift, where
old adults perseverate. de Wit, van de Vijver, Ridderinkhof &
Crielaard 2014 (*Cogn. Affect. Behav. Neurosci.* 14:647 —
verified): outcome-devaluation + slips-of-action — healthy old
adults show disrupted dual-system balance, more slips toward
devalued outcomes. de Wit, Watson, Harsay et al. 2012 (*J.
Neurosci.* 32:8211 — verified): habit-vs-goal balance tracks
corticostriatal connectivity; stress shifts everyone habitual
(Otto 2013; Schwabe & Wolf). **[CONSENSUS: the dissociation;
per-age knots are ours.]**

This is the behavioral cousin of §5.78d's implicit floor and
§4.20's script-node layer: the *routine* survives the *reason*.
Mechanism: an age- and state-weighted control balance
`goal_w_eff = goal_w·(1 − habit_shift(age_eff) −
habit_stress_gain·stress)`. `habit_shift` knots 0.05@30 →
0.15@60 → 0.30@80 → 0.35@85. When a scripted routine's outcome
changes (the café moved, the tenant stopped answering), the old
character keeps firing the script — `perseverate:true` emission
— at `goal_update_pen(age_eff)` on the update probability; the
young character updates. World-readable: she still walks to the
closed bakery on Sundays.

## 111. Widowhood — the loss that keeps costing

Aartsen, Van Tilburg, Smits, Comijs & Knipscheer 2005 (*Psychol.
Med.* 35:217 — verified): widowed LASA participants showed
greater 6-year memory decline than still-married, and the effect
survived controlling depression and physical health — an
*independent* memory cost, not mediated mood. Shin, Kim & An 2018
(*Am. J. Geriatr. Psychiatry* 26:778 — verified HRS 6,766):
widowhood status related to cognitive decline; decline scales
with time-since-loss; education and a living sibling protective.
COUNTERPOINT: Comijs et al. LASA fixed-effects (gby104 —
verified) found only a *temporary* 2-year reasoning dip in women,
nothing robust in men — the honest read is a real acute overlay
with a DEBATED persistent tail.

Mechanism: event `spousal_loss` mints overlay state `grief_decline`
{minted, half-life `grief_hl` 2.5y} adding `grief_age_equiv`
(+3 age_eff-years peak) to encode legs only, decaying
exponentially; plus a persistent `grief_slope` increment
(×1.15 on post-60 decline legs) representing the contested tail —
kept small and probe-gated (P929 tests both halves). Locked
`grief_recall_null`: bereavement does not degrade retrieval of
pre-loss records — she can still tell you about 1987 perfectly;
it's Tuesday she loses. Note the independence claim: this stacks
with, not inside, the loneliness overlay (AD§40) — the literature
separates perceived loneliness from bereavement status.

## 112. The hospitalization step — decline is partly event-shaped

Wilson, Rajan, Barnes et al. 2012 (*Neurology* 78:950 — verified
MAP n=1,870): global cognition declined 0.031/yr before first
hospitalization vs 0.075/yr after — a **2.4× acceleration**;
episodic memory specifically 3.3×; executive 1.7×. James, Wilson
et al. 2019 (*JAMA Netw Open* — verified): the acceleration is
carried by *nonelective* hospitalizations (0.076→0.112/yr);
elective admissions show no post-step acceleration. Ehlenbach et
al. 2010 (*JAMA* 303:763 — verified): post-visit CASI −1.01 after
acute care, −2.14 after critical illness; dementia hazard ratios
1.4 / 2.3. **[CONSENSUS direction and shape; magnitude modulated
by illness severity; elective-null is the load-bearing detail.]**

Mechanism: world event `hospitalization:{elective|acute|critical}`
mints `hosp_step` state: a one-time `age_eff` step
(`hosp_step_elective` 0 / `hosp_step_acute` +1.0 /
`hosp_step_critical` +2.0 age-years — scaled from CASI deltas
onto our age-equivalent axis) PLUS a slope multiplier
`hosp_slope_mult` (1.0 / 1.7 / 2.4) on encode-side decline legs
that decays toward 1.0 over `hosp_recover_tau` 3y for elective-
adjacent recoveries. **This is the first non-age term in the
decline integrator** — a 78-year-old's curve is now literally
shaped by what happened to her body. Two hospitalizations two
years apart is a different old age than none. Locked
`hosp_level_null`: the step does not drop the stored corpus —
nothing archived, nothing degraded retroactively; the *machinery*
ages, the *memories* keep their S values.

## 113. Purpose holds the slope

Boyle, Buchman, Barnes & Bennett 2010 (*Arch. Gen. Psychiatry*
67:304 — verified MAP n>900): purpose in life → incident AD HR
0.48 (90th vs 10th percentile ≈ 2.4× protection), MCI HR 0.71,
and slower global decline — robust to adjusting depression,
neuroticism, social network, chronic illness. Boyle et al. 2012
(*Arch. Gen. Psychiatry* — verified): purpose *moderates the
pathology→cognition coupling* itself — same tangle burden, better
function; the reserve acts on the mapping, not the pathology.
Kim 2019 (*Am. J. Geriatr. Psychiatry* — verified HRS n=11,557):
replication, larger for older and Black participants.

Mechanism: bible-pinnable trait `purpose` ∈[0,1] (what she'd
say her reason to get up is — the garden, the tenants, the
court case). Post-60 decline legs multiply `purpose_mult =
1 − purpose_slope·purpose`, `purpose_slope` 0.35 — a max-purpose
character declines at ~65% the rate of a purposeless one, the
Boyle hazard ratio compressed to a slope. Unlike `social`
(network size, §118) and `work_engaged` (§4.36b), purpose is
*internal* — it survives widowhood, retirement, and moving; it
can only be removed by narrative (world may re-set it on
goal-completion/goal-destruction events). Distinct from the
latent `traj` draw: purpose is a *writable, observable* lever
that partially explains who lands in the maintain class.

## 114. The bilingual delay — reserve with a flag

Bialystok, Craik & Freedman 2007 (*Neuropsychologia* 45:459 —
verified): lifelong bilinguals showed dementia symptoms ~4.1
years later than matched monolinguals (75.5 vs 71.4) despite
equal education/occupation. Craik, Bialystok & Freedman 2010
replicated (~5y). **DEBATED:** Zahodne et al. 2014 (*Neurology*
— verified) found no bilingual advantage in a diverse cohort;
meta-analyses (Mukadam 2017) find the effect is real in
retrospective clinic series but attenuates in prospective
community samples — classic reserve-confound territory.

Mechanism (flagged): trait `bilingual` ∈{0,1} shifts the
*onset* of age_decline legs rightward by `biling_years` (default
2.0, range 0–4 — we center below Bialystok's 4.1 given the
prospective attenuation). Frozen `biling_scope="onset-only"`:
the bilingual character declines on the *same slope*, just
starting later — compensation, not immunity (both Craik and
the skeptics agree the slope isn't spared). This is the cleanest
reserve parameterization we have: a pure horizontal shift,
probe-testable (P932: bilingual arm crosses each knot 2y later,
post-onset slope identical). RW note: a Mission bilingual
ambient/main plausibly carries this flag — it is a *language-use*
trait, not an ethnicity marker.

## 115. The gait tells first — observable leading indicators

Mielke, Roberts, Savica et al. 2013 (*J. Gerontol. A* 68:929 —
verified Mayo n=1,478): baseline gait speed predicted subsequent
cognitive decline across all domains; cognition did NOT predict
subsequent gait change — **the temporal arrow runs feet→head**.
Buracchio, Dodge, Howieson, Wasserman & Kaye 2010 (*Arch.
Neurol.* 67:980 — verified): gait-slowing trajectory accelerates
~12 years before MCI diagnosis in eventual decliners. Tian et
al. 2020 (*JAMA Netw Open* — verified 6-cohort meta): *dual*
decline (memory+gait) → dementia risk 6.28× vs nondecliners —
the joint signal is far stronger than either alone.

Mechanism: `gait_eff` — a world-readable motor channel — is
*defined* as declining on `age_eff + gait_lead·(traj=="decline")`,
`gait_lead` 4y (conservative vs Buracchio's 12 — we lead by less
than the truth because 12y of foreshadowing swallows a season
arc). The world layer may render `gaitSlow:true` hints (slower
walk cycles, more rests) that *precede* the memory symptoms by
the lead — a spectator who watches feet learns the trajectory
class before the character does, a structural irony SCD (§5.78b)
mirrors from inside. Ties to §4.36c: `loco_yield` micro-events
scale ×(1+gait_deficit) — the dual-task tax compounds the tell.
**[CONSENSUS direction; our lead magnitude compressed.]**

## 116. The menopause dip — encoding fails transiently, rebounds

Greendale, Huang, Wight et al. 2009 (*Neurology* 72:1850 —
verified SWAN n=2,362): perimenopause flattened *learning* —
EBMT verbal-memory improvement over repeat testing ran at 29%
(early) and 7% (late) of the premenopause learning rate; SDMT
processing-speed practice gains vanished in late perimenopause;
**performance rebounded to premenopausal levels postmenopause**
— the dip is time-limited. Greendale et al. 2010 SWAN symptoms
analysis (verified): the dip is not fully explained by
depression/anxiety/vasomotor symptoms — a direct transition
effect. 60% of transitioning women report memory complaints —
the phenomenology is loud (metamemory channel leads again).

Mechanism: profile flag `mt_stage` ∈{pre, early_peri, late_peri,
post} (female profiles, world/bible-set around ages 42–52,
transition span `mt_span` ~4y). Encode legs and *re-learning
gains* multiply `mt_learn_mult`: 0.75 early_peri, 0.5 late_peri
(compressing Greendale's 29%/7% of improvement — a full 0.07
would make the character unplayable); retrieval of pre-dip
records untouched (`mt_recall_null` — locked). `mt_complaint`
0.5: the complaint channel samples the dipped legs honestly —
she notices, and she's right, unlike SCD. Post stage: legs
restore to baseline over `mt_recover` 1y — **the only overlay
in this Part that fully reverses**. This is also the spec's
first sex-linked age mechanism: female mains have a midlife
encoding trough that male profiles never pay.

## 117. Remote stories semanticize — the old record becomes a lesson

Sekeres, Winocur & Moscovitch 2018 (*J. Neurosci.* — verified):
remote autobiographical memories lose contextual detail and gain
schema consistency over retention interval — MTT's transformation
is measurable, not just theoretical. Levine, Svoboda, Hay,
Winocur & Moscovitch 2002 (*Psychol. Aging* — verified, the §104
anchor) showed the old adult's report shifts internal→external
detail; the missing half is *which* records shift most: the
remote ones. Piolino et al. 2006 (verified): remote AM in old
adults is the most semanticized stratum of the store.

Mechanism: extends §5.78c — emission detail mix gains a
*record-age* interaction: `ie_remote_gain = 1 +
remote_ie·log1p((worldDay−createdDay)/3650)` with `remote_ie`
0.4, applied only when age_eff ≥60 (young adults keep remote
episodic detail better — the *decay* of detail, not just its
encoding, is age-dependent). The 40-year-old's memory of her
wedding retrieves; what emits is the *meaning* of it — the
verbatim toast is gone but the lesson of that marriage is
fluently available. Probe P935 locks the interaction: at equal
retention intervals the 78yo emits more external detail than
the 35yo; at equal ages remote records emit more than recent.

## 118. The network is structural, not just felt

Bennett, Schneider, Tang, Arnold & Wilson 2006 (*Lancet Neurol.*
5:406 — verified): social network SIZE modified the
pathology→cognition relation — at equal tangle burden, larger
networks meant higher function; strongest for semantic and
working memory; unchanged controlling activities, depression,
chronic disease. Crooks et al. 2008 (*AJPH* 98:1221 — verified):
larger networks → dementia HR 0.74 in women ≥78. James, Wilson,
Barnes & Bennett 2011 (*J. Int. Neuropsychol. Soc.* — verified):
late-life social *activity* frequency → slower decline,
independent of physical/cognitive activity. §40's loneliness
overlay is the *perceived* channel — this is the *counted*
channel; Bennett controlled depressive symptoms and they didn't
carry the effect.

Mechanism: `net_size` — a world-computable scalar (count of
relationship-matrix ties above a maintenance threshold,
EMA'd over `net_ema_tau` 1y — it should track the *substrate's*
graph, not be a bible number). Decline legs multiply
`net_mult = 1 − net_slope·min(net_z,2)` where net_z standardizes
against the cohort (net_slope 0.15 — smaller than purpose,
structural reserve is real but thinner). Orthogonal to
loneliness: a widowed main with a big network keeps `net_mult`
protection while paying `grief_decline` — matching Aartsen's
independence result. And the RW system already computes the
relationship graph — this parameter *costs the game nothing*.

## 119. Retrieval practice needs a teacher — the feedback gate

Tse, Balota & Roediger 2010 (*Psychol. Aging* 25:19 — verified):
repeated testing vs restudy on face-name pairs — **crossover**:
middle-aged gained from testing without feedback; older adults
gained MORE from restudy; with feedback, testing beat restudy at
every age including ~80. Meyer & Logan 2013 (*Psychol. Aging* —
verified): educationally-relevant materials replicate — testing
effect preserved in old age *given* corrective feedback.
Interpretation: old learners can't afford errorful retrieval —
a failed recall that isn't corrected consolidates the gap.

Mechanism: the re-encode path (§4.37 savings-shadow adjacency —
reinstatement gain `sav_gain`) gains an age-gated condition:
`relearn_gain(age_eff, feedback) = feedback ? test_fb_gain :
lerp(study_gain, test_fb_gain, young_frac(age_eff))` — concretely,
old-age re-learning events carry `relearn_fb_req`: retrieval-
attempt re-encodes (quizzing herself, being corrected in
conversation = `feedback:true` from hearAccount correction
events) gain `test_gain` 1.3; *uncorrected* retrieval attempts
in old adults gain only `test_nofb_gain` 0.7 — below the passive
re-exposure gain (re-study equivalent 1.0). The crossover is the
spec: **an 80-year-old who misremembers aloud and is never
corrected learns the error better than the truth** — which is
also §6.3's fluency mechanism arriving through the back door.
Young arm: test_nofb_gain ≥1.15 (the classic testing effect).

## 120. What Part VIII deliberately did not do

- No dementia layer. Every mechanism here is *normal* aging —
  steps, overlays, leads, dips. AD/MCI conversion stays outside
  the model (design decision: the mains age, none are written
  into disease; a `traj=="decline"` character is a slow
  decliner, not a patient).
- No delirium/acute-confusion state under hospitalization —
  `hosp_step` absorbs the mean effect; a dedicated acute-confusion
  emission mode would need its own source base.
- No caregiving burden parameter (dementia-caregiver spouses show
  accelerated decline — Vitaliano 2009) — real, but no RW
  character has a dementia spouse to care for; noted for the
  world-builder if a bible ever writes one.
- No hormone-therapy modifier on `mt_*` (Greendale found
  pre-FMP HT beneficial / post-FMP detrimental) — too fine a
  lever for bible authors to wield responsibly; absorbed into
  the `mt_learn_mult` knots' width.
- No per-domain hospitalization splits (episodic 3.3× vs
  executive 1.7×) beyond the single `hosp_slope_mult` — domain
  resolution can come if probes show the aggregate hides signal.

## 121. Part VIII knot rows (extends §106; age_eff unless noted)

| param | 30 | 55 | 65 | 75 | 80 | 85 | anchors |
|---|---|---|---|---|---|---|---|
| habit_shift | 0.05 | 0.10 | 0.15 | 0.22 | 0.30 | 0.35 | Eppinger 2013 |
| goal_update_pen | 0.0 | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | de Wit 2014 (slips) |
| habit_stress_gain | 0.2 | 0.2 | 0.25 | 0.3 | 0.3 | 0.3 | Otto 2013 (flat-ish) |
| grief_age_equiv | 0 | 0 | 3 | 3 | 3 | 3 | Aartsen 2005 (peak overlay) |
| grief_slope | 1.0 | 1.0 | 1.15 | 1.15 | 1.15 | 1.15 | Shin 2018 (tail, DEBATED) |
| hosp_step_acute | — | — | +1.0 | +1.0 | +1.0 | +1.0 | Ehlenbach 2010 CASI −1.01 |
| hosp_step_critical | — | — | +2.0 | +2.0 | +2.0 | +2.0 | Ehlenbach 2010 CASI −2.14 |
| hosp_slope_mult acute/crit | — | — | 1.7/2.4 | same | same | same | Wilson 2012 |
| purpose_mult (purpose=1) | 1.0 | 0.85 | 0.65 | 0.65 | 0.65 | 0.65 | Boyle 2010 HR 0.48 |
| biling_years | 0 | 0 | 2.0 | 2.0 | 2.0 | 2.0 | Bialystok 2007 (attenuated) |
| gait_lead (decline arm, y) | 0 | 0 | 4 | 4 | 4 | 4 | Mielke 2013/Buracchio 2010 |
| mt_learn_mult (early/late peri) | — | 0.75/0.5 | — | — | — | — | Greendale 2009 (compressed) |
| remote_ie | 0 | 0 | 0.4 | 0.4 | 0.4 | 0.4 | Sekeres 2018 (≥60 gate) |
| net_slope | 0 | 0 | 0.15 | 0.15 | 0.15 | 0.15 | Bennett 2006 |
| test_gain / test_nofb_gain | 1.3/1.15 | 1.3/1.0 | 1.3/0.9 | 1.3/0.75 | 1.3/0.7 | 1.3/0.7 | Tse 2010 (crossover) |

Frozen constants: `biling_scope="onset-only"` (slope never
spared — P932 shape-lock); `mt_scope="encode-only"`; `hosp_level_null`
(step never touches stored S); `grief_recall_null`;
`gait_channel_null` (gait_eff is world-renderable only — never
enters a memory roll). All knots **[HYPOTHESIS]**; the
dissociations (habit/goal, encode/recall on grief+MT, gait→cog
arrow, dual-decline compounding, testing×feedback crossover,
elective/nonelective split) are the **[CONSENSUS]** payload.

## 122. Spec changes v5.35 → v5.36 (delta summary)

| # | Change | Grounding |
|---|---|---|
| K1 | §4.45a: `habit_shift`/`goal_update_pen`/`habit_stress_gain` on script-vs-goal control + `perseverate:true` emission | §110 |
| K2 | §4.45b: `spousal_loss` → `grief_decline` state {hl 2.5y, `grief_age_equiv`, `grief_slope`}; `grief_recall_null` | §111 |
| K3 | §4.45c: `hospitalization{elective|acute|critical}` → `hosp_step` age_eff step + `hosp_slope_mult` decays on `hosp_recover_tau`; `hosp_level_null` | §112 |
| K4 | §4.45d: trait `purpose` → `purpose_mult` on post-60 legs | §113 |
| K5 | §4.45e: trait `bilingual` → onset shift `biling_years`; frozen `biling_scope` | §114 |
| K6 | §4.45f: `mt_stage` → `mt_learn_mult` on encode+relearn legs, `mt_complaint`, `mt_recover`; `mt_recall_null` | §116 |
| K7 | §5.95a: `gait_eff` channel `age_eff + gait_lead·(decline)` → `gaitSlow` hints; `gait_channel_null` | §115 |
| K8 | §5.95b: `ie_remote_gain` — record-age × age_eff interaction on §5.78c mix | §117 |
| K9 | §5.95c: `net_size` (world-computed EMA) → `net_mult` on decline legs | §118 |
| K10 | §5.95d: relearn gate — `relearn_fb_req`, `test_gain`/`test_nofb_gain`/`study_gain` crossover | §119 |

New params: `habit_shift` (knots), `goal_update_pen`,
`habit_stress_gain`, `grief_hl`, `grief_age_equiv`,
`grief_slope`, `hosp_step_{acute,critical}`,
`hosp_slope_mult_{acute,critical}`, `hosp_recover_tau`,
`purpose_slope`, `biling_years`, `gait_lead`,
`mt_learn_early`, `mt_learn_late`, `mt_span`, `mt_recover`,
`mt_complaint`, `remote_ie`, `net_ema_tau`, `net_slope`,
`test_gain`, `test_nofb_gain`, `study_gain` — 24 named
(28 scalars once knots are expanded). New traits:
`purpose`, `bilingual`. New state: `grief_decline`,
`hosp_step`, `mt_stage`. New emissions: `perseverate:true`,
`gaitSlow:true`. Locked nulls: `grief_recall_null`,
`hosp_level_null`, `mt_recall_null`, `gait_channel_null`.
Frozen: `biling_scope`, `mt_scope`.

## 123. Validation probes P928–P937

- **P928 habit shift (MUST — dissociation):** script-node
  execution share at 80 ≥1.3× the 30yo share under a changed-
  outcome world; `goal_update_pen` delays script updating on
  old profiles ≥2× sim-days vs young; `perseverate` emissions
  fire only when an outcome changed. Eppinger 2013; de Wit 2014.
- **P929 grief two-half (MUST — sign-lock):** `spousal_loss` at
  72 degrades *new* encode legs for ~`grief_hl` while pre-loss
  record recall is flat (`grief_recall_null`); the persistent
  slope tail is detectable but ≤1.3× — if the tail dominates
  the acute dip, FAIL (LASA null result honored). Aartsen 2005;
  Comijs (LASA) fixed-effects.
- **P930 hospitalization step (MUST — shape-lock):** an
  `acute` hospitalization at 74 shifts subsequent encode legs
  by `hosp_step_acute`±20% AND accelerates the slope ≥1.5×
  transiently; `elective` produces neither step nor slope
  (elective-null, James 2019); stored-record recall unchanged —
  `hosp_level_null`. Wilson 2012; Ehlenbach 2010.
- **P931 purpose slope (SHOULD):** purpose 0.9 vs 0.1 twins
  diverge on post-60 episodic output by ~the HR-0.48-mapped
  slope ratio; protection persists through a `spousal_loss`
  event (internal lever, not network-mediated). Boyle 2010.
- **P932 bilingual onset (SHOULD — shape-lock):** `bilingual`
  twins cross each decline knot `biling_years`±0.5 later with
  post-onset slopes statistically identical — onset shift,
  never slope (`biling_scope`). Bialystok 2007; flagged DEBATED.
- **P933 gait precedence (MUST — order-lock):** decline-arm
  profiles emit `gaitSlow` hints measurably BEFORE episodic
  output drops — lead `gait_lead`±1y, mirroring P806's IIV
  order-lock; `gait_channel_null` — gait metrics never alter
  memory rolls. Mielke 2013; Buracchio 2010.
- **P934 MT dip-and-rebound (MUST — sign-lock):** female
  profile forced through mt_stage sequence shows encode-side
  trough at late_peri (≥1.4× worse than pre) then full recovery
  post (within `mt_recover`, ≤5% residual deficit); male twin
  flat; pre-dip records recall flat — `mt_recall_null`.
  Greendale 2009.
- **P935 remote semanticization (SHOULD — interaction):** at
  fixed 20y retention, 78yo emissions show higher external share
  than 35yo; at fixed age 78, 20y-old records emit more external
  than 1y-old — BOTH halves required (age × record-age).
  Sekeres 2018; Levine 2002.
- **P936 network structure (SHOULD — orthogonality):**
  `net_size` top-tertile vs bottom-tertile diverge on decline
  legs with `social` trait and loneliness overlay held equal —
  structural channel must be separable from perceived. Bennett
  2006.
- **P937 feedback crossover (MUST — sign-lock):** uncorrected
  failed-retrieval re-encodes at 80 gain LESS than passive
  re-exposure (test_nofb_gain < study_gain) while corrected
  retrievals gain MORE (test_gain > study_gain); at 30 both
  retrieval modes beat re-exposure — the full crossover, not
  half of it. Tse 2010.

## 124. Part VIII honest limits

- `hosp_step`'s age-equivalent scaling is a unit conversion we
  invented: CASI points → age-years via the cohort's own slope.
  The shape (step+acceleration, elective-null) is solid; the
  magnitude is calibrated to produce ~1–2 effective years and
  is probe-gated, not measured.
- `grief_slope` encodes the contested persistent tail at 1.15 —
  Shin's "linear with time-since-loss" vs LASA's "temporary
  only" genuinely disagree; we split the difference and P929
  caps the tail so the honest case (mostly temporary) dominates.
- `biling_years` 2.0 deliberately halves Bialystok's 4.1 —
  prospective-sample attenuation argues the clinic figure
  inflates; the flag exists because bilingualism is common in
  the Mission's plausible cast, not because we're sure.
- `gait_lead` 4y compresses Buracchio's ~12 — drama economy:
  a spectator channel needs the tell inside a season, and the
  direction (feet before head) is the science; the lead length
  is ours.
- `mt_learn_mult` compresses Greendale's learning-rate ratios
  (0.07 late-peri would effectively disable encoding — she
  couldn't function). 0.5 preserves sign and recoverability;
  magnitude HYPOTHESIS.
- `net_size` reads the relationship matrix — if the game-systems
  graph counts ties differently than humans count "people I'd
  call," net_z inherits the distortion. It's substrate-shaped
  data used as psychological input; flagged.
- `purpose` as a writable trait risks the world layer treating
  it as a dial to crank; the spec treats it as slowly-moving
  (event-driven only) — bible authors should set it, events may
  rewrite it, nothing should tick it.
- The crossover probe P937 assumes `hearAccount` correction
  events reach the relearn path — a wiring assumption the
  game-systems track must honor or the old-age learning channel
  silently defaults to errorful.

# Part IX — v100: the control layer retires piecemeal (speed fails
# before strength, the debunk feeds the claim, the elders who choose
# few and keep them sharp, and two levers that never age)

Parts I–VIII priced *capacity* — encoding strength, decay legs,
interference susceptibility. The missing layer is *control*:
what old age does to the operations characters run on their
memories — how long a search takes, whether a correction
sticks, which memories get the rehearsal budget, how far a
reminding chain travels. The control findings are more
surprising than the capacity findings: speed fails while
accuracy holds (Salthouse 1996); the *cost* of selective
retrieval outlives its *benefit* by a decade (Aslan et al.
2015); and two interventions — spacing and savings — do not
age at all (Balota et al. 1989; Nelson 1985). This Part adds
the control knobs, including two deliberately frozen
preservation nulls.

## 125. The answer exists, the window doesn't — retrieval latency

Salthouse 1996 (*Psychol. Rev.* 103:403 — verified): a general
processing-speed factor mediates most age variance in cognition;
memory performance differences shrink dramatically when tasks
are self-paced — the deficit is partly *temporal*, not
*structural*. Bugg, Zook, DeLosh, Davalos & Davis 2006 verified
older adults' category fluency is time-limited: given enough
time, output approaches young levels. **[CONSENSUS: speed
mediates; accuracy-at-asymptote largely intact.]**

Mechanism: `ret_lat_mult(age_eff)` multiplies bout duration
(not probability): `1.0@55 → 1.15@65 → 1.3@75 → 1.7@85`. It
couples to the existing §5.101 suspended-bout machinery —
`susp_*` windows are world-time constants, so older bouts
expire mid-search more often: `lost_it` emissions rise with
age without any recall-probability change. In dialogue this
is the beat-late answer — she gets it, three exchanges after
it mattered. **Locked `lat_strength_null`:** given unlimited
window, retrieval probability at fixed S is age-invariant —
latency never converts into loss by itself; only the
interaction with `susp_*` does. (This is what keeps the knob
honest: the record is intact, the *clock* is what aged.)

## 126. The name that won't come — the proper-name cliff

Burke, MacKay, Worthley & Wade 1991 (*J. Mem. Lang.* 30:542 —
verified): proper names are retrieved less often than common
nouns and produce more TOTs, even controlling frequency.
Cohen & Burke 1993: the proper-name disadvantage *grows* with
age — semantic person-knowledge (occupation, relations)
retrieves fine while the phonological name node fails; the
asymmetry is the defining signature (name-only TOT, person
known). Cross & Burke 2004: aging degrades the phonological
half of the link more than the semantic half. **[CONSENSUS:
proper-name TOT steeply age-graded and dissociable from
person knowledge.]**

Mechanism: `propname_tot_mult(age_eff)` multiplies `tot_rate`
for proper-name referent fields only:
`1.0@55 → 1.4@65 → 2.0@75 → 2.6@85`. The failed retrieval emits
`name_block:true` and — because the person-knowledge fields
retrieved fine — the dialogue fallback "the tenant, you know
the one, third floor" is *structurally* available, not a
confabulation. The elder who can't produce a name is not
uncertain about who she means; confidence on the referent
stays high (that's why the signature is legible to spectators).

## 127. The warning that feeds the claim — debunk backfire

Skurnik, Yoon, Park & Schwarz 2005 (*J. Consumer Res.* 31:713 —
verified): after a 3-day delay, older adults misremembered
28% of once-denied false claims as true — and **40%** of
thrice-denied ones. Repetition raised the claim's familiarity
faster than the "false" tag survived; with only familiarity
left, fluent processing reads as truth. No parallel tendency
for true claims to flip false. Kumkale & Albarracín 2004
(*Psychol. Bull.* — verified meta): the sleeper effect —
discounting-tag decay outrunning message decay — is real,
small, and *age-amplified* through exactly this channel.
Jacoby 1999: familiarity-as-truth attribution when
recollection fails. **[CONSENSUS: the age × delay ×
repetition interaction is replicated; magnitudes vary.]**

Mechanism: heard-account records already carry a `cred_tag`
field on the discounting edge (existing sleeper machinery —
the tag rots faster than content). New operator leg:
`debunk_fam_gain(age_eff)` `1.0@55 → 1.2@65 → 1.6@80`
multiplies the *content* familiarity accrued per repetition
of a denied claim, while the tag decays on `disc_tag_hl` 3d
independent of repetitions. When the tag dies and content
familiarity exceeds `fam_truth_thresh` (existing §6.x
familiarity→truth inference), the record's belief flip fires:
`debunk_flipped:true`. **Locked `debunk_true_null`:**
repetition of a *true* label never flips a record to false —
the operator is sign-locked, matching Skurnik's asymmetry.
This is the rumor-substrate knife edge: a correction campaign
in a neighborhood full of 70-year-olds *manufactures* the
belief it fights.

## 128. Choosing few and keeping them — selective optimization

Baltes & Baltes 1990 (SOC model — verified framework):
successful aging is selection (narrowing goals), optimization
(concentrating practice on the chosen), compensation
(scaffolding). Freund & Baltes 2002: SOC strategy use predicts
preserved functioning in old-old adults. On memory
specifically: older adults' restricted rehearsal isn't purely
capacity loss — resource allocation narrows by *value*.
Wolf & Zimprich 2020 verified memory selectivity intact-to-
enhanced in aging when stakes are explicit. **[Framework
CONSENSUS; our parameterization is HYPOTHESIS.]**

Mechanism: `soc_narrow(age_eff)` `0@55 → 0.15@65 → 0.35@75 →
0.5@85` reshapes the §5.x retell/rehearsal budget: the
fraction of rehearsal draws going to records in the top
`soc_top_q` 0.25 quantile of `goal_value` rises by soc_narrow,
drawn proportionally from mid-value records (bottom deciles
were already unrehearsed). Consequence the spectator sees:
the elder's *chosen* domain — the garden ledger, the court
case, the grandson's schedule — stays improbably sharp while
everything peripheral thins faster than the capacity curves
alone would give. Decline is uneven *because it is allocated*.

## 129. The decade testing turns against you — split knees

Aslan & Bäuml 2012 (*J. Exp. Psychol.* 38:894 — verified):
RIF intact in young-old (60–75), absent in old-old (>75) —
already spec'd as `rif_age_tail` (§5.50). The piece v100 adds:
Aslan, Schlichting, John & Bäuml 2015 (*Psychol. Aging* 30:111
— verified): the *beneficial* effect of selective retrieval
declines **earlier** than the detrimental effect — mediated
by working-memory capacity. Two knees, ~a decade apart.
**[DEBATED at the edges: a 2025 report found durable RIF in
older adults; the split-knee ordering itself is the
replicated finding.]**

Mechanism: `rp_benefit_knee` 65±5 on the §119/test_gain
relearn path — retrieval-practice benefit multiplies by
`rp_benefit_mult(age_eff)`: `1.0@55 → 0.7@65 → 0.45@75` —
while `rif_age_tail` stays pinned at ~75. The 65–75 window is
the dangerous decade: self-quizzing still suppresses rival
records (the cost lives) but buys less strengthening (the
benefit retired early) — net negative before it goes neutral.
Probe P1059 order-locks `rp_benefit_knee < rif_age_tail` so
no parametrization inverts the sequence.

## 130. The gap that never ages — spacing preserved

Balota, Duchek & Paullin 1989 (*Psychol. Aging* 4:423 —
verified): spacing effects on free recall are at least as
large in older as younger adults — in some analyses
proportionally *larger*, since massed-practice gains are
disproportionately fragile in the old. Kornell, Castel, Eich
& Bjork 2010 and Delaney et al. spacing reviews concur: the
benefit of distributed over massed repetition is one of the
most robust age-invariant effects in the memory literature.
**[CONSENSUS: relative spacing benefit survives aging.]**

Mechanism: **frozen `spacing_age_null`** — `spacing_gain`
carries NO age leg and no profile may add one. Deliberately
specified as a preservation claim, not an omission: when the
substrate schedules re-exposure, distributing it helps the
80yo exactly as much as the 25yo. (The *encoding* it rescues
still ages — spacing multiplies a smaller enc_base — but the
multiplier itself is flat.)

## 131. The archive is dormant, not gone — savings preserved

Ebbinghaus 1885: savings — relearning a forgotten list costs
less than first learning — even when recall is at floor.
Nelson 1985 verified savings as the most sensitive retention
measure, revealing trace survival beneath zero recall.
MacLeod 1988 and subsequent aging work: relearning speedups
persist in old age; the residue survives what recall cannot
reach. **[Established for savings-as-measure; the age-flat
parameterization is our HYPOTHESIS — flagged.]**

Mechanism: **frozen `savings_age_null`** — `savings_mult`
(the re-encode discount for records that decayed below
retrieval threshold but not below the noise floor) carries no
age leg. An 80yo re-learning yesterday's lost record pays the
same fraction as a 30yo. This pairs with §119's relearn gate:
feedback is *required* for the old learner, but once corrected,
the re-encoding itself is as cheap as anyone's — the trouble
is the gate, not the clay.

## 132. The future loses detail too — simulation impoverishment

Addis, Wong & Schacter 2008 (*Psychol. Sci.* 19:33 —
verified): older adults generate fewer *internal* (episodic)
details than young when imagining future events — same deficit
as for past events, and the two correlate; internal-detail
count tracks relational-memory ability. Addis, Musicaro, Pan
& Schacter 2010 and Schacter's constructive-episodic-simulation
framework: simulating the future recombines the same
episodic-detail pool that recall draws on — age thins the
pool both directions. **[CONSENSUS direction; the prospective-
encoding consequence is our extension.]**

Mechanism: `sim_detail_mult(age_eff)` `1.0@55 → 0.85@65 →
0.7@75 → 0.6@85` scales internal-detail count on §6.199's
`sim` trait whenever a character simulates/plans a future
episode — plans, promises, imagined encounters mint thinner
records at old ages, with external/semantic content
preserved. Downstream consequence the substrate inherits for
free: prospective intentions encoded by elders carry fewer
contextual anchors → the §87 time-based PM deficit partially
*explains itself* through encoding poverty, not only
retrieval failure. The 76yo's "I'll drop by Tuesday" is
literally a vaguer memory than the 30yo's was.

## 133. The past becomes a film you're in — vantage drift

Nigro & Neisser 1983 established field vs observer vantage.
Butler, Rice, Wooldridge & Rubin 2016 (*Mem. Stud.* —
verified): repeated retrieval itself shifts memories toward
observer perspective — vantage is *reconstructive*, moved by
retell count more than by retention interval. Piolino et al.
2006 found older adults report more observer-perspective
memories; Rice & Rubin 2009 document flexible vantage at
retrieval in both directions. Berntsen & Rubin 2006
(*Cogn. Emot.* 20:1193 — verified): observer vantage
*attenuates* sensory and emotional reliving across all
emotions. **[Retell-driven shift: CONSENSUS; the residual
age leg: weak/mixed — flagged.]**

Mechanism: emission-level field `vantage:"field"|"observer"`
with `vantage_drift = vantage_retell_gain·retell_n +
vantage_age_leg·age_eff` on each voluntary recall —
`vantage_retell_gain` 0.04/retell capped 0.6, `vantage_age_leg`
0.002/yr ≥60 capped 0.15 (kept deliberately small: the
literature supports retell-driven shift strongly, pure-age
weakly). Observer-emitted recalls pay a reliving tax:
`relive_mult` 0.75 on the §4.5 affect channel — her most-
retold story is also her least felt, the well-worn anecdote
gone flat. And a nice asymmetry: retelling *causes* the
distance it pretends to report.

## 134. The chain stops short — reminding depth truncates

§5.17's reminding chains let one retrieved record cue the
next ("that reminds me…"). Chain depth is working-memory-
bound: each hop holds the cue record active while sampling
its associates. Craik & McDowd 1987 and the WM literature
(Park et al. 2002 verified lifespan WM decline) put effective
multi-step depth down by roughly half from 30 to 80.
Verhaeghen's aging meta-analyses concur on the WM-mediated
chain. **[Mechanism CONSENSUS; the knot values are ours.]**

Mechanism: `cue_chain_max(age_eff)` `4@30 → 3@60 → 2@75 →
2@85` hard-caps hop count per retrieval bout. Two visible
consequences: (a) the elder's story doesn't make the second
hop — she remembers the argument but not what it led to;
(b) transitive reminding weakens → cue-dependent records that
*only* surface via chains become rarer in voluntary recall,
concentrating the recall diet on directly-cued and bump-era
records. Cheap to implement: a counter on the bout state,
already present via `pending_cand`.

## 135. Part IX knot rows (extends §121; age_eff unless noted)

| param | 55 | 65 | 75 | 85 | source |
|---|---|---|---|---|---|
| ret_lat_mult (§5.106) | 1.0 | 1.15 | 1.3 | 1.7 | Salthouse 1996; Bugg 2006 |
| propname_tot_mult (§5.110) | 1.0 | 1.4 | 2.0 | 2.6 | Burke 1991; Cohen & Burke 1993 |
| debunk_fam_gain (§6.230) | 1.0 | 1.2 | 1.5 | 1.6 | Skurnik 2005 |
| soc_narrow (§5.107) | 0 | 0.15 | 0.35 | 0.5 | Baltes & Baltes 1990 (param ours) |
| rp_benefit_mult (§5.108) | 1.0 | 0.7 | 0.45 | 0.35 | Aslan et al. 2015 |
| cue_chain_max (§5.109) | 4 | 3 | 2 | 2 | Park 2002 WM (param ours) |
| sim_detail_mult (§4.56) | 1.0 | 0.85 | 0.7 | 0.6 | Addis 2008 |
| vantage_age_leg (§6.231) | — | 0.05 | 0.10 | 0.15 | Piolino 2006 (weak) |

Scalars: `disc_tag_hl` 3d (Skurnik delay); `soc_top_q` 0.25;
`rp_benefit_knee` 65±5; `vantage_retell_gain` 0.04 cap 0.6;
`relive_mult` 0.75. Locked nulls: `lat_strength_null`,
`debunk_true_null`. Frozen: `spacing_age_null`,
`savings_age_null`. New emissions: `name_block:true`,
`debunk_flipped:true`, `vantage:"observer"`.

## 136. Spec changes v5.47 → v5.48 (delta summary)

| # | Change | Grounding |
|---|---|---|
| L1 | §5.106: `ret_lat_mult` on bout duration; couples to §5.101 `susp_*` windows → `lost_it`; locked `lat_strength_null` | §125 |
| L2 | §5.110: `propname_tot_mult` on `tot_rate` for proper-name referents; `name_block` emission + fallback phrasing | §126 |
| L3 | §6.230: `debunk_fam_gain` × content familiarity per denial repetition vs `disc_tag_hl` tag decay → `debunk_flipped`; locked `debunk_true_null` | §127 |
| L4 | §5.107: `soc_narrow` + `soc_top_q` rehearsal-budget concentration on top `goal_value` quantile | §128 |
| L5 | §5.108: `rp_benefit_knee`/`rp_benefit_mult` on §119 test_gain, ordered before `rif_age_tail` | §129 |
| L6 | §4.55: frozen `spacing_age_null`, `savings_age_null` — two preservation claims | §§130–131 |
| L7 | §4.56: `sim_detail_mult` age leg on §6.199 `sim` — future-simulation internal detail | §132 |
| L8 | §6.231: `vantage` emission field; `vantage_drift` (retell×age); `relive_mult` tax | §133 |
| L9 | §5.109: `cue_chain_max` cap on §5.17 reminding chains | §134 |

New params: `ret_lat_mult`, `propname_tot_mult`,
`debunk_fam_gain`, `disc_tag_hl`, `soc_narrow`, `soc_top_q`,
`rp_benefit_knee`, `rp_benefit_mult`, `cue_chain_max`,
`sim_detail_mult`, `vantage_retell_gain`, `vantage_age_leg`,
`relive_mult` — 13 named (19 scalars once knots expand).
Locked nulls: `lat_strength_null`, `debunk_true_null`.
Frozen: `spacing_age_null`, `savings_age_null`.
New emissions/fields: `name_block`, `debunk_flipped`,
`vantage`.

## 137. Validation probes P1055–P1064

- **P1055 latency-not-loss (MUST — null-lock):** at fixed S,
  raising the bout window asymptotically equalizes 30yo and
  80yo recall (≥95% convergence); at default `susp_*` windows,
  `lost_it` rate rises ≥1.5× by 80 while successful-recall
  accuracy is unchanged. Salthouse 1996; Bugg 2006.
- **P1056 proper-name cliff (MUST — dissociation):** at 80,
  name-field TOT rate ≥2× person-knowledge-field failure rate
  on the same referent; `name_block` emissions accompany
  referent-confident fallback phrasing; the 30yo gap is
  <1.3×. Burke 1991; Cohen & Burke 1993.
- **P1057 debunk backfire (MUST — sign-lock):** a false claim
  denied ×3 to a 78yo profile flips `believed`→true at ~40%
  after `disc_tag_hl` (vs ~28% denied ×1); a true claim
  labeled-true ×3 NEVER flips false (`debunk_true_null`);
  the 30yo arm flips ≤10%. Skurnik 2005.
- **P1058 SOC concentration (SHOULD):** retell-count share of
  top-`goal_value`-quantile records rises with `soc_narrow`;
  chosen-domain effective S at 85 exceeds the unstructured-
  budget control ≥1.3× while peripheral records decay faster.
  Baltes & Baltes 1990.
- **P1059 split knee (MUST — order-lock):** across the 55–85
  sweep, `rp_benefit_mult` departs 1.0 before `rif_age_tail`
  activates — the 65–75 window must show (benefit ↓, cost ↑)
  simultaneously; any parametrization with knees ordered
  reversed or coincident FAILs. Aslan 2015 vs 2012.
- **P1060 spacing flat (COULD — frozen):** spacing/massed
  benefit ratio is age-invariant within noise at 30/60/80;
  a profile-level age leg on `spacing_gain` is a spec
  violation. Balota 1989.
- **P1061 savings flat (COULD — frozen):** re-encode cost
  ratio for sub-threshold vs fresh records is age-invariant;
  savings exists (ratio <1) at all ages. Ebbinghaus; Nelson.
- **P1062 future vagueness (SHOULD):** simulated future-event
  records at 80 carry ~60% the internal-field count of the
  30yo, external fields flat; internal count correlates with
  the record's `assoc_mult`-aged binding integrity. Addis 2008.
- **P1063 vantage drift (SHOULD — shape-lock):** `vantage`
  flips toward observer with retell_n (dominant) more than
  with record age; observer recalls show `relive_mult`-
  reduced affect terms vs matched field recalls. Butler 2016;
  Berntsen & Rubin 2006.
- **P1064 chain truncation (MUST):** reminding chains never
  exceed `cue_chain_max(age_eff)`; voluntary-recall diet of
  chain-only-reachable records drops ≥40% from 30 to 80 with
  directly-cued records flat. Craik & McDowd 1987.

## 138. Part IX honest limits

- `ret_lat_mult` scales *duration*; the underlying speed
  theory is about processing rate across the board — mapping
  it to bout-length alone is a simplification, and its
  interaction with `susp_*` windows is our construction
  (the studies don't use suspended-bout semantics).
- `propname_tot_mult` knots compress a measured *relative*
  deficit; absolute TOT rates vary with corpus statistics a
  sim doesn't have. Sign and ordering are solid; magnitudes
  HYPOTHESIS.
- `debunk_fam_gain` rides the existing sleeper/familiarity→
  truth machinery — it is an *amplifier on a repetition
  count*, not a new op. Skurnik's 40% is a lab ceiling on
  debriefed consumer claims; rumor-domain claims with social
  stakes may run hotter or colder. `debunk_true_null`
  replicates Skurnik's asymmetry, which a fairness account
  (fluency helps both labels) predicts should be weaker —
  flagged.
- `soc_narrow` parameterizes Baltes & Baltes as a rehearsal-
  budget reshaping; SOC is a life-management framework, not
  a memory mechanism — the mapping to retell budget is ours
  and the most speculative number in this Part.
- `vantage_age_leg` is deliberately tiny: Butler 2016
  supports *retell-driven* drift; the pure-age literature is
  one small study (Piolino 2006). If validation shows the
  age leg doing work, it's overfit — retell_n should carry
  it.
- `cue_chain_max` treats WM decline as a hop cap; real chains
  degrade probabilistically (hop-3 succeeds sometimes). The
  cap is a contract, not a cognitive claim — acceptable for
  the substrate, noted here.
- Frozen nulls (`spacing_age_null`, `savings_age_null`) are
  preservation claims game-systems could quietly violate;
  P1060/P1061 exist to catch exactly that.
