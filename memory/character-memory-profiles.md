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
| **Trauma history** | w_emo ×1.4; arousal_narrowing ×1.3; beta_source ×1.3; drift_p ×1.3 under stress; misinfo_suscept ×0.9 for the trauma topic only (hyperconsolidated core); intrusion_thresh −0.15 for threat-cued records (intrusive recall) | hyper-encoded threat core, fragmented context (R§5, R§8; RC§5) |
| **High-stress job / chronic stress** | enc_base ×0.85; theta ×1.15 (stress impairs retrieval); beta_episodic ×1.15 | cortisol impairs encode+retrieve (R§8) |
| **Poor sleep / insomnia** | sleepFactor → 0.7; enc_base ×0.9; drift_p ×1.2 | consolidation failure (R§2, R§8) |
| **Highly social / gossip** | retell_boost ×1.3; w_people ×1.3; misinfo_suscept ×1.2 (hears everything twice); drift_p ×1.15 | rehearsal-rich, drift-rich memory (R§4, R§6 social contagion) |
| **Depressive / ruminative** | w_state ×1.5; neg_affect_decay ×0.7 (negative lingers); add `specificity 0.4` → recall returns generic summaries ("I always mess up") | overgeneral memory, mood-congruence (R§8) |
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

No two characters share a parameter vector. Generate individual profiles as
`archetype ⊕ modifiers ⊕ jitter`, where jitter = ±10% uniform on each numeric
param (re-clamped). Two midlife shopkeepers should still forget at different
rates. Diversity of *weights*, not of *equations* — that is the model's
central hypothesis (R§11).

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
