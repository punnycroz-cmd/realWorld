# Encoding Mechanics — what makes a trace strong at birth (v12 focus)

**Track:** memory-research (sf/memory) · **Depends on:** `memory-model-spec.md`
§2 (the E formula and its existing modifiers), `formal-model.md` §5 (Event
schema), `individual-differences.md` (trait layer), `emotional-memory.md`
(arousal machinery — NOT re-derived here).

**Verdict tags:** CONSENSUS = textbook-replicated; ESTABLISHED = replicated,
magnitude noisy; DEBATED = contested or failed replications exist;
HYPOTHESIS = our modeling choice for RW, no direct literature claim.

## 0. What this version adds

Through v11, §2 priced an event by *what it was about* — arousal, self-
relevance, novelty, prediction error, who did it — and by *the state the
encoder was in* — sleep, stress, synchrony, age. What it did not price is
**how the event was processed**: depth of elaboration, the engagement mode
(observed vs enacted vs generated vs spoken), where the event sat in the
stream's segmentation structure (boundaries), and stochastic attention lapses.
The encoding literature says those are exactly the levers that decide whether
a trace forms at all — deeper than attention alone, and largely *invisible to
the encoder*. This version adds that layer: 14 new params, 5 new Event
fields, one deliberate frozen null, 11 probes (P106–P116).

Design constraint honored throughout: every term lands inside the existing
E formula or its §2 modifiers — no new record types, no new stores.

## 1. Levels of processing — depth is the master variable (CONSENSUS)

Craik & Lockhart (1972): memory is a by-product of processing depth, not of
effort or intent. Craik & Tulving (1975): semantic-orienting tasks roughly
double-to-triple recall over shallow (orthographic/phonemic) ones at matched
exposure; the effect is on *elaboration*, not time-on-task (Craik & Tulving's
own Experiment 8–10 — elaborate sentences beat congruent simple ones). Two
consequences the spec had been carrying implicitly and now makes explicit:

- **Maintenance rehearsal is a null.** Craik & Watkins (1973): rote
  repetition in mind ("rehearsing" a phone number you can't write down)
  improves *nothing* over a single exposure — only elaborative rehearsal
  helps. This is why `retell_boost` lives on the retrieval/reconsolidation
  side (§5.9) and why `rep_gain` (illusory truth, §6.3) moves *belief*, not
  strength: exposure without elaboration is not encoding.
- **Intention to learn is a null.** Postman (1964); Hyde & Jenkins (1973):
  once the orienting task is equated, telling subjects "remember this" adds
  nothing — the *task* is the encoding. Frozen constant `intent_null = 0`.
  RW consequence: a character cannot decide to remember; they can only be
  caused to process deeply. (Player-visible consequence: request-feed
  "make X remember Y" requests can only work by injecting a memorable
  *event*, never by flagging a trace.)

**Formalization.** New derived Event field `elaboration ∈ [0,1]` — the depth
of semantic work the event triggered. Default derivation (formal-model.md
§5 style):

```
elaboration = clamp(0.5·selfRelevance + 0.3·predictionError
                    + 0.2·coherence, 0, 1)
```

where `coherence` is how well the event fits the character's schemas/goals
(paradoxically, fitting material elaborates *more* — the reader has more to
think *with*: Bransford & Johnson 1972 comprehension-anchored encoding).
Encoding formula gains a term (spec §2):

```
E += elab_gain · elaboration          (elab_gain ≈ 0.25)
```

Depth is additive with the attention gate, not a replacement: a deeply
processed event still needs `attention ≥ att_min` (the gorilla is not
encoded no matter how interesting — Simons & Chabris 1999). Trait loading:
`open` and `consc` raise the effective elaboration of goal-relevant events
(individual-differences.md §3 row addition); `wmc` does NOT — WMC shows in
the `da_encode_mult` resistance below (§4).

## 2. Self-reference, quantified (CONSENSUS)

§2 already carries `w_self` on `selfRelevance`. Symons & Johnson (1997,
meta over 129 studies) pin its size: self-referent encoding beats semantic
encoding by d ≈ 0.65, but beats *other*-referent encoding by only ~half
that — the effect is elaboration+organization through the best-developed
schema a person owns, not a magic self-module. Implication for RW: the
`selfRelevance` drive should saturate — a 0.6-relevance event already
captures most of the SRE; the last 0.4 buys little. **Modeling choice
(HYPOTHESIS):** apply `w_self·selfRelevance` through a saturating transform
`selfRelevance_eff = selfRelevance^0.7` — concave, matching the meta's
compressed high end. Keeps the param, changes the curve; bands in P110.

## 3. Engagement mode — how the event entered (CONSENSUS, effect sizes in §9)

A scene's own participation structure is the biggest untapped encoding
variable for a life-sim. Literature ordering at matched attention:

**enacted > generated > spoken > heard/read ≈ imagined**

- **Enactment** (subject-performed tasks): performing an action vs reading/
  watching it — Roberts, Macleod & Fernandes (2022, Psych. Bull. meta, 145
  behavioral studies): g = 1.23 vs verbal encoding, ~0.9 vs watching
  another perform it. Critically for RW's age spread: patients — including
  memory-impaired and motor-impaired — retain the benefit; the advantage is
  preserved-to-enhanced in healthy aging (Engelkamp & Zimmer; meta patient
  section). Mechanism: planning + motor trace, not just "attention."
  → `enact_gain` on events with `engagement:"enacted"` (agent == self,
  physical action), applied *after* the age-scaled enc_base — enacted
  encoding sidesteps part of the decline curve (dementia-resilient motor
  encoding; Kessels, Boekhorst & Postma 2005 for the AD result).
- **Generation effect**: self-produced material beats read — Bertsch,
  Pesta, Wiscott & McDaniel (2007, meta: 445 effects / 86 studies /
  N=17,711): d = 0.40; *constrained* generation (forced specific output)
  is larger. In RW terms: dialogue the character composes, plans they
  form, conclusions they draw encode deeper than equivalent content they
  merely heard — even when they heard themselves say it.
  → `gen_gain` on `engagement:"generated"`/`"spoken-self"`.
- **Production effect**: saying aloud beats silent — MacLeod et al. (2010);
  Fawcett (2013) + Fawcett et al. (2023 updated meta): small-but-real
  between-subject recognition advantage, larger within-list against a
  silent backdrop (relative distinctiveness); reduces intrusions at recall.
  → `prod_gain`, small (0.08), strongest on recognition mode (§5.6).
- **Imagined** events already carry the §6.9 pipeline (`imagined` source,
  richness-gated flip). Imagined encoding is *weaker* than enacted but
  gains on rehearsal — no change this version.

## 4. Attention: the divided-attention asymmetry + lapses (CONSENSUS / DEBATED on lapse params)

Craik, Govoni, Naveh-Benjamin & Anderson (1996, JEP:G): dividing attention
at **encoding** produces large memory decrements with small secondary-task
costs; dividing it at **retrieval** produces small-to-nil memory decrements
with large secondary-task RT costs. Naveh-Benjamin, Craik, Gavrilescu &
Anderson (2000): the encoding hit is partly a *qualitative* shift to
shallower processing, not just less resource. Fernandes & Moscovitch
(2000): the retrieval side is not fully immune when the competing task is
verbal — material overlap matters.

**Formalization:**
- New Event field `daLoad ∈ [0,1]` (secondary-task pull at the moment of
  encoding: walking-and-talking, cooking while listening). At encoding,
  `attention ×= (1 − da_encode_mult·daLoad)` AND `elaboration ×= (1 −
  da_encode_mult·daLoad)` (da_encode_mult ≈ 0.5) — the hit is on *both*
  channels per Naveh-Benjamin 2000.
- Retrieval side: `cueContext.daLoad` raises `searchCost` and `ret_noise`
  contribution but does NOT move θ — retrieval is obligatory-but-slow, not
  fragile. (Contract note in §10; one frozen constant `da_ret_cost = 1.5`
  on searchCost.)
- **Enactment resists DA** (Engelkamp): enacted records take half the
  da_encode_mult damage — the motor channel encodes without central
  resources.

**Stochastic lapses.** Mind-wandering produces attention-collapse episodes
with the mind present-but-absent; encoding during a lapse is near-nil
(Smallwood & Schooler 2006; Maillet & Rajah 2013 — meta, mind-wandering
impairs subsequent memory; risk factors: poor sleep, stress, negative mood,
low task engagement). Model: per event, with probability `lapse_p`
(default 0.03), `attention ×= (1 − lapse_drop)` (lapse_drop ≈ 0.6) —
drawn BEFORE att_min gating, so some events simply never exist for that
character ("I was there but I have no idea what was said"). Trait-linked:
`lapse_p += 0.02·(neurot>0) + 0.03·(sleepFactor<0.8) + 0.02·(stress
state>0.6)` — loadings, not free params. This is the cheapest new
machinery in v12 and the most humanizing: it produces *unexplained* holes
in otherwise fine memories.

## 5. Event segmentation — boundaries, doorways, order loss (CONSENSUS core; magnitude DEBATED)

Event Segmentation Theory (Zacks, Speer, Swallow & Malea 2007; Kurby &
Zacks 2008): perception chunks continuous experience at points where
prediction spikes — boundaries. Consequences measured in narrative/film/
VR paradigms:

- **Boundary content is privileged.** Items at event boundaries are
  remembered better than mid-event items at matched exposure (Swallow,
  Zacks & Abrams 2009; Newtson & Engquist 1976 for the segmentation
  effect on subsequent structure).
- **Order degrades across boundaries.** Temporal-order memory within an
  event is good; across boundaries it is markedly worse even at matched
  delay (DuBrow & Davachi 2013; Ezzyat & Davachi 2011). Boundaries are
  where "which came first" starts failing — the wedge under
  `orderBefore`/`dateEstimate` (§6.15).
- **The doorway / location-updating effect.** Moving to a new room
  degrades access to information bound to the prior event model —
  including objects in hand and pending intentions (Radvansky & Copeland
  2006; Radvansky, Krawietz & Tamplin 2011 — real environments, not just
  VR; Lawrence & Peterson 2016 — imagined walks do it too; Pettijohn &
  Radvansky 2016 — the effect survives delay controls and is NOT rescued
  by returning to the original room, ruling out simple context
  reinstatement; Radvansky, Pettijohn & Kim 2015 — **no age difference**,
  event-level processing is age-invariant). Magnitude is small and
  load-dependent — a 2024 registered replication series found the effect
  reliable but smaller than canonical reports (mark DEBATED on size,
  CONSENSUS on direction + mechanism: event-model updating creates
  interference between adjacent models — the event-horizon account).

**Formalization** (the sim is spatial — this is cheap and high-yield):
- Event field `boundary:true` on segmentation points (task switches,
  arrivals/departures, topic breaks). Boundary records get
  `E += boundary_gain` (0.15).
- Event/context flag `locShift:true` on venue/room changes. On a locShift
  boundary: every record created within the last `0.02` day (~30 min)
  takes a one-time `R ×= (1 − doorway_drop)` (doorway_drop ≈ 0.15), and
  pending `Intention` records (§9) take the same hit — "walked into the
  kitchen and forgot why" is now an emergent sentence. Flat across age
  (Radvansky 2015).
- Order machinery: cross-boundary associative edges form at
  `link_p·(1 − boundary_order_loss)` (0.4) — same-event ordering survives,
  cross-boundary ordering enters the world already thin.

## 6. Distinctiveness — isolation, not weirdness (CONSENSUS on isolation; DEBATED on bizarreness)

- **Von Restorff / isolation**: an item that is categorically different
  from its local context is remembered better (Hunt 1995; Schmidt 1991 —
  primary vs secondary distinctiveness; the effect needs the item to be a
  *statistical* outlier in the encoded stream, not merely unusual in the
  world). → Event field `isolated:true` when the world/event bus marks the
  event an outlier within its episode type; `E += distinct_gain` (0.15).
- **Bizarreness** (weird images/mnemonics): meta-analytic verdict is weak —
  the advantage appears mainly in within-list designs and largely reduces
  to isolation (McDaniel & Einstein; Worthen & colleagues). DEBATED → no
  dedicated param; bizarreness feeds `novelty`/`isolated` only.
- Deliberate design note: `distinct_gain` is context-relative, not
  trait-relative — a character in a routine life gets MORE isolations per
  month, not fewer (their stream has less variance), which compounds the
  routine-heavy modifier's blur: their rare odd day stands out against
  mush. HYPOTHESIS for RW pacing: this is what lets one strange Tuesday
  survive a decade of commutes.

## 7. Unitization rescues the associative deficit (ESTABLISHED)

The aging literature's most actionable encoding finding for our `link_p`
machinery (v0.3, Naveh-Benjamin 2000): when to-be-bound elements can be
encoded as a **single coherent unit**, older adults' associative memory
rebounds toward young-adult levels — Giovanello & Schacter (2012);
Bastin et al. (2013); Ahmad, Fernandes & Hockley (2015). Unitization
effectively converts an association into an item, bypassing the deficit.

**Formalization:** Event field `coherentUnit:true` (person doing their
signature action; object in its canonical place; name on a familiar face).
At encoding, `link_p_eff = link_p + unitize_gain·(1 − link_p)`
(unitize_gain ≈ 0.3). Because `link_p` is lowest exactly in the cohort
that needs it, the term is automatically age-targeted — the older adult
remembers "Sanna opened the shop" whole while "who was at the meeting"
fragments. P114 tests the interaction.

## 8. Encoding-side mood congruence (ESTABLISHED, small)

v0.2's `encodeMood` field is used only at retrieval (state dependence,
§5.3). The encoding side is a separate, older finding: mood at intake
biases *which* content elaborates — mood-congruent material gets processed
deeper and encoded better (Bower 1981; meta Ucros 1989 — reliable but
modest, asymmetric toward positive moods). Small additive term:
`E += mood_cong_encode·|encodeMood|` when sign(valence) == sign(encodeMood)
(mood_cong_encode ≈ 0.1). Keep it small: the Ucros meta's own moderator
analysis shows the effect shrinks when selfRelevance is already high —
clamp the term to `×(1 − selfRelevance)` so it only moves thin, ambient
content. SHOULD-tier.

## 9. Survival processing — adjudicated, folded, no new param (DEBATED → resolved)

Nairne's adaptive-memory effect (Nairne, Pandeirada & Thompson 2008):
rating items for survival value beats even self-reference and generation.
Scofield, Buchanan & Kostic (2018) meta with bias correction:
η²p ≈ .06–.09 between-subject, .15–.18 within — real, medium, smaller
than the canonical claims. Mechanism analyses (Klein 2012; Kroneisen &
Erdfelder; Burns et al.) converge on elaboration + planning + self-
relevance — i.e., survival processing is not a sixth memory system, it is
an *elaboration delivery device*. **Verdict: no dedicated param.** The
Event field `survivalRelevance` (0..1, optional from the world layer —
physical-threat relevance of the event) feeds `elaboration` directly
(`elaboration += 0.3·survivalRelevance` before clamping). P115 tests
absorption: after the fold, a dedicated survival term must add ≤0.02 E —
if it adds more, the fold is wrong and the param gets reinstated.

## 10. What we deliberately did NOT add

- **Testing effect at encoding** — retrieval practice > restudy (Roediger
  & Karpicke 2006; Rowland 2014 meta g≈0.5) is already inside the model
  as §4.11's `s_gain` on difficult retrieval: a recall IS the practice.
  Cross-reference only; no double-counting.
- **Subsequent-memory neuroimaging** (Paller & Wagner 2002 — hippocampal/
  prefrontal dm effects): mechanism support for the attention/elaboration/
  predictionError terms already priced; not simulatable at our grain.
- **Emotional encoding** — entire channel delivered in v0.5 (ABC, blink,
  selective consolidation); untouched here.
- **Picture superiority / dual coding** (Paivio): partially present via
  `vivid_detail` field-width. Added `concrete_gain` (0.1) on sensory-rich
  events — concrete/imageable content encodes deeper; this is the term
  that makes *places and faces* outlast *arguments* in the archive.

## 11. Parameter summary (new in v1.2 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `elab_gain` | 0.25 | 0–0.5 | deep/elaborative processing term | Craik & Tulving 1975; CONSENSUS |
| `gen_gain` | 0.15 | 0–0.4 | self-generated content bonus | Bertsch 2007 d=0.40 |
| `enact_gain` | 0.20 | 0–0.5 | performed-action bonus; post-decline | Roberts 2022 g=1.23 |
| `prod_gain` | 0.08 | 0–0.25 | spoken-aloud bonus (recognition-weighted) | Fawcett 2013/2023 |
| `boundary_gain` | 0.15 | 0–0.4 | event-boundary encoding bonus | Swallow 2009; Zacks 2007 |
| `boundary_order_loss` | 0.4 | 0–0.8 | cross-boundary link/order penalty | DuBrow & Davachi 2013 |
| `doorway_drop` | 0.15 | 0–0.4 | locShift R penalty on recent + pending records | Radvansky 2006/2011/2015 |
| `lapse_p` | 0.03 | 0–0.15 | stochastic attention-collapse rate | Maillet & Rajah 2013 |
| `lapse_drop` | 0.6 | 0.3–0.9 | attention multiplier during a lapse | Smallwood & Schooler |
| `da_encode_mult` | 0.5 | 0.2–0.8 | divided-attention encoding damage | Craik 1996 |
| `unitize_gain` | 0.3 | 0–0.6 | coherent-unit link rescue | Giovanello & Schacter 2012 |
| `distinct_gain` | 0.15 | 0–0.4 | within-context isolation bonus | Hunt 1995; Schmidt 1991 |
| `concrete_gain` | 0.1 | 0–0.3 | sensory/concrete content bonus | Paivio; dual coding |
| `mood_cong_encode` | 0.1 | 0–0.3 | mood-congruent elaboration bonus | Bower 1981; Ucros 1989 |

**Frozen constants (v1.2):** `intent_null = 0` (intention-to-learn adds
nothing past orienting task — Postman 1964; Hyde & Jenkins 1973; a frozen
zero IS the finding), `da_ret_cost = 1.5` (retrieval-DA searchCost
multiplier), `lapse_window = 0.02` day (doorway reach, ~30 min),
`elaboration` weights {0.5, 0.3, 0.2} (LoP derivation mix — hypothesis,
audited by P110).

## 12. Validation probes P106–P116

Tiered per validation-design.md §2.1 (MUST = consensus machinery; SHOULD =
established-noisy; OBSERVE = debated). Bands use the §3 protocol
(replication-discounted where single-literature).

- **P106 (MUST) generation:** matched-attention events where the character
  composed the line vs heard it → generated records recall higher,
  T-diff band d ∈ [0.25, 0.6] (Bertsch discount).
- **P107 (MUST) enactment & aging:** enacted vs observed advantage present
  in all bands and NOT smaller in the 65+ cohort — TOST on the
  interaction (patient-preserved finding).
- **P108 (SHOULD) doorway:** locShift event → accessibility dip on
  records < lapse_window old + pending intentions; flat across age
  (Radvansky 2015); magnitude band admits DEBATED status (wide).
- **P109 (MUST) boundary structure:** boundary records > mid-event at
  matched arousal/attention; `orderBefore` accuracy drops across
  boundaries vs within at matched Δt.
- **P110 (MUST) elaboration:** shallow vs deep matched-attention events →
  ≥1.5× recall at 7 days; rote-repetition control (same event re-encoded
  with elaboration held at floor) adds ≤0.05 — the maintenance-rehearsal
  null tested *inside* the model.
- **P111 (MUST) intention null:** `intent` flag on/off at fixed
  elaboration → TOST equivalence. If intent moves E, the frozen constant
  is broken by construction — this probe guards the invariant.
- **P112 (MUST) DA asymmetry:** daLoad=0.7 at encoding costs ≥3× the
  recall loss of daLoad=0.7 at retrieval; retrieval-side cost shows in
  searchCost, not hit rate.
- **P113 (SHOULD) production:** spoken > observed in recognition mode;
  recall-mode advantage smaller or nil (Fawcett 2023 asymmetry).
- **P114 (SHOULD) unitization:** age × coherentUnit interaction on link
  formation — older cohort's link deficit shrinks ≥40% on unit events.
- **P115 (OBSERVE) survival absorption:** after the elaboration fold, a
  residual survival term contributes ≤0.02 E (equivalence). Guards the
  no-param decision.
- **P116 (SHOULD) lapse structure:** lapse_p produces a bimodal
  low-attention tail in the E distribution; lapse incidence correlates
  with sleep/neurot loadings per §4 (r ∈ [0.2, 0.6]).

## 13. Spec deltas delivered

- `memory-model-spec.md` → v1.2: §2 +7 mechanism bullets (elaboration,
  saturating selfRelevance, engagement modes, DA asymmetry, lapses,
  segmentation/boundary/doorway, unitization, mood-congruence,
  concreteness); §7 +14 params + 4 frozen constants; §10 contract +
  Event fields (`engagement`, `daLoad`, `boundary`, `locShift`,
  `coherentUnit`, `isolated`, `survivalRelevance`) and daLoad on
  cueContext. All optional w/ defaults; backward compatible.
- `character-memory-profiles.md`: §0 +14 clamp rows; archetype deltas
  (older adult `unitize_gain`↑, `lapse_p`↑; child `enact_gain`↑ — motor
  encoding is the intact channel; depressive/poor-sleep modifiers gain
  `lapse_p` deltas); v1.2 note.
- `validation-design.md`: registry extended to P106–P116.
- `human-memory-research.md`: §17 v12 summary appended.

## 14. Sources (all verified this version)

- Craik & Lockhart 1972; Craik & Tulving 1975; Craik & Watkins 1973;
  Hyde & Jenkins 1973; Postman 1964; Bransford & Johnson 1972; Simons &
  Chabris 1999 — LoP/elaboration/inattention.
- Symons & Johnson 1997 (Psych. Bull. 121:371) — SRE meta, 129 studies.
- Bertsch, Pesta, Wiscott & McDaniel 2007 (Mem. Cogn. 35:201) —
  generation meta d=.40, 445 effects/86 studies/N=17,711.
- Roberts, Macleod & Fernandes 2022 (Psych. Bull. 148) — enactment meta,
  g=1.23, 145 behavioral + 7 neuro + 31 patient studies.
- MacLeod et al. 2010; Fawcett 2013 (Acta Psych.); Fawcett, Baldwin,
  Whitridge et al. 2023 (Can. J. Exp. Psych.) — production meta updates.
- Craik, Govoni, Naveh-Benjamin & Anderson 1996 (JEP:G 125:159);
  Naveh-Benjamin, Craik, Gavrilescu & Anderson 2000 (M&C 28:965);
  Fernandes & Moscovitch 2000 (JEP:G 129:155) — DA asymmetry.
- Smallwood & Schooler 2006; Maillet & Rajah 2013 — mind-wandering and
  encoding.
- Zacks, Speer, Swallow & Malea 2007; Kurby & Zacks 2008; Swallow, Zacks
  & Abrams 2009; Newtson & Engquist 1976; DuBrow & Davachi 2013;
  Ezzyat & Davachi 2011 — event segmentation.
- Radvansky & Copeland 2006 (M&C 34:1150); Radvansky, Krawietz &
  Tamplin 2011 (QJEP 64:1636); Radvansky, Tamplin & Krawietz 2010;
  Lawrence & Peterson 2016; Pettijohn & Radvansky 2016/2018; Radvansky,
  Pettijohn & Kim 2015 (Psych. Aging — no age diff) — doorway/location
  updating.
- Hunt 1995; Schmidt 1991/2012 — distinctiveness/isolation.
- Giovanello & Schacter 2012; Bastin et al. 2013; Ahmad, Fernandes &
  Hockley 2015 — unitization in aging.
- Bower 1981; Ucros 1989 (meta) — mood-congruent encoding.
- Nairne, Pandeirada & Thompson 2008; Scofield, Buchanan & Kostic 2018
  (PB&R meta, bias-corrected η²p .06–.18); Klein 2012; Kroneisen &
  Erdfelder — survival processing verdict.
- Roediger & Karpicke 2006; Rowland 2014 (meta) — testing effect
  (cross-ref only).
- Paivio — dual coding / concreteness.

---

# Part II — encoding-mechanics, second pass (v24 focus)

**Version tag:** spec v2.4. Part I priced *how* an event was processed
(depth, engagement mode, segmentation, lapses). Part II adds the
**motivational state** the encoder was in (attentional boost, curiosity,
teach-expectancy, implementation intention), the **post-encoding minute**
(wakeful rest), the **content-class asymmetries** humans show at the door
(proper names, other-group faces, in-domain expertise), the **socially
instructed hole** (item-method directed forgetting), and one **engagement
mode that beats enactment** (drawing/crafting). 12 new params, 3 frozen
constants, 10 probes (P221–P230).

## 15. The attentional boost effect — detection rescues the mundane (ESTABLISHED)

Swallow & Jiang (2010, Cognition 115:118; 2014 update with a true
baseline, Atten. Percept. Psychophys. 76:466 — the effect is a genuine
boost over no-task baseline, not distractor suppression): while
participants encoded a stream of background images, detecting an
occasional *target* in an unrelated monitoring stream IMPROVED memory
for the background item shown at that instant — dual-task cost runs
backwards at the moment a goal-relevant event is detected. Robust across
modalities (auditory oddball → visual memory), not dependent on rarity
(Swallow & Jiang 2011 — goal-relevance, not infrequency), eliminated when
the detection task is omitted or when target decision requires arbitrary
mapping (the boost is tied to the *target decision*, per the dual-task
interaction model). Mechanism is attributed to a transient temporal-
orienting / LC–NE burst; mechanism DEBATED, phenomenon reliable.

**Why it matters for RW:** it inverts the naïve reading of Part I's DA
machinery. `daLoad` hurts ambient encoding — but a *detection* event
(the toast popping, the doorbell, spotting the person you were watching
for) momentarily amplifies whatever else was on screen. The sim gets
"she noticed the coat because the doorbell rang" for free.

**Formalization.** Event flag `detected:true` (the event is a task-
relevant detection — something the character was watching/listening
for, including prospective-memory cue firings). At the same sim tick:

```
E_detected += abe_gain                          (abe_gain ≈ 0.15)
other same-tick records: E += abe_gain·abe_spill_mult   (≈ 0.5·0.15)
```

Frozen constant `abe_window = 1 tick` — the boost is phasic (~sub-second
to seconds; Murphy et al. 2021-style temporal proximity results support
keeping it tight). Boundary conditions encoded structurally: requires an
active monitoring set (the character must have a live Intention or watch
task — §5.14's focal machinery supplies it), and the boost applies to
concurrently *attended* material only — records already under
`attention < att_min` stay unwritten (boost × 0 attention is still 0).

## 16. Curiosity — a state that encodes what it didn't ask for (ESTABLISHED, size DEBATED)

Gruber, Gelman & Ranganath (2014, Neuron 84:486): high-curiosity states
enhance memory for the answer (obviously) AND for unrelated incidental
faces presented during the curious state — dopaminergic anticipation
(midbrain/NAcc → hippocampus) does double duty. Murphy, Dehmelt,
Yonelinas, Ranganath & Gruber (2021, Learn. Mem. 28:34): the incidental
benefit is temporally locked to curiosity *elicitation*, not sustained
anticipation or satisfaction — encode "shortly after the question lands."
A 2025 meta-analysis (PB&R; "Mnemonic benefits of state curiosity")
finds the target benefit reliable and the incidental spillover real but
smaller — mark spillover SHOULD-tier. Gruber & Ranganath's PACE
framework (TiCS 2019) places curiosity downstream of prediction error —
which the spec already computes.

**Formalization.** New derived Event field `curiosity ∈ [0,1]` —
default derivation `curiosity = clamp(predictionError·interest`, 0,1)
where `interest` = topic overlap with the character's goal/domain list
(world supplies topic tags; fall back to selfRelevance). Then:

```
E += curios_gain·curiosity                (curios_gain ≈ 0.2)
same-tick/+1-tick unrelated records: E += curios_spill·curiosity  (≈0.1)
```

`curios_spill` applies ONLY within the elicitation window (frozen
`curios_window = 1 tick`, per Murphy 2021's proximity result) and only
to records that survive att_min — a curious moment quietly preserves the
wallpaper. Trait loading: `open` raises `curiosity` (starved→fed
interest channel, individual-differences row). This is the encoding-side
reason RW characters remember the *irrelevant detail* from a day they
were dying to know something — the user's "selective, cue-laden"
requirement now has a second spillover channel beside tag-capture (§2
v1.7).

## 17. Wakeful rest — the minute after matters (ESTABLISHED, magnitude noisy)

Dewar, Alber, Butler, Cowan & Della Sala (2012, Psych. Sci. 23:955):
10 minutes of quiet wakeful rest after learning boosted retention at
7 days — no interim retrieval needed; mechanism = post-encoding replay
protected from interference (Tambini, Ketz & Davachi 2010; Carr, Jadhav
& Frank 2011 rodent replay). Effect demonstrated in healthy OLDER adults
(Dewar's sample was 61–87) and in amnesic patients — it is a cheap,
age-robust consolidation shield, not an encoding strategy.

**Formalization.** Frozen constant `rest_window = 0.007` day (~10 min).
A record's post-encoding minute is "rested" if the world logged ≤1 new
same-modality event for this character in the window (cheap density
check on the event ledger). Rested records get, at window close:

```
strength += rest_gain·(1 − strength)       (rest_gain ≈ 0.12)
```

— a small retroactive interference discount. Deliberately NOT gated on
sleep or arousal (it is not consolidation machinery, it is interference
avoidance — Dewar's own framing). Age-flat by design (demonstrated
61–87). HYPOTHESIS for the sim: this is the quiet-mechanism that makes
"a long pause after the news" legible to viewers — the character who
sits still after bad news remembers it better.

## 18. Implementation intentions — cue-bound plans encode as commands (CONSENSUS)

Gollwitzer (1999); Gollwitzer & Sheeran (2006, AESP 38:69 — 94 tests,
d = .65 on goal attainment): an intention stated as "when cue X, I will
do Y" outperforms an equivalent bare goal intention; component processes
verified — the specified cue becomes hyper-accessible and the response
partially automatized (Webb & Sheeran 2006). This is an ENCODING-side
phenomenon: the if–then format writes a stronger cue→action binding at
intention formation, which §5.14's prospective machinery then fires on.

**Formalization.** Intention records (§9/§5.14) gain optional fields
`ifCue` (concrete trigger cue) and `thenAct`. When both are populated:

```
intention.cueBinding += impl_intent_gain          (≈0.25, applied to the
                                                   focal-cue leg of §5.14)
nonfocal-cue cost unchanged — if–then plans do not rescue vague cues
```

Deliberate scope limit: the gain lands on cue-binding strength, not on
the intention's memory record itself (people forget the *plan* while the
trigger still fires — the literature's automatization claim). Trait
loading: `consc` raises the probability a character *forms* if–then
intentions at all (world-builder dial: planners vs drifters) — the param
itself is population-flat.

## 19. Learning by teaching expectancy — "I'll have to explain this" (ESTABLISHED)

Fiorella & Mayer (2013); Kobayashi (2019 meta, JPR — 28 studies):
expecting to teach material improves learning even when teaching never
happens — g ≈ 0.35 for preparing-to-teach alone, g ≈ 0.56 when teaching
follows; interactive-teaching expectancy > non-interactive. Mechanism:
organization + elaboration at intake (the encoder builds an explainable
structure, not a test-proof one).

**Formalization.** Event flag `willTeach:true` — set when the character
encodes information they expect to relay *with intent to inform* (the
waiter memorizing the specials for tables, C5 preparing to tell the
flatmate about the rent). `E += teach_expect_gain·(0.5 + 0.5·interactive)`
(≈0.2; interactive flag if the expected audience will push back —
gossip-to-be-challenged encodes deeper than a note-to-self).
The `retell`/`hearAccount` machinery then delivers the second half of
the meta's effect naturally through §4.11 S-growth — no double counting:
teach_expect_gain is birth-side only. Trait loading: none direct —
`social` trait raises how often willTeach fires (world-layer frequency),
not its size.

## 20. Proper names — the semantically empty field (CONSENSUS)

Cohen (1990, BJPsych 81:287): names for unfamiliar faces are recalled no
better than meaningless non-words and worse than occupations —
homonym-matched ("Mr Baker" vs "baker") the NAME still loses (McWeeny et
al. 1987), because names lack the semantic hooks elaboration grabs.
Stanhope & Cohen (1993): distinctiveness of the name itself helps —
a distinctive name is learned faster. Cohen & Faulkner (1986): the
name deficit is sharply age-graded.

**Formalization.** `verbatim.name` fields on non-familiar persons
(PersonModel.familiarity < `know_protect_thresh`) take birth strength
`×(1 − name_penalty)` (≈0.3) — the field most likely to be confabulated
later is now born thinnest, which is exactly the human phenomenology
("I know he's a teacher — his name is…"). Exemptions, all sourced:
`coherentUnit:true` names (name on an already-familiar face — unitized),
distinctive names (`isolated` applies to the name field), and names the
character generated/spoke themselves (gen_gain/prod_gain on the field).
Age scaling: `name_penalty ×(1 + age_eff/80)` — the classic TOT
generator for the old cohort (Cohen & Faulkner 1986). This slots into
the §5.10 person-recognition cascade: faces survive, names die first —
already the model's direction, now priced at birth instead of only at
decay.

## 21. Other-group faces — owngroup_loss made real (CONSENSUS, gated on world data)

Meissner & Brigham (2001, PP&L 7:3 — 39 articles, 91 samples, N≈5,000):
own-race bias is a mirror pattern — own-group faces yield more hits AND
fewer false alarms; aggregate discriminability advantage significant;
moderated by interracial contact. Adolescent meta (2024, PMC11446075):
g ≈ 0.24, small but positive — the bias is present early, not acquired
late. Part I left `owngroup_loss` as an optional stub; this version
makes it a real param with the same shape as `oab_loss`:

**Formalization.** `PersonModel.familiarity` accrual ×(1 − owngroup_loss)
(0.15) when the world supplies a group tag on the person and it differs
from the character's; the tag list is world-builder's data decision —
memory spec takes the flag, never invents categories. Reduced by
contact: `×(1 − 0.5·contact_share)` where `contact_share` = fraction of
the character's PersonModel roster sharing that group tag (perceptual-
expertise moderator in the meta). Symmetric at all ages; present in
childhood per the adolescent meta (no ramp below ~10 — treat as flat,
flag HYPOTHESIS for <10).

## 22. Expertise — the domain is an encoding substrate (CONSENSUS)

Chase & Simon (1973) — chess masters' memory advantage is domain-locked
(random boards: no advantage); Ericsson & Kintsch (1995) long-term
working memory — experts encode domain events into retrieval structures
that bypass raw-capacity limits. For RW this means `enc_base` is the
wrong lever for experts: the DomainTable (cast-profiles §3) should gate
a CONTENT-SCOPED encoding bonus.

**Formalization.** Event field `domain` (topic tag, world-supplied).
When `domain ∈ character.DomainTable` with strength ≥ 0.6:

```
E += expert_encode_gain·domainStrength        (expert_encode_gain ≈ 0.15)
peripheral-field write prob: vivid_detail × expert_detail_w   (≈1.2, clamp 1.0)
```

— experts write WIDER records in-domain (more chunks bound, Chase &
Simon's larger chunk count), not just stronger ones. Deliberate nulls:
no transfer (expert_encode_gain never applies outside DomainTable);
no θ-side discount in-domain (expertise's retrieval advantage is
already carried by denser links); complements — never overlaps —
`expert_lure` (§6.3/§5.6): experts encode in-domain events deeper AND
accept in-domain gist lures faster. Both edges are the same sword.

## 23. Directed forgetting — "forget I said that" is an encoding instruction (ESTABLISHED, bounded)

Item-method directed forgetting (MacLeod 1998 review; Rupprecht &
Bäuml 2016 aging meta, Psych. Aging — young d≈1.17, old d≈0.81):
a per-item forget cue produces a real, moderate R–F gap, driven by
selective rehearsal cessation on F-items — an ENCODING mechanism
(list-method is retrieval-side inhibition; §4.12 already owns that
channel — no overlap). Hall et al. (2021 meta, PB&R): emotional items
resist ~4.2% — negative/self-relevant content partially overrides the
instruction. Clinical populations show REDUCED directed forgetting
(2023 meta, osf.io/9vdgc) — load `neurot`/`stress` negatively.

**Formalization.** `tagEvent(charId, recordRef, {forget:true})` —
in-world trigger: "let's never mention this," "you didn't hear it from
me" (non-secret content; secrets use `confidential`). Effect: the
record's retell/rehearsal eligibility drops (`s_gain` receipts
×(1 − df_loss), df_loss ≈ 0.3, applied on every subsequent rehearsal
opportunity — the instruction blocks elaboration AFTER birth, matching
item-method's rehearsal-cessation account) and `strength` takes a
one-time `×(1 − df_loss·(1 − arousal)·(1 − 0.5·neurot>0))` — emotional
and ruminative content resists exactly as the metas say. The record is
never deleted and keeps ordinary cue access — directed forgetting
produces weaker memories, not absent ones (RW consequence: "we agreed
to forget it" makes the thing fade faster, never un-happens it).
Contrast documented: §6.19 — this is not repression; the instruction is
external, bounded, and leaves a retrievable trace.

## 24. Crafted engagement — drawing beats enacting (ESTABLISHED, small-n lit)

Wammes, Meade & Fernandes (2016, QJEP 69:1752; Fernandes, Wammes &
Meade 2018 CDPS review): drawing a to-be-remembered item beats writing,
visualizing, elaborating, and even tracing — the trace integrates
elaborative + pictorial + motor codes. Meade, Wammes & Fernandes (2019,
Exp. Aging Res.): preserved in healthy older adults AND probable
dementia — the strongest single-mode encoding gain in the literature at
our grain.

**Formalization.** Extend `engagement` enum with `"crafted"` (drawing,
writing by hand, physically building the thing). HYPOTHESIS fold, per
the mechanism account: crafted events collect `enact_gain + gen_gain +
concrete_gain` — no new param. If a later version finds crafting
super-additive beyond that sum, reinstate a dedicated term (P230
guards). Rare in a life-sim — grocery lists, sketches, the landlord's
ledger — but the cheapest way to make a keepsake record almost
indestructible, and the dementia-resilience finding makes it the third
age-robust channel beside enactment and unitization.

## 25. Deliberate non-adds (v24)

- **Disfluency / hard-to-read fonts** (Diemand-Yauman, Oppenheimer &
  Vaughan 2011): multiple failed replications and meta-analytic collapse
  (Rummer et al. 2016; Xie et al. 2018) — a "desirable difficulty" that
  isn't. No param; noted so nobody adds it later.
- **Glucose/caffeine at encoding:** thin, noisy literature at our grain;
  arousal-level effects ride `synchrony`/`stress` already. No params.
- **Pain/hunger/fatigue states:** no dedicated channels — they are
  secondary-task pulls and ride `daLoad` (HYPOTHESIS fold; if the world
  supplies `context.pain` etc., map to daLoad at fixed weights
  0.4/0.2/0.3 — frozen).
- **Encoding specificity / cue-overload:** retrieval-side machinery
  (§5.2); nothing here.
- **Remindings at encoding** (Hintzman 2011 — a new event that reminds
  of an old trace integrates them): §5.17's reminding chain already
  writes the link on the retrieval path; spacingBonus boosts the old
  record on re-encounter. Cross-reference only.
- **List-method directed forgetting:** retrieval inhibition, owned by
  §4.12 suppression — kept out of §2 by the same method split the
  literature uses (MacLeod 1998).

## 26. Parameter summary (new in v2.4 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `abe_gain` | 0.15 | 0–0.4 | detection-event encoding boost | Swallow & Jiang 2010/2014; ESTABLISHED |
| `abe_spill_mult` | 0.5 | 0–1 | same-tick spillover fraction | Swallow & Jiang 2010 |
| `curios_gain` | 0.2 | 0–0.5 | curiosity-state target gain | Gruber 2014; 2025 meta |
| `curios_spill` | 0.1 | 0–0.3 | incidental-material spillover | Murphy 2021 (window-locked) |
| `rest_gain` | 0.12 | 0–0.3 | post-encoding quiet-window shield | Dewar 2012 |
| `impl_intent_gain` | 0.25 | 0–0.6 | if–then cue-binding strength | Gollwitzer & Sheeran 2006 d=.65 |
| `teach_expect_gain` | 0.2 | 0–0.5 | preparing-to-teach elaboration | Kobayashi 2019 g=.35 |
| `name_penalty` | 0.3 | 0–0.6 | unfamiliar-person name thinning | Cohen 1990; age-scaled |
| `owngroup_loss` | 0.15 | 0–0.4 | other-group familiarity accrual cut | Meissner & Brigham 2001 |
| `expert_encode_gain` | 0.15 | 0–0.4 | in-domain encoding bonus | Chase & Simon 1973; E&K 1995 |
| `expert_detail_w` | 1.2 | 1–1.5 | in-domain record width multiplier | chunking |
| `df_loss` | 0.3 | 0–0.6 | item-method forget-instruction cost | MacLeod 1998; Rupprecht 2016 |

**Frozen constants (v2.4):** `abe_window = 1 tick`, `curios_window =
1 tick` (phasic elicitation only — Murphy 2021), `rest_window = 0.007`
day (~10 min, Dewar 2012), crafted-mode fold (enact+gen+concrete sum —
P230 audits), state→daLoad weights {pain .4, hunger .2, fatigue .3}.

## 27. Validation probes P221–P230

- **P221 (MUST) attentional boost:** detected:true events recall higher
  than matched non-detection events (T-diff d ∈ [0.2, 0.6]) AND same-tick
  co-encoded ambient records beat surrounding ambient records; both
  effects vanish when the character holds no monitoring set
  (Swallow & Jiang's task-dependence).
- **P222 (SHOULD) curiosity spillover:** high-curiosity events → +recall
  on target AND on unrelated same-window records; spillover absent
  outside curios_window (Murphy 2021 proximity).
- **P223 (SHOULD) wakeful rest:** rested vs busy-window records differ
  at 7 days (≥1.2× retained proportion); effect flat across age bands
  (Dewar's 61–87 sample) and absent when the window contains ≥2 new
  same-modality events.
- **P224 (MUST) implementation intentions:** if–then intentions
  (ifCue+thenAct populated) fire ≥1.5× vague ones on the focal-cue
  channel at matched schedule; nonfocal-cue firing unchanged
  (boundary of the mechanism).
- **P225 (SHOULD) teach expectancy:** willTeach events → higher delayed
  recall and higher organization subscore (linked-record completeness);
  interactive flag > non-interactive (Kobayashi 2019 moderator).
- **P226 (MUST) name penalty:** unfamiliar-person `verbatim.name`
  recalled worse than same-person semantic facts at matched E
  (Cohen homonym design); penalty shrinks with familiarity tier and
  grows with age_eff (Cohen & Faulkner 1986).
- **P227 (SHOULD) owngroup:** other-group PersonModels accrue
  familiarity slower and show the mirror pattern (fewer hits AND more
  false alarms — not just criterion shift; Meissner & Brigham);
  contact_share attenuates.
- **P228 (SHOULD) expertise:** in-domain events get more populated
  verbatim fields + higher E; zero out-of-domain transfer (TOST);
  expert_lure path unchanged (double-edged check).
- **P229 (MUST) directed forgetting:** forget-tagged records show the
  R–F gap (~30% relative at df_loss 0.3), never delete (all records
  still cue-accessible), emotional records resist by the meta's ~4%
  margin, high-neurot cohort resists more.
- **P230 (SHOULD) crafted mode:** crafted events ≥ enacted on
  recognition, preserved-or-larger in the 65+ cohort (Meade 2019
  dementia result as ceiling case); the no-new-param fold is audited —
  residual crafted-specific variance beyond the three-gain sum ≤0.02.

## 28. Spec deltas delivered (v2.4)

- `memory-model-spec.md` → v2.4: §2 +8 bullets (ABE, curiosity,
  wakeful rest, implementation intentions, teach expectancy, name
  penalty, owngroup, expertise, directed forgetting, crafted mode);
  §7 +12 params + 5 frozen constants; §10 contract additions —
  Event fields `detected`, `curiosity`, `willTeach`/`interactive`,
  `domain`, `engagement:"crafted"`; Intention fields `ifCue`/`thenAct`;
  `tagEvent` gains `{forget:true}`.
- `character-memory-profiles.md`: +12 clamp rows; archetype deltas
  (expert via DomainTable — automatic; older adult name_penalty ↑ via
  age_eff — automatic; high-`consc` bibles form more if–then
  intentions; high-`neurot` resist df_loss — P229); v2.4 note §12.
- `validation-design.md`: registry → P1–P230.
- `human-memory-research.md`: §24 v24 summary appended.

## 29. Sources new to this version (all verified 2026-09-23)

- Swallow & Jiang 2010 (Cognition 115:118); Swallow & Jiang 2011
  (APP 74:70 — goal-relevance not rarity); Swallow & Jiang 2014
  (APP 76:466 — true-baseline boost); Swallow & Jiang 2013 (Front.
  Psych. 4:274 — review + dual-task interaction model).
- Gruber, Gelman & Ranganath 2014 (Neuron 84:486); Murphy, Dehmelt,
  Yonelinas, Ranganath & Gruber 2021 (Learn. Mem. 28:34 — proximity);
  Gruber & Ranganath 2019 (TiCS — PACE); PB&R 2025 state-curiosity
  meta (s13423-025-02800-8).
- Dewar, Alber, Butler, Cowan & Della Sala 2012 (Psych. Sci. 23:955);
  Tambini, Ketz & Davachi 2010 — replay substrate.
- Gollwitzer 1999 (Am. Psych. 54:493); Gollwitzer & Sheeran 2006
  (AESP 38:69 — 94 tests, d=.65); Webb & Sheeran 2006 (JESP 43:295).
- Fiorella & Mayer 2013 (Contemp. Ed. Psych. 38:281); Kobayashi 2019
  (JPR meta — g .35/.56, 28 studies).
- Cohen 1990 (BJPsych 81:287); McWeeny et al. 1987 (homonym design);
  Stanhope & Cohen 1993; Cohen & Faulkner 1986 (age gradient);
  Cohen & Burke 1993 (Memory 1:249 review).
- Meissner & Brigham 2001 (PP&L 7:3 — 39 articles/91 samples);
  adolescent ORB meta 2024 (PMC11446075, g≈0.24).
- Chase & Simon 1973; Ericsson & Kintsch 1995 (LTWM).
- MacLeod 1998 (directed-forgetting review); Rupprecht & Bäuml 2016
  aging meta (young d 1.17 / old d 0.81); Hall et al. 2021 (PB&R —
  emotional resist ~4.2%); clinical DF meta 2023 (osf 9vdgc).
- Wammes, Meade & Fernandes 2016 (QJEP 69:1752); Fernandes, Wammes &
  Meade 2018 (CDPS 27:302); Meade, Wammes & Fernandes 2019 (Exp. Aging
  Res. — dementia-preserved).
- Deliberate-null sources: Diemand-Yauman et al. 2011 vs Rummer et al.
  2016 / Xie et al. 2018 (disfluency collapse); Hintzman 2011
  (remindings — cross-ref).
