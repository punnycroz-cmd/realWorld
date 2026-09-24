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

---

# PART V (v50, 2026-09-23) — the cue's plan, rival, and reach

Parts I–IV priced cue fields, cue mechanics, cue ownership, and the
retrieval moment. Part V prices what was left: the cue a character
*manufactures for their future self* (§46), the cue that loses to
its own homonym (§47), the cue the body carries (§48), the two
routes a search can take (§49), the culturally supplied cue menu
(§50), what SPACED repetition of the same search yields (§51), the
partner's cues — why they mostly fail and when they don't (§52),
the pharmacological version of state-dependence (§53), arousal at
the moment of search (§54), why older speakers blank on names
(§55), and the reversible "forget it" flag (§56). Spec changes
land in `memory-model-spec.md` v4.8; probes P513–P524.

## 46. Implementation intentions — the cue you arm in advance

§5.14 prices whether an armed intention's cue fires, and §9's
`cueBind` lets sleep consolidate the link. What neither models is
the *formation act*: Gollwitzer's program shows the same intention
with and without an if-then plan is a different machine.

- **Gollwitzer (1999)** Am Psych 54:493 — "implementation
  intentions: strong effects of simple plans": forming "When
  situation X arises, I will do Y" delegates initiation to the
  specified cue; the cue becomes chronically accessible and the
  response partially automatized.
- **Gollwitzer & Sheeran (2006)** meta, 94 tests — goal attainment
  d = .65 overall; the PROSPECTIVE-MEMORY subset (62 tests) is
  d ≈ .40 — smaller but reliable, and mechanized exactly as cue
  accessibility + automatic initiation.
- **Chasteen, Park & Schwarz (2001)** Psych Sci 12:457 — older
  adults benefit as much or more: the plan substitutes for the
  self-initiated retrieval §27 shows aging removes.
- **[CONSENSUS on effect and mechanism — the PM-specific effect
  size is the honest number, not the headline .65.]**

Model consequence (§5.14 amendment): `rememberIntention` /
`armIntention` gain an optional `impl:{cue, action}` — an if-then
plan formulated at arming (bible trait `planStyle` gates how often
a character spontaneously forms them; the dialogue/request layer
can also phrase errands as plans). An impl intention:

```
cue link:   cueBind_init ×= impl_bind_gain        // ≈1.5
fire:       nonfocal impl intentions roll against
            pm_monitor_p + impl_focal_lift        // ≈+0.3 —
            near-focal, because the plan PRE-loads the cue;
            monitor_cost (§26) drops ×(1 − impl_cost_mult)  // ≈0.5 —
            the cue is armed, no vigilance needed
exemption:  doorway_pen (§5.29) halved — the cue-binding is
            consolidated, not just held
cost:       an impl plan fixes ONE cue — cues not in the plan
            fire at the ordinary nonfocal rate (rigidity:
            Gollwitzer's delegation is cue-specific)
```

RW texture: "when I pass the mailbox I'll drop the rent check"
survives the doorway and the busy afternoon; "I should remember
to water her plants" does not. The character who narrates their
own if-thens out-loud plans — that phrasing is the trait.

## 47. The Baker paradox — the name tier loses to its own homonym

§5.10's person cascade ends at a name tier that already carries
`tot_rate` and `name_fan`. The deeper asymmetry: names are harder
than person-semantic facts *even when the token is identical*.

- **McWeeny, Young, Hay & Ellis (1987)** Br J Psych 78:143 —
  subjects learn face–name and face–occupation pairs using
  HOMONYMS (Mr. Baker vs. baker): surnames recalled far worse
  than occupations with context, frequency, and related-item
  cuing all equated.
- **Cohen (1990)** Br J Psych 81:287 — names are semantically
  thin: meaningless possessions are as hard as names; making the
  OCCUPATION meaningless erases the name deficit; meaningful
  items are accessed before meaningless ones. The name deficit
  is an association-poverty deficit, not a word-class deficit.
- **Cohen & Burke (1993)** and the plausible-phonology hypothesis
  (Brédart 1993, Br J Psych 84:51): a name tolerates almost any
  phonology — "Dreaner" is a plausible surname, not a plausible
  job — so name retrieval can't use semantic constraints to
  prune candidates.
- **[CONSENSUS on the phenomenon and the association-poverty
  account; serial-access vs interactive-activation mechanics
  DEBATED (Stanhope & Cohen 1993).]**

Model consequence (§5.10 amendment): the cascade is ordered, but
the same PHONOLOGICAL token is cheaper as semantic content than
as a name. Implement as a name-tier-specific penalty, separate
from `tot_rate`:

```
name_thresh_eff = name_thresh + name_sem_gap        // ≈0.08
    // applied only when the requested content is the name —
    // descriptive recall about the same person (knowsTopics,
    // identity fields) never pays it
    // a name whose phonology doubles as meaningful content
    // (a nickname, a name that IS their trait — "Rusty" for the
    //  redhead) drops the gap: name_sem_gap → name_sem_gap·0.3
TOT already gates the failure mode; name_sem_gap widens the
    window in which tier-3 fails — the everyday blank, not the
    agonized TOT
```

RW texture: the character who can tell you everything about the
woman at the produce stall — her feud with the landlord, her
jokes — and cannot produce her name. Not a TOT, not a decay
event: the name was always the weakest field in the model.

## 48. Enactment — the motor cue that needs no scene

`encodeOps` already distinguishes `enactive` records (§5.12);
§33's self-cue advantage is verbal. The action-memory literature
adds a cue that rides the BODY, not the place.

- **Cohen (1981)**; **Engelkamp & Zimmer (1984)** — subject-
  performed tasks (SPTs: "roll the marble," performed at study)
  are recalled better than verbal-task items; a third "motor
  program" encodes independently of verbal/visual channels.
- **Roberts et al. (2022) meta** (Psych Bulletin 148:1 —
  systematic review, behavioral + neuroimaging + patient
  studies): the enactment effect is robust across test formats,
  retention intervals, instruction types; primary contribution
  is ACTION PLANNING, secondary is the movement itself; even
  motor-impaired patients benefit.
- **Reenactment at test** (Engelkamp tradition; Kormi-Nouri 1995):
  recognition improves when the test item is re-enacted —
  motor output is itself a cue.
- **Nonstrategic encoding** (Nilsson 2000 review): SPT advantage
  survives without strategy — enacted items are self-cuing,
  less cue-hungry than verbal ones.
- **[CONSENSUS on direction and on the planning>movement
  decomposition; size of the self-cue advantage vs rich external
  cues is our extrapolation.]**

Model consequence (new §5.41): records whose `encodeOps`
includes `enactive` carry a self-origin motor channel:

```
sparse-cue conditions (cueMatch_ext < selfinit_bar):
    enactive records score the motor field at
    w_sensory · enact_selfcue                // ≈1.3 —
    // enactment is its own context; needs no reinstatement
    origin = self for the §33 selfcue_mult leg
reenactment at retrieval (C.ops == enactive AND the action
    matches): recall drive × enact_recall_gain   // ≈1.15
immune to boundary_cue_drop (§5.29): the cue is the body,
    it walks through the doorway with you
```

RW texture: the tenant who can't recall the landlord's voicemail
re-enacts the motion and remembers where they put the key —
procedural echo of the event, not a place cue. And characters
who DO things remember their own deeds under sparse prompting
better than anything they only heard about.

## 49. Generative vs direct retrieval — the search has an entry floor

The spec's recall is one scored competition (§5.22 ratio rule).
Conway's model says there are two routes into the corpus and
they feel different.

- **Conway & Pleydell-Pearce (2000)** Psych Rev 107:261 — the
  autobiographical knowledge base is hierarchical: lifetime
  periods → general events → event-specific knowledge. Voluntary
  recall is GENERATIVE: control processes shape cues iteratively,
  descending until a specific episode stabilizes; involuntary
  recall is DIRECT: the cue lands on the episode with no search.
- **Haque & Conway (2001)** Memory 9 — probe protocols early in
  retrieval show ABSTRACT knowledge dominating, event-specific
  knowledge arriving late; some retrievals arrive "very fast and
  full" — direct retrieval observed inside a voluntary paradigm.
- **[CONSENSUS on the hierarchy and the two routes; the
  voluntary/involuntary mapping is DEBATED (Barzykowski &
  Staugaard 2016 — some involuntary memories are also
  constructed).]**

Model consequence (new §5.42): a voluntary `recall` context
lands at a level set by cue specificity:

```
drive_max over corpus:
    ≥ gen_direct_bar (≈0.7):   DIRECT — emit immediately,
        latency_min; the strong-cue path, no descent needed
    < gen_direct_bar:          GENERATIVE — first pass returns
        the best PERIOD/GENERIC node (a §4.18 period or §4.20
        script node, or the record's gist field), then a descent
        roll per level at hier_descent_p (≈0.6), each level
        adding latency and re-scoring with the accumulated
        context (the period's own fields join C)
    descent stall → emit the generic + "vague" flag
        // "that summer we had the roach problem…" IS a
        // legitimate output, not a failure
age: hier_descent_p ×(1 − 0.3·ageScale) — older characters
    stall one level up: the answer exists, it arrives as the
    story of a period rather than the episode (self-initiation
    §27 is the same deficit one mechanism down)
ambient scan / involuntary: always direct — §5.7 unchanged
```

RW texture: "tell me about your twenties" returns a period, then
— if the descent rolls well — the apartment, then the night.
Interrogators who want the episode must supply specific cues
(gen_direct_bar) or sit through the descent. §5.30's
interviewMode free-pass step gets this for free: narrative-first
questioning rides the hierarchy down.

## 50. Life-script cues — the culture supplies the index

§4.18 chapters the corpus into periods; §6.34 gives the self
anchors. Berntsen & Rubin's program shows the retrieval of
important events is guided by a culturally shared TIMETABLE.

- **Berntsen & Rubin (2004)** Mem&Cog 32:427 — three converging
  demonstrations: age norms concentrate transitional events in
  the 15–30 window; 1,485 respondents date their most important
  POSITIVE events to that window (negative events show no bump);
  hypothetical-life scripts predict which event types get
  recalled at all. Life scripts "structure retrieval processes
  and spaced practice."
- **Rubin & Berntsen (2003)** Mem&Cog 31:886 — life scripts
  maintain memories of highly positive, not negative, events;
  the script is a retrieval scaffold, not a pleasantness filter
  on experience.
- **[CONSENSUS that a culturally shared transitional-event
  index exists and biases recall toward the bump window;
  whether it EXPLAINS the bump vs piggybacks on it is DEBATED.]**

Model consequence (new §5.43): event records gain a
`milestone:true` tag (world/bible supplies: firsts, weddings,
moves, graduations, births — transitional events). On queries
scoped to a life period or a life story (C.period set, or the
§6.34 narrative-self "tell your life" path):

```
milestone records:  drive += lifecue_gain        // ≈0.12
    // stronger for positive valence: ×(1 + 0.5·valence+)
    // the script's asymmetry — positive transitions over-recall,
    // negative ones ride ordinary drive
encodeAge in bump window (bump_lo..bump_hi): stack is
    multiplicative with the existing bump_beta_mult retention
    — the script supplies the CUE, the bump supplies the strength
non-milestone records in the same query pay no penalty — but
    fan grows: the milestones crowd the bucket
```

RW texture: asked to recount their life, every character reaches
for the same skeleton — first apartment, the wedding, the
move — and the rest of the corpus waits for a cue the script
doesn't index. It is also a SOCIAL cue: characters cue each
other with script terms ("when did you move here?") that work
better than date probes (§6.15) precisely because the script
pre-indexed the target.

## 51. Hypermnesia — the second dig finds what the first dropped

§5.11 provides reminiscence (new fields surfacing on successive
attempts) but explicitly does NOT require net gain. The
hypermnesia literature says spaced attempts CAN net-gain, and
prices the conditions.

- **Erdelyi & Becker (1974)** Cog Psych 6:159 — repeated forced
  recall of PICTURES improves across trials ("hypermnesia");
  words stay flat; interpolated thinking intervals enhance it.
- **Roediger & Thorpe (1978)** Mem&Cog 6:554 — both materials
  show trial-over-trial gains, but cumulative unique items do
  NOT exceed one equal-length recall period: hypermnesia is
  largely a time-on-search effect; gains continue even after
  long recall — "subjective retrieval cues" keep working.
- **Erdelyi, Finks & Feigin-Pfau (1989)** JEP:LMC 15:275 —
  hypermnesia OVER DAYS: with imagery/material support, net
  recall grows across days — the Ebbinghaus curve locally
  inverted for cumulative yield.
- **Otani & Hodge (1991)** review; **Payne (1987)** review —
  conditions: imageable material, repeated tests, spaced
  intervals; losses between attempts are real too (reminiscence
  vs forgetting race, gains must exceed).
- **[CONSENSUS that cumulative yield grows with spaced attempts
  on rich material; whether net-recall-per-moment exceeds a
  single long search is DEBATED — we adopt the cumulative
  metric, which is what a day-scale sim observes.]**

Model consequence (§5.11 amendment): the reminiscence leg is
gap-sensitive:

```
same-context bout, gap < hyper_gap (≈0.5d):
    reminiscence_frac unchanged (≈0.15) — massed retrieval
    mostly re-samples; Roediger & Thorpe's time-on-search
spaced bout, gap ≥ hyper_gap:
    reminiscence_frac ×= hyper_gain            // ≈1.5
    // new fields AND new linked records surface — each spaced
    // attempt re-enters the hierarchy (§5.42) on a different
    // path; the night's consolidation (§4.6) has also reshuffled
    // strength, changing what the same cues reach
verbatim-rich / imageable records: the leg applies at full;
    gist-only/generic records: ×0.5 (Erdelyi & Becker's
    pictures-vs-words asymmetry)
```

RW texture: the third retelling of the vacation — weeks
apart — genuinely surfaces the moment the first two didn't;
asking twice in one evening does not. "Sleep on it and ask
again" is a real interrogation strategy (and §5.30 step 4's
delayed second pass already banks on it).

## 52. Cross-cueing — the partner's cue is a WORSE cue, usually

§6.69's collaborative inhibition says dyads recall less than two
solos pooled. The cue literature explains WHY — and finds the
one condition where the partner helps.

- **Reduced cue effectiveness** (Andersson & Rönnberg 1995/1996;
  Andersson, Hitch & Meudell 2006): a partner's recall outputs
  are retrieval cues for YOU — but they are someone else's cues,
  spoken, ill-timed, and they arrive mid-search where spoken
  part-list cues do the most damage (Andersson, Hitch &
  Meudell's timing manipulation: distributed spoken cues
  inhibit MORE than visual pre-cues — §6 part-list made
  temporal). The dyad's deficit IS the cue gap between two
  people's organizations.
- **Cross-cueing null** (Meudell, Hitch & Boyle 1995, QJEP
  48:141; Meudell, Hitch & Kirby 1992): directly hunting for
  "emergent" memories the partner unlocks — category-cue
  manipulations included — repeatedly found NONE during the
  collaborative bout itself. Cross-cueing benefits, where
  found, appear in LATER individual recall (Blumen & Rajaram
  2008), after the interference is gone.
- **The exception is intimacy**: friends help each other where
  strangers can't (Andersson & Rönnberg 1997, Eur J Cog Psych
  9:273 — friends' cues approach self-cue quality); partner-
  generated cues are more idiosyncratic/personalized than
  strangers' and more effective (PMID 41620537 — couples'
  cues resemble self-generated cues).
- **[CONSENSUS: partner cues are on-average worse than own cues
  (this IS collaborative inhibition); CONSENSUS that close
  partners narrow the gap; the emergent-memory claim is
  a long-standing NULL during bouts — we adopt it.]**

Model consequence (§6.69 amendment — jointRecall internals):

```
during jointRecall, partner emissions enter the listener's
    context as cues at origin = ext, but weighted:
        cue_j ×= crosscue_mult(closeness)
        stranger/acquaintance: ≈0.4 — near-ordinary ext cue,
            plus the §5.8 part-list damage on the listener's
            unspoken fields (already modeled — this is WHY
            dyads lose)
        close partner (RelEdge ≥ crosscue_close, ≈0.7):
            ≈0.8 — approaches selfcue_mult without reaching it
            // the couple who finishes each other's memories is
            // real; the stranger who "jogs your memory" mostly
            // interrupts it
emergent records (listener records surfaced ONLY via partner
    cues, unreachable solo): permitted at crosscue_emergent_p
    (≈0.03) — rare per the Meudell nulls; the honest behavior
    is that nothing new surfaces DURING the bout but the
    re-exposure leaves a §5.9-strengthened trace that CAN
    surface on the listener's next solo recall (Blumen &
    Rajaram's delayed effect — free via existing machinery)
```

RW texture: the married pair reconstructing the burglary really
do pull each other back into it; two near-strangers doing the
same exercise mostly overwrite each other's search sets. The
mechanic rewards casting pairs who share history — and prices
the police-interview-by-committee as the worst cuing ecology.

## 53. Pharmacological state-dependence — the dissociative leg

§4 mood-state-dependence (Eich meta) models valence-matched
retrieval. The pharmacological version is older and stranger:
what was encoded intoxicated can be MORE retrievable
intoxicated — despite being globally weaker.

- **Goodwin, Powell, Bremer, Hoine & Stern (1969)** Science
  163:1358 — alcohol state-dependent effects in man: recall
  transfer better intoxicated→intoxicated than
  intoxicated→sober; RECOGNITION unaffected by state change.
  The dissociation is real and modality-specific from the
  first demonstration.
- **Eich (1980)** Mem&Cog 8:157 — the compendium of 27 human
  state-dependence studies: SDR appears in FREE RECALL and
  evaporates under cued recall — state is a WEAK cue,
  out-shone by any real one (the same erasure rule §4 found
  for mood: Mecklenbräuker & Hager 1984).
- **Weingartner, Adefris, Eich & Murphy (1976)** JEP:HLM 2:83 —
  dissociation strongest for LOW-imagery items: state cues
  help only what lacks richer cues to lean on.
- **[CONSENSUS that drug-state SDR exists, is small, is
  recall-specific (recognition-null), and is erased by
  external cues — the three bounds are the design.]**

Model consequence (new §5.46): records gain `encodePhys` —
the pharmacological state bucket at encoding
(sober / intoxicated / sleepdep / caffeinated — coarse, 3–4
buckets, reuse §2's existing intox flags). At retrieval:

```
if m.encodePhys == C.phys AND voluntary RECALL mode:
    w_j += sdr_gain                       // ≈0.08 — small by law
    ×(1 − cueMatch_external)              // Eich's erasure:
                                          // external cues outshine
    ×(1 − 0.5·richness)                   // Weingartner: rich
                                          // records don't need it
recognition mode: sdr_gain = 0            // Goodwin's null,
                                          // locked
mismatch costs nothing (unlike sensory_mismatch_pen — the
    literature shows no penalty arm; null, not negative)
```

RW texture: the regular who was told something at the bar
retrieves it AT the bar again — half from the place (§2), a
slice from the state. The drunk story resurfaces drunk. And
the sim's drug-state bookkeeping finally reaches the retrieval
side, matching the encoding side it already pays.

## 54. Arousal at the moment of search — the retrieval-side narrowing

§2's `arousal_narrowing` and `abc_gain` narrow ENCODING to the
central gist; §35 prices stress-at-test as a θ penalty. The
Easterbrook argument is broader: arousal narrows the usable
cue range itself — and nothing in the spec yet narrows what
a panicked searcher can use.

- **Easterbrook (1959)** — cue-utilization range narrows with
  arousal; at high arousal only central, high-drive cues
  register.
- **Christianson (1992)** Psych Bulletin 111:284 — emotional
  stress and eyewitness memory: recall concentrates on central
  details; peripheral details fall away. (His review centers
  encoding; the retrieval-side extension is our modeling
  hypothesis — the same cue-range logic applies to the search
  set.)
- **Mather & Sutherland (2011)** — arousal-biased competition:
  arousal amplifies whatever is already dominant and suppresses
  the rest — in search terms, the leader gets stronger cues,
  the field gets quieter.
- **[CONSENSUS on the encoding-side phenomenon and the ABC
  principle; retrieval-side cue narrowing is our HYPOTHESIS —
  bounded small and sign-locked by P522.]**

Model consequence (new §5.47): when `C.arousal ≥ arousal_cue_hi`
(≈0.7) during a voluntary bout:

```
peripheral/weak fields contribute ×(1 − arousal_cue_narrow)
                                  // ≈0.6 — place, peripheral
                                  // people, uncued detail
central fields (gist, topic, self-origin): unaffected
dominant competitor boost: top drive item ×(1 + arousal_dom_gain)
                                  // ≈0.1 — ABC: arousal amplifies
                                  // the leading candidate
result: an interrogation DURING the crisis returns the wound
    and the weapon — never the bystander's shoes; calm recall
    later reaches the periphery (and §35's lag means later
    is ALSO impaired — a real double-bind for the witness)
```

## 55. TOT aging — the phonology leg dies first

§5.16 made TOTs stateful; §5.10 already noted name TOT is the
commonest TOT. The diary data add the age gradient and a
surprising sign on the interlopers.

- **Burke, MacKay, Worthley & Wade (1991)** JML 30:542 — diary
  + lab: TOT frequency increases with age; TOT targets are
  infrequent words and PROPER NAMES of recently-uncontacted
  acquaintances, especially for older adults; phonological
  priming resolves; and OLDER adults show FEWER persistent
  alternates (wrong-word intruders) than young — the aged
  deficit is a weaker connection, not a stronger competitor.
- **Maylor (1990)**; **James & Burke (2000)** — age-TOT
  replication; phonological cueing resolves aged TOTs, keeping
  the syllable-leg valid across the lifespan.
- **[CONSENSUS on frequency-up, alternates-down with age.]**

Model consequence (§5.16 amendment):

```
tot_rate_eff = tot_rate · (1 + tot_age_k·ageScale)   // ≈0.8 —
              // stacked on the existing tot_persist leg
tot_resolve_p ×= (1 − tot_res_age_loss·ageScale)     // ≈0.4 —
              // resolution cues still work, slower
persistent-alternate interloper rate ×= (1 − tot_alt_age_loss·
              ageScale)                             // ≈0.5 —
              // old TOTs are emptier, not wronger
interaction: recently-contacted names (lastSeenDay < ~30d)
              resist the age leg ×0.5 — Burke's "recently
              uncontacted acquaintances" clause
```

RW texture: the 70-year-old blanks on the neighbor's name
twice as often — and, curiously, less often blurts the WRONG
name. An empty mouth, not a wrong answer.

## 56. Directed forgetting — "forget it" is a real flag, but a soft one

§24's TNT is effortful suppression WITH the cue present.
Directed forgetting is the coarser cousin: be told to forget,
and the item becomes harder to retrieve — mostly because it
stops being rehearsed.

- **Bjork (1970/1972)** — list-method/item-method DF
  dissociation: forget-instructed items show reduced recall;
  mechanisms differ (list-method: context segregation;
  item-method: selective rehearsal of remember-items).
- **MacLeod (1998)** chapter; **Golding & MacLeod (1998)**
  — DF effects are largely retrieval-side inaccessibility,
  reversible: recognition is far less impaired than recall,
  and forget-cues lose power with reminders/reinstating
  context.
- **[CONSENSUS that DF is real, modest, recall-weighted, and
  largely reversible — the mechanism (rehearsal-starvation vs
  active inhibition) is DEBATED; we implement the soft version
  and keep §24's TNT as the strong one.]**

Model consequence (new §5.48): event records gain `df:true`
when the character is instructed/motivated to forget (dialogue
layer: "don't tell anyone — forget this happened," or self-
directed avoidance of a topic — distinct from §4.12 suppression,
which is cue-specific steering):

```
voluntary recall on sparse cues (cueMatch_ext < selfinit_bar):
    θ += df_pen                          // ≈0.06 — modest
rich cues or recognition mode: df_pen → ×0.3 — the flag
    yields to any real cue; the memory was never inhibited,
    only unrehearsed
rehearsal channels quieted: retell/reminiscence picks the
    record at ×(1 − df_rehearse_pen) ≈0.6 — the mechanism IS
    the starvation; a df record that DOES get retrieved runs
    normal §5.9 and rejoins the ecology
never: df never reaches archived/deleted status, never applies
    to trauma/emotional records (×0.3 — same resistance as §24)
```

RW texture: "forget I said anything" works about as well as it
does for people — the secret doesn't die, it just stops being
rehearsed, and the first decent cue brings it all back.

## 57. Cue hierarchy — v50 additions to the §43 table

| Cue/mechanism | v50 status |
|---|---|
| impl intention | NEW — if-then plan binds cue, near-focal, half doorway cost (§46) |
| name vs semantic | NEW — same-token asymmetry, name_sem_gap on tier-3 (§47) |
| motor/enactive | NEW — self-origin body cue, sparse-cue rescue, doorway-immune (§48) |
| retrieval route | NEW — direct vs generative descent; vague-first outputs (§49) |
| life-script | NEW — milestone drive bonus on life queries, positive-skewed (§50) |
| spaced repetition of search | AMENDED — reminiscence_frac gap-gated (§51) |
| partner cues | NEW — crosscue_mult by closeness; emergent rare; delayed benefit free (§52) |
| drug-state | NEW — encodePhys match leg, recall-only, erased by ext cues (§53) |
| retrieval arousal | NEW — peripheral cue narrowing + dominant boost (§54) |
| TOT age | AMENDED — rate up, resolution down, alternates down (§55) |
| df flag | NEW — rehearsal-starvation penalty, reversible, sparse-cue-only (§56) |

## 58. Validation probes P513–P524 (v50 suite)

- **P513 implementation intention (MUST):** `impl` nonfocal
  intentions fire ≥0.75 (vs plain nonfocal ≤0.6 under matched
  distraction), pay ≤50% monitor_cost, and lose ≤half the
  doorway dip; cues NOT in the plan fire at ordinary nonfocal
  rates (rigidity). Gollwitzer & Sheeran 2006 (PM-arm d≈.40).
- **P514 Baker paradox (MUST):** at matched token and exposure,
  name-tier recall is measurably worse than occupation/identity
  recall of the same person (Cohen 1990); meaningful-name
  exceptions narrow the gap (McWeeny et al. 1987).
- **P515 TOT aging (MUST):** tot_rate_eff rises and
  tot_resolve_p falls monotonically with ageScale; persistent-
  alternate rate FALLS with ageScale; recent-contact names
  resist (Burke et al. 1991).
- **P516 enactment (SHOULD):** enactive-ops records out-recall
  verbal-ops records under sparse cues; reenacted retrieval
  adds a measurable gain; enactive cues survive locShift
  boundaries that drop peripheral context (Roberts et al.
  2022; Kormi-Nouri reenactment).
- **P517 generative descent (SHOULD):** a broad period-scoped
  query emits the period/generic node FIRST and a specific
  episode only after descent rolls; a ≥gen_direct_bar cue
  emits the episode immediately with lower latency; stall →
  vague-flagged generic, not silence (Haque & Conway 2001).
- **P518 life-script (SHOULD):** milestone-positive records
  over-recall on life-story queries vs matched non-milestone
  positives; the milestone advantage is larger inside the
  bump window; negative milestones gain less than positive
  (Berntsen & Rubin 2004 asymmetry).
- **P519 hypermnesia (MUST):** cumulative unique verbatim
  fields across two bouts spaced ≥hyper_gap exceed a single
  bout's yield for verbatim-rich records; massed same-day
  second bouts do NOT; gist-only records show the weaker
  pictures-vs-words asymmetry (Erdelyi & Becker 1974;
  Roediger & Thorpe 1978).
- **P520 cross-cueing (SHOULD):** close-partner emissions cue
  listener records at measurably higher rates than stranger
  emissions at matched overlap; solo-unreachable records
  surface during the bout rarely (≤crosscue_emergent_p
  tolerance) but show post-bout strengthening — dyadic
  output still ≤ pooled solo (§6.69 must hold — inhibition
  not erased, Coman/Meudell nulls honored).
- **P521 pharmacological SDR (SHOULD):** encodePhys-matched
  recall beats mismatched on sparse free recall; the
  advantage vanishes under rich external cues AND under
  recognition mode (locked null — Goodwin 1969); mismatch
  never costs (no penalty arm — Eich 1980).
- **P522 arousal narrowing (SHOULD):** under C.arousal ≥
  arousal_cue_hi, peripheral-field contribution to emitted
  reconstructions falls ≥50% vs calm retrieval while central
  fields hold; the effect is at CUE level (search set), not
  content erasure — the same record fully recalls under calm
  cues (Christianson 1992 logic, retrieval-side flagged
  HYPOTHESIS).
- **P523 directed forgetting (MUST):** df-flagged records
  show reduced sparse-probe recall vs controls AND recover
  under rich cueing/recognition (reversibility — MacLeod);
  they never delete/archive from the flag alone; emotional
  records resist; distinct from §5.23 inhib — df shows NO
  independent-probe deficit under rich cues (Golding &
  MacLeod 1998).
- **P524 cue-ecology regression (MUST):** with all v4.8 legs
  active, P9 (unencoded cue = 0), P10 (saturation <1.6×),
  and P16 (recognition-failure cases) still pass — new cue
  channels must route through §5.1/§5.2, never around them.

## 59. Honest limits (v50 additions)

- impl_* constants adopt the PM-arm effect size (d≈.40), not
  the headline goal-attainment .65 — the PM arm is the
  relevant paradigm; rigidity is consensus-shaped but
  unfitted.
- name_sem_gap is calibrated to the homonym paradigms'
  direction, not a fitted magnitude — name difficulty varies
  with familiarity, and the gap should shrink on high-contact
  persons via existing exposure floors rather than a second
  parameter.
- enact_selfcue assumes the game can flag `encodeOps`
  enactive at runtime; the literature's SPT list paradigm is
  far from autobiographical action memory — flagged as a
  HYPOTHESIS extension beyond the lab.
- gen_direct_bar/hier_descent_p operationalize Conway's
  hierarchy in one draw each — the real model iterates; our
  single-roll descent is the cheap version, flagged.
- lifecue_gain is a directional adoption of the script result;
  the "positive-only" valence asymmetry is the reliable half.
- hyper_gain measures CUMULATIVE yield across spaced bouts —
  Roediger & Thorpe's null on equal-time comparisons is
  honored by leaving massed bouts unchanged.
- crosscue_mult's closeness scaling is our operationalization
  of the friends/partner results; the emergent-memory rate is
  deliberately near the Meudell null.
- sdr_gain applies to coarse pharmacological buckets; finer
  state granularity is unsupported — the literature's effects
  are small even at gross state changes.
- §54's retrieval-side arousal narrowing is the weakest
  citation in the part (encoding-side literature, retrieval-
  side hypothesis) — bounded at ≈0.6 and sign-locked by P522.
- tot_age_k is anchored to Burke's diary frequencies
  qualitatively; the alternates-down arm is adopted verbatim.
- df_pen is the soft DF (rehearsal-starvation) version; the
  stronger inhibitory claims are intentionally NOT adopted —
  §24's TNT is the strong leg already.

# PART VI (v62, 2026-09-23) — the cue's direction, echo, and keeper

v50 asked what a cue is worth; v62 asks the questions the bout itself
raised: is a cue reversible (§60), does a partial hit feed back as a
new cue (§61), can an OBJECT carry a cue the brain never encoded
(§62), does a loud cue do a quiet cue's job in prospective memory
(§63), who gives the searcher permission to stop guessing (§64), does
asking the same question twice wear a path (§65), and does a failed
search reset on a fresh angle (§66). Spec changes land in
`memory-model-spec.md` v5.10 §5.57–5.62; probes P647–P656.

## 60. Directional cues — associations do not run both ways

- **Kahana & Caplan (2002)** JML 46:111 and the surrounding
  paired-associate record: forward recall (cue→target in study
  order) reliably exceeds backward recall (target→cue) under matched
  conditions; asymmetric-association models fit the data, symmetric
  ones do not. Rizzuto & Kahana (2001, JML 44) made the same point
  computationally — the autoassociator can add links it cannot
  reverse for free. **[CONSENSUS for directionality; the size of the
  asymmetry is paradigm-dependent — DEBATED]**
- The social-memory version is older than the lab version: a face is
  a strong cue for the episode ("I know I've seen him — at the
  hearing"), while the episode is a weaker cue for the face — and the
  name leg is weakest of all (§47 Baker paradox already owns the
  name tier). Person↔event links are likewise directional: "who was
  at the party?" (event→people) and "when did you last see Jules?"
  (person→event) are not the same query.
- Model consequence (§5.57): cue match is now direction-weighted.
  cueVector entries mint at encoding with an implicit forward
  orientation (context→content); a reverse query (content cue asks
  for context) contributes `backcue_mult` ≈ 0.6. Person→event and
  event→person are the same link read in both directions —
  `dir_asym` applies per queried field pair, not per record.
  Recognition mode is exempt (copy cues have no direction).

## 61. Iterated cuing — the fragment is the next cue

- **Norman & Bobrow (1979)** Cog Psych 11:107–123 — "Descriptions":
  retrieval proceeds through intermediate partial descriptions; a
  retrieved fragment becomes the next probe's specification.
- **Williams & Hollan (1981)** Cog Sci 5:87–119 — think-aloud
  protocols of long-term search: rememberers visibly cycle —
  retrieve a context, use it to ask a better question, retrieve
  again. The "meta-knowledge" loop is the mechanism behind §49/§5.42
  generative descent; v62 generalizes it beyond the period
  hierarchy.
- **Koriat & Levy-Sadot (2001)** JEP:G 130:395 — accessibility
  accrues with each pass: partial products change the FOK and the
  next search move. This is also why "let me think about it" works —
  the second pass runs on a richer C.
- **[CONSENSUS as protocol description; pass-counts are our
  parameterization — HYPOTHESIS]**
- Model consequence (§5.58): after a generative bout that emitted
  partial fields but no target, the emitted fragment set F folds
  back into C for `recue_passes` ≤ 2 further scans at reduced
  breadth (`recue_breadth` ≈ 0.6). Each pass re-runs §5.2 with F as
  additional cue fields (self-origin, so `selfcue_mult` applies —
  the character generated them). Termination: a pass that adds no
  new field ends the loop (marginal-productivity stop — pairs with
  §5.22's failure stop; the two bound effort from above and below).
  The loop is why a character can say "wait — it was raining that
  night... and the power was out... it was the storm week" and land
  on the record three probes late.

## 62. Evocative objects — the cue outside the head

- **Heersmink (2015)** Rev Phil Psych 6:321 ("Dimensions of
  integration in embedded and extended cognitive systems") + Turkle
  (2007, *Evocative Objects*): keepsakes, instruments, and rooms
  function as standing retrieval cues — distributed memory, not
  metaphor. **[CONSENSUS as phenomenon; quantitative weights are
  ours — HYPOTHESIS]**
- **Henkel (2014)** Psych Sci 25:396 ("point-and-shoot memories",
  verified): photographing an object whole *impaired* later memory
  for it vs observing — the camera offloads attention; zooming to
  frame a detail eliminated the impairment (attention re-engaged).
  **Barasch, Diehl, Silverman & Zauberman (2017)** JPSP 112:741
  found the complement: photo-taking *can* enhance visual memory
  through the attention mechanism when the photographer stays
  engaged; the impairment is the offloading leg, not the act.
  **[DEBATED — sign depends on engagement; we model both arms]**
- Review side: Koutstaal et al. (1998/1999) and the autobiographical
  photo-cueing literature — reviewing photos reinstates; the photo
  is a durable external cueVector.
- Model consequence (§5.59): the world gains `artifact` cue anchors.
  An Event flagged `photographed:true` with `photoMode:"whole"`
  takes `photo_offload_pen` (×≈0.85 on E — encoding side, attested);
  `photoMode:"detail"` takes none (locked null `photo_detail_null`).
  The artifact mints an `objLink` on the record — a standing cue
  field with `obj_cue_w` ≈ 0.15 that does NOT decay with place:
  seeing the keepsake cues the event from anywhere, years later
  (sensory_age_slope applies — old objects reach old memories).
  Rehearsing with the artifact present (showing the photo while
  retelling) counts as a §5.9 retrieval for the linked record.

## 63. Pop-out cues — the loud nonfocal cue

- **McDaniel & Einstein (1993)** Memory 1:23–41 (verified):
  unfamiliar and *context-distinctive* PM target cues significantly
  improved prospective remembering — distinctiveness partially
  substitutes for focality.
- **Brandimonte & Passolunghi (1994)** QJEP 47A:565: cue-
  distinctiveness benefits grow with retention interval — the odd
  cue survives the delay that kills the ordinary one.
- Einstein & McDaniel (2005, Curr Dir 14:286) multiprocess framing:
  a distinctive cue in a sparse field earns spontaneous retrieval
  without full monitoring. **[CONSENSUS for direction; magnitude
  SINGLE-paradigm anchored]**
- Model consequence (§5.60): PM cues gain a `popout` grade computed
  from the ambient distinctiveness the game already tracks — a cue
  event whose novelty ≥ `distinct_gate` (reused — the isolation
  shield's threshold) in its context gets `pm_popout_gain` ≈ 0.2
  added to `pm_monitor_p`, bridging nonfocal→focal: "hand the parcel
  to the man in the parrot suit" needs less monitoring than "hand it
  to Jules." The benefit grows with arming delay —
  `pm_popout_gain·(1 + log1p(delayDays/7))` — matching Brandimonte &
  Passolunghi's interval interaction.

## 64. The asker's license — report option is part of the cue

- **Koriat & Goldsmith (1996)** PBR 103:490 — the monitoring-and-
  control model: memory report = retrieval accuracy × report policy.
  Forced responding raises quantity and lowers accuracy; the free-
  report option lets rememberers withhold. The accuracy/quantity
  trade-off is a response-decision variable, not a trace property.
  **[CONSENSUS — one of the best-replicated effects in the field]**
- Demand characteristics (Orne 1962; eyewitness forced-choice
  paradigms): a direct question from a present person obliges a
  search AND pressures emission — "do you remember?" answered with
  silence costs face. The rapport literature (cognitive-interview
  follow-ups; Vallano & Schreiber Compo 2011) adds the cooperative
  leg: a trusted asker lowers the emission threshold productively
  (more volunteered detail, not more confabulation), a hostile or
  demanding asker lowers it unproductively.
- Model consequence (§5.61): a retrieval context carries
  `asker:{rel, forced}`. `forced:true` probes (interrogation, a
  pointed "well?") switch emission to forced mode — emit the best
  candidate above `forced_floor` ≈ 0.25 rather than the honest θ,
  flagging it `hedged:true` (the "I think so?" answer — quantity up,
  accuracy down, P653 sign-locks the trade-off). A trusted asker
  (rel ≥ close) adds `rapport_gain` ≈ 0.1 to search breadth — the
  character digs deeper for a friend, not harder for a stranger.

## 65. Route practice — the probe wears a path

- Retrieval practice literature, read cue-side: what strengthens in
  repeated testing is the *cue→target route*, not an abstract trace
  (Karpicke & Roediger 2008's massed-versus-tested asymmetry;
  Carpenter & DeLosh 2006, Applied Cog Psych 20:123 — poor cues gain
  the most from retrieval practice; cue elaboration under weak
  cues). Re-asking the SAME question is a different operation from
  asking a DIFFERENT question about the same memory.
- **[CONSENSUS that repeated retrieval strengthens; the cue-route
  decomposition is our operationalization — HYPOTHESIS]**
- Model consequence (§5.62): cueVector field keys mint
  `routeHeat[j]` — each successful recall via field j adds
  `route_gain` ≈ 0.05 to that field's w_j for that record (capped at
  `route_cap` ≈ 1.5× base; decays at `route_hl` ≈ 30d — worn paths
  fade, they are not grooves). Consequences: the question a
  character has answered six times comes out fast and polished
  (route-rehearsed — the "party story" quality); a novel question
  about the same event starts cold. Combined with §5.22 sampling
  this produces the human asymmetry: high-route fields dominate the
  bout, crowding out the details nobody ever asks about.

## 66. Fresh-angle restart — a failed search resets on a new cue

- **Geiselman & Fisher** cognitive-interview mnemonics (Fisher &
  Geiselman 1992, *Memory-Enhancing Techniques for Investigative
  Interviewing*): "recall in different order" and "recall from
  another perspective" are instructed *restart* operations —
  changing the retrieval path recovers items the first pass missed.
  CI meta-analyses (Köhnken et al. 1999; Memon, Meissner & Fraser
  2010, Psych Bull 136:340 — d ≈ 1.2 correct-detail gain, small
  error cost) place a large share of the CI benefit in the
  varied-retrieval mnemonics.
- Mechanistically this is cue-freshness: a second bout on the SAME
  cue vector inherits §5.13 output interference — the emitted items
  suppress the rest. A genuinely different cue vector starts a new
  bout on a new partition of the search set.
- **[CONSENSUS that varied retrieval helps; the restart-not-
  continuation operationalization is ours — HYPOTHESIS]**
- Model consequence (§5.62 tail): when a voluntary bout ends in the
  §5.22 failure stop, a subsequent bout whose cue keys overlap the
  failed bout's keys by < `restart_overlap` ≈ 0.4 is a RESTART —
  output-interference counters reset, kmax restored. Overlap ≥ the
  gate is a CONTINUATION — counters persist (re-asking the same
  question immediately is the worst probe, matching the interview
  literature's warning against repeated identical questioning).

## 67. Cue hierarchy — v62 additions to the §57 table

| Cue/mechanism | v62 status |
|---|---|
| cue direction | NEW — forward full-weight, reverse ×backcue_mult (§60) |
| iterated recue | NEW — emitted fragments re-enter C, ≤2 passes (§61) |
| artifact/object | NEW — objLink standing cue, age-scaled; photo offload pen at encode (§62) |
| PM pop-out | NEW — distinctive nonfocal cue ≈ focal, delay-growing (§63) |
| asker license | NEW — forced probes drop floor + hedge flag; trusted askers widen breadth (§64) |
| route heat | NEW — per-field practiced-cue weight, capped + decaying (§65) |
| bout restart | NEW — low-overlap new cues reset output interference (§66) |

## 68. Validation probes P647–P656 (v62 suite)

- **P647 directionality (MUST — sign-locked):** at matched overlap
  and df, forward queries (context→content) out-recall reverse
  queries by ≥1.3× on sparse cue sets; recognition-mode probes show
  no asymmetry (Kahana & Caplan 2002).
- **P648 iterated cuing (SHOULD):** a generative bout allowed
  recue passes surfaces strictly more targets than one capped at
  direct-only; the marginal yield of pass 2 < pass 1 (diminishing —
  Norman & Bobrow descriptions).
- **P649 evocative object (MUST):** presence of a linked artifact
  raises recall of the linked record vs a matched unlinked record at
  equal cue overlap; the lift is preserved at old record ages where
  place reinstatement is the only rival cue (sensory-age scaling —
  the keepsake outlasts the apartment).
- **P650 photo offload (MUST — two arms):** `photographed:"whole"`
  events encode weaker (lower E) than matched observed events;
  `photographed:"detail"` events show NO deficit (locked null —
  Henkel 2014 zoom arm); photo review strengthens the linked record
  (Koutstaal arm).
- **P651 PM pop-out (SHOULD):** a nonfocal PM cue with ambient
  novelty ≥ `distinct_gate` fires at ≥0.8× the focal rate, vs ≤0.6×
  for matched ordinary nonfocal cues; the advantage grows with
  arming delay (Brandimonte & Passolunghi interval arm).
- **P652 asker license (MUST — sign-locked):** forced probes emit
  more total fields AND lower field accuracy than free probes on the
  same store (Koriat & Goldsmith trade-off); trusted askers raise
  search breadth without raising the error share.
- **P653 hedged flag (SHOULD):** forced-mode emissions carry
  `hedged:true` and downstream hearsay propagation (§6.x) inherits
  the flag at reduced confidence — forced answers enter the rumor
  ledger marked weak, not clean.
- **P654 route practice (SHOULD):** a field probed ≥5× on the same
  record recalls at ≥1.2× its base-field rate while an equally-
  encoded never-probed field stays at base; route heat decays —
  re-probe after `route_hl` shows regression toward base.
- **P655 restart vs continuation (SHOULD):** after a failed bout, a
  low-overlap cue set yields higher recall than a re-asked identical
  set on the same records (CI varied-retrieval; Köhnken 1999).
- **P656 cue-ecology regression (MUST):** P9/P10/P16 (gating,
  saturation, recognition-failure) still pass — direction weighting,
  recue passes, and route heat all route through §5.1/§5.2, never
  around them.

## 69. Honest limits (v62 additions)

- `backcue_mult` is direction-anchored (Kahana & Caplan) but the
  magnitude is list-paradigm — autobiographical links may be nearer
  symmetric; flagged.
- `recue_passes` = 2 is a compute choice; Williams & Hollan's
  protocols showed longer chains in motivated rememberers. The
  marginal-stop rule bounds cost; pass depth is clamped, not fitted.
- `obj_cue_w` has no direct experimental calibration — evocative-
  objects work is qualitative; we anchor it below place reinstatement
  and let P649 test the ordering.
- The photo literature is split: Henkel (impairment) and Barasch
  (attention benefit) are reconciled by the engagement moderator —
  our `photoMode` split is the honest version; a world that only
  ever flags `whole` still runs.
- `pm_popout_gain` inherits SINGLE-grade replication — effect real,
  magnitude ours.
- `rapport_gain` and `forced_floor` operationalize report-option
  theory; the honest implementation emits the SAME candidates with a
  lower floor — the pressure is on the report, never on the store.
- `route_gain` is the smallest effect in the part; it exists to make
  rehearsed anecdotes distinct from fresh recall, not to move
  population statistics.
- `restart_overlap` is a threshold we chose; the CI literature
  supports the direction, not the number.

# PART VII (v74, 2026-09-23) — the cue's mode, company, and quitting time

Six parts priced what a cue IS (diagnosticity, direction, ownership,
loudness, reach). This part prices the stance the rememberer brings,
the company cues keep, and the search's end. Eight mechanisms:
retrieval mode (the frame the cue lands in), cue-carried valence,
conjunctive cues (ecphory's real algebra), event clusters (the
autobiographical chunk), burst emission (recall arrives in pulses,
not a stream), analogical reminding (the structural cue), implicit
contextual cuing (the cue nobody remembers), and the give-up rule
(every bout has a termination criterion, and it is metacognitive,
not mechanical).

## 70. Retrieval mode — the cue lands in a frame

**Tulving (1983,** *Elements of Episodic Memory*): ecphory is a
three-term product — cue × trace × **retrieval mode**. A person in
"episodic mode" treats incoming stimulation as cues to past
experience; the same stimulation in "semantic mode" (knowing,
not remembering) is processed for fact content and never starts an
episodic search at all. **Herron & Rugg (2003)** *J. Cogn.
Neurosci.* 15:843 and Rugg & Wilding (2000, *Trends Cogn. Sci.*
4:108) showed retrieval orientation is a real, separable brain
state — the same physical cue word elicits different cortical
processing depending on whether the task is set to episodic or
non-episodic ends. **[CONSENSUS that modes exist; the gating
strength is DEBATED.]**

The v0 spec has `cueContext.mode ∈ {recall, recognition}` — a
match-mode, not a search-mode. They are orthogonal: you can
recognize a face (recognition match) while in semantic mode
("I know that face" — no episode retrieved), and you can run an
episodic search that ends in a familiarity answer. The missing
term is **orientation**: what the character is trying to do when
the cue arrives.

Model consequence (new §5.69): `cueContext` gains
`orient ∈ {episodic, semantic}`, defaulting by cue provenance:
- Questions phrased as "remember when…", "what was it like…",
  self-directed reminiscence, sensory/odor/music cues → `episodic`.
- "Do you know…", factual queries, schedule checks → `semantic`.
- Ambient/involuntary scan runs `episodic` (involuntary memory is
  definitionally episodic — Berntsen 1996).

In `semantic` mode: sensory/scene cue fields contribute ×
`sem_cue_pen` (≈0.4 — the odor still works but muted); verbatim
detail fields are not emitted (gist only — you "know" without the
scene); TOT and `familiar_only` states are unreachable (TOTs are
episodic-search states); latency floor drops (no search descent —
semantic answers are fast or absent, §5.25's floor halves). In
`episodic` mode all existing machinery runs unchanged. A mode flip
mid-bout (asker rephrases "no — do you remember it?") costs one
restart (§66 applies — new orient = new cue set).

RW texture: the difference between a character who can tell you
*that* Marisol works Tuesdays and one who *remembers the morning
she told them* — same record, different orientation, different
surface detail. Dialogue systems that never set `orient` default
everything through episodic — the honest default, since casual
conversation is episodic-leaning (Berntsen's diary studies: most
spontaneous retrievals are episodic).

## 71. Cue valence — the cue carries a mood of its own

The spec has mood-dependence (C.mood ↔ record valence, §2/§35)
and mood bleed on report (§5.5). Both assume the valence lives in
the *person*. But cues carry valence too: the word "wedding" is
a positive cue regardless of the hearer's mood. The AMT
literature's standard observation — valenced cue words retrieve
same-valence autobiographical memories faster and more often
(Galton 1879's breakfast-table method already showed it; Crovitz
& Schiffman 1974's norms formalized it; Schlagman, Schulz &
Kvavilashvili 2006 *Memory* 14 — involuntary memories are cued by
matched content AND valence) — is a cue-side effect, not a
mood-side one. **[CONSENSUS direction; magnitude small-moderate.]**

Model consequence (new §5.70): `cueVector`/`cueContext` gain
`valence ∈ [-1,1]` (world tags cue words/objects/places; people
cues inherit the referent's current eval). Per-record:

```
c_valence = w_valcue · (1 − |cue.valence − m.valence|/2)
w_valcue ≈ 0.15 — below w_people/w_place, above w_when
```

Valence match is a *weak* cue — it never gates alone (§5.1 floor:
a valence-only context can't cross θ on a cold record) but tilts
competition inside the bout. Interaction with mood: `c_valence`
and the §2 mood-match term multiply — a sad character handed a
happy cue still retrieves mostly sad material (mood beats cue;
the mood channel is stronger, `w_mood` > `w_valcue` — consistent
with mood-congruence metastasizing under depression while cue
valence effects stay modest in normals).

The interaction worth a probe: **negative cue + positive record**
is the mismatch with the most suppressive asymmetry — negative
cues disproportionately surface overgeneral/semantic responses in
vulnerable profiles (Williams & Broadbent 1986's cue-valence
finding on the AMT). Implement: on valence-mismatched recall of a
negative-cued probe, `specificity_eff` additionally ×
`(1 − valmismatch_gen·(neurot+depr)/2)` — the vulnerable profile
answers "tell me something bad" with a summary, not a scene.

## 72. Conjunctive cues — ecphory's real algebra is not noisy-OR

§5.2 combines cue fields by noisy-OR: independent evidences,
subadditive at the top. The ecphory literature says that's the
wrong algebra for *jointly configural* matches. **Watkins (1979,**
"Engrams as cuegrams and forgetting as cue overload," in Cermak &
Craik eds., *Levels of Processing in Human Memory*): the cue and
the trace are the same kind of thing — retrieval is the overlap of
two *cuegrams*, and what matters is the joint configuration, not
the count of matching features. **Tulving (1983):** ecphoric
information is *interactive* — a name plus a place can retrieve
what neither retrieves alone, not because two votes beat one but
because the conjunction specifies a unique event. Empirical floor:
**Rubin & Wallace (1989)** *Cog. Psychol.* 21:513 — rhyme+meaning
conjoined cues produced effects neither cue class predicted
additively; and the everyday fact that "the place AND the person"
narrows to one memory where each alone fans out to dozens —
this IS the fan effect's other face (§20): fan is computed per
field, but the joint (place ∧ person) may have fan ≈ 1 even when
each marginal fan is huge. **[CONSENSUS mechanism; our
implementation is a HYPOTHESIS form.]**

Model consequence (new §5.71): after the noisy-OR mass is computed,
add a conjunction bonus:

```
config_bonus = config_gain · max(0, nJoint − 1) / (1 + fan(C_joint))
nJoint = #fields with c_j ≥ 0.5·w_j AND diagnosticity_j ≥ diag_mid
fan(C_joint) = records matching ALL qualifying fields jointly
config_gain ≈ 0.08 (≤ a half-field's worth — conjunction helps,
never dominates)
```

`fan(C_joint)` is the load-bearing term: a rare conjunction
("Mudhaus" + "the landlord") is nearly fan-free even though each
field alone is a crowded bucket; a common conjunction ("home" +
"partner") earns almost nothing. This is where the oddball shield
(§42) and diagnosticity (§20) pay off together — singleton buckets
stay immune, but now rare PAIRS earn their own immunity.

Locked null `config_oracle_null`: the conjunction bonus may only
be computed over fields the character actually encoded — no
"the place must have been X" inference backwards into cueVector.

## 73. Event clusters — the autobiographical chunk is bigger than the record

The spec's contiguity term (§5.4) lets a recalled record cue its
temporal neighbors. The event-cueing literature says the
autobiographical chunk is not defined by clock adjacency.
**Brown & Schopflocher (1998a)** *Psychol. Sci.* 9:470 + **(1998b)**
*Appl. Cogn. Psychol.* 12:305 — the event-cueing paradigm: give
people their own event descriptions as cues and ask for a related
event; the retrieved pairs reveal **event clusters** — groups of
personally-experienced events bound by causal relatedness, temporal
proximity, and content similarity, structured "like episodes in a
story," found regardless of event age or importance, and — the
load-bearing finding — **clusters need not be narrated to exist**
(narrative processes may shape but are not necessary for cluster
formation). Brown (2005, *Memory* 13 — "On the prevalence of
event clusters") replicated with transitions: cluster formation
concentrates at life transitions. Companion result:
clustered memories are **dated worse** than unclustered ones
(Brown, Shevell & Rips 1986's dating work; Brown 2005) — the
cluster protects the content while smearing the calendar.
**[CONSENSUS on existence; structure sizes are HYPOTHESIS.]**

Model consequence (new §5.72): records mint an `evClust` id —
assigned at encode when an incoming event shares causal/temporal/
thematic continuity with a live cluster (world-supplied
`continues:eventId` preferred; else `clust_mint_p` ≈ 0.2 when
place+people+topic all overlap an open cluster — "the apartment
search," "the feud," "the trial"). Clusters cap at `clust_cap`
(≈8 members; older members roll off as cluster-mates only, they
keep their solo records). Retrieval:

```
on hit m:  cluster-mates get  C-share × clust_gain (≈0.25)
           inside a bout, cluster-mates are preferentially next
           emissions (feeds §73's burst structure below)
dating:    when-field reports on clustered records get
           when_err × (1 + clust_date_blur)  (≈0.5 — the cluster
           protects content, smears calendar)
```

This is NOT §5.4 contiguity (clock neighbors) and NOT §4.18
periods (era segmentation): clusters are causal-narrative bundles
that can span a period boundary ("the dispute" outlives the move)
or sit inside an afternoon. Emergent: asking about one fight
surfaces the whole feud; asking "when was that" gets vaguer
answers precisely for the best-remembered arcs.

## 74. Burst emission — recall arrives in pulses, not a stream

§5.25 prices latency per emission; §61's recue passes chain
fragments. What's missing is the *shape* of the output stream.
**Gruenewald & Lockhead (1980)** *JEP:HLM* 6:225 — free recall of
category members arrives in bursts: inter-response times are
bimodal, with within-burst items arriving fast and between-burst
gaps marking a strategy/region switch. **Barsalou (1988**, in
Neisser & Winograd eds., *Remembering Reconsidered*) showed
autobiographical recall has the same granular structure —
emissions cluster by event type and period, with extended-event
summaries ("when I worked at the café") punctuating the flow.
Howard & Kahana's retrieved-context machinery (§5.4's basis)
predicts exactly this: each emitted item reinstates its own
context, which preferentially cues its neighbors — the burst is
the contiguity engine's visible exhaust. **[CONSENSUS
phenomenon; our pulse parameters are HYPOTHESIS.]**

Model consequence (new §5.73): a recall bout emits in **pulses**:
- Within a pulse: emissions share the cue neighborhood (cluster,
  period, or field-overlap of the pulse-head); inter-emission
  latency at `lat_pulse` × latency_ms (≈0.4 — fast, riding the
  reinstated context); output interference accrues normally.
- Pulse break: after `pulse_len` emissions (≈3±1, jittered) or
  when the best candidate drops below `pulse_floor` (≈0.7·θ),
  the bout re-searches with a **shifted** cue emphasis (rotate
  the dominant cue field — place → people → topic); the
  inter-pulse gap costs `lat_gap` × latency_ms (≈2.0) and
  partially resets output interference (§66's restart logic,
  smaller magnitude: `pulse_oi_reset` ≈ 0.4).
- A bout ends when a pulse yields zero emissions, or `search_budget`
  (§76) is spent.

Emergent dialogue texture: a character answering "tell me about
that summer" produces "the fire escape … the night Léo locked
himself out … the landlord's letter — " then a pause, then a new
vein. The pauses are where a listener's own cue ("didn't you say
something about a letter?") can steer the next pulse — §52's
cross-cueing now has a temporal insertion point.

## 75. Analogical reminding — the structural cue that surfaces similarity hides

Every cue field so far is *surface*: place, people, topic,
sensory, era. The analogical-reminding literature documents a
second axis — **structural** similarity (same relational
configuration: "a protégé betraying a mentor," "a lie discovered
in stages"). **Schank (1982**, *Dynamic Memory*): remindings are
the memory system's indexing backbone — new experiences are
stored by their differences from remindings. But the experimental
verdict is sharp: **Gentner, Rattermann & Forbus (1993)** *Cogn.
Psychol.* 25:524 — separating retrievability from inferential
soundness: people almost never retrieve remote analogs on
structural similarity alone; retrieval is dominated by surface
("object-level") matches, while *judged* similarity, once the pair
is in front of you, is dominated by structure. **Wharton et al.
(1994)** *Mem&Cogn.* 22 — diary/lab remindings: spontaneous
reminding on structure alone is rare but real, elevated in
domain-rich contexts. **[CONSENSUS: structure weak at retrieval,
strong at judgment.]**

Model consequence (new §5.74): records gain a `struct` tag —
a coarse relational schema (`betrayal`, `discovery`, `exchange`,
`rescue`, `humiliation`, `escape` — the world layer tags event
kinds; ~12 labels, bible-stable). Cues:

```
c_struct = w_struct · match(C.struct, m.struct)
w_struct ≈ 0.12 — the weakest priced field
match = 1 if identical tag; simOp over a small hand-set
        similarity matrix otherwise (betrayal~discovery 0.6 etc.)
```

Gate: `c_struct` counts toward θ only when ≥1 surface field also
matches (surface-gated structure — Gentner's asymmetry made
literal). A pure-structural match never emits on its own; it
contributes only to ordering among surface-matched candidates.
When a struct-matched record does emit (surface support present,
structural match high), it emits with `reminding:true` — the
dialogue render is "that reminds me of…", and §15's reminding
machinery applies: the emitted memory becomes a cue.

Emergent: "watching the new tenant sign the lease" (surface:
papers, landlord) can surface "the day she signed hers" —
same-place, same-act retrieval — while `struct` quietly biases
*which* signing surfaces: a `rescue`-tagged signing beats a
`routine` one when the cue event was itself a rescue. Pure
structural remindings (no surface overlap) are reachable only via
`reminder_chance` (≈0.03 — rare, reserved for high-`imagery`/
high-`narr_agency` profiles) — the novelist's "suddenly it felt
like…", deliberately uncommon.

## 76. Contextual cuing — the cue nobody remembers

Every mechanism above mints or reads a record. **Chun & Jiang
(1998)** *Cogn. Psychol.* 36:28 — contextual cuing: repeated
spatial configurations speed visual search even though observers
cannot recognize which configurations they've seen — a learned
cue→target guidance with *no retrievable record*. Chun & Phelps
(1999, *Nat. Neurosci.* 2:844) showed hippocampal amnesics fail
it (it is memory, not priming-of-perception); **Howard, Howard,
Dennis, Yankovich & Vaidya (2004)** *Neuropsychology* 18:124 —
contextual cuing is **spared in healthy aging** while sequence
learning in the same subjects declines. **[CONSENSUS — one of
the cleanest implicit/explicit dissociations in the literature.]**

This is the ambient-NPC memory: the barista who reaches for the
right cup before the order finishes, the resident whose feet
find the staircase in the dark — competence with no episode
behind it. The spec's `impl_str` channel (§5.35) is the nearest
rail but it hangs off *records*; contextual cuing has no record.

Model consequence (new §5.75): a `ctxcue` layer — per character,
a small table keyed by `cfg_id` (a hash of the current cue
*configuration*: place × present-people × activity, quantized).
Each repeated encounter with the same cfg_id increments
`ctx_n`; once `ctx_n ≥ ctx_thresh` (≈4 exposures), the cfg
grants `ctx_gain` (≈0.15 latency/attention discount) on actions
and scans *inside that configuration* — faster orientation, no
emission, no report. `ctx_n` decays on `ctx_hl` (≈21d); age-flat
(`ctx_age_pen = 0` — Howard 2004, locked); capacity-capped
(`ctx_cap` ≈40 configs, LRU). Zero record surface: probes must
assert the cfg table never mints, never enters cueVector, never
produces a Reconstruction.

This is the mechanism that lets ambient NPCs feel habitual
without burning episodic storage — and the honest answer to
"why does the grandmother still navigate her own kitchen" when
episodic access is failing.

## 77. The give-up rule — every bout ends on a metacognitive bet

Every prior part priced how a bout runs; none priced how it
*stops*. The metamemory literature's answer: search termination
is a decision, not a timeout. **Nelson & Narens (1990**,
*Psychology of Learning and Motivation* 26) — monitoring drives
control: the search continues while expected-yield stays above
its cost. The yield signal is **FOK**: **Koriat (1993)** *Psych.
Rev.* 100:609 — accessibility model: FOK tracks the *amount of
partial information retrieved*, not trace strength — which is
why high-FOK failures (lots of fragments, no answer) still feel
"almost there." And FOK changes behavior: **Costermans, Lories
& Ansay (1992)** *Acta Psychol.* 80 — FOK magnitude predicts
search persistence; **Singer & Tiede (2008)** *Mem&Cogn.*
36:588 — people keep searching longer under higher FOK, and
truncated search is the metacognitive call. **[CONSENSUS that
FOK gates persistence; the stopping function is ours.]**

The spec already emits `fok` as an instrument on TOT/failed
recall (§5.16, built from accessibility). What's missing is that
fok *does* anything: currently a bout ends on candidate
exhaustion or `lat_cap`. Model consequence (new §5.76):

```
search_budget = search_base · (1 + search_persist·FOK_running)
              · (1 − da_giveup_pen·daLoad)
              · (1 − search_age_pen·ageScale)   // shorter searches
              · (1 + 0.3·checker)               // the checker re-searches
search_base ≈ 6 candidate-evaluations (bout scale, not ms)
search_persist ≈ 1.5, da_giveup_pen ≈ 0.4, search_age_pen ≈ 0.3
FOK_running = accumulated partial emissions / denom —
              the instrument, now load-bearing
```

When the budget empties: the bout ends with a **quitting
verdict** emitted for dialogue/metamemory — `giveUp:{fok}` —
the difference between "I don't know" (low FOK, clean
termination) and "I know it, I can't get it" (high FOK,
frustrated termination — eligible for §14 TOT-recurrence on a
later cue). **High-FOK terminations are the important output:**
they're what makes a character say "give me a second, it's
coming" and *return* to the topic unprompted twenty minutes
later — the armed involuntary re-probe (`fok_reprobe` ≈ 0.4
chance the pending cue re-fires within `fok_win` ≈ 0.5d when a
new related cue arrives).

Asymmetry worth a probe: involuntary bouts have `search_budget`
≈ 1 (one shot, cue-dependent — an involuntary memory either
arrives or doesn't); voluntary bouts spend the full budget. The
"tip-of-the-tongue twenty minutes later" is a high-FOK voluntary
failure whose re-probe landed — not a delayed success.

## 78. Cue hierarchy — v74 additions to the §67 table

| Cue/mechanism | v74 status |
|---|---|
| retrieval mode | NEW — orient{episodic,semantic} gates the search mode before the match mode; semantic mutes sensory fields, kills TOT (§70) |
| cue valence | NEW — `w_valcue` weak field; mood-channel still dominates; negative-cue → overgeneral for vulnerable profiles (§71) |
| conjunctive cue | NEW — `config_gain` on ≥2 diagnostic fields, priced by JOINT fan — rare pairs are nearly fan-free (§72) |
| event cluster | NEW — `evClust` causal bundle; emission gain + dating blur inside cluster (§73) |
| burst emission | NEW — pulses on reinstated context; pulse break = cue-field rotation + partial OI reset (§74) |
| structural cue | NEW — `w_struct`, surface-gated; pure-structural reminding rare via `reminder_chance` (§75) |
| implicit config | NEW — `ctxcue` table, record-free competence, age-flat, capacity-capped (§76) |
| quitting rule | NEW — `search_budget` scaled by FOK_running; `giveUp` verdict; `fok_reprobe` armed (§77) |

## 79. Validation probes P787–P794 (v74 suite)

- **P787 mode gating (MUST — sign-locked):** same record, same
  cue mass — `orient:semantic` emits zero verbatim/scene fields
  and never produces `tot:true`; `orient:episodic` emits both;
  a mid-bout rephrase semantic→episodic recovers detail with a
  restart signature (Tulving 1983; Herron & Rugg 2003).
- **P788 cue valence (SHOULD):** at matched mood, a positive cue
  retrieves positive records ≥1.15× vs a valence-flipped cue on
  the same store; a negative cue against a neurot/depr-high
  profile raises the generic-record share (overgeneral arm —
  Williams & Broadbent sign). Mood held fixed: the effect must
  NOT vanish (it's cue-side, not mood-side).
- **P789 conjunctive cue (MUST):** two cues each with marginal
  fan ≥10 but joint fan ≤2 retrieve their joint target at
  ≥1.3× the sum-vs-noisy-OR prediction WITHOUT the bonus, and
  beat a same-mass single-field cue; `config_oracle_null`
  structure-checked — conjunction never reaches into unencoded
  fields.
- **P790 event cluster (MUST — two arms):** cuing with one
  cluster member retrieves a cluster-mate at ≥1.3× a
  non-cluster record matched on temporal distance; AND
  clustered records' when-field error exceeds unclustered
  controls at equal R (cluster protects content, smears
  calendar — Brown & Schopflocher 1998; Brown 2005).
- **P791 burst structure (SHOULD):** emission inter-arrival
  times within a bout are bimodal — within-pulse gaps <
  between-pulse gaps by ≥3×; a pulse break predicts a shift in
  the dominant cue field of subsequent emissions (Gruenewald &
  Lockhead signature).
- **P792 analogical reminding (SHOULD — gated):** struct-matched
  records with zero surface overlap emit ≤`reminder_chance` of
  the time and always carry `reminding:true`; with surface
  support present, struct-match raises emission ordering among
  candidates (Gentner 1993's asymmetry: judgment yes, retrieval
  gated).
- **P793 contextual cuing (MUST — record-free):** an ambient
  character in a cfg seen `ctx_thresh`+ times orients/acts
  faster than in a novel cfg — AND the store shows no mint, no
  cueVector entry, no Reconstruction; at age 75+ the gain is
  undiminished (`ctx_age_pen = 0`, Howard 2004, structure-
  checked).
- **P794 give-up rule (MUST — metacognitive):** identical
  failing searches, partial-info manipulated — high-FOK
  failures run longer (more candidate evaluations) than low-FOK
  ones AND re-fire within `fok_win` at `fok_reprobe` rate; a
  forced interruption at budget=0 emits `giveUp` with the fok
  tag, distinguishable in the emission log from "not found"
  (Singer & Tiede 2008 persistence arm).

## 80. Honest limits (v74 additions)

- `orient` is binary in the spec; the literature treats mode as a
  graded attentional set. Binary keeps the contract shippable;
  `sem_cue_pen` softens the edge. If the dialogue layer can't
  classify phrasing, default `episodic` — the honest bias.
- `w_valcue` is small on purpose. Cue-valence effects are real
  but the mood channel is stronger in every study that measured
  both; inverting them would produce characters more moved by
  words than by feelings.
- `config_gain`'s joint-fan computation costs a second pass over
  the candidate set — acceptable at bout scale, forbidden inside
  the ambient scan (ambient runs noisy-OR only; conjunction is a
  voluntary-search luxury, which matches the literature's
  strategic-search framing).
- `evClust` assignment leans on world-supplied `continues:` tags
  for the hard cases; `clust_mint_p` handles the rest. Cluster
  boundaries are known to be fuzzy in humans (Brown 2005's own
  coding reliabilities); a slightly wrong cluster is truer than
  no cluster.
- `pulse_len`/`lat_pulse`/`pulse_oi_reset` are fits to the burst
  phenomenology, not to IRT distributions — no human IRT corpus
  exists for autobiographical bouts. P791 tests the qualitative
  signature (bimodality + field rotation), not the constants.
- `w_struct` is deliberately the weakest priced field and the
  `reminder_chance` pure-structural path is deliberately rare —
  Gentner's retrievability/judgment split is the strongest
  sign-lock in this part. If P792 shows struct-matches
  competing with surface matches, the gate failed.
- `ctxcue` is a performance layer, not memory — it must never
  surface in dialogue or probes as reportable content. The
  amnesia evidence (Chun & Phelps) means it should ALSO survive
  on profiles whose episodic machinery is degraded — that's the
  honest use, and why it's age-locked flat.
- `search_budget` in candidate-evaluations (not wall time) keeps
  the quitting rule implementation-agnostic; `fok_reprobe` gives
  the sim its "it came to me later" — the single most
  human-recognizable retrieval event in the document, and it
  emerges from a budget and a flag, not a scripted timer.

# PART VIII (v86, 2026-09-23) — the cueless pop, the song, the date that isn't, the word that is

Eight prior parts priced the cue: its weight, its owner, its fan, its
valence, its company, its quitting time. This part prices the residual
cases the cue tables couldn't see — the surface with NO cue (mind pops),
the cue modality the spec never priced (music), the cue humans famously
can't use (calendar dates), the cue the lab uses anyway (the Galton
word), the thinnest cue in dialogue (the pronoun), the cue a partner
builds for you (elaborative scaffolding), the cue the LAST emission
hands the next (temporal contiguity), and the cue a warm-up bout lends
the cold one (specificity induction). Every section ends at the spec:
new params, new nulls, new probes P908–P917.

## 81. Mind pops — the surface with no cue

The involuntary-memory stack (§5, §25) assumes a cue — Berntsen's
diaries found identifiable cues for most involuntary episodic memories.
**Kvavilashvili & Mandler (2004**, *Cognitive Psychology* 48:47–94 —
verified) isolated the harder case: **involuntary SEMANTIC memories**
("mind-popping," Mandler 1994's coinage) — a word, a name, a tune that
arrives with NO episode, NO self-reference, and no identifiable trigger,
most often during automatic activity (walking, washing dishes — the
autopilot state the spec already tracks for involuntary draws). Their
diary studies: pops are common (most respondents reported several per
week), often delayed by hours-to-days from an unnoticed encounter with
the content (very-long-term priming), and frequently resist a
retrospective cue search entirely — the subject cannot say why the
fragment surfaced. **[CONSENSUS that the phenomenon exists and is
cue-opaque; the priming mechanism is their hypothesis, ours is a decayed
seed. See also Berntsen 2021 *Wiley Interdiscip. Rev.* 12 for the
involuntary/episodic boundary.]**

Model consequence (new §5.84): encoding mints not only the record but a
`pop_seed` — a non-record token carrying the gist word/name/melody and a
match-key back to the source record, decaying on `pop_seed_hl` ≈ 48h
(hours-to-days delay is the paper's signature). On each ambient tick in
`autopilot` activity, a seed surfaces at

```
pop_p = pop_rate · pop_auto_mult · (seed_r / seed_r + seed_half)
        · (1 + 0.3·open − 0.3·mindful)
pop_rate ≈ 0.03/hr, pop_auto_mult ≈ 2.0 during automatic activities
        (≈0.4 during focused work — K&M's activity effect)
```

The surfaced emission is a **fragment**: `pop:{gist_term}` — no verbatim
fields, no episode link by default. With probability `pop_link_p` ≈ 0.2
the pop routes to its source record as a weak involuntary cue (the
"…and THAT's why I'm humming this" resolution); `pop_episodic_null`
locks the rest: a pop never emits episode content directly. RW use:
ambient NPCs muttering a name mid-dishes; a main character's "why am I
thinking about apricots?" — the most human-recognizable retrieval event
that ISN'T a memory.

## 82. The song cue — music is a time machine with a bias

**Janata, Tomic & Rakowski (2007**, *Memory* 15:845 — verified): ~30%
of familiar-song presentations evoke an autobiographical memory; the
evoked emotions skew positive (nostalgia was the third most common);
both general and specific AM levels appear. **El Haj, Fasotti & Allain
(2012**, *Conscious. Cogn.* 21 — verified) found MEAMs arise mostly
involuntarily and degrade more slowly than word-cued AMs in aging.
**Jakubowski & Ghosh (2021**, diary study — verified): 83% of
music-evoked everyday memories were rated spontaneously retrieved, a
higher involuntary share than food cues. **Belfi et al. (2022**,
*Psychology of Music* — verified) report MEAMs are episodically RICHER
(more perceptual detail) than face-evoked memories even when both are
involuntary — the richness is a stimulus property, not a retrieval-mode
artifact. **[CONSENSUS that music is a strong, involuntary-leaning,
positive-biased cue; the mechanism (consolidated pairing vs arousal)
is debated.]**

Model consequence (new §5.85): `cueMod:"music"` joins the sensory cue
class with three priced properties —

```
w_music = w_sensory · (1 + meam_gain)            meam_gain ≈ 0.5
invol_share = meam_invol ≈ 0.8   // music cues route to the
        involuntary draw (§5), not the search bout, unless a
        voluntary orient is already armed
valence_pull = meam_pos ≈ 0.6    // candidate ordering nudged
        toward positive records at equal match — the Janata bias
emit_detail += meam_rich ≈ 0.25  // Belfi richness: perceptual
        fields pass the richness gate more often
```

Gate: all four terms scale by trait `music` (v5.15 trait, 0–1) — a
low-music character treats a song as wallpaper (Janata's familiarity
dependence: unfamiliar songs evoked almost nothing). Frozen
`meam_scope:"familiar-music"` — novel music is no cue at all.

## 83. Landmark cues — the date is dead, the transition lives

**Wagenaar (1986**, *Cognitive Psychology* 18 — verified, his own
diary): of the who/what/where/when cues, `when` was the ONLY one that
never worked alone. **Barsalou (1988**, *Psych. Rev.* 95 — verified):
people cannot retrieve autobiographical events from bare date cues —
"what did you do on March 3rd?" draws a blank where "the day the pipe
burst" retrieves instantly; retrieval runs through **extended event
structures** (trips, jobs, relationships), not the calendar.
**Kurbat, Shevell & Rips (1998**, *Mem&Cogn* 26 — verified): subjects
date events by locating them relative to personal landmark events and
calendar reference points — the landmark, not the date, is the index.
**Shum (1998**, *Appl. Cogn. Psychol.* 12 — verified): temporal
landmarks (transitions, firsts, holidays) anchor autobiographical
search. **[CONSENSUS — one of the best-replicated dissociations in the
AM literature.]**

The spec already prices `when` as the weakest cue field (§7 hierarchy);
this section makes the dissociation STRUCTURAL (new §5.86):

- `date_cue_null` (LOCKED): a cue whose only content is a `when` field
  contributes 0 to the episodic match for records past
  `childhood cutoff` — the query reroutes to `lm_route`: nearest
  landmark → its event cluster (§5.72) → normal match inside. A date
  question therefore succeeds by indirection or fails honestly.
- Transition events (moves, job starts/ends, relationship boundaries,
  births/deaths — world tags `transition:true`, else minted at
  `lm_mint_p` ≈ 0.6 scaled by `period_sal`) carry `landmark:true` and a
  `lm_gain` ≈ 0.5 weight bonus when used AS cues or route entries.
- Dating a recalled event = emit nearest landmark + offset ("a few
  weeks after I moved"), with error growing in landmark distance —
  Kurbat et al.'s telescoping lands on the landmark grid, not the
  calendar.

RW consequence: an NPC asked "when did you last see her?" answers "must
have been before the lease ran out" — the landmark does the indexing the
date can't.

## 84. The cue-word probe — Galton's instrument, and its biases

The oldest AM technique is a bare word. **Galton (1879**) walked his own
associations; **Crovitz & Schiffman (1974**, *Bull. Psychon. Soc.* 4 —
verified) formalized the word-cue method and showed the recall-age
distribution decays as a power of retention interval — the function
Ebbinghaus never had a cue for. **Rubin & Schulkind (1997**, *Mem&Cogn*
25 — verified) used word cues to map the lifespan distribution (the bump
instrument itself). **Robinson (1976**, *Cognitive Psychology* 8 —
verified): word class matters — activity/emotion words retrieve faster
and younger-adult memories than object words; object words pull older,
more semanticized content. **[CONSENSUS on the instrument and the
class effect; the mechanism (imagery value vs typicality) is debated —
concreteness mediates (Williams, Healy & Ellis 1999).]**

Model consequence (new §5.87): a bare-word cue gets a `cueword_class`
∈{activity, affect, object, person} tag (world/dialogue supplies it,
default `object`):

```
w_cw = {activity: 1 + cw_act_gain(≈0.4),   // verbs cue best —
        affect:  1 + cw_aff_gain(≈0.25),    // Robinson 1976
        person:  1.0,
        object:  1.0}
age_pull(object) += cw_obj_age ≈ 0.3       // object words bias the
        sampled era older + semanticized (generic records)
```

Locked `cw_verbatim_null`: a bare word can select a record but never
mints verbatim fields — the probe is a selector, not a source. RW use:
the history browser's word search, a "tell me about money" prompt —
the instrument the lab uses is now the instrument the world has.

## 85. Referential poverty — the pronoun is a thin cue

**Ariel (1990**, *Accessing Noun-Phrase Antecedents* — verified):
referring expressions encode the speaker's ASSUMED accessibility of the
referent — full names mark low assumed accessibility, pronouns high,
zero anaphora highest. **Gundel, Hedberg & Zacharski (1993**, *Language*
69 — verified): the givenness hierarchy ranks expression types by the
cognitive status they presuppose. The retrieval consequence the
literature implies but rarely measures directly: a pronoun carries
almost no intrinsic cue content — "she" matches every woman in the
store; resolution falls entirely on the discourse focus stack, and
misresolution is a real, common comprehension error. **[CONSENSUS on
the accessibility marking; the pronoun-as-thin-cue formalization is
ours.]**

Model consequence (new §5.88): dialogue tokens classed
`ref_type` ∈{name, desc, pronoun, zero}. Cue weight multiplies by

```
ref_w = {name: 1.0, desc: 0.8, pronoun: ref_thin(≈0.5),
         zero: ref_thin·0.6}
```

and candidate restriction falls to a `ref_focus` stack (last
`ref_focus_win` ≈ 3 salient referents in discourse) BEFORE the memory
match runs. When two focus-stack referents match equally, misresolution
fires at `ref_mis_p` ≈ 0.15 and the emission carries `refError:true` —
the character remembers the wrong person with normal confidence (a
documented comprehension error, not a memory defect — which is why it
needs no accuracy debit). Locked `ref_boost_null`: a pronoun can never
add cue mass — "she" can only spend what the focus stack supplies.
RW use: "did you tell her?" — the engine now knows *her* is a coin flip
over the last three mentioned women, not a database join.

## 86. The scaffolding cue — the partner who asks better

**Fivush & Fromhoff (1988**, *J. Exp. Child Psychol.* 45 — verified)
and **Reese, Haden & Fivush (1993**, *Cognitive Development* 8 —
verified): mothers with a high-elaborative reminiscing style — open
wh-questions, new information, confirmations — raise children who
produce richer autobiographical reports, and the style effect on the
child's recall outlasts the conversation (Nelson & Fivush 2004,
*Psych. Rev.* 111 review — verified). **Vygotsky's** scaffolding logic
generalizes: a good interlocutor's question IS a cue the partner's
search couldn't build alone. **[CONSENSUS for the developmental dyad;
adult-adult extension is our extrapolation, grounded in §41's interview
protocol (open questions > closed).]**

Model consequence (new §5.89): when a speaker's prompt is classed
`elaborative:true` (open wh-question or statement adding novel
information — the dialogue layer's tag; trait `elabor`, spec §5.6,
drives production), the TARGET's search gains

```
scaf_boost = scaf_gain ≈ 0.35   // on search_budget and candidate
        drive — the partner's question behaves like a self-generated
        cue (§33 mechanism, social source)
        × scaf_child_mult ≈ 1.8 for targets under ~12 — the
          developmental knot the effect was built on
scaf_repeat_pen ≈ 0.5           // nth repetition of the same
        elaborative prompt decays — Reese et al.: it is the NEW
        information that cues, not the asking
```

Distinct from §41 (the interview protocol is a fixed forensic script);
§86 is a per-utterance, partner-dependent property of ordinary talk —
which is why it keys off `elabor` and not a protocol flag. RW use: a
high-`elabor` character literally makes the people around them remember
better — the landlady who asks "what were you doing before you heard
it?" gets real answers.

## 87. Temporal contiguity — the next recall leans on the last

**Kahana (1996**, *Mem&Cogn* 24 — verified) and **Howard & Kahana
(2002**, *J. Math. Psychol.* 46 — verified): in free recall, the
conditional-probability-of-next-item peaks for items encoded adjacent
to the just-recalled one (lag-CRP), with a reliable **forward
asymmetry** — forward neighbors roughly twice as likely as backward.
**Kahana, Howard, Zaromb & Wingfield (2002**, *Psychol. Aging* 17 —
verified): the contiguity effect shrinks with age — older adults'
successive recalls are less temporally chained. **Moreton & Ward
(2010**, *QJEP* 63 — verified): contiguity is much weaker in
autobiographical recall than in list recall — event clusters (§73), not
raw adjacency, dominate AM transitions. **[CONSENSUS for list recall;
the AM down-weight is the honest caveat we encode.]**

Model consequence (new §5.90): within a recall bout, each emitted
record activates its encode-order neighbors (`lag ∈ ±contig_lag_win`,
≈2 records) as zero-cost candidates:

```
contig_w = contig_gain ≈ 0.35 · contig_fwd(≈1.6 forward, 1.0 back)
         · (1 − contig_age_pen ≈ 0.4 · ageScale)   // Kahana 2002
         · (1 − am_att)                            // am_att ≈ 0.6
           when the bout is autobiographical (evClust routing
           active) — Moreton & Ward down-weight
```

Mechanically distinct from §61 iterated cuing: that section re-enters a
retrieved FRAGMENT as a semantic cue; §87 is pure order statistics —
the record at encode-index i±1 needs no content overlap at all. The
pair produces the human signature: recall drifts forward through a day
("and then… and then…") until a cluster boundary cuts the chain.

## 88. The warm-up induction — specificity begets specificity

**Madore, Gaesser & Schacter (2014**, *PNAS* 111 — verified): an
**episodic specificity induction** — recalling a recent event with
prompted episodic detail — increases the specificity of SUBSEQUENT,
unrelated recalls. **Madore & Schacter (2016**, *Memory* 24 review —
verified): the induction flexibly boosts episodic detail across
remembering, imagining, and problem-solving — a retrieval ORIENTATION,
not content transfer. **Jing, Madore & Schacter (2016**, *J. Gerontol.
B* 71 — verified): the induction lifts detail production in older
adults specifically — the population whose spontaneous specificity is
lowest. **[CONSENSUS that the induction works; whether it is a
temporary mindset or a learned strategy is debated — we model the
temporary version, which the data supports.]**

Model consequence (new §5.91): after any bout whose emission detail
passes `esi_thresh` (≈0.7 richness gate), the character carries a
`esi_state` — half-life `esi_hl_bout` ≈ 2 bouts — that adds

```
spec += esi_gain ≈ 0.25   // specificity/detail emission, all
        subsequent bouts while the state is alive
```

Locked `esi_learn_null` (P917): the state decays to zero and never
accumulates — induction is a performance lift, not training; frozen
`esi_scope:"bout-window"`. RW use: the therapist-character's "walk me
through it, what did you see?" genuinely sharpens the next answer —
and an old character's detail deficit is partially recoverable in
conversation, which is exactly the human finding.

## 89. Cue hierarchy — v86 additions to the §78 table

| Cue/mechanism | v86 status |
|---|---|
| mind pop | NEW — `pop_seed` non-record token; fragment-only emission; `pop_link_p` rare episode route; `pop_episodic_null` locked (§81) |
| music cue | NEW — `cueMod:"music"`; involuntary-leaning (`meam_invol`), positive-biased (`meam_pos`), detail-rich (`meam_rich`); trait-`music` gated; `meam_scope` frozen (§82) |
| landmark | NEW — `landmark:true` minted on transitions; `lm_route` replaces date matching; `date_cue_null` locked (§83) |
| cue word | NEW — `cueword_class` pricing (activity>affect>person>object); `cw_obj_age` era pull; `cw_verbatim_null` locked (§84) |
| referential form | NEW — `ref_type` weight ladder + `ref_focus` stack gate + `ref_mis_p` misresolution; `ref_boost_null` locked (§85) |
| elaborative prompt | NEW — `scaf_boost` on partner search; child knot `scaf_child_mult`; `scaf_repeat_pen`; trait-`elabor` sourced (§86) |
| temporal contiguity | NEW — encode-neighbor activation `contig_w`, forward-biased, age- and AM-attenuated (§87) |
| specificity induction | NEW — `esi_state` post-high-detail bout; `esi_gain` temporary; `esi_learn_null` locked, `esi_scope` frozen (§88) |

## 90. Validation probes P908–P917 (v86 suite)

- **P908 mind pop (MUST — structure-locked):** seeds minted at encode
  decay on `pop_seed_hl`; pops fire preferentially in `autopilot`
  (`pop_auto_mult` arm) and emit `pop:{gist_term}` with ZERO verbatim
  or episode fields (`pop_episodic_null` structure-checked); ≤
  `pop_link_p` of pops route to the source record (K&M 2004).
- **P909 MEAM (MUST — two arms):** a familiar-music cue retrieves AMs
  with involuntary share ≥ `meam_invol`·0.9 and emitted perceptual
  detail ≥ `meam_rich`·0.8 above matched face cues; an unfamiliar
  (novel) song cues ≈0 (`meam_scope`, Janata familiarity arm).
- **P910 date null (MUST — sign-locked):** "what happened on <date>?"
  as sole cue retrieves nothing beyond chance from episodic store
  (`date_cue_null`), while the same event via its landmark cluster
  retrieves normally; the report phrases dating as landmark+offset
  (Kurbat 1998), never bare calendar.
- **P911 cue-word class (SHOULD):** activity words retrieve ≥1.2×
  object words at matched frequency; object-word hits skew older and
  more generic-record than activity-word hits (`cw_obj_age`,
  Robinson 1976).
- **P912 referential poverty (MUST):** replacing a name cue with a
  pronoun on the same referent drops recall probability by ≥
  (1−`ref_thin`)·0.8 UNLESS the referent is alone in `ref_focus`;
  with two matched referents in stack, `refError:true` emissions fire
  at `ref_mis_p`±20% (Ariel 1990).
- **P913 scaffolding (SHOULD — dyadic):** an elaborative prompt from a
  high-`elabor` speaker raises partner emission detail/count by ≥
  `scaf_gain`·0.8 vs a closed prompt; the boost on child targets is ≥
  `scaf_child_mult`·0.8× the adult boost (Reese et al. 1993); prompt
  repetition decays per `scaf_repeat_pen`.
- **P914 contiguity (MUST — order statistics):** within a bout,
  next-emission records come from encode-index ±`contig_lag_win` at ≥
  2× chance, forward ≥ `contig_fwd`·0.9 × backward; the effect
  attenuates on high-ageScale profiles (`contig_age_pen`) and in
  cluster-routed autobiographical bouts (`am_att`) — both arms
  required (Kahana 1996; Kahana et al. 2002; Moreton & Ward 2010).
- **P915 ESI (SHOULD):** after a bout with emission richness ≥
  `esi_thresh`, the next bout's specificity rises ≥ `esi_gain`·0.8;
  after `esi_hl_bout` bouts the lift is gone AND cumulative —
  `esi_learn_null` structure-checked (no permanent specificity gain,
  Madore & Schacter 2016).
- **P916 pop aging (COULD):** pop frequency declines on old-age
  profiles at no less than the episodic-intrusion decline rate (K&M's
  diary age gradient was shallow — a null-ish arm, logged not
  asserted).
- **P917 scaffolding independence (MUST — negative):** `scaf_boost`
  changes NO record state — the partner's memory strengthens only via
  the normal re-encode of its own emission; a scaffolded recall that
  is not emitted leaves the store identical (scaffolding is a
  retrieval-side gift, not a consolidation lever).

## 91. Honest limits (v86 additions)

- `pop_seed` is our stand-in for K&M's very-long-term priming — the
  48h half-life is a guess; their diaries report delays up to weeks.
  P908 locks the *shape* (delay distribution + autopilot), not the τ.
- `meam_invol` 0.8 comes from a diary study (Jakubowski & Ghosh 2021)
  where "spontaneous" is self-rated — the honest number probably sits
  between Janata's lab-share and the diary's 83%; we took the diary
  because RW's ecology is the diary's ecology.
- `date_cue_null` is deliberately absolute: humans DO answer date
  questions — by landmark reconstruction, which is exactly the
  `lm_route` reroute. If a character answers "March 3rd" fluently,
  that's a bug, not a feature (Wagenaar's `when` never worked alone).
- `ref_mis_p` misresolution has no accuracy debit — comprehension
  errors are not memory errors. The risk: `refError` emissions could
  mask genuine source confusions in probe scoring; the tag exists so
  raters don't double-count.
- `scaf_child_mult` rests on the mother-child dyad literature; the
  adult-adult extension is extrapolation from §41's open-question
  advantage, marked hypothesis in the spec.
- `contig_w`'s `am_att` down-weight encodes Moreton & Ward's null —
  if a future corpus shows strong AM contiguity, the attenuation, not
  the mechanism, is the part to cut.
- `esi_state` models the induction as a decaying orientation (Madore &
  Schacter's "flexible orientation" reading). The alternative — a
  learned strategy that persists — is real but unsupported by their
  decay data; `esi_learn_null` makes the choice falsifiable (P917).

# PART IX (v98, 2026-09-23) — the sample, the overlap, the gate, the pause, the echo

v86 and before priced which cues work, how they combine, who they reach,
and when a search quits. Left unpriced: the retrieval context `C` was
treated as a deterministic readout of the scene — the same room produces
the same `C`, so identical contexts could only differ via the output-side
Bernoulli. That puts all retrieval variability in the die roll and none in
the *searcher*, which is backwards: the sampling models (Estes; SAM) put
the variance in what gets SAMPLED. Four consequences cascade: the same
place legitimately reminds on Tuesday and not Wednesday (§92); a
renovated or lookalike place partially reinstates — `place_reinstate`'s
binary `==` was too coarse (§93); when a cue matches two records
almost-equally the outcome is a discrimination DECISION, not an argmax
(§94); a search interrupted mid-bout loses its un-emitted candidates in a
similarity-graded way (§95); and a failed voluntary search doesn't die —
it arms a latent query that a later cue can trip (§96). Spec changes land
in `memory-model-spec.md` v5.46 §§5.98–5.102; probes P1035–P1044.

## 92. The searcher samples the scene — retrieval-context resampling

- **Raaijmakers & Shiffrin (1981), SAM** (*Psych. Review* 88:93):
  retrieval is a sampling-with-recovery process over a cue-conditioned
  image set; the SAME cue set yields different sampled images across
  attempts. Probabilistic recall is not output noise — it is sampling
  variance.
- **Estes (1955)** stimulus fluctuation — already in the spec for the
  memory side (state-context drift, §4.22/FC§12.6); v98 adds the missing
  half: the *searcher's* context is also a fluctuating sample. The room
  supplies N candidate cue features; the searcher's `C` retains each with
  `ctx_keep_p` (≈0.7), independently, per retrieval bout.
- **Perceptual load gates the sample** — Lavie (1995, 2005) perceptual
  load theory: under high perceptual/cognitive load, task-irrelevant
  stimuli are not processed (inattentional blindness is the extreme).
  **[CONSENSUS]** — a busy character literally does not sample peripheral
  cues: `ctx_keep_p_eff = ctx_keep_p·(1 − ctx_load_pen·load)` — the same
  mechanism that §34 prices on retrieval-time latency/breadth now also
  narrows WHICH features enter `C` in the first place.
- Consequences, all lawful: (a) a re-probe immediately after a failed
  probe shares most of the sampled `C` — outcomes correlate (~0.6), so
  "ask again right now" is nearly a re-roll of the same die; (b) a probe
  hours later re-samples from scratch — outcomes are near-independent —
  the lawful engine of "I couldn't remember at lunch, it came to me at
  dinner"; (c) involuntary retrieval (§5.7) inherits the sample: a
  character in a high-load scene simply doesn't notice the smell that
  would have reminded them.
- Model consequence (§5.98): `C` is minted per bout by per-feature
  Bernoulli(`ctx_keep_p_eff`) over the scene's feature set; identical
  scenes produce correlated-but-different `C`s. `ctx_tau` (context
  persistence, ~30 sim-min) sets the decorrelation horizon: within it,
  the same sample persists (fixations), beyond it, resample.

## 93. Reinstatement is a vector, not a boolean — graded place match

`place_reinstate` fired only on `C.place == m.cueVector.place` — a
name equality. But Smith & Vela's (2001) meta-analysis found the
reinstatement benefit *graded* by how much of the encoding context is
reinstated, and everyday life supplies the intermediate cases the binary
gate throws away: the renovated kitchen, the apartment re-furnished by
the next tenant, the café across town with the same espresso smell.

- Model consequence (§5.99): `place_reinstate` becomes
  `ctx_overlap` — a weighted feature-overlap score over place
  sub-fields {structure/layout, props, occupants, sensory signature},
  `reinstate_eff = place_reinstate·ctx_overlap·(1+log1p(ageDays/30))`
  (age interaction kept). `ctx_overlap`=1 recovers the old binary win;
  ~0.5 (renovated room) reinstates at half; ~0.35 (lookalike café)
  still cues — this is the lawful machinery of *mis-reminding*: the
  wrong place pulling up the right memory.
- **Changed-place flag** — when `C.place_id == m.cueVector.place` but
  `ctx_overlap` ∈ `changed_place_band` [0.3, 0.8]: emit `changed_place`
  — the metacognitive "it's not how I remember it." HYPOTHESIS
  (reconsolidation §6.1 + schema drift §6.4): the mismatch ALSO nudges
  the record's stored place-detail toward the current scene —
  remembering the old café as it looks now; `ctx_drift_pull` 0.02 per
  changed-place visit.
- **Gaze reinstatement** (Johansson & Johansson 2014, *Psych. Sci.*
  25:236 — verified: looking at the encoding-congruent blank locus
  improves retrieval; incongruent locus does not; spatial-relational
  detail benefits most): `gaze_rein_gain` ≈ 0.05 additive cue mass when
  the character's attention rests on the encoding-relevant sub-location —
  micro-mechanism for "I walked back to where it happened and it came
  back." Within-location, not between-location.
- **[CONSENSUS: reinstatement is real, modest, graded. HYPOTHESIS:
  the changed-place distortion pull and the lookalike mis-reminding
  rate — direction is literature, magnitudes ours.]**

## 94. Completion or separation — the retrieval gate on near-twins

The spec prices lure rejection at the discrimination task (§4.x,
Stark/Yassa) but retrieval-time competition was argmax: highest
cueMatch wins. When two records sit within `sep_band` (≈0.15) of each
other, humans face a different computation:

- **Pattern completion** — the cue pattern is close enough to one stored
  trace that the whole trace is reactivated (CA3 auto-association;
  McClelland, McNaughton & O'Reilly 1995). The wrong twin can be the
  completed one → lawful misretrieval ("no, that was the OTHER
  birthday").
- **Pattern separation** — mismatch detected, two representations kept
  distinct (DG; Clelland et al. 2009 *Hippocampus* 19:34 — verified;
  Yassa & Stark 2011 *Trends Neurosci.*). Emission is `mixed_up`: "I'm
  conflating two different times."
- **Aging completes** — Kirwan & Stark (2007, *Learn. Mem.* 14:625 —
  verified): older adults' false alarms to similar lures reflect
  over-completion; Yassa, Lacy et al. (2011) link it to CA3/DG
  imbalance. Children complete too (AD§mnemonic-discrimination
  inverted-U; Ngo et al. 2019) — separation peaks in the middle of
  life, completion dominates at both ends.
- **[CONSENSUS: completion/separation trade-off and its age profile.
  HYPOTHESIS: `sep_band` width and the completion-vs-`mixed_up` split.]**
- Model consequence (§5.100): when the top-two candidate cueMatches
  differ by < `sep_band`, roll the gate: with P = `sep_bias(age)` the
  search separates — emits `mixed_up` plus BOTH candidates at reduced
  confidence; else completes — argmax wins and `borrow_details`
  (probability `comp_merge_p` ≈ 0.3) pulls a verbatim field from the
  loser into the winner's reconstruction (a new distortion operator on
  the retrieve path — near-twin fields migrate, the mechanism behind
  "the two parties blur together"). Separation requires the
  discriminating feature be §5.1-encoded — a character who never encoded
  WHICH year's party cannot separate; they can only complete.

## 95. The suspended bout — what interruption does to an un-emitted recall

§77 priced when a search gives up; nothing priced what happens to the
search that gets cut off mid-bout. The interruption literature says the
suspended search doesn't just pause — it degrades, and *what* interrupts
matters more than how long:

- **Gillie & Broadbent (1989)** *Psych. Res.* 50:243 — verified: an
  interruption's length was NOT the disruptor; SIMILARITY of the
  interpolated material to the suspended task was, as was its working-
  memory demand (complex arithmetic). The suspended item survives in a
  non-articulatory store — but competing similar content displaces it.
- **Monk, Trafton & Boehm-Davis (2008)** *JEP:A* 14:299 — verified:
  resumption lag grows with interruption duration — Altmann & Trafton's
  (2002) goal-activation decay: a suspended goal's activation decays
  while another goal occupies the buffer; resuming requires
  reactivation, priced in seconds.
- Model consequence (§5.101): a retrieval bout holds a sorted pending
  queue; on interruption the queue's head becomes `pending_cand` with
  activation `A`. Each tick suspended: `A *= susp_decay` (≈0.85); an
  interruption whose topics OVERLAP the pending candidate's applies
  `susp_sim_pen` (≈0.6) multiplicatively per tick — a same-topic
  interruption kills the pending line almost surely ("I was about to
  say something about the rent" dies when the other person starts on
  the rent — Gillie & Broadbent's similarity result as the mechanism of
  "it was on the tip of my tongue, gone"). Resumption: if `A >
  susp_floor` (≈0.15) AND a cue reinstates, the bout restarts at the
  pending head with resumption lag ∝ suspension duration; below floor,
  `pending_cand` evaporates — the character emits "I lost it — it'll
  come back" (see §96: it might).
- **[CONSENSUS: similarity > duration for disruption; duration > 0 for
  lag. HYPOTHESIS: the decay constants and the non-articulatory
  survival window `susp_keep_p` ≈0.35.]**

## 96. The loaded question — a failed search arms a latent query

- **Yaniv & Meyer (1987)** *J. Mem. Lang.* 26:187 — unresolved TOT items
  remain in a heightened state of accessibility ("latent memory" for
  inaccessible targets): the failed search is not erased, it stays
  loaded.
- **Incubation** — Sio & Ormerod (2009) meta (*Psych. Bull.* 135:94):
  putting down an unsolved problem and returning yields real gains
  (small-to-moderate); Smith & Blankenship (1991): removal of the
  initial misleading cue set is part of the mechanism — the fresh
  sample (§92) is what a later attempt buys.
- Rubin's "memory of the search" diaries and everyday phenomenology
  agree: "what WAS her name?" resolves hours later, in the shower, on
  an unrelated cue. **[CONSENSUS that unresolved searches persist and
  resolve on later cues; DEBATED whether incubation is cue-set decay,
  unconscious work, or both — we take the cheap, defensible leg: cue-set
  resampling.]**
- Model consequence (§5.102): a voluntary search that ends in
  `giveUp`/`tot` arms an `openQuery` record {cueVector snapshot, armedAt,
  hl `openq_hl` ≈ 2d} with probability `openq_arm` ≈ 0.5 (higher for
  self-relevant questions, lower for asked-and-answered-by-someone-else).
  The §5.7 involuntary scan checks `openQuery` like a nonfocal
  intention: on cueMatch > `openq_fire` (≈0.3 — low bar, the question
  primes its own answer) the query fires → emits `popped` ("it just
  came to me") and re-runs the original search against the NEW sampled
  `C` — which is why it succeeds: new sample, not new memory.
- Locked null `openq_solve_null`: firing an openQuery never retrieves a
  record that the normal threshold wouldn't — the pop uses the same
  machinery; persistence buys a second lottery ticket, not a better
  memory.

## 97. Cue hierarchy — v98 additions to the §89 table

| Cue/condition | Effect | Source |
|---|---|---|
| sampled C | per-bout Bernoulli feature keep; load narrows — same scene ≠ same C | §92 SAM/Estes/Lavie |
| graded place overlap | reinstate ∝ ctx_overlap; lookalikes cue at ~⅓; changed places flag + drift-pull | §93 Smith & Vela; HYP |
| gaze locus | +0.05 spatial-detail cue mass, within-location only | §93 J&J 2014 |
| near-twin band | <sep_band → separate (`mixed_up`, both out) or complete (wrong pick + field borrow); age completes | §94 Kirwan & Stark; Yassa & Stark |
| suspension | pending head decays; same-topic interrupt multiplies decay ×0.6; resume needs re-cue + lag ∝ duration | §95 Gillie & Broadbent; Monk |
| open query | failed search arms 2d latent query; involuntary scan fires it at low threshold; pop = re-run on new C | §96 Yaniv & Meyer; Sio & Ormerod |

## 98. Validation probes P1035–P1044 (v98 suite)

- **P1035 sampling variance (MUST):** identical scene, N=200 probes
  across decorrelated bouts → recall outcomes vary; immediate re-probe
  outcome correlation ∈ [0.5, 0.9] — bounded, not 1.0 (would be
  double-dipping) and not 0 (would deny the shared scene).
- **P1036 load narrows the sample (SHOULD):** high-load scene vs low-load
  same scene → involuntary retrieval count and peripheral-cue recall
  both drop; central-topic recall ~flat (Lavie: load spares focal).
- **P1037 graded reinstatement (MUST):** place overlap 1.0 / 0.5 /
  lookalike-0.35 / 0 → monotone decreasing cueMatch; changed_place
  emitted only in the band; ≥1 lookalike false-cue event in N runs.
- **P1038 gaze locus (SHOULD):** congruent-locus attention recovers
  spatial-relational verbatim fields at +≥5% vs incongruent; object-
  feature fields ~flat (J&J's asymmetry preserved).
- **P1039 separation gate (MUST):** a near-twin pair (Δ cueMatch <
  sep_band): `mixed_up` rate > 0.1; wrong-pick rate > 0.05;
  70yo profile's completion rate ≥ 1.5× the 30yo's; a third record
  outside the band is unaffected.
- **P1040 suspended bout (MUST):** same-topic interruption kills
  pending_cand at ≥ `susp_sim_pen`-consistent rate; unrelated-topic
  interruption survives at ≥ susp_keep_p; below-floor candidate emits
  "lost it" and leaves no retrievable trace (no free rehearsal).
- **P1041 resumption lag (SHOULD):** resume latency scales monotonically
  with suspension duration; length-of-interruption at fixed similarity
  affects lag but NOT survival (Gillie & Broadbent's asymmetry).
- **P1042 loaded question (MUST — locked-null class):** failed search →
  within openq_hl, a matched cue produces `popped` + successful re-run;
  after expiry, rate ≈ baseline; `openq_solve_null` — popped retrievals
  obey the normal threshold exactly.
- **P1043 re-probe decorrelation (SHOULD):** immediate re-probe
  correlation > next-day re-probe correlation by ≥0.3.
- **P1044 changed-place pull (SHOULD):** after K changed-place visits,
  record's stored place-detail drifts toward the visited state vs
  no-visit control; pull per visit ≤ ctx_drift_pull cap.

## 99. Honest limits (v98 additions)

- `ctx_keep_p` 0.7 is our stand-in for stimulus-sampling theory — SAM
  assumes sampling but never prices a scene-feature keep rate; P1035
  locks the observable (outcome variance + re-probe correlation), not
  the constant.
- `ctx_overlap` sub-feature weights are uniform in v5.46; the literature
  grades overlap only qualitatively. The lookalike mis-reminding rate is
  a free prediction — real, but unpriced in humans.
- `ctx_drift_pull` is a modeling hypothesis built on reconsolidation +
  schema drift; no direct human measure of place-record updating by
  changed-place visits. Kept small (0.02/visit) and capped by probe.
- `sep_band`/`sep_bias(age)` translate a neuro-computational account
  (DG/CA3) to a decision threshold; the age asymmetry direction is
  Kirwan & Stark consensus, the 1.5× completion ratio in P1039 is ours.
- `susp_decay`/`susp_sim_pen` quantify Gillie & Broadbent's qualitative
  similarity result; `susp_keep_p` models their non-articulatory store
  as survival probability — the store's real capacity is unknown.
- `openq_arm`/`openq_hl` — Yaniv & Meyer's latency data show persistence,
  not duration; 2d is a guess bounded by diary phenomenology. The
  locked-null probe P1042 is the falsifiable part: persistence must
  never mint access.
