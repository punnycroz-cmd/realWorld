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
