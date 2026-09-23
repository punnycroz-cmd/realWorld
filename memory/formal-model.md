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
