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
