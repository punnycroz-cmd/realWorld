# Age Development v3 — the lifespan shape of memory, calibrated

**Track:** memory-research (sf/memory) · **Focus:** age-development
**Consumes:** `memory-model-spec.md` §§2–7, `forgetting-curves.md`,
`retrieval-cues.md` · **Feeds:** spec v0.3 (continuous age functions,
childhood-amnesia ramp, life-script bump gate, associative-deficit link
formation, prospective-memory extension) and future `validation-spec.md`.

Purpose: v0's model made age a **band lookup** (5 archetypes). The real
literature describes **continuous functions of two ages** — the character's
age *now* (encoding/retrieval capacity) and their age *at encoding*
(era structure: amnesia, bump). This version replaces bands with knots on
continuous curves, pins the era boundaries to real numbers, and splits the
developmental story into its actually-distinct gradients (suggestibility
falls with age; gist-based false memory *rises*; associative binding falls in
old age while item memory is spared). Every claim cites; tags
**[CONSENSUS]** / **[DEBATED]** / **[HYPOTHESIS]** as before.

---

## 1. Two ages, not one

A memory record must carry `encodeAge` (character's age when the event
happened) because era effects key on it, while capacity effects key on
current age. Concretely:

| Effect | Keys on | Direction |
|---|---|---|
| Encoding capacity (attention, strategy, binding) | age_now | rises to ~20s, then declines |
| Retrieval efficiency (θ, speed) | age_now | inverse |
| Childhood amnesia | age_at_encoding | near-total below ~3.5, adult-like by ~7 |
| Reminiscence bump | age_at_encoding | retention bonus for ~10–30, peak ~15–25 |
| Source/detail fragility | age_now (high child AND older) | U-shape |
| Suggestibility (misinfo) | age_now | declines childhood→adult, rises again old |
| Gist-based false memory (DRM) | age_now | *rises* childhood→adult (developmental reversal) |
| Positivity effect | age_now | grows monotonic into old age |

The profiles doc's five archetypes are retained as **knots** on these
curves — the spec now interpolates, so a 34-year-old and a 47-year-old are
not the same rememberer even within "midlife."

## 2. Childhood amnesia — the encoding ramp, not a cliff

- **Adults recall essentially nothing from before ~age 3–4.** Rubin 2000
  (11,000+ memories across published studies): the density of memories per
  year-of-life rises steeply from birth to ~age 7 then follows normal
  forgetting; first-memory reports cluster mean ≈ 3.5 (range of means
  3.0–6.2 across studies, Malinoski et al. 1998; Eacott & Crawley 1998 —
  birth-of-sibling memories survive from age 2–3 for the event itself).
  **[CONSENSUS]**
- **The amnesia is made during childhood, not just revealed in adulthood.**
  Bauer & Larkina 2014 (prospective): children tested at 5, 6, 7 recall
  **≥60%** of early-life events; at 8–9, **<40%**. Adult-like
  remember/forget rates arrive "around age 7 or soon after."
  **[CONSENSUS finding]**
- **Form difference.** Bauer & Larkina 2013 (JEP:G): children's
  autobiographical distributions fit an **exponential**; adults' fit a
  **power law** — childhood forgetting is a constant-rate consolidation
  failure, not the adult shallow tail. **[CONSENSUS-ish; two-lab
  literature]**
- **Mechanism is consolidation failure + immature encoding, NOT absent
  storage.** Three-year-olds discuss their own past; the memories exist,
  then die (Bauer & Larkina 2014). So records formed at age_at_encoding
  < ~7 should be *born weak and decay fast*, not be unencodable —
  crucially, a 6-year-old character in RW *should* remember last week's
  birthday party (children recall recent early events fine); what she
  won't do is carry it into adulthood. **[CONSENSUS]**

**Spec consequence (v0.3):** encoding gains an age-at-encoding multiplier
`amnesia_ramp(a)` = 0.05·a for a<3 (≈0 below 1, 0.15 at 3), linear to
1.0 at a=7 — replacing the old profile note "accuracy·0.3, decay 2×" with
a continuous rule. Additionally, records encoded before age `amnesia_exit`
(7) carry a **permanent elevated decay** `beta_episodic × amnesia_decay_mult`
(≈1.8) reflecting the exponential-regime loss — they don't switch to the
adult curve when the character ages. That's what erases early childhood by
adulthood while leaving it intact during childhood itself.

## 3. The reminiscence bump — sharper, and gated on valence

- **Bounds:** autobiographical recall concentrates on age_at_encoding
  ≈ 10–30, peak 15–25 (Rubin, Wetzler & Nebes 1986; Rubin & Schulkind
  1997). Janssen, Chessa & Murre 2005 (n≈2000, internet Galton-Crovitz):
  peak **15–18 for men, 13–14 for women** — earlier and tighter than the
  textbook 15–25. **[CONSENSUS]**
- **The bump is mostly for positive/important events.** Berntsen & Rubin
  2004 (life scripts, 1,485 respondents): transitional-event norms cluster
  at 15–30 and are **narrower and more positive**; Rubin & Berntsen 2003
  (1,241): bump appears for happiest/most-important memories but is **flat
  or absent for saddest/most-traumatic**. Conway & Holmes 2004; Bohn 2010
  find the same. **[CONSENSUS direction; life-script vs. identity-formation
  accounts DEBATED]** — for RW this is a gift: a character's grudge doesn't
  get the bump bonus; their first love does.
- **Odor-cued memories reach a different era** (ages 6–10, Willander &
  Larsson 2007; Chu & Downes 2000) — already implemented via
  `sensory_age_slope` in v0.2; the age-development version adds that the
  *bump window itself shifts earlier for odor-cued recall* — odor cues
  retrieve childhood more than word/social cues do.

**Spec consequence (v0.3):** `bump_beta_mult` applies only when
`encodeAge ∈ [bump_lo, bump_hi]` (defaults 10–30, peak-shaped) **AND**
`emotional.valence > 0` OR `selfRelevance > bump_self_thresh` — negative
unremarkable events get no bump (new param `bump_valence_gate`, default
on). Window edges soften: bonus scales with a raised cosine over
[bump_lo, bump_hi] peaked at `bump_peak` (15; per-character jitter ±3y,
and world-builder may shift it for early-maturing or late-bloom
biographies).

## 4. Childhood and adolescence — capacity, suggestion, and the reversal

- **Encoding and strategy mature steadily through the teens**; working
  memory and controlled rehearsal reach near-adult levels ~15–16 (Gathercole
  et al. 2004). **[CONSENSUS]**
- **Suggestibility falls steeply with age** — children 5–7 are the most
  misinformation-susceptible witnesses (Ceci & Bruck 1993; Otgaar et al.
  2018 meta-analytic reviews). **[CONSENSUS]**
- **BUT gist-based false memory *rises* with age — developmental
  reversal.** Brainerd & Reyna (fuzzy-trace; Brainerd, Reyna & Ceci 2008
  review; Brainerd et al. 2002 DRM): connecting meaning across events —
  the machinery that produces DRM-style "it must have happened" memories —
  is weak in young children and strengthens into adulthood. Children are
  more *suggestible*; adults are more *spontaneously gist-wrong*.
  **[CONSENSUS for DRM class; the two opposing gradients is now the
  canonical picture]**
- **Adolescence:** emotional/reward salience peaks before cognitive control
  matures (Casey, Jones & Hare 2008); adolescent memories carry unusually
  high affective charge and social weight. The teen archetype's
  `w_people > w_topic` inversion (v0) stays as a documented deviation.
  **[CONSENSUS direction]**

**Spec consequence (v0.3):** separate the two distortion channels' age
gradients: `misinfo_suscept` = U-shaped (high child → low adult → high
old); `confab_fill` and DRM-style gist errors = monotonic rise into
adulthood then continue rising in old age (Koutstaal & Schacter 1997:
older adults' gist-based false recognition is *elevated*). Profiles table
now annotates which channel each number belongs to.

## 5. Older adulthood — the deficit is in the *binding*

- **Associative deficit hypothesis** (Naveh-Benjamin 2000, 2002): older
  adults' episodic deficit is disproportionately a failure to bind items
  into episodes and episodes to context — item memory is relatively
  spared, *association* memory impaired; intact when components are
  already integrated. **[CONSENSUS pattern; causal status DEBATED —
  strategy deficits explain part (Naveh-Benjamin et al. 2007)]**
- **Source/context detail degrades first** (Spencer & Raz 1995:
  differential aging of content vs. context memory; Schacter et al. 1994).
  **[CONSENSUS]**
- **Prospective memory paradox:** older adults are impaired on
  *self-initiated/time-based* intentions in lab tasks but equal or better
  on real-world *event-based* ones (Phillips, Henry & Martin 2008;
  Schnitzspahn et al. meta-analyses; resolved as cue-dependence: external
  triggers rescue older PM). **[CONSENSUS pattern; magnitude in the wild
  DEBATED — 2024 meta-analysis narrows the paradox to task distance]**
- **Positivity effect** grows with age (Carstensen's SST; Mather &
  Carstensen 2005): attention *and* memory shift positive — fades negative
  affect faster (spec §4.5 already), but v3 adds the encoding-side
  component: `w_emo` should respond asymmetrically to valence in older
  profiles (positive arousal encoded fuller than negative).

**Spec consequence (v0.3):**
- New record field `links` formation probability `link_p` (0.75 default)
  scaled by `assoc_mult(age_now)`: 1.0 ≤30 → 0.55 at 75 — old characters
  remember *that* Mara said something but not *where/when/in whose
  presence*, which mechanically produces source-tag loss and
  cross-episode bleed (hears a rumor about X, grafts details onto
  witnessed memory of Y with the same person).
- `theta` and `misinfo_suscept` rise with age via the curve; verbatim
  `k_verbatim` rises; `beta_semantic` stays flat (Park et al. 2002).
- Prospective memory extension (below, §7) — optional, roadmap-flagged.

## 6. The continuous age curves (replaces band lookup in spec v0.3)

Define `age_now = (worldDay − birthWorldDay)/365`. Each param gets a
**piecewise-linear knot function** evaluated at age_now (capacity terms)
or encodeAge (era terms). Knots (age → multiplier on the young-adult
C-band default):

| param (capacity) | age 6 | 13 | 20 | 30 | 50 | 70 | 85 | shape |
|---|---|---|---|---|---|---|---|---|
| enc_base | .67 | .93 | 1.0 | 1.0 | .84 | .62 | .52 | inverted-U, peak plateau 18–35 |
| att_min | 1.67 | 1.0 | 1.0 | 1.0 | 1.25 | 1.5 | 1.6 | U (more gating failures both ends) |
| beta_episodic | 1.55 | 1.07 | 1.0 | 1.0 | 1.31 | 1.71 | 1.86 | U-ish, steep old tail |
| beta_semantic | 1.94 | 1.22 | 1.0 | 1.0 | 1.0 | 1.22 | 1.3 | mild rise; semantics robust |
| beta_source | 2.0 | 1.13 | 1.0 | 1.0 | 1.5 | 2.1 | 2.3 | U, fastest-decaying field |
| theta | 1.0 | 1.05 | 1.0 | 1.0 | 1.18 | 1.3 | 1.4 | retrieval threshold rises old |
| misinfo_suscept | 2.0 | 1.5 | 1.0 | 1.0 | 1.17 | 1.67 | 1.9 | U — suggestion channel |
| confab_fill | .45 | .8 | 1.0 | 1.0 | 1.33 | 1.78 | 2.0 | monotonic — gist channel (reversal!) |
| drift_p | 1.7 | 1.3 | 1.0 | 1.0 | 1.4 | 2.0 | 2.2 | U |
| neg_affect_decay | .85 | .72 | 1.0 | 1.0 | 1.12 | 1.36 | 1.45 | positivity grows (higher=negative fades faster) |
| link_p | .6 | .85 | 1.0 | 1.0 | .85 | .6 | .5 | associative deficit |
| intrusion_thresh | 1.0 | 1.0 | 1.0 | 1.0 | .95 | .87 | .85 | older minds wander to the past |
| w_emo | 1.3 | 1.6 | 1.0 | 1.0 | .9 | 1.1 | 1.15 | teen spike; old = affect-led |
| w_self | .8 | 1.27 | 1.0 | 1.0 | .9 | .9 | .9 | adolescent identity spike |

Derived era terms (evaluate at encodeAge):
- `amnesia_ramp(a) = clamp(a/7, .05, 1)` — multiplies E for a<7.
- `amnesia_decay_mult(a) = 1.8` if a < `amnesia_exit` (7), else 1 —
  permanent on the record.
- `bump_gain(a) = bump_beta_mult + (1−bump_beta_mult)·(1−cos(π·clamp((a−10)/20)))`
  — raised cosine ≈ full bonus only near bump_peak=15–20 — applied iff
  `bump_valence_gate` passes (valence>0 or selfRelevance>0.6).

**Rationale anchors:** enc_base/β_episodic slopes follow Park et al. 2002
linear decline (~–0.02 sd/yr on episodic from the 20s) rescaled to
game-time; child knots from Bauer & Larkina rates; suggestibility U from
Ceci & Bruck + Otgaar metas; confab monotonic from Brainerd & Reyna;
link_p from Naveh-Benjamin; source U from Spencer & Raz. **[Curve knots
are HYPOTHESIS — interpolations between cited anchor points; the anchors
are CONSENSUS, the smoothness is ours.]**

## 7. Prospective memory — extension spec (roadmap-flagged, cheap)

Not in v0 scope; age-development makes it near-free to add now. An
`Intention` = {action, triggerCues, dueDay}. Resolution: on each tick, if
current context overlaps `triggerCues` → recall the intention with the
ordinary §5 formula **in event-based mode** (cue-driven — older adults are
fine, even advantaged by routine); if `now > dueDay` with no triggering
context → self-initiated check with probability `pm_self` (knots: .8 young
→ .45 old). This reproduces the lab-vs-life paradox for free: the same
older character who forgets "call the plumber at 3pm" never forgets to
pick up the grandkid when the school bell rings. **[HYPOTHESIS
implementation of CONSENSUS phenomenon]**

## 8. What changed in the spec (v0.2 → v0.3)

| # | Change | Grounding |
|---|---|---|
| D1 | Record gains `encodeAge`; params evaluated continuously via knot table §6 (replaces band lookup; archetypes demoted to named knots) | §§1–6 |
| D2 | Encoding multiplier `amnesia_ramp(encodeAge)` + permanent `amnesia_decay_mult` on pre-7 records | §2 (Rubin 2000; Bauer & Larkina 2013/2014) |
| D3 | `bump_beta_mult` → `bump_gain(encodeAge)` raised-cosine window 10–30, peak ~15, **gated on valence>0 or selfRelevance>0.6** (`bump_valence_gate`) | §3 (Rubin 1986; Janssen 2005; Berntsen & Rubin 2004) |
| D4 | Distortion channels split: `misinfo_suscept` U-shaped vs `confab_fill` monotonic — developmental reversal implemented | §4 (Brainerd & Reyna; Koutstaal & Schacter) |
| D5 | `link_p` + `assoc_mult(age)` — associative edges formed probabilistically; weak links → mechanical source/context loss | §5 (Naveh-Benjamin 2000; Spencer & Raz 1995) |
| D6 | `pm_self` + `Intention` extension (§7, optional) | §5 (Phillips et al. 2008; 2024 meta) |
| D7 | `w_emo` valence-asymmetric for older profiles: `w_emo_pos`/`w_emo_neg` split, older: 1.25/0.85 | §5 (Mather & Carstensen 2005) |

New params: `encodeAge` (record), `amnesia_exit 7`, `amnesia_decay_mult
1.8`, `bump_lo 10, bump_hi 30, bump_peak 16, bump_valence_gate true,
bump_self_thresh 0.6`, `link_p 0.75`, `assoc_mult` (curve), `pm_self`,
`w_emo_pos`, `w_emo_neg`. Clamp rows added in profiles §0.

## 9. Validation probes (P17–P22; continue P1–P16)

- **P17 amnesia ramp:** a character's records encoded at ages 2–6 should be
  ~absent from recall by age 25 (survival <5%), while age-8+ records
  survive at the normal autobiographical rate — the childhood pool must
  empty *during* childhood (Bauer & Larkina: >60% present at age 5–7 for
  events discussed at 3, <40% by 8–9).
- **P18 bump shape:** cue-word recall by a 60-year-old should produce a
  density peak at encodeAge 10–30, and the peak must shrink or vanish if
  `bump_valence_gate` is removed — i.e., the bump lives in positive/salient
  records (Rubin & Berntsen 2003).
- **P19 reversal:** same gist-consistent-but-false suggestion given to a
  child and an adult — child adopts more *verbatim* planted details
  (misinfo channel), adult produces more *spontaneous* gist-lures on
  unrelated recall (confab channel). Fail if both rise/fall together.
- **P20 associative deficit:** older adult correctly recalls two co-
  occurring facts (A happened; B happened) but misattributes their pairing
  (thinks B happened with C) at measurably higher rate than a young adult
  — item spared, binding lost.
- **P21 source-first decay at both ends:** youngest and oldest characters
  should show the fastest content-intact/source-lost transitions
  ("I heard it somewhere") — U-shape, not monotone.
- **P22 PM paradox (if §7 enabled):** an older character completes an
  event-cued intention (triggered by a place/person) at ~young-adult rate
  but misses a bare deadline intention ~1.5–2× as often.

## 10. Honest limits

- Knot table interpolations are fitted to *anchor points*; between-knot
  linearity is convenience, not data. Longitudinal (not cross-sectional)
  decline data (Rönnlund et al. 2005 — declines start later and slope
  shallower) suggests our old-age knots may be pessimistic ~5–10y;
  flagged, not corrected — pessimism reads better on screen anyway
  **[HYPOTHESIS call, documented]**.
- The valence gate on the bump simplifies a real debate (identity-
  formation vs. life-script accounts); it produces the observed
  *distribution* even if the mechanism is misattributed.
- Children under ~3 in RW are almost never characters; the ramp matters
  for backstory seeding (bibles generate childhood records via the same
  encoder) more than live toddlers.

---

# Part II — v15 deepening (2026-09-23): infancy latents, socialization, retrieval-side inhibition, and the two bumps nobody modeled

v0.3 covered the era structure (amnesia ramp, valence-gated bump,
continuous knots); v0.4 covered decline. What remained qualitative or
missing: (a) WHERE pre-amnesia records go (the animal literature says
*latent, not erased*); (b) the developmental gradient is partly
*socially set* — how much a child is talked-to about the past moves the
amnesia boundary itself; (c) the aging deficit isn't only binding —
it's *inhibition at retrieval* (rambling as a failure mode); (d) the
bump was episodic-only while the strongest real-world bump evidence is
for *cultural/semantic* material; (e) two sign errors caught this pass —
older adults are MORE protected by knowledge against fluent lies, not
less, and children get MORE overnight consolidation, not less. Citations
tagged **[CONSENSUS]** / **[DEBATED]** / **[HYPOTHESIS]** as before.

## 11. Infantile traces are latent, not erased — the under-3 floor

- **Infant retention scales ~linearly with age at encoding.** The
  conjugate-reinforcement paradigm (Rovee-Collier; Rovee-Collier &
  Cuevas 2009 summary): maximum retention rises from ~1–2 days at 2
  months to ~13–14 weeks by 18 months — infants DO store; the store is
  just aggressively time-boxed. **[CONSENSUS — best-studied infant
  retention data]**
- **"Forgotten" infant memories persist as latent engrams reactivable
  by compound reminders.** Travaglia et al. 2016 (*Nat Neurosci*): an
  infantile-period aversive memory in rats survives as a latent trace
  long-term; a reminder combining **context AND reinforcer** reinstates
  a robust, context-specific memory — partial reminders do nothing.
  Guskjolen et al. 2018 (*Curr Biol*): optogenetic reactivation of
  encoding-tagged dentate gyrus ensembles recovers "lost" infant fear
  memory in adult mice up to 3 months later — storage failure ruled
  out; it is an *accessibility* failure. Frankland & Josselyn (and
  Akers et al. 2014): postnatal hippocampal neurogenesis drives the
  forgetting — high neurogenesis flips memories to inaccessible.
  **[CONSENSUS mechanism in rodents; human read-through HYPOTHESIS —
  nobody has optogenetics for people, but cue-dependence of early
  memory (odor/sensory superiority, §3) is consistent]**

**Spec consequence (v1.5):** records with `encodeAge < amnesia_exit`
that fall below `forget_thresh` (or fail the §4.1 childhood
consolidation gate) no longer archive — they set `latent: true`. Latent
records are invisible to ordinary recall, the §5.7 involuntary scan,
and §4.13 retell ecology. The ONLY resurrection route is compound
sensory reinstatement: §5.20. Additionally, for `encodeAge < 3`,
auto-latent after `ret_window(a) = ret_win_base·(a+1)` days regardless
of strength (ret_win_base ≈ 3 — the Rovee-Collier box). Effect in RW:
a grown character revisiting a childhood place + smell + object can
surface a fragment of something that happened before age 3 — no
narrative, no source tag, all confabulation surface (§5.5), which is
exactly how adult reports of earliest memories actually present.

## 12. Socialization of autobiographical memory — the bible dial

- **How caregivers talk about the past determines when autobiographical
  memory begins.** Fivush & Nelson 2004; Nelson & Fivush 2004: the
  emergence of autobiographical memory is driven by *reminiscing style*
  — elaborative caregiver talk (expanding, contextualizing, asking
  open questions) vs repetitive style. Reese & Newcombe 2007
  (longitudinal): maternal elaborativeness predicts children's earlier
  first memories and denser early-childhood pools, ~1–2 year shifts in
  the amnesia boundary; effect mediated by narrative coherence skills.
  **[CONSENSUS direction; causal magnitude DEBATED — correlational
  designs, shared variance with temperament/language]**

**Spec consequence (v1.5):** per-character `reminiscence_env ∈ [0,1]`
(default 0.5), set at character creation from the bible's family
description — a *backstory* parameter, fixed for life. Effects:
`amnesia_exit_eff = amnesia_exit − 3·(reminiscence_env − 0.5)` (±1.5y
boundary shift) and `child_consol_gain_eff = child_consol_gain·(0.6 +
0.8·reminiscence_env)` (elaborated-on events survive consolidation more
— parental retelling IS rehearsal). World-builder gets a one-line dial
("grew up in a storytelling household") that moves real memory
structure — two siblings can have different childhood amnesia
boundaries. **[HYPOTHESIS parameterization of CONSENSUS finding]**

## 13. Production deficiency — children have the tools, don't deploy them

- **Children under ~8 fail to *spontaneously* produce encoding
  strategies they execute fine when prompted** (Flavell 1970
  production/mediation deficiency; Bjorklund et al.; Schneider &
  Pressley 1997 — strategy use develops ~7–12, rehearsal first,
  organization/elaboration later). Adult-guided narration compensates
  (§12 mechanism). **[CONSENSUS]**
- **Gist extraction is late-maturing** (fuzzy-trace, Brainerd & Reyna):
  young children are verbatim-bound — they keep surface detail but
  under-extract the connective gist that adult reconstruction runs on.
  **[CONSENSUS]**

**Spec consequence (v1.5):**
- `elab_gain` and `gen_gain` (v1.2) are gated by
  `strategy_ramp(a) = clamp((a−4)/8, 0, 1)` evaluated at `age_now` —
  zero at 4, full by `strategy_exit` (12). Children encode events;
  they just can't *elaborate* them (no self-reference dividend, no
  generation bonus on self-composed conclusions).
- Events carrying `scaffolded: true` (an adult walked them through it —
  retelling, guided questioning, supervised practice) bypass the ramp:
  `E += scaffold_gain` (0.15) — the child's elaboration is outsourced.
  This is also the mechanical link behind §12: high-reminiscence_env
  bibles scaffold more events.
- `gist` field birth strength for `encodeAge < 8` is multiplied by
  `child_gist_mult` (0.7): childhood records reconstruct as vivid
  fragments with weak narrative spine — detail shards, not stories.

## 14. Retrieval-side inhibition — off-target verbosity as a failure mode

- **Aging impairs deletion/restraint inhibition, so irrelevant but
  activated traces leak into output.** Hasher & Zacks 1988 framework;
  Arbuckle & Gold 1993 (*J Gerontol*, n=205): off-target verbosity in
  the elderly is specifically predicted by working-memory
  *deletion/restraint* measures, not by general cognition or
  talkativeness (Gold & Arbuckle 1995 confirmatory factor split;
  Arbuckle et al. 2000 longitudinal). **[CONSENSUS that OTV exists and
  correlates with inhibition; DEBATED whether it's deficit or style —
  Trunk & Abrams 2009 argue it's partly a communicative choice among
  older storytellers; both true in our model: the base rate is a
  deficit dial, expressiveness is a personality dial]**

**Spec consequence (v1.5):** during any `recall` bout (k>1) or
narrative retell, each emitted item beyond the first has probability
`offtarget_p(age_eff)` of being replaced/supplemented by a
weakly-related live record (shared person or era tag, drive ≥ 0.2·θ —
*activated but irrelevant*). Knots: 0.01 at 20 → 0.03 at 50 → 0.15 at
80 (also mildly elevated in children <10 — same inhibition immaturity,
different end). Emitted off-target records DO get the §5.9 reboost —
rambling rehearses the tangent. This produces the signature behavior
for free: the old character asked "what happened Tuesday" who ends up
telling you about 1987. It also gives the profiles doc a legible
phenotype: `offtarget_p` high + `chain_gain` high = the wandering
storyteller.

## 15. Illusory truth × knowledge — the aging inversion (sign correction)

- **Repetition→truth is real for everyone and knowledge does NOT
  protect young adults.** Fazio, Brashier, Payne & Marsh 2015
  (*JEP:G*): illusory truth occurs even for statements participants
  demonstrably know are false — "knowledge neglect."
- **Older adults are the ones whose knowledge protects them.**
  Brashier, Umanath, Cabeza & Marsh 2017 (*Psychol Aging*): older
  adults show illusory truth ONLY when they lack prior knowledge;
  stored knowledge actively counters fluency for them. The
  age-susceptibility claim is therefore INVERTED from naive intuition:
  the old are more vulnerable to *novel* repeated claims (fluency +
  weaker source memory) and MORE resistant to repeated claims that
  contradict what they know (dense semantic store + knowledge use).
  **[CONSENSUS finding — two high-quality papers in direct contrast]**

**Spec consequence (v1.5):** in §6.3, before applying the rep_gain
fluency term, check whether the claim contradicts a live semantic
record with `strength ≥ know_protect_thresh` (0.5): if so and
`age_eff ≥ know_protect_age` (50), adoption × `know_protect_mult`
(0.5); if `age_eff < know_protect_age`, NO protection (knowledge
neglect). On claims with no contradicting knowledge, the old keep the
existing elevated `misinfo_suscept` U. Net phenotype: an old character
is paradoxically the hardest person in the cast to fool about their
own domain and the easiest on anything new — a stranger's repeated
gossip about the mayor sticks; repeated gossip that "Mara always
was cheap" bounces off the landlord who's known her for decades.

## 16. Childhood sleep consolidation — the inverted sws knot

- **Children benefit MORE from sleep, and mid-day sleep is a real
  consolidation event.** Wilhelm, Diekelmann & Born 2008: sleep in
  children improves declarative memory more strongly than in adults
  (deep SWS-rich early-night sleep). Kurdziel, Duclos & Spencer 2013
  (*PNAS*, n≈40 preschoolers): a classroom nap enhances morning-encoded
  learning vs equivalent wake; the benefit is largest for **habitual
  nappers** regardless of age; and crucially, the ~10% performance loss
  when nap-deprived is **NOT recovered by subsequent overnight sleep**
  — consolidation timing matters, not just total sleep.
  **[CONSENSUS-ish; small samples, two-lab literature]**

**Spec consequence (v1.5):**
- `sws_mult` gains a childhood knot: 1.2 at age 6 declining to 1.0 by
  ~14 — children consolidate episodic content MORE overnight (inverse
  of the old-age decline; the curve is now genuinely lifespan).
- `dailyMemoryTick` accepts `nap: true` (game-supplied for characters
  < `nap_age_exit`, 6): a mid-day mini-tick applies the §4.6
  consolidation window early to same-morning records. If a
  nap-habitual child (bible flag) misses the nap, same-day records eat
  `nap_loss` (0.1) at the night tick — non-recoverable, matching
  Kurdziel's null recovery.

## 17. The bump is semantic too — cultural memory and the cascade

- **The strongest real-world reminiscence bump is for cultural
  products, not events.** Krumhansl & Zupnick 2013 (*Psychol Sci*):
  autobiographical association, preference, and emotion peak for music
  released during the listener's ~10–30 window — but a SECOND peak
  appears for music of the **parents' generation** (childhood exposure,
  own encodeAge ~5–10): "cascading reminiscence bumps." Svob & Brown
  2012 (*Psychol Sci*): intergenerational transmission of the bump for
  *biographical conflict knowledge* — children retain their parents'
  era-defining events. Janssen et al. 2007 (favorite books/films/
  records) same window. **[CONSENSUS pattern — replicated across
  music, film, public-event knowledge]**

**Spec consequence (v1.5):**
- `bump_gain(encodeAge)` now also applies to **semantic** records
  tagged `cultural: true` (songs, foods, rituals, neighborhood lore —
  world-builder supplies the tag) at reduced gain `bump_semantic_gain`
  (0.5) — permastore candidates disproportionately minted in the bump
  window. A 60-year-old's definitive version of "the good taqueria"
  is the one from when she was 19.
- Cascade: cultural semantic records encoded at `encodeAge ∈ [4,10]`
  with `cascade: true` (content transmitted by a parent figure's
  bump-era pool — bibles flag it) get a second, weaker bonus
  `bump_cascade_gain` (0.4). This is what makes a grown character
  inexplicably know their grandmother's music better than their
  own generation's deep cuts.

## 18. Metamemory — children are miscalibrated UP

- **Children grossly overestimate their memory** — prediction accuracy
  near-chance until ~8–10, bias strongly positive (they think they'll
  remember everything; Flavell et al. 1970; Schneider & Pressley
  1997; Koriat & Shitzer-Reichert 2002). **[CONSENSUS]**
- **Older adults' JOL calibration is largely preserved** (Hertzog &
  Dunlosky reviews) — what degrades is confidence-monitoring of
  *output* (they're overconfident about specific wrong answers,
  Dodson et al. 2007 misinformation-adjacent), not their global
  self-model. **[CONSENSUS-ish]**

**Spec consequence (v1.5):** knot rows for the v1.0 metamemory params —
`metamem_r`: ~0.0 at 6 → 0.10 at 13 → 0.15 adult (self-model nearly
decorrelated in children); `self_est_bias`: +0.3 at 6 → 0 adult →
−0.05 at 70 (the elderly slightly *under*rate themselves — the
"my memory is terrible" elder with a fine memory is real). Children
say "I'll totally remember" and don't; old characters say "I'm going
senile" and mostly aren't.

## 19. Smaller corrections folded in

- **Source-confusion channel asymmetry** (Foley & Johnson 1985; Foley,
  Johnson & Raye 1983 — children over-confuse *internal* sources:
  imagined↔witnessed flips; Henkel, Johnson & De Leonardis 1998;
  Hashtroudi et al. — older adults' errors are predominantly
  *external*: right content, wrong person/channel). `source_confuse_flip`
  gets age multiplier `child_internal_confuse` (2.0 below ~9);
  `source_confuse` rides the existing old-side knots (1.8× at 75).
  Same "source monitoring fails" umbrella, opposite channel by age.
- **Child trauma threshold offset [HYPOTHESIS — small]:**
  `trauma_thresh_eff = trauma_thresh − child_trauma_off·max(0, 1 −
  encodeAge/12)` (`child_trauma_off` 0.1) — the same arousal reads as
  overwhelming to a child whose regulation is undeveloped; flagged
  hypothesis, not literature-established.
- **Telescoping grows with age** (Janssen, Chessa & Murre 2006 —
  forward telescoping is age-graded): `tele_k_eff` already exists;
  multiply by `(1 + tele_age_gain·age_eff/80)`, `tele_age_gain` 0.5 —
  old characters push remote events systematically more recent.

## 20. What changed in the spec (v1.4 → v1.5)

| # | Change | Grounding |
|---|---|---|
| E1 | Record field `latent`; pre-amnesia records go latent not archived; `ret_window(a)` auto-latent under 3 | §11 (Rovee-Collier; Travaglia 2016; Guskjolen 2018) |
| E2 | §5.20 compound-sensory reinstatement of latent records at `latent_recall_p` | §11 |
| E3 | `reminiscence_env` bible dial shifts `amnesia_exit` ±1.5y + `child_consol_gain` | §12 (Fivush & Nelson; Reese & Newcombe 2007) |
| E4 | `strategy_ramp(age)` gates elab_gain/gen_gain; `scaffolded` events get `scaffold_gain`; `child_gist_mult` on gist birth | §13 (Flavell 1970; Brainerd & Reyna) |
| E5 | §5.19 `offtarget_p(age)` bout contamination — retrieval-side inhibition | §14 (Arbuckle & Gold 1993; Hasher & Zacks) |
| E6 | §6.3 knowledge-protection rule: `know_protect_*` — old protected BY knowledge, young neglect it | §15 (Fazio 2015; Brashier 2017) — sign fix |
| E7 | `sws_mult` child knot 1.2; `nap`/`nap_loss` mid-day consolidation | §16 (Kurdziel 2013; Wilhelm 2008) |
| E8 | `bump_semantic_gain` + `bump_cascade_gain` — bump extends to cultural semantic records + parents'-era secondary peak | §17 (Krumhansl & Zupnick 2013; Svob & Brown 2012) |
| E9 | metamem knots: `metamem_r` 0 in children; `self_est_bias` +0.3 child / −0.05 old | §18 |
| E10 | `child_internal_confuse` 2.0 on source_confuse_flip; external stays old-side | §19 (Foley & Johnson 1985) |
| E11 | `child_trauma_off` 0.1 threshold offset [HYPOTHESIS]; `tele_age_gain` 0.5 | §19 |

New params: `ret_win_base` 3.0, `latent_recall_p` 0.08,
`reminiscence_env` 0.5, `strategy_exit` 12, `scaffold_gain` 0.15,
`child_gist_mult` 0.7, `offtarget_p` (curve; base 0.03),
`know_protect_age` 50, `know_protect_thresh` 0.5,
`know_protect_mult` 0.5, `sws_child_peak` 1.2, `nap_age_exit` 6,
`nap_loss` 0.1, `bump_semantic_gain` 0.5, `bump_cascade_gain` 0.4,
`child_internal_confuse` 2.0, `child_trauma_off` 0.1,
`tele_age_gain` 0.5.

## 21. Validation probes (P136–P144; registry continues P1–P135)

- **P136 latent amnesia (MUST):** encode dense events at encodeAge 1–3,
  age the character to 25 → the records exist on snapshot with
  `latent:true`, zero ordinary-recall hits; compound sensory+place cue
  surfaces them at ≈latent_recall_p; single-word cues NEVER (the
  Travaglia context+reinforcer requirement — partial reminders must
  fail or the parameterization is wrong).
- **P137 reminiscence_env (MUST):** two otherwise-identical characters,
  env 0.9 vs 0.1 → the high-env character's earliest surviving records
  sit ~2–3y earlier AND their age-5 pool is denser; low-env child still
  functions (env moves the boundary, not the capacity).
- **P138 production deficiency (MUST):** child's own elaborative events
  vs scaffolded events at matched content → scaffolded survives at
  adult-relative rate, self-elaborated at baseline; TOST: elab_gain
  contributes ≈0 below age 7.
- **P139 off-target verbosity (SHOULD):** 75-year-old bout recall emits
  era-mate intrusions ≥5× the 25-year-old rate; intrusions are
  live records with real drive (not noise); flagged DEBATED-styled —
  probe measures emission rate only, interpretation is free.
- **P140 knowledge-protection inversion (MUST — sign-locked):** repeated
  false claim contradicting a strong semantic record → old char adopts
  at HALF the young char's rate; the same claim on a novel topic →
  old adopts MORE (U-curve + fluency). Fails if both directions move
  together — this probe exists to prevent regression on the v1.5
  sign fix.
- **P141 child sleep inversion (SHOULD):** <6 character: nap vs
  nap-deprived same-morning records → ~10% R gap, NOT recovered after
  a normal overnight tick; adult control shows no nap effect.
- **P142 cascading bump (SHOULD):** cultural-tagged semantic records
  show two encode-age density peaks (own bump window + [4,10] cascade);
  non-cultural semantics show one. Constrains bump_semantic_gain /
  bump_cascade_gain.
- **P143 metamemory calibration (SHOULD):** selfReport vs actual recall
  correlation ≈0 under age 10 (TOST vs adult r); child self-estimates
  exceed actual ≥1.5×; 70-y/o self-estimates ≤ actual.
- **P144 source-channel split (SHOULD):** child confusion errors are
  ≥60% internal (imagined→witnessed); 75-y/o errors ≥60% external
  (wrong-speaker/wrong-channel). Fails if the channels don't diverge.

## 22. Honest limits, updated

- The latent-infancy mechanism is rodent-primary; the human version is
  a *defensible* read-through, not established. `latent_recall_p` is
  deliberately small — it exists for the rare fictional payoff
  (returned-to-childhood-home scenes), not as a retrieval pathway.
- `reminiscence_env` and `scaffolded` assume world-builder supplies
  family-style metadata; without it both default to neutral and the
  system degrades gracefully to v1.4 behavior.
- OTV is the most style-confounded finding here (Trunk & Abrams 2009)
  — P139 constrains the rate, not the interpretation; bibles may raise
  `offtarget_p` for loquacious characters at any age.
- The child side of sws_mult rests on small n; the direction (children
  benefit more) is better established than the 1.2 magnitude.
- Brashier 2017's knowledge protection is the *controlled-claims*
  finding; whether it survives real rumor ecology (partisan, social)
  is untested — P140's sign-lock is the falsifier.

---

# Part III — v27 deepening (2026-09-23): the bump's fuel, the adolescent regime, and the gates that never were

Part I priced the era structure (amnesia ramp, valence-gated bump,
continuous knots); Part II priced infancy latents, socialization, the
semantic bump, and two sign corrections. What remained: (a) the bump was
still a *distribution fact* with no mechanism — nobody had modeled WHY
10–30 fills up (firsts and transitions do it); (b) adolescence was one
knot column when it is a distinct *regime* — circadian shift, social-
evaluative encoding, peer rehearsal ecology, life-narrative onset all
concentrate there; (c) item-level discrimination was treated as an
old-age mechanism only — it also *matures*, which produces a three-
channel childhood false-memory picture (suggestion high, gist low,
item-discrimination poor); (d) the amnesia gates were applied too
broadly — early *semantic* and *procedural* learning survives fine;
(e) adult female reproductive transitions are time-limited memory
regimes the age curve can't express. Citations tagged
**[CONSENSUS]** / **[DEBATED]** / **[HYPOTHESIS]** as before.

## 23. Firsts and transitions — the bump's fuel, mechanized

- **"Firsts" are privileged and structurally load-bearing.** Robinson
  1992 (*First Experience Memories*): first-experience memories organize
  personal histories into thematic streams and anchor their causal-
  temporal sequence — the first kiss, first job, first apartment aren't
  just better recalled, they're indexing nodes. **[CONSENSUS finding;
  the structural claim is Robinson's interpretation, well-cited]**
- **Life transitions mint their own local density.** Brown's transition
  theory (Brown & Lee 2010; Brown 2016; Brown, Hansen, Lee, Vanderveen
  & Conrad 2012): autobiographical memory organizes around *transition
  points* — periods of rapid change in activities, goals, or locations
  produce dense, landmark-rich records regardless of the age they
  occur at. Thomsen & Berntsen 2008: the bump for *most positive*
  events is carried disproportionately by transitional firsts; neutral
  controls don't bump. Schrauf & Rubin's immigration bimodality (v2.2
  `bump_windows`) is the same phenomenon — a relocation transition
  mints a second bump in the 30s–40s. **[CONSENSUS pattern;
  formalization as a runtime flag is our HYPOTHESIS]**

**Spec consequence (v2.7):**
- Events gain an optional `first:true` flag (world supplies it for
  script-class firsts — first kiss, first day of school, first solo
  trip): `E += first_gain` (0.2), and the record joins its "stream"
  — `link_p` ×1.5 toward same-stream records (thematic chains
  Robinson describes).
- Records encoded inside a world-flagged `transition` window
  (startDay/endDay on the character — moved house, new job, new baby,
  divorce) get `transition_gain` (0.4) on the SAME valence gate as the
  bump (positive or selfRelevance > bump_self_thresh). This generalizes
  `bump_windows` (v2.2) from bible-fixed to runtime-declared.
- Mechanistic payoff: the bump is now partially *emergent* — firsts and
  transitions cluster at 10–30 in a normal life, so bump_gain on that
  window + first_gain/transition_gain compound. P251 tests that
  removing the first-flag mechanism measurably flattens the bump —
  if the bump survives intact with uniform-age firsts, bump_gain is
  doing all the work and the mechanism claim is empty.

## 24. Item discrimination matures — the third false-memory channel

- **Mnemonic discrimination (item-level lure rejection) improves
  through childhood and declines in aging — an inverted U.** Ngo, Lin,
  Newcombe & Olson 2019 (*JEP:G*, ages 4–80, lifespan sample): both
  mnemonic discrimination and relational binding follow inverted-U
  lifespan curves; Ngo, Newcombe & Olson 2017 (*Dev Sci*): 4-year-olds
  worse than 6-year-olds and adults on both discrimination and
  relational memory. Rollins & Cloude 2018 (*Learn Mem*): 5–6-year-olds
  falsely call mnemonically-similar lures "old" at elevated rates vs
  older children and adults — immature pattern separation.
  **[CONSENSUS — multi-study, now including lifespan samples]**
- **This is a THIRD channel, distinct from both suggestion (Part I §4,
  falls with age) and gist-lures (rises with age, developmental
  reversal).** A 6-year-old is simultaneously: (i) highly misinfo-
  susceptible (external claims), (ii) gist-lure resistant (weak
  meaning-connection machinery), and (iii) poor at telling apart two
  similar things that actually happened (immature pattern separation).
  All three are in different mechanisms and must not collapse.

**Spec consequence (v2.7):** `lure_accept` (v0.4's similar-item lure
parameter) gains child-side knots — the curve is now genuinely U:
~1.6 at 5 → 1.0 by ~10 → 1.0 adult → rises 65+ per the existing
discrim_mult knots. `phantom_p` (gist channel) stays monotonic-
rising into adulthood — no child knots, by design. `link_p`'s child
knot (0.6 at 6) already carries the relational-binding side. Child
characters now produce *confusable near-duplicates* — two birthday
parties smear into one via §4.3 merge — while resisting "a thing
like X must have happened" gist errors. P252 sign-locks the split.

## 25. Childhood interference — interpolated events hit harder

- **Children's delayed recall is disproportionately damaged by
  interpolated similar material.** Howe 1991/1995; Ceci & Bruck 1993/
  1995 witness literature: children's trace fragility shows up as
  vulnerability to intervening events — immediate recall can be good
  while delayed recall collapses relative to adults'. **[CONSENSUS
  direction; magnitude literature is witness-focused, DEBATED for
  neutral autobiographical events]**

**Spec consequence (v2.7):** the §4.2 `n_sim` accumulator applies
`pi_child_mult` (1.3) to records with `encodeAge < 10` — similar
intervening events pile up more PI against child-encoded traces. The
compensation already exists: scaffolded retells (§12/v1.5) are the
parent-supplied rehearsal that rescues the records worth keeping —
a childhood event nobody talked about dies fast; one the family
retold becomes an island of permanence, which is the real phenotype.

## 26. Amnesia is episodic-only — early semantics and skills survive

- **What dies in childhood amnesia is the *episodic* record, not the
  learning.** Children amass vocabulary, scripts, facts, and skills
  continuously from birth; adult semantic knowledge includes vast
  amounts learned before age 5 with zero episodic residue. Infant
  learning paradigms (Rovee-Collier) are themselves implicit/
  procedural — behaviorally retained without declarative access.
  Bahrick's permastore applies to school-learned semantics, much of it
  early. **[CONSENSUS — implicit/procedural and semantic learning are
  preserved across the amnesia boundary; it is autobiographical-
  episodic that empties]**

**Spec consequence (v2.7 — a gate correction):** `amnesia_ramp`,
`amnesia_decay_mult`, `ret_window` auto-latent, and the §5.20 latent
path apply ONLY to episodic records and their verbatim fields.
Semantic and procedural records encoded at encodeAge < 7 form
normally (they don't even carry a source episode — they're born
decontextualized, which is what "I just know it" means). A grown
character knows the childhood lullaby, can't tell you when she
learned it, and never could — no latent record exists to surface.
P254 tests the asymmetry.

## 27. The adolescent regime I — phase delay and chronic restriction

- **Adolescence phase-shifts circadian preference ~1.5–2h later while
  school schedules stay early — the result is endemic partial sleep
  restriction.** Carskadon 2011 (review); Wolfson & Carskadon. Lo et
  al. 2016 (*SLEEP*, Need for Sleep Study, n=56, 15–19y): 7 nights of
  5h TIB degrade sustained attention and mood. Lo et al. 2017 (*J
  Sleep Res*, n=59): 5 nights of 5h TIB impair memory ENCODING —
  measured after 3 recovery nights, so it's an encoding deficit, not
  retrieval fatigue; uncorrelated with vigilance decline. Huang et al.
  2016 (same study): spacing protected against the restriction
  penalty; massed cramming lost more. **[CONSENSUS pattern; RW-magnitude
  extrapolation HYPOTHESIS]**

**Spec consequence (v2.7):**
- `peak_hour` (v0.7) gets a teen knot: +1.5h at 13–19 relative to the
  trait value — teen morning events encode under an effective synchrony
  penalty by default (school happens at their circadian trough).
- New param `adolesc_sleep_loss` (1.2): multiplier on the
  sleepdep/low-sleepQuality encoding penalty for age_now ∈ [13,19] —
  same lost hour costs a teen more, and recovery sleep doesn't fully
  refund it (Lo 2017's post-recovery deficit).
- Consequence for bibles: a teen character's `sleep` trait AND the
  world's school schedule jointly determine how much of the school
  week encodes dimly. P255 tests the persistent-after-recovery shape.

## 28. The adolescent regime II — social evaluation and co-rumination

- **Adolescents are hyper-attuned to social evaluation.** Somerville
  2013 (*Curr Dir Psychol Sci*): peer observation alone elevates
  adolescents' self-consciousness and socioaffective response beyond
  children's and adults'; social-evaluative sensitivity peaks in
  adolescence. **[CONSENSUS direction; neural mechanism DEBATED]**
- **Teen rehearsal is peer-shaped and valence-skewed.** Rose 2002
  (*Child Dev*, n=608): co-rumination — extensive rehashing of
  problems in dyadic talk — is highest in adolescent girls, predicts
  both friendship closeness AND internalizing symptoms; Stone,
  Hankin, Gibb & Abela 2011: co-rumination prospectively predicts
  depression onset in adolescent girls. **[CONSENSUS correlation;
  causal path DEBATED]**
- **Overgeneral autobiographical memory onsets in adolescence** with
  depression (Sumner 2011 review; Valentino 2011) — the depressive
  OGM signature is a teen-emergent, not child, phenomenon.

**Spec consequence (v2.7):**
- `social_eval_gain` (0.25) on records carrying `evaluated:true` or a
  peer `audience` at encode, teen-knotted (~1.3 at 14, ~1.0 by 25,
  ~0.9 after): being watched/judged by peers encodes deeper in
  adolescence than at any other age — the embarrassment that still
  surfaces at 40.
- Retell ecology (§4.13) gains `coruminate_gain` (1.3): negative-
  valence records get an extra retell draw when a high-closeness
  PersonModel exists, teen-weighted (×1.5 for 13–19) and
  trait-loaded on `social` + `sex`. Co-rumination buys both things
  Rose found: stronger rehearsal of the wound AND interaction with
  `rumin_k` — the record stays hot, specific-negative, and gets
  retold until canonization (§6.24) can lock a painful story in.
- Depressive-modifier note: the OGM drift (`rumin_k` gist-loss terms,
  v0.5/v1.7) is gated to age ≥ 12 — children's negative records
  fragment (verbatim-bound, §13), they don't overgeneralize.

## 29. The life narrative switches on in adolescence

- **Global autobiographical coherence — temporal, causal, thematic —
  emerges between ~12 and 20.** Habermas & Bluck 2000 (*Psychol
  Bull*): the cognitive tools and social-motivational demands for a
  life story develop in adolescence; Habermas & Paha 2001: coherence
  markers increase linearly 12→18; Habermas & de Silveira 2008
  (16–70y lifespan): coherence continues rising into mid-adulthood
  but the *onset* is adolescent. **[CONSENSUS]**
- Mechanical meaning: before ~12, retells rehearse single episodes;
  during 12–25, retelling starts *connecting* — "that was when I
  stopped trusting him," "I became the person who…" — the era where
  memories get woven into self-defining structure.

**Spec consequence (v2.7):** during `narr_window` (12–25), each retell
(§4.13/§6.11) additionally (a) adds `narr_coh_gain` (0.1) to gist S —
narrating for coherence is consolidation; (b) mints thematic `links`
at `narr_link_gain` (0.15 bonus link_p) to up-to-2 same-theme records
across eras — adolescence is when the past stops being episodes and
becomes a story, mechanically visible as a burst of cross-era links
formed during teen/young-adult retells. P258: link formation during
the narr_window should produce cross-era edges that child and midlife
retells don't.

## 30. Life scripts double as dating priors

- **The cultural life script is not just a retention curve — it's a
  temporal schema.** Berntsen & Rubin 2004: normative life events
  carry culturally scripted expected ages; Bohn & Berntsen 2011:
  life-script knowledge shapes *when* people place events — scripted
  transitions get dated toward their scripted age. **[CONSENSUS
  direction; effect sizes moderate]**

**Spec consequence (v2.7):** `dateEstimate` (§6.15) gains a prior
term: for records tagged transition-class (world supplies the tag —
marriage, first job, first child, moving out), the estimate is pulled
toward the character's `script_age` table (world-builder supplies per-
culture expectations; default ~the bump window) with weight
`script_date_pull` (0.3). Events that happened OFF-script (married at
45 when the script says 27) carry elevated `date_sigma` — the schema
that helps date the normal cases hurts the exceptions. P259 tests
both signs.

## 31. Children's prospective memory works — until interrupted

- **Event-based PM is present by age 4 but fragile to task
  interruption.** Kvavilashvili, Messer & Ebdon 2001 (*Dev Psychol*):
  4–7-year-olds succeed at event-based PM when the ongoing task flows
  into the cue, but interruption collapses performance; age explains
  little variance vs the interruption factor. Children also
  functionally offload intentions onto caregivers — the parent IS the
  reminder system (consistent with §12's scaffolded-memory ecology).
  **[CONSENSUS pattern]**

**Spec consequence (v2.7):**
- `pm_interrupt_mult` child knots (~1.5 at 4–7 → 1.0 by ~12): an
  intervening `locShift` or topic change between intention arming and
  cue arrival costs children disproportionately — the doorway effect
  (§2 v1.2) plus this knot is why kids arrive in the kitchen having
  forgotten why.
- `pm_scaffold_gain` (0.2): when a caregiver-tier PersonModel is
  co-present at the cue's arrival window, child PM firing gets the
  bonus — the transactive directory (§6.14) extends to *prospective*
  reminders for children before it becomes the adult couple system
  (v1.6's collab_partner_gain). P260 tests all three arms.

## 32. Hormonal transition regimes — pregnancy and perimenopause

- **Pregnancy: small but real memory costs, retrieval-side.** Henry &
  Rendell 2007 (*J Clin Exp Neuropsychol* meta, 14 studies): reliable
  small deficits on free recall and executive working memory;
  recognition and routine/well-practiced memory spared. Rendell &
  Henry 2008: real-world (not lab) prospective memory impaired. Davies
  et al. 2018 (*Med J Aust* meta, 20 studies): overall memory SMD
  ≈ −0.48, third trimester reaching clinical significance; executive
  function also dips. Complaint magnitude exceeds measured deficit —
  the metamemory gap again. **[CONSENSUS that a small real deficit
  exists; mechanism DEBATED — sleep disruption, hormonal, and
  attentional-load accounts all live]**
- **Perimenopause: the practice effect disappears, then returns.**
  Greendale et al. 2009 (*Neurology*, SWAN n=2362, longitudinal):
  during the menopause transition women fail to show the normal
  retest *improvement* on processing speed and verbal memory —
  learning-with-practice stalls; scores rebound post-menopause. The
  deficit is time-limited, not cumulative. Greendale et al. 2010:
  symptom adjustment doesn't explain it. ~⅔ of women report
  complaints (subjective >> objective, again). **[CONSENSUS —
  the largest longitudinal dataset on midlife cognition]**

**Spec consequence (v2.7):** these are the first *reversible regime
overlays* — distinct from the permanent age knots and from the
v1.0 era/regime tags (which mark records, not capacity):
- `preg` overlay (world-applied, trimester 3 weighted, ~90d):
  `preg_theta_up` (+0.10 on θ — recall side), `preg_enc_loss`
  (−0.08 on enc_base — mild), `preg_pm_loss` (0.2 penalty on
  nonfocal PM), recognition/spared modes exempt (frozen:
  `preg_recog_spare = true`). Fully removed when the window ends;
  records encoded inside carry a normal `regime` tag, nothing more.
- `perimenopause` overlay (sex-gated, ~age 45–55, duration param
  `perim_years` ≈ 4): `perim_enc_loss` (−0.05) and — the distinctive
  SWAN signature — `perim_s_gain_mult` (≈0): retell/rehearsal
  practice stops *improving* storage during the window, then resumes.
  Not cumulative; the records don't die faster, they just stop
  getting stronger on re-test. The complaint-to-deficit asymmetry is
  automatic: self_est dips on the felt stall while θ barely moves.
- Both are profiles-doc modifiers (dated overlays), not new stores —
  P261/P262 test reversibility and the practice-stall signature.

## 33. What changed in the spec (v2.6 → v2.7)

| # | Change | Grounding |
|---|---|---|
| F1 | Event flag `first:true` → `first_gain` + stream link_p ×1.5; runtime `transition` window → `transition_gain` on the bump valence gate | §23 (Robinson 1992; Brown & Lee 2010; Thomsen & Berntsen 2008) |
| F2 | `lure_accept` gains child-side knots (~1.6@5→1.0@10) — item-discrimination maturation as third channel; `phantom_p` stays monotonic | §24 (Ngo 2017/2019; Rollins & Cloude 2018) |
| F3 | `pi_child_mult` 1.3 on §4.2 n_sim for encodeAge<10 | §25 (Howe; Ceci & Bruck) |
| F4 | Amnesia gates restricted to episodic+verbatim — semantic/procedural exempt | §26 (Bahrick; implicit-learning lit) — gate correction |
| F5 | `peak_hour` teen knot +1.5h; `adolesc_sleep_loss` 1.2 on sleepdep encoding penalty 13–19 | §27 (Carskadon; Lo 2016/2017) |
| F6 | `social_eval_gain` 0.25 teen-knotted on evaluated/peer-audience records | §28 (Somerville 2013) |
| F7 | `coruminate_gain` 1.3 teen-weighted extra retell draw on negative records w/ close PersonModel; OGM drift age-gated ≥12 | §28 (Rose 2002; Stone 2011; Sumner 2011) |
| F8 | `narr_coh_gain` 0.1 gist + `narr_link_gain` 0.15 on retells during narr_window 12–25 | §29 (Habermas & Bluck 2000) |
| F9 | `script_date_pull` 0.3 in dateEstimate for transition-class records; off-script events gain date_sigma | §30 (Berntsen & Rubin 2004; Bohn & Berntsen 2011) |
| F10 | `pm_interrupt_mult` child knots + `pm_scaffold_gain` 0.2 caregiver co-presence | §31 (Kvavilashvili et al. 2001) |
| F11 | Reversible overlays `preg` (θ+, enc−, PM−, recognition frozen-spared) and `perimenopause` (s_gain→0, enc−, ~4y) | §32 (Henry & Rendell 2007; Davies 2018; Greendale 2009/2010) |

New params: `first_gain` 0.2, `transition_gain` 0.4,
`pi_child_mult` 1.3, `adolesc_sleep_loss` 1.2, `social_eval_gain`
0.25, `coruminate_gain` 1.3, `narr_coh_gain` 0.1, `narr_link_gain`
0.15, `script_date_pull` 0.3, `pm_interrupt_mult` (curve; base 1.5),
`pm_scaffold_gain` 0.2, `preg_theta_up` 0.10, `preg_enc_loss` 0.08,
`preg_pm_loss` 0.2, `perim_enc_loss` 0.05, `perim_s_gain_mult` 0.0,
`perim_years` 4.0. Frozen: `preg_recog_spare = true`. Knot updates:
`lure_accept` (child side), `peak_hour` (teen), `pm_interrupt_mult`.

## 34. Validation probes (P251–P262; registry continues P1–P250)

- **P251 firsts fuel the bump (SHOULD — mechanism):** hold bump_gain
  fixed; redistribute `first:true` events uniformly across ages →
  bump amplitude drops ≥25%. If it doesn't, the firsts mechanism is
  decorative and F1 should be re-flagged HYPOTHESIS-only.
- **P252 three-channel childhood (MUST — sign-locked):** at age 6 vs
  25: misinfo adoption higher, gist-lure (phantom) rate LOWER,
  similar-item lure FA higher. Fails if any two move together — the
  three channels must stay dissociable.
- **P253 child interference (SHOULD):** matched event, two interpolated
  similar events → delayed-recall R at age 7 drops ≥1.3× the age-25
  drop; scaffolded retell rescues.
- **P254 episodic-only amnesia (MUST — structural):** semantic and
  episodic records minted at encodeAge 3–5: at age 25 the episodic
  pool is latent/absent, the semantic pool retains adult-normal
  strength with NO source episode attached.
- **P255 teen sleep (SHOULD):** 5-day low-sleepQuality stretch at 16 →
  encoding deficit persisting through ≥3 recovery nights (Lo 2017
  shape); identical stretch at 35 recovers overnight.
- **P256 social-evaluative encoding (MUST — sign):** peer-evaluated
  event at 15 encodes ≥1.2× matched neutral; same contrast at 35
  <1.1×. Direction must invert with age, not just attenuate.
- **P257 co-rumination (SHOULD):** teen negative records retell more
  only when a high-closeness peer PersonModel exists; high-rumin_k
  teen drifts gist-ward over months (OGM direction), and the gate
  blocks it below 12.
- **P258 narrative onset (SHOULD):** retells during 12–25 mint cross-
  era thematic links at measurably higher rate than child or 45+
  retells; teen-era records accumulate more links total.
- **P259 script dating (SHOULD):** transition-class records date
  toward script_age with signed error; off-script transitions date
  with elevated sigma vs on-script matched events.
- **P260 child PM (MUST):** uninterrupted event-based intention at 6
  completes near-adult; interruption penalty ≥1.5× adult;
  caregiver co-present at cue → completion back to adult rate.
- **P261 pregnancy overlay (MUST):** recall θ penalty + PM cost active
  in window, recognition spared (frozen constant), ALL effects gone
  post-window; subjective complaint (self_est) drops more than θ
  warrants.
- **P262 perimenopause practice stall (MUST — sign-locked):** during
  overlay, repeated retells produce ~no S growth vs outside-window
  matched records; post-window growth resumes; no elevated decay
  anywhere (the deficit is stalled growth, not loss).

## 35. Honest limits, third pass

- The firsts/transitions mechanism (§23) is the softest inference here
  — the bump-fuel claim is well-supported but `first_gain`'s magnitude
  is fitted, and P251 exists precisely to detect it doing nothing.
- Adolescent parameters lean on a smaller literature than the old-age
  side; Lo 2016/2017 is one lab (excellent but singular) — teen sleep
  magnitudes flagged, directions solid.
- The overlays (§32) assume the world can flag biological windows —
  fine for bibles and scripted lives; ambient NPCs never get them
  (degraded mode already covers this).
- `script_age` tables are culture-specific world-builder content; the
  model supplies only the pull mechanism. A world with no script table
  gets flat priors — graceful by construction.
- Three-channel childhood (§24) is the most load-bearing correction:
  if implementers collapse item-lure and gist-lure into one dial, the
  U-shape inverts and children come out *less* error-prone — the
  single most common misread of the development literature.

---

# Part IV — v39 deepening (2026-09-23): what the child channels never modeled — locked languages, scripts as default report, the interview as hazard, the lineup that can't be refused, midlife as a real regime, and dating without a timeline

Fourth pass. The first three passes built the era structure
(amnesia/bump/firsts), the channel split (suggestion vs gist vs
item), and the overlays (sleep phase, narrative, hormones). This pass
owns what was left: the **format** of early traces (preverbal records
can't be told), the **default report** of childhood (the routine, not
the instance), the **interview itself as a distortion operator**
(repetition maintains, suggestion taints — sign matters), the
**forced-pick asymmetry** of child identification, **midlife as a
genuine knot regime** rather than a plateau to skip, **dating without
a location sense**, and the **child stress sign** (distress helps at
the top of the range — opposite of the adult worry).

## 36. Preverbal traces are locked in their encoding language — the tell-block

- **Simcock & Hayne 2002** (Psych. Sci. 13:225; the cleanest single
  result in the amnesia literature): children 27–39 months
  experienced a unique event, were tested 6 or 12 months later —
  AFTER acquiring most of the vocabulary needed to describe it.
  Verbal AND nonverbal memory were intact. But **no child ever
  verbally reported any aspect of the event that had not been in
  their productive vocabulary at encoding**. The memory exists; the
  translation does not. Language development is thereby a load-
  bearing wall of childhood amnesia — not because early events were
  unencoded, but because they were encoded in a code the later self
  cannot speak. **[CONSENSUS finding; mechanism attribution to
  language per se DEBATED — Richardson & Hayne 2007 reviews
  alternatives]**
- Consequence the earlier passes missed: §11's latent traces and §26's
  surviving early semantics are real but **told-shaped**: an adult
  character CAN have an intact affective/behavioral trace of a
  pre-2.5y event and yet be literally unable to narrate it — the
  record retrieves on sensory cues and returns affect + motor fields
  with an empty verbal field.

**Spec consequence (v3.8):** records gain `verbal_age` = productive-
language level at encodeAge (knots: 0 below ~2y, 0.4 at 2.5, 0.8 at
4, 1.0 at 6). On `retell`/`recall` verbal-channel output of any
record with `verbal_age < verbal_lock_thresh` (0.6), verbal fields
emit at `verbal_age` fidelity — the reconstruction returns sensory/
affect/motor fields and `verbal_void: true` for dialogue to render
as "…I don't know, it's just a feeling — warm kitchen, big hands."
Nonverbal cues (odor, song, posture) retrieve these records normally
— §38's `familiar_only` and §11's latent reinstatement are their
natural retrieval paths. **[HYPOTHESIS parameterization of CONSENSUS
result]**

## 37. Scripts are the child's default report — the routine swallows the instance

- **Nelson & Gruendel 1981/1986** (GER theory; Schank & Abelson
  lineage): even 3-year-olds hold well-organized generalized event
  representations — "what happens at dinner" — in canonical temporal
  order with slot-fillers, and produce script-language reports
  ("you do X"). This is the *building block* of child event memory,
  not an adult decoration. **[CONSENSUS]**
- **Hudson & Nelson 1986:** asked about a specific instance vs the
  routine, children report *more* for the general question — the
  script is the stronger representation; the instance is the
  derivative. **[CONSENSUS]**
- **Brubacher, Powell et al. (2011, ACP; Baker-Ward et al. 2020):**
  across repeated-event studies, children recall details that were
  INVARIANT across occurrences more often and more accurately than
  details that varied; as the specific-occurrence record decays,
  reports collapse into script content — and the most common child
  error is **script intrusion**: reporting a typical element that
  didn't occur this time. **[CONSENSUS]**
- Crucially the deviation side does NOT invert: once a script exists,
  even young children recall deviation episodes better than routine
  ones (Fivush, Hudson & Nelson 1984; Nelson 1986 review). The child
  failure is at the *sorting* stage — one odd instance inside the
  first 4–5 exposures gets assimilated INTO the script rather than
  flagged deviant. **[CONSENSUS; sorting-window duration DEBATED]**

**Spec consequence (v3.8):** repeated-event records (same
`eventClass`, `reps ≥ 3`) mint a `script` node keyed to the class —
invariant fields accrue `script_mass` (child knots: accrual rate
×1.5 below 8, adult baseline), variable fields accrue per-occurrence
only. Retrieval below age ~8 on a repeated class returns the script
node by default (`script_default_age` 8): the specific-occurrence
record needs a distinctive cue field to surface. Intrusion operator:
on script-mode recall, each unfilled slot samples the modal filler
with `script_intrusion_p` (0.3 child → 0.1 adult) — flagged inside
the reconstruction as ordinary fields (children can't tell script
from instance — that IS the finding). Deviation records encoded
within the first `sort_window` (4) occurrences get `assimilated`
into the script at `assim_p` (0.4 below 8) instead of minting
deviant — after the window, deviations mint normally and keep their
adult advantage. **[HYPOTHESIS parameterization of CONSENSUS
pattern]**

## 38. Schema assimilation in children — the sign adults don't share

- **Liben & Signorella 1980** (Child Dev. 51:11): 1st/2nd graders
  shown gender-traditional/nontraditional/neutral pictures — highly
  stereotyped children later recognized significantly MORE
  traditional than nontraditional; low-stereotyped children showed no
  differential. Memory follows the child's schema strength.
- **Signorella & Liben 1984** (Child Dev. 55:393): across K/2nd/4th,
  highly stereotyped children recalled more traditional items;
  **reconstructions ran nontraditional→traditional** (a female
  firefighter remembered as male) — active transformation toward
  schema, and the bias grows with task difficulty. **[CONSENSUS
  direction]**
- Adult readers will object that schema-INCONSISTENT items are
  remembered better — true for adults in easy tasks (the von Restorff
  family). The child data says: when the schema is strong and the
  task is hard, children normalize the violation — and children are
  *always* in the hard-task regime. Two forces, different age
  weights, no contradiction.

**Spec consequence (v3.8):** on `dailyMemoryTick`, records whose
fields violate an active schema slot (PersonModel stereotype,
world-rule expectation — `schema_violation > 0`) get a field-level
transform with `schema_assim_p`: knots 0.25 at 6 → 0.1 at 12 →
0.05 adult — the violating field value drifts toward the modal
schema value (mirroring §6.12's stereotype convergence but
intra-record, silent, child-weighted). Simultaneously, survival of
the un-transformed record drops (`schema_viol_loss` 0.15 child)
— unassimilated violations are forgotten rather than preserved.
Adults keep the §3 distinctiveness advantage on violations
(`isolated` already exists); the child path replaces it below
`schema_flip_age` (10). Scales with the character's own
stereotype-strength (PersonModel `cred`/trait rigidity as the
bible dial). **[HYPOTHESIS parameterization of CONSENSUS finding]**

## 39. The lineup a child can't refuse — forced-pick asymmetry

- **Pozzulo & Lindsay 1998** (Law & Hum. Behav. 22:549; meta, 1,066
  children / 1,020 adults): target-PRESENT lineups — children >5
  match adult correct-ID rates; only preschoolers (~4) lag.
  Target-ABSENT — **children of EVERY age tested, including
  adolescents (M 12–13), correctly reject below adult rates.** The
  child deficit is not discrimination, it's refusal: presented a
  choice set, children choose. Sequential presentation WIDENS the
  child–adult gap (opposite of the adult sequential-superiority
  effect); practice/training did not rescue correct rejection.
  **[CONSENSUS — meta-analytic]**
- **Fitzgerald & Price 2015** (Psych. Bull. 141:1228; 91 studies,
  20,244 participants, lifespan): replicates the child choosing
  bias; signal-detection shows young adults best, children poor
  discriminability — and **older adults land at the same place,
  slightly worse than children.** The refusal deficit is U-shaped
  like everything else in this file. **[CONSENSUS]**
- **Lindsay et al. 1997** (LHB 21:391): showups (single-suspect
  presentations) produce the worst child false-positive rates —
  the coercive single-choice format children can least resist.

**Spec consequence (v3.8):** `identifyFromSet(charId, candidates,
{mode})` — the recognition contract gains a refusal channel. Under
`mode:"forced"` or a coercive single-option set, if no candidate
clears θ, output picks the argmax anyway with probability
`choose_p(age_now)`: knots 0.85 at 5 → 0.7 at 8 → 0.55 at 13 →
0.3 adult → 0.55 at 70 → 0.7 at 85 (Fitzgerald & Price U). Under
`mode:"free"` the §5.10 cascade runs as now. Sequential candidate
order adds `seq_choose_gain` ×1.3 to choose_p below 13 (children
choose MORE under sequential — sign-locked, opposite adults).
`showup_mult` ×1.5 on single-candidate presentations. The picked
record carries `forced_pick: true` internally — downstream
sourceInfer treats it as low-credibility, but the character's
reported confidence does NOT reflect the coercion (children are
confident choosers). **[HYPOTHESIS parameterization of
meta-analytic CONSENSUS]**

## 40. The interview is an operator, and its sign depends on content — maintain vs taint

- **Leichtman & Ceci 1995** (Dev. Psych. 31:568; the "Sam Stone"
  study, n=176, ages 3–6): a stranger's bland 2-minute visit; four
  weekly interviews then a fifth at week 10. Control (neutral
  interviews): accurate reports, ~10% of youngest assented to
  misleading probes, **5% stuck with it under "did you SEE him do
  it?"** — and 0% of 5–6y. Suggestion-only: substantial false
  reports. Stereotype-only: modest. **Stereotype + repeated
  suggestion: 46% of 3–4y spontaneously narrated the misdeeds in
  free recall, 72% under probes** — with fabricated perceptual
  detail and gestures. False-event memory was manufactured by the
  interview schedule, not the event. **[CONSENSUS — landmark]**
- **Goodman, Bottoms, Schwartz-Kenney & Rudy 1991** (J. Narr. Life
  Hist. 1:69): same repeated-interview design on a REAL stressful
  event (inoculation, 3–7y) — multiple NEUTRAL interviews
  *maintained* memory and *strengthened* suggestion resistance;
  interviewer support reduced suggestibility further.
  **[CONSENSUS]**
- The pair is the finding: repetition is not the variable —
  repetition carries whatever valence the interviewer loads.
  Neutral retellings consolidate; suggestive retellings taint; and
  the taint compounds (each interview re-exposes AND re-encodes the
  suggested content with rising fluency).

**Spec consequence (v3.8):** `hearAccount`/`discussEvent` already
increment `hearCount`; child records add sign-splitting on
repetition: **neutral repeat** (`account.fidelity ≈ record`):
child_consol_gain applies per repetition AND `misinfo_suscept_eff`
on that record ×0.9 per neutral interview (practice inoculation —
Goodman 1991). **Suggestive repeat** (fields conflict): adoption
per exposure compounds — `suggest_repeat_mult` 1.25 below age 8
(1.0 adult) multiplies p_adopt per successive conflicting account
of the same event, and each adopted field writes `embellish`
fields on subsequent retells at `embellish_p` 0.3 (the fabricated
perceptual detail Sam Stone kids produced — false records accrue
richness, defeating any richness-based detector). **Stereotype
gate:** if PersonModel[speaker or target].trait-schema matches the
suggested valence (`stereo_prime`), p_adopt ×1.4 below 8 — the
pre-existing expectation is half the taint. Effects gate on
`encodeAge_now < taint_exit` (9) with ramp; adult suggestive-repeat
stays at §6.3 baseline. **[CONSENSUS phenomenon; compounding
magnitudes HYPOTHESIS]**

## 41. Midlife is a real regime — the plateau with a slope inside it

- **Schaie, Seattle Longitudinal** (Schaie 1996/2005/2013 summaries):
  7-year-interval within-person data, 20s→80s, successive cohorts.
  First three cycles: **no reliable average decrement before ~60**;
  later cycles: small significant decrement in the 50s for *some*
  abilities and cohorts; average pre-60 decline <0.2 sd even where
  found; at 81, fewer than half of individuals showed reliable
  7-year decline on a given ability. **[CONSENSUS — the landmark
  longitudinal dataset]**
- **Peaks differ by ability:** Reasoning/Spatial/Word-fluency peak
  young-adult; **Verbal and Number abilities peak in LATE midlife**
  (~50s). Perceptual speed declines roughly linearly FROM young
  adulthood — speed is the outlier, not the rule.
- **The cross-sectional lie (revisited, sharpened):** Park/Salthouse
  cross-sectional curves put episodic decline onset in the 20s–30s;
  SLS puts reliable decline ~60. Part I's §6 knots split the
  difference quietly (enc_base flat 18–35, −0.16 by 50) — that's
  closer to cross-sectional truth. For RW the resolution is
  operational: **the capacity curves should track longitudinal
  (within-person) shape** — a character doesn't get dumber by cohort
  membership — so midlife knots relax: enc_base 30→50 stays ~0.97,
  the §6 50-knot (.84) is revised to .94; beta_episodic 50-knot
  1.31→1.15; theta 50-knot 1.18→1.08. Cross-sectional steepness is
  retained ONLY for perceptual speed (search_breadth 50-knot
  unchanged) and for world-builder characters explicitly tagged
  `low_reserve` — §8 reserve shift already implements the
  between-person version. **[DEBATED literature; knot revision is
  our HYPOTHESIS synthesis]**
- **Crystallized growth continues:** vocabulary/world-knowledge
  rises into the 60s — semantic accrual rate `sem_gain` stays
  positive 30–60 (new knot row) while episodic flatlines: midlife
  characters literally know more while remembering the same amount
  — the mechanic behind the genre-true "knows everything,
  misremembers the meeting" shopkeeper.

**Spec consequence (v3.8):** §6 knot table rows updated (enc_base,
beta_episodic, theta at the 50 knot; semantic knots gain a
`sem_accrual` row: 0.3→0.6 between 30–60 meaning semantics keep
consolidating). `low_reserve` modifier keeps the OLD knots —
between-person variance is now explicitly a modifier, not baked
into the population curve.

## 42. Dating without a timeline — children have distance, not location

- **Friedman 1991** (Child Dev. 62:139): 4/6/8y judged relative
  recency of two classroom events (1 vs 7 weeks prior) and localized
  the older by time-of-day, day-of-week, month, season. **Even 4y
  succeeded at recency ordering and time-of-day; day/week/month/
  season localization only emerged 6–8.** Distance and location are
  separate senses with separate schedules. **[CONSENSUS]**
- **Friedman & Kemp 1998** (Cog. Dev. 13:335): children <6
  discriminate "which was longer ago" between birthday/Christmas
  accurately when separated — recency comparison is a basic
  trace-strength property, near-age-invariant — but correctly
  *interpreting* location/relative-position information required
  >9y. **[CONSENSUS]**
- Adult dating (§6.15) runs on reconstruction from landmarks,
  scripts, telescoping — location machinery. Children run on
  distance machinery: the trace's strength/sharpness IS the date.

**Spec consequence (v3.8):** `dateEstimate` gains an age gate:
`date_loc_exit` (8) — below it, the §6.15 location pipeline
(script_date_pull, landmark anchors, rounding) is **disabled**, not
weakened; `orderBefore` still works at near-adult fidelity
(distance sense intact); `dateEstimate` returns coarse cyclic-
context buckets instead — `cyclic_date` ∈ {time-of-day, season,
routine-anchor} with `cyclic_acc` 0.7 but absolute `reportedDay`
drawn from huge sigma (`date_sigma × child_date_mult` 4.0) — a
6-year-old can tell you it was "in the morning, when it was cold"
and cannot tell you it was Tuesday, March. Above `date_loc_exit`,
the adult pipeline phases in linearly over ~2y. **[CONSENSUS
pattern; knot values HYPOTHESIS]**

## 43. Child stress inverts — at the top of the range, distress helps

- **Goodman, Hirschman, Hepps & Rudy 1991** (Merrill-Palmer Q.
  37:109; venipuncture/inoculation, 3–7y, delays 2 days–1 year):
  correct free recall **did not vary with age**; stress showed NO
  effect until very high distress — at which point it had a
  *beneficial* effect on free recall AND on resistance to
  suggestion. Children's accuracy was unrelated to parental
  stressfulness ratings. **[CONSENSUS finding; generalization to
  abuse-type events DEBATED — Goodman herself cautions]**
- This pairs with §19's `child_trauma_off` (same arousal reads more
  overwhelming) without contradiction: the threshold is about
  *regulation*, the encoding boost is about *salience*. A terrified
  child encodes the central event hard — and still can't regulate
  the aftermath. `child_trauma_off` gates the trauma tag;
  `child_stress_gain` gates the encoding multiplier — both from the
  same arousal value, different downstreams.

**Spec consequence (v3.8):** encoding's arousal term gets an age
split at `stress_flip_age` (8): below it, `stress_encode_loss` →
`child_stress_gain` (sign flip: arousal > `stress_thresh` ADDS
`child_stress_gain` 0.1 to E instead of subtracting), and adopted-
suggestion on high-arousal child records ×0.8 (stress inoculates
the core — Goodman 1991). Peripheral fields still narrow via
`arousal_narrowing` as before (the kid remembers the needle, not
the room). **[CONSENSUS direction; gain magnitude HYPOTHESIS]**

## 44. Knot-table revision summary (v3.8)

| param | old 50-knot | new | why |
|---|---|---|---|
| enc_base | .84 | .94 | SLS longitudinal: no reliable decrement <60 |
| beta_episodic | 1.31 | 1.15 | same |
| theta | 1.18 | 1.08 | same |
| search_breadth | (unchanged) | — | perceptual speed IS linear-from-20s — keep |
| NEW `sem_accrual` | — | 30:1.0, 50:1.4, 60:1.6, 75:1.0 | crystallized growth into the 60s |

New params (defaults): `verbal_age` knots {2:0, 2.5:.4, 4:.8, 6:1};
`verbal_lock_thresh` .6; `script_default_age` 8;
`script_intrusion_p` .3→.1 curve; `sort_window` 4; `assim_p` .4;
`schema_assim_p` {.6:.25, 12:.1, 20:.05}; `schema_flip_age` 10;
`schema_viol_loss` .15; `choose_p` knots {5:.85, 8:.7, 13:.55,
25:.3, 70:.55, 85:.7}; `seq_choose_gain` 1.3; `showup_mult` 1.5;
`suggest_repeat_mult` 1.25; `stereo_prime` 1.4; `embellish_p` .3;
`taint_exit` 9; `neutral_inoc` .9; `date_loc_exit` 8;
`child_date_mult` 4.0; `cyclic_acc` .7; `stress_flip_age` 8;
`child_stress_gain` .1; `child_stress_inoc` .8.

## 45. Validation probes (P389–P398; registry continues P1–P388)

- **P389 preverbal lock (MUST — structural):** record minted at
  verbal_age .3 retrieved at age 8 by odor cue returns
  sensory+affect fields, `verbal_void:true`, zero verbal content —
  despite the character now possessing full vocabulary; verbal
  retell of the same record emits the void, not a translation.
  FAIL if any verbal field materializes.
- **P390 script default (MUST — sign):** 5 reps of eventClass at
  age 6, then recall with no distinctive cue → reconstruction
  dominated by invariant/script fields, one unfilled slot shows
  modal-filler intrusion ≥25% of trials; same test at 30 returns
  the latest occurrence. FAIL if the child returns the
  instance-first ordering.
- **P391 sort window (MUST):** deviant occurrence inside first 4
  reps at age 6 assimilates ≥35%; deviant occurrence at rep 6
  mints as deviation with the adult advantage. Sign-locked.
- **P392 schema assimilation (MUST — sign):** schema-violating
  field at age 6 drifts toward modal value or is forgotten ≥
  adult rate; the SAME violation at 25 gets the `isolated`
  distinctiveness advantage. The two channels must diverge —
  fails if child shows the adult advantage.
- **P393 forced pick (MUST — sign-locked):** target-absent
  identification under `mode:"forced"`: false-pick rate at 6 >
  at 25 >... wait — at 6 HIGHER than 25; at 75 ≥ child rate.
  Free mode at 6 rejects fine. Sequential widens child–adult
  gap; showup worst. Three sign-locks, fail any → fail.
- **P394 taint cascade (MUST — dose-response):** 3–4y target,
  stereo-matched suggester, 4 weekly suggestive accounts →
  false-event report ≥40% free / ≥65% probe, with `embellish`
  fields present; control neutral-interview arm <12% assent.
  Numbers locked to Leichtman & Ceci within ±10pp.
- **P395 maintain-not-taint (MUST):** identical schedule,
  neutral accounts → record strength grows and subsequent
  suggestive adoption drops ≥15% vs no-interview arm. The
  schedule's sign must flip on content.
- **P396 midlife shape (MUST):** simulated 35→55 span, default
  params → episodic recall decline <0.1 sd while semantic pool
  keeps growing; low_reserve modifier restores the steeper
  curve. FAIL if midlife decline matches the old .84 knot.
- **P397 child dating (MUST — structural):** encodeAge 6 record:
  `orderBefore` vs a second record succeeds near-adult;
  `dateEstimate` returns cyclic bucket (correct ~70%) with
  absolute sigma ≥3× adult; no landmark/script pull applied.
  Structural gate on `date_loc_exit`, not magnitude.
- **P398 child stress inversion (MUST — sign):** arousal .9 event
  at encodeAge 6 vs 25: child record E higher AND later misinfo
  adoption LOWER on the core; peripheral fields still narrowed.
  FAIL if child and adult move in the same direction.

## 46. Spec changes (v3.7 → v3.8) — delta table

| # | Change | Grounding |
|---|---|---|
| G1 | `verbal_age` + `verbal_lock` on retell/recall verbal output; `verbal_void` return flag | §36 (Simcock & Hayne 2002) |
| G2 | `script` nodes on repeated eventClass; `script_default_age`, `script_intrusion_p`, `sort_window`/`assim_p` | §37 (Nelson & Gruendel; Hudson & Nelson; Brubacher et al.) |
| G3 | `schema_assim_p` child-weighted field transform + `schema_viol_loss`; replaces `isolated` advantage below `schema_flip_age` | §38 (Liben & Signorella 1980/1984) |
| G4 | `identifyFromSet` refusal channel: `choose_p(age)` U-curve, `seq_choose_gain` sign-locked, `showup_mult`, `forced_pick` flag | §39 (Pozzulo & Lindsay 1998; Fitzgerald & Price 2015) |
| G5 | Repetition sign-split: `neutral_inoc` vs `suggest_repeat_mult`+`stereo_prime`+`embellish_p` below `taint_exit` | §40 (Leichtman & Ceci 1995; Goodman et al. 1991) |
| G6 | Midlife knot revision (enc_base/beta_episodic/theta at 50) + `sem_accrual` row; cross-sectional steepness moved to `low_reserve` | §41 (Schaie SLS 1996/2005) |
| G7 | `date_loc_exit` gate: below 8, location pipeline off, `orderBefore` intact, cyclic-bucket return | §42 (Friedman 1991; Friedman & Kemp 1998) |
| G8 | `stress_flip_age` encoding split: `child_stress_gain` + `child_stress_inoc` below 8 | §43 (Goodman et al. 1991) |

## 47. Honest limits, fourth pass

- Simcock & Hayne is one lab's paradigm (event-based, n modest);
  the verbal-lock claim is strong *for their design* — we
  generalize it to all preverbal records, which the literature
  supports directionally but not at our resolution.
- The script machinery's `sort_window`=4 is a clean number the
  literature only gestures at ("initial four or five exposures") —
  fitted, flagged.
- choose_p knots interpolate between meta-analytic bins; the
  adolescent plateau (~adult hits, child-level rejection) is real,
  the exact .55 is ours.
- P394's dose-response numbers target Leichtman & Ceci's actual
  percentages — the only probe in this suite tied to absolute
  human rates rather than signs; appropriate since the study is
  the landmark, risky since n=176 with wide CIs.
- The midlife revision (G6) is the pass's most consequential
  edit: it changes felt character age — a 50-year-old now reads
  ~35 on episodic capacity. If playtesting wants the genre-
  stereotype "declining 50-year-old," that's `low_reserve`, a
  bible choice, not the population default — which is the point.
- `schema_assim_p` presumes PersonModel/world-rule schemas are
  queryable at tick-time; ambient NPCs lack them and simply skip
  the operator (graceful by construction).

# Part V — v51 deepening (2026-09-23): the wall has doors, the school years still leak, the immigrant archive is language-locked, and the earliest memory is a moving target

Parts I–IV priced the era structure (ramp, bump, midlife), the
child-specific failure modes (scripts, suggestion, interviews), and
the transition overlays. What was left: (a) the amnesia window was a
single wall — the landmark study that built it says it is four doors;
(b) the forgetting-rate literature says the school years — AFTER the
amnesia boundary — still leak faster than adult rates, and the spec's
ramp ends at 7; (c) a Mission District cast is bilingual, and the
language asymmetry was priced age-flat (v1.9) when its real bite is
developmental; (d) puberty — the physiological teen, distinct from
the social teen of Part III — had no overlay; (e) public events had
flashbulb records but no cohort mechanics — they never MADE a
generation; (f) dating gained landmarks but not the child-specific
postdate; (g) "earliest memory" was implicit, never an output — and
in children it isn't stable enough to be one. All sources
web-verified this pass.

## 48. The amnesia wall has event-class doors — the pierce

[CONSENSUS] Usher & Neisser 1993 (*JEP:General* 122:155, n=222 —
verified): the offset of childhood amnesia is NOT one age. Adults
reliably recalled the **birth of a younger sibling** and a
**hospitalization** from age **2**, but **deaths** and **family
moves** only from age **3**. The events that pierce are the ones
with embodied, discontinuous, family-ritualized content; the events
that don't are temporally diffuse (a move is a season, a death is
absorbed). Second finding, equally load-bearing: external
information sources (family stories) correlated **negatively** with
recall from 2–3 and **positively** from 4–5 — below the pierce,
being TOLD about it doesn't substitute for having been there; above
it, retelling props the memory up. This is the multiple-determinants
account made mechanical.

**Spec consequence (v4.9):** `eventClass` gains `amnesia_pierce` ∈
{0,1,2} (default 0; 2 = bodily/family-ritual classes: sibling_birth,
hospitalization, injury; 1 = household discontinuities: move,
death_family, new_school). The §4.1 consolidation gate and the
§4.14 latent transition evaluate against
`amnesia_exit_eff − amnesia_pierce` — a sibling-birth record encoded
at 2.5 fights a 5-year wall, not a 7-year one. Records surfacing
only via pierce carry `earliest_candidate: true` (§55 feeds on
this). And the source finding becomes a rule: below the pierce age,
`told_by` accounts cannot lift a record over the gate (the §4.13
hearCount channel is zeroed below `pierce_age + 1`); above it, they
help normally. A baby sister is remembered; the summer of the move
is not.

## 49. The school years still leak — the forgetting tail past the wall

[CONSENSUS] Bauer & Larkina 2014 (*JEP:General* 143:597 — verified):
children's autobiographical distributions fit an **exponential**
(constant high forgetting rate) while adults' fit a **power**
function (decelerating). Bauer & Larkina 2014 (*Memory* 22:907 —
verified): 8–9-year-olds retained <40% of events discussed at age 3
vs ≥60% for 5–7-year-olds — the amnesia is being *manufactured
during the school years*, not inherited from them. The prospective
4-year study (Bauer 2015, *Memory* 24 — verified): 4- and
6-year-olds forget faster than 8-year-olds, ALL child groups faster
than adults, differences sharpest in open-ended recall; thematic
coherence predicted survival. The spec's `amnesia_slope` ramp ends
at `amnesia_exit` (7) — but the elevated forgetting rate demonstrably
runs to ~10–11. The wall and the leak are different mechanisms:
consolidation immaturity that outlives the encoding ramp.

**Spec consequence (v4.9):** β_episodic gains a school-age tail,
keyed on `encodeAge` exactly like the ramp it extends:
`school_beta_mult(a) = 1 + school_leak·(1 − (a−amnesia_exit)/4)`
clamped ≥1 for `a ∈ [amnesia_exit, 11]` (`school_leak` ≈ 0.5 → β×1.5
at 7 → β×1.0 at 11). Permanent multiplier, same shape as the ramp —
the fitted-form change is free (exponential vs power IS a larger
effective β). The coherence finding reuses existing machinery:
coherentUnit/linked records already pass the consolidation gate —
now they also halve `school_beta_mult`'s increment
(`coherent_leak_rescue` 0.5): a well-narrated school-age memory
forgets at near-adult rate; an un-narrated one evaporates. [The
0.5 split and the 4-year tail are our fit — the literature gives
the ordering 4>6>8>adult, not constants. HYPOTHESIS on magnitudes,
CONSENSUS on sign.]

## 50. The immigrant archive is language-locked — development × bilingualism

[CONSENSUS] Marian & Neisser 2000 (*JEP:General* 129:361 —
verified): Russian-English bilinguals retrieved more memories from
the Russian-speaking era when interviewed in Russian and more from
the English era in English — and the *ambient* language of the
interview mattered independently of cue-word language. Schrauf &
Rubin 1998/2000/2004: bilinguals' memory distributions literally
partition by language across the lifespan — the pre-migration era
surfaces in L1. Harris, Ayçiçeği & Gleason 2003 (*Appl.
Psycholing.* 24:561 — verified): childhood **reprimands** and taboo
words in L1 elicit greater autonomic arousal than L2 equivalents —
but ONLY for late learners; early bilinguals show no difference.
Javier, Barroso & Muñoz 1993: therapeutic recall of early events
shifts with the language of narration.

The v1.9 `lang_mismatch` leg is age-flat — it misses what these
studies share: the mismatch is catastrophic precisely for the era
when the other language didn't exist. An L2 cue to an L1-encoded
childhood record isn't a degraded cue; it's nearly a foreign one.

**Spec consequence (v4.9):** profiles gain `langs` entries with
`l1_until` (the encodeAge at which the ambient language effectively
became L2 — immigration/settlement age, per bible). At encoding,
records mint `lang` from the ambient language **at encodeAge**, not
at character creation — the migration is the boundary. Retrieval
language match (§5.2) gains an era depth term:

```
if C.lang != m.lang:
    lang_mismatch_eff ×= (1 − l1_lock · (1 − m.encodeAge/m.l1_until))
    // l1_lock ≈ 0.5 — mismatch deepens toward the L1-only era;
    // a Spanish cue reaches what English conversation cannot
if C.lang == m.lang == l1:
    arousal_tag_eff += l1_emo_gain (0.1)   // Harris 2003:
    // L1 reprimands/insults carry the body's voltage; L2 lands
    // lighter. Applies ONLY when l1_until ≥ ~6 (late learners) —
    // early bilinguals' L1 advantage is null (locked null).
```

Consequence for the cast: an immigrant character's childhood is
quiet in English small-talk and loud in the mother tongue —
language-selective amnesia that is *reversible* (unlike §4.14
latents, these records need only the right linguistic context).
This is the single highest-yield v51 mechanic for a Mission
District cast — the bilingual neighbor whose childhood in El
Salvador only surfaces when the conversation turns Spanish.

## 51. Culture and gender move the wall itself

[CONSENSUS] MacDonald, Uesiliana & Hayne 2000 (*Memory* 8:365 —
verified): NZ Māori adults' earliest memories ≈ age 2.7 — the
earliest mean ever reported, consistent with Māori culture's
explicit past-orientation; NZ European ≈ 3.5; Asian NZ ≈ 4.9 — and
the Asian effect was driven almost entirely by Asian *women*. Wang
2001 (*JPSP* 81:220 — verified): Americans' earliest memories ran
~6 months earlier than Chinese Americans', and were longer, more
specific, self-focused, emotionally elaborated; Chinese memories
centered collective activity, routine, neutral affect. Mullen 1994
(*Cognition* 52:55): women report earlier and more elaborate
earliest memories than men. Across all three studies the mechanism
is the same one Part II priced: elaborative reminiscing in the
family — culture and gender shift the *environment*, and the
environment shifts the wall.

**Spec consequence (v4.9):** no new wall — new priors on the
existing one. Bibles gain `culture_env` ∈ [0,1] (prior on
`reminiscence_env`: Māori-class ≈ 0.8+, mainstream-US ≈ 0.5,
collectivist-low-elaborative ≈ 0.3 — stacks with the actual family
style the bible specifies; the two multiply, cap 1.0). Residual
direct offset `culture_exit_off` ±0.5y for the part family style
doesn't capture (ritual density, language socialization outside the
home). And a second dial the studies force: `auto_style` ∈
{self_focused, relational} — sets the `selfRel` prior on new
records (self-focused +0.1) and the `detail_emit_gain` on report
(relational −0.15: shorter, routine-centered, affect-flat tellings).
Female profiles get `detail_emit_gain` +0.1 (women's reports
contain more information — MacDonald 2000, all three cultures).
Small effects, flagged DEBATED on magnitudes — the qualitative
pattern is replicated, the effect sizes are modest and
confounded with language.

## 52. Puberty is its own regime — the physiological teen

[DEBATED] Part III priced the SOCIAL adolescent (phase delay,
social evaluation, co-rumination). Underneath sits a physiological
transition nobody had priced: pubertal maturation reorganizes
amygdala–prefrontal and hippocampal circuitry while it is happening.
Murty, Calabro & Luna 2016 (*Neurosci. Biobehav. Rev.* 70:46 —
verified): hippocampal–prefrontal integration refines across
adolescence under dopaminergic modulation; memory gains are
context-specific, not global. Spielberg et al. 2014/2015:
pubertal stage (more than age) predicts amygdala reactivity to
social threat. Romeo 2010 (*Horm. Behav.* 58): pubertal stress
responses are prolonged vs adults' — the HPA window is open wider
and longer. The honest caveat from the 2021 Annual Review:
adolescent episodic-memory findings are *inconsistent* — some show
adult-equivalent performance, some protracted development. This is
a real regime with noisy measurement, so the overlay is narrow.

**Spec consequence (v4.9):** `puberty` overlay (reversible regime
class, §4.17): window `pub_window` [pub_onset, pub_onset+5],
pub_onset ~N(11.5, 1) female / ~N(12.5, 1) male [population knots —
bible may pin timing ±2y as `pub_timing`, an individual-difference
the literature supports]. While active: `pub_emo_gain` (+0.15 on
arousal_tag of socially-evaluative records — amygdala window),
`pub_theta` (+0.05 — noisier retrieval during reorganization),
`pub_stress_gain` (+0.15 on stress encoding — Romeo's prolonged
response; stacks with §43's child_stress_gain only BELOW
stress_flip_age, never double-counted). At window close all legs
revert; records carry only `regime:puberty`. The encoding-side
gain feeds the bump window's front edge — one more reason the bump
opens when it does.

## 53. Cohorts are made, not born — public events imprint

[CONSENSUS] Schuman & Scott 1989 (*Amer. Sociol. Rev.* 54:359 —
verified): asked for the most important national/world events of 50
years, Americans nominate disproportionately the events of their
**adolescence and early adulthood** — different cohorts, different
canons. Corning & Schuman (2015, *Generations and Collective
Memory*): the critical period holds across nine national samples —
with the documented exception: **epochal events** (revolutions,
wars' ends) flatten the age gradient and imprint all ages at once.
Brown et al. 2009 (*Memory Studies* 2:4 — "living in history"):
people in war/disaster-affected populations spontaneously organize
personal memory *around* the public event — the era becomes a
chapter boundary inside private life.

**Spec consequence (v4.9):** events gain `public_scale` ∈ {0,1,2}
(1 = neighborhood-scale — the block fire, the protest; 2 = epochal).
Two legs: (a) `cohort_imprint` — a `public_scale ≥ 1` record
encoded inside the character's bump window **waives
`bump_valence_gate`** and takes bump_gain regardless of valence:
the generation-defining fire imprints even though it was terrible.
(b) `epochal` (scale 2) ignores the window entirely —
`epochal_gain` 1.3 on encoding E at ANY encodeAge ≥ 5 (the
exception Schuman documented). Output side: public_scale ≥1
records mint `chapter: true` — §6.15 uses them as before/after
brackets (§54), and retell ecology gives them +`chapter_tell` 0.1
(they are how a life gets divided into "before the fire" and
"after"). In RW terms: the same earthquake belongs to everyone's
bump-year story only if they were 15 — and to everyone's
neighborhood canon regardless.

## 54. Landmarks cut telescoping — and children postdate the past

[CONSENSUS] Loftus & Marburger 1983 (*Mem. Cogn.* 11:114 —
verified): bounding a retrospective query with a salient,
well-dated landmark ("since the Mt. St. Helens eruption") cut
forward telescoping substantially — personal landmarks worked as
well as public ones, and part of the benefit is that landmarks
carry precise dates. §6.15 already implements record-side landmark
anchoring (`landmark_gain` on tele_k_eff when links reach a dated
landmark). What it lacks: the QUERY-side version — when a recall
query itself names an anchor ("what happened after the fire?"), the
respondent's date_sigma on post-anchor records should shrink. And
the child arm: Wang & Peterson 2014 (*Psych. Sci.* — verified):
children systematically **postdate** their earliest memories at
follow-up — the same event gets dated later as the child ages.
This is telescoping running at double speed, on the earliest
memories specifically.

**Spec consequence (v4.9):** (a) `anchor_query_gain` 0.4: when a
recall context supplies a `public_scale`/milestone record as
temporal bound, post-bound candidates' `date_sigma ×=
(1 − anchor_query_gain)` — the landmark does at query time what it
does at link time. (b) `earliest_tele_gain` 1.5 on forward
telescoping for `earliest_candidate` records when retrieval age <
12 — the postdate bias, restricted to the era it was measured in.
Both cheap; the second is sign-locked (children push the past
FORWARD, never backward — the opposite of what intuition says
about kids and the distant past).

## 55. The earliest memory is a moving target — stability gate

[CONSENSUS] Peterson, Warren & Short 2011 (*Child Dev.* 82:1092 —
verified, n=140 longitudinal): asked for their three earliest
memories twice, 2 years apart, children 4–7 produced almost
disjoint sets — the "earliest memory" isn't a stored answer, it's
re-derived each time from whatever survives. By 10–13 the sets
overlap; cues recovered earlier-named memories in older but not
younger children. Combined with §48–49: the pool is shrinking AND
the selection is unstable — young children's "earliest" is a
reconstruction with a half-life.

**Spec consequence (v4.9):** `earliest` is an OUTPUT, never a
field. `recall(query:"earliest")` scores `earliest_candidate`
records by (encodeAge asc, S desc) and emits the winner — below
`earliest_stab` (≈9, phasing over ~3y) the top-3 are redrawn per
query (sampled, not argmax — the disjoint sets), above it the
winner is sticky via the ordinary S dynamics (the same record
keeps winning because it keeps being retold). No new state, one
gate constant. Falsifiable: P532 asks the same child at 5 and 7
and must get different answers.

## 56. Children search slowly too — the low-age latency knots

[CONSENSUS] §5.25's `lat_age_mult` prices the old side (1.3 at 70,
1.6 at 85) but starts at 1.0 ≤50 — yet the developmental
processing-speed literature is the same curve's other flank: Kail
1991 (*Dev. Psych.* 27:259): a single exponential speed function
fits childhood-to-adult latency across tasks; children ~7 run
roughly 1.4–1.8× adult latency on retrieval/search tasks
(Kail & Salthouse 1994). The child who answers "I don't know" fast
isn't forgetting differently — the search takes longer and gives
up.

**Spec consequence (v4.9):** `lat_age_mult` gains low-age knots:
1.4 at 6 → 1.2 at 10 → 1.0 at 16 (joining the old-side knots at
50). Same display-only rule — latency never feeds θ. This changes
how child characters *perform* forgetting (slow, effortful,
truncated search) without changing what they store — and it makes
the P532-style "different earliest answer" behavior read correctly
in dialogue: the 5-year-old doesn't pause to search deep; the
shallow sample is all there is.

## 57. Knot-table revision summary (v4.9)

| curve | change | source |
|---|---|---|
| amnesia wall | event-class `amnesia_pierce` offsets −1/−2y; told_by zeroed below pierce | Usher & Neisser 1993 |
| β_episodic × encodeAge | `school_beta_mult` tail 7→11 (+0.5 at 7) | Bauer & Larkina 2014/2015 |
| amnesia_exit_eff | `culture_exit_off` ±0.5y residual + `culture_env` prior on reminiscence_env | MacDonald 2000; Wang 2001; Mullen 1994 |
| lang_mismatch | era-depth term `l1_lock` ×(1−encodeAge/l1_until); `l1_emo_gain` match-side | Marian & Neisser 2000; Harris 2003 |
| θ, arousal, stress | `puberty` overlay window ~11.5/12.5±1y, +5y duration | Murty 2016; Spielberg 2014; Romeo 2010 |
| bump gate | `cohort_imprint` waives valence gate for public_scale≥1; `epochal` ignores window | Schuman & Scott 1989; Corning & Schuman 2015 |
| dateEstimate | `anchor_query_gain` query-side; `earliest_tele_gain` child postdate | Loftus & Marburger 1983; Wang & Peterson 2014 |
| earliest output | `earliest_stab` 9±1.5 — redraw below, sticky above | Peterson et al. 2011 |
| lat_age_mult | child knots 1.4@6→1.0@16 | Kail 1991 |
| report style | `auto_style` self/relational → selfRel prior + detail_emit | Wang 2001; MacDonald 2000 |

## 58. Spec changes (v4.8 → v4.9) — delta table

| # | change | where (source) |
|---|---|---|
| H1 | `eventClass.amnesia_pierce` {0,1,2} → effective wall `amnesia_exit_eff − pierce`; `earliest_candidate` tag; told_by zeroed below pierce+1 | §48 (Usher & Neisser 1993) |
| H2 | `school_beta_mult(encodeAge)` + `coherent_leak_rescue` 0.5 — β tail 7→11 | §49 (Bauer & Larkina 2014; Bauer 2015) |
| H3 | `langs[].l1_until`; lang minted at encodeAge ambient; `l1_lock` era-depth mismatch; `l1_emo_gain` (late-learner gate ≥6, early-null locked) | §50 (Marian & Neisser 2000; Harris 2003) |
| H4 | `culture_env` prior + `culture_exit_off` ±0.5 + `auto_style` + female `detail_emit_gain` +0.1 | §51 (MacDonald 2000; Wang 2001; Mullen 1994) |
| H5 | `puberty` overlay (pub_window, pub_emo_gain .15, pub_theta .05, pub_stress_gain .15; pub_timing bible pin ±2y) | §52 (Murty 2016; Romeo 2010) [DEBATED] |
| H6 | `public_scale`/`epochal`/`chapter` event fields; `cohort_imprint` gate-waiver; `epochal_gain` 1.3 all-ages; `chapter_tell` 0.1 | §53 (Schuman & Scott 1989) |
| H7 | `anchor_query_gain` 0.4 query-side landmark; `earliest_tele_gain` 1.5 child postdate | §54 (Loftus & Marburger 1983; Wang & Peterson 2014) |
| H8 | `earliest` = output query w/ `earliest_stab` redraw gate — never stored | §55 (Peterson 2011) |
| H9 | `lat_age_mult` child knots 1.4@6→1.0@16 | §56 (Kail 1991) |
| H10 | `earliest_candidate` + `chapter` are C-tier-visible record flags; `lang` already C | contract |

## 59. Validation probes (P525–P534; registry continues P1–P524)

- **P525 pierce (MUST):** sibling_birth + hospitalization records
  encoded at encodeAge 2.5 retrievable at 20 while matched
  move/death and neutral records at the same encodeAge are
  latent/absent; a `told_by`-only account at encodeAge 2 cannot
  pass the gate even at max hearCount.
- **P526 school tail (MUST, sign-locked):** matched-strength
  neutral records encoded at 7–9 show lower 4-year retention than
  encodeAge 12+ records; coherentUnit-linked school-age records
  lose no more than ~half the gap vs un-narrated.
- **P527 language lock (MUST):** l1_until=14 profile: L2-language
  query surfaces materially fewer L1-era records than the same
  query in L1; L1-matched reprimand-class records emit with higher
  arousal_tag_eff; an early-bilingual control (l1_until<6) shows NO
  L1 emotional advantage (locked null).
- **P528 culture/gender (SHOULD):** high culture_env +
  self_focused profile reports earlier + denser earliest memory
  than low + relational at identical seed; female profile emits
  ~10% more detail fields per earliest report.
- **P529 puberty overlay (SHOULD, DEBATED-flagged):** socially-
  evaluative records inside pub_window encode higher S than
  matched records outside; θ elevated inside only; all legs revert
  at window close (records keep regime tag only).
- **P530 cohort imprint (MUST, sign-locked):** negative-valence
  public_scale=1 record at encodeAge 16 encodes with bump_gain
  (gate waived) while a matched PRIVATE negative record does not;
  public_scale=2 record at encodeAge 35 (outside window) still
  encodes elevated.
- **P531 anchor query (SHOULD):** dateEstimate sigma shrinks for
  post-anchor records when query names the anchor vs not; a 6-10yo
  character's reported age for an earliest_candidate record exceeds
  true age on average (postdate sign-locked).
- **P532 moving earliest (MUST):** same profile queried "earliest
  memory" at retrieval ages 5 and 7 yields different records with
  p>0.5 under seed variation; at 11 and 13 yields the same record
  with p>0.7.
- **P533 child latency (SHOULD):** latency_ms at age 7 ≥ 1.3× age
  20 on matched records; latency never enters drive (invariant
  holds under new knots).
- **P534 v4.9 regression (MUST — structure):** all new params at
  defaults reproduce v4.8 outputs on the standard battery except
  the sign-locked differences above.

## 60. Honest limits, fifth pass

- Usher & Neisser's pierce is four event classes in one college
  sample — we generalize `amnesia_pierce` to a class taxonomy the
  paper never enumerated; extension to RW eventClasses is ours.
- `school_beta_mult`'s 4-year tail and 0.5 magnitude are fitted:
  Bauer & Larkina give orderings and fit-shapes (exponential vs
  power), not per-age β constants. The probe tests the sign, not
  the curve.
- The bilingual mechanism is well-sourced but its mapping to
  encodeAge is a modeling choice — Marian & Neisser varied
  retrieval language, not era depth directly. The `l1_until`
  interpolation is ours; the era-partitioned distribution (Schrauf
  & Rubin) supports it directionally.
- Puberty is the least-locked section this pass: the human
  episodic-memory × puberty literature is genuinely inconsistent
  (2021 Annual Review). The overlay is deliberately narrow
  (affect-weighted, socially-evaluative records only) and flagged
  DEBATED; a future version should not widen it without new
  sources.
- `culture_exit_off` risks double-counting `reminiscence_env` —
  the two multiply with a cap rather than add; still, culture_env
  is a prior on a bible dial, so a bible that sets both a
  low-elaborative family AND a low culture_env will push the wall
  far. Clamp rows bound the total excursion to ±2y.
- earliest_stab at 9 is the midpoint of Peterson's 4–7 unstable /
  10–13 stable bins — the phase-in is interpolated.
- `epochal_gain` applied to encodeAge ≥ 5 keeps infant records
  exempt — the literature doesn't test epochal imprinting in
  toddlers; we set the floor at the pierce boundary.

---

# Part VI — v63 deepening (2026-09-23): the infant clock, the reminder that must be seen, the watched-not-done channel, grandparents' bump, the cue the child can't generate, ordering by strength, the strategy schedule, schooling as the operator, and the adolescent win that sticks

## 61. Below the wall the clock runs faster — the infant retention function

[CONSENSUS, best-quantified age effect in the entire doc] The wall
(§48, amnesia_exit_eff) marks which records SURVIVE to adulthood —
but inside the infant's own life, forgetting is a different machine
entirely. Rovee-Collier's mobile-conjugate program (Hartshorn &
Rovee-Collier 1997; Hartshorn et al. 1998, *Dev. Psychobiol.*
33:1 — verified, the development-of-forgetting monograph;
Rovee-Collier 1999, *Curr. Dir. Psych. Sci.* 8:33 — the "time
window" table): retention grows roughly LINEARLY with age in
infancy — ~1–2 days at 2 months, ~1 week at 3–4 months, ~2 weeks
at 6 months, ~8–13 weeks at 18 months — a doubling time of about
one month of life. The infant isn't amnesic in the adult sense;
every trace exists, just on a clock ~10–50× faster than the
adult's. This supplies the missing mechanism under the wall:
below-wall records aren't merely "weak versions" — they decay on
an infant schedule and die to latency within days-weeks unless
something else intervenes.

**Spec consequence (v5.11):** `beta_episodic` gains an
`infant_beta_mult(encodeAge)` knot column, applied only when
`encodeAge < amnesia_exit_eff` and stacked multiplicatively with
`amnesia_slope`: 8.0@0.2y → 6.0@1y → 4.0@2y → 2.5@3y → 1.0@exit.
The numbers compress the empirical ratio (2mo infant ≈ days vs
adult ≈ weeks-months) into a tractable multiplier; the probe
tests ordering, not the exact constants. Effect: a baby's morning
is gone by the weekend; a toddler's week persists about a month.
This finally makes the wall *emergent* — infant records don't
need a special erasure rule, they just decay on the fast clock
and fall under `forget_thresh` before any consolidation can
catch them.

## 62. The reminder must be seen — reinstatement below the wall

[CONSENSUS] The same Rovee-Collier program's second finding is
more consequential for RW: a flagging infant memory is fully
RESTORED by a single brief re-exposure to part of the original
context — seeing the mobile again, the room again (the
"reactivation" paradigm; Rovee-Collier et al. 1980; reviewed
Rovee-Collier 1999). Crucially the reminder is PERCEPTUAL —
re-encounter, not narration (the infant can't be told about it).
Combined with §48's `told_by` zeroing: below the pierce, a verbal
account mints nothing and reinstates nothing; a re-encounter
reinstates almost everything. This is the cleanest mechanistic
split the doc has: same record, two reminder channels, one works
and one doesn't — and WHICH works flips at the wall.

**Spec consequence (v5.11):** new op leg inside
`dailyMemoryTick`/event encoding: a new Event whose context
fields (place, object, persons) overlap a latent record's
cueVector above `reinstate_bar` (0.6) applies `S *= (1 +
reinstate_gain)` with `reinstate_gain` 0.4 for encodeAge<exit
records (vs the adult-scale `mental_reinstate` 0.09 — infants
benefit MORE). **Locked null `told_reinstate_null`:** `hearAccount`
NEVER triggers reinstatement on below-wall records — the channel
is re-encounter only. Game-systems note: this is the "going back
to grandma's house smells/rooms unlock it" mechanism — it
formally explains why place-cue retrieval (§5.20 latent
reinstatement) is the only door under the wall.

## 63. Mechanism note — why the infant clock is fast (DEBATED)

Frankland, Köhler & Josselyn 2013 (*Science* 341:1047747 —
verified, rodent): postnatal hippocampal neurogenesis — which is
maximal in infancy — actively CAUSES forgetting; suppressing
neurogenesis in infant mice preserves memory, elevating it in
adults induces infant-like forgetting (Josselyn & Frankland 2018
for review). If true in humans, the wall isn't a storage failure
or a retrieval lock — it's turnover: the infant brain writes over
itself. **[DEBATED]** — animal data, and the alternative
retrieval-failure accounts (§11 latent-trace, §48 pierce classes)
coexist with it. **No params** — this section justifies why
`infant_beta_mult` exists at all and why reinstatement is
re-encounter-shaped (new neurons disrupt the engram; a matching
percept can still reactivate what's left). Modeling license: if a
future probe shows below-wall records SHOULD recover verbally,
the null `told_reinstate_null` is the load-bearing claim to break
— cite it in the fix.

## 64. Watched, not done — the deferred-imitation channel

[CONSENSUS] Toddlers encode and reproduce OBSERVED action
sequences — no participation, no language: Barr & Hayne 1999
(*Dev. Psychobiol.* 34:159 — 12–24mo reproduce target acts after
weeks); Bauer 2002 (*Dev. Rev.* 22:235 — ordered recall of
observed event sequences robust from ~13–20mo, surviving months).
The preverbal child is recording OTHER PEOPLE'S events, not just
its own — and observation records are thinner (first-person
sensory fields absent) but real. This matters for RW below the
pierce: §4.29 already mints `secondhand_fear` from witnessed
threat; the general channel is `role:"observer"`.

**Spec consequence (v5.11):** Event schema gains
`role:"participant"|"observer"` (default participant). Encode:
`E *= obs_gain(encodeAge)` — knots 0.3@1y → 0.8@4y → 1.0@8y
(observation is asymptotically as good as participation for
gist by school age; verbatim/self-field density stays lower —
observer records mint WITHOUT self-referential field tiers).
Below `amnesia_exit_eff − pierce`, only `role:"observer"` records
with arousal ≥ arousal_thresh mint at all (the watched alarm is
the infant's strongest kept thing — secondhand fear §4.29 is the
formal instance). Adult observer records unchanged (already
"witnessed" semantics).

## 65. The bump cascades — grandparents' era lives in the child

[CONSENSUS, two independent demonstrations] Svob & Brown 2012
(*Memory* 20:737 — verified: young adults asked for parent-told
memories produce a reminiscence bump for THEIR PARENTS' young-
adulthood era — the bump transmits through stories); Krumhansl &
Zupnick 2013 (*Psych. Sci.* 24:2059 — verified: music ratings
show the listener's own bump ~13 AND a second bump at the
parents' young-adult era — "cascading"). A household's bump-era
stories are its most-told stories (§6.24 canonization), and
hearers encode them disproportionately — the child of a
22-year-old-era family archive carries a phantom adolescence.

**Spec consequence (v5.11):** `hearAccount` gains the
`heritage` leg: when the speaker is kin (`rel ∈
{parent,grandparent,sibling}` from PersonModel) AND the account's
content era falls inside the SPEAKER's bump window (teller's
encodeAge 10–30) AND hearer age ∈ `heritage_hearer` [8,30], the
minted `told_by` record gets `S *= (1 + heritage_gain)`,
`heritage_gain` 0.35. Non-kin speakers attenuate ×0.4
(acquaintance anecdotes carry less). Interacts with §53
`cohort_imprint` on the teller's side (epochal public events
survive best in the teller, so they're the most-told, so they
inherit the most). World-builder hook: family-bible "story"
content should carry `era` tags so the window test is
computable; a character raised on grandparent war stories is
formally different from one who wasn't.

## 66. The cue the child can't generate — production deficiency at retrieval

[CONSENSUS] Kobasigawa 1974 (*Child Dev.* 45:190 — verified:
4th-graders given category cues recalled more, but didn't deploy
the available cue structure SPONTANEOUSLY; the deficit is
generation, not use); Flavell, Beach & Chinsky 1966 (*Child Dev.*
37:283 — spontaneous verbal rehearsal emerges ~7). §13 covered
encode-side production deficiency; the retrieval side is
symmetric and sharper: the child's free recall fails not because
the record is gone but because nobody supplied the cue. The
interview-operator finding (§40) is the same fact seen from the
asker's side — the child needs the search scaffolded from outside.

**Spec consequence (v5.11):** voluntary recall computes
`nCues` = count of nonempty cueVector channels in the query.
When `nCues < cue_floor` (1), θ_eff multiplies by
`free_recall_tax(retrievalAge)`: 2.0@5 → 1.5@8 → 1.0@12. Any
nonempty channel (even a weak `w_when`) waives the tax — the
bar is "one cue exists," not "good cues." Sign-locked
consequence: children retrieve WORSE on open questions than on
narrowed ones by a factor adults don't show; scaffolding
(interviewer cues, `interviewMode`, a parent saying "at the
lake, remember?") restores access. This is the mechanism behind
§56's low-latency "I don't know" — it's not slowness alone; the
search never starts.

## 67. Ordering by strength — the child calls the vivid old thing "yesterday"

[CONSENSUS] Friedman 1991 (*Dev. Rev.* 11:139 — children's
memory for time of past events: young children lack temporal
codes and reconstruct recency from trace strength/familiarity —
stronger = more recent); Friedman & Kemp 1998 (*Cog. Dev.*
13:335 — distance-based scale judgments mature through ~8–10).
Adults order by temporal fields and anchors (§6.15); children
order by how it FEELS. The signature error is directional: a
vivid year-old event reports as more recent than a bland
last-month one — strength inverts the truth.

**Spec consequence (v5.11):** `orderRecall(a,b)` gains a child
branch: when retrievalAge < `order_strength_until` (9, ±1
phase), emit `order = argmax(S_a, S_b)` with probability
`order_strength_bias` 0.6, else use the adult path. Below ~5
the bias is near-total (no temporal reconstruction exists);
by 12 adult weighting dominates. Sign-locked: child order
errors systematically place STRONGER records later —
falsifiable in either direction. Note the interaction with
§62: a recently reinstated infant record carries fresh S — a
child may order grandma's-house from 3y ago as last week. That
is the datum.

## 68. Strategies arrive on a schedule — three onsets, not one

[CONSENSUS] The strategy-development literature is a ladder,
not a switch (Ornstein, Haden & Hedrick 2004; Schneider &
Pressley 1997 for review): spontaneous rehearsal ~7–8,
categorical organization ~9–10, elaboration ~13+. Each tier
changes what REPETITION buys: before the onset, the same
repetition is plain re-exposure (strength only); after it, the
repetition is a strategy — the child is now DOING something to
the trace. RW events flagged `studied`/`practiced` (reciting a
part, drilling vocabulary, practicing the piano piece) should
pay off only past the relevant tier.

**Spec consequence (v5.11):** `studied:true` events gain
`E *= (1 + study_mult)` where `study_mult` 0.25 is gated by
tier: below `rehearsal_on` (7) the flag pays 0 — the
repetition encodes but buys no bonus; at 7–10 the flag pays
`study_mult` on rote-repeat content only; `org_on` (10) extends
it to categorized/structured content; `elab_on` (13) to
self-explanatory material. **Locked null
`strategy_retro_null`:** pre-onset studied records do NOT
retroactively gain the bonus when the tier arrives — the
strategy operated at encode, not on the archive.

## 69. Schooling is an operator, not a birthday — the grade effect

[CONSENSUS for the existence of the effect; magnitude ours]
Morrison, Smith & Dow-Ehrensberger 1995 (*Child Dev.* 66:1399 —
verified, the birthday-cutoff regression-discontinuity design:
children separated by weeks but split across grades show
GRADE effects exceeding AGE effects on memory measures —
schooling itself does the reorganizing); Rogoff 1981 /
Rogoff & Mistry for the cross-cultural corroboration. Memory
"development" is partly instruction — formal schooling teaches
rehearsal, deliberate retrieval, and self-testing as skills.

**Spec consequence (v5.11):** profile field `schooled` ∈
{full, partial, none} (bible-set; all 8 mains full — this
differentiates AMBIENT backstories and any unschooled
upbringing). Effect is small and specific:
`schooled:none` delays all three §68 onsets by
`school_strat_adv` (0.5y each) and adds `meta_school_gain`
0.05 to the §18 overconfidence gap persisting past 8 (the
metamemory calibration itself is partly taught). Mapping is
HYPOTHESIS-tier: Morrison's effects are on test performance,
not autobiographical encoding directly — we extend
directionally, flagged in the probe.

## 70. The adolescent win sticks — reward memory inside the window

[CONSENSUS for the existence; magnitude moderate] Davidow,
Foerde, Galván & Shohamy 2016 (*Neuron* 91:182 — verified:
adolescents show enhanced episodic memory for reward-associated
material relative to both children and adults — the
reward-sensitivity literature's memory leg); Murty, Calabro &
Luna 2018 for the systems framing. §52's pub overlay covers
arousal/θ/social-eval; the reward valence leg was missing: a
teen's WINS encode hot — the victory, the applause, the first
paycheck, the risk that paid off.

**Spec consequence (v5.11):** the §4.17 `pub` overlay gains one
leg: inside `pub_window`, events with `reward:true` (positive-
valence achievement/recognition content — world tags) gain
`E *= (1 + pub_reward_gain)`, `pub_reward_gain` 0.12. Stays
narrow: reward-valenced only, window-scoped only, reverts at
close like the other pub legs. The bump asymmetry this
produces — the teen years' disproportionate roster of triumphs
— is a component of §3's bump fuel that runs on reward
circuits, not just firsts/transitions.

## 71. Knot-table revision summary (v5.11)

| curve | change | source |
|---|---|---|
| β_episodic below wall | `infant_beta_mult` 8@0.2y→1@exit | Hartshorn et al. 1998; Rovee-Collier 1999 |
| latent below-wall S | `reinstate_gain` 0.4 on context re-encounter; told_by null locked | Rovee-Collier et al. 1980/1999 |
| Event.role | `observer` + `obs_gain` 0.3@1y→1.0@8y | Barr & Hayne 1999; Bauer 2002 |
| hearAccount | `heritage_gain` 0.35 kin × teller-bump-era × hearer∈[8,30] | Svob & Brown 2012; Krumhansl & Zupnick 2013 |
| θ voluntary | `free_recall_tax` 2.0@5→1.0@12 under cue_floor | Kobasigawa 1974; Flavell et al. 1966 |
| orderRecall | `order_strength_bias` 0.6 below 9±1 | Friedman 1991; Friedman & Kemp 1998 |
| studied events | `study_mult` 0.25 tier-gated 7/10/13 | Ornstein et al. 2004; Schneider & Pressley 1997 |
| profile | `schooled` flag; onsets +0.5y + meta gap on `none` | Morrison et al. 1995 [HYPOTHESIS map] |
| pub overlay | +`pub_reward_gain` 0.12 on reward events | Davidow et al. 2016 |

## 72. Spec changes (v5.10 → v5.11) — delta table

| # | change | where (source) |
|---|---|---|
| I1 | `infant_beta_mult` knots on β below amnesia_exit_eff | §61 (Hartshorn 1998) |
| I2 | reinstatement leg — `reinstate_gain`/`reinstate_bar`; `told_reinstate_null` locked | §62 (Rovee-Collier 1980) |
| I3 | `role:"observer"` + `obs_gain` + below-pierce observer arousal gate | §64 (Barr & Hayne; Bauer 2002) |
| I4 | `heritage` leg on hearAccount | §65 (Svob & Brown 2012; Krumhansl & Zupnick 2013) |
| I5 | `cue_floor`/`free_recall_tax` child knots | §66 (Kobasigawa 1974) |
| I6 | `orderRecall` strength branch | §67 (Friedman 1991) |
| I7 | `study_mult` tier gating + `strategy_retro_null` | §68 (Ornstein 2004) |
| I8 | `schooled` profile field + `school_strat_adv`/`meta_school_gain` | §69 (Morrison 1995) |
| I9 | `pub_reward_gain` overlay leg | §70 (Davidow 2016) |

## 73. Validation probes (P657–P666; registry continues P1–P656)

- **P657 infant clock (MUST, sign-locked):** matched-S records
  encoded at 0.5y / 2y / 5y / 20y show monotonically increasing
  time-to-latent; the 0.5y record falls below forget_thresh
  within `infant_beta_mult`-scaled days absent any reminder.
- **P658 reinstate channel (MUST + locked null):** a latent
  below-wall record re-encountered via overlapping context Event
  surfaces and gains S; the same content delivered via
  `hearAccount` produces NO S change on the latent record
  (told_reinstate_null — assert exactly zero lift).
- **P659 observer channel (SHOULD):** role:observer events at
  encodeAge 2 mint retrievable records only under strong
  contextual cues and carry no self-field tier; at encodeAge 6
  they mint ordinary records at obs_gain discount.
- **P660 heritage bump (MUST):** kin-told_by records about the
  teller's bump-window era, heard at age 12, show higher S per
  hearCount than the same teller's age-45-era accounts; non-kin
  control shows ≤40% of the gain.
- **P661 cue floor (MUST, sign-locked):** at retrievalAge 6 a
  zero-channel query fails at ≥2× the one-weak-channel rate;
  adult profile shows no cue_floor effect.
- **P662 order by strength (SHOULD):** at retrievalAge 7, two
  same-era records differing only in S are ordered with the
  higher-S record reported "later" at p>0.55; at 14 ordering
  follows time fields.
- **P663 strategy tiers (MUST):** studied-flag events at 6 gain
  nothing vs matched plain repeats; at 8 rote-studied gains; at
  11 categorized-studied gains; a pre-onset record queried at 12
  shows NO retroactive bonus (strategy_retro_null).
- **P664 schooling (SHOULD, HYPOTHESIS-flagged):** schooled:none
  profile shows §68 onsets delayed ~0.5y and a larger
  post-8 metamemory overconfidence gap vs schooled:full at
  identical seed.
- **P665 pub reward (SHOULD, DEBATED-lite):** reward-flagged
  events inside pub_window encode elevated vs outside; neutral
  events inside the window unchanged (overlay stays narrow —
  a diffuse pub-window lift FAILS this probe).
- **P666 v5.11 regression (MUST — structure):** all v5.11 params
  at defaults reproduce v5.10 outputs on the standard battery
  except the sign-locked differences above.

## 74. Honest limits, sixth pass

- `infant_beta_mult` compresses a developmental doubling-time
  into a β multiplier — Hartshorn gives retention intervals
  for a MOTOR task (mobile conjugate); autobiographical records
  are extrapolated. The probe tests ordering, never the curve.
- Reinstatement is measured on infants' own motor memories;
  extending it to place/object overlap for latent records is
  our mapping — `reinstate_bar` 0.6 is fitted.
- Deferred imitation produces behavioral reproduction, which is
  procedural-adjacent; we treat observed episodes as episodic
  records with missing self-fields — Bauer's ordered-recall
  results support the episodic read, but the field-tier split is
  ours.
- The heritage bump is measured on content CLASS (parents' era
  stories, parents' era music) not on per-record salience —
  `heritage_gain` 0.35 is a fitted midrange; the kinship and
  window gates are the load-bearing claims.
- `free_recall_tax`'s 2.0@5 is Kobasigawa-shaped but the exact
  magnitude is fitted; the sign-lock (any-one-cue waives it) is
  the datum the probe enforces.
- Morrison's schooling effect is on memory TEST performance —
  extending it to encode-side strategy onsets is the weakest
  mapping in this pass; flagged HYPOTHESIS and SHOULD-tier only.
- pub_reward_gain is the narrowest leg deliberately: the
  adolescent reward-memory literature is young (single-digit
  core papers) — keep it window-scoped and reward-only; do not
  widen without new sources.

# Part VII — v75 deepening (2026-09-23): the lock that keeps the key, the forget cue that isn't, the thin mint, the adolescent blackout, the intention that needs a clock, the child who tells it, the instruction that lands, and doing beats watching (the child side)

Seven unpriced legs this pass. Four corrections/sharpenings of
earlier informal claims: (a) below-the-wall traces are not just
weak — they are **context-locked**, which is a retrieval-side
constraint no earlier version modeled; (b) the directed-forget
operator's child side was assumed absent — verified this version:
it is **present but output-shaped** (storage intact, report
suppressed, and FALSE content suppressed better than in adults);
(c) `pm_time_tax` had old-side knots only — the child side is the
steeper arm; (d) `reminiscence_env` was a black-box bible dial —
the literature says its active channel is **the child doing the
telling**, now mechanized. Sources re-verified inline.

## 75. Below the wall the key is the room itself — context-locked traces

- **Infant retention is context-bound, and the binding loosens
  with age.** Butler & Rovee-Collier 1989 (*JEP:LM&C* 15): in the
  mobile-conjugate paradigm, changing the crib liner or the
  surrounding visual context abolishes 3-month-olds' retention
  that would otherwise be near-perfect; Rovee-Collier & Shyi 1992
  and Hayne & Findlay 1995 (context-shift work): the cost of a
  context change falls steeply across the first year and remains
  elevated through toddlerhood relative to adults.
  **[CONSENSUS]**
- **This is a RETRIEVAL constraint on a stored trace, not an
  encoding failure** — the same infant re-tested in the original
  context shows full retention after delays that would be
  forgotten under a changed context (Butler & Rovee-Collier 1989).
  The trace is fine; only the original room can read it.
- **Persistence past the wall — HYPOTHESIS extension.** The infant
  literature measures weeks, not decades. Our modeling claim:
  records minted while `encodeAge < amnesia_exit_eff` carry the
  constraint for life — which is exactly the phenomenology of
  early memories surfacing ONLY on near-exact reinstatement (the
  smell of that kitchen, never "tell me about being four").

**Spec consequence (v5.23):** records with
`encodeAge < amnesia_exit_eff` mint with `ctx_locked:true`
(permanent flag). At retrieval, for ctx_locked records, the
simOp mismatch penalty on `place` and `sensory` fields is
multiplied by `ctx_strict(encodeAge)` — knots 2.5@<3y → 1.8@4y →
1.3@6y → 1.0@exit — evaluated at mint and stored, so it never
decays. Net effect: a below-wall record's effective retrieval
mass under a partial-context cue (name, topic, "when you were
little") is negligible; under full-context reinstatement it is
nearly normal. This stacks with `infant_beta_mult` (§4.31a — the
fast clock) and `reinstate_gain` (§4.31b — the seen reminder):
the infant literature's triad is now the spec's triad.

## 76. The forget cue is a report cue in childhood — controlled vs output DF

- **Listwise directed forgetting is late.** Harnishfeger & Pope
  1996 (*J. Exp. Child Psychol.* 62:292 — verified): first
  graders show NO List-1 forgetting, third graders a reduced
  effect, fifth graders adult-like. Zellner & Bäuml 2004 (2nd vs
  4th graders): no forget-cue effect in the younger band.
  Wilson & Kipp 1998 (*Dev. Rev.* 18:86) — the review.
  **[CONSENSUS]**
- **But it is a production deficiency, not a competence wall.**
  Aslan, Staudigl, Samenieh & Bäuml 2010 (*Psychon. Bull. Rev.*
  17:784 — verified): with high-emphasis cues young children
  show partial DF — the mechanism exists but isn't recruited
  spontaneously, mirroring §66's production-deficiency frame.
- **The child asymmetry nobody had priced:** Howe 2005
  (*Psychol. Sci.* 16 — verified): under a directed-forget cue,
  children (5/7/11) suppress FALSE recall (DRM lures) while
  adults do NOT. Children's gist-false output is effortfully
  generated and therefore suppressible at the report gate;
  adults' is automatic. The same instruction that does nothing
  to a child's true-memory storage DOES clean their false
  output.
- **Automatic inhibition is already there.** Zellner & Bäuml
  2005 (*Mem&Cogn.* 33:396 — verified): retrieval-induced
  forgetting and part-list cuing effects are intact in children
  — RIF needs NO new child ramp (earlier drafts assumed a late
  onset; the data says otherwise). Ford, Keating & Patel 2004
  (*Br. J. Dev. Psychol.* 22:585): 7-year-olds show
  adult-magnitude RIF. The DF/RIF dissociation in childhood is
  the controlled/automatic split itself.

**Spec consequence (v5.23):** `dforget` splits by age at flagging.
Below `df_store_onset` (10) the flag does NOT engage `df_theta`
ecology-starving (storage untouched — locked `df_erase_null`
already guarantees no deletion); instead it sets a report gate:
emission of the flagged record requires retrieval mass
×(1 + `df_gate`, 0.5), and records with `phantom`/`gist_lure`
tags pay an additional ×(1 + `df_gist_gate`, 0.3) — the Howe
asymmetry, child-only. From `df_store_onset` to adult the flag
moves onto the standard `df_theta` path. Below ~7 the gate is
weak too (first graders "show hardly any effect of the forget
cue at all" — scale `df_gate` by `df_gate_ramp` 0.3@5→1.0@10).

## 77. Children mint thin records — the field budget

- **Children's event reports are sparser, and the sparsity is in
  the record, not just the telling.** Jones & Pipe 2002
  (children's event recall 5→9: completeness and accuracy both
  rise); Fivush & Haden — children's narratives of the same
  event contain fewer elements. Working-memory span growth
  (Gathercole, Pickering, Knight & Stegmann 2004 — verified
  norms) bounds how much of an ongoing event gets written.
  **[CONSENSUS direction; field-count mapping HYPOTHESIS]**
- **What gets kept is not random.** Young children keep agents
  and actions (who did what) and drop temporal order, location
  detail, and thematic connections — consistent with §67
  (Friedman: ordering by strength, not time) and §37 (scripts
  swallow instances — the dropped fields are exactly the ones
  that individuate instances).

**Spec consequence (v5.23):** `field_budget(encodeAge)` caps the
number of cueVector/verbatim fields written at mint — knots
3@3y → 4@5y → 5@8y → 6@12y → 8@adult (adult = current behavior,
no cap). Overflow drops by a fixed fill order, children keeping
`people` > `action/topic` > `place` > `sensory` > `when` >
`why/emotion` (temporal and thematic fields drop FIRST — the
opposite of adult truncation, where `when` dies first under
arousal but `why` survives). Downstream consequence is emergent
and load-bearing: a thin cueVector means fewer cue channels can
reach the record later — part of what §2's amnesia wall IS, now
priced as a mint-side mechanism rather than only decay.

## 78. The adolescent dip — teens lose the childhood they had at eight

- **The amnesia is made during childhood** (§2, Bauer & Larkina
  2014): children who recalled ≥60% of early events at 5–7
  recall <40% at 8–9 — the loss is visible while they are still
  children.
- **It deepens through adolescence, then the floor holds.**
  Peterson, Grant & Boland 2005 and Peterson, Warren & Short
  2011 (*Memory* 19): children's reported earliest-memory age
  drifts forward as they age — events recalled at 8 are gone or
  re-dated at 12. Habermas & de Silveira 2008: the life-narrative
  reorganization of §29 coincides with the sparsest recall of
  the pre-10 era. Adolescents are reorganizing the archive, and
  during the reorganization access is worst.
  **[CONSENSUS that childhood recall drops across 8→18; the
  recovery claim is partial — some access returns in adulthood
  (the bump-era records re-densify), some does not — HYPOTHESIS
  split below]**

**Spec consequence (v5.23):** `reorg_dip` — during
`retrievalAge ∈ [reorg_lo 12, reorg_hi 18]`, records with
`encodeAge ∈ [reorg_era_min 4, reorg_era_max 9]` pay a θ
penalty `+reorg_dip` (0.2). Two-armed: 60% of the penalty is
pure access (lifts at `reorg_hi`), 40% is real attrition —
records queried-and-failed inside the window take a one-time
`S *= (1 − reorg_attrit 0.15)` (a failed search during the
reorganization costs the trace; successful retrievals inside
the window are exempt — use it or lose it, adolescent-edition).

## 79. The intention needs a clock — time-based PM is the late arm

- **Event-based prospective memory is early.** Kvavilashvili,
  Kyle & Messer 2008 (review — verified): event-based PM is
  demonstrable in preschoolers and near-mature by ~7 when the
  cue is salient; §31 already priced the interruption hazard.
- **Time-based PM is late because it is strategy-based.** Ceci
  & Bronfenbrenner 1985 (*Dev. Psychol.* 21 — verified):
  children's time-based remembering depends on strategic clock
  monitoring, which develops through middle childhood — the
  children who pass are the ones who check. Without an external
  reminder the young child's time-bound intention simply does
  not fire. **[CONSENSUS]**

**Spec consequence (v5.23):** `pm_time_tax` (v5.12, old-side
knots 1.0@50→1.6@85) gains child knots — the full curve is now
U-shaped in log-age: 2.2@5y → 1.6@9y → 1.2@14y → 1.0@adult →
1.6@85. Event-based `pm_self` unchanged on the child side
(intact early). Compensation leg: `pm_clock_p` (0.3 scaled by
consc) — a child with an armed time-intention emits periodic
`check_clock` micro-events; each check inside `pm_win` restores
half the tax. The child who checks the clock IS the child who
remembers — the mechanism, not a correlation.

## 80. The child tells the story — reminiscence_env's active channel

- **Joint reminiscing consolidates, and the child's own
  contribution is the active ingredient.** Reese, Haden &
  Fivush 1993 (*Cog. Dev.* 8 — verified: mothers' elaborations
  at encoding predict children's later recall, acting through
  the child's own participation); Welch-Ross 1997; Fivush,
  Haden & Reese 2006 — elaborative maternal style works by
  drawing the CHILD into producing the narrative. Reese &
  Newcombe 2007 (longitudinal): the outcome is earlier
  autobiographical onset and more coherent early memories —
  already priced as `reminiscence_env` (v1.5) but the delivery
  channel was a black box. **[CONSENSUS mechanism]**

**Spec consequence (v5.23):** `hearAccount`/retell where the
teller IS the child and the content is the child's own past:
`S *= (1 + self_reminisce_gain)`, 0.3 at `retrievalAge <
self_reminisce_until` (10), vs adult retell_boost baseline.
`reminiscence_env` now acts through this leg instead of as a
free-floating consolidation scalar: the env dial modulates both
the rate of child-tells-own-past events (world-side frequency)
and the gain itself (±`reminisce_env_mod` 0.1 around the knot).
Low-env households mint fewer child-tell events AND gain less
per event — the mechanism produces the wall-shift (§12's
`amnesia_exit_eff`) rather than assuming it.

## 81. "Try to remember" — the instruction that lands on children

- **Intentional-encoding instructions help children MORE than
  adults** — the production-deficiency flip side. Baker-Ward,
  Ornstein & Holden 1984 (*J. Exp. Child Psychol.* — verified):
  children told to remember show a large encoding benefit that
  spontaneous encoding lacks; adults gain less because they are
  already strategy-spontaneous. The same instruction is a
  nudge for an adult and an unlock for a six-year-old.
  **[CONSENSUS direction; magnitude knots HYPOTHESIS]**

**Spec consequence (v5.23):** Event flag `to_remember:true`
(the character was told / told themselves to remember this —
bedtime "remember this for the dentist," a parent's "don't
forget what happened today"). Encoding gain
`E *= (1 + intent_boost(encodeAge))` — knots 0.4@4y → 0.3@8y →
0.15@12y → 0.1@adult. Stacks under `field_budget` (the
instruction raises E, not the field count — a told child
remembers MORE of the same thin record).

## 82. Doing beats watching — enactment's child side

- **The enactment effect (subject-performed tasks) is robust
  from ~3–4 and proportionally LARGER in young children** —
  Ratner, Smith & Dionne 1991 (enactment improves children's
  recall; Cohen 1981). §4.31c priced the observer side
  (`obs_gain`, watched-not-done); §85 of age-decline priced the
  old side (`enact_rescue` 1.1@65→1.4@85). The child knot was
  the missing end of the curve. **[CONSENSUS existence; child
  knot magnitudes HYPOTHESIS]**

**Spec consequence (v5.23):** `enact_rescue` gains child knots —
full curve now 1.3@4y → 1.15@10y → 1.1@adult plateau →
(existing) 1.25@75 → 1.4@85 — a U in age with its widest arms
at the ends, which is the shape the SPT literature draws
(Bäckman & Nilsson 1985 old side; Ratner et al. child side).
Note the asymmetry now explicit: for a 4-year-old, watching an
event mints at `obs_gain` 0.3 while doing it mints at
enact-boosted full strength — a ~4× self/other gap at an age
where the adult gap is ~1.4×. Children are made of what they
did, not what they saw.

## 83. Knot-table revision summary (v5.12)

| curve | change | source |
|---|---|---|
| simOp ctx mismatch | `ctx_strict(encodeAge)` 2.5@<3→1.0@exit on `ctx_locked` records | Butler & Rovee-Collier 1989; Hayne & Findlay 1995 |
| dforget below onset | storage untouched; report gate `df_gate` 0.5 ×`df_gate_ramp`; gist +`df_gist_gate` 0.3 | Harnishfeger & Pope 1996; Howe 2005 |
| RIF/part-list | NO new params — verified intact in children; existing rif_k stands | Zellner & Bäuml 2005; Ford et al. 2004 |
| mint | `field_budget(encodeAge)` 3@3→8@adult; child drop-order when/why first | Gathercole et al. 2004; Jones & Pipe 2002 |
| θ | `reorg_dip` +0.2 on era [4,9] records during [12,18]; fail→`reorg_attrit` | Peterson et al. 2011; Habermas & de Silveira 2008 |
| pm_time_tax | child knots 2.2@5→1.2@14 join old side; `pm_clock_p` 0.3 check leg | Ceci & Bronfenbrenner 1985; Kvavilashvili et al. 2008 |
| retell | `self_reminisce_gain` 0.3 child-tells-own-past <10; `reminisce_env` routes through it | Reese, Haden & Fivush 1993; Reese & Newcombe 2007 |
| E | `intent_boost(encodeAge)` 0.4@4→0.1 adult on `to_remember` | Baker-Ward, Ornstein & Holden 1984 |
| enact_rescue | child knots 1.3@4→1.15@10 join old-side U | Ratner et al. 1991; Cohen 1981 |

## 84. Spec changes (v5.22 → v5.23) — delta table

| # | change | where (source) |
|---|---|---|
| J1 | `ctx_locked` mint flag + `ctx_strict` knots on simOp ctx penalty | §75 (Butler & Rovee-Collier 1989) |
| J2 | `dforget` age split: `df_store_onset` 10; report-gate path `df_gate`/`df_gist_gate`/`df_gate_ramp` below | §76 (Harnishfeger & Pope; Howe 2005) |
| J3 | `field_budget` mint cap + child drop-order | §77 (Gathercole 2004; Jones & Pipe 2002) |
| J4 | `reorg_dip` θ penalty + `reorg_attrit` on failed queries | §78 (Peterson 2011) |
| J5 | `pm_time_tax` child knots + `pm_clock_p` check leg | §79 (Ceci & Bronfenbrenner 1985) |
| J6 | `self_reminisce_gain` leg; `reminisce_env` rerouted through it | §80 (Reese, Haden & Fivush 1993) |
| J7 | `intent_boost` knots on `to_remember` | §81 (Baker-Ward 1984) |
| J8 | `enact_rescue` child knots — U completed | §82 (Ratner 1991) |
| J9 | RIF child ramp considered and REJECTED — null finding logged (intact early) | §76 (Zellner & Bäuml 2005) |

## 85. Validation probes (P795–P804; registry continues P1–P794)

- **P795 context lock (MUST, sign-locked):** a record encoded at
  3, intact S, queried at 12 with a topical/name cue only → no
  retrieval; same query with place+sensory reinstatement →
  retrieval. A matched adult-encoded control retrieves on the
  partial cue. The flag persists — at 40 the record STILL fails
  the partial cue.
- **P796 DF output gate (MUST, two arms):** `dforget` on a
  6-year-old's record leaves S and ecology intact
  (structure-check: zero df_theta activity) while raising
  emission threshold — the record surfaces on strong cues, is
  withheld on weak ones; same flag at 12+ runs the adult
  df_theta path (starved ecology).
- **P797 child gist suppression (SHOULD — the Howe sign):** at
  retrievalAge 7, `dforget` suppresses phantom/gist_lure-tagged
  records MORE than true records (df_gist_gate active); at 30
  the asymmetry inverts or vanishes (adults can't gate the
  false output).
- **P798 field budget (MUST):** encodeAge-4 mints carry ≤3–4
  cueVector fields with `when`/`why` dropped first; encodeAge-10
  mints carry ~5–6; adult mints uncapped. Drop order is
  fixed-order, not random — `when` survives a child mint only
  when field count is under budget.
- **P799 adolescent dip (MUST, shape-locked):** the same
  encodeAge-6 record queried at 10, 15, 20 → R(15) < R(10) AND
  < R(20) for SURVIVING records; records whose query failed
  inside the window show the `reorg_attrit` S-loss mark —
  attrition concentrated on the queried-and-failed, not the
  untouched.
- **P800 time-PM child arm (SHOULD):** identical intentions,
  `cueType:time` vs `cueType:event` at 6 → event fires ≥1.8×
  more; at 14 the gap narrows to ≤1.3×; `pm_clock_p`-high
  children halve the gap (compensation is behavioral, not a
  param edit).
- **P801 child-tells (SHOULD):** a 7-year-old recounting her own
  past event consolidates it more than hearing a caregiver
  recount the same event to her; reminiscence_env-modulated
  households differ in BOTH leg rate and per-leg gain.
- **P802 intent unlock (SHOULD):** `to_remember` events at 5
  gain ≥1.35× the adult relative boost; flag absent at 5 vs
  present at 25 shows no reverse ordering.
- **P803 enactment U (SHOULD):** enacted-vs-observed encode
  ratio is largest at ~4 (≈4× via obs_gain × enact_rescue),
  narrows to ~1.2× at adult, re-widens ≥1.4× at 85 —
  both arms of the U against the same event content.
- **P804 v5.23 regression (MUST — structure):** all v5.23
  params at defaults reproduce v5.22 outputs on the standard
  battery except the sign-locked differences above; rif_k
  untouched (J9 null).

## 86. Honest limits, seventh pass

- `ctx_strict`'s persistence past `amnesia_exit_eff` is our
  extension — the infant literature measures weeks. The
  phenomenological claim (early memories need full reinstatement)
  is folklore-consistent but not lab-verified at decadal scale;
  P795 tests the sign, the decade-persistence is the bet.
- The DF output gate maps a listwise-lab finding onto an
  autobiographical record — `df_gate`/`df_gist_gate` magnitudes
  are fitted; the DIRECTION (report-side, false-first) is the
  verified datum.
- `field_budget`'s fill order is inferred from what children
  report (agents/actions early, when/why late); whether dropped
  fields were never encoded or encoded-and-dead is debated —
  we chose never-encoded (cheaper, and consistent with the
  completeness findings).
- `reorg_dip`'s 60/40 access/attrition split is a modeling
  decision; the literature shows the drop but not its
  permanence structure. The `reorg_attrit` mark makes the
  hypothesis falsifiable (P799).
- `pm_clock_p` treats clock-checking as a trait-modulated
  behavior propensity — Ceci & Bronfenbrenner measured the
  STRATEGY; the per-character propensity is our plumbing.
- `self_reminisce_gain` routes `reminisce_env` through a
  mechanism the literature supports directionally, but the
  per-event gain (0.3) and env modulation (±0.1) are fitted.
- `intent_boost` extends list-learning instruction effects to
  event encoding — HYPOTHESIS map, SHOULD-tier only.
- `enact_rescue` child knots (1.3@4) extrapolate SPT ratios
  across paradigms; the U shape is right, the exact child arm
  is a fit.

# Part VIII — v87 deepening (2026-09-23): the self that isn't online yet, the child who knows but doesn't remember, the attention gate that hasn't grown, the bump that only takes the good news, the intention that won't die, and futures that run thin at both ends

Six mechanisms and one sign-correction, all sourced this version.
The through-line: several spec terms were age-FLAT that the
literature shows are not — the self-reference dividend, the
recollection channel, the attention gate, the bump's valence
profile, intention deactivation, and future-simulation detail.
Each gets knots keyed on the correct of the two ages (§1).

## 87. The self comes online late — `self_ref_eff` gates the dividend

- **Ross, Anderson & Campbell 2011** (*Monographs of the Society
  for Research in Child Development* 76(3), "I remember me" —
  verified): 3- and 4-year-olds already show a mnemonic
  self-reference advantage — via self-performed action,
  self-image processing, and ownership — but the authors frame
  it as a *nascent* form; the elaborated self-concept that
  drives the adult effect (Symons & Johnson 1997) is still
  under construction. **[CONSENSUS that the effect exists in
  preschoolers; magnitude-vs-adult is smaller and
  domain-dependent]**
- **Howe & Courage 1997** (*Psychol. Rev.* 104:499 — verified):
  the cognitive self emerges ~18–24 months and is posited as
  the organizer whose absence *is* infantile amnesia —
  mechanism DEBATED (§63), but the onset anchor is the best
  dated one in the literature.
- **Ross, Hutchison & Cunningham 2020** (*Child Development* —
  verified): in 3–6-year-olds the volume of specific
  autobiographical memories is predicted by both the volume of
  self-knowledge and self-source monitoring capacity — the
  self→memory coupling is measurable, graded, and still
  strengthening across this window.

**Spec consequence (v5.35):** §2's `w_self·selfRelevance_eff`
term gains an `encodeAge` gate — `self_ref_eff(encodeAge)`:
0.3 at 2 → 0.7 at 4 → 0.9 at 6 → 1.0 by 8. Below the wall the
gate is moot (records are `ctx_locked` anyway); in the 3–7
band it is a real partial channel — the preschool self helps,
just not at adult weight. **Locked `self_ref_era_null`:** the
gate keys `encodeAge` forever — an adult recalling a
preschool event does not retro-collect the self dividend; the
dividend is an encoding operator, not a retrieval weight.
P918/P919. **[HYPOTHESIS: the ramp shape is fitted; the onset
and the encode-only scope are the established parts]**

## 88. "I know it happened" — recollection ripens through adolescence

- **Ofen et al. 2007** (*Nature Neuroscience* 10:1198 —
  verified, ages 8–24 fMRI): recognition of *vividly
  recollected* scenes improves with age; the developmental gain
  tracks protracted prefrontal, not MTL, maturation —
  recollection is the late channel.
- **Billingsley, Smith & McAndrews 2002** (*JECP* 82:251 —
  verified): developmental dissociation — priming and
  familiarity mature earlier than explicit recollection.
- **Ghetti & Lee 2011** (*Developmental Review* 31 — verified
  review): familiarity is approximately adult-like by ~6–8;
  recollection keeps developing into adolescence. Cycowicz,
  Friedman & Duff 2003: ERP recollection correlates absent in
  young children. **[CONSENSUS dissociation]**

**Spec consequence (v5.35):** the derived `recol_w` channel
(§4.23) gains `recol_enc_mult(encodeAge)` — evaluated at
Reconstruction on the record's encode age, never written into
stored fields: 0.5 at 5 → 0.75 at 8 → 0.9 at 12 → 1.0 at 16.
Childhood-encoded records therefore emit `reportMode:"know"`
far more often at equal strength — fluent, thin-detailed, fast
— which is exactly what children's verbal recall looks like
(it isn't a retrieval failure; the contextual detail was never
the record's). **Locked `fam_child_null`:** `fam_w` carries no
child multiplier — the verified split is recollection-only;
an assertion that children are also *familiarity*-deficient
fails P920. **[HYPOTHESIS: knot values; the dissociation
itself is textbook]**

## 89. The child's attention gate — `att_min` grows down

- **Betts, McKay, Maruff & Anderson 2006** (*Child
  Neuropsychology* 12:205 — verified): sustained attention
  improves steeply 5→9, plateaus ~10–12; high task load
  disproportionately hurts the youngest group.
- **Ruff & Rothbart** (*Attention in Early Development*, 2nd
  ed. 2001 — verified): orienting/capture systems precede
  sustained and selective control by years — the toddler is
  captured by salience, not steered by goals.

**Spec consequence (v5.35):** `att_min_eff` gains child knots
on `age_now` (same quantity as `encodeAge` at mint time):
`att_floor_age` 0.30 at 4 → 0.22 at 7 → 0.15 at 10 → base
`att_min` thereafter — the ambient background of a
4-year-old's day mostly doesn't write. Salience capture is
*preserved*: `dist_child_mult` (1.3) scales the arousal +
novelty terms UP for `age_now < 10` — the loud bright thing
encodes fine; it's the periphery that's missing. The pair
produces the observed phenomenology: children's days have
fewer, more peaked records. **[CONSENSUS growth curve and
capture-preservation direction; magnitudes fitted]**

## 90. The source tag ripens late — `src_child_mult`

- **Lindsay, Johnson & Kwon 1991** (*JECP* 52:297 — verified):
  memory source monitoring improves through childhood; errors
  concentrate below ~7.
- **Drummey & Newcombe 2002** (*Developmental Psychology*
  38:1138 — verified): fact recall improves steadily 4→8 but
  source accuracy jumps abruptly 4→6 — binding, not item, is
  the bottleneck (convergent: Sluzenski, Newcombe & Kovacs
  2006 longitudinal — item linear, binding accelerates 5–7).

**Spec consequence (v5.35):** `beta_source` gains a child
multiplier keyed on `encodeAge < src_child_exit` (10):
`src_child_mult` 1.5 at 4 → 1.25 at 6 → 1.0 by 10. A
7-year-old's "Maya said so" keeps the claim but sheds the
speaker at ~1.5× adult rate — orphan claims and
`sourceConfuse` pile up in childhood-encoded records even
when the content survives. This is the encode-side partner of
the retrieval-side `source_confuse` machinery; it does NOT
touch reality-monitoring (§6.10 — already age-sliced both
ends). **[CONSENSUS direction; multipliers fitted]**

## 91. The bump only takes the good news — `bump_neg_pen`, frozen `ls_pos_only`

- **Berntsen & Rubin 2004** (*Memory* 12:681 — verified, cited
  §30): the cultural life script is overwhelmingly *positive* —
  expected events cluster in the bump window AND in positive
  valence; the script has almost no negative entries.
- **Bohn & Berntsen 2008** (*Memory* 16 — verified) and 2011
  (*Child Development* — verified): scripted transitions are
  positive-biased; children's own projected life scripts are
  even more positive than adults'.
- **Thomsen & Berntsen 2008** (§23 — verified): the bump for
  *most positive* events is carried by transitional firsts;
  negative distributions don't bump — they ride arousal and
  recency instead. **[CONSENSUS pattern]**

**Spec consequence (v5.35) — sign correction:** the current
`bump_valence_gate` (`valence > 0 OR selfRelevance >
bump_self_thresh`) lets negative-but-self-relevant records
through the second arm — they bump, contradicting the datum.
v5.35: negative-valence records pay `bump_neg_pen` (0.5) on
`bump_beta_mult` even when selfRelevant — a partial waiver,
not a block: the divorce still encodes strongly (selfRelevance
is intact), it just doesn't get the *era* discount. Frozen
`ls_pos_only`: the `script_age_pull` dating prior applies only
to non-negative records — "people usually marry around 28"
exists; "people usually grieve at 28" doesn't. **[HYPOTHESIS:
pen magnitude; the sign and the frozen scope are established]**

## 92. Thin futures at both ends — `sim_detail_mult` child knots + `epf_sem_fill`

- **Busby & Suddendorf 2005** (*Cognitive Development* 20:362
  — verified): yesterday/tomorrow reports emerge in tandem
  3→5 — mental time travel is one faculty; the minority of
  3-year-olds who can do one side do the other.
- **Addis, Wong & Schacter 2008** (*Psychological Science*
  19:33 — verified): older adults generate fewer *internal*
  (episodic) details for imagined futures — the deficit
  mirrors their past-recall deficit, and external (semantic)
  details rise in compensation; internal details correlate
  with relational memory. Addis, Musicaro, Pan & Schacter
  2010 (*Psychology and Aging* 25:369 — verified): survives
  the no-recasting recombination task — it's simulation
  machinery, not event-recycling.

**Spec consequence (v5.35):** `sim_detail_mult(age_eff)` —
currently decline-only (1.0 ≤50 → 0.65 at 85) — gains child
knots: 0.45 at 4 → 0.7 at 8 → 1.0 at 14. New `epf_sem_fill`
(0.3): the missing internal detail is partially back-filled
with external/semantic routine detail at *both* ends (the
4-year-old's "tomorrow" and the 80-year-old's are both
schedule-shaped, not scene-shaped) — emission length falls
less than verbatim richness, so the probe reads the detail
MIX, not the count. `future_leak_null` stands: thin futures
never mint past-tense records. **[CONSENSUS both arms; knots
and fill share fitted]**

## 93. The zombie intention — completed PM keeps firing

- **Scullin, Bugg, McDaniel & Einstein 2011** (*Memory &
  Cognition* 39:1232 — verified): older adults show preserved
  spontaneous retrieval of PM cues but *impaired deactivation*
  of completed intentions — the asymmetry is the finding.
- **Scullin, Bugg & McDaniel 2012** (*Psychology and Aging*
  27:46 — verified, "Whoops, I did it again"): commission
  errors — re-performing a finished intention — are elevated
  in older adults.
- **Bugg & Scullin 2013** (*Psychology and Aging* 28 —
  verified): intentions that were *repeatedly performed* are
  hardest to deactivate — repetition builds the zombie.
- **Walser, Fischer & Goschke 2012** (*JEP:LMC* 38:1030 —
  verified): aftereffects of completed intentions persist and
  interfere — deactivation is the fragile step.
  **[CONSENSUS: the phenomenon and the age asymmetry]**

**Spec consequence (v5.35):** when an armed intention fires or
is declared complete, mint a non-record `pm_zombie` residual
(hl `pm_zombie_hl` ≈ 14 days, ×`pm_zombie_repeat` 1.5 if the
intention fired ≥3 times before completion). On cue
re-presentation the completed response re-fires at
`pm_zombie_p(age_eff)` — knots 0.02 at 20 → 0.05 at 50 → 0.20
at 80 — emitted as an action-urge micro-event
`didItAgain:true` the world can render (she double-waters the
plants, double-mails the letter). **Locked
`zombie_monitor_null`:** the zombie never re-arms the §5.14
monitor loop — no monitoring cost, no preparatory attention;
the aftereffect is spontaneous retrieval only (Scullin 2011's
account). **[HYPOTHESIS: per-age magnitudes and the
repetition multiplier]**

## 94. Knot-table revision summary (v5.35)

| param | knots | source |
|---|---|---|
| self_ref_eff | 0.3@2 → 0.7@4 → 0.9@6 → 1.0@8 (encodeAge) | Ross 2011; Howe & Courage 1997 |
| recol_enc_mult | 0.5@5 → 0.75@8 → 0.9@12 → 1.0@16 (encodeAge) | Ofen 2007; Ghetti & Lee 2011 |
| att_floor_age | 0.30@4 → 0.22@7 → 0.15@10 → att_min (age_now) | Betts 2006 |
| dist_child_mult | 1.3 flat, exits 10 (age_now) | Ruff & Rothbart 2001 |
| src_child_mult | 1.5@4 → 1.25@6 → 1.0@10 (encodeAge) | Lindsay 1991; Drummey & Newcombe 2002 |
| bump_neg_pen | 0.5 flat on negative records (encodeAge-side gate) | Thomsen & Berntsen 2008 |
| sim_detail_mult child | +0.45@4 → 0.7@8 → 1.0@14 (age_now) | Busby & Suddendorf 2005 |
| epf_sem_fill | 0.3 flat, both ends | Addis 2008/2010 |
| pm_zombie_p | 0.02@20 → 0.05@50 → 0.20@80 (age_eff) | Scullin 2011/2012; Bugg & Scullin 2013 |
| pm_zombie_hl / _repeat | 14d / 1.5 | Walser 2012; Bugg & Scullin 2013 |

## 95. Spec changes (v5.34 → v5.35) — delta table

| change | where | type |
|---|---|---|
| `w_self` term × `self_ref_eff(encodeAge)` | §2 formula + §4.41 | knot |
| `beta_source` × `src_child_mult` under 10 | §4.42 | knot |
| `att_min_eff` child floor + `dist_child_mult` | §4.43 | knot |
| `bump_neg_pen` on bump_beta_mult; `ls_pos_only` frozen | §4.44 | sign fix + frozen |
| `recol_w` × `recol_enc_mult(encodeAge)` at report | §5.92 | knot |
| `sim_detail_mult` child knots; `epf_sem_fill` | §5.93 | knot + param |
| `pm_zombie` residual + `didItAgain` emission | §5.94 | mechanism |
| locked: self_ref_era_null, fam_child_null, zombie_monitor_null | §§4.41, 5.92, 5.94 | nulls |

## 96. Validation probes (P918–P927; registry continues P1–P917)

- **P918 self-reference onset (MUST, sign):** identical
  high-selfRelevance events encoded at encodeAge 3 vs adult —
  E ratio ≤0.5× the low-selfRelevance control ratio at 3, ≈1.0
  at 8 (knot tolerance ±20%).
- **P919 era null (SHOULD, structure):** adult-age recall of
  an encodeAge-3 record shows no retrospective `w_self`
  component — the gate reads encodeAge, not age_now
  (`self_ref_era_null` structure-check).
- **P920 recol child gate (MUST):** records with encodeAge ≤6
  emit `reportMode:"know"` ≥2× the adult-encodeAge rate at
  matched strength; `fam_w` identical across encodeAge
  (`fam_child_null` field-check).
- **P921 source ripening (SHOULD):** who-told/where-learned
  fields on encodeAge ≤6 records decay ≥1.3× adult rate;
  content fields unchanged (channel isolation).
- **P922 child attention gate (MUST, two arms):** peripheral
  ambient events encode at ≤50% adult rate at age_now 5;
  high-arousal events ≥90% parity at the same age (capture
  preserved via `dist_child_mult`).
- **P923 bump negativity (SHOULD, distribution):**
  negative-valence selfRelevant records show a flat era
  distribution vs the positive bump — no secondary peak at
  bump_peak (`bump_neg_pen` ≥ sign; `ls_pos_only` frozen).
- **P924 thin futures U (SHOULD):** imagineEvent
  verbatim_count at age_now 5 AND 80 both < adult at matched
  traits; external/semantic detail share +`epf_sem_fill`·0.8
  at both ends; `future_leak_null` structure-checked.
- **P925 zombie intention (MUST):** after a completed PM
  intention, cue re-presentation emits `didItAgain:true` at
  pm_zombie_p±25%; ≥70 age arm ≥3× the young arm; repeated-
  fire arm ≥1.35× single-fire; monitor state stays disarmed
  (`zombie_monitor_null` state-check).
- **P926 recol maturation (COULD):** know→remember report
  crossover falls in encodeAge 8–16 on the standard battery —
  logged curve, not asserted point.
- **P927 v5.35 regression (MUST, structure):** all v5.35
  params at defaults reproduce v5.34 outputs on the standard
  battery except the sign-locked differences above; rif_k,
  pm_focal_hit untouched.

## 97. Honest limits, eighth pass

- `self_ref_eff`'s ramp is a fit — Ross 2011 establishes the
  effect EXISTS at 3–4 but never titrates it against adults in
  a common currency; the 0.7@4 knot interpolates between
  "present" and "adult."
- `recol_enc_mult` reads encodeAge at report time — an
  approximation: the literature shows an encoding-side
  deficit (PFC), but pricing it at retrieval on a fixed
  record property is equivalent and cheaper. A record encoded
  at 5 but rehearsed to strength could plausibly regain recol
  — we forbid that (locked via the encodeAge key, P919-style);
  reconsolidation-restoration is DEBATED and we chose the
  simpler side.
- `att_floor_age` conflates sustained-attention growth with
  the encode gate; capture (`dist_child_mult`) is modeled as
  a flat multiplier, though real capture is stimulus-specific.
- `src_child_mult` is a decay-side stand-in for what is
  partly a binding-side deficit (Sluzenski 2006) — we price
  the observable (source lost faster) rather than the
  mechanism.
- `bump_neg_pen` 0.5 is fitted; the datum is distributional
  (negative events don't bump) not parametric.
- `epf_sem_fill`'s parity of mechanism at both ends is our
  simplification — Addis's external-detail rise is an old-age
  finding; extending it to children is HYPOTHESIS (Busby &
  Suddendorf show the deficit, not the fill).
- `pm_zombie_p` knots extrapolate lab commission-error rates
  to per-cue-presentation probabilities; real-world cue
  frequency makes the daily incident rate emergent, and the
  repetition multiplier is fitted from Bugg & Scullin's
  condition ordering, not their magnitudes.

# Part IX — v99 deepening (2026-09-24): the child who forgets FASTER not just earlier, the rehearsal nobody taught yet, the script that eats the instance twice, the false memory that GROWS with age, the association that dies before the item, the positive filter, sleep's shrinking dividend, the bump a life change buys you, and the interference the old can't block

Part VIII priced the child's encode gates (self, recollection,
attention, source, bump sign) and the zombie intention. What was
still missing, in order of what the record asked for: (a) we priced
the childhood-amnesia CLIFF (§4.14 latent layer, amnesia_exit) but
never the childhood-amnesia SLOPE — Bauer & Larkina's prospective
work shows children lose autobiographical events at a higher RATE
than adults at every age tested, with the loss best fit by an
exponential (constant-rate) rather than the adult power function;
(b) §4.13 retell ecology assumed the character self-initiates
rehearsal — but spontaneous rehearsal is a STRATEGY that has to
develop (Flavell, Beach & Chinsky 1966; Keeney, Cannizzo & Flavell
1967: a production deficiency, not a mediation deficiency — the
5yo CAN rehearse when told to, she just never thinks of it);
(c) §4.20 script nodes treated the swallow as age-flat — Farrar &
Goodman's schema-confirmation-deployment work says the child arm
is where the swallow lives; (d) our false-memory family priced
age as protective — the DRM developmental reversal (Brainerd,
Reyna & Ceci 2008) says meaning-connected false memories INCREASE
from childhood to adulthood; (e) the old-age decline priced decay
globally, but the associative-deficit meta-analysis (Old &
Naveh-Benjamin 2008, 90 studies) says EDGES die faster than
items — the 75yo keeps the face and loses whose it is;
(f) positivity was priced at encode only (v1.6 `positivity_gain`)
— Reed, Chan & Mikels's 100-study meta puts a second leg at
retrieval sampling, gated by processing freedom; (g) sleep's
consolidation dividend had child knots but no old-side decay
(Mander, Winer & Walker 2017); (h) the bump was fixed at
encodeAge 15–25 — Schrauf & Rubin's immigrants show the bump
FOLLOWS the life transition, it isn't glued to the calendar;
(i) §4.2 interference had no age asymmetry — the Hasher–Zacks
line says the old suffer proactive interference the young filter
out; (j) procedural records shared the episodic decay engine —
Fleischman et al. say skills ride a flat floor.

## 98. Childhood forgetting is faster — `child_forget_mult(encodeAge)`

Bauer & Larkina 2014 (*Memory* 22:907 — verified: prospective,
children tracked 5→9, 5–7yos retained ≥60% of early-life events,
8–9yos <40% — the amnesia wall goes up IN childhood); Bauer &
Larkina 2013 (*JEP:G* 143:597 — verified: child distributions fit
exponential, adult fit power); Bauer & Larkina 2016 (*Memory* —
verified 4-year prospective: all child groups forget faster than
adults; 4–6yos faster than 8yos; differences largest in open-ended
recall).

**Mechanism:** records carry encodeAge; for encodeAge < 11 the
decay clock's exponent softens toward constant-rate:

```
beta_eff = beta · child_forget_mult(encodeAge)
child_forget_mult: 1.7@4 → 1.5@6 → 1.2@8 → 1.0@11
```

This is a legal β modulator under the §4.1 slope-invariance axiom's
age clause — it reads encodeAge (era), not E. The exponential-vs-
power distinction we approximate: constant-rate = higher effective
β on the early part of the curve, which the multiplier supplies.
Thematic coherence as a survival predictor (Bauer & Larkina 2016)
is already carried by `narr_coh_k`-adjacent retell weighting —
flagged, not re-priced.
**[CONSENSUS: children forget autobiographical events faster;
HYPOTHESIS: the β-multiplier form and knots]**

## 99. The rehearsal nobody taught yet — `rehearse_spont_p(encodeAge)`

Flavell, Beach & Chinsky 1966 (*Child Dev.* — verified: overt
verbalization rare at 5, common at 10); Keeney, Cannizzo & Flavell
1967 (*J. Exp. Psychol.* — verified: production deficiency —
induced rehearsal works but isn't spontaneously adopted); Cowan &
collab synthesis (cumulative rehearsal ~10); Elliott et al. 2021
(*RRR* multilab replication — verified: direction holds, more
5–6yo verbalizers than the original, continuous ramp 7→10 not
consistent → we take a ramp, not a cliff).

**Mechanism:** the §4.13 retell ecology's self-initiation draw is
gated:

```
retell_selfinit_p_eff = retell_selfinit_p · rehearse_spont_p(encodeAge)
rehearse_spont_p: 0.05@5 → 0.3@7 → 0.6@10 → 1.0@15
```

Other-initiated retells (parent retells the trip; teacher reviews;
a friend brings it up — the `scaffold` path) bypass the gate
entirely. **Locked `rehearse_scaffold_null`:** prompted/social
rehearsal of an encodeAge≤8 record yields ≥0.8 of adult-arm
refresh gain — the deficit is in PRODUCTION, never in benefit.
RW texture: the 6yo's day survives only in the retellings the
household does for her; the loner child's early years are the
thinnest archive in the cast.
**[CONSENSUS: production-deficiency account and the 5→10 ramp;
HYPOTHESIS: knot values]**

## 100. The script eats the instance twice — `script_swallow_child`

Nelson 1986 (event knowledge — the young child's autobiographical
system is script-first); Farrar & Goodman 1990/1992 (schema-
confirmation-deployment: children default-report the schema;
deviations encode only when salient — verified paradigm); Fivush
1984 (script reports at preschool age).

**Mechanism:** §4.20's script-node merge gains an encodeAge leg:

```
merge_rate_eff = merge_rate · (1 + (script_swallow_child − 1)
                                · child_gate(encodeAge))
child_gate: 1.0@≤6 → 0.5@8 → 0@11
script_swallow_child: 1.5
```

And the deviation arm: deviation records at encodeAge ≤8 get the
survival bonus ONLY when `selfRelevance ≥ dev_self_gate` (0.4) or
arousal ≥0.7 — the child remembers the birthday where SHE cried,
not the one where the cake was different. **[CONSENSUS: script
dominance in preschool reportage; HYPOTHESIS: the multiplier and
the self-relevance gate]**

## 101. The false memory that GROWS with age — `gist_false_p(encodeAge)`

Brainerd, Reyna & Ceci 2008 (*Psychol. Bull.* 134:343 — verified:
meaning-connected false memory increases childhood→adulthood);
Brainerd & Reyna 2007 (*Psychol. Sci.* — verified complementarity:
adults both falsely accept similar lures AND correctly reject
them more); Brainerd, Reyna & Forrest 2002 (*Child Dev.* —
verified: DRM near floor in young children — they fail to "get
the gist"); Metzger et al. 2008 (55-experiment developmental DRM
synthesis — verified increase).

**Mechanism:** the §6.3 misinformation/lure-adoption path splits
its susceptibility by lure type:

- `gist_false_p(encodeAge)`: 0.25@6 → 0.55@10 → 0.8@14 → 1.0 adult —
  applied to meaning-connected lures (paraphrases, inference
  completions, "she must have said…" reconstructions).
- Suggestion lures keep the existing child-elevated
  `misinfo_suscept` curve (both literatures are real — the split
  is BY LURE TYPE, which is the whole FTT point).
- Complementarity surface: the same gist maturity that mints the
  false acceptance also mints correct rejections of verbatim
  mismatches — implemented as `gist_false_p` entering ONLY when
  the lure shares gist (simOp ≥ `gist_lure_sim` 0.6), never when
  it is merely assertive.

The child is MORE wrong about what was suggested and LESS wrong
about what was implied — both directions must coexist or the
mechanism is wrong. **[CONSENSUS: the reversal is among the most
replicated counterintuitive results in the literature; the simOp
gate is our operationalization]**

## 102. The association dies before the item — `assoc_mult(age_eff)`

Naveh-Benjamin 2000 (*JEP:LMC* 26:1170 — verified ADH: components
memorized, bindings weak); Old & Naveh-Benjamin 2008 (*Psychol.
Aging* 23:104 — verified meta, 90 studies: age deficit LARGER for
associative than item across source/context/order/location/
pairing; pronounced under intentional encoding, attenuated
incidental); Spencer & Raz 1995 (context>content — already
priced via `ctx_loss`; this is the GENERALIZATION to all edge
classes).

**Mechanism:** edge and binding fields (who-was-there links,
source tags, place bindings, pairings, order marks) decay under
an age-leg multiplier that item/content fields never see:

```
edge_decay_mult = assoc_mult(age_eff)
assoc_mult: 1.0@50 → 1.2@60 → 1.4@70 → 1.7@85
```

**Locked `assoc_item_null`:** `assoc_mult` may never touch
item/content strength — a profile that loses the binding and the
item at the same rate is a broken profile (the meta's core
result is the DIFFERENTIAL, not the level). RW texture: the 78yo
landlord knows the tenant's face, knows she knows her, cannot
attach the name or the floor — the record survives, its edges
don't. **[CONSENSUS: the differential; HYPOTHESIS: knots and the
edge-class list]**

## 103. The positive filter — `pos_retrieve_bias(age_eff)`

Mather & Carstensen 2005 (*TiCS* — verified mechanism claim:
emotion-regulation goal, control-dependent); Reed, Chan & Mikels
2014 (*Psychol. Aging* meta, 100 studies, N=7129 — verified:
overall d_PE≈0.26 reliable; older adults +bias d≈0.13, younger
NEGATIVE bias d≈−0.12; effect LARGER when processing is
unconstrained — naturalistic sampling, not interrogation);
Murphy & Isaacowitz 2008 (attention meta — same gate).

**Mechanism:** voluntary-recall candidate sampling (§5.x weight
draw) adds a valence term:

```
sample_w ∝ base_w · (1 + pos_retrieve_bias(age_eff) · valence
                       · free_recall_gate)
pos_retrieve_bias: 0@40 → 0.10@60 → 0.20@70 → 0.30@85
free_recall_gate = 1 − eval_press   // interrogation kills it
```

Distinct from v1.6 `positivity_gain` (encode/select leg) — this is
the retrieval-sampling leg the meta's "unconstrained processing"
moderator demands. `eval_press` (v5.39 state field) is the lawful
gate: a character being grilled by another character loses the
bias. **Locked `pos_involuntary_null`:** the §5.7 involuntary scan
and cue-driven recall never carry the valence term — the meta's
effect lives in deliberate, self-directed remembering.
**[CONSENSUS: reliable small effect, unconstrained-only;
DEBATED: SST-motivational vs capacity accounts — we price the
observable and stay neutral on mechanism]**

## 104. Sleep's shrinking dividend — `sws_mult` old knots + `sws_var_gain`

Mander, Winer & Walker 2017 (*Neuron* — verified: SWS and its
memory-consolidation dividend decline with age; ~60–70% SWS loss
by old age in the extremes); Spencer, Gouw & Ivry 2007; Backhaus
et al. 2008 (child nap benefit — already priced §4.15); Mander et
al. 2013 (*Nat. Neurosci.* — verified: medial-PFC gray-matter loss
predicts SWS loss predicts overnight retention loss).

**Mechanism:** existing `sws_mult` (child knots 1.2@6 → 1.0@14,
v1.5) extends old-side:

```
sws_mult: 1.0@50 → 0.85@65 → 0.7@80 → 0.6@90   (age_eff)
sws_var_gain: 0.15 — per-night jitter on the sleep multiplier,
              scaling ×(age_eff/80) — old sleep is noisier night
              to night, so the dividend is a lottery, not a floor
```

A bad night at 78 costs more than a bad night at 28 because the
good nights were doing more work. **[CONSENSUS: SWS decline and
its memory correlate; HYPOTHESIS: knots and the jitter term]**

## 105. The bump a life change buys you — `trans_bump`

Schrauf & Rubin 1998 (*JML* 39:437 — verified: bilingual
immigrants' bump follows age of immigration, not 15–25; internal-
language split on the recalled subset); Schrauf & Rubin 2001
(*Appl. Cogn. Psychol.* — verified: recall increase tracks
immigration age groups 20–22/24–28/34–35); Enz, Pillemer &
Johnson 2016 ("relocation bump" — verified: ~40% of move-window
memories cluster at the relocation); Berntsen & Rubin 2004
(cultural life script — the default window when no transition).

**Mechanism:** a `life_transition` event (world-supplied flag:
migration, career change, bereavement, relocation; `immig_age`
trait auto-mints one) opens a window:

```
trans_bump: encode gain trans_bump_gain (0.25) on selfRelevant
            records for [t_transition, t_transition + trans_bump_win]
            where trans_bump_win = 3y, applied REGARDLESS of age
trans_pi_relief: 0.2 — interference relief at the stable end of
            the window (the "release from proactive interference"
            mechanism Schrauf & Rubin propose: the new life's
            early records compete with the old life's, and the
            settled era that follows rehearses the window)
```

The bump is where the self is being rebuilt, and a move rebuilds
the self at 35 as surely as adolescence does at 16 — the calendar
version is just the modal transition. **[CONSENSUS: migration
shifts the bump; HYPOTHESIS: generalizing the flag to non-
migration transitions and the PI-relief form]**

## 106. The interference the old can't block — `pi_suscept(age_now)`

Hasher & Zacks 1988 (inhibitory-deficit framework); Lustig, May &
Hasher 2001 (*Psychol. Sci.* — verified: PI susceptibility
elevated in older adults); Ikier & Hasher 2006; child side: the
developmental-interference literature (Dempster; Bjorklund &
Harnishfeger — inefficient inhibition in children, CONSENSUS on
direction, thin on coefficients).

**Mechanism:** §4.2's interference term gains an age leg evaluated
at the record-ENCODER's current age (interference is a live
processing failure, so age_now — not encodeAge):

```
interference_eff = interference · pi_suscept(age_now)
pi_suscept: 1.3@6 → 1.0@15 → 1.0@45 → 1.25@60 → 1.5@80
```

Two ends, one cause in the model (inhibitory gate thinness),
different literatures. This is also the cheap engine behind the
mislaid-item PI burial (FC§41.5): the old character's keys are
buried under every previous place the keys have ever been —
and now the burial rate is age-graded. **[CONSENSUS: elevated PI
in aging; DEBATED-magnitude in childhood → child knots carry a
wider probe tolerance]**

## 107. The procedural floor — `proc_decay_mult`

Fleischman et al. 2004 (procedural/skills preserved in aging —
verified direction across motor/cognitive skill retention);
Gabrieli 1998 (implicit memory intact in aging and even in
amnesia); childhood: motor-skill acquisition robust from infancy
(Adolph).

**Mechanism:** procedural-class records (skill, route, recipe,
craft) decay under `proc_decay_mult` 0.3 applied to β — flat,
age-insensitive, exempt from `assoc_mult` (skills bind nothing —
they ARE the binding) and from `pi_suscept` (interference hits
declarative retrieval; the hands don't confuse two ways of
kneading). **Frozen `proc_flat_null`:** no age curve on this
param — a procedural decline leg would double-count the motor
decline the world already renders in the body.
**[CONSENSUS: procedural preservation is among the strongest
aging regularities; the 0.3 coefficient is ours]**

## 108. Knot-table revision summary (v5.47)

| param | knots | source |
|---|---|---|
| child_forget_mult | 1.7@4 → 1.5@6 → 1.2@8 → 1.0@11 (encodeAge, on β) | Bauer & Larkina 2014/2016 |
| rehearse_spont_p | 0.05@5 → 0.3@7 → 0.6@10 → 1.0@15 (encodeAge, on retell self-init) | Flavell 1966; Keeney 1967; Elliott 2021 |
| script_swallow_child | 1.5 flat × child_gate(≤6 1.0 → 8 0.5 → 11 0) | Farrar & Goodman 1990; Nelson 1986 |
| dev_self_gate | 0.4 selfRelevance floor for child deviation survival | Farrar & Goodman (HYPOTHESIS pricing) |
| gist_false_p | 0.25@6 → 0.55@10 → 0.8@14 → 1.0 adult (encodeAge) | Brainerd, Reyna & Ceci 2008 |
| gist_lure_sim | 0.6 simOp floor for the gist-lure class | operationalization, ours |
| assoc_mult | 1.0@50 → 1.2@60 → 1.4@70 → 1.7@85 (age_eff, edges only) | Naveh-Benjamin 2000; Old & N-B 2008 |
| pos_retrieve_bias | 0@40 → 0.10@60 → 0.20@70 → 0.30@85 (age_eff) | Reed, Chan & Mikels 2014 |
| sws_mult | +0.85@65 → 0.7@80 → 0.6@90 old-side knots | Mander, Winer & Walker 2017 |
| sws_var_gain | 0.15 ×(age_eff/80) | HYPOTHESIS |
| trans_bump_gain / _win / pi_relief | 0.25 / 3y / 0.2 | Schrauf & Rubin 1998/2001; Enz 2016 |
| pi_suscept | 1.3@6 → 1.0@15 → 1.0@45 → 1.25@60 → 1.5@80 (age_now) | Lustig, May & Hasher 2001 |
| proc_decay_mult | 0.3 flat, no age leg | Fleischman 2004; Gabrieli 1998 |

## 109. Spec changes (v5.46 → v5.47) — delta table

| change | where | type |
|---|---|---|
| `child_forget_mult(encodeAge)` on β | §4.48 | knot |
| `rehearse_spont_p` gate on §4.13 self-init | §5.103 | knot + gate |
| `script_swallow_child` + `dev_self_gate` on §4.20 | §4.49 | knot |
| `gist_false_p` lure-type split in §6.3 | §6.3 note | knot + class |
| `assoc_mult(age_eff)` on edge fields | §4.50 | knot + locked `assoc_item_null` |
| `pos_retrieve_bias` + `free_recall_gate` on sampling | §5.104 | knot + locked `pos_involuntary_null` |
| `sws_mult` old knots + `sws_var_gain` | §4.51 | knot + scalar |
| `trans_bump` window + `trans_pi_relief` | §4.52 | mechanism + flag |
| `pi_suscept(age_now)` on §4.2 | §4.53 | knot |
| `proc_decay_mult` flat + frozen `proc_flat_null` | §4.54 | scalar + frozen |
| locked: `rehearse_scaffold_null` | §5.103 | null |

## 110. Validation probes (P1045–P1054; registry continues P1–P1044)

- **P1045 child forgetting rate (MUST):** matched-E events at
  encodeAge 5/8/12 vs adult lose strength in the ordering
  5>8>12>adult at fixed retention intervals; child-era loss fits
  constant-rate better than the adult-era power fit (fit-shape
  check, tolerance: ordering strict, magnitudes ±25%).
- **P1046 rehearsal ramp (MUST):** self-initiated retell count
  at age_now 5 ≤10% of adult arm at matched record stats;
  other-initiated retells at 5 produce ≥0.8× adult refresh
  (`rehearse_scaffold_null` locked-null class).
- **P1047 script swallow (SHOULD):** routine-instance records
  at encodeAge≤7 merge into script nodes ≥1.4× adult rate;
  deviation records survive iff selfRelevant ≥ dev_self_gate —
  the two-arm structure is the test, not the level.
- **P1048 developmental reversal (MUST, two-sign):** gist-
  connected lure adoption rises from encodeAge 6→adult while
  assertive/suggestion lure adoption falls across the same
  range — OPPOSITE signs on one battery or the mechanism is
  wrong (this is the complementarity the meta requires).
- **P1049 assoc differential (MUST):** at age_eff≥70 edge-field
  loss ≥1.4× content-field loss on matched records;
  `assoc_item_null` structure-checked (item curve untouched by
  the param).
- **P1050 positivity gate (SHOULD):** free-recall valence skew
  shifts net-positive past age_eff 60 and net-negative below 40
  (sign flip, per the meta's two-sided result); under
  `eval_press≥0.6` and on the involuntary scan the skew
  collapses to baseline (`pos_involuntary_null`).
- **P1051 sleep dividend (SHOULD):** overnight consolidation
  benefit orders child > adult > 80yo at matched encodes;
  `sws_var_gain` widens the old arm's variance, not its mean
  beyond the knots.
- **P1052 transition bump (SHOULD):** era histogram of a
  `life_transition`-flagged profile shows a secondary peak at
  transition_age+0..win; unflagged control shows none;
  `immig_age`-pinned profiles auto-show the peak at that age.
- **P1053 PI susceptibility (MUST):** competing-event density
  batteries (N similar events same week) show R-loss ratio
  80yo/mid-adult ≥1.3; child arm ≥1.1 with ±40% tolerance.
- **P1054 procedural floor (COULD):** procedural records lose
  ≤30% of episodic loss rate at every age knot; adding any age
  leg to `proc_decay_mult` must FAIL the frozen check.

## 111. Honest limits, ninth pass

- `child_forget_mult` prices a RATE difference whose mechanism
  (failed consolidation vs retrieval-side immaturity) Bauer
  herself declines to settle — we chose the decay-side pricing
  because the sim already owns β; a consolidation-side version
  would reach the same observable through S. Either is
  defensible; the probe checks the observable only.
- `rehearse_spont_p`'s 1.0@15 adult-arity endpoint extrapolates
  free-recall strategy findings to the autobiographical retell
  ecology — lab list-rehearsal and dinner-table retelling are
  different beasts; the production-deficiency lock (the scaffold
  arm) is the part the literature actually proves.
- `script_swallow_child` rides the §4.20 merge machinery, which
  already conflates storage-merge with report-default; Farrar &
  Goodman's deployment account is a REPORT mechanism — our
  pricing lets a merged instance still carry a low-strength
  verbatim ghost, which is closer to the truth than pure
  deletion but is our construction.
- `gist_false_p`'s simOp gate operationalizes "meaning-connected"
  as similarity ≥0.6 — FTT never gave a threshold; the class
  split (gist lures up, suggestion lures down, same age range)
  is the consensus content; the number is ours.
- `assoc_mult` inherits ADH's boundary disputes: the meta's own
  moderators (intentional vs incidental, test format) mean the
  differential is context-dependent — we price the main effect
  and let the incidental-encoding attenuation stay unmodeled
  (a second-order term).
- `pos_retrieve_bias` is DEBATED at the mechanism level (SST's
  motivated account vs the cognitive-control-deficit account —
  which predict the same observable under free recall and
  diverge only under cognitive load; our `eval_press` gate
  picks the motivated account's prediction as the working one).
- `trans_bump` generalizes the migration finding to all flagged
  transitions — the relocation replication (Enz 2016) supports
  the generalization for moves; bereavement/divorce are our
  extension. The window length (3y) and gain are fitted.
- `pi_suscept`'s child knots are the weakest in this version —
  the developmental-PI literature is real but coefficient-thin;
  the probe tolerance reflects that honestly.
- `proc_decay_mult` 0.3 is a placeholder coefficient for a
  CONSENSUS direction — procedural aging studies measure
  performance, not trace decay, so the mapping is loose.

---

# Part X — v111 deepening (2026-09-24): the edges the old mint by accident, the binding the child never made, the nap the record needs, the clock the profile runs on, the categories that blur, the verbatim trace that dies first, the slope education buys, the partner who remembers for you, the familiarity that pretends to be a memory, and the forgetting the old can't intend

Part IX priced the child's faster forgetting, the strategy
that isn't deployed, the script swallow, the reversal,
associative aging, positivity at retrieval, sleep's
declining dividend, the mobile bump, interference
susceptibility, and the procedural floor. Ten gaps remain,
in the order the engine asked for them: (a) the associative
deficit has a COUNTERPART the spec never priced — older
adults don't just lose edges, they mint SPURIOUS ones
between co-present irrelevancies (Campbell, Hasher & Thomas
2010); (b) the ADH was priced old-side only — binding is a
DEVELOPMENTAL skill too, lagging item memory until ~10
(Sluzenski, Newcombe & Kovacs 2006); (c) infant
consolidation had no gate — Seehagen et al. 2015 show the
record DIES without a nap inside 4h; (d) no circadian
synchrony — the chronotype shifts across the lifespan and
off-peak encoding costs the old double (May, Hasher &
Stoltzfus 1993); (e) old-age dedifferentiation coarsens the
similarity space itself — category confusion is a simOp
parameter, not a bug (Park et al. 2004); (f) FTT's dual
traces were priced only via lures — the verbatim trace's
faster decay is its own half-life term (Brainerd & Reyna);
(g) profiles had no cognitive-reserve dial — education
shifts WHEN decline starts, not whether (Stern 2002,
DEBATED); (h) retrieval was solo — long-shared dyads
cross-cue and partly escape collaborative inhibition
(Harris et al. 2011); (i) the recollection/familiarity
dissociation's OLD arm was unpriced — familiarity survives
and is over-trusted (Jennings & Jacoby 1997); (j) the
child's directed-forgetting asymmetry (§76) has an old-side
mirror — the old can't intend to forget (Titz & Verhaeghen
2010).

## 112. The edges the old mint by accident — `hyperbind_*`

Campbell, Hasher & Thomas 2010 (*Psychol. Sci.* 21:399 —
verified: 1-back on pictures superimposed with irrelevant
words; older adults bound distractor↔target — later paired-
associate advantage for preserved pairs, DISADVANTAGE for
repaired; young showed neither); Campbell, Hasher & Thomas
2012 (*Psychol. Aging* 27:1 — verified boundary: implicit
test only; older adults aware of the link lose the effect;
young never hyper-bind); Kim, Hasher & Zacks 2007; Rowe et
al. 2006 (distractor encoding under reduced inhibition).

**Mechanism:** at encode, for each content field the event
carries ambient co-occurring items (the word on the poster
behind the speaker; the song under the conversation). Old-
age inhibition failure mints edges it shouldn't:

```
P(spurious edge minted to ambient item) = hyperbind_p(age_eff)
hyperbind_p: 0.02@30 → 0.05@55 → 0.15@65 → 0.30@75 → 0.40@85
edge tagged `ambient:true`, minted at hyperbind_str (0.35×E)
```

Two consequences emerge for free: (1) ambient items become
weak retrieval cues — the 75yo "remembers" the neighbor's
radio song when recalling the talk (veridical co-occurrence,
genuinely useful — hyper-binding's adaptive side);
(2) cross-event source leakage — the ambient edge's target
field inherits the wrong event's context. **Locked
`hyperbind_aware_null`:** when the encoder is informed the
ambient stream is relevant (explicit instruction, `attn:
ambient` flag), hyper-bind minting falls to the young rate
— the phenomenon is implicit-only (2012 replication), so
the param prices a failure of suppression, not a strategy.
**[CONSENSUS: older adults hyper-bind co-occurrences under
implicit conditions; HYPOTHESIS: edge-pricing and knots]**

## 113. The binding the child never made — `bind_dev_mult(encodeAge)`

Sluzenski, Newcombe & Kovacs 2006 (*J. Exp. Child Psychol.*
93:193 — verified: 4/6/8yo item memory near-adult, bound-
pair memory still developing at 8); Newcombe, Lloyd &
Ratliff 2007 (review — relational binding matures through
childhood, hippocampal-dependent); Ngo, Newcombe & Olson
2018 (*Child Dev.* — verified: binding gains persist to ~10
under incidental encoding; intentional narrows but does not
close the gap); Bunge group imaging work (Ofen et al. 2007
— encoding activation for later-remembered items mature by
~8, bound details lagging).

**Mechanism:** §4's edge-mint E gains an encodeAge leg —
the developmental MIRROR of `assoc_mult(age_eff)`:

```
edge_E_eff = edge_E · bind_dev_mult(encodeAge)
bind_dev_mult: 0.4@4 → 0.55@6 → 0.75@8 → 0.9@10 → 1.0@13
```

Content fields mint near-adult-rate even at 4 — the 6yo
remembers WHO and WHAT but loses who-said-it and which-
coat-went-with-which-day. Combines multiplicatively with
§98's `child_forget_mult` (fewer edges AND faster loss):
child records are sparse in the relational lattice long
before they're sparse in content. Under the life-narrative
append, thin early edges are why the young child's
autobiography is a bag of snapshots, not a story.
**[CONSENSUS: relational/binding memory lags item memory
through childhood; HYPOTHESIS: knots and the multiplicative
stack with child_forget_mult]**

## 114. The nap the record needs — `nap_*`

Seehagen, Konrad, Herbert & Schneider 2015 (*PNAS*
112:1625 — verified: 6- and 12-mo-olds, deferred imitation;
only infants napping ≥30min within 4h of encoding retained
at 4h AND 24h — no-nap arms at chance); Konrad, Seehagen,
Schneider & Herbert 2016 (*Neurobiol. Learn. Mem.* — nap-
dependent consolidation across 15–24mo); Friedrich,
Wilhelm, Born & Friederici 2015 (*Nat. Commun.* — verified:
infant sleep generalizes — nap sleep builds semantic
categories from exemplars).

**Mechanism:** encodeAge < 2 records carry a consolidation
gate on the §4.x sleep pass:

```
if record.encodeAge < nap_req_age (2y):
    consolidated iff sleep episode ≥ nap_min (30 sim-min)
    begins within nap_win (4h) of encoding
    else: record pinned at S ≤ nap_cap (0.15) — retrievable
    only same-day, dies at next sleep regardless
```

The gate LOOSENS with age (HYPOTHESIS knots — literature
bounds it below 2; the fade is ours):

```
nap_req_soft: hard@<1.5 → nap-win 8h@2 → nap-win 24h@4 →
  adult sleep-pass@6
```

RW texture: the toddler's day is written during the nap
that follows it; a skipped-nap afternoon is genuinely
unrecoverable, not just degraded. Locked `nap_cont_null`:
the gate applies to episodic/procedural consolidation —
semantics mint during sleep itself (Friedrich: the nap is
where the category forms).
**[CONSENSUS: infant declarative retention is nap-gated
inside ~4h; HYPOTHESIS: the softening ramp 2→6]**

## 115. The clock the profile runs on — `sync_*`

May, Hasher & Stoltzfus 1993 (*Psychol. Sci.* 4:326 —
verified synchrony effect: recognition better at optimal
vs non-optimal time-of-day, asymmetry old >> young); May &
Hasher 1998 (*Psychol. Sci.* 9:20 — synchrony on
comprehension/prose memory); Yoon, May & Hasher 1999 (in
Hasher, Goldstein & May volume — older adults evening-
tested show younger-pattern false memories); Intons-Peterson
et al. 1998 (synchrony × age on free recall); May 1999
(morning-shift toward morningness with age — MEQ
distribution skews, verified).

**Mechanism:** each profile carries `chronotype` ∈ [0,1]
(morningness), drifting with age:

```
chronotype_eff = chronotype_0 + chron_age_shift·(age_now−20)/60
chron_age_shift: +0.4   // adolescents drift EVENING first:
chron_ado_dip: −0.25·bump(age_now, center 17, width 6)
```

Encode and voluntary retrieval carry a synchrony
multiplier:

```
sync_mis = |hour_now − peak_hour(chronotype_eff)| / 12
E_eff  *= 1 − sync_pen_enc·sync_mis·(1 + sync_age_amp·max(0,age_now−50)/35)
drive *= 1 − sync_pen_ret·sync_mis·(same age leg)
sync_pen_enc 0.10, sync_pen_ret 0.15, sync_age_amp 1.0
```

—the asymmetry: the young pay a little off-peak, the old
pay double. PM probe: evening-scheduled intentions at
age_eff ≥65 lose `sync_pm_pen` (0.15) extra — the old
executive's evening is when lapses cluster.
**[CONSENSUS: synchrony effect with age-asymmetric cost;
HYPOTHESIS: magnitude and the adolescent evening dip]**

## 116. The categories that blur — `dediff_*`

Park, Polk, Park, Minear, Savage & Smith 2004 (*Psychol.
Aging* 19:100 — verified: ventral visual category
selectivity declines with age — dedifferentiation, not just
atrophy); Baltes & Lindenberger 1997 (common-cause:
sensory↔cognitive correlations strengthen with age —
general dedifferentiation); Koen & Rugg 2019 (*TiCS* 22:545
— verified review: neural dedifferentiation tracks memory
aging; DEBATED boundary — how much is specific to memory
vs general processing); Park et al. 2002; Casaletto et al.
(gist-level processing biases with age).

**Mechanism:** simOp's field masks coarsen with age —
categories the young keep distinct start overlapping:

```
simOp_eff uses mask granularity g(age_eff):
g: 1.0@40 → 0.9@60 → 0.8@75 → 0.7@90
cross-category pair similarity floor rises:
  dediff_floor = dediff_w·(1 − g)   // dediff_w 0.15
```

Consequences inside existing operators: `merge_thresh` is
met sooner by same-CATEGORY-but-wrong-ITEM pairs at old
knots (the 80yo merges two different dentists' visits the
young keep separate); §6 gist-lure acceptance already rides
simOp — dediff raises it for semantic-neighbor lures. The
record keeps its fields; the SPACE between records
compresses. **Locked `dediff_item_null`:** dedifferentiation
never lowers WITHIN-record field fidelity — it raises
between-record similarity; an old record's own content
decays on its own clocks, unchanged.
**[CONSENSUS: age-related neural dedifferentiation;
HYPOTHESIS: pricing it as mask-granularity on simOp]**

## 117. The verbatim trace dies first — `verb_hl_mult(encodeAge)`

Brainerd & Reyna 1995 (*Dev. Psychol.* 31:467 — FTT:
verbatim and gist are independent traces, verbatim decays
faster); Reyna & Brainerd 1998; Brainerd, Reyna & Ceci 2008
(the reversal's substrate — §101 priced the gist LURE; this
prices the verbatim TRACE half-life); Brainerd, Reyna &
Howe 2009 (verbatim trace in young children is measurable
in days-to-weeks, not months); Marche & Brainerd 2012.

**Mechanism:** records already split fields by verbatim/
gist class (§6.3). The verbatim class's half-life gets an
encodeAge leg beyond the flat `k_verbatim`:

```
hl_verbatim_eff = hl_verbatim · verb_hl_mult(encodeAge)
verb_hl_mult: 0.25@5 → 0.4@8 → 0.6@12 → 0.8@16 → 1.0 adult
```

The child's exact wording is gone in days while the gist
survives for years — matching §100's script swallow
(mechanism AND report asymmetry now agree: the child
reports gist because verbatim is structurally gone, not
only because the script dominates). Also supplies the
missing storage leg for §117-adjacent FOK: gist survives,
verbatim gone → "I know WHAT happened, not the words."
**[CONSENSUS: verbatim decays faster than gist; child
verbatim especially ephemeral; HYPOTHESIS: knot values]**

## 118. The slope education buys — `reserve_*`

Stern 2002 (*JINS* 8:448 — cognitive reserve framework:
matched pathology, different clinical expression);
Tucker & Stern 2011 (*NeuroRehabilitation* — reserve
moderates onset more than slope); Zahodne, Glymour, Sparks
et al. 2011 (*Neurology* — verified counter: high-education
declines FASTER post-onset — delayed start, compressed
fall); Stern, Albert, Tang & Tsai 1999 (education delays
clinical diagnosis ~years); Opdebeeck, Martyr & Clare 2016
(*BMC Med.* meta — reserve→incidence real, slope
inconsistent — DEBATED).

**Mechanism:** profiles carry `reserve` ∈ [0,1] (education
+ occupational complexity proxy, set at profile mint —
world-builder supplies). It acts on `age_eff` ONLY:

```
age_eff_enc = age_now − reserve_delay·reserve   // delay 6y
decline-mapped params see age_eff_enc for the OLD-SIDE
knots only (≥50); child/adolescent legs unchanged
post_onset: beyond reserve_cliff (75 + 6·reserve):
  slope_mult = 1 + reserve_steep·reserve        // 0.4
```

Stern/Tucker's delay plus Zahodne's compression: the
professor at 82 remembers like a 76yo until ~81, then loses
faster than peers — reserve rents time, it doesn't repeal
it. **Locked `reserve_skill_null`:** reserve never enters
childhood legs or skill fields — it is a decline-phase
modulator only.
**[CONSENSUS: reserve proxies shift clinical onset;
DEBATED: slope shape (delay-only vs compressive) — we
price the compressive version, flagged; HYPOTHESIS: 6y/0.4]**

## 119. The partner who remembers for you — `crosscue_*`

Wegner 1987 (transactive memory — the directory, not the
content, is shared); Weldon & Bellinger 1997 (*JEP:LMC*
23:1160 — verified collaborative inhibition: nominal >
collaborative group recall, disruption of idiosyncratic
organization); Harris, Keil, Sutton, Barnier & McIlwain
2011 (*Mem. Stud.* 4:267 — verified: long-married OLDER
couples with shared semantic knowledge can EXCEED nominal
dyad on expertise-shared tasks — cross-cueing escapes the
inhibition); Johansson, Andersson & Rönnberg 2000; Barnier,
Sutton, Harris & Wilson 2008 (transactive benefits grow
with relationship history and intimacy).

**Mechanism:** `discussEvent`/`remind` between two
characters gains a shared-history leg:

```
crosscue_gain = crosscue_w·min(1, shared_years/15)·intimacy
crosscue_w 0.3 — partner's cue carries shared-context mass
  a stranger's cannot (the half-phrase that names the trip)
collab_inhib: 0.10 flat ×(1 − transact_years_gain·shared_years/15)
  transact_years_gain 0.8 — the 40-year couple's
  collaborative loss shrinks toward zero and cross-cues
  can net-positive on shared-expertise topics
```

Emergent texture: the widower's memory objectively degrades
when the transactive partner dies — a real, priced grief
channel that isn't sadness (`grief_*` untouched). Child
arm: young children + parent pairs get `crosscue_w` at
half-rate — the parent IS the child's external memory
(§80's `reminiscence_env` already carries the development
side; this carries the retrieval side).
**[CONSENSUS: collaborative inhibition and transactive
benefit-with-shared-history; HYPOTHESIS: the years-scaled
parametrization]**

## 120. The familiarity that pretends to be a memory — `fam_rely_*`

Jennings & Jacoby 1997 (*Mem. Cognit.* 25:352 — verified:
older adults rely MORE on familiarity in recognition —
Jacoby's opposition logic); Prull, Dawes, Martin, Rosenberg
& Light 2006 (*Psychol. Bull.* 132:539 — verified meta:
recollection declines steeply with age, familiarity ~flat
to ~60s, shallow decline after); Yonelinas 2002 (dual-
process: familiarity is the preserved process); Jacoby
1999 (familiarity + no recollection → "false fame"/waking
errors); Mantyla 1993 (remember/know: K-responses inflated
in old adults).

**Mechanism:** §5's emit path carries a recollection-vs-
familiarity mix on `epist` (§5.114). Old profiles
substitute familiarity for failed recollection:

```
fam_rely = fam_rely_gain·max(0, age_eff−50)/35   // 0.4
R→K conversion: emitted "know" record with fam ≥ fam_floor
  gets +fam_rely·(1−conf) confidence lift and is reported
  as if remembered — source-attribution error probability
  += fam_rely·err_k
```

**Locked `fam_age_null`:** baseline familiarity STRENGTH is
age-flat below 80 (Prull meta's shallow slope lives in
80+) — what changes is RELIANCE, not the signal. This is
the retrieval-side substrate of §6.x's old-age misinfo
reversal: the 75yo doesn't feel the rumor more strongly —
she TRUSTS the feeling she has.
**[CONSENSUS: recollection declines, familiarity preserved
→ reliance shift; HYPOTHESIS: the confidence-lift pricing]**

## 121. The forgetting the old can't intend — `df_old_leak`

Titz & Verhaeghen 2010 (*Psychol. Aging* 25:431 — verified
meta: item-method directed forgetting largely INTACT in
old age; list-method impaired — the old can't drop the
to-be-forgotten set once it's in); Zacks, Radvansky &
Hasher 1996 (suppression failure); Zellner & Bäuml 2006
(list-method DF requires executive control the decline
costs); complement to §76's child asymmetry (children
report-forget, can't suppress) — the old CAN'T forget the
list, but item-level "forget that" still works.

**Mechanism:** §4.x suppression/`forget_intent` gains a
method-dependent old leg:

```
item-method (per-record forget_intent): unchanged — intact
list-method (class/context-range forget):
  suppressed drive leaks back:
  leak = df_old_leak·max(0, age_eff−55)/30    // 0.5
  effective suppression S_eff = S·(1 − leak)
```

The 70yo told "don't think about the argument" thinks about
it — not more often, but the suppression never reaches the
young depth; intrusive re-entry rides the leak. Probe
requirement: item-method null must hold or the param is
misplaced (the failure is CONTROL, not the brake).
**[CONSENSUS: list-method DF impaired, item-method spared
in aging; HYPOTHESIS: leak coefficient]**

## 122. Knot-table revision summary (v5.59)

| param | knots | source |
|---|---|---|
| hyperbind_p | 0.02@30 → 0.05@55 → 0.15@65 → 0.30@75 → 0.40@85 (age_eff) | Campbell, Hasher & Thomas 2010 |
| hyperbind_str | 0.35×E on ambient edges | HYPOTHESIS |
| bind_dev_mult | 0.4@4 → 0.55@6 → 0.75@8 → 0.9@10 → 1.0@13 (encodeAge, edges) | Sluzenski et al. 2006; Ngo et al. 2018 |
| nap_req_age / nap_win / nap_min / nap_cap | 2y / 4h / 30min / 0.15 | Seehagen et al. 2015 |
| nap_req_soft | hard@<1.5 → 8h@2 → 24h@4 → adult@6 | HYPOTHESIS ramp |
| chron_age_shift / chron_ado_dip | +0.4 over 60y / −0.25@17 | May 1999; Carskadon |
| sync_pen_enc / sync_pen_ret / sync_age_amp / sync_pm_pen | 0.10 / 0.15 / 1.0 / 0.15 | May, Hasher & Stoltzfus 1993 |
| dediff_w | 0.15 ×(1−g), g: 1.0@40 → 0.7@90 | Park et al. 2004; Koen & Rugg 2019 |
| verb_hl_mult | 0.25@5 → 0.4@8 → 0.6@12 → 0.8@16 → 1.0 (encodeAge) | Brainerd & Reyna 1995 |
| reserve_delay / reserve_steep / reserve_cliff | 6y / 0.4 / 75+6·reserve | Stern 2002; Zahodne 2011 (DEBATED) |
| crosscue_w / collab_inhib / transact_years_gain | 0.3 / 0.10 / 0.8 (÷15y, ×intimacy) | Weldon & Bellinger 1997; Harris et al. 2011 |
| fam_rely_gain / fam_floor / err_k | 0.4 / 0.5 / 0.3 (age_eff>50) | Jennings & Jacoby 1997; Prull 2006 |
| df_old_leak | 0.5 ×max(0,age_eff−55)/30, list-method only | Titz & Verhaeghen 2010 |

## 123. Spec changes (v5.58 → v5.59) — delta table

| change | where | type |
|---|---|---|
| `hyperbind_*` ambient-edge minting | §4.64 | mechanism + locked `hyperbind_aware_null` |
| `bind_dev_mult(encodeAge)` on edge E | §4.65 | knot |
| `nap_*` consolidation gate <2y + softening | §4.66 | gate + locked `nap_cont_null` |
| `sync_*` chronotype drift + synchrony penalty | §4.67 | mechanism + knots |
| `verb_hl_mult(encodeAge)` on verbatim fields | §4.68 | knot |
| `reserve_*` on old-side age_eff + post-onset slope | §4.69 | scalar + locked `reserve_skill_null` |
| `crosscue_*` + `collab_inhib` on dyadic recall | §5.121 | mechanism |
| `fam_rely_*` R→K substitution | §5.122 | mechanism + locked `fam_age_null` |
| `df_old_leak` list-method suppression leak | §5.123 | scalar + method split |
| `dediff_*` mask granularity on simOp | §6.281 | mechanism + locked `dediff_item_null` |

## 124. Validation probes (P1176–P1185; registry continues P1–P1175)

- **P1176 hyper-binding (MUST):** distractor-cooccurrence
  batteries mint `ambient:true` edges at ≥3× young rate at
  age_eff≥70; edges act as weak cues AND source-leak
  channels; `hyperbind_aware_null` checked — `attn:ambient`
  collapses the differential to ≤1.2×.
- **P1177 binding lag (MUST):** encodeAge-graded pairs
  (item vs bound-pair) show item recall adult-flat by 6
  while pair recall still <0.75 adult at 8 — the DISSOCIATION
  is the test.
- **P1178 nap gate (MUST):** encodeAge<2 records with no
  qualifying nap in `nap_win` never exceed `nap_cap`;
  identical records with nap consolidate normally;
  `nap_cont_null` — semantic class unaffected.
- **P1179 synchrony asymmetry (SHOULD):** off-peak encode/
  retrieval cost at 70 ≥2× the young cost at matched
  `sync_mis`; adolescent arm peaks EVENING (sign check on
  `chron_ado_dip`).
- **P1180 dediff merge (MUST):** same-category/different-
  item record pairs at age_eff≥80 merge ≥1.5× the 40yo rate;
  within-record fidelity unchanged (`dediff_item_null`).
- **P1181 verbatim-gist split (MUST):** verbatim-class
  field loss at encodeAge 5 ≥2× the adult verbatim rate at
  fixed interval while gist-class fields match adult within
  ±25% — the two traces must dissociate, not both decay.
- **P1182 reserve shape (SHOULD):** reserve=1 profiles at
  75 perform ≤6y-equivalent better than reserve=0;
  reserve=1 profiles at 85 decline steeper post-`reserve_cliff`
  (the Zahodne leg — compressive, not protective);
  `reserve_skill_null` boundary-checked.
- **P1183 transactive dyad (MUST):** shared_years=30 dyad
  recall ≥ nominal sum on shared-expertise topics;
  strangers dyad shows collaborative inhibition ≥8%;
  removal of the partner measurably degrades the survivor's
  shared-topic recall (the widow cost).
- **P1184 familiarity substitution (MUST):** R→K emission
  ratio shifts toward K with age_eff; `fam_rely`-driven
  reports carry source-attribution errors ≥1.3× young at
  matched familiarity; `fam_age_null` — fam strength at 70
  within ±10% of 30.
- **P1185 intended-forget leak (SHOULD):** list-method
  forget at 75 leaves ≥40% residual drive vs ≤10% at 30;
  item-method arm within ±15% across ages (the control-
  specific boundary).

## 125. Honest limits, tenth pass

- `hyperbind_p` prices an EFFECT measured in one paradigm
  family (superimposed distractor + later paired associates);
  Campbell's own 2012 boundary (aware → gone) is locked but
  the generalization to "all ambient co-occurrence" is ours —
  RW's ambient stream is richer than a word over a picture.
- `bind_dev_mult`'s adult endpoint at 13 is a soft
  extrapolation — the binding literature mostly stops at ~10;
  adolescent gains under incidental encoding (Ngo) justify
  the tail but not its exact landing.
- `nap_*` hard-codes a species-typical schedule; real
  infants nap variably and the ≥30min/4h window is a
  lab-operationalized threshold — we keep the numbers
  because the probe needs them, flagged.
- `sync_*`'s chronotype drift ignores distribution spread —
  ~25% of older adults stay evening-types; a population
  probe should see the variance, not just the mean shift.
  `chron_ado_dip` conflates biological delay with school-
  schedule constraint (DEBATED in the sleep literature).
- `dediff_*` operationalizes dedifferentiation as mask
  coarsening — the neural finding is about representational
  distinctiveness; whether that should touch MERGE (a
  storage op) or only retrieval similarity is DEBATED; we
  let it touch merge because the observable (cross-item
  confusion) is what the sim must produce.
- `verb_hl_mult` takes FTT's two-trace claim at face value;
  single-process accounts (e.g., global matching) dispute
  the substrate — the OBSERVABLE (words gone, meaning kept)
  is what we lock.
- `reserve_*` prices the most contested parameter in the
  set: reserve literature can't yet separate "delays
  pathology detection" from "delays decline" — our
  compressive pricing follows Zahodne, flagged DEBATED, and
  P1182's post-cliff leg is the falsifiable part.
- `crosscue_*` blends two literatures (lab collaborative
  inhibition; naturalistic couple memory) that measure
  different things; the years-scaling is fitted to the
  Harris qualitative pattern, not a curve.
- `fam_rely_*`'s confidence lift is the model's weakest
  formalization — the literature says reliance, not
  confidence inflation; we need SOME emission-level
  consequence and chose the cheapest, flagged.
- `df_old_leak` inherits the meta's item/list asymmetry
  without its mechanism (executive load) — a cleaner model
  would make the leak load-dependent; flagged second-order.
