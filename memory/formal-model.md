# Formal Model v9 — hardening layer for the memory spec

**Track:** memory-research (sf/memory) · **Companion to:**
`memory-model-spec.md` (v0.9). v0–v8 added mechanisms; this version makes
the accumulated spec *formally implementable*: exact units, input schemas,
operator ordering, an identifiability audit (which parameters are free and
which must be frozen), a computational budget with a degraded ambient mode,
edge-case semantics (possession gaps, thin-AI handoffs), determinism rules,
and formal/consistency probes P68–P75 that test the machinery itself rather
than a psychological phenomenon.

Conventions kept from the spec: all strengths/confidences in [0,1] unless
noted; every empirical claim carries its citation and is tagged
**CONSENSUS** / **DEBATED** / **HYPOTHESIS** (HYPOTHESIS = our modeling
choice, not a literature claim).

---

## 1. Timebase and units

- **Unit of time is the world day** (float). `worldDay` is a nondecreasing
  global counter; records store `createdDay`, `lastAccessDay`,
  `encodeAge = (createdDay − birthWorldDay)/365`, `ageDays = now − createdDay`.
- **Time-of-day** `tod = frac(worldDay)·24` hours; used by the synchrony
  terms (§2/§5.4 of spec) via `Δh = min(|tod − peak_hour|, 24 − |tod −
  peak_hour|)` — wraparound fix, the spec's `|tod − peak_hour|` is wrong at
  midnight boundary [HYPOTHESIS — arithmetic correction, not a claim].
- **Tick granularity is a free parameter.** The retention law
  `R(t) = E_adj·(1+t/τ)^(−β) + floor` is approximately **scale-invariant**:
  power-law forgetting fits equally across timescales from minutes to years
  (Rubin & Wenzel 1996 — the power function's consistency across 210
  datasets at wildly different t-units; Wickelgren 1974). Therefore the
  model may run decay hourly, daily, or per-event and produce the same
  *expected* trajectory — tick choice is a compute decision, not a
  psychological one [CONSENSUS at the level of functional form].
  **Consequence:** the decay update MUST be written as
  `strength := R(t_elapsed)` evaluated against elapsed time, never as a
  per-tick multiplicative step whose value depends on tick rate. The
  discrete exceptions — interference pairs, genericization merges,
  permastore flips, CondEntry extinction counters — are inherently
  event-counted and are allowed to be tick-bound.
- **Event ordering within a tick:** ties break by arrival order at the
  substrate (the canonical event ledger's sequence). If two events share a
  ledger position they are unordered for memory purposes; the substrate
  must not let order-dependent operators (interference asymmetry §4.2)
  observe a stable-but-arbitrary order — jitter same-position events by a
  seeded RNG [HYPOTHESIS].

## 2. Input schemas the spec assumed but never defined

The spec's equations consume `event`, `context`, `account`, `scenario`
objects whose fields came from nowhere. Formal definitions:

```json
Event = {
  "id": "ev_<uuid>",            // ledger id — anchors hearCount hashing
  "day": 412.63,                // fractional worldDay
  "kind": "action"|"utterance"|"perception"|"internal",
  "agent": "charId|null",
  "participants": ["charId"],   // people present who could be encoded
  "place": "mudhaus",           // venue key (world's location id)
  "topics": ["rent","landlord"],// world-supplied tags
  "sensory": ["espresso"],      // optional; usually sparse
  "valence": -0.6,              // event-level signed affect −1..1
  "arousal": 0.8,               // 0..1 intensity (world or dialogue layer)
  "salience_hint": 0.5,         // optional director/event-system nudge
  "predicted": {...}|null       // world-model expectation, if computable
}
```

```json
CueContext = {
  "place": "mudhaus", "people": ["mara"], "topics": ["rent"],
  "sensory": ["espresso"], "mood": -0.4, "stress": 0.0,
  "mode": "recall"|"recognition"|"directory",
  "targetPerson": "charId|null",      // §5.10 cascade
  "preparing": false,                 // next-in-line hole (§2 social)
  "unfocused": false,                 // gates §5.7 involuntary scan
  "k": 3                              // max reconstructions returned
}
```

### Derived-field defaults (HYPOTHESIS — the spec used these without a source)

`selfRelevance`, `novelty`, `predictionError`, `attention` are computed by
the substrate, not supplied. Proposed derivations so game-systems has a
contract:

- `attention` = clamp(attentionContext, 0, 1) where attentionContext is
  `0.1` ambient background, `0.4` periphery of conversation, `0.8` direct
  addressee/participant, `1.0` self-as-agent. Multiplied by
  `(1 − next_in_line)` when `context.preparing` (§2), and events with
  `arousal ≥ emo_blink_thresh` in the same window draw neighbors' attention
  implicitly through the blink rule.
- `selfRelevance` = max over: 1.0 if `agent == self`; 0.8 if any
  `participants ∩ closeOthers` (PersonModel familiarity > 0.6);
  0.5 if any topic ∈ character's active goals/intentions; 0.3 if
  place == home or workplace; else 0.1. [HYPOTHESIS — plausible weights,
  tune on probes.]
- `novelty` = `1 − max over same-type records of jaccard(cueFields)` — the
  §4.3 merge machinery's own similarity measure doubles as the novelty
  meter; routine events have novelty → 0 and never reach `att_min`-quality
  encoding. [HYPOTHESIS]
- `predictionError` = `|predicted.valence/structure − actual|` where the
  world supplies `predicted`; absent a prediction subsystem, default to
  `novelty/2`. [HYPOTHESIS — flagged for the game-systems liaison: a real
  expectation model would sharpen surprise-driven encoding.]

## 3. Operator ordering — the spec is section-ordered, not time-ordered

Mechanisms accumulated over v0–v8 and their *mutual order* was never
pinned. Order matters: e.g., consolidation must precede the same-day decay
pass or `consol_beta_mult` never applies; the emotional blink must fire
after neighbors exist. Canonical orderings:

### 3.1 `encodeEvent(charId, event, context)` — strict sequence

```
1. attention gate:        if attention·(preparing ? 1−next_in_line : 1)
                          < att_min → return null  (no record at all)
2. base E:                E = enc_base·attention·(1 + w_emo·arousal
                          + w_self·selfRelevance + w_nov·novelty
                          + w_pred·predictionError) + spacingBonus
3. synchrony:             E *= 1 − synchrony_gain·(1+age_eff/60)
                          ·(1−cos(π·Δh/12))/2          [if peak_hour set]
4. amnesia ramp:          E *= amnesia_ramp(encodeAge)
5. social encoding:       if agent != self: STI roll (sti_prob, diag
                          weights, cheaterLoad), incongruity_gain on E,
                          oab_loss on familiarity write,
                          mnemic_encode attention cut for self-threat
6. field write:           verbatim fields: central = top-40% by
                          attention×selfRelevance; central ×(1+abc_gain·
                          arousal); peripheral ×(1−arousal_narrowing·
                          arousal); each peripheral written only w.p.
                          vivid_detail; stress_encode_loss if arousal >
                          stress_thresh; face_ceiling cap on stranger
                          appearance; trauma:when fields at ×0.5
7. write record:          strength = E, confidence = base_conf(E)
                          + conf_bias + conf_emo_gain·arousal²,
                          accuracy = 1; trauma flag if arousal ≥
                          trauma_thresh
8. binding:               each links edge & cross-field cueVector pair
                          formed w.p. link_p·assoc_mult(age_now)
9. side-effects (after):  cond acquisition (arousal ≥ cond_thresh →
                          CondEntry += cond_gain·arousal); mark record
                          for sleepdep_flag evaluation at next sleep
                          tick; emo-blink PENDING flag — neighbors within
                          ±emo_blink_window evaluated at their write or
                          this write, whichever closes the window
10. spacing:              if event re-activates existing record beyond
                          spacing_min_gap → boost THAT record (§5.9),
                          skip creating the duplicate
```

The blink is deliberately **post-write and retroactive**: records created
earlier in the window lose encodingE after the fact — retrograde amnesia
is part of the mechanism (Strange et al. 2003), not an implementation
leak.

### 3.2 `recall(charId, C, k)` — strict sequence

```
1. candidate set:         cue-bucket preselection on C fields → rank by
                          drive → keep top search_breadth(age_eff)
2. per candidate m:       cue gating §5.1 → noisy-OR §5.2 → place/mental
                          reinstate → mood terms §5.3 → drive §5.4
                          (env_support_gain on cueMatch_ext; +N(0,
                          ret_noise); θ += stress/synchrony/mnemic terms)
                          → P = logistic(k·drive)/(1+fan_k·ln(1+fan))
                          → archive gate: strength < forget_thresh needs
                          cueMatch_ext > resurrect_thresh
3. roll & collect:        sample top-k successes
4. per returned m:        specificity gate (generic swap w.p.
                          1−specificity_eff) → TOT rolls on name fields
                          → reconstruction §5.5 (confab fill on missing
                          verbatim — §6.2; mood_bleed on reported tag;
                          trauma when-fragmentation) → phantom rolls §6.8
                          → reconsolidation §5.9 (strength += boost,
                          lastAccessDay = now, confidence += 0.03,
                          drift rolls §6.1 with valence-conditioned
                          drift_p_eff) → RIF on non-recalled competitors
                          §5.8 (trauma-exempt)
5. return                 [Reconstruction] with confidence, beliefStatus,
                          tot flags; NEVER phantom flag (character-blind)
```

### 3.3 `dailyMemoryTick(charId, sleepQuality)` — strict sequence

```
1. re-anchor:             age_now update; re-evaluate age-curve params;
                          age_eff = age_now − reserve·reserve_shift;
                          terminal ramp if deathDay in window (§4.8)
2. consolidation:         same-day records: encodingE *= sleepFactor
                          (·sws_mult episodic only); strength +=
                          emo_consol_gain·arousal·(1−strength) episodic;
                          post_stress retrograde boost; set sleepdep_flag
                          if sleepFactor < 0.75
3. decay:                 all records: strength := R(Δt) with per-type
                          β (verbatim k_verbatim; emo_gist_beta/
                          emo_verbatim_k; amnesia_decay_mult on
                          encodeAge<7 records; bump_gain on gated
                          bump-window records); source.confidenceInSource
                          at beta_source (·cheat_source_mult if linked
                          cheaterLoad > 0.5); young records (<
                          consol_window_days) decay at consol_beta_mult·β
                          ONLY here (awake-hours decay is bundled into
                          the sleep tick — §4.6)
4. interference/merge:    bucket records by dominant cue key; pairs with
                          similarity > interf_thresh·discrim_mult take
                          asymmetric interf_k hits; pairs > merge_thresh·
                          discrim_mult AND both sub-salience merge into
                          generic records (fan-count: 1)
5. affect fade:           valence magnitude decays (neg 1.3× pos,
                          depressive ×0.7); arousal tag at
                          arousal_affect_decay
6. sourceInfer pass:      records crossing source.confidenceInSource <
                          0.3 this tick run §6.10 (external reassignment
                          w.p. source_confuse·discrim_mult; imagined→
                          witnessed flip per §6.9 gates)
7. permastore:            semantic records age ≥ permastore_age ∧
                          strength ≥ permastore_thresh → freeze
8. gist boost:            generic + phantom records strength +=
                          sleep_gist_boost·(1−strength)
9. cond table:            CondEntry strength *= 1−cond_decay;
                          spontaneous-recovery decay of safeCount if
                          quiet > recovery_days
10. social store:         PersonModel tier decays (§4.10); cheaterLoad at
                          cond_decay·0.3
11. archive sweep:        strength < forget_thresh → archived (revivable
                          only via resurrect_thresh cues); enforce caps
                          §5 below
```

Rationale notes where order is *not* arbitrary: step 2 before 3 (a record
that decays before its first sleep never got consolidated — Jenkins &
Dallenbach's whole point); step 4 after 3 (interference acts on post-decay
strengths); step 6 after 5 (affect fade may itself cross no thresholds but
source decay must be current for the attribution pass); step 11 last
(archiving after merges so merged generics don't archive their parts
prematurely).

### 3.4 `hearAccount` / `retell` / `discussEvent` order

`hearAccount`: similarity gate → per-field p_adopt with the full §6.3
moderator stack → hearCount++ on content hash → plist_suppress on omitted
fields → SS-RIF on listener's unspoken related records → correction path
(§6.6) if `type:"correction"`. `retell`: §6.11 audience tuning FIRST
(speaker's record drifts), then §6.12 transmission operators produce the
heard version — the order is causal: what the speaker now believes is what
gets transmitted.

## 4. Identifiability audit — which parameters are real

The spec now carries ~120 MemoryParams fields. A model where everything is
free is unfalsifiable (Gutenkunst et al. 2007's "sloppy model" result:
multi-parameter systems typically have a few stiff directions and many
sloppy ones; behavior constrains only the stiff combinations). Audit of
known degeneracies and the resolution rule:

| degenerate pair/group | symptom | resolution |
|---|---|---|
| θ, w_str, k (§5.4) | logistic rescaling: raising w_str and θ together ≈ same P | **freeze k = 8 as population constant**; θ and w_str stay per-character (θ = retrieval caution, w_str = strength weighting) |
| τ, β (§4.1) | over windows < ~10τ the curve is β-dominated | **freeze τ** (episodic 1.2d, semantic 30d — fitted in forgetting-curves.md); β carries all character variance |
| conf_bias, base_conf(E) | both shift birth confidence | base_conf is a fixed function (not a param); conf_bias is the only free offset |
| drift_p, drift_k | per-recall mutation rate × size — product observable, parts not | drift_p per-character; **freeze drift_k = 0.02** population constant |
| interf_k, interf_thresh | more pairs × less force ≈ fewer pairs × more force | keep both (thresh also gates merge eligibility — different observables via §4.3) but bound them by P71 below |
| enc_base, att_min | rate × gate | identifiable together: enc_base sets strength of survivors, att_min sets count — different observables |
| emo_consol_gain vs w_emo | both raise emotional advantage | identifiable: w_emo acts at birth, emo_consol_gain at first sleep — probe on delay-dependent advantage (Sharot & Phelps 2004 design) |
| w_plaus/w_corr/w_fluency | relative weights only matter | **normalize Σw = 1** at load |
| level_frac vs assimilation_gain | both shrink chains | identifiable by *what* is lost (verbatim fields vs gist drift) — keep both |
| collab_base vs n | collab_factor at n=2 conflates | freeze collab_size_pen, collab_friend_mult as population constants |

**Rule for future params:** every new param must name the observable that
identifies it (a probe or a distinct behavioral signature). Params that
can't name one are frozen to population constants. Current split: ~70
free per-character params, ~50 frozen constants — the audit table in this
section is the authority; the §7 table marks frozen params `(pop)`.

**Population constants** (frozen across all characters; do not put in
profiles): `k = 8` (logistic sharpness), `drift_k = 0.02`, `tau_episodic =
1.2`, `tau_semantic = 30`, `collab_size_pen = 0.1`, `collab_friend_mult =
1.2`, `arousal_affect_decay = 1.4` [HYPOTHESIS anyway], `rep_cap = 2.0`.

## 5. Computational budget — Landauer grounding and caps

**Landauer (1986)** estimated lifetime functional memory at ~10⁹ bits
with long-term input rate ≈ 1–2 bits/second — humans encode on the order
of ~10⁵ bits/day despite ~10⁷ bits/s sensory intake [CONSENSUS as order of
magnitude; the exact figure is famously rough]. If a MemoryRecord's
*content* fields (gist + verbatim + cues) carry ~100–300 bits of effective
information, the human encoding budget is roughly **hundreds of
record-equivalents/day, most of which die same-day** — which is exactly
what the model should produce:

- `enc_quota_per_day` = 40 (mains): soft cap on records surviving to the
  first sleep tick. When exceeded, same-day records are ranked by E and
  the overflow starts the decay pass with an extra `×0.5` strength
  penalty — attentional saturation, not a hard wall [HYPOTHESIS].
- `cap_episodic` = 2000 live episodic records per main (~7 sim-years of
  notable events at ~1/day survival). Overflow archives the weakest —
  archival is never deletion (§4.4 resurrection stays possible).
- `cap_archive` = 8000; beyond that, archived records below
  `0.5·forget_thresh` may be dropped entirely (Landauer: the store is
  huge but the *index* is not — losing unrecoverable records entirely is
  consistent with permanent childhood amnesia outcomes).
- PersonModels: cap 60 per main (Dunbar-ish acquaintance layer —
  HYPOTHESIS, the 150 number is group-level not face-memory-level);
  weakest `familiarity` models merge into category-level stubs.

**Cost model per main per day:** encode O(1) amortized; recall O(fan) via
cue-key buckets — never O(n) scans; daily tick O(n) for decay +
O(b·b̄) interference within buckets; involuntary scan O(fan). With
n ≈ 2000 the whole memory system is comfortably under a millisecond of
arithmetic per character-day — the LLM is the cost, not the substrate.

### Ambient NPC degraded mode

The 20 ambients run the same equations with `ambient_tick_mult` = 3
(daily pass every 3 days), `ambient_cap` = 150 live records, no phantom
minting (§6.8 off), no involuntary scan (§5.7 off), PersonModel capped at
20, all trait-layer params at population means (no MVN draw — they're not
individuated). A promoted ambient keeps its store and upgrades: existing
records persist, new machinery switches on — promotion must not
retroactively create detail it never encoded [HYPOTHESIS — cleanest
continuity semantics].

## 6. Edge cases — possession gaps and suspension

Per the design doc (§5/§7), a hired character's LLM brain suspends during
possession and resumes on release; player-offline characters drop to thin
AI. Memory semantics:

- **Possession window:** events involving the character during possession
  ARE encoded — the body was there, the senses worked. Records get
  `possessed: true` (hidden flag, like `phantom`). Rationale: denying
  encoding would leave the AI with amnesia for its own public actions —
  observable and incoherent to other characters.
- **Estrangement discount (HYPOTHESIS):** at retrieval, possessed records
  take `possess_alien` (0.15) off the `w_self` contribution and a
  moodCongruence halving — the AI experiences its possessed period as
  slightly depersonalized, "I wasn't myself." This is flavor-consistent
  with the fiction (the character did not choose those actions) and costs
  one param.
- **No involuntary intrusion across the handoff boundary in either
  direction:** the scan pauses while suspended (nobody's attention is
  unfocused — it's absent); on resume, a single catch-up
  `dailyMemoryTick` runs per elapsed day up to a `catchup_max` of 7 —
  longer gaps apply one aggregated decay evaluation at full Δt (scale-
  invariance makes this exact, §1) with interference buckets sampled, not
  enumerated.
- **Briefing boundary:** the possession briefing never includes memory
  internals — players see the public profile only. The substrate must
  guarantee `possessed`-flagged and `phantom`-flagged internals never
  serialize into briefings (interface contract, spec §10).
- **Thin-AI offline mode:** identical to ambient degraded mode (§5) —
  same equations, coarser tick, caps. Player characters keep their full
  store; only the tick rate and scans degrade.

## 7. Determinism and serialization

- **Seeded RNG:** all stochastic draws go through
  `rand(seed_base, charId, worldDay, opSeq)` where opSeq increments per
  draw within the operation. Same seed + same ledger → identical memory
  state. Required for probes P68 and for replay/debugging the rumor
  engine.
- **Serialization:** `memorySnapshot` covers all four stores + params +
  `opSeq` continuation value + the CondEntry table + PersonModels. Round-
  trip must be bit-identical on the RNG state (P69).
- **No hidden global state:** the spec's functions take everything they
  need through charId/event/context — the trait layer's MVN draw happens
  once at `deriveParams`, not per tick.

## 8. Formal/consistency probes (P68–P75)

Probes P1–P67 test psychological phenomena; these test the machinery.
All are harness-level assertions over simulation runs, not literature
targets.

- **P68 determinism:** fixed seed + fixed 30-day event script run twice →
  identical record stores (hash compare excluding `accessLog` ordering).
- **P69 snapshot round-trip:** snapshot at day t, continue to t+10; on a
  parallel run load the snapshot and continue the same script → identical
  states at t+10.
- **P70 boundedness invariant:** after every op, all strength/confidence/
  familiarity/credibility values ∈ declared ranges; β multipliers compose
  but never exceed profile clamps. Fuzzed over random op sequences.
- **P71 tick-granularity invariance:** same event stream processed with
  hourly vs daily decay evaluation → per-record strength differences <
  5% at day boundaries (power-law scale invariance; discrete operators
  exempt and listed).
- **P72 ordering invariance of commute:** consolidation-before-decay and
  merge-before-archive orderings enforced by construction; assert that
  swapping any other adjacent daily-tick steps changes no outcome beyond
  noise (document which pairs are order-sensitive: only {2,3} and {4,11}).
- **P73 possession continuity:** character possessed for 2 days → resumes;
  assert (a) records exist for possessed-window events, (b) all carry
  `possessed`, (c) recallable but w_self contribution discounted, (d) no
  involuntary intrusions fired during the window.
- **P74 cap enforcement:** inject 5000 encodable events in one day →
  live records ≤ cap_episodic, archive ≤ cap_archive, quota penalty
  applied only above enc_quota_per_day.
- **P75 ambient-mode equivalence:** an ambient and a main run the same
  script; assert (a) overlapping operator results agree on shared
  records, (b) ambient-specific absences hold (no phantom mints, no
  intrusion log), (c) promotion preserves all pre-promotion record ids.

## 9. What this version does NOT do

- No new psychological mechanisms — every operator above already exists in
  the spec; this doc pins order, units, degeneracies, and budgets.
- No re-calibration of existing params — the audit freezes some, changes
  no fitted values.
- The Event/CueContext derivation defaults (§2) are flagged HYPOTHESIS
  throughout; world-builder/game-systems may supply better signals and
  should — these are floor implementations, not ceilings.

---

# Part II — v9 deepening pass: mechanism formalization (P76–P85)

The pass above hardened what existed; this pass formalizes five places
where spec v0.8 was still prose or hand-wave: (a) `strength` conflated
two different quantities — how *learned* a record is vs how *accessible*
it is right now; (b) `verbatim.when` "drifts at `drift_p·1.5`" — no model
of how people actually misdate memories; (c) hindsight — the most common
distortion in everyday belief talk ("I knew it all along") — absent;
(d) confidence updates ignored the strongest everyday signal, retrieval
*fluency*; (e) recall order had no temporal structure — real recall
jumps along the timeline; (f) no analytic targets an implementer could
assert in a unit test. Spec refs below are to spec v0.9.

## 10. Two strengths: storage vs retrieval (the `strength` split)

**CONSENSUS.** Bjork & Bjork's New Theory of Disuse (1992, Estes
Festschrift; restated Bjork & Bjork 2020, JARMAC) separates:

- **Storage strength (S)** — how well-learned/interrelated a record is.
  Grows with study and *successful retrieval*; essentially non-decaying.
- **Retrieval strength (R)** — accessibility *right now*; decays fast
  with disuse, resets high on each retrieval.

The pair explains what a single strength cannot:

1. **Savings / fast relearning.** A childhood address can be unavailable
   (R≈0) yet relearns in one re-exposure because S is high (Ebbinghaus
   1885 savings; Nelson 1985 — savings measurable even for items that
   could not be recalled at all).
2. **Spacing / desirable difficulty.** S increments are larger when the
   retrieval was *harder* (low current R) — empirically the lag effect
   (Cepeda et al. 2006 meta, 254 studies) and the testing effect
   (Roediger & Karpicke 2006; Karpicke & Roediger 2008).
3. **Why retelling a story the same week barely helps but retelling it
   next season cements it** — same operator, different R.

**Formalization (spec §4.11, §5.9):**

- `MemoryRecord.strength` *is* R — unchanged semantics everywhere it is
  read (decay §4.1, archive §4.4, drive §5.4). Backward compatible.
- New field `storageS ∈ [0,1]`, init `= encodingE` at birth.
- S update on successful retrieval:
  `S += s_gain·(1−S)·(1−R_pre)` where `R_pre` is R *before* the
  reactivation boost — the difficulty term. s_gain ≈ 0.35. Massed
  retellings (R_pre still high) add almost nothing; a hard-won recall
  after months adds a lot. Identifying observable: P76 spacing ordering.
- R update replaces the flat `boost·(1−R)`:
  `R ← 1 − (1−R)·(1 − retell_boost·(0.5 + 0.5·S))` — high-S records
  snap back near full accessibility on one cue; low-S records get a
  shallow refresh ("it all comes flooding back" vs "vaguely rings a
  bell" — observable in P78 revival contrast).
- S decay: `S *= (1 − s_decay)` daily, s_decay ≈ 0.0008 — ~2 orders
  slower than R's effective daily loss; effectively permanent over a
  character arc except under the §4.8 terminal ramp (s_decay is a
  capacity param there).
- Archive semantics: §4.4 archives on R only; S persists, which is *why*
  maximal-cue resurrection works. On resurrection:
  `R ← max(R, min(resurrect_R, S))`, resurrect_R ≈ 0.35.
- Savings/relearn: re-encoded content matching an archived record
  (similarity > merge_thresh) merges instead of duplicating, with the
  new encoding boosted `E_new·(1 + relearn_gain·S_old)`,
  relearn_gain ≈ 0.8 (Ebbinghaus; Nelson 1985). Identifying observable:
  P77.
- Permastore (§4.7) re-anchored on S: `S ≥ permastore_thresh`.

**DEBATED:** NToD is a functional framework, not a fitted model — all
constants here are HYPOTHESIS. The qualitative laws are consensus.

## 11. Temporal localization — how characters misdate memories

**CONSENSUS.** `verbatim.when` was already the fastest-decaying field
(`drift_p·1.5`; Wagenaar 1986 found "when" the weakest cue). What
replaces it is now specified — dating is reconstruction, not readout
(Friedman 1993):

- **Telescoping** — remote events dated too *recent* (forward), very
  recent slightly too *remote* (backward): Janssen, Chessa & Murre 2006
  (Memory & Cognition 34:138 — validated news events + Galton-Crovitz
  personal events); Thompson, Skowronski & Lee 1988; Rubin & Baddeley
  1989; Bradburn, Rips & Shevell 1987.
- **Rounding/boundaries** — elapsed-time reports cluster on schema units
  (days→weeks→months) and estimates inside a fuzzy temporal category
  pull toward its central value (Huttenlocher, Hedges & Bradburn 1990;
  category-adjustment model: Huttenlocher, Hedges & Vevea 2000).
- **Landmarks** — dating improves when anchored to a public/personal
  landmark (Brown, Rips & Shevell 1985; Shum 1998).
- **Ordering > dating** — relative order survives absolute-date loss;
  order uses strength gradients and episode chains (Friedman 1993).

**Formalization (new spec §6.15, `dateEstimate`):**

```
true_age     = now − m.createdDay                          // hidden
reported_age = true_age·(1 − tele_k_eff)                   // forward pull
             + (true_age < tele_cross ?
                tele_back·(tele_cross − true_age) : 0)     // small backward
             + N(0, date_sigma·sqrt(true_age + 1))         // noise ∝ √age
where tele_k_eff = tele_k·(1 − landmark_gain) if m links a landmark
                   record (arousal ≥ landmark_arousal), else tele_k
      sigma likewise ×= (1 − landmark_gain)
if verbatim.when alive → return near-veridical (error ×0.2)
if verbatim.when dead, with prob round_p:
   snap reported_age to nearest of {7, 30, 90, 365} — category rounding;
   only a fuzzy era tag survives → report the era centroid
   (category adjustment)
```

Params: tele_k ≈ 0.12, tele_cross ≈ 21d, tele_back ≈ 0.05,
date_sigma ≈ 0.9, round_p ≈ 0.5, landmark_gain ≈ 0.4,
landmark_arousal ≈ 0.7. Constants loosely fit to Janssen et al. 2006 —
exact values HYPOTHESIS, phenomenon consensus. Identifying observables:
P79 (telescope sign test), P80 (rounding), P81 (landmark).

`orderBefore(m,n)` — cheaper, survives date loss:
`P(correct) = logistic(k_order·(S_n − S_m)·sgn(createdDay_n − createdDay_m))`
— ordering rides the S gradient (stronger feels more recent): same-week
pairs coin-flip, distant pairs order correctly while both dates are
wrong. k_order ≈ 4 [pop constant — identifiable only via ordering
curves, too entangled with S for per-character freedom].

Behavioral yield: "last month" said of a 9-month-old event with a
straight face; correct argument about which of two things came first
while misdating both; exact dates only when pinned to a landmark
("right before the block party").

## 12. Hindsight bias — "I knew it all along"

**CONSENSUS.** Once an outcome is known, memory for one's prior
expectation assimilates toward it (Fischhoff 1975; Fischhoff & Beyth
1975 "creeping determinism"; metas: Christensen-Szalanski & Willham
1991 — 122 studies; Guilbault, Bryant, Brockway & Posavac 2004).
Moderator: outcome must be assimilable — unbelievable outcomes show
attenuated/reversed hindsight (Blank & Nestler 2007; the bias serves
sense-making). In RW every resolved drama rewrites what characters
*think* they predicted — and `told_by` prediction records drift too
("everyone saw it coming").

**Formalization (new spec §6.16, `learnOutcome`):**

```
learnOutcome(charId, eventRef, outcome):     // world resolves an open question
  surprise = |outcome − prior_expectation|                  // 0..1
  if surprise > hindsight_max_surprise (0.7):
      no assimilation — encode the SHOCK as a fact about the event
      ("I never saw it coming"); hindsight blocked
      (Blank & Nestler 2007 gate)
  else for each record m on eventRef (overlap ≥ 0.4,
       createdDay < outcomeDay, beliefStatus ∈ {fact,belief,rumor}):
      prior_field  += hindsight_k·(outcome − prior_field)
      confidence   += hindsight_conf_gain
      accuracy     −= hindsight_k·|outcome − prior_field|   // hidden
```

hindsight_k ≈ 0.35 (per-character — readable as "graciousness in defeat"
vs "told-you-so" trait; observable: P82), hindsight_conf_gain ≈ 0.08
[pop]. DEBATED: reconstructive-at-recall vs encoding-level update — we
implement at feedback (cheaper, functionally equivalent downstream).

## 13. Fluency → confidence and judged frequency

**CONSENSUS.** Confidence is built from *processing cues*, not the trace
— Koriat's cue-utilization framework (Koriat 1993; Koriat & Levy-Sadot
2001). Two portable effects:

- **Ease-of-retrieval / availability** — judged frequency tracks ease of
  generation, not count: few examples recalled easily → "happens all
  the time"; struggling to produce many → "rare," even when more items
  surfaced (Schwarz et al. 1991, the 6-vs-12 reversal; Tversky &
  Kahneman 1973).
- **Hard-easy overconfidence** — confidence–accuracy calibration
  degrades with difficulty (Lichtenstein & Fischhoff 1977; qualified by
  Gigerenzer, Hoffrage & Kleinbölting 1991 — shrinks for frequency
  formats; kept as a modest bias on *episodic* confidence only).

**Formalization (spec §3, §10 contract):**

- `recall` returns `searchCost` = scored/returned candidate ratio +
  mean drive margin — O(1) bookkeeping. Dialogue layer reads it:
  `searchCost ≤ ease_few` (1.5) → confident high-frequency assertion;
  `≥ ease_many` (3.0) → hedged rare judgment — *independent of count*.
  [Thresholds HYPOTHESIS; sign of effect consensus. Observable: P85.]
- Report-time overconfidence: `conf_out = conf + oc_gain·max(0, conf −
  accuracy)·(1 − m.strength)` — the overclaim widens exactly where the
  trace is weakest. oc_gain ≈ 0.3 (per-character; observable: P84).
  Never feeds back into `accuracy`.

Net RW effect: the fluently repeated rumor feels common and certain;
the barely-cued third retelling is where characters are most wrong
*and* most sure.

## 14. Temporal contiguity — recall walks along the timeline

**CONSENSUS.** Recalling an item reinstates its temporal context, which
cues neighbors-in-time — the contiguity effect, persistent at all
retention intervals with forward asymmetry (Howard & Kahana 1999, 2002
Temporal Context Model; Kahana 1996; Sederberg, Howard & Kahana 2008).
Explains why reminiscence bursts from the same week and why "and then?"
flows forward.

**Formalization (spec §5.4 addition):** the recall context carries
`temporalAnchor` = createdDay of the last successfully recalled record
this conversation; each candidate's drive gains

```
contiguity_gain·exp(−|createdDay − anchor|/contiguity_tau)
·(createdDay ≥ anchor ? contiguity_asym : 1)
```

contiguity_gain ≈ 0.15, contiguity_tau ≈ 2d, contiguity_asym ≈ 1.25.
Drive-only — cannot reach archived records alone (resurrect_thresh
still applies). One scalar per candidate. Observable: P83.

## 15. Analytic calibration harness (closed-form unit targets)

All operators are closed-form; implementers can unit-test before tuning.
Defaults per spec §7; deterministic parts exact, stochastic ±10%.

**(a) R trajectories** — `R(t) = E·(1+t/τ)^(−β)`, E=0.6:

| record | day 7 | day 30 | day 90 | day 365 |
|---|---|---|---|---|
| episodic (τ=1.2, β=0.5) | 0.230 | 0.118 | 0.069 | 0.034 |
| semantic (τ=30, β=0.2) | 0.563 | 0.522 | 0.444 | 0.358 |

A median-salience episodic record crosses forget_thresh (0.08) between
day 60–90 unaccessed — most ambient detail dies within a season;
semantic survives the year. Intended selectivity.

**(b) Two-strength trajectory** — E=0.6, one retell at day t:
S = 0.6 + 0.35·0.4·(1−R(t)): t=1 → S≈0.70; t=30 → S≈0.72; t=90 →
S≈0.73. Assert S ordering monotone in lag (spacing signature), and
post-lag R higher for longer lags.

**(c) Archive/resurrect** — E=0.6 episodic unaccessed: archived day
60–90; `dateEstimate`/`sourceInfer` still run on it. Maximal-cue
resurrection → R = min(0.35, S=0.6) = 0.35, then §4.11 reboost.

**(d) Telescoping** — 300d-old record, `when` dead: mean reported ≈
264d (12% forward); σ ≈ 0.9·√301 ≈ 15.6d; ≥ round_p fraction of
reports on {7,30,90,365}. 5d-old: slight backward (≈5.8d).

**(e) Fan divisor** — fixed cue, fan 1 vs 8:
(1+0.4·ln2)/(1+0.4·ln9) ≈ 0.68 — related-episode competition halves
accessibility at modest fan (Anderson & Reder 1999).

**New probes P76–P85 (mechanism-deepening suite):**

- **P76 spacing signature:** matched records retold at lag {1,30,90}d →
  S and day-180 retention monotone in lag.
- **P77 savings:** re-encoding archived content restores reachability
  in ≤ half the encodings of a matched novel record.
- **P78 resurrection contrast:** archived high-S revives at R≈0.35 and
  reboosts strongly; archived low-S (S<0.35) revives at R≈S, shallow.
- **P79 telescoping sign:** >tele_cross events net-forward, <tele_cross
  net-backward; σ(age) ∝ √age monotone.
- **P80 rounding:** dead-`when` records report ages on {7,30,90,365}
  at ≥ 0.9·round_p rate.
- **P81 landmark rescue:** landmark-linked records show |telescope| and
  σ reduced ≈ landmark_gain vs matched unlinked.
- **P82 hindsight:** post-learnOutcome, remembered prior shifts ≥
  hindsight_k·|gap| toward outcome; surprise > hindsight_max_surprise
  blocks it and encodes the shock.
- **P83 contiguity:** P(next recall within ±contiguity_tau of anchor |
  no cue overlap) ≫ base; forward:backward ≈ contiguity_asym.
- **P84 hard-easy:** corr(conf − accuracy gap, −strength) > 0;
  high-strength records near-calibrated.
- **P85 ease-of-retrieval:** identical counts, manipulated searchCost →
  judged frequency follows ease, not count.

## 16. New params (spec §7 v0.9b block) — audit-compliant

Per §4's rule each names its identifying observable:

| param | default | free? | observable |
|---|---|---|---|
| s_gain | 0.35 | per-char | P76 spacing steepness |
| s_decay | 0.0008 | pop | P78 (long-run only — not per-char identifiable) |
| relearn_gain | 0.8 | pop | P77 |
| resurrect_R | 0.35 | pop | P78 |
| tele_k | 0.12 | per-char | P79 magnitude |
| tele_cross | 21 | pop | P79 crossover |
| tele_back | 0.05 | pop | P79 recent-end |
| date_sigma | 0.9 | per-char | P79 σ(age) slope — the "timeline muddle" trait |
| round_p | 0.5 | per-char | P80 — the "round numbers" speech habit |
| landmark_gain | 0.4 | pop | P81 |
| landmark_arousal | 0.7 | pop | P81 threshold |
| k_order | 4.0 | pop | ordering curves (entangled with S) |
| contiguity_gain | 0.15 | per-char | P83 — the "reminiscence cascader" trait |
| contiguity_tau | 2.0 | pop | P83 width |
| contiguity_asym | 1.25 | pop | P83 asymmetry |
| hindsight_k | 0.35 | per-char | P82 — "told-you-so" trait |
| hindsight_conf_gain | 0.08 | pop | P82 confidence leg |
| hindsight_max_surprise | 0.7 | pop | P82 gate |
| ease_few / ease_many | 1.5 / 3.0 | pop | P85 thresholds |
| oc_gain | 0.3 | per-char | P84 — overconfidence trait |
| searchCost fields | — | — | output, not param |

21 params, 9 per-character, 12 frozen — split chosen by the §4 audit
rule, not taste.

## 17. Summary for game-systems

One new record field (`storageS`), two new calls (`dateEstimate`,
`learnOutcome`), two new context/result fields (`temporalAnchor` on
CueContext, `searchCost` on Reconstruction), one rewritten update
(§5.9), three additive terms (§5.4 contiguity, §3 overconfidence,
resurrect floor). Daily-tick added cost ≈ nil — S updates ride the same
loops as R. Whole layer is flag-gateable: diff probes P76–P85.

---

# Part III — v21 deepening pass: the measurement layer and numerics (P193–P200)

Part I pinned order/units/budget; Part II formalized five mechanisms.
This pass closes the three remaining informal holes — (a) `similarity`,
invoked in nine places with nine different intended meanings and one
undefined formula; (b) metamemory — the spec produces records and
reconstructions but the character has no instrument for *sensing* its
own memory (FOK, JOL), which is where "I know it but can't say it,"
"I'll never forget this" (wrongly), and "you'd remember better than me"
come from; (c) numerics — the spec's caps and constants have never been
checked against the closed-form steady state they imply. Plus the
distribution semantics every stochastic draw silently assumes, and a
composite-observable table that turns §4's sloppy-model audit into
concrete regression targets.

## 18. The similarity operator — one equation, nine call sites

`similarity` currently appears as `jaccard(cueVector a, cueVector b)`
(§4.2) and as bare `sim(·,·)` at: interference pairs (§4.2), merges
(§4.3), relearning match (§4.11), conditioned-affect generalization
(§4.9), RIF competitors (§5.8), misinformation gate (§6.3), source
reassignment (§6.10), core-field match for absorption (§6.23), and
reminding chains (§5.17). One undifferentiated Jaccard cannot serve all
of them — interference should fire on *temporal-topic* neighbors (the
same-venue-same-week collisions proactive interference is made of,
Underwood 1957; Keppel & Underwood 1962) while merge should require
*content* overlap (same event, different retelling). This is not a
taste call: Tversky's contrast model (1977) establishes that similarity
is feature-set matching whose weights are *task-relative* — the same
stimuli are "similar" or not depending on which features the judgment
context makes diagnostic [CONSENSUS at the level of principle; the
weight tables below are HYPOTHESIS]. Nosofsky's generalized context
model (1986) supplies the gradient shape — similarity falls
exponentially with psychological distance, which is exactly what §4.9's
`gen_width` already assumes.

**Formalization (new spec §11.1, `simOp(a, b, mask)`):**

```
simOp(a, b, mask) = Σ_f w_f(mask)·match_f(a_f, b_f) / Σ_f w_f(mask)

match_f over cueVector fields:
  people, topics, sensory:  jaccard(set_a, set_b)
  place:                    1 if equal; place_adj if world-supplied
                            adjacency (same block/venue family); else 0
  mood:                     1 − |mood_a − mood_b|/2
  era/when:                 exp(−|createdDay_a − createdDay_b|/sim_tau_time)
                            — temporal distance is a feature, not a tag
                            (Friedman 1993); sim_tau_time ≈ 14d
  names (PersonModel tier): phonological key match —
                            equal 1.0, same metaphone 0.7,
                            same onset+length class 0.4, else 0
                            (phonological confusability is the dominant
                            error channel: Conrad & Hull 1964; Baddeley
                            1966 — "Mara"→"Marta" beats "Mara"→"Dolores"
                            at equal featural overlap)
```

**Callsite masks** (rows = operator, columns = field weights; all rows
Σw = 1 after masking — same normalization rule as w_plaus/w_corr):

| mask | people | topics | sensory | place | mood | when | names |
|---|---|---|---|---|---|---|---|
| `sim_interf` (§4.2) | .15 | .25 | .10 | .10 | .05 | .35 | 0 |
| `sim_merge` (§4.3) | .25 | .30 | .10 | .20 | 0 | .15 | 0 |
| `sim_cond` (§4.9) | .10 | .20 | .30 | .25 | .15 | 0 | 0 |
| `sim_rif` (§5.8) | .20 | .35 | .10 | .15 | 0 | .20 | 0 |
| `sim_misinfo` (§6.3) | .25 | .30 | .05 | .25 | 0 | .15 | 0 |
| `sim_source` (§6.10) | .10 | .15 | .20 | .15 | .20 | .20 | 0 |
| `sim_remind` (§5.17) | .30 | .25 | .15 | .15 | .05 | .10 | 0 |
| `sim_person` (name confusions, §5.10/§6.10) | .30 | .15 | 0 | .10 | 0 | .05 | .40 |

Behavioral yields that the bare Jaccard could not produce: proactive
interference concentrated on same-week similar events (the "which
lunch" problem); sensory-weighted conditioned-affect generalization
(the Proust route §5.20 rides on `sim_cond`'s sensory column); source
confusion between mood-matched contexts (§6.10 now confused in the
right direction); and name-tier confusions that are *phonological*
(Conrad & Hull) not semantic — the game never has to fake a
"Marisol/Marta" mix-up again, it falls out of the mask.

Identifying observable: P193 (mask-sensitivity + phonological contrast).

## 19. Metamemory — the character's instrument panel (FOK, JOL)

The spec's one metamemory surface is `selfReport` (trait-level, v1.9)
and `tot` flags (field-level, v1.4). Missing is the *moment-level*
signal that humans use to allocate search effort and make claims about
their own memory. Two instruments, both grounded:

### 19.1 Feeling-of-knowing — `fok(m, C)` on failed retrieval

**CONSENSUS.** Koriat's accessibility model (Koriat 1993; Koriat &
Levy-Sadot 2001): FOK is computed from **cue familiarity + the amount
and intensity of partial information retrieved**, NOT from trace
strength — hence the signature dissociations: high FOK on unrecallable
items (familiar cue, fluent fragments, dead target), FOK tracking
partial output rather than correctness, and FOK being *positively
correlated with wrong answers* when the fragments are wrong
(accessibility is blind to accuracy). Aging splits it: semantic FOK
preserved, episodic FOK degrades to near-chance in older adults —
executive/frontal-linked (Souchay, Isingrini & Espagnet 2000;
meta-analysis g = 0.53 episodic deficit vs −0.10 semantic, Sacher et
al. 2023 — Scientific Reports 13:17204).

**Formalization (new spec §5.21, output on Reconstruction and on
failed searches):**

```
On recall failure or TOT:
  partialScore = (# verbatim fields retrieved above candStrength floor)
                 / (# encoded fields)
  fok = logistic(k_fok·(a_cue·cueMatch_ext + a_part·partialScore
        + a_fam·familiarity(targetPerson, if any) − θ_fok))
        + N(0, fok_noise)                       // fok_noise ≈ 0.08
  episodic records only, older characters:
        fok += N(0, fok_age_noise·(age_eff/70)) // fok_age_noise ≈ 0.25
        — noise injection, not bias: accuracy degrades to chance
        (Souchay), confidence in the feeling does not
```

Then the behavior hook: a failed recall with `fok > fok_retry` (0.6)
triggers ONE follow-up scan at `search_breadth/2` — characters keep
digging exactly when fragments flowed. `fok` is returned on the
Reconstruction for the dialogue layer ("it's right there — the tall
guy, the landlord thing — give me a second"). **Critical null:**
`fok` must never be clamped by `accuracy` — a phantom record with
rich confabulated candidates yields high FOK and the character will
insist it happened (P194; this is the documented phenomenon, Koriat
1995 — FOK is high on items that turn out wrong because the fragments
that generated the feeling are the same fragments that generate the
error).

### 19.2 Judgment-of-learning — `jol` at encode time

**CONSENSUS.** JOLs predict future recall poorly when made immediately
after encoding and well when delayed (Nelson & Dunlosky 1991 — gamma
0.45 immediate vs 0.93 delayed; the "delayed-JOL effect", robust at
meta level: Rhodes & Castel 2008, Psych Bulletin 134:117, g = 0.93).
The mechanism per the monitoring-dual-memories account (Dunlosky &
Nelson 1992): immediate JOLs read short-term accessibility — fluent,
still-warm content *feels* learned — while delayed JOLs read actual
retrieval products. Consequence for RW: characters are most confident
they'll remember exactly when encoding was fluent-but-shallow — the
"we had such a good talk, I'll never forget it" error.

**Formalization (spec §5.21):**

```
encodeEvent returns jol on the record (hidden, harness-readable):
  jol = logistic(k_jol·(E + jol_fluency·fluencyNow − θ_jol))
  where fluencyNow = attention·(1 − lapse) — the still-warm signal
  (immediate-JOL inflation lives in the fluency term: E and
  fluencyNow dissociate under lapse/DA/intox — high fluency, low E)
At §4.13 ecology fire or first natural retrieval (>1 day):
  jol_delayed = logistic(k_jol·(drive_achieved − θ_jol))
  SelfModel merges: self_est moves toward jol_delayed at rate
  metamem_r — delayed judgments are the accurate ones
```

`jol` drives `strategy_use` (v1.0): `P(write-it-down/ask-reminder)`
rises when `jol` is low on a *high-stakes* record (open loop, intention)
— the character who knows they won't remember is the character who
writes the list. Identifying observable: P196 (immediate-JOL
overconfidence on fluent-shallow encodings; jol→strategy_use gradient).

**Budget:** both instruments are O(1) bookkeeping on values already
computed — `partialScore`, `cueMatch_ext`, `drive_achieved` all exist
in the recall path. No new stores.

## 20. Steady-state numerics — the census workbook

Part I asserted caps from Landauer's order-of-magnitude budget; here is
the first check against the model's own closed forms. A record dies
(archives) when `R(t) < forget_thresh`:

```
t_death(E) = τ·((E/thresh)^(1/β) − 1)     [power-law inversion, exact]
```

With spec defaults (τ=1.2, β=0.5, thresh=0.08), E from the §2 derivation
defaults (enc_base=0.35 · attention · (1+extras)):

| attention class | typical E | t_death (β=.5) | β=.6 (midlife) | β=.7 (older) |
|---|---|---|---|---|
| ambient 0.1 | 0.045–0.091 | 0–0.4d | 0–0.3d | 0–0.2d |
| periphery 0.4 | 0.18–0.36 | 5–24d | 3.5–14d | 2.7–9d |
| participant 0.8 | 0.36–0.73 | 24–98d | 14–46d | 9–27d |
| self-agent 1.0 | 0.46–0.91 | 38–154d | 20–68d | 13–38d |

**Ambient-attention records die same-day at every age** — the §5
Landauer budget claim ("hundreds of record-equivalents/day, most die
same-day") is confirmed by the model's own arithmetic, not asserted.

**Census steady state.** With an attention mix
(50% ambient / 25% periphery / 20% participant / 5% self-agent) and
λ records/day surviving the encode quota, E[t_death] ≈ 19 days →
`N_live ≈ λ·19`:

| λ | N_live (no retells) | vs cap_episodic=2000 |
|---|---|---|
| 10/day | ~191 | never binds |
| 20/day | ~381 | never binds |
| 40/day (quota) | ~763 | 2.6× headroom |

Retells and consolidations push the tail up (reboosted records re-enter
at higher R), but the equilibrium is self-limiting: more live records →
more interference pairs → more suppression. cap_episodic=2000 is
correctly sized as a *burst* bound, not a population regulator — the
regulator is the forgetting curve itself. **Correction to Part I §5:**
the cap should never visibly bind in normal play; if a run hits it, the
encode rate is wrong, not the cap. Flagged as P197.

**Canonization timescale.** §4.13 ecology draws alone:
`p/day = retell_base·E·(1+share_k·|affect|)` → expected days to
canon_thresh=5 range 215d (E=0.9, |affect|=0.9) to 1667d (E=0.2,
flat). Ecology-only canonization is therefore a multi-season event for
all but the hottest records — but `retellCount` also increments on real
§6.11 retells in conversation, which for gossiped events run far above
the Bernoulli rate. **Deliberate consequence:** canonization tracks
*talk*, not time; a secret everyone discusses freezes in weeks, a
private triumph takes years. This is the right semantics and is now
measured, not hoped (P198).

**Chain attrition.** Verbatim-field survival across serial reproduction:
`(1−level_frac)^n` → hop 2: 49%, hop 3: 34%, hop 5: 17%. Fifth-hand
accounts carry roughly one-sixth of original verbatim content — the
rest is gist + confabulation. Matches the Bartlett/Kashima qualitative
picture; the number is now in the registry as P199.

## 21. Composite observables — the stiff directions made concrete

§4's sloppy-model audit said behavior constrains stiff *combinations*.
Here they are, named, closed-form where possible — implementers tune
these, not the raw params:

| composite | formula | spec defaults | what it IS |
|---|---|---|---|
| episodic half-life | `t½ = τ(2^(1/β)−1)` | 3.6d | one number per decay class; if t½ is right, the curve is right at every horizon (power-law self-similarity) |
| semantic half-life | same | 930d | ~2.5 years — semantic outlives the sim |
| archive half-life | `t_arch = τ((thresh·2/E)^(−1/β)−1)`·… — just `t_death(E)/2` | ~33d at E=0.6 | days until the median record is unrecoverable |
| rumor hop-half-life | `n½ = ln .5 / ln(1−level_frac)` | 1.94 hops | hops until half the verbatim is gone |
| rehearsal rate | `r_day = retell_base·E·(1+share_k·|affect|)` | ≤0.023/d | the only path to permanence for episodic records |
| canonization lag | `T_canon = canon_thresh / r_day` | 215–1667d | measured, see §20 |
| FOK calibration gap | `E[fok] − P(success)` | ≈ +0.1–0.2 | the "I should know this" surplus — positive by design |
| encoding throughput | `λ_surv = Σ P(E>att_min·…)` | ≤40/d | records surviving to first sleep |

These eight numbers ARE the model's behavior for an outside reader;
two implementations with equal composites are behaviorally equivalent
even if raw params differ. The probe harness should report all eight.

## 22. Noise and distribution semantics — the missing axioms

Every stochastic draw in the spec says `N(0,σ)` or "rolls" without
defining the distribution class. Axioms, all HYPOTHESIS (implementation
law, not psychological claim):

1. **Normal draws are truncated Gaussians.** `N(0,σ)` means sample then
   clamp to ±3σ, then clamp to the field's declared domain. The spec
   never intends a 4σ event; bounded noise keeps P70's invariant
   honest by construction.
2. **Drift step sizes are scaled uniforms**, not normals: each drifted
   field moves by `drift_k·U(0.5,1.5)` toward the schema/prior —
   bounded mutations, mean = drift_k. (A normal step distribution
   would occasionally produce 5σ teleports — "the rent was $4000" —
   that read as bugs, not distortion.)
3. **The RNG is integer-based** (splitmix64 or equivalent): floats are
   derived as `u = int/2^64` — transcendental-free, bit-identical
   across platforms (P68/P69 need this; IEEE exp() is *not*
   guaranteed cross-platform identical but is required nowhere on the
   draw path — exp() appears only in deterministic formula
   evaluation, where ±1ulp differences are below every probe
   tolerance).
4. **opSeq namespace:** `rand(seed_base, charId, worldDay, opTag, i)`
   where opTag is a stable hash of the operator name — adding a draw
   to operator A must not shift every downstream draw of operator B
   (that's what makes probes addable without invalidating goldens).
5. **Correlated draws** (day_mult, encode/retrieval coherence within an
   event) share the first uniform: one draw drives E and θ in the same
   direction — a distracted moment is bad at both ends, per the §2
   attention gate's causal claim.

## 23. New params (spec §7 v2.1 block) — audit-compliant

| param | default | free? | observable |
|---|---|---|---|
| sim_tau_time | 14 | pop | P193 temporal-gradient width |
| place_adj | 0.3 | pop | P193 place-gradient |
| a_cue / a_part / a_fam | 0.4 / 0.45 / 0.15 | pop | P194 decomposition |
| θ_fok / k_fok | 0.5 / 6 | pop | P194 level |
| fok_noise | 0.08 | pop | P194 |
| fok_age_noise | 0.25 | per-char | P195 — "knows less than they feel" trait |
| fok_retry | 0.6 | pop | retry gate |
| jol_fluency | 0.5 | pop | P196 fluency term |
| θ_jol / k_jol | 0.5 / 6 | pop | P196 level |
| jol_bias | 0.0 | per-char | P196 — the chronic under/over-estimator |

11 params, 2 per-character — the metamemory instruments are mostly
population machinery (they're *perceptual* organs; individual variance
lives in calibration, matching the FOK-aging finding that the deficit
is sensitivity, not bias).

## 24. Formal/consistency probes (P193–P200)

- **P193 similarity-mask sensitivity (MUST — structure):** a
  same-week/same-topic/different-people record pair scores above
  `interf_thresh` under `sim_interf` but below `merge_thresh` under
  `sim_merge` — interference without fusion. Name-tier: "Mara"/"Marta"
  beats "Mara"/"Dolores" under `sim_person` at equal featural overlap.
  FAIL if any mask is a no-op.
- **P194 FOK accessibility dissociation (MUST — sign):** across failed
  recalls, `fok` correlates with `partialScore` and `cueMatch_ext` and
  NOT with `accuracy`; phantom/confabulated records produce fok ≥ the
  median of true records. FAIL if fok tracks correctness — that would
  be an oracle, not a feeling.
- **P195 FOK aging split (SHOULD):** older characters' episodic
  `fok`→recognition gamma ≈ chance while semantic-domain fok stays
  calibrated (Souchay 2000; Sacher 2023 meta). Constrains fok_age_noise.
- **P196 JOL inflation (SHOULD):** fluent-but-shallow encodings
  (high attention, low E — lapse/DA/intox) yield `jol − P(recall@30d)`
  > 0.15 while matched unfluent encodings sit near zero; low-jol
  high-stakes records raise `strategy_use` outputs. Constrains
  jol_fluency.
- **P197 census band (MUST — regression):** steady-state N_live ∈
  [0.5, 2]·λ·E[t_death] over 200 sim-days at scripted λ; cap_episodic
  never binds below λ=40. FAIL = caps silently regulating (the
  forgetfulness is supposed to do it).
- **P198 canonization ordering (SHOULD):** T_canon orders by
  talk-frequency not record age: two same-age records, one retold
  weekly, one never — the retold one canonizes; the never-retold one
  stays driftable. Constrains retellCount semantics.
- **P199 chain attrition rate (SHOULD):** verbatim survival across
  n hops ∈ [(1−level_frac−0.05)^n, (1−level_frac+0.05)^n] for n≤5.
  Constrains level_frac.
- **P200 composite conformance (MUST — regression golden):** measured
  t½ per decay class ∈ [0.8, 1.25]·τ(2^(1/β)−1); hop-half-life within
  15% of n½. The eight §21 numbers are the published fingerprint —
  diff against them on any refactor.

## 25. Summary for game-systems

One new pure function (`simOp` + the mask table — replaces nine ad-hoc
call sites, strictly more expressible and no slower), two new output
fields (`fok` on failed/TOT reconstructions, `jol` on encodeEvent —
both hidden/harness-readable), one retry gate on the recall loop,
eight composite observables to publish, five distribution axioms to
honor. Daily-tick added cost: two logistics per failed recall and one
per encode — nil. Whole layer flag-gateable; diff probes P193–P200.

---

# Part IV — v33 deepening pass: the society layer, the cache discipline, and the fitting layer (P322–P333)

Part I pinned order/units/budget, Part II formalized mechanisms,
Part III closed the measurement/numerics holes. What remains informal
is everything that happens *between* characters and everything that
happens *to the spec itself* as it is implemented, fitted, and run
under budget pressure. Concretely: (a) the spec's ops are all
single-character — the world runs 28 at once, and nothing yet says
who encodes a shared event, in what order a dyadic op mutates two
stores, or what "the same day" means when A's tick has run and B's
hasn't; (b) recall inside conversation is a sequential session, not a
function call — anchors chain, common ground accumulates, and nothing
bounds the loop; (c) `beliefStatus` is simultaneously a derived
discretization (§6.7) and a stored field that ops write directly
(§6.6) — a cache without a discipline; (d) the age curves move every
tick, and nothing prevents a param from jumping at a re-anchor in a
way humans don't; (e) nothing says what the substrate does with
malformed input, what to shed when compute runs short, or how anyone
would ever *fit* the ~70 free params. This pass formalizes all of it.
Spec refs are to spec v3.2.

## 26. Society semantics — multi-agent operation order

The spec is written as if memory ops happen one character at a time.
The world executes 28. Missing semantics, now pinned:

### 26.1 Shared-event broadcast — one ledger event, N divergent records

A canonical-ledger event with `participants = [c1..cn]` produces **one
independent `encodeEvent` call per participant**, each with that
participant's own attention/context (self-as-agent vs periphery,
position in the venue, `preparing` state). There is no shared record
and no shared draw — the divergence of witnesses' memories is the
mechanism the whole rumor engine is built on (Loftus 1979 eyewitness
program: same-event reports differ systematically before any
contamination; Bartlett 1932 — the "story" each teller carries was
already their own). Ordering:

- The broadcast batch is **atomic with respect to daily ticks**: no
  `dailyMemoryTick` may interleave inside one event's broadcast. All
  participants encode the event at the same `worldDay`; their first
  consolidation happens at each one's own next sleep tick (sleep
  timing differs — good, that's Jenkins & Dallenbach's variance).
- Character order inside the batch is **sorted charId** — arbitrary
  but fixed, so replay is exact (P68/P324). RNG draws are already
  namespaced per charId (§22 axiom 4), so order affects nothing
  except determinism bookkeeping.
- Non-participant witnesses get the same treatment with
  `attention` from the §2 derivation (0.4 periphery / 0.1 ambient) —
  the "crowd saw it" channel that feeds §6.26 transplants and §6.5
  co-witness conformity.

**Cross-tick reads (the "same day" problem).** When A's daily tick has
run for day t and B's hasn't, ops touching both (B's recall cued by
A's retell at tod 0.9) must read **post-tick state for A, pre-tick
for B — each store as it stands**. No read-your-neighbor's-future:
an op may never trigger another character's daily tick as a side
effect. Consequence: `hearAccount` at 23:50 lands on B's day-t store;
B's first decay of that heard content happens at B's own tick —
hearsay gets one free night of pre-consolidation vulnerability like
everything else [HYPOTHESIS — bookkeeping rule, not a claim].

### 26.2 Dyadic transaction order — who mutates first

`retell(A, B, m)` is the only op that writes two stores in one call.
§3.4 already fixed the causal order (speaker's own drift first —
what the speaker now believes is what gets transmitted); this pins
the transaction:

```
retell(A, B, m):
  1. A-side: §6.11 audience tuning mutates m_A (drift, toldTo edge,
     shared_with write, phrasing select) — COMMIT before step 2
  2. §6.12 transmission operators produce account_B (leveling,
     stereotype convergence, phrasing survival)
  3. B-side: hearAccount(B, A, account_B) — adoption, hearCount,
     plist_suppress, SS-RIF on B's records
  4. B-side: disclosure-trust writeback on PersonModel[A] (§6.14)
```

A crash between steps is legal (the story was told, the listener's
encoding may be lost — people mishear), so the substrate must commit
step 1 before attempting step 3; rolling back step 1 on a step-3
failure is a spec violation (A did experience the retell). For
determinism, steps 1–4 all draw under their own charId+opTag
namespaces — `retell` is not one RNG stream, it is two characters'
streams sequenced.

`discussEvent(A,B,ref)` = `retell(A,B,·)` then `retell(B,A,·)` with
the groupSize both sides see, `group_damp` applied per §6.5. The
second speaker's account reads A's *post-step-3* state — A may already
have adopted a B-field inside one exchange [HYPOTHESIS — models
within-conversation convergence, Gabbert et al. 2004].

### 26.3 Society snapshot — a cut across 28 stores

`memorySnapshot` is per-character; the society-level save is

```
societySnapshot = { ledgerDay, ledgerSeq,
                    [charId -> memorySnapshot] sorted by charId }
```

Legal only at a **ledger boundary** — never inside a broadcast batch
or a dyadic transaction (§26.2 step boundary is the finest legal cut).
On load, the world resumes from `ledgerSeq`; per-character `opSeq`
continuation values make the RNG continue exactly (P69 per character
⇒ P325 for the society). Ambient characters may snapshot lazily
(their stores change only on their own ticks — a stale ambient
snapshot IS current until they tick).

## 27. The dialogue-time session loop

`recall` returns reconstructions; conversation is a *sequence* of
recalls coupled by anchors, common ground, and retell selection —
the spec's most-used path and least-specified control flow.

```
conversationSession(members):
  session = { id: rngTag, anchor: null, visited: {}, scansUsed: 0 }
  per turn (speaker S, cue C):
    1. C.temporalAnchor = session.anchor           // contiguity §5.4
    2. recall(S, C, k) → reconstructions; scansUsed++
    3. failed recall with fok > fok_retry → ONE retry scan at
       search_breadth/2; scansUsed++ (§19.1)
    4. anchor ← last successful m.createdDay; visited ∪= {m.id}
    5. if S chooses to retell: §26.2 per listener
    6. session ends when members part OR scansUsed hits
       session_scan_cap (default 2·|members|+2)
  invariants:
    - contiguity never revisits `visited` records — a chain
      A→B→A is impossible; reminiscence walks forward
      (asymmetric as specified, §14)
    - temporalAnchor is session-scoped — never leaks into the
      next conversation or the ambient scan
    - session RNG draws carry opTag = hash("session", session.id)
      — adding a draw inside the session loop never perturbs
      daily-tick streams (§22 axiom 4)
```

Termination is structural: bounded scans per session + the visited
set + anchor monotonicity give a hard loop bound [HYPOTHESIS —
implementation guarantee, psychologically reads as "the conversation
moved on"]. Group attention derivation: each member's `attention` on
an utterance = §2 table (0.8 direct addressee / 0.4 present / 0.1
also-present-and-distracted) × (1 − next_in_line) if preparing —
so in a group of five, the two people not in the conversational
dyad encode the story at periphery quality, and their later
retellings diverge more. That's the microstructure of co-witness
disagreement (Gabbert, Memon & Allan 2003) falling out of the
attention table, not a new mechanism.

## 28. beliefStatus — the cache discipline and the truth-default FSM

§6.7 derives `beliefStatus` at retrieval from `(recollect_q,
believe_p)`; §6.6/§6.3 write it directly. Both are right and they
conflict unless the semantics are pinned:

- **The stored field is a cache, not the authority.** The derived
  pair is authoritative; the stored `beliefStatus` is a
  *write-time cache* consulted by cheap paths (retell selection,
  rumor tagging) that can't afford the derivation. Any op that
  mutates `believe_p` inputs (hearCount, corroboration, verbatim
  strength, source decay) **dirties** the cache: mark `bs_stale`,
  recompute lazily on next read of the status.
- **Hysteresis.** Recomputed status crosses a §6.7 boundary only
  when the new value clears the boundary by `belief_hyst` (0.05)
  — a rumor hovering at believe_p ≈ 0.45 does not flicker
  rumor↔belief across adjacent recalls [HYPOTHESIS; flicker would
  read as instability to the history browser and produces no
  observable human correlate either way].
- **Doubted is sticky.** `beliefStatus:"doubted"` written by the
  §6.6 retraction path is *not* recomputed by the normal
  derivation for `doubt_persist` expected-days — truth-default
  literature (Levine 2014, Truth-Default Theory; Street & Masip
  2015) says doubt, once triggered, is a state with its own
  persistence, not merely low belief. When `doubt_persist`
  elapses, the record re-enters normal derivation — a retracted
  rumor CAN crawl back to "belief" through enough corroboration
  (continued influence meets recovery; cie_residual keeps feeding
  gist meanwhile, unchanged). `doubt_persist` is per-character —
  the "can't unhear it" trait; observable P326.
- **Truth-default at adoption.** A `told_by` field absent any
  trigger (disputed, warned, prior contradiction, implausibility
  < plaus_min) adopts at `truth_default_w` (0.75) — Levine 2014's
  central claim: communication is believed by default and doubt
  requires a trigger; the §6.3 moderator stack *is* the trigger
  list. This relocates the adoption baseline from "suspect then
  maybe adopt" to "adopt unless flagged" — same moderators,
  different null [CONSENSUS for the direction; the 0.75 level is
  HYPOTHESIS calibrated to Gabbert 2003's ~71%].
- **Rejected alternative (for the record):** AGM-style belief
  revision (Alchourrón, Gärdenfors & Makinson 1985) — rational
  contraction/revision operators assume consistency maintenance
  humans demonstrably lack (Johnson & Seifert 1994 continued
  influence). Kept as a design note: the FSM above is deliberately
  *sub*-rational.

Transitions: `rumor → belief|fact` via corroboration-driven
believe_p crossing + hysteresis; `any → doubted` via retraction,
authoritative negativeFeedback (§6.3 Shift), or believe_p < 0.2;
`doubted → derivation` via doubt_persist expiry; `fact` is never
written directly — only the derivation grants it (no op may
assert certainty; even witnessed truth decays through
confidenceInSource first).

## 29. Age-continuity and overlay discipline

`age_eff` moves every tick; params evaluated on it move too. Three
rules, all invariants:

1. **Continuity:** every age-dependent param must be a continuous
   (piecewise-linear at worst) function of `age_eff`. A step
   discontinuity in a param = a bug or an unmodelled event, never
   a curve edge. Knot tables already comply; new knots must too.
   Day-over-day param drift bounded by the curve's own slope —
   probe P329.
2. **States ≠ params:** time-scoped conditions (meno/preg/intox/
   sleepdep/isolation/terminal) enter through `context` overlays
   or event tags, which load multiplicatively ON param outputs.
   They may switch on/off discontinuously (that's what a state is)
   but their *exit* restores the param surface exactly — no
   hysteresis in the parameter layer itself.
3. **Era vs capacity:** era terms (amnesia ramp, bump window) read
   `encodeAge` frozen at record birth; capacity terms (β, θ,
   search_breadth, misinfo_suscept…) read `age_eff` at op time.
   A function reading the wrong one is a spec violation even if
   numerically plausible — P329 mutation-tests this by advancing
   only `worldDay` on a fixed record set.

Rationale: a 70th birthday does not make a character forget
differently at midnight than at 23:59; a menopause overlay ending
does not leave residue on the parameter surface (the SWAN rebound
is *return to trajectory*, Greendale 2009, not a new phenotype).

## 30. Input validation, failure semantics, schema versioning

The substrate sees events from systems it doesn't control. Rules:

- **Scalar out-of-range → clamp to declared domain, log once per
  (field, charId) pair.** Arousal 1.4 encodes as 1.0. Silent
  clamping everywhere would hide world bugs; rejecting would
  corrupt the ledger — clamp+dedup-log is the compromise
  [HYPOTHESIS].
- **NaN/±Inf anywhere → reject the whole op, log, return null.**
  NaN propagation is the one failure mode that silently poisons
  every downstream invariant (P70). Better a dropped memory than
  a NaN rumor that outlives the world.
- **Missing required fields** (event.day, participants on dyadic
  ops, account content) → skip op + log. Missing optional fields
  → defaults per §2 derivation defaults; the substrate never
  invents participant lists.
- **Unknown enum values** → treat as the null/absent case
  (forward-compat: a v4 event field a v3.3 substrate doesn't know
  must degrade, not crash).
- **Schema versioning:** every snapshot carries `specVersion`
  ("3.3"). Migration is a pure function
  `migrate(snap, fromVersion)`: additive fields get their
  defaults (this is why every contract entry says
  "snapshot-additive, default-neutral"), removed fields are
  archived verbatim under `legacy` (never dropped — the history
  browser reads them), changed semantics get a named migration
  branch. An op may never read `legacy` — it's forensic storage.

## 31. Graceful degradation ladder

§5 sized the budget for mains; nothing says what to shed when a
scene spikes (a block-party event with 20 participants and 5
overheard dyads). Shed in order, restore in reverse; each level
names which probes still hold — degradation must never change
*expected* values, only variance and coverage:

| level | shed | probes still required |
|---|---|---|
| L0 | nothing | all |
| L1 | §5.7 involuntary scan for characters not on-screen; FOK retry | all except intrusion-rate probes |
| L2 | interference buckets sampled (catch-up semantics §6) instead of enumerated | P70, P71; PI/merge probes degrade to sampled-tolerance |
| L3 | ambient cadence for off-screen mains (ambient_tick_mult) | census P197 relaxes ×tick_mult |
| L4 | decay+consolidation only — no mints (phantom/transplant/conjunction), no sourceInfer, no merge | boundedness P70, determinism P68 only |

The ladder is *visibility-scoped*: the camera's neighborhood runs
L0–L1, the far block runs L3. A character walking on-screen mid-tick
finishes the tick at its current level and upgrades next tick —
mid-tick level changes would break tick-granularity invariance
(P71). **Rule:** degradation chooses among *documented* modes only;
improvised shortcuts (skipping decay entirely) are spec violations —
the worst a degraded world may do is forget on schedule, never
remember forever for free.

## 32. The fitting layer — parameter recovery, probe statistics, sensitivity

The spec carries ~70 free per-character params and 321+ probes; no
one will ever hand-tune it. This section defines the protocol that
makes it *fittable* — and falsifiable in the technical sense, not
just the vibe.

### 32.1 Parameter-recovery protocol (a probe, not a hope)

A model whose parameters cannot be recovered from its own output is
unfittable — the standard test is parameter recovery on synthetic
data (Nilsson, Rieskamp & Wagenmakers 2011, J. Math. Psychology 55:84
— hierarchical recovery of CPT parameters; Palminteri, Wyart &
Koechlin 2017, TICS 21:425 — model simulation + recovery as the
minimum falsification discipline for computational models).

```
recoveryRun(params_true):
  1. deriveParams → params_true for a test character
  2. scripted 200-day event diet (the P68 script family)
  3. measure the §21 composite observables + probe-level rates
  4. fit params_hat by matching composites (moment matching on the
     8 stiff directions — NOT per-param regression)
  5. PASS if every composite within recov_tol (0.10) of true AND
     each per-char param whose observable is a named probe
     recovers within 20%
```

The sloppy-model audit (§4) predicts step 5 fails for sloppy
directions — that's the point: **params that fail recovery get
frozen to population constants** at the next version, shrinking the
free set to what data can actually see (Gutenkunst et al. 2007).

### 32.2 Probe statistics — n, tolerance, multiple comparisons

Probes assert proportions and orderings; each needs a declared n
and CI rule or the suite is unfalsifiable mush:

- **Proportion probes** report Wilson score intervals (Wilson 1927)
  at 95%; required n: ≥384 draws for ±5% at worst-case p=0.5 —
  cheap probes run ≥400 draws, expensive dyadic probes ≥100 at
  ±10% tolerance and must say so.
- **Sign-locked probes** (MUST — sign) need only n ≥ 60 with
  one-sided binomial rejection of the null direction.
- **Multiple comparisons:** with ~330 assertions, expected false
  positives at nominal α=0.05 ≈ 16 — intolerable for regression
  gating. The suite applies Benjamini–Hochberg at `bh_q` = 0.1
  across each probe *family* (per-version blocks); a probe that
  only fails under BH is flagged flaky, not failed — rerun at 4× n
  before opening a bug (BH 1995, JRSS-B 57:289 — controls FDR
  under arbitrary dependence, the right choice for probes sharing
  a substrate).
- **Golden runs:** P68's deterministic seed family doubles as the
  regression golden; composite fingerprints (§21) are the diff
  surface — refactor equivalence = same fingerprints, not same
  raw params (Palminteri et al. 2017's "fit the behavior, not the
  parameters").

### 32.3 Sensitivity screening — the sloppy-model map, operationalized

Publish which params matter: **Morris-method elementary-effects
screening** (Morris 1991, Technometrics 33:161) over all free
params × the 8 §21 composites — r ≈ 10 trajectories per param is
enough to rank μ* (mean |effect|) against σ (interaction). Expected
output per spec design: ~15–20 stiff params dominate every
composite (β classes, enc_base/att_min, drift_p, misinfo_suscept,
fan_k, level_frac); the long tail is sloppy. Guidance for
world-builder bibles and future memory versions: **new per-char
variance should be allocated to stiff params** — variance spent on
sloppy params is invisible and unverifiable. The screening is a
harness tool, not a runtime cost (P332).

## 33. New params (spec §7 v3.3 block) — audit-compliant

| param | default | free? | observable |
|---|---|---|---|
| belief_hyst | 0.05 | pop | P326 flicker band |
| doubt_persist | 30 (days) | per-char | P326b doubt stickiness — "can't unhear it" |
| truth_default_w | 0.75 | pop | P327 adoption baseline |
| session_scan_cap_base | 2 | pop | P328 turn budget (×members+2) |
| recov_tol | 0.10 | harness | P330 |
| bh_q | 0.10 | harness | P331 |
| probe_n_prop / probe_n_sign | 384 / 60 | harness | P331 |

7 entries, 1 per-character — the society/fitting layer is almost
all population machinery and protocol. `doubt_persist` is the only
trait-shaped dial: how long a trusted correction keeps a record
marked "don't trust this" after the evidence fades.

## 34. Formal/consistency probes (P322–P333)

- **P322 broadcast independence (MUST — structure):** one ledger
  event, n participants → records differ in E/verbatim in
  directions predicted by each participant's attention+params;
  a shared draw (identical records modulo order) is a FAIL.
- **P323 dyadic causal order (MUST — structure):** instrumented
  retell → the transmitted account reflects the speaker's
  *post-drift* record; a pre-drift transmission is a FAIL.
- **P324 tick atomicity (MUST — determinism):** scripted dyadic op
  inside a tick window; no observer ever sees a partially-ticked
  counterparty; replay bit-identical.
- **P325 society snapshot (MUST):** societySnapshot at a ledger
  boundary → resume → same states at t+10 across all 28 stores.
- **P326 status hysteresis (SHOULD):** believe_p oscillating
  ±0.02 across the 0.45 boundary produces ≤1 status change;
  retracted records stay "doubted" for ≈doubt_persist days then
  re-derive.
- **P327 truth-default (SHOULD — sign):** untriggered told_by
  fields adopt at ≥ truth_default_w−0.1; identical fields with a
  trigger adopt below 0.3. Level constrains truth_default_w.
- **P328 session termination (MUST — bound):** no session exceeds
  session_scan_cap scans; anchor chains never revisit `visited`;
  anchor never crosses sessions.
- **P329 age-continuity (MUST — invariant):** over a 10-year
  scripted life, day-over-day |Δparam| bounded by the knot-curve
  slope (+ declared jitter); era-vs-capacity mutation test:
  advancing worldDay on frozen records must not move encodeAge.
- **P330 parameter recovery (SHOULD — falsification gate):**
  recoveryRun passes for all §21 composites within recov_tol;
  per-char params with named-observable probes recover within
  20%; params failing twice get frozen (§32.1 rule).
- **P331 probe statistics (MUST — meta):** every proportion probe
  declares n ≥ its class minimum and reports Wilson CIs; BH at
  bh_q applied per family; flaky-probe protocol documented.
- **P332 degradation equivalence (SHOULD):** L1–L3 runs preserve
  all §21 composite means within recov_tol (variance may grow);
  L4 preserves P68/P70 only — documented, not silent.
- **P333 malformed-input fuzz (MUST — safety):** fuzzed events
  (NaN, out-of-range, missing required, unknown enums) → no NaN
  or range escape anywhere downstream (extends P70), skip/clamp
  log counts match expectations, ledger uncorrupted.

## 35. Summary for game-systems

Nothing new to store, one new stored cache flag (`bs_stale` on
records — or recompute-at-read if cheaper), one new hidden field
(`specVersion` on snapshots, `legacy` archive block), three new
per-op disciplines (broadcast atomicity, dyadic commit order,
session loop bound), one state-machine discipline on beliefStatus,
one validation contract, one degradation ladder, and the fitting
protocol that keeps every future version honest. Runtime cost: a
boolean + lazy recompute — nil. The fitting layer costs harness
time, not game time.

---

# Part V — v45 deepening pass: the transition system, the lifecycle, and the information boundary (P457–P468)

Parts I–IV pinned order/units/budget, formalized mechanisms, closed the
measurement/numerics holes, and gave the society layer its semantics and
fitting protocol. What remains informal is the *type theory of the whole
thing*: (a) the spec's ~25 ops are prose contracts — none declares its
read/write set, its atomicity boundary, or whether it commutes with a
neighbor op, so a parallel implementation cannot be checked for legality;
(b) record legality is scattered across §§4.x/5.x/6.x — "archived records
can resurrect" appears in three places with three phrasings and no single
state machine an implementer can exhaustively test; (c) hidden fields are
governed by one emphatic sentence ("NEVER serialize") — a wish, not a
property; a spec needs the *reason* (which fields may steer behavior vs
which are pure evaluator oracles) and a falsifiable test; (d) a probe has
never been formally defined — it is a predicate over a *distribution* of
runs, and the sloppy-model audit (§4/§32) silently relies on that; (e) the
world owes the substrate guarantees — delivery completeness, tick
at-most-once — that no section states, so a world bug is currently
indistinguishable from a memory bug. This pass formalizes all five. Spec
refs are to spec v4.3. New content is machinery: **no new psychological
mechanism, no new per-character params** — three explicit locked nulls
document the boundary, per the §4 audit rule.

## 36. State space, kernels, and what a probe IS

**Per-character state** `M_c = (Episodic, Semantic, CondTable,
PersonModels, RelEdges, Intentions, params, rngState, clock)`. params are
frozen at `deriveParams` modulo the yearly age re-anchor and overlays —
they are part of state because migration and re-anchoring write them.

**Society state** `S = (ledger, ledgerDay, ledgerSeq, {charId → M_c},
sessionSet)`. The ledger supplies a **total order** extending the world's
partial happens-before: `order(x,y) = (x.worldDay, x.ledgerSeq)` —
Lamport's (1978, CACM 21:558) construction: take the partial order of
causality, extend by any consistent total order (ledger sequence number),
get an ordering every observer agrees on. `worldDay` alone is *not* a
total order (simultaneous events exist); `ledgerSeq` is the tiebreak
already used by §1's arrival-order rule.

**Ops as deterministic transitions.** Every op is a function
`op : (S, input, stream) → (S', output)` where `stream` is the op's
namespaced slice of the seeded RNG (§22 axiom 4). Because the stream is
deterministic given the seed, each op is a **Markov kernel that
degenerates to a function** — the stochasticity lives entirely in the
seed, not in the transition. This is why P68 determinism is a theorem,
not a hope.

**Probe semantics (the missing definition).** A probe `P_n(φ, b)` is a
predicate over the *distribution* of trajectories induced by the seed:
`PASS ⇔ Pr_seed[φ(trajectory)] ≥ b` estimated over ≥ n independent seeds
with the §32.2 statistics (Wilson CIs, BH per family). Sign-locked probes
assert `Pr[sign(effect) = spec] ≥ 1−α`. A probe is **never** a predicate
on one run — a single run passing by luck is the exact failure mode the
statistics layer exists to reject. This definition retroactively
legitimizes every MUST/SHOULD in the registry: they were always
distribution predicates; now the harness knows it.

**Refactor-stability lemma.** Inserting a draw into op A cannot shift
op B's stream because streams are namespaced by `(charId, worldDay,
opTag)` — not by global position. Consequence: probe goldens are stable
under *localized* edits; a refactor that changes B's output without
touching B's code is detectable as an axiom-4 violation (P467).

## 37. The record lifecycle — one FSM, exhaustively testable

Every MemoryRecord occupies exactly one lifecycle state; flags
(`consolidating`, `phantom`, `possessed`, `open`, `doubted`,
`discredited`, `canonized`) are orthogonal annotations, never states.
This replaces the prose scattered across §§4.4, 4.7, 4.11, 5.9, 6.8.

| state | entry | exit | invariant while resident |
|---|---|---|---|
| `proposed` | encodeEvent starts | →`live` on commit; →*none* on abort | invisible to all reads |
| `live` | commit; resurrect | →`archived` (R<forget_thresh at tick step 11); →`dropped` (never direct); semantic→`permastore` | readable by all ops |
| `permastore` | semantic, S≥permastore_thresh, age≥permastore_age | →`archived` only via lesion/migration (never decay) | R frozen; still cues & emits |
| `archived` | R crossing | →`live` ONLY via §4.11 resurrect (maximal-cue: cueMatch_ext>resurrect_thresh); →`dropped` at cap_archive overflow below 0.5·forget_thresh | invisible to normal recall; sourceInfer/dateEstimate still run; merge parts live here |
| `dropped` | archive overflow; legacy purge | — terminal | unreachable by every op; id retained for forensics |

**Guards worth pinning** (the three that were ambiguous):

1. **Merge does not delete.** §4.3 genericization moves the *participants*
   to `archived` (they're the evidence the generic summarizes) — a merge
   must never drop them; dropping is an archive-overflow decision only.
2. **Resurrection is the only `archived→live` edge, and it is
   cue-gated.** No drift, retell, or reconsolidation may touch an
   archived record — a dead memory can be *re-found* but cannot be
   *re-edited* (psychologically: the reconstruction happens on a
   newly-live copy; the archived original is read-only evidence —
   consistent with the §5.5 nonbelieved-memory semantics).
3. **`permastore` freezes R, not the record.** Retrieval, retell, and
   distortion operators still apply — Bahrick permastore is a
   *retention* phenomenon; the content remains reconstructible and
   corruptible (this is why v4.3's reunion probe can still show wrong
   names on recognized faces).

**Op legality by state** (the table implementers fuzz, P458):

| op | proposed | live | permastore | archived | dropped |
|---|---|---|---|---|---|
| recall/scan | — | ✓ | ✓ | resurrect-path only | — |
| retell/drift/reconsolidate | — | ✓ | ✓ | — | — |
| merge (as input) | — | sub-salience only | — | — | — |
| interference/RIF | — | ✓ | ✓ | — | — |
| sourceInfer/dateEstimate | — | ✓ | ✓ | ✓ | — |
| resurrect | — | — | — | ✓ | — |
| drop | — | — | — | ✓ | — |

## 38. Op catalog — read/write sets, atomicity, commutativity

The §10 contract, re-expressed as a transition table. `R`/`W` annotate
the caller's own store vs other stores. Classes: **P** pure reader (no
writes incl. accessLog), **W** single-char writer, **D** dyadic (two
stores), **T** tick, **G** global pure.

| op | class | writes | reads foreign state | RNG streams | atomic boundary |
|---|---|---|---|---|---|
| encodeEvent | W | own Episodic + CondTable + PersonModel stub | none (context passed in) | 1 | per call |
| broadcastEvent | W×n | n stores | none | n (one per charId) | whole batch vs ticks (§26.1) |
| recall | W | own (reconsolidation, RIF, accessLog, searchCost out) | none | 1 | per call |
| ambientMemoryScan | W | own | none | 1 | per call |
| retell(A,B,m) | D | A's m THEN B's store | B's store | 2 | commits at §26.2 step boundary |
| hearAccount | W | own | none (account is input) | 1 | per call |
| discussEvent | D×2 | both | both | 2 | two sequenced retells |
| groupRecall | D×n | all members | all members | n | session-scoped |
| imagineEvent/learnOutcome/suppressEvent/closeLoop/feedback/setOverlay | W | own | none | 1 | per call |
| interviewMode/identifyFromSet/swapReport | W | own (session-scoped context) | none | 1 | session-scoped |
| dailyMemoryTick | T | own all stores | none | 1 | per char-day; may not interleave a broadcast |
| rememberIntention | W | own Intentions | none | 1 | per call |
| openLoopUrge/selfReport/consensusEstimate/judgeFrequency | P | none (output only) | none | 0 | per call |
| dateEstimate/orderBefore/conditionedAffect | P | none — **explicitly no accessLog write** | none | 0 | per call |
| deriveParams/migrate | G | new store | none | 0–1 | pure |
| memorySnapshot/societySnapshot | P | none (read+copy) | read-only | 0 | ledger boundary only |
| lesion/sensSweep/tagEvent/answerProbe | harness | own | none | 1 | between ops |

**Commutativity theorem (the scheduler's license).**

- **P∘P commute** trivially. A pure reader also commutes with any writer
  on a *different* character.
- **Ops on disjoint character sets commute.** Proof obligation: no op
  writes foreign state — every cross-character effect travels through
  the ledger or through an explicit D-class call whose ordering is
  pinned (§26.2). This holds by inspection of the table: the W column
  never contains a foreign charId.
- **Same-character op pairs never commute** (recall writes via
  reconsolidation+RIF even when it "only reads"). Per-character op
  queues are serialized — always.
- **Dyadic ops sharing a character serialize in sorted-charId lock
  order** (`dyad_lock_order`): for concurrent `retell(A,B)` and
  `retell(B,A)`, A-side steps of the (A,B) pair run first —
  deterministic, deadlock-free because the order is a total order on
  pairs. Two dyads {A,B} and {C,D} with disjoint members run fully
  parallel.
- **Consequence (P459):** any interleaving that respects per-char
  serialization + dyad lock order is observational-equivalent to some
  sequential run. A parallel scheduler is *legal iff* its outputs equal
  the canonical sequential run — that's the whole correctness
  criterion; no weaker consistency model is permitted because the
  probes were calibrated against sequential semantics.

## 39. The information boundary — non-interference, three tiers

"NEVER serialize hidden fields" is currently enforced by vigilance. The
actual structure is a three-tier information policy — Goguen &
Meseguer's (1982, IEEE S&P pp.11–20) non-interference applied to field
classes, not users:

| tier | name | rule | members |
|---|---|---|---|
| **C** | character-visible | may appear in emissions (Reconstruction fields, reported confidence, beliefStatus, TOT/FOK flags, familiarity tier) | verbatim fields, gist, cueVector, confidence, beliefStatus, valence/arousal tags, tot, fok, searchCost |
| **M** | mechanism | may *steer dynamics* (gate, weight, threshold), never appears as an emitted value | strength, storageS, encodingE, hearCount, retellCount, retrievalCount, lastAccessDay, `possessed`, sleepdep_flag, `open`, `bs_stale`, jol, drift counters, CondEntry internals, param values |
| **E** | evaluator oracle | may steer **nothing**; a pure label for the harness/history browser | `accuracy`, `phantom`, ledger ground truth, true `createdDay`, `legacy` block |

**The property (non-interference, made falsifiable).** For any two
society states S, S′ differing only in E-tier field values, and any op
sequence, the two induced trajectories must produce **identical
emissions and identical C/M-tier states** — tolerance zero, not noise
(`eval_delta_tol = 0`). Concretely: flipping `phantom` or `accuracy` on
a record post-hoc must change *nothing* the character does or says —
P457 mutation-tests exactly this.

Two subtleties the prose never made safe:

1. **M-tier may gate existence, not value.** `possessed` legitimately
   steers behavior (the §6 estrangement discount) — that's why it's M,
   not E. But no emission may *be* the flag ("as a possessed person, I…"
   is a leak; the discount is the only legal symptom).
2. **The §19.1 FOK null is an instance, now promoted to law.** Koriat's
   (1995) finding that FOK is blind to correctness was hand-coded as
   "fok never clamped by accuracy" — under tier-E semantics this isn't a
   rule about FOK, it's the definition of `accuracy`: an oracle field
   that steers anything is a mislabeled M-field and P457 catches it.

This is deliberately *not* security theater — it's the spec's answer to
"how does the history browser read accuracy without contaminating the
simulation?" Answer: E-tier reads are harness-only by construction, and
the probe proves contamination impossible rather than discouraged.

## 40. Invariant taxonomy — specification by invariants

Probes test points; invariants are universal quantifiers over all legal
runs. Each names scope, check point, and enforcing probe:

| id | invariant | scope | checked | probe |
|---|---|---|---|---|
| I1 | all [0,1] fields in range (β-products within clamps) | record/store | every op exit | P70 |
| I2 | hearCount, retellCount, retrievalCount, opSeq monotone nondecreasing | record/store | tick | P461/P463 |
| I3 | createdDay, encodeAge immutable | record | always | P329 |
| I4 | lastAccessDay ≥ createdDay; lastAccessDay ≤ now | record | write | P463 |
| I5 | no op reads worldDay > its call-time now (no future reads) | society | always | P462/P463 |
| I6 | lifecycle transitions ∈ §37 table only; `dropped` absorbing | record | tick | P458/P461 |
| I7 | E-tier fields write-once at mint, mutable only by harness | record | fuzz | P457 |
| I8 | seed+ledger ⇒ unique state | society | replay | P68/P325 |
| I9 | era params read frozen encodeAge; capacity reads age_eff | param | mutation test | P329 |
| I10 | beliefStatus transitions ∈ §28 FSM only | record | write | P326 |
| I11 | emissions contain only C-tier values or mechanism outputs | emission | serializer | P464/P468 |
| I12 | caps bind only at declared thresholds; no silent loss | store | tick | P74/P197 |

I2/I6 are the psychologically loaded ones: monotonicity is what makes
the archive a *history* (you cannot un-hear a rumor — doubt marks it,
the count stays), and absorbing-drop is the only place the model is
allowed true deletion (Landauer: the store is huge but the index is
not — §5).

## 41. The world's side of the contract — delivery obligations

Every prior section specified what the substrate does; nothing said what
the world must guarantee for those semantics to be meaningful. Two-sided
contract — a world violation is a world bug, not a memory miscalibration:

**The world owes:**

- **Broadcast completeness:** every ledger event is delivered to every
  participant + witness within the same atomic batch (§26.1). A dropped
  delivery is a dropped witness — indistinguishable downstream from
  "encoded then forgot," and therefore must be *audited at delivery*,
  not inferred (P462).
- **Per-character order:** a character's ops arrive in ledger order.
  The world may interleave across characters freely (commutativity §38)
  but may never reorder one character's queue.
- **At-most-once ticks:** `dailyMemoryTick(c, day d)` fires exactly once
  per char per crossed day boundary. Double-firing compounds decay —
  scale-invariance (§1) does NOT rescue a duplicated discrete step
  (interference pairs, merges, extinction counters are event-counted).
- **Bounded pending buffer:** events between a character's ops ≤
  `pending_event_cap` (64) — overflow is a degradation-ladder trigger
  (§31), never a silent drop.
- **Snapshot legality:** societySnapshot requests only at ledger
  boundaries (§26.3).

**The substrate owes:**

- Atomicity per §38 table; determinism (I8); tier discipline (I7/I11);
  degradation only via the §31 ladder (no improvised decay-skip);
  malformed-input semantics per §30.

This is what makes a bug report actionable: "character X has no record
of the fire" decomposes into (world) was the event delivered? →
(substrate) was it gated by att_min? → (substrate) did it die same-day?
— three different owners, currently conflated.

## 42. New params (spec §7 v4.4 block) — audit-compliant

| param | default | free? | observable |
|---|---|---|---|
| eval_delta_tol | 0.0 | harness | P457 — zero, not epsilon |
| pending_event_cap | 64 | pop | P462 buffer bound |
| dyad_lock_order | "charId-sort" | pop | P460 |
| reader_pure | {dateEstimate, orderBefore, conditionedAffect, selfReport, judgeFrequency, consensusEstimate, openLoopUrge, snapshot} | pop | P465 |
| accuracy_leak | 0.0 | locked null | P457 — oracle steers nothing |
| phantom_steer | 0.0 | locked null | P457/P458 — label steers nothing |
| future_read_w | 0.0 | locked null | P462 — no future reads, ever |

7 entries, **0 per-character** — the transition-system layer is pure
machinery; the three locked nulls document that oracle visibility,
phantom labeling, and prescience are permanently zero degrees of
freedom, not tunable dials someone might later "improve."

## 43. Formal/consistency probes (P457–P468)

- **P457 oracle non-interference (MUST — zero-tolerance):** run twice;
  mutate `accuracy`/`phantom` on 20% of records between runs → C/M-tier
  state and all emissions bit-identical (eval_delta_tol = 0). FAIL on
  any delta — an oracle that steers is a mechanism mislabeled.
- **P458 lifecycle legality (MUST):** 10⁴ random op sequences; every
  observed transition ∈ §37 table; no op reads `dropped`; every
  `archived→live` traceable to a maximal-cue resurrect.
- **P459 commutativity (MUST — structure):** same-char pure-reader
  pairs swap freely (state hash equal); cross-char op pairs commute;
  a parallel-schedule run equals the canonical sequential run on
  shared seeds. FAIL on divergence — the scheduler violated §38.
- **P460 dyad lock order (MUST):** concurrent retell(A,B)+retell(B,A)
  both complete, result deterministic across replays, A-side drift of
  the sorted-first pair committed before the other's transmission.
- **P461 archive monotonicity (MUST):** archived→live only via
  resurrect; `dropped` absorbing; I2 counters monotone across all
  fuzzed sequences.
- **P462 delivery contract (MUST):** instrumented world feed → every
  participant of every event received an encodeEvent (coverage audit);
  dailyMemoryTick fired once per boundary; no op observed worldDay >
  now (future_read_w = 0).
- **P463 invariant suite (MUST — meta):** I1–I12 checked at op
  boundaries over the fuzz corpus; any unchecked invariant is itself a
  failure (invariants without checks are wishes).
- **P464 serialization audit (MUST):** every briefing/emission/feed
  artifact scanned for M/E-tier field names and value correlations;
  zero hits.
- **P465 reader purity (SHOULD):** `reader_pure` ops produce
  state-hash-identical before/after snapshots (no accessLog, no
  counter) — dateEstimate must not count as rehearsal.
- **P466 trigger completeness (SHOULD):** scripted environment events
  (sleep boundary, locShift, unfocused tick, outcome resolution) each
  invoke their designated op exactly once — never twice, never zero.
- **P467 refactor stability (SHOULD):** add a draw inside op A → op
  B's golden stream bit-identical; probe fingerprints (§21) unchanged.
- **P468 emission typing (SHOULD):** auto-generated field-lineage
  table — every emitted field traces to a C-tier source or a declared
  mechanism output; untraceable lineage = FAIL.

## 44. Summary for game-systems

One state machine to fuzz (§37), one op table to implement against
(§38 — read/write sets are the locking spec), one parallelization
license (commutativity theorem: per-char serialization + sorted dyad
locks is all the ordering you need), one three-tier field policy
replacing the "NEVER serialize" sentence, twelve invariants replacing
scattered correctness hopes, and a two-sided delivery contract so a
missing memory can be assigned to a guilty layer. Zero new storage,
zero new per-char params, zero new psychology — this pass is the
substrate's constitution, and every future mechanism lands on it.

# Part VI — v57 deepening pass: the content algebra, the ensemble layer, and the canonical form (P590–P601)

Parts I–V pinned order/units/budget, mechanisms, numerics, society
semantics, and the transition system. Three holes remain, all of the
same kind — quantities the probes *reference* but nothing *defines*:

(a) **Content mutation has no grammar.** The spec's distortion
mechanics (misinformation merge §6.3, gist abstraction §6.4, audience
tuning §6.11, embellishment, valence drift, merge-participant
archiving, source retagging) are ~15 prose passages. Nothing says
which field tiers a rule may touch, whether "retell may never mint a
verbatim field" is a law or a coincidence, or how an implementer
audits that every content delta has a lawful cause. The probes assert
distortion *rates*; nothing asserts distortion *legality*.

(b) **The kernels never got lifted.** Every prior section is
per-character. But the substrate's purpose is a *society* — rumors
spread, consensus forms, corrections lag. There is no closed-form
prediction for how far a rumor travels, so game-systems cannot tell a
bug from a boring Tuesday. The rumor literature (Daley & Kendall
1965; Maki & Thompson 1973; Sudbury 1985) already solved the
mean-field version of exactly our propagation structure.

(c) **`state hash` is used but undefined.** P459/P465/P467 all say
"state-hash-identical" — no serialization order, float convention, or
hash function is specified, so two honest implementations can produce
different "equal" hashes. And every optimization an implementer will
inevitably want (lazy decay, session batching) is currently a spec
violation by default because no approximation license exists.

This pass is again pure machinery: zero new psychology, zero new
per-character params. The two locked nulls in §49 document the
boundary (verbatim conservation, rewrite auditability).

## 45. The field lattice and the rewrite catalog

### 45.1 Field tiers (content lattice, orthogonal to §39's C/M/E)

Every record field belongs to exactly one **content tier** — this is
about *what kind of content*, not visibility:

| tier | name | members | mutability |
|---|---|---|---|
| **V** | verbatim | literal strings/captures written at commit | write-once at encode; decays (loses entries) only via §4.x decay and ρ_del; **no rewrite rule may create a V field** |
| **G** | gist | reconstructed detail fields (who/what/where specifics), semantic content | full rewrite target: substitute, insert, delete, embellish, merge |
| **K** | schema | slot skeleton, category tags, personSem tier, gist type | rewritten only by ρ_abs (abstraction) and ρ_mrg (merge) |
| **T** | tag | valence/arousal, beliefStatus, src flags, disputed/retracted | drift rules only — bounded monotone steps, never V/G content |
| **M** | meta | strengths, counters, createdDay, accessLog | mechanism fields; §37/§40 invariants; never rewritten by the content catalog |

The psychologically loaded claim is **verbatim conservation**:
verbatim trace is created at encoding and is thereafter a finite,
non-renewable resource — every later surface on the record is
reconstruction or hearsay copy. This is the model's formal version of
the reconstructive-memory consensus (Bartlett 1932; Neisser 1967;
Loftus's post-event literature): the spec already *behaves* this way;
§50's probes make a violation a build error, not a surprise.

### 45.2 The closed rewrite catalog

Every legal mutation of V/G/K/T content is an instance of one rule.
Each rule declares trigger, rate expression (existing params only —
the catalog *indexes* the spec's rates, it adds none), operand tiers,
and postcondition.

| rule | name | trigger (spec §) | operand | postcondition |
|---|---|---|---|---|
| ρ_sub | substitute | misinfo account contested (§6.3) | G-field ← account content | `lastRewrite={ρ_sub, src:accountId}`; V untouched |
| ρ_ins | insert-schema | gist slot empty at reconstruct (confab_fill) | G-field ← schema default | marked confab-sourced in audit |
| ρ_del | elide | field below emit floor at retell/output | G/V entry dropped from emission; field strength decays | emission-only unless decay crosses forget floor |
| ρ_abs | abstract | gist retrieved ≥ gist_abs_thresh (§6.4) | spawns Semantic record; K-slot generalized | source episodic unchanged |
| ρ_ret | retag-source | source.confidenceInSource decay (§6.4) | T-field rewrites attribution | content fields untouched |
| ρ_vd | valence-drift | tick/retell drift steps (§11.2 drift_k) | T valence/arousal ±bounded step | |Δ| ≤ drift bound per step |
| ρ_mrg | merge-participant | sub-salience merge (§4.3) | participants → archived; generic K/G spawned | **never drops** (§37); output tier ≤ G |
| ρ_emb | embellish | adopted content retold (§6.3 embellish_p) | G-field ← new detail minted | G only — embellishments are gist-tier forever |
| ρ_tune | audience-tune | retell with audience stance (§6.11) | T valence + G selection bias toward stance | bounded by audience_tune per telling |
| ρ_den | deny-rot | speaker denies (§6.95) | G detail decay accelerated (dif_mult) | denied record weakened, src of denial weakened |
| ρ_fab | fabricate | speaker fabricates (§6.95) | new record G-tier with src-flag | src-flag decays; content lives on |

**Grammar invariants** (checked by P590/P591/P600):

- **G1 verbatim conservation.** No rule writes a V field. Post-commit,
  the V multiset is monotone non-increasing (entries lost, never
  gained). A rule emitting V-tier output is malformed by definition.
- **G2 auditability.** Every content delta on a record carries
  `lastRewrite = {rule, day, cause-ref}` — an M-tier audit field,
  never emitted. An untraceable mutation is an implementation bug
  (P590 fuzzes for exactly this).
- **G3 operand legality.** ρ_mrg inputs are `live` sub-salience only
  (§37 table); ρ_sub never operates on V; ρ_emb outputs G only.
- **G4 bounded tags.** T-tier moves are bounded monotone steps —
  valence cannot jump neutral→extreme in one tick; beliefStatus moves
  only via the §28 FSM.

This is not a new mechanism — it is the spec's distortion prose
recompiled into a rewrite system so that "the memory changed
illegally" becomes a decidable predicate. The psychological
justification that retellings *rewrite* (rather than annotate) is
Hirst & Echterhoff 2012 (*Annu Rev Psychol* 63:55 — conversational
remembering reshapes speaker memory: SS-RIF, audience tuning, social
contagion) and Higgins & Rholes 1978 (*JESP* 14:363 — saying-is-
believing: the tuned message becomes the remembered content).

## 46. The ensemble layer — society-level predictions

### 46.1 The rumor contact process

A rumor is a record content-hash `h` propagating through the contact
graph (world supplies encounters). Define per-encounter transmission:

```
p_tx(A→B) = P(A holds live h-record) · P(A emits h | retrieved, session)
            · P(B encodes hearsay) · p_adopt(B | account)
```

All four factors are existing kernels (retrieval drive §3.2, retell
emission §6.x, hearsay encode §6.3 gate, adoption §6.3–6.5). The
ensemble object is `K(t)` = number of characters holding a live
h-record at day t — three subpopulations, Maki–Thompson (1973)
structure:

- **Ignorant** — no h-record.
- **Spreader** — live h-record, retell drive above emission floor.
- **Stifler** — record dead/archived, or holder stifled by contact
  with a knower (interest loss — the DK/MT removal channel maps to
  our `hearCount` saturation + retell-drive decay on known-knowns).

### 46.2 Mean-field prediction (the calibrator's license)

Under homogeneous mixing (encounter rate κ/day, mean transmission
p̄_tx, mean live-window τ_survive days):

```
R_eff = κ · p̄_tx · τ_survive      // reproduction number
final never-hear fraction → ~0.203 as N→∞ for the classical
   MT process (Sudbury 1985, J Appl Prob 22:443); on the RW
   contact graph with venue clustering, predicted fraction rises
   by mix_correct — a STRUCTURAL correction, not a fitted knob
```

The ensemble layer's deliverable is a **prediction interval, not a
driver**: run the simulation, measure K(t), compare to the mean-field
band. Agreement within `mix_band` = calibrated society; disagreement
= a bug localized to one of the four factors (P592 decomposes).
**`meanfield_drive` is a locked null** — the mean field predicts,
it never steers; implementing spread *as* the ODE would erase the
per-character heterogeneity that is the entire point.

### 46.3 The Jensen caveat — probes run the joint, not the mean

p_adopt is concave in susceptibility (saturating adoption), and
retrieval drive is convex in record strength at the floor — so

```
E_θ[K(t)] ≠ K(t | E_θ[θ])      (Jensen — strict inequality both
                                directions depending on regime)
```

Consequence: a probe that runs "the average character" N times is
measuring a different quantity than the 28-character parameter joint.
**Ensemble probes MUST sample the full parameter joint** (the
IndivTraits MVN + jitter pipeline), and any mean-param run is a
diagnostic, never a verdict (P593). This is the formal reason
"diversity by design" is not aesthetics: the society-level statistic
is not reachable from any single parameter vector.

### 46.4 Correction dynamics — the lag metric

A trusted correction (§6.6) does not propagate on the rumor's own
channel symmetric to the original: corrections spread on the same
contact process but with `p_tx` degraded by lower retell drive
(corrections are boring) — while the retracted record's influence
persists at `cie_residual`. Define **correction half-life**
`τ_corr` = time for the doubter fraction among knowers to halve.
Predictions: `τ_corr > τ_rumor` (the lie outruns the correction —
the spec's own mechanism implies it); residual influence never
reaches zero (`cie_residual` floor). Both are falsifiable (P597).

## 47. Canonical form and the state hash

P459/P465/P467/P594 all reduce to `hash(S) == hash(S′)`; the hash was
never defined. Canonical serialization:

1. **Key order:** lexicographic by UTF-8 bytes at every map level.
2. **Sets:** sorted by element id before serialization.
3. **Floats:** IEEE-754 double, shortest round-trip decimal
   (Burger & Dybvig 1996 class — the representation where
   read(write(x)) ≡ x bit-exact); `−0` canonicalizes to `+0`; **NaN
   and ±Inf are illegal in state** — a NaN reaching the serializer is
   a domain error (§30), not a hash input.
4. **Integers/enums:** fixed-width, enum → stable string.
5. **Hash:** `hash_algo` (xxh64-class) over the canonical byte stream.
6. **Ordered reductions:** any floating-point sum in spec math
   (simOp weights, β-products, census) is evaluated in **canonical
   order** — sorted operand list, sequential accumulate. FP addition
   is non-associative (Goldberg 1991, *ACM Comput Surv* 23:5;
   Monniaux 2008, *ACM TOPLAS* 30:12 on the unsoundness of
   treating FP as reals); unordered reduction = nondeterminism.

**Two tolerances, sharply separated:**

- `bit-identical` — required within one build/toolchain. Same seed +
  same ledger ⇒ same hash. No epsilon.
- `fp_tol` (1e-12) — permitted ONLY for cross-port comparisons
  (different math libraries, different compilers). A probe run under
  port-comparison mode declares it; P594 pins which is in force.

## 48. The approximation license — the fast/slow split

Every optimization is currently illegal because only the canonical
kernel is defined. The license: an approximation `op̃` of op `op` is
**legal iff** (i) it preserves invariants I1–I12; (ii) it consumes
the identical RNG stream (draw count + namespacing — refactor
stability §36); (iii) on the probe corpus, probe statistics computed
under `op̃` differ from canonical by < `approx_tol` (1e-3) — measured
on the *statistic*, not per-draw.

Declared-legal approximations (the ones implementers will actually
need):

- **Lazy decay materialization:** R computed on read as
  `R_commit · decay(Δdays)` instead of daily stepping — legal iff
  identical within `fp_tol`; the decay function is continuous so this
  is exact modulo float order (which §47 pins).
- **Session batching:** within a conversationSession, tick-time
  effects (drift, decay) may defer to session end — params are frozen
  per-day (adiabatic: the slow variable is constant over the fast
  run), so the deferral is exact, not approximate.
- **Census skip:** dailyMemoryTick's store sweep may sub-sample the
  archive for statistics (not for lifecycle decisions — FSM scans are
  never skippable).

## 49. New params (spec §7 v5.5 block) — audit-compliant

| param | default | free? | observable |
|---|---|---|---|
| canon_float | "r64-shortest" | pop | P594 — float canon rule |
| hash_algo | "xxh64" | pop | P594/P601 |
| fp_tol | 1e-12 | harness | P594/P595 — cross-port only |
| approx_tol | 1e-3 | harness | P596 — statistic-level |
| mix_correct | 0.6 | pop | P592 — venue-clustering lift on the 0.203 asymptote |
| mix_band | ±0.15 | harness | P592 prediction interval half-width |
| verbatim_mint | 0.0 | locked null | P591 — no rule writes V post-commit |
| orphan_rewrite | 0.0 | locked null | P590 — every delta traces to a rule |
| meanfield_drive | 0.0 | locked null | P593 — mean field predicts, never steers |

9 entries, **0 per-character**. The three locked nulls document that
verbatim creation, unaudited mutation, and ODE-driven spread are
permanently zero degrees of freedom.

## 50. Formal/consistency probes (P590–P601)

- **P590 rewrite auditability (MUST):** fuzz 10⁴ op sequences; every
  content delta on every record carries a `lastRewrite` traceable to
  the §45.2 catalog with legal operand tiers. FAIL on any orphan
  (`orphan_rewrite = 0`).
- **P591 verbatim conservation (MUST):** post-commit, the V-field
  multiset is monotone non-increasing; any rule application emitting
  V output = FAIL (`verbatim_mint = 0`). Hearsay copies land G-tier.
- **P592 rumor coverage calibration (MUST — quantitative):** seed a
  rumor in one venue; simulated K(∞)/N falls inside the mean-field
  band `0.797 ± mix_band` corrected by `mix_correct` over ≥200 seeds.
  Decompose failure to one of the four p_tx factors before debugging.
- **P593 Jensen discipline (MUST — meta):** every ensemble probe
  reports the parameter-joint verdict; a mean-param run is logged as
  diagnostic only. FAIL if a registry verdict was computed at
  `E[θ]` (`meanfield_drive = 0` for predictions too).
- **P594 canonical hash (MUST):** serialize→hash equal under field
  insertion-order permutation and set-order permutation; NaN/−0
  rejected at the serializer; within-build runs bit-identical,
  cross-port within `fp_tol`.
- **P595 lazy-decay equivalence (MUST):** materialize-on-read R vs
  daily-stepped R identical within `fp_tol` on the golden corpus;
  lifecycle transitions identical (FSM decisions never flip).
- **P596 approximation license (SHOULD):** each declared `op̃`
  preserves I1–I12 and keeps probe statistics within `approx_tol`;
  RNG stream consumption identical (draw-count parity per opTag).
- **P597 correction half-life (SHOULD — sign-locked):** trusted
  correction halves doubter fraction within `τ_corr` > `τ_rumor`;
  residual influence asymptotes at ≥ `cie_residual`, never 0.
- **P598 transmission decomposition (SHOULD):** from simulated dyad
  data, recover the four p_tx factors (retrieve/emit/encode/adopt)
  within §4 identifiability bounds — a factor that can't be recovered
  is a param that isn't real.
- **P599 stifler extinction (SHOULD):** when `R_eff < 1` (holders'
  records die faster than transmission), the rumor dies out —
  coverage ceiling observed, never sustained spread on dead records.
- **P600 grammar operand legality (MUST):** ρ_mrg never outputs V;
  ρ_sub never reads V as target; ρ_emb writes G only; T-tier steps
  bounded per G4 — fuzz the catalog itself, not just runs.
- **P601 canon round-trip (SHOULD):** deserialize(serialize(S)) ≡ S
  bit-identical including rngState; snapshot→migrate→snapshot is
  lossless on C/M tiers (E-tier oracle fields exempt per I7).

## 51. Summary for game-systems

One rewrite catalog to implement against (§45 — every content change
has a rule name, an operand type, and an audit trail); one ensemble
prediction layer (§46 — Maki–Thompson mean-field gives you the
"is the rumor working?" calibrator, with the Jensen rule that probes
run the 28-character joint, never the average person); one canonical
form making `hash(S) == hash(S′)` decidable (§47 — ordered floats,
sorted keys, illegal NaN); one approximation license so lazy decay
and session batching are legal-by-construction instead of
spec violations you commit quietly (§48). Zero new storage, zero new
per-character params, zero new psychology — the substrate now has a
content algebra and a population-level ground truth to calibrate
against.

# Part VII — v69 deepening pass: the composition algebra, the context lifecycle, and the surface contract (P733–P744)

Parts I–VI pinned ordering, measurement, society semantics, the
transition system, the content algebra, and the canonical form. Three
holes remain, all of the same kind — quantities that are *read*
everywhere but *law* nowhere:

(a) **Modifiers have no composition discipline.** Across §§2–6 the spec
accrues terms onto a handful of shared termini — `θ +=` (stress,
synchrony, self-initiation, stereotype threat, semantic search,
suppression, divided attention…), `E *=` / `E +=` (arousal, self-
reference, generation, enactment, spacing…), `latency_ms ×=` (age, DA,
search-cost…). Each mechanism is locally defensible; the *joint* is
unregulated. Stack the four worst θ penalties on an 85-year-old
evaluative context and θ_eff diverges — an impossible human (real
worst-case recall degrades toward floor, never to certainty-zero on the
strongest memory; the empirical literature's combined-load studies —
Craik et al. 1996 age×DA; Shields et al. 2017 stress×emotion — all
show bounded, sub-additive joint hits). Nothing in the spec currently
*prevents* the divergence, because each modifier was written assuming
it applied alone.

(b) **The context C is a noun, not a process.** Part I §2 defined the
CueContext schema; §41 defined the world's delivery obligations for
*events*. But C's own lifecycle was never specified: how long does a
place cue persist after the character leaves the venue? Which fields
may legally enter C (the oracle problem — a context containing cues
the character never perceived is free retrieval)? How many fields can
C hold? Every call consumes C; nobody defines how C is made.

(c) **The emission→surface map is scattered prose.** Reconstructions
now carry ~15 surface-relevant fields (`reportMode`, `hedged`,
`dayConf`+coarse fields, `tot`, `aff_flash`, `orphan_eval`,
`latency_ms`, `noticed_discrepancy`, `forgiven`…), each with a
dialogue instruction buried in a §10 note or a section tail. There is
no completeness check — an emission field the dialogue layer doesn't
know silently renders as fluent confident speech, which is precisely
the failure mode (unhedged hedged recall, confabulated aff_flash
scenes) the model exists to prevent. "The surface lied about the
memory" must be a decidable predicate.

(d) **Identifiability debt.** Part I §4 audited the ~120 params that
existed at v0.9; ~500 params have been added since, mostly with
implicit identifiability arguments ("P<n> observes this"). The audit
needs a mechanical form: every param must *declare* its signature
observable and probe, or it doesn't exist.

This pass is again pure machinery: zero new psychology, zero new
per-character params. The four locked nulls in §59 document the
boundary (bounded θ, bounded E, no surface minting, no oracle cues).

## 52. The terminus registry — every modifier has a declared algebra

A **terminus** is a mutable quantity that modifiers target. The spec
has exactly five termini; every param that shifts behavior at call
time acts on one of them:

| terminus | symbol | algebra | bound |
|---|---|---|---|
| threshold | θ (recall θ, resurrect_thresh-relative θ_eff, FOK θ_fok, JOL θ_jol) | saturating-additive | θ_eff = θ + θ_cap·tanh(Σδ_i/θ_cap), θ_cap = 1.2 |
| gain | E (encoding strength terms), S/R boosts | noisy-OR toward 1 | E_eff = 1 − Π_i(1 − g_i) on the gain block — the SAME saturation §5.2 uses for cues; reuse, never a second saturator |
| rate | β multipliers, decay floors, latency multipliers | product, capped | lat_mult_cap = 3.0; per-rate caps declared at definition |
| probability | p_* emission/adoption/flip probabilities | clamp [0,1] last | existing style unchanged |
| flag/enum | beliefStatus, reportMode, mode dispatch | FSM only (§28) | unchanged |

**Composition laws** (checked by P733/P734/P736):

- **L1 saturation.** Σδ_i on a threshold terminus enters through
  tanh — the first penalty costs full price, the fifth is nearly free.
  This is a modeling HYPOTHESIS (no direct human calibration), chosen
  because it is the unique bounded smooth monotone homogeneous rule;
  the empirical requirement is only the SIGN: joint impairment is
  strictly sub-additive in every combined-load study in the corpus
  (Craik et al. 1996; Naveh-Benjamin et al. 2000; Shields et al. 2017).
- **L2 gain saturation.** Gains on E compose by noisy-OR — two "big"
  encoding bonuses never exceed 1, matching the cue rule's precedent
  (Tulving & Osler's principle that redundancy doesn't pay twice).
- **L3 terminus legality.** A modifier may write only its declared
  terminus: `pspeed` touches latency, never θ (existing explicit null,
  P443 — now enforced by registry membership, not comment).
- **L4 dedup.** A modifier instance applies once per call — keyed by
  (modifier id, opTag); double-counting the same § on one call is a
  spec violation even if numerically legal.
- **L5 floor survival.** θ_eff ≥ cap region must still permit the
  strongest records: logistic(k·drive) at max θ shift and strength=1
  stays ≥ `grace_floor` (0.05). The human worst case is *degraded*,
  not *disabled* — this is an axiom of the substrate (a person under
  every load still answers their own name).

Roberts & Pashler 2000 (*Psych Rev* 107:358 — good fits constrain
theory only when the theory can fail) is the methodological warrant:
an unbounded composition space can fit anything, so bounded algebra is
what makes the model falsifiable at all.

## 53. The modifier ledger — the call-time audit field

Every kernel call (`encodeEvent`, `recall`, `dailyMemoryTick`,
`hearAccount`, `retell`) that evaluates a terminus appends to a
per-call `modLedger` (harness tier, M-tier, never serialized into
character-visible state — same discipline as `lastRewrite` in §45):

```
modLedger += {mod:"stress_retrieve_loss", src:"§5.4", terminus:"theta",
              delta:+0.14, context:{stress:0.8, lag:35}}
```

Properties:

- **M1 completeness.** Every effective-parameter deviation from the
  character's base params on that call appears exactly once (P735
  fuzzes — an unexplained θ_eff ≠ base is an orphan, symmetric to
  §45.2's orphan_rewrite).
- **M2 legality.** Each entry's `terminus` matches the modifier's
  declared class in the §52 registry — a "gain" writing θ is malformed.
- **M3 replayability.** Replaying the ledger on the base params must
  reproduce the effective params bit-exactly (§47 float order applies
  — ledger entries record in application order).

The ledger is the missing half of §48's approximation license: the
license says *what* may differ, the ledger says *why* a call differed.
`mod_ledger` (harness flag, default on in validation builds, off
allowed in production for perf) gates whether entries are recorded —
the *math* is identical either way.

## 54. The context lifecycle — C as a decaying state

C is not an argument the world hands in complete form; it is a
substrate-maintained state per character with three legal provenances:

```
C.fields := admitted set, where field f may enter iff
  (a) DELIVERED — present in the current event/context payload
      (world obligation §41), or
  (b) PERSISTED — admitted earlier and still within
      ctx_persist(Δt) = exp(−Δt_min/ctx_tau), rolled per field at
      admission-of-next-context (a left-the-room trace, not a
      permanent cue), or
  (c) INTERNAL — character-state fields (mood, stress, temporalAnchor,
      self-origin elaborations per §5.2 cue ownership); these persist
      while true, not on ctx_tau
```

`ctx_tau` ≈ 30 sim-min — a guess-HYPOTHESIS within the stimulus-
fluctuation tradition (Estes 1955; context-drift forgetting models:
Mensink & Raaijmakers 1988, *J Math Psych* 32:434; the retrieval-side
analog of Howard & Kahana's 2002 drifting context). Persistence is a
*field-level survival roll*, not a continuous weight — a field either
stays in C (full match value) or exits; partial-weight ghosts would
break §5.1's gate semantics.

**Cardinality bound:** `|C.fields| ≤ att_span_ctx` (≈5, HYPOTHESIS —
deliberately near working-memory range, Miller 1956's 7±2 read
conservatively for a *cue* set not an item set). On overflow, fields
are dropped by ascending admission age (internal fields exempt —
mood is always admissible). This is the answer to "why doesn't the
character use every available cue": the cue set itself is capacity-
limited at admission, upstream of §5.2's combination rule.

**The oracle null.** A field that is neither delivered, persisted, nor
internal contributes exactly 0 — enforced at admission, not at match
(§5.1 already enforces at match; admission-side enforcement makes a
*construction* bug detectable rather than silently absorbed). `ctx_oracle`
is a locked null: there is no code path by which an undelivered cue
enters C (P742).

## 55. The surface realization contract — every emission field has a face

`surfMap` is a closed table: emission field combination → required
surface marks + forbidden surface marks. Dialogue generation (game-
systems/world dialogue layer) consumes the emission + this table.
Unknown combination = contract violation (P737), never a silent
default — silence is exactly how "Resting peacefully" happened on the
art side, and the memory surface has the same failure shape.

| emission carries | REQUIRED surface mark | FORBIDDEN |
|---|---|---|
| reportMode:"know" | warm/familiar framing, no episodic detail fields | any scene-particular wording (would mint content the record lacks) |
| hedged:true (forced floor, §5.61) | modal uncertainty ("I think", "maybe") | assertoric wording; hedged → asserted strengthening downstream (Koriat & Goldsmith 1996 — the listener's FOK reads the hedge: Brennan & Williams 1995, *J Mem Lang* 34:237) |
| coarse fields present (whenEstimate era/season) | coarse temporal wording ("early spring") | any exact date; the day field is never surfaced raw |
| tot:true | TOT marker ("right on the tip of my tongue" — Brown 1991, *Psych Bull* 109:204, the canonical phenomenology) | silent omission; a confident wrong name substituted for the blanked one |
| aff_flash:true, content:null | affect expression ONLY ("something about that song") | any scene content — `surf_mint` locked null |
| orphan_eval:true | evaluation-without-warrant form ("I just don't trust him — couldn't say why") | any invented episode (joins `orphan_reason_null` at the surface) |
| noticed_discrepancy:true | OPTIONAL surface (silent tell is legal) | mandatory surface — the character noticed, didn't necessarily say |
| latency_ms ≥ lat_cap | hesitation beat marker in the utterance stream | rendering latency back into confidence/θ (P374's isolation, re-asserted) |
| forgiven:true | intact content + dampened sting | "I don't remember it" |
| phantom:true (record-side) | NO ROW — a phantom flag reaching surfMap is a contract violation, full stop (I7) | everything |

**S1 strengthening ban.** The surface layer may only ever weaken
claim strength relative to emission fields (asserted → hedged is
legal; hedged → asserted is not). Deletion/softening is a ρ_del-class
act; strengthening is a ρ_emb-class act and ρ_emb requires a retell
trigger — the surface is not a retell.

**S2 surf_mint null.** No surface rule may mint content fields the
emission doesn't carry. `content:null` emissions render as
content-free affect; this is the formal version of "the character
feels something, and CANNOT lie about the details because there are
none."

## 56. The identifiability gate — declarations, not vibes

Extend Part I §4's audit to a mechanical registry. Every param in the
§7 MemoryParams block must carry a declaration:

```
paramDecl = {name, class ∈ {stiff, sloppy, locked_null, harness},
             signature: <observable/probe refs>, aliases: [params it
             trades with]}
```

- **stiff** = at least one registered probe's verdict moves outside
  band when the param moves ±1 clamp-step (the Gutenkunst 2007 sloppy-
  directions direction, operationalized).
- **sloppy** = declared trade partner exists (e.g. cue-noise vs
  θ offsets produce identical recall curves) and the probe suite
  knowingly constrains only the combination — legal, but must say so.
- **locked_null** = §7's ~40 named zeros; their declaration is the
  probe that would catch a nonzero value.
- **harness** = pop/harness machinery (this Part's params; §13–14's).

The gate (P743): `deriveParams` refuses a MemoryParams key with no
declaration; the probe registry refuses a param with a declared probe
that doesn't reference it. Undeclared params are unratified — the
formal version of "if nothing measures it, it isn't real."

The companion report (P744): each validation run emits the current
stiff-direction decomposition (top-k eigenvectors of the param→probe-
verdict Jacobian over the 28-character joint). A version that adds 20
params and no new stiff directions is flagged — it added machinery
that changes nothing observable, which is either a bug or a
declaration lie.

## 57. New params (spec §7 v5.18 block) — audit-compliant

| param | default | free? | observable |
|---|---|---|---|
| theta_cap | 1.2 | pop | P733 — saturating θ accumulator scale |
| e_comp | "noisy-or" | pop (enum) | P734 — gain-block algebra |
| lat_mult_cap | 3.0 | pop | P736/P740 — rate-terminus ceiling |
| grace_floor | 0.05 | pop | P736 — worst-case recall floor at θ cap |
| mod_ledger | 1 | harness | P735 — per-call modifier trace |
| ctx_tau | 30 | pop — sim-min | P741 — context field persistence |
| att_span_ctx | 5 | pop — HYPOTHESIS | P741 — C cardinality bound |
| surf_map | "v1" | pop (table ver) | P737/P738/P739 |
| identi_gate | "enforce" | harness | P743 — declaration enforcement |
| theta_unbounded | 0.0 | locked null | P733 — θ shift never diverges |
| e_overbound | 0.0 | locked null | P734 — gains never exceed asymptote |
| surf_mint | 0.0 | locked null | P739 — surface mints no content |
| ctx_oracle | 0.0 | locked null | P742 — undelivered cues contribute 0 |

13 entries, **0 per-character**. The four locked nulls document that
divergent thresholds, over-1 gains, surface-minted content, and oracle
cues are permanently zero degrees of freedom.

## 58. Formal/consistency probes (P733–P744)

- **P733 θ saturation (MUST):** compose the maximal legal penalty
  stack (stress>thresh + lag-window + daLoad=1 + evaluative + off-peak
  + selfinit + sem_search) on an age_eff=85 character; θ_eff ≤ θ +
  θ_cap always; tanh monotonicity holds (`theta_unbounded = 0`).
- **P734 gain saturation (MUST):** compose every E-gain leg
  simultaneously on a maximally-tagged event; E_eff < 1 strictly, and
  adding a further gain is monotone ≤ (`e_overbound = 0`).
- **P735 modifier-ledger auditability (MUST):** fuzz 10⁴ kernel calls;
  every effective-param deviation from base replays through modLedger
  entries bit-exactly; unexplained deviation = FAIL.
- **P736 graceful degradation (MUST — sign-locked):** at maximal θ
  shift, a strength-1 maximal-cue record still recalls ≥ grace_floor
  (0.05) over 10⁴ draws — the substrate degrades, never disables.
- **P737 surface-map completeness (MUST):** enumerate all emission
  field combinations reachable in a 10⁴-run fuzz; every combination
  resolves to a surfMap row or a declared OPTIONAL; unknown = FAIL.
- **P738 hedge direction (MUST — sign-locked):** hedged:true emissions
  surface with modal-uncertainty marks in 100% of cases; surface-
  emitted claims downstream of hedged emissions never enter hearers'
  stores at >hedged strength (S1 propagation).
- **P739 content:null honesty (MUST — locked null):** aff_flash /
  orphan_eval emissions produce zero content-field words on the
  surface across the fuzz corpus (`surf_mint = 0`).
- **P740 latency isolation (SHOULD):** latency_ms ∈ [0, lat_cap·max
  legal mult]; correlation of latency with θ across matched records =
  0 under the registry — latency is a display observable, never a
  retrieval input.
- **P741 context persistence (SHOULD):** a place cue admitted at t
  and undelivered since survives re-match with probability ≈
  exp(−Δt/ctx_tau) ± sampling noise; |C.fields| ≤ att_span_ctx
  invariant across 10⁴ context transitions.
- **P742 oracle null (MUST — locked null):** inject contexts with
  fields never delivered to the character; cueMatch contribution of
  the oracle field = 0 identically (`ctx_oracle = 0`).
- **P743 declaration gate (SHOULD — meta):** registry completeness —
  every MemoryParams key has a paramDecl; every paramDecl's probe ref
  resolves; undeclared param = build error.
- **P744 stiff-direction report (SHOULD — meta):** each validation run
  emits top-k stiff directions of the param→verdict Jacobian on the
  full trait joint; version-over-version new-param/stiff-direction
  parity reported, not gated.

## 59. Summary for game-systems

One composition algebra to implement instead of reading fifty "+="
sites (§52 — five termini, declared algebras, saturated composition;
the spec can no longer produce impossible humans by stacking legal
penalties); one ledger making every call-time deviation explainable
(§53 — the audit twin of §45's rewrite catalog: content deltas got
`lastRewrite`, param deltas get `modLedger`); one context lifecycle
closing the oracle hole (§54 — C is built by the substrate from
delivered/persisted/internal fields, capacity-bounded; the world
cannot hand the character a cue they never perceived); one closed
surface map making dialogue-covers-up-emission a contract violation
instead of an accident (§55); one declaration gate keeping the
parameter file honest as it grows (§56). Zero new storage classes,
zero new per-character params, zero new psychology — the substrate now
has a bound on how wrong a context can make a mind, and a complete
map of what a memory may look like on its way out the mouth.

---

# Part VIII — v81 deepening pass: the anchor corpus, the observable link layer, and the power budget (P859–P870)

Parts I–VII made the spec *internally* implementable — units, schemas,
operator order, lifecycle, algebra, composition, surfaces. What none of
that settles is whether the machine produces a *human*. Spec §14.2
defined an anchor-corpus schema (`{anchorId, statistic, band, source,
design, rep_grade, rep_shrink_applied}`) but shipped **zero rows** —
the spec has been falsifiable in principle and unvalidated in practice.
This part fills the corpus, defines what it means to match a human
statistic (equivalence, not approximation — a sim that is *better* than
human fails), formalizes the latent→observable link layer that every
anchor measurement passes through, and sizes the compute budget so the
corpus is runnable, not aspirational.

Conventions unchanged: strengths/confidences in [0,1]; every claim
tagged **CONSENSUS** / **DEBATED** / **HYPOTHESIS**.

## 60. The observable link layer — strength is never observed

Probes measure a character's *outputs*, never its `strength`. The
spec already treats latent S → observable implicitly at ~a dozen
sites (recall formula §5, latency ad-hoc, conf_out §3). This section
declares the link layer explicitly: there are exactly **three
observable channels**, each a noisy function of latent state, and
nothing else may be read.

```
channels(S_eff, θ_eff, ctx) =
  y   ~ Bernoulli(p_recall)              // the §5 retrieval prob, unchanged
  lat ~ LogNormal(lat_a − lat_b·g(p_recall) + lat_c·θ_shift, lat_σ)
  c   = conf_out(p_recall, fluency, …)   // §3 pipeline, unchanged
```

with `g` the declared link (`obs_link = "logit"`, i.e.
`g(p) = logit(clip(p, ε, 1−ε))`).

- **Recall channel** — `p_recall` is the existing §5 probability;
  no new math, only the declaration that *this is the recall
  observable* (CONSENSUS that recall is the primary observable;
  Tulving & Pearlstone 1966 availability/accessibility split).
- **Latency channel** — weak/interfered memories are recalled
  slowly: cumulative-recall asymptote and rate both track strength
  (Wixted & Rohrer 1994, *Psych Rev* 101:330 — exponential
  accumulation `F(t)=λ(1−e^{−βt})` whose β is the retrieval
  *rate*, our `lat_b` inverse); strength–latency coupling is
  CONSENSUS at the level of monotonicity; the lognormal error
  family is standard for RTs (Ratcliff 1978 is the richer
  alternative — drift-diffusion, overkill here; **HYPOTHESIS** to
  choose lognormal for cost).
- **Confidence channel** — `conf_out` already exists (§3);
  this part adds nothing but the rule that confidence is an
  *output*, not stored truth — the anchor corpus grades
  confidence–accuracy relations on reported `c` only.
- **`obs_noise` (0.08)** — small additive noise on the *measurement*
  side of every channel, distinct from retrieval stochasticity:
  human probe responses carry instrument noise (test-retest
  reliability of memory measures is r ≈ .7–.9, not 1.0 —
  e.g. Wechsler scale reliabilities, CONSENSUS), so sim observables
  must not be deterministic given the latent state or the corpus
  will overfit an instrument humans don't have. **HYPOTHESIS.**
- **Locked null `latent_read_null`**: probes and surfaces may not
  read `record.strength`, `θ`, or any latent field directly —
  only the three channels plus emitted content. A probe that reads
  S to assert about S is measuring the equation, not the behavior
  (the §36 probe-as-kernel formalism already implies this; the null
  makes it a gate).

## 61. The corpus instantiated — 18 anchors

Each row is a §14.2 record. `band` is the sim-side acceptance
interval in the statistic's own units; `pins` names the spec params
the anchor's pass/fail is sensitive to (§63 formalizes the map).
Bands are set ~±(1σ between-study spread) or ±10pp where the
literature reports a range — not ±5% of point value, which no
memory statistic survives.

| id | statistic (sim analogue) | human value | band | rep | design | pins |
|---|---|---|---|---|---|---|
| A01 | savings at 20 min (retention of same-day encoded low-salience items) | .58 | [.45,.70] | RRR | Ebbinghaus 1885; Murre & Dros 2015 replication reproduced the curve | enc_base, beta classes |
| A02 | savings at 24 h | .34 | [.22,.48] | RRR | same | beta classes |
| A03 | savings at 31 d | .21 | [.10,.35] | RRR | same | beta_slow, floor |
| A04 | best-fit retention family | power/exp-power; pure exp rejected | sign | META | Rubin & Wenzel 1996 — 210 datasets, exponential never wins | decay fn form (locked) |
| A05 | mean earliest-memory age, yrs | 3.5 | [3.0,4.2] | MULTI | Tustin & Hayne 2010 grand mean; 49-sample mean 3.69 (Nelson & Fivush 2004) | child offset params (age-development.md) |
| A06 | bump location, older adult | ages 10–30 elevated | decade 2–3 > decades 4–6 | MULTI | Rubin & Schulkind 1997 | bump machinery, encodeAge weighting |
| A07 | misinformation acceptance rate | ~.30 | [.15,.45] | META | Loftus 2005; early designs 30–40% impairment, controlled 10–20% (Ayers & Reder 1998) | misinfo_suscept, cie_residual |
| A08 | implanted-event false memory | ~.30 | [.15,.50] | MULTI | Lindsay et al. 2004 (~30%); range 0% implausible→>50% plausible (Pezdek 1997; Wade 2002) | imagine_gain, source_confuse |
| A09 | DRM false recall, strong lists | ≥.60 | [.40,.75] | META | Stadler, Roediger & McDermott 1999 norms; list range .01–.65 (Roediger, Watson, McDermott & Gallo 2001) | gist/confab machinery |
| A10 | flashbulb consistency advantage | ≈ 0 | |Δ|≤.10 | CONTESTED | Talarico & Rubin 2003 — consistency declines equally; only confidence/vividness stay high | aff_flash legs |
| A11 | flashbulb confidence advantage | > 0 | [+.05,+.35] | MULTI | same | conf_emo_gain |
| A12 | confidence–accuracy r, overall | ≤ .3 | [0.0,.40] | META | Sporer, Penrod, Read & Cutler 1995 (0–.29 overall, ~.41 choosers); Wixted & Wells 2017 pristine-conditions caveat DEBATED | conf_out pipeline |
| A13 | testing effect, 1 wk | .61 vs .40 | Δ∈[.10,.35] | MULTI | Roediger & Karpicke 2006 (exp 2: .61/.40; 5-min reversal .75/.81) | rehearsal/test gain legs |
| A14 | spacing: optimal ISI / RI | ~.10–.20 | [.05,.30] | META | Cepeda et al. 2006 meta (839 assessments); Cepeda et al. 2008 | spacing/distributed-practice legs |
| A15 | RIF impairment, Rp− vs Nrp | ~8–10 pp | [.03,.18] | MULTI | Anderson, Bjork & Bjork 1994; Murayama et al. 2014 meta (durability debated — Storm et al. 2015) | part-list suppression §5.8 |
| A16 | delayed recency | abolished by ~30 s filled delay | sign | META | Glanzer & Cunitz 1966; Murdock 1962 serial position | recency legs |
| A17 | levels-of-processing gain | deep ≈ 2× shallow | ratio∈[1.3,3.0] | MULTI | Craik & Tulving 1975; Craik 2002 | elaboration/depth legs |
| A18 | generation effect | d ≈ .5 | d∈[.25,.75] | META | Bertsch et al. 2007 meta | self-generation legs (§ selfinit) |

Rows deliberately **absent**: sleep-consolidation magnitude
(Diekelmann & Born 2010 META claim weakened by Cordi & Rasch 2021
and later replication failures — DEBATED, kept as a mechanism with
no anchor); eyewitness-specific lineup diagnostics (out of domain);
Bartlett war-of-ghosts reproduction (qualitative, no statistic —
it already grounds §6.12 operators, not an anchor row).

## 62. Equivalence semantics — too good is a bug

Human-anchor matching is **equivalence testing**, not minimization:

- Each anchor asserts `ŝ_sim ∈ band`, evaluated as a two
  one-sided test (TOST, Schuirmann 1987; Lakens 2017 equivalence
  testing for psychological models) at `tost_alpha = .05` with the
  band as SESOI. The sim must be *statistically inside* the band,
  not merely on the right side of zero.
- **Superiority is failure** (`exceed_null` locked): a character
  whose misinformation resistance is perfect (A07 ŝ = .02), whose
  retention is flat, or whose confidence–accuracy r = .9 is not a
  success — it is a database. The corpus is the formal statement
  of the project's core insight: the model must fail where humans
  fail. Every anchor's upper bound is as load-bearing as its lower.
- **CONTESTED rows** (A10) assert the null: the flashbulb
  *consistency* advantage must be ≈ 0 even though the *confidence*
  advantage (A11) must be > 0 — the pair is the Talarico & Rubin
  dissociation and it is exactly the kind of joint constraint a
  hand-tuned model silently violates.
- Sign anchors (A04, A16) need only the qualitative verdict at any
  powered n.

## 63. Anchors → params — the identifiability map, extended

§4 audited which params are free; §32.3 ranked which are stiff.
This map answers the inverse question: **which human facts see
which params**. Rule: an anchor `pins` a param iff a ±20% perturbation
of that param (all else at a reference profile) moves the anchor
statistic by ≥ 25% of its band width — measurable in the harness
(P861 enforces declaration; the sensitivity run computes it).

- **Pinned stiff**: beta classes (A01–A04 pin the whole decay
  family), enc_base (A01 + A17), misinfo_suscept + cie_residual
  (A07/A08 jointly — acceptance needs both a door and a residue),
  the §5.8 suppression legs (A15), recency legs (A16).
- **Pinned weak** (each sees one anchor): bump machinery (A06),
  aff_flash confidence leg (A11 — note the flashbulb *content* legs
  are pinned only by a null, meaning their magnitudes are
  underdetermined: flagged for freeze-review at next audit),
  child-offset params (A05 alone sees them — any childhood-encoding
  param that does NOT move A05 is a candidate for the sloppy set).
- **Unpinned scan**: run the §32.3 Morris screen restricted to the
  corpus; params with μ* ≈ 0 across all 18 anchors and all 8
  composites are formally invisible — freeze to population
  constants per the §32.1 discipline. Expected candidates (guess,
  not result): several of the v5.x emission-shaping pop params.
- **Uncovered anchors**: none of the 18 lack a pin — every anchor
  was chosen to touch live machinery. If a future anchor is added
  that no param can reach, that is a *finding*: the spec lacks a
  mechanism, and the correct response is a mechanism version, not
  a tolerance widening.

## 64. The power budget — what a corpus run costs

Required n per anchor class (Wilson-based, §32.2 conventions):

- **Proportion anchors** (A01–A03, A07–A09, A13, A15): half-band
  ≈ .10 → n ≥ p(1−p)(1.96/.10)² ≈ 100 draws at worst case;
  `anchor_n_min = 100` enforces the floor; tight rows (A10's null,
  band half-width .10 around 0) need n ≥ 200 for adequate TOST
  power (~80%). One scripted scenario yields ~10–40 usable draws
  per character-day → A07 needs ~5–20 character-days of scripted
  misinformation scenes. Cheap.
- **Curve anchors** (A01–A03 jointly, A04): fit in log space over
  ≥ 4 retention decades; the power-family verdict (A04) is a
  model-comparison sign test across the fit residuals — n is
  *retention points*, ~500 encoded low-salience items tracked
  across a 60-day script. This is the single most expensive row.
- **Distribution anchors** (A05, A06): era-density histograms —
  ~300 dated memories per simulated 70-year-old; chi-square against
  the band shape at w = .2 sensitivity needs n ≈ 200 (standard
  chi-square power table).
- **Correlation anchors** (A12): r-band [.0,.40] at ρ≈.2 needs
  n ≈ 150 recall+confidence pairs (Fisher z, two-sided .05).

**Total corpus cost**: one shared 200-day scripted run supplies
A01–A06, A13–A18 (the event diet already exists — P68 family);
A07–A12 need ~4 dedicated scenario scripts (misinformation,
implantation, DRM-style gist lists, flashbulb vs everyday pair).
Budget ≈ 3 harness runs ≈ the cost of one existing probe family.
The corpus is cheaper than the probe suite — no excuse to skip it.

## 65. Replication-grade shrinkage — the discipline of believing less

Not all human values deserve equal trust. `rep_shrink` scales the
*claimed effect* toward its null before the band is placed:

| grade | meaning | shrink |
|---|---|---|
| META | meta-analytic consensus | 1.0 |
| RRR | registered replication survived | 0.9 |
| MULTI | multiple independent labs | 0.8 |
| SINGLE | one lab / one design | 0.6 |
| CONTESTED | replication failed or disputed | assert null band |

Shrinkage widens the *distance the sim must travel* — for an
effect Δ with grade SINGLE the band centers on 0.6·Δ. Rationale:
the replication crisis measured ~36% significant replications with
mean replicated effect ≈ half the original (Open Science
Collaboration 2015, *Science* 349:aac4716 — CONSENSUS that
single-study effects inflate). Anchors are the ground the model
stands on; inflated ground produces inflated humans.

## 66. The holdout protocol — the corpus can be overfit too

With ~70 free params and 18 anchors, moment-matching *will* hit
every band eventually — that's fitting, not validating. Protocol:

- **Split**: `anchor_train_frac = 0.8` — ~14 anchors are
  fittable; ~4 (rotate deterministically by `anchor_set_ver`)
  are **held out**: never shown to any fitting procedure, Morris
  screen, or manual tuning session.
- **Gate**: a validation run reports held-out misses as
  `overfit_flag` entries; ≥ half the held-out rows missing band =
  FAIL at the corpus level regardless of train-anchor pass count.
- **Locked null `anchor_leak_null`**: held-out anchor ids must not
  appear in any fitting-run input manifest; enforced by registry
  lint (P866). The corpus is the exam; you do not get to see the
  held-out questions while tuning.
- Rotating holdout per `anchor_set_ver` bump prevents slow
  memorization across versions.

## 67. New params (spec §7 v5.29 block) — audit-compliant

| param | value | scope | probe |
|---|---|---|---|
| obs_link | "logit" | pop (enum) | P859 — declared latent→recall link |
| obs_noise | 0.08 | pop — HYPOTHESIS | P859 — instrument noise on all channels |
| lat_a | 7.2 | pop — log-ms | P860 — latency intercept (~1.3 s at S→0) |
| lat_b | 0.9 | pop | P860 — strength–latency slope |
| lat_sigma | 0.4 | pop | P860 — lognormal residual |
| conf_scale | 1.0 | pop | P869 — reported-confidence gain |
| conf_bias | 0.05 | pop | P869 — overconfidence intercept (Lichtenstein et al. 1982) |
| anchor_set_ver | "v1" | pop (table ver) | P861/P866 — corpus identity |
| anchor_n_min | 100 | harness | P864 — power floor per anchor |
| tost_alpha | 0.05 | harness | P862 — equivalence level |
| rep_shrink | {META:1,RRR:.9,MULTI:.8,SINGLE:.6} | harness | P865 |
| anchor_train_frac | 0.8 | harness | P866 — holdout split |
| latent_read_null | 0.0 | locked null | P859 — latents unreadable |
| exceed_null | 0.0 | locked null | P862 — superiority is failure |
| anchor_leak_null | 0.0 | locked null | P866 — held-out anchors untouchable |

15 entries, **0 per-character** — the corpus grades the whole
population of characters at once; per-anchor grading by profile
is the §63 sensitivity run, not new params.

## 68. Formal/consistency probes (P859–P870)

- **P859 link completeness (MUST — locked null):** fuzz 10⁴ probe
  evaluations; every observed quantity traces through a declared
  channel (y, lat, c, or emitted content); any direct latent read
  = FAIL (`latent_read_null = 0`).
- **P860 latency monotonicity (MUST — sign):** matched records at
  ΔS = .3 produce mean lat ordered strictly; log-residual σ within
  [0, 2·lat_sigma]; latency never enters retrieval inputs (P740
  already gates the display side).
- **P861 corpus lint (MUST — process):** every anchor row declares
  source, band, rep_grade, ≥1 pinned param, and a design ref;
  unpinned or unsourced row = build error (twin of P743).
- **P862 equivalence gate (MUST — locked null):** inject a
  degenerate perfect-memory config (β→0, misinfo_suscept→0);
  corpus verdict = FAIL on ≥ 6 anchors via upper-band violations
  (`exceed_null = 0`). The suite must be able to catch a database.
- **P863 retention anchors (SHOULD):** scripted low-salience event
  diet on the reference profile; savings-analogue statistics at the
  three anchor delays land in A01–A03 bands simultaneously.
- **P864 power audit (MUST — process):** every evaluated anchor
  reports n; n < max(anchor_n_min, §64 required n) = verdict
  INCONCLUSIVE, never PASS — an underpowered hit is not evidence.
- **P865 shrinkage mutation (SHOULD):** flip A09's grade
  META→SINGLE in a test corpus; the band center moves to
  0.6·Δ automatically; static bands = FAIL.
- **P866 holdout honesty (MUST — locked null):** run the §66
  split; fitting inputs contain zero held-out anchorIds
  (`anchor_leak_null = 0`); held-out miss count reported verbatim.
- **P867 misinformation band (SHOULD):** scripted post-event
  suggestion scenario; pooled acceptance in A07 [.15,.45];
  profile-conditional report (suggs hi/lo) emitted but not gated.
- **P868 bump shape (SHOULD):** a 70-equivalent profile's dated
  autobiographical density shows decade-2–3 mass > decades 4–6
  (A06) AND A05 earliest-recall age in band.
- **P869 confidence–accuracy band (OBSERVE):** overall r in
  [0,.40]; chooser-conditional r > overall; report only —
  the calibration surface is an emergent readout, tuning it
  directly would break A12's diagnostic power.
- **P870 flashbulb dissociation (MUST — CONTESTED pair):**
  matched flashbulb/everyday records: |consistency Δ| ≤ .10 (A10
  null) AND confidence Δ ∈ [+.05,+.35] (A11) — both tails or the
  aff_flash machinery is wrong in a specific, named way.

## 69. Summary for game-systems

Three deliverables: the corpus itself (§61 — eighteen sourced
statistics with bands, the first concrete human numbers the spec
has ever been held to); the link layer (§60 — latents are never
read, only the three observable channels, which is what makes
"the character forgot" and "the probe measured forgetting" the
same claim); and the grading machinery (§§62–66 — equivalence
testing so being too good fails, shrinkage so inflated literature
doesn't inflate characters, a power budget that makes the corpus
cheaper than one probe family, and a holdout so tuning can't
memorize the exam). Zero new per-character params, zero new
record fields, zero new psychology — this part changes what the
spec *owes*, not what it *does*.


# Part IX — v93 deepening pass: the cold start, the intervention calculus, and the population prior (P982–P993)

Parts I–VIII built and graded the machine *as if characters are born
at sim start*. Every probe to date runs a character forward and
measures what it mints. But RW's cast does not start at age zero:
the eight mains are instantiated at 24, 40, 70 — with a bible, a
past, and a memory store that must look like it was *lived*, not
*loaded*. Nothing in Parts I–VIII says where that store comes from,
what it owes the probes, or what it is allowed to claim about the
world. That is the cold-start problem, and it is the largest
unformalized surface left in the spec: get it wrong and every
character either wakes up amnesic (database initialized empty) or
omniscient about their own past (database initialized complete) —
both fail the project's core insight.

The other two gaps are smaller but load-bearing. The probe suite
compares arms ("does trait X change outcome Y") with no declared
intervention semantics and no shared-randomness discipline — a
comparative probe that re-seeds between arms measures noise, not
effect. And the profile layer treats each character's parameters as
independent draws when they are, formally, draws from a population —
with 8 mains the independent-draw model is statistically
indefensible (you cannot estimate ~70 free params per head), and the
ambient 20 need a cheaper discipline still.

This part formalizes all three: §§70–73 the cold start, §§74–75 the
intervention calculus, §§76–77 the population prior. Conventions
unchanged: **CONSENSUS** / **DEBATED** / **HYPOTHESIS** tags; all new
params are pop/harness (the cold start is infrastructure — what a
character *has* is unchanged, only how it got there).

## 70. The cold-start problem — S₀ as a posterior sample

Formal statement. A character is specified by a bible
`B = {traits τ, anchor facts F = {(event_i, age_i, tol_i)},
demographics}` and instantiated at age `a₀`. The spec's forward
model defines a distribution `P(S | lived history, τ)`. The cold
start must produce

```
S₀ ~ P(S | B)   such that   S₀ ≈ P(S | replay(0 → a₀) conditioned on F)
```

i.e. the initial store is a sample from the *same* distribution the
forward model would produce if the character had actually lived
`a₀` years with the declared anchors happening at the declared ages.
This is a posterior-sampling problem (condition on constraints,
sample the rest), not a database import (assert rows). Three
consequences that shape everything below:

- **The store is generated, not authored.** Bibles declare *anchors*
  (graduated 1998, mother died 2015, moved to the building 2019) —
  the load-bearing facts the narrative needs. Everything between
  anchors is sampled from the population's ordinary event diet, and
  most of it is *already forgotten* at mint time. A generated past
  is mostly silence plus the records that survived the same decay
  law as everyone else's. **HYPOTHESIS** (this is the modeling
  commitment itself).
- **A synthesized record is not a special record.** Once minted, a
  cold-start record enters the same lifecycle (Part V §37) as any
  other: it decays, distorts, merges, resurfaces. Humans cannot
  distinguish their own "real" from reconstructed memories — the
  reconstruction IS the memory (Bartlett 1932; Neisser 1981 John
  Dean analysis — confident recall built from gist). The provenance
  flag `synth` may exist in the record's M-tier audit trail but is
  invisible to every behavioral channel (locked null, §73).
- **The past is belief, not history.** A synthesized record is
  inside exactly one head. It mints **no** canonical ledger
  entries, **no** world facts, **no** canonical RelEdges between
  other characters — a synthesized memory of "I lent Marcus $200
  in 2014" is true in Marcus's head only if Marcus's own store or
  the canonical ledger agrees; otherwise it is a *belief* the world
  may contradict. This is the §39 information boundary applied to
  the past: cold-start writes tier-1 (private) state only
  (`past_fact_null`, §73). Design consequence for world-builder:
  bible anchors that must be world-true (shared history between
  mains) are declared canonical by the world layer *before* any
  cold start — the sampler conditions on them, never creates them.

Why this is forced, not optional: the alternative initializations
are named pathologies already banned elsewhere. Empty store =
global retrograde amnesia (a §6 pathology, not a population).
Full-fidelity store = the `exceed_null` database. Hand-authored
records = every character's past is a screenplay — humans do not
remember screenplays, they remember *samples* (Brewer 1988,
randomly-sampled autobiographical events: mundane events dominate
recalled experience; Linton 1982 — her own diary showed the
overwhelming mass of life leaves no retrievable trace).

## 71. Shadow-past replay — the forward route

Route A for mains: actually run the model. `replay(0 → a₀)` is a
degraded forward simulation — same kernels, coarser schedule:

- **Coarse tick.** Daily ticks batch at `shadow_tick_mult` (4.0):
  decay evaluated as R(Δt) over 4-day strides (Part I §1 —
  power-law scale invariance makes this a compute decision, not a
  fidelity loss); interference/merge bucketing unchanged.
- **Sparse diet.** The shadow past does not simulate days — it
  samples an event diet: `shadow_diet_p` (0.6) of a normal day's
  event density, drawn from the ambient event-type distribution the
  spec already assumes (same mixture the probe harness uses for
  the §64 corpus runs). Childhood years sample the child-encoding
  legs (spec §4.35, §4.41–4.43 — `self_ref_eff`, `src_child_mult`,
  the attention gate) automatically because `encodeAge` is on the
  clock; bump years get bump machinery; older years the age-decline
  legs. The replay inherits the whole age stack for free — this is
  the decisive advantage over direct sampling: the era structure
  (A05 earliest memory ~3.5y, A06 bump) is *emergent*, not
  painted on.
- **Anchor imprint.** Each bible anchor `(e_i, age_i, tol_i)` is
  injected as an `encodeEvent` at the declared age with
  `bible_anchor:true` — the event goes through ordinary encoding
  (it can still be forgotten over the remaining replay years; an
  anchor that must be retrievable at `a₀` declares
  `anchor_keep:true` which sets its initial E high enough that the
  residual at `a₀` sits above θ with margin — the anchor is a
  *constraint on the sample*, enforced by rejection: replays where
  a `keep` anchor falls below retrieval are resampled, bounded
  `reanchor_max` = 20 attempts, then flagged).
- **What replay costs.** a₀ = 70y ≈ 25k days ≈ 6k coarse ticks;
  the diet is sparse and most encodes die young — steady-state
  live-store stays ~200–800 records (Part III §20 census). A full
  shadow replay is cheaper than one P68-family probe scenario. The
  whole cast (8 mains) costs less than the anchor corpus.
- **What replay gets wrong.** Diet-distribution mismatch: the
  sampled event diet is the population's, not this life's — a
  character who spent 2010–2019 at sea gets landlocked filler.
  Mitigation: bibles may declare `era_context` spans
  `{ageLo, ageHi, place, occupation}` that tilt the diet's
  place/topic/people mixtures; spans are inputs to the sampler,
  never asserted facts about individual days (same boundary —
  belief-shaped past).

## 72. The era-density sampler — the direct route

Route B for ambients (and for mains when replay is unavailable —
e.g. a mid-sim hire arriving aged 45): sample the store directly
from a fitted era-density model.

```
n_records(era) ~ Poisson(λ_era),  λ_era = base_rate · era_weight(era)
era_weight = recency(Δt) + bump_bonus(era ∈ [bump_lo, bump_hi])
           + anchor_pull(|age − anchor_ages| < tol)
record_type ~ type_mix(era)   // episodic young, semantic/gist old
strength ~ f(decay(Δt), class)  // drawn AT the age-appropriate value
```

where `recency(Δt)` is the expected surviving-record density of the
forward model at lag Δt — derivable in closed form from the Part III
§20 steady-state numerics (mint rate × survival integral under the
power-family decay, A04's locked form). The sampler is the forward
model's *marginal* — it cannot produce the joint structure replay
produces (no reminding chains, no source-confusion clusters, no
schema-merge neighborhoods), which is exactly why ambients get it:
they are thin-AI running the degraded mode already (Part I §6) and
nobody will ever probe their remindings.

- **`era_density_ver` table** pins the numeric era weights +
  type mixtures per version (auditable, versioned like
  `anchor_set_ver`).
- **`era_floor_p` (0.25)** — fraction of surviving distant-era
  records minted directly at permastore class: remote autobiography
  is dominated by rehearsed gist (Bahrick 1984 permastore;
  Conway's "lifetime periods" knowledge — Conway & Pleydell-Pearce
  2000, *Psych Rev* 107:261, CONSENSUS that remote recall is
  knowledge-base reconstruction, not episodic playback).
- Anchors imprint identically to route A (same rejection rule) —
  the two routes agree on constraints and differ only on filler.

Route selection is a *cost* decision declared per character-class
(`synth_route`), never a behavioral difference: the §73 invariants
bind both routes equally. An ambient whose past "matters" is a
design contradiction — promote them to main and rerun replay.

## 73. Synth invariants — what a generated past owes

Whatever the route, S₀ must satisfy five invariants — these are the
contract that makes "cold-started" and "lived" indistinguishable to
every instrument the spec owns:

1. **Anchor indistinguishability** (P982/P986): S₀ passes the
   corpus's age-conditional anchors — a synthesized 70-year-old's
   era density shows A05's earliest-memory distribution and A06's
   bump shape within band, *emergently for replay, by construction
   for density*; both routes are graded by the same anchors, so a
   density-table bug is caught the same way a replay bug is.
2. **`bible_contradict_null` (locked):** no synthesized record may
   contradict a canonical bible fact or ledger fact — not just the
   anchors it conditions on, but *any* canonical fact (a synth
   record asserting the character lived in the building in 2015
   when the ledger shows move-in 2019 is a violation). Fuzzed at
   P983 — the checker is mechanical (field-level consistency vs
   canonical tables), run at mint.
3. **`synth_mark_null` (locked):** the provenance flag is audit-
   only — it may not enter cue vectors, confidence computation,
   latency, or any surface. A probe toggling the flag on identical
   latent content must observe identical channels (P984). A
   character cannot know which of their memories were synthesized
   because *there is no such knowledge* — matching the human case
   where source monitoring cannot separate lived from told-from-
   reconstructed (Johnson, Hashtroudi & Lindsay 1993 source
   monitoring; CONSENSUS).
4. **`past_fact_null` (locked):** cold-start writes private state
   only. Zero canonical ledger rows, zero canonical RelEdges, zero
   SocialMap canonical entries, zero other-characters' PersonModel
   fields (P985). Shared-history anchors are world-declared
   canonicals consumed as *input*; the sampler is downstream of
   canon, never upstream.
5. **Determinism** (`synth_seed_scope = "charId:bibleHash"`): S₀ is
   a pure function of the bible and seed — same bible, same past;
   bible edits re-synthesize only records inconsistent with the
   diff (incremental resynthesis, preserving the Part I §7
   serialization/replay contract).

A sixth property is deliberately **not** an invariant: internal
consistency of the filler. Human autobiographical memory is riddled
with small contradictions (dating errors §11, telescopy; Wagenaar
1986's diary found what/who/where/when cues disagree routinely).
The sampler does NOT cross-check filler records against each other
beyond the canonical-facts bar — perfect internal consistency is
the database smell again. Over-consistency in a generated past is
a defect class to *avoid*, flagged as a design note for the
density-table authors, not probe-gated (HYPOTHESIS — no human
benchmark for "too consistent" exists; the anchors only catch
distributional failure).

## 74. The intervention calculus — do() on the kernel

Every comparative probe ("does X change Y") is an intervention.
Part V defined probes as kernels; this section names the algebra.
There are exactly **five** intervention operators, closed under
composition, applied to the initial-state distribution before the
probe scenario runs:

```
do(setParam, p, v)    — MemoryParams[p] := v  (respects frozen/locked)
do(setTrait, c, t, v) — char c's IndivTraits[t] := v (in-clamp enforced)
do(injectEvent, c, e) — append encodeEvent(c, e) to scenario script
do(setState, c, path, v) — direct record-field write (harness-only;
                          flags the run synthetic)
do(armClock, t)       — shift the sim clock (the "suddenly it is
                        40 years later" operator — legal only in
                        shadow replay and dedicated probes)
```

- **Registry** (`do_ops` enum, §15.5-style gate): a probe that
  mutates state through any other path is a build error (P988) —
  the same discipline as the §52 terminus registry and the §61
  corpus lint. Intervention declarations make probes *auditable
  causal claims*: "Pxxx asserts Y under do(setTrait, suggs, +0.2)"
  is a falsifiable sentence; an undocumented `store[x]=` inside a
  probe script is not.
- **`do(setParam)` on a locked null** refuses at the gate — you
  cannot do() your way around `past_fact_null`; locked nulls are
  the spec's safety rails and the calculus respects them (the
  frozen-vs-free split of Part I already implied this; P988 makes
  it a gate).
- **Borrowed formalism, honest scope:** the `do()` notation echoes
  Pearl's intervention operator (Pearl 2009) — we claim only the
  *mechanical* part (replace a variable's mechanism with a
  constant, propagate through the kernel). No causal-inference
  claims are made: our "identification" is trivially guaranteed
  because we own the data-generating process. The borrowing is
  notational hygiene, not theory.
- **`do(setState)` is quarantined:** it writes latent fields
  directly and therefore produces states the forward model may
  never reach (S and θ jointly impossible under the §5/§10 split,
  e.g. "strength 0.9, source gone, conf 0.99"). Such states are
  legitimate *test fixtures* (probes of retrieval on impossible
  inputs) but must not leak into corpus runs — runs containing a
  `setState` op are tagged `synthetic` and excluded from anchor
  grading automatically (P861's manifest lint extended).

## 75. Common random numbers — the paired-seed discipline

The spec owns its RNG (`rand(seed, charId, worldDay, opSeq)`, Part I
§7 — bit-identical replay). Comparative probes currently get no
further discipline, which means a two-arm trait comparison samples
from

```
Var(Ŷ_A − Ŷ_B) = Var(Ŷ_A) + Var(Ŷ_B)     // independent arms
```

when the paired construction

```
Var(Ŷ_A − Ŷ_B) = Var(Ŷ_A) + Var(Ŷ_B) − 2·Cov(Ŷ_A, Ŷ_B)
```

is available *for free*: run both arms on the same seed — same
event diet, same ambient noise — so the scenario randomness
cancels and only the intervention's effect differs. Common random
numbers are textbook simulation methodology (Law 2015,
*Simulation Modeling and Analysis* ch. 11 variance reduction;
CONSENSUS technique, routinely 5–50× variance reduction on
positively-correlated arms). Rule:

- **`crn_scope = "probe-pair"`:** any probe asserting a *difference*
  between configurations must run arms under CRN — one seed, the
  intervention applied as the only divergence. Deterministic
  divergence point = the `do()` application site.
- **`crn_paired_null` (locked):** a comparative probe manifest may
  not reseed between arms; registry lint (P987) refuses
  unpaired comparative manifests. Single-arm absolute probes
  (anchors, invariants) are exempt — nothing to pair with.
- **Correlation is checked, not assumed:** arms are positively
  correlated only if the intervention doesn't scramble the RNG
  stream order (a `do()` that changes event count shifts
  `opSeq` — post-divergence draws are no longer common). The
  harness reports realized `Cov(Ŷ_A, Ŷ_B)`; a comparative probe
  with negative arm covariance is flagged `crn_broken` — usually
  a symptom the intervention changed scenario length mid-run,
  fixable by restructuring the `do()` site, and a real finding
  when it isn't.
- Consequence for the power budget (§64): paired arms at the same
  n deliver tighter half-widths — the corpus's existing n floors
  stay conservative; nothing needs re-sizing.

## 76. The population prior — traits are draws, not constants

The 8 mains' trait vectors are not 8 independent ~70-dim points —
they are draws from a human population. Formalize the layer the
profile files have used implicitly since v1:

```
τ_i ~ PopPrior(μ_pop, Σ_pop)     // correlated trait moments
p_i  = g(τ_i) + ε_i              // per-char param residuals
```

- **`pop_table_ver = "v1"`** pins `μ_pop`/`Σ_pop` per trait axis
  the spec exposes (age-band moments from the age files; trait
  covariances where the literature reports them — e.g. the
  `suggs`–`checker` negative correlation implied by Gudjonsson's
  compliance/interrogative-suggestibility dissociation, Gudjonsson
  2003; `neurot`–`rumin` positive; `wmc`–`episodic-quality`
  positive, Unsworth 2019). Where no covariance is published the
  table carries 0 — independence is the honest prior, not a
  guessed one.
- **Why it binds:** with 8 mains there is no hope of estimating
  per-character parameter posteriors from observed behavior —
  the profile params are *chosen* (by world-builder from bibles)
  within clamps, and the population prior is the discipline that
  keeps the chosen set *plausible as a sample*: 8 draws should
  not all sit on the same side of `μ_pop`, should not produce a
  trait combination outside the population ellipsoid (P992), and
  should show the declared correlations approximately.
- **James-Stein honesty:** even the *means* of a small cast should
  shrink toward the population center — a cast whose mean suggs
  sits 2σ above the population isn't a discovery, it's a
  sampling/fitting artifact (Efron & Morris 1977; shrinkage is
  CONSENSUS methodology). `pool_k_main` (0.7) and
  `pool_k_ambient` (0.9) set the shrinkage the *fitting* layer
  applies when it ever tunes a profile from behavioral data —
  posterior = `pool_k · MLE + (1−pool_k) · pop_mean` (ridge-
  equivalent; HYPOTHESIS magnitudes, methodology CONSENSUS).

## 77. Partial pooling — the ambient mixture

Ambients formalize as a finite mixture over archetypes:

```
τ_ambient ~ Σ_k π_k · Archetype_k      // k ≤ arche_mix_n (5)
p_ambient  = archetype_mean + residual,  |residual| ≤ (1−pool_k_ambient)·clamp_width
```

- `arche_mix_ver = "v1"` names the archetype table — the existing
  age-band/modifier structure of character-memory-profiles.md
  becomes the formal mixture components (band C young-adult,
  band E older, shopkeeper-social, trauma-history, routine-heavy
  — the §62 example rows are the seeds).
- Ambient profiles are *assigned* deterministically
  (`charId:bibleHash` scope, same as §73.5): the same ambient has
  the same memory personality across runs and rebuilds (P991).
- The residual bound is the whole point: an ambient may deviate
  at most 10% of a clamp width from its archetype — cheap
  differentiation without per-head fitting. A "special" ambient
  is again the promotion signal from §72.
- Mains are not mixture members — they are individual draws
  (§76). The distinction is ontological: mains get bibles,
  ambients get *priors*.

## 78. New params (spec §7 v5.41 block) — audit-compliant

| param | value | scope | probe |
|---|---|---|---|
| synth_route | {main:"replay", ambient:"density"} | pop (enum) | P982 — route declaration per class |
| shadow_tick_mult | 4.0 | pop | P982/P993 — replay tick stride |
| shadow_diet_p | 0.6 | pop | P993 — shadow event-diet fraction |
| bible_anchor_tol_yr | 0.5 | pop | P983 — anchor placement tolerance |
| reanchor_max | 20 | harness | P982 — rejection bound per keep-anchor |
| era_density_ver | "v1" | pop (table ver) | P986 — sampler table identity |
| era_floor_p | 0.25 | pop | P986 — distant-era permastore fraction |
| synth_seed_scope | "charId:bibleHash" | pop | P991 — synthesis determinism scope |
| do_ops | {setParam,setTrait,injectEvent,setState,armClock} | harness (enum) | P988 — intervention registry |
| crn_scope | "probe-pair" | harness | P987 — pairing mandate |
| pool_k_main | 0.7 | pop — HYPOTHESIS | P990/P992 — main shrinkage |
| pool_k_ambient | 0.9 | pop — HYPOTHESIS | P991 — ambient residual bound |
| pop_table_ver | "v1" | pop (table ver) | P990/P992 — prior moments table |
| arche_mix_ver | "v1" | pop (table ver) | P991 — archetype mixture table |
| bible_contradict_null | 0.0 | locked null | P983 — synth vs canon consistency |
| synth_mark_null | 0.0 | locked null | P984 — provenance invisible |
| past_fact_null | 0.0 | locked null | P985 — past writes no canon |
| crn_paired_null | 0.0 | locked null | P987 — comparative arms paired |

18 entries, **0 per-character** — same discipline as Part VIII:
cold start, interventions, and pooling are population-level
infrastructure. The only character-visible artifact is `S₀`
itself, which is indistinguishable from lived state by design.

## 79. Formal/consistency probes (P982–P993)

- **P982 cold-start indistinguishability (MUST):** run the
  corpus's age-conditional anchors on (a) a replay-synthesized
  70yo S₀ and (b) a 70yo whose store was lived forward from 0 —
  same anchor verdicts, era-density histograms within chi-square
  band; keep-anchors retrievable at a₀ post-rejection.
- **P983 the past respects the bible (MUST — locked null):**
  fuzz 10³ bible sets; every synthesized record's canonical-
  checkable fields (place@time, people co-presence, dates vs
  move-in/death anchors) consistent with canon;
  `bible_contradict_null = 0`.
- **P984 the invisible seam (MUST — locked null):** toggle `synth`
  on paired identical stores under CRN; all three observable
  channels + emitted content statistically identical;
  `synth_mark_null = 0`.
- **P985 the past mints no history (MUST — locked null):**
  cold-start any character; canonical ledger delta = ∅, canonical
  RelEdge delta = ∅, other characters' stores untouched;
  `past_fact_null = 0`.
- **P986 synth passes the age anchors (SHOULD):** synthesized
  pasts specifically satisfy A05 (earliest-memory age ∈
  [3.0,4.2]) and A06 (bump decades 2–3 mass > 4–6) — the two
  era-structure anchors, graded on both routes.
- **P987 paired arms or nothing (MUST — locked null):** lint
  every comparative probe manifest — arms share the seed, the
  `do()` site is the sole divergence, `crn_paired_null = 0`;
  realized arm covariance reported; `crn_broken` flags counted.
- **P988 declared interventions only (MUST — process):** static
  scan of probe scripts — all state mutations route through the
  five `do_ops`; locked-null targets refuse `do(setParam)`;
  `setState` marks the run `synthetic` and excludes it from
  corpus grading.
- **P989 intervention locality (SHOULD):** `do(setTrait, A, …)`
  under CRN leaves every other character's store bit-identical —
  interventions respect the §39 information boundary.
- **P990 prior recovery (SHOULD):** fit the hierarchical layer on
  population synthetic data; recovered `μ_pop`/`Σ_pop` within
  tolerance of `pop_table_ver`; per-char posteriors moved
  exactly `pool_k` of the distance from pop-mean to MLE.
- **P991 ambient determinism (MUST):** same `charId:bibleHash` →
  same archetype assignment and residuals across rebuilds;
  residuals within `(1−pool_k_ambient)` bound; ambient profile
  never mutates on a bible-unchanged rebuild.
- **P992 the cast is a plausible sample (SHOULD):** the 8 mains'
  trait vectors: means inside the population ellipsoid at the
  declared Mahalanobis radius, declared Σ_pop correlations
  approximately present, no vector outside `pop_table_ver`
  support — violations are fitting artifacts, not discoveries.
- **P993 cold-start budget (OBSERVE):** report wall-clock +
  record counts for a 70y shadow replay at declared
  `shadow_tick_mult`/`shadow_diet_p` vs the §64 corpus budget —
  no gate; the numbers publish so a future version can tighten
  or relax the diet with evidence.

Registry: P1–P993. v93 suite: P982–P985, P987, P988, P991 MUST
(incl. locked-null probes P983–P985, P987); P986, P989, P990,
P992 SHOULD; P993 OBSERVE.

## 80. Summary for game-systems

Three deliverables. **The cold start** (§§70–73): characters get a
past by *sampling* one — mains by shadow replay of the real kernels
on a sparse diet (the age structure comes out emergent, which is
why replay is worth it), ambients by the era-density marginal —
with five invariants binding both routes: corpus-indistinguishable,
canon-consistent, provenance-invisible, history-silent,
deterministic. The single most important line in this part is
`past_fact_null`: a memory is a private claim about the past, and
a generated memory is a generated *claim* — the world does not owe
it truth. **The intervention calculus** (§§74–75): five declared
`do()` operators are the only way probes may touch state, and
comparative probes must pair arms under common random numbers —
this is what turns "trait X seemed to matter" into a measured
effect. **The population prior** (§§76–77): traits are draws from a
versioned population table with real covariances; fitting shrinks
toward it (`pool_k`); ambients are a 5-archetype mixture with
bounded residuals — the cast is a plausible human sample, and
world-builder's profile choices are graded against that, not just
clamped. Zero new per-character params, zero new record fields,
zero new psychology — like Part VIII, this part changes what the
spec *owes* (a past, an intervention discipline, a population),
not what records *do* once they exist.

# Part X — v105 deepening pass: the exposure discipline, the decade bound, and the audit journal (P1110–P1121)

Parts I–IX formalized the store: how records are born, decay,
merge, cue, distort, surface, and die; how the society version
composes; how probes grade it; how a cast is born with a past.
Three surfaces remain that Parts I–IX *assumed* without
specifying, and all three are places where a correct psychology
can still produce a database-shaped character:

1. **The exposure discipline.** `recall()` (§3.2) returns ranked
   records; somewhere downstream, a brain, a mouth, a briefing, or
   a spectator feed *consumes* them. Parts I–IX never said which
   consumption paths are legal, what a projection may contain, or
   what the act of showing a record does to the records it didn't
   show. Yet the psychology is already in the corpus and it is
   not optional: retrieval practice strengthens the retrieved
   (Roediger & Karpicke 2006 — forgetting-curves §7.2), and the
   retrieval *suppresses its unretrieved competitors* (part-list
   cuing — Slamecka 1968, Roediger 1973; retrieval-induced
   forgetting — Anderson, Bjork & Bjork 1994; output
   interference — Roediger & Schmidt 1980; retrieval-cues §11).
   In the social channel it is stronger still: a listener who
   co-retrieves forgets what the speaker left out (SS-RIF —
   Cuc, Koppel & Hirst 2007; social-memory §6), and two
   characters recounting together recall *less* than their
   pooled stores (collaborative inhibition — Weldon &
   Bellinger 1997; forgetting-curves §32.4). A `recall()` whose
   output is consumed invisibly is a silent read: it strengthens
   nothing, suppresses nothing, and — worst — leaks whatever the
   consumer wants to see. That is the database behavior. The
   exposure discipline closes it.

2. **The decade bound.** §20's census workbook proved the live
   store is self-limiting under a fixed λ — but it stopped at
   the live store. Two growth terms outlive it: `permastore`
   records never decay (Bahrick 1984 — §4.7), so canonization
   is a one-way ratchet accumulating immortal records linearly
   in time; and `archived` records were never given a size or
   field-decay law. Over a 70-year replay (§70) or a 3-year
   live run, are the tails bounded? Nobody has checked. A spec
   that ships without a decade bound bets the whole world on
   an unmeasured integral.

3. **The audit journal.** §38's op catalog declared atomicity
   and commutativity; §47 declared a canonical state hash. But
   nothing yet *connects* a state delta to the ops that caused
   it. When a probe fails at day 214, the only forensic tool is
   diffing snapshots — O(days²) and uninformative inside a tick.
   A hash-chained per-character op journal gives replay
   equivalence, per-delta attribution, and — critically — makes
   the silent-read null (§81) *checkable*: every record read
   that reaches a consumer must appear in the journal.

As in Parts VIII–IX: **zero new psychology, zero new
per-character params, zero new record content fields.** The
psychology cited above is already shipped mechanics
(§5.9 reboost, SS-RIF in `discussEvent`, output interference in
`recall` breadth) — this part formalizes the *contract* that
makes those mechanics unavoidable, plus two infrastructure
layers. CONSENSUS/DEBATED/HYPOTHESIS tags unchanged.

## 81. The silent-read loophole — `reads_through` invariant

**Formal statement.** Define the consumer set
`surf_paths = {self_prompt, utterance, briefing, spectator,
probe}`. Every path by which record content reaches any consumer
outside the memory module MUST route through one declared
operator `present(charId, C, path, budget)`; `present` is the
ONLY legal consumer of `recall` output.

```
  ∀ consumer-visible record field f:
    ∃ op in journal of type present with path ∈ surf_paths
    such that f ∈ projection(present)
  →  silent_read_null = 0            (locked null, P1110)
```

Rationale is not bureaucratic. Three concrete failure modes the
invariant kills:

- **Undeclared practice.** A dialogue system that feeds the
  character's prompt by scanning the store directly gets free
  reboost-free re-exposure — or worse, *accidental* reboost if it
  reuses the retrieval path. Under `reads_through`, every such
  read is a `present` op with a declared `path`, and the
  write-back ledger (§83) prices it. A character whose
  possessions, briefing, and prompt all see the same record
  in one day has now *practiced* it three times — the journal
  shows it; the invisible version never would.
- **Tier violation.** §39's information boundary partitions
  state C/M/E; the exposure paths are where that boundary is
  *crossed on purpose*. `briefing` (possession handoff) and
  `spectator` (viewer feed) are M-tier surfaces that must never
  carry C-tier content (secrets, drama seeds, latent records).
  Routing all five through one operator makes the redaction
  tier (§84) a single audit point instead of five scattered
  filter sites.
- **Probe contamination.** A probe harness that reads records
  directly to compute its statistics *changes the state it
  measures* if the read path shares any reboost logic.
  `path:"probe"` is declared read-only (no write-back, §83) —
  the projection exists so measurement is explicit, and the
  probe's projections are excluded from the character's
  observable channels (P1116 control arm).

**DEBATED/HYPOTHESIS:** whether covert (listener-side) retrieval
should also be a `present` op. Resolution: NO — SS-RIF already
runs inside `discussEvent` on the listener's store (social-memory
§6); making listener covert retrieval a consumer surface would
double-count. `present` covers only paths that *leave* the
module. Covert co-retrieval stays a listener-side mechanism with
its own `attention` scaling.

## 82. `present()` — the projection contract

Signature and order:

```
  present(charId, C, path, budget):
    1. ranked  = recall(charId, C, search_breadth)     [§3.2]
    2. dedup   = collapse ranked by gist_key — first
                 (highest-activation) instance survives;
                 later same-gist records are SHADOWED,
                 not deleted                     [§45.1 fields]
    3. diverse = walk dedup; cap records sharing the
                 same episode_key at present_div_cap;
                 overflow is shadowed
    4. fill    = take first budget units of diverse
    5. project = apply redaction tier(path) field-map
                 [§84]
    6. journal = emit present{path, shown:[ids],
                 shadowed:[ids], suppressed:[ids]}  [§87]
    7. writeback = apply §83 effects to shown ∪
                 suppressed                        [§83]
    return project
```

Contract terms:

- **`budget`** is denominated in *exposure units* (records
  surfaced), default `present_budget_units` = 8 — sized from
  output-interference collapse: recall yield saturates and then
  degrades as output count grows (Roediger & Schmidt 1980;
  Criss, Malmberg & Shiffrin 2011). The brain may ask for more;
  `present` returns at most `budget` and reports `truncated:true`.
  **HYPOTHESIS** sizing: 8 ≈ Miller-class working set, chosen so
  a prompt never drowns in one event — tunable per path, not per
  character.
- **`gist_dedup`** (key `gist_dedup_ver`) prevents the merge
  products of §45's rewrite catalog from double-surfacing: a
  generic + its surviving episodic parent share gist_key; the
  generic wins by activation usually, the parent shadows. This
  is what stops "I remember the time I..." followed by the same
  story told twice in different words.
- **`present_div_cap`** (default 3) is the antagonist-flood
  guard: without it, a hot episode fills the whole budget and
  the character becomes the database that returns "top-k of one
  query". Human recall in a neutral context interleaves —
  temporal contiguity (§14) already biases toward clusters; the
  cap is the *diversity* correction the contiguity walk needs.
- **Determinism.** `present` is pure in `state × C × path ×
  budget × seed`; the CRN discipline (§75) applies — paired
  arms share the projection seed (P1111).
- **`shadowed` vs `suppressed`.** Shadowed records were ranked
  but excluded by dedup/diversity/budget — they receive §83
  suppression (they were competitors). Records never ranked are
  untouched: suppression requires having *competed*, matching
  the RIF dependence on cue-overlap (Anderson et al. 1994 —
  suppression is competitor-specific, not global).

## 83. The write-back ledger — surfacing is a memory event

Every `present` op carries a write-back priced by `path`:

| path | shown records | shadowed/suppressed | rationale |
|---|---|---|---|
| self_prompt | §5.9 reboost (s_gain, lag_mult) — full | `suppress_k` decay on R, episode-bucket only | covert self-retrieval = testing (Roediger & Karpicke 2006) |
| utterance | reboost + retellCount++ (existing §6.11 path) | `suppress_k` on competitors; listener-side SS-RIF unchanged (SM§6) | retelling is the strongest practice |
| briefing | reboost × `brief_prac_mult` (0.3) | none — possessed suspension: store frozen anyway (§6) | briefing is a read, not a remembrance |
| spectator | none | none | the world watches; the character does not practice for viewers |
| probe | none | none | measurement must not perturb — locked |

Mechanics:

- **Suppression target.** `suppress_k` (default 0.02, pop
  scalar — HYPOTHESIS, sized from SS-RIF effect ≈ half of
  speaker RIF; listener legs already priced in SM§6) applies a
  multiplicative R-discount `R *= (1 − suppress_k)` to each
  suppressed record, episode-bucket scoped, once per `present`.
  It is deliberately small: part-list cuing effects are real
  but modest (Slamecka 1968), and the cumulative mechanism —
  a story told often crowds out its neighbors — is the
  emergent phenomenon (the rehearsed anecdote that *replaces*
  the event it was about — Bartlett 1932 schema drift, already
  the merge catalog's semantics; now it has its second edge:
  the untold neighbors fade).
- **`writeback_scope: "episode-bucket"`** — suppression keys
  on the same bucket used by §3.1 interference pairing
  (dominant cue key). Suppression never crosses episodes: a
  character recounting their wedding does not suppress their
  job memories. This is the competitor-specificity axiom of
  RIF (Anderson et al. 1994) made operational.
- **No double counting.** A record both shown and suppressed
  in the same op is impossible by construction (shown ∩
  suppressed = ∅ — dedup happens before write-back).
- **Locked nulls.** `silent_read_null` (§81);
  `probe_writeback_null` — probe-path present emits zero
  write-back (P1120 control); `spectator_practice_null` —
  spectator projections never reboost (the character does not
  know they were watched — Truman-critical: possession ban is
  §7 of the design doc, and the memory layer must not leak
  viewership into strength).

**Why this matters for the core insight:** humans do not
"query" memory; they *retell* it, and every retelling edits
the store. §83 makes the edit mandatory — any surface that
shows a record pays the practice cost and the suppression
cost, so a system that over-surfaces a record literally
wears a groove around it. Database reads are free; human
recall never is. That asymmetry is now in the contract.

## 84. Redaction tiers — the field map

`tier_table_ver` ("v1") declares, per path, which field tiers
pass:

| field class | self_prompt | utterance | briefing | spectator |
|---|---|---|---|---|
| verbatim/gist content | ✓ | ✓ | ✓ (surface only) | ✓ (public events only) |
| affect tags | ✓ | ✓ (shapes phrasing) | ✗ | ✗ |
| `latent:true` / belief C-tier | ✓ (as FOK/tip-of-tongue, never content) | ✗ | ✗ | ✗ |
| `synth` audit flag | ✗ | ✗ | ✗ | ✗ |
| `drama-seed` / secret fields | ✓ (own only) | ✗ unless disclosed | ✗ | ✗ |
| provenance (`told_by` chain) | ✓ | ✓ (attribution hedges) | ✗ | ✗ |

Two axioms:

- **No-invention (locked `no_invent_null`, P1112):** the
  projection contains only fields present in the record —
  `project(m) ⊆ fields(m)` after tier map. An absent field is
  rendered as absence (a gap the dialogue layer may hedge
  around), never filled by the projector. Confabulation is a
  *store* operation (false-memory parts) that happens upstream;
  the projector confabulates nothing. This is the formal wall
  between "the character misremembers" (allowed — it happened
  in the store) and "the rendering misremembers for them"
  (forbidden — that would be the simulator lying).
- **Tier monotonicity:** spectator ⊂ briefing ⊆ utterance ⊆
  self_prompt on every field class — the table above is a
  lattice, and a build that lets `briefing` carry affect tags
  or `spectator` carry C-tier content fails P1113 outright.

The possession-briefing row encodes the design doc §7 rule
("possession never reveals secrets") at the memory layer: the
briefing sees what a *public profile* would show — surface
relationships, routine, disclosed history — never the latent
store. The journal logs `briefing` presents like any other, so
post-hoc audit can prove no secret field ever crossed.

## 85. The decade bound — permastore is a ratchet

§20 sized the *live* store. The two immortalizing sinks need
their own arithmetic.

**Permastore accumulation.** Canonization moves episodic
records to `permastore`-class permanence (§4.7: β→0 at
`permastore_age`/`permastore_thresh`). The influx is the §20
rehearsal rate:

```
  r_canon ≈ λ · P(reaches canon_thresh before death)
          ≤ λ · retell_base·E·(1+share_k·|affect|)·T_cohort
```

With §20's numbers (λ ≤ 40/day, r_day ≤ 0.023), the generous
bound is `canon_day_bound` = 0.3 records/day/capita reaching
permanence (≈2% of the 15/day that survive the week —
HYPOTHESIS bound, probe-measured not asserted). Over a 70-year
life that is ≤ 0.3·25550 ≈ **7,700 permanent records** — versus
Landauer's ~10⁹-bit lifetime estimate this is comfortably
inside budget at ≤1 KB/record (~60 MB equivalent is nothing;
the store is not the constraint). The constraint that *does*
bind is **retrieval dilution**: a 70-year-old with 7,700
permanent + ~800 live records searched by cue-overlap has a
larger denominator. This is already priced — `n_sim` enters
retrieval latency (§5.x latency_ms) and interference pairing —
but P1117 now *measures* the dilution directly rather than
trusting the parameterization.

**Archived-store condensation.** `archived` records still hold
full verbatim fields (never specified otherwise). Decade rule:
at `archive_condense_age` (365 days in archive), an archived
record condenses to a **gist skeleton** — `{episode_key,
affect_tag, era, participants[], valence}` — verbatim fields
dropped, `condensed:true`. The skeleton stays cueable at
reduced weight (`condensed_w` = 0.3) and can still be *named*
("I think I had a teacher like that") but carries no content —
which is exactly the phenomenology of a seventy-year-old
recalling early childhood: the *fact* of the event outlives
the event. Grounding: gist-vs-verbatim longevity is the whole
Fuzzy-Trace result (Brainerd & Reyna — already §45's basis);
Landauer's own estimate implies massive lossy compression is
the norm, not the exception. **HYPOTHESIS:** the 365d constant
and 0.3 weight are priors; P1118 measures, not asserts.

Envelope summary (mains, 70y): live ≤ cap_episodic (2,000 —
burst bound, §20), permastore ≤ ~7.7k, archive-skeletons ≤
`λ·T·condense_frac` bounded by journal. Store stays O(10⁴)
records per head — a size the similarity operator can scan.

## 86. The audit journal — `opLog`

Per-character, append-only, hash-chained:

```
  entry = {seq, day, op, args_hash, reads:[ids], writes:[ids],
           prev_hash} ; chain_hash = H(chain_hash, entry)
```

- **Coverage.** Every §38-catalog op that mutates memory state
  logs one entry; `present` logs even though it is
  read-dominant (its write-back is the mutation). Ops that
  read-and-forget without consumer contact (internal
  maintenance: consolidation pairing, decay pass) log at
  coarser granularity — tick-level digest, not per-record —
  bounded by `oplog_tick_digest:true`.
- **Compaction.** At each `memorySnapshot` boundary the journal
  is compacted to `{anchor: snapshot_hash, tail: entries since
  snapshot}` — `oplog_compact_at:"snapshot"`. Replay from
  snapshot + tail reproduces state identically (P1119);
  compaction is what makes the journal O(days) rather than
  O(lifetime).
- **`oplog_max`** (10,000 entries, harness) is a diagnostic
  ring bound — exceeding it forces a snapshot+compact cycle,
  never silent loss (`oplog_drop_null` locked: a full journal
  that drops entries undigested is a spec violation).

## 87. What the journal buys — replay equivalence and attribution

Two theorems-as-probes:

- **Replay equivalence (P1119, locked `replay_hash_null`):**
  for any snapshot S_t and journal tail J[t..t+n], replaying
  the ops in order (deterministic ops under their logged seeds;
  CRN scope applies) yields state with identical `canonHash`
  (§47). Non-determinism anywhere in the op catalog becomes
  visible as a replay divergence — the journal is the cheapest
  determinism fuzzer the system can run, and it runs free on
  every corpus pass.
- **Attribution completeness (P1120, locked `attrib_null`):**
  `canonHash(S_t+n) ≠ canonHash(S_t)` iff journal tail
  non-empty, and every field-level delta between the two states
  is covered by at least one entry's `writes`. When a probe
  fails ("character should have forgotten X by day 30"), the
  forensic question "which ops kept X alive" is a journal
  query, not a re-run.

And the loop-closer: **`present` entries make the exposure
discipline auditable.** Counting `present{path:spectator}`
against a record's `secret:true` fields across a whole run
proves the tier map held — the §39 boundary moves from
"trusted code" to "checked evidence".

## 88. Interaction notes

- **With §54 (context lifecycle):** `present` consumes C but
  does not extend it — surfacing a memory does not make its
  context "current" (the diner does not become the diner's
  smell). Context renewal stays encode/retrieval-side.
- **With §38 commutativity:** `present` ops on disjoint
  characters commute trivially; same-character `present` ops
  commute only if their shown∪suppressed sets are disjoint —
  declared in the op catalog.
- **With §70 cold start:** shadow replay writes journal
  entries on a `synth:true` journal flag — replay-visible but
  `synth_mark_null`-compliant (the flag is M-tier audit, never
  projected).
- **With §26.2 dyadic order:** in a dialogue tick, speaker
  `present{utterance}` precedes listener covert-retrieval
  write-back — the journal ordering IS the transaction order
  already declared; this just names where it lands.

## 89. New params (spec §7 v5.53 block) — audit-compliant

| param | value | scope | probe |
|---|---|---|---|
| surf_paths | {self_prompt, utterance, briefing, spectator, probe} | pop (enum) | P1110 — consumer whitelist |
| present_budget_units | 8 | pop | P1111/P1114 — exposure budget |
| present_div_cap | 3 | pop | P1114 — per-episode flood guard |
| gist_dedup_ver | "v1" | pop (table ver) | P1111 — dedup key identity |
| suppress_k | 0.02 | pop — HYPOTHESIS | P1115 — shadowed-competitor R discount |
| writeback_scope | "episode-bucket" | pop (enum) | P1115 — suppression scope |
| brief_prac_mult | 0.3 | pop | P1115 — briefing practice fraction |
| tier_table_ver | "v1" | pop (table ver) | P1113 — redaction map identity |
| archive_condense_age | 365 | pop (days) | P1118 — archive→skeleton delay |
| condensed_w | 0.3 | pop | P1118 — skeleton cue weight |
| canon_day_bound | 0.3 | pop — HYPOTHESIS | P1117 — permanence influx bound |
| oplog_max | 10000 | harness | P1121 — ring bound |
| oplog_compact_at | "snapshot" | harness (enum) | P1119/P1121 — compaction trigger |
| silent_read_null | 0.0 | locked null | P1110 |
| no_invent_null | 0.0 | locked null | P1112 |
| spectator_practice_null | 0.0 | locked null | P1116 |
| probe_writeback_null | 0.0 | locked null | P1120 |
| replay_hash_null | 0.0 | locked null | P1119 |
| attrib_null | 0.0 | locked null | P1120 |
| oplog_drop_null | 0.0 | locked null | P1121 |

20 entries, **0 per-character** — the pattern holds: exposure,
growth, and audit are population/harness infrastructure. The
only character-visible artifact is what surfaces — and it was
always supposed to surface through a contract, it just never
had one.

## 90. Formal/consistency probes (P1110–P1121)

- **P1110 the silent read (MUST — locked null):** static scan —
  every module that imports `recall` calls it only inside
  `present`; dynamic check — instrumented counter on record
  field reads vs journal `present` coverage across a 30-day
  society run; `silent_read_null = 0`.
- **P1111 projection determinism (MUST):** same state, C, path,
  budget, seed → byte-identical projection across runs and
  across process restarts from snapshot; gist_dedup collapse
  order stable.
- **P1112 no invention (MUST — locked null):** fuzz 10⁵
  records × all paths: projected fields ⊆ record fields post
  tier-map; absent field never materializes; `no_invent_null`.
- **P1113 tiers hold (MUST — locked null):** across fuzz,
  `briefing` projections contain zero affect/latent/secret
  fields; `spectator` contains zero non-public content; tier
  lattice never inverts. (This is the possession-ban probe at
  the memory layer.)
- **P1114 diversity bound (SHOULD):** over fuzzed ranked sets,
  no episode_key occupies > `present_div_cap` slots; `truncated`
  flag set exactly when fill < ranked-unique count.
- **P1115 the write-back is real (SHOULD):** paired CRN arms —
  surfaced records show §5.9 reboost vs un-surfaced control;
  shadowed same-episode competitors show `R` lower by
  `suppress_k` (±tolerance); briefing path shows
  `brief_prac_mult`-scaled reboost only.
- **P1116 audience-scaled silence (SHOULD):** spectator-path
  present leaves store bit-identical (`spectator_practice_null`
  + `probe_writeback_null`); utterance path in dialogue
  suppresses listener competitors ∝ listener attention — the
  SM§6 SS-RIF legs unchanged, now *counted* via journal.
- **P1117 the decade bound (SHOULD):** 70-year shadow replay:
  permastore count ≤ `canon_day_bound`·T·(1+tol); report
  realized rate + retrieval-latency drift vs day-0 baseline —
  dilution is measured, not assumed.
- **P1118 condensation is honest (SHOULD):** post-condense
  records: skeleton fields present, verbatim absent,
  `condensed:true`; still cueable at `condensed_w`; byte size
  per skeleton ≤ declared bound; skeletons cannot be
  un-condensed or re-verbatimized (one-way).
- **P1119 replay equivalence (MUST — locked null):** snapshot +
  journal tail replay → identical canonHash; run on every
  corpus pass as the free determinism fuzzer.
- **P1120 attribution completeness (MUST — locked null):**
  hash-differing consecutive snapshots ↔ non-empty journal
  tail; every field delta covered by an entry's `writes`;
  `attrib_null = 0`.
- **P1121 journal compaction (OBSERVE):** compact-at-snapshot
  preserves replay equivalence; report journal size/day and
  compaction cadence — no gate, publishes the envelope.

Registry: P1–P1121. v105 suite: P1110–P1113, P1119, P1120 MUST
(six locked-null class — exposure and audit are where a correct
psychology still produces a database if the walls move);
P1114–P1118 SHOULD; P1121 OBSERVE.

## 91. Summary for game-systems

Three deliverables, all contract, no psychology. **The exposure
discipline** (§§81–84): `present()` is the only legal consumer
of `recall()`; every surfacing path is declared (`surf_paths`),
budgeted (`present_budget_units`), deduplicated by gist,
diversity-capped, redacted by a versioned tier lattice
(`tier_table_ver` — the possession ban enforced at the field
level), and priced by write-back — shown records practice,
shadowed competitors suppress. A read that leaves the module
without a `present` op is a spec violation detectable in the
journal. **The decade bound** (§85): permastore is a one-way
ratchet bounded by `canon_day_bound`; archives condense to
gist skeletons at `archive_condense_age` — the store stays
O(10⁴) per head over a full life, and P1117 measures the
retrieval dilution the bound creates. **The audit journal**
(§§86–87): hash-chained per-character op log, compacted at
snapshots, giving replay equivalence (P1119 — the free
determinism fuzzer) and per-delta attribution (P1120) — which
together turn "the character remembered wrong" from a bug
report into a journal query. Zero new per-character params,
zero new record content fields, zero new mechanisms: this part
specifies what the existing machine *owes the outside world* —
an honest surface, a bounded tail, and a legible history.
