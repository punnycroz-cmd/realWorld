# Cast Memory Profiles — the 8 mains, compiled (v22)

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
