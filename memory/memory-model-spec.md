# Memory Model Spec v0.2 — implementable human-like memory for RW characters

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
  "strength": 0.62,                   // current retention R(t), 0..1
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
  "accessLog": []                     // optional debug; may be capped
}
```

- **Episodic** records: specific events (what/where/when). Most records.
- **Semantic** records: decontextualized facts ("Mara is the landlord's friend").
  No `verbatim`; slower decay. Often created by gist abstraction (§7.4).
- **Procedural**: not stored as records — a small skill/affinity map
  (`{skill: level}`) with near-zero decay (R§1). Out of scope for v0 dynamics.
- **Emotional**: affect tags live ON records (above) plus a per-character
  conditioned-associations table `{cue: {valence, arousal}}` that can survive
  the episodic source (Bechara split, R§1): a character can feel dread at a
  doorway without remembering why.

---

## 2. Encoding — birth of a memory

When an event reaches a character (witnessed, heard, done), compute encoding
strength **E ∈ [0,1]** as a weighted geometric-ish blend — multiplicative where
the literature demands a gate, additive elsewhere (R§2):

```
E = E0 · attention · (1 + w_emo·arousal + w_self·selfRelevance
                      + w_nov·novelty + w_pred·predictionError)
    + spacingBonus
```

- `E0` = character base encoding rate (param `enc_base`, ~0.35).
- `attention ∈ [0,1]` — is the event in focus? Ambient/background events get
  attention ≈ 0.1–0.3; inattentional gate: if `attention < att_min` (param),
  **no record is created at all** (R§2 gorilla result).
- `arousal` = event emotional intensity 0..1; `w_emo` param. High arousal also
  sets `peripheralLoss = clamp(arousal · arousal_narrowing)` — verbatim fields
  are thinned at birth (weapon focus, R§2): drop peripheral cueVector entries.
- `selfRelevance` 0..1 — event touches the character's goals/identity/people.
  Strongest single booster (self-reference effect).
- **Stress penalty (new in v0.1):** if `arousal > stress_thresh` (0.8),
  verbatim-field strength at birth is multiplied by
  `(1 − stress_encode_loss)`, default loss 0.31 (Deffenbacher et al. 2004
  meta-analysis, d≈−0.31).
- **Face ceiling (new in v0.1):** verbatim strength for a single-encounter
  stranger's face/appearance is capped at `face_ceiling` (0.67) regardless
  of E (Deffenbacher et al. 2008 — eyewitness identification upper bound).
- `novelty` — distance of event from the character's event schema for its type
  (0 = routine, 1 = unprecedented). Routine repeats get novelty→0 and merge
  instead (§5.3 genericization).
- `predictionError` — |expected − actual| outcome surprise.
- `spacingBonus` — if this event re-activates an existing memory beyond
  `spacing_min_gap` days, boost THAT record (§6.4), don't duplicate.
- **Sleep modifier:** at end of each world day, consolidation pass multiplies
  all same-day `encodingE` by `sleepFactor` (param; poor sleep ≈ 0.7–0.85,
  good ≈ 1.0–1.1). (R§2, R§8.)

Create the record with `strength = E`, `confidence = base_conf(E)`, `accuracy = 1`.

---

## 3. Confidence vs accuracy

Two separate fields, always (R§6). `confidence` starts ~E and is raised by
retellings (+0.05 each, cap 0.98) and by emotional arousal at encoding;
`accuracy` only moves via distortion operators (§7). A character can sit at
`confidence 0.95, accuracy 0.4` — flashbulb pattern.

---

## 4. Decay and interference — the forgetting engine

### 4.1 Trace decay (per tick, e.g. hourly or daily)

Power-law with asymptote (R§3):

```
R(t) = E_adj · (1 + t/τ)^(-β) + floor
```

- `t` = days since lastAccessDay (retrieval refreshes the clock).
- `τ` (scale) and `β` (rate) are params per memory **type** and per character:
  episodic τ≈1.2, β≈0.5; semantic τ≈30, β≈0.2; verbatim fields decay at
  `β·k_verbatim` (k≈2.5) relative to gist.
- `floor` ≈ 0.05·emotional.arousal — strong emotional memories asymptote above
  zero (they never fully die, they go quiet). NOTE (Talarico & Rubin 2003):
  high arousal does NOT change β — flashbulb details decay on the same curve
  as ordinary ones; arousal only raises floor and confidence.
- **Era bonus:** memories whose `cueVector.era` falls in the character's
  reminiscence-bump window (formed at character age 15–25) use `β·0.6`
  permanently (R§7).
- **β_episodic ≈ 0.5 is calibrated**: τ=1.2d, β≈0.47 reproduces Ebbinghaus
  1885 / Murre & Dros 2015 (21% savings @ 31d) for meaningless unrehearsed
  material — the decay floor for episodic content. See
  `forgetting-curves.md` §2.1 and the calibrated retention table §4 thereof.

### 4.2 Interference

When two episodic records share high cue overlap (same place+people+topic,
within Δt window):

```
similarity(a,b) = jaccard(cueVector a, cueVector b)
if similarity > interf_thresh (param, ~0.6):
    each suppresses the other: strength *= (1 - interf_k · similarity)
```

Retroactive: newer memory hits older harder (`interf_k` asymmetric, e.g.
new→old 0.15, old→new 0.05). This is what blurs the 40th identical commute.

### 4.3 Genericization (schema merging)

If `similarity(a,b) > merge_thresh` (~0.8) AND both below salience threshold:
merge into one **generic memory** — keep shared gist ("my morning commute"),
drop both verbatims, `type` stays episodic but flag `"generic": true`.
This is routine-collapse (R§3) and costs almost nothing to run.

### 4.4 Forgetting threshold

`strength < forget_thresh` (param ~0.08) → record is archived, not deleted:
unreachable by normal retrieval, revivable only by a *maximal* cue (someone
narrates the event back). Emotional associations (§1) may outlive the record.

### 4.5 Fading affect

`emotional.valence` magnitude decays toward 0; **negative valence decays
~1.3× faster than positive** (fading affect bias, R§5). Older-adult profiles
raise the asymmetry (positivity effect).

### 4.6 Consolidation window (new in v0.1)

Sleep shields young memories from interference (Jenkins & Dallenbach 1924:
8h asleep → 56.5% vs 8h awake → 46% recall; Murre & Dros 2015's 24h plateau).
A record younger than `consol_window_days` (default 1.0 — hasn't crossed a
sleep tick yet) is **interference-exposed at full rate** (§4.2 applies
normally) but decays only during the sleep tick, at
`consol_beta_mult` (0.5) × its normal β. Effect: day-1 survival is bimodal —
events that reach the sleep tick keep most of their strength; same-day
interference before sleep is what kills them. See `forgetting-curves.md` §2.8.

### 4.7 Permastore transition (new in v0.1)

Semantic records show a discrete two-regime life (Bahrick 1984: items live
0–6 years or >25 years, little in between). At each daily tick, a semantic
record with age ≥ `permastore_age` (180 game days) and strength ≥
`permastore_thresh` (0.25) sets `permastore: true` and freezes decay
(β→0). Well-consolidated world knowledge is effectively permanent; fresh
facts still decay normally. See `forgetting-curves.md` §2.3.

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
sensory age scale:  c_sensory = w_sensory · overlap · (1 + sensory_age_slope
                                  · log1p(m.ageDays/30))         // RC§3 Proust
mismatch penalty:   if a salient sensory field mismatches:
                    cueMatch -= sensory_mismatch_pen (0.05)      // RC§3
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
                 // encoder mood match — small, and ERASED by strong
                 // external cues (Eich meta; Mecklenbräuker & Hager)
```

### 5.4 Retrieval probability

```
drive(m) = cueMatch_ext + moodCongruence + moodStateDep
           + recencyBump(m) + m.strength·w_str − θ
P(recall m) = logistic( k · drive(m) ) / (1 + fan_k · ln(1 + fan(m)))
```

- `fan(m)` = number of OTHER live records sharing m's dominant cue;
  **merged/generic memories (§4.3) count as one fan item** — situation-model
  integration abolishes fan cost (Radvansky et al. 1993). Log divisor per
  ACT-R fits (Anderson & Reder 1999); `fan_k` ≈ 0.4.
- `θ` = retrieval threshold param; `k` = sharpness (~8). Dice roll, not lookup.
- `recencyBump` = `rec_k · exp(−(now − createdDay)/rec_τ)`, rec_τ≈2 days.
- **Archived records** (strength < forget_thresh, §4.4) are reachable only if
  `cueMatch_ext > resurrect_thresh` (≈0.85) — a near-total context
  reinstatement or someone narrating the event back (maximal cue).

### 5.5 What retrieval returns

Not the record — a **reconstruction**:
1. Return `gist` verbatim fields only if `verbatimStrength` survives; else
   regenerate details schema-consistently (confabulation hook §7.2).
2. If `beliefStatus` is `rumor`, return content tagged as uncertain **unless**
   source tag has decayed (§7.3) — then it may be returned as fact.
3. Attach `confidence` for downstream dialogue hedging ("I think…", "I'm sure…").

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
`intrusion_thresh` drops ~0.15 under active stress and for trauma-tagged
records (trauma modifier) — intrusive memory is the same machinery at
pathological gain. Tune so a quiet day yields 2–5 spontaneous recalls per
main character (validation probe P14, RC§8).

### 5.8 Retrieval-induced forgetting and part-list cuing

On successful recall of `m`: for each linked/competing record `n` with
similarity > 0.5 that was NOT recalled, `n.strength *= (1 - rif_k)` (rif_k≈0.05).
Retelling a story forgets the details you skipped (R§3).

**Part-list cuing (v0.2):** in `discussEvent`, the speaker's narration IS a
part-list cue for the listener (Roediger 1973; RC§6). Fields the speaker
covered → misinformation merge §6.3 as before; fields the speaker *omitted*
→ `plist_suppress` (≈0.05 strength + one-day retrievability penalty via
temporary θ bump). Effect attenuates for old memories — bounded per Bäuml's
long-delay findings (RC§6).

### 5.9 Reconsolidation on recall

Each retrieval: `lastAccessDay = now`, `strength += boost·(1-strength)`
(boost≈0.25, the spacing effect), `retrievalCount++`, `confidence += 0.03`.
**And** the record re-enters a mutable state: the *current* context writes
small deltas into it (§7.1). Memory is rewritten on every telling (R§4).

---

## 6. Distortion — the operators that make characters wrong

### 6.1 Reconsolidation drift

On each retrieval, each verbatim field mutates with probability
`drift_p` (param ~0.08, higher under stress/low confidence):
- detail swapped toward schema-typical value ("espresso" → "coffee"),
- `accuracy -= drift_k` (0.02),
- gist never mutates on a single recall, drifts slowly via gist-shift (§6.4).

### 6.2 Confabulation fill

When reconstructing with missing verbatim fields (decayed): fill from the
character's schema for the event type + their beliefs. Each filled field
lowers `accuracy` by 0.03 but **raises confidence by 0.02** (fluency, R§4) —
the better the story flows, the surer they feel.

### 6.3 Misinformation merge (rumor interface)

When character hears an account of an event they have a memory of:
```
if similarity(myMemory, heardAccount) > 0.4:
    for each conflicting detail:
        p_adopt = misinfo_suscept (param) · sourceCredibility · (1 - myMemory.accuracy·0.5)
        if rand < p_adopt: overwrite field, accuracy -= 0.15, confidence unchanged
    heardAccount may merge into myMemory.source ("told_by" contamination)
```
This is THE rumor-propagation hook: a rumor is a `beliefStatus:"rumor"` record
that can contaminate witnessed memories it resembles. (R§6 misinformation
effect — the most replicated result in memory science.)

### 6.4 Source-tag decay and gist abstraction

`source.confidenceInSource` decays at β_source (fast, ~2× episodic gist rate).
When it drops below 0.3: "I heard somewhere…" — content persists, attribution
gone. When gist is retrieved ≥ gist_abs_thresh (≈4) times, optionally spawn a
**semantic record** ("Mara is stingy") — episode becomes trait belief. This is
how episodic events crystallize into the belief-vs-fact layer (R§6, R§9).

### 6.5 Social convergence

When two characters discuss a shared event, run misinformation merge **both
ways** with asymmetric susceptibility — the pair drifts toward a shared
(possibly false) version (social contagion, R§6).

---

## 7. Character parameter table (schema)

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
  "face_ceiling": 0.67, "stress_thresh": 0.8, "stress_encode_loss": 0.31
}
```

Suggested clamp ranges are in `character-memory-profiles.md` §0 — implementers
should validate params into those ranges at load.

---

## 8. Tick architecture (suggested, cheap)

- **On event:** encoding pass §2 (O(1)).
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

## 9. Non-goals for v0

No procedural-skill dynamics, no prospective memory (remembering intentions) —
flagged for the roadmap. No language-level rumor simulation; distortion is
field-level. No neural plausibility — functional equivalence only.

## 10. Interface contract for game-systems

- `encodeEvent(charId, event, context) -> MemoryRecord|null`
- `recall(charId, cueContext, k) -> [Reconstruction]` (with confidence,
  beliefStatus); `cueContext.mode` ∈ `"recall" | "recognition"` (v0.2, §5.6)
- `ambientMemoryScan(charId, context) -> [Reconstruction]` — involuntary
  recall for unfocused ticks (v0.2, §5.7)
- `hearAccount(charId, speakerId, account)` → misinformation merge
- `discussEvent(charA, charB, eventRef)` → bidirectional merge + part-list
  suppression of unspoken fields (v0.2, §5.8)
- `dailyMemoryTick(charId, sleepQuality)` → decay/interference/consolidation
- `memorySnapshot/Load(charId)` → serialize the two stores + params
- Belief layer: `beliefStatus` on records IS the belief-vs-fact hook; rumors
  are just records with `source.kind:"told_by"` + `beliefStatus:"rumor"`.
