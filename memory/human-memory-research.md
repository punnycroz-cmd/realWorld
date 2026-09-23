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
