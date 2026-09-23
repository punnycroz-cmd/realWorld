# Character Memory Profiles v0 — archetype parameter templates

**Track:** memory-research (sf/memory) · **Companion to:** `memory-model-spec.md`
(param names refer to that spec's §7 `MemoryParams` table) and
`human-memory-research.md` (R§n citations).

These are **archetype templates**, not individuals. When the world track's
character bibles exist, each of the 8 mains gets an individual profile built
by perturbing the nearest age-band archetype with modifier deltas (§3) —
never copying raw.

## 0. Global clamp ranges (validation)

| param | min | max | notes |
|---|---|---|---|
| enc_base | 0.15 | 0.60 | |
| att_min | 0.05 | 0.35 | |
| w_emo / w_self / w_nov / w_pred | 0.1 | 2.0 | |
| arousal_narrowing | 0.0 | 1.0 | |
| sleepFactor | 0.6 | 1.15 | applied daily |
| beta_episodic | 0.2 | 0.9 | higher = forgets faster |
| beta_semantic | 0.05 | 0.5 | |
| beta_source | 0.4 | 2.0 | source-tag decay; high = loses attribution |
| k_verbatim | 1.5 | 4.0 | verbatim decay multiplier |
| tau_episodic / tau_semantic | 0.5 / 10 | 4 / 60 | |
| interf_k | 0.03 | 0.30 | |
| interf_thresh / merge_thresh | 0.4 | 0.9 | |
| forget_thresh | 0.03 | 0.20 | |
| neg_affect_decay | 0.8 | 2.0 | >1 = negative fades faster (normal) |
| theta | 0.25 | 0.65 | retrieval threshold |
| w_str / w_state / w_place / w_people / w_topic / w_sensory | 0.05 | 1.0 | cue weights |
| rec_k / rec_tau_days | 0.1 / 0.5 | 0.6 / 5 | |
| rif_k | 0.0 | 0.15 | |
| retell_boost | 0.1 | 0.5 | |
| drift_p | 0.02 | 0.20 | per-field mutation on recall |
| misinfo_suscept | 0.05 | 0.70 | rumor adoption |
| confab_fill | 0.1 | 0.9 | gap-filling propensity |
| bump_beta_mult | 0.3 | 1.0 | reminiscence-bump retention bonus |
| consol_window_days | 0.5 | 2.0 | pre-first-sleep regime (v0.1) |
| consol_beta_mult | 0.3 | 0.8 | decay rate during consolidation window |
| permastore_age | 90 | 365 | game days before semantic freeze check |
| permastore_thresh | 0.15 | 0.40 | strength needed to freeze |
| face_ceiling | 0.5 | 0.8 | stranger verbatim cap (Deffenbacher 2008) |
| stress_thresh | 0.7 | 0.95 | arousal level triggering encode loss |
| stress_encode_loss | 0.2 | 0.4 | verbatim E penalty under stress |
| fan_k | 0.2 | 0.8 | log-fan divisor strength (v0.2) |
| place_reinstate | 0.05 | 0.30 | matched-place cue bonus (v0.2) |
| mental_reinstate | 0.03 | 0.20 | ≤ place_reinstate; ≈0.6× default (v0.2) |
| sensory_age_slope | 0.0 | 2.0 | odor cue reaches older memories (v0.2) |
| sensory_mismatch_pen | 0.0 | 0.15 | incongruent-sensory penalty (v0.2) |
| w_msd | 0.0 | 0.25 | mood-state dependency; weak by design (v0.2) |
| recogn_pen | 0.2 | 0.7 | copy-cue penalty, recognition mode (v0.2) |
| intrusion_thresh | 0.5 | 0.95 | lower = more spontaneous recalls (v0.2) |
| resurrect_thresh | 0.7 | 0.95 | cue level to un-archive records (v0.2) |
| plist_suppress | 0.0 | 0.15 | part-list cuing suppression (v0.2) |
| amnesia_exit | 5 | 9 | encodeAge below → permanent amnesia_decay_mult (v0.3) |
| amnesia_decay_mult | 1.2 | 3.0 | childhood exponential-regime β mult (v0.3) |
| bump_lo / bump_hi | 8 / 20 | 15 / 40 | encodeAge window edges (v0.3) |
| bump_peak | 12 | 22 | ±3y per-character jitter (v0.3) |
| bump_self_thresh | 0.4 | 0.8 | valence-gate fallback for bump (v0.3) |
| link_p | 0.3 | 0.95 | associative-edge formation prob (v0.3) |
| w_emo_pos / w_emo_neg | 0.3 | 2.0 | valence-split arousal weight (v0.3) |
| pm_self | 0.2 | 0.95 | self-initiated intention recall (v0.3, optional) |
| search_breadth | 3 | 15 | candidates scored per recall (v0.4) |
| env_support_gain | 1.0 | 1.6 | cueMatch_ext multiplier; ≥1, rises w/ age (v0.4) |
| discrim_mult | 0.6 | 1.0 | scales interf/merge thresholds; ≤1 (v0.4) |
| lure_accept | 0.0 | 0.4 | similar-cue false-positive in recognition (v0.4) |
| specificity | 0.3 | 1.0 | episode-vs-generic return rate (v0.4; also §2 depressive) |
| pos_spare | 0.0 | 0.5 | positive-cue sparing on specificity (v0.4) |
| tot_rate | 0.0 | 0.3 | name-field blanking probability (v0.4) |
| sws_mult | 0.5 | 1.1 | episodic consolidation age scaling (v0.4) |
| ret_noise | 0.0 | 0.25 | σ of drive noise (v0.4) |
| reserve | 0.0 | 1.0 | cognitive reserve → age_eff shift (v0.4) |
| reserve_shift | 4 | 15 | years offset at reserve=1 (v0.4) |
| terminal_window | 500 | 2200 | game days before deathDay (v0.4, optional) |
| terminal_gain / terminal_loss | 0 / 0 | 4 / 0.9 | terminal ramp magnitudes (v0.4) |
| emo_consol_gain | 0.0 | 0.6 | first-sleep arousal bonus; FLAT across age (v0.5) |
| abc_gain | 0.0 | 0.6 | central-field boost under arousal (v0.5) |
| emo_blink_thresh | 0.5 | 0.95 | arousal that suppresses neighbors (v0.5) |
| emo_blink_window | 0.01 | 0.1 | days; scene window (v0.5) |
| emo_blink_loss | 0.1 | 0.6 | neighbor encodingE loss (v0.5) |
| post_stress_window / post_stress_gain | 0.01 / 0.0 | 0.15 / 0.4 | retrograde enhancement (v0.5) |
| conf_emo_gain | 0.0 | 0.4 | arousal² confidence inflation (v0.5) |
| flashbulb_thresh / flashbulb_conf_floor | 0.7 / 0.7 | 0.95 / 0.99 | permanent certainty floor (v0.5) |
| trauma_thresh / trauma_floor | 0.8 / 0.1 | 0.98 / 0.5 | record-level trauma phenotype (v0.5) |
| cond_thresh / cond_gain | 0.4 / 0.2 | 0.9 / 1.0 | conditioned-affect acquisition (v0.5) |
| cond_decay | 0.0 | 0.03 | daily; keep very small — outlives episodes (v0.5) |
| extinct_suppress | 0.0 | 0.2 | per-safe-day suppression (v0.5) |
| recovery_days / recovery_frac | 7 / 0.0 | 120 / 0.9 | spontaneous recovery (v0.5) |
| emo_gist_beta | 0.5 | 1.0 | gist β multiplier for arousal ≥0.6 records (v0.5) |
| emo_verbatim_k | 1.0 | 2.5 | extra verbatim decay on emotional records (v0.5) |
| arousal_affect_decay | 1.0 | 2.5 | arousal-tag vs valence-tag decay ratio (v0.5) |
| neg_fidelity / pos_gist_drift | 0.5 / 1.0 | 1.0 / 1.5 | valence-conditioned drift (v0.5) |
| neg_core_resist | 0.3 | 1.0 | misinfo resistance, negative core fields (v0.5) |
| mood_bleed / mood_arousal_bleed | 0.0 | 0.35 | reconstruction mood shift (v0.5) |
| stress_retrieve_thresh / stress_retrieve_loss | 0.4 / 0.0 | 0.9 / 0.3 | acute retrieval impairment (v0.5) |
| rumin_k | 0.0 | 1.5 | valence-selective rehearsal gain (v0.5) |
| warn_mult | 0.2 | 0.8 | post-warning suppression of p_adopt (v0.6) |
| rep_gain / rep_cap | 0.1 / 1.2 | 0.8 / 3.0 | log-fluency on hearCount (v0.6) |
| dispute_mult | 0.0 | 0.2 | live-dispute adoption floor (v0.6) |
| retract_p / cie_residual | 0.3 / 0.1 | 0.9 / 0.6 | correction believability / leak (v0.6) |
| w_plaus / w_corr / w_fluency | 0.1 | 0.8 | believe_p weights; plaus leads (v0.6) |
| sleepdep_misinfo_gain | 1.0 | 1.6 | encoding-time sleep-dep susceptibility (v0.6) |
| sleep_gist_boost | 0.0 | 0.15 | sleep tick edge for gist/phantom (v0.6) |
| gist_lure_gain | 0.0 | 0.6 | phantom detail write-in (v0.6) |
| phantom_p / phantom_fan_min | 0.0 / 2 | 0.08 / 8 | whole-episode phantom cap/fan (v0.6) |
| rm_rich_thresh | 0.3 | 0.8 | richness gate for imagined→witnessed (v0.6) |
| plaus_min / imagine_gain | 0.15 / 0.0 | 0.6 / 0.4 | implantation gate + gain (v0.6) |
| source_confuse_flip | 0.0 | 0.4 | imagined→witnessed flip per check (v0.6) |
| source_confuse | 0.0 | 0.3 | external-source reassignment (v0.6) |
| peak_hour | null/5 | 22 | circadian peak hour; null = flat (v0.7) |
| synchrony_gain | 0.0 | 0.15 | off-peak encode/θ penalty, age-scaled (v0.7) |
| vivid_detail | 0.3 | 1.0 | peripheral field write prob (v0.7) |
| conf_bias | −0.2 | 0.2 | trait confidence offset, accuracy-untouched (v0.7) |

**v0.3 continuous-curves note:** the archetypes below are now *named knots*
on the piecewise-linear age curves in `age-development.md` §6 — the runtime
evaluates capacity params at the character's actual `age_now`, not the band
label. The block values are the curve's values at the archetype's central
age; era effects (amnesia ramp, bump window) are applied per-record from
`encodeAge`, not from the profile. The two distortion channels now have
opposite age gradients (suggestion U-shaped, gist monotonic — see
`age-development.md` §4).

**v0.4 decline-layer note:** decline-side params additionally evaluate at
`age_eff = age_now − reserve·reserve_shift` (spec §4.8) — a high-reserve
70-year-old reads the curve at ~63. `deathDay` unset for all archetypes
(terminal ramp off). Midlife knots flattened per Rönnlund 2005
longitudinal plateau 35–60 (age-decline.md §11); decline-curve knot rows
in `age-decline.md` §13.

**v0.5 emotional-layer note:** the emotional params (w_emo, emo_consol_gain,
abc_gain, conf_emo_gain, neg_fidelity, neg_core_resist) stay FLAT across age
— emotional enhancement is preserved in aging, so its proportional advantage
grows as neutral encoding falls (Kensinger et al. 2007; emotional-memory.md
§10). Archetype deltas that DO vary: teen raises w_emo/arousal_narrowing/
emo_blink_loss (limbic-dominant encoding, everything is a scene); older
adult raises w_emo_pos/w_emo_neg split (already), mood_bleed ×1.3, and
keeps a deep conditioned-association table (decades of cond entries).
All v0.5 params have spec defaults — profiles only override where a
character's affect style differs.

**v0.6 false-memory note:** the new distortion params split by the two
existing channels — `gist_lure_gain`, `phantom_p`, `sleep_gist_boost`
scale with `confab_fill` (monotonic gist channel); `warn_mult`,
`dispute_mult`, `retract_p`, `sleepdep_misinfo_gain` ride the
suggestion side (U-shaped `misinfo_suscept`); `source_confuse`/
`source_confuse_flip`/`rm_rich_thresh` scale with `discrim_mult`
(source monitoring is discrimination machinery — older adults confuse
sources more). `imagine_gain` is personality-flavored (ruminators,
daydreamers); `plaus_min` should be near-flat across age — children and
adults both reject bizarre content, children differ in what counts as
bizarre. Emergent check: a co-witness pair discussing a field neither
holds verbatim should converge ~70% of the time (Gabbert 2003 anchor).

**v0.7 individual-differences note:** modifiers in §2 are now named
*trait bundles* — each maps to positions on the IndivTraits vector
(g_mem, wmc, neurot, extra, consc, open, vivid, distrust, fantasy,
sleep, stress, social, sex, chronotype) per individual-differences.md
§6, and §4's diversity rule now samples traits rather than jittering
params directly. Four new params (peak_hour, synchrony_gain,
vivid_detail, conf_bias) carry the circadian/vividness/metacognitive
effects. Hard nulls that generation must NOT create: g_mem does not
lower misinfo_suscept (Patihis 2013 — HSAM stays suggestible), wmc does
not lower cie_residual (Brydges 2018), vivid does not touch accuracy
(Dawes 2022). New extreme-tail recipes (HSAM, SDAM, aphantasia) are in
individual-differences.md §2.13 — cast at most one tail per
neighborhood.

Missing values in a template inherit `DEFAULT` (spec §7). Every value below is
within clamps; behavioral notes explain the intent so implementers can sanity-
check emergent behavior. β_episodic / τ_episodic values were re-checked
against fitted human curves in v1 (`forgetting-curves.md` §4) — all
archetypes sit between the Ebbinghaus floor (β≈0.47, meaningless material)
and the autobiographical plateau; the age gradient on β_episodic (child 0.65
→ young adult 0.42 → older 0.72) mirrors Park et al. 2002's linear lifespan
decline while β_semantic stays flat.

## 1. Age-band archetypes

### A. Child (≈6–12) — "the unreliable witness"
High encoding of emotionally/self-relevant events, poor source monitoring,
very high suggestibility, weak metamemory (R§7 childhood). Childhood-amnesia
window: memories formed before character-age ~5 start with accuracy·0.3 and
decay at 2× (usually gone by adulthood). [v0.3 supersedes: implemented as
`amnesia_ramp(encodeAge)` on E + permanent `amnesia_decay_mult` — age-development.md §2]

```
enc_base 0.30 · att_min 0.20 (distractible — less is gated in)
w_emo 1.3 · w_self 0.9 · w_nov 1.1 · w_pred 0.9 · arousal_narrowing 0.4
sleepFactor 1.05 (children sleep deeply)
beta_episodic 0.65 · beta_semantic 0.35 · beta_source 1.6 · k_verbatim 3.2
tau_episodic 0.9 · interf_k 0.18 · interf_thresh 0.5 · merge_thresh 0.7
forget_thresh 0.10 · neg_affect_decay 1.1
theta 0.40 · w_state 0.45 (strong mood-congruence) · w_sensory 0.25
rif_k 0.03 · retell_boost 0.35
drift_p 0.12 · misinfo_suscept 0.60 · confab_fill 0.75
gist_lure_gain 0.45 · phantom_p 0.04 · imagine_gain 0.25
  (v0.6: children phantomize freely and imagination-inflate fast —
  Ceci & Bruck suggestibility + immature reality monitoring)
```
Emergent: vivid but scrambled; adopts adults' versions of events easily;
confidently wrong.

### B. Teen (≈13–19) — "everything is salient"
Limbic-prefrontal imbalance: emotion and social salience dominate encoding
(R§7 adolescence). Strong verbatim, strong affect, moderate source skill.

```
enc_base 0.42 · att_min 0.12
w_emo 1.6 · w_self 1.4 · w_nov 1.0 · w_pred 0.8 · arousal_narrowing 0.7
sleepFactor 0.85 (chronic sleep debt)
beta_episodic 0.45 · beta_semantic 0.22 · beta_source 0.9 · k_verbatim 2.4
tau_episodic 1.4 · interf_k 0.12 · interf_thresh 0.6 · merge_thresh 0.82
forget_thresh 0.07 · neg_affect_decay 0.9 (grudges PERSIST)
theta 0.42 · w_people 0.55 · w_state 0.4
  (deliberate Wagenaar-ordering violation: adolescent social encoding
  inverts topic > people — documented deviation, R§7 adolescence)
rif_k 0.04 · retell_boost 0.3
drift_p 0.09 · misinfo_suscept 0.45 · confab_fill 0.6
```
Emergent: remembers every slight at full heat; social world over-encoded;
slow to let go of negative affect.

### C. Young adult (≈20–35) — "peak hardware"
Best raw encoding and retrieval (R§7). This band is also inside the
reminiscence bump — records formed now keep `bump_beta_mult 0.6` forever.

```
enc_base 0.45 · att_min 0.12
w_emo 1.0 · w_self 1.1 · w_nov 0.7 · w_pred 0.6 · arousal_narrowing 0.55
sleepFactor 1.0
beta_episodic 0.42 · beta_semantic 0.18 · beta_source 0.8 · k_verbatim 2.2
tau_episodic 1.5 · interf_k 0.10 · interf_thresh 0.62 · merge_thresh 0.82
forget_thresh 0.07 · neg_affect_decay 1.25
theta 0.40 · w_str 0.9 · w_place 0.3 · w_people 0.33 · w_topic 0.36
rif_k 0.05 · retell_boost 0.28
drift_p 0.07 · misinfo_suscept 0.30 · confab_fill 0.45 · bump_beta_mult 0.6
```
Emergent: the "cleanest" rememberer — still reconstructs and errs, but least.

### D. Midlife (≈40–60) — "gist over detail"
Episodic detail softens; semantic and expert memory strong; name/source
retrieval failures rise (R§7 midlife). Memories from their own 15–25 window
retain the bump bonus.

```
enc_base 0.38 · att_min 0.15
w_emo 0.9 · w_self 1.0 · w_nov 0.55 · w_pred 0.45 · arousal_narrowing 0.6
sleepFactor 0.95
beta_episodic 0.55 · beta_semantic 0.18 · beta_source 1.2 · k_verbatim 2.9
tau_episodic 1.3 · interf_k 0.14 · interf_thresh 0.58 · merge_thresh 0.78
forget_thresh 0.09 · neg_affect_decay 1.4
theta 0.47 · w_topic 0.35 (gist-led recall) · w_sensory 0.08
rif_k 0.06 · retell_boost 0.3
drift_p 0.10 · misinfo_suscept 0.35 · confab_fill 0.6 · bump_beta_mult 0.6
```
Emergent: tells the same story slightly differently each year; remembers
*that* things happened better than *how*; solid domain knowledge.

### E. Older adult (≈65+) — "deep roots, thin leaves"
Episodic/source decline, preserved semantics, gist reliance → higher false
memory, positivity bias, thin verbatim (R§7 older adulthood). Deep archive:
decades of bump-era records at low β.

```
enc_base 0.28 · att_min 0.18
w_emo 1.1 · w_self 1.0 · w_nov 0.5 · w_pred 0.4 · arousal_narrowing 0.65
sleepFactor 0.85 (lighter sleep)
beta_episodic 0.72 · beta_semantic 0.22 · beta_source 1.7 · k_verbatim 3.5
tau_episodic 1.0 · interf_k 0.18 · interf_thresh 0.55 · merge_thresh 0.72
forget_thresh 0.12 · neg_affect_decay 1.7 (positivity effect)
theta 0.52 · w_state 0.35 · w_sensory 0.2 (Proust cues — smell triggers recall)
sensory_age_slope 1.3 · intrusion_thresh 0.65 (drifts into the past often)
plist_suppress 0.08 (easily steered by what others said)
rif_k 0.08 · retell_boost 0.35 (much-retold old stories stay sharp — and drifted)
drift_p 0.14 · misinfo_suscept 0.50 · confab_fill 0.8 · bump_beta_mult 0.5
gist_lure_gain 0.45 · phantom_p 0.03 · source_confuse 0.2
source_confuse_flip 0.25 · rm_rich_thresh 0.4
  (v0.6: weak verbatim + faded source tags → invented detail and
  misattributed sources; the polished-and-partly-false old story)
link_p 0.45 (associative deficit — knows *that*, not *with whom/where*)
w_emo_pos 1.25 · w_emo_neg 0.85 (positivity at encoding, SST)
pm_self 0.45 (event-cued intentions fine; bare deadlines slip)
search_breadth 7 · env_support_gain 1.3 (cue-rich contexts rescue recall)
discrim_mult 0.8 · lure_accept 0.2 (similar-but-new accepted as old)
specificity 0.75 · pos_spare 0.2 (overgeneral AM; positive cues spared)
tot_rate 0.12 (name-blanking with feeling-of-knowing; resolves on sight)
sws_mult 0.85 · ret_noise 0.12 · reserve 0.4 (per-bible; shifts age_eff)
```
Emergent: recent events evaporate; youth-era memories are vivid, polished by
retelling, and partly invented; warm memories outlast grievances.
[v0.3: the v0 numbers above read as knots — a 70-year-old evaluates
`beta_episodic`, `theta`, `misinfo_suscept` etc. from the §6 curve in
age-development.md, which lands near these values at age ~70.]

## 2. Cross-cutting modifiers (add/multiply onto the archetype)

Apply multiplicatively to the listed param, clamped to §0. Stack at most 3.

| Modifier | Deltas | Rationale |
|---|---|---|
| **Trauma history** | w_emo ×1.4; arousal_narrowing ×1.3; beta_source ×1.3; drift_p ×1.3 under stress; misinfo_suscept ×0.9 for the trauma topic only (hyperconsolidated core); intrusion_thresh −0.15 for threat-cued records (intrusive recall). **v0.5:** seed ≥1 `trauma:true` backstory record + cond_thresh ×0.9, cond_gain ×1.3 (lowered acquisition bar, faster conditioning) — the intrusion discount and fragmented timeline are now record properties (spec §5.7, emotional-memory.md §7) | hyper-encoded threat core, fragmented context; conditioned dread outlives the record (R§5, R§8; RC§5; Bouton 2004) |
| **High-stress job / chronic stress** | enc_base ×0.85; theta ×1.15 (stress impairs retrieval); beta_episodic ×1.15 | cortisol impairs encode+retrieve (R§8) |
| **Poor sleep / insomnia** | sleepFactor → 0.7; enc_base ×0.9; drift_p ×1.2; **v0.6:** sleepFactor 0.7 < 0.75 → `sleepdep_flag` fires on most new records → permanently higher misinfo adoption on them (Frenda 2014 — the underslept are the gullible) | consolidation failure (R§2, R§8; false-memory.md §3) |
| **Highly social / gossip** | retell_boost ×1.3; w_people ×1.3; misinfo_suscept ×1.2 (hears everything twice); drift_p ×1.15; **v0.6:** rumor `hearCount` accumulates faster (more exposures per rumor — repetition, not variety, is the mechanism); rep_gain ×1.1 | rehearsal-rich, drift-rich memory (R§4, R§6 social contagion; illusory truth g≈0.37) |
| **Depressive / ruminative** | w_state ×1.5; neg_affect_decay ×0.7 (negative lingers — dysphoria disrupts FAB, Walker et al. 2003); add `specificity 0.4` → recall returns generic summaries ("I always mess up"); **v0.5:** `rumin_k 0.5` — retell_boost applies selectively to negative-valence records (valence-conditioned rehearsal); mood_bleed ×1.5; **v0.6:** imagine_gain ×1.5 on negative-valence scenarios only — rehearsed fears can flip into remembered ones via §6.9 | overgeneral memory, mood-congruence, negative rehearsal loop, feared→remembered drift (R§8; emotional-memory.md §8; Garry 1996) |
| **Domain expert** (per domain tag) | enc_base +0.1 for events matching domain cue; k_verbatim ×0.7 in-domain | expertise deepens encoding (R§8) |
| **Routine-heavy life** | merge_thresh ×0.9; interf_k ×1.3 | commutes blur together (R§3) |
| **Isolation / few retellings** | retell_boost ×0.6; memories fade without rehearsal | — |
| **High cognitive reserve** (education, complex work, social engagement) | reserve +0.2–0.4 → decline params read the curve ~4–10y younger (v0.4) | Stern 2002; Valenzuela & Sachdev 2006 (OR 0.54) |
| **Low engagement / isolated aging** | reserve −0.2 | earlier apparent decline |

Optional derived param `specificity ∈ [0,1]` (default 1): on reconstruction,
with probability `1−specificity` return the generic/merged memory instead of
the episode — use for the depressive profile.

## 3. Worked examples (plausible cast slots, placeholders until bibles land)

| Slot | Archetype | Modifiers | Character flavor |
|---|---|---|---|
| Landlord main, ~50s | D midlife | domain-expert (leases/people), high-stress | forgets your name, never forgets your payment history |
| Young tenant, ~24 | C young adult | poor-sleep (gig work), highly social | remembers every party vividly, half the details borrowed |
| Café regular, ~70 | E older | routine-heavy | "It was 1987, I'm certain of it" — it wasn't |
| Teen ambient | B teen | trauma (family) | encodes slights forever, tells a different story each time |
| Middle-aged shopkeeper | D midlife | domain-expert (customers), highly social | rumor amplifier: high retell_boost + high misinfo_suscept |

## 4. Diversity rule

No two characters share a parameter vector. **v0.7 supersedes the v0
jitter rule:** generate individual profiles as
`archetype ⊕ modifiers ⊕ trait projection ⊕ residual`, where traits are
sampled ~ MVN(0, R) (conditioned on any pinned traits from the bible),
projected through the loading table in `individual-differences.md` §3,
and residual = ±5% uniform per numeric param (re-clamped, down from
±10% — the trait layer supplies the structured variance). Two midlife
shopkeepers should still forget at different rates — but now the *kind*
of forgetting is coherent: the anxious one also ruminates and doubts
himself; the low-WMC one also misattributes sources and buys rumors.
Diversity of *weights*, not of *equations* — that is the model's
central hypothesis (R§11), now with the literature's correlational
structure inside it (Carroll 1993; Zhu et al. 2010).

## 5. Sanity checks for implementers

- Child vs. older adult given the same witnessed event → child's version
  drifts more per retelling; older adult's fades faster overall but keeps
  emotional tone.
- A rumor about an event a character witnessed should need `similarity>0.4`
  AND repeated tellings to overwrite a high-accuracy witnessed memory —
  single rumors rarely beat eyewitness traces (Loftus effect is real but
  bounded).
- Nobody's verbatim survives ~30+ game days intact except bump-era and
  trauma-core records.
