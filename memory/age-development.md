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
