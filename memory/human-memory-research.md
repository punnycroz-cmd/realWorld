# Human Memory — Literature Survey for RW Character Memory
**Track:** memory-research (sf/memory) — v0
**Purpose:** ground the formal model in `memory-model-spec.md`. Every claim below is
tagged **[CONSENSUS]**, **[DEBATED]**, or **[HYPOTHESIS]** (our extrapolation, not in
the literature). Citations are author/year; landmark studies are named.

---

## 1. Architecture: what "memory" even is

The dominant taxonomy separates memory by content and duration.

- **Sensory / working memory.** Sensory registers hold ~1s of raw trace (Sperling 1960,
  the partial-report experiments). Working memory holds ~4±1 chunks (Cowan 2001;
  the older "7±2" of Miller 1956 overstates for unrelated items). Duration without
  rehearsal: ~15–30s (Peterson & Peterson 1959). **[CONSENSUS]**
- **Episodic memory** — autobiographical events with what/where/when context
  (Tulving 1972, 1985). What viewers would call "what actually happened to her."
- **Semantic memory** — decontextualized facts and concepts (Tulving 1972).
  In RW terms: "the Mission has good burritos," not the night she ate one.
- **Procedural memory** — skills/habits, largely implicit, extremely resistant to
  decay and to amnesia (patient H.M., Scoville & Milner 1957; Corkin 1968 showed
  H.M. could learn new motor skills while denying ever practicing).
- **Emotional/associative memory** — conditioned affective responses that can
  persist when the episodic source is gone (fear conditioning; LeDoux 1996;
  Bechara et al. 1995 — amygdala patients lose the fear without losing the facts,
  hippocampal patients lose the facts without losing the fear). **[CONSENSUS]**
- **Autobiographical memory** is not a tape archive but a hierarchical,
  reconstructive structure: lifetime periods → general events → event-specific
  details (Conway & Pleydell-Pearce 2000, the "self-memory system"). Recall is
  *reconstruction*, always partly rebuilt at retrieval time (Bartlett 1932,
  "Remembering" — the War of the Ghosts studies showed systematic schema-driven
  distortion within a few retellings). **[CONSENSUS]**

**Model consequence:** RW characters need four stores (episodic, semantic,
procedural, emotional) with different decay/distortion rules — not one event log.

---

## 2. Encoding: what gets in

Not everything is encoded. Encoding strength is the single biggest lever on
whether a memory exists at all.

- **Attention is the gate.** Inattentional blindness (Simons & Chabris 1999,
  the gorilla study) and change blindness show unattended events may leave
  *no* retrievable trace. Divided attention at encoding roughly halves later
  recall (Craik et al. 1996). **[CONSENSUS]**
- **Levels of processing.** Deep/semantic encoding beats shallow encoding
  (Craik & Lockhart 1972; elaborative > maintenance rehearsal, Craik & Watkins
  1973). Self-referential encoding is among the strongest (Rogers, Kuiper &
  Kirker 1977 — the self-reference effect). **[CONSENSUS]**
- **Emotion.** Arousal enhances consolidation via noradrenergic/amygdala
  modulation of hippocampal storage (McGaugh 2000, 2004; Cahill & McGaugh 1998
  — beta-blocker propranolol abolishes the emotional-memory advantage).
  Emotion narrows encoding to central/gist features at the expense of
  peripherals ("weapon focus," Loftus, Loftus & Messo 1987; Easterbrook 1959
  cue-utilization narrowing). **[CONSENSUS on the effect; DEBATED on exact
  mechanism and how much peripheral detail is lost vs. misattributed]**
- **Novelty & distinctiveness.** Distinctive events are remembered better
  (von Restorff 1933). Novelty engages dopaminergic midbrain → hippocampus and
  boosts encoding of even *unrelated* nearby material (Lisman & Grace 2005;
  Fenker et al. 2008). **[CONSENSUS]**
- **Prediction error.** Events that violate expectation are preferentially
  encoded — memory updates where the model was wrong (statistical-learning and
  event-segmentation literature; Zacks et al. 2007 on event boundaries as
  encoding points). **[CONSENSUS-ish; mechanism DEBATED]**
- **Repetition & spacing.** Repetition helps, but spaced repetition helps far
  more than massed (Ebbinghaus 1885 already; Cepeda et al. 2006 meta-analysis).
  Retrieval practice (testing) beats restudy — the *testing effect*
  (Roediger & Karpicke 2006). **[CONSENSUS]**
- **Sleep.** Sleep consolidates declarative memory; deep NREM supports episodic
  consolidation, REM is argued for emotional/procedural (Walker & Stickgold
  2004, 2006; Diekelmann & Born 2010). Sleep deprivation before or after
  encoding impairs it. **[CONSENSUS that sleep helps; DEBATED on stage-specific
  roles — the REM-emotional link is contested, e.g. recent failed
  replications]**

**Model consequence:** encoding strength `E` should be a multiplicative/weighted
function of attention, depth (self-relevance), emotional arousal, novelty/
prediction-error, repetition-with-spacing, and sleep state. See spec §4.

---

## 3. Forgetting: how traces die

- **Ebbinghaus forgetting curve.** Retention falls steeply then flattens —
  roughly exponential/power-law; Ebbinghaus 1885 (nonsense syllables,
  self-experiment). Modern fits often prefer power functions
  (Wixted & Ebbesen 1991) or exponential-with-asymptote; the *form* is debated,
  the *shape* (steep early, long tail) is not. **[CONSENSUS shape, DEBATED form]**
- **Retention rate varies with meaning.** Meaningful material decays much
  slower than nonsense; emotionally significant and repeatedly retrieved
  material flattens its curve (consequence: decay rate must be
  memory-type- and strength-dependent).
- **Interference is the bigger killer.** Proactive (old blocks new) and
  retroactive (new overwrites old) interference (McGeoch 1942; Underwood 1957
  — much "decay" is really interference from similar material). Similar events
  (the 40th identical commute) actively degrade each other → characters should
  blur routine repetitions into a *generic* memory. **[CONSENSUS]**
- **Retrieval-induced forgetting.** Recalling an item suppresses competing
  related items (Anderson, Bjork & Bjork 1994). Retelling a story makes the
  *untold* details more forgettable. **[CONSENSUS effect; DEBATED boundary
  conditions — replicability is decent but magnitudes vary]**
- **Motivated forgetting / suppression.** Deliberate suppression via the
  think/no-think paradigm reduces later recall (Anderson & Green 2001).
  Repression as Freud described is **not** supported as a general mechanism;
  suppression exists but is leaky and effortful. **[DEBATED; suppression —
  moderate support, repression — weak support]**
- **Transience over very long timescales.** Most events are simply never
  retrieved and fade below threshold; "permanent" memory is mostly the
  frequently-rehearsed subset (Conway 2005 autobiographical literature).

**Model consequence:** forgetting = trace decay (power-law in time) ×
interference from similar neighbors × retrieval history. Not a TTL.

**v1 calibration (see `forgetting-curves.md` for full fits):** Rubin & Wenzel
1996 (105 functions × 210 datasets → power/log/√t-exp/√t-hyperbola tie;
autobiographical is the exception); Murre & Dros 2015 (Ebbinghaus replicated,
24h sleep plateau); β_episodic ≈ 0.47 at τ=1.2d reproduces Ebbinghaus;
Bahrick 1984 permastore (semantic two-regime life); Wagenaar 1986 cue order
what > who ≈ where >> when; Deffenbacher 2008 face-strength ceiling ~0.67;
Deffenbacher 2004 stress encoding cost d≈−0.31; Jenkins & Dallenbach 1924
sleep-shielding; Park et al. 2002 linear age decline in episodic, rising
semantic.

---

## 4. Retrieval: how memories come back

- **Encoding specificity.** Retrieval succeeds when the retrieval context
  matches the encoding context (Tulving & Thomson 1973). Godden & Baddeley
  1975 — divers remembered word lists better in the same environment
  (wet/dry) as learning. Context includes place, people, and sensory state.
- **State- and mood-dependent retrieval.** Material learned in a state is
  better recalled in that state — drug states (Goodwin et al. 1969), mood
  (mood-congruent recall: depressed mood biases toward negative memories —
  Bower 1981; Blaney 1986). **[CONSENSUS for mood-congruence; state-dependency
  effects are real but modest in size]**
- **Cues.** A memory is retrieved probabilistically as a function of cue overlap
  — the fan effect: more associations to a cue dilute it (Anderson 1974).
  Odor is an unusually potent cue for autobiographical memory (the "Proust
  effect," Chu & Downes 2000).
- **Primacy & recency.** Serial-position curve (Murdock 1962): first items get
  rehearsal → long-term; last items sit in working memory. Recency fades with a
  delay, primacy persists. **[CONSENSUS]**
- **Retrieval rewrites the trace.** Each recall re-encodes the memory
  (reconsolidation; Nader, Schafe & Le Doux 2000; Hupbach et al. 2007).
  Reconsolidation is the mechanistic basis for drift: memories become less
  accurate the more they are retold *if* retellings introduce errors — but
  retelling also strengthens the core. **[CONSENSUS that retrieval modifies;
  DEBATED how much clinical "memory editing" is achievable]**
- **Availability & fluency.** What is easily retrieved feels true and recent
  (Tversky & Kahneman 1973; the recency illusion in self-report).

**Model consequence:** retrieval should be a stochastic function of cue-match,
trace strength, mood/state congruence, and cue competition — never a key lookup.

**v2 calibration (full derivations in `retrieval-cues.md`):** Tulving & Osler
1968 → cues must be encoded to work AND cue combination saturates (noisy-OR,
not sum); Tulving & Thomson 1973 + Muter 1978 → recognition/recall asymmetry
(~53% recognition failure of recallable names); Watkins & Watkins 1975 +
Anderson & Reder 1999 → log-fan dilution, merged memories = one fan item
(Radvansky 1993); Smith & Vela 2001 meta → place reinstatement d≈0.23, grows
with interval, mental reinstatement substitutes ~0.6×; Chu & Downes 2000/2002
→ odor cues shift the reminiscence bump to ages 6–10, age-scaled sensory
weight + incongruent-sensory penalty; Eich 1989 + Mecklenbräuker & Hager 1984
→ mood-state dependence split from mood congruence, small and erased by
external cues (w_msd·(1−cueMatch_ext)); Berntsen 2009/2013 → involuntary
recall is the default mode (~3× voluntary, 2–5/day, unfocused attention) →
ambientMemoryScan; Roediger 1973 → part-list cuing suppresses listener's
unspoken fields in discussEvent.

---

## 5. Emotional memory

- **Flashbulb memories.** Vivid, confident, *not necessarily accurate*.
  Brown & Kulik 1977 coined it; Neisser & Harsch 1992 (Challenger) and Talarico
  & Rubin 2003 (9/11) showed flashbulb memories decay and distort like ordinary
  memories — only *confidence* stays high. **[CONSENSUS]** Directly useful for
  RW: characters should be *certain* of emotional events and still be wrong.
- **Trauma.** Core traumatic events are often hyper-remembered and intrusive
  (PTSD intrusive memory, Brewin et al. 1996), while *peripheral* details and
  sometimes the event's timeline fragment. Whether trauma is better or worse
  remembered than neutral events depends on which detail you measure.
  **[DEBATED — "repressed trauma" recovery claims are largely discredited
  (Loftus 1993; McNally 2003)]**
- **Fading affect bias.** Negative emotions associated with memories fade
  faster than positive ones (Walker, Vogl & Thompson 1997; replicated,
  Ritchie et al. 2015) — older adults show it most strongly (the positivity
  effect, Carstensen's socioemotional selectivity). Useful: grudges fade in
  felt intensity faster than warm memories. **[CONSENSUS]**
- **Emotion colors recall.** Current mood biases which memories surface
  (§4) and how they're reconstructed — a character having a bad day should
  recall the same event more negatively.

**v5 calibration (full derivations in `emotional-memory.md`):** Sharot &
Phelps 2004 + Ritchey et al. 2008 + Nishida et al. 2009 → the emotional
advantage is consolidation-bought and grows with delay →
`emo_consol_gain` first-sleep bonus. Mather & Sutherland 2011 ABC →
one-sided peripheralLoss replaced by two-sided reallocation
(`abc_gain` central boost). Strange et al. 2003 + Hurlemann 2005 +
Knight & Mather 2009 → emotional blink (neighbor encodingE suppression,
predictive neighbors exempt) + Cahill et al. 2003 `post_stress_gain`
retrograde enhancement. Kensinger & Schacter 2006 (Red Sox) + Kensinger
2007 + Storbeck & Clore 2005 + Booker et al. 2021 → valence-conditioned
distortion (`neg_fidelity`/`pos_gist_drift`/`neg_core_resist`). de
Quervain et al. 1998/2000 + Roozendaal 2004 → stress impairs RETRIEVAL
(`stress_retrieve_loss` on θ) while enhancing consolidation — timing
split (Joëls 2006/2011). Sharot et al. 2004 + Talarico & Rubin 2003 →
`conf_emo_gain` arousal² + `flashbulb_conf_floor` permanent certainty.
Bouton & Bolles 1979 / Bouton & King 1983 / Bouton 2004 → conditioned-
affect table dynamics (acquire/fire/extinct/renewal/spontaneous
recovery/reinstatement — extinction is suppression, never erasure).
Brewin et al. 1996 → `trauma:true` record phenotype (floor, fragmented
`when`, intrusion discount, plist exemption, misinfo-resistant core).
Matt et al. 1992 (d≈0.4) → `mood_bleed` reconstruction shift.
Walker et al. 2003 → dysphoria disrupts FAB (depressive modifier).
Kensinger et al. 2007 → emotional enhancement PRESERVED in aging →
emotional params stay off the decline curve. Probes P31–P38 (spec v0.5).

---

## 6. False memory: the system lies

This is the most design-relevant section — RW characters must be *wrong
sometimes*, believably.

- **Misinformation effect.** Post-event information contaminates the original
  memory. Loftus & Palmer 1974 (car "smashed" vs "hit" → higher speed estimates
  and false broken-glass memories); Loftus, Miller & Burns 1978 (stop sign vs
  yield sign). The mechanism is debated — genuine overwriting vs.
  source-confusion vs. demand effects — but the effect is the most replicated
  in memory science. **[CONSENSUS effect, DEBATED mechanism]**
  → *Game hook:* hearing a rumor after an event should distort the event
  memory. This is the rumor-propagation interface.
- **Source-monitoring errors.** People correctly remember content but
  misattribute its source — imagined vs. perceived, own words vs. heard,
  who-told-me (Johnson, Hashtroudi & Lindsay 1993, source-monitoring
  framework). "I remember hearing about the fire" — but from whom, and was it
  first-hand? **[CONSENSUS]**
- **Imagination inflation.** Imagining an event increases confidence it
  happened (Garry et al. 1996); repeatedly discussing an imagined event can
  create rich false memories (Hyman & Pentland 1996 — false childhood events
  implanted in ~25% of subjects with guided imagery). **[CONSENSUS effect;
  base rates DEBATED]**
- **Confabulation.** Gaps are filled with plausible schema-consistent material
  without intent to deceive — extreme in Korsakoff's/confabulating patients
  (Kopelman 1987), but normal adults do a mild version constantly: memory is a
  storyteller (Bartlett 1932; Schacter's "seven sins," 1999/2001).
- **Schemas & gist.** Remembering preserves *gist*, discards *verbatim* —
  fuzzy-trace theory (Reyna & Brainerd 1995). DRM paradigm: lists of
  associates ("bed, rest, tired…") produce confident false recall of the
  non-presented lure "sleep" (Roediger & McDermott 1995) — false memories arise
  from the same gist machinery that makes memory efficient.
- **Social contagion / conformity.** Memories adopted from co-witnesses and
  group discussion (Roediger, Meade & Bergman 2001; Wright, Self & Justice
  2000). Directly relevant: two characters who talk about an event converge on
  a shared (possibly false) version.
- **Confidence ≠ accuracy.** Repeatedly demonstrated (Roediger & DeSoto 2014 —
  the confidence-accuracy relationship degrades under exactly the conditions
  real life creates: delay, post-event info, repeated retellings).

**Model consequence:** distortion must be a first-class operator — memories
drift toward gist, adopt post-event information, lose source tags, and inflate
with rehearsal. Confidence and accuracy are separate fields.

**v6 calibration (full derivations in `false-memory.md`):** the
misinformation effect is calibrated against the 50-year meta (g=0.735,
480 studies) with moderators formalized — post-warnings halve it
(`warn_mult` 0.45; Blank-line post-warning meta, 155 effect sizes),
repetition compounds logarithmically while source *variability* is a
null moderator (`hearCount` content-hash, `rep_gain·log1p`; Paterson-
line meta k=8 + illusory-truth meta g=0.37), live dispute near-blocks
(`dispute_mult` 0.05; Wade et al. 2018 multilab N=486), and per-field
`fieldStrength` replaces record-level accuracy as the absorption gate
(retention-interval moderator). Continued influence: corrections flip
beliefStatus at trust-gated `retract_p` but content keeps `cie_residual`
inference weight (Johnson & Seifert 1994; Ecker 2010/2011/2017 —
reminder-corrections help). Sleep is double-edged: Frenda et al. 2014
→ permanent `sleepdep_flag` only when deprivation covers ENCODING;
Payne et al. 2009 → `sleep_gist_boost` preserves gist/phantom over
verbatim (2025 preregistered partial replication noted). New phantom
machinery: DRM 40–55% false recall / FA≈hits (Roediger & McDermott
1995) + fuzzy-trace verbatim-suppresses-false (Reyna & Brainerd) →
`gist_lure_gain`/`phantom_p`/`phantom_fan_min` minting. Imagination
inflation (Garry 1996; implantation rates Loftus & Pickrell 25% →
Murphy 2023 35%; Brewin & Andrews 2017: 47% some experience / 15% full;
plausibility gate Scoboria 2004/Pezdek) → `imagineEvent` +
`source_confuse_flip` reality-monitoring failures (Johnson & Raye).
Source monitoring becomes retrieval-time inference (`sourceInfer`,
Johnson et al. 1993). Belief/recollection dissociation (Scoboria 2014;
Mazzoni 2010 ~20% nonbelieved; Rubin, Schrauf & Greenberg 2003) →
derived `believe_p`/`recollect_q` pair under `beliefStatus`.
Conformity anchors: Gabbert 2003 (71%), Wright 2000 (79%), Carol 2013
(power asymmetry). Spec v0.6: record +phantom/retracted/hearCount/
sleepdep_flag; §6.3 rewritten; new §§6.6–6.10; +16 params; probes
P39–P47.

---

## 7. Age effects (the lifespan curve)

The single largest individual-difference variable for RW's cast.

- **Infantile/childhood amnesia.** Adults retain essentially nothing from
  before ~age 3, little before ~5–7 (Pillemer & White 1989; Rubin 2000;
  Bauer 2007 — childhood amnesia reflects immature hippocampal/encoding
  machinery, plus later loss of early childhood memories through childhood
  itself, Bauer & Larkina 2014). **[CONSENSUS]**
- **Childhood.** Encoding is weaker, source-monitoring poor, suggestibility
  high — children are the most susceptible witnesses to misinformation
  (Ceci & Bruck 1993). Metamemory (knowing what you remember) develops late.
- **Adolescence.** Memory capacity and strategy mature through the teens;
  reward/emotional salience is high (adolescent limbic-prefrontal imbalance,
  Casey et al. 2008) → emotionally intense, socially weighted encoding.
- **Reminiscence bump.** Adults recall disproportionately many autobiographical
  memories from ages ~10–30, peaking 15–25 (Rubin, Wetzler & Nebes 1986;
  Rubin & Schulkind 1997) — the formative-identity period, plus firsts and
  high novelty. **[CONSENSUS]** Model: encoding strength should have a
  permanent "formative era" bonus — events in one's 15–25s decay slower
  forever after.
- **Young adulthood (20s–30s).** Peak episodic encoding and retrieval speed.
- **Midlife (40s–50s).** Modest episodic decline begins; semantic knowledge
  and gist-based recall still strong; "tip-of-the-tongue" and name retrieval
  failures increase (Burke et al. 1991).
- **Older adulthood (60+).** Episodic detail declines (source memory and
  contextual detail degrade first — Spencer & Raz 1995; Johnson et al. 1993);
  semantic memory is largely preserved into old age; procedural memory most
  preserved. Older adults rely more on gist → *more* schema-consistent false
  memories and misinformation susceptibility (Jacoby & Rhodes 2006;
  Balota et al. 1999; Karpel, Hoyer & Toglia 2001). Positivity effect:
  relative preference for positive over negative information (Mather &
  Carstensen 2005). Prospective memory (remembering to do things) degrades.
  Working-memory capacity shrinks. **[CONSENSUS on the pattern; timing/variance
  individual — DEBATED how much is cohort vs. biology]**

**Model consequence:** age bands change *parameter values*, not the model.
Same equations; different weights. See profiles doc.

**v3 calibration (full derivations in `age-development.md`):** two-age
split — capacity params key on age_now, era params (amnesia ramp, bump)
on encodeAge. Rubin 2000 (11k memories): density rises from birth to ~7,
first-memory mean ≈3.5. Bauer & Larkina 2013/2014: children fit an
exponential, adults a power law; 5–7y recall >60% of early events, 8–9y
<40% → `amnesia_ramp` on E + permanent `amnesia_decay_mult`. Rubin 1986 /
Janssen et al. 2005 / Berntsen & Rubin 2004: bump window 10–30 peaked
~15 (earlier for women), and **valence-gated** — positive/important
memories bump, sad ones don't → `bump_gain` raised-cosine +
`bump_valence_gate`. Naveh-Benjamin 2000 associative deficit → `link_p`·
`assoc_mult(age)` on edge/binding formation. Brainerd & Reyna
developmental reversal → split suggestion (U: misinfo_suscept) from gist
(monotonic: confab_fill) channels. Spencer & Raz 1995 → source fragility
U-shaped. Phillips et al. 2008 + 2024 meta → prospective-memory paradox,
optional `Intention`/`pm_self` extension. Mather & Carstensen 2005 →
`w_emo_pos`/`w_emo_neg` split. Continuous knot table replaces band
lookup (spec v0.3).

**v4 calibration (full derivations in `age-decline.md`):** decline-side
mechanisms and modulators. Craik 1983/2022 + Angel et al. 2010 +
context-reinstatement meta (g=0.32, no age difference): deficits live in
self-initiated retrieval → `env_support_gain(age)` on cueMatch_ext,
`search_breadth` candidate cap, place-reinstate explicitly NOT
age-penalized. Hasher & Zacks 1988 + Autobiographical Interview meta
(internal details down, external up) → `discrim_mult` on thresholds +
confab_fill second anchor. Stark/Yassa 2011–2015 pattern separation →
`discrim_mult` + `lure_accept` false-positive in recognition. Jacoby
recollection/familiarity split + Piolino 2009 + AMT meta →
`specificity` capacity curve with `pos_spare` positive-cue sparing.
Burke et al. 1991 TOT → `tot_rate` partial retrieval (name-blanking,
feeling-of-knowing, recognition-resolvable). Mander et al. 2013 →
`sws_mult(age)` on episodic consolidation only. Stern 2002 +
Valenzuela & Sachdev 2006 (OR 0.54) + 2024 life-course meta →
`reserve`/`age_eff` shift (~10y compression, decline params only).
Wilson et al. 2003 (43-month change point, 6×) + Wilson 2012 terminal
dedifferentiation (domain correlations .25–.46 → .83–.89) →
`deathDay`/`terminal_window` global ramp, reserve-exempt. Li &
Lindenberger dedifferentiation → `ret_noise` σ on drive. Rönnlund
2005 Betula longitudinal → midlife knots flattened (no episodic
decline before ~60). New knot table age-decline.md §13; probes
P23–P30 (spec v0.4).

---

## 8. Individual differences (within-age variation)

- **Sleep quality.** Chronic poor sleep impairs encoding/consolidation
  (Walker 2008; Diekelmann & Born 2010) — the high-stress/insomniac character
  encodes less and misremembers more. **[CONSENSUS direction]**
- **Stress.** Moderate arousal helps (inverted-U, Yerkes & Dodson 1908);
  chronic cortisol impairs hippocampal function and episodic recall
  (Lupien et al. 2007; McEwen 2007). Acute stress at encoding narrows and
  intensifies; at retrieval it degrades (stress impairs retrieval even of
  well-learned material — de Quervain et al. 1998). **[CONSENSUS]**
- **Depression/rumination.** Overgeneral autobiographical memory — depressed
  people recall categories ("all the times I failed") rather than specific
  episodes (Williams & Broadbent 1986; Williams et al. 2007). Mood-congruent
  bias. **[CONSENSUS]**
- **Personality.** Neuroticism correlates with negative-bias recall;
  extraversion with faster/more social memory access. Effects are modest —
  **[DEBATED/hypothesis territory]** — but useful as small parameter tilts.
- **Rumination & rehearsal habits.** Some people retell and re-encode
  constantly (writers, gossips, brooders) → strong but drifted memories;
  others let things fade. This is partly a *behavioral* parameter (retrieval
  frequency), not just a trait. **[HYPOTHESIS as parameterization]**
- **Expertise.** Domain knowledge deepens encoding and gist quality in the
  domain (chess masters, Chase & Simon 1973) — a bartender remembers patrons'
  orders; a landlord remembers every lease.
- **Trauma history.** Prior trauma sensitizes emotional encoding
  (hypervigilance for threat cues) while fragmenting contextual detail —
  parameter: higher arousal weight, lower detail fidelity under stress.

**v7 calibration (full derivations in `individual-differences.md`):**
within-age variance is STRUCTURED, not noise — common memory factors
(Carroll 1993), twin heritability ~40–60% (McClearn 1997; Volk 2006),
and WMC predicting misinformation resistance/source monitoring
(Jaschinski & Wentura 2002; Zhu et al. 2010, N=436; Brydges et al.
2018: memory-for-materials, not WMC, drives continued influence — an
explicit NULL) → correlated `IndivTraits` latent layer replaces ±10%
independent jitter (MVN(0,R) → §3 loading table → ±5% residual).
Anchors: Asperholm et al. 2019 (617 studies, 1.23M — female episodic
advantage g=0.19, verbal 0.28, faces 0.26, odor 0.37; male spatial
−0.20/−0.24 → material-specific tilts, deliberately sub-jitter);
Cuttler & Graf 2007 (conscientiousness predicts PM where cognitive
ability doesn't → consc→pm_self); Rubin, Boals & Berntsen 2008 +
Rusting & Larsen 1997 (neurot→intrusions/negative tone, extra→positive
retrieval); May, Hasher & Stoltzfus 1993 (synchrony — age deficit
vanishes at optimal time → `peak_hour`/`synchrony_gain`, age-scaled);
van Bergen 2010 + Gudjonsson (`distrust` → retract_p/confidence);
Horselenberg 2000 (`fantasy` → imagination inflation); Dawes 2022
aphantasia (`vivid` → detail width, never accuracy); LePort 2012 HSAM
+ Palombo 2015 SDAM extreme-tail recipes — with Patihis et al. 2013's
critical null: HSAM equally susceptible to DRM/misinformation, so
superior storage never buys veridicality. Spec v0.7: +4 params
(peak_hour, synchrony_gain, vivid_detail, conf_bias), synchrony on E
and θ, trait layer + deriveParams in §7/§10; probes P48–P56.

---

## 9. Synthesis → model hooks

| Literature finding | Model hook (spec §) |
|---|---|
| Attention gates encoding | attention factor in E (§4) |
| Depth/self-relevance | selfRelevance factor (§4) |
| Arousal enhances, narrows | arousal boosts E, lowers peripheral-detail fields |
| Novelty/prediction error | novelty factor (§4) |
| Spaced repetition | retrieval/boost operator, not time-decay reset |
| Power-law decay | retention R(t) = strength·(1+t/τ)^−β (§5) |
| Interference | neighbor-similarity suppression (§5) |
| Retrieval-induced forgetting | recall suppresses competitors (§6) |
| Encoding specificity | cue-vector match in P(retrieve) (§6) |
| Mood congruence | mood-state cue weight (§6) |
| Reconsolidation drift | each retrieval mutates detail fields (§7) |
| Misinformation effect | post-event-info merge operator (§7) |
| Source-monitoring errors | source field decays first, confusable (§7) |
| Fading affect bias | emotional intensity decays, negative faster (§5) |
| Reminiscence bump | age-band permanent encoding bonus (§8) |
| Episodic ↓ / semantic preserved in age | per-type decay rates by age band (§8) |
| Confidence ≠ accuracy | separate `confidence` field (§3) |
| Overgeneral memory in depression | specificity parameter (§8) |

---

## 10. What's still debated (honest list)

- Exact functional form of the forgetting curve (power vs. exponential vs.
  multi-trace) — we pick power-law + asymptote for tractability.
- Reconsolidation-based "memory erasure" — real mechanism, unreliable
  application.
- REM-sleep-specific emotional consolidation — contested.
- Repression — we model suppression (weak, effortful), never Freudian
  repression.
- Whether flashbulb events preserve *core* details better — yes for
  central/gist, no for peripherals; we encode that split.
- Infantile amnesia mechanism (encoding failure vs. retrieval failure).
- Magnitude (not existence) of retrieval-induced and misinformation effects in
  naturalistic settings.

## 11. Our hypotheses (explicitly not literature)

- Parameter-weight vectors per character suffice to generate believable
  diversity (the model's central bet).
- Gist/verbatim field split (verbatim decays fast, gist decays slow, gist
  controls reconstruction) reproduces DRM-style confabulation cheaply.
- A "rumor merge" operator where another character's account is written as a
  post-event information source is enough to produce believable rumor
  distortion chains without simulating language-level transmission.
- Retrieval-probability thresholds can be tuned so characters "forget" the
  majority of ambient events while retaining ~a human-plausible salient set.

---

## 12. Social memory — v8 calibration summary

Focus version. Full treatment in `social-memory.md`; spec → v0.8.

- **Person models** (new store, spec §1/§5.10): person memory organizes
  around person nodes with a strict cascade — familiarity → identity →
  name (Bruce & Young 1986; Burton, Bruce & Johnston 1990). Names are
  the weakest tier (Cohen 1990 Baker-paradox; Burke et al. 1991 TOT).
  Own-age bias g≈0.37 discriminability at every age (Rhodes & Anastasi
  2012 meta). `familiar_only` is the normal acquaintance state.
- **Spontaneous trait inference** (Winter & Uleman 1984; Uleman 2008
  meta): traits bind to actors automatically; **diagnosticity weighting**
  — negative morality behaviors weigh ~1.6× (Skowronski & Carlston
  1987/1989; bad > good, Baumeister 2001); **incongruity advantage** at
  encoding (Hastie & Kumar 1979) BUT **stereotype-consistency wins in
  transmission** — Kashima 2000 crossover by chain position ~4. Both
  kept, uncoupled.
- **Cheater source memory**: source memory for cheaters η²≈.14, zero
  old-new advantage (Buchner, Bell, Mehl & Musch 2009; preserved in old
  age, Bell & Buchner 2012) → `beta_source ×0.6` on cheater-linked
  records only.
- **Audience tuning / saying-is-believing** (Higgins & Rholes 1978;
  Echterhoff et al. 2005 shared-reality gating; Figueroa-Grenett 2025
  meta robust, diminished out-group): the speaker's OWN record drifts
  toward the tuned telling — cumulative. Strongest single lever for
  characters' memories diverging via conversation.
- **SS-RIF** (Cuc, Koppel & Hirst 2007; autobiographical: Stone et al.
  2010/2013): speaker's omissions suppress the LISTENER's related
  memories — `ss_rif_k` ≈ 0.04 scaled by listener attention.
- **Collaborative inhibition** (Marion & Thorley 2016 meta, 64 studies):
  groups recall < pooled solo recall; worse for strangers/large groups;
  post-collab individual benefit exists — optional `groupRecall`
  wrapper.
- **Serial reproduction** (Bartlett 1932; Allport & Postman 1947
  leveling/sharpening/assimilation; Lyons & Kashima 2003 sharedness):
  per-hop field survival with schema-consistency pull; gossip content
  transmits better (Mesoudi, Whiten & Dunbar 2006).
- **Learned credibility** (Koenig & Harris 2005 selective trust):
  `PersonModel.credibility` updated by verification outcomes — feeds
  §6.3 sourceCredibility; trust becomes a remembered, per-person,
  per-listener quantity. Update law is OUR HYPOTHESIS.
- **Mnemic neglect** (Sedikides, Green & Pinter 2004; Green et al. 2008):
  self-threatening central feedback recalled worse but recognition
  intact — "forgotten but not gone"; recall-mode θ penalty only, waived
  for close others, inverted in dysphoria.
- **In-category source confusion** (Taylor, Fiske, Etcoff & Ruderman
  1978): misattributions concentrate within social category —
  `source_cat_share` ≈ 0.65 on §6.10 reassignments.
- **Transactive directory** (Wegner 1987; Wegner, Erber & Raymond 1991):
  `knowsTopics` per person → "ask X" is a memory; powers rumor routing.
- New params ×23 (spec §7 v0.8 block); probes P57–P67. DEBATED items:
  cheater-module framing (we model threat-tagging, not a module);
  mnemic-neglect mechanism (suppression vs. shallow encoding — we
  implement both); audience-tuning age interactions (kept flat).

## 13. v9 calibration summary — formal model hardening (formal-model.md)

v9 added no new psychological mechanisms; it formalized the accumulated
v0–v8 spec. Sources consulted and what each contributes:

- **Landauer 1986** (Cognitive Science 10:477–493): lifetime functional
  memory ~10⁹ bits, LTM input ≈1–2 bits/s → ~10⁵ bits/day encoding budget.
  Grounds `enc_quota_per_day` (40 surviving records/day), `cap_episodic`
  (2000), `cap_archive` (8000) — the human store is huge but the *daily
  write budget* is tiny. [CONSENSUS as order of magnitude]
- **Rubin & Wenzel 1996 / Wickelgren 1974** (already in §3): power-law
  retention is scale-invariant across timescales → decay must be evaluated
  as R(Δt) against elapsed time, never per-tick-multiplied; tick
  granularity becomes a compute choice, not a psychological one. Probe P71
  tests this directly. [CONSENSUS at functional-form level]
- **Gutenkunst et al. 2007** (sloppy models, PLoS Comput Biol): multiparameter
  systems have few stiff directions; behavior constrains combinations, not
  components → the §4 identifiability audit freezing k, drift_k, taus,
  collab penalties, arousal_affect_decay, rep_cap as population constants
  (~50 frozen / ~70 free). Rule adopted: every new param must name its
  identifying observable.
- **Operator ordering** (formal-model.md §3): strict sequences for
  encodeEvent/recall/dailyMemoryTick/hearAccount; only two order-sensitive
  pairs exist (consolidation→decay, merge→archive) — everything else
  commutes within noise. Resolves ambiguities the layered v0–v8 spec
  inherited.
- **Event/CueContext schemas + derived-field defaults** (§2): attention/
  selfRelevance/novelty/predictionError now have floor derivations so the
  substrate can call encodeEvent without a director. All tagged HYPOTHESIS.
- **Edge cases** (§6): possession-window records encode with hidden
  `possessed` flag + `possess_alien` estrangement discount (depersonalized
  recall of actions the character didn't choose — HYPOTHESIS, fiction-
  consistent); suspension replays ≤catchup_max daily ticks then aggregates
  via scale-invariance; hidden flags never serialize into briefings.
- **Determinism** (§7): seeded `rand(seed, charId, worldDay, opSeq)` —
  same ledger → identical state; required by the rumor engine's replay
  debugging.
- **Probes P68–P75** (§8): machinery-level tests — determinism, snapshot
  round-trip, boundedness fuzz, tick-granularity invariance, daily-tick
  ordering pairs, possession continuity, cap enforcement, ambient-mode
  equivalence. These test the *implementation*, complementing P1–P67's
  psychological phenomena.
- New params ×8 (spec §7 v0.9 block); spec → v0.9. DEBATED items: none —
  all additions are engineering semantics or flagged HYPOTHESIS.

## 14. v9 deepening — mechanism formalization (formal-model.md Part II)

The hardening pass pinned units/order/budgets; the deepening pass
formalized five mechanisms that were still prose in the spec:

- **Two-strength split** (Bjork & Bjork 1992 New Theory of Disuse):
  `strength` is retrieval strength R; new `storageS` field is storage
  strength S. S grows on *difficult* retrievals (`s_gain·(1−S)·(1−R_pre)`
  — spacing/lag effect emergent, Cepeda et al. 2006; Karpicke & Roediger
  2008), decays ~100× slower than R, gates resurrection floor
  (`min(resurrect_R, S)`), savings on re-encoding (`relearn_gain·S_old`,
  Ebbinghaus/Nelson 1985), and the permastore transition. Archive is
  now provably "not deleted": S persists and drives revival quality.
- **Temporal dating as reconstruction** (Friedman 1993): `dateEstimate`
  = forward telescoping for remote / slight backward for recent
  (Janssen, Chessa & Murre 2006 — validated crossover), √age noise,
  schema rounding to {7,30,90,365} + category-centroid pull
  (Huttenlocher, Hedges & Bradburn 1990; Huttenlocher, Hedges & Vevea
  2000), landmark rescue (Brown, Rips & Shevell 1985; Shum 1998), and
  `orderBefore` on the S gradient — ordering survives date loss.
- **Hindsight** (`learnOutcome`, spec §6.16): prior-belief records
  assimilate `hindsight_k·gap` toward known outcomes with confidence
  gain and hidden accuracy loss — Fischhoff 1975, creeping determinism
  (Fischhoff & Beyth 1975), metas Christensen-Szalanski & Willham 1991 /
  Guilbault et al. 2004; gated by outcome believability (Blank &
  Nestler 2007). Applies to `told_by` predictions too — "everyone saw
  it coming" is a distortion product.
- **Fluency → confidence**: `searchCost` output on recall — ease of
  search drives judged frequency, not count (Schwarz et al. 1991
  6-vs-12; Koriat 1993 cue-utilization); hard-easy overconfidence term
  `oc_gain·max(0, conf−accuracy)·(1−strength)` at report time only
  (Lichtenstein & Fischhoff 1977; Gigerenzer et al. 1991 qualifier).
- **Temporal contiguity** (Howard & Kahana 1999/2002 TCM; Sederberg et
  al. 2008): `temporalAnchor` on the recall context gives neighbor-in-
  time records a drive bonus with forward asymmetry — reminiscence
  bursts and "and then?" flow for free.
- **Calibration harness** (formal-model.md §15): closed-form retention
  targets at fixed delays, two-strength spacing trajectories, archive/
  resurrect values, telescoping distribution targets, fan-divisor
  ratio — unit-testable before any tuning.
- Spec: +`storageS` field, §4.11, §5.4 contiguity + searchCost +
  resurrect floor, §5.9 rewrite, §3 fluency/hard-easy, §6.15–6.16,
  §7 +7 free params +14 frozen constants (audit rule applied),
  §10 contract +dateEstimate/orderBefore/learnOutcome/searchCost/
  temporalAnchor. Probes P76–P85. PersonModel exempt from the S/R
  split (own tier ordering suffices — modeling choice).

## 15. v10 calibration summary — profile generation (profile-generation.md)

Focus: character-profiles. New primary sources and how they moved the spec:

- **Metamemory / self-model** (CONSENSUS): self-reported memory barely
  tracks real memory — Herrmann 1982 (Psychol. Bulletin "Know thy
  memory": questionnaires are poor predictors of performance); Troyer &
  Rich 2002 (MMQ): Ability subscale vs word-list r=.10, names r=.09,
  telephone r=.14 (all n.s.); complaints load on depression/affect, not
  mechanics (Beaudoin & Desrichard 2011 direction); older adults' felt
  decline outruns measured decline (Hertzog & Hultsch line).
  → New `SelfModel` side output: `self_est` per facet sampled
  independent-of-params + `metamem_r` (0–0.3) + `strategy_use`
  (compensation tracks *felt* deficit; naturalistic-PM logic). The
  poignant case (insists memory is fine while it fails) is emergent.
- **Occupational expertise** (CONSENSUS, sharpened): Chase & Simon 1973
  (chess-chunking collapses on random boards — domain-locked); Maguire
  et al. 2000 PNAS (taxi-driver posterior hippocampus grows with years;
  acquired, not selection — bus-driver control 2006); Woollett &
  Maguire 2009 (taxi drivers WORSE at new visual associations —
  expertise has a bill); Recht & Leslie 1989 (child experts out-recall
  adult novices — expertise additive with age, not gated by it).
  → domain-expert modifier rewritten: `expert_gain`/`expert_bound`/
  `expert_cost` (out-of-domain link_p penalty).
- **Open goals / Zeigarnik layer** (split verdict): Zeigarnik 1927
  recall advantage = DEBATED — 2025 meta-analysis finds no reliable
  memory advantage; effect was involvement/authority-gated.
  Ovsiankina 1928 resumption = CONSENSUS. Goschke & Kuhl 1993
  intention-superiority (accessibility of pending intentions) direction
  CONSENSUS. → `open:true` record flag + `open_loop_gain` intrusion/
  drive boost gated by `open_self_gate` (selfRelevance) + closure →
  β×1.2 (finished business forgets faster). Gives drama seeds a
  "keeps bringing it up" knob orthogonal to arousal.
- **Regime tier** (HYPOTHESIS structure): trait/regime/state three-
  timescale rule — dated modifier overlays mark records born in a
  life era ("the divorce years") without mutating the trait vector.
- **Compiler** (`deriveParams` full spec): ordered 7-step pipeline,
  conditional-Gaussian trait sampling from pins, coherence invariants
  (cascade ordering, channel separability, frozen-constant audit P95),
  deterministic given (pins, seed). Life-history seeding recipe:
  backstory → era-dated records → run own decay forward; retold
  stories arrive pre-drifted; PersonModels seeded at cascade tier;
  dangling threads seed open loops.
- Spec → v1.0: §7 +8 params, record `open` flag, contract +
  closeLoop/openLoopUrge/selfReport/deriveParams side outputs.
  Probes P86–P95. Profiles: +8 clamp rows, new open-loop-carrier
  modifier, domain-expert row superseded, v1.0 note.

## 16. v11 summary — validation-design

`memory/validation-design.md` turns the scattered probes (P1–P95) into a
validation program: tiered registry (MUST=consensus+machinery / SHOULD=
established-but-noisy / OBSERVE=debated-hypothesis), a harness contract
(deterministic cohorts via deriveParams, controlled event generators,
hidden-field ground-truth tap, JSONL output), and a statistical protocol
that borrows the replication-crisis toolkit for simulation calibration:
- **Replication discount** (Open Science Collaboration 2015 — Science
  349:aac4716: replication effects averaged r=.197 vs .403 published,
  36% significant): single-study human targets are halved before becoming
  bands; famous effects are systematically overstated.
- **Equivalence testing** (Lakens, Scheel & Isager 2018 — AMPPS
  1(2):259): the model's explicit nulls (no g_mem→misinfo path,
  vivid↔accuracy independence, ambient-mode equivalence P97) are tested
  by TOST against a SESOI, not by failing to find an effect.
- **Effect bands** (Funder & Ozer 2019 — r≈.1/.2/.3 anchors) replace
  "markedly/significantly" wording; **FDR** (Benjamini & Hochberg 1995)
  controls the 100-probe battery; researcher-degrees-of-freedom
  (Simmons, Nelson & Simonsohn 2011) motivates frozen probe numbers and
  pre-registered bands.
- **Experiment analogs E1–E11**: whole-paradigm replications through the
  §10 contract only (Ebbinghaus, Jenkins-Dallenbach, Bahrick, Wagenaar,
  Loftus 3-stage w/ CIE per Ecker 2022, DRM, Kashima crossover, Bartlett
  serial reproduction, own-age lineup, age-PM paradox, involuntary-day
  diary band per Berntsen 1996/Kvavilashvili & Mandler 2004).
- **Population checks**: profile distinctness (Mahalanobis floor),
  trait-structure preservation incl. nulls, age-curve conformance sweep,
  season-field stats (retrieval inequality, rumor-mix diversity, fading-
  affect positivity Walker 2003, metamemory decorrelation).
- **L4 believability rubric** with Krippendorff α ≥ .4 — observational,
  never a gate.
New probes P96–P105 (registry now P1–P105). Spec → v1.1 (note + hidden-
field read policy only; no param/schema changes). Boundaries kept:
research only, no code, no narratives, no push/merge.

## 17. v12 summary — encoding-mechanics

`memory/encoding-mechanics.md` adds the processing-side layer §2 lacked —
*how* an event was processed, not just what it was about:

- **Elaboration is the master variable** (CONSENSUS): Craik & Lockhart
  1972 / Craik & Tulving 1975 — depth beats time-on-task. Two formal
  NULLS added: maintenance rehearsal (Craik & Watkins 1973 — rote
  repetition is not encoding) and intention-to-learn (`intent_null = 0`,
  frozen — Postman 1964; Hyde & Jenkins 1973; the orienting task IS the
  encoding). New derived Event field `elaboration`; `elab_gain`.
- **Self-reference quantified**: Symons & Johnson 1997 (129 studies,
  d≈0.65 vs semantic, ~half vs other-reference) → `w_self` now drives a
  saturating `selfRelevance^0.7` — the last 0.4 of relevance buys little.
- **Engagement-mode ordering** enacted > generated > spoken > heard:
  Bertsch et al. 2007 (generation meta d=.40, 445 effects, N=17,711);
  Roberts et al. 2022 (enactment meta g=1.23, 145 studies — preserved in
  patients/aging → applied post-decline); Fawcett 2013/2023 (production
  effect small, recognition-weighted, reduces intrusions).
- **Divided-attention asymmetry** (Craik et al. 1996; Naveh-Benjamin et
  al. 2000): encoding is fragile under DA (attention AND elaboration
  damaged — qualitative shallowing); retrieval is obligatory (searchCost
  rises, θ unmoved). Plus stochastic `lapse_p` attention collapses
  (mind-wandering; Maillet & Rajah 2013) trait-loaded on neurot/sleep/
  stress — unexplained holes in otherwise fine memories.
- **Event segmentation** (Zacks et al. 2007): boundary content privileged
  (`boundary_gain`), cross-boundary order/links degraded
  (`boundary_order_loss`; DuBrow & Davachi 2013), and the doorway/
  location-updating effect — `locShift` drops recent records + pending
  Intentions (`doorway_drop`, flat across age per Radvansky et al. 2015;
  magnitude DEBATED — marked SHOULD).
- **Unitization** (Giovanello & Schacter 2012; Bastin 2013): coherent-
  unit events rescue the aging associative deficit — `unitize_gain`
  automatically targets the cohort whose link_p is lowest.
- **Isolation not weirdness** (Hunt 1995; Schmidt 1991): `distinct_gain`
  on within-stream outliers only; bizarreness folded into novelty
  (DEBATED). Routine-heavy lives isolate more — the odd day survives.
- **Survival processing adjudicated**: Scofield et al. 2018 bias-corrected
  meta (η²p .06–.18 — real, medium, smaller than canonical) + mechanism
  analyses (Klein; Kroneisen) → it is an elaboration delivery device;
  FOLDED into `elaboration` via `survivalRelevance`, NO dedicated param.
  P115 equivalence-probes the fold.
- Spec → v1.2: §2 +9 mechanism bullets + E-formula terms; §7 +14 params
  +4 frozen constants; §10 +7 Event fields + cueContext.daLoad; probes
  P106–P116 (registry now P1–P116). Profiles: +14 clamp rows, child/
  teen/older deltas, lapse loadings on poor-sleep/stress/depressive
  modifiers, v1.2 age-sensitivity note.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 18. v13 calibration — forgetting-curves II (active forgetting, 2026-09-23)

`forgetting-curves.md` Part II. Second pass on the decay engine: v1 priced
*passive* decay; v13 prices the three things that actually decide survival
in a lived life — rehearsal schedule, competition, control — plus two
missing decay classes.

- **Spacing/lag** (Cepeda et al. 2006 meta, 839 assessments/317 exps):
  optimal ISI grows with RI — `lag_mult` log-normal peaking at
  gap ≈ `lag_opt_ratio`·recordAge (0.15); massed re-access ×`massed_retell_mult`
  0.4. Back-to-back retelling is mostly wasted [CONSENSUS direction;
  shape HYPOTHESIS].
- **Testing vs re-exposure** (Roediger & Karpicke 2006: 5min restudy 81% >
  test 75%; 1wk test 61% >> restudy 40% — the inversion). `s_gain` split:
  recall 0.35 / rehear 0.12; rehear refreshes R's clock identically but
  buys ~⅓ the storage growth. Plus **failed-retrieval potentiation**
  (Kornell, Hays & Bjork 2009): `attempted` flag → next re-encoding
  ×(1+potent_gain 0.3).
- **Reminiscence** (Payne 1987; Scrivner & Safer 1988; Dunning & Stern
  1994): successive recall attempts surface new verbatim fields at
  `reminiscence_frac` 0.15 each; net hypermnesia NOT required (eyewitness
  pattern: reminiscence yes, net gain no — recall-mode only).
- **Verbatim speech** (Sachs 1967: wording indistinguishable from
  paraphrase after ~80 syllables ~1min; Jarvella 1971: verbatim covers
  ~the current clause): `verbatim.quote` gets its own field class —
  frozen tau_quote 0.02d, beta_quote 0.8. Dialogue quoting beyond the
  same hour renders as paraphrase + confabulation.
- **Interference accumulates** (Underwood 1957 — most everyday forgetting
  is proactive; Wickens 1970 release-from-PI — category shift opens a
  fresh competition pool; Watkins & Watkins cue-overload; Wixted 2004 —
  pure decay may contribute little): `n_sim` per-record accumulator,
  pairwise suppression ×min(1, √n_sim/pi_ref), pi_ref 4.
- **Childhood amnesia step → ramp** (Bauer & Larkina 2013/2014/2015):
  children's distributions are exponential (constant-rate forgetting —
  failed consolidation), adults' power; rates order 4y > 6y > 8y > adult;
  thematic coherence of the initial report predicts survival. β ramp
  `1 + amnesia_slope·(1−age/7)` + first-sleep consolidation gate
  `child_consol_base + coherence·child_consol_gain`. Survivorship cliff,
  not a delete; power form kept (approximation, flagged).
- **Deliberate suppression** (Anderson & Green 2001 TNT; Anderson &
  Huddleston 2012 combined ~8%; Stramaccia 2021 — reduced control in
  PTSD/depression; 2024 authorship analysis 95% dev-lab vs 68% independent
  — replication-flagged): `suppressEvent` adds cumulative θ bump
  (suppress_theta 0.08, cap 0.3), R-side ONLY — storageS untouched,
  involuntary scan exempt. A leak, not a delete key.
- **Intentions persist** (Einstein & McDaniel 1990): armed event-based
  PM records decay at beta_pm 0.15 — retention tested at the cue; fired
  intentions revert to ordinary episodic decay. Doorway penalty still
  applies — PM failure is cue-side.
- **Retell ecology** (Linton; Wagenaar mechanism): daily draw
  `p_retell = retell_base·E_adj·(1 + retell_social·sharedCue)` — the
  flat autobiographical curves of Part I now EMERGE from rehearsal
  survivorship rather than parameter fiat. P126 forces that check.
- **Procedural** ~never decays: beta_proc 0.02 + relearn_gain applies
  (Nelson 1985 savings).
- Spec → v1.3: §4.1 quote class + amnesia ramp, §4.2 PI accumulation,
  §4.11 s_gain split + lag_mult + potentiation, NEW §4.12 suppression,
  §4.13 retell ecology, §5.11 reminiscence, §9 beta_pm, schema +n_sim/
  suppressed/attempted, §7 +19 params, §10 contract additions; probes
  P117–P126 (registry now P1–P126). Profiles: +17 clamp rows + v1.3
  age-sensitivity note (mostly age-invariant by design; retell/
  reminiscence/suppress_cap carry the exceptions).
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 19. v14 summary — retrieval-cues II (the cue's job description, 2026-09-23)

Second pass on `retrieval-cues.md`. v2 answered which cues retrieve;
v14 prices HOW: the match between cue and the *process* used at encoding,
the self-destructive economics of exhaustive recall, the two retrieval
routes for intentions, context-scoped safety learning, TOT microdynamics,
memory-as-its-own-cue, and overnight reactivation.

- **Transfer-appropriate processing** (Morris, Bransford & Franks 1977;
  Roediger, Weldon & Challis 1989): cue effectiveness is gated by
  processing-channel match — `encodeOps` on the record vs `C.ops` on the
  context, `tap_mismatch` 0.55 multiplicative. Complements encoding
  specificity rather than competing with it.
- **Output interference** (Tulving & Arbuckle 1963/66; Roediger & Schmidt
  1980; Criss et al. 2011): bout recall is greedy + compounding
  (`out_int` 0.85/item) and each emitted item part-list-suppresses the
  rest — "tell me everything" returns less than item-wise probing, and
  interrogation ordering matters (cognitive-interview implication).
- **Prospective cue ecology** (Einstein & McDaniel 1990; multiprocess —
  McDaniel & Einstein 2000; Henry et al. 2004 meta): focal event cues
  fire near-automatic and age-flat (`pm_focal_hit` 0.9); nonfocal cues
  and time-based intentions need monitoring/clock checks that are
  age- and load-impaired. The prospective paradox now has a mechanism.
- **Contextual renewal** (Bouton 2004): extinction is context-bound new
  learning, not erasure — `extinctCtx` scoping + `renewal_frac` 0.6
  response elsewhere. Calm learned in one place does not generalize.
- **TOT microdynamics** (Abrams et al. 2007 — first-syllable primes
  resolve, first-letter don't; Warriner & Humphreys 2008 — unresolved
  TOTs are implicitly learned, ~2× recurrence): `tot_fields` state,
  `tot_resolve_p`, `tot_persist`.
- **Reminding chains**: a retrieved record emits its cueVector as a
  derived context for its `links`, depth-1, `chain_gain` 0.5 — the
  associative version of temporal contiguity; reminiscence cascades
  become social ("that reminds me…").
- **Sleep cuing / TMR** (Rasch et al. 2007; replications d≈0.3–0.4):
  SWS reactivation is cue-bound and encoding-specificity-bound —
  `tmr_gain` 0.12 on declarative records sharing a sensory cue with the
  sleep context; procedural and cue-absent controls null.
- Spec → v1.4: schema +`encodeOps`/`tot_fields`/CondEntry `extinctCtx`;
  NEW §5.12–5.18; §7 +11 params; §10 contract additions; probes
  P127–P135 (registry now P1–P135). Profiles: +11 clamp rows + v1.4
  age/trait-sensitivity note (PM monitoring, TOT resolution, renewal
  under trauma, chain_gain as the storyteller trait).
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 20. v15 summary — age-development II (infancy latents, socialization, retrieval inhibition, cultural bump, 2026-09-23)

Second pass on the lifespan layer (age-development.md Part II). v0.3
built the era structure and continuous curves; this pass filled four
mechanistic holes and corrected two sign errors.

- **Infantile amnesia = accessibility failure.** Rovee-Collier
  (retention ∝ age at encoding, ~linear through infancy), Travaglia et
  al. 2016 (latent trace reinstated only by context+reinforcer
  compound reminders), Guskjolen et al. 2018 (optogenetic recovery of
  infant engrams) → records under the amnesia boundary go `latent`,
  never deleted; only a ≥2-sensory+place compound cue can return them
  (`latent_recall_p` 0.08) as low-confidence fragments. The Proust
  mechanism now reaches all the way down.
- **The amnesia boundary is socially set.** Fivush & Nelson 2004;
  Reese & Newcombe 2007 → `reminiscence_env` bible dial shifts
  `amnesia_exit` ±1.5y and scales `child_consol_gain` — parental
  retelling is rehearsal.
- **Production deficiency** (Flavell 1970; Schneider & Pressley 1997):
  `elab_gain`/`gen_gain` gated by `strategy_ramp(age)` to ~12;
  `scaffolded` events bypass (adult-guided elaboration). Children keep
  detail shards, weak gist (`child_gist_mult` — fuzzy-trace verbatim
  bias).
- **Retrieval-side inhibition / OTV** (Arbuckle & Gold 1993; Hasher &
  Zacks 1988; Trunk & Abrams 2009 flagged DEBATED-style): `offtarget_p`
  bout contamination rising to ~0.15 at 80 — rambling is a memory
  phenotype, not a personality quirk (intercept IS personality).
- **Sign fix — illusory truth × knowledge:** Fazio et al. 2015 (young
  adults neglect knowledge) vs Brashier et al. 2017 (older adults'
  knowledge protects them) → `know_protect_*` clause in §6.3: old resist
  fluent lies that contradict what they know, young don't.
- **Childhood sleep inversion** (Kurdziel et al. 2013; Wilhelm et al.
  2008): `sws_mult` child knot 1.2; `nap` mini-tick + unrecoverable
  `nap_loss` 0.1.
- **Cascading bump** (Krumhansl & Zupnick 2013; Svob & Brown 2012):
  bump extends to `cultural` semantic records (`bump_semantic_gain`)
  plus a parents'-era secondary peak at encodeAge 4–10
  (`bump_cascade_gain`).
- **Metamemory miscalibrated UP in childhood** (Flavell 1970; Koriat &
  Shitzer-Reichert 2002): `metamem_r` ~0 below ~10, `self_est_bias`
  +0.3 child / −0.05 old.
- **Source-channel split** (Foley & Johnson 1985 internal↔external vs
  Henkel et al. 1998): children confuse imagined↔witnessed
  (`child_internal_confuse` 2.0), old confuse speakers.
- Spec → v1.5: schema +`latent`; NEW §4.14–4.15, §5.19–5.20; §2 strategy
  gate + cultural bump + child trauma offset (HYPOTHESIS); §6.3/§6.10/
  §6.15 edits; §7 +18 params + 5 knot-row updates; §10 contract
  additions (nap tick, scaffolded/cultural/cascade event flags,
  latent_returned reconstructions). Probes P136–P144 (registry now
  P1–P144); profiles +18 clamp rows + v1.5 sensitivity note.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 21. v16 summary — age-decline II (the compensation layer, 2026-09-23)

Second pass on the decline side (age-decline.md Part II). v4 gave the
deficit machinery; this pass adds what old minds do *differently* —
selective, positive, scaffolded, socially compensated, confidently wrong.

- **Value-directed remembering** (Castel, Benjamin, Craik & Watkins
  2002; Murphy et al. 2020; Hoover et al. 2025): older adults recall
  less but select MORE — `value_select` sharpens the importance term
  in E so high-value encoding is spared and low-value abandoned.
- **Positivity effect** (Reed, Chan & Mikels 2014 meta — old dbias
  +.13, young −.12, unconstrained d=.48 vs constrained .13; Mather &
  Knight 2005 load reversal): `positivity_gain` on encoding and
  candidate selection, resource-gated. NOT reserve-shifted —
  motivational (SST).
- **Hyper-binding** (Campbell, Hasher & Thomas 2010; Campbell et al.
  2024 review — implicit-only): `hyperbind_p` writes co-present
  unrelated features into verbatim slots — wrong-context confident
  detail, distinct from offtarget_p (storage vs emission).
- **Destination memory** (Gopie & MacLeod 2009 — confident misses →
  repeat telling; El Haj et al. 2012): `toldTo` map + `dest_mem`
  hit rate; misses dominate → elders repeat stories to the same
  listener.
- **Context>content decline** (Spencer & Raz 1995 meta): `ctx_loss`
  multiplies where/when/source decay; dating vs ordering gap widens.
- **Misrecollection** (Dodson & Krueger 2006; Shing et al. 2008 —
  children don't): `conf_inflate_old` on wrong-flagged conf_out —
  old errors at HIGH confidence, the eyewitness-signature inversion.
- **Schema scaffold** (Castel 2005; Umanath & Marsh 2014):
  `schema_support` — semantic-store-congruent events encode near
  young rates.
- **Stereotype threat** (Lamont, Swift & Abrams 2015 d=.28/.52;
  Armstrong et al. 2017 episodic d=.373, recall-only): `evaluative`
  cueContext × trait `stereo_suscept` — quizzed elders blank, same
  elders reminisce fine.
- **Gist false memory** (Balota et al. 1999; Tun et al. 1998): formal
  old-side knots on phantom_p/gist_lure_gain (0.02→0.05, 0.3→0.5 @80).
- **Couple compensation** (Harris et al. 2011; Barnier et al. 2014 —
  facilitation older-couples-only): `collab_partner_gain` waives the
  collab penalty for intimate dyads — widowed elders lose a memory
  prosthesis.
- **Olfactory encoding decline** (Doty et al. 1984): w_sensory
  old-side knots 0.10→0.05; reach (sensory_age_slope) unchanged.
- **Deliberate non-change** (Dodson & Krueger 2006): misinfo_suscept
  old knots stay modest — the aging signature is confidence, not
  adoption; warnings work on elders.
- Spec → v1.6: §2 +4 encoding terms, §3 conf_out wrong-flag term,
  §5.4 evaluative/positivity clauses, §6.8/6.11/6.13/6.15 edits,
  §7 +9 params +3 knot updates +1 frozen shape, §10 contract
  additions. Probes P145–P153 (registry P1–P153); profiles +9 clamp
  rows + E-block + v1.6 note.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 22. v17 summary — emotional-memory II (the affect-tag layer, 2026-09-23)

Second pass on emotion (emotional-memory.md Part II). v0.5 built the
record-level machinery; this pass deepens the tag itself — how it's
born, how it cools, how it spreads.

- **Peak-end tag-setting** (Kahneman, Fredrickson, Schreiber &
  Redelmeier 1993; Redelmeier & Kahneman 1996; Fredrickson &
  Kahneman 1993; Do, Rupert & Wolford 2008): the stored affect tag =
  `peak_w·max + end_w·end` (0.55/0.45), duration-neglecting —
  endings are leverage, long good days and short good days tag alike.
- **Sleep depotentiation** (Walker & van der Helm 2009; van der Helm
  et al. 2011; DEBATED — Wiesner 2015, Groch 2015 non-replications):
  `sleep_affect_strip` 0.04/night on arousal tag only, trauma-exempt.
  Kept small and toggleable; two redundant cooling paths back it.
- **Item-context tradeoff generalized** (Kensinger & Schacter 2005;
  Bisby & Burgess 2014; Madan et al. 2017): `emo_assoc_loss` 0.25 —
  graded cost to link_p/`when`/source-tag for arousal ≥0.5; trauma's
  fragmented frame is now the curve's endpoint, not a special case.
- **Verbal dampening** (Lieberman et al. 2007 affect labeling;
  Pennebaker disclosure): `verbal_dampen` 0.05 per SOCIAL retell on
  arousal; solo rehearsal exempt — rumination stays hot.
- **Regulation trait** (Richards & Gross 1999/2000; Dillon et al.
  2007): `regulate_style` — suppressors pay `reg_suppress_cost` on
  enc_base (composure taxes the recorder), reappraisers store cooler
  tags via `reg_reappraise_k`.
- **Conditioned-affect generalization** (Dunsmoor et al. 2009;
  Lissek et al. 2005/2010; Dunsmoor, Martin & LaBar 2012): CondEntry
  fires on similarity ≥ `1−gen_width`, emitted ∝ sim; trauma load
  widens the gradient (+0.15/record, cap 0.6) — anxiety flattens
  discrimination.
- **Reconsolidation-window extinction** (Schiller et al. 2010;
  DEBATED per Chalkia et al. 2020): safe exposure inside
  `reconsol_window` (0.25d) of a fire writes a `deep` suppressor
  immune to spontaneous recovery — the exposure-therapy mechanic.
- **FAB self-boundary** (Walker, Skowronski & Thompson 2003;
  Ritchie et al.): `fab_self_gate` 0.4 — the fading affect bias only
  heals self-relevant wounds; witnessed wrongs keep their charge.
  Fixes v0's wrong asymmetry on spectator memories.
- **Contagion / vicarious conditioning** (Rimé 1995/2009; Hatfield
  et al. 1993; Peters & Kashima 2015; Olsson & Phelps 2007):
  told_by arousal = `source·contagion_k·speaker_express·(0.5+0.5·
  empathy)`; hearsay can mint CondEntries on never-visited places —
  the neighborhood-wide-trauma mechanism.
- **Tag capture** (Dunsmoor, Murty, Davachi & Phelps 2015; Redondo &
  Morris 2011): §2.3 retrograde gain extended cue-agnostic at half
  strength — weak traces beside a strong emotional event are
  partially rescued at consolidation.
- Spec → v1.7: §2 peak-end + emo_assoc_loss + regulation + tag
  capture + sleep_affect_strip; §4.5 fab_self_gate; §4.9 gradient +
  reconsol path; §6.3 hearsay tag; §6.11 verbal_dampen; §7 +14
  params; §10 contract additions. Probes P154–P162 (registry
  P1–P162); profiles +15 clamp rows, 2 new modifiers
  (stoic/suppressor, high-empath), trauma & depressive modifier
  updates, v1.7 note.
- Boundaries kept: research only, no code, no narratives, no push/merge.
