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
