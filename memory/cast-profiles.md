# Cast Memory Profiles — the 8 mains, compiled (v70)

**Track:** memory-research (sf/memory) · **Inputs:** world track character
bibles `world/characters/c1–c8` (world-v14, read-only), the v1.0 compiler
(`profile-generation.md`), and three NEW sourced mechanisms below (§1)
that the bibles forced into the spec (→ `memory-model-spec.md` v2.2).

This is the deliverable the roadmap called "individual profiles for the 8
mains." Each main gets: a `ProfileInput` (pins justified by bible text, not
invented), the resulting discriminative parameter set, a SelfModel, a
DomainTable, seedHints, and a one-line **memory signature** — the forgetting
phenotype a viewer should be able to learn to recognize.

Nothing here is narrative content — these are parameter assignments with
cited mechanisms. The world-builder owns the prose; we own the parameters
the prose implies.

---

## 1. New mechanisms the bibles required

Three findings the archetype layer didn't have, each forced by actual
cast members. All are now spec'd (v2.2 §7 params; formulas below).

### 1.1 The immigration bump — `bump_windows` replaces `bump_lo/hi`

**[CONSENSUS]** Schrauf & Rubin (1998, *J. Mem. & Lang.* 39:437; 2001,
*Applied Cognitive Psychology* 15): older adult immigrants' autobiographical
distributions show a bump that **follows the age of immigration**, not the
standard 10–30 window — or a *bimodal* bump when migration falls inside it.
Mechanism per the authors: novel-event encoding + "effort after meaning"
during transition, then release from proactive interference during stable
settlement. Companion finding: ~20–40% of immigrant memories are
**crossover** — internally encoded in the other language (Schrauf & Rubin
2000, *Memory & Cognition* 28:616) — which is exactly the existing
`lang_mismatch` cue mechanism (v1.9), now with a population to use it on.

**Spec change:** the §4.1 bump term evaluates over a per-character
`bump_windows: [{lo, hi, mult}]` list compiled from
`ProfileInput.lifeEvents: [{type:"immigration", age}]`. Default single
window [bump_lo, bump_hi] is preserved when no life events are pinned.
Migration at age `a` mints a window `[a−2, a+8]` at `mig_bump_gain`·
bump_beta_mult. Cast: **C6 Carmen** (arrived via Miami 1981, age ≈29 →
windows [10,30]∪[27,37] — bimodal, the late window carrying the
displacement-era density) and **C8 Tomás** (arrived from San Miguel at 12 →
windows [10,30]∪[10,20]; his whole bump is bilingual — pre-12 records are
`lang:"es"` and pre-amnesia-tail, so his deep archive is *smaller than his
felt archive*, which is itself a real immigrant-memory phenotype).

### 1.2 Secrecy is mind-wandering, not concealment — `secret_mindwander`

**[CONSENSUS]** Slepian, Chun & Mason (2017, *JPSP* 113, "The experience of
secrecy"; 10 studies, >13,000 secrets): people catch themselves thinking
about their secrets **~2× as often** as they face situations requiring
concealment, and it is the *mind-wandering frequency* — not concealment
frequency — that predicts the wellbeing cost. Keeping a secret is a
chronic intrusive-thought condition, not a social-performance one.

**Spec change:** `confidential` records gain an intrusion channel
independent of `open` loops: `secret_mindwander` (0–0.3, default 0.08)
added to the ambient-scan intrusion drive for records with
`secret_str > 0`. Combined with §6.22's leak machinery, this produces the
two-headed secrecy phenotype: the secret **nags the keeper** (intrusions)
while its **confidentiality tag rots** (leaks). The self-concealment trait
(below) raises it — Larson & Chastain (1990, *J. Soc. Clin. Psychol.*
9:439): self-concealment is distinct from low self-disclosure and tracks
anxiety/depression/somatic complaints *incrementally* — the concealer
pays for the secret twice.

Every one of the 8 mains carries at least one `confidential` record at
world day 0; three carry detonating ones. This parameter is the difference
between "has a secret" and "is being eaten by it."

### 1.3 Attachment avoidance — preemptive exclusion at encoding — `attach_avoid`

**[CONSENSUS]** Edelstein (2006, *Emotion* 6:340): attachment avoidance
impairs working memory for **attachment-related** material — both positive
and negative — and is unrelated to memory for non-attachment material of
matched emotionality. Fraley, Garner & Shaver (2000, *JPSP* 79; Fraley &
Brumbaugh 2007): the deficit is **preemptive** — avoidants encode less at
the front door (monetary incentive does not rescue recall), and retrieval
of early emotional memories is slower besides (Mikulincer & Orbach 1995).
Attachment *anxiety* showed no memory deficit — the avoidance axis is the
carrier, anxiety is free-riding neurot.

**Spec change:** new IndivTraits trait `attach_avoid` (σ-units, ~N(0,1),
population r with extra ≈ −0.3, with neurot ≈ 0.0 — orthogonal to the
anxiety axis per Edelstein). Loading: `attach_encode_loss` (0–0.5) multiplies
E on records tagged `attachment:true` (event-layer tag on relational
content — bids, confessions, comfort, dependency); `attach_ret_cost`
(0–0.4) adds to searchCost on the same tag. **Boundary is the finding:**
non-attachment emotional records are untouched — the avoidant character is
normally competent about everything except closeness.

This is the single most diagnostic trait in this cast: the bibles describe
**five** characters whose drama is an avoidance structure (Marisol's one-way
intimacy, Priya's triage of her own life, Victor's two drawers, Tomás's
unstated devotion, Marcus's conflict deflection) — but with *different
parameter readings* (§3 matrix), which is what keeps them from being the
same person.

---

## 2. The compiler inputs — bible → pins

Mapping rules (applied uniformly; every pin cites a bible line):

- **Under pressure** section → `regulate_style`, `stress`, lapse loading.
- **Notices / misses** → domain tags + their boundary. What a character
  "misses" is a standing attention claim, so it lands on `att_min` /
  `lapse_p` / `omit_p` for the missed channel, not on the secret's content.
- **Won't do** → `self_share_pen`, `share_shame_pen`, suppress habits.
- **Secrets & seeds** → `confidential`/`open`/`trauma` record seeds only
  (the *record*, never the content, enters the profile).
- **Routine table** → chronotype (`peak_hour`), regime overlays (shift
  work), `routine-heavy` modifier eligibility.
- **Backstory facts** (moves, bereavements, careers) → `lifeEvents` →
  bump windows, regime scars, transactive-loss PersonModels.

Seeds: each main gets `seed = hash("C<n>-mem")` — deterministic, noted per
profile so world-builder + game-systems reproduce identical vectors.

---

## 3. The 8 mains

Convention: `pin: trait = σ`. Only discriminative params listed; all others
follow the pipeline (curve at `age_now`, loading projection, ±5% residual,
clamp). Emergent lines describe expected *observable* forgetting behavior.

### C1 — Marisol "Mars" Delgado, 29 · café manager · `seed c1-mem`

```
archetype: C young adult (age 29 → still inside bump window)
pins: social +1.5 · consc +0.8 · open +0.5 · wmc +0.5 · extra +0.6
      selfconceal +1.5 (knows everyone's secrets; hers stay locked —
      "intimacy flows one direction through her")
      neurot +0.4 (anxiety channeled into caretaking errands)
modifiers: highly-social/gossip · open-loop carrier · (3rd slot: the blog
      is a REGIME, not a trait — see below)
domains: gossip-who-said-what depth 0.9 · beverages-regulars depth 0.8
      (names orders before customers speak — expert-level person ledger)
regimes: [blog-pressure, ~60d → now]: +stress, lapse_p +0.03,
      concealment-adjacent records encode at da_load (she's running the
      counter AND the secret)
lifeEvents: none (born at SF General, never left — the only main with a
      single, deep, unbroken block context; her w_place cues are the
      densest in the cast)
records at day 0: confidential{the blog, the flyer} + open{publish/hold}
      — the season's biggest open loop lives in the head of the person
      with the cast's best memory for everyone else's business
SelfModel: self_est.global ≈ 0.62 — she is right about her memory and
      knows it (metamem_r still ≤0.3); strategy_use low (0.35) — no lists,
      she IS the ledger
```

Discriminative params: `sti_prob 0.85` (person-attentive ceiling),
`cred_step 0.14` (keeps books on who-said-what), `share_k 1.1` with
`self_share_pen 0.8` (curates others', locks her own), `audience_tune 0.15`,
`secret_mindwander 0.14`, `dest_mem 0.85` (rarely repeats herself to the
same listener — she tracks her tellings), `absorb_p` low.

**Signature:** *the archive that forgets itself.* Remembers your order,
your fight, your Tuesday — verbatim-ish for weeks (dense retell ecology +
domain depth 0.9). Her own secret intrudes at ~2× base rate
(`secret_mindwander` + open loop), she can't discharge it
(`self_share_pen`), so it stays hot while everyone else's stories cool.
Watch for: she'll recall others' verbatim better than her own.

### C2 — Jules Park, 26 · barista, the newcomer · `seed c2-mem`

```
archetype: C young adult
pins: open +1.0 (the sketcher's eye) · vivid +1.2 (draws hands on cup
      sleeves) · consc +0.4 · neurot +0.6 (polite freeze) · social −0.6
      (three months in — thin PersonModel network) · fantasy +0.5
      (correspondent-in-their-head narration) · selfconceal +0.8
modifiers: none standard; the tenancy secret + crush are RECORDS, not
      modifiers (≤3 rule reserved)
domains: visual-composition depth 0.6 (light, sightlines, who stands
      where — encodes scenes in frames)
lifeEvents: [relocated, age 26, 90d ago] → NOT a bump event (adult move,
      no settlement window per Schrauf & Rubin) — instead: recency +
      w_nov elevated (novelty ceiling still falling)
records: confidential{unpermitted tenancy} — held JOINTLY with Carmen
      (shared_with:[C6]; Jules protects it harder than their own →
      secret_str high, self_share_pen applies to disclosure urges);
      open{Priya crush — preverbal}; open{the sketchbook}
SelfModel: self_est.global ≈ 0.50 ± noise; they don't claim a good or bad
      memory — they claim to be "still learning everyone," which is a
      directory statement (transactive, accurate)
```

Discriminative params: `vivid_detail 0.9` (peripheral fields write at
near-ceiling — the sketchbook is the externalization of a rich encoder),
`concrete_gain 0.25`, `enact_gain` effective-high (drawing = performed
encoding), `imagine_gain 0.3` (narrated reality: the correspondent habit
is a phantom-minting machine — their "how I'll tell this later" encodes
as a quasi-event), `chain_gain` low (no reminding cascades yet — the
network is too new to cue them), `common_ground_conf` low-side
(copresent_assume overreach lands on the newcomer: they constantly don't
know what everyone assumes they know).

**Signature:** *the dense newcomer.* Fewer records, richer each; recent
weeks over-detailed, deep past thin. They'll misattribute a block story
to having witnessed it (`absorb_p` on rich retellings — three months of
Mars's narrations) and surprise everyone with forensic visual detail
nobody else stored.

### C3 — Dani Reyes, 24 · barista/chalkboard artist · `seed c3-mem`

```
archetype: C young adult
pins: extra +0.8 · neurot +0.7 (sharp-tongued when nervous — deflection
      is anxiety) · open +1.0 · social +1.0 · selfconceal +1.2
      (lies by omission about her own life) · wmc +0.2
modifiers: highly-social (art-adjacent rumor flow) — NOT depressive:
      her "I'm fine" is concealment, not dysphoria; mnemonic profiles
      differ (specificity stays ~1.0, no rumin_k — the distinction
      matters for P203/P210)
domains: faces-hands depth 0.8 · visual-art depth 0.7
regimes: [secret-relationship, ~90d → now]: confidential record CLUSTER
      (not one record — three months of compartmentalized evenings);
      the 17:00–21:00 undisclosed stops encode at full E but carry
      confidential + suppressed-retell tags
records: open{telling Marisol — deferred daily, highest open_loop_gain
      × neurot multiplier in the cast}; the doodles are a leak channel —
      enacted records with suppressed verbal retell
SelfModel: self_est.global ≈ 0.55; she doesn't think about her memory —
      she thinks about exposure
```

Discriminative params: `secret_mindwander 0.16` (highest in cast —
three-month concealed relationship, nightly), `open_loop_gain 0.20`,
`share_k 0.9` but `self_share_pen 0.85` + `share_shame_pen 0.7` (the
secret is shame-adjacent — Marisol would be hurt by content AND
concealment), `boundary_gain` high (lives compartmentalized: Geneva flat
vs 24th St — her life is already segmented, doorway_drop meaningful),
`gen_gain 0.25` (the chalkboards are generation encoding — her tell is
structural: what she draws encodes deepest).

**Signature:** *compartments.* Her store is partitioned by venue;
cross-context intrusion is her failure mode (Marcus's name surfacing in
a Mudhaus context is an involuntary-retrieval accident waiting to
happen — `w_place` mismatch is the only thing holding the partition).

### C4 — Priya Raman, 31 · RN med-surg, SF General · `seed c4-mem`

```
archetype: C/D boundary (31 → C curve with first midlife terms)
pins: consc +1.2 · wmc +0.8 (clinical divided attention is trained) ·
      stress +0.8 · neurot +0.5 (buried — "stubborn about being fine") ·
      social −0.3 · attach_avoid +0.8 (triage-your-own-life: her own
      attachment content encodes thin — Edelstein boundary)
      regulate_style 0.35 (suppressor-leaning: "I'm fine. It's a status
      report.")
modifiers: high-stress job · routine-heavy (shift blocks)
domains: clinical-human depth 0.75 (gait changes, weight loss, Carmen's
      ankles — health tags on PersonModels are her expert channel);
      flat's labor-ledger is NOT a domain — it's emotionally loaded
      material she encodes precisely because selfRelevance is high and
      she's a tally-keeper (the tally is involuntary rehearsal)
regimes: [three-12s]: shift days → sleepFactor ×0.85, da_load high at
      work, post-shift encoding window attenuated (stress_retrieve);
      the café decompression hour is her consolidation gateway
records: open{the tally she hates} — grievance rehearsal without
      discharge (verbal_dampen never fires — she never tells anyone);
      the Marcus+Dani reveal will land on a store that has been
      *pre-encoding* the evidence at full strength and filing it under
      "generic niceness" — misattribution inventory, not absence
SelfModel: self_est.global ≈ 0.55, self_est.intentions high (nurse PM
      is trained) — she trusts her memory and is mostly right; the gap
      is in attachment content she doesn't know she's not encoding
```

Discriminative params: `attach_encode_loss 0.25` (the Edelstein signature
— clinically precise on Carmen's edema, foggy on the moment the
relationship actually ended), `pm_focal_hit 0.9`, `stress_retrieve_loss`
moderate, `da_encode_mult 0.7` (good — trained multitasker), `mood_bleed`
low, `specificity 0.9` (concrete-noun recall — nurse cadence in memory
too), `open_loop_gain` standard but shame-gated.

**Signature:** *precise about you, vague about herself.* Diagnostic-grade
detail on others' decline; her own biography returns as summary
("it ended two years ago") — not from overgeneral AM (that's depressive
machinery she doesn't have) but from an encoding deficit on her own
attachment events. The distinction is falsifiable (P205).

### C5 — Marcus Bell, 34 · bike courier · `seed c5-mem`

```
archetype: C/D boundary (34)
pins: extra +1.2 · consc −0.8 (generous, disorganized — the rent is late
      every third month) · social +0.9 · fitness +0.8 (cyclist — Erickson
      offset is small at 34, banks for later) · wmc −0.3
      attach_avoid +0.6 (conflict-deflecting — avoids encoding the hard
      conversation; when cornered "tells the truth all at once, badly" =
      records with no rehearsal history, raw)
modifiers: none standard; conflict-avoidance rides attach_avoid + low
      suppress habit (he doesn't suppress — he routes around)
domains: routes-parcels depth 0.85 — the Maguire-type spatial expert
      ("I know every porch on this block"); the Woollett bill: link_p
      cost out-of-domain, so his non-street associations form slightly
      worse than baseline · rhythm-music depth 0.6
records: open{wanting to tell Priya — HE wants out of the secret;
      opposite pressure direction from C3's}, confidential{Dani
      relationship}, arrears = recurring open loop with LOW self-relevance
      framing (he files it as logistics, not guilt — open_self_gate
      borderline: the loop nags less than it should, which is the
      character)
SelfModel: self_est.global ≈ 0.6 + conf_bias +0.05 — feels reliable;
      the gap between felt and actual shows in PM specifically
```

Discriminative params: `pm_monitor_p` low (0.2) + `pm_clock_p` low (0.05)
— **the rent mechanism is prospective-memory failure, not moral failure**:
nonfocal/time-based obligations slip while `pm_focal_hit` stays 0.9
(never misses Thursday — a focal social cue). `intention-completion
confusion` (HYPOTHESIS, P209): rehearsed intentions ("it's being handled")
partially encode as done — boundary case of §6.9 imagineEvent on own
plans. `chain_gain` high, `enact_gain` high, `w_sensory` high (drummer —
rhythmic/auditory cues strong), `iiv_sigma` elevated (inconsistent days —
inattn-adjacent without the trait pin).

**Signature:** *spatial giant, temporal sieve.* Every porch, every corner
argument — and the third month's rent evaporates between intention and
action. His secrets are warm (he wants them out); Dani's are the ones
holding.

### C6 — Carmen Echeverría, 74 · retired seamstress · `seed c6-mem`

```
archetype: E older adult · reserve 0.65 → age_eff ≈ 74 − 0.65·10 ≈ 67
      ("sharp for her age" is earned: dense social engagement + skilled
      trade + still-working)
pins: consc +1.0 · neurot −0.5 (unflappable) · social +0.4 (the stoop IS
      a network) · vivid +0.5 · selfconceal +1.0 (financial fear never
      spoken — "she has told no one she has nowhere to go") ·
      aging_rate −0.6 (slow ager)
modifiers: routine-heavy (forty-year patterns) · high cognitive reserve
domains: sewing-craft depth 0.9 — PROCEDURAL (beta_proc ≈ 0.005; arthritis
      slows the hands, not the knowledge — the store that outlives her
      episodic one) · neighborhood-history depth 0.9 (four decades of
      PersonModels — the block's archive)
lifeEvents: [immigration, age 29, 1981] → bump_windows [10,30]+[27,37]:
      bimodal — the displacement years carry a second dense band layered
      on the normal bump (Schrauf & Rubin 2001). Pre-1981 records
      lang:"es" → crossover penalty on English cues (lang_mismatch);
      internal-language retrieval runs 20–40% es — her Cuban memories
      arrive in Spanish even when asked in English.
transactive: PersonModel(late husband).available=false → transact_loss θ
      on sewing-room-era and forty-year-household topics; the deepest
      directory gap in the cast (Harris 2014 — grief as pointer-rot)
records: confidential{Jules tenancy — she will carry it to the
      convalescent home: secret_tag_mult 1.0 floor, secret dies only
      with the content}; confidential{nowhere-else-to-go — never minted
      as shared at all}
SelfModel: self_est.global ≈ 0.50 — calls her memory decent, means it;
      the poignant case (§2 profile-generation) is ARMED at low amplitude:
      real decline mild (reserve), felt decline milder
```

Discriminative params: `dest_mem 0.6` (repeat-teller — same stoop story
to the same listener, miss asymmetry), `tot_rate 0.12` + `tot_resolve_p`
high (name-blanking resolves on sight), `intrusion_thresh 0.62` (drifts
into the past — decades of canonized material one cafecito away),
`ctx_loss 1.3`, `bump_windows` bimodal (above), `chain_gain` high
(the storyteller — each memory cues the next decade over),
`collab_partner_gain` residual — her partner is gone; Jules is becoming
the substitute directory (emergent: she'll start delegating recall to
Jules by year two).

**Signature:** *the block's memory.* 1989 is vivid, polished, canonized,
and partly invented; last Thursday is gone; the hemming is flawless.
She will tell you the same story twice and name-check a neighbor's
abandoned name correctly — source decay and cascade preservation in one
stroke.

### C7 — Victor Auerbach, 58 · hardware owner / presumptive landlord · `seed c7-mem`

```
archetype: D midlife · reserve 0.3 → age_eff ≈ 55
pins: consc +0.7 · extra −0.6 · social −0.4 (alone above the store) ·
      neurot −0.3 · wmc +0.3 · stress +0.6 (the offer in the drawer) ·
      attach_avoid +1.2 — THE maximum in the cast: "filed in different
      drawers and refuses to open them at the same time" is the trait
      described as a filing system
      regulate_style 0.2 (suppressor — goes procedural under pressure)
modifiers: domain-expert · high-stress (sale era) · routine-heavy
      (Tuesday repairs are ritual rehearsal)
domains: leases-payment-history depth 0.9 (the §7.1 worked example made
      flesh — forgets your name, never forgets your arrears) ·
      buildings-anatomy depth 0.85 ("knows every pipe by name" — the
      buildings are his transactive partner since the wife's death)
lifeEvents: [bereavement — wife's death]: regime overlay at death date
      (grief-window records: high-stress encoding, intrusions); then
      PersonModel(wife).available=false → transact_loss on the two
      topics she owned: bookkeeping AND warmth — his ledger-memory and
      his tenderness both lost their directory partner
records: confidential{the sale offer — open + open_loop intrusion at
      LOW amplitude (he is genuinely good at drawers: attach_avoid
      blunts even the nag)}; open{Tomás handshake $6,000 — "mentions
      never and remembers always": low-intrusion, never-closing loop —
      the handshake detail is verbatim-safe because it was never
      retold into drift}
SelfModel: self_est.global ≈ 0.55 — thinks his memory is fine, and on
      documents it is; doesn't know (and wouldn't check) what the
      drawers cost
```

Discriminative params: `attach_encode_loss 0.4` (cast max — tenant warmth
encodes as paperwork or not at all), `self_share_pen 0.85` + `share_k
0.5` (omits massively, never lies — low transmission rate full stop),
`open_loop_gain 0.08` (suppressed nagging — the drawer works, at the
Slepian cost: the sale still mind-wanders in, just quietly),
`strategy_use 0.8` (writes everything on receipt paper — external memory
as personality), `spec decay` on people: names/order-of-meeting fade
while amounts persist — `w_people` weight LOW, `w_topic` on financial
records HIGH.

**Signature:** *the ledger that forgot it has a heart.* Numbers verbatim,
feelings gist; the debt handshake survives untouched because it was
never told; ask him about a tenant's kids and watch the encoding deficit
that looks like gruffness.

### C8 — Tomás Herrera, 36 · lead cook · `seed c8-mem`

```
archetype: D early edge (36)
pins: consc +1.3 (cast max — disciplined past wisdom) · extra −0.7 ·
      neurot −0.2 · social +0.2 · selfconceal +1.0 (devotion never
      stated) · attach_avoid +0.9 (the one move that isn't a plan)
      open +0.6 · vivid +0.4 (flavor memory is sensory-rich)
modifiers: routine-heavy (the line, the supplier loop, the 3 p.m.) ·
      open-loop carrier (La Esperanza + Marisol + the debt — he carries
      three loops and feeds them all)
domains: kitchen-timing-flavor depth 0.85 (procedural + sensory — w_sensory
      ceiling; smell/taste cues reach furthest for him: sensory_age_slope
      high — the 3 p.m. coffee smell retrieves Marisol-moments at
      discriminable fidelity) · supplier-pricing depth 0.6 (prices things
      out loud — verbatim-cost recall in-domain)
lifeEvents: [immigration, age 12, from San Miguel] → bump_windows
      [10,30]+[10,20]: his bump is bilingual and double-loaded — the
      arrival years ARE the identity years (Schrauf & Rubin). Pre-12
      records lang:"es" + amnesia-tail → his Salvador childhood exists
      mostly as flavor/Spanish-conditioned fragments: food cues cross the
      language barrier that verbal cues don't (odor cues' privileged
      autobiographical reach, §5 sensory stack — Proust effect is his
      dominant channel)
records: open{telling Marisol — cast's oldest open loop, rehearsed daily
      at 3 p.m., never executed: the plan is canonizing (§6.24) — a
      canonized INTENTION is new territory: the retold-to-himself
      confession drifts like a story}; open{La Esperanza — the notebook
      is externalized open loop; imagineEvent on the plan = HYPOTHESIS
      P209 intention-completion risk: he may half-remember details as
      decided/bought}; open{the handshake debt — Victor's side mirrors it:
      TWO characters hold the same event with opposite loop pressures}
SelfModel: self_est.global ≈ 0.6, self_est.intentions high — trusts his
      follow-through completely (mostly earned); blind spot is
      intention-vs-completion
```

Discriminative params: `w_sensory 0.5` (cast max — the cook retrieves
through smell/taste), `chain_gain` high (reminding cascades — the plan
cues the plan), `open_loop_gain 0.18`, `enact_gain` high (he encodes by
doing), `tele_k` low (precise dater — "fifteen years on that line"),
`dest_mem` moderate (few stories, deeply canonized — the opposite of
Carmen's broadcast retelling), `strategy_use` high (the notebook IS his
external store — its loss is a memory event, not a property event).

**Signature:** *the archive of the plan.* He remembers what things cost
in 2011, what Marisol orders on bad afternoons, and the smell of San
Miguel — while three open loops quietly canonize into a future he treats
as already-written. His failure mode is remembering the plan so well it
feels like progress.

---

## 4. Distinctness matrix — why no two mains collapse

The cast's memory phenotypes are designed orthogonal. The two most
confusable pairs and what separates them at the parameter level:

- **Priya vs Marcus** (same flat, both 30s): Priya's deficit is
  *attachment encoding* (precise on you, vague on herself); Marcus's is
  *prospective monitoring* (vivid street, evaporating obligations). Same
  age curve, opposite axes. A battery probing "what did X say about Y"
  favors Priya; "did you do the thing you said" favors Marcus.
- **Marisol vs Dani** (same counter, both social): Marisol curates —
  `self_share_pen` suppresses only her own channel; Dani compartmentalizes —
  `boundary_gain` + place-cue partitions do the work. Marisol's secret
  nags her *at work* (the counter is where everyone talks); Dani's nags
  her *across contexts* (the partition is the failing wall).
- **Carmen vs Victor** (the two elders): Carmen's archive is *broadcast*
  (canonized by retelling, warmly drifted); Victor's is *vaulted* (untold
  handshake details stay verbatim). Same neighborhood, opposite rehearsal
  ecologies — hers social, his procedural.

Pairwise free-param Mahalanobis distances and the blind-signature
classification test are formalized as P206.

---

## 5. What the world-builder takes from this

- `ProfileInput` blocks above compile to deterministic MemoryParams +
  SelfModel + DomainTable + seedHints. Bible edits that change a pin
  (age, trait claim, life event) recompile — the profile is downstream
  of the bible, never forked.
- Secrets are seeded as `confidential` + `open` RECORDS — the mechanics
  (intrusion, leak schedule, mind-wander) are emergent from params, not
  scripted. A character's secret only hurts them the way their own memory
  hurts them.
- The `attach_avoid` trait is the cast's dominant diagnostic dial —
  five mains carry it at different σ with different compensations. Keep
  bible claims about closeness/avoidance accurate; they now have memory
  consequences.
- Bilingual characters (C6 es, C8 es, others plausibly) carry `lang` on
  era-tagged records — cueContext.lang is the retrieval side.

---

## 6. Falsifiable probes (P201–P210, filed to validation-design.md §21)

- **P201 immigration bump (MUST):** seeded stores for C6/C8 show a second
  density peak at [mig_age−2, mig_age+8] against a non-immigrant control
  profile at matched age — and C6's distribution is measurably bimodal.
- **P202 crossover retrieval (SHOULD):** es-tagged records retrieve
  better under `cueContext.lang:"es"` (lang_mismatch applies);
  20–40% of immigrant-era retrievals under neutral cues return
  crossover-flagged content (Schrauf & Rubin 2000).
- **P203 secrecy asymmetry (MUST — sign-locked):** `confidential`
  records intrude on ambient scans at ≥1.5× the rate they require active
  suppression in dialogue context; the wellbeing/stress correlate tracks
  intrusion count, not concealment count (Slepian 2017).
- **P204 self-concealment split (MUST — structure):** `self_share_pen`
  suppresses transmission of selfRelevance≥0.6 records while leaving
  `share_k` on other-focused content untouched — the Marisol pattern is a
  two-channel assertion, not a mood.
- **P205 avoidant boundary (MUST — sign-locked):** high-`attach_avoid`
  profile shows E deficit on `attachment:true` records and NULL deficit
  on matched non-attachment emotional records (Edelstein 2006); monetary/
  motivational cue does not rescue the retrieval (Fraley 2000).
- **P206 cast distinctness (MUST):** the 8 compiled mains' free-param
  vectors pairwise-exceed the P98 floor; a blind classifier matching
  behavioral batteries (forgetting phenotype probes) to profiles recovers
  ≥6/8 identities.
- **P207 procedural preservation (SHOULD):** C6's `type:procedural`
  records decay ~0 against her episodic decline curve — aging splits
  stores, not people.
- **P208 transactive widowhood (SHOULD):** Victor's bookkeeping/warmth
  topics show θ penalty while PersonModel(wife).available=false; Carmen
  analog on husband-linked topics; both penalties lift partially if a
  surrogate directory forms (Jules).
- **P209 intention-completion confusion (OBSERVE — HYPOTHESIS):**
  heavily rehearsed open intentions produce low-rate "I did it"
  false-completion records via imagineEvent-on-plans (Marcus's rent,
  Tomás's notebook). Flagged as modeling hypothesis, not literature.
- **P210 secret-load ordering (SHOULD):** identical confidential record
  seeded into the 8 mains → ambient intrusion rate orders by
  secret_mindwander × selfconceal: Dani > Jules > Victor (floor).

---

## 7. Sources added this version

- Schrauf & Rubin 1998 (*JML* 39:437–457); Schrauf & Rubin 2001 (*ACP*
  15); Schrauf & Rubin 2000 (*Mem & Cogn* 28:616–623) — immigration bump,
  crossover memories.
- Slepian, Chun & Mason 2017 (*JPSP* 113) — secrecy as mind-wandering;
  ~2× intrusion vs concealment.
- Larson & Chastain 1990 (*J Soc Clin Psychol* 9:439) — self-concealment
  construct; incremental distress cost.
- Edelstein 2006 (*Emotion* 6:340); Fraley, Garner & Shaver 2000 (*JPSP*
  79); Mikulincer & Orbach 1995 (*JPSP* 68:917) — attachment avoidance,
  preemptive encoding exclusion, anxiety-axis null.
- Continuing threads: Harris et al. 2014 (transactive loss, from v2.0);
  Erickson 2011 (fitness, v1.9); Woollett & Maguire 2009 (expertise cost,
  v1.0).

---

# Part II — v34 pass: the narrative-self layer + spec v3.x catch-up

v22 compiled the mains against spec v2.2. Six spec versions later
(v3.0–v3.4), four new findings from the character-literature join the
cast layer, and every main gets a delta block bringing their profile
current. The bible-derived pins from Part I are unchanged — this pass
*adds* dials, never rewrites.

## 8. New mechanisms (→ spec v3.4 §6.34)

### 8.1 Self-defining memories — the anchor records

**[CONSENSUS]** Singer & Salovey (1993, *The Remembered Self*);
Blagov & Singer (2004, *J. Personality* 72:481–511): a small set of
memories is self-defining — vivid, affect-charged, meaning-laden,
linked to enduring concerns. Four scored dimensions (specificity,
meaning, content per Thorne & McLean, affect) map onto record fields:
`selfdef:true` + `meaning` + `sdmCat` + `affect_tag`. Blagov &
Singer's key individual-difference result — SDM specificity is
inversely related to *repressive defensiveness* — becomes the
`selfdef_spec_mult` load on new trait axis `defens` (axis 23; r
with neurot ≈ −0.3, with selfconceal ≈ +0.4 — defensiveness is NOT
neuroticism and NOT mere secrecy).

Spec mechanics (§6.34a): archive floor, split drift (meaning held,
wording drifts), warm bias on drive, cap `selfdef_cap` 6. This is
the missing piece for the cast's oldest open loops: Tomás's
confession plan and Victor's handshake were already canonized (§6.24)
— now they are also *anchors*, records that can never archive and
that cue the rest of the store disproportionately.

### 8.2 Mnemic neglect — the recall-only self-defense

**[CONSENSUS]** Sedikides & Green (2000, *JPSP* 79:906; model review
Sedikides & Green 2009, *P&SC* 3): feedback that is negative, about
central self-traits, high in diagnosticity, and about the SELF is
recalled worse than all control cells — and the effect is
**recall-only** (Green, Sedikides & Gregg 2008, *JESP* 44:547:
recognition unimpaired — "forgotten but not gone"). Eliminated when
the source is close or the goal is self-improvement (Green et al.
2009, *Self & Identity* 8:233). Magnified by repressive
defensiveness.

Spec mechanics (§6.34b): a three-gate drive penalty, recognition
path exempt, close-source relief. The character who "doesn't
remember being told off" is not lying and not repressing — the
record is there, it just fails at search, and a recognition cue (or
a trusted person's re-telling) can still land it. This is the
mechanism the bibles kept describing in prose — "he files it and
never opens the drawer" — as a *retrieval* phenomenon, which is
more human and more playable than an encoding block.

### 8.3 Life-script corrections — the bump is for the happy, the wound is for now

**[CONSENSUS]** Berntsen & Rubin (2004, *Psych. Bull. Rev.* 11:1003)
+ Rubin & Berntsen (2003, *Psych. Aging* 18:636): the reminiscence
bump appears for POSITIVE events only (cultural life scripts
concentrate expected transitions at 15–30); negative events show no
bump and their distributions peak at the present; happy involuntary
memories outnumber unhappy ~2:1 and only the happy ones bump.
v0.3's `bump_valence_gate` covered the encode side; v3.4 adds the
retrieve/date side: `neg_now_pull` (negative records misdate
recent), `script_age_pull` (lifescript-positives drift toward
normative ages), `invol_pos_bias` (the ambient scan arrives warm).

Cast consequence: Carmen's immigration bump (Schrauf & Rubin, v22)
carries her *positive* transitions — the displacement-era negatives
distribute flat and misdate forward. Her "worse times, better told"
is now mechanically two different distributions, not one story.

### 8.4 Redemption/contamination — the retell transform on meaning

**[CONSENSUS]** McAdams, Reynolds, Lewis, Patten & Bowman (2001,
*PSPB* 27:472–483): life narratives are coded for sequences where
bad turns good (redemption — tracks wellbeing and generativity) or
good turns bad (contamination — tracks distress); redemption
predicts wellbeing better than raw affective tone. Spec mechanics
(§6.34d): `script_redeem ∈ [−1,1]` × `redeem_write` per retell
accrues a valence-shifting frame on the record's `meaning` field —
content fields untouched. Over tellings the character's *interpretation*
of their own biography drifts onto their script's groove while their
facts stay checkable — the two-headed phenomenon where someone can
be honest about what happened and wrong about what it meant.

### 8.5 The ambient tier — profiles for the 20 thin-AI NPCs

The 20 ambient NPCs now get a formal profile recipe rather than
"the same equations, smaller" (spec §10 v3.4):
`deriveParams(ambient:true)` samples IndivTraits at
`ambient_trait_sigma` (0.3σ — a narrow, legible band, never flat),
caps the live store at `ambient_cap`·`ambient_cap_mult`, sets
`selfdef_cap`→0 (no anchors — thin characters hold roles, not life
stories), and defaults `individ_rate` low / `cat_prior_pull` high so
their PersonModels stay category-first (Fiske & Neuberg 1990 — thin
attention leaves people as "the landlord type," "the jogger").
**Promotion path:** on promotion to main, re-sample at full σ,
backfill SelfModel + allow anchors to mint naturally — records are
never rewritten, so a promoted NPC's thin early store is real
history, not a retcon.

## 9. Per-main delta blocks (v22 pins stand; these add)

### C1 Marisol — `defens +0.5` · `script_redeem +0.4` · `mnem_neg 0.20`
- `face_ability +0.5σ` (the order-ledger extends to faces — she
  recognizes the irregular from six months ago), `name_fan` emergent
  HIGH cost (her directory is the cast's biggest — the mechanism
  makes the social giant blank names *sometimes*, which is truer
  than never). `suggs` −0.4 (Yield low — she has heard every version
  already), `heard_update_w` high (0.6 — absorbs impressions of
  people, skeptics of claims). `doubt_persist` ~45 — a burned
  confidante doesn't unhear.
- **Anchors (selfdef, 4):** relationship{the regular who stopped
  coming — unspoken}, achievement{manager keys at 24},
  lifeThreat{father's last illness — vigil at the counter},
  other{the first open mic she ran}. All mint `meaning`-rich:
  Marisol's anchors are story-shaped because she rehearses everyone
  else's — and her OWN rehearse silently (self_share_pen).
- **Mnemic neglect reading:** moderate `mnem_neg` + full
  `mnem_close_relief` — strangers' jabs slide off; a true regular's
  criticism lands. Her defensiveness is real but modest — she knows
  her own faults; she just doesn't SHARE them.
- `invol_pos_bias` 0.3 — her mind wanders to people, warmly.

### C2 Jules — `defens 0.0` · `script_redeem +0.3` · `mnem_neg 0.10`
- `face_ability` +0.3 (sketcher's faces), `vivid`-driven anchors
  high-specificity; `individ_rate` HIGH (0.25 — newcomer
  individuates fast, everyone is still diagnostic),
  `cat_prior_pull` 0.4 (low — no block stereotypes loaded yet).
  `transference_pool` 3 with `transference_seed` 0.4 — three months
  in, new faces DO get read through home-town schemas.
- **Anchors (3):** relationship{the goodbye that wasn't — left
  town mid-lease}, achievement{first sketch a stranger asked to
  keep}, other{the apartment's first dawn — drawn}. Their anchors
  are the newest in the cast and the least canonized — high
  specificity, low retell count, still forming.
- `mnem_neg` low + `mnem_close_relief` 1.0 — their self-protection
  is social (avoidance of exposure), not mnemonic; `defens` flat.
- `invol_pos_bias` 0.35 — the correspondent-in-the-head narration
  arrives mostly charmed.

### C3 Dani — `defens +0.3` · `script_redeem −0.1` · `mnem_neg 0.15`
- `suggs` +0.3 (Shift high — polite freeze yields to confident
  corrections), `vigil_social_gain` 0.2 (threat = exposure —
  social-threat events encode hot), `dest_decay_mult` 2.0 +
  `told_pen` 0.3 — she compartmentalizes tellings by venue, so the
  same story legitimately lands twice on different audiences (NOT
  forgetfulness — partitioned ecology).
- **Anchors (3):** achievement{first chalkboard — "I made the
  corner laugh"}, relationship{the evening that became a secret —
  sdmCat relationship, selfdef + confidential BOTH: an anchor that
  cannot be told — the cast's only gagged anchor}, other{the flat
  key — independence}. The confidential anchor is the interesting
  object: warm bias + archive floor + suppressed retell = it
  intrudes and can never be discharged (§6.24 canonization without
  audience — canonized in silence).
- `mnem_neg` moderate BUT compartmentalized — drive penalty applies
  only in the record's home context (w_place partition means the
  neglect doesn't even have to work outside it).

### C4 Priya — `defens +0.4` · `script_redeem −0.2` · `mnem_neg 0.30`
- `mnem_close_relief` 1.0 BUT `improvement:true` events bypass
  entirely — the nurse's improvement-striving gate is wide open for
  clinical feedback, narrower for relational. Her `mnem_neg` is the
  cast's most *diagnostic* case: "you're cold with Marcus" fails at
  recall (central? yes — she files herself as caring; diagnostic?
  yes — a patient-observer said it); "your charting slipped"
  doesn't (improvement-tagged, relieved).
- `attach_avoid` +0.8 already pins her encoding deficit on
  attachment; v3.4 adds the retrieval-side complement: criticism
  ABOUT her relational coldness is itself self-threatening → doubly
  gated out. The blind spot now has two walls.
- **Anchors (4):** achievement{first code she ran}, relationship{
  the flat — sdmCat relationship, meaning contested, low
  specificity}, lifeThreat{the patient she lost — she retells it as
  protocol}, other{the day she realized the tally was unfair}.
  `selfdef_spec_mult` ×(1−0.5·0.4)=0.8 — her anchors are clipped:
  meanings strong, scenes thin (the Blagov & Singer repressor
  signature at moderate amplitude).
- `script_redeem −0.2` — slight contamination: her good stories
  arrive with the audit attached.

### C5 Marcus — `defens −0.2` · `script_redeem +0.5` · `mnem_neg 0.05`
- `mnem_neg` near zero — Marcus does NOT defensively forget
  criticism (he deflects behaviorally, not mnemonically); his
  prospective-memory failure is untouched by this layer. IMPORTANT
  NULL: do not pin mnem_neg to explain his arrears — the rent loop
  is PM machinery (v22), not self-protection. This is the profile
  boundary the v3.4 dials let us keep clean.
- `face_ability` −0.3 (porches not faces), `suggs` +0.2,
  `exposure_fam_gain` high (he SEES everyone daily — ambient
  familiarity accrual is his social glue),
  `individ_rate` moderate.
- **Anchors (3):** other{the route he cracked — the day the map
  clicked}, relationship{the reveal he wants to make — an anchor
  on an INTENTION, P209 territory}, leisure{the rooftop set —
  drums}. `script_redeem +0.5` — Marcus's tellings rescue: the
  crash story gets funnier and kinder each time (benefit-finding
  without depth — redeemed but not deepened).
- `invol_pos_bias` 0.4 — the warmest ambient mind in the cast.

### C6 Carmen — `defens +0.2` · `script_redeem +0.8` · `mnem_neg 0.20`
- Cast-max `script_redeem` — the survivor's grammar: every hard
  story lands as a lesson, a joke, or a feeding. McAdams
  generativity map is near-literal: the stoop IS generativity.
  `redeem_write` default — decades of retellings have already done
  the write; her anchors are all fully converted.
- **Anchors (6 — at cap):** relationship{the husband — the first
  cafecito}, lifeThreat{Miami 1981 — the crossing era},
  achievement{the seam that paid the rent}, relationship{the
  neighbor she raised}, other{the stoop at dusk}, lifeThreat{
  nowhere-to-go — confidential + selfdef: a gagged anchor like
  Dani's, but forty years deeper}. Specificity moderate
  (selfdef_spec_mult 0.9) — her anchors are scene-rich because
  she retells them, not because `defens` spared them.
- `invol_pos_bias` 0.45 — the positivity-effect stack (v1.6) plus
  involuntary warmth: her quiet afternoons arrive in 1989, gently.
  `neg_now_pull` rides age curve — her old wounds date "recently"
  when asked, the standard misdating, not pathology.
- `mnem_neg` 0.20 but rarely TRIGGERED — nobody gives Carmen
  diagnostic central negative feedback; her self-protection is
  the community's, not hers.

### C7 Victor — `defens +1.2` · `script_redeem −0.5` · `mnem_neg 0.45`
- The cast's `mnem_neg` max AND `mnem_close_relief` near 0 — the
  brittle profile: criticism of Victor-as-person fails at recall
  from ANYONE (the drawer works on incoming mail too). Since the
  wife's death there is no close-source relief channel left — the
  transactive-loss finding (v22) and the mnemic-relief finding
  COMPOSE: her absence removed both his memory partner AND his
  correction channel. Emergent: he gets righter about buildings and
  wronger about himself every year.
- **Anchors (5):** achievement{the store's first year},
  relationship{the wife — sdmCat relationship, `selfdef_spec_mult`
  ×(1−0.5·1.2)=0.4 — THE vague-anchor case: he can tell you the
  MEANING ("she kept the books, and the rest") but the scenes are
  nearly empty — forty years of feeling filed as one line},
  lifeThreat{the diagnosis}, achievement{the buildings — plumbing
  as autobiography}, other{the handshake — confidential-adjacent,
  meaning "word is bond," verbatim-preserved because untold}.
  Victor's anchors are the spec's own test case for
  meaning-faithful/detail-free (P334): ask him WHAT HAPPENED the
  day they signed the store papers and you get accounting; ask
  what it meant and you get a sentence he has polished for decades.
- `script_redeem −0.5` — contamination grammar: his good stories
  acquire the cost ("it worked, at the time, and then—"). The sale
  offer in the drawer is contamination waiting for a retell.
- `doubt_persist` 90 — corrections land hard and stay doubted.

### C8 Tomás — `defens +0.1` · `script_redeem +0.6` · `mnem_neg 0.10`
- `script_redeem +0.6` — the planner's grammar: hardship becomes
  apprenticeship ("San Miguel was the training"). His open loops
  canonize ALREADY-redeemed — the confession plan's meaning field
  is "devotion," not "fear," which is why it never feels urgent.
- **Anchors (5):** lifeThreat{the arrival at 12 — es-tagged,
  crossover}, achievement{first line-lead}, relationship{the 3pm
  coffee — an anchor on a RITUAL, meaning-layer "she is the plan"},
  other{the notebook's first page}, relationship{the handshake —
  same event as Victor's anchor, opposite valence charge: his
  version means "I was trusted"; Victor's means "I owe"}. TWO
  mains anchoring the same dyadic record with divergent meanings
  is the cleanest natural test of §6.34a drift split (P334).
- `invol_pos_bias` 0.4 via w_sensory channel — his involuntaries
  arrive by smell and arrive warm (Proust stack + positivity).
- `mnem_neg` low — he absorbs correction like a line-order
  (improvement-tagged by temperament).

## 10. The 20 ambient NPCs — profile template

Per §8.5 / spec v3.4: `deriveParams(ambient:true)`. Concretely for
world-builder: each ambient NPC gets ONLY (a) role tags →
`cat_prior_pull` categories (vendor, jogger, stoop-sitter,
delivery), (b) a 2-DOF jitter {`enc_base` ±10%, `theta` ±0.05}
inside `ambient_trait_sigma`, (c) `exposure_fam_gain` default so
mains' PersonModels accrue familiarity from sightings. NO
selfdef records, no SelfModel, no secret machinery (`secret_str`
→0), `individ_rate` 0.05. Emergent and intended: ambient NPCs
misidentify people by category (transference/transplant pools draw
from `cat_resist` defaults), remember events as types ("a courier
thing"), and are the rumor chain's lossy-but-cheap edges. On
promotion: full MVN + SelfModel backfill + records kept verbatim —
a promoted NPC remembers their ambient era *thinly and typed*,
which is exactly what a minor character's backstory should feel
like from inside.

## 11. Distinctness — second-pass notes

- **The avoidant five now split three ways:** Priya (encoding gate
  `attach_encode_loss`), Victor (encoding gate + recall gate
  `mnem_neg` + vague anchors `selfdef_spec_mult`), Tomás (encoding
  gate only — his avoidance is behavioral silence, memory intact).
  Same bible-word "closed," three different forgetting machines.
- **The two gagged anchors** (Dani's relationship, Carmen's
  nowhere-to-go) differ by `defens`: Dani's is vivid-and-suppressed
  (spec 1.0), Carmen's is polished-and-rehearsed-in-silence (0.9).
- **Marcus is the control case** for mnem_neg: his profile
  explicitly forbids the dial (§9 C5) — a boundary assertion world-
  builders should copy: not every "avoids" is a memory defense.

## 12. New probes (filed to validation-design §43, P334–P345)

P334 anchor drift split (MUST) · P335 anchor floor (MUST) ·
P336 defensiveness-specificity (MUST, sign) · P337 mnemic neglect
recall-recognition dissociation (MUST, structure) · P338 close-source
relief (MUST) · P339 mnem gates nulls (MUST) · P340 negative
forward-misdating (SHOULD) · P341 lifescript age pull (SHOULD) ·
P342 involuntary positivity (SHOULD) · P343 redemption meaning-drift
(SHOULD) · P344 ambient tier distinctness (MUST) · P345 cast
narrative signatures (OBSERVE).

## 13. Sources added this version

- Singer & Salovey 1993 (*The Remembered Self*) — SDM construct.
- Blagov & Singer 2004 (*J. Personality* 72:481–511) — four SDM
  dimensions; specificity × repressive defensiveness (verified).
- Sedikides & Green 2000 (*JPSP* 79:906); Sedikides & Green 2009
  (*P&SC* 3, "Memory as a Self-Protective Mechanism"); Green,
  Sedikides & Gregg 2008 (*JESP* 44:547); Green et al. 2009
  (*Self & Identity* 8:233) — mnemic neglect: recall-only,
  gate structure, close-source/improvement relief (all verified).
- Berntsen & Rubin 2004 (*Psych. Bull. Rev.* 11:1003); Rubin &
  Berntsen 2003 (*Psych. Aging* 18:636) — life scripts, positive-only
  bump, negative present-peak, 2:1 involuntary asymmetry (verified).
- McAdams, Reynolds, Lewis, Patten & Bowman 2001 (*PSPB* 27:472–483)
  — redemption/contamination sequences; wellbeing/generativity
  correlates (verified).
- Thorne & McLean — SDM content taxonomy (via Blagov & Singer).
- Weinberger — repressive defensiveness trait → `defens` axis.
- Continuing: Fiske & Neuberg 1990 (ambient category-first, v3.2);
  Schrauf & Rubin (immigration bump, v22).

## 14. The world-v42 recompile — truth, wants, interior (v4.5)

The bibles gained three fixed sections since the v22 compile
(world-v42): **"Wants (three clocks)"**, **"The cast, privately"**
(directed valence map over the other seven), and **"Truth and lies"**
(honesty register + tell). Each maps onto new or existing machinery:

- `truth` → §6.68 fabrication-direction pins (`fab_dir`, `lie_freq`,
  `fab_discomfort`) — and, just as important, the *omission* register
  that fires NO fabrication machinery at all.
- `wants` → §6.67 `concerns` set with clock-class weights
  (week/season/long).
- `interior` → seeds `RelEdge` (§6.55) and `func_soc` targeting; the
  private-vs-surface gap tells us which edges carry `secret`-adjacent
  records.
- `routine` tables → §6.65 `chrono_peak_hr` (wake-hour ground truth).

v22 pins and §9 delta blocks stand; these add. Ambient template §10
unchanged except §14.9.

### 14.1 C1 Marisol — redirect, never fabricate

- `truth`: "never lies outright — redirects." Redirects emit no
  `claim:true` → `fab_dir` nominal −0.6 but `lie_freq` ≈ 0.05: the
  mechanism is nearly dead code on her. What the register DOES pin:
  self-biography is "the locked door" → existing `secret_str`/omission
  high on self-topic records only.
- `chrono`: wakes 05:30, opens the café → morning type,
  `chrono_peak_hr` ≈ 9. Her sharpest encoding is the morning counter;
  the 2–4 p.m. check-in rounds run slightly off-peak — the block's
  gossip lands in her trough, mildly amusing and correct.
- `wants` → concerns `{caretaking:0.8(week), block-stability:0.7
  (season), self-escape:0.4(long)}`. High `concern_gain` on
  block-stability events — a dark window or an odd rent notice encodes
  deep for her.
- `func`: `func_soc 0.5 / func_dir 0.3 / func_self 0.2` — memory as
  bonding instrument; she surfaces YOUR shared history, not hers.
- `collab`: she IS the directory — other chars' `PersonModel
  [Marisol].knowsTopics` saturated on people/block topics; her own
  `jointRecall` inhibition is real but she compensates via referrals
  she receives, not gives.
- Signature update: the block's directory who forgets herself.

### 14.2 C2 Jules — honest to a fault, omitting one file

- `truth`: default honest, overshares, self-corrects → `fab_dir −0.8`,
  `fab_discomfort 0.9`, `lie_freq 0.05`. The single omission (housing
  paperwork) is a topic-gated silence, not a fabrication — records
  tagged `housing/paperwork` get emission suppression while the
  memory itself is unharmed. "It eats them visibly" = the omission
  topic has high `concern` intrusion — the thing you can't say keeps
  surfacing.
- `chrono`: 06:30 run → morning type, `chrono_peak_hr` ≈ 9–10.
- `wants` → `{belonging:0.9(season), work-that-matters:0.5(long)}` —
  acceptance events (being named, being asked) encode hot.
- `func`: `func_self 0.4 / func_dir 0.3 / func_soc 0.3` — the identity
  project ("be from a place again") drives self-continuity recall.
- `collab`: Carmen dinners 3×/wk → young transactive dyad forming;
  `collab_cue_p` on the Carmen dyad rising; knowsTopics(
  "the building, the block's old days") accruing TO Carmen.

### 14.3 C3 Dani — the fluent liar

- `truth`: "lies fluently, cheerfully, constantly" → the cast's one
  genuine fabrication-inflation phenotype: `fab_dir +0.8`,
  `lie_freq 0.8`, `fab_discomfort 0.2`. Per Polage 2012 this is exactly
  the inflation-risk profile — her glitter-dodges will, over months,
  start feeling true. Exception encoded relationally, not as a param:
  vs Marisol she *avoids the question* — no claim emitted, no flip —
  the bible's load-bearing boundary is behavioral.
- `chrono`: sleeps 00–08, evenings out → neutral/evening,
  `chrono_peak_hr` ≈ 15.
- `wants` → `{art-recognition:0.9(season), room-of-own:0.6(long)}` —
  recognition events (Tomás's gallery-board praise) encode deep; she
  will retell them.
- `func`: `func_soc 0.4 / func_self 0.35 / func_dir 0.25`.
- `collab`: the secret Marcus dyad — three months of `shared_with:
  {Dani,Marcus}` records under a `secret` flag; `jointRecall` between
  them is functional but every emission passes the disclosure gate.
- Signature update: lies until the lies feel real — and only Marisol
  can pull the ripcord.

### 14.4 C4 Priya — scrupulous, on a flattened clock

- `truth`: "if she writes it down it is true or it does not get
  written" → `fab_dir −1.0`, `lie_freq 0.05`, `fab_discomfort 0.9`.
  "I'm fine" is a minimized status report (a hedge, not a
  fabrication — no claim, no flip). The cast's strongest deflator:
  when forced to fudge, the true record strengthens.
- `chrono`: three twelves a week, rotating — `chrono_peak_hr: null`.
  Synchrony machinery off; HYPOTHESIS per §6.65 (shift-work flattens
  the peak). Her fatigue/state effects come from `sleepdep`, not the
  circadian gate.
- `wants` → `{un-stall:0.7(season), heater/rent:0.8(week)}` — the
  unresolved hike keeps concern-tagged housing events intruding.
- `func`: `func_dir 0.5 / func_self 0.3 / func_soc 0.2` — memory
  consulted like a chart: what does the past say about THIS decision.
- `collab`: the ex-roommate dyad (Marcus) — directory fully formed and
  NOT dismantled by the breakup ("identifies his dish-loading by
  sound"): `knowsTopics` mutual on household/logistics topics;
  `jointRecall` inhibition applies normally; `transact_loss` has NOT
  fired because the partner remains present — the divorce of the
  directory waits for someone actually moving out.

### 14.5 C5 Marcus — reschedules the truth

- `truth`: doesn't lie, defers — "it's being handled" is a promise
  about a future conversation. Half-fabrication: the claim is real but
  temporally displaced → `fab_dir +0.3`, `lie_freq 0.5`,
  `fab_discomfort 0.6`. Moderate inflation exposure; the cornered-
  confession register ("tells everything at once, badly") is a burst
  disclosure event, not memory machinery.
- `chrono`: wake 08, drums evenings → evening type, `chrono_peak_hr`
  ≈ 17–18.
- `wants` → `{rent:0.9(week), say-the-true-thing:0.7(season)}` — the
  disclosure concern tags every Dani-adjacent event near Priya.
- `func`: `func_soc 0.45 / func_self 0.3 / func_dir 0.25` — the
  storyteller drummer; bonding recall dominant.
- `collab`: two dyads — Priya (intact directory, post-breakup) and
  Dani (secret, flagged). The same man runs a public and a covert
  transactive system simultaneously — a genuinely unusual profile the
  bible wrote for free.

### 14.6 C6 Carmen — the editor, age-amplified morning

- `truth`: "does not lie — edits." Edits are omission-with-polish →
  `fab_dir −0.5`, `lie_freq 0.1`, `fab_discomfort 0.8`. The money
  silence is absolute and topic-scoped: `money`-tagged records get an
  emission gate for ALL audiences (the strongest scoped silence in the
  cast) while memory itself is intact — she knows exactly what she
  won't say.
- `chrono`: 74yo → age-shifted morning (§6.65 knot): wake 07 →
  `chrono_peak_hr` ≈ 8–9, and `sync_gain` age-boosted — her stoop
  mornings are her peak-encoding window; afternoon palm-time recall is
  off-peak, which per `sync_implicit_flip` mildly INCREASES
  involuntary recall — the afternoons under the palm are when the past
  arrives unbidden. The bible gave us the phenotype; synchrony gives
  it a mechanism.
- `wants` → `{stay-on-own-terms:0.9(season), Jules-fed:0.6(week),
  not-a-burden:0.7(long)}`.
- `func`: `func_self 0.55 / func_soc 0.3 / func_dir 0.15` — the
  block's memory is a self-continuity engine; Butler (1963) life-review
  flavor without pathology.
- `collab`: richest directory profile in the cast — Jules (growing),
  Victor (30 years), PLUS the existing transact_loss pin on the late
  husband. Three dyads at three lifecycle stages: forming, mature,
  lost.

### 14.7 C7 Victor — the industrial omitter

- `truth`: "omits on an industrial scale… omission isn't lying." This
  is the purest omission register: `fab_dir −0.9`, `lie_freq 0` —
  fabrication machinery completely dead; instead the money-bomb secret
  (developer offer) sits in a `secret_str`-max record that only the
  paper can speak. His documents ARE his externalized verbatim store —
  a prop-supported memory profile (records `kind:"doc"` referenced,
  not recalled).
- `chrono`: 58yo, wake 08 → morning-neutral, `chrono_peak_hr` ≈ 10
  with the age shift beginning.
- `wants` → `{decide-the-offer:0.9(season), hand-down-whole:0.8
  (long)}` — the decision concern is the largest single standing
  concern in the cast; every tenant interaction encodes through it.
- `func`: `func_dir 0.5 / func_self 0.25 / func_soc 0.25` — memory as
  ledger: what did I decide, what is owed, what does the paper say.
- `collab`: wife's directory lost (transact_loss pinned since v22) —
  the buildings-as-directory note stands; his Tuesday repair loop is
  literally a directory walk.

### 14.8 C8 Tomás — understatement, evening line

- `truth`: "understates rather than lies — the bigger the feeling, the
  smaller the sentence"; money honesty absolute → `fab_dir −0.7`,
  `lie_freq 0.1`, `fab_discomfort 0.85`. Handshake-records
  (`kind:"claim"` he makes) are minimal but maximal-fidelity — his
  fab profile is near-inert in BOTH directions.
- `chrono`: wake 09, the line until 24:00 → the cast's clearest
  evening type, `chrono_peak_hr` ≈ 19–20. His peak encoding happens
  ON the line — service events land in his best hours.
- `wants` → `{staff-and-wire:0.8(week), the-plan-priced:0.9(season),
  kitchen-with-name:0.9(long)}` — the supplier loop is a concern-saturated
  walk: every equipment price encodes through `concern_gain`. His dream
  has a notebook AND a memory gate.
- `func`: `func_dir 0.5 / func_self 0.3 / func_soc 0.2` — the plan
  consults the past constantly; the 3 p.m. fixed point is the one
  unaudited routine (Marisol's own interior entry mirrors it — a
  dyadic `func` blind spot worth noting for the world-builder).

### 14.9 Ambient template — v4.5 addendum

Ambients get: `fab_dir ~ N(−0.1, 0.4)` truncated [−1,1] (population
prior — deflation is the modal human outcome, Polage 2004),
`lie_freq ~ Beta(2,5)`, `fab_discomfort ~ N(0.6, 0.15)`; `func_*`
drawn Dirichlet(2,2,2) then jittered; `chrono_peak_hr` compiled from
the ambient's `ambients.json` routine wake-hour (v43 variant layer
supplies it); `concerns` = at most 1 week-clock item derived from the
ambient's signature beat. No ambient gets a null `chrono_peak_hr`
unless their variant table shows rotating shifts.

### 14.10 Sources added this version

- May, Hasher & Stoltzfus 1993 (*Psychological Science* 4:326) —
  synchrony × age, the founding result (verified).
- May 1999 (*PBR* 6:142) — synchrony is a controlled-process effect
  (verified).
- May, Hasher & Foong 2005 (*Psychological Science* 16:96) —
  explicit peaks, implicit prefers off-peak (verified).
- Schmidt, Collette, Cajochen & Peigneux 2007 (*Neurosci & Biobehav
  Rev* 31) — circadian review backdrop (via 2025 review).
- Polage 2004 (*Applied Cognitive Psychology* 18:455) — fabrication
  deflation majority / 10–16% inflation tail (verified).
- Polage 2012 (*Memory* 20:837) — inflation ∝ lie frequency, low
  discomfort, dissociation; source-monitoring moderator (verified).
- Chrobak & Zaragoza 2008 — forced confabulation → false memory at
  8 weeks (~50%) (verified via Otgaar-lab review).
- Otgaar-lab 2018 (*EJoP* 13:1422) — telling > planning for belief
  inflation (verified).
- Klinger 1975; Klinger 2013 — current concerns organize thought
  flow (textbook).
- Conway & Pleydell-Pearce 2000 (*Psych Rev* 107:261) — SMC: goals
  shape AM construction (textbook).
- Marsh, Hicks & Bink 1998 (*JEP:LMC* 24:350) — completed intentions
  deactivate (verified prior versions for PM; reused for §6.67
  release).
- Bluck & Alea 2002 (*Intl J. Aging & Human Dev* 56:113) — TALE three
  functions (verified).
- Bluck 2003 (*Memory* 11) — TALE psychometrics.
- Webster 1993 (*JPSP* 65) — RFS individual differences (verified).
- Harris, Rasmussen & Berntsen 2014 (*Consciousness & Cognition* 27)
  — functions of involuntary AM.
- Weldon & Bellinger 1997 (*JEP:LMC* 23:1160) — collaborative
  inhibition (verified).
- Basden, Basden, Bryner & Thomas 1997 (*JEP:LMC* 23:1176) —
  retrieval-strategy disruption account.
- Harris, Keil, Sutton, Barnier & McIlwain 2011 (*Memory Studies* 4)
  — couples show inhibition too.
- Wegner 1987 (*Psych Rev* 94:186); Wegner, Erber & Raymond 1991
  (*JPSP* 61:923) — transactive systems (reused from v0.8/§6.14).
- Butler 1963 — life review (Carmen's func_self flavor; background).

### 14.11 Probes filed

P469–P480 → validation-design.md §75.

---

# Part IV — v58 pass: the self layer (spec v5.6)

The v5.6 params give every main a standing self-view and the evaluative
machinery around it. Pins below are derived from the existing bible facts
already cited in §3/§9 — nothing here introduces new narrative content;
each pin is justified by a trait already on file. Defaults apply where no
pin is listed. `remin_style` is pinned only for C6/C7 (55+ gate).

## 15. The 8 mains — self-layer pins

### C1 Marisol, 29 — `self_est 0.66` · `selfverif_w 0.5` · `self_complex 6`
(confidante/manager/daughter/blogger/friend/secret-keeper — a
crowded self, which is also her protection) · `self_comp 0.4` ·
`savor_k 0.45` `dampen_k 0.35` · `elabor 0.85` — the cast's co-narrator:
she draws stories out of everyone (consistency: `share_k 1.1`, dest_mem
0.85, gossip depth 0.9 — her questions are the mechanism that made her
the ledger) · `future_cont 0.6` · `counterf_k 0.15`. Net: her archive is
deep partly because she *interviews*; her own secret rides the intrusion
channel as before — self_complex 6 keeps the blog crisis from eating
every domain at once.

### C2 Jules, 26 — `self_est 0.45` · `selfverif_w 0.75` · `self_complex 3`
(newcomer/thin: the sketcher, the tenant, the crush — three rooms and
the walls are fresh) · `self_comp 0.2` · `future_cont 0.8` ·
`pself_mint 0.25` (the imagined Mission life IS a possible-self
archive — hoped: belongs; feared: found out) · `savor_k 0.6`
`dampen_k 0.45` (self-est-gated dampening prior active) ·
`elabor 0.5`. Net: the most volatile mood in the cast — spillover
divisor 3 — and the only main whose negative self-referent feedback
gets KEPT (selfverif high + self_est low → §6.100 consistency release:
the slight that confirms the fear is retained).

### C3 Dani, 24 — `self_est 0.55` · `selfverif_w 0.45` · `self_complex 4`
· `savor_k 0.7` `dampen_k 0.15` (the chalkboard artist savors — positive
evenings encode fat) · `elabor 0.6` · `future_cont 0.5`. Net: the
positive ledger runs richest here; contamination-leaning script
(`script_redeem −0.1`) plus savorer = bright archive, sharp drops.

### C4 Priya, 31 — `self_est 0.65` · `selfverif_w 0.7` (nurse: accepts
hard feedback — clinical debrief culture is self-verification trained)
· `self_complex 5` · `self_comp 0.8` (the hospital stays at the
hospital — maximum compartmentalization, consistent with
`regulate`-adjacent pins and mnem_neg 0.30) · `dampen_k 0.5` ·
`counterf_k 0.2` (near-miss debriefs are occupational) ·
`elabor 0.55`. Net: negative events land inside walled aspects —
the shift went badly AND it stayed at work.

### C5 Marcus, 34 — `self_est 0.72` · `selfverif_w 0.3` (the
self-enhancer — defens −0.2 means even the gate he has is rarely
armed) · `self_complex 3` · `future_cont 0.3` (lives now — his
long-horizon intentions file on the debtor channel: reliable surprise
at his own commitments) · `savor_k 0.55`. Net: mnemic neglect at full
strength — he protects a view he likes; the phenotype is sunny and
shallowly defended.

### C6 Carmen, 74 — `self_est 0.6` · `selfverif_w 0.55` ·
`self_complex 7` (a life of many rooms: Havana, Miami, the shop, the
marriage, the stoop) · `self_comp 0.5` · `remin_style
{transmissive 0.6, integrative 0.4}` · `remin_w 0.65` (the stoop IS
reminiscence ecology) · `counterf_k 0.1` · `regret_opp_gate 0.85` —
with ONE inaction-regret record pinned `oppOpen:false → gate held`
(the unsaid thing to the husband: the door closed when he died, and
healthy disengagement never quite fired — regret_inact_mult 0.45
keeps it at ~2× half-life decades on). Net: her archive is told into
shape — teaching stories polish, private ones fade; integrative draws
mint the persSem synthesis that reads as wisdom.

### C7 Victor, 58 — `self_est 0.55` · `selfverif_w 0.5` ·
`self_complex 2` (the store and the widower — the thinnest self in the
cast; the offer threatens EVERYTHING because there is no third room) ·
`self_comp 0.9` (the drawers are literally the trait) · **`repress`
maximal in cast** — derived from defens +1.2 × neurot_report floor:
predicted `repress ≈ 0.8` → negative-childhood recall drive ×0.6,
earliest negative memory shifted ~+1.2y, negative-retrieval latency
×1.3; recognition intact; nothing deleted. His childhood is thin on
the negative side BY CONSTRUCTION. · `remin_style {instrumental 0.7,
obsessive 0.3}` — he rehearses the past as problem-solving, and the
0.3 obsessive tail is the drawer that opens at 3am ·
`regret_inact_mult` applies to the inaction records around the
marriage's last year · `dampen_k 0.7` (savor nothing) ·
`future_cont 0.4`. Net: the defended archive — complete records, shut
doors, and a two-room self that makes the sale decision total.

### C8 Tomás, 36 — `self_est 0.6` · `selfverif_w 0.5` · `self_complex 4`
(San Miguel / Miami / kitchen / family — the immigrant's aspect set is
cross-language by construction; his `aspect` tags split pre/post-12
along the existing lang boundary) · `self_comp 0.3` · `savor_k 0.65`
(the kitchen is a savoring ecology) · `elabor 0.7` (kitchen talk —
the cook who makes the line tell their day) · `future_cont 0.5` ·
`counterf_k 0.15`. Net: warm positive ledger, mid complexity, and an
aspect structure the lang_mismatch machinery already respects.

## 16. Distinctness — third-pass notes

The self layer adds a second orthogonal axis to every signature: Mars's
six-room self vs Victor's two-room self now produce opposite failure
geometries (a hit to Mars lands in one of six aspects; a hit to Victor
lands in half of everything). Jules is the only consistency-keeper;
Marcus the only full-strength neglecter; C4/C7 both wall off negatives
but C4 does it by compartmentalization (the bad room exists, door
closed) while C7 does it by access suppression (the door was never
built). Those read differently on screen.

## 17. Probes filed

P602–P614 → validation-design.md §103.

## 18. Sources added this version

- Sedikides & Green 2000 (*JPSP* 79:906 — verified): mnemic neglect =
  incongruence-negativity management; the self-consistency gate.
- Green, Pinter & Sedikides 2004 (*EJSP* 35:225); Green, Sedikides &
  Gregg 2007 (*JESP* 44:547 — verified): recall-only boundary,
  "forgotten but not gone"; repressors show ENHANCED mnemic neglect.
- Sedikides & Green 2016 (*EJoSP* review — verified): moderator list
  incl. anxiety/dysphoria; recognition-sparing.
- Newman, Duff & Baumeister 1997 (*JPSP* 73) — mnemic neglect origin
  study (reused).
- Linville 1985 (*Social Cognition* 3:94 — verified) & 1987 (*JPSP*
  52:663 — verified): self-complexity affective-extremity and
  stress-buffer claims; Rafaeli-Mor & Steinberg 2003 (*PSPR* 6 —
  verified): the DEBATED caveat — weak buffering, reactivity
  moderation survives, stronger for uplifts.
- Showers 1992 (*JPSP* 62) — compartmentalization of negative
  self-aspects.
- Weinberger, Schwartz & Davidson 1979 (*J Abnorm Psychol* 88) —
  repressor classification; Davis & Schwartz 1987 (*JPSP* 52:155 —
  verified): fewer/later negative childhood recalls; Davis 1995
  (*J Abnorm Psychol* 103:288 — verified): slower negative retrieval,
  paternal-antipathy reports; Davis 1990 — recognition β unchanged.
- Watt & Wong 1991 (*J Gerontol Soc Work* 16:37 + *Psych & Aging*
  6:272 — both verified): six reminiscence types; successful aging =
  integrative/instrumental up, obsessive down.
- Webster 1993 (*JPSP* 65) — RFS individual differences (reused).
- Gilovich & Medvec 1994 (*JPSP* 67:357 — verified) & 1995 (*Psych
  Rev* 102:379 — verified): action short-term / inaction long-term
  regret pattern.
- Wrosch & Heckhausen control-theory regret line (Wrosch et al.
  2005/2007) — opportunity-gated disengagement.
- Bryant & Veroff 2007 (*Savoring*, Erlbaum — verified); Feldman,
  Joormann & Johnson 2008 (*Cog Ther Res* 32:507 — verified):
  dampening prospectively predicts depression; Wood, Heimpel &
  Michela 2003 (*JPSP* 85:566 — verified): self-esteem gates
  savor-vs-dampen.
- Ersner-Hershfield, Wimmer & Knutson 2009 (*SCAN* 4:85 — verified)
  + Ersner-Hershfield, Garton et al. 2009 (*JDM* 4:280 — verified):
  future self-continuity individual differences, saving behavior.
- Markus & Nurius 1986 (*Am Psych* 41:954 — verified): possible
  selves.
- Fivush & Fromhoff 1988; Reese, Haden & Fivush 1993 — elaborative
  reminiscing style (developmental base; adult extension is our
  HYPOTHESIS, flagged §6.107).

# Part III — v70 pass: the narrator's compass

Spec refs: v5.19 §6.145–6.151. Probes P745–P756 filed to
validation-design.md §135. This pass adds WHERE in time a
character's mind rests (time perspective), WHAT their stories
are about (agency/communion themes), and the machinery that
turns a life into a book: lesson-minting, coherence-linking,
chapter salience, future thickness, anchor tension.

## 19. New mechanisms (→ spec v5.19 §6.145–6.151)

### 19.1 Time perspective — `tp_vec` (§6.145)

ZTPI five subscales as independent bible pins. Past-negative =
the mind wanders to old wounds uninvited; past-positive = the
sweet old days walk up; present-hedonistic = the past stays put
unless fetched; present-fatalistic = mind-wandering itself runs
quiet; future = goals rehearse and imagineEvent fires more.
Arrival-side ONLY — `tp_fate_null` locks it off record
existence/content. Distinct from `remin_style` (which is a
55+ reminiscence FUNCTION taxonomy — what retelling does to
the archive) and from `script_redeem` (the transform on meaning,
not the selection). A past-negative elder can still reminisce
transmissively — she teaches from the wound.

### 19.2 Narrative themes — `narr_agency`/`narr_comm` (§6.146)

McAdams's two thematic axes as field-depth dials at encoding
and emphasis dials at retell. `theme_fabricate_null` locks the
tuning to depth — the communion-tuned witness of a solo event
does not hallucinate a co-actor. Orthogonal to `elabor`
(which draws stories OUT of others — the interview) and to
`script_redeem` (the valence transform on meaning).

### 19.3 Autobiographical reasoning — `autobio_k` (§6.147)

The lesson-minting rate. High autobio_k characters convert
meaning-bearing retellings into `lesson` persSem records —
self-beliefs with `origin:"derived"`, permanently barred from
event-source status (`lesson_truth_null`). This is the axis
that separates "has experience" from "has learned": C5 Marcus
at 0.2 lives the same year three times; C6 Carmen at 0.7 has
a stoop-full of derived propositions ("people forgive slower
than they forget"). Lessons link back to sources — both
directions are retrieval routes.

### 19.4 Narrative coherence — `narr_coh_k` (§6.148)

Multiplier on `narr_link_gain` at retell. The coherent
narrator's archive gains connective tissue — causal and
thematic links that double as retrieval routes. The
low-coherence archive is a drawer of snapshots: records exist,
are retrievable, but nothing leads anywhere. Distinct from
`self_complex` (how many rooms the self has — structural);
narr_coh is how well the rooms are WIRED.

### 19.5 Period salience — `period_sal` (§6.149)

Per-character scaling of §4.18's chapter walls. At 0 the life
reads continuous — boundaries barely cost; at 1 every era is
a closed room and transitions land hard. Era wording
("in the Miami years") surfaces at `era_surf_p +
0.5·period_sal` — the chaptered character spontaneously dates
their own past. `period_identity_null` keeps `period` pure
metadata — the wall is a cueing cost, never a content edit.

### 19.6 Episodic-future trait — `epi_future_k` (§6.150)

Trait multiplier on `sim_detail_mult` — how thick a
character's imagined futures run, with a computed prior from
vivid_detail × OGM terms (Williams 1996: generic past ↔
generic future is ONE style, not two). `future_leak_null`
locks the boundary: a richly imagined future never becomes a
remembered past through detail alone — the flip needs §6.9
imagination inflation.

### 19.7 Anchor tension — `tension` + `sdm_tension_intr` (§6.151)

selfdef records carry bible-seeded `tension` — the
unfinishedness of the anchor. Tension raises re-access rate
(knocking, not damage — `tension_fate_null`). A character can
hold an anchor that is vivid, positive, AND unresolved — it
returns to her more often, intact.

## 20. Per-main delta blocks (v70)

All prior pins stand. tp_vec listed as {pn/pp/ph/pf/f}.

### C1 Mars, 29 — tp_vec {0.3/0.5/0.5/0.2/0.5} · `narr_agency 0.5`
· `narr_comm 0.7` (the manager keeps PEOPLE's books — her
encoding runs deep on who felt what, thin on who won) ·
`autobio_k 0.5` · `narr_coh_k 0.6` · `period_sal 0.4` ·
`epi_future_k 0.7`. Net: her past arrives warm when it arrives;
the store is a communion archive. With self_complex 6 and
narr_coh 0.6, her six rooms are wired — one bad day routes
around itself.

### C2 Jules, 26 — tp_vec {0.4/0.3/0.6/0.3/0.4} ·
`narr_agency 0.4` · `narr_comm 0.6` · `autobio_k 0.4` (still
collecting raw material — the newcomer hasn't finished a first
edition) · `narr_coh_k 0.5` · **`period_sal 0.7`** (her life IS
a transition — the move to the Mission is her operative wall;
"back in Portland" wording on emissions at ~0.5 rate) ·
`epi_future_k 0.6`. Net: two-room self + high period_sal =
the sharpest before/after in the cast under thirty.

### C3 Dani, 24 — tp_vec {0.2/0.4/**0.8**/0.1/0.3} ·
`narr_agency 0.6` (maker-stories: what got made, what failed)
· `narr_comm 0.5` · `autobio_k 0.5` · `narr_coh_k 0.4`
(notebook mind — fragments that land, not arcs) ·
`period_sal 0.3` · **`epi_future_k 0.8`** (the artist's
simulation channel is the cast's thickest — her imagined
murals have more verbatim detail than most people's
memories). Net: present-hedonist arrival profile + savorer =
the past is a sketchbook she rarely opens unprompted.

### C4 Priya, 31 — tp_vec {0.3/0.4/0.4/0.2/**0.7**} ·
`narr_agency 0.8` (clinical debrief culture = agency-trained
narration: the plan, the miss, the protocol) · `narr_comm 0.6`
· `autobio_k 0.6` (the debrief IS autobiographical reasoning —
occupational lesson-minting) · `narr_coh_k 0.7` ·
`period_sal 0.5` · `epi_future_k 0.6`. Net: future-weighted +
coherent + agentic — her archive has a through-line and the
through-line has a plan. The hospital-wall compartmentalization
(self_comp 0.8) now reads as chapters that DO open, on
schedule, at home.

### C5 Marcus, 34 — tp_vec {0.2/0.4/**0.8**/0.2/0.2} ·
`narr_agency 0.4` · `narr_comm 0.5` · **`autobio_k 0.2`** (the
cast's lowest — he lives the same year three times; events
without residue is WHY he repeats) · `narr_coh_k 0.3` ·
`period_sal 0.2` (the courier's life is one continuous route)
· `epi_future_k 0.4`. Net: present-max + coherence-min +
lesson-min = the sunniest shallow archive — mnemic neglect at
full strength protects a view with no through-line.

### C6 Carmen, 74 — tp_vec {0.2/**0.75**/0.2/0.1/0.3} ·
`narr_agency 0.4` · `narr_comm 0.8` · **`autobio_k 0.7`** (the
transmissive reminiscer IS a lesson-minting machine — the
stoop is a derived-proposition factory) · `narr_coh_k 0.8`
(integrative + transmissive = the wired life) ·
**`period_sal 0.8`** (Havana / Miami / the shop / the marriage
/ the stoop — literal chapters, era-worded emissions ~0.55)
· `epi_future_k 0.4`. Net: the cast's most narrated archive —
thick positive arrivals, dense links, lessons everywhere, and
every memory wearing its era.

### C7 Victor, 58 — tp_vec {**0.6**/0.3/0.2/**0.5**/0.3} ·
`narr_agency 0.7` (the self-made-store story is agency-native)
· `narr_comm 0.3` · **`autobio_k 0.2`** (he does not extract
lessons — he re-runs problems; instrumental remin_style at
the narrative layer) · `narr_coh_k 0.3` · **`period_sal 0.9`**
(before/after the wife is THE wall — the steepest boundary in
the cast; crossing it in recall is a flinch) ·
`epi_future_k 0.3`. Net: past-negative arrivals + fatalistic
quiet + the great wall = an archive that answers summons
correctly but visits on its own terms, always from the wrong
side of 1994. `tension` seeded 0.8 on the widow anchors.

### C8 Tomás, 36 — tp_vec {0.3/0.5/0.5/0.2/0.6} ·
`narr_agency 0.6` · `narr_comm 0.7` (kitchen talk is both —
the line AND the crew) · `autobio_k 0.6` (mentorship stories
mint lessons — "never let the pan tell you twice") ·
`narr_coh_k 0.6` · `period_sal 0.7` (San Miguel / Miami / SF —
the aspect set is cross-language AND cross-era; chapters split
at the lang boundary the lang_mismatch machinery already
respects) · `epi_future_k 0.6`. Net: warm, wired, two-era —
the kitchen mentor whose past arrives in chapters and leaves
as lessons.

## 21. Distinctness — fourth-pass notes

The compass axes are orthogonal to the v5.6 self-book layer:
Jules and Victor are BOTH past-tilted, but Jules's tilt is
past-negative-with-high-walls (the Portland wound stays in
Portland) while Victor's is past-negative-with-fatalistic
quiet (the archive summons HIM). Carmen and Mars both arrive
warm; Carmen's warmth is wired into chapters and lessons,
Mars's is flat-present and people-keyed. C3 and C4 share
future thickness but C4's futures are plans (agency + tp_f)
and C3's are murals (epi_future_k + imagery). Marcus remains
the diagnostic case: highest present-hedonism, lowest
coherence — the profile least likely to generate a "lesson
learned" beat on its own.

## 22. Probes filed

P745–P756 → validation-design.md §135. Headline guards:
tp_fate_null (arrival-only), theme_fabricate_null (depth not
content), lesson_truth_null (derived stays derived),
period_identity_null (metadata not content),
future_leak_null (rich ≠ remembered), tension_fate_null
(knocking ≠ damage).

## 23. Sources added this version

- Zimbardo & Boyd 1999 (*JPSP* 77:1271 — verified): ZTPI five
  subscales; Stolarski, Fieulaine & van Beek 2015 (Springer —
  review volume): time-perspective theory consolidation.
- D'Argembeau & Mathy 2011 (*J Cogn Psychol* 23 — verified):
  future-thinking individual differences; goal rehearsal as
  the future-TP signature.
- McAdams 2001 (*Rev Gen Psychol* 5:100 — verified): thematic
  lines agency/communion; McAdams & McLean 2013 (*Curr Dir
  Psychol Sci* 22:233 — verified): narrative identity review.
- Adler 2012 (*JPSP* 102:367 — verified): agency ↑ precedes
  wellbeing ↑ over therapy; Adler, Lodi-Smith, Philippe &
  Houle 2016 (*PSPR* 20:142 — verified): incremental validity
  of narrative identity over traits.
- Pasupathi & Mansour 2006 (*Dev Psychol* 42:798 — verified):
  autobiographical reasoning links; McLean, Pasupathi & Pals
  2007 (*PSPR* 11:262 — verified): selves-creating-stories
  model; McLean & Thorne 2003 (*Dev Psychol* 39:635 —
  verified): self-defining memories yield lessons.
- Reese et al. 2011 (*Memory* 19:688 — verified): narrative
  coherence dimensions × wellbeing.
- Thomsen 2009 (*Memory* 17 — verified): life-story chapters
  vary in number and closure — individual-differences basis
  for `period_sal`; Brown 2016 transition theory (reused §4.18).
- Williams, Ellis, Tyers, Healy, Rose & MacLeod 1996 (*Memory*
  4:115 — verified): future-image specificity tracks past
  specificity; generic past ↔ generic future in depression.
- Schacter & Addis 2007 (*Phil Trans R Soc B* 362:773 —
  verified): constructive episodic simulation hypothesis;
  Hassabis, Kumaran, Vann & Maguire 2007 (*PNAS* 104:1726 —
  verified): hippocampal amnesics cannot imagine futures.
- Singer, Blagov, Berry & Oost 2013 (*JPSP* 105:262 —
  verified): self-defining memory tension dimension;
  Blagov & Singer 2004 (reused).
- Garry, Manning, Loftus & Sherman 1996 (*Psychonom Bull Rev*
  3:208 — reused): imagination inflation — the ONLY licensed
  future→past flip path.

# Part V — v82 pass: the remembering voice

Spec refs: v5.30 §§5.79–5.83. Probes P871–P878 filed to
validation-design.md §164. This pass pins how each main's memory
SOUNDS — report-layer traits only. Nothing below touches what is
stored; it shapes what the room hears.

## 24. Per-main voice pins (all five traits; prior passes stand)

### C1 Mars, 29 — `voice_quote 0.4` · `report_policy 0.7` · `grain_pref 0.5` · `ie_talk 1.0` · `voice_story 0.6`
The manager's register: answers only when sure (policy up —
she runs a floor, wrong answers cost), moderate quotes
(paraphrase-first, direct speech when the wording mattered),
story-shaped but disciplined. estKnow grows steadily —
the room learns she's careful.

### C2 Jules, 26 — `voice_quote 0.3` · `report_policy 0.35` · `grain_pref 0.4` · `ie_talk 1.0` · `voice_story 0.4`
Answers freely (newcomer eagerness — low-mid policy) but
coarse by default (grain under 0.5 means confidence must
push hard to get a precise claim out of him). Flat story
shaping — reports arrive in retrieval order, ragged.

### C3 Dani, 24 — `voice_quote 0.9` · `report_policy 0.15` · `grain_pref 0.75` · `ie_talk 1.2` · `voice_story 0.85`
The cast's `bluff`-adjacent voice: never passes, quotes
everyone, precise dates and numbers out of thin confidence.
The fluent-liar file (§14.3) gains its instrument —
`constructed:true` quotes are her medium. P871 watches:
her quotes must match original wording at chance.

### C4 Priya, 31 — `voice_quote 0.25` · `report_policy 0.85` · `grain_pref 0.3` · `ie_talk 1.0` · `voice_story 0.3`
Clinical report discipline: passes rather than guesses
("I don't remember — I can find out"), coarse when she
does answer ("sometime last week"), near-zero story
shaping. Emergent effect via §5.82: her rare, fast,
correct answers plus honest passes make her estKnow the
highest in the café — the room trusts the quietest
memory.

### C5 Marcus, 34 — `voice_quote 0.5` · `report_policy 0.2` · `grain_pref 0.6` · `ie_talk 0.9` · `voice_story 0.5`
Cheerful guesser: always answers, medium-precision, quotes
with swagger. The sunny-shallow profile (§5.6 note) now has
a voice — confident, coarse, right often enough that the
grain goes unread.

### C6 Carmen, 74 — `voice_quote 0.75` · `report_policy 0.6` · `grain_pref 0.4` · `ie_talk 0.85` · `voice_story 0.9`
The stoop voice: stories arrive pre-shaped — canonical
order, discordant bits left out, a coda ("and that was
the last summer before..."), and quotes of the dead and
gone — every one `constructed:true`, all of them
*believable*. ie_talk under 1 stacks commentary-register
habit on the §5.78c age shift.

### C7 Victor, 58 — `voice_quote 0.6` · `report_policy 0.8` · `grain_pref 0.55` · `ie_talk 0.8` · `voice_story 0.5`
Quotes to indict (constructed dialogue as prosecution
exhibit — "and she said to me, 'it's just a little
rust'"), passes or omits rather than hedges — the
industrial omitter (§14.7) now has a report criterion to
match. Commentary-heavy mix, mid story-shape.

### C8 Tomás, 36 — `voice_quote 0.45` · `report_policy 0.5` · `grain_pref 0.35` · `ie_talk 1.1` · `voice_story 0.65`
The understatement voice: coarse-grained ("it was busy")
over vivid internals — sensory-happening mix up (kitchen
life is all internal detail), story shape present but
deadpan; the coda arrives as a shrug, not a lesson.

### Ambient tier — voice template
Ambients draw `voice_quote`~U(0.2,0.6), `report_policy`~
U(0.2,0.7), `grain_pref`~U(0.3,0.7), `ie_talk`~U(0.8,1.2),
`voice_story`~U(0.2,0.7) — same distribution family as
mains, no exotic corners. The crowd must sound like the
cast's neighbors, not their chorus.

## 25. Distinctness — fifth-pass notes
The five voice traits form a second orthogonal signature
axis: Dani and Marcus both answer freely (low policy) but
Dani is precise-invented and Marcus coarse-right; Priya and
Victor both withhold (high policy) but Priya passes
honestly while Victor omits strategically; Carmen and Dani
both story-shape hard but Carmen's quotes carry grief and
Dani's carry theater. Voice × the narrator's compass (Part
III) gives 40 free knobs per bible without a single
collision.

## 26. Probes filed
P871–P878 → validation-design.md §164. The signature
checks: P871 quote fidelity null (Dani's quotes ≈ chance
wording match), P872 Priya-vs-Dani free-report
accuracy/quantity split, P875 FOAK asymmetry (Priya's slow
passes RAISE estKnow; Dani's fast answers don't move it).

## 27. Sources added this version
- Tannen 1986 (*Representing* 27 — verified): constructed
  dialogue; ≥half of conversational direct quotes never
  spoken. Tannen 1989 (*Talking Voices*, CUP — verified):
  ch.4, quotation as creation; codas as evaluation.
- Wade & Clark 1993 (*Memory* 1:265 — verified): reported
  speech reconstructed toward teller purposes; Clark &
  Gerrig 1990 (*Cognition* 37 — verified): quotations as
  demonstrations.
- Koriat & Goldsmith 1996 (*Psych Rev* 103:490 — verified):
  monitor-and-control; report option ↑accuracy ↓quantity.
- Goldsmith, Koriat & Weinberg-Eliezer 2002 (*JEP:G* 131:73
  — verified): strategic grain-size regulation.
- Levine, Svoboda, Hay, Winocur & Moscovitch 2002
  (*Psychol Aging* 17:677 — verified): AI internal:external
  mix; persists under probing. Addis, Wong & Schacter 2008
  (*Neuropsychologia* 46 — verified): mix as style.
- Brennan & Williams 1995 (*J Mem Lang* 34:383 — verified):
  FOAK — latency/filler cues; answer-vs-nonanswer
  asymmetry. Smith & Clark 1993 (*Cognition* 48 —
  verified): uh/um delay calibration.
- Marsh 2007 (*Am J Psychol* 120 — verified): retelling is
  not remembering; tellings retrieved over events.
- Sachs 1967 (reused): verbatim wording dies sub-daily.
- Bartlett 1932 (reused): effort after meaning.

# Part VI — v94 pass: the metaself layer

Spec refs: v5.42 §§6.214–6.220. Probes P994–P1005 filed to
validation-design.md §192. This pass pins what each main
believes OTHERS think of them — belief-layer traits only;
the underlying records are untouched. MetaModel is the
cast's most private wrongness: it never appears in canon,
and the audience learns each character's self-underestimate
(or self-monument) only through what the belief makes them
DO.

## 28. New mechanisms consumed (→ spec v5.42)

- `MetaModel` store (§6.214) — per-alter belief record.
- Projection prior (§6.215) — self-view stands in until
  evidence accrues.
- Reciprocity arm + blind compete channel (§6.216).
- Liking gap (§6.217) — post-conversation underestimate.
- Evidence-through-memory (§6.218) + staleness (§6.219).
- Beautiful-mess asymmetry (§6.220) on `vulnerable:true`.

## 29. Per-main meta pins (all six traits; prior passes stand)

### C1 Marisol, 29 — `meta_proj 0.5` · `meta_recip 0.5` · `lgap_k 0.35` · `meta_ev_w 0.65` · `meta_neg_w 1.1` · `bmess_k 0.2`
The floor manager's metaself is a working instrument: tips,
turnover, and who-sits-where are signal-rich, so evidence
accrues fast and the prior yields (high `meta_ev_w`, mid
`meta_proj`). Modest gap — she's socially fluent but still
audits her own performance after close conversations.
Slightly-discounted cold-shoulder weight: a manager who
took every chill personally couldn't run the room. Her
vulnerability registers honest cost — asking staff for
help feels like weakness at mid `bmess_k`.

### C2 Jules, 26 — `meta_proj 0.55` · `meta_recip 0.65` · `lgap_k 0.8` · `meta_ev_w 0.45` · `meta_neg_w 1.5` · `bmess_k 0.3`
The newcomer file, metaself edition: thin evidence
(everything is a first conversation), high self-critical
focus, high reciprocity — he likes the café crowd, so he
half-believes they like him, and then the gap claws it
back every night. THE `gap_close` character: months of
small warmths must out-grind a 0.8 susceptibility. When a
`vulnerable:true` moment finally lands (asking Mars for a
shift change, admitting the Portland story), he will
believe it cost him while the room liked him more —
the asymmetry IS his arc.

### C3 Dani, 24 — `meta_proj 0.6` · `meta_recip 0.5` · `lgap_k 0.5` · `meta_ev_w 0.5` · `meta_neg_w 1.6` · `bmess_k 0.1`
The performer who narrates her own reception: mid
projection, mid evidence — she believes the room reads
her as charming because she TELLS it so (the §14.3
fluent-liar file extends inward: her metaself is her
first audience). High neg weight — one flat reaction
outweighs an evening of smiles, and she re-runs the flat
one (rumin-adjacent sensibility). Near-zero `bmess_k`:
she confesses theatrically and registers no cost — the
vulnerability the audience sees and the one she feels are
different species.

### C4 Priya, 31 — `meta_proj 0.4` · `meta_recip 0.3` · `lgap_k 0.25` · `meta_ev_w 0.75` · `meta_neg_w 1.2` · `bmess_k 0.15`
The cast's calibrated instrument. Twenty years of reading
faces for bad news buys the highest `meta_ev_w` in the
cast and the lowest projection — her metaself is built
from evidence, not self-image. Low reciprocity (she does
not assume her liking is returned — clinical distance).
The flat-affect clock (§14.4) shows here too: modest gap,
honest vulnerability pricing. Emergent signature: she
detects cooling before the cooler admits it — and never
flatters herself, which the audience may misread as
coldness she doesn't feel.

### C5 Marcus, 34 — `meta_proj 0.5` · `meta_recip 0.7` · `lgap_k 0.15` · `meta_ev_w 0.35` · `meta_neg_w 0.8` · `bmess_k 0.1`
The sunniest wrongness in the cast. Near-zero gap — he
never audits a conversation in his life; high reciprocity
— he likes everybody, so everybody must like him; and by
the world's actual reciprocity he is *mostly right*: the
belief outruns the fact by a margin nobody minds. Low
evidence rate, low neg weight — a cold shoulder doesn't
rehearse, it evaporates (§4.13 + §14.5). The one profile
whose `meta_episode_null` does the least work: he needs
no metaperceptual machinery because he never asks the
question.

### C6 Carmen, 74 — `meta_proj 0.75` · `meta_recip 0.4` · `lgap_k 0.2` · `meta_ev_w 0.4` · `meta_neg_w 0.9` · `bmess_k 0.25`
Seventy-four years of stoop-reading has consolidated the
prior: high projection — she assumes the room reads her
as the fixture she knows herself to be, and the
consistency-overestimate Kenny & DePaulo describe fits a
woman whose self-concept stopped updating slowly. Low
gap (past auditing her own banter), low neg weight
(weathered enough slights to discount them), mid
vulnerability cost — asking for help still stings; being
*seen* needing it stings more than the need. Her stale
MetaModels are the cast's most durable: an impression
from 2019 is still the impression.

### C7 Victor, 58 — `meta_proj 0.8` · `meta_recip 0.35` · `lgap_k 0.2` · `meta_ev_w 0.25` · `meta_neg_w 0.8` · `bmess_k 0.35`
The monument. Highest projection in the cast: the room
reads him as the-owner-who-shows-up because that is how
he reads himself; evidence bounces (`meta_ev_w` lowest)
— a season of cold shoulders lands as noise, not signal.
Low reciprocity: he does not assume affection returned;
he assumes *standing* — and standing is a projection, not
a perception. Highest `bmess_k`: the industrial omitter
cannot apologize first without believing it cost him
standing — and since evidence can't reach him, he may
never learn it bought him grace. The gap is low not
because he's secure but because he never holds the
post-conversation audit at all.

### C8 Tomás, 36 — `meta_proj 0.55` · `meta_recip 0.7` · `lgap_k 0.35` · `meta_ev_w 0.55` · `meta_neg_w 1.3` · `bmess_k 0.25`
Kitchen loyalty assumes itself returned: highest
reciprocity in the cast alongside Marcus — the line crew
that eats together likes each other, and he banks on it.
Mid everything else — evidence accrues through service
signals (a sent-back plate is a cold signal; a clean one
is warm), mid gap, honest neg weight. `vulnerable:true`
events run kitchen-currency: admitting a mistake to the
crew costs him a little in his own ledger while the crew
rates him higher — the beautiful-mess asymmetry playing
in aprons.

### Ambient tier — metaself template
Ambients draw `meta_proj`~U(0.4,0.8), `meta_recip`~
U(0.3,0.7), `lgap_k`~U(0.1,0.6), `meta_ev_w`~U(0.3,0.7),
`meta_neg_w`~U(0.8,1.6), `bmess_k`~U(0.05,0.35) —
population bands, no exotic corners. The crowd's
metaselves must be as varied and as privately wrong as
the cast's; an ambient whose `stale` flag never clears
is not a bug — most people run on old impressions.

## 30. Distinctness — sixth-pass notes
The metaself axes are orthogonal to both prior social
layers: Victor and Priya both carry low reciprocity, but
Victor's is monument-indifference while Priya's is
clinical distance; Jules and Dani share mid-high gaps,
but Jules's is anxious self-audit while Dani's is
thin-evidence theater; Marcus and Tomás share high
reciprocity, but Marcus's is temperament while Tomás's
is crew-bond. The same incoming warmth now lands eight
different ways in eight private ledgers — and the
audience can watch a character be wrong about being
liked in real time.

## 31. Probes filed
P994–P1005 → validation-design.md §192. Signature checks:
P995/P996 gap direction + attenuation (Jules highest,
still ≥0); P994 mindread null; P999 compete channel
≈0 accuracy for ALL profiles; P1005 cast spread
ordering on identical signal diets.

## 32. Sources added this version
- Kenny & DePaulo 1993 (*Psychol Bull* 114:145 —
  verified): SRM meta-analysis; self→meta r ≈ .87;
  generalized > dyadic meta-accuracy.
- Elfenbein, Eisenkraft & Ding 2009 (*Psychol Sci*
  20:1081 — verified): dyadic meta-accuracy for being
  valued runs on reciprocity.
- Eisenkraft, Elfenbein & Kopelman 2017 (*Psychol Sci*
  28:233 — verified): we know who likes us, not who
  competes with us.
- Boothby, Cooney, Sandstrom & Clark 2018 (*Psychol Sci*
  29 — verified): the liking gap; five studies; persists
  months, attenuates with acquaintance.
- Bruk, Scholl & Bless 2018 (*JPSP* 115:192 — verified):
  beautiful mess effect; construal-level account.
- Clark & Wells 1995 (reused): self-focused processing
  in social anxiety — lgap_k's trait mechanism.

## 33. Per-main hardware pins (all six traits; prior passes stand)

### C1 Mars, 29 — `imagery 0.5` · `obs_persp 0.3` · `face_recog 0.7` · `interdep 0.55` · `family_remin 0.6` · `dejavu 0.4`
The floor manager's eyes: above-average faces (regulars are a
book she keeps), field-perspective default (she was *in* it),
mid-plural childhood — her earliest records are a kitchen
table, not a solo scene.

### C2 Jules, 26 — `imagery 0.8` · `obs_persp 0.35` · `face_recog 0.5` · `interdep 0.7` · `family_remin 0.7` · `dejavu 0.6`
Rich imager from a talky household — earliest archive opens
early and plural. Highest `dejavu` in the cast on purpose:
fatigued newcomer + high proneness means the city he just met
keeps arriving pre-remembered. `dejavu_know_null` keeps it a
feeling, never a fact.

### C3 Dani, 24 — `imagery 0.9` · `obs_persp 0.7` · `face_recog 0.55` · `interdep 0.3` · `family_remin 0.3` · `dejavu 0.7`
The near-hyperphant tail, paired deliberately with the cast's
highest observer prior: she watches herself perform her own
past. `img_accuracy_null` does the work — the most vivid
rememberer stays the least faithful one; her memories are
stage sets she stands inside.

### C4 Priya, 31 — `imagery 0.15` · `obs_persp 0.25` · `face_recog 0.6` · `interdep 0.6` · `family_remin 0.5` · `dejavu 0.3`
The deliberate tail pin (CP§86 allows exactly one):
aphantasia-adjacent. Greyest sensory reports in the cast,
untouched archive — she knows, she doesn't see. Paired with
her report_policy the phenotype compounds: the character who
both refuses to guess AND can't picture it reads as the most
honest memory on the block. Watch P1122 — her correctness
must equal the imagers'.

### C5 Marcus, 34 — `imagery 0.6` · `obs_persp 0.2` · `face_recog 0.85` · `interdep 0.5` · `family_remin 0.5` · `dejavu 0.5`
Super-recognizer-adjacent faces on the cast's shallowest
archive: he recognizes everyone and remembers nothing about
them. Field-default vantage (0.2) — Marcus was there, he
doesn't watch himself being there.

### C6 Carmen, 74 — `imagery 0.5` · `obs_persp 0.55` · `face_recog 0.4` · `interdep 0.85` · `family_remin 0.75` · `dejavu 0.2`
The plural childhood, maximal: interdep-high + talk-rich
household. Her earliest archive opens on a table of people,
not a self-portrait — and the mechanism legs (`obs_age_slope`)
mean her oldest stories increasingly arrive watched-from-
outside: she sees the girl she was at the table. `dejavu`
bottoms with age per the literature.

### C7 Victor, 58 — `imagery 0.4` · `obs_persp 0.6` · `face_recog 0.5` · `interdep 0.45` · `family_remin 0.2` · `dejavu 0.3`
The late-opening archive: a household that didn't reminisce
(0.2) pushes his effective amnesia boundary up ~0.3y —
"I don't remember being young" is now mechanical. High
observer prior on self-conscious scenes: he watches the man
he was being wronged, at an `obs_dampen` discount — which is
why the grievances read cold instead of hot.

### C8 Tomás, 36 — `imagery 0.35` · `obs_persp 0.3` · `face_recog 0.45` · `interdep 0.8` · `family_remin 0.6` · `dejavu 0.4`
Dim imager, plural childhood, slightly face-slow: the kitchen
pro who plates from muscle and procedure, whose people-knowledge
runs on voice and context — `face_sem_null` keeps the lag
invisible to anyone who isn't testing faces.

### Ambient tier — hardware template
`imagery`~N(0,1) truncated ±2σ (tails possible, rare — the
population rate is the point); `obs_persp`~U(0.15,0.55);
`face_recog`~N(0.5,0.18) clamp [0.05,0.95] — the crowd may
contain one slow-face ambient, never a declared prosopagnosic;
`interdep`/`family_remin` sampled per ambient backstory tag;
`dejavu`~U(0.2,0.7) age-tapered by mechanism, not by pin.

## 34. Distinctness — seventh-pass notes
The hardware axis is orthogonal to both prior report layers:
Priya and Dani now bracket the imagery spectrum AND the
report-policy spectrum — grey-and-careful vs vivid-and-
invented, the cleanest vividness≠truth demonstration the
cast can produce. Marcus and Victor share mid everything
except the channels that matter: Marcus's face channel is
his best feature while his archive is thin; Victor's archive
is deep but his vantage puts him outside his own grievances.
Carmen and Tomás share interdep-high but diverge on vantage
and imagery — her childhood is watched, plural, and narrated;
his is cooked, plural, and unspoken.

## 35. Probes filed
P1122–P1133 → validation-design.md §218. Signature checks:
P1122 imagery-decile accuracy equality (Priya ≈ Dani on
correctness, ≠ on richness); P1125 observer dampen asymmetry
(field→observer lowers, observer→field doesn't raise);
P1127 face-blind PersonModel completeness; P1133 déjà vu
never mints or attributes.

## 36. Sources added this version
- Zeman, Dewar & Della Sala 2015 (*Cortex* 73:378 — verified):
  aphantasia named; lifelong imagery absence.
- Zeman et al. 2020 (*Cortex* 130:426 — verified): extreme
  aphantasia ~0.7%, hyperphantasia ~2.5–3% prevalence;
  face-recognition and autobiographical-memory complaints
  cluster in aphantasia.
- Dawes, Keogh, Andrillon & Pearson 2020 (*Sci Rep* 10:10022
  — verified): aphantasic autobiographical memory less vivid/
  phenomenologically rich; standard memory performance
  equivalent → `img_accuracy_null`.
- Nigro & Neisser 1983 (*Cog Psych* 15:467 — verified):
  field/observer vantage; emotionality+self-awareness→observer;
  recency→field.
- Robinson & Swanson 1993 (*Memory* 1:169 — verified):
  field→observer switch dampens rated affect; converse no
  effect → `obs_dampen` asymmetry.
- Sekiguchi & Nonaka 2014 (*Emotion* 26 — verified): dampening
  persists ≥4 weeks.
- Russell, Duchaine & Nakayama 2009 (*PBR* 16:252 — verified):
  super-recognizers; face ability is a spectrum.
- Kennerknecht et al. 2006; DeGutis et al. 2023 (verified):
  developmental prosopagnosia ~0.9–2.5%, cutoff-dependent.
- Wang 2001 (*JPSP* 81:220 — verified): American earliest
  memory ~3.5y vs Chinese ~4y; self-focused vs collective/
  routine content; construal-memory coupling.
- Fivush, Haden & Reese 2006 (*Child Dev* 77:1568 — verified):
  elaborative maternal reminiscing → earlier first memories.
- Brown 2004 (*Psychol Bull* 130:394 — verified): ~67%
  lifetime déjà vu prevalence; age decline; fatigue/stress
  moderators.
- O'Connor & Moulin 2010 (verified): déjà vu as familiarity
  plus known falsity → `dejavu_know_null`.

# Part VII — v118 pass: the circumstance layer (spec v5.51–v5.63 compile)

Seven passes pinned what the machine keeps, how it narrates,
how it sounds, what it thinks it knows, and what the
remembering looks like from inside. Between v5.51 and v5.63
the spec grew a *somatic and circumstantial* trait layer —
ears, shifts, smoke, shifts-of-life — that no bible had pins
for. This pass compiles it. **No new spec fields** (v5.65
unchanged); every pin below names an existing §7 scalar or
trait. The rule from Part VI stands: pins set priors and
exposures, mechanisms do the work, locked nulls keep the
layer honest.

## 37. Mechanisms consumed (v5.51–v5.63 — the trait roster)

Bible-settable traits/states with no prior per-main pins:

- `hear` [0,2] + `hear_aided` flag — hearing as an encoding
  gate (ID§125–127; `hear_gist_null`/`hear_sem_null`: the
  ear spends at the door — gist mints, verbatim doesn't).
- `shift_wrk` [0,2] + `day_shift_yrs` + `post_night` ctx —
  circadian age-equivalence (`shift_age_equiv` 3.0 @w=2·5y;
  `shift_sem_null`: semantic reserve untouched).
- `smoker` {0,1,2} + `pack_yrs`/`quit_yrs` +
  `nicotine_sated`/`withdrawal_h` ctx — decline accrual,
  quit rescue (`smoke_encode_null`: withdrawal-repair only).
- `medit` [0,1] — attentional buffer (`medit_att_buf`,
  `medit_conf_gain`; `medit_store_null`: no store boost).
- `job_cplx` [0,1] — complexity-of-work reserve feed
  (`jobcplx_retire_null`: deposit stays banked).
- `lonely` [0,1] — vigilance + rehearsal tax
  (`lonely_crowd_null`: perception gap, not census).
- `migr` [0,2] + `ictal` ctx — attack-day tax, no cumulative
  damage (`migr_cumul_null` — fifth mandated null).
- `diab` {0,1,2}+`diab_yrs`, `antichol` [0,2]+`antichol_yrs`,
  `sick_day`, `apnea`+`cpap`, `menop` {0,1,2},
  `retire`+`retire_voluntary`+`post_engagement`,
  `grief:{onset,kin_type,ambivalence}` — state generators,
  bible seeds the state, mechanisms run it.
- Credulity trio (v5.52): `tdef` (sleeper/credulity prior),
  `rsq` (rejection sensitivity → `snub` detection/FP),
  `imp_anchor` (primacy weight → `imp_reversed` resistance).

## 38. Per-main circumstance pins (all prior passes stand)

### C1 Mars, 29 — `job_cplx 0.7` · `shift_wrk 0.6` · `tdef 0.6` · `rsq 0.4` · `lonely 0.3` · `smoker 0` · `medit 0.3`
The floor manager's ledger: high job complexity feeds the
reserve deposit nightly (`jobcplx_reserve_feed`), and
rotating closes keep a mild circadian tax running — the
character who *earns* her forgetting. `tdef` mid-high: she
has heard every version of every rumor from behind the bar;
demotion comes late and loud. Low `rsq` — the job
desensitized snub-detection years ago.

### C2 Jules, 26 — `lonely 0.8` · `tdef 0.35` · `rsq 0.7` · `imp_anchor 0.7` · `shift_wrk 0.2` · `smoker 0`
The newcomer's signature is `lonely` at cast maximum, and
the mechanism makes it *cost*: `lonely_rehearse_tax` thins
his rehearsal while `lonely_vigil` keeps his threat-channel
encoding up — he remembers the room's cold shoulders better
than its warm ones, which is why the cold archive keeps
reproving itself (`lonely_crowd_null` keeps the census
honest — the town is friendlier than his archive says).
`tdef` low: no local priors to defend, so sleeper tags decay
while he isn't looking — in six months he'll swear he always
knew things he was told twice. `imp_anchor` high: first
impressions of the block resist `imp_reversed`.

### C3 Dani, 24 — `migr 1.3` · `rsq 0.8` · `medit 0.4` · `tdef 0.5` · `lonely 0.5`
The peak-age female migraineur — Lipton et al. 2007 puts the
1-yr prevalence at 17.1% for women, cresting through the
20s–40s; the trait is *base-rate-plausible*, not special.
`ictal` days tax encoding `migr_ictal_tax` 0.3 while
`migr_sens_gain` keeps sensory weight oddly high — her
migraine-day memories are dim but glare-tagged, remembered
as *the day with the aura*. `migr_cumul_null` is the point:
no damage accrues; the wound never becomes a lesion. `rsq`
at cast maximum fits the audition economy — she detects
exclusions that didn't happen (`snub_fp_base` × rsq),
encodes them `snub_encode_gain`, and they read real.

### C4 Priya, 31 — `shift_wrk 0.9` · `medit 0.8` · `tdef 0.8` · `smoker 0` · `lonely 0.4` · `rsq 0.3`
The deliberate stack: the highest `shift_wrk` in the cast
(health-adjacent shift labor is her backstory's fact)
*paired with* the highest `medit`. The phenotype is a wash
by design — `shift_age_equiv` quietly ages her encoding
while `medit_att_buf`/`medit_mw_buf` buy attention back, and
`medit_conf_gain` lets her *know* she compensates. `tdef`
cast-high: the skeptic — sleeper effects decay slowest on
her, `tdef_detect` trips early; she is the character rumor
dies on. `shift_sem_null` guards the flank: her semantic
store is untouched — she is tired, never less *knowing*.

### C5 Marcus, 34 — `smoker 2, pack_yrs 8, quit_yrs 4` · `job_cplx 0.4` · `lonely 0.5` · `imp_anchor 0.3` · `rsq 0.5` · `tdef 0.55`
The ex-smoker four years out: `smoke_quit_rescue` has already
paid most of its dividend, `smoke_decline_k` banked a modest
slope — the archive carries a small scar the phenotype has
outgrown. `imp_anchor` cast-low pairs with `face_recog` 0.85
(§33): he keeps *re-meeting* people — the man who recognizes
everyone updates impressions on contact, so primacy never
gets to harden. `lonely` mid is the quiet note: surrounded
by faces, thin on ties.

### C6 Carmen, 74 — `hear 0.7, hear_aided false` · `retire 1, retire_voluntary, post_engagement 0.8` · `menop 2` · `grief:{onset −9y, spouse, ambivalence 0.3}` · `lonely 0.4` · `migr 0.3` · `job_cplx 0.6`
The oldest archive carries the fullest circumstance ledger.
`hear` 0.7 unaided: Hoffman et al. 2017 puts speech-frequency
HI at ~2/3 of her decade's neighbors and aid uptake well
under a quarter (Chien & Lin 2012) — she is the modal case,
not an edge. `hear_gist_null` does the characterization: at
the loud table she gets the story, loses the wording — her
retellings of *recent* conversations are paraphrase-rich in
a way her childhood retellings are not. `retire_voluntary` +
`post_engagement` 0.8 is the chosen-exit phenotype —
`retire_slope_tax` lands on a busy calendar and mostly
misses. `menop 2` is bookkeeping: rebound long complete
(`menop_rebound_d` 180 elapsed; `menop_sym_null`). `grief`
at −9y: `grief_acute_d` 90 closed years ago — `grief_perm_null`
means the record shows a scar, not a wound: the husband is
in the archive at full strength; only the *intrusion*
channel remembers it cost something.

### C7 Victor, 58 — `smoker 1, pack_yrs 22` · `apnea undiagnosed` · `hear 0.3` · `lonely 0.7` · `job_cplx 0.5` · `retire 0` · `tdef 0.7` · `rsq 0.6`
The heaviest load in the cast, by design. Current smoker
(~11.6% adult prevalence, CDC NHIS 2022): `smoke_decline_k`
accrues daily, `nicotine_sated` micro-gains never repay it —
`smoke_encode_null` keeps the cost where it belongs, in the
slope. Undiagnosed apnea is base-rate-plausible (Peppard
2013: mod-severe SDB ~17% of men 50–70): `apnea_consol_tax`
+ `apnea_sws_cut` tax every night's consolidation and
`apnea_iiv` noisies his day-to-day — *and no cpap rescue is
coming*, so the man whose grievances compound is literally
sleeping badly on them. `hear` 0.3 (decades of shop noise)
plus `lonely` 0.7 plus `tdef`/`rsq` high: the vigilance stack
that detects slights, rehearses them thin, and never lets a
discount_tag finish decaying. His memory isn't bad. His
*inputs* are rigged.

### C8 Tomás, 36 — `shift_wrk 0.8` · `smoker 2, pack_yrs 10, quit_yrs 1` · `hear 0.2` · `lonely 0.4` · `job_cplx 0.6` · `medit 0.2` · `tdef 0.5`
Kitchen hours are the `shift_wrk` story — `post_night`
flags ride most dinner services, `shift_age_equiv` accrues
at w·y and `shift_recovery` 0.6 means a clean week only buys
back part of it. The recent quit (`quit_yrs` 1) is the
interesting pin: `smoke_quit_rescue` is *still paying out*
in-sim — a small improving slope the player can almost
notice, against `withdrawal_h` spikes on bad weeks. `hear`
0.2 is kitchen-noise bookkeeping, `job_cplx` 0.6 is the
craft — plating is procedural, ordering is not.

### Ambient tier — circumstance template
`hear` ~ age-graded by Hoffman 2017 decades (≈0 under 40;
0.2–0.4 in 50s–60s; 0.5–1.0 at 70+, aid flag Bernoulli
~0.15 of eligibles); `smoker` ~ Categorical(never 0.62,
former 0.26, current 0.12) per NHIS-2022-shaped priors;
`shift_wrk` ~ U(0,0.6), ~15–20% above 1.0 (service-sector
draw); `migr` ~ sex-graded Bernoulli (F 0.17/M 0.06) →
severity U(0.8,1.8), age-tapered post-60; `lonely` ~
Beta(2,4) + newcomer tag +0.3; `tdef`/`rsq`/`imp_anchor` ~
U(0.3,0.7) unremarkable by default; `apnea` latent per
Peppard sex×age cells, undiagnosed unless bible says;
`menop`/`retire`/`grief` seeded only where ambient backstory
demands. **No ambient gets `diab`/`antichol` without an
explicit bible line** — disease pins are authored, never
sampled.

## 39. Distinctness — eighth-pass notes
Priya and Victor now bracket the compensation axis: same
tax-paying mechanisms, opposite books — her `shift_wrk` is
answered by `medit`, his by nothing; she knows she's tired,
he just is. Jules and Carmen are the `lonely`/`hear`
contrast: both sit in rooms that don't quite reach them —
his isolation is social and mints false slights, hers is
sensory and mints paraphrase. Marcus and Tomás are the two
quitters at different rescue phases — banked vs still
paying. Dani's `migr` is the only episodic-tax trait in the
cast: her bad days are *events* in the archive, everyone
else's are weather. Mars remains the cleanest baseline —
the machine pays her taxes and files nothing.

## 40. Probes filed
P1257–P1268 → validation-design.md §238. Signature checks:
P1257 heard-channel gist-vs-verbatim asymmetry on Carmen
(locked `hear_gist_null`/`hear_sem_null`); P1259 Priya
compensation equality (episodic quality ≈ Mars within
tolerance, complaint channels diverge); P1261 Victor's
apnea shows as IIV + consolidation shortfall, never as
semantic loss; P1267 ambient census vs declared priors.

## 41. Sources added this version
- Hoffman, Dobie, Losonczy, Themann & Flamme 2017 (*JAMA
  Otolaryngol* 143:274 — verified): NHANES speech-frequency
  HI 14.1% adults 20–69; ~2:1 men:women; steep decade
  gradient → `hear` age-graded pins.
- Goman & Lin 2016 (*AJPH* 106:1820 — verified): 23% of US
  ≥12 carry better-ear HL; severity shifts toward moderate
  at 80+ → ambient severity draw.
- Chien & Lin 2012 (*Arch Intern Med* 172:292 — reported):
  hearing-aid uptake ~14% of eligible ≥50 — `hear_aided`
  false is the modal pin, flagged HYPOTHESIS-strength for
  the ambient 0.15 draw.
- Peppard et al. 2013 (*Am J Epidemiol* 177:1006 —
  verified): mod-severe SDB 17% men / 9% women aged 50–70 →
  Victor's undiagnosed apnea is a base-rate character beat.
- Lipton et al. 2007 (*Neurology* 68:343 — verified, AMPP
  n=162,576): migraine 1-yr 11.7% (17.1% F, 5.6% M), midlife
  peak → Dani's `migr` pin is population-modal.
- Buse et al. 2012 (*Headache* 52 — verified): chronic
  migraine ~0.9%, F-40s peak → severity draw cap for
  ambient; Dani stays episodic.
- CDC/NHIS 2022 (MMWR 73 — verified): current smoking
  ~11.6% of adults; quit attempts 53%, success ~9% →
  ambient smoker categorical + Tomás's recent-quit window.
- Clarke et al. 2018 (CDC NHIS — reported): adult
  meditation use ~14% → ambient `medit` base draw; Priya's
  0.8 is a practice pin, not a prevalence pin.
- Mechanism constants themselves: reused from
  individual-differences.md §§108–137 (v5.51–v5.63) and
  social-memory.md §§151–160 (v5.52) — not re-cited here.

# Part VIII — v130 pass: the promoted tier (spec v5.76 compile)

Eight passes compiled the mains. The Astra direction (production-3)
promotes 2–4 supporting residents to persistent memory "of the same
quality as the mains," and world/promotion.md §5 already ranked the
first candidates: **A14 Bex, A05 Esther, A09 Asha, A06 Kofe**. This
pass does two things: (a) it adds the spec machinery promotion
actually requires — era tags, the typed-era remember/know split,
backfill skeletons, the thin-years SelfModel gap, ambient witness
edges, demotion islands, the minor guard (§§6.386–6.392); and (b) it
compiles all four candidates at full main-cast depth — every pin
layer a main carries, a promoted resident now carries.

The design rule for all four: **the ambient era stays thin.** A
promoted resident's past is not a smaller version of a main's past —
it is a *differently-shaped* one: `generic`-class typed records,
`rk:"know"`, ~8% remember islands, seeded backfill skeletons, and a
SelfModel that believes the thin years better than they were
(`meta_gap_init` 0.25). That shape is not a compromise — it is the
science (Conway & Pleydell-Pearce 2000: routine life stores at the
general-events level; Wagenaar 1986: the *when* dies first). The
block already knows these people; their archives just learned to
talk about it honestly.

## 42. Mechanisms consumed (→ spec v5.76 §§6.386–6.392)

- `promote()`/`demote()` era transitions; immutable `era` field;
  `promote_rewind_null`/`promote_recast_null`/`demote_keep_null`.
- The typed era: `class:"generic"`, `rk:"know"` default, remember
  islands at `promote_remember_isle_p` 0.08, `know_detail_cap` 0.4,
  `know_upgrade_null` (modeling choice on DEBATED ground).
- `backfill:true` skeletons — gist-class only, never ledger-OBSERVED.
- `meta_gap_init`/`promote_calib_d` — the thin-years SelfModel.
- `ambient_wit_gain` — thin-era edges resurface as TOLD-tier gist.
- `minor_promote_null` — `guardian:true` required under 18.

## 43. Per-candidate compiles (all pin layers; mains-equivalent)

### A14 → Bex Lindqvist, 29 · tattoo artist · `seed a14-mem`

```
archetype: C young adult (29 — inside bump window)
pins: open +1.2 · consc +0.6 · extra −0.2 · neurot +0.2 · wmc +0.4
      selfconceal +0.8 (files, never shares — the linework read is
      her whole card: she notices, she doesn't say)
modifiers: domain-expert (perceptual) · low-social
domains: linework/artist-attribution depth 0.9 — "recognizes
      linework the way other people recognize handwriting":
      expert gist memory on ink, verbatim-level on strokes;
      consult-window ledger (alley smoke breaks) depth 0.6
regimes: [booking backlog, ~6wk recurring]: +stress mild,
      lapse_p +0.01
lifeEvents: the Portland sleeve-trade — the artist she traded
      arms with moved away; quiet contamination beat
records at promotion: ambient era ~5y on the block, typed;
      remember islands: Marcus's drumsticks, the shelving build
      with Cole, her first day at Needlepointe
backfill: Portland artist (off-screen relationship record,
      eval-tagged); the shop owner's slow retirement question
      (open loop — `commit_soft`-adjacent, never formalized)
SelfModel: self_est.visual 0.7 / global 0.55 — she trusts her
      eyes, not her name-ledger; meta_gap 0.20
```

Delta layers (all prior passes' axes): `defens +0.2` ·
`script_redeem −0.1` · `mnem_neg 0.05` (observer, not defender —
her secrecy is silence, not suppression) · `self_est 0.58` ·
`selfverif_w 0.4` · `self_complex 4` · `savor_k 0.5` ·
`elabor 0.5` · `future_cont 0.4` · `counterf_k 0.2` ·
tp_vec {0.3/0.4/0.6/0.3/0.4} · `narr_agency 0.6` · `narr_comm 0.4`
· `autobio_k 0.5` · `narr_coh_k 0.5` · `period_sal 0.5`
(pre/post Portland) · `epi_future_k 0.6` · `voice_quote 0.3` ·
`report_policy 0.6` · `grain_pref 0.7` (precise when she speaks —
"that'll heal crooked if you pick at it") · `ie_talk 0.8` ·
`voice_story 0.4` · `meta_proj 0.5` · `meta_recip 0.4` ·
`lgap_k 0.3` · `meta_ev_w 0.6` · `meta_neg_w 0.9` ·
`bmess_k 0.2` · `imagery 0.8` · `obs_persp 0.25` ·
`face_recog 0.5` — but `individ_rate` on tattooed skin runs
expert-tier while faces stay average: the perceptual-expertise
asymmetry IS the character · `interdep 0.4` ·
`family_remin 0.3` · `dejavu 0.4` · `smoker 1, pack_yrs 6`
(the smoke break is her office — the alley's social life happens
there) · `shift_wrk 0.2` · `lonely 0.4` · `tdef 0.6` ·
`rsq 0.4` · `imp_anchor 0.5` · `job_cplx 0.7` · `medit 0.3`
(the Sunday sketch walk is attentional practice).

**Signature:** *the witness who filed the wrong channel.* Five
ambient years on the block at `ambient_wit_gain`, but her thin-era
edges are channel-skewed: ink-class detail at expert depth,
person-gist at ambient depth. She saw the same hand draw the
Mudhaus chalkboard and two Clarion pieces — the one ambient-era
observation that is a live discovery path — and it sits in her
archive as a `generic` know-tier record she will not volunteer.
When she does retrieve the mains' pasts, she retrieves them
*correctly but thinly* — the witness who was really there and
remembers like someone who was mostly watching skin.

### A05 → Esther Goldman, 78 · retired school secretary · `seed a05-mem`

```
archetype: E older adult (78 — deep decline band; reserve 0.55:
      31 years of school-office job_cplx + a daily social post)
pins: social +0.8 · consc +0.5 · extra +0.4 · neurot +0.2 ·
      fantasy +0.7 (the confident-confabulation substrate —
      "half her stories are true, and nobody can check") ·
      open +0.3
modifiers: age-E defaults · confabulator-adjacent (fluency→
      confidence conversion is her engine)
domains: block-history ledger depth 0.6 — deep and corrupt;
      school-filing procedure depth 0.7 semantic (where
      everything is filed — still true)
records at promotion: ambient era ~9y on the bench, typed;
      remember islands: the husband's funeral period, the
      90s fundraiser with Carmen (probably misdated — the
      island is real, the date is not), Ray's first bench
      argument
backfill: the niece thread (off-screen; the Walnut Creek
      pressure is her promotion arc); the quarreled-with
      friend — a record whose eval drifted and whose WHY is
      a confab_fill casualty; widowhood −9y (grief_acute_d
      closed — scar, not wound)
SelfModel: self_est.global 0.8 — she believes the archive
      completely. THE meta_gap probe case: believed fidelity
      far above actual → confab_fill 0.7 pours silently
```

Delta layers: `defens 0` · `script_redeem +0.3` · `mnem_neg 0.1`
(not defensive — an *editor*: polished, rehearsed-in-silence
stories) · `self_est 0.62` · `selfverif_w 0.6` ·
`self_complex 5` · `savor_k 0.6` · `elabor 0.4` ·
`future_cont 0.3` · `counterf_k 0.1` · tp_vec
{0.4/0.5/0.6/0.2/0.4} · `narr_agency 0.4` · `narr_comm 0.7`
(the bench is court) · `autobio_k 0.7` · `narr_coh_k 0.8`
(canonical order, pre-shaped) · `period_sal 0.7` (before/after
the husband) · `epi_future_k 0.3` · `voice_quote 0.7` ·
`report_policy 0.3` (answers everything — the confident
historian) · `grain_pref 0.6` (specific dates, wrong half the
time — "that was a hardware store in 1988") · `ie_talk 0.7` ·
`voice_story 0.95` (the promoted cast's highest) ·
`meta_proj 0.7` · `meta_recip 0.5` · `lgap_k 0.2` ·
`meta_ev_w 0.35` · `meta_neg_w 0.7` · `bmess_k 0.15` ·
`imagery 0.5` · `obs_persp 0.6` · `face_recog 0.35` (greets
regulars by name whether she knows it — `lure_accept` rides
the age curve up) · `interdep 0.7` · `family_remin 0.5` ·
`dejavu 0.15` · `hear 0.6, hear_aided false` (78 — modal
case per Hoffman 2017) · `retire 1, retire_voluntary,
post_engagement 0.9` (the bench is a post, not loneliness) ·
`grief:{−9y, spouse, ambivalence 0.2}` · `lonely 0.3` ·
`tdef 0.6` · `rsq 0.3` · `imp_anchor 0.8` (decades of
consolidated priors — it was a bakery) · `migr 0` ·
`smoker 0`.

**Signature:** *the archive that lies kindly.* Gist-intact
semantic scaffold + `confab_fill` + `meta_gap` + high report
fluency = the block's least reliable historian who is also its
most cited. `hear_gist_null` makes her *recent* retellings
paraphrase-rich while her "history" is reconstruction all the
way down — the two corruption channels meet in the middle and
nobody can tell. The audience CAN tell, if it watches: she
corrects others and never herself. Distinct from Carmen at the
deepest level: Carmen's archive is deep and her fabrications are
grief-weighted (`constructed:true` quotes of the dead); Esther's
archive is thin and her confidence is fluency — Carmen
misremembers *wounded*, Esther misremembers *settled*.

### A09 → Asha Nair, 33 · night-rotating RN · `seed a09-mem`

```
archetype: C young adult (33 — bump tail)
pins: consc +0.9 · neurot +0.5 · selfconceal +0.6 (the clean
      version of the hospital) · extra −0.4 · wmc +0.6 ·
      sleep −0.8 (rotating nights — the accrual is real)
modifiers: shift-worker (night-rotating) · caregiver-fatigue
      (the studio she chose so nobody she knows lives on her
      floor — loneliness as preference, still costs)
domains: ward-procedure depth 0.85 (procedural store strong);
      bodies-in-distress depth 0.7 — the drift-and-check
      reflex is threat-channel encoding on posture/breathing
regimes: [short-staffed ward, ~now]: +stress, lapse_p +0.02,
      sleep debt accrues without apnea — voluntary restriction
records at promotion: 4y nursing + ambient months on the
      block, typed; remember islands: the code she ran alone,
      the first Mudhaus evening after a bad shift, watching
      Tom's gait mid-lap and filing "fine"
backfill: the nursing-school friend who left the field (open
      loop — the road not taken); the off-screen neglectful
      landlord (grievance record, unresolved)
SelfModel: self_est.clinical 0.6 / off-shift 0.4 — knows her
      work memory is good; believes her personal memory worse
      than it is; meta_gap 0.25
```

Delta layers: `defens +0.5` (hospital-wall compartmentalization —
Priya's structure paid for in sleep, not meditation) ·
`script_redeem +0.1` · `mnem_neg 0.35` (recall-gate on ward
records — she does not replay codes at Mudhaus; the phone stays
face-down) · `self_est 0.5` · `selfverif_w 0.6` ·
`self_complex 4` · `savor_k 0.3` · `dampen_k 0.5` (the
once-a-day laugh) · `elabor 0.3` · `future_cont 0.5` ·
`counterf_k 0.2` · tp_vec {0.3/0.3/0.5/0.3/0.6} ·
`narr_agency 0.7` · `narr_comm 0.5` · `autobio_k 0.5` ·
`narr_coh_k 0.5` · `period_sal 0.6` (pre/post the friend who
left) · `epi_future_k 0.5` · `voice_quote 0.2` ·
`report_policy 0.8` (clinical passes — "I can find out") ·
`grain_pref 0.35` · `ie_talk 0.9` · `voice_story 0.25` ·
`meta_proj 0.45` · `meta_recip 0.35` · `lgap_k 0.5` (the laugh
that counted — registers warmth, under-weights it) ·
`meta_ev_w 0.7` · `meta_neg_w 1.3` · `bmess_k 0.3` ·
`imagery 0.3` · `obs_persp 0.3` · `face_recog 0.55` ·
`interdep 0.5` · `family_remin 0.4` · `dejavu 0.35` ·
`shift_wrk 1.0` (cast-tier max WITH Priya — but
night-*rotating*: `post_night` flags most weeks,
`shift_age_equiv` accrues, and `medit 0.1` buys nothing back)
· `lonely 0.7` (chosen, still taxed — `lonely_rehearse_tax`
on a thin social ecology) · `tdef 0.7` · `rsq 0.4` ·
`smoker 0` · `job_cplx 0.8` · `medit 0.1`.

**Signature:** *the nurse who forgets she matters.* Shift-taxed
encoding + threat-channel vigilance on bodies + a mnemic gate on
the ward = the block sees a calm ambient; the archive holds a
hospital she declines to open. The Priya contrast is the point:
same ward, same `shift_wrk` ceiling, opposite books — Priya
compensates (`medit 0.8`) and her metaself is calibrated; Asha
pays and doesn't audit — her self_est under-rates a competence
the record keeps proving (the beautiful-mess asymmetry running
inverted). Her promotion arc is Priya's storyline from the other
side of the same hallway — and her ambient-era edges mean she
has already *seen* Priya's bad weeks, thinly, TOLD-tier, without
Priya knowing she was watching.

### A06 → Kofe Adeyemi, 29 · delivery rider · `seed a06-mem`

```
archetype: C young adult (29 — inside bump window)
pins: consc +0.7 · extra +0.3 · neurot +0.3 · wmc +0.8 (three
      apps, one phone, a grid he keeps solving) · open +0.3 ·
      selfconceal +0.4 (the Lagos remittance order matters;
      he doesn't discuss money)
modifiers: domain-expert (route optimization — prospective-
      memory specialist) · open-loop carrier
domains: street-grid/ETA depth 0.9 — "the whole street grid
      is a solved optimization problem he's still improving";
      door-codes/parking-intel ledger depth 0.7
regimes: [surge windows, daily]: lunch/dinner encoding funnels
      — during surge, nothing else mints
records at promotion: 2–3y riding, typed; remember islands:
      the first Lagos transfer, the rain-day record surge,
      the race-that-wasn't with Marcus
backfill: the family thread (off-screen, phone-only — the
      monthly remittance is a recurring open goal, Zeigarnik
      machinery's cleanest use case: it never closes, it
      renews); Omar's co-op recruitment (repeated soft
      pressure — `commit_soft`-adjacent records that never
      formalize)
SelfModel: self_est.routes/time 0.7 / people 0.5;
      strategy_use 0.6 — the phone IS the external store;
      extref-native cognition (offload per §35); meta_gap 0.15
```

Delta layers: `defens 0` · `script_redeem +0.4` (sends money
first — the provider script) · `mnem_neg 0` · `self_est 0.6` ·
`selfverif_w 0.5` · `self_complex 4` (rider/son/provider/racer)
· `savor_k 0.4` · `elabor 0.5` · `future_cont 0.7` (the math
has to work — plan-weighted) · `counterf_k 0.2` · tp_vec
{0.3/0.5/0.6/0.3/0.5} · `narr_agency 0.7` (the optimizer
narrates agency) · `narr_comm 0.4` · `autobio_k 0.4` ·
`narr_coh_k 0.6` · `period_sal 0.6` (pre/post the move,
Lagos→SF — immigration-bump window machinery applies) ·
`epi_future_k 0.7` · `voice_quote 0.3` · `report_policy 0.5` ·
`grain_pref 0.8` (talks in ETAs — precise on time, coarse on
people) · `ie_talk 1.0` · `voice_story 0.4` · `meta_proj 0.5` ·
`meta_recip 0.5` · `lgap_k 0.2` (surge windows don't allow the
audit) · `meta_ev_w 0.5` · `meta_neg_w 0.9` · `bmess_k 0.1` ·
`imagery 0.6` · `obs_persp 0.2` · `face_recog 0.5` ·
`interdep 0.75` (family-first construal) · `family_remin 0.6` ·
`dejavu 0.4` · `shift_wrk 0.4` (app-shaped not week-shaped —
weekends are the long days) · `lonely 0.5` · `tdef 0.5` ·
`rsq 0.3` · `imp_anchor 0.4` · `smoker 0` · `job_cplx 0.7`
(real-time optimization is complex work — the deposit feeds).

**Signature:** *the clock that remembers forward.* Prospective-
memory specialist: intention and open-goal records dominate his
archive — the remittance, the repairs, the surge windows —
while the episodic past stays thin because his attention lives
at T+ETA. The Marcus contrast: two riders, two differently-
empty archives — Marcus's is sunny-shallow and social (faces),
Kofe's is instrumental-shallow and temporal (times); Marcus
remembers who, Kofe remembers *when*. And the wordless rivalry
is now load-bearing: neither archive recorded a race, so both
can hold "never lost officially" forever — a shared non-memory
that no ledger can settle.

## 44. The remaining sixteen — template note

The other sixteen ambients stay on the ambient tier (§10: role
tags + 2-DOF jitter, no SelfModel, `individ_rate` 0.05) until a
promotion packet lands. Nothing in §43 changes their machinery —
the tier boundary is a lifecycle edge, not a quality cliff. When
a fifth promotion happens the compile is mechanical: freeze the
card, pin observable traits inside `promote_cont`, MVN the
latents, tag the era, seed only what the packet names.

## 45. Distinctness — ninth-pass notes

- **Esther vs Carmen** — two old widows on benches, opposite
  error structures. Carmen: deep archive, wounded fabrications,
  corrects herself. Esther: thin archive, fluent confabulation,
  never corrects. Same surface (stoop historian), different
  machines — P1402's pairwise test will find them ≥2σ apart on
  `confab_fill`, `mnem_neg`, `meta_gap`.
- **Asha vs Priya** — same hospital, same `shift_wrk` ceiling.
  Priya compensates and knows it (`medit 0.8`, calibrated
  metaself); Asha pays and doesn't audit (dark metaself —
  under-rates her own record). One ward, two tax returns.
- **Kofe vs Marcus** — social-shallow vs instrumental-shallow;
  the rivalry lives between two archives that never wrote the
  race down. Neither can lose what neither encoded.
- **Bex vs Dani** — the art thread's two ends: Dani invents
  (`constructed:true` quotes, fluent lies) while knowing
  nothing; Bex withholds (`selfconceal +0.8`, report_policy
  0.6) while knowing the one thing. The liar and the witness.
- **Cross-tier signature:** the four ambient eras *feel*
  different from inside — Esther's is confabulated-dense (feels
  full, isn't), Bex's is channel-selective, Asha's is shift-
  fogged, Kofe's is future-compressed (he barely looked back).
  Same machinery, four thinnesses.

## 46. Probes filed

P1392–P1404 → validation-design.md §262. Signature checks:
P1392 era immutability + verbatim retention; P1395 rehearsal
never flips rk; P1396/P1397 backfill honesty (drives behavior,
never footage, never detail); P1399 ambient era contains zero
secret records; P1402 the four promoted profiles ≥2σ apart
pairwise on ≥3 axes and none collapses onto its nearest main;
P1404 minor guard refuses guardian-less promotion.

## 47. Sources added this version

- Conway & Pleydell-Pearce 2000 (*Psych Rev* 107:261–288 —
  verified): the SMS hierarchy — lifetime periods → general
  events → event-specific knowledge. The ambient era compiles
  to the middle level by construction; promotion adds the
  bottom.
- Tulving 1985 (*Can Psych* 26:1 — verified): remember/know.
  Gardiner 1988 (*M&C* 16:309 — verified): the R/K paradigm.
  Yonelinas 2002 (*JML* 46:441 — verified): recollection/
  familiarity dual-process review — CONSENSUS-adjacent; the
  single-process dissent (Wixted 2004; Dunn 2004) stays
  DEBATED and `know_upgrade_null` is declared a modeling
  choice on that contested point.
- Neisser 1981 (*Cognition* 9:1 — verified): John Dean's
  memory — repetitions answer as the type, not the episode.
- Barsalou 1988 (in Neisser & Winograd, *Remembering
  Reconsidered* — verified): GERNs — repeated events merge
  into generic representations. Robinson 1992 — repeated-event
  merging in autobiographical recall.
- Wagenaar 1986 (*Cog Psych* 18:225 — verified): 2400 self-
  recorded events over 6y; "what" cues best, "when" worst —
  the skeleton shape of backfill records.
- Linton 1975 (in *Explorations in Cognition* — verified):
  event recognition stays high while temporal dating decays —
  the typed era's asymmetry.
- Johnson, Hashtroudi & Lindsay 1993 (*Psych Bull* 114:3 —
  verified): source-monitoring framework — confident gap-
  filling is the meta_gap substrate.
- Habermas & Bluck 2000 (*Psych Bull* 126:748 — verified):
  the life story is *constructed* in retrospect — backfill is
  what a real seeded past feels like, not a cheat.
- Symons & Johnson 1997 (*Psych Bull* 121:371 — verified):
  self-reference effect — memory for others' events < own;
  `ambient_wit_gain` direction consensus, dose HYPOTHESIS.
- Ebbinghaus 1885 (reused): savings — the demotion island's
  re-promotion gain.
- Mechanism constants: reused from spec §§6.386–6.392 (v5.76)
  and all prior pin layers — not re-cited.
