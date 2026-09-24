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
| iiv_sigma | 0.0 | 0.12 | day-to-day performance noise σ; age/WMC-scaled (v1.9) |
| omit_p | 0.0 | 0.25 | routine-event encoding omission (v1.9) |
| lang_mismatch | 0.4 | 1.0 | cross-language cue attenuation; 1.0 = off (v1.9) |
| meta_cal | 0.5 | 1.5 | confidence calibration slope, report-side only (v1.9) |
| complaint_k | 0.0 | 0.4 | selfReport complaint noise (v1.9) |
| check_conf_loss | 0.0 | 0.25 | verify-mode confidence decrement (v1.9) |
| expert_lure | 0.0 | 0.25 | in-domain semantic-lure bonus (v1.9) |
| intox_encode_mult | 0.1 | 0.7 | E floor at intox=1; lower = harder hit (v1.9) |
| intox_state_dep | 0.0 | 0.15 | intox-match cue bonus (v1.9, DEBATED) |
| aging_rate | −1.5 | 1.5 | trait passthrough on age_eff slope (v1.9) |
| fitness | −1.5 | 1.5 | trait passthrough on age_eff offset (v1.9) |
| cand_base_str | 0.3 | 1.0 | misinfo candidate birth strength ×sourceCred (v1.8) |
| fab_inflate | 0.0 | 1.5 | claim→belief flip multiplier (v1.8) |
| forced_confab_gain | 0.0 | 0.6 | per-forced-answer confab strength (v1.8) |
| other_gen_gain | 1.0 | 2.5 | suggested > self-generated confabulation (v1.8) |
| press_gain | 0.0 | 0.8 | interrogative pressure compounding (v1.8) |
| evid_boost | 0.0 | 0.8 | perceptual-evidence plausibility lift (v1.8) |
| crypto_p | 0.0 | 0.3 | cryptomnesia flip rate; ×discrim_mult age (v1.8) |
| consist_pull | 0.0 | 0.5 | reconstruct toward current self (v1.8) |
| choice_support_gain | 0.0 | 0.5 | believed-choice feature bias; ×1.4@80 (v1.8) |
| cb_detect | 0.1 | 0.7 | outcome-swap detection rate (v1.8) |
| neg_gist_gain | 0.0 | 0.5 | negative-CONTENT distortion boost (v1.8) |
| negmood_verbatim_gain | 0.0 | 0.3 | negative-MOOD verbatim protection (v1.8) |
| prewarn_mult / inoc_mult / inoc_days | 0.4 / 0.4 / 0 | 1.0 / 1.0 / 60 | warning timing + inoculation decay (v1.8) |
| peak_hour | null/5 | 22 | circadian peak hour; null = flat (v0.7) |
| synchrony_gain | 0.0 | 0.15 | off-peak encode/θ penalty, age-scaled (v0.7) |
| vivid_detail | 0.3 | 1.0 | peripheral field write prob (v0.7) |
| conf_bias | −0.2 | 0.2 | trait confidence offset, accuracy-untouched (v0.7) |
| sti_prob / sti_gain | 0.2 / 0.05 | 0.9 / 0.4 | spontaneous trait inference rate/size (v0.8) |
| diag_moral_neg / diag_ability_pos | 1.0 / 1.0 | 2.5 / 2.0 | diagnosticity weights; moral-neg ≥ ability-pos (v0.8) |
| incongruity_gain | 0.0 | 0.5 | counter-trait behavior encoding bonus (v0.8) |
| next_in_line | 0.0 | 0.7 | attention loss while preparing own turn (v0.8) |
| oab_loss | 0.0 | 0.4 | other-age familiarity penalty, all ages (v0.8) |
| familiar/identity/name_thresh | 0.15/0.25/0.35 | 0.4/0.6/0.8 | cascade tiers; keep ascending (v0.8) |
| cheat_source_mult | 0.3 | 1.0 | β_source mult on cheater-linked records (v0.8) |
| audience_tune / shared_reality_gate | 0.0 / 0.2 | 0.2 / 0.8 | saying-is-believing drift / trust gate (v0.8) |
| ss_rif_k | 0.0 | 0.12 | listener-side RIF, ≤ rif_k (v0.8) |
| level_frac / si_dropoff / chain_sc_thresh | 0.1 / 0.4 / 2 | 0.6 / 1.0 / 7 | chain leveling + stereotype convergence (v0.8) |
| assimilation_gain / social_transmit_gain | 0.0 / 1.0 | 0.15 / 1.4 | gist schema pull / gossip bonus (v0.8) |
| collab_base / collab_size_pen / collab_friend_mult | 0.4 / 0.0 / 1.0 | 0.9 / 0.25 / 1.4 | group recall (v0.8, optional) |
| cred_step | 0.02 | 0.2 | credibility learning rate (v0.8) |
| mnemic_loss / mnemic_encode / mnemic_centrality | 0.0 / 0.0 / 0.4 | 0.35 / 0.5 / 0.8 | mnemic neglect (v0.8) |
| source_cat_share | 0.4 | 0.9 | in-category source-confusion share (v0.8) |
| enc_quota_per_day | 20 | 80 | soft cap on records reaching first sleep (v0.9) |
| cap_episodic / cap_archive / cap_persons | 1000 / 4000 / 30 | 4000 / 16000 / 120 | live/archive/person-model caps (v0.9) |
| ambient_tick_mult / ambient_cap | 2 / 75 | 7 / 300 | degraded-mode cadence + record cap (v0.9) |
| possess_alien | 0.0 | 0.4 | estrangement discount on possessed records (v0.9) |
| catchup_max | 3 | 14 | daily ticks replayed on resume before aggregation (v0.9) |
| s_gain | 0.15 | 0.6 | storage growth per difficult retrieval — spacing steepness (v0.9d) |
| tele_k | 0.0 | 0.3 | forward-telescoping rate; high = "recently" for old events (v0.9d) |
| date_sigma | 0.4 | 1.6 | dating noise scale — the timeline-muddle trait (v0.9d) |
| round_p | 0.2 | 0.8 | schema-unit rounding habit on dead `when` fields (v0.9d) |
| contiguity_gain | 0.0 | 0.4 | temporal-neighbor recall bonus — reminiscence cascader (v0.9d) |
| hindsight_k | 0.1 | 0.6 | prior-assimilation toward known outcome — told-you-so trait (v0.9d) |
| oc_gain | 0.0 | 0.6 | hard-easy overconfidence at report time (v0.9d) |
| metamem_r | 0.0 | 0.3 | felt↔actual memory correlation; humans ~0.1–0.2 (v1.0) |
| self_est_bias | 0.05 | 0.3 | σ of self-model noise — keeps self_est decorrelated (v1.0) |
| strategy_use | 0.0 | 1.0 | external-memory reliance (lists, transactive asks) (v1.0) |
| expert_gain | 0.0 | 0.15 | in-domain enc_base boost (v1.0; replaces flat +0.1) |
| expert_cost | 0.0 | 0.15 | out-of-domain link_p penalty — the Woollett bill (v1.0) |
| expert_bound | 0.7 | 1.0 | domain-boundary collapse fraction (v1.0) |
| open_loop_gain | 0.0 | 0.3 | intrusion/drive boost on open records (v1.0) |
| open_self_gate | 0.0 | 0.7 | selfRelevance floor for open tagging (v1.0) |
| elab_gain | 0.0 | 0.5 | deep/elaborative processing term (v1.2) |
| gen_gain | 0.0 | 0.4 | self-generated content bonus — the good talker (v1.2) |
| enact_gain | 0.0 | 0.5 | performed-action bonus; applied post-decline (v1.2) |
| prod_gain | 0.0 | 0.25 | said-aloud bonus, recognition-weighted (v1.2) |
| boundary_gain | 0.0 | 0.4 | event-boundary encoding bonus (v1.2) |
| boundary_order_loss | 0.0 | 0.8 | cross-boundary link/order penalty (v1.2) |
| doorway_drop | 0.0 | 0.4 | locShift R penalty; FLAT across age (v1.2) |
| lapse_p | 0.0 | 0.15 | stochastic attention-collapse rate (v1.2) |
| lapse_drop | 0.3 | 0.9 | attention multiplier during a lapse (v1.2) |
| da_encode_mult | 0.2 | 0.8 | divided-attention encoding damage (v1.2) |
| unitize_gain | 0.0 | 0.6 | coherent-unit link rescue (v1.2) |
| distinct_gain | 0.0 | 0.4 | within-context isolation bonus (v1.2) |
| concrete_gain | 0.0 | 0.3 | sensory/concrete content bonus (v1.2) |
| mood_cong_encode | 0.0 | 0.3 | mood-congruent elaboration bonus (v1.2) |
| s_gain_recall | 0.2 | 0.5 | S growth on effortful recall (v1.3) |
| s_gain_rehear | 0.05 | 0.2 | S growth on passive re-exposure (v1.3) |
| lag_opt_ratio | 0.05 | 0.3 | optimal retell gap / record age (v1.3) |
| lag_width | 0.6 | 1.6 | width of lag optimum (v1.3) |
| massed_retell_mult | 0.2 | 0.6 | same-conversation retell waste (v1.3) |
| potent_gain | 0.0 | 0.5 | failed-recall → re-encoding boost (v1.3) |
| pi_ref | 2 | 8 | n_sim at which PI saturates (v1.3) |
| amnesia_slope | 0.6 | 2.0 | childhood β ramp steepness (v1.3) |
| child_consol_base | 0.05 | 0.3 | childhood survival base rate (v1.3) |
| child_consol_gain | 0.3 | 0.9 | coherence → survival (v1.3) |
| suppress_theta | 0.03 | 0.15 | per-suppression θ bump (v1.3) |
| suppress_cap | 0.15 | 0.45 | cumulative suppression ceiling (v1.3) |
| retell_base | 0.005 | 0.04 | daily ecology retell draw (v1.3) |
| retell_social | 0.0 | 2.0 | shared-cue retell boost (v1.3) |
| beta_pm | 0.05 | 0.3 | armed intention decay (v1.3) |
| reminiscence_frac | 0.05 | 0.3 | per-attempt field resurfacing (v1.3) |
| beta_proc | 0.0 | 0.05 | procedural decay (~never) (v1.3) |
| tap_mismatch | 0.35 | 0.75 | ops-channel mismatch penalty (v1.4) |
| out_int | 0.7 | 0.95 | per-item bout loss; LOW = trails off fast (v1.4) |
| pm_focal_hit | 0.75 | 0.97 | focal event-cue fire rate (v1.4) |
| pm_monitor_p | 0.15 | 0.6 | nonfocal monitor roll (v1.4) |
| pm_clock_p | 0.04 | 0.2 | time-based clock-check rate (v1.4) |
| pm_time_age_loss | 0.1 | 0.6 | nonfocal/time PM age scaling (v1.4) |
| renewal_frac | 0.3 | 0.85 | context-switch affect renewal (v1.4) |
| tot_resolve_p | 0.15 | 0.5 | syllable-cue TOT resolution (v1.4) |
| tot_persist | 1.0 | 2.2 | TOT error-repetition multiplier (v1.4) |
| chain_gain | 0.15 | 0.8 | reminding-cascade strength (v1.4) |
| tmr_gain | 0.0 | 0.25 | sleep-context consolidation edge (v1.4) |
| ret_win_base | 1.5 | 6.0 | days/yr infant retention slope (v1.5) |
| latent_recall_p | 0.0 | 0.2 | latent reinstatement rate; keep small (v1.5) |
| reminiscence_env | 0.0 | 1.0 | bible dial; fixed at creation (v1.5) |
| strategy_exit | 9 | 15 | age of full elab/gen gains (v1.5) |
| scaffold_gain | 0.0 | 0.3 | guided-elaboration bypass (v1.5) |
| child_gist_mult | 0.4 | 1.0 | gist birth strength below age 8 (v1.5) |
| offtarget_p | 0.0 | 0.2 | bout intrusion rate at reference age (v1.5) |
| know_protect_age | 35 | 65 | knowledge-protection onset (v1.5) |
| know_protect_thresh | 0.3 | 0.7 | semantic strength = "known" (v1.5) |
| know_protect_mult | 0.2 | 0.8 | adoption mult vs known-contradicting claims (v1.5) |
| sws_child_peak | 1.0 | 1.4 | sws_mult child knot (v1.5) |
| nap_age_exit | 5 | 8 | nap mini-tick eligibility (v1.5) |
| nap_loss | 0.0 | 0.2 | missed-nap unrecoverable loss (v1.5) |
| bump_semantic_gain | 0.0 | 0.8 | bump on cultural semantic records (v1.5) |
| bump_cascade_gain | 0.0 | 0.6 | parents'-era secondary bump (v1.5) |
| child_internal_confuse | 1.0 | 3.0 | internal source-confusion mult <9 (v1.5) |
| child_trauma_off | 0.0 | 0.2 | trauma_thresh offset; HYPOTHESIS (v1.5) |
| tele_age_gain | 0.0 | 1.0 | telescoping age gradient (v1.5) |
| value_select | 0.0 | 0.7 | importance sharpening on E; age curve (v1.6) |
| positivity_gain | 0.0 | 0.5 | valence asymmetry encode/select; load-gated (v1.6) |
| hyperbind_p | 0.0 | 0.4 | wrong-context verbatim binding (v1.6) |
| dest_mem | 0.3 | 0.95 | toldTo hit rate; low = repeats stories (v1.6) |
| ctx_loss | 0.8 | 2.0 | context>content decay multiplier (v1.6) |
| conf_inflate_old | 0.0 | 0.25 | conf_out bump on wrong content; old-age (v1.6) |
| schema_support | 0.0 | 0.35 | prior-knowledge encoding scaffold (v1.6) |
| stereo_suscept | 0.0 | 1.0 | trait; evaluative-recall θ tax (v1.6) |
| collab_partner_gain | 0.0 | 0.35 | intimate-dyad facilitation (v1.6) |
| peak_w / end_w | 0.3 / 0.2 | 0.8 / 0.7 | tag weights; sum to 1; end_w +0.1@70 (v1.7) |
| emo_assoc_loss | 0.0 | 0.5 | item-context tradeoff ≥0.5 arousal (v1.7) |
| sleep_affect_strip | 0.0 | 0.12 | per-sleep arousal decay; DEBATED flag (v1.7) |
| regulate_style | 0.0 | 1.0 | trait: 0 suppressor → 1 reappraiser (v1.7) |
| reg_thresh | 0.4 | 0.8 | arousal where regulation engages (v1.7) |
| reg_suppress_cost | 0.0 | 0.4 | enc_base cost for suppressors (v1.7) |
| reg_reappraise_k | 0.0 | 0.5 | arousal-tag cooling, reappraisers (v1.7) |
| gen_width | 0.05 | 0.6 | conditioned-affect generalization width (v1.7) |
| reconsol_window | 0.1 | 0.5 | days; deep-extinction window (v1.7) |
| reconsol_extinct_gain | 1.0 | 6.0 | in-window safeCount gain (v1.7) |
| contagion_k | 0.1 | 0.8 | hearsay arousal transmission (v1.7) |
| verbal_dampen | 0.0 | 0.15 | per-social-retell arousal decay (v1.7) |
| fab_self_gate | 0.1 | 0.7 | selfRelevance floor for FAB (v1.7) |
| share_k | 0.3 | 1.5 | affect-driven sharing propensity (v2.0) |
| share_shame_pen | 0.0 | 0.9 | shame suppression on sharing (v2.0) |
| rif_facil_k | 0.0 | 0.10 | integrated-material facilitation (v2.0) |
| corroborate_conf | 0.05 | 0.3 | mutual-validation conf bump (v2.0) |
| disagree_conf | 0.0 | 0.25 | contradiction conf decrement; < corroborate (v2.0) |
| copresent_assume_p | 0.6 | 1.0 | copresence→assumed-knowledge (v2.0) |
| common_ground_conf | 0.5 | 0.95 | "would X know" confidence (v2.0) |
| interpret_bias / ambig_band | 0.0 / 0.1 | 0.6 / 0.5 | person-model assimilation of ambiguous acts (v2.0) |
| secret_tag_mult | 1.0 | 2.0 | confidentiality decay vs content (v2.0) |
| absorb_p | 0.0 | 0.08 | told_by→experienced flip; ×discrim_mult (v2.0) |
| canon_thresh | 3 | 9 | retell count to canonize (v2.0) |
| canon_drift_mult / canon_resist | 0.0 / 0.3 | 0.5 / 0.9 | post-canon drift cut + misinfo armor (v2.0) |
| joint_attn_gain / joint_affect_amp | 0.0 / 0.0 | 0.3 / 0.3 | co-attended encoding boost + symmetric affect amp (v2.0) |
| transact_loss | 0.0 | 0.3 | absent-partner θ penalty on directory topics (v2.0) |
| mig_bump_gain | 0.0 | 1.0 | immigration-window bump strength (v2.2) |
| attach_encode_loss | 0.0 | 0.5 | preemptive E loss, attachment:true records (v2.2) |
| attach_ret_cost | 0.0 | 0.4 | searchCost add on attachment records (v2.2) |
| self_share_pen | 0.0 | 0.9 | transmission cut on selfRelevance≥0.6 (v2.2) |
| secret_mindwander | 0.0 | 0.3 | confidential-record intrusion boost (v2.2) |
| abe_gain | 0.0 | 0.4 | detection-event encoding boost (v2.4) |
| abe_spill_mult | 0.0 | 1.0 | same-tick ambient spillover fraction (v2.4) |
| curios_gain | 0.0 | 0.5 | curiosity-state target encoding gain (v2.4) |
| curios_spill | 0.0 | 0.3 | incidental curiosity spillover (v2.4) |
| rest_gain | 0.0 | 0.3 | wakeful-rest consolidation shield (v2.4) |
| impl_intent_gain | 0.0 | 0.6 | if–then plan cue binding (v2.4) |
| teach_expect_gain | 0.0 | 0.5 | preparing-to-teach elaboration (v2.4) |
| name_penalty | 0.0 | 0.6 | unfamiliar-name birth thinning (v2.4) |
| owngroup_loss | 0.0 | 0.4 | other-group familiarity accrual cut (v2.4) |
| expert_encode_gain | 0.0 | 0.4 | in-domain encoding bonus (v2.4) |
| expert_detail_w | 1.0 | 1.5 | in-domain record width multiplier (v2.4) |
| df_loss | 0.0 | 0.6 | forget-instruction rehearsal cut (v2.4) |
| ev_time_w | 0.0 | 1.0 | event-load weight in decay age t_eff (v2.5) |
| ev_day_norm | 10 | 60 | typical daily encodes; ambients ~10 (v2.5) |
| affect_sleep_frac | 0.0 | 0.8 | valence-fade share run at the sleep tick (v2.5) |
| face_perma_thresh | 0.05 | 0.30 | familiar-face permastore bar (v2.5) |
| fam_recog_gate | 0.3 | 0.8 | familiarity gate for face permastore (v2.5) |
| transf_gain | 0.0 | 0.15 | verbatim-death → gist S boost (v2.5) |
| state_ctx_hl | 7 | 60 | internal-state cue drift half-life, days (v2.5) |
| diag_w | 0.0 | 0.9 | corpus-relative cue-weight blend (v2.6) |
| diag_cap | 1.0 | 3.0 | max diagnosticity multiplier (v2.6) |
| sam_tau | 1.0 | 4.0 | ratio-rule emission exponent (v2.6) |
| kmax | 1 | 6 | bout failure-stop, consecutive misses (v2.6) |
| reexp_ratio | 0.1 | 0.8 | re-exposure vs recall s_gain ratio (v2.6) |
| test_gap_gain | 0.0 | 0.6 | delay-gate on recall-leg s_gain (v2.6) |
| expanding_bonus | 1.0 | 1.5 | widening-gap retell multiplier (v2.6) |
| tnt_inhib | 0.0 | 0.06 | per-bout cue-independent inhibition (v2.6) |
| tnt_cap | 0.0 | 0.35 | inhibition ceiling (v2.6) |
| invol_periph_gain | 1.0 | 2.5 | ambient-scan sensory/peripheral weight (v2.6) |
| invol_topic_pen | 0.4 | 1.0 | ambient-scan abstract-cue discount (v2.6) |
| intent_sup | 0.0 | 0.25 | armed-intention drive bonus (v2.6) |
| monitor_cost | 0.0 | 0.10 | θ tax per armed nonfocal intention (v2.6) |
| pm_commission_p | 0.0 | 0.5 | completed-intention refire base (v2.6) |
| pm_commission_hl | 0.5 | 5.0 | refire half-life, days (v2.6) |
| selfinit_pen | 0.0 | 0.20 | sparse-cue θ tax × ageScale (v2.6) |
| selfinit_bar | 0.1 | 0.5 | sparse-cue regime boundary (v2.6) |
| ease_n | 2 | 7 | ease-of-retrieval inversion point (v2.6) |
| first_gain | 0.0 | 0.5 | E bonus on first:true events (v2.7) |
| transition_gain | 0.0 | 0.8 | E bonus inside transition windows (v2.7) |
| pi_child_mult | 1.0 | 1.8 | child PI accrual multiplier (v2.7) |
| adolesc_sleep_loss | 1.0 | 1.6 | teen sleepdep encode penalty × (v2.7) |
| social_eval_gain | 0.0 | 0.5 | peer-evaluation E bonus, teen-knotted (v2.7) |
| coruminate_gain | 0.0 | 2.0 | extra neg-valence retell draw, close peer (v2.7) |
| narr_coh_gain | 0.0 | 0.3 | gist S on narr_window retells (v2.7) |
| narr_link_gain | 0.0 | 0.4 | cross-era link bonus, narr_window (v2.7) |
| script_date_pull | 0.0 | 0.6 | script_age dating pull (v2.7) |
| pm_interrupt_mult | 1.0 | 2.0 | child PM interruption cost (v2.7) |
| pm_scaffold_gain | 0.0 | 0.4 | caregiver co-present PM bonus (v2.7) |
| preg_theta_up | 0.0 | 0.20 | θ lift, preg overlay (v2.7) |
| preg_enc_loss | 0.0 | 0.15 | enc_base cut, preg overlay (v2.7) |
| preg_pm_loss | 0.0 | 0.4 | nonfocal-PM penalty, preg overlay (v2.7) |
| perim_enc_loss | 0.0 | 0.15 | enc_base cut, perim overlay (v2.7) |
| perim_s_gain_mult | 0.0 | 0.5 | practice-gain mult, perim overlay (v2.7) |
| perim_years | 2 | 8 | overlay duration (v2.7) |
| pm_habit_gain | 0.0 | 0.5 | repeated-cue-class PM rescue (v2.8) |
| ii_age_gate | 0.0 | 1.6 | impl-intent benefit gate, curve param (v2.8) |
| sync_lure_gain | 0.0 | 1.5 | antipeak lure multiplier (v2.8) |
| potent_window | 0.5 | 5.0 | days; feedback gate on potent_gain (v2.8) |
| know_corr_gain | 0.0 | 1.0 | knowledge-density × w_corr (v2.8) |
| rm_self_confuse | 0.0 | 0.3 | imagined↔done flip base (v2.8) |
| hearing | 0.3 | 1.0 | trait; age-correlated mean drift (v2.8) |
| noise_cost | 0.0 | 0.7 | max verbal-E cut in noise (v2.8) |
| invol_pos_gain | 0.0 | 0.3 | ambient-scan positive bias (v2.8) |
| invol_remote_gain | 0.0 | 0.4 | ambient-scan remote prior (v2.8) |
| enc_sem_mult | 0.8 | 1.15 | semantic encoding bump 45–60 (v2.8) |
| iso_floor | 0.5 | 4.0 | contacts/day isolation ledger floor (v2.8) |
| iso_onset | 10 | 90 | days below floor → overlay on (v2.8) |
| iso_beta | 0.0 | 0.3 | β_episodic lift under isolation (v2.8) |
| iso_recovery | 20 | 180 | days to heal after contact resumes (v2.8) |
| med_theta_up | 0.0 | 0.15 | θ lift, med_antichol overlay (v2.8) |
| med_enc_loss | 0.0 | 0.15 | enc_base cut, med_antichol overlay (v2.8) |
| fear_detail_gain | 0.0 | 0.4 | fear → extra veridicality (v2.9) |
| anger_gist_bias | 0.0 | 0.4 | anger → gist/heuristic lean (v2.9) |
| disgust_gain | 0.0 | 0.4 | disgust cond-speed/extinct-resist (v2.9) |
| arousal_opt | 0.4 | 0.9 | inverted-U peak, assoc fields (v2.9) |
| arousal_curv | 0.0 | 2.0 | quadratic downturn past optimum (v2.9) |
| emo_update_k | 0.0 | 0.5 | outcome-appraisal valence rewrite (v2.9) |
| odor_cue_gain | 1.0 | 2.5 | smell-cue drive multiplier (v2.9) |
| odor_emo_gain | 0.0 | 0.4 | smell-cued reported-arousal bonus (v2.9) |
| odor_age_relief | 0.0 | 1.0 | smell recency-term relief (v2.9) |
| anniv_gain | 0.0 | 0.5 | date-match intrusion drive (v2.9) |
| anniv_window | 3 | 45 | days ± around day-of-year (v2.9) |
| anniv_thresh | 0.3 | 0.9 | arousal floor for date-cued records (v2.9) |
| trust_neg_gain | 0.2 | 0.9 | person-cue neg acquisition (v2.9) |
| trust_pos_gain | 0.05 | 0.6 | person-cue pos acquisition; ≤ trust_neg (v2.9) |
| person_cond_decay_mult | 0.2 | 1.0 | person entries decay slower (v2.9) |
| coh_gain | 0.0 | 0.15 | coherence per structured retell (v2.9) |
| coh_intrusion_k | 0.0 | 1.0 | coherence→intrusion scaling (v2.9) |
| coh_strip_gate | 0.3 | 0.8 | coherence needed for trauma strip (v2.9) |
| wf_gain | 0.0 | 1.0 | threat-object field boost (v2.9) |
| wf_loss | 0.0 | 0.6 | central-field capture cost (v2.9) |
| recall_mood_pull | 0.0 | 0.15 | retrieved valence nudges mood (v2.9) |
| nostalgia_gain | 0.0 | 0.3 | restorative pull, qualifying records (v2.9) |
| hc_gap_loss | 0.0 | 0.6 | cold-state arousal-report compression (v2.9) |
| hc_gap_thresh | 0.2 | 0.9 | mood−valence mismatch gate (v2.9) |
| vo_cand | 0.2 | 0.8 | description candidate strength (v3.0, §6.25) |
| vo_loss | 0.0 | 0.4 | nonverbal verbatim cost per describe (v3.0) |
| transplant_gain | 0.0 | 0.3 | familiar-person slot-fill rate (v3.0) |
| orb_gain | 0.0 | 1.0 | outgroup-category amplifier (v3.0) |
| cat_resist | 0.1 | 0.8 | cross-category transplant resistance (v3.0) |
| conj_thresh | 0.4 | 0.9 | episode-pair migration gate (v3.0) |
| conj_migrate_p | 0.0 | 0.2 | per-field cross-episode migration (v3.0) |
| be_gain | 0.0 | 0.3 | boundary-extension encode overshoot (v3.0) |
| neg_cand | 0.1 | 0.7 | affirmed-core candidate from denial (v3.0) |
| neg_frame_mult | 1.0 | 4.0 | denial-frame decay multiplier (v3.0) |
| neg_age_gain | 0.0 | 1.0 | old-age denial amplifier >65 (v3.0) |
| react_window | 0.1 | 2.0 | days; post-recall susceptibility (v3.0) |
| react_suscept_mult | 1.0 | 2.0 | p_adopt boost inside window (v3.0) |
| phantom_recoll | 0.0 | 0.7 | vivid-gate crossing prob (v3.0) |
| group_damp | 0.5 | 1.0 | per-extra-discussant damping (v3.0) |
| truthy_gain | 0.0 | 0.3 | nonprobative dressing corroboration (v3.0) |
| fam_gain | 0.0 | 0.7 | face_ability→familiarity accrual (v3.1) |
| fam_thresh_off | 0.0 | 0.06 | face_ability→tier-1 offset (v3.1) |
| name_fan_k | 0.0 | 0.06 | tier-3 directory-size cost (v3.1) |
| hyperfocus_gate | 0.0 | 1.0 | adhd interest-inversion (v3.1, HYPOTHESIS) |
| asd_gist_pen | 0.0 | 0.3 | asd phantom/lure suppression (v3.1) |
| asd_verbatim_gain | 0.0 | 0.2 | asd verbatim-survival (v3.1) |
| asd_spec_loss | 0.0 | 0.2 | asd self-cued OGM (v3.1) |
| asd_src_gain | 0.0 | 0.15 | asd source-confusion (v3.1) |
| suggs_yield | 0.0 | 0.12 | GSS Yield→misinfo (v3.1) |
| suggs_shift | 0.0 | 0.16 | GSS Shift→report-flip (v3.1) |
| vigil_social_gain | 0.0 | 0.3 | social-threat encode gain (v3.1) |
| vigil_recall_bias | 0.0 | 0.1 | threat recall-mode drive (v3.1) |
| aim_emo_gain | 0.0 | 0.2 | affective-only w_emo load (v3.1) |
| aim_link_gain | 0.0 | 0.1 | affective-only link load (v3.1) |
| handmix_ret_gain | 0.0 | 0.03 | retrieval-only θ offset (v3.1) |
| meno_learn_pen | 0.0 | 0.3 | meno practice-gain flattening (v3.1) |
| preg_trim3_mult | 0.7 | 1.0 | trimester-3 E multiplier (v3.1) |
| cann_misinfo_gain | 0.0 | 0.4 | acute cannabis misinfo add (v3.1) |
| cann_lure_gain | 0.0 | 0.3 | acute cannabis lure add (v3.1) |
| moral_primacy | 0.4 | 0.85 | moral share of PersonModel.eval (v3.2) |
| moral_rehab | 0.0 | 0.8 | moral-dim counter-evidence weight; low = unforgiving (v3.2) |
| sit_credit / correct_gate | 0.3 / 0.3 | 1.0 / 0.9 | FAE correction strength / attention gate (v3.2) |
| status_encode_gain | 0.0 | 0.4 | remember-up encoding asymmetry (v3.2) |
| power_encode_loss | 0.0 | 0.5 | stereotype-down STI discount (v3.2) |
| dest_decay_mult / dest_fa | 1.0 / 0.0 | 2.5 / 0.2 | toldTo edge decay / false "already told" (v3.2) |
| exposure_fam_gain | 0.0 | 0.08 | ambient familiarity accrual per sighting (v3.2) |
| heard_update_w | 0.1 | 0.8 | gossip trait-writeback weight; < witnessed (v3.2) |
| disclose_eval_gain / disclose_trust_gain | 0.0 / 0.0 | 0.25 / 0.3 | disclosure→eval / disclosure→credibility (v3.2) |
| individ_rate / cat_prior_pull | 0.05 / 0.0 | 0.4 / 1.0 | individuation rate / category-schema weight (v3.2) |
| transference_thresh / transference_seed / transference_fill / transference_pool | 0.4 / 0.0 / 0.0 / 2 | 0.9 / 0.6 / 0.4 / 10 | schema projection onto new persons (v3.2) |
| novel_pick_w / told_pen | 1.0 / 0.1 | 6.0 / 1.0 | retell novelty gate / repeat-tell penalty (v3.2) |
| phrase_surv_base / phrase_distinct_mult | 0.3 / 1.0 | 1.0 / 2.5 | phrasing hop survival / distinctive boost (v3.2) |
| doubt_persist | 3 | 180 | days a retraction holds "doubted"; high = can't unhear it (v3.3) |
| selfdef_cap | 2 | 10 | max anchor records (v3.4) |
| selfdef_floor | 0.05 | 0.3 | strength below which anchors never archive (v3.4) |
| selfdef_drift_mult | 0.2 | 0.8 | anchor core-field drift multiplier (v3.4) |
| selfdef_cue_gain | 0.0 | 0.25 | anchor warm-bias on recall drive (v3.4) |
| selfdef_spec_mult | 0.4 | 1.2 | anchor field richness; <1 under defensiveness (v3.4) |
| mnem_neg | 0.0 | 0.5 | self-threat recall penalty; recall-only (v3.4) |
| mnem_central_thresh / mnem_diag_thresh | 0.4 / 0.4 | 0.9 / 0.9 | centrality / diagnosticity gates (v3.4) |
| mnem_close_relief | 0.0 | 1.0 | close-source/improvement relief strength (v3.4) |
| script_redeem | −0.8 | 0.9 | − contamination, + redemption (v3.4) |
| redeem_write | 0.0 | 0.35 | per-retell meaning-overwrite rate (v3.4) |
| neg_now_pull | 0.0 | 0.35 | negative-record forward misdating (v3.4) |
| script_age_pull | 0.0 | 0.5 | normative-age pull on lifescript records (v3.4) |
| invol_pos_bias | 0.0 | 0.5 | positive share boost, involuntary scan (v3.4) |
| ambient_cap_mult / ambient_trait_sigma | 0.2 / 0.15 | 0.7 / 0.5 | ambient tier: cap / trait band (v3.4) |
| load_att_raise / load_periph_supp | 0 / 0 | 2.0 / 0.8 | perceptual-load scene filter (v3.5) |
| load_spill / load_lapse_relief | 0 / 0 | 0.5 / 1.0 | low-load spillover; absorbed-task lapse relief (v3.5) |
| wm_cap / cap_spill | 3 / 0 | 5 / 1.0 | chunk bound + overflow write rate (v3.5) |
| residue_load / residue_decay | 0 / 0.2 | 0.6 / 0.8 | post-boundary residual drain (v3.5) |
| next_inline_cost | 0 | 0.7 | turn-anticipation encoding hit (v3.5) |
| pending_intrude / pending_cue_gain | 0 / 0 | 0.1 / 0.4 | open-loop tonic + cue heating (v3.5) |
| intent_done_decay | 1.0 | 2.0 | completed-intention β mult (v3.5) |
| offload_cost / offload_where_gain | 0 / 0 | 0.5 / 0.6 | hollow records / pointer strength (v3.5) |
| threat_capture / threat_drain | 0 / 0 | 0.5 / 0.7 | threat priority + neutral drain (v3.5) |
| pre_sleep_gain | 0 | 0.3 | last-hours-of-day consolidation shield (v3.5) |
| ctx_var_add | 0 | 4 | new-context cue fields on re-activation (v3.5) |
| trans_win / trans_bound_gain | 3 / 0 | 30 / 0.5 | transition window + boundary E boost (v3.6) |
| xperiod_pen / period_prime | 0 / 0 | 0.4 / 0.3 | cross-period penalty / same-period prime (v3.6) |
| bump_pos_min | 0.05 | 0.4 | valence gate for ALL bump windows (v3.6) |
| retro_window / retro_loss | 0.005 / 0 | 0.1 / 0.9 | Ribot graded hit, days (v3.6) |
| pta_window / pta_loss | 0.005 / 0 | 0.1 / 0.8 | post-trauma encode fog (v3.6) |
| rest_s_gain | 0 | 0.3 | S-side wakeful-rest bump (v3.6) |
| k_olf / k_vis / k_verb / k_aud | 0.3 / 0.5 / 0.5 / 0.5 | 1.0 / 1.5 / 2.0 / 1.5 | verbatim modality slopes (v3.6) |
| olf_cue_gain | 1.0 | 2.0 | olfactory scan cue gain (v3.6) |
| intrude_hl | 1 | 365 | intrusion half-life days; ∞ via ptsd mod (v3.6) |
| trauma_bonus | 0 | 3.0 | intrude_w birth multiplier on trauma (v3.6) |
| lat_base / lat_pow / lat_search / lat_cap | 100 / 0.1 / 0 / 2000 | 1000 / 1.2 / 1.0 / 10000 | latency channel, ms (v3.6) |
| pa_gain / pa_cap | 0 / 1.0 | 0.8 / 5.0 | preferential-attachment retell (v3.6) |
| aff_recon_scale | 0.5 | 5.0 | affect-report appraisal blend (v3.6) |
| bilingual_bal | 0 | 1.0 | lang_mismatch attenuation (v3.6) |
| selfcue_mult | 1.0 | 2.2 | self-origin cue weight multiplier (v3.7) |
| da_ret_pen / da_breadth_pen / lat_da_mult | 0 / 0 / 0 | 0.15 / 0.6 / 1.5 | retrieval-time DA taxes (v3.7) |
| da_monitor_pen | 0 | 0.9 | PM/intention monitor DA tax (v3.7) |
| stress_lag_min / stress_off_min | 0 / 30 | 60 / 240 | cortisol window edges, sim-min (v3.7) |
| stress_emo_mult | 0 | 1.0 | valence weight on retrieval stress loss (v3.7) |
| fwd_win / fwd_test_gain / fwd_pi_release | 0 / 0 / 0.5 | 0.15 / 0.3 / 1.0 | forward-testing window (v3.7) |
| repair_mood_bar / repair_p / repair_gain / repair_mood_gain | -0.5 / 0 / 0 / 0 | 0 / 1.0 / 0.4 / 0.15 | mood-repair search mode (v3.7) |
| fam_bar / deja_prop | 0.2 / 0 | 0.8 / 0.8 | familiar_only gate / deja-vu awareness (v3.7) |
| ssrif_out_mult | 0 | 1.0 | out-group speaker SSRIF scale (v3.7) |
| pm_action_p / pm_vague_win | 0.5 / 0 | 1.0 / 1.0 | PM action recall + vague window (v3.7) |
| boundary_cue_drop / doorway_pen / post_boundary_win / boundary_hit | 0 / 0 / 0 / 0 | 0.8 / 0.5 / 0.1 / 0.2 | doorway/boundary drop (v3.7) |
| iso_first | 0 | 0.3 | isolated-record bout-first bonus (v3.7) |
| verbal_lock_thresh | 0.2 | 0.9 | preverbal-record verbal-output gate (v3.8) |
| script_default_age / sort_window | 5 / 1 | 12 / 8 | child script-report age cutoff / assimilation window (v3.8) |
| script_intrusion_p / assim_p | 0 / 0 | 0.6 / 0.8 | modal-filler intrusion / in-window deviation loss (v3.8) |
| schema_assim_p / schema_viol_loss / schema_flip_age | 0 / 0 / 6 | 0.5 / 0.4 / 14 | child schema-normalization channel (v3.8) |
| choose_p / seq_choose_gain / showup_mult | 0 / 1.0 / 1.0 | 1.0 / 2.0 / 2.5 | forced-pick refusal channel (v3.8) |
| suggest_repeat_mult / neutral_inoc / stereo_prime / embellish_p / taint_exit | 1.0 / 0.7 / 1.0 / 0 / 6 | 2.0 / 1.0 / 2.0 / 0.7 / 12 | child interview sign-split (v3.8) |
| date_loc_exit / child_date_mult / cyclic_acc | 5 / 1.0 / 0.3 | 12 / 8 / 1.0 | child dating mode (v3.8) |
| stress_flip_age / child_stress_gain / child_stress_inoc | 5 / 0 / 0.5 | 12 / 0.3 / 1.0 | child stress inversion (v3.8) |
| sem_accrual | 0.5 | 2.5 | crystallized growth rate (midlife knots, v3.8) |
| implicit_decline | 1.0 | 1.5 | ×impl_decay_mult; ~0.3× explicit aging (v3.9) |
| sim_detail_mult / recast_p | 0.4 / 0 | 1.2 / 0.6 | future-simulation richness / single-record recast (v3.9) |
| pm_deactivate / comm_habit_gain | 0.5 / 0 | 1.0 / 0.3 | completed-intention suppression / repetition boost (v3.9) |
| ctx_flux_mult | 0.5 | 1.2 | context-drift rate; <1 denser same-day pool (v3.9) |
| offload_pref / offload_bias / offload_select | 0.5 / 0.3 / 0 | 2.0 / 1.2 / 1.0 | reminder use / benefit-pricing / value selectivity (v3.9) |
| own_age_gain | 0 | 0.3 | same-ageBand d′ gain, criterion untouched (v3.9) |
| update_resist | 0 | 0.5 | superseded-version leak-back rate (v3.9) |
| fame_fluency | 0 | 0.3 | sourceless-fluency→prominence attribution (v3.9) |
| sem_search_tax / lat_age_mult | 0 / 1.0 | 0.12 / 2.0 | semantic-list θ tax / latency age scale (v3.9) |
| carry_frac / carry_tau / misattrib_k | 0.1 / 0.005 / 0.1 | 0.6 / 0.04 / 0.7 | excitation carryover: residue share, half-life days, next-event leak (v4.0) |
| misattr_rot_k / attrib_rescue | 0 / 0 | 0.4 / 0.8 | valence rotation on ambiguous next events / named-source discount (v4.0) |
| aud_status_mult / aud_tune_arous | 0 | 1.0 / 1.0 | status-inversion of tuning / arousal co-drift share (v4.0) |
| savor_gain / savor_thresh / dampen_mult | 0 / 0.2 / 0 | 0.5 / 0.6 / 1.0 | positive-regulation pair (v4.0) |
| savor / dampen (traits) | 0 | 1 | bible-set IndivTraits-adjacent (v4.0) |
| secure_trust / secure_damp | 0.5 / 0 | 0.9 / 0.5 | co-present trust gate / tag damp (v4.0) |
| dur_dil | 0 | 0.8 | verbatim.duration birth dilation (v4.0) |
| tdist_val / tdist_self | 0 | 0.6 / 1.0 | subjective-distance valence/self-esteem terms, report-only (v4.0) |
| w_emo_arous / w_emo_dist | 0.1 | 1.4 / 0.8 | w_emo split; sum must stay in w_emo clamp (v4.0) |
| emo_sex_gain | 0 | 0.15 | female multiplier on arousal-channel terms; keep below jitter (v4.0) |
| emo_gran / gran_thresh | 0 / 0.2 | 1.0 / 0.6 | discrete-tag precision trait / "mixed" mint gate (v4.0) |
| forecast_int_bias / forecast_dur_bias | 1.0 | 1.5 / 2.5 | impact bias on imagineEvent outputs; ≥1.0 always (v4.0) |
| cue_music_w / music_era_gain | 0.1 / 0 | 0.7 / 3.0 | jukebox cue weight / bump-era multiplier (v4.0) |
| pos_spec_loss | 0 | 0.35 | depr positive-cued OGM prob; gated by depr_state (v4.2) |
| neg_ogm | 0 | 0.30 | ptsd negative-cued generic responding (v4.2) |
| trauma_sens_intr | 0 | 0.25 | sensory-gated intrusion cut on threat records (v4.2) |
| frag_p | 0 | 0.5 | trauma record fragmentation at birth (v4.2) |
| avoid_suppress | 0 | 0.35 | effortful theta surcharge, threat/attach-neg (v4.2) |
| depl_release | 0 | 0.6 | depleted-state release of suppression (v4.2) |
| attach_field_loss | 0 | 0.35 | vivid_detail cut on attach:true, both valences (v4.2) |
| persp_age_gain / persp_affect_loss | 0 / 0 | 0.4 / 0.5 | observer shift by record age / observer affect damp (v4.2) |
| supp_enc_cost | 0 | 0.30 | suppressing → social-field E tax (v4.2) |
| search_cost_mult | 0.6 | 1.6 | pspeed's only target — latency, never hit-rate (v4.2) |
| mind_lure / mind_rm_loss | 0 / 0 | 0.25 / 0.25 | mindfulness lure + reality-monitoring cost, sign + locked (v4.2) |
| scc_consist_gain | 0 | 0.8 | low-scc consistency-pull amplification, self records only (v4.2) |
| smoker_pm_loss / nic_dep_pm | 0 / 0 | 0.25 / 0.35 | objective PM deficit (self-report blind) / deprivation cut (v4.2) |
| caff_consol_gain | 0 | 0.2 | post-encoding caffeine → next-day lure discrimination only (v4.2) |
| depr / ptsd / attach_anx / attach_avoid / persp_obs / supp / reap / pspeed / mindful / scc / smoker | −2 or 0 | +2 or 1 | new IndivTraits; depr/ptsd/smoker 0..1 pinned, rest N(0,1); reap is a NULL trait (v4.2) |
| stt_gain / stt_stigma | 0 / 0 | 0.15 / 0.25 | messenger smear + gossip stigma, listener-local (v4.3) |
| fam_permastore_exp / fam_permastore_mult | 20 / 0.1 | 200 / 0.5 | Bahrick exposure gate + decay floor (v4.3) |
| edge_sym_p | 0.3 | 1.0 | sentiment-edge symmetry assumption (v4.3) |
| balance_pull / balance_flip_p | 0 / 0 | 0.2 / 0.3 | unbalanced-triad decay tax / retrieval flips (v4.3) |
| own_share_bias / blame_deflect | 0 / 0.3 | 0.5 / 1.0 | >100% dyads; blame arm reverses (v4.3) |
| same_source_pen / voices_k | 0.4 / 2 | 1.0 / 10 | one repeater ≈ chorus; consensus scale (v4.3) |
| retell_conf_gain / retell_conf_cap | 0 / 0.8 | 0.1 / 1.0 | telling inflates certainty, never accuracy (v4.3) |
| conform_gate / conform_norm_p | 0.2 / 0 | 0.7 / 0.7 | informational↔normative switch (v4.3) |
| gossip_neg_gain / gossip_known_w | 1.0 / 0.1 | 2.0 / 1.0 | scandal tell-selection; shared-referent gate (v4.3) |
| discredit_mult | 1.0 | 2.0 | sleeper effect — discount decays faster than claim (v4.3) |
| pep_k / pep_days / pep_neg_drift | 0 / 2 / 0 | 0.5 / 30 / 0.1 | post-event processing; neurot·supp gated (v4.3) |
| partner_eval_pull | 0 | 0.4 | current eval repaints partner history (v4.3) |
| overhear_w / overhear_person_gain | 0.2 / 1.0 | 0.8 / 1.6 | eavesdropped encoding, person-content bonus (v4.3) |
| chrono_peak_hr | 5 | 23 | compiled from routine wake + chronotype; null allowed = flat (v4.5) |
| sync_gain / sync_implicit_flip / sync_age_gain | 0 / 0 / 0 | 0.3 / 0.3 / 0.6 | circadian encoding+retrieval match; off-peak implicit bonus; age knot (v4.5) |
| func_self / func_dir / func_soc | 0 | 1 | TALE selection weights, sum-normalized at use (v4.5) |
| concern_gain / concern_intrude | 0 / 0 | 0.6 / 0.25 | wants-gate encoding boost / concern-tag intrusion (v4.5) |
| fab_dir / fab_discomfort / fab_deflate_gain | −1 / 0 / 0 | +1 / 1.0 / 0.15 | liar direction, discomfort gate, truth-strengthening (v4.5) |
| collab_inhib / collab_cue_p | 0 / 0.2 | 0.3 / 0.9 | joint-recall tax / partner-cue rescue (v4.5) |
| field_upd_min / animacy_upd_gain | 0.15 / 0 | 0.6 / 0.3 | stale-field gate; animate-change relief (v4.6) |
| ownname_break_p / ownname_wmc_slope / ownname_tail | 0.1 / −0.3 / 0 | 0.6 / 0 / 4 | self-mention pierces att_min; wmc sign locked (v4.6) |
| humor_gain / humor_retr_gain | 0 / 0 | 0.3 / 0.15 | attended humor E bump + privileged retrieval (v4.6) |
| animacy_gain | 0 | 0.25 | animate content bump + context piggyback (v4.6) |
| incongr_elab / congr_gain | 0 / 0 | 0.4 / 0.15 | expectancy sign flip at impress_strong_thresh (v4.6) |
| impress_primacy / impress_recency_p | 0 / 0 | 0.5 / 0.4 | first-evidence weight; depleted recency arm (v4.6) |
| motiv_narrow | 0 | 0.4 | high-approach positive narrowing (v4.6) |
| lie_enc_gain / lie_src_weak | 0 / 0 | 0.3 / 0.5 | deceptive-effort encode + weak source tag (v4.6) |
| note_gen_gain | 0 | 0.25 | generative-note elaboration; verbatim null (v4.6) |
| ps_gate / ps_recount / ps_transf | 0.3 / 1 / 0.2 | 0.8 / 5 / 0.9 | personal-semantics mint thresholds (v4.7) |
| rk_thresh | 0.15 | 0.5 | remember↔know report gate (v4.7) |
| fam_interf_mult / recol_interf_mult | 0.8 / 0.3 | 2.0 / 1.5 | channel interference asymmetry, DEBATED (v4.7) |
| order_sigma / order_decay / order_script_p | 0.15 / 0.5 / 0.3 | 0.8 / 3.0 / 0.8 | orderRecall reconstruction (v4.7) |
| dream_mint / tau_dream / beta_dream | 0 / 0.001 / 0.5 | 4 / 0.02 / 2.0 | dream class; dream_mint 0 = dreamless (v4.7) |
| dream_recall_p / dream_cond_mult | 0.02 / 0 | 0.5 / 0.8 | wake-gate base rate × dreamRecall; affect residue (v4.7) |
| beta_proc_cont / beta_proc_cog / skill_overlearn | 0 / 0.05 / 0.2 | 0.1 / 0.4 / 0.8 | skill split — cog skills DO decay (v4.7) |
| cueBind_init / pm_sleep_gain | 0.1 / 0 | 0.8 / 0.5 | intention cue-bind + sleep consolidation (v4.7) |
| beta_pm_fired | 0.2 | 1.5 | post-resolution intention decay (v4.7) |
| transg_vivid_mult | 1.0 | 2.0 | own-violation vividness decay; accuracy locked null (v4.7) |
| vis_fam_floor | 0.0 | 0.3 | Standing recognition bound on visual records (v4.7) |
| impl_bind_gain / impl_focal_lift / impl_cost_mult | 1.0 / 0 / 0 | 2.0 / 0.5 / 0.8 | if-then plan legs (v4.8) |
| name_sem_gap | 0.0 | 0.2 | Baker-paradox tier-3 penalty (v4.8) |
| enact_selfcue / enact_recall_gain | 0.8 / 1.0 | 2.0 / 1.4 | motor self-cue legs (v4.8) |
| gen_direct_bar | 0.5 | 0.9 | direct-retrieval gate (v4.8) |
| hier_descent_p | 0.3 | 0.9 | generative descent per level; own age knot (v4.8) |
| lifecue_gain | 0.0 | 0.3 | milestone drive on life queries (v4.8) |
| hyper_gap / hyper_gain | 0.2 / 1.0 | 1.5 / 2.0 | spaced-bout reminiscence legs (v4.8) |
| crosscue_far / crosscue_close / crosscue_close_bar | 0.1 / 0.5 / 0.5 | 0.7 / 1.2 / 0.9 | partner-cue legs; close < selfcue_mult (v4.8) |
| crosscue_emergent_p | 0.0 | 0.1 | emergent-memory cap — keep near null (v4.8) |
| sdr_gain | 0.0 | 0.2 | pharm-state match leg; recognition-null locked (v4.8) |
| arousal_cue_hi / arousal_cue_narrow / arousal_dom_gain | 0.5 / 0.3 / 0 | 0.9 / 0.9 / 0.3 | retrieval-side narrowing (v4.8) |
| tot_age_k / tot_res_age_loss / tot_alt_age_loss | 0 / 0 / 0 | 1.5 / 0.8 / 0.9 | TOT age legs (v4.8) |
| df_pen / df_rehearse_pen | 0.0 / 0.3 | 0.2 / 0.9 | directed-forget soft legs (v4.8) |
| planStyle | 0.0 | 1.0 | bible trait — spontaneous if-then planning (v4.8) |
| school_leak / coherent_leak_rescue | 0.0 / 0.0 | 1.0 / 0.8 | school-age β tail legs (v4.9) |
| l1_lock / l1_emo_gain | 0.0 / 0.0 | 0.8 / 0.25 | era-depth language legs (v4.9) |
| pub_emo_gain / pub_theta / pub_stress_gain | 0.0 / 0.0 / 0.0 | 0.3 / 0.15 / 0.3 | puberty overlay legs (v4.9) |
| epochal_gain / chapter_tell | 1.0 / 0.0 | 1.8 / 0.25 | cohort-imprint legs (v4.9) |
| anchor_query_gain / earliest_tele_gain / earliest_stab | 0.0 / 0.0 / 6 | 0.7 / 2.5 / 12 | query-landmark / postdate / earliest-stability (v4.9) |
| culture_env | 0.0 | 1.0 | bible prior on reminiscence_env (v4.9) |
| culture_exit_off | −0.5 | +0.5 | residual amnesia-exit offset yrs (v4.9) |
| auto_style | — | — | enum {self_focused, relational} (v4.9) |
| detail_emit_gain | 0.8 | 1.2 | report-detail density (v4.9; female +0.1) |
| l1_until | 0 | — | bilingual ambient-switch encodeAge (v4.9; absent = monolingual) |
| pub_timing | −2 | +2 | bible puberty-onset offset yrs (v4.9) |
| adh_bind_tax / namepair_tax | 1.0 / 1.0 | 1.9 / 1.5 | link-write tax, intent-gated (v5.0; knots drive — per-char floor is 1.0) |
| meaningful_link_rescue | 0.0 | 0.5 | semantic-tag tax relief (v5.0) |
| wm_store_mult / wm_reorder_mult / wm_complex_mult | 0.8 / 0.7 / 0.5 | 1.0 / 1.0 / 1.0 | capacity-ladder ceilings at 30 (v5.0) |
| seg_boundary_p | 0.5 | 1.0 | boundary-mint multiplier (v5.0) |
| emo_ctx_gain | 0.3 | 1.0 | emotional-context leg (v5.0; emo-item legs exempt) |
| da_enc_tax / da_ret_tax | 1.0 / 1.0 | 1.6 / 1.9 | divided-attention asymmetry (v5.0) |
| rif_age_tail | 0.1 | 1.0 | RIF/DF pivot multiplier (v5.0) |
| mw_decline / sdt_share | 0.4 / 0.4 | 1.0 / 0.9 | ambient-scan rate / stimulus-bound share (v5.0) |
| test_fb_req / test_nofb_mult | 0.0 / 0.2 | 0.9 / 1.0 | feedback-gated testing (v5.0) |
| mon_source_tax / illus_recol_p | 0.0 / 0.0 | 0.3 / 0.4 | recollection-only miscalibration (v5.0) |
| bump_emit_w | 1.0 | 3.0 | importance-draw bump weight (v5.0) |
| recol_mult / fam_mult | 0.3 / 0.7 | 1.0 / 1.0 | dual-process emission legs (v5.12; knots at AD§92) |
| gist_survive_mult | 1.0 | 1.5 | gist-field preservation ≥1 (v5.12) |
| gist_false_mult | 1.0 | 2.0 | gist-consistent lure endorsement (v5.12; gist-shared only) |
| pos_gain | 1.0 | 1.5 | positive-candidate emission ranking (v5.12; C.da →1.0) |
| tod_tax | 0.0 | 0.35 | off-peak controlled-path tax; ages onto synchrony_gain (v5.12) |
| chronotype | — | — | enum {morning,neutral,evening}; maps to peak_hour (v5.12) |
| sensory | 0.0 | 1.0 | unaided acuity deficit; bible-set (v5.12) |
| sens_enc_tax | 0.0 | 0.3 | auditory-channel write loss × sensory (v5.12) |
| sensory_age_shift | 0 | 6 | age_eff years at sensory=1; non-reversing (v5.12) |
| comp_gain | 0.0 | 0.15 | low-demand grind bonus, inverted-U (v5.12) |
| headroom | 0.8 | 2.2 | tier-3 demand ceiling before super-linear fall (v5.12) |
| enact_rescue | 1.0 | 1.5 | enacted-event E leg, rises w/ age; composes enact_gain (v5.12) |
| transact_gain | 1.0 | 1.4 | withPartner internal-detail gain; shared history only (v5.12) |
| pm_time_tax | 1.0 | 1.8 | extra pm_self decline on cueType:time (v5.12) |
| impl_intent_gain | 0.0 | 0.7 | fraction of pm_time_tax removed by if-then framing (v5.12) |
| stereo_tax | 0.7 | 1.0 | age_salient retrieval multiplier (v5.12) |
| sug_age_mult | 1.0 | 1.7 | §6.83 shift-leg age amplifier; yield exempt (v5.12) |
| fitness_shift | 0 | 3 | max fitness→age_eff years (v5.12; rf_cap 12y combined) |
| fitness_drift_hl | 0.3 | 3.0 | behavior-drift half-life, years (v5.12, HYPOTHESIS) |
| tele_slope | 0.2 | 0.6 | day-error σ growth per day of delay (v5.14; R&B 0.4 anchor) |
| mid_pull / round_bias / landmark_pull | 0.05 / 0.0 / 0.1 | 0.3 / 0.25 / 0.5 | whenEstimate bounded pulls (v5.14) |
| coarse_when_mult | 0.2 | 0.6 | coarse temporal-field decay mult (v5.14) |
| obs_inflate_gain | 0.1 | 0.6 | observed-action motor encoding bonus (v5.14) |
| obs_flip_mult | 0.3 | 2.0 | agency-flip rate on source_confuse_flip (v5.14) |
| dream_strength | 0.05 | 0.3 | dream-record encoding strength (v5.14) |
| dream_flip_mult | 0.2 | 1.0 | dream→witnessed flip scaling × dissoc/fantasy/imagery (v5.14) |
| distinct_expect | 0.2 | 0.8 | demand_detail endorsement suppression (v5.14) |
| distinct_age_loss | 0.2 | 0.8 | gist-encoding penalty on the guard (v5.14) |
| fame_thresh | 0.25 | 0.6 | nameFluency attribution threshold (v5.14) |
| fame_p / acquaint_p | 0.04 / 0.04 | 0.25 / 0.25 | unexplained-familiarity emit rates (v5.14) |
| detect_gain | 0.25 | 0.8 | silent discrepancy-detection base (v5.14) |
| imagery | — | — | IndivTraits entry, N(0,1): loads imagine/richness/source_confuse/dream_flip (v5.14) |

**v4.0 emotional-memory note (leftover affect):** `savor`/`dampen` are
the bible's positive-affect dials — a savorer keeps good days warm,
a dampener can't (pair `dampen` high with `rumin_k` high for the
depressive profile: negative maintained, positive bled). `emo_gran`
low = the character who "just felt bad" — their records can't carry
discrete tags and their reappraisal is weak; do not confuse with low
intelligence, granularity is orthogonal to `g_mem`. `secure_damp`
reads the relationship matrix — an isolated character physically
cannot get the attenuation; write companionship into backstory or it
never fires. `carry_*` are mostly population constants, but a
high-`misattrib_k` + low-`attrib_rescue` character is the one who
falls in love on the shaky bridge / comes home still shaking.
`emo_rate` is store-side state, not a dial — but a character whose
bible scripts constant drama will *emergently* lose the
distinctiveness boost (w_emo_dist → 0 as emo_rate → 1): quiet lives
remember their rare fights forever. `forecast_*` below 1.0 is a
spec violation — nobody under-predicts. `tdist_val` only reads on
personal records; gossip about others never gets the distance bias.

**v3.9 age-decline note (residual channels):** all v3.9 params are
reserve-shifted capacity dials EXCEPT `own_age_gain` (expertise —
follows the character's exposure history, not decline). Bible
guidance: `pm_deactivate` low + `comm_habit_gain` high on a routine-
bound elder produces the bought-it-twice beat; `update_resist` high
is the "she still lives on Folsom" character — pair with a recent
move in the backstory. `fame_fluency` belongs on socially embedded
elders (more gossip exposure → more fluency to misattribute).
`offload_bias` low on a proud character = refuses the notebook,
loses the errand — the metacognitive miss is the drama. `impl_str`
is store-side, not a dial. `spacing_gain` stays flat — do not pin
it low on old characters; their distributed retells work fine.

**v3.3 note (society/cache/fitting layer):** `doubt_persist` is the
only new per-char dial — how long a trusted correction keeps a record
flagged untrusted after the evidence fades (the grudge-on-corrections
trait; bible writers: suspicious characters get high values but so do
burned ones — pair with backstory, not just distrust). `belief_hyst`,
`truth_default_w`, `session_scan_cap_base` are population constants;
`recov_tol`/`bh_q`/`probe_n_*` live in the harness, never in profiles.

**v1.6 age-decline note (compensation layer):** the v1.6 params split
into reserve-shifted capacity params (`value_select`, `hyperbind_p`,
`dest_mem`, `ctx_loss`, `conf_inflate_old`, `schema_support`,
`collab_partner_gain` — all evaluate at `age_eff`) and two deliberately
NOT shifted (`positivity_gain` — motivational, SST; `stereo_suscept` —
a trait, gated by the frozen `stereo_age_gate`). World-builder
guidance: `schema_support` scales with the density of a character's
semantic store, so bibles with rich expertise get it implicitly —
don't pin it high for sparse-store elders. `collab_partner_gain`
matters only where a bible describes a long-term intimate partner —
widowed elders get measurably less support (grief as memory loss is
emergent). `dest_mem` low values produce the endearing/irritating
repeat-telling; pair with `chain_gain` HIGH for the storyteller.
`stereo_suscept` loads on neurot/distrust — the character who fears
being seen as senile performs worst when quizzed. `conf_inflate_old`
is the reason old witnesses should never be trusted on details even
when they sound certain — a probe-locked inversion (P150).

**v1.7 emotional-memory note (affect-tag layer):** all v1.7 params are
trait/personality surfaces, none reserve-shifted. Bible guidance:
`regulate_style` is a real personality dial — pin the unflappable
landlord-type LOW (suppressor: less of the hard day gets in at all)
and the counselor-type HIGH (remembers it, cooler). `gen_width`
widens implicitly with trauma-record count — do not also pin it high
for traumatized characters or the effect double-counts; DO pin it
high (0.4+) for anxious temperaments without trauma (Lissek gradient
is trait-broadened). `empathy_trait` (contagion term, bible-set) is
the inverse dial of `w_emo_neg`: cold characters hear tragedies
cold. `verbal_dampen` is mostly invisible to bibles — the emergent
lesson is behavioral: characters who talk about it cool off, isolates
stay hot; pair low `verbal_dampen` characters with the isolation
modifier, not high ones. `fab_self_gate` low (0.15) = a character
who heals from OTHERS' wounds too — the saintly profile; high (0.6)
= even their own slights scar (self-focused grievance-keeper —
combine with depressive modifier for the full rumination stack).
`peak_w`/`end_w` must sum to 1; children peak_w→0.7, elders
end_w→0.55.

**v1.5 age-development note:** this pass adds mostly AGE-STRUCTURED
params — they ARE the age curves. `reminiscence_env` is the bible dial
(storytelling household → earlier, denser childhood pool; fixed at
creation, never drifts). `latent_recall_p` should stay small for all
characters — it exists for rare payoff scenes, not as a retrieval
path; trait-loaded on `vivid` (rich sensory encoders leave reinstatable
traces). `offtarget_p` intercept is a personality dial (loquacious HIGH
at any age — Trunk & Abrams 2009 style component), the slope is the
deficit; pairs naturally with `chain_gain`. `scaffold_gain` only matters
where bibles describe supervised/mentored childhoods. `know_protect_*`
is effectively flat across characters — it is the *age boundary* that
varies, and it should correlate with `reserve` (dense semantic stores
protect more). `sws_child_peak`/`nap_*` matter only for characters with
childhood segments in play (backstory seeding, child characters).
`child_internal_confuse` pairs with `fantasy` trait (rich imaginers
confuse imagined↔real more). `child_trauma_off` is HYPOTHESIS —
small or zero for most profiles. `tele_age_gain` is flat population
mechanism; do not trait-load it.

**v1.3 forgetting-curves note:** the v1.3 params are mostly
age-INVARIANT by design — spacing/testing dynamics, quote decay,
suppression ceilings, and intention persistence are population
mechanisms. Age-sensitive exceptions: `retell_base`/`retell_social`
(older adults rehearse less socially → ×0.8 at 65+; gossip modifier
×1.4 both), `reminiscence_frac` (older ×0.8 — smaller field pools),
`suppress_cap` (depressive/trauma modifiers ×0.5 — reduced control
where most wanted, Stramaccia 2021), `child_consol_*` (only evaluated
for encodeAge < 7 records by construction), `amnesia_slope` (frozen at
character level — it prices a fact about the encoder's age, not the
current one). `pi_ref` is FLAT: release-from-PI is age-invariant in
the paradigm's data; the older-adult PI vulnerability lives in
`discrim_mult` (§4.2), not here.

**v1.4 retrieval-cues note:** most v1.4 params are population mechanisms
(flat). The exceptions carry real diversity: `pm_monitor_p`/`pm_clock_p`
fall and `pm_time_age_loss` rises on the §6 age curve (older adults lose
self-initiated PM, keep focal event cues — Einstein & McDaniel 1990);
`tot_resolve_p` rides the same age trajectory as `tot_rate` (older adults
need the syllable more and benefit from it — Abrams older-adult TOT work);
`tot_persist` is trait-loaded (ruminative/perseverative characters HIGH —
they learn their failures); `chain_gain` is the reminiscence-cascader
trait (storytellers HIGH, taciturn LOW); `out_int` pairs with
`search_breadth` — older adults emit fewer items so compounding matters
less in absolute terms but starts lower; `renewal_frac` is higher under
the trauma modifier (context-bound safety learning is exactly what PTSD
fails at — Bouton extension, flagged extrapolation); `tmr_gain` scales
with `sleepFactor` (no SWS, no reactivation). `tap_mismatch` is flat —
the gate is structural.

**v0.9d frozen constants (deepening pass):** `s_decay` (0.0008),
`relearn_gain` (0.8), `resurrect_R` (0.35), `tele_cross` (21),
`tele_back` (0.05), `landmark_gain` (0.4), `landmark_arousal` (0.7),
`k_order` (4.0), `contiguity_tau` (2.0), `contiguity_asym` (1.25),
`hindsight_conf_gain` (0.08), `hindsight_max_surprise` (0.7),
`ease_few` (1.5), `ease_many` (3.0) — same audit rule as below.

**v1.2 encoding-mechanics note:** the new params divide into
age-sensitive and age-invariant sets. Age-SENSITIVE (evaluate on the §6
curve / decline layer): `elab_gain` (rises with expertise/goals, sags with
fatigue — shallow processing is the fatigued default), `lapse_p` (child
0.05 → young adult 0.02 → older 0.05; also trait-loaded: neurot, poor
sleep, stress — see modifier rows), `da_encode_mult` (older +0.15 —
multitasking costs grow with age), `unitize_gain` (older HIGHER — the
mechanism exists to rescue their weak link_p, Giovanello & Schacter
2012). Age-INVARIANT (flat for everyone, per the cited results):
`doorway_drop` (Radvansky et al. 2015 — event-level updating is age-
invariant), `enact_gain` (Roberts 2022 patient studies — the advantage
survives impairment; child values may be HIGHER, motor encoding is the
intact channel), `boundary_gain`/`boundary_order_loss` (event-level
segmentation intact across lifespan), `prod_gain`, `distinct_gain`,
`concrete_gain`, `mood_cong_encode`, `gen_gain`. Frozen v1.2 constants:
`intent_null = 0`, `da_ret_cost = 1.5`, `lapse_window = 0.02`,
elaboration weights {0.5,0.3,0.2,0.3} — same audit rule as below.

**v0.9 frozen-constant note:** per the identifiability audit in
`formal-model.md` §4, the following params are population constants and
should NOT vary per character — loaders treat them as fixed regardless of
profile: `k` (logistic sharpness, 8), `drift_k` (0.02), `tau_episodic`
(1.2), `tau_semantic` (30), `collab_size_pen` (0.1),
`collab_friend_mult` (1.2), `arousal_affect_decay` (1.4), `rep_cap` (2.0).
They stay in the spec table for backward compatibility only.

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

**v0.8 social-memory note:** every character gains a PersonModel social
store — person memory has three tiers (familiarity ≫ identity ≫ name)
and a learned `credibility` per speaker that now feeds §6.3's
sourceCredibility, so trust is *remembered*, not global. Archetype
deltas: children get high `sti_prob` (person-attentive) but low
`cred_step` (trust matures slowly past early selectivity, Koenig &
Harris 2005) and mnemic neglect off until the self-concept consolidates
(`mnemic_encode` ~0 below ~10 — HYPOTHESIS). Teens run the highest
`audience_tune` + `sti_prob` (social world over-encoded already) and
steep `cred_step` (reputation accounting is the adolescent preoccupation).
Older adults: `identity_thresh`/`name_thresh` up (familiarity preserved,
bindings lost — "I know the face"), `oab_loss` unchanged (own-age bias
is symmetric across age), `cheat_source_mult` flat (cheater memory
preserved, Bell & Buchner 2012), `ss_rif_k` ×`discrim_mult` up (more
steerable). The gossip modifier now also raises `audience_tune`
(retelling literally reshapes their memory), widens `knowsTopics`
acquisition, and runs the rumor chain's `social_transmit_gain` up.
Depressives invert mnemic neglect (×0.3 — no self-protection) — they
retain the criticism. Two hard constraints: `name_thresh >
identity_thresh > familiar_thresh` always, and incongruity (encoding)
vs stereotype-convergence (transmission) stay uncoupled — Kashima 2000
needs both.

| anticip_gain | 0.0 | 0.8 | pre-event trace birth gain (v5.1; 0 = lives un-anticipated) |
| betrayal_thresh / betrayal_trust_gain | 0.4 / 0.0 | 0.9 / 0.7 | perpetrator-closeness gate/gain (v5.1) |
| betrayal_thin / betrayal_avoid_k | 0.0 / 0.0 | 0.6 / 0.7 | verbatim thinning / voluntary-recall discount (v5.1) |
| vic_cond_mult / inst_cond_mult | 0.0 / 0.0 | 1.0 / 0.6 | observed vs instructed conditioning routes (v5.1) |
| dream_emo_w / dream_neg_bias | 0.0 / 0.0 | 1.0 / 0.4 | dream-draw arousal weight / negative skew (v5.1) |
| shame_avoid_k / shame_intrude_k | 0.0 / 0.0 | 0.7 / 0.35 | self-conscious avoidance/intrusion (v5.1) |
| guilt_rehearse_k | 0.0 | 0.6 | guilt rehearsal → amends_urge gain (v5.1) |
| forgive_rumin_k | 0.0 | 1.0 | RelEdge.forgive gate strength (v5.1) |
| nostalgia_trigger_k / nostalgia_lift | 0.0 / 0.0 | 0.6 / 0.4 | distress trigger / emission mood lift (v5.1) |
| mood_confab_k / mood_crit_shift | 0.0 / 0.0 | 0.5 / 0.25 | mood-matched confab / low-arousal criterion (v5.1) |
| rep_habit_k / rep_script_gain | 0.0 / 0.0 | 0.4 / 0.5 | recurrence habituation / script consolidation (v5.1) |
| emo_inertia | 0.0 | 1.0 | mood autocorrelation trait; depr→0.7 (v5.1) |
| anchor_w / persever_resid | 1.0 / 0.1 | 2.0 / 0.6 | incumbent weight + discredited-anchor residue (v5.2) |
| test_window / test_pot_mult | 0.5 / 1.0 | 2.0 / 1.8 | recall→misinfo susceptibility leg (v5.2) |
| own_emit_gain | 0.0 | 0.3 | emitted-answer "claimed" bonus (v5.2) |
| exp_fill_p / exp_thresh | 0.0 / 0.4 | 0.5 / 0.8 | encode-time schema fill rate/bar (v5.2) |
| ev_cred / retro_evid | 0.7 / 0.0 | 1.0 / 0.5 | artifact credibility + back-fill (v5.2) |
| why_mint_p | 0.5 | 1.0 | reason mint rate on probe (v5.2) |
| fic_penalty / fic_known_prior | 0.2 / 0.0 | 0.8 / 0.4 | story-frame discount + fluency (v5.2) |
| corrob_root_req / lineage_conf | — / 0.0 | — / 0.8 | genealogy rule + unknown-lineage discount (v5.2) |
| reappr_k | 0.0 | 0.7 | current-appraisal blend on emitted affect (v5.2) |
| yield_suscept / shift_suscept | 0.05 / 0.05 | 0.7 / 0.7 | GSS two-factor split (v5.2) |
| shift_int_frac | 0.1 | 0.7 | internalized fraction of pressured flips (v5.2) |
| intent_done_p / comm_err_p | 0.0 / 0.0 | 0.3 / 0.5 | intention-completion mint + re-fire (v5.2) |
| sself_enc / sself_other_loss | 0.0 / 0.0 | 0.3 / 0.4 | ego-ledger encode asymmetry (v5.3) |
| alex_flat / alex_confab | 0.0 / 0.0 | 0.7 / 0.9 | affect-channel deficit + minted feeling (v5.3) |
| circ_jitter | 0.0 | 0.4 | daily peak/sleepFactor variance (v5.3) |
| pain_tax / task_load_cost | 0.05 / 0.2 | 0.3 / 0.8 | anterograde now-tax + PM spend (v5.3) |
| rosy_retro | 0.0 | 0.4 | rosy-arc positive tilt on emission (v5.3) |
| task_load / pain_state | 0.0 / 0.0 | 1.0 / 1.0 | context fields, not traits (v5.3) |
| birth_order | — | — | DOCUMENTED NULL — every loading locked 0.0 (v5.3) |
| name_meaning_gain / name_distinct_gain | 0 / 0 | 0.6 / 0.6 | tier-3 name-write relief (v5.4) |
| spot_mult / spot_offense_p | 0.5 / 0 | 1.5 / 0.7 | spotlight anchor + offense mint (v5.4) |
| promise_cred_w / promise_debt_w / breach_p | 1.0 / 0.5 / 0.2 | 1.8 / 1.0 / 0.9 | asymmetric commitment Intentions (v5.4) |
| hp_exp / solve_set_relax | 0.3 / 0.2 | 1.5 / 1.0 | hidden-profile sampling tax (v5.4) |
| truth_def_bias / susp_persist | 0.5 / 0.3 | 0.8 / 1.0 | truth-default + residue decay (v5.4) |
| copres_w / group_blind / copres_schema_fill | 0.3 / 0 / 0 | 0.9 / 0.8 / 0.6 | co-presence encoding + schema fill (v5.4) |
| keeper | −2 | +2 | new IndivTrait — relational-calendar role, bible-pinnable (v5.4) |
| keeper_mint / keeper_cue_w | 0 / 0.5 | 1.5 / 1.5 | keeper allocation + reminder-as-cue (v5.4) |
| dif_mult / dif_days / deny_src_weak | 0 / 2 / 0.2 | 1.0 / 30 / 0.9 | denial-induced forgetting (v5.4) |
| ostrac_gain / ostrac_persist / excl_scope_drift / ostrac_vigil | 0.2 / 0 / 0 / 0 | 1.0 / 0.6 / 0.5 / 0.6 | exclusion hot-encode + scope drift (v5.4) |
| h_dap_thresh / anchor_date_gain | 0.5 / 0 | 0.9 / 0.6 | living-in-history anchor gate (v5.4) |
| rev_moral_neg / rev_moral_pos / rev_abil / moral_bad_thresh / moral_repair_k | 1.0 / 0.1 / 0.4 / −0.6 / 1.5 | 2.5 / 0.8 / 1.2 / 0.0 / 6 | domain×valence revision gains + redemption tax (v5.4) |
| self_est | 0.15 | 0.95 | trait — standing self-evaluation; NOT metamemory (v5.6) |
| selfverif_w | 0.0 | 1.0 | consistency gate on mnem_neg; >0.7 = self-verifier (v5.6) |
| self_complex | 2 | 8 | self-aspect count — spillover divisor (v5.6) |
| self_comp | 0.0 | 1.0 | negative-aspect compartmentalization (v5.6) |
| repress | 0.0 | 1.0 | DERIVED defens·(1−neurot_report) — never pinned (v5.6) |
| repr_neg_shift | 0.0 | 3.0 | years; earliest-negative-memory shift (v5.6) |
| remin_w | 0.0 | 1.0 | idle-reminiscence share, 55+ only (v5.6) |
| counterf_k | 0.0 | 0.4 | near-miss counterfactual mint rate (v5.6) |
| regret_inact_mult / regret_opp_gate | 0.2 / 0.0 | 0.7 / 1.0 | inaction β-mult + disengagement gate (v5.6) |
| savor_k / dampen_k | 0.0 / 0.0 | 1.0 / 1.0 | positive-affect valves (v5.6) |
| future_cont / pself_mint | 0.0 / 0.0 | 1.0 / 0.3 | future-self continuity + pself mint (v5.6) |
| elabor / elabor_dyad_gain | 0.0 / 0.0 | 1.0 / 0.4 | co-narration style + shared-detail gain (v5.6) |
| pretest_gain / pretest_win | 0.0 / 0.01 | 0.5 / 0.5d | failed-recall potentiation mark (v5.8) |
| hypercorr_gain / hypercorr_age_mult | 0.0 / 0.0 | 0.6 / 1.0 | confidence-scaled correction encoding (v5.8) |
| interleave_gain / interleave_win | 0.0 / 0.1 | 0.4 / 3d | cross-category contrast legs; verbal null locked (v5.8) |
| jol_fluency_bias | 0.0 | 0.4 | massed-fluency JOL over-read, report-side (v5.8) |
| env_enc_gain | 0.0 | 0.5 | support→elaboration leg, ×(1−si_res) (v5.8) |
| statlearn_gain / statlearn_min / statlearn_win / statlearn_age_w | 0.0 / 2 / 7 / 0.0 | 0.3 / 8 / 90d / 1.0 | co-occurrence semantic mint (v5.8) |
| cheat_link_gain | 0.0 | 0.5 | self/ingroup-harmed actor↔act link (v5.8) |
| zeig_resist / zeig_win_ext | 0.0 / 0.5 | 0.7 / 4 | interrupted-intention persistence (v5.8, OBSERVE) |
| recons_win / recons_drift_mult / recons_upd_p / recons_risk | 0.05 / 1.0 / 0.0 / 0.0 | 0.5 / 2.5 / 0.7 / 0.3 | labile window size + in-window edit rates (v5.9, DEBATED) |
| srif_mult | 0.0 | 1.0 | listener-side RIF share of speaker dose; ≤1 always (v5.9) |
| consol_sel_w / consol_sel_arous | 0.0 / 0.3 | 0.9 / 0.8 | sleep selectivity weight / arousal gate (v5.9) |
| sleep_span_gain | 0.0 | 0.4 | slept-gap retell S bonus (v5.9) |
| interf_sim_peak / interf_sim_width / sim_repeat | 0.4 / 0.15 / 0.85 | 0.7 / 0.5 / 0.97 | Osgood surface shape + repetition boundary (v5.9) |
| teles_c / teles_tau | 0.0 / 30 | 0.3 / 400 | forward-telescoping bias scale (v5.9) |
| df_theta | 0.0 | 0.15 | directed-forgetting θ surcharge (v5.9) |
| hyperbind_gain | 0.0 | 0.4 | spurious-link age ramp ≥55 (v5.9) |
| alf_gain / alf_onset | 0.0 / 2 | 0.8 / 30 | late-phase tail steepening, age-scaled (v5.9, DEBATED) |
| distinct_gate / distinct_pi_w | 0.5 / 0.2 | 0.9 / 1.0 | isolation shield on interference (v5.9) |
| backcue_mult | 0.3 | 0.9 | reverse-query leg weight (v5.10) |
| recue_passes / recue_breadth | 0 / 0.3 | 3 / 0.9 | iterated-cuing depth + breadth (v5.10) |
| obj_cue_w | 0.05 | 0.35 | evocative-object standing cue (v5.10) |
| photo_offload_pen | 0.0 | 0.3 | whole-photo encode tax (v5.10) |
| pm_popout_gain | 0.0 | 0.4 | distinctive nonfocal PM rescue (v5.10) |
| forced_floor / rapport_gain | 0.1 / 0.0 | 0.4 / 0.25 | asker license floor + trust breadth (v5.10) |
| route_gain / route_cap / route_hl | 0.0 / 1.1 / 10 | 0.15 / 2.0 / 90 | worn-path rate, cap, half-life (v5.10) |
| restart_overlap | 0.2 | 0.7 | fresh-angle restart gate (v5.10) |
| infant_beta_lo / infant_beta_mid | 4.0 / 2.0 | 12.0 / 6.0 | infant-clock β multiplier endpoints (v5.11) |
| reinstate_gain / reinstate_bar | 0.0 / 0.4 | 0.8 / 0.85 | perceptual reinstatement below wall (v5.11) |
| obs_gain_lo | 0.1 | 0.6 | observer-channel 1y knot (v5.11) |
| heritage_gain / heritage_kin_atten | 0.0 / 0.2 | 0.7 / 0.8 | intergenerational bump legs (v5.11) |
| free_recall_tax | 1.0 | 3.0 | child no-cue θ multiplier at 5 (v5.11) |
| order_strength_bias / order_strength_until | 0.0 / 6 | 0.9 / 12 | order-by-strength branch (v5.11) |
| study_mult | 0.0 | 0.5 | studied-event bonus, tier-gated (v5.11) |
| rehearsal_on / org_on / elab_on | 5 / 8 / 10 | 9 / 12 / 16 | strategy-tier onsets yrs (v5.11) |
| school_strat_adv / meta_school_gain | 0.0 / 0.0 | 1.5 / 0.15 | schooling onset-delay + meta gap (v5.11) |
| pub_reward_gain | 0.0 | 0.3 | adolescent reward overlay leg (v5.11) |
| schooled | — | — | bible enum {full,partial,none}, mains all full (v5.11) |
| grief_osc_k / grief_restore_slope | 0.05 / 0.005 | 0.3 / 0.05 | DPM mode-switch + restore slope (v5.13) |
| grief_pang_gain / restore_suppress | 0.05 / 0.1 | 0.3 / 0.7 | loss-mode intrusion discount / restore suppression (v5.13) |
| bond_gain / bond_talk_p | 0.0 / 0.0 | 0.06 / 0.15 | continuing-bonds accrual + apostrophe rate (v5.13) |
| emo_back_loss / emo_fwd_gain | 0.1 / 0.0 | 0.7 / 0.5 | directional leak around hot events (v5.13) |
| emo_coh_loss | 0.0 | 0.5 | within-event coherence penalty on negatives (v5.13) |
| cc_eval_gain | 0.2 | 1.0 | counterconditioning rival-tag mint (v5.13) |
| safety_suppress | 0.1 | 0.6 | trusted-presence fire inhibition (v5.13) |
| capitalize_gain / cap_val_gain | 0.0 / 0.0 | 0.4 / 0.3 | ACR-gated positive retell re-stamp (v5.13) |
| tone_survive_mult / prosody_leak_k | 0.2 / 0.0 | 1.0 / 0.4 | prosody field decay ratio + implicit leak (v5.13) |
| aff_flash_thresh | 0.1 | 0.5 | below-wall CondEntry emission gate (v5.13) |
| jealous / rival_vigil_gain / rival_stick_k | 0.0 / 0.0 / 0.0 | 1.0 / 0.6 / 0.6 | rival vigilance trait + encode + stickiness (v5.13) |
| awe_self_loss / awe_gist_gain / awe_gap_resist | 0.1 / 0.0 / 0.0 | 0.7 / 0.6 / 0.8 | small-self encode signature (v5.13) |
| emo_df_resist | 0.0 | 0.5 | directed-forgetting resistance, ≤0.5 locked (v5.13) |
| hsam_decay_cut / hsam_rehearse / hsam_date_acc | 0.5 / 0.0 / 0.5 | 0.95 / 0.8 / 0.98 | HSAM own-life decay + rehearsal engine + dating (v5.15) |
| sdam_thin / sdam_know_shift | 0.3 / 0.0 | 0.9 / 0.6 | SDAM specificity thin + know-shift (v5.15) |
| nfc_elab_gain / nfc_arg_split | 0.0 / 0.0 | 0.4 / 0.4 | elaborable-event E + strong/weak split (v5.15) |
| mnemic_shallow / mnemic_theta | 0.0 / 0.0 | 0.7 / 0.8 | feedback not-thought encode + recall θ tax (v5.15) |
| ribot_loss / ribot_win_mild / ribot_win_severe | 0.3 / 0.25 / 10 | 1.0 / 2.0 / 90 | Ribot retrograde window (v5.15) |
| tbi_wmc_tax / tbi_ps_tax | 0.0 / 0.0 | 0.3 / 0.3 | stable wmc/pspeed residue (v5.15) |
| apoe_shift / apoe_slope | 0.0 / 0.0 | 8.0 / 0.4 | ε4 onset shift (y/allele) + slope steepening (v5.15) |
| syn_gain | 0.0 | 0.2 | pervasive episodic gain, ordinary-bound (v5.15) |
| rumin_sel / rumin_refl_gain | 0.0 / 0.0 | 0.8 / 0.15 | negative-rehearsal bias + reflection leg (v5.15) |
| hsam / sdam / nfc / mnemic / tbi / apoe / synesth / rumin / learn_style (traits) | 0 / 0 / −2 / −2 / 0 / e2 / 0 / −2 / — | 1 / 1 / +2 / +2 / 2 / e4 / 2 / +2 / — | new IndivTraits (v5.15); hsam·sdam exclusive; apoe hidden enum; learn_style all-0 lock |
| nil_win / nil_loss / nil_pre_gain | 1 / 0.2 / 0.0 | 3 / 0.8 / 0.6 | pre-turn encoding hole window/depth/reversal (v5.16) |
| exp_str_thresh / strong_exp_congr / incong_recog_flip | 0.5 / 0.0 / 0.0 | 0.9 / 0.6 / 0.4 | expectancy-strength incongruity reversal (v5.16) |
| implied_adopt_p / implied_src_weak | 0.2 / 0.3 | 0.8 / 0.9 | implicature mint + born-weak source (v5.16) |
| trait_access_gain / prime_persist_hr / ambig_assim_p | 0.0 / 12 / 0.0 | 0.6 / 96 / 0.6 | accessible-construct feed/decay/assimilation (v5.16) |
| odep_gain / odep_incong_w | 0.1 / 0.5 | 0.8 / 2.5 | dependency attention + incongruity focus (v5.16) |
| mag_victim_sev / mag_arb_drift / mag_perp_decay | 0.0 / 0.0 / 0.0 | 0.6 / 0.5 / 0.6 | magnitude-gap victim/perp arms (v5.16) |
| forg_aff_mult / forg_lag | 0.2 / 3 | 1.0 / 60 | forgiveness affect-detach + decisional→emotional lag (v5.16) |
| echo_adopt_p / echo_conf_bonus | 0.0 / 0.0 | 0.45 / 0.3 | own-story echo adoption cap + conf bonus (v5.16) |
| wit_cred_boost / wit_debt_boost / wit_breach_conf | 0.0 / 0.0 / 0.0 | 0.5 / 0.5 / 0.6 | witnessed-commitment arms + breach shame conf (v5.16) |
| metvia_perma / remet_offense_p | 0.7 / 0.0 | 1.0 / 0.7 | provenance anchor + re-meeting offense (v5.16) |
| orphan_eval_resid | 0.1 | 0.5 | eval floor after evidence dies (v5.17) |
| favor_recv_bonus / favor_give_decay | 0.0 / 0.1 | 0.4 / 0.8 | favor-ledger receive bonus + give decay (v5.17) |
| coal_tag_p / coal_overwrite_thresh / coal_cat_overwrite | 0.2 / 2 / 0.3 | 0.9 / 6 / 1.0 | alliance-edge mint + category re-sort (v5.17) |
| rel_bump_win / rel_bump_gain | 30 / 0.0 | 180 / 0.4 | relationship-onset window + E gain (v5.17) |
| absence_p / abs_val | 0.2 / −0.4 | 0.8 / 0.0 | noticed-absence mint + valence (v5.17) |
| blunder_self_keep / blunder_other_decay / aud_recall_over | 0.2 / 1.0 / 1.2 | 0.8 / 2.5 / 3.0 | blunder split + audience-retention overestimate (v5.17) |
| central_speaker_mult / net_hop_decay | 0.0 / 0.1 | 1.0 / 0.8 | convergence scaling + one-hop propagation (v5.17) |
| idiom_mint_p / idiom_dyad_gate / idiom_retell_gain / idiom_orphan_loss | 0.1 / 0.6 / 0.0 / 0.1 | 0.6 / 1.0 / 0.5 / 0.8 | dyad-locked cues + dissolution cost (v5.17) |
| rival_cue_gain / rival_disengage_loss | 0.0 / 0.1 | 0.6 / 0.6 | threat-cue encoding + attention lock (v5.17) |
| prov_flat_p | 0.1 | 0.7 | provenance-stack thinning per retell (v5.17) |
| theta_cap | 0.8 | 1.8 | saturating θ accumulator scale (v5.18) |
| lat_mult_cap | 2.0 | 4.0 | rate-terminus ceiling (v5.18) |
| grace_floor | 0.02 | 0.15 | worst-case recall floor at θ cap (v5.18) |
| ctx_tau | 10 | 90 | sim-min context-field persistence (v5.18) |
| att_span_ctx | 3 | 8 | cueContext cardinality bound (v5.18, HYPOTHESIS) |
| tp_pastneg / tp_pastpos / tp_preshed / tp_presfat / tp_future | 0.0 | 1.0 | trait pins — ZTPI subscales, independent (v5.19) |
| narr_agency / narr_comm | 0.0 | 1.0 | trait pins — thematic field-depth (v5.19) |
| autobio_k | 0.0 | 1.0 | trait pin — lesson-mint rate (v5.19) |
| narr_coh_k | 0.0 | 1.0 | trait pin — narr_link_gain multiplier (v5.19) |
| period_sal | 0.0 | 1.0 | trait pin — chapter-wall strength (v5.19) |
| epi_future_k | 0.15 | 0.95 | trait pin — computed prior, override w/ reason (v5.19) |
| tp_arrival_k | 0.15 | 0.5 | mechanism — arrival-sampler gain (v5.19) |
| theme_sel_k | 0.1 | 0.35 | mechanism — field-depth modulation (v5.19) |
| era_surf_p | 0.05 | 0.3 | mechanism — base era-wording rate (v5.19) |
| sdm_tension_intr | 0.05 | 0.3 | mechanism — anchor re-access gain (v5.19) |
| value_rank_w | 0.15 | 0.7 | importance leg in wm_cap ordering (v5.20) |
| select_sharp | 0.0 | 0.7 | deficit-scaled spill gradient (v5.20) |
| value_mem_gate | 0.1 | 0.8 | hard-but-valuable selectivity failure (v5.20) |
| choice_enc_gain / choice_beta_mult | 0.0 / 0.75 | 0.3 / 1.0 | chosen-content E + day-1 β (v5.20) |
| errful_mediator_gain | 0.0 | 0.4 | conceptual-guess mediator leg (v5.20) |
| errful_arb_loss / errful_noise | 0.0 / 0.0 | 0.7 / 0.3 | arbitrary-guess attenuation + competitor (v5.20) |
| sib_drift / sib_trust_w | 0.0 / 0.2 | 0.4 / 1.0 | saying-is-believing drift + trust weight (v5.20) |
| obs_enc_gain / obs_intent_mult | 0.0 / 1.0 | 0.25 / 3.0 | observed tier + watching-to-learn (v5.20) |
| face_dist_gain | 0.0 | 0.5 | distinctive-face write/accrual gain (v5.20) |
| secret_load_mult / secret_heat_mult | 0.5 / 1.0 | 3.0 / 2.0 | secret tonic load + cue-heating (v5.20) |
| intox_retro_shield | 0.0 | 0.8 | pre-onset interference shield, OBSERVE (v5.20) |
| stim_E / stim_hl | 0.1 / 0.0001 | 0.5 / 0.001 | ghost tier strength + half-life in days (v5.21) |
| stim_recall_p / stim_cap | 0.3 / 1 | 0.9 / 4 | ghost recoverability + shelf depth (v5.21) |
| avail_freq_k | 0.0 | 1.5 | availability lift on count estimates (v5.21) |
| aud_resp_distract | 0.0 | 0.6 | distracted-listener retell value floor (v5.21) |
| collab_inhib / postcollab_gain | 0.6 / 0.0 | 0.95 / 0.3 | joint-recall penalty + afterglow (v5.21) |
| conf_beta_mult | 0.3 | 0.9 | confidence-channel decay vs content (v5.21) |
| dur_ev_w / dur_trans_w | 0.0 / 0.0 | 0.9 / 2.0 | remembered-duration density + transition weights (v5.21) |
| dow_snap | 0.0 | 0.4 | weekday-report midward regression (v5.21) |
| sem_cue_pen | 0.2 | 0.7 | semantic-mode sensory mute (v5.22) |
| w_valcue / valmismatch_gen | 0.0 / 0.0 | 0.4 / 0.8 | cue-carried valence weight / negative-cue overgeneral arm (v5.22) |
| config_gain | 0.0 | 0.2 | conjunctive joint-fan bonus (v5.22) |
| clust_mint_p / clust_cap | 0.0 / 4 | 0.5 / 16 | event-cluster formation rate / size cap (v5.22) |
| clust_gain / clust_date_blur | 0.0 / 0.0 | 0.6 / 1.0 | cluster-mate emission gain / within-cluster dating smear (v5.22) |
| lat_pulse / pulse_len | 0.2 / 1 | 0.8 / 6 | within-pulse latency scale / emissions per pulse (v5.22) |
| pulse_floor / lat_gap / pulse_oi_reset | 0.4 / 1.0 / 0.0 | 1.0 / 4.0 / 0.8 | pulse-end threshold (×θ) / inter-pulse latency / OI reset (v5.22) |
| w_struct / reminder_chance | 0.0 / 0.0 | 0.3 / 0.1 | structural cue weight / pure-structural reminding rate (v5.22) |
| ctx_thresh / ctx_gain | 2 / 0.0 | 8 / 0.4 | cfg repetitions to competence / discount (v5.22) |
| ctx_hl / ctx_cap | 7 / 10 | 60 / 120 | ctxcue decay half-life days / config table size (v5.22) |
| search_base / search_persist | 2 / 0.5 | 15 / 3.0 | bout budget in candidate-evals / FOK scaling (v5.22) |
| da_giveup_pen / search_age_pen | 0.0 / 0.0 | 0.8 / 0.6 | load and age search-shortening (v5.22) |
| fok_reprobe / fok_win | 0.0 / 0.1 | 0.8 / 2.0 | high-FOK re-fire rate / window in days (v5.22) |
| ctx_strict_lo / _mid / _hi | 1.0 / 1.0 / 1.0 | 4.0 / 3.0 / 2.0 | below-wall ctx-mismatch penalty knots (v5.23) |
| fb_3y / fb_5y / fb_8y / fb_12y / fb_adult | 2 / 3 / 3 / 4 / 5 | 4 / 5 / 7 / 8 / 12 | field_budget mint caps by encodeAge (v5.23) |
| intent_boost_lo / _mid | 0.0 / 0.0 | 0.8 / 0.6 | to_remember encode gain knots (v5.23) |
| df_store_onset | 7 | 13 | dforget storage-vs-gate switchover age (v5.23) |
| df_gate / df_gist_gate / df_gate_ramp_lo | 0.0 / 0.0 / 0.0 | 1.0 / 0.6 / 0.6 | child report-gate magnitudes (v5.23) |
| reorg_dip / reorg_attrit | 0.0 / 0.0 | 0.4 / 0.3 | adolescent-dip θ penalty / failed-window S cost (v5.23) |
| reorg_lo / reorg_hi / reorg_era_min / reorg_era_max | 10 / 15 / 3 / 7 | 14 / 20 / 5 / 11 | dip window and era bounds (v5.23) |
| pmt_5y / pmt_9y / pmt_14y | 1.0 / 1.0 / 1.0 | 3.0 / 2.2 / 1.6 | time-PM child-side tax knots (v5.23) |
| pm_clock_p | 0.0 | 0.7 | strategic check rate while time-intention armed (v5.23) |
| self_reminisce_gain / self_reminisce_until | 0.0 / 7 | 0.6 / 13 | child-tells-own-past consolidation / cutoff (v5.23) |
| reminisce_env_mod | 0.0 | 0.25 | env modulation of self_reminisce_gain (v5.23) |
| er_4y / er_10y | 1.0 / 1.0 | 1.6 / 1.4 | enact_rescue child-side knots (v5.23) |
| traj_maintain_p / traj_decline_p | 0.05 / 0.03 | 0.4 / 0.35 | trajectory class draw bases (v5.24) |
| maint_slope_mult / decl_accel | 0.2 / 1.0 | 0.9 / 2.2 | post-60 slope modifiers per class (v5.24) |
| iiv_age_slope / iiv_lead | 0.0 / 0 | 1.2 / 9 | variance growth past 60 / decline-arm lead (v5.24) |
| scd_lead | 0 | 10 | complaint-channel lead, decline arm only (v5.24) |
| retire_rate / retire_cap / engage_sub_recover | 0.0 / 0 / 0.0 | 1.2 / 8 / 0.9 | retirement overlay accrual/cap/refund (v5.24) |
| loco_tax / loco_pm_pen / loco_yield | 0.0 / 0.0 / 0.0 | 0.5 / 0.3 / 0.7 | locomotion encode tax, PM threshold, gait hint (v5.24) |
| allo_mint_p / ego_dir_pen | 0.1 / 0.0 | 0.95 / 0.8 | nav mint allocentric rate / wrong-heading penalty (v5.24) |
| obs_infl_age / obs_tail_k / obs_old_gain | 0.8 / 0.0 / 0.0 | 1.8 / 1.0 / 0.4 | observation-inflation age tail + benefit knots (v5.24) |
| ie_shift / ext_gain | 0.0 / 0.8 | 0.4 / 1.8 | internal:external narration mix drift (v5.24) |
| stack_cap | 2.0 | 6.0 | joint old-age product ceiling + audit (v5.24) |
| grat_gain / grat_fade_resist | 0.1 / 0.0 | 0.9 / 0.7 | gratitude person-entry gain + fade resistance (v5.25) |
| corumin_gate / corumin_bond / corumin_damp_loss | 0.2 / 0.0 / 0.0 | 0.8 / 0.08 / 0.9 | co-rumination gate, bond accrual, dampen denial (v5.25) |
| dist_cool | 0.1 | 0.8 | distanced-reflection affect cool (v5.25) |
| humor_reapp_k / humor_replay_k | 0.0 / 0.0 | 0.6 / 0.3 | humor-reappraisal encode cool / retell cool (v5.25) |
| hotcold_k / hotcold_gap_thresh | 0.2 / 0.3 | 0.8 / 0.7 | hot–cold read attenuation + attribution gate (v5.25) |
| threat_cue_gain / threat_hold | 0.0 / 0.0 | 0.35 / 0.6 | anxiety detection bonus + disengage hold (v5.25) |
| broaden_k / mood_broaden_floor | 0.0 / 0.2 | 0.5 / 0.5 | positive-mood fan widening + floor (v5.25) |
| dis_extinct_mult / dis_cc_mult / disg_prop_gain | 0.2 / 0.5 / 0.0 | 0.8 / 1.0 / 0.6 | disgust extinction resistance / countercond. wash / propensity mint (v5.25) |
| repair_base / repair_cap / repair_thresh / repair_lift | 0.0 / 0.3 / 0.2 / 0.0 | 0.6 / 0.9 / 0.6 / 0.25 | mood-repair recall reach/cap/gate/lift (v5.25) |
| felt_window | 7 | 21 | felt-vs-believed report seam, days (v5.25) |

**v1.0 profile-compiler note:** profiles are now *compiled*, not
hand-tuned — `profile-generation.md` §1 specifies the full
`deriveParams` pipeline (curve → modifiers → conditioned trait sampling
→ loading projection → ±5% residual → clamp + coherence pass) plus
three side outputs each profile emits: a `SelfModel` (metamemory —
felt competence correlates with real competence at `metamem_r ≤0.3`,
so characters can be confidently wrong about their own minds), a
`DomainTable` (expertise tags with gains AND the Woollett cost), and
`seedHints` (backstory → initial store incl. `open:true` drama hooks).
Archetype blocks below remain valid as curve values at their central
ages; individual profiles for the 8 mains = ProfileInput per bible,
scheduled at v11.

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
enact_gain 0.3 · lapse_p 0.05
  (v1.2: motor encoding is the intact channel — kids remember what they
  DID; lapses frequent, zoning out is the child default)
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
sti_prob 0.75 · audience_tune 0.10 · cred_step 0.12 · ss_rif_k 0.05
  (v0.8: person-attentive encoding, peer-tuned retellings rewrite the
  memory, fast reputation accounting)
gen_gain 0.2 · lapse_p 0.035 · mood_cong_encode 0.15
  (v1.2: identity work is generation — their own arguments encode deep;
  mood steers what elaborates; lapses ride the limbic load)
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
identity_thresh 0.5 · name_thresh 0.65 · ss_rif_k 0.06
  (v0.8: knows the face, loses the biography, blanks the name;
  familiar_only becomes the common state — cheat_source_mult stays
  flat, cheaters remembered; Bell & Buchner 2012)
unitize_gain 0.45 · lapse_p 0.05 · da_encode_mult 0.65
  (v1.2: coherent units rescue the weak link_p — "Sanna opened the
  shop" survives as one item while loose associations fragment
  (Giovanello & Schacter 2012); lapses up; multitasking costs heavy.
  doorway_drop stays FLAT at default — Radvansky 2015 no age diff)
value_select 0.3 · positivity_gain 0.2 · schema_support 0.15
  (v1.6 compensation: important things still encode, warm things
  preferentially encode, domain knowledge scaffolds — the selective,
  sunny, expert old mind)
hyperbind_p 0.15 · dest_mem 0.7 · ctx_loss 1.25
  (v1.6: wrong-context details bound at birth; repeats stories to the
  same listener — the miss asymmetry; where/when die before what/who)
conf_inflate_old 0.08 · collab_partner_gain 0.15
  (v1.6: confidently wrong on details — Dodson; a spouse's memory
  partially substitutes for her own — Barnier 2014)
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
| **Trauma history** | w_emo ×1.4; arousal_narrowing ×1.3; beta_source ×1.3; drift_p ×1.3 under stress; misinfo_suscept ×0.9 for the trauma topic only (hyperconsolidated core); intrusion_thresh −0.15 for threat-cued records (intrusive recall). **v0.5:** seed ≥1 `trauma:true` backstory record + cond_thresh ×0.9, cond_gain ×1.3 (lowered acquisition bar, faster conditioning) — the intrusion discount and fragmented timeline are now record properties (spec §5.7, emotional-memory.md §7); **v1.7:** `gen_width` widens +0.15 per trauma:true record automatically (§4.9) — anxiety flattens the fear gradient, Lissek et al. 2010 — do NOT also pin gen_width high | hyper-encoded threat core, fragmented context; conditioned dread outlives the record (R§5, R§8; RC§5; Bouton 2004) |
| **High-stress job / chronic stress** | enc_base ×0.85; theta ×1.15 (stress impairs retrieval); beta_episodic ×1.15; **v1.2:** lapse_p +0.03, da_encode_mult +0.1 (busy mind drops events and can't split attention) | cortisol impairs encode+retrieve; mind-wandering risk (R§8; Maillet & Rajah 2013) |
| **Poor sleep / insomnia** | sleepFactor → 0.7; enc_base ×0.9; drift_p ×1.2; **v0.6:** sleepFactor 0.7 < 0.75 → `sleepdep_flag` fires on most new records → permanently higher misinfo adoption on them (Frenda 2014 — the underslept are the gullible); **v1.2:** lapse_p +0.04 (the sleep-deprived lapse loading in §2 fires daily) | consolidation failure + encoding lapses (R§2, R§8; false-memory.md §3) |
| **Highly social / gossip** | retell_boost ×1.3; w_people ×1.3; misinfo_suscept ×1.2 (hears everything twice); drift_p ×1.15; **v0.6:** rumor `hearCount` accumulates faster (more exposures per rumor — repetition, not variety, is the mechanism); rep_gain ×1.1; **v0.8:** audience_tune ×1.5 (their own stories bend their own memory — Higgins & Rholes), sti_prob ×1.2, cred_step ×1.3 (keeps accounts on everyone), social_transmit_gain ×1.15 | rehearsal-rich, drift-rich memory (R§4, R§6 social contagion; illusory truth g≈0.37; saying-is-believing) |
| **Open-loop carrier** (NEW v1.0 — unresolved business) | open_loop_gain ×1.4; open_self_gate −0.1; on close β×1.2 still applies (the relief forgets) | involvement-gated Zeigarnik — intrusion/resumption CONSENSUS, recall advantage DEBATED (2025 meta); profile-generation.md §4 |
| **Depressive / ruminative** | w_state ×1.5; neg_affect_decay ×0.7 (negative lingers — dysphoria disrupts FAB, Walker et al. 2003); add `specificity 0.4` → recall returns generic summaries ("I always mess up"); **v0.5:** `rumin_k 0.5` — retell_boost applies selectively to negative-valence records (valence-conditioned rehearsal); mood_bleed ×1.5; **v0.6:** imagine_gain ×1.5 on negative-valence scenarios only — rehearsed fears can flip into remembered ones via §6.9; **v0.8:** mnemic_encode ×0.3 + mnemic_loss ×0.3 — dysphoria removes self-protective forgetting, criticism is retained (Sedikides & Green 2016; social-memory.md §10); **v1.2:** lapse_p +0.03 (ruminative absorption — attention collapses inward, the outside event never encodes; Maillet & Rajah 2013 negative-mood loading); **v1.7:** `fab_self_gate` →0.6 (even self wounds scar — the gate that normally lets personal hurt heal is raised) and `verbal_dampen` ×0.5 when they DO retell (disclosure less effective in dysphoria); the solo-rehearsal exemption of §6.11 is what keeps ruminators hot — they rehearse alone | overgeneral memory, mood-congruence, negative rehearsal loop, feared→remembered drift, no self-protective amnesia (R§8; emotional-memory.md §8; Garry 1996) |
| **Domain expert** (per domain tag) | **v1.0 supersedes:** `expert_gain` (default 0.10) ×depth on in-domain enc_base; k_verbatim ×(1−0.4·depth) in-domain; merge_thresh ×(1−0.15·depth) in-domain; link_p ×(1−expert_cost·depth) OUT of domain — expertise has a bill (Woollett & Maguire 2009); gain collapses at the domain edge (Chase & Simon 1973). Domain tags are per-character (`domains:` list) — see profile-generation.md §3 | expertise is additive with age, domain-locked, and costs elsewhere (R§8; Maguire 2000; Recht & Leslie 1989) |
| **Routine-heavy life** | merge_thresh ×0.9; interf_k ×1.3 | commutes blur together (R§3) |
| **Isolation / few retellings** | retell_boost ×0.6; memories fade without rehearsal | — |
| **High cognitive reserve** (education, complex work, social engagement) | reserve +0.2–0.4 → decline params read the curve ~4–10y younger (v0.4) | Stern 2002; Valenzuela & Sachdev 2006 (OR 0.54) |
| **Low engagement / isolated aging** | reserve −0.2 | earlier apparent decline |

| **Stoic / suppressor** (NEW v1.7) | `regulate_style` →0.15; `reg_suppress_cost` →0.3; intrusion_thresh +0.05 (held-in feelings intrude more, not less); verbal_dampen ×0.7 — they retell rarely and flatly | suppression taxes encoding — remembers less of hard days, stays hotter longer (Richards & Gross 2000; emotional-memory.md §17) |
| **Vicarious absorber / high-empath** (NEW v1.7) | `empathy_trait` →0.9; `contagion_k` ×1.4; `gen_width` +0.05 | hearsay scars them too — secondhand conditioning (Olsson & Phelps 2007) |
| **HSAM** (NEW v2.5 — population tail, ≤1% incidence; roster dial, unassigned by default; SUPERSEDED by the `hsam` trait v5.15, §49) | beta_episodic ×0.15 on selfRelevance≥0.5 records ONLY; §4.3 merge disabled for those records; retell ecology not needed for flat curves; **misinfo_suscept, phantom_p, drift_p, confab_fill UNCHANGED** — Patihis 2013: HSAM is not suggestion- or false-memory-immune, storage is extraordinary, reconstruction is ordinary | decades-old personal events stay dateable and vivid; still gets the details wrong (LePort et al. 2012/2017) |
| **SDAM** (NEW v2.5 — opposite tail; SUPERSEDED by the `sdam` trait v5.15 — decay leg re-parameterized retrieval-side, §49) | beta_episodic +0.4 on selfRelevance≥0.5 records; w_self ×0.7; ret_noise +; specificity −0.2; semantic/procedural params untouched; report-side: `conf` low on own-past episodic, normal on facts | knows the facts of their life without re-living them — "I know it happened, I don't remember it" (Palombo et al. 2015; surfaces as §6.7 nonbelieved memory) |

Optional derived param `specificity ∈ [0,1]` (default 1): on reconstruction,
with probability `1−specificity` return the generic/merged memory instead of
the episode — use for the depressive profile.

## 3. Worked examples (plausible cast slots, placeholders until bibles land)

Fully computed numeric derivations through the v1.0 compiler are in
`profile-generation.md` §7 (landlord-type 54, grieving barista 26,
high-reserve fixture 71).

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

## 6. v1.1 note — validation hooks for profiles

`memory/validation-design.md` adds population-level checks that constrain
profiles: (a) pairwise profile distinctness — the 8 mains' free-param
vectors must clear a Mahalanobis distance floor vs a random-cohort
percentile (P98, §6.1 there); (b) trait-structure preservation incl. the
named nulls over a 500-draw cohort (P99, §6.2); (c) age-curve conformance
sweep over the knot tables (P100, §6.3). Profiles themselves are
unchanged — these are tests OF the compiler output, not new compiler
rules. Clamp ranges in §0 are also the load-time validation contract
referenced by the harness (§2.2).

## 7. v1.8 note — false-memory II age/modifier sensitivity

The v1.8 params (false-memory.md Part II) are mostly age-flat; the
exceptions and deltas:

- **Child archetype:** `forced_confab_gain` ×1.5 (Ackil & Zaragoza
  developmental gradient, riding `child_internal_confuse`); `cb_detect`
  lower (0.2) — children own substituted outcomes readily.
- **Older-adult archetype:** `choice_support_gain` ×1.4 (knot at 80,
  Mather & Johnson 2000); `crypto_p` rides `discrim_mult`; `cb_detect`
  modestly lower (0.25).
- **Gossip modifier:** no new deltas needed — it already raises
  hearCount accumulation and audience_tune; under candidate competition
  its rumors simply outcompete more often (§6.3).
- **Depressive modifier:** `neg_gist_gain` ×1.5 — enduring negative
  mood is gist-dominant (Bookbinder & Brainerd 2016 trait clause);
  `consist_pull` targets a negative current self-model → pessimistic
  rewriting of the past.
- **Distrust trait:** reaches `coerced`→internalized flip faster
  (Gudjonsson memory-distrust path) — implement as ×1.5 on the §6.9
  flip check for `coerced:true` candidates only.
- **Deliberate null:** no per-character `cb_detect` tail below 0.1 —
  universal seam-ownership is the design intent; a character who
  detects every swap breaks the fiction.

## 8. v1.9 note — individual-differences II: new modifiers & sensitivity

The v1.9 params (individual-differences.md Part II) ride the trait
layer; archetype deltas:

- **Older-adult archetype:** `iiv_sigma` ×(1+age_eff/50) is already
  age-scaled — no extra knot; `aging_rate`/`fitness` variance should
  be sampled wider in this band (aging heterogeneity grows with age).
- **Child archetype:** `omit_p` higher (attentional lapses); `check_conf_loss`
  untested in children — keep default.
- **Depressive modifier:** gains `complaint` weight via neurot/distrust
  automatically (selfReport) — plus `meta_cal` slightly <1 (depressive
  realism in calibration, mild).
- **New modifiers for bibles:**
  - **Absent-minded** | inattn = +1.5σ → omit_p≈0.15, pm_self −0.08,
    enc_base ·0.95 — "walked right past it" personality.
  - **Meticulous checker** | checker = +1.5σ + distrust +0.5 →
    verify-call frequency up (behavior layer), check_conf_loss ·1.3 —
    re-verification erodes confidence, a self-sealing loop.
  - **Bilingual** | langs = ["es","en"] (etc.) → lang_mismatch applies;
    NO wmc bonus (Paap null).
  - **Interdependent upbringing** | culture_self = −0.8 →
    amnesia_exit +0.4y, w_people/routine-weighted records, sparser
    self-focused detail (Wang 2001).
  - **Bookworm / polymath** | gc = +1.5σ + verbal +1.0 → denser links,
    better knowledge-protection, MORE semantic-lure uptake (double
    edge, Castel 2007).
  - **The confident one** | meta_conf = +1.5σ → conf_bias +0.15,
    meta_cal ·1.15; accuracy untouched — persuasive and wrong as often
    as persuasive and right.
  - **The athlete / the couch** | fitness ±1.2 → functional-age offset
    ∓~9y at old ages (Erickson 2011).
  - **The survivor (fragmented)** | dissoc = +1.5σ + trauma modifier →
    trauma records split into weakly-linked fragments with lowered
    intrusion threshold.
- **Trait-drift note:** yearly maturity drift (Roberts 2006) is
  OPTIONAL; when enabled, bibles should pin late-life trait values,
  not early ones, to avoid double-counting.

## 9. v2.0 note — social-memory II: new modifiers & sensitivity

The v2.0 params (social-memory.md Part II) are mostly trait-ridden
rather than age-curved; archetype deltas:

- **Teen archetype:** `share_k` up (≈1.2 — social world over-shared at
  peak intensity), `canon_thresh` lower (≈4 — adolescent stories
  conventionalize fast), `corroborate_conf` up (peer consensus is the
  confidence currency of adolescence).
- **Older-adult archetype:** `corroborate_conf` rides the §6.20 knot
  (×~1.2 at 80); `copresent_assume_p` age-scaled up (source decline);
  `absorb_p` ×`discrim_mult` (older partners borrow each other's
  stories); `transact_loss` most visible here — long-bonded pairs have
  the deepest directories and the biggest gaps when one is gone;
  `secret_tag_mult` effective rate up via beta_source — older secrets
  leak more.
- **Child archetype:** `share_k` flat (children share too — Rimé);
  `copresent_assume_p` high (0.95 — worst common-ground tracking);
  `absorb_p` elevated under repeated suggestion (Hyman & Billings 1998
  developmental gradient).
- **Gossip modifier:** `share_k` up + `share_shame_pen` DOWN (the
  gossip shares what others suppress — shame is the whole commodity);
  `canon_thresh` low (their stories are told until they set).
- **The secret-keeper** | consc = +1.5σ → respect-roll trait term up,
  `secret_tag_mult` 1.0 floor — secrets die only with the content.
- **The blabbermouth** | consc = −1.0σ + extra = +1.0 →
  `share_shame_pen` ·0.3, `secret_tag_mult` 1.8 — secrets leak young.
- **Distrust trait:** `corroborate_conf` ·0.6 (less confidence-validated
  by agreement), `interpret_bias` up for negative targets.
- **Repressor/dysphoric:** unchanged — mnemic machinery handles them;
  `share_shame_pen` ·1.3 for the repressor.
- **Deliberate nulls:** no `g_mem` → `corroborate_conf` (smart people
  are social-validated too); no `vivid` → `absorb_p` (repetition and
  relevance do it, not imagery); `meta_cal` does not undo corroboration
  (inflation is to stored confidence, not report calibration).

## 10. v2.1 note — formal-model III: metamemory instruments & sim masks

The v2.1 additions are mostly population machinery (simOp masks, FOK
weights, JOL weights are frozen constants). Per-character surface is
small by design — metamemory variance is calibration, not organ
difference:

- **`fok_age_noise`** (clamp 0–0.5): the "knows less than they feel"
  trait. Older-adult archetype rides the age_eff formula (no manual
  bump needed); a midlife bible may pin it up for a genuinely
  declining character (frontal-linked deficit, Souchay 2000).
- **`jol_bias`** (clamp −0.3..+0.3): chronic self-under/over-estimator.
  The anxious bible modifier (neurot high) → −0.15; the confident
  modifier → +0.15. Deliberate null: jol_bias does NOT touch accuracy.
- **Modifiers:** "checker" bible modifier now also lowers fok_retry
  behaviorally (keeps digging — verify-mode callers consume fok);
  "absent-minded" raises jol_fluency sensitivity implicitly via lower
  E/fluency dissociation under lapse_p — no extra param.
- **Deliberate nulls:** no trait → sim masks (similarity is physics,
  not personality); no `vivid` → fok (imagery-rich people get higher
  partialScore through verbatim survival, which is the correct causal
  path); `meta_cal` does not correct fok (calibration is at report,
  the feeling is upstream).

## 11. v2.2 note — cast profiles: new trait, new bible dials, the 8 mains

`memory/cast-profiles.md` now compiles all 8 mains from the world-v14
bibles — that file is the per-character deliverable this doc always
promised. This note covers only what bibles/mods must know:

- **New IndivTraits axis `attach_avoid`** (trait 15; r(extra)≈−0.3,
  r(neurot)≈0 — Edelstein 2006 anxiety-axis null). Bible language that
  maps to it: "keeps her own life under lock and key," "filed in
  different drawers," "never stated," "reads silence as peace."
  Mechanism is PREEMPTIVE — `attach_encode_loss`/`attach_ret_cost` on
  `attachment:true` records only; the character is normal on everything
  except closeness. Five mains carry it at distinct σ (C7 +1.2, C8 +0.9,
  C4 +0.8, C5 +0.6, C1 implicit) — same trait, different phenotypes.
- **New trait `selfconceal`** (σ; loads `self_share_pen` +, and
  `secret_mindwander` ×(1+0.4σ) — Larson & Chastain 1990; Slepian 2017).
  Distinct from introversion: extraverts can self-conceal (C3 Dani).
- **New bible field `lifeEvents`** (ProfileInput): `{type:"immigration",
  age}` → `bump_windows` list (Schrauf & Rubin 2001) +
  `{type:"bereavement", age}` → regime overlay + PersonModel availability
  flip. C6 gets the bimodal bump; C8 gets the bilingual bump.
- **Modifier additions:** none — secrecy/avoidance ride traits+records,
  not modifier slots (the ≤3 rule stays enforceable).
- **Deliberate nulls:** `self_share_pen` does NOT touch `share_k`
  (curators exist); `attach_avoid` does NOT touch non-attachment
  emotional encoding (Edelstein boundary is the falsifiable core);
  `secret_mindwander` does NOT depend on concealment opportunities
  (Slepian: mind-wandering ≫ concealment, and only mind-wandering
  predicts the cost).

## 12. v2.4 note — encoding-mechanics II: state and content dials

Most v2.4 params need NO per-character work — they are event/context-
gated (detected, curiosity, willTeach, rested, domain match) and land
identically on everyone. What bibles and modifiers should know:

- **`name_penalty`** is age-automatic (×(1+age_eff/80)) — do not also
  pin it on the older-adult archetype or it double-counts. A bible that
  says "never forgets a name" should pin `name_penalty` LOW (~0.1)
  explicitly; that is a real, rare phenotype (super-recognizers of the
  name channel) and it overrides the age scaling.
- **`owngroup_loss`** rides world-supplied group tags + roster contact —
  never pin it as a personality trait. `contact_share` is computed, not
  authored; a character raised in a mixed neighborhood gets a low
  effective loss for free.
- **`expert_encode_gain`/`expert_detail_w`** are DomainTable-driven;
  expertise dials live in `cast-profiles.md`, not in this table. The
  deliberate null is the point: an expert outside their domain is
  ordinary (Chase & Simon random-board result) — never add a general
  "smart memory" bump instead.
- **`df_loss`** resistance is trait-loaded already (neurot>0 halves it;
  age_eff shrinks it ~30% by 80). The ruminator and the elder both
  fail at "forget I said that" through different routes — no extra
  modifier needed.
- **`curios_gain`/`curios_spill`** scale implicitly with `open` via the
  `curiosity` derivation — do not pin the gains on curious bibles;
  pin `open`.
- **`impl_intent_gain`** is population-flat; the personality dial is
  `consc` → *formation frequency* (planners vs drifters). A bible that
  says "always has a plan" raises consc, not this param.
- **`rest_gain`** stays flat across age (demonstrated in 61–87;
  Dewar 2012) — the one age-robust *quiet* channel. It is a lifestyle
  frequency dial too: hectic lives produce fewer rested windows
  automatically; don't pin the gain down for busy characters.
- **Deliberate nulls:** no trait → `abe_gain` (temporal orienting is
  machinery, not personality); no `wmc` → `abe_spill_mult` (the boost is
  a detection-bound burst, not capacity); `meta_cal` does not touch
  `name_penalty` (people KNOW names are hard — the deficit is real, not
  metacognitive); no positive-mood → teach_expect interaction (the
  effect is organizational, not hedonic).

## 13. v2.5 note — forgetting-curves III: calibration axioms and the tails

- **`ev_day_norm` is the only v2.5 param that differs by role tier** —
  30 for mains, ~10 for ambients (they encode fewer records). It is a
  load normalizer, not a personality dial; do not pin it per character.
- **`ev_time_w`** can drift mildly per character (busier inner lives feel
  time faster) but keep it in the lower half of the clamp for most —
  0.5 is the fitted default.
- **`affect_sleep_frac`** rides sleepQuality automatically — a bible that
  says "bad sleeper" sets `sleepFactor`/sleep flags, never this param.
- **`face_perma_thresh`/`fam_recog_gate`** are population-flat; the
  personality-level variation lives in PersonModel `familiarity`
  accrual (`owngroup_loss`, contact_share), not the freeze bar.
- **`transf_gain`** is machinery, not personality — no trait loading.
  If anything, low-`vivid` characters show its *effect* sooner because
  their verbatim fields die earlier, not because the gain differs.
- **`state_ctx_hl`** is population-flat (context fluctuation is
  physiology, not temperament).
- **Slope-invariance contract:** when compiling profiles, never express
  "remembers things better" as a lower β — use enc_base/w_* loadings
  (intercept) or retell ecology (clock). β differences are reserved for
  age curves, era terms, content class, and the hsam/sdam tails. This is
  now a probe-enforced axiom (P231).
- **HSAM/SDAM** (§2 modifiers): unassigned by default; they exist so the
  roster can express the real population tails. If a main is ever cast
  with either, recompile — the modifier touches β_autobio only, and the
  Patihis guard (distortion params untouched) is non-negotiable.
- **Reuse calibration (P239)** is a world-health metric, not a profile
  constraint — if it fails, tune the class defaults in spec §7, not the
  profiles.

## 14. v2.6 note — retrieval-cues III: which dials are personality

Almost all v2.6 params are machinery, not personality — they express
population-level retrieval mechanics, and the right per-character
variation enters through traits, records, and context instead:

- **`diag_w`/`diag_cap`, `sam_tau`, `kmax`** — retrieval machinery;
  flat across profiles. Perceived "good memory under cuing" differences
  come from enc_base/attention loadings, not these.
- **`reexp_ratio`/`test_gap_gain`** — the testing-effect constants are
  population-level; a bible that says "learns by doing" should express
  it as behavior (more self-generated recall occasions in the retell
  ecology), not a bigger ratio.
- **`expanding_bonus`** — machinery. The personality-level version of
  "tells the story at widening intervals" is a social habit, not a
  param.
- **`tnt_inhib`/`tnt_cap`** — keep flat; suppression *frequency* is the
  personality/occupation dial (a character who habitually avoids a
  topic calls suppressEvent more often). High-neurot and emotional-
  record resistance is already built in (×0.3) — do not double-count
  it on the trait side.
- **`invol_periph_gain`/`invol_topic_pen`** — flat; a mild `vivid`
  loading on invol_periph_gain (≤+0.3) is defensible for imagistic
  characters, nothing else.
- **`intent_sup`/`monitor_cost`/`pm_commission_*`** — machinery; the
  bible-level dials are intention *formation* frequency (`consc`,
  already loaded) and attention headroom. pm_commission_p's age
  scaling is automatic — never pin it on an elder archetype.
- **`selfinit_pen`/`selfinit_bar`** — age-automatic (×ageScale);
  pinning it per-character double-counts the decline curve.
- **`ease_n`** — flat; a chronically self-doubting bible wants
  `meta_conf`/`self_est_bias`, not a lower ease point.
- **`intrusion_thresh` is now age-flat** (spec §5.7, v2.6) — remove it
  from any archetype's age-knot reasoning; older spontaneous recall is
  throttled by `search_breadth` alone. Profiles that pinned it lower
  for a "keeps popping up the past" elder should express that via the
  scan's verbatim-richness exposure instead (denser cueVector encoding
  → more peripheral cues to trip on).
- **Deliberate nulls:** no trait → `diag_w` (diagnosticity is corpus
  statistics, not temperament); no `extra` → `monitor_cost` (the tax
  is capacity, not sociability); no `open` → `ease_n`.

## 15. v2.7 note — age-development III: machinery vs bible dials

- **`first_gain`/`transition_gain`** — encode-side machinery; the
  *bible* dial is whether the character's life contains firsts and
  transitions (world supplies the flags). A bible that says "her
  twenties were unusually eventful" should be expressed as more
  first/transition-tagged records in the seed pool, not a bigger gain.
- **`social_eval_gain`** — teen-knotted automatically; per-character
  variation enters via `social`/`neurot` loadings on whether the
  character *experiences* an event as evaluated (world side), not the
  gain itself. A socially-anxious teen isn't a bigger multiplier —
  she's more `evaluated:true` events.
- **`coruminate_gain`** — the one genuinely personality-loaded v2.7
  param: load on `social` + `sex` (Rose 2002 girl-skew) + `neurot`;
  requires a close PersonModel to fire, so roster loneliness
  suppresses it mechanically. High-`coruminate_gain` + high `rumin_k`
  teen = the OGM-risk profile; keep the age ≥12 gate.
- **`adolesc_sleep_loss`, `pi_child_mult`, `pm_interrupt_mult`,
  `pm_scaffold_gain`, `narr_*`** — developmental machinery, flat;
  age knots do all the work. Never pin per-character.
- **`script_date_pull`** — flat; the personality-relevant piece is the
  `script_age` table (world-builder content, culture-locked). A
  character who married at 45 when her script says 27 needs no dial —
  the off-script sigma penalty produces the blurry dating for free.
- **`preg_*`/`perim_*` overlays** — profiles-supplied *windows*, not
  traits: bibles declare when the window ran (or world triggers it);
  the magnitudes are population values. `perim_s_gain_mult` ≈ 0 is
  the SWAN signature — resist the urge to "soften" it per-character;
  the inter-individual variance lives in `perim_years` and whether
  the bible schedules the window early/late.
- **Deliberate nulls:** no `g_mem`/`wmc` → any child knot (immaturity
  is maturational, not trait); no `consc` → `pm_scaffold_gain` (the
  scaffold is the caregiver's presence, not the child's diligence);
  no `extra` → `narr_link_gain` (narrative consolidation is not
  sociability); no trait → `preg_recog_spare` (frozen population rule).
- **Archetype deltas:** child knot additions — `lure_accept` ~1.6 at
  5 (item-discrimination immaturity — do NOT confuse with the
  gist channel), `pm_interrupt_mult` 1.5, `pi_child_mult` applies;
  teen archetype — `peak_hour` +1.5h, `adolesc_sleep_loss` active,
  `social_eval_gain` ×1.3, `coruminate_gain` ×1.5, narr_window open.

## 16. v2.8 note — age-decline III: the paradox layer dials

- **`hearing`** — the one genuine trait this pass: bible-level sensory
  history (occupational noise, genetics), age-correlated mean drift
  (~0.95 at 50 → ~0.7 at 85) with trait jitter; a 75yo dance-club
  veteran can pin 0.5 against the mean. Feeds `noise_cost` (scene
  texture, not a deficit dial) and the `isolation` ledger — wiring a
  hard-of-hearing elder to a noisy workplace IS how the overlay
  triggers, which is the point.
- **`pm_habit_gain`, `ii_age_gate`, `sync_lure_gain`, `potent_window`,
  `rm_self_confuse`, `invol_*`, `enc_sem_mult`, `iso_*`,
  `med_*`** — decline machinery; age knots do the work. Never pin
  per-character beyond the clamp; world supplies triggers
  (noise_level, overlays, partnerDeath), not magnitudes.
- **`know_corr_gain`** — flat machinery; per-character variation is
  EMERGENT from semantic-store density (a scholar's `know_density` is
  high because her semantic records are many and strong, not because
  her gain is bigger). Do not pin it high on "smart" characters —
  that's double-counting. The bible dial is what she knows, not how
  well she checks.
- **Deliberate nulls (cite-guarded, spec §7):** `pm_focal_hit`,
  `enact_gain`, `rep_gain`, involuntary-scan rate, `metamem_r`,
  `warn_mult` get NO age knots — these are the spared channels;
  touching them breaks P263/P266/P268.
- **Archetype deltas (older adult, archetype E):** `pm_habit_gain`
  knot active, `rm_self_confuse` 0.10–0.18, `hearing` ~0.7–0.85,
  `invol_pos_gain`/`invol_remote_gain` on, `self_est_bias` drifted
  negative — she underestimates a monitoring system that still works.
  The loneliness-prone elder (widowed, low `social`) is a *roster*
  fact feeding the `isolation` overlay, not a params fact.

## 17. v2.9 note — emotional-memory III: which dials are personality

- **`emotion` is a record tag, not a param** — world-builder bibles can
  bias which emotions a character *experiences* (event-side), but the
  memory consequences (`fear_detail_gain`, `anger_gist_bias`,
  `disgust_gain`) are machinery — keep at defaults unless a bible
  explicitly describes an atypical appraisal style (e.g., a
  chronically angry character might push `anger_gist_bias` to 0.25:
  his grievances are reconstructed, not kept).
- **`trust_*` is the cast-relevant dial.** `trust_neg_gain`/
  `trust_pos_gain`/`person_cond_decay_mult` are where personality
  legitimately enters: the suspicious landlord pins trust_neg_gain
  high AND trust_pos_gain low (trust arrives on foot, leaves on
  horseback — harder); the gregarious barman flips the ratio modestly
  (never above parity — the asymmetry is human, not cynicism). Loads
  on `distrust`/`neurot` traits where present.
- **`coh_gain`/`coh_intrusion_k`** — machinery; per-character variation
  is emergent (who tells their story, to whom, how fully). A secretive
  bible character heals slower because she retells less, not because
  her coh_gain is pinned low — do not double-count.
- **`anniv_*`, `odor_*`, `wf_*`, `arousal_opt/curv`, `hc_gap_*`,
  `emo_update_k`** — machinery with age knots only (spec §7 note);
  never pin per-character.
- **`recall_mood_pull`/`nostalgia_gain`** — mild personality latitude:
  a sentimental bible character may take nostalgia_gain 0.2; a
  stoic takes recall_mood_pull 0.02. Keep small — these are feedback
  edges; large values create mood spirals.
- **Deliberate nulls:** discrete-emotion multipliers, `emo_update_k`,
  `odor_*`, `anniv_*`, `wf_*` carry NO age knots (spec §7) — touching
  them breaks P274/P276/P277/P278/P281.

## 18. v3.0 note — false-memory III: which dials are personality

- **`transplant_gain`/`orb_gain`** — the one genuinely bible-relevant
  dial this pass. A lifelong-Mission local (dense familiar-person
  store, narrow category exposure) transplants MORE within his own
  milieu and misidentifies MORE across unfamiliar categories —
  `orb_gain` 0.5–0.9 for low-diversity bibles, 0.1–0.3 for a
  cosmopolitan one. Do NOT pin `transplant_gain` by "gullibility" —
  it rides `discrim_mult` and PersonModel density; a sociable
  character transplants more because she KNOWS more people, not
  because her knob is bigger.
- **`conj_migrate_p`/`conj_thresh`** — machinery. Variation is
  emergent (a creature-of-routine generates more near-miss episode
  pairs → more migrations at identical params). Routine-heavy
  bibles supply the substrate; don't also raise the param.
- **`be_gain`** — machinery, age-knotted. The hipster who sketches
  and the accountant both overshoot scenes ~12%; visual-training
  bibles do NOT earn a discount (BE resists expertise in the
  literature — Intraub's perceptual-schema claim).
- **`neg_cand`/`neg_frame_mult`/`neg_age_gain`** — machinery.
  Whether a character *issues* denials is world content; how the
  denial corrupts the listener is spec. `neg_age_gain` fires >65
  only — do not extend downward for "fuzzy" younger profiles.
- **`vo_*`** — machinery, AGE-FLAT by cite-guard. The rambling
  storyteller describes faces *more often* (retell frequency —
  world content), which is how VO reaches him; his `vo_cand` stays
  default.
- **`react_*`, `phantom_recoll`, `group_damp`, `truthy_gain`** —
  machinery, AGE-FLAT by cite-guard (Chan 2009 both cohorts; VO/
  truthiness lack age-gradient evidence). `truthy_gain` may take a
  modest trait load on `distrust` (suspicious −, credulous +, keep
  within ±0.05) — fluency-sensitivity is the softest personality
  hook here.
- **Deliberate nulls (spec §7):** `vo_cand`, `vo_loss`,
  `react_suscept_mult`, `phantom_recoll`, `group_damp`,
  `truthy_gain`, `conj_thresh`, `cat_resist` carry NO age knots —
  P286/P291/P295 guards.

## 19. v3.1 note — individual-differences III: phenotype bundles and the
## nulls that define them

Seven new trait axes (individual-differences.md §30). The design rule
this pass: **a phenotype is defined as much by what stays normal as by
what breaks.** Pin accordingly — do not leak signature loads into
params the literature holds flat.

- **`face_ability`** — the cleanest dial. Loads ONLY on the §5.10
  cascade. A face-blind bible character (≤−2σ, ~2.5% prevalence —
  Kennerknecht 2006) fails tier-1 familiarity on repeat encounters but
  remembers the conversation verbatim: compensate in fiction via
  voice/gait/context cues (the real DP strategy), NOT by raising
  `identity_thresh`. A super-recognizer (≥+2σ) mints PersonModels off
  single crowded-room glances. NEVER co-pin episodic params — the
  dissociation is the phenotype (P298).
- **`adhd`** — acquisition-deficit bundle: pin `adhd` σ, leave
  `beta_*`/`theta` untouched. The character *was there but didn't get
  it*: meetings evaporate (omit_p), names and spoken details thin
  (verbal vivid_detail), intentions die (pm_self), new learning is
  fragile for ~24h (interf_k on fresh records), and day-to-day
  consistency is low (iiv). `hyperfocus_gate` gives the counterweight —
  high-interest events encode *better*; if playtests make him a
  super-encoder, drop the gate before touching the consensus loads.
- **`asd`** — the FTT reversal: pin `asd` σ for a character whose
  memory is *more literal* — fewer gist-phantoms, fewer leading-
  question adoptions, verbatim residue that outlasts everyone's, BUT
  more source confusions ("did I say it or did they?") and thinner
  self-narrative specificity. Do NOT also cut `misinfo_suscept` on
  rumor content — the resistance is to leading questions, not to
  learning from talk (P300 guards the split).
- **`suggs`** — interrogative suggestibility. Distinct from `distrust`
  (self-doubt) and `fantasy` (generation): the high-suggs character
  *yields* — adopt unverifiable claims faster, and flip their own
  report under authoritative pushback while privately still believing
  it. For bibles: a people-pleaser pins suggs+compliance (Shift-heavy);
  a merely-uncertain one pins distrust. The difference shows under
  `negativeFeedback`, not in baseline gullibility.
- **`vigil`** — the lonely/vigilant profile. Social-threat events
  encode hotter and come back more on recall — but recognition is
  untouched and non-social records untouched. Pair with `social` −σ
  for the loneliness composite; do NOT use it for general pessimism
  (that's neurot).
- **`aim`** — amplitude, not valence. The high-aim character's
  emotional events encode hotter on BOTH valences and link more —
  neutral days are identical to everyone else's. This is the trait for
  "she feels everything", NOT for "she's always upset" (that's neurot).
- **`hand_mix`** — flavor dial with real phenomenology: tiny
  episodic-recall edge + slightly better source memory, nothing else.
  A lefty character remembers conversations a bit better and
  misattributes them a bit less; nobody should be able to see the
  difference except in cohort stats.
- **States, not traits:** `meno` (midlife female profiles, ~45–55,
  self-limiting — complaints > deficit is accurate), `preg`
  (trimester-3 gate), `intox.kind` ("cannabis" — thinner window
  encoding + acute yes-bias; the stoned witness believes the rumor,
  not forgets the event). Menstrual cycle: deliberately unimplemented.
- **`name_fan`** — emergent, not a dial: directory size does the work.
  The bartender blanks names at default params; the recluse doesn't.
  Do not pin `name_fan_k` to make a character "bad with names" — give
  her a bigger world instead.

## 20. v3.2 note — social-memory III: the dyadic dials and who reads them

Eleven new mechanisms (social-memory.md §§32–47). The bible-facing
rule this pass: **a character's social-memory signature is mostly in
WHOSE ledger they keep well, not whether they're "good with people."**

- **`PersonModel.eval`** is the new dial everything reads — world-
  builder's relationship matrix can mirror it but shouldn't replace
  it: eval is *memory's* opinion (recomputed from traits, moral-
  primary), so it lags, distorts, and disagrees with any ground-truth
  affection score. Pin `moral_primacy` high for judgmental characters
  (moral info is all they weight) and `moral_rehab` LOW for the
  unforgiving profile — one moral-negative act and they never update
  back. The landlord with `moral_rehab` 0.15 + `sit_credit` 0.9 is the
  interesting one: they hold the grudge forever AND correctly blame
  the situation, so their coldness is *accurate*, not petty.
- **FAE dial pair:** `sit_credit`/`correct_gate` is "do they make
  excuses for people." High-WMC social characters get high sit_credit
  — they're the ones who say "she was having a bad day." Low-wmc +
  low-attention profiles infer raw traits: the gossip who saw one
  stressed moment and filed "rude." P311 sign-locks the attention
  gate — do NOT pin sit_credit low to make someone judgmental; pin
  their attention/wmc and let the mechanism do it.
- **Status params need world tags.** `status_encode_gain`/
  `power_encode_loss` are dormant without a `status` tag — the
  landlord/tenant axis is the game's built-in case. Bible guidance:
  pin `power_encode_loss` HIGH on a status-insulated character
  (remembers "types" of tenants, not tenants) and pair `individ_rate`
  low — the two params compose into "never learns the help."
- **`dest_decay_mult`** is the "do they remember telling YOU" dial —
  flat for most profiles; the age loading does the work at 65+. For a
  non-elderly character who repeats stories anyway, pin
  `dest_decay_mult` ~2.0 + `told_pen` ~0.3 (doesn't even try to avoid
  repeats) rather than touching `dest_mem` knots — the edge-decay
  mechanism is the v3.2 path, `dest_mem` is the legacy fallback.
- **`heard_update_w`** is the gullibility-of-impressions dial,
  distinct from `misinfo_suscept` (which is about facts): a character
  can be skeptical of claims yet have their *opinion of a neighbor*
  moved by gossip — pin heard_update_w high + misinfo_suscept low for
  "trusts facts, absorbs vibes" (P315 guards the decoupling).
- **Disclosure pair** (`disclose_eval_gain`/`disclose_trust_gain`)
  is the intimacy dial: high-social characters both disclose more
  (world behavior) AND update more per disclosure — the friendship
  IS the epistemology. For a guarded profile pin both near 0 AND
  `shared_reality_gate` high: secrets stay secrets and so does trust.
- **`transference_*`** is for characters with one dominant
  relationship schema — "everyone's either my brother or my ex."
  Pin `transference_seed` ~0.5 + `transference_pool` 2 on such a
  bible: new acquaintances inherit the archetype and the confabulated
  history fades only as `individ_rate` accrues. Null default for the
  other seven mains — transference is a signature, not a spice.
- **`novel_pick_w`/`told_pen`/`phrase_*`** mostly stay default —
  they're ecology params, not personality. Exception: the one
  character famous for telling the same story verbatim gets
  `phrase_distinct_mult` ~2.0 + `told_pen` ~0.8 (their catchphrase
  survives every hop — which is how the history browser will trace
  their rumors back to them).

Explicit nulls preserved: `g_mem` doesn't buy FAE exemption (the
correction stage is resource-gated, not ability-gated — P311);
`face_ability` doesn't change `exposure_fam_gain` (DP accrual rides
`fam_gain` instead); `meta_cal` doesn't fix destination memory.

## 21. v3.4 note — character-profiles II: the narrative-self dials

Four new personality surfaces and one tier template. The v3.4 dials are
the ones a bible writer will *reach for* most often — they map directly
onto prose like "she's the kind of person who always lands the story
well" or "he genuinely doesn't remember being criticized" — so the
guidance is mostly about not double-counting:

- **`selfdef_*` (anchor layer):** bibles nominate CONTENT
  (`seedHints` → records with `selfdef:true` + `meaning` + `sdmCat`),
  never the params. `selfdef_cap` is nearly a population constant —
  pin it 7–8 only for a narrator-character whose identity is visibly
  built of stories; `selfdef_drift_mult`/`selfdef_cue_gain` stay
  default for the whole cast (the effects are ecological, not
  temperamental). The ONE per-character surface is
  `selfdef_spec_mult` via trait `defens` — repressive-defensive
  characters hold *vague* anchors (Blagov & Singer 2004). Do NOT pin
  `defens` from a bible that merely says "private" — that is
  `selfconceal`; `defens` is the Weinberger pattern (low distress
  report + high defensiveness markers). C7 Victor is the cast's
  clear case; C1 Marisol reads selfconceal-high, defens-moderate.
- **`mnem_neg` (self-protective forgetting):** recall-only, self-only,
  central-diagnostic-only. Pair guidance: a character with high
  `mnem_neg` AND high `mnem_close_relief` forgets strangers' insults
  but absorbs a friend's correction — healthy self-protection. High
  `mnem_neg` + LOW `mnem_close_relief` is the brittle profile (nobody
  can tell them anything) — reserve for the most defended cast
  member. Never use `mnem_neg` to make a character "modest" — the
  effect is a *recall* failure; their stored self-knowledge is
  unchanged (recognition path intact, P337).
- **`script_redeem` (life-story valence transform):** a direct bible
  pin in [−0.8, 0.9], NOT trait-derived — a character's redemption
  score is authored, not sampled (McAdams 2001 tracks wellbeing/
  generativity but is measured from narratives). Guidance: warm
  generative elders/cooks get +0.6 to +0.8; the compartmentalized
  suppressor gets −0.4 to −0.6 (their good stories spoil in the
  telling). `redeem_write` stays default cast-wide — it is the rate
  limit, not the direction.
- **Life-script trio** (`neg_now_pull`, `script_age_pull`,
  `invol_pos_bias`): mostly age-ecology, not personality. The only
  per-character override is `invol_pos_bias` HIGH on profiles already
  carrying `positivity_gain` high (the same motivational current)
  and LOW on dysphoric/menaced profiles — a frightened character's
  mind wandering should not arrive cheerful.
- **Ambient tier** (`ambient_cap_mult`, `ambient_trait_sigma`):
  population constants for the 20-NPC pool, never per-NPC pins —
  ambient diversity comes from role tags (PersonModel categories)
  and `cat_prior_pull` HIGH + `individ_rate` LOW defaults, which is
  exactly the category-first individuation the literature predicts
  for thin-attention witnesses (Fiske & Neuberg 1990, v3.2 §40). On
  promotion to main, re-sample IndivTraits at full σ and backfill a
  SelfModel — the promoted NPC's *records* are real and thin, never
  rewritten.

Explicit nulls preserved (P334/P337/P338 guards): `selfdef` records
do NOT get verbatim protection — anchors drift on wording, hold on
meaning; `mnem_neg` does NOT touch recognition, other-target
feedback, or peripheral-trait criticism; `script_redeem` does NOT
edit content fields — only `meaning` — so a redemption-teller's
facts stay checkable; `defens` does NOT load `self_share_pen` (that
is `selfconceal`'s channel — the two traits dissociate, which is
why a secretive-but-unrepressed character keeps a vivid inner life).

## 22. v3.5 note — encoding-mechanics III: which of these are personality

The v3.5 layer is mostly ECOLOGY — perceptual load, interruptions,
turn position, pending errands, device habits — supplied by the world
and dialogue layers, not the bible. The per-character surfaces:

- **`wm_cap` / `cap_spill`:** the one true capacity dial. Jitter
  `wm_cap` ±1 on `wmc` (already correlated); `cap_spill` high fits a
  character who catches stray details — pair it with high `vivid_detail`,
  never as a substitute. Do NOT raise `wm_cap` to make a character
  "smart" — it only widens the record, it doesn't deepen it; depth is
  `elab_gain`'s job.
- **`offload_propensity` (bible habit, not a param):** how often the
  world emits `offload` events FOR this character — the phone-first
  personality. High on a documentary/tech-forward cast member; near
  zero on the notebook-keeper and the distrustful elder. The `extref`
  pointer then writes automatically. A high-offload character's archive
  SHOULD feel hollow — lots of "it's on my phone" reconstructions.
- **`threat_drain` (via traitAnx):** rides the existing `neurot`>0
  loading — no new trait. The nonanxious floor (0.3·threat_drain) is
  a population constant; pin `threat_drain` high only on profiles
  already carrying threat-vigilance machinery (v3.1 socialThreat,
  trauma profiles). A calm profile under threat_drain 0.6 reads wrong —
  the meta says the bias nearly vanishes without anxiety.
- **`residue_load`:** mild personality surface — ruminative profiles
  (high neurot, high stress-state) may take +0.1; the Leroy moderators
  (interrupted ×1.3 / closedClean ×0.5) are frozen and apply to all.
- **`pending_intrude`:** mostly state (how many open loops the world
  hands the character). Slightly higher default on scatterbrain/
  low-consc profiles — they hold more intentions AND feel them more.
- **`next_inline_cost`:** population-flat. The behavior it produces
  ("knows their own line, not your reply") needs no trait — but a
  socially anxious profile may be flagged `floor_next` MORE often by
  the dialogue layer (rehearsing responses), which is the real
  individual-difference channel.
- **Ecology-only, never pin:** `load_*` (scene property), `floor_next`
  (turn queue), `pre_sleep_gain` (flat — adjacency is physics),
  `ctx_var_add` (flat — the world decides how varied a life is;
  a stay-home routine life gets fewer doors naturally).

Explicit nulls preserved (P358/P360/P364/P365 guards): `wm_cap` does
NOT raise E or elaboration — it caps width only; `offload` records
are NOT deleted, they keep cue access via extref; `threat_drain` does
NOT scale with arousal (that is ABC's channel — a scary stimulus and
a scary event are priced separately); `load_flag` is permanent like
sleepdep_flag — born-in-a-crowd records stay suggestion-prone.

## 23. v3.6 note — forgetting-curves IV: which of these are personality

The v3.6 layer is mostly BIOGRAPHY — the world supplies transitions,
trauma events, rest spans, and languages; the bible supplies who lives
a chaptered life and how it lands. The per-character surfaces:

- **`bilingual_bal`:** the one clean bible dial. Pin by biography
  (heritage + usage), not by intelligence — a second-generation
  character who dreams in English sits ~0.3; the recent migrant who
  still thinks in Spanish ~0.0; the truly balanced switcher 0.8–1.0.
  Ambients default 0.3. Its visible signature is whether an English
  conversation can reach Spanish-encoded memories.
- **`intrude_hl` / `ptsd` modifier:** `intrude_hl` rides neurot/trauma
  profile — the 7d default suits everyone; trauma-flagged records get
  90d automatically (record-level, not profile-level). The `ptsd`
  profile modifier (∞) is reserved for clinical-severity profiles —
  do NOT hand it out for flavor; P373's persistence sign is what
  makes it heavy.
- **`pa_gain`:** mild personality surface — the raconteur profile
  (high social + high retell_boost) may take +0.1–0.2; reticent
  profiles lower it. `pa_cap` is population-flat.
- **`aff_recon_scale`:** near-flat. Higher fits characters whose
  feelings are re-authored by current relationships (consistency-
  driven profiles, high defens); lower fits affect-literal profiles
  who hold grudges against the evidence. Never zero — the blend must
  always be reachable.
- **Period structure is world-owned:** `registerTransition` fires on
  world events (moves, jobs, relationships, deaths) — the bible only
  decides WHICH events count as transitions for this person (a
  roommate change is a period boundary for a homebody, noise for a
  drifter). `xperiod_pen`/`period_prime`/`trans_*` are population
  params, not traits.
- **Modality slopes (`k_*`, `olf_cue_gain`):** population constants —
  nobody's nose forgets differently. Individual smell acuity is a
  *sensory-encoding* question (lives at event-capture), not a decay
  parameter.
- **Ribot windows (`retro_*`, `pta_*`):** population-flat — the
  gradient is biology, not personality. A trauma-prone profile changes
  how often §4.19 FIRES (trauma_thresh via modifiers), never the
  window shape.
- **Latency channel (`lat_*`):** display-side, population-flat. If a
  bible wants a "slow deliberate" character, the knob is speech
  cadence in the dialogue layer, not lat_base — memory latency is
  not a personality trait (P374 keeps it honest as an R-observable).
- **`bump_pos_min`:** population-flat sign-lock (Rubin & Berntsen) —
  profiles may NOT re-open the bump window to negative records;
  painful-memory survival is rumin_k + floor, by design.

Explicit nulls (guards): `period` reset does NOT erase pre-transition
records — PI release is prospective (old pools simply stop gaining
competitors); `intrude_w` decay does NOT touch `intrusion_thresh` or
the trauma re-stamp — three channels stay separate; `rested` n_sim
exemption is first-day only, not a permanent shield.

## 24. v3.7 note — retrieval-cues IV: which of these are personality

The v3.7 layer is mostly ECOLOGY — load, stress, boundaries, and who
is doing the asking arrive from the world, not the bible. The
per-character surfaces:

- **`repair_p`:** the clean bible dial. Self-soothers (warm,
  emotionally skilled profiles, often high extraversion or earned-
  secure) sit ~0.5–0.7; stoic profiles who simply endure bad moods
  without reaching for memory ~0.3; depressive/ruminative profiles
  ~0.05 — the Josephson consecutive-negatives pattern emerges for
  free under the rumin modifier. NEVER set high on a character the
  bible wants melancholic; repair is the difference between sadness
  and gloom.
- **`deja_prop`:** mild trait surface. Dreamy/absorbed or
  fantasy-prone profiles may take 0.4–0.5 (they NOTICE the signal);
  concrete/literal profiles 0.1–0.2 — the familiarity still fires,
  it just never reaches awareness. Age_decline curve applies on
  top; do not hand-tune per age band.
- **`selfcue_mult`:** near-flat. It prices a cue property (who
  generated it), not a capacity — a verbal/high-elaboration profile
  may indirectly mint more self-origin cues (their narrations
  become their own cues) without touching the multiplier.
- **`fam_bar`:** flat-ish. Lower it 0.05–0.1 only for profiles
  whose bible already runs loose source-monitoring (high
  confab_fill) — a character who lives at the edge of "have I been
  here?" is a source-monitoring phenotype, not a familiarity
  phenotype.
- **DA/stress/boundary params (`da_*`, `stress_*`, `boundary_*`,
  `doorway_pen`, `post_boundary_win`, `pm_action_p`, `fwd_*`,
  `iso_first`, `ssrif_out_mult`):** population constants. Age
  enters through `ageScale` inside the formulas, not through
  profile knots. `ssrif_out_mult` is relational — the in-group
  judgment comes from PersonModel, so a clannish profile shrinks
  its effective in-group (fewer speakers qualify), a trusting one
  widens it; the multiplier itself never moves.
- **`pm_vague_win`:** flat. The vague-shell state is a retrieval
  phenomenon, not a personality one — a bible expresses it through
  dialogue (the character who narrates "I came in here for
  SOMETHING"), not through the parameter.

Explicit nulls (guards): `postRecallDay`/`fwd_win` is E-side, not a
trait — retelling does not become a personality buff; `repair_p`
flips the CONGRUENCE SIGN only inside a repair-mode bout — it does
not invert mood-congruent selection globally; `pm_vague` is a
retrieval state flag, never a stored intention change — the
intention record itself is intact.

## 25. v3.8 note — age-development IV: what a bible can and can't move

The v3.8 layer is mostly ERA machinery — it reads `encodeAge` and
`age_now`, not personality. Per-character surfaces:

- **`reminiscence_env`** (v1.5, unchanged): still the dial that
  moves the child's amnesia boundary — it also feeds
  `verbal_age`'s effective knots in spirit (an elaborative
  household accelerates productive language; profiles may shift
  the verbal_age knots ±0.5y with it — documented coupling, not
  a new param).
- **Stereotype strength (PersonModel rigidity):** the real input
  to `schema_assim_p` — a bible sets *which* schemas a child
  holds hard (gender, class, "how birthdays go"), not the rate.
  A child raised with rigid role expectations normalizes
  violations more; a low-stereotype child shows no differential,
  per Liben & Signorella.
- **`low_reserve`:** now carries the OLD midlife knots (enc_base
  .84@50 etc.) — reserve it for bibles that want the declining
  50-year-old as a phenotype (sedentary, disengaged, ill), not as
  the population default.
- **Population-flat:** `choose_p` curve, `taint_exit`,
  `date_loc_exit`, `stress_flip_age`, `script_default_age`,
  `verbal_lock_thresh`, `embellish_p` — developmental constants.
  `sem_accrual` may ride `expert_gain`'s `depth` for domain
  knowledge only; the population curve is the default.

Explicit nulls (guards): `verbal_void` is a record property — no
profile makes a character narrate preverbal traces; `forced_pick`
confidence suppression does NOT exist (children choose
confidently — do not add a humility dial); script-mode intrusion
fields are emitted as ordinary fields — a profile cannot flag
them uncertain.

## 26. v4.1 note — false-memory IV: which instrumented dials are personality

- **`self_cred` (clamp 0.8–1.0):** self-as-source credibility ceiling
  for swapReport (§6.46). Default 1.0 — everyone trusts their own
  prior testimony more than anyone's gossip. Lower only for
  memory-distrust phenotypes (`distrust` high): the character who
  already doubts his own mind can be talked out of his own report.
  This is the rare case where a TRAIT makes a channel weaker.
- **`traitValence` (clamp −0.6..+0.6):** the per-character valence
  baseline that moodcong_lure matches (§6.8 selection). Set from the
  bible's dominant register, not computed — a melancholic profile
  phantomizes the negative schema detail; the genial one the warm
  one. Orthogonal to rumination (rumin_k controls volume/repetition;
  traitValence controls WHICH falsehoods).
- **`mb_detect` rider:** discrim_mult already scales it (old → more
  blind); do NOT add a separate trait dial — source-monitoring
  ability is the single moderator the literature supports.
- **Flashbulb exposure is situational, not a trait:** every profile
  gets fb_conf_floor at 0.75; what varies is how many public events
  reach arousal_tag ≥0.8 — an emo_rate-high life mints more
  flashbulb records, but none of them is more honest about it.
- **`distrust` and the expectancy loop:** high-distrust characters
  are the coerced-internalization pipeline's prey (§6.45 loop lands
  hardest); bible note: interrogated-often characters (the landlord's
  nervous tenant, the kid) get expect_press effectively ×1.3 through
  compliance, matching the Gudjonsson path already in §15.
- **Population-flat:** fb_conf_floor, verb_pull, lp_detail_p,
  fb_conf_gain/fb_disconf, retro_inflate, expect_*, ssif_suppress,
  emit_omit, im_act_*, discrim_recover, moodcong_lure (the
  coefficient; the matched target is the trait above).
- **Explicit nulls:** no profile may raise discrim_recover past 0.6
  (source discrimination helps, never sterilizes); no profile may
  floor confidence on non-flashbulb records; no trait exempts a
  character from listener SSIF (silence edits everyone); there is no
  "immune to question wording" dial — the only defenses are verbatim
  strength and the §6.50 discriminate mode itself.

## 27. v4.2 note — individual-differences IV: the clinical phenotypes
## and the everyday pharmacopeia

- **`depr`/`ptsd` are pinned severities, not free traits.** Both are
  0..1, bible-set from backstory (the cast's grief and history are
  authored, never sampled). `depr` is the *episodic* axis — pair it
  with `depr_state` runtime gating: a character in remission still
  tilts positive-cue recall coarser (0.3 floor) but the full
  signature needs the episode. A high-depr + high-dampen + high-
  rumen profile is the depressive cluster — negative maintained,
  positive thinned at every stage. Never write a depr profile whose
  encoding fails globally: the literature's deficit is
  *specificity*, and P433 is watching for it.
- **`ptsd` composes `dissoc`, never replaces it.** dissoc is the
  peritraumatic encoding state (Part II); ptsd is the chronic
  phenotype — sensory-gated intrusions, negative-cue OGM, effortful
  avoidance. A trauma backstory without ptsd is legitimate
  (exposure ≠ disorder — Moore & Zoellner); ptsd without a
  trauma:true record history is not.
- **`attach_*` needs `attach:true` tags to exist.** World-builder
  must tag attachment-relevant events (attachment-figure scenes,
  rejection/loss/reliance) or both traits are inert. The avoidant
  profile only becomes legible when `depleted` fires — write the
  tired-evening beat or the suppression never releases.
- **`persp_obs` is narration flavor with a mechanism.** High
  persp_obs characters say "I watched myself…"; older records push
  everyone toward it. The depr term is positive-only — the
  melancholic distances herself from the good day, not the bad one
  (Nelis). Do not store `persp` on records; it is emitted per
  reconstruction.
- **`supp`/`reap` are the regulation pair, asymmetrically.** supp
  high = the poker-faced character who forgets the meeting;
  reap is deliberately loadless — a bible may set it for
  personality coherence, it must never buy a memory benefit or
  cost (P439's null half).
- **`mindful` is the anti-caricature dial.** The meditator recalls
  more precisely AND adopts lures more readily (mind_lure,
  mind_rm_loss — sign + locked). Never let a high-mindful profile
  become the cast's reliable narrator.
- **`smoker`/`nic_dep`/`caff` are scheduled, not sampled.** The
  world's routines set the states; the trait flags vulnerability.
  Smokers lose PM and don't know it — `complaint_k` untouched is
  part of the phenotype (Heffernan). Caffeine buys pattern
  separation in the consolidation window only; it is not an
  encoding drug (Borota hit-rate null).
- **Population-flat:** pos_spec_loss, neg_ogm, trauma_sens_intr,
  frag_p, avoid_suppress, depl_release, attach_field_loss,
  persp_age_gain, persp_affect_loss, supp_enc_cost, mind_lure,
  mind_rm_loss, scc_consist_gain, smoker_pm_loss, nic_dep_pm,
  caff_consol_gain — the *coefficients* are population constants;
  the traits are what vary. `search_cost_mult` is the exception —
  it IS pspeed's surface.
- **Explicit nulls a bible cannot override:** no trait exempts the
  suppression tax (only not-suppressing avoids it); no profile
  makes observer mode *more* detailed than field mode; no profile
  gains above-baseline memory from nicotine or caffeine; reap
  stays zero-loaded; attach effects stay inside `attach:true`.

## 28. v4.3 note — social-memory IV: the ledger's failure-mode dials

- **`stt_*` are listener-local reputation physics.** Bibles should NOT
  pin "the gossip" as a low-credibility character — credibility is the
  §9 verification channel. The gossip phenotype is: high `share_k` +
  high `sti_prob` + high `stt_gain` sensitivity is flat (associative) —
  what makes a character *marked* is what they habitually retell. A
  character who always carries negative moral content accumulates
  `stt_stigma` eval losses in every listener's model — the world never
  flags them. Pair with `gossip_neg_gain` on the tell side.
- **`fam_permastore_*` are ecological, not dispositional.** The
  exposure gate (50) means tenure beats talent: a dull 20-year
  resident's PersonModels are permastored; a sharp newcomer's aren't.
  Do not raise the gate for "good with faces" characters — that's
  `face_ability`/`fam_gain`'s job; the floor is about exposure count.
- **`edge_sym_p`/`balance_*` write the character's *model of the
  network*, not the network.** A high-`edge_sym_p` bible entry is the
  character who assumes affection is mutual — not the one it's true
  for. `balance_pull` high + `distrust` low = the peacemaker who keeps
  "remembering" that feuding neighbors patched things up.
- **`own_share_bias`/`blame_deflect` are the conflict-generating
  pair.** Every coAgents dyad legitimately recalls >100% combined
  contribution; housemate/roommate bibles should expect chore disputes
  to be structurally unresolvable. `blame_deflect` rides `defens` —
  a defensive character claims the wins and disowns the failures.
- **`same_source_pen` high (→1.0) is the gullible-consensus profile** —
  the character who hears one neighbor's daily monomania as "everyone
  thinks." Low (→0.4) + high `wmc` is the source-counter.
- **`retell_conf_*` are invisible to characters.** No bible can write
  "humble storyteller" via these — the inflation is reflexive
  (meta_cal explicit null). Storytelling-heavy bibles just reach the
  cap faster.
- **`conform_gate`/`conform_norm_p` split the public/private
  personality.** High conform_norm_p + high distrust = the character
  who nods along and stores the asterisk; low conform_norm_p + high
  consc = the one who argues on the spot. `dissent_mark` retrievals
  are the late-arriving "actually, I saw it differently" — dialogue
  should let them surface.
- **`pep_*` is the social-anxiety proxy until a `soc_anx` trait
  exists.** neurot·supp gating means the poker-faced anxious character
  gets the worst of both worlds: §6.53's encoding tax at the party,
  pep_k's darkening replay after it. pep_neg_drift is the dial that
  makes the replay *worsen* — don't zero it on any profile meant to
  feel socially anxious.
- **`partner_eval_pull` needs familiarity to fire** — it is a
  close-relationship operator. On a fresh acquaintance it does
  nothing; on a decades-long bond it continuously repaints history.
  Bibles with scripted relationship reversals (breakup, estrangement,
  reconciliation) get the strongest signature — P455's eval-reversal
  probe is the design check.
- **`overhear_*` + `vigil`/`hearing` write the eavesdropper.**
  High overhear_w + high vigil = the character who knows things they
  were never told and can't place the source — feed §6.10 source
  inference its weakest tags. Deafness-adjacent profiles (v2.8
  `hearing`) cut overhear_w, not attention.
- **Population-flat:** stt_*, fam_permastore_*, edge_sym_p,
  balance_*, own_share_bias, blame_deflect, same_source_pen,
  voices_k, retell_conf_*, gossip_*, discredit_mult, pep_*,
  partner_eval_pull, overhear_* — coefficients are constants; the
  traits and the exposure history do the differentiating.
- **Explicit nulls a bible cannot override:** no trait exempts STT
  (g_mem included — smart gossips wear the message); meta_cal never
  undoes retell confidence inflation; wmc never gates the symmetry
  assumption; distrust never blocks the sleeper effect (temporal,
  not dispositional).

## 29. v4.4 note (formal-model V — the machinery layer)

No new per-character params and no new clamp rows this version — the
v4.4 pass (formal-model.md Part V, spec §12) is substrate machinery:
record lifecycle FSM, op read/write sets + commutativity, the
three-tier field boundary, invariants, and the world's delivery
contract. **Bible-visible consequence is a null:** every per-char
profile remains exactly as loaded — nothing in v4.4 differentiates
people. The three locked nulls (`accuracy_leak`, `phantom_steer`,
`future_read_w`) are worth one line each for bible authors because
they name things a bible might *want* to write and cannot: no trait
makes a character's confidence track their accuracy (the oracle
steers nothing — even a "lucid" character's metacognition runs on
M-tier machinery, never the E-tier ruler); no trait lets a character
feel "this one is fake" about phantom records (the label steers
nothing — phantom content has to *earn* distrust through plausibility
like everything else); no trait grants prescience (déjà vu and
premonition flavor must be built from `fok`/`imagined` machinery, not
from peeking at the ledger).

## 30. v4.5 note (character-profiles IV — the bible-driven refinement pass)

Clamp rows added in §0 for the eleven v4.5 params. Bible-author
guidance for the new dials:

- **`fab_dir`/`lie_freq`/`fab_discomfort` come from the bible's
  `truth` register, not vibes.** The field has four readable phenotypes:
  *fabricator* (lies fluently → fab_dir +, lie_freq high), *omitter*
  (silence/edit/redirect → fab machinery dead, set fab_dir negative
  and lie_freq ~0), *deflater* (scrupulous → fab_dir −1, fab_discomfort
  high), *deferrer* (temporally-displaced truth → mid values). The
  mechanism only fires on emitted `claim:true` — a bible that writes
  "never lies" is claiming lie_freq ≈ 0, which makes the rest inert.
- **Omission ≠ weak memory.** A character who omits a topic (Victor's
  offer, Carmen's money) has an intact record with an emission gate —
  do NOT write forgetfulness pins to express secrecy. If the bible says
  "she knows exactly what she won't say," that is scoped silence, not
  decay.
- **`func_*` answers "what does this person USE the past for," not
  "what do they remember."** Selection-only: high `func_soc` means the
  surfaced memory is usually a shared story for the present audience;
  it does not raise recall accuracy. Do not pin func weights to
  express competence — that is `g_mem`/`wmc`.
- **`chrono_peak_hr` is compiled, not authored.** The bible supplies
  the routine (wake hour); the compiler derives the peak. Only
  bible-settable escape: rotating/shift-work schedules → null.
- **`concerns` = the `wants` field, memory-side.** Three clocks map to
  weight decay: week items fade in ~2 weeks unresolved, season ~6
  weeks, long persists. A resolved want releases its tagged records'
  intrusion bonus over ~a week — if the bible resolves a want
  on-screen, expect the character to stop being ambushed by it
  gradually, not instantly.
- **`collab_inhib`/`collab_cue_p` are dyad machinery, not
  personality.** Bibles pin them only via cohabitation/close-dyad
  facts (who eats together, who shares a household file); a loner has
  nobody to be inhibited by. `transact_loss` (v0.8) remains the
  bereavement dial — §6.69 explains what the lost directory was doing.
- **Explicit nulls added:** meta_cal never exempts fabrication
  inflation (the moderator is source monitoring, not metacognition);
  func_* never touches θ/E (selection ≠ capability); the omission
  register writes no claim so no fab mechanism can fire on it.

## 31. v4.6 note (encoding-mechanics IV — the gate's exceptions and
## the social cast)

Clamp rows added in §0 for the sixteen v4.6 params. The layer is
mostly WORLD-SUPPLIED (event tags, dialogue-layer flags) — the bible
dials:

- **`ownname_break_p` / `ownname_wmc_slope`:** do NOT pin directly —
  the wmc slope is sign-locked (low-wmc breaks through more because
  inhibition fails, Conway et al. 2001); the compiler reads `wmc`.
  A bible that wants a character "always ears-up for their name"
  should raise `social`/`vigil`, not this — the mechanism is a hole
  in the gate, not a listening skill.
- **`humor_gain`:** jitter on `extra` is legitimate (sense-of-humor
  legibility — the funny person's jokes land for themselves too);
  `humor_rate` is a state, not a trait — the witty household's
  baseline is ecology. Never pin humor_gain to make someone
  "memorable" — it makes THEM remember jokes.
- **`field_upd_min`:** mostly flat + the age knot; a bible may take
  +0.05 on `inattn`-loaded profiles (the oblivious one who keeps
  saying the bike is in the hallway). `stale:true` records are the
  visible product — pair with low `checker` for the confidently-
  outdated phenotype.
- **`impress_primacy` / `incongr_elab` / `congr_gain`:** population-
  flat defaults; a rigid, fast-judging profile (`consc` high +
  `open` low + `distrust` high) may take impress_primacy +0.1 and
  congr_gain +0.05 — the mind that files people once and never
  re-reads the file. Do NOT use incongr_elab to express
  "notices everything" — it fires only while a person model is
  FORMATIVE; on an old friendship it does nothing by design.
- **`impress_recency_p`:** pairs with `depleted`-prone profiles —
  the overworked one whose opinion of you is whichever interaction
  was last. Flat default; +0.1 max on chronic-fatigue profiles.
- **`motiv_narrow`:** state-gated (`approachMotiv` ≥ 0.6), so bibles
  pin nothing — but a high-`concern`-loaded cast member will hit the
  gate more often (the pining one sees only the beloved at the
  party). Reads naturally out of `wants` density.
- **`lie_enc_gain` / `lie_src_weak`:** flat — the mechanism fires on
  `deceptive` emissions, so frequency comes from `lie_freq` (v4.5
  bible pin), not these. A high-fab_dir fabricator lies often AND
  later believes them; the params here just supply the paper trail.
- **`note_gen_gain`:** the diary-keeper dial is behavioral — a bible
  that says "keeps a journal" should ALSO get the world emitting
  `note:"generative"` events for them; the param alone does nothing
  without the habit. Verbatim-mode characters (the transcriber, the
  screenshot-archiver) mint extref pointers and stay thin.
- **Ecology-only, never pin:** `animacy_*` (content property),
  `ownname_tail` (physics of the shift), `note_mode_null` (locked —
  no device romance).

## 32. v4.7 note (forgetting-curves V — the channel curves)

Clamp rows added in §0 for the v4.7 params. The split that matters to
bible authors: this pass separates *what a character relives* from
*what they know* — and pins the difference to trait dials:

- **`dreamRecall` (trait, 0.02–0.5):** the one new bible trait this
  pass. Load on `vivid`/`fantasy`/`open` — the dreamer who wakes up
  talking about it vs the one who never remembers a dream
  (`dream_mint` 0 is legal for a literally dreamless bible). Pair a
  high dreamRecall + high `confab_fill` profile with the rare
  dream→reality source slip (P507 caps it at 5% of dream recalls —
  spice, not a lifestyle). `dream_cond_mult` is ecology: nightmares
  about the fire can mark the body without a record.
- **`ps_*` (persSem minting):** do NOT pin per-character — the gates
  are population constants. What the bible controls is upstream:
  `selfRelevance` density and retell ecology determine which episodes
  semanticize. A `sdam`-modified profile mints persSem normally —
  that's the phenotype (knows the facts of their life, doesn't
  relive them).
- **`rk_thresh` / interference mults:** flat population defaults;
  `fam_interf_mult`/`recol_interf_mult` are DEBATED-flagged (P505
  may collapse them) — never build a bible's identity on the
  asymmetry surviving.
- **`beta_proc_cog`:** this is a correction — cognitive/discrete
  skills DO decay (Arthur 1998). Job-skills content should tag
  `kind` honestly: the bartender's floor presence is `cont`, the
  POS workflow is `cog`. A character retired from a craft for a
  year should *fumble the paperwork*, not the hands.
- **`transg_vivid_mult`:** scales with `defens`/`mnem_neg` by
  construction (×(0.5+0.5·defens)) — the self-forgiving transgressor
  remembers his swindle as a smudge. Accuracy is a LOCKED NULL:
  bibles may not use this to make liars forget what they did — the
  phenomenology dims, the record stays true.
- **`beta_pm_fired` / `cueBind` / `pm_sleep_gain`:** ecology +
  sleepQuality, not traits. The chronic insomniac profile gets
  leaking errands for free via `sleepFactor` — do not double-dip
  with a bible pin.
- **Ecology-only, never pin:** `order_*` (reconstruction physics),
  `vis_fam_floor` (Standing bound), `dream_cond_mult` (residue
  physics).

## 33. v4.8 note (retrieval-cues V — the cue's plan, rival, and reach)

Clamp rows added in §0 for the v4.8 params. What bible authors
should actually touch:

- **`planStyle` (trait, 0–1):** the one new bible pin. High =
  the character who narrates errands as if-then plans ("when I
  pass the mailbox I'll drop the check") — their armed
  intentions fire near-focally, pay half the monitor tax, and
  survive doorways. Low = vague intentions that leak. Load on
  `consc`-adjacent pins; NOT a competence halo — the old-old
  benefit collapses through `ii_age_gate` regardless of style
  (Kretschmer-Trendowicz 2009). Do not give the whole cast high
  planStyle — the literature's effect lives on the DELIBERATE
  plan, not a personality-wide bonus.
- **`name_sem_gap`:** population default, do not pin per
  character. What varies by bible is upstream: contact recency
  (`lastSeenDay`) and nickname usage — a bible whose character
  goes by "Rusty" narrows their OWN-name gap through the
  meaningful-token exemption, not a param.
- **`milestone` / `df` / `encodePhys`:** event/record tags, not
  traits. Bibles tag transitional firsts (the wedding, the
  move) for the §5.43 script privilege; the dialogue layer sets
  `df` from secrecy bookkeeping ("forget I said anything");
  `encodePhys` rides existing intox state.
- **`tot_*` age legs:** age-driven only — the elderly profile
  gets emptier, more frequent TOTs for free. Do not stack a
  bible pin; a famously-forgetful character uses existing
  `tot_rate`, not the age legs.
- **`crosscue_*`:** dyad-property, never a trait. The married
  pair's memory-finishing comes from RelEdge ≥ 0.7, which the
  bible's relationship map supplies — cast pairs who share
  history get the effect, acquaintances don't.
- **Ecology-only, never pin:** `enact_*` (encodeOps flag),
  `gen_direct_bar`/`hier_descent_p` (route physics),
  `hyper_*` (schedule physics), `sdr_gain`, `arousal_*`,
  `lifecue_gain`, `impl_bind_gain`/`impl_focal_lift`/
  `impl_cost_mult` (mechanism constants).

## 34. v4.9 note (age-development V — the wall has doors)

Clamp rows added in §0 for the v4.9 params. What bible authors
should actually touch:

- **`l1_until` + ambient-lang-per-era (bible, bilingual chars
  only):** the one new roster-relevant pin. Give the immigrant
  character `langs:[{l1:"es", until:14},{l2:"en"}]` (or zh/tl) —
  records encode with the ambient language of their era, and the
  era-depth lock does the rest: childhood surfaces in L1
  conversation and goes quiet in L2 (Marian & Neisser 2000;
  Harris 2003 — the L1 emotional premium exists only for
  `l1_until ≥ 6`; an early bilingual gets NO L1 advantage, that
  null is locked). Do not pin for monolingual characters —
  dead code.
- **`culture_env` / `culture_exit_off` / `auto_style`
  (background-level):** the family-reminiscence prior by
  cultural background — Māori-class ~0.8, mainstream-US ~0.5,
  low-elaborative collectivist ~0.3 (MacDonald et al. 2000;
  Wang 2001). `auto_style` sets report register: self_focused
  = specific, emotional, first-person tellings; relational =
  shorter, routine-and-others-centered. Both are PRIORS —
  the actual family style the bible specifies still rules;
  combined excursion on amnesia_exit clamps at ±2y. Mission
  cast note: pair immigrant profiles' culture_env with their
  family story, not a stereotype — the dial is environment,
  not ethnicity.
- **`pub_timing` (optional, ±2y):** pin only for characters
  whose pubertal timing is story-relevant (early-maturing teen
  whose bump window arguably opens early). Population knots
  cover everyone else.
- **`detail_emit_gain`:** default 1.0; female profiles +0.1
  (MacDonald 2000 — women's earliest reports carry more
  information). Keep small; it's a report-density dial, not a
  memory-quality halo.
- **Event-side, not traits:** `amnesia_pierce` lives on
  eventClass definitions (sibling_birth/hospitalization=2,
  move/death_family/new_school=1, everything else 0);
  `public_scale` lives on events (neighborhood fire=1,
  epochal=2). Bibles tag these in backstory event lists; the
  substrate tags live events.
- **Never pin (mechanism constants / age-driven):**
  `school_leak`, `coherent_leak_rescue`, `l1_lock`,
  `l1_emo_gain`, `pub_*` legs, `epochal_gain`, `chapter_tell`,
  `anchor_query_gain`, `earliest_tele_gain`, `earliest_stab`,
  `lat_age_mult` child knots. A precocious or delayed child is
  expressed through `reserve`, `reminiscence_env`, and
  `pub_timing` — never by bending the forgetting tail.
- **`earliest` is an output:** nothing to author. A child
  bible gains `earliest_candidate` records automatically via
  pierce-class backstory events (a sibling born when they
  were 2½ is the right kind of backstory detail — and now it
  matters mechanically).

## 35. v5.0 note (age-decline V — the binding bill)

Clamp rows added in §0 for the v5.0 params. Everything in this
block is age-curve machinery — the knots in age-decline.md §75 do
the work; what bible authors should actually touch:

- **Almost nothing directly.** Every v5.0 param is age_eff-driven
  decline machinery; a character's individual position on the
  decline curves comes from the existing `reserve`, `aging_rate`,
  `fitness`, `wmc` traits — not from pinning the tax itself. A
  sharp 80-year-old is `reserve` high + `aging_rate` low; the
  binding tax follows automatically.
- **`meaningful_link_rescue` (0–0.5, default 0.3):** the one
  defensible per-character dial — a character whose social
  knowledge is densely relational (the connector, the longtime
  shopkeeper who files people by kin-and-job) keeps links that a
  loner loses. Pair with high `social`/`know_density` — it is a
  scaffold dial, not a sociability halo.
- **`sdt_share` baseline 0.5:** pin only via `open`/`inattn`
  adjacency — a daydreamy elder still wanders more than a
  task-focused one; the age curve shrinks everyone.
- **`mon_source_tax` / `illus_recol_p`:** trait-adjacent via
  `meta_conf` (v4.2) — a confident character's wrong-source
  emissions carry phenomenology more often. The AGE component is
  locked; only the trait floor is bible-reachable.
- **World-builder event hooks:** `coarse:true` records arrive on
  their own for old characters; bibles need no flag. For
  OLD-CHARACTER backstories, though, note that `bump_emit_w` means
  "most important memory" queries will land in their 20s — write
  that decade richly in the bible or the draws will be thin.
- **Never pin:** `adh_intent_gate` (locked ON — the incidental
  null), `da_rif_weak`, `sdt_min_cue`, the ~75 RIF/DF pivot, the
  wm_* tier spreads, `emo_ctx_gain` knots (the item/context split
  is mechanism, not personality), `test_nofb_mult` schedule.
- **The emergent cast shadow:** at 75+, characters (a) lose
  person↔NAME links faster than person↔role links — expect "the
  nurse in 3B" recall where names fail; (b) go quiet on
  self-seeded recall — old mains speak memory when the world
  cues them, young mains volunteer it; (c) keep retell quality
  only where feedback exists — an uncorrected old raconteur
  polishes errors, not stories.

## 36. v5.1 note (emotional-memory V — the feeling that arrives early)

Clamp rows added in §0 for the v5.1 params. What bible authors should
actually touch — most of this block is relational/event machinery, not
trait dials:

- **`emo_inertia` (0–1, default 0.3):** the most bible-visible new
  trait. Set high (0.6–0.8) on characters whose moods linger — the
  brooder whose bad morning owns his whole week; depressive modifier
  already sets 0.7. Set low (0.1–0.2) on the resilient, the volatile,
  the distracted. It is a DYNAMICS trait (how long moods persist),
  not a valence trait — a cheerful-inert and a gloomy-inert character
  are both legal and read differently on screen.
- **`anticip_gain` (0–0.8):** pin on the planners and worriers —
  the character who rehearses conversations before they happen needs
  it ≥0.4; the improviser lives at 0 and never accrues the dread
  trace (or the relief payoff). Bibles writing a known dread arc
  (a court date, a wedding) should flag the event `anticipated` in
  the event list so the substrate mints the trace.
- **`forgive` (RelEdge field, 0–1):** relationship-state, not a
  MemoryParams dial — bibles set the STARTING dyad value on
  relationships with history (the ex-friends at 0.2, the
  reconciled siblings at 0.8); the simulation moves it.
- **`vic_cond_mult` / `inst_cond_mult`:** empathy-adjacent — the
  high-`empathy` character picks up others' fears at the upper
  range; the detached one barely registers them. Children get the
  ×1.2 knot automatically — no bible pin needed.
- **`shame_*` / `guilt_rehearse_k`:** drive from the bible's moral
  style — a shame-prone character (Tangney's shame-proneness is a
  stable disposition) gets `shame_avoid_k` high and should have
  backstory events that WOULD mint shame tags (self-caused,
  public-ish failures); a guilt-prone character gets
  `guilt_rehearse_k` high and generates amends urges the behavior
  layer can dramatize.
- **`nostalgia_*`:** the sentimental character gets
  `nostalgia_trigger_k` 0.4+; bibles should seed a few old positive
  people-rich records for them to reach for (the nostalgic needs an
  archive to self-medicate with).
- **`rep_habit_k`:** flat for nearly everyone — it is a mechanism
  constant about repeated events, not personality. Same for
  `rep_script_gain`, `dream_emo_w`, `dream_neg_bias`,
  `mood_confab_k`, `mood_crit_shift`, `betrayal_*` magnitudes.
- **Never pin (mechanism constants / locked):** the arousal-0.8
  recurrence reset, the betrayal→amnesia null (locked at 0 —
  avoidance, never erasure), the no-merge rule on anticip traces,
  the no-episodic-record rule on instructed fear, the
  rehearsal→forgive −0.02 / amends→forgive +0.1 feedback rates.
- **Emergent cast shadow:** (a) the worrier now has a week of
  dread-records the audience can watch him relive; (b) the betrayed
  character goes silent on the topic until the friendship ends —
  then the story comes out; (c) the eavesdropping ambient NPC can
  acquire a fear she never lived; (d) old mains' dream reports
  skew to the strong-old archive — write their 20s richly, the
  night draws from there too.

## 37. v5.2 note (false-memory V — the arrival channels)

Clamp rows added in §0 for the v5.2 params. What bible authors should
actually touch — most of this block is channel machinery, but three
dials are character-visible:

- **`yield_suscept` / `shift_suscept` (0.05–0.7):** the two dials the
  old `misinfo_suscept` was hiding. Set them INDEPENDENTLY — the
  gullible-but-stubborn character (high yield, low shift) swallows
  every leading hint but never backs down under pressure; the
  skeptical-but-pliant character (low yield, high shift) resists the
  story and still folds when challenged. GSS says both phenotypes
  exist and are stable. Load yield off distrust/wmc channels, shift
  off neurotic/social-anxiety — a biddable tough-talker is the
  high-shift/low-yield corner.
- **`reappr_k` (0–0.7):** how much the present repaints the feeling.
  The scorekeeper who "was always furious" stays low; the
  reconciler whose old hurts warm over runs high. Children and
  elders differ little — Levine found the mechanism at all ages.
- **`exp_fill_p` (0–0.5):** how much the schema writes at encoding.
  Push up on characters whose lives run on scripts (the clerk, the
  creature of habit) — they "remember" the expected detail that
  wasn't there on the FIRST telling. Push down on the
  hypervigilant/attentive. Interacts with confab_fill: exp_fill is
  born in the record, confab arrives at retelling — a high-
  exp_fill character lies fluently from the start.
- **`intent_done_p` (0–0.3):** the chore-phantom rate. The
  distracted multitasker and the rigid routine-holder both run
  high — for opposite reasons (weak act-encoding vs strong script).
  The character who believes they paid rent they only meant to pay
  is this dial.
- **`fic_penalty`:** mostly flat ~0.5 — it's a channel discount,
  not a trait. `fic_known_prior` may drift up on the fluent
  self-assured (they're sure they "already knew" what the story
  planted).
- **`anchor_w` / `persever_resid`:** mechanism constants for
  almost everyone; the exceptionally rigid personality may push
  anchor_w to 1.8 — first impressions that nothing evicts.
- **`ev_cred` / `retro_evid`:** skepticism toward artifacts — the
  suspicious character drops ev_cred to ~0.7; most people sit at
  the 0.9+ ceiling because fabricated proof is the strongest
  implant vector measured.
- **`test_pot_mult` / `own_emit_gain` / `why_mint_p` /
  `comm_err_p` / `lineage_conf` / `corrob_root_req` /
  `shift_int_frac` / `test_window` / `exp_thresh`:** mechanism
  constants — never pin per-character. `why_mint_p` ~1.0 is
  universal: everyone produces a reason on demand.
- **Emergent cast shadow:** (a) the first version of any event a
  character hears becomes their canonical version — rumor TIMING
  now matters as much as rumor content; (b) a character who was
  asked about an event yesterday absorbs today's gossip about it
  faster — interview order is a leak; (c) fabricated proof
  (doctored artifact) can implant what no amount of telling could;
  (d) a clique hearing one rumor from one source does not
  corroborate it — only independent origin chains turn rumor into
  "fact"; (e) "I meant to" quietly becomes "I did" on the
  routine chores — rent-payment claims are now falsifiable drama.

## 38. v5.3 note (individual-differences V — the lived-in mind)

Clamp rows added in §0 for the v5.3 params. These are the everyday
dials — most mains should carry at least one non-zero.

- **`self_srv` (trait) → `sself_enc`/`sself_other_loss`:** the ego
  ledger. Almost everyone is positive here (Ross & Sicoly's couples
  ALL summed >100%); the rare underclaimer pairs high self_srv on
  encoding with high distrust. Set high on the scorekeeper, the
  martyr, the "I do everything around here" roommate.
- **`alexith` (trait) → `alex_flat`/`alex_confab`:** the
  emotionally flat character is NOT silent about feelings — they
  answer fluently and invented-ly (`alex_confab` high). Their
  stored records are genuinely thinner on emoTag; the confident
  answer is confabulation, and the character believes it. Negative
  affect also lingers (reduced fading-affect bias) — the unfelt
  feeling never gets elaborated away. Pair negatively with
  `emo_gran`/`checker`.
- **`media_m` (trait):** the split-attention habit — phone-in-hand
  characters. Filter leaks (plist_suppress/source_confuse up,
  search broader and shallower) but storage is intact: a HMM
  character who attends fully encodes normally. Distinct from
  `inattn` (endogenous daydreaming) — correlate +0.3, don't merge.
- **`early_adv` ∈[0,2] (backstory trait):** set ONLY from childhood
  circumstances — poverty, instability, harsh caregiving. It taxes
  wmc-side params (misinfo, source_confuse, suppression,
  stress-retrieval) and never enc_base/storage — the Evans &
  Schamberg finding is a lifelong *control* tax that present
  comfort does not remove. A character can be poor-grown and
  rich-now and still carry it.
- **`circ_irr` ∈[0,2] (trait):** rotating-shift nurses, bakers,
  gig workers. It is VARIANCE, not deficit — peak_hour and
  sleepFactor jitter day-to-day while the 30-day mean is unchanged.
  Orthogonal to chronotype: a morning-type on night shifts is both.
- **`chron_pain` ∈[0,2] (prevalence trait) / `pain_state` ∈[0,1]
  (world-supplied day state):** the bad-back character. Pain taxes
  encoding attention NOW (anterograde only — no retrograde, no
  residue when it lifts) and they KNOW it (complaint_k +0.10).
- **`task_load` ∈[0,1] (context, not trait):** slammed-shift days.
  Spends prospective-memory/monitoring bandwidth — intentions fail
  while attended encoding stays intact. Lifts with the shift.
- **`music` ∈[0,2] (bible-pinned training):** verbal-channel
  encoding only — small, real, material-locked (Chan 1998). A
  musician with better face memory is a bug, not a character.
- **`rosy` (trait) → `rosy_retro`:** the rosy-view arc — positive
  events are remembered kinder than lived, negative detail fades
  faster. Anticipation skews positive too (three-point arc).
  Depressives run flat/inverted — keep rosy·depr negative.
- **`birth_order`:** write it in the bible freely (first/middle/
  youngest is good fiction) — it moves NOTHING. Locked null, N=20k
  (Rohrer 2015). Do not let a future "middle-child syndrome" tweak
  sneak a loading in; P575 exists to catch exactly that.
- **Cast shadow:** (a) every shared chore is now a latent dispute —
  two characters' honest ledgers sum >100%; (b) the alexithymic
  main answers "how did you feel" fluently and wrongly; (c) the
  pain patient forgets the day, not the past; (d) the busiest
  character drops the most intentions — PM failure is load, not
  flakiness; (e) the null axis keeps the whole trait layer honest.

## 39. v5.4 note (social-memory V — who keeps whom)

Clamp rows added in §0 for the v5.4 params. These are the social
dials — most interact with bible role assignments, not just traits.

- **`keeper` (trait) → `keeper_mint`/`keeper_cue_w`:** the
  relational-calendar role (Rosenthal 1985 — ~3/4 of real
  kinkeepers are women; tenure ~20y; mother→daughter). Pin it on
  the character who organizes the block: they mint 2–3× the
  relational intentions AND their reminders are everyone else's
  cues. If the keeper leaves or turns, the calendar orphans —
  birthdays stop being noticed and nobody can name what changed.
  Pair with high `consc`/`social`/`empathy`; do NOT use as a
  general-memory buff (locked null).
- **`spot_mult`/`spot_offense_p`:** the spotlight — everyone
  assumes others stored self-events at near-own strength. High
  `attach_anx` + high `spot_offense_p` = the character who is
  wounded that you forgot; low offense_p = the one who quietly
  registers it. Both are believable; the anchor itself
  (`spot_mult ≈ 1`) is universal — nobody assumes they were
  invisible.
- **`promise_cred_w`/`promise_debt_w`:** creditor vs debtor
  asymmetry on commitments — the promisee's copy is cue-bound,
  the debtor's rides `pm_self`. High `consc` narrows the gap
  (conscientious characters just do the thing). The grievance
  graph of the neighborhood is mostly expired debtor records
  meeting live creditor ones.
- **`hp_exp`/`solve_set_relax`:** hidden-profile starvation —
  what only one member of a group knows gets zero rehearsal and
  dies. Lower on high-`wmc`/`expert` holders (they push their
  unique items); the solve-set relax is world-tagged, not a trait.
- **`truth_def_bias`/`susp_persist`:** belief is the default
  (floor 0.61 — Bond & DePaulo's truth accuracy, not a niceness
  dial); once triggered, `suspicion` outlives the claim. High
  `distrust` lowers the floor and lengthens the residue — the
  suspicious character isn't a better lie detector, they're just
  suspicious earlier and longer. There is NO demeanor/cue dial —
  a "reads body language" param would be the bug P582 catches.
- **`copres_w`/`group_blind`/`copres_schema_fill`:** who-was-there
  fields are thin and reconstructive — regulars get inserted,
  one-timers dropped, out-group attendees under-encoded. Alibi
  memory is exactly this weak.
- **`dif_mult`/`dif_days`/`deny_src_weak` vs fabrication path:**
  the liar's ledger splits — denials rot the denied truth (the
  denier genuinely forgets), fabrications stay labeled but the
  label decays (the practiced lie walks unmarked). `supp`-high
  characters deny cheaper and rot faster.
- **`ostrac_*`:** exclusion is a hot tag on a thin record —
  high E, slow decay, scope drifts toward "everyone," and the
  excluder gets booked. High `attach_anx`/`neurot` amplify;
  high `scc` blunts.
- **`h_dap_thresh`/`anchor_date_gain`:** public events date
  private time ONLY when they broke routines (Brown 2009 — 9/11
  didn't anchor Americans; the earthquake anchored Izmit). The
  threshold is an ecological judgment, not an arousal one —
  the fire on the block anchors; the famous scandal doesn't.
- **`rev_moral_*`/`moral_repair_k`:** the moral ledger rewrites
  once and repairs at ~3× cost — one dishonest act outweighs a
  season of fairness, and redemption arcs run at a third of the
  descent rate. Ability impressions update symmetrically; keep
  the two domains on separate gain constants.
- **Cast shadow:** (a) every promise is two ledgers now — the
  debtor's genuine surprise is the phenotype; (b) the block's
  kinkeeper is load-bearing infrastructure disguised as
  personality; (c) the smooth liar is believed at default and
  the caught lie outlives its retraction; (d) "who was at the
  party" is always partly fiction; (e) moral reputation is a
  ratchet — cheap to lose, expensive to buy back.

## 40. v5.5 note (formal-model VI — machinery pass)

**No new clamp rows, no new traits.** The v5.5 params
(`canon_float`, `hash_algo`, `fp_tol`, `approx_tol`, `mix_correct`,
`mix_band` + three locked nulls) are population/harness machinery —
they configure the simulator, not a mind. Nothing here is
bible-pinnable, and that is the point: Part VI formalizes how records
may legally change (the §13.1 rewrite catalog) and what the society
should predict (the §13.2 rumor mean-field), both identical for all
28 characters.

What bible writers DO get from v5.5: the guarantee that a character's
memory can only lie in 11 named ways (the ρ-rules) — so a character
who "remembers wrong" is always lying through a spec'd channel
(misinformation, schema fill, embellishment, audience tuning, the
liar's ledger), never through a hole. And the Jensen rule (§13.3):
the block's rumor behavior is a property of the *cast ensemble*, so
two mains with wild `misinfo_suscept`/`retell` extremes change the
neighborhood's epidemiology, not just their own heads.

## 41. v5.6 note (character-profiles V — the self that keeps the books)

Clamp rows added in §0 for the sixteen v5.6 params. This pass owns the
self-view the spec had been borrowing (`tdist_self`, `selfDiscrepant`,
`mnem_neg` all referenced a self-evaluation that was never a trait) and
adds the evaluative machinery around it. What bible authors should
actually touch:

- **`self_est` (trait, 0.15–0.95):** the new bible pin — the person's
  standing evaluation of their own worth. Pin from the bible's
  self-regard register ("she knows exactly what she is" → 0.7+; "he
  apologizes for existing" → ≤0.35). **Do NOT confuse with
  `SelfModel.self_est.global`** — that is what the character believes
  about their *memory*; `self_est` is what they believe about
  *themselves*. A character can hold both combinations, and P614
  null-locks any generator that conflates them. Loads distancing
  (§6.15), the §6.100 consistency gate, and the dampen prior (§6.105).
- **`selfverif_w` (0–1):** the consistency-vs-enhancement dial. Default
  0.6 — most people prefer feeling good to being confirmed (Swann).
  >0.7 = the self-verifier who hoards the accurate insult; pair with
  low `self_est` for the insult-collector phenotype (negative feedback
  is *consistent* → the mnem_neg penalty releases it → she keeps every
  slight). This is the mechanism that makes a low-self-view character
  *not* benefit from mnemic neglect — self-protection protects a view
  worth protecting.
- **`self_complex` / `self_comp`:** how many rooms the self has
  (2–8) and whether the bad rooms have doors (0–1). A bible that
  writes a one-role character (the store, the job, the widow) is
  claiming self_complex ≈ 2 — their bad week is TOTAL because the
  spillover divisor is 2, not because they're fragile. The 2003
  meta-analysis caveat stands: this is DEBATED as a stress buffer —
  treat it as a reactivity dial, never a resilience guarantee, and
  never a capacity dial (`sc_capacity_null` locked).
- **`repress` is DERIVED, never pinned.** The bible writes
  defensiveness + "never complains" (low `neurot_report`); the
  compiler produces the phenotype — thinner negative childhood
  recall, later first negative memory, slower negative retrieval.
  Recognition of the same records is untouched (Davis 1990 locked
  boundary) and `repr_erase_null` forbids record deletion — the
  repressor's archive is complete behind shut doors. If a bible
  wants a character who "has no childhood," this is the mechanism —
  not amnesia pins.
- **`remin_style` (55+ enum blend):** pin on elders only, from the
  bible's late-life register. `transmissive` for the block's
  teacher-archive (C6); `instrumental` for the problem-rehearser;
  `narrative` for the raconteur; `escapist` for the golden-days
  nostalgist; `obsessive` for the guilt-replayer; `integrative`
  for the meaning-maker (the only style that mints persSem
  synthesis — integrative reminiscence literally semanticizes a
  life). Styles change what the accessible archive BECOMES over
  sim-years, so they compound — pick them to match the character's
  trajectory, not their current mood.
- **`counterf_k` / `regret_inact_mult` / `regret_opp_gate`:** the
  regret economy. `counterf_k` loads on rumination-adjacent pins —
  the near-miss reliver. `regret_opp_gate` is the adaptive dial: 1 =
  opportunity closed → let it go; →0 = the character who cannot
  stop grieving what is already impossible (depressive signature —
  pair with `depr`). The action/inaction half-life split is
  mechanism, not personality — sign-locked by P607.
- **`savor_k` / `dampen_k`:** independent valves. The savorer holds
  a good evening longer; the dampener talks themselves out of it.
  `dampen_k` has a computed prior from `self_est`/`depr` — pin only
  to deviate (a high-self-esteem dampener is legal and reads
  distinctly: confident but joyless). Both move encoding and
  rehearsal, never accuracy — the dampened event is thin, not false.
- **`future_cont` / `pself_mint`:** low future_cont is the character
  who books obligations her future self will experience as someone
  else's promises — she is reliably surprised by her own calendar
  (the debtor-channel mapping is the point). `pself_mint` on the
  dreamer and the dreading — the feared self is a landmark that
  darkens resembling present events.
- **`elabor` / `elabor_dyad_gain`:** the interviewer inside the
  friend — pin on characters who draw stories out of people (the
  confidante, the bartender-adjacent listener). The gain lands on
  BOTH parties' records — being known well by an elaborator makes
  your own archive denser. Adult extension is HYPOTHESIS-flagged;
  the developmental base (Fivush) is consensus.
- **Never pin (mechanism constants / locked):** `repr_neg_shift`
  population scale, the recall-only mnem_neg boundary (recognition
  spared — Green et al. 2007), `se_accuracy_null` (self-esteem moves
  selection and valence, NEVER fidelity — a confident character is
  not a more accurate one), `sc_capacity_null`, `repr_erase_null`,
  the action/inaction decay sign, `owner:"future-self"` semantics
  (compiler-set from future_cont, not authored).
- **Emergent cast shadow:** (a) Victor's childhood is literally
  thinner on the negative side — the archive is whole, the doors
  are shut; (b) a low-self_est main keeps every slight because it
  confirms — mnemic neglect protects only views worth protecting;
  (c) Carmen's transmissive blend means her archive gets TOLD into
  shape — teaching stories polish, private ones fade; (d) the
  newcomer with two self-aspects has the most volatile mood in the
  cast — same events, divisor 2; (e) the low-future_cont character
  keeps breaking dates with a stranger who turns out to be herself.

## 42. v5.8 note (encoding-mechanics V — the attempt before the trace)

Clamp rows added in §0 for the nine v5.8 param rows. **None of these
are trait pins** — every v5.8 dial is a mechanism constant; the
character differences emerge from the fields and the existing trait
machinery, not from new bible numbers. What bible authors should
actually KNOW (the emergent shadow):

- **Older mains get their encoding back through `envSupport`, not
  through trying harder.** §61's complementarity means a scripted,
  cued, structured day (regulars, familiar tasks, a spouse who
  finishes sentences) is when the 70-year-old encodes like a
  40-year-old; the same character in an unstructured novel setting
  falls off the curve. Write elders INTO routines and their memory
  reads younger; drop them into chaos and the deficit appears.
  Same field, second reader: `envSupport` also rescues the
  hypercorrection the old otherwise lose (§59 — they CAN update
  confidently-wrong beliefs, but only when the world scaffolds it).
- **The kid learns "who sits where" faster than anyone** —
  `statlearn_age_w` weights the co-occurrence mint toward children
  (Saffran); a young character accumulates sourced-less social
  knowledge (who belongs with whom, which routine goes with which
  hour) with NO episodic record behind it. The elders accumulate it
  too, just slower — the ambient regular's "the usuals" layer is this
  channel at population scale.
- **The failed-recall mark is where believable "oh NOW I remember"
  moments come from** — a character who reached for a name and
  missed encodes the correction deeply when it arrives minutes
  later (§58). It's also where believable "I crammed it and still
  blanked" come from — `jol_fluency_bias` makes massed preparation
  FEEL learned (§60's illusion is report-side only; the archive
  disagrees).
- **Trust violations weld the actor to the act ONLY when the
  character had skin in the game** (§63) — "he cheated ME/us" mints
  the hot link; "she heard he's a cheat" encodes the rumor normally.
  A bible that wants a character who never lets a betrayal go should
  make sure the betrayals are in-group, not described.
- **Never pin:** all 15 v5.8 params are mechanism constants; the
  three locked nulls (`interleave_verbal_null`, `cheat_recog_null`,
  `disfluency_gain`) are adjudicated absences, not zeros awaiting
  tuning.

## 43. v5.9 note (forgetting-curves VI — decay-side constants)

Eleven clamp rows added in §0 for the v5.9 machinery. **None are
trait pins** — every v5.9 dial is a mechanism constant; profile
diversity enters through the existing age/trait channels they read:

- **Reconsolidation is a world-timing dial, not a personality dial.**
  `recons_*` params govern how editable a freshly-recalled memory is;
  a bible that wants a character "rewritten by every retelling" raises
  retell ecology / rumination (existing traits), never recons_win —
  the window is physiology.
- **Hyper-binding is the age tax bible-writers will feel:** elders
  mint spurious pair links at encode (≈0.10 at 80 under default
  ramp), so old characters produce confident wrong co-occurrences
  AND their interference pools run contaminated — expect "she was
  there that day" errors and faster crowd-blur from the same cause.
  `age_eff` carries it, so high-`reserve`/`fitness` elders are
  partially spared (the ramp rides the same effective-age curve).
- **ALF is the "sharp yesterday, gone last month" phenotype** —
  intercept intact, tail steepened past `alf_onset`. Distinct from
  the general age-β rise (everything faster) and from dementia
  modifiers (pathological; ALF must NOT stack on them — clamp
  enforced in §0).
- **Selective sleep (`expRel`) is a world-builder hook**: events the
  character knows will matter (a promised telling, a warning, a
  deadline) consolidate preferentially. Scenes that announce their
  future relevance literally survive better — authorable via the
  Event flag, not a trait.
- **`dforget` vs suppression:** bible guidance — "avoids thinking
  about it" = suppressEvent (effortful, leaks under trauma); "it's
  not worth keeping / we agreed never to mention it" = forgetEvent
  (starvation, no drama). Same ~10–15% surface effect, different
  machinery, different fiction.

## 44. v5.10 note (retrieval-cues VI — the cue's direction, echo, keeper)

Eight clamp rows added in §0 for the v5.10 machinery. **None are
trait pins** — all are mechanism constants; bible diversity keeps
entering through existing channels:

- **`backcue_mult` is a species constant, not a quirk.** Do NOT pin
  it per-character — individual variation in directionality isn't in
  the literature. A bible that wants "always knows who but never
  when" already has it: era/when fields are the weakest cues AND
  querying them is often a reverse lookup.
- **`recue_passes` is personality-adjacent through the wrong door.**
  A persistent thinker isn't a higher `recue_passes` — it's higher
  `search_breadth`/`fok_retry` (existing). The pass cap is an
  implementation bound; leave it at 2.
- **Objects need the world.** `objLink`/`photographed` only do work
  if events name artifacts — world-builder mints them; a character
  bible can note "keeps her mother's ring / photographs everything"
  and the flag does the rest. The photo-offload tax is encode-side:
  the shutterbug remembers the evening a little thinner unless the
  shots get reviewed (review = retrieval, the fix is built in).
- **The asker is a context, not a character.** `forced` probes lower
  the emission floor — interrogators get MORE words and WORSE ones;
  `hedged` marks them for the rumor ledger. Rapport gains breadth,
  never accuracy. Bible note: a character who *feels* interrogated
  often (paranoid phenotype) lives under forced-floor emissions —
  that's a style of answer, not a memory defect.
- **`routeHeat` is invisible bookkeeping** — don't surface it; its
  product is the difference between the polished six-times-told
  anecdote and the same record's cold unasked fields. `route_hl`
  30d keeps paths wearable, not permanent.
- **`restart_overlap` gates interviews, not people.** The CI
  contract: after a failed account, change the angle (order,
  perspective, era) or the counters persist — identical re-asks
  are the worst probe.

## 45. v5.11 note (age-development VI — infant clock, seen reminder, observer channel, heritage bump)

Eleven clamp rows added in §0 for the v5.11 machinery. **No new
trait pins** — the diversity this pass adds enters through the
PROFILE (`schooled` enum) and through the EVENT layer
(`role:"observer"`, `studied`, `reward`, `era` on accounts), not
through per-character constants:

- **`schooled` is a backstory fact, not a dial.** All 8 mains are
  `full`; use `partial`/`none` only where a bible says so
  (unschooled upbringing, interrupted schooling). Its effects are
  narrow — strategy onsets +0.5y and a persisting metamemory gap
  — do not stack it onto `g_mem` (schooling reorganizes memory
  skills, not raw capacity; Morrison 1995 is a grade-vs-age
  finding, not an IQ claim).
- **`infant_beta_*`/`obs_gain`/`free_recall_tax`/`order_strength_*`
  are age-keyed curves, evaluated inline** — a bible never pins
  "infant forgetting" because the encoder's age IS the pin. The
  visible consequence for bibles: a character's childhood
  backstory seeded with observer events (watched the fight,
  watched the ritual) mints real but self-field-thin records —
  write backstory beats as participation OR observation
  deliberately; they differ.
- **The heritage leg wants family-story content.** `heritage_gain`
  fires only when kin tells their OWN bump-era story to a hearer
  aged 8–30 — world-builder should tag family-anecdote content
  with `era` (the teller's era) or the leg can't evaluate. A
  bible note like "raised on her grandmother's Resistance
  stories" is exactly the input this param prices; without the
  tag it's a null op.
- **`told_reinstate_null` is load-bearing.** Below-wall latent
  records respond to re-ENCOUNTER only. Dialogue must not let a
  character's earliest memory get "unlocked by being told about
  it" — the grandmother's retelling mints a NEW told_by record
  (which §48 gates), it never revives the latent one. The
  unlock-by-return scene (going back to the house) is legal; the
  unlock-by-story scene is not.
- **`pub_reward_gain` stays narrow by construction.** Reward-
  valenced only, window-scoped only. A bible that wants a teen's
  memory to be generally hot already has `pub_emo_gain`;
  `pub_reward_gain` is specifically the-wins-stick — don't route
  humiliations through it (that's `pub_emo_gain`/`social_eval`).

## 46. v5.12 note (age-decline VI — the ledger splits)

Twenty-one clamp rows added in §0 for the v5.12 machinery. Two
new PROFILE fields (`chronotype`, `sensory`) and one re-anchored
existing trait (`fitness`) — the rest is age-keyed knots evaluated
inline; bibles never pin "recollection" or "gist" directly:

- **`chronotype` is a circadian fact, not a preference tag.** It
  maps onto the existing `peak_hour` (v0.7) at profile generation;
  `tod_tax` is the age knot on the off-peak penalty. 65+ mains
  default `morning` (~75% of real older adults are morning types —
  May et al. 1993); an `evening` elder is a deliberate beat, and
  its off-peak window lands in the morning. Locked `auto_sync_null`
  means the clock NEVER touches involuntary recall or routine
  scripts — an old character sleepwalks through their morning
  coffee ritual identically at 7am and 9pm; the tax is for effort.
- **`sensory` is the cheapest depth cue in the doc.** `sensory:0.5`
  on a 70+ bible = unaided hearing loss: auditory fields encode at
  ~0.85× AND the character's decline curves run `sensory_age_shift`
  years old. The asymmetry is the contract: restoring sensory
  (hearing aid beat) removes the encode tax going forward but does
  NOT refund the shift — arrested cause, not reversed cause. Do
  not stack it with `med_antichol` for "confused elder" flavor;
  pick the mechanism the story needs.
- **`fitness` now moves.** It was a static trait (v1.9); v5.12
  gives it a half-life (`fitness_drift_hl` ~1y). A bible that says
  "walks the park loop daily" is writing a memory intervention;
  one that says "used to walk" prices the decay. Combined
  reserve+fitness age_eff shift is capped at `rf_cap` 12y — an
  educated marathoner is NOT 20 years younger in the head.
- **`transact_gain` needs the spouse.** `withPartner` resolves via
  PersonModel `rel` + shared-encode overlap — a widowed elder
  loses the leg entirely (compounds the isolation overlay, §40,
  but they're distinct: one is a retrieval scaffold, one is a
  decay lift). Long-married couples in the cast recall richer
  episodic detail together than apart — write them remembering
  TOGETHER for the effect to show.
- **`age_salient` is a context, not a trait.** It taxes retrieval
  legs only for the duration of the flagged scene; nothing is
  stored differently. Memory-anxious profiles take the bigger hit
  (Hess's moderation) — pair with high complaint_k, not with
  low enc_base.
- **`reportMode:"know"` is output the dialogue layer must honor.**
  A know-emission is warm recognition with honest blanks — "I
  KNOW her… is she from the café?" — not a failed recall and not
  a confabulated one (confab_fill decides whether the blanks get
  filled). Forcing the old mains to always emit "remember" throws
  away the whole R/F split.

## 47. v5.13 note (emotional-memory VI — the residue layer:
the dead, the tone, the rival, the safe hand)

Thirteen clamp rows added in §0 for the v5.13 machinery. One new
TRAIT (`jealous`), one new PersonModel field pair
(`deceased`/`deathDay`), one new character state (`grief`), three
new event tags (`prosody`, `awe`, `infid_cue`), one retell
context (`ac_response`), two emission modes (`aff_flash`,
`absence`/`presence` on deceased-linked emissions). Bible-visible
guidance:

- **`deceased`/`deathDay` is a world-fact, not a bible mood.** Mark
  the PersonModel; the substrate owns the mode oscillator. A
  widowed main written before v5.13 (the landlord's late spouse,
  an ambient's dead sibling) now has a defined memorial ecology:
  loss-mode days spike cue-triggered pangs, restore-mode days let
  the same records emit warm presence — and nothing about the
  RECORDS changes. Bibles may write grief-stage backstory; they
  must not expect erasure or flat fading (grief_erasure_null).
- **`jealous` composes with attach_anx but is not it.** A
  low-anxious, high-jealous character is a real phenotype —
  specific, behavioral, rival-keyed vigilance with no general
  worry. Keep the two distinct in bibles; the infid_cue
  multipliers are sex-mediated per Schützwohl — don't write the
  direction backward.
- **`ac_response` is the audience's variable, supplied at retell.**
  World-side dialogue decides whether the listener was
  active-constructive; the substrate only reads it. A character
  whose partner is written flat/unresponsive accrues no
  capitalization on shared wins — an invisible relationship cost
  that will show up as dimmer positive records.
- **`prosody` is a speech-event field.** World events that
  specify delivery valence (said coldly, said warmly) mint the
  field and the implicit leak; absent = neutral, nothing
  happens. The leak's irreversibility is the point — a sarcastic
  compliment's sting survives the record of the joke.
- **`awe:true` is an Event tag, not a trait.** Any character can
  have an awe record; awe-proneness is world-side tagging
  frequency (§81 raises it at 65+). The signature — thin self,
  thick gist, unfillable gap — is the emotion's own; don't reach
  for it on merely-happy events.
- **`safety_suppress` reads the same trust table as §44.** A
  character whose best-trusted person is also low-relQuality
  gets the stranger's-hand residue — check the relationship
  matrix, not the cast list.

## 48. v5.14 note (false-memory VI — the calendar, the watcher,
the dream, and the quiet guards)

Fourteen clamp rows added in §0 plus one TRAIT (`imagery`), one
new op pair (`whenEstimate`, `dreamEvent`), one event tag
(`observed_action`), one retrieval posture (`demand_detail`),
one emission (`noticed_discrepancy`), one PersonModel field
(`nameFluency`). Bible-visible guidance:

- **`imagery` is not `vivid`.** `vivid` (v0.7) controls how much
  peripheral detail gets written at encoding; `imagery` controls
  how *world-like* internally generated content is — daydreams,
  rehearsed lies, dreams. A low-vivid/high-imagery character
  takes thin notes but hallucinates beautifully: their lies and
  daydreams are the ones that flip to memories. Keep them
  orthogonal in bibles.
- **`whenEstimate` means nobody owns a calendar.** Written
  characters should not "know" exact dates of unremarked days
  — bibles may pin landmark days (the accident, the wedding)
  because the landmark pull makes those stickier, but ordinary
  Tuesdays drift toward mid-window and round dates. If a plot
  needs a character to misremember *when* by weeks, give the
  record low dayConf, not a special exemption.
- **`observed_action` is a world tag, not a trait.** Any
  character who watches a housemate cook enough times can end
  up believing they cooked — but a bible that scripts shared
  domestic routines is signing up for crossed chore memories;
  that's the feature.
- **Dream flips need the traits.** `dreamEvent` mints are cheap
  and mostly harmless; only high-dissoc/fantasy/imagery
  characters flip them at meaningful rates. A grounded,
  concrete-minded main effectively never misremembers a dream —
  write them that way rather than reaching for dream confusion
  as a plot lever.
- **`noticed_discrepancy` is silent.** It's a tell available to
  the dialogue layer (a pause, a narrowing), not a spoken
  objection — a character can notice a lie and still say
  nothing. `demand_detail` is the same for the retrieval side:
  it's a posture callers set, so a bible-written interrogator or
  pedant should be flagged as habitually demanding detail.
- **`nameFluency` is ambient reputation.** An ambient whose name
  circulates at the bar becomes "somebody" without ever doing
  anything — bible-visible consequence: famous-adjacent NPCs
  accrue acquaintance attributions they never earned. This is
  by design; do not "fix" it in the cast list.

## 49. v5.15 note (individual-differences VI — the tails, the
motivated mind, the body history, the second null)

Ten clamp rows added in §0 plus nine TRAITS (`hsam`, `sdam`,
`nfc`, `mnemic`, `tbi`, `apoe`, `synesth`, `rumin`,
`learn_style`), three new event/context fields
(`arg_quality`, `self_feedback`, `tbi_event` + `close`/
`modifiable` moderators). Bible-visible guidance:

- **HSAM/SDAM graduate from modifier to trait.** The v2.5
  roster modifiers are superseded by the Part VI traits —
  same targets, now mechanized (hsam_decay_cut 0.85 reproduces
  the old ×0.15 beta leg exactly; the SDAM modifier's
  beta_episodic +0.4 leg is RE-PARAMETERIZED as retrieval-side
  `sdam_thin`/`sdam_know_shift` per Palombo 2015's encoding-
  intact evidence — drop the old decay leg when adopting).
  Keep them rare: at most one tail per cast, never both
  (`hsam`·`sdam` clamp is hard).
- **An HSAM character still misremembers.** Patihis 2013 is
  the lock: lab-type encoding and misinformation
  susceptibility are at control rates. The signature is
  *dates and own-life detail* — write them as the person who
  can tell you what Tuesday in March 2009 was like, not as a
  general-purpose recall machine.
- **`apoe` is invisible.** No character knows their genotype,
  and nothing in-world may reveal it — it is a fate parameter
  for the author, not a fact for the cast. Its only observable
  is a steeper late-life episodic slope; a 30-year-old ε4
  carrier must read as memory-ordinary (P702).
- **`tbi` is a bible field, not a plot device.** Severity
  0–2, set once at character creation (or a live `tbi_event`);
  the retrograde gap it carves is real (Ribot window) but the
  residual tax is small and STABLE — do not write progressive
  worsening into a `tbi` backstory; that belongs to `disease`
  or `apoe`.
- **`mnemic` is not `self_srv`.** Contribution bookkeeping
  (who did the dishes) is §6.85's axis; mnemic neglect is
  *feedback*-specific — a high-mnemic character genuinely
  under-stores the review that stung, while still recognizing
  it if confronted (the recognition exemption is locked — a
  bible scene where such a character cannot recognize
  criticism at all breaks the model).
- **`nfc` needs world tags.** The trait only bites on events
  the world marks `elaborable`/`arg_quality` — debates,
  pitches, arguments. A high-nfc character unprompted will
  remember *why* the good argument was good; they remember
  nothing extra about the Tuesday commute.
- **`rumin` signs the rehearsal policy.** Positive values
  brood (negative records get unearned retell cycles);
  negative values reflect (small problem-framing bonus). It
  composes with `neurot` via R +0.4 — pin both explicitly in
  bibles when you want the uncorrelated case.
- **`synesth` is deliberately small.** Meta-pooled effect is
  real but ordinary-range; the 0.08 loading is priced so no
  character becomes cinematic. If a bible wants a
  memorable-detail prodigy, `hsam`/`vivid`/`imagery` is the
  tool, not synesth.
- **`learn_style` is flavor text.** Characters may believe in
  it ("I'm a visual learner") — the field exists so bibles
  can write that belief — but every loading is locked 0.0.
  Do not wire instruction modality to it; Pashler 2008 says
  it does nothing, and P705 enforces the nothing.

## 50. v5.16 note (social-memory VI — the conversation's holes)

Ten clamp rows added in §0, ZERO new traits — every new
mechanism is situational (world-tagged) or rides existing
traits. Bible-facing guidance:

- **The talk-holes are invisible.** `nil_loss` cuts encoding
  just before a character's own speaking turn — but the
  record carries no "I wasn't listening" flag. Write
  post-conversation disagreement as patterned confusion
  about whoever spoke just before each character talked,
  never as a character reporting the gap (P709 locks
  retrieval rescue — nobody "thinks harder" their way back
  to it; they reconstruct or borrow someone's account).
- **Established impressions reinterpret surprises.** A
  new acquaintance's shocking act encodes hot (§2.3
  incongruity); the same act from a 20-year friend gets
  absorbed toward the schema — `strong_exp_congr` does the
  bending. Bible consequence: long relationships drift
  toward mutual confirmation — the surprise stops being
  data and becomes the exception that "wasn't really her."
- **Implications don't stay hedged.** World tags
  `implied` on an account → hearers store the implication
  as near-asserted gist with weak source. The retell a week
  later is flat ("she said he was cheating"), and the
  hearer CANNOT report that it was only implied — that
  provenance is M-tier. Bibles should write the flattening,
  not the nuance, downstream.
- **This morning's words are this afternoon's lens.**
  `accessibleConstructs` + `ambig_assim_p` mean a character
  who spent breakfast hearing "dishonest" gossip encodes
  the suspect's noon ambiguity through it. High-distrust
  bibles get chronically warm hostile constructs for free —
  they read ambiguity as threat by default, no priming
  needed.
- **`outcome_dep` is a world field, not a trait.** Tenant→
  landlord, employee→boss, lover→crush: the dependent party
  individuates — deeper encoding, sharper on violations,
  slower to commit to a fixed schema. Locked: dependency
  never flatters — the tenant remembers the landlord's
  cruelty AND kindness more vividly; resolution, not
  loyalty.
- **Two books, one event.** `harmed:{victim,perpetrator}`
  transgressions encode identically (locked — no birth
  difference) then diverge: the victim's stays hotter and
  drifts toward malice, the perpetrator's thins and softens
  each retell. Mutual retelling WIDENS the gap (locked) —
  write the fight about "what happened" as two people
  defending different records, not one truth.
- **Forgiveness is not amnesia.** `forgiveEvent` detaches
  the sting (decisional now, emotional over `forg_lag`) but
  the record is untouched — locked. A forgiven harm is
  fully recountable, cue-re-stingable at reduced charge.
  Never write post-forgiveness blankness; write "I've
  forgiven her — but yes, it happened, exactly like that."
- **The story that comes home.** `viaChain` distance ≥2
  lets a character's own distorted tale return as apparent
  corroboration (echo_adopt_p capped 0.45 while the
  original lives). Bible payoff: a canonized story fed
  back through the neighborhood lands as independent
  confirmation — "M said so too."
- **Promises in public bind both sides.** `witnessed`
  commitments strengthen creditor AND debtor arms and mint
  third-party clones — the audience itself remembers who
  owes what. A public promise broken emits `shame:true` —
  the block watched it fail.
- **`metVia` outlives names.** "We met through Mira at the
  picnic" is personSEM — it survives when the name is gone.
  And asymmetric re-introductions mint offense ONLY on the
  remembering side: being forgotten by someone you remember
  is the insult, and attach_anx characters mint at ceiling.
  Never mint offense on the forgetting side (P719).

## 51. v5.17 note (social-memory VII — the ledger nobody keeps)

Ten clamp rows added in §0, ZERO new traits — all loadings
ride jealous/rumin/attach_*/distrust/self_srv/nfc/sex.
Bible-facing guidance:

- **Dislike without a why is a first-class state.** When
  every episode backing an impression has decayed out, the
  eval floors at `orphan_eval_resid` and emissions carry
  `orphan_eval:true`. Write it honestly — "can't put my
  finger on it, something about her" — never invent the
  justifying scene (locked: orphan evals mint no episodes,
  P722). Reputation in the cast is partly *unsourced* by
  design.
- **The helper forgets; the helped keep the book.**
  `favor:{giver,receiver}` splits one kindness into a
  durable received record (+`owed` on the giver's
  PersonModel) and a fast-fading given record — the split
  is locked asymmetric (P723). Bible consequence: the
  cast's generous characters accumulate invisible credit;
  beneficiaries feel the debt long after the giver moved
  on. Both read true.
- **Feuds re-sort who-gets-confused-with-whom.** Three
  observed alignments flip source-confusion to
  coalition-first (Kurzban 2001) — during a live feud,
  bibles should write members of the same camp blurring
  together across demographics. Locked: the alliance
  re-sort never recolors pre-conflict records.
- **Origins get shelf space, middles get thin.** Inside
  `rel_bump_win` (90d) co-tagged records encode +15% and
  landmark-index — "how we met" retells rich forever,
  year-two Tuesday fades. Seed `relStartDay` in the bible
  or let sustained contact mint it.
- **The empty chair mints a record.** `expected:[ids]`
  makes a no-show a thin negative memory — attach_anx
  characters notice every absence at ceiling, and the
  record can NEVER leak co-presence for the absentee
  (ghost-null, P726). Nobody remembers a guest who wasn't
  there as having been there.
- **Everyone else forgot your blunder; you didn't.**
  Self-side embarrassment decays half-rate and feeds
  rumination; observers fade 1.5×; `aud_recall_over` ~2×
  means characters act as though the block logged it
  (spotlight). Write avoidance and over-apology — the
  audience's actual record is long gone.
- **The loudest narrator edits the neighborhood.**
  SS-RIF/practice scale with speaker centrality and
  propagate one hop — convergence follows the well-
  connected, not the accurate. Pair with the bible's
  status field; the quiet character's version dies
  unheard.
- **Inside jokes are real memory structures.** `idiom`
  records retrieve only inside the dyad
  (`idiom_dyad_gate`) — write "you had to be there"
  texture; on `relationship:end` they take
  `idiom_orphan_loss` but keep working, which is exactly
  the ache of an ex's private language.
- **Rival watch encodes, never convicts.** Committed-edge
  `threat` cues encode hot and resist attention cuts
  (jealous×attach_anx loadings; the sex-linked split is
  real but shallow — weight it lightly). Locked: vigilance
  remembers the glance; it never auto-confirms the affair
  (P731).
- **"A heard from B who saw C" flattens to "B said."**
  `prov_chain` loses ~35% of middle links per retell and
  collapses to bare `rumor` when emptied — write gossip
  arriving unmoored. Locked: a thinned chain can never
  exceed the last teller's credibility — hearsay doesn't
  launder into eyewitness (P732).

## 52. v5.18 note (formal-model VII — bounds on how wrong a context
can make a mind)

Five clamp rows added in §0 (`theta_cap`, `lat_mult_cap`,
`grace_floor`, `ctx_tau`, `att_span_ctx` — all population/harness
machinery, none bible-facing per-character). ZERO new traits.
This version is pure substrate machinery; the bible-facing guidance
is about what it *guarantees* writers:

- **There is now a worst case, and it still answers.** No stack of
  stress + distraction + age + evaluative pressure can push a
  character's recall below `grace_floor` on their strongest
  memories. A bible CAN write "the worst day of her life" without
  worrying the sim produces an automaton — degradation saturates
  (P736). Humans under maximal load are *bad*, not *broken*.
- **Modifiers now carry receipts.** Every call-time deviation logs
  a `modLedger` entry — when a character performs oddly, the trace
  names the mechanism (stress leg, synchrony leg, DA leg), not
  "the model felt like it."
- **The world cannot hand a character a cue they never perceived.**
  `ctx_oracle` is locked: undelivered cue fields contribute zero
  at admission. Consequence for world-builder: if you want a smell
  to trigger Proust, the event must actually deliver it —
  `sensory:["espresso"]` in the payload or it never existed.
- **Emissions can't be lied about downstream.** `surfMap` is
  closed: hedged recalls must surface hedged, `know` modes can't
  sprout scene detail, `aff_flash`/`orphan_eval` render affect
  with NO content (`surf_mint` locked). A character who feels
  unease without a reason literally cannot be given a confabulated
  reason by the dialogue layer — the surface lies are now contract
  violations, not style choices.
- **Every parameter must declare what observes it.** `identi_gate`
  means a param without a probe signature is a build error. For
  bible authors: nothing you pin can silently do nothing — if a
  trait loading doesn't move a declared observable, the harness
  says so.

## 53. v5.19 note (character-profiles VI — the narrator's compass)

Fifteen clamp rows added in §0. This pass is the bible-richest one
yet: eleven of the fifteen are trait pins. What bible authors should
actually touch:

- **`tp_vec` (five pins, independent — NOT normalized):** the
  strongest single "where does the mind rest" dial set. Pin from the
  bible's temporal register, not from mood: a character can be
  cheerful AND past-negative (Victor reads warm-present, arrives
  cold). **Do NOT use tp_pastneg as a proxy for `depr`** — depression
  is a phenotype with OGM and consolidation consequences;
  tp_pastneg is only an arrival weight. They co-load in the cast
  (Victor carries both) because they co-occur in life, but a
  tp_pastneg pin without depr is legal and reads differently
  (nostalgic melancholy ≠ clinical flatness — P745 null-locks any
  generator that lets tp weights touch record content).
- **`narr_agency`/`narr_comm`:** what the stories are ABOUT. Pin
  from the bible's telling style: "she tells it as a plan" →
  agency; "he tells it as a table of people" → communion. The
  mechanic is field DEPTH — the same event lands differently
  (P747), but `theme_fabricate_null` means the unfavored theme's
  fields exist thin, never missing. Do not confuse with `extra`
  (sociability) or `consc` (planfulness) — narr_comm is about
  what the ENCODING privileges, not how sociable the character is.
- **`autobio_k`:** the experience→residue conversion rate. The
  most outcome-bearing dial in the pass: at 0.2 a character lives
  the same year three times (Marcus); at 0.7 every stoop story
  mints a proposition (Carmen). Pair guidance: autobio_k +
  script_redeem is the wisdom axis (lessons + redemption-telling
  compound); autobio_k low + rumin high is the treadmill (re-runs
  problems, extracts nothing — Victor's slot).
- **`narr_coh_k`:** wiring, not rooms. Distinct from
  `self_complex` (structure) — a two-room self can still be
  tightly linked; a seven-room self can be a junk drawer. Low
  narr_coh_k + high vivid_detail = the album-of-brilliant-
  snapshots phenotype.
- **`period_sal`:** pin by biography — a life with a literal
  before/after (immigration, widowhood, the move) wants 0.7–0.9;
  a continuous-life profile wants ≤0.3. Side effect writers
  should EXPECT: high period_sal + era_surf_p makes the
  character spontaneously date their own past in dialogue ("in
  the Miami years") — the surface mark is free color, use it.
- **`epi_future_k`:** usually DERIVED — the prior couples to
  vivid_detail and the OGM terms (Williams 1996: generic past ↔
  generic future is one style). Pin explicitly only for the
  dreamer-on-thin-archive case (Dani 0.8). `future_leak_null`
  keeps rich imagined futures from becoming fake memories —
  the flip needs §6.9 imagination inflation.
- **`tension` (record field, not a trait):** bible seeds it on
  selfdef anchors — the unfinishedness. Tense anchors knock
  more (`sdm_tension_intr`) without weakening — a tense anchor
  is a STRONG record, not a damaged one (`tension_fate_null`).
- **Never pin (mechanism constants):** `tp_arrival_k`,
  `theme_sel_k`, `era_surf_p`, `sdm_tension_intr` — population
  scales; the per-character surfaces all live on the trait side.
- **Emergent cast shadow:** (a) Victor's archive visits HIM —
  past-negative arrivals + fatalistic quiet + the steepest wall;
  (b) Marcus has the least-narrated archive in the cast — sunny,
  shallow, lesson-free; (c) Carmen's stoop mints propositions —
  her memory literally editorializes; (d) Jules's Portland wall
  is the sharpest under-30 boundary; (e) Dani's futures are
  thicker than most people's pasts — and can never accidentally
  become one.

## 54. v5.20 note (encoding-mechanics VI — all ecology, no traits)

Eleven clamp rows added in §0 for the v5.20 machinery. **Zero new
trait pins** — every new param is a mechanism constant or a
world-supplied ecology flag. The bible-author-facing surface is the
emergent shadow:

- **Value routing (§71):** deficit-bearing profiles (older mains,
  low-wmc) automatically concentrate scarce capacity on important
  content — and automatically fail on hard-but-important detail
  (`value_mem_gate`). A bible writer does NOT pin these; they
  emerge from deficit_proxy. Cast note: an older main remembers the
  three things that mattered about a tenant meeting and loses the
  clause they needed — that is the model working, not a bug.
- **Choice (§72):** world marks `choice:true`; characters with
  constrained lives (few choice-tagged events) have measurably
  thinner ownership of their days — an ecology finding the bible
  can lean on narratively (the character who never chooses).
- **Secrets (§77):** the drama-seed layer (`confidential:true`)
  now carries a REAL cost — each held secret is ~1.5 pending
  intentions of tonic daLoad inside the shared cap. A main holding
  three secrets is running a degraded encoder all day, and their
  open errands lose slots. Disclosure frees the slot — confession
  relieves by mechanism, not by prose.
- **Saying-is-believing (§74):** gossip-motive tagging matters.
  `tune_motive` is the world's call per retell; only sharedReality
  tuning drifts the speaker. The cast's appeasers (high `affil`,
  politeness-tuned) keep accurate private records; the connectors
  absorb their own spin.
- **Faces (§76):** `faceDistinct` is roster-relative — a main with
  a homogeneous social world finds every newcomer distinctive (more
  accrual) and a main in a varied world needs more deviation. Same
  knob, different emergent sociology.
- **Observed tier (§75):** `obsIntent` is the apprentice flag —
  bibles that say "learns by watching" should ensure the world tags
  their watch events accordingly; the gain is mechanism, not trait.

## 55. v5.21 note (forgetting-curves VII — all mechanism, no traits)

Eight clamp rows added in §0 for the v5.21 machinery. **Zero new
trait pins** — every new param is a mechanism constant, an ecology
flag, or a report-side estimator. Bible-facing notes:

- **The stim tier (§4.34):** characters now have a recoverable
  "didn't catch that" buffer — ~30 seconds, ~2 items. A bible that
  says "he's always half-listening" now has a priced behavioral
  signature: frequent ghost recoveries requested, almost none
  landing as records. Nothing to pin; it emerges from `att_min`.
- **The audience arm (§4.13):** `aud_resp` is world-supplied —
  who a character's *friends* are (attentive vs distracted
  listeners) now literally shapes how durable their retold stories
  are. A main surrounded by distracted listeners rehearses without
  consolidating — their stories stay hot but don't deepen. Casting
  consequence: the good listener is a memory-keeper for others.
- **Joint recall (§5.67):** `jointRecall` is a session-level op,
  not a trait — but note the emergent: two mains reminiscing produce
  a narrower shared version than either holds privately, and each
  leaves with their own residue refreshed. Canonization pressure is
  now priced.
- **Confidence channel (§3):** `conf_beta_mult` is a mechanism
  constant; characters already differ in conf via `conf_bias`/
  `meta_cal` — this adds only that EVERYONE's certainty decays
  slower than their content. Old certainties accumulate.
- **Estimators are report-side:** `freqRecall` and `recallDuration`
  never touch stores — a character who "always" exaggerates
  frequencies does so through `avail_freq_k` (salience-weighted
  counts), not through a bigger number dial.

## 56. v5.22 note (retrieval-cues VII — mode, clusters, pulses, and the quitting bet)

Thirteen clamp rows added in §0 for the v5.22 machinery. **Zero new
trait pins** — every new param is a mechanism constant or a report-
side flag; differentiation enters through existing traits (checker
extends searches; imagery/narr_agency raise `reminder_chance`;
neurot+depr arm the negative-cue overgeneral arm; ageScale shortens
`search_budget`). Bible-facing notes:

- **Orient is phrasing, not personality (§5.69):** a bible can't
  make a character "more semantic" — but *how characters ask each
  other* now matters: "do you know if she came by?" vs "do you
  remember when she came by?" are different probes. Writers of
  interrogation-adjacent scenes (the landlord checking on a
  tenant) should know the factual phrasing gets the thinner answer.
- **Clusters are the storyteller's unit (§5.72):** `evClust` is
  minted from world events — a bible that seeds "the feud with
  the upstairs neighbor" as a continuing thread literally builds
  the character a cue structure: poke one episode, the arc
  surfaces; ask when any episode happened, get a vaguer answer.
  Story-shaped lives are now the memorable AND the blurry-dated
  ones — both at once, by the same mechanism.
- **Pulses make reminiscence legible (§5.73):** emissions carry a
  `pulse` index — scene direction can pace a character's
  recollection ("…and then — " pause " — the letter, that's what
  it was about") without scripting content. The pause is where
  another character's cue can steer.
- **Structure is felt, not retrieved (§5.74):** `struct` tags are
  world-supplied; a main with high `imagery`+`narr_agency` gets
  the rare pure-structural reminding — "watching her sign felt
  like the day I—". Keep it rare or it reads as authorial.
- **ctxcue is the spared floor (§5.75):** age-flat, record-free
  configural competence — the profile-degraded character who
  can't tell you what they did still navigates their own kitchen.
  Nothing to pin in a bible; it's what survives.
- **The give-up is a tell (§5.76):** `giveUp:{fok}` distinguishes
  "don't know" from "it's right there" — and the high-fok arm
  (`fok_reprobe`) is the "it came to me later" event. Checker
  characters re-search; everyone else quits on the metacognitive
  bet. No pin — `checker` already exists.

## 57. v5.23 note (age-development VII — the child side of every curve)

Twelve clamp rows added in §0. **Zero new traits** — the child side
of every curve is driven by encodeAge/retrievalAge knots plus two
existing dials (`reminisce_env`, `consc`). Bible-facing notes:

- **`reminisce_env` is no longer abstract (§6.152b):** the v1.5
  dial now works through the child telling her own past. A
  high-env character bible should literally contain adults who
  ask "tell me about your day" — the mechanism pays out on the
  child's narration events, not on ambient warmth. Low-env bibles
  mint fewer child-tell events; the wall-shift emerges.
- **The forget cue is a report cue below ~10 (§6.152a):** a child
  told "don't think about it" still HAS the record — they just
  don't volunteer it, and their false content suppresses BETTER
  than an adult's. For bibles: a secret told to a young child is
  gated, not gone — it surfaces on a strong cue. RIF needs no
  child tuning (verified intact — v75 null finding).
- **Thin mints are the character's texture (§4.35b):** a child
  character's records genuinely lack `when`/`why` fields —
  downstream, no dialogue should have a 6-year-old volunteer
  sequence or motivation for an event; they keep who-did-what.
  Writers get this free if they emit only minted fields.
- **The adolescent dip is a temporary blackout (§5.77a):** a
  15-year-old asked about age 6 should fail MORE than either the
  same character at 10 or at 25 — and the failure itself costs
  the record. Use it for drama: the teen who can't access the
  childhood they narrated fluently at 9.
- **Time intentions need the clock (§5.77b):** a child with a
  "remember at 3pm" intention emits `check_clock` micro-events —
  visible behavior the world can render; the checking IS the
  remembering mechanism.
- **Doing beats watching hardest in childhood (§4.35d):** ~4×
  do/watch gap at 4y vs ~1.2× adult — a young character's
  autobiography is almost entirely self-action.

## 58. v5.24 note (age-decline VII — the trajectory layer)

Ten clamp rows added in §0. **One new profile field, hidden:**
`traj` — the decline-class draw. **Zero new traits** — the draw
consumes fitness, apoe, social, sex (already pinned). Bible-facing
notes:

- **You cannot write `traj`; you can only load the dice
  (§4.36a):** a bible that wants a sharp-at-90 elder pins high
  `fitness` + partnered `social` and gets a ~30% maintain draw,
  not certainty — Betula says trajectory isn't chosen. The class
  is invisible to the character; write NO character who "knows"
  they're declining via the class — the only symptom is §5.78b.
- **The worrier is data (§5.78b):** a decline-arm main
  self-reports memory loss ~6 sim-years before the harness can
  measure it — "my memory's going" while still performing. For
  bibles: this is the gentlest dramatic hook in the system — the
  character is right and nobody, including them, can prove it.
  Worried-well mains (high neurot, average traj) complain
  identically and never decline — do NOT resolve which is which
  in the text.
- **Retirement is a memory event (§4.36b):** when a main leaves
  work, feed `work_engaged:false` and (optionally) `engage_sub`
  activity flags — a retiree who joins three clubs loses the
  slope more slowly than one who doesn't. Encode-side only: they
  don't recall the past worse; they lay down the present worse.
- **Walking is encoding load (§4.36c):** set `locomoting` on
  transit events for old mains — the conversation on the walk to
  the shop is thinner than the same conversation at the table.
  `loco_yield` is a free stage direction: the elder who stops
  walking to answer a hard question.
- **New corners are hard, the neighborhood is exempt (§§4.36d,
  5.78c):** `nav_mode` only mints on novel routes — a lifelong
  Mission resident's streets are permastore and NEVER pay
  ego_dir_pen. The drama lives at the edges: the new café
  approached from the wrong direction is genuinely unnavigable.
- **Watch the tail, not the mean (§6.153a):** "I did it myself"
  inflation is a fantasy/imagery-top-quintile phenomenon at old
  age — a vivid-imagination elder main is the one who'll claim
  the chore they only watched. Pin imagery high if you want that
  beat.
- **Stories go semantic (§5.78c):** an 80-year-old's
  reminiscence emits commentary over footage — writers get this
  free via the detail mix; don't script extra episodic color
  into old narrations, the model won't produce it and probing
  won't recover it (Levine persistence).
- **The routine outlives the instance (§5.78d):** `proc_age_null`
  freezes implicit legs at 55 — the most impaired main still
  does the morning whole. Nothing to pin; it's the floor.
- **The cap is honest (§6.153b):** if `stack_capped` shows up
  often in playtest logs, the knots are hot — report it, don't
  raise the cap.

## 59. v5.25 note (emotional-memory VII — the uses of feeling)

Ten clamp rows added in §0. **One new trait:** `humor`
(reappraisal-family joking style — feeds §6.157's tag-cooling,
NOT the v4.6 memorability channel; loads extra + open, mild
−neurot). Bible-facing notes:

- **Kindness needs a cost tag (§6.154):** the gratitude mint
  only fires when the world marks `benefit:true` — a kindness
  appraised as costing the giver something. Routine favors mint
  ordinary positive entries; the memorable debt is the costly
  one. World-builder: tag the sacrifice, not the smile.
- **The dark friendship is real (§6.155):** two high-rumin
  mains who co-rehearse grievances grow closer AND stay sadder —
  this is the literature's trade, not a bug. `solved:true` on a
  retell is the escape hatch: resolution talk dampens normally.
  Bibles: a co-ruminating pair needs BOTH partners ≥0.4 rumin —
  a ruminator paired with a problem-solver gets the ordinary
  disclosure path.
- **Distancing is regulation, not avoidance (§6.156):**
  `reflect.mode:distanced` cools the re-fired affect while
  keeping the record fully accessible (locked `dist_avoid_null`).
  A distanced main still knows exactly what happened — they just
  stopped bleeding on it. Pin `persp_obs`/`mindful` high for a
  character who "thinks about it calmly"; pin `rumin` for one
  who recounts.
- **The joke has a price (§6.157):** humor-cooled negative
  records mint ~15% thinner verbatim — the funny main genuinely
  remembers less of the bad day. Nothing to pin beyond `humor`;
  the cost is structural.
- **The calm reader can't feel the fight (§6.158):**
  `cold_read:true` emissions are the "that wasn't like me"
  attributions — the record is intact, the heat didn't port.
  A bible should never let a character's cold-state self-
  narration be treated as the truth of the hot event.
- **Anxiety reaches for threat first (§6.159):** under
  `anxiety_state` or high neurot, threat-tagged records win cue
  competition — the anxious main's week-review surfaces the bill
  and the weird look. Depression does NOT get this (locked
  dissociation) — depr's channel is elaboration/rumination.
- **Disgust doesn't wash with exposure (§6.161):** a disgust
  CondEntry barely moves under repeated safe visits; the fix is
  a rival positive tag on the same cue (counterconditioning).
  World: if a storyline needs a disgust aversion to heal, write
  the warm rival event, not montage exposure.
- **Sad regulators reach for happy records (§6.162):**
  negative-mood self-recall inverts toward positive candidates
  in regulator profiles; at depr ≥0.5 both the reach and the
  lift die (locked `repair_dep_null`) — the depressive main can
  recall the good time and stay sad. Don't write a depressed
  character whose mood lifts from positive reminiscence; write
  them distracted instead.
- **Asked later, they answer from who they are (§6.163):**
  beyond ~14 days, emotion reports reconstruct from self-belief
  and script, not the tag; `felt_believed_gap:true` marks the
  divergence. A bible may exploit this — the character who
  *says* the breakup destroyed them over a record of tired
  relief — but the record keeps the truth and a strong cue can
  still refire it.
