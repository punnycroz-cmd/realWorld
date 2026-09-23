# False Memory v6 — the system lies, calibrated

**Track:** memory-research (sf/memory) · **Date:** 2026-09-23
**Companion to:** `memory-model-spec.md` (drives spec v0.6),
`human-memory-research.md` R§6, `character-memory-profiles.md`.
**Scope:** turn §6's distortion operators from plausible rules into a
calibrated false-memory engine — the misinformation effect with real
moderators, gist-driven phantom memories (DRM/fuzzy-trace), imagination
inflation and planted events, source-monitoring-as-inference, the
belief/recollection split (nonbelieved memories), corrections that don't
fully work (continued influence), and memory conformity between
co-witnesses. Tag convention unchanged: **[CONSENSUS] / [DEBATED] /
[HYPOTHESIS]**.

**Status flags:** §§1–8 derive from literature; §9 lists spec changes;
§10 adds parameter guidance; §11 probes P39–P47; §12 honest limits.

---

## 0. What the v0–v5 model already does (and where it was thin)

Existing false-memory machinery:

- `§6.1` reconsolidation drift — per-field mutation on retelling.
- `§6.2` confabulation fill — schema-consistent gap filling.
- `§6.3` misinformation merge — `p_adopt = misinfo_suscept ·
  sourceCredibility · (1 − accuracy·0.5)` gated at similarity > 0.4.
- `§6.4` source-tag decay → attribution loss ("I heard somewhere…").
- `§6.5` social convergence — bidirectional merge on discussion.
- `§5.6` lure_accept — similar-cue false positives in recognition.
- `beliefStatus` field — the belief-vs-fact hook.
- Two-channel age split (v0.3): suggestion (U-shaped `misinfo_suscept`)
  vs gist (monotonic `confab_fill`) distortion.

What's missing — this version adds:

1. The misinformation effect has **known moderators the spec ignores**:
   retention interval, post-warnings, repetition (log-saturating), and
   dispute-during-discussion. Source *variability* is a NULL moderator —
   repetition count is what matters (§1).
2. **Corrections don't work fully** — retracted misinformation keeps
   influencing inference (continued influence). Deleting or overwriting a
   record on correction is wrong (§2).
3. **Sleep is double-edged**: deprivation *at encoding* raises
   suggestibility; normal sleep preferentially preserves gist-false over
   verbatim-true content (§3).
4. The model can corrupt records but cannot yet **invent** one. Humans
   hallucinate whole episodes from gist alone (DRM). Need a phantom-record
   generator (§4).
5. `source.kind:"imagined"` exists but nothing writes it. Imagination
   inflation + implanted events need an operator with a plausibility gate
   and calibrated success rates (§5).
6. Source attribution is a static tag; really it's a **probabilistic
   inference that fails in patterned ways** — who-told-me confusions and
   imagined→witnessed reality-monitoring failures (§6).
7. `beliefStatus` is categorical; humans have a continuous, dissociable
   **believe/recollect** pair — nonbelieved memories exist (~20% of
   adults have one) (§7).
8. Conformity numbers exist: 71–79% co-witness adoption, gated by whether
   the account was disputed at the time (§8).

---

## 1. The misinformation effect, calibrated

The three-phase paradigm (witness → post-event narrative → test) is the
most replicated result in memory science. Fifty-year meta-analysis
(Patihis et al., OSF preprint 2025; 480 studies, 1,998 effect sizes,
N=59,079): **g = 0.735** [0.663, 0.808], heterogeneity enormous
(I²=92%) — the "effect" is a constellation, and moderators matter more
than the mean. **[CONSENSUS effect; DEBATED mechanism — genuine
overwriting vs source confusion vs demand]**

Moderators with solid evidence:

- **Retention interval ↑ → susceptibility ↑.** More effect at longer
  delays (Ayers & Reder 1998 meta; confirmed in the 2025 meta). The
  mechanism is trace weakness — misinformation lands hardest where the
  original verbatim is already thin. → `p_adopt` must depend on the
  *target field's surviving strength*, not only record-level accuracy.
- **Post-warning halves it.** Blank (1998)/Huff & Umanath-flavored
  meta-analysis (25 post-warning studies, 155 effect sizes): warnings
  issued after misinformation reduce the effect to **less than half**,
  via a specific increase in misled-condition performance; negligible
  cost to control items. "Enlightenment"-style warnings (explaining the
  manipulation) work best. **[CONSENSUS]** → `warned` flag on
  `hearAccount`, `warn_mult ≈ 0.45`.
- **Repetition ↑ → susceptibility ↑, logarithmically.** Repeated
  misinformation compounds (meta k=19 in Paterson-style analyses); the
  companion finding: **source variability adds nothing once repetition is
  held** (Hewitt et al./meta k=8 — participants respond to retrieval
  fluency, not source-specifying info). Illusory-truth parallel: truth
  ratings rise with repetition count, logarithmic, biggest jump 1st→2nd
  exposure (Hassan & Barber 2021; 2026 meta g=0.37). → track
  `hearCount` per rumor; scale by `1 + rep_gain·log1p(hearCount)`; do
  NOT give a separate bonus per distinct speaker.
- **Dispute at the time blocks it.** Wade et al. 2018 multi-lab (N=486,
  6 countries, all 10 samples): co-witness errors concentrated in pairs
  where the listener had NOT disputed the partner's report during
  discussion. An active objection at exposure ≈ near-immunity for that
  telling. → `disputed: true` on hearAccount sets `p_adopt → ~0` for
  that exposure (and, [HYPOTHESIS], plants a weak counter-trace).
- **Weak originals absorb it.** McCloskey & Zaragoza's modified-test
  literature plus the interval result converge: the misled field must be
  weakly held. → `p_adopt *= (1 − fieldStrength)` per verbatim field
  (replaces the coarse `(1 − accuracy·0.5)`).

Revised operator (spec §6.3):

```
p_adopt = misinfo_suscept · sourceCredibility
          · (1 − fieldStrength)            // per-field, not per-record
          · (1 + rep_gain·log1p(hearCount)) // fluency, capped rep_cap
          · (warned ? warn_mult : 1)
          · (disputed ? dispute_mult : 1)   // ≈0.05
          · (neg_core_resist if valence<−0.3 & arousal>0.6 core field)
          · sleepdep_misinfo_gain           // if encodeDay had poor sleep
```

`fieldStrength` = the verbatim field's own survival (`strength·
verbatimDecay`), so a fresh strong trace resists, a week-old fuzzy one
absorbs. **[HYPOTHESIS on exact functional form — CONSENSUS on the
direction of each moderator.]**

---

## 2. Corrections don't erase: the continued-influence effect

Johnson & Seifert 1994 (warehouse fire): participants told the closet
held volatile materials, then told it was empty — they *remembered the
retraction* and still cited the materials in causal reasoning. The CIE
is robust across materials and tests (Ecker et al. 2010, 2011;
Lewandowsky et al. 2012 review). Findings that constrain us:

- Retraction **from a low-trust source is entirely ineffective**;
  trustworthiness (not expertise) gates it (Ecker & Antonio 2021).
- Even strong retractions leave residual influence; CIE "defies most
  attempts to eliminate it" (Ecker et al. 2011 — even strong retraction
  fails against weak-encoded misinformation's residue).
- Repeating the myth *inside* the correction is NOT harmful — explicit
  reminders make corrections more effective (Ecker, Hogan & Lewandowsky
  2017 — contradicts the old "don't repeat the myth" advice).

**[CONSENSUS]**

**Spec consequence (new §6.6):** a `correction` account never deletes or
overwrites the field. It writes a parallel correction note and flips
`beliefStatus → "doubted"` with probability
`retract_p = correction_strength · sourceCredibility(trust-weighted)`
(≈0.6 for a trusted corrector). The original content keeps a residual
inference weight `cie_residual` ≈ 0.3: gist-level reconstruction and
trait abstraction (§6.4) may still draw on retracted content.
Correction-with-reminder (repeating the content while correcting) raises
`retract_p` ~1.2× — do not penalize restatement.

---

## 3. Sleep and false memory — two opposite findings, both real

- **Frenda et al. 2014** (Psych. Sci., incl. Loftus): 24h total sleep
  deprivation increased misinformation incorporation **only when
  deprivation covered the encoding window** (38% vs 28% misinformation-
  consistent responses, d≈0.27 — borderline but the timing specificity
  is the point). Deprivation after encoding had no effect. Also: ≤5h
  self-reported sleep associated with false memory formation.
  **[CONSENSUS direction; single-lab magnitude]**
- **Payne et al. 2009** (Neurobiol. Learn. Mem.): a night of sleep
  increased both veridical and false (DRM critical-lure) recall vs.
  wake — but false recall was *preferentially preserved* (non-significant
  improvement while veridical decayed). Nap replication. Interpreted via
  fuzzy-trace: sleep consolidates gist. **Partially DEBATED** — a large
  2025 preregistered replication (sleep=104 vs wake) found no raw
  sleep→false-memory effect but found sleep raised false recall *when
  intrusion-adjusted memory was high* — gist abstraction during sleep
  serves veridical and false memory together.

**Spec consequence:**
- Encoding gate: a record whose `createdDay` had
  `sleepFactor_prev < 0.75` carries `sleepdep_misinfo_gain ≈ 1.25` on
  its §6.3 `p_adopt` forever (the susceptibility is baked in at
  encoding). Deprivation after encoding does nothing — matches Frenda.
- Sleep tick: gist-level representations get a small consolidation edge
  that verbatim doesn't — implement as `sleep_gist_boost ≈ 0.05` added
  to `strength` of `generic:true` records and to *phantom lure* records
  (§4) at the daily tick. The clean version of Payne's finding: sleep
  protects meaning, not surface.

---

## 4. Phantom memories: the DRM mechanism for whole events

DRM (Deese 1959; Roediger & McDermott 1995): lists of associates produce
confident false recall of the non-presented lure **40%** (Exp 1) /
**55%** (Exp 2) of lists, and false-alarm *recognition* rates ≈ hit
rates (0.84 vs 0.86). False recall is driven by (a) associative
activation of the lure and (b) list recallability — i.e., monitoring
(Roediger, Watson, McDermott & Gallo 2001: the two factors account for
~84% of explainable variance). **[CONSENSUS]**

Fuzzy-trace theory (Reyna & Brainerd 1995; Brainerd & Reyna 2005):
verbatim and gist traces are stored **in parallel and dissociate** —
verbatim supports true recall and *suppresses* false recall; gist
supports both true recall and false recall. False memories grow as
verbatim decays while gist persists — **aging and delay increase
gist-based falsity** (Koutstaal & Schacter 1997; our `confab_fill`
monotonic channel already encodes the age half). **[CONSENSUS
framework]**

**Spec consequence (new §6.8 — gist-lure/phantom records):** the model
gains the ability to *mint* records for events that never happened:

```
During reconstruction of m (§5.5), a candidate lure field/event exists
if:   gistMatch = overlap(m.cueVector, schema[eventType]) high
      AND verbatim survival low
P(phantomize) = gist_lure_gain · confab_fill · gistStrength
              · (1 − verbatimStrength)          // FTT: verbatim suppresses
              · discrim_mult                   // age: separation deficit
              · (valence<0 ? neg_fidelity : pos_gist_drift)  // v0.5 hook
if phantomize: write the schema-typical detail INTO the record's
               verbatim (accuracy → 0 on that field, confidence += 0.02
               fluency) — or, for a whole missing episode, mint a
               phantom record: accuracy = 0 (hidden), source.kind =
               "self", verbatim generated from schema, phantom: true
```

Whole-episode phantoms should be **rare**: cap by `phantom_p ≈ 0.02`
per reconstructive recall plus a `hearCount`-independent floor — in
DRM the lure needs dense associative support, so require
`fan(m) ≥ phantom_fan_min` (≈4 linked records converging on the lure;
the situation-model version of "the list all points at 'sleep'").
Phantom records decay and reconsolidate like real ones — once minted,
they are indistinguishable to the character.

---

## 5. Imagination inflation and planted events

- **Imagination inflation** (Garry, Manning, Loftus & Sherman 1996):
  imagining a childhood event inflated confidence it happened —
  positive change on 34% of imagined vs 25% of non-imagined items; for
  the window-breaking item, 24% vs 12% increased confidence. Mechanism
  per source-monitoring: imagination generates fluent, event-like
  content that is later misattributed. **[CONSENSUS effect; size modest]**
- **Planted whole events**: Loftus & Pickrell 1995 lost-in-the-mall —
  ~25% developed full/partial memory; preregistered replication Murphy
  et al. 2023: **35%** coded as reporting a false memory. Shaw & Porter
  2015 got rich false crime memories in ~70% under intensive repeated
  guided imagery. The sober systematic review (Brewin & Andrews 2017):
  across implantation studies ~**47%** show *some* recollective
  experience but only ~**15%** meet full-memory criteria; Scoboria et
  al. 2017 mega-analysis re-rate: ~11% substantial + ~9% complete.
  **[CONSENSUS that planting works on a minority; DEBATED rate — 15–35%
  depending on criteria and pressure]**
- **Plausibility gate** (Scoboria, Mazzoni, Kirsch & Relyea 2004;
  Pezdek et al.): imagination/misinformation implants only plausible
  events; bizarre events are rejected at the belief step even if they
  generate imagery. Plausibility, not vividness, predicts *belief*
  (§7). **[CONSENSUS]**

**Spec consequence (new §6.9 — `imagineEvent` operator):** daydreams,
rehearsed lies, "what-if" retellings, and therapy-style probing all
route through one hook:

```
imagineEvent(charId, scenario, n=1):
  plaus = plausibility(scenario, char)   // schema fit + world knowledge
  if plaus < plaus_min (0.35): write/refresh a record tagged
        source.kind:"imagined", beliefStatus stays "belief" or below —
        it exists as fantasy, never flips to memory   (Pezdek gate)
  else: create/update record: source.kind:"imagined", strength low,
        encodingE ~0.25·plaus, verbatim schema-generated
  each repetition: strength += imagine_gain·(1−strength) (~0.15);
        confidence += 0.05  (fluency — same +0.05 retelling gives)
  source flip: when source.confidenceInSource decays below 0.3
        (§6.4), an imagined record with verbatim richness >
        rm_rich_thresh (0.5 — reality-monitoring needs perceptual
        detail to confuse, Johnson & Raye 1981) may flip
        source.kind → "witnessed" with prob source_confuse_flip
        (≈0.15 per check — matches the ~15% full-implant rate over
        repeated sessions)
```

RW hooks: a character who daydreams confronting their rival, or
rehearses a lie about where they were, is *literally* growing a false
memory. Rumor chains that persist long enough for source decay become
"things that happened."

---

## 6. Source monitoring is inference, not a tag

Johnson, Hashtroudi & Lindsay 1993 (source-monitoring framework):
attributing a memory to a source is a **decision made at retrieval**
from the record's qualitative features — perceptual detail, cognitive
operations, semantic content, affect. Errors are patterned:

- **External-external confusion** (who told me): most common, scales
  with similarity of the two sources' contexts. β_source decay (§6.4)
  already erases attribution — add that when the tag fades below 0.3,
  the model doesn't leave `who:null`; it **fills** the slot with the
  most cue-overlapping plausible source:
  `P(reassign to s) ∝ sim(source_cueContext, s)·sourceCredibility(s)`.
  "Lena told me" becomes "I'm pretty sure Mara told me" — and confidence
  rises because a filled source reads better than a blank one.
- **Internal-external confusion** (reality monitoring, Johnson & Raye
  1981): imagined→perceived flips happen when the internal record has
  high perceptual/sensory richness and low cognitive-operations content.
  Gate on verbatim/sensory richness (§5's `rm_rich_thresh`) — a
  *well-imagined* scene is the dangerous one. **[CONSENSUS mechanism]**
- **Aging:** source memory declines faster than item memory (Spencer &
  Raz 1995, already β_source); older adults' source confusions increase
  via `discrim_mult` — same scaling as §4.2/4.3, since source inference
  reuses the same discrimination machinery.

**Spec consequence (new §6.10):** replace the "attribution gone" dead
end in §6.4 with `sourceInfer(m)` — reassign-or-blank logic above;
`source_confuse` param (~0.1 baseline, ×`discrim_mult` age scaling,
×2 for imagined→witnessed on rich phantoms).

---

## 7. Belief ≠ recollection (nonbelieved memories)

Scoboria et al. (2014), Otgaar, Scoboria & Mazzoni 2014: autobiographical
**belief** ("it happened") and **recollection** ("I relive it") are
distinct latent variables — perceptual/re-experiencing features predict
recollection; **plausibility predicts belief** and barely predicts
recollection. Mazzoni, Scoboria & Harvey 2010: **~20%** of adults hold
at least one vivid *nonbelieved* memory (Piaget's abduction memory —
he knew it never happened); they skew more negative emotionally.
Rubin, Schrauf & Greenberg 2003: belief tracks truth-corroboration,
recollection tracks sensory detail. **[CONSENSUS on dissociation;
relatively young literature]**

**Spec consequence (§6.7):** records carry two derived (not stored)
quantities at retrieval:

```
recollect_q = verbatimStrength·(1 + sensory richness)   // reliving
believe_p   = w_plaus·plausibility + w_corr·corroboration
              + w_fluency·fluency(retrievalCount, hearCount)
            // plausibility is the heavyweight; corroboration = number
            // of distinct sources (or prior selves) endorsing
```

- `beliefStatus` becomes a *discretization* of believe_p:
  `>0.8 fact`, `0.45–0.8 belief`, `0.2–0.45 rumor/doubted`, `<0.2`
  nonbelieved → status `"doubted"` regardless of recollect_q.
- A **nonbelieved memory** = high recollect_q + low believe_p —
  rendered in dialogue as "I can still see it, but it can't have
  happened." Trauma modifier may produce these after correction.
- This also formalizes the rumor asymmetry: fluent, corroborated,
  implausible content can be *believed-without-recollection*
  (believed-not-remembered, e.g. "everyone says the fire was arson") —
  high believe_p, ~zero recollect_q — which is exactly what a
  `told_by` record looks like. The split makes the belief layer real.

---

## 8. Memory conformity — numbers for §6.5

- Gabbert, Memon & Allan 2003: dyads watched different-camera videos of
  the same event; **71%** of discussers later misrecalled items acquired
  from the partner. No age difference (18–30 vs 60–80).
- Wright, Self & Justice 2000: 98% initially accurate on the accomplice
  question → **79%** conformed to a joint answer after discussion.
- Wade et al. 2018 (multilab, N=486, 6 countries): conformity errors
  concentrated where the co-witness's report was **not disputed** during
  collaboration — dispute is the protective act.
- Power asymmetry raises conformity (Carol et al. 2013 — the more
  powerful co-witness sways more).
- Repetition is the vector; source variability adds nothing (§1).

**Spec consequence:** §6.5's "both ways with asymmetric susceptibility"
is right; add: (a) the side whose record is weaker / whose
`misinfo_suscept` is higher adopts more — already implicit in p_adopt;
(b) a `disputed` flag path — if the listener's reconstruction surfaced
a *conflicting* field during the discussion and the dialogue layer
registers disagreement, that field is immune this round; (c) anchor
expected adoption: a co-witness discussion should yield field adoption
in the 50–80% range on *contested weak-held* fields (Gabbert's 71% is
the calibration point — those were uniquely-seen items, i.e. zero
verbatim strength on the contested field; on fields where the listener
holds a surviving verbatim, adoption stays much lower). This bounds the
operator: conformity is near-total only where memory is absent.

---

## 9. Spec changes in v0.6 (summary)

- **Record schema** gains: `phantom: bool`, `retracted: bool`,
  `hearCount: int` (on `told_by` records — repetition counter shared by
  content-hash across speakers), `sleepdep_flag` (baked at encoding).
- **§6.3** rewritten: per-field `fieldStrength` replaces
  `accuracy·0.5`; added `rep_gain`/`rep_cap`, `warn_mult`,
  `dispute_mult`, `sleepdep_misinfo_gain` moderators.
- **New §6.6** corrections & continued influence (`retract_p`,
  `cie_residual`, trust-gated).
- **New §6.7** believe_p / recollect_q derived pair; beliefStatus as
  discretization; nonbelieved memories.
- **New §6.8** phantom/gist-lure record minting (`gist_lure_gain`,
  `phantom_p`, `phantom_fan_min`, `rm_rich_thresh`).
- **New §6.9** `imagineEvent` operator (`plaus_min`, `imagine_gain`,
  `source_confuse_flip`).
- **New §6.10** sourceInfer — source reassignment + reality-monitoring
  flip (`source_confuse`).
- **§4.6/daily tick** gains `sleep_gist_boost` on generic + phantom
  records (Payne 2009).
- **§2** gains `sleepdep_flag` rule (Frenda 2014 — deprivation at
  *encoding* only).
- **§7** +12 params (all optional w/ defaults — backward compatible).
- **§10** contract: `hearAccount` accepts `warned`, `disputed`,
  `correction` fields; new `imagineEvent`; Reconstruction may carry
  `phantom: true` (hidden from dialogue except through hedging — the
  character cannot know).

---

## 10. Parameter guidance

| param | default | meaning |
|---|---|---|
| warn_mult | 0.45 | post-warning suppression of p_adopt (Blank meta) |
| rep_gain / rep_cap | 0.4 / 2.0 | log-fluency multiplier on hearCount |
| dispute_mult | 0.05 | p_adopt floor when account disputed live (Wade 2018) |
| retract_p | 0.6 | correction believability, trust-gated |
| cie_residual | 0.3 | retracted content's residual inference weight |
| sleepdep_misinfo_gain | 1.25 | susceptibility if poor sleep at encoding |
| sleep_gist_boost | 0.05 | sleep tick edge for gist/phantom records |
| gist_lure_gain | 0.3 | phantom detail write-in rate |
| phantom_p | 0.02 | whole-episode phantom cap per recall |
| phantom_fan_min | 4 | convergent associations needed for phantom |
| rm_rich_thresh | 0.5 | verbatim richness enabling imagined→witnessed |
| plaus_min | 0.35 | below → content stays fantasy, never memory |
| imagine_gain | 0.15 | per-imagination strength bump |
| source_confuse_flip | 0.15 | per-decay-check flip rate (~15% implant) |
| source_confuse | 0.10 | external-source reassignment rate |

Per-character: `gist_lure_gain`/`phantom_p` scale with `confab_fill`
(the gist channel — monotonic age rise); `source_confuse` with
`discrim_mult` (aging) and `misinfo_suscept` stays the suggestion
channel. Children: high everything. The **ruminator/depressive**
imagines negative scenarios repeatedly — `imagine_gain` ×1.5 on
negative-valence scenarios only, which is how a feared event becomes a
remembered one. The **gossip** modifier raises `hearCount` accumulation
(rumors reach them from more directions) — repetition, not variety, is
the mechanism, so the modifier should raise *exposure count*, not a
per-source bonus.

---

## 11. Validation probes (extend P1–P38)

- **P39 (warning):** same event+account, `warned:true` vs absent →
  misled-field adoption ratio ≤0.55 across profiles (Blank meta).
- **P40 (interval):** fresh strong record resists a rumor; same rumor at
  t+30d (verbatim decayed) adopts ≥2× more often. Retention-interval
  gradient exists and is monotone.
- **P41 (repetition vs variety):** rumor heard 4× from one speaker vs
  1× each from 4 speakers → adoption statistically equal (source
  variability is null); both > 1× single.
- **P42 (dispute):** listener flagged `disputed` on a field adopts it
  <10% as often as undisputed, same content.
- **P43 (CIE):** corrected rumor flips beliefStatus to doubted ~60% of
  trusted-source cases but its gist still feeds ≥1 semantic-trait
  abstraction over the next 60 days (residual influence measurable).
- **P44 (phantom):** schema-consistent lure detail appears in
  reconstructions at rates tracking `(1−verbatimStrength)·confab_fill`;
  older-adult profile phantomizes > young-adult at matched encoding.
- **P45 (imagination):** 5 imagineEvent calls on a plausible scenario →
  measurable subset (~10–30% across jittered profiles) flip to
  "witnessed" after source decay; implausible scenario (plaus<plaus_min)
  never flips regardless of repetitions.
- **P46 (nonbelieved):** seed a vivid phantom, then strong correction →
  some characters produce high-recollect_q / low-believe_p records
  (status "doubted", sensory detail intact).
- **P47 (sleep-deprivation timing):** poor sleep on encodeDay raises
  later misinfo adoption; poor sleep on intervening days does not.
- Emergent checks: rumor chains reaching `hearCount ≥ 8` saturate (log
  cap — no runaway); a co-witness pair discussing a weakly-held
  contested field converges at 50–80% (Gabbert anchor); strong witnessed
  fields still beat single rumors (v0 sanity check preserved).

---

## 12. Honest limits

- The 2025 misinformation meta's I²=92% is a warning: the "effect" is a
  family of effects. We model the consensus moderators; the residual
  heterogeneity lands in per-character jitter.
- Implantation base rates are contested (Brewin & Andrews 15% full vs
  Otgaar et al. 15–46% by criteria). We pick conservative whole-episode
  rates (`phantom_p` small, `source_confuse_flip` 0.15) — RW needs
  *occasional* invented pasts, not rampant ones.
- DRM word-list false memory → whole-event false memory is a leap;
  the mechanism (gist activation + verbatim absence) is consensus, the
  ecological base rate is not. `gist_lure_gain` is our most speculative
  knob — flag to game-systems as tunable.
- Fluency/truth effects (g≈0.37) are small; we use repetition as a
  *misinfo* moderator, not a standalone truth pump.
- Sleep-false-memory findings conflict (Payne 2009 vs 2025
  preregistered null); `sleep_gist_boost` is small and marked
  [HYPOTHESIS-grade] accordingly.
