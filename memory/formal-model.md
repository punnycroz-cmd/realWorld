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
