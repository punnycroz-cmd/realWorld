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
