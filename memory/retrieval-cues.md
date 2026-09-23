# Retrieval Cues — Literature Calibration for RW Memory Retrieval
**Track:** memory-research (sf/memory) — v2 focus deliverable
**Purpose:** the retrieval half of the model. v0 left retrieval as a plausible
weighted-sum heuristic; this doc grounds each cue type, each interaction, and
each failure mode in the experimental record, then calibrates the spec's
parameters. Tags: **[CONSENSUS]** / **[DEBATED]** / **[HYPOTHESIS]** (our
extrapolation). Spec changes land in `memory-model-spec.md` v0.2 §5.

---

## 1. The cue-dependency result that defines everything else

**Tulving & Osler (1968), "Effectiveness of retrieval cues in memory for
words"** (JEP 77:593–601): TBR words learned with weak-associate cue words are
recalled better *if and only if* the cue was present at both input and output.
Cues present only at output did **nothing** — and, critically, **two retrieval
cues presented simultaneously were no more effective than one**. Two hard
consequences for the spec:

1. A cue can only retrieve a memory if a corresponding feature was stored in
   the record's `cueVector` at encoding. Retrieval matching over fields the
   character never encoded must contribute exactly 0 — not a small bonus.
   (Already implied by the schema; v0.2 makes it an explicit gate, §5.1.)
2. Cue combination **saturates**: weighted-sum cue accumulation is wrong. Two
   overlapping cues do not double the lift. v0.2 replaces the linear sum with
   a noisy-OR (probabilistic union): `cueMatch = 1 − Π_j(1 − w_j·overlap_j)`
   (§5.2).

**Tulving & Thomson (1973), encoding specificity** (Psych Review 80:352–373):
the copy of a studied word is often a *worse* retrieval cue than the
weak associate it was studied with — the "recognition failure of recallable
words" phenomenon (quantified as a lawful function by Tulving & Wiseman 1975;
Muter 1978 found ~53% recognition failure of subsequently *recallable* famous
names). **[CONSENSUS]** Consequence: "did you see X?" (person/object copy cue)
can fail where a contextual cue ("remember when we argued about rent?")
succeeds. Recognition-mode retrieval should weight verbatim/copy fields
differently from recall-mode retrieval — spec §5.6.

**Watkins' cue-overload principle** (Watkins & Watkins 1975, JEP:HLM): a cue's
effectiveness declines as the number of items it subsumes grows — the same
mechanism Anderson (1974) formalized as the **fan effect** (retrieval latency
and failure rise with the number of facts hanging off one cue; ACT-R fits
make activation decay *logarithmically* in fan — Anderson & Reder 1999,
JEP:LMC 25). **[CONSENSUS]** v0.2 changes the linear `/(1+fan)` divisor to a
log fan: `denominator = 1 + fan_k·ln(1+fan)` — shallower at small fan, never
killing the cue entirely (Radvansky et al. 1993 showed the fan effect weakens
when items integrate into a single situation model — i.e., merged/generic
memories count as ONE fan item, giving §4.3 genericization a functional
payoff).

## 2. Context and place

- **Godden & Baddeley (1975)** divers: free recall was reliably better when
  study and test environments matched (wet/wet, dry/dry beat mixed) — the
  canonical environmental reinstatement result. The raw advantage in the
  original was on the order of 30–40% more words recalled in matched context.
- **Smith & Vela (2001) meta-analysis** (93 effect sizes, 41 articles):
  environmental context effects are reliable but **modest** — overall d ≈ 0.28;
  reinstatement paradigm d ≈ 0.23; interference-reduction paradigm d ≈ 0.68;
  effect grows with retention interval and shrinks when noncontextual cues
  overshadow at input or outshine at test; **mental reinstatement** of context
  at test recovers most of the physical-reinstatement benefit.
  **[CONSENSUS that effect is real but small]**
- Model consequence: returning to the encoding place is a real but bounded
  boost (`place_reinstate` ≈ +0.10–0.20 additive cue mass pre-saturation, and
  it should be *larger for older memories* — the meta-analysis's interval
  interaction). A character mentally picturing the place (reconstruction
  attempt by a co-conversationalist) earns a fraction (`mental_reinstate` ≈
  0.6×) of the physical bonus. Context cues lose out when strong topical
  cues are present — outshining is naturally produced by the noisy-OR's
  saturation, no extra mechanism needed.

## 3. Sensory cues — the Proust asymmetry

- **Chu & Downes (2000)** Cognition 75:B41–50: label-cued autobiographical
  memories peak in the standard bump (ages 11–25); **odor-cued memories peak
  at ages 6–10** and decline linearly — odor cues reach *older, rarer*
  memories than verbal cues do.
- **Chu & Downes (2002)** Mem&Cog 30:511–518 ("Proust nose best"): odor-cued
  AMs yield **more detail** and higher emotional-quality ratings than label-,
  visual-, or incongruent-odor-cued ones; incongruent odors actually
  *depressed* detail vs. baseline.
- Larsson, Willander et al.'s **LOVER** summary (2014): odor-evoked AMs are
  Limbic, Old, Vivid, Emotional, Rare. Whether odor is "the best" cue overall
  is **[DEBATED]** (Herz 2012) — but the age-shift and emotional loading are
  robust.
- Model consequence: `w_sensory` stays small for fresh records but must
  **scale with record age**: a sensory match on a decades-old record reaches
  memories that topical cues can't. v0.2 adds `sensory_age_slope` (≈0.5–1.5,
  older adults higher — consistent with the profile's existing Proust note).
  Congruence requirement: a *wrong* sensory cue doesn't merely fail to help —
  apply a small penalty (`sensory_mismatch_pen` ≈ 0.05) to cueMatch when a
  salient sensory field mismatches.

## 4. Mood and state cues — two different effects the v0 spec conflated

- **Mood-congruent recall** (valence of memory × current mood): Matt, Vázquez
  & Campbell (1992) meta-analysis — reliable, dh ≈ −0.19 clinically depressed,
  +0.15 normative positive asymmetry. **[CONSENSUS]** (v0 already models this
  as `stateBonus`; keep.)
- **Mood-state-dependent retrieval** (mood at *encoding* × mood at retrieval):
  Eich (1989) meta-analysis — real but **small and fragile**; strongest with
  real-life material, contrasting moods, and — critically — **abolished when
  strong observable external cues are present** (Eich & Metcalfe; Mecklenbräuker
  & Hager 1984, Exp. 2–3 demonstrated both the effect and its erasure by
  external cues). **[DEBATED but real; bounded]**
- Model consequence: state-dependence is a *weak* cue that only expresses
  when external cueMatch is low. v0.2: add `encodeMood` to the record schema
  (valence of the character's mood at encoding, not the event's) and
  `w_msd` (≈0.05–0.15) whose contribution is multiplied by
  `(1 − cueMatch_external)` — observable cues override state, per the
  erasure experiments.

## 5. Involuntary retrieval — the default mode, not the exception

- **Berntsen** program: involuntary autobiographical memories are universal
  and frequent — 2–5/day typical retrospective estimate (Berntsen 2009),
  and **on-line counting showed involuntary memories ~3× more frequent than
  voluntary ones** (Rasmussen & Berntsen 2011? — reported in Berntsen,
  Staugaard & Sørensen 2013, Consciousness & Cognition 22:920; n=48,
  mechanical counter). They arise under **unfocused attention**, daydreaming,
  boredom — not during effortful search.
- Rubin & Berntsen (2009, large stratified Danish sample): involuntary and
  voluntary remembering of important events are roughly equally frequent when
  the *same event* is tracked — i.e., importance modulates both modes.
- PTSD: involuntary intrusions are the pathology-scale version (Brewin et al.
  1996) — same machinery, threat-tagged records, higher rate.
- **[CONSENSUS on frequency and attention-dependence; HYPOTHESIS for exact
  trigger distribution]**
- Model consequence: retrieval must run **ambiently**, not only when
  conversation demands it. v0.2 §5.7: a per-tick involuntary scan — any record
  whose saturated cueMatch exceeds `intrusion_thresh` (≈0.75, lower under
  stress: trauma modifier multiplies it down ~0.15) and whose current mood
  state is unfocused can surface spontaneously. Characters *get reminded of
  things* without looking — this is the engine of "suddenly remembering on a
  cue" in the user brief.

## 6. Part-list cuing and social retrieval

- **Part-list cuing impairment** (Roediger 1973; Slamecka 1968): presenting
  some list items as cues *impairs* recall of the rest. In conversational
  terms: when someone narrates their version of an event, the listener's
  own un-cued details get suppressed — a second mechanism (besides §6.3
  misinformation merge) by which co-discussion rewrites memory.
  **[CONSENSUS for short retention intervals; at week-long delays effects
  attenuate or reverse (Bäuml & colleagues) — DEBATED for autobiographical
  scale]**
- Model consequence: in `discussEvent`, fields the speaker covered get the
  misinformation-merge treatment; fields the speaker *omitted* get a small
  suppression (`plist_suppress` ≈ 0.05 strength hit + temporarily reduced
  retrievability). Same code path as retrieval-induced forgetting — a speaker
  IS a part-list cue.

## 7. What cues are worth — consolidated hierarchy

Evidence ordering across Wagenaar (1986), encoding-specificity results, and
context literature:

| Cue field | Effectiveness | Notes |
|---|---|---|
| topic/gist content | strongest | Wagenaar "what" dominance; self-relevant topics strongest |
| people present | strong ≈ place | social cue; teen profiles overweight |
| place reinstatement | strong when matched, small absolute | d≈0.23 reinstatement; grows with age of memory |
| sensory (esp. odor) | weak for recent, uniquely strong for old | age-6–10 bump; LOVER |
| mood-state match | weak, suppressed by external cues | Eich meta; erasure result |
| era/when | weakest | humans misdate monotonically (v1) |
| narrated part-list | helps cued fields, hurts uncued | §6 above |

## 8. Calibration targets and validation probes

Implementable acceptance tests (extend P1–P8 from `forgetting-curves.md`):

- **P9 (cue gating):** a retrieval context rich in features the record never
  encoded (empty cueVector fields) must yield cueMatch ≈ 0 — recall fails
  despite "strong" context. Tulving & Osler.
- **P10 (saturation):** doubling matched cue fields should raise P(recall) by
  <1.6×, not 2×. Tulving & Osler two-cue result.
- **P11 (place reinstatement):** same memory probed in encoding-place vs.
  neutral context: ΔP ≈ +8–15% absolute for month-old records; smaller for
  day-old. Smith & Vela.
- **P12 (Proust age shift):** sensory-cued retrievals of an older-adult
  character should return records with median age ≥ 2× the median age of
  topic-cued retrievals. Chu & Downes 2000.
- **P13 (mood-state erasure):** with high external cueMatch, mood match/mismatch
  must move P(recall) < 3%; with low external cueMatch, up to ~10%. Eich.
- **P14 (involuntary rate):** an uneventful ambient day in a familiar place
  should surface 2–5 involuntary recalls per main character; a trauma-modified
  character in a trauma-cued context ≥ 2× baseline. Berntsen.
- **P15 (part-list suppression):** after `discussEvent`, listener's unspoken
  verbatim fields show measurably lower next-day recall than non-discussed
  controls. Roediger 1973.
- **P16 (recognition failure):** a memory retrievable by topic+place cues must
  sometimes (~10–20% of qualifying cases) fail when probed by the person-copy
  cue alone. Tulving & Thomson 1973.

## 9. Honest limits

- Fan/cue-overload numbers come from associative-list paradigms; the log
  divisor is the ACT-R-consistent functional choice, not a fitted constant —
  `fan_k` is a tuning parameter.
- Odor effects are measured on verbal-cue baselines; whether sensory beats
  *person* cues in rich social contexts is untested — we keep sensory
  subordinate to topic/people at equal record age.
- Involuntary-retrieval frequencies are diary-scale (per day), not per-tick;
  `intrusion_thresh` is set to produce plausible daily counts, not fitted.
- Context-dependence in *emotional-rich* autobiographical events may exceed
  Smith & Vela's word-list d≈0.28 (their stimuli were impoverished); we take
  it as a floor.
