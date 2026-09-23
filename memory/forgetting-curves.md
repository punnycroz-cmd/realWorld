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
