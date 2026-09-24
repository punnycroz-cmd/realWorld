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

---

# Part III — encoding-mechanics, third pass (v36 focus)

**Version tag:** spec v3.5. Part I priced *how* an event was processed;
Part II priced the *motivational state* and *content class*. Part III
prices the **capacity and competition structure of the moment itself** —
what else was on screen (perceptual load), how much could fit (capacity),
what the previous moment left behind (attention residue), what the
character was about to do (next-in-line, pending intentions), what they
handed off to a device (offloading), what grabbed the encoder from
outside (threat capture), and two cheap temporal/context modifiers
(sleep-adjacency, varied-context re-encoding). 18 new params, 7 frozen
constants, 10 probes (P358–P367).

## 30. Perceptual load — the scene's crowding sets the encode bar (CONSENSUS direction; magnitude ESTABLISHED)

Lavie's load theory (Lavie 1995; Lavie 2005; Cartwright-Finch & Lavie
2006, Cognition 102:321 — verified): when the attended task carries high
*perceptual* load, capacity is exhausted by the focal material itself and
irrelevant stimuli are filtered at early selection — including stimuli
that would otherwise be unmissable (load-induced inattentional
blindness, replicated in the QJEP 2022 meta of IB manipulations). At
LOW perceptual load, spare capacity spills over involuntarily and
distractors are processed — the theory's signature asymmetry. Murphy &
Greene (2016, Front. Psych. — verified) ran the paradigm on eyewitness
memory: high load left CENTRAL detail intact while peripheral details
(passerby at the edge of the scene) degraded and leading-question
susceptibility rose; the effect crossed modalities (visual load hurt
auditory recall). Forster & Lavie (2009, Cognition 111:345 — verified):
high perceptual load REDUCES mind-wandering — an absorbed task leaves no
spare capacity for the mind to wander with.

This is NOT §4's `daLoad`. `daLoad` is a competing task pulling central/
working-memory resources (late-selection, qualitative shallowing);
`perceptLoad` is the focal channel itself being saturated — a different
knob with different consequences: high daLoad degrades the focal record;
high perceptLoad protects the focal record and kills the ambient ones.

**Formalization.** Event field `perceptLoad ∈ [0,1]` (scene perceptual
crowding on the focal task — world supplies from occupancy/visual-density
tags; default 0.4):

```
for non-focal (ambient/incidental) records formed in the same tick:
    att_min_eff = att_min·(1 + load_att_raise·perceptLoad)   (load_att_raise ≈ 1.0)
    if written at all: E ×= (1 − load_periph_supp·perceptLoad) (≈ 0.5)
at perceptLoad < 0.3: ambient attention ×(1 + load_spill)      (≈ 0.2 — spillover)
all records this tick: lapse_p ×= (1 − load_lapse_relief·perceptLoad) (≈0.5 — Forster & Lavie)
records born at perceptLoad ≥ 0.6: set load_flag:true — later
    misinformation adoption +0.1 on the §6.3 path (Murphy & Greene
    suggestion result; mirrors sleepdep_flag's permanent-marker trick)
```

RW consequence: a packed, loud party writes deep records about the
person the character was talking to and almost nothing about the room —
and the few room-records that exist are MORE rumor-malleable. An empty
afternoon writes everything faintly, including the odd detail that will
cue a memory years later.

## 31. Capacity bound — the record has a width, not a wish (CONSENSUS)

Cowan (2001, BBS 24 — verified): the focus of attention holds ~4 chunks
(3–5), not Miller's 7. Until now the spec let an event write as many
fields as `vivid_detail` allowed; nothing stopped a 9-element event from
minting a 9-field record. Humans don't do that — they bind what fits and
the rest is thin air.

**Formalization.** Param `wm_cap` (default 4, integer, trait-jittered
±1 by `wmc`; mild age scaling `×(1 − 0.15·age_eff/80)`). At encode,
count the event's writable elements (verbatim fields + cueVector keys +
participant links). If n > wm_cap: rank elements by `attention×
selfRelevance` (per-field priority, same sort key as the ABC central/
peripheral split); the top `wm_cap` write normally; the remainder write
with probability `vivid_detail·cap_spill` (cap_spill ≈ 0.5) at strength
×0.6. Chunking already exists in the model's language: `coherentUnit`
merges its bound fields into ONE element (a signature action is one
chunk), and DomainTable strength ≥0.6 merges up to
`floor(domainStrength·3)` in-domain elements — the expert literally sees
fewer things (Chase & Simon 1973, reuse, no new param). This is the
mechanism behind "she caught four of the nine things he said" — and the
correcting answer to any complaint that the archive is too complete.

## 32. Attention residue — the previous scene doesn't end on time (ESTABLISHED, org-lit source)

Leroy (2009, OBHDP 109:168 — verified): switching to a new task leaves
part of attention behind on the prior task — especially when the prior
task was unfinished or interrupted — degrading performance on the new
one; completing the prior task under closure reduces (doesn't erase) the
residue. Event-segmentation machinery (§5, Part I) prices the boundary
ITSELF; the residue is what hangs over the far side of it.

**Formalization.** When a `boundary:true` event fires, the world tags it
`interrupted:true` if the prior segment was cut off (unfinished task,
mid-conversation exit) or `closedClean:true` if it reached a natural end.
For the next `residue_ticks` (3 ticks, frozen) after the boundary,
records take an effective `daLoad += residue_load·residue_decay^t`
(`residue_load` ≈ 0.3, `residue_decay` ≈ 0.5). Modifiers:
`residue_load ×= 1.3` on `interrupted`, `×= 0.5` on `closedClean` —
Leroy's two moderators, both verified directions. Routed through daLoad
(not a new channel) because the residue IS central-resource
competition — the prior event model still occupies working memory.
RW consequence: "she came to dinner still inside the meeting" is now a
computable sentence — and post-conflict scenes write thinner records,
which is exactly how the worst weeks of a life compress in hindsight.

## 33. Next-in-line — the turn you were about to take (CONSENSUS, small lit)

Brenner (1973, JVLVB 12:320 — verified): turn-takers recall less of what
was said immediately before their own turn — the "scallop" dip, growing
with performance difficulty. Bond (1985, JPSP 48:853 — verified):
it is an ENCODING failure, not retrieval — semantic cues don't rescue it,
but instructing subjects to elaborate beforehand reverses it; Bond,
Omar, Pitre & Lashley (1991) narrowed the mechanism to elaborative-
rehearsal failure specifically (eye contact irrelevant). For a dialogue-
heavy sim this is the single highest-yield conversational encoding fact
in the literature: people remember what THEY said (gen_gain, Part I)
and not what you answered.

**Formalization.** Event flag `floor_next:true` on records formed while
the character was composing an imminent utterance or action (dialogue
layer supplies — it knows the turn queue). On such records, for all
other-agent content: `attention ×= (1 − next_inline_cost)` AND
`elaboration ×= (1 − next_inline_cost)` (`next_inline_cost` ≈ 0.35 —
the elaboration leg is the literature's named mechanism, so the hit is
double-channel like daLoad but driven by internal composition, not an
external task). The character's OWN turn record is exempt (it carries
gen_gain anyway). Window: the tick(s) the character holds floor_next —
typically one turn back; Brenner's scallop reached ~3 items, so the
flag may persist up to 3 utterances back on long self-monologues
(frozen `nil_reach` = 3).

## 34. Pending-intention pull — open loops tax the encoder and heat their cues (CONSENSUS on direction)

Goschke & Kuhl (1993, JEP:LMC 19:1211 — verified): uncompleted
intentions sit in persisting activation — the intention-superiority
effect — even with rehearsal prohibited. Marsh, Hicks & Bink (1998,
JEP:LMC 24:350 — verified): COMPLETED intentions drop BELOW neutral
activation — completion inhibits, doesn't just release; Marsh & Hicks
(1998, M&C 26:633 — verified): canceled intentions are likewise
inhibited. §5.14 already fires the cues; Part III prices the encoding-
side ecology the same activation creates:

**Formalization.**
- **Tonic drain:** while the character holds n pending Intentions,
  effective `daLoad += pending_intrude·min(n, 5)` (`pending_intrude` ≈
  0.04, cap 0.2) — the intention set is a permanent low-grade second
  task. This is the mechanistic twin of §32's residue (residue is a
  closed-model echo; this is an open-model hum).
- **Cue heating:** records whose cueVector overlaps a pending
  intention's `ifCue`/`thenAct` get `E += pending_cue_gain` (0.15) —
  goal-relevant material encodes hotter while the loop is open
  (Goschke & Kuhl's accessibility finding applied at birth).
- **Completion release:** when an Intention fires or is canceled, its
  record stops accruing `s_gain` receipts and its β ×=
  `intent_done_decay` (1.3) — the Marsh "completed < neutral" result:
  people really do forget what they already did. (Distinct from the
  prospective-cue miss — the action happened; its representation fades
  faster than a never-fired plan. The "did I send that email" doubt
  rides §5.21's metamemory instruments, not this decay.)

## 35. Cognitive offloading — the device remembers, so the person doesn't (ESTABLISHED, modern-life-critical)

Sparrow, Liu & Wegner (2011, Science 333:776 — verified): expecting
future access to information lowers recall of the information and raises
recall of WHERE to find it — transactive memory with a search engine.
Henkel (2014, Psych. Sci. 25:396 — verified): photographing objects
impaired memory for the objects and their details — EXCEPT when the
photographer zoomed/attended to a feature, which eliminated the cost.
Risko & Gilbert (2016, TiCS 20:676 — verified): offloading is a
metacognition-guided trade — people offload more when internal demand
is high and their confidence low; Gilbert's intention-offloading work
shows external reminders genuinely free internal resources.

**Formalization.** Event flag `offload:true` (the character photographed
it, wrote it down, dictated it, or expects it retrievable online):

```
E ×= (1 − offload_cost)                    (offload_cost ≈ 0.2)
verbatim fields ×(1 − 0.5·offload_cost)
if offloadAttend:true (attended capture — zoom, deliberate framing):
    cost is null (Henkel's zoom condition)
record gains field `extref` (where the trace lives — phone, notebook,
    the person who was told) at birth strength offload_where_gain (0.3)
```

The `extref` field is the whole point: the record isn't deleted, it's
*hollow* — strong pointer, weak content. At reconstruction (§5.5) a
successful extref hit produces "I don't remember it, but it's on my
phone" — retrieval can legitimately STOP at the pointer (dialogue: "hang
on, let me check"). Intention offloading composes: an Intention with
`extCue:true` (phone reminder) pays `pending_intrude ×= 0.3` (frozen
`offload_intrude_relief`) — external reminders genuinely discharge the
tonic cost — but its internal cue-binding is `×0.5` (frozen
`extcue_bind_mult`): if the reminder doesn't fire, the character is less
likely to notice the cue themselves (Risko & Gilbert's dependency
finding). Bible dial in profiles: `offload_propensity` (frequency of
offload flags — a habit, not a capacity).

## 36. Threat capture — the scene's danger eats the frame (CONSENSUS on anxious amplification; DEBATED in nonanxious)

Öhman & Mineka (2001): threat stimuli capture attention via a priority
channel; Bar-Haim, Lamy, Pergamin, Bakermans-Kranenburg & van IJzendoorn
(2007, Psych. Bull. 133:1 — verified: 172 studies, N≈4,000, d = 0.45)
found the bias robust across paradigms in anxious participants and
essentially ABSENT in nonanxious — the moderation is the finding.
Cisler & Koster (2010, Clin. Psych. Rev. — verified) decompose it into
facilitated capture + delayed disengagement. Encoding-side consequence:
a threat stimulus in the scene wins the competition the same way an
emotional-central field wins the ABC — but at the SCENE level, eating
co-occurring neutral records.

**Formalization.** Event flag `threatCue:true` on the threatening
element of the scene (world supplies: weapon, aggressive posture,
phobic-class object, threat-relevant face). The threat record gets
`E += threat_capture` (0.2). Co-occurring non-threat records in the
same tick take `E ×= (1 − threat_drain_eff)` where
`threat_drain_eff = threat_drain·(0.3 + 0.7·traitAnx)` (`threat_drain`
≈ 0.3; traitAnx = neurot>0/anxiety loading — Bar-Haim's absent-in-
nonanxious result is honored by the 0.3 floor, not deleted: everyone
prioritizes a little, the anxious lose the frame). Composes with —
doesn't duplicate — the arousal ABC (item-level field reallocation) and
v3.1's socialThreat retrieval vigilance: this is the birth-side channel
that was missing. The threat record's own cues feed §4.9 conditioned
acquisition normally — the flashbulb of fear is complete.

## 37. Sleep-adjacency — the last hours of the day are protected (CONSENSUS direction; effect-size ESTABLISHED)

Jenkins & Dallenbach (1924, Am. J. Psych. 35:605 — verified, the
landmark): forgetting is slower across sleep than across equal wake
time — sleep protects against interference. Gais, Lucas & Born (2006,
Learn. Mem. 13:259 — verified): declarative memory is enhanced when
sleep follows within a few hours of learning, independent of time of
day. The sim already prices sleep QUALITY (`sleepFactor`); what it
didn't price is that material encoded near the day's sleep boundary
gets consolidated before wake-interference can accrue — the evening
conversation outlives the morning one at matched objective delay.

**Formalization.** Frozen `pre_sleep_window` = 0.125 day (~3h, Gais's
"within a few hours"). At the day's sleep-consolidation tick, episodic
records created inside the window get `strength += pre_sleep_gain·
(1 − strength)` (`pre_sleep_gain` ≈ 0.1). Deliberately orthogonal to
`sleepFactor` (this is adjacency, not depth) and to §2's emo_consol
path (arousal-independent). Small by design — the mechanism is
interference-avoidance, same family as Part II's rest_gain.

## 38. Varied-context re-encoding — each new setting builds a new door (ESTABLISHED, meta-weak but real)

Glenberg (1979); Smith & Rothkopf (1984 — verified); Smith & Vela (2001,
PB&R meta — verified): material restudied/re-encountered in VARIED
contexts is recalled better than material always met in one context —
each new context adds retrieval routes (decontextualization). §2's
spacingBonus already boosts the OLD record on spaced re-activation;
what it doesn't do is WIDEN it — a record re-met only in the same room
keeps the same thin cue set forever.

**Formalization.** When spacingBonus fires (re-activation past
`spacing_min_gap`), if the current cueContext differs from the record's
stored tags (place/mood/social keys that don't match), append up to
`ctx_var_add` (2) cue fields from the new context — the record accrues
doors, not strength. Same-context re-encounters add nothing beyond the
existing spacingBonus. RW consequence: the friend you only ever see at
the bar is a bar-locked memory; the colleague you also bumped into at
the market, the hospital, the funeral — reachable from everywhere. This
is the encoding-side half of why socially mobile lives have more
recoverable pasts.

## 39. Deliberate non-adds (v36)

- **Serial-position primacy:** first items in an episode already collect
  `boundary_gain` (they sit at the opening boundary) plus whatever
  elaboration they drew; Rundus's rehearsal account routes through
  `elaboration`. A dedicated primacy param would double-count — P358's
  harness audit includes a residual-primacy check (≤0.03).
- **Reactive JOL:** making a judgment-of-learning slightly improves
  learning (Soderstrom et al. 2015 meta — small positive reactivity). A
  JOL is a generated self-judgment; if the world emits one as an event
  it collects `gen_gain` normally. No param.
- **Seductive details:** salient-irrelevant content harming focal
  encoding (Harp & Mayer) rides `daLoad` + the §30 incidental machinery
  — a fascinating tangent IS a competing task. No param.
- **Massed re-encoding damp:** repetition without spacing already dies
  on three existing rails — `novelty→0` merge (§4.3), spacingBonus's
  `spacing_min_gap` floor, and the Part-I maintenance-rehearsal null.
  No `reencode_damp`.
- **Reward motivation:** anticipatory reward enhances hippocampal
  encoding (Adcock et al. 2006) — but §2's `value_select`/importance
  channel already routes goal-relevant value. Reward is folded into
  `importance`, not a separate term (HYPOTHESIS fold; residual-audit
  ≤0.02 under P363's harness).
- **Momentary suppression flag:** event-level "keeping a poker face" is
  already two-channeled — `regulate_style` on arousal events (v1.7) +
  frozen map: non-arousal suppression effort → `daLoad += 0.2` (frozen
  `suppress_da_map`). No param.
- **Acute post-learning exercise:** consolidation-side arousal already
  rides `post_stress_gain`/sleep paths; exercise's benefit is small and
  mechanism-overlapping. Noted so nobody re-adds it.
- **Modality (heard vs read) at matched content:** no reliable life-
  sim-level asymmetry beyond `prod_gain`/engagement already priced.

## 40. Parameter summary (new in v3.5 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `load_att_raise` | 1.0 | 0–2.0 | perceptual load raises ambient att_min | Cartwright-Finch & Lavie 2006 |
| `load_periph_supp` | 0.5 | 0–0.8 | peripheral-record E suppression under load | Murphy & Greene 2016 |
| `load_spill` | 0.2 | 0–0.5 | low-load involuntary spillover | Lavie 1995/2005 |
| `load_lapse_relief` | 0.5 | 0–1.0 | absorbed task → fewer lapses | Forster & Lavie 2009 |
| `wm_cap` | 4 | 3–5 | chunk bound on record width | Cowan 2001 |
| `cap_spill` | 0.5 | 0–1.0 | overflow-field write probability | Cowan 2001 |
| `residue_load` | 0.3 | 0–0.6 | post-boundary residual daLoad | Leroy 2009 |
| `residue_decay` | 0.5 | 0.2–0.8 | per-tick residue decay | Leroy 2009 |
| `next_inline_cost` | 0.35 | 0–0.7 | turn-anticipation encoding hit | Brenner 1973; Bond 1985 |
| `pending_intrude` | 0.04 | 0–0.1 | per-pending-intention tonic daLoad | Marsh, Hicks & Bink 1998 |
| `pending_cue_gain` | 0.15 | 0–0.4 | goal-related cue heating | Goschke & Kuhl 1993 |
| `intent_done_decay` | 1.3 | 1.0–2.0 | completed-intention β mult | Marsh, Hicks & Bink 1998 |
| `offload_cost` | 0.2 | 0–0.5 | offloaded-content E penalty | Henkel 2014; Sparrow 2011 |
| `offload_where_gain` | 0.3 | 0–0.6 | extref pointer birth strength | Sparrow, Liu & Wegner 2011 |
| `threat_capture` | 0.2 | 0–0.5 | threat-stimulus E priority | Öhman & Mineka 2001 |
| `threat_drain` | 0.3 | 0–0.7 | co-occurring neutral suppression | Bar-Haim 2007 d=.45 |
| `pre_sleep_gain` | 0.1 | 0–0.3 | pre-sleep-window shield at consolidation | J&D 1924; Gais 2006 |
| `ctx_var_add` | 2 | 0–4 | new-context cue fields on re-activation | Smith & Rothkopf 1984 |

**Frozen constants (v3.5):** `residue_ticks = 3`, `nil_reach = 3`
(utterances), `pre_sleep_window = 0.125` day (~3h), `pending_intrude_cap
= 0.2` (n cap 5), `offload_intrude_relief = 0.3` (extCue intentions pay
30% tonic), `extcue_bind_mult = 0.5` (offloaded intentions bind internal
cues half as well), `suppress_da_map = 0.2` (momentary suppression →
daLoad), `perceptLoad_low = 0.3` (spillover threshold), `load_flag_thresh
= 0.6` (misinfo-susceptible birth marker).

## 41. Validation probes P358–P367

- **P358 (MUST) perceptual load:** at matched focal content,
  perceptLoad 0.8 vs 0.2 → fewer ambient records written (≥30% fewer),
  weaker peripheral fields on survivors, central fields statistically
  spared (Murphy & Greene asymmetry); low-load side shows MORE
  incidentals (spillover direction); residual primacy check ≤0.03
  (§39 audit).
- **P359 (SHOULD) load×lapse:** lapse incidence at perceptLoad 0.8 is
  ≤60% of lapse incidence at perceptLoad 0.2 (Forster & Lavie sign) —
  the counterintuitive lock: absorbed scenes produce FEWER unexplained
  holes while producing more absent-by-filter ones.
- **P360 (MUST) capacity bound:** 9-element events write ≤ wm_cap
  full-strength fields; overflow elements appear at ≤ cap_spill rate;
  `coherentUnit` and DomainTable ≥0.6 events write MORE elements
  effectively (chunking) — the expert record is wider without being
  stronger per field.
- **P361 (SHOULD) attention residue:** interrupted-boundary →
  measurable daLoad-equivalent dip on records in the next 2–3 ticks
  (band from residue_load/decay); closedClean boundary → dip present
  but ≤ half (Leroy's moderator ordering: interrupted > clean-close >
  pressured-complete).
- **P362 (MUST) next-in-line:** floor_next tick → recall deficit on
  other-agent content from the immediately-prior utterance at matched
  E (Bond's encoding locus — cued recall does NOT rescue it), own-turn
  record unaffected; deficit scales with the turn's self-composed
  complexity (Brenner's performance-difficulty slope).
- **P363 (MUST) pending-intention ecology:** ≥1 pending Intention →
  tonic encoding dip measurable as daLoad-equivalent; goal-overlapping
  cues encode hotter (pending_cue_gain); completed/canceled intention
  records decay FASTER than never-fired matched records (Marsh
  inhibition direction — sign-locked); reward residual audit ≤0.02
  (§39 fold).
- **P364 (MUST) offloading:** offload events → lower content recall
  with extref recall ≥ content recall (the hollow-record signature);
  offloadAttend nulls the cost (TOST vs observed); extCue intentions
  pay reduced tonic but miss MORE cue firings if the reminder fails
  (dependency direction, Risko & Gilbert).
- **P365 (SHOULD) threat capture:** threatCue records beat matched
  neutral records; same-tick neutrals drained; drain scales with
  traitAnx and approaches zero (floor 0.3·threat_drain) in the
  nonanxious band — Bar-Haim's moderation preserved, not absolute.
- **P366 (SHOULD) pre-sleep:** records encoded inside pre_sleep_window
  outlive matched morning-encoded records at equal objective delay
  (J&D direction; band admits the effect is modest); independent of
  sleepFactor manipulation (adjacency, not depth).
- **P367 (SHOULD) context variability:** records re-activated in
  DIFFERENT contexts accumulate cue fields and remain retrievable
  across more cue contexts than same-context re-activated records at
  matched strength — the door-count effect, not a strength effect.

## 42. Spec deltas delivered (v3.5)

- `memory-model-spec.md` → v3.5: §2 +9 mechanism bullets (perceptual
  load, capacity bound, attention residue, next-in-line,
  pending-intention ecology, offloading, threat capture, pre-sleep
  adjacency, varied-context re-encoding); §7 +18 params; frozen
  constants +9; §10 contract additions — Event fields `perceptLoad`,
  `floor_next`, `offload`, `offloadAttend`, `threatCue`,
  `interrupted`/`closedClean` on boundary events; record field
  `extref`; Intention field `extCue`; record flag `load_flag`.
- `character-memory-profiles.md`: §0 +18 clamp rows; §22 v3.5 note —
  which of these are personality vs ecology (offload_propensity is a
  bible habit; traitAnx already exists via neurot; wm_cap jitters with
  wmc — no new trait).
- `validation-design.md`: registry → P1–P367 (new §55, sources §56).
- `human-memory-research.md`: §35 v36 summary appended.

## 43. Sources new to this version (all verified 2026-09-23)

- Lavie 1995 (JEP:HPP 21:451); Lavie 2005 (TiCS 9:75); Cartwright-Finch
  & Lavie 2006 (Cognition 102:321 — load-induced inattentional
  blindness); Macdonald & Lavie 2008 (JEP:HPP 34:1078); Forster &
  Lavie 2009 (Cognition 111:345 — load reduces mind-wandering); QJEP
  2022 systematic review + three metas on IB (17470218211064903 —
  perceptual-load account supported, cognitive-load account unclear);
  Murphy & Greene 2016 (Front. Psych. 7:1322 — eyewitness load,
  peripheral loss + suggestion, cross-modal).
- Cowan 2001 (BBS 24:87 — magical number 4).
- Leroy 2009 (OBHDP 109:168 — attention residue; unfinished/interrupted
  task residue; closure-under-pressure moderator).
- Brenner 1973 (JVLVB 12:320 — scallop effect); Bond 1985 (JPSP
  48:853 — encoding locus, instruction reversal); Bond & Kirkpatrick
  1982 (JESP 18:307); Bond et al. 1991 (PSPB — elaborative-rehearsal
  mechanism).
- Goschke & Kuhl 1993 (JEP:LMC 19:1211 — intention superiority);
  Marsh, Hicks & Bink 1998 (JEP:LMC 24:350 — completed < neutral);
  Marsh & Hicks 1998 (M&C 26:633 — canceled intentions inhibited).
- Sparrow, Liu & Wegner 2011 (Science 333:776 — Google effects:
  content ↓, where-to-find ↑); Henkel 2014 (Psych. Sci. 25:396 —
  photo-taking impairment, zoom exemption); Risko & Gilbert 2016
  (TiCS 20:676 — offloading review, metacognitive gating); Gilbert
  2022 (intention-offloading review).
- Öhman & Mineka 2001 (fear module); Bar-Haim, Lamy, Pergamin,
  Bakermans-Kranenburg & van IJzendoorn 2007 (Psych. Bull. 133:1 —
  172 studies, d=.45, absent in nonanxious); Cisler & Koster 2010
  (Clin. Psych. Rev. 30:203 — components review).
- Jenkins & Dallenbach 1924 (Am. J. Psych. 35:605); Gais, Lucas &
  Born 2006 (Learn. Mem. 13:259 — sleep within hours, circadian-
  independent).
- Glenberg 1979; Smith & Rothkopf 1984; Smith & Vela 2001 (PB&R
  meta — environmental context effects reliable, modest).
- Deliberate-null sources: Rundus 1971 (primacy=rehearsal);
  Soderstrom et al. 2015 (JOL reactivity meta); Harp & Mayer 1998
  (seductive details); Adcock et al. 2006 (reward anticipation →
  hippocampus); Roig et al. 2013 (post-learning exercise).

# Part IV — encoding-mechanics, fourth pass (v48 focus)

**The gate's exceptions and the social cast.** Parts I–III priced the
encoding formula's main terms (depth, self, engagement, attention, load,
capacity, state). This pass prices the places where the gate BENDS —
the stimuli that pierce `att_min` without permission, the updates that
fail silently, the content classes with their own birth-weight, and the
person-model bookkeeping that decides which of a neighbor's behaviors
deserves ink. Nine mechanisms, six deliberate non-adds, 16 params,
probes P493–P502.

The through-line: a character's memory of other people is not an event
log, it is an EVIDENCE LEDGER with a front-loaded prior — first
encounters set the impression, anomalies during impression-formation
get explained (encoded deeper), and once the model ossifies the
congruent slides in easy while the anomalous either gets elaborated
into a story or never lands at all. Most of RW's remembered drama is
other people; this pass makes sure the ledger looks human.

## 44. Change blindness — the record keeps the old value (CONSENSUS phenomenon; sim formalization HYPOTHESIS)

Rensink, O'Regan & Clark (1997, Psych. Sci. 8:368 — flicker paradigm):
large changes go undetected without attention to the changing region.
Simons & Levin (1998, Perception 27:644 — the door study): ~50% of
pedestrians failed to notice their conversational partner had been
SWAPPED mid-interaction. Levin & Simons (1997): the failure is not
lost detail — the observer forms a belief that nothing changed.
Encoding-side consequence the sim lacked: a record exists, an object
in the world changes, and the record is never updated — the character
remembers the bike in the hallway though it moved to the rack, swears
the shop still opens at 8 though the sign changed. Not decay, not
distortion: a stale field.

**Formalization.** Change events (world emits `fieldChanged:{field,
new_v}` on a mutating object/state — the door color repainted, the
roommate's haircut, the moved bike) update an existing record's field
only if attention to that object ≥ `field_upd_min` (0.35). Below the
gate the field keeps `old_v`, flagged `stale:true` (E-tier, harness
observable, never surfaced verbatim — the character simply believes
the old value). Age knot: `field_upd_min ×(1 + 0.2·age_eff/70)` —
change detection declines in older adults (Veiel, Storandt & Abrams
2006, Psych. Aging 21:492 — verified meta; the decline is in
detection, not in confidence — elders report the stale value just as
certainly). `animate:true` changed objects get `field_upd_min ×= (1 −
animacy_upd_gain)` (0.1) — changes to animate agents are detected
preferentially (New, Cosmides & Tooby 2007, PNAS 104:16598 — animate
monitoring beats even artifact vehicles at matched salience). RW
consequence: the landlord doesn't notice the tenant repainted; the
regular doesn't notice the new barista until spoken to.

## 45. Own-name breakthrough — the unattended channel is listening for YOU (CONSENSUS; magnitude ESTABLISHED)

Moray (1959, QJEP 11:56): ~a third of listeners hear their own name in
the channel they were told to ignore. Wood & Cowan (1995, JEP:LMC
21:255 — verified replication with controls): 34.6% recalled the name;
attention shifted ONLY for the ~two items following the name, then
resettled. Conway, Cowan & Bunting (2001, JEP:G 130:243 — verified):
the breakthrough is concentrated in LOW working-memory-capacity
subjects — the counterintuitive arm: the price of being unable to
inhibit is that your name reaches you anyway. So the att_min gate has
a hole shaped exactly like the self.

**Formalization.** Ambient events (attention < att_min) tagged
`mentionsSelf:true` (the character's name, address, or description
spoke in earshot) bypass the gate with prob
`ownname_break_p − ownname_wmc_slope·wmc_z` (default 0.35, slope −0.10
in σ units — LOW wmc breaks through MORE; sign locked). On breakthrough
the record mints at thin E (`×0.5`, it arrived through the floor not
the door) and sets character state `monitor_tail = ownname_tail` (2)
ticks — brief involuntary monitoring of that channel (Wood & Cowan's
two-item shadow). No `g_mem` moderation (the effect is about
inhibition failure, not memory ability). DEBATED residue: older-adult
direction is inconsistent across labs — declared AGE-FLAT.

## 46. Humor — the joke is the encoding (ESTABLISHED; boundary conditions do the work)

Schmidt (1994, JEP:LMC 20:953 — verified): humorous sentences beat
matched nonhumorous controls on free AND cued recall; the advantage
survives warning but is ATTENUATED in incidental learning and is a
within-subject (contrast) effect — a funny line in a dull day lands;
a funny life amortizes it. Schmidt & Williams (2001, M&C 29:305 —
"the humour effect"): privileged retrieval contributes too — humorous
material is easier to recall from the same storage. Subjective humor
predicts memory even between subjects — the funny-to-you is what
encodes.

**Formalization.** Event field `humor` ∈ [0,1] (world/dialogue tags
jokes, absurdities, comic beats). On attended events only (attention ≥
att_min — Schmidt's incidental attenuation is load-bearing): `E +=
humor_gain·humor·(1 − 0.5·humor_rate)` where `humor_gain` ≈ 0.12 and
`humor_rate` is the character's running share of humor≥0.5 events (same
self-calibrating shape as `emo_rate` — the witty household's jokes are
baseline). Retrieval: humorous records get `humor_retr_gain` small
(0.05, folded into famScore not θ — privileged but not free).
Jitter `humor_gain` on `extra` (sense-of-humor legibility).

## 47. Animacy — the ledger keeps animals and agents (ESTABLISHED, small lit)

Nairne, VanArsdall, Pandeirada, Cogdill & LeBreton (2013, Psych. Sci.
24:2099 — verified): animate words out-recall inanimate matched on
imageability/meaningfulness — "one of the most important item
dimensions controlling retention." VanArsdall et al. (2013, Exp.
Psych. 60:172): the tuning replicates with novel nonwords paired with
animate properties — the ADVANTAGE travels with the category, not the
item's familiarity. Bonin et al. (2015) / animacy-context work
(QJEP-verified thread): context bound to animates is itself better
retained — people are magnets for their surroundings in memory too.
Orthogonal to §36's threat_capture: a kitten encodes like a snake —
priority without fear.

**Formalization.** Event field `animate:true` (agents/animals as
content, not just co-present) → `E += animacy_gain` (0.10), and
non-agent fields of animate-carrying events write at
`×(1 + animacy_gain·0.5)` — the context piggyback. §44's
`animacy_upd_gain` rides the same flag. RW consequence: who DID the
thing outlives what was done; the dog that was there outlives the
furniture that was there.

## 48. Expectancy-incongruence — anomalies earn ink while the model is young (CONSENSUS on existence; sign MODERATED — the flip is the finding)

Hastie & Kumar (1979, JPSP 37:25 — verified lineage): behaviors
incongruent with a forming impression are recalled BETTER — they
attract causal, inter-item elaboration (you explain the kind
neighbor's cruelty to yourself; the explanation IS the encoding).
Stangor & McMillan (1992, Psych. Bull. 111:42 — verified meta, 54
experiments): the sign flips with expectancy STRENGTH — weak/new
expectancies → incongruency advantage; strong/well-established
expectancies → CONGRUENT advantage (the ossified schema assimilates
its evidence; anomalies die unencoded or are distorted into place —
§6.x distortion downstream owns the misremember arm; this pass owns
the encode arm).

**Formalization.** On events tagged `aboutPerson:<id>` whose content
valence mismatches the observer's PersonModel(id).eval: incongruence
magnitude `inc = |contentEval − model.eval|`. If model exposure <
`impress_strong_thresh` (0.6, frozen — formative model): `elaboration
+= incongr_elab·inc` (0.15) — the anomaly earns explanation-work.
If exposure ≥ thresh (strong model): `E += congr_gain·(1−inc)` (0.05)
— congruent evidence slides in easy, and incongruent content takes a
write-prob penalty `(1 − 0.3·(exposure−thresh))` — the settled opinion
literally doesn't file the counterexample (HYPOTHESIS magnitude,
Stangor & McMillan direction). Age knot: `incongr_elab ×(1 −
0.15·age_eff/80)`, `congr_gain ×(1 + 0.2·age_eff/70)` — schema
reliance rises with age (HYPOTHESIS knot, cite-guarded by the
meta's schema-strength moderator).

## 49. Impression primacy — the ledger's first page outweighs its middle (CONSENSUS direction; recency arm DEBATED-but-real)

Asch (1946 — verified lineage): trait order reverses whole
impressions; Luchins (1957 — verified): primacy is the default mode of
impression formation, BUT interpolated activity or delay between
blocks produces recency — the late evidence lands when the early has
been slept on or interrupted. The sim's PersonModel.eval already
aggregates; what it lacked is order-dependence — evidence weight was
flat in exposure order.

**Formalization.** PersonModel eval updates weight each behavior by
`w_i = 1 − impress_primacy·(1 − exp(−i/2))` — early encounters
(i small) weigh MORE (impress_primacy 0.2 → first-behavior weight
≈1.0, asymptote ≈0.8). Under `context.depleted` (§5.38's flag — the
Luchins fatigue/interpolation arm) the update instead weights the
MOST RECENT behavior `×(1 + impress_recency_p)` (0.15) — tired minds
take the latest version of you. Null: primacy applies to EVAL
formation only, never to whether a behavior's record encodes — the
evidence is stored; the verdict is what's front-loaded (Asch's effect
is integrative, not mnemonic — the memory claim stays §48's).

## 50. Motivational intensity narrows — desire has tunnel vision too (ESTABLISHED; previously the sim only let the dark narrow)

Gable & Harmon-Jones (2008, Psych. Sci. 19:476 — verified):
approach-motivated positive affect (desire, pre-goal excitement)
REDUCES attentional breadth — the "positive broadens" story was an
artifact of sampling only low-approach positives (contentment,
amusement). Gable & Harmon-Jones (2010, Emotion 10:599 — verified):
high-approach positive states narrow MEMORY for periphery vs center —
a desire can weapon-focus. Harmon-Jones, Gable & Price (2012, review):
the dimension is motivational intensity, not valence — pre-goal
emotions narrow (acquire the object), post-goal emotions broaden
(survey the field).

**Formalization.** Event field `approachMotiv` ∈ [0,1] (world tags
pre-goal appetitive states — the wanted table, the flirtation, the
deal about to close). `approachMotiv ≥ 0.6` on positive-valence events
applies ABC-style peripheral drain `×=(1 − motiv_narrow·approachMotiv)`
(0.15) to non-goal fields — the positive event narrows like a threat
but via desire, not fear; central (goal-relevant) fields take a small
positive `+= 0.5·motiv_narrow·approachMotiv`. Composes with §36
threat machinery (different flag, same drain shape). RW consequence:
the character mid-courtship remembers the other person and nothing
else about the evening.

## 51. The lie encodes twice — deception's effort and its weak source tag (ESTABLISHED effort; sim-side dual-trace HYPOTHESIS)

Walczyk et al. (2003, Appl. Cogn. Psych. 17:755 — ADTD framework,
verified lineage; Walczyk et al. 2014): lying costs more than truth —
the liar must activate the truth, suppress it, and construct a
plausible replacement in one working-memory pass. The extra
construction work is generative (§24's machinery): the lie is
self-composed. Vrij et al. (2008, review): the cost is real and
detectable. Upstream arm for §6.68's fab machinery: a lie is TWO
encodings — the truth record (inhibited, briefly effortful) and the
said-version (generated). When the source tag rots first, the
said-version is what remains retrievable — the mechanical path by
which liars come to believe their own stories (Polage 2004's
fabrication inflation, already spec'd downstream).

**Formalization.** Event `deceptive:true` (the character is lying in
this emission/event): `E += lie_enc_gain` (0.10 — the suppression +
construction effort encodes deeper) AND the minted record carries
`lie:true` with `sourceStr ×= (1 − lie_src_weak)` (0.20 — the
said-version is born knowing its provenance is contested);
`lie_rehearsed:true` adds `gen_gain` normally (a rehearsed lie is
self-composed content). At recall, `lie:true` records compete with
the truth record on simOp — §6.68's fab_dir decides which drifts
toward belief. Null: `lie_src_weak` does not touch content accuracy —
the liar knows exactly what they said and what happened; they only
lose track of WHICH was real.

## 52. Generative notes — the diary that rephrases remembers; the transcript doesn't (ESTABLISHED mechanism; the famous modality claim FAILED replication — locked null)

Mueller & Oppenheimer (2014, Psych. Sci. 25:1159 — verified):
longhand beat laptop on conceptual memory; mechanism claimed =
verbatim transcription is shallow, reframing is generative. Then the
replications: Urry et al. (2021, Psych. Sci. — verified direct
replication + mini-meta): the MODE difference failed; what survived
is the correlation — more verbatim overlap → worse test performance.
Morehead, Dunlosky & Rawson (2019, Educ. Psych. Rev. 31:753 —
verified replication + extension): differences "premature"; a
no-notes control didn't differ either. Kobayashi (2005, meta):
note-taking's encoding benefit is bounded and reframing-dependent.
So: the DEVICE is a null; the REPHRASING is the mechanism — and it
was always just gen_gain wearing a notebook.

**Formalization.** Event `note:"verbatim"` (transcription —
dictaphone, copy-paste, the stenographer) → no elaboration gain;
the note mints as `extref` (§35 machinery — the notebook is the
store). Event `note:"generative"` (diary, summary, the letter to a
friend) → `elaboration += note_gen_gain` (0.10) ON TOP of normal
gen_gain eligibility — summarizing your day in your own words is the
real encoding act; the paper is a bonus extref. Frozen null:
`note_mode_null = 0` — paper-vs-screen adds nothing (Urry/Morehead).
RW consequence: the cast's diary-keepers get durable first-person
records; a character who only photographs/transcribes keeps an
archive of pointers and a thin past (composes with §35's
offload_cost — the phone-first personality gets doubly hollow).

## 53. Deliberate non-adds (v48)

- **Longhand vs keyboard modality:** failed direct replication (Urry
  et al. 2021; Morehead et al. 2019) — locked null `note_mode_null`;
  the surviving mechanism (verbatim overlap) is priced inside §52.
  Nobody re-adds "paper is better."
- **Melody/jingle encoding:** sung content persists (advertising lore)
  but the life-sim-level asymmetry beyond `concrete_gain` +
  `cue_music_w` (§5.37) is unmeasured; melodies are a CUE type,
  retrieval already owns them. No param.
- **Exposure duration:** longer scenes produce more event ticks → more
  records; duration effects on single-trace strength are confounded
  with attention in the lit and emerge from record count here.
  Deliberate emergence, not a param.
- **Mere exposure / fluency at encoding:** familiarity without recall
  is already `impl_str` (§5.35) — repetition writes the implicit
  channel; a separate exposure param would double-count.
- **Imagery instructions:** "picture it" is an orienting task →
  `elaboration`/`concrete_gain` already; the instruction itself adds
  nothing past intent_null's logic.
- **Emotional granularity as an encoder:** `emo_gran` exists (v4.0) as
  a record property; granularity-of-perception differs from
  granularity-of-labeling in ways the lit hasn't priced at our grain —
  noted so nobody bolts on a second copy.

## 54. Parameter summary (new in v4.6 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `field_upd_min` | 0.35 | 0.15–0.6 | attention gate on change-event field updates | Simons & Levin 1998; Rensink 1997 |
| `animacy_upd_gain` | 0.10 | 0–0.3 | animate changes pass the update gate easier | New, Cosmides & Tooby 2007 |
| `ownname_break_p` | 0.35 | 0.1–0.6 | self-mention pierces att_min | Moray 1959; Wood & Cowan 1995 |
| `ownname_wmc_slope` | −0.10 | −0.3–0 | LOW wmc breaks through more (sign locked) | Conway, Cowan & Bunting 2001 |
| `ownname_tail` | 2 | 0–4 | monitoring ticks after breakthrough | Wood & Cowan 1995 |
| `humor_gain` | 0.12 | 0–0.3 | attended humorous content E bump | Schmidt 1994 |
| `humor_retr_gain` | 0.05 | 0–0.15 | privileged retrieval on humor records | Schmidt & Williams 2001 |
| `animacy_gain` | 0.10 | 0–0.25 | animate content E bump + context piggyback | Nairne et al. 2013 |
| `incongr_elab` | 0.15 | 0–0.4 | incongruent-behavior elaboration, formative models | Hastie & Kumar 1979 |
| `congr_gain` | 0.05 | 0–0.15 | strong-model congruent advantage | Stangor & McMillan 1992 |
| `impress_primacy` | 0.20 | 0–0.5 | early-evidence weight in personModel.eval | Asch 1946; Luchins 1957 |
| `impress_recency_p` | 0.15 | 0–0.4 | depleted-state recency arm | Luchins 1957 |
| `motiv_narrow` | 0.15 | 0–0.4 | high-approach positive narrowing | Gable & Harmon-Jones 2008/2010 |
| `lie_enc_gain` | 0.10 | 0–0.3 | deceptive-emission encoding effort | Walczyk et al. 2003/2014 |
| `lie_src_weak` | 0.20 | 0–0.5 | lie-vs-truth source-tag penalty | Walczyk; Vrij 2008 (magnitude HYPOTHESIS) |
| `note_gen_gain` | 0.10 | 0–0.25 | generative-note elaboration | M&O 2014; Kobayashi 2005 |

**Frozen constants (v4.6):** `impress_strong_thresh = 0.6` (model
exposure gate for the §48 sign flip), `note_mode_null = 0` (locked —
modality adds nothing), `monitor_tail` minted per breakthrough (never
accumulates), `stale:true` is E-tier (harness-only — the character
cannot report their own staleness flag).

## 55. Validation probes P493–P502

- **P493 (MUST) change-blindness stale fields:** `fieldChanged` events
  under attention < field_upd_min leave `stale:true` old values —
  reconstruction reports the pre-change state at full conf (the door-
  study phenotype: the swap is unnoticed, not fuzzy); above the gate,
  fields update; animate changes break the gate at animacy_upd_gain
  rate; older cohorts accumulate more stale fields (Veiel knot).
- **P494 (MUST) own-name breakthrough:** ambient `mentionsSelf` events
  mint records at ≈ ownname_break_p (band admits 0.25–0.45); the wmc
  slope is SIGN-LOCKED negative (low-wmc profile breaks through more
  — Conway 2001); post-breakthrough monitoring measurable for exactly
  ownname_tail ticks; g_mem manipulation has NO effect (null locked).
- **P495 (SHOULD) humor:** attended humorous events out-recall matched
  neutral at equal delay; sub-att_min humor gets NOTHING (incidental
  attenuation — the joke you didn't hear isn't remembered); high-
  humor_rate profiles show the amortized curve (self-calibration).
- **P496 (SHOULD) animacy:** `animate:true` content out-recalls
  inanimate at matched concreteness/imageability; non-agent fields of
  animate events ride the piggyback; the effect is valence-flat (a
  kitten ≈ a snake — orthogonal to threat_capture, sign check).
- **P497 (MUST) incongruence sign flip:** formative person models
  (exposure < thresh) → incongruent behaviors recalled better;
  strong models → congruent advantage + incongruent write-prob
  penalty; the crossover must occur AT the threshold knot, not
  gradually (T-ORDER on exposure, Stangor & McMillan moderation is
  the falsifier).
- **P498 (SHOULD) impression primacy:** matched evidence sequences in
  reversed order produce evals biased toward the FIRST block
  (impress_primacy direction); `context.depleted` flips the bias
  toward the last block (Luchins recency arm); primacy touches eval
  only — the underlying behavior records stay intact (null check).
- **P499 (SHOULD) motivational narrowing:** `approachMotiv ≥ 0.6`
  positive events show peripheral field loss comparable in shape to
  threat_drain but WITHOUT threatCue present — valence-positive
  narrowing must not require arousal≥threat (Gable & Harmon-Jones:
  intensity, not valence).
- **P500 (MUST) lie encoding:** `deceptive` emissions mint records
  with higher E AND weaker sourceStr than matched truthful ones;
  `lie_rehearsed` adds the gen_gain; over serial retells the
  said-version's share of reconstruction grows (fab machinery
  upstream arm live); content accuracy of the lie record itself is
  NOT reduced (null — the liar knows what they said).
- **P501 (SHOULD) note split:** `note:"verbatim"` → no E gain +
  extref minted (hollow archive); `note:"generative"` → elaboration
  bump; mode manipulation (paper vs screen) TOST-equivalent within
  SESOI (the locked null is enforced, not assumed).
- **P502 (MUST — structure) v4.6 regression:** new fields/params pass
  the P457 non-interference pattern (stale:, lie: are E/M-tier and
  steer nothing outside their channels) and the §12.2 commutativity
  pattern (no new op reads across charIds; PersonModel primacy
  updates stay owner-local).

## 56. Spec deltas delivered (v4.6)

- `memory-model-spec.md` → v4.6: §2 +9 mechanism bullets (change-
  blindness stale fields, own-name breakthrough, humor, animacy,
  expectancy-incongruence, impression primacy, motivational narrowing,
  lie encoding, generative notes); §7 +16 params + 2 locked nulls +
  knot notes; §10 contract additions — Event fields `fieldChanged`,
  `mentionsSelf`, `humor`, `animate`, `approachMotiv`, `deceptive`,
  `lie_rehearsed`, `note`, `aboutPerson`; record flags `stale:true`,
  `lie:true`; char state `monitor_tail`, `humor_rate`.
- `character-memory-profiles.md`: §0 +16 clamp rows; §31 v4.6 note —
  which are personality vs world-supplied ecology.
- `validation-design.md`: registry → P1–P502 (new §83, sources §84).
- `human-memory-research.md`: §36 v48 summary appended.

## 57. Sources new to this version (all verified 2026-09-23)

- Simons & Levin 1998 (Perception 27:644 — the door/person-swap
  study); Rensink, O'Regan & Clark 1997 (Psych. Sci. 8:368 — flicker);
  Levin & Simons 1997 (the change-belief arm); Veiel, Storandt &
  Abrams 2006 (Psych. Aging 21:492 — change-detection age meta).
- Moray 1959 (QJEP 11:56 — cocktail-party name); Wood & Cowan 1995
  (JEP:LMC 21:255 — 34.6%, two-item attention shift, verified via
  PubMed 7876773); Conway, Cowan & Bunting 2001 (JEP:G 130:243 —
  low-WMC breakthrough, verified via DOI record).
- Schmidt 1994 (JEP:LMC 20:953 — verified via APA record: within-Ss,
  incidental attenuation, subjective-humor arm); Schmidt & Williams
  2001 (M&C 29:305 — privileged retrieval).
- Nairne, VanArsdall, Pandeirada, Cogdill & LeBreton 2013 (Psych.
  Sci. 24:2099 — verified via PubMed 23921770); VanArsdall, Nairne,
  Pandeirada & Blunt 2013 (Exp. Psych. 60:172); New, Cosmides &
  Tooby 2007 (PNAS 104:16598 — animate monitoring vs vehicles).
- Hastie & Kumar 1979 (JPSP 37:25 — person memory incongruency);
  Stangor & McMillan 1992 (Psych. Bull. 111:42 — verified via DOI:
  54 experiments, expectancy-strength moderator).
- Asch 1946 (forming impressions); Luchins 1957 (primacy-recency;
  interpolated-activity recency arm).
- Gable & Harmon-Jones 2008 (Psych. Sci. 19:476); Gable &
  Harmon-Jones 2010 (Emotion 10:599 — central vs peripheral memory);
  Harmon-Jones, Gable & Price 2012 (Soc. Personal. Psych. Compass
  6:308 review — verified via DOI records).
- Walczyk, Roper, Seemann & Humphrey 2003 (Appl. Cogn. Psych. 17:755
  — ADTD); Walczyk et al. 2014; Vrij et al. 2008 (lying effort
  review).
- Mueller & Oppenheimer 2014 (Psych. Sci. 25:1159 — verified);
  Urry et al. 2021 (Psych. Sci. 32:640 — verified replication, mode
  null + verbatim-overlap survivor); Morehead, Dunlosky & Rawson
  2019 (Educ. Psych. Rev. 31:753 — replication/extension);
  Kobayashi 2005 (Contemp. Educ. Psych. 30:242 — note-taking meta).

---

# Part V — encoding-mechanics, fifth pass (v60 focus)

**Version tag:** spec v5.8. Parts I–IV priced what the event was, how
it was processed, what state the encoder was in, and the social cast
around it. Part V closes the loop between encoding and *the attempts
that precede it* (pretest potentiation, hypercorrection), the
**scaffold the world provides** (environmental support at encoding —
the encode-side leg Craik's theory always had and the spec only had at
retrieval), the **channel that needs no episode at all** (statistical
learning / co-occurrence), the **discriminative ordering of
re-encoding** (interleaving), the **moral-encoding edge** (cheater
source-link — narrowed by the 2009 null), one DEBATED persistence
effect (Zeigarnik), and one adjudicated non-effect locked as a null
(disfluency — the CONTESTED-anchor class §14.2 was built for).
14 new params, 3 locked nulls, 8 probes (P629–P636).

## 58. Pretest potentiation — the failed search warms the landing (ESTABLISHED)

Kornell, Hays & Bjork (2009, JEP:LMC 35:989 — verified: fictional
general-knowledge questions and weak-associate guessing, failed
attempts excluded from analysis): an *unsuccessful* retrieval attempt
before the answer arrives produces better subsequent learning than the
same time spent reading. Richland, Kornell & Kao (2009, JEP:Applied
15:243 — verified: five experiments, benefit survives italics-matched
attention-direction controls, but NOT when the question is merely
shown without an attempt — the attempt, not the prompt, potentiates).
Grimaldi & Karpicke 2012; Little & Bjork 2016; Kornell & Vaughn 2016
(review). Mechanism DEBATED — mediator-network activation vs
attentional orienting — but the phenomenon replicates. Related:
deliberate-error generation ("derring effect," Wong & Lim 2022) is the
same engine — generating a guess, even a wrong one, potentiates the
correction.

**Boundary vs existing machinery:** §5.26 forward testing is a
*successful* recall bout warming the encoder globally for `fwd_win`;
this is the *failed* attempt potentiating the *specific content*. No
overlap: §5.26 fires on emit, this fires on search-without-emit.

**Formalization.** A `recall`/`selfReport` probe that fails
(searchCost incurred, nothing emitted above θ) stamps
`pretest_mark:{topicKey, day}` on char state, lifetime `pretest_win`
(≈0.05 day — same scene, next conversation). The next event whose
topic matches `topicKey` while a mark is live:

```
E += pretest_gain                       (0.2, gated: mark live)
```

The wrong guess itself mints a generated record at `gen_gain` —
it competes later (error intrusion risk is the honest cost), but the
corrected answer out-encodes it. Two structural gates, per the
literature: the attempt must actually run (a shown-but-unattempted
question sets no mark — Richland 2009 Exp. 5), and the boost is
content-locked, not global (unlike fwd_test_gain). RW consequence:
the character who *tried* to remember the neighbor's name at the gate
encodes it for keeps when someone says it ten minutes later; the
character who never reached for it lets it slide again.

## 59. Hypercorrection — confident error, deep correction (CONSENSUS core; age-moderated)

Butterfield & Metcalfe (2001, JEP:LMC 27:1491 — verified): errors
endorsed with HIGH confidence are more likely to be corrected by
feedback than low-confidence errors — the counterintuitive result,
replicated widely (Butterfield & Metcalfe 2006, Metacogn. Learn. 1:69
— attentional-capture account: tone detection is selectively impaired
during feedback to high-confidence errors — the correction grabs
attention). Metcalfe, Casal-Roscum, Radin & Friedman (2015, PMC3604148
— verified): older adults show a DIMINISHED hypercorrection —
confidence-correction correspondence not significantly >0 — despite
higher overall accuracy and intact metacognition. Cyr & Anderson
(2013, PB&R — verified): the age deficit shrinks/vanishes when the
learning context provides support (multiple-choice vs free recall) —
the moderation is *support-dependent*, which is exactly §61's lever.

**Formalization.** Corrective-feedback events — `account` carrying
`type:"correction"` (§6.6 path) or a witnessed event that
contradicts a stored field — gain a term proportional to the
*confidence of the error being corrected*:

```
E += hypercorr_gain · errConf · (0.5 + 0.5·envSupport)
      · (1 − hypercorr_age_mult·(1 − envSupport)·deficit_proxy)
```

`hypercorr_gain` ≈ 0.25; `hypercorr_age_mult` ≈ 0.5 (older cohort's
advantage halves unsupported; Cyr & Anderson's support rescue rides
the SAME `envSupport` field as §61 — one mechanism, not two).
`deficit_proxy` = the character's self-initiation deficit
(1 − si_res, §61). The error record is NOT deleted — §13.1 rewrite
rules govern content change; hypercorrection is the *encoding* of the
correction event, which is why confident-but-wrong characters still
emit the error when the correction decays — the continued-influence
residual (`cie_residual`) now has an upstream partner.

## 60. Interleaving — contrast encodes the difference (ESTABLISHED; sign flips by material)

Kornell & Bjork (2008, Appl. Cogn. Psych. — verified: artist-style
induction; spacing helped INDUCTION, against the "spacing is the
enemy of induction" prior; participants rated massed as more
effective even after their own scores proved otherwise — the
metacognitive illusion). Brunmair & Richter (2019, Psych. Bull.
145:1029 meta — verified: 59 studies / 238 effects: overall g = 0.42;
visual/category material best — paintings g = 0.67; math tasks small
g = 0.34; **words/expository text: blocked BEAT interleaved,
g = −0.39**). Moderator pattern: interleaving wins when categories
are similar and within-category items differ — it teaches the
*difference*, not the item.

**Formalization.** Track re-encoding order per knowledge axis
(PersonModel acquaintance categories, domain tags). When two
consecutive encodings on the same axis are DIFFERENT categories
(interleaved) vs same (massed), and the pair falls within
`interleave_win` (0.5 day):

```
discriminative legs (PersonModel tier boundaries, domain
  attribution): link/field contrast += interleave_gain   (0.15)
episodic E: unchanged — induction is about telling things apart
locked null: interleave_verbal_null = 0 — expository/verbal
  material gets NO interleave term (meta g < 0; blocking legal)
```

The metacognitive side: `jol` output (§5.21) over-reads massed/fluent
encodings — add `jol_fluency_bias` (0.15) to JOL emission for
massed-context items (Bjork's desirable-difficulty illusion; the
character "feels" the cramming worked). This is a report-side bias,
never a strength term — `se_accuracy_null`'s cousin: felt ease is
not stored strength.

## 61. Environmental support at encoding — the scaffold does the work (CONSENSUS)

Craik (1983, 1986 — verified review thread) proposed memory tasks
differ in required *self-initiated processing* and compensable
*environmental support*, complementary: less support → more
self-initiation needed; older adults' deficit is disproportionately
in self-initiation, so support at ENCODING (and retrieval —
spec already has the retrieval leg via `env_support_gain`, §5.4)
disproportionately rescues them. Craik & Rose (2012, Neurosci.
Biobehav. Rev. — verified: encoding-focused review; schematic
support from the knowledge base counts as support). Naveh-Benjamin,
Craik & Ben-Shaul (2002, Aging Neuropsychol. Cogn. 9:276 — verified:
cued-recall support at encoding AND retrieval shrinks the age gap).

**Formalization.** New Event field `envSupport ∈ [0,1]` — how much of
the processing structure the world supplies: guided interaction,
scripted routine, an interlocutor who cues, a task with the frame
built in. Define `si_res = clamp(1 − deficit_proxy, 0.3, 1)` —
self-initiation resource; `deficit_proxy` derives from the existing
age/executive machinery (age_eff-driven; traits `wmc`, `consc` add).

```
elaboration += env_enc_gain · envSupport · (1 − si_res)   (env_enc_gain ≈ 0.2)
```

The term is automatically age-targeted — the SAME mechanism that
makes the 70-year-old encode fine in a structured familiar setting
gives the 25-year-old nothing (their self-initiation is already
doing the work; support is redundant, not additive — Craik's
complementarity, not a freebie). Distinct from §7 unitization
(unitization binds elements into one item; env support supplies the
processing frame) and from retrieval-side env_support_gain (that one
rescues *cues given*; this one rescues *encoding structure given*).
P632 asserts the interaction: the age gap must shrink under
envSupport=1 vs 0 — a build where support helps everyone equally is
a failure (that's just E), as is one where it helps nobody.

## 62. Statistical learning — co-occurrence without episode (CONSENSUS phenomenon; sim channel HYPOTHESIS)

Saffran, Aslin & Newport (1996, Science 274:1926): 8-month-olds
segment speech from transitional probabilities after ~2 min of
exposure — no intention, no instruction, no episodic store to speak
of. Turk-Browne, Jungé & Scholl (2005): adults show the same
incidental statistical extraction for visual streams; Aslin 2017
review. This is the channel that produces knowledge nobody can source:
you "just know" who sits where, which shelf the mugs live on, that
those two always arrive together — no Tuesday you can name underwrote
it.

**Formalization.** The sim already counts co-occurrence for the
usuals layer (§6.93); extend the counter to a semantic-leg mint:
per character, per entity-pair (person×place, person×person,
object×place), maintain `cooccur` tally over `statlearn_win` (30 d).
When tally ≥ `statlearn_min` (3), each further co-occurrence adds
`statlearn_gain` (0.08) to the pair's semantic/impl link — θ-exempt
like `impl_str` (§5.35), survives independent of any episodic record.
Age weighting `statlearn_age_w` (0.3): children ×(1+age_w),
older adults ×(1−age_w·0.5) — infant statistical learning is the
proven engine; adult intact; old-age decline modest (HYPOTHESIS
gradient — the age literature on implicit/statistical learning is
mixed, mark DEBATED on slope, CONSENSUS on existence).

RW payoff: this is what lets an ambient character greet the right
regulars with the right order on day 90 without a single retrievable
episode — the archive stays empty, the knowledge is real. The bridge
between the episodic store and "how the world just is."

## 63. Cheater encoding — the victim-side link, not the face (ESTABLISHED, narrow claim)

The literature is precise about WHERE the effect lives. Buchner,
Bell, Mehl & Musch (2009, Evol. Hum. Behav. 30:212 — verified):
NO enhanced old-new recognition for cheater faces; better SOURCE
memory — you remember the cheating-context association, not the face
better. Mehl & Buchner 2007/2008: the Mealey 1996 canonical result
failed to generalize (occupation-status confound reversed it). Bell,
Buchner & Musch (2010, Cognition — verified): when cheating is
suffered in an actual social-dilemma interaction (experience-near,
not trait-description), BOTH recognition and source memory improve.
So: the module fires on *being cheated (or your people being
cheated)*, not on hearing someone described as a cheat.

**Formalization.** The spec's decay-side `cheat_source_mult` (§4.10)
and `cheaterLoad` accumulator stay. Add the encoding leg: Event
field `harmedParty ∈ {self, ingroup, outgroup, none}` on
norm-violation events. When harmedParty ∈ {self, ingroup}, the
actor↔violation associative link mints at

```
link_p_eff = link_p + cheat_link_gain·(1 − link_p)   (≈ 0.2)
```

— violated trust welds the actor to the act (the person's *name* gets
bound to *what they did*, which is exactly what gossip needs and
exactly what the 2009 source-memory result says survives). Locked
null `cheat_recog_null = 0`: describe-only cheater content (hearsay,
harmedParty = outgroup/none) gets NO item-recognition E boost —
encoding the rumor normally is the 2009 null honored. The
experience-near gate is Bell 2010's finding made structural: only
skin-in-the-game violations get the module.

## 64. Zeigarnik — the interrupted task stays warm (DEBATED size; CONSENSUS direction)

Zeigarnik (1927): interrupted tasks recalled better than completed —
a real effect in the original and in several replications, but the
modern verdict is mixed and moderated (task involvement, ego-threat
explanations, weak meta support — mark OBSERVE). What the sim already
has: §34 pending-intention pull taxes the encoder while loops are
open, and §5.33 deactivates Intentions on completion. The Zeigarnik
claim adds one thing those don't: the *interrupted* open loop is
hotter than the merely-pending one — the task material itself stays
access-privileged until closure.

**Formalization.** `Intention` records interrupted mid-execution
(world flag `interrupted:true` on the boundary that ended the task)
get `zeig_resist` (0.3) subtracted from §5.33's deactivation pull and
their §34 cue-heating persists ×`zeig_win_ext` (2.0). Completion, not
interruption, is what lets a task go cold — which is why the
half-finished errand nags at dinner and the finished one doesn't.
OBSERVE-tier: P635 bands wide; if the effect can't be produced
without breaking §5.33's deactivation probes, it loses — the ledger
accepts that verdict.

## 65. Disfluency — adjudicated, locked null (CONTESTED → negative anchor)

Diemand-Yauman, Oppenheimer & Vaughan (2011, Cognition 118:114):
hard-to-read fonts improved retention — a flagship "desirable
difficulty" result. The replication record killed it: Rummer,
Schweppe & Schwede (2016) direct replications null (and no
distinctiveness rescue); the Metacognition & Learning 2016 special
issue assembled six studies, >1000 participants, mostly null; Xie
et al. (2018) meta d ≈ 0.01. This is precisely the CONTESTED-anchor
class §14.2 was built for: the model must NOT produce a disfluency
benefit. **Locked null `disfluency_gain = 0`** — perceptual effort
adds nothing at encoding; if a build shows degraded-input events
encoding better at matched attention/elaboration, that is a bug
(P636 asserts absence). Note the asymmetry the null protects:
difficulty that produces deeper *semantic* processing encodes better
(Part I elaboration); difficulty that merely makes the input harder
to *read* does not — the pipeline, not the friction, is what matters.

## 66. Deliberate non-adds (v60)

- **Transfer-appropriate processing:** §5.12 has it — `encodeOps`
  is already set at encoding from the engagement channel and read at
  retrieval (`tap_mismatch`). This version adds nothing; the encode-
  side ops label was already priced.
- **Encoding-mode × retrieval-mode for cheater content:** source-vs-
  item asymmetry is the §63 formalization itself — no extra term.
- **Familiarity-only encode band:** §4.23's channel split + §5.35's
  `impl_str` already give recollection-free familiarity; the
  co-occurrence mint (§62) is the accumulation mechanism it lacked —
  a new `fam_encode_min` threshold would double-count the att_min gate.
- **Own-name / own-face at encoding:** §45 breakthrough is the
  privileged-detection machinery; no second channel.
- **Mood-dependent encoding:** §8 mood congruence (v1.2) already
  clamps to thin ambient content; a stronger claim isn't supported.
- **Reward anticipation:** folded into `value_select`/importance in
  Part III (§39) — no re-add.
- **Bizarreness:** folded into `isolated`/`distinct_gain` in Part I;
  no re-add.
- **Acute exercise / caffeine timing:** consolidation-side, already
  adjudicated (`caff_consol_gain`, exercise non-add Part III).

## 67. Parameter summary (new in v5.8 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `pretest_gain` | 0.2 | 0–0.5 | failed-recall potentiation of next same-topic event | Kornell et al. 2009; Richland et al. 2009 |
| `pretest_win` | 0.05 | 0.01–0.5 d | mark lifetime (same scene / next hour) | Richland 2009 (proximity) |
| `hypercorr_gain` | 0.25 | 0–0.6 | correction E ∝ error confidence | Butterfield & Metcalfe 2001/2006 |
| `hypercorr_age_mult` | 0.5 | 0–1 | age attenuation of hypercorrection, support-gated | Metcalfe et al. 2015; Cyr & Anderson 2013 |
| `interleave_gain` | 0.15 | 0–0.4 | cross-category contrast on discriminative legs | Kornell & Bjork 2008; Brunmair & Richter 2019 |
| `interleave_win` | 0.5 | 0.1–3 d | re-encoding-order window | Brunmair & Richter 2019 |
| `jol_fluency_bias` | 0.15 | 0–0.4 | JOL over-read on massed/fluent encodings | Kornell & Bjork 2008 (illusion); Bjork desirable-difficulty |
| `env_enc_gain` | 0.2 | 0–0.5 | support→elaboration leg, ×(1−si_res) | Craik 1983/1986; Craik & Rose 2012; Naveh-Benjamin 2002 |
| `statlearn_gain` | 0.08 | 0–0.3 | per-co-occurrence semantic/impl link mint | Saffran 1996; Turk-Browne 2005 |
| `statlearn_min` | 3 | 2–8 | co-occurrence threshold before minting | Saffran 1996 |
| `statlearn_win` | 30 | 7–90 d | tally window | HYPOTHESIS |
| `statlearn_age_w` | 0.3 | 0–1 | child-weighting of the channel | Saffran 1996 (gradient DEBATED) |
| `cheat_link_gain` | 0.2 | 0–0.5 | actor↔violation link mint, self/ingroup-harmed only | Bell, Buchner & Musch 2010 |
| `zeig_resist` | 0.3 | 0–0.7 | interrupted-Intention deactivation resistance | Zeigarnik 1927 (OBSERVE) |
| `zeig_win_ext` | 2.0 | 0.5–4 | cue-heating persistence multiplier | Zeigarnik (moderated) |

**Locked nulls (v5.8):** `interleave_verbal_null = 0` (no interleave
gain on verbal/expository material — meta g = −0.39);
`cheat_recog_null = 0` (no item-recognition boost for describe-only
cheater content — Buchner 2009); `disfluency_gain = 0` (perceptual
difficulty adds nothing — Xie 2018 meta d ≈ 0.01; Rummer 2016).

## 68. Validation probes P629–P636

- **P629 pretest potentiation (SHOULD):** failed-recall marks → next
  same-topic event recalls ≥1.3× matched unmarked at 7d; marks set
  without an actual retrieval attempt produce NO boost (Richland Exp.
  5 gate); the wrong guess mints as a competitor record (gen_gain)
  but the corrected answer must out-recall it ≥2:1 at delay.
- **P630 hypercorrection (MUST — sign-locked):** correction retention
  is monotone-increasing in pre-correction error confidence in young
  adults; 65+ cohort's slope ≤ half the young slope at envSupport=0
  AND ≥0.8× the young slope at envSupport=1 (Cyr & Anderson rescue
  rides the SAME field — a second age-rescue mechanism is a flag).
- **P631 interleaving (SHOULD):** cross-category discrimination
  (PersonModel tier boundaries, domain attribution) better after
  interleaved vs massed sequences on perceptual/person material;
  verbal material shows |gain| ≤ 0.02 (locked-null guard).
- **P632 environmental support at encoding (MUST — interaction
  shape):** free-recall age gap shrinks ≥30% at envSupport=1 vs 0;
  support must NOT lift young adults equivalently (complementarity —
  a build where support helps everyone equally is a flat-E bug);
  older cohort shows the largest si_res-weighted gain.
- **P633 statistical learning (SHOULD):** entity pairs with
  cooccur ≥ statlearn_min mint a θ-exempt link with NO episodic
  record behind it — the character can pass a familiarity/source-free
  "knows who sits where" check while recall probes return null;
  gradient child > adult > old within the DEBATED band.
- **P634 cheater link (SHOULD — two-armed):** self/ingroup-harmed
  violations mint the actor↔violation link at the boosted rate AND
  source memory for the pair survives ≥1.4× neutral at 30d;
  describe-only (outgroup/none) cheater content shows |E − E_neutral|
  ≤ 0.03 (the 2009 null enforced — recognition-side flat).
- **P635 Zeigarnik (OBSERVE):** interrupted Intentions retain cue-
  heating ≥1.5× longer than completed ones and resist deactivation
  by zeig_resist; wide band; if §5.33 deactivation probes regress,
  the effect loses (per §110 ledger verdict).
- **P636 disfluency absence (MUST — CONTESTED/negative anchor):**
  degraded/effortful presentation at matched attention/elaboration
  yields |d| ≤ 0.1 vs fluent — asserts ABSENCE per §14.2 semantics;
  a build that "finds" the desirable-difficulty benefit here fails.

## 69. Spec deltas delivered (v5.8)

- `memory-model-spec.md` → v5.8: §2 +6 bullets (pretest, hypercorr,
  interleave, env-support-at-encode, statlearn, cheater-link,
  zeigarnik — as bullets, all Event/state fields optional w/
  defaults); §7-style param block +16 params +3 locked nulls; §10
  contract + Event fields (`envSupport`, `corrects:{topic,errConf}`,
  `harmedParty`, `interrupted:true`, `interleaved` internal,
  `pretest_mark` char-state) and JOL `jol_fluency_bias` report bias.
- `character-memory-profiles.md`: §0 +9 clamp rows; §42 v5.8 note —
  what bible authors should touch: none of these are trait pins
  (all mechanism constants), but profiles read the emergent shadow
  (older mains lean on envSupport + cheat link + statlearn; kids lean
  on statlearn + pretest).
- `validation-design.md`: §§113–114 — probes P629–P636 + sources.
  Registry P1–P636.
- `human-memory-research.md`: §37 v60 summary appended.

## 70. Sources new to this version (all verified 2026-09-23)

- Kornell, Hays & Bjork 2009 (JEP:LMC 35:989 — verified via DOI/
  abstract record: unsuccessful retrieval enhances subsequent
  learning; fictional general-knowledge + weak-associate paradigms);
  Richland, Kornell & Kao 2009 (JEP:Applied 15:243 — verified:
  5 experiments, attempt-required gate, italics-control arm).
- Butterfield & Metcalfe 2001 (JEP:LMC 27:1491 — verified: high-
  confidence errors hypercorrected; PMID 11713883); Butterfield &
  Metcalfe 2006 (Metacogn. Learn. 1:69 — attentional-capture account,
  tone-detection probe); Metcalfe, Casal-Roscum, Radin & Friedman
  2015 (PMC3604148 — verified: older adults' hypercorrection
  diminished, conf-correction correspondence n.s.); Cyr & Anderson
  2013 (PB&R — verified: support restores the older-adult effect).
- Kornell & Bjork 2008 (Appl. Cogn. Psych. — verified: artist-style
  induction, massed judged better despite worse performance);
  Brunmair & Richter 2019 (Psych. Bull. 145:1029 — verified: g=0.42
  overall; paintings 0.67; words −0.39; similarity moderators).
- Craik 1983/1986; Craik & Rose 2012 (Neurosci. Biobehav. Rev. —
  verified: encoding-side review, self-initiation/environmental-
  support complementarity); Naveh-Benjamin, Craik & Ben-Shaul 2002
  (Aging Neuropsychol. Cogn. 9:276 — verified: cued-recall support
  at encoding + retrieval shrinks age gap).
- Saffran, Aslin & Newport 1996 (Science 274:1926 — verified:
  8-month-old statistical segmentation); Turk-Browne, Jungé & Scholl
  2005; Aslin 2017 (review).
- Buchner, Bell, Mehl & Musch 2009 (Evol. Hum. Behav. 30:212 —
  verified: no recognition boost, better source memory for cheaters);
  Mehl & Buchner 2007/2008 (EHB 29:35 — the Mealey confound);
  Bell, Buchner & Musch 2010 (Cognition — verified: game-experienced
  cheating enhances both recognition and source); Mealey, Daood &
  Krage 1996 (canonical target that failed to generalize).
- Zeigarnik 1927 (interrupted-task recall — direction real, size
  DEBATED; marked OBSERVE).
- Diemand-Yauman, Oppenheimer & Vaughan 2011 (Cognition 118:114 —
  the claim); Rummer, Schweppe & Schwede 2016 (Metacogn. Learn.
  special issue — verified: 3 direct replications null, no
  distinctiveness rescue); Metacognition & Learning 2016 special
  issue (6 studies, >1000 participants — verified); Xie et al. 2018
  meta (d ≈ 0.01 — verified via abstract).

---

# Part VI — encoding-mechanics, sixth pass (v72 focus)

**Version tag:** spec v5.20. Parts I–V priced processing depth,
motivational state, momentary capacity/competition, the gate's
exceptions, and the attempts/scaffolds that precede encoding. Part VI
prices what remains on the intake side: **how the scarce encoder
triages by value** (value-directed remembering and its age shape and
its failure mode), **two agency-adjacent gains** (choice, observed-
with-intent), **the moderator the errorful-learning literature
actually found** (error *type*, not error per se), **the speaker's
own memory bending toward the audience** (saying-is-believing),
**the face's own memorability** (distinctiveness, with the
attractiveness null), **secrets as permanent open loops** (Slepian's
preoccupation finding wired into the pending set), and one DEBATED
shield (alcohol's retrograde interference account — folded under the
existing intox machinery). 14 new params, 4 locked nulls, 10 probes
(P769–P778).

## 71. Value-directed remembering — the scarce encoder spends on what matters (CONSENSUS direction; the failure mode is the v72 refinement)

Castel, Benjamin, Craik & Watkins (2002, Psych. Aging 17:209 — verified):
when items carry explicit point values, OLDER adults match young on
high-value items despite worse overall recall — selectivity is the
compensation strategy. Castel, Balota & McCabe (2009, JEP:A 35:916 —
verified): the same holds across scorekeeping; older adults allocate
study time *disproportionately* to high-value items — sharper
selectivity, not preserved-by-luck. Knowlton & Castel (2022, Cognition
222 — verified review thread) and Castel's PLM 2007 chapter frame it:
responsible remembering = agenda-based regulation. **The 2025
moderator** (Psych. Aging, strategic VDR — verified abstract): older
adults' selectivity FAILS when high-value information is intrinsically
hard to encode (low-memorability) — value can't beat hardness for the
self-initiation-poor encoder. That failure is the mechanistic boundary:
selectivity is a routing strategy, and routing strategies are exactly
what deficit_proxy degrades.

**Formalization.** The §31 `wm_cap` competition's per-field ordering
key gains a value leg:

```
orderKey = attention·selfRelevance + value_rank_w·importance
                                                        (value_rank_w ≈ 0.35)
```

On overflow (n > wm_cap), the spill probability stops being flat:

```
spill_p(field) = vivid_detail·cap_spill·(1 + select_sharp·deficit_proxy
                 ·(2·field.importance − 1))
                                                        (select_sharp ≈ 0.3)
```

— the deficit-scaled encoder writes high-value overflow fields MORE
and low-value overflow fields LESS: the same budget, concentrated.
Young profiles (deficit_proxy ≈ 0) stay near the flat spill — their
selectivity works, they just don't need it inside wm_cap.

The failure mode: `value_mem_gate` (0.4, frozen direction). A field
whose inherent encodability (elaboration + concreteness proxy) sits in
the bottom quartile gets its value-weighted ordering bonus
×(1 − value_mem_gate·deficit_proxy) — the hard-but-important detail
(the exact lease clause, the dose instruction) is exactly what the
older encoder *wants* to keep and can't route to. P770 asserts the
crossover: deficit-cohort selectivity advantage on easy-high-value
material, collapse on hard-high-value.

## 72. Choice — the act of choosing encodes the chosen (ESTABLISHED)

Murty, DuBrow & Davachi (2015, J. Neurosci. 35:6255 — verified):
encoding objects under an opportunity-to-choose manipulation improved
declarative memory even when the choice bore no relation to the
memoranda; anticipatory striatal activation predicted hippocampal
encoding success. Murty et al. (2019, PB&R 26:1788 — verified pooled
analysis): the advantage replicates at immediate and 24-h recognition,
and correlates across subjects with choice-induced preference change —
a shared value-based mechanism. Murty et al. (2019, J. Cogn. Neurosci.
— verified): decision-making reduces *forgetting rate* across 24 h —
post-encoding consolidation, not just intake. Orthogonal to
enactment (no motor trace — choices were button-picks between covered
items) and to generation (no content produced).

**Formalization.** Event flag `choice:true` — the character selected
among live options (which table, which lie, which gift). The chosen
option's records mint `E += choice_enc_gain` (0.10) AND carry
`choice_beta_mult` (0.9) on β for the first day — the consolidation
leg, kept small since the effect size is modest. Locked scope
`choice_scope` (frozen): the gain applies to the CHOSEN content only —
the unchosen alternatives mint normally (the literature's chosen>
unchosen asymmetry is partly the same total budget; claiming a bonus
on both would double-count). RW consequence: the apartment she picked
over the other two is remembered with an ownership the landlord's
tour never gave it.

## 73. The errorful moderator is error TYPE — stepping stones vs noise (ESTABLISHED, corrects the naïve age story)

§58's pretest machinery mints the failed guess as a competitor record
and lets the corrected answer out-encode it. The aging literature's
verdict is subtler than "errors hurt the old." Cyr & Anderson (2015,
JEP:LMC 41 — verified): trial-and-error learning with CONCEPTUAL
guesses ("a flower → tulip?") improves target memory for BOTH age
groups — the guesses are semantic stepping stones toward the target
and memory for the guess MEDIATES the benefit; LEXICAL/arbitrary
guesses ("ho___ → house") produce retrieval noise, hurting both.
Cyr & Anderson (2012, Psych. Aging 27 — verified): conceptual errorful
learning improves *source memory* especially in older adults who don't
spontaneously elaborate. The old clinical story (Baddeley & Wilson
1994; Clare & Jones 2008 review; Kessels & de Haan 2003 meta) holds
for memory-IMPAIRED populations on arbitrary material: errors
unsuppressable at source monitoring get re-emitted as answers.

**Formalization.** `pretest_mark` guesses carry
`guess_kind:{conceptual,arbitrary}` (world derives: conceptual = the
guess shares a semantic/domain link to the topicKey; arbitrary =
phonological, numeric, wild).

```
conceptual guess → mints a MEDIATOR: link guess→target +=
                  errful_mediator_gain (0.15); pretest_gain unmodified;
                  source memory on the corrected pair +errful_mediator_gain
arbitrary guess → pretest_gain ×(1 − errful_arb_loss) (0.3);
                  guess record mints at errful_noise (0.12) as a
                  competitor — and for deficit_proxy > 0.6 profiles the
                  guess's source tag takes sourceStr ×(1 − 0.3): the
                  impaired encoder can't tell the guess from the answer
                  later (Baddeley & Wilson's re-emission phenotype)
```

P772 asserts the triple: conceptual > errorless > arbitrary on target
recall, age-flat on the conceptual leg, deficit-gated on the arbitrary
intrusion. This upgrades §58 from "failed recall warms the landing"
to "failed recall warms the landing *if the failure was meaningful*".

## 74. Saying-is-believing — the speaker's record bends toward the audience (CONSENSUS effect; the gate is the finding)

Higgins & Rholes (1978 — verified lineage): tuning a description
toward the audience's attitude biases the speaker's own later recall
toward the tuned version. The boundary conditions are the science:
Echterhoff, Higgins & Groll (2005, JPSP 89:257 — verified): the memory
bias appears only when the audience successfully identified the target
(shared reality achieved), only toward INGROUP audiences, mediated by
epistemic trust. Echterhoff, Higgins, Kopietz & Groll (2008, JEP:G
137:3 — verified, 4 experiments + mini-meta): tuning under
NON-shared-reality goals (politeness to a stigmatized audience,
incentive, entertainment, blatant compliance) produces the biased
*message* but zero memory bias. 2024 EJSP meta (27 studies, 59 memory-
bias effects — verified): robust overall, attenuated for outgroup
audiences and identity-threatening topics.

**Formalization.** Retell/discuss emissions may carry
`audience_tune` ∈ [−1,+1] (the evaluative shift the speaker applied —
dialogue knows; it wrote the tuned version) and a motive tag
`tune_motive:{sharedReality,politeness,incentive,other}` plus
`aud_ingroup` from the PersonModel edge. On the SHARED-REALITY path:

```
source record eval fields += sib_drift·audience_tune·
    (0.3 + sib_trust_w·epistemicTrust)         (sib_drift ≈ 0.15,
                                               sib_trust_w ≈ 0.7)
via the §13.1 rewrite path (drift, not a new record)
```

`epistemicTrust` = the PersonModel trust/closeness scalar already
maintained. **Locked null `sib_polite_null = 0`:** tune_motive ≠
sharedReality → zero drift — the flattering description told to keep
the peace does NOT move the speaker's memory of what happened (the
liar remembers; the appeaser remembers; only the *connecting* speaker
absorbs their own spin). Composes with §51 lie encoding: a tuned-but-
believed retell drifts the record; a tuned-and-known-false retell
(`lie:true` mint) leaves the truth record intact. This is the
mechanism by which a gossip's version of Tuesday quietly becomes
their Tuesday — the strongest distortion RW can produce without any
misinformation entering from outside.

## 75. Observed engagement — watching-to-learn is its own channel (ESTABLISHED; boundary DEBATED)

Roberts, Macleod & Fernandes (2022 meta — Part I's enactment source):
the enacted-vs-observed gap (g ≈ 0.9) sits between enacted-vs-verbal
(1.23) and zero — observation is a real middle tier, not a null.
Jaroslawska, Gathercole, Allen & Holmes (2016, M&C 44:1183 — verified):
action observation improves instruction recall comparably to self-
enactment in children; Waterman et al. extension work holds the same
for adults. Steffens & von Stülpnagel (2015, Front. Psych. 6:1907 —
verified): the enacted>observed advantage is DESIGN-DEPENDENT — it
holds under intermixed designs, evaporates under blocked designs;
the honest claim is "observation encodes action content nearly as
well as doing," not "doing always wins." Intent arm: observational
practice lit (watching-to-reproduce > passive watching — motor-
learning thread, PLOS One 2012 watch-and-learn).

**Formalization.** `engagement:"observed"` is now a first-class enum
member: `E += obs_enc_gain` (0.08) — above heard/read, below enacted.
Flag `obsIntent:true` (the character was watching to copy — the new
barista studying the pour) → obs_enc_gain ×`obs_intent_mult` (2.0).
Boundary kept deliberately: observed events do NOT get enactment's
DA-resistance (§4's motor-channel exemption is motor-channel only)
and do not mint `enacted:true` self-agency fields — §6.117's
observed_action machinery already owns the agency bookkeeping. The
sim gains "she learned the whole routine from the doorway" without
ever claiming she did it.

## 76. Face distinctiveness — memorability is a property of the face, not the viewer (CONSENSUS; attractiveness arm is a locked null)

Light, Kayra-Stuart & Hollander (1979, JEP:HLM 5:212 — verified):
unusual faces out-recognized typical faces across incidental and
intentional learning, 3–15 s rates, 3–24 h delays; Experiment 5
established interitem similarity as the structural basis. Vokey &
Read (1992 — verified): the typicality effect is mediated by rated
memorability/distinctiveness; attractiveness and likability effects
reduce to typicality (attractive/likable faces skew typical →
recognized WORSE). Wickham & Morris (2003 — verified): attractiveness
does not predict recognition once distinctiveness is partialled;
unattractive faces skew distinctive but that is the distinctiveness
talking. Valentine (1991) face-space supplies the mechanism: typical
faces are dense-region neighbors — confusable by construction.

**Formalization.** `faceDistinct ∈ [0,1]` on person-encounter events
(world supplies or derives from the character's PersonModel roster —
deviation from the roster's centroid, the Vokey & Read mechanism at
our grain): the encounter's person fields write with
`×(1 + face_dist_gain·faceDistinct)` (0.2) and familiarity accrual
on that PersonModel ×same. Complements `owngroup_loss` (the GROUP tag
cuts accrual) — a distinctive other-group face can beat a typical
own-group one; the two axes compose multiplicatively. **Locked null
`attract_recog_null = 0`:** perceived attractiveness never adds
encoding weight once faceDistinct is priced — a build that mints
"pretty = memorable" fails P775.

## 77. Secrets are open loops — concealment is rare, preoccupation is constant (ESTABLISHED direction; sim split HYPOTHESIS)

Slepian, Chun & Mason (2017, JPSP 113:1 — verified; 10 studies,
>13,000 secrets): people mind-wander to their secrets roughly TWICE
as often as they encounter situations requiring active concealment;
the preoccupation frequency — not concealment frequency — predicts
the harm. Lane & Wegner (1995 — verified): secrecy works like a
suppressed thought — hyperaccessibility of the concealed content is
the mechanism. Earlier concealment-in-interaction cost (a live
concealment attempt is a secondary task) already rides
`suppress_da_map` (§39) — what's missing is the TONIC half: the
secret hums when nobody's asking.

**Formalization.** Records tagged `confidential:true` (the secrets
layer) join the §34 pending set as phantom intentions: each
contributes `pending_intrude·secret_load_mult` (1.5) to tonic daLoad,
counting inside the same n≤5 cap — secrets EVICT errands from the
open-loop budget, which is exactly why the secret-keeper forgets to
buy milk. Records whose cueVector overlaps a held secret's content
get cue-heating ×`secret_heat_mult` (1.3) while the secret is held —
Wegner's hyperaccessibility at birth. On disclosure (the world lifts
`confidential`), both legs stop — the told secret is a closed loop
(this is why confession feels like relief: a pending slot frees).
Trait loading: `rumin` and `neurot` raise secret_load_mult's
effective hit (the preoccupation moderator); `supp` (suppression
style) does NOT reduce it — suppression is the load, not the cure.
The retrieval-side half (mind-wandering arrivals at the secret
record) rides the existing rumination/arrival machinery — no new
param there; the encoding-side half is what Part VI prices.

## 78. Retrograde shield under intoxication — the drink protects what came before (DEBATED → OBSERVE tier)

Parker et al. (1980, Psychopharmacology 69:219 — verified) and
Parker et al. (1981, dose-response — verified): alcohol consumed
AFTER learning improved delayed recall of pre-drink material.
Mechanism adjudication: Mueller, Lisman & Spear (1983, Physiol.
Behav. — verified) found support for the INTERFERENCE account
(alcohol blocks acquisition of interfering new memories), none for
the consolidation account; Gawrylowicz et al. (2017 — verified)
found intoxicated witnesses MORE resistant to misinformation on
pre-drink-encoded events — same shield, forensic surface. The
catch: Quevedo-Pütter & Erdfelder (2022, Exp. Psychol. — verified
preregistered replication, N=93, MPT modeling) found NO recall
advantage and only a retrieval-side benefit — the effect is real
in direction, modest and fragile in magnitude. OBSERVE tier.

**Formalization (interference-account only).** While
`context.intox ≥ 0.3`, retroactive-interference accrual on records
minted BEFORE intox onset is `×(1 − intox_retro_shield·intox)`
(0.4). Two locked boundaries: `retro_scope = "pre-only"` (frozen —
records minted DURING intox get nothing; they already pay the
v1.9 E floor), and `retro_consol_null = 0` (locked — the shield
reduces incoming interference, never raises strength directly;
Mueller 1983 killed the consolidation account). The night's own
thin records don't gain; the afternoon's do — the drunk remembers
the morning meeting better than the party, and so does the sober
person, which is why the probe band is wide.

## 79. Deliberate non-adds (v72)

- **Delayed vs immediate feedback at encoding:** timing effects are
  practice-schedule machinery (retrieval side owns feedback delivery);
  the encoding-side residual at our grain is noise. No param.
- **Taboo/profane words:** the taboo-Stroop capture + recall advantage
  (MacKay et al. 2004; Janschewitz 2008) decomposes into arousal +
  `isolated` + threat-lite — all priced. Locked fold `taboo_gain = 0`.
- **Sense-of-agency / outcome binding beyond `choice`:** agency-on-
  outcome is the `selfRelevance` + `enacted` + `choice:true` product
  already; a fourth leg double-counts.
- **Font-size / readability JOL inflation** (Rhodes & Castel 2008):
  report-side fluency belief, folds into `jol_fluency_bias`'s family —
  same null logic as `se_accuracy_null`: felt ease ≠ stored strength.
- **Bilingual language mode at encoding:** `langs`/`lang_mismatch`
  machinery (§11) owns the channel; no new encode term.
- **Sleep quality AT encoding:** `sleepFactor`/`sleepdep_flag` already
  own it (and §37's adjacency owns the other side). Cross-ref only.

## 80. Parameter summary (new in v5.20 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `value_rank_w` | 0.35 | 0–0.7 | importance leg in wm_cap ordering | Castel 2002/2009 |
| `select_sharp` | 0.3 | 0–0.7 | deficit-scaled spill gradient | Castel, Balota & McCabe 2009 |
| `value_mem_gate` | 0.4 | 0–0.8 | hard-but-valuable selectivity failure | Psych. Aging 2025 VDR study |
| `choice_enc_gain` | 0.10 | 0–0.3 | chosen-content E bonus | Murty, DuBrow & Davachi 2015 |
| `choice_beta_mult` | 0.9 | 0.7–1.0 | day-1 consolidation leg | Murty et al. 2019 JOCN |
| `errful_mediator_gain` | 0.15 | 0–0.4 | conceptual-guess mediator + source boost | Cyr & Anderson 2012/2015 |
| `errful_arb_loss` | 0.3 | 0–0.7 | arbitrary guesses attenuate pretest_gain | Cyr & Anderson 2015 |
| `errful_noise` | 0.12 | 0–0.3 | arbitrary-guess competitor birth strength | Baddeley & Wilson 1994; Kessels 2003 |
| `sib_drift` | 0.15 | 0–0.4 | speaker-record eval drift toward tuned retell | Higgins & Rholes 1978; Echterhoff 2005/2008 |
| `sib_trust_w` | 0.7 | 0–1 | epistemic-trust weight in the shared-reality gate | Echterhoff et al. 2005 |
| `obs_enc_gain` | 0.08 | 0–0.25 | observed-action middle tier | Roberts 2022; Jaroslawska 2016 |
| `obs_intent_mult` | 2.0 | 1–3 | watching-to-learn multiplier | observational-practice lit |
| `face_dist_gain` | 0.2 | 0–0.5 | distinctive-face field/accrual gain | Light et al. 1979; Vokey & Read 1992 |
| `secret_load_mult` | 1.5 | 0.5–3 | secret tonic daLoad (×pending_intrude) | Slepian, Chun & Mason 2017 |
| `secret_heat_mult` | 1.3 | 1–2 | secret-overlap cue-heating | Lane & Wegner 1995 |
| `intox_retro_shield` | 0.4 | 0–0.8 | pre-drink interference shield (OBSERVE) | Parker 1980/81; Mueller 1983; Q-P&E 2022 |

**Frozen constants (v5.20):** `choice_scope` (gain on chosen content
only), `retro_scope = "pre-only"`, secrets share the pending n≤5 cap
(no separate budget). **Locked nulls:** `sib_polite_null = 0`
(non-shared-reality tuning drifts nothing — Echterhoff 2008),
`attract_recog_null = 0` (attractiveness adds nothing past
faceDistinct — Wickham & Morris 2003), `retro_consol_null = 0`
(shield never raises strength — Mueller 1983), `taboo_gain = 0`
(folds to arousal+isolated — MacKay decomposes).

## 81. Validation probes P769–P778

- **P769 (MUST) value ordering:** under n > wm_cap overflow, high-
  importance fields survive at the value_rank_w-implied rate;
  deficit-scaled profiles concentrate spill on high-value items —
  recall gap (high−low value) widens with deficit_proxy at matched
  overall (Castel selectivity shape).
- **P770 (MUST — crossover) value×memorability gate:** deficit cohort
  shows the selectivity advantage on easy-high-value material AND its
  collapse on hard-high-value material (2025 moderator); young cohort
  shows neither cliff (their spill stays near-flat). A build where
  the old cohort selects equally well on hard items fails — the gate
  is the mechanism.
- **P771 (SHOULD) choice:** choice:true mints higher E + lower day-1
  β than matched assigned events (band from Murty 2015/2019); the
  unchosen alternative shows no gain (scope audit); effect holds with
  memoranda-content unlinked to the choice (the 2015 decoupling).
- **P772 (MUST — triple) error type:** conceptual-guess pretests beat
  errorless controls and arbitrary-guess pretests on target recall,
  age-flat on the conceptual leg (Cyr & Anderson 2015); arbitrary
  guesses mint competitors that intrude at recall for high-deficit
  profiles (Baddeley & Wilson phenotype) but not low-deficit.
- **P773 (MUST — gate) saying-is-believing:** shared-reality retells
  drift the speaker record toward audience_tune at the sib_drift
  rate; politeness/incentive/other motives drift ≈0 (locked null —
  TOST, SESOI 0.05); outgroup audiences attenuate (2005 gate);
  `lie:true` retells leave the truth record untouched (P500
  consistency).
- **P774 (SHOULD) observed tier:** engagement ordering enacted >
  observed > heard at matched attention, observed band [verbal,
  verbal+0.7·enact]; obsIntent doubles the observed leg; observed
  records get NO DA-resistance (enactment exemption boundary — a
  build where watched actions survive distraction like performed
  ones fails).
- **P775 (SHOULD) face distinctiveness:** faceDistinct-high persons
  accrue familiarity faster and field-write wider at matched
  exposure; `attract_recog_null` TOST-enforced — attractiveness-tagged
  but typical faces show |Δ| ≤ 0.03; composes multiplicatively with
  owngroup_loss (distinctive-other-group vs typical-own-group
  ordering either direction).
- **P776 (MUST) secret load:** a held secret contributes ~1.5 pending-
  intention units to tonic daLoad inside the n≤5 cap (secrets crowd
  OUT ordinary pending cues — measurable as reduced pending_cue_gain
  on non-secret overlaps while secrets are held); secret-overlapping
  cues encode hotter (secret_heat_mult); disclosure ends both legs
  immediately (closed-loop check).
- **P777 (OBSERVE) retrograde shield:** intox-onset events →
  pre-onset records show reduced next-window interference accrual;
  on-intoxication records gain nothing (retro_scope audit);
  strength never increases (retro_consol_null — a build where
  drinking RAISES a stored strength fails by construction); band
  wide per the 2022 replication's fragility.
- **P778 (MUST — structure) v5.20 regression:** new fields/params
  pass the P457 non-interference pattern (audience_tune/sib drift is
  a §13.1 rewrite-path citizen; secrets occupy the existing pending
  budget, not a parallel store; choice/obs/face legs touch E and β
  only) and the §12.2 commutativity pattern (no new op reads across
  charIds).

## 82. Spec deltas delivered (v5.20)

- `memory-model-spec.md` → v5.20: §2 +8 mechanism bullets
  (value-directed selectivity + the hard-item gate, choice, error-
  type moderation on pretest, saying-is-believing, observed tier,
  face distinctiveness, secrets-as-open-loops, intox retrograde
  shield); params +16 (+4 locked nulls, +3 frozen); §10 contract
  additions — Event fields `choice:true`, `guess_kind`,
  `audience_tune`/`tune_motive`/`aud_ingroup` on retell emissions,
  `obsIntent:true`, `faceDistinct ∈[0,1]`; `engagement:"observed"`
  promoted to first-class; `confidential` records join the pending
  set. All optional w/ defaults; backward compatible.
- `character-memory-profiles.md`: §0 +16 clamp rows; §54 v5.20
  note — none are trait pins (all mechanism constants); the
  emergent shadows (older mains route to value, secret-keepers
  carry a tax, gossipers absorb their own spin).
- `validation-design.md`: §§144–145 — probes P769–P778 + sources.
  Registry P1–P778.
- `human-memory-research.md`: §50 v72 summary appended.

## 83. Sources new to this version (all verified 2026-09-23)

- Castel, Benjamin, Craik & Watkins 2002 (Psych. Aging 17:209 —
  verified: older adults match young on high-value despite lower
  overall); Castel, Balota & McCabe 2009 (JEP:A 35:916 — verified:
  disproportionate study-time allocation); Castel 2007 (PLM 48
  chapter — verified: evaluative processing/VDR framework);
  Knowlton & Castel 2022 (Cognition 222 — verified review);
  Psych. Aging 2025 strategic-VDR study (verified abstract:
  selectivity fails on hard high-value items — the gate).
- Murty, DuBrow & Davachi 2015 (J. Neurosci. 35:6255 — verified:
  choice → striatal-anticipation → hippocampal encoding success,
  content-unlinked); Murty et al. 2019 (PB&R 26:1788 — verified
  pooled analysis, delayed-recognition advantage + preference
  correlation); Murty et al. 2019 (J. Cogn. Neurosci. — verified:
  reduced forgetting rate, post-encoding consolidation).
- Cyr & Anderson 2015 (JEP:LMC — verified: conceptual vs lexical
  guesses, stepping-stones account, guess memory mediates);
  Cyr & Anderson 2012 (Psych. Aging — verified: conceptual
  errorful improves source memory, older ≥ younger); Baddeley &
  Wilson 1994; Clare & Jones 2008 (Neuropsychol. Rehabil. review);
  Kessels & de Haan 2003 (JINS meta — clinical errorless lit).
- Higgins & Rholes 1978 (the paradigm); Echterhoff, Higgins &
  Groll 2005 (JPSP 89:257 — verified: shared-reality necessity,
  ingroup gate, trust mediator); Echterhoff, Higgins, Kopietz &
  Groll 2008 (JEP:G 137:3 — verified: motive gate, 4 experiments);
  Echterhoff, Lang, Krämer & Higgins 2009 (Soc. Psych. 40:150);
  EJSP 2024 meta (27 studies — verified: robust, outgroup/
  identity-threat attenuation).
- Jaroslawska, Gathercole, Allen & Holmes 2016 (M&C 44:1183 —
  verified: observation ≈ enactment on instruction recall);
  Steffens & von Stülpnagel 2015 (Front. Psych. 6:1907 — verified:
  design-dependent boundary); PLOS One 2012 watch-and-learn
  (observational practice thread).
- Light, Kayra-Stuart & Hollander 1979 (JEP:HLM 5:212 — verified:
  typicality effect across delays); Vokey & Read 1992 (verified:
  distinctiveness/memorability mediation); Wickham & Morris 2003
  (verified: attractiveness null once distinctiveness partialled);
  Valentine 1991 (face-space mechanism).
- Slepian, Chun & Mason 2017 (JPSP 113:1 — verified: mind-wandering
  ≈2× concealment, preoccupation predicts harm); Lane & Wegner 1995
  (secrecy-suppression hyperaccessibility).
- Parker et al. 1980 (Psychopharmacology 69:219 — verified) &
  1981 dose-response; Mueller, Lisman & Spear 1983 (Physiol. Behav.
  — verified: interference > consolidation account); Gawrylowicz et
  al. 2017 (eyewitness misinfo resistance); Quevedo-Pütter &
  Erdfelder 2022 (Exp. Psychol. 69:335 — verified preregistered
  replication: recall null, retrieval-side benefit → OBSERVE tier).
- Deliberate-null/fold sources: Rhodes & Castel 2008 (font-size JOL);
  MacKay et al. 2004 + Janschewitz 2008 (taboo fold).

# Part VII — encoding-mechanics, seventh pass (v84 focus)

**Version tag:** spec v5.32. Parts I–VI priced processing depth,
motivational state, capacity competition, the gate's exceptions,
the attempts/scaffolds that precede encoding, and the value/choice/
audience triage of the scarce encoder. Part VII prices six things
that survived the previous sweeps: **involuntary capture by reward
history** (VDAC — attention the goal never authorized), **congruent
multisensory co-occurrence** (two channels, one trace, cross-modal
cue bridges), **the adjudicated residue of automatic encoding**
(freq/loc/when get a floor, not immunity), **drawing as an
engagement channel** (the composite trace that beats writing,
picturing, and elaborating), **difficulty-based dwell allocation**
(region of proximal learning and its deadline flip — the axis the
value machinery doesn't own), **elaborative interrogation**
(why-probing, gated by prior knowledge), and **subjective
organization at birth** (category-coherent runs mint denser
links). 16 new params, 5 locked nulls, 1 frozen gate, 10 probes
(P889–P898).

## 84. Value-driven attentional capture — the ledger keeps what paid before (CONSENSUS phenomenon; persistence ESTABLISHED)

Anderson, Laurent & Yantis (2011, PNAS 108:10367 — verified):
stimuli associated with reward during a training phase capture
attention when they later appear as task-IRRELEVANT distractors —
involuntary, independent of goals and of physical salience.
Anderson & Yantis (2012, Atten. Percept. Psychophys. — verified):
the capture persists over half a year with no further reward.
Le Pelley, Mitchell, Beesley, George & Wills (2016, Psych. Bull.
142 — verified meta): robust across paradigms; magnitude scales
with reward value. The moderators are the finding for a sim:
vulnerability covaries with working-memory capacity and trait
impulsivity (Anderson 2011) — the low-wmc, high-impulsivity
character is the one whose attention gets pulled by the cue that
used to pay. Distinct from §71 value-directed remembering: VDR is
strategic (the character *chooses* to spend on what matters); VDAC
is stimulus-driven (the reward-stained field *takes* the share).

**Formalization.** Fields may carry `rewardAssoc ∈[0,1]`, minted
when a field co-occurs with a reward outcome and decaying with
half-life `vdac_hl` (180d — the 2012 persistence finding). At
encode, the §31 wm_cap ordering key gains an involuntary leg:

```
orderKey += vdac_w·field.rewardAssoc          (vdac_w ≈ 0.3)
```

The captured share is not free: co-present fields pay a tax —

```
E(field) *= (1 − vdac_tax·maxOther.rewardAssoc)   (vdac_tax ≈ 0.15)
```

— the reward-cued distractor literally steals encoding from what
the character was trying to attend. Two locked boundaries:
`vdac_goal_null` (capture occurs identically when the reward-
associated field is task-irrelevant or goal-opposed — gating by
current goal would make it VDR and is a verdict error) and
`vdac_scope` (frozen: rewardAssoc mints only on reward co-
occurrence; it is never read forward from later outcomes — a
record can't be retroactively stained). Trait loading: `wmc` low
and impulsivity-adjacent traits raise effective capture (Anderson
2011 moderators); `intox`/`sleepdep` states widen it (the
fatigued bartender can't not see the tip jar move).

RW consequence: the cue that paid once — the corner where the tip
was big, the seat where the compliment landed — pulls the eye
months later, and whatever else was in the scene mints thinner.

## 85. Congruent multisensory co-occurrence — two channels, one trace (ESTABLISHED; incongruent split is the sim's own gate)

Shams & Seitz (2008, Nat. Rev. Neurosci. 9:655 — verified
framework): congruent multisensory inputs are learned better and
faster than unisensory equivalents; the benefit is maximal when
each modality alone is weak (inverse effectiveness). Murray et
al. (2004 — verified) and Lehmann & Murray (2005 — verified):
multisensory events at study yield better subsequent recognition,
and unisensory cues can re-evoke the multisensory trace. The
incongruent side is the attention-split cost the sim already owns
elsewhere (daLoad); here it gets a specific gate.

**Formalization.** Events carry `modalities` — a multiset of
engaged channels ({visual,auditory,olfactory,tactile,gustatory})
and a `modalCongruent` flag resolved by the world (spatially/
temporally/semantically coincident channels). Congruent bimodal+
events mint `E *= (1 + msens_gain)` (0.12) AND the record's
cueVector gains cross-modal edges at rate `msens_cue_bridge`
(0.4) — an olfactory cue can retrieve an event whose strongest
field was visual, provided the modalities were congruent at
birth. Incongruent simultaneous modalities do NOT gain; instead
they cost — `E *= (1 − msens_incong_loss)` (0.15) on the weaker
channel's fields (the split-attention tax). Frozen gate
`msens_congr_gate = "field-congruent"`: congruence is evaluated
per field-pair, not per event — the sizzling fajita platter
(sight+sound+smell, congruent) gains; the TV behind the speaker
(incongruent audio) pays.

## 86. The automaticity floor — freq/loc/when mint without permission (ADJUDICATED — floor real, immunity dead)

Hasher & Zacks (1979, JEP:G 108:356 — verified): frequency,
spatial location, and temporal order are encoded "automatically"
— minimal attentional cost, no intention required, no practice
benefit; and (the strong claim) invariant across age and stress.
Zacks, Hasher & Sanft (1982, JEP:LMC 8:106 — verified): frequency
tagging holds under incidental conditions. The adjudication:
Naveh-Benjamin (1987) and successors showed intention DOES help
these attributes and divided attention DOES degrade them — the
attributes are cheaper to encode, not free. Verdict: a floor,
not immunity. The literature keeps the direction (attribute
encoding is the most age-resistant of the deliberate measures)
while killing the strong-invariance claim.

**Formalization.** Attribute-class fields — `freq`, `loc`,
`when` — mint at a floor: their effective attention is
`max(att, auto_floor)` (0.12) regardless of the attention gate,
and daLoad applies at reduced rate `×(1 − auto_da_resist)` (0.5).
Above the floor they behave normally: oriented study improves
them, which is what kills the Hasher–Zacks strong claim. Locked
null `auto_immune_null`: the floor is a floor, never a ceiling —
a build where att==auto_floor performs identically to att==1 on
attribute fields fails by construction. The age shape: the
young–old gap on attribute fields is smaller than on content
fields at matched difficulty (partial sparing, not zero).

## 87. Drawing — the composite trace that beats its parts (ESTABLISHED; mechanism is the composite, not any component)

Wammes, Meade & Fernandes (2016, QJEP 69:1752 — verified):
drawing a to-be-remembered word roughly doubles later recall vs
writing it — and beats deep-LoP description, mental imagery, and
picture viewing; survives 4-second encoding windows and classroom
conditions; quality of drawing irrelevant. The mechanism is the
seamless integration of visual + motor + spatial + semantic into
one trace — synergistic, greater than the sum. Wammes et al.
(2018, Exp. Aging Res. — verified): robust in older adults;
Fernandes, Wammes & Meade (2018 — verified): survives divided
attention where other strategies collapse.

**Formalization.** `engagement:"drawn"` joins the engagement
tier. Drawn events mint `E += draw_gain` (0.18) — larger than
`obs_enc_gain`, positioned as a composite of enactment +
elaboration + concreteness — AND carry `draw_da_resist` (0.6)
partial immunity to daLoad (the 2018 finding: the multimodal
trace survives what verbal strategies can't). Gate: the content
must be drawable — `ei`-style abstract content gains at most half
(`drawable` flag resolved by the world; abstract fields get
`draw_gain × 0.5`). Locked null `draw_verbatim_null`: drawing
mints no verbatim wording — the trace is composite, not
orthographic; a character who drew the diagram remembers the
SHAPE, not the label text.

## 88. Region of proximal learning — dwell follows difficulty, not just value (ESTABLISHED mechanism; the deadline flip is the exploitable part)

Metcalfe & Kornell (2005, JEP:G 134:530 — verified) and Son &
Metcalfe (2000, JEP:LMC 26 — verified): self-paced study time is
allocated to items of INTERMEDIATE difficulty — the region of
proximal learning — not to the easiest (already known) or hardest
(unlearnable in the window). Under time pressure or high stakes
the policy flips to easiest-first (the agenda shifts to maximize
hits). Distinct from §71's value leg: importance orders WHAT is
worth learning; RPL orders WHERE the dwell lands given a fixed
budget — a high-value hopeless item is exactly what the RPL
encoder skips.

**Formalization.** Inside the wm_cap ordering, dwell allocation
(the time-share feeding the E integral) gains a difficulty leg:

```
dwell(field) ∝ rpl_focus·(1 − |difficulty − 0.5|·2)   (rpl_focus ≈ 0.3)
```

— an inverted-U centered on mid-difficulty. Under
`context.deadline` or `stakes` pressure the policy flips:
`dwell ∝ rpl_press_flip·(1 − difficulty)` (0.5) — easiest-first.
`deficit_proxy` flattens the inverted-U (the older encoder can't
implement the discriminative policy — consistent with §71's
selectivity machinery, same deficit at a different axis).
Hypothesis-level formalization of established behavioral
phenomenon; probes P895 must show both modes.

## 89. Elaborative interrogation — the why-question mints, if the schema can catch it (ESTABLISHED effect; knowledge gate is the boundary)

Pressley, McDaniel, Turnure, Wood & Ahmad (1987 — verified):
asking "why" about to-be-learned facts produces large recall
gains vs unelaborated study. Dunlosky et al. (2013, Psych. Sci.
Public Interest 14 — verified review): moderate-utility rating,
but the benefit is contingent on PRIOR domain knowledge — why-
probing knowledge-poor material yields little (the learner has
nothing to elaborate with). This is the encoding-side sibling of
the §5.x explanation machinery: the causal why weaves the new
fact into existing structure — but only if structure exists.

**Formalization.** Events flagged `why:true` (self-directed or
co-narrated causal probing — "why would the landlord fix it
fast?") mint `E += ei_gain` (0.12), gated multiplicatively by the
domain's `schema_support` above threshold `ei_know_gate` (0.4):
below the gate the gain collapses toward zero. Locked null
`ei_noknow_null`: why-probing on schema-poor content gains
≤0.03 — the null is the finding (Dunlosky 2013 contingency);
a build where novices gain full `ei_gain` fails. Composes with
teach_expect and sib machinery (the character who explains to the
room interrogates as they go).

## 90. Subjective organization at birth — coherent runs mint denser links (ESTABLISHED direction; the run-length shape is RW formalization)

Tulving (1962 — verified): subjects impose idiosyncratic
organization on unrelated lists, and subjective organization
predicts recall. Bower, Clark, Lesgold & Winzenz (1969 —
verified): hierarchically organized material is recalled at
multiples of scrambled control — organization at INPUT is the
mechanism. Sternberg & Tulving (1977 — verified): SO is
measurable per-person, stable, and correlated with free recall.
The encoding-side claim: when consecutive events share topic/
category membership, the encoder exploits the coherence —
inter-field links mint denser inside a coherent run than across
category boundaries.

**Formalization.** Track `catRun` — the count of consecutive
events sharing topic-hash with the previous event (world-supplied
or PersonModel topic). When `catRun ≥ org_run_min` (2), each new
within-run field pair mints links at `link_p·(1 + org_gain)`
(0.15); a category break resets catRun to 0. The result:
clustered encoding for clustered experience — the afternoon spent
on the lease negotiation mints as a block, the errands that
interleaved it mint as fragments. Trait loading: `consc`/
narrative-coherence traits raise effective org_gain (the
organizer builds runs out of material the chaotic character
experiences as scatter); this is the encode-side root of the
§5.72 event-cluster machinery.

## 91. Deliberate non-adds (v84)

- **Chewing gum at encoding:** Wilkinson et al. 2002 positive;
  Tucha et al. 2004+ nulls; meta verdict inconsistent/context-
  dependent. Locked fold `gum_gain = 0` — any residual is
  arousal/freshness, priced elsewhere.
- **Glucose facilitation:** Sünram-Lea meta shows small,
  state-dependent effects contingent on demand/fasting — folds
  into physiological arousal machinery; no dedicated param.
- **Acute exercise DURING encoding:** dual-task cost owns the
  concurrent case; post-encoding exercise is consolidation-side
  (rest_gain family owns the window). No encode param.
- **Action-video-game transfer:** a trait/attention-bandwidth
  claim (Bavelier et al.), not an event mechanism — folds into
  wmc/attention traits.
- **Acute mindfulness induction:** `mindful` trait owns the
  standing version; state induction effects are small and
  contested — no new param.
- **Verbal vs pictorial presentation mode:** `concrete_gain` +
  imagery machinery own the modality content difference; the
  drawing pass (§87) is the production-side claim, not
  presentation.
- **Rehearsal/strategy instruction effects:** strategy_use and
  intent_boost own the deliberate-strategy channel; per-strategy
  constants would double-count.

## 92. Parameter summary (new in v5.32 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `vdac_w` | 0.3 | 0–0.7 | reward-history leg in wm_cap ordering | Anderson, Laurent & Yantis 2011; Le Pelley 2016 |
| `vdac_tax` | 0.15 | 0–0.4 | E loss on co-present fields when captured | Anderson 2011 distractor cost |
| `vdac_hl` | 180 | 30–365 | rewardAssoc half-life (days) | Anderson & Yantis 2012 persistence |
| `msens_gain` | 0.12 | 0–0.35 | congruent multimodal E multiplier | Shams & Seitz 2008; Murray 2004 |
| `msens_incong_loss` | 0.15 | 0–0.45 | split-attention cost on incongruent | split-attention lit |
| `msens_cue_bridge` | 0.4 | 0–1 | cross-modal cue-edge fraction | Lehmann & Murray 2005 |
| `auto_floor` | 0.12 | 0–0.3 | attribute-field attention floor | Hasher & Zacks 1979 (as adjudicated) |
| `auto_da_resist` | 0.5 | 0–0.9 | daLoad attenuation on attribute fields | partial automaticity verdict |
| `draw_gain` | 0.18 | 0–0.45 | drawn-engagement E bonus | Wammes, Meade & Fernandes 2016 |
| `draw_da_resist` | 0.6 | 0–1 | DA immunity share on drawn trace | Fernandes, Wammes & Meade 2018 |
| `rpl_focus` | 0.3 | 0–0.7 | mid-difficulty dwell concentration | Metcalfe & Kornell 2005 |
| `rpl_press_flip` | 0.5 | 0–1 | deadline → easiest-first policy shift | Son & Metcalfe 2000 |
| `ei_gain` | 0.12 | 0–0.35 | why-probing E bonus | Pressley et al. 1987 |
| `ei_know_gate` | 0.4 | 0–0.8 | schema-support gate on ei_gain | Dunlosky et al. 2013 contingency |
| `org_gain` | 0.15 | 0–0.4 | within-run link_p multiplier | Bower 1969; Tulving 1962 |
| `org_run_min` | 2 | 2–4 | catRun length to trigger org_gain | SO/chunking lit |

**Frozen constants (v5.32):** `vdac_scope` (rewardAssoc mints at
reward co-occurrence, never retroactive), `msens_congr_gate =
"field-congruent"`. **Locked nulls:** `vdac_goal_null` (goal-
irrelevance does not prevent capture — Anderson 2011),
`auto_immune_null` (floor not ceiling — Naveh-Benjamin critique),
`draw_verbatim_null` (composite trace mints no orthographic
verbatim), `ei_noknow_null` (schema-poor why-probing gains ≈0 —
Dunlosky 2013), `gum_gain = 0` (fold).

## 93. Validation probes P889–P898

- **P889 (MUST) VDAC capture:** rewardAssoc-tagged fields gain E
  under daLoad where matched neutral fields fail;
  `vdac_goal_null` enforced — capture persists when the reward-
  associated field is task-irrelevant (a build where current-goal
  fields always win fails); wmc-low profiles show larger capture
  (moderator ordering, Anderson 2011).
- **P890 (SHOULD) VDAC persistence:** rewardAssoc remains
  effective (cue-heating + capture share) after contingency ends;
  decay follows vdac_hl, not reward-loss events (Anderson &
  Yantis 2012 — six-month persistence shape).
- **P891 (MUST) multisensory:** congruent bimodal > unimodal at
  matched attention (msens_gain band); incongruent bimodal <
  unimodal on the weaker channel (split cost); cross-modal cue
  retrieval works only for congruently-minted records (bridge
  audit — an incongruent record must NOT be reachable via the
  untested modality's cue).
- **P892 (MUST — bounded automaticity):** freq/loc/when fields
  mint above zero at maximal daLoad (auto_floor) BUT intentional
  orienting still improves them (auto_immune_null — a build where
  floor==ceiling fails); gap between attribute and content fields
  under load is positive and bounded.
- **P893 (SHOULD) age invariance:** attribute-field young–old gap
  smaller than content-field gap at matched difficulty (Hasher &
  Zacks direction); nonzero slope — partial sparing, not
  immunity (the adjudicated verdict, not the strong claim).
- **P894 (MUST) drawing:** drawn > written ≈ imagined ≈
  elaborated at matched exposure (Wammes 2016 ordering); under
  dual task the drawn advantage shrinks less than verbal
  strategies' (draw_da_resist); `draw_verbatim_null` TOST-
  enforced (drawn records match written on wording recall);
  abstract (non-drawable) content gains ≤ half the gain.
- **P895 (SHOULD) RPL allocation:** self-paced dwell concentrates
  on mid-difficulty items (inverted-U over difficulty); deadline
  context flips to easiest-first (rpl_press_flip); deficit
  profiles flatten the U (Metcalfe & Kornell + deficit
  prediction); value leg unchanged — orthogonal axis audit.
- **P896 (MUST — gate) elaborative interrogation:** why:true
  gains ei_gain only when schema_support ≥ ei_know_gate;
  below-gate gain ≤0.03 (TOST ei_noknow_null); above-gate the
  gain composes multiplicatively with teach_expect (explaining
  and interrogating stack, never subtract).
- **P897 (SHOULD) subjective organization:** catRun≥org_run_min
  sequences mint denser link edges (edge count per field-pair);
  recall clustering rises with run coherence; singleton runs
  unaffected; consc-high profiles show stronger runs → more
  organization (trait moderation direction).
- **P898 (MUST — structure) v5.32 regression:** new fields/params
  pass the P457 non-interference pattern (rewardAssoc mints at
  reward co-occurrence only — no future reads; modalities/
  modalCongruent are encode-time flags; drawn/rpl/why are
  engagement variants inside existing channels; catRun is a
  sequence counter, not a store) and the §12.2 commutativity
  pattern (no new op reads across charIds).

## 94. Spec deltas delivered (v5.32)

- `memory-model-spec.md` → v5.32: §2 +6 mechanism bullets
  (VDAC reward-history capture + tax, multisensory congruence
  + incongruent split, attribute automaticity floor, drawing
  engagement, RPL dwell + deadline flip, elaborative
  interrogation gate, subjective-organization runs); params
  +16 (+5 locked nulls, +1 frozen + vdac_scope); §10 contract
  additions — Event fields `rewardAssoc ∈[0,1]`, `modalities`
  multiset + `modalCongruent`, `engagement:"drawn"` +
  `drawable`, `why:true`, `context.deadline`; record attribute
  floor on freq/loc/when; `catRun` sequence counter on encode.
  All optional w/ defaults; backward compatible.
- `character-memory-profiles.md`: §0 +16 clamp rows; §65 v5.32
  note — none are trait pins (all mechanism constants); emergent
  shadows (the low-wmc character's attention leaks toward old
  reward cues; the anxious interrogator encodes deep only where
  they already know the terrain; the routine-holder's coherent
  days mint as blocks).
- `validation-design.md`: §§172–174 — probes P889–P898 +
  sources. Registry P1–P898.
- `human-memory-research.md`: §62 v84 summary appended.

## 95. Sources new to this version (all verified 2026-09-23)

- Anderson, Laurent & Yantis 2011 (PNAS 108:10367 — verified:
  reward-associated distractors capture attention against goals;
  WMC/impulsivity moderators); Anderson & Yantis 2012 (Atten.
  Percept. Psychophys. — verified: >6-month persistence);
  Le Pelley, Mitchell, Beesley, George & Wills 2016 (Psych.
  Bull. 142 — verified meta: value-driven capture robust,
  value-scaled); Anderson 2016 (Psych. Bull. — reward history
  as attentional habit).
- Shams & Seitz 2008 (Nat. Rev. Neurosci. 9:655 — verified
  multisensory-learning framework, inverse effectiveness);
  Murray et al. 2004 (multisensory study → better recognition);
  Lehmann & Murray 2005 (cross-modal re-evocation of the
  multisensory trace).
- Hasher & Zacks 1979 (JEP:G 108:356 — verified: automatic vs
  effortful framework, frequency/spatial/temporal claims);
  Zacks, Hasher & Sanft 1982 (JEP:LMC 8:106 — verified:
  frequency tagging under incidental conditions); Naveh-Benjamin
  1987 (the adjudication — intent and attention do matter:
  floor, not immunity).
- Wammes, Meade & Fernandes 2016 (QJEP 69:1752 — verified:
  >2× recall vs writing, survives LoP/imagery/picture controls,
  4s encoding OK, quality irrelevant); Wammes et al. 2018 (Exp.
  Aging Res. — verified: robust in older adults); Fernandes,
  Wammes & Meade 2018 (verified: survives divided attention);
  Meade & Fernandes 2020 (meta thread).
- Metcalfe & Kornell 2005 (JEP:G 134:530 — verified: region of
  proximal learning); Son & Metcalfe 2000 (JEP:LMC 26 —
  verified: agenda-based allocation, pressure → easy-first
  shift); Metcalfe 2002 (RPL under time constraints).
- Pressley, McDaniel, Turnure, Wood & Ahmad 1987 (elaborative
  interrogation paradigm — verified); Dunlosky et al. 2013
  (Psych. Sci. Public Interest 14 — verified: moderate utility,
  prior-knowledge contingency).
- Tulving 1962 (subjective organization — verified); Bower,
  Clark, Lesgold & Winzenz 1969 (hierarchical organization
  recall multiples — verified); Sternberg & Tulving 1977 (SO
  measurement — verified).
- Deliberate-null/fold sources: Wilkinson et al. 2002 + Tucha
  (gum inconsistency); Sünram-Lea (glucose, state-dependent);
  Bavelier (AVG transfer — trait not event).

# Part VIII — encoding-mechanics, eighth pass (v96 focus)

The question this pass: what does the STIMULUS bring, what does the
ROOM bring, and what does the ENCODER'S OWN PAST ERROR bring — the
three legs the store had been treating as encoder-internal. New
machinery: an intrinsic-memorability field, a co-attention gain, a
prediction-error encoding window, an anticipatory reward window
(reopening the v40 fold — correctly, with the anticipation arm
separated), gesture as a fourth engagement variant, cognitive
offloading with the pointer-for-fact trade, TOT error learning and
its resolution repair, the labor-in-vain negative anchor, and the
phone-drain observation tier. Probes P1017–P1026; spec v5.44.

## 96. Intrinsic memorability — the stimulus carries its own E (CONSENSUS phenomenon; mechanism DEBATED)

Isola, Parikh, Torralba & Oliva 2011 (CVPR/NeurIPS line —
verified): face and scene images have memorability that is
**consistent across observers** (split-half ρ ≈ 0.68–0.75) —
memorability is a property of the stimulus, not the perceiver.
Bainbridge, Isola & Oliva 2013; Bainbridge, Dilks & Oliva 2017
(*NeuroImage* — verified): memorability survives controlling for
every measured attribute (color, aesthetics, arousal, valence,
distinctiveness) — a residual ~50% is unexplained by the standard
feature list. Khosla et al. 2015: memorability-ranked images
predict forgetting order.

§76 already gives faces a memorability term; this generalizes the
axis to ALL event records. The stimulus-side term is
**independent of encoder state**: a memorable event encodes
deeper for the distracted AND the attentive (Isola's consistency
means low inter-encoder variance on this leg — deliberately
small interaction terms).

```
E += memorab_gain · memorab        // memorab ∈ [0,1] event field
memorab derivation (world may supply directly):
  0.4·distinctiveness + 0.25·concreteness + 0.35·(world tag / residual)
```

**Locked null `memorab_attr_null`:** memorab may NOT be reduced
to the existing arousal + distinctiveness + concreteness terms —
the residual component is mandatory (Bainbridge 2017's
unexplained half). A build where memorab = w·arousal +
w·distinctiveness with no residual fails P1017.

Boundary: the field is birth-time only — memorab does not make
the record more durable (no β interaction; memorability is
encoding, not consolidation — Rust & Mehrpour 2020 discussion).

## 97. Co-attention — "we are looking at this" deepens the trace (ESTABLISHED direction; minimal conditions DEBATED)

Shteynberg 2010 (JPSP — verified): stimuli believed co-attended
with an ingroup member are recalled better than stimuli believed
attended alone or by an outgroup — under matched exposure.
Eskenazi, Doerrfeld, Logan, Knoblich & Sebanz 2013 (verified):
words thought attended-with-partner > words thought unattended —
the belief suffices; actual partner attention not required.
Shteynberg 2015 (*Perspect. Psychol. Sci.* 10:579 — verified):
the mechanism claim — co-attention deepens processing by treating
the stimulus as socially relevant. DEBATED boundary: a 2026
registered replication (Psychol. Res. — open) asks whether mere
passive co-attention with a stranger suffices or whether
ingroup/coordination is required; treat `coattend_ingroup` as an
open gate, not a law.

```
if coAttending ≥ 1:                 // field set by world — others
   E += coattend_gain               //   verifiably watching the
   cueEdges += partner_view_link    //   same referent
gate: coattend_ingroup (default 0.5)
   [ingroup co-attender] → full gain
   [stranger]          → gain × coattend_ingroup   // open question
```

The minted record also gains a `coSeen` edge to the co-attender —
shared-attention events become the natural "we both saw it"
rumor substrate (social-memory §6.204 pipeline reads them).
Locked null `coattend_expose_null`: co-attention cannot raise E
on fields nobody attended — the gain rides attended fields only.

## 98. Prediction error at encoding — the violation mints the link (CONSENSUS direction; the shape is RW formalization)

Greve, Cooper, Kaula, Anderson & Henson 2017 (*NeuroImage* —
verified): memory for items benefits when they violate the active
schema's predictions — prediction error (not novelty, not
distinctiveness) drives the encoding boost, and the effect is
on the **item–context association**, not item memory alone.
Quent, Henson & Greve 2021 (verified): predictive-coding formal
account — PE strength scales the associative encoding; extreme
unpredictability is NOT better (the violating item must remain
connectable to the schema — "mismatch you can narrate").
Brod, Werkle-Bergner & Shing 2013: children's PE benefit is
larger — schema-weak encoders get more violation mileage.

age-development's `schema_violation` machinery covers the
assimilation side (violation → schema-tag at recall). This is
the ENCODING arm:

```
pe = |expected − actual|  per salient field (world may tag
     expectation directly: Event.expected:{field:value})
if pe ≤ pe_win:   E_link += pe_gain · pe      // moderate PE:
if pe > pe_win:   mint separate record        //   binds tighter
                  (schema-split, no link boost) // extreme PE:
                                                //   new context
pe_gain scaled ×(1 + 0.4·[schema sparse])     // Brod child arm
```

Locked null `pe_conflate_null`: PE boost never lands on the
item's OTHER fields — it is link-targeted (Greve's associative
locus); a build where pe boosts whole-record E fails P1020.

## 99. The anticipatory window — reward BEFORE the event, not value AT it (ESTABLISHED; reopens the v40 fold, correctly)

Adcock, Thangavel, Whitfield-Gabrieli, Knutson & Gabrieli 2006
(*Neuron* 50:507 — verified): incentive cues presented BEFORE a
scene engage midbrain–hippocampal circuitry and selectively
improve later memory for the anticipated scene — the gain accrues
to the ANTICIPATION state, not the post-hoc value judgment.
Wittmann et al. 2005 (verified): reward anticipation activates
SN/VTA + hippocampus during encoding. Murty & Adcock 2014:
the anticipation benefit is specific to the rewarded category/
window — dopaminergic timing is narrow (seconds, not minutes).

v40 folded reward-encoding into `value_select` (importance).
That fold is CORRECT for post-hoc value but misses the temporal
structure: anticipation precedes the stimulus; VDAC (§84)
covers reward-history capture of attention, which is
retrospective. The missing piece is the prospective window:

```
Event.antic:true  →  // world sets when a pre-event cue promised
                     // outcome (bet placed, tip expected, news
                     // teased, doorbell during a wait)
antic_win days (default 0.01 ≈ 15 min): events landing inside
   the window after the cue take E += antic_gain
locked null antic_retro_null: events BEFORE the cue are never
   boosted — anticipation has no retroactive reach (separate
   channel from post_stress_gain, which IS retrograde)
```

The anticipation and post-hoc value legs compose
multiplicatively, never substituting: a character can
anticipate a reward (`antic`) and judge it worthless on
arrival (low `value_select`) — the trace keeps the
anticipation gain anyway (Murty & Adcock's timing account).

## 100. Gesture at encoding — the fourth engagement variant (ESTABLISHED; smaller than enacted)

Cook, Duffy & Fenn 2013 (*Psychol. Sci.* 24:1734 — verified):
children who gestured during encoding recalled more than those
who only watched — gesture is a learning instrument, not just a
display. So, Sim Chen-Hsing & Low Shuang 2012 (verified):
gesturing while learning improves subsequent recall for the
gestured content. Goldin-Meadow thread: gesture lightens the
encoder's own working-memory load AND binds a motor trace.
Iconic/representational gestures carry the effect; beat gestures
are weak-to-null on the memory measure.

Fourth entry in the engagement catalog (after `enacted`,
`drawn`, `written`) — deliberately the smallest of the motor
arms because it is typically co-occurent with speech, not
replacement of the material:

```
engagement:"gestured" → E += gest_gain (0.1, smallest motor arm)
gest_iconic_w ∈ [0,1] (default 0.7): representational share;
   pure-beat events take gest_gain × (1 − gest_iconic_w) ≈ 0.03
```

Composition: gestured + spoken ≠ enacted — a character who
gestures while telling a story is not performing the story;
the arms stack additively with a cap at the enacted level
(`min(enacted_total, E)` — the engaged arms share one motor
budget). Locked null `gest_beat_null` below gest_iconic_w=0.3
threshold is P1023's job.

## 101. The offloading boundary — impairment requires expected persistence (ESTABLISHED; deepens the v3.5 channel)

The offloading channel already exists (v3.5: `offload:true` →
`offload_cost` hollow + `extref` pointer + `offloadAttend` zoom
rescue — Henkel 2014's engaged-capture arm). This pass adds the
arm that was missing — Henkel 2014's second condition: the
impairment requires **expecting the offloaded copy to persist**.
Photographing while believing the photo will be deleted
produces NO impairment — the brain only offloads what it
expects to keep. Risko & Gilbert 2016 (*Trends Cogn. Sci.* —
verified): offloading is a rational allocation policy —
reliance grows with external-store trustworthiness (the
phone-dependent resident offloads habitually; the scrap-paper
skeptic does not).

```
Event.offload:true + offloadTransient:true   // the character
     // knows the copy is temporary (about to delete, scrap
     // paper for the moment, voice memo to self-destruct)
     → offload_cost does NOT apply (record encodes full)
trait device_dep ∈ [0,1] (shared with §104 phone_drain):
     offload adoption probability ∝ device_dep — heavy
     offloaders treat capture as reflexive
```

Locked null `offload_noexp_null`: no impairment without
expected persistence. The v3.5 `extref`/`offloadAttend`
machinery is untouched — this is a gate on the existing cost,
not a second channel. The new behavioral surface: a resident
who live-posts the block party (expects the feed to persist)
encodes it hollow; the one shooting a throwaway snap for a
friend encodes it whole — same phone, different expectation,
opposite memory.

## 102. The TOT that teaches the error — and the resolution that repairs it (ESTABLISHED; encoding consequence of failed retrieval)

Warriner & Humphreys 2008 (*QJEP* — verified): a
tip-of-the-tongue state is itself an encoding event — an
unsuccessful-but-effortful retrieval strengthens the WRONG
mapping, and the TOT recurs (~2× likelihood at 48h after a
longer unresolved dwell). D'Angelo & Humphreys 2015
(*Cognition* 142:166 — verified): error learning is durable
(one week), BUT spontaneous self-resolution corrects it —
and externally cued resolutions (orthographic hint) correct
nearly as well. Effort is required: brief TOTs teach less
error than long ones.

This is the retrieval→encoding loop the store was missing —
§58's pretest potentiation warms the landing for NEW targets;
this arms the FAILED search for KNOWN items:

```
on TOT_state(record):               // failed access, felt-knowing
   err_strength += tot_learn·dwell  // unresolved dwell trains
                                   //   the blocking state
on TOT_resolved(self):   // spontaneous resolution:
   err_strength ×= (1 − tot_res_gain);   S += tot_res_gain
on TOT_resolved(cued):   // orthographic/semantic hint:
   err_strength ×= (1 − 0.8·tot_res_gain)
```

The `err_strength` ledger makes TOTs recur — a character's name
blank that resolves on its own is REPAIRED; one that is
abandoned trains the blank (the friend's-name-on-the-tongue
loop is now mechanically real). Locked null `tot_rescue_null`:
external answer-giving without the hint path (someone just says
the name — full disclosure, not a cue) does NOT repair —
resolution must run through the character's own search
(D'Angelo 2015's cued-resolution condition).

## 103. Labor in vain — effort is not depth (NEGATIVE ANCHOR; adjudicated, locked)

Nelson & Leonesio 1988 (*Am. Psychol.* 43 — verified): in the
classic "labor in vain" finding, study effort per item (longer,
harder processing at matched strategy) did NOT improve recall —
encoding gain tracks the STRATEGY (deeper processing, tests,
organization), not the felt exertion. Hyde & Jenkins 1973's
intention null (§1) is the cousin: wanting harder doesn't
encode harder. Cuevas & Dawson 2018: self-perceived effort
predicts JOL, not memory — effort is a metacognitive input,
not an encoding lever.

Locked null `labor_vain_null`: no param may translate raw
effort (dwell, arousal-neutral strain, `tryHard` flags) into E.
Effort can only act through the existing levers: attentional
allocation (wm_cap ordering), strategy selection
(rpl_focus/ei/org draws), and dwell-as-more-encodes (massed
re-encoding). A build where `effort` is an E term fails P1025 —
this is the same class of negative anchor as `disfluency` (§65)
and `intention` (§1): the sim keeps a locked record of the
levers that DON'T exist so nobody adds them later.

## 104. The phone in the pocket — mere presence as a drain (DEBATED → OBSERVE tier)

Ward, Duke, Gneezy & Bos 2017 (*J. Assoc. Consumer Res.* —
verified): the mere presence of one's own smartphone (even off,
face-down) reduces available cognitive capacity on
attention-demanding tasks — "brain drain." Partial
replication record is mixed (small/conditional effects in some
replications; device-dependence moderates). For RW this is the
modern resident condition — phones at the kitchen table, on the
bar, in the pocket during the conversation:

```
context.phone_present → daLoad += phone_drain  (0.05 — half the
   size Ward measured, hedged to the contested replication base)
   scaled by device_dep (trait, default 0.5 — heavy users drain
   more, per Ward's moderator)
```

OBSERVE tier: the param exists but is flagged `observe` in the
registry — P1026 audits direction only, no magnitude band. If
the replication base collapses, the param folds to 0 and the
locked null `phone_null` gets promoted.

## 105. Deliberate non-adds (v96)

- **Item-method directed forgetting**: already machinery —
  `df_loss` (v2.4, encoding arm) + `df_theta` (retrieval arm) +
  Rupprecht & Bäuml age scaling + the child report-cue gates.
  Nothing new to mechanize.
- **Seductive details**: reaffirmed folded into daLoad (v40
  note stands — it is attention split, not a separate channel).
- **Test-format expectancy** (expecting recall vs recognition
  changes encoding — Balota & Neely line): folded into
  `teach_expect`/expect fields; the format-expectation arm is
  too thin to earn a param at current evidence.
- **Contextual variability** (Glenberg varied-context benefit):
  emergent — varied encoding contexts already mint distinct
  place/state cue edges through the existing cue-minting; no
  separate gain needed (the mechanism is cue diversity, which
  the store does natively).
- **Positive-mood attentional broadening** (Rowe et al.): stays
  in emotional-memory scope; the encoding-side term would
  double `w_emo_pos`.
- **Emotional trade-off** (center detail vs periphery cost):
  already `arousal_narrowing` + weapon-focus machinery.

## 106. Parameter summary (new in v5.44 spec table)

| param | default | range (clamp) | mechanism | evidence |
|---|---|---|---|---|
| `memorab_gain` | 0.15 | 0–0.4 | stimulus memorability E leg | Isola 2011; Bainbridge 2017 |
| `memorab_resid` | 0.35 | 0.2–0.6 | unexplained-attribute share | Bainbridge, Dilks & Oliva 2017 |
| `coattend_gain` | 0.1 | 0–0.3 | co-attention E boost | Shteynberg 2010; Eskenazi 2013 |
| `coattend_ingroup` | 0.5 | 0–1 | stranger-co-attender fraction | minimal-conditions debate |
| `pe_gain` | 0.12 | 0–0.4 | link-level PE encoding boost | Greve 2017; Quent 2021 |
| `pe_win` | 0.6 | 0.3–1.0 | connectable-mismatch ceiling | Quent 2021 formal bound |
| `antic_gain` | 0.15 | 0–0.4 | anticipatory-window E boost | Adcock 2006; Wittmann 2005 |
| `antic_win` | 0.01 | 0.002–0.05 | post-cue window (days) | Murty & Adcock 2014 timing |
| `gest_gain` | 0.1 | 0–0.25 | gestured-content E bonus | Cook, Duffy & Fenn 2013 |
| `gest_iconic_w` | 0.7 | 0–1 | representational-gesture share | So et al. 2012 |
| `device_dep` | 0.5 | 0–1 | offload-adoption + phone-drain trait | Ward 2017 moderator |
| `tot_learn` | 0.1 | 0–0.3 | unresolved-TOT error learning | Warriner & Humphreys 2008 |
| `tot_res_gain` | 0.5 | 0.2–0.9 | resolution repair share | D'Angelo & Humphreys 2015 |
| `phone_drain` | 0.05 | 0–0.15 | presence-only daLoad add | Ward 2017 (OBSERVE) |

**Locked nulls:** `memorab_attr_null` (memorab keeps its
residual — P1017), `coattend_expose_null` (gain rides attended
fields only — P1019), `pe_conflate_null` (PE is link-targeted
— P1020), `antic_retro_null` (no retroactive reach — P1021),
`gest_beat_null` (beat gestures ≈ no gain — P1023),
`offload_noexp_null` (no impairment without expected
persistence — P1022), `tot_rescue_null` (told answers don't
repair — P1024), `labor_vain_null` (effort is not an E term —
P1025). `phone_drain` is OBSERVE-tier.

## 107. Validation probes P1017–P1026

- **P1017 (MUST) intrinsic memorability:** at matched attention,
  matched arousal, matched distinctiveness, high-memorab events
  out-recall low-memorab (Isola consistency = low inter-profile
  variance on this leg — audit variance, not just mean);
  `memorab_attr_null` TOST-enforced (a residual-free build
  fails); memorab has NO β interaction (durability audit).
- **P1018 (MUST) co-attention:** coAttending≥1 events out-recall
  solo-attended at matched exposure and matched attention; the
  ingroup fraction gates the stranger arm via `coattend_ingroup`;
  `coattend_expose_null` — unattended fields gain nothing.
- **P1019 (SHOULD) co-seen rumor substrate:** minted coSeen edges
  are consumed by the social-memory rumor pass; a co-attended
  event propagates with higher initial credibility to the
  co-attender (shared witnessing, not shared telling).
- **P1020 (MUST — structure) prediction error:** moderate PE
  raises item–context link strength with item-E unchanged
  (`pe_conflate_null` TOST); pe > pe_win splits to a new record
  (no link boost, no merge with the schema record); sparse-schema
  profiles show larger gain (Brod direction).
- **P1021 (MUST) anticipation window:** antic:true events inside
  antic_win take the boost; outside the window do not;
  `antic_retro_null` — pre-cue events never boosted; composes
  multiplicatively with value_select (an anticipated-but-
  worthless event keeps the anticipation gain and loses the
  value gain — two independent terms).
- **P1022 (MUST) offloading boundary:** offload:true events
  take the v3.5 hollow+pointer profile UNCHANGED (regression
  audit); offloadTransient:true events take NO offload_cost
  (`offload_noexp_null` TOST — Henkel's deletion arm);
  device_dep orders adoption frequency across profiles
  (heavy-offloader vs scrap-paper profiles diverge on
  capture count, not per-event E).
- **P1023 (SHOULD) gesture:** gestured > silent-watch at matched
  exposure, smaller than enacted (ordering); gest_iconic_w=0
  collapses the gain to ≤0.03 (`gest_beat_null` TOST);
  gestured+spoken stack caps at enacted level (shared motor
  budget audit).
- **P1024 (MUST) TOT ledger:** unresolved TOTs recur at ≥1.5×
  baseline after long dwell (Warriner 2008 arm); self-resolved
  TOTs recur at ≤ baseline (`tot_res_gain` repair); told-
  answers do NOT repair (`tot_rescue_null`); error learning
  is durable ≥7 sim-days (D'Angelo 2015).
- **P1025 (MUST — locked-null class) labor in vain:** dwell and
  effort-flag manipulations at fixed strategy produce
  ΔE ≤ 0.02 (TOST); the ONLY paths to higher E are the named
  levers (strategy, attention allocation, re-encoding count);
  probe is the regression wall for future "try harder" params.
- **P1026 (OBSERVE) phone drain:** phone_present reduces
  effective encoding resources per `phone_drain`·(0.5 +
  device_dep); direction-only audit, no band — flagged observe
  pending replication verdict.

## 108. Spec deltas delivered (v5.44)

- `memory-model-spec.md` → v5.44: §§6.221–6.229 (memorab field,
  co-attention + coSeen edge, PE link-boost + pe_win split,
  anticipatory window, gesture engagement arm, offloading
  persistence gate, TOT err_strength ledger, labor-
  in-vain locked null, phone-drain observe tier); §7 +14
  scalars +1 trait, +8 locked nulls (+1 observe flag);
  §10 contract adds — Event fields `memorab`,
  `coAttending`/`coSeen`, `expected`, `antic`,
  `offloadTransient`, `phone_present` ctx; record field
  `err_strength` on TOT-marked records; engagement enum
  +`gestured`; trait `device_dep` (shared by §§101/104).
- `character-memory-profiles.md`: §0 +16 clamp rows; §76 v5.44
  note — all are mechanism constants; emergent shadows
  (the phone-offloader knows WHERE not WHAT; the chronic TOT
  has a trained blank until it self-resolves; the co-watcher
  remembers the show better than the solo one).
- `validation-design.md`: §§200–201 — probes P1017–P1026 +
  sources. Registry P1–P1026.
- `human-memory-research.md`: §74 v96 summary appended.

## 109. Sources new to this version (all verified 2026-09-23)

- Isola, Parikh, Torralba & Oliva 2011 (verified: cross-observer
  memorability consistency ρ≈0.7); Bainbridge, Isola & Oliva
  2013; Bainbridge, Dilks & Oliva 2017 (*NeuroImage* — verified:
  memorability residual after attribute controls); Khosla et
  al. 2015; Rust & Mehrpour 2020 (memorability review —
  encoding locus).
- Shteynberg 2010 (JPSP — verified: co-attention with ingroup →
  memory); Eskenazi, Doerrfeld, Logan, Knoblich & Sebanz 2013
  (verified: believed co-attention suffices); Shteynberg 2015
  (*Perspect. Psychol. Sci.* 10:579 — verified); 2026 registered
  replication on minimal conditions (open — marks the
  `coattend_ingroup` gate DEBATED).
- Greve, Cooper, Kaula, Anderson & Henson 2017 (*NeuroImage* —
  verified: PE → associative encoding); Quent, Henson & Greve
  2021 (verified: formal predictive-coding account, connectable-
  mismatch bound); Brod, Werkle-Bergner & Shing 2013 (child PE
  advantage — verified).
- Adcock, Thangavel, Whitfield-Gabrieli, Knutson & Gabrieli 2006
  (*Neuron* 50:507 — verified: pre-stimulus incentive →
  selective memory); Wittmann et al. 2005 (verified: SN/VTA +
  hippocampus co-activation); Murty & Adcock 2014 (verified:
  anticipation-window specificity).
- Cook, Duffy & Fenn 2013 (*Psychol. Sci.* 24:1734 — verified:
  gesture during encoding → recall); So, Sim Chen-Hsing & Low
  Shuang 2012 (verified); Goldin-Meadow thread (gesture
  lightens WM — verified direction).
- Sparrow, Liu & Wegner 2011 (*Science* 333:776 — verified:
  expected-access → content loss, location preserved); Henkel
  2014 (*Psychol. Sci.* 25:396 — verified: photo impairment,
  zoom rescue, deletion arm); Risko & Gilbert 2016 (*Trends
  Cogn. Sci.* — verified: offloading as rational allocation).
- Warriner & Humphreys 2008 (*QJEP* — verified: TOT error
  learning, ~2× recurrence); D'Angelo & Humphreys 2015
  (*Cognition* 142:166–190 — verified: one-week durability,
  self/cued resolution corrects, effort-required).
- Nelson & Leonesio 1988 (*Am. Psychol.* 43 — verified: labor-
  in-vain); Hyde & Jenkins 1973 (reused); Cuevas & Dawson 2018
  (effort → JOL, not memory — verified direction).
- Ward, Duke, Gneezy & Bos 2017 (*J. Assoc. Consumer Res.* —
  verified: mere-presence drain, device-dependence moderator;
  replication record mixed → OBSERVE tier).
- Deliberate-null/fold reaffirmations: Basden & Basden +
  MacLeod 1998 (DF covered); Rey + Harp & Mayer (seductive
  details = daLoad); Glenberg 1979 (context variability
  emergent via cue minting).

# Part IX — encoding-mechanics, ninth pass (v108 focus)

The question this pass: what is LEFT informal in the encoder after
eight passes? Three honest answers. (a) The boundary detector is a
world-supplied boolean — real humans DERIVE boundaries from index
changes, so identical scenes segment differently per viewer; the
event-indexing calculus makes that a mechanism, not an input. (b)
Two flat penalties (intox field-write loss, arousal peripheral
loss) are uniform where the literature says they are
SLOPED — alcohol myopia and the item/binding split give the slopes.
(c) Four residual phenomena priced by adjacent machinery but never
named: insight's mark, the vigilance floor's creep, impression-set
organization, and the addressee/overhearer split — plus the
vividness myth, the most intuitive wrong param the spec still
lacks a fence against. Probes P1146–P1155; spec v5.56.

## 110. Derived boundaries — the index-change calculus (formalization of §1.2's flag; CONSENSUS phenomenon, RW weights HYPOTHESIS)

Zwaan, Langston & Graesser 1995 (*Psychol. Sci.* 6:292 — verified:
readers monitor events on five indices — time, space, protagonist,
causality, intentionality — and a shift on ANY index triggers an
event-model update); Zwaan & Radvansky 1998 (situation-model
review); Radvansky 2012 (*Curr. Dir. Psychol. Sci.* 21:7 —
verified); Speer, Reynolds & Zacks 2007 (*Psychol. Sci.* 18:449 —
verified: neural boundary regions at index discontinuities);
Kurby & Zacks 2008 (*J. Mem. Lang.* 58 — verified: segmentation
ability is a stable trait predicting later memory).

Since v1.2 the spec has consumed `boundary:true` as a world flag —
accurate about WHAT a boundary is, silent about WHO sees one. But
the same party is ten events to a watcher tracking relationships
and two events to a watcher tracking the playlist. The mechanism:
the world now supplies per-event **index-change magnitudes**
`dIdx = {time, space, protagonist, causal, intent} ∈ [0,1]` (the
same facts it already has — speaker changes, location hops, goal
switches, cause links); the character derives

```
boundary_p = 1 − exp(− seg_gain · Σ_i idx_w_i · dIdx_i)   (seg_gain ≈ 0.5)
idx_w = {time 0.30, space 0.35, protagonist 0.50, causal 0.40, intent 0.45}
boundary_p *= seg_sens                                     // per-char trait [0.7–1.4]
```

`boundary:true` on the event now means "world flags a hard cut"
≡ `dIdx_i ≥ 0.8` on some index — backward compatible, but the
character may ALSO mint a boundary the world didn't flag
(perceiver-specific), and may MISS a flagged cut at low seg_sens
× low attention (segmentation failure → the cross-boundary
merge §4.26's coarsening already expects). Kurby & Zacks 2008's
trait result becomes `seg_sens` — segmentation skill predicts
later recall in their data, so it scales `boundary_p`, never E.
Locked `seg_hard_null`: `boundary:true` no longer auto-mints —
a world flag is a dIdx ≥0.8 input, not an output command.

## 111. The Aha mark — insight solutions encode with a signature (ESTABLISHED; mechanism adjudicated below)

Danek, Fraps, von Müller, Grothe & Öllinger 2013 (*Psychol. Res.*
77:659 — verified: magic-trick solutions reached WITH Aha recalled
64.4% vs 52.4% without at 14 days, N=50); Kizilirmak, Galvao
Gomes da Silva, Imamoglu & Richardson-Klavehn 2016 (*Front.
Psychol.* 7:134 — verified: insight advantage in delayed memory
with feeling-of-warmth curves); Ludmer, Dudai & Rubin 2011
(*Cereb. Cortex* 21:2853 — verified: insight marked at encoding
predicts week-later recall, medial-temporal correlate). The
mechanism question is adjudicated — Danek & Wiley 2020
(*Cognition* 199 — verified): the advantage is the joint product
of CORRECTNESS, SUBJECTIVE CERTAINTY, and PLEASURABLE REACTION —
not restructuring per se. So the sim pays the mark, not the
mystery:

```
if event.insight and event.self_generated:
    E += ins_gain          // 0.10
    mint meta field `aha:true`;  conf mint +ins_conf (0.05)
```

Locked `ins_told_null`: a told/shown solution collects gen_gain=0
and ins_gain=0 — insight is self-generated or it is nothing (the
three Danek & Wiley components all presuppose the solver). RW
surface: the deduction at the kitchen table — "wait, HE cancelled
the shift" — mints stronger than the same fact overheard.

## 112. The watching floor creeps — sustained monitoring degrades its own gate (CONSENSUS direction; asymptote ESTABLISHED)

Mackworth 1948 (clock-test — verified: detection declines within
the first 30 minutes of sustained watch); Parasuraman 1979
(*Science* 205:924 — verified: sensitivity decrement requires
successive discrimination + high event rate; otherwise criterion
shifts); Davies & Parasuraman 1982 (*The Psychology of Vigilance*
— verified spine); See, Howe, Warm & Dember 1995 (*Psychol. Bull.*
117:230 — verified meta, k=42: decrement substantial, asymptotic,
modulated by discrimination type/event rate/sensory-cognitive
load). Every shopkeeper watching the register, every parent
listening for the baby, every lookout character pays this tax —
and none of it was priced: `att_min` was constant.

```
// while a monitoring Intention (watch/lookout/listen-for) is live:
att_min_eff = att_min · (1 + vigil_rise·(1 − exp(−watch_min/vigil_tau)))
            vigil_rise ≈ 0.6, vigil_tau ≈ 25 min
// any detection, role change, or task switch resets watch_min → 0
```

See et al.'s moderation: high event-rate streams decay faster —
`vigil_tau /= (1 + event_rate/evt_rate_norm)` (evt_rate_norm = the
character's §2.5 ev_day_norm/24). Locked `vigil_retro_null`: the
creep taxes the NEXT encode only — it never rewrites already-minted
records (the decrement is online, Parasuraman 1979).

## 113. Alcohol myopia at the gate — the flat intox loss becomes salience-sloped (CONSENSUS phenomenon; sim mapping HYPOTHESIS)

Steele & Josephs 1990 (*Am. Psychol.* 45:921 — verified: intox
restricts attention to the most salient cues — "alcohol myopia";
peripheral cue processing collapses while focal cues are
comparatively spared); Giancola 2000 (*Exp. Clin.
Psychopharmacol.* 8 — verified executive-deficit account); the
spec already prices anterograde loss (`intox_encode_mult`, White
2003) and the retrograde shield (v5.20 OBSERVE). What's missing
is the SLOPE: the current `vivid_detail·(1 − 0.4·intox)` field-write
penalty is flat across fields, so the model treats the drunk
character as uniformly dumber — the literature says selectively
narrower.

```
field_write_p(intox) = vivid_detail · (1 − intox·intox_periph_k·(1 − salience))
   // intox_periph_k ≈ 0.55 replaces the flat 0.4; salience = field's
   // normalized cue weight (§5.1 cueVector prior, reused — no new store)
```

At intox 0.6 a salience-1.0 field loses ~0% and a salience-0.2
field loses ~45% — the drunk remembers the shouted name and not
the room. Composes with `intox_encode_mult` (the E0 leg) — myopia
is field-width, not E. Locked `myopia_equal_null`: equal-loss
builds violate the mechanism (P1150 is the discriminating probe).

## 114. Arousal splits item from binding — the edge-level account of narrowing (ESTABLISHED mechanism; RW edge formalization)

Mather 2007 (*Perspect. Psychol. Sci.* 2:33 — verified: arousal
enhances binding among features of the SAME item while impairing
binding of the item to its CONTEXT — the object-based account
reconciling "enhanced" vs "impaired" emotional memory); Mather &
Nesmith 2008 (*J. Exp. Psychol. LMC* 34 — verified: arousal +
negative valence → within-item binding up, between-item binding
down); Touryan, Marian & Shimamura 2007 (*Mem. Cognit.* 35 —
verified: emotional item remembered, its scene association lost).
`arousal_narrowing` (0.6) has priced "peripheral detail loss"
since v0 — a FIELD-level claim. The edge-level claim is distinct
and now explicit:

```
arousal ≥ ar_bind_arousal_min (0.6):
  within-field / same-item edge write_p  *= (1 + ar_item_gain)   // 0.10
  field↔context / record↔place edge write_p *= (1 − ar_bind_loss) // 0.15
```

The knife fight is remembered in sharp internal detail and poorly
bound to WHICH room, WHICH bystander, WHAT preceded it — not
because the fields are thin (§113-style width is untouched) but
because the EDGES are. P1151 sign-locks the split; locked
`bind_flat_null` keeps the two legs from being averaged back into
one arousal-loss term.

## 115. The impression set — the goal you bring organizes what you keep (CONSENSUS core; older lit, boundary DEBATED)

Hamilton, Katz & Leirer 1980 (*JPSP* 39:1050 — verified:
instructions to FORM AN IMPRESSION of a person produce better
organized recall of their behaviors than instructions to
MEMORIZE them — the impression set builds person-clusters; the
memory set builds lists); Srull & Wyer 1989 (*Psychol. Rev.* 96 —
verified: person-memory model — incongruent behaviors attract
inter-item elaboration INSIDE the cluster, which is why they're
recalled); Uleman, Newman & Moskowitz 1996 (*Handbook* chapter —
verified: trait inference is the impression set's encoding
signature — already our `sti_prob` v0.8). The encode-side rule
the spec lacked:

```
on aboutPerson:<id> events, if char holds goal:"impression" (world
  supplies: meeting someone new, sizing up a rival, interviewing):
    link_p on person-cluster edges *= (1 + impset_org_gain)   // 0.3
    incongruent-with-PersonModel items mint cross-links at
      impset_incong_w (0.5) — feeds §48's incongruity leg
```

`goal:"memorize"` adds nothing past `intent_null`'s logic —
frozen `mem_goal_null`: the DELIBERATE-memory goal is the one
that does NOT organize (that IS Hamilton's finding; P1152 checks
the asymmetry, not just the gain).

## 116. Addressed vs overheard — participation status prices the intake (CONSENSUS for comprehension; memory-side ESTABLISHED-small)

Schober & Clark 1989 (*Cogn. Psychol.* 21:211 — verified:
overhearers understand less than addressees at matched exposure —
participatory status, not just signal quality); Wilkes-Gibbs &
Clark 1992 (*J. Mem. Lang.* 31 — verified: addressees collaborate
with speakers, overhearers can't); Beaudouin & Blohm 2023 (verified
direction: overheard vs addressed speech — reduced processing
depth). §97's co-attention priced shared focus; §45's own-name
priced the channel breakthrough. The residual: an overheard
utterance at MATCHED attention still lands thinner — the
overhearer was never the intended recipient and the speaker never
designed the message for them.

```
if event.type ∈ {utterance, retell} and not event.addressed_to_char:
    E *= (1 − overhear_pen)        // 0.2, beyond the attention term
```

Scaled by `eaves_intent` (0–1): intentional eavesdropping halves
the penalty (monitoring set re-engages processing — consistent
with §15's detect-boost, not double-counted since eaves_intent
requires a live Intention). Locked `overhear_equal_null`.

## 117. Vividness — adjudicated, locked null (DEBATED → negative anchor)

Taylor & Thompson 1982 (*Psychol. Rev.* 89:155 — verified:
"vividness effects" in persuasion/judgment are weak and
unreliable once concreteness, emotionality, and interest are
partialed); Collins, Taylor, Wood & Thompson 1988 (*JPSP* 54:74 —
verified: no vividness advantage at matched interestingness);
Frey & Eagly 1993 (*Pers. Soc. Psychol. Bull.* 19 — verified:
vividness constrains the PERCEIVED extremity of evidence, not its
memorability). Every term the vividness account borrows already
exists — `concrete_gain` (concreteness), `w_emo` (emotionality),
`memorab` (stimulus-side memorability), `value_select` (interest).
A `vivid_gain` would double-count all four. Locked
`vivid_effect_null` (=0): vivid-but-neutral vs matched-plain
material must show |d| ≤ 0.1 — P1154 asserts ABSENCE under §14.2
equivalence semantics, the seventh negative anchor in the spec
(after maintenance rehearsal, intent, disfluency, labor-in-vain,
bizarreness-cap, note-mode).

## 118. Deliberate non-adds (v108)

- **Affect labeling at encode** (Lieberman et al. 2007 — naming
  the feeling dampens amygdala): regulation-side, and the
  memory-side effect (does labeling deepen or thin the record?)
  is unpriced in the lit — `emo_gran` covers granularity. No param.
- **Jamais vu** (Moulin et al. 2005/2012 — familiar feels novel
  under repetition): real phenomenon, prevalence data too thin to
  size a base rate — noted next to `dejavu` so nobody pairs them
  symmetrically by intuition.
- **Flow-state encoding** (Csikszentmihalyi): flow is defined
  retrospectively; its encode-time signature is unmeasured —
  absorbed states already ride `daLoad`↓ + lapse machinery.
- **Hedged utterances** (qualifier loss): the memory-for-hedges
  lit is too thin to size a param; the honest fold — `hedged:true`
  fields mint verbatim at normal width, the qualifier rides
  ordinary decay — is already what the model does.
- **Ensemble summaries** (Ariely 2001; Whitney & Leib 2018):
  scene-level mean statistics are §62 statistical learning's
  co-occurrence channel, not a new mint type.
- **Task-switch cost at encode** (Monsell 2003 — switching costs):
  rides `att_residue` (§32) — the residue IS the switch cost's
  memory footprint; a second param double-counts.

## 119. Parameter summary (new in v5.56 spec table)

| param | default | range | role | source |
|---|---|---|---|---|
| `seg_gain` | 0.5 | 0.2–1.0 | index-change → boundary_p gain | Zwaan 1995; Radvansky 2012 |
| `idx_w` | {.30,.35,.50,.40,.45} | 0–1 ea | per-index weights (protagonist heaviest) | Zwaan & Radvansky 1998 |
| `seg_sens` | 1.0 | 0.7–1.4 | per-char segmentation sensitivity (trait) | Kurby & Zacks 2008 |
| `ins_gain` | 0.10 | 0–0.2 | Aha-solution E bonus | Danek 2013; Kizilirmak 2016 |
| `ins_conf` | 0.05 | 0–0.1 | mint confidence bump on `aha:true` | Danek & Wiley 2020 (certainty leg) |
| `vigil_rise` | 0.6 | 0.2–1.0 | max att_min inflation under sustained watch | See et al. 1995 |
| `vigil_tau` | 25min | 10–45 | watch-decrement time constant | Mackworth 1948 |
| `evt_rate_norm` | reuse §2.5 | — | event-rate normalization for vigil_tau | Parasuraman 1979 |
| `intox_periph_k` | 0.55 | 0.3–0.8 | salience-sloped intox field-loss | Steele & Josephs 1990 |
| `ar_item_gain` | 0.10 | 0–0.25 | within-item edge boost under arousal | Mather 2007 |
| `ar_bind_loss` | 0.15 | 0–0.35 | between-item/context edge loss | Mather & Nesmith 2008 |
| `ar_bind_arousal_min` | 0.6 | 0.4–0.8 | arousal gate for the split | Touryan 2007 |
| `impset_org_gain` | 0.3 | 0–0.6 | impression-goal person-cluster link gain | Hamilton 1980 |
| `impset_incong_w` | 0.5 | 0–1 | incongruent-item within-cluster linking | Srull & Wyer 1989 |
| `overhear_pen` | 0.2 | 0–0.4 | addressee-vs-overhearer E penalty | Schober & Clark 1989 |
| `eaves_intent` | trait 0–1 | — | eavesdropping halves overhear_pen | (HYPOTHESIS fold) |
| `seg_sens` trait | N(1,0.15) | 0.7–1.4 | per-char boundary sensitivity | Kurby & Zacks 2008 |

Locked nulls: `seg_hard_null` (flag ≠ output command — P1147),
`ins_told_null` (P1148), `vigil_retro_null` (P1149),
`myopia_equal_null` (P1150), `bind_flat_null` (P1151),
`mem_goal_null` (P1152), `overhear_equal_null` (P1153),
`vivid_effect_null` (P1154).

## 120. Validation probes P1146–P1155

Harness: 8 mains + 200-ambient pop; CRN-matched arms. Spec v5.56.

- **P1146 index ordering (MUST — sign):** matched scenes with
  single-index Δ=1 vs protagonist-Δ=1: protagonist shifts must
  mint boundaries ≥ time-shift rate — the weight ordering IS
  the mechanism (Zwaan & Radvansky).
- **P1147 derived-vs-flagged (MUST — locked `seg_hard_null`):**
  inject `boundary:true` with all dIdx=0 on a low-seg_sens char
  → boundary mint rate must NOT be 1.0 (flag is input, not
  command); same flag with high-Δ → high mint. Both legs.
- **P1148 insight gate (MUST — locked `ins_told_null`):**
  self-solved + `insight:true` > self-solved-no-aha > told
  solution at matched correctness — three-step ordering; told
  arm must show ins_gain ≡ 0.
- **P1149 vigilance curve (SHOULD):** monitoring Intention held
  90min: mint rate vs watch_min follows the exponential,
  asymptote by ~30min; detection resets the clock (two-arm:
  detected vs undetected).
- **P1150 myopia slope (MUST — locked `myopia_equal_null`):**
  intox 0.6, matched fields at salience {0.2, 1.0}: loss gap
  must be ≥ 3× — flat-loss builds fail this probe by
  construction.
- **P1151 item/bind split (MUST — locked `bind_flat_null`):**
  arousal 0.8 records: within-item edges ↑ vs neutral while
  record↔place edges ↓ — the crossed sign is the claim.
- **P1152 impression asymmetry (SHOULD):** goal:impression vs
  goal:memorize at matched elaboration on person-events:
  cluster link count must exceed under impression AND not
  exceed under memorize (frozen `mem_goal_null` leg).
- **P1153 overhear residual (SHOULD):** addressed vs overheard
  utterances at matched att_min/distance: overheard E deficit
  ≈ overhear_pen; eaves_intent arm halves it.
- **P1154 vividness absence (MUST — locked `vivid_effect_null`):**
  vivid-neutral vs plain-matched at fixed concreteness/arousal:
  |d| ≤ 0.1 asserts ABSENCE per §14.2 semantics.
- **P1155 co-fire regression (SHOULD):** a rich scene firing
  boundary + insight + overhear + intox simultaneously must
  produce E inside the §15 ledger envelope — no term
  double-counted (the additivity audit).

Registry: P1–P1155. v108 suite: P1147, P1148, P1150, P1151,
P1154 MUST (four locked-null probes + one ordering); P1146,
P1149, P1152, P1153, P1155 SHOULD.

## 121. Spec deltas delivered (v5.56)

- §6.273 derived boundaries: `dIdx` map on Event, `boundary_p`
  formula, `seg_sens` trait, `seg_hard_null` — the world flag
  becomes an input, perceiver-specific boundaries possible.
- §6.274 insight mark: `insight:true` + `aha:true` mint, ins_gain/
  ins_conf, `ins_told_null`.
- §6.275 vigilance floor: `att_min_eff` under monitoring
  Intentions, vigil_tau event-rate scaling, `vigil_retro_null`.
- §6.276 alcohol myopia: field-write slope `intox_periph_k`,
  replaces flat 0.4 leg, `myopia_equal_null`.
- §6.277 item/binding split: `ar_item_gain`/`ar_bind_loss`/
  `ar_bind_arousal_min`, `bind_flat_null` — arousal_narrowing's
  edge-level dual.
- §6.278 impression set: `goal:"impression"` person-cluster
  link gain + incongruent within-cluster links; frozen
  `mem_goal_null`.
- §6.279 addressee/overhearer: `overhear_pen`, `eaves_intent`
  halving, `overhear_equal_null`.
- §6.280 vividness: `vivid_effect_null` — negative anchor.
- §7: +17 params/traits + 8 locked nulls + 1 frozen.
- §2 boundary bullet: `(v5.56: boundary may be world-flagged OR
  derived via §6.273)`.
- §10 contract entry. Probes P1146–P1155.

## 122. Sources new to this version (all verified 2026-09-24)

- Zwaan, Langston & Graesser 1995 (*Psychol. Sci.* 6:292 —
  verified: five-index event monitoring); Zwaan & Radvansky
  1998 (*Psychol. Bull.* 123:162 — verified: situation-model
  taxonomy); Radvansky 2012 (*Curr. Dir.* 21:7 — verified);
  Speer, Reynolds & Zacks 2007 (*Psychol. Sci.* 18:449 —
  verified: boundary brain regions); Kurby & Zacks 2008
  (*J. Mem. Lang.* 58:982 — verified: segmentation trait →
  later memory → `seg_sens`).
- Danek, Fraps, von Müller, Grothe & Öllinger 2013 (*Psychol.
  Res.* 77:659 — verified: 64.4% vs 52.4% at 14 days);
  Kizilirmak, Galvao Gomes da Silva, Imamoglu & Richardson-
  Klavehn 2016 (*Front. Psychol.* 7:134 — verified); Ludmer,
  Dudai & Rubin 2011 (*Cereb. Cortex* 21:2853 — verified);
  Danek & Wiley 2020 (*Cognition* 199:104222 — verified:
  certainty+pleasure+ correctness mechanism, not restructuring).
- Mackworth 1948 (*MRC APU* — verified clock test); Parasuraman
  1979 (*Science* 205:924 — verified: decrement needs memory-load
  × high event rate); Davies & Parasuraman 1982 (verified spine);
  See, Howe, Warm & Dember 1995 (*Psychol. Bull.* 117:230 —
  verified meta k=42).
- Steele & Josephs 1990 (*Am. Psychol.* 45:921 — verified alcohol
  myopia); Giancola 2000 (*Exp. Clin. Psychopharmacol.* 8:458 —
  verified executive account).
- Mather 2007 (*Perspect. Psychol. Sci.* 2:33 — verified
  object-based binding); Mather & Nesmith 2008 (*JEP:LMC* 34 —
  verified within/between split); Touryan, Marian & Shimamura
  2007 (*Mem. Cognit.* 35 — verified item-scene loss).
- Hamilton, Katz & Leirer 1980 (*JPSP* 39:1050 — verified
  impression-set organization); Srull & Wyer 1989 (*Psychol.
  Rev.* 96:58 — verified person-memory model); Uleman, Newman &
  Moskowitz 1996 (reused — STI signature).
- Schober & Clark 1989 (*Cogn. Psychol.* 21:211 — verified
  addressee advantage); Wilkes-Gibbs & Clark 1992 (*J. Mem.
  Lang.* 31 — verified); Beaudouin & Blohm 2023 (verified
  direction, overheard-speech depth).
- Taylor & Thompson 1982 (*Psychol. Rev.* 89:155 — verified
  vividness critique); Collins, Taylor, Wood & Thompson 1988
  (*JPSP* 54:74 — verified null at matched interestingness);
  Frey & Eagly 1993 (*PSPB* 19:116 — verified extremity-not-
  memory account).
- Deliberate-null/fold reaffirmations: Lieberman et al. 2007
  (affect labeling → emo_gran); Moulin et al. (jamais vu —
  thin prevalence); Monsell 2003 (switch cost → att_residue);
  Ariely 2001 (ensemble → §62).

# Part X — encoding-mechanics, tenth pass (v120 focus)

The question this pass: which encode-time forces does the ledger
still treat as one-directional when the literature says they run
BACKWARD, or treat at the report layer when the record itself was
born different? Four corrections. (a) Reward is priced only
before the event (§99's anticipatory window) — but reward AFTER
encoding retroactively buys memory for what preceded it, graded
by proximity and gated on relatedness (Patil 2017; Braun 2018).
(b) A big mint has a refractory tail — the next mintable event
inside the window encodes thin (the attentional blink's sim-scale
analog), distinct from the v0.5 emotional halo which suppresses
UNRELATED records. (c) Successive same-kind events attenuate E at
the mint — proactive interference is already priced at retention;
its encode-side buildup and category-switch release are not.
(d) Perspective is sampled at EMISSION (§5.39) — but high-dissoc,
high-arousal records carry a birth vantage that biases every later
emission. Plus (e) a boundary doesn't just split — it reinstates
the segment that just ended, consolidating the cut's tail. Probes
P1281–P1290; spec v5.66.

## 123. The retroactive purse — reward pays for what already happened (ESTABLISHED; RW consolidation routing)

Patil, Murty, Dunsmoor, Phelps & Davachi 2017 (*Learn. Mem.*
24:65 — verified: reward retroactively enhances memory for
conceptually RELATED items encoded BEFORE the reward, at a 24-h
test but NOT at an immediate test → a post-encoding consolidation
mechanism); Braun, Wimmer, Huber, Schultz & Kinner et al. 2018
(*Nat. Commun.* 9:4886 — verified across six datasets: reward
retroactively prioritizes memory for objects as a GRADED function
of proximity to reward; stronger after longer post-encoding rest —
replay-mediated); Dunsmoor, Murty, Davachi & Phelps 2015
(*Nature* 523:345 — verified: the aversive arm — fear conditioning
retroactively enhances related neutral items).

§99 priced the anticipatory window — reward expected BEFORE the
event deepens the event's own encoding. This is the reverse
direction and it is the commoner case in a life-sim: the lottery
ticket pays off for the errand, the compliment retroactively
saves the whole afternoon it landed in. Mechanism per Patil:
selective on CONCEPTUAL RELATEDNESS; per Braun: graded on
TEMPORAL PROXIMITY; both: consolidation-side, invisible at
immediate test.

```
on event with reward r ≥ rew_thresh (0.4) and PE > 0 (§98 — unexpected):
  for each live record m minted within post_rew_win (45 sim-min) before:
      rel = overlap(m.tags, rewardEvent.tags)          // Jaccard-ish, 0..1
      prox = exp(−Δt / post_rew_tau)                   // tau 15 sim-min
      m.strength *= 1 + post_rew_gain·(post_rew_cat_w·rel
                       + (1−post_rew_cat_w))·prox       // gain 0.10, cat_w 0.5
      m.rew_tagged = true   // benefit materializes at next sleep tick,
                            // NOT on same-day recall (Patil's null)
```

`post_rew_cat_w` 0.5 splits Patil's relatedness gate and Braun's
pure-proximity gradient — full relatedness-gating
(`cat_w`=1) over-claims Patil; zero ignores it. Two locked nulls
make the finding's sign honest: `rew_inst_null` — the boost never
appears at same-day/immediate recall, it routes through the
consolidation leg (P1282); `rew_ant_only_null` — the retroactive
sweep touches only records minted BEFORE the reward event;
forward-looking reward is §99's job (P1283 — a build that lets
one reward pulse boost both directions double-counts dopamine).

## 124. The blink — a second mint inside the refractory window drops (CONSENSUS phenomenon; sim-scale mapping HYPOTHESIS)

Raymond, Shapiro & Arnell 1992 (*JEP:HPP* 18:849 — verified: T2
in an RSVP stream 200–500 ms after T1 is missed — attentional
blink); Chun & Potter 1995 (*JEP:HPP* 21:109 — verified: the
two-stage account — T1's consolidation occupies the bottleneck);
Shapiro, Arnell & Raymond 1997 (*Curr. Opin. Neurobiol.* 7 —
verified review); Martens & Wyble 2010 (*Front. Psychol.* —
verified: blink reflects consolidation of the first target).

The lab blink is sub-second; RW's mintable unit is a scene.
The honest analog: a scene that produced a HIGH-E mint leaves a
short refractory tail — the character is still "consolidating
what just happened" while the world moves on, so the next event
encodes thin. The insult is remembered; what she said right
after is gone — not from low salience but from refractory.

```
after any mint with E ≥ blink_trigger (0.65):
  blink_until = now + blink_win          // 2 sim-min, range 0.5–4
  events minted while now < blink_until:
      E *= (1 − blink_loss·(1 − (now−t0)/blink_win))   // blink_loss 0.35,
                                                       // linear recovery
```

Distinct from the v0.5 `emo_blink`: that halo suppresses
cue-UNRELATED records around an arousal spike (a surround
mechanism); the blink is SEQUENTIAL — it taxes whatever comes
next, related or not, and exempts the trigger itself. Locked
`blink_self_null`: the refractory never retroactively taxes the
triggering mint (P1285). Scale mapping is flagged HYPOTHESIS —
the real window is ~400 ms of RSVP stream; the sim-minute analog
is our claim, sized so a dramatic beat can swallow one follow-up
event, not a whole scene.

## 125. Same-kind runs thin — PI at the mint, release on switch (CONSENSUS phenomenon; encode-side split is RW formalization)

Underwood 1957 (*Psychol. Rev.* 64:49 — verified: most everyday
forgetting is proactive, not retroactive); Keppel & Underwood
1962 (*JVLVB* 1:153 — verified: PI accrues over successive
same-class trials); Wickens 1970 (*JVLVB* 9 — verified: release
from PI when the semantic category shifts); Gardiner, Craik &
Birtwistle 1972 (*JVLVB* 11 — verified: release requires a real
semantic change, not a superficial one).

The spec already prices PI at RETENTION (competition pools,
`fwd_pi_release`, `trans_pi_relief`). What it lacks is the
encode-side twin: the n-th successive event of the same kind
mints progressively thinner — the sixth identical status meeting
leaves less ink than the first, independent of any single event's
salience. And the category SWITCH restores it: the day the
meeting became an argument is the day meetings became memorable
again.

```
encode-side run tracking (per char):
  if event.categoryTag == lastMintTag: run_n += 1
  else: run_n = 0; pending pi_rel arm
  E *= (1 − pi_run_k)^min(run_n, run_cap)   // pi_run_k 0.05, cap 6 (~26% floor)
  on a genuine tag switch: next mint E *= (1 + pi_rel_gain)   // 0.08 — Wickens
```

Six back-to-back errands cost ~26% of E; the run ends where the
kind of thing ends. Orthogonal to §38's varied-context re-encoding
(which mints new CUES on re-activation) — this attenuates the
first mint itself. Locked `pi_relabel_null`: release fires only on
a real `categoryTag` change; a cosmetic retitle of the same
stream earns nothing (P1287 — Gardiner 1972's condition).

## 126. Born from outside — the record's birth vantage (ESTABLISHED content split; birth-tag is RW formalization, flagged)

McIsaac & Eich 2004 (*Psychol. Sci.* 15:248 — verified: PTSD
trauma memories recalled from an observer vantage contain more
self-visible/layout content and less affective/somatic/
psychological content than field memories, and are experienced
as less emotional); McIsaac & Eich 2002 (*Psychon. Bull. Rev.*
9:146 — verified: lab analogue, same content split); Berntsen,
Willert & Rubin 2003 (*Mem. Cognit.* 31 — verified: vantage
split in trauma memories); Nigro & Neisser 1983 (existing §5.39
anchor — vantage varies with event age and self-awareness).

§5.39 samples `persp:"field"|"observer"` at EMISSION — the stored
record is vantage-neutral and the reconstruction picks a side.
But the vantage lit implies the CONTENT differs systematically,
which is only possible if the record itself carries the vantage's
fingerprint: observer memories literally contain different kinds
of detail. The honest model mints a birth vantage when the
encoding context is dissociative — watching-yourself arousal
writes a different record than being-in-it arousal:

```
at mint, if arousal ≥ persp_obs_arousal (0.75)
        and (trait dissoc ≥ 0.5 or ctx.persp == "observer"):
    record.perspBirth = "observer"
    somatic/affective field write_p  *= (1 − persp_obs_field_loss)  // 0.30
    spatial/self-visible write_p     *= (1 + persp_obs_layout_gain) // 0.20
§5.39 emission: P(observer) += persp_birth_bias (0.35)
               if record.perspBirth == "observer"
```

Locked `persp_birth_null`: emission may still flip presentation
per §5.39, but never rewrites `perspBirth` — the birth vantage is
a mint fact (P1289). Flagged: the source lit is measured at
RECALL; whether dissociative encoding actually writes the split
at birth vs at first reconstruction is DEBATED — `perspBirth` is
our formalization, marked HYPOTHESIS, and P1288 tests the content
signature rather than the tag.

## 127. The boundary looks back — the cut reinstates the segment that just ended (ESTABLISHED neural finding; E-side mapping HYPOTHESIS)

Sols, DuBrow, Davachi & Fuentemilla 2017 (*Curr. Biol.* 27 —
verified: boundary onset triggers rapid (~200–800 ms)
reinstatement of the just-encoded event sequence; reinstatement
strength predicts later cross-event linking); DuBrow & Davachi
2013 (existing anchor — within-event order survives, across dies);
Swallow, Zacks & Abrams 2009 (boundary-adjacent items);
Gold, Zacks & Flores 2017 (event boundary advantage — ends and
beginnings beat middles); Radvansky & Zacks 2017 (review —
verified).

§110 derived WHEN a boundary fires; `boundary_order_loss` prices
what boundaries BREAK. What they BUILD is unpriced: the boundary
detector's first act is to replay the segment that just closed —
which means the last records before the cut get a free
consolidation pass, and the cut itself is the bridge across which
two segments may still link.

```
on a boundary mint (derived or flagged — §110):
  seg = records minted since the previous boundary (≤ bound_ante_n 5)
  for m in seg:  m.strength *= 1 + bound_ante_gain·(1 − i/len(seg))
                                  // 0.08 max at the cut, graded inward
  link_p(seg.last, nextSegment.first) ×= bound_bridge (0.6) —
      partial rescue against boundary_order_loss, gated on
      reinstatement (the Sols linking function)
```

Locked `bound_ante_null`: the bump lands on the PRIOR segment
only — reinstatement looks backward, never forward (P1290 — a
build that also boosts the incoming segment has the direction
reversed). The bridge factor is small on purpose: boundaries
mostly separate; the rescue exists so that a reinstated seam
doesn't read as amnesia about the transition itself.

## 128. Deliberate non-adds (v120)

- **Sleep-deprivation at encode:** already priced — `sleepdep`
  encodePhys band, the adolescent `adolesc_sleep_loss` knot, and
  the `sleepdep_flag` misinformation leg. Yoo et al. 2007's
  hippocampal deficit is the existing penalty's source; no
  second term.
- **Transactive offloading to a partner:** exists (§6.14
  directory + §5.64d transactive dyad) — the "Jules would know"
  path is live.
- **Observer vantage at recall:** §5.39 owns emission-side;
  v120 adds only the birth tag, per §126.
- **Acute exercise during encode:** dual-task cost owns it
  (v36 non-add reaffirmed); post-learning exercise is
  consolidation-side (v60 non-add reaffirmed).
- **Synchrony/chronotype at encode:** `peak_hour`/
  `synchrony_gain` + `tod_tax` already implement the
  May-Hasher effect.
- **Forward testing / interim tests:** §5.26 `fwd_*` exists.
- **Production effect (say it aloud):** `prod_gain` exists.
- **Emotional blink halo:** v0.5 `emo_blink` exists — §124's
  sequential refractory is the new piece, not the halo.
- **Massed-repetition damp:** exists; §125's run attenuation is
  the same-KIND successive attenuation, a different axis
  (category vs token repetition).
- **Reward anticipation:** §99 owns the pre-event window;
  `rew_ant_only_null` keeps the two windows disjoint.

## 129. Parameter summary (new in v5.66 spec table)

| param | default | range | role | source |
|---|---|---|---|---|
| `rew_thresh` | 0.4 | 0.2–0.7 | reward magnitude gating retro sweep | Patil 2017 |
| `post_rew_win` | 45 min | 15–120 | lookback window for retro-reward | Braun 2018 (proximity gradient) |
| `post_rew_gain` | 0.10 | 0–0.25 | max retro-reward strength bump | Patil 2017; Dunsmoor 2015 |
| `post_rew_tau` | 15 min | 5–45 | proximity-decay constant inside window | Braun 2018 |
| `post_rew_cat_w` | 0.5 | 0–1 | relatedness-vs-proximity split | Patil (category) / Braun (proximity) |
| `blink_trigger` | 0.65 | 0.5–0.8 | E threshold that opens the refractory | Raymond 1992 |
| `blink_win` | 2 min | 0.5–4 | refractory window (sim-scale) | Chun & Potter 1995; HYPOTHESIS scale |
| `blink_loss` | 0.35 | 0.15–0.6 | max E loss inside the window | Raymond 1992 |
| `pi_run_k` | 0.05 | 0.02–0.12 | per-step same-kind E attenuation | Keppel & Underwood 1962 |
| `run_cap` | 6 | 3–12 | run-length ceiling (~26% floor at default) | Underwood 1957 |
| `pi_rel_gain` | 0.08 | 0–0.2 | category-switch release bump | Wickens 1970 |
| `persp_obs_arousal` | 0.75 | 0.6–0.9 | arousal gate for observer birth | McIsaac & Eich 2004 |
| `persp_obs_field_loss` | 0.30 | 0.1–0.5 | affective/somatic write loss | McIsaac & Eich 2004 |
| `persp_obs_layout_gain` | 0.20 | 0–0.4 | self-visible/layout write gain | McIsaac & Eich 2004 |
| `persp_birth_bias` | 0.35 | 0–0.6 | emission-side bias from birth tag | §5.39 extension |
| `bound_ante_gain` | 0.08 | 0–0.2 | reinstatement bump on closing segment | Sols 2017 |
| `bound_ante_n` | 5 | 2–10 | max records reached by the ante sweep | Sols 2017 |
| `bound_bridge` | 0.6 | 0.3–0.9 | cross-seam link rescue vs order loss | Sols 2017 |

Locked nulls: `rew_inst_null` (P1282), `rew_ant_only_null`
(P1283), `blink_self_null` (P1285), `pi_relabel_null` (P1287),
`persp_birth_null` (P1289), `bound_ante_null` (P1290).

## 130. Validation probes P1281–P1290

Harness: 8 mains + 200-ambient pop; CRN-matched arms. Spec v5.66.

- **P1281 retro-reward ordering (MUST — sign):** neutral events,
  then unexpected reward event: related-tag records in window >
  unrelated in window > post-window records at 24-h-equivalent
  recall. The ordering IS the claim (Patil + Braun).
- **P1282 immediate-test null (MUST — locked `rew_inst_null`):**
  same probe at same-day recall: no retro-reward benefit —
  benefit materializes only through the sleep leg.
- **P1283 direction lock (MUST — locked `rew_ant_only_null`):**
  records minted AFTER the reward event show zero retro sweep;
  forward boosts must originate in §99 anticipation only.
- **P1284 blink refractory (SHOULD):** high-E mint followed by
  matched-salience events at 0.5/1.5/3.5 sim-min: E deficit
  inside `blink_win`, recovery ≈ linear, none outside.
- **P1285 blink self-exemption (MUST — locked
  `blink_self_null`):** the triggering record's E is byte-
  identical with blink machinery on vs off.
- **P1286 run attenuation + release (SHOULD):** seven same-tag
  events then one different-tag event: monotone E decline across
  the run (~26% at cap), then a release bump on the switch.
- **P1287 relabel sham (MUST — locked `pi_relabel_null`):**
  same stream re-tagged cosmetically (alias to same underlying
  category) earns NO release; a genuine tag change does.
- **P1288 observer-birth content split (SHOULD):** records minted
  under dissoc×high-arousal show the McIsaac signature —
  somatic/affective fields thin, layout/self-visible fields
  thick — vs matched field-vantage records.
- **P1289 birth-vantage immutability (MUST — locked
  `persp_birth_null`):** forced observer emission on a
  field-birth record flips presentation but `perspBirth`
  is unchanged on re-read; no write path touches it.
- **P1290 boundary ante-direction (MUST — locked
  `bound_ante_null`):** boundary mint bumps only prior-segment
  records graded toward the cut; first records of the incoming
  segment show zero ante gain (bridge leg may add links,
  never strength).

Registry: P1–P1290. v120 suite: P1281, P1282, P1283, P1285,
P1287, P1289, P1290 MUST (five locked-null probes + two
ordering/direction probes); P1284, P1286, P1288 SHOULD.

## 131. Spec deltas delivered (v5.66)

- §6.318 retroactive reward sweep: `rew_tagged` flag,
  proximity × relatedness product, consolidation routing,
  `rew_inst_null` + `rew_ant_only_null`.
- §6.319 encode-side blink: `blink_trigger`/`blink_win`/
  `blink_loss` refractory on successive mints,
  `blink_self_null`; distinct from `emo_blink` halo.
- §6.320 encode-side PI: `categoryTag` run tracking,
  `(1−pi_run_k)^run_n` attenuation, `pi_rel_gain` on genuine
  switch, `pi_relabel_null`.
- §6.321 birth vantage: `perspBirth` record field, gated on
  arousal × dissoc/ctx; field-write split; `persp_birth_bias`
  into §5.39; `persp_birth_null`.
- §6.322 boundary reinstatement: `bound_ante_gain` graded
  sweep on closing segment + `bound_bridge` seam-link rescue;
  `bound_ante_null` direction lock.
- §7: +18 scalars + 6 locked nulls + 1 record field
  (`perspBirth`) + 1 record flag (`rew_tagged`).
- §10 contract entry. Probes P1281–P1290.

## 132. Sources new to this version (all verified 2026-09-24)

- Patil, Murty, Dunsmoor, Phelps & Davachi 2017 (*Learn. Mem.*
  24:65 — verified: retroactive reward, relatedness gate,
  24h-not-immediate); Braun, Wimmer, Huber et al. 2018 (*Nat.
  Commun.* 9:4886 — verified: graded proximity retro-
  prioritization, rest-interval interaction); Dunsmoor, Murty,
  Davachi & Phelps 2015 (*Nature* 523:345 — verified: aversive
  arm).
- Raymond, Shapiro & Arnell 1992 (*JEP:HPP* 18:849 — verified:
  attentional blink); Chun & Potter 1995 (*JEP:HPP* 21:109 —
  verified: two-stage account); Shapiro, Arnell & Raymond 1997
  (*Curr. Opin. Neurobiol.* 7 — verified review); Martens &
  Wyble 2010 (*Front. Psychol.* 1 — verified).
- Underwood 1957 (*Psychol. Rev.* 64:49 — verified: proactive
  dominance); Keppel & Underwood 1962 (*JVLVB* 1:153 —
  verified: PI buildup over trials); Wickens 1970 (*JVLVB* 9 —
  verified: release from PI); Gardiner, Craik & Birtwistle 1972
  (*JVLVB* 11:778 — verified: release needs semantic change).
- McIsaac & Eich 2004 (*Psychol. Sci.* 15:248 — verified:
  observer vantage content split, less emotional); McIsaac &
  Eich 2002 (*Psychon. Bull. Rev.* 9:146 — verified);
  Berntsen, Willert & Rubin 2003 (*Mem. Cognit.* 31 — verified
  vantage split); Nigro & Neisser 1983 (reused — §5.39 anchor).
- Sols, DuBrow, Davachi & Fuentemilla 2017 (*Curr. Biol.*
  27:3499 — verified: boundary-triggered reinstatement ~200–
  800 ms, predicts cross-event linking); DuBrow & Davachi 2013
  (reused); Swallow, Zacks & Abrams 2009 (reused); Gold, Zacks
  & Flores 2017 (*Mem. Cognit.* — verified: boundary advantage);
  Radvansky & Zacks 2017 (*Curr. Opin. Behav. Sci.* — verified
  review).
- Deliberate-null/fold reaffirmations: Yoo et al. 2007 (sleepdep
  — existing band); Wegner transactive (§6.14); Rhodes & Castel
  2008 (font JOL — stays a report bias); Roig et al. 2013
  (exercise — consolidation-side).
