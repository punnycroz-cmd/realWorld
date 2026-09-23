# Individual Differences — making every character's memory *coherently* theirs

**Track:** memory-research (sf/memory) · **Version focus:** v7 · **Date:** 2026-09-23
**Builds on:** spec v0.6, profiles §4 (diversity rule), R§8.
Companion to `memory-model-spec.md` (param names are §7 fields) and
`character-memory-profiles.md` (archetypes/modifiers).

The problem this version fixes: the v0–v6 diversity rule is
`archetype ⊕ modifiers ⊕ ±10% independent jitter`. Independent jitter
produces *random* people — a character who is randomly bad at encoding but
randomly great at source monitoring and randomly resistant to suggestion.
Real humans are not random parameter draws. Memory abilities **correlate**:
the same person who encodes weakly also retrieves weakly, monitors sources
poorly, and is easier to mislead — because one underlying system (working
memory / hippocampal integrity / trait anxiety) drives all of them
(Carroll 1993 factor structure; Zhu et al. 2010). A forgettable person
should be forgettable *everywhere*, a suspicious person suspicious
everywhere. This doc replaces independent jitter with a **latent-trait
layer**: ~10 traits sampled per character, projected onto the ~100
MemoryParams through a loading table, plus small residual jitter.

That is also the right interface for the world-builder track: character
bibles think in traits ("anxious, vivid imaginer, sleeps badly, socially
porous"), not in beta_episodic values.

---

## 1. Why a trait layer: the correlational evidence

- **Memory abilities covary.** Psychometric batteries consistently recover
  correlated memory factors rather than independent capacities (Carroll
  1993; more recently Lövdén et al. 2020 — episodic memory measures load on
  a common factor). Working-memory capacity (WMC) predicts not just span
  but source monitoring, interference resistance, and misinformation
  susceptibility (Jaschinski & Wentura 2002: WMC negatively correlated
  with misinformation-effect size; Zhu et al. 2010, N=436: false memory
  negatively correlated with Raven's, WMS, and 2-back WM; Peters et al.
  2007: WMC negatively related to DRM false memory). **[CONSENSUS that
  within-age variance is structured, not noise]**
- **Heritability.** Twin studies put episodic-memory heritability around
  ~40–60% (McClearn et al. 1997 ~60%; Volk et al. 2006; Finkel & McGue
  2007) — within-age differences are stable person-properties, not
  measurement noise. **[CONSENSUS]**
- **Stability.** Autobiographical-memory style (specificity, vividness,
  rehearsal habit) shows trait-like stability (Rubin, Schrauf & Greenberg
  2003; PALMS/AMQ-style self-ratings correlate with objective detail
  counts — debated magnitude). **[CONSENSUS direction / DEBATED size]**

**Model consequence:** per-character params must be sampled from a
correlated generative process. The trait layer below is that process.
This is a **modeling hypothesis about structure**, grounded in a
consensus fact (abilities covary); the particular loadings in §3 are
partly literature-anchored, partly our hypothesis, tagged per row.

---

## 2. The latent trait vector

```json
IndivTraits = {
  // core ability
  "g_mem":   0.0,   // general memory ability, N(0,1) — drives encoding,
                    // decay, retrieval jointly (Carroll; twin heritability)
  "wmc":     0.0,   // working-memory / executive control, N(0,1) —
                    // source monitoring, interference, misinformation
                    // resistance (Engle; Jaschinski & Wentura 2002)
  // Big-Five-derived (only the memory-relevant half)
  "neurot":  0.0,   // N — negative bias, intrusions, rumination, stress reactivity
  "extra":   0.0,   // E — positive retrieval bias, social rehearsal propensity
  "consc":   0.0,   // C — prospective memory, encoding discipline
  "open":    0.0,   // O — elaboration/novelty seeking (weak, DEBATED)
  // phenomenal / metacognitive
  "vivid":   0.0,   // imagery vividness; aphantasia tail ≈ −2σ (Dawes 2022)
  "distrust":0.0,   // memory self-distrust → correction/suggestion compliance
  "fantasy": 0.0,   // fantasy proneness → imagination inflation (Horselenberg 2000)
  // physiological / lifestyle
  "sleep":   0.0,   // habitual sleep health (+ = good sleeper)
  "stress":  0.0,   // chronic stress load (+ = more stressed)
  "social":  0.0,   // social exposure / rehearsal opportunity
  // demographic (not N(0,1))
  "sex":     "f|m", // verbal episodic tilt (Asperholm 2019)
  "chronotype": 0.0 // −1 = strong morning … +1 = strong evening
}
```

Sampling: traits ~ multivariate normal with a small correlation matrix
(§4), then `params = archetype ⊕ modifiers ⊕ Σ loadings·trait ⊕
residual(±5%)`, all clamped to profiles §0. Residual jitter drops from
±10% to **±5%** — the trait layer supplies the structured variance.

Rationale per trait follows; loadings in §3; probes in §8.

### 2.1 g_mem — one number behind "good memory"
Twin heritability ~40–60% and the common-factor structure justify a
single ability axis that moves enc_base, beta_episodic, theta,
link_p, specificity, search_breadth **together** (Carroll 1993;
McClearn 1997). [CONSENSUS that the axis exists; the shared loading is
HYPOTHESIS-parameterization — the literature gives correlations between
tasks, not a generative map.]

### 2.2 wmc — the control axis, deliberately separate from g_mem
Storage capacity and control dissociate in the literature: WMC predicts
interference/misinformation resistance beyond memory-per-materials
(Jaschinski & Wentura 2002; Brydges et al. 2018 — memory for materials,
not WMC, predicted continued influence; so `wmc` loads on
misinformation *susceptibility* but NOT on cie_residual). Loads on
discrim_mult, interf_thresh robustness (plist_suppress↓, rif), lure
rejection, misinfo_suscept↓, source_confuse↓. [CONSENSUS for
misinformation direction; per-param spread is HYPOTHESIS.]

### 2.3 neurot — negative memory tone, intrusive recall
Neuroticism predicts more frequent *involuntary negative* recall and
negative self-memory organization (Rubin, Boals & Berntsen 2008 —
neuroticism correlated with involuntary/intrusive recall frequency),
mood-congruent negative bias (Rusting & Larsen 1997), and is entangled
with rumination (Nolen-Hoeksema). Loads: neg_affect_decay↓, w_state↑,
intrusion_thresh↓ for negative-cued records, rumin_k↑,
mood_bleed↑, stress_retrieve_loss↑. [CONSENSUS direction; small-to-
moderate effects.]

### 2.4 extra — faster, sunnier, more rehearsed recall
Extraversion predicts positive-biased recall and faster memory access
(Rusting & Larsen 1997; extraverts retrieve positive material more
readily). Behaviorally extraverts rehearse more (more retellings).
Loads: w_emo_pos tilt, retell_boost↑, intrusion_thresh slightly↓
(more spontaneous social recall), neg_affect_decay↑ (lets go faster).
[CONSENSUS direction, modest; retell link is HYPOTHESIS via behavior.]

### 2.5 consc — the prospective-memory trait
Conscientiousness predicted PM task performance where cognitive ability
did not (Cuttler & Graf 2007, N=141 lifespan sample) — the only Big Five
trait with a consistent PM association. Loads: pm_self↑,
ret_noise↓, enc_base small↑ (deliberate encoding habits — DEBATED,
keep loading small). [CONSENSUS for PM; encoding link DEBATED.]

### 2.6 open — weak, kept small on purpose
Openness shows weak/inconsistent memory associations; we give it only
w_nov↑ and a small imagine_gain↑ (curiosity-driven elaboration).
[DEBATED — deliberately the weakest loadings in the table.]

### 2.7 vivid — imagery vividness as memory bandwidth
Aphantasics produce significantly fewer episodic details on the
Autobiographical Interview, especially visual details (Dawes et al. 2022;
see also Vannucci et al. on imagery–AM coupling) and SDAM patients
recollect intact facts without episodic reliving (Palombo et al. 2015).
Vividness is thus a *reconstruction-detail* trait, not an accuracy trait:
low-vivid characters return sparser reconstructions (more confab_fill
compensation, lower self-rated confidence, FEWER imagined→witnessed
flips because their imagery never reaches rm_rich_thresh; high-vivid
characters flip more — richer imagination is more confusable with
perception, Johnson & Raye reality monitoring). [CONSENSUS for the
detail effect; the flip asymmetry is our inference — DEBATED.]

### 2.8 distrust — memory self-distrust
Memory-distrust / low memory self-efficacy predicts accepting corrections
and suggestions (van Bergen et al. 2010; Gudjonsson memory-distrust work;
memory self-efficacy meta Beaudoin & Desrichard 2011). Loads:
retract_p↑, confidence offset↓ (global, not accuracy), warn_mult↓
(warnings help them *more* — they already doubt), misinfo_suscept↑
modestly. [CONSENSUS direction.]

### 2.9 fantasy — fantasy proneness
Fantasy-prone participants show larger imagination-inflation effects
(Horselenberg et al. 2000) and more reported spontaneous confabulation.
Loads: imagine_gain↑, source_confuse_flip↑, phantom_p↑ small.
[CONSENSUS for inflation link; small N literature — size DEBATED.]

### 2.10 sleep / stress / social — the lifestyle axis (trait-ified modifiers)
These were v0 modifiers; v7 promotes them to traits so they correlate
with each other and with neurot (chronic stress ↑ with neurot — partial
correlation is real, e.g., stress literature; mark the correlation
coefficient HYPOTHESIS). Same param targets as before (§3 table);
see §6 for the acute/state layer vs this trait layer.

### 2.11 sex — small but real, and *material-specific*
Asperholm et al. 2019 meta (617 studies, 1.23M participants): overall
female episodic advantage g=0.19; verbal g=0.28, faces g=0.26,
odor/taste/color g=0.37; male advantage on abstract spatial g=−0.20,
routes g=−0.24; differences smaller in childhood and old age.
[CONSENSUS — one of the largest meta-analyses in the field.]
Model: NOT a global enc_base shift (0.19 is small); instead
material-conditioned tilts — w_people/w_sensory small up for female
characters, place/spatial cue weight small up for male characters, and
the bump_peak shift already in v3 (earlier for women, Janssen 2005).
Deliberately sub-jitter magnitude.

### 2.12 chronotype — when, not whether, memory works
Synchrony effect: performance peaks at the person's optimal time of day
and the effect *interacts with age* — May, Hasher & Stoltzfus 1993:
older adults are mostly morning types and showed NO age deficit when
tested in the morning, large deficit in the afternoon; nonoptimal-time
testing also heightens proactive interference in older adults (May 1999;
Hasher, Zacks & May 1999). Loads: `peak_hour` + `synchrony_gain`,
with synchrony_gain scaled UP by age (older adults are much more
synchrony-sensitive). [CONSENSUS.]

### 2.13 The documented extremes — tails, not archetypes
Real tails exist and RW should be able to cast them:
- **HSAM / hyperthymesia** (LePort et al. 2012): near-total autobiographical
  retention. Recipe: g_mem +2.5σ, beta_episodic→clamp floor, link_p→~0.95,
  theta low, intrusion_thresh low (constant involuntary recall — the
  phenotype is involuntary-cue-driven). **Crucially: do NOT reduce
  misinfo_suscept or phantom_p** — Patihis et al. 2013 showed HSAM
  individuals are *equally* susceptible to DRM lures and misinformation
  (higher on slideshow detail misinformation). Superior retention is not
  superior veridicality — a character who remembers everything AND
  confidently reconstructs false detail is more interesting and more
  true to the literature. [CONSENSUS — PNAS finding.]
- **SDAM** (Palombo et al. 2015): lifelong absent episodic reliving with
  preserved semantic/procedural function. Recipe: vivid −2σ,
  specificity low on retrieval experience, beta_episodic high BUT
  beta_semantic normal — they *know* their past without *revisiting* it;
  low confidence on episodic recall, low recollect_q with intact
  believe_p (they believe facts about themselves without recollection —
  literally the §6.7 nonbelieved-memory dissociation as a trait).
- **Aphantasia**: vivid −2σ without the full SDAM episodic deficit —
  fewer detail fields at reconstruction, compensated by confab_fill↑
  (Dawes 2022). Debated whether aphantasia⇔SDAM overlap; keep the
  recipes separable.

---

## 3. Trait → parameter loading table (the formal core)

Convention: param_final = clamp( archetype_value · (1 + Σ a_i·t_i) + b_i·t_i )
with t_i ~ N(0,1); `·` rows are multiplicative (a_i), `+` rows additive
(b_i). Only nonzero loadings listed. Evidence tier per row.

| trait | param | loading | tier / source |
|---|---|---|---|
| g_mem | enc_base | · +0.10/σ | CONSENSUS (common factor) |
| g_mem | beta_episodic | · −0.08/σ | CONSENSUS direction |
| g_mem | theta | · −0.06/σ | HYPOTHESIS |
| g_mem | link_p | · +0.15/σ | HYPOTHESIS |
| g_mem | search_breadth | +1.5/σ | CONSENSUS direction |
| g_mem | specificity | +0.08/σ | HYPOTHESIS |
| wmc | misinfo_suscept | · −0.12/σ | CONSENSUS (Jaschinski & Wentura 2002; Zhu 2010) |
| wmc | discrim_mult | +0.05/σ | CONSENSUS direction |
| wmc | source_confuse | · −0.20/σ | CONSENSUS direction |
| wmc | plist_suppress | · −0.25/σ | DEBATED |
| wmc | lure_accept | · −0.15/σ | DEBATED |
| wmc | cie_residual | **0** (explicit null — Brydges 2018) | CONSENSUS null |
| neurot | neg_affect_decay | · −0.15/σ | CONSENSUS direction |
| neurot | w_state | · +0.20/σ | CONSENSUS direction |
| neurot | intrusion_thresh | −0.05/σ | CONSENSUS (Rubin, Boals & Berntsen 2008) |
| neurot | rumin_k | · +0.30/σ | CONSENSUS direction |
| neurot | mood_bleed | · +0.25/σ | HYPOTHESIS |
| neurot | stress_retrieve_loss | · +0.20/σ | DEBATED |
| extra | w_emo_pos | · +0.10/σ | CONSENSUS direction (Rusting & Larsen 1997) |
| extra | retell_boost | · +0.15/σ | HYPOTHESIS (behavioral path) |
| extra | intrusion_thresh | −0.03/σ | DEBATED |
| consc | pm_self | +0.12/σ | CONSENSUS (Cuttler & Graf 2007) |
| consc | ret_noise | · −0.15/σ | DEBATED |
| consc | enc_base | · +0.03/σ | DEBATED (deliberately small) |
| open | w_nov | · +0.15/σ | DEBATED |
| open | imagine_gain | · +0.10/σ | DEBATED |
| vivid | detail-write fraction* | +0.15/σ | CONSENSUS (Dawes 2022) |
| vivid | conf offset | +0.05/σ | CONSENSUS direction |
| vivid | confab_fill | · −0.10/σ | HYPOTHESIS (compensation inverted) |
| vivid | source_confuse_flip | +0.10/σ | HYPOTHESIS (rich imagination confusable; low-vivid rarely flips) |
| distrust | retract_p | +0.10/σ | CONSENSUS direction (van Bergen 2010) |
| distrust | global conf offset | −0.08/σ | CONSENSUS direction |
| distrust | warn_mult | · −0.20/σ | HYPOTHESIS (warnings land on receptive soil) |
| distrust | misinfo_suscept | · +0.10/σ | CONSENSUS direction |
| fantasy | imagine_gain | · +0.30/σ | CONSENSUS direction (Horselenberg 2000) |
| fantasy | source_confuse_flip | · +0.25/σ | CONSENSUS direction |
| fantasy | phantom_p | +0.01/σ | DEBATED |
| sleep | sleepFactor | +0.08/σ | CONSENSUS (v0 poor-sleep modifier trait-ified) |
| sleep | enc_base | · +0.03/σ | CONSENSUS direction |
| stress | enc_base | · −0.07/σ | CONSENSUS |
| stress | theta | · +0.08/σ | CONSENSUS (de Quervain; trait-chronic vs §5.4 acute) |
| stress | beta_episodic | · +0.08/σ | CONSENSUS direction |
| social | retell_boost | · +0.20/σ | HYPOTHESIS (opportunity) |
| social | w_people | · +0.10/σ | HYPOTHESIS |
| social | hearCount rate | ×1.3/σ | HYPOTHESIS (more rumor exposures) |
| sex=f | w_people, w_sensory | · +0.05 | CONSENSUS (Asperholm g=.26/.37) |
| sex=m | w_place | · +0.05 | CONSENSUS (Asperholm routes g=−.24) |
| chronotype | peak_hour | map: −1→7.5h, 0→13h, +1→19h | CONSENSUS |
| chronotype→age | synchrony_gain | base 0.06, ×(1+age_eff/60) | CONSENSUS (May & Hasher 1993) |

*`detail-write fraction` is the new §7 param `vivid_detail` — probability a
peripheral field gets written at encoding (§2 change).

Null findings that MUST stay null (important falsifiability):
- `wmc` → `cie_residual` = 0 (Brydges et al. 2018 latent analysis).
- `g_mem` → `misinfo_suscept` has NO direct loading (only via wmc) —
  HSAM-level storage does not buy suggestion immunity (Patihis 2013).
- `vivid` → accuracy params = 0 — vividness changes detail and
  confidence, not correctness (Dawes 2022 detail deficit is a
  reconstruction-width effect).
- `extra`/`consc`/`open` → distortion params ≈ 0 — the Big Five does not
  buy veridicality.

---

## 4. Correlated sampling (replaces §4 diversity rule)

Traits drawn ~ MVN(0, R) with a deliberately small correlation matrix.
Entries are our hypotheses where unlabeled (real-world r values are
heterogeneous across instruments; we pick conservative magnitudes):

```
R:  neurot·distrust   +0.35   (anxious people doubt their memory — DEBATED size)
    neurot·stress     +0.40   (trait-stress correlation)
    neurot·fantasy    +0.20   (fantasy proneness correlates w/ N — DEBATED)
    extra·social      +0.45   (extraverts get more rehearsal opportunity)
    g_mem·wmc         +0.50   (fluid-cognition coupling — CONSENSUS direction)
    wmc·consc         +0.15
    vivid·fantasy     +0.30   (imagery-rich report more fantasy proneness)
    sleep·stress      −0.30
    all other pairs   0
```

Generation recipe per character:
1. bible picks archetype (age) + modifiers + any pinned traits
   (e.g. "sleeps badly" → sleep = −1.2).
2. unpinned traits sampled from MVN(0, R) conditioned on pinned values.
3. params = archetype ⊕ modifiers ⊕ Σ loadings·traits ⊕ U(±5%) residual,
   clamped to profiles §0.
4. two characters sharing a trait signature (e.g. two anxious
   insomniacs) SHOULD land similar — that's realism; residual jitter
   keeps them distinguishable.

Why this beats independent jitter: retrieval quality, suggestibility and
confidence now move *together* the way they do in people — a low-wmc
character is BOTH more forgetful of sources AND more rumor-adoptable;
a high-vivid character is BOTH more detailed AND more prone to
imagination-flips. Correlated flaws are what make a mind legible.

---

## 5. State vs trait: the two-timescale rule

Several v0–v6 items were ambiguous between "who the person is" and "how
today went". v7 splits them explicitly:

- **Trait** (IndivTraits, fixed per character): `sleep` = habitual sleep
  health → baseline `sleepFactor`; `stress` = chronic load → baseline
  enc/theta tilts.
- **State** (context fields on the call, already in the contract):
  `cueContext.stress` (acute, §5.4 glucocorticoid), `sleepQuality` on
  dailyMemoryTick (last night), `sleepdep_flag` (was THAT night bad,
  v0.6 — encoding-window only).
- Rule: traits set the *mean*; state perturbs the *sample*. A
  good-sleeper character on a bad night still gets sleepdep_flag; the
  trait just makes bad nights rarer upstream (world-builder hooks
  nightly sleep rolls to `sleep`).

Synchrony is the cleanest state×trait case: `chronotype` is the trait,
`peak_hour`/`synchrony_gain` its params, and the deviation
`|tod − peak_hour|` is the state — encoding E and retrieval θ take a
multiplier `1 − synchrony_gain·(1 − cos(π·Δh/12))/2`, i.e. full gain at
peak, `−synchrony_gain` at antipeak. For older adults the gain grows
(×(1+age_eff/60)) — the May & Hasher asymmetry that erased the age
deficit at peak times.

---

## 6. How the v0–v6 modifiers map onto traits

No modifier is deleted — they become *named trait bundles* so existing
profile recipes keep working:

| v0–v6 modifier | v7 trait expression |
|---|---|
| Poor sleep / insomnia | sleep = −1.5σ |
| High-stress job | stress = +1.2σ |
| Highly social / gossip | social = +1.5σ (+ extra +0.5 typical) |
| Depressive / ruminative | neurot = +1.5σ + specificity modifier |
| Trauma history | neurot +0.8σ + trauma modifier (record-level, unchanged) |
| Domain expert | unchanged — domain-scoped, not a trait |
| Routine-heavy life | unchanged — environmental |
| Isolation | social = −1.5σ |
| High/low cognitive reserve | `reserve` param unchanged — it's the
  age-side sibling of g_mem (v0.4), orthogonal by design |
| **NEW: memory-distrusting** | distrust = +1.5σ — accepts corrections,
  low certainty, warns-help |
| **NEW: daydreamer** | fantasy = +1.5σ + vivid +0.8 — inflation-prone |
| **NEW: night owl / early bird** | chronotype = ±1 |
| **NEW: the total-recall cast member** | g_mem = +2.5σ, HSAM recipe §2.13 |
| **NEW: the knowing-without-reliving** | vivid = −2σ, SDAM recipe §2.13 |

---

## 7. Falsifiable validation probes (P48–P56)

- **P48 coherence:** same character, 20 novel events across 10 days —
  retrieval hit-rates across days should correlate positively for one
  character (r>0 across sessions); independent jitter would produce
  within-character variance indistinguishable from between-character.
- **P49 trait propagation:** distrust=+2 character vs distrust=−1 given
  identical corrections: adoption of correction ≥2× more likely in the
  former, while witnessed-event accuracy is unchanged.
- **P50 WMC double-dissociation:** low-wmc characters show higher
  misinformation adoption AND higher source_confuse, but cie_residual
  unchanged (Brydges null must hold).
- **P51 synchrony × age:** 70-yo evening-type recalls better at 19h than
  8h; 25-yo shows smaller gap; a morning-type 70-yo at 8h performs
  within noise of young adults (May & Hasher 1993 pattern).
- **P52 HSAM non-immunity:** g_mem=+2.5σ character retains ≥90% of
  month-old records yet adopts DRM-style phantoms and misinformation at
  ~baseline rates (Patihis 2013 — the key "no one is immune" test).
- **P53 vivid asymmetry:** high-vivid characters produce reconstructions
  with more filled detail fields AND more imagined→witnessed flips;
  low-vivid produce sparser reports with near-zero flips but MORE
  confab_fill at narration time.
- **P54 sex tilt is material-specific:** female characters outperform on
  people/verbal/sensory cues, not on place cues; the gap is small
  (sub-jitter) — a regression toward a huge sex gap is a bug, not
  a finding (Asperholm bounds).
- **P55 correlated-clone check:** two characters generated with
  identical traits but different residual seeds should show correlated
  parameter vectors (r>0.9) yet non-identical recall trajectories.
- **P56 trait stability:** after 200 simulated days, a character's
  rank-order among castmates on retrieval hit-rate is stable (traits are
  not eaten by stochastic drift).

---

## 8. Honest limits

- The loadings in §3 beyond the consensus-direction ones are calibrated
  *judgment*, not meta-analytic fits — we have correlation-level
  evidence, not a generative map. Marked HYPOTHESIS.
- Big Five–memory links are genuinely weak in the literature (except C→
  PM); we deliberately keep those loadings small. If playtests show
  personalities' memories feel "too different", scale §3's DEBATED rows
  down first.
- The correlation matrix R is mostly hypothesis; its structure (sparse,
  a few strong pairs) is more defensible than its magnitudes.
- Sex effects are small on purpose — the meta-analytic reality is a
  material-specific tilt, and overshooting it produces caricature.
