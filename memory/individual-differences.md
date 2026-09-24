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

---
---

# Part II — v19: the second axis of difference (state noise, language,
# culture, metacognition, domain knowledge, and time itself)

**Version focus:** v19 · **Date:** 2026-09-23 · **Builds on:** Part I
(trait layer), spec v1.8, profiles §7.

Part I established that within-age variance is *structured*: one latent
vector projects onto ~100 params. Part II pushes the layer in five
directions the first pass left informal:

1. **Time-varying person noise.** A character is not the same rememberer
   every day — intraindividual variability (IIV) is a *trait in itself*,
   and it grows with age and shrinks with control (§10).
2. **Encoding channel context that is personal**: language of encoding
   for bilinguals (§11) and self-construal for content/style (§12) —
   neither is a generic cue weight; both are who-the-character-is.
3. **Metacognitive personality.** Confidence, complaints, and checking
   have their own trait axes that are *deliberately decoupled* from
   accuracy (§13) — including the documented paradox that verification
   *destroys* confidence.
4. **Knowledge as a double edge.** Crystallized knowledge and domain
   expertise buy recall AND semantic-lure vulnerability (§14).
5. **Slow change.** Traits themselves drift with age (maturity
   principle) and individual aging slopes differ (§15) — plus one new
   *state* the v5 two-timescale rule needed: intoxication (§16).

New traits: `inattn`, `verbal`, `gc`, `meta_conf`, `checker`,
`culture_self`, `fitness`, `dissoc`, `empathy` (promoted from v1.7
implicit), `langs` (set-valued). New params: §16 loading table →
spec §7.

---

## 9. Why more axes: what Part I could not express

Part I's traits explain *level* differences. Three literatures say the
residual structure is not noise either:

- **Within-person variance is itself a stable trait.** Intraindividual
  variability (trial-to-trial and day-to-day spread, not just mean)
  is reliable, increases with age, inversely relates to WMC, and
  *predicts* cognitive decline better than mean level in some cohorts
  (Hultsch, MacDonald, Hunter, Levy-Bencheton & Strauss 2000;
  MacDonald, Hultsch & Dixon 2003; Nesselroade & Salthouse 2004 found
  within-person variance ~60% of total in perceptual-motor tasks).
  **[CONSENSUS that IIV is real and age-linked; the generative mapping
  to our daily-noise term is HYPOTHESIS.]**
- **Metamemory is a personality domain.** Self-confidence is a stable,
  domain-general trait orthogonal to ability (Kleitman & Stankov 2007 —
  confidence ratings correlate across verbal/perceptual tasks while
  accuracy does not; also Kleitman & Stankov 2001). Memory *complaints*
  correlate with depression/anxiety (r≈0.3–0.4) more than with tested
  performance (r≈0.1–0.15) (Jonker, Geerlings & Schmand 2000; Reid &
  MacLullich 2006). **[CONSENSUS.]**
- **Language and culture re-partition autobiographical memory.** Both
  change *which* records exist and *how* they are told — not captured
  by any ±σ loading on shared params (§§11–12).

Consequence: the trait layer gets a second block of axes and one new
state variable, while Part I's axes are untouched — this is additive,
not a refactor.

## 10. IIV — the inconsistency trait

New trait `iiv` (+ = more variable) and param `iiv_sigma` (σ of a
per-day multiplier on encoding E and per-call noise on drive). The
documented structure:

- IIV rises with age and with low WMC (Hultsch et al. 2000; Lövdén et
  al. 2007), and is *more* trait-like than mean level across domains
  (Nesselroade & Salthouse 2004). 
- Formalization: each dailyMemoryTick draws
  `day_mult = exp(N(0, iiv_sigma))` applied to that day's encoding E and
  to θ (retrieval-side half as large: θ += N(0, iiv_sigma/2) per recall
  call). `iiv_sigma = 0.04·(1 + age_eff/50)·(1 − 0.25·wmc)` —
  a 70-year-old low-control character is ~2× as day-to-day variable as
  a young high-control one. [Functional-form HYPOTHESIS on CONSENSUS
  direction.]
- Design consequence: P56's rank-stability test stays true at the trait
  level while *daily* performance legitimately crosses ranks — a
  character has good days and bad days without any plot reason. This
  also gives the game-systems track a cheap "off day" dial.

Related but distinct: `inattn` — the everyday-lapse trait (Cognitive
Failures Questionnaire lineage, Broadbent et al. 1982; mind-wandering
literature, Smallwood & Schooler 2006; Unsworth & McMillan 2013 —
mind-wandering prospectively predicts PM errors and encoding gaps).
Model: `omit_p` — probability a routine, low-salience event is never
encoded *at all* (not a weak record — absent), plus small pm_self and
enc_base costs. This is the "walked right past the note" trait; it
produces absent-mindedness that no amount of retrieval cuing can fix,
which is exactly what makes it read as a personality and not a bug.
[CONSENSUS direction; omit_p magnitude HYPOTHESIS.]

## 11. Language of encoding — bilingual cue match

Marian & Neisser (2000): Russian-English bilinguals retrieved ~2× more
memories from the matching-language life period; ambient language
mattered more than prompt language (Exp 2: both independently
effective). This is encoding specificity operating through the
linguistic channel — the cleanest possible justification for a `lang`
field on records.

Model:
- Record schema gains optional `lang` (the dominant language of the
  episode; world-builder/event layer supplies it — Mission District
  Spanish/English bilinguals, Mandarin grandparents, etc.).
- cueContext gains `lang`; when both are set and differ, the
  verbal/topic/people cue contributions are attenuated ×`lang_mismatch`
  (≈0.6) — not zeroed: context match, not access gating (Marian &
  Neisser; Matsumoto & Stanny 2006 on emotional language).
- Converse: monolingual characters (`langs` singleton) never pay the
  cost — trait expresses only through record distribution.
- **Deliberate null:** bilingualism gets NO `wmc`/executive bonus. The
  "bilingual advantage" literature failed replication (Paap & Greenberg
  2013; Paap, Johnson & Sawi 2015) — we mark it DEBATED-to-null and
  assign zero loading. The real effect we model is cue specificity.

## 12. Self-construal — whose story gets kept

Wang's program (Wang 2001 — American vs Chinese students' earliest
memories ~6 months apart; Americans lengthy/specific/self-focused/
emotionally elaborate, Chinese brief/collective/routine-focused;
Wang & Brockmeier 2002; Wang 2003 infantile-amnesia cross-cultural
analysis; Fivush & Nelson 2004 on maternal reminiscing style as the
mechanism) establishes that self-construal changes autobiographical
memory's *boundary, content mix, and narrative density*.

New trait `culture_self` ∈ [−1, +1] (−1 = strongly interdependent, +1 =
strongly independent; we parameterize the *psychological construct*,
not ethnicity — a Mission kid raised on elaborative dinner-table
reminiscing is +0.8 regardless of ancestry):

| param | loading | basis |
|---|---|---|
| amnesia_exit | −0.5y·culture_self | Wang 2001/2003 (~6mo observed shift) |
| w_self | ·+0.10·culture_self | self-focused content (CONSENSUS) |
| w_people | ·−0.05·culture_self → i.e. social/routine weight up at −1 | Wang content analyses |
| specificity | +0.05·culture_self | specific vs categorical style |
| emo tag richness at encoding | +0.05·culture_self on `vivid_detail` | emotional elaboration |
| retell content | interdependent → collective framing drifts fields toward shared/routine (uses existing §6.11 audience_tune machinery — no new param) | Wang & Brockmeier 2002 |

**Mechanism note:** the amnesia_exit effect is hypothesized to run
through reminiscing *style* (elaborative vs pragmatic maternal talk,
Fivush; Leichtman) — so the trait belongs in character bibles as
"family reminiscing culture," which world-builder can set
independently of present-day personality. [CONSENSUS that the group
difference exists; per-character parameterization HYPOTHESIS.]

## 13. Metacognitive personality — confidence, complaints, checking

Three traits that deliberately do NOT touch accuracy:

- **`meta_conf` → `conf_bias` (existing param) + `meta_cal` (new).**
  Trait self-confidence is stable and domain-general (Kleitman &
  Stankov 2007). `conf_bias` is the intercept (already in §7);
  `meta_cal` is the calibration *slope*: reported confidence spread
  scales `conf_out = conf_bias + meta_cal·(conf − 0.5) + oc_gain…`.
  High-meta_conf characters report confidently right AND confidently
  wrong — the courtroom-persuasive unreliable narrator.
- **`mem_complaint` — felt memory decoupled from real memory.**
  `selfReport` (v1.0) gains a complaint term:
  `complaint = clamp01(0.3·neurot + 0.4·distrust + 0.2·stereo_suscept·
  age_gate + complaint_k·N(0,1) − 0.1·g_mem)` — note the weights:
  affective traits dominate, actual ability enters at −0.1 only,
  matching the complaint-vs-performance literature (Jonker 2000;
  Reid & MacLullich 2006; meta-analytic complaint-depression link in
  older adults). The 65-year-old who says "my memory is going" may be
  the cast's most accurate member; the 30-year-old who never complains
  may confabulate daily. Believability gold for dialogue. [CONSENSUS
  direction; weights HYPOTHESIS.]
- **`checker` and the verification paradox.** van den Hout & Kindt
  (2003; replicated — Radomsky et al.; meta-analysis k=28, N=1662,
  *large* effects on confidence/vividness/detail, small on accuracy):
  repeated checking *reduces* memory confidence — familiarity shifts
  processing to the conceptual level, starving recollection of
  perceptual detail. Model: `cueContext.verify:true` recall calls apply
  `conf_out −= check_conf_loss·log1p(retrievalCount)` and report fewer
  detail fields (vivid_detail fraction ↓ on the report side only —
  the record is intact; the *experience* of it is thinned). High
  `checker` trait → character keeps checking → keeps distrusting →
  keeps checking. A self-sealing loop straight out of the OCD
  literature, free of any psychopathology claim: any meticulous
  landlord re-checking "did I lock the unit" gets the effect.
  [CONSENSUS — one of the better-replicated individual-difference
  findings in metamemory.]

## 14. Knowledge and expertise — the double edge

Part I had `reserve` (buffer) and v1.0 has `expert_gain`/`domainMatch`.
Two findings sharpen the picture:

- **Crystallized knowledge `gc` trait** (Horn & Cattell; preserves or
  grows into old age — Salthouse). Loadings: `link_p`·+0.10/σ for
  knowledge-consistent records (richer associative scaffold);
  `know_protect_*` gains +0.10/σ; `search_breadth` +1/σ (more
  candidates to try); `lure_accept` **+0.05/σ — positive sign**:
  denser semantic networks mean stronger gist extraction, and gist
  is what semantic lures exploit (Brainerd & Reyna FTT; the aging
  DRM literature). `tot_rate` +0.02/σ — bigger vocabulary, more
  near-neighbor blockers (Burke et al. 1991). The well-read character
  is *better* at knowing things and *worse* at knowing whether a
  plausible thing actually happened. [CONSENSUS for both directions;
  the coupling is our FTT-derived HYPOTHESIS.]
- **Expertise dark side `expert_lure`.** Experts show *more* false
  recall for domain-consistent material (Baird 2003; Castel, McCabe,
  Roediger & Heitman 2007 "The Dark Side of Expertise"; Arkes &
  Freedman 1984). Model: when `domainMatch` fires (v1.0 machinery),
  `expert_gain` boosts encoding AND `expert_lure` (≈0.10) adds to
  lure acceptance / phantom adoption for domain-consistent content.
  A chef misremembers the recipe she never actually used; a
  contractor swears the inspection happened. Scope-locked: the bonus
  and the cost are the same trait.

## 15. Slow axes — trait drift and aging-rate variance

- **Personality maturation (the maturity principle).** Meta-analytic
  longitudinal work: conscientiousness and agreeableness rise,
  neuroticism falls through midlife (Roberts, Walton & Viechtbauer
  2006; Roberts & Mroczek 2008). Model: optional yearly trait drift —
  `neurot −0.02σ/yr` between ages 20–50, `consc +0.02σ/yr`, clamped —
  re-derive affected params on the yearly re-anchor the spec already
  does (§7 "re-anchored yearly"). Subtle, cumulative, and it makes a
  character's 30s genuinely different from their 20s. [CONSENSUS
  direction; magnitudes small.]
- **`aging_rate` — individuals age at different rates.** Between-person
  variance in cognitive change grows with age (Salthouse 2010;
  Rabbitt et al.). Model: `aging_rate` trait N(0,1) multiplies the
  decline-side evaluation: `age_eff = (age_now − reserve·reserve_shift)
  ·(1 + 0.2·aging_rate − 0.15·fitness)`. `fitness` — aerobic fitness —
  is a real modifiable factor: exercise training increases hippocampal
  volume ~2% in older adults (Erickson et al. 2011, PNAS RCT);
  fitness meta-analysis shows ~0.5 SD cognitive benefit (Colcombe &
  Kramer 2003). The runner's 70-year-old is functionally 62; the
  sedentary smoker's is 78. [CONSENSUS for fitness-direction; the
  0.2/0.15 magnitudes are HYPOTHESIS fitted to reserve_shift's scale.]
- **`dissoc` — peritraumatic dissociation.** Best single predictor of
  PTSD in Ozer et al.'s (2003) meta-analysis (r≈0.35). Model on
  `trauma:true` records only: high dissoc → lower S at birth but
  *more* fragment records (split the event across weakly-linked
  records), lower intrusion_thresh for those fragments — the
  fragmented-trauma phenotype (Brewin dual-representation theory —
  DEBATED as mechanism, CONSENSUS as phenomenology). Keeps trauma
  heterogeneous per character rather than a uniform script.

## 16. State variable the two-timescale rule was missing: intoxication

§5 split traits from states but had no pharmacological state. The sim
has bars and parties; alcohol is the most common everyday memory
perturbation and is *dramatically* under-modeled:

- Event/call context gains `intox` ∈ [0,1] (0 = sober … 0.7 ≈ heavy
  drinking, ~0.15–0.20 BAC neighborhood). Encoding only:
  `E *= (1 − intox·(1 − intox_encode_mult))` with
  `intox_encode_mult` ≈ 0.3 at intox=1; peripheral fields drop at
  `+0.4·intox` beyond vivid_detail — alcohol disproportionately
  impairs *encoding* of new episodic memories while sparing retrieval
  of material learned sober (Miller et al.; Söderlund et al. 2005;
  Mintzer 2007 review). **[CONSENSUS: anterograde ≫ retrograde.]**
- Fragmentary blackouts at intox ≥ ~0.8: the night's records become
  sparse islands (islands survive; intervals absent — White 2003:
  fragmentary blackouts dominate en-bloc; ~50% of drinkers report at
  least one). Implement as `omit_p += 0.5·max(0, intox − 0.8)/0.2`
  for that window. Morning-after gap-filling then runs through
  ordinary confab_fill — a hungover character's reconstructed night
  is a *confabulation showcase*. [CONSENSUS mechanism.]
- Mild state-dependency: `intox_state_dep` ≈ 0.05 cue-match bonus when
  encode/retrieval intox levels match (Goodwin et al. 1969; mixed
  replications — DEBATED, kept small).
- Interaction: high-intox records encode with w_state inflated → they
  are disproportionately retrievable in later similar states — the
  seed of "we only talk about that night when we're drinking."
- Cannabis gets the same `intox` slot with a comment flag (similar
  anterograde profile, weaker evidence — Ranganathan & D'Souza 2006).

## 17. Extended trait vector and R additions

```json
IndivTraits += {
  "inattn": 0.0,      // everyday lapses, mind-wandering, PM slips
  "verbal": 0.0,      // verbal ability — narrative recall quality
  "gc": 0.0,          // crystallized knowledge density
  "meta_conf": 0.0,   // trait self-confidence (Kleitman & Stankov 2007)
  "checker": 0.0,     // verification compulsion → distrust loop
  "culture_self": 0.0,// −1 interdependent … +1 independent construal
  "fitness": 0.0,     // aerobic fitness → aging slope
  "aging_rate": 0.0,  // idiosyncratic aging slope
  "dissoc": 0.0,      // peritraumatic dissociation proneness
  "empathy": 0.0,     // promoted: already drives v1.7 contagion
  "langs": ["en"],    // set-valued; record/cue lang matching (§11)
  "iiv": 0.0          // day-to-day inconsistency (§10)
}
```

R additions (same sparse philosophy — hypotheses unless noted):

```
inattn·wmc       −0.45  (mind-wandering ∝ low control — CONSENSUS dir.)
inattn·consc     −0.30
verbal·gc        +0.55  (vocabulary is the canonical gc proxy)
gc·reserve       +0.40  (education/occupation → reserve — CONSENSUS)
meta_conf·distrust −0.55 (same coin, opposite faces)
checker·neurot   +0.35
checker·distrust +0.40
culture_self·social +0.10 (weak — reminiscing culture ≠ sociability)
fitness·stress   −0.15
dissoc·neurot    +0.25
empathy·extra    +0.20
aging_rate·fitness −0.20 (fitness partially realizes as slow aging)
```

Pinned-trait conditioning (made explicit — Part I left it informal):
with pinned set P and values t_P, unpinned traits U ~ N(0, R_UU);
the conditional draw is `U | t_P ~ N(R_UP·R_PP⁻¹·t_P,  R_UU −
R_UP·R_PP⁻¹·R_PU)` — standard MVN conditioning. Pinning "anxious
insomniac" (neurot=+1.5, sleep=−1.2) therefore *pulls* distrust,
stress, fantasy, checker upward automatically; a bible that pins
`distrust=+2` without neurot gets a merely-self-doubting character,
not an anxious one — the difference shows up in rumin_k, not in a
warning.

### Loading table additions (rows beyond Part I §3)

| trait | param | loading | tier / source |
|---|---|---|---|
| inattn | omit_p | +0.03/σ | CONSENSUS dir. (CFQ/mind-wandering) |
| inattn | pm_self | −0.08/σ | CONSENSUS dir. (Unsworth & McMillan) |
| inattn | enc_base | ·−0.05/σ | DEBATED |
| verbal | confab_fill fluency* | +0.10/σ | HYPOTHESIS (fluent gaps) |
| verbal | link_p (verbal material) | ·+0.10/σ | CONSENSUS dir. |
| verbal | lure_accept | +0.04/σ | DEBATED (gist extraction edge) |
| gc | link_p | ·+0.10/σ | CONSENSUS dir. |
| gc | know_protect_* | ·+0.10/σ | CONSENSUS dir. |
| gc | lure_accept | +0.05/σ | CONSENSUS dir. (FTT gist) |
| gc | tot_rate | +0.02/σ | CONSENSUS dir. (Burke 1991) |
| gc | search_breadth | +1/σ | HYPOTHESIS |
| meta_conf | conf_bias | +0.10/σ | CONSENSUS (Kleitman & Stankov 2007) |
| meta_conf | meta_cal | ·+0.15/σ | DEBATED |
| checker | check_conf_loss | ·+0.30/σ | CONSENSUS dir. (van den Hout & Kindt) |
| checker | distrust-linked retract_p | +0.05/σ | DEBATED |
| culture_self | (see §12 table) | | Wang 2001/2003 |
| fitness | aging_rate mult | −0.15·fitness | CONSENSUS dir. (Erickson 2011) |
| aging_rate | age_eff scale | ×(1+0.2·aging_rate) | HYPOTHESIS magnitude |
| dissoc | trauma S at birth | ·−0.15/σ | CONSENSUS dir. (Ozer 2003) |
| dissoc | trauma fragment count | +1 frag/σ | DEBATED (Brewin mechanism) |
| dissoc | intrusion_thresh (trauma frags) | −0.08/σ | CONSENSUS dir. |
| empathy | contagion_k | ·+0.30/σ | already implicit in v1.7 — now a trait |
| iiv | iiv_sigma | +0.02/σ | CONSENSUS dir. (Hultsch 2000) |
| langs≥2 | lang_mismatch applies | on/off | CONSENSUS (Marian & Neisser) |
| langs≥2 | wmc | **0 — explicit null** | DEBATED-null (Paap & Greenberg) |

*fluency: narration-side smoothness of confabulated fields — report
quality, not content quality.

**New explicit nulls** (joining Part I's list — falsifiability):
- `langs≥2 → wmc` = 0 (bilingual-advantage replication failures).
- `meta_conf → accuracy params` = 0 — confident people are not righter.
- `checker → accuracy` = 0 — checking erodes *confidence*, not memory
  (meta-analytic accuracy effect is small).
- `culture_self → beta_*` = 0 — the shift is in boundary/content/style,
  not forgetting rate.
- `fitness → beta_episodic` = 0 directly — it works through age_eff.

## 18. New falsifiable probes (P173–P182; spec §validation-design §18)

- **P173 IIV signature (MUST):** a 70yo low-wmc profile shows ≥1.5×
  the day-to-day retrieval hit-rate variance of a 25yo high-wmc
  profile on identical cue sets, while 200-day rank-order stays
  stable (P56 not broken). Constrains `iiv_sigma`.
- **P174 language-dependent recall (MUST — sign-locked):** bilingual
  profile probed in language A vs B: matching-language records
  recalled ≥1.4× mismatching (Marian & Neisser ~2× direction,
  conservative bound); monolingual profile shows no lang effect.
  Constrains `lang_mismatch`.
- **P175 self-construal boundary (SHOULD):** culture_self=+1 vs −1
  profiles: amnesia_exit shifts ~0.5y; +1 records richer in self/
  emotional detail fields; −1 records denser in people/routine fields;
  forgetting rate equal (null half of the test). Constrains §12.
- **P176 checking paradox (MUST — sign-locked):** verify-recall on a
  high-retrievalCount record reports LOWER confidence and FEWER
  detail fields than first recall; accuracy unchanged (van den Hout &
  Kindt — FAIL if verification raises confidence).
  Constrains `check_conf_loss`.
- **P177 complaint decoupling (SHOULD):** across a 500-profile cohort,
  selfReport complaint correlates with neurot/distrust composite at
  r≥0.3 but with actual hit-rate at |r|≤0.2 (Jonker 2000 bands).
- **P178 expertise dark side (SHOULD):** domainMatch-on records show
  HIGHER true recall AND higher domain-consistent lure acceptance vs
  matched off-domain records (Castel 2007 sign-lock).
- **P179 intoxication fragmentation (SHOULD):** encode run at
  intox=0.9 produces ≥40% fewer records for the window, surviving
  records sparser in peripheral fields, and sober-cued retrieval of
  the window is impaired vs a matched sober window; retrieval of
  sober-learned material while intox is nearly intact (anterograde
  asymmetry sign-lock). Constrains `intox_encode_mult`.
- **P180 aging-rate spread (OBSERVE):** at age 80, aging_rate ±1.5σ
  profiles differ in functional age by ~±10y on the decline params
  while reserve is held fixed — the two buffers are orthogonal.
- **P181 maturity drift (OBSERVE):** 20→50y trait-drift on shifts
  neurot-linked params in the reported direction by ~0.4σ total;
  no discontinuity at any single re-anchor.
- **P182 dissociative trauma (OBSERVE):** high-dissoc trauma records
  present as more, weaker, fragment records with more involuntary
  returns — NOT as higher-S consolidated memories. Report-only.

## 19. Part II honest limits

- `iiv_sigma`, `omit_p`, `lang_mismatch`, `check_conf_loss`,
  `intox_encode_mult` magnitudes are judgment fits to effect-size
  directions; the *signs* are consensus, the numbers are ours.
- Culture/self-construal parameterization deliberately models the
  psychological construct — never ethnicity — and should stay that
  way in bibles.
- The Brewin dual-representation mechanism under `dissoc` is
  contested; the phenomenology (fragmented, intrusive trauma recall)
  is not. We model the phenomenology.
- `meta_cal` (calibration slope) is the weakest-anchored new param —
  calibration research gives trait confidence (intercept) stronger
  support than trait slope. Flagged DEBATED; set to 1.0 (neutral) if
  playtest reports feel off.

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

---

# Part III — v31: the third axis of difference (the face store,
# neurodivergence, suggestibility as trait, vigilance, intensity,
# and the hormones we refuse to model)

Part I gave every character a correlated trait vector. Part II added
state noise, language, culture, metacognition, knowledge, and drift.
What remains unmodeled are the axes where *which store* differs per
person (faces vs episodes), where *diagnostic phenotypes* carry
parameter signatures the Big Five can't express (ADHD, autism), where
social pressure rather than content does the distorting
(suggestibility), where the difference is in what counts as
*threat-worthy* (vigilance), in raw *amplitude* (affect intensity),
and in endocrine states the field itself is still arguing about.

## 20. `face_ability` — the dissociable store

Face recognition is a *separable* ability from episodic memory, with
its own trait axis and its own tails. Developmental prosopagnosia
(DP) prevalence ≈2.5% (Kennerknecht et al. 2006, n=689; worldwide
survey mean 0.93–2.29%, Kennerknecht et al. 2017; cutoff-dependent
range 0.64–5.42%, DeGutis et al. 2023, n=3116). At the other tail,
super-recognizers (Russell, Duchaine & Nakayama 2009; Ramon, Bobak &
White 2019) score ≥+2σ on face-memory batteries — also ~1–2%.
Crucially the axis is *store-specific*: DP cases show intact verbal
and non-face visual memory (the deficit localizes to face-identity
processing; Dalrymple et al. 2011; Bate et al. 2019 subtypes
dissociate perception, unfamiliar-face memory, and familiar-face
recognition). This is the cleanest trait in the whole vector: it
loads on the §5.10 PersonModel cascade and on essentially nothing
else.

- `face_ability` σ ∈ [−3, +3]; r(face_ability, g_mem) ≈ +0.2
  (partially separable factor — CONSENSUS, Wilmer et al. 2010
  "specificity" finding), r(wmc) ≈ 0.
- Loadings: PersonModel `familiarity` accrual `× (1 +
  fam_gain·face_ability)` with fam_gain ≈ 0.35; `familiar_thresh`
  offset `− fam_thresh_off·face_ability` (0.03) — better face
  learners cross tier-1 sooner AND accumulate faster. Tiers 2–3
  (identity, name) get HALF the loading — names are partly a verbal
  store (Cohen 1990 Baker/baker asymmetry stays).
- Explicit nulls (falsifiable): `face_ability → beta_episodic` = 0;
  `face_ability → misinfo_suscept` = 0; `face_ability → vivid_detail`
  = 0 on non-face fields. A face-blind character remembers the
  *conversation* fine — she just can't pick the speaker out again.
  This dissociation is the probe (P298).
- Tail recipes: DP ≈ face_ability ≤ −2σ (familiar_thresh ≈ 0.31,
  accrual ×0.3 — she learns "the woman with the red coat", not the
  face); super-recognizer ≥ +2σ (familiar_thresh ≈ 0.19, accrual
  ×1.7 — one crowded-room glance mints a durable PersonModel).
  Both tails are bible-usable without touching episodic params.

## 21. `adhd` — an encoding deficit wearing a memory costume

The adult-ADHD meta-analytic picture is sharper than the folklore:
long-term memory deficits in ADHD are *acquisition* deficits —
verbal LTM impaired, visual LTM intact, and the LTM deficit is
statistically carried by the encoding deficit with NO retrieval
deficit once material is learned (Skodzik, Holling & Pedersen 2017
meta-analysis — "a learning deficit induced at the stage of
encoding"). Working-memory deficits are large (Alderson et al. 2013
meta, adult ADHD; Kofler et al. 2018 children d ≈ 1.17–1.44 across
WM components, episodic buffer itself intact). Interference pattern
is asymmetric: children with ADHD show LESS proactive-interference
cost (g = −0.53) but MORE retroactive-interference cost
(g = +0.17) and worse memory-control tasks (g = 0.35; Söderlund et
al. 2022 meta — read as shallow upfront binding, fragile new
traces). Prospective memory is reliably impaired (Altgassen et al.;
intention execution, not formation).

- `adhd` σ ∈ [0, +3] (phenotype intensity, one-tailed);
  r(inattn) +0.5 (same surface behavior, different mechanism —
  inattn is trait mind-wandering, adhd adds the WM/interference
  signature and the arousal-gating below).
- Loadings (all encoding-side, per Skodzik): `omit_p += 0.04/σ`;
  `vivid_detail` on VERBAL fields only `×(1 − 0.12·adhd)`;
  `pm_self ×(1 − 0.15·adhd)`; `iiv_sigma += 0.02·adhd` (IIV is a
  documented ADHD signature — Kofler 2013 variability meta);
  retroactive interference `interf_k += 0.03·adhd` on records born
  within `consol_window_days` only (fragile-new-trace account).
- Explicit nulls: `adhd → beta_*` = 0 (storage is intact);
  `adhd → theta` = 0; `adhd → misinfo_suscept` = 0. The probe is
  the asymmetry itself (P299): impaired at birth, normal after
  consolidation, normal retrieval.
- `hyperfocus_gate` (0.5, DEBATED-clinical-lore): on records with
  `interest ≥ 0.8` the omit_p and att_min penalties INVERT —
  `E += hyperfocus_gate·adhd·0.1` — attention that won't allocate
  on demand over-allocates on capture. Marked HYPOTHESIS:
  self-report-consistent, thin experimental literature (Ozel-Kizil
  et al. 2016). Optional; default on but small.
- Age knot: adult attenuation `×(1 − 0.2·max(0, age_eff−40)/30)` —
  persistence estimates vary wildly (DEBATED; Faraone et al. 2006
  meta ~65% partial remission); we attenuate the *loads*, not the
  trait.

## 22. `asd` — the gist-side reversal

Autistic memory is the natural adversary of our §6 machinery: the
meta-analytic result is DECREASED suggestibility and false-memory
susceptibility vs general population (z = −2.37, p = .018 —
Maras et al. 2019/2021 ID+ASD meta; the same meta found ID
INCREASED, z = 6.10). The mechanism picture is now nuanced: recent
DRM work finds comparable false-recognition *rates* but absent
implicit spreading-activation priming (Murphy, Ichijo, Bird &
Cooper 2025 — autistic adults falsely recognize lures they were
never implicitly primed by; explicit association intact). Weak
central coherence (Happé 1997) predicts the reduced gist
extraction; source-monitoring deficits (Lind & Bowler 2009 —
self-generated vs other-generated detail confusion, real vs
imagined confusion) predict the opposite-direction hole. And
autobiographical specificity is reduced — OGM in ASD (Crane &
Goddard 2008; Crane et al. meta) — detail-rich in perception,
summary-poor in self-narrative.

- `asd` σ ∈ [0, +3]; r(extra) ≈ −0.3, r(gc) ≈ +0.1, r(neurot)
  ≈ +0.2 (comorbid anxiety is the norm, not the mechanism).
- Loadings — the FTT-inversion bundle: `phantom_p ×(1 −
  asd_gist_pen·asd)` (0.15 — fewer gist-lure phantoms);
  `lure_accept −= 0.02·asd`; `misinfo_suscept ×(1 − 0.1·asd)` on
  *leading-question* accounts only (Yield channel; the meta effect
  is on suggestibility, not rumor-merging — boundary-locked, P300);
  `k_verbatim −= asd_verbatim_gain·asd` (0.08 — verbatim fields
  decay slower; detail-preserving phenotype, Maras & Bowler 2014
  "verbatim memory" reviews); `source_confuse += asd_src_gain·asd`
  (0.05 — Lind & Bowler); `specificity ×(1 − asd_spec_loss·asd)`
  (0.1 — OGM) gated to self-cued/people-cued recall only, NOT
  sensory cues (sensory-cued autobiographical retrieval is a
  documented ASD strength — Crane, Goddard & Pring).
- Explicit nulls: `asd → beta_episodic` = 0; `asd → E` = 0 on
  non-social events; `asd → sleep/consolidation` = 0. The profile
  is: same decay, sharper verbatim residue, fewer gist ghosts,
  more source confusion, thinner self-narrative — a recognizably
  different *texture* at identical hit-rates.

## 23. `suggs` — yielding is a trait, and it is not distrust

Part I's `distrust` models memory *self*-distrust. The Gudjonsson
Suggestibility Scales measure a different thing: Yield (giving in
to leading questions) and Shift (changing answers under negative
feedback/interpersonal pressure), and the two components correlate
poorly with each other (Gudjonsson 1984/1997; Gignac & Powell 2009
CFA, n=220 children). SEM work routes suggestibility through
fearful-avoidant attachment and compliance — Shift specifically is
carried by compliant tendencies + distress, not by memory quality
(Drake 2010). So `suggs` is a *social-pressure* trait layered on
the content channel:

- `suggs` σ; r(neurot) +0.3, r(meta_conf) −0.3, r(attach_avoid)
  +0.15 (Drake's FAA path — direction only), r(asd) −0.2 (§22),
  r(g_mem) ≈ −0.1 (weak — Yield 1 correlates with narrative recall
  quality only modestly; Gudjonsson's own data).
- Loadings: `misinfo_suscept += suggs_yield·suggs` (0.06) on
  accounts the hearer cannot verify (Yield); NEW flag
  `hearAccount{negativeFeedback:true}` — authoritative contradiction
  of the hearer's own prior report — triggers the Shift path:
  `confidence −= suggs_shift·suggs` (0.08) AND the challenged field
  accepts the challenger's candidate at `misinfo_suscept·1.5` —
  pressure flips answers, not beliefs (the record's beliefStatus
  may stay put while the REPORTED field changes; implement as a
  report-side override on the reconstruction, not a stored edit).
- Explicit nulls: `suggs → beta_*` = 0; `suggs → E` = 0;
  `suggs → confab_fill` = 0 — GSS-confabulation is scored separately
  and we already have confab_fill; do not double-load.

## 24. `vigil` — whose threat gets remembered

Two literatures converge on the same parameter signature: lonely
individuals show hypervigilance for SOCIAL threat with downstream
attentional, confirmatory, and *memorial* biases — they remember
more negative social information (Cacioppo & Hawkley 2009 review;
Spithoven et al. 2017 SIP-model review — the bias is specific to
the social context). Trait anxiety shows a recall-side memory bias
for threatening material (Mitte 2008 meta, 165 studies/9046 Ss:
significant for RECALL, null for recognition and implicit memory —
the bias lives in reconstruction, not copy cues). Both are
content-class gated: social-threat tagged events, not all negatives.

- `vigil` σ; r(neurot) +0.45 (overlapping but separable — neurot is
  general negative tone, vigil is threat-channel gating),
  r(social) −0.2 (loneliness composite).
- Loadings: on records the event layer tags `socialThreat:true` —
  `w_emo_neg ×(1 + vigil_social_gain·vigil)` (0.15, encode-side);
  recall-side drive `+= vigil_recall_bias·vigil` (0.05) when
  `cueContext.mode == "recall"` only — the Mitte boundary: no
  recognition-mode effect (P303 sign-locks this). Also a small
  confirmatory loop: PersonModel[other].traits["threatening"]
  accrues `sti_gain ×(1 + 0.2·vigil)` on negative social inferences
  only (the SIP confirmation path).
- Explicit nulls: `vigil → w_emo_neg` on non-social records = 0;
  `vigil → recognition` = 0 (Mitte); `vigil → beta_*` = 0.

## 25. `aim` — the amplitude trait

Affect Intensity (Larsen & Diener 1985; Larsen 1987 review; AIM
scale) is stable, trait-like, and orthogonal to hedonic level —
high-AIM people respond to the same stimulus with stronger affect
of BOTH valences. The cognitive-operation finding is the one we
need: high-AIM individuals run more personalizing and
generalizing/elaborative operations *only on affective stimuli* —
neutral stimuli produce no group difference (Larsen, Diener &
Cropanzano 1987). That is a valence-gated double loading, not a
global E boost.

- `aim` σ; r(neurot) +0.2, r(extra) +0.25 (positive-affect
  intensity side — Diener et al. 1985).
- Loadings (affective records only — |valence| ≥ 0.3 gate):
  `w_emo_pos AND w_emo_neg both ×(1 + aim_emo_gain·aim)` (0.10 —
  valence-symmetric, unlike every other emotional dial);
  `link_p ×(1 + aim_link_gain·aim)` (0.05 — the elaborative-ops
  finding); stored `arousal` tag `+= 0.05·aim` (amplitude, not
  duration — arousal_affect_decay unchanged, so high-AIM records
  are born hotter but cool on schedule).
- Explicit nulls: `aim → E` on neutral records = 0 (Larsen 1987 —
  the gate is the finding); `aim → beta_*` = 0; `aim → decay of
  affect tags` = 0 — intensity ≠ persistence.

## 26. `hand_mix` — a small retrieval-side axis (the weird one)

Inconsistent-handers show a robust episodic-retrieval advantage —
free recall, source memory, paired associates — hypothesized to
reflect greater corpus-callosum-mediated interhemispheric
interaction (Propper, Christman & Phaneuf 2005; Lyle, McCabe &
Roediger 2008: advantage ONLY on hemispheric-interaction tasks —
paired associates + source — null on face recognition and digit
span; Prichard, Propper & Christman 2013 review). The effect is
retrieval-side: inconsistent-handers show right-frontal recall
activity differences, not encoding differences (Lyle et al. 2017
fNIRS replication).

- `hand_mix` σ (0 = strongly consistent handed, +σ = mixed);
  deliberately uncorrelated with everything except a cosmetic
  r(sex) ≈ −0.1.
- Loadings: `theta −= handmix_ret_gain·hand_mix` (0.015) on
  episodic recall only; `beta_source −= 0.05·hand_mix` (source
  memory is the second hemispheric-interaction task). Explicit
  nulls (Lyle 2008 task pattern): `hand_mix → familiar_thresh` = 0;
  `hand_mix → wmc` = 0; `hand_mix → encoding params` = 0.
- This is the cheapest trait we ship: small, one-sided,
  retrieval-only. It exists because real individual-differences
  research includes exactly this kind of weird, reliable,
  theoretically-loaded effect — and it gives world-builder a
  "lefty" flavor dial with actual phenomenology (they remember
  conversations slightly better and misattribute them slightly
  less).

## 27. `name_fan` — the store has a load factor (emergent, not a trait)

Not a trait — a missing mechanic Part III noticed. PersonModel
name retrieval should degrade with *directory size*: the fan effect
(§5.4, `fan_k`) already applies to records but the §5.10 cascade's
tier-3 name roll is fan-free. Real name retrieval is a
one-to-one mapping task over an unbounded store — and it is the
commonest adult memory complaint. Fix: tier-3 roll pays
`name_fan_k·ln(1 + nPersons)` (0.03) where nPersons = count of
PersonModels with familiarity ≥ familiar_thresh. Consequences are
the phenomenology: the hermit with 9 models names everyone; the
bartender with 400 models is a permanent "hey… you!" generator —
same trait vector, different store load. (Modeling hypothesis —
the fan literature is item-level; the person-store extension is
ours. Magnitude tuned so 10→200 persons costs ≈0.16 on the roll.)

## 28. Substance II — cannabis is not a smaller alcohol

Part II gave `context.intox` an alcohol calibration (anterograde
loss, fragmentary blackout ≥0.8). Cannabis needs the same slot with
a DIFFERENT distortion signature: THC produces a smaller anterograde
encoding cost but an acute *false-memory* cost — higher DRM false
recognition (a liberal "yes" bias strengthening as association
weakens) AND higher misinformation susceptibility in VR eyewitness
and perpetrator paradigms, all effects restricted to the acute
intoxication window and absent at 1-week sober retrieval (Kloft et
al. 2020, PNAS, n=64, double-blind RCT). Encoding AND retrieval
under influence both mattered; residual next-day effects were not
detected.

- `context.intox` gains optional `kind` (`"alcohol"` default |
  `"cannabis"`). Cannabis: `E *= (1 − intox·0.4·(1 −
  intox_encode_mult))` — shallower anterograde slope than alcohol
  (the blackout route is mostly absent; chronic heavy use is a
  separate debated literature — we don't model it); BUT during the
  window `misinfo_suscept += cann_misinfo_gain·intox` (0.20) and
  `lure_accept += cann_lure_gain·intox` (0.15), both gated
  acute-phase only — sober-cued retrieval of intox-encoded records
  inherits the encoding deficit, never the susceptibility
  (Kloft's 1-week null: the bias was in the intoxicated mind, not
  the stored trace). `intox_state_dep` applies as for alcohol
  (same mechanism).
- Modeling note: this makes a stoned witness *say yes more*, not
  *remember worse in storage* — the record is thin but the
  distortion is in the acquisition of new claims during the window.

## 29. Reproductive-hormone axes — one overlay, one gate, one refusal

- **Menopause transition (meno state, 0..1).** The honest finding
  is a *transient learning-curve flattening*, not a decline: SWAN
  (Greendale et al. 2009, n=2362, 4y longitudinal) — premenopausal
  and postmenopausal women improved with practice; perimenopausal
  women did not (no practice gain), then rebounded to premenopausal
  levels post-transition. Penn Ovarian Aging (Epperson et al. 2013,
  n=403, 14y): delayed verbal recall declined early-transition,
  immediate recall late-transition, age-adjusted. Model: `meno`
  state overlay for profiles aged ~45–55 — during the window,
  `s_gain_recall/s_gain_rehear ×(1 − meno_learn_pen·meno)` (0.15 —
  the *practice* gain, not the trace) and `enc_base ×(1 −
  0.08·meno)` on verbal material; overlay EXPIRES (rebound is the
  phenomenon — P304). Subjective complaints exceed the objective
  effect → `complaint_k` may take +0.1·meno (consistent with §13's
  complaint/accuracy decoupling — Jonker 2000).
- **Pregnancy (preg state, third-trimester gate).** Davies et al.
  2018 meta (20 studies, 709 pregnant/521 controls): overall
  cognitive SMD ≈ 0.52, memory SMD 1.47 cross-sectional in
  trimester 3 (large CI), longitudinal memory decline SMD ≈ 0.33
  developing across trimesters 1→2. Real but modest and
  heavily confounded by sleep/affect — model as
  `preg ∈ {0,1}` with `E ×preg_trim3_mult` (0.9) gated to
  trimester 3 + `iiv_sigma += 0.02`; optional, bible-triggered.
- **Menstrual cycle — deliberate null.** Posttraumatic-film and
  emotional-memory cycle findings exist (Andreano, Ertman, Cahill
  tradition) but are small, stimulus-specific, and have not
  replicated cleanly; the field is DEBATED with no stable
  direction. We implement NO cycle state — a documented refusal,
  not an oversight. If the literature consolidates, the `meno`
  overlay machinery is the insertion point.

## 30. Extended trait vector and R additions (Part III)

```json
IndivTraits += {
  "face_ability": 0.0, // §20 — separable face store; DP/SR tails
  "adhd": 0.0,         // §21 — acquisition-deficit phenotype (one-tailed)
  "asd": 0.0,          // §22 — gist-side reversal phenotype (one-tailed)
  "suggs": 0.0,        // §23 — interrogative suggestibility (Yield/Shift)
  "vigil": 0.0,        // §24 — social-threat memory bias
  "aim": 0.0,          // §25 — affect intensity, valence-symmetric
  "hand_mix": 0.0      // §26 — inconsistent-handedness retrieval edge
}
```

R additions:

```
face_ability·g_mem  +0.20  (partially separable — Wilmer 2010)
adhd·inattn         +0.50  (shared surface, different mechanism)
adhd·iiv            +0.30  (IIV is an ADHD signature — Kofler 2013)
asd·extra           −0.30
asd·neurot          +0.20  (comorbid anxiety, not mechanism)
suggs·neurot        +0.30
suggs·meta_conf     −0.30
suggs·attach_avoid  +0.15  (Drake 2010 FAA path, direction only)
suggs·asd           −0.20  (meta-analytic resistance, §22)
vigil·neurot        +0.45
vigil·social        −0.20  (loneliness composite)
aim·extra           +0.25
aim·neurot          +0.20
hand_mix·(all)      ~0     (uncorrelated by design)
```

### Loading table additions (rows beyond §17)

| trait | param | loading | tier / source |
|---|---|---|---|
| face_ability | familiarity accrual | ×(1+0.35·f)/σ | CONSENSUS (DP/SR tails) |
| face_ability | familiar_thresh | −0.03/σ | CONSENSUS dir. |
| face_ability | identity/name tiers | ×0.5 of above | HYPOTHESIS (verbal half) |
| adhd | omit_p | +0.04/σ | CONSENSUS dir. (Skodzik 2017) |
| adhd | vivid_detail (verbal fields) | ×−0.12/σ | CONSENSUS dir. |
| adhd | pm_self | ×−0.15/σ | CONSENSUS dir. (Altgassen) |
| adhd | iiv_sigma | +0.02/σ | CONSENSUS dir. (Kofler 2013) |
| adhd | interf_k (≤consol_window records) | +0.03/σ | CONSENSUS dir. (RI↑) |
| adhd | E on interest≥0.8 records | +hyperfocus_gate·adhd·0.1 | HYPOTHESIS |
| asd | phantom_p | ×−0.15/σ | CONSENSUS dir. (meta z=−2.37) |
| asd | lure_accept | −0.02/σ | CONSENSUS dir. |
| asd | misinfo_suscept (leading accounts) | ×−0.10/σ | CONSENSUS dir. |
| asd | k_verbatim | −0.08/σ | CONSENSUS dir. (verbatim strength) |
| asd | source_confuse | +0.05/σ | CONSENSUS dir. (Lind & Bowler 2009) |
| asd | specificity (self/people-cued) | ×−0.10/σ | CONSENSUS dir. (Crane & Goddard) |
| suggs | misinfo_suscept (unverifiable) | +0.06/σ | CONSENSUS dir. (GSS Yield) |
| suggs | conf loss on negativeFeedback | −0.08/σ | CONSENSUS dir. (GSS Shift) |
| vigil | w_emo_neg (socialThreat records) | ×+0.15/σ | CONSENSUS dir. |
| vigil | recall drive (threat, recall-mode) | +0.05/σ | CONSENSUS (Mitte 2008 recall-only) |
| aim | w_emo_pos & w_emo_neg (affective only) | ×+0.10/σ | CONSENSUS dir. (Larsen 1987) |
| aim | link_p (affective only) | ×+0.05/σ | CONSENSUS dir. |
| hand_mix | theta (episodic recall) | −0.015/σ | CONSENSUS dir. (Lyle 2008) |
| hand_mix | beta_source | −0.05/σ | CONSENSUS dir. |
| (state) meno | s_gain_recall/rehear | ×−0.15·meno | CONSENSUS (SWAN rebound) |
| (state) preg | E (trimester 3) | ×0.90 | CONSENSUS dir. (Davies 2018) |
| (state) intox.kind=cannabis | misinfo_suscept / lure_accept | +0.20/+0.15·intox | CONSENSUS (Kloft 2020) |

**New explicit nulls** (Part III's falsifiable edge):
- `face_ability →` every episodic param = 0 (the store dissociates).
- `adhd → beta_*/theta` = 0 — encoding deficit, intact storage.
- `asd → beta_*/E(non-social)` = 0 — texture differs, rate doesn't.
- `suggs → beta_*/E/confab_fill` = 0 — pressure channel only.
- `vigil → recognition-mode drive` = 0 (Mitte: recall-only bias).
- `vigil →` non-social records = 0 (SIP social-context gating).
- `aim →` neutral records = 0 (Larsen 1987: the gate IS the finding).
- `aim →` affect-tag decay = 0 — born hotter, cools on schedule.
- `hand_mix →` encoding params / face tiers / wmc = 0 (Lyle 2008
  task pattern — retrieval-side only).
- `menstrual cycle →` ANY param = unimplemented (§29 refusal).
- `intox.kind=cannabis →` sober-phase susceptibility = 0 (Kloft
  1-week null — acute window only).

## 31. Falsifiable probes (P298–P309; validation-design §40)

- **P298 face-store dissociation (MUST — sign-locked):** a
  face_ability=−2σ profile fails ≥70% of tier-1 familiarity rolls
  on twice-met strangers while its episodic hit-rate on the SAME
  encounters stays within ±10% of a 0σ profile. Constrains
  `fam_gain`/`fam_thresh_off`; FAILS if episodic params co-move.
- **P299 ADHD acquisition-not-storage (MUST — sign-locked):**
  adhd=+2σ encodes ~25% fewer records in a busy window; surviving
  records show normal beta_episodic and normal theta-gated recall
  at 7d. FAIL if retrieval-phase measures degrade beyond the
  encoding loss. Constrains §21 loadings.
- **P300 ASD double signature (MUST — sign-locked):** asd=+2σ
  shows LOWER phantom/lure rates AND LOWER leading-question
  adoption AND HIGHER source_confuse flips than 0σ — three signs
  at once (the meta + Lind & Bowler). FAIL if susceptibility and
  source-confusion move together.
- **P301 cannabis window (MUST — sign-locked):** hearAccount
  during intox.kind=cannabis@0.7 adopts ≥1.5× placebo; the same
  account heard next-day sober adopts at baseline; retrieval of
  cannabis-window records shows encoding thinness but no elevated
  adoption. Constrains cann_*.
- **P302 Shift not Yield (SHOULD):** negativeFeedback challenges
  flip reported fields in high-suggs profiles at ≥2× low-suggs
  while beliefStatus flips at lower rate — report changes outrun
  belief changes (GSS structure).
- **P303 vigil mode-gate (MUST — sign-locked):** vigil=+2σ recalls
  social-threat records above baseline; recognition-mode hit-rate
  on identical records is at baseline (Mitte null). Non-social
  negative records: no effect (SIP gate).
- **P304 meno rebound (SHOULD):** meno=1 overlay reduces
  rehearsal-practice S-growth ≥10% during the window and returns
  to premeno trajectory at expiry — FAIL if the deficit persists
  (the rebound is the phenomenon).
- **P305 pregnancy gate (SHOULD):** preg effect absent in
  trimesters 1–2, present (E ×0.9 + iiv bump) in trimester 3 only.
- **P306 aim gate (MUST):** aim=±2σ profiles differ on affective
  records (E, links, arousal tags) and are IDENTICAL on neutral
  records — the neutral-half null is the finding (Larsen 1987).
- **P307 hand-mix retrieval-only (OBSERVE):** hand_mix=+2σ shows a
  small episodic-recall edge and null differences on face tiers,
  wmc probes, and all encoding metrics (Lyle 2008 task pattern).
- **P308 name fan (SHOULD):** two identical profiles, 15 vs 250
  familiar PersonModels — the dense store misses tier-3 name rolls
  ≥1.5× more; tiers 1–2 affected ≤half as much.
- **P309 neurodivergence portfolio (OBSERVE — anti-Goodhart):** in
  a 500-profile cohort with realistic trait marginals (adhd/asd/
  DP at population prevalences), extreme-phenotype characters are
  distinguishable by their *pattern of nulls* (which measures stay
  normal) at least as much as by their deficits — FAIL if any
  phenotype degrades every metric globally.

## 32. What Part III still refuses to model

- Psychosis-spectrum memory phenomena (delusional memory,
  hallucination-derived records) — beyond the honest limits of
  the episodic machinery and of this doc's evidence base.
- Medication effects beyond the intox/deprivation state slots —
  benzodiazepine anterograde effects fit the `intox` slot shape if
  ever needed; stimulant effects on ADHD profiles are a treatment
  question we leave to a future pass.
- Savant/HSAM overlap with asd — the literature's co-occurrence
  claims are too unstable; §2.13's HSAM recipe stands alone.
- Any trait loading we could not anchor: handedness stayed small
  precisely because the literature, while real, is single-lab-
  weighted; face_ability got the strongest loadings because its
  tails are population-validated.

## 33. Part III honest limits

- `adhd`/`asd` are modeled as continuous phenotype intensities,
  not diagnoses — real characters get partial signatures, which is
  also closer to the spectrum literature than binary flags.
- The hyperfocus inversion is clinical-lore-grade evidence; it is
  small, gated, and flagged HYPOTHESIS. If playtests produce
  ADHD profiles that remember *interesting* things implausibly
  well, drop `hyperfocus_gate` to 0 — the consensus bundle
  survives without it.
- `vigil`'s confirmatory PersonModel loop is the softest new
  mechanism (SIP-model inference, not a measured effect size);
  keep it ≤0.2 and let P303 guard the recall gate instead.
- `name_fan` is a modeling hypothesis — plausible, cheap, and
  falsifiable (P308), but the fan literature is item-level.
- Cannabis calibration rests on one well-powered RCT (Kloft 2020);
  magnitudes (0.20/0.15) are judgment fits to "elevated acutely,
  absent at 1 week", not measured slopes.
- The meno overlay models the *population-average* transition;
  vasomotor/depression-mediated variance folds into existing
  stress/sleep states rather than dedicated params.

---
---

# Part IV — v43: the fourth axis of difference (the clinical
# phenotypes, the reporting style, the regulation tax, and the
# drugs everyone actually uses)

**Version focus:** v43 · **Date:** 2026-09-23 · **Builds on:** Parts
I–III, spec v4.1.

Part I built the trait layer, Part II added state noise and culture,
Part III added the dissociable stores and the neurodivergence
phenotypes. What is still missing is the class of individual
differences that sits between "personality" and "disease": the
depressive phenotype, the trauma phenotype, attachment style — each
with a *named, measured memory signature* in the clinical literature
that is NOT reducible to neurot/stress/vigil. Then a report-layer axis
(perspective), an encoding-side tax nobody had modeled (expressive
suppression), a counterintuitive trait (mindfulness helps recall AND
helps lures), two self-model traits, and the mundane psychoactive
states (caffeine, nicotine) that Part II/III's substance machinery was
built for but never populated. Every axis lands in the loading table
(§45) and the probe registry (§47).

---

## 34. `depr` — the dysphoria phenotype: overgeneral, not weaker

The signature is NOT forgetting — it is *specificity collapse*.
Depression is associated with **overgeneral autobiographical memory
(OGM)**: cue-word tasks return categoric summaries ("every fight with
my sister") instead of single-occasion episodes (Williams et al. 2007,
CaR-FA-X model: capture by ruminative self-focus + functional
avoidance + reduced executive control). Critically for our generator,
the deficit is **valence-asymmetric**: the Ono, Devilly & Shum 2016
meta-analysis (25 studies) found depression's OGM effect is large and
driven by *lack of specific memories especially to positive cues*,
while trauma history drives *overgeneral responses to negative cues*
— the two phenotypes have opposite valence signatures. **[CONSENSUS]**

Depression also speeds negative relative to positive recall (Lloyd &
Lishman 1975 — retrieval latency is mood-congruent), inflates memory
*complaints* beyond objective deficit (Jonker 2000 — same decoupling
as §13), and couples to dampening of positive affect (Feldman 2008 —
already a v4.0 trait).

- `depr` trait (0..1 severity, bible-set or sampled; distinct from
  neurot — neurot is the *vulnerability*, depr is the *episode-scale
  coloring*; R correlation +0.5 with neurot, not identity).
- Loadings: `specificity ×(1 − pos_spec_loss·depr)` **on
  positive-cued retrievals only** (pos_spec_loss 0.15 — the Ono
  valence split); `w_emo_pos ×(1 − 0.12·depr)` (positive events
  encode thinner); `neg_affect_decay ×(1 − 0.10·depr)` (negative
  tags linger); `intrusion_thresh −0.05·depr` restricted to
  negative-cued records (involuntary negative recall); `dampen_mult`
  effectively ×(1+0.2·depr) via the existing trait path;
  `complaint_k +0.15·depr` (self-report inflation, §13).
- **Explicit boundary:** depr does NOT lower enc_base globally and
  does NOT raise beta_* — depressed people remember plenty; they
  remember it *coarsely*. A depr profile with a global encoding
  deficit is a modeling error (P433).
- Episodicity: depression comes in episodes. `depr` is the trait
  (risk/severity); a runtime `depr_state` (0..1, world-set or
  event-driven — breakup, job loss) gates the loadings:
  `loading_eff = loading · (0.3 + 0.7·depr_state)` so a euthymic
  carrier still tilts but only the active episode shows the full
  signature. [HYPOTHESIS parameterization of the state-trait
  finding — OGM partially persists in remission (Brittlebank 1993
  trait-marker claim, DEBATED how much).]

## 35. `ptsd` — the trauma phenotype: hot and coarse at once

PTSD's memory signature is a **paradox the model must reproduce**:
involuntary, cue-triggered, sensory-rich intrusion of the trauma
record, coexisting with overgenerality of the *rest* of
autobiographical memory and effortful avoidance of the trauma cue
space (Ehlers & Clark 2000 — data-driven processing at encoding →
weakly elaborated but perceptually hot records; Brewin dual-
representation — the phenomenology is consensus, the mechanism is
DEBATED, as with `dissoc` in Part II).

Evidence spine: Moore & Zoellner 2007 (Psych Bull, 24 studies —
trauma exposure per se does NOT cause OGM; *psychopathology* does —
so `ptsd` carries the OGM loading, not a bare "trauma-history"
flag); Ono et al. 2016 (trauma → overgeneral **negative-cue**
responses; PTSD amplifies, large and roughly valence-flat within the
PTSD arm); Schönfeld & Ehlers 2007 (under suppression instruction,
PTSD participants retrieved fewer/more general memories — avoidance
is effortful suppression, and it *works* until resources fail).

- `ptsd` trait (0..1; typically pinned by bible trauma history +
  severity; R: +0.45 neurot, +0.30 vigil, +0.25 dissoc).
- The hot leg: records tagged `threat:true` (or the bible's trauma
  tag) get `intrusion_thresh − trauma_sens_intr·ptsd` (0.10) gated
  to **sensory-cue matches only** (w_sensory-weighted cueMatch —
  Ehlers & Clark: intrusions are triggered by *perceptual* matches,
  not semantic reminders); `ptsd_frag` (0.2) splits trauma records
  into more, weaker fragments at encoding (composes with Part II's
  dissoc fragmenting — dissoc is the peritraumatic *state*, ptsd is
  the chronic *condition*).
- The coarse leg: `neg_ogm` (0.12) — probability a negative-cued
  autobiographical retrieval returns a generic/categoric record
  instead of a specific episode, scaling with ptsd; the Ono valence
  split vs depr is probe-locked (P433).
- The avoidance leg: `avoid_suppress` (0.15) — theta raise on
  threat-tagged records under voluntary recall (the character does
  not go looking); involuntary intrusions bypass it (intrusion
  drive ignores theta — already the §5 architecture).

## 36. `attach_anx` / `attach_avoid` — attachment style is a memory style

The spec already *consumes* `attach_avoid` (v4.0 knot note:
`secure_damp` rides it) without ever defining it. Part IV defines
the pair; they are the two best-measured relationship-memory axes in
the literature.

- **`attach_avoid` — defensive exclusion.** Edelstein 2006 (Emotion):
  avoidance → working-memory deficits for attachment-related stimuli
  *of both valences*, zero deficit on non-attachment material —
  the deficit is **content-gated, not global**. Edelstein et al.
  2005 (PSPB, documented CSA cohort): avoidance negatively
  associated with long-term memory for severe incidents. Mikulincer
  & Orbach 1995: avoidant adults show low accessibility of negative
  affective memories. Kohn, Rholes & Schmeichel 2012 (JESP):
  the suppression is *effortful* — under self-regulatory depletion,
  avoidants' negative attachment memories become MORE accessible.
  **[CONSENSUS direction; mechanism = effortful suppression is the
  Kohn finding.]**
  - Loadings: `vivid_detail ×(1 − attach_field_loss·avoid)` (0.15)
    on records carrying an attachment-relevant tag (co-present
    attachment figure, rejection/loss/reliance theme — world tags
    `attach:true`); `theta +avoid_suppress·avoid` on negative
    attach-tagged records; **`depl_release` (0.3): under
    `context.depleted` (or high stress state), the suppression cost
    fails — theta returns toward baseline and intrusion drive rises**
    — the avoidant character's buried grief surfaces when tired.
    This is the mechanic that makes avoidance *interesting* rather
    than just absent.
- **`attach_anx` — hyperactivation.** Mikulincer & Orbach 1995:
  anxious-ambivalent adults have *easy* access to negative memories
  and cannot inhibit emotional spreading to nondominant emotions.
  Edelstein 2006: anxiety unrelated to WM capacity — the deficit is
  regulatory, not storage.
  - Loadings: `intrusion_thresh −0.06·anx` on rejection/abandonment-
    cued records; `mood_bleed ×(1+0.25·anx)` (the spreading); `link_p
    ×(1+0.10·anx)` on negative interpersonal records (denser
    grievance chains); `rumin_k` small + via neurot correlation only
    (do not double-count).
- R: `attach_anx·neurot +0.45`, `attach_avoid·neurot +0.20`,
  `attach_avoid·extra −0.25`, `attach_avoid·social −0.20`,
  `attach_anx·attach_avoid 0` (orthogonal dimensions — a person can
  be both, "fearful", but we keep them separable).

## 37. `persp_obs` — where the rememberer stands

Nigro & Neisser 1983 established the field/observer distinction and
its correlates: **older** memories and **self-aware/emotional**
events come back in observer mode; field perspective dominates
recent recall. Robinson & Swanson 1993: shifting field→observer
*decreases* experienced affect (observer is a distancing device);
perspective is switchable for recent/vivid memories, locked for old
ones. Libby & Eibach 2002: **self-discrepant** actions — "that
wasn't me" — are recalled in observer mode; perspective encodes
self-concept compatibility at retrieval time, not at encoding.
Kuyken & Moulds 2009 (123 recurrently-depressed patients): observer
memories are less vivid, older, more rehearsed, and the observer
tendency tracks negative self-evaluation, avoidance, and LOW
mindfulness. Nelis et al. 2012: dysphorics show the observer shift
preferentially for *positive* memories — the dampening style's
signature. **[CONSENSUS correlates; causal direction DEBATED.]**

- `persp_obs` trait (−1 field-locked … +1 habitual observer) shifts
  the base rate; situational drivers stack multiplicatively:
  `P(observer) = base(persp_obs) + persp_age_gain·log(1+recordAge
  /365) + 0.2·selfDiscrepant + depr·0.15·(valence>0)` — the last
  term encodes the Nelis finding (dysphoria shifts *positive*
  memories to observer; negative ones are already field-hot).
- Output: Reconstruction gains `persp:"field"|"observer"`. Observer
  emissions report `arousal −persp_affect_loss` (0.2 — the Robinson
  & Swanson affect drop), fewer sensory-field details, more
  evaluative/self-visible content ("I can see myself standing
  there"). Observer is a *report-layer* transform — the stored
  fields don't change, the narration does; repeated observer recall
  slowly drifts verbatim self-visible detail in (drift_p, existing).
- Persuasion/checking hook: `context.persp:"field"` on guided
  recall (the cognitive-interview reinstatement path §5.30) pulls
  toward field mode — that's what the instruction is FOR.

## 38. `supp` — the regulation tax at encoding

Richards & Gross 2000 (JPSP, three studies): **expressive
suppression — keeping a poker face — impairs memory for
information presented while suppressing**, including social
information (names, facts about interaction partners); the
individual-difference arm found habitual suppressors have poorer
objective memory for social material. **Reappraisal has no memory
cost** — the tax is specific to response-focused regulation
(suppressing the expression after emotion is live), because it
consumes self-monitoring capacity during encoding; antecedent-
focused regulation (reconstrual) completes before the demand.
Richards, Butler & Gross 2003: suppression during an upsetting
shared film degraded conversation partners' responsiveness —
the social cost of the memory cost. **[CONSENSUS; effect size
moderate.]**

- `supp` trait (habitual expressive suppression, ERQ-style; R:
  +0.3 attach_avoid, +0.2 neurot, −0.2 extra). `reap` trait kept as
  an explicit **null row** — reappraisal is the no-cost arm and
  must stay at zero loading on encoding (falsifiability: P439's
  second half).
- Mechanic: `context.suppressing:true` (set by the dialogue/
  emotion layer when the character is masking) →
  `E_people/E_conversation-fields ×(1 − supp_enc_cost·supp)`
  (supp_enc_cost 0.12); non-social fields unaffected — Richards &
  Gross's social-information specificity. The character who kept a
  straight face through the meeting *doesn't remember what the
  tenant said* — a playable, legible consequence.
- Suppression draws on the same `depleted` resource that releases
  §36's avoidant suppression — one self-regulation budget, two
  memory consequences (Kohn 2012 supplies the coupling).

## 39. `pspeed` — processing speed, the age mediator

Salthouse's processing-speed theory: a large share of adult-age
variance in memory measures is mediated by speed (Salthouse 1996 —
~shared variance between speed and memory rises steeply with age;
CONSENSUS that mediation exists, DEBATED whether speed is causal).
We need it as a trait because it gives the model a *latency* axis
that is not identical to g_mem: slow-but-accurate and fast-but-
shallow are both real phenotypes.

- `pspeed` N(0,1); R: +0.5 g_mem, +0.4 wmc, +0.3 iiv-inverse
  (slower = more variable — Woodrow/Hultsch tradition via Part II's
  IIV literature), +0.2 fitness.
- Loadings: `search_cost_mult` (new param, 1.0 default) — scales
  all `lat_*`/searchCost outputs `×(1 − 0.15·pspeed)`; `ret_noise
  ×(1 − 0.10·pspeed)`; `omit_p` under multi-event windows small −;
  **NO loading on beta_*, theta, or any accuracy parameter** —
  speed buys time, not truth (explicit null; Salthouse is a
  mediation claim, and the residual accuracy variance is g_mem's).
- Age interaction: age curve applies to pspeed itself via the
  existing knot machinery — add `pspeed` to the decline-side
  evaluation at `age_eff` with slope ~−0.04/decade past 50
  (Salthouse cross-sectional slopes), which then propagates to
  latency — older characters don't just recall less, they recall
  *slower*, and the two covary the way they do in humans.

## 40. `mindful` — the counterintuitive trait

Mindfulness is sold as a memory virtue; the data says it is a
specificity virtue and a **source-monitoring vice**:

- Williams, Teasdale, Segal & Soulsby 2000 (J Abnorm Psych, RCT):
  MBCT reduced overgeneral memory in formerly depressed patients;
  Heeren, Van Broeck & Philippot 2009 (BRT): mindfulness training
  increased autobiographical specificity, mediated by improved
  cognitive inhibition/flexibility. **[CONSENSUS direction —
  specificity up.]**
- Wilson, Mickes, Stolarz-Fantino, Evrard & Fantino 2015 (Psych
  Sci, three experiments): a 15-min mindfulness induction **nearly
  doubled** DRM false recall (39% vs 20% critical-lure recall) and
  reduced reality-monitoring accuracy — nonjudgmental acceptance of
  internally generated content makes imagined and perceived traces
  harder to tell apart. Baranski & Was 2017-adjacent replications
  and Rosenstreich & Margalit 2015 (5-week practice: true
  recognition up, *provoked* false recognition up, spontaneous
  false unchanged — the bias is in endorsing elicited lures).
  **[CONSENSUS that acute induction raises DRM/RM error; the trait
  projection is our HYPOTHESIS.]**

- `mindful` trait N(0,1); R: −0.3 neurot, −0.3 depr, −0.2
  persp_obs (Kuyken & Moulds).
- Loadings (sign-locked pair, the falsifiable heart of Part IV):
  `specificity +0.06·mindful`; `lure_accept +mind_lure·mindful`
  (0.10); `source_confuse_flip +mind_rm_loss·mindful` (0.10);
  `rumin_k ×(1−0.15·mindful)`. The trait that remembers more
  precisely AND confuses imagination with perception more — a
  character who meditates should be *better* at narrating a real
  evening and *easier* to plant a detail in. P440.

## 41. `scc` — self-concept clarity, the self-model's resolution

Self-concept clarity (Campbell et al. 1996 SCC scale — trait
stability/confidence of self-knowledge) moderates how hard the
present self pulls on the past. The v3.4 narrative-self machinery
(§6.17 consistency pull, §6.34 mnemic anchors, §4.x tdist_self)
implicitly assumed a uniform self-model; scc parameterizes it:

- Low scc: the present self is a weak attractor AND a malleable one
  — consistency pull (§6.17) should be *stronger* per update (the
  past has less to push back with: `consist_pull ×(1 +
  scc_consist_gain·(−scc))`, gain 0.4) and self-relevant feedback
  lands harder (misinfo on self-evaluative records ×(1+0.10·(−scc))
  — DEBATED extension of the feedback literature).
- High scc: stable self-model → weaker consistency pull, and
  *subjective distance* (tdist_self) resolves cleanly — old selves
  stay old rather than being rewritten or fused.
- R: −0.4 neurot, −0.3 depr, +0.3 consc, −0.2 suggs (the
  suggestible and the self-unclear overlap but are not the same —
  keep the correlation small, P444 discriminates the channels).

## 42. Substance III — the everyday pharmacopeia

Part II gave `context.intox` alcohol; Part III gave it cannabis. The
two substances RW characters actually consume daily still have no
slots.

- **Caffeine — a consolidation drug, not an encoding drug.**
  Borota et al. 2014 (Nat Neurosci, n=160, double-blind,
  caffeine-naive): 200 mg caffeine *after* encoding improved
  lure discrimination (LDI) at 24h on an inverted-U dose curve —
  100mg null, 200mg effective; **hit rate and basic d′ unchanged**
  — the gain is pattern-separation during consolidation, not
  recognition strength; pre-encoding administration literature is
  mixed-to-null (Smith 2002 review — acute caffeine effects are
  mostly alertness/vigilance, strongest on low-arousal boring
  tasks).
  - `context.caff` (0..1 ≈ dose/200mg, capped 1.5): if present
    during `consol_window` → next sleep tick applies
    `caff_consol_gain` (0.08) to that window's records'
    lure-discrimination/pattern-separation ONLY (proxied: next-day
    discriminate-mode and lure-rejection rolls on those records).
    At encoding, `E += caff_enc_gain·caff·(1−arousal)` (0.05 —
    alertness-mediated, vanishes on arousing events). Withdrawal:
    `smoker`-style habitual flag `caff_dep` → morning-without-dose
    `E ×(1−caff_dep_cost)` (0.05) — small, DEBATED.
- **Nicotine — the deprivation state.** Jansari et al. (JEF virtual
  executive battery): nicotine gum improved time- AND event-based
  prospective memory in minimally-deprived smokers, not never-
  smokers — the "enhancement" is withdrawal relief. Heffernan,
  O'Neill & Moss 2010/2011: smokers show **objective** PM deficits
  on real-world tasks while self-report PM is **unchanged** —
  a metacognitive blind spot (they don't know what they've lost).
  - `smoker` trait (binary/0..1): baseline `pm_self ×(1−
    smoker_pm_loss)` (0.10) — objective only, `complaint_k` does
    NOT rise (P442's blind-spot lock); `context.nic_dep` (0..1
    abstinence): `pm_self ×(1−nic_dep_pm·dep)` (0.15) and small
    `wmc`-task cost; dosing resets the deprivation, not a bonus
    past baseline (explicit null: no supernormal nicotine gain —
    Jansari's improvement is restoration).
- Placement note: these stay STATE slots because consumption is
  schedulable by the world; `smoker`/`caff_dep` are the trait-side
  vulnerability flags. No tolerance curves beyond the deprivation
  relief — out of evidence.

## 43. Extended trait vector and R additions (Part IV)

```json
IndivTraits += {
  "depr":        0.0,  // §34 dysphoria severity (episodic; gates via depr_state)
  "ptsd":        0.0,  // §35 posttraumatic phenotype 0..1 (usually pinned)
  "attach_anx":  0.0,  // §36 hyperactivating attachment
  "attach_avoid":0.0,  // §36 deactivating attachment (was referenced in v4.0 knots; defined here)
  "persp_obs":   0.0,  // §37 observer-perspective base rate
  "supp":        0.0,  // §38 habitual expressive suppression
  "reap":        0.0,  // §38 reappraisal — NULL-LOADING by design
  "pspeed":      0.0,  // §39 processing speed (latency axis)
  "mindful":     0.0,  // §40 dispositional mindfulness
  "scc":         0.0,  // §41 self-concept clarity
  "smoker":      0.0   // §42 nicotine dependence flag 0..1
}
```

R additions (on top of Parts I–III):

```
depr·neurot        +0.50  (vulnerability ≠ episode — correlated, distinct)
depr·scc           −0.30
depr·mindful       −0.30
depr·persp_obs     +0.20  (observer habit is a depressive signature — Kuyken & Moulds)
ptsd·neurot        +0.45
ptsd·vigil         +0.30
ptsd·dissoc        +0.25
attach_anx·neurot  +0.45
attach_avoid·extra −0.25
attach_avoid·supp  +0.30
attach_avoid·neurot +0.20
attach_anx·attach_avoid 0.0   (orthogonal by design)
persp_obs·mindful  −0.20
supp·extra         −0.20
supp·reap          −0.30    (regulation styles anti-correlate — ERQ)
pspeed·g_mem       +0.50
pspeed·wmc         +0.40
pspeed·fitness     +0.20
mindful·neurot     −0.30
scc·neurot         −0.40
scc·consc          +0.30
scc·suggs          −0.20
smoker·consc       −0.20    (population correlation, small)
reap·(accuracy params)  all 0 — explicit null trait
```

### Loading table additions (rows beyond §30)

| trait | param | loading | tier / source |
|---|---|---|---|
| depr | specificity (positive-cued only) | ×−pos_spec_loss·d (0.15) | CONSENSUS (Ono 2016 valence split) |
| depr | w_emo_pos | ×−0.12·d | CONSENSUS dir. |
| depr | neg_affect_decay | ×−0.10·d | CONSENSUS dir. |
| depr | intrusion_thresh (neg-cued) | −0.05·d | CONSENSUS dir. |
| depr | complaint_k | +0.15·d | CONSENSUS dir. (Jonker 2000) |
| depr | dampen_mult eff | ×+0.2·d | CONSENSUS dir. (Feldman 2008) |
| ptsd | intrusion_thresh (sensory-cued threat) | −trauma_sens_intr·p (0.10) | CONSENSUS (Ehlers & Clark gate) |
| ptsd | trauma fragment count | +frag_p·p (0.2) | CONSENSUS phenomenology / DEBATED mechanism |
| ptsd | OGM on negative-cued recall | +neg_ogm·p (0.12) | CONSENSUS (Ono 2016) |
| ptsd | theta (voluntary, threat-tagged) | +avoid_suppress·p (0.15) | CONSENSUS dir. (Schönfeld & Ehlers 2007) |
| attach_avoid | vivid_detail (attach-tagged, both valences) | ×−attach_field_loss·a (0.15) | CONSENSUS (Edelstein 2006) |
| attach_avoid | theta (negative attach-tagged) | +avoid_suppress·a | CONSENSUS dir. (Mikulincer & Orbach 1995) |
| attach_avoid | suppression under depletion | −depl_release·a (0.3) | CONSENSUS dir. (Kohn 2012) |
| attach_anx | intrusion_thresh (rejection-cued) | −0.06·a | CONSENSUS dir. |
| attach_anx | mood_bleed | ×+0.25·a | CONSENSUS (Mikulincer & Orbach spreading) |
| attach_anx | link_p (negative interpersonal) | ×+0.10·a | HYPOTHESIS |
| persp_obs | P(observer) base | +0.15/σ | CONSENSUS dir. (Nigro & Neisser) |
| supp | E on social fields while suppressing | ×−supp_enc_cost·s (0.12) | CONSENSUS (Richards & Gross 2000) |
| pspeed | search_cost_mult | ×−0.15/σ | CONSENSUS dir. (Salthouse 1996) |
| pspeed | ret_noise | ×−0.10/σ | CONSENSUS dir. |
| mindful | specificity | +0.06/σ | CONSENSUS dir. (Heeren 2009) |
| mindful | lure_accept | +mind_lure·m (0.10) | CONSENSUS (Wilson 2015) |
| mindful | source_confuse_flip | +mind_rm_loss·m (0.10) | CONSENSUS dir. (Wilson Exp 3) |
| mindful | rumin_k | ×−0.15/σ | CONSENSUS dir. |
| scc | consist_pull (§6.17) | ×(1 + scc_consist_gain·(−scc)) 0.4 | HYPOTHESIS (Campbell 1996 construct) |
| scc | misinfo on self-evaluative records | ×(1 + 0.10·(−scc)) | DEBATED |
| smoker | pm_self baseline | ×−smoker_pm_loss (0.10) | CONSENSUS dir. (Heffernan 2010) |
| (state) nic_dep | pm_self | ×−nic_dep_pm·dep (0.15) | CONSENSUS dir. (Jansari) |
| (state) caff in consol_window | next-day lure discrimination | +caff_consol_gain (0.08) | CONSENSUS (Borota 2014) |
| (state) caff at encoding | E, low-arousal events only | +0.05·(1−arousal) | CONSENSUS dir. (Smith 2002) |
| (state) depleted | suppressor theta/avoid_suppress | released ×depl_release | CONSENSUS dir. (Kohn 2012) |

## 44. New explicit nulls (Part IV's falsifiable edge)

- `depr →` enc_base, beta_*, theta = 0 — OGM is specificity, not
  storage. (P433)
- `depr →` negative-cue specificity loss ≈ 0 — the deficit is
  positive-cue-weighted (Ono 2016); ptsd carries the negative arm.
- `ptsd →` non-threat records' intrusion_thresh = 0 — the gate is
  the phenomenon (P434).
- `ptsd →` semantic/procedural = 0.
- `attach_avoid →` non-attach-tagged material = 0 (Edelstein's
  WM null — content-gated or nothing).
- `attach_anx →` WM/encoding params = 0 (Edelstein 2006 — anxiety
  is regulatory, not storage).
- `reap →` every encoding param = 0 — reappraisal is the no-cost
  arm; a loading here falsifies the Richards & Gross structure.
- `pspeed →` accuracy/decay/threshold params = 0 — latency only.
- `mindful →` any reduction in lure/false-recognition = 0 — the
  sign is +, locked (Wilson 2015).
- `nicotine →` above-baseline gain = 0 — restoration, never
  enhancement (Jansari: no never-smoker PM benefit).
- `caff →` hit rate / basic d′ = 0 — Borota's gain is
  discrimination-specific.
- `persp_obs →` stored field values = 0 — report-layer transform;
  drift via existing operators only.
- `scc →` non-self-relevant records = 0 — self-model scope only.

## 45. Sampling note: the clinical phenotypes are tails, not noise

`depr`, `ptsd`, `attach_*`, `smoker` should NOT be sampled as free
N(0,1) for most of the cast — they are prevalence-weighted
(population base rates: lifetime MDD ~15–20%, PTSD ~6–8%,
smoking ~12% US; marked HYPOTHESIS — the bible decides, sampling
fills ambient NPCs). For the 8 mains the world-builder pins them
from narrative; the trait machinery then propagates the memory
consequences automatically — a bible that says "she never talks
about the divorce and it shows at 2am" gets depr/attach_avoid and
the depletion-release mechanic for free.

## 46. Cross-version interactions (audit)

- `depr` × §6.8 moodcong_lure: depr raises BOTH negative lure
  selection (via traitValence, v4.1) and positive-cue OGM (§34) —
  the same character is vaguer about good days and falsely surer
  about bad ones. Do not merge the channels; P430/P433 test them
  separately.
- `ptsd` × `dissoc` (Part II): dissoc is the encoding-state trait
  (peritraumatic), ptsd the chronic condition — they correlate and
  compose (fragmented birth + hot sensory intrusion), never merge.
- `supp` × `depleted` × `attach_avoid`: one self-regulation budget;
  world sets `depleted` on sustained suppression/high-control days
  (ego-depletion literature is DEBATED on the resource model —
  Hagger replication issues — we model the *phenomenon* the Kohn
  study measured, flagged accordingly).
- `mindful` × `emo_gran` (v4.0): both raise report precision; the
  lure penalty is mindful's alone (granularity doesn't touch source
  monitoring — keep separable).
- `pspeed` × `iiv` (Part II): correlated, distinct — IIV is
  variance, pspeed is mean latency; a slow character can be
  consistent (low iiv, low pspeed) and a fast one erratic.
- `persp_obs` × `vivid` (Part I): low-vivid characters still emit
  observer reconstructions — but sparser; the axes are orthogonal
  (perspective is where you stand, vividness is how much renders).

## 47. New falsifiable probes (P433–P444; validation-design §69)

- **P433 OGM valence split (MUST — sign-locked):** matched
  depr=+0.8 vs ptsd=+0.8 profiles: depr shows specificity deficit
  concentrated on positive-cued recalls, ptsd on negative-cued
  (generic responses); depr shows ~no storage deficit (hit-rate on
  neutral material within jitter of baseline). FAIL if the two
  phenotypes share a signature or if depr lowers hit-rate.
- **P434 sensory-gated intrusion (MUST — sign-locked):**
  ptsd=+0.8 threat records intrude on sensory-cue matches
  (w_sensory-driven cueMatch) at ≥1.5× baseline rate; the same
  records under semantic/topic cues at baseline; non-threat records
  unaffected at any cue type.
- **P435 avoidance content-gate (MUST — sign-locked):**
  attach_avoid=+1.5 shows thinner vivid_detail and higher theta on
  attach-tagged records (both valences at encoding; negative at
  retrieval) while non-attach records are within jitter — a global
  deficit fails the gate (Edelstein 2006).
- **P436 depletion release (MUST — sign-locked):** the same
  avoidant profile under context.depleted shows the suppressed
  negative attach records MORE accessible (theta falls back);
  non-avoidant profiles show no release. FAIL if depletion never
  unburies, or if it unburies for everyone.
- **P437 observer transform (SHOULD):** observer-flagged
  reconstructions report lower arousal (~persp_affect_loss) and
  fewer sensory fields than field-mode emissions of the same
  record; stored fields unchanged (report-layer); record age and
  self-discrepancy raise observer probability (Libby & Eibach).
- **P438 dysphoric positive-observer (SHOULD — sign-locked):**
  depr profiles emit observer mode preferentially on POSITIVE
  records vs negative (Nelis 2012 direction — opposite of the
  naive "distance from pain" prediction, which is attach_avoid's
  job via §36 instead).
- **P439 suppression tax + reappraisal null (MUST — two halves):**
  suppressing:true during a social scene → E on people/
  conversation fields reduced ~supp_enc_cost, non-social fields
  intact; reappraising context → NO encoding difference
  (explicit-null half — FAIL if reappraisal costs anything).
- **P440 mindfulness double sign (MUST — both signs at once):**
  mindful=+1.5 shows HIGHER positive-cued specificity AND HIGHER
  lure_accept/source-flip rate vs −1.5 — FAIL if only one sign
  appears (Wilson 2015 is the counterintuitive half; a "memory
  virtue" trait is wrong).
- **P441 caffeine discrimination-only (MUST — sign-locked):**
  caff during consol_window → next-day lure-discrimination
  improved on that window's records; hit-rate and d′ unchanged
  (Borota null half); pre-encoding caffeine helps only
  low-arousal encodes.
- **P442 smoker blind spot (MUST):** smoker profiles show reduced
  pm_self objective hit-rate with complaint_k unchanged (Heffernan
  — they don't report the deficit); nic_dep deepens it; dosing
  restores toward baseline, never above (Jansari null).
- **P443 pspeed latency-only (SHOULD):** pspeed ±2σ profiles
  differ on searchCost/latency outputs ~15% while hit-rate at
  matched cue strength differs within jitter (Salthouse: speed
  mediates measures, not stored truth).
- **P444 scc self-scope (SHOULD):** low-scc profiles show stronger
  §6.17 consistency pull and higher feedback adoption on
  self-evaluative records, identical behavior on non-self records
  — scope-locked.

## 48. Part IV honest limits

- The clinical axes are modeled as *dimensional severities*, which
  matches the spectrum literature better than binary diagnoses but
  flattens real comorbidity structure; R handles the common pairs
  (depr×ptsd via shared neurot, depr×attach) but a character who
  is BOTH high-depr and high-ptsd is a judgment region — Ono's
  "PTSD amplified" cell suggests interaction, not additivity; we
  choose additivity + clamp and flag it (P433 bounds the sum).
- `depr_state` gating (episodes) is a convenience model — real
  episode dynamics have onset/recovery latencies we don't
  simulate; bible/world may drive depr_state on event triggers
  (loss, isolation) at whatever grain they like.
- The mindfulness trait extrapolates an *acute induction* finding
  (Wilson) to a disposition — the biggest inferential leap in this
  part; P440 is designed to catch over-calibration, and
  mind_lure/mind_rm_loss should be halved rather than zeroed if it
  fires.
- Self-concept clarity's memory loadings are construct-level
  inferences (Campbell's scale was validated on self-report
  consistency, not episodic measures) — weakest evidence tier in
  Part IV; keep scc_consist_gain ≤0.4.
- Nicotine/cannabis/caffeine model *legal adult use* magnitudes;
  polysubstance interactions and adolescent exposure are
  unmodeled.
- Observer perspective's `persp` emission is a report-layer flag;
  whether observer recall *causes* later detail loss (the
  reconstructive-feedback hypothesis in Robinson & Swanson) is
  DEBATED — we let ordinary drift_p do the damage and add no
  dedicated observer-decay operator.

---
---

# Part V — v55: the fifth axis of difference (the lived-in mind:
# ego bookkeeping, flat affect, split attention, hard beginnings,
# irregular clocks, pain, load, and the nulls that keep us honest)

**Version focus:** v55 · **Date:** 2026-09-23 · **Builds on:** Parts
I–IV, spec v5.2, profiles §37.

Parts I–IV built the ability axes (g_mem, wmc), the clinical phenotypes
(depr, ptsd, attach), the metacognitive layer (meta_conf, checker,
complaint), and the substance states. What is left is the *texture of
an ordinary week*: the person who always did more than their share,
the one who can't say what they felt, the one whose attention is
permanently three-way split, the night-shift worker whose clock never
settles, the one living with a bad back, the one drowning in a busy
day. Part V adds nine axes — seven traits, two states, one mandated
null — and keeps the Part III/IV discipline: every axis carries its
explicit-null scope so it stays falsifiable.

New traits: `self_srv`, `alexith`, `media_m`, `early_adv`, `circ_irr`,
`chron_pain`, `music`, `rosy`. New states: `task_load`, `pain_state`.
Documented null: `birth_order`. New params: §60 loading table →
spec §7 + §§6.85–6.88 mechanics.

---

## 49. `self_srv` — the ego's ledger never balances

Ross & Sicoly 1979 (JPSP 37:322 — verified canonical): in married
couples, roommates, and project teams, each member's recalled
contribution exceeds their partner's account of them — self-and-other
responsibility estimates sum **over 100%**; the bias is asymmetric
recall (own acts more available), not just motivational claiming.
Greenwald 1980's "totalitarian ego" framed the general architecture;
Schacter's misattribution work and Dunning's self-serving recall
reviews replicate the direction. The phenomenon is *encoding-and-
retrieval*, not merely reporting: people encode their own acts with
more self-reference machinery and retrieve others' contributions with
fewer cues.

Model — two params, one trait:
- `sself_enc` (0–0.3): at encoding of shared/multi-actor events,
  fields tagged `actor:self` get E ×(1 + sself_enc·self_srv);
  fields `actor:other` get E ×(1 − sself_other_loss·self_srv).
- `sself_other_loss` (0–0.4): the other-side symmetric loss — fewer
  peripheral fields written on co-actors' contributions.
- Emission-side: `w_self` cue-matching already favors self-tagged
  records; no change. The asymmetry is born at the record level —
  a joint chore later recalled as "I did most of it" because the
  self-half is genuinely denser, not because the character lies.
  Summing both partners' self-reports across a shared event yields
  >100% — the Ross & Sicoly signature, emergent (P566).

Loadings: `self_srv` correlates with `meta_conf` (+0.25, confident
people keep flattering ledgers — HYPOTHESIS) and, negatively, with
`distrust` (−0.30 — the self-doubting underclaim; R§4 additions).
Explicit nulls: `self_srv` → any accuracy param on *solo* events = 0
(no co-actor, no ledger); → misinfo/distortion params = 0 — the ego
ledger is a bookkeeping asymmetry, not a suggestibility axis.

## 50. `alexith` — the feeling that was never written, and the fluent
## answer anyway

Systematic review (PMC6497026, 2019 — verified): explicit memory for
emotional material is consistently reduced in high-alexithymia
individuals while neutral memory is intact; Vermeulen & Luminet 2009
(PAID 47:305 — verified: overall deficit concentrated on emotion
words); Luminet et al. 2005 (JRP 40:713 — verified: the deficit is a
levels-of-processing one — shallow encoding of affect, not a retrieval
block); Muir, Madill & Brown 2016 (Cognition & Emotion 31:1392 —
verified: high alexithymia shows *reduced fading-affect bias* —
negative affect fades slower, i.e. `neg_affect_decay` toward 1);
Camia, Desmedt & Luminet 2020 (verified): narrative elaboration of
negative events specifically impoverished — the memory exists but the
*emotional telling* is thin.

This is NOT the same axis as `emo_gran` (v4.0 granularity) or
`mindful` (Part IV): granularity is reporting precision; alexithymia
is an *encoding-channel* deficit for affect plus a confabulation
exposure. Model:
- `alex_flat` (0–0.7): emoTag richness / affective field-write at
  encoding ×(1 − alex_flat·alexith); the w_emo arousal boost on E
  reduced by the same fraction — emotional events encode closer to
  neutral for this character.
- `alex_confab` (0–0.9): when a probe demands affect the record
  lacks ("how did you feel?"), the answer mints via the §6.79
  reason-mint machinery at `alex_confab` probability — fluent,
  confident, *confabulated* feeling. The high-alexith character does
  not go silent; they say something plausible and believe it.
- `neg_affect_decay` toward 1 (×(1 − 0.15·alexith)): reduced FAB —
  the negative residue lingers precisely because it was never
  elaborated (Muir 2016 direction).
- Explicit nulls: `alexith` → neutral-material encoding/retrieval =
  0; → non-affective specificity = 0 (Camia 2020's specificity null —
  the deficit is emotional processing, not episode access).

The signature (P567): a character who cannot narrate the feeling but
confidently supplies one anyway — thinner stored affect AND fluent
invented affect, on the same record.

## 51. `media_m` — attention paid in three currencies

Ophir, Nass & Wagner 2009 (PNAS 106:15583 — verified canonical):
heavy media multitaskers are *worse* at filtering irrelevant
representations — more susceptible to interference, worse
task-switching — not better at juggling; Cain & Mitroff 2011
replicated the distractor-filtering deficit; Uncapher et al. 2016
(Psychon Bull Rev — verified): HMMs show more mind-wandering and
worse episodic-memory task performance; the literature direction is
attentional-filter failure, NOT storage failure (Uncapher & Wagner
2018 review — the memory-cost pathway runs through encoding
attention).

Model (trait, attention-side only):
- `inattn`-adjacent but distinct: `inattn` is endogenous
  mind-wandering (Part II); `media_m` is *exogenous* split-attention
  habit — they correlate (+0.30, HYPOTHESIS) but are not merged: a
  character can be a deliberate single-tasker who still daydreams.
- Loadings: `plist_suppress` ×(1 + 0.30·media_m) — the filter leaks
  exactly where the literature says it leaks (competing
  representations intrude); `source_confuse` ×(1 + 0.20·media_m);
  `omit_p` +0.03·media_m on routine events (encoding attention
  diverted); `search_breadth` +1·media_m — broader, shallower search,
  the "exploration not exploitation" signature.
- Explicit nulls: `media_m` → beta_* decay rates = 0; → enc_base on
  high-salience attended events = 0 — the cost is in *what gets
  filtered*, not in storage. A HMM character who attends fully
  encodes normally (P568's null half).

## 52. `early_adv` — the childhood that set the baseline

Evans & Schamberg 2009 (PNAS 106:6545 — verified): childhood
poverty duration predicts adult working-memory capacity, mediated by
allostatic load — the deficit is in *control*, not storage, and
survives income mobility. Lupien et al. 2009 (verified): maternal
SES/care environment → hippocampal volume differences in adulthood;
harsh-family-environment work (Evans et al. 2007) shows
stress-physiology mediation. Early adversity also predicts adult OGM
phenotypes through the depr/dissoc machinery (Parts III–IV) — the
trait should feed those channels, not duplicate them.

Model — a *set-the-baseline* trait, not a dynamic one:
- `early_adv` ∈ [0,2] (one-sided: adversity shifts, advantage is
  the reference — asymmetry matches the literature's threshold-
  shaped findings, HYPOTHESIS on the shape).
- Loadings: `wmc`-side params only — `misinfo_suscept`
  ×(1 + 0.08·early_adv), `source_confuse` ×(1 + 0.12·early_adv),
  `plist_suppress` ×(1 + 0.15·early_adv); `stress_retrieve_loss`
  ×(1 + 0.15·early_adv); `stress` trait drawn +0.4·early_adv
  correlated (allostatic mediation — the Evans path);
  R: `early_adv`·`neurot` +0.30.
- Explicit nulls: `early_adv` → `g_mem` storage params (enc_base,
  beta_*) = 0 — the Evans finding is a WMC/control deficit, not a
  storage deficit (P569's null half); → semantic memory = 0.
- Bible note: this is a backstory trait — world-builder sets it from
  childhood circumstances, never from present personality. A
  character who "grew up with nothing" carries a measurable,
  lifelong *filtering* tax that no amount of present comfort removes
  — that IS the Evans finding.

## 53. `circ_irr` — the clock that never settles

Chronic circadian disruption (shift work, irregular schedules) is a
real-world condition the Mission's nurses, bakers, and gig workers
live inside. Cho 2001 (Nat Neurosci 4:567 — verified): chronic jet
lag in airline crew → temporal-lobe volume and cognitive deficits
(direction verified; magnitude contested — mark DEBATED size);
shift-work reviews (Costa 2010) document sleep fragmentation as the
dominant pathway; the mechanism is not exotic — it is our existing
sleepFactor/iiv/synchrony machinery pushed off-schedule.

Model — irregularity as *variance in the clock*, not a moved clock:
- `circ_jitter` (0–0.4): each dailyMemoryTick draws that day's
  effective `peak_hour += N(0, circ_jitter·6h)` and
  `sleepFactor` draws ×exp(N(0, circ_jitter·0.15)) — the
  never-settled signature: synchrony benefits arrive on the wrong
  day as often as the right one.
- `iiv_sigma` += 0.5·circ_irr·base — day-to-day performance spread
  widens (§10 machinery, no new code).
- Explicit null: `circ_irr` → mean-level params = 0 — the model
  claim is *irregularity*, not deficit; a stable-schedule version
  of the same character has the same mean. P570 tests the variance
  claim, not a level claim.

## 54. `chron_pain` / `pain_state` — the tax on now

Moriarty, McGuire & Finn 2011 (Prog Neurobiol 93:385 — verified):
chronic pain impairs attention, executive function, and memory —
the proposed mechanism is pain's *continuous attentional demand*,
not tissue damage; Berryman et al. 2013 meta-analysis (Pain —
verified via PubMed 27583141): small-to-moderate deficits
d ≈ −0.31 to −0.57 on working-memory/verbal-learning measures,
test-dependent; analgesic side-effects a confound we do not model.

Model — trait sets prevalence, state does the taxing:
- `chron_pain` ∈ [0,2]: expected fraction of days with
  `pain_state` > 0 (world supplies the day's pain level; base rate
  is the trait).
- `pain_state` ∈ [0,1] (state on encodeEvent/recall calls):
  `E *= (1 − pain_tax·pain_state)` with `pain_tax` ≈ 0.15 at
  state=1 on attended events, ×2 on low-salience ones (pain eats
  the *spare* attention first — HYPOTHESIS ordering on CONSENSUS
  direction); `omit_p` += 0.10·pain_state on routine records.
- Explicit null (the sign-locked half, P571): `pain_state` →
  retrieval of records encoded *before* the pain window = 0 —
  the tax is anterograde-ish (attention at encoding), not a
  blanket cognitive fog; retrograde effects falsify the
  attentional-demand mechanism. Pain off → full recovery: no
  residue. `chron_pain` → complaint_k +0.10 (they DO report it —
  unlike Heffernan's smokers, pain patients know their days are
  harder).

## 55. `task_load` — the busy-day state the trait layer couldn't hold

Marsh & Hicks 1998 (JEP:LMC 24:350 — verified): event-based
prospective memory degrades under ongoing-task demands — the
intention is intact, the monitoring bandwidth is spent; Einstein,
McDaniel et al.'s program confirms divided-attention costs are
focal-task dependent. This is the *state* half of inattn/media_m:
even a disciplined character fails PM on a slammed shift.

Model — context field, not a trait:
- `cueContext.task_load` / `eventContext.task_load` ∈ [0,1]:
  `pm_self` effective ×(1 − task_load_cost·task_load),
  `task_load_cost` ≈ 0.5; `omit_p` += 0.15·task_load on
  low-salience events during the loaded window; `enc_base` on
  peripheral fields ×(1 − 0.20·task_load) — busy days write
  thinner records (HYPOTHESIS magnitude).
- Explicit nulls (P572): `task_load` → non-PM, attended-event
  encoding = 0; → already-encoded record strength = 0 — load
  spends monitoring, it does not erase storage. The state lifts
  with the shift: no carryover, unlike pain's day-scale and
  circ_irr's indefinite regime.

## 56. `music` — the material-locked advantage

Chan, Ho & Cheung 1998 (Nature 396:128 — verified): adults with
childhood music training show better *verbal* memory (spoken-word
lists, F=17.69) with NO visual-memory difference (t=1.00, n.s.);
Ho, Cheung & Chan 2003 child arm verified the split holds
developmentally. The finding's beauty is its *material lock* — a
left-temporal-organizational advantage, not "musicians are
smarter."

Model — channel-scoped, sub-jitter magnitude:
- `music` ∈ [0,2] (training years/depth, bible-pinned):
  enc on `lang`-tagged verbal/conversation fields ×(1 + 0.04·music)
  and retell narrative fluency +0.03·music.
- Explicit nulls (P573's locked half): `music` → visual/spatial/
  place fields = 0; → any non-verbal channel = 0 — a musician who
  also remembers faces better is the bug the null catches.

## 57. `rosy` — the remembering is kinder than the living

Mitchell, Thompson, Peterson & Cronk 1997 (JESP 33:421 — verified,
three studies): anticipation of a trip is MORE positive than the
in-trip experience, and recollection is MORE positive than both —
the "rosy view" arc; in-event negativity is driven by distraction/
disappointment and fades within days. This is a *trait* as much as
a phenomenon: some people run the arc on every event, others
experience-straight.

Model — rides the existing reappraisal machinery:
- `rosy` N(0,1) → `rosy_retro` (0–0.4): on emission, positive-arc
  events' reported emoTag shifts +(rosy_retro) toward positive —
  implemented as a positive tilt on §6.82 `reappr_k` (reappr
  direction biased, not just magnitude); negative-detail fields
  drift at `drift_p ×(1 + 0.5·rosy)` — the annoyances fade
  *faster* than the pleasures, which is the asymmetry that makes
  the arc.
- Anticipation side: v53's `anticip` pre-traces mint at
  +(0.1·rosy) positive skew — the same trait predicts the rosy
  anticipation half (Mitchell's finding is a three-point arc;
  P574 tests all three points' ordering).
- Explicit null: `rosy` → non-valenced fields (who/where/what) =
  0 — it repaints feelings, it does not move facts; →
  trauma-flagged records = 0 (trauma exemption rides §6.82's
  existing gate).

## 58. `birth_order` — the mandated null

Rohrer, Egloff & Schmukle 2015 (PNAS 112:14224 — verified:
N=20,186 across three national panels): NO birth-order effects on
extraversion, emotional stability, agreeableness,
conscientiousness, or imagination, powered to detect tiny effects;
only a ~0.1 SD intelligence tilt survives. Damian & Roberts 2015
concur. Lay psychology insists the middle child "remembers
differently" — the data say no.

Model — `birth_order` exists in IndivTraits **only as a documented
null**: it is a bible-visible field (world-builder will want to
write sibling order; it is good fiction) with **every loading
fixed at 0.0** and an R-matrix of zero. P575 is a null-locked
probe: any nonzero param correlation between birth-order draws
FAILS validation. This is the honesty axis: the trait layer must
be able to say "this folk axis does nothing" — a system that can
only find effects is unfalsifiable, and unfalsifiable is
unbelievable.

## 59. Cross-version interactions (audit)

- `self_srv` × `reappr_k` (§6.82): the ledger is a *record-level*
  asymmetry (encoding); reappraisal is emission-level. A high-rosy
  high-self_srv character remembers doing more AND it feeling
  better — the compound is the classic "I carried us and it was
  fine" narrator. Keep separable: P566 measures field counts,
  P574 measures tag drift.
- `alexith` × `checker` (Part IV): opposite poles on the affect
  axis — the checker over-verifies feelings it has, the alexith
  confabulates feelings it lacks. R: alexith·checker −0.20.
- `alexith` × `distrust` +0.25: fluent confabulated affect reads
  as certainty — alexithymics report LESS memory complaint on
  emotional events (HYPOTHESIS extension of Jonker's complaint
  structure).
- `media_m` × `iiv` (Part II): both widen variance; media_m's is
  attentional (filter leakage), iiv's is endogenous noise. R +0.25.
- `early_adv` × `depr` (Part IV): adversity feeds depr through
  shared neurot/stress, AND its wmc-side tax composes — the
  double-hit phenotype is documented in the adversity-OGM
  literature; additivity + clamp, same policy as Part IV §48.
- `circ_irr` × `chronotype` (Part I): circ_irr jitters *which day*
  the peak lands; chronotype sets *where* it lands. Orthogonal:
  a morning-type baker on rotating shifts is peak-chronotype +
  high-irregularity — both true at once.
- `pain_state` × `depleted` (Part IV): both tax attention;
  they stack additively at encoding (clamp E ≥ 0.05) — a depleted
  day on a pain day is the worst-case corner.
- `task_load` × `supp` (Part IV §38): suppression's social-field
  tax and load's PM tax are different budgets (regulation vs
  monitoring); a character can suppress without load and carry
  load without suppressing — keep as independent multipliers.
- `music` × `langs` (Part II): music boosts verbal-channel enc
  in *any* of the character's languages — the advantage is
  channel-level, not language-level.

## 60. Extended trait vector, R additions, loading table (Part V)

```json
IndivTraits += {
  "self_srv":  0.0,   // ego ledger asymmetry (Ross & Sicoly 1979)
  "alexith":   0.0,   // affect-encoding deficit + confabulated feeling
  "media_m":   0.0,   // exogenous split-attention habit (Ophir 2009)
  "early_adv": 0.0,   // childhood adversity → wmc-side baseline tax [0,2]
  "circ_irr":  0.0,   // chronic circadian irregularity → clock variance
  "chron_pain":0.0,   // pain-day prevalence [0,2]; pain_state is the tax
  "music":     0.0,   // music training → verbal-channel enc only [0,2]
  "rosy":      0.0,   // rosy-view arc amplitude (Mitchell 1997)
  "birth_order": 0    // DOCUMENTED NULL — every loading fixed 0.0 (§58)
}
State fields += {
  "task_load":  0.0,  // context [0,1] — PM/monitoring bandwidth spent
  "pain_state": 0.0   // context [0,1] — today's attentional pain tax
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
self_srv·meta_conf  +0.25    (confident ledgers stay flattering)
self_srv·distrust   −0.30    (self-doubt underclaims)
alexith·distrust    +0.25    (flat affect, fluent certainty)
alexith·checker     −0.20    (opposite poles on affect verification)
alexith·emo_gran    −0.35    (granularity is the report-side sibling)
media_m·inattn      +0.30    (exogenous/endogenous split-attention cousins)
media_m·iiv         +0.25
early_adv·neurot    +0.30    (allostatic mediation — CONSENSUS dir.)
early_adv·stress    +0.40    (Evans 2009 pathway — CONSENSUS dir.)
early_adv·wmc       −0.35    (the trait's own loading IS the wmc tax)
circ_irr·stress     +0.20
circ_irr·sleep      −0.35    (irregular clocks are bad sleepers)
chron_pain·sleep    −0.30
chron_pain·stress   +0.25
music·gc            +0.20    (musicians skew educated — sampling corr.)
rosy·extra          +0.25    (positive-outlook overlap — DEBATED)
rosy·depr           −0.30    (depressives run the arc flat/inverted)
birth_order·*       0.0      (mandated — see §58)
```

### Loading table additions (rows beyond §43)

| trait | param | loading | tier / source |
|---|---|---|---|
| self_srv | sself_enc (new) | +0.15/σ | CONSENSUS dir. (Ross & Sicoly 1979) |
| self_srv | sself_other_loss (new) | +0.20/σ | CONSENSUS dir. |
| alexith | alex_flat (new) | +0.30/σ·(trait∈[0,2]) | CONSENSUS (Vermeulen & Luminet 2009; review 2019) |
| alexith | alex_confab (new) | +0.30/σ·[0,2] | CONSENSUS dir. (Luminet 2005 — the answer still comes) |
| alexith | neg_affect_decay | ×(1 − 0.15·alexith) | CONSENSUS dir. (Muir 2016 FAB reduction) |
| media_m | plist_suppress | ×(1 + 0.30·m) | CONSENSUS (Ophir 2009) |
| media_m | source_confuse | ×(1 + 0.20·m) | CONSENSUS dir. |
| media_m | omit_p | +0.03·m | CONSENSUS dir. (Uncapher 2016) |
| media_m | search_breadth | +1·m | HYPOTHESIS |
| early_adv | misinfo_suscept | ×(1 + 0.08·a) | CONSENSUS dir. (Evans 2009 wmc path) |
| early_adv | source_confuse | ×(1 + 0.12·a) | CONSENSUS dir. |
| early_adv | plist_suppress | ×(1 + 0.15·a) | CONSENSUS dir. |
| early_adv | stress_retrieve_loss | ×(1 + 0.15·a) | CONSENSUS dir. |
| circ_irr | circ_jitter (new) | +0.2·c | CONSENSUS mechanism / DEBATED size (Cho 2001) |
| circ_irr | iiv_sigma | +0.5·c·base | CONSENSUS dir. |
| chron_pain | pain-day prevalence | = chron_pain/2 | CONSENSUS (Berryman 2013 magnitudes) |
| (state) pain_state | E (attended) | ×(1 − pain_tax·p), tax 0.15 | CONSENSUS dir. (Moriarty 2011) |
| (state) pain_state | E (low-salience) | ×(1 − 2·pain_tax·p) | HYPOTHESIS ordering |
| (state) pain_state | omit_p | +0.10·p | CONSENSUS dir. |
| (state) task_load | pm_self eff | ×(1 − task_load_cost·l), cost 0.5 | CONSENSUS (Marsh & Hicks 1998) |
| (state) task_load | omit_p | +0.15·l | CONSENSUS dir. |
| (state) task_load | enc peripheral | ×(1 − 0.20·l) | HYPOTHESIS |
| music | E on lang/verbal fields | ×(1 + 0.04·m) | CONSENSUS (Chan, Ho & Cheung 1998) |
| music | retell narrative fluency | +0.03·m | DEBATED extension |
| rosy | rosy_retro (new) | +0.2·r | CONSENSUS (Mitchell 1997 arc) |
| rosy | drift_p on negative fields | ×(1 + 0.5·r) | CONSENSUS dir. (arc asymmetry) |
| rosy | anticip trace skew | +0.1·r | CONSENSUS dir. (anticipation arm) |
| birth_order | ALL | **0.0 — locked** | CONSENSUS NULL (Rohrer 2015) |

**New explicit nulls** (Part V's falsifiable edge):
- `self_srv` → solo-event params, distortion params = 0 (P566).
- `alexith` → neutral material, non-affective specificity = 0 (P567).
- `media_m` → decay rates, attended-event enc_base = 0 (P568).
- `early_adv` → enc_base/beta_*/semantic = 0 (P569).
- `circ_irr` → mean-level params = 0 — variance claim only (P570).
- `pain_state` → pre-pain-window retrieval = 0; post-pain residue =
  0 (P571).
- `task_load` → non-PM attended encoding, stored strength = 0 (P572).
- `music` → non-verbal channels = 0 (P573 — Chan's visual null).
- `rosy` → non-valenced fields, trauma records = 0 (P574).
- `birth_order` → everything = 0 (P575 — the honesty lock).

## 61. Falsifiable probes (P566–P577; validation-design §97)

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

## 62. Part V honest limits

- `self_srv`'s two-param split (self-boost + other-loss) is our
  decomposition; Ross & Sicoly established the net asymmetry, not
  the encoding-vs-retrieval apportioning — we put it at encoding
  because their own-availability account fits, but a
  retrieval-weighted implementation would also match the data.
- `alexith` extrapolates word-list and review-level findings to
  autobiographical records; the Camia 2020 specificity *null* is
  small-N qualitative — our "specificity spared" null rests on it
  and is the least-certain lock in Part V.
- `early_adv`'s one-sided [0,2] shape is hypothesis; the
  literature shows threshold-ish adversity effects but no clean
  dose curve.
- `circ_irr`'s jitter form is mechanism-consistent (Cho's size
  estimates are contested; we claim variance, not damage).
- `task_load`/`pain_state` are single-scalar states; real load and
  pain fluctuate within a day — the 0–1 grain is an implementer's
  compromise, not a literature quantity.
- `rosy` treats a group-level arc as a stable trait; Mitchell's
  studies measure the phenomenon, individual-difference stability
  is assumed (weakest transfer in Part V — bound by rosy_retro ≤0.4).
- `music`'s effect sizes are small-N (Chan n≈60); the material
  lock is solid, the 0.04 magnitude is calibration judgment.
- The birth-order null is the strongest finding in the part —
  three national panels, null across five traits — and it is the
  only axis where "do nothing" IS the model.

---

# Part VI — v67: the sixth axis of difference (the two tails of
# autobiographical memory, the motivated and elaborative minds,
# the body history nobody chose, and the second mandated null)

The earlier parts covered the clinical phenotypes and the
everyday pharmacopeia. Part VI closes the remaining gaps a cast
bible actually reaches for: what if a character never forgets
*their own life* (HSAM) or can't re-live it at all (SDAM)?
What about the character who simply *thinks harder* (need for
cognition), the one whose self-esteem edits what gets kept
(mnemic neglect), the one carrying an old concussion or an
invisible gene, the synesthete, the ruminator — and one more
bible-visible field that must do *nothing* (learning styles).
Each axis below gets the same treatment: literature, mechanism
choice, loadings, and the explicit null that keeps it honest.

## 63. `hsam` — the calendar that never fades (the upper tail)

Highly Superior Autobiographical Memory: Parker, Cahill &
McGaugh 2006 (case "A.J."/Jill Price — first scientific
description, diary-verified date recall); LePort et al. 2012
(Neurobiol Learn Mem 98:78, N=11 — verified: superior recall of
public AND personal events *with the days and dates*, but
**comparable to matched controls on most standard laboratory
memory tests**); LePort et al. 2016/2017 follow-ups (N≈33–60;
elevated obsessive-compulsive spectrum traits; misinformation
susceptibility NOT reduced — Patihis et al. 2013, PNAS 110:20947,
HSAM participants showed DRM/misinformation false memories at
control rates).

The phenomenon is channel-specific, not general. That is the
finding that makes it modelable: it is NOT "beta → 0
everywhere." An HSAM character is not better at remembering
grocery lists — they are better at remembering *their life*,
date-stamped. The mechanism the literature points at is
rehearsal compulsion: HSAM individuals report habitual, near-
constant review of their own days (Parker 2006; LePort 2016 —
the OC correlation), which in our machinery is a retell/
reminiscence rate, not a storage miracle.

**Mechanism (HYPOTHESIS-parameterization over CONSENSUS facts):**
- `hsam` ∈ [0,1] — rare flag, ~1 per cast at most; bible-set,
  never sampled (prevalence ~1/500 claimants confirmed, i.e.
  effectively rarer).
- Personal-episodic records (self-present, first-person) get
  `beta_episodic` ×(1 − `hsam_decay_cut`·hsam), cut ≈0.85 —
  near-permastored own-life records after ~age 10 (LePort's
  10½-year onset boundary rides `amnesia_exit`/bump_lo — the
  ability does NOT reach into childhood amnesia, locked).
- `remin_w` / rehearsal sampling: own-day review bias
  `hsam_rehearse` ≈ +0.4·hsam — the compulsion is the engine.
- `whenEstimate` σ ×(1 − `hsam_date_acc`·hsam), acc ≈0.9:
  date-linked recall is their signature; coarse telescoping
  nearly absent on own-life records.
- **Locked nulls** (the falsifiable edge): `hsam_lab_null` —
  zero loading on enc_base, semantic, procedural, non-self
  episodic; `hsam_misinfo_null` — zero reduction of
  misinfo_suscept/source_confuse/DRM-style lures (Patihis 2013
  is the anchor: false memories at control rates).

## 64. `sdam` — a life story told in headlines (the lower tail)

Palombo et al. 2015 (Neuropsychologia 72:105, N=3 — verified:
lifelong inability to vividly recollect personally experienced
events, corroborated by absent recollection biomarkers; learning
and memory intact whenever a task "could be accomplished by
non-episodic processes"); Palombo et al. 2018 review;
Wan et al. 2024 — SDAM covaries with aphantasia/low imagery but
is not identical to it. These people function normally — they
*know* their lives without *re-living* them.

**Mechanism:** `sdam` ∈ [0,1], bible-set, ~1 cast member max.
- Encoding unchanged — records are written (they behaved
  normally on learning tasks). The deficit is retrieval-side:
  first-person episodic detail. Model: `specificity` effective
  ×(1 − `sdam_thin`·sdam), thin ≈0.7 — episodic queries return
  the generic/semantic form; `rk_thresh` shift toward `know`
  (reportMode:"know" dominant — fluent content, thin detail).
- `persp_obs` forced +1 equivalent on ALL records — SDAM
  reports are third-person ("living life in the third person"
  is the group's own description, verified in the 2015 paper's
  reception).
- Semantic records, skills, routines, prospective memory:
  untouched (locked nulls). `vivid` correlates (−0.4 in R) but
  is not required — aphantasia overlap is partial.
- Locked nulls: `sdam_enc_null` (enc_base/E terms = 0);
  `sdam_sem_null` (semantic/fact recall = 0); `sdam_conf_null`
  (confidence reports may stay fluent — SDAM adults are not
  chronically uncertain; they narrate facts about themselves).

## 65. `nfc` — the mind that turns things over

Need for cognition (Cacioppo & Petty 1982, JPSP 42:116 — the
trait scale; Cacioppo, Petty, Feinstein & Jarvis 1996, Psych
Bull 119:197 meta — verified: high-NFC people elaborate more,
remember more *relevant* material, and — critically — show a
bigger memory gap between strong and weak arguments; Cohen,
Stotland & Wolfe 1955 is the grandfather study). NFC is not
intelligence (r≈0.3 with gc) — it is *disposition to engage*.

**Mechanism:** `nfc` N(0,1). Loads on encoding of
`elaborable` content — discussions, arguments, pitches,
explanations (Event field `arg_quality ∈ {strong,weak,mixed}`
when the world tags persuasive content):
- E on elaborable events ×(1 + `nfc_elab_gain`·nfc),
  gain ≈0.15.
- The argument-quality *split*: strong-argument fields keep
  the bonus, weak-argument fields get ×(1 −
  `nfc_arg_split`·nfc), split ≈0.15 — high-nfc characters
  remember why a case was good, and remember the good cases.
- `gist` quality on elaborable records +0.1·nfc (elaboration
  writes better gist, not just more verbatim).
- Locked nulls: non-elaborable events (routines, scenes,
  faces) = 0; decay rates = 0 (NFC is an encoding disposition);
  PM = 0.

## 66. `mnemic` — the feedback the self declines to keep

Mnemic neglect (Sedikides & Green 2000, JPSP 79:168; Sedikides,
Green & Pinter 2004; Green, Sedikides & Gregg 2008, JESP
44:547 — verified core: **poorer *recall*, unimpaired
*recognition*, of self-threatening feedback** — negative,
self-central, self-referent — vs self-affirming or
other-referent feedback; the memories are "forgotten but not
gone"; Sedikides & Green 2009 review — moderated by closeness
of source, modifiability beliefs, and absent under ego-
inflation; repressors show enhanced mnemic neglect).

This is NOT `self_srv` (contribution bookkeeping on shared
work) and NOT `repress` (v5.6's derived access suppression —
mnemic neglect is its *feedback-specific* arm and the two
share the family but not the code path). Mechanism is
encoding-side shallow processing: the feedback that would
hurt is "not-thought" (Sedikides & Green 2006, BBS — the
effect is equivalent to inhibitory repression *instigated at
encoding*).

**Mechanism:** `mnemic` N(0,1), correlated with `defens`
(+0.4) and `self_srv` (+0.25). Event field
`self_feedback ∈ {affirm, threaten, neutral}` (world tags
evaluative feedback events — reviews, reprimands, compliments):
- threaten + self-referent: E ×(1 − `mnemic_shallow`·mnemic),
  shallow ≈0.35 — the record is born thin.
- Retrieval: recall-mode effective θ ×(1 +
  `mnemic_theta`·mnemic) on threaten-self records;
  recognition mode **exempt** (locked `mnemic_recog_null` —
  the Green 2008 finding is the lock).
- affirm-self fields: no penalty, small boost
  ×(1 + 0.1·mnemic) — the ledger is asymmetric by design.
- Moderator (spec §6.123): `close:true` source or
  `modifiable:true` framing averts the effect (Green et al.
  2009 — close others' hard feedback IS retained).
- other-referent feedback: locked null at all trait values.

## 67. `tbi` — the injury that took the week before

Remote traumatic brain injury. Two real legs, both modeled:
1. **The retrograde gap.** Ribot's gradient — injury erases
   the hours-to-weeks *before* it while sparing remote
   records (Russell & Nathan 1946, war-injury series —
   classic consensus; post-traumatic amnesia duration is the
   standard severity index).
2. **The persistent tax.** Belanger et al. 2005
   (Neuropsychology 19:595 meta, mild TBI — small persisting
   effect concentrated in working memory/processing speed;
   sports-concussion arm largely resolved by ~90 days);
   moderate-severe TBI leaves durable episodic deficits
   (Dikmen et al. 2009 dose-response by PTA length).

**Mechanism:** `tbi` ∈ [0,2] severity trait (bible field —
who had the crash). World mints `tbi_event:{severity}` at the
injury day (backstory or live):
- At mint: records with createdDay ∈ [injury − `ribot_win`,
  injury] get strength ×(1 − `ribot_loss`), win scales with
  severity (0.5d mild → ~30d severe) — a graduated erasure,
  never a clean cut.
- Persistent: `wmc`-side loadings at 0.1·tbi (plist_suppress,
  source_confuse, stress_retrieve_loss — same target set as
  early_adv, smaller coefficient), `pspeed` −0.1·tbi.
- Locked nulls: `tbi_sem_null` (semantic store untouched);
  `tbi_prog_null` (the deficit does NOT grow — remote TBI is
  a step, not a slope; any accelerating decline belongs to
  `apoe`/disease, not this field).

## 68. `apoe` — the card dealt that nobody sees

APOE ε4 carrier status. Caselli et al. 2009 (NEJM 361:255,
N=815 longitudinal — verified: cognitively normal ε4 carriers'
memory decline *begins before age 60* and accelerates faster
than noncarriers, allele-dose effect; weaker effects on
visuospatial/general status — it is a memory-specific early
slope). Bookheimer et al. 2000 — midlife subtle differences in
ε4 carriers; Nilsson et al. 2006 — detectable from ~50s on
episodic measures. Modifier evidence (exercise/education
attenuation) exists but is DEBATED (head 2020s meta-split).

**Mechanism:** `apoe ∈ {e2,e3,e4}` — enum, not continuous;
`e4_dose` ∈ {0,1,2} derived (homozygous accelerates most,
Caselli p=0.008). Bible-invisible: characters do not know
their genotype — this is a fate parameter, and the fix board
of the mind has no test for it in-world.
- Episodic-decline age curve: `decline_onset` shifts earlier
  by `apoe_shift`·e4_dose years (≈4y/allele), and the
  decline-slope params (beta_episodic drift, discrim_mult,
  sws_mult) steepen ×(1 + `apoe_slope`·e4_dose) post-onset.
- Locked nulls: below onset — EVERYTHING = 0 (a 30-year-old
  ε4 carrier is memory-identical to e3); semantic/procedural/
  PM channels = 0 at all ages; encoding params = 0 (the
  allele moves decline, not learning).

## 69. `synesth` — a small honest advantage

Synesthesia. The 2019 multi-level meta-analysis (Rothen et al.,
Memory — verified: enhanced long-term/episodic memory at
medium effect d̂≈0.61, smaller but real WM effect d̂≈0.36;
**pervasive across stimuli** — which the authors note is hard
to reconcile with a direct-cue account). Rothen & Meier 2010
group study: advantage real but "ordinary rather than
extraordinary" — within normal range. Consensus: a modest,
broad episodic advantage; NOT a mnemonic superpower (the
case-study giants were selection bias, Rothen & Meier 2009).

**Mechanism:** `synesth` ∈ [0,2] (0 absent; 1 grapheme-color
typical; 2 strong multi-type). Loads: E on all episodic
channels ×(1 + `syn_gain`·synesth), gain ≈0.08 — broad and
small (the meta's pervasiveness, honestly priced);
`w_sensory` cue weight +0.05·synesth (extra concurrent =
extra cue handle). Locked nulls: decay rates = 0; a
superhuman arm is a calibration failure (Rothen & Meier 2010
"ordinary" bound — P703 caps observable benefit).

## 70. `rumin` — the needle that returns to the same groove

Response-styles trait (Nolen-Hoeksema 1991, JPSP 60:115 —
ruminative responses prolong negative mood; Watkins 2008,
Psych Bull 134:163 — verified the constructive/unconstructive
split: *brooding* = passive dwelling, maladaptive; *reflection*
= problem-focused, can be adaptive; Lyubomirsky & Tkach 2004 —
ruminators recall more negative autobiographical content and
negative interpretations). Distinct from `neurot` (R +0.4 —
dispositional negative affect), which feeds mood; `rumin` is
the *rehearsal allocation* policy.

**Mechanism:** `rumin` N(0,1) — positive side = brooding.
- Rehearsal sampler bias: negative self-referent records
  re-sampled at base rate ×(1 + `rumin_sel`·rumin+), sel ≈0.4
  — negative records get retell/refresh cycles their valence
  would not earn them.
- `neg_affect_decay` toward 1 by ×(1 − 0.12·rumin+) — the
  unfaded negative (FAB reduction, parallel to alexith's leg
  but rehearsal-mediated, not affect-flat).
- `intrusion_thresh` −0.1·rumin+ on negative-cued records
  (involuntary returns).
- The reflection side: rumin− (below 0) gets a *small*
  positive-resolution bonus `rumin_refl_gain` ≈0.05 on
  problem-framed retells (Watkins 2008 — reflection can help).
- Locked nulls: positive/neutral records' rehearsal rate = 0
  delta; encoding params = 0 (rumination is a post-encoding
  habit — the record is born normally, it just never rests).

## 71. `learn_style` — the second mandated null

Learning styles. Pashler, McDaniel, Rohrer & Bjork 2008 (Psych
Sci Public Interest 9:105 — verified: no credible evidence for
the meshing hypothesis; the studies that would support it
lacked the required crossover design; Rogowsky, Calhoun &
Tallal 2015 RCT null — matching "auditory/visual learner"
instruction to preference did nothing for comprehension).
A "visual learner" encoding preference is folk psychology,
not memory science — the modal channel of a *good teacher* is
the content's own channel, not the learner's.

**Mechanism:** `learn_style ∈ {visual,verbal,auditory,kinesth}`
exists as a bible field — characters believe in it, mention it,
even self-sort by it — with every loading locked at 0.0 and
the R-row zeroed. Like `birth_order` (§58): the field's
purpose is to make "no effect" a *first-class representable
outcome*. A future "meshing bonus" lands as a decision with a
probe failure attached, not as silent drift (P705).

## 72. Cross-version interactions (audit)

- `hsam` × `sdam`: mutually exclusive — the projection clamps
  hsam·sdam ≈ 0 (cannot be both tails); if both sampled, keep
  the larger, zero the other.
- `hsam` × age curves: hsam_decay_cut applies multiplicatively
  INSIDE the age machinery — an 80-year-old HSAM still
  outremembers peers but does not freeze decline (LePort
  cohort is middle-aged; extension is HYPOTHESIS, bounded).
- `sdam` × `persp_obs` (v4.2): sdam forces observer
  perspective independent of the persp_obs trait — additive
  clamp, never both stacked beyond the field's range.
- `mnemic` × `repress` (v5.6 §6.102): shared family, distinct
  gates — repress suppresses *access* on negative-self records
  broadly; mnemic thins *encoding* of feedback events
  specifically. A high-defens character shows both; they
  compose, never double-count (P700 checks the recognition
  exemption which is mnemic-specific).
- `mnemic` × `depr` (v4.2): depressed characters show REDUCED
  mnemic neglect (Sedikides & Green 2009 — dysphoria
  attenuates self-protection) — depr>0.5 halves
  mnemic_shallow.
- `tbi` × `early_adv` (v5.3): additive on the shared wmc-side
  target set; cap the joint multiplier at 1.3× — tails compose
  sublinearly.
- `apoe` × `fitness` (v1.9): fitness reserve mitigation is
  DEBATED — no loading shipped; flagged for a future pass
  when the human meta-analysis settles.
- `rumin` × `neurot`: R +0.4 carries the comorbidity; loading
  targets are disjoint (neurot feeds state mood/w_state; rumin
  feeds rehearsal policy) — a correlation, not a coupling.
- `nfc` × `gc`: R +0.3 (disposition vs ability, Cacioppo 1996);
  nfc moves encoding effort on elaborable content, gc moves
  general accuracy — orthogonal in the loading table.
- `learn_style` × everything: 0.0 — the R-row is all zeros.

## 73. Extended trait vector, R additions, loading table (Part VI)

```json
IndivTraits += {
  "hsam":      0.0,   // autobiographical upper tail [0,1], bible-set
  "sdam":      0.0,   // autobiographical lower tail [0,1], bible-set
  "nfc":       0.0,   // need for cognition — disposition to elaborate
  "mnemic":    0.0,   // mnemic-neglect self-protection amplitude
  "tbi":       0.0,   // remote head-injury severity [0,2], bible-set
  "apoe":      "e3",  // enum {e2,e3,e4}; e4_dose derived; hidden field
  "synesth":   0.0,   // synesthesia [0,2] — small broad advantage
  "rumin":     0.0,   // response style: + brooding / − reflection
  "learn_style": "visual"  // DOCUMENTED NULL — all loadings 0 (§71)
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
hsam·sdam         −1.0   (exclusive tails — hard clamp, §72)
hsam·rumin        +0.35  (the rehearsal compulsion IS the overlap
                          — LePort 2016 OC-spectrum correlation,
                          CONSENSUS direction)
hsam·vivid        +0.2   (richer phenomenology — DEBATED)
sdam·vivid        −0.4   (aphantasia overlap — CONSENSUS dir.,
                          Wan 2024; partial, not identical)
sdam·g_mem        −0.2   (episodic factor loads — CONSENSUS dir.)
nfc·gc            +0.3   (Cacioppo 1996 — CONSENSUS)
nfc·open          +0.3   (disposition shares novelty-seeking)
mnemic·defens     +0.4   (repressors show enhanced neglect —
                          Sedikides & Green 2009, CONSENSUS dir.)
mnemic·self_srv   +0.25  (self-protective family)
mnemic·depr       −0.3   (dysphoria attenuates it — CONSENSUS dir.)
tbi·early_adv     +0.25  (sampling corr: adversity co-travels)
apoe·*            0.0    (genotype is independent — CONSENSUS)
synesth·vivid     +0.25  (concurrents enrich imagery — DEBATED)
synesth·asd       +0.15  (co-occurrence reported — DEBATED)
rumin·neurot      +0.4   (comorbidity — CONSENSUS dir.)
rumin·depr        +0.35  (same)
learn_style·*     0.0    (mandated — see §71)
```

### Loading table additions (rows beyond §60)

| trait | param | loading | tier / source |
|---|---|---|---|
| hsam | beta_episodic on self-present records | ×(1 − 0.85·h) | CONSENSUS dir. (LePort 2012) |
| hsam | remin_w (own-day review bias) | +0.4·h | CONSENSUS dir. (LePort 2016 OC link) |
| hsam | whenEstimate σ (own-life) | ×(1 − 0.9·h) | CONSENSUS (date recall signature) |
| sdam | specificity (episodic queries) | ×(1 − 0.7·s) | CONSENSUS (Palombo 2015) |
| sdam | rk_thresh → reportMode know | +0.3·s | CONSENSUS dir. |
| sdam | persp_obs forced observer | +1 (clamp) | CONSENSUS ("third person") |
| nfc | E on elaborable events | ×(1 + 0.15·n) | CONSENSUS (Cacioppo 1996) |
| nfc | arg-quality split | weak fields ×(1 − 0.15·n) | CONSENSUS (meta: strong/weak gap) |
| nfc | gist on elaborable records | +0.1·n | HYPOTHESIS |
| mnemic | E on self_feedback:threaten | ×(1 − 0.35·m) | CONSENSUS (Sedikides & Green 2000) |
| mnemic | θ (recall mode) threaten-self | ×(1 + 0.4·m) | CONSENSUS |
| mnemic | E on self_feedback:affirm | ×(1 + 0.1·m) | CONSENSUS dir. |
| tbi | ribot retrograde window | 0.5–30d by severity | CONSENSUS (Russell & Nathan 1946) |
| tbi | wmc-side params | ×(1 + 0.1·t) | CONSENSUS dir. (Belanger 2005) |
| tbi | pspeed | −0.1·t | CONSENSUS dir. |
| apoe | decline_onset / decline slopes | −4y·dose / ×(1+0.15·dose) | CONSENSUS (Caselli 2009) |
| synesth | E all episodic channels | ×(1 + 0.08·s) | CONSENSUS (2019 meta d̂≈0.61, priced low) |
| synesth | w_sensory | +0.05·s | HYPOTHESIS (concurrent-as-cue) |
| rumin | negative-record rehearsal rate | ×(1 + 0.4·r⁺) | CONSENSUS dir. (Watkins 2008) |
| rumin | neg_affect_decay | ×(1 − 0.12·r⁺) | CONSENSUS dir. |
| rumin | intrusion_thresh (neg-cued) | −0.1·r⁺ | CONSENSUS dir. (Lyubomirsky & Tkach) |
| rumin | problem-framed retell gain (r⁻) | +0.05·|r⁻| | CONSENSUS dir. (Watkins reflection) |
| learn_style | ALL | **0.0 — locked** | CONSENSUS NULL (Pashler 2008) |

## 74. New explicit nulls (Part VI's falsifiable edge)

- `hsam` → enc_base, semantic, procedural, non-self episodic = 0;
  misinfo_suscept/source_confuse/lure = 0 (P697 — the lab null
  and the Patihis null are the famous finding's other half).
- `sdam` → encoding, semantic, PM, confidence = 0 (P698).
- `nfc` → non-elaborable material, decay, PM = 0 (P699).
- `mnemic` → recognition mode, other-referent feedback = 0
  (P700 — "forgotten but not gone" is the lock).
- `tbi` → semantic store, progressive worsening = 0 (P701 —
  a step, not a slope).
- `apoe` → everything below onset age; semantic/procedural at
  all ages; encoding = 0 (P702).
- `synesth` → decay = 0; observable benefit capped "ordinary"
  (P703).
- `rumin` → positive/neutral rehearsal, encoding = 0 (P704).
- `learn_style` → EVERYTHING = 0 (P705 — second honesty lock).

## 75. Falsifiable probes (P697–P708; validation-design §127)

- **P697 the calendar mind (MUST — two nulls locked):** hsam=1
  vs 0, same 90-day event diet: self-present records show
  near-flat retention + whenEstimate σ ≤ ~10% of control;
  non-self word-list-equivalent records, misinfo_suscept, and
  DRM-style lure acceptance IDENTICAL within jitter — a
  general memory advantage or a false-memory shield fails.
- **P698 the third person (MUST):** sdam=1 episodic queries
  return generic/know-mode reconstructions ~70% more often,
  persp_obs forced observer; semantic queries, skill
  retention, and PM hit-rate match control; confidence
  reports stay fluent (no chronic-uncertainty arm).
- **P699 elaboration is choosy (MUST — sign-locked):**
  discussion events tagged arg_quality: nfc=+1.5 shows
  strong−weak field-retention gap ≈2× the nfc=−1.5 gap;
  matched non-elaborable events identical; beta_* unchanged.
- **P700 forgotten but not gone (MUST — recognition lock):**
  matched threaten-self vs affirm-self feedback events:
  mnemic=+1.5 recalls ~30% fewer threaten fields; recognition-
  mode cueContext recovers them at control rate; other-
  referent feedback identical across traits; close-source
  threaten events exempt at all levels.
- **P701 Ribot's window (MUST — sign-locked):** tbi_event
  minted mid-timeline: retrograde erasure graded by severity
  (mild ≈ hours, severe ≈ weeks), remote records spared;
  persistent wmc-side tax present at +90d and STABLE — any
  year-over-year growth of the deficit fails.
- **P702 the invisible allele (MUST — onset lock):** apoe=e4
  vs e3, age_eff curves compared: identical at 30/40; diverging
  only past onset on episodic-side params (beta drift,
  discrim_mult, sws_mult); semantic/procedural identical at
  every age; homozygous > heterozygous ordering holds.
- **P703 the ordinary advantage (SHOULD — ceiling-locked):**
  synesth=2 shows episodic E advantage ≈5–15% across channel
  types INCLUDING synesthesia-irrelevant material (the meta's
  pervasiveness); >25% advantage fails — the trait is honest,
  not cinematic.
- **P704 the groove (MUST):** rumin=+1.5 negative records show
  elevated rehearsal counts + slowed neg_affect_decay +
  lowered intrusion_thresh on negative cues; positive/neutral
  rehearsal and all encoding params identical; rumin=−1.5
  shows the small reflection gain on problem-framed retells.
- **P705 meshing null (MUST — honesty lock):** 200 draws
  pinned learn_style vs randomized: modality-matched vs
  modality-mismatched encode contexts produce identical
  recall within jitter; ANY systematic interaction fails
  (Pashler 2008; the field exists for bibles, not mechanics).
- **P706 tail exclusivity (MUST):** joint sampler with
  hsam·sdam both nonzero never emits; ordering resolves to
  the larger magnitude; composite records show only one
  tail's signature.
- **P707 rehearsal is the engine (SHOULD):** ablate remin_w
  on an hsam=1 profile (removal of the compulsion leg) —
  the advantage collapses toward control; the ablation, not
  the flag, carries the effect (mechanism-audit probe).
- **P708 feedback ledger asymmetry (SHOULD):** mnemic=+1.5 ×
  self_srv=+1.5 character gets criticized after a shared task:
  own-effort fields stay dense (self_srv arm) while threat
  fields thin (mnemic arm) — both operators visible in one
  record, no interaction term.

## 76. Part VI honest limits

- `hsam`'s mechanism is contested in the literature — LePort
  2016's OC-correlation supports the rehearsal account, but
  neuroanatomical differences (9 structures) suggest
  constitutional contributions we do not model; we chose the
  rehearsal engine because it is implementable and P707 makes
  the choice falsifiable.
- `sdam` rests on N=3 (2015) plus small follow-ups — the
  prevalence, boundaries, and aphantasia overlap are all
  early-stage science; the strongest claim we make is the
  episodic/semantic dissociation, which the biomarkers support.
- `mnemic`'s effect sizes come from list-feedback paradigms
  (trait-word feedback), extrapolated to naturalistic feedback
  events; the recognition exemption is solid, the 0.35
  magnitude is calibration judgment.
- `tbi`'s ribot window compresses graded retrograde amnesia
  into a two-parameter model; real PTA curves are messier.
  Belanger's persistent effect is small — our 0.1 coefficient
  sits at the strong end for mild, appropriate for moderate.
- `apoe` models asymptomatic decline ONLY — the MCI/dementia
  cliff is deliberately out of scope (disease trait owns that
  door); the fitness-mitigation literature is too split to
  price, so we shipped the null.
- `synesth`'s pervasiveness finding (2019 meta) conflicts with
  the direct-cue intuition; we priced the meta's pooled
  effect, not the mechanism — if future work shows
  stimulus-locked effects, the loading should narrow.
- `rumin`'s brooding/reflection split is real in self-report
  factor structure; our single-axis ± implementation is the
  standard simplification (RRS subscales correlate ~0.6).
- The two mandated nulls (birth_order, learn_style) now
  bracket the trait layer: it can represent "everything" and
  "nothing," and the nothing is load-bearing.

---

# Part VII — v79: the seventh axis of difference (where the
# remembering lives — offloaded, shared, shifted; and the
# coping styles that refuse the channel)

Parts I–VI built the trait layer from ability, affect,
metacognition, neurodivergence, clinical phenotypes, and the
two tails. Part VII attacks the dimension all six skirted:
**where the memory physically lives**. Human memory is
distributed — into other people (transactive systems),
devices (cognitive offloading), geography (navigation
ability, the immigrant's re-anchored bump), and practice
(trained mnemonics, per-sleep consolidation yield). The
remaining axes cover the two ways a mind can *refuse* a
channel (blunting vs vigilance's hypervigilance; the
schizotypal reality-monitoring leak; the contested
hypnotizability link) and one bilingual cost that was never
priced.

New traits: `blunt`, `trans_dep`, `offload`, `consol`,
`nav_ab`, `schizotyp`, `hypnot`, `mnem`. New demographic
fields (bible-set, not σ-traits): `immig_age`, `grew_rural`.
No deletions.

## 77. `blunt` — the coping style that looks away

Miller's monitoring-blunting construct (Miller 1980 —
"When is a little information a dangerous thing?"; Miller &
Mangan 1983 — blunters under monitored vs distracting
conditions) is the missing mirror of `vigil` (§24). Vigil is
threat-channel *hypervigilance*; blunters are the documented
opposite pole: they self-select OUT of threat information —
less intake, less arousal, less memory for threat-relevant
material, WITHOUT being low-anxious people. The distinction
that matters for RW: neurot is how loudly the alarm rings;
blunt/vigil is whether the person faces the siren or the
wall.

- `blunt` σ ∈ [−3, +3] (+ = blunting pole; −σ degenerates
  toward monitoring/vigil behavior — the scale is bipolar in
  the literature). r(vigil) −0.5 (the same axis's two poles —
  CONSENSUS direction: the MBS scale was built bipolar);
  r(neurot) ≈ −0.1 (orthogonal to distress level — the
  construct's whole point).
- Loadings: on records the event layer tags
  `anticipThreat:true` (warnings, medical news, "we need to
  talk"): `w_emo_neg ×(1 − blunt_avoid_k·blunt)` (0.12 —
  intake is shallow); `intrusion_thresh += 0.04·blunt` on
  threat-cued records (the trace exists but doesn't
  spontaneously resurface); retell_omit ↑ on threat topics
  for +blunt characters (they don't bring it up — behavior,
  not storage). Recall-side drive: Mitte's recall bias
  (§24) is *reversed* for +blunt — `vigil_recall_bias` term
  uses `(vigil − 0.8·blunt)` as its effective operand.
- Explicit nulls: `blunt → beta_*` = 0; `blunt → E` on
  non-threat records = 0; `blunt → suggs` = 0 (avoidance is
  not compliance). A blunter who DOES encode a threat record
  keeps it normally — the filter is at the door.

## 78. `immig_age` — the bump that moved

The reminiscence bump is not nailed to adolescence.
Schrauf & Rubin (1998, JML 39:437 — verified: 12 adult
immigrants, bump followed age at immigration and settlement,
not ages 10–30) and Schrauf & Rubin (2000, ACP — life-story
narratives: recall increase centered on immigration age;
immigration memories themselves not rated more emotional or
detailed — the effect is distribution, not tagging) show a
*second* bump anchored to the life transition. The cognitive
account (novelty + effort-after-meaning + release from
proactive interference at settlement) is exactly what our
bump machinery already prices — we just let it anchor twice.

- `immig_age` ∈ {null, 10..70} — bible-set demographic field
  (null = native-born; the Mission's immigrant cast members
  get a real, documented memory-distribution signature).
- Model: the bump window becomes the UNION of
  [bump_lo, bump_hi] and [immig_age − 3, immig_age + 12] —
  the second window carries the same `bump_beta_mult` and
  `bump_self_thresh` gates. `lang` field (§11) does the
  split: pre-immigration records overwhelmingly in L1,
  post-immigration increasingly in L2 — so the
  `lang_mismatch` cost (v1.9) partitions the character's
  own past by language, and Marian & Neisser-style probes
  (§11/P174) hit a real boundary. [CONSENSUS that the bump
  relocates; window width ±3/+12 is our HYPOTHESIS fit.]
- Explicit nulls: `immig_age → beta_*` = 0 outside windows;
  `immig_age → valence/arousal tagging` = 0 (Schrauf & Rubin
  2000's own null — the era is dense, not hotter).

## 79. `trans_dep` — the memory that lives in the partner

Wegner's transactive memory (Wegner 1987; Wegner, Erber &
Raymond 1991 — verified: couples outperform impromptu pairs
only when left to their natural division of memory labor;
assigned structure *hurts* real couples) is the strongest
existence proof that "where information lives" is a
person-level parameter, not a fact about the world. The
counterweight is collaborative inhibition (Weldon &
Bellinger 1997 — verified: collaborative dyads recall LESS
than pooled-nominal dyads — retrieval strategy disruption);
the two effects coexist: partners store pointers to each
other AND recall-alone beats recall-together.

- `trans_dep` σ ∈ [−3, +3]; r(attach_anx) +0.2, r(extra)
  +0.15, r(social) +0.25. Trait = habitual reliance on a
  designated partner as external store.
- Model: a profile may carry `trans_partner:<charId>`
  (world-builder sets on couples/long roommates). On events
  tagged `shared:true` with partner present, content fields
  encode at `×(1 − trans_shift·trans_dep)` (0.15) while a
  `pointer` field mints at `+0.3·trans_dep` — "she'll
  remember the reservation." Pointer fields cue
  `askPartner` retrieval: joint-recall (`cueContext.
  partnerPresent:true`) restores the deficit with bonus
  `joint_boost` (0.1); solo recall gets the content penalty
  bare.
- Collaborative inhibition leg: `cueContext.recallTogether`
  applies `collab_inhibit` (0.12) drive penalty to BOTH
  members — but its variance-reduction is a benefit the
  spec prices as `collab_stab` (drift_p ↓ on agreed fields —
  Weldon's "group recall more stable over time").
- **Bereavement/breakup edge (the drama):** partner exit
  (`trans_partner` cleared or `partner_lost:true` event)
  leaves orphaned pointer fields — records whose content was
  never written. These produce the signature emission
  `orphan_recall` ("I keep reaching for her half of the
  memory"): retrieval attempts that resolve pointers to
  absent partners emit sparse content + high FOK with no
  resolution. The widower's amnesia is structural, not
  psychodynamic. [CONSENSUS for transactive storage; the
  orphan-recall phenotype is documented bereavement folklore
  formalized — HYPOTHESIS.]

## 80. `offload` — the phone remembers so you don't have to

Sparrow, Liu & Wegner (2011, Science 333:776 — verified:
expecting future access to information lowers recall of the
information and raises recall of WHERE to get it) plus the
offloading literature (Risko & Gilbert 2016 — intention
offloading to external store reduces internal memory;
camera/photo work: Henkel 2014 "point-and-shoot" memory
impairment for photographed objects) establish a modern,
Mission-plausible axis: habitual externalization.

- `offload` σ ∈ [−3, +3]; r(inattn) +0.2, r(consc) −0.15
  (weak — offloaders are not less conscientious, differently
  conscientious).
- Model: events the world tags `externalized:true` (photo
  taken, address saved, message sent) get `E_content
  ×(1 − offload_k·offload)` (0.2) but mint a durable
  `ext_pointer` field (where it's stored — photo roll, chat
  thread, contact card) at `+0.3·offload`. The pointer is a
  semantic-tier fact, not episodic — it survives beta_episodic
  decay.
- Retrieval: `ext_pointer` resolves via `lookup` op (world-
  mediated, cheap, perfect recall of the EXTERNAL content —
  the phone doesn't misremember); but records consulted via
  lookup gain NO retell_boost rehearsal credit on first
  lookup — the familiar finding that looking something up
  is not remembering it. Second+ lookups of the same pointer
  DO start accruing rehearsal (repeated consultation
  internalizes — HYPOTHESIS but the only sane rule).
- **Loss edge:** `pointer_dead:true` (phone lost, account
  deleted, chat history wiped) orphans ext_pointers — same
  orphan_recall machinery as §79, device flavor. The
  character knows there WAS a photo and nothing more.
  [CONSENSUS for the where-vs-what split; loss-edge
  phenomenology is HYPOTHESIS.]
- Explicit nulls: `offload → enc_base` = 0 on non-
  externalized events (Sparrow: the deficit is conditional
  on expected access, not global); `offload → beta_*` = 0;
  `offload → misinfo_suscept` = 0.

## 81. `consol` — sleep yield, not sleep quantity

`sleep` (§2.10) is how well a character sleeps; `consol` is
how much memory a unit of sleep buys. The literature
separates them: sleep spindle density/activity correlates
with overnight memory retention beyond sleep duration
(Gais, Mölle, Helms & Born 2002 — spindle activity after
learning predicts retention; Schabus et al. 2004 — spindles
differ between good and poor declarative-memory sleepers);
and nappers/non-nappers differ in nap benefit (Mednick's
lab). Two characters on identical 7-hour nights bank
different amounts of yesterday.

- `consol` σ ∈ [−3, +3]; r(sleep) +0.35 (good sleepers tend
  to consolidate better — partial, not identical);
  r(aging_rate) −0.15 (consolidation yield is an aging
  slope component).
- Loadings: `consol_beta_mult ×(1 − 0.12·consol)` (the
  decay rate during the consolidation window — high-consol
  records emerge from the first sleep already tougher);
  `sleepFactor` gain per unit `sleepQuality` rescaled
  `×(1 + 0.1·consol)` (same night, more yield); small
  `link_p ·+0.05/σ` on records born one sleep ago (the
  overnight integration leg — HYPOTHESIS).
- Explicit nulls: `consol → E` = 0 (encoding is the same
  before the first sleep); `consol → theta` = 0;
  `consol → wake-time params` = 0 — it operates only inside
  consol_window_days machinery (v0.1). The trait is
  invisible in evening behavior; it shows up as what
  survived the night.

## 82. `nav_ab` / `grew_rural` — the map in the head

v76 gave records a `nav_mode` (allo/ego style). This is the
ability axis underneath the style. Coutrot et al. (2018,
Curr. Biol. — Sea Hero Quest, ~2.5M players: navigation
ability declines with age from early adulthood, male
advantage, national differences) and Coutrot et al. (2022,
Nature — verified: 397k participants; grew-up-outside-
cities advantage; people navigate best in environments
topologically similar to where they grew up — grid-city
kids ace grids, organic-city kids ace entropic layouts) give
the largest-N individual-differences dataset in cognition.
The Mission District is a *grid* — a rural-raised main and
a Manhattan-raised main literally differ in which
neighborhoods their memories encode cleanly.

- `nav_ab` σ ∈ [−3, +3]; r(sex=m) ≈ +0.15 (small male
  advantage — CONSENSUS direction, Coutrot 2018), r(gc) ≈
  +0.1, uncorrelated with face_ability (route memory ≠
  face memory).
- `grew_rural` ∈ {0,1} bible field + `home_layout ∈
  {grid, organic}` (the childhood street topology): match
  bonus `nav_layout_match` (0.08) on place-cue weights when
  current venue topology matches home_layout — the
  Mission's grids reward the grid-raised.
- Loadings: `w_place +0.08/σ` and `place_reinstate
  ×(1 + 0.15·nav_ab)` (better navigators get more out of
  matched-place cues — reinstatement is the use of the
  map); `link_p` on route/journey records +0.08/σ;
  `whenEstimate` σ ×(1 − 0.1·nav_ab) on route-anchored
  records (the map carries a timeline — HYPOTHESIS);
  retroactive `interf_k` on NEW-route records `−0.02/σ`
  (good navigators assimilate remapped streets — DEBATED).
- Explicit nulls: `nav_ab → face/people params` = 0;
  `nav_ab → beta_*` = 0 on non-place records; `nav_ab →
  episodic E` = 0 — a lost character still remembers the
  evening; she just can't retell where it happened.

## 83. `schizotyp` — the reality-monitoring leak

`fantasy` (§2.9) is imagination *inflation* — imagined
things gain believed-past status. Positive schizotypy is a
different defect: reality/source monitoring itself leaks —
performed-vs-imagined and self-vs-other confusions in BOTH
directions (Peters, Smeets, Giesbrecht, Jelicic &
Merckelbach 2007 — verified: high schizotypy scorers
falsely claimed to have PERFORMED acts they only imagined;
Larøi, Collignon & Van der Linden 2005; 2022 meta-analysis
44 studies: internal source-monitoring and imagined-stimuli
SM specifically impaired, SMD ~0.5–0.7; Steel et al. 2005 —
intrusion-proneness account). Importantly, WMC deficits do
NOT explain it (Peters 2007 controlled) — so `schizotyp`
loads on source_confuse, not on wmc.

- `schizotyp` σ ∈ [0, +3] (one-tailed — the literature is
  on the positive dimension); r(fantasy) +0.4, r(dissoc)
  +0.3, r(neurot) +0.2.
- Loadings: `source_confuse += schz_src_k·schizotyp` (0.08)
  — and crucially `source_confuse_flip` operates
  BIDIRECTIONALLY here: imagined→performed flips AND
  said→thought, heard→imagined reverse flips (internal SM
  deficit — the "did I say that out loud?" character);
  `intrusion_thresh −0.04·schizotyp` (Steel's intrusion
  vulnerability); `deja_thresh −= 0.05·schizotyp` (familiarity
  without identification is a documented schizotypal
  experience channel — Steel 2005); `phantom_p +0.008/σ`
  small.
- Explicit nulls: `schizotyp → wmc` = 0 (Peters 2007's own
  control); `schizotyp → beta_*` = 0; `schizotyp → E` = 0.
  Storage is fine; the attribution layer is porous.
- Boundary vs `asd` (§22): asd's source_confuse is
  self/other-detail confusion with *reduced* gist phantoms;
  schizotyp is internal/external reality monitoring with
  *normal-to-elevated* phantoms. The two signatures are
  deliberately distinguishable in probes.

## 84. `hypnot` — the contested channel (priced, flagged)

Hypnotic susceptibility's link to false memory is REAL but
messier than folklore: imagination inflation correlates with
hypnotic (not interrogative) suggestibility (Heaps & Nash
1999 — verified: inflation associated with hypnotic
suggestibility and dissociativity, NOT imagery vividness or
interrogative suggestibility); Barnier & McConkey 1992 and
Sheehan, Statham & Jamieson 1991 report more false memories
in highs under hypnosis-era procedures. BUT: Wagstaff's
sociocognitive line (verified: when accuracy is emphasized,
high hypnotizables can be MORE resistant), and the large
"no false-memory trait" result (Patihis et al. line —
correlations between false-memory tasks are near-null) cap
the loading hard. We price a *context-locked* effect only:
guided-imagery + authoritative framing is where the trait
shows.

- `hypnot` σ ∈ [0, +3] (scale is one-tailed); r(fantasy)
  +0.45, r(suggs) +0.15 (hypnotic ≠ interrogative
  suggestibility — Heaps & Nash's own dissociation),
  r(dissoc) +0.3.
- Loadings (ALL gated to `cueContext.guided_imagery:true`
  or `authoritative:true` accounts — outside those contexts
  the trait is inert): `imagine_gain ×(1 +
  hypnot_gain·hypnot)` (0.25 under guidance only);
  `misinfo_suscept += hypnot_yield·hypnot` (0.05, gated);
  `conf_out += 0.06·hypnot` on guided-imagery-derived
  reconstructions (highs report the production confidently).
- Explicit nulls (this is where we bank the controversy):
  `hypnot → misinfo_suscept` outside gated contexts = 0;
  `hypnot → beta_*` = 0; `hypnot → E` = 0;
  `hypnot → suggs-channel Shift` = 0 (Heaps & Nash
  dissociation is load-bearing).
- If the literature continues to weaken, the fix is to
  zero `hypnot_gain` — the field remains as a bible pin
  with mandated-null semantics, joining birth_order and
  learn_style. [DEBATED — the most contested loading we
  ship.]

## 85. `mnem` — trained memory is a skill, not a brain

Memory athletes are made, not born: Maguire et al. (2003 —
memory champions show no superior general memory or brain
anatomy; they use spatial/navigational strategies) and
Dresler et al. (2017, Neuron — verified: 6-week
method-of-loci training in naive subjects produced
athlete-like network changes and durable gains at 4 months;
Wagner et al. 2021, Sci. Adv. — verified: training enhanced
DURABLE memory formation specifically) say the advantage is
a *strategy* that can be acquired and is bound to the
practiced material. So `mnem` is a training flag that
re-routes encoding through spatial channels — cheap, honest,
and it gives world-builder "the character who memorizes the
regulars' orders" without superpowers.

- `mnem` σ ∈ [0, +2] (acquired dose, bible-set; 0 = naive);
  r(gc) +0.15, r(consc) +0.2 (training adherence),
  r(nav_ab) +0.2 (the technique IS spatial).
- Loadings (gated to `deliberate:true` encoding contexts —
  studying, rehearsing a list, memorizing the specials):
  `link_p ×(1 + 0.25·mnem)` on deliberate records;
  `w_place cue contribution +0.1·mnem` at retrieval of
  deliberate records (route reinstatement is the technique);
  `beta_episodic ×(1 − 0.15·mnem)` on deliberate records only
  (Wagner 2021's durability leg); `search_breadth +1·mnem`
  (systematic search replaces hopping).
- Explicit nulls: `mnem → incidental encoding` = 0 (the
  strategy must be deployed — athletes at breakfast are
  ordinary); `mnem → theta` = 0; `mnem → misinfo_suscept` =
  0; `mnem → face/name learning absent deliberate effort`
  = 0. The champion's grocery list is mighty; her drunk
  Tuesday is not.

## 86. The bilingual tax that was never priced — TOTs

Gollan & Acenas (2004, JEP:LMC 30:246 — verified: bilinguals
suffer MORE tip-of-the-tongue states than monolinguals on
non-cognate targets; cognate/translation rescue effects;
mechanism = weaker language-specific activation, NOT cross-
language interference) document the one reliable bilingual
memory *cost*. It was absent from §11 (which modeled only
encoding-language cue match).

- No new trait — `langs ≥ 2` gains a loading row:
  `tot_rate += 0.03` when the retell/report channel is the
  character's NONDOMINANT language (world supplies
  `cueContext.reportLang` + profile `dominantLang`); cognate-
  dense content partially rescues (`tot_rate −= 0.01` when
  `cueContext.cognate_ok:true` — a fiction-safe flag the
  world can set on Spanish/English name-adjacent content).
- Explicit nulls: `langs≥2 → tot_rate` in the DOMINANT
  language = 0 (the deficit is language-specific — Gollan's
  mechanism is per-language activation); `langs≥2 →
  tot_resolution` = 0 (TOTs resolve at normal rates; the
  tax is incidence, not duration).

## 87. Extended trait vector and R additions (Part VII)

```json
IndivTraits += {
  "blunt":     0.0,   // §77 — monitoring(−)/blunting(+) pole
  "trans_dep": 0.0,   // §79 — reliance on partner-as-store
  "offload":   0.0,   // §80 — digital externalization habit
  "consol":    0.0,   // §81 — per-sleep consolidation yield
  "nav_ab":    0.0,   // §82 — spatial navigation ability
  "schizotyp": 0.0,   // §83 — reality-monitoring leak [0,3]
  "hypnot":    0.0,   // §84 — hypnotic susceptibility [0,3]
  "mnem":      0.0,   // §85 — acquired mnemonic skill [0,2]
  // demographic fields (bible-set, not σ-traits):
  "immig_age":  null, // §78 — age at immigration, null=born-here
  "grew_rural": 0,    // §82 — childhood outside cities
  "home_layout": "grid" // §82 — {grid, organic} street topology
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
blunt·vigil        −0.50  (bipolar scale — CONSENSUS dir., MBS)
blunt·neurot       −0.10  (avoidance ≠ calm — near-orthogonal)
trans_dep·attach_anx +0.20
trans_dep·extra    +0.15
trans_dep·social   +0.25
offload·inattn     +0.20
offload·consc      −0.15
consol·sleep       +0.35  (sleep quantity ↔ yield — partial)
consol·aging_rate  −0.15
nav_ab·sex         +0.15  (m direction — CONSENSUS, Coutrot 2018)
nav_ab·mnem        +0.20  (the technique is spatial)
schizotyp·fantasy  +0.40
schizotyp·dissoc   +0.30
schizotyp·neurot   +0.20
hypnot·fantasy     +0.45  (CONSENSUS direction — Heaps & Nash)
hypnot·suggs       +0.15  (deliberately small — dissociation)
hypnot·dissoc      +0.30
mnem·consc         +0.20
mnem·gc            +0.15
immig_age·*        0.0    (demographic — no σ correlations)
grew_rural·nav_ab  +0.25  (Coutrot 2022 — CONSENSUS direction)
```

## 88. Loading table additions (rows beyond §73)

| trait | param | loading | tier / source |
|---|---|---|---|
| blunt | w_emo_neg on anticipThreat records | ·−0.12/σ | CONSENSUS dir. (Miller 1980/1983) |
| blunt | intrusion_thresh on threat-cued | +0.04/σ | CONSENSUS dir. |
| blunt | vigil_recall_bias operand | uses (vigil − 0.8·blunt) | HYPOTHESIS form |
| blunt | retell_omit on threat topics | +0.05/σ | HYPOTHESIS |
| immig_age | bump window | + [a−3, a+12] second window | CONSENSUS (Schrauf & Rubin 1998/2000) |
| trans_dep | content-E on shared w/ partner | ·−0.15/σ | CONSENSUS dir. (Wegner 1991) |
| trans_dep | pointer-field mint | +0.3/σ | CONSENSUS dir. |
| trans_dep | joint_boost (partnerPresent) | +0.1/σ | CONSENSUS dir. |
| (all) | collab_inhibit (recallTogether) | 0.12 flat | CONSENSUS (Weldon & Bellinger 1997) |
| (all) | collab_stab (drift ↓ on agreed) | −0.05 flat | CONSENSUS dir. |
| offload | E_content on externalized | ·−0.20/σ | CONSENSUS (Sparrow 2011) |
| offload | ext_pointer mint | +0.3/σ | CONSENSUS (Sparrow 2011) |
| offload | first-lookup rehearsal credit | 0 (no retell_boost) | HYPOTHESIS rule |
| consol | consol_beta_mult | ·−0.12/σ | CONSENSUS dir. (Gais 2002; Schabus 2004) |
| consol | sleepFactor gain rescale | ×(1+0.1·consol) | CONSENSUS dir. |
| consol | link_p (records born ≤1 sleep) | ·+0.05/σ | HYPOTHESIS |
| nav_ab | w_place | +0.08/σ | CONSENSUS dir. |
| nav_ab | place_reinstate | ·+0.15/σ | CONSENSUS dir. |
| nav_ab | link_p on route/journey | +0.08/σ | CONSENSUS dir. |
| nav_ab | whenEstimate σ on route-anchored | ·−0.10/σ | HYPOTHESIS |
| nav_ab | interf_k on new-route records | −0.02/σ | DEBATED |
| home_layout | w_place on matching topology | +0.08 (nav_layout_match) | CONSENSUS (Coutrot 2022) |
| schizotyp | source_confuse | +0.08/σ | CONSENSUS (Peters 2007; 2022 meta) |
| schizotyp | source_confuse_flip | BIDIRECTIONAL +0.06/σ | CONSENSUS (internal SM arm) |
| schizotyp | intrusion_thresh | −0.04/σ | CONSENSUS dir. (Steel 2005) |
| schizotyp | deja_thresh | −0.05/σ | CONSENSUS dir. |
| schizotyp | phantom_p | +0.008/σ | DEBATED |
| hypnot | imagine_gain (guided only) | ·+0.25/σ | CONSENSUS dir. (Heaps & Nash 1999) |
| hypnot | misinfo_suscept (guided/auth only) | +0.05/σ | DEBATED (Wagstaff counterevidence) |
| hypnot | conf_out on guided reconstructions | +0.06/σ | DEBATED |
| mnem | link_p (deliberate:true) | ·+0.25/σ | CONSENSUS (Dresler 2017) |
| mnem | beta_episodic (deliberate only) | ·−0.15/σ | CONSENSUS dir. (Wagner 2021) |
| mnem | w_place cue at retrieval (deliberate) | +0.1/σ | CONSENSUS (Maguire 2003) |
| mnem | search_breadth (deliberate recall) | +1/σ | HYPOTHESIS |
| langs≥2 | tot_rate (nondominant reportLang) | +0.03 | CONSENSUS (Gollan & Acenas 2004) |
| langs≥2 | tot_rate rescue (cognate_ok) | −0.01 | CONSENSUS (same) |

## 89. New explicit nulls (Part VII's falsifiable edge)

- `blunt → beta_*`, `blunt → E` on non-threat, `blunt →
  suggs` = 0 (P835 — avoidance at the door, not the store).
- `immig_age → beta_*` outside windows, `→ valence/arousal`
  = 0 (P836 — distribution, not tagging).
- `trans_dep → solo encoding`, `→ non-shared events` = 0
  (P837 — the store split needs a partner to exist).
- `offload → enc_base` on non-externalized, `→ misinfo` = 0
  (P838 — the deficit is conditional on expected access).
- `consol → E`, `→ theta`, `→ wake-time` = 0 (P839 —
  invisible at night, visible in the morning).
- `nav_ab → face/people`, `→ non-place beta_*` = 0 (P840).
- `schizotyp → wmc` = 0 (Peters 2007's own null is our
  lock), `→ beta_*`, `→ E` = 0 (P841).
- `hypnot → anything outside guided/authoritative context`
  = 0 (P842 — the contested channel stays in its cage).
- `mnem → incidental encoding`, `→ theta`, `→ misinfo` = 0
  (P843 — strategy must be deployed).
- `langs≥2 → tot_rate` in dominant language = 0 (P844 —
  the tax is language-specific).

## 90. Falsifiable probes (P835–P846; validation-design §158)

- **P835 the blunter's door (MUST — sign-locked):**
  blunt=+1.5 vs −1.5 on matched anticipThreat events:
  +blunt encodes fewer threat-field details and shows fewer
  spontaneous threat-cued intrusions; recognition-mode
  recovery of what WAS encoded is equal; non-threat events
  identical in both arms (Miller's intake filter — a
  difference on already-stored records FAILS).
- **P836 the second bump (MUST):** immig_age=28 vs null
  profiles, identical 70y lifespan event diet: recall
  density shows a secondary mode at [25, 40] encodeAge only
  in the immigrant arm; valence/arousal distributions of
  the mode's records match the lifespan baseline (Schrauf &
  Rubin 2000's own null); L1-cued retrieval of pre-28
  records ≥1.4× L2-cued (the lang partition rides along).
- **P837 borrowed halves (MUST):** trans_dep=+1.5 with
  trans_partner set, on shared vs solo events: shared-event
  content sparser + pointer fields minted; partnerPresent
  recall restores content recall to ≥ solo-encode control;
  partner_lost clears trans_partner → shared records emit
  orphan_recall with high FOK and sparse content. A
  trans_dep=−1.5 character on the same diet shows NO
  pointer mints.
- **P838 the camera ate the memory (MUST — conditional
  lock):** offload=+1.5 vs −1.5, externalized vs
  non-externalized event cells: the E deficit appears ONLY
  in the externalized×high-offload cell; ext_pointer
  survives +90d while sibling content fields decay;
  lookup-mediated reports of the content are accurate but
  first-lookup grants no retell_boost; pointer_dead →
  orphan_recall.
- **P839 the night's yield (MUST):** consol=+1.5 vs −1.5,
  identical encoding day + identical sleepQuality: same-day
  recall identical (E untouched), +1d recall diverges by
  the consol_beta_mult loading, +7d ordering preserved;
  wake-side params identical (the trait only operates
  inside the consolidation window).
- **P840 the wrong grid (SHOULD):** nav_ab=+1.5
  home_layout=grid vs nav_ab=−1.5 home_layout=organic, both
  living in the Mission's grid: place-cued recall and
  place_reinstate gains favor the grid-matched profile;
  route-anchored whenEstimate tighter in +nav_ab;
  people/face recall identical across all four cells.
- **P841 the leaky monitor (MUST — wmc null locked):**
  schizotyp=+2 vs 0 at matched wmc: bidirectional
  source_confuse_flip errors rise (imagined→performed AND
  said→thought), intrusion and deja_vu rates rise; enc_base,
  beta_*, and wmc-side params identical (Peters 2007's
  control is the falsifier).
- **P842 the gated channel (MUST — context lock):**
  hypnot=+2 vs 0: under guided_imagery+authoritative arms,
  imagine_gain and adoption diverge as priced; under plain
  hearAccount arms the two profiles are IDENTICAL within
  jitter — any ungated difference FAILS (the Wagstaff
  hedge is structural).
- **P843 the deployed strategy (MUST — gate-locked):**
  mnem=+1.5 vs 0: deliberate-encode records show the
  link_p/beta/w_place gains; incidental records from the
  same session identical; deliberate gains persist at +120d
  (Wagner durability); a mnem=+1.5 character who never
  receives deliberate:true events is indistinguishable
  from mnem=0.
- **P844 the tip of which tongue (SHOULD):** langs={es,en}
  dominantLang=es profile reporting in en vs es: tot_rate
  elevated only in the nondominant arm; cognate_ok context
  partially rescues; TOT resolution rate equal in both arms
  (incidence tax, not duration tax).
- **P845 pointer ecology (SHOULD):** a trans_dep=+1.5 AND
  offload=+1.5 profile distributes a 100-event diet across
  {full-encode, partner-pointer, ext-pointer} buckets; total
  internally-held content is LOWER than either single-trait
  profile, but joint/lookup-supported report accuracy is
  comparable — the character is a router, not a store.
- **P846 blunter vs vigil pole (OBSERVE):** the bipolar
  blunt/vigil axis on threat events produces opposite
  intrusion signatures (−pole hypervigilant texture per
  §24, +pole silent texture per §77) with matched
  non-threat behavior — report-only, no band.

## 91. Part VII honest limits

- The transactive and offloading legs model *storage
  location* with pointer fields — the real phenomena include
  directory-update and coordination-cost dynamics (Wegner's
  three TMS components) we compress into one trait +
  one partner field. The orphan_recall phenotype is our
  formalization of bereavement reports, not a measured
  quantity.
- `consol`'s loadings ride the v0.1 consolidation window;
  real spindle physiology interacts with age and sleep
  staging in ways we flatten into two multipliers.
- The hypnot channel is the weakest evidence we have ever
  priced — the loading is small, context-locked, and one
  replication verdict from becoming a third mandated null.
  It stays because the dissociation (hypnotic ≠
  interrogative suggestibility) is itself a documented
  individual difference worth representing.
- `immig_age`'s second window width (a−3 to a+12) is a fit
  to Schrauf & Rubin's small-n distributions; the mechanism
  (novelty + PI release) suggests the leading edge should
  be sharper than the trailing — we did not model the
  asymmetry.
- `blunt` bipolarizes a construct the literature sometimes
  treats as two separable dimensions (monitoring and
  blunting subscales correlate imperfectly); the −0.5
  vigil correlation encodes the bipolar reading. If
  playtests want a high-monitor high-avoider, split the
  axis — don't stretch it.
- Pointer fields create a new record-shape the drift
  catalog (§13.1) must classify: pointer/ext_pointer are
  T-tier (tags) with write-once pointer targets — they
  decay like verbatim but are never rewritten.


# Part VIII — v91: the eighth axis of difference (the chemistry
# and the crowd — intoxication tails, the medicated mind, the
# pressurized choke, the worried well, the face from the other
# group, the imagined future, the pregnant pause, the caffeine
# clock, the gamer's attention, and the third mandated null)

Parts I–VII built the trait layer from ability, affect, clinical
phenotypes, autobiographical tails, ego bookkeeping, and storage
location. Part VIII turns to the axes the earlier parts skipped
because they live in the *state* more than the trait — the
pharmacology of the evening (§92, §93, §100), the situational
pressure that interacts with the trait (§94, §95), and the
complaint that outruns the record (§96, §99). Two axes are
social-structural (§97 cross-group exposure, §101 gaming
history), one is the imagination that shares the remembering
machinery (§98), and §102 is the third mandated null — a trait
the model keeps in the vector *only* to record that training
it doesn't transfer. Every section cites its sources, marks
CONSENSUS / DEBATED / HYPOTHESIS, prices its levers in §7-
compatible params, and ends falsifiable (§106 probes
P958–P969; §105 nulls are the part that can be killed).

Convention reminder: σ-traits are N(0,1) unless noted; [0,2]
traits are one-tailed severities; demographic fields are
bible-set. `state` fields are context, not traits.

## 92. `blackout` — the evening with holes in it (alcohol's
## individual tail)

The acute intoxication *params* exist since v1.9
(`intox_encode_mult`, `intox_state_dep`, and v5.20's
`intox_retro_shield` OBSERVE leg) — but the trait layer never
priced WHY two people at matched BAC leave the party with
different nights. The alcohol-administration literature is
unusually direct: at matched blood-alcohol concentrations,
only *some* drinkers black out (Hartzler & Fromme 2003,
*Alcohol.: Clin. Exp. Res.* 27:628 — placebo-controlled;
Nelson et al. 2004). Fragmentary blackouts — cue-rescuable
gaps — outnumber en bloc (total, permanent) episodes ~3:1 in
heavy-drinking young adults (Hartzler & Fromme 2003, *J. Stud.
Alcohol* 64:547, TLFB). The fragmentary deficit is a
*contextual/source-memory* failure: FB-history drinkers show
differential dlPFC/parietal BOLD under alcohol at matched
task performance (Wetherill & Fromme 2011, *Addict. Behav.*
36:886; Wetherill et al. 2011) — an inherent retrieval
vulnerability, not a bigger dose.

Model — trait `blackout` [0,2] (bible-settable, correlates
with drinking history, NOT with g_mem): under intox ≥
`blackout_bac` (0.6 on the v1.9 intox scale), records are
minted with two failure modes:

- **fragmentary** (default, p = `blackout_frag_p`·blackout):
  the record survives but its source/context fields are
  written thin (source-tier strength ×`blackout_ctx_pen`),
  voluntary retrieval θ is raised by `blackout_theta_pen`,
  and the record carries `frag:true`. The gap is a retrieval
  gap: sufficient cue support (`blackout_cue_rescue` 0.7 —
  other drinkers' accounts, photos, place reinstatement)
  partially rescues it, matching Hartzler & Fromme's "poor
  retrieval" conclusion. Reconstructed fragments carry
  `reconstructed` provenance — a rescued fragment is told-
  back memory, not relived memory.
- **en bloc** (p = `blackout_enbloc_p`·blackout, requires
  intox ≥ `blackout_enbloc_bac` 0.8): the record is never
  minted — att_min fails at encode. No cue rescues it;
  `blackout_rescue_null` locked (en-bloc gaps are gone, not
  hidden — White 2003 NIAAA review). What remains is the
  *inference* of the gap: morning-after narrators routinely
  confabulate into it via §6.9 imagineEvent — which is
  exactly the documented phenomenology.

Locked null `blackout_retro_null`: blackout is anterograde —
records born before intox-onset are never erased by the
drinking that follows. (The *facilitation* leg — post-
encoding alcohol shielding prior learning from interference
— already rides `intox_retro_shield`, OBSERVE tier, v5.20;
Parker et al. 1980/81; Carlyle et al. 2017.)

[CONSENSUS for the trait's existence, the fragmentary/en-bloc
distinction, and the anterograde-only direction; DEBATED for
exact BAC gates and the rescue fraction — cue-rescue in the
lab is assisted recall, and the field's "rescue" is ours by
analogy.]

## 93. `med_burden` — the pill that taxes tomorrow (sedative /
## anticholinergic load)

Two pharmacologies, one trait, because both produce the same
signature — a clean anterograde tax with preserved retrieval
of pre-medication records. Benzodiazepines produce dose-
related *anterograde* amnesia: acquisition impaired, retrieval
of pre-drug material intact or even slightly improved (Curran
1991, *Psychopharmacology* review; Buffett-Jerrott & Stewart
2002 — the retrograde-facilitation cousin of §92's shield).
Cumulative anticholinergic burden predicts incident cognitive
impairment in community-dwelling elders (Gray et al. 2015,
*JAMA Intern. Med.* — ≥3y cumulative use, adjusted dementia
HR ~1.5; Fox et al. 2011 — anticholinergic burden score
predicts 2y memory decline; Campbell et al. 2009).

Model — trait `med_burden` [0,2] (bible-set; 0 = none,
1 = nightly sleep-aid / anxiolytic regular, 2 = high
anticholinergic load): while `med_burden > 0`, records are
born with E ×(1 − `med_antro_tax`·med_burden) and source-tier
strength ×(1 − `med_source_pen`·med_burden). Both effects are
anterograde only — locked null `med_retro_null`: no operator
may degrade a record that predates the medication window.
Loadings additionally tax `search_breadth` (−1·0.1/σ scaled
by burden — sedation, not aging) and `ret_noise` (+0.02/σ).
Critically the burden is *state-shaped*: a character who
stops the medication recovers the encoding side within the
med-washout window (`med_washout` 3d), matching the acute-
vs-chronic dissociation (Curran 1991 acute; Gray 2015's
cumulative leg we price as a slow `aging_rate` addend
+0.05·med_burden — DEBATED causal).

[CONSENSUS anterograde-direction and preserved-retrieval
dissociation; DEBATED the cumulative → dementia path (HR
associational); HYPOTHESIS the washout window.]

## 94. `eval_press` — the choke that picks on the strong
## (pressure × ability interaction, not a trait)

The surprise of the pressure literature is the sign. High-
working-memory individuals choke *more* under evaluative
pressure — the very people the task normally favors lose
their advantage precisely when the stakes rise (Beilock &
Carr 2005, *JEP:General* 134 — high-pressure math splits the
WMC groups; DeCaro, Thomas, Albert & Beilock 2011 — pressure
degrades high-WMC performance on strategy-demanding tasks;
Gimmig et al. 2006). The mechanism-priced reading: pressure
doesn't shrink capacity, it *spends* it — worry and
situation-monitoring occupy the same wmc the task needs
(Eysenck, Derakshan, Santos & Calvo 2007, *Emotion* 7:336 —
attentional control theory; Beilock 2008 math-anxiety
mediation).

Model — context flag `eval_press:true` on events (auditions,
public confrontations, observed performance — world-supplied;
never ambient): during eval_press events, all wmc-driven
loadings are taxed ∝ the character's OWN wmc level:
`choke_k`·wmc⁺ — the regression-to-mean paradox. A wmc=+1.5
character loses more discrimination, source-monitoring, and
interference-resistance than a wmc=−1 character, who had less
to lose. Param `choke_wmc_k` (0.5) scales the interaction;
`choke_gate` (0.6) is the minimum stake/novelty the world must
supply. Locked null `choke_lowstake_null`: below the gate the
interaction is zero — pressure without stakes doesn't choke
anyone (the effect needs the evaluation, not the arousal —
arousal narrowing already lives in `arousal_narrowing`).

[CONSENSUS for the high-WMC paradox direction and the
attentional-control mechanism; DEBATED for the transfer to
*memory encoding* specifically — most choke studies price
performance, not storage; our loading is the hypothesis
extension, flagged.]

## 95. `att_ctl` — the trait underneath the anxiety
## (control as its own axis)

Attentional control theory's individual-difference payload is
that anxiety's memory cost is *mediated by control*, not by
worry directly: trait attentional control (Attentional Control
Scale; Derryberry & Reed 2002) predicts how much of one's wmc
survives under load, and low att_ctl is the channel through
which trait anxiety reaches performance (Eysenck et al. 2007;
Berggren & Derakshan 2013 review). Two people at identical
`neurot` differ in whether the worry actually lands on the
encoding.

Model — trait `att_ctl` N(0,1), positively correlated with
wmc but distinct (r +0.5 — control is measured by self-
regulation, not capacity). Loadings: `att_min` resilience
under `stress`-state and `anx`-state events (+0.06/σ — the
floor moves less); `ret_noise` under eval_press (−0.02/σ);
`plist_suppress` resistance small; `search_breadth` under
load retained. `att_ctl` is the buffer `wmc` lacks: wmc is
how much you hold, att_ctl is whether worry gets into it.

[CONSENSUS that att_ctl moderates anxiety's cognitive cost;
HYPOTHESIS per-param routing — the literature prices task
performance, our split is the model's guess.]

## 96. `scd` — the worried well (complaint without deficit)

Subjective cognitive decline is a formal phenotype: self-
reported memory worsening *with objective performance in the
normal range* (Jessen et al. 2014, *Alzheimers Dement.*
SCD-I criteria; Rabin et al. 2017, *Alzheimers Dement.* —
SCD prevalence ~1 in 4 older adults; associated with worry/
depressive affect more than with measured decline; small but
real elevated conversion risk — the phenotype is real even
when the deficit isn't). The memory-sim lesson: complaint
and accuracy are *different channels*, and a whole class of
character lives in the gap.

Model — trait `scd` [0,1] (bible-set; correlates neurot +
0.4, meta_conf −0.5, checker +0.3): `scd_complaint_gain`
(0.6) multiplies the complaint surface (self-report snippets,
worry mentions); `scd_worry_intr` (0.1) adds a light
intrusion weight on health/evaluative-cued involuntary
recall; and the hard boundary — locked null `scd_obj_null`:
`scd` may NOT touch E, β, θ, or any accuracy-side param. The
character *feels* worse without performing worse. (When the
bible wants real decline it pins `aging_rate`/`reserve` —
scd is the phenotype where they don't.) The interaction
that matters: scd × eval_press raises `choke` cost via the
worry channel — the worried well can spend their way into a
real deficit on stage, which is exactly Berggren &
Derakshan's point.

[CONSENSUS the complaint-accuracy dissociation and its
affective correlates; DEBATED the conversion-risk size —
we price zero objective signal, which is the phenotype's
definition, not a bet against the risk.]

## 97. `cross_exp` — the face from the other group (own-group
## bias as an exposure trait)

The own-race bias is one of face memory's most replicated
findings: own-group faces are remembered better than other-
group faces (Meissner & Brigham 2001, *Psychol. Public Policy
Law* 7:3 meta — ORB ~1.4× recognition advantage across 39
studies), with a matching out-group false-alarm cost. The
malleable part is *exposure*: cross-group contact/experience
attenuates the bias (Meissner & Brigham 2001 — contact
hypothesis support moderate; Rhodes, Hayward & Winkler 2006;
Wright, Boyd & Tredoux 2003 — own-group bias grows with
segregation). The own-age bias is the smaller sibling
(Rhodes & Anastasi 2012, *Psychol. Bull.* meta — own-age
recognition advantage, smaller and less consistent than
own-race; we price it at half strength).

Model — trait `cross_exp` [0,2] (bible-set from biography —
neighborhood composition, workplace, relationships; Mission
District characters get honest distributions): face/identity
records on out-group targets are encoded with familiarity
accrual ×(1 − `orb_face_pen`·(1 − `orb_expo_k`·cross_exp)),
out-group false-alarms +`orb_fa_gain`·(1 − same rescale).
The exposure term is the trait's point: `orb_expo_k` 0.6 —
a maximally cross-exposed character keeps ~60% of the bias
reduction the literature reports. Locked null
`orb_content_null`: ORB touches face/identity tiers ONLY —
episodic content, actions, and verbatim fields are
unaffected (the bias is in face processing, not in what
people did — Meissner & Brigham's tasks are recognition
tasks). `orb_age` flag (0.5 weight) rides the same loadings
for age-group mismatches (Rhodes & Anastasi 2012).

[CONSENSUS for ORB existence and direction incl. the FA
asymmetry; DEBATED for the contact-attenuation size —
correlational; the [0,2] exposure scaling is HYPOTHESIS.]

## 98. `sim` — the imagination that shares the machinery
## (episodic simulation trait)

Remembering and imagining the future are the same system:
episodic detail in recalled events and in constructed future
events correlate within person (Addis, Wong & Schacter 2007,
*Neuropsychologia* — older adults' episodic-detail loss hits
memory AND future simulation together; Schacter & Addis
2007 constructive episodic simulation hypothesis; Race,
Keane & Verfaellie 2011 — amnesics impoverished in both).
The individual-difference consequence: a character rich in
episodic detail should also construct rich plans, fears,
and daydreams — and the deficit direction holds too (§64
sdam already produces thin futures; `sim` generalizes it).

Model — trait `sim` N(0,1), correlated with vivid +0.4 and
g_mem +0.3 (shared episodic substrate): future-oriented
records (plan, anticipate, dread, daydream — minted via
existing imagineEvent with `future:true`) inherit detail
density ∝ `sim` — `sim_detail_link` (0.5) is the coupling
coefficient between a character's specificity and their
future-detail. The esi coupling (v5.34 `esi_gain`) is the
bridge: episodic-specificity-induction effects ride the
same axis (Madore & Schacter 2014 — ESI lifts BOTH recall
detail and simulation detail; a single substrate move).
Locked null `sim_content_null`: simulation detail cannot
manufacture *content accuracy* — a high-sim character
imagines richly and is wrong richly (the system shares
machinery, not truth — Schacter & Addis's own adaptive-
error argument).

[CONSENSUS the memory-simulation coupling; DEBATED whether
trait sim exists apart from episodic ability — we price it
separable-but-correlated, falsifiable via P965's partial-
correlation arm.]

## 99. `preg_state` — the pause that's smaller than the
## complaint (baby brain, priced honestly)

The complaint is real and the deficit is real — but the
deficit is *small*, trimester-shaped, and stays inside the
normal range. The meta-analysis is the honest source:
Davies, Lum, Skouteris, Byrne & Hayden 2018 (*Med. J.
Aust.* 208:35 — 20 studies, 709 pregnant / 521 control:
overall SMD 0.52 [0.07–0.97]; third-trimester memory SMD
~1.47 cross-sectionally, but longitudinal declines develop
T1→T2 and the authors stress performance remains within
normal ranges; ~4/5 women report subjective changes).
Complaint ≫ effect — the subjective-objective gap is the
phenomenon, like §96 and like v5.36's mt_complaint for the
menopause transition (Greendale et al. 2009 SWAN).

Model — state field `preg_state` ∈ {0,1,2,3} (world-set;
trimester): records born in trimester t encode with E
×(1 − `preg_enc_dip`·preg_trim_w[t]) where
preg_trim_w = [0, 0.6, 1.0] (T1, T2, T3 weighting — the
meta-analytic shape, not a linear ramp); executive-side
params tax `preg_exec_dip` on search_breadth and att_min
resilience only in T3. Complaint surface rides
`preg_complaint` (0.8 — the 4/5 subjective share),
independent of whether any objective tax fired — the
character who encodes normally still *reports* fog.
Locked nulls: `preg_perm_null` — no permanent deficit
parameter; the dip ends with the state (postpartum
resolution; long-term gray-matter findings — Hoekzema
2017 — exist but do not map to measurable memory loss in
our sources, so we don't pay for them); `preg_theta_null`
— retrieval of pre-pregnancy records untouched (the dip
is at the door, like §93).

[CONSENSUS the effect is real, small, T3-weighted, and
complaint-heavy; DEBATED mechanism (hormonal vs sleep vs
load — we don't adjudicate); the exact weights are
HYPOTHESIS-fitted to the meta-analytic shape.]

## 100. `caff` — the clock in the cup (dependence, not boost)

Caffeine's honest memory story is the withdrawal-reversal
account: habitual consumers don't get a boost — they get a
*penalty while abstinent*, and the "benefit" of the morning
cup is removing a self-imposed tax (Rogers & Dernoncourt
1998, *Pharmacol. Biochem. Behav.*; James & Rogers 2005;
Rogers et al. 2013). Acute caffeine state-dependency for
memory is weak and contested (Kelemen & Creeley 2003 found
state-dependent effects; larger literatures mostly null —
DEBATED, we price tiny).

Model — trait `caff` [0,2] (habitual dependence level):
- `caff_wd` state (world-set: >18h since habitual dose):
  `ret_noise` +`caff_wd_tax`·caff, `theta` +0.03·caff,
  `search_breadth` −1·0.05·caff — the withdrawal tax that
  IS the dependence effect.
- `caff_state_dep` (0.02): tiny w_msd-style bonus for
  caffeinated-state matching — deliberately near the floor,
  flagged DEBATED.
- Locked null `caff_ability_null`: `caff` never touches
  E0/β/θ baselines while dosed — habitual caffeine is
  baseline-neutral (Rogers' reversal logic: on-drug
  performance is the reference, not an enhancement).

[CONSENSUS withdrawal-reversal is the dominant account;
DEBATED the residual state-dependency — priced near zero
on purpose.]

## 101. `gamer` — the reflexes that don't carry (small, and
## told to stay small)

Action-video-game experience is the strongest candidate in
the "habit shapes cognition" literature and the honest
verdict is *small and channel-locked*: habitual action
gamers outperform on top-down attention and spatial
cognition (Bediou, Adams, Mayer, Tipton, Green & Bavelier
2018, *Psychol. Bull.* 144:77 — cross-sectional g≈0.55,
intervention g≈0.34, with publication-bias inflation ~30%
and the boot/Simons critique hanging over causal claims —
Boot, Blakely & Simons 2011; Hilgard, Engelhardt & Rouder
2017 Bayesian re-analyses). What the literature does NOT
support is a general episodic-memory advantage.

Model — trait `gamer` [0,2] (habitual action-gaming):
loadings restricted to the channels the meta-analysis
endorses — `att_min` −0.01·gamer (slightly easier floor
on fast visual events), `w_place` +0.02·gamer (spatial
cue weight), `sensory` visual-field detail +`gamer_vis_k`
(0.03). Locked null `gamer_episodic_null`: no loading may
touch E0, β, θ, link_p, or any episodic-content param —
the attention advantage does not buy a better store
(Bediou's own domain map puts episodic memory outside the
gains; the episodic store doesn't know about your K/D).

[CONSENSUS direction on attention/spatial, small effects;
DEBATED causality — we price as correlation (trait, not
treatment); HYPOTHESIS which of our params best maps their
domains.]

## 102. `braintrain` — the third mandated null (training that
## doesn't travel)

The verdict on cognitive training is unusually clean for
this field: practice on memory tasks improves performance
*on those tasks*, and transfer to untrained abilities —
"far transfer," the thing a general `g_mem` loading would
be — is not supported (Simons, Boot, Charness, Gathercole,
Chabris, Hambrick & Stine-Morrow 2016, *Psychol. Sci.
Public Interest* 17:103 — the definitive review: brain-
game claims outrun evidence; Melby-Lervåg & Hulme 2013,
*Dev. Psychol.* — WM training: near transfer yes, far
transfer no, no maintenance; Shipstead, Redick & Engle
2012; Owen et al. 2010, *Nature* — 11,430-participant
RCT: trained gains, zero transfer). This joins
`birth_order` (§58) and `learn_style` (§71) as a documented
null kept *in the vector* on purpose — because bibles and
players will reach for it.

Model — `braintrain` ∈ [0,2] exists in IndivTraits with
**every loading fixed 0.0** except a single frozen near-
transfer channel: `nt_xfer` (0.15) may boost performance
on the *specific trained task family* only — mnemonic
drill improves the drill, never the store. Locked null
`braintrain_far_null`: no parameter may be raised by
`braintrain` except through `nt_xfer`'s task-locked gate.
A character who does memory exercises every morning is
indistinguishable from one who doesn't — except at the
exercises. P969 probes the absence.

[CONSENSUS — this is among the best-documented nulls in
the applied literature.]

## 103. Cross-version interactions (audit)

- **blackout × intox_* (v1.9/v5.20):** the trait scales,
  the params gate — `blackout` without intox ≥ bac is
  inert; intox without `blackout` yields the population
  floor rates only. `intox_retro_shield` is untouched
  (anterograde-direction consistency: shield and blackout
  never overlap on a record).
- **med_burden × sleep/consol (§81):** sedative load often
  *improves* reported sleep while taxing encoding — corr
  med_burden·sleep −0.1 is intentionally small; the
  trade-off is the point (subjective rest, objective tax).
- **eval_press × stereo_suscept (v? age-decline §):
  stereotype threat already exists — eval_press is the
  STAKES gate; stereo_salience is the IDENTITY gate. They
  multiply on an elder being publicly evaluated — both
  gates required for the full documented effect, either
  alone yields its own half. No param shared; check P961
  keeps them separable.
- **att_ctl × neurot (§2.3):** neurot supplies the worry,
  att_ctl decides if it lands — corr +0.5 to wmc, −0.3 to
  neurot; identical neurot, split att_ctl = split outcomes.
- **scd × meta_conf (§17):** scd is the phenotype-level
  expression — meta_conf −0.5 is the population pull; a
  bible may pin high scd with neutral meta_conf for a
  specifically-memory-anxious character. Aging real
  decline rides aging_rate/reserve, never scd.
- **cross_exp × face_ability (§20):** ability is the
  store, exposure is the bias — a super-recognizer can
  still show ORB; the loadings multiply on out-group
  targets only. `orb_content_null` keeps them tier-clean.
- **sim × sdam/hsam (§63–64):** sim is the continuous
  axis, the tails clamp it — hsam sim is high by
  construction (shared substrate); sdam sim is low
  (thin futures documented, §"thin futures" v87 — this
  formalizes the earlier qualitative claim).
- **preg_state × task_load (§55):** the dip is
  *additive* with busy-day load — pregnancy taxes are
  encoded on top of, not instead of, state load. Watch
  the sum vs clamps.
- **caff × chronotype (§2):** withdrawal compounds a
  mismatched morning — the params are independent
  (state vs phase) and both fire; no special-casing.
- **gamer × media_m (§51):** media_m is the *cost* axis
  (split-attention habit), gamer the *trained-attention*
  axis — correlating +0.15 only; a character can be
  both (the literature's multitasking gamers are not a
  contradiction).
- **braintrain × mnem (§85):** the mandated null and
  the priced skill are NOT in tension — mnem prices
  *strategy deployment on real material* (Wagner 2021
  durability), braintrain-null prices *far transfer
  from drill*. Both are simultaneously true in the
  literature; P969 vs P843 is the check.

## 104. Extended trait vector, R additions, loading table
## (Part VIII)

```json
IndivTraits += {
  "blackout":   0.0,   // §92 — alcohol-vulnerability tail [0,2]
  "med_burden": 0.0,   // §93 — sedative/anticholinergic load [0,2]
  "att_ctl":    0.0,   // §95 — attentional control (ACS)
  "scd":        0.0,   // §96 — subjective-decline phenotype [0,1]
  "cross_exp":  0.0,   // §97 — cross-group exposure [0,2]
  "sim":        0.0,   // §98 — episodic simulation ability
  "caff":       0.0,   // §100 — habitual caffeine level [0,2]
  "gamer":      0.0,   // §101 — action-gaming history [0,2]
  "braintrain": 0.0,   // §102 — DOCUMENTED NULL (near-xfer only)
  // state fields (not traits):
  //   preg_state {0,1,2,3}, caff_wd 0|1, eval_press ctx flag
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
blackout·stress      +0.15  (drinking-history composite — sampling)
blackout·early_adv   +0.20  (co-traveling risk — sampling corr)
med_burden·aging_rate +0.15 (medicated skews older — sampling)
med_burden·sleep     −0.10  (sedated rest ≠ good sleep)
att_ctl·wmc          +0.50  (control vs capacity — CONSENSUS dir.)
att_ctl·neurot       −0.30  (anxiety cost mediated — Eysenck 2007)
scd·neurot           +0.40  (Rabin 2017 — CONSENSUS dir.)
scd·meta_conf        −0.50
scd·checker          +0.30
cross_exp·social     +0.20  (exposure tracks contact — sampling)
sim·vivid            +0.40  (shared imagery — CONSENSUS dir.)
sim·g_mem            +0.30  (shared episodic substrate — Addis)
sim·open             +0.20
caff·chronotype      +0.15  (evening types lean on the cup — sampling)
gamer·media_m        +0.15  (habit overlap — sampling)
gamer·nav_ab         +0.15  (spatial channel — CONSENSUS dir.)
braintrain·*         0.0    (mandated — see §102)
```

### Loading table additions (rows beyond §88)

| trait | param | loading | tier / source |
|---|---|---|---|
| blackout | frag-mint p under intox≥gate | ·+0.6·b | CONSENSUS (Hartzler & Fromme 2003) |
| blackout | source-tier ×(1−ctx_pen), θ+pen | ctx 0.4, θ 0.15 | CONSENSUS dir. (Wetherill 2011) |
| blackout | en-bloc mint p (intox≥0.8) | ·+0.15·b | CONSENSUS (3:1 frag:enbloc) |
| med_burden | E ×(1−antro_tax·m), src ×(1−pen·m) | tax 0.25, pen 0.3 | CONSENSUS (Curran 1991; Gray 2015) |
| med_burden | search_breadth / ret_noise | −0.1/σ, +0.02/σ | CONSENSUS dir. (sedation) |
| med_burden | aging_rate addend | +0.05·m | DEBATED (Gray 2015 associational) |
| eval_press | wmc-loadings ×(1−choke_k·wmc⁺) | k 0.4·gate | CONSENSUS dir. (Beilock & Carr 2005) |
| att_ctl | att_min under stress/anx ctx | −0.06/σ tax-reduction | CONSENSUS dir. (Derryberry 2002) |
| att_ctl | ret_noise under eval_press | −0.02/σ | CONSENSUS dir. |
| scd | complaint surface / worry intr | +0.6·s / +0.1·s | CONSENSUS (Jessen 2014; Rabin 2017) |
| scd | (all accuracy params) | 0.0 — LOCKED | CONSENSUS (phenotype def.) |
| cross_exp | orb rescale (1−expo_k·x) | expo_k 0.6 | DEBATED (contact lit.) |
| (orb mech) | out-group fam ×(1−pen)/fa +gain | pen 0.3, gain 0.15 | CONSENSUS (Meissner & Brigham 2001) |
| sim | future-record detail ∝ specificity | link 0.5 | CONSENSUS (Addis 2007; Madore 2014) |
| preg_state | E ×(1−dip·w[t]), exec T3 | dip 0.15, exec 0.1 | CONSENSUS shape (Davies 2018) |
| preg_state | complaint share | 0.8 | CONSENSUS (4/5 subjective) |
| caff | caff_wd state: noise/θ/breadth | tax 0.08·c | CONSENSUS (Rogers 1998) |
| caff | state-dep w_msd add | +0.02·c | DEBATED (Kelemen 2003) |
| gamer | att_min / w_place / vis detail | −0.01/+0.02/+0.03 | CONSENSUS dir., small (Bediou 2018) |
| gamer | (episodic params) | 0.0 — LOCKED | CONSENSUS domain-map |
| braintrain | nt_xfer task-locked only | +0.15 frozen | CONSENSUS (Simons 2016) |
| braintrain | (all else) | 0.0 — LOCKED | CONSENSUS (Melby-Lervåg 2013) |

## 105. New explicit nulls (Part VIII's falsifiable edge)

- `blackout_retro_null`, `blackout_rescue_null` (en-bloc
  arm): the drinking erases forward only; en-bloc gaps
  are gone, not archived (P958).
- `med_retro_null`: the pill taxes tomorrow, never
  yesterday (P960).
- `choke_lowstake_null`: pressure without stakes chokes
  no one (P961).
- `scd_obj_null`: complaint may never touch accuracy
  (P963).
- `orb_content_null`: group bias lives in the face tiers
  only (P964).
- `sim_content_null`: rich imagination buys detail, not
  truth (P965).
- `preg_perm_null`, `preg_theta_null`: the dip ends with
  the state, and it never reaches backward (P966).
- `caff_ability_null`: dosed performance is reference,
  never enhanced (P967).
- `gamer_episodic_null`: attention doesn't buy a store
  (P968).
- `braintrain_far_null`: drill improves the drill — the
  third mandated null (P969).

## 106. Falsifiable probes (P958–P969; validation-design §186)

- **P958 the holes in the evening (MUST — rescue
  split):** blackout=+1.5 vs 0, intox=0.7 identical
  nights: fragmentary records carry frag:true, source
  fields thin, θ up — and cue-supported recall rescues
  ~`blackout_cue_rescue` fraction as `reconstructed`;
  en-bloc records absent under ANY cue (rescue_null);
  pre-drinking records identical across arms
  (retro_null); sober-history performance identical
  (the trait only operates under intox).
- **P959 the shield beside the hole (OBSERVE):** events
  encoded pre-drinking in intox≥0.3 nights accrue less
  next-day interference than sober-night controls
  (v5.20's Parker leg) WHILE the same night's
  intox-encoded events carry the gap — the two effects
  must coexist on one timeline.
- **P960 the honest pill (MUST — direction-lock):**
  med_burden=1.5 vs 0: records born during burden show
  the E/source tax; records born pre-burden identical
  (retro_null); post-washout (≥med_washout) encode arms
  converge; aging_rate addend drifts only the long
  slope.
- **P961 the expensive advantage (MUST — interaction):
  ** wmc=+1.5 vs −1.5 at matched g_mem, eval_press on
  vs off: high-wmc loses MORE discrimination/source/
  interference performance under pressure; below
  choke_gate both arms identical (lowstake_null);
  arousal_narrowing unchanged (the choke is not the
  arousal).
- **P962 the landing pad (SHOULD):** neurot=+1.5 held,
  att_ctl −1.5 vs +1.5: stress-state encoding tax and
  eval_press noise both diverge; baseline (no stress,
  no pressure) arms identical — att_ctl buffers only
  under load.
- **P963 the worried well (MUST — locked null):**
  scd=1 vs 0 at identical g_mem/aging_rate/reserve:
  complaint surface and worry intrusions rise, ALL
  accuracy-side measures identical within jitter —
  any E/β/θ difference FAILS (scd_obj_null). Bonus
  arm: scd × eval_press spends real wmc via choke —
  the felt deficit can self-fulfill on stage.
- **P964 whose face (SHOULD — tier-lock):** cross_exp=0
  vs +2: out-group face familiarity gap and out-group
  FA rate both shrink by ~orb_expo_k; episodic content
  about out-group people identical (orb_content_null);
  own-age arm shows the half-weight effect.
- **P965 the shared machinery (SHOULD):** sim=+1.5 vs
  −1.5: future:true records' detail density tracks
  recall specificity (partial corr with vivid/g_mem
  controlled); content accuracy identical across arms
  (sim_content_null) — detail and truth must decouple.
- **P966 the third-trimester shape (SHOULD):**
  preg_state 0→1→2→3 sequence: E-dip follows
  preg_trim_w shape (T3-weighted, not linear);
  complaint surface fires in T1–T3 independently of
  any objective tax; post-state records recover
  (perm_null); pre-pregnancy retrieval identical
  (theta_null).
- **P967 the morning reference (SHOULD — reversal
  account):** caff=1.5: caff_wd state taxes noise/θ/
  breadth; dosed state returns all three to baseline —
  never above (caff_ability_null); state-dep bonus arm
  measured and expected small (DEBATED).
- **P968 the trained reflex (SHOULD — channel-lock):**
  gamer=+2 vs 0: fast-visual att floor and spatial cue
  weight shift, episodic E/β/θ identical within jitter
  (gamer_episodic_null); any link_p or specificity
  difference FAILS.
- **P969 the drill that doesn't travel (MUST — locked
  null):** a 30-session training:mem regimen on
  braintrain=+1.5: trained-task performance improves
  (nt_xfer), EVERY other measure identical to the
  no-training arm within jitter (braintrain_far_null)
  — and P843's mnem comparison runs in the same suite
  to prove the skill/null distinction holds.

## 107. Part VIII honest limits

- The blackout trait compresses two literatures:
  Hartzler & Fromme's etiology work says fragmentary
  blackouts are *retrieval* failure — our model writes
  thin source fields + raised θ, which is a storage-
  flavored implementation of a retrieval claim. The
  behavioral signature matches; the mechanism label
  is ours.
- `choke`'s extension from task performance to memory
  encoding is a hypothesis, not a citation — Beilock's
  math studies don't measure what gets stored. P961
  can falsify the extension.
- `med_burden` merges two pharmacologies (benzo +
  anticholinergic) that differ in receptor and
  phenomenology; the shared anterograde signature
  justifies one trait at our granularity, but a bible
  wanting *benzodiazepine specifically* should note it
  — the cumulative `aging_rate` leg (Gray 2015) is
  associational and stays DEBATED.
- `cross_exp` treats exposure as one axis; the contact
  literature distinguishes quality vs quantity and the
  own-age bias is thinner (Rhodes & Anastasi's meta is
  half the size of the own-race one). The expo_k=0.6
  rescale is a fit, not a finding.
- `sim` is priced separable-but-correlated with g_mem —
  the constructive-episodic-simulation literature
  *itself* is split on whether they're one factor.
  P965's partial-correlation arm is the honest test.
- `preg_state`'s weights are meta-analytic SHAPE
  (T3-weighted, complaint-heavy); the mechanism could
  be sleep disruption (which would argue for routing
  through the `sleep` trait instead) — we kept a
  dedicated state because the complaint-accuracy
  decoupling needs its own lever.
- `caff`'s state-dependency arm is priced near zero
  against a mostly-null literature — if future work
  revives it, the param is already there at the floor.
- `gamer` and `braintrain` together encode the field's
  two-sided verdict: genre-matched habits move their
  channels a little (Bediou), generic drill moves
  nothing (Simons). If the next big meta-analysis
  flips the causality verdict on action games, `gamer`
  is one commit away from joining `braintrain` as a
  fourth null — the trait slot stays either way.


# Part IX — v103: the ninth axis of difference (the tax and the
# step — states that rent the machinery, injuries that reset it,
# the bookkeeping quirks, and the fourth mandated null)

Eight parts have built the trait vector outward — capacity,
personality, language, neurodivergence, clinical phenotypes,
lived-in bookkeeping, offloading, chemistry. What remains
uncovered is a specific class: **circumstantial states that tax
or step the machine without changing who the character IS**,
plus a handful of bookkeeping traits that survived every prior
audit, plus one more popular enhancement claim the evidence
refuses. A broke month, a checking habit, an interrupted night,
a week in the ICU, a mood swing, a newborn, a chemo course, a
felt age, a camera habit, a wandering mind, a savoring streak,
and a dosing regimen that does nothing — thirteen ways two
characters with identical trait vectors still won't remember
the same week.

## 108. `scarc` — the bandwidth tax that tunnels (state, not trait)

**Consensus:** scarcity consumes cognitive control, measurably
and reversibly. Mani, Mullainathan, Shafir & Zhao 2013
(*Science* 341:976 — verified): sugarcane farmers' fluid
performance drops **before** harvest (poor) and recovers after
(rich) — the same person, ~13-IQ-point equivalent swing; a New
Jersey mall arm: contemplating an expensive car-repair bill
degraded poor shoppers' performance, a cheap one did not.
Shah, Mullainathan & Shafir 2012 (*Science* 338:682): scarcity
doesn't just tax — it **tunnels**: focus on the scarce
commodity improves while everything outside the tunnel pays
the fare (attentional capture, neglect of the periphery).

**Model:** `scarc` ∈ [0,1] — a **world-supplied state**
(ledger-side financial strain; the substrate mints it from
rent-shortfall/debt events, not the bible). Two legs:
(a) tax — all wmc-loadings (encoding depth under
`div_attention`-class contexts, PM self-initiation,
search_breadth) ×(1 − `scarc_wmc_tax`·scarc), `scarc_wmc_tax`
0.2; PM self-initiation takes an extra `scarc_pm_tax` (0.15)
— the unpaid bill eats the intention buffer first.
(b) tunnel — events carrying `stressor:true` (the scarce
domain itself: the bill, the shift, the pawnshop) encode
×(1 + `scarc_tunnel_gain`·scarc), gain 0.25. The broke
character remembers the *debt* vividly and drops the
conversation held next to it.

**Locked `scarc_trait_null`:** `scarc` is state-gated —
identity never enters. Same character, `scarc` 0.9→0.1 →
wmc-loadings recover fully (the farmers). No bible pins it.

## 109. `chk_loop` — the checking paradox (mechanism on `checker`)

**Consensus:** the `checker` trait (Part IV) prices *who*
checks; the literature also prices what checking *does to the
record*. van den Hout & Kindt 2003 (*Behav. Res. Ther.*
41:301 — verified, two experiments on the virtual stove):
repeated checking leaves memory **accuracy intact** but
degrades its vividness, detail, and the checker's confidence
in it — familiarity promotes conceptual processing, which
inhibits perceptual re-encoding. 2004 (*J. Behav. Ther. Exp.
Psychiatry* 35:165 — five experiments): the shift is
remember→know — "the memory is there, but it isn't definite."
Hermans et al. 2008; Radomsky et al. 2014 — the loop feeds
itself: eroded confidence motivates the next check.

**Model:** when a character re-verifies a self-action record
(re-checks the stove, re-asks the partner, re-reads the sent
message — world supplies `recheck` events referencing the
record id), the record's **reported** vividness/detail decay
×(1 − `chk_vivid_erosion`·checker) per check (0.15),
reported confidence ×(1 − `chk_conf_erosion`·checker) (0.2),
and the remember/know tag drifts toward `know` at
`chk_know_shift`·checker (0.3/check, asymptotic).
`accuracy` never moves. The checker's urge to re-check
scales with the *eroded* confidence — the loop is emergent,
not scripted.

**Locked `chk_acc_null`:** no number of rechecks changes
field accuracy — erosion is phenomenal/metacognitive only.
This is the finding (accuracy stayed intact across all vdH&K
experiments), and it is the cleanest confidence-accuracy
decoupling in the model since `cinfl_*`.

## 110. `apnea` — the night that never consolidates (trait)

**Consensus direction, magnitudes debated:** obstructive
sleep apnea fragments sleep architecture and adds intermittent
hypoxia; the memory signature is impaired episodic
consolidation plus executive/pspeed drag, partially reversible
with CPAP. Canessa et al. 2011 (*J. Sleep Res.* 20 — gray-
matter reduction in hippocampal/executive regions, partially
reversed after 3 months CPAP); Djonlagic et al. 2021 (*JAMA
Netw. Open* 4:e212537 — sleep-disordered breathing associated
with Alzheimer's biomarker burden); Leng et al. 2017;
Bubu et al. 2020 meta. This is a **trait**, not the `sleep`
state: apnea is every night, untreated-or-treated, for years.

**Model:** `apnea` ∈ [0,2], bible-set (body-type/age
correlated; ~1/3 of older male mains at clinical levels).
Three legs: (a) `consol_beta_mult` ×(1 +
`apnea_consol_tax`·a) (0.15) — nightly consolidation yields
less; (b) `sws_mult` ×(1 − `apnea_sws_cut`·a) (0.2) — the SWS
channel specifically, which is the episodic one;
(c) `ret_noise`/`iiv_sigma` += `apnea_iiv`·a (0.02) —
daytime sleepiness is inconsistency, not flat loss.
Treatment state `apnea_treated:true` rescues ~half the legs
(`apnea_cpap_rescue` 0.5) — Canessa's partial reversal,
never full.

**Locked `apnea_overnight_null`:** a single treated night
repairs nothing — the rescue is cumulative over ~90 days
(Canessa's timescale). The acute `sleep` state stays
orthogonal: an apneic with a good subjective night still
consolidates poorly.

## 111. `delirium` — the step nobody prices (state → residue)

**Consensus:** age-decline.md §95 already prices
`hosp_step` (hospitalization accelerates decline) but
explicitly flags the gap: "no delirium/acute-confusion state
under hospitalization." The literature says the step is
mediated by *delirium duration*. Pandharipande et al. 2013
(*NEJM* 369:1306 — BRAIN-ICU, verified): delirium duration in
ICU independently predicted global-cognition deficit at 3 and
12 months — ~40% of survivors at ~1.5 SD below age norms at 3
months; Girard et al. 2010; Marcantonio 2017 review.
Delirium is also **encoding silence**: the episode itself
writes almost no records (phenomenology of the ICU — patients
report fragments, delusions, or nothing).

**Model:** world supplies `delirium:{onset, offset, severity}`
on top of `hosp` events. Two legs: (a) **window** — encoding
during delirium mints only `frag:true` fragments at
`delir_enc_floor` (0.05) of normal E, source fields empty;
delusional fragments mint at `delir_dream_p` (0.15) with
`fuzzy:true` provenance (ICU delusion memories are real —
patients remember nightmares, not procedures). (b)
**residue** — at offset, `age_eff += delir_step·days`
(`delir_step` 0.15 age-years per delirious day, cap
`delir_step_cap` 3y) — dose-ordered, permanent, stackable
with `hosp_step` (delirium is the mediator, not the
alternative).

**Locked `delir_retro_null`:** pre-admission records are
untouched — the step is forward-only like `tbi`'s Ribot
gradient is backward-only.

## 112. `bipolar` — the swing phenotype (clinical trait)

**Consensus direction:** euthymic bipolar patients carry a
moderate, persistent verbal-memory/executive deficit
(Bourne et al. 2013, *Acta Psychiatr. Scand.* 128:149 meta —
d ≈ 0.4–0.7 across domains; Cullen et al. 2016 UK Biobank);
episodes add state legs — manic encoding is fast, social,
thin-contextualized; depressive encoding inherits `depr`'s
overgeneral shape (§34). Inter-episode impairment correlates
with episode *count*, not current symptoms (Robinson &
Ferrier 2006 — each episode accrues a small residue).

**Model:** `bipolar` ∈ [0,2], bible-set, max ~1 per cast
(prevalence honesty). Baseline leg: episodic E and
`search_breadth` ×(1 − `bip_euthymic_tax`·b) (0.1 — the
euthymic residue, present between episodes).
State legs consume `C.mood` extremes: `C.mood ≥ +0.7`
(hypomanic ctx) → `w_nov`/`w_people` ×(1 +
`bip_mania_reach`·b) (0.3) while `w_topic`/source-field
completeness ×(1 − `bip_mania_thin`·b) (0.2) — wide but
shallow records, the party remembered as light not content.
`episode_count` (world/bible-supplied integer) adds
`bip_ep_residue`·n (0.02 each, cap 0.2) to the euthymic tax —
the scar tissue is cumulative.

**Locked `bip_creat_null`:** the romantic claim —
bipolar→creative advantage — gets no encoding or retrieval
bonus. The phenotype costs; it does not compensate
(CONSENSUS direction; the creativity association is real in
population data but is not a *memory* parameter).

## 113. `newpar_state` — the newborn months (state, honest size)

**Established shape, debated mechanism:** postpartum memory
complaint is common (~80% self-report in some surveys) while
objective deficits are small and sleep-mediated. Hoekzema et
al. 2017 (*Nat. Neurosci.* 20:287 — pregnancy produces
long-lasting gray-matter changes, present at 2 years);
Workman, Barha & Galea 2012 review; Logan et al. 2014
(prospective — self-report deficit >> measured). The honest
reading, same as `preg_state` (§99): real dip, smaller than
the complaint, largely *sleep-frag routed* — which the model
can finally express, since `sleep` is a state channel.

**Model:** `newpar_state` ∈ {0,1} (first ~6 postpartum
months; applies to either parent at `night_duty` share —
world supplies). Legs: `sleepQuality` ceiling ×(1 −
`newpar_sleep_cap`·state) (0.25 — fragmented, not short);
`iiv_sigma` += `newpar_iiv` (0.03 — every night differs);
`att_min` += `newpar_att` (0.03 — the monitor is always on).
Complaint leg: `newpar_complaint` (0.6 — self-report bias,
same pricing as preg). **Locked `newpar_flat_null`:** no
independent E/θ/β terms — all memory cost routes through
sleep/attention channels. If a probe shows the sleep-mediation
accounting for <80% of the measured dip, the null fails and
a direct term gets added — that's the falsifiable edge.

## 114. `crci_state` — the treatment fog (state, complaint-heavy)

**Established shape, debated etiology:** cancer-related
cognitive impairment is real but *domain-narrow* — processing
speed, executive, working memory — with objective deficit
consistently smaller than subjective complaint. Ahles & Root
2018 (*CA: Cancer J. Clin.* 68 review); Wefel et al. 2015;
Janelsins et al. 2014 (longitudinal — inflammation,
not just chemotherapy, correlates). Like `scd` (§96) the
pattern is complaint>store; unlike `scd` there IS an
objective leg, just thin and domain-specific.

**Model:** `crci_state` ∈ [0,1] during active treatment ±3
months. Legs: `pspeed`/`ret_lat_mult` and wmc-loadings
×(1 − `crci_exec_tax`·s) (0.15 — executive-side only);
complaint surface ×`crci_complaint` (1.2 — exceeds the tax,
the signature). **Locked `crci_epi_null`:** episodic
`enc_base`/`beta_episodic`/`theta` untouched — the fog is in
the control layer, not the store (CONSENSUS direction —
episodic memory is the *least* affected domain in the meta-
analyses). `crci_fatigue` mediation: `task_load` interactions
scale the tax by 0.5 — fatigue is the honest mediator.

## 115. `subj_age` — felt age is a parameter (trait)

**Consensus direction, mechanism debated:** subjective age —
how old someone feels — predicts memory performance
independent of chronological age. Stephan, Sutin &
Terracciano (2018–2023 series — younger felt age → better
episodic memory, slower decline); Weiss & Lang 2012; Hughes
& Lachman 2018 review. Adjacent mechanism: **stereotype
threat** — activating the "old = forgetful" stereotype
degrades older adults' recall in the moment (Hess et al.
2003; Mazerolle et al. 2017 meta). Two legs, one trait.

**Model:** `subj_age` ∈ [−1,+1] (felt-minus-chronological,
N(0.1, 0.4) — population skews felt-younger). Trait leg:
`age_eff` gains `subj_age_shift`·subj_age years on
performance-side legs only (`subj_age_shift` 3.0 — HYPOTHESIS
magnitude; the cohort effects are real but mediated by
depression/activity, which we already price — residual
leg stays small). State leg: cueContext
`age_cue:true` (world-supplied — birthday, being called
"sir," a memory test) taxes wmc-loadings ×(1 −
`stereo_tax`) (0.1) when age_now ≥ 60 AND subj_age > 0 —
the stereotype bites only people who believe it applies.

**Locked `subj_age_store_null`:** felt age never moves
encoding or decay — it's a performance/report parameter
(the Stephan correlations are performance-side; no evidence
it changes what's stored). Keeps `subj_age` honest against
`reserve`.

## 116. `photo_habit` — the camera tax (trait × act)

**Consensus direction, size debated:** taking a photo
*impairs* memory for the photographed event — the
photo-taking impairment effect (Henkel 2014, *Psych. Sci.*
25:396 — museum study, photographed objects recalled worse
than observed ones; Soares & Storm 2018 — the impairment
holds even when photos are never reviewed; Barasch et al.
2017 — a countervailing *attentional* boost to visual
detail at the cost of nonvisual detail). Distinct from
`offload` (§80): offloading is the expectation that the
device stores it; the camera tax applies *at the shutter*
even when review never happens.

**Model:** `photo_habit` ∈ [0,2] trait (how reflexively the
camera comes out). When an event carries `photographed:true`
(world flag): E for nonvisual/gist fields ×(1 −
`photo_tax`·min(1,habit)) (0.15); visual-detail fields
×(1 + `photo_vis_gain`·habit) (0.1 — Barasch's
countervailing leg); source `context.external` gets a
`camera:true` provenance tag enabling the offload pathway at
retrieval (the photo becomes a `resurrect`-class cue —
records revive on review, which is why people don't notice
the tax). **Locked `photo_review_null`:** the impairment
does not require never-reviewing — deleting the photo
post-hoc does not restore the untaken E. The tax is at
encoding, not at review.

## 117. `mw` — the wandering mind (trait, the encoding gap)

**Consensus:** mind-wandering propensity is a stable trait
that costs encoding in proportion to task demand — the
absent-minded error profile. Cheyne, Carriere & Smilek 2006
(ARCES — attention-related cognitive errors scale);
Schooler et al. 2011 review; Kane & McVay 2012 —
mind-wandering competes with wmc for the same control
resource (correlated with wmc ~ −0.3). Distinct from
`media_m` (external task-switching) and `att_ctl` (control
under threat): `mw` is *stimulus-independent* internal
capture — the mind leaves without a trigger.

**Model:** `mw` N(0,1). Mechanism: per-tick attention
sampling gains an internal-capture event at rate
`mw_rate`·(1+0.3·mw) (0.02/tick baseline): during capture
windows (~seconds), `att` drops to `att_min` floor and
event fields encoded in the window carry `mw_gap:true` —
thin verbatim, intact gist-of-place (you were there, you
just weren't *there*). Retrieval-side: `mw` adds
`mw_replay` (0.1) to spontaneous-intrusion rate — the same
channel that eats encoding returns unbidden content.
**Locked `mw_deliberate_null`:** `mw` never raises
deliberate-recall accuracy or cue weights — capture is a
cost with an intrusion dividend, not a retrieval style.

## 118. `savor` — the deliberate keeper (trait)

**Consensus direction:** savoring — deliberate attention to
and prolonging of positive experience — is a measurable
trait (Bryant & Veroff 2007 Savoring Beliefs Inventory) that
maintains positive affect and, for memory purposes, acts as
*positive-channel rehearsal*. Distinct from `rosy` (§57 —
retrospective kindness, a report-layer trait) and from
`extra`'s sunniness: `savor` is an *act* — it changes what
positive records get worked on after minting.

**Model:** `savor` N(0,1). Legs: (a) at encoding, positive-
valence records gain `savor_attend`·sav (0.15) on
detail/peripheral fields — the savorer is literally attending
longer (Bryant's "marveling"); (b) post-encoding, positive
records enter the rehearsal pool with weight
×(1 + `savor_rehearse`·sav) (0.3) — the savorer re-lives
good events deliberately; (c) the affect-side: positive
affect tags decay ×(1 − `savor_fade_buf`·sav) (0.2 — the
FAB's positive side is *propped*, local to positive records
only — §4.5's `neg_affect_decay` asymmetry unchanged).
**Locked `savor_neg_null`:** no effect on negative records —
savoring is not rumination (that's `rumin`'s job); a
high-`savor` high-`rumin` character keeps both ledgers.

## 119. `microdose` — the fourth mandated null (the popular claim
the placebo keeps eating)

**Consensus after controlled trials:** anecdotal reports
claim microdosing psychedelics improves memory, focus,
creativity. The placebo-controlled record refuses: Cavanna
et al. 2022 (*Transl. Psychiatry* 12:148 — verified: only
participants who *correctly guessed* their condition showed
effects; all other measures null or slightly impaired);
van Elk et al. 2021 (two double-blind longitudinal RCTs —
null across cognitive control, memory, social cognition);
Murphy et al. 2023 (*Biol. Psychiatry* — verified: LSD
microdose RCT, transient mood ratings on dose days, no
enduring cognitive change); Marschall et al. 2022. The
belief effects are real; the ability effects are not.

**Model:** `microdose` ∈ {0,1} habit flag. Permitted leg:
`mdose_expect_conf` (0.1) — expectancy raises *reported*
clarity/performance confidence on dose days (the Cavanna
finding is an expectancy effect — price it where the data
put it). **Locked `mdose_enhance_null`:** every objective
parameter — E, β, θ, WMC-loadings, intrusion rates —
identical to non-dosing self. The character *believes* the
regimen works; the store does not care. Joins `birth_order`
(§58), `learn_style` (§71), `braintrain` (§102): the
mandated-null shelf exists so that a bible asking for the
folk-psychology effect gets the evidence instead.

## 120. Cross-version interactions (audit)

- `scarc` × `stress` (Part I): scarcity is not modeled as
  arousal — the tax is bandwidth, not the §2 stress gate.
  `scarc` events may co-mint stress; the `scarc_wmc_tax`
  leg does not require it. Keeps the farmers' null result
  (stress measured, didn't account for the dip).
- `chk_loop` × `distrust`/`meta_conf`: `distrust` is the
  *baseline* doubt; `chk_loop` is the *acquired* doubt,
  self-inflicted per record. Both write confidence;
  neither writes accuracy. A high-`distrust` non-`checker`
  doubts globally; a `checker` erodes per-act.
- `apnea` × `sleep` state: `sleep` prices the night's
  quality; `apnea` prices the disorder underneath it. They
  multiply, not substitute — an apneic's best night still
  underconsolidates.
- `delirium` × `hosp_step`: stacked, not merged —
  `hosp_step` prices hospitalization generally (§95);
  `delirium` prices the acute-confusion dose specifically.
  A sedated non-delirious admission pays only `hosp_step`.
- `bipolar` × `depr`: `depr` (§34) owns the pole's
  overgeneral shape; `bipolar` owns the between-episode
  residue and the manic encoding signature. A `depr`-only
  character never gets `bip_mania_reach` legs.
- `crci_state` × `scd`: same complaint>store shape,
  different basis — `scd` is the worried well (objective
  null locked); `crci` has a real but narrow executive
  tax. The complaint decoupling is the shared mechanism;
  the store-side difference is the diagnostic.
- `subj_age` × `reserve`: `reserve` (v0.4) shifts what the
  brain can take before decline shows; `subj_age` shifts
  performance-side legs only, store untouched — the two
  must not double-count (P1093 partial-correlation arm).
- `photo_habit` × `offload`: `offload` is expectation
  (§80 — "the phone remembers"); `photo_habit` is the act
  at the shutter. Non-`offload` characters still pay the
  camera tax; `offload` characters pay both.
- `mw` × `media_m`/`att_ctl`: `media_m` is external split
  attention, `att_ctl` is control under load, `mw` is
  untriggered internal capture. R-corr ~+0.3 between
  `mw`/`media_m` (habit overlap) but separate levers.
- `savor` × `rosy` × `fab`: `rosy` is report-layer
  kindness, `fab` is the affect-fade asymmetry (§4.5),
  `savor` is rehearsal selection. Three different layers
  that all lean positive — the audit exists so a bible
  doesn't stack all three into a saccharine main.
- `microdose` × `fantasy`/`suggs`: the expectancy leg
  (`mdose_expect_conf`) may load +0.1 on `fantasy` —
  the believer's prior — but the null is unconditional.

## 121. Extended trait vector, R additions, loading table
## (Part IX)

```json
IndivTraits += {
  "apnea":      0.0,   // §110 — sleep-disordered breathing [0,2]
  "bipolar":    0.0,   // §112 — the swing phenotype [0,2], ≤1/cast
  "subj_age":   0.0,   // §115 — felt-minus-chronological [-1,+1]
  "photo_habit":0.0,   // §116 — camera reflex [0,2]
  "mw":         0.0,   // §117 — mind-wandering propensity
  "savor":      0.0,   // §118 — deliberate positive rehearsal
  "microdose":  0.0,   // §119 — DOCUMENTED NULL (expectancy only)
  // state fields (not traits):
  //   scarc [0,1] world-supplied (§108);
  //   recheck events on self-action records (§109);
  //   delirium:{onset,offset,severity} (§111);
  //   newpar_state {0,1} + night_duty share (§113);
  //   crci_state [0,1] (§114); age_cue ctx flag (§115);
  //   photographed:true event flag (§116);
  //   episode_count int (§112); apnea_treated (§110)
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
scarc·stress         +0.30  (strain arrives with arousal — sampling)
scarc·(−consc)       +0.20  (precarity correlation — sampling, not causal)
apnea·age            +0.35  (prevalence rises steeply — CONSENSUS)
apnea·(male sex)     +0.25  (2:1 clinical skew — CONSENSUS)
bipolar·neurot       +0.30  (affective comorbidity — sampling)
subj_age·depr        −0.30  (felt-old tracks dysphoria — CONSENSUS dir.)
subj_age·self_est    +0.20
photo_habit·offload  +0.35  (device-reliance cluster — sampling)
photo_habit·extra    +0.15
mw·media_m           +0.30  (attention-habit cluster — sampling)
mw·adhd              +0.40  (shared mechanism — CONSENSUS dir.)
mw·att_ctl           −0.30  (Kane & McVay 2012 — CONSENSUS dir.)
savor·extra          +0.20  (sampling)
savor·rosy           +0.25  (both lean positive — sampling; layers differ)
savor·depr           −0.25  (savoring deficits in dysphoria — CONSENSUS dir.)
microdose·fantasy    +0.10  (expectancy prior only — DEBATED)
crci_state·(depr)    +0.20  (complaint inflation co-travels — sampling)
```

### Loading table additions (rows beyond §104)

| trait/state | param | loading | tier / source |
|---|---|---|---|
| scarc | wmc-loadings/PM-self ×(1−tax·s) | tax 0.2, pm 0.15 | CONSENSUS (Mani 2013) |
| scarc | stressor:true E ×(1+tunnel·s) | tunnel 0.25 | CONSENSUS dir. (Shah 2012) |
| chk_loop | recheck→vivid/conf erosion, R→K | 0.15/0.2/0.3 per chk | CONSENSUS (vdH&K 2003/04) |
| chk_loop | accuracy (all fields) | 0.0 — LOCKED | CONSENSUS (vdH&K) |
| apnea | consol_beta_mult / sws_mult | +0.15·a / −0.2·a | CONSENSUS dir. (Canessa 2011) |
| apnea | iiv_sigma + / treated rescue | 0.02·a / 0.5 | CONSENSUS dir. / DEBATED |
| delirium | in-window E floor / frag mint | 0.05, dream_p 0.15 | CONSENSUS (ICU phenomenol.) |
| delirium | age_eff += step·days (cap 3y) | step 0.15/d | CONSENSUS dose (Pandharipande) |
| bipolar | euthymic E/breadth tax | −0.1·b | CONSENSUS (Bourne 2013) |
| bipolar | mania ctx: reach +0.3, thin −0.2 | per b | CONSENSUS dir. (HYPOTHESIS map) |
| bipolar | per-episode residue | +0.02/count, cap 0.2 | CONSENSUS dir. (Robinson 2006) |
| newpar_state | sleep cap / iiv / att_min | 0.25 / 0.03 / 0.03 | CONSENSUS dir. (sleep-routed) |
| newpar_state | direct E/θ/β terms | 0.0 — LOCKED | CONSENSUS (Logan 2014) |
| crci_state | exec/pspeed tax, complaint | 0.15·s / 1.2 | CONSENSUS (Ahles & Root 2018) |
| crci_state | episodic params | 0.0 — LOCKED | CONSENSUS (domain-narrow) |
| subj_age | perf-side age_eff shift | 3.0y at ±1 | HYPOTHESIS (Stephan; mediated) |
| age_cue ctx | wmc-loadings ×(1−stereo_tax) | 0.1, age≥60 | CONSENSUS dir. (Hess 2003) |
| photo_habit | nonvisual E −0.15, visual +0.1 | per min(1,h) | CONSENSUS (Henkel; Barasch) |
| photo_habit | post-hoc review repair | 0.0 — LOCKED | CONSENSUS (Soares & Storm 2018) |
| mw | capture rate, intrusion dividend | 0.02 base / +0.1 | CONSENSUS dir. (Cheyne; Schooler) |
| mw | deliberate-recall params | 0.0 — LOCKED | CONSENSUS (encoding deficit) |
| savor | pos detail/rehearse/fade-buf | 0.15 / 0.3 / 0.2 | CONSENSUS dir. (Bryant 2007) |
| savor | negative records (all) | 0.0 — LOCKED | CONSENSUS (not rumination) |
| microdose | expectancy confidence | +0.1 dose-days | CONSENSUS (Cavanna 2022) |
| microdose | ALL objective params | 0.0 — LOCKED | CONSENSUS (van Elk; Murphy) |

## 122. New explicit nulls (Part IX's falsifiable edge)

- `scarc_trait_null`: bandwidth tax is state-gated; identity
  never carries it (P1085).
- `chk_acc_null`: rechecking erodes the *felt* memory, never
  the fields (P1086).
- `apnea_overnight_null`: one treated night repairs nothing
  — cumulative rescue only (P1087).
- `delir_retro_null`: delirium steps forward only (P1088).
- `bip_creat_null`: the phenotype costs, never compensates
  (P1089).
- `newpar_flat_null`: newborn months cost through sleep/
  attention only (P1090).
- `crci_epi_null`: the treatment fog stays in the control
  layer (P1091).
- `subj_age_store_null`: felt age is performance-side only
  (P1092).
- `photo_review_null`: the camera tax happens at the
  shutter; no review pattern restores it (P1094).
- `mw_deliberate_null`: wandering buys intrusions, never
  deliberate-recall gains (P1095).
- `savor_neg_null`: savoring never touches negative records
  (P1096 — and distinguishes savor from rumin).
- `mdose_enhance_null`: the fourth mandated null —
  expectancy leg only, every objective param identical
  (P1097).

## 123. Falsifiable probes (P1085–P1097; validation-design §212)

- **P1085 the broke month (MUST — state-lock):** scarc
  0→0.9 on a fixed character: wmc-loadings and PM
  self-initiation drop ≈`scarc_wmc_tax`; `stressor:true`
  events encode STRONGER (tunnel leg); scarc→0 restores
  all loadings fully (`scarc_trait_null` — the farmers).
- **P1086 the tenth check (MUST — accuracy-lock):**
  checker=+1.5 self-action record rechecked ×10:
  reported vividness/confidence erode ≈`chk_*_erosion`,
  R→K tag drifts `know`-ward; `accuracy` bit-identical
  (`chk_acc_null`); urge-to-recheck rises as confidence
  falls (emergent loop). van den Hout & Kindt 2003/2004.
- **P1087 the machine on the nightstand (SHOULD —
  timescale-lock):** apnea=1.5 with `apnea_treated` from
  day 0: consol/sws legs recover toward
  `apnea_cpap_rescue` asymptote over ~90 days; a single
  treated night moves nothing (`apnea_overnight_null`).
- **P1088 the ICU week (MUST — dose-lock):** delirium
  0/3/7-day arms under identical `hosp`: age_eff step
  ∝ days (`delir_step`, cap `delir_step_cap`); in-window
  records mint only `frag:true`/`fuzzy:true` fragments;
  pre-admission records bit-identical
  (`delir_retro_null`). Pandharipande 2013.
- **P1089 the swing's residue (SHOULD — count-lock):**
  bipolar=1.5, `episode_count` 0 vs 5: euthymic tax
  rises ≈`bip_ep_residue`·count (cap); mania-ctx
  records wider-thinner; no arm shows any encoding or
  retrieval advantage (`bip_creat_null`).
- **P1090 the newborn months (MUST — channel-lock):**
  newpar_state=1 at night_duty=0.7: all measured dip
  routes through sleep/iiv/att channels; direct E/θ/β
  identical (`newpar_flat_null`); complaint surface
  exceeds measured dip (`newpar_complaint` shape).
- **P1091 the treatment fog (SHOULD — domain-lock):**
  crci_state=1: exec/pspeed legs tax ≈`crci_exec_tax`;
  episodic E/β/θ identical (`crci_epi_null`); complaint
  surface ≈1.2× the objective dip.
- **P1092 the felt decade (SHOULD — layer-lock):**
  subj_age=+0.8 vs −0.8 at fixed chronological:
  performance-side legs shift ≈`subj_age_shift`;
  encoding/decay identical (`subj_age_store_null`);
  `age_cue` arm taxes the felt-old only.
- **P1093 the double-count guard (MUST — partial-corr
  arm):** reserve=1 & subj_age=+1 factorial: legs stay
  separable — reserve on capacity floor, subj_age on
  performance; joint cell shows no superadditive
  collapse (guard against double-counting the mediated
  pathway). Stephan 2018; Stern 2002.
- **P1094 the shutter (MUST — act-lock):**
  `photographed:true` events on photo_habit=+1.5:
  nonvisual/gist E down ≈`photo_tax`, visual detail up
  ≈`photo_vis_gain`; photo deletion post-hoc restores
  nothing (`photo_review_null`); `offload`− arm still
  pays the tax (mechanisms separable). Henkel 2014;
  Soares & Storm 2018; Barasch 2017.
- **P1095 the absent tick (SHOULD — channel-lock):**
  mw=+1.5 vs −1.5 on identical event streams:
  `mw_gap:true` field-thinning scales with capture rate;
  intrusion rate gains `mw_replay`; deliberate-recall
  measures identical (`mw_deliberate_null`). Cheyne
  2006; Schooler 2011.
- **P1096 the deliberate keeper (SHOULD — valence-
  lock):** savor=+1.5: positive records gain
  detail/rehearsal/fade-buffer legs; negative records
  bit-identical (`savor_neg_null`); high-savor
  high-rumin co-manipulation keeps both ledgers
  separable. Bryant & Veroff 2007.
- **P1097 the fourth null (MUST — locked):** microdose=1
  regimen vs matched non-dosing: every objective measure
  identical within jitter (`mdose_enhance_null`);
  dose-day reported confidence gains ≈`mdose_expect_conf`
  only when the character believes they dosed
  (expectancy leg = the Cavanna finding).

## 124. Part IX honest limits

- `scarc`'s 0.2 wmc-loading tax is our mapping of the
  13-IQ-point equivalent; Mani's effect was measured on
  Raven's and cognitive-control tasks — converting to
  *memory encoding* loadings is a HYPOTHESIS bridge
  (the direction is solid, the magnitude is ours).
- `chk_loop` inherits vdH&K's mechanism claim (familiarity
  → conceptual processing → perceptual starvation) but we
  implement it as report-layer erosion — the field values
  we degrade are phenomenal, matching the null on
  accuracy. Whether a recheck is a retrieval that ALSO
  consolidates (testing effect fights the erosion) is
  unresolved; we priced erosion on reported channels only
  to keep the locked null clean.
- `apnea`'s `sws_mult` leg assumes SWS-episodic coupling —
  our own §consolidation machinery; the apnea literature
  reports REM-fragmentation effects too, which our model
  routes through the same consolidated channels.
  `apnea_cpap_rescue`=0.5 is mid-range; Canessa suggests
  partial reversal at 3 months, trajectories unclear.
- `delirium`'s 0.15y/day step is linearized from
  Pandharipande's duration association (an odds-gradient,
  not a slope); the cap is ours. The `delir_dream_p`
  delusional-fragment minting is ICU-phenomenology priced
  as confabulation-adjacent — the closest existing
  machinery (§6.235 `fgen_*`) — flagged HYPOTHESIS.
- `bipolar`'s manic encoding signature is our
  extrapolation — the episode literature measures mood and
  impairment, not field-level encoding geometry. The
  euthymic tax and episode-count residue are CONSENSUS-
  direction; `bip_mania_thin` shape is HYPOTHESIS.
- `newpar_state` bets on the sleep-mediation account
  (CONSENSUS direction but causally unresolved — Hoekzema's
  structural changes could carry a direct leg). The locked
  null is the falsifier: if direct terms are real, P1090
  fails *loudly*.
- `crci_state`'s "control layer not store" mapping follows
  the meta-analytic domain pattern but etiology is
  multi-causal (inflammation, fatigue, endocrine); the
  `task_load` mediation split is our simplification.
- `subj_age`'s store-null is the model being honest:
  cohort correlations are real but likely mediated by
  depression/activity (already priced); the 3y shift is
  the residual we believe survives mediation — a
  HYPOTHESIS, and small by design.
- `photo_habit` merges Henkel's tax and Barasch's visual
  boost — two labs' rival findings coexist as two legs
  (impairment for the nonvisual whole, boost for visual
  detail); whether the net autobiographical effect in the
  wild is negative is DEBATED. `camera:true` provenance
  is ours.
- `mw`'s capture-as-gap implementation assumes mind-
  wandering during encoding produces field-thin records
  rather than absent ones — supported direction (absent-
  minded errors), but the `mw_replay` intrusion dividend
  (the same channel returns content) is a HYPOTHESIS
  bridge from the spontaneous-thought literature.
- `savor` is priced as three positive-channel legs because
  the savoring literature is affect-outcome-based, not
  memory-field-based — the mapping to detail/rehearsal/
  fade-buffer is our decomposition, direction CONSENSUS,
  weights HYPOTHESIS.
- `microdose` joins the mandated-null shelf on the strength
  of three null RCTs + one expectancy-moderated RCT; the
  belief-leg is real (expectancy and correct-guess
  effects replicate), so the flag carries
  `mdose_expect_conf` rather than being a pure no-op —
  the honestest null we can write.

# Part X — v115: the body keeps the ledger (the ear that
# spends, the pill that borrows, the transition that
# pauses, the shift that drags, the fever that fogs, the
# habit that burns, the cushion that isn't, the job that
# banked, the desk that emptied, the company that isn't
# there, the sugar that saps, the headache that passes,
# and the year after the funeral)

Nine parts built the trait vector through capacity,
personality, language, neurodivergence, clinical
phenotypes, lived-in bookkeeping, offloading, chemistry,
and circumstantial taxes. What remains uncovered is the
**somatic layer** — the differences that arrive through
the body rather than the biography: a degrading sense, a
prescription's side effect, a hormonal transition, a
decade of nights, a week of fever, a pack-a-day habit, a
meditation cushion, a career's cognitive deposit, a
retirement's withdrawal, a loneliness that isn't about
headcount, a blood-sugar ledger, a headache that costs
nothing long-term, and a grief with a shape. Thirteen
more reasons two characters with identical trait vectors
won't remember the same week — and the fifth mandated
null.

## 125. `hear` — the ear that spends the buffer (trait)

**Consensus:** age-related hearing loss is independently
associated with cognitive decline and incident dementia,
dose-ordered by severity. Lin et al. 2011 (*Arch.
Neurol.* 68:214 — BLSA N=639: incident-dementia hazard
rises log-linearly, 1.27× per 10 dB; HR 1.89 mild,
3.00 moderate, 4.94 severe); Lin et al. 2013 (*JAMA
Intern. Med.* 173:293 — accelerated decline on Digit
Symbol/incident impairment over 6y); and, crucially,
**Deal et al. 2023 (ACHIEVE, *Lancet* 402:786 — verified
RCT): hearing intervention slowed 3-year cognitive
decline ~48% in the at-risk (ARC) arm, null in healthy
volunteers** — the decline leg is partially *causal*, not
pure marker. Mechanism is triply routed: effortful
listening spends encoding resources (Pichora-Fuller
et al. 2016 — the "effortfulness hypothesis": degraded
input reallocates wmc from storage to perceptual
decoding); degraded signal → poorer source/context
fields; and the social-withdrawal mediator (hearing
loss → withdrawal → less rehearsal, the `social`
channel).

**Model:** `hear` ∈ [0,2] trait (dB-band scaled;
age-correlated sampling). Three legs mirroring the
three mechanisms: (a) **effort tax** — spoken-input
events (`channel:"heard"`) encode E ×(1 −
`hear_effort_tax`·h) (0.2) with the tax *landing on
wmc-loadings* (peripheral/source fields starve first —
verbatim gist survives, who-said-it thins);
(b) **context thinning** — `w_people`/source-field
completeness on heard events ×(1 − `hear_src_tax`·h)
(0.15) — the conversation is remembered, the attribution
isn't; (c) **withdrawal mediator** — `social` effective
value -= `hear_social_drag`·h (0.3 — feeds the existing
retell/rehearsal legs; not a new channel).
`hear_aided:true` (world/bible state — a fitted hearing
aid) rescues fraction `hear_aid_rescue` (0.4) of legs
(a)+(b) only — ACHIEVE's arm-specific benefit, and the
social drag is slower to reverse (stigma/habit lag).
Long-run leg: for h ≥ 1 sustained ≥ 5 sim-years,
`age_eff` gains `hear_decline_k`·h·yrs (0.1 age-yr/yr —
the Lin dose gradient, priced small because mediation is
partially through already-priced `social`).

**Locked `hear_gist_null`:** the tax is resource and
source-field, never gist — a hard-of-hearing character
remembers THAT the argument happened while losing who
said what. And `hear_sem_null`: semantic store,
procedural, and already-encoded records untouched —
the ear spends at the door, not in the vault.

## 126. `antichol` — the pill that borrows from encoding
(state + cumulative)

**Consensus:** anticholinergic medications (first-gen
antihistamines, tricyclics, bladder antimuscarinics —
the commonest classes) acutely impair *encoding*
specifically — the cholinergic system is the attention/
encoding substrate (Caine et al. 1981 scopolamine model
of aging; mints the encoding deficit without the
storage loss). Cumulative exposure tracks incident
dementia: Gray et al. 2015 (*JAMA Intern. Med.* 175:401
— verified, N=3434: 10-year cumulative dose-response,
highest-exposure tertile HR ~1.54); Risacher et al.
2016 (*JAMA Neurol.* 73:572 — anticholinergic users
show reduced hippocampal glucose metabolism AND poorer
immediate/delayed recall, dose-ordered).

**Model:** `antichol` ∈ [0,2] — **current burden**
(state, world-supplied from the med list) plus a
hidden `antichol_yrs` cumulative tally the substrate
integrates. Legs: (a) `enc_base` and attention-gated
fields ×(1 − `antichol_enc_tax`·a) (0.25 — the
cholinergic tax is THE encoding tax, the most
mechanism-clean drug leg in the model); (b)
`iiv_sigma` += `antichol_iiv`·a (0.02 — dose-timing
wobble); (c) cumulative — `age_eff` += `antichol_decline`
·(antichol_yrs·a/10) (0.5 age-yr per decade of heavy
burden — Gray's dose-response, permanent, priced into
the same forward-step ledger as `hosp_step`/`delir_step`).
**Locked `antichol_ret_null`:** retrieval, decay rates,
and semantic store untouched — the deficit mints thin
records, never corrupts stored ones (the scopolamine
dissociation is encoding-selective — CONSENSUS).

## 127. `menop` — the transition that pauses learning
(state, honestly transient)

**Consensus:** the perimenopause dip is real, specific,
and *rebounds*. Greendale et al. 2009 (*Neurology*
72:2050 — SWAN, N=2362, verified): processing speed
stopped improving during late perimenopause (28% of
premenopause learning-rate gains) and verbal memory
learning fell to 29% (early) / 7% (late) of baseline
rate — then **rebounded to premenopausal levels
postmenopause**; self-reported difficulty (~60%)
exceeds and outlasts the measured dip. Greendale et
al. 2010 (*Am. J. Epidemiol.* — the symptoms paper):
depression, anxiety, sleep disturbance, vasomotor
symptoms did NOT mediate the learning dip — the dip is
a stage effect, not a symptom effect. Weber, Maki &
McDermott 2014 review — the deficit concentrates in
*learning/encoding*, not retention of the learned.

**Model:** `menop` ∈ {0,1,2} state (0 none / 1 early /
2 late perimenopause, world-supplied, ~4y window).
Legs scale by stage: encoding-side *new-learning*
rate ×(1 − `menop_learn_tax`·stage/2)
(`menop_learn_tax` 0.25 at stage 2 — the SWAN
learning-rate shape: consolidation of what IS encoded
is flat); `pspeed` legs ×(1 − `menop_pspeed_tax`·s/2)
(0.15); complaint surface ×`menop_complaint` (1.5 —
the 60%-self-report premium). At stage→post transition
all legs return to baseline over `menop_rebound_d`
(180 days). **Locked `menop_ret_null`:** retention,
retrieval θ, and existing records untouched — the dip
is acquisition-side only and FULLY reversible (SWAN's
rebound is the finding; a permanent menop leg is the
bug). **Locked `menop_sym_null`:** legs do NOT scale
with concurrent depr/sleep states — stage-gated
(Greendale 2010's null mediation priced literally).

## 128. `shift_wrk` — the decade of nights (trait-history)

**Consensus direction, recovery debated:** chronic
rotating/night-shift work associates with measurable
memory and executive deficits, dose-ordered by
exposure duration. Marquié et al. 2015 (*Occup.
Environ. Med.* 72:258 — VISAT cohort, N>3000,
verified): ≥10 years of rotating-shift exposure →
global cognition and memory impairment equivalent to
~6.5 extra years of aging; **partially reversible —
recovered after ≥5 years off shifts**. Rouch et al.
2005; Bokengeen 2020 review. Acute leg is circadian:
post-night-shift encoding runs the same low-TOD channel
the synchrony machinery already owns (Folkard).

**Model:** `shift_wrk` ∈ [0,2] trait = lifetime
exposure-years log-scaled (bible-set from the career
history — a nurse at 1.5, a day-job lifer at 0).
Two legs: (a) **history tax** — wmc-loadings and
`beta_episodic` ×(1 + `shift_hist_tax`·w)
(`shift_hist_tax` 0.08 at w=2 ≈ Marquié's ~6.5yr
equivalent priced through age-side legs: `age_eff` +=
`shift_age_equiv`·w, 3.0y at w=2 — the aging-equivalent
form is more honest); (b) **recovery** — while
`day_shift_yrs` accrues, the tax decays toward
`shift_recovery` (0.6 asymptote at 5y — Marquié's
partial, never full). Acute: world supplies
`post_night:true` ctx → treated as `|tod − peak|` ≈
8h misalignment through §2.12 synchrony machinery
(no new mechanism — the shift worker is chronically
tested at antipeak). **Locked `shift_sem_null`:**
semantic/procedural stores flat — the exposure taxes
the control layer and episodic efficiency, never the
knowledge base.

## 129. `sick_day` — the fever fogs the door (state)

**Consensus:** acute systemic inflammation impairs
declarative/encoding-stage memory in hours.
Reichenberg et al. 2001 (*Arch. Gen. Psychiatry*
58:445 — verified, low-dose endotoxin RCT): cytokine
spike → impaired declarative-memory acquisition at
1–3h, **fully mediated by the cytokine rise, reversed
by ~10h**, with mood and cortisol covarying but not
fully explaining it; Harrison et al. 2009/2014
(typhoid vaccination — inflammation degrades memory
consolidation + mood); Dantzer 2008 sickness-behavior
review. The everyday version: the flu week encodes
thin and the fever-dream fragments mint weird.

**Model:** `sick_day` ∈ [0,1] state (world-supplied
illness severity; a bad cold ~0.3, flu ~0.7). Legs:
`enc_base` ×(1 − `sick_enc_tax`·s) (0.3 — the
endotoxin finding is an *acquisition* deficit);
wmc-loadings ×(1 − `sick_wmc_tax`·s) (0.2);
delirium's little sibling — at s ≥ 0.6, `fuzzy:true`
fragment minting at `sick_dream_p`·s (0.1 — fever
dreams are real phenomenology, priced at a tenth of
`delir_dream_p`); retrieval θ raised slightly +
`sick_theta`·s (0.05 — even recall costs more when
sick). **Locked `sick_dur_null`:** all legs vanish at
s→0 — no residue, no step, no trait. Reichenberg's
full reversal is the finding: the flu taxes the week,
never the decade. (Distinguishes `sick_day` from
`delirium`, which DOES step — duration and severity
are not the same ledger.)

## 130. `smoker` — the habit that burns the slope (trait)

**Consensus:** long-term smoking accelerates cognitive
decline and dementia risk; quitting partially rescues;
*acute* nicotine is a genuine but small attention/
encoding aid. Anstey et al. 2007 (*Arch. Gen.
Psychiatry* 64:84 meta — current smoking → increased
dementia/decline risk); Sabia et al. 2012 (*Arch. Gen.
Psychiatry* 69:627 — Whitehall II: midlife smoking →
10-year decline, **recent quitters still at risk,
long-term ex-smokers intermediate**); Heishman et al.
2010 meta (nicotine's acute effects: small positive on
fine motor/attention/working memory in deprived
smokers — mostly withdrawal reversal). The honest
shape: acute bump ≈ withdrawal repair, chronic cost
real.

**Model:** `smoker` ∈ {0,1,2} (never/ex/current) +
`pack_yrs` cumulative + `quit_yrs` (bible/world
supplied). Legs: (a) chronic — `age_eff` +=
`smoke_decline_k`·(pack_yrs/20) (1.0 age-yr per 20
pack-years; for ex-smokers scale ×`smoke_quit_rescue`,
0.5 after quit_yrs ≥ 5 — Sabia's intermediate arm);
(b) acute-state `nicotine_sated:true` (recent dose):
attention legs ×(1 + `nic_acute_gain`) (0.08 — small,
and modeled as *withdrawal repair*: only active when
`withdrawal_h` > 2); (c) `withdrawal_h` > 4h →
`nic_withdraw_tax` (0.1) on wmc-loadings + iiv bump —
the fidgety encoding window. **Locked
`smoke_encode_null`:** no direct E bonus — nicotine's
documented gains are attention/working-memory
(domain-narrow), not a memory enhancer; the folk
"smoking helps me think" leg is priced as withdrawal
reversal only (Heishman's conclusion, priced
literally).

## 131. `medit` — the cushion that isn't a memory drug
(trait, kept small)

**Consensus direction, effect size small and debated:**
mindfulness/meditation practice shows modest attention
and working-memory benefits, mostly in novices and
mostly attention-side; claims of structural memory
improvement are weak. Chiesa, Calati & Serretti 2011
(*J. Altern. Complement. Med.* meta — significant but
modest attention/WM effects, high heterogeneity);
Tang, Hölzel & Posner 2015 review; Chételat et al.
2018 (*JAMA Neurol.* — Medit-Ageing 18-month RCT:
no benefit over health training on primary endpoints,
small secondary gains); Sperduti et al. 2012. Like
`gamer` (§101): a real thing, told to stay small.

**Model:** `medit` N(0,1) trait. Legs confined to the
attention layer: `att` sampling noise −`medit_att_buf`·m
(0.05 — less attentional scatter, the strongest
replicated finding); `mw` capture rate ×(1 −
`medit_mw_buf`·m) (0.15 — the mechanism the RCTs
actually train: noticing the mind wander); complaint
self-report *improves* `medit_conf_gain` (0.1 — the
subjective benefit is real even where the objective
one is thin). **Locked `medit_store_null`:** zero
loadings on β, θ, semantic/procedural — meditation
does not build memory storage (Chételat's primary-
endpoint null priced as a hard bound). The character
who meditates is less scattered at the door; the
vault is the same vault.

## 132. `job_cplx` — the career that banked a buffer
(trait, reserve-adjacent)

**Consensus direction, causality debated:**
occupational complexity — especially complexity of
work with *people and data* — predicts higher
late-life cognition and possibly slower decline,
beyond education. Schooler, Mulatu & Oates 1999/2004
(longitudinal — substantively complex work →
intellectual flexibility, reciprocal); Smart, Gow &
Deary 2014 (*J. Int. Neuropsychol. Soc.* — job
complexity with data/people predicted better
late-life cognition controlling childhood IQ);
Finkel et al. 2009 (twins — complexity slowed
episodic decline); Andel et al. 2005 (occupational
complexity → reduced dementia risk). Distinct from
`reserve` (v0.4): reserve is the *capacity buffer*;
`job_cplx` is the *training history that fed it* —
correlated (R ~0.5 with reserve) but the bible can
pin them apart (the professor emeritus vs the
natural reserve who never needed a job).

**Model:** `job_cplx` N(0,1) trait, sex/era-aware
sampling (a 1950s career ceiling matters — world-
builder supplies). Legs: `reserve` effective value
+= `jobcplx_reserve_feed`·j (0.3 — feeds the existing
buffer rather than minting a parallel one);
`search_breadth`/`w_topic` small +`jobcplx_breadth`·j
(0.05 — practiced retrieval habits from decades of
data-work); **no level bonus to enc_base** — the
literature is slope/buffer, and level is already
priced via education+reserve. **Locked
`jobcplx_retire_null`:** at `retire` onset (§133) the
`job_cplx` legs do NOT decay — the deposit stays
banked; what stops is the *continued deposit*. The
trait is history, not activity.

## 133. `retire` — the desk that emptied (state,
engagement-moderated)

**Established association, causality genuinely
debated:** retirement is followed by measurable
cognitive decline in several cohorts — "mental
retirement" (Rohwedder & Willis 2010, *JEP* 24:118 —
cross-country: earlier retirement ages ↔ lower
cognition); Bonsang, Adam & Perelman 2012 (*J. Health
Econ.* 31:490 — retirement → ~0.7%/yr decline in
verbal memory, mediated by reduced stimulation);
Mazzonna & Peracchi 2017. **But** the reverse-causal
and selection critiques are live (people retire
*because* cognition slips; physically-demanding
retirements differ from chosen ones), and engagement
post-retirement moderates — volunteers/caregivers
decline less. Honest pricing: small, moderated,
not inevitable.

**Model:** `retire` ∈ {0,1} state (world-supplied;
`retire_voluntary:true` and `post_engagement` [0,1]
moderators — world supplies whether the character
filled the week or emptied it). Legs: while retired
AND `post_engagement` < 0.5: `beta_episodic` and
wmc-loadings ×(1 + `retire_slope_tax`·(1−engage))
(0.05 — small, stimulation-mediated); PM
self-initiation −`retire_pm_tax` (0.1 — the calendar
stops making demands; the structure that carried
intentions is gone — PM is the honest first casualty,
Craik's environmental-support insight). With
`post_engagement` ≥ 0.5: all legs → 0 — the bridge
club IS the counterfactual. **Locked
`retire_step_null`:** no step function at the event —
the literature shows slope, not cliff (the cliff is
depression or bereavement, which are their own legs);
and involuntary-retirement confound is routed through
`depr`, never a `retire` leg.

## 134. `lonely` — the company that isn't there (trait,
distinct from `social`)

**Consensus:** *perceived* loneliness — not objective
isolation — predicts cognitive decline and dementia
independent of social-network size. Cacioppo &
Hawkley 2009 (*Perspect. Psychol. Sci.* — the
perception, not the headcount, is the exposure);
Shankar et al. 2013 (*Psychosom. Med.* 75:610 —
loneliness → dementia risk ~1.65, controlling social
isolation); Tilvis et al. 2004; Wilson et al. 2007
(Rush cohort — loneliness → faster AD decline);
Boss, Kang & Branson 2015 meta. Mechanism legs:
hypervigilance tax (lonely brains monitor for social
threat — a standing `w_state`-like cost), reduced
meaningful rehearsal (you can be surrounded and never
be *heard*), and depressive comorbidity (partially
mediated, partially independent — priced residual).

**Model:** `lonely` N(0,1) trait — **explicitly not
derived from `social`** (the loner who isn't lonely
and the social butterfly who is are both real;
R-corr `social`·`lonely` −0.35 only). Legs:
(a) hypervigilance — `w_state` += `lonely_vigil`·l
(0.1 — social-threat monitoring eats encoding
bandwidth in group contexts); (b) rehearsal deficit
— retell/rehearsal pool weight ×(1 −
`lonely_rehearse_tax`·l) (0.15 — the conversations
that rehearse are the felt-quality ones); (c) decline
— `age_eff` += `lonely_decline`·l for sustained l > 1
(0.15 age-yr/yr at l=2 — Wilson/Shankar residual after
depr/social mediation, kept small because mediation
is real); (d) retrieval valence — negative-social
records get `lonely_neg_bias` (0.1) retrieval
advantage (the hypervigilant mind keeps the slights).
**Locked `lonely_crowd_null`:** `social` exposure does
not rescue the legs — a high-`social` high-`lonely`
character rehearses plenty *of nothing that counts*
(the whole finding is the perception-gap). Rescue is
felt-connection events (`bonded:true` retells —
world supplies).

## 135. `diab` — the sugar that saps the slope (trait)

**Consensus:** type-2 diabetes is a real, modest,
vascular-clustered accelerator of cognitive decline —
strongest on processing speed/executive, present on
episodic memory, dose-ordered by duration and control.
Rawlings et al. 2014 (*Ann. Intern. Med.* 161:785 —
ARIC, verified: midlife diabetes → **19% greater
20-year cognitive decline** than non-diabetic);
Biessels & Despa 2018 (*Nat. Rev. Endocrinol.* review
— mechanisms: vascular, insulin signaling, glycemic
variability); Palta et al. 2014 (duration-ordered).
Not a step, not a fog — a slope.

**Model:** `diab` ∈ [0,2] trait (0 none, 1 controlled,
2 poorly-controlled; `diab_yrs` duration tally).
Legs: `age_eff` += `diab_decline_k`·(d/2)·(diab_yrs/10)
(0.4 age-yr per decade at d=2 — Rawlings' 19% priced
conservatively as age-equivalent slope); `pspeed`/
`ret_lat_mult` legs ×(1 + `diab_pspeed_tax`·d/2)
(0.1 — speed is the largest domain);
`hypo_episode:true` events (world flag, severe
hypoglycemia) mint `frag:true` encoding like a
micro-`delirium` window (`diab_hypo_frag` 0.3 —
documented amnesia for severe-hypo episodes).
Vascular cluster: R-corr with `smoker`, `hear`,
`apnea` (+0.2 each — they co-travel, sampling-level).
**Locked `diab_sem_null`:** semantic store untouched —
the decline is efficiency/speed slope, not knowledge
loss (until it compounds into the dementia arm the
age machinery already owns — no double-counting:
`diab` moves `age_eff`, which IS the dementia path).

## 136. `migr` — the headache that passes clean (the
fifth mandated null)

**Consensus after longitudinal data:** the folk fear —
migraine eats memory over a lifetime — fails.
Rist et al. 2012 (*BMJ* 345:E — Women's Health Study,
N=6349, verified: migraineurs showed **less** cognitive
decline over 20y than non-migraineurs; with-aura
similar); Gaist et al. 2005 (Danish twins — no
cognitive deficit); Gil-Gouveia & Martins 2019
(*Neurology* — ictal and interictal subjective
complaints are real, objective interictal deficit
mostly null); the attack itself IS a documented
transient impairment (ictal cognitive symptoms —
difficulty concentrating, word-finding — Meyer et al.
2000; Vurallı 2018). The honest shape: attack-window
costs, lifetime ledger clean.

**Model:** `migr` ∈ [0,2] trait (susceptibility/
frequency — ~15% prevalence, female-skewed R-corr
with sex=f +0.3). World supplies `ictal:true` attack
windows (~hours–2d). Attack legs: wmc-loadings and
`enc_base` ×(1 − `migr_ictal_tax`·severity) (0.3 —
a migraine day encodes like a sick day, plus photophobia
routes through `att` floor); `w_sensory` cues during
attack get `migr_sens_gain` (+0.2 — the sensory
system is loud, sensory fields write STRONGER inside
a thin record — the aura remembered vividly, the
meeting forgotten). Interictal legs: ZERO objective;
complaint surface +`migr_complaint` (0.2 — the worry
is real, the deficit isn't — Gil-Gouveia's pattern).
**Locked `migr_cumul_null`:** no `age_eff` leg, no
cumulative tally, no store effect — attack count
changes nothing long-term (Rist's null-or-better is
the finding; joins `birth_order`, `learn_style`,
`braintrain`, `microdose` — the fifth mandated null,
and the only one where the null is *good news*).

## 137. `grief` — the year after the funeral (state,
staged)

**Consensus direction, size moderate:** bereavement
costs cognition measurably in the first 1–2 years,
gender- and relationship-moderated, partially mediated
by depression/disengagement. Shin, Kim & Park 2018
(*Am. J. Geriatr. Psychiatry* 26:778 — HRS N=6766:
widowhood → accelerated decline, education/sibling
protective); Ifcher & Zaveri 2021 HRS (dynamic
treatment effects — contemporaneous dip + partial
adaptation); Kang et al. MIDUS (widowhood worse for
men, and for *ambivalent* marriages — the
complicated-relationship finding); Aartsen et al.
2005. The intrusive-rumination channel (unbidden
grief recall) is the memory-relevant signature —
grief intrusions are the documented phenomenology
(Boelen et al. complicated-grief work; involuntary
memory intrusions concentrate on the lost
relationship — Bennett & Soulsby).

**Model:** `grief` ∈ [0,1] state with world-supplied
`{onset, kin_type, ambivalence}` — `kin_type` scales
the dose (spouse 1.0, close friend/child 0.9, parent
0.7, relative 0.4 — graded by the literature's
attachment ordering). Legs: (a) window — first
`grief_acute_d` (90d): wmc-loadings ×(1 −
`grief_acute_tax`·g·kin) (0.25 — the raw months);
(b) slope — months 3–24: `age_eff` +=
`grief_slope`·g·kin (0.2 age-yr/yr — Shin's
acceleration, adaptation-gated: halves at 12m,
zeroes ~24m); (c) intrusions — records involving
the lost person get intrusion-rate ×(1 +
`grief_intr`·g·kin·(1−ambivalence)) (0.8 — the
intrusive-recall signature; ambivalent-loss characters
get FEWER intrusions and MORE complicated cognition
per Kang); (d) the `rumin` co-travel: grief feeds
existing `rumin_k` on the lost-person record cluster
only — not global. `grief` in a character already
carrying `depr`/`lonely` stacks multiplicatively
with a `grief_stack_cap` (1.5× total — the comorbidity
ceiling, honest pricing not infinite stacking).
**Locked `grief_perm_null`:** at g→0 (adaptation)
all legs return — bereavement is a wound, not a
lesion; permanent residue only via `depr`/`lonely`
state conversions the world decides (complicated
grief is `depr`+`trauma` machinery, not `grief`'s).

## 138. Cross-version interactions (audit)

- `hear` × `social`/`lonely`: `hear_social_drag`
  writes the `social` *effective* value — a
  hard-of-hearing character's rehearsal thins even
  when the calendar is full. `lonely` is the felt
  side; they correlate through reality, not through
  shared params. A deafened socialite with low
  `lonely` still pays the drag (the channel is
  bandwidth, not mood).
- `antichol` × `delirium`/`hosp`: anticholinergic
  burden is THE documented delirium precipitant —
  world should raise `delirium` probability on
  `hosp` events proportional to `antichol`
  (mechanism priced here, trigger wired by world).
- `menop` × `preg_state`/`newpar_state`: all three
  are reproductive-stage states with complaint>store
  shapes; `menop` is unique in being stage-gated
  against symptoms (`menop_sym_null`) — the only
  state where the model FORBIDS the obvious
  mediator. Do not chain them into a "women's
  memory" bundle; each has its own evidence.
- `shift_wrk` × `chronotype`/`apnea`: a late
  chronotype on night shift is chronically
  misaligned — acute `post_night` legs compound
  with the synchrony penalty, not replace it.
  `apnea`+`shift_wrk` is the classic confound
  (shift workers are apneic at higher rates) —
  R-corr +0.2, legs separable.
- `sick_day` × `delirium`: same direction, different
  ledger — `sick_day` reverses fully, `delirium`
  steps. A flu that tips into delirium (elderly
  urinary-tract-infection phenomenology) is
  `delirium`-stacked-on-`sick_day`, not a worse
  `sick_day`.
- `smoker` × `diab` × `hear`: the vascular cluster —
  R-correlations carry the comorbidity; legs stay
  additive with `vasc_stack_cap` shared (2.0× —
  the slope ledger cannot diverge to infinity).
- `medit` × `mw`/`att_ctl`: `medit_mw_buf` is the
  only leg that touches §117's capture rate —
  they share mechanism (attentional control) and
  must not double-count: combined floor at
  `mw_rate`·0.4 (nobody meditates their way to
  zero wandering).
- `job_cplx` × `reserve` × `retire`: the three-part
  life-course arc — `job_cplx` deposits into
  `reserve`, `retire` stops the deposit and taxes
  disuse, `reserve` buffers everything else. A
  bible that wants "sharp at 85" prices it as
  job_cplx↑ + post_engagement↑, not as a magic
  reserve dial.
- `lonely` × `depr` × `social`: three-way partial
  mediation priced as residual + R-corrs, never
  derivations — no trait value is computed FROM
  another; the matrix carries the coupling.
- `migr` × `sick_day`: attack legs re-use the
  sick-day shape deliberately (same acute
  acquisition tax) — but `migr_ictal_tax` is
  trait-gated (only `migr`>0 characters get
  attack windows) while `sick_day` is universal.
- `grief` × `rumin` × `trauma`: `grief` feeds
  `rumin` on the lost-person cluster ONLY —
  global rumination stays the trait's job.
  Traumatic bereavement (witnessed death, child
  loss) is `trauma` machinery + `grief` window,
  never `grief` alone.

## 139. Extended trait vector, R additions, loading
## table (Part X)

```json
IndivTraits += {
  "hear":       0.0,   // §125 — hearing loss, dB-band scaled [0,2]
  "shift_wrk":  0.0,   // §128 — lifetime night-shift exposure [0,2]
  "smoker":     0.0,   // §130 — {0,1,2} + pack_yrs + quit_yrs
  "medit":      0.0,   // §131 — meditation practice, kept small
  "job_cplx":   0.0,   // §132 — occupational complexity history
  "lonely":     0.0,   // §134 — perceived loneliness (≠ social)
  "diab":       0.0,   // §135 — T2D {0,1,2} + diab_yrs
  "migr":       0.0,   // §136 — susceptibility; NULL on cumul legs
  // state fields (not traits):
  //   antichol [0,2] + antichol_yrs tally (§126);
  //   menop {0,1,2} stage (§127); post_night:true ctx (§128);
  //   sick_day [0,1] (§129); nicotine_sated/withdrawal_h (§130);
  //   retire {0,1} + retire_voluntary + post_engagement (§133);
  //   grief:{onset, kin_type, ambivalence} (§137);
  //   ictal:true attack windows (§136); hear_aided:true (§125);
  //   hypo_episode:true events (§135); bonded:true retells (§134)
}
```

R additions (sparse, HYPOTHESIS unless noted):

```
hear·age              +0.50  (prevalence doubles per decade — CONSENSUS)
hear·social           −0.20  (withdrawal mediator — sampling, also a leg)
hear·diab             +0.20  (vascular cluster — sampling)
antichol·age          +0.40  (polypharmacy skew — CONSENSUS)
antichol·neurot       +0.20  (TCA/antihistamine indications — sampling)
shift_wrk·apnea       +0.20  (shared risk factor — sampling)
smoker·diab           +0.20  (vascular cluster — sampling)
smoker·neurot         +0.15  (comorbidity — sampling)
medit·neurot          +0.15  (self-selected anxious practitioners — DEBATED)
job_cplx·reserve      +0.50  (deposit→buffer — CONSENSUS direction)
job_cplx·edu proxy    +0.40  (selection — CONSENSUS, edu stays separate)
lonely·social         −0.35  (perception≠headcount — CONSENSUS, partial)
lonely·neurot         +0.40  (shared affective basis — CONSENSUS dir.)
lonely·depr           +0.35  (comorbidity — CONSENSUS dir.)
diab·smoker           +0.20  (cluster — sampling)
migr·(sex=f)          +0.30  (2–3:1 prevalence — CONSENSUS)
migr·neurot           +0.15  (comorbidity — sampling)
grief·(no R entry —   event-driven state, not a trait)
retire·(no R entry —  age-gated state, world-owned)
```

### Loading table additions (rows beyond §121)

| trait/state | param | loading | tier / source |
|---|---|---|---|
| hear | heard-event E / source fields | −0.2·h / −0.15·h | CONSENSUS (Pichora-Fuller 2016) |
| hear | social_eff − / age_eff sustained | 0.3·h / 0.1·h·yrs | CONSENSUS dir. (Lin 2011/13) |
| hear | gist/semantic/stored | 0.0 — LOCKED | CONSENSUS (encoding-selective) |
| hear_aided | legs (a)+(b) rescue | 0.4 | CONSENSUS dir. (Deal 2023 ACHIEVE) |
| antichol | enc_base/attn ×(1−tax·a) | 0.25 | CONSENSUS (Caine; Risacher 2016) |
| antichol | retrieval/decay/semantic | 0.0 — LOCKED | CONSENSUS (encoding-selective) |
| antichol_yrs | age_eff += 0.5·(a·yrs/10) | per decade | CONSENSUS dose (Gray 2015) |
| menop | learn-rate / pspeed | 0.25/0.15 at st.2 | CONSENSUS (Greendale 2009) |
| menop | retention/θ/stored; rebound full | 0.0 — LOCKED | CONSENSUS (SWAN rebound) |
| menop | symptom-state mediation | 0.0 — LOCKED | CONSENSUS (Greendale 2010) |
| shift_wrk | age_eff += 3.0·w/2; recovery 0.6@5y | hist | CONSENSUS dir. (Marquié 2015) |
| sick_day | enc/wmc ×(1−tax·s); θ+ | 0.3/0.2/0.05 | CONSENSUS (Reichenberg 2001) |
| sick_day | all residue at s→0 | 0.0 — LOCKED | CONSENSUS (full reversal) |
| smoker | age_eff += 1.0·(pack_yrs/20); quit ×0.5 | slope | CONSENSUS (Sabia 2012) |
| nicotine | attn +0.08 sated / wmc −0.1 withdrawal | ctx | CONSENSUS (Heishman 2010) |
| medit | att noise −0.05·m / mw rate −0.15·m | small | CONSENSUS dir. (Chiesa 2011) |
| medit | β/θ/semantic/procedural | 0.0 — LOCKED | CONSENSUS (Chételat 2018) |
| job_cplx | reserve_eff +0.3·j / breadth +0.05·j | feed | CONSENSUS dir. (Smart 2014) |
| job_cplx | legs persist through retire | n/a — LOCKED | CONSENSUS (history, not activity) |
| retire | β_episodic/wmc −0.05·(1−engage); PM −0.1 | slope | CONSENSUS dir. (Bonsang 2012) |
| retire | step function at event | 0.0 — LOCKED | CONSENSUS (slope, not cliff) |
| lonely | w_state +0.1·l / rehearse −0.15·l | legs | CONSENSUS dir. (Cacioppo) |
| lonely | age_eff +0.15·l sustained; neg bias +0.1 | slope | CONSENSUS dir. (Wilson 2007) |
| lonely | rescue by social headcount | 0.0 — LOCKED | CONSENSUS (perception gap) |
| diab | age_eff +0.4·(d/2)·(yrs/10); pspeed +0.1 | slope | CONSENSUS (Rawlings 2014) |
| migr | ictal wmc/E −0.3·sev; sensory +0.2 | ctx | CONSENSUS (Meyer; Vurallı) |
| migr | cumulative/store legs | 0.0 — LOCKED | CONSENSUS (Rist 2012 — fifth null) |
| grief | wmc −0.25·g·kin acute; slope 0.2·g·kin | staged | CONSENSUS dir. (Shin 2018) |
| grief | intrusion ×(1+0.8·g·kin·(1−ambiv)) | sign | CONSENSUS dir. (Boelen; Kang) |
| grief | residue at g→0 | 0.0 — LOCKED | CONSENSUS dir. (adaptation) |

## 140. New explicit nulls (Part X's falsifiable edge)

- `hear_gist_null`/`hear_sem_null`: the ear taxes
  encoding bandwidth and source fields, never gist
  or the store (P1218).
- `antichol_ret_null`: the cholinergic tax is
  encoding-selective; retrieval/decay flat (P1219).
- `menop_ret_null`/`menop_sym_null`: acquisition-only,
  fully reversible, symptom-mediation forbidden
  (P1220).
- `shift_sem_null`: nights tax control and episodic
  efficiency, never the knowledge base (P1221).
- `sick_dur_null`: the fever reverses fully — no
  residue, no step (P1222).
- `smoke_encode_null`: nicotine's legs are
  withdrawal-repair attention, never an encoding
  enhancer (P1223).
- `medit_store_null`: the cushion trains attention;
  the vault is the same vault (P1224).
- `jobcplx_retire_null`: the deposit is banked at
  retirement; legs don't decay (P1225).
- `retire_step_null`: slope, never cliff (P1226).
- `lonely_crowd_null`: headcount doesn't rescue the
  felt-isolation legs (P1227).
- `diab_sem_null`: the slope is efficiency, not
  knowledge (P1228).
- `migr_cumul_null`: the fifth mandated null —
  attack windows cost, lifetime ledger clean
  (P1229).
- `grief_perm_null`: bereavement is a wound, not a
  lesion — legs return at adaptation (P1230).

## 141. Falsifiable probes (P1218–P1230;
validation-design §235)

- **P1218 the crowded room (MUST — channel-lock):**
  hear=0 vs hear=1.5 on identical spoken-event
  streams: heard-event E drops ≈`hear_effort_tax`,
  source fields thin ≈`hear_src_tax`, gist fields
  bit-comparable (`hear_gist_null`); `hear_aided`
  arm rescues ≈`hear_aid_rescue` of (a)+(b), not
  the social drag. Lin 2011/2013; Deal 2023.
- **P1219 the bedtime antihistamine (MUST —
  selectivity-lock):** antichol 0→1.5: encoding
  drops ≈`antichol_enc_tax`, retrieval/decay/
  semantic identical (`antichol_ret_null`);
  `antichol_yrs`=10 arm shows `age_eff` step
  ≈`antichol_decline`; washout restores encoding,
  not the step. Gray 2015; Risacher 2016.
- **P1220 the transition (MUST — stage-lock):**
  menop stage 0/1/2/post on one character:
  learning-rate legs dip per `menop_learn_tax`,
  complaint surface exceeds the dip, retention of
  pre-transition records flat (`menop_ret_null`),
  and the dip is identical under depr=0 vs depr=1
  (`menop_sym_null`); post stage restores all legs
  over `menop_rebound_d`. Greendale 2009/2010.
- **P1221 the decade of nights (SHOULD —
  recovery-lock):** shift_wrk=2 with day_shift_yrs
  0 vs 6: `age_eff` delta ≈`shift_age_equiv`,
  second arm shows ≈`shift_recovery` fraction
  recovered, never full; `post_night` ctx reads as
  synchrony antipeak; semantic measures identical
  (`shift_sem_null`). Marquié 2015.
- **P1222 the flu week (MUST — reversal-lock):**
  sick_day 0/0.7/0 arms: encoding and wmc legs
  drop dose-ordered, `fuzzy:true` fragments mint
  at s≥0.6, and at s→0 every leg returns to
  baseline within measurement noise
  (`sick_dur_null` — contrast P1088's delirium,
  which must NOT return). Reichenberg 2001.
- **P1223 the pack a day (SHOULD — shape-lock):**
  smoker arms never/quit-5y/current at matched
  pack_yrs: slope legs ordered current>recent-quit>
  never (`smoke_quit_rescue` arm intermediate);
  acute `nicotine_sated` bumps attention only when
  withdrawal_h>2, never touches enc_base
  (`smoke_encode_null`). Sabia 2012; Heishman 2010.
- **P1224 the cushion (MUST — size-lock):**
  medit=+2 vs −2: attention scatter and mw-capture
  differ per `medit_*_buf` legs; β/θ/semantic/
  procedural identical within jitter
  (`medit_store_null`); complaint self-report
  improves `medit_conf_gain` regardless. Chiesa
  2011; Chételat 2018.
- **P1225 the deposit stays (SHOULD —
  persistence-lock):** job_cplx=+1.5 character at
  retire onset: `reserve`-eff and breadth legs
  bit-identical pre/post (`jobcplx_retire_null`);
  only the `retire` slope legs engage. Smart 2014;
  Rohwedder & Willis 2010.
- **P1226 the emptied desk (MUST — shape-lock):**
  retire=1 at post_engagement 0.2 vs 0.8: low-
  engagement arm declines on `retire_slope_tax`
  with PM first; high-engagement arm statistically
  flat; NO discontinuity at the retirement event
  in either arm (`retire_step_null`). Bonsang
  2012; Rohwedder & Willis 2010.
- **P1227 the crowded loneliness (MUST —
  perception-lock):** lonely=+1.5 at social=+1.5
  vs social=−1.5: legs (vigil, rehearsal deficit,
  neg-bias) identical across social arms
  (`lonely_crowd_null`); `bonded:true` retells
  rescue, headcount does not. Cacioppo & Hawkley
  2009; Shankar 2013.
- **P1228 the sugar ledger (SHOULD — domain-lock):**
  diab=2 at diab_yrs=15 vs matched: `age_eff`
  slope ≈`diab_decline_k`·dose, pspeed legs
  largest, semantic flat (`diab_sem_null`);
  `hypo_episode` windows mint fragments.
  Rawlings 2014; Biessels & Despa 2018.
- **P1229 the fifth null (MUST — locked):**
  migr=2 with 100 simulated `ictal` attacks vs
  migr=0: attack windows show ≈`migr_ictal_tax`
  acquisition cost and `migr_sens_gain` sensory
  overweight; every cumulative/lifetime measure —
  age_eff slope, β, store integrity — identical
  (`migr_cumul_null`). Rist 2012.
- **P1230 the year after (MUST — staging-lock):**
  grief:{kin=spouse} at 1/6/18/30-month arms:
  acute wmc tax in window, intrusion cluster
  concentrated on lost-person records, slope leg
  halves at 12m; 30-month arm statistically
  recovered (`grief_perm_null`); ambivalent-kin
  arm shows fewer intrusions at equal slope
  (Kang moderation). Shin 2018; Ifcher 2021.

## 142. Part X honest limits

- `hear`'s three-leg split (effort / source /
  withdrawal) decomposes the effortfulness literature
  into our field structure — CONSENSUS direction
  (Pichora-Fuller's resource reallocation) but the
  specific 0.2/0.15/0.3 weights are our
  decomposition; the literature gives task-level
  deficits, not per-field weights. `hear_aid_rescue`
  0.4 is ACHIEVE's ARC-arm number priced mid-range —
  the trial showed slope benefit, not encoding
  mechanics.
- `antichol`'s cumulative `age_eff` leg converts
  Gray's hazard-ratio gradient into a slope term —
  the dose-response is CONSENSUS, the linearization
  is ours; confounding-by-indication (depression,
  insomnia driving the prescriptions) is priced via
  R-corrs, not removed.
- `menop`'s stage-not-symptom null is the strongest
  claim in the part — Greendale 2010's mediation
  null is real but single-cohort; if future
  longitudinal work shows vasomotor/sleep mediation,
  `menop_sym_null` fails loudly by design.
- `shift_wrk`'s `shift_age_equiv` mapping prices
  Marquié's ~6.5-year equivalent at 3.0 — we halved
  it because his exposure was *rotating* shifts
  specifically and his recovery estimate was
  post-hoc; direction CONSENSUS, magnitude ours.
- `sick_day`'s 0.3 encoding tax interpolates
  Reichenberg's endotoxin paradigm (a controlled
  immune spike, not a natural illness) — real colds
  are milder, real pneumonias worse; the [0,1]
  scaling is world judgment.
- `smoker`'s `smoke_encode_null` is the disciplined
  reading of Heishman — most acute nicotine effects
  reverse deprivation, so we pay the attention leg
  only out of withdrawal. Non-deprived nicotine
  gains exist in the meta but are smaller than the
  jitter we already carry.
- `medit`'s small legs reflect a literature with
  real attention effects and failed primary
  endpoints (Chételat) simultaneously — we priced
  both. The `medit_mw_buf` leg is the best-
  supported mechanism; `medit_att_buf` is the most
  contested.
- `job_cplx`'s deposit-not-level restriction is our
  causal-discipline choice — the selection critique
  (smart people take complex jobs) is live; we
  handle it by requiring `job_cplx` legs to route
  through `reserve`-eff rather than minting level.
- `retire`'s engagement moderation is the honest
  middle of a genuinely contested literature —
  Rohwedder & Willis vs selection critiques are
  unresolved; `post_engagement` is world-supplied
  and the probe tests both arms.
- `lonely`'s independence from `social` is the
  finding itself (Cacioppo's perception-gap) — but
  the −0.35 R-corr is sampling choice; real-world
  loneliness-social correlations vary by measure
  (UCLA vs de Jong Gierveld).
- `diab`'s slope-only pricing assumes the vascular
  cluster shares mechanisms — the `vasc_stack_cap`
  is our guard against triple-counting
  smoker/diab/hear comorbidity into absurdity.
- `migr`'s mandated null is the part's most
  falsifiable edge — Rist's protective direction
  was N=6349 but observational; we lock the null
  at *zero*, not at the protective sign (a null
  finding doesn't license a benefit).
- `grief`'s staging (acute/slope/adaptation) is our
  decomposition of cohort findings that mostly
  report single time-points; the ambivalence
  moderation (Kang MIDUS) is N≈150 and priced as
  direction not magnitude. `kin_type` dose-
  ordering follows attachment research convention,
  not a single graded study.
