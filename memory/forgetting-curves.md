# Forgetting Curves v1 — calibrated decay targets for the RW memory model

**Track:** memory-research (sf/memory) · **Focus:** forgetting-curves
**Consumes:** `memory-model-spec.md` §4 (decay engine) · **Feeds:** spec v0.1
revisions (§4.6 consolidation window, §4.7 permastore, revised params) and the
future `memory/validation-spec.md` (roadmap item 12).

Purpose: replace the spec's plausible-but-unanchored τ/β numbers with targets
fitted to real human retention data, state the functional-form decision, and
emit falsifiable calibration tests. Every benchmark below cites its source;
claims are tagged **[CONSENSUS]**, **[DEBATED]**, or **[HYPOTHESIS]**.

---

## 1. Functional form — decision record

The spec uses `R(t) = E_adj · (1 + t/τ)^(−β) + floor` (power law + asymptote).

The largest functional-form survey in the field — Rubin & Wenzel 1996 (*One
hundred years of forgetting*, Psychological Review) — fit **105 two-parameter
functions to 210 published retention datasets** and found four functions that
consistently win and are statistically indistinguishable with available data:
the **logarithmic**, the **power**, the **exponential in √t**, and the
**hyperbola in √t**. Autobiographical memory is the lone exception class
(slower, closer to linear — §2.4). **[CONSENSUS shape, DEBATED form]**

Additional anchors:

- **Wixted & Ebbesen 1991, 1997**: power functions fit *individual-subject*
  forgetting (word/face recognition) — the power law is not purely an
  averaging artifact in these datasets. **[CONSENSUS-ish; the averaging
  objection remains a live debate]**
- **Wickelgren 1974** single-trace fragility theory: retention strength decays
  as a power function of time with a resistance term — same family as ours.
- **Murre & Dros 2015** (PLOS ONE) replicated Ebbinghaus 1885 nearly exactly
  and found the curve **not smooth — a jump/plateau at the 24h point**
  coinciding with the first night of sleep (§2.1, §2.8). **[CONSENSUS
  replication; the 24h bump itself is their finding, moderately supported
  by the sleep literature]**

**Decision (unchanged from v0, now justified):** power law + asymptote.
Within the indistinguishable top-4, the power law is the only form that
(a) implements **Jost's law** for free — at equal current strength, older
traces decay slower, since the decay rate falls with elapsed time;
(b) maps retrieval effects cleanly — each recall resets t along a shallowing
curve; (c) needs no state beyond `lastAccessDay`. The √t-exponential fits
comparably but lacks (a).

**Known deviation we adopt deliberately:** autobiographical retention is
flatter than laboratory power curves (§2.4). We handle it by letting
autobiographical gist carry higher effective E and lower β (self-relevance +
reminiscence-bump multiplier), not by adding a second functional form.
**[HYPOTHESIS — testable via probe P4]**

---

## 2. Human benchmark curves (calibration targets)

### 2.1 Rote/meaningless detail — Ebbinghaus 1885 / Murre & Dros 2015

Method of savings, nonsense syllables, single subject (then replicated):

| retention | 20min | 1h | 9h | 1d | 2d | 6d | 31d |
|---|---|---|---|---|---|---|---|
| Ebbinghaus 1885 | ~0.58 | ~0.44 | ~0.36 | ~0.34 | ~0.28 | ~0.25 | ~0.21 |

Murre & Dros 2015 reproduce this shape almost exactly, with the 24h point
sitting *above* the smooth curve (sleep bump).

Fit: our form with **τ=1.2d, β≈0.47** reproduces 0.21 @ 31d and the full
shape within a few points. → **β_episodic ≈ 0.5 is now a fitted value, not a
guess** — for *meaningless, unrehearsed* material: the fastest
non-pathological decay floor for episodic content. **[CONSENSUS]**

**RW mapping:** Ebbinghaus material ≈ a verbatim detail with zero
self-relevance (a stranger's license plate, an overheard number). Such content
rides β_verbatim = β_episodic·k_verbatim ≈ 1.25 *only if* it got encoded at
all — att_min gates most of it out first. Correct behavior: Ebbinghaus
subjects deliberately rehearsed; ambient characters don't.

### 2.2 Once-seen faces / eyewitness detail — Deffenbacher et al. 2008

Meta-analysis of 53 facial-memory studies: retention-interval → trace-strength
correlation r ≈ .18 (d ≈ 0.37); Wickelgren power-law fits all 11 candidate
datasets. Extrapolated upper bound: a witness's initial strength corresponds
to ~**0.67 probability of a correct 6-person lineup pick**, decaying
measurably within weeks. High stress at encoding costs d ≈ −0.31 for both
identification and detail recall (Deffenbacher et al. 2004 meta-analysis).
**[CONSENSUS direction; magnitudes meta-analytic]**

**RW mapping:** eyewitness verbatim fields for a single-encounter stranger
should start at effective strength ≈ 0.6–0.7 **even at E=1 encoding** —
multiply stranger-encounter verbatim strength by `face_ceiling ≈ 0.67`
(new param). A one-glimpse stranger should *usually not* be reliably
identifiable a week later.

### 2.3 Semantic knowledge — Bahrick 1984 permastore

733 people tested on school Spanish over 50 years: **exponential decline for
the first 3–6 years, a flat plateau up to ~30 years, then a final decline**.
Recognition > recall throughout. Bahrick's striking claim: the lifespan
distribution of learned items is **discontinuous** — items live 0–6 years
*or* >25 years, almost nothing in between; a discrete transition into
"permastore" during acquisition. **[CONSENSUS pattern; the discrete-
transition claim is DEBATED but widely cited]**

**RW mapping:** semantic records get a two-regime life (spec §4.7): normal
slow power decay (β_semantic ≈ 0.2) until they either die or survive past
`permastore_age` (scaled to game time) at strength ≥ `permastore_thresh` —
then β → ~0 permanently. Well-learned neighborhood facts ("Mudhaus is on
18th") effectively never die once consolidated; freshly heard facts decay
normally.

### 2.4 Autobiographical events — Linton 1975/1978, Wagenaar 1986

- **Linton**: ~5,500 self-recorded daily events over 6 years; forgetting was
  approximately **linear**, not steeply curvilinear — a slow constant drain —
  with recognition staying high.
- **Wagenaar 1986** (*My memory*, Cognitive Psychology): 2,400 events over
  6 years, systematic cue test. Cue efficacy order: **what > who ≈ where >>
  when** ("when" alone was nearly useless); retention strongly predicted by
  **salience, emotional involvement, and event rarity**. No single cue
  recalled everything — access is genuinely cue-driven.
- **Rubin & Wenzel 1996**: autobiographical datasets are the *exception* to
  the standard four functions — flatter, more linear.

**RW mapping:** (a) cue weights should rank `topic > people ≈ place >>
era/when` — constrain the spec's weights: **`w_topic ≥ w_people ≈ w_place >
w_sensory`, and time/era is a *weak* cue** (humans locate events by content,
not date). (b) Autobiographical flatness emerges from high E on self-relevant
events; do not flatten β globally. (c) Date error grows monotonically with
retention interval (diarists' dating errors) — apply extra drift to
`verbatim.when`.

### 2.5 Source tags — fastest-decaying field

Source memory degrades before content (Johnson et al. 1993; Spencer & Raz
1995 for the age gradient). No canonical curve exists, but eyewitness
source-confusion studies put meaningful attribution loss at **days, not
weeks**. → β_source ≈ 1.0–1.7 (half-life ~1 day at τ=1.2) is consistent.
**[CONSENSUS order-of-magnitude; no clean fit — flagged]**

### 2.6 Affective tone — fading affect bias

Walker, Vogl & Thompson 1997; Ritchie et al. 2015: affective intensity fades
roughly exponentially; **negative affect fades ~1.2–1.5× faster than
positive**, and the asymmetry widens with age (positivity effect). → spec's
`neg_affect_decay 1.3` sits mid-range; older-adult 1.7 defensible.
**[CONSENSUS]**

### 2.7 Flashbulb confidence — Talarico & Rubin 2003

9/11 memories: **detail consistency decayed identically to everyday memories**
over 32 weeks; only *vividness, recollection rating, and belief in accuracy*
stayed elevated. → high-arousal records decay on the **same β** as ordinary
ones; what differs is `floor` (arousal-scaled), `confidence` (sticky), and
verbatim thinning at birth. **[CONSENSUS]**

### 2.8 Consolidation kinetics — Jenkins & Dallenbach 1924

Nonsense-syllable recall: 8h **asleep → 56.5%** vs 8h **awake → 46%**; 8h of
sleep beat even 1h of wake. Sleep passively shields against retroactive
interference. Combined with the Murre & Dros 24h plateau: **the first ~day is
a distinct regime** — records that haven't crossed a sleep tick are
interference-exposed; after first sleep they are consolidated.
**[CONSENSUS effect; mechanism DEBATED — passive shielding vs. active
consolidation]**

### 2.9 Age gradient — Park et al. 2002

Processing-intensive memory (working memory, episodic LTM) declines **linearly
from the 20s onward** across 345 adults; verbal/semantic knowledge
*increases* across the lifespan. → per-band β_episodic should rise
monotonically with age while β_semantic stays flat — already true in the
profiles; now cited. **[CONSENSUS pattern; cross-sectional caveat]**

### 2.10 Jost's law (1897)

Of two memories of equal current strength, the **older decays slower**.
A free consequence of the power law — included as validation probe P5.

---

## 3. What changed in the spec (v0 → v0.1)

| # | Change | Grounding |
|---|---|---|
| C1 | β_episodic default 0.5 is now *fitted* (Ebbinghaus/Murre & Dros, §2.1) | CONSENSUS |
| C2 | New §4.6 consolidation window: records younger than `consol_window_days` (1.0) are interference-exposed at full rate and decay at `consol_beta_mult` (0.5)×β only through the sleep tick | §2.1, §2.8 |
| C3 | New §4.7 permastore: semantic records at age ≥ `permastore_age` (180 game days, scaled from Bahrick's 3–6yr) with strength ≥ `permastore_thresh` (0.25) freeze β→0 | §2.3 |
| C4 | Cue-weight ordering constrained: `w_topic ≥ w_people ≈ w_place > w_sensory`; era/when is a weak cue; `verbatim.when` gets extra drift | §2.4 |
| C5 | New param `face_ceiling` (0.67): caps verbatim strength for single-encounter strangers | §2.2 |
| C6 | High-stress encoding penalty formalized: arousal > `stress_thresh` (0.8) multiplies verbatim-detail E by (1 − `stress_encode_loss`), default loss 0.31 | §2.2 (d=−0.31) |
| C7 | Floor retained: `floor = 0.05·arousal` — flashbulb records share β with ordinary ones (no special curve) | §2.7 |
| C8 | Semantic β flat across age; episodic β monotonic with age | §2.9 |

New params (added to `MemoryParams` + clamp table):
`consol_window_days [0.5–2.0]`, `consol_beta_mult [0.3–0.8]`,
`permastore_age [90–365]`, `permastore_thresh [0.15–0.4]`,
`face_ceiling [0.5–0.8]`, `stress_thresh [0.7–0.95]`,
`stress_encode_loss [0.2–0.4]` (centered 0.31).

---

## 4. Calibrated retention table (spec defaults, game days)

From the defaults (τ_e=1.2, β_e=0.5, k_verbatim=2.5, τ_s=30, β_s=0.2):

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| verbatim, ambient (E .4) | 0.9d | .19 | .04 | .01 | ~0 |
| verbatim, salient (E .9) | 0.9d | .42 | .08 | .02 | ~0 |
| gist, ambient (E .4) | 3.6d | .30 | .15 | .08 | .02 |
| gist, salient (E .9) | 3.6d | .66 | .34 | .18 | .07 |
| semantic (E .6) | ~930d | .60 | .58 | .52 | .36 |
| source tag | 1.2d | .33 | .09 | .02 | ~0 |

Reading: *what survives is decided at encoding, not by the curve* — ambient
gist crosses `forget_thresh 0.08` around day 30; salient gist persists for
months; verbatim detail is essentially gone in a week unless rehearsed
(each retell resets t onto a shallower slope — Jost's law does the rest).
This is the human pattern: **selective at birth, doomed verbatim, durable
rehearsed gist.**

## 5. Validation probes (falsifiable; feed memory/validation-spec.md later)

- **P1 Ebbinghaus analog:** encode a low-attention meaningless verbatim
  (street number glimpsed once). Expect residual strength ≤0.25 at 31 days,
  archived ≈ day 30–45. Fail if >0.3 survives.
- **P2 sleep bump:** two identical records, one crossing a sleep tick at
  age 0.5d, one decaying continuously — the slept record retains ≥15% more
  strength at day 2 (Jenkins & Dallenbach analog).
- **P3 eyewitness bound:** stranger seen once, identified from a 6-candidate
  lineup a week later — success rate should sit near or below ~0.5
  (face_ceiling × week decayed), well below certainty.
- **P4 autobiographical flatness:** gist-strength distribution of a
  character's own-event records over 90 days should decay visibly slower than
  the P1 curve — if it doesn't, raise w_self rather than change β.
- **P5 Jost's law:** two records equated to equal strength at ages 2d and
  60d — after 30 further days the older must retain more.
- **P6 flashbulb decorrelation:** a max-arousal record at day 60 should show
  low verbatim survival but confidence ≥0.9 (Talarico & Rubin pattern).
- **P7 cue asymmetry:** cue a record by its "when" only vs its "what" only —
  what-cued recall must succeed markedly more often (Wagenaar).
- **P8 permastore split:** among semantic records born in the same week,
  the survivors at day 200 should be bimodal — dead or frozen, few dying
  slowly in between (Bahrick discontinuity).

## 6. Honest limits

- Most benchmark data are *recognition/savings* measures; our `strength` is a
  latent retention proxy. Calibration is to shape and order-of-magnitude,
  not exact percentages.
- Game-day ≠ lab-day: a character's "day" contains far more interfering
  events than a lab subject's. If interference is implemented per §4.2,
  ambient decay will run faster than the table — acceptable, arguably
  realistic (Underwood 1957: most real forgetting *is* interference).
- Bahrick's discontinuity may be an artifact of schooling structure; we adopt
  it because it produces the right behavior (stable world-knowledge) cheaply.
- No data source distinguishes "what a person would tell a friend" from
  recognition-test retention — our verbalization layer adds its own loss.

---

# Part II — v13 deepening: practice dynamics, interference ecology, controlled forgetting

The v1 pass calibrated *passive* decay. This pass calibrates the three
things that actually decide what survives in a lived life: **rehearsal
schedule** (spacing/testing), **competition** (interference accumulation),
and **control** (deliberate suppression). Plus two missing decay classes
(verbatim speech, intentions) and a better mechanism for Part I's
autobiographical flatness.

All claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS] as before.

## 7. New primary sources

### 7.1 Spacing and lag — Cepeda et al. 2006

The distributed-practice meta-analysis (839 assessments, 317 experiments,
*Psychological Bulletin*): spaced rehearsal beats massed rehearsal
essentially always, and **the optimal inter-study interval grows with the
retention interval** — ISI and RI interact jointly. Rule of thumb
consistent with the meta's tables: optimal lag ≈ 10–30% of the interval
over which retention must last (later estimates ~10–20%; the literature
never pins it tighter — [CONSENSUS that the ratio is positive and
sub-unity; DEBATED exact value]).

**Spec consequence:** §4.11's desirable-difficulty term `(1−R_pre)` makes
spacing *emergent*, but only qualitatively — it can't encode the lag
*optimum* (retelling too soon barely helps; retelling at the right gap
helps most; retelling after near-total forgetting is again nearly
relearning). Make it explicit: scale the S-growth by a lag factor

```
lag_mult(gap, age) = exp( −(ln(gap / (lag_opt_ratio·age)))² / (2·lag_width²) )
```

a log-normal peaking at `gap = lag_opt_ratio·age` (age = days since
encoding), `lag_opt_ratio ≈ 0.15`, `lag_width ≈ 1.0` (log-units — the
meta's optima are broadly scattered, so the peak is wide). Massed
re-access (gap < ~2h, i.e. repeating yourself inside one conversation)
multiplies S-growth by `massed_retell_mult` (0.4) instead —
back-to-back retelling is mostly wasted [CONSENSUS direction; the
functional form is our modeling choice, HYPOTHESIS].

### 7.2 Testing vs re-exposure — Roediger & Karpicke 2006; Kornell et al. 2009

Roediger & Karpicke 2006 (*Psychological Science* 17:249): at a 5-minute
test, restudy beat testing (81% vs 75%); at 1 week the ordering **inverts
hard** — tested 61% vs restudied 40% [CONSENSUS]. Re-exposure feels
better (fluency → confidence, §3 conf inflation on rehear) but buys less
durability. Two consequences:

- **Split s_gain by access kind.** `s_gain_recall` (0.35, effortful
  reconstruction of one's own record) vs `s_gain_rehear` (0.12, passive
  re-exposure — hearing the story back, re-witnessing the place). Rehear
  still fully refreshes `lastAccessDay` (it resets R's clock — the R-side
  benefit is the same); it just buys ~⅓ the storage growth.
- **Failed retrieval potentiates re-encoding** (Kornell, Hays & Bjork
  2009; also Izawa 1970 test-potentiation): an unsuccessful recall
  attempt marks the record `attempted`; the *next* re-exposure to that
  content (hearAccount match, re-encoded event) gets
  `E_new *= (1 + potent_gain)` with `potent_gain ≈ 0.3`, flag consumed on
  use. RW behavior: a character who struggles to recall and *then* hears
  it learns it better than one who never tried [CONSENSUS effect;
  magnitude moderately supported].

### 7.3 Reminiscence and hypermnesia — Payne 1987; Scrivner & Safer 1988

Successive recall attempts without re-exposure recover *new* details:
**reminiscence** (items first recalled on test n>1) is robust and large;
**net hypermnesia** (total > earlier total, new gains exceeding losses)
occurs reliably only in recall mode for imagery-rich/high-recall material
— eyewitness studies (Scrivner & Safer 1988; Dunning & Stern 1994) show
reminiscence but *not* net gain: new details surface while old ones drop
[CONSENSUS for reminiscence; net hypermnesia DEBATED/material-dependent].

**Spec consequence:** recall() shouldn't return the same field set every
time. Model each record's verbatim fields as a partially-observable pool:
on each successful recall, each not-yet-returned field with residual
strength > 0 surfaces independently at `reminiscence_frac` (0.15) —
bounded, so a character retelling the same story to a second listener
plausibly adds a detail ("oh and — she'd brought the lease") while other
details have silently dropped between tellings. Attempt count is
`retrievalCount`; no separate bookkeeping. [HYPOTHESIS implementation of
a CONSENSUS phenomenon]

### 7.4 Verbatim speech — Sachs 1967; Jarvella 1971

The fastest-decaying content class we hadn't priced: the *wording* of
heard speech. Sachs 1967: paraphrases are indistinguishable from the
original after **~80 syllables of intervening discourse (~1 minute)**;
meaning survives. Jarvella 1971: verbatim recall essentially covers only
the current clause/sentence — a sentence boundary dumps it [CONSENSUS].

**Spec consequence:** `verbatim.quote` needs a sub-daily timescale.
Decay class `quote`: τ_quote = 0.02 days (~30 min), β_quote = 0.8,
floor 0. Evaluated on the same power law (formal-model.md §1 scale-
invariance makes this legal — τ is just smaller). Practical effect: a
character can quote what was *just* said, paraphrase tonight, and by
tomorrow holds only the gist plus at most a short residue fragment.
Dialogue verbatim recall beyond ~30 min should route through gist +
confabulation, not the stored quote. New params `tau_quote`, `beta_quote`
(field-class constants, frozen — see §8 C12).

### 7.5 Interference accumulates — Underwood 1957; Wickens 1970; Wixted 2004

§4.2 models pairwise interference but ignores the strongest interference
fact: it *accumulates with list length*. Underwood 1957 showed most
everyday forgetting is **proactive** — the Nth similar item suffers from
all previous ones, not just its nearest twin. Wickens' release-from-PI
paradigm: performance collapses across 3–4 same-category trials and
**recovers almost fully when the category shifts** (a new topic/venue
opens a fresh competition pool). Watkins & Watkins' cue-overload
principle generalizes it: a cue's effectiveness falls as the count of
memories hanging on it grows. Wixted 2004 (*Annual Review*): time decay
per se may contribute little once interference is accounted for
[DEBATED — but "most forgetting is cue-dependent" is near-consensus].

**Spec consequence:** each record carries `n_sim` — the count of
similar-cue records encoded *since* it (incremented on encode of
sim > interf_thresh neighbors). The §4.2 pairwise suppression scales by
`min(1, sqrt(n_sim)/pi_ref)` with `pi_ref = 4` (Wickens collapse point).
**Release:** a record's competing pool is its cue-similar neighborhood —
records with a *shifted* dominant cue (new place, new topic cluster)
don't contribute to each other's n_sim. The 40th identical commute still
blur-merges via §4.3; the first day at a new job is protected by the
category shift even though it's the Nth workday. This also sharpens the
novelty/diversity payoff: characters with varied routines literally keep
more distinct memories [CONSENSUS mechanism; parameter values ours].

### 7.6 Childhood forgetting is a regime, not a switch — Bauer & Larkina 2013/2014

v0.3's `amnesia_decay_mult` is a step at `encodeAge < 7`. The actual
findings: (a) children's autobiographical-memory distributions fit an
**exponential** (constant-rate forgetting — failed consolidation), while
adults' fit a **power** function (Bauer & Larkina 2014, *Memory &
Cognition*); (b) 5–7-year-olds retained ≥60% of events from age 3, but
8–9-year-olds under 40% — the amnesia *sets in* during childhood, it's
not retrospective erasure (Bauer & Larkina 2014, *Memory*); (c) in the
4-year prospective study, forgetting rate ordered 4y > 6y > 8y > adult
— a graded ramp, and **thematic coherence of the initial report predicted
survival** (Bauer & Larkina 2015/2016) [CONSENSUS].

**Spec consequence:** replace the step with a ramp:

```
if encodeAge < amnesia_exit (7):
    β *= 1 + amnesia_slope·(1 − encodeAge/amnesia_exit)    // amnesia_slope ≈ 1.2
    and survival is gated: P(consolidated past childhood)
        = min(1, child_consol_base + coherence·child_consol_gain)
        coherence = record's coherentUnit flag / link degree at birth
```

`amnesia_slope` 1.2 reproduces β×2.2 at age 1 → β×1.0 at age 7 (old
mult 1.8 ≈ ramp midpoint). Uncohered child records simply aren't there
as adults — childhood amnesia emerges as a survivorship cliff, not a
delete. Keep the power form (single functional family, §1 decision);
the exponential-vs-power difference is absorbed into the ramp
[HYPOTHESIS — the continuous approximation is ours].

### 7.7 Deliberate suppression — Anderson & Green 2001, honestly bounded

Think/No-Think: actively stopping a retrieval impairs later recall of
the suppressed item by ~**8%** (same-probe; ~6% independent-probe —
Anderson & Huddleston 2012 combined lab sample). Real but *small*, and
the replication record is uneven — a 2024 authorship analysis found
95% of developer-lab studies vs 68% of independent studies report the
effect [effect exists, DEBATED robustness/magnitude; we adopt the small
end]. Clinical populations (PTSD, depression) show *reduced* control —
suppression works worst exactly where most wanted (Stramaccia et al.
2021 meta) [CONSENSUS direction].

**Spec consequence:** new operator `suppressEvent(charId, recordId)` —
the character is consciously avoiding the memory. Each call:
`record.suppressed++` and `θ_eff += suppress_theta` (0.08, cumulative,
capped at suppress_cap 0.3). Acts on **R-side accessibility only** —
storageS untouched; §5.7 involuntary scan **ignores** suppression
entirely (that's the point: the avoided memory is precisely the one that
ambushes you in the shower; Wegner rebound DEBATED so we don't add a
bonus, just no exemption). `suppress_cap` ×0.5 under trauma/depressive
modifiers. This is a *leak, not a delete key* — believable because it's
weak.

### 7.8 Intentions decay differently — event-based PM persistence

Event-based prospective intentions ("tell Mara X next time I see her")
show little decay until the trigger window — they survive weeks nearly
intact in lab paradigms because retention is tested *at the cue*
(Einstein & McDaniel 1990; Einstein, Holland, McDaniel & Guynn 1992
[CONSENSUS direction]). Time-based intentions ("at 5pm") decay like
ordinary episodic content and self-initiated retrieval carries the load
(pm_self, v0.3).

**Spec consequence:** `Intention` records get their own decay class:
`beta_pm ≈ 0.15` while armed; on trigger-fire the record resolves and
then decays normally (a *fired* intention is just an episode — and
post-completion it can even decay faster, cf. open/closed loops v1.0).
The doorway penalty (v1.2) still applies — PM loss is a cue problem, not
a decay problem, which is exactly what the literature says.

### 7.9 Retell ecology — why salient autobiographical curves look flat

Part I handled autobiographical flatness by raising effective E. The
mechanism deserves to be explicit: **in real life, salient events get
retold**, and each retell refreshes t and grows S. Linton's diary work
and rehearsal-distribution studies show naturally-occurring rehearsal is
rare (~once or twice for ordinary events) and salience-driven. Add a
cheap daily ecology draw:

```
per live episodic record, once per daily tick:
    p_retell = retell_base · E_adj · (1 + retell_social·sharedCue)
        retell_base ≈ 0.015/day, retell_social ≈ 1.0 (co-present
        participant boosts; rumor-track handles who actually hears)
    on fire → §5.9 reboost + §4.11 S-growth (recall kind) + drift §6.1
```

This is what *produces* the flat Linton/Wagenaar curves endogenously
rather than by parameter fiat: the top few percent of records get
rehearsed into near-permanence while the rest ride the β=0.5 slope.
Also makes `retell_boost`-carrying profiles (gossip modifier) genuinely
self-flattening. [HYPOTHESIS mechanism, CONSENSUS phenomenon]

### 7.10 Procedural — near-zero by design

Skill records (`{skill: level}` map, spec §1) already carry near-zero
decay; price it: procedural knowledge shows no measurable loss over
decades in longitudinal data and reacquires at a fraction of original
cost (savings even when recall ≈ 0 — Nelson 1985). `beta_proc = 0.02`,
and the §4.11 relearn_gain applies to skills too (relearning is S-side,
so a rusty skill snaps back) [CONSENSUS].

## 8. Spec deltas (v1.2 → v1.3)

| # | Change | Grounding |
|---|---|---|
| C9 | §4.11: S-growth split — `s_gain_recall` 0.35 / `s_gain_rehear` 0.12; rehear refreshes lastAccessDay equally but grows S ~⅓ | §7.2 |
| C10 | §4.11: `lag_mult` log-normal spacing factor (lag_opt_ratio 0.15, lag_width 1.0) on S-growth; `massed_retell_mult` 0.4 for gap <0.08d | §7.1 |
| C11 | §4.11: `attempted` flag + `potent_gain` 0.3 on next re-encoding of a failed-recall record | §7.2 |
| C12 | §4.1: new verbatim field class `quote` — tau_quote 0.02d, beta_quote 0.8 | §7.4 |
| C13 | §4.2: `n_sim` accumulator + sqrt-scaled PI (pi_ref 4); competition pools are cue-similarity-bucketed → release-from-PI on category shift | §7.5 |
| C14 | §4.1: childhood amnesia step → ramp (amnesia_slope 1.2) + coherence-gated survival (child_consol_base 0.15, child_consol_gain 0.6) | §7.6 |
| C15 | NEW §4.12 suppression: suppressEvent op, suppress_theta 0.08, suppress_cap 0.3, R-side only, involuntary scan exempt | §7.7 |
| C16 | NEW §4.13 retell ecology: daily p_retell draw (retell_base 0.015, retell_social 1.0) | §7.9 |
| C17 | §9: Intention decay class beta_pm 0.15 while armed | §7.8 |
| C18 | §5.11 NEW: reminiscence_frac 0.15 — per-attempt resurfacing of unreturned verbatim fields | §7.3 |
| C19 | procedural map: beta_proc 0.02 + relearn_gain applies | §7.10 |

New MemoryParams (all optional, defaults above): `s_gain_recall`,
`s_gain_rehear`, `lag_opt_ratio`, `lag_width`, `massed_retell_mult`,
`potent_gain`, `tau_quote`, `beta_quote`, `pi_ref`, `amnesia_slope`,
`child_consol_base`, `child_consol_gain`, `suppress_theta`,
`suppress_cap`, `retell_base`, `retell_social`, `beta_pm`,
`reminiscence_frac`, `beta_proc`.

## 9. Retention table — added rows (defaults, game days)

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| verbatim quote (E .9) | ~4 min | .05 | ~0 | 0 | 0 |
| armed intention (E .6) | ~200d | .58 | .52 | .42 | .12 |
| suppressed record (3 suppressions) | as class — but θ +0.24 | — | — | — | — |
| massed-retold gist (3 retells same day) | 3.6d | .70 | .36 | .19 | .07 |
| spaced-retold gist (3 retells, ~weekly) | 3.6d→resets | .70 | .55* | .40* | .15* |

*S accumulation from spaced retells lifts the post-reset baseline —
the flat autobiographical curve emerging from ecology, not fiat (§7.9).

## 10. New probes (P117–P126)

- **P117 spacing analog (MUST):** 3 identical-strength retells — spaced
  (weekly) vs massed (same hour). At 30d the spaced record's R must
  exceed massed by ≥1.5×. Constrains lag_opt_ratio, massed_retell_mult.
- **P118 testing analog (MUST):** record A recalled successfully, record
  B re-heard equally often; at 14d A's S > B's S; at 1d B's R ≥ A's R
  (the 5-minute inversion — rehear feels fresher short-term).
  Constrains s_gain_recall vs s_gain_rehear.
- **P119 failed-retrieval potentiation (SHOULD):** failed recall then
  matched hearAccount beats naive hearAccount on next-day retention.
- **P120 reminiscence (SHOULD):** across 3 successive recalls of one
  record, verbatim fields not returned earlier surface at a nonzero rate
  and net field count may drop (reminiscence allowed, net hypermnesia
  not required — Dunning & Stern eyewitness pattern).
- **P121 quote decay (MUST):** verbatim.quote at 1h < 0.3 of birth;
  gist intact. Dialogue quoting beyond same-hour must read as
  paraphrase. Constrains tau_quote/beta_quote.
- **P122 release-from-PI (MUST):** 5 same-venue-same-topic records show
  monotonically depressed R; a 6th at a *different* venue+topic starts
  near-clean (n_sim pool shift). Constrains pi_ref, interf bucket.
- **P123 childhood ramp (MUST):** survival of records encoded at ages
  3/5/8/adult at adult recall is graded monotone (not a step), and
  high-coherence childhood records over-survive low-coherence ones.
  Constrains amnesia_slope, child_consol_*.
- **P124 suppression leak (SHOULD):** suppressEvent×3 lowers voluntary
  recall hit-rate ≤10–15% (bounded — never to zero) while
  ambientMemoryScan intrusion rate is unchanged; storageS unchanged.
- **P125 intention persistence (SHOULD):** armed Intention R@14d ≥ 0.5
  while a matched ordinary record sits ≈0.15; locShift still drops it
  (PM loss is cue-side).
- **P126 retell-ecology flatness (MUST):** run 90 sim-days with retell
  ecology on; the top-decile-by-E gist records' mean R-curve must be
  visibly flatter than the P1 ambient curve AND the mechanism must be
  retell count (check retrievalCount correlation), not parameters.

## 11. Honest limits (additions)

- The lag_mult log-normal is a fitted-shape stand-in; Cepeda's optima are
  study-level averages with wide scatter — treat lag_opt_ratio as a
  SHOULD-tier calibration target, not a MUST.
- n_sim pooling by cue bucket is a cheap approximation of cue-overload;
  a real system would weight partial overlap. Ours errs toward clean
  pools — acceptable because genericization (§4.3) absorbs the mess.
- Suppression is deliberately weak and R-only. If playtests show
  characters "forgetting on command", the bug is suppress_cap, not the
  operator.
- The retell-ecology draw is a placeholder for the real social engine;
  once rumor propagation exists, p_retell should consume actual
  conversation opportunities rather than a Bernoulli draw.
- Bauer & Larkina's exponential-for-children finding argues for a second
  functional form; we refuse it for spec economy — the ramp +
  consolidation gate reproduces the observable (graded adult survival)
  with one function. Flagged as the approximation it is.

---

# Part III — v25 deepening: what the curves are FOR — adaptive calibration, event time, and the tails

Parts I–II fitted the curve's shape and its modifiers. This pass asks the
two questions that remained qualitative: **why** forgetting looks like this
(rational analysis — the curve tracks the world's reuse statistics), and
**whose** curve it is at the population extremes (HSAM/SDAM tails). Plus
three mechanisms that were implied but never priced: event-time vs
clock-time, verbatim→gist transformation, and state-context drift.

Claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS] as before.

## 12. New primary sources

### 12.1 Rational analysis — forgetting tracks environmental need — Anderson & Schooler 1991

Anderson & Schooler 1991 (*Psychological Science*, "Reflections of the
environment in memory") measured the statistics of *need* for information
in real environments — word occurrence in headlines/child-directed speech,
library book circulation, file/email retrievals — and found the probability
that an item will be needed again decays as a **power function of time
since last use** (exponents ≈1–2 depending on the source) [CONSENSUS as
empirical regularity; the rational-adaptation interpretation is their
framework, widely cited]. Human forgetting has the same functional family
because memory is *calibrated to the environment's reuse statistics* —
you forget at the rate the world makes old information stale.

**Spec consequence — the reuse-calibration rule.** This upgrades the power
law from "fits the data" to "is the right answer": a well-formed character's
retention should be *economical*, not maximal. Formalize as a design axiom
plus a validation probe:

```
reuse-calibration axiom: for each content class c, let g_med(c) be the
median gap between successive accesses of records of class c in sim logs.
A calibrated model satisfies  R(g_med) ∈ [0.4, 0.7]  per class.
```

A class whose records are always long dead before reuse is over-decaying
(wasted relearning); a class retained far beyond any reuse is wasted
maintenance. This is probe P239 — the first probe that constrains the
model against *its own world's statistics* rather than lab tables, and it
is how the β set stays honest as the world content drifts. Anderson &
Milson 1989 and the ACT-R base-level equation (B = ln Σ t_j^−d, d≈0.5 —
Anderson & Schooler 1991's companion formalization) are the same power-law
family: independent support for the §4.1 form.

### 12.2 Slope independence — rate vs level — Slamecka & McElree 1983

Slamecka & McElree 1983 (*JEP:LMC*, "Normal forgetting of verbal lists")
found the **rate** of forgetting largely independent of initial degree of
learning: stronger learning raises the intercept, not the slope. Loftus
1985 argued the opposite under certain measures (higher learning slower by
recognition); Wixted 2004's review treats "rate ~independent of strength"
as the modal finding with real exceptions [DEBATED in detail; the broad
pattern — encoding quality mostly moves where the curve starts, not how
fast it falls — is CONSENSUS-enough to adopt as a constraint].

**Spec consequence — the slope-invariance axiom.** Our §4.1 already does
this structurally: `E_adj` is an intercept multiplier and β is per-class,
never E-dependent. v25 promotes this from accident to contract: **β must
not depend on E, arousal, or rehearsal count** — durability differences
enter through the intercept (E), the clock (retell resets t), the floor,
and the S layer (§4.11), never through β itself. Probe P231 enforces it:
fit per-record β across E bins; slopes must agree within noise. The one
sanctioned β modulators remain age (§4.8), era (bump/amnesia, §4.1),
content class (k_verbatim etc.), and the HSAM/SDAM tails (§12.8) — all
*who/when/what* variables, none *how-strong*.

### 12.3 Familiar faces are permastore — Bahrick, Bahrick & Wittlinger 1975

The famous 50-year study: 392 alumni tested on high-school classmates —
**identification and matching of classmate names/faces stay ~90%
correct for at least 15 years** and remain near-flat out to ~48 years,
while free recall of names declines ~60% over the same span
[CONSENSUS — one of the most-cited long-term-retention results;
"permastore" for recognition of well-known faces]. This is a
second, *person-domain* permastore beyond Bahrick's 1984 semantic one, and
it dissociates recognition from recall exactly as §5.6's mode split does.

**Spec consequence:** §4.7's permastore check extends to PersonModel
records: the **face-recognition component** (the §5.10 cascade's first
leg) qualifies for permastore at a lower bar — `face_perma_thresh` 0.15
vs `permastore_thresh` 0.25 — once the person was genuinely familiar
(`familiarity ≥ fam_recog_gate` 0.5 at last contact). Names explicitly do
NOT get this: name retrieval decays normally on top of the existing
`name_penalty` (Cohen 1990) — "I know that face, I was in school with
them, and I cannot produce the name" is the human datum, not a bug.
Probe P232.

### 12.4 Event time vs clock time — Wixted 2004; Howard & Kahana 2002

Two converging lines: (a) interference analyses (Wixted 2004, *Annual
Review*; Underwood's tradition) — forgetting is better predicted by
**what happened between** encoding and test than by elapsed time per se;
(b) retrieved-context models (Howard & Kahana 2002 temporal context
model; Glenberg's component-levels tradition) — a memory's "age" is its
distance along a context vector that advances with *experienced events*,
not wall-clock ticks. Event-segmentation work (Radvansky; Zacks) adds the
phenomenology: a busy week subjectively "pushes" last Monday further away
than an idle week does [CONSENSUS direction; the quantitative weighting
is open — our parameterization is HYPOTHESIS].

**Spec consequence — event-adjusted age.** §4.1's decay argument becomes

```
t_eff = Δt_days + ev_time_w · (n_events_since / ev_day_norm)
```

where `n_events_since` counts events encoded by this character since
`lastAccessDay` (already tracked for interference bookkeeping — bucket
counts suffice, no new stores needed) and `ev_day_norm` is the class's
typical daily event load (30 for mains, ~10 for ambients). `ev_time_w`
≈ 0.5: a character living 3× average days ages memories ~1.5 days per
day. This does double duty: it is *the* mechanism that makes a hectic
fortnight blur ("feels like months") while a quiet one leaves the same
calendar span crisp, and it explains why the interference-dominated
calibration table (Part I §4) is not too fast in a rich world — part of
the richness is already inside t_eff. Probe P233.

### 12.5 Verbatim→gist transformation — McClelland et al. 1995; Winocur & Moscovitch 2010

Systems consolidation says episodic memories reorganize over weeks–months
into schema-compatible, neocortical form. The two live theories disagree
on mechanism — standard consolidation (transfer to cortex; McClelland,
McNaughton & O'Reilly 1995) vs multiple-trace theory (hippocampal
contextual detail needed forever; Nadel & Moscovitch 1997) — but both
predict, and the data show, the observable: **remote memories retain
fewer contextual details and a proportionally stronger schematic core**
[CONSENSUS observable; mechanism DEBATED]. Winocur & Moscovitch 2010's
"transformation hypothesis" names the active version: episodic → semantic
conversion, not just episodic loss. Fuzzy-trace theory (Brainerd & Reyna)
supplies the same asymmetry at shorter scales: verbatim traces die fast,
gist endures and is *re-derived*.

**Spec consequence — transformation gain.** Currently a verbatim field's
death is pure loss. Make it generative: when a verbatim field of an
episodic record archives (crosses `forget_thresh`) or is consumed by a
§4.3 merge, the record's **gist leg gets a one-time S boost**
`+transf_gain` (0.05, once per field, flag `transf_done[field]`). The
record that loses its frame doesn't just fade — it becomes more *story*:
"the fight at El Farolote" survives as a compact, schema-consistent gist
precisely *because* its particulars were shed. This is the passive half
of what canonization (§6.24) does socially; it also gives genericization
a payoff consistent with the data (merging builds durable scripts).
Probe P234.

### 12.6 Internal context drifts — Estes 1955; Mensink & Raaijmakers 1988

Stimulus-fluctuation and context-drift models (Estes 1955; Mensink &
Raaijmakers 1988; Bower 1972) hold that *internal* context — mood,
physiological state, train of thought — decorrelates from its
encoding-time value on a timescale of hours-to-days, while external
context (place, people) is stable across the same span. This is why
state-dependent retrieval has a short shelf life: the *match* decays even
when the record doesn't [CONSENSUS as mechanism; specific half-life is
our fit — HYPOTHESIS].

**Spec consequence — state-context drift.** §5.3's `moodStateDep` match
term and any state/sensory-internal cue overlap are multiplied by
`exp(−ageDays / state_ctx_hl)` with `state_ctx_hl` ≈ 21 days. Place and
people cues are exempt (stable external context). Consequence: mood-state
reinstatement works for yesterday's fight, not last year's — while mood
*congruence* (valence match, no drift) keeps working forever, exactly the
split the meta-analyses show. Probe P235.

### 12.7 Sleep-to-forget — REM depotentiation of affect — van der Helm & Walker 2009

"Sleep to remember, sleep to forget" (Walker & van der Helm 2009,
*Psychological Bulletin*): REM sleep is proposed to depotentiate the
emotional charge of consolidated memories — you keep the event, lose the
sting. Overnight reductions in emotional reactivity to re-presented
stimuli were demonstrated (van der Helm et al. 2011) [effect direction
CONSENSUS-ish; the REM-specific mechanism is DEBATED — replication
record is mixed and the 2020s literature is unkind to strong versions].
We already have `sleep_affect_strip` (v1.7, per-sleep arousal-tag decay,
DEBATED-flagged). v25 completes the circuit for **valence**: a fraction
of §4.5's daily affect fade is executed *inside* the sleep tick, scaled
by sleep quality.

**Spec consequence:** §4.5 gains `affect_sleep_frac` (0.4): 40% of each
day's valence-fade budget applies at `dailyMemoryTick` × `sleepQuality`,
the remaining 60% accrues continuously. Trauma records remain exempt via
`trauma` flag (they resist depotentiation — van der Helm & Walker's own
boundary). Behavior: a bad night's sleep literally leaves yesterday's
hurt sharper — a free, sourced coupling between the sleep system and the
mood layer. Probe P236.

### 12.8 The tails — HSAM and SDAM — LePort et al. 2012; Palombo et al. 2015

Both ends of the autobiographical-retention distribution are real
phenotypes, and the model should be able to express them:

- **HSAM** (highly superior autobiographical memory; LePort et al. 2012,
  *Neurobiology of Learning & Memory*; 2017 follow-up): individuals date
  and describe arbitrary personal events from decades back at near-ceiling
  accuracy. Critically, they are **not** immune to misinformation or DRM
  false memories (Patihis et al. 2013) — storage is extraordinary,
  reconstruction is ordinary. Estimated incidence well under 1%.
- **SDAM** (severely deficient autobiographical memory; Palombo et al.
  2015): lifelong near-absence of episodic re-experiencing with **normal
  semantic knowledge, working memory, and functioning** — they know the
  facts of their lives without re-living them.

**Spec consequence — two new profile modifiers** (character-memory-
profiles §2, not spec params): `hsam` — β_episodic_autobio ×0.15,
§4.3 merging disabled for selfRelevance≥0.5 records, retell ecology not
required for flat curves, `misinfo_suscept`/`phantom_p`/`drift_p`
**unchanged** (Patihis constraint — the modifier may not touch distortion
dials); `sdam` — β_episodic_autobio +0.4, w_self −0.3, retrieval noise +,
semantic/procedural params untouched, `conf` on own-past reports low but
accurate on semantic facts (they say "I know it happened, I don't
remember it" — §6.7 nonbelieved-memory surface). Neither is assigned to
a main by default — they're roster dials for future ambient/cast
diversity; a Mission full of average forgers is its own tell. Probe P237.

### 12.9 Availability census — the lifespan retrieval curve — Crovitz & Schiffman 1974; Rubin & Schulkind 1997

Word-cued autobiographical retrieval produces a frequency-vs-remoteness
curve that is itself a power decline over the lifespan, elevated in the
reminiscence-bump window and (for older adults) by recency (Crovitz &
Schiffman 1974; Rubin & Schulkind 1997) [CONSENSUS shape]. This is an
*integrated* observable — the whole memory system's steady state, not a
single record — and it is directly measurable in sim: histogram the
`encodeAge` distribution of live self-relevant records for a character.
Probe P238: the census must be power-decaying with a detectable bump-
window elevation for bump-aged cohorts — the first probe that fails if
any of encoding, decay, era terms, or archival is wrong simultaneously
(a cheap system-level canary alongside §28 SBC).

### 12.10 Supporting citations (no new mechanism)

- **Mozer, Pashler, Cepeda, Lindsey & Vul 2009** (multiscale context
  model): independent derivation of spacing-curve optima from context
  drift — supports the §7.1 lag_mult log-normal's shape and the §12.6
  drift machinery sharing one cause.
- **Nørby 2015** ("Why forget?") and **Bjork's** new-theory-of-disuse:
  forgetting as adaptive function — design rationale for the §12.1 axiom,
  not a parameter.
- **Storm & Levy 2012** (RIF as adaptive): retrieval-induced forgetting
  is the mechanism's *purpose* — already priced at §5.8.

## 13. Spec deltas (v2.4 → v2.5)

| # | Change | Grounding |
|---|---|---|
| C20 | §4.1: decay argument becomes event-adjusted `t_eff`; new params `ev_time_w` 0.5, `ev_day_norm` 30/10 | §12.4 |
| C21 | §4.5: `affect_sleep_frac` 0.4 — 40% of daily valence fade executes in the sleep tick × sleepQuality; trauma-exempt | §12.7 |
| C22 | §4.7: PersonModel face-recognition permastore at `face_perma_thresh` 0.15 under `fam_recog_gate` 0.5; names excluded | §12.3 |
| C23 | NEW §4.16 transformation gain: verbatim-field death → `+transf_gain` 0.05 gist S, once per field | §12.5 |
| C24 | §5.3: `moodStateDep` and internal-state cue overlap × `exp(−ageDays/state_ctx_hl)`, `state_ctx_hl` 21d | §12.6 |
| C25 | §4.1 contract: **slope-invariance axiom** — β may never depend on E/arousal/rehearsal; enforced by P231 | §12.2 |
| C26 | §4.1/§10: **reuse-calibration axiom** — R(g_med) ∈ [0.4,0.7] per class against world reuse logs; P239 | §12.1 |
| C27 | profiles: `hsam`/`sdam` modifiers + 4 clamp rows (no new spec params — profile layer only) | §12.8 |

New MemoryParams (all optional, defaults above): `ev_time_w`,
`ev_day_norm`, `affect_sleep_frac`, `face_perma_thresh`,
`fam_recog_gate`, `transf_gain`, `state_ctx_hl`.

## 14. Retention table — added rows (defaults, game days)

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| gist, busy character (3× ev load) | 3.6d | .30 | .15 | .08 | .02 |
| → same record, idle character (⅓ load) | 3.6d | .35 | .24 | .13 | .05 |
| familiar face recognition (PersonModel) | permastore | .9 | .9 | .9 | .9* |
| stranger verbatim (contrast, unchanged) | 0.9d | .42 | .08 | .02 | ~0 |
| mood-state cue benefit | — | 1.0× | .7× | .24× | ~0 |
| HSAM autobio gist (modifier) | ~∞ | .9 | .88 | .85 | .8 |
| SDAM autobio gist (modifier) | ~1.2d | .45 | .18 | .06 | .01 |

*Post-permastore freeze. Event-time rows assume equal wall-clock Δt —
the busy character's t_eff runs ~1.5× faster (ev_time_w 0.5 × 3× load).

## 15. New probes P231–P240

- **P231 slope invariance (MUST):** cohort of records spanning E ∈
  [0.3, 0.95], same class, no retells; per-record fitted β agrees within
  ±0.05 across E terciles. Fail ⇒ a durability term leaked into β.
- **P232 face permastore (MUST):** familiar PersonModel (familiarity
  0.7) survives 365d at recognition ≥ 0.8× of plateau while a matched
  stranger verbatim archives by day ~30; name recall of the same
  familiar person decays on the ordinary verbatim schedule.
- **P233 event time (MUST):** identical records, two characters, same
  Δt_days, n_events_since differing 3× — high-load character's R lower
  by ≥15%. Constrains ev_time_w, ev_day_norm.
- **P234 transformation (SHOULD):** a verbatim field crossing
  forget_thresh raises its record's gist S by ~transf_gain (once);
  merged records (§4.3) show the same boost. Fail ⇒ verbatim death is
  silent loss.
- **P235 state-ctx drift (SHOULD):** mood-state-dependent recall benefit
  vs mismatched-mood baseline decays to ~e⁻¹ by 21d and ~0 by 60d;
  mood-congruence benefit unchanged at 60d.
- **P236 sleep-coupled affect (SHOULD):** |valence| drop across a
  sleepQuality-1.0 boundary ≥ 1.5× the drop across a matched waking span;
  sleepQuality 0.3 boundary ≈ continuous-only rate; trauma records exempt.
- **P237 tails (SHOULD):** hsam-modified profile: autobio census nearly
  flat over 365d, misinfo_suscept UNCHANGED vs baseline (Patihis guard);
  sdam-modified: autobio availability steeply decayed, semantic R intact.
- **P238 availability census (SHOULD):** live self-record encodeAge
  histogram for a bump-aged character is power-decaying overall with a
  measurable elevation inside bump_windows (Crovitz–Schiffman/Rubin
  analog).
- **P239 reuse calibration (MUST):** run ≥90 sim-days; for each content
  class with ≥50 accesses, R at the class's median reuse gap lands in
  [0.4, 0.7]. The anti-waste audit — fails toward over-retention too.
- **P240 zero-E bound (SHOULD):** E→0 records (attention-gated strays
  that slipped in) archive on the ordinary schedule regardless of
  modifiers — no class is immortal by construction.

## 16. Honest limits (additions)

- The reuse-calibration axiom assumes the world's access statistics are
  stationary; a world whose reuse gaps shift (new venue opens, cast
  turnover) makes P239 a moving target — by design, that's what it's for,
  but treat it as a health metric, not a hard gate, in the first
  calibration passes.
- t_eff conflates "many events" with "many *encoded* events" — a
  character in a sensory-rich but personally-uninvolving crowd doesn't
  encode much. n_events_since counts records, which is the right proxy
  for context drift but understates raw stimulation.
- transformation_gain is the strongest functional liberty this pass:
  the data show remote memories are *relatively* more schematic; that
  gist actively gains storage strength when verbatim dies is our
  compression-efficient reading (a memory that survives verbatim loss
  has effectively been re-encoded as gist). Flagged HYPOTHESIS; P234's
  SHOULD tier reflects this.
- HSAM/SDAM incidence and mechanism are thin literatures (dozens of
  cases); we use them only as profile-space boundary markers, not as
  fitted parameters.
- state_ctx_hl 21d is a guess bounded by lab paradigms (weeks); Morris
  screening (validation §24) should check it's not load-bearing before
  trusting probes that depend on it.

---

# Part IV — v37 deepening: the curve across a life — periods, valence-conditional retention, trauma windows, modality slopes, intrusion decay, latency, and rehearsal tails

Parts I–III fitted the curve's *form* and its modifiers. What remained
untouched: the curve at **biographical scale** (life is not one
interference pool — it is segmented into periods), the **valence**
asymmetry inside the bump windows, the **minutes around a trauma**
where the curve runs backward, the **modality** of the decaying field,
the decay of **intrusion frequency** itself, retrieval **latency** as a
decay observable, and the **feedback loop** that makes rehearsal counts
power-tailed. All claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 17. New primary sources

### 17.1 Autobiographical periods — lives are chaptered — Brown et al. 2012; Brown 2016

Transition theory (TNT; Brown, Hansen, Lee, Vanderveen & Conrad 2012,
*Memory Studies*; Brown 2016 "The Remembering Self"): autobiographical
memory is organized into **periods** delimited by transitions —
immigration, a move, a new job, a relationship's start or end. Periods
are real retrieval structure: transitions cluster vivid memories (the
"firsts" of a new period), cuing one member of a period makes other
same-period memories *more* available, and recall across a period
boundary is impoverished — the structure survives decades
[CONSENSUS direction; the quantitative cues are ours]. Schrauf & Rubin
2001's own account of the relocation bump supplies the mechanism stack:
**novel events + effort-after-meaning encoding + release from proactive
interference + spaced rehearsal** of the new routine [CONSENSUS as the
listed account — §4.1 already implements the window half].

**Spec consequence — periods are first-class (new §4.18).** Every record
gets a `period` id. `registerTransition(charId, kind)` — fired by the
world layer on moves, job changes, relationship starts/ends, deaths in
the household — does four things: (a) mints a new period id and stamps
it on subsequent records; (b) **resets n_sim pools** — life-scale
release-from-PI, the biggest single win of the TNT account (the first
week at the new job competes with nothing); (c) records encoded within
`trans_win` (±14d) of the transition get E × `(1 + trans_bound_gain)`
(0.2 — novelty + effort-after-meaning) and, if valence > 0, join the
bump_windows list (generalizes the v2.2 migration clause to all
transitions); (d) retrieval pays `xperiod_pen` (0.15) on cueMatch when
the active period differs from the record's, while a same-period match
gets `period_prime` (0.1). Emergent: a character's "before the divorce"
memories stay vivid at the boundary, then blur as a pool; the new life
literally outcompetes the old for cues. Probe P368/P369.

### 17.2 The bump is for positive events only — tighten the gate — Rubin & Berntsen 2003; Berntsen & Rubin 2004

Rubin & Berntsen 2003 (*Psychology and Aging* 17:636, N=1,241): the
reminiscence bump exists for **happiest and most important** memories
but saddest/most-traumatic memories show a **monotonically declining**
distribution — no bump. Happy involuntary memories outnumber unhappy
2:1 and only the happy ones bump. Berntsen & Rubin 2004 (*Memory &
Cognition* 32:427, N=1,485): the bump window holds only for positive
transitional life-script events; negative events have no culturally
expected timing [CONSENSUS — replicated cross-culturally, e.g.
Zaragoza Scherman et al. 2015].

**Spec consequence — gate hardening.** §4.1's `bump_valence_gate` is a
boolean with a `bump_self_thresh` OR-branch — too loose. v37: the OR
becomes AND-gated on sign — `bump_gain` applies only when
`valence ≥ bump_pos_min` (0.15). Self-relevant *negative* records get
**no β relief**; their survival must come from arousal floor (§4.1) and
rumin_k/co-rumination rehearsal (§4.13), which is exactly the human
pattern — painful memories survive through *rehearsal and floor*, never
through the life-script window. Also applies to transition windows
minted by §4.18: a breakup mints a period boundary and a PI release
but only positive records inside `trans_win` get the bump multiplier.
Probe P369b folded into P369.

### 17.3 Ribot's gradient — the curve runs backward across trauma — Ribot 1882; Squire & Alvarez 1995; Russell & Smith 1961

Ribot's law (*Les maladies de la mémoire* 1882): retrograde amnesia is
**temporally graded** — memories formed minutes-to-days before the
injury are lost, remote memories survive; the gradient reflects
unconsolidated traces dying before they stabilize (Squire & Alvarez
1995 review: graded RA in amnesic patients; mechanism DEBATED —
consolidation vs retrieval-access accounts). The mirror is post-
traumatic amnesia: the *anterograde* window after the injury encodes
little, and PTA duration is itself a clinical severity measure
(Russell & Smith 1961) [CONSENSUS phenomenon; magnitude modelled].

**Spec consequence — two graded windows around `trauma:true` events
(new §4.19).** On minting a trauma record (arousal ≥ trauma_thresh):

```
retrograde: for each record with (t_trauma − createdDay) ∈ [0, retro_window]:
    strength *= 1 − retro_loss·(1 − gap/retro_window)
        retro_window = 0.02d (~30 min), retro_loss = 0.5
    // the nearer the blow, the deeper the erasure; 30+ min old = safe
anterograde: for pta_window (0.02d) after the trauma event, all new
    encodes get E *= (1 − pta_loss)     pta_loss = 0.4
```

Both are one-shot adjustments, not new decay classes — the graded hit
and the encoding discount then ride the normal curve. Emergent: after
the accident, a character keeps the day but loses the approach — "the
last thing I remember is leaving the house" — and remembers the next
half hour only thinly. This is the *minute-scale* complement to the
day-scale §4.6 consolidation window. Probe P370.

### 17.4 Quiet wake earns consolidation credit — Dewar et al. 2012

Dewar, Alber, Butler, Cowan & Della Sala 2012 (*Psychological Science*
23:955): 10 min of eyes-closed wakeful rest after learning a story
boosted retention **at 7 days**, with no retrieval in between —
interference avoidance plus automatic replay (Carr, Jadhav & Frank
2011 hippocampal replay; Tambini, Ketz & Davachi 2010 sustained
encoding-related activity predicting retention) [CONSENSUS effect;
replay mechanism moderately supported].

**Audit first:** v2.4 already priced the R side — the `rested` flag +
`rest_gain` 0.12 strength bump at `rest_window` (0.007d, frozen) close
(§2, encoding-mechanics.md). What is NOT priced: Dewar's Experiment 2 —
the 7-day benefit persists **without any intervening retrieval**. A
benefit that survives with zero re-access is a storage-strength (S)
phenomenon, not an accessibility one — replay consolidates the trace
itself.

**Spec consequence — rest is an S-channel event.** At `rest_window`
close, a `rested` record additionally gets
`storageS += rest_s_gain·(1 − storageS)` (`rest_s_gain` 0.1, ~⅓ of the
R-side bump — consolidation, not rehearsal; S is the layer that
survives archival per §4.4). Second leg, completing the interference-
avoidance account: a record `rested` at birth is **exempt from n_sim
accrual for its first day** — the quiet window is when the trace
stabilizes, so the first day's similar events don't pile PI onto it
(this is the mechanism Dewar et al. themselves propose: rest protects
from *interfering incoming information*). Emergent: the character who
broods on the bench after the argument keeps it better *forever*, not
just tonight — and the one who rushes back to work both forgets it and
lets the next three meetings blur it. Probe P371.

### 17.5 Modality changes the slope — Herz & Engen 1996; Chu & Downes 2000; Willander & Larsson 2007

The decay literature is almost entirely verbal/visual. The exception
class is olfaction: odor-recognition memory is **flat over weeks-to-
years** (Engen & Ross 1973 — odor recognition barely declines from
30s to 30 days; Herz & Engen 1996 review), odor-evoked autobiographical
memories are **older and more emotional** than verbally-cued ones
(Willander & Larsson 2007 — odor cues reach further back, the Proust
effect quantified), and odor outperforms word, picture, and touch as a
retrieval cue (Chu & Downes 2000) [CONSENSUS direction; effect sizes
varied]. Auditory-verbal content (names, numbers, wording) sits at the
fast end — §7.4's quote class is the extreme. Melodic content resists
decay (songs survive dementia — supporting cite, Margulis; Cuddy &
Duffin 2005).

**Spec consequence — modality slopes on verbatim fields.** Verbatim
fields gain a `mod` tag (`olf|vis|verb|aud`, default verb) and β
multiplies by `k_mod`: `k_olf` 0.6, `k_vis` 1.0, `k_verb` 1.25,
`k_aud` 1.1. Olfactory cue overlap on §5.7's scan additionally gets
`olf_cue_gain` (1.3) and can reach archived records at
`resurrect_thresh − 0.1` — smells resurrect what words cannot (folds
into the existing `sensory_age_slope`, which now has a slope reason).
Emergent: the smell of a former partner's perfume ambushes a memory the
character could not voluntarily produce — and the *name* attached to it
is long gone. Probe P372.

### 17.6 Intrusion frequency is itself a decay curve — Holmes & Bourne 2008; Iyadurai et al. 2018/2023

Post-event intrusive memories are near-universal and **decay over
days-to-weeks in healthy samples** — the natural history is a
declining intrusion rate, not a stable one (Holmes & Bourne 2008
review; Iyadurai et al. 2018 *Molecular Psychiatry* — intervention in
the first 6h cuts week-1 intrusions; Iyadurai et al. 2023 ICU RCT:
week-4 median 1 vs 10 intrusions in the delayed arm; the 2024
preregistered meta-analysis of 134 articles, 12,074 participants puts
the modulation effect at g≈0.16 [CONSENSUS that intrusion frequency
declines and is modulable early; exact half-life unmeasured — ours is
a fit]). Persistence past weeks is the PTSD signature [CONSENSUS].

**Spec consequence — intrude_w decay (§5.7 formalization).** Each
episodic record gains `intrude_w` = `arousal·(1 + trauma_bonus)`
(trauma_bonus 1.0) at birth, decaying
`intrude_w *= exp(−Δt/intrude_hl)` per tick: `intrude_hl` 7d default,
90d on `trauma:true`, ∞ under a `ptsd` profile modifier. The scan's
per-record surfacing drive is `intrude_w · cueMatch_ext` in place of a
flat intrusion_thresh discount — traumatic records start hot and cool;
ordinary records were never intrusive. Each surfaced intrusion still
re-stamps arousal (v2.2) — the persistence loop is now *priced*: a
trauma record's reboost fights a 90-day half-life and approximately
wins; a normal record's doesn't. Probe P373.

### 17.7 Latency is a decay observable — Anderson 1982; Jost; Nelson & Narens 1980

Retrieval **time** follows the same family as retrieval probability:
practice/aging slow recall on a power schedule (Anderson 1982; the
fan-effect latency literature; Nelson & Narens 1980 — metamemory and
latency co-vary, TOT states occupy the long tail). A weak record isn't
just less likely to surface — when it does, it arrives late
[CONSENSUS direction; latency function parameters ours].

**Spec consequence — priced latency (new §5.25).** `recall` returns
`latency_ms` alongside the Reconstruction:

```
latency_ms = min(lat_cap,
    lat_base · R^(-lat_pow) · (1 + lat_search·n_sim/10))
lat_base 400ms, lat_pow 0.6, lat_search 0.4, lat_cap 5000ms
```

`latency_ms ≥ lat_cap` renders as a TOT/hesitation event (ties to
§5.16 — the TOT machinery gains an arrival-time surface). `n_sim`
enters because searching a crowded cue bucket is slow, not just
uncertain — the 40th-commute problem felt in real time. Dialogue layer
consumes this for beat-level hesitations and "give me a second"
beats; validation uses it as a second observable channel on R
(falsifies decay calibration independently of hit rate). Probe P374.

### 17.8 Rehearsal is preferential-attachment — the tail of told stories — Simon 1955; Anderson & Schooler 1991

§4.13's retell draw is memoryless: every live record draws p_retell
fresh. But a story already told is *more* likely to be told again —
established tellings have practiced scripts, social permission, and
incorporated audience reactions (§6.24 canonization machinery already
assumes this). Anderson & Schooler's need statistics are power-tailed
precisely because access begets access; Simon 1955's preferential-
attachment mechanism generates the same tails [CONSENSUS that reuse
distributions are power-tailed; the attachment mechanism applied to
retellings is HYPOTHESIS — the honest reading].

**Spec consequence — PA term on §4.13:**

```
p_retell *= min(pa_cap, 1 + pa_gain·ln(1 + retrievalCount))
    pa_gain 0.3, pa_cap 3.0
```

Emergent: a handful of records absorb most of a character's rehearsal
economy — the canonical stories ("how I got to the Mission," "the
night of the fire") rehearse themselves toward permastore while the
median autobiographical record gets its one or two tellings and rides
the β slope. This is the missing engine behind §6.24's canonization
threshold and P126's flatness mechanism — previously emergent, now
endogenously concentrated. Probe P375.

### 17.9 Remembered emotion is reconstructed — Levine & Safer 2002; Robinson & Clore 2002

Levine & Safer 2002 (*Current Directions*; also Levine, Lench &
Safer 2009): recalled emotion **drifts systematically toward current
appraisal** — people remember how they *should* have felt given what
they now believe about the event, not how they felt; the bias grows
with retention interval as episodic affect detail fades. Robinson &
Clore 2002 (*Psychological Bulletin*): short-delay emotion reports
access episodic detail; long-delay reports increasingly substitute
**semantic/belief-based** knowledge (identity, current attitudes)
[CONSENSUS — the accessibility model of emotional self-report].

**Spec consequence — affect report is a blend (§5.5 revision).** When a
Reconstruction reports the record's `emotional` tag, the emitted
valence is

```
reported_valence = w·v_stored + (1−w)·v_appraisal
w = min(1, strength · aff_recon_scale)     aff_recon_scale ≈ 2.0
v_appraisal = current evaluative sign toward the event's participants/
    topic (PersonModel eval dim, or record's `meaning` field for
    selfdef records — §6.34 anchors supply it)
```

`v_stored` itself still fades per §4.5 — the *stored* trace decays
toward zero while the *reported* value decays toward the present
opinion, which is the human datum: the ex-friend's betrayal is
remembered as mild because they're reconciled now — or hotter because
they're enemies now (the pull is signed by *current* valence). Probe
P376. This gives §6.17 consistency-pull a second, affective channel
that is sign-correct by construction.

### 17.10 Encoding language is a stable context cue — Schrauf & Rubin 1998; Marian & Neisser 2000

Schrauf & Rubin 1998 (*JML* 39:437): bilingual immigrants' memories
surface preferentially in the **language used at encoding** — pre-
migration memories came in Spanish, post-migration in English, in both
test languages. Marian & Neisser 2000 replicate: interview-language ×
encoding-language match boosts autobiographical access [CONSENSUS —
small-to-moderate effect]. The Mission's cast is bilingual; this is a
cheap, characterful cue.

**Audit:** §5.2 already carries a `lang_mismatch` (0.6) attenuation on
the verbal/topic/people channels (v1.9). What is missing: the modifier
is flat — no bilingual modulation, and Schrauf & Rubin's balanced-
speaker data show cross-language retrieval is nearly free for balanced
bilinguals.

**Spec consequence — bilingual balance dial.** `lang_mismatch`
interpolates toward 1.0 by the profile modifier `bilingual_bal`
(0..1): effective `lang_mismatch_eff = 1 − bilingual_bal·(1 −
lang_mismatch)`. A Mission lifer who thinks in two languages crosses
freely; a recent monolingual migrant's pre-migration memories are
language-locked — Schrauf & Rubin's "20% of memories internally in the
other language" is the balanced-bilingual tail, not the default.
Ambients default bilingual_bal 0.3. Probe P377.

### 17.11 Supporting citations (no new mechanism)

- **Rubin, Wetzler & Nebes 1986** — first bump observation in
  Crovitz–Schiffman data; cited inside §4.1 already, now sourced.
- **Conway & Pleydell-Pearce 2000** self-memory system — periods/lifetime
  periods as the retrieval hierarchy level our `period` id implements.
- **Thomsen & Berntsen 2008** — life-story chapters; independent route
  to the same partition.
- **Jost 1897** — already the axiom; §17.7 latency inherits it.
- **Cuddy & Duffin 2005** — music in dementia; supports the k_aud
  conservative slope, no param.
- **Iyadurai et al. 2024** (preregistered meta, 134 articles) —
  intrusion modulation g≈0.16; supports the `intrude_hl` early-window
  being the effective intervention window.

## 18. Spec deltas (v3.5 → v3.6)

|| # | Change | Grounding |
||---|---|---|
|| C28 | NEW §4.18 autobiographical periods: `period` field, `registerTransition(charId, kind)` — new period id + n_sim pool reset (life-scale release-from-PI) + `trans_win` 14d E boost `trans_bound_gain` 0.2 + bump-window minting (positive records only) + `xperiod_pen` 0.15 / `period_prime` 0.1 | §17.1 |
|| C29 | §4.1 gate hardening: `bump_valence_gate` becomes `valence ≥ bump_pos_min` 0.15 AND-sign — negative self-relevant records get no β relief anywhere | §17.2 |
|| C30 | NEW §4.19 trauma micro-windows: graded retrograde hit (`retro_window` 0.02d, `retro_loss` 0.5) + anterograde `pta_window` 0.02d `pta_loss` 0.4 | §17.3 |
|| C31 | §2 `rested` (v2.4) extended: +`rest_s_gain` 0.1 storageS bump at window close + first-day n_sim accrual exemption (S-side of Dewar's no-retrieval benefit) | §17.4 |
|| C32 | §4.1/§5.7: verbatim `mod` tag + `k_olf` 0.6 / `k_vis` 1.0 / `k_verb` 1.25 / `k_aud` 1.1; `olf_cue_gain` 1.3 + lowered archive-reach threshold for olfactory cues | §17.5 |
|| C33 | §5.7: `intrude_w` per-record weight (`intrude_hl` 7d / 90d trauma / ∞ ptsd-modifier) replaces the flat −0.15 discount | §17.6 |
|| C34 | NEW §5.25: `latency_ms` output — power-of-strength + n_sim search cost, `lat_cap` → TOT surface | §17.7 |
|| C35 | §4.13: preferential-attachment retell `pa_gain` 0.3 capped `pa_cap` 3.0 | §17.8 |
|| C36 | §5.5: reported `emotional.valence` blended toward current appraisal by strength-scaled `aff_recon_scale` 2.0 | §17.9 |
|| C37 | §5.2: `lang_mismatch_eff` interpolates toward 1 by `bilingual_bal` (extends the existing v1.9 lang clause; no new cue field needed) | §17.10 |

New MemoryParams (all optional, defaults above): `trans_win`,
`trans_bound_gain`, `xperiod_pen`, `period_prime`, `bump_pos_min`,
`retro_window`, `retro_loss`, `pta_window`, `pta_loss`, `rest_s_gain`,
`k_olf`, `k_vis`, `k_verb`, `k_aud`,
`olf_cue_gain`, `intrude_hl`, `trauma_bonus`, `lat_base`, `lat_pow`,
`lat_search`, `lat_cap`, `pa_gain`, `pa_cap`, `aff_recon_scale`,
`lang_pen`→dropped (v1.9 `lang_mismatch` exists), `bilingual_bal`.
New record/Event fields: `period`, `mod`, `intrude_w`. New contract
op: `registerTransition(charId, kind)`.

## 19. Retention table — added rows (defaults, game days)

|| record class | half-life | R@1d | R@7d | R@30d | R@365d |
||---|---|---|---|---|---|
|| olfactory verbatim field (E .6) | 2.2d | .42 | .20 | .09 | .02 |
|| verbal verbatim field (E .6, same record) | 1.4d | .34 | .13 | .05 | .01 |
|| post-transition record (period reset + E boost) | 4.4d | .52 | .33 | .19 | .08 |
|| matched non-transition record | 3.6d | .42 | .24 | .12 | .05 |
|| pre-trauma record at 5min gap | — | .21 | .11 | .05 | .01 |
|| intrusion weight (non-trauma, arousal .7) | 7d | ~.5 rel | .25 | .03 | ~0 |
|| intrusion weight (trauma flag) | 90d | .7 | .65 | .55 | .24 |
|| canonical retold story (10 retells, PA on) | — | .85* | .8* | .7* | .5* |

*PA-driven retell accumulation; the tail of a heavy-tailed rehearsal
distribution, not a curve constant.

## 20. New probes P368–P377

- **P368 transition mints period (MUST):** `registerTransition` →
  subsequent records carry new `period`; first-post-transition record's
  n_sim pool starts at 0 (measured, not assumed) and its E exceeds a
  matched non-transition record's by ~trans_bound_gain. Sign-locked:
  the release-from-PI leg must show post-transition records out-
  retaining pre-transition same-class records at equal age.
- **P369 cross-period penalty (MUST):** two equal-strength records,
  retrieval context in period B — the period-B record out-recalls the
  period-A record by ≥xperiod_pen worth of hit-rate margin; negative-
  valence records inside a transition window must NOT show the bump
  β relief (valence gate sign-lock, §17.2).
- **P370 Ribot gradient (MUST):** records at 2min / 15min / 60min /
  2h before a trauma mint → strength loss graded monotone, ~50% at
  contact, ~0 at retro_window; encodes inside pta_window show
  E reduced ~40% and recover after the window.
- **P371 rest S-coupling (SHOULD):** `rested` records show measurable
  storageS advantage over matched unrested at 7d WITH zero intervening
  retrievals (R-side audit cannot explain it — Dewar Exp. 2 analog);
  first-day n_sim stays 0 under same-cue-bucket encodes; must NOT
  exceed the sleep-tick benefit (Jenkins & Dallenbach ordering).
- **P372 modality split (MUST):** same record's olfactory verbatim
  field outlives its verbal field by ≥1.5× at 30d; an olfactory-only
  cue resurrects an archived record that a verbal cue cannot reach at
  equal cue overlap. Constrains k_olf, olf_cue_gain.
- **P373 intrusion decay (MUST):** post-event involuntary surfacing
  rate halves by ~7d for non-trauma arousal-.7 records and stays
  ≥50% of birth rate at 30d for trauma:true records; each intrusion
  reboosts (persistence loop must be observable).
- **P374 latency channel (SHOULD):** recall latency is monotone
  decreasing in R and increasing in n_sim; ≥lat_cap events surface as
  TOT (§5.16 state, not a silent null); latency predicts next-attempt
  FOK calibration within noise.
- **P375 rehearsal tail (SHOULD):** 90 sim-days with PA on — the
  retrievalCount distribution is heavy-tailed (top-decile records hold
  ≥40% of all retells vs ≤20% with pa_gain=0); canonical records
  correlate with §6.24 frozen stories. Constrains pa_gain/pa_cap.
- **P376 affect reconstruction (MUST):** reported valence for a 90d-old
  record shifts ≥30% toward current appraisal while the stored tag
  stays unchanged; a 1d-old record reports ≈stored valence. Sign-locked:
  reconciled-relationship case must report milder, estranged case hotter.
- **P377 language cue (SHOULD):** cue in the non-encoding language hits
  ~lang_mismatch less often at equal overlap; `bilingual_bal` 1.0
  attenuates the cost toward zero (sign-locked attenuation, never a
  bonus); monolingual profile = full v1.9 cost.

## 21. Honest limits (additions)

- The period model treats transitions as instantaneous mints; real
  transitions smear over weeks (the move, the job, the relationship
  each have soft boundaries). `trans_win` 14d absorbs the smear at one
  cheap width; a two-sided ramp was rejected for parameter economy.
- Ribot magnitudes are clinical-fit guesses: retrograde windows in
  patients range minutes to *years* (the long gradients are disputed,
  possibly retrieval-deficit artifacts). We take the conservative
  short end — RW characters are healthy brains under acute stress,
  not amnesic patients.
- `intrude_hl` 7/90d has no direct fitted source — the natural-history
  literature measures week-1/week-4 frequencies, not a rate constant.
  P373 is a MUST-tier *shape* test; the constants are SHOULD-tier
  calibration targets.
- `latency_ms` is a display/validation channel, not a scheduling
  constraint — the game must not feed it back into θ.
- The PA term makes retell probability path-dependent; combined with
  the retell ecology's Bernoulli placeholder this can overheat if the
  real conversation engine also feeds retrievalCount — when the social
  engine lands, pa_gain should be re-fit against P239 (reuse
  calibration), not against the draw.
- `bilingual_bal` rides the existing v1.9 clause; on a monolingual
  character it is inert (lang_mismatch_eff = lang_mismatch). The
  Mission's bilinguals make it load-bearing — profile layer owns who
  is bilingual and how balanced.
- Robinson & Clore's episodic/belief split maps cleanly onto our
  strength-weighted blend only because `meaning` and PersonModel evals
  already exist as appraisal sources; where neither exists, v_appraisal
  falls back to v_stored — no fabrication.

---

# Part V — v49 deepening: the channel curves — what outlives what

Parts I–IV priced *when* records decay and *who* decays them. What none
of them priced is that a "record" is a bundle of channels on different
clocks — the observable forgetting curve is a composite of autonoetic
detail, bare familiarity, self-knowledge, temporal order, and residual
skill, each with its own rate and its own failure cause. This pass
splits the composite into its channels, prices four missing classes
(personal semantics, dreams, cognitive skills, fired intentions), adds
the remember→know conversion, and corrects two earlier overstatements
(C19's flat procedural claim; the implicit channel never landed in the
decay table). Claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 22. New primary sources

### 22.1 Personal semantics — the skeleton autobiography — Renoult et al. 2012; Grilli & Verfaellie 2014

Declarative memory's missing tier (Renoult, Davidson, Palombo,
Moscovitch & Levine 2012, *TiCS* 16:550, PMID 23040159): **personal
semantics** — knowledge of one's own past without re-experiencing it
("I grew up in Fresno," "I was a barista for two years"). It dissociates
from episodic memory in amnesic patients who produce a "skeleton
autobiography" with intact self-facts but no recollection (Cermak &
O'Connor 1983, patient SS; Grilli & Verfaellie 2014/2016) [CONSENSUS
that PS is a distinct, more durable channel; taxonomy details DEBATED].
This is the missing layer between our episodic records and generic
semantic facts — and it is exactly the phenotype the `sdam` modifier
needs: Palombo's SDAM subjects *have* personal semantics; what they lack
is re-living.

**Spec consequence — semanticization mints (new §4.23).** When an
episodic record with `selfRelevance ≥ ps_gate` (0.5) AND
`retrievalCount ≥ ps_recount` (2) archives — or survives to
`permastore_age` — mint a `persSem` semantic record carrying the
self-fact content ({topic, place, people, period, gist text}) at
strength `ps_transf` (0.5)·gistS, no verbatim fields, no `intrude_w`,
conf high (it reports as *knowledge*, not memory). `persSem` records
ride `β_semantic`, are exempt from the amnesia ramp and §4.3 merging,
and qualify for §4.7 permastore like any semantic. The episode can die
while the fact survives — "I don't remember the wedding, but I know it
was at City Hall." Consequences beyond fidelity: (a) `sdam` characters
mint persSem normally — their deficit is confined to the autonoetic
channel (22.2); (b) narrative identity stops depending on episodic
survival — the character's biography is semantic infrastructure, not a
lucky handful of survivors; (c) persSem records are still
*reconstructive* — they drift through §6 correction paths like any
semantic, so an old self-fact can be wrong (Kopelman cases; Conway's
life-schema argument) [mechanism CONSENSUS, mint rule ours —
HYPOTHESIS].

### 22.2 Two channels, two failure causes — Yonelinas & Levy 2002; Sadeh et al. 2014

Yonelinas & Levy 2002 (*Psychon. Bull. Rev.* 9:575): recollection and
familiarity decay at **different rates over short retention intervals**
— remember judgments fall steeply while familiarity-based responding is
comparatively stable. Sadeh, Ozubko, Winocur & Moscovitch (2013 review;
2014 *Psych. Sci.* 25:2090 experiment) push the sharper claim: the two
channels forget for **different reasons** — recollection-based traces
(orthogonal, hippocampal) fail by *decay*; familiarity-based traces
(extrahippocampal, overlapping) fail by *interference* [the rate split
is CONSENSUS; the cause split is DEBATED — Wixted's single-process
models account for the same data]. Gardiner & Java's remember/know
literature supplies the observable: records convert phenomenologically
from "remember" to "know" as recollective detail dies — "I remember
being there" becomes "I know I was there."

**Spec consequence — the channel pair (§4.23 + §5.x).** Derive two
channel weights per live record: `recol_w` = mean strength of surviving
verbatim fields × (1 if episodic, 0 if persSem/semantic); `fam_w` =
gist leg strength × (1 + impl_fam_w·impl_str). Report flavor:
a Reconstruction's phenomenology tag is `remember` iff `recol_w ≥
rk_thresh` (0.3); below it the emission is `know` — content fluent,
detail thin, latency low (familiarity responds fast; the slow search
was the recollective one — folds into §5.25 via `recol_w` replacing R
in the latency formula's search term). Interference asymmetry
(DEBATED, adopted mild): §4.2's pairwise suppression reads the
channel — suppression applies `× recol_interf_mult` (0.7) against
`recol_w` and `× fam_interf_mult` (1.3) against `fam_w`. A crowded cue
bucket kills the "sorta familiar" first; the vivid recollection is
immune to its neighbors but not to time — which is why the one
technicolor memory survives a thousand blurry ones. `selfdef` records
never emit `know` (anchor floor keeps recol_w above rk_thresh — the
self-defining memory is defined by being *remembered*, not known).
Probe P504/P505.

### 22.3 Order decays before content — Friedman 1993; Underwood 1977

The temporal-order literature (Underwood 1977 — recency discrimination
degrades rapidly; Friedman 1993 *Psych. Bull.* 114:44 review; Friedman
2004): people rarely *retrieve* a timestamp; they **reconstruct** order
from distance impressions, landmarks, and scripts. Near-simultaneous
events lose order quickly even when both items are retained; widely
separated events keep order via period/chapter structure. Order is the
fastest-dying relational information — characters will know both things
happened and genuinely not know which came first [CONSENSUS
phenomenon; the reconstruction model is the standard account].

**Spec consequence — `orderRecall(a,b)` (new §5.40).** Order is never
stored; it is computed:

```
t̂_i = reconstructed encodeDay of record i (§6.x when-drift machinery)
σ_pair = order_sigma · (1 + order_decay·mean(1 − R_a, 1 − R_b))
P(correct order) = Φ( (t̂_b − t̂_a)/σ_pair )
```

`order_sigma` 0.35 (normalized), `order_decay` 1.5 — decayed records
blur toward chance even while both survive. Same-period, same-day
pairs short-circuit: P = `order_script_p` (0.5) directed by script
prior ("the argument came before the walkout — that's how fights go")
— meaning atypical orders are *systematically* reversed, not just
noised. Order claims emitted in dialogue must route through this —
no free `createdDay` reads. Emergent: "did she quit before or after
the lease fight?" is a coin flip at distance even with both memories
live, and the character's answer is schema-shaped. Probe P506.

### 22.4 Dream records — the minutes-scale class — Koukkou & Lehmann 1983; Koulack & Goodenough 1976

The steepest forgetting curve in the model is the one that was never
priced: dream memory. Koulack & Goodenough's arousal-retrieval model
(1976, *Psych. Bull.* 83:975): dream content transfers to long-term
storage only through a **wakeful arousal** — sleep without arousal
doesn't store, and content not retrieved near waking is gone within
minutes (Koukkou & Lehmann 1983 functional state-shift hypothesis —
low-activation states write to low-activation stores inaccessible from
wake). Diary-paradigm work shows the flip side: dreams that *are*
encoded at wake then decay like ordinary waking events [CONSENSUS:
wake-transfer gate + minutes-scale decay; dream content generation
itself is out of scope]. Deferred in emotional-memory §25 — claimed
here.

**Spec consequence — `dream` source class (new §4.24).** Each
`dailyMemoryTick` (sleep event): mint `Poisson(dream_mint λ)` ≈ 1–2
dream records at E = `dream_salience`·0.15 (world/story layer supplies
salience — a nightmare scores high), `tau_dream` 0.004d (~6 min),
`beta_dream` 1.2, `source:"dream"`, verbatim thin by birth. At the wake
tick, each live dream record rolls `dream_recall_p` = `dreamRecall`
trait (0.02–0.5, default 0.1; vivid/fantasy-loaded profiles high) ×
(1 + 0.5·dream_salience): success → re-encode as ordinary low-E
episodic, `source:"dream"` retained, `conf` ceiling 0.4 and
plausibility-flagged; failure → archives immediately and is
unreachable below `resurrect_thresh` even for olfactory cues. A
dream record that crossed wake-encoding participates in all normal
machinery — including §6.9 reality-monitoring slips under high
`fantasy`/`confab_fill` (the character who isn't sure it was a dream).
Emotional content can still feed §4.9 CondEntry acquisition at
`dream_cond_mult` (0.3) — the nightmare leaves a trace on the body it
never left on the record [mechanism CONSENSUS, all magnitudes ours —
HYPOTHESIS]. Probe P507.

### 22.5 Skill decay is real — correcting C19 — Arthur et al. 1998

Part II declared procedural "near-zero by design" on the strength of
motor-skill longevity. The actual meta-analysis — Arthur, Bennett,
Stanush & McNelly 1998 (*Human Performance* 11:57; 189 data points,
53 studies) — shows **substantial skill loss over nonuse**: effect
sizes from d ≈ −0.01 immediately to **d ≈ −1.4 beyond 365 days**.
Moderators: physical/natural/speed-based tasks decay least; cognitive/
artificial/accuracy-based tasks decay most; overlearning protects;
recognition-style retrieval preserves more than recall [CONSENSUS —
meta-analytic]. C19's blanket β_proc = 0.02 was right for riding a
bike and wrong for a forgotten software workflow.

**Spec consequence — split the procedural map (§1).** Each
`{skill: level}` entry gains a `kind` tag (`cont|cog`):
`beta_proc_cont` 0.02 (walk-routes, bike handling, knife work,
familiar-software *fluent gestures*) vs `beta_proc_cog` 0.12
(discrete-sequence procedures, exam technique, a rarely-used admin
workflow, backup-caretaking tasks — accuracy-based per Arthur).
`skill_overlearn`: skills at `level ≥ 0.8` or `uses ≥ 50` decay at
β×0.5. `relearn_gain` applies to both (savings is the durable part —
the meta's reacquisition findings agree). Job decay consequence for
world-builder: a main who hasn't bartended in a year keeps the floor
presence (cont) but fumbles the POS system (cog). Corrects C19.
Probe P508.

### 22.6 Sleep consolidates intentions too — Scullin & McDaniel 2010

Scullin & McDaniel 2010 (*Psych. Sci.* 21:1028, "Remembering to
execute a goal: sleep on it!"): goal execution after a 12h **sleep**
delay matched a 20-min delay and crushed the 12h wake delay — sleep
actively strengthens the intention–cue link. Diekelmann et al. 2013
(*SLEEP*, "Sleep to implement an intention") localize it to SWS;
Scullin et al. 2019 (*zsz003*) show SWS facilitates spontaneous PM
retrieval [CONSENSUS direction]. Our §4.6 sleep machinery consolidates
retrospective records only — intentions sat outside it despite being
the class that needs it most.

**Spec consequence — cueBind consolidation (§9).** Intention records
gain `cueBind` ∈ [0,1] (init 0.4·(focal?1.2:1)). At each sleep tick,
armed intentions get `cueBind += pm_sleep_gain·sleepQuality·(1−cueBind)`
(`pm_sleep_gain` 0.2). At fire time, the §5.14 monitor/clock rolls
multiply by `cueBind` — the slept-on intention is stickier, not just
younger. Emergent: "sleep on it" literally works — the errand armed
Monday survives Friday better if the nights were good; an insomniac
character's intentions leak [mechanism CONSENSUS; coupling strength
ours]. Probe P509.

### 22.7 Unethical amnesia — vividness channel only — Kouchaki & Gino 2016, honestly bounded

Kouchaki & Gino 2016 (*PNAS* 113:6166, PMID 27185941; 9 studies,
N≈2,100): memories of one's own unethical acts are remembered **less
clearly and vividly** than ethical or merely-negative acts — "unethical
amnesia," proposed as the engine of serial dishonesty. Stanley, Yang &
De Brigard 2018 (*Mem. Cogn.*): three studies, N≈700 — **no accuracy
effect**; the original conflates phenomenology with accuracy [the
vividness/clarity finding is real but modest; the accuracy claim fails
replication; we adopt only the phenomenology arm, DEBATED].
Adjacent machinery already exists: `mnem_neg` (cast-profiles §8.2,
Sedikides & Green) is a recall-mode trait; this is the decay-side arm.

**Spec consequence — `transg` flag + vividness channel.** Records of
the character's *own* norm violations (minted when `deceptive` OR
`harmOther` + `selfRelevance ≥ 0.5` + dissonance against the §6.34
self-model — the world tagger supplies `transg:true`) get
vividness-decay `× transg_vivid_mult` (1.3) scaled
`×(0.5 + 0.5·defens)` — defensive profiles obfuscate more. **Locked
nulls:** no effect on verbatim accuracy, gist, or storageS (Stanley
arm — the memory *fades in vividness*, it does not falsify); no effect
on semanticized persSem minting (the fact "I stiffed him" survives as
knowledge — the *sting of reliving it* is what dims). Emergent: the
repeat-offender pattern without motivational magic — the swindle feels
murkier to its perpetrator than to its victim, and next week's
threshold is lower. Probe P510.

### 22.8 Fired intentions die fast — Marsh, Hicks & Bink 1998, honestly bounded

Marsh, Hicks & Bink 1998 (*JEP:LMC* 24:350): intention representations
**deactivate after completion** — the executed intention stops
occupying attentional priority. But the aftereffects literature
(commission errors — our §5.33 `deact_window` already models residual
cue-firing; ~25% commission-error rates in old adults) shows the
deactivation is *incomplete and slow* [both findings real; the tension
is the point — DEBATED magnitude]. §7.8 (Part II) noted post-completion
decay "can be faster" without pricing it.

**Spec consequence — `beta_pm_fired` (§9).** On fire/cancel, the
resolved intention record's decay class switches `beta_pm` (0.15) →
`beta_pm_fired` (0.5) — still slower than ordinary verbatim (the
episode happened) but the *armed maintenance* is gone. The
`deact_window` residual-firing channel is unchanged — the two effects
coexist exactly as in the literature: the representation fades fast as
a *record* while its trigger cue still misfires for ~7 days. Emergent:
"I already did that — wait, did I?" — the character checks the sent
folder because the executed intention evaporated while its echoes
keep ringing the doorbell. Probe P511.

### 22.9 Recognition mass — the Standing bound — Standing et al. 1970

Standing, Conezio & Haber 1970 (*Perception & Psychophysics* 8:73);
Standing 1973 (*LM&C* 1:757): after viewing **10,000 pictures**,
recognition stays ~83–94% for days — visual *recognition* has enormous
capacity and slow loss, in flat contradiction to any uniform verbal
curve [CONSENSUS]. This bounds our `k_vis` reading: visual verbatim
fields decay as *recallable detail*, but the visual record's
*familiarity floor* is nearly unkillable.

**Spec consequence — `vis_fam_floor` (§5.28 note).** Records carrying
visual `mod` fields mint a familiarity floor: `fam_w` never drops below
`vis_fam_floor` (0.1) while the record lives — a scene recognized on
revisit ("I've been in this kitchen before") at hit rates no verbal
content matches. Zero cost: it rides the existing famScore channel;
the floor only matters when a re-encountered place is queried, which
is exactly when the Standing effect shows. Probe folded into P504.

### 22.10 Supporting citations (no new mechanism)

- **Friedman 2004** — memory for time is inference over distance and
  landmark structure; basis for orderRecall's reconstruction, not just
  drift.
- **Conway & Pleydell-Pearce 2000** — personal semantics as the
  retrieval scaffold that episodic records hang on; our minted persSem
  records are simultaneously *cues* for surviving episodes (free cue
  vector material).
- **Butler & Watson 1985** — individual differences in dream recall are
  cognitive-trait-like; licenses the `dreamRecall` profile trait.
- **Bugg & Scullin 2013** — completed-intention aftereffects under
  divided attention; binds `beta_pm_fired` and `deact_window` into one
  account.
- **Wixted single-process rejoinder** — keeps 22.2's interference
  asymmetry marked DEBATED rather than promoted.

## 23. Spec deltas (v4.6 → v4.7)

|| # | Change | Grounding |
||---|---|---|
|| C38 | NEW §4.23 channel split: `recol_w`/`fam_w` derived weights; `rk_thresh` 0.3 remember↔know report gate; interference asymmetry `fam_interf_mult` 1.3 / `recol_interf_mult` 0.7 (DEBATED); `selfdef` never emits `know` | §22.2 |
|| C39 | NEW §4.23 `persSem` mint: selfRel ≥ `ps_gate` 0.5 + `retrievalCount` ≥ `ps_recount` 2 on archive/permastore-age → semantic-tier record at `ps_transf` 0.5·gistS; β_semantic, merge/amnesia exempt, permastore-eligible | §22.1 |
|| C40 | NEW §5.40 `orderRecall(a,b)`: order via reconstructed times, `order_sigma` 0.35, `order_decay` 1.5, same-day pairs → `order_script_p` 0.5 schema-directed | §22.3 |
|| C41 | NEW §4.24 `dream` class: `dream_mint` λ, `tau_dream` 0.004d, `beta_dream` 1.2, `dream_recall_p` (trait `dreamRecall` × salience) wake gate, `dream_cond_mult` 0.3 CondEntry feed | §22.4 |
|| C42 | §1 procedural split: `kind:cont|cog`, `beta_proc_cont` 0.02 / `beta_proc_cog` 0.12, `skill_overlearn` β×0.5 — CORRECTS C19 | §22.5 |
|| C43 | §9 `cueBind` field on Intentions + `pm_sleep_gain` 0.2 sleep consolidation; fire rolls × cueBind | §22.6 |
|| C44 | §4: `transg:true` records → vividness `× transg_vivid_mult` 1.3 ×(0.5+0.5·defens); accuracy null LOCKED | §22.7 |
|| C45 | §9 `beta_pm_fired` 0.5 post-resolution decay; `deact_window` unchanged | §22.8 |
|| C46 | §5.28: visual-mod records get `vis_fam_floor` 0.1 on fam_w (Standing bound) | §22.9 |

New MemoryParams (all optional, defaults above): `ps_gate`,
`ps_recount`, `ps_transf`, `rk_thresh`, `fam_interf_mult`,
`recol_interf_mult`, `order_sigma`, `order_decay`, `order_script_p`,
`dream_mint`, `tau_dream`, `beta_dream`, `dream_recall_p`,
`dream_cond_mult`, `beta_proc_cont`, `beta_proc_cog`,
`skill_overlearn`, `cueBind` (field init), `pm_sleep_gain`,
`transg_vivid_mult`, `beta_pm_fired`, `vis_fam_floor`.
New record/Event/contract fields: `persSem`, `transg`, `dream` (source
class), `cueBind`, `dreamRecall` (profile trait), `kind` (skill map);
new contract op `orderRecall(charId, a, b)`; reportMode `remember|know`
on Reconstruction.

## 24. Retention table — added rows (defaults, game days)

|| record class | half-life | R@1d | R@7d | R@30d | R@365d |
||---|---|---|---|---|---|
|| dream, not wake-encoded | ~6 min | ~0 | 0 | 0 | 0 |
|| dream, wake-encoded (E .2) | ~0.3d | .1 | .02 | ~0 | 0 |
|| dream, vivid + high dreamRecall | ~1d | .35 | .12 | .04 | ~0 |
|| persSem record (from archived episode) | semantic | .5 | .49 | .47 | .35 |
|| episodic with dead verbatim — fam_w floor | — | know | know | know | know* |
|| cognitive skill, unused (E .6) | ~120d | .59 | .55 | .44 | .20 |
|| continuous skill, unused (E .6) | permastore-ish | .60 | .60 | .59 | .57 |
|| armed intention, good sleep ×7 | — | .60 | .60 | .50 | — |
|| armed intention, insomnia ×7 | — | .58 | .45 | .30 | — |
|| fired intention record | ~14d | .55 | .35 | .15 | .02 |
|| transg record vividness (defens .6) | — | .8 | .55 | .3 | .1 |
|| same record's accuracy fields | — | unchanged | unchanged | unchanged | unchanged |

*fam_w floor: content reports as familiarity/knowledge, never
autonoetic re-experience — and survives beyond R's death in the
persSem copy.

## 25. New probes P503–P512

- **P503 persSem minting (MUST):** episodic record with selfRel 0.7,
  retrievalCount 3 archives → persSem record exists at ~0.5·gistS,
  survives to 365d, carries NO verbatim fields; `sdam` profile mints
  the same count (identity infrastructure is semantic, not episodic);
  non-selfRelevant records never mint.
- **P504 remember→know conversion (MUST):** a live record emits
  `remember` flavor while recol_w ≥ rk_thresh; once verbatim fields
  die below it, emissions are `know` — detail thin, latency LOW
  (familiarity is fast); `selfdef` records never flip; a Standing
  visual record re-encountered at 365d reports fam_w ≥ vis_fam_floor.
- **P505 channel interference asymmetry (SHOULD, DEBATED-flagged):**
  at equal R, a record in a dense n_sim bucket loses `know`-mode hits
  ~1.8× more than `remember`-mode hits; if the asymmetry fails the
  TOST band, collapse the mults to 1.0 — the rate split survives
  either way.
- **P506 order decay (MUST):** two live same-period records at 30d —
  encode gap 0.1d orders at script level (~0.5, schema-biased, sign-
  locked errors on atypical order); gap 5d stays ≥0.85; content of
  both records intact while order fails — the dissociation is the
  test, not the drop.
- **P507 dream lifecycle (SHOULD):** ≥80% of dream records archive
  by wake+1h; wake-encoded ones decay on the ordinary low-E schedule;
  emitted dream content carries `source:"dream"` low-conf tag; high-
  `fantasy` profiles show occasional dream→real source slips (rate
  bounded ≤5% of dream recalls).
- **P508 skill split (MUST):** cog-kind skill unused 365d loses ~half
  level (Arthur d ≈ −1.0 analog band) while cont-kind is flat;
  `skill_overlearn` halves the cog loss; relearn after loss costs
  <50% of naive acquisition either kind (savings survives).
- **P509 sleep-consolidated intention (SHOULD):** matched armed
  intentions, 12h sleep vs 12h wake spans — the slept one fires ≥15%
  more often on a nonfocal cue; the benefit is lost at sleepQuality
  0.3 (insomnia couples PM failure to the sleep system, not to age).
- **P510 unethical-amnesia bound (SHOULD — sign-locked null):**
  `transg` records' *reported vividness* decays ~1.3× vs matched
  negative records while verbatim accuracy is TOST-equivalent (SESOI
  0.1); defens 0 profile shows no vividness effect; persSem minting
  unaffected (locked null).
- **P511 fired-intention split (SHOULD):** a resolved intention's
  record R@30d < a still-armed twin's; its trigger cue still misfires
  within `deact_window` (both findings coexist — Marsh deactivation
  + commission-error aftereffects).
- **P512 v4.7 regression (MUST — structure):** new fields pass the
  P457 non-interference pattern (`persSem`/`transg`/`cueBind`/`dream`
  steer nothing outside their channels — dreams never feed θ, transg
  never touches accuracy); §12.2 commutativity holds; dream mint is
  pure — zero dream content surfaces without a wake-encode event.

## 26. Honest limits (additions)

- The two-channel recol/fam split inherits the field's biggest
  unresolved fight — single-process accounts (Wixted) fit much of the
  same data. We adopt dual-channel because it produces the human
  observables cheaply (know-reports, Standing floors, interference
  asymmetry); P505's SHOULD tier reflects the live dispute. If it
  fails, the conversion rule (C38's report gate) still stands on
  Gardiner & Java alone.
- persSem minting is a survivorship convenience: real semanticization
  is gradual and the minted fact inherits the episode's distortions
  (it does — via field copy — but a *wrong* gist mints a *wrong*
  self-fact permanently; that is the intended horror, flagged not
  fixed).
- dream_recall_p's trait base (0.1) is calibrated to produce
  remembered-dream rates ≈ weekly for ordinary profiles — Schredl's
  dream-recall-frequency surveys put the population mean near that,
  with heavy trait spread; the magnitudes are fits, the minutes-scale
  gate is the sourced part.
- beta_proc_cog 0.12 maps Arthur's d ≈ −1.4/yr onto our power scale
  loosely — skill-decrement units are d-prime against retraining
  baselines, not retention fractions; the half-life row is a shape
  commitment, not a conversion.
- transg vividness is deliberately invisible to accuracy — a
  replication-bounded choice, not a moral one. If a future version
  wants motivated *content* forgetting, it must cite new evidence;
  the Stanley null stays locked until then.
- cueBind sleep consolidation assumes intentions cross the sleep tick
  once per night; a nap policy (§4.15 machinery) reuses the same gate
  at half gain — no new field.
- orderRecall's Φ uses reconstructed times that already carry when-
  drift — errors compound correctly by construction, but order_sigma's
  0.35 is a fit bounded by same-day script collapse and multi-day
  survival; Morris screening should confirm it's not load-bearing.

---

# Part VI — v61 deepening: the curve re-opens, the crowd forgets together, and the tail is not the intercept

Parts I–V priced the curve's shape, modifiers, biographical scale, and
channel split. What remains unpriced: (a) the fact that **every
successful recall re-opens the trace for editing** — the curve is
punctuated by labile windows, not smooth; (b) the **social** arm of
interference — a teller's omissions suppress the *listener's* related
records, so what a neighborhood stops saying is what it forgets;
(c) sleep consolidation is **selective**, not a blanket; (d) the
similarity-dependence of interference is an **inverted-U** (Osgood's
surface), not monotone; (e) when-drift carries a **signed telescoping
bias**, not just noise; (f) voluntary "let it go" — directed forgetting —
is a real, weaker third operator beside suppression and genericization;
(g) aging adds two asymmetric taxes the current monotone β can't
express — **hyper-binding** at encode and a **late-phase tail
steepening** (ALF). Claims tagged [CONSENSUS] / [DEBATED] /
[HYPOTHESIS] as before.

## 27. New primary sources

### 27.1 Reconsolidation — the curve re-opens after every recall — Nader et al. 2000; Hupbach et al. 2007; Bos et al. 2014

Nader, Schafe & LeDoux 2000 (*Nature* 406:722): a consolidated fear
memory, reactivated by reminder, becomes **labile** — protein-synthesis
blockade during the reactivation window erases it. The human episodic
arm: Hupbach, Gomez, Hardt & Nadel 2007 (*Learning & Memory* 14:47)
showed a spatial reminder makes an old episode **incorporate new
items** — the trace is editable, not just vulnerable. The replication
record is honest to report: the effect is real but boundary-bound —
Bos et al. 2014 (*Neurobiology of Learning & Memory*) and several
Hupbach replications find it fragile, sensitive to reminder strength
and session structure; Wixted's school reads part of the data as
ordinary source confusion [animal reconsolidation CONSENSUS; human
episodic updating real but DEBATED in magnitude/boundary — we adopt
the weak end].

**Spec consequence — labile window (new §4.30a).** Every successful
`recall`/`hearAccount` reboost (§5.9) opens `labile_until = now +
recons_win` (0.25d). While open: (a) §6 drift/misinfo ops against the
record run at ×`recons_drift_mult` (1.5) — the retold memory is when
the rumor actually gets in; (b) an incoming event sharing cue-cluster
can *update* stored fields at `recons_upd_p` (0.3) — Hupbach
incorporation, routed through the normal field-write machinery with a
`lastRewrite` audit stamp; (c) the window cuts both ways — a weak
record (R < recons_risk_gate 0.25) recalled into a conflicting scene
can *lose* strength (`recons_risk` 0.1 of the drift op's magnitude
applies as loss, not edit). Post-window the reboosted strength locks
in. Emergent: retelling is risky — the same act that refreshes the
trace exposes it; the character who rehashes the fight nightly is
slowly narrating a different fight. Probe P637.

### 27.2 Socially shared RIF — the narrator chooses what the town forgets — Cuc et al. 2006/2007; Stone et al. 2012

Cuc, Ozuru, Manier & Hirst 2006 (*Psych. Sci.* 17:939) and Cuc,
Koppel & Hirst 2007 (*Psych. Sci.* 18:727, "Silence is not golden"):
when a speaker recounts *some* details of a shared event and omits
related ones, **the listeners** show retrieval-induced forgetting for
the omitted-but-related material — the speaker's selection suppresses
the audience's unretold memories without any listener effort. Coman,
Manier & Hirst 2009 and Stone, Coman, Brown, Koppel & Hirst 2012
(*Memory Studies* 5:121, "Toward a science of silence") extend it to
conversational propagation — selective narration is a mechanism of
collective forgetting [CONSENSUS phenomenon, replicated; magnitudes
modest].

**Spec consequence — listener-side RIF (§5.8 extension).** The
existing speaker-side RIF (rif_k on same-cluster unretold records)
gains a listener arm: on `hearAccount`/co-narration, each listener's
matching-but-unretold fields/records take rif suppression
×`srif_mult` (0.6 of the speaker dose — the listener wasn't rehearsing,
just tracking). Pool = cue-similar neighbors of the narrated cluster,
same simOp/sim_rif mask. Emergent — the substrate's rumor engine gains
a *forgetting* channel for free: a story that always gets told one way
actively erases the alternative tellings in everyone who keeps hearing
it; the town's consensus version isn't just the loudest, it's the
survivor of everyone's suppressed alternatives. Probe P638.

### 27.3 Sleep is a curator — selective consolidation — Payne et al. 2008; Wilhelm et al. 2011

Payne, Stickgold, Swanberg & Kensinger 2008 (*Psych. Sci.* 19:781):
sleep preferentially preserves **negative/emotional object** memory
relative to neutral backgrounds — the trade-off sharpening across the
night. Wilhelm, Diekelmann, Molzow, Ayoub, Molle & Born 2011
(*J. Neurosci.* 31:1563): memories **expected to be tested/needed**
are selectively consolidated during sleep — relevance expectancy at
encoding acts as a consolidation tag. van Dongen et al. 2012
(*Psych. Sci.*) replicate the expectancy arm [CONSENSUS direction;
magnitudes moderate, rep_shrink applies to SINGLE-literature bands].

**Spec consequence — selective consol (§4.6 revision).** The sleep
tick's consolidation currently applies `consol_beta_mult` uniformly.
v5.9 weights it:

```
consol_sel = consol_sel_w·max(arousal − consol_sel_arous, 0)/(1 − consol_sel_arous)
           + (1 − consol_sel_w)·expRel
effective consol_beta_mult' = consol_beta_mult·(0.5 + 0.5·consol_sel)
```

`consol_sel_w` 0.5, `consol_sel_arous` 0.5; `expRel` is a new Event
flag the world sets when future relevance is *known at encoding*
(a promised retelling, a warning, "remember this for Friday"). Neutral
low-arousal records get half the sleep benefit — the unremarkable day
is what sleep declines to keep. Emergent: the character who is told
"you'll need this" and the one who was frightened both consolidate
preferentially; the forgettable errand stays forgettable. Probe P639.

### 27.4 A sleep between retellings is worth two — Mazza et al. 2016

Mazza, Gerbier, Gustin, Kasikci, Koenig, Toppino & Magnin 2016
(*Psych. Sci.* 27:1321): with total practice held constant, spacing
study sessions **across sleep** doubled retention at 1 week and held
the advantage at 6 months; relearning was also faster — sleep between
sessions is worth sessions. [CONSENSUS direction; single-team
magnitude — rep_shrink.]

**Spec consequence — sleep-span bonus (§4.11).** `lag_mult` gains a
bounded multiplier `× (1 + sleep_span_gain)` (0.15) when the gap
between re-accesses crosses ≥1 sleep tick, applied at matched
wall-clock gap — it stacks with the log-normal optimum, it does not
replace it. Emergent: "let me sleep on it" is literally the optimal
rehearsal gap; the character who retells the story to a different
friend each *day* outconsolidates the one who retells it three times
at the same dinner. Probe P640.

### 27.5 Osgood's surface — interference is an inverted-U in similarity — Osgood 1949

Osgood 1949 (*Psych. Rev.* 56:132, the transfer-and-retroaction
surface): retroactive interference is **maximal at intermediate
stimulus-response similarity** — identical material is repetition
(relearning, not interference); dissimilar material doesn't compete.
McGeoch's similarity tradition and the modern cue-overload literature
(Wixted 2004; §7.5) refine but keep the inverted-U core [CONSENSUS
shape; modern formalizations DEBATED in detail — our Gaussian is a
fit].

**Spec consequence — similarity-shaped PI (§4.2 revision).** Pairwise
suppression currently grows ~monotone in sim. Replace the linear leg
with

```
osgood(sim) = exp( −((sim − interf_sim_peak)/interf_sim_width)² )
interf_sim_peak 0.55, interf_sim_width 0.3
```

and add the boundary rules the surface implies: `sim ≥ sim_repeat`
(0.9) routes to the rehearsal leg (micro-reboost at §5.9 rates ×0.3 —
the same event re-lived is practice, not a competitor); `sim < 0.3`
contributes ~nothing to n_sim (the Osgood floor — different topics
never pile onto each other). This resolves a spec tension Part II
left loose: n_sim accumulated "sim > interf_thresh neighbors" — now
the accumulator itself is similarity-weighted, so the 40th *identical*
commute rehearses while the 40th *similar-but-different* commute is
where blur actually lives. Probe P641.

### 27.6 Telescoping — when-drift is biased, not just noisy — Rubin & Baddeley 1989; Janssen et al. 2006

Forward telescoping — remote events dated too *recent* — is one of
the most robust dating phenomena (Rubin & Baddeley 1989; Thompson,
Skowronski & Lee 1988); Janssen, Chessa & Murre 2006 (*Psych. Bull.*
132:677) modeled the bias magnitude as nonlinear in elapsed time —
small under ~weeks, growing toward ~15–25% of true age for remote
events. Recent events show a slight *backward* telescoping (dated
older) — smaller and less stable [CONSENSUS for the forward arm;
backward arm DEBATED — we adopt a fraction-only form].

**Spec consequence — signed when-bias (§6 when-drift revision).**
Reconstructed encodeDay gains a deterministic pull toward the present:

```
t̂ = t_age·(1 − teles_c·(1 − exp(−t_age/teles_tau)))
teles_c 0.12, teles_tau 120d
```

30d → ~3% pull (~1d); 365d → ~10% pull (~38d — last year's party is
"that thing in… spring?"). Because the same bias applies to both
operands, `orderRecall` (§5.40) is largely unaffected at long range —
which is correct: telescoping compresses the scale while order is
preserved, and *that* is why characters can be wrong about when while
right about sequence. Probe P642.

### 27.7 Directed forgetting — the cheap "let it go" — Bjork 1970; MacLeod 1998

Bjork 1970; Basden, Basden & Gargano 1993 (*JEP:LMC* 19:579); MacLeod
1998 chapter: instructed forgetting produces real ~10–20% recall
costs — item-method via rehearsal withdrawal (the item is simply never
rehearsed again), list-method via context reset. Critically distinct
from §4.12 suppression: no inhibitory effort, no rebound profile —
the memory fades *because nobody feeds it*. [CONSENSUS effect;
mechanism split DEBATED.]

**Spec consequence — `forgetEvent(charId, recordId)` (new op,
§4.30b).** Sets `dforget:true`: the record is excluded from §4.13's
retell ecology and from §5.26's forward-test boost, and takes a flat
θ surcharge `df_theta` (0.05). storageS untouched; involuntary scan
unaffected (like suppression, the datum is R-side). This is the
*weak, cheap* voluntary operator — the difference between "I try not
to think about it" (suppression: effortful, leakier under trauma) and
"it's not worth keeping" (directed forgetting: no drama, just
starvation). World use: resolved errands, deliberately dropped grudges,
"we agreed never to mention it." Probe P643.

### 27.8 Hyper-binding — the old bind everything — Campbell, Hasher & Thomas 2010

Campbell, Hasher & Thomas 2010 (*Psych. Sci.* 21:399): older adults
encode **irrelevant bound pairings** — co-present but unrelated
features get welded into the trace and retrieved confidently later
(hyper-binding; an attentional-control deficit expressed as excess
linkage, replicated in Campbell et al. 2010/2012) [CONSENSUS
direction; single-lab magnitude — rep_shrink].

**Spec consequence — spurious birth links (§2 encode-side, decay
consequence).** At encode, a same-scene entity pair mints a link at
`hyperbind_p = 0.02 + hyperbind_gain·max(0, age_eff − 55)/25`
(≈0.10 at age 80, ~0 under 55). Hyper-bound pairs share n_sim buckets
→ older characters' interference pools are *contaminated* — their
records crowd each other through wrong junctions — AND retrieval can
emit the confident wrong co-occurrence ("she was there that day") —
a new error surface, distinct from confabulation (the link is real
structural noise, not gap-filling). This is an *encode-side* tax with
a *decay-side* consequence: the elder's curve falls faster partly
because their buckets are polluted. Probe P644.

### 27.9 Accelerated long-term forgetting — aging hits the tail, not the intercept — Elliott et al. 2014

The ALF literature (Elliott, Isaac & Muhlert 2014, *Cortex* review;
Muhlert et al. 2010; Cassel & Kopelman tradition for "late" episodic
loss): retention can be **near-normal at 30–60 minutes** while
disproportionately lost over days–weeks — strong and replicable in
epilepsy/MCI cohorts; in *healthy* aging the same pattern is
measurable but small and debated [CONSENSUS clinically; healthy-aging
arm DEBATED — adopt small].

**Spec consequence — two-timescale age term (§4.1 revision).** The
current model applies age to β uniformly — intercept and tail steepen
together. ALF says the *tail* steepens while the intercept holds:

```
β_eff(t) = β·(1 + alf_gain·max(0, age_eff − 60)/20·min(1, t_age/alf_onset))
alf_gain 0.3, alf_onset 7d
```

At 75: R@1d is ~unchanged (the elder remembers yesterday fine) while
R@30d drops a further ~8% — "sharp on the week, gone by the month."
Disabled under dementia modifiers where steeper machinery already
exists (age-decline §13); DEBATED-flagged so P645 runs as SHOULD.
Probe P645.

### 27.10 Distinctiveness resists the bucket — von Restorff 1933; Hunt 1995

Von Restorff 1933; Hunt 1995 (*Memory* 3 — the distinctiveness
principle); Hunt & Worthen 2006: isolated/atypical items resist
proactive interference — the isolated item maintains its own retrieval
route while list-mates blur [CONSENSUS phenomenon; the interference-
resistance magnitude is DEBATED — adopt mild].

**Spec consequence — isolation shield (§4.2).** Records with novelty ≥
`distinct_gate` (0.7) take n_sim/pairwise suppression ×`distinct_pi_w`
(0.5). The weird event keeps its own lane; routine days compete. This
complements §4.18's transition-release (a *new pool*) with a per-record
exemption (a *thin lane inside the same pool*). Probe P646.

### 27.11 Framework anchor — Bjork & Bjork 1992

Bjork & Bjork 1992 "New Theory of Disuse" (in *Essays in Honor of
William K. Estes*): the formal separation of **storage strength**
(accumulates with use, never decays) from **retrieval strength**
(context-indexed accessibility, decays and rebuilds) — the S/R split
this spec has run since v0.9 IS their formalization. Cited now as the
conceptual root alongside Anderson & Schooler's environmental
rationality (§12.1): our R(t) is retrieval strength, our S layer is
storage strength, and the whole Part II/V apparatus (spacing, testing,
reconsolidation windows) rides exactly the asymmetries the disuse
theory predicts. No new params — the framework citation, overdue.

## 28. Spec deltas (v5.8 → v5.9)

| # | Change | Grounding |
|---|---|---|
| C47 | NEW §4.30a reconsolidation window: `labile_until` 0.25d post-recall; §6 drift/misinfo ×`recons_drift_mult` 1.5; update incorporation `recons_upd_p` 0.3; `recons_risk` 0.1 loss channel on weak records (DEBATED-bounded) | §27.1 |
| C48 | §5.8: listener-side SSRIF — unretold same-cluster fields in *hearers* take rif ×`srif_mult` 0.6 | §27.2 |
| C49 | §4.6: selective sleep consolidation — `consol_sel_w` 0.5, `consol_sel_arous` 0.5, `expRel` Event flag; neutral records get half the benefit | §27.3 |
| C50 | §4.11: `sleep_span_gain` 0.15 on S-growth when the retell gap crosses ≥1 sleep tick | §27.4 |
| C51 | §4.2: Osgood surface — suppression ×`osgood(sim)` (peak `interf_sim_peak` 0.55, width `interf_sim_width` 0.3); sim ≥`sim_repeat` 0.9 → rehearsal leg; sim <0.3 no n_sim | §27.5 |
| C52 | §6 when-drift: signed telescoping bias `teles_c` 0.12, `teles_tau` 120d (orderRecall untouched — bias is common-mode) | §27.6 |
| C53 | NEW op `forgetEvent` + `dforget` flag: retell-ecology/§5.26 exclusion + `df_theta` 0.05; storageS and scan untouched | §27.7 |
| C54 | §2: hyper-binding — spurious pair links at `hyperbind_p` 0.02 + `hyperbind_gain`·age ramp ≥55; contaminates n_sim pools, mints confident wrong co-occurrences | §27.8 |
| C55 | §4.1: ALF tail term — β_eff gains `alf_gain` 0.3 age-scaled factor active after `alf_onset` 7d (DEBATED; disabled under dementia modifiers) | §27.9 |
| C56 | §4.2: isolation shield — novelty ≥`distinct_gate` 0.7 records take suppression ×`distinct_pi_w` 0.5 | §27.10 |

New MemoryParams (all optional, defaults above): `recons_win`,
`recons_drift_mult`, `recons_upd_p`, `recons_risk`,
`recons_risk_gate`, `srif_mult`, `consol_sel_w`, `consol_sel_arous`,
`sleep_span_gain`, `interf_sim_peak`, `interf_sim_width`,
`sim_repeat`, `teles_c`, `teles_tau`, `df_theta`, `hyperbind_gain`,
`alf_gain`, `alf_onset`, `distinct_gate`, `distinct_pi_w`.
New record/Event fields: `labile_until`, `dforget`, `expRel`;
new contract op `forgetEvent(charId, recordId)`.

## 29. Retention table — added rows (defaults, game days)

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| retold record, drift applied inside labile window | 3.6d | .66* | .34* | .18* | — |
| same record, drift deferred to post-window | 3.6d | .66 | .34 | .18 | .07 |
| listener's omitted-detail field (SSRIF) | 3.6d→suppr. | .25 | .12 | .06 | .02 |
| expRel-tagged record, slept once | 3.6d | .48 | .30 | .17 | .07 |
| matched neutral record, slept once | 3.6d | .39 | .24 | .13 | .05 |
| near-twin pair (sim 0.6), PI arm | 3.6d | .30 | .14 | .07 | .02 |
| exact repeat (sim 0.95) — rehearsal leg | 3.6d | .50 | .30 | .18 | .07 |
| unrelated neighbor (sim 0.2) | 3.6d | .42 | .24 | .12 | .05 |
| dforget record (starved ecology) | 3.6d | .35 | .17 | .08 | .02 |
| 75yo record, ALF on (intercept intact) | ~3.4d | .41 | .22 | .10 | .03 |
| distinctive record (nov .8) in dense bucket | 3.6d | .38 | .21 | .11 | .04 |

*Inside-window edits change content, not just strength — the R rows
for the labile pair are equal; what P637 measures is field
composition. dforget rows assume zero retell draws (ecology-starved);
the same record under normal ecology would sit at the plain-gist row.

## 30. New probes P637–P646

- **P637 reconsolidation window (SHOULD — DEBATED-flagged):** a
  record recalled at day 5 then exposed to a misinformation event at
  +0.1d adopts the false field ≥1.5× more often than a matched record
  hit at +0.5d (window closed); `recons_upd_p` incorporation emits
  `lastRewrite` stamps; a weak (R<0.25) record recalled into
  conflicting input shows measurable strength loss, never deletion.
- **P638 listener SSRIF (MUST — sign-locked):** narrator tells half
  the cluster; *listener* recall of the untold-but-related fields
  drops vs unrelated controls, at ≤`srif_mult`× the speaker's own RIF
  (listener must never suppress MORE than the speaker — sign-locked
  attenuation).
- **P639 selective sleep (SHOULD):** expRel or arousal≥0.5 records
  out-retain matched neutral records across a sleep boundary by
  ≥1.3× on the consol benefit leg; the gap collapses at sleepQuality
  0.3 (selectivity rides the same tick, not a separate system).
- **P640 sleep-span bonus (SHOULD):** two retells at wall-clock-equal
  gaps — one crossing a sleep tick, one not — the slept pair shows
  ≥1.15× storageS growth at 30d (Mazza direction; band is rep-shrunk).
- **P641 Osgood surface (MUST):** suppression-vs-similarity curve is
  non-monotone — max near `interf_sim_peak`±0.1, ~0 below sim 0.3,
  and sim ≥0.9 encodes produce a net *positive* strength delta
  (repetition leg). A monotone-in-sim build fails.
- **P642 telescoping (SHOULD):** median when-error is negative-signed
  (toward present), grows with record age, ≈teles_c·age asymptote for
  remote records; sub-week records ~unbiased; orderRecall accuracy
  unaffected at long range (common-mode bias).
- **P643 directed forgetting (SHOULD):** `dforget` records draw zero
  retell events and no §5.26 boost; voluntary-recall hit-rate drops
  10–15% at 14d vs matched controls; storageS, intrude_w, and scan
  intrusion rates TOST-equivalent — the operator starves, it does
  not inhibit or erase.
- **P644 hyper-binding (SHOULD):** 75yo profiles mint spurious
  pair-links ≥4× the 30yo rate at encode; linked pairs co-retrieve
  with confident wrong co-occurrence at a measurable rate; the links
  contaminate n_sim (older pools show higher effective interference
  at equal true-similarity).
- **P645 ALF tail (SHOULD — DEBATED-flagged):** at age_eff 75 the
  R@30d/R@1d ratio drops ≥8% vs age_eff 25 while R@1d itself is
  TOST-equivalent (intercept held, tail steepened); at age 40 the
  term is inert; under a dementia modifier the term must not stack.
- **P646 isolation shield (SHOULD):** novelty ≥0.7 records in dense
  n_sim buckets lose ≤60% the R of matched low-novelty records at
  14d; the shield is suppression-side only — decay rate unchanged
  (distinctiveness is interference-resistance, not immortality).

## 31. Honest limits (additions)

- Reconsolidation is the most contested mechanism this pass: the
  animal literature is solid, the human episodic arm replicates
  unevenly, and part of the "updating" data may be source confusion
  in a lab coat. We adopt it *weakly* — a quarter-day window, ×1.5
  drift, bounded incorporation — because it is the only sourced
  account of *when* distortion actually enters. If P637 fails, the
  drift ops fall back to the unwindowed §6.1 schedule; the rest of
  v5.9 is independent of it.
- SSRIF magnitudes in the literature are modest (typical RIF
  deficits ~10–15%); `srif_mult` 0.6 on an already-small dose means
  listener suppression is a thin channel — which is right: it should
  be visible only in aggregate (a town that keeps retelling the same
  version), not as a per-event cliff.
- The Osgood Gaussian is a parameterization, not a fit — the surface
  is real, its exact peak/width vary by paradigm; `interf_sim_peak`
  is a SHOULD-tier calibration target inside P641's MUST shape test.
- Telescoping is applied to reconstructed encodeDay only; the stored
  `createdDay` is never mutated — the bias lives in the *report*,
  which is where humans carry it.
- ALF in healthy aging is the weakest citation in this pass
  (clinical ALF is solid; the healthy-aging tail-steepening is real
  but small and contested). It earns its keep because it is the only
  mechanism distinguishing "old character forgets faster" (current
  β) from "old character forgets *later*" — a phenomenologically
  distinct and correct pattern. Flagged DEBATED, SHOULD-tier probe.
- `dforget` and `suppressEvent` deliberately overlap in effect size
  and differ in mechanism — a world that can't distinguish them in
  fiction ("he deliberately forgot" vs "he avoids thinking about it")
  is free to use either; the probes test the machinery, not the
  label.
- Hyper-binding's age ramp starts at 55 by convention; the
  literature's boundary is fuzzier (some evidence from 60s onward).
  The ramp is piecewise-linear against `age_eff`, so reserve/fitness
  terms modulate it like every other decline parameter.

---

# Part VII — v73 deepening: below the record and above the list — the buffer tier, counts, audiences, joint recall, confidence lag, metacognitive spacing, and remembered duration

Parts I–VI priced the curve from seconds-of-labile-window to decades-of-
permastore. What remained unpriced: (a) the **tier below the record** —
the seconds-scale buffer where most experienced content dies before ever
becoming a memory; (b) the **estimation layer** — characters are asked
"how many times" and "how long", and those answers are reconstructions on
their own decay schedule; (c) the **audience as a decay variable** — the
same retelling consolidates or evaporates depending on who listened;
(d) **joint recall** — two rememberers together retrieve less than their
parts but leave each other stronger; (e) **confidence as its own decay
channel** — slower than the content it certifies; (f) the **metacognitive
spacing illusion** — the human reason no character rehearses optimally;
(g) **retrospective duration** — remembered time is made of events, not
calendar; (h) the **weekday schema** — date reports migrate toward the
middle of the week. Claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS].

## 32. New primary sources

### 32.1 The tier below the record — sensory ghosts and the 18-second shelf — Sperling 1960; Darwin, Turvey & Crowder 1972; Peterson & Peterson 1959; Keppel & Underwood 1962

The timescale ladder has a bottom rung the spec never priced: content
that was *registered* but never *encoded*. Sperling 1960: iconic visual
registration persists ~0.25–1s. Darwin, Turvey & Crowder 1972 (*Cognitive
Psychology* 3:255): echoic auditory registration persists ~2–4s — "what
did you say?" can still be answered a breath later. Peterson & Peterson
1959 (*JEP* 58:193): an unrehearsed item survives ~15–20s in short-term
store before evaporating. Keppel & Underwood 1962 (*J. Verbal Learning*
1:153) supplied the crucial reinterpretation: the first trial of the
day shows almost NO short-term loss — the "decay" is **proactive
interference**, not a timer [CONSENSUS findings; the decay-vs-PI reading
is the field's own resolution and matches our Wixted stance, §7.5].
Whole-report/attentional-capture work (Sperling's partial report; the
inattentional-blindness tradition) fixes the behavioral consequence:
unattended content leaves essentially nothing; marginally-attended
content leaves a ghost that is retrievable for tens of seconds, then
never again.

**Spec consequence — the `stim` tier (new §4.34).** The §2 encode gate
currently has two outcomes: above `att_min` → record, below → nothing.
v73 adds a third: candidates that drew some attention but fell under
`att_min` mint a **`stim` ghost** — not a record: no verbatim fields, no
archive path, no drift, no links. A ghost holds {topic fragment, coarse
place/people if present, strength = stim_E (0.3)} and decays on
`stim_hl` (0.0003d ≈ 26s); while alive it answers a re-cue at
`stim_recall_p` (0.6 — "sorry, what was that?" works for half a minute);
dead ghosts leave nothing — including nothing for the archive scan,
TMR, or olfactory resurrection. `stim_cap` 2: only the freshest ghosts
exist (Keppel & Underwood: the shelf is interference-limited, not
time-limited — the third ghost pushes out the first). Locked null
`stim_mint_null`: a ghost can never be upgraded into a record *after
the fact* — it can only inform a NEW encode if the world re-presents
the content inside the window (the "wait, say that again" repair).
Emergent: the ambient stream a character half-heard is literally
recoverable this minute and unrecoverable forever after — the human
distinction between "I didn't catch that" (fixable) and "I don't
remember" (not). Probe P779.

### 32.2 Frequency estimates decay toward the base rate — Hasher & Zacks 1979; Greene 1984; Tversky & Kahneman 1973

Hasher & Zacks 1979 (*JEP:G* 108:356): frequency of occurrence is
encoded **automatically**, without intent, and the encoding is
remarkably insensitive to practice and individual differences. Greene
1984 and Williams & Durso 1986 (*JEP:LMC* 12:165 — frequency judged
across category members): frequency estimates are reconstructed from
*available instances*, not a stored counter — which means they
inherit every property of the availability channel: as member records
die, the estimate compresses toward the category's schema prior;
salient members overweight the count (Tversky & Kahneman 1973
availability: estimate ∝ ease of retrieval, not true frequency)
[CONSENSUS mechanism; the blend weights are ours — HYPOTHESIS].

**Spec consequence — `freqRecall(clusterKey)` (new §5.66).** No count
is ever stored. On demand:

```
live   = live records in the cue-similar cluster
cover  = live.count / max(1, cluster.everEncoded)      // survivorship
n̂      = cover · live_count_effective + (1 − cover) · freq_base
live_count_effective = Σ_i (1 + avail_freq_k·arousal_i)   // availability lift
freq_base = schema prior for the cluster (script rate — §4.20 nodes
            supply it; default = cluster mean historical rate)
```

`avail_freq_k` 0.5: one vivid betrayal counts double in "she's always
doing this". Emergent: early after a routine forms, the estimate tracks
reality; as instances merge/die the answer drifts to "the usual amount"
— and one salient outburst inflates the remembered rate for months
while the humdrum majority evaporates. This is the *counting* analog of
orderRecall (§5.40): another quantity humans reconstruct rather than
store. Probe P780.

### 32.3 The audience co-signs the memory — listener responsiveness gates retell value — Pasupathi, Stallworth & Murdoch 1998; Pasupathi & Rich 2005; Pasupathi & Hoyt 2010

Pasupathi, Stallworth & Murdoch 1998 (*Discourse Processes* 26:1):
retelling an event to an **attentive** listener improved the teller's
own long-term retention; retelling to a **distracted** listener was
statistically indistinguishable from *not retelling at all*. Pasupathi
& Rich 2005 (*J. Personality* 73:1051 — inattentive listening undermines
self-verification) and Pasupathi & Hoyt 2010 (*Memory* 18:185 —
distracted listeners → lower retention AND lower narrative consistency
at one month) replicate and sharpen it; the proposed mechanism is
conversational co-construction — responsive listeners elicit longer,
more elaborated tellings [CONSENSUS direction across three studies;
the elaboration-mediation account is their framework — mechanism
moderately supported]. This is a *decay-relevant* social fact: the
rehearsal value of a retell is set by the room, not just by the teller.

**Spec consequence — `aud_resp` on retells (§4.13/§5.9 revision).**
Retell S-growth and the §5.9 reboost are multiplied by
`aud_resp_mult`: attentive listener 1.0, neutral 0.8, **distracted
`aud_resp_distract` 0.3** — a distracted retell is near-worthless as
rehearsal (it still refreshes `lastAccessDay` and still runs §6.1
drift — the teller still *tells*, the world just doesn't consolidate
it). The world supplies the value from the listener's current
engagement state; when the ecology draw is replaced by real
conversations (§4.13's standing note), listener attention is a natural
per-tick input. Emergent: a character who only ever tells the distracted
roommate keeps *telling* but stops *keeping*; being heard is a mnemonic
service the social world provides — the attentive friend literally
maintains your past. Also interacts with §74 saying-is-believing:
shared-reality tuning drifts the record AND attentive listening grows
it — the two audience channels are orthogonal (drift vs durability).
Probe P781.

### 32.4 Two heads recall less than their parts — collaborative inhibition, and the afterglow — Weldon & Bellinger 1997; Basden et al. 1997; Marion & Thorley 2016

Weldon & Bellinger 1997 (*JEP:LMC* 23:1160): a group recalling together
retrieves **less than the pooled non-redundant output of the same
individuals alone** (the nominal group). Basden, Basden, Bryner &
Thomas 1997 (*JEP:LMC* 23:626): the deficit is retrieval-strategy
disruption — each member's own search plan is broken up by the others'
output order. Marion & Thorley 2016 (*Psych. Bull.* 142:1141 — 75
effects, 64 studies): collaborative inhibition is robust, worse in
larger groups and for uncategorized content; and the same meta's second
arm (27 effects) finds **post-collaborative benefit** — individuals
recall MORE afterward than individuals who never collaborated
(re-exposure + cross-cueing leave a residue) [CONSENSUS both directions;
the dyad-scale parameters are ours]. This is a *social forgetting
curve*: the pair's joint coverage is subadditive in-session but leaves
each member's residual memory enriched.

**Spec consequence — `jointRecall(charIds, cue)` (new §5.67).**
Session coverage = `collab_inhib` (0.8) × the nominal union — output
order is dominated by whichever participant's retrieval route is
strongest (the other's route is disrupted, exactly per Basden);
emission is a single merged Reconstruction. Afterwards, each
participant's **own unretold same-cluster records** take two opposing
doses: SSRIF suppression on omitted-but-related content (§27.2, already
live) AND `postcollab_gain` (0.1) S-side reboost on their surviving
records — hearing the other's telling re-exposed the event (the
meta's postcollab arm). Emergent: two survivors reminiscing produce a
shared version that is *narrower* than either's private memory, yet
each walks away with their own residue refreshed — the public story
converges while private stocks quietly deepen. Also the honest
micro-foundation for §6.24 canonization: the canonical version is what
survived everyone's suppressed alternatives. Probe P782.

### 32.5 Confidence outlives the content it certifies — Sauer et al. 2009; Odinot & Wolters 2006; Odinot, Wolters & Lavender 2009

Sauer, Brewer, Zweck & Weber 2009 (*Law & Human Behavior* 34:337,
N=1,063): across a retention interval of weeks, accuracy fell while
**overconfidence grew** — delayed witnesses were less right and more
sure. Odinot & Wolters 2006 (*ACP* 20:973): confidence does decline
with delay, but shallowly and miscalibrated; Odinot, Wolters & Lavender
2009 (*ACP*): repeated partial questioning **inflates confidence for
correct and incorrect answers alike** without improving accuracy
[CONSENSUS direction — confidence is stickier than content and is
question-driven; the conf decay constant is our fit]. The spec already
decouples the fields (§3) and already inflates conf on retell (+0.05);
what was missing is that `conf` itself *decays on its own slower
schedule* — currently confidence is effectively frozen between boosts.

**Spec consequence — the conf channel decays (§3 revision).** Stored
`confidence` decays `conf *= (1 + t/τ)^(-β·conf_beta_mult)` with
`conf_beta_mult` 0.6 — certainty fades slower than the content it
certifies, so `conf/R` rises with age automatically (the Sauer
signature) and the +0.05 retell bump keeps older-told stories pinned
high regardless of field survival (Odinot confidence-inflation arm).
Locked null `conf_feed_null`: conf still never feeds accuracy, θ, or
hit-probability — it is a *report-side* quantity end to end. Emergent:
the 90-day-old memory arrives thin and arrives *certain* — "I'm
positive" delivered over a mostly-gone record, which is the human
condition, not a bug. Probe P783.

### 32.6 Nobody schedules optimally — the metacognitive spacing illusion — Kornell & Bjork 2008; Son 2004; Toppino & Cohen 2009

Kornell & Bjork 2008 (*Psych. Sci.* 19:585): even after their own test
scores demonstrated spacing's advantage, participants **rated massing
as more effective** — fluency during massed practice masquerades as
learning. Son 2004 (*JEP:LMC* 30:601) shows metacognitive spacing
choices are real but late-developing; Toppino & Cohen 2009 (*JEP:LMC*
35:1352) add the control finding — spacing forced against the learner's
choice barely helps adults: the benefit rides partly on the chooser's
own engagement [CONSENSUS: spontaneous practice policy is
massed-biased and misjudged]. For RW this is a *negative* design
result: the retell ecology must NOT implement the §7.1 lag optimum —
no character distributes rehearsal rationally.

**Spec consequence — locked `spacing_opt_null` (§4.13 note).** Retell
fires are cue-driven (p_retell draw, §4.13) or event-driven (real
conversations) — never scheduled. A character deliberately trying to
keep a memory alive ("I must not forget this") self-rehearses on the
*massed* schedule — immediate repetitions inside one episode, earning
`massed_retell_mult` rates (§7.1) — the wrong-but-human policy. The
spaced benefit is emergent, not strategic: characters who seem to have
"good memory hygiene" are just characters whose *lives* deliver
well-spaced cues. This is a model-honesty null, not a feature: probe
P784 is a structure lint (no parameter path may inject lag-optimal
scheduling) plus a distributional check (spontaneous retell gaps are
clustered, not optimum-tracking).

### 32.7 Remembered duration is made of events — Ornstein 1969; Block & Reed 1978; Block & Zakay 1997; Avni-Babad & Ritov 2003

Retrospective duration estimation is governed by **storage size and
contextual change**, not clock time: intervals remembered as long are
intervals containing many encoded events and many contextual shifts
(Ornstein 1969 *On the Experience of Time* — storage-size model; Block
& Reed 1978 — contextual-change model; Block & Zakay 1997 meta-analysis
*Psychon. Bull. Rev.* 4:184 — retrospective judgments track information
encoded). The lived corollary — the **routine/vacation paradox**
(Avni-Babad & Ritov 2003 *JEP:G* 132:543): routine intervals feel long
in the moment but are remembered as short; eventful intervals feel
short in the moment but are remembered as long [CONSENSUS direction;
weights ours]. This is the mirror of `t_eff` (§12.4): event density
ages *records* forward and stretches *remembered intervals* — one
mechanism, two signs, and the pairing is the human phenomenology:
the packed fortnight both blurs (per-event) and looms (per-interval).

**Spec consequence — `recallDuration(interval)` (new §5.68).**
Reported duration of a past interval:

```
dur̂ = days_true · (1 + dur_ev_w·log1p(n_encoded/ev_day_norm − 1)
                    + dur_trans_w·log1p(n_transitions))
    bounded to [0.3·days_true, 3·days_true]
dur_ev_w 0.4, dur_trans_w 1.0
```

`n_encoded`/`n_transitions` = this character's own counts inside the
interval (reuse §4.18 period/transition bookkeeping). Emergent: the
quiet month "flew by" in retrospect while the week of the move still
looms large — and the same density that made each event blurrier
(t_eff) makes the span *longer* in report. Probe P785.

### 32.8 Dates migrate toward Wednesday — the weekday schema — Huttenlocher, Hedges & Prohaska 1988

Huttenlocher, Hedges & Prohaska 1988 (*Psych. Rev.* 95:471,
"Hierarchical organization in ordered domains"): reports of an event's
day-of-week are generated by a **prototype/category model** — estimates
regress toward the middle of the weekly category; errors concentrate at
±1 day and are *biased midward*, not uniform (related findings in
Huttenlocher, Hedges & Bradburn 1990 *JASA* on elapsed-time reports)
[CONSENSUS phenomenon — category-based estimation of cyclical
quantities]. Our when-drift (§6, plus §27.6 telescoping) currently adds
scale noise and a signed pull but no *categorical* prior.

**Spec consequence — weekday snap (§6 when-drift revision).** When a
when-report emits a weekday (or day-granular date) from a weak
`verbatim.when`, the sampled day snaps toward the category center by
`dow_snap` (0.15) · (1 − when_strength): distant-weekday reports
migrate toward mid-week; weekend events are the least-snapped (the
weekend is its own marked category — the model's two-category
coarseness is deliberate). Errors sit modal at ±1d. Emergent: "that
was… Tuesday? Wednesday?" — plausible wrongness with the right error
shape. Probe P786.

### 32.9 Supporting citations (no new mechanism)

- **Waugh & Norman 1965** — primary vs secondary memory; the buffer
  tier's conceptual parent (duplex memory).
- **Saul & Underwood / Wickens** PI-release line — the stim_cap
  bucket interpretation (§32.1) rides the same cue-overload account as
  §7.5.
- **Harris, Paterson & Kemp 2008** — collaborative recall in intimate
  couples: familiar dyads inhibit less; supports `collab_inhib` being
  a trait-flavored per-dyad value if ever needed (kept flat for now).
- **Son 2010** — children's spacing choices; ages the §32.6 null:
  metacognitive scheduling develops late, so child profiles are even
  further from optimal — no param, just direction.

## 33. Spec deltas (v5.20 → v5.21)

| # | Change | Grounding |
|---|---|---|
| C57 | NEW §4.34 stim tier: sub-`att_min` attended candidates mint ghosts (stim_E 0.3, `stim_hl` 0.0003d, `stim_recall_p` 0.6, `stim_cap` 2); dead ghosts leave nothing; locked `stim_mint_null` | §32.1 |
| C58 | NEW §5.66 `freqRecall(clusterKey)`: coverage-weighted live count + schema prior; availability lift `avail_freq_k` 0.5 | §32.2 |
| C59 | §4.13/§5.9: retell S-growth + reboost × `aud_resp_mult` (1.0/0.8/`aud_resp_distract` 0.3) — listener engagement is a decay variable | §32.3 |
| C60 | NEW §5.67 `jointRecall(charIds, cue)`: coverage × `collab_inhib` 0.8, merged emission, dominant-route ordering; post-session `postcollab_gain` 0.1 on own surviving cluster records (SSRIF unchanged) | §32.4 |
| C61 | §3: `confidence` decays on its own channel at β·`conf_beta_mult` (0.6); locked `conf_feed_null` (conf never drives accuracy/θ/hit-rate) | §32.5 |
| C62 | §4.13: locked `spacing_opt_null` — retell ecology is cue-driven, never lag-scheduled; deliberate self-rehearsal is massed | §32.6 |
| C63 | NEW §5.68 `recallDuration(interval)`: report ∝ encoded density + transitions (`dur_ev_w` 0.4, `dur_trans_w` 1.0, bound [0.3,3]×days_true) | §32.7 |
| C64 | §6 when-drift: weekday reports snap midward by `dow_snap` 0.15·(1−when_strength); weekend category exempt | §32.8 |

New MemoryParams (all optional, defaults above): `stim_E`, `stim_hl`,
`stim_recall_p`, `stim_cap`, `avail_freq_k`, `aud_resp_distract`,
`collab_inhib`, `postcollab_gain`, `conf_beta_mult`, `dur_ev_w`,
`dur_trans_w`, `dow_snap`.
Locked nulls: `stim_mint_null`, `conf_feed_null`, `spacing_opt_null`.
New contract ops: `freqRecall(charId, clusterKey)`,
`jointRecall(charIds, cue)`, `recallDuration(charId, interval)`.
New Event field: `aud_resp ∈ {attentive, neutral, distracted}` on
retell/discuss emissions (default neutral).

## 34. Retention table — added rows (defaults, game days)

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| stim ghost (never a record) | ~26s | 0 | 0 | 0 | 0 |
| retell to distracted listener (S leg only) | — | ~0.3× growth | — | — | — |
| conf channel, no retells (E .6 gist) | ~5.5d-equiv | .55 | .40 | .25 | .10 |
| same record's R (contrast) | 3.6d | .42 | .24 | .12 | .05 |
| pair joint coverage vs nominal union | — | 0.8× | — | — | — |
| postcollab own-record S | — | +0.1 bump | — | — | — |
| remembered duration, idle month (0.5× load) | — | ≈0.8× true | — | — | — |
| remembered duration, move month (3× load + transition) | — | ≈2.3× true | — | — | — |
| weak when-field weekday report | — | snapped midward; ±1d modal | — | — | — |

The conf row is the headline: confidence and content now diverge
deterministically with age — the Sauer overconfidence signature emerges
from `conf_beta_mult` alone, no special flag.

## 35. New probes P779–P786

- **P779 stim tier (MUST):** a sub-`att_min` attended input answers a
  re-cue at ≥0.5 hit rate inside 30s and ~0 after 5 min; ghosts mint no
  records, no archive entries, no cue matches post-death
  (`stim_mint_null` structure-checked); a re-presented event inside the
  window encodes normally (the repair path).
- **P780 freqRecall (SHOULD):** encode 20 cluster members, let 70%
  archive — the estimate regresses toward `freq_base` as cover falls
  (monotone in coverage); a single arousal-0.9 member lifts n̂ ≥ the
  availability-free estimate; estimate is a reconstruction — no stored
  counter field exists (lint).
- **P781 audience responsiveness (MUST — sign-locked):** matched
  records retold once to attentive vs distracted listeners — distracted
  S-growth ≤ 0.5× attentive and statistically indistinguishable from
  no-retell at 7d (TOST against the no-retell arm); `lastAccessDay`
  still refreshes and §6.1 drift still applies (telling ≠ keeping).
- **P782 collaborative inhibition + afterglow (MUST):** two characters
  sharing a 12-record cluster — joint coverage < pooled solo union by
  ≈20% (collab_inhib), while each participant's *post-session solo*
  recall of own unshared records beats a never-collaborated control
  (postcollab_gain); merged emission is a single Reconstruction.
- **P783 confidence lag (MUST):** at 30d, mean `conf − R` gap is
  positive and grows with age; a retell raises conf but not verbatim
  accuracy; `conf` never enters θ, hit-rate, or accuracy computations
  (locked null, structure-checked).
- **P784 spacing illusion (SHOULD — structure):** spontaneous retell
  inter-gap distribution is clustered (mode < lag_optimal by ≥2×), not
  optimum-tracking; lint: no code path schedules a retell from
  lag_opt_ratio; a deliberate "keep remembering" directive issues
  massed-rate self-rehearsals only.
- **P785 remembered duration (SHOULD):** two equal-length intervals
  differing 3× in encoded-event count — the dense one reports ≥1.5×
  longer; a transition-containing interval reports longer still;
  report is report-side only (stored days never mutated).
- **P786 weekday snap (SHOULD):** weak when-field weekday reports are
  biased midward (mean absolute weekday distance shrinks vs uniform),
  ±1d errors modal; weekend-encoded records show ~half the snap
  (category boundary); strong when-fields unaffected.

## 36. Honest limits (additions)

- The stim tier is a *convenience* tier, not a sensory store — it
  exists to make "I didn't catch that" a recoverable state and to
  place a hard floor under what can ever become a memory. Its numbers
  (26s, cap 2) sit at the buffer end of the cited ranges; iconic/
  echoic sub-second structure is deliberately collapsed into one
  ghost class — finer would buy nothing behavioral.
- `aud_resp` is supplied by the world; until the social engine reports
  real listener engagement, the neutral default (0.8) keeps the term
  near-inert — by design. The literature's mechanism is elaboration
  mediated: our multiplier is the reduced form, and P781's TOST arm
  encodes exactly the literature's headline (distracted ≈ none).
- `jointRecall` is a dyad/small-group model; the meta shows inhibition
  grows with group size — `collab_inhib` flat is the conservative
  read. Post-collaborative benefit is priced as S-side re-exposure,
  which the meta partly attributes to ordinary re-study — our
  implementation routes it through the existing reboost rather than
  minting re-encodes, which keeps the audit clean but may understate
  the benefit.
- `conf_beta_mult` makes confidence a second decay channel; the
  alternative (conf as pure function of retrieval ease) was rejected —
  Sauer shows delayed overconfidence even when retrieval is hard.
  Still, conf remains report-side by locked null; if playtests show
  characters *acting* more certain than they should, the bug is in the
  consumer, not this channel.
- `freqRecall` and `recallDuration` are estimators, not stores — both
  deliberately refuse a counter. If a consumer caches their outputs
  and mutates them, that is a §12.3 boundary violation.
- `dow_snap`'s weekend exemption is a modeling convenience (two
  categories); the literature supports richer category structure —
  adopt more only if probes demand it.
- `spacing_opt_null` is deliberately a *null*: it forbids a behavior
  humans don't have, which is unusual for a spec but exactly right for
  a spec that must produce humans.

---

# Part VIII — v85 deepening: below the threshold, the dice, and the environment's prior — savings, hazard archival, need-adaptive τ, the individual curve, and throughput pressure

Seven passes priced what a record *is* and how fast it fades. This pass
prices four properties of the fade itself that Parts I–VII left smooth and
deterministic: **what survives below recall** (savings), **whether death is
a line or a lottery** (hazard), **whose side the curve is on** (the
environment's need statistics), and **what a dense life does to old
traces** (throughput pressure). Plus the form-debate annex we owe §1.

## 37. New primary sources

### 37.1 Savings below zero — Nelson 1978; Nelson 1985

Nelson 1978 (*JEP:HLM* 4:453 — verified): after four weeks, number–word
pairs were **nonrecallable and nonrecognizable** — yet a single relearning
trial showed significant savings over re-paired controls. Subthreshold
traces are real and *incrementable*: relearning re-adds to the residue
rather than starting over ("concatenation"; MacLeod & Nelson 1984
replication — verified). Nelson 1985 (*JEP:LMC* 11:472 — verified):
savings during relearning was Ebbinghaus's *sole* retention measure and is
the most sensitive measure of residual information — more sensitive than
recognition, which is more sensitive than recall.
**[CONSENSUS: savings outlives recall and recognition]**

**RW consequence:** the current spec's archive is too final. A record that
crosses `forget_thresh` leaves nothing — but human "forgotten" material
re-learns faster for years. Model it: archival converts the record into a
**savings shadow** — a `savings` scalar (init = S at archival, capped
`sav_cap` 0.5) decaying at its own slow curve (β_sav 0.1 — near-semantic),
with all content fields dropped except a match-key (`cueKeys` +
content-hash). Re-encounter: an event whose cue+content overlap with the
shadow ≥ `sav_match_thresh` (0.6) mints a new record at
`E_new ×= (1 + sav_gain·savings)` and carries `reinstated:true`. Nelson's
re-pairing control is the locked null: savings requires the *same*
pairing — a re-encounter that overlaps the cue but not the content gains
nothing (`sav_recall_null`/`sav_verbatim_null`, §40.3).
Behavioral texture this buys for free: a character re-meeting an old
flame's street, a former regular's order, a childhood playground game —
"it comes back fast" — without the old record ever being retrievable.

### 37.2 Hazard, not threshold — archival is stochastic

Survival analysis is the honest formalism for "does this record still
exist": Bahrick 1984's own presentation is a survival discontinuity
(Part I §2.3), and the to-be-archived population is exactly the
right-censored tail. A deterministic `forget_thresh` crossing makes every
record of a class die on the same day — maximally unhuman (people keep
*some* trivia for decades and lose some salient things in a week).
**[HYPOTHESIS implementation of CONSENSUS variance — individual survival
is visibly stochastic in every diary corpus; the lab never measures the
per-item lottery because items are pooled.]**

Implement a daily archival hazard below the wall:

```
if R < forget_thresh·hazard_band (1.5):
    λ_day = arch_k · (forget_thresh / R)^arch_exp      // arch_k 0.5, arch_exp 2
    archive iff rand(charId, recordId, day) < 1 − exp(−λ_day)
```

Seeded RNG keeps runs reproducible (§14 determinism discipline). Mean
survival ≈ the old deterministic crossing; variance is the point — CV of
archival day ≥ 0.3. Locked nulls: hazard reads **R only** — never valence
(`arch_valence_null`; negativity/positivity is priced at encoding, not at
the graveyard), never confidence (`hazard_conf_null` — confident dead
things stay dead; P902, P783-consistent).

### 37.3 The environment's prior — Anderson & Schooler 1991

Anderson & Schooler 1991 (*Psych. Sci.* 2:396 — verified): the probability
that a memory will be *needed* follows the same recency/frequency/spacing
regularities as memory availability itself — across NYT headlines,
parental speech to children, and e-mail correspondents. Memory's form is
rational given the environment's statistics. Schooler & Anderson's later
work replicates the correspondence for word use in children's input.
**[CONSENSUS that need-probability and availability share their shape;
our per-class τ shift is a modeling HYPOTHESIS.]**

Two consequences, one adopted, one rejected:

- **Adopted — class-level τ modulation.** Maintain per-character
  `needRate[class]` — an EMA (`need_ema_k` 0.1/day) over retrieval +
  re-encode events on each cue-class (topic, person, venue — the §5.2
  cue keys). Effective τ_eff = τ·(1 + need_tau_gain·z_clipped),
  `need_tau_gain` 0.3, z clipped to ±1. A never-accessed record about a
  *frequently-referenced* class (the corner café, the co-tenant) holds a
  longer τ than an identical record about a once-visited context. The
  claim is deliberately narrow: the prior moves τ, never E, never S —
  `need_mint_null` (P903): a hot class never mints or strengthens a
  record that wasn't accessed.
- **Rejected — need-driven retrieval ordering.** Anderson's model uses
  need-probability as the retrieval prior. Our §5.4 θ is already
  cue-driven; adding a need prior there would double-count rehearsal
  (frequent classes are strong because they get recalled, not because a
  statistician blesses them). The τ channel captures the *retention*
  side; the *access* side stays cue-pure. Locked `need_retrieve_null`.

### 37.4 The individual curve — Averell & Heathcote 2011; Simon 1966

Averell & Heathcote 2011 (*J. Math. Psychol.* 55:25–35 — verified):
hierarchical Bayesian fits of cued recall + stem completion from 1 min to
28 days. Raw fit quality favored an **exponential per individual**, but
Bayesian model selection (which prices mimicry between candidate forms)
favored the **power function**; and *every* analysis supported an
**above-chance asymptote** — some briefly-studied memories are effectively
permanent. This is the strongest modern evidence that our §1 form choice
(power + floor) is right *at the individual level*, not just in
aggregates — the averaging objection is answered hierarchically.

Simon 1966 (*Psychometrika* 31:505 — verified): Jost's law + exponential
decay forces **heterogeneous decay constants** — items differ in
forgetting rate, so pooled curves steepen relative to the per-item curve.
Our β jitter per character/record class produces this for free; the probe
is the aggregate-vs-individual divergence (P905): pooled β_est must
exceed the median per-record β.

Form annex verdict: **power + floor stays.** New discipline: the form
question is now a *standing identifiability note* — any future curve
proposal must beat the incumbent on held-out survival data, per §14's
anchor machinery, not on vibes.

### 37.5 Throughput pressure — Hardt, Nader & Nadel 2013; Frankland et al. 2013

Hardt, Nader & Nadel 2013 (*TICS* 37:111 — verified): "decay happens" —
forgetting is partly an *active* remodeling process; neurogenesis (new
neuron integration) destabilizes existing hippocampal traces.
Frankland, Köhler & Josselyn 2013 (*TINS* — verified): the same mechanism
is their account of infantile amnesia — high plasticity epochs clear old
traces. **[Mechanism DEBATED — neurogenesis rates in adult humans are
contested; the reduced-form claim — dense encoding epochs tax old
retrieval beyond pairwise interference — is well-supported and is what
we implement.]**

Implement as a daily volume term, orthogonal to §4.2 pairwise
interference (which is cue-shared competition; this is global traffic):

```
vol_pressure = encodeCount_day / vol_norm            // vol_norm 12 events/day
R *= 1 − vol_loss·max(0, vol_pressure − 1)           // vol_loss 0.15, episodic only
```

RW texture: a character's chaotic week costs their *older* memories, not
just the competing twins — "it's been such a blur lately." Age-free by
construction (the pressure is ecological, not neural); kids' amnesia
already carries its own §4.31 machinery — do not stack a second infancy
account. Frozen `vol_scope = "episodic"` (semantic/procedural exempt —
semantic lives in §4.7 permastore dynamics).

## 38. What changed in the spec (v5.32 → v5.33)

| # | Change | Grounding |
|---|---|---|
| C-fc8-1 | New §4.37 savings shadow: archived records leave `savings` (β_sav 0.1, cap 0.5); matching re-encounter mints `E×(1+sav_gain·savings)`, `reinstated:true`; re-pairing gains nothing | §37.1 |
| C-fc8-2 | New §4.38 hazard archival: daily λ below `forget_thresh·hazard_band`, seeded RNG; replaces the deterministic cliff (deterministic kept as `arch_mode:"hazard"|"cliff"` switch for harness A/B) | §37.2 |
| C-fc8-3 | New §4.39 need-prior τ: per-char per-cue-class `needRate` EMA modulates τ_eff ±30%; retention-side only | §37.3 |
| C-fc8-4 | New §4.40 throughput pressure: episodic R taxed by same-day encoding volume above `vol_norm` | §37.5 |
| C-fc8-5 | Form annex: power+floor reaffirmed at the *individual* level; aggregate-vs-individual β divergence is now a probe | §37.4 |

New params: `sav_beta 0.1 [0.02–0.3]`, `sav_gain 0.4 [0–0.8]`,
`sav_cap 0.5 [0.2–0.8]`, `sav_match_thresh 0.6 [0.4–0.9]`,
`arch_k 0.5 [0.1–1.5]`, `arch_exp 2.0 [1–4]`, `hazard_band 1.5 [1.1–3]`,
`arch_mode "hazard"`, `need_tau_gain 0.3 [0–0.6]`, `need_ema_k 0.1
[0.02–0.3]`, `vol_loss 0.15 [0–0.4]`, `vol_norm 12 [6–30]`.
Locked nulls: `sav_recall_null` (shadows never surface),
`sav_verbatim_null` (reinstatement buys E, never ghost content),
`arch_valence_null`, `hazard_conf_null`, `need_mint_null`,
`need_retrieve_null`. Frozen: `sav_scope="reencode-only"`,
`vol_scope="episodic"`.

## 39. Validation probes (P899–P907)

- **P899 savings re-encode (MUST):** archive a record, wait ≥7d,
  re-encounter matching event → new E boosted by ≥`sav_gain·0.5·savings`
  vs an identical never-encoded control; re-paired (cue-match-only)
  control gains ≤0.05.
- **P900 savings silence (MUST):** savings shadows never appear in
  recall/FOK/report output at any strength (locked null, output-scanned).
- **P901 hazard spread (MUST):** two matched cohorts — archival-day CV
  ≥0.3 in hazard mode, =0 in cliff mode; mean archival day within 15% of
  the deterministic counterpart.
- **P902 valence/conf null at the graveyard (MUST):** matched +/−
  valence and high/low conf records show identical archival-day
  distributions (TOST).
- **P903 need-prior τ (SHOULD):** never-accessed records in the top vs
  bottom needRate tercile differ in half-life in the predicted direction;
  needRate shows zero minting/strengthening (locked null leg).
- **P904 individual form discipline (SHOULD):** on ≥80% of per-record
  survival curves, power+floor within ΔAIC 2 of exponential — and the
  fitted floor sits above the chance line (Averell & Heathcote protocol).
- **P905 aggregate steepening (SHOULD):** pooled β_est > median per-record
  β (Simon 1966 heterogeneity); per-record fits retain Jost ordering.
- **P906 throughput pressure (SHOULD):** matched records followed by a
  high-volume vs low-volume encoding day — high-volume arm decays
  measurably faster; semantic records exempt (vol_scope, TOST).
- **P907 reinstatement cap (MUST):** reinstated record verbatim ≤ fresh
  event's delivered content — the shadow contributes zero fields.

## 40. Honest limits (additions)

- The savings shadow is a *capacity* claim, not a content claim — Nelson's
  savings measured relearning speed, and our shadow inherits exactly that
  (match-key + scalar, nothing verbatim). Richer residue would double-book
  with §6 phantom/gist machinery.
- Hazard archival makes survival a lottery the *implementer* must seed
  deterministically — unsampled runs (ambient NPCs) keep the cliff; the
  hazard is for mains whose individual forgetting is on-camera.
- `needRate` is a per-character statistic; Anderson & Schooler's claim is
  about *species-level* adaptation to environmental statistics. Per-class
  τ modulation is our reduced form — if P903 fails, drop the τ term and
  keep the estimator for report-relevance hedging only.
- `vol_loss` is ecology, not neurology — the neurogenesis mechanism is
  debated, so the term is deliberately tiny and episodic-scoped; if
  playtests show busy characters implausibly blank, halve before
  doubting the sign.

---

# Part IX — v97 deepening: the one-trial immortal, the clock that reads
strength, the flat forecast, series edges, and two emergent failure modes

Eight passes priced the curve's shape, modifiers, ecology, variance, and
substrates. This pass adds the last unpriced *classes* of retention —
the aversion that binds in one trial and outlives the episode that
formed it — plus three properties of the *estimates* and *structures*
that sit on the curve: recency inferred from residual strength, the
character's own (flat) forecast of their forgetting, and the serial
structure of repeated-event series. Two closing sections are
emergence analyses — predicted behavior from existing machinery,
each with a probe rather than a parameter.

Claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS] as before.

## 41. New primary sources

### 41.1 The one-trial immortal — conditioned taste aversion — Garcia & Koelling 1966; Bernstein & Webster 1980; Logue et al. 1981; Scalera 2002

The sharpest counter-example to everything Part I calibrated: learning
that violates every standard encoding rule. Garcia & Koelling 1966
established taste-illness conditioning with CS–US delays of **hours** —
no other association tolerates that gap. Bernstein & Webster 1980
(*Physiol. Behav.* 25:363 — verified) gave adults a single pairing of a
novel ice-cream flavor with chemotherapy: **one trial** produced
measurable aversion. Bernstein 1978 (*Science* 200:1302 — verified)
showed the same in children, and that a novel "scapegoat" food absorbs
the aversion and *protects the normal diet* — targeting is
novelty-weighted. Logue, Ophir & Strauss 1981 (*Behav. Res. Ther.* —
verified): questionnaire evidence that most adults carry at least one
food aversion, typically formed in one episode, persisting **years**.
[CONSENSUS: one-trial, long-delay, novelty-targeted food aversions are
real; DURATION in humans is variable — clinical chemo studies find many
aversions remit within months, so "immortal" is the folk tail, not the
median.]

**Spec consequence:** Event flag `illness_onset:{somatic:true}` triggers
a backward-bind scan: episodic records tagged `food` within
`cta_window` (0.35d ≈ 8h — the only legal look-back in the model) are
candidate targets, selection weighted by `(1 − familiarity)` of the
food referent (`cta_novel_w` 0.7) — the scapegoat arm. A hit mints
(a) an `aversion` episodic record at `cta_strength` (0.6 — the mint is
associative, not attentional; it ignores `att_min`) riding `cta_beta`
(0.1 — long, deliberately *not* permastore), and (b) a durable `avoid`
tag on the food/venue semantic referent decaying on `cta_avoid_hl`
(730d). The two products dissociate: the `avoid` tag survives the
episode's archival — "doesn't eat there anymore, can't quite say why"
is the Logue phenotype. Venue/spillover: the taste binds, the room
mostly doesn't — non-food co-occurring fields gain at most `cta_spill`
(0.15). Locked `cta_somatic_null`: non-GI illness (dizziness, injury)
binds no food — the association is canalized to the gut (Garcia's own
specificity result). Locked `cta_birth_null`: the `avoid` tag is
appetitive machinery, never a content record — it surfaces as
behavioral aversion, not recallable narrative.

### 41.2 The clock that reads strength — recency by inference — Hintzman 2004/2010; Brown, Rips & Shevell 1985

When a record's `verbatim.when` is dead (§2.5 — source/time tags die
first), a character asked "when did you last see her?" does not abstain
— they *estimate*, and the estimator is trace strength. Hintzman 2004
(*Memory & Cognition*) showed recency judgments track memory strength
with a log-like compression; Brown, Rips & Shevell 1985 established the
inference route for public events — subjects date events by how well
they are remembered [CONSENSUS direction; our log-map is HYPOTHESIS].
This is also the lawful source of the "I just ran into her — actually
it was months ago" error: a recently *rehearsed* old memory reads as
recent, because the estimator cannot distinguish old+strong from
young+strong.

**Spec consequence:** new read op `recencyEstimate(charId, recordId)`:
when `verbatim.when` strength ≥ `rec_floor` (0.02) the stored date
serves; below it,

```
est_days = rec_scale · (−ln R_norm),   R_norm = R / E_birth
```

`rec_scale` 30 — compressive (a 100× strength loss reads as ~4.6
rec_scale days, matching §27.6's compressive telescoping in sign).
Dialogue "when did you last…" and the §5.14 trigger layer route through
this when the tag is dead. Locked `rec_verbatim_null`: the estimate is
an inference emitted *as* an inference ("a while back" / "just the
other day"), never back-written into `verbatim.when` — the record does
not gain a fake date.

### 41.3 The flat forecast — stability bias — Koriat, Bjork, Sheffer & Bar 2004; Kornell & Bjork 2009

Koriat, Bjork, Sheffer & Bar 2004 (*PNAS* 101:1100 — verified):
subjects asked to predict recall at different retention intervals give
nearly **interval-insensitive** JOLs while their actual accuracy
declines steeply — they over-predict long-term retention because
predictions are made from *current* encoding strength, which says
nothing about forgetting. Kornell & Bjork 2009 (*JEP:LMC* — verified)
named it the stability bias and showed it survives practice:
experiencing one's own forgetting barely corrects the next forecast
[CONSENSUS — one of the most robust metacognitive findings].

**Spec consequence — contract, not mechanism.** The §5.21 `jol`
formula (E + fluency, no horizon term) is already stability-biased by
construction; v5.45 promotes the absence to a locked invariant:
`jol_horizon_null` — `jol` must not load the query's retention horizon
beyond `jol_horizon_w` (0.05, clamped ≤0.15). Even a character
explicitly asked "will you remember this next month vs tomorrow?"
answers from the same strength. `jol_exp_gain` (0.05) caps how much
repeated experience of one's own archival events shifts `jol_bias` —
Koriat's finding that the bias outlives practice. The RW behavior this
buys: every character is systematically overconfident about their own
durability — they promise to remember, and the spec already knows they
won't.

### 41.4 Series edges — the first and last instances hold the doors — Dilevski et al. 2021; Paterson et al.; Danby et al. 2022

Repeated-event memory is not a flat blur with one instance standing
for all: **boundary instances are privileged**. Dilevski, Paterson &
colleagues' re-analysis of five repeated-event studies (*JARMAC* 2021
— verified): details of the FIRST and LAST instances were recalled
more accurately and consistently than middle instances, and
misattributions of details across instances were widespread. Danby,
Sharman & Paterson 2022 (*Memory & Cognition* — verified): confusions
are **proximity-graded** — details migrate mostly between *adjacent*
instances, decaying with ordinal distance; boundary instances act as
anchors. The recency/primacy balance shifts with delay: at short
retention intervals the last instance dominates; at longer delays the
first is best retained (Deck et al. 2021, *Memory* — verified in the
repeated-stressor paradigm) [CONSENSUS pattern across the
repeated-event literature].

**Spec consequence:** repeated-event encodings of a §4.3 genericized
series carry `series:{id, idx, n}`. The FIRST instance gets a permanent
`series_edge_gain` (0.15) intercept — it is the schema anchor
(script-formation needs a founder). The LAST instance needs no bonus:
it wins at short delay *for free* through t (youngest record, least
decayed) — and its advantage decays along the same curve, so the
first-instance dominance emerges at long delay exactly as observed:
the crossover is emergent, not parametrized. Misattribution draws
among series members weight candidates by adjacency:
`w ∝ series_prox_w^|Δidx|` (`series_prox_w` 0.5) — details hop to the
neighboring instance far more often than to a distant one. RW texture:
"last Tuesday's lunch meeting" confuses this week's details with last
week's, but rarely with the first-ever meeting's.

### 41.5 Emergence note — the mislaid thing

No new machinery; a predicted failure mode worth pinning as a probe.
`placed_item` events (where the character put the keys, the letter,
the good scissors) are the worst case in the model's own terms:
enacted (enact_gain helps) but low-salience, single-field, and
maximally cue-similar — every placement shares cues with all previous
ones, so `n_sim` piles up (§4.2) and each new placement retroactively
buries the last. Predicted behavior: recall of the *latest* location
dominates but is itself fragile under routine repetition; when it
fails, the reconstructive guess is not random — the §4.20 script-node
location (the hook by the door, the usual drawer) surfaces as the
confident wrong answer. Older profiles degrade faster via the §4.25
binding tax. All emergent from existing parameters — the probe (P1033)
exists to catch a future "fix" that would break it.

### 41.6 Emergence note — the quiet decades

The third component of the lifespan curve is usually presented
positively (the bump); its complement is the **trough**: Rubin &
Schulkind 1997's three-component fit and Janssen, Chessa & Murre's
recency-removal work (verified) imply that midlife decades (~30–50 in
a 70-year-old's distribution) are underrepresented relative to any
smooth interpolation — neither bump fuel nor recency lift reaches
them. In our model the trough must be *emergent*, not fitted: era
encoding weight already rides firsts/transitions density
(age-development §23) and routine life produces fewer distinctive
records, fewer retells (§4.13 ecology is salience-driven). Probe
P1034: hold firsts density uniform and the trough must collapse — if
it survives as a parameter-shaped dip instead, the emergence claim
fails and a `trough_gain` fallback is the honest repair. Flagged now
rather than discovered later.

## 42. What changed in the spec (v5.44 → v5.45)

| # | Change | Grounding |
|---|---|---|
| C-fc9-1 | New §4.46 conditioned taste aversion: `illness_onset` backward-bind over `cta_window`, novelty-weighted targeting, one-trial `aversion` mint at `cta_strength`/`cta_beta`, durable `avoid` semantic tag surviving the episode | §41.1 |
| C-fc9-2 | New §4.47 series edges: `series:{id,idx,n}` on repeated-event records; `series_edge_gain` on idx=0 only; `series_prox_w` adjacency-weighted misattribution; last-instance dominance + crossover emergent | §41.4 |
| C-fc9-3 | New §5.96 `recencyEstimate` — strength→recency log-map when `verbatim.when` is dead; inference emits hedged language, never a date | §41.2 |
| C-fc9-4 | New §5.97 flat-forecast contract: `jol` horizon-blind by locked invariant; `jol_exp_gain` caps practice correction | §41.3 |
| C-fc9-5 | Emergence probes only (no params): mislaid-item PI burial + script-default guess; midlife trough via firsts density | §41.5, §41.6 |

New params: `cta_window 0.35 [0.15–0.75]`, `cta_novel_w 0.7 [0–1]`,
`cta_strength 0.6 [0.3–0.9]`, `cta_beta 0.1 [0.02–0.3]`,
`cta_avoid_hl 730 [90–2000]`, `cta_spill 0.15 [0–0.4]`,
`series_edge_gain 0.15 [0–0.4]`, `series_prox_w 0.5 [0.2–0.8]`,
`rec_scale 30 [5–90]`, `rec_floor 0.02 [0.005–0.1]`,
`jol_horizon_w 0.05 [0–0.15]`, `jol_exp_gain 0.05 [0–0.2]`.
Locked nulls: `cta_somatic_null`, `cta_birth_null`,
`rec_verbatim_null`, `jol_horizon_null`, `jol_exper_null`.
Frozen: `cta_bind="food-only"`, `series_edge_leg="first-only"`
(the recency arm is owned by t, not by a second gain).

## 43. Retention table — added rows (defaults, game days)

| record class | half-life | R@1d | R@7d | R@30d | R@365d |
|---|---|---|---|---|---|
| aversion episode (cta, E .6) | ~6d | .57 | .50 | .43 | .34 |
| avoid tag (semantic ref) | 730d | — | — | ~.97 | ~.71 |
| series first instance | as class +0.15E anchor | — | — | — | — |
| series last instance | youngest → wins short delay | — | — | — | — |
| series middle instance | full PI burial | — | ~half of edge | — | — |

Reading: the aversion's *episode* decays like a slow semantic while
its *avoidance* outlives it — the behavioral residue is the durable
product. The series rows have no single curve: position within the
series, not age, sets survival — the middle instances are the ones
that blur.

## 44. Validation probes (P1027–P1034)

- **P1027 CTA mint + novelty (MUST):** a somatic `illness_onset` with
  one novel and one familiar food in-window averts to the novel food
  ≥70% of runs; the mint ignores `att_min` (one-trial, associative).
- **P1028 avoidance outlives episode (SHOULD):** after the aversion
  record archives, the `avoid` tag still drives rejection behavior;
  no narrative content is recoverable (cta_birth_null leg).
- **P1029 somatic gate (MUST — locked-null class):** non-GI illness
  onset binds zero food records across all profiles (cta_somatic_null).
- **P1030 series edges (MUST):** in a 4-instance repeated-event
  series, boundary-instance detail accuracy > middle at both short
  (last-first ordering) and long (first-last ordering) delays —
  the crossover must be produced by the decay itself; misattributions
  land on adjacent instances ≥2× distant ones.
- **P1031 recency-from-strength (SHOULD):** a rehearsed 90d-old record
  and an unrehearsed 7d-old record at equal residual R produce
  recency estimates within noise of each other — and the estimate is
  emitted hedged, with `verbatim.when` untouched (rec_verbatim_null).
- **P1032 flat forecast (MUST — locked-null class):** jol across a
  1d/30d/180d horizon sweep is flat within `jol_horizon_w` while the
  hit-rate curve declines; `jol_bias` drift under repeated archival
  exposure stays ≤ `jol_exp_gain` per exposure.
- **P1033 mislaid-item emergence (SHOULD):** after 3 relocations of
  one item, recall returns the latest location > earlier ones, and on
  failure the emitted guess is the script-node location, not uniform.
- **P1034 trough emergence (SHOULD):** a 70yo profile's era
  distribution dips below power-interpolation at encodeAge 30–50;
  with firsts density held uniform the dip must collapse ≥75%.

## 45. Honest limits (additions)

- Human CTA duration is genuinely uncertain — clinical data (many
  aversions remit in months) and folk data (decades) disagree, so
  `cta_beta` sits mid-range rather than at the claimed-immortal
  extreme; the *durable* product is the avoid tag, which is where
  the behavioral claim lives anyway.
- The recency log-map is a convenience fit — Hintzman's strength–
  recency relation is real but no published functional form pins
  `rec_scale`; the probe tests the *behavioral* consequence
  (rehearsal makes old feel recent), not the constant.
- The series crossover is deliberately emergent — if P1030's
  long-delay first-instance dominance fails, the likely bug is
  `series_edge_gain` being swamped by n_sim burial, not the theory.
- The trough is asserted as emergence, not data-fit: if P1034 fails,
  `trough_gain` is the named fallback — the honest thing is that the
  literature's "trough" may itself be a residual of the three-
  component fit rather than a real dip.
- jol horizon-blindness is the one place the spec *requires* a wrong
  answer: a future "improvement" that lets jol load the horizon is a
  bug by this spec, however rational it looks.

# Part X — v109 deepening: the average that lies, the need that
counts per record, the decay that was executed and paroled, the
status of a memory, and forgetting that earns its keep

Nine passes priced the curve itself. This pass prices the things
the curve *is made of* and the things it is *for*: what happens when
you average unlike items (the famous power shape is partly an
artifact), how need probability can live on the record instead of
the class, why pure decay was executed in 1932 and which narrow
corner it was paroled back into, the moment a memory stops being a
"remember" and becomes a "know", the competitive release that makes
forgetting useful, and the bill a recall bout itself runs up.

Claims tagged [CONSENSUS] / [DEBATED] / [HYPOTHESIS] as before.

## 46. New primary sources

### 46.1 The average that lies — artifactual power curves — Anderson & Tweney 1997; Myung, Kim & Pitt 2000; Brown & Heathcote 2003

Rubin & Wenzel's 1996 meta-analysis (§1, §12) crowned the power
function on the strength of **averaged** retention curves. Anderson
& Tweney 1997 (*Memory & Cognition* 25:724 — verified) showed the
crown is partly stolen: averaging exponential individual curves
across items or subjects that differ in rate produces an aggregate
that fits a **power function better than the true generative
exponential**. The individual curve is steeper and simpler; the
group curve's slow tail is the residue of heterogeneity, not a
property of any memory. Myung, Kim & Pitt 2000 (*JEP:LMC* 26:168)
formalized the response — fit the individual curve when you can —
and Brown & Heathcote 2003 showed the same artifact in practice
data [CONSENSUS at the level of "averaging distorts shape"; the
best functional form of the *individual* curve remains DEBATED —
exponential, exponential-with-asymptote, and two-timescale models
all survive] [HYPOTHESIS for RW: we do not need to adjudicate —
per-record hazard is already exponential-ish; the population curve
should be an *emergent* power, not a fitted one].

**Spec consequence — a validation discipline, not a mechanism:**
the spec's per-record decay stays as is; what changes is what a
passing curve looks like. New §14.8 contract: any retention-curve
validation must report BOTH (a) the per-record survival fit (the
spec's truth) and (b) the pooled survival across heterogeneous
records. Reproducing the artifact — pooled power fit ≈ or better
than pooled exponential, while per-record exponential fit holds —
is a MUST-level probe (P1156): a build where the pooled curve
cannot be decomposed back into heterogeneous individuals is wrong
even if it "looks like Ebbinghaus". Second consequence:
`trait_decay_mult` spread (the §4-age and ID legs) is what *makes*
the pooled tail — the heterogeneity is load-bearing, so a
homogeneous-parameter build that still shows a slow tail has
smuggled in an unmotivated mechanism (probe P1157 detects).

### 46.2 Need probability, per record — Anderson & Milson 1989

§37.3 installed `needRate[class]`: a per-character, per-cue-class
EMA of accesses that shifts τ_eff ±30%. The source material
supports a sharper instrument. Anderson & Milson 1989 (*Psychol.
Rev.* 96:703 — verified, the rational-analysis companion) modeled
the probability a memory will be needed as a function of **its own
usage history**: recency of last use enters as a decaying power
term (P(need) ∝ t_last^−d), and frequency enters as a saturating
count — the same shape as memory strength itself, which was their
point (the memory trace's decay mirrors the environment's odds of
asking for it). A class-level EMA knows "people ask about
birthdays"; it cannot know that *this* address got asked for three
times last month while *that* one has never been needed since the
move [CONSENSUS direction: usage history predicts future need;
specific exponents are HYPOTHESIS-calibrated].

**Spec consequence:** records carry `uses[]` — a timestamp vector
(append on retrieval + re-encode; compacted to
{count, last_t, ema_gap} past `uses_cap` 8 for cheap storage).
Per-record need:

```
need_p = need_rec_w · (Σ_u (1 + (now−t_u)/1d)^−need_rec_b) + need_freq_w·log(1+n_uses)
need_rec_w ≈ 0.5; need_rec_b ≈ 0.6; need_freq_w ≈ 0.15
τ_eff = τ·(1 + need_tau_gain·z_class + need_rec_gain·need_p)
need_rec_gain ≈ 0.5 (clip ±1 z of need_p within class)
```

`need_tau_gain` keeps its class leg (0.3) — the two sum, capped so
combined τ shift stays ≤ ±60% (`need_shift_cap` 0.6). Locked
`need_uses_null`: `uses[]` never enters the retrieval drive — a
record that was *needed* often is not thereby more *findable*; the
effect is retention-side only, same discipline as need_mint_null/
need_retrieve_null before it. RW behavior: the regular customer
remembers the regulars' orders because the register keeps asking —
the record's own service record, not the salience of any one day,
is what keeps it alive.

### 46.3 The execution and the parole — decay vs interference — McGeoch 1932; McGeoch & Irion 1952; Brown 1958; Barrouillet, Bernardin & Camos 2004; Wixted 2004

McGeoch 1932 (*Psychol. Rev.* 39:352 — verified) executed pure
decay theory for long-term memory: forgetting is caused by
**interpolated activity**, not the passage of time — the landmark
the modern model inherits. The evidence that convicted: sleep vs
waking retention (Jenkins & Dallenbach, §32.1 — same hours,
different loss), degree-of-learning manipulations, and the
retroactive-interference literature. Brown 1958 (*Quart. J. Exp.
Psychol.*) and Peterson & Peterson 1959 (§32.1) then showed
something that *does* decay on the clock — the seconds-scale
buffer, where even interference-lite conditions lose items in ~15–
20s. Barrouillet, Bernardin & Camos 2004 (*JEP:G* 133:83 — TBRS,
verified) refined it: buffer items decay only while **attention is
occupied elsewhere** — refresh with attention and the decay stalls
— decay in the small store is real but *attention-gated*. Wixted
2004 (*Annu. Rev. Psychol.* 55:235 — verified) summarizes the
modern peace: LTM forgetting is overwhelmingly interference-
driven; clock-decay survives at the buffer tier [CONSENSUS on the
split; the exact LTM clock-component — zero vs small — is
DEBATED].

**Spec consequence — split the hazard, don't replace it.** §4's
decay leg is reinterpreted as two named components:

```
hazard = decay_true·h_clock(t) + (1 − decay_true)·h_intf(n_sim·sim_w events since t)
decay_true ≈ 0.15 for episodic/semantic LTM
         ≈ 1.0  for the §32.1 buffer tier (pure clock, attention-gated)
```

`h_intf` accumulates over *intervening cue-similar events*, not
time — the `n_sim` ledger (§4.2) already counts them; v5.57 makes
the split explicit instead of implicit. The behavioral
consequences the split buys: (a) a quiet stretch — sleep, a slow
day — stalls LTM forgetting even as the clock runs (Jenkins &
Dallenbach emerge from mechanics rather than a sleep multiplier);
(b) event-dense days do the damage (§4.40 throughput pressure
becomes the interference leg's own load, no double-count needed:
throughput feeds n_sim); (c) `decay_true` is the honest knob for
the residual clock component Wixted leaves open. Locked
`decay_pure_null`: a build where LTM hazard is clock-only is a
spec violation — set `decay_true`=1.0 outside the buffer tier and
the dense-day probe (P1158) must fail loudly. Frozen
`decay_sleep_leg`: the existing sleep multipliers stay as
*consolidation* legs (they act on E/edges at mint-time windows),
not as hazard multipliers — sleep affects what survives encoding,
the quiet affects what interferes.

### 46.4 The status downgrade — remember fades to know — Gardiner & Java 1990; Gardiner, Ramponi & Richardson-Klavehn 1998; Tunney 2010

Gardiner & Java 1990 (*Mem. Cognit.* 18:23 — verified): in
recognition with remember/know judgments, **"remember" responses
decline steeply with retention interval while "know" responses are
near-flat or rise** — recollective experience dies first;
familiarity survives. Gardiner, Ramponi & Richardson-Klavehn 1998
(*Mem. Cognit.* 26:617) showed the shift can be pushed by
manipulating levels of processing; Tunney 2010 tracked individual
"remember→know" transitions across a week — the same item
downgrades, it isn't just different items surviving [CONSENSUS for
the ordering: recollection is perishable, familiarity durable; the
two-process vs strength-only account is DEBATED — for RW the
behavioral output is what matters].

**Spec consequence — an emission status, not a new store:**
present() (§v5.53 contract) tags each surfaced record
`epist:"remember"|"know"|"guess"` derived from the *field
survival profile*: if ≥`rk_bind_n` (2) of the binding fields
{verbatim.when, ctx.where, source} are alive (strength ≥
`rk_bind_floor` 0.02) → `remember`; if core content fields live
but binding dead → `know`; if only schema-reconstruction →
`guess` (already exists implicitly). The downgrade is emergent:
binding fields decay fastest (§4 — context dies first), so
`remember`→`know` happens *to the same record* on schedule. The
tag changes utterance shape ("I remember the day she told me" vs
"oh, she left ages ago — couldn't tell you when") and gates the
confidence ceiling (§3): `know` caps confidence at `know_conf_cap`
(0.75). Locked `rk_fake_null`: `know`-status records may not emit
bound detail — a character who only "knows" cannot narrate the
scene's when/where from thin air (the schema-fill path is the
`guess` leg, and it must mark itself). Frozen `rk_tone`: the tag
is emission metadata — it never alters stored strength.

### 46.5 Forgetting that earns its keep — Nørby 2015; Storm & Levy 2012; Levy, McVeigh, Marful & Anderson 2007

Nørby 2015 (*Perspect. Psychol. Sci.* 10:551 — verified) reviewed
forgetting's adaptive economy: loss is not a bug, it is (a) PI
relief — dead competitors stop crowding live retrievals, (b)
updating — outdated info (old address, old lock code) must lose or
it out-votes the current one, (c) generalization — detail loss is
what a schema *is*. Storm & Levy 2012 (*Mem. Cognit.* 40:827 —
verified) quantified one arm: RIF impairment of competitors
*correlates positively* with later recall of the practiced set —
suppression buys retrieval room. Levy et al. 2007 (*Psychol. Sci.*
18:456) showed RIF is retrieval-specific, not extinction [the
adaptive *function* framing is CONSENSUS-adjacent — widely
accepted, thin on quantitative constants; magnitudes below are
HYPOTHESIS].

**Spec consequence — competitive release is already latent; make
it a named invariant.** `n_sim` (§4.2) already counts live
cue-similar records; when a record archives, its n_sim
contribution to survivors should fall — i.e., n_sim is defined
over the *live* set, full stop. v5.57 pins this as locked
`relief_dead_null` (archived records never count toward n_sim)
and adds the probe that makes it pay: paired similar records
{A,B}, kill B, A's retrieval probability must rise by ≥
`relief_min` (0.05) within `relief_tau` (2d) — measurable release,
not just bookkeeping. Second arm — the update pair: when a
`supersede` link exists (§4.x replacement records), the loser
keeps a residual but its retrieval weight loses `updt_loser_pen`
(0.15) in the same cue class — the old lock code can be recalled
under effort but never wins the race. Third leg stays emergent:
schema formation already consumes detail loss (§4.3 genericize) —
no new parameter, but P1162 asserts the generalization dividend:
records whose fields genericized still answer schema queries while
their verbatim cousins are gone.

### 46.6 The bill the bout runs up — output interference — Smith 1971; Roediger & Schmidt 1980; Tulving & Arbuckle 1966

Recall is not free for the un-recalled. Smith 1971 (*JEP*
91:195 — verified): recalling some members of a category depresses
the *remaining* members — output position predicts survival.
Roediger & Schmidt 1980 (*JEP:HLM* 6:91 — verified): each
successively recalled item raises interference against the pool —
the last things a searcher would have found are exactly what the
search itself buried. Tulving & Arbuckle 1966 named input vs
output interference. This is distinct from RIF (§social —
practice-suppresses-competitors): output interference needs no
inhibition account; it is the same cue-competition mechanism
operating within one retrieval bout [CONSENSUS phenomenon;
mechanism attribution DEBATED].

**Spec consequence:** within a single `recall` bout (one present()
session or one voluntary search), each emitted candidate adds
`oi_bout_k` (0.03) to a session interference accumulator applied
to remaining candidates' drive — `drive' = drive·(1 −
oi_bout_k·k_emitted)`, reset at bout end. Same-category emitted
items cost extra (`oi_cat_mult` 1.5× on same-cue-class members) —
Smith's category result. Late-position items are the fragile
ones, so retrieval order matters: a character asked "what happened
that summer" surfaces three things and *can't* surface the fourth
that was always there — it got talked over by its own telling.
Locked `oi_perm_null`: the bout tax never persists — it writes
nothing to records; it is session-local interference, not RIF
suppression (which already has its own ledger).

## 47. What changed in the spec (v5.56 → v5.57)

| # | Change | Grounding |
|---|---|---|
| C-fc10-1 | New §4.61 decay split: hazard = `decay_true`·clock + (1−`decay_true`)·interference over live n_sim events; `decay_true`≈0.15 LTM / 1.0 buffer; locked `decay_pure_null`; frozen `decay_sleep_leg` | §46.3 |
| C-fc10-2 | New §4.62 per-record need: `uses[]` timestamp vector → `need_p` recency-power + frequency-log; `need_rec_gain` stacks with class leg under `need_shift_cap`; locked `need_uses_null` | §46.2 |
| C-fc10-3 | New §4.63 competitive release: `relief_dead_null` (n_sim counts live only) + `relief_min`/`relief_tau` measurable-release contract + `updt_loser_pen` on supersede losers | §46.5 |
| C-fc10-4 | New §5.114 `epist` emission tag: remember/know/guess derived from binding-field survival; `rk_bind_n`/`rk_bind_floor`/`know_conf_cap`; locked `rk_fake_null`; frozen `rk_tone` | §46.4 |
| C-fc10-5 | New §5.115 bout output interference: `oi_bout_k` session accumulator, `oi_cat_mult` same-class surcharge; locked `oi_perm_null` | §46.6 |
| C-fc10-6 | New §14.8 aggregation-artifact validation contract: pooled-vs-per-record fit reporting; artifact reproduction is a MUST probe | §46.1 |

New params: `decay_true 0.15 [0–0.4]` (LTM classes; buffer-tier
frozen 1.0), `need_rec_w 0.5 [0–1]`, `need_rec_b 0.6 [0.2–1.0]`,
`need_freq_w 0.15 [0–0.4]`, `need_rec_gain 0.5 [0–0.8]`,
`need_shift_cap 0.6 [0.3–1.0]`, `uses_cap 8 [4–32]`,
`relief_min 0.05 [0.01–0.15]`, `relief_tau 2.0 [0.5–7]`,
`updt_loser_pen 0.15 [0–0.4]`, `rk_bind_n 2 [1–3]`,
`rk_bind_floor 0.02 [0.005–0.1]`, `know_conf_cap 0.75 [0.5–0.9]`,
`oi_bout_k 0.03 [0–0.1]`, `oi_cat_mult 1.5 [1–3]`.
Locked nulls: `decay_pure_null`, `need_uses_null`,
`relief_dead_null`, `rk_fake_null`, `oi_perm_null`.
Frozen: `decay_sleep_leg` (sleep stays a consolidation leg),
`rk_tone` (epist never writes strength), buffer-tier
`decay_true`=1.0.

## 48. Retention table — added rows (defaults, game days)

| record class | mechanism | visible effect |
|---|---|---|
| episodic, quiet period (low n_sim inflow) | interference leg starved | effective half-life ≈ +35% vs dense period — not a sleep gift, an interference fast |
| episodic, dense day | n_sim pile-up | effective half-life ≈ −30% vs quiet — §4.40 now mechanized |
| heavily-used record (uses≥5/mo) | need_p high | τ_eff up to +60% — the order the register keeps asking for |
| binding fields at 30d | fastest decay class | `epist` flips remember→know on schedule |
| bout position ≥4th emission | oi accumulator | drive −12%+ — the fourth story of the summer won't come |
| supersede loser | updt_loser_pen | recallable under effort, never wins the race |

Reading: the table no longer needs a "dense vs quiet" hand-waved
modifier — the same n_sim ledger that buries the mislaid keys is
the ledger that quiets down at night.

## 49. Validation probes (P1156–P1165)

- **P1156 aggregation artifact (MUST — §14.8):** pooled retention
  over heterogeneous records must fit a power function at least as
  well as a pooled exponential, while per-record exponential fits
  hold — reproducing the artifact proves the mixture is real
  heterogeneity, not a fitted power term.
- **P1157 heterogeneity is load-bearing (MUST):** a parameter-
  homogeneous build (all decay traits at mean) must lose the slow
  tail — pooled curve must steepen toward the common exponential;
  a slow tail surviving homogenization flags a smuggled mechanism.
- **P1158 interference-dominance (MUST — locked decay_pure_null):**
  event-density × retention-interval factorial: at fixed elapsed
  time, dense-arm retention < quiet-arm retention by ≥ 25% —
  a clock-only LTM build cannot produce the interaction.
- **P1159 per-record need (SHOULD):** two matched records, one
  with uses{5, last 10d}, one uses{0}: first shows τ_eff up-shift
  bounded by need_shift_cap; retrieval drive identical
  (need_uses_null leg).
- **P1160 competitive release (SHOULD):** kill competitor B in
  pair {A,B}: A retrieval p rises ≥ relief_min within relief_tau —
  and n_sim must drop (relief_dead_null: archived B counts zero).
- **P1161 supersede loser (SHOULD):** old-vs-new lock-code pair:
  free recall returns the new code ≥ 80%; forced recall of the old
  succeeds at reduced weight (updt_loser_pen) — loser is demoted,
  not deleted.
- **P1162 generalization dividend (SHOULD):** genericized records
  answer schema queries after their verbatim fields die — detail
  loss feeds the schema, matching §4.3 without new machinery.
- **P1163 remember→know shift (MUST — locked rk_fake_null):**
  tracked records at 1d/7d/30d/90d: `epist` distribution must
  shift remember→know monotonically; know-status emissions must
  contain zero binding-field detail (no fake dates/places); know
  confidence ≤ know_conf_cap.
- **P1164 output interference (SHOULD):** fixed 6-item
  retrievable set, free-recall bouts: items emitted early displace
  later items — final-list coverage < retrieval without bout tax;
  same-class emissions hurt more (oi_cat_mult).
- **P1165 quiet-stall (COULD — emergent):** identical records
  minted at dusk: retention through a simulated sleep/quiet window
  vs an equal-length dense window — quiet arm loses less, with the
  gap attributable to the interference leg (audit: n_sim inflow
  ≈ 0 during quiet), never to a sleep multiplier on hazard
  (decay_sleep_leg frozen).

## 50. Honest limits (additions)

- The individual-curve functional form is genuinely unsettled —
  exponential-with-asymptote and two-timescale fits still compete
  (§46.1). The spec's choice is pragmatic; P1156 tests the
  *mixture property*, which survives either base form.
- `decay_true` 0.15 is a deliberately small HYPOTHESIS knob —
  Wixted 2004 leaves the LTM clock component open and the honest
  answer may be ≈0 for declarative LTM. The parameter exists so a
  future version can dial it without a refactor; the locked null
  pins the *interference* leg, not the clock's size.
- `uses[]` adds per-record state — justified because Anderson &
  Milson's whole point is that need is item-specific; the
  `uses_cap` compaction trades fidelity for footprint, and the
  probe only tests the aggregate effect.
- Output-interference magnitudes (oi_bout_k 0.03, cat ×1.5) are
  calibrated to the *ordering* result (late items hurt), not
  absolute amounts — the literature gives the phenomenon, not the
  constants.
- The remember/know two-process debate is unresolved in the
  literature; we implement the *observable* (field-survival
  profile → emission status) and deliberately take no side on
  whether familiarity is a separate trace — `rk_tone` frozen so
  nobody "fixes" it into one.
- Competitive release (relief_min 0.05) is the least-sourced
  number in the pass — Storm & Levy give direction and the RIF
  correlation, not a per-death delta; the probe bands it loosely
  and flags it as calibration debt.
