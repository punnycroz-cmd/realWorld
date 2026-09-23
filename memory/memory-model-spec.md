# Memory Model Spec v5.6 — implementable human-like memory for RW characters

> **v5.6 note (character-profiles V — the self that keeps the books):**
> `memory/cast-profiles.md` Part IV compiles the new dials onto C1–C8.
> **The self-view trait is finally owned** — `self_est` ∈[0,1] replaces
> the free-floating "self-esteem" the spec had been borrowing since
> §6.15; distinct from metamemory `self_est.global` (P614 null-locks
> the confusion) — §6.99. **The consistency gate** — mnemic neglect is
> corrected to its actual boundary: it neglects negative-central-
> INCONSISTENT feedback only; negative-consistent material is retained
> (Sedikides & Green 2000; Green et al. 2007 — recall-only, re-locked)
> — §6.100. **Self-complexity** — `self_complex` aspects divide
> affective spillover (Linville 1985/87; DEBATED-flagged per
> Rafaeli-Mor & Steinberg 2003: reactivity moderation, not a buffer
> guarantee) + `self_comp` compartmentalization (Showers 1992) —
> §6.101. **The repressor phenotype** — `repress` derived from
> defens×low-distress-report: fewer/later/slower negative childhood
> recalls, recognition spared, records never deleted (Davis & Schwartz
> 1987; Davis 1995) — §6.102. **Reminiscence functions** — Watt & Wong
> 1991's six styles route 55+ idle rehearsal; integrative mints
> persSem synthesis, obsessive feeds rumination — §6.103. **The regret
> economy** — counterfactual mints, action-vs-inaction half-life split
> (Gilovich & Medvec 1994/95), opportunity-gated disengagement
> (Wrosch) — §6.104. **Savoring/dampening valves** — positive-event
> encode and rehearsal gain, dampen self-esteem-gated (Bryant & Veroff
> 2007; Feldman et al. 2008; Wood et al. 2003) — §6.105.
> **Future-self continuity** — low `future_cont` files long-horizon
> intentions on the DEBTOR side of the promise ledger; `pself`
> possible-self records as landmarks (Ersner-Hershfield 2009; Markus
> & Nurius 1986) — §6.106. **Elaborative co-narration** — `elabor`
> speaker-side trait deepens both parties' shared records (Fivush
> line, adult extension is HYPOTHESIS) — §6.107. +16 params, 3 locked
> nulls, probes P602–P614.
>
> **v5.5 note (formal-model VI — the content algebra, the ensemble
> layer, and the canonical form):** `memory/formal-model.md` Part VI
> (§§45–51) is machinery, no new psychology. **The rewrite catalog** —
> all content mutation is recompiled into 11 typed rules (ρ_sub …
> ρ_fab) on a V/G/K/T field lattice with grammar invariants G1–G4:
> verbatim is conserved (write-once, monotone non-increasing), every
> delta carries a `lastRewrite` audit trace — §13.1. **The ensemble
> layer** — rumor spread formalized as a Maki–Thompson contact process
> on the four-factor p_tx kernel; mean-field gives a *prediction band*
> (Sudbury 1985 ~0.203 never-hear asymptote, venue-corrected), never a
> driver — §13.2. **The Jensen rule** — ensemble probes run the
> 28-character parameter joint; a mean-param verdict is inadmissible —
> §13.3. **Canonical form** — `hash(S)==hash(S′)` finally defined:
> sorted keys, r64-shortest floats, illegal NaN, ordered reductions —
> §13.4. **Approximation license** — lazy decay + session batching
> legal-by-construction under approx_tol — §13.5. +9 machinery params,
> 3 locked nulls, probes P590–P601.
>
> **v5.4 note (social-memory V — who keeps whom):**
> `memory/social-memory.md` Part V (§§65–80) prices the
> asymmetries of who is remembered and why. **Names gate behind
> semantics** — a `personSem` tier sits between identity and name
> in the §5.10 cascade; name production requires semantic access
> (Baker < baker; McWeeny 1987, Cohen 1990) — §5.10 addendum.
> **The spotlight asymmetry** — `expectOtherRecall` anchors on
> own record strength (Gilovich 2000); failed witness recall
> mints offense — §6.89. **The promise ledger** — creditor
> intentions are cue-bound, debtor intentions ride `pm_self`;
> breach detection is asymmetric — §6.90. **Hidden profiles
> starve** — group talk samples ∝ holders^hp_exp; unique
> knowledge gets zero rehearsal (Stasser & Titus) — §6.91.
> **Truth-default + suspicion residue** — belief is baseline,
> triggers break it, the doubt tag decays slower than the claim;
> locked null: no demeanor channel (Levine TDT; Bond & DePaulo
> 54%) — §6.92. **Co-presence decays to the usuals** — attendee
> fields reconstruct by schema (Simons & Levin ~50%) — §6.93.
> **Memory labor** — the `keeper` trait holds the relational
> calendar; her prompts are everyone else's cues (Rosenthal
> 1985) — §6.94. **The liar's ledger** — denials rot the denied
> record (DIF), fabrications keep a decaying lie-src flag
> (Otgaar & Baker; Pickel) — §6.95. **Exclusion encodes hot** —
> thin record, hot tag, scope drifts toward total (Williams;
> Eisenberger) — §6.96. **Living-in-history anchors** — only
> routine-disrupting public events mint dating landmarks (Brown
> 2009: 9/11 didn't, the earthquake did) — §6.97. **Moral
> revision asymmetry** — negative-moral rewrites at 1.5,
> positive-moral repairs at 0.4 with a triple-cost threshold
> (Mende-Siedlecki 2013) — §6.98. +21 params, +1 trait
> (keeper), probes P578–P589.
>
> **v5.3 note (individual-differences V — the lived-in mind):**
> `memory/individual-differences.md` Part V (§§49–62) adds the
> everyday-life axes. **The ego's ledger** — `self_srv` writes
> self-contribution fields denser and co-actor fields thinner on
> shared events (Ross & Sicoly 1979; joint reports sum >100%) —
> §6.85. **Flat affect, fluent answer** — `alexith` thins emoTag
> encoding and *confabulates* affect on probe at normal confidence
> (Vermeulen & Luminet 2009; Muir 2016 reduced fading-affect bias) —
> §6.86. **Split attention** — `media_m` leaks the interference
> filter (plist_suppress/source_confuse up, storage null) (Ophir,
> Nass & Wagner 2009). **Hard beginnings** — `early_adv` taxes
> wmc-side params only (Evans & Schamberg 2009). **Unsettled
> clocks** — `circ_irr` jitters peak_hour/sleepFactor day-to-day
> (variance claim, not level) (Cho 2001). **The now-tax** —
> `pain_state` cuts encoding while active, no retrograde, no
> residue (Moriarty 2011); `task_load` spends PM/monitoring
> bandwidth (Marsh & Hicks 1998) — both new context fields, §6.87.
> **Material-locked advantage** — `music` boosts verbal-channel
> encoding only, visual null (Chan, Ho & Cheung 1998). **Kinder
> recall** — `rosy` tilts reappraisal positive and fades negative
> detail faster (Mitchell et al. 1997 three-point arc) — §6.88.
> **The mandated null** — `birth_order` exists as a bible field
> with every loading locked 0.0 (Rohrer, Egloff & Schmukle 2015,
> N=20,186) — a trait layer that cannot say "no effect" is
> unfalsifiable.
>
> **v5.2 note (false-memory V — the arrival channels):**
> `memory/false-memory.md` Part V (§§52–64) prices what the earlier
> distortion passes left implicit. **First believable account anchors** —
> the first candidate on an empty field gains incumbent weight and
> survives source-discrediting at `persever_resid`; only a
> mechanism-explaining correction evicts it (Ross, Lepper & Hubbard
> 1975) — §6.75. **Recalling first makes you worse** — a recall within
> `test_window` RAISES misinformation adoption (`test_pot_mult`), the
> reversed testing effect (Chan, Thomas & Bulevich 2009); emitted
> wrong answers consolidate as "claimed" (§6.76). **The schema writes
> at encoding** — expected-but-absent fields mint verbatim candidates
> at encode (`exp_fill_p`), present at FIRST recall (Brewer & Treyens
> 1981) — §6.77. **Proof beats plausibility** — `presentEvidence`
> (doctored artifact) sets `ev_cred` ceiling, bypasses plaus_min,
> back-fills encoding-condition candidates (Wade et al. 2002; Kassin &
> Kiechel 1996) — §6.78. **"Why" is minted on demand** — reason/motive
> fields never encode, always confabulate fluently on first probe
> (Nisbett & Wilson 1977) — §6.79. **Fiction plants facts** —
> story-framed accounts adopt at `fic_penalty`, not zero (Marsh, Meade
> & Roediger 2003) — §6.80. **Corroboration needs genealogy** —
> believe_p counts independent provenance roots only; N hearers of one
> origin are one witness (Meade & Roediger 2002) — §6.81. **Re-appraised
> affect** — emitted emoTag blends stored tag with current appraisal
> (`reappr_k`; trauma exempt) (Levine 1997) — §6.82. **Yield and
> shift** — `misinfo_suscept` decomposes into `yield_suscept`
> (leading-account acceptance, internalizes) and `shift_suscept`
> (pressure flips, mostly compliance) (Gudjonsson GSS) — §6.83.
> **The interrupted deed** — rehearsed routine intentions mint "did
> it" candidates (`intent_done_p`); fired intentions re-fire
> (`comm_err_p`) (Albarracín et al. 2020; Scullin et al. 2011) —
> §6.84. +17 params in §7; probes P555–P565. All optional,
> default-neutral.

> **v5.1 note (emotional-memory V — the feeling that arrives early,
> stays secondhand, and heals on schedule):** `memory/emotional-memory.md`
> Part V (§§56–65) prices nine legs the earlier passes left implicit:
> **anticipatory records** — `anticip:true` traces mint on flagged
> future events, rehearse via dwell, and mint a mismatch record on
> |Δtag|>0.4 (Van Boven & Ashworth 2007) — §4.28; **betrayal prices
> closeness** — perpetrator trust scales arousal_tag up and verbatim
> down, then the record is avoided-not-erased until the relationship
> breaks (Freyd BTT, conservative reading) — §4.29; **secondhand
> fear** — `vic_cond_mult`/`inst_cond_mult` give §4.9 three
> acquisition routes (Olsson & Phelps 2007) — §4.29; **the dream draw
> samples the hot queue** — §4.24's world-supplied salience clause is
> superseded by an arousal×recency draw with `dream_neg_bias`
> (Valli et al. 2008) — §5.53; **shame avoids, guilt rehearses** —
> tag-split retrieval ecology + observer-perspective emissions +
> `amends_urge` counter (Tangney; D'Argembeau-group 2023) — §5.54;
> **forgiveness thaws the loop** — RelEdge `forgive` gates
> rehearsal/intrusion of offender-linked records, rumination nudges
> forgive down (McCullough et al. 2007 direction locked) — §5.55;
> **nostalgia self-medicates** — distress triggers warm-archive draws,
> emissions lift mood (Wildschut 2006; Routledge 2011) — §5.56;
> **mood fills the gaps** — `mood_confab_k` valence-matched confab +
> `mood_crit_shift` liberal low-arousal criterion (Ruci 2009; Corson &
> Verrier 2007) — §6.72; **emotional inertia** — `emo_inertia` trait
> gives C.mood persistence semantics (Kuppens 2010; Koval 2013) —
> §6.74; **repetition habituates** — `rep_habit_k`/`rep_script_gain`
> per recurrence, first-of-kind premium, arousal-0.8 reset locked —
> §6.73. +20 params in §7; probes P545–P554. All optional,
> default-neutral.

> **v5.0 note (age-decline V — the binding bill comes due):**
> `memory/age-decline.md` Part V (§§63–78) prices the join:
> **associative deficit formalized** — `adh_bind_tax(age_eff)` taxes
> every link-forming write (field attachments, source tags,
> cueBind_init, RelEdge deltas) gated by `adh_intent_gate` (tax
> applies to the intentional-encoding increment only — incidental
> encodes show the item≈assoc null; Old & Naveh-Benjamin 2008 meta,
> 90 studies); `namepair_tax` + `meaningful_link_rescue` make
> person↔name the worst case (Naveh-Benjamin et al. 2004) — §4.25;
> **WM capacity ladder** — `wm_store/reorder/complex_mult` three
> tiers (Bopp & Verhaeghen 2005 — storage < backward < complex) —
> §4.25; **segmentation coarsens** — `seg_boundary_p` mints fewer,
> `coarse:true` records (Sargent et al. 2013) — §4.26; **emotional
> item/context split** — `emo_ctx_gain` declines while emo-item
> legs stay flat (Kensinger et al. 2002) — §4.27; **DA asymmetry** —
> `da_enc_tax` on hits at encode, `da_ret_tax` on latency/spill at
> retrieve, miss-rate null locked (Craik et al. 1996; Anderson et
> al. 1998) — §5.49; **RIF two-regime** — `rif_age_tail` pivots ~75
> (Aslan & Bäuml 2012), `da_rif_weak` at all ages — §5.50; **the
> quiet mind** — `mw_decline` on ambient ticks, `sdt_share`
> stimulus-bound (Maillet & Schacter 2016) — §5.51; **testing needs
> feedback** — `test_fb_req`/`test_nofb_mult` (Tse, Balota &
> Roediger 2010 crossover) — §5.52; **recollection-only monitoring**
> — `mon_source_tax`/`illus_recol_p` (Dodson et al. 2007 — the
> confidence lie is source/pairing/order-specific) — §6.70;
> **bump-importance** — `bump_emit_w` concentrates "most important"
> draws at encodeAge 18–30 for 60+ (Rubin & Schulkind 1997) —
> §6.71. +19 params + 2 frozen in §7; probes P535–P544. All
> optional, default-neutral.

> **v4.9 note (age-development V — the wall has doors, the school
> years still leak, the archive is language-locked):**
> `memory/age-development.md` Part V (§§48–60) prices what the
> earlier passes left unpriced: **event-class amnesia pierce** —
> `amnesia_pierce` {0,1,2} per eventClass lets sibling-birth /
> hospitalization records (2y) and move / death records (3y)
> surface below `amnesia_exit_eff`, and told_by can't substitute
> below the pierce (Usher & Neisser 1993) — §4.1; **school-age
> forgetting tail** — `school_beta_mult(encodeAge)` keeps β
> elevated 7→11 with `coherent_leak_rescue` on narrated records
> (Bauer & Larkina 2014: childhood distributions are exponential,
> forgetting is manufactured during the school years) — §4.1;
> **language-locked childhood** — `l1_until` per bilingual
> profile; `lang` mints from the ambient language at encodeAge;
> mismatch deepens with era depth (`l1_lock`), L1 match boosts
> arousal_tag (`l1_emo_gain`, late-learner gated, early-null
> locked) (Marian & Neisser 2000; Harris et al. 2003) — §5.2;
> **culture/gender move the wall** — `culture_env` prior +
> `culture_exit_off` ±0.5y + `auto_style` report dial + female
> `detail_emit_gain` (MacDonald et al. 2000; Wang 2001; Mullen
> 1994) — §4.1/profiles; **puberty overlay** — reversible
> physiological teen regime (pub_emo_gain/pub_theta/
> pub_stress_gain), distinct from the social-teen mechanics
> (Murty et al. 2016; Romeo 2010 — DEBATED, deliberately narrow)
> — §4.17; **cohort imprinting** — `public_scale`/`epochal`/
> `chapter` event fields: public events in the bump window waive
> the valence gate, epochal events imprint all ages (Schuman &
> Scott 1989; Corning & Schuman 2015) — §4.1; **query-side
> landmark dating + child postdate** — `anchor_query_gain` and
> `earliest_tele_gain` (Loftus & Marburger 1983; Wang & Peterson
> 2014) — §6.15; **earliest is an output, not a field** —
> `earliest_stab` redraws the answer below ~9, sticky above
> (Peterson et al. 2011) — §6.15; **child-side latency** —
> `lat_age_mult` knots 1.4@6→1.0@16 (Kail 1991) — §5.25.
> +20 params in §7; probes P525–P534. All optional,
> default-neutral.

> **v4.8 note (retrieval-cues V — the cue's plan, rival, and
> reach):** `memory/retrieval-cues.md` Part V (§§46–56) prices
> five cue legs none of the earlier parts owned and tightens four
> existing ones: **implementation intentions** — `impl:{cue,
> action}` on armed intentions binds the cue in advance
> (near-focal firing, half monitor cost, half doorway dip,
> rigidity on unplanned cues; Gollwitzer & Sheeran 2006 PM-arm
> d≈.40) — §5.14; **the Baker paradox** — `name_sem_gap` on the
> tier-3 name roll makes names lose to the same phonological
> token used as semantic content (McWeeny et al. 1987; Cohen
> 1990) — §5.10; **enactment** — `enactive` records carry a
> self-origin motor cue that rescues sparse-cue recall and is
> doorway-immune (Roberts et al. 2022 meta) — §5.41;
> **generative vs direct retrieval** — broad queries enter at
> period/generic level and descend per-level before emitting the
> episode (Conway & Pleydell-Pearce 2000; Haque & Conway 2001) —
> §5.42; **life-script cues** — `milestone` records gain drive on
> life-scoped queries, positive-skewed (Berntsen & Rubin 2004) —
> §5.43; **hypermnesia** — spaced bouts grow reminiscence_frac,
> massed ones don't (Erdelyi & Becker 1974; Roediger & Thorpe
> 1978) — §5.11 amendment; **cross-cueing** — partner emissions
> cue the listener at `crosscue_mult` scaled by closeness,
> strangers ≈0.4 (collaborative inhibition IS the cue gap;
> Meudell et al. 1995 emergent-memory null honored) — §6.69
> amendment; **pharmacological state-dependence** — `encodePhys`
> match adds `sdr_gain` on sparse free recall only, recognition-
> locked null (Goodwin et al. 1969; Eich 1980) — §5.46;
> **arousal narrowing at retrieval** — high C.arousal taxes
> peripheral cue fields and boosts the dominant candidate
> (Easterbrook 1959; Christianson 1992 — retrieval-side
> HYPOTHESIS) — §5.47; **TOT aging** — rate up, resolution down,
> alternates down (Burke et al. 1991) — §5.16; **directed
> forgetting** — `df` flag starves rehearsal and taxes sparse
> probes, reversible under rich cues, never deletes (MacLeod
> 1998; soft-DF only) — §5.48. +18 params in §7; probes
> P513–P524. All optional, default-neutral.

> **v4.7 note (forgetting-curves V — the channel curves):**
> `memory/forgetting-curves.md` Part V (§§22–26) splits the decay
> composite into its channels — each with its own clock and its own
> failure cause: **personal semantics** — repeatedly-retrieved
> self-relevant episodes mint a semantic-tier `persSem` copy on
> archive/permastore ("skeleton autobiography," Renoult et al. 2012;
> what SDAM keeps) — §4.23; **recollect/familiar split** — derived
> `recol_w`/`fam_w`, remember↔know report gate at `rk_thresh`, and
> Sadeh's DEBATED interference asymmetry (`fam_interf_mult` /
> `recol_interf_mult`) — §4.23; **order recall** — order is never
> stored, reconstructed from drifted times + script priors, dies
> before content (Friedman 1993; Underwood 1977) — §5.40 `orderRecall`;
> **dreams** — minutes-scale class gated by wake encoding (Koulack &
> Goodenough arousal-retrieval), deferred from emotional §25 — §4.24;
> **skill decay correction** — procedural splits `cont`/`cog` (Arthur
> et al. 1998 meta: cognitive skills DO decay, d≈−1.4/yr) — §1;
> **sleep→intentions** — `cueBind` consolidates at the sleep tick
> (Scullin & McDaniel 2010) — §9; **unethical amnesia** — `transg`
> records lose vividness ×1.3, accuracy null locked (Kouchaki & Gino
> 2016 vs Stanley et al. 2018 failed replication) — §4.23; **fired
> intentions** decay at `beta_pm_fired` (Marsh, Hicks & Bink 1998) —
> §9; **Standing bound** — visual records keep `vis_fam_floor` on
> fam_w — §5.28. +22 params in §7; probes P503–P512. All optional,
> default-neutral.

> **v4.6 note (encoding-mechanics IV — the gate's exceptions and the
> social cast):** `memory/encoding-mechanics.md` Part IV (§§44–57)
> prices where `att_min` bends and how the person ledger forms:
> **change blindness** — `fieldChanged` events below `field_upd_min`
> leave `stale:true` fields carrying the old value (Simons & Levin
> 1998; Veiel et al. 2006 age knot) — §2; **own-name breakthrough** —
> `mentionsSelf` pierces the ambient gate at `ownname_break_p`,
> LOW-wmc MORE (Conway, Cowan & Bunting 2001, sign locked), plus
> `ownname_tail` monitoring — §2; **humor** — attended-only
> `humor_gain` with `humor_rate` self-calibration and a small
> privileged-retrieval leg (Schmidt 1994/2001) — §2; **animacy** —
> `animate` content and its context piggyback (Nairne et al. 2013;
> New et al. 2007) — §2; **expectancy-incongruence** — formative
> person models elaborate anomalies, strong models prefer congruent
> evidence and under-write counterexamples (Hastie & Kumar 1979;
> Stangor & McMillan 1992 moderation, sign-flipping) — §2;
> **impression primacy** — personModel.eval weights early evidence,
> depleted states flip to recency (Asch 1946; Luchins 1957) — §2;
> **motivational narrowing** — high-approach positive events drain
> periphery like threat (Gable & Harmon-Jones 2008/2010) — §2;
> **lie encoding** — `deceptive` emissions encode deeper with weak
> source tags, the upstream arm of §6.68's fab inflation (Walczyk
> 2003; Vrij 2008) — §2; **generative notes** — verbatim is a locked
> null, rephrasing encodes (M&O 2014 vs Urry 2021 replication) — §2.
> +16 params in §7; probes P493–P502. All optional, default-neutral.

> **v4.5 note (character-profiles IV — the bible-driven refinement
> pass):** `memory/cast-profiles.md` §14 recompiles the 8 mains against
> the world-v42 bible fields (`truth`, `interior`, `wants`) and forces
> five refinements: **synchrony** — the `chronotype` trait finally gets
> teeth: `chrono_peak_hr` + `sync_gain` scale E and controlled retrieval
> by circadian match, while implicit/intrusive recall prefers OFF-peak
> (May, Hasher & Stoltzfus 1993; May, Hasher & Foong 2005) — §6.65;
> **functional retrieval** — TALE weights `func_self`/`func_dir`/
> `func_soc` bias WHICH records spontaneous recall surfaces, never
> whether recall succeeds (Bluck & Alea 2002) — §6.66; **current
> concerns** — the wants register compiles to a `concerns` set that
> gates encoding relevance and intrusion pressure (Klinger 1975/2013;
> Marsh, Hicks & Bink 1998) — §6.67; **fabrication direction** — §6.9's
> population `fab_inflate` splits per-character: most people DEFLATE
> (truth strengthens), a minority tail inflates, moderated by lie
> frequency × discomfort × source monitoring (Polage 2004/2012) —
> §6.68; **collaborative inhibition** — joint recall is worse than
> pooled solo recall but coverage is better, and partner domains answer
> at the partner's θ (Weldon & Bellinger 1997; Wegner 1987) — §6.69.
> New D-class op `jointRecall` (per §12.2 catalog rules:
> dyadic, sorted-lock) and char-record field `concerns` (M-tier —
> steers encoding and intrusion, never emitted verbatim). +14 params
> in §7; probes
> P469–P480 in validation-design.md §75.

> **v4.4 note (formal-model V — the transition system, the
> lifecycle, the information boundary):** `memory/formal-model.md`
> Part V (§§36–44) types the substrate. **Probe semantics** —
> a probe is a predicate over the seed-distribution of
> trajectories, never a single-run check — §36. **Ledger total
> order** — Lamport (1978): partial happens-before extended by
> `ledgerSeq` — §36. **Record lifecycle FSM** — proposed/live/
> permastore/archived/dropped with guards and a per-op legality
> table (merge archives its parts; resurrect is the only
> archived→live edge; permastore freezes R not content) — §37.
> **Op catalog** — every op's read/write set, RNG streams,
> atomicity, and class; the commutativity theorem licenses a
> parallel scheduler: per-char serialization + sorted-charId
> dyad locks is all the ordering required — §38. **Information
> boundary** — three field tiers (C/M/E) and Goguen & Meseguer
> (1982) non-interference: `accuracy`/`phantom` are evaluator
> oracles that must steer nothing — zero-tolerance mutation
> probe — §39. **Invariant taxonomy** I1–I12 and the two-sided
> world↔substrate delivery contract — §§40–41. +7 params (all
> pop/harness + 3 locked nulls — §12 annex); probes P457–P468.
> Machinery only: no new mechanism, no new per-char params.

> **v4.3 note (social-memory IV — the ledger's failure modes):**
> `memory/social-memory.md` Part IV (§§48–64) closes the social
> layer's remaining lies: **spontaneous trait transference** —
> the messenger wears the described trait, associative not
> inferential (Skowronski, Carlston, Mae & Crawford 1998) —
> §6.54; **Bahrick floors** — the person cascade's tiers get
> their quantified permastore: ~90% recognition at 15y while
> name free-recall falls 60% over 48y (Bahrick, Bahrick &
> Wittlinger 1975) — §5.10 addendum; **RelEdge + balance warp**
> — a per-observer store for others' relationships, symmetry-
> assumed for sentiment, decay-taxed when unbalanced (De Soto
> 1960; De Soto & Kuethe 1959; De Soto, Henley & London 1968)
> — §1/§6.55; **own-share inflation** — every dyad member recalls
> doing most of the work, blame arm reversed (Ross & Sicoly
> 1979; Campbell & Sedikides 1999) — §6.56; **single-voice
> consensus** — one repeater reads as a chorus (Weaver, Garcia,
> Schwarz & Miller 2007) — §6.57; **retell confidence
> inflation** — telling raises certainty not accuracy (Shaw &
> McClure 1996; Odinot et al. 2009) — §6.58; **conformity
> split** — public assent decouples from private belief,
> `dissent_mark` (Gabbert et al. 2003/2004; Wright et al. 2000)
> — §6.59; **gossip tell-selection** — moral-negative content on
> known cheaters preferred, gossip needs a shared referent
> (McAndrew et al. 2007; Feinberg et al. 2012) — §6.60;
> **sleeper effect** — the discrediting tag rots faster than
> the claim (Kumkale & Albarracín 2004 meta) — §6.61;
> **post-event processing** — social-evaluative negatives replay
> and darken for the anxious (Clark & Wells 1995; Brozovich &
> Heimberg 2008) — §6.62; **partner-eval pull** — current
> evaluation repaints a partner's remembered past (McFarland &
> Ross 1987) — §6.63; **overheard channel** — eavesdropped
> content encodes thin with weak source binding (Emberson et al.
> 2010) — §6.64. +24 params in §7; probes P445–P456. All
> optional, default-neutral.

> **v4.2 note (individual-differences IV — the clinical phenotypes
> and the everyday pharmacopeia):** `memory/individual-differences.md`
> Part IV (§§34–48) adds eleven trait/state axes, each with a
> measured signature and a locked null: **depr** — overgeneral
> memory concentrated on positive-cued recall, storage intact
> `pos_spec_loss` (Ono, Devilly & Shum 2016 valence split;
> Williams et al. 2007 CaR-FA-X) — §6.52; **ptsd** — sensory-cue-
> gated intrusions `trauma_sens_intr`, fragmented trauma birth
> `frag_p`, negative-cue overgenerality `neg_ogm`, effortful
> voluntary suppression `avoid_suppress` (Ehlers & Clark 2000;
> Moore & Zoellner 2007; Schönfeld & Ehlers 2007) — §6.52;
> **attach_anx/attach_avoid** — content-gated effects on
> `attach:true` records only, `attach_field_loss`,
> and the depletion release `depl_release` — avoidant suppression
> is effortful and fails when `context.depleted` (Edelstein 2006;
> Mikulincer & Orbach 1995; Kohn, Rholes & Schmeichel 2012) —
> §5.38; **persp_obs** — Reconstructions emit `persp` (field/
> observer), observer reports dampened affect `persp_affect_loss`,
> older and self-discrepant records shift observer
> `persp_age_gain` (Nigro & Neisser 1983; Libby & Eibach 2002;
> Kuyken & Moulds 2009; Nelis et al. 2012) — §5.39; **supp** —
> `context.suppressing` taxes E on social fields `supp_enc_cost`;
> reappraisal is the explicit null arm (Richards & Gross 2000) —
> §6.53; **pspeed** — latency-only axis `search_cost_mult`
> (Salthouse 1996) — §5.25 addendum; **mindful** — the
> counterintuitive pair: specificity up AND `mind_lure`/
> `mind_rm_loss` up (Heeren et al. 2009; Wilson et al. 2015) —
> §6.8/§6.10 addenda; **scc** — self-model resolution scales
> §6.17 consistency pull `scc_consist_gain` (Campbell 1996) —
> §6.17 addendum; **smoker/nic_dep/caff** — objective PM deficit
> with metacognitive blindness `smoker_pm_loss`, deprivation
> `nic_dep_pm` restored never enhanced (Heffernan et al. 2010;
> Jansari et al.), and post-encoding consolidation discrimination
> `caff_consol_gain` (Borota et al. 2014 — hit-rate null locked)
> — §4.1 addendum. +17 params in §7; probes P433–P444. All
> optional, default-neutral; the eleven explicit nulls in
> individual-differences.md §44 are normative.

> **v4.1 note (false-memory IV — the instrumented channels):**
> `memory/false-memory.md` Part IV (§§38–51) covers interrogation
> itself as a distortion operator: **flashbulb records** floor
> emitted confidence at `fb_conf_floor` while accuracy drifts
> normally and freezes wrong at `fb_plateau` (Neisser & Harsch
> 1992; Talarico & Rubin 2003; Hirst et al. 2015) — §6.42;
> **question wording** — `wording_intensity`/`verb_pull` pull
> quantitative fields, presuppositions plant details at
> `lp_detail_p` (Loftus & Palmer 1974: 40.8 vs 34.0 mph, glass
> 32% vs 14%; Loftus & Zanni 1975) — §6.43; **confirmatory
> feedback** inflates confidence AND retroactively inflates
> encoding-condition fields `retro_inflate`, disconfirming hits
> harder `fb_disconf`, accuracy untouched (Wells & Bradfield 1998;
> Douglass & Steblay 2006; Steblay, Wells & Douglass 2014,
> N≈7000) — §6.44; **interviewer expectancy** `expect:` — pressure
> + leaked candidate + auto-confirm loop (Kassin, Goldstein &
> Savitsky 2003; Kassin, Dror & Kukucka 2013) — §6.45;
> **memory blindness** `swapReport` — altered own-reports go
> undetected ~65%, adopt at self-source ceiling `self_cred` 1.0
> (Cochran et al. 2016; Sauerland-line sticker study 2017) —
> §6.46; **listener SSIF** — a partial account suppresses the
> LISTENER's unshared related fields `ssif_suppress` (Cuc, Koppel
> & Hirst 2007; Stone et al. 2012) — §6.47; **omission
> suggestion** — `omission:true` suppresses emission without
> writing candidates `emit_omit` (Oeberst & Blank 2012, DEBATED)
> — §6.48; **imagined actions** `selfAction:true` flip easier
> `im_act_gain` (Goff & Roediger 1998; Thomas & Loftus 2002) —
> §6.9 ext; **discriminate recall mode** emits candidate lists
> with provenance, halves emitted falsity `discrim_recover`
> (Lindsay & Johnson 1989; McCloskey & Zaragoza 1985) — §6.50;
> **mood-congruent lures** — selection not volume
> `moodcong_lure` (Joormann, Teachman & Gotlib 2009) — §6.8/§6.27;
> **collective phantoms** — OBSERVE-only, no operator — §6.51.
> +15 params in §7; probes P421–P432 in validation-design.md.
> All optional, default-neutral.

> **v4.0 note (emotional-memory IV — the social life of leftover
> affect):** `memory/emotional-memory.md` Part IV (§§40–55) prices
> what the tag layer still ignored: **residual arousal crosses event
> boundaries** — `carryArous` character state (`carry_frac`/`carry_tau`
> ~20min half-life) feeds `misattrib_k` into the next event's tag and
> E, with a small gated valence rotation toward salient co-present
> targets (Zillmann 1971; Dutton & Aron 1974, Szczucka 2012 caveat)
> — §2; **audience tuning's mediator is epistemic trust** and
> **inverts under status** — `aud_status_mult`, `aud_tune_arous`
> (Echterhoff 2005/2008/2017) — §6.11 addendum; **venting is
> rumination not release** — `vent:true` routes to rumin-draws,
> frozen `catharsis_relief=0` (Bushman 2002) — §6.39; **positive
> regulation traits** — `savor`/`dampen` (Bryant & Veroff 2007;
> Feldman 2008) — §6.40; **secure-base attenuation** — co-present
> high-trust dampens `arousal_tag` only (`secure_damp`, tier_mult,
> relQuality-scaled — Coan 2006) — §2; **arousal dilates remembered
> duration** (`dur_dil`, valence-blind — Droit-Volet & Gil 2009) —
> §2; **failure feels farther** — `tdist_val`/`tdist_self` report-layer
> subjective distance, self-esteem-moderated, personal-only (Ross &
> Wilson 2002) — §6.15; **`w_emo` splits** into `w_emo_arous` +
> `w_emo_dist·(1−emo_rate)` — dramatic lives habituate their own
> dramas (Schmidt & Saari 2007; Talmi 2007 pure-list) — §2;
> **`emo_sex_gain`** +0.07 small (Canli 2002) — §2; **`emo_gran`**
> granularity trait gates discrete-tag precision and scales
> reappraisal (Barrett 2004; Kashdan 2015) — §2/§26; **impact bias**
> `forecast_int_bias`/`forecast_dur_bias` on imagineEvent (Wilson &
> Gilbert 2003) — §6.41; **jukebox cue** `cue_music_w` +
> `music_era_gain` era-indexed, `nostalgic:true` flag (Janata 2007)
> — §5.37. +18 params; §10 contract adds. Probes P409–P420.
>
> **v3.9 note (age-decline V — the residual channels):**
> `memory/age-decline.md` Part IV (§§49–62) prices what survives
> intact, what silently repeats, and what misattributes its own
> fluency: **implicit channel** — `impl_str` record field decays at
> ~0.5× episodic rate, ages at ~0.3× the explicit deficit, feeds
> emission ordering / famScore / re-encoding savings, never θ-gated
> (La Voie & Light 1994; Ward et al. 2020 debate noted) — §5.35;
> **thin futures** — `sim_detail_mult` + `recast_p` on imagineEvent:
> old simulations mint fewer verbatim fields or recast one whole
> past record (Addis, Wong & Schacter 2008; Addis et al. 2010) —
> §5.34; **intention deactivation** — completed intentions keep
> firing inside `deact_window` at `comm_err_p`, WORSE for
> repeatedly-performed intentions in old (Scullin, Bugg, McDaniel &
> Einstein 2011/2012; Walser 2015 practice floors it) — §5.33;
> **spacing null + slow context flux** — spacing benefit age-flat,
> `ctx_flux_mult` slows ctxShift → denser same-day interference
> pools (Balota, Duchek & Paullin 1989) — §4.22; **offloading
> asymmetry** — elders offload more but under-price the aid vs
> optimum, selectively for high-value items (Tsai, Scarampi,
> Kliegel & Gilbert 2023) — §2 offload terms; **own-age bias** —
> `own_age_gain` on discriminability only, criterion untouched
> (Rhodes & Anastasi 2012 meta) — §5.36; **update resistance** —
> reconsolidation writes mint versioned pairs at `update_resist`,
> superseded values leak back with age (Hartman & Hasher 1991) —
> §6.37; **fluency fame** — sourceless familiarity misattributes to
> prominence at `fame_fluency` (Bartlett, Strater & Fulton 1991) —
> §6.38; **semantic access tax** — `sem_search_tax` on open-ended
> semantic recall while direct lookup stays fluent (Tombaugh 1999;
> Rönnlund 2005) + `lat_age_mult` on §5.25 latency — §5.4/§5.25.
> +14 params in §7, probes P399–P408. All optional, default-neutral.

> **v3.8 note (age-development IV — the child channels that were
> never modeled):** `memory/age-development.md` Part IV (§§36–47)
> prices the format, default report, and hazards of childhood
> records: **preverbal lock** — records minted below productive
> vocabulary keep `verbal_age` and retell verbal fields at that
> fidelity forever; `verbal_void` returns sensory+affect with no
> narration (Simcock & Hayne 2002) — §6.36; **script default**
> — repeated eventClass records accrue `script` nodes children
> report by default, with modal-filler intrusion and a `sort_window`
> assimilation period before deviations mint (Nelson & Gruendel
> 1981; Hudson & Nelson 1986; Brubacher et al. 2011) — §4.20;
> **schema assimilation sign** — below `schema_flip_age`,
> schema-violating fields transform toward the modal value or are
> lost, replacing the adult `isolated` advantage (Liben & Signorella
> 1980/1984) — §6.35; **forced-pick identification** —
> `identifyFromSet` gains a `choose_p(age)` U-shaped refusal
> channel; children of all ages and older adults can't decline the
> set, sequential order worsens it (Pozzulo & Lindsay 1998;
> Fitzgerald & Price 2015) — §5.32; **interview sign-split** —
> repetition below `taint_exit` maintains on neutral accounts
> (`neutral_inoc`) and compounds taint on suggestive ones
> (`suggest_repeat_mult` + `stereo_prime` + `embellish_p`)
> (Leichtman & Ceci 1995; Goodman et al. 1991) — §6.3; **midlife
> regime** — longitudinal-curve knots relax the 50-knot and add
> `sem_accrual`; cross-sectional steepness moves to `low_reserve`
> (Schaie SLS) — §4.21; **dating without a timeline** —
> `date_loc_exit` disables the location pipeline below 8 while
> `orderBefore` stays intact; cyclic buckets replace absolute dates
> (Friedman 1991; Friedman & Kemp 1998) — §6.15; **child stress
> inversion** — `stress_flip_age` turns the arousal encoding term
> positive below 8 and inoculates the core (Goodman et al. 1991) —
> §4.1. +22 params in §7, probes P389–P398. All optional,
> default-neutral.

> **v3.7 note (retrieval-cues IV — the cue's owner, moment, and
> protocol):** `memory/retrieval-cues.md` Part IV (§§33–45) prices
> what the first three passes never owned: **cue ownership** —
> self-generated cues carry `origin` and earn `selfcue_mult`
> (Mäntylä 1986: ~91% vs ~55% other-cue) — §5.2; **retrieval-time
> load** — DA at test taxes latency, breadth, and PM monitoring
> while accuracy stays near-obligatory (Craik et al. 1996;
> Naveh-Benjamin et al. 1998/2000; Rohrer & Pashler 2003) —
> §5.4/§5.25; **retrieval-time stress sharpening** — cortisol lag
> window + valence multiplier on `stress_retrieve_loss` (Shields
> et al. 2017 meta; Gagnon & Wagner 2016) — §5.4; **mood repair**
> — trait-gated incongruent search mode that flips §5.3's
> congruence sign under sustained negative mood, blocked under
> dysphoria/rumination (Josephson et al. 1996; Joormann & Siemer
> 2004) — §5.27; **forward testing** — a retrieval bout primes the
> next encodings and halves their PI pool (Szpunar et al. 2008;
> Chan et al. 2018 meta) — §5.26; **familiarity-without-recall** —
> scene-level `familiar_only`/`deja`/`sourceless` returns on failed
> bouts via configural famScore (Cleary & Greene 2000; Cleary et
> al. 2012) — §5.28; **in-group SSRIF** — `ss_rif_k` gated by
> speaker in-group status (Coman & Hirst 2015) — §5.8; **PM
> retrospective leg** — fired cue + failed action recall →
> `pm_vague` intention-shell (Einstein & McDaniel) — §5.14;
> **doorway drop** — locShift boundaries shed peripheral cues and
> dip armed intentions (Radvansky et al. 2011) — §5.29;
> **interviewMode** — the cognitive-interview sequence as a
> game-systems contract (Köhnken et al. 1999 d=0.87; Memon et al.
> 2010) — §5.30; **isolation at retrieval** — `isolated` records
> take singleton cue buckets (fan immunity) + bout-first privilege
> (Hunt & McDaniel 1993) — §5.31. +25 params in §7, probes
> P378–P388. All optional, default-neutral.

> **v3.6 note (forgetting-curves IV — the curve across a life):**
> `memory/forgetting-curves.md` Part IV (§§17–21) prices the
> biographical scale the curve never had: **autobiographical periods**
> — `registerTransition` mints `period` ids, resets n_sim pools
> (life-scale release-from-PI), boosts boundary encoding, mints
> positive-only bump windows, and prices cross-period retrieval
> (Brown TNT; Schrauf & Rubin 2001) — §4.18; **bump gate hardening**
> — `valence ≥ bump_pos_min` required for ALL bump windows; negative
> self-relevant records lose β relief (Rubin & Berntsen 2003; Berntsen
> & Rubin 2004) — §4.1; **Ribot micro-windows** — graded retrograde
> hit + anterograde PTA fog around trauma mints — §4.19; **rest S-
> coupling** — `rested` records gain storageS and first-day n_sim
> exemption (Dewar 2012's no-retrieval benefit is S-side) — §2;
> **modality slopes** — olf/vis/verb/aud verbatim k-slopes + olfactory
> resurrection privilege (Engen & Ross; Herz & Engen; Chu & Downes) —
> §4.1/§5.7; **intrusion decay** — per-record `intrude_w` half-life
> (7d/90d/∞-ptsd) replaces the flat trauma discount — §5.7;
> **retrieval latency** — `latency_ms` power-of-strength + n_sim
> search channel feeding §5.16 TOT — §5.25; **preferential-attachment
> retells** — `pa_gain` makes told stories retellable, endogenizing
> canonization's tail — §4.13; **affect reconstruction** — reported
> valence blends toward current appraisal (Levine & Safer; Robinson &
> Clore) — §5.5; **bilingual balance** — `bilingual_bal` attenuates
> `lang_mismatch` — §5.2. +27 params in §7, probes P368–P377. All
> optional, default-neutral.

> **v3.5 note (encoding-mechanics III — the capacity/competition
> layer):** `memory/encoding-mechanics.md` Part III (§§30–38) prices
> what else was on screen and what was still open when a trace was
> born: **perceptual load** — the scene's crowding raises `att_min`
> for ambient records and thins peripherals, while LOW load spills
> involuntary capacity onto incidentals and absorbed scenes suppress
> lapses (Lavie 1995/2005; Cartwright-Finch & Lavie 2006; Murphy &
> Greene 2016 eyewitness result — `load_flag` births misinfo-prone
> records) — §30; **capacity bound** `wm_cap` (Cowan 2001, 4±1) —
> events write at most wm_cap full-strength elements, chunking via
> `coherentUnit`/DomainTable widens experts — §31; **attention
> residue** — post-boundary residual daLoad, worse after interruptions,
> relieved by clean closure (Leroy 2009) — §32; **next-in-line** —
> turn-anticipation hits attention+elaboration on other-agent content,
> an encoding locus per Bond 1985 — §33; **pending-intention ecology**
> — tonic daLoad hum from open loops, cue heating on goal-related
> material, and post-completion inhibition of the intention record
> itself (Goschke & Kuhl 1993; Marsh, Hicks & Bink 1998) — §34;
> **cognitive offloading** — `offload` events write hollow records
> (weak content, strong `extref` pointer); `offloadAttend` (zooming)
> nulls the cost; `extCue` intentions pay less tonic but bind cues
> half as well (Sparrow/Liu/Wegner 2011; Henkel 2014; Risko & Gilbert
> 2016) — §35; **threat capture** — `threatCue` records prioritize
> while co-occurring neutrals drain, scaled by trait anxiety per
> Bar-Haim 2007's absent-in-nonanxious meta — §36; **pre-sleep
> adjacency** — last-3h episodic records gain a shield at the sleep
> tick (Jenkins & Dallenbach 1924; Gais 2006) — §37; **varied-context
> re-encoding** — spaced re-activations in NEW contexts append cue
> fields (doors, not strength; Smith & Rothkopf 1984) — §38. Deliberate
> nulls: primacy (absorbed by boundary_gain+elaboration), reactive
> JOL (gen_gain), seductive details (daLoad), massed re-encoding
> (existing rails), reward (value_select fold), momentary suppression
> (suppress_da_map), post-learning exercise. +18 params in §7, +9
> frozen constants; probes P358–P367. All optional, default-neutral.

> **v3.4 note (character-profiles II — the narrative-self layer):**
> `memory/cast-profiles.md` Part II (§§8–10) adds the layer that makes
> a record store a *person*: **self-defining anchor records**
> (`selfdef`, `meaning`, `sdmCat` — archive floor, split drift, warm
> bias, defensiveness-scaled specificity; Singer & Salovey 1993;
> Blagov & Singer 2004); **mnemic neglect** — self-threatening
> feedback fails at recall only, gated by centrality×diagnosticity×
> self, relieved by close sources (Sedikides & Green 2000; Green et
> al. 2008); **life-script corrections** — negative records misdate
> forward (`neg_now_pull`), lifescript-positive records pull toward
> normative ages, involuntary scan biases positive (`invol_pos_bias`)
> (Berntsen & Rubin 2004; Rubin & Berntsen 2003); **redemption/
> contamination retell transform** on the meaning field
> (`script_redeem` × `redeem_write`; McAdams et al. 2001); **ambient
> profile tier** (`deriveParams(ambient:true)` — narrow trait band,
> no anchors, category-first person models). +16 params in §7, new
> trait axis `defens`; probes P334–P345. All optional, default-neutral.

> **v3.3 note (formal-model IV — the society layer, the cache
> discipline, the fitting layer):** `memory/formal-model.md` Part IV
> (§§26–35) pins everything *between* characters and everything that
> happens *to the spec itself*: **shared-event broadcast** — one
> ledger event, one independent encodeEvent per participant, atomic
> vs ticks, sorted-charId order (Loftus; Bartlett) — §26;
> **dyadic transaction order** — speaker drift commits before
> transmission, crash-legal step boundary, per-charId RNG streams —
> §26.2; **societySnapshot** at ledger boundaries only — §26.3;
> **conversationSession loop** — anchor chaining, visited-set, FOK
> retry, session_scan_cap termination — §27; **beliefStatus cache
> discipline** — derived pair authoritative, stored field a dirty-
> flagged cache, `belief_hyst` hysteresis, sticky `doubted` with
> `doubt_persist`, truth-default adoption baseline `truth_default_w`
> (Levine 2014; AGM rejected as too rational — §28); **age-continuity
> invariants** — params Lipschitz in age_eff, states via overlays,
> era-vs-capacity discipline — §29; **input validation** — clamp+log /
> NaN-reject / unknown-enum-degrades / `specVersion`+`migrate` schema
> versioning — §30; **degradation ladder L0–L4** — documented modes
> only, visibility-scoped — §31; **fitting layer** — parameter-
> recovery protocol (Nilsson et al. 2011; Palminteri et al. 2017),
> Wilson-CI/Benjamini–Hochberg probe statistics, Morris sensitivity
> screening of the sloppy-model map — §32. +7 params in §7; probes
> P322–P333. All optional, default-neutral.

> **v3.2 note (social-memory III — the other person's ledger):**
> `memory/social-memory.md` Part III (§§32–47) adds the dyadic
> bookkeeping layer plus the two biggest unmodeled forces on person
> memory: **two-dimensional trait space** — `PersonModel.eval`
  computed moral-primary (morality drives global evaluation and
> resists positive rehabilitation; Brambilla et al. 2019;
> Wojciszke 1998) — §1/§4; **FAE under load** — the STI write now
> runs Gilbert's correction stage gated by attention, so busy
> witnesses store the trait and lose the excuse (Gilbert, Pelham &
> Krull 1988) — §2; **status-asymmetric person memory** — we encode
> UP the hierarchy and stereotype down (Ratcliff et al. 2011;
> Guinote 2007) — §2; **destination memory** — toldTo edges decay
> faster than source edges and the confident miss grows with age
> (Gopie & MacLeod 2009; Gopie et al. 2010) — §4; **exposure
> familiarity** — ambient co-presence mints familiar-only person
> shells that feed transplant scoring (Jacoby et al. 1989 analog)
> — §2/§6.26; **gossip as evidence** — adopted told_by trait
> content writes back to the target's PersonModel at
> `heard_update_w·credibility` (Sommerfeld et al. 2007) — §6.31;
> **disclosure trust loop** — confidential/self-relevant tells
> raise eval+credibility BOTH directions (Collins & Miller 1994) —
> §6.14; **category-first individuation** — PersonModels born as
> category shells, individuating on diagnostic encounters (Fiske &
> Neuberg 1990) — §1/§5.10; **motivated transference** — new people
> resembling high-eval donors inherit schema-seeded traits and
> false fills (Andersen & Chen 2002) — §6.32; **novelty-gated
> retell** — field selection reads the audience's shared_with/
> toldTo ledgers (Clark common ground), errors included — §6.11;
> **phrasing lineage** — verbatim phrasing tokens survive hops as
> rumor forensics (Pickering & Garrod 2004) — §6.12; **contagion**
> formalized — listener affect tracks the speaker's *current*
> arousal (Hatfield 1994; Rimé 2009) — §6.33. +22 params in §7;
> probes P310–P321. All optional, default-neutral.

> **v3.1 note (individual-differences III — which store, which
> phenotype, whose pressure):** `memory/individual-differences.md`
> Part III (§§20–33) adds seven IndivTraits axes + two hormone/state
> overlays + one emergent store mechanic. **`face_ability`** — the
> separable store: loads ONLY on the §5.10 cascade (DP ~2.5%,
> super-recognizers ~1–2%, Kennerknecht 2006; Russell 2009; episodic
> params explicitly flat). **`adhd`** — an acquisition-deficit
> phenotype: encoding-side loads only, intact storage/retrieval
> (Skodzik et al. 2017 meta; Kofler WM d≈1.2; RI↑/PI↓ Söderlund
> 2022) + optional `hyperfocus_gate` (HYPOTHESIS). **`asd`** — the
> gist-side reversal: fewer phantoms/lures/leading-question
> adoption, MORE source confusion, verbatim preserved longer, OGM
> on self-cued recall (meta z=−2.37; Murphy et al. 2025; Lind &
> Bowler 2009; Crane & Goddard 2008). **`suggs`** — GSS Yield +
> Shift: new `hearAccount{negativeFeedback}` report-flip path
> (Gudjonsson 1984; Drake 2010). **`vigil`** — social-threat memory
> bias, recall-mode only (Cacioppo & Hawkley 2009; Mitte 2008 —
> recognition null is part of the model). **`aim`** — affect
> intensity: valence-symmetric w_emo load gated to affective
> records (Larsen & Diener 1985; the neutral-record null IS the
> finding). **`hand_mix`** — small retrieval-only episodic edge
> (Lyle, McCabe & Roediger 2008 task pattern). **`name_fan`** —
> tier-3 name rolls pay ln-directory-size cost (modeling
> hypothesis). **Cannabis** — `context.intox.kind`: shallower
> anterograde loss than alcohol but acute misinfo/lure
> susceptibility, gone at sober retrieval (Kloft et al. 2020
> PNAS). **meno/preg overlays** — SWAN transient practice-gain
> flattening with post-transition rebound (Greendale 2009;
> Epperson 2013); trimester-3-gated pregnancy effect (Davies 2018
> meta); menstrual cycle = documented REFUSAL. +19 params in §7;
> probes P298–P309. All optional, default-neutral.

> **v3.0 note (false-memory III — the passive channels, distortion
> nobody commits):** `memory/false-memory.md` Part III (§§26–37)
> adds the channels where the rememberer's own ordinary acts do the
> corrupting: **verbal overshadowing** — describing a face writes a
> verbal candidate that outcompetes the perceptual trace
> (Schooler & Engstler-Schooler 1990; Meissner & Brigham 2001;
> RRR Alogna et al. 2014 −4%/−16% timing gradient) — §6.25;
> **unconscious transference** — dead person-slots fill with
> familiar cue-plausible people; `orb_gain` own-group amplifier
> (Loftus 1976; Ross, Ceci, Dunning & Toglia 1994 ~3× misID;
> Meissner & Brigham 2001: 1.40× hits / 1.56× fewer FAs) — §6.26;
> **conjunction errors** — fields migrate between near-miss episode
> pairs while both survive (Reinitz et al. 1992; Odegard & Lampinen
> 2004, autobiographical + "remember" judgments) — §6.27;
> **boundary extension** — scenes encoded already-extended
> (`be_gain`, directional, age-preserved; Intraub & Richardson
> 1989) — §6.28; **denial backfire** — negated accounts write the
> affirmed candidate under a fast-decaying "denied" frame (Skurnik
> et al. 2005: 28%→40% false-as-true at 3d in older adults) —
> §6.29; **reactivation susceptibility** — just-recalled fields
> absorb misinformation at `react_suscept_mult` inside a short
> window (Chan, Thomas & Bulevich 2009 reversed testing effect;
> DEBATED vs interim-test protection) — §6.3; **phantom
> recollection** — false content splits vivid-remembered vs
> familiar-only at the richness gate (Brainerd et al. 2001; 2022
> conjoint-recognition meta) — §6.30; **dyad > group conformity**
> (`group_damp`, Dalton & Daneman 2006: 68% vs 49%) — §6.5;
> **truthiness** — nonprobative dressing feeds corroboration
> without touching plausibility (Newman et al. 2012) — §6.7.
> +16 params in §7; probes P286–P297 in validation-design.md.
> All optional, default-neutral.

> **v2.9 note (emotional-memory III — the feeling's grammar):**
> `memory/emotional-memory.md` Part III (§§26–39) deepens the affect
> layer in several directions: **discrete emotion tags** — `emotion` enum
> with appraisal-split consequences (fear→detail, anger→gist/heuristic,
> disgust→conditioning-resistant; Lerner & Keltner 2000/2001; Levine &
> Pizarro 2004; Chapman et al. 2013) — §2; **inverted-U encoding** —
> `arousal_opt`/`arousal_curv` bend the associative channel at extreme
> arousal while the item channel keeps rising (Diamond et al. 2007) —
> §2; **outcome rewrites feeling** — `emo_update_k` drifts remembered
> valence toward current appraisal at retrieval (Levine 1997/2001) —
> §5.9/§6.17; **privileged cues** — `odor_*` Proust channel (Chu &
> Downes 2000/2002; Willander & Larsson 2006) and `anniv_*` calendar
> intrusions (Morgan et al. 1998/1999) — §5.2/§5.7; **person
> conditioning** — `trust_neg_gain`/`trust_pos_gain` asymmetric
> person-CondEntries (Skowronski & Carlston 1989; Baumeister et al.
> 2001) — §4.9; **trauma repair** — `coherence` field grows by
> structured retells, gates intrusions and sleep stripping (Foa et al.
> 1995, DEBATED replication; Pennebaker & Seagal 1999) — §4.13/§6.11;
> **weapon focus** — `wf_gain`/`wf_loss` object capture (Steblay 1992;
> Fawcett et al. 2013) — §2; **recall→mood feedback** —
> `recall_mood_pull`/`nostalgia_gain` close the mood loop (Westermann
> 1996; Wildschut et al. 2006) — §5.5; **hot-cold gap** —
> `hc_gap_thresh`/`hc_gap_loss` compress cold-state arousal reports
> (Loewenstein 2005) — §8. +20 params in §7; probes P274–P285 in
> validation-design.md. All optional, default-neutral.

> **v2.8 note (age-decline III — the paradox layer, where aging
> inverts the deficit):** `memory/age-decline.md` Part III (§§34–48)
> adds the channels where old age *reverses* the naive expectation:
> **PM paradox** — focal PM stays age-flat (env-supported), habitual
> intentions gain `pm_habit_gain` with repetition, `ii_age_gate`
> rescues young-old then fails old-old (Rendell & Craik 2000; Rose
> et al. 2009; Chasteen et al. 2001; Kretschmer-Trendowicz et al.
> 2009) — §5.14; **antipeak lures** — `sync_lure_gain` lifts
> `lure_accept` off-peak in old only (Intons-Peterson et al. 1999)
> — §5.6; **errorful cost** — `potent_gain` halves in old age and
> needs a feedback window (Tse, Balota & Roediger 2010) — §4.11;
> **knowledge shield** — `know_corr_gain` lets dense semantic stores
> defeat fluent falsehoods; elders are *less* gullible on home turf
> (Brashier et al. 2017 correcting Fazio et al. 2015) — §6.7;
> **imagined-vs-done** — `rm_self_confuse` similarity-gated source
> flips (Henkel et al. 1998) — §6.10; **effortful listening** —
> `hearing` trait + `noise_cost` on verbal encoding (Rabbitt; Lin
> et al. 2011) — §2; **isolation & medication overlays** —
> `isolation` (Wilson et al. 2007) and `med_antichol` (Gray et al.
> 2015) join §4.17; **metamemory split** — `self_est_bias` drifts
> negative, `complaint_k` rises while monitoring stays accurate
> (Pearman & Storandt 2004) — §3/§10; **involuntary highway** —
> `invol_pos_gain`/`invol_remote_gain` on the ambient scan
> (Schlagman et al. 2009) — §5.7; **crystallized growth** —
> `enc_sem_mult` semantic encoding bump 45–60 — §2. +17 params in
> §7; probes P263–P273 in validation-design.md. All optional,
> default-neutral.

> **v2.7 note (age-development III — the bump's fuel, the adolescent
> regime, and the gates that never were):** `memory/age-development.md`
> Part III (§§23–35) gives the bump a *mechanism* and adolescence a
> *regime*: **firsts/transitions** — `first:true` events and runtime
> `transition` windows encode deeper, making the 10–30 density peak
> partially emergent (Robinson 1992; Brown & Lee 2010) — §2; **item-
> discrimination maturation** — `lure_accept` gains child knots: kids
> can't tell similar real events apart while resisting gist lures —
> three dissociable false-memory channels (Ngo et al. 2019; Rollins &
> Cloude 2018) — §4.2; **child interference** — `pi_child_mult` on
> n_sim for encodeAge<10 (Howe; Ceci & Bruck) — §4.2; **episodic-only
> amnesia gate** — semantic/procedural records exempt from all amnesia
> machinery (§4.14); **adolescent regime** — `peak_hour` +1.5h teen
> knot + `adolesc_sleep_loss` (Lo et al. 2016/2017), `social_eval_gain`
> (Somerville 2013), `coruminate_gain` retell ecology + OGM gate ≥12
> (Rose 2002; Sumner 2011) — §2/§4.13; **narrative onset** — retells
> in 12–25 mint cross-era thematic links (Habermas & Bluck 2000) —
> §4.13; **script dating prior** — `script_date_pull` in dateEstimate
> (Bohn & Berntsen 2011) — §6.15; **child PM** — `pm_interrupt_mult`
> child knots + `pm_scaffold_gain` (Kvavilashvili et al. 2001) — §5.14;
> **reversible regime overlays** — `preg` and `perimenopause` windows
> with time-limited signatures (Henry & Rendell 2007; Davies 2018;
> Greendale 2009 SWAN) — NEW §4.17. +17 params in §7; probes
> P251–P262 in validation-design.md. All optional, default-neutral.

> **v2.6 note (retrieval-cues III — what a cue IS):**
> `memory/retrieval-cues.md` Part III (§§20–29) goes under the cue
> field weights to the mechanics: **cue diagnosticity** — match gates,
> but diagnostic value sets magnitude (Nairne 2002; Poirier et al.
> 2012; corpus-relative IDF blend over the §4.2 cue buckets) — §5.2;
> **competitive emission** — bouts and the ambient scan emit by
> ratio-rule sampling with a failure-stop, not greedy sort (SAM;
> Raaijmakers & Shiffrin 1981) — NEW §5.22; **retrieval practice** —
> the recall-vs-re-exposure asymmetry priced and delay-gated
> (Roediger & Karpicke 2006; Pyc & Rawson 2009) — §5.9; **expanding
> retrieval** — retell schedule shape priced (Landauer & Bjork 1978)
> — §4.13; **suppression-induced inhibition** — cue-PRESENT
> suppression accrues a cue-independent trace decrement
> (Anderson & Green 2001, DEBATED robustness) — NEW §5.23;
> **involuntary cue diet** — the ambient scan weights sensory/
> peripheral up and topic down, verbatim-biased, intrusion_thresh
> now age-flat (Berntsen & Hall 2004; Schlagman et al. 2007) — §5.7;
> **intention ecology II** — armed nonfocal intentions add drive to
> the linked record AND tax all other recall; completed intentions
> refire as commission errors (Goschke & Kuhl 1993; Smith 2003;
> Walser et al. 2012) — §5.14; **self-initiation tax** — the age
> deficit concentrates in cue-sparse retrieval (Craik 1983/1986;
> Lindenberger & Mayr 2014) — §5.4; **ease inversion** — retrieving
> MORE can convince the judge of LESS (Schwarz et al. 1991) — NEW
> §5.24; **access_gap metric** — "forgotten" operationalized as a
> probe condition (Tulving & Pearlstone 1966) — validation only.
> +18 params in §7; probes P241–P250 in validation-design.md.
> All optional, default-neutral.

> **v2.5 note (forgetting-curves III — what the curves are for):**
> `memory/forgetting-curves.md` Part III (§§12–16) grounds the decay
> engine's *purpose* and its tails: **rational calibration** — forgetting
> should track the world's reuse statistics (Anderson & Schooler 1991),
> formalized as the reuse-calibration axiom `R(g_med) ∈ [0.4,0.7]` per
> content class (§4.1, P239); **slope-invariance axiom** — β may never
> depend on E/arousal/rehearsal, intercept carries durability (Slamecka &
> McElree 1983, DEBATED but adopted; §4.1, P231); **event time** — decay
> argument becomes `t_eff` mixing wall-clock with intervening event load
> (Wixted 2004; Howard & Kahana 2002) — §4.1; **face permastore** —
> familiar faces survive ~flat for decades (Bahrick et al. 1975) — §4.7;
> **transformation gain** — verbatim-field death feeds gist S
> (Winocur & Moscovitch 2010, DEBATED mechanism) — NEW §4.16;
> **state-context drift** — internal-state cues decorrelate with a 21d
> half-life (Estes; Mensink & Raaijmakers) — §5.3; **sleep-coupled affect**
> — 40% of valence fade executes at the sleep tick (van der Helm & Walker
> 2009, DEBATED) — §4.5; **HSAM/SDAM tails** — profile-layer modifiers for
> the population extremes (LePort 2012; Palombo 2015), distortion dials
> untouched (Patihis 2013). +7 params in §7; probes P231–P240 in
> validation-design.md. All optional, default-neutral.

> **v2.4 note (encoding-mechanics II — motivational state and content
> class):** `memory/encoding-mechanics.md` Part II (§§15–29) prices the
> state around intake and the content class at the door: **attentional
> boost** — a `detected:true` event raises its own E AND co-temporal
> ambient records (dual-task cost runs backwards at detection; Swallow &
> Jiang 2010/2014) — §2; **curiosity spillover** — curious states boost
> the target and unrelated same-window records, window-locked (Gruber et
> al. 2014; Murphy et al. 2021) — §2; **wakeful rest** — a quiet
> ~10-minute post-encoding window shields new traces from interference
> (Dewar et al. 2012, age-flat) — §2; **implementation intentions** —
> ifCue+thenAct plans bind their trigger ~d=.65 harder (Gollwitzer &
> Sheeran 2006) — §2/§5.14; **teach expectancy** — expecting to relay
> organizes intake (Kobayashi 2019 meta g=.35) — §2; **proper-name
> penalty** — unfamiliar-person names born thin, age-scaled (Cohen 1990)
> — §2; **owngroup_loss made real** — contact-moderated, mirror-pattern
> (Meissner & Brigham 2001) — §2; **expertise** — in-domain events
> encode deeper AND wider, zero transfer (Chase & Simon 1973) — §2;
> **item-method directed forgetting** — `tagEvent{forget:true}` blocks
> rehearsal after birth; weakens, never deletes (MacLeod 1998;
> emotional/neurot resist per metas) — §2; **crafted engagement** —
> drawing/building collects enact+gen+concrete, dementia-robust (Wammes
> et al. 2016; Meade et al. 2019) — §2. +12 params in §7; probes
> P221–P230 in validation-design.md. All optional, default-neutral.

> **v2.3 note (validation-design II — the meta layer):**
> `memory/validation-design.md` Part II (§§22–32) adds the machinery that
> audits the probe battery itself: identifiability matrix (§7 params get
> {structural|practical|identified|prior-held} class — Raue et al. 2009;
> Tulving & Pearlstone 1966 storage/retrieval aliasing), Morris
> sensitivity screening producing a computed param→observable map,
> pattern-oriented corroboration (Grimm et al. 2005 — ≥2 independent
> patterns to claim a constraint), a lesion battery that is the dual of
> the probe registry, anti-Goodhart seed-split/held-out-probe discipline,
> simulation-based calibration (Talts et al. 2018), measurement
> invariance levels for cross-cohort probes (Meredith 1993), and a
> four-bucket failure triage. **Two new harness hooks in §10:** `lesion`
> (validation-only mechanism ablation) and the seedBase parity
> convention. No behavior changes; zero new params; probes P211–P220.
> All optional, default-neutral.

> **v2.2 note (character-profiles II — the cast pass):**
> `memory/cast-profiles.md` compiles the 8 mains from the world-track
> bibles and forced three sourced mechanisms into the spec.
> **Migration bump** — the §4.1 bump term evaluates over a per-character
> `bump_windows` list compiled from `ProfileInput.lifeEvents`
> (immigration shifts/doubles the bump, Schrauf & Rubin 1998/2001) —
> §4.1. **Secrecy is mind-wandering** — `confidential` records intrude
> on the ambient scan via `secret_mindwander`, ~2× concealment rate
> (Slepian et al. 2017) — §5.7/§6.22. **Attachment avoidance** — new
> IndivTraits axis `attach_avoid` with preemptive `attach_encode_loss`
> on `attachment:true` events + `attach_ret_cost` on retrieval,
> non-attachment emotional records untouched (Edelstein 2006; Fraley
> et al. 2000) — §2. **Self-concealment** — `self_share_pen` splits
> self-relevant transmission from `share_k` (Larson & Chastain 1990) —
> §4.13/§6.22. +6 params in §7; probes P201–P210 in
> validation-design.md §21. All optional, default-neutral.

> **v2.1 note (formal-model III — the measurement layer):**
> `memory/formal-model.md` Part III (§§18–25) closes the last informal
> holes: **the similarity operator** — `simOp(a,b,mask)` with a
> per-callsite field-weight table replaces nine ad-hoc sim uses; names
> match phonologically (Conrad & Hull 1964), when-distance is a
> gradient feature (Friedman 1993) — §11.1 + §4.2; **metamemory
> instruments** — `fok` on failed/TOT recall built from accessibility,
> not accuracy (Koriat 1993; episodic-only age deficit, Souchay et al.
> 2000) and `jol` at encode with immediate-JOL fluency inflation
> (Nelson & Dunlosky 1991) — §5.21; **steady-state numerics** — the
> closed-form census says caps are burst bounds, forgetting is the
> regulator (formal-model §20); **distribution axioms** — truncated
> Gaussians, uniform drift steps, integer RNG, namespaced opSeq
> (formal-model §22). +11 params in §7; probes P193–P200 in
> validation-design.md §20. All default-neutral.

> **v2.0 note (social-memory II — the talk ecology):**
> `memory/social-memory.md` Part II (§§18–31) deepens the social layer:
> **sharing motive** — retell propensity driven by |affect| with a shame
> suppressor, and talk never extinguishes emotion (Rimé 1998; Zech &
> Rimé 2005 recovery illusion) — §4.13; **retrieval-induced
> facilitation** — integrated unsurfaced material is boosted, not
> suppressed (Chan, McDermott & Roediger 2006) — §5.8; **corroboration
> inflates confidence** asymmetrically and irreversibly (Wells &
> Bradfield 1998) — §6.20; **common-ground overreach** — co-presence
> mints assumed-knowledge entries that are wrong at trait rates
> (Keysar; Birch & Bloom 2007) — §6.21; **interpret bias** — ambiguous
> behavior assimilates to the person model at encoding while contrary
> behavior still gets incongruity_gain (Anderson et al. 2011) — §2;
> **confidentiality decays faster than content** — secrets leak on a
> schedule, silently (source-amnesia asymmetry) — §2/§6.22;
> **absorption** — repeated rich told_by narratives can flip
> provenance to experienced (Hyman et al. 1995; Pillemer et al. 2015)
> — §6.23; **canonization** — the oft-told story freezes, warts and
> all, and then resists late misinformation (Marsh & Tversky 2004) —
> §6.24; **joint attention** amplifies encoding valence-symmetrically
> (Boothby et al. 2014) — §2; **transactive loss** — an absent
> directory-partner leaves pointer-rot grief (Harris et al. 2014) —
> §6.14. +17 params in §7; probes P183–P192 in
> validation-design.md §19. All optional, default-neutral.

> **v1.9 note (individual-differences II — state noise, language,
> culture, metacognition):** `memory/individual-differences.md` Part II
> (§§9–19) adds the second trait block. **New params (§7):**
> `iiv_sigma` (day-to-day inconsistency, age/WMC-scaled — Hultsch 2000),
> `omit_p` (mind-wandering encoding omission — Smallwood & Schooler;
> Unsworth & McMillan), `lang_mismatch` (language-of-encoding cue
> attenuation — Marian & Neisser 2000), `meta_cal`/`complaint_k`
> (metamemory slope + complaint decoupling — Kleitman & Stankov 2007;
> Jonker 2000), `check_conf_loss` (verification erodes confidence —
> van den Hout & Kindt 2003), `expert_lure` (in-domain semantic-lure
> bonus — Castel et al. 2007), `intox_encode_mult`/`intox_state_dep`
> (alcohol state — White 2003 anterograde). **Formula changes:**
> `age_eff = (age_now − reserve·reserve_shift)·(1 + 0.2·aging_rate −
> 0.15·fitness)` — individual aging slopes (Salthouse; Erickson 2011);
> record schema gains optional `lang`; `cueContext` gains `lang`,
> `verify`, `intox`. New explicit nulls: bilingual→wmc (Paap),
> meta_conf→accuracy, checker→accuracy, culture_self→β, fitness→β
> (individual-differences.md §17). All v1.9 fields optional, default
> neutral; monolingual `langs` makes `lang_mismatch` dead code.

> **v1.8 note (false-memory II — candidates, claims, coercion):**
> `memory/false-memory.md` Part II fixes what v0.6 got wrong at the
> storage layer and adds the self-authored channels: **adoption is
> candidate competition, never overwrite** — verbatim fields are
> candidate sets `{value, candStrength, provenance, day}`, originals
> survive and resurface (McCloskey & Zaragoza 1985; Lindsay & Johnson
> 1989; Tousignant 1986) — §6.3; **lies believed** — `claim:true` on
> `imagineEvent`, gen+prod gains, `fab_inflate` flip scaled by
> discrim_mult (Polage 2004/2012) — §6.9; **coerced production** —
> `answerProbe(forced:true)` confabulation with developmental gradient
> and suggested-answer persistence (Ackil & Zaragoza 1998; Pezdek,
> Sperry & Owens 2007; Gudjonsson distrust→internalization) — §6.9;
> **evidence bends the plausibility gate** — `evid_boost`, photos
> pre-satisfy the richness gate (Wade, Garry, Read & Lindsay 2002) —
> §6.9; **cryptomnesia** — `crypto_p` heard→self flip, proximity-boosted
> (Brown & Murphy 1989) — §6.10; **consistency pull** — reconstruction
> drifts toward the current self, `consist_pull` +
> `choice_support_gain` (Ross 1989; Henkel & Mather 2007; Mather &
> Johnson 2000) — §6.17; **choice blindness** — `swapOutcome`/`cb_detect`
> seam ownership for possession handoffs (Johansson et al. 2005) —
> §6.18; **content–mood paradox** — `neg_gist_gain` vs
> `negmood_verbatim_gain` (Bookbinder & Brainerd 2016) — §6.3/§2;
> **warning timing** — `prewarn_mult`, `inoc_mult`/`inoc_days` decaying
> inoculation (Banas & Rains 2010) — §6.3; **repression is a documented
> non-mechanism** — no repress() ever — §6.19. +13 params in §7; probes
> P163–P172 in validation-design.md §17.

> **v1.7 note (emotional-memory II — the affect-tag layer):**
> `memory/emotional-memory.md` Part II deepens what v0.5 left as
> scalars: the affect tag is born by **peak-end, not mean** (Kahneman
> et al. 1993; Redelmeier & Kahneman 1996; duration neglect) — §2;
> **sleep strips heat, not story** — `sleep_affect_strip`, trauma-exempt
> (Walker & van der Helm 2009; DEBATED, toggleable) — §2 sleep;
> arousal buys the item and **sells the context** — `emo_assoc_loss`,
> graded link_p/`when`/source cost ≥0.5 arousal, generalizing the
> trauma phenotype (Kensinger & Schacter 2005; Bisby & Burgess 2014;
> Madan et al. 2017) — §2; **saying it changes it** — `verbal_dampen`
> on social retell, solo rehearsal exempt (Lieberman 2007) — §6.11;
> **regulation style** is a trait: suppressors encode less, reappraisers
> encode cooler tags (Richards & Gross 2000; Dillon 2007) — §2;
> conditioned affect **generalizes along a similarity gradient** widened
> by trauma load (Dunsmoor 2009; Lissek 2010) + **reconsolidation-window
> extinction** writes deep suppressors (Schiller 2010, DEBATED
> boundary) — §4.9; the **FAB has a self-boundary** — `fab_self_gate`,
> gossip negativity does not heal (Walker 2003) — §4.5; **hearsay
> carries heat** — `contagion_k` × speaker_express × empathy, vicarious
> conditioning (Rimé 2009; Olsson & Phelps 2007) — §6.3; §2.3 gains
> **tag-capture**: cue-agnostic half-strength rescue of weak temporal
> neighbors (Dunsmoor, Murty et al. 2015). +14 params in §7; probes
> P154–P162 in validation-design.md §16.

> **v1.6 note (age-decline II — the compensation layer):**
> `memory/age-decline.md` Part II adds what aging minds do
> *differently*, not just worse: value-directed selectivity — the old
> system prices importance steeper, sparing high-value encoding while
> abandoning the rest (Castel, Benjamin, Craik & Watkins 2002; Castel
> 2023); the positivity effect on encoding AND selection, collapsed by
> load/stress (Reed, Chan & Mikels 2014 meta; Mather & Knight 2005);
> hyper-binding — wrong-context verbatim fields, implicit-only
> (Campbell, Hasher & Thomas 2010); destination memory — `toldTo` misses
> produce the repeat-story tell (Gopie & MacLeod 2009; El Haj 2012);
> context>content decay asymmetry (Spencer & Raz 1995 meta);
> misrecollection — old errors at HIGH confidence (Dodson & Krueger
> 2006; Shing et al. 2008); prior-knowledge scaffold (Castel 2005;
> Umanath & Marsh 2014); stereotype threat — recall-only, evaluative
> contexts (Lamont, Swift & Abrams 2015; Armstrong et al. 2017);
> gist-false-memory age knots (Balota et al. 1999); intimate-dyad
> collaborative facilitation — old couples remember better together
> (Harris et al. 2011; Barnier et al. 2014); olfactory cue-encoding
> decline (Doty 1984). Deliberate non-change: `misinfo_suscept` old
> knots stay modest — the aging signature is confidence, not adoption.
> Schema +`toldTo`/`hyperbound`; §7 +9 params +3 knot updates; probes
> P145–P153. All optional w/ defaults; backward compatible.

> **v1.5 note (age-development II):** `memory/age-development.md` Part II
> deepens the developmental layer: infantile records go **latent, not
> erased** — below-floor pre-amnesia records are invisible to normal
> recall but reinstatable by compound sensory+place cues (Travaglia et
> al. 2016; Guskjolen et al. 2018; Rovee-Collier retention window);
> `reminiscence_env` — caregiver reminiscing style shifts the amnesia
> boundary ±1.5y (Fivush & Nelson 2004; Reese & Newcombe 2007);
> `strategy_ramp` gates elaboration/generation gains in childhood with
> `scaffolded` events as the bypass (production deficiency, Flavell
> 1970); `offtarget_p` — retrieval-side inhibition loss emits
> era-mate intrusions in old-age bouts (Arbuckle & Gold 1993; Hasher &
> Zacks 1988); **sign fix** — stored knowledge protects OLDER adults
> against fluent repeated lies while young adults neglect knowledge
> (Brashier et al. 2017 vs Fazio et al. 2015); childhood `sws_mult`
> inversion + nap consolidation (Kurdziel et al. 2013); the bump extends
> to cultural semantic records with an intergenerational cascade peak
> (Krumhansl & Zupnick 2013; Svob & Brown 2012); metamemory knots —
> children miscalibrated UP; internal/external source-confusion channel
> split (Foley & Johnson 1985). New §4.14–4.15, §5.19–5.20; schema
> +`latent`; §7 +18 params; probes P136–P144. All optional w/ defaults;
> backward compatible.

> **v1.4 note (retrieval-cues II):** `memory/retrieval-cues.md` Part II
> gives cues a job description: transfer-appropriate processing — a cue
> matches the *process* used at encoding, not just its features (Morris,
> Bransford & Franks 1977); output interference — exhaustive recall
> self-destructs (Tulving & Arbuckle; Roediger & Schmidt 1980);
> prospective cue ecology — focal event cues fire near-automatically and
> age-flat, nonfocal/time-based need costly monitoring (Einstein &
> McDaniel 1990; Henry et al. 2004 meta); context-scoped extinction and
> ABA renewal (Bouton 2004); stateful TOTs with phonological resolution
> and error-repetition learning (Abrams et al. 2007; Warriner & Humphreys
> 2008); reminding chains — a retrieved record cues its links (§5.17);
> and sleep-context cuing (Rasch et al. 2007 — SWS reactivation is
> cue-bound). New §5.12–5.18; schema +`encodeOps`/`extinctCtx`/`tot_fields`;
> §7 +11 params; probes P127–P135. All optional w/ defaults; backward
> compatible.

> **v1.3 note (forgetting-curves II):** `memory/forgetting-curves.md` Part
> II calibrates the *active* side of forgetting: spacing-aware storage
> growth (Cepeda 2006 lag optimum), the testing/re-exposure split
> (Roediger & Karpicke 2006 inversion), failed-retrieval potentiation
> (Kornell 2009), verbatim-quote sub-daily decay (Sachs 1967 — wording
> dies in ~1 min of intervening speech), accumulating proactive
> interference with category-shift release (Underwood 1957; Wickens
> 1970), childhood amnesia step→ramp with coherence-gated survival
> (Bauer & Larkina 2013–2015), deliberate suppression as a bounded
> R-side leak (Anderson & Green 2001 — ~8%, replication-flagged),
> event-based intention persistence, retell-ecology rehearsal draws, and
> per-attempt reminiscence resurfacing. §7 +19 params; probes P117–P126.
> All optional w/ defaults; backward compatible.

> **v1.2 note (encoding-mechanics):** `memory/encoding-mechanics.md` adds
> the processing-side layer §2 was missing: elaboration depth (LoP;
> maintenance-rehearsal and intention-to-learn as formal nulls), engagement
> mode (enacted > generated > spoken > heard — Bertsch 2007, Roberts 2022),
> divided-attention asymmetry (encoding fragile, retrieval obligatory —
> Craik 1996), stochastic attention lapses, event segmentation (boundary
> privilege, cross-boundary order loss, doorway/location-updating —
> Radvansky), unitization rescue of the aging associative deficit,
> mood-congruent encoding, concreteness. Self-relevance now saturates
> (Symons & Johnson 1997). Survival processing is adjudicated and FOLDED
> into elaboration — no dedicated param (Scofield 2018 meta). §7 +14
> params + 4 frozen constants; Event schema +7 fields; probes P106–P116.
> All optional w/ defaults; backward compatible.

> **v1.1 note (validation-design):** `memory/validation-design.md`
> consolidates probes P1–P95 into a tiered registry (MUST/SHOULD/OBSERVE),
> adds the harness contract (cohorts, event generators, measurement-only
> hidden-field tap, JSONL output), the statistical protocol (pre-registered
> bands, TOST equivalence for the model's explicit nulls, BH-FDR, OSC-2015
> replication discount on single-study targets, regression goldens), an
> 11-study experiment-analog battery (E1–E11), population-level checks
> (profile distinctness, trait-structure preservation, age-curve
> conformance, season-field stats), an L4 believability rubric, acceptance
> gates for substrate merge, and new probes P96–P105. No parameter or
> record-schema changes — this version changes only how the model is
> *tested*. Implementers: §10's hidden flags (`accuracy`, `phantom`,
> `retracted`, `possessed`, `sleepdep_flag`, `storageS`,
> `retrievalCount`) are readable by the validation harness ONLY.

> **v1.0 note (character-profiles):** `memory/profile-generation.md` adds
> the profile compiler (full `deriveParams` pipeline + coherence
> invariants + frozen-constant audit), a metamemory `SelfModel` side-
> output (felt competence barely tracks real competence — Herrmann 1982),
> occupational-expertise mechanics with real costs (Chase & Simon
> boundary, Woollett & Maguire 2009 deficit), and open-goal records
> (`open` flag — involvement-gated Zeigarnik layer; the reliable effect
> is intrusion/resumption, not recall advantage). New params are all
> optional with defaults; backward compatible.

> **v0.9 note (formal-model):** `memory/formal-model.md` now pins what this
> spec left informal — exact timebase/units, Event/CueContext input schemas
> with derivation defaults, strict operator ordering for
> encodeEvent/recall/dailyMemoryTick/hearAccount, an identifiability audit
> (which params are per-character vs frozen population constants), record
> caps + ambient-NPC degraded mode, possession/thin-AI edge-case semantics,
> seeded-RNG determinism, and machinery probes P68–P75. Implementers: read
> §8.1 below before wiring the tick loop.
>
> **v0.9 deepening:** the same doc's Part II formalizes five mechanisms
> that were still informal — storage/retrieval strength split (§4.11,
> §5.9), temporal dating (§6.15), hindsight (§6.16), fluency→confidence
> (§3, §5.4 searchCost), and temporal contiguity (§5.4) — plus closed-
> form calibration targets and probes P76–P85.

**Track:** memory-research (sf/memory) · **Audience:** game-systems track (implements
substrate items: memory salience/decay, rumor distortion, belief-vs-fact)
**Grounding:** every mechanism here traces to `human-memory-research.md` (section
numbers cited as R§n). This spec is intentionally framework-agnostic pseudocode;
data shapes are JSON-serializable.

Design goals, in priority order:
1. Characters are **selective** — most ambient events are never encoded or decay away.
2. Characters are **reconstructive** — recall rebuilds gist, drifts, confabulates.
3. Characters are **cue-driven** — memories surface via context overlap, not lookup.
4. Characters are **sometimes wrong with confidence** — confidence ≠ accuracy.
5. All behavior is **parameter-per-character** — same equations, different weights
   (see `character-memory-profiles.md`).

---

## 1. Stores and record schema

Four stores per character (R§1). Only episodic and semantic are first-class
records; procedural and emotional are derived state.

```json
MemoryRecord = {
  "id": "m_<uuid>",
  "type": "episodic" | "semantic",
  "createdDay": 412,                  // world day index
  "encodeAge": 34.6,                  // v0.3: character's age AT ENCODING —
                                      // era effects (amnesia ramp, bump
                                      // window) key on this; capacity
                                      // effects key on age_now
  "lastAccessDay": 418,

  // CONTENT
  "gist": "argued with Mara at Mudhaus over the rent hike",   // durable summary
  "verbatim": {                       // fragile details, decay fast
    "who": ["Mara"], "where": "Mudhaus Coffee",
    "quote": "...", "sensory": "smell of burnt espresso"
  },
  "source": {                         // source-monitoring tag (R§6)
    "kind": "witnessed" | "told_by" | "inferred" | "imagined" | "self",
    "who": "charId|null", "confidenceInSource": 0.9
  },
  "beliefStatus": "fact" | "belief" | "rumor" | "doubted",  // belief-vs-fact layer

  // STATE (all recomputed/updated by operators below)
  "strength": 0.62,                   // current retention R(t), 0..1 —
                                      // v0.9: this field IS retrieval
                                      // strength R in the two-strength
                                      // split (§4.11)
  "storageS": 0.62,                   // v0.9: storage strength S — how
                                      // learned the record is; init =
                                      // encodingE, grows on difficult
                                      // retrievals, near-permanent (§4.11)
  "encodingE": 0.74,                  // encoding strength at birth (immutable)
  "confidence": 0.7,                  // subjective certainty; independent of accuracy
  "accuracy": 0.95,                   // ground-truth drift accumulator (hidden from char)
  "emotional": { "valence": -0.6, "arousal": 0.8 },  // affect tag, own decay
  "encodeMood": -0.2,                    // character's mood at encoding (v0.2;
                                         // distinct from event valence —
                                         // drives mood-STATE dependency §5.4)
  "cueVector": { "place": "mudhaus", "people": ["mara"],
                 "topic": ["rent"], "sensory": ["espresso"],
                 "mood": -0.4, "era": "current" },
  "links": ["m_other1", "m_other2"],  // associative edges (schema/episode chains)
  "retrievalCount": 3,
  "trauma": false,                    // v0.5: set at birth if
                                      // arousal ≥ trauma_thresh — record-
                                      // level phenotype, see §7 of
                                      // emotional-memory.md
  "phantom": false,                   // v0.6: event never happened (gist-
                                      // lure or planted, §6.8/6.9) —
                                      // hidden from the character
  "retracted": false,                 // v0.6: corrected content; still
                                      // leaks via cie_residual (§6.6)
  "hearCount": 0,                     // v0.6: times this content reached
                                      // the character from ANY source —
                                      // repetition, not variety (§6.3)
  "sleepdep_flag": false,             // v0.6: encodeDay sleepFactor was
                                      // <0.75 — permanent susceptibility
                                      // marker (Frenda 2014, §2/§6.3)
  "possessed": false,                 // v0.9: encoded while the character
                                      // was player-possessed — hidden like
                                      // phantom; gets possess_alien
                                      // estrangement discount at recall
                                      // (formal-model.md §6)
  "n_sim": 0,                         // v1.3: similar records encoded
                                      // since (§4.2 PI accumulator)
  "suppressed": 0,                    // v1.3: suppression count (§4.12)
  "attempted": false,                 // v1.3: failed-recall flag —
                                      // next re-encoding potentiated
                                      // (§4.11)
  "encodeOps": "semantic",            // v1.4: dominant processing channel
                                      // at encoding (semantic|perceptual|
                                      // social|enactive) — derived from
                                      // v1.2 engagement/elaboration;
                                      // retrieval-side TAP gate (§5.12)
  "tot_fields": {},                   // v1.4: {field: unresolvedTOTcount}
                                      // — error repetition is field-
                                      // specific (§5.16, Warriner &
                                      // Humphreys 2008)
  "latent": false,                    // v1.5: pre-amnesia record below
                                      // floor — invisible to recall,
                                      // reinstatable only via compound
                                      // sensory cues (§4.14, §5.20;
                                      // Travaglia 2016) — hidden
  // v4.7 additions (forgetting-curves V — channel curves):
  "persSem": false,                   // semanticized self-fact minted
                                      // from an archived episode
                                      // (§4.23, Renoult 2012) — rides
                                      // beta_semantic, merge/amnesia
                                      // exempt
  "transg": false,                    // own-norm-violation record —
                                      // vividness decays ×transg_
                                      // vivid_mult, accuracy UNCHANGED
                                      // (locked null, §4.23)
  "source": "event",                  // event|told|imagined|dream —
                                      // dream minted at sleep tick,
                                      // wake-gated (§4.24)
  // v4.8 additions (retrieval-cues V — cue plan/rival/reach):
  "encodePhys": "sober",              // sober|intoxicated|sleepdep|
                                      // caffeinated — pharmacological
                                      // bucket for the SDR leg (§5.46)
  "milestone": false,                 // transitional-life-event tag —
                                      // life-script cue privilege
                                      // (§5.43, Berntsen & Rubin 2004)
  "df": false,                        // directed-forget flag — soft,
                                      // reversible, rehearsal-
                                      // starvation only (§5.48)
  "accessLog": []                     // optional debug; may be capped
}
// v4.9 additions (age-development V — event/record fields):
//   eventClass.amnesia_pierce {0,1,2} + event public_scale {0,1,2}
//   (world tags); record flags earliest_candidate (minted by the
//   §4.1 pierce), chapter:true (public_scale≥1 mint), lang minted
//   from ambient-at-encodeAge (v1.9 field, now era-keyed),
//   regime:puberty on overlay-era records. All C-tier visible.
// v4.7 derived channel weights (not stored): recol_w = mean surviving
// verbatim-field strength (0 on persSem/semantic); fam_w = gist leg ×
// (1 + impl_fam_w·impl_str). Report gate at rk_thresh (§4.23).

- **Episodic** records: specific events (what/where/when). Most records.
- **Semantic** records: decontextualized facts ("Mara is the landlord's friend").
  No `verbatim`; slower decay. Often created by gist abstraction (§7.4)
  or by §4.23 persSem minting (self-facts — v4.7).
- **Procedural**: not stored as records — a small skill/affinity map
  (`{skill: {level, kind, uses}}`); **v4.7 split:** `kind:"cont"` decays
  at `beta_proc_cont` (0.02 — motor/continuous), `kind:"cog"` at
  `beta_proc_cog` (0.12 — discrete/accuracy-based procedures; Arthur et
  al. 1998 — cognitive skills DO decay, correcting the v1.3 blanket).
  `skill_overlearn` (level ≥0.8 or uses ≥50) → β×0.5; `relearn_gain`
  applies to both. Out of scope for v0 dynamics.
- **Emotional**: affect tags live ON records (above) plus a per-character
  conditioned-associations table that can survive the episodic source
  (Bechara split, R§1): a character can feel dread at a doorway without
  remembering why. **v0.5** gives it real dynamics (§4.9,
  emotional-memory.md §6):

```json
CondEntry = { "cue": "mudhaus", "valence": -0.6, "arousal": 0.7,
              "strength": 0.5, "safeCount": 0, "lastFireDay": 500,
              "extinctCtx": [] }     // v1.4: contexts where extinction
                                     // exposures happened — suppression
                                     // is context-scoped (§5.15, Bouton)
```

**Social store (v0.8):** one `PersonModel` per known individual — memory
*for people* is organized around person nodes, not episode lists
(Hastie & Kumar 1979; Srull & Wyer 1989; social-memory.md §1):

```json
PersonModel = {
  "personId": "mara",
  "familiarity": 0.8,       // "have I met them" — decays slowest
                           // (beta_semantic·0.5)
  "identityStrength": 0.6,  // face→biography binding — decays at
                           // beta_source (associative link, §2 link_p)
  "nameStrength": 0.4,      // weakest tier — last learned, first lost
  "traits": {"stingy": 0.6},// spontaneous-trait-inference accumulator (§2)
  "knowsTopics": ["rent law"], // transactive directory (§6.14, §5.10)
  "credibility": 0.55,      // LEARNED source credibility — feeds the
                           // sourceCredibility factor in §6.3 (§6.14)
  "cheaterLoad": 0.7,       // morality-diagnostic weight accumulator;
                           // >0.5 slows source decay on linked
                           // records (§4.10)
  "categoryTags": ["tenant", "woman", "40s"],  // for §6.10 in-category
                           // source confusion — supplied by world-builder;
                           // absent → operator falls back to cue overlap
  "lastSeenDay": 430,
  // v3.2 additions (social-memory.md Part III §§32, 36, 40):
  "eval": 0.1,              // global evaluation = moral_primacy·mean(moral
                           // traits) + (1−moral_primacy)·mean(rest); what
                           // ingroup_factor and tell-selection read (§32)
  "individuation": 0.2,     // 0=category shell → 1=person-based; grows
                           // individ_rate per diagnostic encounter (§40);
                           // trait queries interpolate catPrior↔traits
  "exposureCount": 34       // ambient co-presence sightings; drives
                           // familiarity-only accrual (§36) + transplant
                           // candidate weight (§6.26)
}
```

**Edge store (v4.3):** one `RelEdge` per observed alter–alter
relation — memory for *other people's relationships* is a separate
per-observer store, schema-warped by balance (De Soto 1960;
social-memory.md §50):

```json
RelEdge = {"a": "mara", "b": "jules",   // ordered pair, observer-local
           "kind": "sentiment",          // "sentiment"|"unit" — balance
                                         // ops apply to sentiment only
           "sign": +1, "str": 0.6, "dayObserved": 401}
```

---

## 2. Encoding — birth of a memory

When an event reaches a character (witnessed, heard, done), compute encoding
strength **E ∈ [0,1]** as a weighted geometric-ish blend — multiplicative where
the literature demands a gate, additive elsewhere (R§2):

```
E = E0 · attention · (1 + w_emo·arousal_eff + w_self·selfRelevance_eff
                      + w_nov·novelty + w_pred·predictionError)
    + elab_gain·elaboration + spacingBonus
```

(**v4.0:** `arousal_eff` = event arousal + `misattrib_k·carryArous` —
excitation carryover, see below; `w_emo` = `w_emo_arous +
w_emo_dist·(1 − emo_rate)` — the split, see below.)

**v1.2 — processing terms:** `selfRelevance_eff = selfRelevance^0.7`
(saturating — the self-reference meta's compressed high end; Symons &
Johnson 1997, d≈0.65 vs semantic but ~half vs other-reference) and
`elaboration ∈ [0,1]` is a derived Event field (deep semantic work done
on the event; default `clamp(0.5·selfRelevance + 0.3·predictionError +
0.2·coherence + 0.3·survivalRelevance, 0, 1)` — encoding-mechanics.md
§§1, 9). Two formal NULLS live here: repetition without elaboration adds
nothing (Craik & Watkins 1973 — maintenance rehearsal), and intention to
learn adds nothing past the orienting task (`intent_null = 0`, frozen —
Postman 1964; Hyde & Jenkins 1973).

- `E0` = character base encoding rate (param `enc_base`, ~0.35).
- `attention ∈ [0,1]` — is the event in focus? Ambient/background events get
  attention ≈ 0.1–0.3; inattentional gate: if `attention < att_min` (param),
  **no record is created at all** (R§2 gorilla result).
- `arousal` = event emotional intensity 0..1; `w_emo` param.
  **v4.0 — the split (emotional-memory.md §47):**
  `w_emo = w_emo_arous + w_emo_dist_eff` where `w_emo_arous ≈ 0.55`
  is the consolidation-linked term (delay-growing advantage, carries
  the §27 inverted-U and §48 sex modulation) and
  `w_emo_dist_eff = w_emo_dist·(1 − emo_rate)` (w_emo_dist ≈ 0.35)
  is the immediate-test distinctiveness component — `emo_rate` is
  the character's running mean share of arousal≥0.5 encodings
  (init 0.15, update α 0.01/day). Chronically dramatic lives lose
  the distinctiveness boost — Talmi et al. 2007 pure-list
  elimination is the between-person version of the same math
  (Schmidt & Saari 2007). `w_emo` remains the derived sum for
  backward compatibility; loaders reject configs setting all three.
  **v4.0 — excitation carryover (emotional-memory.md §40):**
  effective arousal for the E-term and tag mint is
  `arousal_eff = arousal + misattrib_k·carryArous` where
  `carryArous` is character state: `carryArous :=
  max(carryArous, carry_frac·arousal_tag)` on each event
  (carry_frac ≈ 0.35) decaying `exp(−Δt/carry_tau)`, carry_tau ≈
  0.014 day (~20 min — Zillmann 1971; Dutton & Aron 1974, mechanism
  DEBATED per Szczucka 2012). Below `carry_min` (0.05): ignored.
  Salient reappraisal cue on the source ("that was terrifying")
  discounts the residue by `attrib_rescue` (0.5) — Schachter &
  Singer 1962 informed arm. Valence rotation toward a co-present
  salient person when the new event's |valence| < 0.3: `valence_tag
  += misattr_rot_k·carryArous·sign(appraisal)` — misattr_rot_k ≈
  0.15, small and gated (P409).
  **v0.5 — arousal-biased competition (ABC), replaces one-sided peripheralLoss:**
  sort the event's verbatim/cueVector fields by priority (attention ×
  selfRelevance per field; top ~40% = central). Then
  `central_f *= (1 + abc_gain·arousal)` (abc_gain≈0.25 — central content is
  encoded *better* than neutral, Kensinger et al. 2006) and
  `peripheral_f *= (1 − arousal_narrowing·arousal)` (weapon-focus loss as
  before, Mather & Sutherland 2011; emotional-memory.md §2.1).
- **Affect tag by peak-end (v1.7):** the stored `emotional` tag is set
  from the episode's affect trajectory, not its mean. When the event
  carries `affectSeries` (optional; game-systems supplies within-event
  samples when it has them), `arousal_tag = peak_w·max(arousal) +
  end_w·arousal(end)` (peak_w≈0.55, end_w≈0.45); `valence_tag` takes
  valence at the peak-arousal tick and at the end, same weights.
  Duration enters nowhere — the tag is duration-neglecting (Kahneman,
  Fredrickson, Schreiber & Redelmeier 1993; Redelmeier & Kahneman 1996;
  Do et al. 2008; emotional-memory.md §13). Scalar-only events
  degenerate cleanly (peak=end=value).
- **Item-context tradeoff (v1.7):** for episodic records with
  `arousal ≥ 0.5`, graded connective-tissue cost
  `link_p_eff = link_p·(1 − emo_assoc_loss·arousal)` and birth strength
  of `verbatim.when` + source tag ×(1 − emo_assoc_loss·arousal),
  `emo_assoc_loss ≈ 0.25` — arousal buys the item and sells the frame
  (Kensinger & Schacter 2005; Bisby & Burgess 2014; Madan et al. 2017;
  emotional-memory.md §15). The §7 trauma clause halves `when`/
  ordering ON TOP of this — trauma is the endpoint of a graded curve,
  not a separate phenomenon.
- **Regulation style (v1.7):** trait `regulate_style ∈ [0,1]` (0 =
  suppressor, 1 = reappraiser; bible-set). On `arousal ≥ reg_thresh`
  (0.6) events: suppressors pay `enc_base *= (1 −
  reg_suppress_cost·(1−regulate_style))`, reg_suppress_cost≈0.2
  (suppression taxes the recorder — Richards & Gross 1999/2000);
  reappraisers get `arousal_tag *= (1 − reg_reappraise_k·
  (regulate_style−0.5)·2)`, reg_reappraise_k≈0.25, applied before the
  peak-end tag is stored (Dillon et al. 2007; emotional-memory.md §17).
- **Emotional blink (v0.5):** if `arousal ≥ emo_blink_thresh` (0.7), each
  cue-*unrelated* record created within ±`emo_blink_window` (0.03 day)
  takes `encodingE *= (1 − emo_blink_loss)` (≈0.3) — retro- and
  antero-grade amnesia for neighbors (Strange et al. 2003; Hurlemann et
  al. 2005). Neighbors sharing ≥1 cue field (predictive items) are EXEMPT
  (Knight & Mather 2009 reconciliation; emotional-memory.md §2.2).
- **Trauma tag (v0.5):** if `arousal ≥ trauma_thresh` (0.9), set
  `trauma: true` — the record-level phenotype in §4.9/§5.5–5.8/
  emotional-memory.md §7.
- **Conditioned-affect acquisition (v0.5):** if `arousal ≥ cond_thresh`
  (0.6), each encoded cueVector key gets/updates a CondEntry:
  `strength = min(1, strength + cond_gain·arousal)` (cond_gain≈0.5 —
  single-trial acquisition, §4.9).
- **Secure-base attenuation (v4.0, emotional-memory.md §44):** on
  threat-band events (`arousal ≥ cond_thresh`) with a co-present
  person at `PersonModel.trust ≥ secure_trust` (0.7):
  `arousal_tag *= (1 − secure_damp·tier_mult·relQuality)` —
  secure_damp ≈ 0.25, tier_mult {partner 1.0, close friend 0.6,
  acquaintance/stranger 0.2}, relQuality = relationship warmth
  (Coan, Schaefer & Davidson 2006: spousal hand-holding pervasively
  attenuated threat response, stranger's hand limited, marital
  quality moderated). **Tag only** — E, verbatim fields and ABC are
  untouched; the event happened at full intensity and is encoded
  less scorching. The trusted person is a safety signal — no fear
  CondEntry mints on them (P414).
- **Sex gain (v4.0, emotional-memory.md §48):**
  `w_emo_arous` and `emo_consol_gain` get `×(1 + emo_sex_gain)`,
  emo_sex_gain ≈ 0.07 for female characters — Canli et al. 2002
  (women better on most-arousing items at equal rated arousal);
  Andreano & Cahill 2009 — reliable but modest; deliberately below
  trait jitter. Direction CONSENSUS, magnitude DEBATED → small clamp.
- **Granularity (v4.0, emotional-memory.md §49):** trait
  `emo_gran ∈ [0,1]` (loads open/verbal, anti-neurot). Below
  `gran_thresh` (0.4) records mint `emotion:"mixed"` (valence-only);
  reappraisal efficacy scales `reg_reappraise_k·(0.5 + 0.5·emo_gran)`;
  low-gran records take `+(1−emo_gran)·0.5` on §28 outcome-rewrite
  and §6.11 audience-tune k's (Kashdan et al. 2015 regulation chain;
  the rewrite susceptibility is our HYPOTHESIS extension).
- **Duration dilation (v4.0, emotional-memory.md §45):**
  `verbatim.duration` mints at `true_duration·(1 + dur_dil·arousal_tag)`,
  dur_dil ≈ 0.4 — arousal speeds the internal clock, remembered
  duration inflates valence-blind (Droit-Volet & Meck 2007;
  Droit-Volet & Gil 2009). Distinct from duration NEGLECT (§13):
  the tag ignores duration, the field inflates it.
- `selfRelevance` 0..1 — event touches the character's goals/identity/people.
  Strongest single booster (self-reference effect).
- **Stress penalty (new in v0.1; v3.8 child inversion):** if `arousal >
  stress_thresh` (0.8),
  verbatim-field strength at birth is multiplied by
  `(1 − stress_encode_loss)`, default loss 0.31 (Deffenbacher et al. 2004
  meta-analysis, d≈−0.31). **v3.8 child inversion (AD§43):** below
  `stress_flip_age` (8) the sign flips — `E += child_stress_gain` (0.1)
  at high distress and adopted-suggestion on the core ×=
  `child_stress_inoc` (0.8); peripherals still narrow via
  `arousal_narrowing` (Goodman, Hirschman, Hepps & Rudy 1991 — free
  recall age-invariant, extreme distress HELPS). `child_trauma_off`
  still governs the trauma tag — regulation threshold and encoding
  gain are different downstreams of the same arousal.
- **Face ceiling (new in v0.1):** verbatim strength for a single-encounter
  stranger's face/appearance is capped at `face_ceiling` (0.67) regardless
  of E (Deffenbacher et al. 2008 — eyewitness identification upper bound).
- `novelty` — distance of event from the character's event schema for its type
  (0 = routine, 1 = unprecedented). Routine repeats get novelty→0 and merge
  instead (§5.3 genericization).
- `predictionError` — |expected − actual| outcome surprise.
- `spacingBonus` — if this event re-activates an existing memory beyond
  `spacing_min_gap` days, boost THAT record (§6.4), don't duplicate.
- **Childhood-amnesia ramp (v0.3):** `E *= amnesia_ramp(encodeAge)` where
  `amnesia_ramp(a) = clamp(a/7, 0.05, 1)` — immature encoding machinery
  produces weak traces before ~7 (Rubin 2000; Bauer & Larkina 2014). Such
  records also keep a permanent `amnesia_decay_mult` on their β (§4.1):
  early memories exist in childhood but are erased *by* childhood.
- **Associative binding (v0.3):** each `links` edge and each cross-field
  cueVector binding (event↔place, event↔person pairings) is formed with
  probability `link_p · assoc_mult(age_now)` — associative-deficit
  hypothesis (Naveh-Benjamin 2000): older characters encode items fine
  but bind them weakly, mechanically producing source/context loss and
  cross-episode grafting downstream.
- **Strategy gating (v1.5):** `elab_gain` and `gen_gain` are multiplied
  by `strategy_ramp(age_now) = clamp((age_now−4)/8, 0, 1)` — production
  deficiency: children own the strategies but don't deploy them
  spontaneously before ~`strategy_exit` (12; Flavell 1970; Schneider &
  Pressley 1997). Events carrying `scaffolded: true` (an adult walked
  the child through the telling/doing) bypass the ramp and instead add
  `scaffold_gain` (0.15) — outsourced elaboration is how children
  actually encode well (Fivush & Nelson 2004). `gist` field birth
  strength is ×`child_gist_mult` (0.7) for `encodeAge < 8` — children
  keep detail shards, under-extract the narrative spine (fuzzy-trace;
  Brainerd & Reyna). See age-development.md §13.
- **Child trauma offset (v1.5, HYPOTHESIS — small):**
  `trauma_thresh_eff = trauma_thresh − child_trauma_off·max(0, 1 −
  encodeAge/12)` (`child_trauma_off` 0.1) — undeveloped regulation
  reads the same arousal as overwhelming; flagged hypothesis.
- **Cultural bump (v1.5):** `bump_gain(encodeAge)` (§4.1 era term)
  applies to semantic records tagged `cultural: true` at reduced gain
  `bump_semantic_gain` (0.5) — favorite songs/foods/rituals are
  disproportionately minted in the bump window (Krumhansl & Zupnick
  2013); `cascade: true` cultural records encoded at `encodeAge ∈
  [4,10]` get `bump_cascade_gain` (0.4) — the parents'-era secondary
  peak (Svob & Brown 2012; age-development.md §17).
- **Value-directed selectivity (v1.6):**
  `importance = max(selfRelevance, goalRelevance)` (goalRelevance is
  predictionError routed through a live goal/open loop; default =
  selfRelevance). `E *= (1 + value_select(age_eff)·(2·importance − 1))`
  — older adults preserve high-value encoding and abandon low-value
  (Castel, Benjamin, Craik & Watkins 2002; Castel 2023). Fails to rescue
  intrinsically-hard content — it reweights E, it can't create it
  (Hoover et al. 2025; age-decline.md §17).
- **Positivity at encoding (v1.6):** `pos_eff = positivity_gain(age_now)
  ·(1 − daLoad)·(1 − acuteStress)` (acuteStress = 1 if arousal ≥
  stress_thresh, else 0). For valence>0 events `E *= (1 + pos_eff·
  valence)`; for valence<0 `E *= (1 − 0.5·pos_eff·|valence|)`. Resource-
  dependent by construction — load/threat collapses it (Mather & Knight
  2005; Reed, Chan & Mikels 2014 meta). NOT reserve-shifted — motivational,
  not fluid (age-decline.md §18).
- **Schema scaffold (v1.6):** if the event's cue tags overlap a semantic
  record with strength ≥ `know_protect_thresh`, `E += schema_support
  (age_eff)·overlap` (bounded +0.15) — prior knowledge carries encoding
  for the old (Castel 2005; Umanath & Marsh 2014; age-decline.md §23).
- **Hyper-binding (v1.6):** with probability `hyperbind_p(age_eff)·
  (1 − awareness)` — awareness = `boundary:true` or selfRelevance ≥0.8 —
  write ONE verbatim field from a co-present but unrelated context
  feature and flag it `hyperbound` (hidden). Older adults bind the
  WRONG things, not fewer (Campbell, Hasher & Thomas 2010; implicit-
  only per Campbell et al. 2024; age-decline.md §19). Small compensating
  `link_p` refund (+0.05·hyperbind_p) on co-occurring pairs.
- **Sleep modifier:** at end of each world day, consolidation pass multiplies
  all same-day `encodingE` by `sleepFactor` (param; poor sleep ≈ 0.7–0.85,
  good ≈ 1.0–1.1). (R§2, R§8.) **v0.4:** `sleepFactor_eff = sleepFactor ·
  sws_mult(age_eff)` applied to **episodic** records only — slow-wave-sleep
  decline selectively impairs episodic consolidation in old age (Mander et
  al. 2013; age-decline.md §7). Semantic records keep unscaled `sleepFactor`.
- **Selective emotional consolidation (v0.5):** at the FIRST sleep tick,
  episodic records get `strength += emo_consol_gain·arousal·(1−strength)`
  (emo_consol_gain≈0.25). The emotional-memory advantage grows over delay
  via consolidation rather than being fully priced at birth (Sharot &
  Phelps 2004; Ritchey et al. 2008; Nishida et al. 2009;
  emotional-memory.md §1).
- **Retrograde stress enhancement (v0.5):** at the same tick, records
  created within `post_stress_window` (0.05 day) before a same-day
  `arousal ≥ emo_blink_thresh` event AND sharing ≥1 cue field with it get
  `strength += post_stress_gain·(1−strength)` (≈0.15) — post-learning
  arousal strengthens prior congruent traces (Cahill et al. 2003;
  emotional-memory.md §2.3).
- **Tag capture (v1.7 — extends §2.3):** cue-UNRELATED weak records
  (encodingE < 0.5) inside `post_stress_window` of a
  `arousal ≥ emo_blink_thresh` event get HALF the retrograde gain
  (`post_stress_gain·0.5`) — behavioural-tagging rescue: a strong
  emotional event stabilizes temporally adjacent weak traces even
  without semantic overlap (Dunsmoor, Murty, Davachi & Phelps 2015;
  Redondo & Morris 2011). The blink (§2) still hits them at encoding;
  tag-capture partially repays survivors at consolidation — net: the
  day of the fight is dim except what touched it.
- **Sleep strips heat (v1.7 — DEBATED, toggleable):** at each sleep
  tick, `emotional.arousal *= (1 − sleep_affect_strip)` (≈0.04),
  floor 0.15, episodic only, `trauma:true` EXEMPT — Walker & van der
  Helm 2009 depotentiation hypothesis; replication is shaky
  (emotional-memory.md §14), so this is small and one of three
  redundant cooling paths (§4.5 arousal_affect_decay, §6.11
  verbal_dampen). Valence untouched.
- **Sleep-deprivation susceptibility flag (v0.6):** if the character's
  `sleepFactor` on the record's `createdDay` was < 0.75, set
  `sleepdep_flag: true` — a PERMANENT marker raising that record's later
  misinformation adoption (§6.3, `sleepdep_misinfo_gain`). Deprivation
  *at encoding* is what matters; poor sleep on later days does nothing
  (Frenda et al. 2014; false-memory.md §3).
- **Synchrony modulation (v0.7):** if `peak_hour` is set,
  `E *= (1 − synchrony_gain·(1 − cos(π·Δh/12))/2)` where
  `Δh = |tod − peak_hour|` in hours — full strength at the character's
  circadian peak, `−synchrony_gain` at the antipeak. `synchrony_gain`
  scales up with `age_eff` (×(1+age_eff/60)): older adults are far more
  synchrony-sensitive — the May, Hasher & Stoltzfus 1993 asymmetry that
  erased the age deficit at optimal times (individual-differences.md
  §2.12, §5). Same factor applies to θ at retrieval (§5.4).
- **Detail-write fraction (v0.7):** each peripheral (non-central)
  verbatim field is written at all only with probability `vivid_detail`
  (default 0.8) — imagery vividness sets how *wide* a record is, not how
  correct it is (Dawes et al. 2022 aphantasia: fewer episodic details,
  individual-differences.md §2.7). Missing fields are confabulation
  surface at reconstruction (§5.5); vividness never changes accuracy.
- **Effortful listening (v2.8):** for verbal-channel events
  (conversations, spoken instructions) in contexts carrying
  `noise_level` > 0.3, `E *= 1 − noise_cost·(1 − hearing)·noise_level`
  (`noise_cost` ≈ 0.4; `hearing` trait ∈[0,1], population mean ~0.95
  at 50 → ~0.7 at 85, trait-jittered). Comprehending degraded speech
  spends the resource that would have encoded it (Rabbitt channel
  capacity; Pichora-Fuller effortfulness; Lin et al. 2011 — we model
  the encoding channel only, not the dementia hazard). Encoding-side
  only: unheard detail is absent, never wrong. HYPOTHESIS wiring:
  `hearing < 0.6` halves social-contact accrual for the §4.17
  `isolation` ledger.
- **Crystallized accretion (v2.8):** semantic-record encoding gets
  `enc_sem_mult(age_now)` — 1.0 ≤40 → 1.05 at 55 → 1.0 at 70, the
  only encoding term that rises with age (Park et al. 2002;
  Verhaeghen 2003 vocabulary growth). Feeds `know_density` (§6.7):
  the old store is the best truth-checker and the deepest archive.
- **Inconsistency and lapses (v1.9):** each dailyMemoryTick draws
  `day_mult = exp(N(0, iiv_sigma))` multiplying that day's encoding E
  (retrieval-side θ noise in §5.4) — intraindividual variability is a
  trait that grows with age_eff and shrinks with wmc (Hultsch et al.
  2000). Separately, routine low-salience events (`attention < 0.3`)
  are dropped before E is computed with probability `omit_p` —
  absent-minded *omission*, not a weak record; nothing exists to decay
  or cue (mind-wandering encoding gaps, Smallwood & Schooler 2006;
  individual-differences.md §10).
- **Intoxication state (v1.9):** `context.intox` ∈ [0,1] (alcohol;
  same slot reusable for cannabis) applies anterograde-only:
  `E *= (1 − intox·(1 − intox_encode_mult))` and peripheral-field
  write probability `vivid_detail·(1 − 0.4·intox)`. Retrieval of
  sober-encoded material is NOT degraded. At `intox ≥ 0.8` the window
  additionally pays `omit_p += 0.5·(intox − 0.8)/0.2` — fragmentary
  blackout islands (White 2003; morning-after gap-filling then runs
  through ordinary confab_fill, §5.5). Mild state-dependency cue
  `intox_state_dep` at §5.4. (individual-differences.md §16.)
- **Caffeine & nicotine (v4.2):** `context.caff` ∈ [0,1] (~dose/
  200mg, cap 1.5): at encoding `E += 0.05·caff·(1−arousal)` —
  alertness-mediated, vanishes on arousing events (Smith 2002); when
  caff>0 during a record's `consol_window`, the next sleep tick
  credits `caff_consol_gain` (0.08) to that record's lure-
  discrimination/pattern-separation rolls ONLY — hit-rate and d′
  unchanged (Borota et al. 2014 null locked). `smoker` trait:
  baseline `pm_self ×(1 − smoker_pm_loss)` objective-only —
  `complaint_k` does NOT move (Heffernan 2010 blind spot); state
  `context.nic_dep` ∈ [0,1] abstinence deepens `pm_self ×(1 −
  nic_dep_pm·dep)` plus a small wmc-task cost; dosing restores
  toward baseline, never above (Jansari — restoration, not
  enhancement). (individual-differences.md §42.)
- **Engagement mode (v1.2):** Event field `engagement` ∈
  {observed, heard, enacted, generated, spoken} (default derived from
  source.kind). Ordering at matched attention: enacted > generated >
  spoken > heard/observed — `E += enact_gain` (0.20, on enacted events;
  applied AFTER the age-scaled enc_base so motor encoding partially
  bypasses the decline curve — preserved in aging and impairment,
  Roberts et al. 2022 meta g=1.23), `E += gen_gain` (0.15, self-composed
  speech/plans/conclusions — generation effect d=0.40, Bertsch et al.
  2007), `E += prod_gain` (0.08, said-aloud — Fawcett 2013/2023;
  recognition-weighted). Enacted records take HALF the `da_encode_mult`
  damage below (motor encoding needs no central resources — Engelkamp).
- **Divided attention at encoding (v1.2):** Event field `daLoad` ∈ [0,1]
  (secondary-task pull). `attention ×= (1 − da_encode_mult·daLoad)` AND
  `elaboration ×= (1 − da_encode_mult·daLoad)` (da_encode_mult ≈ 0.5) —
  the hit is on both channels, a qualitative shallowing not just less
  resource (Craik et al. 1996; Naveh-Benjamin et al. 2000). Retrieval
  side is near-immune: `cueContext.daLoad` raises searchCost only
  (×`da_ret_cost` = 1.5, frozen) — §5.4.
- **Attention lapses (v1.2):** per event, with probability `lapse_p`
  (0.03 + trait/state loadings: +0.02·neurot>0, +0.03·sleepFactor<0.8,
  +0.02·stress>0.6 — individual-differences.md), `attention ×= (1 −
  lapse_drop)` (0.6), drawn BEFORE the att_min gate — lapsed events often
  simply do not exist for the character (mind-wandering; Maillet & Rajah
  2013).
- **Event segmentation (v1.2):** Event flag `boundary:true` (task
  switch, arrival/departure, topic break) → `E += boundary_gain` (0.15)
  — boundary content is privileged (Zacks et al. 2007; Swallow et al.
  2009). Event flag `locShift:true` (venue/room change) → every record
  created within the last `lapse_window` (0.02 day, frozen) AND every
  pending `Intention` (§9) takes a one-time `R ×= (1 − doorway_drop)`
  (0.15) — the doorway/location-updating effect, flat across age
  (Radvansky & Copeland 2006; Radvansky et al. 2011/2015). Cross-boundary
  associative edges form at `link_p·(1 − boundary_order_loss)` (0.4) —
  order survives within events and dies between them (DuBrow & Davachi
  2013).
- **Unitization (v1.2):** Event flag `coherentUnit:true` (person+their
  signature action; object+its place) → `link_p_eff = link_p +
  unitize_gain·(1 − link_p)` (0.3) — unitizing an association into an
  item rescues the age-graded associative deficit exactly where it is
  worst (Giovanello & Schacter 2012; Bastin et al. 2013).
- **Isolation (v1.2):** Event flag `isolated:true` (categorical outlier
  within its local episode) → `E += distinct_gain` (0.15) — von Restorff
  needs statistical oddity in the stream, not world-weirdness (Hunt 1995;
  Schmidt 1991). Routine-heavy lives isolate MORE often — the rare odd
  day survives the mush.
- **Concreteness (v1.2):** events with ≥2 populated sensory cue fields →
  `E += concrete_gain` (0.1) — dual coding; the concrete outlives the
  argued (Paivio).
- **Mood-congruent encoding (v1.2):** when sign(valence) ==
  sign(encodeMood), `E += mood_cong_encode·|encodeMood|·(1 −
  selfRelevance)` (0.1) — mood steers what elaborates, but only on thin
  ambient content; self-relevant material doesn't need the help (Bower
  1981; Ucros 1989 meta).
- **Social encoding layer (v0.8)** — for events with `agent != self`
  (someone else's observed/heard behavior; social-memory.md §2):
  - *Spontaneous trait inference:* with prob `sti_prob` (0.6), update the
    actor's `PersonModel.traits[implied] += sti_gain·diag_weight`
    (sti_gain 0.15) — trait inferences are unintentional and bind to the
    actor (Winter & Uleman 1984; Uleman et al. 2008 meta; Todorov &
    Uleman 2003). `diag_weight` = `diag_moral_neg` (1.6) for negative
    morality-relevant behavior, `diag_ability_pos` (1.3) for positive
    ability-relevant behavior, else 1.0 — perceived diagnosticity, so
    one betrayal outweighs months of reliability (Skowronski & Carlston
    1987/1989). Morality-negative updates also add to
    `PersonModel.cheaterLoad`.
  - *Correction stage (v3.2):* if the event carries `sitConstraint` ∈
    [0,1] (actor under orders/stress/script — event layer supplies),
    the trait delta is discounted `×(1 − sit_credit·sitConstraint·
    correction_avail)` where `correction_avail = min(1, attention/
    correct_gate)` — correction is the effortful, disruptable stage
    (Gilbert, Pelham & Krull 1988; social-memory.md §33). Busy
    witnesses store the raw trait.
  - *Status asymmetry (v3.2):* if the event layer supplies relative
    status, `status_gap = perceivedStatus(agent) − perceivedStatus
    (self)` scales E by `(1 + status_encode_gain·max(0,+gap))` and
    familiarity accrual likewise; STI deltas on lower-status targets
    scale `×(1 − power_encode_loss·max(0,−gap))` — memory for people
    is asymmetric across the hierarchy (Ratcliff et al. 2011; Guinote
    2007; social-memory.md §34). Untagged → gap 0, nothing fires.
  - *Exposure familiarity (v3.2):* sub-threshold co-presence
    sightings (person merely `present`, below attention gate —
    records that never encode as episodes) increment
    `PersonModel.exposureCount` and add `exposure_fam_gain` (0.02) to
    `familiarity` only — familiar-only shells accrue without
    identity work (Jacoby et al. 1989 analog; §36).
  - *Incongruity bonus:* if the behavior's implied trait diverges from
    the existing model (|implied − model.traits[trait]| > 0.4),
    `E += incongruity_gain·|Δ|` (0.25) — expectancy-violating behavior is
    encoded deeper (Hastie & Kumar 1979). Orthogonal to the transmission-
    stage stereotype pull in §6.12 — incongruity wins at encoding,
    consistency wins in the chain (Kashima 2000).
  - *Next-in-line hole:* if the character is preparing their own turn in
    group talk (`context.preparing: true`), incoming utterances get
    `attention ×= (1 − next_in_line)` (0.4) — self-rehearsal blanks the
    previous speaker (Bond 1985).
  - *Own-age bias:* `PersonModel.familiarity` encodes at
    `×(1 − oab_loss)` (0.15) for faces outside the character's own age
    class (±~15y); applies symmetrically at all ages (Rhodes & Anastasi
    2012, g≈0.37 discriminability). Optional `owngroup_loss` for other
    category boundaries if world-builder marks them — do not invent.
  - *Self-threat shallowing:* feedback records about the character
    (source `told_by`, topic = a self trait) with implied valence < −0.3
    and selfRelevance > `mnemic_centrality` (0.6) encode at
    `attention ×= (1 − mnemic_encode)` (0.25) — self-protective
    not-thinking at intake (Sedikides & Green 2006); waived when the
    source is a close other (Green et al. 2009); ×0.3 under the
    depressive modifier (dysphoria removes the protection).
  - `familiarity`/`identityStrength`/`nameStrength` accrue across
    encounters: second+ meetings bypass `face_ceiling` for the
    familiarity tier only — appearance verbatim stays capped.
  - **v2.0 additions** (social-memory.md Part II):
    - *Interpret bias:* ambiguous trait implications (|implied| <
      `ambig_band` ≈0.3) from an actor whose `PersonModel.traits[trait]`
      exceeds ±0.4 are pulled toward the model at encoding:
      `implied += interpret_bias·sign(model)·(1−|implied|)` (≈0.3) —
      reputation assimilates the gray zone while clearly-contrary acts
      (outside the band) still earn incongruity_gain; assimilation at
      perception, not just retrieval (Srull & Wyer 1989; Anderson,
      Siegel, Bliss-Moreau & Barrett 2011 — gossip biases face
      processing itself).
    - *Joint attention:* `context.coAttending` (a known other present
      AND mutually engaged — stricter than `present`) → `E *= (1 +
      joint_attn_gain)` (≈0.12) and stored affect amplified
      valence-symmetrically: `|valence_tag| += joint_affect_amp`
      (≈0.1, sign-preserving — shared fun is funner, shared dread is
      dreadful; Boothby, Clark & Bargh 2014; Shteynberg 2015).
    - *Confidential tag:* event may carry `confidential: true` (or a
      later `tagEvent` sets it — "keep this between us"); writes a
      `secret_str` field (birth = E) decaying at
      `beta_source·secret_tag_mult` (≈1.3) — the DO-NOT-TELL bit rots
      faster than the juicy bit (source-amnesia asymmetry; §6.22).
    - *Attachment exclusion (v2.2):* event may carry `attachment: true`
      (relational content — bids, confessions, comfort, dependency; the
      event layer tags it); for characters with `attach_avoid` trait σ,
      `E *= (1 − attach_encode_loss·max(0, attach_avoid)/1.5)` — a
      PREEMPTIVE deficit: avoidants encode attachment material thin at
      the door, and motivational cues do not rescue it (Edelstein 2006 —
      boundary-locked: non-attachment emotional records untouched;
      Fraley, Garner & Shaver 2000; Mikulincer & Orbach 1995). Retrieval
      pays `attach_ret_cost` on searchCost for the same tag.
- **Negative mood protects surface detail (v1.8):** when
  `context.mood < −0.3`, verbatim-field birth strength gains
  `negmood_verbatim_gain` (0.1) — the context half of the
  Bookbinder & Brainerd 2016 content–context paradox: negative mood
  promotes item-specific/verbatim processing while negative CONTENT
  (§6.3 `neg_gist_gain`) foments gist-side distortion. The two
  halves live on different channels; do not merge them.
- **v2.4 additions** (encoding-mechanics.md Part II §§15–24):
  - *Attentional boost:* event flag `detected:true` (task-relevant
    detection while a monitoring set is live — incl. §5.14 focal-cue
    firings) → `E += abe_gain` (0.15) on the detected event AND
    `E += abe_gain·abe_spill_mult` (0.5) on every other record created
    the same tick (`abe_window = 1 tick`, frozen). Records already under
    `att_min` stay unwritten — boost × 0 attention is 0 (Swallow & Jiang
    2010/2014).
  - *Curiosity:* derived Event field `curiosity ∈ [0,1]`
    (`clamp(predictionError·interest, 0, 1)`; `open` raises it) →
    `E += curios_gain·curiosity` (0.2); unrelated surviving records
    within `curios_window` (1 tick, frozen — elicitation-locked, Murphy
    et al. 2021) get `E += curios_spill·curiosity` (0.1).
  - *Wakeful rest:* a record is `rested` if ≤1 new same-modality event
    lands for the character within `rest_window` (0.007 day, frozen)
    after birth; at window close `strength += rest_gain·(1 − strength)`
    (0.12) — replay shield, age-flat, not gated on sleep/arousal
    (Dewar et al. 2012). **v3.6:** `rested` records additionally get
    `storageS += rest_s_gain·(1 − storageS)` (0.1) at window close —
    Dewar's no-retrieval 7-day benefit is an S-side consolidation
    effect, not an accessibility one — and are exempt from `n_sim`
    accrual for their first day (rest protects from interfering
    incoming information; forgetting-curves.md §17.4).
  - *Implementation intentions:* Intention records with `ifCue` AND
    `thenAct` populated get `cueBinding += impl_intent_gain` (0.25) on
    the §5.14 focal-cue leg — the gain is on the binding, not the plan
    record (automatization account; Gollwitzer & Sheeran 2006 d=.65).
    `consc` trait raises formation frequency (world-layer), not size.
  - *Teach expectancy:* `willTeach:true` (+ optional `interactive`) →
    `E += teach_expect_gain·(0.5 + 0.5·interactive)` (0.2) — organizing
    to explain; the post-teach half arrives via §4.11 S-growth, no
    double count (Kobayashi 2019 g=.35/.56).
  - *Proper names:* `verbatim.name` on persons with PersonModel
    familiarity < `know_protect_thresh` born at `×(1 − name_penalty)`
    (0.3), age-scaled `×(1 + age_eff/80)`; exempt when the name is
    `coherentUnit`/`isolated`/self-generated (Cohen 1990; Cohen &
    Faulkner 1986).
  - *Other-group faces:* `owngroup_loss` (0.15) now a real param —
    familiarity accrual cut when world supplies a differing group tag,
    attenuated `×(1 − 0.5·contact_share)` by roster contact (Meissner &
    Brigham 2001 mirror pattern; flat ≥10, HYPOTHESIS below).
  - *Expertise:* `domain` field matching DomainTable strength ≥0.6 →
    `E += expert_encode_gain·domainStrength` (0.15) and peripheral write
    prob `vivid_detail × expert_detail_w` (1.2, clamp 1.0) — wider AND
    deeper in-domain, zero transfer (Chase & Simon 1973).
  - *Directed forgetting:* `tagEvent{forget:true}` → one-time
    `strength ×= (1 − df_loss·(1−arousal)·(1 − 0.5·[neurot>0]))` and
    permanently halves s_gain rehearsal receipts (rehearsal-cessation
    account; MacLeod 1998). Never deletes; cue access unchanged
    (emotional ~4% resist — Hall 2021; older adults shallower —
    Rupprecht & Bäuml 2016: scale df_loss ×(1 − 0.3·age_eff/80)).
  - *Crafted mode:* `engagement:"crafted"` (drawing/handwriting/
    building) collects `enact_gain + gen_gain + concrete_gain` — no new
    param; preserved-or-larger in 65+ (Wammes 2016; Meade 2019; P230
    audits the fold).
  - *State folds (frozen):* `context.pain`/`hunger`/`fatigue` map to
    `daLoad` at weights 0.4/0.2/0.3 — no dedicated channels.
- **v2.7 additions (age-development.md Part III §§23–32):**
  - *Firsts:* Event flag `first:true` → `E += first_gain` (0.2) and
    `link_p ×1.5` toward same-stream records — firsts are indexing
    nodes of personal histories (Robinson 1992).
  - *Transitions:* records encoded inside a character-level
    `transition` window (`transitionStart`/`transitionEnd`, runtime-
    declared — generalizes v2.2's bible-fixed `bump_windows`) get
    `transition_gain` (0.4) on the same valence gate as `bump_gain`
    (Brown & Lee 2010 transition theory; Thomsen & Berntsen 2008).
  - *Social evaluation:* `evaluated:true` or a peer `audience` in
    context → `E += social_eval_gain·(age knot)` — teen-knotted
    (~1.3 at 14 → 1.0 at 25 → ~0.9 after; Somerville 2013).
  - *Adolescent sleep:* `peak_hour` gains a +1.5h knot for 13–19
    (Carskadon 2011) and `adolesc_sleep_loss` (1.2) multiplies the
    sleepdep encoding penalty in that band — the deficit persists
    past recovery nights (Lo et al. 2017).
  - *OGM gate:* the depressive/rumin_k gist-loss terms (v0.5/v1.7)
    apply only for age_now ≥ 12 — children's negative records
    fragment, they don't overgeneralize (Sumner 2011).
- **v3.1 additions** (individual-differences.md Part III §§20–30):
  - *ADHD signature (encode-side only):* `adhd` trait σ adds
    `omit_p += 0.04·adhd`; verbal-field write prob
    `vivid_detail ×(1 − 0.12·adhd)`; records born within
    `consol_window_days` carry `interf_k += 0.03·adhd` (fragile
    new traces — RI↑, Söderlund 2022); on `interest ≥ 0.8` records
    the penalties INVERT via `E += hyperfocus_gate·adhd·0.1`
    (HYPOTHESIS — set 0 to disable). No beta_*/theta loads ever
    (Skodzik 2017: acquisition deficit, intact storage).
  - *ASD signature:* `k_verbatim −= 0.08·asd` (verbatim survives
    longer — Maras & Bowler); `phantom_p ×(1 − 0.15·asd)` and
    `lure_accept −= 0.02·asd` (reduced gist-side false content);
    `specificity ×(1 − 0.1·asd)` on self/people-cued recall only —
    sensory-cued recall unaffected (Crane & Goddard OGM + ASD
    sensory-route strength).
  - *Social-threat gate:* records the event layer tags
    `socialThreat:true` take `w_emo_neg ×(1 + vigil_social_gain·
    vigil)` (0.15) at encode; nothing else changes (SIP social-
    context gating — Cacioppo & Hawkley 2009).
  - *Affect-intensity gate:* records with |valence| ≥ 0.3 take
    `w_emo_pos`/`w_emo_neg` BOTH `×(1 + aim_emo_gain·aim)` (0.10)
    and `link_p ×(1 + aim_link_gain·aim)` (0.05); stored arousal
    tag `+= 0.05·aim`. Neutral records: ZERO effect — the gate is
    the finding (Larsen, Diener & Cropanzano 1987).
  - *Hormone overlays (state, not trait):* `context.meno` ∈ [0,1]
    → `s_gain_recall`/`s_gain_rehear ×(1 − meno_learn_pen·meno)`
    (0.15 — practice-gain flattening, SWAN) and `enc_base ×(1 −
    0.08·meno)` on verbal material; overlay EXPIRES — the rebound
    is the phenomenon (Greendale 2009). `context.preg` =1 gated to
    trimester 3 → `E ×preg_trim3_mult` (0.9) + `iiv_sigma += 0.02`
    (Davies 2018). No menstrual-cycle state — documented refusal.
  - *Cannabis:* `context.intox.kind == "cannabis"` → anterograde
    `E *= (1 − intox·0.4·(1 − intox_encode_mult))` (shallower than
    alcohol); during the window `misinfo_suscept +=
    cann_misinfo_gain·intox` (0.20) and `lure_accept +=
    cann_lure_gain·intox` (0.15) — acute-phase only, sober
    retrieval inherits thin encoding but NO susceptibility
    (Kloft et al. 2020: 1-week null).
  - *Handedness:* `hand_mix` σ → `theta −= handmix_ret_gain·
    hand_mix` (0.015) episodic recall only and `beta_source −=
    0.05·hand_mix`; all encoding/face/wmc params flat
    (Lyle, McCabe & Roediger 2008 task pattern).

- **Perceptual load (v3.5):** Event field `perceptLoad` ∈ [0,1]
  (scene perceptual crowding on the focal task; default 0.4). For
  non-focal records formed in the same tick:
  `att_min_eff = att_min·(1 + load_att_raise·perceptLoad)` (1.0) and
  `E ×= (1 − load_periph_supp·perceptLoad)` (0.5) — early selection:
  high-load scenes starve ambient material (Cartwright-Finch & Lavie
  2006; Murphy & Greene 2016 — central detail spared, peripheral
  lost). At `perceptLoad < 0.3` ambient attention ×(1 + `load_spill`)
  (0.2) — spare capacity spills involuntarily (Lavie). All records:
  `lapse_p ×= (1 − load_lapse_relief·perceptLoad)` (0.5) — absorbed
  scenes leave nothing to wander with (Forster & Lavie 2009). Records
  born at perceptLoad ≥ `load_flag_thresh` (0.6) set `load_flag` —
  permanent +0.1 misinformation adoption on §6.3 (Murphy & Greene's
  suggestion result; mirrors sleepdep_flag).
- **Capacity bound (v3.5):** `wm_cap` (4, ±1 by wmc, ×(1−0.15·
  age_eff/80)). If an event's writable elements (verbatim fields +
  cueVector keys + participant links) exceed wm_cap, rank by
  attention×selfRelevance; top wm_cap write normally, remainder write
  with prob `vivid_detail·cap_spill` (0.5) at ×0.6 strength.
  `coherentUnit` merges bound fields into one element; DomainTable
  strength ≥0.6 merges up to `floor(domainStrength·3)` in-domain
  elements — chunking, not cheating (Cowan 2001; Chase & Simon).
- **Attention residue (v3.5):** on `boundary:true` events tagged
  `interrupted`/`closedClean`, subsequent-tick records take effective
  `daLoad += residue_load·residue_decay^t` for `residue_ticks` (3)
  — `residue_load` 0.3 ×1.3 if interrupted, ×0.5 if closedClean
  (Leroy 2009: the prior event model occupies working memory past
  the boundary).
- **Next-in-line (v3.5):** Event flag `floor_next:true` (character
  composing an imminent turn). Other-agent content takes
  `attention ×= (1 − next_inline_cost)` AND `elaboration ×= (1 −
  next_inline_cost)` (0.35) — encoding locus (Bond 1985); flag may
  reach `nil_reach` (3) utterances back (Brenner 1973 scallop).
  The character's own turn record is exempt.
- **Pending-intention ecology (v3.5):** while n Intentions pending,
  `daLoad += pending_intrude·min(n,5)` (0.04, cap `pending_intrude_cap`
  0.2); records cue-overlapping a pending intention's ifCue/thenAct
  get `E += pending_cue_gain` (0.15); on fire/cancel the intention
  record stops s_gain receipts and β ×= `intent_done_decay` (1.3) —
  completed < neutral (Marsh, Hicks & Bink 1998).
- **Cognitive offloading (v3.5):** Event flag `offload:true` →
  `E ×= (1 − offload_cost)` (0.2), verbatim ×(1−0.5·offload_cost);
  `offloadAttend:true` nulls the cost (Henkel zoom). Record gains
  `extref` field at birth strength `offload_where_gain` (0.3) — hollow
  records: weak content, strong pointer (Sparrow, Liu & Wegner 2011).
  Intentions with `extCue:true` pay `pending_intrude ×= 0.3` but
  internal cue-binding ×`extcue_bind_mult` (0.5) — external reminders
  discharge the loop AND the vigilance (Risko & Gilbert 2016).
  **v3.9 (AD§53):** the offload *decision* ages: `offload:true`
  chosen with rate ×`offload_pref(age_eff)` (1.0 ≤50 → 1.3 at 70 →
  1.5 at 85 — elders use more reminders) but the expected-benefit
  term in the choice ×`offload_bias(age_eff)` (1.0 → 0.6 at 85 —
  elders under-price the aid vs their own optimum, Tsai, Scarampi,
  Kliegel & Gilbert 2023); `offload_select(age_eff)` (0.3 → 0.65)
  = probability the offloaded item is the high-importance one
  (subjective-value arm, Exp 2). P408.
- **Threat capture (v3.5):** Event flag `threatCue:true` →
  `E += threat_capture` (0.2) on the threat record; co-occurring
  non-threat records ×=(1 − `threat_drain`·(0.3 + 0.7·traitAnx))
  (0.3) — anxiety-moderated per Bar-Haim 2007 (d=.45, ~absent in
  nonanxious); composes with ABC (item-level) — this is scene-level.
- **Pre-sleep adjacency (v3.5):** episodic records created within
  `pre_sleep_window` (0.125 day, ~3h) before the sleep tick get
  `strength += pre_sleep_gain·(1−strength)` (0.1) at that tick —
  interference-avoidance by adjacency (Jenkins & Dallenbach 1924;
  Gais, Lucas & Born 2006). Orthogonal to sleepFactor and emo_consol.
- **Varied-context re-encoding (v3.5):** when `spacingBonus` fires,
  if cueContext tags differ from the record's stored context keys,
  append up to `ctx_var_add` (2) cue fields — new retrieval routes
  accrue on re-activation (Smith & Rothkopf 1984; Smith & Vela 2001).
- **Change-blindness stale fields (v4.6):** change events
  (`fieldChanged:{field,new_v}`) update an existing record's field
  only if attention to the object ≥ `field_upd_min` (0.35,
  ×(1+0.2·age_eff/70) age knot — Veiel et al. 2006); below the gate
  the field keeps the old value flagged `stale:true` (E-tier — the
  character believes the stale value at full conf). `animate:true`
  objects relax the gate ×(1−`animacy_upd_gain`) (0.1 — New et al.
  2007 animate monitoring).
- **Own-name breakthrough (v4.6):** sub-att_min events tagged
  `mentionsSelf:true` mint thin records (E×0.5) with prob
  `ownname_break_p − ownname_wmc_slope·wmc_z` (0.35, slope −0.10 —
  LOW wmc breaks through more, Conway et al. 2001, sign locked; no
  g_mem path). On breakthrough set `monitor_tail` = `ownname_tail`
  (2) ticks of elevated monitoring on that channel (Wood & Cowan
  1995 two-item shift). AGE-FLAT (elder direction inconsistent).
- **Humor (v4.6):** `humor` ∈ [0,1] on attended events only →
  `E += humor_gain·humor·(1 − 0.5·humor_rate)` (0.12; `humor_rate`
  = running share of humor≥0.5 events, init 0.1 — the witty
  household amortizes); incidental/sub-threshold humor gets nothing
  (Schmidt 1994). `humor_retr_gain` (0.05) rides famScore on
  humorous records — privileged retrieval (Schmidt & Williams 2001).
- **Animacy (v4.6):** `animate:true` (agent/animal content) →
  `E += animacy_gain` (0.10) and the event's non-agent fields write
  at ×(1+0.5·animacy_gain) — context piggyback (Nairne et al. 2013;
  VanArsdall et al. 2013). Valence-flat, orthogonal to threatCue.
- **Expectancy-incongruence (v4.6):** `aboutPerson:<id>` events
  mismatching PersonModel(id).eval: `inc = |contentEval − eval|`.
  Exposure < `impress_strong_thresh` (0.6, frozen) → `elaboration
  += incongr_elab·inc` (0.15 — Hastie & Kumar 1979); exposure ≥
  thresh → `E += congr_gain·(1−inc)` (0.05) and incongruent content
  takes write-prob ×(1 − 0.3·(exposure−thresh)) — the settled
  opinion doesn't file the counterexample (Stangor & McMillan 1992).
  Knots: incongr_elab ×(1−0.15·age_eff/80), congr_gain
  ×(1+0.2·age_eff/70) — schema reliance rises (HYPOTHESIS).
- **Impression primacy (v4.6):** PersonModel.eval update weights the
  i-th observed behavior `w_i = 1 − impress_primacy·(1 − exp(−i/2))`
  (0.2 — Asch 1946); under `context.depleted` the most recent
  behavior instead weighs ×(1+`impress_recency_p`) (0.15 — Luchins
  1957 recency arm). Eval formation only; behavior records intact.
- **Motivational narrowing (v4.6):** `approachMotiv` ∈ [0,1] ≥ 0.6
  on positive-valence events → non-goal fields ×=(1 −
  `motiv_narrow`·approachMotiv) (0.15), goal-central fields +=
  0.5·motiv_narrow·approachMotiv — pre-goal positive states tunnel
  like threat (Gable & Harmon-Jones 2008/2010).
- **Lie encoding (v4.6):** `deceptive:true` emissions → `E +=
  lie_enc_gain` (0.10 — suppression+construction effort, Walczyk
  2003) and record flagged `lie:true` with sourceStr ×=(1 −
  `lie_src_weak`) (0.20 — provenance contested at birth);
  `lie_rehearsed:true` adds gen_gain. At recall, lie records compete
  with truth records on simOp; §6.68 fab_dir owns which drifts.
  Null: lie_src_weak touches sourceStr only, never content accuracy.
- **Generative notes (v4.6):** `note:"verbatim"` → no E gain, mints
  `extref` (§35); `note:"generative"` → `elaboration +=
  note_gen_gain` (0.10). Locked null `note_mode_null` = 0 — device
  modality adds nothing (Urry et al. 2021; Morehead et al. 2019).

Create the record with `strength = E`, `confidence = base_conf(E)`, `accuracy = 1`.

---

## 3. Confidence vs accuracy

Two separate fields, always (R§6). `confidence` starts
`base_conf(E) + conf_bias + conf_emo_gain·arousal²` (v0.7: conf_bias
is a per-character trait offset, default 0 — high-vividness characters
start ~+0.05 more certain, memory-distrusting ~−0.08; it moves
confidence only, never accuracy — individual-differences.md §3).
(v0.5: conf_emo_gain≈0.15,
quadratic — only strong arousal inflates felt certainty; the amygdala-
fluency "feeling of remembering," Sharot et al. 2004) and is raised by
retellings (+0.05 each, cap 0.98); `accuracy` only moves via distortion
operators (§6). A character can sit at `confidence 0.95, accuracy 0.4` —
flashbulb pattern. **v0.5 floor:** records with `arousal ≥
flashbulb_thresh` (0.85) never let `confidence` fall below
`flashbulb_conf_floor` (0.9) — flashbulb detail decays at ordinary rates
while certainty stays pinned (Talarico & Rubin 2003; emotional-memory.md
§5).

**v0.9 deepening — fluency and hard-easy calibration** (formal-model.md
§13): reported confidence, not stored confidence, gets two adjustments
at output time —

```
conf_out = conf_bias + meta_cal·(conf − 0.5)
           + oc_gain·max(0, conf − accuracy)·(1 − m.strength)
           + conf_inflate_old(age_eff)·wrong_flag
           − (C.verify ? check_conf_loss·log1p(m.retrievalCount) : 0)
// v1.9: conf_bias/meta_cal are the trait-confidence intercept/slope
// (Kleitman & Stankov 2007 — stable, domain-general, orthogonal to
// accuracy); the verify term is the checking paradox — repeated
// verification DECREASES reported confidence and detail-vividness,
// never increases it (van den Hout & Kindt 2003; meta k=28, N=1662).
// All report-side only — none of these terms touch stored conf.
```

where `wrong_flag` = 1 if the reconstruction carries phantom content,
a merged/generic substitution, a `hyperbound` field, or a lure-accepted
recognition (§6.8/§4.3/§2 hyper-binding/§5.6) — the misrecollection
inversion: older adults' errors concentrate at HIGH confidence while
young adults' errors cluster at low confidence (Dodson & Krueger 2006;
Dodson, Bawa & Krueger 2007; Shing et al. 2008 — children don't show it).
Report-side only; `conf_inflate_old` knots 0 ≤50 → 0.15 at 85
(age-decline.md §22).

overconfidence widens exactly where the trace is weakest (hard-easy
effect, Lichtenstein & Fischhoff 1977; kept modest per Gigerenzer et al.
1991's qualification); never feeds back into `accuracy` or `confidence`.
Category/frequency judgments ride `searchCost` (§5.4): the ease of the
search, not the count returned, is the data (Schwarz et al. 1991;
Koriat 1993 cue-utilization).

---

## 4. Decay and interference — the forgetting engine

### 4.1 Trace decay (per tick, e.g. hourly or daily)

**v0.9 note:** `strength` here is retrieval strength R — the accessible-
now quantity. Storage strength S (§4.11) decays on its own far slower
schedule; everything in §4.1–4.3 acts on R only.

Power-law with asymptote (R§3):

```
R(t) = E_adj · (1 + t_eff/τ)^(-β) + floor
t_eff = Δt_days + ev_time_w · (n_events_since / ev_day_norm)   // v2.5
```

- `t` = days since lastAccessDay (retrieval refreshes the clock).
- **Event time (v2.5):** the decay argument is `t_eff`, not raw days —
  `n_events_since` = this character's record-encodes since lastAccessDay
  (reuse the §4.2 cue-bucket counts, no new stores), `ev_day_norm` =
  typical daily load (30 mains / ~10 ambients), `ev_time_w` ≈ 0.5.
  Subjective memory age advances with *lived events*, not just calendar —
  a hectic fortnight blurs, an idle one stays crisp (Wixted 2004;
  Howard & Kahana 2002; forgetting-curves.md §12.4).
- **Slope-invariance axiom (v2.5):** β may never depend on E, arousal,
  or rehearsal count — durability enters through the intercept (E_adj),
  the clock (retell resets t), the floor, and §4.11's S layer, never
  through β (Slamecka & McElree 1983; forgetting-curves.md §12.2).
  Sanctioned β modulators: age (§4.8), era terms (below), content class
  (k_verbatim etc.), profile tails (hsam/sdam). P231 enforces.
- **Reuse-calibration axiom (v2.5):** retention should be economical —
  per content class, R at the class's median reuse gap should land in
  [0.4, 0.7] against world access logs (Anderson & Schooler 1991 —
  forgetting tracks environmental need statistics). Health metric, not
  hard gate; probe P239; forgetting-curves.md §12.1.
- `τ` (scale) and `β` (rate) are params per memory **type** and per character:
  episodic τ≈1.2, β≈0.5; semantic τ≈30, β≈0.2; verbatim fields decay at
  `β·k_verbatim` (k≈2.5) relative to gist.
- `floor` ≈ 0.05·emotional.arousal — strong emotional memories asymptote above
  zero (they never fully die, they go quiet). NOTE (Talarico & Rubin 2003):
  high arousal does NOT change β — flashbulb details decay on the same curve
  as ordinary ones; arousal only raises floor and confidence.
- **Emotional narrowing over time (v0.5):** records with `arousal ≥ 0.6`
  get gist β ×`emo_gist_beta` (0.85 — emotional gist is preserved) while
  verbatim fields decay at an EXTRA `emo_verbatim_k` (×1.5) — the memory
  keeps its emotional core and sheds its frame even faster than a neutral
  record would (emotional-memory.md §2.1 time-course). **Trauma records
  additionally** set `floor := max(floor, trauma_floor)` (0.30) — vivid
  forever (Brewin et al. 1996; §7 of emotional-memory.md).
- **Era terms (v0.3 — keyed on `encodeAge`, see age-development.md §§2–3):**
  - *Reminiscence bump:* `β *= bump_gain(encodeAge)` permanently, where
    `bump_gain(a) = bump_beta_mult + (1−bump_beta_mult)·(1−cos(π·clamp((a−bump_lo)/(bump_hi−bump_lo))))`
    — a raised cosine over [bump_lo 10, bump_hi 30] peaked near
    `bump_peak` (~15). Applied **only if** `bump_valence_gate` passes:
    `valence ≥ bump_pos_min` (0.15 — v3.6 hardening: the v0.3
    `valence > 0 OR selfRelevance > bump_self_thresh` OR-branch let
    negative self-relevant records bump, contradicting the data —
    happiest/important bump, saddest/traumatic decline monotonically;
    Rubin & Berntsen 2003; Berntsen & Rubin 2004; Zaragoza Scherman
    et al. 2015). Negative self-relevant records get NO β relief from
    any bump window; their survival comes from arousal floor and
    rumin_k/co-rumination rehearsal. Per-character
    `bump_peak` jitter ±3y (Janssen et al. 2005: earlier for women).
    **v2.2:** the window generalizes to a per-character
    `bump_windows: [{lo, hi, mult}]` list emitted by the profile
    compiler from `ProfileInput.lifeEvents` — an immigration at age
    `a` mints `[a−2, a+8]` at `mig_bump_gain`·bump_beta_mult
    (Schrauf & Rubin 1998, 2001: the bump follows migration age, and
    goes bimodal when migration falls inside 10–30; the "effort after
    meaning" + settlement-interference-release account). No life events
    → the single default window, behavior unchanged. Cast with windows:
    C6 [10,30]+[27,37], C8 [10,30]+[10,20] (cast-profiles.md §1.1).
    **v4.9d — cohort imprinting (AD§53):** events carry
    `public_scale` {0,1,2} (1 = neighborhood-scale, 2 = epochal).
    A `public_scale ≥ 1` record encoded inside a bump window
    WAIVES `bump_valence_gate` — the generation-defining event
    imprints whatever its valence (Schuman & Scott 1989: critical
    period = adolescence/early adulthood). `public_scale = 2`
    ignores the window: `epochal_gain` (1.3) on E at any
    encodeAge ≥ 5 (Corning & Schuman 2015: epochal events flatten
    the age gradient). Such records mint `chapter: true` (C-tier
    flag) — retell ecology += `chapter_tell` (0.1) and §6.15 uses
    them as before/after brackets (Brown et al. 2009, "living in
    history": private memory organizes around the public event).
  - *Childhood records (v1.3: step → ramp + survivorship):* if
    `encodeAge < amnesia_exit` (7), permanently
    `β *= 1 + amnesia_slope·(1 − encodeAge/amnesia_exit)`
    (`amnesia_slope` ≈ 1.2 → β×2.2 at age 1, β×1.0 at 7 — graded, not a
    cliff; Bauer & Larkina 2014: forgetting rate orders 4y > 6y > 8y >
    adult). AND at the first sleep tick the record must pass a
    consolidation gate:
    `P(survive childhood) = min(1, child_consol_base + coherence·child_consol_gain)`
    (`child_consol_base` 0.15, `child_consol_gain` 0.6; coherence =
    coherentUnit flag or link degree > 0 at birth — thematic coherence
    predicts survival, Bauer & Larkina 2015). **v1.5:** failed records
    and pre-amnesia records that fall below `forget_thresh` set
    `latent: true` (§4.14) instead of archiving — childhood amnesia is
    an accessibility cliff, not a delete (Travaglia et al. 2016).
    `amnesia_decay_mult` is deprecated (≈ ramp midpoint).
    `child_consol_gain` is scaled by `reminiscence_env` (§4.14) and the
    effective boundary is `amnesia_exit_eff = amnesia_exit −
    3·(reminiscence_env − 0.5)` — caregiver reminiscing style moves the
    amnesia window itself (Reese & Newcombe 2007).
    **v4.9a — the wall has doors (AD§48):** `eventClass` gains
    `amnesia_pierce` ∈ {0,1,2} (0 default; 2 = sibling_birth,
    hospitalization, injury; 1 = move, death_family, new_school).
    The consolidation gate and §4.14 latent transition evaluate
    against `amnesia_exit_eff − amnesia_pierce` — Usher & Neisser
    1993: earliest reliable recall is 2y for hospitalization and
    sibling birth, 3y for death and move. Records surfacing only
    via pierce mint `earliest_candidate: true`. Below
    `pierce_age + 1`, `told_by`/`hearCount` cannot lift a record
    over the gate — being told about it is not having been there
    (Usher & Neisser: external sources correlate negatively below
    3, positively 4–5).
    **v4.9b — culture/gender move the wall (AD§51):**
    `amnesia_exit_eff` additionally += `culture_exit_off`
    (±0.5y, bible) where `reminiscence_env` gets a
    `culture_env` prior (multiply, cap 1.0) — MacDonald,
    Uesiliana & Hayne 2000 (Māori ≈2.7 / NZ European ≈3.5 /
    Asian ≈4.9, driven by Asian women); Wang 2001 (~6mo US–China
    gap); Mullen 1994 (gender). Total excursion clamp ±2y.
    **v4.9c — the school-age tail (AD§49):** for
    `encodeAge ∈ [amnesia_exit_eff, 11]`, β additionally ×=
    `school_beta_mult(a) = 1 + school_leak·(1 − (a−amnesia_exit_eff)/4)`
    (`school_leak` 0.5 → β×1.5 at 7 → 1.0 at 11) — the elevated
    forgetting rate outlives the encoding ramp (Bauer & Larkina
    2014: childhood distributions exponential vs adult power;
    Bauer 2015: 4>6>8>adult forgetting). coherentUnit/linked
    records take only half the increment (`coherent_leak_rescue`
    0.5) — thematic coherence predicts survival.
- **Modality slopes (v3.6):** verbatim fields carry `mod` ∈
  olf|vis|verb|aud (default verb); per-field β multiplies by
  `k_mod`: `k_olf` 0.6, `k_vis` 1.0, `k_verb` 1.25, `k_aud` 1.1 —
  olfactory content decays slowest, verbal fastest (Engen & Ross 1973;
  Herz & Engen 1996; Willander & Larsson 2007 — odor-cued AMs are
  older and more emotional; Cuddy & Duffin 2005 for k_aud being
  conservative). Olfactory cue overlap on §5.7's scan gets
  `olf_cue_gain` (1.3) and reaches archived records at
  `resurrect_thresh − 0.1` — smells resurrect what words cannot
  (Chu & Downes 2000; the mechanism behind `sensory_age_slope`).
- **Quote field class (v1.3):** `verbatim.quote` decays on a sub-daily
  schedule — `tau_quote` 0.02d (~30 min), `beta_quote` 0.8, floor 0
  (Sachs 1967: wording indistinguishable from paraphrase after ~80
  intervening syllables; Jarvella 1971: verbatim covers ~the current
  sentence). Same power law, smaller τ — legal per formal-model §1
  scale invariance. Dialogue quoting beyond the same hour should render
  as paraphrase/gist + confabulation, not the stored quote.
- **β_episodic ≈ 0.5 is calibrated**: τ=1.2d, β≈0.47 reproduces Ebbinghaus
  1885 / Murre & Dros 2015 (21% savings @ 31d) for meaningless unrehearsed
  material — the decay floor for episodic content. See
  `forgetting-curves.md` §2.1 and the calibrated retention table §4 thereof.

### 4.2 Interference

When two episodic records share high cue overlap (same place+people+topic,
within Δt window):

```
similarity(a,b) = simOp(a, b, "sim_interf")   // v2.1: weighted-mask
   operator, §11.1 — temporal proximity is a first-class feature here
   (the "which lunch" collisions proactive interference is made of)
if similarity > interf_thresh·discrim_mult (param, ~0.6):
    each suppresses the other: strength *= (1 - interf_k · similarity)
```

Retroactive: newer memory hits older harder (`interf_k` asymmetric, e.g.
new→old 0.15, old→new 0.05). This is what blurs the 40th identical commute.
**v1.3 — accumulation + release-from-PI:** each record carries `n_sim`,
the count of cue-similar records encoded *since* it (increment when a
new encodeEvent lands sim > interf_thresh in its cue bucket). Pairwise
suppression scales by `min(1, sqrt(n_sim)/pi_ref)`, `pi_ref` = 4 —
proactive interference accumulates to collapse within a handful of
same-category items (Wickens 1970); competition pools are the cue
buckets themselves, so a *category shift* (new venue, new topic cluster)
opens a fresh pool and the next record starts near-clean (release-from-
PI; Underwood 1957: most everyday forgetting is proactive). See
forgetting-curves.md §7.5.
**v0.4:** `discrim_mult(age_eff)` ≤1 scales the threshold down with age —
pattern separation loss means older characters treat *similar-but-distinct*
records as matches sooner (Yassa et al. 2011; Stark et al. 2013;
age-decline.md §4). Knots: 1.0 ≤50 → 0.72 at 85.
**v2.7 — child side:** the same U exists on the young end — mnemonic
discrimination matures through childhood (Ngo, Lin, Newcombe & Olson
2019, ages 4–80 inverted-U; Rollins & Cloude 2018). `discrim_mult`
gains child knots: ~0.75 at 5 → 1.0 by ~10 (merged into the knot
table), and `n_sim` accrual is ×`pi_child_mult` (1.3) for records with
`encodeAge < 10` — interpolated similar events pile up more PI against
child-encoded traces (Howe 1991; Ceci & Bruck 1993). This is the
*item-level* lure channel and is deliberately separate from the gist
channel (`phantom_p`, §6.8) which stays monotonic-rising into
adulthood — three dissociable childhood error channels (suggestion
high / gist low / item-discrimination poor), sign-locked by P252
(age-development.md §24).

### 4.3 Genericization (schema merging)

If `simOp(a,b,"sim_merge") > merge_thresh·discrim_mult` (~0.8) AND both below
salience threshold:
merge into one **generic memory** — keep shared gist ("my morning commute"),
drop both verbatims, `type` stays episodic but flag `"generic": true`.
This is routine-collapse (R§3) and costs almost nothing to run. v0.4:
same `discrim_mult` age scaling — genericization runs at elevated gain in
old characters (pattern-separation deficit, age-decline.md §4).

### 4.4 Forgetting threshold

`strength < forget_thresh` (param ~0.08) → record is archived, not deleted:
unreachable by normal retrieval, revivable only by a *maximal* cue (someone
narrates the event back). Emotional associations (§1) may outlive the record.
**v0.9:** archiving is on R only — `storageS` persists in archived
records, which is what resurrection and savings act on (§4.11).

### 4.5 Fading affect

`emotional.valence` magnitude decays toward 0; **negative valence decays
~1.3× faster than positive** (fading affect bias, R§5). Older-adult profiles
raise the asymmetry (positivity effect). **v0.5:** the arousal component of
the affect tag decays at `arousal_affect_decay` (×1.4 vs valence) — felt
intensity quiets faster than felt sign [HYPOTHESIS — emotional-memory.md
§12]. Dysphoria disrupts FAB (Walker et al. 2003): the depressive modifier's
`neg_affect_decay ×0.7` already encodes this.
**v1.7 — self-boundary:** `neg_affect_decay` applies only when the
record's `selfRelevance_eff ≥ fab_self_gate` (0.4); below the gate,
negative affect decays at the POSITIVE baseline rate — the bias is
self-referential repair, not a general solvent (Walker, Skowronski &
Thompson 2003; Ritchie et al. 2006/2015; emotional-memory.md §19).
**v2.5 — sleep-coupled affect:** `affect_sleep_frac` (0.4) of each day's
valence-fade budget executes inside `dailyMemoryTick`, scaled by
`sleepQuality`; the remainder accrues continuously. `trauma` records are
exempt. A sleepless night literally leaves yesterday's hurt sharper
("sleep to remember, sleep to forget" — van der Helm & Walker 2009;
DEBATED mechanism, direction supported; forgetting-curves.md §12.7).
Complements `sleep_affect_strip` (arousal channel); this one is valence.
Emergent: personal slights cool; witnessed wrongs done to others keep
their charge — collective memory of a public injustice outlasts
private hurt.

### 4.6 Consolidation window (new in v0.1)

Sleep shields young memories from interference (Jenkins & Dallenbach 1924:
8h asleep → 56.5% vs 8h awake → 46% recall; Murre & Dros 2015's 24h plateau).
A record younger than `consol_window_days` (default 1.0 — hasn't crossed a
sleep tick yet) is **interference-exposed at full rate** (§4.2 applies
normally) but decays only during the sleep tick, at
`consol_beta_mult` (0.5) × its normal β. Effect: day-1 survival is bimodal —
events that reach the sleep tick keep most of their strength; same-day
interference before sleep is what kills them. See `forgetting-curves.md` §2.8.
**v0.6 — gist edge at sleep:** at the daily tick, `generic:true` records
and `phantom:true` records (§6.8) get
`strength += sleep_gist_boost·(1−strength)` (≈0.05) — sleep consolidates
gist over verbatim, preferentially preserving exactly the content that
drives false recall (Payne et al. 2009; partially debated — a 2025
preregistered replication found the effect conditional on intrusion-
adjusted memory level; false-memory.md §3).

### 4.7 Permastore transition (new in v0.1)

Semantic records show a discrete two-regime life (Bahrick 1984: items live
0–6 years or >25 years, little in between). At each daily tick, a semantic
record with age ≥ `permastore_age` (180 game days) and strength ≥
`permastore_thresh` (0.25) sets `permastore: true` and freezes decay
(β→0). Well-consolidated world knowledge is effectively permanent; fresh
facts still decay normally. See `forgetting-curves.md` §2.3.
**v0.9:** the permastore gate tests `storageS ≥ permastore_thresh`
instead of `strength` — permanence is a property of how well-stored the
record is, not of how retrievable it happens to be today (§4.11).
**v2.5 — face permastore:** PersonModel records whose `familiarity ≥
fam_recog_gate` (0.5) at last contact qualify their *face-recognition
leg* (the §5.10 cascade's first step) for permastore at the lower
`face_perma_thresh` (0.15) — familiar-face recognition is essentially
flat over decades while names and details collapse (Bahrick, Bahrick &
Wittlinger 1975: ~90% identification/matching at ≥15 years, near-flat
to ~48y; free name recall declines ~60%). Names are
explicitly excluded — they keep the ordinary verbatim schedule on top of
`name_penalty`. "I know that face, we went to school together, and I
can't produce the name" is the human datum, not a bug. P232.

### 4.8 Lifespan decline layer — reserve and terminal decline (new in v0.4)

Two global modifiers wrap all age-declining capacity params
(age-decline.md §§8–9):

- **Cognitive reserve:** each character has `reserve ∈ [0,1]` (set at
  character creation from education/occupation/engagement; default 0.4).
  Decline-side capacity params evaluate at `age_eff = age_now −
  reserve·reserve_shift` (`reserve_shift` ≈ 10y). Applies to: enc_base,
  beta_episodic, beta_source, theta, link_p, discrim_mult, lure_accept,
  tot_rate, search_breadth, sws_mult, pm_self, ret_noise, specificity.
  **v1.6 additions to the reserve-shifted set:** value_select,
  hyperbind_p, dest_mem, ctx_loss, conf_inflate_old, schema_support,
  collab_partner_gain (age-decline.md §30).
  Does NOT apply to era terms (encodeAge is fact) or to
  misinfo_suscept/confab_fill (meaning-machinery, not fluid capacity).
  **v1.6 exemptions:** `positivity_gain` (motivational reorientation —
  SST, Carstensen) and `stereo_suscept` (trait × age gate, §5.4) are
  evaluated at `age_now`, never reserve-shifted.
  High reserve = later decline onset, similar slope (compression
  pattern; Stern 2002; Valenzuela & Sachdev 2006, OR 0.54).
- **Terminal decline (optional):** if a character's `deathDay` is set
  (scripted death only) and `age_eff ≥ 55` and
  `deathDay − worldDay < terminal_window` (~1100 game days, Wilson et
  al. 2003 change-point ≈43 months), apply a **global ramp** to all
  capacity params simultaneously:
  ```
  t_frac = 1 − (deathDay − worldDay)/terminal_window   // 0→1
  beta_*        *= (1 + terminal_gain·t_frac)           // terminal_gain≈2
  enc_base, link_p, search_breadth, sws_mult
                *= (1 − terminal_loss·t_frac)           // terminal_loss≈0.5
  theta, tot_rate, drift_p, confab_fill += terminal_loss·t_frac·default
  ```
  One ramp on everything implements terminal dedifferentiation —
  preterminal domain declines correlate 0.25–0.46, terminal 0.83–0.89;
  everything falls together (Wilson et al. 2012). Reserve does NOT
  delay the terminal window (Wilson et al. 2008: not modified by
  education). Most characters never set `deathDay` — absent = off.

### 4.9 Conditioned affect dynamics (new in v0.5)

The CondEntry table (§1) lives by extinction-era rules — extinction is
new, context-bound learning, not erasure (Bouton & Bolles 1979; Bouton &
King 1983; Bouton 2004; emotional-memory.md §6):

- **Fire:** on context construction / ambient ticks, entries whose `cue`
  matches the current context contribute `C.affect += valence·strength`
  (scaled by the suppressor below). Sets `lastFireDay`.
- **Decay:** `strength *= (1 − cond_decay)` daily, `cond_decay ≈ 0.005` —
  fear/preference associations outlive their episodic sources by design.
- **Extinction (suppression, not deletion):** each time a cue fires on a
  safe day (no matching-arousal event), `safeCount++`; emitted strength
  is `strength·max(0.2, 1 − extinct_suppress·safeCount)`
  (extinct_suppress ≈ 0.08) — the response attenuates but never dies.
- **Renewal:** the suppressor is context-bound — apply it only when the
  cue fires in the place context where the safe exposures accrued; a
  different place waives suppression entirely.
- **Spontaneous recovery:** if `now − lastFireDay > recovery_days` (30),
  `safeCount *= (1 − recovery_frac)` (0.5) — old dread resurfaces after
  quiet months.
- **Reinstatement:** a new event with `arousal ≥ cond_thresh` sharing the
  cue resets `safeCount = 0` and re-adds `cond_gain·arousal` to strength.
- **Generalization gradient (v1.7):** firing is similarity-keyed, not
  exact-match — `emit = valence·strength·sim` whenever
  `simOp(cue, C cues, "sim_cond") ≥ 1 − gen_width` (gen_width ≈ 0.25). Effective
  width widens with trauma load: `gen_width_eff = min(0.6, gen_width +
  0.15·n_trauma_records)` — anxiety flattens the gradient (Dunsmoor et
  al. 2009; Lissek et al. 2005/2010; Dunsmoor, Martin & LaBar 2012
  conceptual transfer comes free via shared topic/people fields).
  safeCount accrues in the fired similarity band, so close-but-safe
  neighbors partially extinguish.
- **Reconsolidation-window extinction (v1.7 — DEBATED):** on fire,
  set `reconsol_open` for `reconsol_window` (0.25 day ≈ 6h). A safe
  exposure inside the window adds `safeCount +=
  reconsol_extinct_gain` (3.0) and marks the suppressor `deep:true` —
  spontaneous recovery does NOT erode deep suppressors (Schiller et
  al. 2010; fragile in replication — Chalkia et al. 2020; treat as
  the sim's exposure-therapy mechanic, emotional-memory.md §21).
- **Person-cue asymmetry (v2.9):** entries whose cue is a person
  (people-field match) use `trust_neg_gain` (0.6) for negative-event
  acquisition and `trust_pos_gain` (0.2) for positive, and decay at
  `cond_decay·person_cond_decay_mult` (0.5) — one betrayal mints a
  durable tag; liking is built by repetition (Skowronski & Carlston
  1989; Baumeister et al. 2001; emotional-memory.md §31). Emitted
  valence feeds both C.affect and PersonModel evaluation drift.

### 4.10 Social-source decay modifiers (new in v0.8)

- **Cheater persistence:** records whose `verbatim.who` person has
  `PersonModel.cheaterLoad > 0.5` decay their source tag at
  `beta_source·cheat_source_mult` (0.6) — remembering *who* cheated
  outlives equivalent neutral associations, with NO effect on face
  recognition or content strength (Buchner, Bell, Mehl & Musch 2009:
  source-memory advantage η²≈.14, old-new discrimination unaffected;
  social-memory.md §3). Deliberately NOT on the age-decline curve —
  preserved in older adults (Bell & Buchner 2012).
- **Mnemic recall suppression:** records of self-threatening feedback
  (valence < −0.3, selfRelevance > `mnemic_centrality`, content about a
  self trait) take `θ += mnemic_loss` (0.15) in **recall mode only —
  recognition mode exempt** (Green, Sedikides & Gregg 2008: the effect
  is recall-specific; "forgotten but not gone"). Waived for close-other
  sources; ×0.3 under the depressive modifier (social-memory.md §10).
- **PersonModel decay:** `familiarity` at `beta_semantic·0.5`,
  `identityStrength` at `beta_source` (the associative tier — §2 link_p
  deficit applies), `nameStrength` at `beta_source·1.2`;
  `cheaterLoad` decays at `cond_decay·0.3` (moral reputation is sticky);
  `credibility` and `knowsTopics` do not decay (semantic directory).
- **Moral-rehab asymmetry (v3.2):** positive trait-implying updates
  against `dim:"moral"` traits currently negative apply at
  `×moral_rehab` (0.4) — redemption is slow (Skowronski & Carlston;
  social-memory.md §32). Competence dims update symmetrically; `eval`
  recomputes from traits each write.
- **toldTo edge decay (v3.2):** destination edges decay at
  `beta_source·dest_decay_mult` (1.5; ×(1+0.5·age_eff/60)) — see
  §6.11. Destination < source < content is the documented ordering
  (Gopie & MacLeod 2009; social-memory.md §35).

### 4.11 Storage strength — the S/R split (v0.9 deepening)

`strength` is retrieval strength R (accessible now). Each record also
carries `storageS` — how well-learned it is (Bjork & Bjork 1992 New
Theory of Disuse; formal-model.md §10):

- **Birth:** `storageS = encodingE`.
- **On successful retrieval:** `S += s_gain·lag_mult·(1−S)·(1−R_pre)`
  where `R_pre` is strength *before* the §5.9 reboost — the desirable-
  difficulty term: hard retrievals grow S, easy ones barely do
  (Karpicke & Roediger 2008). **v1.3 splits s_gain by access kind**
  (forgetting-curves.md §7.2): `s_gain_recall` = 0.35 for effortful
  recall of one's own record, `s_gain_rehear` = 0.12 for passive
  re-exposure (hearAccount match, re-witnessing) — rehear refreshes
  `lastAccessDay` identically (R-side benefit is the same) but buys ~⅓
  the storage growth; the Roediger & Karpicke 1-week inversion is the
  emergent consequence. `lag_mult` is the spacing factor:
  `exp(−(ln(gap/(lag_opt_ratio·recordAge)))² / (2·lag_width²))` with
  `lag_opt_ratio` 0.15, `lag_width` 1.0 — S-growth peaks when the gap
  since last access is ~15% of the record's age (Cepeda et al. 2006:
  optimal ISI scales with RI); gap < `massed_gap` (0.08d ≈ 2h) instead
  gets `massed_retell_mult` 0.4 — back-to-back retelling is mostly
  wasted.
- **Failed-retrieval potentiation (v1.3):** a recall() attempt that
  scored the record but missed θ sets `attempted: true`; the next
  re-encoding/re-exposure of matching content gets
  `E_new *= (1 + potent_gain)` (0.3) and consumes the flag (Kornell,
  Hays & Bjork 2009 — struggling to recall, then hearing it, beats never
  trying). **v2.8 — the Tse boundary:** `potent_gain` gains old-side
  knots (1.0 ≤50 → 0.75 at 70 → 0.55 at 85) and the flag expires if
  no successful recall or corrective re-exposure lands within
  `potent_window` (≈2 days) — errorful practice without feedback pays
  the old nothing (Tse, Balota & Roediger 2010: testing beats restudy
  for elders only with feedback; `reexp_ratio` untouched — restudy is
  their spared channel).
- **Decay:** `S *= (1 − s_decay)` daily, s_decay ≈ 0.0008 — near-
  permanent; under the §4.8 terminal ramp s_decay is a capacity param
  (`*= (1 + terminal_gain·t_frac)`).
- **Archive:** §4.4 tests R only; S persists in archived records.
  On maximal-cue resurrection: `R ← max(R, min(resurrect_R, S))`,
  resurrect_R ≈ 0.35 — high-S "forgotten" records return nearly
  functional.
- **Savings/relearn:** re-encoded content matching an archived record
  (simOp(·,·,"sim_merge") > merge_thresh) merges rather than duplicating, with
  `E_new *= (1 + relearn_gain·S_old)`, relearn_gain ≈ 0.8 (Ebbinghaus
  savings; Nelson 1985).
- **Permastore:** §4.7 gates on `S ≥ permastore_thresh`.

PersonModel tiers are exempt — they keep their own strength ordering
(adding S/R there doubles bookkeeping for no behavioral gain).

### 4.12 Deliberate suppression — a bounded R-side leak (new in v1.3)

`suppressEvent(charId, recordId)` models a character consciously
avoiding a memory. Each call: `record.suppressed++` and
`θ_eff += suppress_theta` (0.08, cumulative, capped at
`suppress_cap` 0.3). Acts on retrieval-side accessibility ONLY —
`storageS` untouched; the §5.7 involuntary scan **ignores** suppression
entirely (the avoided memory is the one that ambushes you in the
shower). Magnitude deliberately small: TNT suppression-induced
forgetting is ~8% (Anderson & Green 2001; Anderson & Huddleston 2012)
with an uneven replication record — `suppress_cap` ×0.5 under trauma/
depressive modifiers (reduced control where most wanted; Stramaccia et
al. 2021). forgetting-curves.md §7.7. This is a leak, not a delete key.

### 4.13 Retell ecology — rehearsal emerges (new in v1.3)

Once per daily tick, each live episodic record draws
`p_retell = retell_base·E_adj·(1 + retell_social·sharedCue
+ share_k·|affect|)·(1 − share_shame_pen·shameFlag)`
(`retell_base` 0.015/day; `retell_social` 1.0 when a co-present
participant/topic cue is in context). **v2.0 — the Rimé motive terms
(social-memory.md §18):** `share_k` ≈ 0.8 makes sharing propensity
scale with emotional intensity (Rimé et al. 1998: ~80–95% of emotional
episodes are socially shared, frequency ∝ intensity, valence-agnostic);
`shameFlag` (negative self-as-agent content, selfRelevance>0.6 &
valence<−0.4 — behavior layer may supply the flag directly) suppresses
sharing by `share_shame_pen` ≈ 0.5 (Finkenauer & Rimé 1998). Retells
grow S via §4.11 and dampen arousal only via `verbal_dampen` — there is
NO additional affect relief (`share_relief` is frozen at 0): talking
about it preserves the memory without healing it (Zech & Rimé 2005 —
the recovery illusion; guarded by P184). On fire: §5.9 reboost + §4.11
S-growth at `s_gain_recall` + §6.1 drift. This is the mechanism behind
the flat autobiographical curves (Linton; Wagenaar): the top few percent
of records get rehearsed toward permanence while the rest ride the
β=0.5 slope — survivorship, not a second functional form
(forgetting-curves.md §7.9). When the real social/rumor engine exists,
replace the Bernoulli draw with actual conversation opportunities.

**v2.6 — expanding retrieval (RC§23):** a retell/rehearsal whose gap
since `lastAccessDay` exceeds the record's previous access gap earns
s_gain × `expanding_bonus` (≈1.15) — Landauer & Bjork 1978; the
massed-vs-spread asymmetry is consensus, expanding-vs-equal
superiority at long intervals DEBATED (Karpicke & Roediger 2007), so
the bonus is small. Records gain `prevGapDays` (one hidden field).
The retell ecology now prices the schedule, not just the count.

**v2.7 — the adolescent rehearsal ecology (age-development.md §§28–29):**
- *Co-rumination:* negative-valence records (valence < −0.4) get one
  extra retell draw per tick at `coruminate_gain` (1.3) when a
  high-closeness PersonModel (closeness ≥ 0.6) exists in the roster —
  teen-weighted (×1.5 for age_now ∈ [13,19]), trait-loaded on
  `social`/`sex` (Rose 2002; Stone et al. 2011). Buys rehearsal AND
  interacts with `rumin_k` — the wound stays hot and can canonize
  (§6.24) a painful story.
- *Narrative onset:* during `narr_window` (age_now ∈ [12,25]), each
  retell additionally adds `narr_coh_gain` (0.1) to gist S and mints
  up-to-2 cross-era thematic `links` at link_p + `narr_link_gain`
  (0.15) — adolescence is when episodes get woven into a life story
  (Habermas & Bluck 2000; Habermas & de Silveira 2008). Child retells
  rehearse episodes; teen retells build the narrative.

**v3.6 — preferential-attachment retells:** a story already told is
more likely to be told again (practiced script, social permission,
§6.24 canonization feedback; Anderson & Schooler reuse power tails;
Simon 1955):

```
p_retell *= min(pa_cap, 1 + pa_gain·ln(1 + retrievalCount))
    pa_gain 0.3, pa_cap 3.0
```

Emergent: a handful of records absorb most of the rehearsal economy —
the canonical stories rehearse themselves toward permanence while the
median record rides the β slope. This is the engine §6.24's
canonization threshold presupposed; P375 audits the tail.

### 4.14 Latent infancy layer — stored but inaccessible (new in v1.5)

Infantile amnesia is an accessibility failure, not a storage failure
(Travaglia et al. 2016: reminder-reinstatable latent traces; Guskjolen
et al. 2018: optogenetic recovery of tagged infant engrams;
age-development.md §11). Two rules:

- **Retention window (encodeAge < 3):** records auto-set `latent: true`
  once `now − createdDay > ret_window(a) = ret_win_base·(encodeAge+1)`
  days (`ret_win_base` ≈ 3 — Rovee-Collier: infant retention grows
  ~linearly with age). The window fires regardless of strength —
  infancy storage is time-boxed.
- **Amnesia-zone transition (encodeAge < amnesia_exit_eff):** records
  that fail the §4.1 consolidation gate or later decay below
  `forget_thresh` set `latent: true` instead of archiving.

`latent` records are invisible to `recall`, `ambientMemoryScan`, §4.13
retell draws, and §6.x distortion operators — they cannot be rehearsed
or merged. `storageS` persists (they are stored). The ONLY route back
is §5.20 compound sensory reinstatement. Records with
`encodeAge ≥ amnesia_exit_eff` never go latent — they archive normally
under §4.4.

**v2.7 gate correction — amnesia is episodic-only:** `amnesia_ramp`,
`amnesia_decay_mult`, the `ret_window` auto-latent rule above, and the
§5.20 latent path apply ONLY to episodic records and their verbatim
fields. Semantic and procedural records minted at encodeAge < 7 form
normally and carry no source episode at all — born decontextualized
("I just know it"): early learning survives the amnesia boundary even
though no episode does (age-development.md §26; Bahrick; implicit-
learning literature). P254 tests the asymmetry.

### 4.15 Childhood consolidation inversion — naps (new in v1.5)

Children consolidate *more*, not less, from sleep (Wilhelm, Diekelmann
& Born 2008) and daytime sleep is a real consolidation event
(Kurdziel, Duclos & Spencer 2013: nap-encoded benefit, habitual-napper
dependence, and a ~10% nap-deprivation loss NOT recovered overnight).
Two changes:

- `sws_mult` knot table gains a child side: 1.2 (`sws_child_peak`) at
  age 6, linear to 1.0 by ~14 — the curve is now genuinely lifespan,
  not decline-only.
- `dailyMemoryTick(charId, sleepQuality, nap: true)` — a mid-day mini
  tick (game-supplied for `age_now < nap_age_exit`, 6) applies the §4.6
  consolidation-window decay rate to same-morning records early. If a
  nap-habitual child (bible flag `naps: true`) misses the nap, same-day
  records take `strength *= (1 − nap_loss)` (0.1) at the night tick —
  the loss is permanent (Kurdziel: overnight sleep does not recover it).

### 4.16 Transformation gain — verbatim death feeds gist (new in v2.5)

Systems consolidation converts episodes into schema-compatible form —
remote memories retain proportionally stronger schematic cores
(McClelland, McNaughton & O'Reilly 1995; the "transformation" reading is
Winocur & Moscovitch 2010 vs Nadel & Moscovitch's MTT — mechanism
DEBATED, the *observable* is consensus; forgetting-curves.md §12.5).

When a verbatim field of an episodic record crosses `forget_thresh`, or
is consumed by a §4.3 merge, that record's gist leg gains a one-time
storage boost:

```
storageS_gist += transf_gain · (1 − storageS_gist)    // ≈0.05
flag transf_done[field] = true                      // once per field
```

The record that sheds its particulars becomes *more story* — "the fight
at El Farolote" endures as compact, schema-consistent gist because its
frame was shed. This is the passive half of canonization (§6.24) and it
gives genericization a payoff consistent with the data. [HYPOTHESIS
implementation of a consensus observable — P234, SHOULD tier.]

### 4.17 Reversible regime overlays — hormonal transition windows (new in v2.7)

Distinct from the permanent age knots (§4.8 decline layer) and from
record-era `regime` tags (v1.0): these are **capacity overlays with a
runtime window** — they modify the character's live parameters while
active and are fully removed when the window closes. World supplies
the window flags; profiles doc §0 carries the clamps.

- **`preg` overlay** (sex-gated; third-trimester weighted, ~90d):
  `preg_theta_up` (+0.10 on θ — the deficit is recall-side),
  `preg_enc_loss` (−0.08 on enc_base — mild), `preg_pm_loss` (0.2 on
  nonfocal PM rolls). Recognition mode is FROZEN-spared
  (`preg_recog_spare = true` — Henry & Rendell 2007: free recall and
  executive WM dip, recognition/routine spared; Davies et al. 2018:
  SMD ≈ −0.48 overall, third trimester clinically significant;
  Rendell & Henry 2008: real-world PM impaired, lab spared).
  Complaint > deficit: `self_est` dips while θ barely moves — the
  metamemory gap is the phenotype.
- **`perimenopause` overlay** (sex-gated; ~45–55, duration
  `perim_years` ≈ 4): `perim_enc_loss` (−0.05) and the SWAN
  signature `perim_s_gain_mult` (≈0) — retell/rehearsal practice
  stops *growing* S during the window, then resumes after
  (Greendale et al. 2009, n=2362: retest learning gains absent in
  the transition, rebound post-menopause; Greendale et al. 2010:
  symptom adjustment doesn't explain it). Time-limited by
  construction — records don't decay faster; they stop getting
  stronger on re-test.

Both overlays: no new stores, no permanent marks — records encoded
inside carry only the ordinary `regime` tag. P261/P262 test
reversibility and the practice-stall signature.

- **`puberty` overlay** (all characters; window
  `pub_window` = [pub_onset, pub_onset+5y], pub_onset ~N(11.5,1)
  female / ~N(12.5,1) male, bible pin `pub_timing` ±2y — AD§52):
  `pub_emo_gain` (+0.15 on arousal_tag of socially-evaluative
  records — amygdala window, Spielberg et al. 2014), `pub_theta`
  (+0.05 — noisier consolidation during hippocampal–prefrontal
  reorganization, Murty, Calabro & Luna 2016), `pub_stress_gain`
  (+0.15 on stress-record E — Romeo's prolonged pubertal HPA
  response; stacks with §43 `child_stress_gain` only below
  `stress_flip_age`). Physiological, not social — the social-teen
  mechanics (social_eval_gain, coruminate_gain, narr_window) are
  separate and additive. All legs revert at window close; records
  keep only `regime:puberty`. Flagged DEBATED — the human
  episodic × puberty literature is inconsistent; legs kept narrow
  on purpose.

**v2.8 additions (age-decline.md §§40, 44):**

- **`isolation` overlay** (any character; elder-weighted): rolling
  14-day social-contact mean < `iso_floor` (≈1.5/day) sustained for
  `iso_onset` (≈30d) → ON: `beta_episodic += iso_beta` (0.1),
  `enc_base − 0.05`, `positivity_gain × 0.5`, nonfocal PM −0.1.
  OFF after 14d ≥ floor, recovering linearly over `iso_recovery`
  (≈60d) — slower to heal than to wound. Wilson et al. 2007:
  perceived loneliness doubled AD risk and tracked *no* AD pathology
  at autopsy → a state channel, so modeled reversible. `partnerDeath`
  events jump the ledger (widowhood = memory intervention; pairs
  with §6.13 `collab_partner_gain` loss).
- **`med_antichol` overlay** (any adult; elder-typical): while
  active — `theta + med_theta_up` (0.05), `enc_base − med_enc_loss`
  (0.05), `ret_noise + 0.03`, nonfocal PM −0.1; fully removed on
  stop. Gray et al. 2015: cumulative anticholinergic → dementia
  association (DEBATED, protopathic); we model the acute reversible
  impairment only — it does not feed `age_eff`.

### 4.18 Autobiographical periods — lives are chaptered (new in v3.6)

Transition theory (Brown et al. 2012; Brown 2016; Conway &
Pleydell-Pearce 2000 lifetime periods; Schrauf & Rubin 2001's
novelty + PI-release account): autobiographical memory is segmented
into periods delimited by life transitions. Every record carries a
`period` id (default 0). `registerTransition(charId, kind)` —
fired by the world layer on moves, job changes, relationship
starts/ends, household deaths — does four things:

1. Mints a new `period` id; subsequent records carry it.
2. **Life-scale release-from-PI:** `n_sim` pools reset — pre-transition
   cue buckets stop competing with post-transition records (the first
   week at the new job competes with nothing).
3. Records encoded within `trans_win` (±14d) of the transition get
   `E × (1 + trans_bound_gain)` (0.2 — novelty + effort-after-meaning);
   among them, records with `valence ≥ bump_pos_min` additionally join
   the §4.1 `bump_windows` list (generalizes the v2.2 migration clause
   to all transitions — Berntsen & Rubin 2004 sign-lock, §17.2 of
   forgetting-curves.md).
4. Retrieval: `cueMatch_ext` on a record pays `xperiod_pen` (0.15)
   when the active context's period differs from the record's; a
   same-period match gains `period_prime` (0.1) — cuing one member of
   a period makes its neighbors more available.

`kind` ∈ move|jobStart|jobEnd|relStart|relEnd|death|other; the world
layer owns the firing decision, params own the magnitudes. Emergent:
"before the divorce" stays a coherent, vivid, self-cuing pool — and
stops blurring into what came after. P368/P369.

### 4.19 Trauma micro-windows — Ribot's gradient (new in v3.6)

On minting a `trauma:true` record (arousal ≥ trauma_thresh), the
minutes around the event run backward and forward (Ribot 1882;
Squire & Alvarez 1995; Russell & Smith 1961 PTA):

- **Retrograde:** each of this character's records with
  `(t_trauma − createdDay) ∈ [0, retro_window]` (0.02d ≈ 30 min) takes
  `strength *= 1 − retro_loss·(1 − gap/retro_window)`
  (`retro_loss` 0.5 — graded: ~50% loss at contact, ~0 at the window).
  One-shot adjustment; the hit then rides the normal curve.
- **Anterograde (PTA):** for `pta_window` (0.02d) after the trauma,
  all new encodes get `E *= (1 − pta_loss)` (0.4) — the post-accident
  fog encodes thinly.

Minute-scale complement to the day-scale §4.6 consolidation window:
after the accident, the character keeps the day but loses the
approach. P370.

### 4.20 Script nodes — the routine swallows the instance (new in v3.8)

Repeated-event records (same `eventClass`, reps ≥ 3) accrue a
`script` node: invariant fields build `script_mass` (child knots:
accrual ×1.5 below `script_default_age` 8), variable fields stay
per-occurrence. Three operators (AD§37; Nelson & Gruendel 1981;
Hudson & Nelson 1986; Brubacher et al. 2011):

- **Default report:** below `script_default_age`, recall on a
  repeated class returns the script node unless a distinctive cue
  field matches an occurrence — children report "what happens," not
  "what happened."
- **Modal-filler intrusion:** script-mode recall fills unfilled
  slots with the modal value at `script_intrusion_p` (0.3 child →
  0.1 adult) — emitted as ordinary fields, undetectable to the
  child (that is the finding).
- **Sort window:** deviations encoded within the first
  `sort_window` (4) occurrences assimilate into the script at
  `assim_p` (0.4 below 8) instead of minting deviant; after the
  window deviations mint normally and keep the adult deviation
  advantage — the child failure is sorting, not noticing.

P390/P391.

### 4.21 Midlife regime — the plateau with a slope inside it (new in v3.8)

Knot-table revision (AD§41; Schaie SLS 1996/2005 — no reliable
within-person average decrement before ~60, ability-specific peaks):
the §6 50-knots relax to longitudinal shape — enc_base .84→.94,
beta_episodic 1.31→1.15, theta 1.18→1.08 — while `search_breadth`
keeps its decline (perceptual speed IS linear from the 20s). New
row `sem_accrual` (semantic consolidation rate): 1.0@30 → 1.4@50 →
1.6@60 → 1.0@75 — crystallized knowledge keeps growing while
episodic flatlines. The OLD steeper knots are not deleted: they
are reinstated by the `low_reserve` modifier — cross-sectional
steepness is between-person variance (cohort, education, health),
now explicitly a bible choice rather than the population default.
P396.

### 4.22 Contextual fluctuation slows with age — same-day blur (new in v3.9)

Balota, Duchek & Paullin 1989 (Psychol Aging 4:3) model fit: elders
encode less context per moment AND their context vector fluctuates
more slowly (AD§52). Two consequences:

- `ctx_flux_mult(age_eff)` — knots 1.0 ≤50 → 0.85 at 70 → 0.7 at 85 —
  scales every `ctxShift` magnitude (§5.29 boundaries, day
  boundaries, locShift): the old context drifts less, so same-day
  records share more context features → the §4.2 `sim_interf` pool
  is denser within-day → "which Tuesday thing" confusions rise with
  age while cross-day separation is preserved. P407.
- `spacing_gain` is an **explicit age-null** (Balota 1989; Bercovitz
  2017 — spacing benefit fully preserved): distributed retells are
  the elder's best rehearsal economics; no knots added. P402.

### 4.23 Channel split — recol vs fam, persSem minting, transg vividness (new in v4.7)

A record's observable forgetting curve is a composite of channels on
different clocks (forgetting-curves.md §22):

- **`recol_w` / `fam_w` (derived, never stored):** `recol_w` = mean
  strength of surviving verbatim fields ×(episodic?1:0); `fam_w` = gist
  leg strength ×(1 + `impl_fam_w`·`impl_str`). The phenomenology gate:
  a Reconstruction emits `reportMode:"remember"` iff `recol_w ≥
  rk_thresh` (0.3), else `"know"` — fluent content, thin detail, LOW
  latency (familiarity responds fast; substitute recol_w for R in
  §5.25's search term). Gardiner & Java remember→know conversion;
  Yonelinas & Levy 2002 rate split [CONSENSUS]. `selfdef` records never
  emit `know` — the anchor floor keeps recol_w up by definition.
- **Interference asymmetry [DEBATED — Sadeh et al. 2013/2014 vs Wixted
  single-process]:** §4.2 pairwise suppression reads the channel —
  ×`fam_interf_mult` (1.3) on fam_w, ×`recol_interf_mult` (0.7) on
  recol_w. Crowded cue buckets kill "sorta familiar" first; the
  vivid recollection is immune to neighbors, not to time. TOST-gated
  by P505 — collapse both to 1.0 if the asymmetry fails.
- **`persSem` minting (Renoult et al. 2012):** when an episodic record
  with `selfRelevance ≥ ps_gate` (0.5) AND `retrievalCount ≥ ps_recount`
  (2) archives or reaches `permastore_age`, mint a `persSem:true`
  semantic record carrying {topic, place, people, period, gist} at
  strength `ps_transf` (0.5)·gistS — no verbatim, no intrude_w, conf
  high. β_semantic; exempt from §4.3 merge and the amnesia ramp;
  permastore-eligible. The episode dies; the self-fact survives —
  "I don't remember the wedding, but I know it was at City Hall."
  `sdam` profiles mint normally (their deficit is the recol channel
  only). The minted fact inherits the episode's distortions.
- **`transg` vividness-only decay (Kouchaki & Gino 2016, bounded by
  Stanley, Yang & De Brigard 2018 failed replication):** records
  tagged `transg:true` (own norm violation — `deceptive`/`harmOther`
  + selfRelevance ≥0.5 + self-model dissonance; world tagger supplies)
  decay vividness ×`transg_vivid_mult` (1.3)·(0.5+0.5·`defens`).
  **Locked nulls:** verbatim accuracy, gist, storageS, and persSem
  minting all UNTOUCHED — phenomenology dims, content does not
  falsify. P510.

### 4.24 Dream records — the minutes-scale class (new in v4.7)

Koulack & Goodenough 1976 arousal-retrieval model + Koukkou & Lehmann
1983 state-shift hypothesis: dream content stores ONLY through wakeful
arousal; unretrieved content is gone within minutes (deferred from
emotional-memory §25 — priced here, forgetting-curves.md §22.4):

```
each dailyMemoryTick (sleep): mint Poisson(dream_mint) ≈1–2 records,
    source:"dream", E = dream_salience·0.15 (world/story supplies
    salience), tau_dream 0.004d (~6min), beta_dream 1.2, verbatim thin
wake tick: each live dream rolls dream_recall_p = dreamRecall
    (trait 0.02–0.5, default 0.1) · (1 + 0.5·dream_salience)
    success → re-encode as ordinary low-E episodic; source:"dream"
        retained; conf ceiling 0.4; plausibility-flagged
    failure → archives; unreachable below resurrect_thresh, even for
        olfactory cues (§17.5's lowered archive reach does not apply)
emotional residue: dream arousal can feed §4.9 CondEntry acquisition
    at dream_cond_mult (0.3) — the nightmare marks the body, not the
    record
```

Wake-encoded dream records join normal machinery — including §6.9
reality-monitoring slips under high `fantasy`/`confab_fill` (bounded
≤5% of dream recalls — P507). [CONSENSUS gate; magnitudes HYPOTHESIS]

### 4.25 The binding tax and the capacity ladder (new in v5.0)

Naveh-Benjamin 2000 + Old & Naveh-Benjamin 2008 meta (90 studies —
verified): the old-age deficit is disproportionately in LINKS, not
items; pronounced under intentional learning, unclear under
incidental (AD§63). Applied as:

```
for every link-forming write (field attachment verbatim.who/where/
when, source-tag strength, cueBind_init, RelEdge delta from a
shared episode):
    linkS *= 1 − (1 − 1/adh_bind_tax) · intent_share
    // adh_bind_tax(age_eff): 1.0≤50 → 1.35@70 → 1.75@85
    // intent_share = (enc − att_min·E_floor)/(enc) — the
    //   intentional increment fraction; incidental encodes at
    //   floor show item≈assoc loss (the incidental null, P535)
person↔name/role links: linkS *= 1/namepair_tax   // ×1.2@70;
    links carrying a semantic-relational tag (kinship/job/
    cohabitation) subtract meaningful_link_rescue (0.3) of the tax
recognition mode: the tax surfaces as source/context misses;
free recall: masked — item retrieval fails first (emergent, not coded)
```

WM tier multipliers on retrieval consumers (Bopp & Verhaeghen 2005 —
three slopes, verified): `wm_store_mult` (1.0→0.95@80) on single-cue
recall; `wm_reorder_mult` (→0.85) on reconstruction field ordering;
`wm_complex_mult` (→0.72) on multi-cue fusion (3+ simultaneous cues)
— and is the *justification* for the existing `search_breadth`/
`pm_self` knots, NOT a second decline on them (redundancy note:
apply to new consumers only).

### 4.26 Event segmentation coarsens (new in v5.0)

Sargent et al. 2013 (Cognition 129:241 — verified): segmentation
agreement predicts event memory beyond speed/WMC/knowledge, equally
in old and young; older adults segment less normatively (Zacks et
al. 2006; Kurby & Zacks 2011). `seg_boundary_p(age_eff)` (1.0≤55 →
0.8@70 → 0.65@85) multiplies the §5.29/doorway boundary-mint rate
and goal/subgoal record splitting. Records minted under low
segmentation carry `coarse:true` → higher gist share, fewer
verbatim fields, wider dateEstimate sigma. Distinct mechanism from
§4.22 ctx_flux (context density vs boundary density — different
interventions, P541 separates them).

### 4.27 Emotional item vs context split (new in v5.0)

Kensinger, Brierley et al. 2002 (Emotion 2:118 — verified):
emotional-ITEM enhancement preserved in aging; emotional-CONTEXT
enhancement (neutral items embedded in emotional context) LOST.
The context benefit is a binding benefit — it falls under
`adh_bind_tax` and additionally gets `emo_ctx_gain(age_eff)`
knots 1.0≤60 → 0.6@75 → 0.4@85 on the §4.9-adjacent arousal-bleed
leg onto neutral co-encodees. `w_emo`/`emo_consol_gain`/`abc_gain`
reaffirmed explicitly OFF the decline curve (P539 sign-lock).

### 4.28 Anticipatory records — dread writes a trace (new in v5.1)

Van Boven & Ashworth 2007 (JEP:G 136:289 — verified): anticipation
is more evocative than retrospection, mediated by mental simulation;
§6.9 `imagine_gain` supplies the write mechanism. When the world
flags a future event `anticipated` for a character, mint
`{anticip:true, source:"imagined", arousal_tag = anticip_gain·
expectedArousal (0.4), thin verbatim}`. Each dwell/simulation tick
on the expected event acts as a retell on the anticip trace
(strength up, drift applies — the feared version sharpens). At the
real encodeEvent the anticip trace does NOT merge — it persists as
a competing same-event trace; if |real_tag − anticip_tag| > 0.4
mint a small mismatch record ("not as bad as feared" /
"worse than imagined") — relief/disappointment is the meta-emotion
of the gap (Shepperd & McNulty 2002; P545).

### 4.29 Betrayal and secondhand fear (new in v5.1)

**Betrayal leg.** Freyd betrayal-trauma (1994/96; Freyd, DePrince &
Zurbriggen 2001; Lindblom & Gray 2009 partial; McNally 2007
critique — DEBATED): the defensible signal is avoidance + detail-
thinness, NOT amnesia. On encoding of valence<−0.3 events whose
cueVector.people contains a perpetrator at trust ≥ betrayal_thresh
(0.6): `arousal_tag *= (1 + betrayal_trust_gain·trust)` (0.35),
verbatim fields at `(1 − betrayal_thin·trust)` (0.3), record flagged
`betrayal:true`. Retrieval legs at §5.54-adjacent: voluntary-recall
discount `betrayal_avoid_k` (0.4, R-side θ bump à la suppressEvent)
+ intrusion −0.1; if trust collapses, avoidance relaxes over ~30d.
Locked: betrayal records are NEVER unreachable — avoidance, not
erasure (P546 sign-lock).

**Secondhand-fear leg.** Olsson & Phelps 2007 (Nat Neurosci 10:1095)
+ Olsson, Nearing & Phelps 2007 (SCAN 2:3 — verified): observational
fear learning shares amygdala machinery and can match direct
conditioning; instructed fear weaker (Phelps et al. 2001). §4.9
acquisition gains three routes — direct (unchanged); witness:
`vic_cond_mult·cond_gain·arousal` (0.6) + thin `witnessed:true`
episodic record; instructed via hearAccount with teller arousal ≥
cond_thresh: `inst_cond_mult·cond_gain·arousal` (0.3), no episodic
record. Same decay/extinction/renewal/generalization machinery;
applies to positive conditioning too (P547).

---

## 5. Retrieval — probabilistic, cue-driven (rewritten in v0.2)

Calibration for everything in this section: `retrieval-cues.md` (RC§n).
v0.2 changes: encoding-specificity gate, saturating cue combination, log fan,
place-reinstatement term, age-scaled sensory cues, mood-state dependency
(distinct from mood congruence), recognition-vs-recall modes, involuntary
retrieval, part-list cuing.

### 5.1 Cue gating — only encoded cues exist (new in v0.2)

A retrieval context `C` (current place, present people, active topics, sensory
inputs, current mood, mode) matches memory `m` **only on fields present in
`m.cueVector`**. A cue the character never encoded contributes exactly 0 —
Tulving & Osler 1968: cues present only at retrieval do nothing (RC§1).
Absent fields are not "partial credit," they are not cues.

### 5.2 Saturating cue combination (replaces v0 weighted sum)

Two simultaneous cues are no better than one (Tulving & Osler 1968), so cue
fields combine by **noisy-OR**, not sum:

```
per-field match:    c_j = w_j · overlap(C_j, m.cueVector_j)      ∈ [0, w_j]
diagnosticity (v2.6): c_j *= (1 − diag_w
                            + diag_w·min(−ln(df_j/N_live), ln(diag_cap))
                                  / ln(diag_cap))                // RC§20
                    // df_j = live records sharing the cue key (§4.2
                    // buckets supply the count — no new store);
                    // a near-unique cue ≈ ×diag_cap, a universal cue
                    // ≈ ×(1−diag_w). Match still GATES (§5.1);
                    // diagnosticity prices the cue (Nairne 2002;
                    // Poirier et al. 2012 — more match can hurt when
                    // it lowers diagnostic value).
cue ownership (v3.7): if C_j.origin == "self": c_j *= selfcue_mult
                    // ≈1.7 — a cue descended from the character's own
                    // elaboration/narration beats a nominally identical
                    // external cue (Mäntylä 1986: ~91% vs ~55%; Tullis &
                    // Finley 2018 — RC§33). origin defaults "ext";
                    // self-origin cues are definitionally §5.1-encoded.
                    // Orthogonal to diagnosticity: holds at matched df.
sensory age scale:  c_sensory = w_sensory · overlap · (1 + sensory_age_slope
                                  · log1p(m.ageDays/30))         // RC§3 Proust
mismatch penalty:   if a salient sensory field mismatches:
                    cueMatch -= sensory_mismatch_pen (0.05)      // RC§3
language match (v1.9):  if C.lang && m.lang && C.lang != m.lang:
                    c_verbal, c_topic, c_people *= lang_mismatch_eff
                    // lang_mismatch ≈0.6 base; v3.6:
                    // lang_mismatch_eff = 1 − bilingual_bal·(1−lang_mismatch)
                    // — balanced bilinguals cross-retrieve nearly free
                    // (Schrauf & Rubin 1998; Marian & Neisser 2000) —
                    // attenuates, never gates
                    // v4.9 — era-depth lock (AD§50): profiles carry
                    // langs[].l1_until (ambient-language switch age);
                    // m.lang mints from ambient at encodeAge. For
                    // l1-era records the mismatch is deeper:
                    if m.encodeAge < m.l1_until:
                       lang_mismatch_eff ×= (1 − l1_lock·
                           (1 − m.encodeAge/m.l1_until))  // l1_lock .5
                    // match side: C.lang == m.lang == l1 && l1_until ≥ 6:
                    arousal_tag_eff += l1_emo_gain (0.1)   // Harris 2003
                    // — L1 reprimands carry the voltage. Early
                    // bilinguals (l1_until < 6): gain = 0, locked null.
cueMatch_ext = 1 − Π_j (1 − min(c_j, 1))                         // saturates at 1
place reinstate:    if C.place == m.cueVector.place:
                    cueMatch_ext += place_reinstate · (1 + log1p(m.ageDays/30))
                    // grows with memory age — Smith & Vela interval interaction
mental reinstate:   if C is a guided reconstruction (co-conversationalist
                    describes the scene): += mental_reinstate (≈0.6×
                    place_reinstate)                              // RC§2
```

Cue-weight ordering constraint (v0.1, kept): `w_topic ≥ w_people ≈ w_place >
w_sensory` (Wagenaar 1986); era/when stays weak, `verbatim.when` drifts at
`drift_p·1.5`.

### 5.3 Mood terms — congruence vs state-dependence (split in v0.2)

Two separate phenomena (RC§4):

```
moodCongruence = w_state · (1 − |m.emotional.valence − C.mood|)/2
                 // event valence × current mood — CONSENSUS, larger effect
moodStateDep   = w_msd · (1 − |m.encodeMood − C.mood|)/2
                 · (1 − cueMatch_ext)
                 · exp(−m.ageDays / state_ctx_hl)          // v2.5
                 // encoder mood match — small, and ERASED by strong
                 // external cues (Eich meta; Mecklenbräuker & Hager)
                 // v2.5: internal context itself decorrelates —
                 // state_ctx_hl ≈ 21d (Estes fluctuation; Mensink &
                 // Raaijmakers 1988; forgetting-curves.md §12.6).
                 // Applies to ALL internal-state cue overlap (mood,
                 // physiological state); place/people cues exempt —
                 // external context is stable. Mood CONGRUENCE (above)
                 // never drifts — that's the meta-analytic split.
```

### 5.4 Retrieval probability

```
drive(m) = cueMatch_ext·env_support_gain + moodCongruence + moodStateDep
           + recencyBump(m) + contiguityTerm(m)
           + (C.intox && m.intox ? intox_state_dep·
              (1 − |C.intox − m.intox|) : 0)          // v1.9, small
           + m.strength·w_str − θ + N(0, ret_noise) + N(0, iiv_sigma/2)
// v1.9: iiv_sigma/2 is the per-call half of the inconsistency trait
// (§2 day_mult is the per-day half); record field `m.intox` = the
// encode-time context.intox (schema gain — default 0).

// v0.9 deepening — temporal contiguity (formal-model.md §14):
contiguityTerm(m) = C.temporalAnchor == null ? 0 :
    contiguity_gain·exp(−|m.createdDay − C.temporalAnchor|/contiguity_tau)
    · (m.createdDay ≥ C.temporalAnchor ? contiguity_asym : 1)
// C.temporalAnchor = createdDay of the last record recalled this
// conversation — recall reinstates temporal context, which cues
// neighbors-in-time with forward asymmetry (Howard & Kahana 1999/2002)
// v3.1 (§§24–26): on socialThreat:true records, recall-mode drive
//   += vigil_recall_bias·vigil (recognition-mode flat — Mitte 2008);
//   episodic-recall θ −= handmix_ret_gain·hand_mix (retrieval-only —
//   Lyle 2008).
P(recall m) = logistic( k · drive(m) ) / (1 + fan_k · ln(1 + fan(m)))
```

- `fan(m)` = number of OTHER live records sharing m's dominant cue;
  **merged/generic memories (§4.3) count as one fan item** — situation-model
  integration abolishes fan cost (Radvansky et al. 1993). Log divisor per
  ACT-R fits (Anderson & Reder 1999); `fan_k` ≈ 0.4.
- `θ` = retrieval threshold param; `k` = sharpness (~8). Dice roll, not lookup.
  **v0.5 — acute stress impairs retrieval:** if the context carries
  `C.stress > stress_retrieve_thresh` (0.6), add
  `stress_retrieve_loss·C.stress` (≈0.12) to θ for this call —
  glucocorticoids impair retrieval of even well-learned material while
  sparing encoding/consolidation (de Quervain et al. 1998/2000; requires
  concurrent arousal, Roozendaal et al. 2004; emotional-memory.md §4).
  Retrieval-side only; never touches decay.
  **v3.7 — lag + valence (RC§35):** the penalty applies only when the
  stressor's onset is ≥ `stress_lag_min` (≈20 sim-min — cortisol hasn't
  peaked inside the window; Schoofs et al. timing studies) and ≤
  `stress_off_min` (≈90), and is scaled per-record by
  `(1 + stress_emo_mult·|m.emotional.valence|)` (`stress_emo_mult` ≈0.5)
  — the meta's moderator: retrieval stress hits emotional material
  HARDER than neutral (Shields, Sazma, McCullough & Yonelinas 2017,
  113 studies; Gagnon & Wagner 2016). Interrogated during the shock:
  fine. Twenty minutes after, calm and cortisol-peaked: empty.
- **v3.7 — divided attention at test (RC§34):** `cueContext.daLoad`
  taxes the effortful legs, not the completion: voluntary recall
  `θ += da_ret_pen·daLoad` (≈0.04), `search_breadth ×=
  (1 − da_breadth_pen·daLoad)` (≈0.3), and §5.25 `latency_ms ×=
  (1 + lat_da_mult·daLoad)` (≈0.6); §5.14 nonfocal/time PM monitor
  rolls `×= (1 − da_monitor_pen·daLoad)` (≈0.5) — vigilance pays
  what retrieval doesn't. Ambient scan, involuntary, focal PM:
  unchanged. Retrieval is near-obligatory but protection costs
  resources (Craik et al. 1996; Naveh-Benjamin et al. 1998/2000;
  Rohrer & Pashler 2003). P379.
  **v0.7 — synchrony on θ:** with `peak_hour` set, θ gains
  `synchrony_gain·(1 − cos(π·Δh/12))/2` — recall is HARDER off-peak,
  mirroring the §2 encoding modulation; age-scaled per §2 (May &
  Hasher 1993; individual-differences.md §5).
- `recencyBump` = `rec_k · exp(−(now − createdDay)/rec_τ)`, rec_τ≈2 days.
- **Archived records** (strength < forget_thresh, §4.4) are reachable only if
  `cueMatch_ext > resurrect_thresh` (≈0.85) — a near-total context
  reinstatement or someone narrating the event back (maximal cue).
  **v0.9:** resurrected R is floored at `min(resurrect_R, S)` (§4.11) —
  revival strength scales with how well-learned the record was, not a
  flat return. contiguityTerm alone can never reach an archived record
  (it is drive-only and too small to cross resurrect_thresh).
- **v0.9 — searchCost output:** the call also returns `searchCost`
  (scored/returned candidate ratio + mean drive margin) — the retrieval
  *experience* the dialogue layer reads for judged-frequency statements
  (ease-of-retrieval, formal-model.md §13): `searchCost ≤ ease_few`
  reads "happens all the time," `≥ ease_many` reads "barely ever,"
  independent of actual count (Schwarz et al. 1991).
- **v0.4 — environmental support (age-decline.md §1):**
  `env_support_gain(age_eff)` ≥1 multiplies cueMatch_ext's contribution —
  cue-rich contexts disproportionately rescue older retrieval; deficits
  concentrate in self-initiated (low-cue) search (Craik 1983/2022; Angel
  et al. 2010). Do NOT age-penalize the place-reinstate term — older
  adults benefit equally (2024 context-reinstatement meta, g=0.32).
- **v0.4 — retrieval noise:** `N(0, ret_noise(age_eff))` added to drive;
  σ 0.05 young → 0.16 at 85 (dedifferentiation/within-person variability,
  Li & Lindenberger; age-decline.md §10). Same draw logic perturbs
  `misinfo_suscept`/`tot_rate` rolls.
- **v0.4 — search breadth:** score at most `search_breadth(age_eff)`
  candidate records per recall call (cue-bucket preselection, then rank
  by drive; ~12 young → 5 at 85). Older characters surface fewer
  candidates with identical cue math (processing-resource decline,
  Craik; Salthouse; age-decline.md §2). Also caps §5.7 scan breadth.
- **v1.6 — stereotype threat:** if `cueContext.evaluative: true` (the
  character knows their memory is being judged) and the mode is
  `recall` — NOT recognition — `θ += stereo_suscept·0.06·
  stereo_age_gate(age_now)` and `lapse_p` +0.02 for the bout.
  `stereo_age_gate` = 0 below 50, ramps to 1 by 70 [frozen shape].
  Recall-only per the Armstrong et al. 2017 meta moderator; the
  Hess/Lamont literature's effect is real but small (d≈.3 overall,
  d≈.52 stereotype-framed) — this is a situational tax, not a trait
  deficit (age-decline.md §24).
- **v2.6 — self-initiation tax (retrieval-cues.md §27):** when the
  arriving context is cue-sparse (`cueMatch_ext` of the best candidate
  < `selfinit_bar` ≈ 0.3 — a voluntary search with little to go on),
  θ gains `selfinit_pen·ageScale` (≈0.08) for the call. The age
  deficit concentrates where retrieval must be self-generated;
  `env_support_gain` (v0.4) rescues given cues, `selfinit_pen` taxes
  their absence — separable by design (Craik 1983/1986; Craik & Byrd
  1982; Lindenberger & Mayr 2014). P248.
- **v1.6 — positivity at selection:** among near-tied candidates
  (drive within 0.05) prefer the positive-valence record with
  probability `pos_eff` (§2 formula; age-decline.md §18). Older
  reminiscence leans warm even when the archive doesn't.
- **v3.9 — semantic access tax:** open-ended semantic retrieval
  (list-generate queries against the semantic store — "name the
  vendors on the block") pays `θ += sem_search_tax(age_eff)`
  (knots 0 ≤50 → 0.03 at 70 → 0.06 at 85). Direct fact lookup /
  item recognition exempt — the store is rich, the index is slow
  (Tombaugh, Kozak & Rees 1999 fluency norms; Rönnlund 2005;
  age-decline.md §57). P406.

### 5.5 What retrieval returns

Not the record — a **reconstruction**:
1. Return `gist` verbatim fields only if `verbatimStrength` survives; else
   regenerate details schema-consistently (confabulation hook §7.2).
2. If `beliefStatus` is `rumor`, return content tagged as uncertain **unless**
   source tag has decayed (§7.3) — then it may be returned as fact.
3. Attach `confidence` for downstream dialogue hedging ("I think…", "I'm sure…").
4. **v0.4 — specificity gate:** before reconstruction, with probability
   `1 − specificity_eff` return the generic/merged record covering this
   episode instead (overgeneral autobiographical memory in aging,
   Piolino et al. 2006/2009; Autobiographical Interview meta — fewer
   internal, more external details; age-decline.md §5).
   `specificity_eff = specificity(age_eff)·(1 + pos_spare·valence)` for
   valence>0 (`pos_spare`≈0.2 — positive-cue sparing, AMT meta 2025).
5. **v0.4 — TOT partial retrieval:** when a surviving
   `verbatim.who`/name field is requested, blank it with probability
   `tot_rate(age_eff)` (×1.5 for proper-name fields; ×higher if the
   referent's records are nonrecent — Rastle & Burke 1996): return the
   record with the name slot empty and a `tot: true` flag — a
   feeling-of-knowing state, not a missing memory (Burke et al. 1991;
   age-decline.md §6). A subsequent recognition-mode cue resolves it at
   near-young rates (resolution spared with age).
6. **v0.5 — mood bleeds into the telling:** the returned affect tag is
   shifted toward current mood —
   `reported_valence = m.valence·(1−mood_bleed) + C.mood·mood_bleed`
   (mood_bleed≈0.10; Matt et al. 1992 meta d≈0.4) and
   `reported_arousal = m.arousal·(1 + mood_arousal_bleed·|C.mood|)` (≈0.1).
   The stored tag is unchanged — bias accrues only through §5.9
   reconsolidation drift on retellings (emotional-memory.md §8).
7. **v0.5 — trauma reconstruction:** for `trauma: true` records, return
   gist + core verbatim but blank/drift `verbatim.when` and ordering
   fields (encoded at half strength per §7 of emotional-memory.md) —
   vivid event, fragmented timeline (Brewin et al. 1996).
8. **v3.6 — remembered emotion is reconstructed:** the reported
   `emotional.valence` is blended toward *current* appraisal —
   `reported_valence = w·v_stored + (1−w)·v_appraisal` with
   `w = min(1, strength·aff_recon_scale)` (`aff_recon_scale` ≈ 2.0);
   `v_appraisal` comes from the PersonModel eval dim of the event's
   participants or the record's `meaning` field, falling back to
   `v_stored` when neither exists (Levine & Safer 2002; Robinson &
   Clore 2002 — long-delay emotion reports substitute belief-based
   knowledge; forgetting-curves.md §17.9). Stored tag unchanged; sign
   follows the PRESENT relationship — the reconciled ex-friend's
   betrayal reports milder, the estranged one's hotter. Second
   affective channel for §6.17 consistency-pull. P376.

### 5.6 Recognition vs recall modes (new in v0.2)

`recall(charId, C, k)` takes a `mode` field on `C`:
- `"recall"` (default): contextual reconstruction — the formula in §5.4.
- `"recognition"`: C is a copy cue (a face, a photo, a name spoken aloud).
  Verbatim/copy fields match at full `w_str`, but contextual fields don't
  apply. Crucially, recognition can FAIL for memories that recall would
  return — Tulving & Thomson 1973, recognition failure of recallable words
  (RC§1; Muter 1978: ~53% failure for names later recalled). Implement: in
  recognition mode, records whose `cueVector` lacks the copy feature get
  `cueMatch_ext · recogn_pen` (≈0.4). A character can fail to "place" a face
  yet recall the person perfectly given the right context — and vice versa.
- **Lure acceptance (v0.4):** in recognition mode, a cue that is
  *similar-but-not-identical* (feature overlap ∈ [0.5,1.0)) is accepted as
  a match with probability `lure_accept(age_eff)·overlap` — the
  pattern-separation deficit produces false "yes, that's the scarf"
  endorsements, robust to instructions (Stark et al. 2013/2015;
  age-decline.md §4). **v1.9 — domain-scoped:** when the lure is
  consistent with a profile `domains` entry (same domainMatch test as
  §2 expert_gain), add `expert_lure` (≈0.10) — experts falsely recall
  MORE domain-consistent material (Castel, McCabe, Roediger & Heitman
  2007; Baird 2003). Same term applies to §6.3/§6.8 adoption of
  domain-consistent misinformation and phantom content.
  **v2.8 — the antipeak breeds lures:** if `peak_hour` is set and
  `Δh = |tod − peak_hour| > 6`, then `lure_accept *= (1 +
  sync_lure_gain·lure_sync_gate(age_now))` — `lure_sync_gate` is 0
  below 50 ramping to 1 by 70 (frozen shape). Intons-Peterson et al.
  1999: nonoptimal-time testing inflated false memory in old adults
  only — the inhibitory gate is the circadian-sensitive resource.

### 5.7 Involuntary retrieval (new in v0.2)

Memory surfaces without search — the normal case, not the exception
(Berntsen: involuntary ≈ 3× voluntary frequency, 2–5/day, arising under
unfocused attention; RC§5). Each ambient tick (when the character is NOT in
focused task/conversation), run a cheap cue scan over live records:
```
if character attention state == "unfocused":
    for records sharing any cue key with current C:
        if cueMatch_ext(m) > intrusion_thresh (≈0.75):
            m surfaces spontaneously → normal reconsolidation §5.8 applies
```
**v2.8 — the involuntary highway (age-decline.md §42):** ambient-scan
emission rate stays age-flat (v2.6 rule reaffirmed — Schlagman et al.
2009: involuntary frequency preserved while voluntary declines), but
emitted records are biased: positive valence preferred with prob
`invol_pos_gain(age_eff)` (knots → 0.15 at 85; Schlagman et al. 2006
content finding — elders' involuntary AMs skew positive), and the
record-age prior tilts remote via `invol_remote_gain(age_eff)` (≈0.2
at 75+) — involuntary recall disproportionately surfaces bump-era and
remote records in old characters. Involuntary recalls earn full §5.9
reboost: ambient recall IS the elder's rehearsal economy.

`intrusion_thresh` drops ~0.15 under active stress and for trauma-tagged
records — **v0.5: the −0.15 discount is a property of `trauma:true`
records themselves** (not only the character modifier). **v2.2:**
`confidential` records get an independent intrusion channel —
`cueMatch_ext` threshold effectively `intrusion_thresh − secret_mindwander`
(≈0.08, ×(1+0.4·selfconceal trait)) — secrets mind-wander in at ~2× their
concealment-situation rate (Slepian, Chun & Mason 2017: the burden of
secrecy is spontaneous thought, not social hiding; the wellbeing cost
tracks intrusion frequency, not concealment frequency), and each
intrusive resurfacing re-stamps `emotional.arousal` to ≥0.7 — intrusions
rehearse the affect, which is why flashbacks don't fade (reconsolidation,
§5.9; emotional-memory.md §7). Intrusive memory is the same machinery at
pathological gain. Tune so a quiet day yields 2–5 spontaneous recalls per
main character (validation probe P14, RC§8).

**v2.6 — the involuntary cue diet (RC§25):** the scan does NOT reuse
the voluntary weights — involuntary retrieval is triggered by concrete
perceptual overlap, not themes (Berntsen & Hall 2004: 53% external /
27% internal / 20% mixed cues; involuntary pops are *more* specific
episodes, not vaguer ones):

```
scan weights:   sensory/place/people fields  × invol_periph_gain  (≈1.6)
                topic/abstract fields        × invol_topic_pen    (≈0.7)
surfacing bias: ∝ surviving verbatim-field count (specific episodes
                surface; generic/merged records get no involuntary pop)
```

**v2.6 — `intrusion_thresh` is age-flat by rule** (remove it from the
age-knot table): involuntary-memory rates are roughly age-invariant
while voluntary recall declines (Schlagman, Kvavilashvili & Schulz
2007) — age differences in spontaneous recall enter through
`search_breadth`, not the threshold. P246.

**v3.6 — intrusion weight is a decay curve (replaces the flat −0.15
discount):** each episodic record carries `intrude_w` =
`arousal·(1 + trauma_bonus)` (trauma_bonus 1.0 on `trauma:true`) at
birth, decaying `intrude_w *= exp(−Δt/intrude_hl)` per tick —
`intrude_hl` 7d default, 90d on `trauma:true`, ∞ under the `ptsd`
profile modifier (natural history: post-event intrusions decline over
days-to-weeks, persist in PTSD — Holmes & Bourne 2008; Iyadurai et al.
2018/2023; the 2024 preregistered meta, 134 articles). The scan's
surfacing drive per record is `intrude_w·cueMatch_ext` against
`intrusion_thresh` — traumatic records start hot and cool; ordinary
records were never intrusive. The v2.2 arousal re-stamp on each
intrusion is now priced as the persistence loop: a trauma record's
reboost fights a 90-day half-life and approximately wins; a normal
record's doesn't (forgetting-curves.md §17.6). P373.

### 5.8 Retrieval-induced forgetting and part-list cuing

On successful recall of `m`: for each linked/competing record `n` with
simOp(·,·,"sim_rif") > 0.5 that was NOT recalled, `n.strength *= (1 - rif_k)` (rif_k≈0.05).
Retelling a story forgets the details you skipped (R§3).

**Part-list cuing (v0.2):** in `discussEvent`, the speaker's narration IS a
part-list cue for the listener (Roediger 1973; RC§6). Fields the speaker
covered → misinformation merge §6.3 as before; fields the speaker *omitted*
→ `plist_suppress` (≈0.05 strength + one-day retrievability penalty via
temporary θ bump). Effect attenuates for old memories — bounded per Bäuml's
long-delay findings (RC§6). **v0.5:** `trauma:true` records are EXEMPT from
plist_suppress — you cannot talk a character out of parts of a trauma by
narrating the other parts (emotional-memory.md §7).
**v0.8 — socially shared RIF:** the listener's OWN related records that
were not surfaced also take `strength *= (1 − ss_rif_k·listenerAttention)`
(ss_rif_k ≈ 0.04 — slightly weaker than speaker-side rif_k; listeners
co-retrieve covertly only when attending; Cuc, Koppel & Hirst 2007;
autobiographical extension Stone, Barnier, Sutton & Hirst 2010/2013;
social-memory.md §6). Shared silences: a speaker who always tells one
version makes listeners progressively unable to recall what she omits.
Same trauma exemption as plist_suppress.
**v3.7 — the in-group gate (RC§39):** `ss_rif_k ×= ingroup_w(speaker)`
— SS-RIF requires the listener to co-retrieve, and co-retrieval follows
shared identity (Coman & Hirst 2015: in-group speakers suppress,
out-group don't; shared-identity priming restores it). `ingroup_w` =
1.0 when PersonModel[speaker] shows shared group OR credibility ≥
`cred_hi`; `ssrif_out_mult` (≈0.2) for out-group/distrusted tellers.
An outsider's omissions leave your memory alone; a trusted voice's
silences become yours. P384.
**v2.0 — the facilitation switch:** unsurfaced records that are
*integrated* with the surfaced one (same event id or a `links` edge —
not merely cue-similar) flip sign: `strength *= (1 + rif_facil_k)`
(≈0.03) for both speaker and listener (Chan, McDermott & Roediger 2006
— retrieval practice facilitates related material under integrative
encoding; suppression is for competitors, facilitation for
co-members). The switch rule: `links` edge or shared event id →
facilitate; cue-similar but unlinked → suppress as before
(social-memory.md §19).

### 5.9 Reconsolidation on recall

Each retrieval: `lastAccessDay = now`, `retrievalCount++`,
`confidence += 0.03`. **v0.9 — two-strength update replaces the flat
boost** (§4.11; formal-model.md §10):

```
S += s_gain_eff·(1−S)·(1−R_pre)      // difficulty-weighted learning
R ← 1 − (1−R_pre)·(1 − retell_boost·(0.5 + 0.5·S))
                                     // high-S records snap back fully

// v2.6 — retrieval-practice pricing (RC§22):
s_gain_eff = s_gain_recall · (1 + test_gap_gain·log1p(gapDays))
             // recall leg; gapDays = now − lastAccessDay, ≈0.3 —
             // delay-gated advantage (Roediger & Karpicke 2006;
             // Pyc & Rawson 2009 effort hypothesis — the (1−R_pre)
             // term already carries the difficulty direction)
re-exposure leg (hearAccount / being narrated at / re-reading):
s_gain_eff = s_gain_recall · reexp_ratio          // ≈0.35
             // hearing it again is ~a third of digging it up —
             // Rowland 2014 meta g≈0.51 for testing > restudy
```

Massed retellings (R_pre high) barely grow S — retelling a story the
same week doesn't cement it; a hard-won recall after months does.
**And** the record re-enters a mutable state: the *current* context
writes small deltas into it (§6.1). Memory is rewritten on every telling
(R§4).

### 5.10 Person recognition — the cascade (new in v0.8)

When `C` is a person copy cue (a face encountered, a photo) and
`C.targetPerson` resolves, evaluate the `PersonModel` in strict tier
order (Bruce & Young 1986; Burton, Bruce & Johnston 1990;
social-memory.md §1):

```
tier1 familiarity:  roll vs familiar_thresh (0.25) on familiarity
    fail → "stranger" (even if identity/name would have passed —
    cascade is ordered; you can't recall the name of a face you
    don't know)
tier2 identity:     roll vs identity_thresh (0.4) on identityStrength
    fail → return {tier:"familiar_only"} — "I know you from
    somewhere" WITHOUT biography; normal resting state for
    acquaintances, not a TOT (Muter 1978)
tier3 name:         roll vs name_thresh (0.55) on nameStrength
    fail → return identity + tot:true — the feeling-of-knowing
    state; existing §5.5 TOT rules apply (name tier only)
```

- Tier strengths update like records: encounter refreshes
  `lastSeenDay`, boosts the accessed tiers (§5.9 boost applies per tier).
- `oab_loss` applies at tier1 encoding only; `tot_rate` (v0.4) applies
  at tier3 as before — name TOT is the commonest TOT (Burke et al. 1991).
- **`face_ability` (v3.1, individual-differences.md §20):** familiarity
  accrual `×(1 + fam_gain·face_ability)` (0.35) and
  `familiar_thresh −= fam_thresh_off·face_ability` (0.03); tiers 2–3
  take HALF the loading (names are partly a verbal store — Cohen 1990
  asymmetry preserved). NOTHING else in the spec reads this trait —
  face-blind characters remember the encounter fine (P298
  dissociation guard).
- **`name_fan` (v3.1, §27):** tier-3 roll additionally pays
  `name_fan_k·ln(1 + nPersons)` (0.03), nPersons = PersonModels at
  familiarity ≥ familiar_thresh — store-load cost; tiers 1–2 pay
  half. Modeling hypothesis; emergent — same traits, the bartender
  blanks more names than the hermit (P308).
- **Directory mode:** `C.mode == "directory"` ignores the cascade and
  returns candidate persons ranked by `knowsTopics[topic]` strength —
  "I don't know, but Jules would" (transactive memory, §6.14;
  Wegner 1987).
- **Individuation interpolation (v3.2):** trait/eval queries against a
  PersonModel interpolate category prior and learned traits by
  `individuation` — `reported = (1−individuation)·catPrior·cat_prior_pull
  + individuation·traits` (Fiske & Neuberg 1990 continuum; Brewer
  1988). Fresh models answer as the category; `individ_rate` (0.15)
  accrual needs a diagnostic encounter (attention above gate + §2.1
  write). `source_cat_share` (§6.10) scales ×(2−indiv_a−indiv_b)/2
  between two candidates — category confusions are worst between
  unindividuated persons [HYPOTHESIS coupling, direction consensus —
  social-memory.md §40].
- **Bahrick floors (v4.3):** once `exposureCount + encounters` ≥
  `fam_permastore_exp` (50), `familiarity` decays at
  beta_semantic·`fam_permastore_mult` (0.25) — the ~90%-
  recognition-at-15-years plateau (Bahrick, Bahrick & Wittlinger
  1975). The same floor applies to `nameStrength` for tier-3 rolls
  in **recognition mode only** (copy cue present — "is that
  Mara's name?"); free-recall name production keeps the full
  β_source schedule (~60% loss over 48y). The recall/recognition
  split on the name tier IS the reunion signature (P446).
- **Baker-paradox gap (v4.8):** the same phonological token is
  cheaper as semantic content than as a name — tier-3 rolls pay
  `name_sem_gap` (0.08) when the requested content is the name;
  descriptive/identity recall about the same person never pays
  it (McWeeny et al. 1987 homonyms; Cohen 1990 association-
  poverty account). A name that doubles as meaningful content
  (nickname, name-as-trait) pays ×0.3. Independent of `tot_rate`
  — the gap widens the everyday blank window, TOT still gates
  the agonized one (P514).

### 5.11 Reminiscence across attempts (new in v1.3)

Successive recall attempts without re-exposure surface *new* verbatim
fields: on each successful recall, every verbatim field not yet returned
with residual strength > 0 surfaces independently at
`reminiscence_frac` (0.15). Reminiscence (new items on attempt n>1) is
robust; net hypermnesia is NOT required — fields also drop between
attempts via ordinary field-strength decay, matching the eyewitness
pattern (Scrivner & Safer 1988; Dunning & Stern 1994: reminiscence
yes, net gain no; Payne 1987: net gain only for recall-mode, high-
imagery material). RW effect: retelling the story a second time
plausibly adds a detail — while others have quietly fallen out
(forgetting-curves.md §7.3).

**v4.8 — the gap gate (RC§51):** `reminiscence_frac` is
schedule-sensitive:

```
gap < hyper_gap (0.5d) since last bout on the same query:
    reminiscence_frac unchanged — massed retrieval mostly
    re-samples (Roediger & Thorpe 1978 time-on-search null)
gap ≥ hyper_gap: reminiscence_frac ×= hyper_gain (1.5) —
    spaced attempts re-enter the §5.42 hierarchy on a different
    path AND the interim consolidation reshuffled strength;
    verbatim-rich records get the full leg, gist-only ×0.5
    (Erdelyi & Becker 1974 pictures-vs-words)
```

Cumulative yield across spaced bouts CAN now net-gain where the
eyewitness-paradigm version above stays conservative — the two
claims coexist because they answer different questions (P519
locks the metric to cumulative unique fields).

### 5.12 Transfer-appropriate processing — ops gate (new in v1.4)

A cue matches the *processing channel* used at encoding, not just stored
features (Morris, Bransford & Franks 1977; RC§10). Context `C` carries
`C.ops` — the dominant channel of the current processing context
(semantic = topic talk; perceptual = sights/sounds; social = people
focus; enactive = doing the same kind of thing):

```
cueMatch_ext *= (C.ops == m.encodeOps ? 1.0 : tap_mismatch)   // ≈0.55
```

Applied multiplicatively to the whole external match, AFTER the §5.1
gate and §5.2 combination, BEFORE mood/state terms. TAP never zeroes
recall — it reorders which cue wins. `encodeOps` is set at encoding from
the v1.2 `engagement`/elaboration channel (enacted→enactive;
spoken/heard→perceptual default; generated→semantic; social events→
social). Absent → default by source.kind. P127.

### 5.13 Output interference — exhaustive recall self-destructs (new in v1.4)

A multi-item recall bout (`k > 1`, "tell me everything") is NOT k
independent draws (Tulving & Arbuckle; Roediger & Schmidt 1980; RC§11):

```
candidates emitted by §5.22 ratio-rule sampling (v2.6 — replaces the
v1.4 greedy sort; same observable ordering, adds failure-stop and
near-miss commissions)
n-th emitted item: P *= out_int^(n−1)          // ≈0.85 compounding
each emitted item applies §5.8 rif_k to unemitted same-bucket records
```

Two consequences the game reads: interrogation-style exhaustive prompts
return a strong 2–3 details then trail off (cognitive-interview
ordering — free narrative first); and the trailing-off is real
forgetting — what wasn't said is weakened for tomorrow.

### 5.14 Prospective cue ecology — focal vs monitored firing (new in v1.4)

`rememberIntention` records gain `cueType` (`"event"|"time"`, default
event) and `focal` (bool — is the cue the object of the character's
current attention when it appears). On each ambient/tick where the
intention is armed (§4.x `beta_pm` decay unchanged):

```
event + focal:    fires at pm_focal_hit (≈0.9) when the cue appears in C
                  — near-automatic, age-flat (Einstein & McDaniel 1990)
event + nonfocal: fires only on a monitor roll: p = pm_monitor_p
                  · attentionHeadroom · (1 − pm_time_age_loss·ageScale)
time:             no external cue — ambient clock-check draw pm_clock_p
                  per tick, also ×(1 − pm_time_age_loss·ageScale); fires
                  only if the check lands inside the intention window
```

Focality is evaluated by game-systems from the attention budget (cue is
what the character is already doing vs. peripheral). `ageScale` =
age_eff/65 clamped 0..1. Henry et al. 2004 meta: nonfocal and time-based
are age-damaged, focal spared but not immune (P129, P130). RW texture:
"give Jules this when you see him" almost always lands; "call the
landlord at 5" fails exactly in proportion to busy-ness and age.

**v2.6 — the armed state has a price and a ghost (RC§26):**

```
while armed, nonfocal/time intentions only (focal rides the hit rule):
    intention-linked record:   drive += intent_sup          // ≈0.1
        // intention superiority — Goschke & Kuhl 1993; pending
        // errands are hyper-accessible
    all unrelated recalls:     θ += monitor_cost            // ≈0.03
        // per armed nonfocal intention — Smith 2003: remembering
        // to remember taxes the ongoing task
on completion (fire or closeIntention): record stamps completedDay
re-encountering the cue inside the tail:
    p(refire) = pm_commission_p·2^(−Δd/pm_commission_hl)
              ·(1 + 0.5·ageScale)   // ≈0.2 base, hl ≈2d — commission
              // errors (Walser et al. 2012 ~25%; Marsh, Hicks &
              // Bink 1998: completed intentions are INHIBITED below
              // neutral — after the tail the link is suppressed,
              // not merely neutral)
```

A refire is a commission — the act or the reach ("I already gave you
this, didn't I?"), never a fresh recall. P247.

**v3.7 — the retrospective leg (RC§40a):** a successful fire roll runs
a second draw on the intention's ACTION content:

```
p(action recalled | fired) = pm_action_p            // ≈0.9
    · (1 − 0.3·ageScale) · (1 − da_monitor_pen·daLoad)
fail → `pm_vague` flag: urgency without content — high FOK, no plan
    ("I know I was supposed to do something when I saw him…");
    resolves if the action cue arrives within pm_vague_win (≈0.5d);
    unresolved, decays like an ordinary failed recall and can
    TOT-recur via §5.16
```

**v4.8 — implementation intentions (RC§46):** arming may carry
`impl:{cue, action}` — an if-then plan formed at intention-creation
(bible trait `planStyle` gates spontaneous formation; the dialogue
layer may also phrase errands as plans). An impl intention:

```
cue link:   cueBind_init ×= impl_bind_gain          // 1.5
fire:       nonfocal impl rolls against
            pm_monitor_p + impl_focal_lift          // +0.3 — near-
            // focal; the plan pre-loads the cue (Gollwitzer &
            // Sheeran 2006 PM-arm d≈.40, not the headline .65)
monitor:    monitor_cost ×(1 − impl_cost_mult)      // 0.5 — the
            // cue is armed, vigilance unneeded
boundary:   doorway_pen (§5.29) halved — consolidated binding,
            // not held activation
rigidity:   cues NOT in the plan fire at the ordinary nonfocal
            rate — delegation is cue-specific (P513)
whole leg:  × ii_age_gate(age_now) — the v2.8 age gate below
            (Chasteen 2001 rescue at 65–75, fails ≥76)
```

PM success = detecting the cue AND recalling the action (Einstein &
McDaniel multiprocess decomposition); the retrospective leg shares
ordinary recall's age/load deficits while focal detection stays
spared — the classic "stood there knowing I'd come for something"
state is cue detection minus content. P385.

**v2.8 — the PM paradox (age-decline.md §34):**

- `pm_focal_hit` reaffirmed age-FLAT — focal PM is env-supported and
  stays spared (Rendell & Thomson 1999: elders *beat* the young in
  the real week while losing in the lab; cue density is the
  moderator). P263 sign-locks the three arms.
- `pm_habit_gain(age_eff)` — an intention that has fired ≥1 times on
  the same cue class gains `+pm_habit_gain·min(1, fires/5)` on its
  fire roll (knots → 0.35 at 85): repetition makes old routines MORE
  reliable (Rose et al. 2009 — regular/focal tasks improve over the
  week and shed their WM dependence).
- `impl_intent_gain` × `ii_age_gate(age_now)`: 1.0 ≤60 → 1.4 at
  65–75 → 0.8 ≥76 — implementation intentions rescue young-old
  event-based PM (Chasteen, Park & Schwarz 2001, >2× self-initiation;
  Schnitzspahn et al. 2009) but fail the old-old
  (Kretschmer-Trendowicz et al. 2009 — no benefit ≥76, event arm
  impaired). P264.

**v2.7 — the child end (age-development.md §31):** event-based PM is
present by age 4 but interruption-fragile (Kvavilashvili, Messer &
Ebdon 2001 — interruption collapses performance more than age does).
Two knots: `pm_interrupt_mult` (~1.5 at 4–7 → 1.0 by ~12) multiplies
any `locShift`/topic-change penalty on armed intentions for child
characters; `pm_scaffold_gain` (0.2) fires on the intention roll when a
caregiver-tier PersonModel is co-present at cue arrival — the
transactive directory (§6.14) is prospective for children before it is
collaborative for old couples (v1.6). P260 tests all three arms.

### 5.15 Context-scoped extinction — renewal (new in v1.4)

§4.9's `extinct_suppress` was global; Bouton's central finding is that
extinction is a new inhibitory association bound to the context it was
learned in (Bouton 2004; RC§13). Now: each safe exposure in context `ctx`
adds `ctx` to `extinctCtx`; `extinct_suppress` applies ONLY when the
current place ∈ `extinctCtx`. Elsewhere the conditioned entry fires at
`strength · renewal_frac` — i.e. `renewal_frac` (≈0.6) of the
pre-extinction response returns on a context switch (ABA renewal).

`recovery_days`/`recovery_frac` still govern spontaneous recovery inside
an extinctCtx. RW texture: weeks of calm park visits do NOT generalize to
the alley — calm was learned in the park (P131).

### 5.16 Stateful TOTs — resolution cues and error repetition (new in v1.4)

The §5.5 `tot:true` flag becomes stateful via `tot_fields` (schema v1.4):

```
on unresolved TOT on field f:   tot_fields[f]++
next attempt on f:            tot_rate_eff = tot_rate · tot_persist^tot_fields[f]
                              // ≈1.5 — learning to fail (Warriner &
                              // Humphreys 2008: ~2× after long dwell)
resolution cues:   syllable cue ("it starts with 'Mar-…'") resolves at
                   tot_resolve_p ≈ 0.3 → clears tot_fields[f], field fills
                   letter-only cue: tot_resolve_p/3 (Abrams 2007: first-
                   syllable primes resolve; first-letter primes don't)
                   extra semantic description of referent: ≈0
on resolution:     normal §5.9 reboost; tot_fields[f] cleared
recognition cue:   resolves at near-young rates (§5.5 unchanged)
```

**v4.8 — the age gradient (RC§55, Burke et al. 1991):**

```
tot_rate_eff    ×= (1 + tot_age_k·ageScale)      // ≈0.8 — more
                // TOTs, stacked on the tot_persist leg above
tot_resolve_p   ×= (1 − tot_res_age_loss·ageScale)// ≈0.4 — slower
                // resolution, phonological cueing still works
                // (James & Burke 2000)
persistent-alternate interlopers ×= (1 − tot_alt_age_loss·
                ageScale)                        // ≈0.5 — older
                // TOTs are EMPTIER, not wronger (fewer wrong-
                // word intruders — weaker connection, not a
                // stronger competitor)
recent-contact  names (lastSeenDay < 30d) resist the age leg
                ×0.5 — Burke's recently-uncontacted-acquaintance
                clause (P515)
```

A character who blanks on a name at dinner plausibly blanks on the SAME
name next week — error repetition is a property of the failed mapping,
not the item (P132, P133).

### 5.17 Reminding chains — a retrieved record is a cue (new in v1.4)

On a successful recall of `m`, emit a derived context
`C′ = m.cueVector` and run one restricted scan over `m`'s linked records
(`links`, §2 `link_p`), scored at `chain_gain` (≈0.5) × normal drive,
depth capped at 1 — a retrieved memory cues its associates even when the
external context doesn't (RC§15; temporal version already exists as
contiguityTerm — this is the associative version). Reminded records get
the normal §5.9 reboost: being reminded strengthens. Produces the
reminiscence cascade — one character's story pulls the other's related
story up unprompted. `searchCost` of the derived scan is discarded;
depth-2 is a digression, not memory (P134).

### 5.18 Sleep-context cuing — TMR analog (new in v1.4)

During the nightly consolidation tick (§4.6), records sharing a salient
`sensory` cue with the SLEEP context get an extra `tmr_gain` (≈0.12) on
the consolidation boost — declarative only, procedural exempt, and ONLY
if the cue was encoded on the record (Rasch et al. 2007: odor absent at
learning → zero effect; REM/wake presentation → zero effect). Ties the
§5.1 gate into consolidation: where you sleep votes on what survives
(P135 — direction SHOULD, magnitude OBSERVE; design extrapolation,
RC§19).

### 5.19 Off-target verbosity — inhibition loss at emission (new in v1.5)

During a `recall` bout (k>1) or a `retell`, each emitted item after the
first has probability `offtarget_p(age_eff)` of being supplemented or
replaced by a *weakly-related* live record — one sharing a person or
era tag with the emitted item and with drive ≥ 0.2·θ (activated but
irrelevant to the query). Knots: 0.01 at 20 → 0.03 at 50 → 0.15 at 80;
mildly elevated below age 10 (same inhibition immaturity, other end).
Emitted off-target records receive the normal §5.9 reboost — rambling
rehearses the tangent. Grounded in the off-target-verbosity literature
(Arbuckle & Gold 1993: OTV is predicted by working-memory
deletion/restraint failures, not by talkativeness; Hasher & Zacks 1988
inhibition framework). DEBATED component: Trunk & Abrams 2009 argue
OTV is partly communicative style — the profile layer may therefore
raise `offtarget_p` at any age for loquacious characters; the age
slope is the deficit, the intercept is the personality
(age-development.md §14; P139 measures emission rate only).

### 5.20 Latent reinstatement — the compound-sensory route (new in v1.5)

The single exception to §4.14 invisibility: when a cue context
simultaneously matches ≥2 `sensory` cueVector fields AND the `place`
field of a `latent` record (the Travaglia et al. 2016 requirement —
reminder must combine context AND salient reinstatement; partial
reminders do nothing), roll `latent_recall_p` (0.08). On success the
record returns as a Reconstruction with `latent_returned: true`:
source kind absent, confidence floored at 0.3, verbatim mostly empty —
a fragment, not a scene; its missing fields are maximal §5.5
confabulation surface. A successful return clears `latent` and writes
`lastAccessDay` — the reinstated fragment re-enters the normal economy
(now rehearseable, now distortable). Single-cue contexts, word cues,
and `tell-me-about` prompts can NEVER reach latent records — the
childhood-home-scene cue pattern is the only door (P136 sign-locks the
cue requirement).

### 5.21 Metamemory instruments — FOK and JOL (new in v2.1)

The character's sense of its own memory, computed from retrieval
*products*, never from the trace itself (Koriat's accessibility model,
Koriat 1993; Koriat & Levy-Sadot 2001). Full grounding and rationale:
formal-model.md §19.

**Feeling-of-knowing** — computed on recall failure and TOT returns:

```
partialScore = (# verbatim fields above candStrength floor)/(# encoded)
fok = logistic(k_fok·(a_cue·cueMatch_ext + a_part·partialScore
      + a_fam·familiarity(targetPerson) − θ_fok)) + N(0, fok_noise)
episodic records, older characters: fok += N(0, fok_age_noise·age_eff/70)
   — episodic-only sensitivity loss (Souchay et al. 2000; meta g=0.53
     episodic / ~0 semantic, Sacher et al. 2023); semantic FOK intact
```

`fok` is returned on the Reconstruction (hidden — it steers dialogue
and effort, it is not content). `fok > fok_retry` (0.6) triggers one
follow-up scan at `search_breadth/2` — fragments beget digging. FOK is
accuracy-blind BY DESIGN: confabulated and phantom records produce high
fok (P194 sign-locks the dissociation — an oracle that tracks
correctness is not a feeling).

**Judgment-of-learning** — `encodeEvent` stamps hidden `jol`:

```
jol = logistic(k_jol·(E + jol_fluency·fluencyNow − θ_jol)),
fluencyNow = attention·(1 − lapse)
```

The `jol_fluency` term is the immediate-JOL bias: still-warm fluent
content feels learned even when E is low — immediate JOL gamma ≈ .45
vs .93 delayed (Nelson & Dunlosky 1991; Rhodes & Castel 2008 meta
g = 0.93). On the first retrieval/ecology fire past 1 day, the
delayed product (`drive_achieved`) feeds the SelfModel via `metamem_r`.
`jol` modulates `strategy_use` (v1.0): low jol × high stakes (open
loop, intention) → write-it-down/ask-someone behavior. Per-character
`jol_bias` offsets the intercept — the chronic under/over-estimator.

### 5.22 Competitive emission — the ratio rule (new in v2.6)

Bout emission (§5.13) and the §5.7 ambient scan's competition use
SAM-style sampling, not a greedy sort (Raaijmakers & Shiffrin 1980/81;
Gillund & Shiffrin 1984; RC§21):

```
P(sample i) = drive'_i^sam_tau / Σ_j∈bucket drive'_j^sam_tau  // ≈τ 2
each sample: emit at §5.4 P(recall); a sampled-but-failed draw
    counts toward the failure stop
stop after kmax consecutive failed samples (≈3) or lmax total
    samples (lmax = search_breadth — reuse, frozen)
```

Competitors sharing the cue lower P(target) by construction — cue
overload is emergent competition; the §5.4 log-fan divisor stays as
the cheap approximation inside single-shot scoring (they measure the
same phenomenon at two grains — do not stack them by computing fan
over the post-sampling set). High-drive near-misses get sampled —
wrong-but-strong retrievals need no extra machinery. P242.

### 5.23 Suppression-induced inhibition — the cue-independent leg (new in v2.6)

§4.12 `suppressEvent` is cue-side avoidance (θ bump against that cue).
When suppression happens with the record's cue actually IN the active
context — a real no-think bout — the record itself accrues a
cue-independent decrement (Anderson & Green 2001: independent-probe
impairment ⇒ trace-level inhibition; ~8–9% below baseline after 16
bouts; DEBATED robustness — Bulevich et al. 2006 failures — adopted
bounded and small; RC§24):

```
on suppressEvent where the suppressed record's cue was present in C:
    inhib += tnt_inhib          // ≈0.02 per bout, cap tnt_cap ≈0.2
retrieval:   P computed on R_eff = R − inhib   // before cue scoring —
             // every cue loses equally (the independent-probe
             // signature); emotional/trauma records accrue ×0.3
```

Cue-side steering (§4.12) makes THIS cue fail; trace-side inhibition
makes the MEMORY weaker however probed. Never deletion, never §6.19
repression — effortful, cue-present, bounded. P245 sign-locks both
properties. `inhib` is hidden, snapshot-additive.

### 5.24 Ease-of-retrieval inversion — more recalled, less believed (new in v2.6)

Aggregate-judgment calls (`judgeFrequency`, `judgeTrait` — the
dialogue layer's "does this happen a lot?" / "am I the kind of person
who…?" reads, already fed by `searchCost`) invert past the ease point
(Schwarz et al. 1991: six assertive acts recalled easily → higher
self-rated assertiveness than twelve recalled with effort; RC§28):

```
emitted < ease_n (≈4):   judgedFreq ∝ emitted count
emitted ≥ ease_n:        judgedFreq ∝ 1/searchCost at stall
    // a stalling long bout reads "there isn't much" even though more
    // items came back — experience beats enumeration
```

P249 is the falsifier: judgedFreq(k=4) > judgedFreq(k=10) on
stall-prone topics — a decreasing judgment from an increasing count.
Nothing else in the model produces that signature.

### 5.25 Retrieval latency — a decay observable (new in v3.6)

Retrieval TIME follows the same power family as retrieval probability
(Anderson 1982; Nelson & Narens 1980 latency-metamemory covariance).
`recall` attaches `latency_ms` to each Reconstruction:

```
latency_ms = min(lat_cap,
    lat_base · R^(−lat_pow) · (1 + lat_search·n_sim/10))
lat_base 400ms, lat_pow 0.6, lat_search 0.4, lat_cap 5000ms
```

`n_sim` prices bucket crowding — searching a dense cue pool is slow,
not just uncertain (the 40th-commute problem in real time).
`latency_ms ≥ lat_cap` surfaces as a §5.16 TOT/hesitation event rather
than a silent null — the TOT machinery gains an arrival-time surface.
v4.2: the whole expression scales by `search_cost_mult` — the
`pspeed` trait's ONLY target (Salthouse 1996 mediation — speed moves
the clock, never the hit-rate; explicit null, P443).
Dialogue layer consumes latency for beat-level hesitations
("…give me a second"); validation uses it as a second, independent
observable channel on R. Display/validation only — latency must never
feed back into θ or strength. P374.
**v3.7:** `latency_ms ×= (1 + lat_da_mult·cueContext.daLoad)` — the
retrieval-time DA tax lives here, not in accuracy (RC§34).
**v3.9:** `latency_ms ×= lat_age_mult(age_eff)` — knots 1.0 ≤50 →
1.3 at 70 → 1.6 at 85 (Salthouse speed; AD§57). Display only —
latency still never feeds θ.

**v4.9 — child knots (AD§56):** the same curve's low flank:
1.4 at 6 → 1.2 at 10 → 1.0 at 16 (Kail 1991; Kail & Salthouse
1994 — one exponential speed function fits childhood→adult).
Children's truncated recall IS the slow search, not different
storage. Display-only rule unchanged.

### 5.26 Forward testing — remembering primes learning (new in v3.7)

A successful voluntary recall bout stamps `postRecallDay` on the
character. For `fwd_win` (≈0.05 day — the same scene, the next
conversation):

```
new encodings:  E ×= (1 + fwd_test_gain)            // ≈0.12
n_sim pool:     the incoming record's bucket counts ×fwd_pi_release
                (≈0.5) for this encoding's similarity/interference
                math — retrieval resets the competitive pool like
                a miniature §4.18 transition
re-exposure bouts (hearAccount, ambient scan): NO window — the
                benefit belongs to retrieval, not re-presentation
                (Szpunar, McDermott & Roediger 2008 Exp. 3; Chan,
                Manley, Davis & Szpunar 2018 meta — RC§37)
```

Reminiscence warms the encoder: a character who just dug up old
stories lays down the next hour more cleanly, and the old material
interferes with it less. P382.

### 5.27 Mood repair — retrieval as regulation (new in v3.7)

On a voluntary recall bout while `C.mood < repair_mood_bar` (−0.2)
has held across the bout's span, roll `repair_p` (trait — ≈0.5
nondysphoric; ≈0.05 under the depressive/ruminative modifier or an
active rumination state — Joormann & Siemer 2004):

```
repair mode:  the §5.3 moodCongruence sign flips —
              positive-valence records gain repair_gain (≈0.15)
              drive against the mood match
feedback:     each emitted positive record adds repair_mood_gain
              (≈0.05, cumulative ≤0.2) to C.mood — the recall works
failed roll:  ordinary congruent selection — the consecutive-
              negatives pattern (Josephson, Singer & Salovey 1996;
              Rusting & DeHart 2000 — RC§36)
```

`repair_p` is a personality dial — the bible decides whether this
character self-soothes with memory at all. P381.

### 5.28 Familiarity without a source — scene-level déjà vu (new in v3.7)

When a voluntary recall bout emits nothing, compute `famScore` =
max over all live records of configural overlap (place + people +
sensory fields jointly — a global-matching familiarity signal, not
the §5.1-gated cue match). If `famScore ≥ fam_bar` (≈0.45), emit a
`familiar_only` Reconstruction — no content fields, confidence ≤0.3,
flagged by the top match's nature (Cleary & Greene 2000; Cleary et
al. 2012 configural VR result — RC§38):

- `sourceless: true` — top match is a real record that failed
  retrieval. "I've definitely had this conversation…" The trace is
  there; the door is closed.
- `deja: true` — top match is a *similar-but-different* record.
  Genuine déjà vu: a false familiarity the character cannot place.
  Surface flag only; feeds §6 misattribution surface; `deja_prop`
  (≈0.3, declining with age_eff/80 — Brown 2003/2004) gates whether
  the experience reaches awareness at all.

Distinct from §5.10's person-cascade `familiar_only` (same return
shape, different trigger — this one is scene/context-level and
requires a FAILED bout). Never fires with content; a familiar_only
return that later resolves re-enters normal scoring. P383.
**v4.7:** records carrying visual-`mod` fields hold `fam_w` ≥
`vis_fam_floor` (0.1) while live — the Standing bound (1970/1973:
~90% picture recognition at 10k items for days); visual recallable
detail still dies on `k_vis`, what survives is recognition. P504.

### 5.29 The doorway — boundary crossing sheds cues (new in v3.7)

On a `locShift` location boundary (existing event flag; Radvansky,
Krawietz & Tamplin 2011 — walking through doorways measurably
impairs recall of carried objects and armed intentions — RC§40b):

```
active context C:  peripheral cueVector fields (non-attended)
                   drop at boundary_cue_drop ≈0.4 — the old room's
                   cue set is re-segmented away
armed intentions:  nonfocal/time fire rolls ×(1 − doorway_pen)
                   (≈0.2) inside post_boundary_win ≈0.02 day
shallow records:   live records with R < 0.5 and age < 1h take a
                   one-time boundary_hit ≈0.05 R decrement
exempt:            focal-armed intentions and self-origin cue
                   fields — what you're looking at and what you
                   named yourself survive the doorway
```

"Walked into the kitchen and lost the errand" — unless the errand
was rehearsed out loud or was what you were already doing. P386.

### 5.30 interviewMode — the cognitive interview as a contract (new in v3.7)

Contract-level guidance, no new machinery — each step reuses
validated operators (Fisher & Geiselman 1992; Köhnken et al. 1999
meta: correct d=0.87, errors d=0.28, accuracy 85% vs 82%; Memon,
Meissner & Fraser 2010 — larger benefit for older witnesses).
`interviewMode(charId, eventRef)` recommended sequence:

```
1. reinstate:  inject event place/sensory fields into C at
               mental_reinstate weight; set C.ops = m.encodeOps —
               kills the §5.12 TAP tax by matching channels
2. free pass:  bout k≥5 with NO supplied cue fields — self-origin
               retrieval at selfcue_mult (§5.2); interviewer cues
               would only compete AND part-list-suppress (§5.8)
3. vary:       flip contiguity_asym (backward recount), rotate
               C.ops — each channel change re-sorts the drive
               ranking and reaches what pass 1 couldn't
4. delayed second pass: §5.11 reminiscence leg applies
```

Acceptance shape (P387): ≥20% more correct fields than direct
exhaustive questioning at accuracy rate within ±3%; larger margin
for older characters. The worst interrogation is §5.13's own
finding — cued exhaustion self-destructs.

### 5.31 Isolation at retrieval — the oddball goes first (new in v3.7)

`isolated` (§2, v1.2) gains a retrieval life (Hunt & McDaniel 1993
distinctiveness principle — difference pays at access, RC§42):

- **Singleton bucket:** an isolated record's cue key is its own —
  `fan(m)` = 0 by construction (immune to §5.4's log-fan divisor).
  Two isolates sharing a cue key collapse the privilege — two
  oddities in one room stop being odd.
- **Bout-first privilege:** `iso_first` (≈0.1) drive bonus on the
  first emission of a voluntary bout — oddities lead stories
  ("you'll never guess what happened").
- Retrieval-side only: no strength bonus, no decay relief. A buried
  oddity dies like anything else; it just never waits in line. P388.

### 5.32 Forced-pick identification — the refusal channel (new in v3.8)

`identifyFromSet(charId, candidates, {mode})` — recognition over a
choice set (AD§39; Pozzulo & Lindsay 1998 meta; Fitzgerald & Price
2015 lifespan meta, 91 studies). Target-present discrimination is
adult-like by ~5 (children hit fine); the developmental variable is
REFUSAL:

- Under `mode:"forced"` or any coercive choice set, when no
  candidate clears θ the argmax is emitted anyway with probability
  `choose_p(age_now)`: .85@5 → .7@8 → .55@13 → .3@25 → .55@70 →
  .7@85 — U-shaped; adolescents still can't decline.
- Sequential candidate order ×=`seq_choose_gain` (1.3) below 13 —
  sign-locked OPPOSITE the adult sequential advantage.
- Single-candidate showups ×=`showup_mult` (1.5) — the worst case.
- Under `mode:"free"` the §5.10 cascade runs unchanged.
- A picked record carries `forced_pick:true` internally —
  downstream `sourceInfer` reads it as low-credibility, but
  reported confidence is NOT reduced: children choose confidently.
  Identification practice does NOT rescue correct rejection (the
  meta's null) — no training flag exists by design.

P393.

### 5.33 Intention deactivation — the finished errand keeps firing (new in v3.9)

Scullin, Bugg, McDaniel & Einstein 2011 (Mem Cogn 39:1232): aging
leaves spontaneous retrieval intact but impairs *deactivation* of
completed intentions (AD§51). After an intention record completes,
for `deact_window` ≈ 7 game-days a matching cue still rolls the
§5.14 fire test at scaled probability:

```
comm_err_p = (1 − pm_deactivate(age_eff))·cueMatch
             · (1 + min(fires,5)·comm_habit_gain)
pm_deactivate: 0.95 ≤50 → 0.85 at 70 → 0.7 at 85
comm_habit_gain ≈ 0.1 — repeated performance raises commission
  risk for OLD only (Scullin, Bugg & McDaniel 2012, Psychol Aging
  27:46, ~25% commission errors; 4-target > 0-target in old)
```

A commission fire emits `commission:true` — the action starts and
is catchable by dialogue ("I already paid the rent… didn't I?");
uncaught, it re-executes (stamps bought twice). Each *resisted*
commission multiplies `pm_deactivate` ×1.15 within the window —
`deact_practice_gain` (Walser et al. 2015: forgetting practice
floors commission errors in both ages). The §34 cue-richness that
rescues old PM is exactly what refuses to switch off — same arm,
opposite sign. P401 sign-locks the age×repetition crossover.

### 5.34 Episodic future simulation — old plans are thin plans (new in v3.9)

`imagineEvent` (§6.9) ages like recall (Addis, Wong & Schacter 2008,
Psychol Sci 19:33 — the internal-detail deficit extends forward;
Addis et al. 2010 recombination paradigm — it's a recombination
deficit, not pure recasting):

- `sim_detail_mult(age_eff)` — 1.0 ≤50 → 0.8 at 70 → 0.65 at 85 —
  scales the verbatim-field count a simulated record is minted
  with. Old futures are skeletal: the plan, not the particulars.
- `recast_p(age_eff)` — 0.1 ≤50 → 0.25 at 70 → 0.4 at 85 —
  probability the simulation is a decorated copy of ONE existing
  record (same place/people, new `when`) rather than recombined
  parts; inherits source verbatim at `sim_detail_mult` richness.
- Emergent: imagination inflation shrinks for elders — thin
  simulations inflate less. Env-supported simulation (detail cues
  supplied) rescues part of the deficit (Addis et al. 2011) — ride
  the existing `env_support_gain`, no new term.

P400.

### 5.35 The implicit channel — fluency outlives recall (new in v3.9)

Records gain `impl_str` (minted 1.0; decays at
`β_impl = beta_episodic·impl_decay_mult`, impl_decay_mult = 0.5;
NEVER gated by θ). It is report-free and does three things:

1. §5.22 emission ordering — among near-tied drives, higher
   `impl_str` wins.
2. §5.28 `famScore` input — contributes `impl_fam_w` (0.4)·impl_str.
3. Re-encoding savings — re-exp on a record with impl_str ≥ 0.5
   gains `impl_reexp_gain` (0.1) on E (Ebbinghaus savings channel).

Aging: `implicit_decline(age_eff)` — 1.0 ≤50 → 1.15 at 70 → 1.3 at
85 — multiplies impl_decay_mult: a real but small decline sized
~0.3× the explicit one (La Voie & Light 1994 meta, 39 effects,
d≈0.30 vs several-times-larger explicit effects; Ward et al. 2020
lifespan — deficit survives contamination controls, noted DEBATED).
P399 tests the ratio, not the null.

### 5.36 Own-age bias — discriminability, not criterion (new in v3.9)

§5.10 person cascade: when the target's `ageBand` (floor(age/15))
matches the recognizer's, familiarity AND identity tier rolls get
`+own_age_gain` (0.15) and the false-alarm term gets `−own_age_gain`.
Criterion/θ untouched — Rhodes & Anastasi 2012 meta (Psych Bull
138:146): hits g=+0.23, FA g=−0.23, d′ g=+0.37, criterion g=−0.01
(null). NOT reserve-shifted — contact/expertise, follows exposure
history. P403 fails any criterion-shaped implementation.

### 5.37 The jukebox cue — music-evoked recall (new in v4.0)

Cue vectors gain a `music` key: `c_music = cue_music_w · overlap ·
(1 + music_era_gain·era_match)` — cue_music_w ≈ 0.35 (below the
odor channel's pricing, above `w_when`), `music_era_gain` ≈ 1.5 when
the cue song falls inside the character's bump window
(`encodeAge`-indexed era tag, world supplies `era_song:true` on the
cue). Janata, Tomic & Rakowski 2007 (Memory 15:845): ~30% of
familiar excerpts evoked autobiographical memories, predominantly
positive, nostalgia the third most common emotion. Channels differ
in *what they index*: odor reaches age (deeper into childhood —
§29/RC§3), music reaches era (densest in the bump). On era-matched
hits with valence>0.3 the emission may carry `nostalgic:true`
(report-layer flag; §34 `nostalgia_gain` supplies the mood effect).
The ambient scan treats `c_music` like `c_sensory` — involuntary.
P420.

### 5.38 Depletion release — suppression is effortful (new in v4.2)

Negative attach-tagged records under `attach_avoid` carry a theta
surcharge `avoid_suppress` (§6.52) that is *maintained* — not
passive forgetting but active exclusion (Mikulincer & Orbach 1995;
Kohn, Rholes & Schmeichel 2012: under self-regulatory depletion the
suppression fails and accessibility rises). When `context.depleted`
(or cueContext.stress ≥ stress_thresh) is set, the surcharge decays
`theta_surcharge ×(1 − depl_release·attach_avoid)` and intrusion
drive on those records gains a matching +depl_release·avoid fraction
— the buried grief surfaces when tired. The same `depleted` budget
is drawn by §6.53's suppression tax: characters who spend a day
keeping a straight face lose the vault key by evening. Ego-depletion
the resource model is DEBATED (Hagger et al. 2016 replication) —
we model the measured accessibility phenomenon, not the glucose.
P436.

### 5.39 Observer perspective — where the rememberer stands (new in v4.2)

Reconstructions carry `persp:"field"|"observer"`, sampled at
emission:
`P(observer) = clamp(0.10 + 0.15·persp_obs + persp_age_gain·log(1 +
recordAge/365) + 0.20·selfDiscrepant + 0.15·depr·[valence>0] +
0.10·attach_avoid·[attach:true & valence<0], 0, 0.95)`
— record age and self-discrepancy push observer (Nigro & Neisser
1983: older and high-self-awareness events go observer; Libby &
Eibach 2002: self-incompatible actions); the depr term is valence-
asymmetric *positive-only* (Nelis et al. 2012 — dysphorics observe
the good memories, a dampening signature). Observer emissions report
`arousal −persp_affect_loss` (0.2 — Robinson & Swanson 1993:
field→observer shifts damp experienced affect) and drop ~half their
sensory-field details while gaining evaluative self-visible phrasing
("I can see myself…"). **Report-layer only**: stored fields are
unchanged; later drift runs through ordinary operators. Guided
reinstatement (`interviewMode`, §5.30) may pass `context.persp:
"field"` to pull emission back toward field — that pull IS the
instruction's mechanism. P437/P438.

### 5.40 orderRecall — order is reconstructed, never stored (new in v4.7)

Temporal order is the fastest-dying relational information
(forgetting-curves.md §22.3; Underwood 1977; Friedman 1993/2004 — order
is *inferred* from distance impressions, landmarks, and scripts, not
retrieved). No record stores an orderable timestamp for the character;
`createdDay` is ground truth for the ledger only. Order claims in
dialogue must route through:

```
orderRecall(charId, a, b):
    t̂_i = reconstructed encodeDay of i (existing when-drift machinery)
    σ_pair = order_sigma·(1 + order_decay·mean(1−R_a, 1−R_b))
        // order_sigma 0.35, order_decay 1.5 — decayed pairs blur
        // toward chance while both contents stay live
    same-period AND same-day pair → P = order_script_p (0.5) directed
        by the event-type script prior — atypical orders are
        systematically REVERSED, not merely noised
    else → P(correct) = Φ((t̂_b − t̂_a)/σ_pair)
```

Emergent: "did she quit before or after the lease fight?" is a
schema-shaped coin flip at distance even with both memories live.
P506 requires the dissociation — content intact, order lost.

### 5.41 Enactment — the motor self-cue (new in v4.8)

Records with `enactive` in `encodeOps` carry a self-origin motor
channel (RC§48; Cohen 1981; Engelkamp & Zimmer 1984; Roberts et
al. 2022 meta — planning is the primary contributor, movement
secondary):

```
sparse-cue conditions (cueMatch_ext < selfinit_bar):
    score the motor field at w_sensory·enact_selfcue (1.3),
    origin = self for the §33 selfcue_mult leg — enacted events
    are self-cuing, less cue-hungry than verbal ones (Nilsson
    2000 nonstrategic account)
reenactment at retrieval (C.ops == enactive, action matches):
    drive × enact_recall_gain (1.15) — reenactment effect,
    Kormi-Nouri 1995
boundary: motor channel is immune to §5.29 boundary_cue_drop —
    the cue walks through the doorway with you (P516)
```

### 5.42 Generative vs direct retrieval — the search has an entry floor (new in v4.8)

Voluntary `recall` chooses a route by cue strength (RC§49;
Conway & Pleydell-Pearce 2000; Haque & Conway 2001):

```
drive_max over scored candidates:
    ≥ gen_direct_bar (0.7):   DIRECT — emit immediately,
        latency_min; the strong-cue path, no descent
    < gen_direct_bar:         GENERATIVE — first emit the best
        period/generic node (§4.18 period or §4.20 script node,
        or the record's gist field), then a descent roll per
        level at hier_descent_p (0.6); each level adds latency
        and re-scores with the period's fields folded into C
    descent stall → emit the generic + `vague:true` — "that
        summer we had the roach problem" is an output, not a
        failure
hier_descent_p ×= (1 − 0.3·ageScale) — older characters stall
    one level up: period answers where episodes exist (the §27
    self-initiation deficit, one mechanism down)
ambient scan / involuntary: always direct — §5.7 unchanged
```

Reconstructions carry `retrievalMode:"direct"|"generative"`.
P517 locks the ordering: broad cue → period first, episode
after; strong cue → episode immediately.

### 5.43 Life-script cues — the cultural index (new in v4.8)

Event records may carry `milestone:true` (transitional firsts —
moves, weddings, births, graduations; world/bible tag). On
period-scoped or life-story queries (`C.period` set, or the
§6.34 narrative-self path):

```
milestone records:  drive += lifecue_gain (0.12)
    ×(1 + 0.5·valence+)   // positive-skewed — the script
                          // maintains positive transitions,
                          // not negative (Berntsen & Rubin
                          // 2004; Rubin & Berntsen 2003)
encodeAge in bump window: multiplicative with bump_beta_mult —
    the script supplies the cue, the bump supplies strength
non-milestone records: no bonus; fan grows as milestones crowd
    the bucket (P518)
```

### 5.44–5.45 — reserved (none; cross-cueing lives at §6.69,
hypermnesia amended §5.11)

### 5.46 Pharmacological state-dependence — the dissociative leg (new in v4.8)

Records gain `encodePhys` — the pharmacological-state bucket at
encoding (`sober|intoxicated|sleepdep|caffeinated` — coarse, reuse
§2 intox flags). At retrieval (RC§53; Goodwin et al. 1969; Eich
1980 compendium; Weingartner et al. 1976):

```
voluntary RECALL only, m.encodePhys == C.phys:
    w_j += sdr_gain (0.08)·(1 − cueMatch_external)
         ·(1 − 0.5·richness)
    // Eich erasure: external cues outshine state; Weingartner:
    // rich records don't need the state leg
recognition mode: sdr_gain = 0 — locked null (Goodwin's
    recognition arm showed nothing)
mismatch: no penalty (unlike sensory_mismatch_pen — the
    literature shows null, not negative)
```

### 5.47 Arousal narrowing at retrieval (new in v4.8)

When `C.arousal ≥ arousal_cue_hi` (0.7) during a voluntary bout
(RC§54; Easterbrook 1959 cue-utilization; Christianson 1992;
Mather & Sutherland 2011 ABC — retrieval-side HYPOTHESIS):

```
peripheral/weak fields contribute ×(1 − arousal_cue_narrow)
    // 0.6 — place, peripheral people, uncued detail
central fields (gist, topic, self-origin): unaffected
dominant competitor: top-drive item ×(1 + arousal_dom_gain)
    // 0.1 — arousal amplifies the leader (ABC)
content unchanged — this taxes the CUE SET, not the record;
    the same record recalls fully under calm cues (P522)
```

### 5.48 Directed forgetting — the soft flag (new in v4.8)

Records gain `df:true` when the character is instructed or
motivated to forget (RC§56; Bjork 1970; MacLeod 1998; Golding &
MacLeod 1998 — rehearsal-starvation version, NOT active
inhibition):

```
voluntary recall on sparse cues (cueMatch_ext < selfinit_bar):
    θ += df_pen (0.06)
rich cues or recognition mode: df_pen ×0.3 — the flag yields
    to any real cue (reversible by construction)
rehearsal channels quieted: retell/reminiscence selection
    ×(1 − df_rehearse_pen)  // 0.6 — the mechanism IS the
    // starvation; a df record that does get retrieved runs
    // normal §5.9 and rejoins the ecology
emotional/trauma records resist ×0.3 (same resistance as §24);
df never archives or deletes by itself
```

Distinct from §5.23 `inhib`: TNT accrues a cue-independent
deficit; df shows NO deficit under rich cueing (P523 sign-locks
the dissociation).

### 5.49 Divided attention — hits at encode, latency at retrieve (new in v5.0)

Craik, Govoni, Naveh-Benjamin & Anderson 1996 (JEP:G 125:159 —
verified) + Anderson, Craik & Naveh-Benjamin 1998 (Psychol Aging
13:405 — verified): DA at encoding costs memory in both ages
(more in old: `da_enc_tax` 1.0→1.3@80 multiplies att deficit);
DA at retrieval costs NOT accuracy but secondary-task capacity —
in the model: `latency_ms *= da_ret_tax(age_eff)` graded by mode
(free recall ×1.6@80 > cued ×1.3 > recognition ×1.15) plus
`da_ret_spill` on whatever concurrent machinery runs. **Locked
null: DA at retrieval never raises miss rate at any age** (P536
sign-lock).

### 5.50 RIF's two-regime tail (new in v5.0)

Aslan & Bäuml 2012 (Psychol Aging 27:1027 — verified): RIF intact
in young-old (60–75), inefficient in old-old (>75); Ortega et al.
2012: dividing attention kills RIF with a LIGHTER secondary task
in old — implemented universally: `rif_k *= rif_age_tail(age_eff)
· (1 − 0.5·C.da)` — rif_age_tail 1.0≤72 → 0.5@80 → 0.2@88;
`da_rif_weak` applies at ALL ages. All rif_k consumers (§5.23
SS-RIF, §6.69 jointRecall) read the post-multiplier value.
Parallel DF pivot (~75, listwise) noted — §5.48's df legs adopt
the same tail on their θ penalty (AD§69).

### 5.51 The quiet mind — wandering declines, thoughts go stimulus-bound (new in v5.0)

Maillet & Schacter 2016 (Neuropsychologia 80:142 + Psychol Aging
meta — verified): MW and IAM frequency decline with age; within
the reduced total, share shifts stimulus-dependent. `ambientMemoryScan`
tick rate `*= mw_decline(age_eff)` (1.0≤50 → 0.75@70 → 0.55@85);
`sdt_share(age_eff)` (0.5→0.8@80) is the required fraction of
emissions tracing to a present-stimulus cue — below it,
train-of-thought chaining is refused (`sdt_min_cue`, frozen).
Intrusive-trauma channel exempt; spontaneous PM keeps §34
machinery. Resolves the §42 tension: cue→memory fidelity intact,
self-seeded trigger rate down (P540).

### 5.52 Testing needs feedback at old age (new in v5.0)

Tse, Balota & Roediger 2010 (Psychol Aging — verified crossover):
without feedback, older adults benefit MORE from restudy than
retesting on arbitrary bindings; with feedback, testing wins
again. `retell_boost` and the §5.26 forward-testing legs pay
full gain only when a correctness signal exists (correction,
verification, record agreement) — requirement probability
`test_fb_req(age_eff)` (0.2@55 → 0.5@70 → 0.8@85); absent the
signal, legs pay `test_nofb_mult` (0.55@75 → 0.3@85) and §6.58
confidence inflation applies unopposed. Schedule-shape
invariance locked: expanded>equal spacing holds at both ages
(Balota et al. 2006).

### 5.53 The dream draw samples the hot queue (new in v5.1)

Supersedes §4.24's "world/story supplies salience" clause. The
night's Poisson(dream_mint) dream records now sample the character's
OWN live episodic store: weight ∝ `dream_emo_w`·arousal·recency +
(1−`dream_emo_w`)·strength (`dream_emo_w` 0.6 — mostly the hot
queue plus an old-strong tail; Valli et al. 2008: current dream
threats resemble PAST real threats). Valence draw ∝
(1 − `dream_neg_bias`·valence), `dream_neg_bias` 0.15 — verified
real bias, not sampling artifact; ×2 when mean mood < 0 (Pesant &
Zadra 2006 longitudinal). Everything else in §4.24 unchanged —
wake-gated recall, tau_dream, dream_cond_mult residue. [CONSENSUS
draw; magnitudes HYPOTHESIS; P548]

### 5.54 Self-conscious retrieval asymmetry — shame avoids, guilt rehearses (new in v5.1)

Records tagged `emotion:"shame"`/`"guilt"` (minted on valence<0,
self-caused, selfRelevance-high events; tag gated below ~6/4 years —
Tracy & Robins 2004). Shame (Tangney; D'Argembeau-group *Memory*
2023 — verified observer-perspective signature): voluntary recall
p ×(1−`shame_avoid_k` 0.35), `intrusion_thresh` −`shame_intrude_k`
0.15 (avoided AND intrusive), Reconstructions emit
`perspective:"observer"` at ~2× base rate, discussEvent routes to
deflection unless trust>0.7. Guilt: rumin-style rehearsal boost
`guilt_rehearse_k` 0.3, and each rehearsal increments the
`amends_urge` counter the behavior layer reads — guilt replays
toward repair, shame toward hiding (P549).

### 5.55 Forgiveness thaws the loop (new in v5.1)

McCullough, Bono & Root 2007 (JPSP 92:490 — verified cross-lag:
rumination→unforgiveness direction stronger). RelEdge gains
`forgive` ∈[0,1] (world/behavior layer drives it). For negative
records whose cueVector.people contains the dyad partner:
rehearsal/intrusion probability ×(1 − `forgive`·`forgive_rumin_k`
0.7) — the LOOP starves; strength/decay/tag clocks unchanged.
Feedback: each unforgiven rehearsal nudges forgive −0.02; each
completed amends (§5.54) +0.1 — both directions modeled, weighted
per the cross-lags (P550 direction lock).

### 5.56 Nostalgia self-medicates (new in v5.1)

Wildschut et al. 2006 (JPSP 91:975) + Routledge et al. 2011 (JPSP
101:638 — verified): distress triggers nostalgia; nostalgic recall
restores mood/meaning/connectedness. `ambientMemoryScan` gains a
regulation term — when C.mood < −0.2, draw weight of
`nostalgic:true` OR positive + old (>180d) + people-rich records
×(1 + `nostalgia_trigger_k`·|C.mood|) (0.3). On nostalgic emission:
`C.mood += nostalgia_lift·(1−|C.mood|)` (0.15 — real nudge,
self-limiting; §34's recall→mood feedback specialized to the
documented valence route). Emitted tag stays bittersweet ("mixed" —
the literature's signature; P551).

---

## 6. Distortion — the operators that make characters wrong

### 6.1 Reconsolidation drift

On each retrieval, each verbatim field mutates with probability
`drift_p` (param ~0.08, higher under stress/low confidence). **v0.5 —
valence-conditioned drift** (emotional-memory.md §3):
`drift_p_eff = drift_p·neg_fidelity` (0.85) for valence < −0.3 records —
negative events keep veridical detail (Kensinger & Schacter 2006;
Kensinger 2007) — and `drift_p·pos_gist_drift` (1.15) for valence > 0.3 —
positive memories drift toward gist.
- detail swapped toward schema-typical value ("espresso" → "coffee"),
- `accuracy -= drift_k` (0.02),
- gist never mutates on a single recall, drifts slowly via gist-shift (§6.4).

### 6.2 Confabulation fill

When reconstructing with missing verbatim fields (decayed): fill from the
character's schema for the event type + their beliefs. Each filled field
lowers `accuracy` by 0.03 but **raises confidence by 0.02** (fluency, R§4) —
the better the story flows, the surer they feel. **v0.5:** positive-valence
records (>0.3) confabulate at `confab_fill·pos_gist_drift` — positive
affect recruits conceptual/gist processing (Storbeck & Clore 2005;
emotional-memory.md §3).

### 6.3 Misinformation merge (rumor interface) — calibrated in v0.6

When character hears an account of an event they have a memory of:
```
if simOp(myMemory, heardAccount, "sim_misinfo") > 0.4:
    for each conflicting detail field:
        p_adopt = misinfo_suscept · sourceCredibility
                · (1 − fieldStrength)              // v0.6: per-field
                                                   // verbatim survival —
                                                   // weak traces absorb,
                                                   // strong resist
                · (1 + rep_gain·log1p(hearCount))  // fluency; capped rep_cap
                · (warned ? warn_mult : 1)         // post-warning ≈halves
                                                   // (Blank meta, FM§1)
                · (disputed ? dispute_mult : 1)    // ~0.05 — live dispute
                                                   // blocks (Wade 2018)
                · (sleepdep_flag ? sleepdep_misinfo_gain : 1)  // Frenda 2014
                // v3.1: acute intox.kind=="cannabis" adds
                // cann_misinfo_gain·intox to misinfo_suscept
                // upstream; state expires with the window —
                // sober-heard accounts never inherit it (Kloft
                // 2020 1-week null). hearAccount{negativeFeedback:
                // true} invokes the §23 Shift path: reported-field
                // flip at misinfo_suscept·1.5 + confidence loss
                // suggs_shift·suggs — report-side override, the
                // stored record's beliefStatus does not move
                // (GSS Shift ≠ Yield — report outruns belief).
                · (neg_core_resist if valence<−0.3 & arousal>0.6 core field)
                                                   // v0.5, kept
                · (contradicts known semantic (strength ≥ know_protect_thresh)
                   ? (age_eff ≥ know_protect_age ? know_protect_mult : 1)
                   : 1)                             // v1.5: stored knowledge
                                                   // protects OLDER adults —
                                                   // young neglect it
                                                   // (Brashier 2017 vs Fazio 2015)
        if rand < p_adopt: v1.8 — WRITE A COMPETING CANDIDATE, never
                           overwrite (coexistence, not destruction —
                           McCloskey & Zaragoza 1985; Lindsay & Johnson
                           1989; false-memory.md §13):
            field.candidates.push({value: heard, candStrength:
                cand_base_str·sourceCredibility
                ·(1 + rep_gain·log1p(hearCount)),
                provenance:"told_by:"+speakerId, day: worldDay})
            // the original candidate is untouched and keeps its own
            // decayed strength; field retrieval samples ∝ candStrength —
            // fluent misinformation wins most of the time, faded
            // originals can resurface on delay (Tousignant 1986
            // fluctuation/reversion). accuracy -= 0.15 hidden, as before.
            // losing candidates eat §5.13 out_int / §5.8 plist_suppress
            // when the winner is rehearsed — retrieving the adopted
            // version suppresses the surviving original (Shaw, Bjork &
            // Handal 1995 — misinformation entrenches via retrieval)
    hearCount++ on the rumor-content hash (shared across speakers —
        source VARIABILITY adds nothing; only repetition count matters,
        Paterson-line meta k=8; false-memory.md §1)
    heardAccount may merge into myMemory.source ("told_by" contamination)
```

**v1.8 — additional p_adopt moderators (false-memory.md §§20–21):**
```
p_adopt additionally:
  · (1 + neg_gist_gain) if account valence < −0.3
      // negative CONTENT foments distortion via gist — Bookbinder &
      // Brainerd 2016 content-context paradox (§6.17 note: this is
      // the CONTENT half; negative encode-MOOD protects, §2)
  · (prewarned ? prewarn_mult : 1)     // ~0.7 — warned BEFORE exposure
      // helps but less than post-warning (Greene et al. 1982)
  · (worldDay < inoc_until ? inoc_mult : 1)  // ~0.75 — generalized
      // inoculation after being burned; refutational-different works
      // ≈ same (Banas & Rains 2010), decays ~14d (inoc_days)
```
**v3.0 — reactivation susceptibility (false-memory.md §31):**
```
p_adopt additionally, PER FIELD:
  · (worldDay − lastRecallDay(field) < react_window
     ? react_suscept_mult : 1)   // ~0.5d window, ~1.3 boost —
                                // recalling an event OPENS it to
                                // misinformation (Chan, Thomas &
                                // Bulevich 2009 reversed testing
                                // effect; DEBATED vs interim-test
                                // protection — retrieval-restricted
                                // version implemented: only fields
                                // that surfaced in that recall are
                                // labile). AGE-FLAT (found in both
                                // younger and older adults)
```

**v3.0 — negated accounts (false-memory.md §30, §6.29):** an account
may carry `negated:true` (a denial — "it wasn't him", "that never
happened"). It writes the AFFIRMED content as a candidate at
`neg_cand` strength, tagged `frame:"denied"`; the frame decays at
`beta_source·neg_frame_mult` and once dead the affirmed candidate
reads as affirmed (denials backfire at delay — Skurnik et al. 2005).
Repeated denials compound hearCount like any account — repetition
plants, it does not scrub. See §6.29.
**Hearsay carries heat (v1.7):** a `told_by` record's affect tag is
`arousal = source_arousal · contagion_k · speaker_express ·
(0.5 + 0.5·empathy_trait)` — contagion_k≈0.5 (secondhand is half as
hot), `speaker_express ∈ [0.5,1.5]` from the telling's delivery,
`empathy_trait` bible-set; `valence` adopts the account's sign
(Rimé 2009 social sharing; Hatfield et al. 1993 contagion; Peters &
Kashima 2015). A high-arousal hearsay record CAN cross `cond_thresh`
— vicarious conditioning mints dread of places never personally
feared (Olsson & Phelps 2007; emotional-memory.md §20).

This is THE rumor-propagation hook: a rumor is a `beliefStatus:"rumor"` record
that can contaminate witnessed memories it resembles. (R§6 misinformation
effect — the most replicated result in memory science; 2025 meta
g=0.735 across 480 studies — see false-memory.md §1 for moderator
calibration.)

**Two distortion channels, opposite age gradients (v0.3):**
`misinfo_suscept` is the *suggestion* channel — U-shaped over the lifespan
(high in children, low in adults, high again in the old). `confab_fill` is
the *gist* channel — monotonic rise from childhood into old age, because
meaning-connection machinery strengthens with development (Brainerd &
Reyna developmental reversal; Koutstaal & Schacter 1997). Do not couple the
two params — they must be free to diverge (age-development.md §4, P19).

**v3.8 — repetition sign-split below `taint_exit` (AD§40):** for
records with encodeAge < 9, repetition is routed by content. If
`simOp(account.fields, record.fields) > 0.8` (neutral re-interview):
`child_consol_gain` applies AND `misinfo_suscept_eff` on that record
×=`neutral_inoc` per exposure (Goodman et al. 1991 — practice
inoculates). If fields conflict (suggestive): `p_adopt *=
suggest_repeat_mult` per successive conflicting account of the same
event (compounding, not additive), ×=`stereo_prime` if the
PersonModel schema of speaker/target matches the suggested valence;
on adoption, subsequent retells write `embellish` fields at
`embellish_p` — false child memories accrue perceptual detail
(Leichtman & Ceci 1995: 46% free / 72% probe).

### 6.4 Source-tag decay and gist abstraction

`source.confidenceInSource` decays at β_source (fast, ~2× episodic gist rate).
When it drops below 0.3: "I heard somewhere…" — content persists, attribution
gone. When gist is retrieved ≥ gist_abs_thresh (≈4) times, optionally spawn a
**semantic record** ("Mara is stingy") — episode becomes trait belief. This is
how episodic events crystallize into the belief-vs-fact layer (R§6, R§9).

### 6.5 Social convergence

When two characters discuss a shared event, run misinformation merge **both
ways** with asymmetric susceptibility — the pair drifts toward a shared
(possibly false) version (social contagion, R§6). **v0.6 calibration:**
adoption is near-total only where the listener holds NO verbatim on the
contested field (Gabbert et al. 2003: 71% adoption on uniquely-seen
items; Wright et al. 2000: 79% conformity). Fields with surviving
verbatim resist at `fieldStrength` (§6.3). If the listener's
reconstruction surfaced a conflicting field and the dialogue layer
registers live disagreement, mark the account `disputed` — adoption for
that field drops to `dispute_mult` this round (Wade et al. 2018
multilab: co-witness errors concentrated in undisputed reports).
Relative power between speakers enters through `sourceCredibility`
(Carol et al. 2013).

**v3.0 — dyads conform harder than groups (false-memory.md §33):**
adoption `p_adopt` on the contested field ×= `group_damp`
^(max(0, groupSize−2)) — each discussant beyond the second damps
per-source uptake (~0.75 each; Dalton & Daneman 2006: one-on-one
acceptance 68% vs group 49% — more witnesses mean more latent
disagreement and diffused credibility). `groupSize` comes from the
dialogue layer; default 2 (no damping — backward compatible).

### 6.6 Corrections and the continued-influence effect (new in v0.6)

A `correction` account (`account.type == "correction"`, trusted source
asserting the earlier content was false) never deletes or overwrites the
field — misinformation once encoded keeps influencing inference even
when the retraction is itself remembered (Johnson & Seifert 1994; Ecker
et al. 2010/2011; false-memory.md §2):

```
retract_p = correction_strength · sourceCredibility_trust
            // trustworthiness gates, NOT expertise — low-trust
            // retractions are entirely ineffective (Ecker & Antonio 2021)
            // default ≈0.6 for a trusted corrector
            // ×1.2 if the correction repeats the original content
            // (reminder corrections work BETTER — Ecker et al. 2017)
if rand < retract_p: record.retracted = true, beliefStatus → "doubted"
either way: retracted fields keep feeding gist reconstruction and
    §6.4 trait abstraction at weight cie_residual (≈0.3) — the
    correction is known; the misinformation still leaks
```

### 6.7 Believe vs recollect — nonbelieved memories (new in v0.6)

`beliefStatus` is a discretization of a derived pair evaluated at
retrieval (Scoboria et al. 2014; Otgaar, Scoboria & Mazzoni 2014;
Rubin, Schrauf & Greenberg 2003; false-memory.md §7):

```
recollect_q = verbatimStrength·(1 + sensoryRichness)      // reliving
believe_p   = w_plaus·plausibility
              + w_corr·corroboration·(1 + know_corr_gain·know_density)
              + w_fluency·fluency(retrievalCount + hearCount)
beliefStatus: >0.8 fact · 0.45–0.8 belief · 0.2–0.45 rumor ·
              <0.2 doubted (regardless of recollect_q)
```

- **Nonbelieved memory** = high recollect_q + believe_p < 0.2 — vivid,
  disbelieved ("I can see it, but it can't have happened"; ~20% of
  adults hold one, Mazzoni et al. 2010). Trauma records after a trusted
  correction can land here.
- **Believed-not-remembered** = high believe_p + ~zero recollect_q —
  fluent corroborated hearsay ("everyone says the fire was arson") —
  the natural state of a `told_by` record with high hearCount.
- **v2.8 — the knowledge shield (age-decline.md §37):** `know_density`
  = share of the claim's topic tags covered by the character's own
  semantic records at strength ≥ `know_protect_thresh` (§6.3 reuse).
  `know_corr_gain` ≈ 0.5 grows on old-side knots — elders check
  repeated claims against a lifetime's store and reject them on home
  turf while remaining fluency-vulnerable off it (Brashier, Umanath,
  Cabeza & Marsh 2017: older adults rely on KNOWLEDGE in the face of
  fluency — the Fazio et al. 2015 knowledge-neglect direction
  *inverts* with age; `rep_gain` stays age-flat — the fluency channel
  itself doesn't weaken). P268 requires both arms.
- **v3.3 — cache discipline + truth-default (formal-model.md §28):**
  the stored `beliefStatus` is a write-time **cache** of the derived
  pair, consulted by cheap paths (retell selection, rumor tagging);
  any op mutating believe_p inputs marks `bs_stale` and the status
  recomputes lazily on next read. Transitions clear a boundary only
  by `belief_hyst` (no recall-to-recall flicker); `"doubted"` written
  by §6.6 retraction is sticky for `doubt_persist` days, then the
  record re-enters normal derivation. Untriggered `told_by` fields
  adopt at baseline `truth_default_w` — Levine (2014) truth-default:
  doubt requires a trigger; the §6.3 moderator stack IS the trigger
  list. `fact` is never written directly — only the derivation
  grants it.

### 6.8 Phantom / gist-lure records (new in v0.6)

The model can invent records, not just corrupt them — DRM mechanism
(Deese 1959; Roediger & McDermott 1995: 40–55% false recall, false-alarm
recognition ≈ hit rate; fuzzy-trace theory, Reyna & Brainerd 1995:
verbatim suppresses falsity, gist supports it; false-memory.md §4):

```
During reconstruction of m (§5.5), for a schema-typical lure
field/episode converged on by ≥ phantom_fan_min (≈4) linked records:
P(phantomize) = gist_lure_gain (≈0.3) · confab_fill · gistStrength
              · (1 − verbatimStrength)      // FTT suppression
              · discrim_mult                // age: separation deficit
              · (valence<0 ? neg_fidelity : pos_gist_drift)
field-level: write schema-typical detail into verbatim
             (accuracy→0 on that field, confidence += 0.02 fluency)
episode-level (rare, cap phantom_p ≈ 0.02 per recall — v1.6: age
             knots 0.02 → 0.05 at 80, gist_lure_gain 0.3 → 0.5 at 80;
             Balota et al. 1999; Tun et al. 1998; age-decline.md §25):
             mint a phantom record — accuracy=0 hidden,
             source.kind:"self", verbatim schema-generated,
             phantom:true; decays and reconsolidates normally,
             gets sleep_gist_boost at the daily tick (§4.6)
```

### 6.9 Imagination inflation — imagineEvent (new in v0.6)

Daydreams, rehearsed lies, what-ifs, and guided probing write
`source.kind:"imagined"` records that can later be misattributed as real
(Garry et al. 1996; Loftus & Pickrell 1995 → Murphy et al. 2023: ~35%
report planted childhood events; Brewin & Andrews 2017: ~47% some
recollective experience, ~15% full memory; false-memory.md §5):

```
imagineEvent(charId, scenario):
  plaus = plausibility(scenario, char)     // schema fit + world model
  if plaus < plaus_min (0.35):             // Pezdek/Scoboria gate —
        refresh as fantasy only; can NEVER flip to witnessed
  else: create/update imagined record: encodingE ~0.25·plaus, verbatim
        schema-generated, source.kind:"imagined"
  per call: strength += imagine_gain·(1−strength) (~0.15);
        confidence += 0.05
  source flip (reality-monitoring failure, Johnson & Raye 1981): when
        source.confidenceInSource decays <0.3 (§6.4) AND verbatim
        richness > rm_rich_thresh (0.5), flip source.kind to
        "witnessed" with prob source_confuse_flip (≈0.15/check)
```

**v1.8 extensions (false-memory.md §§14–16):**

- `claim:true` — a deliberate false assertion (lie, cover story,
  brag). Written as source.kind:"claimed" with BOTH `gen_gain` and
  `prod_gain` (generated AND spoken — telling beats planning,
  Otgaar-lab 2018); flip prob becomes `source_confuse_flip·
  (1 + fab_inflate)` scaled by `discrim_mult` (Polage 2012: source-
  monitoring ability IS the moderator; ~10–16% inflation tail,
  Polage 2004). Listeners who echo the claim back count toward its
  corroboration term in §6.7 believe_p.
- `evidence:"photo"|"video"|"artifact"` — perceptual evidence:
  `plaus_eff = plaus + evid_boost·(1−plaus)` replaces plaus at the
  gate (evidence bends plausibility but cannot force plaus_min-
  impossible content to flip — Pezdek gate holds); record born with
  verbatim richness ≥ rm_rich_thresh (a seen image supplies the
  perceptual detail the flip gate demands — Wade et al. 2002: 50%
  implantation via doctored photo) and confidence += 0.1.
- `answerProbe(charId, question)` — forced answering where the
  record lacks the asked field (interrogation, gossip pressure):
  emits a `confabulated` candidate at `forced_confab_gain·
  (suggested ? other_gen_gain : 1)·(1 + press_gain·repeatCount)`
  (Ackil & Zaragoza 1998 — known fabrications become memories in
  ~1 week, children > adults via child_internal_confuse; Pezdek,
  Sperry & Owens 2007 — suggested answers outlast self-generated
  ones). Under `disputed` or a hostile audience the candidate is
  tagged `coerced:true` — performed, not believed; internalization
  still requires the flip gate, reached faster by `distrust`-trait
  characters (Gudjonsson memory-distrust → Kassin 2008
  coerced-internalized confessions).

### 6.10 Source monitoring is inference (new in v0.6)

Replaces the "attribution gone" dead end in §6.4 (Johnson, Hashtroudi &
Lindsay 1993 — source attribution is a retrieval-time inference;
false-memory.md §6):

```
sourceInfer(m): if source.confidenceInSource < 0.3:
  external-external: with prob source_confuse (≈0.1, ·discrim_mult for
      age), reassign source.who to the most cue-overlapping plausible
      source s: P(s) ∝ simOp(m.source.cueContext, s, "sim_source")·credibility(s)
      — and confidence += 0.02 (a filled source reads better than blank)
      v0.8: weight candidates by social category — ~source_cat_share
      (0.65) of external confusions land on candidates sharing
      categoryTags with the true source (Taylor et al. 1978 "who said
      what": within-category errors dominate); if categoryTags absent,
      fall back to cue overlap alone
  internal-external: source.kind "imagined"→"witnessed" per §6.9 flip
      rule (gate on verbatim richness, not confidence)
  external-internal (v1.8, cryptomnesia — Brown & Murphy 1989 ~10%):
      when SELF-GENERATING content (retell as own idea, propose a
      plan), a decayed-source told_by record with matching content
      emits as own with prob crypto_p (0.08) — source cleared to
      "self", not reassigned; ×discrim_mult with age, ×1.3 when the
      true source spoke recently (proximity inversion — the rare
      case where recent beats remote)
```

**v1.5 channel asymmetry:** the two confusion routes have opposite age
profiles (age-development.md §19): `source_confuse_flip` (internal —
imagined↔witnessed) is multiplied by `child_internal_confuse` (2.0)
below ~age 9 — children over-confuse their own thoughts and deeds
(Foley & Johnson 1985; Foley, Johnson & Raye 1983); `source_confuse`
(external — wrong speaker/channel) rides the existing old-side knots
(~1.8× at 75 — Henkel, Johnson & De Leonardis 1998). Same failure
umbrella, opposite channel by age; P144 checks the split.

**v2.8 — imagined-vs-done (age-decline.md §38):** when source
resolution pits a self-action record against an
intention/simulation record (`imagined`, armed intention, or
`imagineEvent` product) with similarity ≥ `interf_thresh`, flip
`imagined→did` with `p = rm_self_confuse(age_eff)·sim` (knots 0.03
≤50 → 0.18 at 85); `did→imagined` at half rate. Henkel et al. 1998:
the misattribution is similarity-gated — old adults confuse only
what resembles the real thing. Powers the absent-mindedness beat
("did I lock the door, or just decide to?") and feeds verify-mode
checks (`check_conf_loss` economy).

### 6.11 Audience tuning — saying is believing (new in v0.8)

On `retell(charId, audienceId, record)`: if the speaker trusts the
audience's judgment — `PersonModel[audience].credibility ·
ingroup_factor > shared_reality_gate` (0.5) — the speaker's OWN record
drifts toward the version told (Higgins & Rholes 1978; shared-reality
gating per Echterhoff, Higgins & Groll 2005; robust in the 2025
Figueroa-Grenett meta, diminished for out-group/identity-threat):

```
m.emotional.valence += audience_tune (≈0.06)
                       · sign(audienceStance − m.valence)
verbatim fields consistent with audienceStance get +0.5·audience_tune
                       survival on the next §6.1 drift roll
```

Cumulative across retellings — the habitual spin becomes the memory.
No tuning to distrusted audiences: compliance is performance, not
memory. Requires the dialogue layer to supply `audienceStance`; absent
stance → no-op (social-memory.md §5).

**v4.0 deepening (emotional-memory.md §41):** the gate's trust read
is *epistemic* — use the social-judgment facet of
`PersonModel[aud].credibility`, not domain expertise (Echterhoff,
Higgins & Groll 2005: mediated by trust in the audience's judgment
about people, persisting ≥2 weeks). **Status inversion:** when
`audience.status > speaker.status` (world-supplied), multiply
`audience_tune` by `aud_status_mult` ≈ 0.3 — tuning the message for
a superior is performance; the peer audience is who rewrites the
memory (Echterhoff et al. 2017: memory bias for equal-status, not
higher-status, audiences). **Arousal co-drift:** evaluation
*intensity* tunes too —
`m.emotional.arousal += aud_tune_arous·audience_tune·
sign(toldArousal − m.arousal)`, aud_tune_arous ≈ 0.5.

**v1.6 — destination memory:** the record carries a hidden `toldTo:
{personId: day}` map, written on every retell. Before emitting, the
audience check succeeds with probability `dest_mem(age_eff)` (knots
0.9 young → 0.55 at 85 — Gopie & MacLeod 2009; El Haj, Fasotti &
Allain 2012). On a MISS the retell proceeds and emits
`alreadyTold: true` (the dialogue layer may play the listener's
"you told me" beat or let it slide). Misses dominate — old
characters repeat stories to the same listener far more than they
wrongly withhold (age-decline.md §20).

**v3.2 — toldTo as a decaying edge:** the flat `dest_mem` roll is
refined into per-edge strength: each `toldTo` entry decays at
`beta_source·dest_decay_mult` (1.5; ×(1+0.5·age_eff/60)) — the
destination is the weakest slot in the episode, weaker than
ordinary source (Gopie & MacLeod 2009; social-memory.md §35).
`dest_mem(age_eff)` remains the fallback when no edge record exists;
`dest_fa` (0.05, riding `lure_accept` knots) is the rare false
"already told" — withholding to the wrong person. Three decay rates
now coexist on one utterance: content, source, destination.

**v3.2 — novelty-gated field selection:** `retell` field selection
reads the audience's ledgers — `P(field selected) ∝ salience ·
(shared_with ∌ field ? novel_pick_w (3.0) : 1) · (toldTo ∌
(record,field) ? novel_pick_w : told_pen (0.5))` — audience design
on the speaker's own, documented-as-wrong, bookkeeping (Clark
common ground; §6.21/§35 errors included — repeat stories AND
unheard omissions both emerge). social-memory.md §42.

**v1.7 — verbal dampening:** on retell with an audience,
`m.emotional.arousal *= (1 − verbal_dampen)` (≈0.05 per telling;
valence untouched; `trauma:true` exempt — §7's re-stamping owns
traumatic affect). §4.13 solo retell-ecology draws (no audienceId)
do NOT dampen — disclosure is interpersonal; rumination stays hot
(Lieberman et al. 2007 affect labeling; Pennebaker disclosure;
emotional-memory.md §16).

### 6.12 Serial reproduction — rumor chains converge (new in v0.8)

When a `told_by` record is retold onward, apply transmission operators
(Bartlett 1932; Allport & Postman 1947 leveling/sharpening/assimilation;
Kashima 2000: stereotype-inconsistent items favored at early chain
positions, consistent items dominate by ~position 4; Lyons & Kashima
2003 — convergence stronger when the audience is believed to share the
stereotype; social-memory.md §4):

```
chainPos = 1 + speaker's hearCount for this content (or explicit hop)
per verbatim field transmitted:
  P(survive) = (1 − level_frac)                 // leveling, ≈0.3
             · (about a person ? social_transmit_gain : 1)  // ≈1.15,
               // gossip travels better (Mesoudi et al. 2006)
             · (schemaConsistent ? 1
                : si_dropoff · exp(−chainPos/chain_sc_thresh))
               // si_dropoff 0.75, chain_sc_thresh 4 — the crossover
gist pulled assimilation_gain (≈0.05) toward speaker schema per hop
// v3.2 — phrasing lineage (social-memory.md §43): verbatim fields
// may carry `phrasing` (surface-token hash from the dialogue layer);
// per hop it survives at phrase_surv_base (0.7)·(distinctive ?
// phrase_distinct_mult (1.4) : 1)·exp(−chainPos/5) — surviving
// idiosyncratic wording is a rumor-lineage marker the history
// browser can expose (Pickering & Garrod 2004 alignment +
// Bartlett conventionalization)
```

The §2 incongruity bonus makes odd details survive hop 1; §6.12's
consistency pull removes them by hop 4 — both effects are real, at
different stages. Gossip networks produce short, stereotyped,
confidently-wrong versions for free.

### 6.13 Collaborative remembering (new in v0.8, optional wrapper)

`groupRecall(members, C)`: group output ≈ `nominal · collab_factor`
where `collab_factor = collab_base (0.65) · (1 − collab_size_pen·(n−2))
· (acquainted ? collab_friend_mult (1.2) : 1)` — collaborative
inhibition, robust across 64 studies (Marion & Thorley 2016; retrieval-
strategy disruption, Basden et al. 1997). Post-collab benefit: each
member's recalled items get a normal retell boost, and SS-RIF (§5.8)
applies to members' unspoken related records. Use for explicit group-
reconstruction scenes; individual recall is unchanged.

**v1.6 — intimate-pair compensation:** when a member's PersonModel of
the partner shows high familiarity AND high credibility (a long-term
couple), waive `collab_size_pen` for that dyad and add
`collab_partner_gain(age_eff)` (0 young → 0.25 at 85) to that member's
factor — old couples can recall MORE together than alone (collaborative
facilitation: Harris et al. 2011; Barnier et al. 2014 — internal-detail
gain was older-couples-only). Stranger pairs keep inhibition
(age-decline.md §26).

### 6.14 Learned credibility and the transactive directory (new in v0.8)

- **Credibility is a memory, not a score.** `PersonModel[X].credibility`
  (init 0.5, prior shifted by the `distrust` trait) updates `±cred_step`
  (0.08, clamp [0.1, 0.95]) whenever X's `told_by` content is later
  corroborated or contradicted by witnessed evidence — selective trust
  is learned from reliability history (Koenig & Harris 2005).
  §6.3/§6.10 read `credibility(X)` from the model; absent a model,
  default 0.5 (backward-compatible with the old scalar input).
  Status/power may bias the prior (Carol et al. 2013), never the update.
- **Directory learning:** when X successfully supplies information on
  topic T (or demonstrates T-expertise), strengthen
  `PersonModel[X].knowsTopics[T]`; failed referrals decrement. Serves
  the §5.10 `"directory"` retrieval mode — "who would know" is itself
  remembered (Wegner 1987; Wegner, Erber & Raymond 1991 couples).
- **Transactive loss (v2.0):** recall on a topic directory-listed to
  a partner who is now unavailable (dead/moved/estranged — world layer
  supplies `available:false` on the PersonModel) takes
  `θ += transact_loss` (≈0.12) on the records the partner would have
  supplied — the directory survives while its referent is unreachable;
  pointer-rot as grief (Harris, Barnier, Sutton & Keil 2014; magnitude
  HYPOTHESIS — social-memory.md §27). `collab_partner_gain` (v1.6) is
  the positive mirror.
- **Disclosure trust loop (v3.2):** a `tell`/`retell` of a record
  carrying `confidential:true` or `selfRelevance>0.6` updates BOTH
  PersonModels — listener's model[speaker]: `eval += disclose_eval_gain
  (0.08)`, `credibility += disclose_trust_gain·0.5`; speaker's
  model[listener]: `eval += disclose_eval_gain`, `credibility +=
  disclose_trust_gain (0.10)` — the three Collins & Miller 1994
  disclosure–liking effects as two writes; gives `shared_reality_gate`
  and `sourceCredibility` a formation mechanism, not just a
  verification update (social-memory.md §39).

### 6.15 Temporal localization — dateEstimate (v0.9 deepening)

Dating is reconstruction, not readout (Friedman 1993; formal-model.md
§11). `verbatim.when` is the fastest-decaying field; when it dies,
dating falls to telescoping + schema rounding + landmark anchoring:

```
true_age     = now − m.createdDay                          // hidden
reported_age = true_age·(1 − tele_k_eff)                   // forward
               telescoping for remote events
             + (true_age < tele_cross ?
                tele_back·(tele_cross − true_age) : 0)     // small
               backward telescoping for recent ones
             + N(0, date_sigma·ctx_loss·sqrt(true_age + 1))
               // v1.6: context fields decay faster than content
               // (Spencer & Raz 1995 meta) — ctx_loss knots 1.0 ≤50
               // → 1.5 at 85; same multiplier on verbatim where/
               // source-confidence decay channels (age-decline.md §21)
tele_k_eff   = tele_k·(1 − landmark_gain) if m.links reaches a dated
               landmark record (arousal ≥ landmark_arousal);
               sigma likewise ×= (1 − landmark_gain)
             · (1 + tele_age_gain·age_eff/80)        // v1.5: forward
               telescoping is age-graded (Janssen et al. 2006) —
               old characters push remote events more recent
if verbatim.when alive → error ×0.2 (near-veridical)
if verbatim.when dead, with prob round_p: snap to nearest of
   {7, 30, 90, 365}; only a fuzzy era tag survives → report its
   centroid (category adjustment, Huttenlocher et al. 1990/2000)
// v2.7 — life-script prior (age-development.md §30): transition-class
// records (world tags them — marriage, first job, first child,
// moving out) get reported_age pulled toward the character's
// script_age table entry with weight script_date_pull (0.3);
// events that occurred off-script (>±10y from script_age) instead
// carry date_sigma ×1.3 — the schema that helps date the normal
// cases hurts the exceptions (Berntsen & Rubin 2004; Bohn &
// Berntsen 2011). A character with no script_age table gets flat
// priors — graceful default.
```

(Janssen, Chessa & Murre 2006 — sign and crossover; Huttenlocher,
Hedges & Bradburn 1990 — rounding; Brown, Rips & Shevell 1985; Shum
1998 — landmarks.) Exact constants HYPOTHESIS; see P79–P81.

**v3.8 — dating without a timeline (AD§42):** below `date_loc_exit`
(8, phasing in over ~2y), the location pipeline above is OFF — no
telescoping formula (children don't have enough past to telescope),
no landmark anchor, no script pull. `dateEstimate` returns a
`cyclic_date` bucket {time_of_day, season, routine_anchor} correct
at `cyclic_acc` (0.7) — "in the morning, when it was cold" — and any
absolute `reportedDay` draws `date_sigma × child_date_mult` (4.0).
`orderBefore` is UNAFFECTED — recency/ordering rides trace-strength
distance sense, present by age 4 (Friedman 1991; Friedman & Kemp
1998): a 6-year-old knows which was longer ago and cannot say when
either was.

`orderBefore(m,n)` survives date loss: ordering rides the S gradient —
`P(correct) = logistic(k_order·(S_n − S_m)·sgn(createdDay_n −
createdDay_m))`, k_order ≈ 4 [pop]. Same-week pairs coin-flip; distant
pairs order correctly while both dates are wrong.

**v4.9 — query-side landmarks + the child postdate + earliest as
output (AD§§54–55):**

- `anchor_query_gain` (0.4): when a recall context supplies a
  `public_scale ≥ 1` or milestone/`chapter` record as temporal
  bound ("since the fire"), post-bound candidates get
  `date_sigma ×= (1 − anchor_query_gain)` — the query-side twin of
  `landmark_gain` (Loftus & Marburger 1983: bounding the question
  with a dated landmark cut forward telescoping; personal
  landmarks work as well as public).
- `earliest_tele_gain` (1.5): `earliest_candidate` records carry
  forward-telescoping ×1.5 when retrieval age < 12 — children
  systematically postdate their earliest memories at retest
  (Wang & Peterson 2014). Sign-locked: forward only.
- `earliest` is an OUTPUT, never a field: `recall("earliest")`
  scores `earliest_candidate` records by (encodeAge asc, S desc).
  Below `earliest_stab` (9, phasing ±1.5y) the top-3 are sampled
  per query — young children's "earliest" is re-derived each time
  and comes out different (Peterson, Warren & Short 2011); above,
  ordinary S dynamics make the winner sticky.

**v4.0 — subjective temporal distance (emotional-memory.md §46):**
a *report-layer* transform alongside `reported_age` — how far the
event FEELS, decoupled from the decay clock (t_eff untouched):

```
subjDist = reported_age · (1 + tdist_val·(−valence_tag)·(0.5 + self_est))
           // tdist_val ≈ 0.3; only if selfRelevance ≥ 0.4, else ×1;
           // acquaintance-topic records: ×1 (null boundary)
```

Negative self-relevant pasts feel farther; positive ones feel like
yesterday; the bias is *stronger at high self-esteem* (Ross & Wilson
2002, 3 studies, randomized assignment — motivational, not mnemonic:
rehearsal/ease didn't mediate). Feeds the §6.34 narrative-self layer
and any "how long ago does that feel" dialogue surface. P415 locks
the personal-only boundary.

### 6.16 Hindsight — learnOutcome (v0.9 deepening)

When the world resolves an open question, memory for prior expectations
assimilates toward the outcome (Fischhoff 1975; Fischhoff & Beyth 1975
creeping determinism; metas Christensen-Szalanski & Willham 1991,
Guilbault et al. 2004; formal-model.md §12):

```
learnOutcome(charId, eventRef, outcome):
  surprise = |outcome − prior_expectation|
  if surprise > hindsight_max_surprise (0.7):
      no assimilation — encode the shock itself ("I never saw it
      coming"); unbelievable outcomes resist hindsight
      (Blank & Nestler 2007)
  else for each record on eventRef (overlap ≥ 0.4, createdDay <
       outcomeDay, beliefStatus ∈ {fact, belief, rumor}):
      prior_field += hindsight_k·(outcome − prior_field)
      confidence  += hindsight_conf_gain
      accuracy    −= hindsight_k·|outcome − prior_field|   // hidden
```

Applies to `told_by` prediction records too — post-outcome gossip
("everyone saw it coming") is a distortion product, amplified further
by §6.11 audience tuning on retell.

### 6.17 Consistency pull — the past assimilates to the present self (new in v1.8)

Distinct from hindsight (§6.16 — predictions toward known outcomes):
reconstruction of evaluative/attitudinal/decision fields drifts toward
the character's **current** self-model under an assumed-stability
theory (Ross 1989 implicit theories — [CONSENSUS]).

```
on reconstruct of m with evaluative/decision fields:
  candidate write: value pulled consist_pull (0.15) toward current
      attitude A per reconstruction — cumulative: a changed mind
      rewrites history ("I always knew he was no good")
  choice records: when believedChoice ≠ stored choice, positive-
      feature candidates on the BELIEVED option gain
      choice_support_gain (0.15) candStrength and emit at higher
      vividness; believed-rejected attract negative features
      (Henkel & Mather 2007 — the bias follows belief, not truth;
      misinforming which option was chosen yields full choice-
      supportive memory for the false choice)
      age knots: ×1.0 ≤50 → ×1.4 at 80 (Mather & Johnson 2000 —
      older adults more choice-supportive)
```

### 6.18 Outcome ownership — choice blindness (new in v1.8)

When an outside act replaces a record's *outcome* field (possession
handoff, admin intervention, another character's act attributed to
them), the swap is a `swapOutcome` event on the record:

```
P(detect) = cb_detect (0.3) · (1 + selfRelevance) · (fresh ? 1 : 0.5)
if undetected: outcome owned — provenance stays self/witnessed, and
    §6.17 consistency pull + §6.2 confabulation generate inferred
    motive candidates at next reconstruction (confabulated reasons
    for choices never made — Johansson et al. 2005: <10% immediate
    detection, ~20–25% total, confabulated justifications at equal
    confidence/detail/emotionality; Hall et al. 2010 — the
    confabulated position moves subsequent attitudes)
if detected: tag record incongruent:true — "I don't know why I did
    that"; distinct from the wholesale possess_alien estrangement
    discount (§8.1)
```

This is the fictional-continuity layer for the possession economy:
a resumed character confabulates ownership of the possessed interval
instead of noticing the seam, at human rates.

### 6.19 Repression — the non-mechanism (new in v1.8)

**No repress() operator exists or will.** Massive motivated
repression with intact recovery is not an evidence-supported
mechanism (Loftus 1993; Patihis, Ho, Tingen, Lilienfeld & Loftus
2014 — belief persists among clinicians despite the evidence).
Apparent recoveries are produced by ordinary machinery already in
the model: §4.12 bounded suppression (leaky, θ-side only), §4.14
latent-route reinstatement, §6.9 source-confused imagined content,
§6.8 phantom minting. A character's past can be lost, confused, or
invented — never defended-against and unleashed. Guarded by P172.

### 6.20 Corroboration confidence — social validation (new in v2.0)

Distinct from §6.5 (content convergence): this is the **confidence**
channel. When two accounts are compared in `hearAccount`/`discussEvent`:

```
core fields match (simOp(·,·,"sim_merge") > merge_thresh on who/what/where):
  BOTH parties' records: conf += corroborate_conf (≈0.15) — mutual
      validation; whoever was right, both leave more certain
      (Wells & Bradfield 1998 — post-ID feedback inflates confidence,
      even recollection of view quality)
listener's reconstructed field contradicts:
  conf −= disagree_conf (≈0.10) — asymmetric magnitude, depression <
  inflation (Bradfield, Wells & Olson 2002)
persistence: corroborate_conf deltas do NOT unwind when the
  corroborator's PersonModel.credibility later drops — known
  discrediting does not refund the confidence (Wells & Bradfield
  boundary; Skagerberg & Wright 2008)
```

Accuracy untouched — consensus and truth decouple. Age knot:
`corroborate_conf ×(1 + 0.2·(age_eff−65)/20)` above 65 [HYPOTHESIS,
consistent with older-adult suggestibility; social-memory.md §20, §28].

### 6.21 Common-ground overreach — shared_with (new in v2.0)

On `encodeEvent`, every character in `context.present` is appended to
the record's `shared_with` list with probability `copresent_assume_p`
(≈0.9), scaled by `×(1 + 0.3·age_eff/60)` — **no check on their actual
attention** (the egocentric-anchor skip IS the error: Keysar audience-
design work; Birch & Bloom 2007 curse of knowledge; Nickerson 1999).
Queries "would X know this?" answer `shared_with` membership at
`common_ground_conf` (≈0.8). `shared_with` decays at `beta_source`
(metadata, not content). Coexists with `toldTo` (v1.6) as the inferred
wrong-able channel — a character can believe you know what you never
heard AND forget telling you what you were told (social-memory.md §21).

### 6.22 Confidentiality decay — secrets leak (new in v2.0)

`confidential` records carry `secret_str` (born at record E — §2)
decaying at `beta_source·secret_tag_mult` (≈1.3) — the prohibition is
single-utterance source-class metadata and rots faster than the juicy
content it guards (source-amnesia asymmetry, Schacter et al. 1984 —
HYPOTHESIS applied). At `retell`/transmission of a confidential record:

```
P(respect) = min(1, secret_str·2) · (0.5 + 0.5·consc_trait)
if respect fails: content transmits WITHOUT the flag — silent leak;
  no breach event is minted unless the game emits one
```

Fresh secrets hold; old secrets leak at content-fresh rates — "wait,
was that a secret?" is the emergent failure mode (social-memory.md
§23). Guarded by P188.

**v2.2 self-concealment split:** the §4.13 share-motive draw multiplies
by `(1 − self_share_pen)` (0–0.9) when the candidate record has
`selfRelevance ≥ 0.6` — transmission of *one's own* distressing content
is a separate channel from sharing generally (Larson & Chastain 1990:
self-concealment ≠ low self-disclosure; it predicts distress
incrementally). This is the Marisol parameter: `share_k` high on others'
business, `self_share_pen` high on her own — the curator who never
opens her own file.

### 6.23 Absorption — told_by → experienced (new in v2.0)

A `told_by` record meeting ALL of `hearCount ≥ 3`,
`selfRelevance > 0.5`, verbatim richness > `rm_rich_thresh`, the §6.9
plausibility gate, AND a decayed source tag draws `absorb_p` (≈0.02)
per subsequent hear/retell to flip provenance to `witnessed` at
reduced verbatim ceiling and reduced confidence — others' stories
become quasi-autobiographical (Hyman, Husband & Billings 1995;
Pillemer et al. 2015 vicarious memories). Never fires while the source
tag is intact; never exceeds the detail of real witnessed records —
absorbed memories are thinner (social-memory.md §26). The social
route into false-autobiographical memory: distinct from §6.9
imagination (nothing was imagined) and from cryptomnesia (content
kept, source lost — here the *kind* flips).

### 6.24 Canonization — the oft-told story freezes (new in v2.0)

Records carry `retellCount` (increments on §6.11 retell and §4.13
fires). At `retellCount ≥ canon_thresh` (≈5) the story has
conventionalized (Bartlett repeated reproduction; Marsh & Tversky
2004):

```
§6.1 drift and §6.11 audience tuning ×= canon_drift_mult (≈0.2)
verbatim candidate edits freeze — the accumulated state, warts and
    all, IS the memory now (early distortions become permanent)
§6.3 adoption on contested fields ×= (1 − canon_resist) (≈0.6) —
    well-rehearsed accounts resist late misinformation
S-growth per §4.11 continues but R-side content stops rewriting —
    rote recitation is not elaborative retrieval
```

Double-edged and falsifiable (P189): canonization locks in whatever
the teller had converged to AND armors it against later correction.

### 6.25 Verbal overshadowing — describing it corrupts it (new in v3.0)

On `retell(..., verbalize:true)` of a record dominated by nonverbal
fields (faces, colors, spatial layout — `vivid_detail`-written
sensory fields, not names/numbers/plots): the emitted description is
written as a candidate with `provenance:"claimed"` and
`candStrength = vo_cand` (0.5) into each verbalized field, and the
nonverbal verbatim takes a one-shot ×(1+vo_loss) decay hit
(Schooler & Engstler-Schooler 1990; recoding account, Schooler
2002). The description candidate is fresh, so it outcompetes the
perceptual original *most strongly right after describing* — the
RRR timing gradient (Alogna et al. 2014: −4% correct-ID for
immediate description, −16% for delayed description adjacent to
test) falls out of ordinary candidate decay, no extra machinery.
Verbalizable fields get the normal retell boost instead — words
help words, hurt pictures (Meissner & Brigham 2001 meta Zr = −0.12;
elaborative descriptions worst). `verbalize` flag comes from the
dialogue layer when a character is asked to *describe* rather than
recount; identification probes (§5.10) then sample the
self-description candidate as often as the face — the witness
"recognizes" their own words. AGE-FLAT (cite-guarded null — no
solid age-gradient evidence; mark for re-check if VO-aging
literature lands).

### 6.26 Unconscious transference — the familiar face migrates (new in v3.0)

When a person-slot's witnessed candidate has died (source decay
§6.4 / verbatim decay), reconstruction does not leave it empty —
it *fills* with the most cue-plausible known person:

```
P(transplant) = transplant_gain (0.10) · discrim_mult
                · max_p [ (PersonModel[p].familiarity
                  + 0.5·exposure_fam_gain·PersonModel[p].exposureCount)
                  · simOp(contexts(p), slot.cueContext, "sim_person")
                  · (slot.categoryTags ∩ p.categoryTags nonempty
                     ? (ingroup(p) ? 1 : 1 + orb_gain)
                     : cat_resist) ]
transplanted p written as candidate provenance:"inferred",
    candStrength 0.5 — emits as confident presence ("he was
    definitely there")
```

Loftus 1976; Ross, Ceci, Dunning & Toglia 1994 (transference
subjects ~3× more likely to misidentify the familiar bystander;
telling them the bystander ≠ culprit ELIMINATED it — an explicit
`disputed`-style informant kills the inferred candidate).
`orb_gain` ≈ 0.5 generalizes the own-race/other-race bias
(Meissner & Brigham 2001 meta: own-group 1.40× hits, 1.56× fewer
false alarms; robust in the 2022 three-level re-meta) to any
poorly-differentiated identity category — outgroup faces are both
less discriminable at §5.10 (treat as `lure_accept` ×(1+orb_gain)
on person-recognition of that category) and more transplantable.
`cat_resist` ≈ 0.4: cross-category transplants need weak
competition. Mistaken identity is the leading known cause of
wrongful conviction (~69–75% of DNA exonerations, Innocence
Project/Gross & Shaffer) — this channel carries real weight;
DEBATED whether familiarity or inference drives it (Read et al.
1990 nulls); the op produces the outcome either way.

### 6.27 Conjunction errors — cross-episode field migration (new in v3.0)

Features of stored episodes stay independently recombinable
(Reinitz, Lammers & Cochran 1992; Odegard & Lampinen 2004 —
autobiographical conjunction errors carry "remember" judgments;
older adults produce more). Daily tick, over record pairs with
`simOp(a,b,"sim_interf") > conj_thresh` (0.65 — same place, same
people, different day):

```
per field populated in a, empty/decayed in b:
    P(migrate) = conj_migrate_p (0.05) · discrim_mult
                 · (same encode-week ? 1.5 : 1)   // proximity
        → b gains candidate {value: a's, candStrength: 0.5·a's,
           provenance:"inferred"}
```

Both records survive (≠ §4.3 merge, which kills one); the migrated
fact is TRUE but its pairing is FALSE — "the glass was Tuesday."
accuracy bookkeeping penalizes b only. Rehearsing b's version
suppresses a's candidate via §5.13 as usual.

### 6.28 Boundary extension — scenes are born too big (new in v3.0)

Spatial/extent verbatim fields (crowd size, room scale, distances,
frame edges) are written at encoding ALREADY extended:
`stored = actual·(1 + be_gain)`, `be_gain` ≈ 0.12 — measurable
within seconds (Intraub & Richardson 1989: 95% of drawings included
never-presented surround; recognition errors are asymmetric —
veridical pictures are judged "closer than remembered"). The only
encode-time distortion operator and the only systematically
DIRECTIONAL one — always outward, never inward; preserved or
amplified across the lifespan (children show it, older adults equal
or more — Seamon et al. 2002; Intraub & Dickinson 2008). Knots:
×1.0 ≤60 → ×1.2 at 75. Guard against double-counting with §2
schema-fills: be_gain applies to *extent* fields only, not content
fields (P289 direction-checks).

### 6.29 Denial backfire — negations plant the affirmed core (new in v3.0)

A `negated:true` account writes the AFFIRMED content as a candidate
(candStrength `neg_cand` 0.35 · sourceCredibility · rep term ·
(1 + neg_age_gain·(age_eff>65))) tagged `frame:"denied"`. The frame
is a source-class tag and decays at `beta_source·neg_frame_mult`
(2.0 — the "it was denied" wrapper dies ~2× faster than the
content). While the frame lives, the candidate correctly reads as
denied; once dead, familiarity alone remains and the claim reads
true (Skurnik, Yoon, Park & Schwarz 2005: older adults 28%→40%
false-as-true at 3d, worse with repetition; Mayo et al. 2004
negation processing; Jacoby 1999 fluency→truth). Repetition counts
hearCount normally — *denying a rumor more often spreads it* once
the frame is gone. Distinct from §6.6 corrections (which retract
content the listener already holds); §6.29 handles denials of
content the listener may never have encoded as true.

### 6.30 Phantom recollection — false content splits into two phenomenologies (new in v3.0)

False content emitted by §6.8/§6.9/§6.27 enters the §6.7 derived
pair through a binary gate, not a continuum (Brainerd, Wright,
Reyna & Mojardin 2001 — phantom recollection is the LARGER false-
recognition contributor; 2022 conjoint-recognition meta, 537 sets,
dual-recollection confirmed; Odegard & Lampinen 2004 — conjunction
errors feel remembered):

```
if generated verbatim richness ≥ rm_rich_thresh:
    with prob phantom_recoll (0.35): feeds recollect_q AND
        believe_p — "ersatz verbatim" assembles at retrieval;
        emits as vivid reliving ("I can see it")
    else: familiarity mode
below gate: familiarity only — feeds believe_p ("sounds right"),
    never recollect_q
```

Validation signature: false records form a vivid-false cluster and
a believed-unfelt cluster (bimodality, P292). AGE-scaled via the
§6.8 phantom machinery's existing discrim_mult path — no new knot.

### 6.31 Gossip as evidence — trait writeback at a discount (new in v3.2)

Adopted `told_by` content carrying a trait implication about a
third party updates the target's `PersonModel` — hearsay moves
impressions, discounted and credibility-scaled (Sommerfeld,
Krambeck, Semmann & Milinski 2007 — gossip substitutes for
observation; Feinberg et al. 2012 — prosocial gossip drives
ostracism; weight is HYPOTHESIS, direction ROBUST):

```
PersonModel[target].traits[t] += sti_gain · implication ·
    diag_weight(dim) · heard_update_w (0.4) ·
    PersonModel[speaker].credibility
```

`eval` (§1) recomputes with the trait write. Two decouplings are
the signature (P315): (a) report-time believability and trait-
update are separate channels — a zero-credibility speaker can be
believed about THIS claim yet move the trait ~0; (b) negative
gossip outweighs positive via `diag_moral_neg` already — the
formula inherits the asymmetry for free. Speaker-side consequence:
failed verification later drops `PersonModel[speaker].credibility`
(§6.14) — shooting the messenger is the correction channel.

### 6.32 Motivated transference — schema projection onto new persons (new in v3.2)

On `PersonModel` creation, if the new person's observed surface
(traits-seen + categoryTags) matches an existing high-strength
model at `sim > transference_thresh` (0.6, searched over the
top-`transference_pool` (5) donors by familiarity·|eval|), the
new model is schema-seeded (Andersen & Baum 1994 — participants
falsely recognized significant-other-consistent traits never
presented; Andersen & Chen 2002 relational-self theory):

```
new.traits[t] += transference_seed (0.3)·donor.traits[t]
new.eval       += transference_seed·donor.eval
subsequent reconstruction of new-person episodes: confab
    candidates drawn from donor trait space at transference_fill
    (0.15), weighted (1−individuation) — first-impression device,
    decays as real evidence accrues (§1 individuation)
```

Distinct from §6.26 unconscious transference (slot-filling a DEAD
person slot): this seeds a LIVE new model with projected schema —
"he reminds me of my brother" is a memory operation with a
confidence tag, not a misidentification.

### 6.33 Emotional contagion at retell — secondhand arousal (new in v3.2)

The v1.7 `contagion_k` hearsay channel formalized person-mediated:
on `retell`/`hearAccount`, the listener's stored `affect_tag`
gains (Hatfield, Cacioppo & Rapson 1994; Peters & Kashima 2007;
Rimé 2009 — sharing reactivates arousal in BOTH parties):

```
affect_tag += contagion_k · speaker_now_arousal ·
              (0.5 + 0.5·empathy)
speaker_now_arousal = the speaker's retrieval-time arousal report
    (§5.5, already hc_gap_loss-bounded) — NOT the record's birth
    arousal: cooled tellers ship cooled rumors
```

Emergent and falsifiable (P321): month-old scandal arrives
lukewarm from a phlegmatic teller, hot from a still-angry one —
the neighborhood's emotional version of events tracks who is
*currently* upset, not what originally happened.

### 6.34 The narrative-self layer — anchors, self-protection, life scripts (new in v3.4)

Three operators that turn a *record store* into a *person*. None of
them change how much is stored — they change which records carry
identity, which the self quietly drops, and how the life is told.
Sources and profile readings in `cast-profiles.md` Part II.

#### 6.34a Self-defining memories — the anchor records

Records may carry `selfdef:true` (Singer & Salovey 1993; Blagov &
Singer 2004, *J. Personality* 72:481). Minted at encoding or
promoted on retell when `selfRelevance ≥ 0.8` AND the record has a
`meaning` field (a stored gist interpretation — what the event
*means about the self*); capped at `selfdef_cap` (default 6; new
anchor displaces weakest, never deletes it — it demotes). Effects:

- **Archive floor:** strength never falls below `selfdef_floor` —
  the anchor survives the §4 archive cutoff that kills its
  neighbors (the day the store opened, the night she left).
- **Drift split:** core fields drift at `×selfdef_drift_mult`
  (canonized-like); peripheral fields drift normally — anchors are
  *meaning-faithful, detail-free* (they get more wrong about what
  was said than about what it meant).
- **Warm bias:** recall drive `+= selfdef_cue_gain` — anchors are
  perpetually near-threshold; they intrude and cue disproportionate
  reminding chains (they ARE the life story's cue hubs).
- **Specificity axis:** field-population at birth scaled by
  `selfdef_spec_mult = 1 − 0.5·max(0, defens)` — repressive
  defensiveness yields *vague* anchors (Blagov & Singer 2004:
  specificity inversely related to repressive defensiveness). The
  meaning is claimed; the scene is thin.

#### 6.34b Mnemic neglect — self-protective recall failure

Applies ONLY to events tagged `feedback:true` that clear three
gates (Sedikides & Green 2000, *JPSP* 79:906; Green, Sedikides &
Gregg 2008, *JESP* 44:547 — review Sedikides & Green 2009,
*P&SC* 3): `valence < 0` AND `traitCentrality ≥ mnem_central_thresh`
AND `diagnosticity ≥ mnem_diag_thresh` AND `selfRelevance ≥ 0.6`.
Then:

```
recallDrive *= (1 − mnem_neg·(1 + 0.5·max(0, defens)))
relief: speaker closeness (PersonModel[spkr].eval ≥ 0.5 or
        attachment:true speaker) OR event improvement:true
        → penalty *= (1 − mnem_close_relief)
```

Three boundaries ARE the finding: (1) recall-only — the
recognition/copy-cue path (`recogn_pen` branch) is EXEMPT
(Green et al. 2008: "forgotten but not gone"); (2) feedback about
*other* people is unaffected; (3) peripheral-trait or
low-diagnosticity criticism encodes normally. NOT an encode block —
the record writes shallow and fails at search, so the character who
"doesn't remember being criticized" is not lying; it is recoverable
under recognition cues, which is what makes the blow-up scene legal.

#### 6.34c Life-script corrections — the bump is positive, the wound is recent

`bump_valence_gate` (v0.3) already confines the bump to positive/
self-relevant records (Berntsen & Rubin 2004, *Psych. Bull. Rev.*
11:1003; Rubin & Berntsen 2003, *Psych. Aging* 18:636 — bump for
positive only; negative events monotonically decreasing, peaking at
present). v3.4 adds the two *downstream* asymmetries:

- `dateEstimate` on negative-valence records adds a forward pull
  `+neg_now_pull·(trueAge/10y)` — negative events are systematically
  misdated RECENT (they "just happened"), the statistical mirror of
  the negative no-bump.
- `dateEstimate` on positive records tagged `lifescript:true` is
  pulled toward the culturally normative script age by
  `script_age_pull` — the wedding drifts toward 28, the degree
  toward 22 (the script supplies dates when memory doesn't).
- Ambient-scan involuntary candidates get drive
  `+= invol_pos_bias·max(0, valence)` — happy involuntary memories
  run ~2× unhappy ones (Rubin & Berntsen 2003); rides the existing
  positivity curve, so elders' days are biased warmer even when
  nobody is asking.

#### 6.34d Redemption/contamination — the retell transform on meaning

Each character carries `script_redeem ∈ [−1, 1]` (McAdams,
Reynolds, Lewis, Patten & Bowman 2001, *PSPB* 27:472 — redemption
sequences track wellbeing/generativity; contamination tracks
distress). On `retell` of a record whose valence opposes the
script's direction, with prob `|script_redeem|·redeem_write` per
retell the record's `meaning` field accrues a frame candidate that
shifts *told valence* toward the script (negative→benefit-found for
redeemers; positive→spoiled for contaminators). The stored content
fields are untouched — what drifts is the interpretation layer —
but through reconsolidation the meaning IS what the character
believes happened *to* them. Canonized anchors (§6.24) amplify:
the oft-retold story settles onto the script's groove.

### 6.35 Schema assimilation in childhood — the sign adults don't share (new in v3.8)

Below `schema_flip_age` (10), schema-violating fields don't earn the
adult `isolated` advantage — they get normalized or lost (AD§38;
Liben & Signorella 1980: highly stereotyped children recognized
traditional > nontraditional; Signorella & Liben 1984: reconstructions
ran nontraditional→traditional, bias growing with task difficulty —
and children live in the hard-task regime):

- On `dailyMemoryTick`, each field with `schema_violation > 0`
  (PersonModel stereotype or world-rule expectation mismatch)
  transforms toward the modal schema value at `schema_assim_p`
  (.25@6 → .1@12 → .05@20) — the silent intra-record cousin of
  §6.12's stereotype convergence.
- Violations that escape transformation take `schema_viol_loss`
  (0.15) extra β on the child side — unassimilated violations are
  forgotten, not preserved.
- Scale by the character's stereotype strength (PersonModel
  trait-schema rigidity); low-stereotyped children show no
  differential, per the source data.
- Adults keep `isolated` (§5.31); the channels must diverge — P392
  fails on collapse.

### 6.36 The preverbal lock — traces that can't be told (new in v3.8)

Records mint `verbal_age` = productive-language level at encodeAge
(knots 0@2y, .4@2.5, .8@4, 1.0@6). On `retell`/`recall` verbal
output of a record with `verbal_age < verbal_lock_thresh` (0.6),
verbal fields emit at `verbal_age` fidelity — the reconstruction
carries `verbal_void:true`: sensory/affect/motor fields present,
narration absent (Simcock & Hayne 2002 — children with intact
verbal AND nonverbal memory never reported any aspect absent from
productive vocabulary at encoding; later-acquired words do not
unlock it). Nonverbal cues (odor, song, posture) retrieve these
records at normal rates — §5.28 `familiar_only` and §5.20 latent
reinstatement are their natural routes. P389.

### 6.37 Update resistance — the old version re-emerges (new in v3.9)

Hartman & Hasher 1991 (Psychol Aging 6:42): elders recall the
original endings they themselves replaced; May, Zacks, Hasher &
Multhaup 1999 garden-path — the superseded interpretation persists
(AD§55). On a §5.9 reconsolidation write that changes a verbatim
field, with probability `update_resist(age_eff)` — 0.05 ≤50 → 0.2
at 70 → 0.35 at 85 — the field mints a **versioned pair**
`{old_v, new_v, supplantDay}` instead of overwriting. Later
reconstructions emit `new_v` with probability `new_v_share` = 0.7,
decaying −0.01/day after supplantDay, floor 0.5 — the correction
fades back toward the original. Resurrected old values stack
`conf_inflate_old` — "she still lives on Folsom," said with
certainty, six months after the move. P404.

### 6.38 Fluency fame — familiar reads as notable (new in v3.9)

Bartlett, Strater & Fulton 1991 (Mem Cogn 19:348): false fame and
false recency both elevated in older adults — sourceless fluency
gets attributed to prominence (AD§56). When §5.28 emits
`familiar_only` on a person/name cue with famScore ≥ fam_bar and
the source unresolved for `fame_window` ≥ 30 days, the emission
may carry `attribution:"known_around"` with probability
`fame_fluency(age_eff)` — 0.02 ≤50 → 0.08 at 70 → 0.15 at 85
(young knot near-zero; young fluency reads as déjà vu via
`deja_prop` instead). Rumor consequence: repeated gossip exposure
manufactures notability for elders — fluency inflates reputation
salience without any source. P405.

### 6.39 Venting is rehearsal — the catharsis null (new in v4.0)

Retells/expressions flagged `vent:true` (dialogue layer tags
expressive-anger tells — yelling about the provoker, punching the
metaphorical bag) route to the **rumination channel**: they draw
`rumin_k` heat-maintenance on the affect tag and explicitly do NOT
receive §16 `verbal_damp`. Frozen null `catharsis_relief = 0` —
there is no purge term anywhere. Bushman 2002 (PSPB 28:724):
venting-with-rumination left subjects angrier AND more aggressive
than distraction AND than doing nothing; Bushman, Baumeister &
Stack 1999: belief in catharsis itself licensed aggression. The
asymmetry is the point — talking it through cools the tag, letting
it out stokes it (emotional-memory.md §42). P411 fails any
implementation where venting lowers `arousal_tag` faster than
silence.

### 6.40 The positive regulators — savoring and dampening (new in v4.0)

Two traits manage positive affect in opposite directions
(emotional-memory.md §43):

- `savor ∈ [0,1]` (loads extra/open): retells and elaborative
  replays of `valence > savor_thresh` (0.4) records apply
  `valence_tag += savor_gain·savor` (savor_gain ≈ 0.2, bounded) and
  discount the next positive-fade tick ×(1 − 0.5·savor) — savoring
  literally slows the FAB for positive events (Bryant & Veroff
  2007).
- `dampen ∈ [0,1]` (loads neurot, anti-extra): positive-tag fade
  multiplier ×(1 + dampen_mult·dampen), dampen_mult ≈ 0.5 —
  dampeners' positive affect decays up to ~1.5× faster (Feldman,
  Joormann & Johnson 2008 — dampening predicts depressive symptoms
  over and above negative rumination). High-dampen + high-rumin_k
  is the depressive profile: negative heat maintained, positive
  heat bled.

### 6.41 Forecasting from memory — the impact bias (new in v4.0)

`imagineEvent`/`anticipatedEvent` outputs for future scenarios carry
predicted affect (emotional-memory.md §50):

```
forecast_valence = valence_estimate · forecast_int_bias   // ≈1.15
forecast_dur     = duration_estimate · forecast_dur_bias  // ≈1.6
```

Overestimation of intensity and especially duration is the impact
bias (Wilson & Gilbert 2003; Gilbert et al. 1998); **immune
neglect** is locked: the character's own §32 narrative-repair
capacity does NOT shrink the forecast — the repair mechanism is
invisible prospectively (Gilbert et al. 1998). Focalism (Wilson et
al. 2000) is free: the scenario only contains its focal content.
Behavioral consequence: avoidance/pursuit decisions run on inflated
forecasts — dreading the confrontation more than it will hurt.
P419.

### 6.42 Flashbulb records — floored confidence, ordinary drift (new in v4.1)

Reception-event records (learning of a high-arousal public event —
"where I was when I heard") mint `flashbulb:true` when
`arousal_tag ≥ 0.8 AND event is public/social` (false-memory.md §38):

```
emitted confidence = max(conf, fb_conf_floor)   // 0.75 — the ONLY
    floored confidence in the model; accuracy-independent
candidate drift is NORMAL (§6.3/§6.12); media retellings arrive as
    high-credibility told_by accounts → systematic drift toward the
    communal canonical narrative
after fb_plateau (1000d) the drifted state freezes — consistency
    plateaus wrong, confidence doesn't notice (Hirst et al. 2015)
```

Neisser & Harsch 1992; Talarico & Rubin 2003 — consistency decays
at everyday rates; confidence alone stays maximal. P421.

### 6.43 Question wording — the verb pulls the number (new in v4.1)

`answerProbe` gains `wording_intensity` ∈ [−1,+1] (the question's
implied magnitude) and presupposition (false-memory.md §39):

```
quantitative fields (speed, size, duration, count, amount):
    pulled candidate = fieldVal + wording_intensity·verb_pull
                       ·schemaRange(field)   // verb_pull 0.2
    provenance "confabulated" — written by the question
presupposed detail ("the broken glass"): empty/weak field gains a
    confabulated candidate at lp_detail_p (0.15)
```

Loftus & Palmer 1974 (smashed 40.8 vs hit 34.0; glass 32% vs 14%);
Loftus & Zanni 1975 ("the" vs "a"). P422.

### 6.44 Feedback — the answer edits the evidence (new in v4.1)

`feedback(charId, emission, kind)` on a recall/identification/
retell emission (false-memory.md §40):

```
confirm: confidence += fb_conf_gain·(1−conf)   // 0.25
    encoding-condition fields (view, attention, distance,
    duration) mint/promote inflated candidates at retro_inflate
    (0.15), provenance:"inferred" — the past gets better because
    the answer was approved
disconfirm: confidence −= fb_disconf·conf      // 0.4 — hits harder
accuracy untouched BOTH directions — feedback edits metamemory,
    never content (P423 guards)
```

Wells & Bradfield 1998; Douglass & Steblay 2006 (N>2400, large
effects on certainty/view/attention); Steblay, Wells & Douglass
2014 (N≈7000). Contract: contested identifications log pre-feedback
conf (P431).

### 6.45 Interviewer expectancy — the self-fulfilling probe (new in v4.1)

`answerProbe` gains `expect:`{value} (false-memory.md §41):

```
press_gain × (1 + expect_press 0.3); the expected value writes a
    weak told_by candidate (expect_cand 0.3) — the question leaks
    its answer
expectancy loop: emitted answers matching expect auto-fire §6.44
    confirm — pressure → conforming answer → confirmation →
    inflated confidence (Kassin, Goldstein & Savitsky 2003;
    Kassin, Dror & Kukucka 2013 — composition HYPOTHESIS, clauses
    sourced)
```

P424.

### 6.46 swapReport — memory blindness on own reports (new in v4.1)

An altered version of the character's own prior statement is
re-presented as self-sourced (false-memory.md §42). Distinct from
§6.18 `swapOutcome` (decision outcomes, not report content):

```
P(detect) = mb_detect (0.35)·(fresh ? 1 : 0.6)·(1 + 0.3·selfRelevance)
undetected → altered value writes a candidate provenance:"claimed"
    at candStrength = cand_base_str·self_cred (self_cred 1.0 — the
    sourceCredibility ceiling; own testimony outranks the event)
detected → incongruent:true (shared with §6.18)
```

Cochran, Greenspan, Bogart & Loftus 2016 (majority undetected,
memory shifts toward the alteration); sticker-study replication.
P425.

### 6.47 Listener SSIF — your retelling edits my memory (new in v4.1)

`hearAccount` applies a suppression pass to the LISTENER's own
record of the same event (false-memory.md §43):

```
account covering field-set F: listener's surviving candidates on
    F-RELATED fields the account did NOT mention take a one-shot
    ssif_suppress (0.15) strength hit — co-retrieval suppresses
    unshared rivals (Cuc, Koppel & Hirst 2007; Stone et al. 2012;
    persists ≥30d Coman et al. 2009)
mentioned fields follow §6.3 normally — the same retelling
    strengthens what it says and starves what it omits
```

P426 — sign-locked both directions.

### 6.48 Omission suggestion — "nothing happened" (new in v4.1)

`hearAccount` with `omission:true` asserts absence, not content
(false-memory.md §44). No candidate is written; surviving core-field
candidates take `emit_omit` (0.2) emission-weight penalty — the
trace stays, the report dries up (report-side resolution of the
Oeberst & Blank 2012 undoing debate; P427 discriminates via §6.50).
`neg_frame_mult` does NOT apply — no affirmed core to outlive a
frame.

### 6.49 — reserved (none)

### 6.50 Discriminate recall mode — test the source, not the content (new in v4.1)

Recall gains `mode:"discriminate"` — source-attribution-forcing
context (false-memory.md §46). Per field, emits the candidate LIST
with per-candidate provenance estimates (§6.10 sourceInfer run per
candidate); emitted false content falls by `discrim_recover` (0.5 —
capped ≤0.6, monitoring helps but doesn't sterilize); contested
fields emit at reduced confidence; latency ×1.5. Lindsay & Johnson
1989; McCloskey & Zaragoza 1985 modified test. P429. This is the
engine's own coexistence instrument (P163's reader).

### 6.51 Collective phantoms — emergent, no operator (new in v4.1)

Schema-consistent lures (§6.8) + mass parallel exposure (hearCount
fluency §6.3) + conformity (§6.5) converge toward shared false
"facts" at population scale — the "Mandela effect" class.
OBSERVE-only (P432): N characters on a shared schema-rich event
should develop CORRELATED phantom details above independence; no
dedicated operator may exist (guard against a collective-memory
shortcut). Mood-congruent selection lives in §6.8/§6.27 candidate
weighting: `×= 1 + moodcong_lure (0.25)·match(cand.valence,
traitValence)` — selection not volume (Joormann, Teachman & Gotlib
2009; Howe & Malone 2011). P430.

### 6.52 Overgeneral reporting — the psychopathology valence split (new in v4.2)

Two clinical phenotypes share the *surface* of "vague past" but not
the mechanism. `depr` (episodic, gated by `depr_state`):
positive-cued autobiographical recalls return generic/categoric
records at `pos_spec_loss·depr·(0.3+0.7·depr_state)` while storage
is untouched — specificity, not strength (Williams et al. 2007;
Ono, Devilly & Shum 2016: depression's OGM is driven by missing
specific responses to positive cues). `ptsd`: the mirror image —
negative-cued recalls go generic at `neg_ogm·ptsd`, trauma records
birth fragmented `frag_p`, and `threat:true` records intrude on
**sensory-cue matches only** at reduced `intrusion_thresh −
trauma_sens_intr·ptsd` (Ehlers & Clark 2000 — perceptual triggers,
not semantic reminders); voluntary recall of threat records carries
the `avoid_suppress` theta surcharge released under depletion per
§5.38. `attach_avoid`: `attach:true` records encode with
`vivid_detail ×(1 − attach_field_loss·avoid)` of BOTH valences
(Edelstein 2006 — content-gated, non-attach material untouched)
and carry the same `avoid_suppress` retrieval surcharge on
negative-valence members; `attach_anx` instead lowers
intrusion_thresh on rejection-cued records and raises mood_bleed
(spreading, not storage — Mikulincer & Orbach 1995). Locked nulls:
depr → no enc_base/beta/theta loading; ptsd → no non-threat
intrusion gain; attach_* → no off-tag effects. P433–P436.

### 6.53 The suppression tax — masking costs encoding (new in v4.2)

`context.suppressing:true` (dialogue/emotion layer sets it while the
character masks): E on social fields (people, conversation content)
of co-occurring events scales `×(1 − supp_enc_cost·supp)` (0.12);
non-social fields untouched — the tax is on *social* information
(Richards & Gross 2000, three studies; Richards, Butler & Gross
2003 — the poker face forgets what was said). Sustained suppression
increments the `depleted` budget that §5.38 spends. `reap` is the
explicit null arm: reappraisal carries NO encoding loading
(antecedent-focused regulation completes before the demand) — a
reap loading is a spec violation (P439). Composes, never merges,
with §5.4's acute-stress encoding loss: masking a calm lie costs
the tax without any arousal spike.

### 6.54 Spontaneous trait transference — the messenger wears the message (new in v4.3)

On `retell`/`hearAccount` where the content carries a trait
implication about a third party (target ≠ speaker), the SPEAKER's
model absorbs a smear of it (Skowronski, Carlston, Mae & Crawford
1998 — 4 experiments, associative not inferential; Mae, Carlston &
Skowronski 1999 — transfers via familiar communications; social-
memory.md §48):

```
PersonModel[speaker].traits[t] += stt_gain (0.05) · implication
    // no diagnosticity gate, no sit_credit — mindless association
if content is moral-negative about an absent target:
    PersonModel[speaker].eval -= stt_stigma (0.08)   // gossip
    // stigma — the habitual detractor's own eval pays (Farley 2011)
```

Both writes are listener-local and per-hearing — the world marks
no gossips; each listener's memory does (P445).

### 6.55 RelEdge mechanics — balance warps the social map (new in v4.3)

`RelEdge` (§1) mints on witnessed alter–alter interaction or
adopted `told_by` relational content. Three operators (De Soto
1960 — schema-consistent structures learn faster; De Soto &
Kuethe 1959 — symmetry attributed to "likes"/"confides", asymmetry
to "influences"; De Soto, Henley & London 1968 — unbalanced
SENTIMENT structures learned poorly, unit relations exempt):

```
mint: kind:"sentiment" edges also write the REVERSE edge at
    edge_sym_p (0.75)·str — "he adores her" mints weak
    "she adores him"; kind:"unit"/influence edges mint none
daily tick: sentiment edges whose enclosing triads are unbalanced
    (sign product −1) decay ×(1 + balance_pull·0.06 per edge —
    scaled so the weakest unbalanced edge carries the tax)
retrieval: unbalanced sentiment edge at str < 0.4 flips sign at
    balance_flip_p (0.1) — remembered as resolved
```

Emergent: the believed social map is systematically more balanced
than the real one — enemies-of-friends get edited out (P447).

### 6.56 Own-share inflation — the >100% dyad (new in v4.3)

Records tagged `coAgents` (joint action — chores, projects,
fights both parties joined) store `own_share` ≈
actual·(1 + own_share_bias·(0.5 + 0.5·delayYr)),
`own_share_bias` 0.25 — mature claims ≈0.55–0.65 mean share, dyad
sums ≈110–130% (Ross & Sicoly 1979 — availability-driven, grows
with delay; Burger & Rodman 1983 — delay flips early other-credit
to self-credit). On negative-outcome coAgents records, reported
own_share ×= (1 − blame_deflect) (0.7, ×(1+0.3·max(0,defens)) —
Campbell & Sedikides 1999 threat-dependence). Housemates' chore
memories are irreconcilable by construction (P448).

### 6.57 Single-voice consensus — one repeater reads as a chorus (new in v4.3)

`consensusEstimate(charId, claim)` returns the character's
inferred prevalence of an opinion in the neighborhood (Weaver,
Garcia, Schwarz & Miller 2007 — one communicator's repetition
inflates perceived consensus nearly like distinct voices; opinion
accessibility, not deliberate source counting):

```
effectiveVoices = nDistinctSources + same_source_pen·(hearCount −
                  nDistinctSources)        // same_source_pen 0.7
consensusEst = effectiveVoices/(effectiveVoices + voices_k)  // 4
```

Retell emission may tag `norm:"everyone knows"` when
consensusEst > 0.6 — characters assert consensus hallucinated
from one relentless repeater (P449). Read-only: feeds rumor
salience and the history browser, never edits fields.

### 6.58 Retell confidence inflation — telling makes you sure (new in v4.3)

On each `retell`/`discussEvent` surfacing, the speaker's record
gains `conf += retell_conf_gain·(1 − conf)` (0.03, hard cap
`retell_conf_cap` 0.95) — accuracy untouched (Shaw & McClure 1996
— repeated postevent questioning inflates confidence; Odinot,
Wolters & van Koppen 2009 — repeated attempts degrade accuracy
while confidence climbs; Kelley & Lindsay 1993 fluency→confidence
pathway). Stacks with §24 canonization: oft-told stories are
maximally certain AND frozen at their young distortions — the
most confident witnesses are the most frequent tellers (P450).
Distinct from §6.20 corroborate_conf — this needs no audience.

### 6.59 The conformity split — public assent, private dissent (new in v4.3)

When a listener's own reconstructed field CONFLICTS with a
speaker's account, §6.5's merge now routes on own-field strength
(Gabbert, Memon & Allan 2003 — informational conformity dominates
when own memory is weak; Wright, Self & Justice 2000; Gabbert et
al. 2004 — normative compliance under pressure leaves private
recall intact):

```
ownFieldStrength < conform_gate (0.4): informational — the
    existing §6.5 merge proceeds (private change)
ownFieldStrength ≥ gate: normative arm — with prob
    conform_norm_p·(1 + max(0,status_gap_speaker)) (0.3) the
    listener's EMITTED report aligns publicly; the stored field
    keeps its value and gains `dissent_mark` (private dissent on
    file, retrievable later); beliefStatus unchanged
```

Disputes resolve publicly and persist privately (P451) — the
asterisk is what gets retold to confidants months later.

### 6.60 Gossip tell-selection — scandal picks its audience (new in v4.3)

Inside `retell` field/record selection (before §42's novelty
gate), third-party person content is reweighted (McAndrew, Bell &
Garcia 2007 — negative gossip told to allies about targets the
audience can act on; Feinberg et al. 2012 — prosocial warning
gossip; Eder & Enke 1991 — gossip needs a mutually-known
referent; Dunbar et al. 1997 — social content is the retell
engine's main load):

```
if record.verbatim.who is a third party:
    salience *= gossip_neg_gain (1.4) when trait implication is
        moral-negative AND PersonModel[target].cheaterLoad > 0
    salience *= gossip_known_w (0.5) if audience holds NO
        PersonModel for target
    salience *= (1 + 0.3·max(0, PersonModel[audience].eval))
        — prefer allies
```

Rumor flow concentrates on friendship edges and dies at graph
margins — the rumor network is the relationship network, filtered
(P452).

### 6.61 The sleeper effect — discrediting rots faster than the claim (new in v4.3)

`hearAccount`/`feedback` may tag a record `discredited` (the
claim's acceptance was undermined post-adoption — "turns out he
made it up"). `discredit_str` births at 1.0 and decays at
β_source·`discredit_mult` (1.4); while alive, the record's
content fields weight inference at ×(1 − discredit_str); below
0.3, content resumes normal weight (Hovland & Weiss 1951;
Kumkale & Albarracín 2004 meta — sleeper effect real but
conditional: discounting cue must postdate message encoding;
mechanism = message–source dissociation, our β_source > β_content
asymmetry does the work). Distinct from §6.6 retraction (marks
CONTENT doubted) and §9 credibility (marks the PERSON) — this is
the claim-level discount rotting. Fires only when the discredit
postdates the record (Kumkale boundary). Retracted rumors recover
in belief weeks after the correction is forgotten (P453).

### 6.62 Post-event processing — the social failure replays itself (new in v4.3)

Records tagged `social_eval:true` (performances, embarrassments,
judgment-under-eyes — event layer supplies) with valence < −0.2
draw covert-retrieval ticks for `pep_days` (7) at rate
`pep_k·(0.5 + 0.5·neurot + 0.3·supp)`; each tick applies normal
§4.11 storage growth AND valence drift `−pep_neg_drift` (0.03)
(Clark & Wells 1995 maintaining process; Rachman, Grüter-Andrew &
Shafran 2000; Brozovich & Heimberg 2008 review; Dannahy & Stopa
2007 — replay worsens the appraisal). Content-gated to social-
evaluative events — distinct from rumin_k's broad depressive
rehearsal (P454). The anxious character's awkward Tuesday is
stronger and darker a week later — memory worsened after the
event ended.

### 6.63 Partner-eval pull — the present repaints the partner's past (new in v4.3)

Reconstruction of records about a person with a PersonModel at
familiarity ≥ identity_thresh drifts valence-relevant gist fields
toward sign(model.eval)·`partner_eval_pull`·(0.5 +
0.5·familiarity) (0.15) — current evaluation reconstructs the
relationship's remembered history (McFarland & Ross 1987 — dating
partners' recall of earlier evaluations biases toward current
feeling; Karney & Coombs 2000; Holmberg & Holmes 1994).
Familiarity scaling is the documented boundary: strangers' pasts
aren't revised — there is no present to reconcile them with.
Post-breakup the good years gray; post-reconciliation the
betrayal softens; long marriages self-maintain (P455).

### 6.64 The overhear channel — eavesdropped and thin (new in v4.3)

Events may arrive `kind:"overheard"` (speaker present, this
character not the addressee): encode with `E *= overhear_w`
(0.5), person-topic content `*= overhear_person_gain` (1.2 —
Emberson, Lupyan, Goldstein & Spivey 2010 attentional capture by
overheard speech; Dunbar et al. 1997 social-content attentional
bias); `source.who` binding ×= 0.6 — born weak; no prod/gen
gains, no toldTo write, NO shared_with write (overheard ≠ common
ground). Feeds §6.10 source inference with its weakest
provenance — characters know things they were never told and
cannot place (P456). `overhear_w` rides the v2.8 `hearing`
trait (×(1−hearing_loss)).

### 6.65 Synchrony — the clock in the cue (new in v4.5)

[CONSENSUS] May, Hasher & Stoltzfus (1993, *Psychological Science*
4:326): age differences in recognition nearly vanish at each group's
peak circadian time — older adults are overwhelmingly morning types,
younger adults evening/neutral, and "aging deficits" are partly
synchrony artifacts. May (1999, *PBR* 6:142): the synchrony effect is
largest for controlled, effortful processing. May, Hasher & Foong
(2005, *Psychological Science* 16:96): explicit stem-cued recall peaks
at optimal time but implicit memory is BETTER at off-peak — the two
retrieval routes run on different circadian schedules.

Mechanics: the `chronotype` latent trait (∈ N(0,1), morning-positive)
compiles to `chrono_peak_hr` = routine wake-hour + 3 + 4·(1−chrono)/2
(morning type wakes 6 → peak ~9; evening type wakes 9 → peak ~17; the
world's routine table is the ground truth — P473). Encoding and
controlled retrieval both scale:
`syncMatch = 1 − |tod − chrono_peak_hr|/12` (triangular, hour-modular);
`E *= 1 + sync_gain·syncMatch`; retrieval drive `w += sync_gain·0.5·
syncMatch` at recall time. Intrusive/involuntary recall runs the
implicit schedule: `intrusion drive *= 1 + sync_implicit_flip·
(−syncMatch)` — the off-peak involuntary bonus (May et al. 2005).
Age knots: `chrono_peak_hr` shifts −1 hr per two decades past 60
(older → morning); `sync_gain` magnitude ×= `1 + sync_age_gain·
age_eff/70` (the 2025 systematic review: synchrony evidence in 83% of
older-adult studies vs 45% of young-adult studies — Facer-Childs
review tradition, HYPOTHESIS on exact slope). Shift-work/rotating
schedules flatten the peak: `chrono_peak_hr: null` disables the term
(nurses, per the cast — HYPOTHESIS, no direct citation).

### 6.66 What memory is FOR — functional retrieval weights (new in v4.5)

[CONSENSUS] Autobiographical memory is functional, not archival: the
TALE (Bluck & Alea 2002, *Intl J. Aging* 56:113; Bluck 2003) names
three functions — **self-continuity**, **directing behavior**,
**social bonding** — and the RFS (Webster 1993) shows stable
individual differences in which function dominates. Harris, Rasmussen
& Berntsen (2014, *Consciousness & Cognition* 27) find involuntary
memories serve the same functions — function is a retrieval-selection
property, not a deliberate-use property.

Mechanics: spontaneous-retrieval candidate scoring (remind/recall/
mind-wander paths) gains a selection term `funcMatch`:
`func_self` matches `selfDef` records and high `self_rel` records;
`func_dir` matches records whose topics intersect the active `concerns`
set or carry `open` loops (the past consulted for a current decision);
`func_soc` matches records with `shared_with` ∩ currently co-present
characters (the story this audience can share). Selection weight
`+= func_X · funcMatch` in the candidate score ONLY — E, θ, and the
retrieval threshold are untouched: a functional profile changes what a
character habitually surfaces, never what they can recall. Defaults
uniform (1/3 each); profiles pin the dominant function(s). The three
weights sum-normalize at use; a profile of all-low funcs = the
character who rarely reminisces at all (low spontaneous-retrieval base
rate, rides `mw_rate`).

### 6.67 Current concerns — the wants gate (new in v4.5)

[CONSENSUS] Klinger (1975, 2013): thought flow — including involuntary
thought — is organized around *current concerns*, the states between
committing to a goal and resolving it; concern-related cues have
privileged capture. Conway & Pleydell-Pearce (2000, SMC model): active
goals shape autobiographical construction. Marsh, Hicks & Bink (1998,
*JEP:LMC* 24:350): completed intentions DEACTIVATE — goal resolution
removes the activation advantage (the prospective-memory complement of
the concern gate).

Mechanics: `ProfileInput.wants` compiles to `concerns: [{topic,
weight, clock, createdDay}]` on the character record — `clock:
"week"` entries decay weight ×0.5 per 7 days unresolved (urgent and
transient), `"season"` ×0.5 per 45 days, `"long"` persistent.
Encoding: event topics ∩ concerns → `E *= 1 + concern_gain·
concernMatch` (max over matches; concern_gain 0.25). Records born
inside a concern match are tagged `concern:<topic>` and carry
`concern_intrude` (0.08) additive intrusion drive while the concern is
active. On resolution (world sets `resolvedDay`): matching records'
intrusion bonus decays linearly to 0 over `pep_days`-style ~7 days —
the closure is gradual, not a switch (Marsh et al. is about PM
intention activation; the episodic-tag release is HYPOTHESIS).
Distinct from §4 open-loops: open-loop = an interrupted task with a
closure urge; concern = a standing goal that boosts ENCODING relevance
and intrusion salience for everything tagged to it. The two compose —
an interrupted concern-relevant task gets both.

### 6.68 Fabrication direction — liars split (new in v4.5)

[CONSENSUS, effect size DEBATED] Refines §6.9's population
`fab_inflate`. Polage (2004, *Applied Cognitive Psychology* 18:455):
after lying about non-events, MOST participants showed fabrication
DEFLATION — likelihood ratings for the lied-about event DROPPED; only
10–16% showed maximal inflation. Polage (2012, *Memory* 20:837):
inflation correlates with habitual lying frequency, dissociation, and
low discomfort while lying; source-monitoring ability is the
moderator. Chrobak & Zaragoza (2008): forced confabulation → ~half
develop false memories within 8 weeks. Otgaar-lab (2018): telling a
lie inflates belief more than merely planning it.

Mechanics: two new per-char pins compile from the bible's `truth`
register — `fab_dir ∈ [−1, +1]` (fluent comfortable fabricator → +;
scrupulous/omitter → −) and `lie_freq ∈ [0,1]` (dose: the mechanism
only fires on emitted `claim:true` fabrications, so frequency is
exposure). `fab_discomfort ∈ [0,1]` is the deflation gate. §6.9's
flip becomes `flip_p = source_confuse_flip·(1 + fab_inflate·
max(0, fab_dir)·(1−fab_discomfort))·discrim_mult` — only the positive
tail inflates. Deflators instead strengthen the TRUE record: verbatim
fields of the lied-about event get `R += fab_deflate_gain·(−fab_dir)`
— rehearsing "what really happened" to keep the story straight is
itself rehearsal (HYPOTHESIS for mechanism; the behavioral deflation
is Polage's). **Omission is not fabrication:** a `truth` register of
omission/redirect writes NO claim, so no flip, no deflate — the true
record sits untouched and the omission act encodes normally (Victor's
register, Carmen's money-silence). Locked null: `meta_cal` does not
exempt inflation — the liar cannot think their way out (source
monitoring, not metacognition, is the moderator).

### 6.69 Collaborative memory — two heads, less recall, more coverage
(new in v4.5)

[CONSENSUS] Weldon & Bellinger (1997, *JEP:LMC* 23:1160): groups
recalling together output LESS than the same people pooling solo
recalls — collaborative inhibition, caused by retrieval-strategy
disruption (Basden, Basden, Bryner & Thomas 1997): listening to a
partner's search derails your own. Harris, Keil, Sutton, Barnier &
McIlwain (2011): long-term couples show it too — intimacy does not
exempt. But Wegner's transactive systems (1987, *Psych Rev* 94:186;
Wegner, Erber & Raymond 1991) allocate domains: on the partner's
topics, the couple out-covers either solo member.

Mechanics: `jointRecall(a, b, topic)` — emitted when two co-present
characters reminisce/discuss together. Each participant's recall gets
`θ += collab_inhib` (0.10) and `search_breadth` −25% — the partner's
retrievals disrupt own-search. In exchange: `collab_cue_p` (0.6) per
miss — the partner's emission can cue a rescue through the normal
retell/encode path; and topics in `PersonModel[partner].knowsTopics`
resolve via referral (§6.14) at the PARTNER's θ — directory, not own
search. Net contract: dyad output < solo sum on shared topics
(inhibition), dyad coverage > either solo on split topics
(division of memory labor). Extends §6.14's `transact_loss`: the
directory is what the inhibited search was renting. Age-flat,
cite-guarded (older-couple magnitudes understudied — HYPOTHESIS
would predict larger inhibition via search_breadth already being low;
the knot is left flat until evidence).

**v4.8 — cross-cueing (RC§52):** partner emissions enter the
listener's context as ext-origin cues weighted by closeness:

```
cue_j ×= crosscue_mult:  RelEdge < crosscue_close_bar (0.7) →
    crosscue_far (0.4); ≥ bar → crosscue_close (0.8) —
    approaches but never reaches selfcue_mult (Andersson &
    Rönnberg 1997 friends; PMID 41620537 partner cues resemble
    self-cues). Strangers' cues near-ordinary — this IS the
    inhibition: collaborative deficit = the cue gap between two
    organizations (reduced-cue-effectiveness account)
emergent records (surfaced ONLY via partner cues, unreachable
    solo): capped at crosscue_emergent_p (0.03) — the Meudell
    et al. 1992/1995 emergent-memory null during bouts;
    re-exposure strengthening rides §5.9 and CAN surface on
    the listener's next SOLO recall (Blumen & Rajaram 2008
    delayed benefit — free via existing machinery)
```

Dyad output stays < pooled solo on shared topics (P520 — the
inhibition is not erased; closeness narrows it, never flips it).

### 6.70 Recollection-only monitoring — the confidence lie has a scope (new in v5.0)

Dodson, Bawa & Krueger 2007 (Psychol Aging 22:122 — verified) +
Dodson, Bawa & Slotnick 2007 (JEP:LMC 33:169 — verified):
monitoring impairment is specific to recollection-demanding
probes (source ID, pairings, order, verbatim fields) — recognition
and semantic-knowledge confidence stays calibrated. And the
source d' deficit vanishes once illusory recollections are
modeled: old source errors are misrememberings WITH
phenomenology, not guesses.

```
emissions requiring recollection components (source tag, pairing,
order, verbatim field): reported conf += mon_source_tax(age_eff)
    // 0 → 0.1@65 → 0.2@80 — calibration gap, recollection-only
wrong-source/pairing emissions: with p = illus_recol_p(age_eff)
    // 0.05@50 → 0.15@70 → 0.3@85 — emit reportMode:"remember",
    // vivid first-person phenomenology despite being wrong
familiarity-level & semantic emissions: unchanged v2.1 machinery
```

Dialogue consequence: an old character's "I'm sure Marta said it"
is overconfident; "I'm sure I've seen that face" is not (P544).

### 6.71 Importance draws concentrate on the bump (new in v5.0)

Rubin & Schulkind 1997 (Mem & Cogn 25:859; Psychol Aging 12:524 —
verified): word-cued AMs at 70 show childhood dip + power-function
recency + 10–30 bump; but "5 most important memories" at 70
concentrate in the 20–30 decade while young importance draws
mirror cued draws. Importance-ranked emission (life-review,
"most important", eulogy-style queries) at age_eff ≥60 multiplies
emission weight by `bump_emit_w(age_eff)` (1.0≤55 → 2.0@70 →
2.5@85) inside the record's bump window (encodeAge 18–30, uses
existing bump machinery — no hard band). Cued draws keep the
ordinary recency shape (P542 sign-lock).

### 6.72 Mood-congruent confabulation and the liberal criterion (new in v5.1)

Ruci, Tomes & Zelenski 2009 (Cogn Emot 23:1153 — verified):
mood-congruent DRM lures intrude more, with more "remember"
judgments. Corson & Verrier 2007 (verified): LOW-arousal moods
raise false recognition regardless of valence (liberal criterion);
arousal tightens item-specific memory. §6.2 confab_fill content
selection weights candidate fills toward mood-matching valence at
`mood_confab_k` (0.25) — a sad character's invented details skew
negative. `lure_accept` shifts `+mood_crit_shift` (0.1) when
|C.mood|<0.3 && C.arousal<0.3, and −mood_crit_shift when
C.arousal≥0.6 (P552).

### 6.73 Repetition habituates the tag, consolidates the script (new in v5.1)

Recurring-emotional-events study (J. Neurosci. 2025 — verified):
the advantage rides FIRST-encounter amygdala + stable neocortical
reinstatement across repetitions. Script literature (Fivush 1984;
Brewer 1986): instances go generic, script dominates. On
encodeEvent matching an existing record's schema signature
(participants+place+type, sim ≥ merge_thresh·0.9):
`arousal_tag *= (1 − rep_habit_k)^n_recur` (0.15); instance mints
thin; the §4.20 script node gains `rep_script_gain`·n_recur (0.2).
LOCKED exception: any recurrence at encode-arousal ≥0.8 resets
n_recur — escalation is a NEW event. The n_recur=0 instance keeps
full encoding and anchors the script — "the first time he yelled"
outlives every subsequent yell (P554).

### 6.74 Emotional inertia — mood has weather (new in v5.1)

Kuppens, Allen & Sheeber 2010 (Psychol Sci 21:984) + Koval et al.
2012/2013 (verified): affect autocorrelation is a stable trait,
higher in maladjustment, prospectively predicts depression.
`emo_inertia` ∈[0,1] (default 0.3; depressive modifier 0.7) gives
C.mood documented persistence semantics:
`mood_t+1 = mood_t·emo_inertia + input·(1−emo_inertia)`. High
inertia lengthens every mood-keyed leg — §5.4 mood congruence,
§6.72 confab skew windows, §5.56 nostalgia-trigger regime; low
inertia resets the retrieval ecology with each event. This is the
state variable the mood clauses always assumed; flagged
valence-asymmetry (negative-affect inertia is the clinical leg) as
a future refinement (P553).

### 6.75 First-account anchor — incumbency on empty fields (new in v5.2)

Ross, Lepper & Hubbard 1975 (JPSP 32:880 — verified): impressions
formed on false feedback persevere after total discrediting; only
process debriefing (explaining the mechanism) clears them. When a
field holds NO surviving candidate, the first credible candidate to
arrive gains `anchor_w` (×1.5) effective weight in all future
candidate competition — the incumbent advantage. Discrediting the
anchor's source (§6.6 correction or credibility collapse) drops it
to `persever_resid` (0.4) effective weight and flips beliefStatus —
content stays competitive and re-wins on later corroboration. The
only full eviction: a correction that explains the distortion
mechanism itself (process debrief) clears the anchor flag. Sibling
of §6.6 CIE but distinct: CIE is residual inference weight after
retraction; the anchor is ordering privilege in competition (P555,
P556).

### 6.76 Test-potentiated misinformation — recalling first makes you
### worse (new in v5.2)

Chan, Thomas & Bulevich 2009 (Psych. Sci. 20:66 — verified):
immediate cued recall of a witnessed event INCREASED later
misinformation adoption, younger and older adults both — the
"reversed testing effect" (retrieval potentiates new learning AND
exposes the retrieved details to interference — the §6.31 window
with teeth). Accounts arriving within `test_window` (1 day) of a
successful recall/emission of the same record take
`test_pot_mult` (×1.3) on §6.3 p_adopt. Emitted field values —
right or wrong — additionally take `own_emit_gain` (0.1)
candStrength and provenance "claimed" (self-authorship, cf.
§6.46 self_cred): a guessed detail becomes an owned detail. The
potentiation applies to sample-mode recall; §6.50 discriminate
mode does not retro-protect what casual recollection exposed
(P557 — sign-locked against the intuitive direction).

### 6.77 Schema fill at encoding — the books that weren't there
### (new in v5.2)

Brewer & Treyens 1981 (Cogn. Psych. 13:207 — verified): schema-
expected-but-absent objects falsely recalled; expectancy predicts
false inclusion; integration hypothesis = the trace is born mixed.
Lampinen, Copeland & Neuschatz 2001 (verified): errors carry
"remember" phenomenology. At encodeEvent, for each schema-expected
field the event did NOT carry (expectancy ≥ `exp_thresh` 0.6):
mint a verbatim candidate at `exp_fill_p` (0.25), candStrength =
enc·0.6, provenance "schema" (invisible to the character).
Sign-lock vs §6.2: exp_fill candidates exist BEFORE first recall;
confab_fill mints at reconstruction only — first tellings already
contain the absent books. Saliency exception: high-salience
unexpected items encode normally — the fill targets expected-
absent fields only (P558).

### 6.78 presentEvidence — proof breaks the plausibility gate (new
### in v5.2)

Wade, Garry, Read & Lindsay 2002 (doctored photo → 50% full/partial
childhood false memories); Nash & Wade 2009 (doctored video →
internalized false confessions + confabulated details); Nash, Wade
& Lindsay 2009 (evidence × imagination additive-to-superadditive);
Kassin & Kiechel 1996 (fabricated evidence → internalized guilt +
consistent confabulation) — all verified. `presentEvidence(charId,
artifact, claim)`: sourceCredibility = `ev_cred` (0.95, the
artifact ceiling — proof outranks every speaker); the claim
BYPASSES plaus_min (the artifact IS the plausibility);
`retro_evid` (0.2) mints inflated encoding-condition candidates —
"I must have been there." Evidence + imagineEvent runs both legs.
Artifact records carry `authentic` ∈ {real, doctored} — visible to
ledger/history browser, never the character; detection flips
credibility to ~0 and leaves the §6.75 residue (P559).

### 6.79 Reason fields — "why" is minted on demand (new in v5.2)

Nisbett & Wilson 1977 (Psych. Rev. 84:231 — verified canonical):
fluent, confident, demonstrably wrong causal self-reports —
reasons are inferred, not retrieved. Fields of class
reason/motive NEVER write verbatim at encodeEvent. At the first
probe demanding a reason (`answerProbe` `why:true`), a candidate
mints at `why_mint_p` (~1.0) from schema ⊕ selfModel ⊕ current
appraisal, provenance "confabulated", NORMAL confidence — the
teller can't tell. The minted reason then anchors and rehearses
like content (§6.75): the first confabulated answer becomes the
true reason. Accuracy is governed by schema/selfModel quality —
sometimes the confabulation is right, which is why it feels like
access (P560).

### 6.80 The fiction channel — labeled-untrue still plants (new in
### v5.2)

Marsh, Meade & Roediger 2003 (J. Mem. Lang. 49:519 — verified):
>35% misinformation answers vs <10% baseline from stories, a
week later, with "already knew it" misattribution; Marsh, Balota &
Roediger 2005 (aging arm). Accounts framed as story/joke/
hypothetical route through hearAccount with sourceCredibility ×
`fic_penalty` (0.5) — a discount on the source, not a quarantine.
Semantic/world-knowledge fields absorb most; episodic hearsay uses
§6.3. Absorbed fiction candidates gain `fic_known_prior` (0.15)
fluency on first emission; hearCount compounds regardless of
frame. Distinct from §6.61 sleeper (no discrediting event needed —
the unreliable tag is present from birth and doesn't block) (P561).

### 6.81 Corroboration genealogy — N hearers, one witness (new in
### v5.2)

Meade & Roediger 2002 + Roediger, Meade & Bergman 2001 (verified):
social contagion transfers false recall under warnings and source
tests; bigger for schema-consistent items and weak encodings;
arrives as "know" not "remember". §6.7 believe_p's corroboration
term counts candidate ORIGINS, not holders: two accounts
corroborate only if their provenance trees share no common
ancestor (`corrob_root_req`: true). hearAccount appends the
hearer-known lineage (speaker chain); unknown-origin hearsay
counts as independent only below `lineage_conf` (0.5). A rumor
through a clique plateaus at single-source belief; two genuinely
independent observation chains move believe_p to "fact" — the
difference between gossip and news (P562).

### 6.82 Re-appraised affect — the feeling tracks today's reading
### (new in v5.2)

Levine 1997 (JEP:G 126:165 — verified): recalled emotion distorts
systematically toward CURRENT appraisals; Levine & Bluck 1997
(same finding, older adults). Distinct from §5.5 mood_bleed
(current mood → report) and fading affect (tag decay): this is
re-appraisal OF THE EVENT. Emitted affect:
`emoTag_out = (1−reappr_k)·emoTag_stored + reappr_k·appraise(event, now)`
with `reappr_k` 0.35; appraise() reads current belief/RelEdge
state. Stored tag never mutates — only the emission. trauma:true
records exempt; flashbulb reception-tags reappraise at half rate
(P563 — sign-locked: reconciled ex-friends' old fights report
warmer; reignited feuds report colder).

### 6.83 Yield and shift — the two-factor suggestibility split (new
### in v5.2)

Gudjonsson Suggestibility Scales (Gudjonsson 1984/1997 — verified):
Yield (leading questions) and Shift (negative-feedback flips) are
factorially separate; Yield contains internalization + compliance,
Shift is mostly compliance (Otgaar-line source-ID studies —
verified). `misinfo_suscept` retained as aggregate but decomposes:
`yield_suscept` (0.35) weights §6.3 p_adopt on leading/
presupposing accounts (§6.43, §6.48) — absorbed content
internalizes; `shift_suscept` (0.35) weights answer-flips under
negative feedback/pressure (§6.44 disconfirm, §6.59, §6.45) —
shift-driven flips write the flipped answer as "claimed" at only
`shift_int_frac` (0.4) of normal strength: pressure flips mouths
faster than minds. Trait mapping: yield loads on distrust/wmc
channels; shift loads on neurotic/social-anxiety/compliance —
the two dials decorrelate in profile space as the GSS factors do
(P564).

### 6.84 The interrupted deed — intentions mint completions (new in
### v5.2)

Albarracín et al. 2020 (PSPB 47:38 — verified): mundane intentions
misremembered as enacted; confusion grows with intention↔act
similarity; monitoring THE ACT rescues, monitoring the intention
does not. Scullin, Bugg & McDaniel 2011 (verified): ~25%
commission errors — finished intentions re-fire under their cue.
Armed Intention records that are routine/script-consistent mint,
on each dwell/rehearsal, a "performed" candidate on the action
slot at `intent_done_p` (0.08 × intention↔act similarity) — the
rehearsed plan reads as a thin memory of having done it ("I paid
the rent" — false-completion phantom on the chore loop). Mirror
channel: fired intentions re-fire at `comm_err_p` (0.2) under
load/fatigue. Rescue: act-encode attention ≥ att_min+0.1
suppresses intent_done_p to ~0 — attention on the doing, not the
intending (P565).

---

### 6.85 The ego's ledger — self-fields dense, co-actor fields thin
### (new in v5.3)

Ross & Sicoly 1979 (JPSP 37:322 — verified): recalled own-vs-other
contributions to shared work sum over 100%; asymmetric availability,
not just motivational claiming. Mechanism here is record-level: at
encoding of multi-actor events, fields tagged `actor:self` gain
E ×(1 + `sself_enc`·self_srv) and `actor:other` fields lose
E ×(1 − `sself_other_loss`·self_srv). No retrieval change — w_self
cue-matching already favors self-tagged records; the asymmetry is
born in the stored record, so two co-actors' later reports sum
>100% emergently (P566). Locked nulls: solo events untouched; all
misinfo/distortion params untouched — bookkeeping asymmetry, not
suggestibility.

### 6.86 Flat affect and split attention — two everyday leaks (new
### in v5.3)

**Alexithymia (affect-channel deficit + fluent confabulation).**
Systematic review 2019 (PMC6497026 — verified): emotional-material
memory reduced, neutral intact; Vermeulen & Luminet 2009 (PAID
47:305 — deficit concentrated on emotion words); Luminet et al.
2005 (shallow affect encoding, not a retrieval block); Muir, Madill
& Brown 2016 (Cognition & Emotion 31:1392 — reduced fading-affect
bias). `alex_flat` (0–0.7): emoTag field-write richness and the
w_emo arousal boost both scale ×(1 − alex_flat·alexith) at encoding.
`alex_confab` (0–0.9): when a probe demands affect the record
lacks, the §6.79 why-mint machinery supplies fluent, confident,
invented feeling — the character answers, does not go silent.
`neg_affect_decay` shifts toward 1 by ×(1 − 0.15·alexith)
(Muir 2016 direction: the unfelt feeling also never fades). Locked
nulls: neutral material = 0; non-affective specificity = 0 (P567).

**Media multitasking (filter leak, not storage leak).** Ophir, Nass
& Wagner 2009 (PNAS 106:15583 — verified): heavy multitaskers worse
at filtering irrelevant representations; Uncapher et al. 2016 —
more mind-wandering, worse episodic performance; Uncapher & Wagner
2018 — the cost runs through encoding attention, not storage.
Loadings: `plist_suppress` ×(1 + 0.30·media_m),
`source_confuse` ×(1 + 0.20·media_m), `omit_p` +0.03·media_m on
routine events, `search_breadth` +1·media_m (broader, shallower).
Locked nulls: all beta_* decay rates = 0; enc_base on attended
high-salience events = 0 (P568).

### 6.87 Hard beginnings, unsettled clocks, and the now-tax (new in
### v5.3)

**`early_adv` ∈[0,2] — baseline-setting trait.** Evans & Schamberg
2009 (PNAS 106:6545 — verified): childhood poverty → adult WMC
deficit via allostatic load; control deficit, not storage; survives
income mobility. Loads only on wmc-side params:
`misinfo_suscept` ×(1 + 0.08·a), `source_confuse` ×(1 + 0.12·a),
`plist_suppress` ×(1 + 0.15·a), `stress_retrieve_loss`
×(1 + 0.15·a). Locked nulls: enc_base, beta_*, semantic = 0
(P569). Bible-visible backstory trait — set from childhood
circumstances, never present personality.

**`circ_irr` — irregularity as variance.** Cho 2001 (Nat Neurosci
4:567 — direction verified, magnitude DEBATED); Costa 2010
shift-work reviews. Each dailyMemoryTick draws
peak_hour += N(0, `circ_jitter`·6h) and sleepFactor
×exp(N(0, circ_jitter·0.15)); `iiv_sigma` += 0.5·circ_irr·base.
Locked null: ALL mean-level params = 0 — a variance claim, never a
deficit claim (P570).

**`pain_state` ∈[0,1] (state) / `chron_pain` ∈[0,2] (prevalence
trait).** Moriarty et al. 2011 (Prog Neurobiol 93:385 — verified:
pain taxes via continuous attentional demand); Berryman et al. 2013
meta (d ≈ −0.31..−0.57 WM/verbal). `E` ×(1 − `pain_tax`·p) on
attended events (pain_tax ≈ 0.15), ×2 on low-salience; `omit_p`
+0.10·p on routine records; `chron_pain` → complaint_k +0.10.
Locked nulls (P571): retrieval of pre-pain records = 0; post-pain
residue = 0 — anterograde attention tax only.

**`task_load` ∈[0,1] (context field on encodeEvent/recall).**
Marsh & Hicks 1998 (JEP:LMC 24:350 — verified: PM degrades under
ongoing-task demands; monitoring bandwidth spent, intention
intact). `pm_self` effective ×(1 − `task_load_cost`·l),
task_load_cost ≈ 0.5; `omit_p` +0.15·l on low-salience events;
peripheral-field enc ×(1 − 0.20·l). Locked nulls (P572): non-PM
attended encoding = 0; stored strength = 0; no carryover when the
load lifts.

### 6.88 Material lock, kinder recall, and the mandated null (new
### in v5.3)

**`music` ∈[0,2] — channel-locked advantage.** Chan, Ho & Cheung
1998 (Nature 396:128 — verified: verbal memory advantage, visual
null, t=1.00 n.s.); Ho, Cheung & Chan 2003 (child arm replicates
the split). E on lang-tagged verbal fields ×(1 + 0.04·music);
retell narrative fluency +0.03·music. Locked null: every
non-verbal channel = 0 — a musician who remembers faces better is
the bug P573 catches.

**`rosy` — the rosy-view arc.** Mitchell et al. 1997 (verified
three-point arc: anticipated > experienced < remembered valence).
`rosy_retro` (0–0.4): on emission, positive-arc events' reported
emoTag tilts positive — implemented as a direction bias on §6.82
`reappr_k`; negative-detail fields drift at drift_p ×(1 + 0.5·rosy)
(annoyances fade faster than pleasures — the asymmetry IS the arc);
§4.28 anticip traces mint at +0.1·rosy positive skew. Locked nulls
(P574): non-valenced fields = 0; trauma-flagged records = 0 (rides
§6.82's existing gate).

**`birth_order` — the mandated null.** Rohrer, Egloff & Schmukle
2015 (PNAS 112:14224 — verified: N=20,186, three national panels,
no effects on Big-Five traits; ~0.1 SD intelligence tilt only);
Damian & Roberts 2015 concur. The field exists in IndivTraits as a
bible-visible DOCUMENTED NULL: every loading locked at 0.0, R-row
zero. P575 null-locks it — a trait layer that cannot express "no
effect" is unfalsifiable, and unfalsifiable is unbelievable.

---

### 6.89 The spotlight asymmetry — expected others'-recall anchors on own strength (new in v5.4)

Gilovich, Medvec & Savitsky 2000 (JPSP 78:211 — verified, 5 studies):
people overestimate observers' notice/recall ~2×, via anchoring on
own phenomenology + insufficient adjustment. New read:
`expectOtherRecall(self→witness, record)` returns
`min(1, own_R·spot_mult)·(1−0.15·days/30)` — the character's model
of what a witness stored is built from the character's OWN record
(which carried w_self), not the witness's real E. When a witness
demonstrably fails recall of a self-event the character expected
known, mint an offense record at `spot_offense_p` (0.3). Locked
nulls (P579): no direct read of the witness's actual R (the bias
is the mechanism — a calibrated expectOtherRecall is the bug);
spot_mult never <0 at any trait loading (nobody assumes they were
invisible).

### 6.90 The promise ledger — commitments are asymmetric Intentions (new in v5.4)

`Intention` gains `commitment:true` + `creditor:charId` fields
(world tags promises/debts/favors at mint). The creditor holds a
CLONE record of the expectation — cue-bound at
`cueBind·promise_cred_w` (1.3, self-relevant expectation binds
hard); the debtor's own intention binds at `cueBind·promise_debt_w`
(0.8) and resolves only via trigger or `pm_self`. On unresolved
trigger past dueDay, the creditor clone mints a breach-candidate
record (valence −) at `breach_p` (0.6); the debtor side expires
silently. Availability asymmetry source: Greenberg & Westcott
1983 indebtedness + Ross & Sicoly availability (sign DEBATED →
HYPOTHESIS, bounded). Locked nulls (P580): the debtor record
gets no rehearsal from creditor expectation (ledgers don't
couple); breach mints on the CREDITOR side only — the debtor's
surprise is the phenotype.

### 6.91 Hidden-profile starvation — group talk samples the shared corpus (new in v5.4)

Stasser & Titus 1985 (JPSP 48:1467 — verified); Stasser, Taylor
& Hanna 1989; Stasser et al. 1992 (solve-set 67% vs judge-set 35%
hidden-profile discovery). In group-discussion record selection
(upstream of the §42 novelty gate): surface probability ∝
`holders(record)^hp_exp` (0.7), where holders counts group
members whose store contains the record. `solve_set_relax` (0.5)
scales hp_exp when the task is tagged problem-with-answer.
Unshared records receive zero retell rehearsal — the shared
corpus compounds while unique knowledge decays solo. Locked null
(P581): the novelty gate cannot rescue a never-sampled record —
sampling precedes novelty.

### 6.92 Truth-default and the suspicion residue (new in v5.4)

Levine 2014 (J Lang Soc Psych 33:378 — verified TDT): belief is
the passive default; suspicion requires a trigger; cue/demeanor
reading is the FAILED detection path. Bond & DePaulo 2006
(meta, 24,483 judges — verified): 54% accuracy, 61% truths vs
47% lies — truth bias, not lie blindness. Implement: `hearAccount`
believe_p floor = `truth_def_bias` (0.61) absent triggers; NO
demeanor/cue params exist (locked null). Triggers: content vs own
field > conform_gate conflict; plaus < plaus_min·0.7; speaker
credibility < 0.3; third-party flag. On trigger: mint `suspicion`
tag (M-tier) on PersonModel[speaker], str 0.3, decay
β_source·`susp_persist` (0.7 — slower than source decay; the
doubt outlives what it doubted). Tag effect: speaker's future
believe_p ×(1 − 0.2·susp_str) — a soft prior, never a veto,
never emitted as a value (P582).

### 6.93 Co-presence decays to the usuals (new in v5.4)

Simons & Levin 1998 (Psychon Bull Rev 5:644 — verified): ~50%
miss a mid-conversation partner swap; detection moderated by
social group. Multi-actor events mint an `attendees` list; each
non-interacting co-present member encodes at `E·copres_w` (0.6),
×(1 − `group_blind`·(1−same_group)) for out-group attendees
(0.4). At recall, missing attendee slots fill by schema at
`copres_schema_fill` (0.3) — sampling from the place's routine
co-occurrence distribution; the usuals get inserted when absent,
one-timers get dropped when present (P583).

### 6.94 Memory labor — the relational calendar is a role (new in v5.4)

Rosenthal 1985 (J Marriage Fam 47:965 — verified): >half of
families name a kinkeeper (~3/4 women, median tenure ~20y,
mother→daughter transmission); kinkeeping is a position in the
division of labor. New IndivTrait `keeper` (bible-pinnable).
Relational Intentions (birthdays, rituals, overdue-contact flags)
mint at p ∝ (0.3 + `keeper_mint`·keeper) — the keeper holds ~2–3×
the relational calendar (keeper_mint 0.7). The keeper's emitted
reminders act as OTHER characters' external PM cues at
`keeper_cue_w` (1.0 — full cue). Keeper absence orphans the
calendar: other members' relational PM falls to uncued `pm_self`
rates (P584). Locked null: keeper boosts no non-relational
channel — a role allocation, not a capacity.

### 6.95 The liar's ledger — denials and fabrications diverge (new in v5.4)

Otgaar & Baker 2018 MAD framework (*Memory* 26:2 — verified):
mnemonic outcome is lie-type-contingent. Otgaar, Howe, Smeets &
Wang 2016 (JARMAC 5:168 — verified): denial-induced forgetting —
own denials undermine memory, external denials undermine belief.
Pickel 2004 — self-generated misinformation becomes believed.
Otgaar et al. 2014 — fabrications keep strong source memory,
denials keep weak. Two new ops on the liar's own store:
`deny(record, field)` — denied field decays ×(1+`dif_mult`) (0.5)
for `dif_days` (7); the denial act encodes with
`deny_src_weak` (0.5) source binding. `fabricate(content)` —
mints src-flagged record; gen_gain applies; lie-src flag decays
at β_source·lie_src_weak while content accrues normal retell
fluency — at flag death it competes unmarked (Pickel path).
Locked null (P585): denial and fabrication MUST NOT share a code
path — opposite source-memory signs.

### 6.96 Exclusion encodes hot — thin record, hot tag, widening scope (new in v5.4)

Williams 2007 ostracism program (need-threat, fast/automatic);
Eisenberger, Lieberman & Williams 2003 (Science 302:290 — dACC
social-pain overlap). World tags `exclusion:true` events;
encoding E ×(1+`ostrac_gain`) (0.6), decay β ×(1−`ostrac_persist`)
(0.3), arousal +0.2. Reconstruction drifts reported scope toward
total at `excl_scope_drift` (0.2) — one-person slight reads as
unanimous. Excluder PersonModel gains cheaterLoad at stt-like
rate. Post-exclusion, ambiguous omissions re-tag as exclusion
candidates at `ostrac_vigil` (0.2) — the hypervigilant loop
(P586).

### 6.97 Living-in-history anchors — disruption, not importance, writes the landmark (new in v5.4)

Brown et al. 2009 (Psych Sci 20:399 — verified, 18 samples):
public events organize autobiographical time ONLY when they
disrupted daily life (war/earthquake yes; 9/11-for-Americans no).
Broadcast events carrying `disrupt ≥ h_dap_thresh` (0.7 — routines
actually altered) mint `h_dap:true` anchor records,
permastore-eligible. `dateEstimate` (§6.15): same-era events get
σ ×(1−`anchor_date_gain`) (0.3); cross-anchor dating resolves as
relative ("before the fire"). Locked null (P587): arousal/conf
alone never mints an anchor — flashbulb certainty is not a
calendar object.

### 6.98 Impression revision asymmetry — the moral ledger (new in v5.4)

Mende-Siedlecki, Baron & Todorov 2013 (J Neurosci 33:19406 —
verified): diagnostic value drives domain-asymmetric updating;
Brambilla et al. 2021 (morality dominates at updating);
Reeder & Brewer 1979 (immoral diagnostic, moral weakly;
ability inverts). PersonModel update gains: `rev_moral_neg`
(1.5), `rev_moral_pos` (0.4), `rev_abil` (0.8 symmetric). Once
eval < `moral_bad_thresh` (−0.3) on moral evidence, subsequent
moral-positive updates count at 1/`moral_repair_k` (3) — the
redemption tax (P588).

---

### 6.99 The self-view trait — `self_est` finally owned (new in v5.6)

The spec has been *borrowing* a self-view since v0.9 — `tdist_self`
(§6.15, Ross & Wilson self-esteem-moderated distancing), `selfDiscrepant`
(§5.39), `mnem_neg` (§6.34b) all reference a self-evaluation that was
never a trait. v5.6 owns it: **`self_est` ∈ [0,1]**, an IndivTrait-class
bible pin (population default ~0.62; trait-σ mapping σ·0.15 + 0.62,
clamped). It is the person's standing evaluation of their own worth —
NOT `SelfModel.self_est.global` (that's the metamemory estimate of
memory competence; a character can think her memory is bad and herself
fine, and vice versa — the two are independent channels, P614 locks the
confusion out of the generator). `self_est` loads: `tdist_self` effective
weight (§6.15 — high self_est pushes failures farther), `mnem_neg`
gating (§6.100), observer-perspective emissions on self-discrepant
records (§5.39 feeds off it via `selfDiscrepant` polarity), and the
savor/dampen balance (§6.105, Wood, Heimpel & Michela 2003 — low
self-esteem *dampens* positive affect rather than savoring it).

### 6.100 The consistency gate — mnemic neglect only neglects the
### inconsistent (new in v5.6)

**Correction to §6.34b.** The mnemic-neglect literature's actual
boundary: the recall penalty applies to feedback that is negative,
central, AND **self-inconsistent** — it is incongruence-negativity
management (Sedikides & Green 2000, *JPSP* 79:906 — the model's own
original name). A person with a negative self-view does not protect
against negative self-referent material; it is *consistent*, and it is
retained — the phenotype is the insult-collector, not the
self-protector (Green, Pinter & Sedikides 2004; Newman, Duff &
Baumeister 1997). Model: feedback records carry
`selfCongruent` (does the content match `self_est`'s valence and the
aspect's standing self-schema). The §6.34b drive penalty becomes:

```
mnem_pen = mnem_neg·(1 + 0.5·max(0,defens)) · (1 − selfverif_w·selfCongruent)
```

with `selfverif_w` ∈ [0,1] (default 0.6 — Swann's self-verification
line: consistency preference is real but usually weaker than
enhancement; selfverif_w > ~0.7 = the self-verifier who prefers the
true-but-bad). `selfCongruent` for negative-central content ≈
(1 − self_est) blended with per-aspect schema. Existing boundary
UNTOUCHED and re-locked: the effect is **recall-only** — recognition
shows no mnemic neglect (Green, Sedikides & Gregg 2007 — "forgotten
but not gone"), and self-affirmation averts it (Sedikides & Green 2016
review). P602 sign-locks the crossover: low-self_est ×
negative-consistent must recall ≥ positive control.

### 6.101 Self-complexity — how many rooms the self has (new in v5.6)

**[DEBATED]** Linville (1985 *Social Cognition* 3:94; 1987 *JPSP*
52:663): self-knowledge is partitioned into self-aspects (roles,
relationships, traits); people with more, more-distinct aspects show
smaller affect/self-appraisal swings after domain success or failure —
don't put all your eggs in one cognitive basket. The 2003 Rafaeli-Mor
& Steinberg meta-analysis (*PSPR* 6) is the required caveat: the
stress-buffering claim is weak/heterogeneous; the reliable piece is
**moderation of reactivity**, stronger for uplifting than adverse
events. Model accordingly — `self_complex` is a SPILLOVER parameter,
never a wellbeing guarantee:

```
aspect(rec) = dominant self-aspect tag (role/relationship domain) at encode
spillover_gain = base_mood_bleed / max(2, self_complex)   // Linville divisor
self_comp ∈ [0,1]   // Showers 1992 compartmentalization: negative
                    // aspects walled off → negative events bleed only
                    // within their aspect; ×(1−self_comp) on cross-
                    // aspect negative spread, positive spread unchanged
```

`self_complex` ∈ {2..8}, default ~4. Low-complexity characters (the
newcomer with two aspects; the widower who is only the store) take
full-strength mood capture from any domain event — the mechanism that
makes a one-role character's bad week *total*. Locked null
`sc_capacity_null`: self_complex partitions indexing, it adds zero
storage capacity and zero accuracy.

### 6.102 The repressor phenotype — access suppression, not erasure
### (new in v5.6)

**[CONSENSUS]** Weinberger, Schwartz & Davidson (1979) defined the
phenotype: **low self-reported distress + high defensiveness** —
repressors are not calm people, they are defended people. Davis &
Schwartz (1987, *JPSP* 52:155; Davis 1995 *J Abnorm Psychol* 103:288):
repressors free-recall **fewer negative childhood memories**, report a
**substantially older earliest negative memory**, and are **slower to
retrieve negative** (not positive) childhood material; Davis (1990,
recognition β) shows the deficit is accessibility, not a conservative
report criterion. Model: `repress` is a DERIVED pin —
`repress = clamp(defens·(1 − neurot_report), 0, 1)` where the bible's
"unflappable/never complains" lowers neurot_report without touching
the `neurot` trait's physiological side (the repressor's body still
keeps score). Effects, all R-side (retrieval accessibility), never
record deletion — locked null `repr_erase_null`:

```
negative-childhood recall drive   ×= (1 − 0.5·repress)
earliest-negative age             += repr_neg_shift·repress   (0–3y)
negative-retrieval latency        ×= (1 + 0.4·repress)
amnesia_exit (neg-valence only)   += up to 1.5y·repress
```

Recognition probes of the same records: **unaffected** (locked
boundary, Davis 1990). Cast shadow: the cast's maximum-repress
profile (C7) has a childhood that is *literally thinner on the
negative side* — the archive is intact, the doors are shut.

### 6.103 Reminiscence functions — what old age rehearses (new in v5.6)

**[CONSENSUS]** Watt & Wong (1991, *J Gerontol Soc Work* 16:37; 1991
*Psychology & Aging* 6:272 — verified): reminiscence is six different
activities, and only some are adaptive — **integrative** (life-review
synthesis, meaning-making), **instrumental** (rehearsing past
problem-solving for present problems), **transmissive** (teaching
stories to the young), **narrative** (canonized entertainment),
**escapist** (positive-only retreat into the good old days),
**obsessive** (negative replay — guilt, rumination). Successful agers
show more integrative/instrumental and less obsessive reminiscence.
`remin_style` (enum, 55+ only — below that the machinery is retell
ecology) routes each idle-reminiscence tick to a record pool:

```
integrative   → cross-period draw, mints persSem synthesis records
                (the meaning-making output — feeds §4.23 ps_* minting)
instrumental  → procedural/script records matching CURRENT open loops
transmissive  → moral-loaded records, biased to younger audiences
narrative     → high-retell-count canon (existing polish path)
escapist      → valence>0 pool only; negative draws suppressed
obsessive     → valence<0 pool only; feeds rumination counters
```

`remin_w` ∈ [0,1] scales how much idle cognition goes to reminiscence
at all (vs present concerns). A character may blend two styles
(`{integrative:0.6, transmissive:0.4}`). The styles produce measurably
different ARCHIVES after sim-years: an obsessive elder's accessible
pool skews negative, an escapist's skews golden — same records,
different diet. P606.

### 6.104 The regret economy — counterfactual mints and the inaction
### tail (new in v5.6)

**[CONSENSUS]** Gilovich & Medvec (1994 *JPSP* 67:357; 1995 *Psych
Rev* 102:379 — verified): regrettable ACTIONS hurt more short-term
(counterfactual salience), regrettable INACTIONS hurt more long-term —
dissonance processes repair action regrets, inaction regrets never get
a closing event and stay cognitively available. Wrosch & Heckhausen's
control-theory work (Wrosch et al. 2005/2007): regrets with remaining
opportunity stay hot and motivate; once opportunity closes, adaptive
disengagement lets them decay — persistent hot regret after closure is
the depressive signature. Model: near-miss outcomes mint
`counterfactual:true` tags at rate `counterf_k` ∈ [0,0.4] (loads on
`rum`-adjacent traits — a counterfactual mint is a small rehearsal).
Regret records decay asymmetrically:

```
action regret    β ×= 1.0   (normal channel decay — repair happens)
inaction regret  β ×= regret_inact_mult (0.2–0.7, default 0.45 —
                 roughly 2× the action-regret half-life)
reopen: an opportunity cue (the same choice comes round again)
        restores the record at cue strength, once per window
regret_opp_gate ∈[0,1]: 1 = healthy disengagement (opportunity
        closed → decay accelerates ×1.5); 0 = rumination lock
```

P607 sign-locks the crossover (action > inaction early, inaction >
action late); P608 checks the opportunity gate.

### 6.105 Savoring and dampening — the positive ledger's two valves
### (new in v5.6)

**[CONSENSUS]** Positive-affect regulation is asymmetric and
trait-variable (Bryant & Veroff 2007, *Savoring*; Feldman, Joormann &
Johnson 2008 *Cog Ther Res* 32:507 — verified): **savoring** actively
prolongs positive experience; **dampening** suppresses it, prospectively
predicts depressive symptoms (Raes et al. 2012), and is self-esteem-
gated (Wood, Heimpel & Michela 2003, *JPSP* 85:566 — verified: low
self-esteem dampens, high self-esteem savors). Model:

```
positive-event E        ×= (1 + 0.4·savor_k − 0.3·dampen_k)
positive rehearsal p    ×= (1 + savor_k − 0.8·dampen_k)
positive-affect decay   β_emo_pos ×= (1 + 0.5·dampen_k − 0.3·savor_k)
dampen_k prior          = clamp(0.5 + 0.4·(0.62 − self_est) + 0.3·depr, 0, 1)
```

`savor_k`, `dampen_k` ∈ [0,1], independent dials — the savorer-who-
also-dampens exists ( savoring capacity ≠ habit). Downstream null to
respect: dampened positive events are still *encoded* — thin and
fast-fading, not absent. P609.

### 6.106 Future-self continuity — obligations to a stranger (new in
### v5.6)

**[CONSENSUS→DEBATED boundary]** Ersner-Hershfield, Wimmer & Knutson
(2009, *SCAN* 4:85; Ersner-Hershfield et al. 2009 *JDM* 4:280 —
verified): people differ in felt continuity with their future self;
low-continuity people discount the future self like a different person
(Parfit's multiple-selves, operationalized). Markus & Nurius (1986,
*Am Psych* 41:954): **possible selves** — hoped-for and feared future
self-representations — organize motivation and self-evaluation. Model:

- `future_cont` ∈ [0,1] (default ~0.55). Long-horizon Intention
  records (deadline > ~90 days) minted by a low-future_cont character
  store with `owner:"future-self"` semantics — they inherit the
  **debtor side** of the §6.90 promise ledger (cue-bound, not
  `pm_self`-driven): the character who books obligations her future
  self will experience as someone else's promises. High future_cont
  keeps long-range intentions on the normal self channel.
- `pself` records: minted from `concerns` at rate `pself_mint` ∈
  [0,0.3] — hoped/feared future selves as landmark records that serve
  as retrieval anchors for self-relevant draws and as `w_self`
  boosters on matching present events (the feared self casts a shadow
  on every resembling event). Feared-pself intrusions ride the
  intrusion channel at half weight.

P610 checks the debtor-continuity mapping; the null to respect:
future_cont moves *commitment structure*, never accuracy.

### 6.107 Elaborative co-narration — the interviewer inside the friend
### (new in v5.6)

**[CONSENSUS in developmental work; HYPOTHESIS extension to adults]**
The maternal reminiscing-style literature (Fivush & Fromhoff 1988;
Reese, Haden & Fivush 1993) established that a high-**elaborative**
co-narrator — one who asks open questions, adds evaluative detail,
confirms and extends — produces richer shared encoding in the child.
v5.6 extends the mechanism to adult dyads (modeling hypothesis;
consistent with the shared-reality and collaborative-memory layers
already spec'd): `elabor` ∈ [0,1] is a *speaker-side* trait — the
person who draws stories out of people. When a high-elabor character
co-experiences or co-narrates an episode, BOTH parties' records gain
`elabor_dyad_gain` ∈ [0,0.4] extra detail-field density (the
elaborator's questions force detail into existence — Saying more
makes more remembered, cf. Higgins & Rholes). Pairs asymmetrically
with `collab_inhib` (§6.69): collaboration still costs the raw-list
recall while buying the detail — the elaborator's dyad knows fewer
items but knows them deeper. P611.



All weights live in one per-character params object. Profiles doc assigns
values; game-systems stores it on the character record.

```json
MemoryParams = {
  // encoding
  "enc_base": 0.35,        // E0
  "att_min": 0.15,         // below → not encoded
  "w_emo": 0.9, "w_self": 1.1, "w_nov": 0.6, "w_pred": 0.5,
  "arousal_narrowing": 0.6,  // peripheral-detail loss under arousal
  "sleepFactor": 1.0,
  // decay
  "beta_episodic": 0.5, "beta_semantic": 0.2, "beta_source": 1.0,
  "k_verbatim": 2.5, "tau_episodic": 1.2, "tau_semantic": 30.0,
  "interf_k": 0.12, "interf_thresh": 0.6, "merge_thresh": 0.8,
  "forget_thresh": 0.08,
  "neg_affect_decay": 1.3,   // multiplier on positive baseline
  // retrieval
  "theta": 0.45, "w_str": 0.8, "w_state": 0.3, "w_place": 0.3,
  "w_people": 0.33, "w_topic": 0.36, "w_sensory": 0.1,
  "rec_k": 0.3, "rec_tau_days": 2.0, "rif_k": 0.05,
  "retell_boost": 0.25,
  // v0.2 additions (retrieval-cue calibration, retrieval-cues.md §8)
  "fan_k": 0.4,                  // log-fan divisor strength (ACT-R consistent)
  "place_reinstate": 0.15,       // matched-place cue bonus, grows w/ record age
  "mental_reinstate": 0.09,      // guided-reconstruction fraction of above
  "sensory_age_slope": 0.8,      // odor cues reach older memories (Proust)
  "sensory_mismatch_pen": 0.05,  // wrong sensory cue hurts (Chu & Downes 2002)
  "w_msd": 0.1,                  // mood-state dependency, small + erasable
  "recogn_pen": 0.4,             // copy-cue penalty vs contextual recall
  "intrusion_thresh": 0.75,      // involuntary-recall cue threshold
  "resurrect_thresh": 0.85,      // cue level to reach archived records
  "plist_suppress": 0.05,        // part-list cuing suppression in discussEvent
  // distortion
  "drift_p": 0.08, "misinfo_suscept": 0.35, "confab_fill": 0.5,
  // age/identity (set once, era window for reminiscence bump)
  "birthWorldDay": -9125, "bump_beta_mult": 0.6,
  // v0.1 additions (forgetting-curve calibration, forgetting-curves.md §3)
  "consol_window_days": 1.0, "consol_beta_mult": 0.5,
  "permastore_age": 180, "permastore_thresh": 0.25,
  "face_ceiling": 0.67, "stress_thresh": 0.8, "stress_encode_loss": 0.31,
  // v0.3 additions (age-development calibration, age-development.md §§6–8)
  "amnesia_exit": 7.0,         // encodeAge below → amnesia_decay_mult forever
  "amnesia_decay_mult": 1.8,   // permanent β mult on childhood records
  "bump_lo": 10, "bump_hi": 30, "bump_peak": 16,   // encodeAge window (±3y jitter)
  "bump_valence_gate": true,   // bump only for positive/self-relevant records
  "bump_self_thresh": 0.6,
  "link_p": 0.75,              // prob an associative edge forms at encoding
  "w_emo_pos": 1.0, "w_emo_neg": 1.0,   // valence-asymmetric arousal weight
                                       // (older: pos 1.25 / neg 0.85)
  "pm_self": 0.8               // self-initiated intention recall (optional §9)
  // v0.4 additions (age-decline calibration, age-decline.md §§13–14)
  "search_breadth": 12,        // max candidates scored per recall (age curve)
  "env_support_gain": 1.0,     // ≥1; cueMatch_ext multiplier (age curve)
  "discrim_mult": 1.0,         // ≤1; scales interf/merge thresh (age curve)
  "lure_accept": 0.05,         // similar-cue false-positive rate (age curve)
  "specificity": 1.0,          // prob of returning episode vs generic (age)
  "pos_spare": 0.2,            // positive-cue sparing on specificity
  "tot_rate": 0.04,            // name-field blanking, feeling-of-knowing
  "sws_mult": 1.0,             // episodic consolidation age scaling
  "ret_noise": 0.05,           // σ of noise added to drive
  "reserve": 0.4,              // cognitive reserve 0..1 → age_eff shift
  "reserve_shift": 10.0,       // years of effective-age offset at reserve=1
  "deathDay": null,            // optional scripted-death day → terminal ramp
  "terminal_window": 1100,     // game days; Wilson 2003 ≈43 months
  "terminal_gain": 2.0, "terminal_loss": 0.5,
  // v0.5 additions (emotional-memory calibration, emotional-memory.md §9)
  "emo_consol_gain": 0.25,     // first-sleep bonus ∝ arousal (selective consol.)
  "abc_gain": 0.25,            // central-field encoding boost under arousal
  "emo_blink_thresh": 0.7,     // arousal level that suppresses neighbors
  "emo_blink_window": 0.03,    // days; ±~45min scene window
  "emo_blink_loss": 0.3,       // encodingE multiplier on cue-unrelated neighbors
  "post_stress_window": 0.05,  // days; retrograde enhancement reach
  "post_stress_gain": 0.15,    // retrograde boost for congruent predecessors
  "conf_emo_gain": 0.15,       // arousal² confidence inflation at birth
  "flashbulb_thresh": 0.85, "flashbulb_conf_floor": 0.9,
  "trauma_thresh": 0.9, "trauma_floor": 0.30,   // record-level trauma phenotype
  "cond_thresh": 0.6, "cond_gain": 0.5,         // conditioned-affect acquisition
  "cond_decay": 0.005, "extinct_suppress": 0.08,
  "recovery_days": 30, "recovery_frac": 0.5,    // Bouton: renewal/recovery
  "emo_gist_beta": 0.85, "emo_verbatim_k": 1.5, // emotional narrowing over time
  "arousal_affect_decay": 1.4, // arousal tag fades faster than valence tag
  "neg_fidelity": 0.85, "pos_gist_drift": 1.15, // valence-conditioned distortion
  "neg_core_resist": 0.7,      // misinfo resistance of neg-core fields
  "mood_bleed": 0.10, "mood_arousal_bleed": 0.1,// reconstruction mood shift
  "stress_retrieve_thresh": 0.6, "stress_retrieve_loss": 0.12, // glucocorticoid
  "rumin_k": 0.5,              // valence-selective rehearsal (depressive mod.)
  // v0.6 additions (false-memory calibration, false-memory.md §§9–10)
  "warn_mult": 0.45,           // post-warning suppression of p_adopt (§6.3)
  "rep_gain": 0.4, "rep_cap": 2.0,   // log-fluency on hearCount (§6.3)
  "dispute_mult": 0.05,        // live-dispute adoption floor (§6.3, §6.5)
  "retract_p": 0.6, "cie_residual": 0.3,   // corrections/CIE (§6.6)
  "w_plaus": 0.5, "w_corr": 0.3, "w_fluency": 0.2,   // believe_p (§6.7)
  "sleepdep_misinfo_gain": 1.25,   // poor sleep AT ENCODING (§2, §6.3)
  "sleep_gist_boost": 0.05,    // sleep tick edge for gist/phantom (§4.6)
  "gist_lure_gain": 0.3, "phantom_p": 0.02, "phantom_fan_min": 4, // §6.8
  "rm_rich_thresh": 0.5,       // richness gate for imagined→witnessed (§6.9)
  "plaus_min": 0.35, "imagine_gain": 0.15, // plausibility gate + gain (§6.9)
  "source_confuse_flip": 0.15, // imagined→witnessed flip rate (§6.9)
  "source_confuse": 0.10,      // external source reassignment (§6.10)
  // v0.7 additions (individual-differences calibration,
  // individual-differences.md §§3–5)
  "peak_hour": null,           // circadian peak hour 0..23; null = flat
  "synchrony_gain": 0.06,      // encoding/θ off-peak penalty; ×(1+age_eff/60)
  "vivid_detail": 0.8,         // prob each peripheral field is written at all
  "conf_bias": 0.0,            // trait confidence offset, never touches accuracy
  // v0.8 additions (social-memory calibration, social-memory.md §§14–15)
  "sti_prob": 0.6, "sti_gain": 0.15,   // spontaneous trait inference (§2)
  "diag_moral_neg": 1.6, "diag_ability_pos": 1.3, // diagnosticity weights (§2)
  "incongruity_gain": 0.25,  // expectancy-violation encoding bonus (§2)
  "next_in_line": 0.4,       // attention loss while preparing own turn (§2)
  "oab_loss": 0.15,          // other-age familiarity penalty (§2; all ages)
  "familiar_thresh": 0.25, "identity_thresh": 0.4, "name_thresh": 0.55,
                             // person-recognition cascade tiers (§5.10)
  "cheat_source_mult": 0.6,  // β_source mult on cheater-associated records (§4.10)
  "audience_tune": 0.06, "shared_reality_gate": 0.5, // saying-is-believing (§6.11)
  "ss_rif_k": 0.04,          // listener co-retrieval suppression (§5.8)
  "level_frac": 0.3, "si_dropoff": 0.75, "chain_sc_thresh": 4,
  "assimilation_gain": 0.05, "social_transmit_gain": 1.15, // chains (§6.12)
  "collab_base": 0.65, "collab_size_pen": 0.1, "collab_friend_mult": 1.2, // §6.13
  "cred_step": 0.08,         // credibility learning rate (§6.14)
  "mnemic_loss": 0.15, "mnemic_encode": 0.25, "mnemic_centrality": 0.6,
                             // mnemic neglect: recall-suppress, encode-shallow (§4.10)
  "source_cat_share": 0.65,  // within-category source confusion (§6.10)
  // v0.9 additions (formal-model hardening, formal-model.md §§4–6)
  "enc_quota_per_day": 40,   // soft cap on records surviving to first sleep
  "cap_episodic": 2000, "cap_archive": 8000, "cap_persons": 60,
                             // live-record/archive/PersonModel caps
  "ambient_tick_mult": 3, "ambient_cap": 150,  // degraded mode (§8.1)
  "possess_alien": 0.15,     // estrangement discount on possessed records
  "catchup_max": 7,          // days replayed on resume before aggregation
  // v0.9 deepening (mechanism formalization, formal-model.md §§10–16 —
  // free-vs-frozen split per the §4 identifiability audit there)
  "s_gain": 0.35,            // storage growth per difficult retrieval (§4.11)
  "tele_k": 0.12,            // forward telescoping rate (§6.15)
  "date_sigma": 0.9,         // dating noise scale ∝ √age (§6.15)
  "round_p": 0.5,            // schema-unit rounding when `when` dead (§6.15)
  "contiguity_gain": 0.15,   // temporal-neighbor drive bonus (§5.4)
  "hindsight_k": 0.35,       // prior-assimilation toward outcome (§6.16)
  "oc_gain": 0.3,            // hard-easy overconfidence at report (§3)
  // v1.0 additions (profile compiler + metamemory + expertise + open
  // loops, profile-generation.md §§1–4)
  "metamem_r": 0.15,         // felt↔actual memory correlation (human ~0.1)
  "self_est_bias": 0.15,     // σ of the self-model noise term
  "strategy_use": 0.3,       // external-memory reliance (lists, asking)
  "expert_gain": 0.10,       // in-domain enc_base boost per domMatch
  "expert_cost": 0.06,       // out-of-domain link_p penalty (Woollett 2009)
  "expert_bound": 1.0,       // gain collapse at domain edge (Chase&Simon)
  // v1.9 additions (individual-differences II, individual-differences.md
  // §§10–17)
  "iiv_sigma": 0.04,         // day-to-day encoding/retrieval noise σ;
                             // ×(1+age_eff/50)·(1−0.25·wmc) (Hultsch 2000)
  "omit_p": 0.05,            // routine-event encoding-omission prob (§2)
  "lang_mismatch": 0.6,      // verbal/topic/people cue attenuation when
                             // C.lang ≠ m.lang (Marian & Neisser 2000)
  "meta_cal": 1.0,           // confidence calibration slope at report (§3)
  "complaint_k": 0.15,       // selfReport complaint noise weight (§10)
  "check_conf_loss": 0.10,   // verify-mode conf decrement per log1p
                             // retrievalCount (van den Hout & Kindt 2003)
  "expert_lure": 0.10,       // in-domain lure/adoption bonus (Castel 2007)
  "intox_encode_mult": 0.3,  // E floor at intox=1 — anterograde (White 2003)
  "intox_state_dep": 0.05,   // encode/retrieval intox-match cue (DEBATED)
  "aging_rate": 0.0,         // trait passthrough: age_eff slope N(0,1)
  "fitness": 0.0,            // trait passthrough: age_eff offset −0.15·fitness
  "open_loop_gain": 0.12,    // intrusion/drive boost on open:true records
  "open_self_gate": 0.4,     // selfRelevance floor for open tagging
  // v2.1 additions (formal-model III — measurement layer,
  // formal-model.md §§18–23; free/frozen per the §23 audit table)
  "sim_tau_time": 14.0,      // when-distance feature scale, days (§11.1)
  "place_adj": 0.3,          // adjacent-venue partial match (§11.1)
  "a_cue": 0.4, "a_part": 0.45, "a_fam": 0.15,  // FOK accessibility (§5.21)
  "theta_fok": 0.5, "k_fok": 6.0, "fok_noise": 0.08,
  "fok_age_noise": 0.25,     // episodic FOK sensitivity loss w/ age (§5.21)
  "fok_retry": 0.6,          // failed-recall rescan gate (§5.21)
  "jol_fluency": 0.5,        // immediate-JOL fluency inflation (§5.21)
  "theta_jol": 0.5, "k_jol": 6.0, "jol_bias": 0.0
  // v1.2 additions (encoding-mechanics calibration,
  // encoding-mechanics.md §11)
  "elab_gain": 0.25,         // deep/elaborative processing term (LoP)
  "gen_gain": 0.15,          // self-generated content bonus (d=0.40)
  "enact_gain": 0.20,        // performed-action bonus; post-decline (g=1.23)
  "prod_gain": 0.08,         // said-aloud bonus, recognition-weighted
  "boundary_gain": 0.15,     // event-boundary encoding bonus
  "boundary_order_loss": 0.4,// cross-boundary link/order penalty
  "doorway_drop": 0.15,      // locShift R penalty, recent+pending records
  "lapse_p": 0.03,           // stochastic attention-collapse rate
  "lapse_drop": 0.6,         // attention multiplier during a lapse
  "da_encode_mult": 0.5,     // divided-attention encoding damage
  "unitize_gain": 0.3,       // coherent-unit link rescue (aging)
  "distinct_gain": 0.15,     // within-context isolation bonus
  "concrete_gain": 0.1,      // sensory/concrete content bonus
  "mood_cong_encode": 0.1,   // mood-congruent elaboration bonus
  // v1.3 additions (forgetting-curves II — active-forgetting calibration,
  // forgetting-curves.md §§7–8)
  "s_gain_recall": 0.35,     // S growth on effortful recall (§4.11)
  "s_gain_rehear": 0.12,     // S growth on passive re-exposure (§4.11)
  "lag_opt_ratio": 0.15,     // optimal retell gap / record age (§4.11)
  "lag_width": 1.0,          // log-normal width of the lag optimum
  "massed_gap": 0.08,        // days; below → massed_retell_mult
  "massed_retell_mult": 0.4, // same-conversation retells mostly wasted
  "potent_gain": 0.3,        // failed recall → next re-encoding boost
  "pi_ref": 4.0,             // n_sim scale at which PI saturates (§4.2)
  "amnesia_slope": 1.2,      // childhood β ramp (replaces decay_mult)
  "child_consol_base": 0.15, // childhood record survival base
  "child_consol_gain": 0.6,  // coherence → survival (Bauer&Larkina 2015)
  "suppress_theta": 0.08,    // per-suppression θ bump (§4.12)
  "suppress_cap": 0.3,       // cumulative suppression ceiling
  "retell_base": 0.015,      // daily ecology retell draw (§4.13)
  "retell_social": 1.0,      // shared-cue boost on p_retell
  "beta_pm": 0.15,           // armed intention decay (§9)
  "reminiscence_frac": 0.15, // per-attempt field resurfacing (§5.11)
  "beta_proc": 0.02,         // procedural map decay (~never)
  // v1.4 additions (retrieval-cues II, retrieval-cues.md Part II)
  "tap_mismatch": 0.55,      // ops-channel mismatch penalty on cueMatch (§5.12)
  "out_int": 0.85,           // per-emitted-item compounding in bouts (§5.13)
  "pm_focal_hit": 0.9,       // focal event-cue fire rate, age-flat (§5.14)
  "pm_monitor_p": 0.4,       // nonfocal cue monitor-roll base (§5.14)
  "pm_clock_p": 0.1,         // per-tick clock-check for time intentions (§5.14)
  "pm_time_age_loss": 0.4,   // age scaling on nonfocal/time PM (§5.14)
  "renewal_frac": 0.6,       // context-switch affect renewal (§5.15)
  "tot_resolve_p": 0.3,      // syllable-cue TOT resolution (§5.16)
  "tot_persist": 1.5,        // tot_rate multiplier per unresolved TOT (§5.16)
  "chain_gain": 0.5,         // derived-cue strength on linked records (§5.17)
  "tmr_gain": 0.12,          // sleep-context sensory consolidation edge (§5.18)
  // v1.5 additions (age-development II, age-development.md Part II §§11–20)
  "ret_win_base": 3.0,       // days/yr infant retention window slope (§4.14)
  "latent_recall_p": 0.08,   // compound-sensory latent reinstatement (§5.20)
  "reminiscence_env": 0.5,   // caregiver reminiscing style 0..1; shifts
                             // amnesia_exit ∓1.5y + child_consol_gain (§4.1/§4.14)
  "strategy_exit": 12,       // age of full elab/gen gain (§2 strategy_ramp)
  "scaffold_gain": 0.15,     // adult-guided elaboration bypass (§2)
  "child_gist_mult": 0.7,    // gist birth strength below age 8 (§2)
  "offtarget_p": 0.03,       // bout contamination rate; age curve §5.19
  "know_protect_age": 50,    // knowledge-protection onset (§6.3)
  "know_protect_thresh": 0.5,// semantic strength that counts as "known"
  "know_protect_mult": 0.5,  // adoption mult when knowledge contradicts (§6.3)
  "sws_child_peak": 1.2,     // sws_mult knot at age 6 (§4.15)
  "nap_age_exit": 6,         // nap mini-tick eligibility (§4.15)
  "nap_loss": 0.1,           // missed-nap same-day loss, unrecoverable (§4.15)
  "bump_semantic_gain": 0.5, // bump gain on cultural semantic records (§2)
  "bump_cascade_gain": 0.4,  // parents'-era secondary peak, encodeAge 4-10 (§2)
  "child_internal_confuse": 2.0, // internal source-confusion mult <9 (§6.10)
  "child_trauma_off": 0.1,   // trauma_thresh offset in childhood (§2, HYPOTHESIS)
  "tele_age_gain": 0.5,      // telescoping age gradient (§6.15)
  // v1.6 additions (age-decline II — the compensation layer,
  // age-decline.md Part II §§17–31)
  "value_select": 0.0,       // importance sharpening on E (§2; age curve §30)
  "positivity_gain": 0.0,    // valence asymmetry at encode/select; NOT
                             // reserve-shifted, load/stress-gated (§2, §5.4)
  "hyperbind_p": 0.05,       // wrong-context verbatim binding rate (§2)
  "dest_mem": 0.9,           // toldTo hit rate; misses → repeat tellings (§6.11)
  "ctx_loss": 1.0,           // context>content decay multiplier (§4.1/§6.15)
  "conf_inflate_old": 0.0,   // conf_out bump on wrong-flagged reconstructions (§3)
  "schema_support": 0.05,    // prior-knowledge encoding scaffold (§2)
  "stereo_suscept": 0.5,     // trait; evaluative-context θ tax (§5.4)
  "collab_partner_gain": 0.0,// intimate-dyad collaborative facilitation (§6.13)
  // v1.6 knot-table updates (existing params, new age knots):
  //   w_sensory: 0.10 → 0.07@70 → 0.05@85 (olfactory encoding decline)
  //   phantom_p: 0.02 → 0.035@70 → 0.05@80 (gist-false-memory scaling)
  //   gist_lure_gain: 0.3 → 0.42@70 → 0.5@80
  // v1.5 knot-table updates (existing params, new age knots):
  //   sws_mult: 1.2@6 → 1.0@14 (child side, §4.15)
  //   metamem_r: ~0.0@6 → 0.10@13 → 0.15 adult (§18)
  //   self_est_bias: +0.3@6 → 0 adult → −0.05@70 (children overpredict)
  //   offtarget_p: 0.01@20 → 0.03@50 → 0.15@80; mild elevation <10 (§5.19)
  //   source_confuse: external channel rides old-side knots ~1.8×@75 (§6.10)
  // v1.7 additions (emotional-memory II — the affect-tag layer,
  // emotional-memory.md Part II §§13–21)
  "peak_w": 0.55,            // peak weight in tag-setting (§2; end_w = 1−)
  "end_w": 0.45,             // end weight; +0.1 knot @70 (§2, §23 EM-II)
  "emo_assoc_loss": 0.25,    // graded item-context tradeoff ≥0.5 arousal (§2)
  "sleep_affect_strip": 0.04,// per-sleep arousal-tag decay; trauma-exempt,
                             // DEBATED flag — set 0 if depotentiation dies
  "regulate_style": 0.5,     // trait: 0 suppressor → 1 reappraiser (§2)
  "reg_thresh": 0.6,         // arousal where regulation engages
  "reg_suppress_cost": 0.2,  // enc_base cost for suppressors (§2)
  "reg_reappraise_k": 0.25,  // arousal-tag cooling for reappraisers (§2)
  "gen_width": 0.25,         // conditioned-affect similarity gradient (§4.9)
  "reconsol_window": 0.25,   // days; post-fire extinction bonus window (§4.9)
  "reconsol_extinct_gain": 3.0, // in-window safeCount gain → deep suppressor
  "contagion_k": 0.5,        // hearsay arousal transmission (§6.3)
  "verbal_dampen": 0.05,     // per-social-retell arousal decay; trauma-exempt
  "fab_self_gate": 0.4,      // selfRelevance floor for neg_affect_decay (§4.5)
  // v1.8 additions (false-memory II — candidates, claims, coercion,
  // false-memory.md Part II §§13–22)
  "cand_base_str": 0.7,      // misinfo candidate birth strength (§6.3)
  "fab_inflate": 0.5,        // claim→belief flip multiplier (§6.9)
  "forced_confab_gain": 0.2, // per-forced-answer candidate strength (§6.9)
  "other_gen_gain": 1.5,     // suggested > self-generated confabulation
  "press_gain": 0.3,         // per-repeat interrogative pressure (§6.9)
  "evid_boost": 0.4,         // perceptual-evidence plausibility lift (§6.9)
  "crypto_p": 0.08,          // cryptomnesia heard→self flip (§6.10)
  "consist_pull": 0.15,      // reconstruct toward current self (§6.17)
  "choice_support_gain": 0.15, // believed-choice feature bias (§6.17)
  "cb_detect": 0.3,          // outcome-swap detection (§6.18)
  "neg_gist_gain": 0.15,     // negative-CONTENT distortion boost (§6.3/§6.8)
  "negmood_verbatim_gain": 0.1, // negative-MOOD verbatim protection (§2)
  "prewarn_mult": 0.7, "inoc_mult": 0.75, "inoc_days": 14, // §6.3 timing
  // v2.0 additions (social-memory II — the talk ecology,
  // social-memory.md Part II §§18–29)
  "share_k": 0.8,            // |affect|-driven retell propensity (§4.13)
  "share_shame_pen": 0.5,    // shame suppression on sharing (§4.13)
  "rif_facil_k": 0.03,       // integrated-material facilitation (§5.8)
  "corroborate_conf": 0.15,  // mutual-validation conf bump (§6.20)
  "disagree_conf": 0.10,     // contradiction conf decrement (§6.20)
  "copresent_assume_p": 0.9, // copresence→assumed-knowledge rate (§6.21)
  "common_ground_conf": 0.8, // confidence on "would X know" (§6.21)
  "interpret_bias": 0.3,     // ambiguous-behavior assimilation (§2)
  "ambig_band": 0.3,         // |implied| bound for interpret bias (§2)
  "secret_tag_mult": 1.3,    // confidentiality decay vs content (§6.22)
  "absorb_p": 0.02,          // told_by→experienced flip rate (§6.23)
  "canon_thresh": 5, "canon_drift_mult": 0.2, "canon_resist": 0.6,
                             // story canonization (§6.24)
  "joint_attn_gain": 0.12, "joint_affect_amp": 0.1, // §2 coAttending
  "transact_loss": 0.12,     // absent-partner θ penalty (§6.14)
  // v2.2 additions (cast profiles, cast-profiles.md §1)
  "mig_bump_gain": 0.6,      // immigration-window bump strength (§4.1)
  "attach_encode_loss": 0.3, // preemptive E loss on attachment:true (§2)
  "attach_ret_cost": 0.15,   // searchCost add on attachment records (§2)
  "self_share_pen": 0.5,     // transmission cut on selfRelevance≥0.6 (§6.22)
  "secret_mindwander": 0.08, // confidential-record intrusion boost (§5.7)
  // IndivTraits gains axis 15: attach_avoid (σ, r(extra)≈−0.3,
  // r(neurot)≈0 — avoidance carries the memory deficit, anxiety doesn't)
  // v3.1: IndivTraits axes 16–22 — face_ability, adhd, asd, suggs,
  // vigil, aim, hand_mix (individual-differences.md §30 + R rows);
  // state overlays context.meno / context.preg / intox.kind are
  // states, NOT traits — never in the trait vector.
  // v2.4 additions (encoding-mechanics II — motivational state and
  // content class, encoding-mechanics.md Part II §§15–26)
  "abe_gain": 0.15,          // detection-event E boost (§2; Swallow & Jiang)
  "abe_spill_mult": 0.5,     // same-tick spillover fraction (§2)
  "curios_gain": 0.2,        // curiosity-state target gain (§2; Gruber 2014)
  "curios_spill": 0.1,       // incidental spillover, window-locked (§2)
  "rest_gain": 0.12,         // wakeful-rest shield (§2; Dewar 2012)
  "impl_intent_gain": 0.25,  // if–then cue binding (§2; Gollwitzer&Sheeran .65)
  "teach_expect_gain": 0.2,  // preparing-to-teach elaboration (§2; Kobayashi)
  "name_penalty": 0.3,       // unfamiliar-name birth thinning (§2; Cohen 1990)
  "owngroup_loss": 0.15,     // other-group familiarity cut (§2; M&B 2001)
  "expert_encode_gain": 0.15,// in-domain E bonus (§2; Chase & Simon)
  "expert_detail_w": 1.2,    // in-domain record width mult (§2)
  "df_loss": 0.3,            // item-method forget-instruction cost (§2)
  // v2.5 additions (forgetting-curves III — adaptive calibration, event
  // time, tails; forgetting-curves.md Part III §§12–13)
  "ev_time_w": 0.5,          // event-load weight in t_eff (§4.1)
  "ev_day_norm": 30.0,       // typical daily encodes; ambients ~10 (§4.1)
  "affect_sleep_frac": 0.4,  // valence-fade share executed at sleep tick (§4.5)
  "face_perma_thresh": 0.15, // familiar-face permastore bar (§4.7)
  "fam_recog_gate": 0.5,     // familiarity required for face permastore (§4.7)
  "transf_gain": 0.05,       // verbatim-death → gist S boost (§4.16)
  "state_ctx_hl": 21.0,      // internal-state cue drift half-life, days (§5.3)
  // v2.6 additions (retrieval-cues III — cue mechanics,
  // retrieval-cues.md Part III §§20–29)
  "diag_w": 0.5,             // IDF blend into per-field cue weights (§5.2)
  "diag_cap": 2.0,           // max diagnosticity multiplier (§5.2)
  "sam_tau": 2.0,            // ratio-rule exponent (§5.22)
  "kmax": 3,                 // consecutive failed samples → bout stop (§5.22)
  "reexp_ratio": 0.35,       // re-exposure vs recall s_gain ratio (§5.9)
  "test_gap_gain": 0.3,      // delay-gate on recall-leg s_gain (§5.9)
  "expanding_bonus": 1.15,   // gap>prevGap retell s_gain multiplier (§4.13)
  "tnt_inhib": 0.02,         // per-cue-present-suppression trace decrement (§5.23)
  "tnt_cap": 0.2,            // cue-independent inhibition ceiling (§5.23)
  "invol_periph_gain": 1.6,  // ambient-scan sensory/peripheral weight (§5.7)
  "invol_topic_pen": 0.7,    // ambient-scan abstract-cue discount (§5.7)
  "intent_sup": 0.1,         // armed-intention drive on linked record (§5.14)
  "monitor_cost": 0.03,      // θ tax per armed nonfocal intention (§5.14)
  "pm_commission_p": 0.2,    // completed-intention refire base (§5.14)
  "pm_commission_hl": 2.0,   // refire half-life, days (§5.14)
  "selfinit_pen": 0.08,      // sparse-cue θ tax × ageScale (§5.4)
  "selfinit_bar": 0.3,       // cueMatch below → sparse-cue regime (§5.4)
  "ease_n": 4,               // ease-of-retrieval flip point (§5.24)
  // v2.7 additions (age-development III — firsts, adolescent regime,
  // overlays; age-development.md Part III §§23–32)
  "first_gain": 0.2,         // E bonus on first:true events (§2)
  "transition_gain": 0.4,    // E bonus inside transition window (§2)
  "pi_child_mult": 1.3,      // n_sim accrual × for encodeAge<10 (§4.2)
  "adolesc_sleep_loss": 1.2, // sleepdep encode-penalty ×, ages 13–19 (§2)
  "social_eval_gain": 0.25,  // evaluated/peer-audience E bonus (§2)
  "coruminate_gain": 1.3,    // extra retell draw, neg + close peer (§4.13)
  "narr_coh_gain": 0.1,      // gist S on retells in narr_window (§4.13)
  "narr_link_gain": 0.15,    // cross-era link bonus, narr_window (§4.13)
  "script_date_pull": 0.3,   // script_age pull in dateEstimate (§6.15)
  "pm_interrupt_mult": 1.5,  // interruption cost, child knots (§5.14)
  "pm_scaffold_gain": 0.2,   // caregiver co-present PM bonus (§5.14)
  // v2.8 additions (age-decline III — the paradox layer,
  // age-decline.md Part III §§34–45)
  "pm_habit_gain": 0.0,      // repeated-cue-class PM rescue (§5.14)
  "ii_age_gate": 1.0,        // impl-intent benefit gate (§5.14)
  "sync_lure_gain": 0.0,     // antipeak lure multiplier (§5.6)
  "potent_window": 2.0,      // days; feedback gate on potent_gain (§4.11)
  "know_corr_gain": 0.5,     // knowledge-density × w_corr (§6.7)
  "rm_self_confuse": 0.03,   // imagined↔done flip rate (§6.10)
  "hearing": 1.0,            // trait 0..1, age-declining mean (§2)
  "noise_cost": 0.4,         // max E cut, verbal events in noise (§2)
  "invol_pos_gain": 0.0,     // ambient-scan positive bias (§5.7)
  "invol_remote_gain": 0.0,  // ambient-scan remote-age prior (§5.7)
  "enc_sem_mult": 1.0,       // semantic encoding bump 45–60 (§2)
  "iso_floor": 1.5,          // contacts/day; isolation ledger floor (§4.17)
  "iso_onset": 30.0,         // days below floor before overlay on (§4.17)
  "iso_beta": 0.1,           // β_episodic lift under isolation (§4.17)
  "iso_recovery": 60.0,      // days to heal after contact resumes (§4.17)
  "med_theta_up": 0.05, "med_enc_loss": 0.05, // med_antichol (§4.17)
  "preg_theta_up": 0.10,     // θ lift inside preg window (§4.17)
  "preg_enc_loss": 0.08,     // enc_base cut inside preg window (§4.17)
  "preg_pm_loss": 0.2,       // nonfocal-PM penalty, preg window (§4.17)
  "perim_enc_loss": 0.05,    // enc_base cut, perimenopause (§4.17)
  "perim_s_gain_mult": 0.0,  // practice-gain multiplier, perim (§4.17)
  "perim_years": 4.0,        // overlay duration (§4.17)
  // v2.9 additions (emotional-memory III — the feeling's grammar,
  // emotional-memory.md Part III §§26–35)
  "fear_detail_gain": 0.15,  // fear records: extra veridicality (§2)
  "anger_gist_bias": 0.15,   // anger records: gist/heuristic lean (§2)
  "disgust_gain": 0.15,      // disgust: faster cond, slower extinct (§2/§4.9)
  "arousal_opt": 0.65,       // inverted-U peak, assoc fields (§2)
  "arousal_curv": 0.5,       // quadratic downturn past optimum (§2)
  "emo_update_k": 0.2,       // outcome-appraisal valence rewrite (§6.17)
  "odor_cue_gain": 1.5,      // smell-cue drive multiplier (§5.2)
  "odor_emo_gain": 0.15,     // smell-cued reported-arousal bonus (§5.5)
  "odor_age_relief": 0.5,    // smell ignores half the recency term (§5.7)
  "anniv_gain": 0.2,         // date-match intrusion drive (§5.7)
  "anniv_window": 14,        // days ± around day-of-year (§5.7)
  "anniv_thresh": 0.6,       // arousal floor for date-cued records (§5.7)
  "trust_neg_gain": 0.6,     // person-cue neg acquisition (§4.9)
  "trust_pos_gain": 0.2,     // person-cue pos acquisition (§4.9)
  "person_cond_decay_mult": 0.5, // person entries decay slower (§4.9)
  "coh_gain": 0.05,          // coherence per structured retell (§4.13)
  "coh_intrusion_k": 0.6,    // coherence→intrusion scaling (§5.7)
  "coh_strip_gate": 0.5,     // coherence needed for trauma sleep-strip (§2)
  "wf_gain": 0.5,            // threat-object field boost (§2)
  "wf_loss": 0.3,            // non-object central-field capture cost (§2)
  "recall_mood_pull": 0.05,  // retrieved valence nudges C.mood (§5.5)
  "nostalgia_gain": 0.1,     // restorative pull on qualifying records (§5.5)
  "hc_gap_loss": 0.3,        // cold-state arousal-report compression (§8)
  "hc_gap_thresh": 0.5,      // |Δ mood−valence| gating the gap (§8)
  // v3.0 additions (false-memory III — the passive channels,
  // false-memory.md Part III §§26–36)
  "vo_cand": 0.5, "vo_loss": 0.15,  // verbal overshadowing (§6.25)
  "transplant_gain": 0.10,   // familiar-person slot fill (§6.26)
  "orb_gain": 0.5,           // outgroup-category transplant/lure amp (§6.26)
  "cat_resist": 0.4,         // cross-category transplant resistance (§6.26)
  "conj_thresh": 0.65, "conj_migrate_p": 0.05, // episode-pair gate (§6.27)
  "be_gain": 0.12,           // boundary extension at encode (§6.28)
  "neg_cand": 0.35, "neg_frame_mult": 2.0, "neg_age_gain": 0.4, // §6.29
  "react_window": 0.5, "react_suscept_mult": 1.3, // reactivation (§6.3)
  "phantom_recoll": 0.35,    // vivid-gate crossing prob (§6.30)
  "group_damp": 0.75,        // per-extra-discussant damping (§6.5)
  "truthy_gain": 0.10,       // nonprobative dressing → corroboration (§6.7)
  // v3.1 additions (individual-differences III — Part III §§20–30)
  "fam_gain": 0.35, "fam_thresh_off": 0.03,  // face_ability loads (§5.10)
  "name_fan_k": 0.03,        // tier-3 ln-directory cost (§5.10, §27)
  "hyperfocus_gate": 0.5,    // adhd interest-inversion (§2, HYPOTHESIS)
  "asd_gist_pen": 0.15, "asd_verbatim_gain": 0.08,
  "asd_spec_loss": 0.10, "asd_src_gain": 0.05, // §2 + §6.10 loads
  "suggs_yield": 0.06, "suggs_shift": 0.08,  // GSS Yield/Shift (§6.3)
  "vigil_social_gain": 0.15, "vigil_recall_bias": 0.05, // §2/§5.4
  "aim_emo_gain": 0.10, "aim_link_gain": 0.05, // §2 valence-gated
  "handmix_ret_gain": 0.015, // theta offset, episodic recall only
  "meno_learn_pen": 0.15, "preg_trim3_mult": 0.9, // §2 overlays
  "cann_misinfo_gain": 0.20, "cann_lure_gain": 0.15, // §2/§6.3
  // v3.2 additions (social-memory III — the other person's ledger,
  // social-memory.md Part III §§32–45)
  "moral_primacy": 0.65,     // moral share of PersonModel.eval (§32)
  "moral_rehab": 0.4,        // counter-evidence update on moral dims (§32)
  "sit_credit": 0.7, "correct_gate": 0.6, // FAE correction stage (§2)
  "status_encode_gain": 0.15,// remember-up asymmetry (§2)
  "power_encode_loss": 0.2,  // stereotype-down STI discount (§2)
  "dest_decay_mult": 1.5,    // toldTo edge decay vs source (§4, §35)
  "dest_fa": 0.05,           // false "already told" base rate (§35)
  "exposure_fam_gain": 0.02, // ambient familiarity accrual (§2, §36)
  "heard_update_w": 0.4,     // gossip trait-writeback weight (§6.31)
  "disclose_eval_gain": 0.08,// disclosure→liking, both dirs (§6.14)
  "disclose_trust_gain": 0.10,// disclosure→credibility, both dirs (§6.14)
  "individ_rate": 0.15,      // per-diagnostic-encounter growth (§40)
  "cat_prior_pull": 1.0,     // category-schema interpolation weight (§40)
  "transference_thresh": 0.6,"transference_seed": 0.3,
  "transference_fill": 0.15, "transference_pool": 5, // §6.32
  "novel_pick_w": 3.0, "told_pen": 0.5, // retell novelty gate (§6.11)
  "phrase_surv_base": 0.7, "phrase_distinct_mult": 1.4, // §6.12
  // v3.3 additions (formal-model IV — society/cache/fitting layer,
  // formal-model.md Part IV §§26–35)
  "belief_hyst": 0.05,       // status-boundary hysteresis (§6.7 cache)
  "doubt_persist": 30,       // days a retraction holds "doubted" (§6.7)
  "truth_default_w": 0.75,   // untriggered told_by adoption baseline (§6.3)
  "session_scan_cap_base": 2,// scans/session = base·|members|+2 (§27)
  // v3.4 additions (character-profiles II — the narrative-self
  // layer, cast-profiles.md Part II §§8–10)
  "selfdef_cap": 6,          // max anchor records (§6.34a)
  "selfdef_floor": 0.12,     // strength below which anchors never archive
  "selfdef_drift_mult": 0.45,// core-field drift mult on anchors
  "selfdef_cue_gain": 0.10,  // anchor warm-bias added to recall drive
  "selfdef_spec_mult": 1.0,  // anchor field richness; ↓ w/ defens
  "mnem_neg": 0.25,          // self-threat recall-drive penalty (§6.34b)
  "mnem_central_thresh": 0.7,// trait-centrality gate
  "mnem_diag_thresh": 0.6,   // diagnosticity gate
  "mnem_close_relief": 1.0,  // close-source/improvement relief (§6.34b)
  "script_redeem": 0.0,      // −1 contamination … +1 redemption (§6.34d)
  "redeem_write": 0.15,      // per-retell meaning-overwrite rate
  "neg_now_pull": 0.15,      // negative-record forward misdating (§6.34c)
  "script_age_pull": 0.2,    // lifescript-positive → normative-age pull
  "invol_pos_bias": 0.2,     // positive share boost, involuntary scan
  "ambient_cap_mult": 0.4,   // ambient NPC live-store cap multiplier
  "ambient_trait_sigma": 0.3,// ambient trait-sample σ (narrow band)
  // v3.5 additions (encoding-mechanics III — capacity/competition
  // layer, encoding-mechanics.md Part III §§30–38)
  "load_att_raise": 1.0,     // perceptual load raises ambient att_min (§30)
  "load_periph_supp": 0.5,   // peripheral E suppression under load (§30)
  "load_spill": 0.2,         // low-load involuntary spillover (§30)
  "load_lapse_relief": 0.5,  // absorbed task → fewer lapses (§30)
  "wm_cap": 4,               // chunk bound on record width (§31)
  "cap_spill": 0.5,          // overflow-field write probability (§31)
  "residue_load": 0.3,       // post-boundary residual daLoad (§32)
  "residue_decay": 0.5,      // per-tick residue decay (§32)
  "next_inline_cost": 0.35,  // turn-anticipation encoding hit (§33)
  "pending_intrude": 0.04,   // per-pending-intention tonic daLoad (§34)
  "pending_cue_gain": 0.15,  // goal-related cue heating (§34)
  "intent_done_decay": 1.3,  // completed-intention β mult (§34)
  "offload_cost": 0.2,       // offloaded-content E penalty (§35)
  "offload_where_gain": 0.3, // extref pointer birth strength (§35)
  "threat_capture": 0.2,     // threat-stimulus E priority (§36)
  "threat_drain": 0.3,       // co-occurring neutral suppression (§36)
  "pre_sleep_gain": 0.1,     // pre-sleep-window shield (§37)
  "ctx_var_add": 2,          // new-context cue fields on re-activation (§38)
  // v3.6 additions (forgetting-curves IV — the curve across a life,
  // forgetting-curves.md §§17–18)
  "trans_win": 14,           // days around a transition getting E boost
  "trans_bound_gain": 0.2,   // E boost inside trans_win (§4.18)
  "xperiod_pen": 0.15,       // cross-period cueMatch penalty (§4.18)
  "period_prime": 0.1,       // same-period match bonus (§4.18)
  "bump_pos_min": 0.15,      // valence gate for ALL bump windows (§4.1)
  "retro_window": 0.02, "retro_loss": 0.5,   // Ribot graded hit (§4.19)
  "pta_window": 0.02, "pta_loss": 0.4,       // post-trauma encode fog
  "rest_s_gain": 0.1,        // S-side wakeful-rest bump (§2)
  "k_olf": 0.6, "k_vis": 1.0, "k_verb": 1.25, "k_aud": 1.1, // §4.1
  "olf_cue_gain": 1.3,       // olfactory involuntary/scan cue gain
  "intrude_hl": 7.0,         // intrusion weight half-life, days (§5.7)
  "trauma_bonus": 1.0,       // intrude_w birth multiplier on trauma
  "lat_base": 400, "lat_pow": 0.6, "lat_search": 0.4, "lat_cap": 5000,
                             // §5.25 latency channel (ms)
  "pa_gain": 0.3, "pa_cap": 3.0,             // §4.13 retell attachment
  "aff_recon_scale": 2.0,    // §5.5 affect-report appraisal blend
  "bilingual_bal": 0.3,      // §5.2 lang_mismatch attenuation
  // v3.7 additions (retrieval-cues IV — retrieval-cues.md §§33–45)
  "selfcue_mult": 1.7,       // self-origin cue weight multiplier (§5.2)
  "da_ret_pen": 0.04,        // θ tax under daLoad at test (§5.4)
  "da_breadth_pen": 0.3,     // search_breadth shrink under daLoad (§5.4)
  "lat_da_mult": 0.6,        // latency inflation under daLoad (§5.25)
  "da_monitor_pen": 0.5,     // PM monitor/intention-leg DA tax (§5.14)
  "stress_lag_min": 20,      // sim-min before cortisol penalty lands (§5.4)
  "stress_off_min": 90,      // sim-min tail of the stress penalty (§5.4)
  "stress_emo_mult": 0.5,    // valence multiplier on stress loss (§5.4)
  "fwd_win": 0.05, "fwd_test_gain": 0.12, "fwd_pi_release": 0.5,
                             // forward-testing window (§5.26)
  "repair_mood_bar": -0.2, "repair_p": 0.5, "repair_gain": 0.15,
  "repair_mood_gain": 0.05,  // mood-repair search mode (§5.27)
  "fam_bar": 0.45, "deja_prop": 0.3,   // familiar_only/deja gate (§5.28)
  "ssrif_out_mult": 0.2,     // out-group speaker SSRIF scale (§5.8)
  "pm_action_p": 0.9, "pm_vague_win": 0.5,  // PM action recall (§5.14)
  "boundary_cue_drop": 0.4, "doorway_pen": 0.2,
  "post_boundary_win": 0.02, "boundary_hit": 0.05, // doorway (§5.29)
  "iso_first": 0.1,          // isolated-record bout-first bonus (§5.31)
}

// v0.9 FROZEN population constants — same for every character, never in
// profiles (identifiability audit, formal-model.md §4):
//   k = 8 (logistic sharpness §5.4), drift_k = 0.02, tau_episodic = 1.2,
//   tau_semantic = 30, collab_size_pen = 0.1, collab_friend_mult = 1.2,
//   arousal_affect_decay = 1.4, rep_cap = 2.0
// v0.9 deepening frozen constants (formal-model.md §16):
//   s_decay = 0.0008, relearn_gain = 0.8, resurrect_R = 0.35 (§4.11);
//   tele_cross = 21, tele_back = 0.05, landmark_gain = 0.4,
//   landmark_arousal = 0.7, k_order = 4.0 (§6.15); contiguity_tau = 2.0,
//   contiguity_asym = 1.25 (§5.4); hindsight_conf_gain = 0.08,
//   hindsight_max_surprise = 0.7 (§6.16); ease_few = 1.5,
//   ease_many = 3.0 (§5.4)
// v1.2 frozen constants (encoding-mechanics.md §11):
//   intent_null = 0 (intention-to-learn adds nothing past the orienting
//   task — Postman 1964; Hyde & Jenkins 1973; guarded by P111);
//   da_ret_cost = 1.5 (retrieval-DA searchCost multiplier, §5.4);
//   lapse_window = 0.02 day (doorway reach, ~30 min);
//   elaboration weights {0.5·selfRelevance, 0.3·predictionError,
//   0.2·coherence, 0.3·survivalRelevance} (LoP derivation mix, P110)
// v1.3 frozen constants (forgetting-curves.md §§7–8):
//   tau_quote = 0.02, beta_quote = 0.8 (verbatim-speech field class —
//   Sachs 1967; same for everyone, P121); lag curve SHAPE is frozen
//   (log-normal), only lag_opt_ratio/lag_width are free
// v1.6 frozen constants (age-decline.md §§24, 31):
//   stereo_age_gate shape (0 below age 50 → ramps to 1 by 70 —
//   population gate, never per-character; stereo_suscept is the trait)
// v1.8 knot-table updates (existing params, new age knots):
//   choice_support_gain: ×1.0 ≤50 → ×1.4 at 80 (Mather & Johnson 2000)
//   crypto_p: rides discrim_mult — old-side scaling, no separate knots
// v2.0 frozen constants (social-memory.md Part II):
//   share_relief = 0 (talk never extinguishes affect — Zech & Rimé
//   2005; guarded by P184); the §5.8 facilitate/suppress switch rule
//   (links/shared-event → +rif_facil_k, cue-similar → suppress)
// v2.0 knot-table updates (existing params, new age knots):
//   corroborate_conf: ×(1 + 0.2·(age_eff−65)/20) above 65 (§6.20)
//   copresent_assume_p: ×(1 + 0.3·age_eff/60) (§6.21)
//   absorb_p: rides discrim_mult (source-decay scaling, §6.23)
// v2.4 frozen constants (encoding-mechanics.md §26):
//   abe_window = 1 tick; curios_window = 1 tick (elicitation-locked —
//   Murphy 2021); rest_window = 0.007 day (~10 min — Dewar 2012);
//   crafted fold = enact+gen+concrete sum (P230 audits); state→daLoad
//   weights {pain 0.4, hunger 0.2, fatigue 0.3}
// v2.4 knot-table updates (existing params, new age knots):
//   name_penalty: ×(1 + age_eff/80) (Cohen & Faulkner 1986)
//   df_loss: ×(1 − 0.3·age_eff/80) (Rupprecht & Bäuml 2016)
// v2.6 frozen constants (retrieval-cues.md Part III):
//   lmax = search_breadth (reuse — §5.22 stop rule); intrusion_thresh
//   is now age-FLAT by rule (§5.7, Schlagman et al. 2007 — remove it
//   from the age-knot table)
// v2.7 frozen constants + knot-table updates (age-development.md III):
//   preg_recog_spare = true (recognition exempt from preg overlay,
//   §4.17); narr_window = [12,25] fixed; OGM gate = age_now ≥ 12
//   fixed (§2); discrim_mult child knots 0.75@5 → 1.0@10 (§4.2);
//   lure_accept child knots ~1.6@5 → 1.0@10 (§5.6 — item channel,
//   phantom_p untouched); peak_hour +1.5h @13–19 (§2); off-script
//   date_sigma multiplier = 1.3 fixed (§6.15)
// v2.8 frozen constants + knot-table updates (age-decline.md III):
//   lure_sync_gate shape frozen (0 below 50 → 1 by 70; §5.6);
//   potent_gain old knots ×1.0 ≤50 → ×0.55@85 + potent_window gate
//   (§4.11); self_est_bias drift extends: −0.05@70 → −0.12@85 (§3);
//   complaint_k ×1.0@30 → ×1.5@85 + 0.2·depress_state (§10);
//   pm_focal_hit, enact_gain, rep_gain, involuntary scan rate,
//   metamem_r, warn_mult declared AGE-FLAT nulls (P263/P266/P268
//   guards — deliberate non-changes, cite-guarded in
//   age-decline.md §45)
// v2.9 knot-table updates (emotional-memory.md III §37):
//   arousal_opt: −0.05 knot at 70 (older benefit peaks earlier);
//   trust_neg_gain: ×0.8 at 70 (positivity direction, HYPOTHESIS);
//   nostalgia_gain: +0.05 knot at 65; hc_gap_loss: +0.05 at 70;
//   arousal_opt child knot +0.10 (hotter baseline); coh_gain ≈0
//   below the OGM gate (narrative coherence needs the faculty);
//   discrete-emotion multipliers, emo_update_k, odor_*, anniv_*,
//   wf_* declared AGE-FLAT (P274–P285 guards, emotional-memory.md §37)
// v3.0 knot-table updates (false-memory.md Part III §§26–36):
//   be_gain: ×1.0 ≤60 → ×1.2 at 75 (§6.28, preserved-to-amplified);
//   transplant_gain, conj_migrate_p, orb_gain ride discrim_mult
//   (source-decay scaling — no separate knots); neg_age_gain fires
//   only >65 (§6.29); vo_cand, vo_loss, react_window,
//   react_suscept_mult, phantom_recoll, group_damp, truthy_gain,
//   conj_thresh, cat_resist declared AGE-FLAT (cite-guarded —
//   Chan 2009 found reversed-testing in both cohorts; VO and
//   truthiness lack age-gradient evidence; P286/P291/P295 guards)
// v3.3 frozen constants (formal-model.md Part IV):
//   recov_tol = 0.10, bh_q = 0.10, probe_n_prop = 384, probe_n_sign = 60
//   (harness-level — live in the probe harness, not MemoryParams);
//   degradation ladder L0–L4 is a documented-modes contract, not params
// v3.5 frozen constants (encoding-mechanics.md §40):
//   residue_ticks = 3; nil_reach = 3 utterances; pre_sleep_window =
//   0.125 day (~3h — Gais 2006); pending_intrude_cap = 0.2 (n cap 5);
//   offload_intrude_relief = 0.3; extcue_bind_mult = 0.5;
//   suppress_da_map = 0.2 (momentary suppression → daLoad);
//   perceptLoad_low = 0.3; load_flag_thresh = 0.6
// v3.8 additions (age-development IV, age-development.md §§36–47)
"verbal_lock_thresh": 0.6, // verbal_age below → retell emits verbal_void
                           // (verbal_age knots: 0@2y, .4@2.5, .8@4, 1.0@6)
"script_default_age": 8,   // below → repeated-class recall returns script
"script_intrusion_p": 0.3, // modal-filler fill rate, child (→0.1 adult)
"sort_window": 4,          // first-N occurrence assimilation window
"assim_p": 0.4,            // in-window deviation→script assimilation
"schema_assim_p": 0.25,    // field transform toward modal (knots .25@6,
                           // .1@12, .05@20); replaces `isolated` below flip
"schema_flip_age": 10, "schema_viol_loss": 0.15,
"choose_p": 0.3,           // forced-pick rate adult; knots .85@5, .7@8,
                           // .55@13, .55@70, .7@85 — U (Fitzgerald&Price)
"seq_choose_gain": 1.3,    // sequential-order choose_p boost <13y
"showup_mult": 1.5,        // single-candidate choose_p boost
"suggest_repeat_mult": 1.25, "neutral_inoc": 0.9, "stereo_prime": 1.4,
"embellish_p": 0.3, "taint_exit": 9,   // interview sign-split <9y
"date_loc_exit": 8, "child_date_mult": 4.0, "cyclic_acc": 0.7,
"stress_flip_age": 8, "child_stress_gain": 0.1, "child_stress_inoc": 0.8,
"sem_accrual": 1.0,        // semantic consolidation rate; knots 1.4@50,
                           // 1.6@60, 1.0@75 — crystallized keeps growing
// v3.8 knot-table updates (existing params — midlife revision, SLS):
//   enc_base: .84 → .94@50; beta_episodic: 1.31 → 1.15@50;
//   theta: 1.18 → 1.08@50. search_breadth unchanged (perceptual speed
//   IS linear-from-20s). Prior knots reinstated under low_reserve.
// v3.9 additions (age-decline V — residual channels, age-decline.md §§49–62)
"implicit_decline": 1.0,   // ×impl_decay_mult; knots →1.15@70, 1.3@85
"sim_detail_mult": 1.0,    // imagined-future verbatim count; →0.65@85
"recast_p": 0.1,           // imagine-as-copy-of-one-record; →0.4@85
"pm_deactivate": 0.95,     // completed-intention suppression; →0.7@85
"comm_habit_gain": 0.0,    // ×fires commission boost (old only)
"ctx_flux_mult": 1.0,      // ctxShift magnitude; →0.7@85 (Balota 1989)
"offload_pref": 1.0,       // offload-choice rate; →1.5@85
"offload_bias": 1.0,       // benefit weight in offload choice; →0.6@85
"offload_select": 0.3,     // high-value share of offloaded; →0.65@85
"own_age_gain": 0.15,      // same-ageBand d′ gain; criterion untouched
"update_resist": 0.05,     // versioned-pair mint on rewrite; →0.35@85
"fame_fluency": 0.02,      // sourceless-fluency→prominence; →0.15@85
"sem_search_tax": 0.0,     // θ on open-ended semantic recall; →0.06@85
"lat_age_mult": 1.0,       // ×latency_ms; →1.6@85
// v3.9 frozen constants: deact_window=7d; new_v_share 0.7 −0.01/d
//   floor 0.5; fame_window=30d; impl_decay_mult=0.5; impl_fam_w=0.4;
//   impl_reexp_gain=0.1; deact_practice_gain=1.15/resist.
// v3.9 explicit nulls: spacing_gain (age-flat — Balota 1989); pm_focal
//   reaffirmed. Record fields: impl_str; versioned pair {old_v,new_v,
//   supplantDay}; attribution:"known_around" on familiar_only;
//   commission:true on intention fires.
// v4.0 additions (emotional-memory IV — leftover affect,
//   emotional-memory.md §§40–51)
"carry_frac": 0.35,        // residue share of arousal_tag that persists (§40)
"carry_tau": 0.014,        // residue half-life, days (~20 min)
"misattrib_k": 0.4,        // residue → next event's arousal_eff (§2)
"misattr_rot_k": 0.15,     // gated valence rotation, ambiguous next events
"carry_min": 0.05, "attrib_rescue": 0.5,  // jitter floor; naming-the-source discount
"aud_status_mult": 0.3,    // audience_tune when audience outranks speaker (§6.11)
"aud_tune_arous": 0.5,     // arousal co-drift share of valence tune (§6.11)
"savor_gain": 0.2, "savor_thresh": 0.4, "dampen_mult": 0.5, // §6.40
"secure_trust": 0.7, "secure_damp": 0.25, // co-present trust → tag damp (§2)
"dur_dil": 0.4,            // verbatim.duration birth dilation (§2)
"tdist_val": 0.3, "tdist_self": 0.5,      // subjective distance, report-only (§6.15)
"w_emo_arous": 0.55, "w_emo_dist": 0.35,  // w_emo split (§2; w_emo = derived sum)
"emo_sex_gain": 0.07,      // female multiplier on w_emo_arous/emo_consol_gain
"emo_gran": 0.6,           // trait: discrete-tag precision (§2/§26)
"gran_thresh": 0.4,        // below → emotion:"mixed"
"forecast_int_bias": 1.15, "forecast_dur_bias": 1.6, // imagineEvent (§6.41)
"cue_music_w": 0.35, "music_era_gain": 1.5,          // jukebox cue (§5.37)
// v4.0 frozen constants: catharsis_relief = 0 (vent routes to rumin_k,
//   never verbal_damp — §6.39); emo_rate init 0.15, update α 0.01/day;
//   tier_mult {partner 1.0, close friend 0.6, stranger 0.2};
//   secure_damp rides attach_avoid (~×0.5 avoidant); immune neglect
//   lock — forecast biases never reduced by coh_gain/emo_gran.
// v4.0 explicit nulls: acquaintance-topic subjDist (Ross & Wilson
//   boundary); valence rotation only below |valence| 0.3 + salient
//   co-present target; music cue never below w_sensory pricing.
// Char state: carryArous, emo_rate (snapshot fields). Record:
//   emotion:"mixed" permitted; retell accepts vent:true;
//   Reconstructions may carry nostalgic:true; dateEstimate gains
//   subjDist — all snapshot-additive, absent=legacy.
// v4.0 knot-table updates (emotional-memory.md §53):
//   savor ×1.15@65, dampen ×0.8@65 (positivity-adjacent, HYPOTHESIS);
//   tdist_val ×0.8@70; emo_gran ×0.9@70 + child knot ×0.5 below 10;
//   secure_damp rides attach_avoid (trait axis, not age);
//   emo_sex_gain, w_emo_arous/dist, dur_dil, cue_music_w,
//   forecast_*, carry_*, aud_status_mult declared AGE-FLAT
//   (P412/P416/P418 guards — no lifespan evidence, deliberate).
// (tau_*/collab_*/arousal_affect_decay/rep_cap remain in the table above
// for backward compatibility; loaders should treat them as constants.)
// v4.1 additions (false-memory IV — the instrumented channels,
//   false-memory.md §§38–51)
"fb_conf_floor": 0.75, "fb_plateau": 1000, // flashbulb conf floor + drift freeze day (§6.42)
"verb_pull": 0.2, "lp_detail_p": 0.15,  // wording pull + presupposition plant (§6.43)
"fb_conf_gain": 0.25, "fb_disconf": 0.4, "retro_inflate": 0.15, // §6.44 feedback
"expect_press": 0.3, "expect_cand": 0.3, // interviewer expectancy (§6.45)
"mb_detect": 0.35, "self_cred": 1.0,    // swapReport detect + self-source ceiling (§6.46)
"ssif_suppress": 0.15,                  // listener unshared-field suppression (§6.47)
"emit_omit": 0.2,                     // omission-account emission penalty (§6.48)
"im_act_gain": 1.5, "im_act_rich": 0.1, // imagined self-actions (§6.9 ext)
"discrim_recover": 0.5,               // discriminate-mode false-emission fall (§6.50; cap ≤0.6)
"moodcong_lure": 0.25,                // valence-congruent lure selection (§6.8/§6.27)
// v4.1 explicit nulls: fb_conf_floor is the ONLY confidence floor
//   (no other operator may floor conf); feedback never edits field
//   content (P423); omission never writes candidates (P427);
//   no collective-memory operator may exist (P432);
//   discriminate mode reveals competition, never sterilizes
//   (discrim_recover ≤ 0.6).
// v4.1 knot notes: mb_detect rides discrim_mult (older adults
//   blind more — source inference reuse); moodcong_lure matches
//   traitValence per profile, not age per se; fb_conf_floor,
//   verb_pull, fb_conf_gain/fb_disconf, ssif_suppress, emit_omit
//   declared AGE-FLAT (cite-guarded — no lifespan evidence).
// v4.2 additions (individual-differences IV — clinical phenotypes,
//   regulation tax, everyday pharmacopeia; individual-differences.md
//   §§34–48)
"pos_spec_loss": 0.15,   // depr: positive-cued OGM probability (§6.52)
"neg_ogm": 0.12,         // ptsd: negative-cued generic responding (§6.52)
"trauma_sens_intr": 0.10,// ptsd: intrusion thresh cut, sensory-cued threat only (§6.52)
"frag_p": 0.2,           // ptsd: trauma-record fragmentation at birth (§6.52)
"avoid_suppress": 0.15,  // effortful theta surcharge, threat/attach-neg records (§6.52/§5.38)
"depl_release": 0.3,     // depleted state releases suppression (§5.38; Kohn 2012)
"attach_field_loss": 0.15,// attach_avoid: vivid_detail cut on attach:true, both valences
"persp_age_gain": 0.15,  // record-age → observer shift (§5.39; Nigro & Neisser)
"persp_affect_loss": 0.2,// observer emissions dampen reported arousal (§5.39)
"supp_enc_cost": 0.12,   // suppressing → E tax on social fields (§6.53)
"search_cost_mult": 1.0, // pspeed's latency target (§5.25 addendum)
"mind_lure": 0.10, "mind_rm_loss": 0.10, // mindfulness: lure/RM cost (§6.8/§6.10; Wilson 2015)
"scc_consist_gain": 0.4, // low-scc amplifies §6.17 consistency pull
"smoker_pm_loss": 0.10,  // chronic objective PM deficit, self-report blind (§42)
"nic_dep_pm": 0.15,      // deprivation-state PM cut, restored never enhanced (§42)
"caff_consol_gain": 0.08,// post-encoding caffeine → next-day lure discrimination (§42)
// v4.2 explicit nulls (individual-differences.md §44, normative):
//   depr → enc_base/beta_*/theta = 0 and neg-cue specificity ≈ 0;
//   ptsd → non-threat intrusion = 0, semantic/procedural = 0;
//   attach_* → off-tag material = 0; reap → ALL encoding params = 0;
//   pspeed → accuracy/decay/threshold = 0 (latency only);
//   mindful → any lure/false-recognition REDUCTION = 0 (sign is +);
//   nicotine → above-baseline gain = 0; caff → hit-rate/d′ = 0
//   (discrimination-only, Borota 2014); persp_obs → stored fields
//   = 0 (report layer); scc → non-self records = 0.
// v4.2 knot notes: pspeed joins the age_eff decline evaluation
//   (~−0.04/decade past 50, Salthouse) and propagates through
//   search_cost_mult; depr/ptsd/attach_*/smoker are prevalence-
//   weighted bible pins, not free MVN draws (§45); all v4.2
//   coefficients declared AGE-FLAT except pspeed (no lifespan
//   evidence — P443/P444 guards).
// v4.3 additions (social-memory IV — the ledger's failure modes,
//   social-memory.md §§48–64)
"stt_gain": 0.05, "stt_stigma": 0.08, // messenger smear + gossip stigma (§6.54)
"fam_permastore_exp": 50, "fam_permastore_mult": 0.25, // Bahrick floors (§5.10)
"edge_sym_p": 0.75, "balance_pull": 0.06, "balance_flip_p": 0.1, // §6.55
"own_share_bias": 0.25, "blame_deflect": 0.7, // >100% dyads (§6.56)
"same_source_pen": 0.7, "voices_k": 4,      // single-voice consensus (§6.57)
"retell_conf_gain": 0.03, "retell_conf_cap": 0.95, // §6.58
"conform_gate": 0.4, "conform_norm_p": 0.3, // informational/normative (§6.59)
"gossip_neg_gain": 1.4, "gossip_known_w": 0.5, // tell-selection (§6.60)
"discredit_mult": 1.4,                      // sleeper-effect tag decay (§6.61)
"pep_k": 0.15, "pep_days": 7, "pep_neg_drift": 0.03, // PEP (§6.62)
"partner_eval_pull": 0.15,                  // present repaints past (§6.63)
"overhear_w": 0.5, "overhear_person_gain": 1.2,    // eavesdrop (§6.64)
// v4.3 explicit nulls: g_mem → no STT exemption (associative,
//   ability-blind); meta_cal → no retell_conf_gain undo (fluency
//   writes conf before calibration reads it); wmc → no edge_sym_p
//   gate (schema prior, not computation); distrust → no sleeper
//   block (discount rots at source rate regardless).
// v4.3 knot notes: balance_pull/balance_flip_p, same_source_pen,
//   conform_norm_p ×(1+0.2–0.3·age_eff/60) — schema reliance and
//   source-tracking decline; pep_k ×(1−0.2·age_eff/60) — PEP
//   attenuates with positivity shift (HYPOTHESIS); overhear_w
//   ×(1−hearing_loss) rides the v2.8 hearing trait; discredit_mult,
//   stt_*, fam_permastore_*, own_share_bias, retell_conf_*,
//   gossip_*, partner_eval_pull declared AGE-FLAT (cite-guarded).
// v4.5 additions (character-profiles IV — bible-driven refinement,
//   cast-profiles.md §14)
"chrono_peak_hr": 14,      // compiled from routine wake + chronotype (§6.65); null = flat
"sync_gain": 0.15, "sync_implicit_flip": 0.15, "sync_age_gain": 0.3, // §6.65
"func_self": 0.33, "func_dir": 0.33, "func_soc": 0.33, // TALE selection (§6.66)
"concern_gain": 0.25, "concern_intrude": 0.08,          // wants gate (§6.67)
"fab_dir": 0.0, "fab_discomfort": 0.5, "fab_deflate_gain": 0.05, // §6.68
"collab_inhib": 0.10, "collab_cue_p": 0.6,              // §6.69
// v4.5 explicit nulls: meta_cal → no fab_inflate exemption (source
//   monitoring, not metacognition, moderates); func_* → θ/E/θ-gate
//   = 0 (selection only, never capability); omission register →
//   fab_* = 0 (no claim emitted, no mechanism fires); lie_freq is a
//   record field (dose counter), not a param — lives on ProfileInput.
// v4.5 knot notes: chrono_peak_hr −1hr/2dec past 60, sync_gain
//   ×(1+sync_age_gain·age_eff/70) — §6.65; concern week/season/long
//   clock decay is schedule-driven (7d/45d/persistent); collab_inhib
//   declared AGE-FLAT cite-guarded.
// v4.6 additions (encoding-mechanics IV — the gate's exceptions and
//   the social cast, encoding-mechanics.md Part IV §§44–57)
"field_upd_min": 0.35, "animacy_upd_gain": 0.10, // stale-field gate (§44)
"ownname_break_p": 0.35, "ownname_wmc_slope": -0.10, "ownname_tail": 2, // §45
"humor_gain": 0.12, "humor_retr_gain": 0.05,     // attended-only (§46)
"animacy_gain": 0.10,                          // animate content + piggyback (§47)
"incongr_elab": 0.15, "congr_gain": 0.05,      // expectancy sign flip (§48)
"impress_primacy": 0.20, "impress_recency_p": 0.15, // §49
"motiv_narrow": 0.15,                          // approach-motivated positive narrowing (§50)
"lie_enc_gain": 0.10, "lie_src_weak": 0.20,    // deception effort + weak source (§51)
"note_gen_gain": 0.10,                         // generative notes (§52)
// v4.6 explicit nulls / locked constants: note_mode_null = 0 (locked —
//   modality adds nothing, Urry 2021/Morehead 2019); impress_strong_thresh
//   = 0.6 (frozen exposure gate for the §48 sign flip); g_mem → no
//   ownname_break_p moderation (inhibition failure, not ability);
//   humor → no sub-att_min gain (incidental attenuation locked);
//   lie_src_weak → content accuracy = 0 (sourceStr only); monitor_tail
//   never accumulates (re-breakthrough resets, not adds); stale:true
//   is E-tier — never surfaces in reconstructions as a flag.
// v4.6 knot notes: field_upd_min ×(1+0.2·age_eff/70) (Veiel 2006);
//   incongr_elab ×(1−0.15·age_eff/80), congr_gain ×(1+0.2·age_eff/70)
//   (schema reliance rises — HYPOTHESIS); ownname_*, humor_*,
//   animacy_*, impress_*, motiv_narrow, lie_*, note_gen_gain declared
//   AGE-FLAT cite-guarded.
// v4.7 additions (forgetting-curves V — channel curves,
//   forgetting-curves.md §§22–26)
"ps_gate": 0.5, "ps_recount": 2, "ps_transf": 0.5, // persSem mint (§4.23)
"rk_thresh": 0.3,                                 // remember↔know gate (§4.23)
"fam_interf_mult": 1.3, "recol_interf_mult": 0.7, // channel asymmetry (DEBATED)
"order_sigma": 0.35, "order_decay": 1.5, "order_script_p": 0.5, // §5.40
"dream_mint": 1.5, "tau_dream": 0.004, "beta_dream": 1.2, // §4.24
"dream_recall_p": 0.1, "dream_cond_mult": 0.3,
"beta_proc_cont": 0.02, "beta_proc_cog": 0.12,   // §1 skill split (C42)
"skill_overlearn": 0.5,                           // β× at level≥0.8/uses≥50
"cueBind_init": 0.4, "pm_sleep_gain": 0.2,       // §9 sleep consolidation
"beta_pm_fired": 0.5,                            // §9 post-resolution decay
"transg_vivid_mult": 1.3,                        // §4.23 phenomenology only
"vis_fam_floor": 0.1,                            // §5.28 Standing bound
// v4.7 locked nulls: transg → verbatim accuracy/gist/storageS/persSem
//   = 0 (Stanley 2018 arm — phenomenology dims, content never falsifies);
//   dream → θ-drive/ordinary recall path = 0 until wake-encoded;
//   order_sigma reads no E (slope-invariance §12.2); recol_w/fam_w are
//   derived — no independent stores to desync.
// v4.7 knot notes: beta_proc_cog ×(1+0.1·age_eff/70) (older workers lose
//   unused cognitive procedures faster — Arthur moderator, HYPOTHESIS);
//   dream_recall_p rides trait `dreamRecall` (Butler & Watson 1985),
//   not age; ps_*, rk_thresh, order_*, cueBind_init, pm_sleep_gain,
//   beta_pm_fired, transg_vivid_mult, vis_fam_floor declared AGE-FLAT
//   cite-guarded (dream decline with age is handled via dreamRecall
//   trait jitter + sleepQuality, not a knot).
// v4.8 additions (retrieval-cues V — the cue's plan, rival, and
//   reach, retrieval-cues.md §§46–56)
"impl_bind_gain": 1.5, "impl_focal_lift": 0.3, "impl_cost_mult": 0.5,
"name_sem_gap": 0.08,                        // §5.10 Baker paradox
"enact_selfcue": 1.3, "enact_recall_gain": 1.15,   // §5.41
"gen_direct_bar": 0.7, "hier_descent_p": 0.6,      // §5.42 routes
"lifecue_gain": 0.12,                          // §5.43 milestone drive
"hyper_gap": 0.5, "hyper_gain": 1.5,           // §5.11 spaced bouts
"crosscue_far": 0.4, "crosscue_close": 0.8, "crosscue_close_bar": 0.7,
"crosscue_emergent_p": 0.03,                   // §6.69 partner cues
"sdr_gain": 0.08,                              // §5.46 encodePhys leg
"arousal_cue_hi": 0.7, "arousal_cue_narrow": 0.6,
"arousal_dom_gain": 0.1,                       // §5.47
"tot_age_k": 0.8, "tot_res_age_loss": 0.4, "tot_alt_age_loss": 0.5,
"df_pen": 0.06, "df_rehearse_pen": 0.6,        // §5.48
// v4.8 locked nulls: sdr_gain = 0 in recognition mode (Goodwin
//   1969); encodePhys mismatch = 0 cost (Eich 1980 — null, not
//   penalty); df never archives/deletes and shows no deficit under
//   rich cues (soft-DF only — the strong inhibitory version stays
//   §5.23's TNT); milestone must NOT alter accuracy (retrieval
//   privilege only); impl rigidity: unplanned cues never gain the
//   impl lift (P513).
// v4.8 knot notes: hier_descent_p carries its own ×(1−0.3·ageScale)
//   inline; tot_* age terms carry theirs inline; all other v4.8
//   params declared AGE-FLAT cite-guarded (crosscue_* is dyad-
//   property, not age; enact_* claimed age-flat by Roberts 2022
//   patient arms).
// v4.9 additions (age-development V — AD§§48–56)
"school_leak": 0.5, "coherent_leak_rescue": 0.5,   // §4.1 β tail 7→11
"l1_lock": 0.5, "l1_emo_gain": 0.1,                // §5.2 era-depth
"pub_emo_gain": 0.15, "pub_theta": 0.05,
"pub_stress_gain": 0.15, "pub_years": 5,           // §4.17 overlay
"epochal_gain": 1.3, "chapter_tell": 0.1,          // §4.1 cohort
"anchor_query_gain": 0.4, "earliest_tele_gain": 1.5, // §6.15
"earliest_stab": 9.0,                              // §6.15 output gate
// v4.9 locked nulls: l1_emo_gain = 0 when l1_until < 6 (Harris
//   2003: early bilinguals show no L1 advantage); told_by/
//   hearCount = 0 lift below pierce_age+1 (Usher & Neisser 1993);
//   latency never feeds θ (unchanged invariant, now incl. child
//   knots); milestone/public_scale never alter accuracy
//   (retrieval privilege only — extends the v4.8 milestone null);
//   earliest is never a stored field (output only).
// v4.9 knot notes: school_beta_mult/lat_age_mult child knots
//   carry curves inline (keyed encodeAge / age_eff); pub_*
//   legs are overlay-scoped (revert at window close);
//   culture_exit_off/culture_env/auto_style/detail_emit_gain/
//   pub_timing/l1_until live on the PROFILE, not MemoryParams —
//   bible fields per profiles doc §34.
// v5.0 additions (age-decline V — AD§§63–77, the binding bill)
"adh_bind_tax": 1.0, "namepair_tax": 1.0,
"meaningful_link_rescue": 0.3,               // §4.25 (adh_intent_gate frozen ON)
"wm_store_mult": 1.0, "wm_reorder_mult": 1.0, "wm_complex_mult": 1.0,
"seg_boundary_p": 1.0, "emo_ctx_gain": 1.0,  // §4.26/§4.27
"da_enc_tax": 1.0, "da_ret_tax": 1.0,        // §5.49 (da_ret_spill derives)
"rif_age_tail": 1.0,                          // §5.50 (da_rif_weak frozen 0.5)
"mw_decline": 1.0, "sdt_share": 0.5,          // §5.51 (sdt_min_cue frozen)
"test_fb_req": 0.2, "test_nofb_mult": 0.8,    // §5.52
"mon_source_tax": 0.0, "illus_recol_p": 0.03, // §6.70
"bump_emit_w": 1.0,                           // §6.71
// v5.0 locked nulls: DA-at-retrieval → miss rate = 0 at ALL ages
//   (Craik 1996); expanded>equal schedule shape holds at both ages
//   (Balota 2006); incidental encodes show item≈assoc loss (O&N-B
//   2008 — adh_intent_gate locked ON); intrusive-trauma channel
//   exempt from mw_decline; wm_complex_mult never re-taxes
//   search_breadth/pm_self (justification, not second decline);
//   emo-item legs (w_emo/emo_consol_gain/abc_gain) stay off the
//   decline curve — reaffirmed.
// v5.0 knot notes: all v5.0 params carry age_eff curves inline
//   (AD§75 table); rif_age_tail/df pivot ~75 is group-mean —
//   reserve/aging_rate shift it via age_eff; sdt_share is
//   lab-calibrated (conversations run hotter — cues are people).
// v5.1 additions (emotional-memory V — EM§§56–65)
"anticip_gain": 0.4,                          // §4.28
"betrayal_thresh": 0.6, "betrayal_trust_gain": 0.35,
"betrayal_thin": 0.3, "betrayal_avoid_k": 0.4, // §4.29
"vic_cond_mult": 0.6, "inst_cond_mult": 0.3,   // §4.29 (Olsson & Phelps)
"dream_emo_w": 0.6, "dream_neg_bias": 0.15,    // §5.53 (×2 under mood<0)
"shame_avoid_k": 0.35, "shame_intrude_k": 0.15,// §5.54
"guilt_rehearse_k": 0.3,                       // §5.54 (+amends_urge counter)
"forgive_rumin_k": 0.7,                        // §5.55 (RelEdge.forgive gate)
"nostalgia_trigger_k": 0.3, "nostalgia_lift": 0.15, // §5.56
"mood_confab_k": 0.25, "mood_crit_shift": 0.1, // §6.72
"rep_habit_k": 0.15, "rep_script_gain": 0.2,   // §6.73
"emo_inertia": 0.3,                            // §6.74 trait (depr→0.7)
// v5.1 locked nulls/constants: betrayal → amnesia = 0 (avoidance,
//   never erasure — McNally-side conservative read); recurrence at
//   encode-arousal ≥0.8 resets n_recur (escalation is a new event);
//   anticip records never merge into the real-event record;
//   instructed fear mints no episodic record (cue tag only).
// v5.1 knot notes: vic_cond_mult ×1.2 below 12; dream_neg_bias ×1.3
//   below 12; shame tag gated <6y / guilt <4y; forgive accrual ×1.2
//   at 65+; nostalgia_lift ×1.1 at 65+; emo_inertia ×1.2 adolescent,
//   ×1.1 at 75+; rep_script_gain higher below 10; anticip_gain
//   ×1.1@50, ×0.8@75 — all HYPOTHESIS unless noted (EM§67).
// v5.2 additions (false-memory V — FM§§52–64)
"anchor_w": 1.5, "persever_resid": 0.4,        // §6.75 incumbent + residue
"test_window": 1.0, "test_pot_mult": 1.3,      // §6.76 reversed testing
"own_emit_gain": 0.1,                          // §6.76 emitted-answer bonus
"exp_fill_p": 0.25, "exp_thresh": 0.6,         // §6.77 encode-time schema fill
"ev_cred": 0.95, "retro_evid": 0.2,            // §6.78 artifact ceiling/backfill
"why_mint_p": 1.0,                             // §6.79 reason mint on probe
"fic_penalty": 0.5, "fic_known_prior": 0.15,   // §6.80 fiction channel
"corrob_root_req": true, "lineage_conf": 0.5,  // §6.81 genealogy rule
"reappr_k": 0.35,                              // §6.82 re-appraised affect
"yield_suscept": 0.35, "shift_suscept": 0.35,
"shift_int_frac": 0.4,                         // §6.83 GSS two-factor split
"intent_done_p": 0.08, "comm_err_p": 0.2,      // §6.84 intention completions
// v5.2 locked constants: reason/motive fields never encode verbatim
//   (why_mint_p is a MINT rate, not an omission probability);
//   process-debrief is the ONLY anchor-eviction path; act-monitoring
//   is the ONLY intent_done rescue — attention on the doing, never
//   the intending.
// v5.3 additions (individual-differences V — ID§§49–62)
"sself_enc": 0.15, "sself_other_loss": 0.2,    // §6.85 ego ledger legs
"alex_flat": 0.3, "alex_confab": 0.5,          // §6.86 affect channel
"circ_jitter": 0.1,                            // §6.87 clock variance (0–0.4)
"pain_tax": 0.15,                              // §6.87 anterograde pain tax
"task_load_cost": 0.5,                         // §6.87 PM monitoring spend
"rosy_retro": 0.2,                             // §6.88 rosy-arc amplitude
// v5.3 locked nulls: self_srv → solo-event + all distortion params
//   = 0; alexith → neutral material + non-affective specificity = 0;
//   media_m → beta_* + attended enc_base = 0; early_adv → enc_base/
//   beta_*/semantic = 0 (control deficit only); circ_irr → ALL
//   mean-level params = 0 (variance claim only); pain_state →
//   pre-pain retrieval + post-pain residue = 0; task_load → non-PM
//   encoding + stored strength = 0; music → all non-verbal channels
//   = 0; rosy → non-valenced fields + trauma records = 0;
//   birth_order → EVERYTHING = 0 (mandated null, Rohrer 2015).
// v5.3 state fields (context, not traits): task_load, pain_state ∈
//   [0,1] on encodeEvent/recall contexts.
// v5.4 additions (social-memory V — SM§§65–80)
"name_meaning_gain": 0.3, "name_distinct_gain": 0.25,  // §5.10 tier-3
"spot_mult": 1.0, "spot_offense_p": 0.3,               // §6.89 spotlight
"promise_cred_w": 1.3, "promise_debt_w": 0.8,
"breach_p": 0.6,                                       // §6.90 promise ledger
"hp_exp": 0.7, "solve_set_relax": 0.5,                 // §6.91 hidden profile
"truth_def_bias": 0.61, "susp_persist": 0.7,           // §6.92 TDT + residue
"copres_w": 0.6, "group_blind": 0.4,
"copres_schema_fill": 0.3,                             // §6.93 who-was-there
"keeper_mint": 0.7, "keeper_cue_w": 1.0,               // §6.94 memory labor
"dif_mult": 0.5, "dif_days": 7, "deny_src_weak": 0.5,  // §6.95 liar's ledger
"ostrac_gain": 0.6, "ostrac_persist": 0.3,
"excl_scope_drift": 0.2, "ostrac_vigil": 0.2,          // §6.96 exclusion
"h_dap_thresh": 0.7, "anchor_date_gain": 0.3,          // §6.97 H-DAP anchors
"rev_moral_neg": 1.5, "rev_moral_pos": 0.4,
"rev_abil": 0.8, "moral_bad_thresh": -0.3,
"moral_repair_k": 3,                                   // §6.98 moral ledger
// v5.4 locked nulls: expectOtherRecall reads NO witness actuals
//   (the bias IS the mechanism); no demeanor/lie-cue params exist
//   (TDT — cue reading is the failed path); creditor expectation
//   gives debtor records zero rehearsal; novelty gate cannot
//   rescue unsampled records (sampling precedes novelty); keeper
//   boosts no non-relational channel; deny/fabricate share no code
//   path (opposite source-memory signs); arousal/conf alone never
//   mints h_dap anchors.
// v5.4 trait: keeper ∈ N(0,1), bible-pinnable (Rosenthal skew).
// v5.5 additions (formal-model VI — machinery, pop/harness only)
"canon_float": "r64-shortest", "hash_algo": "xxh64",   // §13.4 canon
"fp_tol": 1e-12, "approx_tol": 1e-3,                   // §13.4/§13.5 tols
"mix_correct": 0.6, "mix_band": 0.15,                // §13.2 mean-field
// v5.5 locked nulls: verbatim_mint = 0 (no rewrite rule writes V
//   post-commit — G1); orphan_rewrite = 0 (every content delta
//   traces to the §13.1 catalog — G2); meanfield_drive = 0 (the
//   mean field predicts K(t), it never steers spread — §13.2).
// v5.6 additions (character-profiles V — the self layer)
"self_est": 0.62,                 // standing self-evaluation, §6.99
"selfverif_w": 0.6,               // consistency-vs-enhancement gate, §6.100
"self_complex": 4,                // self-aspects count 2..8, §6.101
"self_comp": 0.5,                 // compartmentalization, Showers §6.101
"repress": 0.0,                   // DERIVED defens·(1−neurot_report), §6.102
"repr_neg_shift": 1.5,            // years, earliest-negative shift, §6.102
"remin_w": 0.5,                   // idle-reminiscence share, 55+, §6.103
//   remin_style is an enum field, not a param — see §6.103 table
"counterf_k": 0.15,               // near-miss counterfactual mint, §6.104
"regret_inact_mult": 0.45,        // inaction-regret β multiplier, §6.104
"regret_opp_gate": 0.8,           // opportunity-closure disengagement, §6.104
"savor_k": 0.5, "dampen_k": 0.4,  // positive-affect valves, §6.105
"future_cont": 0.55,              // future-self continuity, §6.106
"pself_mint": 0.1,                // possible-self record rate, §6.106
"elabor": 0.4, "elabor_dyad_gain": 0.2, // co-narration, §6.107
// v5.6 locked nulls: se_accuracy_null = 0 (self_est moves selection
//   and valence, never fidelity — P612); sc_capacity_null = 0
//   (self_complex partitions indexing, adds no storage/accuracy —
//   §6.101); repr_erase_null = 0 (repress suppresses ACCESS, the
//   records are never deleted — §6.102, Davis 1990 recognition-null
//   included).
```

**Trait layer (v0.7):** parameter vectors are generated from a small
correlated latent trait vector `IndivTraits` (g_mem, wmc, neurot, extra,
consc, open, vivid, distrust, fantasy, sleep, stress, social, sex,
chronotype — plus the v1.9 block: inattn, verbal, gc, meta_conf,
checker, culture_self, fitness, aging_rate, dissoc, empathy, langs,
iiv; v2.8 adds `hearing` — age-correlated, trait-jittered; v3.1 adds
face_ability, adhd, asd, suggs, vigil, aim, hand_mix; v4.2 adds
depr, ptsd, attach_anx, attach_avoid, persp_obs, supp, reap,
pspeed, mindful, scc, smoker — Part IV §43; v5.3 adds self_srv,
alexith, media_m, early_adv, circ_irr, chron_pain, music, rosy, and
the locked-null birth_order — Part V §60; v5.4 adds keeper —
SM Part V §76; v5.6 adds `self_est` (self-evaluation — NOT metamemory;
P614 null-locks the confusion), `elabor` (co-narration style), and
`neurot_report` (self-reported distress — diverges from `neurot` only
under defensiveness, the §6.102 repressor divergence)) — sampled MVN(0, R) with the sparse correlation matrix in
`individual-differences.md` §4/§17/§30/§43/§60 (pinned traits conditioned per the
§17 MVN-conditioning formula), then projected through the loading tables
(§3/§17 there) onto these params, plus ±5% residual jitter. This replaces
v0's independent ±10% jitter: real individual differences are
correlated (a low-WMC person is forgetful AND suggestible AND
source-confused — Jaschinski & Wentura 2002; Zhu et al. 2010), and
correlated flaws are what make a character's mind legible. Explicit
nulls the generator must preserve: no `g_mem → misinfo_suscept` direct
path (HSAM is not suggestion-immune — Patihis 2013), no `wmc →
cie_residual` (Brydges 2018), no `vivid → accuracy` (Dawes 2022).

**Continuous age evaluation (v0.3):** age-sensitive params are no longer
fixed per archetype — each is a piecewise-linear function of `age_now =
(worldDay − birthWorldDay)/365` (capacity params: enc_base, beta_*,
theta, misinfo_suscept, drift_p, confab_fill, neg_affect_decay, link_p,
intrusion_thresh, w_emo, w_self, att_min, pm_self) with the knot table in
`age-development.md` §6, evaluated at runtime and re-anchored yearly. Era
params use `encodeAge` on the record instead. The profile archetypes are
named knots on these curves — individual profiles = curve value ⊕
modifiers ⊕ jitter, unchanged. **v0.4:** decline-side capacity params
evaluate at `age_eff = age_now − reserve·reserve_shift` (§4.8);
**v1.9:** `age_eff = (age_now − reserve·reserve_shift)·(1 +
0.2·aging_rate − 0.15·fitness)` — individual aging slopes differ
(Salthouse; Rabbitt) and aerobic fitness slows them (Erickson et al.
2011; Colcombe & Kramer 2003); `aging_rate`/`fitness` are trait
passthroughs (individual-differences.md §15). **v1.9 optional:**
yearly trait drift (maturity principle, Roberts et al. 2006 — neurot
−0.02σ/yr, consc +0.02σ/yr, ages 20–50, clamped) re-derives affected
params at the existing yearly re-anchor; the
age-decline knot rows are in `age-decline.md` §13 (search_breadth,
env_support_gain, discrim_mult, lure_accept, specificity, tot_rate,
sws_mult, ret_noise — decline curves, ≥30 side). **v0.5:** the emotional
params (`w_emo`, `emo_consol_gain`, `abc_gain`, `conf_emo_gain`,
`neg_fidelity`, `neg_core_resist`) are deliberately NOT on the decline
curve — emotional-memory enhancement is preserved in aging, so its
proportional advantage grows as the neutral baseline falls (Kensinger et
al. 2007; emotional-memory.md §10).

Suggested clamp ranges are in `character-memory-profiles.md` §0 — implementers
should validate params into those ranges at load.

---

## 8. Tick architecture (suggested, cheap)

- **On event:** encoding pass §2 (O(1)); if the event carries
  `locShift:true`, additionally apply the §2 doorway penalty to
  last-`lapse_window` records and pending Intentions (v1.2).
- **Daily tick:** decay pass §4.1 (all records), interference/genericization
  §4.2–4.3 only on records sharing cue keys (bucket by cue, never O(n²)),
  sleep consolidation §2 (also applies §4.6 consol_beta_mult to same-day
  records), affect fade §4.5, permastore check §4.7 on semantic records.
- **On conversation/perception:** retrieval §5 → reconstruction →
  reconsolidation §5.9 → drift §6.1; rumor heard → §6.3; co-discussion → §6.5
  (with part-list suppression §5.8).
- **Ambient tick (unfocused attention):** involuntary-retrieval scan §5.7 —
  bucketed by cue key, same O(near-fan) cost class as interference.
- **Budget:** expect ~200–800 live records per main character; archive below
  threshold. Ambient NPCs run the same equations with a coarser tick and
  smaller caps (they're thin-AI anyway).

## 8.1 Formal semantics pointer (new in v0.9)

The tick sketch above is superseded by `formal-model.md`, which is the
authority on: timebase/units (day floats; decay evaluated as R(Δt) never
per-tick-multiplied — power-law scale invariance makes tick granularity a
compute decision); Event/CueContext schemas + derived-field defaults
(attention/selfRelevance/novelty/predictionError); strict operator order
for encodeEvent, recall, dailyMemoryTick, hearAccount (order-sensitive
pairs are only consolidation→decay and merge→archive); the frozen-vs-free
parameter split; caps (enc_quota_per_day, cap_episodic, cap_archive,
cap_persons); ambient degraded mode (ambient_tick_mult, ambient_cap, no
phantom/scan machinery); possession semantics (records encode with hidden
`possessed` flag + `possess_alien` estrangement discount at retrieval;
scan suspended; resume replays ≤ catchup_max daily ticks then aggregates);
seeded RNG `rand(seed, charId, worldDay, opSeq)` for bit-identical replay.

## 9. Non-goals for v0

No procedural-skill dynamics. No language-level rumor simulation; distortion
is field-level. No neural plausibility — functional equivalence only.
Prospective memory moved from non-goal to **optional extension** in v0.3:
`Intention = {action, triggerCues, dueDay}` — event-cued intentions resolve
through the ordinary §5 formula (older adults unimpaired); uncued deadlines
resolve via `pm_self` probability (older adults impaired). This reproduces
the age-PM paradox for free. See `age-development.md` §7.
**v1.3:** armed event-based Intentions decay at `beta_pm` (0.15) while
waiting — they barely fade because retention is tested *at the cue*
(Einstein & McDaniel 1990); on trigger-fire the intention resolves into
an ordinary episodic record and decays normally. The v1.2 doorway
penalty still applies — PM failure is a cue problem, not a decay problem.
**v4.7 (forgetting-curves.md §22.6/§22.8):** Intentions gain `cueBind` ∈
[0,1] (init 0.4·(focal?1.2:1)) — the intention–cue association
consolidates across sleep: armed intentions take `cueBind +=
pm_sleep_gain·sleepQuality·(1−cueBind)` (0.2) at each sleep tick, and the
§5.14 monitor/clock fire rolls multiply by `cueBind` (Scullin & McDaniel
2010 — "sleep on it" literally works; the insomniac's errands leak). On
fire/cancel the resolved record's decay class switches to
`beta_pm_fired` (0.5): the armed representation was maintained, the
fired one releases (Marsh, Hicks & Bink 1998). The §5.33 `deact_window`
residual-firing channel is UNCHANGED — record fades fast while its
trigger cue still misfires ~7 days; the literature's tension is kept,
not resolved (DEBATED magnitude). P509/P511.

## 10. Interface contract for game-systems

- `encodeEvent(charId, event, context) -> MemoryRecord|null` — event may
  carry `arousal`/`valence`; v0.5 triggers the emotional blink, trauma
  tagging, ABC reallocation, and conditioned-affect acquisition internally
- `recall(charId, cueContext, k) -> [Reconstruction]` (with confidence,
  beliefStatus); `cueContext.mode` ∈ `"recall" | "recognition"` (v0.2, §5.6);
  a Reconstruction may carry `tot: true` with blanked name fields
  (v0.4, §5.5) — dialogue should render it as feeling-of-knowing
  ("…the woman from Mudhaus, name's right there"). v0.5: `cueContext` may
  carry `stress` (0..1 — acute retrieval impairment, §5.4) and `mood`
  (drives mood_bleed on the reported affect tag, §5.5). v0.6: a
  Reconstruction may originate from a `phantom:true` record (§6.8) —
  the flag is NEVER exposed to the character; it exists for the
  history browser and validation probes only
- `conditionedAffect(charId, cue) -> {valence, arousal}|null` (v0.5, §4.9)
  — read the conditioned-association response to a cue; dialogue/
  behavior layer uses it for avoidances and attractions that outlive the
  episodic source
- `ambientMemoryScan(charId, context) -> [Reconstruction]` — involuntary
  recall for unfocused ticks (v0.2, §5.7)
- `hearAccount(charId, speakerId, account)` → misinformation merge.
  v0.6: `account` may carry `warned: true` (listener flagged the source
  as unreliable — halves adoption, §6.3), `disputed: true` (listener
  contradicted live — near-immunity, §6.5), `type: "correction"`
  (retraction path — §6.6, flips beliefStatus→"doubted" at
  `retract_p` while content keeps `cie_residual` inference weight).
  `hearCount` on the content hash increments regardless of speaker —
  repetition, not variety, is the fluency mechanism (§6.3)
- `orderRecall(charId, a, b) -> {order, p}` (v4.7, §5.40) — pairwise
  temporal-order judgment, reconstructed from drifted times + script
  priors; dialogue must route order claims through this, never read
  `createdDay`. Reconstructions carry `reportMode:"remember"|"know"`
  (v4.7, §4.23 — `know` = fluent content, thin detail, low latency)
- `imagineEvent(charId, scenario)` (v0.6, §6.9) → writes/strengthens an
  `imagined`-source record gated by `plaus_min`; used for daydreams,
  rehearsed lies, and guided probing; records can later flip to
  `witnessed` via source decay + richness gate (reality-monitoring
  failure)
- `discussEvent(charA, charB, eventRef)` → bidirectional merge + part-list
  suppression of unspoken fields (v0.2, §5.8); v0.6: emit `disputed`
  on hearAccount when a listener's reconstruction contradicted a field
  during the discussion (§6.5)
- `retell(charId, audienceId, record)` (v0.8, §6.11) → audience-tuned
  drift of the speaker's own record; requires `audienceStance` from the
  dialogue layer, gated by `shared_reality_gate`; on `told_by` records
  additionally runs the §6.12 serial-reproduction operators (leveling,
  stereotype convergence) — retransmission is the rumor engine
- `groupRecall(members, C)` (v0.8, §6.13, optional) → collaborative-
  inhibition wrapper for group-reconstruction scenes; returns the
  inhibited union and applies postcollab boosts + member-side SS-RIF
- `recall(charId, cueContext, k)` — v0.8: `cueContext.targetPerson` on a
  recognition-mode call invokes the §5.10 cascade (returns
  `familiar_only`/`identity`/`tot` tiers); `cueContext.mode:"directory"`
  returns `knowsTopics`-ranked candidates (§6.14)
- `hearAccount` — v0.8: `account` may carry `chainPos`/`hop` for the
  §6.12 transmission operators; speaker credibility now resolved from
  `PersonModel[speaker].credibility` (§6.14) when a model exists
- `dailyMemoryTick(charId, sleepQuality)` → decay/interference/consolidation
  + v0.5: selective emotional consolidation and retrograde stress
  enhancement on the first sleep tick, affect-tag decay split, conditioned
  -affect decay/recovery (§4.9); v0.6: `sleep_gist_boost` on generic +
  phantom records (§4.6), source-decay check feeding `sourceInfer`
  (§6.10)
- `memorySnapshot/Load(charId)` → serialize the stores (episodic,
  semantic, conditioned-affect, PersonModel social store) + params +
  RNG opSeq state (v0.9 — round-trip must preserve determinism, P69)
- v0.9 deepening (formal-model.md §§10–16):
  - `recall` results carry `searchCost` (§5.4) — scored/returned ratio +
    drive margin; dialogue reads it for judged-frequency hedging
    (ease-of-retrieval). `cueContext.temporalAnchor` is set internally
    to the last recalled record's createdDay (contiguity, §5.4);
    callers may set it explicitly for guided reminiscence
  - `dateEstimate(charId, record) -> {reportedAge, reportedDay}` (§6.15)
    — telescoping + rounding + landmark anchoring; `orderBefore(m, n)`
    for date-loss-tolerant ordering
  - `learnOutcome(charId, eventRef, outcome)` (§6.16) — hindsight
    assimilation of prediction records when the world resolves an open
    question; blocked past `hindsight_max_surprise`
  - reported confidence goes through the §3 `conf_out` overconfidence
    adjustment — never write conf_out back into stored confidence
- v0.9 hard-safety rule: `possessed`, `phantom`, `accuracy`, and all
  other hidden flags/fields must NEVER serialize into possession
  briefings or any player-visible surface (formal-model.md §6)
- v0.9 ambient/offline mode: `dailyMemoryTick` accepts
  `mode:"ambient"` — coarser cadence (ambient_tick_mult), caps
  (ambient_cap), phantom minting and §5.7 scan disabled; promotion to
  main preserves existing record ids (formal-model.md §5)
- `deriveParams(archetype, modifiers, traits, seed)` (v0.7) → MemoryParams
  — the character-creation helper: applies the §3 loading table +
  residual jitter + §0 clamps so a bible trait vector deterministically
  yields a parameter vector (individual-differences.md §4). Pure
  function; pinning traits makes character generation reproducible
- `rememberIntention(charId, intention)` → optional PM extension (§9, v0.3)
- v1.0 additions (profile-generation.md §§2–4):
  - `deriveParams` now also emits `SelfModel` + `DomainTable` +
    `seedHints` side outputs; deterministic given (pins, seed); emits
    frozen constants untouched (P95 audit)
  - record flag `open` + `closeLoop(charId, recordRef)`;
    `openLoopUrge(charId) -> [recordRef]` on the ambient scan — open
    loops intrude (gain) and decay *faster* once closed (β×1.2)
  - `selfReport(charId, facet) -> self_est` — metacognitive commentary
    source; deliberately decorrelated (metamem_r ≤0.3) from real params
  - `encodeEvent` context may carry `open:true` candidates and
    `domainMatch` is derived from profile `domains` vs event cue tags
- Belief layer: `beliefStatus` on records IS the belief-vs-fact hook; rumors
  are just records with `source.kind:"told_by"` + `beliefStatus:"rumor"`.
- v1.1 (validation-design.md): hidden record fields (`accuracy`,
  `phantom`, `retracted`, `possessed`, `sleepdep_flag`, `storageS`,
  `retrievalCount`) are readable by the validation harness as the
  ground-truth tap; they must NEVER leak into dialogue, briefings, or
  feed text. Probe/analyzer output schema + acceptance gates live in
  validation-design.md §§2.5, 8.
- v1.2 additions (encoding-mechanics.md §§1–9):
  - `encodeEvent` event may carry `engagement` (observed/heard/enacted/
    generated/spoken), `daLoad` (0..1 secondary-task pull), `boundary`,
    `locShift`, `coherentUnit`, `isolated`, `survivalRelevance` — all
    optional; defaults derive from source.kind per formal-model.md §5
  - a `locShift:true` event triggers the doorway penalty on recent
    records + pending Intentions (§2; flat across age)
  - `cueContext.daLoad` (0..1) raises `searchCost` by ×`da_ret_cost`
    only — retrieval under divided attention is slow, not fragile
    (Craik 1996); never moves θ
  - `rememberIntention` records are doorway-susceptible: a locShift drops
    their accessibility like any recent record — "walked in and forgot
    why" is emergent
- v1.3 additions (forgetting-curves.md Part II):
  - `suppressEvent(charId, recordId)` → deliberate-avoidance operator
    (§4.12): cumulative θ bump capped at `suppress_cap`, R-side only,
    §5.7 involuntary scan exempt. The dialogue/behavior layer calls it
    when a character actively steers away from a memory.
  - `dailyMemoryTick` additionally runs the §4.13 retell-ecology draw
    (p_retell per live episodic record) and the childhood consolidation
    gate on records with encodeAge < amnesia_exit.
  - record schema gains `n_sim` (§4.2 PI accumulator), `suppressed`
    (int, §4.12), `attempted` (§4.11 potentiation flag) — all hidden,
    snapshot-additive, harness-readable like other hidden fields.
  - `recall`/`hearAccount` reboosts split by kind: recall grows S at
    s_gain_recall, re-exposure at s_gain_rehear (§4.11); recall results
    may surface previously-unreturned verbatim fields at
    `reminiscence_frac` (§5.11).
- v1.4 additions (retrieval-cues.md Part II):
  - `cueContext.ops` — the dominant processing channel of the retrieval
    context (semantic|perceptual|social|enactive); mismatched vs the
    record's `encodeOps` attenuates cueMatch_ext ×`tap_mismatch` (§5.12).
    Callers may omit → neutral (no penalty).
  - `recall(charId, cueContext, k)` with k>1 runs a §5.13 bout: emitted
    items compound `out_int` and part-list-suppress the unemitted;
    single-item calls unaffected.
  - `rememberIntention(charId, intention)` gains `cueType`
    (`"event"|"time"`) and `focal` — firing routes per §5.14; game-systems
    supplies `focal` from the attention budget when the cue appears.
  - `conditionedAffect` reads `extinctCtx` — `extinct_suppress` applies
    only inside an extinction context; elsewhere the entry fires at
    `strength·renewal_frac` (§5.15). Safe-exposure events pass their
    place id so the set accrues.
  - Reconstruction may carry `tot_fields` state — `syllableCue` on
    cueContext resolves a flagged TOT at `tot_resolve_p`; unresolved
    TOTs raise that field's next-attempt `tot_rate` ×`tot_persist`
    (§5.16).
  - successful `recall` runs a depth-1 derived scan over `links` at
    `chain_gain` — returned Reconstructions may carry `viaReminding: m_id`
    (§5.17).
  - `dailyMemoryTick` applies the §5.18 `tmr_gain` consolidation edge to
    records sharing a sensory cue with the sleep context; procedural and
    cue-absent records exempt.
  - record schema gains `encodeOps` and `tot_fields`; CondEntry gains
    `extinctCtx` — all hidden/harness-readable like other state fields.
- v1.5 additions (age-development.md Part II):
  - record schema gains `latent` (hidden); `dailyMemoryTick` accepts
    `nap: true` for `age_now < nap_age_exit` and runs the §4.14
    latent-window/gate transitions.
  - `recall`/`retell` bouts emit §5.19 off-target intrusions at
    `offtarget_p(age_eff)`; Reconstructions may carry
    `latent_returned: true` via the §5.20 compound-sensory route —
    dialogue should render it as a fragment ("…I smell it more than I
    see it"), never a scene.
  - `encodeEvent` event may carry `scaffolded: true`, `cultural: true`,
    `cascade: true` (world-builder supplies; defaults false).
  - `hearAccount` gains the §6.3 knowledge-protection clause —
    `know_protect_*` params; nothing caller-side changes.
  - `reminiscence_env` is a creation-time param (bible dial), fixed
    for life; `naps` is a bible flag consumed by the §4.15 tick.
- v1.6 additions (age-decline.md Part II — the compensation layer):
  - `encodeEvent` applies the §2 compensation terms — `value_select`
    importance sharpening, `positivity_gain` valence asymmetry (gated
    by daLoad/stress), `schema_support` semantic-scaffold gain, and
    `hyperbind_p` wrong-context binding (`hyperbound` fields are
    hidden/harness-readable); `w_sensory` declines on old-side knots.
  - `retell` writes `toldTo[audienceId]` and emits `alreadyTold: true`
    on a `dest_mem` miss — the repeat-story tell (§6.11).
  - `cueContext.evaluative: true` applies the §5.4 stereotype-threat θ
    tax in recall mode only (Armstrong 2017 moderator — never in
    recognition mode).
  - `groupRecall` gains `collab_partner_gain` for intimate dyads
    (§6.13) — old couples can beat their own solo union.
  - `conf_out` gains `conf_inflate_old` on wrong-flagged
    reconstructions (§3) — confident-and-wrong is the old-age signature.
  - `dateEstimate`/`orderBefore` noise scales by `ctx_loss` (§6.15).
  - record schema gains `toldTo` (hidden map) and verbatim fields may
    carry `hyperbound` (hidden) — snapshot-additive, never serialized
    to briefings/feed.
- v1.7 additions (emotional-memory.md Part II — the affect-tag layer):
  - `encodeEvent` event may carry `affectSeries` — within-event
    arousal/valence samples; when present the stored tag is peak-end
    weighted (`peak_w`/`end_w`), duration-neglecting (§2). Scalar
    events behave exactly as before.
  - `encodeEvent` event may carry `regulate_style`-relevant context
    implicitly — the trait is per-character (bible); suppressors pay
    `reg_suppress_cost` on `enc_base`, reappraisers store a cooler
    `arousal_tag` (§2).
  - records with `arousal ≥ 0.5` pay `emo_assoc_loss` on link_p,
    `verbatim.when`, and source-tag birth strength — the graded
    item-context tradeoff (§2); §7's trauma clause stacks on top.
  - `hearAccount`/`account` may carry `speaker_express` (0.5–1.5) —
    secondhand records' arousal = `source_arousal·contagion_k·
    speaker_express·(0.5+0.5·empathy_trait)`; hearsay can mint
    CondEntries on places never personally feared (§6.3, §4.9).
  - `conditionedAffect` firing is similarity-keyed (§4.9
    `gen_width`, trauma-widened) — callers should expect nonzero
    responses for *similar*, not just matching, cues. `CondEntry`
    gains hidden `reconsol_open`/`deep` suppressor flags.
  - `retell` applies `verbal_dampen` to `emotional.arousal` when an
    audience is present; solo §4.13 draws do not; `trauma:true`
    records exempt (§6.11).
  - `dailyMemoryTick` sleep phase applies `sleep_affect_strip` to
    episodic arousal tags (trauma-exempt, flagged DEBATED —
    emotional-memory.md §14) and the §2.3 tag-capture half-strength
    rescue of weak cue-unrelated neighbors of emotional events.
- v1.8 additions (false-memory.md Part II — candidates, claims,
  coercion, self-directed distortion):
  - **SCHEMA CHANGE:** verbatim fields are candidate sets
    `{value, candidates:[{value, candStrength, provenance, day}]}` —
    §6.3 adoption pushes a candidate (provenance
    witnessed/told_by/imagined/confabulated/claimed/inferred), never
    overwrites; field retrieval samples ∝ candStrength; losing
    candidates eat §5.13/§5.8 suppression when the winner is
    rehearsed. Scalar fields deserialize as single-element
    candidates — backward compatible.
  - `hearAccount` account may carry `prewarned:true`,
    `evidence:"photo"|"video"|"artifact"`; character store gains
    `inoc_until` set by being-burned events (§6.3, §6.9).
  - `imagineEvent` gains `claim:true` (deliberate lies — gen+prod
    gains, fab_inflate flip, echo corroboration) and `evidence`
    (plaus_eff lift + pre-satisfied richness gate) (§6.9).
  - `answerProbe(charId, question, {forced, suggested})` — forced-
    confabulation operator: writes `confabulated`/`coerced`
    candidates, repeatCount compounds (§6.9).
  - `swapOutcome(charId, recordRef, newOutcome)` — §6.18 choice-
    blindness seam; undetected swaps are owned and confabulated,
    detected ones tag `incongruent:true`. Intended use: possession
    handoff, admin-acted outcomes.
  - Reconstruction of evaluative/decision fields runs §6.17
    consist_pull toward the current self-model; choice records run
    the choice_support_gain bias.
  - record schema gains hidden `confab_count`, `coerced`,
    `cb_swapped`, `incongruent` flags — snapshot-additive,
    harness-readable, never in briefings/feed.
  - §6.19 documents the repression non-mechanism: no repress()
    operator, ever (P172).
- v1.9 additions (individual-differences.md Part II §§9–18):
  - `encodeEvent` context may carry `intox` (0..1) — anterograde-only
    encoding loss + peripheral-field thinning + blackout-window
    omission at ≥0.8 (§2); record schema gains `intox` (encode-time
    value) and optional `lang` — both snapshot-additive; `lang` is
    player-safe to expose, `intox` is harness/hidden.
  - `cueContext` gains `lang` (§5.2 attenuation), `verify:true`
    (§3 checking-paradox conf decrement — dialogue calls it for
    re-checking behavior), `intox` (§5.4 mild state-dependent cue).
  - `selfReport(charId, facet)` gains the §13 complaint composite —
    complaint output weighted to neurot/distrust/stereo_suscept, NOT
    actual params (`complaint_k`); felt memory and real memory stay
    decoupled by design (Jonker 2000).
  - `dailyMemoryTick` draws the `day_mult` IIV factor (§2) — cheap
    "off day" dial; and at intox≥0.8 windows applies the omission
    bump retroactively to that window's events.
  - `deriveParams` accepts the extended IndivTraits block (§7);
    `langs` is a set-valued trait (not N(0,1)); pinned-trait
    conditioning is the §17 MVN formula — pinning high `neurot`
    pulls `distrust`/`checker`/`stress` upward automatically.
  - lure/adoption paths honor `expert_lure` when the content matches
    a profile domain (§5.6/§6.3/§6.8) — expertise is double-edged.
- v2.0 additions (social-memory.md Part II §§18–29 — the talk ecology):
  - `encodeEvent`/`hearAccount` events may carry `confidential: true`,
    `coAttending: true` (stricter than `present` — mutually engaged),
    and `shame: true` on self- culpable content (§4.13 suppressor);
    `tagEvent(charId, recordRef, {confidential:true})` marks an
    already-encoded record ("keep this between us" after the fact).
    `confidential`/`secret_str`/`shared_with`/`retellCount` are hidden
    record fields — snapshot-additive, harness-readable, never in
    briefings/feed; `shame` and `coAttending` are context inputs.
  - `retell`/`discussEvent`/`hearAccount` now additionally run: the
    §6.20 corroboration confidence update (conf writes to BOTH
    parties' records — callers should expect hearAccount to mutate
    the listener's conf, not just content); the §6.22 respect roll on
    `confidential` records (a failed roll transmits content without
    the flag — silent leak); the §6.23 absorb_p draw on qualifying
    told_by records; and §6.24 canon checks (post-threshold records
    take canon_drift_mult and gain canon_resist vs adoption).
  - `context.present` now also drives §6.21 `shared_with` writes
    (copresent_assume_p) — a false-positive channel by design; the
    world layer should NOT gate it on the co-present character's
    attention (that gate would remove the error we're modeling).
  - `"directory"` recall mode (§5.10) reads
    `PersonModel[X].available` — when false, topic-listed recall pays
    `transact_loss` (§6.14); the world layer flips `available` on
    death/move/estrangement, and `groupRecall`/`discussEvent` with an
    unavailable partner simply cannot be called (the loss shows up in
    solo recall instead).
  - record schema gains `shared_with` (list), `confidential`,
    `secret_str`, `retellCount`, `absorbed` (hidden flag set on the
    §6.23 flip — harness-readable provenance change marker).
- v2.1 additions (formal-model.md Part III §§18–25 — measurement layer):
  - all `similarity`/`sim` call sites now resolve through
    `simOp(a, b, mask)` (§11.1) with the mask table in formal-model.md
    §18 — the operator is pure and free to call anywhere; the masks are
    part of the spec (change a mask, change a probe).
  - `recall` failures and TOT returns carry `fok` (hidden,
    harness-readable) + one optional rescan when `fok > fok_retry`
    (§5.21). Dialogue uses it for "it's right there…" effort and for
    deciding whether to dig; it is NOT exposed as a number.
  - `encodeEvent` returns/stamps hidden `jol` (§5.21); delayed
    judgments feed `selfReport`'s SelfModel via `metamem_r`.
  - stochastic draws obey the §22 axioms: truncated Gaussians, uniform
    drift steps, integer RNG, `rand(seed, charId, day, opTag, i)`
    namespaced sequencing — probe-safe refactors.
- v2.3 additions (validation-design.md Part II §§22–32 — harness
  audit layer; all VALIDATION-ONLY, never callable from world code):
  - `lesion(mech, mode)` — ablation switch for the §26 lesion battery:
    `mech` ∈ {`decay`, `encode_mod`, `cue_ctx`, `source_mon`, `social`,
    `candidates`, `age_scale`}; `mode` ∈ {`off` | `flat` | per-lesion
    value}. Lesioned runs must be flagged in the probe output schema
    (`extra.lesion`) and never persisted into a live snapshot —
    snapshot/load refuses to round-trip a lesioned state by default.
  - Seed-split convention: `rand` seedBases are partitioned by parity —
    odd = calibration (tuning iterations), even = confirmation
    (one-shot scored runs, P214). `deriveParams` seed arguments follow
    the same partition so cohort construction can't leak across.
  - `sensSweep(param, lo, hi, steps)` — one-at-a-time parameter sweep
    helper for §24 Morris screening; returns the composite-observable
    vector per step. Pure query; does not mutate state.
  - §7 param table gains a documentation column concept — each param
    carries `ident_class` ∈ {structural|practical|identified|prior-held}
    per the validation-design §23 matrix; `prior-held` params are
    tuning-frozen by process rule (P219), not by code.
- v2.4 additions (encoding-mechanics.md Part II §§15–24):
  - `encodeEvent` Event fields: `detected:true` (requires a live
    monitoring set/Intention to be meaningful), `curiosity` 0..1 (world
    may override the derived value), `willTeach`/`interactive`,
    `domain` (topic tag — matches against the character's DomainTable),
    `engagement:"crafted"` (new enum value). All optional.
  - Intention records gain optional `ifCue`/`thenAct` — populating BOTH
    turns on `impl_intent_gain` on the §5.14 focal leg.
  - `tagEvent(charId, recordRef, {forget:true})` — new flag beside
    `confidential`; halves future s_gain receipts + one-time strength
    cut per §2 v2.4; harness-readable `forget_flag` on the record.
  - `context.pain`/`hunger`/`fatigue` (0..1) map to `daLoad` at the
    frozen §2 v2.4 weights — callers supply raw state, never pre-
    composed daLoad (the mapping is spec, not caller judgment).
- v2.5 additions (forgetting-curves.md Part III §§12–13):
  - Decay is evaluated on `t_eff` (§4.1): callers must keep a per-
    character count of record-encodes since each record's lastAccessDay
    (the §4.2 cue-bucket counts suffice — no new stores). `ev_day_norm`
    differs mains/ambients.
  - `dailyMemoryTick` now executes `affect_sleep_frac` of the day's
    valence fade × `sleepQuality` (§4.5) — sleepQuality=0 nights fade
    affect only at the continuous 60% share.
  - PersonModel `familiarity` is consumed by §4.7 face permastore;
    world/character data should keep updating it on contact.
  - Records gain per-verbatim-field `transf_done` flags (§4.16) —
    snapshot schema +1 field-class bitmask; absent flags default false.
  - New read-only health metric expectation: probe P239 requires access-
    gap logging per content class (record class + day on every
    encodeEvent/recall/hearAccount hit — cheap counter, not a store).
  - Profile layer gains `hsam`/`sdam` modifier names (character-memory-
    profiles.md §13) — they map to existing params, no new spec params.
- v2.6 additions (retrieval-cues.md Part III §§20–29):
  - §5.2 cue scoring now applies the diagnosticity blend — implementers
    need `df_j` counts per cue key; the §4.2 cue buckets supply them.
  - `recall` bouts (k>1) and `ambientMemoryScan` emit via §5.22
    ratio-rule sampling + failure-stop; bout results carry `emitted`
    (ordered) + `stalled: bool`. `judgeFrequency(charId, topic, k)`/
    `judgeTrait` helpers read the stall state for the §5.24 inversion.
  - `suppressEvent` gains an optional `cuePresent:true` arg — when set,
    accrues `inhib` (§5.23); without it, v1.3 behavior unchanged.
    `inhib` is hidden/harness-readable, never serialized to briefings.
  - `ambientMemoryScan` applies the §5.7 involuntary weighting
    internally — no signature change; callers see only the skewed
    surface distribution.
  - `rememberIntention` records gain `completedDay`; firing or
    `closeIntention` sets it. Cue re-encounter within
    `pm_commission_hl` rolls the §5.14 commission refire — callers
    receive `commission:true` on the returned intention, never a fresh
    recall. Armed nonfocal intentions impose `monitor_cost` on
    unrelated `recall` calls automatically.
  - records gain `prevGapDays` (§4.13 expanding bonus) — hidden,
    snapshot-additive.
  - `recall` applies `selfinit_pen` automatically on cue-sparse calls
    — no caller action.
- v2.7 additions (age-development.md Part III §§23–32):
  - `encodeEvent` Event fields: `first:true`, `evaluated:true`
    (peer-evaluation salience), `transition:true` on transition-class
    events (joins the §6.15 script-date class). Character-level
    `transitionStart`/`transitionEnd` declare a runtime transition
    window (generalizes ProfileInput `bump_windows` to live play).
  - Character-level `script_age` table (world-builder supplies;
    transition-class → expected age). Absent → flat prior, no pull.
  - Regime overlays: `setOverlay(charId, "preg"|"perimenopause",
    {startDay,endDay})` — capacity overlays per §4.17; stack with
    trait/regime modifiers, fully reversible, never mark records
    beyond the ordinary `regime` tag.
  - `rememberIntention` on child characters: caller supplies
    `caregiverPresent: bool` in the cue context at arrival for
    `pm_scaffold_gain`; `pm_interrupt_mult` applies automatically on
    `locShift`/topic-change between arm and cue.
  - Records gain `first`/`transition` flags (snapshot-additive, both
    default false); `stream` tag optional (same-stream link bonus).
  - Amnesia gate (§4.14) is episodic-only — semantic/procedural
    encodes bypass `amnesia_ramp`/`latent` entirely; no caller action.
- v2.8 additions (age-decline.md Part III §§34–45):
  - `encodeEvent` context may carry `noise_level` ∈[0,1] — gates the
    `hearing`/`noise_cost` verbal-encoding tax (§2).
  - `setOverlay` gains `"isolation"` and `"med_antichol"` (§4.17);
    `isolation` is normally self-triggered from the contact ledger —
    callers may also set it directly; `partnerDeath` event type is
    recognized (jumps the ledger, zeroes collab_partner_gain channel).
  - `rememberIntention` records track `fires` per cue class
    (pm_habit_gain, §5.14); `impl_intent_gain` auto-applies
    `ii_age_gate` — no caller action.
  - `recall` recognition mode applies `sync_lure_gain` automatically
    when `peak_hour` set and off-peak (§5.6); `ambientMemoryScan`
    applies `invol_pos_gain`/`invol_remote_gain` automatically (§5.7).
  - `hearAccount`/`believe_p` compute `know_density` from the
    character's own semantic store — no caller action.
  - `selfReport`/`complaint_k` channel: callers may pass
    `depress_state` ∈[0,1] (§10) — complaints ride mood.
  - record schema: intention records gain `fires` counter (hidden);
    nothing else snapshot-visible.
- v2.9 additions (emotional-memory.md Part III §§26–35):
  - `encodeEvent` Event fields: `emotion` (enum — absent → inferred
    from valence/arousal), `threat_object` (field-id of focal threat
    object, §2 weapon-focus), `open_outcome` (unresolved-arc flag
    feeding §6.17 emo_update_k). All optional, default absent.
  - cueVector sensory fields may carry `modality` ∈
    {smell,sound,sight,touch,taste} (default sight) — drives the
    §5.2/§5.7 odor channel.
  - `ambientMemoryScan`/`recall` outputs gain `cue_source` ∈
    {field,date} — date-cued (anniversary) retrievals are flagged so
    the caller can leave attribution to reconstruction, not narration.
  - `retell`/`discussEvent` on trauma records accrue `coherence`
    (structured retells only — audience present + ≥60% surviving core
    fields covered); `coherence` gates intrusions and trauma
    sleep_affect_strip automatically — no caller action.
  - `recall` now writes back `C.mood` (recall_mood_pull) — callers
    must treat the cue context's mood as mutable across a recall
    sequence.
  - person-cue CondEntries acquire/decay on the asymmetric schedule —
    no caller action; `conditionedAffect(charId, personId)` works
    unchanged.
  - record schema: trauma records gain `coherence` (init 0.25);
    all records may gain `emotion` tag. Snapshot-additive, both
    default-neutral.
- v3.0 additions (false-memory.md Part III §§26–36):
  - `hearAccount` gains optional `negated` (denial — writes the
    affirmed candidate under a `frame:"denied"` tag, §6.29),
    `dressing` (nonprobative decoration → truthy_gain, §6.7),
    `groupSize` (drives §6.5 group_damp; default 2).
  - `retell`/`discussEvent` gain optional `verbalize:true` — marks a
    describe-not-recount act; triggers §6.25 on nonverbal-dominant
    records. Dialogue layer decides; default absent.
  - Record fields now track `lastRecallDay` per-field (or per-field
    bucket) — §6.3's react_window needs it; a record-level map is
    sufficient (fields that surfaced in the recall get the stamp).
  - Reconstruction candidates may carry `provenance:"inferred"`
    (§6.26 transplant, §6.27 conjunction) — hidden like `phantom`;
    NEVER rendered to the character as inferred, and no path may
    relabel it `witnessed` except the §6.9/§6.10 flip gates (P296).
  - `PersonModel[p]` gains `familiarity` (already implicit via
    directory strength — reuse it) and `categoryTags` matching
    (§6.26 ingroup/outgroup); `ingroup(p)` = shares the perceiver's
    primary category cluster — the bible supplies tags, the
    mechanic is spec.
  - Snapshot-additive: `frame` tags on candidates, `verbalized`
    flag on records, field-level `lastRecallDay` — all
    default-neutral.
- v3.1 additions (individual-differences.md Part III §§20–30):
  - `hearAccount` gains optional `negativeFeedback:true` —
    authoritative challenge to the hearer's own prior report;
    invokes the Shift path (§6.3): reported-field flip +
    confidence loss, report-side only. Default absent.
  - `context.intox` gains optional `kind` ("alcohol" | "cannabis";
    §2/§6.3); `context` gains optional `meno` ∈ [0,1] and
    `preg` ∈ {0,1} state overlays (§2) — states, never traits.
  - Events may carry `socialThreat:true` (event layer tags social
    evaluation/rejection/hostility — the `vigil` encode+recall
    gates read it; untagged events unaffected).
  - `PersonModel[p]` familiarity accrual now reads `face_ability`
    (§5.10) and tier-3 pays `name_fan_k` on directory size — both
    automatic, no caller action.
  - `deriveParams` accepts IndivTraits axes 16–22; all optional,
    default 0.
  - Snapshot-additive: `intox.kind` on records (default
    "alcohol"), `socialThreat` tag on records — default-neutral.
- v3.2 additions (social-memory.md Part III §§32–45):
  - `encodeEvent`/`Event` gains optional `sitConstraint` ∈ [0,1]
    (actor under orders/stress/script — feeds the §2 correction
    stage) and optional `status` tag on characters (world layer
    supplies relative status for `status_gap`; untagged → flat).
  - `PersonModel` gains `eval`, `individuation`, `exposureCount`
    (§1); traits keys may carry `dim` ("moral"|"social"|"compet" —
    untagged dims default neutral weight 1.0, exclude from the
    moral_primacy share).
  - `retell`/`hearAccount` gains optional `speakerArousal` (the
    teller's current arousal report — §6.33 contagion) and
    `audienceId` already required for §6.11; verbatim fields may
    carry `phrasing` (§6.12 lineage).
  - `toldTo` entries become decaying edges (§6.11 v3.2) — stored
    strength, not just day; `dest_mem` remains fallback.
  - Ambient sub-threshold co-presence sightings may be emitted as
    lightweight `exposure` events (personId + place only) to accrue
    `exposureCount` — no episode record is created.
  - Snapshot-additive: all PersonModel fields default-neutral;
    `phrasing`/`sitConstraint`/`status` absent = legacy behavior.
- v3.3 additions (formal-model.md Part IV §§26–35):
  - `broadcastEvent(event)` → one `encodeEvent` per participant,
    atomic vs daily ticks, sorted-charId order; cross-tick reads use
    each store as it stands (formal-model §26.1).
  - `retell` is a two-store transaction: speaker drift commits before
    the transmission operators run; crash between speaker-commit and
    listener-encode is legal (formal-model §26.2).
  - `societySnapshot()` → {ledgerDay, ledgerSeq, per-char snapshots};
    legal only at a ledger boundary (§26.3).
  - `conversationSession(members)` wraps recall/retell sequences:
    session-scoped `temporalAnchor`, `visited` set, `session_scan_cap`
    bound (§27).
  - Records gain `bs_stale` cache flag; snapshots gain `specVersion`
    + `legacy` archive block; `migrate(snap, fromVersion)` is the
    versioning contract (§§28, 30).
  - Input validation contract: clamp+log for range violations,
    reject-on-NaN, skip-on-missing-required, degrade-on-unknown-enum
    (§30).
  - `dailyMemoryTick`/`ambientMemoryScan` accept `level` ∈ L0–L4 per
    the degradation ladder; levels are visibility-scoped (§31).
  - Harness contract (no runtime cost): parameter-recovery runs,
    Wilson-CI/BH probe statistics, Morris sensitivity screening —
    probe numbers P322–P333 (§32).
- v3.4 additions (cast-profiles.md Part II §§8–10):
  - Record fields: `selfdef` (bool), `meaning` (gist-interpretation
    string, driftable), `sdmCat` ∈ relationship|achievement|
    lifeThreat|leisure|other (Thorne & McLean taxonomy; §6.34a).
  - Event fields (all optional, default-neutral): `feedback:true`,
    `traitCentrality` ∈ [0,1], `diagnosticity` ∈ [0,1],
    `improvement:true`, `lifescript:true` (§6.34b/c).
  - IndivTraits gains axis 23 `defens` (repressive defensiveness σ;
    loads `selfdef_spec_mult` inverse, `mnem_neg` positive; r(neurot)
    ≈ −0.3, r(selfconceal) ≈ +0.4 — Blagov & Singer 2004; Weinberger).
  - `script_redeem` is a direct bible pin (McAdams 2001), not trait-
    derived; `deriveParams` passes it through.
  - Ambient-NPC profile tier: `deriveParams(ambient:true)` → trait
    sample σ = `ambient_trait_sigma`, live cap `ambient_cap`·
    `ambient_cap_mult`, `selfdef_cap`→0, `individ_rate` low /
    `cat_prior_pull` high defaults (NPCs stay "types" until
    promoted); promotion path = full MVN sample + SelfModel backfill.
  - Snapshot-additive: `selfdef`/`meaning`/`sdmCat` absent = legacy
    records; `defens` absent = 0.
- v3.5 additions (encoding-mechanics.md Part III §§30–38):
  - Event fields (all optional, default-neutral): `perceptLoad` ∈
    [0,1]; `floor_next:true`; `offload:true`/`offloadAttend:true`;
    `threatCue:true`; boundary events may carry `interrupted`/
    `closedClean` for the residue modifier.
  - Record fields: `extref` (external-store pointer — device, note,
    person-who-knows; a successful extref hit lets reconstruction
    legitimately terminate at the pointer, §35); flag `load_flag`
    (born under perceptLoad ≥0.6 → +0.1 §6.3 adoption, §30).
  - Intention field `extCue:true` (externally reminded) — tonic
    relief × cue-binding trade (§35); fire/cancel now also stops
    s_gain receipts and applies `intent_done_decay` to β (§34).
  - Snapshot-additive: all fields absent = legacy behavior;
    `perceptLoad` absent = 0.4 default.
- v3.6 additions (forgetting-curves.md Part IV §§17–18):
  - `registerTransition(charId, kind)` — mints a `period` id, resets
    `n_sim` pools, applies `trans_win`/`trans_bound_gain`, mints
    positive-valence bump windows; `kind` ∈ move|jobStart|jobEnd|
    relStart|relEnd|death|other (§4.18).
  - Record fields: `period` (id, default 0); verbatim `mod` ∈
    olf|vis|verb|aud (default verb — drives k_mod slopes, §4.1);
    `intrude_w` (intrusion weight, decays at `intrude_hl`, §5.7).
  - `recall` Reconstructions carry `latency_ms` (§5.25) and report
    `emotional.valence` through the appraisal blend (§5.5 item 8).
  - `bump_valence_gate` semantics changed: `valence ≥ bump_pos_min`
    required for ALL bump windows incl. transition-minted — negative
    self-relevant records lost their former β relief (sign-locked,
    P369).
  - `rested` records (v2.4) now also gain `rest_s_gain` storageS at
    window close and first-day `n_sim` exemption (§2).
  - Profile modifier `bilingual_bal` attenuates `lang_mismatch` (§5.2);
    `ptsd` modifier sets `intrude_hl`→∞ (§5.7).
  - Snapshot-additive: `period`/`mod`/`intrude_w` absent = legacy
    (period 0, mod verb, intrude_w derived from arousal).
- v3.7 additions (retrieval-cues.md Part IV §§33–45):
  - `cueContext` fields: `daLoad` (0..1 — divided attention at TEST;
    taxes latency/breadth/monitoring, not accuracy, §5.4/§5.25);
    cue features may carry `origin:"self"|"ext"` (default ext —
    self-origin cues earn `selfcue_mult`, §5.2); `stress` semantics
    unchanged but now lag/valence-weighted (§5.4).
  - `recall` may return `familiar_only` Reconstructions outside the
    person cascade — scene-level familiarity on a FAILED bout with
    `famScore ≥ fam_bar`; flags `sourceless` (real record, door
    closed) or `deja` (similar-but-different match — surface flag,
    feeds §6 misattribution). No content fields, conf ≤0.3 (§5.28).
  - Intention records may return `pm_vague` — fired cue + failed
    action recall: urgency without content, resolves on action-cue
    arrival within `pm_vague_win` (§5.14).
  - `interviewMode(charId, eventRef)` — recommended CI sequence
    (reinstate → free pass → varied channels → delayed second pass);
    each step reuses existing ops, contract-level only (§5.30).
  - `locShift` events now shed peripheral cueVector fields and dip
    armed nonfocal intentions inside `post_boundary_win` (§5.29);
    successful voluntary bouts stamp `postRecallDay` granting the
    `fwd_win` encoding window (§5.26).
  - Record schema: `isolated` now has retrieval semantics (singleton
    cue bucket + `iso_first`, §5.31); character store gains
    `postRecallDay`; cue-feature `origin` tag — all snapshot-
    additive, absent = legacy.
- v3.8 additions (age-development.md Part IV §§36–47):
  - `identifyFromSet(charId, candidates, {mode:"free"|"forced"})` —
    choice-set recognition (§5.32): forced/coercive modes emit argmax
    at `choose_p(age)` when nothing clears θ; picked records carry
    `forced_pick:true` (low-credibility downstream, unreduced
    reported confidence); sequential order and showups worsen child
    refusal — game-systems should prefer `mode:"free"` for child
    witnesses and treat child forced-picks as near-noise.
  - Reconstructions may carry `verbal_void:true` (§6.36) —
    sensory/affect present, narration absent, on records minted
    below productive vocabulary; dialogue renders feeling without
    story.
  - `dateEstimate` may return `{cyclic_date: {timeOfDay, season,
    routineAnchor}}` instead of `reportedDay` for encodeAge<8
    records (§6.15); `orderBefore` unaffected.
  - Repeated-class events may mint `script` nodes (§4.20);
    Reconstructions below `script_default_age` may be script-mode
    (modal-filler fields are indistinguishable from instance fields
    to the character — by design).
  - `hearAccount`/`discussEvent` on child-era records now route
    repetition by content sign (§6.3) — neutral repeats strengthen
    and inoculate; conflicting repeats compound and embellish.
    Interview schedules are memory operators, not probes.
  - Record schema: `verbal_age` (0..1, minted); `script` nodes are
    store-internal. All snapshot-additive, absent = legacy.
- v3.9 additions (age-decline.md Part IV §§49–62):
  - Intention records may emit `commission:true` — a completed
    intention re-fired inside `deact_window` (§5.33). Dialogue may
    render catch-yourself ("I already… didn't I?") or let it
    re-execute; the flag marks it either way.
  - `imagineEvent` outputs now carry `sim_detail_mult`-scaled
    verbatim counts and may be `recast` copies of a single source
    record (§5.34) — downstream, thin imaginations inflate less.
  - `familiar_only` emissions may carry `attribution:"known_around"`
    (§6.38) — sourceless fluency misread as prominence, old only.
  - Record schema: `impl_str` (implicit strength, θ-exempt,
    slow-decaying, §5.35); verbatim fields may be versioned pairs
    `{old_v, new_v, supplantDay}` (§6.37) — reconstructors must
    sample per `new_v_share`; all snapshot-additive, absent=legacy.
  - `latency_ms` now scales with `lat_age_mult` — longer hesitations
    are a normal-aging display channel, not a bug.
- v4.0 additions (emotional-memory.md Part IV §§40–51):
  - `encodeEvent` reads character state `carryArous` (excitation
    carryover, §2) and co-present `PersonModel.trust ≥ secure_trust`
    for the secure-base tag damp; `verbatim.duration` mints
    `dur_dil`-inflated; low-`emo_gran` records mint
    `emotion:"mixed"`.
  - `retell` accepts `vent:true` (rumin-channel, no verbal_damp —
    §6.39) and reads `audience.status` for `aud_status_mult` (§6.11);
    savor/dampen traits fire on positive-tag records (§6.40).
  - `imagineEvent`/`anticipatedEvent` outputs gain `forecast_valence`
    /`forecast_dur` fields (impact-biased, §6.41) — downstream
    planning reads them as the character's own predictions.
  - `dateEstimate`/describe surfaces gain `subjDist` — felt distance,
    NOT the decay clock (§6.15); Reconstructions may carry
    `nostalgic:true` on era-matched music-cue hits (§5.37); cueVector
    gains `music` key (world tags `era_song:true`).
  - Char state `carryArous` + `emo_rate` are snapshot fields; all
    additions snapshot-additive, absent = legacy.
- v4.1 additions (false-memory.md Part IV §§38–51):
  - `answerProbe` accepts `wording_intensity` ∈ [−1,+1] and
    `expect:`{value} (§6.43/§6.45); `hearAccount` accepts
    `omission:true` (§6.48); `imagineEvent` accepts
    `selfAction:true` (§6.9 ext); recall/`Reconstruction` accepts
    `mode:"discriminate"` — returns candidate lists with
    per-candidate provenance estimates (§6.50).
  - New calls: `feedback(charId, emission, "confirm"|"disconfirm")`
    (§6.44) and `swapReport(charId, record, field, alteredValue)`
    (§6.46); contested identifications must log pre-feedback conf
    (P431 contract).
  - Records may carry `flashbulb:true` (§6.42 — visible flag; the
    floored certainty is the character feature, not a bug) and
    `incongruent:true` is shared between §6.18 and §6.46 detection
    paths; all additions snapshot-additive, absent = legacy.
- v4.2 additions (individual-differences.md Part IV §§34–48):
  - `context`/`cueContext` may carry `depleted:true` (§5.38
    release), `suppressing:true` (§6.53 tax), `nic_dep` ∈[0,1],
    `caff` ∈[0,1] (§2 substance block), `persp:"field"` (§5.39
    guided reinstatement pull); character state gains `depr_state`
    ∈[0,1] gating §6.52's depr loadings — all optional,
    absent=neutral.
  - Reconstructions may carry `persp:"field"|"observer"` (§5.39) —
    dialogue renders observer emissions with dampened affect and
    self-visible phrasing; the flag is report-layer, never a stored
    field.
  - Records may carry `attach:true` (world tags attachment-relevant
    events — attachment-figure presence, rejection/loss/reliance
    themes); `threat:true` records gain the §6.52 sensory-gated
    intrusion channel. Events may carry `selfDiscrepant:true` for
    the §5.39 observer shift.
  - `smoker`/`depr`/`ptsd`/`attach_*`/`persp_obs`/`supp`/`reap`/
    `pspeed`/`mindful`/`scc` join IndivTraits (§7) — prevalence-
    weighted, bible-pinnable; all snapshot-additive.
  - World-builder hooks: nightly deprivation/suppression bookkeeping
    sets `depleted` and `nic_dep`; the suppression tax needs
    dialogue-layer masking state (`suppressing:true`) to fire.
- v4.3 additions (social-memory.md Part IV §§48–64):
  - New record type `RelEdge{a,b,kind,sign,str,dayObserved}` —
    per-observer edge store in snapshots; minted on witnessed
    alter–alter interaction or adopted relational `told_by`
    content; sentiment edges reverse-mint at `edge_sym_p` (§6.55).
  - `encodeEvent`/`hearAccount` accept `kind:"overheard"` (§6.64)
    and `social_eval:true` (§6.62); records may carry `coAgents`
    (§6.56 — stores `own_share`), `discredited` + `discredit_str`
    (§6.61), `dissent_mark` (§6.59 private-dissent flag).
  - New read `consensusEstimate(charId, claim) -> 0..1` (§6.57) —
    retell emissions may carry `norm:"everyone knows"`; read-only,
    never edits fields.
  - `retell`/`discussEvent` now apply §6.58 `retell_conf_gain` to
    the speaker's record (no audience needed) in addition to the
    §6.20 corroboration channel; §6.59 routes contested fields by
    `conform_gate` — informational merge vs public-assent +
    `dissent_mark`.
  - Reconstructions of records about modeled persons apply
    §6.63 `partner_eval_pull` — callers see eval-consistent gist
    drift; nothing is written back to the record.
  - World-builder hooks: `social_eval` tags (performances,
    embarrassments) power §6.62; `coAgents` needs joint-action
    bookkeeping at the event layer; `RelEdge` minting needs
    alter–alter interaction visibility in `context.present`.
    All additions snapshot-additive, absent = legacy.
- v4.6 additions (encoding-mechanics.md Part IV §§44–57):
  - Event fields (all optional, default-neutral): `fieldChanged:
    {field,new_v}` (§44 stale-field gate); `mentionsSelf:true`
    (§45 breakthrough); `humor` ∈ [0,1] (§46); `animate:true` (§§44,
    47); `aboutPerson:<id>` + contentEval (§48/§49 person-model
    encoding); `approachMotiv` ∈ [0,1] (§50); `deceptive:true` /
    `lie_rehearsed:true` (§51); `note:"verbatim"|"generative"` (§52).
  - Record fields: `stale:true` on unupdated fields (E-tier — never
    rendered, harness-only); `lie:true` (M-tier — steers §6.68 fab
    competition, never emitted verbatim).
  - Char state (snapshot): `monitor_tail` ticks remaining (§45),
    `humor_rate` running share (§46).
  - World-builder hooks: `fieldChanged` needs object-mutation
    bookkeeping (who moved what); `mentionsSelf` needs the ambient
    dialogue layer to flag name-mentions; `aboutPerson` needs the
    event's target id; `deceptive` comes from the dialogue layer's
    lie bookkeeping (pairs with bible `truth`/`lie_freq` pins);
    `note` marks journaling/transcription activity.
    All snapshot-additive, absent = legacy.
- v4.7 additions (forgetting-curves.md Part V §§22–26):
  - Record fields: `persSem:true` (§4.23 semanticized self-fact),
    `transg:true` (§4.23 own-violation vividness channel),
    `source:"dream"` value (§4.24). Derived, never stored:
    `recol_w`/`fam_w`; Reconstruction gains
    `reportMode:"remember"|"know"`.
  - Intention field: `cueBind` ∈[0,1] (§9, sleep-consolidated).
  - Skill-map field: `kind:"cont"|"cog"` + `uses` (§1, Arthur 1998).
  - Event fields: `dream_salience` ∈[0,1] on sleep-tick mints;
    `transg:true` on own-norm-violation events (world tagger —
    dissonance vs the §6.34 self-model); `order_script:true` on
    event types with canonical order (script prior for §5.40).
  - New contract op: `orderRecall(charId, a, b)` (§5.40) — order
    claims never read `createdDay`.
  - World-builder hooks: `dreamRecall` trait (0.02–0.5, vivid/
    fantasy-loaded profiles high) on bibles; `dream_salience` comes
    from the story layer (nightmares high); `transg` tagging needs
    the event layer to flag own-violation acts; skill `kind` tags on
    the jobs content (bartending floor-presence=cont, POS
    workflow=cog). All snapshot-additive, absent = legacy.
- v4.8 additions (retrieval-cues.md Part V §§46–56):
  - Intention field: `impl:{cue, action}` — an if-then plan at
    arming (§5.14; near-focal firing, half monitor cost, half
    doorway dip, rigidity on unplanned cues, ×ii_age_gate).
  - Record fields: `encodePhys` (§5.46 — coarse pharm bucket),
    `milestone:true` (§5.43 life-script), `df:true` (§5.48
    directed-forget).
  - Reconstruction gains `retrievalMode:"direct"|"generative"`
    (§5.42) and may carry `vague:true` on stalled generative
    descents — dialogue renders the period-level answer ("that
    summer…"), not silence.
  - Context gains `C.phys` (current pharm bucket) and
    `C.period` (life-period-scoped query marker for §5.43).
  - jointRecall internals: partner emissions enter the listener's
    context at `crosscue_mult` by RelEdge (§6.69); no contract
    signature change.
  - World-builder hooks: `planStyle` bible trait (0–1 — how often
    a character spontaneously if-then plans; load on `consc`/
    `meta_conf`-adjacent pins); `milestone` event tag on
    transitional firsts; `df` set by the dialogue layer's
    secrecy/avoidance bookkeeping. All snapshot-additive,
    absent = legacy.
- v4.9 additions (age-development.md Part V §§48–56):
  - Event fields: `amnesia_pierce` ∈{0,1,2} on eventClass;
    `public_scale` ∈{0,1,2} on events (world tags both).
  - Record fields: `earliest_candidate:true` (pierce-minted),
    `chapter:true` (public_scale≥1-minted) — both C-tier;
    `lang` minted from ambient-at-encodeAge for bilingual
    profiles (was: static profile lang); `regime:puberty`.
  - Profile fields: `langs[].l1_until`, `culture_env`,
    `culture_exit_off`, `auto_style`, `pub_timing` — bible-side,
    not MemoryParams.
  - `recall("earliest")` returns a scored draw, not a field:
    sampled below `earliest_stab`, sticky above (§6.15 v4.9).
  - `dateEstimate` honors query-side anchors
    (`anchor_query_gain`) when the context supplies a
    chapter/milestone bound.
  - World-builder hooks: bilingual profiles get `l1_until` +
    ambient-lang-per-era; `culture_env`/`auto_style` per
    background; `pub_timing` optional; `amnesia_pierce` +
    `public_scale` tags on eventClass/event definitions.
    All snapshot-additive, absent = legacy (monolingual
    profiles make the lang legs dead code, as before).
- v5.0 additions (age-decline.md Part V §§63–77):
  - Record field `coarse:true` — minted under low `seg_boundary_p`;
    higher gist share, fewer verbatim fields, wider dateEstimate
    sigma (§4.26).
  - Reconstructions may emit `reportMode:"remember"` on WRONG
    source/pairing emissions via `illus_recol_p` (§6.70) —
    dialogue renders vivid first-person error, not hedged guess;
    flag never exposed.
  - `ambientMemoryScan` emission rate is age-scaled (`mw_decline`)
    and cue-bound (`sdt_share`) — world sees fewer, more
    stimulus-traceable involuntary recalls from old characters.
  - `recall` under `C.da` (divided attention) applies `da_ret_tax`
    to `latency_ms` + `da_ret_spill`, never to hit rate — locked.
  - `retell`/`forward-testing` legs pay `test_nofb_mult` when no
    correctness signal accompanies the practice (§5.52).
  - Importance-ranked query mode ("most important", life-review)
    reads `bump_emit_w` — a new draw mode, distinct from cued
    recall; world supplies the query intent.
  - All snapshot-additive, absent = legacy.
- v5.1 additions (emotional-memory.md Part V §§56–65):
  - `encodeEvent` event may carry `anticipated:true` (+ optional
    `expectedArousal`, `expectedValence`) — mints the §4.28
    `anticip:true` trace; dwell/simulation ticks flag the record for
    rehearsal. World flags the schedule; the substrate owns the rest.
  - Record flags `anticip:true`, `betrayal:true`, `witnessed:true`
    — snapshot-additive; `betrayal:true` never gates retrieval to
    zero (locked: avoidance, not erasure).
  - §4.24 dream draw supersedes the "world supplies salience"
    clause — dream records now sample the character's own store
    (`dream_emo_w`/`dream_neg_bias`); world may still inject an
    explicit `dream_salience` override.
  - Reconstructions may carry `perspective:"observer"` on shame
    records (~2× base rate) — dialogue renders watching-oneself
    phrasing; flag exposed as recall phenomenology.
  - `amendsUrge(charId)` read hook — returns the §5.54 guilt
    rehearsal counter map keyed by offended-party; behavior layer
    drains it when repair acts happen.
  - RelEdge gains `forgive` ∈[0,1] (world drives: apologies,
    amends, time) — gates §5.55 rehearsal/intrusion of
    offender-linked records; feedback nudges are substrate-side.
  - `ambientMemoryScan` gains the §5.56 nostalgia regulation leg —
    emissions under C.mood<−0.2 may carry `nostalgic:true` and
    nudge C.mood on emission.
  - `hearAccount` may trigger `inst_cond_mult` conditioned-affect
    acquisition (no episodic record) when teller arousal ≥ cond_thresh.
  - `C.mood` persistence semantics documented (§6.74 `emo_inertia`) —
    world supplies mood inputs; the substrate owns autocorrelation.
  - All snapshot-additive, absent = legacy.
- v5.2 additions (false-memory.md Part V §§52–64):
  - NEW `presentEvidence(charId, artifact, claim)` (§6.78) —
    fabricated/real artifact delivery; `ev_cred` ceiling, plaus_min
    bypass, `retro_evid` back-fill; artifact records carry
    `authentic` ∈ {real, doctored} — ledger/history-browser visible,
    never the character.
  - `hearAccount` gains `frame:"story"|"hypothetical"` (§6.80
    fic_penalty path) and appends hearer-known speaker lineage to
    candidate provenance for §6.81 genealogy (`corrob_root_req`) —
    rumor propagation should propagate lineage, not just content.
  - `answerProbe` gains `why:true` (§6.79 — reason fields are
    never-encoded; the probe mints the confabulated reason at
    normal confidence) and participates in §6.76 potentiation
    (recall opens test_window).
  - recall emissions apply §6.82 re-appraisal to reported emoTag —
    `emoTag_stored` is ledger-side and never mutates; the REPORT
    drifts toward current appraisal.
  - Intention records (§9 extension) may emit "performed"
    candidates via §6.84 dwell — chore-loop claims ("I paid it")
    can be phantom completions; act-encode attention is the
    suppressor.
  - Records/candidates may carry `anchored:true` (§6.75 flag,
    hidden) and provenance "claimed" (§6.76 own-emission) —
    snapshot-additive, absent = legacy.
- v5.3 additions (individual-differences.md Part V §§49–62):
  - Event/record fields may carry `actor:self|actor:other` tags on
    multi-actor events (§6.85 — world tags participants; the ego
    ledger prices the asymmetry at encoding, not at reporting).
  - `encodeEvent`/`recall` contexts gain `task_load` and
    `pain_state` ∈[0,1] (§6.87 — world supplies the day's load and
    pain; both are anterograde, no carryover).
  - `answerProbe` affect probes on alexith>0 records may emit
    §6.79-minted confabulated feeling at near-normal confidence
    (`alex_confab`) — fluent invented affect is a FEATURE, flag it
    `confabulated_affect:true` for the ledger only.
  - `dailyMemoryTick` applies `circ_jitter` draws to peak_hour and
    sleepFactor (§6.87 — variance, never mean shift).
  - Recall emissions apply §6.88 `rosy_retro` positive tilt via the
    §6.82 reappraisal path; §4.28 anticip traces mint at +0.1·rosy
    skew.
  - IndivTraits gains `birth_order` as a DOCUMENTED NULL — bible
    field, every loading locked 0.0 (§6.88; P575 null-locks it).
  - All snapshot-additive, absent = legacy.
- v5.4 additions (social-memory.md Part V §§65–80):
  - `Intention` gains `commitment:true` + `creditor:charId`
    (§6.90 — world tags promises at mint; creditor clone is a
    separate record on the promisee's store).
  - New pure read `expectOtherRecall(charId, witnessId, record)`
    (§6.89 — joins reader_pure; it must not touch witness state).
  - `PersonModel` gains M-tier `suspicion` tag (§6.92 — never
    emitted as a value; shifts believe_p only).
  - Records may carry `attendees` list, `exclusion:true`,
    `h_dap:true` flags; broadcast events may carry `disrupt` ∈
    [0,1] (§§6.93–6.97 — world supplies all three).
  - New ops `deny(record, field)` / `fabricate(content)` on the
    speaker's own store (§6.95 — distinct code paths is a probe
    requirement, not a style note).
  - Group-discussion record sampling gains holder-count bias
    `hp_exp` upstream of the §42 novelty gate (§6.91).
  - IndivTraits gains `keeper` (§6.94 — relational-calendar role;
    bible-pinnable, Rosenthal skew documented).
  - PersonModel update gains are now dimension×valence keyed
    (§6.98: rev_moral_neg/rev_moral_pos/rev_abil + moral_bad_thresh
    threshold + moral_repair_k tax).
  - All snapshot-additive, absent = legacy.
- v5.5 additions (formal-model.md Part VI §§45–51):
  - Every record gains M-tier audit field `lastRewrite = {rule, day,
    cause-ref}` — written by every content mutation; never emitted
    (§13.1 catalog; P590).
  - Rumor coverage is now a calibrated quantity: the substrate reports
    K(t) knower counts to the harness; ensemble probes compare against
    the §13.2 mean-field band (`mix_correct`, `mix_band`).
  - `canonSerialize`/`canonHash` join the op catalog as G-class pure
    ops (§13.4) — required by P594/P601; `state hash` in P459/P465/
    P467 now refers to `canonHash` output.
  - Ensemble probes MUST run the full parameter joint; mean-param
    runs are diagnostics only (§13.3, P593).
  - Approximation modes (lazy decay, session batching, census
    sub-sample) are legal iff they satisfy §13.5's three conditions;
    an enabled mode is declared on `memorySnapshot` output.
  - All machinery: no new per-character params, no new psychology.
- v5.6 additions (character-profiles V — the self layer,
  cast-profiles.md Part IV):
  - IndivTraits gains `self_est`, `elabor`, `neurot_report` (§6.99/
    §6.107/§6.102 — self_est is self-evaluation, never metamemory;
    neurot_report is the self-described distress channel that diverges
    from `neurot` under defensiveness).
  - Records may carry `aspect` (self-aspect tag, §6.101 — world tags
    role/relationship domain at encode) and feedback records gain
    `selfCongruent` (§6.100 — derived, never authored).
  - Records may carry `counterfactual:true` (§6.104 — minted on
    near-miss outcomes; world tags `near_miss` on the event) and
    regret-class records gain `regret:{kind:action|inaction,
    oppOpen:bool}` — `oppOpen` flips are world-supplied.
  - New record class `pself` (§6.106 — possible-self landmarks;
    snapshot-visible, never dialogue-emitted as facts).
  - Long-horizon Intentions may carry `owner:"future-self"`
    (§6.106 — they then ride the §6.90 debtor channel, not pm_self).
  - Idle-reminiscence ticks on 55+ characters emit `reminiscence`
    routings carrying the remin_style tag (§6.103 — integrative
    routings may mint persSem synthesis records per §4.23).
  - All snapshot-additive, absent = legacy.

## 11. Formal annex — simOp and the distribution axioms (new in v2.1)

### 11.1 `simOp(a, b, mask)` — the only similarity function

```
simOp(a,b,mask) = Σ_f w_f(mask)·match_f(a_f,b_f) / Σ_f w_f(mask)
match_f: people/topics/sensory = jaccard; place = 1|place_adj|0;
         mood = 1−|Δ|/2; when = exp(−|Δday|/sim_tau_time);
         names = {1.0 equal, 0.7 same phonological key,
                  0.4 same onset+length class, 0 else}
```

Masks (weight vectors, normalized per row): `sim_interf`,
`sim_merge`, `sim_cond`, `sim_rif`, `sim_misinfo`, `sim_source`,
`sim_remind`, `sim_person` — table and per-mask rationale in
formal-model.md §18. Call sites: §4.2 → sim_interf; §4.3/§4.11/§6.23
→ sim_merge; §4.9 → sim_cond; §5.8 → sim_rif; §6.3 → sim_misinfo;
§6.10 → sim_source; §5.17 → sim_remind; §5.10/§6.10 name tier →
sim_person. A callsite running a custom weight vector instead of its
mask is a spec violation (P193 probes mask distinctness).

### 11.2 Distribution axioms (normative, formal-model.md §22)

Truncated-Gaussian draws (±3σ then domain-clamp); drift steps
`drift_k·U(0.5,1.5)`; integer RNG (splitmix64-class) with
`rand(seed_base, charId, worldDay, opTag, i)` — opTag namespaces make
probe harnesses refactor-safe; correlated draws share the first
uniform where the mechanism is causal (one distracted moment → bad
encode AND bad retrieval).
### 11.3 Society and session semantics (new in v3.3, formal-model.md §§26–27)

`broadcastEvent` = sorted-charId independent encodeEvents, atomic vs
daily ticks; dyadic ops commit speaker-side before listener-side;
`societySnapshot` only at ledger boundaries; `conversationSession`
bounds anchor chains (visited set) and scans (session_scan_cap);
`beliefStatus` is a dirty-flagged cache of the §6.7 derivation with
`belief_hyst` hysteresis and `doubt_persist` sticky retraction;
validation = clamp+log | reject-NaN | skip-missing | degrade-unknown;
snapshots carry `specVersion`, migrate() is additive-only with a
`legacy` archive; degradation = documented L0–L4 modes only.

## 12. Transition-system annex — lifecycle, op catalog, boundary (new in v4.4)

Normative pointer to `formal-model.md` §§36–44. Implementation-facing
summary; the formal doc is the authority.

### 12.1 Record lifecycle FSM

States `proposed → live → {permastore | archived → dropped}`; flags are
never states. Legal exits: `live→archived` (R < forget_thresh at tick
step 11); `live→permastore` (semantic, S ≥ permastore_thresh); merge
moves *participants* to `archived` — merge never drops; `archived→live`
exists ONLY via maximal-cue resurrect (`cueMatch_ext > resurrect_thresh`,
R ← min(resurrect_R, S) then reboost); `archived→dropped` at cap
overflow (terminal; id retained forensically); `permastore` freezes R —
retrieval/retell/drift still apply (permastore is retention, not
protection). No op may edit an archived record; resurrection works on a
re-lived copy.

### 12.2 Op catalog and the commutativity theorem

Classes: **P** pure reader (no writes, no accessLog), **W** single-char
writer, **D** dyadic (commits speaker-side first, §26.2), **T** tick
(atomic vs broadcasts), **G** global pure. Legal parallelization =
per-character serialization + sorted-charId dyad locks + P∘anything
commuting across characters. Any interleaving respecting those rules
must equal the canonical sequential run — no weaker consistency model
is legal. `reader_pure` = {dateEstimate, orderBefore,
conditionedAffect, selfReport, judgeFrequency, consensusEstimate,
openLoopUrge, snapshot} — these must leave zero state delta (P465):
dateEstimate is not rehearsal.

### 12.3 Information boundary — field tiers

**C** (character-visible emissions): verbatim/gist/cueVector, confidence,
beliefStatus, affect tags, tot/fok/searchCost flags, familiarity tier.
**M** (mechanism — may steer dynamics, never emitted as a value):
strength, storageS, encodingE, hearCount/retellCount/retrievalCount,
lastAccessDay, `possessed`, sleepdep_flag, `open`, `bs_stale`, jol,
params. **E** (evaluator oracle — steers nothing, harness-only):
`accuracy`, `phantom`, ledger truth, true createdDay, `legacy`.
Non-interference (Goguen & Meseguer 1982): runs differing only in
E-tier values must produce identical C/M state and emissions —
zero tolerance (P457). The Koriat FOK null (§5.21) is an instance:
`accuracy` steering retrieval would be an M-field mislabeled E.

### 12.4 World obligations (delivery contract)

Broadcast completeness (every participant gets encodeEvent, audited at
delivery), per-character ledger-order delivery, at-most-once
dailyMemoryTick per day boundary, pending buffer ≤ `pending_event_cap`,
snapshots only at ledger boundaries. Substrate owes atomicity,
determinism, tier discipline, ladder-only degradation (§31 of
formal-model.md).

### 12.5 New params (v4.4 block — all pop/harness, 3 locked nulls)

| param | default | notes |
|---|---|---|
| eval_delta_tol | 0.0 | harness — P457 tolerance is zero |
| pending_event_cap | 64 | pop — world delivery bound |
| dyad_lock_order | charId-sort | pop — deadlock-free pair order |
| reader_pure | op set in §12.2 | pop — purity list |
| accuracy_leak / phantom_steer / future_read_w | 0.0 each | locked nulls — oracles, labels, prescience are never dials |

### 12.6 Invariants I1–I12

Boundedness; counter monotonicity; createdDay/encodeAge immutability;
lastAccessDay ∈ [createdDay, now]; no future reads; FSM legality +
absorbing `dropped`; E-tier write-once; seed+ledger uniqueness;
era/capacity separation; beliefStatus FSM legality; C-tier-only
emissions; caps bind only at declared thresholds. Full table + check
points: formal-model.md §40. Probes P457–P468 in
validation-design.md §73.

## 13. Content-algebra and ensemble annex — rewrite catalog, mean-field, canonical form (new in v5.5)

Normative pointer to `formal-model.md` §§45–51. Implementation-facing
summary; the formal doc is the authority.

### 13.1 Field tiers and the rewrite catalog

Every record field is exactly one content tier: **V** (verbatim —
write-once at encode, decays only), **G** (gist — full rewrite
target), **K** (schema skeleton — only ρ_abs/ρ_mrg), **T** (tags:
valence/beliefStatus/flags — bounded drift rules only), **M** (meta —
mechanism fields, never rewritten by the catalog). Every legal content
mutation is an instance of the 11-rule catalog ρ_sub / ρ_ins / ρ_del /
ρ_abs / ρ_ret / ρ_vd / ρ_mrg / ρ_emb / ρ_tune / ρ_den / ρ_fab —
trigger and rate come from the existing §4–§6 mechanisms; the catalog
adds operand types and postconditions, not new psychology. Grammar
invariants: **G1** no rule writes V post-commit (verbatim is
conserved — Bartlett/Loftus reconstructive consensus made decidable);
**G2** every delta writes `lastRewrite` (M-tier audit, never emitted);
**G3** operand legality (ρ_mrg inputs live sub-salience only, never
outputs V; ρ_emb writes G only); **G4** T-tier moves are bounded
monotone steps and beliefStatus moves only via the §12.3/§28 FSM.
Psychological license for "retellings rewrite": Hirst & Echterhoff
2012 (Annu Rev Psychol 63:55) and Higgins & Rholes 1978 (JESP
14:363).

### 13.2 The ensemble layer — rumor as a contact process

Per-encounter transmission `p_tx(A→B)` = P(A retrieves) · P(A emits) ·
P(B encodes hearsay) · p_adopt(B|account) — all existing kernels.
Society object K(t) = knower count, Maki–Thompson (1973)
ignorant/spreader/stifler structure on the world-supplied contact
graph. Mean-field calibrator: `R_eff = κ·p̄_tx·τ_survive`; never-hear
fraction → ~0.203 under homogeneous mixing (Sudbury 1985, J Appl Prob
22:443), lifted by `mix_correct` on the venue-clustered RW graph.
**The mean field predicts — it never steers** (`meanfield_drive = 0`):
coverage outside `mix_band` localizes a bug to one of the four p_tx
factors (P592/P598). Correction half-life `τ_corr > τ_rumor` with a
`cie_residual` floor (P597) — the correction outruns nobody.

### 13.3 The Jensen rule

Adoption is concave in susceptibility and retrieval is convex at the
floor, so `E_θ[K(t)] ≠ K(t|E[θ])`. Ensemble probes MUST run the full
parameter joint (IndivTraits MVN + jitter); a mean-param run is a
diagnostic, never a verdict (P593). Diversity isn't aesthetics — the
society-level statistic is unreachable from any single θ.

### 13.4 Canonical form and canonHash

`canonSerialize(S)`: lexicographic key order; sets sorted by id;
floats as IEEE-754 shortest round-trip decimals (`canon_float =
"r64-shortest"`); −0→+0; NaN/±Inf illegal in state; all spec
summations evaluated in canonical operand order (FP non-associativity
— Goldberg 1991; Monniaux 2008). `canonHash` = `hash_algo` (xxh64)
over canonical bytes. Bit-identical required within a build;
`fp_tol` applies to cross-port comparisons only. `state hash` in
P459/P465/P467 means `canonHash` output.

### 13.5 The approximation license

An approximation `op̃` is legal iff it preserves I1–I12, consumes the
identical RNG stream (draw-count parity per opTag), and keeps probe
statistics within `approx_tol` of canonical. Declared-legal: lazy
decay materialization (exact modulo §13.4 float order — P595),
session batching of tick effects (params frozen per-day → the
deferral is exact), census sub-sampling (statistics only — lifecycle
scans never skippable). Undeclared approximations are spec violations.

### 13.6 New params (v5.5 block — all pop/harness, 3 locked nulls)

| param | default | notes |
|---|---|---|
| canon_float | r64-shortest | pop — float canon rule |
| hash_algo | xxh64 | pop — canonHash algorithm |
| fp_tol | 1e-12 | harness — cross-port only |
| approx_tol | 1e-3 | harness — statistic-level |
| mix_correct | 0.6 | pop — venue-clustering lift on 0.203 |
| mix_band | ±0.15 | harness — coverage band half-width |
| verbatim_mint / orphan_rewrite / meanfield_drive | 0.0 each | locked nulls — G1/G2/§13.2 |

Probes P590–P601 in validation-design.md §101.
