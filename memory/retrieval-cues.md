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
