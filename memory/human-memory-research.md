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

## 23. v22 summary — character-profiles II (the cast pass)

The bibles (world-v14) forced three sourced mechanisms and one trait
into the spec; the 8 mains were then compiled into
`memory/cast-profiles.md`.

- **Immigration bump** (Schrauf & Rubin 1998 JML; Schrauf & Rubin 2001
  ACP): immigrants' autobiographical density follows immigration age —
  bimodal when migration falls inside the 10–30 window. Companion:
  20–40% crossover memories (Schrauf & Rubin 2000) — drives `lang`
  field use. → spec `bump_windows` list + `mig_bump_gain`.
- **Secrecy = mind-wandering** (Slepian, Chun & Mason 2017 JPSP, 10
  studies, >13k secrets): spontaneous thought about secrets ~2×
  concealment episodes; only the former predicts wellbeing cost.
  → `secret_mindwander` intrusion channel on `confidential` records.
- **Self-concealment** (Larson & Chastain 1990): concealment of
  self-negative info is distinct from low disclosure, predicts
  distress incrementally. → `self_share_pen` splits self-relevant
  transmission from `share_k`.
- **Attachment avoidance** (Edelstein 2006 Emotion; Fraley, Garner &
  Shaver 2000 JPSP; Mikulincer & Orbach 1995): preemptive encoding
  deficit on attachment-relevant material only; incentive doesn't
  rescue; anxiety axis null. → IndivTraits axis 15 `attach_avoid` +
  `attach_encode_loss`/`attach_ret_cost`.
- Cast signatures: C1 archive-that-forgets-itself; C2 dense newcomer;
  C3 compartments; C4 precise-others/vague-self; C5 spatial-giant/
  temporal-sieve; C6 bimodal archive + transactive widowhood; C7
  ledger-with-a-heart (attach_avoid max); C8 plan-canonizing bilingual
  bump. Distinctness formalized in P206.
- Spec → v2.2 (+6 params, `bump_windows`, `attachment:true` event tag,
  `lifeEvents` ProfileInput field); profiles +5 clamp rows + §11;
  probes P201–P210.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 24. v24 — encoding-mechanics II (state around intake, class at the door)

Second pass on `memory/encoding-mechanics.md` (Part II, §§15–29). Where
Part I priced processing mode, Part II prices the *motivational state*
surrounding the event and the *content class* walking through the door.
All sources verified via web on 2026-09-23.

- **Attentional boost effect** (Swallow & Jiang 2010 Cognition; 2014
  APP true-baseline): detecting a task-relevant target *boosts* memory
  for concurrent background items — dual-task cost inverts at the
  detection instant. Requires a live monitoring set; eliminated without
  it. → `abe_gain` + `abe_spill_mult`, `abe_window` frozen at 1 tick.
- **Curiosity spillover** (Gruber, Gelman & Ranganath 2014 Neuron;
  Murphy et al. 2021 Learn. Mem. — elicitation-locked; PB&R 2025 meta):
  dopaminergic anticipation boosts the target AND incidental co-timed
  material. → `curios_gain`/`curios_spill`, `curios_window` frozen.
- **Wakeful rest** (Dewar et al. 2012 Psych. Sci.; Tambini 2010 replay):
  ~10 min quiet after encoding → better 7-day retention, age-flat
  (demonstrated 61–87). → `rest_gain`, `rest_window` frozen 0.007d.
- **Implementation intentions** (Gollwitzer & Sheeran 2006, 94 tests
  d=.65): if–then plans bind their cue harder at formation.
  → `impl_intent_gain` on Intention cueBinding (focal leg only).
- **Teach expectancy** (Fiorella & Mayer 2013; Kobayashi 2019 meta
  g=.35/.56, interactive moderator): expecting to explain organizes
  intake. → `teach_expect_gain`.
- **Proper names** (Cohen 1990 homonym design; Cohen & Faulkner 1986
  age gradient): names ≈ meaningless non-words at birth.
  → `name_penalty`, age-scaled, coherentUnit/isolated/self-gen exempt.
- **Other-group faces** (Meissner & Brigham 2001 meta, 91 samples —
  mirror pattern; adolescent meta 2024 g≈0.24): `owngroup_loss`
  promoted from stub to param, contact-moderated.
- **Expertise** (Chase & Simon 1973 random-boards null; Ericsson &
  Kintsch 1995): domain-locked encoding advantage, wider records.
  → `expert_encode_gain`/`expert_detail_w`, DomainTable-gated, zero
  transfer by construction.
- **Item-method directed forgetting** (MacLeod 1998; Rupprecht & Bäuml
  2016 aging d 1.17→0.81; Hall 2021 emotional-resist ~4.2%; clinical
  meta 2023): "forget it" is an encoding instruction — rehearsal
  cessation, never deletion. → `df_loss` via `tagEvent{forget:true}`.
- **Crafted engagement** (Wammes, Meade & Fernandes 2016; Meade 2019 —
  dementia-preserved): drawing > writing/elaborating/tracing.
  Folded as enact+gen+concrete sum — no new param; P230 audits.
- Deliberate non-adds: disfluency (replication collapse — Rummer 2016),
  glucose/caffeine, dedicated pain/hunger/fatigue channels (fold to
  daLoad at frozen weights), remindings-at-encode (§5.17 owns),
  list-method DF (§4.12 owns).
- Spec → v2.4 (+12 params, 5 frozen constants, 2 knot rows, contract
  additions); profiles +12 clamp rows + §12; probes P221–P230.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 25. v25 — forgetting-curves III (what the curves are FOR: adaptive calibration, event time, the tails)

Part III of `forgetting-curves.md`. The decay engine's shape was fitted
in Parts I–II; this pass grounds its purpose and its extremes.

- **Rational calibration** (Anderson & Schooler 1991 — P(need) decays as
  a power law of time-since-use across headlines, library loans, email;
  ACT-R base-level is the same family): forgetting is *economical*, not
  broken — retention should track the world's reuse statistics. →
  reuse-calibration axiom `R(g_med) ∈ [0.4,0.7]` per class + probe P239
  (fails toward over-retention too — the first world-statistics probe).
- **Slope invariance** (Slamecka & McElree 1983; Loftus 1985 counter;
  Wixted 2004 review — DEBATED in detail, adopted): learning level moves
  the intercept, not the slope. → contract: β never depends on E/arousal/
  rehearsal; P231 enforces. Who/when/what modulate β; strength never does.
- **Familiar-face permastore** (Bahrick, Bahrick & Wittlinger 1975 —
  classmate identification ~90% at ≥15y, near-flat to ~48y, while free
  name recall declines ~60%): a second
  permastore, person-domain, at a lower bar (`face_perma_thresh` 0.15,
  `fam_recog_gate` 0.5). Names explicitly excluded — "I know that face,
  can't produce the name" is the datum, not a bug.
- **Event time** (Wixted 2004 interference; Howard & Kahana 2002 TCM;
  event segmentation): subjective memory age advances with intervening
  events → `t_eff = Δt + ev_time_w·(n_ev/ev_day_norm)`. A hectic fortnight
  blurs; an idle one stays crisp.
- **Transformation gain** (McClelland et al. 1995; Winocur & Moscovitch
  2010 transformation hypothesis — mechanism DEBATED vs MTT, observable
  CONSENSUS): verbatim-field death feeds gist S (`transf_gain` 0.05) —
  remote memories become more schematic, not just weaker. Passive half of
  canonization.
- **State-context drift** (Estes 1955 fluctuation; Mensink & Raaijmakers
  1988): internal-state cues decorrelate on a ~21d half-life →
  `moodStateDep` × `exp(−ageDays/state_ctx_hl)`; place/people exempt;
  mood-congruence never drifts (the meta-analytic split).
- **Sleep-coupled affect** (van der Helm & Walker 2009 "sleep to forget" —
  DEBATED mechanism, direction supported): `affect_sleep_frac` 0.4 of
  daily valence fade executes at the sleep tick × sleepQuality; trauma
  exempt. A sleepless night leaves yesterday's hurt sharper.
- **Population tails** (LePort et al. 2012/2017 HSAM; Palombo et al. 2015
  SDAM): profile-layer modifiers for the extreme ends. Patihis 2013
  guard: HSAM is NOT suggestion- or false-memory-immune — storage is
  extraordinary, reconstruction ordinary. Both unassigned by default.
- **Availability census** (Crovitz & Schiffman 1974; Rubin & Schulkind
  1997): lifespan word-cued AM availability is power-decaying with bump
  elevation → P238, a system-level canary probe.
- Spec → v2.5 (+7 params, 2 axioms, §4.16 new, contract additions);
  profiles +7 clamp rows + 2 modifiers + §13; probes P231–P240.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 26. v26 — retrieval-cues III (what a cue IS, mechanically)

Part III of `retrieval-cues.md`. Parts I–II priced cue fields and cue
contexts; this pass grounds the cue mechanism itself — diagnosticity,
competition, the retrieval-practice asymmetry, suppression's second
channel, the involuntary cue diet, intention states, and two
judgment-bending retrieval-experience effects.

- **Cue diagnosticity** (Nairne 2002 "the myth of the encoding-
  retrieval match"; Poirier, Nairne, Morin, Zimmermann, Koutmeridou &
  Fowler 2012 JEP:LMC — verified: more match can HURT when it lowers
  cue diagnosticity; Goh & Lu 2012): cue magnitude is corpus-relative.
  → §5.2 IDF blend over the §4.2 cue buckets (`diag_w`, `diag_cap`);
  §5.1 gating survives — match still gates, diagnosticity prices.
- **Competitive emission** (Raaijmakers & Shiffrin 1980/81 SAM;
  Gillund & Shiffrin 1984): ratio-rule sampling + failure-stop
  replaces greedy bout emission — cue overload becomes emergent;
  near-miss commissions free. → NEW §5.22 (`sam_tau`, `kmax`,
  lmax=search_breadth frozen reuse).
- **Retrieval practice** (Roediger & Karpicke 2006 — delay-gated
  testing>restudy; Rowland 2014 meta g≈0.51; Pyc & Rawson 2009
  retrieval-effort): recall vs re-exposure priced (`reexp_ratio` 0.35)
  and delay-gated (`test_gap_gain`) — §5.9.
- **Expanding retrieval** (Landauer & Bjork 1978; Cepeda et al. 2006;
  expanding-vs-equal DEBATED at long intervals): `expanding_bonus`
  1.15 on widening-gap retells — §4.13, `prevGapDays` field.
- **Suppression-induced inhibition** (Anderson & Green 2001 Nature —
  cue-INDEPENDENT via independent probes, ~8–9% after 16 bouts;
  DEBATED robustness, Bulevich et al. 2006 failures): cue-present
  suppression accrues `inhib`, a flat trace decrement vs all cues —
  NEW §5.23 (`tnt_inhib`, `tnt_cap`; emotional ×0.3). Complements,
  never merges with, §4.12 cue-side suppression. §6.19 boundary kept.
- **Involuntary cue diet** (Berntsen & Hall 2004 — 53% external/27%
  internal/20% mixed cues, more specific episodes; Schlagman et al.
  2007 age-invariance): ambient scan reweights sensory/peripheral up,
  topic down, verbatim-biased; intrusion_thresh age-flat by rule —
  §5.7.
- **Intention ecology II** (Goschke & Kuhl 1993 intention superiority;
  Marsh, Hicks & Bink 1998 post-completion inhibition; Smith 2003
  monitoring cost; Walser et al. 2012 ~25% commission errors): armed
  nonfocal intentions boost the linked record AND tax all recall;
  completed intentions refire on cue re-encounter — §5.14
  (`intent_sup`, `monitor_cost`, `pm_commission_p`, `pm_commission_hl`).
- **Self-initiation tax** (Craik 1983/1986 environmental support;
  Craik & Byrd 1982; Lindenberger & Mayr 2014): age deficit
  concentrates in cue-sparse retrieval — §5.4 `selfinit_pen`/
  `selfinit_bar`, separable from env_support_gain by design.
- **Ease-of-retrieval inversion** (Schwarz et al. 1991 — 6 easy vs 12
  hard assertive acts): past `ease_n` the judgment follows
  1/searchCost — NEW §5.24. More retrieved, less believed.
- **Access-gap metric** (Tulving & Pearlstone 1966): "forgotten" is a
  probe condition — P250 requires ≥60% of uncued failures recover
  under maximal cueing; gap≈0 everywhere means the cue system is
  decorative (anti-database audit).
- Spec → v2.6 (+18 params, NEW §5.22–5.24, §5.2/§5.4/§5.7/§5.9/§5.13/
  §5.14/§4.13 amendments, contract additions); profiles +18 clamp
  rows + §14; probes P241–P250.
- Boundaries kept: research only, no code, no narratives, no push/merge.

## 27. v27 summary — age-development III (the bump's fuel, the adolescent regime, episodic-only amnesia, 2026-09-23)

Third pass on `age-development.md` (Part III §§23–35). What moved:

- **The bump gains a mechanism.** Robinson 1992 (first-experience
  memories as structural anchors of personal histories) + Brown's
  transition theory (Brown & Lee 2010; Thomsen & Berntsen 2008) →
  `first:true` event flag (`first_gain` 0.2, stream link ×1.5) and
  runtime `transition` windows (`transition_gain` 0.4, same valence
  gate). The 10–30 density peak is now partially *emergent* from the
  clustering of firsts/transitions — P251 is the decorative-mechanism
  detector. Generalizes v2.2's bible-fixed `bump_windows`.
- **Three-channel childhood false memory.** Ngo, Lin, Newcombe & Olson
  2019 (JEP:G, ages 4–80 inverted-U on mnemonic discrimination AND
  relational binding) + Rollins & Cloude 2018 (5–6y elevated
  similar-lure FA) → `discrim_mult`/`lure_accept` child knots
  (~0.75/~1.6 at 5 → 1.0 by 10). Children are now simultaneously
  suggestion-high, gist-lure-low, item-discrimination-poor — three
  dissociable mechanisms, sign-locked by P252. `phantom_p` stays
  monotonic by design.
- **Child interference.** `pi_child_mult` 1.3 on n_sim accrual for
  encodeAge<10 (Howe; Ceci & Bruck) — interpolated similar events
  hurt child-encoded traces more; the scaffolded-retell ecology is
  the compensation (P253).
- **Gate correction:** all amnesia machinery (ramp, decay_mult,
  ret_window, latent) now episodic-only. Early semantic/procedural
  records form normally, born decontextualized — the lullaby survives
  with no episode attached (P254, structural).
- **Adolescence as a regime, not a knot:** `peak_hour` +1.5h (13–19)
  + `adolesc_sleep_loss` 1.2 with post-recovery persistence (Carskadon
  2011; Lo et al. 2016 SLEEP; Lo et al. 2017 J Sleep Res — encoding
  impaired after 5 restricted nights, measured post-recovery);
  `social_eval_gain` 0.25 teen-knotted (Somerville 2013);
  `coruminate_gain` 1.3 — extra negative-record retell draw gated on
  a close peer PersonModel, teen-weighted, trait-loaded social/sex
  (Rose 2002; Stone et al. 2011); depressive OGM drift now age-gated
  ≥12 (Sumner 2011).
- **Narrative onset:** Habermas & Bluck 2000 — global life-story
  coherence emerges 12–20. Retells in `narr_window` [12,25] add
  `narr_coh_gain` 0.1 gist S + mint cross-era thematic links at
  `narr_link_gain` 0.15 (P258).
- **Life-script dating prior:** `script_date_pull` 0.3 pulls
  transition-class dateEstimate toward `script_age`; off-script
  events carry ×1.3 date_sigma (Berntsen & Rubin 2004; Bohn &
  Berntsen 2011).
- **Child PM:** interruption-fragile, scaffold-rescued
  (Kvavilashvili, Messer & Ebdon 2001) — `pm_interrupt_mult` 1.5
  child knots + `pm_scaffold_gain` 0.2 caregiver co-presence (P260).
- **Reversible regime overlays (new machinery class):** `preg`
  (θ+0.10 recall-side, enc−0.08, PM−0.2, recognition frozen-spared;
  Henry & Rendell 2007 meta; Davies et al. 2018 SMD −0.48; Rendell &
  Henry 2008 real-world PM) and `perimenopause` (enc−0.05 +
  `perim_s_gain_mult`≈0 practice stall, ~4y, fully reversible;
  Greendale et al. 2009 SWAN n=2362 — retest improvement absent in
  transition, rebounds post). Complaint > deficit in both — the
  metamemory gap is the phenotype (P261/P262).

Spec → v2.7 (+17 params, 1 frozen constant, 5 knot-table updates,
NEW §4.17, amendments §2/§4.2/§4.13/§4.14/§5.14/§6.15, contract
additions incl. `setOverlay` + `first`/`transition`/`evaluated` Event
fields + `script_age` table). Profiles +17 clamp rows + §15 note.
Validation registry → P1–P262.

Sources verified via web this pass: Ngo et al. 2017 Dev Sci +
Ngo et al. 2019 JEP:G (PMC6715497); Rollins & Cloude 2018 Learn Mem;
Lo et al. 2016 SLEEP 39:687 + Lo et al. 2017 J Sleep Res
(10.1111/jsr.12578); Somerville 2013 CDPS 22:121; Greendale et al.
2009 Neurology (SWAN n=2362, PMC2690984); Henry & Rendell 2007 JCEN
29:793 + Davies et al. 2018 MJA 208:35; Habermas & Bluck 2000 Psychol
Bull 126:748; Robinson 1992 (Springer NATO ASI 65); Kvavilashvili,
Messer & Ebdon 2001 Dev Psychol 37:418; Rose 2002 Child Dev 73:1830.
Boundaries kept: research only, no code, no narratives, no push/merge.

## 28. v28 — age-decline III (the paradox layer)

New primary-source territory this pass: prospective memory's
lab-vs-life inversion (Rendell & Thomson 1999; Rendell & Craik 2000
Virtual/Actual Week; Rose et al. 2009 WM moderators); strategy
rescues with age boundaries (Chasteen et al. 2001 implementation
intentions >2× in old only; Kretschmer-Trendowicz et al. 2009 old-old
failure); synchrony × false memory (Intons-Peterson et al. 1999 —
nonoptimal-time testing inflates elder lures only); enactment's
parallel decline (Rönnlund et al. 2003, Betula n=1000 — SPT advantage
preserved, not a rescue); errorful-vs-feedback testing in old age
(Tse, Balota & Roediger 2010 crossover); illusory truth inverted —
elders shielded by knowledge density (Brashier et al. 2017 reversing
the Fazio et al. 2015 default); reality monitoring of self-actions
(Henkel et al. 1998 similarity-gated imagined→perceived); effortful
listening and hearing-loss association (Rabbitt channel capacity;
Lin et al. 2011 HR 1.89/3.00/4.94); loneliness as state not pathology
(Wilson et al. 2007 — doubled AD risk, no pathology correlate →
reversible-overlay justification); memory complaints decouple from
performance (O'Connor 1990; Pearman & Storandt 2004; SAGE ρ=−.12 vs
.44 depression); involuntary AM preserved while voluntary declines
(Schlagman et al. 2009 — frequency flat, specificity spared,
valence positive); crystallized growth to ~60 (Park 2002; Verhaeghen
2003); anticholinergic burden (Gray et al. 2015, causality DEBATED —
modeled acute-reversible only).

Spec → v2.8 (+17 params, 1 frozen constant `lure_sync_gate`, knot
updates to potent_gain/self_est_bias/complaint_k, six cite-guarded
AGE-FLAT nulls: pm_focal_hit, enact_gain, rep_gain, involuntary scan
rate, metamem_r, warn_mult; contract additions: noise_level context
field, isolation/med_antichol overlays, partnerDeath event,
depress_state report input, intention `fires` counter). Profiles +17
clamp rows + §16 note. Validation → P1–P273 (P263/P268/P271/P272
MUSTs; P263/P265/P268 sign-locked).

## 29. v29 — emotional-memory III (the feeling's grammar)

Third pass on the affect layer. New primary-source territory:
appraisal-tendency discrete emotions (Lerner & Keltner 2000/2001 JPSP
— fear↔anger certainty/control split; Levine & Pizarro 2004; Chapman
et al. 2013 disgust); arousal inverted-U on the associative channel
(Yerkes & Dodson 1908; Diamond et al. 2007; Payne et al. 2007;
Andreano & Cahill 2006); appraisal-driven emotion reconstruction —
outcomes rewrite remembered feeling (Levine 1997 Perot; Levine et al.
2001 OJ; Levine & Bluck 1997 aging); the Proust channel (Chu & Downes
2000 Chem Senses + Cognition — odor-cued bump peaks 6–10y; Chu &
Downes 2002; Willander & Larsson 2006/2007; Herz & Schooler 2002 —
emotional not veridical); calendar-cued intrusion (Morgan et al. 1998
J Trauma Stress 31% anniversary reactions; Morgan et al. 1999 AJP
6-year persistence, spouse-corroborated; VA National Center PTSD);
negativity asymmetry in person impressions (Skowronski & Carlston
1989; Baumeister et al. 2001 "bad is stronger"); narrative coherence
as trauma repair (Foa, Molnar & Cashman 1995; Pennebaker & Seagal
1999; DEBATED replication — Zoellner & Bittinger 2004; Boals event
centrality); weapon focus (Steblay 1992 meta; Fawcett et al. 2013);
recall→mood feedback and nostalgia (Velten 1968; Westermann et al.
1996 meta; Wildschut et al. 2006 JPSP); hot-cold empathy gaps
(Loewenstein 2005; Robinson & Clore 2002).

Spec → v2.9 (+20 params; record schema gains `emotion` tag and trauma
`coherence`; cueVector gains `modality`; recall output gains
`cue_source`; recall writes back to C.mood). Profiles +24 clamp rows +
§17 dials note. Validation → P1–P285 (P274/P275/P276/P278/P279/P285
MUSTs; P274/P276/P279 sign- or rate-locked; P285 anti-Goodhart
integration battery). Sources verified via web (DOIs confirmed for
Levine 1997, Morgan 1998/1999, Chu & Downes 2000, Foa 1995 incl. the
mixed-replication caveat).

Boundaries kept: research only, no code, no narratives, no push/merge.

## 30. v30 — false-memory III (the passive channels)

Third pass on distortion. New primary-source territory: verbal
overshadowing (Schooler & Engstler-Schooler 1990; Meissner & Brigham
2001 ACP meta Zr=−0.12; Alogna et al. 2014 RRR −4% immediate / −16%
delayed-adjacent description — timing-conditional, robust); unconscious
transference and own-group bias (Loftus 1976; Ross, Ceci, Dunning &
Toglia 1994 ~3× misID + elimination-by-informant; Read et al. 1990
boundary-condition nulls; Meissner & Brigham 2001 PPPL meta — own-group
1.40× hits / 1.56× fewer FAs; 2022 three-level re-meta; Innocence
Project ~69–75% of DNA exonerations involve misID); memory conjunction
errors (Reinitz, Lammers & Cochran 1992; Reinitz & Hannigan 2001
proximity/attention-switching; Odegard & Lampinen 2004 — autobiographical,
"remember" judgments; Burt et al. 2004 aging); boundary extension
(Intraub & Richardson 1989 — 95% of drawings extended; Seamon et al.
2002 all-ages; Intraub & Dickinson 2008 source-monitoring account;
age-preserved-to-amplified); denial backfire / negation familiarity
(Skurnik, Yoon, Park & Schwarz 2005 JCR — older adults 28%→40%
false-as-true at 3d, repetition worsens; Mayo, Schul & Burnstein 2004;
Jacoby 1999 fluency→truth); reactivation susceptibility (Chan, Thomas
& Bulevich 2009 Psych. Sci. reversed testing effect — both cohorts;
Hupbach et al. 2007; DEBATED vs Potts & Shanks 2012 / interim-test
protection); phantom recollection (Brainerd, Wright, Reyna & Mojardin
2001 conjoint recognition — PR > familiarity contributor; 2022 CRM
meta 537 sets, dual-recollection); central-peripheral gradient +
dyad>group (Dalton & Daneman 2006 — peripheral 82% / central 35% /
unmentioned 10%; dyad 68% vs group 49%; Ibabe & Sporer 2004
high-confidence central errors); truthiness (Newman et al. 2012 PBR —
nonprobative photo inflates BOTH poles of a claim; Alter & Oppenheimer
2009 fluency).

Spec → v3.0 (+13 params; new §§6.25–6.30; §6.3 reactivation clause;
§6.5 group_damp; §6.7 dressing; contract: hearAccount +negated/
dressing/groupSize, retell +verbalize, field-level lastRecallDay,
provenance:"inferred", PersonModel categoryTags/ingroup). Profiles
+16 clamp rows + §18 dials note. Validation → P1–P297
(P286/P288/P289/P290/P293/P295/P296 MUSTs; P286 sign-, P289 direction-,
P290 rate-locked; P297 portfolio anti-Goodhart). All sources verified
via web (DOIs and effect sizes confirmed).

Boundaries kept: research only, no code, no narratives, no push/merge.

## 31. v31 calibration summary — individual-differences III

Third pass on individual-differences.md (Part III, §§20–33). What
this version adds beyond the v7 trait layer and v19 second axis:

- **A separable store, finally.** face_ability is the first trait
  that provably does NOT ride g_mem — DP prevalence ~2.5%
  (Kennerknecht 2006; 0.64–5.42% by cutoff, DeGutis 2023) and
  super-recognizers ~1–2% (Russell 2009) bound real tails; Wilmer
  2010's specificity finding licenses the r≈0.2 partial
  correlation. The P298 probe makes the dissociation falsifiable:
  face-blind ≠ forgetful.
- **Neurodivergent phenotypes as parameter signatures.** ADHD is
  modeled as the literature says it is: an acquisition deficit
  (Skodzik 2017 — verbal LTM only, carried by encoding, retrieval
  intact), not a forgetting profile. ASD gets the FTT-inversion
  bundle — the meta-analytic decrease in suggestibility (z=−2.37)
  coexisting with Lind & Bowler source-monitoring costs and
  Crane & Goddard OGM is exactly the kind of non-monotone
  signature the param model exists to express; P300 sign-locks
  the three directions jointly.
- **Suggestibility splits from distrust.** GSS Yield/Shift are
  poorly correlated subfactors (Gignac & Powell 2009); we honor
  that by making Shift a report-side override — social pressure
  flips what a character SAYS faster than what they BELIEVE
  (hearAccount{negativeFeedback}).
- **The mode-gate discipline.** Mitte 2008's recall-only threat
  bias and Larsen 1987's affective-only intensity gate are the
  kind of findings this spec can state as explicit nulls —
  vigil and aim exist precisely because their nulls are
  informative. P303/P306 encode the nulls as MUSTs.
- **Documented refusal as a research deliverable.** The menstrual-
  cycle state is deliberately unimplemented (§29): small,
  unstable, non-replicating effects get a named refusal, not a
  parameter. This is the "established vs hypothesis" bar working
  as designed — the strongest claims got loadings, the weakest
  got a written reason they didn't.
- Spec → v3.1 (+19 params, 7 trait axes, 2 state overlays,
  hearAccount negativeFeedback + intox.kind contract); validation
  → P1–P309. 15+ sources verified via web (prevalence figures,
  meta-analytic effect sizes, the Kloft acute-vs-1-week pattern).

## 32. v32 calibration summary — social-memory III (the dyadic ledger)

Third pass on social-memory.md (Part III, §§32–47). What this version
adds beyond the v8 person layer and v20 talk ecology:

- **The impression is two-dimensional, finally.** PersonModel.traits
  now carry `dim` tags and a scalar `eval` recomputed moral-primary
  (moral_primacy 0.65 — Brambilla 2019 showed moral info drives
  impression REVISION, not just formation; Reeder & Coovert's
  asymmetric resistance becomes `moral_rehab`). This is the first
  spec'd answer to "how much does a character LIKE someone" that is
  a memory output rather than a relationship input — rumor
  believability, audience tuning, and tell-selection all read it.
- **The FAE becomes a resource mechanic.** Gilbert et al. 1988's
  three-stage model gives the STI write its missing correction stage:
  `sitConstraint` only discounts the trait inference when
  `correction_avail` clears the attention gate. Encoding the excuse
  and discounting it are separate events — the trait survives the
  context by ordinary source decay. This converts "fundamental
  attribution error" from a phenomenon we cite into a checkable
  compute path, and gives the vigilance/business traits a new handle.
- **Status enters as an asymmetry, not a score.** Ratcliff et al.
  2011 (verified: high-status faces get better recognition, attention,
  sociospatial binding, holistic processing) + Guinote's power-
  dampens-attention literature compose into `status_encode_gain`/
  `power_encode_loss` — memory for people is hierarchical, and the
  hierarchy is read off a world-supplied tag so the landlord axis
  works out of the box.
- **Destination memory refines the v1.6 flat roll into edge decay.**
  Gopie & MacLeod 2009 verified: toldTo is weaker than source; Gopie
  et al. 2010 verified the older-adult confident-MISS direction
  (withholding error = repeats). The doc's strongest age gradient
  (0.5·age_eff/60) is flagged interpolation — the literature gives
  direction, not a curve. Three decay rates now coexist on one
  utterance: content, source, destination — which is why real social
  bookkeeping fails in the characteristic ways.
- **Exposure mints person shells.** `exposureCount` accrues on
  sub-threshold co-presence — records that never become episodes —
  feeding both `familiar_only` outputs and the §6.26 transplant
  candidate pool (the new `exposureCount` term makes ambient
  familiarity the preferred dead-slot filler). The Jacoby
  famous-overnight mechanism, running on a neighborhood.
- **Gossip gets its second channel.** §6.3 adoption was about the
  CLAIM; §6.31 `heard_update_w` is about the TARGET — impressions
  update at a credibility-discounted rate decoupled from claim
  believability (P315 structure-lock). Disclosure closes the trust
  loop the other direction: Collins & Miller 1994's three
  disclosure–liking effects become two writes, and
  `shared_reality_gate` finally has a formation mechanism.
- **Impressions start categorical.** `individuation` (0→1 over
  diagnostic encounters) interpolates catPrior↔traits and couples
  `source_cat_share` to individuation depth [HYPOTHESIS coupling] —
  the ambient 20 staying "types" to most mains is now the correct
  emergent default, not a modeling failure.
- **Transference is the first motivated social bias.** Andersen &
  Chen's schema projection (verified: false recognition of
  significant-other-consistent traits never presented) gives RW
  "he reminds me of my brother" as a memory operation with
  observable false-fill consequences, decaying with individuation.
- **Retell reads the audience's ledger.** `novel_pick_w`/`told_pen`
  make field selection audience-aware on documented-as-wrong
  bookkeeping (shared_with over-assumes, toldTo under-remembers) —
  per-audience content divergence is the microstructure real rumor
  networks show. `phrasing` tokens (Pickering & Garrod alignment)
  survive hops as lineage markers — a forensic tool the history
  browser can expose.
- **Contagion tracks the teller's present.** §6.33 formalizes the
  person-mediated arousal channel on `speakerArousal` — cooled
  tellers ship cooled rumors regardless of birth arousal.
- Spec → v3.2 (+22 params, PersonModel +3 fields, §§6.31–6.33 +
  clause updates in §§1/2/4.10/5.10/6.11/6.12/6.14/6.26; contract:
  `sitConstraint`/`status`/`speakerArousal`/`phrasing`/`exposure`
  events); validation → P1–P321 (P310/P311/P313/P315/P318 sign- or
  structure-locked MUSTs). 15+ sources verified via web (Gopie DOIs,
  Ratcliff PSPB, Collins & Miller Psych. Bull., Andersen & Chen
  Psych. Rev., Gilbert JPSP, Brambilla EJSP — all confirmed).

## 33. v33 — formal-model IV: what the society layer borrows from the literature

Fourth formal-model pass (`memory/formal-model.md` Part IV,
§§26–35). Methodological grounding, not new memory mechanisms:

- **Truth-default as the adoption prior.** Levine (2014, J. Lang.
  Soc. Psych.) — communication is believed unless a trigger fires;
  Street & Masip (2015) situate lie-detection inside it. RW
  consequence: `told_by` adoption flips from suspect-then-maybe
  to adopt-unless-flagged, with the §6.3 moderator stack AS the
  trigger list. AGM belief revision (Alchourrón, Gärdenfors &
  Makinson 1985) documented as a REJECTED alternative — rational
  consistency maintenance is empirically false for humans
  (Johnson & Seifert 1994 continued influence).
- **Parameter recovery = the falsification gate.** Nilsson,
  Rieskamp & Wagenmakers (2011, J. Math. Psych. 55:84) and
  Palminteri, Wyart & Koechlin (2017, TICS 21:425): a model whose
  parameters can't be recovered from its own simulations is
  unfittable. recoveryRun + the freeze rule turns §4's sloppy-
  model audit into a convergent loop — params that fail recovery
  twice become population constants.
- **Probe statistics.** Wilson (1927) intervals on proportion
  probes; Benjamini–Hochberg (1995) FDR at q=0.1 across ~330
  assertions — nominal α would yield ~16 false-positive failures;
  flaky-probe 4×n rerun protocol.
- **Sensitivity screening.** Morris (1991, Technometrics 33:161)
  elementary-effects map over free params × the §21 composites —
  publishes which params the bible authors should actually vary.
- **Society semantics** (broadcast atomicity, dyadic commit order,
  session bounds, snapshot cuts, validation contract, degradation
  ladder) are engineering law — no literature claim; the
  psychological content they carry is witness divergence (Loftus
  1979) and co-witness conformity (Gabbert, Memon & Allan 2003).

## 34. v34 — character-profiles II: the narrative-self layer (2026-09-23)

Focus: character-profiles, second pass (cast-profiles.md Part II
§§8–13). Four findings that turn a record store into a person, plus
the ambient-tier formalization.

- **Self-defining memories (SDM).** Singer & Salovey (1993); Blagov &
  Singer (2004, J. Personality 72:481–511 — verified via DOI
  10.1111/j.0022-3506.2004.00270.x): a capped set of identity-
  carrying memories scored on four dimensions — specificity,
  meaning, content (Thorne & McLean taxonomy), affect. The
  load-bearing individual-difference result: SDM SPECIFICITY is
  inversely related to repressive defensiveness (Weinberger scale)
  while meaning is not — the defensive person keeps the point and
  loses the scene. Spec mapping: `selfdef`+`meaning`+`sdmCat`
  record fields, archive floor, split drift (meaning held, wording
  drifts), warm-bias drive, `selfdef_spec_mult` = 1−0.5·max(0,defens).
- **Mnemic neglect.** Sedikides & Green (2000, JPSP 79:906 — person-
  memory paradigm; 2009 P&SC review "Memory as a Self-Protective
  Mechanism"; Green, Sedikides & Gregg 2008 JESP 44:547 — verified):
  recall (NOT recognition — "forgotten but not gone") is impaired
  for feedback that is negative × central-trait × high-diagnostic ×
  self-referent; ALL FOUR gates required. Relieved by close-source
  feedback and self-improvement framing (Green et al. 2009, Self &
  Identity 8:233). Magnified by repressive defensiveness. Spec
  mapping: three-gate recall-drive penalty `mnem_neg`, recognition
  path exempt, `mnem_close_relief` — a retrieval defense, never an
  encode block.
- **Life scripts sharpen the bump.** Berntsen & Rubin (2004, Psych.
  Bull. Rev. 11:1003, N=1,485 Danes — verified) + Rubin & Berntsen
  (2003, Psych. Aging 18:636, N=1,241): cultural life scripts
  concentrate EXPECTED positive transitions at 15–30; the bump
  exists for positive events only; negative events show no bump and
  their distributions peak at the present; happy involuntary
  memories run ~2× unhappy and only happy ones bump. Spec mapping:
  `neg_now_pull` (forward misdating on negative dateEstimates),
  `script_age_pull` (normative-age attraction on lifescript-tagged
  positives), `invol_pos_bias` (ambient-scan valence asymmetry).
- **Redemption/contamination.** McAdams, Reynolds, Lewis, Patten &
  Bowman (2001, PSPB 27:472–483 — verified): narrative sequences
  where bad turns good (redemption; tracks wellbeing + generativity)
  vs good turns bad (contamination; tracks distress); redemption
  predicts wellbeing beyond raw affective tone. Spec mapping:
  `script_redeem` ∈ [−1,1] as a direct bible pin × `redeem_write`
  per-retell accrual on the `meaning` field only — checkable facts,
  drifting interpretation.
- **Ambient NPC tier.** `deriveParams(ambient:true)`: narrow trait
  band (`ambient_trait_sigma` 0.3σ), zero anchors, category-first
  PersonModels (`cat_prior_pull` high, `individ_rate` low — Fiske &
  Neuberg 1990 category-then-individuate is the same finding as
  v3.2 §40), promotion path preserves records verbatim. Thin
  characters stay types until promoted — an intended null.
- **Profile-level consequences (cast-profiles §9):** the avoidant
  five decompose into three machines (Priya encode-gate; Victor
  encode+recall+anchor-vague; Tomás encode-only); two mains carry
  `selfdef`+`confidential` gagged anchors (Dani, Carmen); Marcus is
  the pinned NULL for `mnem_neg` — his deflection is behavioral,
  not mnemonic; Victor's transactive widowhood now removes his
  mnemic-relief channel too (v22 Harris finding × v34 Green finding
  compose).

## 35. v36 — encoding-mechanics III: the capacity/competition layer (2026-09-23)

Third pass on `encoding-mechanics.md` (Part III §§30–43). Parts I–II
priced how an event was processed and the encoder's motivational state;
Part III prices the moment's competition structure — what else was on
screen, what could fit, what was still open, what was handed off.

- **Perceptual load is a different knob than divided attention.**
  Lavie's load theory (1995/2005; Cartwright-Finch & Lavie 2006 —
  verified): high perceptual load exhausts capacity on focal material,
  filtering irrelevants at early selection (load-induced inattentional
  blindness, meta-confirmed); LOW load spills involuntarily onto
  distractors. Murphy & Greene (2016 — verified): high-load witnesses
  keep central detail, lose peripherals, become more suggestible.
  Forster & Lavie (2009 — verified): absorbed scenes suppress
  mind-wandering. Spec: `perceptLoad` field drives `att_min_eff`,
  peripheral suppression, low-load spillover, lapse relief, and a
  permanent `load_flag` suggestion marker (sleepdep_flag's trick).
- **Records have a width.** Cowan 2001 (verified, 4±1 chunks): events
  now write at most `wm_cap` full-strength elements; overflow fields
  survive at reduced rate/strength; `coherentUnit`/DomainTable merge
  elements — experts see fewer chunks (Chase & Simon reuse).
- **Boundaries leak.** Leroy 2009 (verified): post-boundary attention
  residue — interrupted prior segments leave more, clean closes less —
  modeled as decaying daLoad over 3 ticks. Brenner 1973 + Bond 1985
  (verified): the next-in-line effect is an ENCODING failure on
  other-agent content while composing a turn — `floor_next` flag.
- **Open loops hum.** Goschke & Kuhl 1993 + Marsh, Hicks & Bink 1998
  (verified): pending intentions hold persisting activation (tonic
  daLoad + cue heating) and completed/canceled ones drop BELOW
  neutral — `intent_done_decay` makes done errands fade fastest.
- **Offloading writes hollow records.** Sparrow, Liu & Wegner 2011 +
  Henkel 2014 + Risko & Gilbert 2016 (all verified): expecting
  external storage lowers content memory but strengthens
  where-to-find-it memory; zooming/attending nulls the camera cost.
  `offload` events → weak content + strong `extref` pointer; `extCue`
  intentions discharge the tonic but bind internal cues half as well.
- **Threat eats the frame.** Bar-Haim et al. 2007 (verified: 172
  studies, d=.45, absent in nonanxious): `threatCue` records
  prioritize while co-occurring neutrals drain, anxiety-scaled —
  the scene-level complement to item-level ABC.
- **Two cheap temporal/context modifiers:** pre-sleep adjacency
  (Jenkins & Dallenbach 1924; Gais 2006 — last-3h records shielded at
  the sleep tick) and varied-context re-encoding (Smith & Rothkopf
  1984 — spaced re-activations in new contexts append cue fields:
  doors, not strength).
- **Deliberate nulls:** primacy (boundary_gain+elaboration absorb),
  reactive JOL (gen_gain), seductive details (daLoad), massed
  re-encoding (existing rails), reward (value_select fold), momentary
  suppression (suppress_da_map), post-learning exercise, raw modality.
- Spec v3.4→v3.5: §2 +9 bullets, §7 +18 params, +9 frozen constants,
  §10 contract fields (perceptLoad/floor_next/offload/offloadAttend/
  threatCue/interrupted/closedClean/extref/load_flag/extCue);
  profiles §0 +12 clamp rows + §22; probes P358–P367 (registry P1–P367).
  4 source families web-verified (Lavie corpus, Leroy, Bond/Brenner,
  Sparrow/Henkel/Risko-Gilbert, Goschke-Kuhl/Marsh, Bar-Haim, J&D/Gais,
  Cowan, Smith-Rothkopf) — DOIs/effect directions confirmed.

## 36. v48 — encoding-mechanics IV: the gate's exceptions and the
## social cast (2026-09-23)

Fourth pass on `memory/encoding-mechanics.md` (Part IV §§44–57, spec
→ v4.6). What was learned, compressed:

- **Records go stale, not just faint.** Change blindness (Rensink
  1997 flicker; Simons & Levin 1998 door study; Veiel et al. 2006 age
  meta): unattended object changes never update the record — the
  character believes the OLD value at full confidence. New field tier
  flag `stale:true`; `field_upd_min` gate with an age knot and an
  animate-change relief (New et al. 2007). This is a failure mode the
  sim had no name for: the confidently-outdated neighbor.
- **The attention gate has a hole shaped like the self.** Moray 1959
  → Wood & Cowan 1995 (34.6%, verified) → Conway, Cowan & Bunting
  2001: your own name pierces the ignored channel, and the people it
  reaches are the LOW-WMC ones — inhibition failure, not listening
  skill. `ownname_break_p` with a sign-locked negative wmc slope is
  the rare param whose moderator runs backwards.
- **Content classes with their own birth-weight:** humor (Schmidt
  1994 — attended-only, within-list, self-calibrating via
  `humor_rate`) and animacy (Nairne 2013 — valence-flat, orthogonal
  to threat; a kitten encodes like a snake) join the E formula.
- **The person ledger is order-dependent.** Hastie & Kumar 1979 +
  Stangor & McMillan 1992 (verified meta, 54 experiments): formative
  impressions elaborate anomalies; strong impressions prefer
  congruent evidence and under-write counterexamples — the sign
  FLIPS at `impress_strong_thresh`. Asch/Luchins primacy weights
  early evidence in eval formation, with a depleted-state recency
  arm. RW consequence: first impressions literally outweigh, and an
  entrenched opinion stops filing its counterexamples.
- **Desire tunnels too.** Gable & Harmon-Jones 2008/2010 (verified):
  motivational intensity, not valence, narrows scope — high-approach
  positive states drain periphery like threat. `motiv_narrow` gives
  the positive event its weapon-focus.
- **Lies are born knowing they're contested.** Walczyk ADTD: the
  deceptive emission costs more (encodes deeper, `lie_enc_gain`) but
  mints with a weak source tag (`lie_src_weak`) — the mechanical
  upstream arm for Polage's fabrication inflation already in §6.68.
- **The notebook only helps if it rephrases.** Mueller & Oppenheimer
  2014 vs the failed replications (Urry 2021, Morehead 2019 —
  verified): the device is a locked null (`note_mode_null`); verbatim
  transcription mints extref pointers and stays thin; generative
  rephrasing encodes (`note_gen_gain`). Diary-keeper cast members
  get durable pasts; screenshot-archivers get hollow archives.
- **Deliberate nulls:** longhand modality (replication failure),
  melody/jingle (cue-side already), exposure duration (emerges from
  record count), mere exposure (impl_str), imagery instructions
  (orienting task), emotional-granularity re-add.
- Spec v4.5→v4.6: §2 +9 bullets, §7 +16 params + nulls/knots, §10
  contract fields; profiles §0 +9 clamp rows + §31; probes
  P493–P502 (registry P1–P502). 9 source families web-verified
  (Wood & Cowan PubMed, Conway DOI, Stangor & McMillan DOI, Nairne
  PubMed, Gable & Harmon-Jones DOIs, Urry/Morehead replication
  records).

## 37. v60 — encoding-mechanics V: the attempt before the trace (2026-09-23)

Part V closes the loop between encoding and what preceded it —
the retrieval attempts, scaffolds, and co-occurrences that decide
whether an event ever becomes a trace.

- **The failed search warms the landing.** Kornell, Hays & Bjork
  2009 + Richland, Kornell & Kao 2009 (both verified): an
  unsuccessful retrieval attempt potentiates encoding of the answer
  when it arrives — `pretest_mark` is content-locked and attempt-
  gated (shown-but-unattempted = nothing, Richland Exp. 5). The
  complement to §5.26's global forward-test boost: that one fires on
  success, this on failure.
- **Confident errors correct deepest.** Butterfield & Metcalfe 2001
  hypercorrection (verified PMID 11713883) — correction E scales
  with errConf; the old lose it unsupported (Metcalfe 2015
  PMC3604148) and get it back under support (Cyr & Anderson 2013) —
  both arms ride the same `envSupport` field, one mechanism.
- **The scaffold does the work.** Craik's environmental support is
  now two-legged: retrieval-side `env_support_gain` (v0.4) and the
  new encode leg `env_enc_gain` ×(1−si_res) — complementarity means
  the SAME scaffold that rescues the elder gives the young nothing
  (Craik & Rose 2012; Naveh-Benjamin 2002 — verified).
- **Knowledge with no episode.** Saffran 1996 + Turk-Browne 2005:
  co-occurrence tallies mint θ-exempt links — the "just knows who
  sits where" channel the episodic store can't produce.
- **The moral-encoding edge is narrow on purpose.** Bell, Buchner &
  Musch 2010 (experience-near cheating → recognition+source) vs
  Buchner et al. 2009 (describe-only → source only, recognition
  null — locked as `cheat_recog_null`).
- **Interleaving teaches the difference, not the item** — contrast
  legs get `interleave_gain`; episodic E unchanged; verbal material
  locked null (Brunmair & Richter meta g=−0.39). JOL over-reads
  massed fluency (Kornell & Bjork's illusion — report-side only).
- **Adjudicated absences:** disfluency_gain = 0 (Xie 2018 d≈0.01;
  Rummer 2016; Metacogn. Learn. 2016 special issue) — the second
  CONTESTED-anchor absence assertion after P616.
- Spec v5.7→v5.8: §2 +9 bullets, param block +16 params +3 locked
  nulls, §10 contract fields (envSupport, corrects, harmedParty,
  interrupted, pretest_mark, cooccur); profiles §0 +9 clamp rows +
  §42; probes P629–P636 (registry P1–P636). 8 source families
  web-verified.

## 38. v61 addendum — forgetting-curves VI anchors (verified)

The forgetting curve is not smooth and not private. This pass's
sourced claims (full grounding in forgetting-curves.md §§27–31):

- **Recall re-opens the file.** Nader, Schafe & LeDoux 2000 (Nature
  406:722) + Hupbach et al. 2007 (L&M 14:47): reactivated memories
  enter a labile window where they can be updated or lost — adopted
  weakly (replication record honest: Bos 2014 boundary conditions).
  Retrieval is when distortion enters.
- **The teller forgets for the room.** Cuc, Koppel & Hirst 2007
  (Psych Sci 18:727): speaker-side retrieval-induced forgetting
  propagates to listeners — narrated omissions suppress the
  audience's related records. Collective forgetting has a mechanism.
- **Sleep curates.** Payne et al. 2008 (Psych Sci 19:781) + Wilhelm
  et al. 2011 (J Neurosci 31:1563): sleep preferentially consolidates
  arousing and expected-to-matter content; Mazza et al. 2016 (Psych
  Sci 27:1321): spacing across sleep doubles retention per practice.
- **Interference peaks at middling similarity.** Osgood 1949's
  transfer surface — identical encodes rehearse, dissimilar ones
  never compete, near-twins blur most.
- **Dates slide toward now.** Rubin & Baddeley 1989; Janssen et al.
  2006 (Psych Bull 132:677): forward telescoping grows with record
  age — characters can be wrong about when while right about order.
- **"Let it go" is a third operator.** Bjork 1970 / MacLeod 1998
  directed forgetting: rehearsal withdrawal, ~10–20% cost — weaker
  and non-inhibitory vs Anderson suppression.
- **Aging taxes the tail and the binding.** Campbell, Hasher &
  Thomas 2010 hyper-binding (elders mint wrong co-occurrences);
  Elliott, Isaac & Muhlert 2014 ALF (intercept intact, multi-day
  tail steepens — DEBATED in healthy aging).
- **The weird survives the crowd.** von Restorff 1933; Hunt 1995 —
  distinctiveness is interference-resistance, not immortality.
- Framework anchor: Bjork & Bjork 1992 New Theory of Disuse is the
  S/R root this spec has implemented since v0.9 — now cited.

## 39. v62 addendum — retrieval-cues VI anchors (verified)

The cue has a direction, an echo, and a keeper. This pass's sourced
claims (full grounding in retrieval-cues.md §§60–69):

- **Associations run forward.** Kahana & Caplan 2002 (JML 46:111) +
  Rizzuto & Kahana 2001: backward recall loses to forward under
  matched conditions — a cue is a head+tail, not a symmetric link.
- **Fragments re-enter the search.** Norman & Bobrow 1979 (Cog
  Psych 11:107) + Williams & Hollan 1981 (Cog Sci 5:87): retrieved
  partial descriptions become the next probe's specification —
  "let me think" is an actual loop.
- **Objects remember outside the skull.** Heersmink 2015 + Turkle
  2007 (evocative/distributed memory); Henkel 2014 (Psych Sci
  25:396 — VERIFIED): whole-object photo-taking impairs memory,
  detail-zoom eliminates the deficit; Barasch et al. 2017 (JPSP
  112:741): engaged photographing can help — sign rides engagement.
- **Loud cues do quiet cues' jobs.** McDaniel & Einstein 1993
  (Memory 1:23 — VERIFIED) + Brandimonte & Passolunghi 1994:
  distinctive/unfamiliar PM cues beat ordinary nonfocal ones,
  increasingly with delay.
- **The asker sets the report option.** Koriat & Goldsmith 1996
  (Psych Bull 103:490): forced responding buys quantity at
  accuracy's price — the trade-off lives in the report decision,
  not the trace. Orne 1962 demand characteristics; rapport arm via
  Vallano & Schreiber Compo 2011.
- **The probe wears a path.** Karpicke & Roediger 2008 + Carpenter
  & DeLosh 2006: retrieval practice strengthens the cue→target
  route, weakest cues gaining most — the rehearsed anecdote and
  the cold question are different roads to the same record.
- **A failed search restarts on a new angle.** Fisher & Geiselman
  1992 (change-order/change-perspective mnemonics); Köhnken 1999 +
  Memon, Meissner & Fraser 2010 (Psych Bull 136:340 — CI meta,
  d≈1.2 correct-detail): varied retrieval paths recover what the
  first pass dropped; identical re-asks inherit the damage.

## 40. v63 addendum — age-development VI anchors (verified)

- **The infant's clock is a different clock.** Hartshorn et al.
  1998 + Rovee-Collier 1999: retention doubles roughly monthly
  through infancy (~1d @2mo → ~2wk @6mo → ~13wk @18mo). The
  amnesia wall is emergent decay on a fast schedule, not a
  special erasure rule.
- **A reminder must be seen, not told.** Rovee-Collier's
  reactivation paradigm: a flagging infant memory is restored by
  perceptual re-encounter — verbal accounts cannot reach
  below-wall records (locked null in the spec).
- **Neurogenesis may be the eraser — DEBATED.** Frankland et
  al. 2013 (Science): infant-magnitude neurogenesis actively
  induces forgetting; suppressing it preserves infant memory.
  Rodent data; coexists with retrieval-failure accounts.
- **Toddlers record other people's events.** Barr & Hayne 1999;
  Bauer 2002: deferred imitation — observed action sequences
  reproduced after weeks, from ~12mo. The watched-not-done
  channel is real but self-field-thin.
- **The bump cascades.** Svob & Brown 2012: parent-told memories
  bump at the PARENTS' era. Krumhansl & Zupnick 2013: a second
  music bump at the parents' young-adult years. Family archives
  transmit their teller's adolescence.
- **The child can't supply the cue.** Kobasigawa 1974: the
  retrieval deficit is generation, not use — provided cues work,
  self-generated ones don't arrive until ~10–12. Scaffolding is
  the fix, not a crutch.
- **Children order by strength.** Friedman 1991: lacking
  temporal codes, young children report the STRONGER memory as
  the more recent — the vivid old thing is "yesterday."
- **Strategies arrive on a schedule.** Ornstein et al. 2004 /
  Schneider & Pressley: rehearsal ~7–8, organization ~9–10,
  elaboration ~13+ — before onset, repetition is just
  re-exposure.
- **Schooling is an operator.** Morrison et al. 1995
  (birthday-cutoff): memory gains are GRADE effects > age
  effects — instruction itself reorganizes; extension to
  encode-side onsets is our flagged hypothesis.
- **The teen win sticks.** Davidow et al. 2016: reward-
  associated episodic memory peaks in adolescence — the bump's
  fuel includes a reward circuit, not just firsts.

## 41. v64 addendum — age-decline VI anchors (verified)

- **Recollection dies first; familiarity lingers.** Yonelinas
  2002 meta: ~2:1 effect-size split; familiarity declines only
  in the 75+ group. The old adult's "I know you" without "from
  where" is the correct readout, not a defect.
- **Gist survives verbatim — and votes.** Balota et al. 1999
  (DRM): older adults show MORE gist-consistent false alarms
  alongside LESS veridical recall. Both halves move; the false
  memory is the preserved gist doing the voting.
- **Positivity is a goal, not a filter.** Mather & Carstensen
  2005: the positivity effect is real and memory-level; Mather &
  Knight 2005: divided attention abolishes it entirely. No
  control, no bias.
- **The old brain keeps morning hours.** May, Hasher &
  Stoltzfus 1993: the age gap vanishes at the older adult's
  peak time. May & Hasher 1998: it's the inhibitory channel
  again. Automatic retrieval ignores the clock.
- **The senses tax the hippocampus.** Baltes & Lindenberger
  1997: vision+hearing mediate much of "cognitive" aging;
  Lin et al. 2011: hearing loss predicts dementia, dose-
  dependent. Degraded input costs even when understood.
- **Compensation has a ceiling.** Cabeza 2002 (HAROLD) +
  Reuter-Lorenz & Cappell 2008 (CRUNCH): old brains recruit
  more at low demand and saturate sooner — inverted-U, grind
  harder on easy, cliff on hard.
- **Doing beats watching, and the gap grows.** Bäckman &
  Nilsson: the enactment advantage is largely age-invariant —
  the motoric channel declines least.
- **Old couples think together.** Barnier et al. 2014:
  long-married older couples recall MORE episodic detail
  together than alone — a benefit no young couple needed;
  strangers get collaborative inhibition instead.
- **The errand has two legs.** Henry et al. 2004 meta:
  event-based PM ages gently, time-based PM falls hard;
  if-then framing (Liu & Park 2004) refunds half.
- **Calling out age taxes the recall.** Hess et al. 2003:
  stereotype-primed elders recall worse — a retrieval-side
  context tax, not a storage change.
- **Suggestibility amplifies through source failure, not
  acquiescence.** Roediger & Geraci 2007: the old adult's
  misinformation risk is familiarity-without-recollection —
  the shift leg, never the yield leg.
- **Exercise is the modifiable dial.** Erickson et al. 2011
  RCT: a year of walking ≈ +2% hippocampal volume. Fitness
  shifts effective age like reserve but drifts with behavior.

## 42. v65 addendum — emotional-memory VI anchors (verified)

- **Grief oscillates, it doesn't work through.** Stroebe & Schut
  1999 (*Death Studies* 23:197): adaptive coping is a two-mode
  oscillation (loss-oriented confrontation vs restoration-
  oriented respite) with dosage intrinsic — respite is part of
  the mechanism. Klass, Silverman & Nickman 1996: continuing
  bonds — the inner relationship persists (inner speech,
  consultation), overturning the detachment assumption.
  Ratcliffe 2020: the same vivid memory reads as presence or
  absence depending on context — a mode-dependent valence flip
  on identical content.
- **Emotion binds forward, breaks backward.** Bisby & Burgess
  2013: negative affect impairs associative binding, spares
  items — coherence loss. The 2023 *Cognition & Emotion* pair
  (discovery + preregistered replication): the negative→E+1
  link encodes STRONGER than E−1→negative — forward-favouring.
  Palombo et al. 2021: "what"↑, "which"↓, and the emotional
  item keeps its "when" while neutrals mislocalize late.
- **Counterconditioning changes valence, not expectancy.** Keller
  et al. 2020 review + pre-registered meta: CC outperforms
  extinction specifically on relapse channels; Raes & De Raedt
  2012: evaluative conditioning moves (d≈0.2), outcome
  expectancy doesn't — the rival tag, not the eraser.
- **Shared good news deepens.** Gable et al. 2004 (*JPSP*
  87:228): capitalization attempts raise PA beyond the event —
  gated on the listener's ACTIVE-CONSTRUCTIVE response; the
  shrugged-off win doesn't count.
- **The tone survives the words.** Schirmer & Escoffier 2010:
  prosody shifts the remembered valence of content implicitly —
  listeners needn't recall the tone for it to have stained the
  words. Chappuis et al. 2014: prosody-induced EEM replicates.
- **Dread can arrive with no picture.** Brewin 2015
  re-experiencing taxonomy + Ehlers & Clark 2000: affect-only
  intrusions are clinically standard (boundary with ordinary
  anxiety DEBATED); our CondEntry-outlives-source architecture
  produces them nearly for free.
- **The rival gets remembered for existing.** Maner et al. 2009:
  infidelity-primed, chronically jealous individuals show an
  attend→encode→remember cascade on attractive same-sex targets;
  Schützwohl & Koch 2004: sex-differentiated recall of
  infidelity cue classes a week later.
- **Awe writes a strange record.** Keltner & Haidt 2003:
  vastness + accommodation failure; Shiota et al. 2007:
  self-diminishing. No direct memory corpus — our thin-self /
  thick-gist / unfillable-gap signature is labeled HYPOTHESIS.
- **Hot records refuse the delete.** Hauswald et al. 2010
  (*SCAN*): arousing negatives exempt from directed forgetting;
  2021 item-method meta: emotional DF ~4.2pp smaller; van Schie
  2013: under controlled direct suppression, comparable —
  weak-end adopted, strategy halves the resistance.
- **A trusted hand quiets the firing cue.** Bouton's conditioned
  inhibitors + the Hornstein/Eisenberger social-safety
  direction: presence suppresses the CONDITIONED RESPONSE at
  expression; the association is untouched — inhibition, never
  unlearning (our locked null).

## 43. v66 addendum — false-memory VI anchors (verified)

- **The calendar drifts, bounded and biased.** Rubin & Baddeley
  1989 (*JEP:G* 118): dating-error magnitude grows ~0.4 days per
  day of delay, direction toward the middle of the recall
  interval — apparent telescoping falls out of retention +
  bounded errors + the impossibility of future intrusions; no
  systematic bias term needed. Thompson, Skowronski & Lee 1988
  (diary/exact-date method): telescoping measurable from ~8
  weeks; slight unreliable time-expansion for recent events.
  Lee & Brown 2003: moving the elicited window moves the bias
  (boundary model); forward telescoping survives guess-removal —
  two mechanisms. Huttenlocher, Hedges & Prohaska 1988/1990:
  hierarchical/category model — estimates regress toward bounds
  and prototypes. Friedman 1993: coarse temporal attributes
  (season, month, weekday, time-of-day) survive exact-date loss.
  Landmark anchoring: Shum 1998 review; Loftus & Marburger 1983.
- **Watching is half of doing.** Lindner, Echterhoff, Davidson &
  Brand 2010 (*Psych. Sci.* 21:1291): mere observation of
  another's actions → robust false self-performance memories,
  persisting despite immediate warnings and despite eliminated
  sensory overlap — the authors invoke interpersonal motor
  simulation, not source monitoring. Lindner & Davidson 2013:
  older adults, executive-function moderation.
- **Dreams leak into the record.** Rassin, Merckelbach & Spaan
  2001 (*JNMD* 189:478): 11.8%/25.9% of two general samples
  report dream-reality confusion; correlates dissociation +
  fantasy proneness. Mazzoni & Loftus 1996 (*Conscious. Cogn.*):
  dream content can be implanted→recalled as real. Kemp, Burt &
  Sheen 2003: dreamt experiences carry thinner sensory/contextual
  phenomenology than lived ones — the discriminative features
  exist but are weak. Wamsley et al. 2014 (*Sleep*): narcolepsy
  "dream delusions" — sustained false beliefs from vivid dreams;
  the clinical ceiling of the population channel.
- **Demanding detail protects — when there was detail to get.**
  Schacter, Israel & Racine 1999 (*JML* 40:1): the
  distinctiveness heuristic — a response mode demanding
  diagnostic recollection — suppresses gist-false recognition,
  and disappears when encoding offered nothing distinctive to
  expect. Gallo, Bell, Beier & Schacter 2006: two co-existing
  recollection monitors (distinctiveness + recall-to-reject),
  both deployable by older adults given supportive encoding.
  Koutstaal & Schacter 1999: scrutiny reduces but never erases
  the older-adult gist-false gap.
- **Fluency without source misattributes.** Jacoby, Kelley,
  Brown & Jasechko 1989 (*JPSP* 56:326): nonfamous names judged
  famous 24h after exposure, not immediately — familiarity
  outlives source recollection; divided attention amplifies
  (Jacoby, Woloshyn & Kelley 1989). Our neighborhood-scale
  extension (familiar name → "we've met") is extrapolation,
  gated on place-consistency.
- **Detection is the mediator — silently.** Tousignant, Hall &
  Loftus 1986 (*Mem. & Cogn.* 14:329, N=570): scrutiny (slow
  reading) → discrepancy detection → misinformation resistance;
  detection mediates warning, interval, and blatancy effects.
  Recollection-rejection work (*Appl. Cogn. Psychol.* 2017):
  spontaneous rejection of contradictory misinformation,
  decaying with delay; RES qualification (*Memory* 2017):
  retrieval-enhanced suggestibility accrues only to non-
  detectors — detection status, not the recall act, is the risk.
- **Imagers hallucinate better.** Horselenberg et al. 2000:
  imagery ability was the sole individual-difference predictor
  of imagination inflation; Heaps & Nash 1999: dissociation
  (DES) predicts too. Dobson & Markham 1993 (*Brit. J. Psychol.*
  84): high imagers are *worse* at external-external source
  discrimination — vivid internal generation blurs boundaries
  on both sides.

## 44. v67 addendum — individual-differences VI anchors (verified)

- **The upper tail is channel-specific, not superhuman.**
  LePort et al. 2012 (*Neurobiol. Learn. Mem.* 98:78, N=11 —
  verified abstract + UCI release): HSAM participants
  significantly better on personal AND public autobiographical
  recall including days/dates, but *comparable to matched
  controls on most standard laboratory memory tests* — the
  ability does not generalize. Patihis et al. 2013 (*PNAS*
  110:20947): HSAM false-memory susceptibility (DRM,
  misinformation) at control rates — extraordinary storage,
  ordinary reconstruction. Parker, Cahill & McGaugh 2006
  (*Neurocase*): the founding case. LePort 2016+ follow-ups:
  elevated obsessive-compulsive spectrum traits — habitual
  own-day review is the candidate mechanism we implement as a
  rehearsal engine (P707 makes that choice falsifiable).
- **The lower tail knows without reliving.** Palombo, Alain,
  Söderlund, Khuu & Levine 2015 (*Neuropsychologia* 72:105,
  N=3 — verified): lifelong SDAM, corroborated by absent fMRI/
  ERP recollection biomarkers; learning and memory intact
  wherever tasks "could be accomplished by non-episodic
  processes." Retrieval-side deficit, encoding-side intact —
  which is why v67 re-parameterizes the v2.5 SDAM modifier's
  decay leg as retrieval-side specificity thinning. Aphantasia
  covariation is partial, not identical (Wan et al. 2024).
- **Disposition to think shows up as an argument gap.**
  Cacioppo & Petty 1982 (*JPSP* 42:116) define NFC; Cacioppo
  et al. 1996 (*Psych. Bull.* 119:197, meta — verified): high
  NFC = more elaboration, more task-relevant thoughts, and a
  *larger* memory gap between strong and weak arguments —
  the trait's signature is selectivity, not volume.
- **The self thin-encodes what threatens it.** Sedikides &
  Green 2000 (*JPSP* 79:168) mnemic neglect; Green, Sedikides
  & Gregg 2008 (*JESP* 44:547 — verified): poorer recall with
  *intact recognition* of self-threatening feedback —
  "forgotten but not gone"; averted by close sources and
  modifiability framing (Green, Pinter & Sedikides 2009);
  attenuated by dysphoria (Sedikides & Green 2009 review);
  enhanced in repressors. Encoding-side shallow processing
  (Sedikides & Green 2006, *BBS*).
- **Injury erases backward, grades by severity, then stops.**
  Russell & Nathan 1946 (*Brain* 69:280): Ribot's graded
  retrograde amnesia; PTA length as severity index. Belanger
  et al. 2005 (*Neuropsychology* 19:595 meta): mild TBI's
  persisting effect is small and concentrated in WM/
  processing speed; sports-concussion arm largely resolved by
  ~90 days. Dikmen et al. 2009: PTA dose-response for
  moderate-severe.
- **The genotype moves the slope, not the person you meet.**
  Caselli et al. 2009 (*NEJM* 361:255, N=815 longitudinal —
  verified): cognitively normal APOE ε4 carriers' memory
  decline begins before 60 and accelerates faster, with an
  allele-dose effect (homozygous > heterozygous); weaker
  non-memory effects. Below onset: nothing observable.
- **Synesthesia's advantage is real, broad, and ordinary.**
  2019 multi-level meta-analysis (Rothen et al., *Memory* —
  verified): episodic d̂≈0.61, WM d̂≈0.36, pervasive across
  stimulus types — which the authors note undermines a
  direct-cue account. Rothen & Meier 2010 (*Memory* 18:258):
  the advantage is "ordinary rather than extraordinary" —
  our 0.08 loading is priced under that ceiling.
- **Rumination is a rehearsal policy, and it has two halves.**
  Nolen-Hoeksema 1991 (*JPSP* 60:115): ruminative response
  style prolongs negative mood. Watkins 2008 (*Psych. Bull.*
  134:163 — verified the split): brooding = maladaptive
  dwelling; reflection = potentially adaptive problem focus.
  Lyubomirsky & Tkach 2004: ruminators' negative
  autobiographical bias.
- **And the second thing that does nothing.** Pashler,
  McDaniel, Rohrer & Bjork 2008 (*Psych. Sci. Public
  Interest* 9:105 — verified): no credible evidence for the
  learning-styles meshing hypothesis; the supportive studies
  lack the required design. Rogowsky, Calhoun & Tallal 2015
  RCT: matching instruction to stated style did nothing.
  `learn_style` joins `birth_order` as a mandated null —
  the trait layer's honesty depends on being able to
  represent "no effect."

## 45. v68 addendum — social-memory VI anchors (verified)

Part VI of social-memory.md (the conversation's holes).
Anchors web-verified this version; spec §§6.125–6.134.

- **Waiting to speak deafens the speaker before you.**
  Brenner 1973 (*J. Exp. Psychol.* 98:120 — verified
  full-text): turn-taking read-aloud, N=88; recall craters
  ~2 positions before and 1 after one's own turn; the
  seminar phenomenology is in the paper ("unaware of
  anything else happening in the room"). Bond 1985
  (*JPSP* 48:853 — verified abstract): ENCODING failure —
  strong semantic cues don't rescue, post-hoc instruction
  doesn't, PRE-instruction reverses into advantage. Bond
  1991 (*PSPB* 17:174): elaborative rehearsal is the
  mediator, eye contact is not. → `nil_*` params with a
  locked retrieval-rescue null.
- **Incongruity advantage has a schema-strength gate — and
  recognition flips the sign.** Stangor & McMillan 1992
  (*Psych. Bull.* 111:42 — verified: 54 experiments): weak/
  newly-formed expectancies → incongruent recall wins;
  strong established expectancies → congruent recall bias;
  recognition favors congruent items throughout (Sherman
  et al. 1998 integration-theory fit). → §2.3 gated by
  `exp_str`, recognition arm sign-flipped via
  `incong_recog_flip`, encoding floor locked.
- **Implied becomes said.** Harris & Monaco 1978
  (*JEP:G* 107:1 — "between the lines"): hearers report
  pragmatically implied content as asserted; Brewer 1977 —
  the implicature is computed at hearing and the computed
  proposition stores. → `implied` fields mint weak-sourced
  gist; the said/implied distinction is M-tier.
- **The lens, not the target.** Higgins, Rholes & Jones
  1977 (*JESP* 13:141): recently-primed trait constructs
  assimilate ambiguous behavior descriptions; Bargh, Bond,
  Lombardi & Tota 1986 (*JPSP* 50:869): chronically
  accessible constructs do it unprimed; Martin 1986:
  contrast under unambiguous behavior — the boundary case.
- **Dependency buys resolution, not loyalty.** Erber &
  Fiske 1984 (*JPSP* 47:709) + Neuberg & Fiske 1987
  (*JPSP* 53:431): outcome-dependent perceivers remember
  MORE expectancy-inconsistent attributes; Fiske & Dépret
  1996: individuation runs up the dependency gradient —
  the §34 remember-up asymmetry's mechanism.
- **Two books, one harm.** Baumeister, Stillwell & Wotman
  1990 (*JPSP* 59:994) + Stillwell & Baumeister 1997
  (*Psych. Sci.* 8:219): victim narratives emphasize
  severity/arbitrariness and persist; perpetrator accounts
  fade and soften — the magnitude gap. Kearns & Fincham
  2005: the gap feeds unforgiveness. → `harmed:` tag splits
  decay/reconstruction arms; encode-side identical (locked).
- **Forgiveness rewires the charge, not the record.**
  McCullough et al. 2003 (*JPSP* 85:321): forgiveness =
  motivation change (avoidance/revenge decline), memory
  intact; Worthington 2003: decisional precedes emotional;
  vanOyen Witvliet 2001 (*Psych. Sci.* 12:117): physiology
  drops, episode reportable. → `forgiveEvent` moves the
  affect channel only — `forg_erase_null` locked.
- **Public promises bind both ends.** Kiesler 1971 (*The
  Psychology of Commitment*): public declaration increases
  binding; witnesses are distributed creditors. →
  `witnessed` on commitments strengthens both arms and
  mints third-party clones.
- **Your own story, back bent (composite hypothesis).** No
  single study isolates self-derivative echo adoption;
  composed from Gabbert 2003 conformity (0.71 anchor →
  capped 0.3 arm), source monitoring, and §24 canonization.
  P716 cap-locks it. `metVia`/`remet_offense_p` similarly
  flagged HYPOTHESIS composites.

## 46. v69 addendum — social-memory VII anchors (verified)

Anchors for spec v5.17 / SM Part VII (§§96–105). All
checked against primary sources this version.

- **Eval survives memory.** Johnson, Kim & Risse 1985
  (*J. Exp. Psychol.: Learn. Mem. Cogn.* 11:22): Korsakoff
  amnesics formed affective preferences for people they
  could not retrieve. De Houwer, Thomas & Baeyens 2001
  (evaluative-conditioning meta — attitude outlives the
  pairing episode). Srull & Wyer 1989 (impressions stored
  separately from generating behaviors). → `orphan_eval_resid`
  floor + `orphan_eval` emission; `orphan_reason_null`
  locked (no fabricated support episode).
- **Favor asymmetry (composite).** Greenberg 1980;
  Greenberg & Westcott 1983 (*Basic Group Processes* —
  indebtedness as a slow-decaying receiver-side state);
  Ross & Sicoly 1979 (egocentric availability — own
  contributions over-rehearsed); Emmons & McCullough 2003;
  Watkins, Woodward, Stone & Kolts 2003 (gratitude
  rehearsal retains benefits). Direction locked
  (`favor_sym_null`); split magnitudes HYPOTHESIS.
- **Coalition beats demographics.** Kurzban, Tooby &
  Cosmides 2001 (*PNAS* 98:15387 — who-said-what
  paradigm; ~4 min of live alliance cues deflates race
  categorization); Pietraszewski, Cosmides & Tooby 2014
  (*PLoS ONE* 9:e88534 — alliance regulation; sex/age
  persist). → `sided_with`/`sided_against` edges +
  `coal_cat_overwrite` re-sort of §11 sourceInfer;
  `coal_recolor_null` locked.
- **Beginnings dominate dyad history.** Buehlman, Gottman
  & Katz 1992 (*J. Fam. Psychol.* 5:295 — oral-history
  bond coding predicts 3-yr stability ~94%; how-we-met/
  courtship narration is the diagnostic content). →
  `relStartDay` + `rel_bump_win`/`rel_bump_gain` reusing
  bump + landmark machinery.
- **Noticed absence (composite HYPOTHESIS).** No direct
  study; composed of expectancy-violation encoding
  (§2.3/Stangor & McMillan) + exclusion-salience
  (§73/ostracism detection). `absence_ghost_null` is the
  defensible commitment — no manufactured co-presence.
- **Spotlight + retention overestimate.** Gilovich,
  Medvec & Savitsky 2000 (*JPSP* 78:211 — ~2× notice
  overestimate); Savitsky, Epley & Gilovich 2001 —
  audience memory overestimated. → self/observer decay
  split + `aud_recall_over`; `blunder_audit_null` keeps
  witnessed shame off the self channel.
- **Networks converge on central speakers.** Coman,
  Manier & Hirst 2016 (*PNAS* 113:8171 — convergence from
  dyadic alignment × topology); Yamashiro & Hirst 2020
  (*JEP:G* 149:1000 — central speakers amplify SS-RIF/
  practice when ingroup, attenuate when outgroup); Coman
  & Hirst 2015 (transitive propagation). →
  `central_speaker_mult` + `net_hop_decay`.
- **Dyad idioms.** Hopper, Knapp & Scott 1981 (*Comm.
  Monogr.* 48:23 — couples' personal idioms track
  intimacy); Bruess & Pearson 1997 (idioms decay with the
  relationship). → `idiom`/`dyad` locked cues +
  `idiom_orphan_loss` on dissolution.
- **Rival watch.** Schützwohl & Koch 2004 (*EHB* 25:249);
  Schützwohl 2005 (*EHB* 26:288 — infidelity-cue recall);
  2008 (*PAID* 44:633 — disengagement resistance,
  committed-relationship bound). Module claim contested —
  Harris 2000 (*JPSP* 78:1082). → encoding/disengagement
  only; `rival_certainty_null` locked.
- **Provenance flattening (composite HYPOTHESIS).**
  Bartlett 1932 leveling + §4 chain work + beta_source
  decay on embedded attribution stacks. `prov_upgrade_null`
  locked — flattening loses truth, never launders it.

## 47. Addendum — v70 anchors (formal-model VII, spec v5.18)

Machinery version — the sources below ground the *bounds*, not new
effects.

- **Combined loads degrade sub-additively.** Craik, Govoni,
  Naveh-Benjamin & Anderson 1996 (*Psychol Sci* 7:52 — age ×
  divided attention); Naveh-Benjamin, Craik, Guez & Kreuger 2000;
  Shields, Sazma, McCullough & Yonelinas 2017 (*Psych Bull*
  143:636 — 113-study stress × emotion retrieval meta). Every
  combined-manipulation result in the corpus shows bounded joint
  impairment — the sign behind the saturating-additive θ law;
  the tanh form itself is a modeling HYPOTHESIS.
- **Redundancy doesn't pay twice.** Tulving & Osler 1968
  (*JEP* 77:593) — the cue-combination precedent the gain-side
  noisy-OR reuses.
- **Context drifts.** Estes 1955 (*Psych Rev* 62:74 — stimulus
  fluctuation); Mensink & Raaijmakers 1988 (*J Math Psych*
  32:434 — context-drift model of forgetting); Howard & Kahana
  2002 (*J Math Psych* 46:269 — retrieved context). `ctx_tau`
  field-persistence is the retrieval-side analog.
- **Hedges communicate epistemic state.** Koriat & Goldsmith
  1996 (*Psych Rev* 103:490); Brennan & Williams 1995 (*J Mem
  Lang* 34:237 — listeners recover FOK from hedged speech);
  Brown 1991 (*Psych Bull* 109:204 — TOT phenomenology review);
  Smith & Clark 1993 (*JPSP* 65:186 — latency as access signal).
  Grounds the surfMap rows: hedge markers, TOT markers, and
  hesitation beats are *honest signals*, not decoration.
- **Fits must be able to fail.** Roberts & Pashler 2000 (*Psych
  Rev* 107:358); Gutenkunst et al. 2007 (*PLoS Comput Biol*
  3:e189 — sloppy directions). Warrant for the composition
  bounds and the §56 declaration gate.
- **Capacity note.** Miller 1956 (*Psych Rev* 63:81 — 7±2) —
  conservative basis for `att_span_ctx` ≈ 5 as a *cue-set*
  bound; flagged HYPOTHESIS (cue admission ≠ chunk capacity).

## 48. Addendum — v70 anchors (character-profiles VI, spec v5.19)

The narrator-compass layer: time perspective, narrative themes,
lesson-minting, coherence, chapter salience, future thickness,
anchor tension.

- **Time perspective is a stable trait.** Zimbardo & Boyd 1999
  (*JPSP* 77:1271 — verified): ZTPI five subscales
  (past-negative, past-positive, present-hedonistic,
  present-fatalistic, future), intercorrelations weak-to-
  moderate → five independent pins, not a simplex. Stolarski,
  Fieulaine & van Beek 2015 (Springer volume) consolidates the
  theory. The MEMORY-side mapping (arrival weighting by
  era/valence, future-reach scaling) is our HYPOTHESIS — ZTPI
  measures orientation, and orientation predicts what
  spontaneously arrives; we formalize the direction, not the
  effect size. D'Argembeau & Mathy 2011 (*J Cogn Psychol* 23 —
  verified): future-thinking frequency tracks goals — the
  tp_future → goal-rehearsal link.
- **Stories are ABOUT agency or communion.** McAdams 2001
  (*Rev Gen Psychol* 5:100 — verified) — the two thematic
  lines; McAdams & McLean 2013 (*Curr Dir Psychol Sci* 22:233 —
  verified) — narrative identity review. Adler 2012 (*JPSP*
  102:367 — verified): agency in narratives rose BEFORE
  wellbeing did across psychotherapy — agency is a narrative
  habit, not a mood readout. Adler, Lodi-Smith, Philippe &
  Houle 2016 (*PSPR* 20:142 — verified): narrative identity
  predicts wellbeing incrementally over Big Five traits —
  warrant for trait-level narr_* pins. The field-depth tuning
  mechanism is our HYPOTHESIS (attentional theming at encode).
- **Reasoning turns events into selves.** Pasupathi & Mansour
  2006 (*Dev Psychol* 42:798 — verified): self-event
  connections in narratives; McLean, Pasupathi & Pals 2007
  (*PSPR* 11:262 — verified): stories create selves and selves
  create stories; McLean & Thorne 2003 (*Dev Psychol* 39:635 —
  verified): self-defining memories yield lessons and insights.
  The `lesson` persSem subtype + `origin:"derived"` lock is
  our formalization — the literature says these connections
  are REVISIONS of self-knowledge, not new facts.
- **Coherence is a measurable property of told lives.** Reese
  et al. 2011 (*Memory* 19:688 — verified): causal-motivational
  + thematic coherence predict wellbeing. narr_coh_k models the
  link-minting side; the retrieval-route benefit is ours.
- **Lives vary in chapteredness.** Thomsen 2009 (*Memory* 17 —
  verified): life stories differ in number and closure of
  chapters; Brown 2016 transition theory (reused, §4.18).
  `period_sal` = the individual-difference formalization of
  the chaptered life.
- **Future imagination rides the episodic machinery.**
  Williams, Ellis, Tyers, Healy, Rose & MacLeod 1996 (*Memory*
  4:115 — verified): suicidal/depressed respondents produce
  generic futures AND generic pasts — specificity is ONE
  style → `epi_future_k` prior couples to vivid_detail/OGM.
  Schacter & Addis 2007 (*Phil Trans R Soc B* 362:773 —
  verified): constructive episodic simulation; Hassabis,
  Kumaran, Vann & Maguire 2007 (*PNAS* 104:1726 — verified):
  hippocampal amnesics cannot imagine coherent futures —
  grounding for `future_leak_null` (the channel that makes
  futures is episodic, and rich ≠ remembered).
- **Anchors carry tension.** Singer, Blagov, Berry & Oost 2013
  (*JPSP* 105:262 — verified): self-defining memories vary on
  tension; high-tension anchors predict distress. The
  intrusion-only mapping (tension raises re-access, never
  damages the record) is our HYPOTHESIS — Singer's tension
  correlates with rumination in the literature.
- **Established vs hypothesis summary:** ZTPI structure,
  agency/communion themes, lesson/self-event connections,
  coherence×wellbeing, chapter variation, past↔future
  specificity coupling, SDM tension — CONSENSUS/adjacent.
  Arrival weighting, field-depth tuning, lesson-as-persSem,
  link-mint rate, wall-scaling, prior formula, intrusion-only
  tension — all RW modeling HYPOTHESES on consensus bases.

## 49. Addendum — v71 anchors (validation-design IV; no spec bump)

This version's sources are methodological — they discipline the
*battery*, not the model. Consensus/hypothesis split explicit.

- **Retrieval is an intervention — CONSENSUS.** Roediger &
  Karpicke 2006 (*Psych Sci* 17:249 — verified): testing beats
  restudy; Rowland 2014 (*Psych Bull* 140:1432 — verified):
  meta-analysis, d ≈ 0.5 vs restudy. Consequence for the
  harness (VA-MEAS): every recall a probe orders changes the
  thing measured → `measure_budget`, destructive sampling,
  measured-vs-unmeasured twin arms (P757–P759). Our modeling
  choice is the budget discipline itself, not the effect.
- **Misinformation dose is controlled, not ambient —
  CONSENSUS.** Loftus, Miller & Burns 1978 (verified): the
  paradigm's authority rests on a *known* misleading-item dose.
  Harness discussants are rumor sources → declared dose +
  dose-monotonicity probe (P760). The interlocutor-as-agent
  framing is our formalization.
- **Conditioning on retrieval is collider selection —
  CONSENSUS (methodological).** Elwert & Winship 2014 (*Annu
  Rev Sociol* 40:31 — verified). Denominators = encoded
  manifest; `retrieved_frac` co-reported; the
  accuracy|retrieved > accuracy signature (P762) is our
  diagnostic — its logic (selection on strength is what makes
  the signature exist) is standard selection-bias reasoning
  applied to the sim.
- **"Not significant" is not "absent" — CONSENSUS.** Lakens
  2017 (*Soc Psychol Personal Sci* 8:355 — verified): TOST/
  SESOI equivalence testing; Button et al. 2013 (*Nat Rev
  Neurosci* 14:365 — verified): median power ~20% →
  underpowered nulls are noise. VA-MDE makes null claims carry
  TOST; P616 → P616v2 under §110 versioning.
- **Analyst choice is a variance source — CONSENSUS.**
  Silberzahn et al. 2018 (*Adv Methods Pract Psychol Sci*
  1:337 — verified): 29 teams, same data, divergent answers.
  Steegen et al. 2016 (*Persp Psychol Sci* 11:702) multiverse;
  Simonsohn, Simmons & Nelson 2020 (*Nat Hum Behav* 4:1208 —
  verified) specification curve. VA-MULTI applies this to our
  OWN analyzers plus the §107 sloppy ensemble.
- **Anchors carry populations — CONSENSUS.** Henrich, Heine &
  Norenzayan 2010 (*BBS* 33:61 — verified): WEIRD samples;
  Simons, Shoda & Lindsay 2017 (*Persp Psychol Sci* 12:1123 —
  verified): constraints on generality; Yarkoni 2020 (*BBS*
  45:e1 — verified): verbal claims outrun statistical support.
  → `pop_scope` on every anchor; transported bands, never
  untransported MUSTs (P767).
- **Children are more suggestible — CONSENSUS (direction).**
  Ceci & Bruck 1993 (*Psych Bull* 114:403); Bruck & Ceci 1999
  (*Psychol Public Policy Law* 5:136 — verified). P768 asserts
  the direction on a transported band; the magnitude is our
  modeling choice.
- **Established vs hypothesis summary:** testing effect, dose
  control, collider bias, TOST discipline, analyst variance,
  WEIRD/CoG limits, child suggestibility direction — all
  established methodology/consensus. The harness mechanics
  (measure_budget field, twin-arm self-calibration, sloppy-
  ensemble pass_frac gate, spec-curve demotion rule,
  transported-band widening formula) are RW HYPOTHESES —
  engineering choices on consensus bases.

## 50. Addendum — v72 anchors (encoding-mechanics VI, spec v5.20)

- **Value directs encoding; scarcity sharpens it — CONSENSUS.**
  Castel, Benjamin, Craik & Watkins 2002 (*Psychol Aging* 17:209 —
  verified): older adults match young on high-value items despite
  lower overall recall — selectivity compensates. Castel, Balota &
  McCabe 2009 (*JEP:A* 35:916 — verified): disproportionate
  high-value study-time allocation. **Moderator — ESTABLISHED:**
  older-adult selectivity FAILS when high-value material is
  intrinsically hard to encode (Psych. Aging 2025, verified
  abstract) — routing strategies need self-initiation, so the
  rescue degrades exactly where it's needed. → `value_rank_w` +
  `select_sharp` + `value_mem_gate` (§71).
- **Choice potentiates — ESTABLISHED.** Murty, DuBrow & Davachi
  2015 (*J Neurosci* 35:6255 — verified): opportunity-to-choose
  improves declarative memory even with content-unlinked
  memoranda; striatal-hippocampal anticipation mechanism. Murty
  2019 (*J Cogn Neurosci* — verified): consolidation leg —
  reduced forgetting rate. → `choice_enc_gain`/`choice_beta_mult`
  (§72), scope-locked to chosen content.
- **Errorful learning's moderator is error TYPE — ESTABLISHED,
  correcting the clinical cliché.** Cyr & Anderson 2015
  (*JEP:LMC* — verified): conceptual guesses ("stepping stones")
  help BOTH ages; arbitrary guesses hurt. 2012 (*Psychol Aging* —
  verified): conceptual errorful boosts source memory, older ≥
  younger. The Baddeley & Wilson 1994 / Kessels 2003 errorless-
  advantage story holds for impaired encoders on arbitrary
  material. → `guess_kind` split, `errful_mediator_gain`,
  `errful_arb_loss`, `errful_noise` (§73).
- **Saying-is-believing — CONSENSUS effect, the GATE is the
  finding.** Higgins & Rholes 1978; Echterhoff, Higgins & Groll
  2005 (*JPSP* 89:257 — verified: shared-reality required, ingroup
  audiences only, epistemic trust mediates); Echterhoff et al.
  2008 (*JEP:G* 137:3 — verified: politeness/incentive/entertain-
  ment/compliance motives → tuned message, ZERO memory drift);
  EJSP 2024 meta (verified). → `sib_drift`/`sib_trust_w` (§74),
  locked `sib_polite_null`.
- **Observed encoding is a real middle tier — ESTABLISHED,
  boundary DEBATED.** Roberts et al. 2022 comparator g≈0.9 vs
  enactment; Jaroslawska et al. 2016 (*M&C* 44:1183 — verified:
  observation ≈ enactment for instruction recall); Steffens &
  von Stülpnagel 2015 (verified: design-dependent). →
  `obs_enc_gain`/`obs_intent_mult` (§75); no motor-channel
  exemptions.
- **Face distinctiveness — CONSENSUS; attractiveness is a NULL.**
  Light, Kayra-Stuart & Hollander 1979 (*JEP:HLM* 5:212 —
  verified); Vokey & Read 1992 (verified: distinctiveness
  mediates); Wickham & Morris 2003 (verified: attractiveness
  partials out). → `face_dist_gain` (§76), locked
  `attract_recog_null`.
- **Secrets preoccupy more than they conceal — ESTABLISHED
  direction.** Slepian, Chun & Mason 2017 (*JPSP* 113:1 —
  verified: mind-wandering ≈2× concealment across >13,000
  secrets); Lane & Wegner 1995 (suppression hyperaccessibility).
  → secrets join the pending set (§77): `secret_load_mult`,
  `secret_heat_mult`.
- **Alcohol retrograde facilitation — DEBATED, interference-
  account form kept at OBSERVE.** Parker et al. 1980/81
  (verified); Mueller, Lisman & Spear 1983 (verified:
  interference > consolidation); Quevedo-Pütter & Erdfelder 2022
  (verified prereg replication: recall null, retrieval benefit).
  → `intox_retro_shield` as interference-shield only; locked
  `retro_consol_null` + frozen `retro_scope:"pre-only"` (§78).
- **Established vs hypothesis summary:** all nine mechanism
  directions above are established or better; the GATES (motive,
  deficit, scope) are where the literature's load-bearing detail
  lives and all are honored structurally. The sim-level weights
  (drift rates, multipliers, cap sharing) are RW HYPOTHESES —
  calibration on consensus bases.

## 51. Addendum — v73 anchors (forgetting-curves VII, spec v5.21)

- **The tier below the record — CONSENSUS, textbook.** Sperling
  1960 (iconic ~0.25–1s); Darwin, Turvey & Crowder 1972 (*Cogn.
  Psychol.* 3:255 — echoic ~2–4s); Peterson & Peterson 1959
  (*JEP* 58:193 — ~18s unrehearsed); Keppel & Underwood 1962
  (*JVL* 1:153 — the short-term "decay" is proactive interference:
  trial 1 barely decays). Waugh & Norman 1965 (duplex frame).
  → §4.34 `stim` ghost tier (`stim_E`/`stim_hl`/`stim_recall_p`/
  `stim_cap`), locked `stim_mint_null`. Ghost mechanics are our
  reduced form — magnitudes HYPOTHESIS.
- **Frequency is reconstructed, not counted — CONSENSUS.**
  Hasher & Zacks 1979 (*JEP:G* 108:356 — automatic frequency
  encoding); Greene 1984; Williams & Durso 1986 (*JEP:LMC* 12:165);
  Tversky & Kahneman 1973 (availability lift). → §5.66
  `freqRecall` (coverage-weighted count + schema prior +
  `avail_freq_k`).
- **The listener is a decay variable — ESTABLISHED (one group,
  three studies).** Pasupathi, Stallworth & Murdoch 1998
  (*Discourse Processes* 26:1 — attentive vs distracted vs
  no-retell); Pasupathi & Rich 2005 (*J. Personality* 73:1051);
  Pasupathi & Hoyt 2010 (*Memory* 18:185 — 1-month retention and
  consistency drop under distracted listening). → `aud_resp` on
  retells (`aud_resp_distract` 0.3); elaboration-mediation is
  their framework.
- **Two heads recall less than their parts — CONSENSUS meta.**
  Weldon & Bellinger 1997 (*JEP:LMC* 23:1160); Basden, Basden,
  Bryner & Thomas 1997 (*JEP:LMC* 23:626 — retrieval-strategy
  disruption); Marion & Thorley 2016 (*Psych. Bull.* 142:1141 —
  75 effects: inhibition robust; 27 effects: post-collaborative
  benefit). → §5.67 `jointRecall` (`collab_inhib` 0.8,
  `postcollab_gain` 0.1); magnitudes ours.
- **Confidence decays slower than content — CONSENSUS direction.**
  Sauer, Brewer, Zweck & Weber 2009 (*Law Hum. Behav.* 34:337 —
  delay → overconfidence); Odinot & Wolters 2006 (*ACP* 20:973);
  Odinot, Wolters & Lavender 2009 (*ACP* — repeated questioning
  inflates conf on correct and incorrect alike). → conf channel
  β·`conf_beta_mult` 0.6; locked `conf_feed_null`.
- **The spacing illusion — CONSENSUS.** Kornell & Bjork 2008
  (*Psych. Sci.* 19:585 — massed judged better even after
  contrary performance); Son 2004; Toppino & Cohen 2009
  (*JEP:LMC* 35:1352 — dishonored spacing attenuates). → locked
  `spacing_opt_null`: no lag-scheduled retells; deliberate
  self-rehearsal is massed.
- **Remembered duration — CONSENSUS direction.** Ornstein 1969
  (storage-size); Block & Reed 1978 (contextual change); Block &
  Zakay 1997 meta; Avni-Babad & Ritov 2003 (*JEP:G* 132:543 —
  routine paradox). → §5.68 `recallDuration` (`dur_ev_w`,
  `dur_trans_w`) — report-side, the retrospective mirror of t_eff.
- **Weekday schema — CONSENSUS phenomenon.** Huttenlocher, Hedges
  & Prohaska 1988 (*Psych. Rev.* 95:471 — hierarchical
  ordered-domain estimation, midward regression); Huttenlocher,
  Hedges & Bradburn 1990 (*JASA*). → §6.15 `dow_snap`.
- **Established vs hypothesis summary:** all eight directions are
  consensus or better; every magnitude is an RW fit flagged
  HYPOTHESIS. Probes P779–P786 (3–4 MUST, 4 SHOULD — see
  validation-design §146).

## 52. Addendum — v74 anchors (retrieval-cues VII, spec v5.22)

- **Retrieval mode (§5.69):** the cue lands in a frame.
  `orient ∈ {episodic, semantic}` is set by phrasing — "remember
  when" vs "do you know" — and changes what the same cue can
  return (scene detail vs gist; TOT reachable only episodic).
  Tulving 1983's ecphory triad; Herron & Rugg 2003; Rugg &
  Wilding 2000. [CONSENSUS existence; binary gate HYPOTHESIS.]
- **Cue valence (§5.70):** cues carry their own valence
  (`w_valcue` 0.15 — weak); mood still beats cue. The vulnerable
  arm: negative cue → overgeneral answer for neurot/depr-high
  profiles (Williams & Broadbent 1986). [CONSENSUS direction.]
- **Conjunctive cues (§5.71):** ecphory's algebra is
  interactive — `config_gain` priced by JOINT fan means "the
  place AND the person" retrieves what neither alone can. Locked
  `config_oracle_null`: conjunction counts encoded fields only.
  Watkins 1979; Tulving 1983; Rubin & Wallace 1989.
- **Event clusters (§5.72):** the autobiographical chunk is a
  causal bundle (`evClust`), not a clock span — cluster-mates
  surface together and date worse. Brown & Schopflocher
  1998a/b; Brown 2005; Brown, Shevell & Rips 1986.
- **Burst emission (§5.73):** recall arrives in pulses riding
  reinstated context — `pulse` index marks the steering points
  where a listener's cue can redirect the next vein.
  Gruenewald & Lockhead 1980; Barsalou 1988.
- **Analogical reminding (§5.74):** structural similarity
  re-orders but never creates candidates (surface gate —
  Gentner, Rattermann & Forbus 1993); pure-structural
  remindings are rare (`reminder_chance` 0.03) and flagged
  `reminding:true`. Wharton et al. 1994; Schank 1982.
- **Contextual cuing (§5.75):** `ctxcue` — record-free
  configural competence, age-flat (Howard et al. 2004),
  hippocampus-dependent (Chun & Phelps 1999). The ambient
  tier's habit memory and the spared floor of degraded
  episodic profiles. Chun & Jiang 1998.
- **The give-up rule (§5.76):** bouts end on a metacognitive
  bet — `search_budget` scales with FOK_running; exhaustion
  emits `giveUp:{fok}`; high-fok terminations arm
  `fok_reprobe` — the "it came to me later" event is emergent.
  Koriat 1993; Costermans et al. 1992; Singer & Tiede 2008;
  Nelson & Narens 1990.
- Probes P787–P794: 5 MUST (mode gating, conjunctive cue,
  cluster two-arm, record-free ctxcue, metacognitive quitting)
  + 3 SHOULD. All magnitudes RW HYPOTHESES; all directions
  established.

## 53. Addendum — v75 anchors (age-development VII, spec v5.23)

- **Infant context dependence:** Butler & Rovee-Collier 1989
  (*JEP:LM&C* 15 — verified: context/crib-liner change abolishes
  retention at 3 months); Rovee-Collier & Shyi 1992; Hayne &
  Findlay 1995 (context-shift cost falls across infancy).
  Anchors `ctx_locked`/`ctx_strict` (§4.35a/§5.77a); the
  lifetime persistence of the flag is the flagged extension.
- **Controlled vs automatic inhibition in development:**
  Harnishfeger & Pope 1996 (*J. Exp. Child Psychol.* 62:292 —
  verified: DF absent 1st grade, reduced 3rd, intact 5th);
  Wilson & Kipp 1998 (*Dev. Rev.* 18:86 — verified review);
  Aslan, Staudigl, Samenieh & Bäuml 2010 (*PBR* 17:784 —
  verified production-deficiency account); Zellner & Bäuml 2004.
  Anchors `df_store_onset`/`df_gate`/`df_gate_ramp` (§6.152a).
- **Child suppression of false content:** Howe 2005 (*Psychol.
  Sci.* 16 — verified: children suppress DRM false recall under
  directed-forget cues where adults do not — output-gated gist).
  Anchors `df_gist_gate` (§6.152a).
- **RIF intact early — the version's null:** Zellner & Bäuml
  2005 (*Mem&Cogn.* 33:396 — verified: retrieval inhibition and
  part-list cuing intact in children); Ford, Keating & Patel
  2004 (*Br. J. Dev. Psychol.* 22:585 — verified: adult-
  magnitude RIF at 7). Result: NO child rif ramp (J9).
- **Working memory & event completeness:** Gathercole,
  Pickering, Knight & Stegmann 2004 (*JEP:G* 133 — verified span
  norms); Jones & Pipe 2002 (children's event recall
  completeness 5→9). Anchors `field_budget` (§4.35b).
- **Adolescent forward drift:** Peterson, Grant & Boland 2005;
  Peterson, Warren & Short 2011 (*Memory* 19 — verified:
  earliest-memory age advances across childhood); Habermas &
  de Silveira 2008 (life-narrative reorganization). Anchors
  `reorg_dip`/`reorg_attrit` (§5.77a).
- **Time-based prospective memory:** Ceci & Bronfenbrenner 1985
  (*Dev. Psychol.* 21 — verified: strategic clock monitoring
  develops through middle childhood); Kvavilashvili, Kyle &
  Messer 2008 (verified review — event-based early, time-based
  late). Anchors `pmt_*` child knots + `pm_clock_p` (§5.77b).
- **Joint reminiscing / child-as-narrator:** Reese, Haden &
  Fivush 1993 (*Cog. Dev.* 8 — verified); Welch-Ross 1997;
  Fivush, Haden & Reese 2006; Reese & Newcombe 2007
  (longitudinal — verified). Anchors `self_reminisce_gain` +
  `reminisce_env` rerouting (§6.152b).
- **Intentional-encoding instruction:** Baker-Ward, Ornstein &
  Holden 1984 (*J. Exp. Child Psychol.* — verified: children
  gain more from remember-instructions). Anchors
  `intent_boost` (§4.35c).
- **Enactment in children:** Ratner, Smith & Dionne 1991;
  Cohen 1981 (SPT robust ≥3–4). Anchors `er_4y`/`er_10y`
  (§4.35d — completes the U with age-decline §85's old knots).

## 54. Addendum — v76 anchors (age-decline VII, spec v5.24)

All verified via web this version. Sources behind Part VII of
`age-decline.md` (§§96–105), spec §§4.36/5.78/6.153, probes
P805–P814:

- **Trajectory heterogeneity:** Josefsson, de Luna, Pudas,
  Nilsson & Nyberg 2012 (*J. Am. Geriatr. Soc.* 60:2308 —
  verified: Betula N=1,558, 15y episodic trajectories —
  18% maintainers, 68% average, 13% decliners; education,
  physical activity, partnered, female → maintain; APOE ε4,
  male, not-in-labor-force → decline); Pudas et al. 2013;
  Betula 23–28y dementia-risk follow-up (*Int. Psychogeriatr.*
  — verified: decliners ~4× dementia risk, maintainers ~2.6×
  reduced, divergence begins 10–15y pre-diagnosis). Anchors
  `traj` draw + `maint_slope_mult`/`decl_accel` (§4.36a).
- **Intraindividual variability as leading indicator:**
  Hultsch, MacDonald & Dixon 2002; MacDonald, Nyberg &
  Bäckman 2006; Lövdén, Li, Shing & Lindenberger 2007
  (*Neuropsychologia* — verified: within-person RT
  variability precedes and predicts 13y decline, Berlin
  Aging Study ages 70–102); longitudinal meta-analysis
  r≈.20 CI[.09,.31] (verified). Anchors `iiv_age_slope` +
  `iiv_lead` (§5.78a).
- **Subjective cognitive decline:** Jessen et al. 2014
  (*Alzheimers Dement.* 10:844 — verified: SCD-I framework —
  self-experienced decline, unimpaired objective tests, first
  symptomatic preclinical stage; SCD-plus feature list).
  Anchors `scd_lead` complaint-channel leg (§5.78b).
- **Mental retirement:** Rohwedder & Willis 2010 (*JEP*
  24:119 — verified: cross-national IV design via pension
  policy, early retirement causally lowers early-60s
  cognition; magnitude/mechanism DEBATED by authors);
  Bonsang, Adam & Perelman 2012. Anchors `retire_rate`,
  `retire_cap`, `engage_sub_recover`, `retire_retrieval_null`
  (§4.36b).
- **Walking dual-task:** Lindenberger, Marsiske & Baltes
  2000 (*Psych. & Aging* 15:417 — verified: memorizing while
  walking, dual-task cost d≈0.98 middle / d≈1.47 old;
  sensorimotor control demand account). Anchors `loco_tax`,
  `loco_pm_pen`, `loco_yield` (§4.36c — knots halved vs lab,
  street-vs-track correction, flagged).
- **Allocentric navigation decline:** Wiener, de Condappa,
  Harris & Wolbers 2013 (*J. Neurosci.* 33:6012 — verified:
  same-direction route recall intact, novel-direction rejoin
  fails, persistent beacon strategy, no allocentric shift
  across 6 sessions); Head & Isom 2010; Moffat & Resnick
  2002; Wiener et al. 2012 route repetition vs retracing.
  Anchors `allo_mint_p`, `ego_dir_pen`, `nav_permastore_null`
  (§§4.36d, 5.78c).
- **Implicit/procedural preservation:** Fleischman, Wilson,
  Gabrieli, Bienias & Bennett 2004 (*Psych. & Aging* 19:617
  — verified longitudinal: explicit declines, priming stable
  over 4 annual waves); Mitchell, Brown & Murphy 1990;
  La Voie & Light 1994 meta. Anchors `proc_age_null` +
  min(age_eff,55) floor (§5.78d).
- **Observation inflation in aging:** Lindner, Echterhoff,
  Davidson & Brand 2010 (*Psych. Sci.* 21:1291 — verified:
  observed action → false self-performance memory, warning-
  immune); Lindner, Davidson & Echterhoff 2014 (*Aging
  Neuropsychol. Cogn.* — verified: equal error rate, prone
  elders larger magnitude, true-action observation benefit
  LARGER in old). Anchors `obs_infl_age`, `obs_tail_k`,
  `obs_old_gain` (§6.153a).
- **Autobiographical detail mix:** Levine, Svoboda, Hay,
  Winocur & Moscovitch 2002 (*Psych. & Aging* 17:677 —
  verified: Autobiographical Interview — older adults fewer
  internal/episodic, more external/semantic details,
  persists under probing); AI meta-analysis 2023 (gbad077 —
  verified: moderate healthy-aging effect, larger MCI/AD);
  James et al. 1998 (old narrations judged more
  interesting). Anchors `ie_shift`, `ext_gain` (§5.78c).
- **Established vs hypothesis summary:** all directions and
  dissociations CONSENSUS (class heterogeneity, IIV
  precedence, SCD-as-first-symptom, retirement direction,
  dual-task growth, allo→ego shift, priming stability,
  inflation rate-flat/magnitude-up, I/E shift). All
  magnitudes, the lead times, trait-draw weights, nav_mode
  operationalization, the 55 freeze, and `stack_cap` are RW
  HYPOTHESES — `stack_cap` is bookkeeping, not a finding.

## 55. Addendum — v77 anchors (emotional-memory VII, spec v5.25)

Ten new emotional-memory mechanisms, each anchored to verified
literature; probe registry P815–P824:

- **Gratitude (P815):** McCullough, Kilpatrick, Emmons & Larson
  2001 (*Psych. Bull.* 127:249 — moral-barometer/motive account);
  Bartlett & DeSteno 2006 (*Psych. Sci.* 17:319 — verified:
  gratitude-mediated costly helping toward the benefactor);
  Algoe 2012 (find-remind-bind). Anchors `grat_gain`,
  `grat_fade_resist`, `reciprocate` emission (§6.154).
- **Co-rumination (P816):** Rose 2002 (*Child Dev.* 73:1830 —
  verified: co-rumination predicts friendship quality AND
  internalizing symptoms); Rose, Carlson & Waller 2007 (*Dev.
  Psychol.* 43:1019 — verified prospective bidirectional);
  Rose & Rudolph 2007 developmental review (adolescent onset,
  girls > boys). Anchors `corumin_*` + `solved:true` escape
  (§6.155).
- **Directed self-distancing (P817):** Ayduk & Kross 2010
  (*JPSP* 99:809 — verified: spontaneous distancing → lower
  reactivity + intrusive ideation, reconstruing-not-avoidance
  mediation); Kross & Ayduk 2008/2011 distanced-analysis program.
  Anchors `dist_cool`, `reflect.mode`, `dist_avoid_null`
  (§6.156).
- **Humor reappraisal (P818):** Kugler & Kuhbandner 2015
  (*Neuropsychologia* 62:357 — verified: humorous reappraisal
  maximally reduces amygdala response AND impairs later memory
  for the negative content); Samson & Gross 2012; Strick et al.
  2009 (intensity ceiling). Anchors `humor_reapp_k`,
  `humor_replay_k`, trait `humor` (§6.157).
- **Hot–cold read (P819):** Nordgren, van der Pligt & van
  Harreveld 2006 (*Psych. Sci.* 17:635 — verified: cold-state
  underestimation of past visceral influence, self+other,
  correction-resistant); Nordgren et al. 2007 (*JPSP* 93:75 —
  verified: state-specific, applies to self-judgments);
  Loewenstein 2005. Anchors `hotcold_k`, `cold_read`,
  `hotcold_store_null` (§6.158).
- **Threat detection priority (P820):** Williams, Watts,
  MacLeod & Mathews 1997 (the anxiety=detection/depression=
  elaboration split); Bishop 2007 (*Nat. Neurosci.* 10:307 —
  verified review); Mathews & MacLeod 2005. Anchors
  `threat_cue_gain`, `threat_hold`, `anx_eff`, depr exclusion
  (§6.159).
- **Positive broadening (P821):** Rowe, Hirsh & Anderson 2007
  (*PNAS* 104:383 — verified: remote associates + flanker
  breadth); Fredrickson & Branigan 2005; Isen, Daubman &
  Nowicki 1987. Anchors `broaden_k`, `broaden_store_null`
  (§6.160).
- **Disgust extinction asymmetry (P822):** Olatunji, Forsyth &
  Cherian 2007 (*J. Anxiety Disord.* 21:820 — verified: sticky,
  resistant); Engelhard, Leer, Lange & Olatunji 2014 (*Behav.
  Therapy* 45:708 — verified: extinction fails,
  counterconditioning works); Bosman, Borg & de Jong 2016;
  Olatunji, Tomarken & Puncochar 2013 (*Emotion* 13:881 —
  propensity potentiates learning). Anchors `dis_extinct_mult`,
  `dis_cc_mult`, `disg_prop` (§6.161).
- **Mood-repair recall (P823):** Josephson, Singer & Salovey
  1996 (*Cogn. & Emot.* 10:437 — verified: incongruent-positive
  second recall, self-reported repair intent); Rusting & DeHart
  2000 (*JPSP* 78:737 — verified trait gating); Joormann &
  Siemer 2004 (*J. Abnorm. Psychol.* 113:179 — verified
  dysphoric failure). Anchors `repair_*`, `repair_dep_null`
  (§6.162).
- **Felt vs believed (P824):** Robinson & Clore 2002 (*Psych.
  Bull.* 128:934 — verified accessibility model: episodic for
  recent, belief-reconstruction beyond ~2 weeks); Levine & Safer
  2002. Anchors `felt_window`, `felt_believed_gap`,
  `felt_write_null` (§6.163).
- **Established vs hypothesis summary:** directions and
  dissociations all CONSENSUS; magnitudes, age knots, trait
  composites (`disg_prop`, `anx_eff`), window constants, and
  all field/mixin operationalizations are RW HYPOTHESES.

## 56. Addendum — v78 anchors (false-memory VII, spec v5.26)

Nine credibility-layer mechanisms; probe registry P825–P834:

- **Sleeper effect (P825):** Hovland & Weiss 1951 (*J. Abnorm.
  Soc. Psychol.* 46:424 — verified: dissociation hypothesis);
  Pratkanis, Greenwald, Leippe & Baumgardner 1988 (*Psych.
  Bull.* 104:53 — verified: AFTER-ordering requirement);
  Kumkale & Albarracín 2004 (*Psych. Bull.* 130:143 — verified
  meta). Anchors §6.164 `disc_decay_mult`, `sleeper_k`,
  `sleeper_grow_null`.
- **Warning backfire (P826):** Skurnik, Yoon, Park & Schwarz
  2005 (*J. Consum. Res.* 31:713 — verified: repeated "false"
  labels → "true" endorsements after 3-day delay, older
  adults worst); Hawkins & Hoch 1992; Hasher et al. 1977
  companion fluency line. Anchors §6.165 `warn_tag_mult`,
  `warn_backfire_k`, `frame_content_null`.
- **Spinozan acceptance (P827):** Gilbert, Krull & Malone
  1990 (*JPSP* 59:601 — verified); Gilbert, Tafarodi & Malone
  1993 (*JPSP* 65:221 — verified); Gilbert 1991 (*Am.
  Psychol.* 46:107 — verified); Hasson, Simmons & Todorov
  2005 (boundary caveat). Anchors §6.166 `spinoza_cost`,
  `load_unbelieve_pen`, `spinoza_revert_null`.
- **Illusory truth (P828):** Hasher, Goldstein & Toppino 1977
  (*JVLVB* 16:107 — verified); Fazio, Brashier, Payne & Marsh
  2015 (*JEP:G* 144:993 — verified: knowledge doesn't
  protect); Pennycook, Cannon & Rand 2018 (*JEP:G* 147:1865 —
  verified: single-exposure lift on fake news); Begg, Anas &
  Farinacci 1992 (*JEP:G* 121:446 — fluency mechanism).
  Anchors §6.167 `illus_truth_k/cap`, `knowledge_gate_null`,
  `factCheck_halve`.
- **Hindsight (P829):** Fischhoff 1975 (*JEP:HPP* 1:288 —
  verified); Fischhoff & Beyth 1975; Hoffrage, Hertwig &
  Gigerenzer 2000 (*JEP:LMC* 26:566 — verified RAFT);
  Roese & Vohs 2012 (*Persp. Psychol. Sci.* 7:411 — verified
  three-level account). Anchors §6.168 `hind_k`,
  `hind_conf_boost`, `hind_store_null`.
- **Innuendo/presupposition (P830):** Wegner, Wenzlaff,
  Kerker & Beattie 1981 (*JPSP* 41:67 — verified:
  interrogative ≈ assertion for impressions); Loftus & Zanni
  1975 (*Cogn. Psychol.* 7:560 — verified: the/a article
  presupposition ~2× false-object rate). Anchors §6.169
  `insinu_strength`, `presuppose_gain`, `insin_episode_null`.
- **Planting recipe (P831–P832):** Shaw & Porter 2015
  (*Psych. Sci.* 26:291 — verified: 70% rich false crime
  memories/beliefs in 3 interviews); Wade, Garry & Pezdek
  2018 (*Psych. Sci.* 29:503 — verified recode: 26–30%
  recollection-grade — belief/memory split encoded);
  Loftus & Pickrell 1995 (*Psych. Ann.* 25:720 — ~25% mall);
  Ceci, Loftus, Leichtman & Bruck 1994 (Samuel Stone —
  ~50% preschooler assent). Anchors §6.170 `plant_*`,
  `scaffold_unit`.
- **Déjà vu (P833):** Brown 2003 (*Psych. Bull.* 129:394 —
  verified review); Cleary 2008 (*Curr. Dir. Psychol. Sci.*
  17:353 — verified: recognition without identification);
  Cleary et al. 2012 (*Conscious. Cogn.* 21:969 — verified
  VR config familiarity). Anchors §6.171 `deja_*`.
- **Source poison (P834):** forward credibility discounting
  established (Hovland line; Kumkale & Albarracín 2004;
  retraction/correction literature); the retroactive
  sibling-weakening leg is RW HYPOTHESIS. Anchors §6.172
  `source_poison_k`, `poison_radius`, `poison_reveal_null`.
- **Established vs hypothesis summary:** all directions and
  dissociations CONSENSUS (incl. the Fazio knowledge-failure
  and the Wade belief/memory recode); magnitudes, age
  increments, promotion shares, the retro-poison leg, and
  all field mechanizations are RW HYPOTHESES.

## 57. Addendum — v79 anchors (individual-differences VII, spec v5.27)

Sources backing Part VII of `individual-differences.md`
(§§77–86) and probes P835–P846.

- **Monitoring-blunting (§77):** Miller 1980 (the MBS
  construct); Miller & Mangan 1983. CONSENSUS that the
  coping-style dimension exists and is bipolar-ish; our
  bipolar single-axis reading vs two separable subscales is
  a simplification flagged in §91.
- **Immigration bump (§78):** Schrauf & Rubin 1998 (*JML*
  39:437 — verified this pass: bump follows immigration
  age; ~20% of memories recalled internally in the
  non-session language, partitioned by migration);
  Schrauf & Rubin 2000 (*ACP* — bump-era memories not more
  detailed/emotional: distribution, not tagging).
  CONSENSUS relocation; window-width fit HYPOTHESIS.
- **Transactive memory (§79):** Wegner 1987; Wegner, Erber
  & Raymond 1991 (*JPSP* 61:923 — verified: natural couples
  beat impromptu pairs without structure, lose WITH
  assigned structure); Weldon & Bellinger 1997 (*JEP:LMC*
  23:1160 — verified collaborative inhibition + group
  stability). orphan_recall = RW HYPOTHESIS formalizing
  bereavement reports.
- **Cognitive offloading (§80):** Sparrow, Liu & Wegner
  2011 (*Science* 333:776 — verified: access expectancy →
  lower content recall, higher where-recall); Risko &
  Gilbert 2016 (*TiCS* 20:676); Henkel 2014
  (point-and-shoot impairment). First-lookup no-rehearsal
  rule is RW HYPOTHESIS.
- **Consolidation yield (§81):** Gais, Mölle, Helms & Born
  2002; Schabus et al. 2004 — spindle/yield individual
  differences. CONSENSUS direction; the two-multiplier
  mechanization flattens sleep-stage physiology.
- **Navigation ability (§82):** Coutrot et al. 2018
  (*Curr. Biol.* — Sea Hero Quest, ~2.5M); Coutrot et al.
  2022 (*Nature* — verified, N=397,162, rural advantage +
  street-entropy topology match). navab_interf_k DEBATED.
- **Schizotypy (§83):** Peters et al. 2007 (*J. Nerv.
  Ment. Dis.* — verified: imagined→performed confusions,
  WMC controlled); Larøi et al. 2005; 2022 SM meta (44
  studies — internal-SM/imagined-stimuli impairment);
  Steel et al. 2005 (intrusion vulnerability).
- **Hypnotizability (§84):** Heaps & Nash 1999 (*Psychon.
  Bull. Rev.* — verified: inflation ~ hypnotic
  suggestibility + dissociativity, NOT interrogative
  suggestibility); Barnier & McConkey 1992; Sheehan et al.
  1991; Wagstaff sociocognitive counterline (verified —
  accuracy-framed highs MORE resistant). DEBATED overall;
  hence the context lock.
- **Mnemonic training (§85):** Maguire et al. 2003; Dresler
  et al. 2017 (*Neuron* 93:1227 — verified 6-week durable
  gain); Wagner et al. 2021 (*Sci. Adv.* 7:eabc7606 —
  verified durability leg).
- **Bilingual TOT (§86):** Gollan & Acenas 2004 (*JEP:LMC*
  30:246 — verified: more TOTs on noncognates, cognate
  rescue, per-language activation mechanism); Gollan &
  Silverberg 2001.

## 58. Addendum — v80 anchors (social-memory VIII, spec v5.28)

Sources backing Part VIII of `social-memory.md` (§§111–120)
and probes P847–P858.

- **Own-name capture (§111):** Cherry 1953 (selective
  listening — unattended channel yields ~nothing, the null
  that anchors `name_memory_null`); Moray 1959 (~33% name
  detection in ignored channel); Wood & Cowan 1995
  (*JEP:G* 124:243 — verified this pass: **34.6%** detected
  under proper controls, attention shifts limited to ~2
  items post-name, NO indirect memory for unattended
  phrases); Conway, Cowan & Bunting 2001 (low-WMC detects
  MORE — the filter leaks where it is weakest).
  CONSENSUS effect + rate; channel-capture mechanics RW.
- **Secret preoccupation (§112):** Slepian, Chun & Mason
  2017 (*JPSP* 113:1–33 — verified: >13,000 secrets;
  mind-wandering roughly doubles concealment frequency and
  is the leg that predicts harm); Slepian, Kirby &
  Kalokerinos 2020 (*Emotion* — verified: shame-appraised
  secrets intrude more, guilt-appraised less); Liu,
  Kalokerinos & Slepian 2023 (*PSPB* — appraisal
  replication); Slepian, Camp & Masicampo 2015 (*JEP:G*
  144:e31 — secrecy burden; mechanism citation only).
  CONSENSUS on intrusion>concealment and the shame/guilt
  split; per-day intrusion rate mapping is RW HYPOTHESIS.
- **Endorsement transfer / vouching (§113):** De Houwer,
  Thomas & Baeyens 2001 (*Psych Bull* 127:853 —
  evaluative conditioning meta, ~d=0.35). The
  spillover-across-association leg is CONSENSUS;
  transitive *credibility* transfer and the one-hop cap
  are RW composites (trust-transitivity literature is
  formal, not behavioral).
- **Exchange vs communal ledgers (§114):** Clark & Mills
  1979 (*JPSP* 37:12 — the distinction); Clark 1984
  (*JPSP* 47:549 — record-keeping experiment: exchange
  expectation produces better who-contributed tracking);
  Clark & Mills 1993 (norm-violation memorability both
  directions). CONSENSUS distinction; communal>0 residual
  gate and the migration threshold are RW HYPOTHESES.
- **Relationship turning points (§115):** Baxter & Bullis
  1986 (*HCR* 12:469 — verified: dyadic histories
  reconstruct from ~15–25 turning points, ~10 categories);
  Baxter & Erbert 1999; Surra relational-history
  methodology. CONSENSUS sparse-anchor structure; hub
  retrieval mechanics RW.
- **Pre-meeting reputation assimilation (§116):** Jones
  1990 (*Interpersonal Perception* — assimilation
  default); Nickerson 1998 (confirmation-bias review);
  Dunning & Sherman 1997 + Biernat's shifting-standards
  program (assimilation→contrast boundary at unambiguous
  extremity). Direction CONSENSUS; band placement and
  magnitudes RW.
- **Final-encounter privilege (§117):** Fredrickson &
  Kahneman 1993; Kahneman et al. 1993 (peak-end leg,
  CONSENSUS); Davis & Lehman 1995 (bereavement
  counterfactual replay — nearest direct evidence, about
  rumination, not encoding). Weakest section of the part;
  composite HYPOTHESIS.
- **Shared-adversity bonding (§118):** Bastian, Jetten &
  Ferris 2014 (*Psych Sci* 25:2079 — verified: three
  experiments, shared pain → perceived bonding +
  cooperation, controlling task/effort); Whitehouse &
  Lanman 2014; Whitehouse et al. 2017 (identity-fusion
  mechanism). Direction CONSENSUS; bond magnitude and the
  reinstate leg are RW.
- **Plural-subject records (§119):** Aron et al. 1991
  (other-in-self); Mashek, Cannaday & Tangney 2007;
  Wegner transactive line (partner cueing leg). The
  "we"-record store is RW composite on CONSENSUS parts.
- **Story ownership (§120):** Stone 1988 (*The Festival
  of American Folklife* proceedings / family-lore
  scholarship) establishes ownership and teller-rights as
  real social phenomena; no quantitative magnitudes exist —
  all trespass/yield numbers are RW, probe P857 is
  deliberately OBSERVE-grade.

## 59. Addendum — v81 anchors (formal-model VIII, spec v5.29)

Part VIII of `formal-model.md` (§§60–69) instantiates the
spec §14.2 anchor corpus — the first concrete human numbers
the model is held to. Full row table at formal-model.md §61;
full per-probe sourcing at validation-design.md §163. This
addendum records what the corpus *is* and the load-bearing
disagreements it encodes.

- **The corpus exists because "human-like" was unfalsifiable.**
  Eighteen statistics spanning forgetting (Ebbinghaus points,
  Rubin & Wenzel family verdict), lifespan distribution
  (childhood-amnesia offset 3.5y — Tustin & Hayne 2010 /
  Nelson & Fivush 2004's 49-estimate mean 3.69; bump 10–30 —
  Rubin & Schulkind 1997), distortion (misinformation ~.30 —
  Loftus 2005 / Ayers & Reder 1998; implantation ~.30 —
  Lindsay et al. 2004; DRM .01–.65 list-graded — Stadler et
  al. 1999 / Roediger et al. 2001), calibration (flashbulb
  dissociation — Talarico & Rubin 2003; confidence–accuracy
  ≤.3 overall / ~.41 choosers — Sporer et al. 1995), and
  study-time laws (testing .61/.40 at 1wk — Roediger &
  Karpicke 2006; spacing ISI/RI ≈ .10–.20 — Cepeda et al.
  2006, 2008; RIF ~8–10pp — Anderson et al. 1994 / Murayama
  et al. 2014; delayed recency — Glanzer & Cunitz 1966;
  LoP ~2× — Craik & Tulving 1975; generation d≈.5 — Bertsch
  et al. 2007).
- **Deliberate absences encode honesty:** sleep-consolidation
  magnitude has no anchor row (Diekelmann & Born 2010 vs
  Cordi & Rasch 2021 replication failures — mechanism kept,
  number withheld); Bartlett's serial reproduction is
  qualitative and grounds §6.12 operators, not a statistic.
- **The grading is asymmetric on purpose:** equivalence
  testing (TOST — Schuirmann 1987; Lakens 2017) means
  *exceeding* humans fails (`exceed_null`) — the corpus is
  the formal statement that a database is a failed character.
  CONTESTED rows assert nulls: flashbulb consistency
  advantage ≈ 0 must coexist with confidence advantage > 0 —
  the Talarico & Rubin dissociation as a joint constraint.
- **Shrinkage is epistemics as config:** rep grades
  {META 1.0, RRR .9, MULTI .8, SINGLE .6} recenter bands
  toward null — justified by OSC 2015 (~36% replication,
  mean effect ≈ half). Inflated ground produces inflated
  humans.
- **Measurement theory leg:** probes read three observable
  channels only (recall, latency, confidence + emitted
  content) — Tulving & Pearlstone 1966 availability/
  accessibility made operational; latency–strength coupling
  from Wixted & Rohrer 1994; instrument noise (`obs_noise`)
  from psychometric reliability ceilings (~r .7–.9).

## 60. The report layer — memory has a voice, and the voice lies fluently (v82)

A gap audited this pass: the spec modeled what surfaces
(candidates, fields, hedged flags) but not the *style of the
surfacing* as a personality. The literature on memory-as-
performance splits cleanly into speaker-side control and
listener-side inference:

- **Quoted speech is fiction by default.** Tannen 1986
  (*Representing* 27 — verified) reframed "reported speech"
  as *constructed dialogue*: conversational direct quotes
  include utterances provably never spoken (choral "everybody
  says", hypothetical "and I almost said", inner speech
  rendered as dialogue) — the quote is the teller's creation
  bearing full responsibility, not a playback. Wade & Clark
  1993 (*Memory* 1:265) show reproduction drifts toward the
  teller's communicative purpose; Clark & Gerrig 1990
  (*Cognition* 37) formalize quotation as *demonstration* —
  a depiction that selects properties, not a description.
  Store-side corroboration already in the model: Sachs 1967
  verbatim decay means wording is almost never available to
  quote — fluency and fidelity decouple completely.
- **Volunteering is a decision, not a threshold on the
  trace.** Koriat & Goldsmith 1996 (*Psych Rev* 103:490 —
  verified): the monitor-and-control model — metacognitive
  confidence drives a volunteer/withhold decision whose
  criterion is a stable control policy; granting report
  option raises accuracy at the cost of quantity, modulated
  by incentive and monitoring effectiveness. Goldsmith,
  Koriat & Weinberg-Eliezer 2002 (*JEP:G* 131:73 — verified)
  add the second control dial: grain — rememberers coarsen
  answers ("last spring") to buy accuracy, trading
  informativeness. Both are person-level dispositions —
  exactly the trait-shaped hole §5.61's context-level report
  option left.
- **What narration is made of.** Levine, Svoboda, Hay,
  Winocur & Moscovitch 2002 (*Psychol Aging* 17:677 —
  verified): the Autobiographical Interview's internal
  (episodic) vs external (semantic/off-event) detail split;
  older adults shift external — already the §5.78c age curve
  — but the spread at fixed age is a style (Addis, Wong &
  Schacter 2008, *Neuropsychologia* 46:1363): habitual
  sensory-happening talkers vs habitual commentators.
- **The audience grades the pause.** Brennan & Williams 1995
  (*J Mem Lang* 34:383 — verified): listeners estimate a
  speaker's knowing from latency and filled pauses, with an
  asymmetry worth a mechanism — latency before an ANSWER
  lowers the feeling-of-another's-knowing, latency before a
  NONANSWER raises it (a slow "I don't remember" reads as
  knowledgeable, a fast one as blank). Smith & Clark 1993
  (*Cognition* 48:151): uh<um as calibrated delay signals.
  Top-down beliefs about the speaker's expertise modulate
  the read (FOAK prior leg — direction CONSENSUS, magnitude
  SINGLE-study DEBATED).
- **The telling eats the event.** Marsh 2007 (*Am J Psychol*
  120:533 — verified): retelling is not remembering —
  tellings reorganize toward story shape and later recall
  retrieves the telling; Bartlett's effort-after-meaning
  supplies the selection bias. Tannen 1989's evaluation
  coda ("and that's when I knew") is told-on-report, minted
  nowhere in the record.
- **Model consequence (spec v5.30 §§5.79–5.83):** five
  report-layer traits — `voice_quote`, `report_policy`,
  `grain_pref`, `ie_talk`, `voice_story` — plus the FOAK
  update leg (`estKnow` on PersonModel). All SELECTION or
  SURFACE: six locked nulls (P871–P877) keep the voice from
  ever minting content, sharpening grain, or touching
  stored strength. The persona-level outcome the project
  wants — "she's always quoting him, and half of it he
  never said" — is now a first-class profile phenotype.

## 61. v83 — the battery disciplines itself (validation-design IX)

Not psychology — the psychology is now big enough that the
measurement layer is the risk. This version arms the verdict
layer against itself; all additions are spec §14.5 and
validation-design.md §§166–171 (probes P879–P888).

- **False rejections are budgeted, not hoped away.** At 878
  probes, nominal-α testing expects ~44 false rejections under
  global null — and the probes are correlated (shared mains,
  shared seeds, shared event pools). Verdicts now run inside
  versioned families under Benjamini–Hochberg at `fdr_q`,
  with the Benjamini–Yekutieli Σ1/i penalty as the default
  dependence correction (BH 1995, *JRSS-B* 57:289; BY 2001,
  *Ann Statist* 29:1165). Locked nulls stay outside FDR: a
  boundary violation is a gate event, not a statistic.
- **Watching a running p is a decision.** The harness streams
  corpusRun verdicts per tick; stopping on a dipped p inflates
  type-I (Robbins 1970; Howard et al. 2021, *Ann Statist*
  49:1055). Anchors now monitor on e-values — Ville-valid at
  arbitrary stopping times — using the betting construction
  for bounded statistics (Waudby-Smith & Ramdas 2024,
  *JRSS-B* 86:1, verified; merging rules per Vovk & Wang
  2021, *JRSS-B* 83:961). Peeking on raw p is `peep_null`.
- **The identifiability map gets audited, not trusted.**
  Morris elementary-effects screening (Morris 1991,
  *Technometrics* 33:161; μ*/σ per Campolongo, Cariboni &
  Saltelli 2007) re-ranks each anchor's pinned params; ≥0.8
  top-k overlap required or the map is stale. Screening can
  add audit candidates but never delete a gated param
  (`screen_drop_null`) — sloppiness doctrine (Gutenkunst
  et al. 2007): jointly constrained, individually inert.
- **Believability is a separate axis.** Corpus anchors fit
  population statistics; `rateBelief` tests whether a blinded
  human rater can tell a sim recall transcript from a human
  protocol (Turing 1950 as protocol skeleton; Orne 1962 for
  why provenance must be hidden — `rater_leak_null`). Band
  [0.5,0.75]: detectable-above-ceiling fails believability;
  below-floor flags instrument error under the §62
  too-good doctrine.
- **Model consequence (spec v5.31 §14.5):** verdict governance
  is now contract — `evalGate` (BH + locked-null gate),
  `evalAnchor` e-value returns, `sensAudit`, `rateBelief`;
  +12 pop/harness params, +4 locked nulls; zero Event/record/
  PersonModel changes. Every claim the corpus makes about the
  characters is now made by an instrument that is itself
  falsifiable (P879–P888).

## 62. v84 — what takes the share without permission (encoding-mechanics VII, spec v5.32)

Sixth pass priced value/choice/audience triage. Seventh pass
prices what was left: the involuntary, the composite, the
floor, the dwell, and the run. Spec v5.32; encoding-mechanics.md
§§84–95; probes P889–P898; +16 params, +5 locked nulls
(incl. `gum_gain`), +2 frozen.

- **Attention doesn't need the goal's permission.** Value-driven
  attentional capture (Anderson, Laurent & Yantis 2011, *PNAS*
  108:10367 — verified): stimuli that once predicted reward
  capture attention when they reappear as task-irrelevant
  distractors — involuntary, persistent (Anderson & Yantis 2012:
  >6 months), scaled by reward value (Le Pelley et al. 2016
  meta), and moderated by WMC and impulsivity. Distinct from
  §71's VDR — that was strategic spending; this is capture.
  Fields co-encoded with reward carry `rewardAssoc` (half-life
  `vdac_hl` 180d) buying wm_cap share (`vdac_w`) and taxing
  co-present fields (`vdac_tax`). Locked `vdac_goal_null`:
  goal-irrelevance must not prevent capture — that IS the
  finding. Frozen `vdac_scope`: no retroactive staining.
  Cast shadow: the corner where the tip was big pulls the
  low-wmc bartender's eye months later, and whatever else was
  in the scene mints thinner.
- **Two congruent channels mint one trace with two doors.**
  Congruent bimodal+ events gain `msens_gain` and mint
  cross-modal cue bridges (`msens_cue_bridge`) — the smell
  retrieves the sight (Shams & Seitz 2008; Lehmann & Murray
  2005). Incongruent co-occurrence pays `msens_incong_loss` —
  the TV behind the speaker costs the conversation. Frozen
  `msens_congr_gate`: congruence is judged per field-pair.
- **Hasher & Zacks, adjudicated.** Frequency, location, and
  temporal order encode at a floor (`auto_floor`) with
  attenuated daLoad cost (`auto_da_resist`) — but intent still
  helps, so `auto_immune_null` locks the floor from becoming a
  ceiling (Naveh-Benjamin 1987 critique). The floor survives:
  attribute fields are the most age-resistant of the deliberate
  measures (P893 partial-sparing shape).
- **Drawing beats its parts.** The drawing effect (Wammes,
  Meade & Fernandes 2016 — >2× recall vs writing, survives
  LoP/imagery/picture controls) is a composite trace:
  `engagement:"drawn"` mints `draw_gain` with `draw_da_resist`
  (robust under divided attention and in older adults, 2018).
  `draw_verbatim_null`: the composite mints shapes, not
  orthography — she remembers the diagram's layout, not its
  labels.
- **Dwell follows difficulty, not value.** Region of proximal
  learning (Metcalfe & Kornell 2005): self-paced dwell
  concentrates mid-difficulty (`rpl_focus` inverted-U); under
  deadline it flips easiest-first (`rpl_press_flip`; Son &
  Metcalfe 2000). The deficit encoder flattens the U — the same
  deficit that breaks value selectivity breaks difficulty
  selectivity.
- **Why-probing needs something to grab.** Elaborative
  interrogation (`why:true` → `ei_gain`) is gated by
  `schema_support ≥ ei_know_gate`; `ei_noknow_null` locks it —
  asking why about the unfamiliar yields ≈0 (Pressley 1987;
  Dunlosky 2013 contingency). The obsessive explainer is deep
  inside her expertise and shallow outside it — emergent, not
  pinned.
- **Coherent days mint as blocks.** `catRun ≥ org_run_min`
  consecutive same-topic events mint links at
  `link_p·(1+org_gain)` (Tulving 1962; Bower 1969). The
  routine-holder's organized days encode densely; the chaotic
  character's interleaved errands mint as fragments — the
  encode-side root of event clusters.

## 63. v85 sources (forgetting-curves VIII — the fade's fate)

- **Nelson 1978** (*JEP:HLM* 4:453 — verified): savings
  detectable for items nonrecallable AND nonrecognizable —
  subthreshold traces are real and re-incrementable.
- **Nelson 1985** (*JEP:LMC* 11:472 — verified): savings
  during relearning is the most sensitive retention measure —
  sensitivity order savings > recognition > recall.
- **MacLeod & Nelson 1984** (verified replication): savings
  on nonretrieved items after one relearning trial;
  "concatenation" account.
- **Averell & Heathcote 2011** (*J. Math. Psychol.* 55:25–35
  — verified): hierarchical fits answer the averaging
  objection — exponential best per-subject fit but power wins
  Bayesian model selection; above-chance asymptote in all
  analyses (briefly-studied memories can be permanent).
- **Simon 1966** (*Psychometrika* 31:505 — verified): Jost's
  law + exponential implies heterogeneous decay constants —
  pooled curves steepen vs per-item.
- **Anderson & Schooler 1991** (*Psych. Sci.* 2:396 —
  verified): need-probability statistics (NYT headlines,
  child-directed speech, e-mail) mirror memory-availability
  regularities — memory's form is rational given the
  environment.
- **Hardt, Nader & Nadel 2013** (*TICS* 37:111 — verified):
  "decay happens" — forgetting as active remodeling;
  neurogenesis destabilizes existing traces.
- **Frankland, Köhler & Josselyn 2013** (*TINS* — verified):
  neurogenesis account of infantile amnesia — high-plasticity
  epochs clear old traces. Mechanism DEBATED (adult human
  neurogenesis contested); RW implements only the reduced
  form (§4.40).
- **Established vs hypothesis:** savings existence and
  sensitivity order, per-individual power+floor adequacy,
  heterogeneity steepening, need↔availability correspondence
  = CONSENSUS/established. Hazard lottery, needRate τ
  modulation, vol_loss ecology term, scalar savings shadow =
  RW hypotheses (P899–P907).

## 64. v86 sources (retrieval-cues VIII — the cueless pop and the cue that isn't)

- **Kvavilashvili & Mandler 2004** (*Cognitive Psychology*
  48:47–94 — verified via DOI/abstract): "mind-popping" —
  involuntary SEMANTIC memories; no apparent cue, automatic-
  activity bias, priming delays of hours–days; the episodic
  involuntary literature's cueless cousin.
- **Janata, Tomic & Rakowski 2007** (*Memory* 15:845–860 —
  verified): ~30% of familiar-song presentations evoke AMs;
  positive-emotion skew, nostalgia third; both general and
  specific AM levels present.
- **Jakubowski & Ghosh 2021** (*Br. J. Psychol.* — verified
  via abstract): diary study; 83% of music-evoked memories
  rated spontaneous — higher involuntary share than food
  cues.
- **Belfi et al. 2022** (*Psychology of Music* — verified
  via abstract): MEAMs are episodically richer than
  face-evoked memories even matched on involuntariness —
  richness is a stimulus property.
- **El Haj, Fasotti & Allain 2012** (*Conscious. Cogn.* 21 —
  verified): involuntary character of MEAMs; preserved in
  aging vs word-cued AMs.
- **Wagenaar 1986** (*Cognitive Psychology* 18:225 —
  verified): self-diary; `when` was the only cue never
  effective alone.
- **Barsalou 1988** (*Psych. Rev.* 95 — verified): date cues
  fail; autobiographical search runs through extended event
  structures, not the calendar.
- **Kurbat, Shevell & Rips 1998** (*Mem&Cogn* 26:1058 —
  verified): dating is landmark- and calendar-reference-
  point relative.
- **Shum 1998** (*Appl. Cogn. Psychol.* 12 — verified):
  temporal landmarks anchor AM search.
- **Crovitz & Schiffman 1974** (*Bull. Psychon. Soc.* 4 —
  verified): word-cue method; recall-age power decay.
- **Rubin & Schulkind 1997** (*Mem&Cogn* 25:859 — verified):
  cue-word lifespan distribution — the bump instrument.
- **Robinson 1976** (*Cognitive Psychology* 8:578 —
  verified): word-class effects — activity/affect vs object.
- **Ariel 1990** (*Accessing Noun-Phrase Antecedents* —
  verified): referring-expression accessibility hierarchy.
- **Gundel, Hedberg & Zacharski 1993** (*Language* 69:274 —
  verified): givenness hierarchy of expression forms.
- **Fivush & Fromhoff 1988**; **Reese, Haden & Fivush 1993**
  (*Cognitive Development* 8:403 — verified); **Nelson &
  Fivush 2004** (*Psych. Rev.* 111 — verified review):
  elaborative reminiscing style scaffolds children's AM.
- **Kahana 1996** (*Mem&Cogn* 24:103 — verified): lag-CRP
  temporal contiguity with forward asymmetry; **Howard &
  Kahana 2002** (*J. Math. Psychol.* 46 — verified TCM);
  **Kahana, Howard, Zaromb & Wingfield 2002** (*Psychol.
  Aging* 17 — verified age attenuation); **Moreton & Ward
  2010** (*QJEP* 63 — verified AM down-weight).
- **Madore, Gaesser & Schacter 2014** (*PNAS* 111:E1981 —
  verified): episodic specificity induction lifts subsequent
  unrelated recall detail; **Madore & Schacter 2016**
  (*Memory* 24 — verified orientation account); **Jing,
  Madore & Schacter 2016** (*J. Gerontol. B* — verified
  older-adult arm).
- **Established vs hypothesis:** pop existence + cue
  opacity, MEAM profile, date-cue failure, word-class order,
  accessibility hierarchy, elaborative-scaffolding child
  effect, lag-CRP shape + age attenuation, ESI lift =
  CONSENSUS. Seed half-life, meam constants, adult-adult
  scaffolding extension, am_att magnitude, esi horizon =
  RW hypotheses (P908–P917).

## 65. v87 adds — age-development VIII (the flat terms that weren't)

- **Ross, Anderson & Campbell 2011** (*Monogr. SRCD* 76(3)
  — verified): mnemonic self-reference present at 3–4,
  nascent — enactment, self-image, ownership routes.
- **Ross, Hutchison & Cunningham 2020** (*Child Dev.* —
  verified): preschool AM volume predicted by self-knowledge
  volume and self-source monitoring.
- **Ofen et al. 2007** (*Nat. Neurosci.* 10:1198 —
  verified): recollection develops via protracted PFC
  maturation (8–24); MTL basics early.
- **Billingsley, Smith & McAndrews 2002** (*JECP* 82:251 —
  verified): familiarity/priming mature before recollection.
- **Ghetti & Lee 2011** (*Dev. Rev.* 31 — verified review):
  familiarity adult-like ~6–8; recollection→adolescence.
- **Betts, McKay, Maruff & Anderson 2006** (*Child
  Neuropsychol.* 12:205 — verified): sustained attention
  steep 5→9, plateau ~10–12.
- **Lindsay, Johnson & Kwon 1991** (*JECP* 52:297 —
  verified): source monitoring improves through childhood.
- **Drummey & Newcombe 2002** (*Dev. Psychol.* 38:1138 —
  verified): fact recall steady, source jumps abruptly 4→6.
- **Busby & Suddendorf 2005** (*Cogn. Dev.* 20:362 —
  verified): past/future mental time travel in tandem 3→5.
- **Addis, Wong & Schacter 2008** (*Psychol. Sci.* 19:33 —
  verified): older adults' future simulation loses internal
  detail; external compensates.
- **Addis, Musicaro, Pan & Schacter 2010** (*Psychol.
  Aging* 25:369 — verified): deficit survives
  no-recasting recombination.
- **Scullin, Bugg, McDaniel & Einstein 2011** (*Mem&Cogn*
  39:1232 — verified): preserved spontaneous PM retrieval,
  impaired deactivation in aging.
- **Scullin, Bugg & McDaniel 2012** (*Psychol. Aging*
  27:46 — verified): commission errors elevated with age.
- **Bugg & Scullin 2013** (*Psychol. Aging* — verified):
  repeated performance hardens completed intentions.
- **Walser, Fischer & Goschke 2012** (*JEP:LMC* 38:1030 —
  verified): aftereffects of completed intentions.
- **Berntsen & Rubin 2004; Thomsen & Berntsen 2008; Bohn &
  Berntsen 2008** (verified): life script positive-only;
  negative events don't bump.
- Consensus vs hypothesis: all phenomena above established;
  knot magnitudes + `dist_child_mult`, `epf_sem_fill`,
  `pm_zombie_p` rates, `bump_neg_pen` are fitted —
  probe-gated P918–P927.

## 66. v88 adds — age-decline VIII (the overlay ledger)

Part VIII of age-decline.md (§§110–119) moves decline from
pure slope to **event-and-state ledger** — the largest
single reframe since the trajectory classes (§96):

- **Event-shaped decline.** Wilson 2012 (MAP): first
  hospitalization accelerates decline 2.4× (episodic 3.3×);
  James 2019 isolates it to *nonelective* admissions —
  elective surgery does not accelerate. Ehlenbach 2010
  adds the level step (CASI −1.01/−2.14). RW consequence:
  `hosp_step` is the first non-age term in the decline
  integrator — a character's memory age is now partly a
  *medical history*, and the elective-null keeps the
  mechanism honest (hospitalization qua illness stressor,
  not qua event tag).
- **Loss-shaped decline.** Aartsen 2005: widowhood costs
  memory *independently of depression* — bereavement is
  not mood-mediated (so it stacks with, not inside, the
  loneliness overlay). Shin 2018 says the tail is
  persistent and time-scaling; LASA fixed-effects says
  temporary and reasoning-only. We encode acute-certain +
  tail-small (P929 caps it) — the honest middle.
- **Reversible dip.** Greendale 2009 (SWAN) is the
  cleanest *transient* decline in the literature: late-
  perimenopause learning at 7% of premenopause rate, full
  rebound post. `mt_stage` is the model's only overlay
  that gives the deficit back — and the first sex-linked
  age mechanism (female mains pay a midlife encoding
  trough; males never do).
- **Leading indicators.** Mielke 2013's one-way arrow
  (gait→cognition, never reverse) plus Buracchio 2010's
  ~12y pre-MCI acceleration give the decline arm a
  *world-visible* tell (`gaitSlow`) years before memory
  shows — the spectator learns the trajectory before the
  character, the external mirror of SCD (§98). Compressed
  to 4y for season-scale drama.
- **Protective levers with different physics.** Purpose
  (Boyle 2010 — internal, event-rewritable, survives
  bereavement), bilingualism (Bialystok 2007 — DEBATED,
  onset-shift only, slope never spared), and structural
  network size (Bennett 2006 — modifies the
  pathology→function mapping, orthogonal to *perceived*
  loneliness) are three distinct reserve channels; the
  spec now keeps them separable so probes can falsify any
  one without collapsing the others.
- **Control shift.** Eppinger 2013 / de Wit 2014: old age
  moves action selection habitual — the routine survives
  the reason. `perseverate:true` is the emission: she
  still walks to the closed bakery. Behaviorally the same
  dissociation as §5.78d's implicit floor, one level up.
- **The learning-channel crossover.** Tse 2010: testing
  beats restudy for old adults ONLY with feedback —
  uncorrected retrieval attempts lose to re-exposure.
  `test_nofb_gain` < `study_gain` means an old character
  who misremembers aloud and is never corrected
  consolidates the error — misinformation (§6.3) and
  relearning are the same fluency mechanics seen from two
  sides.
- **Remote semanticization.** Sekeres 2018 + Levine 2002:
  the oldest records shed detail fastest in old adults —
  the remote story survives as its *lesson*.

New sources verified this version: Eppinger 2013, de Wit
2012/2014, Otto 2013, Aartsen 2005, Shin 2018, LASA
fixed-effects (Comijs gby104), Fulton 2022 review,
Wilson 2012, Ehlenbach 2010, James 2019, Boyle 2010/2012,
Kim 2019, Bialystok 2007/2010, Zahodne 2014, Mukadam 2017,
Mielke 2013, Buracchio 2010, Tian 2020, Greendale
2009/2010, Sekeres 2018, Piolino 2006, Bennett 2006,
Crooks 2008, James 2011, Tse 2010, Meyer & Logan 2013.

## 67. v89 adds — emotional-memory VIII (the quiet uses of feeling)

Part VIII of emotional-memory.md (§§98–107) prices the
places where the feeling of NOW re-edits the feeling of
THEN — the direction of the bends, not just their
existence:

- **Present-pull on the past.** McFarland & Ross 1987 and
  Karney & Coombs 2000 make the most consequential
  dyadic finding concrete: recalled past feelings track
  the CURRENT bond *trajectory*, not the stored record.
  The honest subtleties the model keeps: it is Δ that
  drives direction (a stable-unhappy marriage does not
  produce "never loved you"), verbatim-gated (the
  letter's words survive while its reported warmth
  shifts), and emission-side (the born tag refires on a
  strong cue — `consist_fact_null`/`felt_write_null`
  discipline). RW payoff: post-breakup "I never felt
  anything" is now a *mechanism with an audit flag*
  (`rewrote_feelings:true`), not flavor text.
- **Two small effects, kept small on purpose.** Mood-
  state-dependence (Eich & Macaulay 2000 — real, weakest
  of the context terms, self-generated-search-bound)
  and SIF (Anderson & Green 2001 → 2024 multilevel
  meta: real, ~small, valence-neutral) are both
  literature-famous and both routinely oversold. The
  spec now prices the CONDITIONS (internal search,
  external-cue share, charge gate; load-dependent
  rebound) rather than the raw effect — the
  implementation encodes where the effects live, which
  is what survived the replication era.
- **The narrative layer gets a personality.** `narr_seq`
  imports McAdams' redemption/contamination finding as
  a *trait* — the first emotional-memory mechanism that
  is a story-grammar rather than a store-process. It
  drifts tags on retell (never content —
  `narr_truth_null`) and is itself rewritable only by
  world events: a person who keeps getting betrayed
  literally becomes a contamination narrator.
- **Recovery is unmemorable.** Immune neglect (Wilson &
  Gilbert) reframed as a *storage* claim: coping days
  mint thin, the duration-to-recover field decays
  verbatim-fast, and the forecasting arm (§50) is left
  with peak pain and no learning rate — `immune_blind_
  null` makes the neglect structural. The `heal_gap`
  audit is our operationalization, flagged invented.
- **The one distortion that grows with age.** Choice-
  supportive bias (Henkel & Mather 2007) is the
  rare find where OLDER adults distort MORE — routed
  through `opt_src` source decay, so the bias literally
  strengthens as the feature→option binding rots.
  Paired with the positivity effect (Mather & Knight
  2005), whose load-bearing cell is the DA REVERSAL:
  distraction doesn't merely erase old-age positivity,
  it flips it — P945 tests both arms.
- **Structure, not just strength.** Affect boundaries
  (Heusser 2022's reset model implemented literally;
  Clewett 2020's arousal-burst boundary) give Event
  records internal seams — order breaks across the
  seam, distance dilates, interference drops. And
  peritraumatic dissociation (Ozer 2003 meta —
  strongest during-event PTSD predictor) finally gives
  the existing `dissoc` trait its encode roll: binding
  loss, never content loss.
- **The camera is an attention machine, not an
  offload machine.** Barasch 2017's mental-photo arm
  proves the mechanism is attentional; the spec
  reconciles Henkel 2014 by scoping offload to
  `photographing:"archive"` — volitional framing boosts
  the seen and taxes the heard, and a `photo_review`
  later preserves only what the frame held.

New sources verified this version: McFarland & Ross
1987, Karney & Coombs 2000, Eich & Macaulay 2000,
Smith & Vela 2001, Anderson & Green 2001, Anderson &
Huddleston 2012, Levy & Anderson 2008, Wegner 1987/
1994, Wenzlaff & Wegner 2000, 2024 SIF multilevel
meta, McAdams 1997/2001/2006, Adler 2015/2017,
Pasupathi 2001, Gilbert et al. 1998, Wilson & Gilbert
2003, Henkel & Mather 2007, Gilbert & Ebert 2002,
Clewett 2020, Heusser 2022, Rouhani 2020, Mather &
Carstensen 2005, Kennedy 2004, Reed/Chan/Mikels 2014,
Mather & Knight 2005, Knight et al. 2007, Ozer et al.
2003, van der Kolk & Fisler 1995, Ehlers & Clark
2000, Barasch et al. 2017, Diehl et al. 2016,
Henkel 2014, St. Jacques & Schacter 2013.

## 68. v90 adds — false-memory VIII (the edges of the record)

Part VIII of false-memory.md (§§88–97) prices the failure
modes that live at the record's edges — where a memory
isn't distorted but *attributed*, *extended*, *out-talked*,
*probed into being*, or *confessed into existence*:

- **Provenance is the first casualty.** Cryptomnesia
  (Brown & Murphy 1989; Marsh & Bower 1993; Macrae et
  al. 1999) closes the loop the source-monitoring stack
  opened: §6.10's sourceInfer, run on generation, mints
  self-authorship for source-decayed heard content —
  and the self-similarity gate means characters steal
  most from the people most like them. Truthiness
  (Newman et al. 2012) is the same fluency error
  pointed the other way: a photo that proves nothing
  still reads as evidence. Both are `believe_p`/`source`
  layer moves with locked `*_content_null` arms —
  belief and attribution shift; the record's content
  doesn't.
- **The frame is wider than the event.** Boundary
  extension (Intraub & Richardson 1989) gives scene
  records schema-typical periphery that normalizes over
  days — the first mechanism in the spec whose falsity
  is *geometric*. Verbal overshadowing (Schooler &
  Engstler-Schooler 1990; Meissner & Brigham 2001;
  Alogna et al. 2014 RRR — direction kept, magnitude
  flagged) plus the Carmichael label pull make *telling*
  a retrieval hazard: the character who describes the
  suspect is the worst identifier, and her label drags
  the listeners' records too.
- **Questions mint what they ask about.** Crashing
  memories (Crombag, Wagenaar & van Koppen 1996 —
  55/66% saw a film that doesn't exist; Ost et al.
  2002) formalize the `footage_probe`: notoriety, not
  plausibility, gates the phantom, and detail-demanding
  probes endorse MORE because the demand runs the
  schema fill. Overclaiming (Atir et al. 2015) is the
  trait-mapped twin — confidence without a record,
  minted at `familiar_only` tier only.
- **The self is the flippable record.** Choice blindness
  (Johansson et al. 2005 — ≤26% detect, then
  confabulate) and coerced self-false-memory (Kassin &
  Kiechel 1996 — 69/28/9%; Nash & Wade 2009) share one
  discipline: overlays and belief flips, never rewrites
  (`cb_record_null`, `ownact_fact_null`). A character
  can remember doing what they didn't do; the ledger
  always knows.
- **Two boundaries, one locked.** Collaborative
  inhibition (Weldon & Bellinger 1997; Rajaram &
  Pereira-Pasarin 2010) prices the group-recall deficit
  with `collab_gain_null` — consensus by amnesia. And
  `repress_revival_null` takes the model's only
  absolute position: following McNally 2003, the
  machinery for recovered-memory *reports* is fully
  implemented (probes mint phantoms through §6.9), the
  machinery that would *validate* them is absent — and
  P957 probes the absence.

New sources verified this version: Brown & Murphy 1989,
Marsh & Bower 1993, Marsh, Landau & Hicks 1997, Macrae,
Bodenhausen & Calvini 1999, Intraub & Richardson 1989,
Intraub, Gottesman & Bills 1998, Hubbard 1996, Intraub
2002, Schooler & Engstler-Schooler 1990, Meissner &
Brigham 2001, Alogna et al. 2014, Carmichael, Hogan &
Walter 1932, Crombag, Wagenaar & van Koppen 1996, Ost,
Vrij, Costall & Bull 2002, Smeets et al. 2009, Otgaar
et al. 2022, Newman et al. 2012/2015, Johansson, Hall,
Sikström & Olsson 2005, Hall, Johansson & Strandberg
2010, Strandberg et al. 2018, Levin et al. 2000, Kassin
& Kiechel 1996, Nash & Wade 2009, Horselenberg et al.
2003, Hanba & Zaragoza 2007, Weldon & Bellinger 1997,
Basden, Basden, Bryner & Thomas 1997, Rajaram &
Pereira-Pasarin 2010, Atir, Rosenzweig & Dunning 2015,
McNally 2003, Loftus 1993, Brewin & Andrews 2017,
Patihis et al. 2014 — probes P948–P957.
## 69. v91 adds — individual-differences VIII (the chemistry and the crowd)

Part VIII of individual-differences.md (§§92–107) prices
the axes that live in the state more than the trait —
pharmacology, pressure, exposure — plus the complaint
that outruns the record and the third mandated null:

- **The evening's holes are a person, not a dose.** At
  matched intoxication, only some drinkers gap —
  `blackout` [0,2] prices the fragmentary (thin-source,
  `frag:true`, cue-rescuable as `reconstructed`) vs
  en-bloc (never minted, `blackout_rescue_null`) split
  from Hartzler & Fromme 2003 (3:1 ratio; retrieval-
  failure account) and Wetherill & Fromme 2011 (dlPFC/
  parietal interaction at matched performance). The
  direction is anterograde-only (`blackout_retro_null`),
  consistent with v5.20's `intox_retro_shield` — the
  same night can hold a shield and a hole.
- **The pill taxes tomorrow.** `med_burden` merges the
  benzodiazepine (Curran 1991; Buffett-Jerrott &
  Stewart 2002) and anticholinergic (Gray 2015; Fox
  2011) signatures into one anterograde-only load with
  a `med_washout` recovery and a DEBATED cumulative
  `med_aging_add` leg.
- **Pressure picks on the strong.** `eval_press` +
  `choke_k`·wmc⁺ encodes Beilock & Carr 2005's paradox:
  high-wmc characters lose the most under evaluation,
  because worry spends the very capacity the task
  favored (Eysenck et al. 2007 ACT). `att_ctl` is the
  buffer axis that decides whether `neurot`'s worry
  reaches the record (Derryberry & Reed 2002) — two
  characters can share the anxiety and split the cost.
- **Complaint and accuracy are different channels.**
  `scd` prices the worried well (Jessen 2014; Rabin
  2017) with `scd_obj_null` locked; `preg_state` prices
  the same dissociation inside a real small deficit —
  Davies et al. 2018's T3-weighted dip at 0.8 complaint
  share, `preg_perm_null`/`preg_theta_null` keeping it
  anterograde and temporary. Both join v5.36's
  `mt_complaint` as the model's complaint>effect
  family.
- **Exposure rescales the face tiers.** `cross_exp`
  damps `orb_*` out-group penalties (Meissner &
  Brigham 2001; Rhodes & Anastasi 2012 half-weight own-
  age leg) with `orb_content_null` keeping the bias in
  face/identity only.
- **The imagination shares the machinery.** `sim`
  couples `future:true` detail to `specificity` via
  `sim_detail_link` (Addis 2007; Madore & Schacter
  2014) — `sim_content_null` holds the line that
  detail is not truth.
- **Two honest ceilings and a locked absence.** `caff`
  prices dependence not boost (`caff_ability_null`;
  Rogers & Dernoncourt 1998); `gamer` prices reflexes
  not store (`gamer_episodic_null`; Bediou 2018's
  bias-inflated g≈.55/.34 against Boot/Hilgard
  critiques); `braintrain` becomes the third mandated
  null — `nt_xfer` only, `braintrain_far_null`
  (Simons 2016; Melby-Lervåg & Hulme 2013; Owen 2010's
  11,430-person zero-transfer RCT).

New sources verified this version: Hartzler & Fromme
2003a/2003b, Wetherill & Fromme 2011, Wetherill et al.
2011, Nelson et al. 2004, White 2003, Goodwin et al.
1969, Parker et al. 1980/81, Carlyle et al. 2017,
Curran 1991, Buffett-Jerrott & Stewart 2002, Gray et
al. 2015, Fox et al. 2011, Campbell et al. 2009,
Beilock & Carr 2005, DeCaro et al. 2011, Gimmig et al.
2006, Eysenck et al. 2007, Beilock 2008, Derryberry &
Reed 2002, Berggren & Derakshan 2013, Jessen et al.
2014, Rabin et al. 2017, Meissner & Brigham 2001,
Rhodes et al. 2006, Wright et al. 2003, Rhodes &
Anastasi 2012, Addis et al. 2007, Schacter & Addis
2007, Race et al. 2011, Madore & Schacter 2014, Davies
et al. 2018, Hoekzema et al. 2017, Greendale et al.
2009, Rogers & Dernoncourt 1998, James & Rogers 2005,
Rogers et al. 2013, Kelemen & Creeley 2003, Bediou et
al. 2018 (+2018 correction), Boot et al. 2011, Hilgard
et al. 2017, Simons et al. 2016, Melby-Lervåg & Hulme
2013, Shipstead et al. 2012, Owen et al. 2010 —
probes P958–P969.

## 70. v92 adds — social-memory IX (the talk evaporates, the ties fade, the maps lie)

Part IX of `social-memory.md` (§§126–140) prices the channel
structure the social ledger skipped — the residue ordinary
conversation leaves, the contact clock that fades
relationships, the stale third-party map, and five arena biases.

- **Conversational memory.** Stafford & Daly 1984
  (*Communication Monographs* 51:379): ~10% of idea units
  reproduced at one month — residue is highlights + gist, not
  transcript. Keenan, MacWhinney & Mayhew 1977: interaction-
  content statements (insults, boasts, commitments) survive;
  low-content assertions don't. Hjelmquist 1984 / Hjelmquist &
  Gidlund 1985: verbatim poor, gist adequate, recognition >>
  recall. Goldsmith & Baxter 1996: remembering organizes by
  event, not by talk. → spec: `convo_verbatim_hl` fast leg,
  `convo_interact_gain`, `formula_e_mult` phatic floor,
  `convo_formula_null` locked.
- **Tie decay on contact.** Roberts & Dunbar 2011 (*Social
  Networks* 33:138): emotional closeness decays when contact
  drops. Sutcliffe et al. 2012 (*Psychol. Sci.*): the
  5/15/50/150 layer structure is contact-budgeted. Burt 2000
  (*Am. J. Sociol.* 106:347): decay functions over years.
  Hill & Dunbar 2003: kin ties persist at contact levels that
  kill friendships. → `tie_decay_hl`, `kin_floor`,
  `recontact_rescue` (HYPOTHESIS — thin direct evidence),
  `tie_delete_null`.
- **Cognitive social structures — the stale map.** Krackhardt
  1987 (*ASQ* 32:109) & 1990 (*Soc. Networks* 12:239):
  perceived networks diverge systematically from actual.
  Kumbasar, Rommey & Batchelder 1994 (*AJS* 100:477): recency
  + transitivity recall biases. Freeman 1992. → `SocialMap`
  updates on witnessed events only; `stale_map_fact_null` —
  belief-vs-fact by design.
- **Expression-contingent face memory.** Baudouin et al. 2000
  (*BJP* 91:543) smile advantage; Öhman, Lundqvist & Esteves
  2001 angry faces capture attention WITHOUT recognition
  advantage — the attention/memory dissociation. →
  `expr_smile_gain`, `expr_angry_att`,
  `smile_disposition_null`.
- **Apology records.** Ohbuchi, Kameda & Agarie 1989 (*JPSP*
  56:919) apology reduces anger/aggression; Scher & Darley
  1997 (*JESP* 33:509) partial apologies backfire; Darby &
  Schlenker 1982. → `apology_damp`/`apology_backfire` on
  retrigger affect, `apology_eraser_null`.
- **False consensus.** Ross, Greene & House 1977 (*JESP*
  13:279); Marks & Miller 1987 (*Psychol. Bull.* 102:72 —
  meta). → `fc_k` projection on `stance_est`,
  `fc_consent_null` (projection mints nothing — surprise
  survives).
- **Mimicry.** Chartrand & Bargh 1999 (*JPSP* 76:893)
  chameleon effect; Lakin & Chartrand 2003 (*Psychol. Sci.*
  14:334) mimicry→liking; van Baaren et al. 2004; detected
  mimicry backfires. → trait `mimic` (speaker gate),
  `mimic_gain`/`mimic_cap`/`mimic_detect_pen`,
  `mimic_recipient_null`.
- **Pluralistic ignorance — the vocal minority's norm.**
  Prentice & Miller 1993 (*JPSP* 64:243); Blanton & Christie
  2003 (deviant regulation — perceived norms steer acts). →
  `NormModel` per-venue, witnessed `norm_expr` only,
  `norm_vocal_w`, `norm_truth_null`.
- **Proposal attribution.** Ross & Sicoly 1979 (*JPSP* 37:322)
  overclaim of joint contributions. → `idea_self_bias`,
  `idea_pool_p`, `idea_verbatim_null`.
- **Trust repair.** Schweitzer, Hershey & Bradlow 2006
  (*OBHDP* 101:1 — partial recovery); Kim, Ferrin, Cooper &
  Dirks 2004 (*JAP* 89:104 — violation-type contingent);
  Tomlinson et al. 2004. → `trust_recover_k`,
  `breach_floor`, `apology_floor_cut`, `trust_full_null`.

New sources verified this version: Stafford & Daly 1984;
Keenan, MacWhinney & Mayhew 1977; Hjelmquist 1984; Hjelmquist
& Gidlund 1985; Goldsmith & Baxter 1996; Roberts & Dunbar
2011; Sutcliffe et al. 2012; Burt 2000; Hill & Dunbar 2003;
Saramäki et al. 2014; Krackhardt 1987/1990; Freeman 1992;
Kumbasar, Rommey & Batchelder 1994; Baudouin et al. 2000;
D'Argembeau et al. 2003; Öhman, Lundqvist & Esteves 2001;
Darby & Schlenker 1982; Ohbuchi, Kameda & Agarie 1989; Scher
& Darley 1997; Bennett & Earwaker 1994; Ross, Greene & House
1977; Marks & Miller 1987; Chartrand & Bargh 1999; Lakin &
Chartrand 2003; van Baaren et al. 2004; Prentice & Miller
1993; Blanton & Christie 2003; Ross & Sicoly 1979;
Schweitzer, Hershey & Bradlow 2006; Kim, Ferrin, Cooper &
Dirks 2004; Tomlinson, Dineen & Lewicki 2004 — probes
P970–P981.

## 71. v93 adds — formal-model IX (the cold start, the do(), the population)

Part IX of `formal-model.md` (§§70–80) is infrastructure
again — but three literature threads carry the psychology
behind the plumbing.

- **A past is reconstructed, not stored — so a generated
  past isn't cheating.** Bartlett 1932 established that
  remembering is reconstruction; Neisser 1981's John Dean
  analysis showed confident, detailed recall assembled from
  gist. Johnson, Hashtroudi & Lindsay 1993 (*Psychol. Bull.*
  114:3): source monitoring cannot reliably separate lived
  events from told/imaged reconstructions — which licenses
  `synth_mark_null`: a synthesized record needs no special
  status because humans' own records have none. → cold-start
  invariants FM§73.
- **Most of a life leaves no trace.** Linton 1982's diary,
  Brewer 1988's randomly-sampled events, Wagenaar 1986's
  cue-asymmetry study: the retrievable residue of a life is
  a thin, cue-structured sample dominated by anchors and
  rehearsed gist — Conway & Pleydell-Pearce 2000's
  lifetime-periods knowledge vs event-specific episodics,
  Bahrick 1984 permastore. → shadow replay's sparse diet +
  era-density sampler's `era_floor_p` (FM§§71–72).
- **Era structure is graded, not painted.** Nelson & Fivush
  2004 / Tustin & Hayne 2010 (earliest memory ~3.5y) and
  Rubin & Schulkind 1997 / Berntsen & Rubin 2004 (bump,
  life script) are already anchors A05/A06 — Part IX's move
  is grading *synthesized* pasts against the same anchors:
  replay gets the shape emergently, the density sampler by
  construction, both checked (P986).
- **Methodology that isn't psychology but binds anyway.**
  Pearl 2009 (do() — borrowed mechanically); Law 2015 /
  Glasserman & Yao 1992 (common random numbers — paired-arm
  comparisons are the only honest way to measure a trait's
  effect in a stochastic sim); Efron & Morris 1977 +
  Gelman & Hill 2007 (shrinkage/partial pooling — with 8
  mains, per-head parameter claims shrink toward the
  population or they're noise); Gudjonsson 2003 and
  Unsworth 2019 supply the real trait covariances
  `pop_table_ver` may declare — and where the literature is
  silent, the table declares independence rather than
  inventing correlation.

## 72. v94 adds — social-memory X (the metaself: what I believe you think of me)

The survey gains the metaperception literature — the second
half of social perception (the first half, person-perception,
is already modeled as PersonModel). Key verified sources:

- **Kenny & DePaulo 1993** (*Psychol Bull* 114:145 —
  verified): the landmark SRM meta-analysis of
  metaperception. Three findings the spec encodes: (a)
  self-perception→metaperception correlation ≈ .87 —
  people infer how others see them mostly from their own
  self-view, NOT from feedback (the `meta_proj` prior);
  (b) generalized meta-accuracy (how others *in general*
  see me) ≈ .51 while dyadic meta-accuracy (how *this*
  person sees me) is near zero among strangers — evidence
  integration must be slow; (c) people overestimate
  consistency across perceivers — the metaself assumes a
  uniform audience.
- **Elfenbein, Eisenkraft & Ding 2009** (*Psychol Sci*
  20:1081 — verified): dyadic meta-accuracy for *being
  valued* does exist and runs through reciprocity —
  people introspect their own liking and infer its return
  (`meta_recip`); Eisenkraft, Elfenbein & Kopelman 2017
  (*Psychol Sci* 28:233 — verified) adds the channel
  dissociation: we know who likes us but not who competes
  with us (`compete_blind` ≈ 0 accuracy for everyone).
- **Boothby, Cooney, Sandstrom & Clark 2018** (*Psychol
  Sci* 29:1742 — verified): the liking gap — after
  conversations with new people, observers rate the actor
  as MORE liked than the actor estimates. Five studies;
  persists months in developing relationships
  (attenuating, not vanishing); mechanism is the actor's
  self-focused performance audit — the actor sees her own
  faults, the observer sees only the pleasant surface.
  The directional asymmetry (never a reverse gap) becomes
  `lgap_reverse_null`.
- **Bruk, Scholl & Bless 2018** (*JPSP* 115:192 —
  verified): the beautiful-mess effect — own
  vulnerability (confession, apologizing first, admitting
  error, asking help) is evaluated more negatively than
  the same act observed in another; construal-level
  account (concrete self vs abstract other). Encoded as
  the signed `bmess_k`/`bmess_obs` asymmetry.
- **Clark & Wells 1995** (reused): the cognitive model of
  social anxiety — self-focused attention and
  safety-seeking processing bias — grounds `lgap_k` and
  `meta_neg_w` trait loadings.
- **Honest limits marked:** the evidence-through-memory
  pathway (metaperception inherits ALL distortion of the
  underlying records) is our strong hypothesis, not
  literature; staleness-without-decay is asserted from
  retest stability, not measured drift; hypervigilant
  threat-metaperception deferred as a different
  mechanism. → SM Part X §§141–150.

## §73. Methodology appendix — validation science sources (v95)

Not memory psychology — the statistics of knowing whether a model
of memory is right. Sources behind validation-design.md §§194–199:

- **Talts, Betancourt, Simpson, Vehtari & Gelman 2020** (*Bayesian
  Analysis* 15:1257 — verified): simulation-based calibration; the
  rank-uniformity theorem and U/arch/tilt diagnostics. If our
  refit path can't recover parameters it generated itself, its
  claims about human anchors are noise.
- **Cook, Gelman & Rubin 2006** (*J Comput Graph Stat* 15:675 —
  verified): validating Bayesian software by replicating from the
  prior — the SBC precursor.
- **Chen et al. 1998** (*IEEE Softw* 15:20 — verified) + **Chen,
  Kuo, Liu, Poon, Towey, Tse & Zhou 2018** (*ACM Comput Surv*
  51:4 — verified): metamorphic testing — when no oracle exists,
  relations between outputs still must hold; an MR that can't
  fail is vacuous (our `mr_detect_min` tightness audit).
- **Jia & Harman 2011** (*IEEE TSE* 37:649 — verified): mutation
  testing survey; suite adequacy = mutant kill; equivalent-mutant
  caveat handled via family-level detect sets.
- **Open Science Collaboration 2015** (*Science* 349:aac4716 —
  verified): replication effects ≈ half the published size —
  justifies band-membership fitting + `rep_shrink` direction.
- **Klein et al. 2014** Many Labs (*Soc Psychol* 45:142 —
  verified): cross-site variance motivates precision-weighted
  anchor bands.
- **Page 1954** (*Biometrika* 41:100 — verified): CUSUM — the
  ancestor of the e-process drift watch (Howard et al. 2021
  supplies anytime-valid form).
- **Oberkampf & Trucano 2002** (*Prog Aerospace Sci* 38:209 —
  verified): verification vs validation distinction — our L0/SBC/
  golden layers verify; anchors/MRs/raters validate.

## §74. Eighth encoding-mechanics pass — stimulus, room, and past error (v96)

New sources and adjudications behind encoding-mechanics.md
Part VIII / spec v5.44:

- **Isola, Parikh, Torralba & Oliva 2011** + **Bainbridge,
  Isola & Oliva 2013 / Bainbridge, Dilks & Oliva 2017**
  (*NeuroImage* — verified): memorability is a stimulus
  property, consistent across observers (ρ≈0.7), ~50%
  unexplained by measured attributes. Encoded as the
  `memorab` event field + mandatory residual
  (`memorab_attr_null`). The sim's first encoder-INDEPENDENT
  E leg.
- **Shteynberg 2010** (JPSP) + **Eskenazi et al. 2013** +
  **Shteynberg 2015** (*Perspect. Psychol. Sci.* 10:579 —
  verified): believed co-attention deepens processing under
  matched exposure; minimal conditions under registered
  replication → `coattend_ingroup` is an open gate.
- **Greve et al. 2017** (*NeuroImage*) + **Quent, Henson &
  Greve 2021** + **Brod, Werkle-Bergner & Shing 2013**
  (verified): prediction error boosts the item–context
  ASSOCIATION for connectable mismatches — `pe_gain`/`pe_win`
  + `pe_conflate_null` (link-targeted only); schema-sparse
  encoders gain more.
- **Adcock et al. 2006** (*Neuron* 50:507) + **Wittmann et
  al. 2005** + **Murty & Adcock 2014** (verified): reward
  anticipation is a pre-stimulus encoding window, distinct
  from post-hoc value — `antic`/`antic_win` reopens the v40
  fold with the correct temporal structure
  (`antic_retro_null`).
- **Cook, Duffy & Fenn 2013** (*Psychol. Sci.* 24:1734) +
  **So et al. 2012** + Goldin-Meadow thread (verified):
  self-produced representational gesture at encoding —
  fourth engagement arm, smallest motor gain,
  `gest_beat_null`.
- **Henkel 2014** (*Psychol. Sci.* 25:396) + **Risko &
  Gilbert 2016** (*Trends Cogn. Sci.* — verified): the
  offloading impairment requires expecting the external copy
  to persist — `offloadTransient` gate on the v3.5 channel +
  `offload_noexp_null`; adoption scales with `device_dep`.
- **Warriner & Humphreys 2008** (*QJEP*) + **D'Angelo &
  Humphreys 2015** (*Cognition* 142:166–190 — verified):
  unresolved TOT dwell trains the error (~2× recurrence,
  one-week durability); self/cued resolution repairs, told
  answers don't — `err_strength` ledger + `tot_rescue_null`.
- **Nelson & Leonesio 1988** (*Am. Psychol.* 43) + **Cuevas &
  Dawson 2018** (verified): effort at fixed strategy moves
  JOL, not memory — `labor_vain_null`, third member of the
  negative-anchor class (with `intention`, `disfluency`).
- **Ward, Duke, Gneezy & Bos 2017** (*J. Assoc. Consumer
  Res.* — verified; replication record mixed): mere phone
  presence drains capacity — OBSERVE-tier `phone_drain`.
- **Honest limits marked:** co-attention minimal conditions
  openly debated (gate, not law); pe_win and antic_win
  magnitudes are RW formalization of directional findings;
  err_strength ledger mechanics are ours (the recurrence/
  durability facts are literature); phone_drain observe-tier
  on a contested base. → EM Part VIII §§96–109.

## §75. Ninth forgetting-curves pass — the aversion, the strength-clock, the flat forecast (v97)

- **Garcia & Koelling 1966** + **Bernstein & Webster 1980**
  (*Physiol. Behav.* 25:363) + **Bernstein 1978** (*Science*
  200:1302) + **Logue, Ophir & Strauss 1981** (*Behav. Res.
  Ther.* — all verified): conditioned taste aversion breaks
  the standard rules — one trial, hours of CS–US delay,
  novelty-weighted targeting (scapegoat protects the familiar
  diet), avoidance that outlives the episode. → spec §4.46
  (`illness_onset` backward-bind, `cta_somatic_null`,
  `cta_birth_null`); FC§41.1.
- **Dilevski, Paterson et al. 2021** (*JARMAC*) + **Danby,
  Sharman & Paterson 2022** (*Mem. & Cogn.*) + **Deck et al.
  2021** (*Memory* — verified): repeated-event series show
  boundary-instance advantage, proximity-graded detail
  confusion, and a delay-ordered first/last crossover → spec
  §4.47 (`series:{id,idx,n}`, first-only edge gain, adjacency
  misattribution); FC§41.4.
- **Hintzman 2004** (*Mem. & Cogn.*) + **Brown, Rips &
  Shevell 1985** (verified): when temporal tags fail, recency
  is INFERRED from residual strength — the lawful source of
  "I just saw her — actually months ago" after a retell →
  spec §5.96 (`recencyEstimate` log-map,
  `rec_verbatim_null`); FC§41.2.
- **Koriat, Bjork, Sheffer & Bar 2004** (*PNAS* 101:1100) +
  **Kornell & Bjork 2009** (*JEP:LMC*) + **Rhodes & Tauber
  2011** (verified): the stability bias — JOLs are nearly
  horizon-insensitive while accuracy declines, and practice
  barely corrects it → spec §5.97 (locked `jol_horizon_null`,
  `jol_exp_gain`); FC§41.3.
- **Rubin & Schulkind 1997** (*Mem. & Cogn.* 25:859) +
  **Janssen, Chessa & Murre** (recency-removal — verified):
  the midlife "trough" is the complement of bump+recency —
  asserted EMERGENT from firsts density, `trough_gain` as
  named fallback → FC§41.6, probe P1034.
- **Emergence note:** mislaid-item PI burial + script-default
  guesses (FC§41.5, P1033) — no new params.
- **Honest limits marked:** human CTA duration variable
  (clinical remission vs folk decades → `cta_beta` mid-range,
  `avoid` tag carries durability); `rec_scale` log-map is our
  form; `series_prox_w` coefficient ours. → FC Part IX
  §§41–45; probes P1027–P1034.
