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
