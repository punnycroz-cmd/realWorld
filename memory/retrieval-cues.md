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

---

# PART II (v14, 2026-09-23) — the cue's job description

v2 answered "which cues work." v14 answers the harder questions the first
pass left informal: does the cue match the *kind* of processing done at
encoding (§10), what does asking for EVERYTHING do to what comes back
(§11), how do intentions fire — cue-driven vs clock-driven (§12), does
extinguished affect really die or just go dormant per-place (§13), how do
tip-of-the-tongue states resolve and why do they recur (§14), can a
retrieved memory itself be the cue (§15), and does what the character
sleeps near decide what survives the night (§16). Spec changes land in
`memory-model-spec.md` v1.4 §5.12–5.18; probes P127–P135.

## 10. Transfer-appropriate processing — a cue matches a PROCESS, not a thing

**Morris, Bransford & Franks (1977)** JVLVB 16:519–533: semantic study
tasks produce better semantic-test performance and *worse* rhyme-test
performance than rhyme study — and vice versa. Encoding specificity
(§1, Tulving & Thomson) says cue must match stored features; TAP says it
must match the stored *processing type*. The two are complementary —
TAP is specificity at the level of operations rather than items
(Roediger, Weldon & Challis 1989; Roediger 1990 dissociations between
data-driven and conceptually-driven tasks). **[CONSENSUS for the
dissociation; the size of the penalty is paradigm-dependent — DEBATED]**

Model consequence: the record schema gains `encodeOps` in v1.4 — the
elaboration channel that fired at encoding (semantic / perceptual /
social / enactive), derived from the v1.2 `engagement`/elaboration
fields. v1.4 uses it on the retrieval side: the context's
dominant processing channel `C.ops` is compared to `m.encodeOps` and
mismatch attenuates the WHOLE external match multiplicatively
(`tap_mismatch` ≈ 0.55) rather than zeroing it — TAP never abolishes
recall, it reshapes which cue wins. A character who lived an event
perceptually (a fight they froze through) is better cued by returning to
the alley than by talking about "that night"; a character who narrated
it to themselves is better cued by the topic. This is the mechanistic
basis for why the same event is differently reachable for witnesses who
encoded it differently.

## 11. Output interference — "tell me everything" is self-defeating

- **Tulving & Arbuckle (1963/1966):** cue effectiveness drops sharply as
  output order advances; items recalled early are recalled well, items
  recalled late are recalled poorly — the FIRST outputs are nearly free,
  later outputs suffer cumulative loss.
- **Roediger & Schmidt (1980)** JEP:HLM 6:91–105: output interference is
  caused by the emitted items themselves acting as part-list cues on the
  remainder — the damage is a function of how much has already been
  recalled, not elapsed time (interpolated unrelated output doesn't hurt;
  interpolated *same-category* output does).
- **Criss, Malmberg & Shiffrin (2011)** JML 64:316 — output interference
  is best modeled as retrieval-induced context change: each response
  updates the search set.
- **[CONSENSUS]** Model consequence: a multi-item recall bout is NOT k
  independent draws. v1.4 §5.13: candidates sorted by drive, the n-th
  emitted item's P scaled by `out_int^(n−1)` (`out_int` ≈ 0.85 — ~15%
  compounding loss per emitted item), and each emitted item applies the
  §5.8 rif_k decrement to unretrieved competitors in the same bucket.
  Game-readable consequence: "tell me everything about that night"
  returns the 2–3 strongest details richly and then trails off — and the
  trailing-off is REAL forgetting, the unspoken details are weakened for
  tomorrow (§5.8). Interrogation-style exhaustive prompting is the worst
  possible way to get a human's full account — matching the eyewitness
  literature's preference for free narrative first (Fisher & Geiselman
  cognitive-interview program).

## 12. Prospective cue ecology — two different machines for "remember to"

The spec's `beta_pm` (v1.3) decays the armed intention, but nothing yet
decides whether the cue fires. The literature splits prospective memory
into two retrieval routes with different cue requirements:

- **Event-based PM** (cue in the environment): Einstein & McDaniel (1990)
  JEP:LMC 16:717 — older adults showed NO deficit on event-based PM while
  showing large deficits on retrospective memory; the cue does the work.
- **Time-based PM** (no external cue): same paper's successors — Park et
  al. (1997), Einstein et al. (1995) — time-based PM is reliably
  age-impaired because nothing cues it; retrieval must be *self-initiated*
  (clock checks).
- **Multiprocess framework** (McDaniel & Einstein 2000, Applied Cog Psych
  14:S127; Henry, MacLeod, Phillips & Crawford 2004 meta, Psych & Aging
  19:27 — 117 effect sizes): focal cues (the cue is exactly what ongoing
  processing is about — seeing the mailbox when walking past it) trigger
  near-automatic spontaneous retrieval; nonfocal cues (the cue is present
  but peripheral) require costly monitoring. Age damage concentrates on
  nonfocal and time-based; focal is spared but NOT immune (meta: both
  impairment classes >0).
- **[CONSENSUS on the focal/nonfocal and event/time asymmetries]**
- Model consequence (§5.14): intention records gain `cueType` and
  `focal`. Event+focal → fires on context match at `pm_focal_hit` ≈ 0.9
  (age-flat). Event+nonfocal → fires only on a monitor roll
  `pm_monitor_p` ≈ 0.4, scaled down by distraction and age.
  Time-based → no cue at all; a `pm_clock_p` ambient clock-check draw
  per tick, window-gated, older characters check less
  (`pm_time_age_loss` ≈ 0.4). RW texture: a character told "give Jules
  this envelope when you see him" succeeds almost always; "call the
  landlord at 5" is forgotten exactly in proportion to how busy and how
  old the character is — the classic prospective-paradox pattern already
  probed by E10, now mechanized.

## 13. Renewal — extinction is context-scoped, not global

§4.9 already fades conditioned affect with `cond_decay` and suppresses it
with `extinct_suppress`, and `recovery_days`/`recovery_frac` give Bouton's
spontaneous recovery. What was missing is Bouton's central finding
(**Bouton 2004**, Psych Bulletin 130:80; Bouton, Westbrook, Corcoran &
Maren 2006): extinction is a *new inhibitory association bound to the
context of extinction*, not erasure. ABA renewal — fear conditioned in A,
extinguished in B, returns in A — is robust across species and paradigms;
ABC and AAB variants are weaker but present. **[CONSENSUS]**

Model consequence (§5.15): `extinct_suppress` applies only inside the
context(s) where the extinction exposures happened — store
`extinctCtx[]` on the conditioned-affect record. In any other context
the conditioned response returns at `renewal_frac` (≈0.6) of its
pre-extinction strength. A character who "got over" Dolores Park after
weeks of calm visits still feels it in the alley where it happened —
calm was learned *in the park*. Trauma records keep their exemption
stack (§5.8, §6.x); renewal is the emotional memory that doesn't fade
because it never generalized.

## 14. TOT resolution and TOT recurrence — partial cues and error learning

- **Abrams, Trunk & Merrill (2007)** Mem&Cog 35:538 (+ Abrams & Rodriguez
  2005): TOTs resolve via PHONOLOGICAL priming — first-SYLLABLE primes
  significantly increase resolution; first-LETTER primes do not.
  Semantic associates alone don't crack it. **[CONSENSUS, lab-verbal
  paradigm]**
- **Warriner & Humphreys (2008)** QJEP 61:738 — "learning to fail": a
  TOT that persists unresolved is itself implicitly learned; the same
  item TOTs again ~2× baseline rate on retest 48h later, scaling with
  dwell time in the state. Follow-ups (D'Angelo & Humphreys 2015;
  Frontiers 2019 replication) confirm error repetition and find the same
  wrong *interlopers* recur. **[CONSENSUS on repetition; mechanism —
  implicit learning vs. local minimum — DEBATED]**
- Model consequence (§5.16): the §5.5 `tot:true` flag becomes stateful.
  A failed name-field retrieval stamps `tot_count`; next attempt on that
  field rolls against `tot_rate × tot_persist` (≈1.5). A syllable-class
  cue (someone offers "it starts with 'Mar-…'") resolves at
  `tot_resolve_p` ≈ 0.3; a letter-only cue at `tot_resolve_p/3`;
  extra semantic description of the person adds ~0. And a character who
  blanks on a name at dinner will plausibly blank on the SAME name next
  week — one of the most recognizable human memory behaviors, now
  parameterized.

## 15. Reminding — a retrieved memory is itself a cue

Contiguity (§5.4, v0.9) lets a recalled record cue its TEMPORAL
neighbors. But the dominant everyday case is associative: "that reminds
me of…" — a retrieved record's associative links (link_p edges, §2)
re-expose the retriever to the parent's cue pattern, giving linked
records a second chance even when the current context doesn't cue them.
Temporal-context models already show recall of an item reinstates the
context that cues the next (Howard & Kahana 2002 — the basis of
contiguityTerm); associative chaining generalizes the same machinery to
non-temporal links. **[CONSENSUS that remindings occur and drive free-
recall organization; the two-hop attenuation constant is HYPOTHESIS]**

Model consequence (§5.17): on a successful recall, emit a derived
context `C′ = parent.cueVector` restricted to linked records, scored at
`chain_gain` ≈ 0.5 of normal drive, depth capped at 1 (two hops is a
digression, not memory). Reminded records undergo normal §5.9
reconsolidation — being reminded strengthens. This produces the
reminiscence cascade as a social phenomenon: one character's story pulls
up the other's related story unprompted.

## 16. Sleep cuing — the overnight cue that votes on what survives

**Rasch, Büchel, Gais & Born (2007)** Science 315:1426: odor present at
learning and re-presented during slow-wave sleep improved declarative
retention; the same odor during REM or wake did nothing, and odor absent
at learning did nothing — reactivation during SWS is cue-dependent and
encoding-specificity-bound. Replications/extensions (Rudoy et al. 2009
sound cues; meta-analyses — Hu, Cheng & colleagues 2020 — moderate but
reliable d ≈ 0.3–0.4) support targeted memory reactivation as real but
bounded. **[CONSENSUS that cuing during SWS biases consolidation toward
cued records; effect size modest]**

Model consequence (§5.18): during the nightly consolidation tick (§4.6),
records sharing a salient sensory cue with the SLEEP context get an
extra `tmr_gain` (≈0.12) on the consolidation boost — declarative only,
procedural exempt (Rasch null), cue-absent-at-encoding records exempt
(the Rasch no-odor control). RW texture: sleeping in the apartment where
the day happened, or next to the same person, biases what consolidates.
A cheap, invisible mechanic that makes "where you sleep" matter.

## 17. Updated cue hierarchy (supersedes §7 table where marked)

| Cue field | Effectiveness | v14 additions |
|---|---|---|
| topic/gist | strongest | modulated by TAP match (§10) |
| people present | strong ≈ place | unchanged |
| place reinstatement | strong matched, small absolute | unchanged; also gates renewal (§13) |
| sensory/odor | weak recent, strong for old | ALSO consolidates during sleep (§16) |
| mood-state match | weak, erasable | unchanged |
| process-type match | NEW — multiplicative gate on all above | tap_mismatch ≈0.55 |
| emitted items in same bout | NEW — negative cue on remainder | out_int ≈0.85/item |
| prospective cue, focal | NEW — near-automatic | pm_focal_hit ≈0.9, age-flat |
| prospective cue, nonfocal/time | NEW — monitoring-dependent | age-impaired |
| retrieved parent record | NEW — derived cue for links | chain_gain ≈0.5 |
| phonological (syllable) | NEW — resolves TOT only | tot_resolve_p ≈0.3 |

## 18. Validation probes P127–P135 (v14 suite)

- **P127 TAP gate (MUST):** matched `encodeOps`/`C.ops` vs mismatched at
  equal cueVector overlap → recall ratio ≥1.5, and a cue absent at
  encoding still contributes 0 under either ops match (P9 must hold
  simultaneously). Morris, Bransford & Franks 1977.
- **P128 output interference (MUST):** exhaustive multi-item recall
  returns fewer total fields than the sum of item-wise single recalls;
  returned order is drive-descending; unreturned competitors measurably
  weakened next day (couples to §5.8). Roediger & Schmidt 1980.
- **P129 focal vs nonfocal PM (MUST):** event+focal intention hits
  ≥0.85; event+nonfocal ≤0.6 under distraction, in the same character.
  Henry et al. 2004.
- **P130 PM age gradient (MUST):** time-based PM hit-rate declines
  across bands while event+focal stays ~flat (decline allowed, ≤0.15
  absolute). Einstein & McDaniel 1990; Henry et al. 2004.
- **P131 ABA renewal (SHOULD):** conditioned affect extinguished in
  context B recurs at ≥0.5 of pre-extinction strength on returning to A;
  within-B it stays suppressed until `recovery_days`. Bouton 2004.
- **P132 TOT resolution asymmetry (SHOULD):** syllable cue resolves a
  flagged TOT at ~0.3; letter cue ≤ one-third of that; added semantic
  description ≈ 0. Abrams et al. 2007.
- **P133 TOT recurrence (SHOULD):** a field that TOT'd unresolved re-TOTs
  at 1.5–2.5× `tot_rate` on the next attempt; a resolved TOT does not
  (error repetition is specific to the error, not the item). Warriner &
  Humphreys 2008.
- **P134 reminding chain (SHOULD):** retrieving a record surfaces each
  linked record at ≈`chain_gain`×parent-driven probability; no depth-2
  surfacing; reminded record's §5.9 boost applies.
- **P135 sleep cuing (SHOULD):** day-old records sharing the sleep
  context's sensory cue show +8–15% next-day R vs non-matched controls;
  procedural records and encoding-absent-cue records show null (Rasch
  et al. 2007). OBSERVE-tier for magnitude, SHOULD for direction.

## 19. Honest limits (v14 additions)

- TAP's mismatch penalty is a single-study-adjacent constant (0.55);
  paradigms give reliable direction, not a fixed number — flagged for
  calibration.
- Output-interference constants come from list recall; autobiographical
  multi-event recall plausibly shows shallower slopes (situation-model
  integration, Radvansky) — `out_int` is a floor on damage.
- PM numbers are lab-paradigm; the focal/nonfocal distinction assumes
  the game can classify cue focality at runtime — spec defines focality
  as "cue is the object of current attention," which game-systems can
  evaluate from the attention budget.
- Renewal literature is mostly fear-conditioning; extending to
  character-level affect is an extrapolation (marked).
- TMR uses controlled odor cues; "sleep context" as cue is a design
  extrapolation — the mechanism (SWS reactivation of cue-matched
  declarative records) is real, the RW trigger is our hypothesis.
- Reminding chains: lab evidence is for temporal-context reinstatement;
  the non-temporal associative version is standard theory (spreading
  activation) but `chain_gain` is a tuning constant.

---

# PART III (v26, 2026-09-23) — what a cue IS, mechanically

Parts I–II priced cue fields and cue contexts. Part III goes one level
down: what makes a cue diagnostic at all (§20), what the emission
competition actually computes (§21), why retrieval practice beats
re-exposure and when (§22), the shape of a good rehearsal schedule
(§23), the cue-INDEPENDENT forgetting that suppression produces (§24),
the different cue diet of involuntary retrieval (§25), what an armed —
or completed — intention does to the whole cue field (§26), where the
age deficit actually lives (§27), and two retrieval-experience
phenomena that bend judgment itself (§28–§29). Spec changes land in
`memory-model-spec.md` v2.6; probes P241–P250.

## 20. Cue diagnosticity — the match is not the mechanism

The Part I framework treats a cue's weight as a property of its FIELD
(`w_topic`, `w_place`, …). The diagnosticity literature says that is
incomplete: what matters is how well the cue picks THIS record out of
the corpus.

- **Nairne (2002), "The myth of the encoding-retrieval match"**
  (Memory 10:389–395): cue effectiveness is governed by the
  *distinctiveness of the cue–target relationship*, not by the
  encoding-retrieval match per se — match and performance can be
  decorrelated when diagnostic value is manipulated orthogonally.
- **Poirier, Nairne, Morin, Zimmermann, Koutmeridou & Fowler (2012)**
  (JEP:LMC 38:16–29), "Memory as discrimination": four experiments
  orthogonally crossing cue-target discriminability with match
  degree — increasing the encoding-retrieval match can *hinder*
  retrieval when the increased match makes cues less uniquely
  predictive. Retrieval is discrimination, not resonance.
- **Goh & Lu (2012)**, "Testing the myth of the encoding-retrieval
  match": same result in cued recall — diagnostic value (cue-overload
  manipulation) predicts performance better than absolute match.
- **[DEBATED as a replacement for specificity — Nairne's framing says
  diagnosticity, not match, is causal; we adopt BOTH: §5.1 gating is
  the match's surviving role (an unencoded cue still contributes
  exactly 0 — P9 stands), and diagnosticity sets the cue's
  magnitude.]**

Model consequence (§5.2 amendment): each matched field's contribution
is blended with a corpus-relative diagnosticity term computed from the
§4.2 cue buckets (no new store — `df_j` = count of live records
carrying that cue key):

```
idf_j  = min( −ln(df_j / N_live), ln(diag_cap) )
c_j    = w_j·overlap_j · (1 − diag_w + diag_w·idf_j/ln(diag_cap))
```

`diag_w` ≈ 0.5, `diag_cap` ≈ 2 (a maximally-rare cue contributes at
most ~2× its field weight; a universal cue contributes ~(1−diag_w)×).
"The kitchen" cues every record in the house — it should barely move
the needle; "the night the ficus fell" should nearly retrieve by
itself. This gives the fan effect (§5.4) a second, principled face:
fan counts competitors on the dominant cue, diagnosticity prices the
cue itself.

## 21. Competitive emission — the ratio rule under the bout

The Part II bout model (§5.13) emits greedily down a sorted drive
list. The global-matching tradition (SAM: **Raaijmakers & Shiffrin
1980/1981**, Psych Review 88:93; **Gillund & Shiffrin 1984**) specifies
a cleaner engine: retrieval is *sampling*, proportional to relative
activation, with *recovery* (an item must be sampled AND intact enough
to image), and the search ends after consecutive failures.

```
emission loop for a recall bout (and for the §5.7 ambient scan's
competition):
    P(sample i) = drive'_i^sam_tau / Σ_j∈bucket drive'_j^sam_tau   // ratio rule
    sampled i emits at P(recall) from §5.4; a sampled-but-failed
    draw counts toward kmax
    stop after kmax consecutive failed samples (≈3) or
    lmax total samples (lmax = search_breadth — reuse, frozen)
```

- Competitors sharing the cue lower P(target) *by construction* — cue
  overload becomes emergent competition, with the §5.4 log-fan divisor
  retained as the cheap approximation for single-shot scoring.
- A high-drive near-miss is sampled preferentially — wrong-but-strong
  retrievals (the plausible neighbor of the true memory) need no extra
  machinery. `sam_tau` ≈ 2.
- **[CONSENSUS as a family (ratio-rule global matching); the specific
  constants are HYPOTHESIS tuning — SAM was fit on list recall.]**

## 22. Retrieval practice — recall is not re-exposure

The §5.9 split (s_gain_recall vs s_gain_rehear) asserted the asymmetry;
v26 prices it and adds its delay-dependence.

- **Roediger & Karpicke (2006)** Psych Sci 17:249 — testing beats
  restudy at a 1-week retention interval while restudy beats testing
  at 5 minutes: the advantage is *delay-gated*.
- **Rowland (2014)** Psych Bulletin 140:1432 meta-analysis (169
  comparisons): retrieval practice vs restudy g ≈ 0.50 overall,
  attenuating with matching processing and strong item-context cues.
- **Pyc & Rawson (2009)** JML 60:437 — the retrieval-effort
  hypothesis: *more difficult successful* retrievals produce larger
  gains (long ISI: .87 vs short ISI .62 final recall), with
  diminishing returns as the retrieval criterion rises. The §5.9
  `(1−R_pre)` difficulty weight already encodes this direction; v26
  confirms the parameterization and adds the gap term.
- **[CONSENSUS on direction and delay-gating; the ratio constants are
  HYPOTHESIS.]**

Model consequence (§5.9 amendment):

```
re-exposure leg (hearAccount, re-reading, being narrated at):
    s_gain_eff = s_gain_recall · reexp_ratio        // ≈0.35
delay-gated recall leg:
    s_gain_eff = s_gain_recall · (1 + test_gap_gain·log1p(gapDays))
    gapDays = now − m.lastAccessDay;                // ≈0.3
    // same-day retrieval ≈ re-exposure — the crossover, not a bonus
    // that fires on massed retellings (§4.13 lag curve unchanged)
```

RW texture: a rumor *heard* twelve times stays weaker than a story the
character once painfully dug up themselves. Passivity is cheap;
retrieval is the workout.

## 23. Expanding retrieval — the schedule's second derivative

- **Landauer & Bjork (1978)**: expanding-interval practice
  (retrieval at growing gaps) outperforms equal spacing for durable
  retention; the first success should come while the trace is still
  easy, later ones as it fades.
- **Cepeda, Vul, Rohrer, Wixted & Pashler (2006)** meta (839 tests):
  optimal gap scales with the desired retention interval (the §4.11
  `lag_opt_ratio` mechanism — unchanged). Expanding-vs-equal
  superiority is **DEBATED** for long retention intervals (Karpicke &
  Roediger 2007 find equal-or-better); the massed-vs-either asymmetry
  is consensus.

Model consequence (§4.13 amendment, one flag): a retell/rehearsal whose
gap since `lastAccessDay` *exceeds the record's previous access gap*
gets its s_gain × `expanding_bonus` (≈1.15). Records track only
`prevGapDays` (one new hidden field). A character who tells the story
tonight, next week, then next month cements it better than one who
tells it every day for a week — the retell ecology now prices the
*schedule*, not just the count.

## 24. Suppression-induced inhibition — the cue-independent forgetting

§4.12's `suppressEvent` is cue-side: steering away raises θ against
that cue. The Think/No-Think literature documents a second, stronger
claim — suppression weakens the *trace* for ALL cues.

- **Anderson & Green (2001)** Nature 410:366 — after 16 no-think
  repetitions, recall drops ~8–9% *below baseline*; the deficit grows
  with suppression count, resists incentives, and — the signature —
  appears on **independent probes** (cues never paired with the item
  at study). Cue-independent impairment ⇒ trace-level inhibition, not
  cue competition.
- **DEBATED as robustness:** Bulevich, Roediger, Balota & Butler
  (2006) reported three failures to replicate; later meta-analyses
  keep a small positive effect. Anderson & Huddleston (2012) review
  the supporting program. We adopt a bounded, conservative version.
- **[CONSENSUS that deliberate suppression can produce small
  below-baseline impairment; DEBATED magnitude; the independent-probe
  signature is the design's falsifiable core.]**

Model consequence (new §5.23): when `suppressEvent` fires on a record
whose cue WAS in the active context (a real no-think bout, not mere
topic-avoidance), the record accrues `inhib += tnt_inhib` (≈0.02, cap
`tnt_cap` ≈ 0.2 — sixteen bouts ≈ the Anderson & Green endpoint).
`inhib` is a flat R-side decrement applied *before* cue scoring — it
lowers P for every cue equally (the independent-probe property).
Emotional/trauma records resist (×0.3 — the metas' consistent
moderator). Distinct from §4.12: that channel makes *this cue* fail;
this channel makes *the memory* weaker however probed. Never deletion,
never §6.19 repression — effortful, cue-present, bounded (P245
sign-locks both properties).

## 25. The involuntary cue diet — different weights, not just a trigger

§5.7's ambient scan reuses the voluntary cue weights. The diary
literature says involuntary retrieval eats a different diet.

- **Berntsen & Hall (2004)** Mem&Cog 32:789: identifiable cues for
  most involuntary memories; classified 53% external / 27% internal /
  20% mixed — and involuntary memories are *more often specific
  episodes*, more unusual events, with more physical reaction and more
  mood impact than voluntary word-cued memories. Concrete perceptual
  overlap, not thematic match, does the triggering (Berntsen 2009;
  Mace 2004).
- **Schlagman, Kvavilashvili & Schulz (2007)**: involuntary-memory
  rates are roughly **age-invariant** while voluntary recall declines
  — the automatic route is spared where the search route is not.
- **[CONSENSUS on the cue-type skew and the specificity; age-invariance
  solid for healthy cohorts.]**

Model consequence (§5.7 amendment): the ambient scan applies its own
weighting — sensory/peripheral fields (sensory, place, people-present)
× `invol_periph_gain` (≈1.6), abstract/topic × `invol_topic_pen`
(≈0.7); and the surfacing draw prefers verbatim-rich records
(bias ∝ surviving verbatim field count — involuntary pops are
*specific*). `intrusion_thresh` is henceforth **age-flat by rule** —
the old-side knots are removed from it; age differences in spontaneous
recall enter through `search_breadth`, not the threshold (Schlagman
et al.). A cue you weren't looking for is precisely the kind a smell
provides; a theme is what you search with, not what ambushes you.

## 26. Intention ecology II — superiority, tax, and the ghost of a done plan

§5.14 priced *whether* the cue fires. The intention literature adds
three behaviors of the armed state itself.

- **Intention superiority** — Goschke & Kuhl (1993): material related
  to a pending self-performed intention is hyper-accessible (faster
  recognition than neutral material). Marsh, Hicks & Bink (1998)
  JEP:LMC 24:350 replicate for uncompleted intentions — and find
  *completed* intentions are INHIBITED below neutral (Experiment 2–4).
- **Monitoring cost** — Smith (2003) JEP:LMC 29:347, "the cost of
  remembering to remember": an embedded event-based intention slows
  the ongoing task even on non-target trials — holding a nonfocal
  intention is not free.
- **Commission errors** — completed or canceled intentions still fire
  when the cue reappears: ~25% of participants repeat the response
  after being told the task is finished (Walser et al. 2012; Scullin,
  Bugg & colleagues — worse under habitual prior responding, divided
  attention, and in older adults). Spontaneous retrieval of the
  finished intention plus a failed executive veto.
- **[CONSENSUS on all three phenomena; the age-loading on commission
  errors is solid.]**

Model consequence (§5.14 amendment):

```
while armed (nonfocal/time only — focal rides §5.14 as-is):
    intention-linked record:  drive += intent_sup            // ≈0.1
    all unrelated recalls:    θ += monitor_cost              // ≈0.03
                              per armed nonfocal intention
on completion (fire or closeIntention): record gains completedDay
re-encountering the cue within the tail:
    p(refire) = pm_commission_p · 2^(−Δdays/pm_commission_hl)
              · (1 + 0.5·ageScale)   // ≈0.2 base, hl ≈2d
    a refire is a COMMISSION — the behavior layer must show the act
    or the reach ("I already gave you this, didn't I?"), not a recall
```

RW texture: the errand you're carrying makes you a slightly worse
rememberer of everything else that day; and a finished errand is not
gone — it is *armed again* if the world re-shows its trigger. Marsh's
inhibition-below-neutral is the tail's floor: after `pm_commission_hl`
the intention's cue-link is suppressed, not merely neutral.

## 27. Environmental support II — the deficit lives in self-initiation

§5.4's `env_support_gain` (v0.4) scales cue benefit by age. The other
half of Craik's environmental-support hypothesis pins down *where* the
age deficit lives.

- **Craik (1983/1986); Craik & Byrd (1982)**: older adults are hurt
  most when retrieval requires *self-initiated* processing — sparse
  external cues force the searcher to generate its own scaffolding.
  Rich cues disproportionately rescue them precisely because encoding
  left the trace under-specified (older encoding is sparser — the
  support substitutes for what encoding didn't lay down).
- **Lindenberger & Mayr (2014)**: environmental support as the formal
  complement of self-initiated decline — deficits concentrate where
  the environment carries no structure.
- **[CONSENSUS on the interaction; the precise function shape is our
  parameterization.]**

Model consequence (§5.4 amendment): when an arriving `recall` context
is *cue-sparse* (`cueMatch_ext` below `selfinit_bar` ≈ 0.3 — a
voluntary "what was it she said?" with little to go on), θ gains
`selfinit_pen·ageScale` (≈0.08). The two mechanisms are kept
separable: `env_support_gain` rescues given cues; `selfinit_pen`
taxes their absence. Lesion coverage is deliberate — P248 checks the
age-gap interaction and the lesion battery (validation-design §26)
gains a probe that can disable each leg independently. Do NOT fold
one into the other; they fail differently.

## 28. Ease-of-retrieval — when remembering more convinces you less

§5.4 already returns `searchCost` with the `ease_few`/`ease_many`
bands for judged-frequency hedging. The social-cognition result is
stronger than "hard → less": past a point the inference *inverts*.

- **Schwarz, Bless, Strack, Klumpp, Rittenauer-Schatka & Simons
  (1991)** JPSP 61:195 — recalling SIX assertive behaviors (easy)
  produced higher self-rated assertiveness than recalling TWELVE
  (hard): content says more, experience says less, and experience
  wins. Informing subjects about the manipulation abolished the
  effect — the inference uses the felt difficulty, not the count.
- **Tversky & Kahneman (1973)** availability — the original "ease
  implies frequency" heuristic; Schwarz et al. show the ease signal
  overrides the enumeration signal.
- **[CONSENSUS — one of social cognition's most replicated paradigms.]**

Model consequence (new §5.24): aggregate-judgment calls
(`judgeFrequency`, `judgeTrait` — the "does this happen a lot?" /
"am I the kind of person who…?" queries the dialogue layer already
reads `searchCost` for) apply the inversion:

```
if bout emitted < ease_n (≈4):   judgedFreq ∝ emitted count
else:                            judgedFreq ∝ 1/searchCost at stall
    // asking for 10 examples of rudeness and stalling at 6 reads as
    // "I'm not rude" — MORE retrieved, LOWER judged frequency
```

P249 is the falsifier: judgedFreq(k=4) must exceed
judgedFreq(k=10) on stall-prone topics. No other mechanism in the
spec produces a decreasing judgment from an increasing retrieval
count.

## 29. The accessibility metric — "forgotten" is a probe condition

- **Tulving & Pearlstone (1966)** JVLVB 5:381 — category cues at test
  recovered most of the free-recall deficit (cued recall ≈ total
  learned items while uncued recall lost a third to a half depending
  on list length): the dominant failure mode is *accessibility*, not
  availability. Tulving's dictum — information available ≠ accessible
  — is the measurement corollary of everything in this document.
- **[CONSENSUS — foundational.]**

Model consequence (harness-level, no runtime change): every probe that
asserts "forgotten" must report `access_gap = P(recall at maximal
cueing) − P(recall uncued)`. A record failing both probes is gone
(archived/latent); failing only the sparse probe is cue-failure —
alive, waiting. P250 defines the discipline: mid-age live records
should show a LARGE access gap (≥60% of uncued failures recoverable
under maximal cueing); if the gap collapses to ~0 at high strength,
the model's cue machinery is decorative, not causal. This is also the
anti-database audit: a lookup table has access_gap = 0 everywhere.

## 30. Cue hierarchy — v26 additions to the §17 table

| Cue/mechanism | v26 status |
|---|---|
| per-field weight | now corpus-relative: × diagnosticity blend (§20) |
| bout emission | ratio-rule sampling + failure-stop, not greedy sort (§21) |
| recall vs re-exposure | delay-gated asymmetry quantified (§22) |
| retell schedule | expanding-gap bonus on s_gain (§23) |
| suppression | cue-side θ (§4.12) + cue-INDEPENDENT inhib (§24) |
| involuntary scan | own cue diet — sensory up, topic down, verbatim-biased (§25) |
| armed intention | +drive on linked record, −θ* on all else; refires after done (§26) |
| sparse-cue recall | age-scaled θ tax — the deficit's address (§27) |
| judgment calls | ease inversion past ease_n (§28) |
| "forgotten" | operationalized as access_gap ≥ threshold (§29) |

## 31. Validation probes P241–P250 (v26 suite)

- **P241 diagnosticity (MUST):** two records with identical raw
  overlap — one cued by a df≈1% feature, one by df≈40% — the
  diagnostic cue wins by ≥1.5×; and a context engineered to raise
  match while raising df must NOT improve recall (Poirier et al.
  2012 design). P9 must hold simultaneously (unencoded cue still 0).
- **P242 ratio-rule competition (MUST):** adding same-cue competitors
  lowers P(target) at constant target drive; emission order is
  drive-descending; bouts stop after kmax consecutive misses.
- **P243 testing asymmetry (MUST):** recall-leg s_gain exceeds
  re-exposure leg by ≥1.5× at ≥3d gaps; at same-day gaps the legs
  converge within 20% (the Roediger & Karpicke crossover).
- **P244 expanding schedule (SHOULD):** expanding gaps ≥ equal gaps ≥
  massed on 30d retention, matched retell count.
- **P245 suppression inhibition (MUST):** a record suppressed with its
  cue present shows recall deficit on INDEPENDENT probes
  (cue-independent — the Anderson & Green signature), bounded by
  tnt_cap, resisted ×~0.3 by emotional records, never deleted;
  records "suppressed" without the cue present show ~no inhib accrual.
- **P246 involuntary diet (SHOULD):** ambient-scan surfaces skew
  toward sensory/peripheral-cued, verbatim-rich records vs voluntary
  retrievals; involuntary rate age-flat within ±10% across bands
  while voluntary recall declines (Schlagman et al. 2007).
- **P247 intention ecology (MUST):** an armed nonfocal intention
  measurably raises θ on unrelated recall AND raises drive on the
  linked record; a completed intention refires ≥10% within 2d on cue
  re-encounter, higher at 70+ (Walser et al. 2012 ~25% base).
- **P248 self-initiation (MUST):** the young→old recall gap is ≥2×
  larger under cue-sparse than cue-rich conditions; lesioning
  selfinit_pen collapses the sparse-side gap only.
- **P249 ease inversion (MUST):** judgedFreq(k=4) > judgedFreq(k=10)
  on stall-prone topics — a decreasing judgment from an increasing
  retrieval count (Schwarz et al. 1991).
- **P250 access-gap discipline (MUST — measurement):** ≥60% of
  uncued-failing live mid-age records recover under maximal cueing;
  access_gap ≈ 0 across the corpus flags a decorative cue system
  (the anti-database audit).

## 32. Honest limits (v26 additions)

- Diagnosticity is adopted as a magnitude term alongside — not instead
  of — the §5.1 match gate; Nairne's stronger claim (match is myth)
  is DEBATED and not load-bearing here.
- SAM constants (sam_tau, kmax, lmax) come from list-recall fits;
  autobiographical competition plausibly uses shallower τ — flagged
  for Morris screening.
- reexp_ratio is calibrated off study-restudy comparisons; "hearing
  a retelling" is a richer re-exposure than re-reading — the ratio
  may underestimate social re-exposure.
- TNT adopted conservatively (bounded, small, resisted) given the
  replication record; the cue-independence property is retained as
  the mechanism's identity even if magnitudes move.
- The involuntary cue diet's internal/external split is diary-
  classified, not modeled — invol_periph_gain is our operationalization
  of "concrete overlap," not a measured ratio.
- Commission-error rates vary widely with habitual-responding
  manipulations; pm_commission_p ≈ 0.2 is mid-range and age-scaled.
- Ease inversion is demonstrated on self/trait judgments; extending
  to event-frequency judgments is the standard interpretation
  (availability) but flagged where the domain shifts.
- The access-gap metric is a harness discipline, not a mechanism —
  it constrains what "forgotten" may mean in probes, nothing more.

---

# PART IV (v38, 2026-09-23) — the cue's owner, moment, and protocol

Parts I–III priced cue fields, cue contexts, and cue mechanics. Part IV
prices three dimensions none of them owned: WHO made the cue (§33), the
retrieval moment's own ecology — load, stress, mood agenda, boundary
(§§34–36, §40), what retrieval does to what comes NEXT (§37), what
happens when nothing comes back but something still glows (§38), whose
silences a listener adopts (§39), the best possible interrogation
protocol a co-character can run (§41), and why oddballs get asked
first (§42). Spec changes land in `memory-model-spec.md` v3.7;
probes P378–P388.

## 33. Cue ownership — the self-generated cue is not the same cue

- **Mäntylä (1986)** JEP:LMC 12:66 — "optimizing cue effectiveness":
  subjects given back their *own* generated properties as test cues
  recalled ~90%+ of 500–600 incidentally learned words; the same
  paradigm with **another person's cues** retrieved ~55%. The cue
  words were nominally similar — what differed was whose
  conceptualization produced them. Near-perfect recall of 600 items
  remains the lab's standing demonstration that retrieval failure,
  not storage failure, is the usual bottleneck.
- **Mäntylä & Nilsson (1983)** Scand J Psych 24 — same effect, one
  trial, perfect-recall replications; the self-cue advantage survives
  retention intervals up to ~3 weeks (Mäntylä & Nilsson 1988;
  Bloom & Lamkin 2006).
- **Tullis & Finley (2018)** review + follow-ups (Memory&Cognition
  2022 — honored vs dishonored self-cues: odds ratio ≈3.8): the
  advantage is specific to cues the learner *chose*, not merely
  self-generated material in general.
- **[CONSENSUS — one of the largest reliable effect sizes in the cue
  literature; the magnitude-vs-external-cue ratio (≈1.6–1.8×) is the
  number we adopt.]**

Model consequence (§5.2 amendment): each cueVector/context feature
carries `origin ∈ {self, ext}` — `self` when the feature descends
from the character's own prior elaboration or narration (their
retellings, their §6.9 imaginings, their own cueVector fields fed
back as context), `ext` when supplied by the environment or another
character's speech. Self-origin contributions get `w_j ×= selfcue_mult`
(≈1.7, range 1.4–2.0). Two consequences the game reads: (a) a
character's OWN phrasing unlocks them — "ask it the way she'd put it"
retrieves what "ask it correctly" cannot; (b) interrogators
unknowingly sabotage recall by supplying their framings — the
questioner's cue competes where the witness's cue would have worked.
Diagnosticity (§20) and ownership are orthogonal: self-cues are also
on average more diagnostic, but the effect holds at matched df.

## 34. The obligatory side of the asymmetry — load at TEST

The spec encodes the encoding half of Craik's law (§2 `daLoad`,
v1.2); v3.7 prices the retrieval half, which works by different rules.

- **Craik, Govoni, Naveh-Benjamin & Anderson (1996)** JEP:G 125:159
  — DA at encoding produces large recall drops; DA at retrieval
  produces *small or no* accuracy drops but LARGE secondary-task and
  latency costs. Retrieval is near-obligatory once a cue lands —
  protection is real but not free.
- **Naveh-Benjamin, Craik, Guez & Dori (1998)** JEP:LMC 24 and
  **Naveh-Benjamin, Craik, Gavrilescu & Anderson (2000)** M&C 28:965
  — the asymmetry holds under calibration analysis; recall under
  encoding-DA dropped 26–33%, retrieval-DA a fraction of that.
- **Rohrer & Pashler (2003)** — retrieval accuracy survives DA
  "only with substantial resource" expenditure: the cost shows up
  in latency and in the ongoing task, not in correctness.
- **BUT: monitoring is not retrieval.** Nonfocal prospective memory
  and effortful search DO degrade under DA (Einstein, McDaniel et
  al. — PM under divided attention; the multiprocess framework's
  costly-monitoring leg, §12/§5.14). The protection covers cue-
  driven completion, not cue-free vigilance.
- **[CONSENSUS on the asymmetry and the monitoring exception.]**

Model consequence (§5.4 + §5.25 amendment): `cueContext.daLoad`
at retrieval time:

```
voluntary recall:   θ += da_ret_pen·daLoad            // ≈0.04 — small
                    latency_ms ×= (1 + lat_da_mult·daLoad)  // ≈0.6
                    search_breadth ×= (1 − da_breadth_pen·daLoad) // ≈0.3
PM monitor rolls (§5.14 nonfocal/time): p ×= (1 − da_monitor_pen·daLoad)
                    // ≈0.5 — vigilance pays what retrieval doesn't
ambient scan / involuntary / focal PM: UNCHANGED — the automatic
                    routes don't rent the resource DA occupies
```

RW texture: a distracted character still *answers* — slower,
shorter, more hesitant — but forgets the errand they were holding,
not the question you asked.

## 35. Stress at test — the lag and the valence weight the v0.5 term lacked

§5.4's v0.5 `stress_retrieve_loss` is instant and flat. Two meta-
analytic moderators were missing:

- **Gagnon & Wagner (2016)** NYAS review — stress biases retrieval
  toward reflexive responding while taking flexible, goal-directed
  retrieval offline; the impairment is real and retrieval-specific.
- **Shields, Sazma, McCullough & Yonelinas (2017)** Psych Bulletin
  143:636 meta (113 studies, N=6,216): stress just before or during
  retrieval reliably impairs memory — and the impairment is **larger
  for emotionally valenced material than neutral**, the reverse of
  the encoding-side asymmetry.
- **Timing** (Schilling? — corrected: **Smeets/de Quervain tradition
  timing studies**; Schoofs, Preuss & Wolf 2008 and follow-ups):
  impairment tracks the cortisol peak — absent immediately after
  the stressor, present at ~25 min, persisting to ~90 min. The
  immediate post-stress window is spared because cortisol hasn't
  risen yet.
- **[CONSENSUS on direction and the cortisol-delay signature;
  valence moderation is the meta's reliable moderator.]**

Model consequence (§5.4 v0.5 clause amended): `stress_retrieve_loss`
applies only when the stressor's onset is ≥ `stress_lag_min` (≈20
sim-min — cortisol hasn't landed yet inside the window) and ≤
`stress_off_min` (≈90), and is scaled `(1 + stress_emo_mult·|m.valence|)`
(`stress_emo_mult` ≈ 0.5). A character interrogated DURING the
shock answers fine; twenty minutes later — calm, cortisol peaking —
the same questions come back empty, worst for the emotional parts.

## 36. Mood repair — retrieval as an emotion-regulation tool

§5.3 prices mood-congruent selection. But congruence has an
opponent the spec never modeled: people sometimes reach *against*
their mood on purpose.

- **Josephson, Singer & Salovey (1996)** Cog&Emotion 10:437 — sad-
  induced participants' SECOND recalled memory shifted positive
  specifically in low-depression participants; high-depression
  participants produced consecutive negatives; 68% of the shifters
  reported doing it deliberately ("to feel better").
- **Rusting & DeHart (2000)** JPSP 78:737 — mood-incongruent
  retrieval appears under positive-reappraisal strategies and is
  stronger in high negative-mood-regulation-trait individuals.
- **Joormann & Siemer (2004)** J Abnorm Psych 113:179 — dysphoric
  participants CANNOT repair via happy memories (distraction works,
  positive recall doesn't); rumination after mood induction
  eliminates the repair effect even in nondysphorics.
- **[CONSENSUS that repair-by-recall exists and is trait-gated;
  the dysphoria block is replicated.]**

Model consequence (new §5.27): on a voluntary recall bout while
`C.mood < repair_mood_bar` (−0.2) sustained across ticks, roll
`repair_p` (trait — ≈0.5 nondysphoric, ≈0.05 under the existing
depressive/ruminative modifier or a ruminating state flag). On
success the bout enters repair mode: the §5.3 `moodCongruence`
term's sign flips (positive-valence records gain `repair_gain`
≈0.15 drive), and each emitted positive record feeds
`repair_mood_gain` (≈0.05, cumulative ≤0.2) back into `C.mood`.
Failed repair rolls default to ordinary congruent selection —
depressives get the consecutive-negatives pattern for free.
`repair_p` is the cleanest personality dial in this part: the
bible decides whether a character self-soothes with memory at all.

## 37. The forward testing effect — remembering primes learning

Retrieval practice's benefits run backward (the tested trace, §5.9).
Szpunar's program documents a second benefit running FORWARD:

- **Szpunar, McDermott & Roediger (2008)** JEP:LMC 34:1392 —
  interpolating tests during study insulates NEW learning against
  the buildup of proactive interference; attributable to retrieval,
  not re-exposure (Exp. 3 — restudy interpolation does not do it).
- **Pastötter & Bäuml (2014)** — the forward testing effect
  generalizes; mechanism accounts converge on list separation /
  reset of encoding (a retrieval bout segments what came before
  from what comes after).
- **Chan, Manley, Davis & Szpunar (2018)** Psych Bulletin 144 —
  meta-analysis: testing potentiates subsequent learning across
  paradigms.
- **[CONSENSUS on the phenomenon; mechanism (context reset vs
  strategy change) DEBATED.]**

Model consequence (new §5.26): a successful voluntary recall bout
stamps `postRecallDay` on the character. For `fwd_win` (≈0.05 day
— the same scene / next interaction):

```
new encodings:  E ×= (1 + fwd_test_gain)          // ≈0.12
n_sim pool:     halved for the incoming record's bucket
                // fwd_pi_release ≈ 0.5 — retrieval resets the
                // competitive pool like a mini-§4.18 transition
re-exposure bouts (hearAccount, ambient scan): NO window —
                Szpunar Exp. 3 sign-locks it to retrieval
```

RW texture: reminiscence is good for the afternoon — a character
who just dug up old stories encodes the next hour more cleanly.
Remembrance is exercise, and exercise warms the muscle.

## 38. Familiarity without a source — the scene-level déjà vu

§5.10's `familiar_only` tier exists only inside the person cascade.
Cleary's program shows the phenomenon is general:

- **Cleary & Greene (2000)** JEP:LMC 26:1063 — recognition without
  identification: unidentifiable items still carry above-chance
  episodic familiarity; mediated by feature-matching to stored
  traces, not by partial recall.
- **Cleary, Ryals & Nomi (2009)** and **Cleary, Brown, Sawyer et
  al. (2012)** Cog&Cognition 21 — configural familiarity in 3-D
  scenes: a NEW scene resembling a studied scene's *configuration*
  produces elevated familiarity and reported déjà vu while the
  source scene fails to come to mind; déjà-vu reports scale with
  feature-match.
- **Brown (2003/2004)** — déjà vu base rate ~2/3 of population,
  declining with age.
- **[CONSENSUS that feature-match familiarity persists when recall
  fails; the déjà-vu labeling is our experiential reading.]**

Model consequence (new §5.28): when a voluntary recall bout emits
nothing, compute `famScore` = the max over ALL live records of
configural overlap (place + people + sensory fields jointly,
ignoring the §5.1 gate's cue requirement — familiarity is a
global-matching signal, SAM's familiarity channel). If `famScore ≥
fam_bar` (≈0.45), emit a `familiar_only` Reconstruction: no content
fields, confidence ≤0.3, and a flag discriminating two cases:
`sourceless` (the matching record is real — retrieval failed but
the trace is there; "I've definitely had this conversation…") vs
`deja` (the top match is a *similar-but-different* record — true
déjà vu; surface flag only, confidence floored lower, feeds §6
misattribution as a sourceless familiarity). `deja_prop` (≈0.3,
declining with age_eff/80 — Brown) gates whether the experience
reaches awareness at all. A character who can't place the park
bench but *feels* it — the texture of memory without content.

## 39. Whose silence do you inherit — the in-group gate on SS-RIF

§5.8's `ss_rif_k` suppresses the listener's unspoken related
records whenever a speaker selectively retrieves. The social
moderator:

- **Coman & Hirst (2015)** JEP:G 144:1066 — SSRIF appears when the
  speaker is an **in-group** member (fellow Princeton students)
  and not for out-group speakers; activating a shared identity
  restored it across group lines. Mechanism: SS-RIF requires the
  listener to *co-retrieve* with the speaker, and co-retrieval is
  a function of shared identity.
- **[CONSENSUS for the moderation; in-group operation is
  paradigm-defined (shared institution), our PersonModel mapping
  is operationalization.]**

Model consequence (§5.8 amendment): `ss_rif_k` is multiplied by
`ingroup_w(speaker)` — PersonModel[speaker] in-group signal:
`shared_group || credibility ≥ cred_hi` → 1.0; explicit out-group
or distrusted → `ssrif_out_mult` (≈0.2). A character's silences
rewrite the listener's memory only when the listener *trusts the
teller enough to remember along*. Gossip from outsiders leaves
the listener's omissions intact — an asymmetry the rumor engine
can play.

## 40. The plan fires, the plan's contents don't — PM's retrospective leg + the doorway

§5.14 decides whether the cue fires. Two failures live one step
downstream and one step upstream:

**(a) Retrospective component** — Einstein & McDaniel's
decomposition (multiprocess framework; McDaniel & Einstein 2000):
successful PM requires detecting the cue AND recalling the action.
Lab versions show cue-detection without action-recall ("I know I
was supposed to do something when I saw him — what was it?"),
and the retrospective leg shares the age deficit of ordinary
recall while the focal detection leg is spared.

Model consequence (§5.14 amendment): a successful fire roll runs
a second draw on the intention's action content:
`p(action) = pm_action_p·(1 − 0.3·ageScale)·(1 − da_monitor_pen·daLoad)`
(`pm_action_p` ≈ 0.9). Failure stamps `pm_vague` — a flag the
dialogue layer renders as the intention-shell: urgency without
content, high FOK, no plan. The state resolves if the action cue
arrives within `pm_vague_win` (≈0.5 day); unresolved it decays
like an ordinary failed recall (and can TOT-recur via §5.16).

**(b) The doorway** — **Radvansky, Krawietz & Tamplin (2011)** QJEP
64:1632 + Radvansky's event-model program: crossing a spatial
boundary measurably impairs recall of recently-carried objects and
armed intentions; the boundary re-segments the model and the old
room's cue set is dropped. **[CONSENSUS in lab; size small-moderate.]**

Model consequence (new §5.29): on a `locShift` boundary (already
an event flag): peripheral cueVector fields in the active context
drop at `boundary_cue_drop` (≈0.4 — non-attended cues cleared);
armed nonfocal/time intention rolls ×(1 − doorway_pen) (≈0.2)
inside `post_boundary_win` (≈0.02 day); shallow recent records
(R < 0.5, age < 1h) take a one-time `boundary_hit` (≈0.05) R
decrement. Focal-armed and self-origin cues exempt — what you're
looking at and what you named yourself survive the doorway.
"Walked into the kitchen and lost the errand" — but not the
errand you rehearsed out loud.

## 41. The interview protocol — retrieval strategy as a game-systems contract

Every mechanism above has a known-best ORDER. The cognitive
interview is the lab's assembled version:

- **Fisher & Geiselman (1992)** — the CI: context reinstatement,
  free report, varied order, varied perspective, no leading cues.
- **Köhnken, Milne, Memon & Bull (1999)** meta (55 comparisons):
  correct details d = 0.87, incorrect details d = 0.28 — MORE
  details, same accuracy rate (85% vs 82%).
- **Memon, Meissner & Fraser (2010)** Psych, Pub Pol & Law 16:340
  (46 articles): replicated — and the benefit is LARGER for older
  witnesses, consistent with environmental support (§27).
- **[CONSENSUS — forensic psychology's most robust applied result.]**

Model consequence (new §5.30, contract-level): `interviewMode(
charId, eventRef)` — a recommended sequence, each step a reuse:

```
1. reinstate:  inject event-place/sensory fields into C at
               mental_reinstate weight; set C.ops = m.encodeOps
               (kills the §5.12 TAP tax by matching channels)
2. free pass:  bout k≥5, NO supplied cue fields — self-origin
               retrieval at selfcue_mult (§33); the interviewer's
               words would only compete (and would part-list-
               suppress, §5.8)
3. vary:       flip contiguity_asym (backward recount) and
               rotate C.ops — each channel change re-sorts the
               drive ranking and surfaces fields the first pass
               couldn't reach
4. delayed second pass: §5.11 reminiscence leg applies
```

Acceptance shape (P387): ≥20% more correct fields than direct
questioning at accuracy-rate within ±3%; larger margin for older
characters. The worst interrogation is §5.13's own finding:
exhaustive cued questioning self-destructs.

## 42. The oddball goes first — distinctiveness at retrieval

`isolated` (v1.2) is an encoding flag with no retrieval life. The
distinctiveness principle says it should have one:

- **Hunt & McDaniel (1993)** — the distinctiveness principle:
  beneficial effects of difference accrue at retrieval — unusual
  items are accessed by cues that don't compete.
- **von Restorff tradition / isolation paradigms** — isolates are
  recalled earlier and more often in free recall, surviving where
  same-category neighbors interference each other out.
- **[CONSENSUS on direction; our bucket implementation is
  operationalization.]**

Model consequence (new §5.31): an `isolated` record forms a
singleton cue bucket — `fan(m)` computed over its bucket = 0 by
construction (immune to §5.4's log-fan divisor; the category it
fled keeps competing with itself), and it gains `iso_first`
(≈0.1) drive on the FIRST emission of a voluntary bout — oddities
lead stories ("you'll never guess what happened"). The privilege
is retrieval-side only: no strength bonus, no decay relief — a
buried oddity still dies like anything else; it just never waits
in line.

## 43. Cue hierarchy — v38 additions to the §30 table

| Cue/mechanism | v38 status |
|---|---|
| cue origin | NEW — self-generated cues ×selfcue_mult (§33) |
| retrieval-time load | NEW — latency/breadth/monitor tax, accuracy ~flat (§34) |
| retrieval-time stress | AMENDED — cortisol lag + valence multiplier (§35) |
| mood-incongruent search | NEW — trait-gated repair mode (§36) |
| post-recall window | NEW — E gain + PI release on next encodings (§37) |
| familiarity-only signal | NEW — scene-level familiar_only/deja return (§38) |
| speaker in-group | NEW — ss_rif_k × ingroup_w (§39) |
| PM action recall | NEW — fire-then-remember gate, pm_vague (§40a) |
| location boundary | NEW — context drop + intention dip (§40b) |
| interview sequence | NEW — interviewMode contract (§41) |
| isolated flag | NEW — fan immunity + bout-first privilege (§42) |

## 44. Validation probes P378–P388 (v38 suite)

- **P378 cue ownership (MUST):** a self-origin cue vs an
  external cue at identical overlap/df recalls ≥1.5× better;
  advantage persists (≥1.3×) at ≥3-week retention gaps.
  Mäntylä 1986. P9 still gates: an unencoded cue contributes 0
  regardless of origin.
- **P379 retrieval-DA asymmetry (MUST):** at daLoad=1, voluntary-
  recall accuracy drops ≤15% of the matched encoding-DA drop;
  latency rises ≥30%; ambient-scan rate unchanged; nonfocal PM
  fire-rate drops measurably more than recall accuracy.
  Craik et al. 1996.
- **P380 stress lag & valence (MUST):** θ penalty ≈0 for
  stressors < stress_lag_min old, present at lag, persisting to
  stress_off_min; penalty on |valence|-high records measurably
  exceeds neutral (Shields et al. 2017).
- **P381 mood repair (MUST):** under sustained negative mood,
  high-repair_p character's second emission shifts positive vs
  first (Josephson ordering); ruminative/low-repair_p shows
  consecutive negatives; successful repair recall lifts C.mood
  measurably.
- **P382 forward testing (MUST):** matched encoding sequences
  with vs without an interpolated retrieval bout → post-bout
  encodings show higher 24h R AND fewer PI-source swaps; a
  re-exposure interpolation produces neither (Szpunar Exp. 3).
- **P383 familiar-only emission (MUST):** failed recall with
  configural famScore ≥ fam_bar emits `familiar_only` (no
  content, conf ≤0.3); similar-but-new top-match → `deja`;
  real-but-unretrieved top-match → `sourceless`; famScore <
  fam_bar emits nothing.
- **P384 in-group SSRIF (SHOULD):** listener suppression of
  own unspoken related records is measurably larger under
  in-group/credible speakers than out-group at matched
  listenerAttention (Coman & Hirst 2015).
- **P385 PM action forgetting (MUST):** fired cue + failed
  action recall → `pm_vague` at measurable rate, higher with
  age/daLoad; vague resolves on action-cue arrival within
  pm_vague_win; focal detection stays age-flat (P130 holds).
- **P386 doorway drop (SHOULD):** armed nonfocal intention
  fire-rate dips ≥15% inside post_boundary_win; shallow recent
  records take the boundary_hit; focal-armed and self-origin
  cue contexts unaffected.
- **P387 interviewMode (MUST):** CI sequence yields ≥20% more
  correct fields than direct exhaustive questioning at accuracy
  rate within ±3% (small error increase allowed, per the meta);
  older witnesses gain MORE (Memon et al. 2010 moderator).
- **P388 isolation at retrieval (SHOULD):** an isolated record
  in a dense corpus recalls ≥1.5× a matched non-isolated record
  and is disproportionately first-emitted across bouts; zero
  effect on decay (strength-matched survival equal).

## 45. Honest limits (v38 additions)

- `selfcue_mult` adopts the lab ratio (~1.6–1.8×); real-world
  self-cues are richer than word-property cues, plausibly
  stronger — flagged as a floor.
- The retrieval-DA protection may erode under autobiographical
  search (harder than list recall); `da_ret_pen` is small by
  design and the breadth/latency legs carry the cost.
- Stress timing constants are tuned to the cortisol literature
  (~20–30 min lag); sim-min mapping is a calibration decision.
- repair_p's trait anchor is two studies plus the dysphoria
  literature; the ruminative gate is the reliable half.
- famScore's configural computation (which fields count as
  "configuration") is our operationalization of Cleary's VR
  result — flagged for Morris screening.
- pm_action_p's retrospective leg is extrapolated from PM
  component analyses, not measured as a standalone probability.
- Doorway constants are lab-small; the RW implementation
  magnifies them only through the armed-intention channel.
- interviewMode is a *contract*, not a guarantee — each step
  reuses validated machinery, but the assembled +20%/±3% shape
  is a target taken from the meta, not a derivation.
- Isolation's fan immunity assumes singleton buckets; two
  isolates sharing a cue key collapse the privilege — intended,
  two oddities in one room stop being odd.
