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
