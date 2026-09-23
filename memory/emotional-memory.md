# Emotional Memory v5 — affect and memory, calibrated

**Track:** memory-research (sf/memory) · **Date:** 2026-09-23
**Companion to:** `memory-model-spec.md` (drives spec v0.5),
`human-memory-research.md` R§5, `character-memory-profiles.md`.
**Scope:** how emotion changes what gets in, what survives, what comes back,
and what gets *felt* — the four places the prior spec treated arousal as a
single scalar (`w_emo`, `arousal_narrowing`, `floor`, `neg_affect_decay`).
This doc splits each of those into its real mechanisms and quantifies them.
Tag convention unchanged: **[CONSENSUS] / [DEBATED] / [HYPOTHESIS]**.

**Status flags:** sections 1–8 derive from literature; §9 lists what
changed in the spec; §10 adds knot guidance; §11 probes P31–P38; §12 honest
limits.

---

## 0. What the v0–v4 model already does (and where it was thin)

The spec had four emotional hooks:

- `w_emo·arousal` — a *linear* encoding boost (§2).
- `arousal_narrowing` — peripheral verbatim fields thinned at birth (§2).
- `floor = 0.05·arousal` — emotional records asymptote above zero (§4.1).
- `neg_affect_decay` — negative affect fades ~1.3× faster (§4.5).
- Trauma modifier + intrusion-threshold discount (§5.7, profiles §2).

What's missing, and this version adds:

1. The emotional advantage is **time-dependent** — it grows over delay via
   consolidation, not a birth-time scalar (§1).
2. Arousal is **competitive, not just narrowing** — it *boosts* central
   content while suppressing peripheral *and temporally adjacent neutral*
   content (§2).
3. **Valence splits fidelity**: negative → verbatim-accurate, positive →
   gist-prone (§3). Emotion does not uniformly distort.
4. Stress **helps consolidation but hurts retrieval** — opposite signs at
   different phases, and timing-dependent (§4).
5. Emotional **confidence is uncoupled from accuracy** by a mechanism
   (amygdala-based recollection feeling), not just a bias note (§5).
6. **Conditioned affect** needs real dynamics: acquisition, slow decay,
   extinction-as-new-learning, renewal, spontaneous recovery (§6).
7. **Trauma-tagged records** need a record-level phenotype: hyper-consolidated
   core, fragmented temporal/contextual frame, intrusive, misinfo-resistant
   core (§7).
8. **Mood bleeds into reconstruction**, not only into which records surface
   (§8) — the same event is retold darker on a bad day.
9. Aging: emotional enhancement is **preserved** — `w_emo` must NOT sit on
   the decline curve; positivity splits are already parameterized (§10).

---

## 1. The emotional advantage is bought at consolidation, not at birth

The amygdala-modulation account (McGaugh 2000, 2004; Cahill & McGaugh 1998 —
propranolol abolishes the emotional-memory advantage) predicts the
enhancement should **grow with delay**, because consolidation takes time.
That is what the data show:

- Sharot & Phelps 2004 (also Sharot & Yonelinas 2008): arousal-related
  recognition advantage emerges at 24h delay, minimal at immediate test.
- LaBar & Phelps 1998: advantage grows from immediate to 1h.
- Ritchey et al. 2008 (Neuron): recollection persistence (long/short delay
  ratio) greater for emotional items; amygdala–MTL connectivity at encoding
  predicts persistence over a week. Emotional advantage reported up to 1 year
  (Dolcos et al. 2005).
- Sharot, Delgado & Phelps 2004 (Nat. Neurosci.): "remember" judgments
  boosted for emotional items **without accuracy improvement** — the feeling
  of remembering rides on amygdala/perceptual fluency, not detail recovery.
  (Mechanistic basis for §5's confidence split.)

**[CONSENSUS]** that the enhancement is consolidation-driven and grows with
delay; **[DEBATED]** which sleep stage carries it (REM-emotional link
contested — see R§2); nap data show preferential consolidation of emotional
items over a sleep episode (Nishida et al. 2009; Payne & Kensinger 2011).

**Spec consequence (new §2 "selective consolidation bonus"):** the arousal
term in `E` buys *some* immediate strength, but most of the emotional
advantage lands at the first sleep tick:

```
at encode:        E unchanged (w_emo·arousal stays — attentional component)
at first sleep:   strength += emo_consol_gain · arousal · (1 − strength)
                  // emo_consol_gain ≈ 0.25, episodic records only
```

This is additive with `sleepFactor`/`sws_mult` (§2 sleep modifier), not a
replacement: SWS-scaled consolidation is the *episodic* substrate;
`emo_consol_gain` is the *amygdala-selective* bonus on top. Net emergent
behavior: two equally-encoded events part ways after the first night — the
emotional one is preserved, the neutral one isn't. This replaces part of the
birth-time boost's work, and it is falsifiable (P31).

---

## 2. Arousal-biased competition — central wins, neighbors lose

### 2.1 Within the event: central vs peripheral (upgrade to `arousal_narrowing`)

Mather & Sutherland 2011 (**arousal-biased competition**, ABC): arousal
amplifies whatever is already winning the representational competition —
high-priority content (goal-relevant, perceptually salient, attended) is
encoded *better* under arousal, low-priority content worse. Not a uniform
narrowing: central details of emotional scenes are remembered *better* than
their neutral counterparts (Kensinger, Garoff-Eaton & Schacter 2006;
Christianson & Loftus 1991). **[CONSENSUS effect; mechanism is a theory but
well-supported]**

**Spec consequence:** replace the one-sided `peripheralLoss` with a
reallocation at encoding:

```
for each verbatim/cueVector field f:
    priority(f) = attention·(selfRelevance if person/topic matches goal)
                  → fields sorted into central (top ~40%) vs peripheral
central fields:    strength_f *= (1 + abc_gain·arousal)      // abc_gain≈0.25
peripheral fields: strength_f *= (1 − arousal_narrowing·arousal)   // as before
```

`w_emo_pos`/`w_emo_neg` (v0.3) still scale the arousal entering this
computation.

### 2.2 Between events: the emotional blink (NEW)

Arousing items impair memory for **temporally adjacent neutral items** —
retrograde (E−1) and anterograde (E+1) amnesia (Strange, Hurlemann & Dolan
2003 — an amygdala- and β-adrenergic-dependent retrograde amnesia, reversed
by propranolol; Hurlemann et al. 2005; Mather 2007 review; list studies show
effects across 3–6s spacing, i.e. it is an encoding-window effect, not a
mood effect). The flip side: items that *predict* an emotional event can be
enhanced after a week delay (Knight & Mather 2009 reconciliation — the
impairment hits items *overshadowed at encoding*, enhancement hits
predictive/attended items). **[CONSENSUS for impairment near arousal onset;
DEBATED boundary conditions — predictive E−1 items can be enhanced]**

**Spec consequence (new §2 operator, the "emotional blink"):** when an event
encodes with `arousal ≥ emo_blink_thresh` (0.7):

```
for records/events within ±emo_blink_window (0.03 day ≈ 45 min sim-time):
    if the neighbor is NOT predictive of the emotional event
       (no shared cueVector people/topic/place fields):
        neighbor.encodingE *= (1 − emo_blink_loss)   // ≈0.3
```

The predictiveness carve-out is the Knight & Mather reconciliation made
literal: the waiter who warned you the plate was hot benefits; the ambient
conversation happening beside the argument dies. Tune `emo_blink_window` to
sim-tick granularity (one tick ≈ tens of minutes is right; the lab effect is
seconds but in-sim events are sparser — the window means "same scene"). (P32)

### 2.3 Retrograde enhancement (post-encoding stress)

Post-learning arousal enhances consolidation of *preceding* material —
adrenaline/cortisol arrive after the event and strengthen its consolidation
(Cahill, Gorski & Le 2003 — cold-pressor after learning; McGaugh's classic
post-training literature). **[CONSENSUS]** This is the friendly twin of §2.2:
the blink impairs *competitors*, retrograde stress enhances the *same
stream's* just-encoded records when the stressor is congruent with them.

**Spec consequence:** at the sleep tick, records created within
`post_stress_window` (0.05 day) before a same-day event with
`arousal ≥ emo_blink_thresh` AND sharing ≥1 cue field with it receive
`strength += post_stress_gain·(1−strength)` (≈0.15). A character forgets
what happened *next to* the fight but remembers what *led to* it. (P33)

---

## 3. Valence splits fidelity — negative is veridical, positive is gist

The single most decision-relevant asymmetry for RW:

- Kensinger & Schacter 2006 (Red Sox/Yankees): fans of the *losing* side
  had more accurate, detail-rich memories of the same game; winners'
  memories were more reconstructed.
- Kensinger 2007 (Curr. Dir. review): negative emotion enhances both
  subjective vividness AND objective detail for item-linked details;
  engagement of sensory (fusiform) processing at encoding.
- Kensinger & Corkin 2004 (PNAS): two routes — arousal route (amygdala-
  dependent, valence-blind) vs valence route.
- Positive affect → more conceptual/gist processing → **more gist-based
  false memory** (Storbeck & Clore 2005 — positive mood increases DRM
  false recall; Booker et al. 2021 — negative pictures elevated true AND
  gist-false memory while impairing verbatim). **[CONSENSUS direction;
  the Booker result complicates "negative = verbatim" — negative valence
  also boosts gist familiarity. We model: negative → detail+accuracy on
  the *encoded* core, positive → gist-fluent but drift-prone. DEBATED
  edge: negative valence can also raise false-alarm gist familiarity.]
- Aging: both age groups show enhanced specific recognition for negative
  objects; **only** older adults additionally gain general recognition for
  positive objects (Kensinger et al. 2007, J. Gerontol.) — positivity
  effect rides the gist channel, which is exactly what `pos_spare` and
  `w_emo_pos` already capture.

**Spec consequence (§6 hooks, new valence-conditioned distortion):**

```
on drift (§6.1):     drift_p_eff = drift_p · (valence < −0.3 ? neg_fidelity
                                             : valence > 0.3 ? pos_gist_drift : 1)
                     neg_fidelity ≈ 0.85 · pos_gist_drift ≈ 1.15
on confab (§6.2):    confab_fill_eff = confab_fill · (valence > 0.3 ? pos_gist_drift : 1)
on misinfo (§6.3):   for valence < −0.3 AND arousal > 0.6 records, core
                     fields (who/what/where) get p_adopt *= neg_core_resist (0.7)
                     — reality-monitoring advantage of negative detail
                     (Kensinger & Schacter 2006 reality-monitoring study)
```

Emergent: grievances are remembered *precisely* (and meanly — with intact
detail), celebrations *warmly but wrong*. Positive stories drift toward the
schema of "a good night"; negative ones keep the knife. (P34)

---

## 4. Stress timing — consolidation ↑, retrieval ↓, encoding is wave-dependent

The glucocorticoid literature resolves the apparent contradiction "stress
helps and hurts memory" into **timing** (Joëls et al. 2006/2011 three-wave
model; Diamond et al. 2007):

- Wave 1 (seconds): noradrenaline — enhances encoding of the stressor
  (the amygdala route, §1).
- Wave 2 (~minutes): rapid cortisol — impairs encoding of *unrelated*
  material, enhances stressor-relevant material.
- Wave 3 (~hour+, genomic cortisol): suppresses new encoding, but
  consolidates.
- **Retrieval**: stress/glucocorticoids *impair* retrieval of well-learned
  material (de Quervain, Roozendaal & McGaugh 1998, Nature — footshock
  30 min before test impairs, 2 min or 4 h does not; de Quervain et al.
  2000 — cortisone impairs human declarative retrieval; requires concurrent
  noradrenergic arousal — Roozendaal et al. 2004).
- **Consolidation**: same hormones *enhance* storage (Roozendaal 2000).

**[CONSENSUS]** — opposing signs at different phases are the established
resolution.

**Spec consequence:**

- §5.4 drive gains a **state stress term**: if the *retrieval context's*
  stress `C.stress > stress_retrieve_thresh` (0.6), apply
  `θ += stress_retrieve_loss·C.stress` (≈0.12). A panicked character can't
  retrieve what they know — and it hits *retrieval only*, never decay. The
  existing "high-stress job" modifier's `theta ×1.15` is the chronic-trait
  version of this same mechanism; the new term is the acute-state version.
- Wave-2 effect is already implemented by §2.2's blink (impairment of
  unrelated neighbors) — no new parameter needed; note the mapping.
- Wave-3 suppression: a character in a sustained high-stress day gets
  `enc_base *= (1 − chronic_encode_loss)` — already covered by the
  high-stress modifier (×0.85); no new param.

---

## 5. Emotional confidence is mechanically uncoupled from accuracy

Talarico & Rubin 2003 (9/11): flashbulb detail decays at ordinary rates —
only *confidence* stays high. Sharot et al. 2004 gives the mechanism:
emotional "remember" judgments ride amygdala-mediated fluency, not
parahippocampal detail recovery. **[CONSENSUS]**

**Spec consequence (§3 sharpening):**

```
at encode:   confidence = base_conf(E) + conf_emo_gain·arousal²
             // conf_emo_gain ≈ 0.15 — quadratic: only strong arousal
             // inflates felt certainty
floor:       if arousal ≥ flashbulb_thresh (0.85):
                 confidence never decays below flashbulb_conf_floor (0.9)
                 // accuracy still drifts normally — §6 operators apply
```

A character can be at `confidence 0.95, accuracy 0.4` *permanently* — the
flashbulb profile is now a floor, not just a boost. Retelling still adds
+0.05 (§3) so a much-told false story can pin at the 0.98 cap. (P35)

---

## 6. Conditioned affect — acquisition, extinction, renewal, recovery

The §1 schema already had a per-character conditioned-associations table
`{cue: {valence, arousal}}` (Bechara et al. 1995 split — affect survives the
episodic source). It had no dynamics. Conditioning literature supplies them:

- **Acquisition**: single-trial learning is normal for aversive cues —
  one bad event at a place creates a durable association.
- **Extinction is new learning, not erasure** (Bouton 2004 review; Bouton &
  Bolles 1979): extinction trials build a *competing, context-bound*
  inhibitory association. The original association remains.
- **Renewal**: change of context restores the response (Bouton & King 1983 —
  extinguished fear returns in the original/other context).
- **Spontaneous recovery**: extinguished responses partially return with the
  passage of time.
- **Reinstatement**: re-encountering the aversive outcome restores the
  extinguished response.

**[CONSENSUS — the most replicated framework in learning science]**

**Spec consequence (new §4.9, "Conditioned affect dynamics"):**

```json
CondEntry = { "cue": "mudhaus", "valence": -0.6, "arousal": 0.7,
              "strength": 0.5, "safeCount": 0, "lastFireDay": 500 }
```

- **Acquire**: at encoding, if `arousal ≥ cond_thresh` (0.6), each encoded
  cueVector field gets/updates an entry:
  `strength = min(1, strength + cond_gain·arousal)` (cond_gain≈0.5 —
  one-shot acquisition for high arousal).
- **Fire**: on ambient ticks and context construction, entries whose cue
  matches C contribute `C.affect += valence·strength` — dread at the doorway
  without the record (§1 schema note, now mechanical). Firing sets
  `lastFireDay`, used by recovery.
- **Decay**: `strength *= (1 − cond_decay)` daily, `cond_decay ≈ 0.005` —
  very slow (fear associations outlive their episodic sources).
- **Extinction**: when a cue fires but the day's episode is safe (no
  matching-arousal event), `safeCount++`; effective emitted strength is
  `strength·(1 − extinct_suppress·safeCount)` floored at 0.2·strength —
  suppression, never deletion.
- **Renewal**: the suppressor is context-bound — entries fired *in the
  extinction context* emit at reduced strength; in a *different* context the
  suppressor doesn't apply (implement: suppressor keyed to the place field
  dominant during safe exposures; `renewal` = suppression waived elsewhere).
- **Spontaneous recovery**: if an entry hasn't fired in `recovery_days`
  (30), `safeCount` decays by `recovery_frac` (0.5) — old fears come back
  after quiet months. (P37)
- **Reinstatement**: any new event with `arousal ≥ cond_thresh` and shared
  cue resets `safeCount = 0`.

This is the cheapest believable PTSD-adjacent and preference-formation
machinery available: a character avoids the bar where the fight happened,
warms to the park where the good summer happened, and neither needs the
episodic record to survive.

---

## 7. Trauma-tagged records — the record-level phenotype

v0 had a *character-level* trauma modifier. The literature phenotype is
*record-level* (Brewin et al. 1996 dual-representation: a sensory-bound,
intrusive trace + a fragmented verbally-accessible narrative; Berntsen &
Rubin's work on involuntary trauma memory). **[CONSENSUS on the
intrusive-core/fragmented-context split; DEBATED on details — and
"recovered repressed memories" remain discredited (Loftus 1993; McNally
2003): our trauma records never hide — they intrude]**

**Spec consequence:** records encoded with `arousal ≥ trauma_thresh` (0.9)
get `trauma: true` and a fixed phenotype:

```
decay:      floor := max(floor, trauma_floor)   // trauma_floor ≈ 0.30
            β unchanged — Talarico & Rubin discipline: they don't decay
            slower, they never go quiet
verbatim:   .when and ordering links encode at half strength
            (fragmented timeline — the event is vivid, its place in
            time is not)
retrieval:  intrusion_thresh −0.15 (§5.7 already) AND bypass
            plist_suppress (§5.8) — you cannot talk someone out of
            remembering parts of it by narrating other parts
misinfo:    core fields get neg_core_resist automatically (§3);
            peripheral fields adopt misinfo at NORMAL rate — the
            trauma core is solid, the frame is permeable
reconsolidation: each intrusion re-stamps emotional.arousal at
            ≥0.7 — intrusions rehearse the affect (why flashbacks
            don't fade: every resurfacing is a reconsolidation event
            that refreshes the affect tag, §5.9)
```

The character-level trauma modifier stays (it biases *encoding*); this adds
the *record* phenotype so a trauma history produces intrusions even after
the modifier's encoding effects are spent. (P36)

---

## 8. Mood bleeds into reconstruction

v0.2 split mood *congruence* (which records surface — `w_state`, event
valence × current mood) from mood *state-dependence* (encoder mood match,
`w_msd`). A third, smaller effect was missing: **current mood distorts the
reconstruction itself** — the same event is retold more negatively on a bad
day (mood-congruent recall biases content, not only selection; Bower 1981;
Matt, Vázquez & Campbell 1992 meta — mood-congruent effect d≈0.4 overall,
stronger under depressed mood; and retrospective affect reports are biased
by current mood). **[CONSENSUS direction; size modest]**

**Spec consequence (§5.5 addition):** returned reconstruction's emotional
tag is shifted toward current mood:

```
reported_valence = m.emotional.valence·(1 − mood_bleed)
                   + C.mood·mood_bleed        // mood_bleed ≈ 0.10
reported_arousal = m.emotional.arousal·(1 + mood_arousal_bleed·|C.mood|)
                   // arousal scaled up by strong current mood,
                   // mood_arousal_bleed ≈ 0.1 — feelings amplify feelings
```

Deliberately small: it biases the *telling*, not the stored tag (the stored
tag drifts only via §6 operators — repeated bad-mood retellings do slowly
drag it through reconsolidation drift, which is correct: a chronically
depressed character's memories genuinely darken over retellings).

**Rumination** (modifier update): rumination is *valence-selective
rehearsal* — depressed characters involuntarily re-encode negative records.
Implement as `retell_boost_eff = retell_boost·(1 + rumin_k·max(0,−valence))`
(rumin_k≈0.5) on the depressive/ruminative modifier — negative records get
rehearsed (strengthened, drifted) more; positive records get ordinary
rehearsal. Combined with `neg_affect_decay ×0.7` (modifier, existing) and
`specificity 0.4` this produces the full depressive memory phenotype:
negative, general, self-strengthening. (P38)

---

## 9. What changed in the spec (v0.4 → v0.5)

| § | Change |
|---|---|
| §2 | `peripheralLoss` → two-sided ABC reallocation (central `abc_gain`, peripheral `arousal_narrowing`); `trauma:true` tag at `arousal ≥ trauma_thresh`; `confidence` gains `conf_emo_gain·arousal²`; conditioned-affect acquisition (cond_thresh/cond_gain) |
| §2 new | emotional blink: neighbor `encodingE *= (1−emo_blink_loss)` within `emo_blink_window`, predictive neighbors exempt; retrograde `post_stress_gain` for same-stream neighbors at sleep tick |
| §2 sleep | selective consolidation: `strength += emo_consol_gain·arousal·(1−strength)` at first sleep tick (episodic only) |
| §3 | `flashbulb_conf_floor` for `arousal ≥ flashbulb_thresh` records |
| §4.1 | arousal ≥0.6 episodic records: gist β ×`emo_gist_beta` (0.85), verbatim k ×`emo_verbatim_k` (1.5) — emotional *gist* preserved, peripherals die even faster (memory narrowing over time) |
| §4.5 | affect tag decays as two components — valence at `neg_affect_decay` asymmetry (existing), arousal at `arousal_affect_decay` (1.4) — felt intensity quiets faster than felt sign |
| §4.9 NEW | conditioned-affect dynamics: acquire/fire/decay/extinction/renewal/spontaneous-recovery/reinstatement (Bouton) |
| §5.4 | `C.stress` retrieval penalty `θ += stress_retrieve_loss·C.stress` (de Quervain; retrieval-side only) |
| §5.5 | `mood_bleed`/`mood_arousal_bleed` on reported affect; trauma reconstruction drops `verbatim.when` |
| §5.7 | trauma-tagged records get the −0.15 intrusion discount as a record property (was modifier-only) |
| §5.8 | trauma-tagged records exempt from `plist_suppress` |
| §6.1/6.2/6.3 | valence-conditioned distortion: `neg_fidelity`, `pos_gist_drift`, `neg_core_resist` |
| §7 | +16 MemoryParams (all optional with defaults, backward-compatible) |
| §10 | `C.stress` optional field on cueContext; `conditionedAffect(charId, cue)` read hook; `hearAccount`/`discussEvent` unchanged |

---

## 10. Age-curve guidance (extends the knot tables)

Emotional memory is the *preserved* channel in aging — amygdala integrity
outlasts hippocampal (Kensinger et al. 2007: negative-specific enhancement
intact in older adults; general emotional enhancement preserved or
amplified):

- `w_emo`, `emo_consol_gain`, `abc_gain`, `conf_emo_gain`: **flat across
  age** — do NOT put them on the decline curve (enc_base declines, the
  arousal multiplier does not). This produces the observed pattern: older
  adults' memory advantage for emotional material is proportionally *larger*
  because the neutral baseline fell.
- `neg_fidelity`, `neg_core_resist`: flat — detail-vs-gist valence split
  holds in older adults (Kensinger et al. 2007).
- `pos_spare`, `w_emo_pos`/`w_emo_neg`: already carry the positivity effect
  (v0.3/v0.4) — older adults gain a *general* positive-memory advantage
  (Kensinger 2007), which `pos_gist_drift` interacts with correctly
  (positive records drift toward gist AND are preferred).
- `intrusion_thresh` trauma discount: unchanged with age (intrusive
  phenomena don't require youth), but older profiles' higher baseline
  `intrusion_thresh` partially offsets.
- Children: `emo_consol_gain` slightly higher (sleep is deeper and emotional
  memory consolidates strongly — Backhaus et al./pre-adolescent data are
  thinner; mark **[HYPOTHESIS]**, use +0.05).

---

## 11. Validation probes (P31–P38; continue P1–P30)

Falsifiable; same format as forgetting-curves.md §5. Each names a failure
condition that would invalidate the mechanism as implemented.

- **P31 consolidation-growth:** two events, identical except arousal 0.2 vs
  0.9. Pre-sleep strength ratio <1.3; after one sleep tick the ratio must
  exceed it by ≥20%, and the gap must keep widening over 7 days (aroused
  record decays from a higher post-consolidation base). FAIL if the
  advantage is constant from birth (means `emo_consol_gain` is not doing
  the work — Sharot & Phelps 2004 delay interaction).
- **P32 emotional blink:** neutral event at t−10min and t+10min around an
  arousal-0.9 event encodes ~30% weaker than control neighbors at t−3h,
  IF cue-unrelated. A *cue-related* preceding event must NOT be weakened
  (Knight & Mather predictive exception).
- **P33 retrograde enhancement:** neutral record followed within 30min by a
  same-topic arousing event → higher post-sleep strength than an
  identical record followed by a neutral event.
- **P34 valence fidelity split:** matched negative (valence −0.7, arousal
  0.6) vs positive (+0.7, 0.6) events; at day 20 the negative record must
  retain higher accuracy on core fields and resist a misinformation merge
  on `who`; the positive record must show more schema-consistent drift.
- **P35 flashbulb decoupling:** arousal-0.9 record at day 60 after several
  retellings: `confidence ≥ 0.9` while `accuracy ≤ 0.7` — certain and
  wrong, permanently (Talarico & Rubin 2003). FAIL if confidence decays
  with strength.
- **P36 trauma phenotype:** a trauma-tagged record must (a) surface via
  `ambientMemoryScan` at ≥3× the rate of a matched non-trauma record under
  a shared threat cue; (b) return gist with `verbatim.when` missing or
  drifted; (c) resist `hearAccount` overwrite of `who` but accept
  overwrite of peripheral fields; (d) never drop below `trauma_floor`.
- **P37 conditioned affect:** after one arousal-0.9 event at place P,
  `conditionedAffect(char, P)` returns a negative response for months
  after the episodic record archives; after 10 safe exposures at P the
  emitted strength attenuates ≥50% at P but NOT at a similar place Q
  (renewal); after 30 quiet days the P-response partially returns
  (spontaneous recovery ≥ `recovery_frac`).
- **P38 rumination loop:** two matched characters, one depressive
  (`rumin_k` on): after 30 days of identical event streams, the
  depressive character's negative records carry higher mean strength AND
  more retrievalCount than the control's, while positive records do not
  differ — valence-selective rehearsal, not blanket better memory.

---

## 12. Honest limits

- The **emotional blink window** is a scene-level mapping of a
  seconds-scale lab effect; 45min is a modeling choice. If sim ticks are
  coarse, shrink the window rather than raise the loss.
- **Booker et al. 2021** complicates the clean "negative = verbatim"
  story: negative valence boosts gist-familiarity false memory too. Our
  `neg_core_resist` protects *core* fields only; peripheral fields of
  negative records still adopt misinfo — consistent with both literatures,
  but the size of `pos_gist_drift` vs negative-gist-familiarity is a guess.
- The **arousal² confidence term** is a shaped choice; the data say
  "confidence high, accuracy normal," not a functional form.
- `arousal_affect_decay > valence decay` is **[HYPOTHESIS]** — affect
  literature measures valence-direction fading (FAB), not arousal
  half-life in memory tags; Verduyn's emotion-duration work is about
  episodes, not traces.
- Renewal/extinction context-binding is simplified to place-field keying;
  human renewal can key on any background context.
- Nothing here models *mood disorders' encoding* effects directly (e.g.,
  depression's encoding deficit) — only the retrieval/retention
  phenotype. If bibles need it, it's a `enc_base` modifier, not new
  machinery.

---

# Part II — v17: the affect-tag layer (2026-09-23, second pass)

Part I (v0.5) built the *record-level* machinery: consolidation bonus,
blink, valence-fidelity split, stress timing, conditioned affect, trauma
phenotype, mood bleed. Part II deepens what Part I left as scalars: **how
the emotional tag is born** (§13), **how it changes at sleep** (§14),
**the item-vs-context tradeoff generalized** (§15), **what retelling does
to feeling** (§16), **emotion-regulation personality** (§17),
**generalization of conditioned affect** (§18), **the self-boundary of
the fading affect bias** (§19), **contagion through hearsay** (§20),
**reconsolidation-window extinction** (§21), then spec delta (§22), age
guidance (§23), probes P154–P162 (§24), honest limits (§25).

Tag convention unchanged: **[CONSENSUS] / [DEBATED] / [HYPOTHESIS]**.

---

## 13. The affect tag is born by peak-end, not by mean

Part I took the event's `arousal`/`valence` fields as given. Inside an
episode, felt affect fluctuates; what survives into the summary tag is
not the integral. The peak-end literature:

- Kahneman, Fredrickson, Schreiber & Redelmeier 1993 (Psychol. Sci.,
  cold-pressor): remembered pain tracks peak + end intensity; duration
  is neglected — a longer trial ending less painfully is preferred.
- Redelmeier & Kahneman 1996 (Pain, colonoscopy): same result in a
  real medical episode — peak + end dominated retrospective ratings,
  duration essentially zero weight.
- Fredrickson & Kahneman 1993 (J. Pers. Soc. Psychol.): duration
  neglect formalized for affective episodes generally.
- Do, Rupert & Wolford 2008 (Psychon. Bull. Rev.): peak-end holds for
  real-world emotional episodes; the *end* component grows with delay.
- Kemp, Burt & Furneaux 2008: peak-end predicts affective forecasting
  errors — the tag is what gets consulted later.

**[CONSENSUS]** for the peak-end/duration-neglect pattern in
retrospective affect; **[DEBATED]** whether it is encoding or
reconstruction — we treat it as a *birth-time* tag-setting rule because
the sim needs a stored scalar, and the behavioral consequence
(retrospective judgment driven by peak+end) is identical.

**Spec consequence (§2, tag-setting — supersedes "event carries a
scalar"):** when `encodeEvent` receives an episode with an affect
trajectory (game-systems supplies `affectSeries` when available, else
the scalar as before):

```
arousal_tag  = peak_w·max_t(arousal) + end_w·arousal(final tick)
valence_tag  = peak_w·valence(peak_arousal tick) + end_w·valence(end)
duration enters NOWHERE in the tag — only via n_sim/interference
peak_w ≈ 0.55, end_w ≈ 0.45
```

Consequences the world gets for free: a bad evening rescued by a kind
last ten minutes *feels* kinder in memory than it deserved; a long
pleasant day and a short pleasant day leave the same tag (duration
neglect); endings are leverage — whoever controls the end of a scene
controls the tag. (P154)

---

## 14. Sleep quiets the feeling, not the story — probably

Walker & van der Helm 2009 (Psychol. Bull., "Overnight therapy?") —
the REM-sleep depotentiation hypothesis: sleep consolidates emotional
*content* while stripping the *affective tone*. Evidence pro: amygdala
reactivity to previously-shown emotional stimuli is reduced after
sleep/REM (van der Helm et al. 2011 Curr. Biol.); emotional memory
trade-off consolidates preferentially over sleep (Payne & Kensinger
2011). Evidence con: several failures to find affect stripping —
Wiesner et al. 2015; Groch et al. 2015; some datasets show arousal
preserved or even amplified by sleep. Meta-state: content
consolidation [CONSENSUS]; affect stripping [DEBATED — plausible,
unreplicated in clean form].

**Spec consequence (§2 sleep tick — small, flagged):**

```
at each sleep tick:  emotional.arousal *= (1 − sleep_affect_strip)
                     sleep_affect_strip ≈ 0.04, episodic records,
                     capped: arousal never drops below 0.15 by this path
exempt:              trauma:true records — §7's re-stamping and the
                     clinical fact that traumatic affect does NOT quiet
                     over sleep are the same modeling decision
```

Kept deliberately small (a ~4%/night creep, compounding to ~half the
felt heat over 17 nights) and separately toggleable — if future data
kill depotentiation, set 0. The everyday signature it produces is
correct either way: the fight from last month is remembered clearly
and doesn't hurt like it did. The valence tag is untouched —
`arousal_affect_decay` (v0.5) handles within-record decay; this term
is the *sleep-specific* channel. (P155)

---

## 15. Arousal buys the item and sells the context — generalizing §7

Part I gave trauma records a fragmented frame. The lab result is
graded, not thresholded:

- Kensinger & Schacter 2005 (NeuroImage): amygdala engagement at
  encoding predicts subsequent *item* memory but NOT context/source
  memory — the amygdala boosts "what" and lets "where/when/who-else"
  fall.
- Bisby & Burgess 2014 (Cereb. Cortex) / Bisby, Horner, Hørlyck &
  Burgess 2016: negative emotion reduces associative memory for items
  encountered together; context resistance manipulations.
- Madan, Caplan, Lau & Fujiwara 2012; Madan et al. 2017: arousal
  impairs *associative* memory while sparing or enhancing item memory —
  graded by arousal, not gated by a threshold.
- Rimmele, Davachi et al. 2011: emotion enhances item recognition,
  impairs source/context detail, same stimulus set.

**[CONSENSUS]** — the item-context tradeoff is one of the best-
replicated dissociations in the emotional-memory literature.

**Spec consequence (§2 — extends ABC into the relational layer):**
ABC (§2.1) reallocates strength *within* the event's fields; the
item-context tradeoff reallocates *between* item fields and the
event's connective tissue:

```
for episodic records with arousal ≥ 0.5:
    link_p_eff   = link_p · (1 − emo_assoc_loss·arousal)   // ≈0.25
    verbatim.when strength *= (1 − emo_assoc_loss·arousal)
    source-tag initial strength *= (1 − emo_assoc_loss·arousal)
emo_assoc_loss ≈ 0.25 — half the effect at arousal 1.0, graded
```

Emergent and correct: the insult is unforgettable, which booth it
happened in is gone; she remembers the announcement perfectly and
swears she heard it from Priya — she read it in the group chat.
§7's trauma phenotype (`when`/ordering at half strength) is now the
endpoint of this graded curve, not a special case — keep the trauma
clause as an *additional* hard halving on top. (P156)

---

## 16. Saying it changes it — verbal dampening of the affect tag

Part I's retelling machinery (retell_boost on strength, drift on
content) left the affect tag inert — retold records kept their heat
forever except for slow decay. But putting feelings into words measurably
quiets them:

- Lieberman et al. 2007 (Psychol. Sci.): affect labeling reduces
  amygdala response — verbalizing emotion down-regulates it.
- Pennebaker's disclosure literature (1997 review): structured
  verbal/written processing reduces intrusive affect over repetitions.
- Retrieval-extinction adjacency: recounting in a safe context is the
  naturalistic version of an extinction trial (§21 below).
- Counter-force already modeled: §5.9 re-stamps arousal on intrusion;
  rumination (§8) rehearses affect. The split that resolves it is
  *social* retelling dampens, *solitary* rehearsal doesn't —
  consistent with the disclosure literature being interpersonal or
  expressive, and rumination being internally repetitive.

**[CONSENSUS]** that affect labeling/disclosure down-regulates felt
affect; **[HYPOTHESIS]** the social/solitary split as the sim
mechanism.

**Spec consequence (§6.11 / §5.5):**

```
on retell (audience present):  emotional.arousal *= (1 − verbal_dampen)
                               verbal_dampen ≈ 0.05 per telling,
                               valence untouched
exempt:                        trauma:true records (§7 — intrusions
                               re-stamp; disclosure doesn't mute the
                               flashback, it may do nothing at all)
solitary rehearsal (§4.13 draw with no audienceId): NO dampen —
                               the ruminator's loop stays hot
```

Emergent: the character who *talks about* the breakup cools off; the
one who replays it alone at 2 a.m. keeps it radioactive. Combined with
§19's FAB gate this gives the two real routes to an emotional scar:
never tell it, or tell it to no effect (trauma). (P157)

---

## 17. Regulation style is a personality parameter

Part I had one regulation-adjacent hook (`daLoad`). The individual-
difference literature separates two strategies with opposite memory
costs:

- Richards & Gross 1999, 2000 (JPSP): **expressive suppression**
  (holding the face still) consumes self-regulatory resource *during*
  the event → memory for the event itself is impaired. Reappraisal —
  reinterpreting the situation — does NOT impair memory; it changes
  what gets stored.
- Dillon, Ritchey, Johnson & LaBar 2007: reappraisal alters the
  affective tag of what is later remembered (down-regulated arousal
  encodes weaker).
- Sheppes & Gross reviews: habitual style is trait-stable and predicts
  which mechanism runs.

**[CONSENSUS]** on the suppression-costs/reappraisal-transforms split.

**Spec consequence (§2 — one new trait + two paths):**

```
trait regulate_style ∈ [0,1]:  0 = habitual suppressor, 1 = reappraiser
suppressor (regulate_style < 0.5):
    on events with arousal ≥ reg_thresh (0.6):
        enc_base *= (1 − reg_suppress_cost·(1−regulate_style))
        // reg_suppress_cost ≈ 0.2 — the act of holding still
        // eats the encoding budget; the stoic remembers less of
        // the hard day
reappraiser (regulate_style ≥ 0.5):
    on events with arousal ≥ reg_thresh:
        arousal_tag *= (1 − reg_reappraise_k·(regulate_style−0.5)·2)
        // reg_reappraise_k ≈ 0.25 — the tag is born cooler;
        // then §13 peak-end applies to the reappraised series
```

Trait feeds from the bible like `stereo_suscept`. Emergent: the
unflappable landlord genuinely *has* less to remember from the
eviction scene — not because he hid it, but because composure taxed
the recorder; the therapist-type remembers it fine but less hot.
(P158)

---

## 18. Conditioned affect generalizes — and trauma widens the gradient

§4.9's CondEntry keyed on exact cue match. Conditioning is not
exact-match:

- Dunsmoor et al. 2009 (Nat. Neurosci.): conditioned fear generalizes
  to perceptually similar stimuli along a gradient.
- Dunsmoor & Paz 2015 (Annu. Rev.): generalization is tuned by
  anxiety — anxious/traumatized brains generalize *broadly*
  (Lissek et al. 2005, 2010: panic/PTSD patients show flat
  generalization gradients — the conditioned response doesn't fall
  off with dissimilarity).
- Conceptual generalization (Dunsmoor, Martin & LaBar 2012): fear
  transfers across *category* membership, not just perceptual
  similarity — the cue-vector machinery can express this directly.

**[CONSENSUS]** on gradient existence and anxiety-broadening.

**Spec consequence (§4.9 upgrade — similarity-keyed firing):**

```
on ambient/context ticks, for each CondEntry e:
    sim = cueVector similarity(e.cue, C cues)   // same sim machinery
                                               // as cueMatch
    if sim ≥ 1 − gen_width:   emit valence·strength·sim
gen_width ≈ 0.25 default; trauma modifier and each trauma:true record
    widen the character's effective width: gen_width_eff =
    min(0.6, gen_width + 0.15·n_trauma_records)
extinction accrues to safeCount keyed on the *fired similarity band*,
so close-but-safe neighbors partially extinguish (gradient-shaped
extinction — mirrors acquisition)
```

Emergent: mugged outside Mudhaus → dreads Mudhaus, uneasy on that
whole block, faintly wary of all dark storefronts; after the second
assault, the whole street after dark is hot. Positive conditioning
generalizes too — the bakery that smells like the good summer. (P159)

---

## 19. The fading affect bias has a self-boundary — gossip doesn't heal

`neg_affect_decay` (v0) applied the FAB globally. The boundary
conditions:

- Walker, Skowronski & Thompson 2003 (Rev. Gen. Psychol.): FAB —
  negative affect fades faster than positive — is established for
  *autobiographical* events and functions as self-enhancement.
- Ritchie, Skowronski et al. 2006/2015: FAB attenuates or reverses
  in dysphoria (already modeled via the depressive modifier ×0.7) —
  and is weaker for events *about other people*; the mechanism is
  self-referential reappraisal, which doesn't run on gossip.
- Related self-protective asymmetry: mnemic neglect (v0.8,
  `mnemic_*`) already gates on self-relevance — the FAB boundary is
  the same shape.

**[CONSENSUS]** for the self-relevance boundary; the others-events
clause is thinner → mark the non-self case **[DEBATED]** and gate it.

**Spec consequence (§4.5 refinement — gate, not new rate):**

```
neg_affect_decay applies only if record.selfRelevance_eff ≥
    fab_self_gate (0.4)
below the gate: negative affect decays at the POSITIVE baseline rate
    (no asymmetry) — the bad thing that happened to your coworker
    stays exactly as bad in memory; only *your* wounds heal faster
depressive modifier ×0.7 now reads as ×0.7 on the gated rate —
    dysphoria weakens the self-referential repair, unchanged intent
```

Emergent: a character's own humiliation fades in felt sting, but
*witnessed* injustices keep their charge — which is why old grievances
about what was done to *others* (the eviction everyone watched) can
power collective memory long after personal slights cooled. Also
fixes a subtle wrongness in v0: a neighborhood scandal remembered by
spectators was losing its negative valence like a personal
embarrassment. (P160)

---

## 20. Contagion: hearsay carries heat, scaled by the teller

`hearAccount` records inherited content but the arousal they stored was
unspecified. Social sharing of emotion:

- Rimé's social-sharing-of-emotion program (1995, 2009 review): people
  retell emotional events at rates proportional to intensity; the
  *listener's* response is an emotional event of its own.
- Hatfield, Cacioppo & Rapson 1993: emotional contagion — expressed
  affect transfers to perceivers, moderated by expressivity of sender
  and susceptibility of receiver.
- Peters & Kashima 2007, 2015: shared emotion in rumor/gossip
  propagation — emotional content travels further; listener arousal is
  the transmission fuel (ties to `retell_social`).
- Harber & Cohen 2005: emotional arousal in the teller increases
  sharing intent — the loud version propagates.

**[CONSENSUS]** direction; magnitudes ours to set **[HYPOTHESIS]**.

**Spec consequence (§6.3 / hearAccount — tag on secondhand records):**

```
on hearAccount, the told_by record's tag:
    arousal = source_arousal · contagion_k · speaker_express
                  · (0.5 + 0.5·empathy_trait)
    contagion_k ≈ 0.5 — secondhand is half as hot, not zero;
    speaker_express ∈ [0.5,1.5] from PersonModel/display stats,
    empathy_trait from bible (profiles: low-empathy characters hear
    tragedies cold)
    valence adopts the account's valence directly (sign survives
    retelling; magnitude is what attenuates)
feeds §18: a high-arousal hearsay record CAN still cross cond_thresh —
    secondhand trauma conditions places the character has never been
    scared in personally (vicarious conditioning — real, Olsson &
    Phelps 2007)
```

Emergent: the rumor about the fire leaves a warm shadow of dread on
the building even for people who weren't there; the dry reteller
inoculates, the dramatic one infects. Vicarious conditioning is the
mechanism that lets neighborhood-wide trauma exist. (P161)

---

## 21. Reconsolidation-window extinction — the timing carve-out

§4.9 extinction was context-bound suppression. One stronger tool exists:

- Schiller et al. 2010 (Nature): extinction training delivered
  *inside* the reconsolidation window (~10min–6h after fear reactivation)
  prevents the return of fear — the original association is updated,
  not merely suppressed (in humans, persistent at 1 year).
- Replication state **[DEBATED]**: several partial replications and
  some failures (Chalkia et al. 2020 meta-analysis finds the effect
  real but fragile — boundary conditions on the reminder trial).
- Mechanism consensus **[CONSENSUS]**: reactivated memories are
  labile for a window (Nader, Schafe & LeDoux 2000); what happens in
  the window writes deeper than what happens outside it.

**Spec consequence (§4.9 addition — one flag, one rule):**

```
when a CondEntry fires (ambient or recall), set lastFireDay and open
    reconsol_open = true for reconsol_window days (0.25 ≈ 6h)
a safe exposure while reconsol_open:  safeCount += reconsol_extinct_gain
    (3.0) AND mark suppressor deep:true — spontaneous recovery
    (§4.9 recovery) does NOT erode deep suppressors
a safe exposure outside the window: safeCount += 1 as before (erasable)
```

Emergent: the character who goes back to the bar *that same night,
still shaken* and has a fine time gets a repair that lasts; the one
who waits three weeks gets a fragile truce that a quiet month
unwrites. This is also the sim's exposure-therapy mechanic —
cheap, timing-based, and falsifiable. (P162)

---

## 22. Spec delta (v1.6 → v1.7)

| § | Change |
|---|---|
| §2 | affect tag set by peak-end (`peak_w`, `end_w`, `affectSeries` optional input); `emo_assoc_loss` graded item-context tradeoff on link_p/`when`/source-tag; `regulate_style`/`reg_thresh`/`reg_suppress_cost`/`reg_reappraise_k` regulation paths |
| §2 sleep | `sleep_affect_strip` on arousal tag (0.04, trauma-exempt, DEBATED flag); `tag_capture` folded: §2.3 post_stress_gain now also fires cue-agnostic at half strength — behavioral-tagging rescue of weak temporal neighbors (Dunsmoor, Murty et al. 2015) |
| §4.5 | `fab_self_gate` — FAB gated by selfRelevance_eff |
| §4.9 | CondEntry firing → similarity gradient `gen_width`, widened by trauma load; `reconsol_window`/`reconsol_extinct_gain` deep-suppressor path |
| §6.3 | hearsay tag: `contagion_k`, `speaker_express`, `empathy_trait` |
| §6.11 | `verbal_dampen` on retell (trauma-exempt; solo rehearsal exempt) |
| §7 | +12 params: peak_w, end_w, emo_assoc_loss, sleep_affect_strip, regulate_style, reg_thresh, reg_suppress_cost, reg_reappraise_k, gen_width, reconsol_window, reconsol_extinct_gain, contagion_k, verbal_dampen, fab_self_gate |
| §10 | encodeEvent accepts `affectSeries`; hearAccount accepts `speaker_express`; new read `genWidth(charId)` for behavior layer |

## 23. Age guidance (extends §10 of Part I)

- `peak_w`/`end_w`: **end-weight rises with age** — older adults weight
  ends more in retrospective affect (consistent with positivity +
  endings; mark [HYPOTHESIS], end_w knot +0.1 at 70).
- `sleep_affect_strip`: slightly *reduced* in older adults (REM
  fraction declines) — ×0.8 at 70 [HYPOTHESIS].
- `emo_assoc_loss`: flat — the tradeoff is amygdala-mediated, preserved.
- `gen_width`: widens with trauma *count* only — lifetime-load model,
  not age-per-se.
- `contagion_k` × `empathy_trait`: empathy roughly preserved in aging;
  keep flat, let bible variation carry differences.
- `regulate_style`: older adults skew reappraisive (SST) — prior mean
  shifts +0.15 past 60 [HYPOTHESIS].
- Children: `peak_w` higher (~0.7), end-weight lower — children's
  retrospective affect is peak-dominated [HYPOTHESIS].

## 24. Validation probes P154–P162

- **P154 peak-end (MUST):** two episodes identical in mean and
  duration; A spikes arousal 0.9 mid-way and ends calm, B flat 0.5.
  Stored tag must track peak+end: A.arousal_tag > B.arousal_tag by
  ≥30%; doubling duration must move neither tag >5% (duration
  neglect). FAIL if tag = mean.
- **P155 sleep strips heat (SHOULD):** arousal-0.8 record: arousal tag
  falls faster across sleep ticks than across matched waking days;
  trauma:true control unaffected. FAIL if content strength and arousal
  decay at the same ratio (they must decouple).
- **P156 item-context tradeoff (MUST):** arousal-0.75 event vs neutral:
  emotional record keeps higher core-field accuracy, lower
  `when`/source accuracy, and fewer associative links — graded, so an
  arousal-0.4 record shows the split attenuated ≥50%.
- **P157 verbal dampening (SHOULD):** identical negative record
  retold to audiences vs rehearsed solo ×6: social path's arousal
  tag lower by ~verbal_dampen×6; solo unchanged; strength rises in
  BOTH paths (cooler ≠ weaker — this is the discriminating clause).
- **P158 regulation split (SHOULD):** suppressor vs reappraiser trait
  on the same hot event: suppressor record weaker overall; reappraiser
  record normal strength, cooler tag. FAIL if both lose strength.
- **P159 generalization gradient (MUST):** conditioned dread at place
  P emits detectable affect at a perceptually-similar place Q and
  none at dissimilar R; a 2-trauma-load character emits at
  intermediate similarity where a 0-load character does not.
- **P160 FAB self-boundary (MUST — sign-locked):** matched negative
  events, selfRelevance 0.8 vs 0.2: after 30 days the self event's
  negative tag has faded ~1.3× the positive rate; the other-relevant
  event fades at the POSITIVE baseline. FAIL if non-self negative
  affect fades at the gated rate.
- **P161 contagion (SHOULD):** same account from flat vs expressive
  speaker to a high-empathy listener: listener record's arousal
  scales with speaker_express; an arousal-0.9 expressive telling can
  mint a CondEntry on a place the listener has never encoded
  personally (vicarious conditioning).
- **P162 reconsolidation extinction (SHOULD):** safe exposure within
  reconsol_window of a fire → suppressor marked deep; after
  recovery_days quiet, deep suppressor intact while a normal
  suppressor has decayed by recovery_frac.

## 25. Honest limits (Part II)

- **affectSeries granularity** depends on game-systems supplying
  within-event affect samples; with a scalar the formula degenerates
  cleanly to peak=end=value — backward compatible by construction.
- **Sleep depotentiation** is the least-settled mechanism in this
  version — hence small, trauma-exempt, toggleable. If it dies, the
  everyday "cooled-off memory" phenomenon is still produced by
  `arousal_affect_decay` + verbal_dampen + FAB; sleep_affect_strip is
  one of three redundant paths, by design.
- **Gen_width keying** uses the existing cueVector similarity —
  conceptual generalization (Dunsmoor 2012) comes free only where
  cueVectors share topic/people fields; pure perceptual similarity is
  a world-side representation question.
- **contagion_k** magnitudes are calibrated guesses; the literature
  fixes direction and moderator structure, not effect size in this
  form.
- **Peak-end for negative-vs-positive asymmetry** unexplored here —
  the literature is thinner than the marketing of it.
- Nothing here models *anticipatory* affect (dread of a future event
  altering encoding of the wait) — Intention records (§9) could carry
  an affect tag; flagged as open loop for a future version.

---

# Part III — v29: the feeling's grammar (2026-09-23, third pass)

Part I built the record machinery (consolidation, blink, valence-fidelity,
stress timing, conditioned affect, trauma phenotype, mood bleed). Part II
built the tag layer (peak-end birth, sleep stripping, item-context
tradeoff, verbal dampening, regulation traits, generalization, FAB
boundary, contagion, reconsolidation extinction). Part III deepens what
both left flat: **the tag was a valence-arousal pair** — real feeling is
*discrete* (§26), **the arousal curve was linear** — it is an inverted-U
whose two halves are different mechanisms (§27), **the tag was frozen at
birth** — later outcomes rewrite remembered emotion (§28), **cues were
modality-blind** — smell is privileged (§29), **the calendar was inert** —
dates themselves are cues (§30), **persons were ordinary cues** — trust
conditions asymmetrically (§31), **trauma could never heal** — narrative
coherence repairs it (§32), **threat had no object** — weapon focus (§33),
**retrieval was one-way** — recall feeds back into mood (§34), and
**self-report assumed felt access** — hot-cold gaps compress it (§35).
Then spec delta (§36), age guidance (§37), probes P274–P285 (§38), honest
limits (§39).

Tag convention unchanged: **[CONSENSUS] / [DEBATED] / [HYPOTHESIS]**.

---

## 26. Valence-arousal is not enough — the discrete-emotion tag

Two events can share `valence −0.7, arousal 0.7` and be remembered
differently: being *afraid* of the landlord and being *furious* at him are
different records. The appraisal-tendency framework:

- Lerner & Keltner 2000, 2001 (JPSP): emotions differ on appraisal
  dimensions — **certainty** and **control** — and carry their appraisal
  into downstream cognition. Fear = high uncertainty, situational
  control → vigilant, detail-preserving processing. Anger = high
  certainty, individual control → heuristic, gist-leaning processing —
  anger behaves cognitively like happiness despite being negative.
- Kensinger & Schacter's valence-fidelity split (§3) is largely an
  appraisal effect in disguise: the "negative = veridical" advantage is
  strongest for *fear/sadness*; anger drifts toward the positive/gist
  pattern (Levine & Pizarro 2004, J. Exp. Soc. Psychol. review;
  Levine & Burgess 1997 — appraisals at encoding mediate which details
  survive).
- Disgust is its own channel: disgust enhances memory for the
  disgusting object specifically and resists extinction longer than
  matched fear (Chapman, Johannes, Poppenk, Moscovitch & Anderson 2013
  — disgust boosts recognition; Olatunji's contamination literature —
  disgust conditioned responses are extinction-resistant).

**[CONSENSUS]** on appraisal-dimension differences;
**[DEBATED]** exact memory consequence per emotion beyond the
fear↔anger contrast.

**Spec consequence (§2 — optional discrete tag, additive on
valence/arousal):**

```
event may carry emotion ∈ {fear, anger, sadness, joy, disgust, shame,
                           pride, neutral}  // absent → infer from
                           valence/arousal (neg+high arousal → fear
                           default); tag is stored, not recomputed
on encode (emotion-specific multipliers on existing terms):
    fear:    neg_fidelity path strengthened —
             neg_fidelity_eff = neg_fidelity·(1 − fear_detail_gain)
             // fear_detail_gain ≈ 0.15 — more veridical than
             // generic-negative
    anger:   pos-gist direction — drift_p_eff and lure_accept use
             (1 + anger_gist_bias)   // ≈0.15 — the certain, heuristic
             // negative: remembered mean, remembered loosely
    disgust: cond_gain_eff = cond_gain·(1 + disgust_gain) AND
             extinct_suppress_eff = extinct_suppress·(1 − disgust_gain)
             // disgust_gain ≈ 0.15 — disgust conditions faster and
             // extinguishes slower
    shame:   treated as negative + selfRelevance floor ≥0.7 (it is the
             self-conscious emotion — mnemic-neglect interactions
             already in §4.10)
```

Emergent and gameplay-legible: two characters leave the same rent
meeting — the frightened one keeps the room's details and the exact
words; the furious one keeps *a conviction* ("he threatened me") that
is confidently reconstructed. Their stories diverge in different
directions from the same fact base — which is what witness
disagreement actually looks like. (P274)

---

## 27. The arousal curve bends — inverted-U on the hippocampal channel

`w_emo·arousal` has been linear since v0, plus threshold effects at
`emo_blink_thresh`/`trauma_thresh`. The dose-response is curved:

- Yerkes & Dodson 1908; Diamond, Campbell, Park, Halonen & Zoladz 2007
  (Brain Res. Rev.): hippocampal/prefrontal-dependent memory follows an
  **inverted-U** in glucocorticoid/catecholamine load — moderate arousal
  helps, extreme arousal impairs the *associative/contextual* channel.
- The amygdala item-channel does NOT share the downturn: at extreme
  arousal, core/item memory is still enhanced while context collapses
  (Payne, Jackson et al. 2007 — stress at encoding: central item spared,
  peripheral/context impaired; consistent with §15's graded tradeoff).
- Andreano & Cahill 2006: the curve's peak and the size of the
  post-peak downturn differ by sex and hormonal state — keep this as
  trait scatter, not a sex constant (modifier-delta business).

**[CONSENSUS]** on the inverted-U shape for associative/contextual
memory; the resolution "item channel exempt, context channel bends" is
the standard reconciliation and is what we implement.

**Spec consequence (§2 — replace the linear arousal term inside E for
*contextual fields only*):**

```
arousal_eff(field) =
    arousal                                          // core/item fields:
                                                     //   who/what, tags
    arousal·(1 − arousal_curv·max(0, arousal − arousal_opt)²)
                                                     // associative fields:
                                                     //   when, links,
                                                     //   source, place-detail
arousal_opt ≈ 0.65;  arousal_curv ≈ 0.5
```

At arousal 1.0 the associative term is `1 − 0.5·(0.35)² ≈ 0.94·` —
deliberately gentle *at the top of the range*: the literature's strong
downturn sits beyond the sim's calibrated arousal scale, and §15's
`emo_assoc_loss` already carries most of the graded damage. This term
exists to make the *shape* non-monotonic (P275) and to cap the absurd
corner case (arousal-1.0 event encoding perfect context). If a build
wants the strong downturn, raise `arousal_curv` toward 2.0 — the clamp
allows it.

---

## 28. Later outcomes rewrite remembered emotion

The affect tag has been written at birth and only faded since. Levine's
program shows remembered emotion is *reconstructed* — and the
reconstruction is pulled by what you believe about the event NOW:

- Levine 1997 (J. Exp. Psychol. Gen., Ross Perot supporters): after
  Perot re-entered the race and the election resolved, supporters'
  recall of their *July emotions* was distorted toward their *current
  appraisal* of him — those who had forgiven him remembered being less
  angry than they had reported feeling at the time.
- Levine, Prohaska, Burgess, Rice & Laulhere 2001 (Cogn. & Emot., O.J.
  verdict): same design, same result at 2 months and >1 year —
  remembered happiness/anger tracked appraisal *change*, and the
  greater the appraisal shift the less stable the emotion memory.
- Levine & Bluck 1997 (Psych. Aging): the effect is age-moderated —
  older adults who disengaged from the thwarted goal showed reduced
  remembered sadness; current appraisal, not past feeling, is what was
  retrieved.
- Related but distinct: §6.16's `hindsight_k` rewrites the remembered
  *belief* ("I knew it all along"); this clause rewrites the remembered
  *feeling*.

**[CONSENSUS]** — appraisal-driven reconstruction of past emotion is
replicated across event classes.

**Spec consequence (§5.9 reconsolidation amendment + §6.17):**

```
when an outcome event o resolves record r (linked via §4.13/§6.16
    resolution edges, or same people+topic with o.valence tag and
    r flagged open_outcome):
    on next retrieval of r:  r.valence += emo_update_k·(v_current −
        r.valence) where v_current = appraised valence of the resolved
        arc (o.valence for self-relevant r; attenuated by fab_self_gate
        as in §19)
    emo_update_k ≈ 0.2 per qualifying retrieval — slow creep, not a
    snap; arousal tag untouched (the intensity is remembered truer
    than the sign — Levine 1997 found sign/intensity drift asymmetric)
```

Emergent: she remembers being *devastated* by the breakup — except the
breakup turned out fine, so the memory quietly re-colors to "upset."
Characters' accounts of their own emotional history drift toward the
present without any record-level distortion of facts. The divorcee who
thrived genuinely misremembers how bad it felt. (P276)

---

## 29. Smell is a privileged cue — the Proust channel

`sensory_age_slope` (v0.2) already lets sensory cues reach older
memories; the modality split inside "sensory" is real:

- Chu & Downes 2000a (Chem. Senses) review; 2000b (Cognition, "Long
  live Proust"): odor-cued autobiographical memories peak at **age
  6–10** — earlier than the word/label-cued bump (11–25). Odor reaches
  *childhood* that other cues don't.
- Chu & Downes 2002 (Mem. Cogn., "Proust nose best"): odors are better
  cues than matched verbal/visual cues — more emotional, more vivid,
  less rehearsed (odor-evoked AMs feel like time travel partly because
  they haven't been retold to death).
- Willander & Larsson 2006, 2007: odor-cued memories are older and more
  emotional; the effect survives controlling for cue specificity.
- Herz & Schooler 2002; Herz 2004: odor-evoked memories are rated more
  emotional than visually-evoked ones of the same event — the amygdala
  sits ~two synapses from the olfactory bulb; the affect tag arrives
  before the narrative does.
- Mechanistic rider: odors are poorly named — `sensory_mismatch_pen`
  already handles wrong-sensory cues; the naming poverty means odor
  cues are *low-fan* (§5.4 fan effect): one smell tends to point at one
  episode, which is half the diagnosticity story (§5.2).

**[CONSENSUS]** that odor cues skew older, more emotional, less
rehearsed; **[DEBATED]** whether odors are *more accurate* — probably
not (Herz: emotional, not veridical).

**Spec consequence (§5.2/§5.7 — modality field on sensory cues):**

```
cueVector sensory fields may carry modality ∈ {smell, sound, sight,
    touch, taste}  (world-side tag; default sight)
smell cues:  drive weight ×= odor_cue_gain (1.5);
             encodeAge prior shifted earlier — when sampling the
             ambient scan, smell cues can reach records below the
             label-cued accessibility floor: treat cueMatch for smell
             as if record age were computed from a 6–10y-weighted prior
             (implement: smell cues ignore half the age-based drive
             penalty — odor_age_relief = 0.5 multiplier on recency term)
retrieved affect: a smell-cued retrieval returns reported_arousal
             with +odor_emo_gain (0.15) on the §8 mood_bleed output —
             the smell makes it *feel* closer than the picture does
```

Emergent: the smell of cilantro drops a character back twenty years to
a kitchen the verbal cue "home" never reaches; the intrusive memory
arrives already warm. Ambient NPCs can trigger this with a single tag
on their schedule. (P277)

---

## 30. The calendar is a cue — anniversary intrusions

`when` has only ever decayed or been estimated. Clinically, dates
*retrieve*:

- Morgan, Kingham, Nicolaou & Southwick 1998 (J. Trauma Stress): 2-year
  follow-up, Gulf War veterans — 31% named their worst month as the
  month of their war trauma; all PTSD cases showed anniversary
  reactions.
- Morgan, Hill, Fox, Kingham & Southwick 1999 (Am. J. Psychiatry):
  6-year follow-up — anniversary reactions persisted above chance,
  correlated with trauma exposure count; spouse reports corroborated
  (and sometimes *detected reactions the veteran denied* — the date
  moves mood before the person can say why).
- Broader clinical consensus (VA National Center for PTSD): anniversary
  reactions are real, typically transient, and include intrusive memory
  + avoidance + numbing — i.e. a *retrieval* signature, not just a mood.
- Mechanism framing for the sim: the calendar is an *implicit cue* —
  day-of-year match drives retrieval drive without source awareness;
  the character feels bad in March and only optionally connects it.

**[CONSENSUS]** (rare for a clinical phenomenon — two prospective-ish
longitudinal studies plus clinical observation).

**Spec consequence (§5.7 ambient scan — a second involuntary trigger
besides cue-overlap):**

```
for records with emotional.arousal ≥ anniv_thresh (0.6):
    date_match = circular distance between now.day-of-year and
                 record.when.day-of-year
    if date_match ≤ anniv_window (14 days):
        drive += anniv_gain·(1 − date_match/anniv_window)·arousal
        anniv_gain ≈ 0.2 — fires even if no cue field matches C
        (bypasses the ordinary cueMatch gate; this IS the cue)
returned record: reconstruction runs normally, BUT the retrieval is
    flagged cue_source:"date" — the character gets the feeling and the
    content; whether they can attribute it to the anniversary is a
    source-monitoring question (§6.10 machinery decides, unaided)
```

Emergent: the same week every year the character is brittle and
doesn't know why; a roommate who knows the date can say it for them —
the Morgan spouse effect, free. Positive anniversaries work too —
where the record's valence is positive the same machinery produces the
warm memorial mood (the first-day-we-met effect). (P278)

---

## 31. Trust conditions asymmetrically — persons as CondEntries

CondEntries have been cue-generic. Persons deserve their own entry
shape because person-perception valence is famously asymmetric:

- Skowronski & Carlston 1989 (Psychol. Bull.): negativity bias in
  impression formation — immoral behaviors are more diagnostic of
  character than moral ones; one betrayal outweighs a ledger of
  kindnesses in trait attribution.
- Baumeister, Bratslavsky, Finkenauer & Vohs 2001 (Rev. Gen. Psychol.,
  "Bad is stronger than good"): the broad review — bad events have
  larger, longer-lasting psychological impact than matched good ones.
- Reeder & Brewer attribution asymmetry: moral impressions update fast
  negatively, slowly positively — a one-trial learning asymmetry.
- The reverse-direction data exist too (positive impressions resist
  revision less than negative ones do — i.e., negative person-tags are
  stickier), which is what we model.

**[CONSENSUS]** on the asymmetry direction; magnitudes are calibrated
guesses **[HYPOTHESIS]**.

**Spec consequence (§4.9 — person-cue CondEntries get their own
rates):**

```
entries whose cue is a person (people-field match):
    acquisition:  negative events → cond_gain_eff = trust_neg_gain (0.6,
                  one betrayal nearly maxes the entry);
                  positive events → cond_gain_eff = trust_pos_gain
                  (0.2 — liking is built by repetition)
    decay:        cond_decay_eff = cond_decay·person_cond_decay_mult
                  (0.5) — person associations outlive place
                  associations; you forgive the room before the man
    extinction:   unchanged mechanics, but note that safeCount accrual
                  on person cues = "repeatedly having fine interactions"
                  — the natural repair loop for a broken trust tag
    the emitted valence feeds BOTH C.affect (ambient dread/warmth)
                  and PersonModel evaluation drift — the memory system
                  supplies the affective tag; the social substrate
                  decides what it means
```

Emergent: trust arrives on foot and leaves on horseback — a single
arousal-0.8 betrayal writes a person-tag that months of decent
behavior only partially suppress, and renewal means seeing him *in the
old context* recharges it. The mechanic also quietly generates grudges
and crushes without any social-system special-casing. (P279)

---

## 32. Trauma can heal — narrative coherence as the repair variable

The §7 trauma phenotype is permanent by construction (floor, intrusion
discount, re-stamped arousal). Clinically, what changes in recovery is
*organization*, not strength:

- Foa, Molnar & Cashman 1995 (J. Trauma Stress): rape narratives
  across exposure therapy — organized thoughts increased, and
  fragmentation-decrease correlated with symptom reduction.
  **[DEBATED]** replication is mixed (Zoellner & Bittinger 2004
  review; O'Kearney & Perrott 2006) — fragmentation-outcome
  correlations are real but inconsistent; we model the consensus
  *direction* with a modest gain.
- Pennebaker & Seagal 1999: forming a coherent story is the proposed
  active ingredient of expressive writing — converting the
  sensory-bound trace into a narratable one.
- Brewin et al. dual-representation framing (§7): therapy doesn't
  delete the hot trace; it builds a competing contextualized
  representation that wins at retrieval — a *suppression/competition*
  model, same shape as §4.9 extinction. Consistent architecture.
- Boals, Murrell & Berntsen complicate ("event centrality") — a trauma
  that becomes identity-central stays hot; `coherence` growth should
  be slower on high-selfRelevance trauma records.

**Spec consequence (trauma records gain `coherence ∈ [0,1]`, init
0.25; §4.13/§6.11 amendments):**

```
growth:  each structured retell — audience present AND the recount
         covers ≥60% of the record's surviving core fields — adds
         coh_gain (0.05); selfRelevance ≥0.8 records accrue at half
         rate (event-centrality brake, Boals)
effect 1 (intrusions):  intrusion drive for the record scales
         (1 − coh_intrusion_k·coherence), coh_intrusion_k ≈ 0.6 —
         a coherent trauma still intrudes, but the highway narrows
effect 2 (sleep strip): §14's sleep_affect_strip is GATED on
         trauma records — applies only if coherence > coh_strip_gate
         (0.5). Unprocessed trauma stays hot over sleep; processed
         trauma finally cools — the mechanistic version of "you have
         to be able to tell it before it can fade"
effect 3 (report): reconstruction of a high-coherence trauma record
         restores verbatim.when and ordering normally — the timeline
         gets rebuilt by narration, not recovered from the trace
```

Emergent: the difference between a wound and a story — the veteran who
has told it a hundred times has a scar with a narrative; the one who
never has has a weather system. This is also the sim's therapy
mechanic: repeated structured disclosure measurably domesticates the
record while leaving its facts intact. (P280)

---

## 33. Threat has an object — weapon focus as capture, not narrowing

§2.1's ABC splits fields central/peripheral by priority. The weapon-
focus literature isolates the sharpest version:

- Steblay 1992 (J. Appl. Psychol. meta-analysis): presence of a weapon
  reduces identification accuracy and feature recall for the rest of
  the scene — effect is real, moderate size.
- Fawcett, Russell, Peace & Christie 2013 (Psychol. Crime & Law
  review): meta-analytic confirmation; the object captures attention
  and the surrounding *person* detail suffers — it's the wielder's face
  that dies, not the room.
- The effect is object-specific capture, separable from general
  arousal narrowing: matched-arousal scenes without a focal threat
  object don't show the same face/ID loss.

**[CONSENSUS]** direction; **[DEBATED]** mechanism (attentional
capture vs unusualness — in RW, threat objects are also rare, so the
confound is inherited honestly).

**Spec consequence (§2 — optional `threat_object` field on
encodeEvent):**

```
event may carry threat_object: <field-id>  (world supplies when a
    focal threat object exists — a knife, a raised fist, a gun on
    the counter)
if present AND arousal ≥ reg_thresh (0.6):
    that field:        strength ×= (1 + wf_gain)     // wf_gain ≈ 0.5
    other fields that WOULD be central under ABC:
                       strength ×= (1 − wf_loss)     // wf_loss ≈ 0.3
    peripheral fields unchanged (arousal_narrowing already kills them)
```

Emergent: "all I remember is the knife" — the record has a vivid
verbatim weapon field, a degraded `who`, and an ordinary-arousal
bystander's account contradicts the victim's precisely where weapon
focus predicts. Eyewitness disagreement gets a second generator
(distinct from §3 valence-fidelity). (P281)

---

## 34. Retrieval changes the retriever — recall→mood feedback

Retrieval has been one-directional: C.mood biases selection (§5.4) and
reconstruction (§8), but the retrieved record never moves C.mood.
Closing the loop:

- Mood induction by recall is the oldest manipulation in the
  literature (Velten 1968; Westermann et al. 1996 meta): recalling
  emotional material measurably shifts current affect.
- Wildschut, Sedikides, Arndt & Routledge 2006 (JPSP): nostalgia —
  self-relevant, social, usually positive-but-bittersweet recall —
  *restores* mood, belonging, and meaning; triggered most by low mood
  and loneliness (the psyche reaching for the warm record).
- Sedikides et al. reviews: nostalgia's restorative function is
  [CONSENSUS] for direction; its net hedonic sign is debated
  (bittersweet — can co-occur with loneliness).

**Spec consequence (§5.5 — feedback term on context):**

```
after any successful recall/ambient hit:
    C.mood += recall_mood_pull · reported_valence · arousal_tag
              // recall_mood_pull ≈ 0.05 — small; a memory nudges
              // the day, it doesn't drive it
nostalgia subtype (valence > 0.3 AND selfRelevance ≥ 0.6 AND record
    age > 365d AND people-field non-empty):
    when C.mood < 0: pull ×= (1 + nostalgia_gain)  // nostalgia_gain
              ≈ 0.1 — the sad character reaches for the warm past
              AND it works a little harder
```

Emergent: bidirectional spiral in both directions — bad mood selects
bad records (§5.4), bad records deepen the mood (this), which selects
worse records; the rumination loop (§8) finally has its feedback edge.
And the counter-loop: lonely evening → the ambient scan surfaces the
warm summer → the evening lifts slightly. This is the cheapest version
of "a character's inner weather has memory." (P282, P284)

---

## 35. Cold states can't feel hot ones — the empathy gap on self-report

§8's `mood_bleed` shifts reported affect toward current mood
proportionally. The stronger phenomenon is *compression*: a person in a
cold state systematically cannot re-access the intensity of a hot
state, even their own:

- Loewenstein 2005 (J. Econom. Lit. review; Loewenstein & Schkade
  1999): hot-cold empathy gaps — people in calm states underestimate
  past hunger/pain/fear/craving; the remembered *fact* of the feeling
  survives, the felt intensity does not report.
- Robinson & Clore 2002 (Psychol. Bull.): episodic emotion reports
  under ~hours are experience-near; beyond that, reports are
  reconstructed from beliefs about the emotion class — which is the
  cognitive version of the same compression.
- Direction rider: the gap is symmetric (hot states can't imagine
  cold) but the sim-relevant direction is cold-reading-hot, since most
  retrieval contexts are calmer than trauma contexts.

**[CONSENSUS]** for the gap; the specific implementation as a
mismatch-gated compressor is **[HYPOTHESIS]** (the literature gives
the phenomenon, not the function).

**Spec consequence (§8 amendment — gated compressor after
mood_bleed):**

```
if |C.mood − m.emotional.valence| > hc_gap_thresh (0.5) AND
   |C.mood| < |m.emotional.valence|:      // colder than the record
    reported_arousal *= (1 − hc_gap_loss)   // hc_gap_loss ≈ 0.3
// stored tag untouched — compression is report-side only
```

Emergent: the calm landlord reports the eviction scene as "unpleasant,
maybe 4 out of 10" while the record still sits at 0.9 — and when the
next crisis heats him up, the old reports become available again
(state-dependent access to *feeling*, the affective twin of §5.3's
state-cue drift). Characters systematically under-sell their own past
terror at calm distances — which is why "it wasn't that bad" is
always said on a good day. (P283)

---

## 36. Spec delta (v2.8 → v2.9)

| § | Change |
|---|---|
| §2 | `emotion` enum tag (inferable default); per-emotion multipliers `fear_detail_gain`, `anger_gist_bias`, `disgust_gain`; inverted-U `arousal_opt`/`arousal_curv` on associative fields; `threat_object` field + `wf_gain`/`wf_loss` weapon-focus capture |
| §4.5 | unchanged (§28's rewrite is a §5.9/§6.17 clause, not decay) |
| §4.9 | person-cue CondEntries: `trust_neg_gain`, `trust_pos_gain`, `person_cond_decay_mult` |
| §4.13/§6.11 | trauma records gain `coherence` field; structured retells add `coh_gain`; `coh_intrusion_k` intrusion scaling; `coh_strip_gate` gates sleep_affect_strip on trauma records |
| §5.5 | `recall_mood_pull` feedback; `nostalgia_gain` on qualifying records |
| §5.7 | anniversary trigger: `anniv_gain`, `anniv_window`, `anniv_thresh` — date-match drive that bypasses cueMatch; retrieved records flagged `cue_source:"date"` |
| §5.9/§6.17 | `emo_update_k` — outcome-resolution rewrites retrieved valence tag |
| §5.2/§5.7 | cue modality field; `odor_cue_gain`, `odor_emo_gain`, `odor_age_relief` |
| §8 | `hc_gap_thresh`/`hc_gap_loss` hot-cold compressor on reported_arousal |
| §7 | +20 params (all optional, default-neutral): fear_detail_gain, anger_gist_bias, disgust_gain, arousal_opt, arousal_curv, emo_update_k, odor_cue_gain, odor_emo_gain, odor_age_relief, anniv_gain, anniv_window, anniv_thresh, trust_neg_gain, trust_pos_gain, person_cond_decay_mult, coh_gain, coh_intrusion_k, coh_strip_gate, wf_gain, wf_loss, recall_mood_pull, nostalgia_gain, hc_gap_loss, hc_gap_thresh |
| §10 | encodeEvent accepts `emotion`, `threat_object`, `open_outcome`; cueVector sensory fields accept `modality`; recall output gains `cue_source`; trauma records gain `coherence` |

## 37. Age guidance (extends §10/§23)

- Discrete-emotion multipliers: flat — the appraisal structure of
  emotion is preserved in aging (SST changes *regulation*, not the
  fear↔anger cognitive split) [HYPOTHESIS — thin literature].
- `arousal_opt`: shifts slightly *lower* in old age — older adults show
  emotional-memory benefits at moderate arousal and more cost at
  extremes (consistent with the §10 preserved-channel framing; mark
  [HYPOTHESIS], −0.05 knot at 70).
- `emo_update_k`: preserved — appraisal-driven reconstruction is
  exactly what Levine & Bluck 1997 measured in 71–84yos; flat.
- `odor_*`: the Proust advantage is *preserved or amplified* in aging —
  olfactory decline is offset by the reach-into-childhood effect
  (Willander & Larsson tested young adults; [HYPOTHESIS] keep flat,
  flag for revision if elder olfaction data demands).
- `anniv_gain`: flat — anniversary reactions persist 6+ years in the
  Morgan data; no reason to age-gate a calendar cue.
- `trust_*`: negative acquisition preserved; positivity effect may
  reduce `trust_neg_gain` slightly in old profiles (×0.8 at 70 —
  consistent with `w_emo_neg` direction, mark [HYPOTHESIS]).
- `coh_gain`: flat — narrative repair doesn't require youth; if
  anything, narration is the old character's native economy (§4.13
  ecology already gives elders more retell draws).
- `wf_*`: flat — weapon-focus data in older eyewitnesses show the
  effect persists (O'Rourke et al.).
- `recall_mood_pull`/`nostalgia_gain`: nostalgia is *more* available
  and more used in older adults — nostalgia_gain +0.05 knot at 65
  [HYPOTHESIS].
- `hc_gap_loss`: possibly larger in old (less physiological arousal
  experience to re-instantiate) — +0.05 at 70 [HYPOTHESIS].
- Children: `arousal_opt` higher (~0.75 — children's baselines run
  hot), `coh_gain` near-zero below OGM gate (narrative coherence
  requires the narrative faculty — Habermas); `anniv_*` flat.

## 38. Validation probes P274–P285

- **P274 discrete-emotion split (MUST — sign-locked):** two records,
  same valence −0.7 / arousal 0.7, `emotion:fear` vs `emotion:anger`.
  At day 20: the fear record retains higher core-field accuracy; the
  anger record shows higher gist-lure acceptance and schema-drift —
  opposite drift directions from identical scalars. FAIL if the tag
  changes nothing.
- **P275 inverted-U (MUST — non-monotonicity):** encode associative
  detail (when/place/source fields) at arousal {0.3, 0.65, 0.95}:
  strength must peak at ~0.65 and decline at 0.95 for associative
  fields while who/what fields still rise. FAIL if associative strength
  is monotone in arousal.
- **P276 outcome rewrite (MUST — sign):** record r (open_outcome,
  selfRelevance 0.8) with valence −0.6; resolution event o with
  valence +0.6. After 5 retrievals of r post-resolution, r.valence must
  have drifted ≥0.15 toward positive while r's factual fields and
  arousal tag are unchanged. FAIL if valence doesn't move or arousal
  does.
- **P277 Proust channel (SHOULD):** identical cueVector with sensory
  modality smell vs sight: smell-cued scan surfaces older records (mean
  age ×1.5+) and reports higher arousal; accuracy NOT improved (odor
  is emotional, not veridical — Herz).
- **P278 anniversary intrusion (MUST):** trauma-tagged record dated
  March 12; on March 12±7d of a later year the ambient scan emits it
  with `cue_source:"date"` even with zero field match to C; on a random
  other date with same C, it does not. FAIL if date match contributes
  nothing or if it requires field overlap.
- **P279 trust asymmetry (MUST — rate-locked):** one betrayal event
  (arousal 0.8) vs five kind events (arousal 0.3) on the same person
  cue: the negative entry's emitted strength exceeds the positive
  entry's; after 60 quiet days the negative entry retains more
  fractional strength (person_cond_decay_mult). FAIL if symmetric.
- **P280 coherence repair (SHOULD):** trauma record retold structured-
  to-audience ×10 vs never-retold control: retold record intrudes
  ≤50% as often at matched cues, sleep_affect_strip engages (arousal
  tag decays), core fields intact. Control stays hot. FAIL if retells
  weaken the core fields — repair must be orthogonal to strength.
- **P281 weapon focus (SHOULD):** same arousal-0.8 scene with and
  without threat_object: with-object version retains the object field
  at higher accuracy and `who` at lower accuracy than the no-object
  control; total field mass similar (capture, not suppression).
- **P282 recall→mood loop (SHOULD):** negative-mood context +
  negative-valence record retrieval: C.mood after recall is lower than
  before by ~recall_mood_pull·|valence|·arousal; three sequential
  negative recalls compound measurably.
- **P283 hot-cold gap (SHOULD):** arousal-0.85 record reported from
  C.mood=0 vs C.mood=−0.8: cold report's arousal compressed by
  ~hc_gap_loss; hot-state report uncompressed. Stored tag identical
  after both — report-side only.
- **P284 nostalgia restoration (SHOULD):** qualifying nostalgic record
  (positive, self-relevant, old, social) retrieved in C.mood<0 lifts
  mood more than an equally-positive recent record; the boost scales
  with loneliness/low mood.
- **P285 integration — the one-year battery (MUST):** an arousal-0.9
  event vs matched 0.2 event, both run 365 days with naturalistic
  sleep/retell/ambient ticks: the emotional record must show ALL of —
  higher strength, fragmented `when`, intact core fields, cooled-but-
  present arousal (if retold socially), and intact confidence — while
  the neutral record may have archived. FAIL if any single parameter
  alone reproduces the whole signature (anti-Goodhart: the phenotype
  must be distributed across ≥3 mechanisms).

## 39. Honest limits (Part III)

- **The emotion enum is coarse** — seven labels for a continuous
  appraisal space. The literature's reliable memory contrasts are
  fear↔anger↔positive; disgust is thinner, shame/pride thinner still.
  Profiles should treat non-fear/anger multipliers as priors, not
  findings.
- **`emo_update_k` applies at retrieval, so unretrieved records keep
  their original tag** — probably correct (reconstruction is
  retrieval-side) but untested; a stored-tag version would drift
  records nobody ever re-accesses, which seems wrong.
- **Anniversary firing without awareness** models the Morgan spouse
  effect only if the source-monitoring layer can fail — implementers
  should NOT auto-narrate "because it's the anniversary"; the
  attribution is a reconstruction outcome.
- **`coherence` conflates narrative organization with processing** —
  the literature's mixed replication (§32) means `coh_intrusion_k`
  should stay modest; the mechanism is defensible, the effect size
  isn't settled.
- **Weapon focus vs unusualness** confound is inherited: a rare bright
  object might produce the same capture without threat. The spec
  exposes `threat_object` but a world could tag `salient_object` the
  same way — acceptable, since the sim doesn't distinguish the lab's
  confound either.
- **`recall_mood_pull` creates a genuine feedback loop** — a
  pathological character could spiral (mood→congruent recall→worse
  mood). This is a feature (real depression loops this way) but
  implementations need the pull small enough that one good day can
  break the chain — hence 0.05, and it is exactly what `rumin_k`
  profiles are for.
- **Odor-cue reach into childhood** interacts with the §4.14
  latent-infancy layer in a way the literature doesn't fully
  disambiguate: odor cues reaching sub-amnesia-exit records is
  [HYPOTHESIS] — the Chu & Downes bump peaked at 6–10, above the
  classic amnesia boundary but below the verbal bump; keep
  `odor_age_relief` gated to post-amnesia records unless evidence
  demands otherwise.
- Nothing here models **anticipatory affect** still (open loop from
  §25), nor **emotion in dreams** — the sleep tick manipulates tags,
  not dream-content; flagged for a future version alongside the
  intention-affect loop.
