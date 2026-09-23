# Social Memory v8 — remembering people, being shaped by talk

**Track:** memory-research (sf/memory) · **Focus of v8** · **Feeds:** spec v0.8,
`character-memory-profiles.md` v0.8 note
**Prior layers:** spec v0.7 has rumor mechanics (§6.3/§6.5) but treats social
actors as content-free pipes — `sourceCredibility` is a scalar handed in from
outside, speakers and listeners don't have *person* representations, and a
conversation affects memory only through misinformation merge. This doc adds
the missing layer: memory *for people* (person models, face→identity→name
cascade) and memory *shaped by talk* (audience tuning, socially shared
retrieval-induced forgetting, serial reproduction, collaborative inhibition).

Citations are author/year; full context in `human-memory-research.md` (R§n) and
the primary docs for each layer. Tiers used below: **[CONSENSUS]** textbook/
meta-analytic; **[ROBUST]** replicated but with moderator dependence;
**[DEBATED]** contested mechanism or magnitude; **[HYPOTHESIS]** our modeling
choice for RW.

---

## 0. What the v0–v7 model already does (and where it was thin)

Already present: `source.kind`/`source.who` tags with fast decay (§1, §6.4);
`misinfo_suscept·sourceCredibility` adoption (§6.3); bidirectional co-witness
convergence (§6.5); part-list suppression of unspoken fields (§5.8); gist→
trait abstraction ("Mara is stingy", §6.4); name-field TOT blanking (§5.5);
`hearCount` fluency (§6.3).

Thin: (a) no persistent representation of *a person* — traits, credibility,
and "who knows what" float free on individual records; (b) retelling is
neutral — a character who spins a story for an audience doesn't get their own
memory bent by the spin (the single best-documented social-memory effect);
(c) the listener's memory is only ever *added to* — never *suppressed* by
what the speaker left out; (d) rumors transmit content verbatim-ish, no
chain-level convergence to stereotype; (e) face recognition is a single
copy-cue roll with no familiarity/identity/name structure — so characters
can't do the deeply human "I know you… from somewhere… no idea where."

---

## 1. Person models — a per-character social store **[CONSENSUS core]**

Person memory is organized around person nodes, not episode lists
(Hastie & Kumar 1979; Srull & Wyer 1989 review — trait-impression research
assumes an associative person model where behaviors hang off a person node).
We add one per-character `PersonModel` record per known individual:

```json
PersonModel = {
  "personId": "mara",
  "familiarity": 0.8,      // "have I met them" — decays at beta_semantic·0.5
  "identityStrength": 0.6, // face→identity binding; decays at beta_source
  "nameStrength": 0.4,     // weakest tier — last learned, first lost
  "traits": {"stingy": 0.6, "punctual": 0.3},
  "knowsTopics": ["rent law", "violin"],   // transactive directory (§8)
  "credibility": 0.55,     // learned; feeds §6.3 sourceCredibility
  "cheaterLoad": 0.7,      // accumulated morality-diagnostic weight (§5)
  "lastSeenDay": 430
}
```

- **Familiarity** is recognition-level ("I've seen that face") — survives
  context loss; decays slowest. **Identity** is the binding to biographical
  semantics ("the landlord's friend, does the books at Mudhaus") — the
  associative link, so it decays at the *source* rate `beta_source` and is
  the tier the associative-deficit age effect (§2 `link_p`) hits.
  **Name** is the weakest, latest-acquired tier — proper names are harder
  than all other person information (Bruce & Young 1986 cascade;
  Cohen 1990's Baker-vs-baker asymmetry — same word, recalled as a job not
  a name; McWeeny et al. 1987; Burke et al. 1991 TOT is disproportionately
  proper-name TOT).
- **Retrieval cascade (new §5.10):** a face/person copy cue resolves in
  strict order — familiarity → identity → name — each tier gated by its own
  strength roll. A failed tier2 with passing tier1 yields the
  `familiar_only` state ("I know you from somewhere"), which is NOT a TOT —
  it's the normal resting state for acquaintances (Muter 1978; Tulving &
  Thomson 1973 recognition-without-context).
- **Own-age bias:** `familiarity` encodes at `×(1−oab_loss)` for faces
  outside the character's own age class (±~15y band). Meta: Rhodes &
  Anastasi 2012 — hits g=0.23, false alarms g=−0.23, discriminability
  g=0.37 for same-age faces; present in children AND older adults, so the
  penalty applies symmetrically, not an age-decline param. Same-form
  param `owngroup_loss` reserved for other social categories
  (Meissner & Brigham 2001 other-race effect ~1.4× misidentification odds)
  — use only if world-builder gives characters marked social groups;
  do not invent categories.
- **Stranger ceiling unchanged:** `face_ceiling` (§2) still caps one-shot
  appearance verbatim; the PersonModel is what accrues across encounters —
  second+ meetings bypass the ceiling via `familiarity += gain`.

## 2. Encoding social events — three modulators **[ROBUST]**

### 2.1 Spontaneous trait inference (STI)

Observing someone's behavior writes to `PersonModel.traits` even when the
character wasn't forming an impression — inference is unintentional and
binds to the *actor*, not the episode (Winter & Uleman 1984; Uleman et al.
2008 meta — unintentional trait inference at encoding; Todorov & Uleman
2002/2003 — inferred traits attach to the person even when the behavior was
only read about). Implement: on encoding any event where `agent != self`
and the behavior carries a trait implication, with prob `sti_prob` (~0.6)
add `delta = sti_gain·implication·diag_weight` to `PersonModel.traits[trait]`.

### 2.2 Diagnosticity weighting — morality >> ability, negative >> positive

Not all behaviors update traits equally (Skowronski & Carlston 1987;
reviewed 1989): weight by *perceived diagnosticity* —
`diag_moral_neg` ≈ 1.6 (dishonesty diagnostic of immorality; honesty weakly
diagnostic — everyone behaves honestly), `diag_ability_pos` ≈ 1.3 (ability
domain reverses: brilliant performance is diagnostic, mediocre isn't),
neutral baseline 1.0. Extreme behaviors weigh ~2× moderate ones
(extremity = diagnosticity). Net emergent properties, all documented:
a single betrayal outweighs months of reliability; impressions are
asymmetric (immoral impressions resist counterevidence, Reeder & Coovert
1986); "bad is stronger than good" (Baumeister et al. 2001 review).

### 2.3 Incongruity advantage

Behaviors inconsistent with the established person model are encoded
*better* than consistent ones — deeper processing against the expectancy
(Hastie & Kumar 1979; Srull & Wyer 1989 review). Implement:
`E += incongruity_gain·|impliedTrait − personModel.traits[trait]|`
(incongruity_gain ≈ 0.25, only when |Δ| > 0.4 — surprises stick).
NOTE the tension with §4 serial reproduction: incongruity wins at
*encoding* (position 1), stereotype-consistency wins at *transmission*
(position 3+). Kashima 2000 shows exactly this crossover — both effects
are real, at different stages. Keep them uncoupled.

### 2.4 Next-in-line encoding hole

While a character is preparing their own turn in group talk, attention to
the current speaker drops — you don't remember what was said just before
you spoke (Bond 1985; replicated; mechanism = self-rehearsal, not anxiety).
Implement: in a group-conversation event, if the character's next turn is
imminent (dialogue layer flag `preparing:true`), incoming utterances get
`attention ×= (1 − next_in_line)` (≈0.4). Cheap, produces the universal
"wait, what did you say?" gap.

## 3. Cheater source memory **[ROBUST, mechanism DEBATED]**

Buchner, Bell, Mehl & Musch 2009 (4 experiments, η²≈.14): NO advantage in
old-new face recognition for cheaters, but consistently BETTER source
memory — remembering that *this* face was the cheating context. Follow-ups:
advantage persists at 1 week; robust across status; some evidence for older
adults preserved (Bell & Buchner 2012). The original "cheater-detection
module" framing (Mealey et al. 1996; Cosmides & Tooby) is contested — the
memory result replicates without the modularity claim; treat as
threat-relevance tagging, not a dedicated module [DEBATED mechanism].

Implement: records whose `verbatim.who` person's `cheaterLoad` > 0.5 get
`beta_source ×= cheat_source_mult` (0.6) — the *association* between person
and bad act outlives equivalent neutral associations, with zero effect on
face recognition itself. Emergent: characters forget who told them gossip
but not who wronged someone. Also apply to `PersonModel.cheaterLoad` decay:
very slow (×0.3 of `cond_decay` schedule) — moral reputation is sticky.

## 4. Serial reproduction — rumor chains converge **[CONSENSUS direction]**

Bartlett 1932 ("War of the Ghosts") established chain transmission;
Allport & Postman 1947 named the operators: **leveling** (details drop),
**sharpening** (a few surviving details dominate), **assimilation**
(content bends toward the teller's schema/stereotype). Modern quantification:
- Kashima 2000 (5-person chains): early positions reproduce stereotype-
  INCONSISTENT items more (the §2.3 incongruity advantage); by position
  ~4, stereotype-CONSISTENT items dominate — chains converge to shared
  schema regardless of starting content.
- Lyons & Kashima 2003 (4-person chains): convergence is stronger when
  communicators believe the audience shares the stereotype (sharedness
  manipulations) — transmission is audience-tuned even in chains (§6).

Implement on retransmission (a `told_by` record being retold — the
`retell`/`hearAccount` chain), tracking `chainPos` (= 1 + speaker's own
hearCount for this content, or an explicit hop field):
```
per verbatim field at retell:
  P(survive hop) = (1 − level_frac) · (schemaConsistent ? 1 : si_dropoff
                   · exp(−chainPos/chain_sc_thresh))
  level_frac ≈ 0.3; si_dropoff ≈ 0.75; chain_sc_thresh ≈ 4
gist: pulled assimilation_gain (≈0.05) toward speaker's schema per hop
```
Emergent: hop-1 rumors carry odd specifics ("he said *trebuchet*"); hop-4
rumors are short, generic, stereotype-consistent — the dead-aunt-becomes-
dead-baby drift of real gossip. Mesoudi, Whiten & Dunbar 2006: social/
gossip content transmits better than matched non-social control material —
encode rumor content about *persons* with a small transmission bonus
(`social_transmit_gain` ≈ 1.15 on survival).

## 5. Talking changes your own memory — audience tuning **[ROBUST]**

Higgins & Rholes 1978 "saying is believing": describing a target to an
audience known to like/dislike them biases the message AND the
communicator's own later recall in the message direction. Mechanism
calibration (Echterhoff, Higgins & Groll 2005; Echterhoff, Higgins &
Levine 2009 review): the memory bias follows **shared reality**, not mere
compliance — it appears only when the communicator trusts the audience's
judgment / the audience is in-group; absent or reversed for distrusted or
out-group audiences. 2025 meta (Figueroa-Grenett et al., 27 studies,
55/59 effect sizes): robust message-tuning and memory-bias effects,
diminished under out-group audience or identity-threatening topic.

Implement in `retell(charId, audienceId, record)`:
```
trust = PersonModel[audience].credibility · ingroup_factor
if trust > shared_reality_gate (0.5):
    drift = audience_tune (≈0.06) · sign(audienceStance − m.valence)
    m.emotional.valence += drift
    schema-consistent-with-audience verbatim fields get survival boost
    on the next §6.1 drift roll (+0.5·audience_tune)
else: no tuning (compliance is performance, not memory)
```
Cumulative across retellings — the gossip who always tells the scandal
version literally remembers the scandal version. This is the strongest
single lever for "characters' memories diverge because of who they talk
to," and it costs one valence write per retelling.

## 6. What the speaker omits, the listener loses — SS-RIF **[ROBUST]**

Cuc, Koppel & Hirst 2007 ("Silence Is Not Golden", 3 experiments incl.
free conversation): a speaker's selective retrieval induces
retrieval-induced forgetting of *unmentioned but related* material in
**listeners** who covertly co-retrieve — not just in the speaker.
Extended to autobiographical memories (Stone, Barnier, Sutton & Hirst
2010/2013). Mechanism: the listener covertly retrieves along with the
speaker, so §5.8 RIF machinery applies to them too.

Implement: extend `discussEvent` — the listener's records in the same
cue bucket that were NOT surfaced get `strength *= (1 − ss_rif_k)`
(ss_rif_k ≈ 0.04, slightly weaker than the speaker-side `rif_k` 0.05,
since listener covert retrieval is partial — Barber et al. boundary:
requires the listener to actually attend/co-retrieve, so scale by
listener `attention`). Emergent: a character who always tells the funny
version of the party makes her friends progressively unable to recall
the fight that happened at it — shared silences are real.

## 7. Collaborative remembering — groups recall less, members gain **[CONSENSUS]**

Marion & Thorley 2016 meta (64 studies, 75 effect sizes): collaborative
groups recall less than the pooled recall of the same number of people
working alone (collaborative inhibition; retrieval-strategy disruption,
Basden et al. 1997). Moderators: inhibition *worse* in larger groups, for
uncategorized content, under free-flowing order, and among **strangers**
(friends/couples inhibit less — shared retrieval strategies, consistent
with transactive memory §8). Separate benefit (27 effect sizes):
post-collaborative *individual* recall improves — errors get corrected,
re-exposure acts as spaced retrieval.

Implement (cheap group-call wrapper, `groupRecall(members, C)`):
```
nominal = union of solo-recall outputs
collab output ≈ nominal · collab_factor
collab_factor = collab_base (0.65) · (1 − collab_size_pen·(n−2))
              · (acquainted ? collab_friend_mult (1.2) : 1)
then per member: recalled items get retell_boost (postcollab gain);
                 ss_rif_k applies to members' unspoken related records
```
Only needed when the game wants an explicit "group reconstructs the
event" moment (debrief scene, landlord dispute). Individual tick recall
is unchanged.

## 8. Transactive memory — knowing who knows **[CONSENSUS existence]**

Wegner 1987; Wegner, Erber & Raymond 1991 (dating couples: intimate pairs
recruit each other's expertise better than assigned pairs); Hollingshead
1998 — long-running couples divide memory labor; each holds a directory
of the other's expertise rather than the knowledge itself. This is the
substrate of a neighborhood: characters should carry `knowsTopics` on
PersonModel — "ask Mara about rent law" is itself a memory, and the
directory is what rumor routing (§6.3) should consult when picking who a
character would plausibly tell.

Implement: when a character successfully obtains information from person
X on topic T (or observes X demonstrating T-expertise), add/strengthen T
in `PersonModel[X].knowsTopics`. Retrieval mode `"directory"`: given
topic cue, return ranked candidates ∝ directory strength — enables the
dialogue/behavior layer to produce "I don't know, but Jules would."
Directory entries decay slowly (semantic rate); wrong referrals (X
didn't know) decrement. Credibility learning (below) shares the update.

## 9. Learned credibility — sourceCredibility becomes a memory **[HYPOTHESIS — direct evidence thin]**

v0.6 takes `sourceCredibility` as an input scalar. Real people *learn*
who's reliable (children do it by age 4 — Koenig & Harris 2005 selective
trust literature; reliability history, not age/status per se). Implement:
`PersonModel[X].credibility` (init ~0.5, per-character prior modulated by
`distrust` trait) updates when X's `told_by` content later meets witnessed
contradiction or corroboration: `±cred_step` (0.08) per verification
outcome, clamp [0.1, 0.95]. This then *is* the `sourceCredibility` factor
in §6.3 — closing the loop: a character who keeps repeating rumors that
turn out false becomes discounted **by the listener's own memory**, with
no omniscient reputation score required. Status/power may bias the prior
(Carol et al. 2013 — relative power enters conformity), never the update.

## 10. Self-referent feedback — mnemic neglect **[ROBUST effect, DEBATED mechanism]**

Mnemic neglect model (Sedikides, Green & Pinter 2004; Green, Pinter &
Sedikides 2005; review Sedikides & Green 2016): people recall
self-threatening feedback (negative + about central self-conceptions)
*poorly* vs. self-affirming or other-referent feedback — shallow encoding
+ retrieval suppression serving self-protection. Critical boundary:
effect appears in **recall, not recognition** — the memory is suppressed,
not erased; confrontation with the feedback still registers (Green,
Sedikides & Gregg 2008, "forgotten but not gone"). Moderators: waived for
feedback from close others and under self-improvement framing; absent for
modifiable traits (Green, Pinter & Sedikides 2005); *enhanced* in
repressors; attenuated/reversed in dysphoria — depressives show LESS
self-protective forgetting (consistent with our depressive modifier).

Implement: at retrieval of a record with `selfRelevance > mnemic_centrality`
(0.6) and `valence < −0.3` where the negative content is *about the
character* (feedback records — source "told_by", topic = self trait):
`θ += mnemic_loss` (0.15) in recall mode only; recognition mode exempt.
Encoding: `attention` to self-threat feedback `×= (1 − mnemic_encode)`
(0.25, shallow "not-thinking" — Sedikides & Green 2006). Waive both when
speaker is a close-other (relationship tier) — Green et al. 2009.
Depressive modifier: `mnemic_loss` and `mnemic_encode` ×0.3 (dysphoria
disrupts the protection). Emergent: characters genuinely don't recall
the criticism they received — until it resurfaces at recognition/
confrontation. [HYPOTHESIS on parameter values; effect itself robust.]

## 11. Source confusion stays in-category **[CONSENSUS]**

Taylor, Fiske, Etcoff & Ruderman 1978 "who said what" paradigm:
misattribution errors concentrate *within* social categories — perceivers
confuse which Black man said X with another Black man far more than with
a white speaker (and same-sex > cross-sex) — person memory is organized
category-first, individual-second. Klauer & Wegener 1998 multinomial
model decomposes it into category-memory + person-memory components.

Implement: in §6.10 `sourceInfer` external–external reassignment, weight
candidate sources by category match:
`P(s) ∝ sim(·) · credibility(s) · (sharesCategory(trueContextCategory, s)
? 1 : cat_pen)` — equivalently, ~`source_cat_share` (0.65) of external
confusions should land on same-category candidates. Needs a cheap
category tag on characters (age band / role / gender — whatever
world-builder already marks); absent a tag, falls back to cue overlap.

## 12. Age interactions — social memory across the lifespan

- **Person-name tier:** the cascade's weakest tier (name) is the one
  aging hits hardest — `tot_rate` (v0.4) already does this; v0.8 adds
  that identityStrength also decays faster (beta_source ×1.2 at 65+)
  while `familiarity` is nearly preserved — older adults report exactly
  "I know the face, can't place them."
- **OAB:** applies at every age (§1) — an older character is *best* at
  remembering older faces.
- **Audience tuning:** no established age interaction; keep flat
  [HYPOTHESIS].
- **Cheater source memory:** preserved or near-preserved in older adults
  (Bell & Buchner 2012) — do NOT put `cheat_source_mult` on the decline
  curve; consistent with emotional-memory's preserved negativity.
- **SS-RIF:** susceptibility tracks existing `plist_suppress`/source
  decline — scale `ss_rif_k` with `discrim_mult` (older listeners
  suppressed more easily).
- **Mnemic neglect:** older adults' positivity shift should *strengthen*
  self-protective recall [HYPOTHESIS — no direct study; consistent with
  SST positivity]. Optional: `mnemic_encode` ×1.3 at 65+.

## 13. Trait loadings (extends individual-differences.md §3)

New params map onto the existing IndivTraits vector:

| Param | Primary loadings | Note |
|---|---|---|
| sti_prob | +social · +wmc | vigilance to persons |
| incongruity_gain | +wmc · +open | noticing violations needs resources |
| audience_tune | +social · −neurot? | tune to in-group; keep neurot null |
| shared_reality_gate | +distrust (raises gate) | the distrustful don't tune |
| ss_rif_k | +social · −wmc | co-retrieval depends on tracking |
| collab_friend_mult | +social (acquaintance depth) | directory depth |
| mnemic_encode/mnemic_loss | +neurot INVERTED | high-neurot/dysphoric = less protection |
| credibility prior | −distrust lowers prior | trait sets the prior, not the update |
| oab_loss | (none — demographic, not trait) | keep flat |
| cheat_source_mult | (none — threat machinery) | flat per emotional-layer rule |

Explicit nulls to preserve: `vivid` does not affect familiarity (imagery
≠ face memory — prosopagnosia is orthogonal); `g_mem` does not exempt
audience tuning (no evidence smarter speakers escape SIB).

## 14. Spec changes in v0.8 (summary)

- §1: new `PersonModel` record type + per-character social store.
- §2: STI write at `sti_prob`; `incongruity_gain` E-bonus; diagnosticity
  weights `diag_moral_neg`/`diag_ability_pos`; `next_in_line` attention
  penalty; `oab_loss` on familiarity encoding; `mnemic_encode` shallowing
  on self-threat feedback.
- §5.10 NEW: person-recognition cascade — recognition mode against
  PersonModel returns `{familiar_only | identity | full}` tiered result;
  name tier failure → existing `tot` path; `"directory"` mode for
  transactive lookup.
- §5.8: listener-side suppression `ss_rif_k` added to discussEvent
  (SS-RIF, Cuc et al. 2007).
- §6.11 NEW: audience tuning on retell (Higgins & Rholes; Echterhoff
  shared-reality gate).
- §6.12 NEW: serial-reproduction operators — leveling `level_frac`,
  stereotype-convergence `si_dropoff`/`chain_sc_thresh`, assimilation
  drift, `social_transmit_gain`.
- §6.13 NEW: `groupRecall` collaborative-inhibition wrapper +
  postcollab benefit.
- §6.14 NEW: credibility learning — `PersonModel.credibility` updated by
  verification outcomes; §6.3 `sourceCredibility` now reads from the
  model (backward-compatible default 0.5 when no model exists).
- §6.10: `source_cat_share` — within-category confusion weighting.
- §4: `cheat_source_mult` slows β_source on cheater-associated records;
  `mnemic_loss` recall-mode θ penalty on central self-threat records
  (recognition exempt).
- §7: +16 params (below); §10: `retell`, `groupRecall`, `"directory"`
  mode, `PersonModel` in snapshot.

## 15. Parameter guidance (all optional, defaults shown)

| param | default | range | source |
|---|---|---|---|
| sti_prob | 0.6 | 0.2–0.9 | Winter & Uleman 1984; Uleman 2008 meta |
| sti_gain | 0.15 | 0.05–0.4 | — |
| diag_moral_neg | 1.6 | 1.0–2.5 | Skowronski & Carlston 1987/1989 |
| diag_ability_pos | 1.3 | 1.0–2.0 | same |
| incongruity_gain | 0.25 | 0.0–0.5 | Hastie & Kumar 1979 |
| next_in_line | 0.4 | 0.0–0.7 | Bond 1985 |
| oab_loss | 0.15 | 0.0–0.4 | Rhodes & Anastasi 2012 g≈0.37 |
| familiar_thresh / identity_thresh / name_thresh | 0.25/0.4/0.55 | tiered, ascending | Bruce & Young cascade |
| cheat_source_mult | 0.6 | 0.3–1.0 | Buchner et al. 2009 η²≈.14 |
| audience_tune | 0.06 | 0.0–0.2 | Higgins & Rholes 1978 |
| shared_reality_gate | 0.5 | 0.2–0.8 | Echterhoff et al. 2005 |
| ss_rif_k | 0.04 | 0.0–0.12 | Cuc et al. 2007 |
| level_frac | 0.3 | 0.1–0.6 | Allport & Postman leveling |
| si_dropoff | 0.75 | 0.4–1.0 | Kashima 2000 crossover |
| chain_sc_thresh | 4 | 2–7 | Kashima 2000 position ~4 |
| social_transmit_gain | 1.15 | 1.0–1.4 | Mesoudi et al. 2006 |
| collab_base / collab_size_pen / collab_friend_mult | 0.65/0.1/1.2 | 0.4–0.9 / 0–0.25 / 1.0–1.4 | Marion & Thorley 2016 |
| cred_step | 0.08 | 0.02–0.2 | Koenig & Harris selective trust |
| mnemic_loss / mnemic_encode / mnemic_centrality | 0.15/0.25/0.6 | 0–0.35 / 0–0.5 / 0.4–0.8 | Green et al. 2008 |
| source_cat_share | 0.65 | 0.4–0.9 | Taylor et al. 1978 |

## 16. Validation probes (P57–P67)

- **P57 cascade ordering:** repeated encounters → familiarity-only recalls
  appear before identity, identity before name; name failures present as
  `tot` never as absence.
- **P58 incongruity:** a diagnostic counter-trait act ("generous Mara
  stiffs the tip") is recalled at higher rate than matched consistent
  filler after equal delay.
- **P59 morality asymmetry:** one dishonest act moves
  `PersonModel.traits.dishonest` ≥1.5× more than one kind act moves
  `.kind`; immoral trait resists counterevidence longer.
- **P60 SS-RIF:** after a discussEvent where speaker covers fields A,C
  of a 4-field event, listener recall of unmentioned related field D
  drops vs a no-discussion control.
- **P61 saying-is-believing:** speaker who tunes a description negative
  for a skeptical, trusted audience recalls the target more negatively a
  day later; no drift when audience credibility < gate.
- **P62 chain convergence:** a 4-hop rumor ends more schema-consistent
  and detail-poor than hop 1; SI fields underrepresented by ~hop 4
  (Kashima 2000 direction; not a hard number — SI was *more* reproduced
  early, SC dominates late).
- **P63 in-category confusion:** ≥`source_cat_share` of external source
  misattributions land on same-category candidates.
- **P64 cheater persistence:** "who did the bad thing" retrievable at a
  delay where "who did the neutral thing" is not; zero advantage on pure
  face recognition of the same persons.
- **P65 mnemic neglect:** central self-threat feedback recalled worse
  than peripheral/other-referent feedback, but a recognition-mode
  confrontation still fires; effect waived for close-other sources and
  for the depressive profile.
- **P66 collaborative inhibition:** group recall < union of solo recalls;
  strangers < housemates; each member's *subsequent* solo recall improves
  (postcollab benefit).
- **P67 credibility loop:** a speaker whose rumors repeatedly fail
  witnessed verification sees `p_adopt` on their later accounts fall —
  learned, character-local distrust.

## 17. Honest limits

- **PersonModel granularity:** real person representations are rich,
  multi-aspect, context-variant. Ours is a flat trait vector — enough to
  generate diagnosticity asymmetries and directory behavior, not
  impression revision dynamics (which need an impression model we don't
  specify — the trait vector IS the impression).
- **Credibility update rule is a hypothesis:** the literature supports
  learned trust (esp. in children) but gives no continuous-update law;
  `cred_step` is tunable, not fitted.
- **SS-RIF magnitude** in naturalistic dyads is less precise than the
  lab RIF it inherits; we set it slightly below `rif_k`.
- **Audience tuning requires a "stance"** the game must supply — the
  audience's known attitude toward the topic/person. Where no stance
  exists, tuning shouldn't fire (consistent with shared-reality gating).
- **Category tags** for source confusion must come from world-builder;
  inventing social categories for SF residents is out of scope and the
  operator degrades gracefully without them.
- **Collective/normative memory** (commemoration, neighborhood "what
  everyone knows") is emergent here via converging retellings; we do not
  model a shared public memory store — Hirst & Echterhoff 2012's
  collective-memory frame says that's right: collective memory lives in
  individuals' aligned memories, not a hive store.

---

# Part II (v20) — the talk ecology: sharing drives, confidence by consensus, secrets on a timer

Part I added *person* representations and the listener-side machinery
(SS-RIF, audience tuning, serial reproduction, credibility learning).
Part II deepens the *ecology* — why records enter talk at all, what
repeated talk does to them over months, and the channels that are still
missing: social validation of confidence, common-ground bookkeeping,
confidentiality as a decaying tag, gossip priming perception, shared
attention, and partner-as-memory. Every mechanism lands in spec v2.0.

Citations author/year; tiers as in Part I.

## 18. Social sharing of emotion — the retell engine's missing trigger **[CONSENSUS existence; parameter estimates ROBUST]**

§4.13 fires retells from `retell_base·E_adj·(1+retell_social·sharedCue)`
— a flat ecology with no *motive*. The motive exists and is measured:
**social sharing of emotion** (Rimé, Mesquita, Philippot & Boca 1991;
Rimé, Finkenauer, Luminet, Zech & Philippot 1998 review; Rimé 2009).
~80–95% of emotional episodes are socially shared, typically within
days; sharing frequency and repetition scale with emotional *intensity*
(regardless of valence); sharing is age-robust (children share from
preschool; Rimé et al. 1998 §). The one robust suppressor is
**shame/social-risk content** — events whose telling threatens the
teller are shared less and later (Finkenauer & Rimé 1998).

Critical boundary — **the recovery illusion**: talking does NOT
extinguish the emotion. Zech & Rimé 2005 (bereavement): sharing
frequency did NOT predict emotional recovery; perceived benefit yes,
measured recovery no. Christophe & Rimé 1997 — emotional arousal is
reactivated, not vented. So sharing buys *storage strength* (rehearsal,
§4.11) and buys nothing on the affect tag beyond the §6.11
`verbal_dampen` term — the two effects must stay separate: a character
who talks constantly about the breakup keeps the pain AND the memory.

Implement: replace the flat daily draw with an affect-weighted one:

```
p_retell = retell_base·E_adj·(1 + retell_social·sharedCue
           + share_k·|affect|)·(1 − share_shame_pen·shameFlag)
share_k ≈ 0.8;  share_shame_pen ≈ 0.5 (shameFlag = negative
  self-relevance, selfRelevance>0.6 & valence<−0.4 & self-as-agent
  fault — world/behavior layer supplies the flag or the rule)
on each retell: affect tag decays by verbal_dampen only (§6.11);
  NO additional relief — share_relief = 0 is the default, not a knob
```

Emergent: the neighborhood's most-told records are exactly the
high-arousal ones — disasters and scandals rehearse themselves to
permastore while routines die in days; the shamed clerk never mentions
the firing but can't stop replaying it (intrusion machinery does the
replaying, §5.7).

## 19. The speaker's floor — own-turn advantage + facilitation **[CONSENSUS on components]**

v1.2 already prices the components: `prod_gain` (said-aloud bonus,
recognition-weighted — MacLeod et al. 2010), `gen_gain` (self-generated
content, Bertsch et al. 2007 d=0.40), `enact_gain` (performed actions,
Roberts et al. 2022 g=1.23). Part II adds the *dialogue bookkeeping*
that makes them fire correctly in conversation, plus one missing
counterweight:

- **Own-turn mapping:** in a conversation event, fields the character
  produced (their utterances, their arguments) encode with
  `prod_gain`/`gen_gain` automatically; co-participants' utterances
  encode under listener attention (which §2.4 `next_in_line` taxes
  pre-turn). Emergent and documented: people remember conversations
  asymmetrically, centered on their own contributions (Ross & Sicoly
  1979 self-serving recall asymmetry — memory privileges one's own
  role; also Fischer et al. on own-argument advantage).
- **Retrieval-induced facilitation (the SS-RIF counterweight):**
  retrieval practice *facilitates* related material when the practiced
  and non-practiced items are integrated into one coherent episode —
  suppression needs competition, integration flips the sign (Chan,
  McDermott & Roediger 2006 — initially untested but related material
  improves after retrieval practice; further boundary: facilitation at
  longer delays and with integrative encoding). Implement in §5.8:
  unsurfaced same-event records with `links` into the surfaced record
  (integration, not mere similarity) get `strength *= (1 +
  rif_facil_k)` (≈0.03) instead of the ss_rif/plist suppress. Switch
  rule: `integrated` = shares an event id or `links` edge;
  `competitor` = cue-similar but no link — the two populations get
  opposite signs, which is exactly what the literature shows.

## 20. Corroboration inflates confidence — social validation **[ROBUST]**

Eyewitness post-identification feedback: confirming feedback ("good,
you identified the suspect") inflates retrospective confidence,
attention, and even recollection of view quality — disconfirming
feedback depresses it less (Wells & Bradfield 1998; Bradfield, Wells &
Olson 2002 — the inflation persists when feedback follows the ID by
days, and survives warnings). Co-witness information likewise shifts
confidence beyond its informational value (Skagerberg & Wright 2008;
Luus & Wells 1994). Crucially the shift is to *confidence*, not
accuracy — §6.5 already handles content convergence; this is the
confidence channel. Feedback effect is **asymmetric in persistence**:
inflation from confirming feedback survives later discrediting of the
feedback source more than the depression does.

Implement in `hearAccount`/`discussEvent` when accounts are compared:

```
match on core fields (who/what/where within sim(·,·)>merge_thresh):
  listener conf += corroborate_conf (≈0.15) on BOTH records
  speaker's own record likewise inflated (mutual validation is real —
  both parties leave more certain, whoever was right)
contradiction (listener reconstructed field conflicts):
  conf −= disagree_conf (≈0.10) — magnitude smaller than the
  confirming bump, per the asymmetry
persistence: once applied, corroborate_conf deltas do not unwind when
  sourceCredibility later drops (the confidence stays even when the
  corroborator is exposed — Wells & Bradfield boundary)
```

Emergent: consensus does not mean truth — a dyad that mutually confirms
a shared confabulation ends MORE confident than either was alone;
"everyone agrees it happened that way" and "it happened that way"
decouple (binds to §6.7 believe/recollect split).

## 21. Common-ground overreach — the copresence assumption **[ROBUST direction; params HYPOTHESIS]**

Speakers systematically overestimate what others know — egocentric
anchoring on one's own knowledge (curse of knowledge: Birch & Bloom
2007; Nickerson 1999 "how we know what others know"; Keysar's
audience-design work — listeners assumed to share speaker context;
Wu & Keysar 2007 — the overestimate is *stronger* for close/similar
others). Applied to memory bookkeeping: people encode "X knows this"
from mere co-presence, without tracking whether X was attending.

Implement: on `encodeEvent`, all characters in `context.present` get
appended to the record's `shared_with` list with probability
`copresent_assume_p` (≈0.9) — NO check on their actual attention
(that's the error, humans skip it too). Query "would X know about
this?" resolves `shared_with` membership at high confidence
(`common_ground_conf` ≈ 0.8). The result is a genuine false-positive
channel: "but you were standing right there!" disputes when the
co-present character (next_in_line-taxed, lapse, low attention) never
encoded it. `shared_with` decays like source metadata (beta_source).
`toldTo` (v1.6) stays the explicit channel; `shared_with` is the
inferred, wrong-able one — a character can believe you know something
you never heard AND forget telling you something you were told; both
bugs coexist, as in humans.

## 22. The person model primes perception — interpret bias **[ROBUST mechanism; gain HYPOTHESIS]**

Part I made new *surprising* behavior memorable (incongruity_gain,
§2.3). The complement: genuinely **ambiguous** behavior is *interpreted*
through the existing impression before encoding — assimilation at the
input stage, not the retrieval stage (Srull & Wyer 1989 — ambiguous
behaviors assimilate to the prior impression; Hastie & Kumar
disambiguation). Anderson, Siegel, Bliss-Moreau & Barrett 2011
(Science): negative *gossip* about a person biases subsequent visual
processing of their face — reputation literally changes what you
perceive, not just what you recall.

Implement at encoding: when an observed behavior's trait implication is
ambiguous (|impliedTrait| < `ambig_band` ≈0.3) and the actor's
`PersonModel.traits[trait]` exceeds ±0.4, the encoded implication pulls
toward the model: `implied += interpret_bias·sign(model)·(1−|implied|)`
(interpret_bias ≈ 0.3). Clearly-contrary acts (|implied| ≥ ambig_band)
are untouched — they still get incongruity_gain. Both effects coexist
at different ambiguity bands: reputation absorbs the gray zone and
*amplifies* the clear violation. Emergent: a known-cheapskate's
ambiguous tip reads stingy; the rumor engine manufactures evidence for
its own priors — confirmation without a confirmation-bias operator.

## 23. Confidentiality is a tag, and tags decay — secrets leak on a schedule **[HYPOTHESIS on mechanism; decay asymmetry CONSENSUS-grounded]**

"Don't tell anyone" is an instruction attached to content — source/
context-class metadata, not content. Source and context decay faster
than content (source amnesia: Schacter, Harbluk & McLachlan 1984 —
facts persist while acquisition context dies; our own beta_source >
beta_content asymmetry, §4.1). So a character retains the secret
content while the *prohibition tag* fades — the deep human
"wait, was that a secret?" failure. Direct experimental literature on
confidentiality-tag decay is thin [HYPOTHESIS]; the mechanism is the
documented source-memory asymmetry applied to one more field.

Implement: `encodeEvent`/`hearAccount` may carry `confidential: true`
(also set by a later "keep this between us" event — a `tagEvent`).
The flag has its own `secret_str` strength (birth = record E) decaying
at `beta_source·secret_tag_mult` (≈1.3 — slightly faster than ordinary
source, since the instruction is a single utterance). At `retell`/
transmission of a `confidential` record:

```
P(respect) = min(1, secret_str·2)·(0.5 + 0.5·PersonModel[teller]
             .credibility of the secret-holder? — simpler:
             ·(0.5 + 0.5·consc trait loading))
if respect roll fails: content transmits WITHOUT the flag — the
  leak is silent; no "breaking confidence" event unless the game
  emits one
```

Emergent: fresh secrets hold; month-old secrets leak at content-fresh
rates — gossip propagates not because characters choose betrayal but
because the DO-NOT-TELL bit rots faster than the juicy bit. Probes the
deep asymmetry: leak rate rises with secret age *holding content
strength constant*.

## 24. Canonization — the oft-told story freezes **[ROBUST direction; threshold HYPOTHESIS]**

Bartlett's repeated reproduction showed convergence to a conventional
form; Marsh & Tversky 2004 ("spinning the stories of our lives")
documented that told-life stories drift toward narrative convention
(exaggeration/minification serving the story's function) AND that the
story becomes the stable version — the performed narrative is what
survives. Mechanistically for us: beyond a retell count, the record
stops being rewritten — the character recites the *story*, a cached
surface, not the event. Rote retrieval isn't elaborative retrieval
(§4.11 massed-retell logic — easy retrievals barely grow S and, per
this section, barely rewrite R-side content either).

Implement: records carry `retellCount` (increments on retell §6.11 and
§4.13 fires). At `retellCount ≥ canon_thresh` (≈5): §6.1 drift and
§6.11 audience tuning apply at `canon_drift_mult` (≈0.2); verbatim
candidate edits freeze (field-level §6.1 writes suppressed);
reconstruction content draws from the *accumulated* drifted state —
frozen warts and all. The freezing is double-edged and falsifiable:
early distortions become permanent (the scandal version she always
tells IS now her memory — saying-is-believing reaches its fixed point),
but late corruption (fresh misinformation) bounces off the canonized
version — old, well-told stories resist §6.3 adoption at
`(1−canon_resist)` ≈ 0.6 for contested fields. That last clause is the
documented "well-rehearsed accounts resist misinformation" finding
(e.g. rehearsEd memories show lower misinformation uptake — consistent
with the S-strength resistance already in §6.3 via fieldStrength; the
canon term makes it explicit).

## 25. Shared attention amplifies encoding — the "we both saw it" boost **[ROBUST, small]**

Joint attention is not just co-presence: *mutually aware* attending
amplifies experience and encoding. Boothby, Clark & Bargh 2014
(Psych. Science): shared experiences are amplified — pleasant more
pleasant, unpleasant more unpleasant (valence-symmetric intensity
gain); Shteynberg 2015/2018 collective-attention review — attended-together
stimuli are better remembered and judged more intense;
Shteynberg & Apfelbaum 2013 — threatening information especially
benefits under collective attention.

Implement: `context.coAttending` (a known other present AND mutually
engaged — stricter than `present`; the event layer must supply it)
gives `E *= (1 + joint_attn_gain)` (≈0.12) and amplifies the stored
affect magnitude: `|valence_tag| += joint_affect_amp·sign(valence)`
(≈0.1 — symmetric: shared fun is funner, shared dread is dreadful).
Distinct from §21: coAttending is about *encoding depth*, shared_with
is about *common-ground bookkeeping* — both can fire on the same event.
Emergent: the concert everyone attended together is better remembered
than the same show watched alone; first-hand shared disasters out-encode
equally-arousing solo ones.

## 26. Absorption — others' stories become quasi-autobiographical **[ROBUST that it occurs; rate HYPOTHESIS]**

Repeated, vivid, self-relevant narration from others can be re-sourced
to the self — false autobiographical memories via suggestion are among
the best-documented false-memory results (Hyman, Husband & Billings
1995 — false childhood events for ~20-25% of participants under
repeated suggestion; Loftus & Pickrell 1995 lost-in-the-mall; Pillemer
et al. 2015 — "vicarious memories": people consciously hold memories
of events they only heard, sometimes with rich sensory character;
couples borrow each other's stories — "you remember when WE…" adopted
across partners). This is the social pathway into §6.9/§6.10 machinery
— distinct from imagination (nobody imagined it) and cryptomnesia
(forgot the source but keeps the content): here the *provenance* flips
told_by → experienced.

Implement (rare pathway): a `told_by` record meeting ALL of
`hearCount ≥ 3`, `selfRelevance > 0.5`, verbatim richness >
`rm_rich_thresh`, and the §6.9 plausibility gate — draws `absorb_p`
(≈0.02) per subsequent hear/retell to flip `kind` toward `experienced`
with source re-tagged `witnessed` at reduced confidence and reduced
verbatim ceiling (absorbed memories are thinner than real ones —
Pillemer: vicarious memories are real but lower-detailed). Never fires
while the source tag is intact (fresh stories can't absorb — the
mechanism needs source decay, §6.10 precondition). Emergent: a
character can genuinely "remember" the wedding her partner described
forty times — and will argue she was there.

## 27. Transactive dependence — the partner as external store, and its loss **[CONSENSUS existence; loss params HYPOTHESIS]**

§8's transactive directory knows who knows what. Part II adds the
dependence and the grief: long-term partners off-load memory onto each
other so completely that the partner becomes part of the storage
medium (Wegner 1987; Hollingshead 1998; Harris, Barnier, Sutton &
Keil 2014 — couples who recall together remember more, and estranged
pairs lose the benefit; Harris et al. 2011 — intimate partners serve as
each other's external memory for decades). The flip side is documented
clinically though not lab-quantified: bereaved older adults report
"half my memory is gone" — losing the directory's referent, not the
directory [HYPOTHESIS on magnitude].

Implement: recall on a topic where `PersonModel[partner].knowsTopics`
has the topic AND partner availability flag is false (dead/moved/
estranged — the world layer knows) takes `θ += transact_loss` (≈0.12)
on records the partner would have supplied — the directory entry
survives ("Jules would remember") while the content it pointed to is
unreachable; pointer-rot as grief. `collab_partner_gain` (v1.6) is the
positive mirror and stays. Emergent: the widow who keeps saying "ask
Marta — oh" and then can't answer; household knowledge visibly decays
after a departure beyond what individual decay predicts.

## 28. Age and trait loadings (extends §§12–13)

| Param | Primary loadings | Age note |
|---|---|---|
| share_k | +extra · +neurot(intensity sharing) | flat; children share too |
| share_shame_pen | +consc · +distrust | flat |
| rif_facil_k | +wmc (integration) | mild decline with link_p |
| corroborate_conf | −distrust (mild), +meta_conf? keep meta_conf null — inflation is about feedback not self-view | ×1.2 @70 (older eyewitnesses more feedback-sensitive — HYPOTHESIS direction consistent w/ suggestibility) |
| copresent_assume_p | −wmc (poorer tracking of who attended) | rides source decline: ×(1+0.3·age_eff/60) |
| interpret_bias | +distrust for negative targets (schema-driven reading) | flat [HYPOTHESIS] |
| secret_tag_mult | −consc (respect for the flag is partly trait) | rides beta_source — older secrets leak more |
| canon_thresh | flat | flat — canonization is a count, not a capacity |
| joint_attn_gain | +social (attends WITH others) | flat [HYPOTHESIS] |
| absorb_p | +fantasy · −wmc | ×discrim_mult side (source-loss scaling) |
| transact_loss | +social depth (directory depth = dependence) | larger in long-bonded older pairs [HYPOTHESIS] |

Explicit nulls preserved: `g_mem` does not exempt corroboration
inflation (smart people are confidence-validated too); `vivid` does not
feed absorb_p (vicarious memories need repetition+relevance, not
imagery); `meta_cal` does not undo corroborate_conf (the inflation is
to stored confidence, not the report calibration).

## 29. Spec changes in v2.0 (summary)

- §2: `joint_attn_gain`/`joint_affect_amp` on `coAttending` events;
  `interpret_bias` on ambiguous trait implications; `confidential`
  tag + `secret_str` on encode/hear.
- §4.13: retell draw gains `share_k·|affect|` motive term and
  `share_shame_pen` suppression — the Rimé engine.
- §5.8: `rif_facil_k` — linked/integrated unsurfaced records are
  facilitated, not suppressed (Chan et al. 2006 switch rule).
- §6.20 NEW: corroboration confidence channel (corroborate_conf/
  disagree_conf, persistent inflation).
- §6.21 NEW: common-ground bookkeeping — `shared_with`,
  `copresent_assume_p`, `common_ground_conf`.
- §6.22 NEW: confidentiality decay — `secret_str` at
  `beta_source·secret_tag_mult`; silent leak on failed respect roll.
- §6.23 NEW: absorption — told_by→experienced provenance flip at
  `absorb_p` under the hearCount/relevance/plausibility gates.
- §6.24 NEW: canonization — `canon_thresh`/`canon_drift_mult`/
  `canon_resist`; frozen warts, late misinfo resistance.
- §6.14 ext: `transact_loss` θ penalty when a directory-listed
  partner is unavailable.
- §7: +16 params (below); §10: contract additions (shared_with,
  confidential/secret_str, retellCount, absorb flips, coAttending,
  tagEvent, partner availability).

### Parameter guidance (defaults; ranges in profiles §0)

| param | default | range | source |
|---|---|---|---|
| share_k | 0.8 | 0.3–1.5 | Rimé et al. 1998 |
| share_shame_pen | 0.5 | 0.0–0.9 | Finkenauer & Rimé 1998 |
| rif_facil_k | 0.03 | 0.0–0.1 | Chan, McDermott & Roediger 2006 |
| corroborate_conf | 0.15 | 0.05–0.3 | Wells & Bradfield 1998 |
| disagree_conf | 0.10 | 0.0–0.25 | Bradfield et al. 2002 asymmetry |
| copresent_assume_p | 0.9 | 0.6–1.0 | Keysar; Birch & Bloom 2007 |
| common_ground_conf | 0.8 | 0.5–0.95 | Nickerson 1999 |
| interpret_bias | 0.3 | 0.0–0.6 | Srull & Wyer; Anderson et al. 2011 |
| ambig_band | 0.3 | 0.1–0.5 | — |
| secret_tag_mult | 1.3 | 1.0–2.0 | source-amnesia asymmetry (HYPOTHESIS) |
| absorb_p | 0.02 | 0.0–0.08 | Hyman et al. 1995; Pillemer et al. 2015 |
| canon_thresh | 5 | 3–9 | Marsh & Tversky 2004 (HYPOTHESIS threshold) |
| canon_drift_mult | 0.2 | 0.0–0.5 | Bartlett conventionalization |
| canon_resist | 0.6 | 0.3–0.9 | rehearsed-account misinfo resistance |
| joint_attn_gain | 0.12 | 0.0–0.3 | Boothby et al. 2014 |
| joint_affect_amp | 0.1 | 0.0–0.3 | Boothby et al. 2014 (symmetric) |
| transact_loss | 0.12 | 0.0–0.3 | Harris et al. 2014 (loss = HYPOTHESIS) |

## 30. Validation probes (P183–P192)

- **P183 sharing propensity (MUST):** across a cohort, per-record
  retell probability rises monotonically with |affect| (~3× across
  range); shame-flagged negative-self records suppressed ~half.
- **P184 recovery illusion (MUST — sign-locked):** N retells of a
  high-arousal record raise S measurably while `arousal_tag` declines
  only by `verbal_dampen`·n — talk never extinguishes affect. FAIL if
  sharing reduces arousal beyond dampen.
- **P185 corroboration asymmetry (SHOULD):** matched accounts raise
  both parties' conf by ~corroborate_conf; inflation persists after
  the corroborator's credibility drops below 0.2; contradiction
  depresses less than confirmation inflates.
- **P186 copresence overreach (SHOULD):** "would X know" queries
  return true for inattentive co-present X at ~copresent_assume_p —
  false-positive knowledge attribution exists and scales with age.
- **P187 interpret-bias band (MUST — structure):** ambiguous acts
  assimilate to PersonModel at ~interpret_bias rate; clearly-contrary
  acts still get incongruity_gain; FAIL if either effect eats the
  other.
- **P188 secret leak (MUST — emergent):** holding content strength
  fixed, leak probability rises with secret age; old secrets leak at
  near-baseline rates. FAIL if secrets never leak or always leak.
- **P189 canonization (SHOULD):** drift variance across verbatim
  fields saturates after canon_thresh retells; pre-threshold
  distortions persist (frozen); late misinformation adoption drops on
  canonized records.
- **P190 joint attention (SHOULD):** coAttending events beat
  matched solo events on E and |valence_tag| symmetrically (both
  valences amplified).
- **P191 absorption (OBSERVE):** high-hearCount self-relevant told_by
  records flip kind at low rate, only after source decay; absorbed
  records carry lower verbatim richness than matched witnessed ones.
- **P192 transactive loss (SHOULD):** partner-unavailable retrieval on
  directory-listed topics degrades while the directory entry itself
  survives — "I know who would know, and they're gone."

## 31. Honest limits (Part II)

- **share_k estimates** come from diary/self-report sharing rates —
  real-world sharing propensity includes instrumental motives
  (bonding, warning, recruiting allies) we collapse into one scalar;
  the game may want motive-tagged shares later.
- **The respect roll for secrets is our invention** — the literature
  gives tag-decay asymmetry, not a leak law; secret_tag_mult and the
  gate shape are tunables, flagged HYPOTHESIS.
- **Absorption rate** is anchored to false-childhood-memory induction
  paradigms (strong suggestion, repeated probing) — natural
  conversational absorption is rarer; absorb_p errs low.
- **canon_thresh** is a count threshold with no direct empirical
  anchor — Bartlett's participants converged by reproduction ~3–4, but
  real "my standard story" counts are unmeasured; treat as a tunable.
- **Corroboration persistence** direction is Wells & Bradfield's, but
  magnitude varies by design; the asymmetric-undo rule is hypothesis.
- **Common-ground bookkeeping** is a record-level approximation of a
  real inferential system — we model the characteristic error, not the
  inference itself.

---

# Part III (v32) — the other person's ledger: what talk costs, whom we tell, and who we become to each other

Parts I–II built the person store and the talk ecology. Part III
deepens the *diadic bookkeeping* — the machinery by which a character
tracks who they told, whom they trust, and what they *owe* each other
— plus the two biggest unmodeled forces on person memory: **status**
and **the receiver's own update of the speaker**. Twelve mechanisms,
all landing in spec v3.2.

Citations author/year; tiers as in Parts I–II.

## 32. Two-dimensional trait space — morality and competence update by different rules **[CONSENSUS on dimensionality; ROBUST on asymmetry]**

Person perception runs on two semi-independent channels:
communion/morality ("can I trust them") and agency/competence ("can
they get it done") — Wojciszke, Bazinska & Jaworski 1998; Fiske,
Cuddy & Glick 2007 SCM; Abele & Wojciszke 2007. Morality information
is sought first, weighted heaviest in global evaluation, and
disconfirmed asymmetrically (Brambilla, Sacchi, Rusconi & Goodwin
2021 EJSP — participants preferentially sought morality info;
Brambilla et al. 2019 — moral (not competence) information drives
impression *revision*; Reeder & Coovert 1986 — immoral impressions
resist positive counterevidence). Competence shows the mirror-image
diagnosticity (already in `diag_ability_pos`, §2.2): brilliant acts
update strongly, mediocre acts barely.

Implement: tag every `PersonModel.traits` key `dim:"moral"|"social"|
"compet"` (the mapping table is world-builder vocabulary; spec only
needs the tag). Trait updates keep §2.2 diagnosticity but gain:

- `PersonModel.eval` — a scalar global evaluation recomputed as
  `eval = moral_primacy·mean(moral traits) + (1−moral_primacy)·
  mean(other traits)`; `moral_primacy` ≈ 0.65 (Brambilla et al.
  2012 — morality dominates global impression). `eval` is what
  `ingroup_factor` (§5 audience tuning) and §37 tell-selection
  should read — cheap, and it gives the rumor layer a real
  "how much do I like them" without inventing a relationship
  system.
- Moral-negative evidence resists revision asymmetrically —
  already emergent from `diag_moral_neg`; add the documented
  complement: counter-moral-positive evidence updates at
  `moral_rehab` (≈0.4) — redemption is slow, documented
  (Skowronski & Carlston; "it takes many good deeds to rebuild").
- Competence traits get no rehab penalty — ability impressions
  update fluidly in both directions (Wojciszke 1998 asymmetry:
  competence judgments follow performance; morality judgments
  are sticky).

Emergent: one witnessed theft writes a durable `eval` crater the
neighborhood can talk about for months; a bad haircut (competence
domain) barely registers — reputation heterogeneity across
characters without any global reputation store.

## 33. Attribution correction under load — the FAE is a resource problem **[CONSENSUS]**

Gilbert, Pelham & Krull 1988 (JPSP): person perception =
categorization → characterization → **correction**, and only the
correction stage needs resources — cognitively busy observers infer
traits *as if* situational constraint didn't exist (the constrained-
essay effect: they rated the speech-writer as holding the speech's
position). Trope 1986; Krull 1993 — correction is optional, effortful,
late. This is the single most important realism rule for social
memory: **witnesses of constrained behavior store the trait, not the
context.**

Implement inside the §2.1 STI write: observed behaviors may carry
`sitConstraint` ∈ [0,1] (event layer supplies: acting under orders,
stressed, scripted, provoked). The trait delta becomes:

```
delta = sti_gain · implication · diag_weight ·
        (1 − sit_credit·sitConstraint·correction_avail)
correction_avail = min(1, attention / correct_gate)   // gate ≈ 0.6
sit_credit ≈ 0.7
```

Busy observers (low attention, `next_in_line` taxed, distracted)
encode the raw implication — "she was rude" — with the constraint
field itself at ordinary (weak) verbatim strength, so days later the
trait survives while the excuse doesn't (β_source > β_content does
the rest). Emergent and deeply human: characters who witness the
landlord's curt reply during a fire alarm remember her as cold.

## 34. Status asymmetric person memory — we remember up **[ROBUST]**

Ratcliff, Hugenberg, Shriver & Bernstein 2011 (PSPB, 3 experiments):
high-status faces are better recognized, draw more attention, get
stronger identity–location binding, and receive more *holistic*
(expert-style) face processing. Complement: power dampens
individuating attention to subordinates — high-power perceivers
stereotype more and attend less to the low-power other's unique
attributes (Guinote 2007 review; Fiske 1993 power-as-control:
the powerful needn't attend, the powerless must). Direction is
stable across paradigms; effect sizes modest [ROBUST, moderate].

Implement on `PersonModel` accrual and §2 person-event encoding:

```
status_gap = perceivedStatus(target) − perceivedStatus(self)
if target != self:
    E              *= (1 + status_encode_gain·max(0, +gap))
    familiarity += gain·(1 + status_encode_gain·max(0, +gap))
    sti delta      *= (1 − power_encode_loss·max(0, −gap))
```

`status_encode_gain` ≈ 0.15, `power_encode_loss` ≈ 0.2. Status must
come from the world layer (role/wealth/title tag — the address
system and landlord role give it for free); absent a tag, gap = 0
and nothing fires. Emergent: tenants remember the landlord's face
and habits; the landlord learns tenants' faces slowly and tags them
category-first (§40) — the classic real-world asymmetry, and a
reason drama propagates differently up and down the hierarchy.

## 35. Destination memory — remembering whom you told **[CONSENSUS existence; age gradient ROBUST]**

Gopie & MacLeod 2009 (Psych. Science, "Stop Me If I've Told You
This Before"): memory for *whom you told* is reliably WORSE than
source memory for *who told you* — telling is self-focused
production, and the destination is the unattended slot. Gopie,
Craik & Hasher 2010 (Psych. Aging): older adults disproportionately
impaired on destination vs. item memory; critically, their
high-confidence error direction is the **miss** — believing they had
NOT told someone they had (→ repeats). The teller's own production
effort crowds out destination encoding — the mechanism is the
§19 own-turn advantage eating the address field.

Implement: `retell`/`tell` events already log `toldTo`. Give each
toldTo edge its own strength decaying at `beta_source·
dest_decay_mult` (≈1.5 — the destination is the weakest link in the
episode, weaker even than ordinary source). At tell-selection and
repetition checks:

```
P(recall told-to X) = toldTo_str vs θ_dest (≈ familiar_thresh)
miss side  → retell proceeds (repeat telling — same story twice)
false "already told" → rare (dest_fa ≈ 0.05), rises with age;
  the confident miss, not the confident false alarm, is the
  dominant older-adult signature (Gopie et al. 2010)
```

Age loading: `dest_decay_mult` ×(1 + 0.5·age_eff/60) — the strongest
age effect in this document; an 80-year-old's telling-ledger is
nearly a write-only store. Emergent: grandparents retell, liars lose
track of who heard which version, secrets' tell-history rots
*independently* of both content (§23) and the secret tag — three
different decay rates on one utterance, which is exactly why real
social bookkeeping fails.

## 36. Mere-exposure familiarity inflation — "haven't we met?" **[CONSENSUS direction]**

Familiarity accrues from any repeated encounter *including ambient
ones* — and familiarity without identity produces confident
misattribution of acquaintance (the mechanism behind Jacoby,
Woloshyn & Kelley 1989 "famous overnight": prior exposure inflates
fame judgments; the butler-on-the-bus literature — Maylor; and
unconscious transference §6.26 which is the criminal-justice
expression of the same channel). A neighborhood is a perpetual
exposure machine: the barista's face accrues familiarity from
hundreds of sightings with zero identity work.

Implement: `PersonModel.exposureCount` increments on any
same-place co-presence sighting (ambient events where the person
is merely `present`, below attention thresholds — records that
don't even encode as episodes). `familiarity` gains
`exposure_fam_gain` (≈0.02) per exposure, capped by the §4.7
face permastore rules — but `identityStrength` gains ~0. Result:
the tier-1/tier-2 gap grows with neighborhood tenure, and the
`familiar_only` cascade output is *dominated* by exposure-
generated models — "I know that face" is statistically true and
socially false. Adds a new false-positive channel to §6.10
sourceInfer: high-exposure-low-identity persons are the preferred
unconscious-transference targets (feeds `transplant_gain`
candidate scoring with an `exposureCount` term — the transplant
draws from the most familiar empty shells).

## 37. Gossip as evidence — secondhand trait updates at a discount **[ROBUST direction; weight HYPOTHESIS]**

Gossip functions as reputation data — indirect reciprocity theory
shows people act on it (Sommerfeld, Krambeck, Semmann & Milinski
2007 PNAS: gossip substitutes for direct observation in partner
choice; Feinberg, Willer, Stellar & Keltner 2012 JPSP: prosocial
gossip deters exploitation and drives ostracism). The receiver-side
rule our spec needs: trait-implying content arriving `told_by`
should update `PersonModel.traits` — but at a discount for
indirectness, never equal to witnessed. Findlay? — no direct
fitted law; treat the discount as tunable [HYPOTHESIS on weight].

Implement on `hearAccount` when adopted content carries a trait
implication about a third party (target ≠ speaker, target ≠ listener):

```
PersonModel[target].traits[t] += sti_gain · implication ·
    diag_weight · heard_update_w · PersonModel[speaker].credibility
heard_update_w ≈ 0.4   // vs. witnessed sti delta = 1.0 baseline
```

The `eval` scalar (§32) moves with it — gossip moves liking, which
feeds §5 audience tuning and §42 tell selection. Asymmetry to keep
(unforced by the formula): negative gossip weighs more via
`diag_moral_neg` already; and the speaker's own `PersonModel.eval`
can *fall* when the gossip later fails verification (§9 cred_step)
— shooting the messenger is the documented correction channel.

## 38. Emotional contagion at retell — secondhand arousal **[CONSENSUS existence; gain HYPOTHESIS]**

Arousal transmits through retelling — listeners catch the speaker's
affective state (Hatfield, Cacioppo & Rapson 1994 emotional
contagion; Rimé 2009 — sharing reactivates arousal in both parties;
Peters & Kashima 2007 — talk about emotional events makes the
listener feel the emotion). `contagion_k` already exists in the
params (§6.3 hearsay arousal transmission, v1.7) — Part III
formalizes the *person-mediated* path and the boundary: contagion
scales with the speaker's arousal at retell-time (which has decayed
per §4.5), not the record's birth arousal, and with listener
`empathy` (existing trait, unused here until now).

Implement: on `retell`/`hearAccount`, the listener's stored copy's
`affect_tag` gains `contagion_k · speaker_now_arousal ·
(0.5 + 0.5·empathy)` — where `speaker_now_arousal` is the speaker's
retrieval-time arousal report (§5.5), already bounded by
`hc_gap_loss`. Emergent: rumors carry heat proportional to how
worked up the teller still is *today* — month-old scandals arrive
lukewarm, fresh ones arrive hot; a phlegmatic teller cools the
neighborhood's version of events.

## 39. Self-disclosure buys trust — the credibility prior has a history **[CONSENSUS effects; mapping HYPOTHESIS]**

Collins & Miller 1994 meta (Psych. Bull. 116:457, 94 studies):
three distinct disclosure–liking effects all significant — (a)
intimate disclosers are liked more; (b) people disclose more to
targets they already like; (c) disclosing *makes the discloser
like the recipient more*. Jourard's reciprocity and Laurenceau's
SSM work say the channel is intimacy, not information.

Implement — disclosure events (a `tell` whose record carries
`confidential:true` or `selfRelevance>0.6`) update BOTH
PersonModels:

```
listener.model[speaker].eval        += disclose_eval_gain (0.08)
listener.model[speaker].credibility += disclose_trust_gain·0.5
speaker.model[listener].eval        += disclose_eval_gain      // (c)
speaker.model[listener].credibility += disclose_trust_gain     // (a,b)
disclose_trust_gain ≈ 0.10
```

This closes a loop Part I left open: `shared_reality_gate` and
`sourceCredibility` now have a *formation mechanism*, not just a
verification update. Emergent: confidants are believed more,
trusted with more, and tuned to — the friendship is the epistemology.
Boundary [HYPOTHESIS]: disclosure to a *disliked* listener still
raises speaker trust (effect c is robust), so confiding in an
enemy is a real, documented way to soften the enemy — at the cost
of the §23 leak risk.

## 40. Category-first impressions, individuation on credit **[CONSENSUS continuum; params HYPOTHESIS]**

Fiske & Neuberg 1990 continuum model: impressions start
category-based and individuate only under motivation+attention;
Brewer 1988 dual-process version — person-based impressions require
processing investment. Without it, our `PersonModel` is born
individuated, which real impressions never are.

Implement: `PersonModel.individuation` ∈ [0,1], init 0.2
(birth = category shell), growing `individ_rate` (≈0.15) per
individuating encounter — encounters where attention > gate AND
behavior carries person-diagnostic content (the §2.1/§33 writes).
Trait queries against the model interpolate:

```
reportedTrait[t] = (1−individuation)·catPrior[t] + individuation·traits[t]
```

`catPrior` = category schema defaults (age/role/gender tags the
world-builder already supplies for §11). Low-individuation models
return the category's answer — "she's a landlord type, they all…"
— which is ALSO the §11 source-confusion substrate: same-category
confusions are worst between two low-individuation targets (the
mechanism the category literature implies; make `source_cat_share`
scale with `(2 − indiv_a − indiv_b)/2` — [HYPOTHESIS coupling,
direction consensus]). Emergent: new neighbors are types before
they're people; the ambient NPCs stay types to most mains forever
— which is *correct*, that's what 20 ambient humans are.

## 41. Motivated transference — new people inherit old schemas **[ROBUST]**

Andersen & Baum 1994; Andersen, Glassman, Chen & Cole 1995;
Andersen & Chen 2002 relational-self theory (Psych. Rev.): a new
person who resembles a significant other triggers transference —
schema-triggered evaluation, trait inferences *beyond the given
information*, false recognition of traits the significant other
has but the target never displayed (the memory effect: participants
"remembered" descriptors never presented, schema-consistent with
their own significant other). Distinct from §6.26 unconscious
transference (face-slot migration): this is *schema projection*,
not slot-filling — the new person inherits an emotional grammar.

Implement: on `PersonModel` creation, compute similarity of the
new person's observed surface (traits seen so far + categoryTags)
against existing high-strength models (top-`transference_pool` ≈ 5
by familiarity·eval-magnitude). If `sim > transference_thresh`
(≈0.6):

```
new.traits seeded toward donor.traits at transference_seed (0.3)
new.eval   seeded toward donor.eval   at transference_seed
false-fill: subsequent reconstruction of new-person episodes
  draws confab candidates from donor's trait space at
  transference_fill (0.15) — schema-consistent traits "remembered"
  never displayed (the Andersen & Baum memory effect)
decay: individuation growth (§40) shrinks seed influence at
  (1−individuation) — transference is a first-impression device
```

Emergent: "he reminds me of my brother" is a memory operation with
observable consequences — instant warm/distrustful priors and
confabulated shared history, that decay as the real person accrues
evidence. This is the first spec'd mechanism for *immediate,
motivated* social bias (all prior social biases were statistical).

## 42. Novelty-gated retell — you tell them what they don't know **[ROBUST mechanism; params HYPOTHESIS]**

Speakers design messages for the audience's presumed knowledge —
Grice's maxim of quantity; Clark's common ground; Brennan & Clark
1996 lexical entrainment. Applied to gossip selection: a teller
chooses fields/records the audience *doesn't already have* —
"did you hear about…" presupposes novelty. §21 gives us the
bookkeeping (`shared_with`, `toldTo`) to make the check real —
and its documented errors make the check human.

Implement in `retell` field selection (before §6.12 chain ops):

```
P(field selected) ∝ salience ·
    (audience.shared_with ∌ field ? novel_pick_w : 1)
    · (audience.toldTo ∌ (record,field) ? novel_pick_w : told_pen)
novel_pick_w ≈ 3.0, told_pen ≈ 0.5   // "new to you" bias
```

because `shared_with` over-assumes (copresent_assume_p) and
`toldTo` under-remembers (§35), the selection itself is wrong at
documented rates — characters repeat stories AND withhold ones the
audience never heard, both bugs flowing from one ledger. Emergent:
per-audience retell divergence — the same event exists in
*different subsets* across the neighborhood's dyads, which is the
microstructure real rumor networks show and no flat-broadcast
model produces.

## 43. The phrasing fingerprint — wording survives as provenance **[ROBUST direction; params HYPOTHESIS]**

Interactive alignment: interlocutors reuse each other's lexical
choices (Pickering & Garrod 2004 BBS; Garrod & Anderson 1987 —
maze-description conventions propagate within dyads; Brennan &
Clark 1996 entrainment). At chain level, Bartlett's operators
apply: *distinctive* phrasing is sharpened early, conventionalized
late — a rumor's surviving idiosyncratic word is a fossil of its
path ("trebuchet" again).

Implement: verbatim fields may carry `phrasing` (a token or short
string — the dialogue layer's actual words; spec only requires a
hashable surface). Per §6.12 hop:

```
P(phrasing survives hop) = phrase_surv_base ·
    (distinctive ? phrase_distinct_mult : 1) · exp(−chainPos/5)
phrase_surv_base ≈ 0.7, phrase_distinct_mult ≈ 1.4
```

Surviving phrasing tags then serve the history browser and
§6.10 source inference as *lineage markers* — two characters
telling the same rumor with the same odd word is evidence of a
shared link in the chain (a falsifiable forensic tool the
history-browser feature can expose). Emergent: the neighborhood
develops idiolect drift on hot rumors — "the trebuchet story"
vs "the catapult story" mark different chains from the same
event.

## 44. Age and trait loadings (extends §§12, 28)

| Param | Primary loadings | Age note |
|---|---|---|
| moral_primacy | flat — population constant flavor | flat [HYPOTHESIS] |
| moral_rehab | −distrust (forgiveness), +consc | ×0.7 @65+ (older positivity aids rehabilitation — HYPOTHESIS consistent with SST) |
| sit_credit | +wmc · +open (perspective work) | rides link_p decline — correction is the resource stage |
| correct_gate | flat | flat — it's the attention floor, not the trait |
| status_encode_gain | +social · +distrust(−) — deferents attend up | flat [HYPOTHESIS] |
| power_encode_loss | −empathy (the empathic powerful still attend down) | flat [HYPOTHESIS] |
| dest_decay_mult | −wmc (production bookkeeping) | ×(1+0.5·age_eff/60) — strongest age term in Part III |
| dest_fa | flat | rides lure_accept old-side knots |
| exposure_fam_gain | flat | flat — exposure is environmental, not dispositional |
| heard_update_w | −distrust (skeptic discounts hearsay) | ×(1+0.3·age_eff/60) — older listeners update more from trusted talk [HYPOTHESIS] |
| disclose_eval_gain / disclose_trust_gain | +social · −distrust | flat — disclosure works at all ages [HYPOTHESIS] |
| individ_rate | +wmc · +social (pays individuating attention) | mild decline with link_p |
| cat_prior_pull | +distrust? null — category reliance is resource, not suspicion | ×(1+0.4·age_eff/60) — older perceivers lean on schema (Hess 1990 schema reliance) |
| transference_thresh | +vivid? null — resemblance detection is perceptual | flat |
| transference_seed/fill | +fantasy (richer schema projection) | ×discrim_mult side |
| novel_pick_w | +social · +wmc (audience design) | flat [HYPOTHESIS] |
| phrase_surv_base / phrase_distinct_mult | +verbal (wording retention) | mild decline with beta_verbatim |

Explicit nulls to preserve: `g_mem` does not exempt the FAE —
intelligence doesn't buy correction resources at encoding (the
Gilbert result is about *busyness*, not ability); `meta_cal` does
not fix destination memory (tellers can't calibrate what they never
encoded); `vivid` does not seed transference (schema projection is
evaluative, not imaginal); `face_ability` does not change
`exposure_fam_gain` — DP shows *attenuated* familiarity accrual,
which rides the existing `fam_gain` load instead.

## 45. Spec changes in v3.2 (summary)

- §1 PersonModel gains fields: `eval`, `individuation`,
  `exposureCount`; traits keys carry `dim` tags.
- §2: STI correction stage (sit_constraint × correction_avail);
  status gains on E and familiarity accrual (`status_gap` from
  world-layer status tags); `exposure_fam_gain` accrual on
  sub-threshold co-presence sightings.
- §4: `dest_decay_mult` on toldTo edges; `moral_rehab` on
  positive-counter-moral trait updates.
- §5.8/§5.10: `source_cat_share` scaled by low-individuation
  coupling [HYPOTHESIS]; `familiar_only` outputs dominated by
  exposure-generated models (no code change — emergent).
- §6.11 retell gains: audience-stance read from `eval`; field
  selection novelty gate (`novel_pick_w`, `told_pen`); `phrasing`
  tokens propagate per §43.
- §6.12 chain ops: `phrasing` survival formula added.
- §6.14 credibility/disclosure: `disclose_*` updates on
  confidential/self-relevant tells, both directions.
- §6.26: transplant candidate scoring gains `exposureCount` term.
- §6.31 NEW: gossip-as-evidence trait writeback (`heard_update_w`).
- §6.32 NEW: transference seeding on PersonModel creation.
- §6.33 NEW: contagion path formalized — listener affect_tag +=
  contagion_k·speaker_now_arousal·(0.5+0.5·empathy).
- §7: +22 params (table below); §10: contract additions
  (status tags, sitConstraint, phrasing, exposureCount,
  speaker_now_arousal, confidential-tell flag semantics).

### Parameter guidance (defaults; clamp ranges in profiles §0)

| param | default | range | source |
|---|---|---|---|
| moral_primacy | 0.65 | 0.4–0.85 | Brambilla et al. 2012/2019 |
| moral_rehab | 0.4 | 0.0–0.8 | Skowronski & Carlston 1989 |
| sit_credit | 0.7 | 0.3–1.0 | Gilbert et al. 1988 |
| correct_gate | 0.6 | 0.3–0.9 | Gilbert et al. 1988 (resource stage) |
| status_encode_gain | 0.15 | 0.0–0.4 | Ratcliff et al. 2011 |
| power_encode_loss | 0.2 | 0.0–0.5 | Guinote 2007; Fiske 1993 |
| dest_decay_mult | 1.5 | 1.0–2.5 | Gopie & MacLeod 2009 |
| dest_fa | 0.05 | 0.0–0.2 | Gopie et al. 2010 |
| exposure_fam_gain | 0.02 | 0.0–0.08 | Jacoby et al. 1989 analog |
| heard_update_w | 0.4 | 0.1–0.8 | Sommerfeld et al. 2007 (HYPOTHESIS wt) |
| disclose_eval_gain | 0.08 | 0.0–0.25 | Collins & Miller 1994 |
| disclose_trust_gain | 0.10 | 0.0–0.3 | Collins & Miller 1994 |
| individ_rate | 0.15 | 0.05–0.4 | Fiske & Neuberg 1990 |
| cat_prior_pull | 1.0 | 0.0–1.0 | Brewer 1988 (weight, not prob) |
| transference_thresh | 0.6 | 0.4–0.9 | Andersen & Baum 1994 |
| transference_seed | 0.3 | 0.0–0.6 | Andersen & Chen 2002 |
| transference_fill | 0.15 | 0.0–0.4 | Andersen & Baum 1994 memory effect |
| transference_pool | 5 | 2–10 | HYPOTHESIS |
| novel_pick_w | 3.0 | 1.0–6.0 | Clark; Brennan & Clark 1996 |
| told_pen | 0.5 | 0.1–1.0 | quantity maxim (HYPOTHESIS) |
| phrase_surv_base | 0.7 | 0.3–1.0 | Pickering & Garrod 2004 |
| phrase_distinct_mult | 1.4 | 1.0–2.5 | Bartlett sharpening (HYPOTHESIS) |

## 46. Validation probes (P310–P321)

- **P310 morality primacy (MUST — sign-locked):** matched negative
  acts in moral vs competence dims — moral act moves `eval` ≥1.5×
  more; positive counterevidence repairs competence impressions
  ~2.5× faster than moral ones (moral_rehab). FAIL if eval moves
  equally across dims.
- **P311 FAE under load (MUST — sign-locked):** constrained-
  behavior observation at attention 0.9 vs 0.4 — busy observers'
  trait delta ≥1.5× rawer (situation discounted less); the
  constraint field itself equally weak in both conditions (it's
  the inference that differs, not the record).
- **P312 status asymmetry (SHOULD):** equal-frequency dyads up and
  down a status ladder — lower-status member's PersonModel
  accrues familiarity/identity faster; the higher-status member's
  model stays category-dominated longer.
- **P313 destination decay (MUST — sign-locked):** toldTo recall
  accuracy < source (who-told-me) recall on matched content at
  equal delay; the dominant error in ≥65+ profiles is the
  confident miss → measured repeat-tell rate rises with age
  (Gopie 2010 direction, not a hard number).
- **P314 exposure overreach (SHOULD):** ambient-only co-presence
  (no episodes) produces `familiar_only` cascade outputs and
  elevates that person's weight in §6.26 transplant scoring;
  identity stays near zero.
- **P315 gossip-evidence discount (MUST — structure):** the same
  trait-implying act witnessed vs told_by updates `traits[t]` at
  ~heard_update_w ratio, scaled by speaker credibility; a zero-
  credibility speaker moves traits ~0 even when believed at
  report time — believability and trait-update are decoupled
  channels. FAIL if hearsay and witness move traits equally.
- **P316 disclosure trust loop (SHOULD):** confidential tell →
  speaker.credibility up for the listener AND listener.eval up
  for the speaker (three Collins & Miller effects as two writes);
  subsequent audience tuning crosses shared_reality_gate sooner.
- **P317 individuation slope (SHOULD):** trait queries on a fresh
  PersonModel return ≥60% catPrior; after ~5 diagnostic
  encounters ≤20% catPrior. FAIL if models are born individuated.
- **P318 transference fill (MUST — falsifiable):** new person at
  sim≥thresh of a high-eval donor shows schema-consistent false
  fills at ≥transference_fill rate in early reconstructions,
  declining with individuation; below thresh → none. FAIL if
  fill persists at full rate after individuation ≥0.8.
- **P319 novelty-gated retell (SHOULD):** audience with
  shared_with⊃fields A,B hears field C ≥novel_pick_w more often;
  toldTo-decayed audiences re-hear old fields (repeat-tell
  channel meets P313).
- **P320 phrasing lineage (OBSERVE — forensic):** two-chain rumor
  split retains ≥50% of hop-1 distinctive phrasing after 3 hops;
  chain-mates share phrasing tokens above base-rate — usable as
  a lineage marker by the history browser.
- **P321 contagion heat (SHOULD):** listener affect_tag after
  retell tracks speaker_now_arousal (not record birth arousal)
  and empathy loading; a cooled teller's month-old rumor arrives
  at lower affect than a hot teller's same-age rumor.

## 47. Honest limits (Part III)

- **Status is supplied, not computed** — the spec reads a
  world-layer status tag; real status perception is itself
  inferential and biased (overweighting wealth/role cues). If the
  world layer tags only landlord/tenant, the asymmetry still
  fires correctly on the game's most important axis.
- **heard_update_w has no fitted literature value** — indirect-
  reciprocity studies show *use*, not weights. 0.4 errs
  conservative (hearsay moves traits less than witness); range
  covers the plausible space.
- **`eval` is a scalar compression** — real liking is multidim;
  moral_primacy weighting is our approximation of the dominance
  finding, not a fitted model.
- **Transference similarity** uses our flat surface (traits+tags);
  real resemblance cues include appearance, voice, relational
  pattern — the pool/threshold params absorb some of this.
- **Phrasing tokens** presuppose the dialogue layer produces
  stable surface forms to hash; where dialogue is generated
  per-tell, `phrasing` can be seeded from the content fields
  instead (degraded but still lineage-informative).
- **Destination memory age function** is our interpolation —
  Gopie gives the qualitative gradient and the miss-direction,
  not a curve; the 0.5·age_eff/60 slope is a tunable.
- **cat_prior_pull↔source_cat_share coupling** is a modeling
  hypothesis: the who-said-what literature implies it but never
  manipulated individuation directly.
- Part III still does not model **relationship rupture** —
  betrayal's asymmetric signature is in trait/cond machinery
  (§32 moral_rehab, §4.9 trust_neg_gain), but "no longer
  speaking" is a world-layer relationship state our memory
  spec can read but not set.
