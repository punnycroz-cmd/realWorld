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

---

# Part IV (v44) — the social ledger's failure modes: messengers, choruses, lopsided dyads

Parts I–III built the person store, the talk ecology, and dyadic
bookkeeping. Part IV attacks the remaining ways social memory lies:
the *messenger* gets tagged with the message, one repetitive voice
reads as consensus, telling inflates certainty, public assent
decouples from private belief, early impressions tax the later
evidence, gossip selects its targets and its tellers' reputations,
discrediting rots faster than the claim, the socially anxious replay
their performances, current feelings rewrite partner history,
eavesdropping writes thin-but-sticky records, triads get
straightened toward balance, and both members of every dyad did
most of the work. Twelve mechanisms, all landing in spec v4.3.

Citations author/year; tiers as in Parts I–III.

## 48. Spontaneous trait transference — the messenger wears the message **[CONSENSUS effect; mechanism associative not attributional]**

Skowronski, Carlston, Mae & Crawford 1998 (JPSP 74:837, 4
experiments): communicators become associated with the traits they
*describe in others* — listeners later rate the speaker as
possessing the described trait. Critically the transfer is
**associative, not inferential** (Studies 3–4: persists even when
no logical basis for inference exists; distinct mechanism from
STI §2.1 — STI needs the speaker's own behavior, STT rides mere
description). Mae, Carlston & Skowronski 1999 (JPSP 77:233):
transfers even via familiar third-party communications; Crawford,
Skowronski & Stiff 2006 — dissociable associative vs attributional
bases. Complement — the gossip stigma: habitual negative gossipers
are themselves downgraded (Farley 2011 — sharing negative gossip
costs the teller status/liking; consistent with Collins & Miller
1994's asymmetry that disclosure buys trust but *gossip about
others* buys suspicion).

Implement inside `retell`/`hearAccount` where the content carries
a trait implication about a third party (target ≠ speaker):

```
PersonModel[speaker].traits[t] += stt_gain · implication
    // stt_gain ≈ 0.05 ≈ sti_gain/3 — associative smear, no
    // diagnosticity gate, no sit_credit correction: mindless
if content is moral-negative about an absent target:
    PersonModel[speaker].eval -= stt_stigma (0.08)
    // "he's always tearing someone down" — the teller's eval pays
    // for the habit; gated to MORAL-negative (criticism), not
    // competence-negative gossip
```

Both writes are listener-local — the world doesn't mark gossips;
each listener's memory does. Emergent and falsifiable (P445): a
character who habitually reports others' dishonesty drifts
`dishonest` herself; a character who habitually praises accrues
warmth — "if you can't say anything nice" is a *memory* law.

## 49. Bahrick anchoring — the cascade's long-run floors, quantified **[CONSENSUS magnitudes]**

The §5.10 cascade tiers have had qualitative decay ordering since
v0.8 (familiarity > identity > name). Bahrick, Bahrick &
Wittlinger 1975 (JEP:G 104:54 — 392 graduates, retention
2 weeks–57 years, cross-sectional with regression controls) supply
the numbers to tighten: **name AND face recognition plus
name-face matching hold ≈90% for at least 15 years** even for
large classes; **free recall of names declines ~60% over 48
years** (negatively accelerated); recognition is insensitive to
class size while recall depends on original-learning conditions.
Bruck & Cavanagh's 25th-reunion test confirms the recognition
durability; the recall/recognition split is the load-bearing
finding: *names survive as recognizable but not producible.*

Implement as two floors in §5.10:

```
familiarity decay: once exposureCount ≥ fam_permastore_exp (50
    lifetime encounters — a real acquaintance, not a sighting),
    familiarity's β drops to beta_semantic·fam_permastore_mult
    (0.25) — plateau ≈ recognition's ~90%-at-15y
tier3 name roll: in RECOGNITION mode (copy cue present) the same
    permastore floor applies to nameStrength; in free-recall mode
    (name as retrieval target, no copy cue) it does NOT — recall
    keeps the full β_source schedule
```

Emergent: the reunion signature is structural — a character
recognizes every face at the block party, places most, and
produces a third of the names; an older character produces fewer
still (existing tot_rate knot rides on top). This is the
strongest anchor the cascade has: four numbers from one
well-controlled cross-section, no fitted model needed.

## 50. Memory for other people's relationships — RelEdge, and the balance warp **[CONSENSUS direction; params HYPOTHESIS]**

Characters remember not just persons but *edges* — who likes
whom. The earliest social-memory result is that this store is
schema-warped: De Soto 1960 (J Abnorm Soc Psych 60:417 —
paired-associate learning of social structures succeeds faster
when the structure matches relation-schema expectancies); De Soto
& Kuethe 1959 — perceivers attribute **symmetry** to
"likes"/"confides-in" but **asymmetry + transitivity** to
"influences"; De Soto, Henley & London 1968 (JPSP 8:1 — balanced
groupings learned well; structures with reversed sentiment
relations — negative within-group, positive across — are learned
poorly; **unit relations show weak or no balance effect**);
Heider 1946 + Cartwright & Harary 1956 supply the theory. Modern
network-recall work confirms compression biases in mental social
networks (Brashears & Quintane 2015 — kinship/geography/small-
world priors distort recalled networks).

Implement: new record type per observer (§1):

```json
RelEdge = {"a": "mara", "b": "jules", "kind": "sentiment|unit",
           "sign": +1, "str": 0.6, "dayObserved": 401}
```

- Edges mint on witnessed alter–alter interaction or adopted
  `told_by` relational content ("she can't stand him").
- **Symmetry assumption (sentiment edges only):** on mint, the
  reverse edge is written at `edge_sym_p` (0.75) strength of the
  forward edge — "he adores her" mints a weak "she adores him."
  Asymmetric relations (influence, status) mint no reverse edge
  (De Soto & Kuethe's asymmetry attribution).
- **Balance decay tax:** at daily tick, each sentiment edge in an
  *unbalanced* triad (self–a–b or three alters; sign product −1)
  decays at β·(1 + balance_pull) (0.06) — unbalanced edges rot or,
  at retrieval, flip sign toward balance at `balance_flip_p`
  (0.1) when the edge str < 0.4. Unit edges exempt (1968 finding).
- Emergent: "they're both her friends, they must get along" is a
  fabricated edge; the rival-of-friend edge is the one that rots;
  the neighborhood's *believed* social map is systematically
  more balanced than its real one — factions reconcile in memory
  that never reconciled in fact.

## 51. Who did the work — the >100% dyad **[CONSENSUS]**

Ross & Sicoly 1979 (JPSP 37:322 — married couples' self-reported
contributions to household tasks sum well past 100%; same for
basketball teams and joint projects): own contributions are
more *available* at recall (you stored your own actions with
prod_gain/enact_gain; theirs at listener attention), so
responsibility estimates inflate. The bias is memory-based, not
purely motivational — it grows with delay and persists for
blame-relevant tasks. Complements: Burger & Rodman 1983 — immediate
positive-outcome attributions can go other-crediting, delay flips
to self-crediting (availability rises as the shared record
thins); Campbell & Sedikides 1999 meta — self-serving bias
(d ≈ 0.5) strengthens under self-threat.

Implement on records carrying `coAgents` (joint-action events —
chores, projects, fights both parties participated in):

```
own_share stored ≈ actual · (1 + own_share_bias·(0.5 + 0.5·delayYr))
    own_share_bias ≈ 0.25 → mature claims ≈ 0.55–0.65 mean share,
    dyad sums ≈ 110–130%
negative-outcome coAgents records: reported own_share
    ×= (1 − blame_deflect) (0.7) — the self-serving arm reverses
    sign for blame; Campbell & Sedikides: threat-dependent
```

Emergent: housemates' chore memories are irreconcilable by
construction — each genuinely recalls doing most of it; after the
group project fails, everyone remembers a smaller share. This is
the single cheapest producer of believable low-grade conflict in
the spec.

## 52. One voice, heard three times, sounds like everyone **[ROBUST]**

Weaver, Garcia, Schwarz & Miller 2007 (JPSP 92:821 — 6
experiments, 1044 participants): an opinion repeated by ONE
communicator is inferred to be broadly shared at nearly the rate
of the same opinion voiced by THREE different communicators —
familiarity stands in for prevalence, and the effect survives
explicit awareness that it was one speaker. Mechanism: opinion
accessibility, not deliberate source counting — the human version
of "repetition, not variety" already in §6.3's `hearCount`
fluency.

Implement a `consensusEstimate(claim)` read — used by rumor
salience ("does everyone think this?"), shared-reality inference
for audience tuning, and the history browser:

```
effectiveVoices = nDistinctSources + same_source_pen·(hearCount −
                  nDistinctSources)
consensusEst = effectiveVoices / (effectiveVoices + voices_k)   // voices_k ≈ 4
same_source_pen ≈ 0.7 — the Weaver residual discount: repetition
    still counts, just weaker per-voice
```

Feeds: retell emission may tag `norm:"everyone knows"` when
consensusEst > 0.6 — characters *assert* consensus they hallucinated
from one relentless repeater. Emergent: the neighborhood crank
manufactures public opinion single-handedly; a secret whispered
once by many stays minority while a daily monomania becomes
"what everyone thinks."

## 53. Telling it makes you sure — retell confidence inflation **[ROBUST direction]**

Repeated retrieval raises confidence without raising accuracy
(Shaw & McClure 1996 — repeated postevent questioning inflates
eyewitness confidence; Odinot, Wolters & van Koppen 2009 —
repeated identification attempts degrade accuracy while
confidence climbs; consistent with the retrieval-fluency→
confidence pathway, Kelley & Lindsay 1993). Distinct from §6.20
corroborate_conf (social feedback) — this one needs no audience.

Implement: on each `retell`/`discussEvent` where the record
surfaces, speaker's record `conf += retell_conf_gain·(1 − conf)`
(retell_conf_gain ≈ 0.03, hard cap `retell_conf_cap` 0.95 —
never reaches certainty, always climbs). Interacts correctly
with §24 canonization: canonized records accumulate conf toward
cap while frozen — the oft-told story is maximally certain AND
frozen at whatever distortions it accrued young. Emergent: the
neighborhood's most confident witnesses are its most frequent
tellers — an inverted accuracy signal the history browser can
expose but characters cannot see.

## 54. Public assent, private dissent — the conformity split **[ROBUST distinction]**

Memory conformity research separates two channels our §6.5
collapses: **informational** — the co-witness account updates the
memory itself (dominant when own memory is weak/uncertain;
Gabbert, Memon & Allan 2003) and **normative** — public report
aligns while private belief doesn't (Wright, Self & Justice 2000;
Gabbert, Memon, Allan & Wright 2004 — conformity persists as
social compliance under pressure even when private recall is
confident). The power gradient biases the normative arm (Carol
et al. 2013 — already routed through sourceCredibility; the
pressure arm needs status directly).

Implement in `discussEvent`/`hearAccount` when listener's own
reconstructed field CONFLICTS with speaker's account:

```
if ownFieldStrength < conform_gate (0.4): existing §6.5 merge —
    informational adoption (private change)
else: normative arm — with prob conform_norm_p·(1 + status_gap₊)
    (base 0.3) the listener's EMITTED report aligns publicly while
    the stored field keeps its value and gains `dissent_mark` —
    private disagreement on file, retrievable ("I agreed, but I
    saw it differently"); beliefStatus unchanged
```

Emergent: disputes resolve publicly and persist privately — the
tenant nods at the landlord's version and stores the asterisk;
months later the asterisk is what gets retold to confidants.

## 55. Gossip chooses its target — the tell-selection ecology **[ROBUST direction; weights HYPOTHESIS]**

Gossip is not broadcast: McAndrew, Bell & Garcia 2007 ("Who do we
tell, and whom do we tell on?") — negative gossip is told
preferentially *to* allies *about* rivals and targets the
audience can act on; Feinberg, Willer, Stellar & Keltner 2012 —
prosocial (warning) gossip transmits negative-moral content about
exploiters preferentially; Dunbar, Marriott & Duncan 1997 — ~2/3
of natural conversation time is social topics, so the social
channel is the retell engine's main load. Structural constraint
from the gossip-communication literature (Eder & Enke 1991):
gossip requires a mutually-known referent — you don't gossip
about strangers to strangers.

Implement inside `retell` field/record selection (before §42's
novelty gate):

```
if record.verbatim.who is a third party (≠ speaker, audience):
    salience *= gossip_neg_gain (1.4) when the trait implication is
        moral-negative AND PersonModel[target].cheaterLoad > 0 —
        prosocial-warning channel
    salience *= gossip_known_w (0.5) if audience has NO PersonModel
        for target — gossip needs a shared referent
    salience *= (1 + 0.3·PersonModel[audience].eval∙? — simpler:
        prefer audiences with eval > 0 toward self — allies)
```

Emergent: scandal about the landlord travels along the tenant
graph and dies at its edges; gossip about the new ambient NPC
doesn't propagate because nobody has a model to hang it on;
characters become information brokers along friendship edges —
the rumor network is the relationship network, filtered.

## 56. The discrediting rots faster than the claim — sleeper effect **[ROBUST under specified conditions — Kumkale & Albarracín meta; mechanism DEBATED]**

The sleeper effect: a message initially discounted because of its
source gains influence over time as the message–source
association decays faster than message content (Hovland & Weiss
1951; Kumkale & Albarracín 2004, Psych Bull 130:143 meta — the
effect is real but conditional: requires the discounting cue
learned *after* message encoding and relative dissociation over
time). Our decay asymmetry (β_source > β_content, §4.1) already
provides the mechanism; what's missing is an explicit discredit
tag for *source-level* discounting ("turns out he made it up") —
distinct from §6.6 retraction (which marks the CONTENT doubted)
and §9 credibility (which marks the PERSON).

Implement: `hearAccount`/`feedback` may attach `discredited` to a
record (the claim's acceptance was undermined after adoption).
`discredit_str` (birth = 1.0) decays at β_source·discredit_mult
(1.4 — slightly faster than ordinary source metadata: the
discount is a single utterance). While the tag lives:

```
effective adoption weight of the record's content fields
    ×= (1 − discredit_str)   // claim suppressed while discredited
once discredit_str < 0.3: content resumes normal inference weight
    — the claim outlives its demotion
```

Emergent: "everyone said it, then it turned out X invented it —
but honestly, doesn't it still sound right?" — retracted rumors
recover in belief weeks after the correction is forgotten. The
Kumkale boundary is normative: the tag must postdate the content
(fires only when `dayObserved` of discredit > record birth).

## 57. Post-event processing — the social failure replays itself **[CONSENSUS existence; trait-gated magnitude]**

Clark & Wells 1995 model; Rachman, Grüter-Andrew & Shafran 2000;
Brozovich & Heimberg 2008 (Clin Psych Rev 28 review): after
social-evaluative events, socially anxious individuals conduct
detailed post-event review — repetitive, self-focused, *negative-
biased* replay that maintains the anxiety and worsens the
appraisal (Dannahy & Stopa 2007 — high-SA underestimates own
performance and PEP deepens it; Mellings & Alden 2000 — PEP
predicts worse later recall of the social event). This is
rehearsal, but not Rimé's sharing — it's the *solo* channel:
the event nobody was told about is the one replayed most.

Implement: records tagged `social_eval:true` (performances,
embarrassments, judgment-under-eyes — event layer supplies) with
`valence < −0.2` draw extra covert-retrieval ticks for
`pep_days` (7) at rate `pep_k·(0.5 + 0.5·neurot + 0.3·supp)` —
the anxious and the suppressors replay; each PEP tick applies
normal §4.11 storage growth AND a valence drift
`−pep_neg_drift` (0.03) — the replayed embarrassment darkens
(documented: PEP degrades self-appraisal over the week).
Distinct from `rumin_k` (§4.12 — depressive rumination is
broad negative-affect rehearsal): PEP is content-gated to
social-evaluative events and trait-gated to social anxiety, not
depression. Emergent: the socially anxious character's awkward
Tuesday is stronger and more negative a week later — the memory
worsened after the event ended; high-`supp` characters (§6.53)
get the double-bind: masking cost them the encoding, replay
grinds what's left.

## 58. The present rewrites the partner's past — eval-consistent reconstruction **[ROBUST direction]**

McFarland & Ross 1987 (JPSP 53:934): dating partners' recall of
earlier evaluations and behaviors is biased toward the *current*
relationship evaluation — improved relationships inflate
recalled warmth; degraded ones darken remembered history.
Karney & Coombs 2000 (memory bias in early marriage);
Holmberg & Holmes 1994 review — current satisfaction reconstructs
the past. Mechanistically: the PersonModel's current `eval` is a
retrieval-time schema, and §6.1/§6.4 reconstruction is schema-
compliant — this section makes the coupling explicit and
directional.

Implement in reconstruction of records about a person with a
PersonModel (target ≠ self, model.familiarity > identity_thresh):

```
valence-relevant gist fields drift toward sign(model.eval)·
    partner_eval_pull·(0.5 + 0.5·familiarity)
partner_eval_pull ≈ 0.15
```

Familiarity scaling is the documented boundary: the pull is for
*close others* — strangers' past isn't revised because there's no
"present" to reconcile it with. Emergent and load-bearing for a
Truman-show sim: post-breakup characters don't just feel worse —
their stored history of the relationship measurably grays ("we
were never really happy" is a reconstruction output, not a fact);
post-reconciliation the betrayal softens. The same mechanism
quietly maintains long marriages: current warmth continuously
repaints shared history.

## 59. Eavesdropped memory — overheard and thin **[ROBUST direction]**

Characters acquire content they were never told — ambient
overheard speech is a real acquisition channel with a known
signature: overheard "halfalogue" conversation is *attentionally
capturing* (Emberson, Lupyan, Goldstein & Spivey 2010 —
overheard one-sided speech draws attention and is remembered);
social-content bias applies (Dunbar et al. 1997 — preferential
attention to person-relevant talk); but encoding is
unaddressed — no listener-role engagement, no §19 production
gains, weak source binding (it was never directed at you — the
source tag is born half-rotted).

Implement: event layer may emit `overhear` events (speaker
present, addressee ≠ this character, no engagement). Encode with:

```
E *= overhear_w (0.5)                       // unattended channel
person-topic content: E *= overhear_person_gain (1.2)
source.who binding ×= 0.6 (born weak — "I heard it… somewhere,
someone was saying…")
no prod_gain/gen_gain; no toldTo write; shared_with NOT written
    (overheard ≠ common ground — you can't assume THEY know YOU
    heard)
```

Emergent: characters know things they were never told and cannot
place — overheard content feeds §6.10 source inference with its
weakest provenance, is the most plausible substrate for
cryptomnesia re-emission ("I just realized — wait, did I hear
that or think it?"), and makes physical co-location without
interaction still information-bearing.

## 60. Trait and age loadings (extends §§12, 28, 44)

| Param | Primary loadings | Age note |
|---|---|---|
| stt_gain | flat — associative, not ability-gated | flat (STT shows no age reduction — associative transfer is the spared kind; HYPOTHESIS) |
| stt_stigma | −distrust? null — stigma isn't skepticism | flat [HYPOTHESIS] |
| fam_permastore_* | flat — exposure count is ecological | ×none — the floors ARE the aging-insensitive tier |
| edge_sym_p | +social (assumes reciprocity) | flat [HYPOTHESIS] |
| balance_pull / balance_flip_p | +distrust? null — balance is schema not suspicion | ×(1+0.3·age_eff/60) — schema reliance grows (Hess) |
| own_share_bias | +neurot? null — availability artifact, not ego | flat; blame_deflect ×(1+0.3·max(0,defens)) |
| same_source_pen | −wmc (source counting) | ×(1+0.3·age_eff/60) — tracking distinctness declines |
| retell_conf_gain | +meta_conf? null — fluency-to-conf is reflexive | flat [HYPOTHESIS] |
| conform_norm_p | −distrust (pressure read), +consc (deference) | ×(1+0.2·age_eff/60) |
| gossip_neg_gain | +vigil (threat monitoring) | flat |
| gossip_known_w | flat — structural | flat |
| discredit_mult | flat | rides beta_source knots — older adults' discounts rot faster |
| pep_k / pep_neg_drift | +neurot · +supp | ×(1−0.2·age_eff/60) — PEP attenuates in older adults (consistent with positivity shift; HYPOTHESIS) |
| partner_eval_pull | +attach_anx (relationship-dependent schemas) | flat [HYPOTHESIS] |
| overhear_w / overhear_person_gain | +vigil · +social | overhear_w ×(1−hearing_loss) rides the v2.8 `hearing` trait |

Explicit nulls preserved: `g_mem` does not exempt STT (associative
transfer is ability-blind — the smart gossip wears the message
too); `meta_cal` does not undo retell confidence inflation (the
calibration channel reads conf AFTER the fluency write);
`wmc` does not gate the symmetry assumption (edge_sym_p is a
schema prior, not a computation); `distrust` does not block the
sleeper effect (the discount rots at the source rate regardless
of how suspicious the listener was at the time — Kumkale's
conditions are temporal, not dispositional).

## 61. Spec changes in v4.3 (summary)

- §1: new `RelEdge` record type (per-observer edge store);
  PersonModel gains nothing new (edges live beside it).
- §5.10 addendum: Bahrick floors — `fam_permastore_exp`/
  `fam_permastore_mult` on familiarity; name-tier recognition-vs-
  recall split at permastore.
- §6.54 NEW: spontaneous trait transference — `stt_gain`,
  `stt_stigma` writes to `PersonModel[speaker]` on third-party
  trait-implying retell.
- §6.55 NEW: RelEdge mechanics — `edge_sym_p` reverse-mint,
  `balance_pull` decay tax, `balance_flip_p` retrieval flips;
  sentiment edges only, unit edges exempt.
- §6.56 NEW: own-share inflation — `own_share` field on
  `coAgents` records, `own_share_bias`, `blame_deflect`.
- §6.57 NEW: `consensusEstimate` — `same_source_pen`,
  `voices_k`; retell may emit `norm:"everyone knows"`.
- §6.58 NEW: retell confidence inflation — `retell_conf_gain`,
  `retell_conf_cap`; conf rises on tell, accuracy flat.
- §6.59 NEW: conformity split — `conform_gate` routes weak-field
  conflicts to §6.5 informational merge, strong-field to
  normative arm (`conform_norm_p`, status-scaled); `dissent_mark`
  stored on private dissent.
- §6.60 NEW: gossip tell-selection — `gossip_neg_gain`,
  `gossip_known_w`, ally-audience preference.
- §6.61 NEW: sleeper effect — `discredited` tag, `discredit_str`,
  `discredit_mult`; suppressed-then-recovering adoption weight.
- §6.62 NEW: post-event processing — `social_eval:true` records,
  `pep_k`, `pep_days`, `pep_neg_drift`; neurot/supp gated.
- §6.63 NEW: partner-eval pull — `partner_eval_pull` on
  reconstruction of records about modeled persons.
- §6.64 NEW: overhear channel — `overhear` event kind,
  `overhear_w`, `overhear_person_gain`, weak source binding.
- §7: +23 params; §10: contract additions (RelEdge in snapshot,
  `overheard`/`social_eval`/`coAgents`/`discredited` tags,
  `dissent_mark`, `norm:` emission, `consensusEstimate` read).

## 62. Parameter guidance (defaults; clamp ranges in profiles §0)

| param | default | range | source |
|---|---|---|---|
| stt_gain | 0.05 | 0.0–0.15 | Skowronski et al. 1998 |
| stt_stigma | 0.08 | 0.0–0.25 | Farley 2011 |
| fam_permastore_exp | 50 | 20–200 | Bahrick et al. 1975 |
| fam_permastore_mult | 0.25 | 0.1–0.5 | Bahrick et al. 1975 (≈90% @15y) |
| edge_sym_p | 0.75 | 0.3–1.0 | De Soto & Kuethe 1959 |
| balance_pull | 0.06 | 0.0–0.2 | De Soto 1960; De Soto et al. 1968 |
| balance_flip_p | 0.1 | 0.0–0.3 | Heider 1946 (HYPOTHESIS rate) |
| own_share_bias | 0.25 | 0.0–0.5 | Ross & Sicoly 1979 |
| blame_deflect | 0.7 | 0.3–1.0 | Campbell & Sedikides 1999 |
| same_source_pen | 0.7 | 0.4–1.0 | Weaver et al. 2007 |
| voices_k | 4 | 2–10 | HYPOTHESIS scale |
| retell_conf_gain | 0.03 | 0.0–0.1 | Shaw & McClure 1996 |
| retell_conf_cap | 0.95 | 0.8–1.0 | Odinot et al. 2009 |
| conform_gate | 0.4 | 0.2–0.7 | Gabbert et al. 2003 |
| conform_norm_p | 0.3 | 0.0–0.7 | Wright et al. 2000 |
| gossip_neg_gain | 1.4 | 1.0–2.0 | Feinberg et al. 2012; McAndrew 2007 |
| gossip_known_w | 0.5 | 0.1–1.0 | Eder & Enke 1991 |
| discredit_mult | 1.4 | 1.0–2.0 | Kumkale & Albarracín 2004 |
| pep_k | 0.15 | 0.0–0.5 | Brozovich & Heimberg 2008 |
| pep_days | 7 | 2–30 | Rachman et al. 2000 |
| pep_neg_drift | 0.03 | 0.0–0.1 | Dannahy & Stopa 2007 |
| partner_eval_pull | 0.15 | 0.0–0.4 | McFarland & Ross 1987 |
| overhear_w | 0.5 | 0.2–0.8 | Emberson et al. 2010 |
| overhear_person_gain | 1.2 | 1.0–1.6 | Dunbar et al. 1997 |

## 63. Validation probes (P445–P456)

- **P445 STT double write (MUST — sign-locked):** a character who
  retells N moral-negative items about targets shows own-`eval` and
  own-trait drift toward the described traits at ≥stt_gain rate;
  a matched praise-teller drifts positive. FAIL if speakers are
  unaffected by their own content.
- **P446 reunion split (MUST — Bahrick sign-locked):** at
  exposure ≥ fam_permastore_exp and 15-y simulated delay,
  recognition-mode cascade pass ≥85% tier-1 and tier-3
  recognition ≥80%, while free-recall name production ≤60% of
  its early plateau. FAIL if recall and recognition decay
  together.
- **P447 balance warp (SHOULD):** unbalanced sentiment edges are
  recalled worse than balanced matched edges at equal delay;
  sign-flip errors concentrate on unbalanced triads; unit edges
  show no differential. FAIL if unit edges warp equally.
- **P448 own-share (SHOULD):** both members of coAgents dyads
  report mean own_share > 0.5 (dyad sums > 1.0); negative-outcome
  records reverse the sign (own share < reported for matched
  positive). FAIL if shares sum to 1.0.
- **P449 single-voice consensus (MUST):** three hearings from ONE
  speaker produce consensusEst ≥ 0.6× the three-speaker value —
  and ≥2× the single-hearing value. FAIL if consensus requires
  distinct sources.
- **P450 retell confidence inflation (SHOULD):** conf rises
  monotonically with retellCount toward cap while measured field
  accuracy is flat-to-declining — the conf–accuracy divergence
  is the probe, not the conf alone.
- **P451 conformity split (MUST — two arms):** weak-own-field
  conflicts show stored-field change (informational); strong-own-
  field + high-status-speaker conflicts show public assent +
  `dissent_mark` with beliefStatus unchanged. FAIL if the two
  arms collapse to one outcome.
- **P452 gossip ecology (SHOULD):** moral-negative third-party
  content on cheaterLoad>0 targets is retold ≥1.4× matched
  neutral; content about target-absent audiences' PersonModels
  is suppressed ~half. Rumor flow should concentrate on
  friendship edges.
- **P453 sleeper (MUST — sign-locked):** a claim adopted then
  discredited shows suppressed inference while discredit_str is
  high, recovering toward baseline as the tag decays — content
  strength held constant. FAIL if discrediting is permanent OR
  never suppresses.
- **P454 PEP (SHOULD):** neurot-high profiles show covert
  rehearsal of social_eval-negative records above matched
  non-social negatives, with valence drift negative over pep_days;
  low-neurot profiles show neither.
- **P455 partner-eval pull (MUST — sign-locked):** after a
  scripted eval reversal on a high-familiarity partner,
  reconstructions of pre-reversal records shift valence toward
  the new eval; low-familiarity targets show no pull. FAIL on
  eval-neutral reconstruction.
- **P456 overhear channel (SHOULD):** overheard person-content
  encodes at ~0.5× addressed-tell strength with weak source
  binding (source_infer failures elevated), but above matched
  non-person overheard content; no shared_with write.

## 64. Honest limits (Part IV)

- **STT magnitude in natural gossip** is untested — the lab effect
  is real but effect sizes under ecological conditions unknown;
  stt_gain errs small (1/3 of sti_gain) and stt_stigma is a
  modeling choice anchored on Farley's direction, not a fitted
  weight.
- **Bahrick is cross-sectional** — cohort and practice effects are
  regressed out, not randomized away; the ~90%/15y floor is the
  best available anchor and still an estimate.
- **Balance warp treats memory, not judgment** — De Soto measured
  learning rates; the decay-tax implementation assumes the same
  asymmetry persists in retention (reasonable, unfitted).
- **same_source_pen = 0.7** is our compression of Weaver's
  "nearly as much" — the paper shows equivalence, not a ratio;
  the knob exists so the engine can be tuned if chorus-voices
  dominate too hard.
- **conform_gate is a threshold on an internal variable** — real
  informational/normative switching involves deliberation we
  don't model; `dissent_mark` is the observable that matters.
- **PEP trait-gating** uses neurot·supp as a proxy for social
  anxiety (no soc_anx trait exists in IndivTraits — flagging as
  a possible v45 trait axis rather than inventing one here).
- **RelEdge is dyadic only** — real social-structure memory
  includes group boundaries and roles; the edge store captures
  the balance asymmetry but not clique-level schema effects.
- Part IV still leaves **collective calibration** unmodeled —
  characters cannot *know* the neighborhood's memory is
  consensus-warped; that's a viewer affordance (history browser),
  correctly.

# Part V (v56) — who keeps whom: debts, spotlights, denials, and anchors

Parts I–IV built the person store, the talk ecology, the dyadic
ledger, and its failure modes. Part V turns to the asymmetries of
*who is remembered, by whom, and why*: names die before jobs,
everyone assumes they were noticed, creditors remember what debtors
forget, groups starve the one member who knows something unique,
belief is the factory default while suspicion is the residue that
never quite washes off, the guest list is rewritten by schema,
somebody is always holding the neighborhood's calendar, a denial
rots the truth it protected while a fabrication stays half-labeled,
exclusion burns in and exaggerates outward, public events only date
private time when they moved the furniture, and the moral ledger
rewrites once and repairs at triple cost. Eleven mechanisms, all
landing in spec v5.4.

Citations author/year; tiers as in Parts I–IV.

## 65. The person cascade gets a fourth tier — semantics outlast names **[CONSENSUS]**

The §5.10 cascade (familiarity → identity → name) is right in order
but wrong in structure: names are not merely the weakest rung, they
are *qualitatively* harder than other person semantics — the
famous "Baker paradox" generalizes. McWeeny, Young, Hay & Ellis
1987 (BJP 78:143 — verified): with context, cueing, and usage
frequency equated, surname recall still loses badly to occupation
recall — it is much harder to remember a man is named Baker than
that he is a baker. Cohen 1990 (BJP 81:287 — verified): name recall
is no better than recall of *meaningless non-words* and worse than
meaningful possessions or occupations; when the name is made
meaningful (or the occupation meaningless) the deficit disappears —
names are arbitrary labels, and arbitrariness is the cost. Stanhope
& Cohen 1993 (BJP 84:51 — verified): the serial-access account
(semantics first, then name — Bruce & Young 1986) survives only
modified; distinctive names actually learn FASTER, so the
architecture is "semantics first, distinctive-name exception."
Cohen & Faulkner 1986 — the name deficit is precisely where age
bites hardest.

Implement in §5.10: insert a `personSem` tier between identity
(tier 2) and name (tier 3):

```
tier 2.5 personSem: occupation/role/relation facts about the
    person — decay at beta_semantic (they ARE semantics)
tier 3 name roll: p_name = p_sem_access · p_name_roll —
    name production is GATED on the semantic tier resolving
    ("I know she's the one who runs the bakery — the name is…")
    a name roll fired without tier-2.5 access produces the pure
    TOT state, no content
name_meaning_gain (0.3): names that coincide with a semantic
    field (Baker the baker, Marshal the landlord) get E ×
    (1 + name_meaning_gain) at the name-write — the pun relief
name_distinct_gain (0.25): phonologically distinctive names
    (Stanhope & Cohen) encode faster — rare names learn in fewer
    exposures but do not decay slower
```

Emergent: the character remembers what everyone does and forgets
what everyone is called — the block party produces fluent
occupation talk over a floor of unproduced names, and the oldest
resident produces the most TOTs. The reunion split (P446) is now
three-way: face recognized, role placed, name blanked.

## 66. The spotlight asymmetry — everyone assumes their record was shared **[CONSENSUS effect]**

Gilovich, Medvec & Savitsky 2000 (JPSP 78:211 — verified, 5
studies): people overestimate how much their actions and
appearance are noted — embarrassing T-shirt wearers estimated
~2× the actual number of observers who could recall it; group
discussants overestimated the prominence of BOTH their brilliant
and their foolish utterances. Mechanism (Studies 4–5): anchoring
on own phenomenological richness + insufficient adjustment.
Companion: Gilovich, Savitsky & Medvec 1998 — illusion of
transparency (internal states assumed to leak). Memory-relevant
corollary nobody states plainly: **a character's model of what
OTHERS stored about them is anchored on the character's OWN
record strength** — which for self-events carries the full
w_self boost that the witness's record never had.

Implement as a metamemory read used by social reasoning
(`expectOtherRecall(charId→target, record)`):

```
expected_R_other = min(1, own_R · spot_mult) · (1 − 0.15·days/30)
    spot_mult ≈ 1.0 — the anchor IS own strength; the
    insufficient adjustment is that it starts there at all
actual_R_other = the witness's real record — encoded with
    w_self=0 for them, next_in_line taxes, omit_p risk
when the other demonstrably fails to recall a self-event the
    character expected known (denied greeting, forgotten
    birthday, "who?"): mint offense record at
    spot_offense_p (0.3) — the forgotten-reads-as-slight channel
```

Emergent and dramatic: the embarrassed character avoids the
corner store for a week over a slip nobody encoded; the
housewarming host is quietly wounded that the neighbor forgot the
party she never attended; "how could you forget" disputes are
structural — both sides are honest, one side anchored. Also the
inverse mercy: characters overestimate how long their own
mistakes persist in others — shame outlives its witnesses.

## 67. The promise ledger — the creditor remembers what the debtor forgets **[ROBUST direction; asymmetry sign DEBATED→HYPOTHESIS]**

Commitments are prospective-memory records, and the two parties
to a promise hold *different kinds* of them. For the promisee,
the promise is event-cued: the debtor's face, the due date, the
shared context all trigger it — it resolves through the strong
§9 cue path. For the promiser, the same promise is increasingly
self-initiated — it must surface via `pm_self` (the weakest
channel, §9/v1.3) or not at all. Add the availability asymmetry:
Greenberg & Westcott 1983 indebtedness theory + Ross & Sicoly
1979 — obligations to self are more available than obligations
from self (the creditor rehearsed the expectation; the debtor
encoded a compliance intention under whatever task_load the
moment carried). The DIRECTION of the asymmetry (creditor memory
> debtor memory) is supported by the availability mechanism but
the social-PM literature lacks a clean controlled effect —
marked HYPOTHESIS, magnitude bounded.

Implement on `Intention` records tagged `commitment` with a
`creditor` field:

```
creditor-side clone (the promisee's copy): cueBind init
    ×= promise_cred_w (1.3) — self-relevant expectation binds
    hard to its triggers
debtor-side record: cueBind ×= promise_debt_w (0.8) — the
    promise is one of many self-made intentions, competes for
    pm_self bandwidth under task_load (§6.87)
on unresolved trigger past dueDay: creditor side mints
    breach-candidate record (valence −) at breach_p (0.6);
    debtor side — silence, the record just expires
on debtor fulfillment: BOTH sides resolve; creditor resolution
    rehearses debtor-side person-model reliability += small
```

Emergent: the rent promise, the "I'll cover your shift," the
"I'll return the ladder" — the neighborhood's grievance graph is
built by expired debtor records meeting live creditor ones, and
the debtor's confusion is genuine: they never *decided* not to,
the record just never fired. This is the promise half of the
>100% dyad (§51) — the ledger asymmetry at the obligation layer.

## 68. Hidden profiles starve — what only one member knows, the group forgets **[CONSENSUS effect]**

Stasser & Titus 1985 (JPSP 48:1467 — verified): discussion is
dominated by information members ALREADY share; unshared items
surface rarely and post-discussion recall perpetuates the
distortion. Stasser, Taylor & Hanna 1989 — discussion content
analysis: shared items overwhelmingly sampled. Stasser, Stewart
& Wittenbaum 1995 / Stasser et al. 1992 (JPSP 63:426 — verified):
the tax is gated by task framing — 67% of "solve-set" groups vs
35% of "judge-set" groups discovered the hidden profile; the
mechanism is sampling, not suppression. The memory corollary the
substrate needs: shared records get re-aired → §53 retell
rehearsal → strength grows; uniquely-held records get ZERO group
rehearsal — they decay on a solo schedule while the shared
corpus compounds.

Implement in group-discussion sampling (before the §42 novelty
gate — hidden-profile starvation is a *sampling* bias upstream
of novelty):

```
P(record surfaces in group talk) ∝ holders(record)^hp_exp
    hp_exp ≈ 0.7 — a record held by all N is ~(N/1)^0.7 ≈
    4–5× as likely to surface as a solo-held one at N=8
solve_set: if the conversation goal is tagged problem-with-
    answer (world supplies), hp_exp ×= solve_set_relax (0.5)
    — the murder-mystery mode halves the tax, doesn't remove it
unshared records receive no retellCount growth — normal decay;
    emergent half-life advantage for shared corpus ≈ 2×
```

Emergent: after the tenants' meeting, everyone remembers the
complaints everyone already had; the one resident who knew the
building's actual rule never surfaced it, and three months later
she doesn't remember it either — the group forgot *through* her.
The information network and the rehearsal network are the same
network, which is why unique knowledge is fragile.

## 69. Truth-default and the suspicion residue — belief is the baseline, doubt is what lingers **[CONSENSUS baseline; residue HYPOTHESIS-shaped]**

Levine 2014 (J Lang Soc Psych 33:378 — verified, Truth-Default
Theory): humans presume honesty passively — the thought that
maybe we shouldn't believe doesn't even arise until a TRIGGER
breaks the default; crucially, TDT rejects cue-based detection
(nonverbal "tells" make people WORSE detectors) — suspicion is
triggered by content inconsistency, implausibility, or
third-party flagging, not by demeanor. Bond & DePaulo 2006
(Pers Soc Psych Rev 10:214 — verified: 206 studies, 24,483
judges): 54% overall accuracy; the asymmetry is diagnostic —
61% of truths classified correctly vs 47% of lies — people are
truth-biased, not lie-blind. What the literature adds for us:
once triggered, suspicion has no clean off-switch — the
discredited-source work (§56 sleeper) shows the doubt and the
claim decouple, and the doubt is the survivor.

Implement in `hearAccount`:

```
default: believe_p computed WITHOUT a demeanor channel —
    there is no lie-cue read (locked null: no shifty_eyes param;
    TDT is explicit that cue-reading is the failed path)
triggers (any): content contradicts listener's own strong field
    (> conform_gate); plaus fails below plaus_min·0.7; speaker
    PersonModel.credibility < 0.3; flagged by a higher-cred
    third party
on trigger: mint `suspicion` tag on PersonModel[speaker],
    str 0.3, decay β_source·susp_persist (0.7 — SLOWER than
    source decay: the doubt outlives what it doubted)
suspicion tag effect: future believe_p for that speaker's
    accounts ×(1 − 0.2·susp_str) — a soft prior, never a veto;
    tag never emits as a value (C-tier invisible — the
    character has "a feeling," not a number)
```

Emergent: the smooth liar is believed at default forever; the
awkward truth-teller loses nothing (no demeanor channel exists
to punish); and the one caught lie writes a residue that shades
everything that speaker says for months — "I can't point to
why, I just don't quite buy it from her" is the tag's exact
phenomenology. Detection is near-chance at the moment of the
lie and slowly, vaguely corrective afterward.

## 70. Who was there — co-presence decays to the usuals **[ROBUST direction; fill rate HYPOTHESIS]**

Simons & Levin 1998 (Psychon Bull Rev 5:644 — verified): HALF of
pedestrians failed to notice their conversation partner was
swapped for a different person mid-interaction — and detection
depended on social group: same-group pedestrians noticed,
different-group didn't. Attention to *which specific person* is
present is thinner than anyone believes. Co-presence is a field,
not a fact: attendee lists are reconstructed, not read.

Implement: multi-actor events mint an `attendees` list field;
each co-present non-interacting member encodes at
E·copres_w (0.6 — they're scenery, not actors):

```
copres_w ×(1 − group_blind·(1 − same_group)) — Simons & Levin's
    moderation: out-group attendees encode ~40% thinner
    (group_blind ≈ 0.4); group = cast cohort / role / tenure
at recall, missing attendee slots fill by schema: sample from
    the place's routine co-occurrence distribution — the usuals
    get inserted at copres_schema_fill (0.3) rate even when
    absent; one-time visitors are the first slots dropped
```

Emergent: "was she at the party?" produces confident answers
built from who's ALWAYS at the party — the regular is
remembered at events she missed, the newcomer is forgotten from
the event he attended. Alibi memory is exactly this weak: being
somewhere is only as memorable as being *surprising* there.

## 71. Memory labor — somebody keeps the relational calendar **[CONSENSUS existence; mechanization HYPOTHESIS]**

Rosenthal 1985 (J Marriage Fam 47:965 — verified, stratified
sample, Hamilton ON): more than half of extended families name a
**kinkeeper** — the person who keeps members in touch, runs the
rituals, carries the reminders; ~3/4 of kinkeepers are women;
median tenure ~20 years; the position transmits mother→daughter;
families WITH a kinkeeper show measurably more interaction and
ritual observance. Kinkeeping is a *position in a division of
labor* — the relational prospective-memory work is allocated,
not distributed. The memory-mechanics consequence: the
neighborhood's birthdays, check-ins, anniversaries, and "haven't
seen him in a while" flags live disproportionately in ONE
character's Intention store — and other characters' PM triggers
for relational events are largely *external cues supplied by the
keeper's prompting* (transactive structure, §8/§27).

Implement:

```
IndivTraits keeper ∈ N(0,1), loading +consc·+social·+empathy;
    documented skew: bible-level role pin (Rosenthal's 3/4)
relational Intentions (birthdays, rituals, overdue-visit flags)
    mint at p ∝ (0.3 + keeper_mint·keeper) — the keeper holds
    ~2–3× the relational calendar (keeper_mint ≈ 0.7)
keeper's emitted reminders act as OTHER characters' cueBind
    boost: being told "it's her anniversary" fires the listener's
    dormant intention at keeper_cue_w (1.0 — a full external cue)
keeper absence (departure, illness, rift): the reminder channel
    dies → other characters' relational PM failure rate rises
    to the uncued pm_self rate; the calendar orphans
```

Emergent: while the keeper thrives, the block celebrates itself;
when she leaves, nothing is decided — birthdays just stop being
noticed, and residents feel the thinning as "we used to do
things" without being able to name what changed. The kinkeeper
is the neighborhood's external memory organ, and her absence is
a lesion, not a vacancy.

## 72. The liar's ledger — denials rot the truth, fabrications stay labeled **[CONSENSUS for components; composite HYPOTHESIS]**

Otgaar & Baker 2018 (*Memory* 26:2 — verified, the MAD framework:
memory outcome is contingent on lie TYPE): **false denials**
induce forgetting of the denied content — Otgaar, Howe, Smeets &
Wang 2016 (JARMAC 5:168 — verified: denial-induced forgetting,
DIF; the act of denial monopolizes resources and denies the
content its rehearsal; external denials undermine belief, own
denials undermine memory — the two denial arms dissociate).
**Fabrications** differ: Pickel 2004 (self-generated
misinformation becomes believed truth over time); Otgaar et al.
2014 — people retain good source memory for having FABRICATED
("I described the thing that wasn't there" is remembered as a
lie) but poor source memory for having DENIED ("did I say that
didn't happen?") — denials are cheap, fabrications are
expensive, and the accounting differs. Compounds with §6.76:
the emitted lie consolidates as "claimed" and wins its own
fluency race.

Implement two ops on the liar's own store:

```
deny(record, field): the denied field decays ×(1 + dif_mult)
    (0.5) for dif_days (7) — resource monopolization starves
    rehearsal; the denial act itself encodes at
    deny_src_weak (0.5) source binding — "did I deny that?"
    is itself deniable in memory
fabricate(content): mints a record flagged lie-src at birth —
    but gen_gain applies (self-generated > heard), and the
    lie-src flag decays at beta_source·lie_src_weak (existing
    §4.6 param) while content gains normal retell fluency —
    at flag-death the fabrication competes as unmarked memory
    (Pickel path); source memory for the FABRICATION act is
    strong — the liar usually knows they made it up, which is
    why the flip is fluency-driven, not instant
```

Emergent: the character who "just said it never happened"
genuinely loses the event — later honesty is impaired at the
record level; the character who invented a story keeps a labeled
lie that, told often enough, walks around without its label.
Two lie types, two memory fates — and only the fabricator can
still tell you it was a lie.

## 73. Exclusion encodes hot — being left out is a trauma-lite record **[CONSENSUS on encoding strength; exaggeration HYPOTHESIS]**

Williams's ostracism program (Williams 2007 review; Williams &
Nida 2011): even trivial, ephemeral exclusion (a ball-toss
game with strangers, a text thread that goes quiet) produces
immediate need-threat — belonging, control, self-esteem,
meaningful existence all dip, and the response is fast and
automatic. Eisenberger, Lieberman & Williams 2003 (Science
302:290): exclusion engages dorsal ACC — the social-pain
overlap. Memory consequence: exclusion events carry
self-relevant negative affect at near-trauma salience but at
ordinary-event detail quality — a hot tag on a thin record,
which is exactly the configuration that reconstructs worst.

Implement:

```
events tagged exclusion:true (world tags: uninvited party seen,
    meeting held without them, conversation that stopped on
    arrival): E ×(1 + ostrac_gain) (0.6), decay β ×
    (1 − ostrac_persist) (0.3), arousal tag +0.2
reconstruction: scope drift — excl_scope_drift (0.2): reported
    breadth of the exclusion drifts toward total ("nobody
    wanted me there" — a one-person slight becomes a unanimous
    one; the record's thin detail can't resist the hot gist)
secondary: excluder PersonModel gains suspicion/cheaterLoad
    at stt_gain-like rate — the ledger books the exclusion
    to whoever the schema can hold responsible
ostrac_vigil (0.2): post-exclusion, ambiguous omissions
    (unanswered text, closed conversation) re-encode as
    exclusion:true candidates at elevated rate — the
    hypervigilant detection loop
```

Emergent: the excluded character's grievance is real, durable,
and systematically larger than the event; the exclusion ripples
into person-model degradation that the excluder never coded as
harm. The neighborhood's coldest records are its hottest.

## 74. Living-in-history anchors — public events date private time, conditionally **[CONSENSUS — including the boundary condition]**

Brown, Lee, Krslak, Conrad, Hansen, Havelka & Reddon 2009
(Psych Sci 20:399 — verified, cross-national, 18 samples):
public events organize autobiographical memory **only when they
directly, forcefully, and durably disrupted daily life** —
Bosnians dated mundane memories by the civil war, Izmit Turks
by the 1999 earthquake; but 9/11 — historically enormous —
produced essentially ZERO landmark references in American
dating protocols. Personal significance, not historical
importance, writes the landmark. Mechanism: events that
disrupted routines mint historically-defined autobiographical
periods (H-DAPs) — lifetime periods delimited by the public
event, which then serve as dating anchors for everything inside
them.

Implement on broadcast events:

```
if event.disrupt ≥ h_dap_thresh (0.7 — actually altered
    routines: closed street, lost home, weeks of changed days;
    NOT merely arousing): mint anchor record flagged h_dap:true,
    always permastore-eligible
dateEstimate (§6.15): when a target event and an anchor share
    era (same side of the boundary), dating error σ ×=
    (1 − anchor_date_gain) (0.3); events separated BY an anchor
    are dated relative ("that was before the fire") — the
    era-split itself is a retrieval aid
non-disruptive famous events mint NO anchor regardless of
    conf/arousal — locked: flashbulb conf is not a calendar
```

Emergent: the neighborhood shares a chronology only for what
changed the streets — the fire, the flood, the months the café
was boarded up — and dates everything else loosely; "the year
of the blackout" is a real cognitive object only for residents
whose routines broke, which is also why the tourists and the
tenants remember the same event on different calendars.

## 75. Impression revision asymmetry — the moral ledger rewrites once, repairs at triple cost **[CONSENSUS direction; magnitudes HYPOTHESIS]**

Mende-Siedlecki, Baron & Todorov 2013 (J Neurosci 33:19406 —
verified): impression updating is asymmetric BY DOMAIN —
diagnostic value drives it; negative moral behavior is maximally
informative (immoral acts are rare and intentional) so moral
impressions update hardest on bad evidence; ability impressions
update more symmetrically. Brambilla, Sacchi, Rusconi & Goodwin
2021 (Eur Rev Soc Psych — the domain program): morality
dominates global evaluation both at formation AND updating.
Reeder & Brewer 1979 — the schema asymmetry that generates it:
immoral behavior is diagnostic of immoral people (good people
can't do it), but moral behavior is only weakly diagnostic
(everyone performs it); ability inverts the pattern. Skowronski
& Carlston 1987/1992 — the negativity-effect canon underneath.

Implement in PersonModel trait/eval updating:

```
revision gains by dimension×valence:
    moral-negative: rev_moral_neg (1.5) — one dishonest act
        rewrites the ledger
    moral-positive: rev_moral_pos (0.4) — goodness is
        expected, weakly diagnostic
    ability both signs: rev_abil (0.8) — symmetric
redemption tax: once model.eval < moral_bad_thresh (−0.3) on
    a moral basis, incoming moral-positive evidence counts at
    1/moral_repair_k (k ≈ 3) — repair is possible and
    disproportionately expensive
```

Emergent: the landlord's one petty dishonesty out-weighs his
year of fairness — not because anyone is vindictive, but
because negative moral evidence is *more informative* and memory
prices it that way; redemption arcs are real but run at a third
of the descent rate, which is why they take seasons, not
episodes.

## 76. Trait and age loadings (extends §§12, 28, 44, 60)

| Param | Primary loadings | Age note |
|---|---|---|
| name_meaning_gain / name_distinct_gain | flat — structural | flat (the RELIEF doesn't age; the name roll does — rides tot_rate) |
| spot_mult | +self_srv? weak — anchoring is universal; −persp_obs insufficient | flat [HYPOTHESIS]; older adults show REDUCED spotlight in some work — ×(1−0.2·age_eff/60) HYPOTHESIS |
| spot_offense_p | +attach_anx (rejection sensitivity reads forgetting as slight) | flat |
| promise_cred_w / promise_debt_w | +consc shrinks BOTH the gap and the base rate (conscientious people just do the thing); +self_srv widens the gap | debtor arm rides pm_self decline — older debtors forget more (age-PM paradox preserved) |
| hp_exp | −wmc (better trackers surface unique info); −expert (domain holders push their unique items) | flat [HYPOTHESIS] |
| solve_set_relax | flat — task frame, world-supplied | flat |
| susp_persist | +distrust | ×(1+0.3·age_eff/60) — older adults' suspicion lingers longer (documented tendency to remember untrustworthy faces slower to extinguish; DEBATED) |
| truth_def_bias | −distrust (the default itself lowers) | flat |
| copres_w / group_blind | copres_w +vigil; group_blind −social | group_blind ×(1+0.2·age_eff/60) — out-group encoding thins |
| copres_schema_fill | +gc (gist-reconstructors fill harder) | ×(1+0.3·age_eff/60) — schema reliance grows (Hess) |
| keeper_mint / keeper_cue_w | keeper trait (bible pin); cue_w flat | flat — the labor doesn't age, the capacity does (rides pm_self) |
| dif_mult | +supp (habitual suppressors deny cheaper, rot faster); −consc | flat [HYPOTHESIS] |
| deny_src_weak | flat — resource artifact | ×(1+0.2·age_eff/60) rides source decay |
| ostrac_gain / ostrac_persist | +attach_anx·+neurot; −scc (self-concept clarity blunts) | ×(1−0.15·age_eff/60) — exclusion hurts less, SOC selection |
| excl_scope_drift / ostrac_vigil | +neurot·+vigil | flat |
| h_dap_thresh / anchor_date_gain | flat — ecological gate | flat — anchors are the aging-robust tier (landmark organization preserved) |
| rev_moral_neg / rev_moral_pos / moral_repair_k | +distrust raises neg gain AND repair cost; +reap lowers persist | ×(1+0.15·age_eff/60) on repair_k — older impressions revise slower (Hess schema reliance) |

Explicit nulls preserved: `g_mem` does not shrink the spotlight
(anchoring is not ability); `wmc` does not rescue debtor
promises beyond the normal pm_self loading (the asymmetry is
cue-structure, not capacity); `meta_cal` cannot read the
suspicion tag (it's M-tier — the character feels it, can't
report it); `distrust` does not create a demeanor channel —
suspicious characters are not better lie detectors, they're
just suspicious earlier and longer (TDT: cue-reading is the
failed path for everyone); `keeper` does not boost nonrelational
PM (it's a role allocation, not a general capacity).

## 77. Spec changes in v5.4 (summary)

- §5.10 addendum: `personSem` tier inserted between identity and
  name; name production gated on semantic access;
  `name_meaning_gain`/`name_distinct_gain` on name-write.
- §6.89 NEW: spotlight asymmetry — `expectOtherRecall` read,
  `spot_mult`, `spot_offense_p` offense minting.
- §6.90 NEW: promise ledger — `commitment`/`creditor` fields on
  Intention; `promise_cred_w`, `promise_debt_w`, `breach_p`.
- §6.91 NEW: hidden-profile starvation — `holders(record)`,
  `hp_exp`, `solve_set_relax`; group-talk sampling bias.
- §6.92 NEW: truth-default + suspicion residue — trigger list,
  `suspicion` tag, `susp_persist`, `truth_def_bias`; locked
  null: no demeanor/cue channel.
- §6.93 NEW: co-presence decay — `attendees` field,
  `copres_w`, `group_blind`, `copres_schema_fill`.
- §6.94 NEW: memory labor — `keeper` trait, `keeper_mint`,
  `keeper_cue_w`; relational-calendar Intention allocation.
- §6.95 NEW: the liar's ledger — `deny`/`fabricate` ops,
  `dif_mult`, `dif_days`, `deny_src_weak`; fabrication src-flag
  decay path (rides lie_src_weak).
- §6.96 NEW: exclusion encoding — `exclusion:true` tag,
  `ostrac_gain`, `ostrac_persist`, `excl_scope_drift`,
  `ostrac_vigil`.
- §6.97 NEW: living-in-history anchors — `disrupt` field,
  `h_dap_thresh`, `h_dap` flag, `anchor_date_gain` on
  dateEstimate; locked null: non-disruptive famous events mint
  no anchor.
- §6.98 NEW: impression revision asymmetry — `rev_moral_neg`,
  `rev_moral_pos`, `rev_abil`, `moral_bad_thresh`,
  `moral_repair_k`.
- §7: +21 params +1 trait (keeper); §10: contract additions
  (Intention `commitment`/`creditor` fields; `suspicion`
  M-tier tag; `attendees`/`exclusion:true`/`h_dap` record
  fields; `expectOtherRecall` read; `deny`/`fabricate` ops).

## 78. Parameter guidance (defaults; clamp ranges in profiles §0)

| param | default | range | source |
|---|---|---|---|
| name_meaning_gain | 0.3 | 0.0–0.6 | Cohen 1990 |
| name_distinct_gain | 0.25 | 0.0–0.6 | Stanhope & Cohen 1993 |
| spot_mult | 1.0 | 0.5–1.5 | Gilovich et al. 2000 |
| spot_offense_p | 0.3 | 0.0–0.7 | HYPOTHESIS rate |
| promise_cred_w | 1.3 | 1.0–1.8 | Greenberg & Westcott 1983 + PM cue structure |
| promise_debt_w | 0.8 | 0.5–1.0 | availability asymmetry (HYPOTHESIS sign) |
| breach_p | 0.6 | 0.2–0.9 | HYPOTHESIS |
| hp_exp | 0.7 | 0.3–1.5 | Stasser & Titus 1985; Stasser et al. 1989 |
| solve_set_relax | 0.5 | 0.2–1.0 | Stasser et al. 1992 (67/35 solve/judge) |
| truth_def_bias | 0.61 | 0.5–0.8 | Bond & DePaulo 2006 (61% truth accuracy) |
| susp_persist | 0.7 | 0.3–1.0 | HYPOTHESIS (sleeper-adjacent) |
| copres_w | 0.6 | 0.3–0.9 | Simons & Levin 1998 |
| group_blind | 0.4 | 0.0–0.8 | Simons & Levin 1998 (group moderation) |
| copres_schema_fill | 0.3 | 0.0–0.6 | HYPOTHESIS rate |
| keeper_mint | 0.7 | 0.0–1.5 | Rosenthal 1985 (role allocation) |
| keeper_cue_w | 1.0 | 0.5–1.5 | transactive-cue equivalence |
| dif_mult | 0.5 | 0.0–1.0 | Otgaar et al. 2016 (DIF) |
| dif_days | 7 | 2–30 | HYPOTHESIS window |
| deny_src_weak | 0.5 | 0.2–0.9 | Otgaar et al. 2014 |
| ostrac_gain | 0.6 | 0.2–1.0 | Williams 2007; Eisenberger et al. 2003 |
| ostrac_persist | 0.3 | 0.0–0.6 | HYPOTHESIS (need-threat durability) |
| excl_scope_drift | 0.2 | 0.0–0.5 | HYPOTHESIS |
| ostrac_vigil | 0.2 | 0.0–0.6 | HYPOTHESIS |
| h_dap_thresh | 0.7 | 0.5–0.9 | Brown et al. 2009 (disruption gate) |
| anchor_date_gain | 0.3 | 0.0–0.6 | Brown et al. 2009 |
| rev_moral_neg | 1.5 | 1.0–2.5 | Mende-Siedlecki et al. 2013 |
| rev_moral_pos | 0.4 | 0.1–0.8 | Reeder & Brewer 1979 |
| rev_abil | 0.8 | 0.4–1.2 | Mende-Siedlecki et al. 2013 |
| moral_bad_thresh | −0.3 | −0.6–0.0 | scale choice |
| moral_repair_k | 3 | 1.5–6 | HYPOTHESIS ratio |

## 79. Validation probes (P578–P589)

- **P578 person-semantics gate (MUST — sign-locked):** name
  production fails at ≥2× the rate of occupation/role production
  for the same persons at matched delay; name production without
  resolved tier-2.5 access is ~0 (names never out-produce
  semantics). Meaningful-name advantage replicates (Baker <
  baker gap closes). FAIL if names and occupations decay
  together.
- **P579 spotlight asymmetry (MUST — sign-locked):**
  expectOtherRecall for self-events exceeds the witnesses'
  actual R by ≥1.5× on average; when a witness fails a
  scripted recall of a self-relevant event, offense records
  mint at ≥spot_offense_p and zero mint on successful recall.
  FAIL if expected≈actual.
- **P580 promise asymmetry (MUST — sign-locked):** shared
  commitment pairs show creditor-side breach-detection rate ≥
  1.4× debtor-side fulfillment-cue rate at equal delays; raising
  task_load degrades debtor resolution, leaves creditor
  detection intact. FAIL if the asymmetry flips sign.
- **P581 hidden-profile starvation (MUST):** in a 4-member
  group-discussion sim, records held by all surface ≥3× more
  than matched solo-held records; after 30 days the solo-held
  retention gap widens (rehearsal compounding, not just
  sampling). Solve-set framing cuts the surface ratio ≥40%.
  FAIL if solo-held items surface equally.
- **P582 truth-default + residue (MUST — two arms):** with no
  trigger, believe_p ≥ truth_def_bias regardless of speaker
  demeanor fields (locked null — demeanor params absent); after
  one triggered-and-confirmed lie, that speaker's later TRUE
  accounts show reduced believe_p for weeks while other
  speakers are unaffected. FAIL if detection rides a
  demeanor/cue variable OR if suspicion never outlives the
  discredited claim.
- **P583 co-presence fill (SHOULD):** attendee reconstruction
  inserts routine-regular false positives at ≥copres_schema_fill
  rate and drops one-time visitors first; out-group attendees
  are under-counted relative to in-group at matched true
  presence. FAIL if reconstruction is veridical.
- **P584 keeper allocation (SHOULD):** with keeper=+1.5 on one
  member, relational Intention mints concentrate ≥2× on that
  character; removing the keeper raises others' relational PM
  failure to the uncued pm_self rate. FAIL if intentions
  distribute uniformly.
- **P585 liar's ledger (MUST — two arms, sign-locked):**
  deny-ops degrade the denied record's detail below matched
  suppressed-but-not-denied records, AND degrade source memory
  for the denial act; fabricate-ops mint src-flagged records
  whose flag decays while content fluency grows — at flag
  death the fabrication enters believe_p competition unmarked.
  FAIL if denial and fabrication share one fate.
- **P586 exclusion heat (SHOULD):** exclusion:true records
  show encoding above matched negative-social records and
  slower decay; reconstruction reports systematically wider
  scope than encoded breadth (excl_scope_drift); subsequent
  ambiguous omissions re-tag as exclusion candidates at
  ostrac_vigil rate.
- **P587 H-DAP gate (MUST — boundary-locked):** a high-arousal
  but zero-disruption broadcast event mints NO anchor and
  produces no dating improvement for neighboring events; a
  high-disruption moderate-arousal event mints an anchor AND
  reduces dateEstimate σ for same-era events by ≥20%. FAIL if
  arousal alone writes anchors.
- **P588 moral revision asymmetry (MUST — sign-locked):** one
  moral-negative act moves eval more than three matched
  moral-positive acts (rev ratio >2); ability-negative vs
  ability-positive moves are symmetric within 20%; post-threshold
  repair requires ≥moral_repair_k× the positive evidence mass.
  FAIL if morality updates symmetrically.
- **P589 compound social ledger (SHOULD):** a character who is
  debtor-forgetful + spotlight-anchored + keeper-absent produces
  the composed pattern (missed promise + offense at others'
  forgetting + no relational calendar) without interaction
  terms — additivity audit across §§6.89–6.94.

## 80. Honest limits (Part V)

- **The promise asymmetry's sign is a modeling commitment** —
  availability and cue-structure both predict creditor > debtor
  memory, but the social-PM literature lacks the clean
  controlled effect; promise_cred_w/debt_w are bounded to keep
  the gap human-scale, and P580 will catch a flip.
- **Suspicion residue is mechanism-light** — TDT and the sleeper
  work jointly predict doubt-outlives-claim, but susp_persist's
  0.7 is a shape, not a fit; treat as the tunable that sets how
  paranoid a neighborhood a single caught lie produces.
- **Hidden-profile parameters compress group size** — hp_exp is
  one exponent over 2–8 members; the real sampling bias scales
  nonlinearly with N and agenda structure we don't model.
- **The keeper role is documented, not explained** — Rosenthal
  gives occupancy, gender skew, tenure, transmission; the
  trait-loadings are our mechanization (consc·social·empathy is
  a proxy, not a validated composite), and the cue-substitution
  equivalence (keeper_cue_w=1.0) is asserted.
- **DIF windows are guesses** — dif_days=7 extrapolates the lab
  session-to-retest gap; the denial-act source weakness is
  better grounded than its duration.
- **Ostracism scope-drift is our extension** — need-threat and
  social-pain are established; the *reconstructive exaggeration*
  of exclusion breadth is inferred from hot-tag/thin-record
  mechanics, not measured.
- **H-DAP anchoring is the best-grounded new piece** — Brown
  2009 supplies both the effect and its boundary (disruption,
  not importance); h_dap_thresh is the one knob and it's an
  ecological judgment call about what "changed routines" means
  for a Mission block.
- **Moral revision magnitudes are direction-locked only** —
  Mende-Siedlecki establishes the asymmetry; rev ratio 1.5/0.4
  and repair_k=3 are calibrated to produce the observed
  phenomenology (fast fall, slow redemption), not fitted values.
- Part V still leaves **collective commemoration** unmodeled —
  the neighborhood ritual that *deliberately* rehearses an
  anchor (anniversary gatherings) is world-layer content, not a
  memory mechanism; noted for world-builder, not spec'd here.
