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

---
---

# PART II (v18) — the machinery underneath: candidates, claims,
# coercion, and the lies characters tell themselves

**Scope:** Part I calibrated *whether* outside content gets adopted.
Part II fixes what v0.6 got wrong at the storage layer — adoption was
an **overwrite**, which the mechanism literature does not support —
and adds the self-authored false-memory channels Part I lacked:
lies that become beliefs, forced answers that become memories,
evidence that defeats the plausibility gate, ideas reclaimed as
original (cryptomnesia), reconstructions pulled toward the present
self, and blind ownership of substituted outcomes. Closes with the
one thing the model refuses to implement: repression.

## 13. Overwriting is wrong — candidate competition

The v0.6 §6.3 operator does `overwrite field` on adoption. The
mechanism literature says the original almost never dies:

- **McCloskey & Zaragoza (1985)** modified test: misled subjects
  pick the misinformation on a misinformation-vs-novel test but the
  **original detail remains accessible** on a test that excludes the
  misinformation — impairment is a *retrieval/monitoring* failure,
  not storage destruction. **[CONSENSUS direction]**
- **Lindsay & Johnson (1989)**: when the test forces source
  discrimination ("which did you see, which were you told"), the
  misinformation effect largely disappears — both contents coexist
  and compete for attribution. **[CONSENSUS]**
- **Tousignant, Hall & Loftus (1986)**: discrepant-detail handling
  shows subjects often *recall both* versions across tests —
  fluctuation between original and suggested detail within one
  witness. Also the empirical basis for reports *reverting* toward
  the original across long delays.
- Meta framing (Patihis et al. 2025): "overwriting vs monitoring vs
  demand" remains the **DEBATED mechanism** — but storage coexistence
  is the safest functional commitment; overwrite is the one variant
  the evidence clearly fails.

**Spec consequence (§6.3 rewrite):** verbatim fields stop being
scalar values. Each becomes a **candidate set**:

```
field.candidates = [{value, candStrength, provenance, day}]
  provenance ∈ {witnessed, told_by:<id>, imagined, confabulated,
                claimed, inferred}
adoption (was: overwrite) now WRITES a competing candidate:
  candStrength = cand_base_str (0.7) · sourceCredibility
                 · (1 + rep_gain·log1p(hearCount))
  the original candidate keeps its own decayed strength — untouched
retrieval of that field samples ∝ candStrength — the fluent rumor
  outcompetes the faded original most of the time, NOT always:
  originals resurface when the misinfo candidate decays faster
  (it usually does — told_by decay vs witnessed decay), producing
  the observed within-witness fluctuation and delay reversion
[CONSENSUS on coexistence; HYPOTHESIS on exact sampling rule]
accuracy bookkeeping: record.accuracy still hides the field's true
  state; provenance feeds §6.7 believe_p's corroboration term and
  §6.10 sourceInfer
```

This also fixes a Part I gap: P40's "original resists" prediction is
now literally true at storage level, and §5.13 output interference /
§5.8 part-list suppression apply to *losing* candidates — rehearsing
the adopted version suppresses the surviving original (the RIF-of-
misinformation effect, Shaw, Bjork & Handal 1995; MacLeod 2002 —
selective retrieval of misinformation is what entrenches it). No new
param for that; `out_int`/`plist_suppress` already exist.

## 14. Lies believed — fabrication inflation

A character who *invents* content is not exempt from adopting it —
self-fabrication is a stronger false-memory channel than hearsay:

- **Polage 2004** ("fabrication deflation"): most liars' truth-
  ratings strengthen after lying, but **10–16% of participants hit
  maximum belief that the lie was true** — a real inflation tail.
- **Polage 2012**: inflation scales with **source-monitoring
  ability** — the same trait axis (wmc/discrim_mult) that already
  gates §6.10 confusion. Lies rehearsed in a separate session inflate
  more — temporal source decay is the mechanism.
- **Pickel 2004**: fabricated suspect descriptions interfered with
  memory for the real suspect; fabricated details later confused
  with truth.
- **Chrobak & Zaragoza 2008**: participants forced to invent entire
  fictitious events later showed false memories of them — ~half.
- Telling beats planning (Otgaar lab / European J. 2018 "effect of
  telling lies on belief"): the *act of asserting* is what inflates
  — which maps to §2's generation+production gains, not a new magic.

**[CONSENSUS that self-fabrication inflates; tail size DEBATED]**

**Spec consequence (§6.9 extension):** `imagineEvent` gains
`claim:true` — a *deliberately false assertion* (a lie, a rehearsed
cover story, a brag). It differs from daydream `imagined` records in
exactly the ways the literature says it should:

```
claim record: source.kind:"claimed", written with BOTH gen_gain and
  prod_gain (it is generated AND spoken — §1.2 mechanics; stronger
  than a silent daydream), verbatim schema-consistent, confab_count++
  per repetition
flip path: same §6.9 source-decay gate, but flip prob =
  source_confuse_flip · (1 + fab_inflate) scaled by discrim_mult
  (Polage 2012: monitoring ability IS the moderator)
believe_p contribution: corroboration counts LISTENERS who echoed
  the claim back — the liar's friends repeating his story raise his
  own believe_p (social feedback loop; HYPOTHESIS but cheap)
```

RW hook: the character who claims a glamorous past at the bar every
week is running `imagineEvent(claim:true)` on a loop — the engine
produces "came to believe his own legend" for free.

## 15. Coerced production — forced confabulation and pressure

- **Ackil & Zaragoza 1998**: participants *forced* to answer
  questions about events that never happened in the film produced
  knowingly-fabricated answers — and **one week later held false
  memories for those details**; first-graders > older children >
  college students in susceptibility (developmental gradient on the
  SAME internal-confusion channel as §6.10's child_internal_confuse).
  **[CONSENSUS]**
- **Pezdek, Sperry & Owens 2007**: forced confabulations persist
  more when the answer was **other-generated** (suggested by the
  questioner) than self-generated — suggestive questions beat
  free confabulation at planting durable error.
- **Chrobak & Zaragoza 2008**: ~50% false-memory rate for wholly
  invented events under forced description.
- **Gudjonsson memory-distrust line** (Gudjonsson & MacKeith 1982;
  van Bergen et al. 2009): low trust in one's own memory →
  compliance → **internalized** false acceptance (the confession
  path, Kassin 2008 taxonomy: voluntary / coerced-compliant /
  coerced-internalized — only the last is a memory phenomenon).
  Our `distrust` trait (v0.7) is the susceptibility knob.

**Spec consequence (§6.9 second extension + §10):**
`answerProbe(charId, question)` — interrogative contexts where the
record holds no field for the asked detail:

```
if forced:true (question demands an answer — interrogation, gossip
    pressure, a child being pressed):
    emit a confabulated candidate: provenance:"confabulated",
    candStrength = forced_confab_gain (0.2)
                 · (suggested answer ? other_gen_gain 1.5 : 1)
                 · (1 + press_gain·repeatCount)   // pressure compounds
    repeated probing of the SAME gap compounds (repeatCount on the
    field) — each pass strengthens the planted candidate;
    children: × child_internal_confuse (2.0, already in §6.10)
compliance vs internalization: forced answers under disputed:true
    or a hostile audience write the candidate but tag it
    coerced:true — performed, not believed; internalization requires
    the §6.9 flip gate like any imagined content, but distrust-trait
    characters reach it faster (memory-distrust: the character who
    doubts his own memory adopts the interrogator's version —
    Gudjonsson path; INTERNALIZATION only, compliance is behavioral)
```

## 16. Evidence defeats plausibility — photos and artifacts

- **Wade, Garry, Read & Lindsay 2002**: a **doctored childhood
  photograph** + guided imagery produced full/partial false memories
  in **50%** of subjects across three interviews — the strongest
  single-session-adjacent implantation result; photographs carry
  presumed veridicality that narratives lack.
- **Strange, Gerrie & Garry** (2005–2008 line): doctored *video* of
  someone else performing an action produced false memories of the
  *self* performing it; simply viewing another's action inflates
  false self-performance claims (action observation → imagination
  inflation without imagining).
- **Murphy et al. 2019**: fabricated news stories → ~half of
  participants formed at least one false memory for the fake event;
  Greene et al. 2021 replicate. Media-rich fake content ≈ narrative
  + presumed-veridical evidence.

**[CONSENSUS that perceptual evidence amplifies planting; the photo
literature is small-N but consistent with the fluency account]**

**Spec consequence (§6.9 + hearAccount):** accounts and imagineEvent
calls may carry `evidence:"photo"|"video"|"artifact"`:

```
plaus_eff = plaus + evid_boost·(1 − plaus)      // evid_boost 0.4 —
          evidence bends the gate but does not delete it; a
          truly impossible event stays fantasy (Pezdek gate holds)
records written under evidence are born with verbatim richness ≥
  rm_rich_thresh automatically — photos supply exactly the
  perceptual detail the reality-monitoring flip gate demands
  (this is WHY photos are dangerous: they pre-satisfy §6.9's gate)
evidence also skips straight to confidence += 0.1 (fluency of a
  seen image, not a narrated one)
```

RW hook: the doctored-photo mechanic is the *canonical* player-
facing false-memory tool — show a character a photo of themselves
at an event they never attended, wait out the source decay.

## 17. Cryptomnesia — the reverse source flip

§6.10 flips imagined→witnessed. The opposite sign also exists:
**externally-heard content surfaces as self-generated**:

- **Brown & Murphy 1989** (cryptomnesia, three experiments):
  plagiarism of others' generated responses ~**10%** across tasks
  despite explicit warnings; highest for the response produced by
  the person *immediately before* the subject (proximity); rises
  over a week's delay (Stark & Perfect elaboration work — generative
  rehearsal of others' ideas *increases* later misattribution as own).
- Mechanism is consensus source-monitoring: fluent content +
  decayed source = "my idea." This is the engine of "everyone in
  the neighborhood suddenly tells the same joke."

**Spec consequence (§6.10 second direction):** when emitting
self-generated content (retell as own idea, propose a plan, tell a
story), if a `told_by` record with matching content-hash exists and
its `source.confidenceInSource < 0.3`, the record is emitted as
own with prob `crypto_p` (0.08) — proxied internally by *not* running
sourceInfer's external reassignment and instead clearing the source
entirely to `self`. Rate scaled by `discrim_mult` (older adults
cryptomnesize more — source-memory decline) and boosted ×1.3 when
the true source spoke *recently* (Brown & Murphy proximity) — a
rare case where recent beats remote.

## 18. Reconstruction pulled toward the present self

- **Ross 1989** (implicit theories): people reconstruct past
  attitudes/behaviors from *present* attitudes under an assumed-
  stability theory — the past is conformed to the now. Consensus
  demonstration; mechanism = schema-driven reconstruction with the
  current self as schema.
- **Henkel & Mather 2007**: choice-supportive memory is *belief-
  driven*, not choice-driven — participants who misremembered which
  option they chose attributed positive features to the **believed**
  choice, not the actual one; misinforming someone about which
  option they picked produced full choice-supportive memory for the
  false choice. Feature attributions favoring believed choices are
  also *more vividly* remembered.
- **Mather & Johnson 2000**: choice-supportive source monitoring is
  *stronger in older adults* (they attribute more positive features
  to chosen options) — the bias compounds with age; fits the
  positivity/self-protective direction of §1.6.

**[CONSENSUS]**

**Spec consequence (new §6.17 — consistency pull):** reconstruction
of records with attitudinal/preference/decision fields gains a
*directional* pull — not toward the schema (§6.2) but toward the
**current self-model**:

```
on reconstruct of m with evaluative/decision fields:
  field drift toward current attitude A:
    candidate write: value pulled consist_pull (0.15) toward A per
    reconstruction — cumulative, so a changed mind rewrites history
    ("I always knew he was no good")
  if field is choice-related and `believedChoice` differs from the
    stored one: positive-feature candidates on the believed option
    gain choice_support_gain (0.15) candStrength AND emit at higher
    vividness (Henkel & Mather: favored features more vivid);
    age knots: ×1.0 ≤50 → ×1.4 at 80 (Mather & Johnson 2000)
```

Distinct from hindsight (§6.16): hindsight assimilates *predictions
toward known outcomes*; consistency pull assimilates *the past
toward the present attitude* — even with no outcome learned.

## 19. Owning substituted outcomes — choice blindness

- **Johansson, Hall, Sikström & Olsson 2005** (Science): double-card
  swap of a face-choice outcome — **<10% of manipulations detected
  immediately; ~20–25% total detection**; undetected swaps produced
  full confabulated justifications for choices never made, at equal
  confidence/detail/emotionality as real ones.
- **Hall et al. 2010/2013**: moral-opinion swaps shift subsequent
  attitudes — the confabulated position *moves the self*, not just
  the report.

**[CONSENSUS phenomenon; rate varies with domain/salience]**

**Spec consequence (new §6.18 — `swapOutcome` / seam ownership):**
when a record's *outcome* field is replaced by an outside act —
possession handoff, admin intervention, another character acting on
the character's behalf and attributing it to them:

```
P(detect) = cb_detect (0.3) · (1 + selfRelevance)
          · (fresh ? 1 : 0.5)        // detection decays with delay —
                                     // the seam is noticed NOW or
                                     // rationalized forever
if undetected: the swapped outcome is owned — the record keeps
  provenance self/witnessed, and §6.17 consistency pull + §6.2
  confabulation generate reasons for it at next reconstruction
  (confabulated motive candidates, provenance:"inferred")
if detected: tags the record incongruent:true (self-model flags a
  seam; dialogue can render "I don't know why I did that" —
  distinct from possession estrangement, which is wholesale
  possess_alien discount on the whole record)
```

This is the *fictional justification* layer for the possession
economy: a possessed character resuming control does not notice the
seam most of the time — they confabulate continuity, exactly as a
Truman must. cb_detect is deliberately bounded low: in Johansson
et al. the manipulated outcome was *whole-option reversal* and still
went unseen ~75%+ of trials.

## 20. Valence splits two ways — content vs mood

Part I's valence terms (neg_fidelity/pos_gist_drift, §6.1/§6.2) are
about *experienced* events. The false-memory literature forces a
sharper split (Bookbinder & Brainerd 2016 Psych. Bull. meta — the
**context–content paradox**):

- **Negative CONTENT** (the event/rumor is about something bad)
  *foments* false memory — negative materials raise both true recall
  and false recall via strengthened gist (Bookbinder & Brainerd
  2017 Emotion: negative pictures enhanced gist memory, impaired
  verbatim — persists a week).
- **Negative MOOD at encoding** (the *context*) *protects* —
  negative mood promotes verbatim/item-specific processing (for the
  mood side see also Clore/Storbeck line; aging caveat stands).
- **Enduring negative mood** (depression) *foments* false memory —
  the trait-level flip: depressive-style processing is gist-dominant.

**[CONSENSUS on the dissociation; sizes modest]**

**Spec consequence:** two clauses, no contradiction with §6.1's
neg_fidelity (which governs *verbatim drift of experienced core
detail* — a different channel):

```
§6.3 p_adopt and §6.8 P(phantomize) gain a content-valence term:
  · (1 + neg_gist_gain) when account/record valence < −0.3
  // neg_gist_gain 0.1–0.2: negative rumors stick better, negative
  // schemas phantomize more — because gist is the carrier
§2 encoding: cueContext.mood < −0.3 → small verbatim write bonus
  (negmood_verbatim_gain 0.1) — sad-mood witnesses keep BETTER
  surface detail (the protective half of the paradox)
depressive modifier: already gist-dominant (rumin_k); the trait
  level lands in confab_fill/gist_lure_gain deltas — no new trait
  param needed (P170 sign-locks all three)
```

## 21. Warning timing and inoculation

Part I has post-warning (`warn_mult` 0.45, halves the effect).
Warnings differ by timing:

- **Prewarning** (before exposure): works too but is *weaker* —
  the listener is on guard but doesn't yet know what to guard
  (Greene, Flynn & Loftus 1982; the 2025 meta's warning moderation
  covers both timings). `prewarn_mult ≈ 0.7`.
- **Inoculation** (Banas & Rains 2010 meta, 54 cases): preemptive
  refutational exposure confers resistance — and refutational-
  *different* ≈ refutational-*same* preemption, i.e. the protection
  **generalizes beyond the exact warned content**; threat/
  involvement moderators NULL; resistance **decays after ~2 weeks**.
- **Blank-line caveat for the model:** general inoculation ≠
  blanket immunity — it's a decaying multiplier on p_adopt, not a
  gate.

**Spec consequence (§6.3 + per-character state):** `hearAccount`
accepts `prewarned:true`; the character store carries
`inoc_until` (a day) set by generalized-skepticism events
(prebunking — being burned by a rumor before):

```
p_adopt ·= prewarn_mult (0.7) if prewarned
        ·= inoc_mult (0.75) if worldDay < inoc_until
inoc_until = burnDay + inoc_half-life ~7d effective (set to
  burnDay + 14; Banas & Rains decay boundary)
```

## 22. What the model refuses to implement — repression

The recovered-memory debate (Loftus 1993; Patihis, Ho, Tingen,
Lilienfeld & Loftus 2014 — belief in repressed memory remains
widespread among clinicians and the public despite the evidence;
Brewin & Andrews reviews; Otgaar et al. work showing *some*
recoveries are corroborated): the scientific consensus position
the model adopts is that **massive motivated repression with intact
recovery is not an evidence-supported mechanism**. Apparent
recoveries are produced by ordinary mechanisms — ordinary
forgetting + reminder reinstatement (§4.14 latent route),
source-confused imagined content (§6.9), phantom minting (§6.8).

**Spec consequence (§6.20):** NO repress() operator, ever. Deliberate
avoidance is §4.12's bounded suppressEvent (θ-side, leaky, capped);
"recovered memory" phenomena are emergent outputs of latent + flip +
phantom machinery, observable via P172 but never implemented as a
mechanism. This is both the honest scientific position and the
design-safest one — a character's past can be lost, confused, or
invented, but it cannot be *defended against and then unleashed*.

## 23. Spec changes in v1.8 (summary)

- **Record schema:** verbatim fields become candidate sets
  `{value, candidates:[{value,candStrength,provenance,day}]}`;
  `provenance` enum extended: witnessed/told_by/imagined/confabulated/
  claimed/inferred. New hidden fields: `confab_count`,
  `coerced:true`, `cb_swapped`, `inoc_until` (per-character).
- **§6.3** rewritten: adoption writes competing candidates
  (cand_base_str, provenance) instead of overwriting; losing
  candidates eat §5.13 out_int / §5.8 plist suppression (Shaw,
  Bjork & Handal 1995 — misinformation entrenches by retrieval);
  gains `neg_gist_gain` content term, `prewarn_mult`, `inoc_mult`
  clauses.
- **§6.9** extended: `claim:true` (lies — gen+prod gains,
  fab_inflate-scaled flip, listener-echo corroboration);
  `answerProbe`/forced confabulation (forced_confab_gain,
  other_gen_gain, press_gain, coerced tag, distrust-gated
  internalization); `evidence:` field (evid_boost plausibility
  lift, auto rm_rich satisfaction, confidence bump).
- **§6.10** extended: reverse direction — `crypto_p` cryptomnesia
  flip (heard→self), proximity-boosted, discrim_mult-scaled.
- **New §6.17** consistency pull: `consist_pull` toward current
  attitudes; `choice_support_gain` believed-choice feature bias,
  age-scaled.
- **New §6.18** `swapOutcome`/choice blindness: `cb_detect`,
  incongruent tag on detection, confabulated-ownership otherwise;
  fictional-continuity hook for possession seams.
- **New §6.19** folded into §6.3 (prewarn/inoculation clauses) —
  kept as documented additions, not a separate section.
- **New §6.20** repression non-mechanism — documented refusal.
- **§2** gains `negmood_verbatim_gain` (negative mood at encoding
  protects surface detail — Bookbinder & Brainerd context half).
- **§7** +13 params (all optional w/ defaults); knot updates:
  choice_support_gain ×1.0→×1.4 at 80; crypto_p rides discrim_mult.
- **§10** contract: `hearAccount` +`prewarned`/`evidence`;
  `imagineEvent` +`claim`/`evidence`; new `answerProbe`,
  `swapOutcome`; candidate-set note for Reconstruction fields.

## 24. Parameter guidance and probes

| param | default | meaning |
|---|---|---|
| cand_base_str | 0.7 | misinfo candidate birth strength (§6.3) |
| fab_inflate | 0.5 | claim→belief flip multiplier (§6.9; Polage tail) |
| forced_confab_gain | 0.2 | per-forced-answer candidate strength (§6.9) |
| other_gen_gain | 1.5 | suggested > self-generated confabulation (§6.9) |
| press_gain | 0.3 | per-repeat interrogative pressure compounding |
| evid_boost | 0.4 | perceptual-evidence plausibility lift (§6.9) |
| crypto_p | 0.08 | cryptomnesia flip rate (§6.10) |
| consist_pull | 0.15 | reconstruction pull toward current self (§6.17) |
| choice_support_gain | 0.15 | believed-choice feature bias (§6.17) |
| cb_detect | 0.3 | outcome-swap detection rate (§6.18) |
| neg_gist_gain | 0.15 | negative-CONTENT false-memory boost (§6.3/§6.8) |
| negmood_verbatim_gain | 0.1 | negative-MOOD verbatim protection (§2) |
| prewarn_mult / inoc_mult / inoc_days | 0.7 / 0.75 / 14 | warning timing + generalized inoculation (§6.3) |

**Probes P163–P172** (extends registry P1–P162):

- **P163 coexistence (MUST — sign-locked):** after adoption, a
  source-discrimination probe still recovers the original field
  value at ≥ modified-test rates, and the original can resurface at
  long delays when the misinfo candidate decays (Tousignant
  fluctuation). FAIL if adoption ever deletes the original
  candidate.
- **P164 fabrication inflation (SHOULD):** `claim:true` loops inflate
  believe_p more than matched silent `imagineEvent` loops; flip tail
  lands in the 10–16% band across jittered profiles (Polage);
  low-discrim_mult profiles inflate more (sign-lock).
- **P165 forced confabulation (MUST):** forced answers to
  unanswerable questions surface as recalled content at ~7d;
  child profile > adult (Ackil & Zaragoza gradient); suggested
  answers persist > self-generated (Pezdek, Sperry & Owens);
  voluntary silence produces none.
- **P166 evidence boost (SHOULD):** photo-evidence false scenario
  adopts at materially higher rate than matched-plausibility
  narrative; evidence records reach the §6.9 flip gate sooner
  (pre-satisfied richness); plaus_min-impossible content STILL
  never flips even with evidence.
- **P167 cryptomnesia (SHOULD):** decayed-source told_by content is
  emitted as self-generated at ~5–15%; recent-source content
  cryptomnesizes MORE than remote (Brown & Murphy proximity —
  sign-flip vs ordinary recency).
- **P168 choice-supportive (SHOULD):** believed-chosen options
  attract positive-feature candidates regardless of true choice;
  believed-rejected attract negative; old profile shows larger
  asymmetry (Mather & Johnson 2000).
- **P169 choice blindness (SHOULD):** swapped outcomes go undetected
  ~60–80% and generate inferred-motive candidates at next
  reconstruction; detected swaps tag incongruent and do NOT
  confabulate ownership.
- **P170 content–mood paradox (MUST — sign-locked):** negative-
  content rumors phantomize MORE; negative encode-mood records
  phantomize NO more (and keep better verbatim); depressive-trait
  cohort produces more phantoms at matched events — three
  dissociable channels (Bookbinder & Brainerd 2016).
- **P171 warning timing (SHOULD):** prewarned adoption < unwarned
  but > postwarned; inoc_mult protection present day 1, gone by
  ~day 21 (Banas & Rains decay boundary).
- **P172 repression-null (OBSERVE):** no path exists that removes a
  high-S record from recoverable space; "recovered" reports emerge
  only via latent/phantom/source-flip machinery. OBSERVE-tier: a
  report, not a gate.

## 25. Honest limits (Part II)

- **Candidate competition** is the consensus-safe commitment
  (coexistence), but the *sampling rule* is ours — the literature
  doesn't deliver a strength-weighted mixture model; flag to
  game-systems as tunable alongside gist_lure_gain.
- Fabrication-inflation tail size is genuinely uncertain (Polage
  10–16% vs deflation majority): we implement the tail, not the
  majority outcome — RW needs liars who *sometimes* self-convince,
  which is both the interesting and the supported behavior.
- Choice-blindness rates are domain-sensitive (faces 75–90% blind;
  moral attitudes lower detection still); cb_detect 0.3 is
  conservative for high-selfRelevance seams. A possessed character
  noticing EVERY seam would be worse fiction than none.
- The evidence (photo) literature is small-N; evid_boost is a
  modeling commitment to "perceptual fluency ≈ verified past," not
  a measured constant.
- Cryptomnesia rates come from word/idea-list paradigms; the
  ecological rate for *stories* is unknown — crypto_p is OBSERVE.
- The valence paradox is the cleanest part: three dissociable
  channels with sign-locked probes; if P170 fails, suspect a
  channel mix-up before touching magnitudes.
