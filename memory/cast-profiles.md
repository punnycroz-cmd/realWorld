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
