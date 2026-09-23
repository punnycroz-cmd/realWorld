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

---
---

# PART III (v30) — the passive channels: distortion nobody commits

**Scope:** Parts I–II covered what *accounts and interrogators* do to a
record. Part III covers the channels where the distortion is generated
by the rememberer's own ordinary acts — describing, recognizing,
confusing similar episodes, glancing at a photo — plus three
refinements that sharpen the calibration: the reactivation window,
the phantom-recollection/familiarity split, and the
central-peripheral gradient with real numbers.

## 26. Verbal overshadowing — describing it corrupts it

- **Schooler & Engstler-Schooler 1990** (Cognitive Psychology):
  witnesses who wrote a face description were **25% worse** at later
  lineup identification than controls who listed capitals. Registered
  Replication Report (Alogna et al. 2014, 31+22 labs): the effect is
  robust but timing-conditional — **−4%** correct-ID when description
  immediately followed the event, **−16%** when description was
  delayed 20 min and sat just before the test. Overshadowing is
  *proximal*: the verbal description is freshest at test and
  outcompetes the perceptual trace.
- **Meissner & Brigham 2001 meta** (29 effects, N=2018): Zr = −0.12 —
  small, real, worst under *elaborative* description instructions.
  Verbalization does not merely fail to help; the generated
  description **becomes a competing representation** — witnesses
  identify the face they *described*, not the face they saw (the
  description captures whatever confabulated features the teller
  added, §6.2 machinery).
- Mechanism consensus (recoding/interference account, Schooler 2002;
  transfer-inappropriate processing): verbal description forces a
  low-precision verbal code over a high-precision perceptual one; at
  test the verbal code wins the retrieval competition. Applies to
  hard-to-verbalize content: faces, colors, spatial layout, taste —
  NOT to already-verbal content (names, numbers, plots), where
  retell normally *helps* (testing effect stays, §4.11).

**[CONSENSUS effect, modest; RRR timing gradient solid]**

**Spec consequence (new §6.25):** `retell` (§6.11) gains a
`verbalize:true` mode for records dominated by nonverbal fields —
describing a face, a room, a scene to someone:

```
on retell(verbalize) of record m where nonverbal field mass > 0.5:
    write a candidate into each verbalized field:
        value = the emitted description (with normal §6.2 fills),
        provenance:"claimed", candStrength = vo_cand (0.5)
    the description candidate is CONTENT-FREE of the visual original —
        it wins later retrievals by recency (it is fresh), producing
        the RRR timing gradient for free: identification minutes
        after describing is hardest-hit (vo decay is verbatim-rate)
    nonverbal fields' verbatim decay ×= (1 + vo_loss)   // ~0.15,
        one shot per verbalize, not per word
    verbalizable fields unaffected — retell boost applies normally
identification calls (§5.10 cascade) reading a recently-verbalized
    person record sample from candidates ∝ candStrength — the
    described-face candidate often wins (the witness "recognizes"
    their own words)
```

RW hook: a character who gives a detailed description of a stranger
to a friend measurably *degrades* her ability to pick him out next
week — and the degradation is in the description's direction.

## 27. Unconscious transference — the familiar face migrates

- **Loftus 1976** ("Unconscious transference"): a bystander seen in
  an innocent context is later misidentified as the perpetrator.
  **Ross, Ceci, Dunning & Toglia 1994** (J. Applied Psych.):
  transference-condition witnesses were **nearly 3×** more likely to
  misidentify the innocent bystander than controls; most
  misidentifiers had *inferred* the bystander and culprit were the
  same person; telling them explicitly they were different people
  eliminated the effect.
- Real-world stakes: mistaken eyewitness ID contributed to ~69–75%
  of US DNA exonerations (Innocence Project; Gross & Shaffer
  registry analysis 76% of 873).
- **DEBATED boundary:** Read et al. 1990 five field studies found UT
  only under narrow bystander-perpetrator similarity conditions —
  the *familiarity* account is contested; some misIDs are inference,
  not familiarity confusion (Ross's "conscious inference" subjects).
  Both paths are modeled below.
- **Own-group amplifier (ORB):** Meissner & Brigham 2001 meta
  (39 articles, ~5000 participants): own-race faces 1.40× more
  hits, 1.56× fewer false alarms than other-race; effect grows
  with retention interval; robust in the 2022 three-level
  re-meta (159 articles). Generalizes beyond race: any
  identity-category the perceiver differentiates poorly (age band,
  subculture, uniform) compresses within-category discrimination.

**[CONSENSUS on ORB magnitudes; UT itself CONSENSUS-as-phenomenon,
DEBATED-as-mechanism]**

**Spec consequence (new §6.26):** person-fields of records get a
*transplant* path — a high-familiarity person drifts into a role
they never held:

```
on reconstruct of m, for each person-slot whose verbatim candidate
    died (no surviving witnessed candidate):
    candidates P over known persons, weight ∝
        PersonModel[p].familiarity · simOp(cueContext_of_slot,
        contexts where p was actually seen, "sim_person")
        · (p shares categoryTags with slot's stereotype ?
           (ingroup(p) ? 1 : 1 + orb_gain) : cat_resist)
    P(transplant) = transplant_gain (0.1) · top weight
                    · (1 + react... no: · discrim_mult)   // older
                    // adults transplant more (source decay)
    transplanted person gets provenance:"inferred" candidate —
    emits as confident "he was there"; §6.20 corroboration can
    push it to fact
explicit-inoculation path: if told "the regular wasn't there",
    the inferred candidate takes warn_mult — the ONLY transplant
    defense, matching Ross et al.'s elimination result
```

`orb_gain` ≈ 0.5 on outgroup-vs-perceiver category tags; ingroup is
the reference. The character who "definitely saw the new barista at
the scene" because the barista is the only unfamiliar-category face
they know — that's transference, not lying.

## 28. Memory conjunction errors — two true episodes, one false detail

- **Reinitz, Lammers & Cochran 1992** (M&C): subjects false-alarm to
  *conjunction* stimuli (features recombined across two studied
  items) far more than to *feature* lures — stored features retain
  independence and recombine. Robust across words, pseudowords,
  faces, sentences.
- **Odegard & Lampinen 2004** (Memory, two diary studies):
  conjunction errors occur for **autobiographical events** — and
  participants gave "remember" judgments to a large share. This is
  the ecological version: two real days at the café recombine into
  one that never happened, *with* recollective feel.
- Proximity/attention switching: simultaneous or alternating
  attention to two items drives miscombination (Reinitz & Hannigan
  2001); older adults produce MORE conjunction errors with preserved
  "remember" phenomenology (Reinitz et al. 1994; Burt et al. 2004).

**[CONSENSUS]**

**Spec consequence (new §6.27):** cross-record candidate migration —
distinct from §4.3 genericization (records merge and die) and §6.2
confab fill (schema supplies the value). Here a *specific detail
from a real sibling record* is transplanted while both records
survive:

```
daily, for record pairs (a,b) with simOp(a,b,"sim_interf") >
    conj_thresh (0.65) — near-miss episodes (same place, same
    people, different day):
for each field populated in a but empty/decayed in b:
    P(migrate) = conj_migrate_p (0.05) · discrim_mult
                 · (encoded same week ? 1.5 : 1)   // proximity
    if migrate: b gains candidate {value: a's value,
        candStrength: 0.5·a's candStrength,
        provenance:"inferred", day: worldDay}
accuracy bookkeeping: migrated candidates are TRUE facts in the
    WRONG episode — hidden accuracy penalizes b, not the fact;
    both records persist (P288 checks coexistence)
```

The signature: "the broken glass was Tuesday" — the glass is real,
Tuesday is real, the pairing is false. Distinctive and common.

## 29. Boundary extension — remembering past the edges

- **Intraub & Richardson 1989** (JEP:LMC): 95% of participants'
  drawings of remembered photographs included content that would
  plausibly have existed *just outside* the frame; at recognition,
  extended-boundary distractors were mistaken for the originals —
  scenes are remembered "wider" than seen.
- All ages susceptible (Seamon et al. 2002: children, young and
  older adults all show BE); preschoolers show *larger* BE at coarse
  zoom levels (Intraub 2012 multisource model, developmental study);
  older adults show equal or greater BE — it is a *preserved*
  distortion, one of the few errors aging does not reduce.
- Mechanism (multisource model, Intraub & Dickinson 2008): scene
  representation bundles bottom-up input with top-down spatial
  extrapolation; at test the extrapolated surround is
  source-misattributed to vision — an internal-external source
  error (same family as §6.10), committed at *encoding*, not just
  retrieval.

**[CONSENSUS]**

**Spec consequence (new §6.28):** spatial/extent fields get a
*directional* bias, not noise — the only distortion operator that
systematically overshoots in one direction:

```
on encode: scene records' spatial/extent verbatim fields are born
    already extended: stored extent = actual · (1 + be_gain),
    be_gain ~0.12 (the surround was never seen but is stored as if
    seen — BE is measurable within seconds)
on reconstruct: no further pull — the extension was encoded
recognition-style probes (does a depicted view match?): penalize
    match score by |Δextent| as usual — extended originals reject
    veridical copies as "closer than I remember" (the Intraub
    asymmetry: same picture looks MORE zoomed at test)
age: knots ×1.0 child ≈ ×1.0 adult → ×1.2 at 75 (preserved-to-
    amplified; one of the few non-declining biases)
```

RW use: crowd sizes, room sizes, distances, "the whole street was
watching" — every scene memory is a bit bigger than the scene.
Cheap, always-on, invisible to the character.

## 30. Denial backfire — "that is not true" plants "that"

- **Skurnik, Yoon, Park & Schwarz 2005** (J. Consumer Research):
  identifying a claim as *false* works short-term, but after a
  **3-day delay** older adults misremembered denied claims as true —
  and MORE repetition made it worse: **28%** false-as-true when the
  denial was heard once, **40%** when heard three times. The denial
  frame decays; the claim's familiarity does not. Younger adults
  show the effect weaker and need the delay too.
- The mechanism is source-memory loss plus the fluency→truth
  inference (Jacoby 1999; familiarity without context reads as
  truth) — i.e., it is §6.4 source decay applied to the *truth
  frame itself*.
- Parallel: negation processing — "the suspect did not wear red"
  encodes the affirmed core ("red") plus a fragile negation tag
  (Mayo, Schul & Burnstein 2004; Kaup); negative suggestions can be
  as misleading as positive ones (Eakin et al. line; Lewandowsky et
  al. 2010 note denials feed CIE too).

**[CONSENSUS direction; magnitude single-cohort — replicate-flagged]**

**Spec consequence (new §6.29):** `hearAccount` gains
`negated:true` — denials, retractions-in-passing, "no honestly it
wasn't him":

```
a negated account writes the AFFIRMED content as a candidate:
    candStrength = neg_cand (0.35) · sourceCredibility
                   · (1 + rep_gain·log1p(hearCount))  // repetition
                                                     // backfires!
                   · (1 + neg_age_gain·(age_eff>65))  // ~1.4 old
    plus a tag: frame:"denied", frameStrength = 1.0
frame decays at beta_source·neg_frame_mult (2.0) — the "denied"
    wrapper dies ~2× faster than ordinary source tags
at retrieval: if frame dead and the affirmed candidate survives,
    believe_p computes as if affirmed — familiarity without the
    "false" context reads as true (the Skurnik signature);
    believe_p gets the w_fluency bump from hearCount either way
immediate window: while frame alive, candidate is correctly read
    as denied — denials DO work short-term (rate-locked P290)
```

Design consequence: a correction issued *once* protects; a denial
repeated at every retelling is a slow-acting rumor. Matches §6.6 —
CIE handles explicit corrections of REMEMBERED content; §6.29
handles denials of content the listener may never have held.

## 31. The reactivation window — recall opens the door to rumor

- **Chan, Thomas & Bulevich 2009** (Psych. Sci.): an immediate cued
  recall of a witnessed event **increased** later misinformation
  acceptance — the "reversed testing effect," in both younger and
  older adults. Two mechanisms: recall potentiated learning of the
  subsequent misinformation, and the just-recalled details were
  *preferentially* interfered with — consistent with a
  reconsolidation window (Hupbach et al. 2007 episodic updating:
  reactivation makes the trace labile).
- **DEBATED direction:** testing sometimes protects (interim-test
  literature; Potts & Shanks 2012 found testing reduced
  suggestibility under their conditions; Chan, Wilford & Hughes
  2012 — the moderators are whether the misinfo is *about tested
  vs untested* material and whether recall was successful). The
  robust core: recently-recalled DETAILS are the ones that absorb
  contradiction — the door opens on exactly what you just said.

**Spec consequence (§6.3 moderator):**

```
p_adopt additionally:
  · (worldDay − m.lastRecallDay < react_window ? react_suscept_mult
     : 1)                       // react_window ~0.5d (12h),
                                // react_suscept_mult ~1.3
  applies ONLY to fields that surfaced in that last recall —
    untested details are not in the window (Chan et al. Exp 3 —
    the lability is on the retrieved content)
AGE-FLAT (Chan found it in both cohorts — cite-guarded null)
```

Consequence: the most dangerous moment to hear a rumor is right
after telling your own version — a retelling is a vulnerability
window, not just a strengthener. §5.9's reconsolidation machinery
already destabilizes; this prices the exposure.

## 32. Phantom recollection vs phantom familiarity

- **Brainerd, Wright, Reyna & Mojardin 2001** (JEP:LMC, conjoint
  recognition): false recognition of gist-consistent lures decomposes
  into **familiarity** and **phantom recollection** — an illusory
  *vivid* experience of the non-event — and phantom recollection is
  the **larger** contributor. The 2022 conjoint-recognition
  meta-analysis (537 datasets) confirms the dual-recollection
  interpretation: gist retrieval can support recollective
  phenomenology via "ersatz verbatim traces" assembled at retrieval.
- Odegard & Lampinen 2004 (§28): conjunction errors carry
  "remember" judgments — vivid falsity is not a lab artifact.

**Spec consequence (amends §6.7/§6.8 output):** phantomized and
conjunction-inherited content enters the derived pair through TWO
gates instead of one:

```
phantom/inferred content with verbatim richness ≥ rm_rich_thresh:
    feeds recollect_q AND believe_p — "remembered" vividly
    (phantom recollection; prob of crossing = phantom_recoll
     ≈ 0.35 given the gate is met — gist is strong but the
     ersatz assembly doesn't always reach vivid)
below the gate: feeds believe_p only — the false-but-felt-familiar
    mode; the character says "sounds right" not "I see it"
diagnostic for validation: false records should split into a
    vivid-false cluster and a believed-unfelt cluster, not a
    continuum (bimodality check, P292)
```

## 33. Central vs peripheral — the gradient quantified; dyads beat groups

- **Dalton & Daneman 2006** (Memory): co-witness discussion —
  peripheral misinformation accepted **82%**, central **35%**,
  unmentioned central control **10%**; one-on-one discussion
  acceptance **68%** vs group discussion **49%**. Central errors,
  when they occur, carry *high* confidence (Ibabe & Sporer 2004:
  "legally serious" — central misinformation that lands is believed
  hard).
- The gradient is attentional: central fields get stronger verbatim
  (§2's attention weights already do this); peripheral fields are
  born weak or unwritten, so `(1−fieldStrength)` ≈ 1 — §6.3's
  per-field rule *already produces* a gradient. What's missing is
  (a) the group-size moderation of §6.5 and (b) the confidence
  asymmetry.

**Spec consequence:**
- §6.5 gains `group_damp` (0.75): conformity `p_adopt` on dyad
  discussions is the reference; each additional discussant beyond 2
  damps adoption multiplicatively (audience diffusion — more
  witnesses = more potential disagreement = less per-source uptake;
  68→49 over +2–4 people ≈ 0.75–0.85 per extra).
- §3 confidence note: adopted candidates on *central* fields inherit
  higher emitted confidence than peripheral adoptees (+conf
  ≈ 0.1) — wrong-but-central is confidently wrong.
- No new param for the gradient itself — it is emergent from
  fieldStrength; P293 is the quantification check (target band:
  peripheral adoption ≈ 2–3× central under matched accounts).

## 34. Truthiness — dressing that isn't evidence

- **Newman, Garry, Bernstein, Kantner & Lindsay 2012** (PBR):
  a *nonprobative* photo — related to a claim but proving nothing —
  raises truth ratings for the SAME claim in both directions
  ("alive" AND "dead"); verbal dressing works identically;
  generalizes to trivia claims. Effect = processing fluency read as
  truth (Alter & Oppenheimer 2009).
- Distinct from §16's `evid_boost`: evidence is *probative* —
  depicts the claimed event itself (doctored photo of YOU there).
  Truthiness is decorative — a photo of the place, an easy font, a
  vivid adjective. Evidence bends plausibility; truthiness pumps
  fluency directly.

**Spec consequence (§6.7 believe_p + hearAccount):**

```
hearAccount gains `dressing:true` (nonprobative decoration — a
    related image, fluent phrasing, a vivid detail off-claim):
    corroboration += truthy_gain (0.1) for that account —
    a pseudo-corroborator that counts like a weak second source
    but ISN'T one (P295 checks dressing ≠ evidence: dressing does
    NOT satisfy rm_rich_thresh, does NOT lift plaus)
account phrased disfluently (hedged, awkward): fluency term ×0.85
```

RW: the rumor that comes with a photo of the *street* (not the
event) spreads like it has a second witness. It doesn't.

## 35. Spec changes in v3.0 (summary)

- **§6.3** gains `react_window`/`react_suscept_mult` (retrieval-
  restricted, §31) — AGE-FLAT.
- **§6.5** gains `group_damp` per discussant >2 (Dalton & Daneman
  68→49).
- **New §6.25** verbal overshadowing (`vo_cand`, `vo_loss` — verbal
  recodes compete; timing gradient emergent).
- **New §6.26** unconscious transference (`transplant_gain`,
  `orb_gain`, `cat_resist`; inoculation-by-informant path).
- **New §6.27** conjunction migration (`conj_thresh`,
  `conj_migrate_p`, proximity boost; discrim_mult-scaled).
- **New §6.28** boundary extension (`be_gain` at ENCODE; age knots
  ×1.2 at 75).
- **New §6.29** denial backfire (`neg_cand`, `neg_frame_mult`,
  `neg_age_gain`; frame-outlives-content inversion).
- **New §6.30** phantom recollection split (`phantom_recoll`
  vivid-gate crossing prob; bimodal false-memory output).
- **§6.7/§10** `hearAccount` +`negated`/`dressing`/`groupSize`;
  `retell` +`verbalize`; Reconstruction candidates may carry
  `provenance:"inferred"` (transplant/conjunction — hidden like
  phantom).
- **§7** +16 params; knot updates: `be_gain` ×1.0→×1.2 at 75;
  `neg_age_gain` old-side; `conj_migrate_p`/`transplant_gain` ride
  `discrim_mult`; `react_suscept_mult`, `vo_*` declared AGE-FLAT
  (cite-guarded).

## 36. Parameter guidance and probes

| param | default | meaning |
|---|---|---|
| vo_cand / vo_loss | 0.5 / 0.15 | description candidate strength + verbatim cost (§6.25) |
| transplant_gain | 0.10 | familiar-person migration into dead person-slots (§6.26) |
| orb_gain / cat_resist | 0.5 / 0.4 | outgroup-category transplant amplifier / cross-category resistance (§6.26) |
| conj_thresh / conj_migrate_p | 0.65 / 0.05 | episode-pair gate + per-field migration rate (§6.27) |
| be_gain | 0.12 | encoded spatial overshoot (§6.28) |
| neg_cand / neg_frame_mult / neg_age_gain | 0.35 / 2.0 / 0.4 | affirmed-core candidate + frame-decay multiplier + old-age amplifier (§6.29) |
| react_window / react_suscept_mult | 0.5d / 1.3 | post-recall susceptibility window (§6.3) |
| phantom_recoll | 0.35 | vivid-gate crossing prob (§6.30) |
| group_damp | 0.75 | per-extra-discussant conformity damping (§6.5) |
| truthy_gain | 0.10 | nonprobative dressing corroboration (§6.7) |

**Probes P286–P297** (extends registry P1–P285):

- **P286 verbal overshadow (MUST — sign-locked):** verbalize-then-
  identify minutes later identifies WORSE than no-description;
  delay-inserted description hits harder than immediate (RRR
  −4%/−16% ordering). FAIL if describing helps nonverbal ID.
- **P287 transference (SHOULD):** dead person-slots fill with
  high-familiarity cue-plausible persons at ~5–15%; an explicit
  "he wasn't there" blocks (Ross elimination). Outgroup-category
  persons transplant more than ingroup at matched familiarity.
- **P288 conjunction (MUST):** two high-sim records swap a specific
  field while BOTH records and the true values persist; migrated
  candidate carries inferred provenance; old profile > young.
- **P289 boundary extension (MUST — directional):** reconstructed
  spatial extents overshoot (never systematically undershoot);
  veridical scenes judged "closer than remembered."
- **P290 denial backfire (MUST — rate-locked):** denied claim reads
  denied at T+0, affirmed at T+3d in old profiles; 3× denial
  outperforms 1× denial as a *planting* tool at delay (28→40
  direction). FAIL if frame never dies or content never flips.
- **P291 reactivation window (SHOULD):** account heard within
  react_window of a recall adopts more on the just-recalled fields
  than on unrecalled fields of the same record; outside window,
  no boost. FAIL if boost is record-wide.
- **P292 phantom bimodality (SHOULD):** phantomized records split
  into vivid-recollect vs familiar-only clusters at ~35/65 given
  gate met; not a continuum.
- **P293 central-peripheral (MUST — quantified):** matched accounts
  adopt ~2–3× more on peripheral than central fields; adopted
  central errors carry higher confidence (Ibabe & Sporer).
- **P294 dyad > group (SHOULD):** same misinfo in a 2-person vs
  4-person discussion → dyadic adoption materially higher
  (target ratio ≈ 68:49).
- **P295 truthiness ≠ evidence (MUST):** dressed accounts raise
  believe_p but never satisfy rm_rich_thresh or plaus — a
  nonprobative photo cannot flip an imagined record to
  "witnessed," only a probative one can.
- **P296 transplant provenance audit (MUST — hidden):** all
  transplanted/conjunction content keeps `inferred` provenance and
  hidden accuracy bookkeeping; no path lets inferred provenance
  relabel itself witnessed — only §6.9/§6.10 flip gates may.
- **P297 portfolio anti-Goodhart (OBSERVE):** over a 30d free run, the
  false-memory *rate* should decompose across ≥4 channels (misinfo,
  phantom, transplant, conjunction, denial) — FAIL if one channel
  produces >70% of false content (the system is a portfolio).

## 37. Honest limits (Part III)

- **Verbal overshadowing's applied size is genuinely uncertain** —
  meta Zr=−0.12, RRR −4 to −16 points; we implement the mechanism
  (verbal candidate competition) and let the size emerge, flag to
  game-systems as tunable.
- **UT's mechanism is contested** (Read et al. null-field results;
  Ross's conscious-inference subjects). Our transplant op
  implements the *outcome* — familiar people drift into episodes —
  which both mechanisms produce; the familiarity-vs-inference split
  is not modeled separately.
- **Conjunction ecology:** diary-study rates exist but not clean
  probabilities; conj_migrate_p is OBSERVE-tier.
- **Denial backfire** is two experiments in one domain (consumer
  claims); the 28→40 number is older-adults-only and single-cohort.
  We implement the frame-decays-faster asymmetry — the mechanism is
  on solid §6.4 ground even if the point estimates are thin.
- **Reactivation susceptibility** is DEBATED-head-on (reversed
  testing effect vs interim-test protection). We implement the
  retrieval-restricted version — the claim both sides' data permit:
  lability concentrates on the just-retrieved content.
- **Phantom recollection's** conjoint-recognition parameter isn't a
  probability we can port; phantom_recoll 0.35 is calibrated to
  "larger contributor than familiarity" at strong gist — tunable.
- BE is the one distortion that is *age-preserved and directional*;
  it's also the only operator that writes distortion at encode
  rather than retrieve — watch for double-counting with §2's
  schema-driven encoding fills (P289's direction check is the
  guard).

---
---

# PART IV (v42) — the instrumented channels: questions, feedback,
# and the past that answers back

**Scope:** Parts I–III covered what *accounts* do to records and what
the rememberer's own acts do. Part IV covers the channel the earlier
parts left implicit: **memory is interrogated**, and the
interrogation itself — the wording of the question, the feedback on
the answer, the interviewer's expectation, the altered playback of
one's own statement — is a distortion operator. Plus three
sharpenings: flashbulb confidence/accuracy decoupling, mood-congruent
lure selection, and the population-scale emergent layer. Tag
convention unchanged.

## 38. Flashbulb records — confidence decouples from accuracy

- **Neisser & Harsch 1992** (Challenger, N=106): three-year-delayed
  reports of the reception event were **massively inconsistent** with
  next-day reports (consistency ~2.95/7; a quarter of subjects wrong
  on every scored element) while **confidence stayed ~4.2/5** — the
  canonical demonstration that "I remember exactly where I was"
  certifies nothing about where they were.
- **Talarico & Rubin 2003** (9/11, prospective): flashbulb and
  everyday memories encoded same day decayed at **indistinguishable
  rates** in consistency; the ONLY divergent measure was confidence —
  flat and maximal for flashbulb, declining for everyday. Hirst et
  al. 2015 (10-yr follow-up): consistency collapses in the first
  ~3 years then plateaus — the canonical communal narrative freezes.
- Mechanism is ordinary: rehearsal of the *reception narrative*
  (media, retelling) drives drift exactly like §6.3/§6.12; what
  flashbulb adds is not a better trace but a **confidence floor the
  accuracy no longer earns**.

**[CONSENSUS — the decoupling is the finding, not the fidelity]**

**Spec consequence (new §6.42):** reception-event records (learning
of a high-arousal public event — "where I was when I heard") mint
with `flashbulb:true`:

```
flashbulb records: emitted confidence = max(conf, fb_conf_floor)
    // fb_conf_floor 0.75 — permanent, accuracy-independent;
    // the ONLY place in the model confidence is floored
candidate drift on the reception narrative is NORMAL — §6.3
    candidates, §6.12 serial convergence toward the communal
    canonical version; media retellings arrive as told_by accounts
    (sourceCredibility high — "everyone saw it"), giving the drift a
    systematic direction: toward the shared script
consistency plateaus after ~fb_plateau (1000d) of drift — the
    frozen-wrong steady state (Hirst 2015)
```

RW hook: every character confidently narrates where they were for
the quake/fire/raid — and a third of them are narrating a version
assembled later. The disagreement is permanent and no one's voice
wobbles.

## 39. The verb did it — question wording on quantitative fields

- **Loftus & Palmer 1974** (Exp 1): "smashed" produced speed
  estimates **40.8 mph** vs "hit" **34.0 mph** — the wording alone
  moved the estimate ~20%. Exp 2: a week later, "smashed" witnesses
  reported broken glass (there was none) at **32% vs 14%** —
  wording planted a peripheral detail that outlived the question.
- **Loftus & Zanni 1975**: indefinite vs definite article ("a"
  vs "the" broken headlight) doubles fabricated-detail reports —
  presupposition itself is suggestive.
- Mechanism: the question supplies a schema-intensity prior and an
  implied-detail candidate; weak verbatim fields absorb both
  (§6.3 machinery — the question IS an account).

**[CONSENSUS — the most-cited result in the field; sizes are
lab-magnitude, direction is not contested]**

**Spec consequence (new §6.43):** `answerProbe` gains
`wording_intensity` ∈ [−1,+1] (the question's implied magnitude —
"how fast was he going" vs "how slowly"; "how loud was the crash"):

```
on answerProbe with wording_intensity ≠ 0, for quantitative
verbatim fields (speed, size, duration, count, amount):
    pulled candidate: value = fieldVal + wording_intensity
                     · verb_pull (0.2) · schemaRange(field)
    provenance:"confabulated" — written by the question, not the
        memory; candStrength per §6.9 forced-confabulation rules
implied-detail clause: questions presupposing a detail ("the X")
    plant a confabulated candidate for X at lp_detail_p (0.15)
    if the field is empty/weak — "the broken glass" effect
```

## 40. "Good, you picked the right one" — feedback inflates the past

- **Wells & Bradfield 1998**: post-identification confirming
  feedback inflated not just confidence but **retrospective
  judgments of how good the view was, how much attention was paid,
  how quickly the pick was made** — feedback rewrites the encoding
  conditions, not just the verdict.
- **Douglass & Steblay 2006** meta (20 tests, N>2400): confirming
  feedback produces **large** effect sizes on certainty, view,
  attention; smaller on objective measures; disconfirming-vs-control
  effects small in the other direction. **Steblay, Wells &
  Douglass 2014** (Psych. Pub. Pol. Law, N≈7000): robust across
  settings; the literature's policy conclusion — feedback-tainted
  confidence certifies nothing.
- Asymmetry [DEBATED magnitude, CONSENSUS direction]: disconfirming
  feedback erodes confidence; in several designs the disconfirming
  hit is larger than the confirming boost.

**Spec consequence (new §6.44):** `feedback` event on a recall /
identification / retell emission:

```
feedback(confirm): confidence += fb_conf_gain (0.25)·(1−conf);
    encoding-condition fields (view quality, attention, distance,
    duration — the "how good was my look" fields) mint/promote
    inflated candidates at retro_inflate (0.15) — the past gets
    better because the answer was approved; provenance:"inferred"
feedback(disconfirm): confidence −= fb_disconf (0.4)·conf — hits
    harder than confirm helps; accuracy untouched in BOTH
    directions (feedback edits metamemory, never content —
    P-guarded)
blind-first rule: feedback effects are measured on post-feedback
    reports; a confidence snapshot taken BEFORE feedback is the
    only honest one (contract note — game-systems should log
    pre-feedback conf on contested identifications)
```

## 41. The interviewer already knows — expectancy transmission

- **Kassin, Goldstein & Savitsky 2003** (Psych. Sci.): interviewers
  led to expect guilt used more pressure, more guilt-presumptive
  questions; suspects under guilt-presumptive interrogation
  (regardless of actual guilt) were judged guiltier by blind
  observers — the expectation manufactures its own confirmation.
- **Kassin, Dror & Kukucka 2013** (forensic-confirmation review):
  the expectancy chain generalizes — an examiner's belief flows
  into the evidence and then reads the contaminated evidence back
  as corroboration. The loop, not the bias, is the mechanism.
- Narvaez & Stern-style face-construction expectancy (forensic
  composites built under expectation bias toward the expected face)
  — same loop on a perceptual artifact.

**[CONSENSUS that expectancy transmits; sizes are design-specific]**

**Spec consequence (new §6.45):** `answerProbe` gains
`expect:`{value} — the questioner's expected answer:

```
expect set: press_gain × (1 + expect_press 0.3) — expectation is
    pressure; AND the expected value itself writes a weak told_by
    candidate (the questioner leaks the answer: expect_cand 0.3)
expectancy loop: when the probe's emitted answer matches expect,
    the questioner's satisfaction feedback auto-fires §6.44
    confirm — expectation → pressure → conforming answer →
    confirmation → inflated confidence in the conforming memory.
    Self-fulfilling in one function call.
```

## 42. Memory blindness — your own words, altered

- **Cochran, Greenspan, Bogart & Loftus 2016** (Mem & Cogn, two
  experiments): subjects' own memory reports were altered and
  re-presented; the **majority failed to detect the changes**, and
  final memory tests shifted toward the altered versions — "memory
  blindness." Present whether framed as self-sourced or
  other-sourced [the self/other strength ordering is DEBATED —
  dissertation analyses found other-sourced slightly stronger].
- **Sauerland, Sagana & Otgaar-line sticker study** (PLoS ONE 2017):
  altered written answers on reattachable stickers — majority
  choice-blind; blind participants later reported recollections
  consistent with the manipulations.
- The dangerous version of self-delivered misinformation: the
  source is YOU, so sourceCredibility is maximal and the
  alteration arrives pre-attributed.

**[CONSENSUS phenomenon; small literature, two labs]**

**Spec consequence (new §6.46 — `swapReport`):** distinct from
§6.18 `swapOutcome` (which swaps a decision *outcome*); this swaps
the *content of a prior report*:

```
swapReport(charId, record, field, alteredValue):
    P(detect) = mb_detect (0.35) · (fresh ? 1 : 0.6)
                · (1 + 0.3·selfRelevance)   // seams on what you
                // SAID are easier than seams on what you DID
    undetected: altered value writes a candidate
        provenance:"claimed" (self-authored!), candStrength =
        cand_base_str · self_cred — self_cred 1.0, the highest
        sourceCredibility the model allows; the character
        "remembers" their own testimony more than the event
    detected: incongruent:true tag (same flag as §6.18 — the
        character noticed the seam)
```

## 43. The listener forgets what you didn't say — SSIF on the audience

- **Cuc, Koppel & Hirst 2007** (Psych. Sci.): listeners to a
  selective retelling later recalled FEWER unshared related details
  — **socially shared retrieval-induced forgetting** — because
  listeners covertly co-retrieve along with the speaker. Within-
  category, silent, no misinformation needed.
- **Stone, Coman, Brown, Koppel & Hirst 2012** review + **Coman,
  Manier & Hirst 2009** (9/11 field): SSIF persists ≥1 month and
  operates speaker→audience at scale — a community's shared
  silence about an unmentionable detail literally erodes it.
- Distinct from §6.5 conformity (which changes content) and §5.8
  RIF (which suppresses the *retriever's* own rivals): this is the
  **speaker's selection suppressing the listener's memory** —
  retelling is a distortion channel on people who never spoke.

**[CONSENSUS; the speaker→listener direction is the finding]**

**Spec consequence (new §6.47):** `hearAccount` applies a
suppression pass to the LISTENER's own record of the same event:

```
when listener l holds record m_l of the same event and hears a
    partial account covering field-set F:
    for fields related to F (same category/sim-neighborhood) that
        the account did NOT mention: l's surviving candidates take
        a one-shot ssif_suppress (0.15) strength hit — co-retrieval
        of the shared part suppresses the unshared rivals
mentioned fields are handled normally (§6.3 candidates/boosts) —
    the retelling simultaneously strengthens what it says and
    starves what it omits, WITHOUT asserting anything false
```

RW: a rumor doesn't have to lie to distort. The half-told story,
retold often, edits the audience's memory toward the telling.

## 44. "Nothing happened" — omission suggestion

- **Oeberst & Blank 2012** ("undoing" debate, Memory Studies):
  misinformation can also REMOVE true content from reports —
  blanket claims that an event/detail did not occur suppress
  reporting of surviving memory; DEBATED whether the mechanism is
  storage impairment, report bias, or demand — all three are
  documented components.
- Part III's §6.29 denial backfire plants the AFFIRMED core of a
  negated claim; omission suggestion is the opposite instrument —
  no affirmed content, just an assertion of absence.
- Related: suggesting that one saw nothing / "you wouldn't have
  noticed" — meta-claims about encoding quality attack confidence
  in the record wholesale (overlaps §40 disconfirm but aimed at
  existence, not verdict).

**[DEBATED mechanism; CONSENSUS that omission accounts reduce
reporting of the omitted]**

**Spec consequence (new §6.48):** `hearAccount` gains
`omission:true` (the account asserts absence, not content):

```
no candidate is written — instead, surviving candidates on the
    addressed record's core fields take emit_omit (0.2) penalty
    on their RETRIEVAL/emission weight (not strength — the trace
    stays, the report dries up; storage-vs-report DEBATED flag
    resolved by choosing the report side, which P-guards can
    distinguish: record still retrievable under discriminate
    mode, §6.50)
repetition compounds via hearCount as usual; neg_frame_mult does
    NOT apply — there is no affirmed core to outlive a frame
```

## 45. Imagined actions — rehearsing it is halfway to having done it

- **Goff & Roediger 1998**: imagining performing simple actions
  (breaking a toothpick) produced later false claims of HAVING
  performed them; more imaginings → more false claims — the action
  version of imagination inflation, stronger than scene imagining.
- **Thomas & Loftus 2002**: even bizarre self-performed imagined
  actions inflated later "did it" claims — the plausibility gate
  applies but imagined action inflation is robust across
  plausibility (bizarre imagined actions are imagined MORE, which
  compensates).
- Enactment gradient (Engelkamp): performed > imagined > heard —
  motor encoding is the richest channel; imagined actions carry
  partial motor content, which is why they flip easier.

**[CONSENSUS effect; the action/channel gradient is textbook]**

**Spec consequence (§6.9 extension — `selfAction:true`):**

```
imagineEvent(…, selfAction:true): the scenario is a rehearsed
    self-performance — rehearsing what you'd say, how you'd quit,
    the confrontation in the shower
    verbatim richness mints higher (motor/proprioceptive fills —
    +im_act_rich 0.1) AND source_confuse_flip × im_act_gain (1.5)
    — imagined DOING outlives imagined SEEING as a memory source
    candidates on the flip path read provenance "witnessed" with
    selfRelevance high — "I did it" phantoms are the most
    convincing phantoms a character can own
```

## 46. Ask the right question — the discriminate recall mode

- **Lindsay & Johnson 1989**: when the test forces source
  discrimination ("what did you see vs what were you told"), the
  misinformation effect largely dissolves — both contents coexist
  (Part II §13) and attribution is recoverable when demanded.
- **McCloskey & Zaragoza 1985** modified test: excluding the
  misinformation option unmasks surviving originals — the
  consensus storage story.
- This is the model's own instrument: candidate sets exist; what
  was missing is a retrieval mode that READS provenance instead
  of sampling winners.

**Spec consequence (§5 + new §6.50):** recall gains
`mode:"discriminate"` — an interview/cognitive-instruction context
forcing source attribution per field:

```
discriminate mode emits, per field: the candidate LIST with
    per-candidate provenance estimates (§6.10 sourceInfer run per
    candidate, not per field)
emitted false content falls by discrim_recover (0.5) — the
    monitoring recover; contested fields emit at reduced
    confidence, not with a winner
cost: slower (latency ×1.5), and §6.16/§6.17-style pulls still
    apply to candidates themselves — discriminate mode reveals
    competition, it does not sterilize it
```

The probe-grade implication (P163's instrument): the engine can now
report "says X, also holds Y from another source" — the difference
between a database that's wrong and a witness who's conflicted.

## 47. The lure matches the mood — congruent phantom selection

- **Joormann, Teachman & Gotlib 2009** (J. Abnorm. Psych.):
  depressed participants produced MORE false recall of
  negative-valence critical lures and FEWER of positive — the
  phantom machinery is valence-selective, tracking trait mood.
- **Howe & Malone 2011** (Cognition): mood-congruent DRM false
  memories under induced mood — congruence works on state as well
  as trait.
- Direction: it is SELECTION, not rate — depression doesn't make
  more phantoms, it makes negative ones (and older adults'
  positivity shift predicts positive-selective lures — consistent
  with §1.6/fading-affect asymmetry).

**[CONSENSUS direction; the selectivity-not-volume claim is the
useful part]**

**Spec consequence (§6.8/§6.27 candidate selection):** lure and
migration candidates are valence-filtered before the phantomize
draw:

```
candidate weight ×= 1 + moodcong_lure (0.25)
                     · match(candidate.valence, traitValence)
    // depressive profiles phantomize the negative schema detail;
    // positivity-shifted elders the warm one; rate unchanged,
    // CONTENT congruent — sign-locked probe
```

## 48. The emergent layer — collective phantoms, no operator

Nothing in Parts I–IV needs a new mechanism to produce the
population-scale phenomenon: schema-consistent lures (§6.8) +
mass parallel exposure (hearCount fluency, §6.3) + conformity
(§6.5) converge toward shared false "facts" — the
Monopoly-man's-monocle class of collective misremembering
("Mandela effect" — the folk label; the mechanism decomposition is
what the literature offers: shared schemas generate the SAME lure
in every head, then the rumor layer corroborates it).

**Spec consequence (§6.51, OBSERVE-only):** no operator; a
validation check that N characters exposed to the same schema-rich
event develop CORRELATED phantom details above the independence
baseline — shared falsity emerging from shared schemas, not from
a shared error channel.

## 49. Spec changes in v4.1 (summary)

- **New §6.42** flashbulb records (`flashbulb:true`,
  `fb_conf_floor`, `fb_plateau` — confidence floored, drift normal,
  plateau frozen).
- **New §6.43** question wording (`wording_intensity` on
  answerProbe, `verb_pull`, `lp_detail_p` presupposition planting).
- **New §6.44** confirmatory/disconfirming feedback (`feedback`
  event; `fb_conf_gain`, `fb_disconf`, `retro_inflate` on
  encoding-condition fields; blind-first logging contract).
- **New §6.45** interviewer expectancy (`expect:` on answerProbe —
  `expect_press`, `expect_cand`; auto-confirm loop into §6.44).
- **New §6.46** `swapReport` — memory blindness on own reports
  (`mb_detect`, `self_cred` 1.0 ceiling, incongruent tag reuse).
- **New §6.47** listener-side SSIF (`ssif_suppress` — suppression
  pass on the listener's unshared related fields).
- **New §6.48** omission suggestion (`omission:true`,
  `emit_omit` — report-side suppression, DEBATED mechanism noted).
- **§6.9 extension** `selfAction:true` (`im_act_gain`,
  `im_act_rich` — imagined self-performance flips easier).
- **New §6.50** discriminate recall mode (`mode:"discriminate"`,
  `discrim_recover`, per-candidate provenance emission, latency
  cost).
- **§6.8/§6.27 selection** mood-congruent lure weighting
  (`moodcong_lure`).
- **New §6.51** collective phantoms — OBSERVE note, no operator.
- **§7** +15 params (all optional w/ defaults).
- **§10** contract: `answerProbe` +`wording_intensity`/`expect`;
  `hearAccount` +`omission`; `imagineEvent` +`selfAction`; recall
  +`mode:"discriminate"`; new `feedback` + `swapReport` calls;
  records may carry `flashbulb:true` (visible — the character's
  certainty is the feature).

## 50. Parameter guidance and probes

| param | default | meaning |
|---|---|---|
| fb_conf_floor / fb_plateau | 0.75 / 1000d | flashbulb confidence floor + drift freeze (§6.42) |
| verb_pull | 0.2 | quantitative-field pull toward wording intensity (§6.43) |
| lp_detail_p | 0.15 | presupposed-detail planting rate (§6.43) |
| fb_conf_gain / fb_disconf / retro_inflate | 0.25 / 0.4 / 0.15 | feedback confidence + retroactive encoding inflation (§6.44) |
| expect_press / expect_cand | 0.3 / 0.3 | expectancy pressure + leaked-answer candidate (§6.45) |
| mb_detect / self_cred | 0.35 / 1.0 | self-report alteration detection + self-source ceiling (§6.46) |
| ssif_suppress | 0.15 | listener unshared-field suppression per partial account (§6.47) |
| emit_omit | 0.2 | omission-account emission penalty (§6.48) |
| im_act_gain / im_act_rich | 1.5 / 0.1 | imagined-action flip multiplier + richness (§6.9) |
| discrim_recover | 0.5 | false-content emission fall in discriminate mode (§6.50) |
| moodcong_lure | 0.25 | valence-congruent candidate selection weight (§6.8) |

**Probes P421–P432** (extends registry P1–P420):

- **P421 flashbulb decoupling (MUST — sign-locked):** flashbulb
  records' consistency decays at everyday rates while emitted
  confidence stays ≥ fb_conf_floor; plateau of (wrong) consistency
  by ~fb_plateau. FAIL if confidence tracks accuracy.
- **P422 verb pull (MUST):** matched events probed with
  wording_intensity ±1 → quantitative estimates differ in the
  wording's direction; presupposed details surface at ~lp_detail_p
  a week later on empty fields.
- **P423 feedback asymmetry (MUST):** confirm → conf up AND
  view/attention candidates inflate; disconfirm → conf down MORE;
  accuracy untouched in both arms. FAIL if feedback moves
  field content.
- **P424 expectancy loop (SHOULD):** answerProbe with expect +
  auto-confirm produces expectation-congruent, high-confidence
  reports at rates above matched neutral probes — the loop, not
  just the leak.
- **P425 memory blindness (MUST):** swapReport undetected at
  ~55–70%; undetected arms shift later reports toward the
  alteration at HIGHER rate than matched other-sourced
  misinformation (self_cred > sourceCredibility ordering).
- **P426 listener SSIF (MUST — sign-locked):** after a partial
  account, listener's unmentioned related-field candidates are
  weaker than no-account controls; mentioned fields strengthened —
  same account, both signs.
- **P427 omission (SHOULD):** omission:true accounts reduce later
  emission of the addressed record's core fields WITHOUT reducing
  their retrievability under mode:"discriminate" — report-side,
  not store-side (the DEBATED-mechanism discriminator).
- **P428 imagined action (SHOULD):** selfAction:true imagineEvent
  loops flip to "witnessed" ~1.5× the rate of matched scene
  imaginations; flip candidates carry elevated richness.
- **P429 discriminate mode (MUST):** discriminate recall emits
  candidate lists with provenance estimates; emitted false content
  ~halved vs sample mode; contested-field confidence lower;
  latency higher.
- **P430 mood-congruent lures (MUST — sign-locked):** depressive
  profile phantomizes negative-schema details preferentially at
  MATCHED total phantom rate; positivity-shifted elder profile the
  positive ones. FAIL on volume differences — selection only.
- **P431 blind-first logging (OBSERVE):** contested identification
  logs carry pre-feedback conf — contract check, not behavior.
- **P432 collective phantoms (OBSERVE):** 8 mains + shared
  schema-rich event → correlated phantom details above
  independence baseline; no dedicated operator may exist
  (P-guard against a "collective_memory" shortcut).

## 51. Honest limits (Part IV)

- **Flashbulb confidence is floored as a modeling choice** — the
  literature shows flat-maximal confidence; whether the floor is
  truly permanent or slowly erodes past ~10y is open (Hirst 2015's
  plateau is consistency, confidence data thin late).
- **Feedback effects are lineup-calibrated**; the retro_inflate
  generalization to non-eyewitness records is our extrapolation —
  flagged tunable.
- **Expectancy loop** is assembled from separate findings
  (pressure transmission × feedback inflation) — the composition
  is HYPOTHESIS; each clause is sourced.
- **Memory blindness** is two labs/small N; mb_detect is a
  midpoint guess — and the self-vs-other ordering is actively
  DEBATED (we take self_cred highest because pre-attribution is
  the mechanism both sides agree on).
- **Omission suppression** deliberately lands on the report side;
  Oeberst & Blank's debate is unresolved, and our resolution is
  the one that keeps P427 falsifiable.
- **Discriminate mode** is the one operator that REDUCES emitted
  falsity — keep discrim_recover ≤0.6 or the witness interview
  becomes a cure-all the literature doesn't support (source
  discrimination helps, it doesn't sterilize).
- **Collective phantoms** are a prediction, not a citation —
  P432 is OBSERVE because correlated phantom rates at population
  scale have no clean human benchmark; the Mandela-effect label
  is folk, not experimental.

---

# PART V (v54) — the arrival channels: who said it first, who
# showed the proof, and what you were only planning to do

**Scope:** Parts I–IV priced what accounts, interrogations, and the
rememberer's own acts do to records. Part V prices what was still
implicit: **the order content arrives in** (first believable account
anchors, and discrediting the anchor doesn't evict it), **retrieval as
a susceptibility event** (recalling first makes you *worse*, not
better — the reversed testing effect), **the schema writing at
encoding** (expected-but-absent details minted with witnessed
provenance, present at first recall), **fabricated proof** (doctored
evidence bypasses the plausibility gate that stops every other
channel), **fiction and story framing** (content labeled untrue still
plants facts), **reasons** ("why" fields are never encoded, always
minted on demand), **corroboration genealogy** (three hearers of one
origin are not three witnesses), **re-appraised affect** (the
remembered feeling tracks today's reading of the event, not
yesterday's feeling), **the two-factor trait** (yield vs shift —
accepting a lead is not the same as buckling under pressure), and
**the interrupted deed** (routine intentions mint "I did it"
completions). Tag convention unchanged.

## 52. The first believable account anchors — and survives its own
## discrediting

- **Ross, Lepper & Hubbard 1975** (JPSP 32:880 — verified): false
  success/failure feedback produced self-perceptions that
  **persevered after total discrediting** — for actors AND observers;
  only "process" debriefing (explaining the perseverance mechanism
  itself) removed them. The discredited *basis* dies; the formed
  impression doesn't.
- The mechanism is explanatory: once the mind has built a coherent
  account around the first version, later information is *assimilated
  to it* rather than compared against it (anchoring + biased
  attribution). Opportunity to explain increases perseverance —
  thinking about why the false feedback was plausible *entrenches*
  it.
- Distinct from §6.6 continued influence (CIE = correction of
  misinformation already merged); this is the *ordering* asymmetry
  in candidate competition: the first credible candidate on an
  EMPTY field isn't just first, it's privileged — competitors must
  displace an incumbent, not a vacancy.

**[CONSENSUS phenomenon; the size is task-bound — direction locked]**

**Spec consequence (new §6.75 — `anchor_w`):**

```
when a field holds no surviving candidate (empty or decayed below
    forget_thresh), the FIRST credible candidate to arrive gains
    anchor_w (×1.5) effective weight in all future competition —
    the incumbent advantage; provenance irrelevant (witnessed,
    told_by, confabulated all anchor)
discrediting the anchor's source (correction, §6.6, or credibility
    collapse of the telling source) does NOT remove the candidate:
    it drops its effective weight to persever_resid (0.4) and
    flips the field's beliefStatus — content residue stays
    competitive and re-wins once corroboration re-arrives
    (Ross et al.: the impression outlives its basis)
rescue clause: a correction that EXPLAINS the distortion mechanism
    (process debrief — "you heard this from X who was guessing")
    clears the anchor flag entirely — the only eviction path
```

RW: the first story a character hears about "what happened at the
dock" becomes the load-bearing version; being told the source lied
changes what they *say they believe* more than what they remember.

## 53. Recalling first makes you worse — the reversed testing effect

- **Chan, Thomas & Bulevich 2009** (Psych. Sci. 20:66 — verified):
  contrary to the testing-effect prediction, **immediate cued recall
  of a witnessed event INCREASED later misinformation adoption** —
  in both younger and older adults. Two mechanisms: (a) retrieval
  enhanced learning of subsequent misinformation (test-potentiated
  encoding), (b) the retrieved details themselves became
  *particularly* susceptible to interference — the reconsolidation
  window (§6.31) with teeth.
- Follow-on finding (Fazio, Barber, Rajaram, Ornstein & Marsh 2013;
  Henkel 2004 repeated-test studies): once a wrong answer is
  *emitted* — even tentatively, even with low confidence — it is
  stored like any retrieval and compounds; errors beget errors, and
  the emitter's own production is a high-credibility source
  (self_cred, §6.46).

**[CONSENSUS — the reversal direction is replicated; named the
"reversed testing effect" in the literature]**

**Spec consequence (new §6.76):**

```
p_adopt (§6.3) gains a timing leg: an account arriving within
    test_window (1 day) of a successful recall/emission of the
    same record gets test_pot_mult (×1.3) — recalling opened the
    record for interference; the fresh verbatim is a liability,
    not a shield
emitted candidate consolidation: any emitted field value — right
    or wrong — takes the normal retrieval S-growth PLUS
    own_emit_gain (0.1) candStrength and provenance "claimed"
    (self-authorship). A character who guesses "he wore a green
    jacket" now owns a green jacket
interaction with §6.50 discriminate mode: the potentiation applies
    to the SAMPLE-mode recall that preceded the account — the
    careful interview doesn't retro-protect what a casual
    recollection already exposed
```

## 54. The schema writes at encoding — expected things that weren't
## there

- **Brewer & Treyens 1981** (Cogn. Psych. 13:207 — verified):
  subjects waited in an office, then recalled it; **schema-expected
  but absent objects were falsely recalled** (books, filing cabinet),
  expectancy ratings predicted false inclusions, and salient-but-
  unexpected present objects behaved differently — the schema
  contributes *items*, not just priors.
- Lampinen, Copeland & Neuschatz 2001 (Mem. Cogn. 29) replicated
  across scene types and showed the errors carry *remember*
  phenomenology — they don't feel like guesses.
- Timing question [DEBATED]: does the schema fill at encoding, at
  retrieval, or both? Brewer & Treyens' integration hypothesis says
  the trace is born mixed — the false detail is *in* the episodic
  record, which is why it arrives at FIRST recall with witnessed
  weight. Our model previously minted schema content only at
  reconstruction (confab_fill, §6.2) — which made every schema
  error detectably late-arriving. Humans get it earlier.

**[CONSENSUS effect; DEBATED timing — we take the encoding-side
reading, which is the one that matches first-recall phenomenology]**

**Spec consequence (new §6.77 — `exp_fill_p`):**

```
at encodeEvent, for each schema-expected field the event record did
    NOT carry (expectancy ≥ exp_thresh 0.6 in the event-type
    schema): mint a verbatim candidate at exp_fill_p (0.25),
    candStrength = enc·0.6, provenance "schema" — invisible to
    the character; it IS part of the episode from birth
sign-lock vs §6.2: exp_fill candidates exist BEFORE first recall;
    confab_fill candidates exist only at reconstruction. A first
    telling of a schema-rich scene already contains the books that
    weren't there — no amount of "tell me everything, immediately"
    interviewing prevents it
saliency exception: high-salience UNEXPECTED items encode normally
    (the oddball is the memorable part) — the fill targets expected-
    absent fields only
```

## 55. Proof beats plausibility — fabricated evidence breaks the gate
## every other channel respects

- **Wade, Garry, Read & Lindsay 2002** (Psych. Bull. Rev. 9:597 —
  verified): a doctored childhood photo (hot-air balloon ride that
  never happened) produced **complete or partial false memories in
  50%** of subjects over three sessions — narrative implantation's
  ~25% rate nearly doubled by a fabricated artifact.
- **Nash & Wade 2009** (Appl. Cogn. Psych. — verified): falsely
  accused of cheating on a gambling task, subjects shown a doctored
  video "of themselves" confessed more, internalized more, and
  confabulated details more than told-video controls.
- **Nash, Wade & Lindsay 2009** (Mem. Cogn. 37:414 — verified):
  doctored-video evidence and imagination EACH produced false
  beliefs/memories; combined they were additive-to-superadditive.
- **Kassin & Kiechel 1996** (Psych. Sci. 7:125 — verified): false
  incriminating evidence (a confederate "witness" + fabricated
  computer-crash claim) drove innocent subjects to sign confessions,
  **internalize guilt, and confabulate memory details consistent
  with the belief** — the evidence manufactures the memory.

**[CONSENSUS — fabricated evidence is the single most potent
implantation vector measured]**

**Spec consequence (new §6.78 — `presentEvidence`):**

```
presentEvidence(charId, artifact, claim):
    sourceCredibility = ev_cred (0.95) — the artifact ceiling;
        physical "proof" outranks every speaker
    claim bypasses plaus_min (§6.9): the gate is a plausibility
        check, and the artifact IS the plausibility — bizarre
        claims with proof implant where identical unproven claims
        die at the gate
    retro_evid (0.2): encoding-condition fields mint inflated
        candidates — "I must have been there," "of course I
        remember now" — the evidence back-fills a past that makes
        it coherent (Kassin & Kiechel confabulation leg)
    evidence + imagineEvent is superadditive: run both — the
        artifact supplies plausibility, imagination supplies
        phenomenal richness (Nash, Wade & Lindsay)
authenticity seam: artifact records carry authentic ∈{real,
    doctored} — VISIBLE to the ledger/history browser, never to
    the character; detection flips credibility to ~0 and (because
    the content already anchored, §6.75) leaves the residue
```

## 56. "Why" is minted on demand — reasons are the one field class
## that never encodes

- **Nisbett & Wilson 1977** (Psych. Rev. 84:231 — verified canonical):
  people produce fluent, confident causal accounts of their own
  choices while demonstrably wrong about the operative causes —
  reasons are *inferred*, not retrieved; the teller cannot tell the
  difference.
- Consistent with the whole confabulation corpus (split-brain
  interpreter, Gazzaniga; attribution theory): the causal field is
  a reconstruction slot, not a trace.
- The model has treated reasons like any other field — they decay,
  drift, get misinformed. But a reason was never THERE to decay:
  motives are the prototypical always-confabulated field.

**[CONSENSUS — the specific claim that introspections read
confabulation machinery, not introspective access]**

**Spec consequence (new §6.79 — `why_mint_p`):**

```
fields of class "reason"/"motive" NEVER write verbatim at
    encodeEvent — the slot stays empty by design
at the first probe demanding a reason ("why did you..."), a
    candidate mints at why_mint_p (~1.0 — everyone produces a
    reason) drawn from schema[eventType] ⊕ selfModel ⊕ current
    appraisal; provenance "confabulated"; confidence NORMAL, not
    low — the teller can't tell (Nisbett & Wilson)
thereafter the minted reason rehearses and anchors like content —
    the first confabulated answer becomes the true reason
    (§6.75 anchor on a confabulated candidate: the story of why
    freezes early)
correct-reason rate is governed by schema quality + selfModel
    accuracy — sometimes the confabulation IS right, which is why
    it feels like access
```

## 57. Stories teach "facts" — the fiction channel nobody guards

- **Marsh, Meade & Roediger 2003** (J. Mem. Lang. 49:519 —
  verified): short stories containing real-world assertions —
  some true, some planted-false — left readers producing the
  planted claims as general knowledge: **>35% of targeted items
  answered with misinformation vs <10% baseline**, suppressing
  correct answers participants otherwise knew; effects SURVIVED a
  one-week delay, and readers misattributed story facts as
  "things they already knew."
- Aging arm (Marsh, Balota & Roediger 2005 — verified): healthy
  older adults show the misinformation effect from fiction too —
  smaller than young; very-mild DAT dampens both benefit and cost.
- Distinct from §6.61 sleeper effect (source discrediting decays
  later); the fiction channel needs no discrediting event — the
  "unreliable" tag is present from birth and STILL doesn't block
  absorption.

**[CONSENSUS — fiction implants real-world belief; warning framing
reduces but does not eliminate]**

**Spec consequence (new §6.80 — `fic_penalty`):**

```
accounts framed as story/joke/hypothetical ("you'll never believe
    the story I heard", "just a hypothetical") route through
    hearAccount with sourceCredibility × fic_penalty (0.5) —
    HALVED, not zeroed; the frame is a discount tag on the
    source, not a quarantine on the content
planted candidates on world-knowledge (semantic) fields absorb
    the fiction channel most — episodic hearsay needs §6.3 as
    usual; semantic "everyone knows" content is the thin door
fic_known_prior (0.15): absorbed fiction candidates gain a
    fluency bonus on FIRST emission — "I'm sure I knew that
    already" (Marsh's misattribution leg); hearCount incremented
    as usual — repetition compounds regardless of frame
```

RW: embellished gossip *framed as gossip* still plants the fact.
The audience discounts the teller and keeps the content.

## 58. Corroboration needs genealogy — three hearers of one source
## are one witness

- **Meade & Roediger 2002** (Mem. Cogn. 30:995 — verified): in the
  social-contagion paradigm, confederate misinformation transferred
  to subjects' later recall even under explicit warning and even on
  source-monitoring tests; adoption grew with repetition count and
  with schema-consistency of the suggested item.
- **Roediger, Meade & Bergman 2001** (Psych. Bull. Rev. 8:365 —
  verified): contagion bigger for schema-consistent intrusions and
  under weaker encoding — and produced more "know" than "remember"
  reports: transmitted falsity arrives as fluent fact, not relived
  episode (§6.7 believe/recollect split, confirmed in the wild).
- The propagation implication the model was missing: believe_p's
  corroboration term counted *tellers*. But contagion flows down a
  tree — N characters who all heard it from the same origin are
  ONE observation repeated N times. Correlated falsehood masquerades
  as independent confirmation.

**[CONSENSUS effect; the genealogy rule is our formalization —
HYPOTHESIS at the mechanism level, forced by the source-monitoring
logic]**

**Spec consequence (new §6.81 — `corrob_root_req`):**

```
believe_p's corroboration term (§6.7) counts candidate origins,
    not candidate holders: two accounts corroborate only if their
    provenance trees share NO common ancestor record/teller
    (corrob_root_req: true default)
hearAccount now appends the account's lineage (speaker chain as
    known to the hearer — they usually know "Mara told Priya")
    to the candidate's provenance; unknown links count as
    independent ONLY below lineage_conf (0.5) — hearsay of
    unknown origin is cheap corroboration, matching the "know"
    phenomenology
net effect: a rumor through a clique plateaus at ~single-source
    belief; the SAME claim arriving via two genuinely separate
    observation chains is what moves believe_p to "fact" —
    the difference between gossip and news
```

## 59. The feeling is re-appraised — remembered emotion tracks
## today's reading, not the feeling

- **Levine 1997** (JEP:G 126:165 — verified): Perot supporters'
  recalled emotional reactions, measured again after the election,
  **distorted systematically toward current appraisals** — memories
  for emotion are partially reconstructed from what the event
  means NOW.
- Levine & Bluck 1997 (older adults same dataset — verified):
  older adults' recall of emotional intensity faded more — the
  remembered feeling is a re-appraisal product across the lifespan.
- Distinct from §5.5 mood_bleed (current MOOD bleeds into reported
  affect) and fading-affect (tags decay asymmetrically): this is
  re-APPRAISAL of the event — the same stored tag reads
  differently because the outcome is now understood differently.
  "I was furious" softens when the feud is over — and hardens
  retroactively when it resumes.

**[CONSENSUS direction; magnitude is study-bound]**

**Spec consequence (new §6.82 — `reappr_k`):**

```
emitted affect on recall: emoTag_out = (1−reappr_k)·emoTag_stored
    + reappr_k·appraise(event, now)
    reappr_k 0.35; appraise() re-evaluates outcome valence from
    CURRENT belief/RelEdge state — the stored tag never rewrites,
    the report drifts
sign-lock: the shift direction is toward current appraisal —
    reconciled ex-friends' old fights report warmer; reignited
    feuds' old injuries report colder. P-guard: emoTag_stored is
    ledger-side; only the emission moves
interaction: trauma:true records exempt (Brewin phenotype — the
    hot tag doesn't re-appraise); high-arousal flashbulb
    reception-tags reappraise HALF rate
```

## 60. Yield and shift — the two-factor trait the single
## susceptibility scalar was hiding

- **Gudjonsson Suggestibility Scales** (GSS; Gudjonsson 1984/1997 —
  verified): interrogative suggestibility factor-analyzes into TWO
  stable dimensions — **Yield** (giving in to leading questions)
  and **Shift** (changing answers under negative feedback/social
  pressure). They correlate but dissociate.
- Mechanism split (verified — Otgaar-line source-identification
  studies): Yield scores contain genuine internalization PLUS
  compliance; Shift scores are mostly compliance — the pressured
  flip doesn't necessarily change the record. Two different
  channels wearing one number.
- Predictors differ: Yield tracks uncertainty/memory quality;
  Shift tracks social-evaluative anxiety, compliance, and
  negative-life-event load (verified structural models).

**[CONSENSUS factor structure; the compliance-vs-internalization
weights per factor are the finding]**

**Spec consequence (new §6.83 — split `misinfo_suscept`):**

```
misinfo_suscept is retained as the aggregate dial but decomposes:
    yield_suscept (0.35) — weights §6.3 p_adopt on leading/
    presupposing accounts (§6.43 wording, §6.48 omission): the
    acceptance channel; absorbed content internalizes
    shift_suscept (0.35) — weights answer-FLIPS under negative
    feedback/pressure (§6.44 disconfirm, §6.59 pressure,
    §6.45 expectancy): the compliance channel; a shift_suscept-
    driven flip changes the EMISSION and writes the flipped
    answer as a "claimed" candidate at only shift_int_frac (0.4)
    of normal strength — pressure flips mouths faster than minds
trait mapping (profiles): yield loads on misinfo_suscept-adjacent
    traits (distrust ↓, wmc ↓); shift loads on social anxiety /
    neurotic / low-assertiveness — the two dials decorrelate in
    profile space exactly as the GSS factors do
```

## 61. The interrupted deed — intentions mint "I did it" completions

- **Albarracín et al. 2020** (PSPB 47:38 — verified): across five
  studies, participants **misremembered having enacted mundane
  decisions they had only intended** — conflating intention and
  behavior; confusion GREW with behavioral/mental similarity
  between intending and doing; monitoring enactment (not
  intention) was the effective rescue.
- **Scullin, Bugg & McDaniel 2011** (Psych. Aging 27:46 —
  verified): ~25% commission errors — re-performing an already-
  completed intention when its cue re-fires; spontaneous retrieval
  of finished intentions + weak executive check.
- Mechanism: intentions are activated representations sharing
  content with the act (Goschke & Kuhl intention-superiority);
  for routine/scripted actions the intention trace is nearly
  indistinguishable from a weak performance trace — output
  monitoring fails exactly where the task is most automatic.

**[CONSENSUS direction on the phenomenon; young literature — sizes
are lab-bound]**

**Spec consequence (new §6.84 — `intent_done_p`):**

```
armed Intention records (§9 extension) that are routine/script-
    consistent (schema[action] exists and recurs) mint, on each
    dwell/rehearsal, a "performed" candidate on the intention's
    action slot at intent_done_p (0.08 per dwell, ×sim
    intention↔act) — the rehearsed plan reads as a thin memory
    of having done it
consequences land downstream: the character reports "I paid it,"
    believes it, stops intending — a false-completion phantom on
    the RW chore loop (rent, calls, errands)
mirror channel: after firing, the residual intention keeps
    misfiring under its cue — commission errors (re-doing) at
    ~comm_err_p (0.2) under load/fatigue (Scullin: spontaneous
    retrieval + weak check)
rescue: monitoring THE ACT at encode (att ≥ att_min+0.1 — you
    noticed yourself doing it) suppresses intent_done_p to ~0 —
    attention on the doing, not the intending (Albarracín's
    asymmetry)
```

## 62. Spec changes in v5.2 (summary)

- **New §6.75** first-account anchor (`anchor_w`, `persever_resid`,
  process-debrief eviction).
- **New §6.76** test-potentiated misinformation (`test_window`,
  `test_pot_mult`, `own_emit_gain`, "claimed" provenance on emitted
  fields).
- **New §6.77** schema fill at encoding (`exp_fill_p`, `exp_thresh`;
  encode-time candidates, sign-locked vs §6.2).
- **New §6.78** `presentEvidence` — fabricated artifacts
  (`ev_cred` ceiling, plaus_min bypass, `retro_evid` back-fill,
  `authentic` ledger flag).
- **New §6.79** reason/motive field class (`why_mint_p` —
  never-encoded, mint-on-probe, normal confidence).
- **New §6.80** fiction/unreliable-frame channel (`fic_penalty`,
  `fic_known_prior`).
- **New §6.81** provenance-tree corroboration (`corrob_root_req`,
  `lineage_conf` — corroboration counts independent roots).
- **New §6.82** re-appraised affect (`reappr_k` — emitted emoTag
  blends stored tag with current appraisal; trauma exempt).
- **New §6.83** yield/shift split (`yield_suscept`,
  `shift_suscept`, `shift_int_frac` — acceptance vs compliance).
- **New §6.84** intention→completion confusion (`intent_done_p`,
  `comm_err_p`, act-monitoring rescue).
- **§7** +17 params (all optional w/ defaults).
- **§10** contract: `presentEvidence` call; `hearAccount` +
  `frame:"story"`; `answerProbe` +`why:true`; record lineage field
  note; Intention `performed`-candidate note.

## 63. Parameter guidance and probes

| param | default | meaning |
|---|---|---|
| anchor_w / persever_resid | 1.5 / 0.4 | incumbent weight bonus + discredited-anchor residue (§6.75) |
| test_window / test_pot_mult | 1d / 1.3 | recall-before-account susceptibility leg (§6.76) |
| own_emit_gain | 0.1 | emitted-answer candidate strength bonus (§6.76) |
| exp_fill_p / exp_thresh | 0.25 / 0.6 | encode-time schema fill rate + expectancy bar (§6.77) |
| ev_cred / retro_evid | 0.95 / 0.2 | artifact credibility ceiling + back-fill rate (§6.78) |
| why_mint_p | 1.0 | reason-candidate mint rate on probe (§6.79) |
| fic_penalty / fic_known_prior | 0.5 / 0.15 | story-frame discount + fluency bonus (§6.80) |
| corrob_root_req / lineage_conf | true / 0.5 | independent-roots rule + unknown-lineage discount (§6.81) |
| reappr_k | 0.35 | current-appraisal blend on emitted affect (§6.82) |
| yield_suscept / shift_suscept / shift_int_frac | 0.35 / 0.35 / 0.4 | two-factor suggestibility split (§6.83) |
| intent_done_p / comm_err_p | 0.08 / 0.2 | intention-completion mint + residual firing (§6.84) |

**Probes P555–P565** (extends registry P1–P554):

- **P555 anchor incumbency (MUST):** first credible candidate on an
  empty field vs equally-credible later competitor → the first wins
  emission at a rate above the reverse-order control; the effect
  vanishes when the field holds a surviving verbatim (no vacancy,
  no anchor).
- **P556 debrief perseverance (MUST — sign-locked):** discredit an
  anchored candidate's source → emission rate drops to
  persever_resid band but does NOT zero, and re-corroboration
  re-elevates it; a mechanism-explaining correction clears the
  anchor entirely. FAIL if ordinary correction evicts.
- **P557 reversed testing (MUST — sign-locked):** recall of a
  record followed within test_window by a misleading account →
  p_adopt HIGHER than no-recall control. FAIL if recall protects —
  the literature's direction is backwards from intuition.
- **P558 encode-time schema fill (MUST):** first recall of a
  schema-rich event already emits expected-absent fields at
  ~exp_fill_p; emitted fields carry witnessed phenomenology
  (normal confidence, no confab telltales in discriminate mode's
  provenance list beyond "schema").
- **P559 evidence gate (MUST):** identical claim delivered as
  narrative vs presentEvidence → artifact arm implants at ≥1.5×
  and bypasses plaus_min (implausible+proven implants where
  implausible+unproven dies); retro_evid candidates appear on
  encoding-condition fields.
- **P560 reason mint (SHOULD):** a never-probed "why" produces a
  fluent, normal-confidence, schema-consistent answer on first
  ask; the same answer then repeats stably (anchored) — the
  confabulation is invented once and rehearsed thereafter.
- **P561 fiction channel (SHOULD):** story-framed misinfo lands at
  ~fic_penalty of unframed rate but far above zero on semantic
  fields; absorbed claims show fic_known_prior fluency ("already
  knew it") on first emission.
- **P562 genealogy (MUST):** believe_p after hearing a claim from
  three tellers sharing one origin ≈ single-teller; three
  independent-origin tellers push believe_p materially higher.
  FAIL if teller count alone moves believe_p.
- **P563 re-appraisal (MUST — sign-locked):** flip the event's
  current outcome appraisal → emitted emoTag shifts toward it at
  ~reappr_k while emoTag_stored is ledger-identical; trauma:true
  records flat. FAIL if stored tag mutates.
- **P564 yield/shift decorrelation (SHOULD):** profile with
  yield 0.6/shift 0.1 accepts presupposing accounts but does not
  flip answers under pure negative feedback; the inverse profile
  shows the reverse; a GSS-style two-stage probe recovers the
  two factors from behavior.
- **P565 intention completion (SHOULD):** routine intention
  records dwelled on without firing emit "did it" claims at
  ~intent_done_p·dwells; act-monitored encodings suppress to ~0;
  fired intentions re-fire at ~comm_err_p under fatigue.

## 64. Honest limits (Part V)

- **anchor_w is our composition** — Ross et al. show perseverance of
  impressions, not candidate-level incumbency; the ×1.5 weight is a
  modeling constant, the *phenomenon* is the citation. P555 pins the
  observable (order-dependent emission), not the mechanism.
- **Reversed-testing scope:** Chan et al. used immediate cued recall
  on witnessed events; generalizing test_window to all
  recall-then-account sequences is our extrapolation — the
  reconsolidation reading supports it, the literature hasn't priced
  it at autobiographical scale.
- **exp_fill timing is genuinely debated** — Brewer & Treyens'
  own five hypotheses can't fully separate encode vs retrieve; we
  take the integration/encoding reading because it alone explains
  first-recall phenomenology, but a retrieval-side reading is
  defensible and would move the same rate into §6.2.
- **ev_cred 0.95 is a ceiling guess** — the doctored-evidence
  studies give rates (50%, internalized-confession arms), not a
  credibility scalar; the ceiling is the claim, the number is ours.
- **Fiction penalty 0.5 is a midpoint** — Marsh et al. give
  adoption rates (35% vs 10%), not a discount factor; frame-
  sensitivity varies with warning explicitness (their later work
  shows warnings reduce but don't eliminate).
- **Genealogy (§6.81) is the most formalized-but-least-directly-
  measured rule in this part** — no study computes believe_p as a
  function of provenance trees; it's forced by source-monitoring
  logic and is the highest-value falsifiable target (P562).
- **Yield/shift is measured on interrogation** — generalizing the
  two-factor split to everyday rumor acceptance assumes
  interrogative and conversational suggestibility share the factor
  structure; plausible (same authors argue it), not proven.
- **intent_done sizes are lab-bound** — Albarracín's mundane-
  decision paradigm is the right shape for RW chores but young;
  comm_err ~25% is a lab cohort under specific cue conditions.


---
---

# PART VI (v66) — the residual channels: when it happened,
# whose hands did it, the dream, and the guards nobody posted

**Scope:** Parts I–V covered adoption (misinformation, conformity,
correction), minting (phantoms, implants, claims, coerced answers,
intentions, schema-fills), attribution (source inference,
cryptomnesia, evidence), and the belief layer. What remains is the
set of channels that distort records *without any second voice* and
without imagination: the calendar itself (§66), other people's
bodies (§67), sleep's own content (§68), and the two retrieval-side
guards — one that humans actually carry (§69 distinctiveness), one
that fires silently at ingest (§71 detection) — plus the fluency
channel that makes strangers familiar (§70) and the trait that
feeds all the imagery channels (§72). Six new spec sections
(§6.116–6.121), +17 params, 5 locked nulls, probes P687–P696.

## 65. What Parts I–V left unmodeled

1. **`day` fields decay but never *err*.** §5.63 covers order
   estimation and the model stores `day` as a decaying scalar —
   but real date recall is *biased*, not just noisy: events migrate
   toward the middle of the recall window, toward round dates, and
   toward landmark anchors, and the bias has a measured slope
   (~0.4 days of error per day of delay; Rubin & Baddeley 1989).
   A character who is merely *uncertain* about a date is wrong in
   a different way than a human, who is *systematically* wrong.
2. **Watching is treated as perception, not simulation.** The
   model knows `witnessed` vs `enacted` (§4.32b) — but watching a
   housemate do a thing is action simulation, and the literature
   says it plants "I did it" memories even under warning
   (Lindner et al. 2010). Unmodeled.
3. **Dreams have no source channel.** v5.1 noted dream content
   biases; but dream→reality confusion — a documented, survey-
   measurable false-memory channel correlated with dissociation
   (Rassin, Merckelbach & Spaan 2001; Mazzoni & Loftus 1996) —
   has no provenance to hang on.
4. **The guards are asymmetric.** We model warning (`warned`),
   dispute (`disputed`), and correction (`retract_p`) — all
   *externally supplied* resistance. Humans also resist with
   *internally supplied* scrutiny: the distinctiveness heuristic
   (demand vivid detail or reject — Schacter, Israel & Racine
   1999) and silent discrepancy detection (Tousignant, Hall &
   Loftus 1986) — the latter is the mediating variable the whole
   misinformation literature converges on, and our §6.3 has no
   slot for it.
5. **Fluency without a record misattributes.** `hearCount` pumps
   believe_p, but bare name-familiarity with *no* episodic
   record still does work in humans — it surfaces as "they're
   somebody" or "we've met" (Jacoby, Kelley, Brown & Jasechko
   1989). PersonModel familiarity currently dead-ends.
6. **Imagery ability is a proven moderator we never traited.**
   Imagination inflation scales with imagery ability
   (Horselenberg et al. 2000); high imagers are *worse* at
   source discrimination (Dobson & Markham 1993). The model's
   imagination channels have no per-character gain knob.

## 66. The calendar lies — telescoping and landmark dating

**[CONSENSUS on error growth and boundary pull; the existence of a
signed "forward telescoping" bias beyond boundary+guessing
artifacts is DEBATED — the honest model is unbiased error +
bounded pull, which produces apparent telescoping for free.]**

- **Rubin & Baddeley 1989** (*J. Exp. Psychol.: General* 118 —
  colloquium dating): dating-error magnitude grows ~**0.4 days
  per day of delay**; error direction is toward the **middle of
  the recall interval**; apparent "telescoping" falls out of
  retention + bounded errors + the impossibility of intruding
  from the future. Their model needs no systematic bias term.
- **Thompson, Skowronski & Lee 1988** (diary method, exact dates):
  substantial telescoping from **~8 weeks** out; slight,
  unreliable *time-expansion* (dated-older) for recent events;
  not explained by memory clarity or guessing.
- **Boundary effects** (Lee & Brown 2003; Huttenlocher, Hedges &
  Prohaska 1988/1990 hierarchical model): estimates regress
  toward the middle of the *elicited window* — change the
  question's bounds and the bias direction follows the bounds,
  not the event. Guessing contributes to backward telescoping;
  forward telescoping survives guess-removal — two mechanisms,
  not one.
- **Coarse beats fine** (Friedman 1993 line): when the exact date
  is lost, season, month, day-of-week and time-of-day survive
  much better — temporal knowledge is hierarchical, not a point
  estimate that blurs.
- **Landmarks anchor** (Shum 1998 review; Loftus & Marburger
  1983 — eruption-date anchoring): personally salient events
  serve as reference points; events dated relative to a landmark
  show smaller errors — the anchor supplies the bound.

**Spec consequence (new §6.116 — `whenEstimate` operator):**
`day` fields stop being point scalars at retrieval. On any
emission or comparison that reads the day:

```
day_err ~ N(0, tele_slope·Δ) , Δ = days since the record's true day
        (tele_slope ≈ 0.4 — Rubin & Baddeley, per-day error growth)
reported = true_day + day_err
        + mid_pull·(midpoint(elicitWindow) − true_day)
            · (1 − dayConf)            // Huttenlocher bound pull
        + round_bias·(nearestRound(reported) − reported)
            · (1 − dayConf)            // weekend/holiday/hour prototypes
        + landmark_pull·(nearestLandmark.day − true_day)
            · (1 − dayConf)            // landmark anchoring, capped
dayConf = verbatim survival of the `day` field (weak = drifts more)
Coarse fields (season, month, weekday, tod) decay as SEPARATE
  coarse-grained fields at ~0.4× the day field's decay —
  a character loses "March 14th" while keeping "early spring."
teles_when_immune (§6.111) exempts the hot record's own `when`
  from mid_pull/landmark_pull (Palombo 2021) — not from noise.
LOCKED: order of two records both within landmark_pull range of
  REAL landmarks is preserved (order_preserve_null) — telescoping
  shifts estimates, it does not permute anchored sequences.
```

Apparent forward-telescoping now emerges for remote events
(bounded errors + future-side floor) — we implement the
*mechanism* the best-supported model proposes, not a signed
drift hack.

## 67. Watching is half of doing — observation inflation

- **Lindner, Echterhoff, Davidson & Brand 2010** (*Psych. Sci.*
  21:1291): participants who merely *watched a video* of another
  person performing simple actions later showed robust false
  memories of **having performed those actions themselves** —
  persisting despite explicit warnings immediately before test
  and despite removal of sensory overlap. The authors' account is
  interpersonal **motor simulation**, not ordinary source
  monitoring — which is exactly why warnings fail.
- **Lindner & Davidson 2013** (*Aging, Neuropsych. & Cogn.*):
  false action memories in older adults relate to executive
  function — the age leg rides `discrim_mult`.
- Fits the enacted/observed split §4.32b introduced: `enacted`
  and observed records share motor content; the difference lives
  in the provenance tag, which decays.

**Spec consequence (new §6.117):** an `observedAction` record
(Event tag `observed_action:true` — the world tags routine
co-present actions: watched a housemate cook, fix, clean) is
written with `enacted:false`, provenance `witnessed`, but gets a
**motor-content bonus** `obs_inflate_gain` (0.35) on the action
field's verbatim strength — simulation is real encoding. The
flip: when the observation record's source decays below 0.3
(§6.4) AND the action is self-plausible (schema fit, routine),
the record's agency field may rewrite `actor:self` at
`obs_flip_mult`·source_confuse_flip per check — **warnings do
not apply** (locked `obs_warn_resist`: warn_mult is bypassed on
this channel, Lindner Exp. 3). Flip rate ×`discrim_mult` for
age. The result: a character can come to "remember" having done
the chore they only watched — cheap, common, and a ready-made
gaslight vector for the rumor layer.

## 68. The dream leaks — dream-reality confusion

- **Rassin, Merckelbach & Spaan 2001** (*J. Nerv. Ment. Dis.*
  189:478): a nontrivial minority — **11.8% and 25.9%** across
  two general samples — report having confused dream content
  with reality; reporters score higher on dissociation and
  fantasy proneness.
- **Mazzoni & Loftus 1996** (*Conscious. Cogn.* 5:442): dream
  content can be implanted→recalled as real in a suggestion
  paradigm; the dream is a *manufacturable* false source.
- **Kemp, Burt & Sheen 2003** (*Appl. Cogn. Psychol.* 17:577):
  dreamt vs actual experiences carry distinguishable
  phenomenology (dreams thinner on sensory/contextual detail) —
  the reality-monitoring features are there, just weak.
- Clinical extreme: **Wamsley et al. 2014** (*Sleep* 37:419) —
  narcolepsy "dream delusions," sustained false beliefs from
  vivid dreams; the population channel writ pathological.
- **[CONSENSUS the confusion exists and correlates with
  dissociation/absorption; rate and mechanism thin — treat as
  small-channel.]**

**Spec consequence (new §6.118):** new provenance
`source.kind:"dream"`. The world's dream system (or a scripted
`dreamEvent` op) mints records at `dream_strength` (0.15) —
real records, low strength, schema-loose verbatim. Reality-
monitoring features are thin by construction (Kemp et al.), so
the §6.9 flip gate applies with a trait-scaled rate:
`dream_flip_mult` (0.5) · source_confuse_flip, ×(1 +
dissoc)·(1 + fantasy/2) — the Rassin correlate set already lives
in the trait vector. **Locked `dream_content_null`:** the flip
moves the provenance tag only; dreaming about an event can
become "it happened" but cannot mint new verbatim fields — the
dream contributes existence, not detail (confab §6.2 may still
fill afterward on its own rules). Plausibility gate (§5) still
applies — a flying dream doesn't flip (Pezdek).

## 69. Demand the detail — the distinctiveness heuristic

- **Schacter, Israel & Racine 1999** (*JML* 40:1): false
  recognition of semantic associates collapses when items were
  encoded in a distinctive format (pictures) — because subjects
  adopt a response mode demanding **diagnostic recollection**:
  "if I'd really seen it, I'd remember the picture." When the
  encoding manipulation makes the expectation useless, the
  suppression vanishes — it's a retrieval *strategy*, not an
  encoding effect.
- **Gallo, Cendan, Dodson et al. / Gallo 2006** (*Memory*
  14:730): two recollection-based monitors — the distinctiveness
  heuristic AND recall-to-reject; older adults deploy both when
  the encoding supports them — the guard is available to old
  characters *if* their encoding was distinctive.
- **Koutstaal & Schacter 1999**: retrieval scrutiny reduces
  gist-false recognition in older adults but never erases the
  age gap — the guard is weaker, not absent.

**Spec consequence (new §6.119):** retrieval posture flag
`demand_detail:true` (caller-set: cross-examination, a pedant
character, any context where the character *expects* vivid
recall). Under it:

```
phantomize (§6.8) and lure endorsement pay:
   endorse_mult = 1 − distinct_expect·distinctiveness(encoding)
where distinctiveness(encoding) = fraction of the record's
  channels that would have carried diagnostic verbatim
  (was the event SEEABLE in detail? an attended face-to-face
  scene: high; an overheard summary: ~0 — you can't demand a
  picture of a rumor)
distinct_expect ≈ 0.5 baseline; ×1.2 for `checker` trait;
  falls to ×(1 − distinct_age_loss·age_eff/80) when the record's
  own encoding was gist-dominant (the heuristic needs a
  distinctive encoding to lean on — Schacter 1999 Exp. 2 gate)
```

This gives the cautious character a *usable* defense — and
correctly makes it useless against false memories for content
that never had a distinctive encoding to expect.

## 70. Familiar means known — fluency misattribution to persons

- **Jacoby, Kelley, Brown & Jasechko 1989** (*JPSP* 56:326):
  nonfamous names read once are judged **famous 24h later** —
  but not immediately. Familiarity survives; recollection of the
  source doesn't; fluent processing is misattributed to
  prominence. The delayed-only signature is the design: the flip
  needs source decay, exactly like §6.9/§6.10.
- **Jacoby, Woloshyn & Kelley 1989**: dividing attention at test
  increases the effect — familiarity operates when recollection
  is suppressed.

**Spec consequence (new §6.120):** PersonModel gains an implicit
`nameFluency` accumulator — every name exposure (heard, seen,
gossiped) adds `hearCount`-style increments *independent of any
episodic record*. When `nameFluency > fame_thresh` (0.4) AND no
live episodic record explains the familiarity:

```
P(attribute "known person / public figure") = fame_p (0.12)
  — scaled ×(1 + hearCount saturation) and ×(1 + divided-attention
    state penalty)
P(attribute "we've met / acquaintance") = acquaint_p (0.10)
  — only when the person is place-consistent (same street, same
    circle — the schema-plausible resolution of unexplained
    familiarity); stronger than fame_p for neighborhood-scale
    names, weaker for distant ones
LOCKED `fame_episode_null`: unexplained familiarity emits a
  relational/feeling attribution ONLY — it never mints a shared
  episode record. "I'm sure I know them" is the ceiling;
  fabricating the meeting is §6.2/§6.8's job on its own gates.
```

The rumor layer's repetition channel now has a person-level
expression: a name repeated enough becomes a *somebody*, which
is exactly how ambient NPCs should acquire unearned reputations.

## 71. Silent detection — the guard at ingest

- **Tousignant, Hall & Loftus 1986** (*Mem. & Cogn.* 14:329,
  N=570 across 4 exps): slower, more scrutinizing readers detect
  discrepancies between their memory and postevent narratives;
  **detected discrepancies resist misinformation** — detection
  is the mediating variable that explains warning, interval, and
  blatancy effects across the literature.
- **Recollection rejection** (Chan's group, *Appl. Cogn.
  Psychol.* 2017): subjects spontaneously reject contradictory
  misinformation by recollecting the original — more for
  contradictory than additive content, decaying with the
  event→misinformation delay.
- **RES qualification** (2017 *Memory* line): retrieval-enhanced
  suggestibility accrues only to those who *failed to detect*
  discrepancies — detection status, not the act of recall,
  carries the risk.

**Spec consequence (new §6.121 — detection gate inside
hearAccount, before p_adopt):** when the account conflicts with
a surviving verbatim candidate on the same field:

```
detect_p = detect_gain (0.5)
         · verbatimStrength(field)         // nothing to compare → no detect
         · scrutiny                         // read-time proxy:
                                            // warned? ×1.4; rushed ×0.6;
                                            // checker trait ×1.2
         · (contradictory ? 1 : 0.5)        // additive content half-detects
if detected → this exposure pays dispute_mult (same ~0.05 floor
  as a spoken dispute — silently); emit `noticed_discrepancy` to
  the dialogue layer (available as a suspicion tell)
LOCKED `detect_boost_null`: detection does NOT strengthen the
  original candidate — it suppresses adoption only (no study
  shows noticing protects the original's subsequent decay;
  keep the survival machinery honest)
```

This subsumes §1's retention-interval result *mechanistically*:
long delay → weak verbatim → nothing to detect against →
susceptible. `warned` now has two teeth — the warn_mult leg
(external) and the doubled scrutiny leg (internal).

## 72. The vivid imager — `imagery` loads the imagination stack

- **Horselenberg et al. 2000** (*Appl. Cogn. Psychol.* —
  Maastricht): imagery ability is the one personality measure
  that predicted imagination inflation — better imagers inflate
  more. Dissociation predicts in some paradigms (Heaps & Nash
  1999 — DES scores predicted inflation in N=94).
- **Dobson & Markham 1993** (*Brit. J. Psychol.* 84): high
  imagers were *worse* at discriminating which of two external
  sources produced an item — vivid internal generation blurs the
  external/external boundary too.
- Marks 1993 reality-monitoring line: vividness interacts with
  the perceived/imagined frequency judgment — the mechanistic
  substrate.

**Spec consequence:** new IndivTraits entry `imagery` ∈ N(0,1),
loading: `imagine_gain` ×(1 + 0.5·imagery), verbatim richness of
imagined/claimed/dream records +0.3·imagery (so high imagers
cross `rm_rich_thresh` sooner), `source_confuse` and
`dream_flip_mult` ×(1 + 0.4·imagery), §6.10 external-external
confusion +0.3·imagery (Dobson & Markham). `fantasy` and
`dissoc` keep their own legs (dream channel §68, §6.9 rate).
RW payoff: the daydreaming poet and the concrete-minded clerk
now differ on every self-authored false-memory channel, not just
in prose style.

## 73. Spec changes in v5.14 (summary)

- **§6.116** `whenEstimate` — day-field reconstruction with
  noise growth, window/midpoint pull, rounding pull, landmark
  anchoring, coarse-field preservation. `order_preserve_null`
  locked.
- **§6.117** `observedAction` — motor-simulation encoding bonus
  + agency-field flip; `obs_warn_resist` locked (warnings don't
  apply).
- **§6.118** `source.kind:"dream"` — dream provenance, trait-
  scaled flip, `dream_content_null` locked.
- **§6.119** `demand_detail` posture + `distinct_expect` —
  endorsement suppression scaled by encoding distinctiveness.
- **§6.120** `nameFluency` — unexplained-familiarity
  attributions (fame/acquaintance); `fame_episode_null` locked.
- **§6.121** detection gate in `hearAccount` — silent
  discrepancy detection suppresses adoption;
  `detect_boost_null` locked.
- **§7** +17 params, +1 trait (`imagery`), +5 locked nulls.
- **§10** contract: `observed_action` event tag, `dreamEvent`
  op, `demand_detail` retrieval flag, `noticed_discrepancy`
  emission, `whenEstimate` op, PersonModel `nameFluency`.

## 74. Parameter guidance and probes

| param | default | meaning |
|---|---|---|
| tele_slope | 0.4 | day-error σ growth per day of delay (R&B 1989) |
| mid_pull | 0.15 | pull toward elicited-window midpoint |
| round_bias | 0.1 | pull toward round dates/times |
| landmark_pull | 0.3 | pull toward nearest landmark day |
| coarse_when_mult | 0.4 | decay mult on season/month/weekday fields |
| obs_inflate_gain | 0.35 | observed-action motor encoding bonus |
| obs_flip_mult | 1.0 | agency flip rate mult on source_confuse_flip |
| obs_warn_resist | — | LOCKED: warn_mult bypassed on obs flips |
| dream_strength | 0.15 | dream-record encoding strength |
| dream_flip_mult | 0.5 | dream→witnessed flip scaling |
| dream_content_null | — | LOCKED: flip moves provenance only |
| distinct_expect | 0.5 | endorsement suppression under demand_detail |
| distinct_age_loss | 0.5 | age penalty when encoding gist-dominant |
| fame_thresh | 0.4 | nameFluency needed for attribution attempt |
| fame_p / acquaint_p | 0.12 / 0.10 | attribution emission rates |
| fame_episode_null | — | LOCKED: no shared-episode mint from fluency |
| detect_gain | 0.5 | base detection probability |
| detect_boost_null | — | LOCKED: detection doesn't strengthen original |
| order_preserve_null | — | LOCKED: anchored sequences never permute |

- **P687 telescoping (MUST):** date estimates on records at
  Δ∈{7,30,90,180}d — error σ must grow ≈linearly (slope
  ~0.3–0.5); remote events show net forward bias inside a
  bounded window; direction flips with the elicited window's
  midpoint, not the event (Huttenlocher signature).
- **P688 landmark anchoring (MUST):** matched records, one
  within landmark_pull range of a landmark, one not — anchored
  error smaller; landmark's own day exempt mid/landmark pulls.
- **P689 coarse preservation (MUST):** records whose dayConf has
  collapsed still answer season/month correctly ≥2× more often
  than exact day — coarse fields outlive fine ones.
- **P690 order preservation (MUST — locked null):** two records
  each landmarked — reported days may err but the emitted ORDER
  never inverts. FAIL on permutation.
- **P691 observation inflation (MUST):** `observed_action` on a
  routine partner action, decayed past source thresh → some
  profiles emit actor:self; `warned` context does NOT suppress
  it (obs_warn_resist); flip scales with discrim_mult.
- **P692 dream channel (MUST):** dreamEvent mints source.dream
  at dream_strength; flips only via decay gate, rate ∝ dissoc/
  fantasy/imagery; verbatim field count identical pre/post flip
  (dream_content_null); implausible dream never flips.
- **P693 distinctiveness heuristic (MUST):** same lure, recall
  with vs without demand_detail — endorsement suppressed ∝
  distinct_expect ONLY when the record had distinctive encoding
  channels; gist-only encodings show no protection at any age.
- **P694 false familiarity (SHOULD):** name seen/heard 6×, no
  episodic record → fame/acquaintance attributions emerge;
  NEVER a shared-episode record (fame_episode_null);
  place-inconsistent names skew fame_p.
- **P695 silent detection (MUST):** conflicting account vs
  surviving verbatim — adoption ≈dispute_mult without any
  `disputed` flag; verbatim candidate strength identical
  pre/post detection (detect_boost_null); weak-verbatim arm
  detects rarely.
- **P696 imagery trait (SHOULD):** imagineEvent×5 on imagery
  ±1.5σ profiles — high arm reaches rm_rich_thresh and flips;
  low arm doesn't; source_confuse scales similarly.

## 75. Honest limits (Part VI)

- **Telescoping mechanism is deliberately conservative** — we
  implement the Rubin & Baddeley bounded-error account, which
  produces apparent telescoping without a signed bias. If a
  probe demands a *residual* forward bias beyond boundary
  effects (some news-event studies claim one), `mid_pull` has
  room — but the burden of proof is on the bias, per the
  boundary-model literature.
- **Observation inflation's mechanism is simulation, not source
  confusion** — we implement it through the existing
  provenance-decay gate (which IS a source-monitoring account)
  plus the locked warning-resistance. A purist reading wants a
  separate motor-merge channel; ours is the cheaper
  approximation that reproduces both observable signatures
  (warning-immune, discrim_mult-scaled).
- **Dream→reality rates are survey numbers** (11.8%/25.9%
  lifetime endorsement — people who *report having experienced
  it*), not per-dream flip rates; our `dream_flip_mult` 0.5 is a
  conservative guess scaled by the right traits.
- **Distinctiveness heuristic needs `distinctiveness(encoding)`**
  — a derived quantity the substrate must approximate from
  channel coverage; characters encoding mostly gist can't lean
  on the guard, which is the intended failure mode (Koutstaal
  & Schacter's residual gap).
- **False fame is name-level** — Jacoby's effect is on *names*,
  not faces or people-in-context; extending it to `acquaint_p`
  ("we've met") is our neighborhood-scale extrapolation, gated
  on place-consistency to keep it bounded.
- **Detection's scrutiny proxy** (warned ×1.4, rushed ×0.6,
  checker ×1.2) is assembled from Tousignant's reading-time
  result — a fair mechanization, but the multipliers are ours.
