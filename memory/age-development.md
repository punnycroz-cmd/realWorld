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
