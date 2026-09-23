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
