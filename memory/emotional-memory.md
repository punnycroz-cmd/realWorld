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


# Part IV — v41: the social life of leftover affect (2026-09-23, fourth pass)

Parts I–III built the tag, its birth, its decay, its grammar, and its
cue ecology. What is still missing is almost embarrassingly ordinary:
**arousal does not respect event boundaries** (§40), **the audience a
character keeps rewrites what they felt** — already in the spec as
drift, but the *mediator* was misread (§41), **letting it out makes it
worse** (§42), **the positive side has its own regulators** (§43),
**who is standing next to you changes what gets recorded** (§44),
**time lies in both directions** — duration dilates (§45) and failure
recedes (§46), **half the "emotional advantage" is just scarcity**
(§47), **sex differences are real and small** (§48), **some characters
can't tell their own feelings apart** (§49), **remembered emotion is
the input to forecasting, and the forecast is biased** (§50), and
**the jukebox is a cue channel** (§51). Spec delta (§52), age guidance
(§53), probes P409–P420 (§54), honest limits (§55).

Tag convention unchanged: **[CONSENSUS] / [DEBATED] / [HYPOTHESIS]**.

---

## 40. Residual arousal is fungible — excitation transfer and the misattribution window

The single most useful everyday fact about affect the model still
lacks: **sympathetic arousal outlives its trigger and leaks into the
next event.** Zillmann's excitation-transfer theory (Zillmann 1971;
Zillmann, Katcher & Milavsky 1972) rests on the slow decay of
sympathetic activity: heart rate and catecholamines return to baseline
over *tens of minutes*, not seconds, and residual activation from
event A intensifies the emotional response to unrelated event B.
Classic demonstrations: residual arousal from prior provocation or
exercise amplified later aggressive responding (Zillmann & Bryant
1974); erotic-film residue intensified subsequent emotion of either
sign (Cantor, Zillmann & Bryant 1975).

The famous field case is **Dutton & Aron 1974** (JPSP 30:510): men
interviewed by a female confederate on the 450-ft, 230-ft-high
Capilano suspension bridge produced more sexual imagery and were more
likely to phone her afterward than men interviewed on a low stable
bridge — read for fifty years as *misattributed arousal becomes
attraction*. Honesty flag: a careful reanalysis (Szczucka 2012) found
the misattribution interpretation not cleanly supported by the
original data (confounds in interviewer placement, sample
composition); the *phenomenon* (residual arousal intensifies a
concurrent emotional appraisal) is well-grounded in the excitation-
transfer literature, but the *label the residue takes* is [DEBATED].
The mechanism-safe reading: **carried arousal inflates the intensity
of the next tag; whether it also rotates valence toward the salient
concurrent target is the contested part** — we implement intensity as
CONSENSUS-grade and valence-rotation as a small gated term.

Implementation — character store gains one scalar state:

```
carryArous = 0 at rest;
on each event:   carryArous := max(carryArous, carry_frac·arousal_tag)
                 // carry_frac ≈ 0.35 — the tag, not the event's raw
                 // arousal: the felt residue is what's left AFTER
                 // peak-end weighting
decay:           carryArous *= exp(−Δt / carry_tau)
                 // carry_tau ≈ 0.014 day (~20 min half-life —
                 // sympathetic recovery timescale; Zillmann 1971
                 // puts behavioral transfer detectable at ~10+ min)
next event:      arousal_eff = arousal + misattrib_k·carryArous
                 // misattrib_k ≈ 0.4, applied to the PEAK-END tag
                 // inputs AND to the w_emo_arous E-term — residual
                 // arousal is real arousal to the encoder
valence rotation [DEBATED, gated]: if the next event's own |valence|
   < ambig_band (0.3) AND a co-present person is the salient
   attribution target, valence_tag shifts toward sign(social
   appraisal of that person) by misattr_rot_k·carryArous
   (misattr_rot_k ≈ 0.15 — small; P409 sign-checks it)
```

Sim consequence: a character who barely avoids a bike collision and
then stops for coffee carries ~0.3 arousal into the barista chat —
the chat's tag mints hotter, and if the chat is ambiguous and the
barista is salient, slightly warmer or colder depending on prior
appraisal. The near-miss itself decays; the *feeling* it loaned the
next scene does not get traced back. This is why people "bring work
home": the commute's arousal is spent on the partner conversation.
Also mechanically: a loud argument at one table primes the next table
over — ambient arousal has a spatial/social carry the ledger never
saw.

Boundaries: carried arousal below `carry_min` (0.05) does nothing
(jitter floor); carryover does NOT stack across multiple sources
(max, not sum — one physiological pool); it does not feed the §2.2
emotional blink (the blink is attentional capture, not residual).
Attribution rescue: if the dialogue layer supplies a salient
reappraisal cue ("that bridge was terrifying"), the carryover is
*discounted* by `attrib_rescue` (0.5) — informed subjects in
Schachter & Singer 1962 caught less of the confederate's emotion than
uninformed ones; knowing why your heart pounds discharges the loan.

---

## 41. Audience tuning revisited — the mediator is epistemic trust, and status flips the gate

§6.11 already drifts the speaker's own record toward the told version
(`audience_tune` 0.06, gated by credibility·ingroup). The v0.8 spec
got the *direction* right but left the mechanism priced as generic
credibility. The Echterhoff program says the real mediator is
**epistemic trust** — the experience of sharing reality with the
audience:

- Echterhoff, Higgins & Groll 2005 (JPSP 89:257): the memory bias
  appeared when the audience successfully identified the target
  (shared reality achieved) and for in-group audiences; NOT for
  out-group audiences. Mediated by trust in the audience's judgment
  about people — meta-analyzed across their experiments — and NOT by
  message rehearsal, source discrimination, or contrast effects. The
  bias survived a 2-week delay.
- Echterhoff, Higgins, Kopietz & Groll 2008 (JEP:G 137:3): the bias
  fired under shared-reality goals and NOT under politeness,
  incentive, entertainment, or blatant-compliance goals — compliance
  is performance, exactly as §6.11 already notes.
- Audience-status arm (Echterhoff et al., Swiss J Psychol 2017):
  tuning occurred toward both equal-status and high-status audiences,
  but the *memory* bias appeared only for the **equal-status** peer —
  the higher-status audience failed the epistemic-trust test
  (expertise ≠ shared reality). Counterintuitive and sim-relevant:
  the character doesn't internalize what she spins for the boss; she
  internalizes what she spins for her friend.

Spec consequences (deepening §6.11, no new section needed):

1. The gate's `credibility` factor should read **epistemic trust**
   (`PersonModel[aud].credibility` restricted to the *person-
   judgment* domain — the spec's §6.14 credibility is already
   domain-limited; audience tuning should use the social-judgment
   facet, not e.g. cooking expertise). [HYPOTHESIS: reuse
   `credibility` but only its social domain slot.]
2. **Status inversion:** when `audience.status > speaker.status`
   (a game-systems social field; world-supplied), multiply
   `audience_tune` by `aud_status_mult` ≈ 0.3 — the message is tuned
   as performance; the memory barely moves. Peer audiences keep
   full tuning.
3. **Arousal co-drift:** §6.11 drifts valence; Echterhoff's
   communicators also converged on *evaluation intensity* —
   add `m.emotional.arousal += aud_tune_arous·audience_tune·
   sign(toldArousal − m.arousal)` with `aud_tune_arous` ≈ 0.5
   (half the valence gain — intensity tunes weaker than sign).
4. Persistence: the drift is a permanent field write (it already
   is) — the 2-week persistence in Echterhoff 2005 justifies NOT
   decaying it; no change, stated for the record.

Emergent beat: a character who complains about a neighbor to a
sympathetic friend, repeatedly, ends up *genuinely remembering* the
neighbor worse — but the same complaint performed upward for the
landlord leaves her memory almost untouched. Flattery politics and
venting-to-friends have different memory costs, which is exactly the
difference RW viewers will be able to see.

---

## 42. Venting is rehearsal — the catharsis null

Folk theory says expressing anger drains it. The data say the
opposite, and the spec must not let a `vent` action accidentally act
as disclosure:

- Bushman, Baumeister & Stack 1999 (JPSP 76:367): participants led to
  believe in catharsis hit a punching bag harder AND were *more*
  aggressive afterward — media catharsis messages themselves license
  aggression.
- Bushman 2002 (PSPB 28:724): angered participants who hit a bag
  while thinking of the provoker (rumination condition) reported
  MORE anger and delivered MORE noise-blast aggression than both a
  distraction arm and a do-nothing control. **Doing nothing beat
  venting.** Rumination maintained the heat; distraction let it
  dissipate.
- Rusting & Nolen-Hoeksema 1998: emotion-focused rumination sustains
  angry mood; distraction releases it — same sign.

The mechanism sits inside what the spec already has: §8 rumination
(`rumin_k`) rehearses *affect*, not detail, and §16 verbal dampening
applies only to *disclosure* — processing-oriented telling (Pennebaker
paradigm). Venting while focused on the provoker is a **rumination
draw with an audience**, not a disclosure.

Spec: events/retells flagged `vent:true` (dialogue layer tags
expressive-anger tells) route to the rumination channel — affect_tag
heat maintained via `rumin_k`, `verbal_damp` explicitly NOT applied.
Frozen null: `catharsis_relief = 0` — there is no purge term, and
P411 fails any implementation where venting lowers arousal_tag faster
than silence. The asymmetry with §16 is the point: *talking it
through* cools the tag; *letting it out* stokes it.

---

## 43. The positive regulators — savoring and dampening

`regulate_style` (§17) is asymmetric: it prices suppression and
reappraisal of *negative* affect and leaves positive affect
unmanaged. Humans manage positive emotion too, in both directions:

- **Savoring** (Bryant & Veroff 2007, *Savoring*): deliberate
  amplification — reminiscence-sharing, self-congratulation,
  sensory-absorption — sustains and intensifies positive experience.
  Savoring capacity correlates with positive affect independent of
  negative affect levels.
- **Dampening** (Feldman, Joormann & Johnson 2008, Cogn Ther Res
  32:507): dampening responses to positive affect ("this won't last",
  "I don't deserve this") predict depressive symptomatology over and
  above rumination on the negative — the RPA subscale separates the
  two. Positive dampening is a depression-signature trait.

Spec: two new IndivTraits-adjacent traits, bible-settable:

- `savor` ∈ [0,1] — on retells and elaborative replays of
  `valence > savor_thresh` (0.4) records, `valence_tag +=
  savor_gain·savor` (savor_gain ≈ 0.2 per retell, bounded) and the
  tag's next fade tick is discounted ×(1 − 0.5·savor) — savoring
  literally slows the Fading Affect Bias for positive events. Loads
  on `extra`/`open` in the trait projection.
- `dampen` ∈ [0,1] — positive-tag fade multiplier ×(1 +
  `dampen_mult`·dampen), dampen_mult ≈ 0.5 — dampeners' positive
  affect decays up to ~1.5× faster. Loads on `neurot`, anti-loads on
  `extra`. A high-`dampen` + high-`rumin_k` character is the
  depressive profile the spec has been circling: negative heat
  maintained, positive heat bled.

This also fixes a calibration asymmetry: previously positive tags
could only fade or drift — there was no operator that made them
*stronger* short of re-encoding.

---

## 44. Company regulates encoding — the secure-base attenuation

Aversive encoding so far is a solitary affair: `arousal_tag` is set
from the event's trajectory regardless of who is standing there.
Social-baseline theory (Beckes & Coan 2011) says that's wrong —
expected load is shared with whoever is present:

- Coan, Schaefer & Davidson 2006 (Psych Sci 17:1032 — verified):
  16 married women under threat-of-shock during fMRI. Holding the
  husband's hand produced **pervasive attenuation** of threat-related
  neural activation; a stranger's hand produced **limited**
  attenuation; and the spousal effect was **moderated by marital
  quality** — better marriages, less threat response. Same-threat,
  same-stimulus, different company → different encoding conditions.
- Follow-ups extend it: familiar others attenuate even *anticipated*
  aversive response; the effect is graded by relationship quality,
  not binary presence (Coan et al. 2017 review).

Spec: at `encodeEvent`, when `arousal ≥ cond_thresh` (threat band)
and a co-present person's `PersonModel.trust ≥ secure_trust` (0.7):

```
arousal_tag *= (1 − secure_damp·tier_mult)
secure_damp ≈ 0.25 (CONSENSUS direction, magnitude HYPOTHESIS)
tier_mult: partner/very-high-trust 1.0 · relQuality
           close friend 0.6 · relQuality
           acquaintance/stranger ≈ 0.2  (stranger's-hand residue)
```

- Dampens the **tag only** — E, verbatim fields, and the ABC
  reallocation are untouched: the event still happened at full
  intensity; it is encoded *less scorching*. (Coan attenuated the
  threat response itself, so tag-level is the right locus.)
- `relQuality` reads the relationship-matrix warmth field — a bad
  marriage's hand does nothing, matching the marital-quality
  moderation literally.
- Interaction with §31 (persons-as-CondEntries): the trusted person
  is a *safety signal* — do NOT also mint a fear CondEntry on them.
  P414 checks the clean case.
- This is the mechanism behind "I'll go with you": accompaniment
  requests before scary events are rational memory hygiene for the
  character, not just social color.

---

## 45. Arousal dilates the remembered duration

The tag is duration-neglecting (§13 — peak-end), but the *content*
fields remember duration, and arousal inflates it. The
attentional-gate / pacemaker account (Droit-Volet & Meck 2007;
Droit-Volet & Gil 2009 review): arousal speeds the internal clock —
fear faces and arousing stimuli are systematically judged **longer**
than neutral ones of identical objective duration; the distortion is
present in children (fear-face dilation at age 3, Gil & Droit-Volet
2011) and grows with arousal. Retrospectively, an arousing interval
also tends to be remembered as fuller/longer because more was
encoded (more ticks of content = more inferred time — Ornstein's
storage-size account, 1969).

Spec: `verbatim.duration` (the record's remembered-length field) is
minted at:

```
verbatim.duration = true_duration · (1 + dur_dil·arousal_tag)
dur_dil ≈ 0.4  // an arousal-1.0 event is remembered ~1.4× as long;
               // lab dilation on emotional faces ~ +10–20% at
               // seconds scale; retrospective inflation runs larger
               // (storage-size compounds) — HYPOTHESIS magnitude,
               // CONSENSUS direction
```

Consequences: the robbery "lasted forever"; the wonderful party also
runs long — the dilation is valence-blind (arousal-driven), which is
correct: the lab dilation tracks arousal not pleasantness
(Droit-Volet & Gil 2009; pleasant music judged *shorter* at matched
tempo/arousal — valence may even counteract slightly, folded into
dur_dil being arousal-only). P413 checks the valence-blind sign.

---

## 46. Failure feels farther — subjective temporal distance

`dateEstimate` (§6.15) reports *when*; nothing reports how *far it
feels*. Ross & Wilson 2002 (JPSP 82:792 — verified, 3 studies):
people feel subjectively **farther** from past selves/events with
unfavorable implications than from equally distant flattering ones —
randomized assignment to negative vs positive pasts produced the
bias; it was **stronger in high-self-esteem** participants and
applied to **personal but not acquaintances'** events. Rehearsal
frequency and ease-of-recall predicted distance but did NOT mediate
the self-esteem × valence interaction — the distance is motivated,
not mnemonic. Wilson & Ross 2003: the same mechanism lets people
credit close successes and dismiss distant failures, manufacturing
perceived improvement over time.

Spec: a *report-layer* transform, kept strictly off the decay clock
(t_eff untouched — the memory isn't weaker, it just feels older):

```
subjDist = reported_age · (1 + tdist_val·(−valence_tag)·
                           (0.5 + self_est))
tdist_val ≈ 0.3, self_est ∈ [0,1] trait (existing self_est_bias
             projection supplies it)
personal events only: selfRelevance ≥ 0.4 else ×0
acquaintance/witnessed-about-others events: ×0 (null — Ross &
             Wilson's own boundary)
```

A high-self-esteem character's failure from three years ago "feels
like another lifetime"; the same-season triumph "feels like
yesterday". A low-self-esteem character keeps both at honest
distance — or slightly inverted: low-self-esteem respondents
distanced less, and depressive realism can reverse it. This feeds
the §6.34 narrative-self layer directly: temporal self-appraisal is
one of its documented inputs and was previously unparameterized.

---

## 47. Part of the advantage is just scarcity — the distinctiveness confound

The spec prices emotional enhancement as pure amygdala consolidation
(`w_emo` → delay-growing advantage, §1). A large literature says part
of the effect is *not* affective at all:

- Schmidt 1991; Schmidt & Saari 2007 (Mem Cogn 35:1905 — verified):
  taboo/negative words beat neutral ones via *three* separable
  routes — attention capture, post-stimulus elaboration, and **item
  distinctiveness**; nonthreatening emotional words gained ONLY
  through distinctiveness.
- Talmi, Luk, McGarry & Moscovitch 2007 (JML 56:555 — verified):
  emotional items are more organized AND more distinctive; in
  **pure lists** (removing the mixed-list distinctiveness advantage)
  the immediate emotional-memory advantage was **eliminated** against
  matched related neutral items.
- Reconciliation [DEBATED → adopted split]: the distinctiveness
  component is an *immediate-test* phenomenon (list composition);
  the consolidation component grows with delay (§1's own evidence).
  Pure-list elimination at immediate test does not erase the
  amygdala-modulation story — it prices the two apart.

Spec: split `w_emo` (currently a single 0.9) into

```
w_emo = w_emo_arous + w_emo_dist_eff
w_emo_arous ≈ 0.55   // true arousal/consolidation term — carries
                     // the delay-growing advantage, sex modulation
                     // (§48), inverted-U bending (§27), aging-flat
w_emo_dist  ≈ 0.35   // immediate distinctiveness term
w_emo_dist_eff = w_emo_dist · (1 − emo_rate)
emo_rate   // per-character running mean share of arousal≥0.5
           // records among the day's encodings; init 0.15,
           // update emo_rate += 0.01·(day_share − emo_rate)
```

The emergent behavior is the payoff: **a character whose life is
chronically dramatic gets less per-event enhancement** — their
emotional events are not distinctive against their own store
(secondary distinctiveness collapses with `emo_rate` high). Drama-
queen lives normalize their own dramas; the quiet character's rare
fight is unforgettable. This is the within-person version of the
pure-list result and it costs one running scalar.

`w_emo` is kept as the derived sum for backward compatibility;
loaders should reject configs that set all three independently.

---

## 48. Sex differences, honestly small

- Canli, Desmond, Zhao & Gabrieli 2002 (PNAS 99:10789 — verified):
  at recognition 3 weeks out, women remembered the *most arousing*
  pictures better than men — and the effect held at *equal rated
  arousal*, ruling out "women just felt more." Women showed more
  overlap between regions tracking current emotion and regions
  predicting subsequent memory.
- Cahill et al. 2001; Cahill 2003 review: sex × hemisphere
  lateralization of amygdala-memory coupling (men ~right, women
  ~left); Cahill's interpretation — right/global-central vs
  left/local-detail — predicts a small female edge on detail and a
  male edge on gist, matching the behavioral pattern loosely.
- Andreano & Cahill 2009 (Neurosci Biobehav Rev): sex influences are
  reliable but modest; hormonal state modulates (menstrual phase,
  hormonal contraception dampens the emotional-memory advantage).
  Overall behavioral effect size in the emotional-memory literature
  is small — d ≈ 0.2–0.3 territory, not a headline difference.

Spec: `emo_sex_gain ≈ +0.07` — female characters get
`w_emo_arous ×(1 + emo_sex_gain)` and a matched small boost on
`emo_consol_gain`; nothing else. Deliberately below personality
variance (trait jitter ±5–10% exceeds it) — sex is a real but
second-order knob here, which is what the data support. The
perimenopause overlay (§4.17) already carries the hormonal
modulation for the 45–55 band; `emo_sex_gain` is the flat
adult-band term. [CONSENSUS direction; magnitude DEBATED → clamp
small.]

---

## 49. Emotional granularity — tag precision as a trait

§26 gave the tag a discrete-emotion field. Whether a character can
actually *use* it varies — emotional granularity / differentiation
(Barrett 2004; Lindquist & Barrett 2008):

- High-granularity people distinguish anger/sadness/shame/anxiety
  precisely; low-granularity people report undifferentiated
  valence ("I felt bad").
- Kashdan, Barrett & McKnight 2015: low granularity is associated
  with worse emotion regulation and is elevated in depression and
  social anxiety — granularity is a *regulation prerequisite*, not
  just vocabulary.
- Granularity is partly trainable and partly trait-stable — a bible
  parameter, not a mood.

Spec: `emo_gran ∈ [0,1]` trait (loads on `open`, `verbal`,
anti-`neurot`):

1. **Tag precision:** `emotion` enum is assigned with precision
   `emo_gran` — below `gran_thresh` (0.4) records mint
   `emotion:"mixed"` (valence-only). Low-gran characters literally
   can't tell their own records' feelings apart — downstream, their
   emotion-specific regulation and §26 appraisal-tendency effects
   (fear→avoidance vs anger→approach) flatten to valence-graded
   mush.
2. **Regulation efficacy:** `reg_reappraise_k` effective value
   scales ×(0.5 + 0.5·emo_gran) — you cannot reappraise a feeling
   you cannot name (Kashdan 2015 mediation chain).
3. **Rewrite surface:** low-gran records are MORE susceptible to
   §28 later-outcome rewriting and §41 audience tuning
   (+`(1−emo_gran)·0.5` on those k's) — coarser tags have fewer
   anchors against re-appraisal. [HYPOTHESIS — the granularity
   literature supports regulation efficacy; the memory-rewrite
   susceptibility is our extension, flagged.]

The believable-human payoff: two characters encode the same breakup;
one remembers "betrayed, then relieved", the other remembers
"bad". Only the first can learn from it precisely — and only the
second gets it rewritten wholesale by the next conversation.

---

## 50. Forecasting from memory — the impact bias

§34 closed the recall→mood loop; §5.34 thinned old futures. One open
loop from §25 remains: **remembered emotion feeds predictions, and
the prediction machinery is biased**:

- Affective forecasting (Wilson & Gilbert 2003 review; Gilbert et
  al. 1998): people overestimate both the **intensity** and
  especially the **duration** of future emotional reactions — the
  impact bias. Immune neglect (Gilbert et al. 1998): forecasters
  under-weight their own psychological immune system — they predict
  wounds that last because they can't foresee that they'll narrate
  the wound into meaning (§32's repair, invisible to the forecaster).
- Focalism (Wilson et al. 2000): forecasts fixate on the focal event
  and omit all the ordinary life that will fill the interval.

Spec: `imagineEvent`/`anticipatedEvent` outputs for future scenarios
carry predicted affect computed as:

```
forecast_valence = valence_estimate · forecast_int_bias   // ≈1.15
forecast_dur     = duration_estimate · forecast_dur_bias  // ≈1.6
// immune neglect: if the character carries §32-style narrative
// repair capacity (coh_gain operative, gran > 0.4), the BIAS
// STILL applies — the point of immune neglect is that the repair
// capacity is invisible prospectively
```

Behavioral consequence, not just a report: characters *avoid* or
*pursue* based on these inflated forecasts — dreading the landlord
confrontation more than it will hurt, expecting the reunion to feel
better-and-longer than it will. The memory system supplies the
biased forecast because its inputs (peak-end tags, rehearsed
worst-fields) are the same samples that biased human forecasters.
[CONSENSUS bias; magnitudes HYPOTHESIS — lab overestimates run
~30–60% on duration.]

---

## 51. The jukebox cue — music-evoked recall

§29 made odor the privileged sensory channel. The second-privileged
channel is music, and RW's world is full of it (the bar's jukebox,
someone's window):

- Janata, Tomic & Rakowski 2007 (Memory 15:845 — verified): ~30% of
  familiar song excerpts evoked autobiographical memories; the
  evoked emotions were predominantly positive, **nostalgia the third
  most common**; both specific episodes and lifetime-period
  summaries surfaced.
- Music-evoked AMs skew to the reminiscence-bump era — the songs of
  15–25 encode strongest as cues (Janata et al.; Krumhansl's
  "reminiscence bump" for music, 2017); music cues are
  *era-indexed*, which odor cues are not.
- MEAMs are vivid and social-context-rich (El Haj, Fasotti & Allain
  2012; recent acoustic-feature work shows low-energy/acoustic songs
  evoke slower, more vivid, more unique memories — 2025 replication
  support for channel-level salience).

Spec: cue-vector gains a `music` key (event `cueVector.music`
populated when a recognized song was playing — game-systems tags
`era_song:true` when the track belongs to the character's bump
window):

```
c_music = cue_music_w · overlap · (1 + music_era_gain·era_match)
cue_music_w ≈ 0.35   // below odor channel (w_sensory-equivalent
                     // Proust pricing) but above w_when
music_era_gain ≈ 1.5 // bump-era songs reach like odor reaches age
nostalgia_flag: on MEAM-style hits (era_match + valence>0.3)
              emission may carry `nostalgic:true` (report layer —
              §34 nostalgia_gain already has the mood effect)
```

The two channels differ in what they index: **odor reaches age**
(deeper into childhood), **music reaches era** (denser in the bump).
A character's youth comes back through speakers; their childhood
comes back through smells. Both involuntary — the scan treats
`c_music` like `c_sensory`.

---

## 52. Spec delta (v3.9 → v4.0)

Params (all new, clamp ranges in profiles §0):

- `carry_frac` 0.35, `carry_tau` 0.014 d, `misattrib_k` 0.4,
  `misattr_rot_k` 0.15, `carry_min` 0.05, `attrib_rescue` 0.5 — §40
- `aud_status_mult` 0.3, `aud_tune_arous` 0.5 — §41 (§6.11 deepening;
  `audience_tune`, `shared_reality_gate` unchanged)
- `vent:true` routing + frozen `catharsis_relief = 0` — §42
- `savor` trait, `savor_gain` 0.2, `savor_thresh` 0.4; `dampen`
  trait, `dampen_mult` 0.5 — §43
- `secure_trust` 0.7, `secure_damp` 0.25, tier_mults {1.0, 0.6, 0.2}
  — §44
- `dur_dil` 0.4 on `verbatim.duration` birth — §45
- `tdist_val` 0.3, `tdist_self` 0.5 (report-layer only) — §46
- `w_emo` split → `w_emo_arous` 0.55 + `w_emo_dist` 0.35;
  `emo_rate` running state (init 0.15, α 0.01) — §47
- `emo_sex_gain` 0.07 — §48
- `emo_gran` trait, `gran_thresh` 0.4, reappraisal scaling
  ×(0.5+0.5·emo_gran), rewrite-surface bonus — §49
- `forecast_int_bias` 1.15, `forecast_dur_bias` 1.6 — §50
- `cue_music_w` 0.35, `music_era_gain` 1.5, `music` cueVector key,
  `nostalgic:true` emission flag — §51

Character store: `carryArous` (scalar state, decays on every tick —
snapshot field), `emo_rate` (running mean — snapshot field).
Record fields: `emotion:"mixed"` permitted value; `verbatim.duration`
already schema'd.
Contract: `retell` accepts `vent:true`; `imagineEvent` outputs gain
`forecast_*` fields; Reconstructions may carry `nostalgic:true`;
`dateEstimate`/`describeRecall` report layer gains `subjDist` —
all snapshot-additive, absent = legacy.

## 53. Age guidance (extends §§10/23/37)

- `carry_tau`, `carry_frac`: age-flat [HYPOTHESIS — no lifespan
  excitation-transfer work; sympathetic recovery slows modestly with
  age, defer a knot until evidence].
- `secure_damp`: attachment-mediated → rides the existing
  `attach_avoid` trait axis; avoidant characters take ~half the
  attenuation (secure-base is *relational*, not presence — Coan's
  marital-quality moderation generalizes to attachment quality).
- `savor`: positivity-effect adjacent — knot ×1.15 at 65 (older
  adults savor more; Carstensen-adjacent, HYPOTHESIS); `dampen`:
  ×0.8 at 65.
- `tdist_val`: self-esteem moderated; older adults' self-appraisal
  is more benign → effective distancing shrinks ~×0.8 at 70
  (HYPOTHESIS).
- `emo_gran`: slight decline after 60 (×0.9 at 70 — differentiation
  literature thin, HYPOTHESIS); child knot ×0.5 below 10 (young
  children ARE low-granularity — developmental consensus).
- `emo_sex_gain`, `w_emo` split, `dur_dil`, `cue_music_w`,
  `forecast_*`: declared AGE-FLAT (P412/P416/P418 guards).
- `aud_status_mult`: no age knot (status ecology is social, not
  developmental) — flat, guarded.

## 54. Validation probes (P409–P420; registry continues)

- **P409 excitation transfer (MUST — sign + window):** arousal-0.8
  event, then ambiguous-valence (|v|<0.3) event at Δt ∈ {5, 25,
  90} min: second event's `arousal_tag` elevated at 5 and 25 min,
  gone at 90 (`carry_tau` ×~4.5); with `attrib_rescue` cue present,
  elevation halved. Fails if carryover is event-boundary-clean.
- **P410 status inversion (MUST):** same speaker+record, retell to
  peer vs higher-status audience: peer arm shows `audience_tune`
  drift, high-status arm shows ≤0.4× the drift with identical
  told slant.
- **P411 catharsis null (MUST — explicit null):** anger record;
  three `vent:true` retells vs three silence days: arousal_tag
  under venting ≥ silence arm (never below); `verbal_damp` must
  NOT fire on vent-flagged tells. Any "venting relieved it"
  implementation fails the suite.
- **P412 savor/dampen split (MUST):** matched positive record;
  high-`savor` character's tag is elevated after 2 retells and
  fades slower over 30d; high-`dampen` fades ≥1.3× faster —
  divergence from the same record.
- **P413 duration dilation (MUST — valence-blind):** arousal-0.8
  events at valence ±0.6: `verbatim.duration` inflated ~1.3× BOTH
  arms; fails if only negative dilates or if the tag (not the
  field) carries the effect.
- **P414 secure base (MUST):** identical threat event solo vs
  co-present partner (`trust 0.8, relQuality 0.9`): partner arm
  mints `arousal_tag` ~0.75–0.8× of solo; verbatim/E identical
  (tag-only locus); low-relQuality partner ≈ stranger ≈ ×0.95.
- **P415 subjective distance (MUST — motivational sign):** two
  personal records same true_age, valence ±0.5, high-self_est:
  negative reports ~1.15× farther `subjDist` while
  `reported_age`/decay unchanged; acquaintance-topic records: no
  effect (Ross & Wilson boundary locked).
- **P416 distinctiveness habituation (SHOULD — emergent):** two
  characters, emo_rate forced to 0.1 vs 0.5: identical arousal-0.7
  event → quiet-life character retains higher E at immediate test;
  at 30d the gap shrinks (the w_emo_arous residue is
  delay-persistent, w_emo_dist isn't) — the split must produce the
  Talmi crossover, not just a scalar difference.
- **P417 sex gain bounds (SHOULD):** matched profiles differing
  only in `sex`: female emotional-memory advantage present but
  SMALLER than a ±1σ neurot swing — bounds check, not magnitude
  target.
- **P418 granularity gate (MUST):** `emo_gran` 0.9 vs 0.2
  characters: high mints discrete `emotion` tags and shows full
  reappraisal efficacy; low mints `"mixed"` ≥60% and shows ≤0.75×
  reappraisal damping and ≥1.25× §41/§28 rewrite acceptance.
- **P419 impact bias (SHOULD):** `imagineEvent` on a dreaded future
  confrontation: `forecast_dur`/`forecast_int` fields overshoot the
  eventual encoded tag by the bias factors even for a
  high-coherence character (immune-neglect lock — repair capacity
  must NOT shrink the forecast).
- **P420 music era-cue (SHOULD):** bump-era vs post-bump song as
  sole cue: era-matched cue evokes ≥1.5× hits and may carry
  `nostalgic:true`; mismatched-era familiar song still outperforms
  a neutral-sound cue (channel real, era bonus on top).

Registry now P1–P420; numbering stable.

## 55. Honest limits (Part IV)

- **Excitation-transfer timescale is the least-nailed constant** in
  this pass: `carry_tau` ~20 min rests on Zillmann-era sympathetic-
  recovery estimates, not memory studies; the *mechanism* is solid,
  the number is a prior. P409 checks the window shape, not the
  exact τ.
- **Misattributed-valence rotation** is the contested reading of a
  contested study (Szczucka 2012 vs Dutton & Aron 1974). The spec
  implements it small and gated; an implementation that drops
  `misattr_rot_k` to 0 loses a charming mechanic but no consensus.
- **Audience-tuning trust mediation** is reused from §6.11's
  credibility field — the Echterhoff mediator is specifically
  *epistemic* trust about social judgment; if §6.14 credibility
  turns out domain-general in the implementation, the gate is
  slightly too permissive, directionally safe.
- **Savoring/dampening magnitudes** are questionnaire-correlational
  in source; the ±0.2/0.5 gains are calibrations to the model's
  scale, not measured constants.
- **Secure-base attenuation** measured threat-*response*
  attenuation, not memory-tag attenuation — the leap is that the
  tag prices felt arousal, which is what was attenuated. Tag-locus
  (not E-locus) is the conservative reading; P414 locks it.
- **The distinctiveness split** adopts the Talmi/Schmidt
  reconciliation (immediate distinctiveness + delayed
  consolidation); the pure-list *elimination* at immediate test
  remains [DEBATED] against amygdala accounts — `w_emo_arous`
  keeping 60% of the weight is the negotiated split, not a
  measured ratio.
- **`emo_rate` habituation** is our within-person extension of a
  list-composition effect — [HYPOTHESIS] but falsifiable (P416) and
  it produces a behavior viewers will recognize.
- **Granularity→rewrite-susceptibility** link is flagged
  [HYPOTHESIS] in §49 — granularity regulates feelings; whether it
  anchors *records* against re-appraisal is extrapolation.
- Still unmodeled from §39's list: anticipatory *encoding* of dread
  (the pre-event trace), emotion in dreams, and the
  intention-affect loop — next passes.

---

# Part V — v53: the feeling that arrives early, stays secondhand, and heals on schedule (2026-09-23, fifth pass)

Parts I–IV priced the record-level machinery (encoding, consolidation,
trauma), the affect-tag layer (birth, sleep, regulation), the feeling's
grammar (discrete emotions, inverted-U, time), and the social life of
leftover affect (carryover, venting, savoring). What §39/§55 listed as
still unmodeled — **anticipatory encoding** (the pre-event trace),
**emotion in dreams** — lands here, joined by eight more legs the
earlier passes left implicit: betrayal's closeness multiplier,
secondhand fear, the shame/guilt split, forgiveness's thaw on the
rumination loop, nostalgia as self-medication, mood-congruent
confabulation, emotional inertia, and repetition's habituation of the
tag. Tag convention unchanged: **[CONSENSUS] / [DEBATED] /
[HYPOTHESIS]**.

---

## 56. Anticipation mints its own trace — the pre-event record

Van Boven & Ashworth 2007 (*JEP:G* 136:289 — verified, five
experiments): anticipation is more evocative than retrospection —
people feel MORE about an upcoming Thanksgiving than the remembered
one, across positive, negative, routine, and hypothetical events;
mediated by more extensive mental simulation of future than past
events. The imagination-inflation literature (Garry et al. 1996;
§6.9's `imagine_gain`) supplies the mechanism leg: simulated events
write records. So a dreaded meeting is not free until it happens —
every pre-living writes a hot trace.

**[CONSENSUS]** that anticipatory affect exceeds retrospective affect
and that simulation mediates it; **[HYPOTHESIS]** the sim translation
below.

**Spec consequence (§4.28, "anticipatory records"):** when the world
schedules a salient future event for a character (a known court date,
a planned confrontation, a wedding — game-systems marks it
`anticipated` on the request/schedule layer):

```
mint record { anticip:true, source:"imagined",
              arousal_tag = anticip_gain·expectedArousal,  // ≈0.4
              valence_tag = expected valence, verbatim thin }
each dwell/simulation tick on the expected event (worry, rehearsal,
    planning thought — flagged by the substrate or counted via
    ambientMemoryScan hits on the anticip record):
    retell-equivalent boost (strength up, drift applies —
    imagined details CONFABULATE INTO the trace; the feared version
    sharpens, §63 mood-congruent fill)
at the real event's encodeEvent:
    the anticip record does NOT merge destructively — it becomes a
    competing same-event trace (source:"imagined" vs "event"); the
    experienced tag is the peak-end output of the REAL affectSeries,
    the anticip trace keeps its own tag
    expectation gap → if |real_tag − anticip_tag| > 0.4:
        mint a small mismatch record ("it wasn't as bad as I feared"
        / "it was worse than I imagined") — relief/disappointment is
        the meta-emotion of the gap (Shepperd & McNulty 2002)
```

Emergent: the character who dreads a conversation for a week has a
week-old memory of a confrontation that hasn't happened; when it goes
fine, she remembers BOTH the dread and the reality — and the relief
attaches to the person who turned out kind. Characters who never
anticipate (`anticip` never flagged — the impulsive, the present-
focused) live without this drag and without the relief. (P545)

---

## 57. Betrayal prices the perpetrator's closeness — and then hides

Freyd's betrayal trauma theory (1994/1996): violations by someone the
victim depends on are handled differently — awareness is suppressed to
preserve the necessary attachment. The empirical record is genuinely
mixed: Freyd, DePrince & Zurbriggen 2001 report self-reported memory
for abuse depending on victim-perpetrator relationship; Lindblom &
Gray 2009 find more betrayal → less detailed narratives (but the
effect attenuates controlling for avoidance); McNally's 2007 critical
appraisal finds no convincing evidence for true amnesia — non-
disclosure and avoidance of thought explain most cases.

**[DEBATED — real signal is avoidance/detail-thinness, not erasure.
We implement that version: betrayal records are HOT and THIN and
UNVOLUNTEERED, never missing.]**

**Spec consequence (§4.29):** on encoding of an event with valence <
−0.3 where `cueVector.people` includes a perpetrator with
relationship trust ≥ `betrayal_thresh` (0.6):

```
arousal_tag *= (1 + betrayal_trust_gain·trust)   // ≈0.35 — the wound
               // scales with how close the hand was
verbatim detail fields encode at (1 − betrayal_thin·trust)  // ≈0.3 —
               // Lindblom & Gray's detail deficit, mechanism-agnostic
record flag betrayal:true
```

Retrieval side (§5.54-adjacent): `betrayal:true` records get a
voluntary-recall discount `betrayal_avoid_k` (0.4 — the character
steers around it; implemented as a `suppressEvent`-equivalent
automatic apply, θ bump R-side only) AND an intrusion discount of
−0.1 (§5.7 — it surfaces unbidden precisely because it is avoided).
If the relationship SURVIVES (trust stays high), the avoid leg
persists; if the relationship breaks, avoidance relaxes over ~30 days
and the record is finally retellable — Freyd's "awareness threatens
the needed relationship" logic, inverted correctly: leaving the
relationship frees the memory. (P546)

Emergent: the friend who betrayed her is remembered in hot fragments
she never brings up; strangers get a vaguer, cooler version; and when
the friendship finally dies, the story comes out whole — viewers will
read it as "she could only say it once it was over."

---

## 58. Witnessing teaches fear — secondhand conditioning

Olsson & Phelps 2007 (*Nat. Neurosci.* 10:1095 review) and Olsson,
Nearing & Phelps 2007 (*SCAN* 2:3 — verified): fear acquired by
OBSERVING another's aversive event engages the same amygdala
machinery as direct conditioning, and observational fear can be as
strong as directly experienced fear; instructed fear (being told)
works too, weaker (Phelps et al. 2001). Most human fears are probably
not first-hand.

**[CONSENSUS]** on observational > instructed > none ordering and
shared mechanism.

**Spec consequence (§4.29):** §4.9 conditioned-affect acquisition gets
three routes:

```
direct (victim self):        strength += cond_gain·arousal   // as before
witness (present, not target):
    if observed arousal ≥ cond_thresh AND observer attention ≥ att_min:
        strength += vic_cond_mult·cond_gain·arousal  // vic_cond_mult≈0.6
    AND mint a thin episodic record marked witnessed:true
        (it is THEIR memory of HIS bad night — the dread is hers)
instructed (hears an arousing account — hearAccount with teller
    emotional arousal ≥ cond_thresh):
    strength += inst_cond_mult·cond_gain·arousal   // ≈0.3
    // no episodic record needed — pure cue tag (Phelps 2001 route)
```

All routes share §4.9's decay/extinction/renewal machinery and §18's
generalization width. Emergent: she watched him get fired at the
coffeehouse and now flinches at the counter; the story of the
break-in two streets over is enough to change her walk home — no
record of a crime she never saw required. Vicarious positive
conditioning exists too (`vic_cond_mult` applies to valence >0
arousal ≥0.6) — the shared celebration marks the venue for both.
(P547)

---

## 59. The dream draw goes emotional — and skews dark

§4.24 (v4.7) mints dream records with world-supplied salience. The
dream-content literature supplies what the salience draw should be:

- Continuity hypothesis (Domhoff 2003; Schredl reviews — verified):
  dream content reflects waking concerns, selectively — mundane
  activities underrepresented, emotional concerns over.
- Negative bias is real, not sampling artifact: Valli et al. 2008
  (*Cogn Emot* — verified): threats much more frequent and severe in
  dreams than in matched real-life event logs; current dream threats
  resemble PAST real threats. Revonsuo's TST explanation is
  [DEBATED]; the bias itself is [CONSENSUS].
- Waking well-being tracks dream affect longitudinally (Pesant &
  Zadra 2006 — verified): low PWB → more aggressive/negative dream
  content over years.

**Spec consequence (§5.53 — replaces the "world supplies salience"
clause of §4.24):**

```
dream draw at sleep tick: sample the night's Poisson(dream_mint)
    records from the character's OWN live episodic store, weight ∝
    dream_emo_w·arousal·recency_factor + (1−dream_emo_w)·strength
    // dream_emo_w ≈ 0.6 — mostly the hot queue, plus a tail into
    // old strong records (Valli: current threats resemble past ones)
negative skew: sampling valence weight ∝ (1 − dream_neg_bias·valence)
    // dream_neg_bias ≈ 0.15 — modest, matched-event bias size
mood dependence: when character mean-mood < 0, dream_neg_bias
    effectively doubles (Pesant & Zadra longitudinal leg)
```

Everything downstream of §4.24 is unchanged — wake-gated recall,
tau_dream, `dream_cond_mult` residue into §4.9. The change is the
draw: dreams stop being story-supplied set-pieces and become what the
character actually carried to bed. Emergent: the fight dreamt that
night; the month of low mood dreamt darker than the days deserved;
the old trauma surfacing in dreams years later without any current
cause. (P548)

---

## 60. Shame looks away, guilt rehearses

Self-conscious emotions split on the self/behavior axis (Tangney —
Lewis's distinction, Tangney et al. 1996 verified): shame = "I am
bad" (self-focused, withdrawal, others' imagined evaluation); guilt =
"I did bad" (behavior-focused, empathy, repair). Memory
phenomenology: shame memories show MORE observer-perspective (3PP)
recall than guilt or neutral negative (D'Argembeau-group diary study,
*Memory* 2023 — verified); shame predicts intrusions AND avoidance
correlated with clinical symptoms (Conway-extension study — verified:
shame events were mostly NOT very negative except for the shame).
Guilt-proneness is unrelated to psychopathology and drives amends.

**[CONSENSUS]** on the shame/guilt behavioral split and shame's
observer-perspective signature.

**Spec consequence (§5.54):** records tagged `emotion:"shame"` or
`"guilt"` (§26 discrete tag; minted when valence<0, selfRelevance
high, and the event's own-agent causal flag is set):

```
shame:  voluntary recall p *= (1 − shame_avoid_k)      // ≈0.35
        intrusion_thresh −= shame_intrude_k            // ≈0.15 —
        // avoided AND intrusive (the clinical signature)
        Reconstructions emit perspective:"observer" at ~2× base rate
        retell refusal bias: discussEvent on shame records routes
        to deflection unless trust > 0.7
guilt:  rumin-style rehearsal boost guilt_rehearse_k (≈0.3) BUT the
        rehearsal is action-bound: each rehearsal increments an
        `amends_urge` counter the behavior layer can read (§10 hook)
        — guilt replays toward repair, shame replays toward hiding
```

Emergent: the shame character goes visibly quiet when the topic
circles the party story, then mentions it unprompted at 1 a.m.; the
guilt character brings up the forgotten favor until he makes it
right. Same negative valence, opposite memory behavior — this is the
split `w_emo_neg` cannot express. (P549)

---

## 61. Forgiveness thaws the loop — the rehearsal gate on the offender

McCullough, Bono & Root 2007 (*JPSP* 92:490 — verified, three
longitudinal studies): within-person rumination increases predict
forgiveness DECREASES (cross-lag direction favors rumination→
unforgiveness); mediated by anger, not fear. McCullough et al. 2001:
vengefulness tracks rumination. So the rumination loop (§8's
`rumin_k`, §42's venting route) needs a per-dyad gate, not just a
trait.

**[CONSENSUS]** on the rumination–unforgiveness loop and its causal
direction.

**Spec consequence (§5.55):** RelEdge gains optional `forgive` ∈
[0,1] (default 0 for fresh transgressions; world/behavior layer
drives it — apology events, amends, time). For negative records whose
`cueVector.people` includes that dyad partner:

```
rehearsal/intrusion probability *= (1 − forgive·forgive_rumin_k)
                                   // forgive_rumin_k ≈ 0.7 —
                                   // forgiven wounds stop rehearsing,
                                   // they don't get erased
strength/decay unchanged — the record stays; the LOOP starves
arousal_tag decay unchanged (§14/§4.5) — forgiveness quiets
    rehearsal-driven re-stamping, the residual heat fades on its
    normal clock, faster in effect because rumin re-stamping stops
feedback the other direction (the documented causal arrow):
    each unforgiven rehearsal nudges forgive −0.02; each completed
    amends (guilt §60) nudges +0.1 — the loop is causal both ways,
    weighted toward rumination→unforgiveness per the cross-lags
```

Emergent: a forgiven betrayal still intrudes occasionally (the
record is intact) but the nightly replay dies; an unforgiven slight
stays radioactive indefinitely and each replay digs the grudge
deeper — the rumination-forgiveness spiral is now a mechanism, not
an annotation. (P550)

---

## 62. Nostalgia is the mind's self-medication

Wildschut et al. 2006 (*JPSP* 91:975 — verified): nostalgia induction
raises positive affect, self-regard, social connectedness; nostalgic
narratives are redemptive and self-central. Routledge et al. 2011
(*JPSP* 101:638 — verified): meaning threat INCREASES nostalgia;
nostalgia restores meaning via connectedness; buffers the threat→
wellbeing link. Sedikides-group program: negative states (loneliness,
boredom, meaninglessness) trigger nostalgic recall — it is an
endogenous emotion-regulation tool.

**[CONSENSUS]** on the trigger-by-distress → mood-lift function loop.

**Spec consequence (§5.56):**

```
trigger: ambientMemoryScan's draw gains a regulation term — when
    C.mood < −0.2, sampling weight of records flagged nostalgic:true
    (§51 music route) OR positive + old (age > 180d) + people-rich
    is multiplied by (1 + nostalgia_trigger_k·|C.mood|)
    // nostalgia_trigger_k ≈ 0.3 — sad characters reach for the
    // warm archive; the trigger is distress, not randomness
on emission of a nostalgic record: C.mood += nostalgia_lift·(1−|C.mood|)
    // nostalgia_lift ≈ 0.15 — a real mood nudge, self-limiting;
    // §34's recall→mood feedback already exists — this is the
    // valence-specific instance with the documented function
```

Emergent: the lonely evening pulls up the summer record unbidden and
the night ends lighter; bittersweet is real — the emitted tag is
positive-with-loss (§49 "mixed"), which is exactly the nostalgic
signature the literature describes. (P551)

---

## 63. Mood fills the gaps — mood-congruent confabulation and the liberal criterion

§8's `mood_bleed` shifts the *tag* of what is reconstructed; the
fill-content literature adds that mood steers *what gets invented*:

- Ruci, Tomes & Zelenski 2009 (*Cogn Emot* 23:1153 — verified):
  mood-congruent DRM false recall elevated — negative mood produces
  more negative critical-lure intrusions, positive likewise; and more
  "remember" judgments for mood-matched lures.
- Corson & Verrier 2007 (verified): LOW-arousal moods raise false
  recognition regardless of valence — liberal criterion under calm
  states, item-specific memory under arousal.
- Mood-congruent recall generally (Matt et al. 1992 meta, already §8).

**[CONSENSUS]** on mood-congruent false memory; the low-arousal
criterion shift is a second, separable leg.

**Spec consequence (§6.72):**

```
confab_fill content selection (§6.2): when generating schema fills,
    candidate fills weighted toward mood-matching valence —
    mood_confab_k ≈ 0.25: a sad character's invented details skew
    negative (the forgotten meeting is remembered as having gone
    worse in its unfilled parts)
recognition lure criterion (§5.x): at low current arousal
    (|C.mood|<0.3 && C.arousal<0.3) the lure_accept threshold
    effectively shifts liberal: lure_accept += mood_crit_shift
    (≈0.1); under arousal ≥0.6, shift negative — arousal tightens
```

Emergent: depressed characters don't just recall sadder true events —
they invent sadder details into the gaps; the calm evening
interrogation yields more false assents than the heated one. (P552)

---

## 64. Emotional inertia — the trait that makes moods chain

§63's mood effects all key on `C.mood`, which the model treats as
context the world supplies. The affect-dynamics literature says mood
is a *stateful* variable with a per-person persistence:

- Kuppens, Allen & Sheeber 2010 (*Psychol Sci* 21:984 — verified):
  emotional inertia (affect autocorrelation) higher in maladjusted/
  depressed individuals, prospectively predicts depression onset.
- Koval et al. 2012/2013 (*Cogn Emot*; *Emotion* — verified):
  negative-affect inertia independently associated with depressive
  symptoms beyond rumination; the inertia-rumination link is real
  but partial.

**[CONSENSUS]** that inertia is a stable individual difference with
clinical correlates.

**Spec consequence (§6.74):**

```
trait emo_inertia ∈ [0,1] (default 0.3; depressive modifier sets 0.7):
    C.mood evolution: mood_t+1 = mood_t·emo_inertia + input·(1−emo_inertia)
    — high inertia means a bad morning's mood survives neutral
    afternoons, which in turn (a) keeps mood-congruent retrieval
    (§5.4/§8) biased negative for longer stretches, (b) extends
    §63's confab skew windows, (c) lengthens the §62 nostalgia-
    trigger regime (more pulls on the warm archive)
    LOW inertia = volatile affect, shorter mood-congruent chains —
    the resilient character's retrieval ecology resets with events
```

This is the missing state variable that makes §§5.4/8/63/62 cohere:
without persistence, mood effects are tick-local noise; with it, a
character's retrieval environment has WEATHER. Couples with §61 —
high-inertia characters stay in the rumination-triggering mood longer,
so their loops run hotter for the same `rumin_k`. (P553)

---

## 65. The first time writes the pattern — repetition habituates the tag, consolidates the script

Two literatures converge on what the Nth occurrence does:

- Reinstatement account (J. Neurosci. 2025 recurring-emotional-events
  study — verified): emotional memory advantage for recurring events
  rides amygdala response at the FIRST encounter + stable neocortical
  reinstatement across repetitions — pattern stability, not encoding
  variability, carries the benefit.
- Script/GER literature (Fivush 1984; Hudson & Nelson; Brewer 1986 —
  verified): repeated similar events form a general event
  representation; individual instances become hard to access and
  reports go generic; verbatim details blur across instances
  (fuzzy-trace: gist strengthens per occurrence, verbatim decays).
- Affective habituation: arousal_tag on recurrence N declines —
  the fourth conflict at the same meeting is encoded cooler than
  the first (straight habituation; [HYPOTHESIS] in this exact form).

**Spec consequence (§6.73):**

```
on encodeEvent matching an existing record's schema (same
    participants+place+event-type signature, sim ≥ merge_thresh·0.9):
arousal_tag *= (1 − rep_habit_k)^n_recur        // ≈0.15 — each repeat
    // is felt less; the fifth identical fight barely registers hot
instance record still mints but thin (verbatim fields at
    (1 − rep_habit_k)^n); the SHARED script node (§4.20) gains
    rep_script_gain·n_recur strength                       // ≈0.2
EXCEPTION (locked): any recurrence whose arousal at encode ≥ 0.8
    resets n_recur to 0 — a genuinely new-intensity instance is a
    NEW event, not a repeat (first-of-kind encoding: the amygdala
    gate is at the first STRONG encounter, not the first nominal one)
first-occurrence premium: the n_recur=0 instance of a repeating
    series keeps full encoding and becomes the script's anchor —
    "the first time he yelled" outlives every subsequent yell
```

Emergent: characters recount the FIRST offense vividly and "he does
it all the time" as a generic; the routine cruelty that built the
resentment is a script with one bright instance; a truly new
escalation breaks the habituation and mints fresh. (P554)

---

## 66. Spec delta (v5.0 → v5.1)

Params (all new, clamp ranges in profiles §0):

- `anticip_gain` 0.4, `anticip` event flag, gap-mismatch record at
  |Δtag| > 0.4 — §56
- `betrayal_thresh` 0.6, `betrayal_trust_gain` 0.35,
  `betrayal_thin` 0.3, `betrayal_avoid_k` 0.4, intrusion −0.1,
  avoid-relax ~30d after trust collapse — §57
- `vic_cond_mult` 0.6, `inst_cond_mult` 0.3, `witnessed:true`
  record flag — §58
- `dream_emo_w` 0.6, `dream_neg_bias` 0.15 (×2 under mood<0) — §59
- `shame_avoid_k` 0.35, `shame_intrude_k` 0.15,
  `perspective:"observer"` ×2 on shame reconstructions,
  `guilt_rehearse_k` 0.3, `amends_urge` counter — §60
- `forgive` RelEdge field ∈[0,1], `forgive_rumin_k` 0.7,
  rehearsal→forgive −0.02, amends→forgive +0.1 — §61
- `nostalgia_trigger_k` 0.3, `nostalgia_lift` 0.15 — §62
- `mood_confab_k` 0.25, `mood_crit_shift` 0.1 — §63
- `emo_inertia` trait 0..1 default 0.3 (depressive modifier 0.7) —
  §64
- `rep_habit_k` 0.15, `rep_script_gain` 0.2, arousal-0.8 recur
  reset (locked) — §65

Record fields: `anticip:true`, `betrayal:true`, `witnessed:true`;
RelEdge gains `forgive`; character state gains `amends_urge` counter
map; `C.mood` gains documented persistence semantics (emo_inertia).
Contract: §10 gains anticip-record minting duty (world flags
`anticipated` events), `amendsUrge(charId)` read hook, nostalgic
emissions feed C.mood, dream draw now samples own store (§4.24
salience clause superseded).

## 67. Age guidance (extends §§10/23/37/53)

- `anticip_gain`: modest rise through midlife (anticipation builds
  on schema richness — [HYPOTHESIS], knot ×1.1 at 50) and decline
  past 70 with future-time-horizon shortening (Carstensen SST —
  anticipated futures compress; ×0.8 at 75, HYPOTHESIS).
- `betrayal_*`: flat — the mechanism is relational, not
  developmental. Children below ~10 get the thin-detail leg but the
  avoid leg is weaker (×0.5 — avoidance regulation develops).
- `vic_cond_mult`: children ×1.2 (observational fear learning is the
  dominant childhood route — Mineka/Rachman developmental
  consensus); flat after 12.
- `dream_neg_bias`: nightmare literature shows childhood peak and
  decline — ×1.3 below 12, flat adult (Nielsen & Levin).
- `shame_*`: shame needs self-evaluative cognition — gate the tag
  mint below ~6 (Tracy & Robins 2004 developmental consensus);
  guilt slightly earlier (~4). Older adults: shame_avoid_k holds,
  intrusion leg ×0.8 (quiet mind §5.51).
- `forgive`: older adults forgive more readily (meta — [DEBATED]
  whether it is aging per se); implement as `forgive` accrual rate
  ×1.2 at 65+ rather than touching the mechanism constants.
- `nostalgia_*`: trigger sensitivity flat; lift slightly higher at
  65+ (×1.1 — older adults use positive reminiscence for
  regulation, consistent with positivity-effect machinery).
- `emo_inertia`: [HYPOTHESIS] modest U-curve — adolescent knots
  ×1.2 (affective rigidity in adolescence), midlife floor, mild
  rise at 75+ (×1.1).
- `rep_habit_k`: flat; `rep_script_gain` higher below 10 (children
  script after fewer exposures — Fivush).
- `mood_confab_k`, `mood_crit_shift`: flat.

## 68. Validation probes (P545–P554; registry continues)

- **P545 anticipatory trace (MUST):** flag an event `anticipated`,
  run 7 dwell ticks, then encode the real event with a milder
  affectSeries: BOTH traces must exist (imagined + event), the
  anticip trace must show drift on its verbatim fields, and a
  mismatch record must mint when |Δtag|>0.4. FAIL if the anticip
  record merges into or replaces the real one.
- **P546 betrayal phenotype (MUST — sign-lock):** matched negative
  events, perpetrator trust 0.8 vs 0.2: high-trust arm must show
  HIGHER arousal_tag, THINNER verbatim, LOWER voluntary-recall rate,
  and HIGHER ambientScan intrusion rate. After trust→0.1 collapse +
  30d, voluntary recall must rise ≥1.5× while arousal_tag is
  unchanged. FAIL if betrayal produces amnesia (record missing) —
  we implement avoidance, not erasure.
- **P547 vicarious acquisition (MUST):** direct victim, present
  witness, hearsay recipient of the same arousal-0.9 event:
  conditionedAffect response ordering must be direct > witness >
  instructed > control; witness mints a `witnessed:true` record,
  instructed does not mint an episodic record at all.
- **P548 emotional dream draw (SHOULD):** store with known
  arousal/valence distribution: dream mints must over-sample
  high-arousal recent records (≥2× uniform) and skew negative
  (~dream_neg_bias); under forced mood<0 the skew must deepen.
  FAIL if draw is uniform or world-supplied.
- **P549 shame/guilt split (MUST):** matched self-caused negative
  events tagged shame vs guilt: shame shows lower voluntary recall
  + higher intrusion + observer-perspective emissions; guilt shows
  higher voluntary rehearsal and a rising amends_urge. FAIL if the
  two tags produce identical retrieval ecology.
- **P550 forgiveness thaw (MUST — direction lock):** negative
  record vs offender, forgive swept 0→1: rehearsal/intrusion rate
  must fall ~70% while strength and arousal_tag decay profiles are
  unchanged; with forgive held at 0, each rehearsal must reduce
  forgive (rumination drives unforgiveness, McCullough direction).
- **P551 nostalgia regulation (SHOULD):** force C.mood = −0.5:
  ambient draws must over-select old positive people-rich records;
  a nostalgic emission must raise C.mood measurably (≥0.05 after
  clamp). FAIL if draws ignore mood or if lift applies to
  non-nostalgic emissions.
- **P552 mood-congruent fill (MUST):** same decayed record
  reconstructed under C.mood −0.6 vs +0.6: confabulated fields must
  differ in valence sign-matching the mood (mood_confab_k visible
  in fill distribution); and low-arousal context must raise
  lure_accept vs high-arousal (criterion leg).
- **P553 inertia (SHOULD):** emo_inertia 0.8 vs 0.1 characters under
  identical mood inputs: high-inertia mood-congruent retrieval bias
  must persist ≥3× as many ticks after the mood input ends.
- **P554 repetition habituation (MUST):** five identical-signature
  conflicts: arousal_tag of instance 5 < instance 1 by ≥
  rep_habit_k×4; script node gains rep_script_gain each time; an
  instance-6 with arousal 0.85 must reset the counter and mint at
  full strength (locked exception).

Registry now P1–P554; numbering stable.

## 69. Honest limits (Part V)

- **Anticipatory records** rest on a verified phenomenon
  (anticipation > retrospection) plus a modeling leap (simulation →
  same record machinery). The mismatch-record carve is our
  invention — Shepperd & McNulty document the *feeling*, not a
  trace type. P545 checks structure, not literature fidelity.
- **Betrayal** is the most contested source in this pass. We
  deliberately implement the conservative reading (avoidance +
  detail-thinness, zero amnesia) — if the field ever vindicates
  Freyd's strong claim, the spec can deepen `betrayal_avoid_k`
  toward true suppression, but no current evidence supports
  records being unreachable.
- **Vicarious/instructed conditioning** ratios (0.6/0.3) are
  calibrated guesses — the literature verifies ordering, not
  coefficients.
- **Dream sampling** operationalizes content statistics as a draw
  weight; whether dreams *consolidate* the sampled records is
  unresolved (§14's sleep debate applies). We let the minted dream
  record follow §4.24's own decay — the effect on source records
  is only the ordinary reconsolidation tick if retrieved.
- **Forgiveness feedback** (−0.02/+0.1 nudges) is a shaped
  implementation of the cross-lagged finding; the asymmetry
  direction is literature, the magnitudes are priors.
- **Nostalgia lift** is small on purpose — the induction effects
  are real but modest and repeated lifting would trivialize mood
  dynamics; the clamp `(1−|C.mood|)` bounds it.
- **`emo_inertia`** prices mood persistence as a scalar trait; real
  inertia is valence-selective (negative-affect inertia predicts
  depression specifically) — an asymmetric version (inertia on
  negative mood only) is a defensible refinement we did NOT take
  to keep the parameter count honest; flagged for a future pass.
- **Repetition** uses schema-signature matching as a proxy for
  "same kind of event" — coarse but legible; the n_recur reset
  at arousal 0.8 is locked because without it the model would
  habituate a character out of noticing escalation.

---

# Part VI — v65: the afterlife of feeling — the tone outlives the words, the dead keep their cues, and safety has a face (2026-09-23, sixth pass)

Five passes built the emotional tag: born by peak-end, priced at
consolidation, split by valence, traded against context, dampened by
telling, healed by time and forgiveness. What remains unpriced is
where affect lives when the episode is gone — the person who died,
the voice that carried the insult, the rival who never did anything
at all. This pass pushes into the residue layer: grief's oscillating
ecology, the direction asymmetry of emotional binding, the second
tag that counterconditioning mints instead of erasing the first, the
amplification of shared good news, prosody's implicit leak, the
content-less flashback, rival vigilance, the small self of awe,
the hot record that refuses the delete, and the safety signal that
quiets a firing cue without ever unlearning it.

## 70. Grief oscillates — the dead stay in the cue ecology

When a person dies, the records don't — every person-cued record
keeps its `people` field, every place smells of them, and the
CondEntry they minted keeps firing. The bereavement literature
supplies the dynamics:

- Stroebe & Schut 1999 (Death Studies 23:197 — the dual-process
  model, verified): adaptive grieving OSCILLATES between
  loss-oriented coping (confronting memories, the pang when the cue
  fires) and restoration-oriented coping (new routines, suppression,
  ordinary days). Dosage is intrinsic — respite is part of the
  mechanism, not avoidance failure.
- Klass, Silverman & Nickman 1996 (continuing bonds — verified):
  the bereaved maintain an inner relationship with the deceased —
  inner conversations, consulting them in decisions, sensing
  presence. The bond is maintained, not extinguished; the 1990s
  consensus overturned the older "detachment = health" assumption.
- The presence/absence flip (Ratcliffe 2020 review; phenomenology —
  verified): the SAME vivid memory of the deceased can be warm
  (they feel present) or stabbing (they feel absent) depending on
  which property the context makes salient — mode-dependent valence
  on identical content.

**Spec consequence (§6.110):**

```
PersonModel gains { deceased:true, deathDay }  — world marks it;
the person's cue stays live in every record that references them.

char gains grief state: { mode: "loss"|"restore",
                          modeDay, bond_strength }
  — mode flips stochastically: p_switch = grief_osc_k·(1 + load)
    per focused tick, grief_osc_k ≈ 0.15; early bereavement starts
    in loss mode and restore-mode residence rises monotonically
    with days since deathDay (grief_restore_slope ≈ +0.02/day,
    saturating ~0.8) — the oscillation decays toward restoration,
    never to zero (DPM: oscillation is lifelong at lower amplitude).

In loss mode (the pang ecology):
  - deceased-person cues fire CondEntry AND pull person-linked
    records at intrusion_thresh − grief_pang_gain (≈0.15) —
    the spouse's coffee cup intrudes
  - emissions of deceased-linked records carry absence:true —
    the valence of the tag is REPORTED with sign flipped toward
    negative (the warm memory reads as loss; Ratcliffe's
    absence-salient context)
  - bond_strength accrues +bond_gain (0.02) per loss-mode day

In restore mode:
  - pang discount waived; deceased-linked records retrieve
    normally and emissions carry presence:true — same record,
    positive valence report (the memory feels like having them
    back, continuing bonds)
  - loss-mode intrusions suppressed at ×(1 − restore_suppress)
    (0.4) — dosage, not deletion

Continuing bonds (emission): at low ambient-load ticks,
p = bond_talk_p·bond_strength (bond_talk_p ≈ 0.05) mints an
inner-speech emission addressed TO the deceased (the talk-to-them
beat) — dialogue renders it as private apostrophe; it rehear ses
nothing new (no verbatim gain) but sustains bond_strength.

Locked null: grief_erasure_null = 0 — no decay, rewrite, or
suppressor is applied to deceased-linked records THEMSELVES;
grief is an emission-mode and cue-ecology phenomenon, the store
is untouched (DPM is about coping orientation, not memory loss).
```

Emergent: the widow who speaks to her dead husband at the sink;
the griever fine for weeks who crumbles at the smell of his soap;
the same photo that comforts on Tuesday and destroys on Thursday —
all from one state variable and the existing cue machinery. (P677)

---

## 71. Emotion binds forward and breaks backward — the directional leak

§2's emotional blink taxed *neighbors' strength* symmetrically.
The relational-memory literature has since shown the loss is
directional and the gain is directional too:

- Bisby & Burgess 2013 (Learn. & Mem. 21:21 — verified): negative
  affect impairs ASSOCIATIVE memory (item-item, item-context
  binding) while sparing item memory — coherence loss, not
  content loss. Bisby, Burgess & Brewin 2020 (Curr. Dir. 29:267)
  tie it to PTSD: the traumatic event's elements stay loose.
- The 2023 Cognition & Emotion discovery+preregistered-replication
  pair (N=72+150 — verified): a "forward-favouring" asymmetry —
  the association from a negative item to the FOLLOWING neutral
  item is encoded STRONGER than from the preceding neutral to the
  negative one. Emotion leaks downstream: what came after the bad
  thing binds to it; what came before stays loose.
- Palombo et al. 2021 (Psych. Sci. — verified): emotion enhances
  "what", impairs "which", and for "when" — the emotional item's
  own temporal position is preserved while neutral items are
  systematically mislocalized later. The hot event keeps its
  timestamp; the timeline warps around it.

**Spec consequence (§6.111):**

```
on encodeEvent with arousal ≥ emo_blink_thresh:
  for each neighbor within emo_blink_window (existing blink):
    if neighbor.timestamp < event.timestamp (E−1, before):
        neighbor→event link_p *= (1 − emo_back_loss)   // ≈0.4 —
            the antecedent stays loose: you can't recall what led
            up to the crash, it "came out of nowhere"
    if neighbor.timestamp > event.timestamp (E+1, after):
        link_p(event→neighbor) *= (1 + emo_fwd_gain)   // ≈0.2 —
            forward-favouring: the thing right after the bad thing
            binds TO it (this is the θ-shaped bridge the 2023
            study measured)
  within-event coherence: verbatim fields of the event's own
    record mint at E·(1 − emo_coh_loss·neg_w) pairwise-binding
    penalty ≈0.25 — the elements exist but the joint is weak;
    retrieval emits fragments, not scenes (Bisby PTSD signature)
  the hot record's own verbatim.when is EXEMPT from the §4.30f
    telescoping bias (teles_when_immune:true at arousal ≥ 0.85 —
    Palombo: the emotional item keeps "when")
```

Emergent: characters narrate disasters as "suddenly" — no lead-up
retrievable, the aftermath welded to the event; eyewitness order
claims around hot events are reliably wrong in the backward
direction only. (P678)

---

## 72. Counterconditioning mints a rival tag, not an eraser

§4.9's extinction is inhibitory — the fear stays, suppressed.
A second procedure exists: pair the feared cue with a POSITIVE
outcome. The literature:

- Keller et al. 2020 (Behav. Res. Ther. review — verified;
  pre-registered multilevel meta on OSF): counterconditioning is
  expected to beat extinction specifically on RELAPSE channels —
  renewal, reinstatement, spontaneous recovery — because it
  changes the cue's evaluative valence rather than merely
  inhibiting the response. Effect sizes are modest.
- Mechanism (Baeyens evaluative conditioning; Raes & De Raedt
  2012 — verified): counterconditioning reduces EVALUATIVE
  conditioning efficiently (d ≈ 0.2) but leaves OUTCOME
  EXPECTANCY nearly intact — the cue is felt as nicer, not as
  safer-by-prediction.
- Bouton 2004: counter-conditioned responses revert like
  extinguished ones when tested in isolation — no special
  permanence. [DEBATED whether CC is a distinct process or a
  bolstered extinction.]

**Spec consequence (§6.112a):**

```
on a positive event (valence > +0.3, arousal ≥ cond_thresh·0.6)
    sharing a cue with an existing NEGATIVE CondEntry:
  mint a SECOND CondEntry on the same cue, valence positive,
    strength = cond_gain·arousal·cc_eval_gain   // cc_eval_gain
    ≈0.6 — the rival tag; the cue now has TWO entries
  DO NOT touch the negative entry's strength or safeCount —
    evaluative valence moved, expectancy didn't
at fire time: a cue with rival entries emits the STRENGTH-
  weighted mixture:  affect += Σ(valence_i·strength_i·sim) — the
  feared neighbor you learn to like emits ambivalence, not a
  smoothed-over average; the negative entry's extinction channels
  (renewal/recovery/reinstatement) all still apply to ITS entry
```

Emergent: the character who learns to love the bar where the
fight happened still flinches when it rains (renewal context) —
the fondness is real and so is the residue; they coexist on the
same cue. (P679)

---

## 73. Capitalization — sharing the good news deepens it

§16 priced telling as dampening for NEGATIVE events. The positive
side has the opposite sign:

- Gable, Reis, Impett & Asher 2004 (JPSP 87:228 — verified):
  communicating a personal positive event raises positive affect
  ABOVE the event's own impact; the increment is gated by the
  listener's response — only ACTIVE-CONSTRUCTIVE responses
  (enthusiastic elaboration) pay; passive-constructive and
  destructive responses pay nothing.
- Langston 1994 (JPSP 67:1112): expressive response to positive
  events is a capitalization attempt — retelling the good news is
  itself a positive event.
- Follow-up replication work (incl. better event-memory after
  active-constructive reception): shared positive events are
  remembered better — the retell rehearsed it AND the response
  re-stamped it.

**Spec consequence (§6.113):**

```
retell(charId, audienceId, record) where record.valence > +0.3:
  // capitalization leg — positive sharing amplifies (opposite of
  // §16 verbal_dampen which remains negative-valence only)
  audience response ∈ {active_constructive, passive, destructive}
    — world supplies from the listener's reaction event
  if active_constructive:
      record.S *= (1 + capitalize_gain)          // ≈0.15 — the
          // shared triumph consolidates harder
      record.affect_tag.valence += cap_val_gain·(1 − valence)
          // ≈0.1 — the felt goodness creeps toward 1
      affect_arousal += small bump (the telling WAS arousing)
  if passive or destructive: no gain — the shrugged-off
      promotion barely counts as shared
  Locked null cap_content_null = 0: capitalization moves strength
      and affect, NEVER verbatim fields — the story grows warmer,
      not more detailed (the re-stamp is evaluative, not factual)
```

Emergent: characters who share wins with enthusiastic partners
hold those wins brighter and longer; the same win told to a
flat roommate fades at the ordinary rate — the audience response,
not the event, sets the memorial weight of good news. (P680)

---

## 74. The tone survives the words — prosody as a separate field

Records of speech currently keep content verbatim. But listeners
keep the VOICE too, and it decays on its own schedule:

- Schirmer & Escoffier 2010 (PLoS ONE "Mark My Words" —
  verified): neutral words heard in emotional prosody acquire a
  shifted affective representation in memory — rated more
  negative (sad voice) or positive (happy voice) at test —
  and the shift did NOT depend on remembering the prosody
  itself: it is an implicit residue, not a retrieved field.
- Chappuis et al. 2014 (Interspeech — verified): prosody-induced
  emotional enhancement of memory is real and replicates across
  three studies; angry/happy/fearful voices show different
  item-vs-periphery facilitation.
- Voice-in-context study (verified): voices experienced in an
  emotionally engaging context are recognized after ONE exposure,
  intact at one week — the vocal-affect channel consolidates fast.

**Spec consequence (§6.114):**

```
speech Event gains optional field `prosody` ∈ [-1,+1] (valence
  of delivery — world tags sharp/warm/wounded); the record mints
  it as its own verbatim field `prosody`
decay: verbatim.prosody decays at k_verbatim·tone_survive_mult
  (≈0.5 — the tone outlives the sentence; HYPOTHESIS magnitude,
  CONSENSUS that vocal-affect channels consolidate fast)
implicit leak (Schirmer & Escoffier): at encode, the CONTENT's
  valence tag shifts: affect_tag.valence += prosody_leak_k·prosody
  (≈0.15) — sarcastic praise lands colder in the store even when
  the prosody field itself is long gone; the leak is irreversible
  because it was never a retrievable field, it re-tagged the
  content
record flag `heard:voice` on first-person-audio records —
  voice identity joins the person cue naturally
```

Emergent: "I don't remember what she said, but she said it
sweetly / like a slap" — the survivor field is prosody; and the
content's emotional color carries the delivery's bias forever,
invisible to the rememberer. (P681)

---

## 75. The affect flashback — dread with no picture

The CondEntry table already survives its episodic source
(§1 Bechara split). But §4.9's fire path emits affect only into
`C.affect` — there is no EMISSION type for the felt state with no
episode attached. Clinical phenomenology needs one:

- Brewin 2015 (re-experiencing taxonomy): intrusive phenomena
  span full sensory re-experiencing down to affect-only
  "emotional flashbacks" — panic, shame, or dread arriving with
  no retrievable scene. [DEBATED boundary vs ordinary anxiety;
  the dissociation is clinically standard]
- Ehlers & Clark 2000 model: trauma cues can trigger the
  CONDITIONED response without successful episodic retrieval —
  sensation without autobiographical access.
- Our machinery already asserts the substrate: `strength` decays
  at cond_decay while records decay at β_episodic — the tag
  outlives its source by construction.

**Spec consequence (§5.65):**

```
when a CondEntry fires (§4.9 fire path) and its SOURCE record
  is below θ (forgotten, below-wall, or never minted — e.g.,
  §58 instructed route): emit an aff_flash emission:
  { affect:{valence, arousal·strength}, aff_flash:true,
    content:null } — pure felt state, no fields, no confidence,
  no source attribution. Dialogue renders: free-floating dread,
  "something about this place."
  if the source record IS retrievable: ordinary re-experiencing
  emission as before — aff_flash is the below-wall branch only
gate: aff_flash_thresh ≈ 0.3 — fired strength below it emits
  nothing (sub-threshold residue stays silent in C.affect only)
locked null aff_flash_verbatim = 0: an aff_flash NEVER emits
  content fields — if the episode can't be retrieved, the
  flashback can't contain it (no false-picture minting)
```

Emergent: characters get moods with no story — the ex-friend's
street feels wrong for no stated reason; the listener inherits
the affect without inheriting a rumor. (P682)

---

## 76. Jealousy — the rival who never acted still gets remembered

The vigilance literature is thin but real:

- Maner et al. 2009 ("Intrasexual vigilance" — verified): priming
  infidelity concerns produced, in chronically jealous
  individuals, early attentional vigilance to attractive
  same-sex targets AND enhanced encoding/memory for them —
  a coordinated implicit cascade (attend → encode → remember →
  evaluate negatively). Effects trait-gated: low-jealousy
  individuals showed none of it.
- Schützwohl & Koch 2004 (verified): a week after hearing an
  ambiguous couple's-evening story, participants' recall was
  biased by sex-differentiated jealousy cues — memorial recall
  privileged the infidelity cue class relevant to the reader's
  sex (sexual vs emotional infidelity).

**Spec consequence (§4.33a):**

```
trait `jealous` ∈ [0,1] (correlated w/ attach_anx, distrust —
  loads through the §7 trait layer)
on encodeEvent: if event.people includes BOTH the character's
  partner AND a person flagged/attributable as rival-role, AND
  jealous ≥ 0.5:  E *= (1 + rival_vigil_gain)   // ≈0.25 — the
  partner-plus-rival co-occurrence encodes hot even at neutral
  arousal; record mints rival:true
rival:true records: decay at β·(1 − rival_stick_k) (≈0.3 slower)
  and mint a mild negative CondEntry on the rival person-cue
  (trust_neg_gain·0.5 — below-betrayal but above baseline)
sex-differentiated cue class (Schützwohl): Event tag
  `infid_cue:{sexual,emotional}` — male-profiled characters
  weight sexual ×1.3, emotional ×0.8; female-profiled reverse
  (trait `sex` mediates; apply as rival_vigil_gain multiplier)
```

Emergent: the jealous character "just remembers" every time the
partner chatted with that one neighbor — the rival's face
consolidates at partner-presence, no incident required. (P683)

---

## 77. Awe — the small self encodes wide

The discrete-emotion tag (§26) has no slot for awe, and awe has a
documented phenomenology worth a record signature:

- Keltner & Haidt 2003 (Cogn. & Emot. 17:297 — verified): awe =
  perceived vastness + need for accommodation (the experience
  doesn't fit existing schemas).
- Shiota, Keltner & Mossman 2007 (verified): awe is
  stimulus-focused and self-DIMINISHING — small-self reports,
  reduced need for cognitive closure; asocial elicitors dominate
  (nature, art — not social reward).
- Piff et al. 2015 (JPSP — verified): awe → small self →
  prosociality. Rudd, Vohs & Aaker 2012: awe expands perceived
  time (time-affluence).
- Memory consequences are NOT directly measured — [HYPOTHESIS]
  arm, constructed from the appraisals: accommodation failure →
  schema can't scaffold the record → verbatim fields thin, gist
  huge; self-diminishment → self-as-actor fields thin; time
  expansion → dur_dil reuse.

**Spec consequence (§4.33b):**

```
Event flag `awe:true` (world tags vista/transcendent moments —
  the parrot murmuration, the skyline through fog):
  verbatim.self fields mint at ×(1 − awe_self_loss)   // ≈0.4 —
      the character is small in their own memory of it
  gist field mints at full + awe_gist_gain (≈0.3) and semantic
      node "awe-places" mints/links at boosted strength — the
      PLACE becomes a meaning-anchor (revisiting the overlook
      re-primes the record via place cue, §4.30 place reinstate)
  verbatim.duration × (1 + dur_dil·arousal)  — reuse §45,
      Rudd's time-expansion is the same channel
  affect tag: positive valence + HIGH arousal is legal here —
      awe is the lab's exception to valence-arousal confound;
      keep arousal full (goosebumps are arousal)
  schema_gap flag: the record resists confab_fill at ×(1 −
      awe_gap_resist) ≈0.5 — accommodation failed at encode, the
      gap stays a gap (awe memories stay strange)
```

Emergent: the character who saw the eclipse over the park tells
it badly and forever — thin self-detail, huge gist, "you can't
describe it," and the overlook keeps the charge for years. (P684)

---

## 78. The hot record refuses the delete — directed-forgetting resistance

§4.30b's `forgetEvent`/`dforget` treats all records alike. The
suppression literature says emotional records resist:

- Hauswald et al. 2010 (SCAN, ERP — verified): item-cued directed
  forgetting succeeded for neutral but FAILED for arousing
  negative pictures — "due to their deeper incidental processing,
  highly arousing negative pictures are exempt from directed
  forgetting."
- 2021 item-method directed-forgetting meta (Mem. & Cogn. —
  verified): directed forgetting exists for emotional items but
  is reliably SMALLER than for neutral (≈4.2pp less on average;
  larger gaps when the emotional items are more arousing).
- Counter-evidence: van Schie et al. 2013 — under controlled
  DIRECT-suppression strategy, negative items were comparably
  inhibited; strategy, not valence, drives the deficit.
  [DEBATED — take the weak end: resistance, not immunity.]
- PTSD/OCD clinical reports: suppressive control over intrusions
  is harder — consistent with resistance scaling with arousal.

**Spec consequence (§6.115):**

```
forgetEvent / dforget flag: effective starvation threshold scales
  df_theta_eff = df_theta·(1 − emo_df_resist·arousal)
  // emo_df_resist ≈ 0.5 — an arousal-0.8 record must decay ~40%
  // deeper than a neutral one before the flag lets go; ecology
  // starvation takes longer on hot records
exempt band: valence<0 AND arousal ≥ 0.8 records ignore dforget
  entirely (Hauswald exemption — the traumatic record cannot be
  told to go away; the flag is stored but inert)
the DEBATED arm is honored by keeping emo_df_resist ≤ 0.5 — under
  strong direct suppression (cueContext.suppress:true) the
  resistance halves again (strategy matters, van Schie)
```

Emergent: "stop thinking about it" works on the errand and fails
on the humiliation; a character's deliberate suppression of a hot
record runs the machinery but the record keeps clearing the
starvation floor. (P685)

---

## 79. The safety signal — a trusted presence quiets a firing cue

§44 attenuated encoding when a trusted person is co-present at
the BAD event. The complementary channel — safety at FIRE time —
is separate and verified:

- Hornstein & Eisenberger work on social safety signaling
  (verified literature direction): a trusted other's presence
  functions as a learned safety signal that suppresses the
  conditioned response itself — not the encoding of new threat,
  but the expression of old fear.
- Extinction-analog framing (Bouton): safety signals are
  conditioned INHIBITORS — they suppress CR expression while the
  CS-US association stays intact. Suppression ≠ unlearning:
  remove the safety signal and the fear returns at full
  strength (the locked null).
- This is why "I'll go with you" works at the feared place
  itself, not just on the way to it.

**Spec consequence (§6.112b):**

```
at CondEntry fire time (§4.9): if a co-present person's
  PersonModel.trust ≥ secure_trust:
    fired affect *= (1 − safety_suppress·tier_mult)
    safety_suppress ≈ 0.35 — the held hand quiets the firing cue;
    tier_mult shared with §44's table (partner 1.0·relQuality,
    close friend 0.6, stranger ~0.2)
LOCKED NULL safety_unlearn_null = 0: safety suppression does NOT
  decrement strength or increment safeCount — the entry is
  inhibited at expression, not extinguished; the cue alone later
  fires at full remaining strength (inhibitor, not exposure)
interaction: presence of the safe person during a SAFE-day cue
  exposure still accrues safeCount normally — you can also
  genuinely extinguish; the two channels stack (inhibition now,
  extinction accruing)
```

Emergent: the character who can only enter the feared venue with
the trusted friend — and whose fear is undiminished the day she
goes alone; company is a suppressor, never a cure. (P686)

---

## 80. Spec delta (v5.12 → v5.13)

Params (all new, clamp ranges in profiles §0):

- `grief_osc_k` 0.15, `grief_restore_slope` 0.02/day (sat 0.8),
  `grief_pang_gain` 0.15, `restore_suppress` 0.4, `bond_gain`
  0.02, `bond_talk_p` 0.05, `grief_erasure_null` 0 — §70
- `emo_back_loss` 0.4, `emo_fwd_gain` 0.2, `emo_coh_loss` 0.25,
  `teles_when_immune` flag at arousal ≥0.85 — §71
- `cc_eval_gain` 0.6 (rival-entry mint multiplier), mixed-cue
  mixture rule — §72
- `capitalize_gain` 0.15, `cap_val_gain` 0.1, audience
  `ac_response` gate, `cap_content_null` 0 — §73
- `tone_survive_mult` 0.5, `prosody_leak_k` 0.15, Event/record
  `prosody` field — §74
- `aff_flash` emission mode, `aff_flash_thresh` 0.3,
  `aff_flash_verbatim` 0 — §75
- `jealous` trait, `rival_vigil_gain` 0.25, `rival_stick_k` 0.3,
  `rival:true` + `infid_cue` event tags — §76
- `awe:true` Event flag, `awe_self_loss` 0.4, `awe_gist_gain`
  0.3, `awe_gap_resist` 0.5 — §77
- `emo_df_resist` 0.5, arousal-0.8-negative exemption (locked) —
  §78
- `safety_suppress` 0.35 (fire-time inhibition),
  `safety_unlearn_null` 0 — §79

Fields: PersonModel `deceased`/`deathDay`; char state `grief`
{mode, modeDay, bond_strength}; record `rival:true`,
`prosody` verbatim field, `teles_when_immune`; emission
`aff_flash:true`, `absence:true`/`presence:true` on
deceased-linked emissions; Event `prosody`, `awe:true`,
`infid_cue:{sexual,emotional}`; retell context `ac_response`.
Locked nulls: grief_erasure_null, cap_content_null,
aff_flash_verbatim, safety_unlearn_null.

## 81. Age guidance (extends §§10/23/37/53/67)

- `grief_*`: DPM oscillation operates across the lifespan; older
  widows' restore-mode residence rises faster (established coping
  literature — bereavement outcome improves with age into the
  60s; ×1.2 slope at 65+, [HYPOTHESIS] curve). Children below ~10
  get the pang ecology but weaker continuing-bonds semantics
  (bond_talk_p ×0.5 — concept of death consolidation, HYPOTHESIS).
- `emo_fwd_gain`/`emo_back_loss`: flat — the asymmetry is
  attentional, not developmental. `emo_coh_loss` may sharpen in
  old age (associative deficit compounds — ×1.2 at 75,
  HYPOTHESIS, bridges to AD§78 segmentation).
- `cc_eval_gain`: flat; evaluative conditioning is among the most
  age-invariant learning channels.
- `capitalize_gain`: slightly higher at 65+ (positivity emphasis
  compounds — ×1.15, HYPOTHESIS).
- `tone_survive_mult`: flat; `prosody_leak_k` higher under hearing
  loss (the degraded-content listener leans harder on the voice —
  ×1.3 when sensory>0.4, composition with v5.12 sensory).
- `aff_flash`: no age curve — the channel is conditioning-age,
  not calendar-age.
- `rival_vigil_gain`: flat adult; declines in elder profiles
  (mate-value ecology shifts — ×0.6 at 65+, HYPOTHESIS).
- `awe_*`: awe-proneness may rise with age (small-self
  accessibility); keep encode constants flat, raise `awe:true`
  minting rate ×1.2 at 65+ via the Event side (world tags).
- `emo_df_resist`: rises with age ×1.3 at 70+ (inhibitory
  decline compounds emotional resistance — DEBATED; SHOULD).
- `safety_suppress`: flat; partner-dependence composes with
  §5.64d transactive dyad naturally.

## 82. Validation probes (P677–P686; registry continues)

- **P677 grief oscillation (MUST):** kill a high-trust dyad
  partner; over 90 simulated days the widow's loss/restore mode
  residence must show (a) early loss dominance, (b) rising
  restore share, (c) nonzero loss episodes late — monotone trend
  with oscillation, never a clean one-way decay; deceased-linked
  emissions carry absence:true in loss mode and presence:true in
  restore mode; the store itself is untouched
  (grief_erasure_null). FAIL if mode is monotone one-direction or
  if records decay faster than matched live-person records.
- **P678 forward-leak asymmetry (MUST — sign lock):** encode a
  neutral→NEGATIVE→neutral sandwich at arousal 0.9: the
  negative→following link must exceed the preceding→negative
  link (fwd > back); both must differ from a matched
  neutral-sandwich control; the hot record's own `when` field
  must resist the telescoping bias (teles_when_immune) while
  neighbors' `when` drift. FAIL on symmetric loss or on the hot
  record telescoping.
- **P679 counterconditioning rival (MUST):** negative CondEntry
  on cue X, then three positive X-events: cue must hold TWO
  entries (both valences present); fired affect must be the
  strength-weighted MIXTURE (ambivalence), not a merged scalar;
  the negative entry's renewal channel must still fire on
  context change. FAIL if the positive events decrement or
  replace the negative entry.
- **P680 capitalization gate (MUST):** retell a positive record
  to active_constructive vs passive audiences: S gain only in the
  active arm (≥capitalize_gain·0.8); verbatim fields identical
  pre/post in both arms (cap_content_null); valence tag creeps
  positive in the active arm only.
- **P681 tone survival (MUST):** speech record with prosody −0.7
  vs neutral prosody, decayed 60 days: (a) prosody field
  strength > content verbatim fields by the tone_survive_mult
  ratio; (b) content affect tag shifted by prosody_leak_k at
  encode and UNCHANGED by prosody-field decay — the leak is
  irreversible.
- **P682 affect flashback (MUST):** drive a CondEntry's source
  record below θ (decay or forgetEvent), then present the cue:
  emission must be aff_flash:true with content:null — affect
  present, no fields; FAIL if any content fields emit or if
  confidence emits. Below aff_flash_thresh: no emission at all.
- **P683 jealousy vigilance (SHOULD — trait gate):** identical
  partner+rival co-presence events on jealous 0.8 vs 0.2
  characters: high arm mints rival:true, encodes at
  rival_vigil_gain, and accrues a mild negative person-CondEntry;
  low arm mints none of it. infid_cue:sexual vs emotional must
  weight by profile sex per the Schützwohl multipliers.
- **P684 awe signature (SHOULD — HYPOTHESIS arm):** awe:true
  event vs matched positive non-awe: awe record must show thin
  self fields + strong gist + schema_gap resistance to
  confab_fill + full arousal tag; FAIL if self fields mint at
  ordinary strength (small-self is the signature).
- **P685 directed-forgetting resistance (MUST):** dforget on
  arousal-0.8-negative vs arousal-0.3-neutral records: the hot
  record must stay above df_theta_eff longer (resist factor) and
  the ≥0.8 negative arm must NEVER starve (locked exemption);
  under suppress:true contexts the resistance halves (strategy
  arm).
- **P686 safety signal (MUST — locked null):** CondEntry firing
  with vs without a trusted co-present person: fired affect lower
  with the safe person (safety_suppress), while entry strength
  and safeCount are IDENTICAL across arms afterward
  (safety_unlearn_null — inhibition, not extinction); cue alone
  later refires at pre-suppression strength.

Registry now P1–P686; numbering stable.

## 83. Honest limits (Part VI)

- **Grief modes** compress the DPM's rich account into a two-state
  oscillator with a monotone restore slope. Real oscillation is
  event-triggered (a funeral spikes loss mode for days) — our
  stochastic switch approximates it; a cue-triggered mode-flip
  refinement is flagged for a future pass.
- **Forward-favouring** is a two-study finding (72+150); the
  mechanism (post-encoding attentional capture of the E+1 item)
  is inferred, not shown. We implement the directional asymmetry
  and flag the magnitude as calibrated guess.
- **Counterconditioning** magnitude (cc_eval_gain 0.6) exceeds
  the lab's d≈0.2 on evaluative ratings deliberately — the lab
  measures a single rating, we mint a rival TAG whose long-run
  effect must survive the ecology; treat as prior.
- **Capitalization** measures affect/well-being, not record
  strength directly — the memory benefit is attested in
  follow-ups but thin. The ACR gate is the load-bearing part and
  is well-replicated.
- **Prosody** survival asymmetry (×0.5 decay) is a modeling
  hypothesis on top of verified effects (implicit leak is
  established; the half-life ratio is ours).
- **Affect flashbacks** are clinically real but the clean
  dissociation from episodic content is DEBATED (Brewin's
  taxonomy vs single-memory accounts); we implement the
  below-wall branch because our architecture makes it nearly
  free and it is behaviorally distinct.
- **Jealousy** is the thinnest literature in the pass — two
  programs, modest Ns, evolutionary framing contested. The
  trait gate (jealous ≥0.5) is the honest implementation: the
  literature only supports effects in high-jealousy individuals.
- **Awe** has NO direct memory literature — §77 is a labeled
  HYPOTHESIS built from awe's appraisal structure (accommodation
  failure → thin verbatim, small self → thin self fields).
  P684 tests internal consistency, not fidelity to a corpus.
- **Directed-forgetting resistance** sits between Hauswald's
  exemption and van Schie's comparability — we take the weak
  end (resist ≤0.5, strategy-halving) and lock only the
  ≥0.8-negative exemption, which is the best-replicated cell.
- **Safety signals** are real conditioned inhibitors but our
  tier_mult reuses §44's relationship table by analogy — the
  fire-time suppression magnitude (0.35) is a prior.

---

# Part VII — v77: the uses of feeling — who you attach, who you thank, who you tell, and how you stand back from your own past (2026-09-23, seventh pass)

Six passes priced the tag itself: birth by peak-end, consolidation
wave, valence split, conditioned entries, the ecology of cues,
grief, contagion, regulation style. What remains unpriced is the
*instrumental* layer — the ways emotion is not merely stored but
spent: kindness minting a creditor in the ledger of the heart, a
friend's rumination deepening both the wound and the bond, the
rememberer stepping back from the memory to look at it, the joke
that cools the wound, and the calm self that cannot feel what the
furious self did. This pass also formalizes two things left as
qualitative labels: disgust's extinction resistance (a tag text
since v2.9, never parametrized) and the felt-vs-believed split in
emotion reports — where the character answers "how did you feel"
not from the record but from who they believe they are.

## 84. Gratitude mints the benefactor — a positive entry that refuses to fade

The asymmetry of §4.9 (`trust_neg_gain > trust_pos_gain`, bad is
stronger than good) has one documented exception: received
kindness that is *felt as gratitude*, not merely recorded as
pleasant.

- McCullough, Kilpatrick, Emmons & Larson 2001 (review — the
  gratitude-as-moral-barometer account): receiving a benefit
  appraised as costly-to-the-giver mints a durable affective
  orientation toward the benefactor — gratitude is theorized as a
  *stored signal of relationship value*, precisely because it
  outlasts the pleasantness of the gift.
- Bartlett & DeSteno 2006 (*Psych. Sci.* 17:319 — verified):
  induced gratitude produced costly helping toward the
  benefactor — effortful repayment behavior, not generic
  goodwill; the motive survives after mood inductions wash out
  (gratitude, not positive affect, mediated).
- Fehr & Gächter 2000 / Algoe 2012 (find-remind-bind):
  gratitude's function is maintaining the relationship — it
  binds to a PERSON, not an outcome. This makes it the mirror of
  betrayal (§57): betrayal prices the perpetrator's closeness
  negatively; gratitude prices the benefactor's positively.

**Spec consequence (§6.154):**

```
Event `benefit:true` + `benefactor:<charId>` (world tags acts of
kindness appraised as costly/effortful — carrying groceries is
only benefit:true when it cost something):
  mint a person-CondEntry on benefactor with valence +
  and strength *= (1 + grat_gain·cost_appraisal)
    grat_gain ≈ 0.5 — a genuinely costly kindness beats the
    §4.9 positive discount and approaches harm-entry strength
  entry flag `grateful:true` → decay leg × (1 − grat_fade_resist)
    grat_fade_resist ≈ 0.4 — gratitude is the positive exception
    to the fading-affect ecology (FAB leaves it intact)
  emission cue: benefactor in need (need:true event) raises the
    entry and may emit `reciprocate:true` — the Bartlett & DeSteno
    motive channel; reciprocity bias toward the benefactor, not
    generalized prosociality
```

Emergent: the character who shows up to help the friend who once
helped them, years later, unbidden — and cannot say exactly why
the debt feels unpaid. Gratitude is the book the ledger never
closes. (P815)

---

## 85. Co-rumination — the shared dark loop that binds and worsens

§64's `emo_inertia` and the existing `rumin` trait price solitary
rehearsal. The dyadic version is a separate, verified channel:

- Rose 2002 (*Child Dev.* 73:1830 — verified): co-rumination —
  extensively discussing problems with a friend, rehashing,
  speculating, dwelling on negative affect — predicts BOTH
  friendship quality AND internalizing symptoms. The same
  behavior buys closeness and buys distress; the trade is the
  finding, not a side effect.
- Rose, Carlson & Waller 2007 (*Dev. Psychol.* 43:1019 —
  verified): prospective — co-rumination predicts later
  depression/anxiety while predicting increasing friendship
  closeness. Girls > boys; emerges in adolescence.
- Stone & Gibbons 2020 / Spendelow et al.: co-rumination is
  distinguishable from ordinary self-disclosure by its
  *repetitive* and *speculative* structure — same problem, no
  resolution, affect rehearsed not worked through.

**Spec consequence (§6.155):**

```
jointRecall(charIds, cue) on a shared NEGATIVE record where
min(rumin_A, rumin_B) ≥ corumin_gate (0.4):
  bond_strength += corumin_bond (0.03) per episode —
    the intimacy is real; closeness accrues as in §73's ACR arm
    but WITHOUT requiring active-constructive responses —
    mutual dwelling is enough (the dark channel)
  the record's negative tag does NOT take the §16 verbal
    dampen discount — ruminative retell is rehearsal, not
    disclosure: verbal_dampen *= (1 − corumin_damp_loss·
    min(rumin_A,rumin_B))  (corumin_damp_loss ≈ 0.6)
  affect re-fired at full strength AND increments rumin
    co-gain: both tellers' mood += mood_bleed·neg
  discriminator: a negative jointRecall that reaches a
    RESOLUTION field (solved:true, decided:true — world tags
    closure in the retell event) escapes the loop and takes
    the ordinary dampen + cap capitalization path
age arm (age-dev tie-in): corumin_gate effective only when
  both participants' age_now ≥ ~10 (Rose & Rudolph: the loop
  is an adolescent acquisition; children co-disclose but the
  rehearsal-without-resolution structure is post-onset);
  sex loading: trait draw girls > boys (handled in profiles,
  not the function)
```

Emergent: two high-rumin mains who "talk about everything"
become visibly closer AND visibly sadder — the audience sees the
friendship deepen as the mood decays. (P816)

---

## 86. Directed self-distancing — asking "why" from a distance

§5.39's `persp` is a *sampled* emission property — the rememberer
sometimes finds themselves watching the memory. The regulation
channel is different: a *deliberate* distanced analysis of a
negative record that cools reactivity without avoiding the
content.

- Ayduk & Kross 2010 (*JPSP* 99:809 — verified): spontaneous
  self-distancing while reflecting on negative memories → less
  emotional AND cardiovascular reactivity short-term, less
  intrusive ideation over time; effect mediated by
  *reconstruing* (making meaning) vs *recounting* (reliving);
  NOT mediated by avoidance — distancers engaged, they engaged
  differently.
- Kross & Ayduk 2008, 2011 (the "why from a distance" program):
  distanced-analysis of a negative experience produces less
  rumination than immersed-analysis and does not degrade the
  meaning extracted — the benefit is affective, the insight is
  preserved.
- The §5.39 observer emission dampens REPORTED affect
  (`persp_affect_loss` 0.2). Distanced reflection operates one
  level up: it dampens the *re-fired* affect and the rehearsal
  dividend of the session itself.

**Spec consequence (§6.156):**

```
cueContext.reflect:{mode:"distanced"} (dialogue/internal layer
sets it on deliberate "think about it calmly" / third-person
replays; rate scaled by persp_obs trait and mindful):
  fired affect of the reflected record ×= (1 − dist_cool·
    persp_obs_scaled)   dist_cool ≈ 0.5 — deeper than the 0.2
    surface loss; reflection-mode, not emission-mode
  rumin refresh dividend on the record ×= (1 − dist_cool)
    — the replay consolidates WITHOUT reheating; the
    distinction from §64's rumin loop is mechanistic: rumination
    recounts, distancing reconstrues
  coherence field still accrues (the Ayduk & Kross insight arm —
    meaning-making is not impaired, only affect is cooled)
LOCKED NULL dist_avoid_null = 0: a distanced reflection does NOT
  raise theta, does NOT add the avoid_suppress surcharge, and
  does NOT reduce future cueMatch — the record stays as
  accessible as before; cooling ≠ excluding (verified: effect
  not mediated by avoidance)
emission `distanced:true` marks the report
```

Emergent: the character who "thinks about the fight" at night
and comes out of it calm but still knowing exactly what happened
— versus the ruminator who replays and ends up angrier with a
stronger memory. Same record, opposite regulation. (P817)

---

## 87. Humor as reappraisal — the joke cools the tag

v4.6's `humor_gain` prices *memorability* — witty events encode
stronger. The separate, verified channel is humor as an
*emotion-regulation* operation on negative events:

- Kugler & Kuhbandner 2015 (*Neuropsychologia* 62:357 —
  verified): humorous reappraisal of negative images vs ordinary
  reinterpretation — humor reduced amygdala response MORE and
  produced *worse* later memory for the negative items (the
  coolness costs fidelity: the joke rewrites what the scene was).
- Samson & Gross 2012 / Samson, Glassco, Lee & Gross 2014
  (*Cogn. Emot.* — verified): positive humor down-regulates
  negative emotion responses; humor generation is a
  reappraisal-family operation, demand-wise heavier than
  expressive suppression but cheaper than detached
  reinterpretation.
- Strick et al. 2009: humor's regulatory effect is largest on
  moderately negative content; extremely negative content
  resists the joke (the ceiling matters).

**Spec consequence (§6.157):**

```
Event `humor:true` on a NEGATIVE-valence event (the joke AT the
bad thing — distinct from humor on attended events generally,
which keeps the v4.6 memorability path):
  arousal_tag ×= (1 − humor_reapp_k·min(1, humor_trait + 0.3))
    humor_reapp_k ≈ 0.35 — the laugh is a down-regulation
    operator on the born tag; gated on arousal < 0.85 (the
    Strick ceiling — nobody jokes the trauma cooler)
  verbatim fields of the humorous negative record mint ~15%
    thinner (the fidelity cost — humor buys affect relief with
    detail; Kugler & Kuhbandner's memory decrement)
  at REPLAY: a negative record retold with humor (retell event
    carries humor:true) takes the §16 dampen as usual PLUS a
    small additional tag cool (×(1 − humor_replay_k ≈ 0.15)),
    once per record per humor-cool window — the running gag
    genuinely wears the sting down, slowly
interactions: suppressors (regulate_style<0.5) can still use
  humor — it is reappraisal-family, not suppression-family;
  humor_trait is a new IndivTraits axis (v5.25, loads
  extra + open, anti-loads neurot mildly)
```

Emergent: the funny main's worst day comes back smaller —
dimmer in affect AND thinner in detail, the real cost the lab
measured. The unfunny character's identical day stays hot and
sharp. (P818)

---

## 88. The hot–cold read — the calm self cannot feel the furious self

§88s predecessors priced state-dependent *access* (§5.3's
`w_msd`, small and erasable). The visceral-states literature
prices a different failure: the *interpretation* of a hot-state
record by a cold-state reader — including of oneself.

- Nordgren, van der Pligt & van Harreveld 2006 (*Psych. Sci.*
  17:635 — verified): people in a cold state UNDERESTIMATE the
  motivational force that a past hot state exerted — on others'
  AND on their own past behavior; attribution shifts toward
  dispositional/other factors; instruction to correct does NOT
  remove the gap.
- Nordgren et al. 2007 (*JPSP* 93:75 — verified): cold-state
  participants evaluated impulsive behavior less favorably —
  the empathy gap is state-SPECIFIC (hungry evaluators forgive
  only hunger-driven lapses) and applies to self-judgments
  (Study 3).
- Loewenstein 2005 (theoretical — hot-cold empathy gaps): the
  cold self cannot simulate the hot self's utility function;
  the retrospective consequence is "I can't believe I did that"
  — the record is intact, the comprehension is not.

**Spec consequence (§6.158):**

```
at Reconstruction of a record whose arousal_tag ≥ 0.7 while
C.arousal_now ≤ 0.3 (or vice versa — hot reading cold is the
same gap, sign-flipped):
  re-fired affect *= (1 − hotcold_k·|a_enc − a_now|)
    hotcold_k ≈ 0.5 — the affect under-ports even though the
    record is verbatim-intact; the reader retrieves the scene
    but not the heat
  when the record describes the character's OWN impulsive/hot
    behavior and the gap binds (|Δ| ≥ hotcold_gap_thresh 0.5):
    emission carries `cold_read:true` — report layer renders
    dispositional attribution ("that wasn't like me" /
    "I don't know what came over me"); the attribution style is
    state-specific — a tired self forgives only fatigue-driven
    lapses (Nordgren state-specificity: match on the drive
    channel, not valence generally)
LOCKED NULL hotcold_store_null = 0: the gap never rewrites
  arousal_tag or any verbatim field — it is a read-time
  failure only; re-reading the same record tomorrow in a hot
  state re-fires at full tag strength
```

Emergent: the main who screamed at a friend yesterday calmly
reviews the scene today and judges the person in the memory as
an inexplicable stranger — while the archive shows the same
record untouched, waiting to refire at full heat the next time
the state returns. (P819)

---

## 89. Anxiety's retrieval priority — the threat record wins the cue race

§6.143's `rival_vigil_gain` priced threat-priority for one
specific cue class (the romantic rival). The general anxiety
channel — threat-tagged material winning ordinary cue
competition — is separate and older:

- Williams, Watts, MacLeod & Mathews 1997 (*Cognitive
  Psychology of Emotional Disorders* — the canonical account):
  anxiety biases the *detection* stage — threat-relevant
  stimuli win attentional competition before elaboration
  begins. Depression biases elaboration instead — the
  anxiety=detection / depression=rumination split is the
  textbook dissociation.
- Bishop 2007 (*Nat. Neurosci.* 10:307 review — verified):
  trait anxiety = hypervigilant attentional set; threat cues
  capture attention even below awareness and resist
  disengagement.
- Mathews & MacLeod 2005: the bias scales with state × trait
  anxiety — it is a priority weight, not a threshold gate.

**Spec consequence (§6.159):**

```
anx_eff = clamp(0.6·neurot + 0.4·max(0, C.anxiety_state), 0, 1)
  (state anxiety is a context field the emotion layer supplies;
  absent → trait only)
in §5.2 noisy-OR cue competition, records carrying
  threat:true / negative CondEntry linkage receive
  cueMatch += threat_cue_gain·anx_eff·arousal_tag
    threat_cue_gain ≈ 0.15 — a priority bonus on the
    detection stage, before fan/latency pricing; threat
    records surface first under anxiety even when not the
    strongest
disengagement arm (the Bishop hold): when a threat-cued
  recall fires, the ambient scan's next-step disengage
  probability drops ×(1 − threat_hold·anx_eff),
  threat_hold ≈ 0.3 — anxious characters stay with the threat
  record after neutral characters would have moved on
  (§6.143's rival hold is the special case where the threat
  object is a person)
boundary: DEPRESSION does not get this bonus — depr's channel
  stays §6.52/§64 (accessibility + inertia at elaboration, not
  detection priority); locked as the textbook dissociation
```

Emergent: an anxious main mentions the unpaid bill, the strange
car, the weird look — the three threat-tagged records of an
unremarkable week — while a low-anxiety main recounting the same
week surfaces the meal and the weather. Same ecology, different
first reach. (P820)

---

## 90. Positive mood widens the fan — the happy searcher finds remote kin

§8's `mood_bleed` prices mood-*congruent* reconstruction. Positive
mood has a second, structural effect on search itself:

- Rowe, Hirsh & Anderson 2007 (*PNAS* 104:383 — verified):
  positive mood enhanced access to REMOTE semantic associates
  (RAT performance up) while impairing flanker selectivity —
  positive affect loosens inhibitory selection in both semantic
  and spatial search. One mechanism: wider attentional aperture.
- Fredrickson & Branigan 2005 (broaden-and-build — verified
  direction): positive emotion widens thought–action repertoires;
  negative emotion narrows toward the prepared action.
- Isen, Daubman & Nowicki 1987 (classic): positive affect
  improves creative problem-solving requiring remote association.

**Spec consequence (§6.160):**

```
when C.mood > mood_broaden_floor (0.3):
  θ_eff for associative (non-verbatim) cue spread ×=
    (1 − broaden_k·C.mood)    broaden_k ≈ 0.25 — a modest
    theta cut; the happy searcher clears weaker candidate
    records, producing the remote-reminding pattern
  fan pricing: fan_k penalty per extra candidate reduced by
    (1 − 0.5·broaden_k·C.mood) — wide search is cheaper in a
    good mood (the Rowe finding is access gain, not accuracy
    gain: candidate count rises, hit precision does not)
  search_breadth effective +floor(broaden_k·C.mood·4) candidates
LOCKED NULL broaden_store_null = 0: mood-broadened search never
  writes — no S changes, no link mints, no confab bonus from the
  wider candidate pool beyond normal confab_fill mechanics;
  the aperture is a read-side lens, lifted when mood lifts
```

Emergent: a main in a good mood answers "what does this remind
you of" with the surprising-but-apt association — the same
character in a flat mood retrieves the obvious neighbor.
Creativity as a retrieval-state, not a storage property. (P821)

---

## 91. Disgust formalized — extinction-resistant, and the wash that works is counterconditioning

v2.9 tagged `emotion:disgust` as "conditioning-resistant" in the
appraisal table — a qualitative label, never parametrized. The
conditioning literature prices it precisely, and the asymmetry
between the two unlearning channels is the finding:

- Olatunji, Forsyth & Cherian 2007 (*J. Anxiety Disord.*
  21:820 — verified): disgust evaluative conditioning is
  "sticky" — resistant to extinction relative to fear
  conditioning on the same paradigm.
- Engelhard, Leer, Lange & Olatunji 2014 (*Behav. Therapy*
  45:708 — verified, and the key asymmetry): Study 1 —
  extinction training did NOT reduce disgust evaluative
  learning; Study 2 — counterconditioning DID reduce it.
  The wash that works on disgust is a rival tag (§72), not
  exposure.
- Bosman, Borg & de Jong 2016 (PLoS ONE — verified): disgust
  extinction optimized only with extended/evaluative framing;
  standard exposure insufficient.
- Olatunji, Tomarken & Puncochar 2013 (*Emotion* 13:881 —
  verified): disgust PROPENSITY potentiates evaluative learning
  of aversion — trait disgust-sensitivity raises acquisition
  itself.
- Rachman 2004 contamination literature: disgust generalizes
  through *contact semantics* (the touched-by relation) — our
  cue-mixture machinery already supports it via people/place
  contiguity.

**Spec consequence (§6.161):**

```
CondEntry with emotion:disgust:
  acquisition gain += disg_prop_gain·disg_prop  where
    disg_prop = clamp(0.6·neurot + 0.4·consc, 0, 1)
    (consc carries the orderliness/cleanliness loading —
     disg_prop_gain ≈ 0.3 — propensity feeds the mint,
     Olatunji 2013)
  extinction: safeCount accrual on disgust entries ×=
    dis_extinct_mult (0.4) — exposure without the rival tag
    barely moves it (Engelhard Study 1)
  counterconditioning (§72 rival-tag mint) at ~full efficacy:
    dis_cc_mult 0.9 — the rival-tag channel is the documented
    wash; disgust yields to a minted rival, not to repetition
  renewal/ABA on disgust entries: standard (no special return
    bonus — the resistance is in extinction rate, not renewal
    magnitude; keep the ecology shared)
```

Emergent: the character who was revolted by the restaurant
stays revolted after three clean visits — and finally softens
only after the birthday dinner mints a rival warm tag on the
same place. Exposure fails, counterconditioning works, exactly
as Engelhard showed. (P822)

---

## 92. Mood-repair recall — the sad searcher reaches for a happy memory on purpose

Mood-congruent recall is the default ecology (§8). The
instrumental override — deliberately retrieving incongruent
positive records to repair a negative mood — is a measured,
trait-gated channel:

- Josephson, Singer & Salovey 1996 (*Cogn. & Emot.* 10:437 —
  verified): sad-mood induction → first memories sadder
  (congruent default); but non-depressed participants' SECOND
  memories shifted positive — and 68% of the shifters
  explicitly reported doing it to repair mood. The repair
  attempt is a conscious recruitment, not drift.
- Rusting & DeHart 2000 (*JPSP* 78:737 — verified):
  mood-incongruent recall occurs specifically under
  positive-reappraisal strategies; trait negative-mood-
  regulation expectancies predict who does it.
- Joormann & Siemer 2004 (*J. Abnorm. Psychol.* 113:179 —
  verified): dysphoric participants CANNOT use the
  mood-incongruent repair path — positive recall does not
  lift their mood (they need distraction instead). The repair
  channel is gated OFF by dysphoria.

**Spec consequence (§6.162):**

```
on self-initiated recall (ambient scan / pm_self path) while
C.mood < −repair_thresh (0.4):
  P(mood_repair) = clamp(repair_base·(1 + regulate_style)·
    (1 + 0.5·self_est)·(1 − depr), 0, repair_cap)
    repair_base ≈ 0.3, repair_cap ≈ 0.7 — regulators reach for
    the incongruent-positive record; dysphorics do not
  a repair-arm recall inverts the cue-valence weight: the
    search weights positive-tagged records as if the cue were
    positive (candidate pool flips, θ unchanged)
  if the repair recall fires: C.mood += repair_lift·(1 − depr)
    (repair_lift ≈ 0.1 — modest, Josephson's is a shift not a
    cure) AND the recalled record takes ordinary retell_boost
    — repairing also strengthens the good memory
LOCKED NULL repair_dep_null: when depr ≥ 0.5, P(mood_repair)
  uses the (1 − depr) term toward zero AND repair_lift = 0 —
  the dysphoric character recalls the good memory and stays
  sad (Joormann & Siemer — the failure is in the lift, not
  just the reaching); distraction path (dforget/redirect) is
  their working channel
```

Emergent: the resilient main, after a bad day, narrates the
good summer — and the audience watches the mood meter actually
lift. The depressive main tries the same move and it does
nothing; their repair is distraction, a different mechanism
entirely. (P823)

---

## 93. Felt or believed — how the character answers "how did you feel?"

Every pass so far priced *re-firing* — affect re-instantiated
from the record. The emotion-report literature says the answer
a character GIVES often bypasses the record entirely:

- Robinson & Clore 2002 (*Psych. Bull.* 128:934 — verified, the
  accessibility model): reports of past emotion draw on
  episodic retrieval for very recent experiences; beyond ~2
  weeks, reports reconstruct emotion from SEMANTIC sources —
  beliefs about the self ("I'm an anxious person"), beliefs
  about the situation ("dentists are scary"), and current
  state — not from the stored feeling. The divergence between
  experience-sampled emotion and recalled emotion is large and
  systematic.
- Levine & Safer 2002 / Levine et al.: remembered emotion is
  biased by current appraisal — §28 already implements the
  appraisal-drift (`emo_update_k`); what that channel lacks is
  the report-layer bypass: the character who reports an emotion
  that was never in the record at all.
- Verified consequence structure: experiential emotion (fired
  affect) and reported emotion (verbal report) are different
  quantities with different error structure — reports are
  stable, stereotyped, identity-consistent; experiences are
  variable, arousal-bound.

**Spec consequence (§6.163):**

```
emotion reports split into two channels:
  felt report (record fires, arousal re-instantiated — existing
    machinery; available while the record clears θ)
  believed report (record absent/thin OR report-context is
    "how did you feel about X" with recency > felt_window
    ≈ 14 days): the report samples
      reported_affect = mix(self_belief, schema_prototype,
                            current_mood_bleed)
    — identity beliefs and the event-type script, not the tag
  felt_window is the Robinson & Clore seam: inside ~2 weeks
    reports track the record; beyond it they drift toward
    belief-reconstruction EVEN WHEN the record is intact
    (accessibility model: retrieval is effortful; the cheap
    answer is the theory of self)
  divergence audit: when a believed report and the record's tag
    disagree by >0.4, emission carries `felt_believed_gap:true`
    — the character says "I was devastated" about a record
    tagged mildly annoyed; the gap is data, not a bug
LOCKED NULL felt_write_null = 0: believed reports never write
  to the record's affect tag — the false report is emitted, not
  stored; a later felt recall can still refire the true tag
  (the record remembers what the report forgot)
```

Emergent: asked in month three how the breakup felt, the
character answers from who-they-are — "it destroyed me" over a
tag of tired resignation, or "I barely noticed" over a hot
record that will still refire on the right song. Both channels
true; the disagreement IS the human shape. (P824)

---

## 94. Spec delta (v5.24 → v5.25)

Params (all new, clamp ranges in profiles §0):

- `grat_gain` 0.5, `grat_fade_resist` 0.4; Event
  `benefit:true`+`benefactor`, record `grateful:true`, emission
  `reciprocate:true` — §84
- `corumin_gate` 0.4, `corumin_bond` 0.03, `corumin_damp_loss`
  0.6; jointRecall resolution field `solved:true`; age floor
  ~10y — §85
- `cueContext.reflect:{mode:"distanced"}`, `dist_cool` 0.5,
  emission `distanced:true`; locked `dist_avoid_null` 0 — §86
- `humor_reapp_k` 0.35 (encode cool, arousal<0.85 gate),
  `humor_replay_k` 0.15 (per-record once-per-window replay
  cool), verbatim thin ~15%; new trait `humor` — §87
- `hotcold_k` 0.5, `hotcold_gap_thresh` 0.5, emission
  `cold_read:true`; locked `hotcold_store_null` 0 — §88
- `threat_cue_gain` 0.15, `threat_hold` 0.3, context
  `anxiety_state`; depr excluded (locked dissociation) — §89
- `broaden_k` 0.25, `mood_broaden_floor` 0.3; locked
  `broaden_store_null` 0 — §90
- `dis_extinct_mult` 0.4, `dis_cc_mult` 0.9, `disg_prop_gain`
  0.3 (+`disg_prop` composite) — §91
- `repair_base` 0.3, `repair_cap` 0.7, `repair_thresh` 0.4,
  `repair_lift` 0.1; locked `repair_dep_null` (dysphoric lift
  zero) — §92
- `felt_window` 14 days; `felt_believed_gap:true` audit
  emission; locked `felt_write_null` 0 — §93

Fields: Event `benefit`/`benefactor`/`humor`/`solved`; record
`grateful:true`; cueContext `reflect.mode`; emission
`reciprocate`/`distanced`/`cold_read`/`felt_believed_gap`;
context `anxiety_state`; new IndivTraits axis `humor`
(extra+open loading, mild −neurot). Locked nulls:
dist_avoid_null, hotcold_store_null, broaden_store_null,
repair_dep_null, felt_write_null (+ depr exclusion on §89
threat priority).

## 95. Age guidance (extends §§10/23/37/53/67/81)

- `grat_*`: gratitude capacity develops with benefactor-cost
  appraisal — benefit:true mints at half gain below ~8
  (children register kindness, under-appraise cost; HYPOTHESIS
  knot), full adult thereafter; elder positivity emphasis
  raises grat_gain ×1.15 at 65+ (HYPOTHESIS).
- `corumin_*`: gated ≥10y both participants (Rose & Rudolph —
  verified developmental emergence); peak adolescent→young-
  adult; adult rate persists; sex loading handled trait-side.
- `dist_cool`: distancing capacity is metacognitive — children
  use it poorly (age-floor ~0.3 efficacy below ~10, HYPOTHESIS);
  mindful trait composes multiplicatively; elders skew slightly
  higher (SST distancing tendency, ×1.1 at 65+, HYPOTHESIS).
- `humor_*`: humor regulation present by late childhood;
  humor_reapp_k flat adult; elderly humor styles stay
  affiliative/positive — unchanged.
- `hotcold_*`: no reliable age literature — flat across adult
  lifespan (HYPOTHESIS: flat; the empathy gap is a
  visceral-state mechanism, not a developmental one).
- `threat_cue_gain`/`threat_hold`: trait-anxiety expression
  flat adult; older adults' threat bias declines relative to
  positivity shift (Mather & Carstensen — threat priority
  attenuates ×0.7 at 65+, DEBATED — take weak end).
- `broaden_k`: positive-affect broadening shows in elders too
  (Rowe replication arm weak); flat with HYPOTHESIS flag.
- `dis_*`: disgust conditioning/extinction pattern present from
  childhood (contamination learning is early — Rozin); flat
  adult; disg_prop composite unchanged by age.
- `repair_*`: mood-repair emerges ~adolescence with regulation
  competence (below ~10, repair_base ×0.3); elders' repair
  succeeds MORE often (positivity arm — ×1.2 lift at 65+,
  SST-consistent, HYPOTHESIS).
- `felt_window`: the belief-reconstruction seam is hypothesized
  adult-flat; children's reports may run believed-channel
  earlier (weaker episodic access — felt_window ×0.5 below
  ~10, HYPOTHESIS).

## 96. Validation probes (P815–P824; registry continues)

- **P815 gratitude mint (MUST — locked asymmetry):** benefit:true
  event with cost_appraisal 0.8 vs matched pleasant non-benefit
  event on same benefactor: the benefactor CondEntry must mint
  grateful:true, exceed the §4.9 positive-entry strength, decay
  measurably slower across 60 days, and emit reciprocate:true on
  a later benefactor-need event. FAIL if the entry decays at
  ordinary positive rate or if no entry mints on low-cost events.
- **P816 co-rumination bond/affect split (MUST — sign lock):**
  two high-rumin characters jointRecall a shared negative record
  thrice: bond_strength must rise ≥3×corumin_bond·0.8 AND the
  record's negative tag must NOT take verbal_dampen (damp_loss
  active); a solved:true retell arm must take the ordinary
  dampen (escape channel). FAIL if bond grows without affect
  refresh or if the loop applies below age floor.
- **P817 distanced reflection (MUST — locked null):** a negative
  record reflected under reflect.mode:distanced vs immersed:
  fired affect lower by dist_cool, coherence accrual EQUAL, and
  theta/accessibility IDENTICAL post-session (dist_avoid_null —
  FAIL if distancing raises theta or adds surcharge);
  distanced:true emission present.
- **P818 humor reappraisal (MUST):** humor:true on negative event
  (arousal 0.6) vs matched unfunny: arousal_tag lower by
  ~humor_reapp_k, verbatim fields ~15% thinner; at arousal 0.9
  the gate blocks the cool (Strick ceiling). Replay arm: two
  humor:true retells cool the tag ~2×humor_replay_k; FAIL if
  replay cool exceeds once-per-window cap or touches neutral
  records.
- **P819 hot–cold read (MUST — locked null):** reconstruct an
  arousal-0.8 own-impulsive record under C.arousal_now 0.2:
  re-fired affect attenuated ≥hotcold_k·0.5, cold_read:true
  emitted, stored tag and verbatim fields byte-identical
  (hotcold_store_null); re-present the cue under arousal_now
  0.7 — fired affect must return to full tag strength.
- **P820 threat priority (MUST — dissociation lock):** under
  anx_eff 0.8, cue competition over matched-strength records
  must surface threat:true first at rate exceeding baseline by
  the threat_cue_gain margin; under depr 0.8 / anx_eff 0 the
  same set must show NO threat preference (the anxiety/depression
  dissociation is locked). threat_hold: ambient scan dwell on
  threat records longer under anxiety.
- **P821 broaden fan (MUST — locked null):** C.mood 0.7 vs 0:
  associative search must clear a measurably weaker record class
  (θ_eff cut) and search_breadth effective must rise; all
  store fields byte-identical across arms afterward
  (broaden_store_null — read-side only).
- **P822 disgust extinction asymmetry (MUST):** disgust
  CondEntry: five safe exposures must move safeCount <0.4× a
  matched fear entry (dis_extinct_mult); three positive
  rival-tag mints (§72 counterconditioning) must reduce fired
  affect near-normally (dis_cc_mult ~0.9 arm). FAIL if
  extinction and counterconditioning behave identically on
  disgust entries — the asymmetry IS the probe.
- **P823 mood-repair gate (MUST):** negative mood, regulator
  profile vs depr≥0.5 profile: regulator arm shows positive-
  candidate inversion and post-recall mood lift; depr arm shows
  neither (repair_dep_null — lift must be ~0 even when a
  positive record is force-recalled). FAIL if depr arm lifts.
- **P824 felt-vs-believed (MUST):** (a) report "how did X feel"
  at day 3 vs day 30 on an intact record: day-3 report tracks
  tag; day-30 report shifts toward self_belief/script with
  felt_believed_gap:true when divergence >0.4; (b) the record's
  tag unchanged by any believed report (felt_write_null);
  (c) a later strong sensory cue still refires the true tag —
  the record remembers what the report forgot.

Registry now P1–P824; numbering stable.

## 97. Honest limits (Part VII)

- **Gratitude** has strong theory (find-remind-bind) but thin
  *memory* evidence — the durability claim (`grat_fade_resist`)
  is extrapolated from the motive-persistence findings of
  Bartlett & DeSteno, not a measured decay rate. The person-entry
  form is our operationalization.
- **Co-rumination** effects are on friendship quality and
  symptom inventories, not record mechanics — `corumin_bond`
  and `corumin_damp_loss` magnitudes are priors; the solved:true
  escape discriminator is our formalization of Rose's
  "repetitive, without resolution" criterion.
- **Directed distancing** sits on §5.39's spontaneous persp
  layer; whether deliberate distancing uses the same machinery
  at different gain is assumed, not shown. dist_avoid_null is
  the load-bearing verified cell (Ayduk & Kross: not avoidance).
- **Humor reappraisal** magnitudes: Kugler & Kuhbandner
  measured amygdala + recognition decrement on aversive
  pictures; mapping that onto arousal_tag cool + verbatim thin
  is direct, but humor_replay_k (the running-gag decay) is our
  accumulation model — flagged HYPOTHESIS.
- **Hot–cold** is priced for visceral drives (hunger, fatigue,
  arousal); extending the gap to emotional arousal generally is
  the standard reading but the strict evidence is drive-state.
  State-specificity implemented as drive-channel match —
  coarse.
- **Threat priority** magnitude (0.15) is calibrated to keep
  threat-first rates visible without swamping cueMatch; the
  anxiety/depression dissociation is textbook (Williams et al.)
  but its boundary under comorbidity is genuinely messy —
  we implement the clean dissociation and flag it.
- **Broadening** is a semantic-attention finding; projecting it
  onto episodic cue thresholds is the standard broaden-and-build
  reading but the episodic recall evidence is thinner than the
  attention evidence. Locked to read-side only to bound the
  risk.
- **Disgust** asymmetry (extinction fails / counterconditioning
  works) is two-study solid in evaluative-conditioning paradigms;
  contamination fear in the wild has confounds (disgust
  propensity, inflation). `disg_prop` composite reuses neurot +
  neurot + consc rather than a dedicated trait — honest but coarse.
- **Mood repair** is the strongest causal chain in the pass
  (Josephson's self-report + Joormann's dysphoric failure);
  repair_lift 0.1 is deliberately small — the lab measured a
  report shift, not a cure.
- **Felt/believed** is the most consequential new split for
  believability: characters who report emotions their records
  never held. The 14-day seam is Robinson & Clore's rough
  boundary; the mix weights (self_belief vs script vs bleed) are
  unspecified by the model — we price them equal-ish and flag
  the weighting as the main open parameter.

# Part VIII — v89: the quiet uses of feeling — how now bends then, how choosing rewrites options, and how suppressing leaves dents (2026-09-23, eighth pass)

Parts I–VII priced what emotion does to records at mint,
decay, cue, retell, and repair. Part VIII prices the
remaining asymmetries where the FEELING OF NOW silently
re-edits the FEELING OF THEN — the biases a spectator
actually watches for: the partner who "never loved you"
after the breakup, the option you didn't pick getting
uglier in hindsight, the boundary where an evening splits
in two. Plus three edge-mechanisms the earlier passes left
informal: mood-state-dependent retrieval, deliberate
suppression's aftereffects, and peritraumatic dissociation.
The spine throughout: **bends are emission- or
re-encode-side; the born tag is never silently rewritten
by current state** (felt_write_null / hotcold_store_null
discipline, §§93/88).

## 98. Consistency bias — today's bond rewrites yesterday's feeling

The most consequential single bias for a relationship sim.
McFarland & Ross 1987 (dating couples, 2-month longitudinal):
partners whose relationships *improved* recalled their earlier
feelings as more positive than they had reported at the time;
partners whose relationships deteriorated recalled them as
more negative — recalled past tracked the PRESENT evaluation,
not the stored one. Karney & Coombs 2000 (newlyweds, 4y):
satisfaction trajectory, not satisfaction level, drove the
direction of bias; women showed it more. Scharfe &
Bartholomew 1995; Sprecher 1999 same direction for
attachment. Holmberg & Holmes 1994: reconstructed premarital
narratives correlate with current, not initial, satisfaction.
This is *not* mood-congruent confabulation (§63 — a fill
on absent content): it is a systematic re-valence of
surviving affect reports on an intact relationship.

Mechanics (spec §6.173). Emission of past-feeling reports
toward a person (§6.163 believed channel AND the felt
channel's *reported* tag — the stored tag still does not
rewrite): `reported_affect = stored + rel_consist_k·
(1−field_verbatim)·signΔ·|bond_now − bond_then|` where
bond_then is the stored bond field, `rel_consist_k` 0.3.
- **Gate 1 — person-scoped:** only applies to affect fields
  whose object is a CondEntry person (§31). Events with no
  person-field are exempt — locked `consist_scope:"person"`.
- **Gate 2 — direction matters:** sign of the bend follows
  Δbond, not bond level (Karney & Coombs). A stable-unhappy
  marriage does NOT produce "never loved" reports; a
  deteriorating one does. `consist_floor` 0.1 |Δ| minimum.
- **Gate 3 — verbatim survives:** verbatim-rated fields
  (§2's verbatim track) bend at `(1−field_verbatim)` — a
  remembered letter keeps its wording even when its reported
  warmth shifts. Locked `consist_fact_null`: non-affect
  content (what was done/said) never bends — only how it
  felt. Fischhoff-style discipline (§6.168 hind_store_null).
- **Audit:** bend > `consist_audit` 0.4 emits
  `rewrote_feelings:true` — spectator-visible when a
  character narrates a past a viewer watched live.

Personality: `consist_gain` scales with `self_concept`
stability (high = less bend — a strong self-theory resists
present-pull); `rumin` adds bend on deteriorations only
(rehearsal of the grievance consolidates the revised
feeling — §60 gate).

## 99. Mood is an internal context — state-dependent retrieval, priced small

Bower, Monteiro & Gilligan 1978; Bower 1981 proposed mood
as an encoding-retrieval context. The honest verdict after
two decades: real but SMALL and fragile — Eich & Macaulay
2000 review puts it well below place/context reinstatement,
largest when cues are *self-generated* and material is
affectively charged; near-absent when the environment
supplies strong external cues (Smith & Vela 2001
meta-analysis: context-dependency generally; mood
specifically is the weakest of the context terms). Ucros
1989 review same: effect requires the mood to be genuinely
installed at both ends. We already carry `w_msd` (v0.2
clamp ≤0.25 — deliberately weak). Part VIII prices the
*conditions* under which that weak term matters, so the
substrate doesn't apply it flatly.

Mechanics (spec §6.174). `w_msd_eff = w_msd·
(1 + msd_selfgen_gain·selfGenerated)·(1 − msd_extcue_pen·
env_cue_share)`:
- `selfGenerated` — the recall was spontaneous/internally
  cued (no Event cue, no conversational prompt): the msd
  term roughly triples (`msd_selfgen_gain` 2.0). Internal
  search is where mood-as-context lives (Eich & Macaulay).
- `env_cue_share` — fraction of cueMatch from place/people/
  topic (external channels): each unit halves the term
  (`msd_extcue_pen` 0.5); a Dolores-Park cue makes today's
  mood nearly irrelevant.
- Affective-charge gate: term applies full when the
  candidate record |valence| ≥ `msd_charge_gate` 0.3, else
  at `msd_neutral_mult` 0.3 — mood context binds emotional
  material, barely touches neutral (Bower's own boundary).
- Locked `msd_store_null`: mismatch never *erases* — the
  term is cueMatch-side only; a mismatched-mood record is
  harder to reach, never deleted.

Distinct from mood-congruent *content* selection (§63,
§8): congruence picks WHICH record wins among matched
candidates; state-dependency is a match-strength term that
helps or hurts ALL candidates whose encode-mood differs
from now. Keep them separate — they compose.

## 100. "Don't think about it" leaves dents — suppression-induced forgetting

Anderson & Green 2001 (Think/No-Think): deliberately
preventing a cued memory from entering awareness, repeated
~16×, reduces later recall of the suppressed item —
INCLUDING on independent probes (cues never paired with it
in training), which rules out simple cue-blocking and
argues for inhibition of the representation itself.
Anderson & Huddleston 2012 (Nebraska Symposium): ~10%
below-baseline effect aggregated over 47 experiments;
grows with suppression repetitions; valence-neutral in
aggregate (the 2024 multilevel meta re-confirms: small
SIF, larger on same-probe than independent-probe tests,
unaffected by emotional content — honest bound: SIF is a
*retrieval-control* phenomenon, not an emotion one).
Levy & Anderson 2008: suppression also quiets the
emotional response on later recall — the feeling fades
with the fact. Rebound side: Wegner's ironic-process work
(1987, 1994) — suppression under cognitive load produces
the intrusions it prevents; Wenzlaff & Wegner 2000:
suppressed thoughts become hyper-accessible afterward,
especially in dysphoria.

Mechanics (spec §6.175). A `suppress:true` reflect-mode
(§6.156 sibling) or repeated cue-avoidance of the same
record mints `sup_n` on the record:
- Each successful suppression (cue presented, record NOT
  emitted) adds `sup_n += 1`; record's effective R for
  *all* cue channels decays by `sif_pen·log1p(sup_n)` —
  cue-independent because the meta says independent probes
  still fail (0.04/log — deliberately small, ~10% at
  sup_n 15).
- `sif_load_rebound`: if `C.load` ≥ 0.6 during a suppress
  attempt, the attempt FAILS and instead mints an
  intrusion (`rebound:true` emission, fires the record at
  intrusion_thresh×(1−0.2) next ticks) — Wegner's ironic
  arm; `rumin` and dysphoric `C.mood` each add
  `sif_rebound_gain` to failure odds.
- `sif_tag_decay` 0.35: suppressed records' affect tags
  cool slightly faster on later successful recalls (Levy
  & Anderson) — the relief pathway that is NOT just
  extinction: applies on top of §16's verbal dampen, not
  instead of it.
- Locked `sif_del_null`: suppression never archives or
  deletes — it is a dent in reachability, and every
  suppressed record keeps its full latent match-key; a
  strong enough cue (resurrect path §retrieval) still
  fires it. The white bear keeps its claws.
- Honest bound: SIF magnitude is small and contested at
  the individual-study level; implement as a slow lever,
  flag `sif_pen` magnitude HYPOTHESIS — the probe gates
  sign and order, not the exact slope.

## 101. The story you choose to tell — redemption and contamination sequences

McAdams 2001, 2006 (life-narrative research): when people
narrate autobiographical episodes, a stable *sequence
schema* shapes the retell — REDEMPTION (bad → good: the
negative scene is narrated as yielding growth, relief,
insight) vs CONTAMINATION (good → bad: a positive scene
narrated as ruined, poisoned, foreshadowing loss). The
schema is a personality-stable narrative habit (McAdams
et al. 1997: redemptive narrators score higher on
generativity and well-being; Adler et al. 2015, 2017:
sequence shifts in therapy track symptom change) — and
each retell that follows the schema *drifts the record's
tag* in the schema's direction (Pasupathi 2001 +
§16 verbal-dampen machinery: the retold version is the
version that keeps getting stronger).

Mechanics (spec §6.176). Trait `narr_seq` ∈ [−1,+1]
(contam ↔ redempt, bible-pinnable, near-zero for most):
- On jointRecall/self-retell of a NEGATIVE record:
  redemptive narrators mint the retell with
  `redempt_reframe_p = max(0, narr_seq)·redempt_k` (0.5)
  — the emitted account appends a `resolution` beat
  (world-supplied or generated), and the tag cools an
  extra `redempt_cool` 0.15 on top of §16 dampen.
  Contam narrators: `contam_gain = max(0,−narr_seq)·
  contam_k` — the tag *warms* back (cools less:
  dampen ×(1−contam_gain), and on POSITIVE records a
  contam retell can flip reported valence negative —
  "that was the night before everything went wrong").
- **Event-rewrite side (new in VIII):** a resolution
  event the world actually delivers (apology accepted,
  recovery milestone — `resolve:true` on the linked
  record) feeds `narr_seq` once: +`narr_seq_shift` 0.05.
  Witnessed betrayals feed −. The trait drifts only on
  real world events, never on retells themselves —
  same discipline as `purpose` (§4.45d).
- Locked `narr_truth_null`: a redemptive retell changes
  the TAG and the FRAMING, never the content fields —
  "it made me who I am" does not erase what happened;
  a contam retell cannot invent new negative content
  fields, only re-valence reported affect.
- Emission marker `seq_redempt` / `seq_contam` on the
  emitted account — the spectator sees the schema at work.

## 102. The repair that leaves no trace — immune neglect on the memory side

Wilson & Gilbert (immune neglect, Gilbert et al. 1998;
Wilson, Meyers & Gilbert 2001; Wilson & Gilbert 2003
review): people recover from negative events faster and
more completely than they predict — and crucially for a
memory model, they *under-credit the recovery itself*.
The rationalization machinery (§101's redemptive frame,
§61 forgiveness, §72 rival tags) works largely
unconsciously, so what gets stored is the WOUND, not the
healing process. Consequence already documented in §50's
impact bias (forecasts overshoot); the memory-side result
is that the record of HOW one healed is thin: the
event ends in the ledger at peak pain + a thin resolved
flag, while the days of gradual recovery — dozens of
small ordinary mornings — consolidate as nothing.

Mechanics (spec §6.177).
- `resolve_thin_null` (locked): post-event recovery
  micro-events mint at baseline E×`resolve_thin` 0.3 —
  ordinary-coping days are ordinary, and ordinary is
  forgettable (distinctiveness confound §47 cuts the
  other way too: nothing about "another normal Tuesday"
  competes for space).
- Resolved negative records (forgiven, counterconditioned,
  redemptively retold) keep `resolved:true` but the
  *duration-to-recover* field decays verbatim-fast —
  the remembered wound outlives the remembered convalescence.
- **Forecast seam:** §50 impact-bias reads peak tag and
  stored duration; it does NOT read an adaptive recovery
  rate — `immune_blind_null` (locked): characters forecast
  from the scar, not from their own demonstrated healing
  speed. This is the mechanism-level source of durable
  forecasting error — a character who healed from the
  last breakup in 3 weeks still predicts months of pain
  for the next one.
- Spectator seam: `heal_gap:true` emission when a
  character voices a forecast that exceeds their own
  stored (thin) recovery record by > `heal_gap_k` 2× —
  the world can *show* the neglect.

## 103. The road not taken gets uglier — choice-supportive memory

Henkel & Mather 2007 (Psych Sci; Mather & Johnson 2000;
Mather, Shafir & Johnson 2000): after choosing between
options, memory migrates option features to favor the
chosen — positive features are misattributed TO the
chosen option, negative features to the rejected, and
invented positive features get "remembered" as belonging
to what you picked. Critically delay-dependent: the bias
GROWS over days as feature-source tags rot (§source
machinery — feature→option binding is exactly a source
tag). Henkel & Mather's older adults showed MORE bias,
not less — choice-supportive distortion is a positivity
mechanism for the chosen self (§105 link). Benney &
Henkel 2006: the bias is reliable even at short delay
when source memory is weak; Svenson & Benthorn 1992:
post-decision differentiation begins immediately.

Mechanics (spec §6.178). `decision` records (Event kind
`choice` with `options:[{id, features…}], chosen:id`):
- Each non-chosen option's affect-valued features carry a
  source tag `opt_src`; tag decays at `beta_source·
  choice_src_mult` (1.4 — option-feature binding is
  fragile). On report/recall of the decision, feature
  fields with `opt_src` below θ get re-attributed with
  probability `choice_bias_k·(1−opt_src)` (0.25): positive
  → chosen, negative → rejected; invented positive fills
  (§confab machinery) land on the chosen side at
  `choice_fill_gain` 0.5.
- Age gradient: `choice_age_gain` — at age_eff 80 the bias
  ×1.4 (Henkel & Mather), the positivity pathway again.
- `choice_irrevocable_gain` 0.3 extra on irreversible
  choices (lease signed, job quit): commitment needs the
  distorting (Gilbert & Ebert 2002 — the immune system
  works hardest on unchangeable outcomes; locked
  `choice_rev_null`: reversible choices still bias, just
  less — never zero).
- Audit `rationalized:true` when a re-attributed feature
  is emitted — the spectator watched the actual options.
- Locked `choice_content_null`: the option SET and the
  choice itself never reattribute — what was chosen is
  fact; only feature *ownership* drifts.

## 104. The evening splits in two — affect shifts mint event boundaries

Event segmentation (Zacks lab; Ezzyat & Davachi 2011;
Clewett & Davachi 2017): continuous experience is chunked
into episodes at context changes, and boundaries *organize*
later memory — within-event order is preserved, across-
event order degrades, and across-boundary pairs feel
farther apart in time (temporal-distance dilation:
Heusser, Poeppel, Ezzyat & Davachi 2022, Nat Comms — the
"reset" model). Clewett et al. 2020 (Nat Comms): the
boundary itself is an arousal burst (pupil dilation) —
and arousal peaks index where the mind decides a new
event began. Rouhani & Niv-adjacent 2020 (Princeton):
reward-prediction-error spikes mint boundaries
retroactively — the surprising scene binds backward,
splitting the stream. The 2023 Cognition & Emotion
dissociation (Clewett-group replication family): emotion
and segmentation pull in OPPOSITE directions on order
vs item-context binding — emotion *enhances* temporal
order for its own items while boundaries *impair* order
across the seam. RW consequence: an affect swing inside
one "scene" (the dinner that turned into a fight) is
where the record splits, and the split is legible in
later recall errors.

Mechanics (spec §6.179). Within an Event, tracked
`affect_shift = |arousal/valence delta between scene
beats|` (world supplies beat boundaries or the mint
infers from beat-level arousal fields):
- `affect_shift ≥ bound_thresh` (0.4) mints
  `seg_boundary:true` on the post-shift beat's record;
  negative-valence shifts add `bound_neg_amp` (0.15) —
  the aversive turn splits deeper (2023 CE finding).
- **Order:** recalled order of fields ACROSS a
  `seg_boundary` pays `bound_order_pen` (0.3) — "did the
  toast come before the fight?" becomes genuinely hard;
  WITHIN-segment order gets `bound_within_gain` (0.15,
  local-primacy leg of the reset model — items early in
  a segment order best).
- **Distance:** across-boundary pairs emit
  `felt_dt ×(1+bound_dist_gain)` (0.35) — "the calm part
  feels like a different night" (§46 machinery carries
  the emission).
- **Interference:** records in different segments accrue
  less mutual proactive interference (`bound_interf_res`
  0.25 reduction) — segmentation protects (Ezzyat &
  Davachi's original result); records in the same segment
  merge/interfere normally.
- Locked `bound_del_null`: the boundary is organizational
  metadata — it never prevents a strong cue from bridging
  the seam (the fight can still bring back the toast;
  it just won't come back *in order*).

## 105. The positivity effect — and the distraction that kills it

Mather & Carstensen 2005 (TICS); Kennedy, Mather &
Carstensen 2004 (Psych Sci, autobiographical): older
adults disproportionately prefer positive over negative
material in attention and memory — the *positivity
effect*, interpreted via socioemotional selectivity
(Carstensen's SST: shrinking time horizon prioritizes
emotion-regulation goals). Reed, Chan & Mikels 2014
meta-analysis confirms a real age-graded positivity
preference. The decisive boundary is Mather & Knight
2005 (Psych & Aging) + Knight, Seymour, Gaunt, Baker,
Nesmith & Mather 2007: the effect is CONTROL-DEPENDENT —
under divided attention at encoding, older adults not
only lose the positivity preference but *reverse* it,
attending and remembering MORE negative material than
the young; low-cognitive-control elders show no
positivity at all. This is a motivated-cognition
mechanism running on scarce resource — when the resource
is taxed, the default negativity bias resurfaces.
DEBATED alternative framings (neural-decline accounts;
Murphy & Isaacowitz 2008 meta on attention showing weak
age-valence interactions) are honored by keeping the
mechanism on the regulation pathway, not a hard valence
filter.

Mechanics (spec §6.180). A `pos_eff` term active only
for `age_eff ≥ pos_onset` (55) on *valenced candidate
scoring*:
- Encode arm: `E_pos *= (1+pos_enc_gain·pos_eff)` and
  `E_neg *= (1−pos_enc_pen·pos_eff)` — older characters
  mint positive a bit stronger, negative a bit weaker;
  `pos_eff` ramps `pos_ramp` per year past onset, capped
  0.5, scaled by `control_eff` (cognitive-control
  composite: reserve × (1−load) — Mather & Knight's
  control dependence).
- **The reversal (the load-bearing clause):** under
  `C.daLoad`/`C.load ≥ 0.6`, `pos_eff` signs NEGATIVE —
  `E_neg *= (1+neg_rebound·|pos_eff|)` and retrieval
  threat-priority (§6.159) doubles on the oldest-old.
  The distracted grandparent is the MOST negativity-
  biased person at the table — Knight 2007's reversal,
  not merely the effect's absence.
- Retrieval arm: positive-mood broadening (§6.160)
  gets `pos_broaden_gain` on the oldest-old; negative
  records pay a small θ surcharge `pos_theta` 0.05 under
  full attention only.
- Locked `pos_youth_null`: below `pos_onset` the term is
  identically zero — youth's bias, such as it is, is not
  this mechanism (young adults show no motivated
  positivity preference — Kennedy 2004 control
  conditions).
- `pos_appraisal_null` (locked): the effect never touches
  threat-relevant fields — a real danger still encodes;
  SST redirects *gratification* attention, not survival
  attention (Mather & Knight's own caveat).

## 106. Checked out while it happened — peritraumatic dissociation

Ozer, Best, Lipsey & Weiss 2003 (Psych Bull meta, 68
studies): peritraumatic dissociation — feeling numb,
unreal, out-of-body, or time-warped DURING the event —
is the single strongest *during-event* predictor of later
PTSD symptoms (r ≈ .35), stronger than peritraumatic
fear itself. van der Kolk & Fisler 1995; Marmar et al.
1994: dissociative encoding produces recall that is
fragmentary, often somatic, and intrusive rather than
narratable. Proneness is trait-distributed (absorption,
dissociative capacity — Putnam 1997 DES work; also
higher under fatigue and prior trauma — prior `trauma_n`
records raise the base rate, "kindling" pattern).
Different from §7's trauma-tagging (which is
arousal-magnitude-driven — EVERYONE fragments past
arousal 0.9): dissociation is PRONENESS-driven — two
characters in the same bad event walk out with different
record structures.

Mechanics (spec §6.181). Trait `dissoc` ∈[0,1]
(composite: absorption/neuroticism/fatigue at mint,
bible-pinnable as `absorption` loading):
- On events arousal ≥ `dissoc_arousal_gate` (0.6):
  `dissoc_p = dissoc·(1+kindle_gain·trauma_n)` rolls a
  dissociative encode. `kindle_gain` 0.3 per prior
  trauma record (cap ×1.9).
- A dissociated record mints `dissociated:true` with the
  §7 phenotype ROTATED: content fields present but
  `link_p ×(1−dissoc_frame_pen)` (0.5) — the record
  fails to bind to its context and to neighboring
  records (van der Kolk & Fisler's fragmentary quality);
  `narr_coherence` starts at `dissoc_coh_start` 0.2
  (§32 repair variable starts low — the record arrives
  pre-fragmented, not fragmentable).
- Retrieval asymmetry: voluntary cue-recall θ pays
  `dissoc_vol_pen` (0.1 surcharge — "I can't quite get
  to it"), but intrusion/spontaneous-fire threshold
  DROPS `dissoc_intru_gain` (0.15) — it won't come when
  called and won't stay away when cued accidentally
  (Ehlers & Clark's intrusive-poor-voluntary dissociation
  in PTSD phenomenology).
- `dissoc_time_warp`: `felt_dt` emission ×(1±0.4) seeded
  — dissociative time distortion lands either direction
  (slowed OR collapsed), unlike §45's arousal dilation
  which is one-directional.
- Locked `dissoc_content_null`: dissociation impairs
  BINDING, never content existence — details exist,
  orphaned; the confused character can still emit
  accurate fragments under strong cue.

## 107. The camera in the hand — photo-mediated encoding and the photo cue

Barasch, Diehl, Silverman & Zauberman 2017 (Psych Sci,
museum field + 3 lab studies): volitional photo-taking
redirects attention WITHIN an experience — visual
recognition improves (even for unphotographed regions),
auditory/verbal memory degrades; *mental* photo-taking
produces the same shift, proving the mechanism is
attentional, not offloading. Diehl, Zauberman & Barasch
2016 (JPSP): photo-taking increases engagement and
thereby ENJOYMENT of positive experiences — and worsens
evaluations of negative ones (engagement cuts both
ways). Henkel 2014 (the earlier "camera hurts memory"
result) found the offload deficit only when photos were
expected to be archived-for-you — reconciled: volitional
in-the-moment framing helps vision and costs sound;
delegated archiving costs everything. For RW: a
character at Dolores Park framing the sunset is
literally encoding a different event than the one her
companion gets.

Mechanics (spec §6.182). Event context `photographing`
(world-minted; ambient characters rarely, mains
personality-gated by `social`/extraversion):
- Encode: `visual`/`scene` fields ×(1+`photo_vis_gain`
  0.3); `verbal`/`auditory` fields ×(1−`photo_aud_pen`
  0.25); photographed-beat fields ×(1+`photo_frame_gain`
  0.2) beyond the visual gain (the framed content wins
  twice — Barasch's photographed>unphotographed gap).
- Valence interaction: positive events mint arousal_tag
  +`photo_engage_gain` 0.1 (enjoyment via engagement);
  negative events mint the same magnitude NEGATIVE —
  photographing the argument makes it feel worse in the
  moment AND encode deeper (Diehl 2016's asymmetry —
  locked `photo_neg_null` prohibits the positive-only
  reading).
- **Photo-cue (new cue carrier):** a later `photo_review`
  re-encounter event refreshes ONLY the fields that were
  `photographed:true` at mint — the image preserves its
  contents verbatim-strong (`photo_verbatim_resist` 0.4
  slower verbatim decay on framed fields) while
  unphotographed context continues normal drift. The
  photo becomes the fixed face of a drifting event —
  and a channel for discrepancy (`photo_gap:true` audit
  when remembered affect has drifted far from what the
  photo still shows; St. Jacques & Schacter 2013's
  reactivation-selectivity reading).
- Locked `photo_offload_null`: volitional photographing
  never reduces overall E — the Henkel-2014 offload arm
  is reserved for `photographing:"archive"` context
  (world-supplied distinction: taking a photo to
  remember vs delegating memory to a device); absent
  that flag, engagement wins.

## 108. Spec delta (v5.36 → v5.37)

`memory-model-spec.md` v5.37. New §§6.173–6.182 (ten
mechanisms above). Params: +26 scalars (+2 traits,
+1 record flag family, +2 context flags, +1 event kind,
+2 emissions):

```
rel_consist_k 0.3, consist_floor 0.1, consist_audit 0.4  §6.173
msd_selfgen_gain 2.0, msd_extcue_pen 0.5,
msd_charge_gate 0.3, msd_neutral_mult 0.3              §6.174
sif_pen 0.04, sif_load_rebound 0.6, sif_rebound_gain 0.2,
sif_tag_decay 0.35                                     §6.175
redempt_k 0.5, redempt_cool 0.15, contam_k 0.6,
narr_seq_shift 0.05                                    §6.176
resolve_thin 0.3, heal_gap_k 2.0                       §6.177
choice_src_mult 1.4, choice_bias_k 0.25,
choice_fill_gain 0.5, choice_age_gain 1.4,
choice_irrevocable_gain 0.3                            §6.178
bound_thresh 0.4, bound_neg_amp 0.15, bound_order_pen 0.3,
bound_within_gain 0.15, bound_dist_gain 0.35,
bound_interf_res 0.25                                  §6.179
pos_onset 55, pos_ramp 0.02, pos_enc_gain 0.3,
pos_enc_pen 0.2, neg_rebound 1.0, pos_theta 0.05,
pos_broaden_gain 0.3                                   §6.180
dissoc_arousal_gate 0.6, kindle_gain 0.3,
dissoc_frame_pen 0.5, dissoc_coh_start 0.2,
dissoc_vol_pen 0.1, dissoc_intru_gain 0.15,
dissoc_time_warp 0.4                                   §6.181
photo_vis_gain 0.3, photo_aud_pen 0.25,
photo_frame_gain 0.2, photo_engage_gain 0.1,
photo_verbatim_resist 0.4                              §6.182
```

Traits: `narr_seq` ∈[−1,1] (bible-pinnable, event-
rewritable only); `dissoc` ∈[0,1] (absorption composite).
Record fields: `seg_boundary:true`, `dissociated:true`,
`sup_n`, `resolved:true`, `photographed:true` per field,
`opt_src` on option features. Event kinds/flags:
`choice`, `resolve:true`, `photographing` context
(+`:"archive"` variant), `photo_review` cue-carrier,
`suppress:true` reflect mode. Emissions:
`rewrote_feelings:true`, `rebound:true`,
`seq_redempt`/`seq_contam`, `heal_gap:true`,
`rationalized:true`, `photo_gap:true`. Locked nulls:
`consist_fact_null`, `consist_scope:"person"`,
`msd_store_null`, `sif_del_null`, `narr_truth_null`,
`resolve_thin_null` (magnitude), `immune_blind_null`,
`choice_content_null`, `choice_rev_null`,
`bound_del_null`, `pos_youth_null`, `pos_appraisal_null`,
`dissoc_content_null`, `photo_neg_null`,
`photo_offload_null`. Frozen: `msd_scope:"cueMatch"`.

## 109. Age guidance (extends §§10/23/37/53/67/81/95)

| mechanism | encodeAge | note |
|---|---|---|
| consist bend | <8 damp ×0.5 (thin relational ledger) | present-pull needs a longitudinal bond field |
| msd term | flat | mood-as-context has no known age gradient; keep w_msd clamp |
| sif | <10 weak (×0.6 — immature inhibitory control, Anderson developmental work); ≥65 `sif_pen` ×0.7 | control weakens at both ends |
| narr_seq | schema consolidates ~15–25 (McAdams identity-formation window — bump-adjacent) | `narr_seq` draws at bible-write; young mains nearer 0 |
| immune blind | flat — Gilbert's participants were young | the neglect is human-universal |
| choice bias | ≥60 ×`choice_age_gain` ramp | Henkel & Mather: old > young — the one distortion that GROWS with age |
| boundaries | ≥70 `bound_order_pen` ×1.3 (aging impairs temporal-order binding generally — Naveh-Benjamin) | |
| positivity | onset 55, ramp `pos_ramp`/yr, cap 0.5; control-scaled | the only mechanism here with a hard age gate |
| dissoc | flat base; `trauma_n` kindling makes it cohort-shaped | war/accident histories differ per bible |
| photo | flat; ambient use rare | platform-habit, trait-gated |

## 110. Validation probes (P938–P947; registry continues)

- **P938 consistency direction (MUST, sign-lock):** a dyad
  whose bond rises +0.4 over 60 days emits past-feeling
  reports bent positive by ≥`consist_floor`; a dyad whose
  bond falls the same amount bends negative; a STABLE-
  unhappy dyad bends < floor. McFarland & Ross 1987;
  Karney & Coombs 2000.
- **P939 msd conditions (SHOULD, dissociation):** at fixed
  cue strengths, self-generated recalls show mood-match
  effect ≥3× the externally-cued effect; neutral records
  show ≤`msd_neutral_mult` of the charged effect.
  Eich & Macaulay 2000; Smith & Vela 2001.
- **P940 SIF dent-and-rebound (MUST, dissociation):** 15
  successful suppressions produce below-baseline recall
  on both same-cue AND novel-cue probes (independence is
  the load-bearing cell); `C.load`≥0.6 suppression
  attempts produce MORE intrusions than baseline within
  2 ticks; record never archives (`sif_del_null`).
  Anderson & Green 2001; Anderson & Huddleston 2012.
- **P941 sequence drift (SHOULD, sign-lock):** narr_seq
  +0.8 vs −0.8 twins retell the same negative record 5×;
  the redemptive record's tag cools ≥`redempt_cool`-scaled
  beyond verbal-dampen; the contam record's reported
  valence drifts toward zero/negative; CONTENT fields
  identical in both (`narr_truth_null`). McAdams 2001.
- **P942 immune blind (SHOULD):** a character with a
  resolved negative record (peak tag 0.7, 21-day recovery)
  forecasting a matched new event overshoots stored
  recovery duration by ≥`heal_gap_k` and emits
  `heal_gap:true`; `immune_blind_null` — no recovery-rate
  term exists to correct it. Wilson & Gilbert 2003.
- **P943 choice migration (MUST, interaction):** 30 days
  post-decision, feature reports misattribute positive
  features to the chosen option ≥4× the reverse
  direction; effect grows with retention interval
  (day-2 < day-30); 80yo > 30yo (`choice_age_gain`);
  option set and choice fact intact
  (`choice_content_null`). Henkel & Mather 2007.
- **P944 boundary split (MUST, dissociation):** one
  3-beat event with an affect_shift ≥`bound_thresh` at
  beat 2: across-seam order errors ≥2× within-seam;
  across-seam `felt_dt` ≥1.3×; a strong cross-seam cue
  still retrieves (order lost, access kept —
  `bound_del_null`). Heusser 2022; Clewett 2020.
- **P945 positivity reversal (MUST, sign-lock):** 70yo
  vs 30yo twins, mixed pos/neg event: full-attention arm
  shows older recall skewed positive (pos_share +
  `pos_enc_gain`-scaled); divided-attention arm shows
  older skewed NEGATIVE relative to young — both arms
  required, `pos_youth_null` holds in the young.
  Mather & Knight 2005; Knight et al. 2007.
- **P946 dissociation split (SHOULD, dissociation):**
  dissoc 0.9 vs 0.1 twins, arousal 0.75 event: high-
  dissoc record shows link density <60% of low-dissoc
  + intrusion rate > low + voluntary θ surcharge —
  three-way split; content fields present in both
  (`dissoc_content_null`). Ozer et al. 2003.
- **P947 camera asymmetry (COULD):** photographing arm
  vs control: visual-field recall +, auditory-field −;
  photographed beats > unphotographed; positive event
  tag +`photo_engage_gain`, negative event tag −same;
  overall E parity (`photo_offload_null`); photo_review
  refreshes only photographed fields. Barasch 2017;
  Diehl 2016.

## 111. Honest limits (Part VIII)

- **Consistency bias** magnitudes: McFarland & Ross and
  Karney & Coombs measured *correlational* report shifts
  in small longitudinal samples; the bend-toward-present
  direction is replicated, the exact gain is ours
  (HYPOTHESIS — P938 gates sign and floor, not slope).
  Whether the bend applies to the felt channel's REPORT
  (not just believed reports) is our extension; the
  locked null keeps it emission-side regardless.
- **Mood-state-dependency** is the weakest context term
  in the literature and failed-replication-prone (the
  Eich group's own bounds are hedged); we keep `w_msd`
  clamped ≤0.25 and let the *conditions* carry the
  realism — self-generated internal search is where it
  lives.
- **SIF** effect size is small and the field has
  failed-replication history (the 2024 multilevel meta
  is the honest aggregate: real, small, method-sensitive).
  `sif_pen` is deliberately conservative; the meta's
  valence-neutrality is honored — we did NOT make SIF
  stronger for negative records, tempting as that is.
  The Wegner rebound arm is on separate footing
  (ironic process, not inhibition) and is priced as an
  intrusion mechanism, not a SIF multiplier.
- **Narrative sequences** are measured as coding
  categories on transcribed life stories — `narr_seq`'s
  continuum is our compression; the event-rewrite
  direction (redemptive experiences raise the trait) is
  documented in therapy-outcome data (Adler 2015) but
  the magnitudes are ours.
- **Immune neglect** as implemented is a *storage*
  claim: recovery events encode thin because ordinary.
  The forecasting consequence is established (Gilbert's
  lab); the specific "heal_gap audit" is a
  game-facing audit we invented — it operationalizes the
  neglect, it isn't from the literature.
- **Choice-supportive bias** is solid at the effect level;
  our routing through `opt_src` source-tag decay is the
  mechanism story (feature→option binding IS a source
  tag — clean fit), but `choice_src_mult`/`choice_bias_k`
  magnitudes are unpriced by the source papers.
- **Emotional boundaries**: the within/across order
  dissociation and distance dilation are well replicated
  (Heusser 2022 gives the mechanism model we literally
  implement — reset on boundary); the *negative-shift
  amplification* (`bound_neg_amp`) rests on a newer
  single-paradigm line (2023 CE) — flagged accordingly.
- **Positivity effect**: the motivated-cognition framing
  (SST + control-dependence + DA reversal) is the
  implemented account; the neural-decline counter-frame
  exists (Murphy & Isaacowitz's meta found weaker
  attention effects). The DA-reversal is the load-bearing
  testable cell — a sim that shows old-positivity under
  distraction has implemented the wrong mechanism.
- **Dissociation**: Ozer's meta is strong at the
  predictor level but the record-structure phenotype
  (binding loss vs content loss) is our formalization
  of the fragmentary-recall phenomenology; `kindle_gain`
  is plausible but unpriced.
- **Photo effects**: Barasch 2017 is one lab's program
  (well-powered, multi-study) — the visual/auditory split
  is verified; the photo-cue *preservation* asymmetry
  (framed fields resist drift) is our extension via
  St. Jacques & Schacter's reactivation-selectivity
  principle — flagged HYPOTHESIS.

# Part IX — v101: what the arousal leaves behind — the hangover window, the unpaid regret, the borrowed fear, and the gate that cortisol can't open alone (2026-09-24, ninth pass)

Parts I–VIII priced emotion's effect on the record it is
part of. Part IX prices the cases where the arousal is a
*carrier* — it outlasts its own event and stamps the next
one (§112), it pools into a potency scalar the earlier
passes left scattered (§113), it outlives its own decision
(§114), it resurfaces as embarrassment on a cheap cue
(§115), it misinvoices pain (§116), it fuses two witnesses
into one tie (§117), it needs a second hormone's signature
(§118), it enters through the senses with no search at all
(§119), it skews the whole next day dark when sleep is
skipped (§120), and it gates retrieval on whether the body
is in the same state it was then (§121). Spine unchanged:
emissions and re-encodes may bend; born tags do not
silently rewrite.

## 112. The emotional hangover — the next half-hour encodes hot

Tambini, Rimmele, Phelps & Davachi 2017 (Nat Neurosci 20:
271–278; verified): neutral items studied **9–33 minutes
after** an emotional block were recollected better than
neutral items studied before it — and the benefit tracked
reinstatement of the emotional-encoding brain state during
the later neutral encoding, not the items' own arousal.
Order control: N→E produced no backward benefit. The
carryover needs *sustained* emotion — brief arousal spikes
do not mint the state (Nature Reviews Neuroscience
commentary 2017). Dunsmoor, Murty, Davachi & Phelps 2015
(Nature) is the retroactive sibling: a shock-paired category
retroactively strengthens same-category neutrals encoded
*before* conditioning — concept-level reach, both
directions.

Mechanics (spec §4.57). A record whose minted arousal tag
exceeds `hangover_arm` (0.65) opens a decaying window on
the character's encoding state: for `Δt ≤ hangover_win`
(≈30 sim-min) subsequent records — *any* record, valence-
blind — mint with `E0 += hangover_gain·exp(−Δt/hangover_tau)`
where `hangover_gain` ≈0.25, `hangover_tau` ≈12 min.
- **The window belongs to the character, not the event.**
  It is a state field (`hangover_until`, `hangover_amp`),
  refreshed (not stacked) by a stronger arming event —
  `hangover_amp = max(amp_old·exp(−Δ/τ), amp_new)`.
- **No backward leg** (the N→E order control is the locked
  `hangover_retro_null`): records minted before the arming
  event never gain strength from it. Dunsmoor's retroactive
  strengthening is concept-mediated and already routed
  through §4.9 CondEntry fear-generalization — do not double
  it into a generic retroactive boost.
- **What it explains:** the afternoon after the fight
  remembers the parking meter. Spectator-visible texture:
  "and then, weirdly, I remember the whole walk home."

Personality: `hangover_gain` scales with `neurot` — the
sustained-state is an amygdala-engagement measure.
[HYPOTHESIS: single-lab program, well-controlled; direction
CONSENSUS, magnitude and 30-min bound ours.]

## 113. Bad outweighs good — the potency scalar, unified

Baumeister, Bratslavsky, Finkenauer & Vohs 2001 ("Bad is
stronger than good," Rev Gen Psych — the canonical review:
bad events/feedback/impressions outweigh good across
virtually every memory-adjacent measure); Rozin & Royzman
2001 (negativity bias taxonomy — potency, steepness,
mobility). Taylor 1991 is the counterweight: the negative
*also* mobilizes faster repair — the asymmetry is largest
at encoding and immediate response, smallest after
mobilization.

The spec already carries scattered negative multipliers
(`neg_affect_decay` 1.3 FAB leg, `neg_fidelity` 0.85 drift
discount, `valmismatch_gen`, rumination draw). Part IX
unifies the *encoding-time* potency into one named scalar
so profiles can't silently double-count:

`E0_valence = E0·(1 + w_emo·arousal)·(1 + neg_potency·
max(0, −valence))`, `neg_potency` ≈1.7 (clamp 0.8–2.5).
- **Signed, not absolute:** a +0.8 event and a −0.8 event
  are NOT symmetric at mint — the negative mints ~1.35×
  hotter at equal |valence|. Existing per-mechanism negative
  legs (`neg_fidelity`, `neg_affect_decay`) are unchanged —
  they govern *after* mint; `neg_potency` is the mint term.
- **Mobility clause (Taylor 1991):** the potency is
  largest pre-mobilization. Post-event regulation success
  (§17 regulate_style, §86 distancing, §87 humor) applies
  to the tag normally — `neg_potency` does not also tax
  repair. Locked `potency_repair_null`: the scalar never
  enters the regulation equations.
- **Profiles:** `neg_potency` is a free per-profile trait —
  the sunniest main can run 1.1, the anxious one 2.3.
  It is the single cheapest diversity lever in the doc.

## 114. The un-acted regret stays hot

Gilovich & Medvec 1995 (Psych Rev — the temporal pattern of
regret): **action regrets dominate the short run, inaction
regrets dominate the long run.** What you did stings now
and heals; what you didn't do festers for decades —
because the action closes its own case (you saw the
outcome, paid the cost, moved on) while the inaction never
gets a counterfactual disconfirmation. Roese & Summerville
2005 (Personality Soc Psych Rev): regret is the most
frequently named everyday emotion; opportunity breeds it —
regret concentrates where the door was open. Medvec,
Madey & Gilovich 1995 (Olympic medalists): bronze
happier than silver — counterfactual direction, not
objective outcome, sets the tag.

Mechanics (spec §4.59). Records minted from a foregone
option (`action_taken:false`, world flags the passed-up
choice) carry `regret:true` and decay at
`beta·regret_inaction_mult` (≈0.5 — half-rate) while the
same decision's taken-option records decay normally —
the asymmetry GROWS with time (Gilovich & Medvec's
crossover, not a level shift).
- **The counterfactual feed:** each voluntary recall of a
  `regret` record mints a `sim` record (§6.199) of the
  unlived branch at `counterfac_gain` ≈0.4 — inaction
  regrets accumulate *imagined* satellites; the welterweight
  memory is half simulation by year ten.
- **Opportunity gate (Roese & Summerville):** the record
  only mints `regret` if `opportunity:true` — a foreclosed
  option (no choice existed) cannot regret. World supplies
  the flag on the decision event.
- **Repair path:** actually pursuing the foregone option
  later mints a closing record that kills the multiplier —
  the door closing is what heals it (locked
  `regret_reopen_null`: a `regret` tag never re-arms once
  its opportunity field flips false).

## 115. Cringe returns cheap

Miller 1996 (Embarrassment: Poise and Peril — the
definitive treatment: embarrassment is mild, social, and
unusually persistent as *involuntary* recall); the clinical
line on intrusive embarrassment (Huppert, Roth & Foa 2003;
social-evaluative intrusions) and the cringe-attack
phenomenology are consistent: **low arousal at mint, high
intrusion frequency for years**, triggered by trivially
similar contexts. Unlike trauma intrusions (§7) there is no
dissociative fragmentation — the record is intact, veridical,
and *frequent*.

Mechanics (spec §5.111). `discrete:embarrass` records carry
`cringe_intrude` ≈0.3 added to their involuntary-draw
weight, with a **lower cue bar**: any of {same location,
same audience-member present, same activity-type} at
simOp ≥ `cringe_cue_sim` (0.35 — well below the ordinary
intrusion similarity floor) can fire the emission. No
affect-flashback, no `aff_flash` — the content comes too.
- **Age floor:** `cringe_intrude` is highest 15–30 and
  decays with `age_eff` toward ~0.1 by 60 — cringe is a
  young-self phenomenon; older adults' embarrassments mostly
  just decay (socioemotional filtering, §105). Knot:
  `1.0@20 → 0.8@35 → 0.5@50 → 0.35@65`.
- **Audience specificity:** the cue bar drops further
  (`cringe_cue_sim` −0.15) when a *witness* of the original
  event is present — embarrassment is about who saw.
- **Locked `cringe_fab_null`:** embarrassment tags are
  exempt from the §19 fading-affect-bias self-gate's
  positive discount — cringe does NOT heal on the FAB
  schedule; it fades on the intrusion schedule. (Miller's
  persistence finding.)

## 116. Pain remembers the peak — and lies high

Redelmeier & Kahneman 1996 (Pain 66:3–8 — colonoscopy &
lithotripsy patients' *remembered* pain tracked peak + end,
not duration; verified); Redelmeier, Katz & Kahneman 2003
(lengthening a colonoscopy with a dull tail *improved*
remembered pain — duration neglect exploited); Terry,
Brodie & colleagues (dental pain, same pattern). The
decision-relevant asymmetry: remembered pain, not felt
pain, drives avoidance and willingness-to-return (Wirtz et
al. 2003 found remembered affect predicts vacation
repeat-intent better than experienced affect).

Mechanics (spec §6.232). `pain:true` events (world tags
procedures, injuries, dental visits) mint their affect tag
from `peak_end` already (§13) — the new clause is the
*retrieval report*: reported pain = `pain_inflate·(peak·
pain_peak_w + end·(1−pain_peak_w))` with `pain_peak_w` ≈0.7,
`pain_inflate` ≈1.1 (the report runs hotter than the stored
tag when the record's verbatim intensity field is gone —
peak-end survives as the only anchor).
- **Avoidance term:** `pain_avoid_gain` ≈0.5 multiplies the
  record's weight in *decision* contexts (booking the
  follow-up, declining the hike) — the remembered pain is
  the policy input, not the fact.
- **The Redelmeier exploit is legal:** a `gentle_tail:true`
  flag on the event halves `pain_end` contribution — a
  boring cool-down literally improves the memory. World's
  procedural events can use it.

## 117. Shared arousal fuses — the witness bond

Whitehouse & Lanman 2014 ("The Ties That Bind Us," Curr
Anthropol — identity fusion: shared dysphoric experience
fuses self to group; verified); Páez, Basabe et al. 2007
(collective emotional gatherings after trauma — shared
emotion rehearsed socially predicts post-traumatic growth
and integration); Durkheim's effervescence is the
sociological ancestor; Konvalinka et al. 2011 (fire-walking:
synchrony of arousal between participants AND watchers
predicts bonding — the spectator doesn't have to be in the
fire).

Mechanics (spec §6.233). When ≥2 characters encode the same
event with arousal ≥ `co_arousal_min` (0.5), each mints
with `E0 += co_arousal_gain` (≈0.2) AND the pairwise
`bond_delta` (substrate relationship matrix) gains
`co_arousal_bond·min(arousal_i, arousal_j)` (≈0.15 — the
*weaker* arousal sets the fuse, you can't bond someone's
fire they didn't feel).
- **Dysphoric ≫ euphoric** at the bond leg (Whitehouse's
  fusion findings are about shared hardship): negative
  shared arousal multiplies `co_arousal_bond` ×1.5.
- **Not contiguity:** merely co-present with low own-arousal
  (bystander) gets the encoding boost but not the bond leg —
  `co_arousal_bond` requires BOTH arousals ≥ min.
- **Locked `fuse_abuse_null`:** engineered pseudo-crises
  (world-forced arousal via lighting/weather with no
  event) do not fuse — the gate reads the arousal's
  *source* field, not its magnitude. The spectator economy
  can't manufacture found-family.

## 118. The two-factor stress gate — cortisol needs the adrenaline

The §4 stress model is currently additive (stress shifts
encoding/consolidation signs by phase). Roozendaal, Okuda,
Van der Zee & McGaugh 2006 (PNAS — verified: glucocorticoid
enhancement of consolidation requires **concurrent
noradrenergic arousal**; blocking amygdala NA abolishes the
cortisol benefit entirely; cortisol alone on quiet tissue
does nothing or harms); van Stegeren et al. 2010; the
human stress-timing meta (Shields et al. 2017) replicates
the interaction shape.

Mechanics (spec §6.234). The consolidation-side stress
term becomes a **gate, not an adder**:

```
consol_gain = stress_consol_k·C.cortisol·na_gate
na_gate = min(1, C.arousal_now / gc_na_thresh)   // gc_na_thresh 0.4
```

No arousal, no benefit — the character who absorbs bad news
while *numb* (low sympathetic arousal) does not get the
consolidation bump; the one who absorbs it while *racing*
does. The retrieval-side penalty (§5.1 stress_retrieve_loss)
is unchanged — it does NOT require the gate (glucocorticoid
retrieval impairment is NA-independent in the Roozendaal
account; keep the asymmetry).
- **Locked `gc_solo_null`:** `na_gate → 0` sends
  consol_gain → 0, never negative — quiet cortisol is
  inert, not corrosive (the impairing findings live on the
  retrieval side).
- **Interface note:** the gate needs `C.arousal_now` — the
  same sympathetic-arousal field §112's hangover reads. One
  field, two consumers.

## 119. The sensory trigger needs no search

Ehlers & Clark 2000 (the PTSD cognitive model — data-driven
processing mints peri-traumatic records as *sensory-implicit*
traces whose cues are perceptual features, not concepts;
verified in §5.65's aff_flash citations); Brewin, Dalgleish
& Joseph 1996 dual-representation (VAM vs SAM — the
situationally-accessible layer is cue-bound); Ehlers,
Hackmann & Michael 2004 (intrusions match *sensory* detail
of the worst moment).

Mechanics (spec §5.112). `trauma:true` records (§7) gain a
`percept_cue_w` ≈0.8 weight on **perceptual-feature match
alone** — cueContext fields `sensory:{smell, sound, light,
weather}` match the record's sensory verbatim fields at
`simOp ≥ percept_thresh` (0.55) and fire the intrusion
emission *without* passing the voluntary-search threshold
θ. The ambient scan runs it per-tick; θ never consulted.
- **Feature-scoped, not event-scoped:** the cue is the
  *sensory signature* — rain-on-tin fires the accident
  record even when nothing semantic overlaps. This is what
  makes trauma cues feel arbitrary to the character.
- **Exclusivity:** `percept_cue_w` applies ONLY to
  trauma-tagged records — locked `percept_gate_null`:
  ordinary records' sensory fields never bypass θ (a bakery
  smell routes through the normal Proust channel §29).
- **Extinction hooks:** the percept match is the exposure
  mechanic's target — each non-reinforced percept firing
  applies §21 reconsolidation-window extinction to the
  CondEntry, not the record (the story stays; the trigger
  quiets).

## 120. Skipped sleep skews the next day dark

Yoo, Gujar, Hu, Jolesz & Walker 2007 (Curr Biol — verified:
one night of total sleep deprivation produced ~60% amygdala
hyper-reactivity to negative stimuli via PFC disconnect —
the "primitive response" profile); Tempesta et al. 2018
(sleep-dep reviews: negative bias in affective evaluation
plus preserved-or-enhanced negative memory trade-off);
Walker & van der Helm 2009 framing.

Mechanics (spec §4.60). When `sleep_debt` (existing field)
crosses `sdep_thresh` (≈1 night equivalent):
- `w_emo` on **negative-valence** mints ×(1+
  `sleeploss_neg_gain` ≈0.6) — the threat channel
  amplifies, matching the amygdala reactivity;
- `w_emo` on positive mints ×(1−`sleeploss_pos_pen` ≈0.25)
  and `neg_potency` (§113) +0.3 — the day after no sleep
  is remembered as worse than it was;
- the bias is an *encoding* skew only — no decay,
  retrieval, or tag-rewrite legs. Locked
  `sdep_recall_null`: sleep-debt state never enters the
  retrieval equation (retrieval deficits ride the general
  `daLoad` channel instead — don't double-count).
- Stacks multiplicatively with §112's hangover in the
  plausible opposite direction — a bad night followed by a
  fight mints the hottest records in the sim.

## 121. The body is a context — arousal-state matching

§99 priced *mood* as internal context (small, clamped,
replication-shaky). There is a second state-dependency
channel: **sympathetic arousal level** at test vs at
encoding. Clark, Milberg & Erber 1988 (arousal state-
dependent effects); Eich's broader context-dependency
program (1995); and the exercise/stress-hormone matching
literature (Schmidt et al., retrieval under matched
noradrenergic tone) all point the same direction with
small, condition-sensitive effects.

Mechanics (spec §5.113). Add one term to drive(m):
`+ arousal_match_w·(1 − |C.arousal_now −
m.emotional.arousal_at_mint|)` with `arousal_match_w` ≈0.08 —
**smaller than `w_msd` (0.25) and clamped harder**
(clamp 0–0.15). The channel's real work: a calm
character has measurably *worse* voluntary access to their
panic-era records (the records are hot but state-locked),
and vice versa — which is why the §5.112 perceptual
bypass exists: the state-locked record still fires on
sensory match. [HYPOTHESIS — the arousal-matching
literature is thinner and less replicated than the mood
literature; keep the weight below `w_msd` and let the
perceptual channel carry the clinical cases.]

## 122. Spec delta (v5.48 → v5.49)

- **§4.57** The hangover window — `hangover_arm`,
  `hangover_gain`, `hangover_tau`, `hangover_win`; locked
  `hangover_retro_null`.
- **§4.58** The potency scalar — `neg_potency` unifies
  mint-time negative weighting; locked `potency_repair_null`.
- **§4.59** Un-acted regret — `regret_inaction_mult`,
  `counterfac_gain`, opportunity gate; locked
  `regret_reopen_null`.
- **§4.60** Sleep-debt encoding skew — `sdep_thresh`,
  `sleeploss_neg_gain`, `sleeploss_pos_pen`; locked
  `sdep_recall_null`.
- **§5.111** Cringe intrusions — `cringe_intrude`,
  `cringe_cue_sim`, age knots; locked `cringe_fab_null`.
- **§5.112** Perceptual bypass — `percept_cue_w`,
  `percept_thresh` on trauma records; locked
  `percept_gate_null`.
- **§5.113** Arousal-state match — `arousal_match_w`
  (clamped < `w_msd`).
- **§6.232** Pain report — `pain_peak_w`, `pain_inflate`,
  `pain_avoid_gain`, `gentle_tail` flag.
- **§6.233** Shared-arousal fusion — `co_arousal_min`,
  `co_arousal_gain`, `co_arousal_bond`; locked
  `fuse_abuse_null`.
- **§6.234** Two-factor stress gate — `gc_na_thresh`,
  `stress_consol_k` (reparametrizes the existing §4
  consolidation term); locked `gc_solo_null`.
- **§7 param block:** +14 named params (17 scalars),
  +6 locked nulls. Knot rows: `cringe_intrude`,
  `neg_potency` (trait range, no age leg),
  `arousal_match_w` (flat).
- **§10 contracts:** hangover window is a character-state
  field (not per-record); `neg_potency` mint-time only;
  `percept_cue_w` trauma-gated; `gc_na_gate` consolidation
  only, retrieval leg exempt; `co_arousal_bond` needs
  substrate's pairwise matrix.

## 123. Age guidance (extends §§10/23/37/53/67/81/95/109)

- `hangover_gain`: mild taper `1.0@30 → 0.8@60 → 0.6@80`
  — the sustained arousal state attenuates with amygdala
  reactivity, not abolished (consistent with preserved
  emotional enhancement, §10). [HYPOTHESIS]
- `neg_potency`: **no age leg by itself** — the older-adult
  positivity shift is carried by `pos_retrieve_bias`
  (§5.104) and the SST gate (§105), not by minting negative
  events colder. Locked `potency_age_null`.
- `cringe_intrude`: knots in §115 — the only mechanism
  this pass with a strong age gradient.
- `regret_inaction_mult`: flat — inaction regret is a
  lifespan phenomenon; if anything the *opportunity* field
  thins with age (doors close), which the world supplies.
- `co_arousal_bond`: flat — dysphoric fusion is documented
  across ages.
- `arousal_match_w`: flat, already tiny.
- Sleep-debt skew: adolescents are the natural high-debt
  population — the bias applies whenever `sleep_debt`
  crosses threshold, so teens inherit it behaviorally, no
  knots needed.

## 124. Validation probes (P1065–P1074; registry continues)

- **P1065 hangover forward (MUST, order-lock):** neutral
  records minted 15 min post-arousal-arm recollect better
  than pre-arm controls (≥1.3× recollection-class recalls);
  pre→post reversal (N→E) produces NO backward boost —
  `hangover_retro_null` structure-checked. Tambini 2017.
- **P1066 potency scalar (MUST, sign-lock):** matched
  ±0.8-valence events at fixed arousal mint with negative
  hotter by `neg_potency` factor; post-mint regulation
  unaffected (`potency_repair_null`); a 2×-neg_potency
  profile keeps the asymmetry proportionally.
  Baumeister 2001; Rozin & Royzman 2001.
- **P1067 regret crossover (MUST, shape-lock):** at
  t+7d action regrets exceed inaction regrets in
  surfacing count; at t+365d the ordering inverts;
  `opportunity:false` decisions never mint `regret`.
  Gilovich & Medvec 1995; Roese & Summerville 2005.
- **P1068 sleep-debt skew (SHOULD):** encoding under
  `sleep_debt > sdep_thresh` raises negative-record S by
  ≥1.4× vs rested control, positive ≤1.0×; retrieval on
  rested records unchanged (`sdep_recall_null`). Yoo 2007.
- **P1069 cringe persistence (SHOULD):** embarrass-tagged
  records surface ≥2× matched-neutral intrusions over 30d
  on cheap cues (sim 0.35–0.5); emission carries content
  (never `aff_flash`); age-20 profile ≥ age-60.
  Miller 1996.
- **P1070 perceptual bypass (MUST, scope-lock):** a
  sensory-only cue (matching smell field, no semantic
  overlap) fires trauma-record intrusion without θ;
  identical cue on a neutral record does NOT bypass —
  `percept_gate_null`. Ehlers & Clark 2000; Brewin 1996.
- **P1071 arousal match (COULD):** recall P rises with
  |arousal_now − arousal_at_mint| match, effect ≤ `w_msd`
  in magnitude; flat clamp respected. Clark 1988; Eich 1995.
- **P1072 pain peak-end (MUST):** reported pain ≈
  0.7·peak + 0.3·end regardless of duration; extended
  `gentle_tail` arm reports lower remembered pain;
  decision-context weight ×`pain_avoid_gain`.
  Redelmeier & Kahneman 1996; Redelmeier et al. 2003.
- **P1073 shared-arousal fusion (SHOULD):** co-encoded
  ≥0.5-arousal events mint stronger AND raise pairwise
  bond; single-side arousal (one calm witness) raises
  encoding but not bond; world-forced arousal with no
  event source raises neither (`fuse_abuse_null`).
  Whitehouse & Lanman 2014; Konvalinka 2011.
- **P1074 two-factor gate (MUST, sign-lock):** high
  cortisol + high arousal → consolidation gain; high
  cortisol + arousal below `gc_na_thresh` → gain ≈0,
  never negative (`gc_solo_null`); retrieval-side
  penalty fires in both arms. Roozendaal 2006.

Registry: P1–P1074. v101 suite: P1065, P1066, P1067,
P1070, P1072, P1074 MUST (P1065, P1070, P1074 carry
locked-null class); P1068, P1069, P1073 SHOULD; P1071
COULD.

## 125. Honest limits (Part IX)

- **Hangover** rests on one well-controlled fMRI program
  (Tambini/Davachi) plus the Dunsmoor retroactive sibling —
  the *direction* is strong, the `hangover_tau`≈12-min decay
  is ours (the paper measured a 9–33-min window, not a
  curve). Flagged HYPOTHESIS on magnitude; P1065 audits
  order, not slope.
- **Potency scalar** unifies what the literature reports as
  many local asymmetries — Baumeister's review is the
  warrant for existence, not for a single multiplier.
  Treating it as one scalar is a modeling compression;
  P1066 protects the sign, not the exact factor.
- **Regret crossover** is solid at the level Gilovich &
  Medvec measured (self-report salience) — our decay-rate
  implementation is the mechanism story, not theirs.
  `counterfac_gain`'s sim-satellite minting is our
  extension (the counterfactual-literature half is real;
  the satellite mechanics are invented).
- **Cringe**: Miller's persistence claim is
  phenomenological; the intrusion-frequency literature for
  embarrassment specifically is thinner than for trauma.
  The age gradient is our inference from SST + adolescent
  self-consciousness data — flagged.
- **Pain**: Redelmeier & Kahneman is well replicated;
  `pain_inflate`>1 (report exceeding stored tag) is our
  extension — the papers show peak-end dominates, not that
  reports inflate. The `gentle_tail` exploit is literally
  the 2003 finding operationalized.
- **Shared fusion**: Whitehouse & Lanman is a theoretical
  synthesis (ethnographic + survey), not a parametric
  study — `co_arousal_bond` magnitudes are unpriced by any
  source; the dysphoric≫euphoric asymmetry is the
  literature-consistent claim, the 1.5× is ours.
- **Two-factor gate**: Roozendaal's mechanism is animal +
  human pharmacology, well established — but the model
  elides the dose-response (the real interaction is
  non-monotonic); `na_gate`'s linear ramp is our
  simplification.
- **Perceptual bypass**: Ehlers & Clark is a clinical
  model — the *existence* of perceptually-triggered
  intrusions is textbook, the `percept_thresh` 0.55 value
  is calibrated only to "below semantic thresholds." The
  trauma-only scope lock is conservative; non-trauma
  perceptual triggers may exist (music §51 is adjacent).
- **Sleep-debt skew**: Yoo 2007 is one night of *total*
  deprivation; `sdep_thresh`≈1 night is faithful, but
  partial-debt scaling is extrapolated linearly — likely
  overshoots at the low end.
- **Arousal match**: weakest empirical base in this pass —
  kept sub-`w_msd` deliberately; COULD-tier probe only.

# Part X — v113: the news heard, the gate on the gift, the event that became a lens, the foil that felt hot, and the arc left open (2026-09-24, tenth pass)

Part I–IX built: consolidation dynamics, competition, valence
fidelity, stress timing, confidence decoupling, conditioned
affect, trauma phenotype, mood bleed (I); peak-end tags, sleep
quieting, item-context split, verbal dampening, regulation
trait, generalization, FAB boundary, contagion, reconsolidation
extinction (II); discrete tags, inverted-U, outcome rewrite,
smell, anniversary, trust conditioning, coherence healing,
weapon focus, recall→mood, empathy gap (III); excitation
transfer, audience tuning, catharsis null, savor/dampen,
secure base, duration, temporal distance, distinctiveness,
sex differences, granularity, impact bias, music (IV);
anticipation, betrayal, secondhand fear, dream draw,
shame/guilt, forgiveness, nostalgia, mood confabulation,
inertia, habituation (V); prosody, affect flashback, jealousy,
awe, directed-forgetting resistance, safety signals (VI);
gratitude, co-rumination, distancing, humor, hot–cold,
anxiety priority, positive widening, disgust, mood-repair,
felt-vs-believed (VII); consistency bias, mood-as-context,
suppression dents, redemption/contamination, immune neglect,
choice-supportive, affect boundaries, positivity effect,
dissociation, photo encoding (VIII); hangover, potency,
regret, cringe, pain, fusion, two-factor gate, perceptual
bypass, sleep-debt skew, arousal match (IX).

Part X closes the ten biggest remaining gaps: **the flashbulb
record is of the hearing, not the thing** (§126); **the
emotional gift is attention-gated** (§127); **the label cools
the tag at birth** (§128); **the interrupted arc stays hot**
(§129); **a central event becomes a lens on new events**
(§130); **an attributed mood loses its bleed** (§131); **the
motivation behind the emotion picks the rehearsal ecology**
(§132); **the hot event refuses to recede** (§133);
**emotion itself is an oldness heuristic** (§134); **the two
regulators leave different dents in the trace** (§135).

## 126. The flashbulb is of the hearing — the reception record

Brown & Kulik 1977's canonical flashbulb fields (place,
ongoing activity, informant, own affect, others' affect,
aftermath) are all *reception-context* fields — the memory is
of hearing the news, not of the event (which the rememberer
never witnessed). Neisser & Harsch 1992 (Challenger): three-
year-delayed reception reports were massively inconsistent
with baseline while confidence stayed high; the *event* facts
were even worse. Curci & Luminet 2006 (9/11, six countries):
reception memory stayed high and consistent across groups
while event memory varied; the rehearsal determinant
(media + conversation) drives the *reception* record, not the
remote event. **[CONSENSUS: reception-vs-event split is the
definitional heart of the flashbulb literature; rehearsal
feeds the reception record]**

**Spec consequence (new §4.74, `recep_*`):** when
`hearAccount`/`observe` delivers an event with `arousal ≥
recep_thresh` (0.8) AND `scope:"remote"` (a hearsay account
of an off-scene event — news, rumor of a distant happening),
the character mints a companion record `reception:true`:

- its cueVector holds the *reception frame* — bearer
  (who told), place, ongoing activity, own posture/affect —
  encoded with `recep_frame_gain` (0.4) bonus; the remote
  event's content fields stay `source:"hearsay"`-thin.
- the reception record gets `flashbulb_conf_floor` (§5) on
  confidence; the remote content does not.
- **locked `recep_content_null`:** reception minting NEVER
  upgrades remote content to `witnessed` — "I remember
  exactly where I was when I heard" does not mean "I saw it".
- each subsequent *discussion* of the news consolidates the
  reception record (`recep_share_gain` 0.15 per
  `discussEvent` touching it — Curci & Luminet's rehearsal
  determinant), while the hearsay content gets only normal
  retell_boost.

Emergent: two neighbors both remember the landlord's
announcement — but what each preserves is *where they stood
and who told them*, and those frames diverge and confabulate
over years while the announcement itself blurs.

## 127. The gift needs the hands — attention gates the emotional advantage

Kensinger & Corkin 2004 (PNAS): the emotional-memory
advantage has two routes — an automatic amygdala route
(works without attentional mediation) and a cognitive route
requiring attention/elaborative resources; divided attention
at encoding abolishes most of the emotional advantage.
Kensinger & Corkin 2003; Talmi et al. 2007 consistent.
Mather & Knight 2005: the older-adult *positivity* advantage
is specifically resource-dependent — it collapses under
divided attention, and the whole emotional benefit is more
attention-dependent in the old. **[CONSENSUS: the
enhancement is resource-demanding; the automatic amygdala
component (blink, conditioning) is not]**

**Spec consequence (new §4.75, `emo_attn_*`):** the `w_emo`
encoding leg — and the downstream `emo_consol_gain` (§2) —
scale by effective attention:

```
w_emo_eff = w_emo · (emo_attn_floor + (1 − emo_attn_floor)·attention)
// emo_attn_floor(age_eff): 0.4@30 → 0.3@65 → 0.15@75 → 0.10@85
//   older advantage MORE attention-dependent (Mather & Knight 2005)
```

Locked `emo_attn_blink_null`: the §2.2 emotional blink and
§4.9 conditioning acquisition do NOT take this gate —
arousal still costs neighbors and conditions cues even when
the character wasn't really paying attention. The
dissociation is the point (P1197): a distracted character
gains no mnemonic gift from the fight they half-watched, but
the conversation beside it still dies, and the dread on the
place still lands.

## 128. Name it at the gate — affect labeling cools the tag at birth

Lieberman et al. 2007 (Psychol. Sci. 18:421): putting a
feeling into words reduces amygdala response during the
affective experience itself — labeling is *encoding-time*
regulation, distinct from §16's retelling dampening (which
works on the tag at rehearse). Kircanski, Lieberman &
Craske 2012 (spider exposure): verbalizing negative affect
reduced subsequent physiological responding — the label
blunts what conditions. **[CONSENSUS that labeling
down-regulates felt affect online; the memorial-tag cooling
is our extension — flagged HYPOTHESIS on magnitude]**

**Spec consequence (new §4.76, `label_*`):** events carrying
`labeled:true` (the character articulated the feeling in
scene — self-talk, dialogue, or written note; world-builder
supplies via utterance content) store their emotional tag
cooled:

```
at mint:  emotional.arousal *= (1 − label_dampen·emo_gran)
          // label_dampen ≈ 0.25; granularity trait §49 —
          // precise namers cool more ("I'm betrayed, not
          // just upset") than coarse namers
```

Locked `label_som_null`: §4.9 CondEntry acquisition is
UNAFFECTED — the named fear still conditions the cue
(Kircanski is about response reduction, not extinction;
Bechara's affect survives the story). The character who
says "this terrifies me" feels it slightly less but still
learns the doorway.

## 129. The arc left open — unresolved emotional events stay hot

Zeigarnik (1927) is already modeled at the *intention* level
(`zeig_resist`, encoding-mechanics §64). The emotional analog
is record-level: an affectively charged event that ends
**without closure** — the argument cut off mid-sentence, the
door slammed before the apology — keeps a rehearsal drive
until resolution. Martin & Tesser 1989/1996 (goal-blockage
rumination): ruminative thought persists while a goal
remains blocked; Bower-type unresolved-conflict rehearsal.
Horowitz's completion principle (1976): unresolved
experiences intrude until integrated. **[CONSENSUS on
rumination's goal-blockage basis; the record-level flag is
our formalization — HYPOTHESIS on magnitude]**

**Spec consequence (new §4.77 mint + §5.130 ecology):**
events with `arousal ≥ unresolv_thresh` (0.6) that end
without a closure marker mint `unresolved:true` (world
supplies `closed:true` on the resolution event — apology,
reconciliation, decisive end, sharing ≥1 core people/topic
field). Until closure:

```
intrusion_thresh_eff = intrusion_thresh − unresolv_intrude (0.15)
rehearsal draw += unresolv_draw (0.10)   // §4.13 ecology
at closure: premium decays by closure_decay (0.3)/day —
            the resolved fight goes quiet over ~3 days,
            it doesn't snap shut
```

Locked `unresolv_neutral_null`: interrupted *neutral* events
take no intrusion premium via this channel (task
interruption is zeig_resist's scope). Emergent: the
half-finished fight at the park resurfaces in the shower
three nights running — then dies within days of the
make-up conversation. (P1204)

## 130. The event that became a lens — event centrality

Berntsen & Rubin 2006 (*Behav. Res. Ther.* 44:219, CES;
verified): a highly central event becomes a *reference point*
for interpreting new experiences and generating expectations —
the trauma-organized life reads new ambiguities through the
old wound. Berntsen & Rubin 2007 (Appl. Cogn. Psychol.):
CES correlates PTSD severity (r≈.38) controlling anxiety/
depression/dissociation — it is the *integration-as-lens*,
not fragmentation, that predicts pathology. Boals, Murrell &
Berntsen: §32's coherence brake already noted the trait.
**[CONSENSUS: central events anchor identity and bias
inference; applies to positive turning points too —
weddings, births — not only trauma]**

**Spec consequence (new §5.127, `central_*`):** records with
`arousal·selfRelevance ≥ central_thresh` (0.85·0.8 ≈ 0.68
product) mint `central:true`. Three consequences:

```
lens:    when a NEW event is ambiguous (cueMatch spread low —
         no dominant interpretation), the strongest matching
         central record is injected into C as an appraisal
         cue (central_lens_w 0.2): the new event's valence
         encoding is pulled toward the lens's valence —
         betrayal-central characters read new slights darker
anchor:  central records feed §5.86 landmark routing —
         dating and chaptering organize around them
draw:    voluntary-rehearsal draw += central_draw (0.10) —
         central records are retold as self-explanation
```

Locked `lens_fact_null`: the lens contributes an *appraisal
bias* (valence prior) to the new record — it NEVER writes
content fields into it. The lens colors what the new event
*means*, not what it contains. (P1200)

## 131. The mood you can explain away — the attribution discount

§8's `mood_bleed` is unconditional: current mood always
bleeds a little into the retold tag. Schwarz & Clore 1983
(feelings-as-information): the effect is eliminated when the
mood's actual cause is made salient — people discount the
feeling once they attribute it to an irrelevant source.
**[CONSENSUS: attribution removes the informational use of
the mood; the discount is partial in real data, never full]**

**Spec consequence (new §5.128):** `cueContext` may carry
`mood_source:true` — the character knows why they feel this
way (just argued, just won, hungover) AND the source is
unrelated to the record being reconstructed:

```
mood_bleed_eff = mood_bleed · (1 − attrib_disc)   // ≈0.6
// when mood_source attributed AND unrelated to record
// related source (mood ABOUT the record) → no discount
```

The rainy-day control is now mechanical: a character who
knows they're raw from a bad night tells yesterday's neutral
event straighter than one who can't place the feeling.
(P1202)

## 132. Anger rehearsed, fear hidden, envy unspoken — the motivational ecology

§26's discrete-emotion tag carries *what* the record felt but
not *what it makes the character do with it*. Carver &
Harmon-Jones 2009 (Psych. Bull. 135:183): anger is
*approach*-motivated despite negative valence — it drives
engagement, not withdrawal. Consequence for the rehearsal
ecology: anger records are *retold* (voluntary rehearsal —
the grievance polished), fear/sadness records *intrude* but
are voluntarily avoided. Smith & Kim 2007 (Psych. Bull.
133:46): envy is the taboo emotion — felt, rehearsed
privately, almost never confessed; the envious record
circulates internally without an emission channel.
**[CONSENSUS on the motivational direction of anger vs fear;
envy-as-unspeakable is well supported]**

**Spec consequence (new §5.129):** the discrete tag gains
`motiv ∈ {approach, avoid, ambivalent}` (default per §26
emotion: anger→approach; fear/sadness/shame→avoid;
disgust→avoid; joy/pride→approach; new member `envy`→
ambivalent). Retrieval-draw adjustments:

```
approach tag:  voluntary-rehearsal draw += approach_rehearse
               (0.15) — anger/pride records are retold,
               reconsolidating the tag on schedule
avoid tag:     voluntary draw ×0.6; intrusion channel
               unchanged (intrusions don't wait for consent)
ambivalent (envy): voluntary draw ×0.5 (taboo — §60's shame
               asymmetry logic), intrusion_draw +=
               envy_intrude (0.10) — the private hot loop:
               felt often, said never
```

Emergent: the character rehearses the insult out loud for
weeks, dodges the memory of the scare, and keeps envying
the sister's kitchen silently forever. (P1203)

## 133. The hot event refuses to recede — arousal resists telescoping

§6.282's forward telescoping compresses emitted elapsed
estimates — but not uniformly. Van Boven, Kane, McGraw &
Dale 2010 (*JPSP* 98:872; verified, 6 experiments):
emotional intensity reduces *perceived* psychological
distance — emotionally described autobiographical events
(and a national tragedy) feel temporally closer than matched
neutral ones; the effect is mediated by felt intensity and
reverses when an alternative interpretation of the feeling
is supplied. Complements §46 (failure feels farther —
a *self-evaluative* distance) and §6.282 (the calendar's
compressive drift): the felt clock has an arousal brake.
**[CONSENSUS direction; our emission-side implementation is
the model's]**

**Spec consequence (new §6.287, `tele_emo_resist`):** the
§6.282 telescoping compression is attenuated by the record's
arousal:

```
tele_shift_eff = tele_shift · (1 − tele_emo_resist·arousal)
// tele_emo_resist ≈ 0.6 — a 0.9-arousal record telescopes
// at ~46% of a neutral record's rate; felt "recentness" is
// part of what the floor buys (§5 phenomenology)
```

Interaction note: attribution (§131) operates here too —
Van Boven's Experiment 5 (alternative interpretation
reversed the effect) is the same attribution discount
mechanism; when `mood_source` attributed, apply
`attrib_disc` to the resistance as well. Emergent: the old
character says the divorce was "last year" about a neutral
errand's frame but "just yesterday" about the fight —
correctly, in the only sense they mean it. (P1204)

## 134. Hot reads as old — emotion as an oldness heuristic

Dougal & Rotello 2007 (*PBR* 14:423; verified): the elevated
"remember" rate for emotional stimuli in recognition is a
*response bias*, not recollection — emotional foils are
endorsed "old" more because arousal itself is taken as
evidence of prior occurrence. Kapucu, Rotello, Ready & Seidl
2008 (*JEP:LMC* 34:703; verified): young adults show the bias
mainly for *negative* foils; older adults for BOTH negative
and positive — the aged criterion treats any heat as
familiarity. **[CONSENSUS for the bias; DEBATED whether a
small true recollection advantage coexists — Kensinger's
camp reads partial accuracy gains]**

**Spec consequence (new §6.285, `emo_foil_bias`):** in
`mode:"recognition"` (§5.6), candidate foils/lures carrying
emotional content get a criterion shift:

```
P(false-alarm | foil) += emo_foil_bias · arousal_foil
// emo_foil_bias ≈ 0.15; valence leg:
//   neg foils: full weight, all ages
//   pos foils: ×emo_foil_pos_leg(age_eff):
//              0.3@30 → 0.5@55 → 0.8@75   (Kapucu 2008)
```

Locked `foil_recall_null`: recall mode has no foil criterion
— this is a recognition-mode bias only. Emergent: "no, but
it *sounds* like something that happened" — the elder
misremembers which compliments were actually paid, and
everyone misremembers which insults were. (P1201)

## 135. Two regulators, two dents — distraction vs reappraisal on the trace

The spec's `regulate_style` trait (v1.7) is a scalar
preference; the strategies differ *mechanically* on what they
do to the record. Sheppes & Gross 2011 (*Pers. Soc. Psychol.
Rev.* 17:379; verified) + Sheppes, Scheibe, Suri & Gross 2011
(*Psychol. Sci.* 22:1391, choice experiments; verified):
distraction is an early-selection filter — it blocks
elaborative processing of the emotional content (the trace
stays as minted, just less rehearsed/retrieved while
deployed); reappraisal is a late-selection semantic
reinterpretation — it operates ON the emotional
representation, rewriting the tag at reconsolidation. Choice:
people prefer distraction at high intensity, reappraisal at
low. **[CONSENSUS on the early/late architecture and the
intensity-dependent choice; our trace-level consequences are
the model's extension]**

**Spec consequence (new §6.286, `distract_*`/`reapp_*`
split):**

```
regulation choice at encode/retell:
    if arousal ≥ reg_choice_knee (0.7): distraction preferred
    else: reappraisal preferred
    // knee shifts left with age — older profiles prefer
    // attentional deployment (reg_knee_age −0.15@75;
    // Suri/Isaacowitz aging ER work — DEBATED knot)

distraction:   bout-scoped retrieval-drive suppression —
               record's draw probability ×(1−distract_drive_k
               0.4) for distract_dur (≈2h); the stored
               emotional tag is BIT-IDENTICAL —
               locked distract_tag_null (the unfelt
               afternoon still happened at full heat;
               it just isn't being reached for)

reappraisal:   at reconsolidation, emotional.valence drifts
               toward the reinterpreted frame by
               reapp_tag_k (0.10) per bout — the tag itself
               cools permanently (§16's mechanism, now with
               the correct trace-level complement)
```

Emergent: the suppressor's hot day stays hot in the drawer;
the reappraiser's same day slowly becomes "it was awkward,
but we were both tired". (P1205)

## 136. Spec delta (v5.60 → v5.61)

- §4.74 `recep_thresh`/`recep_frame_gain`/`recep_share_gain` —
  remote-news minting of `reception:true` records;
  `recep_content_null` locked.
- §4.75 `emo_attn_floor(age_eff)` — attention gates w_emo;
  `emo_attn_blink_null` (blink + conditioning exempt).
- §4.76 `label_dampen` on the mint tag × `emo_gran`;
  `label_som_null` (conditioning unaffected).
- §4.77 `unresolv_thresh` mints `unresolved:true`;
  `unresolv_neutral_null`.
- §5.127 `central_thresh`/`central_lens_w`/`central_draw` —
  `central:true` lens/anchor/draw; `lens_fact_null`.
- §5.128 `attrib_disc` on `mood_bleed` when `mood_source`
  salient + unrelated.
- §5.129 `motiv` field on the discrete tag +
  `approach_rehearse`/`envy_intrude`; enum += {envy, pride}.
- §5.130 `unresolv_intrude`/`unresolv_draw`/`closure_decay`
  — open-arc intrusion until `closed:true`.
- §6.285 `emo_foil_bias`/`emo_foil_pos_leg(age_eff)` on
  recognition foils; `foil_recall_null`.
- §6.286 `distract_drive_k`/`distract_dur`/`reapp_tag_k`/
  `reg_choice_knee`/`reg_knee_age`; `distract_tag_null`.
- §6.287 `tele_emo_resist` — arousal brakes §6.282
  telescoping; attribution discount applies to the brake.
- Locked nulls this pass: `recep_content_null`,
  `emo_attn_blink_null`, `label_som_null`,
  `unresolv_neutral_null`, `lens_fact_null`,
  `foil_recall_null`, `distract_tag_null` (7).
- Fields/state: record flags `reception:true`,
  `central:true`, `unresolved:true`; discrete-tag `motiv`;
  emotion enum += {envy, pride}; ctx `mood_source`; event
  flags `labeled:true`, `closed:true`, `scope:"remote"`.

## 137. Age guidance (extends §§10/23/37/53/67/81/95/109/123)

- `recep_*`: flat — reception flashbulbs are age-preserved
  phenomenology (confidence may even inflate more in old).
- `emo_attn_floor`: steep decline with age (0.4→0.10 by 85)
  — the one strong age knot this pass; the old need their
  attention on it or the advantage evaporates.
- `label_dampen`: mild decline — granularity knots §49
  already sag; the leg rides `emo_gran` so no new knot.
- `unresolv_*`: intrusion premium decays ≥65 (rumination
  declines — §64 inertia knots already priced).
- `central_lens_w`: flat-mild — the lens strengthens when it
  is bump-era (transition-anchored records dominate).
- `attrib_disc`: weakens ≥65 (older adults lean on feelings
  more as information — HYPOTHESIS, Hess-affect literature
  direction; knot −0.2@75).
- `emo_foil_pos_leg`: the Kapucu aging finding directly —
  0.3@30 → 0.8@75.
- `reg_knee_age`: −0.15@75 — distraction preferred earlier.
- `tele_emo_resist`: flat — the arousal brake on felt
  distance is a judgment phenomenon; §6.282's age_leg still
  drives the underlying compression.

## 138. Validation probes (P1196–P1205; registry continues)

- **P1196 reception mint (MUST, scope-lock):** remote
  arousal-0.85 hearsay mints `reception:true` — bearer/place
  fields recollect ≥1.4× the remote content's; content stays
  `hearsay`, NEVER `witnessed` (`recep_content_null`);
  each discussEvent grows frame strength not content.
  Neisser & Harsch 1992; Curci & Luminet 2006.
- **P1197 attention gate (MUST, dissociation):** daLoad-0.8
  encoding of an arousal-0.8 event loses ≥70% of the w_emo
  advantage vs undivided control, while the §2.2 blink on
  neighbors is preserved ≥90% (`emo_attn_blink_null`);
  the floor knot steepens ≥65. Kensinger & Corkin 2004;
  Mather & Knight 2005.
- **P1198 affect labeling (SHOULD):** `labeled:true` events
  mint arousal tags lower by ≈label_dampen·gran vs unlabeled
  controls; CondEntry strength unchanged
  (`label_som_null`). Lieberman 2007; Kircanski 2012.
- **P1199 unresolved arc (SHOULD):** interrupted
  arousal-0.7 events intrude ≥1.5× matched-resolved over
  7d, premium collapsing within ~3d of `closed:true` (a
  one-day snap shut FAILS — closure is relief, not
  amnesia); interrupted neutral events show NO premium
  (`unresolv_neutral_null`). Martin & Tesser 1989;
  Horowitz 1976.
- **P1200 central lens (MUST, scope-lock):** `central:true`
  records appear in C on ambiguous new events ≥3× base
  rate and shift new-event valence encoding toward lens
  valence; lens records write ZERO content fields into the
  new record (`lens_fact_null`). Berntsen & Rubin 2006.
- **P1201 emotional foil (MUST, mode-lock):** recognition
  foils with arousal ≥0.5 false-alarm ≥1.4× matched neutral
  foils; positive-foil leg rises with age (Kapucu shape);
  recall mode unaffected (`foil_recall_null`). Dougal &
  Rotello 2007.
- **P1202 attribution discount (SHOULD):** salient unrelated
  `mood_source` cuts reported mood_bleed by ≈attrib_disc;
  mood ABOUT the record discounts ≈0. Schwarz & Clore 1983.
- **P1203 motivational ecology (MUST):** anger records
  voluntarily rehearse ≥2× fear records at matched arousal/
  valence-magnitude; envy records show high intrusion +
  suppressed emission (the unspoken loop). Carver &
  Harmon-Jones 2009; Smith & Kim 2007.
- **P1204 telescoping brake (SHOULD, report-only):** emitted
  elapsed estimates for arousal-0.9 records compress at
  ≈(1−tele_emo_resist·0.9) of neutral rate; stored
  timestamps bit-identical (§6.282's P1192 invariant
  inherited); attributed `mood_source` attenuates the
  resistance. Van Boven, Kane, McGraw & Dale 2010.
- **P1205 regulation dents (MUST, trace-lock):** distraction
  leaves the stored tag bit-identical while suppressing
  draw (`distract_tag_null`); reappraisal drifts stored
  valence by ≈reapp_tag_k/bout; arousal ≥ knee flips
  strategy preference. Sheppes & Gross 2011; Sheppes et
  al. 2011.

Registry: P1–P1205. v113 suite: P1196, P1197, P1200, P1201,
P1203, P1205 MUST (P1196, P1197, P1200, P1201, P1205 carry
locked-null legs); P1198, P1199, P1202, P1204 SHOULD.
P1204 inherits the report-vs-store discipline of P1192.

## 139. Honest limits (Part X)

- **Reception minting** rests on the definitional flashbulb
  claim — solid. The `recep_share_gain` consolidation-per-
  discussion pricing is ours (the literature shows rehearsal
  *predicts* reception consistency, not a per-bout gain).
- **Attention gate**: Kensinger & Corkin's two-route account
  is established, but the exact attention-scaling form
  (linear floor) is our simplification — the real
  relationship is probably thresholded.
- **Labeling**: Lieberman's effect is on *felt* affect
  online; that it cools the *stored* tag proportionally is
  our extension. Kircanski suggests the conditioning side is
  reduced too — our `label_som_null` is the conservative
  read (the alternative would weaken CondEntry acquisition).
- **Unresolved arcs**: goal-blockage rumination is real;
  the `closed:true` marker requires the world to declare
  resolution events — a bookkeeping dependency, flagged.
- **Centrality**: CES is a self-report scale; the lens
  mechanism (cue injection on ambiguity) is the operational
  reading of "reference point for attribution" — defensible
  but not directly parameterized by any study.
- **Attribution discount**: Schwarz & Clore's original
  manipulation was heavy-handed (drawing attention to the
  weather); everyday self-attribution is probably weaker —
  attrib_disc 0.6 may overshoot; P1202 bounds it.
- **Foil bias**: Dougal & Rotello is a word-list paradigm;
  extending to event foils is a leap — the Kapucu age
  pattern is the load-bearing claim, the magnitudes ours.
- **Motivational ecology**: anger-as-approach is solid for
  *behavioral* drive; the rehearsal-draw mapping is our
  formalization. Envy's taboo asymmetry is Smith & Kim's
  phenomenology — `envy_intrude` is unpriced by any source.
- **Telescoping brake**: Van Boven et al. measured felt
  distance on a self-report scale; folding it into §6.282's
  emitted-estimate compression is a defensible operational
  reading, and the attribution interaction (their Exp. 5)
  is preserved. `tele_emo_resist` 0.6 is unpriced — P1204
  tests direction and report-only scope, not magnitude.
- **Regulation split**: Sheppes' early/late architecture is
  textbook; that distraction leaves the tag bit-identical is
  our strict reading — the honest bound is "much less tag
  change than reappraisal," and `distract_tag_null` locks
  the strong version so P1205 can falsify it.

---

# Part XI — the affect that reaches behavior: sharing, avoidance, choice, resemblance

Parts I–X priced how emotion gets in, survives, and surfaces.
Part XI closes the loop the Astra direction made load-bearing:
emotional memory must *reach behavior and other people* — what a
character tells, avoids, chooses, and misreads. Ten legs:
(140) social sharing propensity, (141) two-layer avoidance,
(142) the somatic choice bias, (143) brooding vs reflection,
(144) the prediction-error gate on reconsolidation, (145)
attachment-style parameter bundles, (146) transference onto new
persons, (147) the fluency→intensity heuristic, (148) the
stress-driven substrate shift at decision time, (149) the
spotlight on one's own embarrassments. Then the spec delta
(v5.70→v5.71), age guidance, probes P1331–P1340, honest limits.

## 140. Almost every feeling gets told — the social-sharing channel

Rimé's corpus is the most under-used lever in the model: the
emotional event is *defined* by its spreading. Rimé, Mesquita,
Philippot & Boca 1991; Rimé, Philippot, Boca & Mesquita 1992
(eight studies, 1,384 episodes): **80–96% of emotional episodes
are socially shared**; ~60% shared the same day; extent of
sharing (repetitions × recipients) correlates with intensity
(r≈.21–.35 autobiographic, higher in lab). Shame/guilt episodes
shared somewhat less and later (Finkenauer & Rimé 1998).
Sharing is repetitive — the same episode is told to several
addressees over days-to-weeks. **[CONSENSUS on existence and
the intensity slope; the therapeutic-recovery claim is NOT
supported — sharing doesn't measurably reduce residual
emotional intensity (Zech & Rimé 2005) — we must not let
sharing cool the tag.]**

**Spec consequence (§6.330 — `share_*`):** at mint of any
record with `|valence| ≥ share_thresh` (0.3) or `arousal ≥
0.4`, a sharing intention is minted:

```
share_drive0 = min(share_cap, share_base + share_k·arousal)
               // share_base 0.15, share_k 0.75, share_cap 0.95
shame/guilt discrete tag (§26): share_drive0 *= share_shame (0.7)
drive decays: share_drive(t) = share_drive0 · 2^(−t/share_tau)
               // share_tau ≈ 7 days — the urge outlives the sting
when drive > theta_share and an eligible addressee is present:
    run a discussEvent bout (retell machinery, §5.x) with the
    §41 epistemic-trust audience gate on; each bout increments
    share_count and spends drive by share_spend (0.25)
```

Each share is a *retell bout* — it inherits retell_boost,
drift, and §20 contagion automatically. Critical null:
sharing does **not** reduce the stored affect tag —
`share_cool_null` (Zech & Rimé 2005 verified). What sharing
changes is *strength and network*: more rehearsal, more
`told_to` edges, more rumor surface — not less feeling. (P1331)

## 141. Avoidance, two ways — the chosen detour and the procedural rut

Avoidance has two substrates the model must keep apart:

1. **Deliberate (Gross's situation selection — the earliest
   regulation stage, Gross 1998/2015 process model):** when
   constructing a plan/schedule, each candidate place/person
   draws `C.affect` contributions from matching CondEntries
   (§6) and the option score shifts by `sit_sel_w·Σ(valence·
   strength_eff)` (sit_sel_w ≈ 0.4). This is *evaluative* —
   the character can explain why they don't want to go.
   **[CONSENSUS as regulation stage; implementation is ours]**
2. **Proceduralized (habit):** avoidance repeated becomes
   automatic — stimulus–response, not evaluated. Extinction-
   resistant habits persist after the fear is gone and block
   disconfirmation, which is why avoidance *maintains* anxiety
   (Salkovskis 1991 safety behaviors; Bouton's context-bound
   extinction, §6; de Wit et al. 2018 habit transfer).
   **[CONSENSUS direction; the mint count is our pricing]**

**Spec consequence (§6.331 — `sit_sel_*`, `avoid_habit_*`):**

```
deliberate: option.score += sit_sel_w · Σ_CondEntries valence·strength_eff
            // reads the SAME entries as §6 fire — no second store
procedural: if a place/person-cued avoidance action is taken
            ≥ avoid_habit_n (3) times on CondEntry fire:
            mint procedural record {kind:"avoid_habit",
            cue, action:"avoid", strength}
            — fires at habit_p WITHOUT consulting strength_eff;
            decays on procedural tau (≈3× episodic — habits are
            slow), NOT suppressed by safeCount/extinction
```

Locked null `habit_aff_null` (P1332): the habit fires even
when the CondEntry's effective strength hits its extinction
floor — the character keeps taking the long way around the
park years after they've stopped feeling afraid of it, and
can't say why. That asymmetry (reportable feeling gone,
behavioral rut intact) is exactly what a spectator should be
able to *see* in the pathing without being told.

## 142. The gut in the option list — the somatic choice bias

Bechara et al. 1995/1997 (Iowa Gambling Task): conditioned
affective signals bias choice *before and without* declarative
knowledge — participants avoid bad decks before they can say
why; Damasio's somatic-marker account (Damasio 1994).
**[CONSENSUS that affect guides choice under uncertainty;
somatic-marker specifics DEBATED (Dunn et al. 2006)]**

**Spec consequence (§6.332 — `choice_aff_*`):** at decision
scoring, in addition to explicit/episodic evidence:

```
choice_bias(option) = choice_aff_w · Σ_entries valence·strength_eff·simOp
                      // choice_aff_w ≈ 0.5; simOp over shared
                      // cueVector fields between option and entry
```

Two disciplines: (a) it's a *bias term*, bounded by
`choice_aff_cap` (0.6) so episodic evidence can override it;
(b) it writes nothing — locked `choice_fact_null` (P1333):
the bias never mints content fields or beliefs; it produces
leanings with honest provenance. The option the character
*can't justify avoiding* but avoids anyway is this mechanism
at work — and the UI may show the lean as INFERRED-affect
(§16 honesty contract), never as a stated reason unless the
character confabulates one (§93 felt-vs-believed).

## 143. The two ruminations — brooding preserves, reflection repairs

§64 gave rumination one trait (`rumin_k` skew on rehearsal).
Treynor, Gonzalez & Nolen-Hoeksema 2003 factor-split it into
two components with opposite consequences: **brooding**
("why can't I handle things") predicts worse mood, more
intrusion, no progress; **reflection** ("analyze recent
events") predicts resolution. Watkins 2008 (Psychol. Bull.)
grounded the split in processing mode — abstract-evaluative
vs concrete-experiential rumination; Nolen-Hoeksema, Wisco &
Lyubomirsky 2008 review. **[CONSENSUS split; magnitudes
ours]**

**Spec consequence (§6.333 — `brood_*`, `reflect_*`):** the
depressive/ruminative modifier's involuntary re-encode draws
are routed per trait mix `brooding` vs `reflect` (both
∈[0,1], sampled per profile, correlate with `neuro`):

```
brooding bout (p ∝ brooding): re-stamps emotional.arousal ≥0.7
    (§7 intrusion reconsolidation), applies rumin_k neg drift,
    writes NO coherence — the wound is rehearsed, not processed
reflection bout (p ∝ reflect): applies narr_coher gain (§32)
    at reflect_coher_gain (0.15) and reapp_tag_k drift (§135)
    — the event is re-contextualized, affect cools at
    extinction-ish rates
```

Locked null `brood_content_null` (P1334): brooding re-stamps
the affect tag only — it never rewrites content fields (the
dwelling is repetitive, not reconstructive). Emergent: two
characters with the same bad breakup diverge — the brooder is
still hot at day 90, the reflector has a cooler, more
coherent version; both remember. (P1334)

## 144. The window only opens for a surprise — the PE gate on reconsolidation

§5.9/§21 let every retrieval open a reconsolidation window.
The boundary literature says that's too generous: memory
destabilization requires **prediction error** at retrieval —
a mismatch between what the trace predicts and what happens
(Sevenster, Beckers & Kindt 2012, 2013 — fear memory
reconsolidation gated on PE; Fernández, Boccia & Pedreira
2016 review; Pedreira, Pérez-Cuesta & Maldonado 2004). A
retelling that lands exactly as expected rehearses
(strengthens) but doesn't *open* — which is why repeated
identical retellings stabilize a story rather than rewriting
it. **[DEBATED — boundary conditions contested, replication
mixed (e.g., Luyten & Beckers 2017 failures); we adopt the
gate as a modeling hypothesis with the null locked so P1335
can falsify it]**

**Spec consequence (§6.334 — `recon_pe_gate`):**

```
at retrieval/retell: expected_outcome = the record's stored
    outcome/valence fields as reconstructed
pe = |expected − observed|  over valence/outcome/cue fields
if pe ≥ recon_pe_gate (0.2) OR a novel cue/disconfirming
    listener response enters:
    open reconsolidation window (§5.9 ops apply)
else:
    retell_boost only — strength rises, fields bit-identical
    (locked recon_routine_null, P1335)
```

Emergent consequence for consequence-continuity: an apology
or repair event only rewrites the grievance record when it
*disconfirms* — a perfunctory sorry matching expectations
rehearses the grudge instead of healing it. Effortless repair
fails; surprising repair works. That asymmetry is the Astra
"voluntary repair" test made mechanistic.

## 145. Attachment style is a parameter bundle, not a new system

Mikulincer & Shaver's two dimensions map cleanly onto knobs
the spec already has — no new machinery needed, just an
authored bundle (Hazan & Shaver 1987; Mikulincer & Shaver
2003/2007; Brennan, Clark & Shaver 1998 ECR — anxiety and
avoidance as near-orthogonal dimensions):

- **Attachment anxiety (hyperactivating):** threat cues
  over-monitored, affect amplified, bids for proximity:
  `intrusion_thresh − attach_anx_w·attach_anx`,
  `cond_gain + attach_anx_w·attach_anx`,
  `extinct_suppress · (1 − 0.5·attach_anx)` (safety never
  sticks), `share_drive0 +` (reassurance-seeking disclosure),
  `emo_inertia +` (§64).
- **Attachment avoidance (deactivating):** suppress strategy
  (§17) elevated, emitted affect dampened — but the *stored*
  tag is NOT dampened (avoidant adults show intact
  physiological response with suppressed expression —
  Mikulincer et al.):
  `suppress trait +`, `share_drive0 · (1 − attach_avo)`,
  emitted affect/report magnitude `· (1 − avo_emit_damp)`
  (0.35).

**[CONSENSUS dimensions and strategy direction; the exact
knob mapping is our decomposition. The emit-dampen-with-
stored-intact asymmetry has psychophysiology support and is
the behaviorally important leg: the avoidant character
*looks* unaffected and *carries* it.]**

**Spec consequence (§6.335):** `attach_anx`, `attach_avo`
∈[0,1] authored traits (world-builder bibles; e.g., a
character who clings after conflict vs one who goes quiet
and leaves early). Locked `attach_content_null` (P1336):
both dimensions move dynamics and emission only — never
content fields. Same fight, two profiles: the anxious one
retells it to everyone and never extinguishes; the avoidant
one tells nobody, looks fine, and quietly re-weights the
relationship.

## 146. You remind me of someone — transference onto new persons

Andersen & Cole 1990; Andersen, Glassman, Chen & Cole 1995
(significant-other representations): meeting someone who
resembles a significant other triggers **transference** —
inferred traits and affective response appropriate to the
*other* person transfer onto the new one, including false
recognition of unobserved traits and biased evaluation.
**[CONSENSUS that representation-triggered transfer occurs;
magnitude in naturalistic settings ours]**

**Spec consequence (§6.336 — `transf_*`):** when a new
PersonModel mints (first meeting), compute simOp of the new
person's observable cue fields against existing person
cue-profiles:

```
if max overlap ≥ transf_thresh (0.6):
    strongest CondEntry affect toward that old person leaks:
    new_model.affect_prior += transf_k · overlap · entry.valence·strength
    flag new_model.transf = {from: personId, provenance:"inferred"}
```

Two honesty disciplines, serving the Astra UI mandate
directly: (a) `affect_prior` is an *expectation* — it biases
interpretation of ambiguous behavior (§130 lens channel) but
must be labeled `provenance:"inferred"` wherever the
observation UI surfaces it; (b) locked `transf_fact_null`
(P1337): transference writes zero content/fact fields — the
character may *feel* the new neighbor is untrustworthy "for
no reason," but no belief about deeds is minted. This is the
cleanest mechanism for realistic misreading: the new
supporting resident who gets a cold reception from day one
because they have the ex-friend's laugh. (P1337)

## 147. If it came back easily, it must still matter — the fluency heuristic

Ease of retrieval is used as evidence (Koriat's
self-consistency/fluency work, Koriat 1993; Koriat &
Ma'ayan 2005; the availability heuristic, Tversky &
Kahneman 1973). For emotional records specifically: a
record that resurfaces *fluently* feels more significant —
confidence and *reported* intensity inflate with retrieval
ease. This is the quiet amplifier behind §144's stability:
old well-rehearsed grievances feel fresh partly because
they're easy to recall. **[CONSENSUS on fluency→confidence;
the intensity leg is our extension — DEBATED]**

**Spec consequence (§6.337 — `flu_*`):** when a bout
resolves with search ease `ease` = 1 − (failedCandidates/
search_breadth):

```
emitted confidence += flu_conf_gain · ease      // ≈0.12
reported_arousal   += flu_int_gain  · ease      // ≈0.10
```

Report-layer only: stored fields untouched, and locked
`flu_acc_null` (P1338) — ease inflates certainty and felt
intensity, never accuracy. Emergent: the oft-retold slight
feels *bigger* each time — not because it grew (stored tag
stable), but because it surfaces so smoothly.

## 148. Under stress, the habit answers — the substrate shift at choice

§4 priced stress on encoding and retrieval of *records*.
Schwabe & Wolf add the decision-side leg: acute stress
shifts behavioral control from hippocampal/PFC
goal-directed (episodic, deliberative) systems to dorsal
striatal stimulus–response **habit** systems — and it
requires the same glucocorticoid + noradrenergic
co-activation as §118's two-factor gate (Schwabe & Wolf
2009 J. Neurosci. — stressed participants insensitive to
outcome devaluation; Schwabe et al. 2008, 2010;
propranolol blocks the shift, Schwabe et al. 2011).
**[CONSENSUS — among the best-replicated stress effects]**

**Spec consequence (§6.338 — `stress_habit_*`):** at
decision time, when `C.stress > stress_habit_thresh` (0.6)
AND the two-factor gate (arousal co-activation, §118) holds:

```
weight on episodic/deliberative option evaluation: ×(1 − stress_habit_w·C.stress)
weight on CondEntry/procedural responses (§§141–142): ×(1 + stress_habit_w·C.stress)
                    // stress_habit_w ≈ 0.5
```

Locked `stress_ep_fact_null` (P1339): the shift changes
*which machinery answers*, never what records contain.
Emergent and production-relevant: a stressed character
reverts to ruts — avoids the usual place, gives the
practiced cold answer, doesn't do the repair they'd choose
on a calm day. Stress visibly narrows behavioral repertoire
in the observation layer without any scripted behavior.

## 149. The spotlight on your own shame — overestimating what others keep

Gilovich, Medvec & Savitsky 2000 (spotlight effect): people
overestimate how much others notice and remember their
actions — roughly 2×; Savitsky, Epley & Gilovich 2001
(illusion of transparency). For *embarrassing* self-records
the consequence is asymmetric knowledge: I carry my cringe
hot and assume you do too — but you forgot it.
**[CONSENSUS on overestimation magnitude ~2×; the specific
embarrassment-retention inflation is our extension —
HYPOTHESIS]**

**Spec consequence (§6.339 — `spotlight_*`):** when a
character estimates *another's* retention of a record in
which self was the embarrassed actor (`motiv`-tagged shame/
embarrassment, §26):

```
estimated_other_retention = own_effective_strength · spotlight_k
                            // spotlight_k ≈ 1.8, clamped ≤1
```

Uses: (a) behavior — avoidance/awkwardness toward
"witnesses" persists as if they remembered (feeds §141/§142
inputs via estimated state, not stored fact); (b) honest
labeling — the estimate lives on the estimator's model, a
perfect INFERRED-not-OBSERVED display case. Locked
`spot_fact_null` (P1340): the estimate never alters the
other character's actual record or the own record's stored
fields — it's a mistaken *model of a model*, which is
exactly what makes it human. (P1340)

## 150. Spec delta (v5.70 → v5.71)

- **§6.330** `share_*`: sharing intention minted at
  encode; drive ∝ arousal (cap 0.95), shame/guilt ×0.7,
  decays 2^(−t/7d); each share is a discussEvent bout
  under the §41 trust gate; `share_cool_null` locked.
- **§6.331** `sit_sel_*` + `avoid_habit_*`: deliberate
  option-score bias from CondEntries; procedural
  `avoid_habit` records mint after 3 avoidances, fire
  cue-driven at habit_p, decay on ~3× episodic tau,
  immune to extinction; `habit_aff_null` locked.
- **§6.332** `choice_aff_*`: bounded somatic-marker bias
  on option scoring; `choice_fact_null` locked.
- **§6.333** `brood_*`/`reflect_*`: rumination split;
  brood re-stamps arousal (no coherence, no content
  rewrite — `brood_content_null`), reflect applies
  coherence + reappraisal drift. Traits `brooding`,
  `reflect`.
- **§6.334** `recon_pe_gate`: reconsolidation opens only
  on prediction error or novel/disconfirming input;
  routine retell = strength only (`recon_routine_null`).
- **§6.335** `attach_anx`/`attach_avo` authored traits +
  `avo_emit_damp`: parameter-bundle mapping onto existing
  knobs; `attach_content_null`.
- **§6.336** `transf_*`: resemblance ≥0.6 leaks affect
  prior onto new PersonModels, flagged
  `provenance:"inferred"`; `transf_fact_null`.
- **§6.337** `flu_*`: retrieval ease inflates emitted
  confidence + reported arousal; `flu_acc_null`.
- **§6.338** `stress_habit_*`: acute stress + two-factor
  gate reweights deliberative→habitual substrates at
  choice; `stress_ep_fact_null`.
- **§6.339** `spotlight_*`: estimated other-retention of
  own-embarrassment records ×1.8; `spot_fact_null`.
- **§7 params:** +16 scalars (`share_base`, `share_k`,
  `share_cap`, `share_tau`, `share_spend`, `share_shame`,
  `sit_sel_w`, `avoid_habit_n`, `avoid_habit_tau_mult`,
  `choice_aff_w`, `choice_aff_cap`, `recon_pe_gate`,
  `avo_emit_damp`, `transf_thresh`, `transf_k`,
  `flu_conf_gain`, `flu_int_gain`, `stress_habit_w`,
  `stress_habit_thresh`, `spotlight_k`) +4 authored
  traits (`brooding`, `reflect`, `attach_anx`,
  `attach_avo`) +2 knot curves (`flu_conf_gain(age)`,
  `transf_k(age)`) +10 locked nulls; fields: procedural
  `avoid_habit:true`, PersonModel `transf:{from,
  provenance}`, record `share_count`/`shared:true`,
  report scalars `flu_*`.
- **§10 contract block** added.

## 151. Age guidance (extends §§10/23/37/53/67/81/95/109/123/137)

- `share_drive0`/`share_tau`: approximately flat — Rimé's
  corpus found sharing proportions independent of age
  (12–72 range); keep flat, no knots. (Hypothesis-flagged
  for very old / socially narrowed profiles — the drive is
  flat, the *addressee supply* shrinks via world, not via
  this param.)
- `brooding`/`reflect`: brooding declines ≥65 (§137
  inertia knots — rumination declines); reflection
  roughly flat (life-review keeps it alive —
  HYPOTHESIS).
- `attach_*`: stable authored traits — adult attachment
  shows moderate rank-order stability (Fraley 2002); do
  NOT knot, let biography carry it.
- `transf_k`: mild rise ≥65 — older adults lean more on
  schema/familiarity-based inference (Hess direction —
  HYPOTHESIS): knot 0.5@55 → 0.6@75 → 0.7@85.
- `flu_*`: rises with age — fluency reliance is
  amplified in older adults (Jacoby & Rhodes 2006):
  `flu_conf_gain` 0.12@55 → 0.18@75 → 0.25@85.
- `stress_habit_w`: slightly amplified with age under
  the §4 stress stack (older retrieval is already
  taxed): knot 0.5@55 → 0.6@75 → 0.7@85 (HYPOTHESIS —
  direct aging evidence thin).
- `spotlight_k`: flat — spotlight persists across
  adulthood (Gilovich et al. 2000); aging data thin,
  flag HYPOTHESIS.
- `sit_sel_w`/`avoid_habit_*`: habits form on the same
  counts at all ages (procedural spared, §65/§161
  consistent); deliberate selection flat.
- `recon_pe_gate`: flat — boundary-condition literature
  is young-adult; no age leg until evidence.
- `choice_aff_w`: mild rise ≥65 with the positivity
  profile (`w_emo_pos` already knots — the bias term
  rides the same aged affect landscape; no new knot
  needed — reads the aged entries as-is).

## 152. Validation probes (P1331–P1340; registry continues)

- **P1331 sharing channel (MUST, scope-lock):** minted
  emotional records emit a discussEvent bout on ≥60% of
  same-day opportunities at arousal ≥0.6; share count ∝
  arousal (monotone); stored affect tag unchanged by
  sharing — `share_cool_null` (Zech & Rimé 2005);
  shame/guilt episodes share at ≈0.7× and later.
  Rimé et al. 1991/1992; Finkenauer & Rimé 1998.
- **P1332 two-layer avoidance (MUST, dissociation):**
  after extinction drives a CondEntry to its floor, a
  proceduralized `avoid_habit` still fires at habit_p —
  `habit_aff_null`; the deliberate `sit_sel` leg reads
  strength_eff so it lifts with extinction — the two
  legs MUST diverge (feeling says fine, feet say no).
  Salkovskis 1991; de Wit et al. 2018.
- **P1333 somatic bias (SHOULD):** options sharing cues
  with strong negative CondEntries are chosen less at
  matched episodic evidence, bounded by
  `choice_aff_cap`; no content/belief minted —
  `choice_fact_null`. Bechara et al. 1997.
- **P1334 rumination split (MUST):** matched negative
  records under `brooding`-high vs `reflect`-high
  profiles diverge on stored arousal at day 30 (brooded
  ≥1.5× reflected) and on coherence (reflected higher);
  brooding bouts leave content fields bit-identical —
  `brood_content_null`. Treynor et al. 2003; Watkins
  2008.
- **P1335 PE gate (SHOULD — contested literature):**
  identical retellings raise strength but leave fields
  bit-identical — `recon_routine_null`; a disconfirming
  outcome (pe ≥ gate) opens the window and permits
  §5.9 ops. Sevenster, Beckers & Kindt 2012; Luyten &
  Beckers 2017 (counter-evidence noted).
- **P1336 attachment bundles (SHOULD):** `attach_anx`
  raises intrusion rate and slows extinction-to-floor;
  `attach_avo` damps *emitted* affect magnitude while
  stored tags stay intact — emit-vs-store dissociation;
  neither touches content — `attach_content_null`.
  Mikulincer & Shaver 2007.
- **P1337 transference (MUST, honesty-lock):** new
  PersonModel with overlap ≥0.6 inherits
  `affect_prior` scaled `transf_k·overlap`, labeled
  `provenance:"inferred"`; zero content fields minted —
  `transf_fact_null`. Andersen & Cole 1990.
- **P1338 fluency inflation (SHOULD):** high-ease
  retrievals emit confidence +`flu_conf_gain·ease` and
  reported arousal +`flu_int_gain·ease`; stored fields
  and accuracy unchanged — `flu_acc_null`; the gain is
  age-knotted (older ≥ younger at matched ease).
  Koriat 1993; Jacoby & Rhodes 2006.
- **P1339 stress substrate shift (MUST):** under
  C.stress>0.6 + two-factor gate, choices weight
  CondEntry/procedural legs ≥1.5× episodic legs vs
  unstressed control; records' stored content
  unaffected — `stress_ep_fact_null`. Schwabe & Wolf
  2009.
- **P1340 spotlight (SHOULD):** a character's estimated
  other-retention of own embarrassment records ≥1.5×
  the witness's actual retention at day 14; own record
  and witness record stored fields unmoved by the
  estimate — `spot_fact_null`. Gilovich, Medvec &
  Savitsky 2000.

Registry: P1–P1340. v125 suite: P1331, P1332, P1334,
P1337, P1339 MUST (all carry locked-null legs); P1333,
P1335, P1336, P1338, P1340 SHOULD. P1335 is gated SHOULD
because the underlying claim is contested — the probe
exists to falsify the gate, not to enshrine it.

## 153. Honest limits (Part XI)

- **Social sharing**: the 80–96% figures are
  autobiography- and diary-based; the *drive* decay tau
  and `share_spend` are ours. The strongest verified
  claim is the null — sharing does not cool affect —
  which is why it's locked.
- **Avoidance**: the deliberate/procedural split is real;
  `avoid_habit_n`=3 and the 3× episodic tau are unpriced.
  Real habit formation varies wildly (Lally et al. 2010,
  ~66-day median for everyday habits) — treat the count
  as a tuning dial, not a fact.
- **Somatic choice bias**: somatic-marker theory is
  contested as mechanism (Dunn, Dalgleish & Lawrence
  2006); the *behavioral* claim (affect biases choice
  before declarative access) is solid enough to ship.
- **Brooding/reflection**: the factor split is real, but
  the mapping "brooding = tag re-stamp, reflection =
  coherence gain" is our operationalization — Watkins's
  processing-mode account could equally price brooding
  as *abstract* rehearsal vs our valence-selective one.
- **PE gate**: genuinely contested — Luyten & Beckers
  2017 failed to find the boundary; the gate is adopted
  because it produces the right emergent shape (routine
  retellings stabilize, surprises rewrite), and P1335 is
  the designated falsifier.
- **Attachment bundle**: dimensions are consensus; the
  knob mapping is a decomposition, and the deactivating
  "looks fine / carries it" asymmetry rests on
  psychophysiology studies with modest n.
- **Transference**: lab paradigm (sentence-memory +
  evaluation); extending to multi-week acquaintance
  formation is a leap — magnitude ours, direction theirs.
- **Fluency→intensity**: fluency→confidence is Koriat-
  solid; fluency→*felt intensity* is our extension —
  flagged, P1338 tests only direction.
- **Stress substrate shift**: human evidence is
  instrument-learning paradigms; mapping to
  "episodic-deliberative vs CondEntry-habit" is our
  architecture reading of Schwabe's two-system account.
- **Spotlight**: the ~2× overestimation is consensus;
  the specific claim that *embarrassment retention in
  others* is what's overestimated is an extension —
  the honest bound is "self-relevant social records."


# Part XII — v137: the blind beat, the wound that re-lives, the ping that feeds the fear, the camera move that sticks, the warm-faint day, the bored reach backward, the sleep that sells the background, their feeling that fades first, and the forecast that draws the reachable (2026-09-24, twelfth pass)

Nine mechanisms left standing after eleven passes — each one a
verified effect that changes a number in the spec, plus the
honest-limit ledger. Unifying theme: emotion is not a scalar on
the record; it re-prices what surrounds the event in time, in
space, in other people's heads, and in the future the character
imagines.

## 154. The blind beat, then the warm half-hour — the biphasic post-emotion window

The spec already has the warm half-hour (§4.57 `hangover_*`,
Tambini et al. 2017: post-arousal encoding enhanced ~30 min).
What it lacks is the *first beat* — emotion-induced blindness
(EIB): a high-arousal stimulus suppresses perception of what
follows it for ~0.5 s (**Most, Chun, Widders & Zald 2005**,
*Psychol. Sci.*; replicated robustly — Most & Wang 2011;
Kennedy & Most 2012 spatiotemporal-competition account;
Kennedy, Rawding, Most & Hoffman 2014 shows it is perceptual,
not a memory-maintenance artifact). At event granularity the
effect reads: **the event minted immediately after a hot event
is born weak** — attention was still on the burn.

Second half of the same window: the retrograde direction is
**priority-split, not uniform**. Knight & Mather 2009
(*Emotion* 9:763) and **Sakaki, Fryer & Mather 2014**
(*Psychol. Sci.* — verified, three studies): arousal
*enhances* the immediately preceding neutral item when it was
goal-prioritized, *impairs* it when unprioritized — arousal
amplifies top-down priority in both directions (arousal-biased
competition, Mather & Sutherland 2011). And Mather et al. 2006
(*J. Cogn. Neurosci.* 18:614): arousal impairs feature binding
in working memory — the within-event coherence tax §71 already
prices has a WM-level cousin.

**[CONSENSUS]** that emotional events distort their temporal
neighborhood; **[CONSENSUS]** that the retrograde sign is
priority-dependent; **[DEBATED]** whether EIB is perceptual
vs memorial (2014 data favor perceptual — we price it at
encoding either way).

**Spec consequence (§4.105):**

```
on mint of record m with arousal ≥ hangover_arm (0.65):
  // blind beat — the NEXT mint carries the cost
  state.blind_until = next event mint only (one-shot)
  next mint's E0 *= (1 − eib_pen)      // eib_pen 0.4
  // priority-split retrograde on the PREVIOUS mint
  prev.E0 += retro_prio_gain·(2·prev.priority − 1)
          // retro_prio_gain 0.3, priority ∈[0,1]
          // prioritized prev gains up to +0.3,
          // unprioritized loses up to −0.3
```

The sequence reads hot-event → blind beat → hangover warmth:
three windows, three different signs. Locked `eib_free_null`
(the blind beat must cost) + `retro_flat_null` (the retrograde
leg must split on priority — a uniform boost or uniform tax
both fail).

## 155. Social pain re-lives; the bruise doesn't — rejection records

**Meyer, Williams & Eisenberger 2015** (*PLoS ONE* — verified):
reliving a *social* pain memory re-experiences ≈ the initial
pain and recruits mentalizing cortex (dmPFC → dACC/AI
correlation); reliving *physical* pain does not — it routes
through sensory-discriminative cortex and the reported pain
does NOT track the relived signal. Dumas's line they quote:
moral wounds — wronged, betrayed, excluded — do not easily
heal and re-live with little effort. Ostracism registers even
when the exclusion is trivial and meaningless (Williams's
Cyberball corpus — excluded by a computer, for nothing, still
hurts).

**[CONSENSUS]** that social exclusion is painful and
re-liveable well beyond physical-pain norms;
**[single-lab, n=17 fMRI arm — flag modest]** for the exact
relive ratio.

**Spec consequence (§4.106):** records minted with
`emo_tag:"rejection"` (kinds: excluded, dismissed, stood-up,
betrayed-lite — and appraised rejections via §6.400) carry:

```
relived_affect = affTag · rej_relive        // rej_relive 0.85
                 // vs default relive leg  ~0.5 (§4.5 arm)
physical-pain records use pain_relive      // pain_relive 0.3
rejection records: fab_mult = 1.0          // exempt from the
                 // fading-affect bias — fades at positive rate
```

Emergent: the character who was left off the invitation list
re-feels it near-whole when the cue returns, years on, while
the sprained ankle has gone flat. Locked `rej_flat_null`
(P1477): rejection relive must outlast physical-pain relive
at matched tag intensity.

## 156. The appraisal mints the wound — rejection sensitivity (distortion side)

Where §155 stores the wound, this mints it from ambiguity.
**Downey & Feldman 1996** (*JPSP* 70:1327 — the RSQ):
rejection-sensitive people anxiously expect rejection and
*perceive* it in ambiguous behavior — the unread reply, the
flat greeting, the uninvited party. The RS construct is
stable, measurable, and predicts real interpersonal damage
(self-fulfilling: rejection perceived → defensive hostility
→ actual rejection, Downey et al. 1998).

**[CONSENSUS]** for the appraisal bias and its self-fulfilling
loop; the sim needs only the mint-side.

**Spec consequence (§6.400):** on a social event with an
ambiguous-outcome field (unanswered, uninvited, lukewarm —
`ambiguity ≥ rej_cue_thresh` 0.4), roll the authored trait
`rej_sens` [0,1] → the record mints `emo_tag:"rejection"`
with `prov:"appraisal"` (INFERRED tier — the world didn't
reject them; their read did). High `rej_sens` also scales the
tag's intrusion weight (the ambiguous evening comes back at
night). Locked `rej_amb_null` (P1478): `rej_sens` may not
mint rejection-tagged records from unambiguous affiliation
events — the bias needs fog to work.

## 157. The ping that feeds the fear — incubation vs extinction

§4.9 assumes every unreinforced cue fire is a safeCount tick —
extinction. **Eysenck 1968** (*Behav. Res. Ther.* 6:309, the
Napalkov phenomenon): when the original conditioning was
intense, *brief* unreinforced CS exposures can **increase**
the CR rather than extinguish it — the glimpse that keeps
the fear alive. Human replication is mixed: Sandin & Chorot
1989 found no incubation; partial support in high-UCS +
short-CS heart-rate paradigms. **[DEBATED]** — we adopt it as
a gated mechanic because it produces the right emergent shape
(fears fed by passing mentions die only on real visits) and
P1479 is the designated falsifier.

**Spec consequence (§4.107):** a CondEntry with
`|valence|·strength ≥ incub_thresh` (0.6) distinguishes
exposure *depth*:

```
brief exposure (cue present, dwell < ext_min_dur ticks —
              passing mention, glimpse, one-line retell):
    strength += incub_gain·(1 − strength)   // incub_gain 0.04
    safeCount unchanged                     // NOT a safe day
full exposure (dwell ≥ ext_min_dur):
    safeCount += 1  as before (§4.9)
```

Emergent: the trauma cue glimpsed in a headline feeds the
entry; only a full uneventful encounter earns suppression.
Locked `incub_mild_null` (P1479): entries below
`incub_thresh` may never incubate — mild associations
extinguish on any exposure.

## 158. The camera move that sticks — perspective shift plasticity

§5.39 already emits `persp` (field/observer) and dampens
reported affect on observer reconstructions (`persp_affect_
loss`; Nigro & Neisser 1983; shame records run observer-biased
per §60). What the spec lacks: **the shift is plastic and
one-way.** **Sekiguchi & Nonaka 2014** (*Emotion* 24:375 —
verified): an instructed field→observer shift reduces the
memory's emotional intensity **and the reduction persists to
retells four weeks later**; observer→field does NOT restore
intensity. Vantage point is also the most *reliable* memory
characteristic in test-retest (Sutin & Robins-adjacent work,
*Memory* 2015 — perspective correlates with recall intensity,
not with objective accuracy).

**[CONSENSUS]** that observer retells dampen felt intensity;
**[DEBATED→small-n]** that the shift permanently rewrites the
tag — adopted, direction verified.

**Spec consequence (§5.165):**

```
persp_shift op (deliberate or audience-requested retell
                from observer):
  record.persp_persist = "observer"   // sticky: subsequent
       // emissions run observer at persp_stick 0.7
  affTag relive *= (1 − persp_cool)   // persp_cool 0.35,
       // one-way valve — applied once, never refunded
field→observer only; observer→field emits at current
       // intensity (no reheat)
```

Locked `persp_reheat_null` (P1480): an observer→field retell
may restore ≤20% of the cooled intensity — the camera move
that cools cannot be un-moved by will.

## 159. Warm but faint — the low-arousal positive class

**Kensinger 2004** and the arousal-vs-valence literature the
whole doc rests on: enhancement tracks **arousal**, not
valence. Ergo serenity, contentment, a quiet good afternoon —
valence-positive, arousal-low — encode at **neutral rates**.
Yet the rest of the machine treats them as positive: §105's
positivity effect overdraws them ≥60, the FAB files them on
the slow leg, `pos_spare` spares them on specificity loss.
That is a coherent phenotype: **the warm day you barely
notice accruing, that the older self keeps finding.**
**[CONSENSUS]** on the encoding side; **[HYPOTHESIS]** that
the retrieval-side positive treatment survives intact —
theory-consistent, untested directly.

**Spec consequence (§5.167):** mints with `valence > 0.3 AND
arousal < calm_arm` (0.35) flag `calm:true` — no `w_emo` leg
at encode (arousal below arm contributes ~0 anyway; the flag
makes the class explicit), but `calm:true` records remain
eligible for `pos_spare` and positivity-effect overdraw —
`calm_pos_spare` 1.0 (full eligibility; the character's first
weekday-of-a-good-year is not a deficit case). Locked
`calm_boost_null` (P1481): calm-positive records must not
out-retain neutral records at matched delay — the warmth is
retrieval-side only.

## 160. Boredom reaches backward — the idle mind draws the warm archive

**van Tilburg & Igou 2013** (*Emotion* 13 — verified, six
studies): state and dispositional boredom **increase**
nostalgia, mediated by meaning-seeking; nostalgia in turn
restores felt meaning. Boredom is a trigger for the §34/§62
nostalgia channel that the spec currently fires only on
distress. (Encode side needs nothing new — bored encoding is
just `att`-starved minting.)

**[CONSENSUS]** for the boredom→nostalgia path.

**Spec consequence (§5.166):** state `bored:true` (no engaged
event for `bored_win` ~45 sim-min) adds a retrieval-weight
term `bored_nost` (0.2) on §34-qualifying nostalgic records
(`valence>0.3 ∧ selfRelevance≥0.6 ∧ era-matched`) — idle
characters drift to the warm archive on their own, and
memory-track observers see a character *use* the past to
regulate the present. Locked `nost_rand_null` (P1482): the
bored draw must concentrate on bond/meaning records, not
arbitrary positives.

## 161. Sleep sells the background twice — the trade-off deepens overnight

§15 priced the emotional-memory trade-off at **encoding**
(arousal buys the item, sells the context). **Payne,
Stickgold, Swanberg & Kensinger 2008** (*Psychol. Sci.*
19:781 — verified): across 12 h *awake*, negative objects and
their backgrounds decay together; across 12 h *including
sleep*, objects are preserved (68% vs 44% wake) while
backgrounds gain **nothing** (38% vs 38%). Sleep re-executes
the trade-off — it is a second selling of the background, not
a blanket save.

**[CONSENSUS]** direction (replicated pattern; nap studies
agree — Nishida et al. 2009).

**Spec consequence (§4.109):** during the sleep tick, records
with `arousal ≥ strade_arm` (0.5) take the existing
`emo_consol_gain` on central content **and** decay their
context/peripheral fields at `sleep_ctx_mult` (1.3×) — the
background erodes *through* sleep even as the center is
saved. Wake ticks keep them coupled. Locked `sleep_ctx_null`
(P1483): backgrounds of emotional records must show zero
sleep benefit — a merge that sleeps the whole scene fails
the probe.

## 162. Their feeling fades first — the self/other affect persistence split

A character's own emotional state mints an `affTag` that
persists (§4.9, selfRelevance-gated). A *partner's* expressed
emotion mints a thinner thing — observed affect, not felt
affect — and it should die faster unless it was attended
(§127 already gates the encode on attention). Direct
evidence: the self-reference effect (Rogers, Kuiper & Kirker
1977) prices self > other encoding; empathic-accuracy work
(Ickes) bounds how much of another's state is ever captured;
and Levine's remembered-emotion program shows even *own*
remembered emotion is rebuilt through current appraisal —
another's gets rebuilt through twice the fog.
**[HYPOTHESIS]** on the magnitude — the direction is
self-reference consensus, the decay split is ours.

**Spec consequence (§4.108):** records minted from observed
other-affect flag `oth_emo:true` and decay
`β·oth_emo_mult` (1.4) — unless the observer's own affect was
co-active (§117 shared-arousal witness bond), in which case
the record re-flags self-relevant and rides the normal leg.
Emergent: "she was furious that day" fades faster than "I was
furious" — the promise the *other* person made emotionally
is exactly the knowledge that goes unequal first. Locked
`oth_free_null` (P1484a→ merged into P1477 block — see
registry): other-affect records cannot persist at self-affect
rates.

## 163. The forecast draws the reachable — accessibility-weighted prediction

§50 priced the impact bias (focalism + immune neglect). The
mechanism underneath is sampling: **Morewedge, Gilbert &
Wilson 2005** (*PSPB* — "the least likely of times"): people
predict future experience from remembered instances, and the
remembered instances are **unrepresentative** — they are the
intense, recent, available ones. The forecast error is a
retrieval error.

**Spec consequence (§5.168):** the `forecast` op does not
average the domain — it draws `fc_sample_n` (3) records by
the ordinary cue-driven R-weighted sampler and predicts
intensity off the **max** of the sample (peak rule already
in §13): a character whose strongest breakup record is a
catastrophe predicts catastrophe, whatever the average
breakup looked like. Locked `fc_mean_null` (P1484): when the
top-R record is atypical, forecast error vs the domain mean
must exceed `fc_dev` — predicting the mean is the failure
mode, not the success.

## 164. Spec delta (v5.82 → v5.83)

- **§4.105** `eib_pen`/`retro_prio_gain`: biphasic post-
  emotion window — next mint taxed (blind beat), previous
  mint split on priority; `eib_free_null` + `retro_flat_null`.
- **§4.106** `rej_relive`/`pain_relive`/`rej` FAB exemption:
  rejection-tagged records relive near-initial, physical-pain
  records don't; `rej_flat_null`.
- **§4.107** `incub_thresh`/`incub_gain`/`ext_min_dur`: brief
  sub-threshold cue exposures strengthen intense CondEntries
  instead of accruing safeCount (DEBATED, Eysenck);
  `incub_mild_null`.
- **§4.108** `oth_emo:true` + `oth_emo_mult`: observed
  other-affect decays 1.4× unless shared-arousal re-flags it
  self-relevant; `oth_free_null`.
- **§4.109** `strade_arm`/`sleep_ctx_mult`: sleep re-runs the
  emotional trade-off — center saved, context eroded;
  `sleep_ctx_null`.
- **§5.165** `persp_stick`/`persp_cool`/`persp_persist`:
  field→observer shift is plastic and one-way (Sekiguchi &
  Nonaka); `persp_reheat_null`.
- **§5.166** `bored_win`/`bored_nost` + `bored` state:
  boredom opens the §34 nostalgia draw (van Tilburg & Igou);
  `nost_rand_null`.
- **§5.167** `calm:true`/`calm_arm`/`calm_pos_spare`: low-
  arousal positive class — neutral encode, positive retrieve;
  `calm_boost_null`.
- **§5.168** `fc_sample_n`/`fc_dev`: forecasts sample top-R
  records, predict off max (Morewedge et al.);
  `fc_mean_null`.
- **§6.400** `rej_sens` trait + `rej_cue_thresh`: ambiguous
  social cues mint appraisal-tier rejection records (Downey &
  Feldman); `rej_amb_null`.
- **§7 params:** +14 scalars (`eib_pen`, `retro_prio_gain`,
  `rej_relive`, `pain_relive`, `incub_thresh`, `incub_gain`,
  `ext_min_dur`, `oth_emo_mult`, `strade_arm`,
  `sleep_ctx_mult`, `persp_stick`, `persp_cool`, `bored_win`,
  `bored_nost`, `calm_arm`, `calm_pos_spare`, `fc_sample_n`,
  `fc_dev`, `rej_cue_thresh`) +1 authored trait (`rej_sens`)
  +4 record fields (`calm`, `oth_emo`, `persp_persist`,
  `rej`-tag via `emo_tag`) +1 state (`bored`) +10 locked
  nulls.

## 165. Age guidance (extends §§10/23/37/53/67/81/95/109/123/137/151)

- `eib_pen`: knots *down* ≥65 — older adults show reduced
  emotional-distraction capture (socioemotional selectivity;
  Mather lab aging work) — `knot:0.4@55,0.35@65,0.28@75,
  0.2@85` (HYPOTHESIS on magnitude).
- `rej_sens`: mild decline ≥60 — rejection sensitivity
  attenuates with age under SST (HYPOTHESIS; knot the trait
  read ≥60 at ×0.85, not the authored value).
- `incub_*`: flat — anxiety-linked, no lifespan data;
  HYPOTHESIS, hold constant.
- `persp_*`: rides existing `persp_age_gain` knots; the
  stick/cool legs assumed age-flat (no data — HYPOTHESIS).
- `bored_nost`: rises with age — nostalgia is more available
  and more used ≥65 (consistent with the §151
  `nostalgia_gain` knot): `0.15@55 → 0.22@70 → 0.3@85`.
- `calm_pos_spare`: already covered by `pos_spare`/`w_emo_pos`
  age knots — no new leg.
- `sleep_ctx_mult`: flat — the re-executed trade-off has no
  age data; the sleep-fragility story lives in `sws_mult`.
- `oth_emo_mult`: flat; plausible interaction with
  source-aging (whose feeling? is a source problem) — flag,
  no leg until evidence.
- `fc_*`: flat — forecasting biases appear age-robust
  (HYPOTHESIS).

## 166. Validation probes (P1475–P1484; registry continues)

- **P1475 blind beat (MUST):** neutral event minted
  immediately after an `arousal ≥ hangover_arm` event carries
  E0 reduced by ≥`eib_pen` vs matched control —
  `eib_free_null`.
- **P1476 priority-split retrograde (MUST):** pre-emotion
  high-priority neutral gains vs control while low-priority
  loses; a flat retrograde leg fails — `retro_flat_null`.
- **P1477 rejection relive (SHOULD):** rejection-tagged
  record relives ≥0.8·initial tag at day 30 vs physical-pain
  ≤0.4; `rej_flat_null`. (`oth_emo` folded: other-affect
  record fades ≥1.3× self-affect rate — `oth_free_null` leg
  on same probe.)
- **P1478 appraisal mint (MUST):** ambiguous social cue
  mints `rej`-tagged `prov:"appraisal"` record only at
  `rej_sens ≥ 0.4`; unambiguous affiliation mints none at any
  `rej_sens` — `rej_amb_null`.
- **P1479 incubation (SHOULD, DEBATED-gated):** brief pings
  on an `≥incub_thresh` entry raise strength across 5
  exposures; sub-threshold entries extinguish —
  `incub_mild_null`. Probe exists to falsify the gate.
- **P1480 perspective valve (MUST):** field→observer retell
  cuts emitted intensity ≥`persp_cool` and persists ≥28
  sim-days; observer→field restores ≤20% —
  `persp_reheat_null`.
- **P1481 calm class (MUST):** `calm:true` R ≈ neutral at
  matched delay (±5%); positivity-overdraw eligibility ≥60
  unchanged — `calm_boost_null`.
- **P1482 bored reach (SHOULD):** `bored` state raises
  nostalgic-record draw rate by ≥`bored_nost` relative term,
  draws concentrated on bond/meaning records —
  `nost_rand_null`.
- **P1483 sleep re-trade (MUST):** post-sleep, central
  fields of `arousal≥strade_arm` records preserved while
  their context fields decay ≥1.25× wake rate —
  `sleep_ctx_null`.
- **P1484 reachable forecast (SHOULD):** with an atypical
  top-R record, predicted intensity error vs domain mean
  exceeds `fc_dev`; mean-prediction fails —
  `fc_mean_null`.

Registry: P1–P1484. v137 suite: P1475, P1476, P1478, P1480,
P1481, P1483 MUST (all carry locked-null legs); P1477, P1479,
P1482, P1484 SHOULD — P1479 is the designated falsifier for
the incubation gate.

## 167. Honest limits (Part XII)

- **EIB at event granularity**: the lab effect is ~500 ms of
  perceptual suppression in an RSVP stream. Mapping it to
  "the next event mint is weak" is our granularity call —
  direction right, magnitude ours (`eib_pen` 0.4).
- **Retrograde priority**: verified direction, but the lab
  operationalizes "priority" via task goals; mapping to the
  sim's `priority` field assumes the deliberation layer marks
  goal-relevance — assumption, flagged.
- **Rejection relive**: single-lab fMRI (n=17) plus the
  ostracism corpus; the *decay* asymmetry (rej FAB exemption)
  is our inference from "re-lives near-initial," not a
  measured tau.
- **Incubation**: genuinely contested — Eysenck's claim has
  partial human replication at best. Shipped behind
  `incub_thresh` + DEBATED flag with P1479 as falsifier; if
  the probe fails the gate should go.
- **Perspective stick**: verified at 4 weeks, one lab, n≈50;
  permanence beyond that is extrapolation — `persp_stick`
  0.7 leaves it mostly-sticky, not absolute.
- **Calm class**: encode side is solid (arousal≠valence);
  the *retrieval*-side claim that calm-positives keep full
  positive treatment is theory-consistent HYPOTHESIS.
- **Boredom→nostalgia**: six-study package, but the mediator
  is "search for meaning" — our `bored_win` is a proxy for
  disengagement, not a measured meaning deficit.
- **Other-affect decay**: direction is self-reference
  consensus; `oth_emo_mult` 1.4 is unpriced by data — tuning
  dial, marked.
- **Forecast sampling**: Morewedge et al. show the sample is
  unrepresentative; "predict off max of top-3" is our
  operationalization — a pure availability model might use
  mean-of-sample; the peak rule is the more defensible read
  of §13.
