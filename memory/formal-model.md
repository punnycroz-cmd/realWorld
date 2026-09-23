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
