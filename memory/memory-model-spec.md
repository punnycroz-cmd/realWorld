# Memory Model Spec v2.2 — implementable human-like memory for RW characters

> **v2.2 note (character-profiles II — the cast pass):**
> `memory/cast-profiles.md` compiles the 8 mains from the world-track
> bibles and forced three sourced mechanisms into the spec.
> **Migration bump** — the §4.1 bump term evaluates over a per-character
> `bump_windows` list compiled from `ProfileInput.lifeEvents`
> (immigration shifts/doubles the bump, Schrauf & Rubin 1998/2001) —
> §4.1. **Secrecy is mind-wandering** — `confidential` records intrude
> on the ambient scan via `secret_mindwander`, ~2× concealment rate
> (Slepian et al. 2017) — §5.7/§6.22. **Attachment avoidance** — new
> IndivTraits axis `attach_avoid` with preemptive `attach_encode_loss`
> on `attachment:true` events + `attach_ret_cost` on retrieval,
> non-attachment emotional records untouched (Edelstein 2006; Fraley
> et al. 2000) — §2. **Self-concealment** — `self_share_pen` splits
> self-relevant transmission from `share_k` (Larson & Chastain 1990) —
> §4.13/§6.22. +6 params in §7; probes P201–P210 in
> validation-design.md §21. All optional, default-neutral.

> **v2.1 note (formal-model III — the measurement layer):**
> `memory/formal-model.md` Part III (§§18–25) closes the last informal
> holes: **the similarity operator** — `simOp(a,b,mask)` with a
> per-callsite field-weight table replaces nine ad-hoc sim uses; names
> match phonologically (Conrad & Hull 1964), when-distance is a
> gradient feature (Friedman 1993) — §11.1 + §4.2; **metamemory
> instruments** — `fok` on failed/TOT recall built from accessibility,
> not accuracy (Koriat 1993; episodic-only age deficit, Souchay et al.
> 2000) and `jol` at encode with immediate-JOL fluency inflation
> (Nelson & Dunlosky 1991) — §5.21; **steady-state numerics** — the
> closed-form census says caps are burst bounds, forgetting is the
> regulator (formal-model §20); **distribution axioms** — truncated
> Gaussians, uniform drift steps, integer RNG, namespaced opSeq
> (formal-model §22). +11 params in §7; probes P193–P200 in
> validation-design.md §20. All default-neutral.

> **v2.0 note (social-memory II — the talk ecology):**
> `memory/social-memory.md` Part II (§§18–31) deepens the social layer:
> **sharing motive** — retell propensity driven by |affect| with a shame
> suppressor, and talk never extinguishes emotion (Rimé 1998; Zech &
> Rimé 2005 recovery illusion) — §4.13; **retrieval-induced
> facilitation** — integrated unsurfaced material is boosted, not
> suppressed (Chan, McDermott & Roediger 2006) — §5.8; **corroboration
> inflates confidence** asymmetrically and irreversibly (Wells &
> Bradfield 1998) — §6.20; **common-ground overreach** — co-presence
> mints assumed-knowledge entries that are wrong at trait rates
> (Keysar; Birch & Bloom 2007) — §6.21; **interpret bias** — ambiguous
> behavior assimilates to the person model at encoding while contrary
> behavior still gets incongruity_gain (Anderson et al. 2011) — §2;
> **confidentiality decays faster than content** — secrets leak on a
> schedule, silently (source-amnesia asymmetry) — §2/§6.22;
> **absorption** — repeated rich told_by narratives can flip
> provenance to experienced (Hyman et al. 1995; Pillemer et al. 2015)
> — §6.23; **canonization** — the oft-told story freezes, warts and
> all, and then resists late misinformation (Marsh & Tversky 2004) —
> §6.24; **joint attention** amplifies encoding valence-symmetrically
> (Boothby et al. 2014) — §2; **transactive loss** — an absent
> directory-partner leaves pointer-rot grief (Harris et al. 2014) —
> §6.14. +17 params in §7; probes P183–P192 in
> validation-design.md §19. All optional, default-neutral.

> **v1.9 note (individual-differences II — state noise, language,
> culture, metacognition):** `memory/individual-differences.md` Part II
> (§§9–19) adds the second trait block. **New params (§7):**
> `iiv_sigma` (day-to-day inconsistency, age/WMC-scaled — Hultsch 2000),
> `omit_p` (mind-wandering encoding omission — Smallwood & Schooler;
> Unsworth & McMillan), `lang_mismatch` (language-of-encoding cue
> attenuation — Marian & Neisser 2000), `meta_cal`/`complaint_k`
> (metamemory slope + complaint decoupling — Kleitman & Stankov 2007;
> Jonker 2000), `check_conf_loss` (verification erodes confidence —
> van den Hout & Kindt 2003), `expert_lure` (in-domain semantic-lure
> bonus — Castel et al. 2007), `intox_encode_mult`/`intox_state_dep`
> (alcohol state — White 2003 anterograde). **Formula changes:**
> `age_eff = (age_now − reserve·reserve_shift)·(1 + 0.2·aging_rate −
> 0.15·fitness)` — individual aging slopes (Salthouse; Erickson 2011);
> record schema gains optional `lang`; `cueContext` gains `lang`,
> `verify`, `intox`. New explicit nulls: bilingual→wmc (Paap),
> meta_conf→accuracy, checker→accuracy, culture_self→β, fitness→β
> (individual-differences.md §17). All v1.9 fields optional, default
> neutral; monolingual `langs` makes `lang_mismatch` dead code.

> **v1.8 note (false-memory II — candidates, claims, coercion):**
> `memory/false-memory.md` Part II fixes what v0.6 got wrong at the
> storage layer and adds the self-authored channels: **adoption is
> candidate competition, never overwrite** — verbatim fields are
> candidate sets `{value, candStrength, provenance, day}`, originals
> survive and resurface (McCloskey & Zaragoza 1985; Lindsay & Johnson
> 1989; Tousignant 1986) — §6.3; **lies believed** — `claim:true` on
> `imagineEvent`, gen+prod gains, `fab_inflate` flip scaled by
> discrim_mult (Polage 2004/2012) — §6.9; **coerced production** —
> `answerProbe(forced:true)` confabulation with developmental gradient
> and suggested-answer persistence (Ackil & Zaragoza 1998; Pezdek,
> Sperry & Owens 2007; Gudjonsson distrust→internalization) — §6.9;
> **evidence bends the plausibility gate** — `evid_boost`, photos
> pre-satisfy the richness gate (Wade, Garry, Read & Lindsay 2002) —
> §6.9; **cryptomnesia** — `crypto_p` heard→self flip, proximity-boosted
> (Brown & Murphy 1989) — §6.10; **consistency pull** — reconstruction
> drifts toward the current self, `consist_pull` +
> `choice_support_gain` (Ross 1989; Henkel & Mather 2007; Mather &
> Johnson 2000) — §6.17; **choice blindness** — `swapOutcome`/`cb_detect`
> seam ownership for possession handoffs (Johansson et al. 2005) —
> §6.18; **content–mood paradox** — `neg_gist_gain` vs
> `negmood_verbatim_gain` (Bookbinder & Brainerd 2016) — §6.3/§2;
> **warning timing** — `prewarn_mult`, `inoc_mult`/`inoc_days` decaying
> inoculation (Banas & Rains 2010) — §6.3; **repression is a documented
> non-mechanism** — no repress() ever — §6.19. +13 params in §7; probes
> P163–P172 in validation-design.md §17.

> **v1.7 note (emotional-memory II — the affect-tag layer):**
> `memory/emotional-memory.md` Part II deepens what v0.5 left as
> scalars: the affect tag is born by **peak-end, not mean** (Kahneman
> et al. 1993; Redelmeier & Kahneman 1996; duration neglect) — §2;
> **sleep strips heat, not story** — `sleep_affect_strip`, trauma-exempt
> (Walker & van der Helm 2009; DEBATED, toggleable) — §2 sleep;
> arousal buys the item and **sells the context** — `emo_assoc_loss`,
> graded link_p/`when`/source cost ≥0.5 arousal, generalizing the
> trauma phenotype (Kensinger & Schacter 2005; Bisby & Burgess 2014;
> Madan et al. 2017) — §2; **saying it changes it** — `verbal_dampen`
> on social retell, solo rehearsal exempt (Lieberman 2007) — §6.11;
> **regulation style** is a trait: suppressors encode less, reappraisers
> encode cooler tags (Richards & Gross 2000; Dillon 2007) — §2;
> conditioned affect **generalizes along a similarity gradient** widened
> by trauma load (Dunsmoor 2009; Lissek 2010) + **reconsolidation-window
> extinction** writes deep suppressors (Schiller 2010, DEBATED
> boundary) — §4.9; the **FAB has a self-boundary** — `fab_self_gate`,
> gossip negativity does not heal (Walker 2003) — §4.5; **hearsay
> carries heat** — `contagion_k` × speaker_express × empathy, vicarious
> conditioning (Rimé 2009; Olsson & Phelps 2007) — §6.3; §2.3 gains
> **tag-capture**: cue-agnostic half-strength rescue of weak temporal
> neighbors (Dunsmoor, Murty et al. 2015). +14 params in §7; probes
> P154–P162 in validation-design.md §16.

> **v1.6 note (age-decline II — the compensation layer):**
> `memory/age-decline.md` Part II adds what aging minds do
> *differently*, not just worse: value-directed selectivity — the old
> system prices importance steeper, sparing high-value encoding while
> abandoning the rest (Castel, Benjamin, Craik & Watkins 2002; Castel
> 2023); the positivity effect on encoding AND selection, collapsed by
> load/stress (Reed, Chan & Mikels 2014 meta; Mather & Knight 2005);
> hyper-binding — wrong-context verbatim fields, implicit-only
> (Campbell, Hasher & Thomas 2010); destination memory — `toldTo` misses
> produce the repeat-story tell (Gopie & MacLeod 2009; El Haj 2012);
> context>content decay asymmetry (Spencer & Raz 1995 meta);
> misrecollection — old errors at HIGH confidence (Dodson & Krueger
> 2006; Shing et al. 2008); prior-knowledge scaffold (Castel 2005;
> Umanath & Marsh 2014); stereotype threat — recall-only, evaluative
> contexts (Lamont, Swift & Abrams 2015; Armstrong et al. 2017);
> gist-false-memory age knots (Balota et al. 1999); intimate-dyad
> collaborative facilitation — old couples remember better together
> (Harris et al. 2011; Barnier et al. 2014); olfactory cue-encoding
> decline (Doty 1984). Deliberate non-change: `misinfo_suscept` old
> knots stay modest — the aging signature is confidence, not adoption.
> Schema +`toldTo`/`hyperbound`; §7 +9 params +3 knot updates; probes
> P145–P153. All optional w/ defaults; backward compatible.

> **v1.5 note (age-development II):** `memory/age-development.md` Part II
> deepens the developmental layer: infantile records go **latent, not
> erased** — below-floor pre-amnesia records are invisible to normal
> recall but reinstatable by compound sensory+place cues (Travaglia et
> al. 2016; Guskjolen et al. 2018; Rovee-Collier retention window);
> `reminiscence_env` — caregiver reminiscing style shifts the amnesia
> boundary ±1.5y (Fivush & Nelson 2004; Reese & Newcombe 2007);
> `strategy_ramp` gates elaboration/generation gains in childhood with
> `scaffolded` events as the bypass (production deficiency, Flavell
> 1970); `offtarget_p` — retrieval-side inhibition loss emits
> era-mate intrusions in old-age bouts (Arbuckle & Gold 1993; Hasher &
> Zacks 1988); **sign fix** — stored knowledge protects OLDER adults
> against fluent repeated lies while young adults neglect knowledge
> (Brashier et al. 2017 vs Fazio et al. 2015); childhood `sws_mult`
> inversion + nap consolidation (Kurdziel et al. 2013); the bump extends
> to cultural semantic records with an intergenerational cascade peak
> (Krumhansl & Zupnick 2013; Svob & Brown 2012); metamemory knots —
> children miscalibrated UP; internal/external source-confusion channel
> split (Foley & Johnson 1985). New §4.14–4.15, §5.19–5.20; schema
> +`latent`; §7 +18 params; probes P136–P144. All optional w/ defaults;
> backward compatible.

> **v1.4 note (retrieval-cues II):** `memory/retrieval-cues.md` Part II
> gives cues a job description: transfer-appropriate processing — a cue
> matches the *process* used at encoding, not just its features (Morris,
> Bransford & Franks 1977); output interference — exhaustive recall
> self-destructs (Tulving & Arbuckle; Roediger & Schmidt 1980);
> prospective cue ecology — focal event cues fire near-automatically and
> age-flat, nonfocal/time-based need costly monitoring (Einstein &
> McDaniel 1990; Henry et al. 2004 meta); context-scoped extinction and
> ABA renewal (Bouton 2004); stateful TOTs with phonological resolution
> and error-repetition learning (Abrams et al. 2007; Warriner & Humphreys
> 2008); reminding chains — a retrieved record cues its links (§5.17);
> and sleep-context cuing (Rasch et al. 2007 — SWS reactivation is
> cue-bound). New §5.12–5.18; schema +`encodeOps`/`extinctCtx`/`tot_fields`;
> §7 +11 params; probes P127–P135. All optional w/ defaults; backward
> compatible.

> **v1.3 note (forgetting-curves II):** `memory/forgetting-curves.md` Part
> II calibrates the *active* side of forgetting: spacing-aware storage
> growth (Cepeda 2006 lag optimum), the testing/re-exposure split
> (Roediger & Karpicke 2006 inversion), failed-retrieval potentiation
> (Kornell 2009), verbatim-quote sub-daily decay (Sachs 1967 — wording
> dies in ~1 min of intervening speech), accumulating proactive
> interference with category-shift release (Underwood 1957; Wickens
> 1970), childhood amnesia step→ramp with coherence-gated survival
> (Bauer & Larkina 2013–2015), deliberate suppression as a bounded
> R-side leak (Anderson & Green 2001 — ~8%, replication-flagged),
> event-based intention persistence, retell-ecology rehearsal draws, and
> per-attempt reminiscence resurfacing. §7 +19 params; probes P117–P126.
> All optional w/ defaults; backward compatible.

> **v1.2 note (encoding-mechanics):** `memory/encoding-mechanics.md` adds
> the processing-side layer §2 was missing: elaboration depth (LoP;
> maintenance-rehearsal and intention-to-learn as formal nulls), engagement
> mode (enacted > generated > spoken > heard — Bertsch 2007, Roberts 2022),
> divided-attention asymmetry (encoding fragile, retrieval obligatory —
> Craik 1996), stochastic attention lapses, event segmentation (boundary
> privilege, cross-boundary order loss, doorway/location-updating —
> Radvansky), unitization rescue of the aging associative deficit,
> mood-congruent encoding, concreteness. Self-relevance now saturates
> (Symons & Johnson 1997). Survival processing is adjudicated and FOLDED
> into elaboration — no dedicated param (Scofield 2018 meta). §7 +14
> params + 4 frozen constants; Event schema +7 fields; probes P106–P116.
> All optional w/ defaults; backward compatible.

> **v1.1 note (validation-design):** `memory/validation-design.md`
> consolidates probes P1–P95 into a tiered registry (MUST/SHOULD/OBSERVE),
> adds the harness contract (cohorts, event generators, measurement-only
> hidden-field tap, JSONL output), the statistical protocol (pre-registered
> bands, TOST equivalence for the model's explicit nulls, BH-FDR, OSC-2015
> replication discount on single-study targets, regression goldens), an
> 11-study experiment-analog battery (E1–E11), population-level checks
> (profile distinctness, trait-structure preservation, age-curve
> conformance, season-field stats), an L4 believability rubric, acceptance
> gates for substrate merge, and new probes P96–P105. No parameter or
> record-schema changes — this version changes only how the model is
> *tested*. Implementers: §10's hidden flags (`accuracy`, `phantom`,
> `retracted`, `possessed`, `sleepdep_flag`, `storageS`,
> `retrievalCount`) are readable by the validation harness ONLY.

> **v1.0 note (character-profiles):** `memory/profile-generation.md` adds
> the profile compiler (full `deriveParams` pipeline + coherence
> invariants + frozen-constant audit), a metamemory `SelfModel` side-
> output (felt competence barely tracks real competence — Herrmann 1982),
> occupational-expertise mechanics with real costs (Chase & Simon
> boundary, Woollett & Maguire 2009 deficit), and open-goal records
> (`open` flag — involvement-gated Zeigarnik layer; the reliable effect
> is intrusion/resumption, not recall advantage). New params are all
> optional with defaults; backward compatible.

> **v0.9 note (formal-model):** `memory/formal-model.md` now pins what this
> spec left informal — exact timebase/units, Event/CueContext input schemas
> with derivation defaults, strict operator ordering for
> encodeEvent/recall/dailyMemoryTick/hearAccount, an identifiability audit
> (which params are per-character vs frozen population constants), record
> caps + ambient-NPC degraded mode, possession/thin-AI edge-case semantics,
> seeded-RNG determinism, and machinery probes P68–P75. Implementers: read
> §8.1 below before wiring the tick loop.
>
> **v0.9 deepening:** the same doc's Part II formalizes five mechanisms
> that were still informal — storage/retrieval strength split (§4.11,
> §5.9), temporal dating (§6.15), hindsight (§6.16), fluency→confidence
> (§3, §5.4 searchCost), and temporal contiguity (§5.4) — plus closed-
> form calibration targets and probes P76–P85.

**Track:** memory-research (sf/memory) · **Audience:** game-systems track (implements
substrate items: memory salience/decay, rumor distortion, belief-vs-fact)
**Grounding:** every mechanism here traces to `human-memory-research.md` (section
numbers cited as R§n). This spec is intentionally framework-agnostic pseudocode;
data shapes are JSON-serializable.

Design goals, in priority order:
1. Characters are **selective** — most ambient events are never encoded or decay away.
2. Characters are **reconstructive** — recall rebuilds gist, drifts, confabulates.
3. Characters are **cue-driven** — memories surface via context overlap, not lookup.
4. Characters are **sometimes wrong with confidence** — confidence ≠ accuracy.
5. All behavior is **parameter-per-character** — same equations, different weights
   (see `character-memory-profiles.md`).

---

## 1. Stores and record schema

Four stores per character (R§1). Only episodic and semantic are first-class
records; procedural and emotional are derived state.

```json
MemoryRecord = {
  "id": "m_<uuid>",
  "type": "episodic" | "semantic",
  "createdDay": 412,                  // world day index
  "encodeAge": 34.6,                  // v0.3: character's age AT ENCODING —
                                      // era effects (amnesia ramp, bump
                                      // window) key on this; capacity
                                      // effects key on age_now
  "lastAccessDay": 418,

  // CONTENT
  "gist": "argued with Mara at Mudhaus over the rent hike",   // durable summary
  "verbatim": {                       // fragile details, decay fast
    "who": ["Mara"], "where": "Mudhaus Coffee",
    "quote": "...", "sensory": "smell of burnt espresso"
  },
  "source": {                         // source-monitoring tag (R§6)
    "kind": "witnessed" | "told_by" | "inferred" | "imagined" | "self",
    "who": "charId|null", "confidenceInSource": 0.9
  },
  "beliefStatus": "fact" | "belief" | "rumor" | "doubted",  // belief-vs-fact layer

  // STATE (all recomputed/updated by operators below)
  "strength": 0.62,                   // current retention R(t), 0..1 —
                                      // v0.9: this field IS retrieval
                                      // strength R in the two-strength
                                      // split (§4.11)
  "storageS": 0.62,                   // v0.9: storage strength S — how
                                      // learned the record is; init =
                                      // encodingE, grows on difficult
                                      // retrievals, near-permanent (§4.11)
  "encodingE": 0.74,                  // encoding strength at birth (immutable)
  "confidence": 0.7,                  // subjective certainty; independent of accuracy
  "accuracy": 0.95,                   // ground-truth drift accumulator (hidden from char)
  "emotional": { "valence": -0.6, "arousal": 0.8 },  // affect tag, own decay
  "encodeMood": -0.2,                    // character's mood at encoding (v0.2;
                                         // distinct from event valence —
                                         // drives mood-STATE dependency §5.4)
  "cueVector": { "place": "mudhaus", "people": ["mara"],
                 "topic": ["rent"], "sensory": ["espresso"],
                 "mood": -0.4, "era": "current" },
  "links": ["m_other1", "m_other2"],  // associative edges (schema/episode chains)
  "retrievalCount": 3,
  "trauma": false,                    // v0.5: set at birth if
                                      // arousal ≥ trauma_thresh — record-
                                      // level phenotype, see §7 of
                                      // emotional-memory.md
  "phantom": false,                   // v0.6: event never happened (gist-
                                      // lure or planted, §6.8/6.9) —
                                      // hidden from the character
  "retracted": false,                 // v0.6: corrected content; still
                                      // leaks via cie_residual (§6.6)
  "hearCount": 0,                     // v0.6: times this content reached
                                      // the character from ANY source —
                                      // repetition, not variety (§6.3)
  "sleepdep_flag": false,             // v0.6: encodeDay sleepFactor was
                                      // <0.75 — permanent susceptibility
                                      // marker (Frenda 2014, §2/§6.3)
  "possessed": false,                 // v0.9: encoded while the character
                                      // was player-possessed — hidden like
                                      // phantom; gets possess_alien
                                      // estrangement discount at recall
                                      // (formal-model.md §6)
  "n_sim": 0,                         // v1.3: similar records encoded
                                      // since (§4.2 PI accumulator)
  "suppressed": 0,                    // v1.3: suppression count (§4.12)
  "attempted": false,                 // v1.3: failed-recall flag —
                                      // next re-encoding potentiated
                                      // (§4.11)
  "encodeOps": "semantic",            // v1.4: dominant processing channel
                                      // at encoding (semantic|perceptual|
                                      // social|enactive) — derived from
                                      // v1.2 engagement/elaboration;
                                      // retrieval-side TAP gate (§5.12)
  "tot_fields": {},                   // v1.4: {field: unresolvedTOTcount}
                                      // — error repetition is field-
                                      // specific (§5.16, Warriner &
                                      // Humphreys 2008)
  "latent": false,                    // v1.5: pre-amnesia record below
                                      // floor — invisible to recall,
                                      // reinstatable only via compound
                                      // sensory cues (§4.14, §5.20;
                                      // Travaglia 2016) — hidden
  "accessLog": []                     // optional debug; may be capped
}
```

- **Episodic** records: specific events (what/where/when). Most records.
- **Semantic** records: decontextualized facts ("Mara is the landlord's friend").
  No `verbatim`; slower decay. Often created by gist abstraction (§7.4).
- **Procedural**: not stored as records — a small skill/affinity map
  (`{skill: level}`) with near-zero decay (R§1). Out of scope for v0 dynamics.
- **Emotional**: affect tags live ON records (above) plus a per-character
  conditioned-associations table that can survive the episodic source
  (Bechara split, R§1): a character can feel dread at a doorway without
  remembering why. **v0.5** gives it real dynamics (§4.9,
  emotional-memory.md §6):

```json
CondEntry = { "cue": "mudhaus", "valence": -0.6, "arousal": 0.7,
              "strength": 0.5, "safeCount": 0, "lastFireDay": 500,
              "extinctCtx": [] }     // v1.4: contexts where extinction
                                     // exposures happened — suppression
                                     // is context-scoped (§5.15, Bouton)
```

**Social store (v0.8):** one `PersonModel` per known individual — memory
*for people* is organized around person nodes, not episode lists
(Hastie & Kumar 1979; Srull & Wyer 1989; social-memory.md §1):

```json
PersonModel = {
  "personId": "mara",
  "familiarity": 0.8,       // "have I met them" — decays slowest
                           // (beta_semantic·0.5)
  "identityStrength": 0.6,  // face→biography binding — decays at
                           // beta_source (associative link, §2 link_p)
  "nameStrength": 0.4,      // weakest tier — last learned, first lost
  "traits": {"stingy": 0.6},// spontaneous-trait-inference accumulator (§2)
  "knowsTopics": ["rent law"], // transactive directory (§6.14, §5.10)
  "credibility": 0.55,      // LEARNED source credibility — feeds the
                           // sourceCredibility factor in §6.3 (§6.14)
  "cheaterLoad": 0.7,       // morality-diagnostic weight accumulator;
                           // >0.5 slows source decay on linked
                           // records (§4.10)
  "categoryTags": ["tenant", "woman", "40s"],  // for §6.10 in-category
                           // source confusion — supplied by world-builder;
                           // absent → operator falls back to cue overlap
  "lastSeenDay": 430
}
```

---

## 2. Encoding — birth of a memory

When an event reaches a character (witnessed, heard, done), compute encoding
strength **E ∈ [0,1]** as a weighted geometric-ish blend — multiplicative where
the literature demands a gate, additive elsewhere (R§2):

```
E = E0 · attention · (1 + w_emo·arousal + w_self·selfRelevance_eff
                      + w_nov·novelty + w_pred·predictionError)
    + elab_gain·elaboration + spacingBonus
```

**v1.2 — processing terms:** `selfRelevance_eff = selfRelevance^0.7`
(saturating — the self-reference meta's compressed high end; Symons &
Johnson 1997, d≈0.65 vs semantic but ~half vs other-reference) and
`elaboration ∈ [0,1]` is a derived Event field (deep semantic work done
on the event; default `clamp(0.5·selfRelevance + 0.3·predictionError +
0.2·coherence + 0.3·survivalRelevance, 0, 1)` — encoding-mechanics.md
§§1, 9). Two formal NULLS live here: repetition without elaboration adds
nothing (Craik & Watkins 1973 — maintenance rehearsal), and intention to
learn adds nothing past the orienting task (`intent_null = 0`, frozen —
Postman 1964; Hyde & Jenkins 1973).

- `E0` = character base encoding rate (param `enc_base`, ~0.35).
- `attention ∈ [0,1]` — is the event in focus? Ambient/background events get
  attention ≈ 0.1–0.3; inattentional gate: if `attention < att_min` (param),
  **no record is created at all** (R§2 gorilla result).
- `arousal` = event emotional intensity 0..1; `w_emo` param. **v0.5 —
  arousal-biased competition (ABC), replaces one-sided peripheralLoss:**
  sort the event's verbatim/cueVector fields by priority (attention ×
  selfRelevance per field; top ~40% = central). Then
  `central_f *= (1 + abc_gain·arousal)` (abc_gain≈0.25 — central content is
  encoded *better* than neutral, Kensinger et al. 2006) and
  `peripheral_f *= (1 − arousal_narrowing·arousal)` (weapon-focus loss as
  before, Mather & Sutherland 2011; emotional-memory.md §2.1).
- **Affect tag by peak-end (v1.7):** the stored `emotional` tag is set
  from the episode's affect trajectory, not its mean. When the event
  carries `affectSeries` (optional; game-systems supplies within-event
  samples when it has them), `arousal_tag = peak_w·max(arousal) +
  end_w·arousal(end)` (peak_w≈0.55, end_w≈0.45); `valence_tag` takes
  valence at the peak-arousal tick and at the end, same weights.
  Duration enters nowhere — the tag is duration-neglecting (Kahneman,
  Fredrickson, Schreiber & Redelmeier 1993; Redelmeier & Kahneman 1996;
  Do et al. 2008; emotional-memory.md §13). Scalar-only events
  degenerate cleanly (peak=end=value).
- **Item-context tradeoff (v1.7):** for episodic records with
  `arousal ≥ 0.5`, graded connective-tissue cost
  `link_p_eff = link_p·(1 − emo_assoc_loss·arousal)` and birth strength
  of `verbatim.when` + source tag ×(1 − emo_assoc_loss·arousal),
  `emo_assoc_loss ≈ 0.25` — arousal buys the item and sells the frame
  (Kensinger & Schacter 2005; Bisby & Burgess 2014; Madan et al. 2017;
  emotional-memory.md §15). The §7 trauma clause halves `when`/
  ordering ON TOP of this — trauma is the endpoint of a graded curve,
  not a separate phenomenon.
- **Regulation style (v1.7):** trait `regulate_style ∈ [0,1]` (0 =
  suppressor, 1 = reappraiser; bible-set). On `arousal ≥ reg_thresh`
  (0.6) events: suppressors pay `enc_base *= (1 −
  reg_suppress_cost·(1−regulate_style))`, reg_suppress_cost≈0.2
  (suppression taxes the recorder — Richards & Gross 1999/2000);
  reappraisers get `arousal_tag *= (1 − reg_reappraise_k·
  (regulate_style−0.5)·2)`, reg_reappraise_k≈0.25, applied before the
  peak-end tag is stored (Dillon et al. 2007; emotional-memory.md §17).
- **Emotional blink (v0.5):** if `arousal ≥ emo_blink_thresh` (0.7), each
  cue-*unrelated* record created within ±`emo_blink_window` (0.03 day)
  takes `encodingE *= (1 − emo_blink_loss)` (≈0.3) — retro- and
  antero-grade amnesia for neighbors (Strange et al. 2003; Hurlemann et
  al. 2005). Neighbors sharing ≥1 cue field (predictive items) are EXEMPT
  (Knight & Mather 2009 reconciliation; emotional-memory.md §2.2).
- **Trauma tag (v0.5):** if `arousal ≥ trauma_thresh` (0.9), set
  `trauma: true` — the record-level phenotype in §4.9/§5.5–5.8/
  emotional-memory.md §7.
- **Conditioned-affect acquisition (v0.5):** if `arousal ≥ cond_thresh`
  (0.6), each encoded cueVector key gets/updates a CondEntry:
  `strength = min(1, strength + cond_gain·arousal)` (cond_gain≈0.5 —
  single-trial acquisition, §4.9).
- `selfRelevance` 0..1 — event touches the character's goals/identity/people.
  Strongest single booster (self-reference effect).
- **Stress penalty (new in v0.1):** if `arousal > stress_thresh` (0.8),
  verbatim-field strength at birth is multiplied by
  `(1 − stress_encode_loss)`, default loss 0.31 (Deffenbacher et al. 2004
  meta-analysis, d≈−0.31).
- **Face ceiling (new in v0.1):** verbatim strength for a single-encounter
  stranger's face/appearance is capped at `face_ceiling` (0.67) regardless
  of E (Deffenbacher et al. 2008 — eyewitness identification upper bound).
- `novelty` — distance of event from the character's event schema for its type
  (0 = routine, 1 = unprecedented). Routine repeats get novelty→0 and merge
  instead (§5.3 genericization).
- `predictionError` — |expected − actual| outcome surprise.
- `spacingBonus` — if this event re-activates an existing memory beyond
  `spacing_min_gap` days, boost THAT record (§6.4), don't duplicate.
- **Childhood-amnesia ramp (v0.3):** `E *= amnesia_ramp(encodeAge)` where
  `amnesia_ramp(a) = clamp(a/7, 0.05, 1)` — immature encoding machinery
  produces weak traces before ~7 (Rubin 2000; Bauer & Larkina 2014). Such
  records also keep a permanent `amnesia_decay_mult` on their β (§4.1):
  early memories exist in childhood but are erased *by* childhood.
- **Associative binding (v0.3):** each `links` edge and each cross-field
  cueVector binding (event↔place, event↔person pairings) is formed with
  probability `link_p · assoc_mult(age_now)` — associative-deficit
  hypothesis (Naveh-Benjamin 2000): older characters encode items fine
  but bind them weakly, mechanically producing source/context loss and
  cross-episode grafting downstream.
- **Strategy gating (v1.5):** `elab_gain` and `gen_gain` are multiplied
  by `strategy_ramp(age_now) = clamp((age_now−4)/8, 0, 1)` — production
  deficiency: children own the strategies but don't deploy them
  spontaneously before ~`strategy_exit` (12; Flavell 1970; Schneider &
  Pressley 1997). Events carrying `scaffolded: true` (an adult walked
  the child through the telling/doing) bypass the ramp and instead add
  `scaffold_gain` (0.15) — outsourced elaboration is how children
  actually encode well (Fivush & Nelson 2004). `gist` field birth
  strength is ×`child_gist_mult` (0.7) for `encodeAge < 8` — children
  keep detail shards, under-extract the narrative spine (fuzzy-trace;
  Brainerd & Reyna). See age-development.md §13.
- **Child trauma offset (v1.5, HYPOTHESIS — small):**
  `trauma_thresh_eff = trauma_thresh − child_trauma_off·max(0, 1 −
  encodeAge/12)` (`child_trauma_off` 0.1) — undeveloped regulation
  reads the same arousal as overwhelming; flagged hypothesis.
- **Cultural bump (v1.5):** `bump_gain(encodeAge)` (§4.1 era term)
  applies to semantic records tagged `cultural: true` at reduced gain
  `bump_semantic_gain` (0.5) — favorite songs/foods/rituals are
  disproportionately minted in the bump window (Krumhansl & Zupnick
  2013); `cascade: true` cultural records encoded at `encodeAge ∈
  [4,10]` get `bump_cascade_gain` (0.4) — the parents'-era secondary
  peak (Svob & Brown 2012; age-development.md §17).
- **Value-directed selectivity (v1.6):**
  `importance = max(selfRelevance, goalRelevance)` (goalRelevance is
  predictionError routed through a live goal/open loop; default =
  selfRelevance). `E *= (1 + value_select(age_eff)·(2·importance − 1))`
  — older adults preserve high-value encoding and abandon low-value
  (Castel, Benjamin, Craik & Watkins 2002; Castel 2023). Fails to rescue
  intrinsically-hard content — it reweights E, it can't create it
  (Hoover et al. 2025; age-decline.md §17).
- **Positivity at encoding (v1.6):** `pos_eff = positivity_gain(age_now)
  ·(1 − daLoad)·(1 − acuteStress)` (acuteStress = 1 if arousal ≥
  stress_thresh, else 0). For valence>0 events `E *= (1 + pos_eff·
  valence)`; for valence<0 `E *= (1 − 0.5·pos_eff·|valence|)`. Resource-
  dependent by construction — load/threat collapses it (Mather & Knight
  2005; Reed, Chan & Mikels 2014 meta). NOT reserve-shifted — motivational,
  not fluid (age-decline.md §18).
- **Schema scaffold (v1.6):** if the event's cue tags overlap a semantic
  record with strength ≥ `know_protect_thresh`, `E += schema_support
  (age_eff)·overlap` (bounded +0.15) — prior knowledge carries encoding
  for the old (Castel 2005; Umanath & Marsh 2014; age-decline.md §23).
- **Hyper-binding (v1.6):** with probability `hyperbind_p(age_eff)·
  (1 − awareness)` — awareness = `boundary:true` or selfRelevance ≥0.8 —
  write ONE verbatim field from a co-present but unrelated context
  feature and flag it `hyperbound` (hidden). Older adults bind the
  WRONG things, not fewer (Campbell, Hasher & Thomas 2010; implicit-
  only per Campbell et al. 2024; age-decline.md §19). Small compensating
  `link_p` refund (+0.05·hyperbind_p) on co-occurring pairs.
- **Sleep modifier:** at end of each world day, consolidation pass multiplies
  all same-day `encodingE` by `sleepFactor` (param; poor sleep ≈ 0.7–0.85,
  good ≈ 1.0–1.1). (R§2, R§8.) **v0.4:** `sleepFactor_eff = sleepFactor ·
  sws_mult(age_eff)` applied to **episodic** records only — slow-wave-sleep
  decline selectively impairs episodic consolidation in old age (Mander et
  al. 2013; age-decline.md §7). Semantic records keep unscaled `sleepFactor`.
- **Selective emotional consolidation (v0.5):** at the FIRST sleep tick,
  episodic records get `strength += emo_consol_gain·arousal·(1−strength)`
  (emo_consol_gain≈0.25). The emotional-memory advantage grows over delay
  via consolidation rather than being fully priced at birth (Sharot &
  Phelps 2004; Ritchey et al. 2008; Nishida et al. 2009;
  emotional-memory.md §1).
- **Retrograde stress enhancement (v0.5):** at the same tick, records
  created within `post_stress_window` (0.05 day) before a same-day
  `arousal ≥ emo_blink_thresh` event AND sharing ≥1 cue field with it get
  `strength += post_stress_gain·(1−strength)` (≈0.15) — post-learning
  arousal strengthens prior congruent traces (Cahill et al. 2003;
  emotional-memory.md §2.3).
- **Tag capture (v1.7 — extends §2.3):** cue-UNRELATED weak records
  (encodingE < 0.5) inside `post_stress_window` of a
  `arousal ≥ emo_blink_thresh` event get HALF the retrograde gain
  (`post_stress_gain·0.5`) — behavioural-tagging rescue: a strong
  emotional event stabilizes temporally adjacent weak traces even
  without semantic overlap (Dunsmoor, Murty, Davachi & Phelps 2015;
  Redondo & Morris 2011). The blink (§2) still hits them at encoding;
  tag-capture partially repays survivors at consolidation — net: the
  day of the fight is dim except what touched it.
- **Sleep strips heat (v1.7 — DEBATED, toggleable):** at each sleep
  tick, `emotional.arousal *= (1 − sleep_affect_strip)` (≈0.04),
  floor 0.15, episodic only, `trauma:true` EXEMPT — Walker & van der
  Helm 2009 depotentiation hypothesis; replication is shaky
  (emotional-memory.md §14), so this is small and one of three
  redundant cooling paths (§4.5 arousal_affect_decay, §6.11
  verbal_dampen). Valence untouched.
- **Sleep-deprivation susceptibility flag (v0.6):** if the character's
  `sleepFactor` on the record's `createdDay` was < 0.75, set
  `sleepdep_flag: true` — a PERMANENT marker raising that record's later
  misinformation adoption (§6.3, `sleepdep_misinfo_gain`). Deprivation
  *at encoding* is what matters; poor sleep on later days does nothing
  (Frenda et al. 2014; false-memory.md §3).
- **Synchrony modulation (v0.7):** if `peak_hour` is set,
  `E *= (1 − synchrony_gain·(1 − cos(π·Δh/12))/2)` where
  `Δh = |tod − peak_hour|` in hours — full strength at the character's
  circadian peak, `−synchrony_gain` at the antipeak. `synchrony_gain`
  scales up with `age_eff` (×(1+age_eff/60)): older adults are far more
  synchrony-sensitive — the May, Hasher & Stoltzfus 1993 asymmetry that
  erased the age deficit at optimal times (individual-differences.md
  §2.12, §5). Same factor applies to θ at retrieval (§5.4).
- **Detail-write fraction (v0.7):** each peripheral (non-central)
  verbatim field is written at all only with probability `vivid_detail`
  (default 0.8) — imagery vividness sets how *wide* a record is, not how
  correct it is (Dawes et al. 2022 aphantasia: fewer episodic details,
  individual-differences.md §2.7). Missing fields are confabulation
  surface at reconstruction (§5.5); vividness never changes accuracy.
- **Inconsistency and lapses (v1.9):** each dailyMemoryTick draws
  `day_mult = exp(N(0, iiv_sigma))` multiplying that day's encoding E
  (retrieval-side θ noise in §5.4) — intraindividual variability is a
  trait that grows with age_eff and shrinks with wmc (Hultsch et al.
  2000). Separately, routine low-salience events (`attention < 0.3`)
  are dropped before E is computed with probability `omit_p` —
  absent-minded *omission*, not a weak record; nothing exists to decay
  or cue (mind-wandering encoding gaps, Smallwood & Schooler 2006;
  individual-differences.md §10).
- **Intoxication state (v1.9):** `context.intox` ∈ [0,1] (alcohol;
  same slot reusable for cannabis) applies anterograde-only:
  `E *= (1 − intox·(1 − intox_encode_mult))` and peripheral-field
  write probability `vivid_detail·(1 − 0.4·intox)`. Retrieval of
  sober-encoded material is NOT degraded. At `intox ≥ 0.8` the window
  additionally pays `omit_p += 0.5·(intox − 0.8)/0.2` — fragmentary
  blackout islands (White 2003; morning-after gap-filling then runs
  through ordinary confab_fill, §5.5). Mild state-dependency cue
  `intox_state_dep` at §5.4. (individual-differences.md §16.)
- **Engagement mode (v1.2):** Event field `engagement` ∈
  {observed, heard, enacted, generated, spoken} (default derived from
  source.kind). Ordering at matched attention: enacted > generated >
  spoken > heard/observed — `E += enact_gain` (0.20, on enacted events;
  applied AFTER the age-scaled enc_base so motor encoding partially
  bypasses the decline curve — preserved in aging and impairment,
  Roberts et al. 2022 meta g=1.23), `E += gen_gain` (0.15, self-composed
  speech/plans/conclusions — generation effect d=0.40, Bertsch et al.
  2007), `E += prod_gain` (0.08, said-aloud — Fawcett 2013/2023;
  recognition-weighted). Enacted records take HALF the `da_encode_mult`
  damage below (motor encoding needs no central resources — Engelkamp).
- **Divided attention at encoding (v1.2):** Event field `daLoad` ∈ [0,1]
  (secondary-task pull). `attention ×= (1 − da_encode_mult·daLoad)` AND
  `elaboration ×= (1 − da_encode_mult·daLoad)` (da_encode_mult ≈ 0.5) —
  the hit is on both channels, a qualitative shallowing not just less
  resource (Craik et al. 1996; Naveh-Benjamin et al. 2000). Retrieval
  side is near-immune: `cueContext.daLoad` raises searchCost only
  (×`da_ret_cost` = 1.5, frozen) — §5.4.
- **Attention lapses (v1.2):** per event, with probability `lapse_p`
  (0.03 + trait/state loadings: +0.02·neurot>0, +0.03·sleepFactor<0.8,
  +0.02·stress>0.6 — individual-differences.md), `attention ×= (1 −
  lapse_drop)` (0.6), drawn BEFORE the att_min gate — lapsed events often
  simply do not exist for the character (mind-wandering; Maillet & Rajah
  2013).
- **Event segmentation (v1.2):** Event flag `boundary:true` (task
  switch, arrival/departure, topic break) → `E += boundary_gain` (0.15)
  — boundary content is privileged (Zacks et al. 2007; Swallow et al.
  2009). Event flag `locShift:true` (venue/room change) → every record
  created within the last `lapse_window` (0.02 day, frozen) AND every
  pending `Intention` (§9) takes a one-time `R ×= (1 − doorway_drop)`
  (0.15) — the doorway/location-updating effect, flat across age
  (Radvansky & Copeland 2006; Radvansky et al. 2011/2015). Cross-boundary
  associative edges form at `link_p·(1 − boundary_order_loss)` (0.4) —
  order survives within events and dies between them (DuBrow & Davachi
  2013).
- **Unitization (v1.2):** Event flag `coherentUnit:true` (person+their
  signature action; object+its place) → `link_p_eff = link_p +
  unitize_gain·(1 − link_p)` (0.3) — unitizing an association into an
  item rescues the age-graded associative deficit exactly where it is
  worst (Giovanello & Schacter 2012; Bastin et al. 2013).
- **Isolation (v1.2):** Event flag `isolated:true` (categorical outlier
  within its local episode) → `E += distinct_gain` (0.15) — von Restorff
  needs statistical oddity in the stream, not world-weirdness (Hunt 1995;
  Schmidt 1991). Routine-heavy lives isolate MORE often — the rare odd
  day survives the mush.
- **Concreteness (v1.2):** events with ≥2 populated sensory cue fields →
  `E += concrete_gain` (0.1) — dual coding; the concrete outlives the
  argued (Paivio).
- **Mood-congruent encoding (v1.2):** when sign(valence) ==
  sign(encodeMood), `E += mood_cong_encode·|encodeMood|·(1 −
  selfRelevance)` (0.1) — mood steers what elaborates, but only on thin
  ambient content; self-relevant material doesn't need the help (Bower
  1981; Ucros 1989 meta).
- **Social encoding layer (v0.8)** — for events with `agent != self`
  (someone else's observed/heard behavior; social-memory.md §2):
  - *Spontaneous trait inference:* with prob `sti_prob` (0.6), update the
    actor's `PersonModel.traits[implied] += sti_gain·diag_weight`
    (sti_gain 0.15) — trait inferences are unintentional and bind to the
    actor (Winter & Uleman 1984; Uleman et al. 2008 meta; Todorov &
    Uleman 2003). `diag_weight` = `diag_moral_neg` (1.6) for negative
    morality-relevant behavior, `diag_ability_pos` (1.3) for positive
    ability-relevant behavior, else 1.0 — perceived diagnosticity, so
    one betrayal outweighs months of reliability (Skowronski & Carlston
    1987/1989). Morality-negative updates also add to
    `PersonModel.cheaterLoad`.
  - *Incongruity bonus:* if the behavior's implied trait diverges from
    the existing model (|implied − model.traits[trait]| > 0.4),
    `E += incongruity_gain·|Δ|` (0.25) — expectancy-violating behavior is
    encoded deeper (Hastie & Kumar 1979). Orthogonal to the transmission-
    stage stereotype pull in §6.12 — incongruity wins at encoding,
    consistency wins in the chain (Kashima 2000).
  - *Next-in-line hole:* if the character is preparing their own turn in
    group talk (`context.preparing: true`), incoming utterances get
    `attention ×= (1 − next_in_line)` (0.4) — self-rehearsal blanks the
    previous speaker (Bond 1985).
  - *Own-age bias:* `PersonModel.familiarity` encodes at
    `×(1 − oab_loss)` (0.15) for faces outside the character's own age
    class (±~15y); applies symmetrically at all ages (Rhodes & Anastasi
    2012, g≈0.37 discriminability). Optional `owngroup_loss` for other
    category boundaries if world-builder marks them — do not invent.
  - *Self-threat shallowing:* feedback records about the character
    (source `told_by`, topic = a self trait) with implied valence < −0.3
    and selfRelevance > `mnemic_centrality` (0.6) encode at
    `attention ×= (1 − mnemic_encode)` (0.25) — self-protective
    not-thinking at intake (Sedikides & Green 2006); waived when the
    source is a close other (Green et al. 2009); ×0.3 under the
    depressive modifier (dysphoria removes the protection).
  - `familiarity`/`identityStrength`/`nameStrength` accrue across
    encounters: second+ meetings bypass `face_ceiling` for the
    familiarity tier only — appearance verbatim stays capped.
  - **v2.0 additions** (social-memory.md Part II):
    - *Interpret bias:* ambiguous trait implications (|implied| <
      `ambig_band` ≈0.3) from an actor whose `PersonModel.traits[trait]`
      exceeds ±0.4 are pulled toward the model at encoding:
      `implied += interpret_bias·sign(model)·(1−|implied|)` (≈0.3) —
      reputation assimilates the gray zone while clearly-contrary acts
      (outside the band) still earn incongruity_gain; assimilation at
      perception, not just retrieval (Srull & Wyer 1989; Anderson,
      Siegel, Bliss-Moreau & Barrett 2011 — gossip biases face
      processing itself).
    - *Joint attention:* `context.coAttending` (a known other present
      AND mutually engaged — stricter than `present`) → `E *= (1 +
      joint_attn_gain)` (≈0.12) and stored affect amplified
      valence-symmetrically: `|valence_tag| += joint_affect_amp`
      (≈0.1, sign-preserving — shared fun is funner, shared dread is
      dreadful; Boothby, Clark & Bargh 2014; Shteynberg 2015).
    - *Confidential tag:* event may carry `confidential: true` (or a
      later `tagEvent` sets it — "keep this between us"); writes a
      `secret_str` field (birth = E) decaying at
      `beta_source·secret_tag_mult` (≈1.3) — the DO-NOT-TELL bit rots
      faster than the juicy bit (source-amnesia asymmetry; §6.22).
    - *Attachment exclusion (v2.2):* event may carry `attachment: true`
      (relational content — bids, confessions, comfort, dependency; the
      event layer tags it); for characters with `attach_avoid` trait σ,
      `E *= (1 − attach_encode_loss·max(0, attach_avoid)/1.5)` — a
      PREEMPTIVE deficit: avoidants encode attachment material thin at
      the door, and motivational cues do not rescue it (Edelstein 2006 —
      boundary-locked: non-attachment emotional records untouched;
      Fraley, Garner & Shaver 2000; Mikulincer & Orbach 1995). Retrieval
      pays `attach_ret_cost` on searchCost for the same tag.
- **Negative mood protects surface detail (v1.8):** when
  `context.mood < −0.3`, verbatim-field birth strength gains
  `negmood_verbatim_gain` (0.1) — the context half of the
  Bookbinder & Brainerd 2016 content–context paradox: negative mood
  promotes item-specific/verbatim processing while negative CONTENT
  (§6.3 `neg_gist_gain`) foments gist-side distortion. The two
  halves live on different channels; do not merge them.

Create the record with `strength = E`, `confidence = base_conf(E)`, `accuracy = 1`.

---

## 3. Confidence vs accuracy

Two separate fields, always (R§6). `confidence` starts
`base_conf(E) + conf_bias + conf_emo_gain·arousal²` (v0.7: conf_bias
is a per-character trait offset, default 0 — high-vividness characters
start ~+0.05 more certain, memory-distrusting ~−0.08; it moves
confidence only, never accuracy — individual-differences.md §3).
(v0.5: conf_emo_gain≈0.15,
quadratic — only strong arousal inflates felt certainty; the amygdala-
fluency "feeling of remembering," Sharot et al. 2004) and is raised by
retellings (+0.05 each, cap 0.98); `accuracy` only moves via distortion
operators (§6). A character can sit at `confidence 0.95, accuracy 0.4` —
flashbulb pattern. **v0.5 floor:** records with `arousal ≥
flashbulb_thresh` (0.85) never let `confidence` fall below
`flashbulb_conf_floor` (0.9) — flashbulb detail decays at ordinary rates
while certainty stays pinned (Talarico & Rubin 2003; emotional-memory.md
§5).

**v0.9 deepening — fluency and hard-easy calibration** (formal-model.md
§13): reported confidence, not stored confidence, gets two adjustments
at output time —

```
conf_out = conf_bias + meta_cal·(conf − 0.5)
           + oc_gain·max(0, conf − accuracy)·(1 − m.strength)
           + conf_inflate_old(age_eff)·wrong_flag
           − (C.verify ? check_conf_loss·log1p(m.retrievalCount) : 0)
// v1.9: conf_bias/meta_cal are the trait-confidence intercept/slope
// (Kleitman & Stankov 2007 — stable, domain-general, orthogonal to
// accuracy); the verify term is the checking paradox — repeated
// verification DECREASES reported confidence and detail-vividness,
// never increases it (van den Hout & Kindt 2003; meta k=28, N=1662).
// All report-side only — none of these terms touch stored conf.
```

where `wrong_flag` = 1 if the reconstruction carries phantom content,
a merged/generic substitution, a `hyperbound` field, or a lure-accepted
recognition (§6.8/§4.3/§2 hyper-binding/§5.6) — the misrecollection
inversion: older adults' errors concentrate at HIGH confidence while
young adults' errors cluster at low confidence (Dodson & Krueger 2006;
Dodson, Bawa & Krueger 2007; Shing et al. 2008 — children don't show it).
Report-side only; `conf_inflate_old` knots 0 ≤50 → 0.15 at 85
(age-decline.md §22).

overconfidence widens exactly where the trace is weakest (hard-easy
effect, Lichtenstein & Fischhoff 1977; kept modest per Gigerenzer et al.
1991's qualification); never feeds back into `accuracy` or `confidence`.
Category/frequency judgments ride `searchCost` (§5.4): the ease of the
search, not the count returned, is the data (Schwarz et al. 1991;
Koriat 1993 cue-utilization).

---

## 4. Decay and interference — the forgetting engine

### 4.1 Trace decay (per tick, e.g. hourly or daily)

**v0.9 note:** `strength` here is retrieval strength R — the accessible-
now quantity. Storage strength S (§4.11) decays on its own far slower
schedule; everything in §4.1–4.3 acts on R only.

Power-law with asymptote (R§3):

```
R(t) = E_adj · (1 + t/τ)^(-β) + floor
```

- `t` = days since lastAccessDay (retrieval refreshes the clock).
- `τ` (scale) and `β` (rate) are params per memory **type** and per character:
  episodic τ≈1.2, β≈0.5; semantic τ≈30, β≈0.2; verbatim fields decay at
  `β·k_verbatim` (k≈2.5) relative to gist.
- `floor` ≈ 0.05·emotional.arousal — strong emotional memories asymptote above
  zero (they never fully die, they go quiet). NOTE (Talarico & Rubin 2003):
  high arousal does NOT change β — flashbulb details decay on the same curve
  as ordinary ones; arousal only raises floor and confidence.
- **Emotional narrowing over time (v0.5):** records with `arousal ≥ 0.6`
  get gist β ×`emo_gist_beta` (0.85 — emotional gist is preserved) while
  verbatim fields decay at an EXTRA `emo_verbatim_k` (×1.5) — the memory
  keeps its emotional core and sheds its frame even faster than a neutral
  record would (emotional-memory.md §2.1 time-course). **Trauma records
  additionally** set `floor := max(floor, trauma_floor)` (0.30) — vivid
  forever (Brewin et al. 1996; §7 of emotional-memory.md).
- **Era terms (v0.3 — keyed on `encodeAge`, see age-development.md §§2–3):**
  - *Reminiscence bump:* `β *= bump_gain(encodeAge)` permanently, where
    `bump_gain(a) = bump_beta_mult + (1−bump_beta_mult)·(1−cos(π·clamp((a−bump_lo)/(bump_hi−bump_lo))))`
    — a raised cosine over [bump_lo 10, bump_hi 30] peaked near
    `bump_peak` (~15). Applied **only if** `bump_valence_gate` passes:
    `valence > 0 OR selfRelevance > bump_self_thresh` — the empirical bump
    is for positive/important memories; sad memories show no bump
    (Berntsen & Rubin 2004; Rubin & Berntsen 2003). Per-character
    `bump_peak` jitter ±3y (Janssen et al. 2005: earlier for women).
    **v2.2:** the window generalizes to a per-character
    `bump_windows: [{lo, hi, mult}]` list emitted by the profile
    compiler from `ProfileInput.lifeEvents` — an immigration at age
    `a` mints `[a−2, a+8]` at `mig_bump_gain`·bump_beta_mult
    (Schrauf & Rubin 1998, 2001: the bump follows migration age, and
    goes bimodal when migration falls inside 10–30; the "effort after
    meaning" + settlement-interference-release account). No life events
    → the single default window, behavior unchanged. Cast with windows:
    C6 [10,30]+[27,37], C8 [10,30]+[10,20] (cast-profiles.md §1.1).
  - *Childhood records (v1.3: step → ramp + survivorship):* if
    `encodeAge < amnesia_exit` (7), permanently
    `β *= 1 + amnesia_slope·(1 − encodeAge/amnesia_exit)`
    (`amnesia_slope` ≈ 1.2 → β×2.2 at age 1, β×1.0 at 7 — graded, not a
    cliff; Bauer & Larkina 2014: forgetting rate orders 4y > 6y > 8y >
    adult). AND at the first sleep tick the record must pass a
    consolidation gate:
    `P(survive childhood) = min(1, child_consol_base + coherence·child_consol_gain)`
    (`child_consol_base` 0.15, `child_consol_gain` 0.6; coherence =
    coherentUnit flag or link degree > 0 at birth — thematic coherence
    predicts survival, Bauer & Larkina 2015). **v1.5:** failed records
    and pre-amnesia records that fall below `forget_thresh` set
    `latent: true` (§4.14) instead of archiving — childhood amnesia is
    an accessibility cliff, not a delete (Travaglia et al. 2016).
    `amnesia_decay_mult` is deprecated (≈ ramp midpoint).
    `child_consol_gain` is scaled by `reminiscence_env` (§4.14) and the
    effective boundary is `amnesia_exit_eff = amnesia_exit −
    3·(reminiscence_env − 0.5)` — caregiver reminiscing style moves the
    amnesia window itself (Reese & Newcombe 2007).
- **Quote field class (v1.3):** `verbatim.quote` decays on a sub-daily
  schedule — `tau_quote` 0.02d (~30 min), `beta_quote` 0.8, floor 0
  (Sachs 1967: wording indistinguishable from paraphrase after ~80
  intervening syllables; Jarvella 1971: verbatim covers ~the current
  sentence). Same power law, smaller τ — legal per formal-model §1
  scale invariance. Dialogue quoting beyond the same hour should render
  as paraphrase/gist + confabulation, not the stored quote.
- **β_episodic ≈ 0.5 is calibrated**: τ=1.2d, β≈0.47 reproduces Ebbinghaus
  1885 / Murre & Dros 2015 (21% savings @ 31d) for meaningless unrehearsed
  material — the decay floor for episodic content. See
  `forgetting-curves.md` §2.1 and the calibrated retention table §4 thereof.

### 4.2 Interference

When two episodic records share high cue overlap (same place+people+topic,
within Δt window):

```
similarity(a,b) = simOp(a, b, "sim_interf")   // v2.1: weighted-mask
   operator, §11.1 — temporal proximity is a first-class feature here
   (the "which lunch" collisions proactive interference is made of)
if similarity > interf_thresh·discrim_mult (param, ~0.6):
    each suppresses the other: strength *= (1 - interf_k · similarity)
```

Retroactive: newer memory hits older harder (`interf_k` asymmetric, e.g.
new→old 0.15, old→new 0.05). This is what blurs the 40th identical commute.
**v1.3 — accumulation + release-from-PI:** each record carries `n_sim`,
the count of cue-similar records encoded *since* it (increment when a
new encodeEvent lands sim > interf_thresh in its cue bucket). Pairwise
suppression scales by `min(1, sqrt(n_sim)/pi_ref)`, `pi_ref` = 4 —
proactive interference accumulates to collapse within a handful of
same-category items (Wickens 1970); competition pools are the cue
buckets themselves, so a *category shift* (new venue, new topic cluster)
opens a fresh pool and the next record starts near-clean (release-from-
PI; Underwood 1957: most everyday forgetting is proactive). See
forgetting-curves.md §7.5.
**v0.4:** `discrim_mult(age_eff)` ≤1 scales the threshold down with age —
pattern separation loss means older characters treat *similar-but-distinct*
records as matches sooner (Yassa et al. 2011; Stark et al. 2013;
age-decline.md §4). Knots: 1.0 ≤50 → 0.72 at 85.

### 4.3 Genericization (schema merging)

If `simOp(a,b,"sim_merge") > merge_thresh·discrim_mult` (~0.8) AND both below
salience threshold:
merge into one **generic memory** — keep shared gist ("my morning commute"),
drop both verbatims, `type` stays episodic but flag `"generic": true`.
This is routine-collapse (R§3) and costs almost nothing to run. v0.4:
same `discrim_mult` age scaling — genericization runs at elevated gain in
old characters (pattern-separation deficit, age-decline.md §4).

### 4.4 Forgetting threshold

`strength < forget_thresh` (param ~0.08) → record is archived, not deleted:
unreachable by normal retrieval, revivable only by a *maximal* cue (someone
narrates the event back). Emotional associations (§1) may outlive the record.
**v0.9:** archiving is on R only — `storageS` persists in archived
records, which is what resurrection and savings act on (§4.11).

### 4.5 Fading affect

`emotional.valence` magnitude decays toward 0; **negative valence decays
~1.3× faster than positive** (fading affect bias, R§5). Older-adult profiles
raise the asymmetry (positivity effect). **v0.5:** the arousal component of
the affect tag decays at `arousal_affect_decay` (×1.4 vs valence) — felt
intensity quiets faster than felt sign [HYPOTHESIS — emotional-memory.md
§12]. Dysphoria disrupts FAB (Walker et al. 2003): the depressive modifier's
`neg_affect_decay ×0.7` already encodes this.
**v1.7 — self-boundary:** `neg_affect_decay` applies only when the
record's `selfRelevance_eff ≥ fab_self_gate` (0.4); below the gate,
negative affect decays at the POSITIVE baseline rate — the bias is
self-referential repair, not a general solvent (Walker, Skowronski &
Thompson 2003; Ritchie et al. 2006/2015; emotional-memory.md §19).
Emergent: personal slights cool; witnessed wrongs done to others keep
their charge — collective memory of a public injustice outlasts
private hurt.

### 4.6 Consolidation window (new in v0.1)

Sleep shields young memories from interference (Jenkins & Dallenbach 1924:
8h asleep → 56.5% vs 8h awake → 46% recall; Murre & Dros 2015's 24h plateau).
A record younger than `consol_window_days` (default 1.0 — hasn't crossed a
sleep tick yet) is **interference-exposed at full rate** (§4.2 applies
normally) but decays only during the sleep tick, at
`consol_beta_mult` (0.5) × its normal β. Effect: day-1 survival is bimodal —
events that reach the sleep tick keep most of their strength; same-day
interference before sleep is what kills them. See `forgetting-curves.md` §2.8.
**v0.6 — gist edge at sleep:** at the daily tick, `generic:true` records
and `phantom:true` records (§6.8) get
`strength += sleep_gist_boost·(1−strength)` (≈0.05) — sleep consolidates
gist over verbatim, preferentially preserving exactly the content that
drives false recall (Payne et al. 2009; partially debated — a 2025
preregistered replication found the effect conditional on intrusion-
adjusted memory level; false-memory.md §3).

### 4.7 Permastore transition (new in v0.1)

Semantic records show a discrete two-regime life (Bahrick 1984: items live
0–6 years or >25 years, little in between). At each daily tick, a semantic
record with age ≥ `permastore_age` (180 game days) and strength ≥
`permastore_thresh` (0.25) sets `permastore: true` and freezes decay
(β→0). Well-consolidated world knowledge is effectively permanent; fresh
facts still decay normally. See `forgetting-curves.md` §2.3.
**v0.9:** the permastore gate tests `storageS ≥ permastore_thresh`
instead of `strength` — permanence is a property of how well-stored the
record is, not of how retrievable it happens to be today (§4.11).

### 4.8 Lifespan decline layer — reserve and terminal decline (new in v0.4)

Two global modifiers wrap all age-declining capacity params
(age-decline.md §§8–9):

- **Cognitive reserve:** each character has `reserve ∈ [0,1]` (set at
  character creation from education/occupation/engagement; default 0.4).
  Decline-side capacity params evaluate at `age_eff = age_now −
  reserve·reserve_shift` (`reserve_shift` ≈ 10y). Applies to: enc_base,
  beta_episodic, beta_source, theta, link_p, discrim_mult, lure_accept,
  tot_rate, search_breadth, sws_mult, pm_self, ret_noise, specificity.
  **v1.6 additions to the reserve-shifted set:** value_select,
  hyperbind_p, dest_mem, ctx_loss, conf_inflate_old, schema_support,
  collab_partner_gain (age-decline.md §30).
  Does NOT apply to era terms (encodeAge is fact) or to
  misinfo_suscept/confab_fill (meaning-machinery, not fluid capacity).
  **v1.6 exemptions:** `positivity_gain` (motivational reorientation —
  SST, Carstensen) and `stereo_suscept` (trait × age gate, §5.4) are
  evaluated at `age_now`, never reserve-shifted.
  High reserve = later decline onset, similar slope (compression
  pattern; Stern 2002; Valenzuela & Sachdev 2006, OR 0.54).
- **Terminal decline (optional):** if a character's `deathDay` is set
  (scripted death only) and `age_eff ≥ 55` and
  `deathDay − worldDay < terminal_window` (~1100 game days, Wilson et
  al. 2003 change-point ≈43 months), apply a **global ramp** to all
  capacity params simultaneously:
  ```
  t_frac = 1 − (deathDay − worldDay)/terminal_window   // 0→1
  beta_*        *= (1 + terminal_gain·t_frac)           // terminal_gain≈2
  enc_base, link_p, search_breadth, sws_mult
                *= (1 − terminal_loss·t_frac)           // terminal_loss≈0.5
  theta, tot_rate, drift_p, confab_fill += terminal_loss·t_frac·default
  ```
  One ramp on everything implements terminal dedifferentiation —
  preterminal domain declines correlate 0.25–0.46, terminal 0.83–0.89;
  everything falls together (Wilson et al. 2012). Reserve does NOT
  delay the terminal window (Wilson et al. 2008: not modified by
  education). Most characters never set `deathDay` — absent = off.

### 4.9 Conditioned affect dynamics (new in v0.5)

The CondEntry table (§1) lives by extinction-era rules — extinction is
new, context-bound learning, not erasure (Bouton & Bolles 1979; Bouton &
King 1983; Bouton 2004; emotional-memory.md §6):

- **Fire:** on context construction / ambient ticks, entries whose `cue`
  matches the current context contribute `C.affect += valence·strength`
  (scaled by the suppressor below). Sets `lastFireDay`.
- **Decay:** `strength *= (1 − cond_decay)` daily, `cond_decay ≈ 0.005` —
  fear/preference associations outlive their episodic sources by design.
- **Extinction (suppression, not deletion):** each time a cue fires on a
  safe day (no matching-arousal event), `safeCount++`; emitted strength
  is `strength·max(0.2, 1 − extinct_suppress·safeCount)`
  (extinct_suppress ≈ 0.08) — the response attenuates but never dies.
- **Renewal:** the suppressor is context-bound — apply it only when the
  cue fires in the place context where the safe exposures accrued; a
  different place waives suppression entirely.
- **Spontaneous recovery:** if `now − lastFireDay > recovery_days` (30),
  `safeCount *= (1 − recovery_frac)` (0.5) — old dread resurfaces after
  quiet months.
- **Reinstatement:** a new event with `arousal ≥ cond_thresh` sharing the
  cue resets `safeCount = 0` and re-adds `cond_gain·arousal` to strength.
- **Generalization gradient (v1.7):** firing is similarity-keyed, not
  exact-match — `emit = valence·strength·sim` whenever
  `simOp(cue, C cues, "sim_cond") ≥ 1 − gen_width` (gen_width ≈ 0.25). Effective
  width widens with trauma load: `gen_width_eff = min(0.6, gen_width +
  0.15·n_trauma_records)` — anxiety flattens the gradient (Dunsmoor et
  al. 2009; Lissek et al. 2005/2010; Dunsmoor, Martin & LaBar 2012
  conceptual transfer comes free via shared topic/people fields).
  safeCount accrues in the fired similarity band, so close-but-safe
  neighbors partially extinguish.
- **Reconsolidation-window extinction (v1.7 — DEBATED):** on fire,
  set `reconsol_open` for `reconsol_window` (0.25 day ≈ 6h). A safe
  exposure inside the window adds `safeCount +=
  reconsol_extinct_gain` (3.0) and marks the suppressor `deep:true` —
  spontaneous recovery does NOT erode deep suppressors (Schiller et
  al. 2010; fragile in replication — Chalkia et al. 2020; treat as
  the sim's exposure-therapy mechanic, emotional-memory.md §21).

### 4.10 Social-source decay modifiers (new in v0.8)

- **Cheater persistence:** records whose `verbatim.who` person has
  `PersonModel.cheaterLoad > 0.5` decay their source tag at
  `beta_source·cheat_source_mult` (0.6) — remembering *who* cheated
  outlives equivalent neutral associations, with NO effect on face
  recognition or content strength (Buchner, Bell, Mehl & Musch 2009:
  source-memory advantage η²≈.14, old-new discrimination unaffected;
  social-memory.md §3). Deliberately NOT on the age-decline curve —
  preserved in older adults (Bell & Buchner 2012).
- **Mnemic recall suppression:** records of self-threatening feedback
  (valence < −0.3, selfRelevance > `mnemic_centrality`, content about a
  self trait) take `θ += mnemic_loss` (0.15) in **recall mode only —
  recognition mode exempt** (Green, Sedikides & Gregg 2008: the effect
  is recall-specific; "forgotten but not gone"). Waived for close-other
  sources; ×0.3 under the depressive modifier (social-memory.md §10).
- **PersonModel decay:** `familiarity` at `beta_semantic·0.5`,
  `identityStrength` at `beta_source` (the associative tier — §2 link_p
  deficit applies), `nameStrength` at `beta_source·1.2`;
  `cheaterLoad` decays at `cond_decay·0.3` (moral reputation is sticky);
  `credibility` and `knowsTopics` do not decay (semantic directory).

### 4.11 Storage strength — the S/R split (v0.9 deepening)

`strength` is retrieval strength R (accessible now). Each record also
carries `storageS` — how well-learned it is (Bjork & Bjork 1992 New
Theory of Disuse; formal-model.md §10):

- **Birth:** `storageS = encodingE`.
- **On successful retrieval:** `S += s_gain·lag_mult·(1−S)·(1−R_pre)`
  where `R_pre` is strength *before* the §5.9 reboost — the desirable-
  difficulty term: hard retrievals grow S, easy ones barely do
  (Karpicke & Roediger 2008). **v1.3 splits s_gain by access kind**
  (forgetting-curves.md §7.2): `s_gain_recall` = 0.35 for effortful
  recall of one's own record, `s_gain_rehear` = 0.12 for passive
  re-exposure (hearAccount match, re-witnessing) — rehear refreshes
  `lastAccessDay` identically (R-side benefit is the same) but buys ~⅓
  the storage growth; the Roediger & Karpicke 1-week inversion is the
  emergent consequence. `lag_mult` is the spacing factor:
  `exp(−(ln(gap/(lag_opt_ratio·recordAge)))² / (2·lag_width²))` with
  `lag_opt_ratio` 0.15, `lag_width` 1.0 — S-growth peaks when the gap
  since last access is ~15% of the record's age (Cepeda et al. 2006:
  optimal ISI scales with RI); gap < `massed_gap` (0.08d ≈ 2h) instead
  gets `massed_retell_mult` 0.4 — back-to-back retelling is mostly
  wasted.
- **Failed-retrieval potentiation (v1.3):** a recall() attempt that
  scored the record but missed θ sets `attempted: true`; the next
  re-encoding/re-exposure of matching content gets
  `E_new *= (1 + potent_gain)` (0.3) and consumes the flag (Kornell,
  Hays & Bjork 2009 — struggling to recall, then hearing it, beats never
  trying).
- **Decay:** `S *= (1 − s_decay)` daily, s_decay ≈ 0.0008 — near-
  permanent; under the §4.8 terminal ramp s_decay is a capacity param
  (`*= (1 + terminal_gain·t_frac)`).
- **Archive:** §4.4 tests R only; S persists in archived records.
  On maximal-cue resurrection: `R ← max(R, min(resurrect_R, S))`,
  resurrect_R ≈ 0.35 — high-S "forgotten" records return nearly
  functional.
- **Savings/relearn:** re-encoded content matching an archived record
  (simOp(·,·,"sim_merge") > merge_thresh) merges rather than duplicating, with
  `E_new *= (1 + relearn_gain·S_old)`, relearn_gain ≈ 0.8 (Ebbinghaus
  savings; Nelson 1985).
- **Permastore:** §4.7 gates on `S ≥ permastore_thresh`.

PersonModel tiers are exempt — they keep their own strength ordering
(adding S/R there doubles bookkeeping for no behavioral gain).

### 4.12 Deliberate suppression — a bounded R-side leak (new in v1.3)

`suppressEvent(charId, recordId)` models a character consciously
avoiding a memory. Each call: `record.suppressed++` and
`θ_eff += suppress_theta` (0.08, cumulative, capped at
`suppress_cap` 0.3). Acts on retrieval-side accessibility ONLY —
`storageS` untouched; the §5.7 involuntary scan **ignores** suppression
entirely (the avoided memory is the one that ambushes you in the
shower). Magnitude deliberately small: TNT suppression-induced
forgetting is ~8% (Anderson & Green 2001; Anderson & Huddleston 2012)
with an uneven replication record — `suppress_cap` ×0.5 under trauma/
depressive modifiers (reduced control where most wanted; Stramaccia et
al. 2021). forgetting-curves.md §7.7. This is a leak, not a delete key.

### 4.13 Retell ecology — rehearsal emerges (new in v1.3)

Once per daily tick, each live episodic record draws
`p_retell = retell_base·E_adj·(1 + retell_social·sharedCue
+ share_k·|affect|)·(1 − share_shame_pen·shameFlag)`
(`retell_base` 0.015/day; `retell_social` 1.0 when a co-present
participant/topic cue is in context). **v2.0 — the Rimé motive terms
(social-memory.md §18):** `share_k` ≈ 0.8 makes sharing propensity
scale with emotional intensity (Rimé et al. 1998: ~80–95% of emotional
episodes are socially shared, frequency ∝ intensity, valence-agnostic);
`shameFlag` (negative self-as-agent content, selfRelevance>0.6 &
valence<−0.4 — behavior layer may supply the flag directly) suppresses
sharing by `share_shame_pen` ≈ 0.5 (Finkenauer & Rimé 1998). Retells
grow S via §4.11 and dampen arousal only via `verbal_dampen` — there is
NO additional affect relief (`share_relief` is frozen at 0): talking
about it preserves the memory without healing it (Zech & Rimé 2005 —
the recovery illusion; guarded by P184). On fire: §5.9 reboost + §4.11
S-growth at `s_gain_recall` + §6.1 drift. This is the mechanism behind
the flat autobiographical curves (Linton; Wagenaar): the top few percent
of records get rehearsed toward permanence while the rest ride the
β=0.5 slope — survivorship, not a second functional form
(forgetting-curves.md §7.9). When the real social/rumor engine exists,
replace the Bernoulli draw with actual conversation opportunities.

### 4.14 Latent infancy layer — stored but inaccessible (new in v1.5)

Infantile amnesia is an accessibility failure, not a storage failure
(Travaglia et al. 2016: reminder-reinstatable latent traces; Guskjolen
et al. 2018: optogenetic recovery of tagged infant engrams;
age-development.md §11). Two rules:

- **Retention window (encodeAge < 3):** records auto-set `latent: true`
  once `now − createdDay > ret_window(a) = ret_win_base·(encodeAge+1)`
  days (`ret_win_base` ≈ 3 — Rovee-Collier: infant retention grows
  ~linearly with age). The window fires regardless of strength —
  infancy storage is time-boxed.
- **Amnesia-zone transition (encodeAge < amnesia_exit_eff):** records
  that fail the §4.1 consolidation gate or later decay below
  `forget_thresh` set `latent: true` instead of archiving.

`latent` records are invisible to `recall`, `ambientMemoryScan`, §4.13
retell draws, and §6.x distortion operators — they cannot be rehearsed
or merged. `storageS` persists (they are stored). The ONLY route back
is §5.20 compound sensory reinstatement. Records with
`encodeAge ≥ amnesia_exit_eff` never go latent — they archive normally
under §4.4.

### 4.15 Childhood consolidation inversion — naps (new in v1.5)

Children consolidate *more*, not less, from sleep (Wilhelm, Diekelmann
& Born 2008) and daytime sleep is a real consolidation event
(Kurdziel, Duclos & Spencer 2013: nap-encoded benefit, habitual-napper
dependence, and a ~10% nap-deprivation loss NOT recovered overnight).
Two changes:

- `sws_mult` knot table gains a child side: 1.2 (`sws_child_peak`) at
  age 6, linear to 1.0 by ~14 — the curve is now genuinely lifespan,
  not decline-only.
- `dailyMemoryTick(charId, sleepQuality, nap: true)` — a mid-day mini
  tick (game-supplied for `age_now < nap_age_exit`, 6) applies the §4.6
  consolidation-window decay rate to same-morning records early. If a
  nap-habitual child (bible flag `naps: true`) misses the nap, same-day
  records take `strength *= (1 − nap_loss)` (0.1) at the night tick —
  the loss is permanent (Kurdziel: overnight sleep does not recover it).

---

## 5. Retrieval — probabilistic, cue-driven (rewritten in v0.2)

Calibration for everything in this section: `retrieval-cues.md` (RC§n).
v0.2 changes: encoding-specificity gate, saturating cue combination, log fan,
place-reinstatement term, age-scaled sensory cues, mood-state dependency
(distinct from mood congruence), recognition-vs-recall modes, involuntary
retrieval, part-list cuing.

### 5.1 Cue gating — only encoded cues exist (new in v0.2)

A retrieval context `C` (current place, present people, active topics, sensory
inputs, current mood, mode) matches memory `m` **only on fields present in
`m.cueVector`**. A cue the character never encoded contributes exactly 0 —
Tulving & Osler 1968: cues present only at retrieval do nothing (RC§1).
Absent fields are not "partial credit," they are not cues.

### 5.2 Saturating cue combination (replaces v0 weighted sum)

Two simultaneous cues are no better than one (Tulving & Osler 1968), so cue
fields combine by **noisy-OR**, not sum:

```
per-field match:    c_j = w_j · overlap(C_j, m.cueVector_j)      ∈ [0, w_j]
sensory age scale:  c_sensory = w_sensory · overlap · (1 + sensory_age_slope
                                  · log1p(m.ageDays/30))         // RC§3 Proust
mismatch penalty:   if a salient sensory field mismatches:
                    cueMatch -= sensory_mismatch_pen (0.05)      // RC§3
language match (v1.9):  if C.lang && m.lang && C.lang != m.lang:
                    c_verbal, c_topic, c_people *= lang_mismatch   // ≈0.6
                    // language-of-encoding is a context cue
                    // (Marian & Neisser 2000) — attenuates, never gates
cueMatch_ext = 1 − Π_j (1 − min(c_j, 1))                         // saturates at 1
place reinstate:    if C.place == m.cueVector.place:
                    cueMatch_ext += place_reinstate · (1 + log1p(m.ageDays/30))
                    // grows with memory age — Smith & Vela interval interaction
mental reinstate:   if C is a guided reconstruction (co-conversationalist
                    describes the scene): += mental_reinstate (≈0.6×
                    place_reinstate)                              // RC§2
```

Cue-weight ordering constraint (v0.1, kept): `w_topic ≥ w_people ≈ w_place >
w_sensory` (Wagenaar 1986); era/when stays weak, `verbatim.when` drifts at
`drift_p·1.5`.

### 5.3 Mood terms — congruence vs state-dependence (split in v0.2)

Two separate phenomena (RC§4):

```
moodCongruence = w_state · (1 − |m.emotional.valence − C.mood|)/2
                 // event valence × current mood — CONSENSUS, larger effect
moodStateDep   = w_msd · (1 − |m.encodeMood − C.mood|)/2
                 · (1 − cueMatch_ext)
                 // encoder mood match — small, and ERASED by strong
                 // external cues (Eich meta; Mecklenbräuker & Hager)
```

### 5.4 Retrieval probability

```
drive(m) = cueMatch_ext·env_support_gain + moodCongruence + moodStateDep
           + recencyBump(m) + contiguityTerm(m)
           + (C.intox && m.intox ? intox_state_dep·
              (1 − |C.intox − m.intox|) : 0)          // v1.9, small
           + m.strength·w_str − θ + N(0, ret_noise) + N(0, iiv_sigma/2)
// v1.9: iiv_sigma/2 is the per-call half of the inconsistency trait
// (§2 day_mult is the per-day half); record field `m.intox` = the
// encode-time context.intox (schema gain — default 0).

// v0.9 deepening — temporal contiguity (formal-model.md §14):
contiguityTerm(m) = C.temporalAnchor == null ? 0 :
    contiguity_gain·exp(−|m.createdDay − C.temporalAnchor|/contiguity_tau)
    · (m.createdDay ≥ C.temporalAnchor ? contiguity_asym : 1)
// C.temporalAnchor = createdDay of the last record recalled this
// conversation — recall reinstates temporal context, which cues
// neighbors-in-time with forward asymmetry (Howard & Kahana 1999/2002)
P(recall m) = logistic( k · drive(m) ) / (1 + fan_k · ln(1 + fan(m)))
```

- `fan(m)` = number of OTHER live records sharing m's dominant cue;
  **merged/generic memories (§4.3) count as one fan item** — situation-model
  integration abolishes fan cost (Radvansky et al. 1993). Log divisor per
  ACT-R fits (Anderson & Reder 1999); `fan_k` ≈ 0.4.
- `θ` = retrieval threshold param; `k` = sharpness (~8). Dice roll, not lookup.
  **v0.5 — acute stress impairs retrieval:** if the context carries
  `C.stress > stress_retrieve_thresh` (0.6), add
  `stress_retrieve_loss·C.stress` (≈0.12) to θ for this call —
  glucocorticoids impair retrieval of even well-learned material while
  sparing encoding/consolidation (de Quervain et al. 1998/2000; requires
  concurrent arousal, Roozendaal et al. 2004; emotional-memory.md §4).
  Retrieval-side only; never touches decay.
  **v0.7 — synchrony on θ:** with `peak_hour` set, θ gains
  `synchrony_gain·(1 − cos(π·Δh/12))/2` — recall is HARDER off-peak,
  mirroring the §2 encoding modulation; age-scaled per §2 (May &
  Hasher 1993; individual-differences.md §5).
- `recencyBump` = `rec_k · exp(−(now − createdDay)/rec_τ)`, rec_τ≈2 days.
- **Archived records** (strength < forget_thresh, §4.4) are reachable only if
  `cueMatch_ext > resurrect_thresh` (≈0.85) — a near-total context
  reinstatement or someone narrating the event back (maximal cue).
  **v0.9:** resurrected R is floored at `min(resurrect_R, S)` (§4.11) —
  revival strength scales with how well-learned the record was, not a
  flat return. contiguityTerm alone can never reach an archived record
  (it is drive-only and too small to cross resurrect_thresh).
- **v0.9 — searchCost output:** the call also returns `searchCost`
  (scored/returned candidate ratio + mean drive margin) — the retrieval
  *experience* the dialogue layer reads for judged-frequency statements
  (ease-of-retrieval, formal-model.md §13): `searchCost ≤ ease_few`
  reads "happens all the time," `≥ ease_many` reads "barely ever,"
  independent of actual count (Schwarz et al. 1991).
- **v0.4 — environmental support (age-decline.md §1):**
  `env_support_gain(age_eff)` ≥1 multiplies cueMatch_ext's contribution —
  cue-rich contexts disproportionately rescue older retrieval; deficits
  concentrate in self-initiated (low-cue) search (Craik 1983/2022; Angel
  et al. 2010). Do NOT age-penalize the place-reinstate term — older
  adults benefit equally (2024 context-reinstatement meta, g=0.32).
- **v0.4 — retrieval noise:** `N(0, ret_noise(age_eff))` added to drive;
  σ 0.05 young → 0.16 at 85 (dedifferentiation/within-person variability,
  Li & Lindenberger; age-decline.md §10). Same draw logic perturbs
  `misinfo_suscept`/`tot_rate` rolls.
- **v0.4 — search breadth:** score at most `search_breadth(age_eff)`
  candidate records per recall call (cue-bucket preselection, then rank
  by drive; ~12 young → 5 at 85). Older characters surface fewer
  candidates with identical cue math (processing-resource decline,
  Craik; Salthouse; age-decline.md §2). Also caps §5.7 scan breadth.
- **v1.6 — stereotype threat:** if `cueContext.evaluative: true` (the
  character knows their memory is being judged) and the mode is
  `recall` — NOT recognition — `θ += stereo_suscept·0.06·
  stereo_age_gate(age_now)` and `lapse_p` +0.02 for the bout.
  `stereo_age_gate` = 0 below 50, ramps to 1 by 70 [frozen shape].
  Recall-only per the Armstrong et al. 2017 meta moderator; the
  Hess/Lamont literature's effect is real but small (d≈.3 overall,
  d≈.52 stereotype-framed) — this is a situational tax, not a trait
  deficit (age-decline.md §24).
- **v1.6 — positivity at selection:** among near-tied candidates
  (drive within 0.05) prefer the positive-valence record with
  probability `pos_eff` (§2 formula; age-decline.md §18). Older
  reminiscence leans warm even when the archive doesn't.

### 5.5 What retrieval returns

Not the record — a **reconstruction**:
1. Return `gist` verbatim fields only if `verbatimStrength` survives; else
   regenerate details schema-consistently (confabulation hook §7.2).
2. If `beliefStatus` is `rumor`, return content tagged as uncertain **unless**
   source tag has decayed (§7.3) — then it may be returned as fact.
3. Attach `confidence` for downstream dialogue hedging ("I think…", "I'm sure…").
4. **v0.4 — specificity gate:** before reconstruction, with probability
   `1 − specificity_eff` return the generic/merged record covering this
   episode instead (overgeneral autobiographical memory in aging,
   Piolino et al. 2006/2009; Autobiographical Interview meta — fewer
   internal, more external details; age-decline.md §5).
   `specificity_eff = specificity(age_eff)·(1 + pos_spare·valence)` for
   valence>0 (`pos_spare`≈0.2 — positive-cue sparing, AMT meta 2025).
5. **v0.4 — TOT partial retrieval:** when a surviving
   `verbatim.who`/name field is requested, blank it with probability
   `tot_rate(age_eff)` (×1.5 for proper-name fields; ×higher if the
   referent's records are nonrecent — Rastle & Burke 1996): return the
   record with the name slot empty and a `tot: true` flag — a
   feeling-of-knowing state, not a missing memory (Burke et al. 1991;
   age-decline.md §6). A subsequent recognition-mode cue resolves it at
   near-young rates (resolution spared with age).
6. **v0.5 — mood bleeds into the telling:** the returned affect tag is
   shifted toward current mood —
   `reported_valence = m.valence·(1−mood_bleed) + C.mood·mood_bleed`
   (mood_bleed≈0.10; Matt et al. 1992 meta d≈0.4) and
   `reported_arousal = m.arousal·(1 + mood_arousal_bleed·|C.mood|)` (≈0.1).
   The stored tag is unchanged — bias accrues only through §5.9
   reconsolidation drift on retellings (emotional-memory.md §8).
7. **v0.5 — trauma reconstruction:** for `trauma: true` records, return
   gist + core verbatim but blank/drift `verbatim.when` and ordering
   fields (encoded at half strength per §7 of emotional-memory.md) —
   vivid event, fragmented timeline (Brewin et al. 1996).

### 5.6 Recognition vs recall modes (new in v0.2)

`recall(charId, C, k)` takes a `mode` field on `C`:
- `"recall"` (default): contextual reconstruction — the formula in §5.4.
- `"recognition"`: C is a copy cue (a face, a photo, a name spoken aloud).
  Verbatim/copy fields match at full `w_str`, but contextual fields don't
  apply. Crucially, recognition can FAIL for memories that recall would
  return — Tulving & Thomson 1973, recognition failure of recallable words
  (RC§1; Muter 1978: ~53% failure for names later recalled). Implement: in
  recognition mode, records whose `cueVector` lacks the copy feature get
  `cueMatch_ext · recogn_pen` (≈0.4). A character can fail to "place" a face
  yet recall the person perfectly given the right context — and vice versa.
- **Lure acceptance (v0.4):** in recognition mode, a cue that is
  *similar-but-not-identical* (feature overlap ∈ [0.5,1.0)) is accepted as
  a match with probability `lure_accept(age_eff)·overlap` — the
  pattern-separation deficit produces false "yes, that's the scarf"
  endorsements, robust to instructions (Stark et al. 2013/2015;
  age-decline.md §4). **v1.9 — domain-scoped:** when the lure is
  consistent with a profile `domains` entry (same domainMatch test as
  §2 expert_gain), add `expert_lure` (≈0.10) — experts falsely recall
  MORE domain-consistent material (Castel, McCabe, Roediger & Heitman
  2007; Baird 2003). Same term applies to §6.3/§6.8 adoption of
  domain-consistent misinformation and phantom content.

### 5.7 Involuntary retrieval (new in v0.2)

Memory surfaces without search — the normal case, not the exception
(Berntsen: involuntary ≈ 3× voluntary frequency, 2–5/day, arising under
unfocused attention; RC§5). Each ambient tick (when the character is NOT in
focused task/conversation), run a cheap cue scan over live records:
```
if character attention state == "unfocused":
    for records sharing any cue key with current C:
        if cueMatch_ext(m) > intrusion_thresh (≈0.75):
            m surfaces spontaneously → normal reconsolidation §5.8 applies
```
`intrusion_thresh` drops ~0.15 under active stress and for trauma-tagged
records — **v0.5: the −0.15 discount is a property of `trauma:true`
records themselves** (not only the character modifier). **v2.2:**
`confidential` records get an independent intrusion channel —
`cueMatch_ext` threshold effectively `intrusion_thresh − secret_mindwander`
(≈0.08, ×(1+0.4·selfconceal trait)) — secrets mind-wander in at ~2× their
concealment-situation rate (Slepian, Chun & Mason 2017: the burden of
secrecy is spontaneous thought, not social hiding; the wellbeing cost
tracks intrusion frequency, not concealment frequency), and each
intrusive resurfacing re-stamps `emotional.arousal` to ≥0.7 — intrusions
rehearse the affect, which is why flashbacks don't fade (reconsolidation,
§5.9; emotional-memory.md §7). Intrusive memory is the same machinery at
pathological gain. Tune so a quiet day yields 2–5 spontaneous recalls per
main character (validation probe P14, RC§8).

### 5.8 Retrieval-induced forgetting and part-list cuing

On successful recall of `m`: for each linked/competing record `n` with
simOp(·,·,"sim_rif") > 0.5 that was NOT recalled, `n.strength *= (1 - rif_k)` (rif_k≈0.05).
Retelling a story forgets the details you skipped (R§3).

**Part-list cuing (v0.2):** in `discussEvent`, the speaker's narration IS a
part-list cue for the listener (Roediger 1973; RC§6). Fields the speaker
covered → misinformation merge §6.3 as before; fields the speaker *omitted*
→ `plist_suppress` (≈0.05 strength + one-day retrievability penalty via
temporary θ bump). Effect attenuates for old memories — bounded per Bäuml's
long-delay findings (RC§6). **v0.5:** `trauma:true` records are EXEMPT from
plist_suppress — you cannot talk a character out of parts of a trauma by
narrating the other parts (emotional-memory.md §7).
**v0.8 — socially shared RIF:** the listener's OWN related records that
were not surfaced also take `strength *= (1 − ss_rif_k·listenerAttention)`
(ss_rif_k ≈ 0.04 — slightly weaker than speaker-side rif_k; listeners
co-retrieve covertly only when attending; Cuc, Koppel & Hirst 2007;
autobiographical extension Stone, Barnier, Sutton & Hirst 2010/2013;
social-memory.md §6). Shared silences: a speaker who always tells one
version makes listeners progressively unable to recall what she omits.
Same trauma exemption as plist_suppress.
**v2.0 — the facilitation switch:** unsurfaced records that are
*integrated* with the surfaced one (same event id or a `links` edge —
not merely cue-similar) flip sign: `strength *= (1 + rif_facil_k)`
(≈0.03) for both speaker and listener (Chan, McDermott & Roediger 2006
— retrieval practice facilitates related material under integrative
encoding; suppression is for competitors, facilitation for
co-members). The switch rule: `links` edge or shared event id →
facilitate; cue-similar but unlinked → suppress as before
(social-memory.md §19).

### 5.9 Reconsolidation on recall

Each retrieval: `lastAccessDay = now`, `retrievalCount++`,
`confidence += 0.03`. **v0.9 — two-strength update replaces the flat
boost** (§4.11; formal-model.md §10):

```
S += s_gain·(1−S)·(1−R_pre)          // difficulty-weighted learning
R ← 1 − (1−R_pre)·(1 − retell_boost·(0.5 + 0.5·S))
                                     // high-S records snap back fully
```

Massed retellings (R_pre high) barely grow S — retelling a story the
same week doesn't cement it; a hard-won recall after months does.
**And** the record re-enters a mutable state: the *current* context
writes small deltas into it (§6.1). Memory is rewritten on every telling
(R§4).

### 5.10 Person recognition — the cascade (new in v0.8)

When `C` is a person copy cue (a face encountered, a photo) and
`C.targetPerson` resolves, evaluate the `PersonModel` in strict tier
order (Bruce & Young 1986; Burton, Bruce & Johnston 1990;
social-memory.md §1):

```
tier1 familiarity:  roll vs familiar_thresh (0.25) on familiarity
    fail → "stranger" (even if identity/name would have passed —
    cascade is ordered; you can't recall the name of a face you
    don't know)
tier2 identity:     roll vs identity_thresh (0.4) on identityStrength
    fail → return {tier:"familiar_only"} — "I know you from
    somewhere" WITHOUT biography; normal resting state for
    acquaintances, not a TOT (Muter 1978)
tier3 name:         roll vs name_thresh (0.55) on nameStrength
    fail → return identity + tot:true — the feeling-of-knowing
    state; existing §5.5 TOT rules apply (name tier only)
```

- Tier strengths update like records: encounter refreshes
  `lastSeenDay`, boosts the accessed tiers (§5.9 boost applies per tier).
- `oab_loss` applies at tier1 encoding only; `tot_rate` (v0.4) applies
  at tier3 as before — name TOT is the commonest TOT (Burke et al. 1991).
- **Directory mode:** `C.mode == "directory"` ignores the cascade and
  returns candidate persons ranked by `knowsTopics[topic]` strength —
  "I don't know, but Jules would" (transactive memory, §6.14;
  Wegner 1987).

### 5.11 Reminiscence across attempts (new in v1.3)

Successive recall attempts without re-exposure surface *new* verbatim
fields: on each successful recall, every verbatim field not yet returned
with residual strength > 0 surfaces independently at
`reminiscence_frac` (0.15). Reminiscence (new items on attempt n>1) is
robust; net hypermnesia is NOT required — fields also drop between
attempts via ordinary field-strength decay, matching the eyewitness
pattern (Scrivner & Safer 1988; Dunning & Stern 1994: reminiscence
yes, net gain no; Payne 1987: net gain only for recall-mode, high-
imagery material). RW effect: retelling the story a second time
plausibly adds a detail — while others have quietly fallen out
(forgetting-curves.md §7.3).

### 5.12 Transfer-appropriate processing — ops gate (new in v1.4)

A cue matches the *processing channel* used at encoding, not just stored
features (Morris, Bransford & Franks 1977; RC§10). Context `C` carries
`C.ops` — the dominant channel of the current processing context
(semantic = topic talk; perceptual = sights/sounds; social = people
focus; enactive = doing the same kind of thing):

```
cueMatch_ext *= (C.ops == m.encodeOps ? 1.0 : tap_mismatch)   // ≈0.55
```

Applied multiplicatively to the whole external match, AFTER the §5.1
gate and §5.2 combination, BEFORE mood/state terms. TAP never zeroes
recall — it reorders which cue wins. `encodeOps` is set at encoding from
the v1.2 `engagement`/elaboration channel (enacted→enactive;
spoken/heard→perceptual default; generated→semantic; social events→
social). Absent → default by source.kind. P127.

### 5.13 Output interference — exhaustive recall self-destructs (new in v1.4)

A multi-item recall bout (`k > 1`, "tell me everything") is NOT k
independent draws (Tulving & Arbuckle; Roediger & Schmidt 1980; RC§11):

```
candidates sorted by drive, emitted greedily
n-th emitted item: P *= out_int^(n−1)          // ≈0.85 compounding
each emitted item applies §5.8 rif_k to unemitted same-bucket records
```

Two consequences the game reads: interrogation-style exhaustive prompts
return a strong 2–3 details then trail off (cognitive-interview
ordering — free narrative first); and the trailing-off is real
forgetting — what wasn't said is weakened for tomorrow.

### 5.14 Prospective cue ecology — focal vs monitored firing (new in v1.4)

`rememberIntention` records gain `cueType` (`"event"|"time"`, default
event) and `focal` (bool — is the cue the object of the character's
current attention when it appears). On each ambient/tick where the
intention is armed (§4.x `beta_pm` decay unchanged):

```
event + focal:    fires at pm_focal_hit (≈0.9) when the cue appears in C
                  — near-automatic, age-flat (Einstein & McDaniel 1990)
event + nonfocal: fires only on a monitor roll: p = pm_monitor_p
                  · attentionHeadroom · (1 − pm_time_age_loss·ageScale)
time:             no external cue — ambient clock-check draw pm_clock_p
                  per tick, also ×(1 − pm_time_age_loss·ageScale); fires
                  only if the check lands inside the intention window
```

Focality is evaluated by game-systems from the attention budget (cue is
what the character is already doing vs. peripheral). `ageScale` =
age_eff/65 clamped 0..1. Henry et al. 2004 meta: nonfocal and time-based
are age-damaged, focal spared but not immune (P129, P130). RW texture:
"give Jules this when you see him" almost always lands; "call the
landlord at 5" fails exactly in proportion to busy-ness and age.

### 5.15 Context-scoped extinction — renewal (new in v1.4)

§4.9's `extinct_suppress` was global; Bouton's central finding is that
extinction is a new inhibitory association bound to the context it was
learned in (Bouton 2004; RC§13). Now: each safe exposure in context `ctx`
adds `ctx` to `extinctCtx`; `extinct_suppress` applies ONLY when the
current place ∈ `extinctCtx`. Elsewhere the conditioned entry fires at
`strength · renewal_frac` — i.e. `renewal_frac` (≈0.6) of the
pre-extinction response returns on a context switch (ABA renewal).

`recovery_days`/`recovery_frac` still govern spontaneous recovery inside
an extinctCtx. RW texture: weeks of calm park visits do NOT generalize to
the alley — calm was learned in the park (P131).

### 5.16 Stateful TOTs — resolution cues and error repetition (new in v1.4)

The §5.5 `tot:true` flag becomes stateful via `tot_fields` (schema v1.4):

```
on unresolved TOT on field f:   tot_fields[f]++
next attempt on f:            tot_rate_eff = tot_rate · tot_persist^tot_fields[f]
                              // ≈1.5 — learning to fail (Warriner &
                              // Humphreys 2008: ~2× after long dwell)
resolution cues:   syllable cue ("it starts with 'Mar-…'") resolves at
                   tot_resolve_p ≈ 0.3 → clears tot_fields[f], field fills
                   letter-only cue: tot_resolve_p/3 (Abrams 2007: first-
                   syllable primes resolve; first-letter primes don't)
                   extra semantic description of referent: ≈0
on resolution:     normal §5.9 reboost; tot_fields[f] cleared
recognition cue:   resolves at near-young rates (§5.5 unchanged)
```

A character who blanks on a name at dinner plausibly blanks on the SAME
name next week — error repetition is a property of the failed mapping,
not the item (P132, P133).

### 5.17 Reminding chains — a retrieved record is a cue (new in v1.4)

On a successful recall of `m`, emit a derived context
`C′ = m.cueVector` and run one restricted scan over `m`'s linked records
(`links`, §2 `link_p`), scored at `chain_gain` (≈0.5) × normal drive,
depth capped at 1 — a retrieved memory cues its associates even when the
external context doesn't (RC§15; temporal version already exists as
contiguityTerm — this is the associative version). Reminded records get
the normal §5.9 reboost: being reminded strengthens. Produces the
reminiscence cascade — one character's story pulls the other's related
story up unprompted. `searchCost` of the derived scan is discarded;
depth-2 is a digression, not memory (P134).

### 5.18 Sleep-context cuing — TMR analog (new in v1.4)

During the nightly consolidation tick (§4.6), records sharing a salient
`sensory` cue with the SLEEP context get an extra `tmr_gain` (≈0.12) on
the consolidation boost — declarative only, procedural exempt, and ONLY
if the cue was encoded on the record (Rasch et al. 2007: odor absent at
learning → zero effect; REM/wake presentation → zero effect). Ties the
§5.1 gate into consolidation: where you sleep votes on what survives
(P135 — direction SHOULD, magnitude OBSERVE; design extrapolation,
RC§19).

### 5.19 Off-target verbosity — inhibition loss at emission (new in v1.5)

During a `recall` bout (k>1) or a `retell`, each emitted item after the
first has probability `offtarget_p(age_eff)` of being supplemented or
replaced by a *weakly-related* live record — one sharing a person or
era tag with the emitted item and with drive ≥ 0.2·θ (activated but
irrelevant to the query). Knots: 0.01 at 20 → 0.03 at 50 → 0.15 at 80;
mildly elevated below age 10 (same inhibition immaturity, other end).
Emitted off-target records receive the normal §5.9 reboost — rambling
rehearses the tangent. Grounded in the off-target-verbosity literature
(Arbuckle & Gold 1993: OTV is predicted by working-memory
deletion/restraint failures, not by talkativeness; Hasher & Zacks 1988
inhibition framework). DEBATED component: Trunk & Abrams 2009 argue
OTV is partly communicative style — the profile layer may therefore
raise `offtarget_p` at any age for loquacious characters; the age
slope is the deficit, the intercept is the personality
(age-development.md §14; P139 measures emission rate only).

### 5.20 Latent reinstatement — the compound-sensory route (new in v1.5)

The single exception to §4.14 invisibility: when a cue context
simultaneously matches ≥2 `sensory` cueVector fields AND the `place`
field of a `latent` record (the Travaglia et al. 2016 requirement —
reminder must combine context AND salient reinstatement; partial
reminders do nothing), roll `latent_recall_p` (0.08). On success the
record returns as a Reconstruction with `latent_returned: true`:
source kind absent, confidence floored at 0.3, verbatim mostly empty —
a fragment, not a scene; its missing fields are maximal §5.5
confabulation surface. A successful return clears `latent` and writes
`lastAccessDay` — the reinstated fragment re-enters the normal economy
(now rehearseable, now distortable). Single-cue contexts, word cues,
and `tell-me-about` prompts can NEVER reach latent records — the
childhood-home-scene cue pattern is the only door (P136 sign-locks the
cue requirement).

### 5.21 Metamemory instruments — FOK and JOL (new in v2.1)

The character's sense of its own memory, computed from retrieval
*products*, never from the trace itself (Koriat's accessibility model,
Koriat 1993; Koriat & Levy-Sadot 2001). Full grounding and rationale:
formal-model.md §19.

**Feeling-of-knowing** — computed on recall failure and TOT returns:

```
partialScore = (# verbatim fields above candStrength floor)/(# encoded)
fok = logistic(k_fok·(a_cue·cueMatch_ext + a_part·partialScore
      + a_fam·familiarity(targetPerson) − θ_fok)) + N(0, fok_noise)
episodic records, older characters: fok += N(0, fok_age_noise·age_eff/70)
   — episodic-only sensitivity loss (Souchay et al. 2000; meta g=0.53
     episodic / ~0 semantic, Sacher et al. 2023); semantic FOK intact
```

`fok` is returned on the Reconstruction (hidden — it steers dialogue
and effort, it is not content). `fok > fok_retry` (0.6) triggers one
follow-up scan at `search_breadth/2` — fragments beget digging. FOK is
accuracy-blind BY DESIGN: confabulated and phantom records produce high
fok (P194 sign-locks the dissociation — an oracle that tracks
correctness is not a feeling).

**Judgment-of-learning** — `encodeEvent` stamps hidden `jol`:

```
jol = logistic(k_jol·(E + jol_fluency·fluencyNow − θ_jol)),
fluencyNow = attention·(1 − lapse)
```

The `jol_fluency` term is the immediate-JOL bias: still-warm fluent
content feels learned even when E is low — immediate JOL gamma ≈ .45
vs .93 delayed (Nelson & Dunlosky 1991; Rhodes & Castel 2008 meta
g = 0.93). On the first retrieval/ecology fire past 1 day, the
delayed product (`drive_achieved`) feeds the SelfModel via `metamem_r`.
`jol` modulates `strategy_use` (v1.0): low jol × high stakes (open
loop, intention) → write-it-down/ask-someone behavior. Per-character
`jol_bias` offsets the intercept — the chronic under/over-estimator.

---

## 6. Distortion — the operators that make characters wrong

### 6.1 Reconsolidation drift

On each retrieval, each verbatim field mutates with probability
`drift_p` (param ~0.08, higher under stress/low confidence). **v0.5 —
valence-conditioned drift** (emotional-memory.md §3):
`drift_p_eff = drift_p·neg_fidelity` (0.85) for valence < −0.3 records —
negative events keep veridical detail (Kensinger & Schacter 2006;
Kensinger 2007) — and `drift_p·pos_gist_drift` (1.15) for valence > 0.3 —
positive memories drift toward gist.
- detail swapped toward schema-typical value ("espresso" → "coffee"),
- `accuracy -= drift_k` (0.02),
- gist never mutates on a single recall, drifts slowly via gist-shift (§6.4).

### 6.2 Confabulation fill

When reconstructing with missing verbatim fields (decayed): fill from the
character's schema for the event type + their beliefs. Each filled field
lowers `accuracy` by 0.03 but **raises confidence by 0.02** (fluency, R§4) —
the better the story flows, the surer they feel. **v0.5:** positive-valence
records (>0.3) confabulate at `confab_fill·pos_gist_drift` — positive
affect recruits conceptual/gist processing (Storbeck & Clore 2005;
emotional-memory.md §3).

### 6.3 Misinformation merge (rumor interface) — calibrated in v0.6

When character hears an account of an event they have a memory of:
```
if simOp(myMemory, heardAccount, "sim_misinfo") > 0.4:
    for each conflicting detail field:
        p_adopt = misinfo_suscept · sourceCredibility
                · (1 − fieldStrength)              // v0.6: per-field
                                                   // verbatim survival —
                                                   // weak traces absorb,
                                                   // strong resist
                · (1 + rep_gain·log1p(hearCount))  // fluency; capped rep_cap
                · (warned ? warn_mult : 1)         // post-warning ≈halves
                                                   // (Blank meta, FM§1)
                · (disputed ? dispute_mult : 1)    // ~0.05 — live dispute
                                                   // blocks (Wade 2018)
                · (sleepdep_flag ? sleepdep_misinfo_gain : 1)  // Frenda 2014
                · (neg_core_resist if valence<−0.3 & arousal>0.6 core field)
                                                   // v0.5, kept
                · (contradicts known semantic (strength ≥ know_protect_thresh)
                   ? (age_eff ≥ know_protect_age ? know_protect_mult : 1)
                   : 1)                             // v1.5: stored knowledge
                                                   // protects OLDER adults —
                                                   // young neglect it
                                                   // (Brashier 2017 vs Fazio 2015)
        if rand < p_adopt: v1.8 — WRITE A COMPETING CANDIDATE, never
                           overwrite (coexistence, not destruction —
                           McCloskey & Zaragoza 1985; Lindsay & Johnson
                           1989; false-memory.md §13):
            field.candidates.push({value: heard, candStrength:
                cand_base_str·sourceCredibility
                ·(1 + rep_gain·log1p(hearCount)),
                provenance:"told_by:"+speakerId, day: worldDay})
            // the original candidate is untouched and keeps its own
            // decayed strength; field retrieval samples ∝ candStrength —
            // fluent misinformation wins most of the time, faded
            // originals can resurface on delay (Tousignant 1986
            // fluctuation/reversion). accuracy -= 0.15 hidden, as before.
            // losing candidates eat §5.13 out_int / §5.8 plist_suppress
            // when the winner is rehearsed — retrieving the adopted
            // version suppresses the surviving original (Shaw, Bjork &
            // Handal 1995 — misinformation entrenches via retrieval)
    hearCount++ on the rumor-content hash (shared across speakers —
        source VARIABILITY adds nothing; only repetition count matters,
        Paterson-line meta k=8; false-memory.md §1)
    heardAccount may merge into myMemory.source ("told_by" contamination)
```

**v1.8 — additional p_adopt moderators (false-memory.md §§20–21):**
```
p_adopt additionally:
  · (1 + neg_gist_gain) if account valence < −0.3
      // negative CONTENT foments distortion via gist — Bookbinder &
      // Brainerd 2016 content-context paradox (§6.17 note: this is
      // the CONTENT half; negative encode-MOOD protects, §2)
  · (prewarned ? prewarn_mult : 1)     // ~0.7 — warned BEFORE exposure
      // helps but less than post-warning (Greene et al. 1982)
  · (worldDay < inoc_until ? inoc_mult : 1)  // ~0.75 — generalized
      // inoculation after being burned; refutational-different works
      // ≈ same (Banas & Rains 2010), decays ~14d (inoc_days)
```
**Hearsay carries heat (v1.7):** a `told_by` record's affect tag is
`arousal = source_arousal · contagion_k · speaker_express ·
(0.5 + 0.5·empathy_trait)` — contagion_k≈0.5 (secondhand is half as
hot), `speaker_express ∈ [0.5,1.5]` from the telling's delivery,
`empathy_trait` bible-set; `valence` adopts the account's sign
(Rimé 2009 social sharing; Hatfield et al. 1993 contagion; Peters &
Kashima 2015). A high-arousal hearsay record CAN cross `cond_thresh`
— vicarious conditioning mints dread of places never personally
feared (Olsson & Phelps 2007; emotional-memory.md §20).

This is THE rumor-propagation hook: a rumor is a `beliefStatus:"rumor"` record
that can contaminate witnessed memories it resembles. (R§6 misinformation
effect — the most replicated result in memory science; 2025 meta
g=0.735 across 480 studies — see false-memory.md §1 for moderator
calibration.)

**Two distortion channels, opposite age gradients (v0.3):**
`misinfo_suscept` is the *suggestion* channel — U-shaped over the lifespan
(high in children, low in adults, high again in the old). `confab_fill` is
the *gist* channel — monotonic rise from childhood into old age, because
meaning-connection machinery strengthens with development (Brainerd &
Reyna developmental reversal; Koutstaal & Schacter 1997). Do not couple the
two params — they must be free to diverge (age-development.md §4, P19).

### 6.4 Source-tag decay and gist abstraction

`source.confidenceInSource` decays at β_source (fast, ~2× episodic gist rate).
When it drops below 0.3: "I heard somewhere…" — content persists, attribution
gone. When gist is retrieved ≥ gist_abs_thresh (≈4) times, optionally spawn a
**semantic record** ("Mara is stingy") — episode becomes trait belief. This is
how episodic events crystallize into the belief-vs-fact layer (R§6, R§9).

### 6.5 Social convergence

When two characters discuss a shared event, run misinformation merge **both
ways** with asymmetric susceptibility — the pair drifts toward a shared
(possibly false) version (social contagion, R§6). **v0.6 calibration:**
adoption is near-total only where the listener holds NO verbatim on the
contested field (Gabbert et al. 2003: 71% adoption on uniquely-seen
items; Wright et al. 2000: 79% conformity). Fields with surviving
verbatim resist at `fieldStrength` (§6.3). If the listener's
reconstruction surfaced a conflicting field and the dialogue layer
registers live disagreement, mark the account `disputed` — adoption for
that field drops to `dispute_mult` this round (Wade et al. 2018
multilab: co-witness errors concentrated in undisputed reports).
Relative power between speakers enters through `sourceCredibility`
(Carol et al. 2013).

### 6.6 Corrections and the continued-influence effect (new in v0.6)

A `correction` account (`account.type == "correction"`, trusted source
asserting the earlier content was false) never deletes or overwrites the
field — misinformation once encoded keeps influencing inference even
when the retraction is itself remembered (Johnson & Seifert 1994; Ecker
et al. 2010/2011; false-memory.md §2):

```
retract_p = correction_strength · sourceCredibility_trust
            // trustworthiness gates, NOT expertise — low-trust
            // retractions are entirely ineffective (Ecker & Antonio 2021)
            // default ≈0.6 for a trusted corrector
            // ×1.2 if the correction repeats the original content
            // (reminder corrections work BETTER — Ecker et al. 2017)
if rand < retract_p: record.retracted = true, beliefStatus → "doubted"
either way: retracted fields keep feeding gist reconstruction and
    §6.4 trait abstraction at weight cie_residual (≈0.3) — the
    correction is known; the misinformation still leaks
```

### 6.7 Believe vs recollect — nonbelieved memories (new in v0.6)

`beliefStatus` is a discretization of a derived pair evaluated at
retrieval (Scoboria et al. 2014; Otgaar, Scoboria & Mazzoni 2014;
Rubin, Schrauf & Greenberg 2003; false-memory.md §7):

```
recollect_q = verbatimStrength·(1 + sensoryRichness)      // reliving
believe_p   = w_plaus·plausibility + w_corr·corroboration
              + w_fluency·fluency(retrievalCount + hearCount)
beliefStatus: >0.8 fact · 0.45–0.8 belief · 0.2–0.45 rumor ·
              <0.2 doubted (regardless of recollect_q)
```

- **Nonbelieved memory** = high recollect_q + believe_p < 0.2 — vivid,
  disbelieved ("I can see it, but it can't have happened"; ~20% of
  adults hold one, Mazzoni et al. 2010). Trauma records after a trusted
  correction can land here.
- **Believed-not-remembered** = high believe_p + ~zero recollect_q —
  fluent corroborated hearsay ("everyone says the fire was arson") —
  the natural state of a `told_by` record with high hearCount.

### 6.8 Phantom / gist-lure records (new in v0.6)

The model can invent records, not just corrupt them — DRM mechanism
(Deese 1959; Roediger & McDermott 1995: 40–55% false recall, false-alarm
recognition ≈ hit rate; fuzzy-trace theory, Reyna & Brainerd 1995:
verbatim suppresses falsity, gist supports it; false-memory.md §4):

```
During reconstruction of m (§5.5), for a schema-typical lure
field/episode converged on by ≥ phantom_fan_min (≈4) linked records:
P(phantomize) = gist_lure_gain (≈0.3) · confab_fill · gistStrength
              · (1 − verbatimStrength)      // FTT suppression
              · discrim_mult                // age: separation deficit
              · (valence<0 ? neg_fidelity : pos_gist_drift)
field-level: write schema-typical detail into verbatim
             (accuracy→0 on that field, confidence += 0.02 fluency)
episode-level (rare, cap phantom_p ≈ 0.02 per recall — v1.6: age
             knots 0.02 → 0.05 at 80, gist_lure_gain 0.3 → 0.5 at 80;
             Balota et al. 1999; Tun et al. 1998; age-decline.md §25):
             mint a phantom record — accuracy=0 hidden,
             source.kind:"self", verbatim schema-generated,
             phantom:true; decays and reconsolidates normally,
             gets sleep_gist_boost at the daily tick (§4.6)
```

### 6.9 Imagination inflation — imagineEvent (new in v0.6)

Daydreams, rehearsed lies, what-ifs, and guided probing write
`source.kind:"imagined"` records that can later be misattributed as real
(Garry et al. 1996; Loftus & Pickrell 1995 → Murphy et al. 2023: ~35%
report planted childhood events; Brewin & Andrews 2017: ~47% some
recollective experience, ~15% full memory; false-memory.md §5):

```
imagineEvent(charId, scenario):
  plaus = plausibility(scenario, char)     // schema fit + world model
  if plaus < plaus_min (0.35):             // Pezdek/Scoboria gate —
        refresh as fantasy only; can NEVER flip to witnessed
  else: create/update imagined record: encodingE ~0.25·plaus, verbatim
        schema-generated, source.kind:"imagined"
  per call: strength += imagine_gain·(1−strength) (~0.15);
        confidence += 0.05
  source flip (reality-monitoring failure, Johnson & Raye 1981): when
        source.confidenceInSource decays <0.3 (§6.4) AND verbatim
        richness > rm_rich_thresh (0.5), flip source.kind to
        "witnessed" with prob source_confuse_flip (≈0.15/check)
```

**v1.8 extensions (false-memory.md §§14–16):**

- `claim:true` — a deliberate false assertion (lie, cover story,
  brag). Written as source.kind:"claimed" with BOTH `gen_gain` and
  `prod_gain` (generated AND spoken — telling beats planning,
  Otgaar-lab 2018); flip prob becomes `source_confuse_flip·
  (1 + fab_inflate)` scaled by `discrim_mult` (Polage 2012: source-
  monitoring ability IS the moderator; ~10–16% inflation tail,
  Polage 2004). Listeners who echo the claim back count toward its
  corroboration term in §6.7 believe_p.
- `evidence:"photo"|"video"|"artifact"` — perceptual evidence:
  `plaus_eff = plaus + evid_boost·(1−plaus)` replaces plaus at the
  gate (evidence bends plausibility but cannot force plaus_min-
  impossible content to flip — Pezdek gate holds); record born with
  verbatim richness ≥ rm_rich_thresh (a seen image supplies the
  perceptual detail the flip gate demands — Wade et al. 2002: 50%
  implantation via doctored photo) and confidence += 0.1.
- `answerProbe(charId, question)` — forced answering where the
  record lacks the asked field (interrogation, gossip pressure):
  emits a `confabulated` candidate at `forced_confab_gain·
  (suggested ? other_gen_gain : 1)·(1 + press_gain·repeatCount)`
  (Ackil & Zaragoza 1998 — known fabrications become memories in
  ~1 week, children > adults via child_internal_confuse; Pezdek,
  Sperry & Owens 2007 — suggested answers outlast self-generated
  ones). Under `disputed` or a hostile audience the candidate is
  tagged `coerced:true` — performed, not believed; internalization
  still requires the flip gate, reached faster by `distrust`-trait
  characters (Gudjonsson memory-distrust → Kassin 2008
  coerced-internalized confessions).

### 6.10 Source monitoring is inference (new in v0.6)

Replaces the "attribution gone" dead end in §6.4 (Johnson, Hashtroudi &
Lindsay 1993 — source attribution is a retrieval-time inference;
false-memory.md §6):

```
sourceInfer(m): if source.confidenceInSource < 0.3:
  external-external: with prob source_confuse (≈0.1, ·discrim_mult for
      age), reassign source.who to the most cue-overlapping plausible
      source s: P(s) ∝ simOp(m.source.cueContext, s, "sim_source")·credibility(s)
      — and confidence += 0.02 (a filled source reads better than blank)
      v0.8: weight candidates by social category — ~source_cat_share
      (0.65) of external confusions land on candidates sharing
      categoryTags with the true source (Taylor et al. 1978 "who said
      what": within-category errors dominate); if categoryTags absent,
      fall back to cue overlap alone
  internal-external: source.kind "imagined"→"witnessed" per §6.9 flip
      rule (gate on verbatim richness, not confidence)
  external-internal (v1.8, cryptomnesia — Brown & Murphy 1989 ~10%):
      when SELF-GENERATING content (retell as own idea, propose a
      plan), a decayed-source told_by record with matching content
      emits as own with prob crypto_p (0.08) — source cleared to
      "self", not reassigned; ×discrim_mult with age, ×1.3 when the
      true source spoke recently (proximity inversion — the rare
      case where recent beats remote)
```

**v1.5 channel asymmetry:** the two confusion routes have opposite age
profiles (age-development.md §19): `source_confuse_flip` (internal —
imagined↔witnessed) is multiplied by `child_internal_confuse` (2.0)
below ~age 9 — children over-confuse their own thoughts and deeds
(Foley & Johnson 1985; Foley, Johnson & Raye 1983); `source_confuse`
(external — wrong speaker/channel) rides the existing old-side knots
(~1.8× at 75 — Henkel, Johnson & De Leonardis 1998). Same failure
umbrella, opposite channel by age; P144 checks the split.

### 6.11 Audience tuning — saying is believing (new in v0.8)

On `retell(charId, audienceId, record)`: if the speaker trusts the
audience's judgment — `PersonModel[audience].credibility ·
ingroup_factor > shared_reality_gate` (0.5) — the speaker's OWN record
drifts toward the version told (Higgins & Rholes 1978; shared-reality
gating per Echterhoff, Higgins & Groll 2005; robust in the 2025
Figueroa-Grenett meta, diminished for out-group/identity-threat):

```
m.emotional.valence += audience_tune (≈0.06)
                       · sign(audienceStance − m.valence)
verbatim fields consistent with audienceStance get +0.5·audience_tune
                       survival on the next §6.1 drift roll
```

Cumulative across retellings — the habitual spin becomes the memory.
No tuning to distrusted audiences: compliance is performance, not
memory. Requires the dialogue layer to supply `audienceStance`; absent
stance → no-op (social-memory.md §5).

**v1.6 — destination memory:** the record carries a hidden `toldTo:
{personId: day}` map, written on every retell. Before emitting, the
audience check succeeds with probability `dest_mem(age_eff)` (knots
0.9 young → 0.55 at 85 — Gopie & MacLeod 2009; El Haj, Fasotti &
Allain 2012). On a MISS the retell proceeds and emits
`alreadyTold: true` (the dialogue layer may play the listener's
"you told me" beat or let it slide). Misses dominate — old
characters repeat stories to the same listener far more than they
wrongly withhold (age-decline.md §20).

**v1.7 — verbal dampening:** on retell with an audience,
`m.emotional.arousal *= (1 − verbal_dampen)` (≈0.05 per telling;
valence untouched; `trauma:true` exempt — §7's re-stamping owns
traumatic affect). §4.13 solo retell-ecology draws (no audienceId)
do NOT dampen — disclosure is interpersonal; rumination stays hot
(Lieberman et al. 2007 affect labeling; Pennebaker disclosure;
emotional-memory.md §16).

### 6.12 Serial reproduction — rumor chains converge (new in v0.8)

When a `told_by` record is retold onward, apply transmission operators
(Bartlett 1932; Allport & Postman 1947 leveling/sharpening/assimilation;
Kashima 2000: stereotype-inconsistent items favored at early chain
positions, consistent items dominate by ~position 4; Lyons & Kashima
2003 — convergence stronger when the audience is believed to share the
stereotype; social-memory.md §4):

```
chainPos = 1 + speaker's hearCount for this content (or explicit hop)
per verbatim field transmitted:
  P(survive) = (1 − level_frac)                 // leveling, ≈0.3
             · (about a person ? social_transmit_gain : 1)  // ≈1.15,
               // gossip travels better (Mesoudi et al. 2006)
             · (schemaConsistent ? 1
                : si_dropoff · exp(−chainPos/chain_sc_thresh))
               // si_dropoff 0.75, chain_sc_thresh 4 — the crossover
gist pulled assimilation_gain (≈0.05) toward speaker schema per hop
```

The §2 incongruity bonus makes odd details survive hop 1; §6.12's
consistency pull removes them by hop 4 — both effects are real, at
different stages. Gossip networks produce short, stereotyped,
confidently-wrong versions for free.

### 6.13 Collaborative remembering (new in v0.8, optional wrapper)

`groupRecall(members, C)`: group output ≈ `nominal · collab_factor`
where `collab_factor = collab_base (0.65) · (1 − collab_size_pen·(n−2))
· (acquainted ? collab_friend_mult (1.2) : 1)` — collaborative
inhibition, robust across 64 studies (Marion & Thorley 2016; retrieval-
strategy disruption, Basden et al. 1997). Post-collab benefit: each
member's recalled items get a normal retell boost, and SS-RIF (§5.8)
applies to members' unspoken related records. Use for explicit group-
reconstruction scenes; individual recall is unchanged.

**v1.6 — intimate-pair compensation:** when a member's PersonModel of
the partner shows high familiarity AND high credibility (a long-term
couple), waive `collab_size_pen` for that dyad and add
`collab_partner_gain(age_eff)` (0 young → 0.25 at 85) to that member's
factor — old couples can recall MORE together than alone (collaborative
facilitation: Harris et al. 2011; Barnier et al. 2014 — internal-detail
gain was older-couples-only). Stranger pairs keep inhibition
(age-decline.md §26).

### 6.14 Learned credibility and the transactive directory (new in v0.8)

- **Credibility is a memory, not a score.** `PersonModel[X].credibility`
  (init 0.5, prior shifted by the `distrust` trait) updates `±cred_step`
  (0.08, clamp [0.1, 0.95]) whenever X's `told_by` content is later
  corroborated or contradicted by witnessed evidence — selective trust
  is learned from reliability history (Koenig & Harris 2005).
  §6.3/§6.10 read `credibility(X)` from the model; absent a model,
  default 0.5 (backward-compatible with the old scalar input).
  Status/power may bias the prior (Carol et al. 2013), never the update.
- **Directory learning:** when X successfully supplies information on
  topic T (or demonstrates T-expertise), strengthen
  `PersonModel[X].knowsTopics[T]`; failed referrals decrement. Serves
  the §5.10 `"directory"` retrieval mode — "who would know" is itself
  remembered (Wegner 1987; Wegner, Erber & Raymond 1991 couples).
- **Transactive loss (v2.0):** recall on a topic directory-listed to a
  partner who is now unavailable (dead/moved/estranged — world layer
  supplies `available:false` on the PersonModel) takes
  `θ += transact_loss` (≈0.12) on the records the partner would have
  supplied — the directory survives while its referent is unreachable;
  pointer-rot as grief (Harris, Barnier, Sutton & Keil 2014; magnitude
  HYPOTHESIS — social-memory.md §27). `collab_partner_gain` (v1.6) is
  the positive mirror.

### 6.15 Temporal localization — dateEstimate (v0.9 deepening)

Dating is reconstruction, not readout (Friedman 1993; formal-model.md
§11). `verbatim.when` is the fastest-decaying field; when it dies,
dating falls to telescoping + schema rounding + landmark anchoring:

```
true_age     = now − m.createdDay                          // hidden
reported_age = true_age·(1 − tele_k_eff)                   // forward
               telescoping for remote events
             + (true_age < tele_cross ?
                tele_back·(tele_cross − true_age) : 0)     // small
               backward telescoping for recent ones
             + N(0, date_sigma·ctx_loss·sqrt(true_age + 1))
               // v1.6: context fields decay faster than content
               // (Spencer & Raz 1995 meta) — ctx_loss knots 1.0 ≤50
               // → 1.5 at 85; same multiplier on verbatim where/
               // source-confidence decay channels (age-decline.md §21)
tele_k_eff   = tele_k·(1 − landmark_gain) if m.links reaches a dated
               landmark record (arousal ≥ landmark_arousal);
               sigma likewise ×= (1 − landmark_gain)
             · (1 + tele_age_gain·age_eff/80)        // v1.5: forward
               telescoping is age-graded (Janssen et al. 2006) —
               old characters push remote events more recent
if verbatim.when alive → error ×0.2 (near-veridical)
if verbatim.when dead, with prob round_p: snap to nearest of
   {7, 30, 90, 365}; only a fuzzy era tag survives → report its
   centroid (category adjustment, Huttenlocher et al. 1990/2000)
```

(Janssen, Chessa & Murre 2006 — sign and crossover; Huttenlocher,
Hedges & Bradburn 1990 — rounding; Brown, Rips & Shevell 1985; Shum
1998 — landmarks.) Exact constants HYPOTHESIS; see P79–P81.

`orderBefore(m,n)` survives date loss: ordering rides the S gradient —
`P(correct) = logistic(k_order·(S_n − S_m)·sgn(createdDay_n −
createdDay_m))`, k_order ≈ 4 [pop]. Same-week pairs coin-flip; distant
pairs order correctly while both dates are wrong.

### 6.16 Hindsight — learnOutcome (v0.9 deepening)

When the world resolves an open question, memory for prior expectations
assimilates toward the outcome (Fischhoff 1975; Fischhoff & Beyth 1975
creeping determinism; metas Christensen-Szalanski & Willham 1991,
Guilbault et al. 2004; formal-model.md §12):

```
learnOutcome(charId, eventRef, outcome):
  surprise = |outcome − prior_expectation|
  if surprise > hindsight_max_surprise (0.7):
      no assimilation — encode the shock itself ("I never saw it
      coming"); unbelievable outcomes resist hindsight
      (Blank & Nestler 2007)
  else for each record on eventRef (overlap ≥ 0.4, createdDay <
       outcomeDay, beliefStatus ∈ {fact, belief, rumor}):
      prior_field += hindsight_k·(outcome − prior_field)
      confidence  += hindsight_conf_gain
      accuracy    −= hindsight_k·|outcome − prior_field|   // hidden
```

Applies to `told_by` prediction records too — post-outcome gossip
("everyone saw it coming") is a distortion product, amplified further
by §6.11 audience tuning on retell.

### 6.17 Consistency pull — the past assimilates to the present self (new in v1.8)

Distinct from hindsight (§6.16 — predictions toward known outcomes):
reconstruction of evaluative/attitudinal/decision fields drifts toward
the character's **current** self-model under an assumed-stability
theory (Ross 1989 implicit theories — [CONSENSUS]).

```
on reconstruct of m with evaluative/decision fields:
  candidate write: value pulled consist_pull (0.15) toward current
      attitude A per reconstruction — cumulative: a changed mind
      rewrites history ("I always knew he was no good")
  choice records: when believedChoice ≠ stored choice, positive-
      feature candidates on the BELIEVED option gain
      choice_support_gain (0.15) candStrength and emit at higher
      vividness; believed-rejected attract negative features
      (Henkel & Mather 2007 — the bias follows belief, not truth;
      misinforming which option was chosen yields full choice-
      supportive memory for the false choice)
      age knots: ×1.0 ≤50 → ×1.4 at 80 (Mather & Johnson 2000 —
      older adults more choice-supportive)
```

### 6.18 Outcome ownership — choice blindness (new in v1.8)

When an outside act replaces a record's *outcome* field (possession
handoff, admin intervention, another character's act attributed to
them), the swap is a `swapOutcome` event on the record:

```
P(detect) = cb_detect (0.3) · (1 + selfRelevance) · (fresh ? 1 : 0.5)
if undetected: outcome owned — provenance stays self/witnessed, and
    §6.17 consistency pull + §6.2 confabulation generate inferred
    motive candidates at next reconstruction (confabulated reasons
    for choices never made — Johansson et al. 2005: <10% immediate
    detection, ~20–25% total, confabulated justifications at equal
    confidence/detail/emotionality; Hall et al. 2010 — the
    confabulated position moves subsequent attitudes)
if detected: tag record incongruent:true — "I don't know why I did
    that"; distinct from the wholesale possess_alien estrangement
    discount (§8.1)
```

This is the fictional-continuity layer for the possession economy:
a resumed character confabulates ownership of the possessed interval
instead of noticing the seam, at human rates.

### 6.19 Repression — the non-mechanism (new in v1.8)

**No repress() operator exists or will.** Massive motivated
repression with intact recovery is not an evidence-supported
mechanism (Loftus 1993; Patihis, Ho, Tingen, Lilienfeld & Loftus
2014 — belief persists among clinicians despite the evidence).
Apparent recoveries are produced by ordinary machinery already in
the model: §4.12 bounded suppression (leaky, θ-side only), §4.14
latent-route reinstatement, §6.9 source-confused imagined content,
§6.8 phantom minting. A character's past can be lost, confused, or
invented — never defended-against and unleashed. Guarded by P172.

### 6.20 Corroboration confidence — social validation (new in v2.0)

Distinct from §6.5 (content convergence): this is the **confidence**
channel. When two accounts are compared in `hearAccount`/`discussEvent`:

```
core fields match (simOp(·,·,"sim_merge") > merge_thresh on who/what/where):
  BOTH parties' records: conf += corroborate_conf (≈0.15) — mutual
      validation; whoever was right, both leave more certain
      (Wells & Bradfield 1998 — post-ID feedback inflates confidence,
      even recollection of view quality)
listener's reconstructed field contradicts:
  conf −= disagree_conf (≈0.10) — asymmetric magnitude, depression <
  inflation (Bradfield, Wells & Olson 2002)
persistence: corroborate_conf deltas do NOT unwind when the
  corroborator's PersonModel.credibility later drops — known
  discrediting does not refund the confidence (Wells & Bradfield
  boundary; Skagerberg & Wright 2008)
```

Accuracy untouched — consensus and truth decouple. Age knot:
`corroborate_conf ×(1 + 0.2·(age_eff−65)/20)` above 65 [HYPOTHESIS,
consistent with older-adult suggestibility; social-memory.md §20, §28].

### 6.21 Common-ground overreach — shared_with (new in v2.0)

On `encodeEvent`, every character in `context.present` is appended to
the record's `shared_with` list with probability `copresent_assume_p`
(≈0.9), scaled by `×(1 + 0.3·age_eff/60)` — **no check on their actual
attention** (the egocentric-anchor skip IS the error: Keysar audience-
design work; Birch & Bloom 2007 curse of knowledge; Nickerson 1999).
Queries "would X know this?" answer `shared_with` membership at
`common_ground_conf` (≈0.8). `shared_with` decays at `beta_source`
(metadata, not content). Coexists with `toldTo` (v1.6) as the inferred
wrong-able channel — a character can believe you know what you never
heard AND forget telling you what you were told (social-memory.md §21).

### 6.22 Confidentiality decay — secrets leak (new in v2.0)

`confidential` records carry `secret_str` (born at record E — §2)
decaying at `beta_source·secret_tag_mult` (≈1.3) — the prohibition is
single-utterance source-class metadata and rots faster than the juicy
content it guards (source-amnesia asymmetry, Schacter et al. 1984 —
HYPOTHESIS applied). At `retell`/transmission of a confidential record:

```
P(respect) = min(1, secret_str·2) · (0.5 + 0.5·consc_trait)
if respect fails: content transmits WITHOUT the flag — silent leak;
  no breach event is minted unless the game emits one
```

Fresh secrets hold; old secrets leak at content-fresh rates — "wait,
was that a secret?" is the emergent failure mode (social-memory.md
§23). Guarded by P188.

**v2.2 self-concealment split:** the §4.13 share-motive draw multiplies
by `(1 − self_share_pen)` (0–0.9) when the candidate record has
`selfRelevance ≥ 0.6` — transmission of *one's own* distressing content
is a separate channel from sharing generally (Larson & Chastain 1990:
self-concealment ≠ low self-disclosure; it predicts distress
incrementally). This is the Marisol parameter: `share_k` high on others'
business, `self_share_pen` high on her own — the curator who never
opens her own file.

### 6.23 Absorption — told_by → experienced (new in v2.0)

A `told_by` record meeting ALL of `hearCount ≥ 3`,
`selfRelevance > 0.5`, verbatim richness > `rm_rich_thresh`, the §6.9
plausibility gate, AND a decayed source tag draws `absorb_p` (≈0.02)
per subsequent hear/retell to flip provenance to `witnessed` at
reduced verbatim ceiling and reduced confidence — others' stories
become quasi-autobiographical (Hyman, Husband & Billings 1995;
Pillemer et al. 2015 vicarious memories). Never fires while the source
tag is intact; never exceeds the detail of real witnessed records —
absorbed memories are thinner (social-memory.md §26). The social
route into false-autobiographical memory: distinct from §6.9
imagination (nothing was imagined) and from cryptomnesia (content
kept, source lost — here the *kind* flips).

### 6.24 Canonization — the oft-told story freezes (new in v2.0)

Records carry `retellCount` (increments on §6.11 retell and §4.13
fires). At `retellCount ≥ canon_thresh` (≈5) the story has
conventionalized (Bartlett repeated reproduction; Marsh & Tversky
2004):

```
§6.1 drift and §6.11 audience tuning ×= canon_drift_mult (≈0.2)
verbatim candidate edits freeze — the accumulated state, warts and
    all, IS the memory now (early distortions become permanent)
§6.3 adoption on contested fields ×= (1 − canon_resist) (≈0.6) —
    well-rehearsed accounts resist late misinformation
S-growth per §4.11 continues but R-side content stops rewriting —
    rote recitation is not elaborative retrieval
```

Double-edged and falsifiable (P189): canonization locks in whatever
the teller had converged to AND armors it against later correction.

---

## 7. Character parameter table (schema)

All weights live in one per-character params object. Profiles doc assigns
values; game-systems stores it on the character record.

```json
MemoryParams = {
  // encoding
  "enc_base": 0.35,        // E0
  "att_min": 0.15,         // below → not encoded
  "w_emo": 0.9, "w_self": 1.1, "w_nov": 0.6, "w_pred": 0.5,
  "arousal_narrowing": 0.6,  // peripheral-detail loss under arousal
  "sleepFactor": 1.0,
  // decay
  "beta_episodic": 0.5, "beta_semantic": 0.2, "beta_source": 1.0,
  "k_verbatim": 2.5, "tau_episodic": 1.2, "tau_semantic": 30.0,
  "interf_k": 0.12, "interf_thresh": 0.6, "merge_thresh": 0.8,
  "forget_thresh": 0.08,
  "neg_affect_decay": 1.3,   // multiplier on positive baseline
  // retrieval
  "theta": 0.45, "w_str": 0.8, "w_state": 0.3, "w_place": 0.3,
  "w_people": 0.33, "w_topic": 0.36, "w_sensory": 0.1,
  "rec_k": 0.3, "rec_tau_days": 2.0, "rif_k": 0.05,
  "retell_boost": 0.25,
  // v0.2 additions (retrieval-cue calibration, retrieval-cues.md §8)
  "fan_k": 0.4,                  // log-fan divisor strength (ACT-R consistent)
  "place_reinstate": 0.15,       // matched-place cue bonus, grows w/ record age
  "mental_reinstate": 0.09,      // guided-reconstruction fraction of above
  "sensory_age_slope": 0.8,      // odor cues reach older memories (Proust)
  "sensory_mismatch_pen": 0.05,  // wrong sensory cue hurts (Chu & Downes 2002)
  "w_msd": 0.1,                  // mood-state dependency, small + erasable
  "recogn_pen": 0.4,             // copy-cue penalty vs contextual recall
  "intrusion_thresh": 0.75,      // involuntary-recall cue threshold
  "resurrect_thresh": 0.85,      // cue level to reach archived records
  "plist_suppress": 0.05,        // part-list cuing suppression in discussEvent
  // distortion
  "drift_p": 0.08, "misinfo_suscept": 0.35, "confab_fill": 0.5,
  // age/identity (set once, era window for reminiscence bump)
  "birthWorldDay": -9125, "bump_beta_mult": 0.6,
  // v0.1 additions (forgetting-curve calibration, forgetting-curves.md §3)
  "consol_window_days": 1.0, "consol_beta_mult": 0.5,
  "permastore_age": 180, "permastore_thresh": 0.25,
  "face_ceiling": 0.67, "stress_thresh": 0.8, "stress_encode_loss": 0.31,
  // v0.3 additions (age-development calibration, age-development.md §§6–8)
  "amnesia_exit": 7.0,         // encodeAge below → amnesia_decay_mult forever
  "amnesia_decay_mult": 1.8,   // permanent β mult on childhood records
  "bump_lo": 10, "bump_hi": 30, "bump_peak": 16,   // encodeAge window (±3y jitter)
  "bump_valence_gate": true,   // bump only for positive/self-relevant records
  "bump_self_thresh": 0.6,
  "link_p": 0.75,              // prob an associative edge forms at encoding
  "w_emo_pos": 1.0, "w_emo_neg": 1.0,   // valence-asymmetric arousal weight
                                       // (older: pos 1.25 / neg 0.85)
  "pm_self": 0.8               // self-initiated intention recall (optional §9)
  // v0.4 additions (age-decline calibration, age-decline.md §§13–14)
  "search_breadth": 12,        // max candidates scored per recall (age curve)
  "env_support_gain": 1.0,     // ≥1; cueMatch_ext multiplier (age curve)
  "discrim_mult": 1.0,         // ≤1; scales interf/merge thresh (age curve)
  "lure_accept": 0.05,         // similar-cue false-positive rate (age curve)
  "specificity": 1.0,          // prob of returning episode vs generic (age)
  "pos_spare": 0.2,            // positive-cue sparing on specificity
  "tot_rate": 0.04,            // name-field blanking, feeling-of-knowing
  "sws_mult": 1.0,             // episodic consolidation age scaling
  "ret_noise": 0.05,           // σ of noise added to drive
  "reserve": 0.4,              // cognitive reserve 0..1 → age_eff shift
  "reserve_shift": 10.0,       // years of effective-age offset at reserve=1
  "deathDay": null,            // optional scripted-death day → terminal ramp
  "terminal_window": 1100,     // game days; Wilson 2003 ≈43 months
  "terminal_gain": 2.0, "terminal_loss": 0.5,
  // v0.5 additions (emotional-memory calibration, emotional-memory.md §9)
  "emo_consol_gain": 0.25,     // first-sleep bonus ∝ arousal (selective consol.)
  "abc_gain": 0.25,            // central-field encoding boost under arousal
  "emo_blink_thresh": 0.7,     // arousal level that suppresses neighbors
  "emo_blink_window": 0.03,    // days; ±~45min scene window
  "emo_blink_loss": 0.3,       // encodingE multiplier on cue-unrelated neighbors
  "post_stress_window": 0.05,  // days; retrograde enhancement reach
  "post_stress_gain": 0.15,    // retrograde boost for congruent predecessors
  "conf_emo_gain": 0.15,       // arousal² confidence inflation at birth
  "flashbulb_thresh": 0.85, "flashbulb_conf_floor": 0.9,
  "trauma_thresh": 0.9, "trauma_floor": 0.30,   // record-level trauma phenotype
  "cond_thresh": 0.6, "cond_gain": 0.5,         // conditioned-affect acquisition
  "cond_decay": 0.005, "extinct_suppress": 0.08,
  "recovery_days": 30, "recovery_frac": 0.5,    // Bouton: renewal/recovery
  "emo_gist_beta": 0.85, "emo_verbatim_k": 1.5, // emotional narrowing over time
  "arousal_affect_decay": 1.4, // arousal tag fades faster than valence tag
  "neg_fidelity": 0.85, "pos_gist_drift": 1.15, // valence-conditioned distortion
  "neg_core_resist": 0.7,      // misinfo resistance of neg-core fields
  "mood_bleed": 0.10, "mood_arousal_bleed": 0.1,// reconstruction mood shift
  "stress_retrieve_thresh": 0.6, "stress_retrieve_loss": 0.12, // glucocorticoid
  "rumin_k": 0.5,              // valence-selective rehearsal (depressive mod.)
  // v0.6 additions (false-memory calibration, false-memory.md §§9–10)
  "warn_mult": 0.45,           // post-warning suppression of p_adopt (§6.3)
  "rep_gain": 0.4, "rep_cap": 2.0,   // log-fluency on hearCount (§6.3)
  "dispute_mult": 0.05,        // live-dispute adoption floor (§6.3, §6.5)
  "retract_p": 0.6, "cie_residual": 0.3,   // corrections/CIE (§6.6)
  "w_plaus": 0.5, "w_corr": 0.3, "w_fluency": 0.2,   // believe_p (§6.7)
  "sleepdep_misinfo_gain": 1.25,   // poor sleep AT ENCODING (§2, §6.3)
  "sleep_gist_boost": 0.05,    // sleep tick edge for gist/phantom (§4.6)
  "gist_lure_gain": 0.3, "phantom_p": 0.02, "phantom_fan_min": 4, // §6.8
  "rm_rich_thresh": 0.5,       // richness gate for imagined→witnessed (§6.9)
  "plaus_min": 0.35, "imagine_gain": 0.15, // plausibility gate + gain (§6.9)
  "source_confuse_flip": 0.15, // imagined→witnessed flip rate (§6.9)
  "source_confuse": 0.10,      // external source reassignment (§6.10)
  // v0.7 additions (individual-differences calibration,
  // individual-differences.md §§3–5)
  "peak_hour": null,           // circadian peak hour 0..23; null = flat
  "synchrony_gain": 0.06,      // encoding/θ off-peak penalty; ×(1+age_eff/60)
  "vivid_detail": 0.8,         // prob each peripheral field is written at all
  "conf_bias": 0.0,            // trait confidence offset, never touches accuracy
  // v0.8 additions (social-memory calibration, social-memory.md §§14–15)
  "sti_prob": 0.6, "sti_gain": 0.15,   // spontaneous trait inference (§2)
  "diag_moral_neg": 1.6, "diag_ability_pos": 1.3, // diagnosticity weights (§2)
  "incongruity_gain": 0.25,  // expectancy-violation encoding bonus (§2)
  "next_in_line": 0.4,       // attention loss while preparing own turn (§2)
  "oab_loss": 0.15,          // other-age familiarity penalty (§2; all ages)
  "familiar_thresh": 0.25, "identity_thresh": 0.4, "name_thresh": 0.55,
                             // person-recognition cascade tiers (§5.10)
  "cheat_source_mult": 0.6,  // β_source mult on cheater-associated records (§4.10)
  "audience_tune": 0.06, "shared_reality_gate": 0.5, // saying-is-believing (§6.11)
  "ss_rif_k": 0.04,          // listener co-retrieval suppression (§5.8)
  "level_frac": 0.3, "si_dropoff": 0.75, "chain_sc_thresh": 4,
  "assimilation_gain": 0.05, "social_transmit_gain": 1.15, // chains (§6.12)
  "collab_base": 0.65, "collab_size_pen": 0.1, "collab_friend_mult": 1.2, // §6.13
  "cred_step": 0.08,         // credibility learning rate (§6.14)
  "mnemic_loss": 0.15, "mnemic_encode": 0.25, "mnemic_centrality": 0.6,
                             // mnemic neglect: recall-suppress, encode-shallow (§4.10)
  "source_cat_share": 0.65,  // within-category source confusion (§6.10)
  // v0.9 additions (formal-model hardening, formal-model.md §§4–6)
  "enc_quota_per_day": 40,   // soft cap on records surviving to first sleep
  "cap_episodic": 2000, "cap_archive": 8000, "cap_persons": 60,
                             // live-record/archive/PersonModel caps
  "ambient_tick_mult": 3, "ambient_cap": 150,  // degraded mode (§8.1)
  "possess_alien": 0.15,     // estrangement discount on possessed records
  "catchup_max": 7,          // days replayed on resume before aggregation
  // v0.9 deepening (mechanism formalization, formal-model.md §§10–16 —
  // free-vs-frozen split per the §4 identifiability audit there)
  "s_gain": 0.35,            // storage growth per difficult retrieval (§4.11)
  "tele_k": 0.12,            // forward telescoping rate (§6.15)
  "date_sigma": 0.9,         // dating noise scale ∝ √age (§6.15)
  "round_p": 0.5,            // schema-unit rounding when `when` dead (§6.15)
  "contiguity_gain": 0.15,   // temporal-neighbor drive bonus (§5.4)
  "hindsight_k": 0.35,       // prior-assimilation toward outcome (§6.16)
  "oc_gain": 0.3,            // hard-easy overconfidence at report (§3)
  // v1.0 additions (profile compiler + metamemory + expertise + open
  // loops, profile-generation.md §§1–4)
  "metamem_r": 0.15,         // felt↔actual memory correlation (human ~0.1)
  "self_est_bias": 0.15,     // σ of the self-model noise term
  "strategy_use": 0.3,       // external-memory reliance (lists, asking)
  "expert_gain": 0.10,       // in-domain enc_base boost per domMatch
  "expert_cost": 0.06,       // out-of-domain link_p penalty (Woollett 2009)
  "expert_bound": 1.0,       // gain collapse at domain edge (Chase&Simon)
  // v1.9 additions (individual-differences II, individual-differences.md
  // §§10–17)
  "iiv_sigma": 0.04,         // day-to-day encoding/retrieval noise σ;
                             // ×(1+age_eff/50)·(1−0.25·wmc) (Hultsch 2000)
  "omit_p": 0.05,            // routine-event encoding-omission prob (§2)
  "lang_mismatch": 0.6,      // verbal/topic/people cue attenuation when
                             // C.lang ≠ m.lang (Marian & Neisser 2000)
  "meta_cal": 1.0,           // confidence calibration slope at report (§3)
  "complaint_k": 0.15,       // selfReport complaint noise weight (§10)
  "check_conf_loss": 0.10,   // verify-mode conf decrement per log1p
                             // retrievalCount (van den Hout & Kindt 2003)
  "expert_lure": 0.10,       // in-domain lure/adoption bonus (Castel 2007)
  "intox_encode_mult": 0.3,  // E floor at intox=1 — anterograde (White 2003)
  "intox_state_dep": 0.05,   // encode/retrieval intox-match cue (DEBATED)
  "aging_rate": 0.0,         // trait passthrough: age_eff slope N(0,1)
  "fitness": 0.0,            // trait passthrough: age_eff offset −0.15·fitness
  "open_loop_gain": 0.12,    // intrusion/drive boost on open:true records
  "open_self_gate": 0.4,     // selfRelevance floor for open tagging
  // v2.1 additions (formal-model III — measurement layer,
  // formal-model.md §§18–23; free/frozen per the §23 audit table)
  "sim_tau_time": 14.0,      // when-distance feature scale, days (§11.1)
  "place_adj": 0.3,          // adjacent-venue partial match (§11.1)
  "a_cue": 0.4, "a_part": 0.45, "a_fam": 0.15,  // FOK accessibility (§5.21)
  "theta_fok": 0.5, "k_fok": 6.0, "fok_noise": 0.08,
  "fok_age_noise": 0.25,     // episodic FOK sensitivity loss w/ age (§5.21)
  "fok_retry": 0.6,          // failed-recall rescan gate (§5.21)
  "jol_fluency": 0.5,        // immediate-JOL fluency inflation (§5.21)
  "theta_jol": 0.5, "k_jol": 6.0, "jol_bias": 0.0
  // v1.2 additions (encoding-mechanics calibration,
  // encoding-mechanics.md §11)
  "elab_gain": 0.25,         // deep/elaborative processing term (LoP)
  "gen_gain": 0.15,          // self-generated content bonus (d=0.40)
  "enact_gain": 0.20,        // performed-action bonus; post-decline (g=1.23)
  "prod_gain": 0.08,         // said-aloud bonus, recognition-weighted
  "boundary_gain": 0.15,     // event-boundary encoding bonus
  "boundary_order_loss": 0.4,// cross-boundary link/order penalty
  "doorway_drop": 0.15,      // locShift R penalty, recent+pending records
  "lapse_p": 0.03,           // stochastic attention-collapse rate
  "lapse_drop": 0.6,         // attention multiplier during a lapse
  "da_encode_mult": 0.5,     // divided-attention encoding damage
  "unitize_gain": 0.3,       // coherent-unit link rescue (aging)
  "distinct_gain": 0.15,     // within-context isolation bonus
  "concrete_gain": 0.1,      // sensory/concrete content bonus
  "mood_cong_encode": 0.1,   // mood-congruent elaboration bonus
  // v1.3 additions (forgetting-curves II — active-forgetting calibration,
  // forgetting-curves.md §§7–8)
  "s_gain_recall": 0.35,     // S growth on effortful recall (§4.11)
  "s_gain_rehear": 0.12,     // S growth on passive re-exposure (§4.11)
  "lag_opt_ratio": 0.15,     // optimal retell gap / record age (§4.11)
  "lag_width": 1.0,          // log-normal width of the lag optimum
  "massed_gap": 0.08,        // days; below → massed_retell_mult
  "massed_retell_mult": 0.4, // same-conversation retells mostly wasted
  "potent_gain": 0.3,        // failed recall → next re-encoding boost
  "pi_ref": 4.0,             // n_sim scale at which PI saturates (§4.2)
  "amnesia_slope": 1.2,      // childhood β ramp (replaces decay_mult)
  "child_consol_base": 0.15, // childhood record survival base
  "child_consol_gain": 0.6,  // coherence → survival (Bauer&Larkina 2015)
  "suppress_theta": 0.08,    // per-suppression θ bump (§4.12)
  "suppress_cap": 0.3,       // cumulative suppression ceiling
  "retell_base": 0.015,      // daily ecology retell draw (§4.13)
  "retell_social": 1.0,      // shared-cue boost on p_retell
  "beta_pm": 0.15,           // armed intention decay (§9)
  "reminiscence_frac": 0.15, // per-attempt field resurfacing (§5.11)
  "beta_proc": 0.02,         // procedural map decay (~never)
  // v1.4 additions (retrieval-cues II, retrieval-cues.md Part II)
  "tap_mismatch": 0.55,      // ops-channel mismatch penalty on cueMatch (§5.12)
  "out_int": 0.85,           // per-emitted-item compounding in bouts (§5.13)
  "pm_focal_hit": 0.9,       // focal event-cue fire rate, age-flat (§5.14)
  "pm_monitor_p": 0.4,       // nonfocal cue monitor-roll base (§5.14)
  "pm_clock_p": 0.1,         // per-tick clock-check for time intentions (§5.14)
  "pm_time_age_loss": 0.4,   // age scaling on nonfocal/time PM (§5.14)
  "renewal_frac": 0.6,       // context-switch affect renewal (§5.15)
  "tot_resolve_p": 0.3,      // syllable-cue TOT resolution (§5.16)
  "tot_persist": 1.5,        // tot_rate multiplier per unresolved TOT (§5.16)
  "chain_gain": 0.5,         // derived-cue strength on linked records (§5.17)
  "tmr_gain": 0.12,          // sleep-context sensory consolidation edge (§5.18)
  // v1.5 additions (age-development II, age-development.md Part II §§11–20)
  "ret_win_base": 3.0,       // days/yr infant retention window slope (§4.14)
  "latent_recall_p": 0.08,   // compound-sensory latent reinstatement (§5.20)
  "reminiscence_env": 0.5,   // caregiver reminiscing style 0..1; shifts
                             // amnesia_exit ∓1.5y + child_consol_gain (§4.1/§4.14)
  "strategy_exit": 12,       // age of full elab/gen gain (§2 strategy_ramp)
  "scaffold_gain": 0.15,     // adult-guided elaboration bypass (§2)
  "child_gist_mult": 0.7,    // gist birth strength below age 8 (§2)
  "offtarget_p": 0.03,       // bout contamination rate; age curve §5.19
  "know_protect_age": 50,    // knowledge-protection onset (§6.3)
  "know_protect_thresh": 0.5,// semantic strength that counts as "known"
  "know_protect_mult": 0.5,  // adoption mult when knowledge contradicts (§6.3)
  "sws_child_peak": 1.2,     // sws_mult knot at age 6 (§4.15)
  "nap_age_exit": 6,         // nap mini-tick eligibility (§4.15)
  "nap_loss": 0.1,           // missed-nap same-day loss, unrecoverable (§4.15)
  "bump_semantic_gain": 0.5, // bump gain on cultural semantic records (§2)
  "bump_cascade_gain": 0.4,  // parents'-era secondary peak, encodeAge 4-10 (§2)
  "child_internal_confuse": 2.0, // internal source-confusion mult <9 (§6.10)
  "child_trauma_off": 0.1,   // trauma_thresh offset in childhood (§2, HYPOTHESIS)
  "tele_age_gain": 0.5,      // telescoping age gradient (§6.15)
  // v1.6 additions (age-decline II — the compensation layer,
  // age-decline.md Part II §§17–31)
  "value_select": 0.0,       // importance sharpening on E (§2; age curve §30)
  "positivity_gain": 0.0,    // valence asymmetry at encode/select; NOT
                             // reserve-shifted, load/stress-gated (§2, §5.4)
  "hyperbind_p": 0.05,       // wrong-context verbatim binding rate (§2)
  "dest_mem": 0.9,           // toldTo hit rate; misses → repeat tellings (§6.11)
  "ctx_loss": 1.0,           // context>content decay multiplier (§4.1/§6.15)
  "conf_inflate_old": 0.0,   // conf_out bump on wrong-flagged reconstructions (§3)
  "schema_support": 0.05,    // prior-knowledge encoding scaffold (§2)
  "stereo_suscept": 0.5,     // trait; evaluative-context θ tax (§5.4)
  "collab_partner_gain": 0.0,// intimate-dyad collaborative facilitation (§6.13)
  // v1.6 knot-table updates (existing params, new age knots):
  //   w_sensory: 0.10 → 0.07@70 → 0.05@85 (olfactory encoding decline)
  //   phantom_p: 0.02 → 0.035@70 → 0.05@80 (gist-false-memory scaling)
  //   gist_lure_gain: 0.3 → 0.42@70 → 0.5@80
  // v1.5 knot-table updates (existing params, new age knots):
  //   sws_mult: 1.2@6 → 1.0@14 (child side, §4.15)
  //   metamem_r: ~0.0@6 → 0.10@13 → 0.15 adult (§18)
  //   self_est_bias: +0.3@6 → 0 adult → −0.05@70 (children overpredict)
  //   offtarget_p: 0.01@20 → 0.03@50 → 0.15@80; mild elevation <10 (§5.19)
  //   source_confuse: external channel rides old-side knots ~1.8×@75 (§6.10)
  // v1.7 additions (emotional-memory II — the affect-tag layer,
  // emotional-memory.md Part II §§13–21)
  "peak_w": 0.55,            // peak weight in tag-setting (§2; end_w = 1−)
  "end_w": 0.45,             // end weight; +0.1 knot @70 (§2, §23 EM-II)
  "emo_assoc_loss": 0.25,    // graded item-context tradeoff ≥0.5 arousal (§2)
  "sleep_affect_strip": 0.04,// per-sleep arousal-tag decay; trauma-exempt,
                             // DEBATED flag — set 0 if depotentiation dies
  "regulate_style": 0.5,     // trait: 0 suppressor → 1 reappraiser (§2)
  "reg_thresh": 0.6,         // arousal where regulation engages
  "reg_suppress_cost": 0.2,  // enc_base cost for suppressors (§2)
  "reg_reappraise_k": 0.25,  // arousal-tag cooling for reappraisers (§2)
  "gen_width": 0.25,         // conditioned-affect similarity gradient (§4.9)
  "reconsol_window": 0.25,   // days; post-fire extinction bonus window (§4.9)
  "reconsol_extinct_gain": 3.0, // in-window safeCount gain → deep suppressor
  "contagion_k": 0.5,        // hearsay arousal transmission (§6.3)
  "verbal_dampen": 0.05,     // per-social-retell arousal decay; trauma-exempt
  "fab_self_gate": 0.4,      // selfRelevance floor for neg_affect_decay (§4.5)
  // v1.8 additions (false-memory II — candidates, claims, coercion,
  // false-memory.md Part II §§13–22)
  "cand_base_str": 0.7,      // misinfo candidate birth strength (§6.3)
  "fab_inflate": 0.5,        // claim→belief flip multiplier (§6.9)
  "forced_confab_gain": 0.2, // per-forced-answer candidate strength (§6.9)
  "other_gen_gain": 1.5,     // suggested > self-generated confabulation
  "press_gain": 0.3,         // per-repeat interrogative pressure (§6.9)
  "evid_boost": 0.4,         // perceptual-evidence plausibility lift (§6.9)
  "crypto_p": 0.08,          // cryptomnesia heard→self flip (§6.10)
  "consist_pull": 0.15,      // reconstruct toward current self (§6.17)
  "choice_support_gain": 0.15, // believed-choice feature bias (§6.17)
  "cb_detect": 0.3,          // outcome-swap detection (§6.18)
  "neg_gist_gain": 0.15,     // negative-CONTENT distortion boost (§6.3/§6.8)
  "negmood_verbatim_gain": 0.1, // negative-MOOD verbatim protection (§2)
  "prewarn_mult": 0.7, "inoc_mult": 0.75, "inoc_days": 14, // §6.3 timing
  // v2.0 additions (social-memory II — the talk ecology,
  // social-memory.md Part II §§18–29)
  "share_k": 0.8,            // |affect|-driven retell propensity (§4.13)
  "share_shame_pen": 0.5,    // shame suppression on sharing (§4.13)
  "rif_facil_k": 0.03,       // integrated-material facilitation (§5.8)
  "corroborate_conf": 0.15,  // mutual-validation conf bump (§6.20)
  "disagree_conf": 0.10,     // contradiction conf decrement (§6.20)
  "copresent_assume_p": 0.9, // copresence→assumed-knowledge rate (§6.21)
  "common_ground_conf": 0.8, // confidence on "would X know" (§6.21)
  "interpret_bias": 0.3,     // ambiguous-behavior assimilation (§2)
  "ambig_band": 0.3,         // |implied| bound for interpret bias (§2)
  "secret_tag_mult": 1.3,    // confidentiality decay vs content (§6.22)
  "absorb_p": 0.02,          // told_by→experienced flip rate (§6.23)
  "canon_thresh": 5, "canon_drift_mult": 0.2, "canon_resist": 0.6,
                             // story canonization (§6.24)
  "joint_attn_gain": 0.12, "joint_affect_amp": 0.1, // §2 coAttending
  "transact_loss": 0.12,     // absent-partner θ penalty (§6.14)
  // v2.2 additions (cast profiles, cast-profiles.md §1)
  "mig_bump_gain": 0.6,      // immigration-window bump strength (§4.1)
  "attach_encode_loss": 0.3, // preemptive E loss on attachment:true (§2)
  "attach_ret_cost": 0.15,   // searchCost add on attachment records (§2)
  "self_share_pen": 0.5,     // transmission cut on selfRelevance≥0.6 (§6.22)
  "secret_mindwander": 0.08, // confidential-record intrusion boost (§5.7)
  // IndivTraits gains axis 15: attach_avoid (σ, r(extra)≈−0.3,
  // r(neurot)≈0 — avoidance carries the memory deficit, anxiety doesn't)
}

// v0.9 FROZEN population constants — same for every character, never in
// profiles (identifiability audit, formal-model.md §4):
//   k = 8 (logistic sharpness §5.4), drift_k = 0.02, tau_episodic = 1.2,
//   tau_semantic = 30, collab_size_pen = 0.1, collab_friend_mult = 1.2,
//   arousal_affect_decay = 1.4, rep_cap = 2.0
// v0.9 deepening frozen constants (formal-model.md §16):
//   s_decay = 0.0008, relearn_gain = 0.8, resurrect_R = 0.35 (§4.11);
//   tele_cross = 21, tele_back = 0.05, landmark_gain = 0.4,
//   landmark_arousal = 0.7, k_order = 4.0 (§6.15); contiguity_tau = 2.0,
//   contiguity_asym = 1.25 (§5.4); hindsight_conf_gain = 0.08,
//   hindsight_max_surprise = 0.7 (§6.16); ease_few = 1.5,
//   ease_many = 3.0 (§5.4)
// v1.2 frozen constants (encoding-mechanics.md §11):
//   intent_null = 0 (intention-to-learn adds nothing past the orienting
//   task — Postman 1964; Hyde & Jenkins 1973; guarded by P111);
//   da_ret_cost = 1.5 (retrieval-DA searchCost multiplier, §5.4);
//   lapse_window = 0.02 day (doorway reach, ~30 min);
//   elaboration weights {0.5·selfRelevance, 0.3·predictionError,
//   0.2·coherence, 0.3·survivalRelevance} (LoP derivation mix, P110)
// v1.3 frozen constants (forgetting-curves.md §§7–8):
//   tau_quote = 0.02, beta_quote = 0.8 (verbatim-speech field class —
//   Sachs 1967; same for everyone, P121); lag curve SHAPE is frozen
//   (log-normal), only lag_opt_ratio/lag_width are free
// v1.6 frozen constants (age-decline.md §§24, 31):
//   stereo_age_gate shape (0 below age 50 → ramps to 1 by 70 —
//   population gate, never per-character; stereo_suscept is the trait)
// v1.8 knot-table updates (existing params, new age knots):
//   choice_support_gain: ×1.0 ≤50 → ×1.4 at 80 (Mather & Johnson 2000)
//   crypto_p: rides discrim_mult — old-side scaling, no separate knots
// v2.0 frozen constants (social-memory.md Part II):
//   share_relief = 0 (talk never extinguishes affect — Zech & Rimé
//   2005; guarded by P184); the §5.8 facilitate/suppress switch rule
//   (links/shared-event → +rif_facil_k, cue-similar → suppress)
// v2.0 knot-table updates (existing params, new age knots):
//   corroborate_conf: ×(1 + 0.2·(age_eff−65)/20) above 65 (§6.20)
//   copresent_assume_p: ×(1 + 0.3·age_eff/60) (§6.21)
//   absorb_p: rides discrim_mult (source-decay scaling, §6.23)
// (tau_*/collab_*/arousal_affect_decay/rep_cap remain in the table above
// for backward compatibility; loaders should treat them as constants.)
```

**Trait layer (v0.7):** parameter vectors are generated from a small
correlated latent trait vector `IndivTraits` (g_mem, wmc, neurot, extra,
consc, open, vivid, distrust, fantasy, sleep, stress, social, sex,
chronotype — plus the v1.9 block: inattn, verbal, gc, meta_conf,
checker, culture_self, fitness, aging_rate, dissoc, empathy, langs,
iiv) — sampled MVN(0, R) with the sparse correlation matrix in
`individual-differences.md` §4/§17 (pinned traits conditioned per the
§17 MVN-conditioning formula), then projected through the loading tables
(§3/§17 there) onto these params, plus ±5% residual jitter. This replaces
v0's independent ±10% jitter: real individual differences are
correlated (a low-WMC person is forgetful AND suggestible AND
source-confused — Jaschinski & Wentura 2002; Zhu et al. 2010), and
correlated flaws are what make a character's mind legible. Explicit
nulls the generator must preserve: no `g_mem → misinfo_suscept` direct
path (HSAM is not suggestion-immune — Patihis 2013), no `wmc →
cie_residual` (Brydges 2018), no `vivid → accuracy` (Dawes 2022).

**Continuous age evaluation (v0.3):** age-sensitive params are no longer
fixed per archetype — each is a piecewise-linear function of `age_now =
(worldDay − birthWorldDay)/365` (capacity params: enc_base, beta_*,
theta, misinfo_suscept, drift_p, confab_fill, neg_affect_decay, link_p,
intrusion_thresh, w_emo, w_self, att_min, pm_self) with the knot table in
`age-development.md` §6, evaluated at runtime and re-anchored yearly. Era
params use `encodeAge` on the record instead. The profile archetypes are
named knots on these curves — individual profiles = curve value ⊕
modifiers ⊕ jitter, unchanged. **v0.4:** decline-side capacity params
evaluate at `age_eff = age_now − reserve·reserve_shift` (§4.8);
**v1.9:** `age_eff = (age_now − reserve·reserve_shift)·(1 +
0.2·aging_rate − 0.15·fitness)` — individual aging slopes differ
(Salthouse; Rabbitt) and aerobic fitness slows them (Erickson et al.
2011; Colcombe & Kramer 2003); `aging_rate`/`fitness` are trait
passthroughs (individual-differences.md §15). **v1.9 optional:**
yearly trait drift (maturity principle, Roberts et al. 2006 — neurot
−0.02σ/yr, consc +0.02σ/yr, ages 20–50, clamped) re-derives affected
params at the existing yearly re-anchor; the
age-decline knot rows are in `age-decline.md` §13 (search_breadth,
env_support_gain, discrim_mult, lure_accept, specificity, tot_rate,
sws_mult, ret_noise — decline curves, ≥30 side). **v0.5:** the emotional
params (`w_emo`, `emo_consol_gain`, `abc_gain`, `conf_emo_gain`,
`neg_fidelity`, `neg_core_resist`) are deliberately NOT on the decline
curve — emotional-memory enhancement is preserved in aging, so its
proportional advantage grows as the neutral baseline falls (Kensinger et
al. 2007; emotional-memory.md §10).

Suggested clamp ranges are in `character-memory-profiles.md` §0 — implementers
should validate params into those ranges at load.

---

## 8. Tick architecture (suggested, cheap)

- **On event:** encoding pass §2 (O(1)); if the event carries
  `locShift:true`, additionally apply the §2 doorway penalty to
  last-`lapse_window` records and pending Intentions (v1.2).
- **Daily tick:** decay pass §4.1 (all records), interference/genericization
  §4.2–4.3 only on records sharing cue keys (bucket by cue, never O(n²)),
  sleep consolidation §2 (also applies §4.6 consol_beta_mult to same-day
  records), affect fade §4.5, permastore check §4.7 on semantic records.
- **On conversation/perception:** retrieval §5 → reconstruction →
  reconsolidation §5.9 → drift §6.1; rumor heard → §6.3; co-discussion → §6.5
  (with part-list suppression §5.8).
- **Ambient tick (unfocused attention):** involuntary-retrieval scan §5.7 —
  bucketed by cue key, same O(near-fan) cost class as interference.
- **Budget:** expect ~200–800 live records per main character; archive below
  threshold. Ambient NPCs run the same equations with a coarser tick and
  smaller caps (they're thin-AI anyway).

## 8.1 Formal semantics pointer (new in v0.9)

The tick sketch above is superseded by `formal-model.md`, which is the
authority on: timebase/units (day floats; decay evaluated as R(Δt) never
per-tick-multiplied — power-law scale invariance makes tick granularity a
compute decision); Event/CueContext schemas + derived-field defaults
(attention/selfRelevance/novelty/predictionError); strict operator order
for encodeEvent, recall, dailyMemoryTick, hearAccount (order-sensitive
pairs are only consolidation→decay and merge→archive); the frozen-vs-free
parameter split; caps (enc_quota_per_day, cap_episodic, cap_archive,
cap_persons); ambient degraded mode (ambient_tick_mult, ambient_cap, no
phantom/scan machinery); possession semantics (records encode with hidden
`possessed` flag + `possess_alien` estrangement discount at retrieval;
scan suspended; resume replays ≤ catchup_max daily ticks then aggregates);
seeded RNG `rand(seed, charId, worldDay, opSeq)` for bit-identical replay.

## 9. Non-goals for v0

No procedural-skill dynamics. No language-level rumor simulation; distortion
is field-level. No neural plausibility — functional equivalence only.
Prospective memory moved from non-goal to **optional extension** in v0.3:
`Intention = {action, triggerCues, dueDay}` — event-cued intentions resolve
through the ordinary §5 formula (older adults unimpaired); uncued deadlines
resolve via `pm_self` probability (older adults impaired). This reproduces
the age-PM paradox for free. See `age-development.md` §7.
**v1.3:** armed event-based Intentions decay at `beta_pm` (0.15) while
waiting — they barely fade because retention is tested *at the cue*
(Einstein & McDaniel 1990); on trigger-fire the intention resolves into
an ordinary episodic record and decays normally. The v1.2 doorway
penalty still applies — PM failure is a cue problem, not a decay problem.

## 10. Interface contract for game-systems

- `encodeEvent(charId, event, context) -> MemoryRecord|null` — event may
  carry `arousal`/`valence`; v0.5 triggers the emotional blink, trauma
  tagging, ABC reallocation, and conditioned-affect acquisition internally
- `recall(charId, cueContext, k) -> [Reconstruction]` (with confidence,
  beliefStatus); `cueContext.mode` ∈ `"recall" | "recognition"` (v0.2, §5.6);
  a Reconstruction may carry `tot: true` with blanked name fields
  (v0.4, §5.5) — dialogue should render it as feeling-of-knowing
  ("…the woman from Mudhaus, name's right there"). v0.5: `cueContext` may
  carry `stress` (0..1 — acute retrieval impairment, §5.4) and `mood`
  (drives mood_bleed on the reported affect tag, §5.5). v0.6: a
  Reconstruction may originate from a `phantom:true` record (§6.8) —
  the flag is NEVER exposed to the character; it exists for the
  history browser and validation probes only
- `conditionedAffect(charId, cue) -> {valence, arousal}|null` (v0.5, §4.9)
  — read the conditioned-association response to a cue; dialogue/
  behavior layer uses it for avoidances and attractions that outlive the
  episodic source
- `ambientMemoryScan(charId, context) -> [Reconstruction]` — involuntary
  recall for unfocused ticks (v0.2, §5.7)
- `hearAccount(charId, speakerId, account)` → misinformation merge.
  v0.6: `account` may carry `warned: true` (listener flagged the source
  as unreliable — halves adoption, §6.3), `disputed: true` (listener
  contradicted live — near-immunity, §6.5), `type: "correction"`
  (retraction path — §6.6, flips beliefStatus→"doubted" at
  `retract_p` while content keeps `cie_residual` inference weight).
  `hearCount` on the content hash increments regardless of speaker —
  repetition, not variety, is the fluency mechanism (§6.3)
- `imagineEvent(charId, scenario)` (v0.6, §6.9) → writes/strengthens an
  `imagined`-source record gated by `plaus_min`; used for daydreams,
  rehearsed lies, and guided probing; records can later flip to
  `witnessed` via source decay + richness gate (reality-monitoring
  failure)
- `discussEvent(charA, charB, eventRef)` → bidirectional merge + part-list
  suppression of unspoken fields (v0.2, §5.8); v0.6: emit `disputed`
  on hearAccount when a listener's reconstruction contradicted a field
  during the discussion (§6.5)
- `retell(charId, audienceId, record)` (v0.8, §6.11) → audience-tuned
  drift of the speaker's own record; requires `audienceStance` from the
  dialogue layer, gated by `shared_reality_gate`; on `told_by` records
  additionally runs the §6.12 serial-reproduction operators (leveling,
  stereotype convergence) — retransmission is the rumor engine
- `groupRecall(members, C)` (v0.8, §6.13, optional) → collaborative-
  inhibition wrapper for group-reconstruction scenes; returns the
  inhibited union and applies postcollab boosts + member-side SS-RIF
- `recall(charId, cueContext, k)` — v0.8: `cueContext.targetPerson` on a
  recognition-mode call invokes the §5.10 cascade (returns
  `familiar_only`/`identity`/`tot` tiers); `cueContext.mode:"directory"`
  returns `knowsTopics`-ranked candidates (§6.14)
- `hearAccount` — v0.8: `account` may carry `chainPos`/`hop` for the
  §6.12 transmission operators; speaker credibility now resolved from
  `PersonModel[speaker].credibility` (§6.14) when a model exists
- `dailyMemoryTick(charId, sleepQuality)` → decay/interference/consolidation
  + v0.5: selective emotional consolidation and retrograde stress
  enhancement on the first sleep tick, affect-tag decay split, conditioned
  -affect decay/recovery (§4.9); v0.6: `sleep_gist_boost` on generic +
  phantom records (§4.6), source-decay check feeding `sourceInfer`
  (§6.10)
- `memorySnapshot/Load(charId)` → serialize the stores (episodic,
  semantic, conditioned-affect, PersonModel social store) + params +
  RNG opSeq state (v0.9 — round-trip must preserve determinism, P69)
- v0.9 deepening (formal-model.md §§10–16):
  - `recall` results carry `searchCost` (§5.4) — scored/returned ratio +
    drive margin; dialogue reads it for judged-frequency hedging
    (ease-of-retrieval). `cueContext.temporalAnchor` is set internally
    to the last recalled record's createdDay (contiguity, §5.4);
    callers may set it explicitly for guided reminiscence
  - `dateEstimate(charId, record) -> {reportedAge, reportedDay}` (§6.15)
    — telescoping + rounding + landmark anchoring; `orderBefore(m, n)`
    for date-loss-tolerant ordering
  - `learnOutcome(charId, eventRef, outcome)` (§6.16) — hindsight
    assimilation of prediction records when the world resolves an open
    question; blocked past `hindsight_max_surprise`
  - reported confidence goes through the §3 `conf_out` overconfidence
    adjustment — never write conf_out back into stored confidence
- v0.9 hard-safety rule: `possessed`, `phantom`, `accuracy`, and all
  other hidden flags/fields must NEVER serialize into possession
  briefings or any player-visible surface (formal-model.md §6)
- v0.9 ambient/offline mode: `dailyMemoryTick` accepts
  `mode:"ambient"` — coarser cadence (ambient_tick_mult), caps
  (ambient_cap), phantom minting and §5.7 scan disabled; promotion to
  main preserves existing record ids (formal-model.md §5)
- `deriveParams(archetype, modifiers, traits, seed)` (v0.7) → MemoryParams
  — the character-creation helper: applies the §3 loading table +
  residual jitter + §0 clamps so a bible trait vector deterministically
  yields a parameter vector (individual-differences.md §4). Pure
  function; pinning traits makes character generation reproducible
- `rememberIntention(charId, intention)` → optional PM extension (§9, v0.3)
- v1.0 additions (profile-generation.md §§2–4):
  - `deriveParams` now also emits `SelfModel` + `DomainTable` +
    `seedHints` side outputs; deterministic given (pins, seed); emits
    frozen constants untouched (P95 audit)
  - record flag `open` + `closeLoop(charId, recordRef)`;
    `openLoopUrge(charId) -> [recordRef]` on the ambient scan — open
    loops intrude (gain) and decay *faster* once closed (β×1.2)
  - `selfReport(charId, facet) -> self_est` — metacognitive commentary
    source; deliberately decorrelated (metamem_r ≤0.3) from real params
  - `encodeEvent` context may carry `open:true` candidates and
    `domainMatch` is derived from profile `domains` vs event cue tags
- Belief layer: `beliefStatus` on records IS the belief-vs-fact hook; rumors
  are just records with `source.kind:"told_by"` + `beliefStatus:"rumor"`.
- v1.1 (validation-design.md): hidden record fields (`accuracy`,
  `phantom`, `retracted`, `possessed`, `sleepdep_flag`, `storageS`,
  `retrievalCount`) are readable by the validation harness as the
  ground-truth tap; they must NEVER leak into dialogue, briefings, or
  feed text. Probe/analyzer output schema + acceptance gates live in
  validation-design.md §§2.5, 8.
- v1.2 additions (encoding-mechanics.md §§1–9):
  - `encodeEvent` event may carry `engagement` (observed/heard/enacted/
    generated/spoken), `daLoad` (0..1 secondary-task pull), `boundary`,
    `locShift`, `coherentUnit`, `isolated`, `survivalRelevance` — all
    optional; defaults derive from source.kind per formal-model.md §5
  - a `locShift:true` event triggers the doorway penalty on recent
    records + pending Intentions (§2; flat across age)
  - `cueContext.daLoad` (0..1) raises `searchCost` by ×`da_ret_cost`
    only — retrieval under divided attention is slow, not fragile
    (Craik 1996); never moves θ
  - `rememberIntention` records are doorway-susceptible: a locShift drops
    their accessibility like any recent record — "walked in and forgot
    why" is emergent
- v1.3 additions (forgetting-curves.md Part II):
  - `suppressEvent(charId, recordId)` → deliberate-avoidance operator
    (§4.12): cumulative θ bump capped at `suppress_cap`, R-side only,
    §5.7 involuntary scan exempt. The dialogue/behavior layer calls it
    when a character actively steers away from a memory.
  - `dailyMemoryTick` additionally runs the §4.13 retell-ecology draw
    (p_retell per live episodic record) and the childhood consolidation
    gate on records with encodeAge < amnesia_exit.
  - record schema gains `n_sim` (§4.2 PI accumulator), `suppressed`
    (int, §4.12), `attempted` (§4.11 potentiation flag) — all hidden,
    snapshot-additive, harness-readable like other hidden fields.
  - `recall`/`hearAccount` reboosts split by kind: recall grows S at
    s_gain_recall, re-exposure at s_gain_rehear (§4.11); recall results
    may surface previously-unreturned verbatim fields at
    `reminiscence_frac` (§5.11).
- v1.4 additions (retrieval-cues.md Part II):
  - `cueContext.ops` — the dominant processing channel of the retrieval
    context (semantic|perceptual|social|enactive); mismatched vs the
    record's `encodeOps` attenuates cueMatch_ext ×`tap_mismatch` (§5.12).
    Callers may omit → neutral (no penalty).
  - `recall(charId, cueContext, k)` with k>1 runs a §5.13 bout: emitted
    items compound `out_int` and part-list-suppress the unemitted;
    single-item calls unaffected.
  - `rememberIntention(charId, intention)` gains `cueType`
    (`"event"|"time"`) and `focal` — firing routes per §5.14; game-systems
    supplies `focal` from the attention budget when the cue appears.
  - `conditionedAffect` reads `extinctCtx` — `extinct_suppress` applies
    only inside an extinction context; elsewhere the entry fires at
    `strength·renewal_frac` (§5.15). Safe-exposure events pass their
    place id so the set accrues.
  - Reconstruction may carry `tot_fields` state — `syllableCue` on
    cueContext resolves a flagged TOT at `tot_resolve_p`; unresolved
    TOTs raise that field's next-attempt `tot_rate` ×`tot_persist`
    (§5.16).
  - successful `recall` runs a depth-1 derived scan over `links` at
    `chain_gain` — returned Reconstructions may carry `viaReminding: m_id`
    (§5.17).
  - `dailyMemoryTick` applies the §5.18 `tmr_gain` consolidation edge to
    records sharing a sensory cue with the sleep context; procedural and
    cue-absent records exempt.
  - record schema gains `encodeOps` and `tot_fields`; CondEntry gains
    `extinctCtx` — all hidden/harness-readable like other state fields.
- v1.5 additions (age-development.md Part II):
  - record schema gains `latent` (hidden); `dailyMemoryTick` accepts
    `nap: true` for `age_now < nap_age_exit` and runs the §4.14
    latent-window/gate transitions.
  - `recall`/`retell` bouts emit §5.19 off-target intrusions at
    `offtarget_p(age_eff)`; Reconstructions may carry
    `latent_returned: true` via the §5.20 compound-sensory route —
    dialogue should render it as a fragment ("…I smell it more than I
    see it"), never a scene.
  - `encodeEvent` event may carry `scaffolded: true`, `cultural: true`,
    `cascade: true` (world-builder supplies; defaults false).
  - `hearAccount` gains the §6.3 knowledge-protection clause —
    `know_protect_*` params; nothing caller-side changes.
  - `reminiscence_env` is a creation-time param (bible dial), fixed
    for life; `naps` is a bible flag consumed by the §4.15 tick.
- v1.6 additions (age-decline.md Part II — the compensation layer):
  - `encodeEvent` applies the §2 compensation terms — `value_select`
    importance sharpening, `positivity_gain` valence asymmetry (gated
    by daLoad/stress), `schema_support` semantic-scaffold gain, and
    `hyperbind_p` wrong-context binding (`hyperbound` fields are
    hidden/harness-readable); `w_sensory` declines on old-side knots.
  - `retell` writes `toldTo[audienceId]` and emits `alreadyTold: true`
    on a `dest_mem` miss — the repeat-story tell (§6.11).
  - `cueContext.evaluative: true` applies the §5.4 stereotype-threat θ
    tax in recall mode only (Armstrong 2017 moderator — never in
    recognition mode).
  - `groupRecall` gains `collab_partner_gain` for intimate dyads
    (§6.13) — old couples can beat their own solo union.
  - `conf_out` gains `conf_inflate_old` on wrong-flagged
    reconstructions (§3) — confident-and-wrong is the old-age signature.
  - `dateEstimate`/`orderBefore` noise scales by `ctx_loss` (§6.15).
  - record schema gains `toldTo` (hidden map) and verbatim fields may
    carry `hyperbound` (hidden) — snapshot-additive, never serialized
    to briefings/feed.
- v1.7 additions (emotional-memory.md Part II — the affect-tag layer):
  - `encodeEvent` event may carry `affectSeries` — within-event
    arousal/valence samples; when present the stored tag is peak-end
    weighted (`peak_w`/`end_w`), duration-neglecting (§2). Scalar
    events behave exactly as before.
  - `encodeEvent` event may carry `regulate_style`-relevant context
    implicitly — the trait is per-character (bible); suppressors pay
    `reg_suppress_cost` on `enc_base`, reappraisers store a cooler
    `arousal_tag` (§2).
  - records with `arousal ≥ 0.5` pay `emo_assoc_loss` on link_p,
    `verbatim.when`, and source-tag birth strength — the graded
    item-context tradeoff (§2); §7's trauma clause stacks on top.
  - `hearAccount`/`account` may carry `speaker_express` (0.5–1.5) —
    secondhand records' arousal = `source_arousal·contagion_k·
    speaker_express·(0.5+0.5·empathy_trait)`; hearsay can mint
    CondEntries on places never personally feared (§6.3, §4.9).
  - `conditionedAffect` firing is similarity-keyed (§4.9
    `gen_width`, trauma-widened) — callers should expect nonzero
    responses for *similar*, not just matching, cues. `CondEntry`
    gains hidden `reconsol_open`/`deep` suppressor flags.
  - `retell` applies `verbal_dampen` to `emotional.arousal` when an
    audience is present; solo §4.13 draws do not; `trauma:true`
    records exempt (§6.11).
  - `dailyMemoryTick` sleep phase applies `sleep_affect_strip` to
    episodic arousal tags (trauma-exempt, flagged DEBATED —
    emotional-memory.md §14) and the §2.3 tag-capture half-strength
    rescue of weak cue-unrelated neighbors of emotional events.
- v1.8 additions (false-memory.md Part II — candidates, claims,
  coercion, self-directed distortion):
  - **SCHEMA CHANGE:** verbatim fields are candidate sets
    `{value, candidates:[{value, candStrength, provenance, day}]}` —
    §6.3 adoption pushes a candidate (provenance
    witnessed/told_by/imagined/confabulated/claimed/inferred), never
    overwrites; field retrieval samples ∝ candStrength; losing
    candidates eat §5.13/§5.8 suppression when the winner is
    rehearsed. Scalar fields deserialize as single-element
    candidates — backward compatible.
  - `hearAccount` account may carry `prewarned:true`,
    `evidence:"photo"|"video"|"artifact"`; character store gains
    `inoc_until` set by being-burned events (§6.3, §6.9).
  - `imagineEvent` gains `claim:true` (deliberate lies — gen+prod
    gains, fab_inflate flip, echo corroboration) and `evidence`
    (plaus_eff lift + pre-satisfied richness gate) (§6.9).
  - `answerProbe(charId, question, {forced, suggested})` — forced-
    confabulation operator: writes `confabulated`/`coerced`
    candidates, repeatCount compounds (§6.9).
  - `swapOutcome(charId, recordRef, newOutcome)` — §6.18 choice-
    blindness seam; undetected swaps are owned and confabulated,
    detected ones tag `incongruent:true`. Intended use: possession
    handoff, admin-acted outcomes.
  - Reconstruction of evaluative/decision fields runs §6.17
    consist_pull toward the current self-model; choice records run
    the choice_support_gain bias.
  - record schema gains hidden `confab_count`, `coerced`,
    `cb_swapped`, `incongruent` flags — snapshot-additive,
    harness-readable, never in briefings/feed.
  - §6.19 documents the repression non-mechanism: no repress()
    operator, ever (P172).
- v1.9 additions (individual-differences.md Part II §§9–18):
  - `encodeEvent` context may carry `intox` (0..1) — anterograde-only
    encoding loss + peripheral-field thinning + blackout-window
    omission at ≥0.8 (§2); record schema gains `intox` (encode-time
    value) and optional `lang` — both snapshot-additive; `lang` is
    player-safe to expose, `intox` is harness/hidden.
  - `cueContext` gains `lang` (§5.2 attenuation), `verify:true`
    (§3 checking-paradox conf decrement — dialogue calls it for
    re-checking behavior), `intox` (§5.4 mild state-dependent cue).
  - `selfReport(charId, facet)` gains the §13 complaint composite —
    complaint output weighted to neurot/distrust/stereo_suscept, NOT
    actual params (`complaint_k`); felt memory and real memory stay
    decoupled by design (Jonker 2000).
  - `dailyMemoryTick` draws the `day_mult` IIV factor (§2) — cheap
    "off day" dial; and at intox≥0.8 windows applies the omission
    bump retroactively to that window's events.
  - `deriveParams` accepts the extended IndivTraits block (§7);
    `langs` is a set-valued trait (not N(0,1)); pinned-trait
    conditioning is the §17 MVN formula — pinning high `neurot`
    pulls `distrust`/`checker`/`stress` upward automatically.
  - lure/adoption paths honor `expert_lure` when the content matches
    a profile domain (§5.6/§6.3/§6.8) — expertise is double-edged.
- v2.0 additions (social-memory.md Part II §§18–29 — the talk ecology):
  - `encodeEvent`/`hearAccount` events may carry `confidential: true`,
    `coAttending: true` (stricter than `present` — mutually engaged),
    and `shame: true` on self- culpable content (§4.13 suppressor);
    `tagEvent(charId, recordRef, {confidential:true})` marks an
    already-encoded record ("keep this between us" after the fact).
    `confidential`/`secret_str`/`shared_with`/`retellCount` are hidden
    record fields — snapshot-additive, harness-readable, never in
    briefings/feed; `shame` and `coAttending` are context inputs.
  - `retell`/`discussEvent`/`hearAccount` now additionally run: the
    §6.20 corroboration confidence update (conf writes to BOTH
    parties' records — callers should expect hearAccount to mutate
    the listener's conf, not just content); the §6.22 respect roll on
    `confidential` records (a failed roll transmits content without
    the flag — silent leak); the §6.23 absorb_p draw on qualifying
    told_by records; and §6.24 canon checks (post-threshold records
    take canon_drift_mult and gain canon_resist vs adoption).
  - `context.present` now also drives §6.21 `shared_with` writes
    (copresent_assume_p) — a false-positive channel by design; the
    world layer should NOT gate it on the co-present character's
    attention (that gate would remove the error we're modeling).
  - `"directory"` recall mode (§5.10) reads
    `PersonModel[X].available` — when false, topic-listed recall pays
    `transact_loss` (§6.14); the world layer flips `available` on
    death/move/estrangement, and `groupRecall`/`discussEvent` with an
    unavailable partner simply cannot be called (the loss shows up in
    solo recall instead).
  - record schema gains `shared_with` (list), `confidential`,
    `secret_str`, `retellCount`, `absorbed` (hidden flag set on the
    §6.23 flip — harness-readable provenance change marker).
- v2.1 additions (formal-model.md Part III §§18–25 — measurement layer):
  - all `similarity`/`sim` call sites now resolve through
    `simOp(a, b, mask)` (§11.1) with the mask table in formal-model.md
    §18 — the operator is pure and free to call anywhere; the masks are
    part of the spec (change a mask, change a probe).
  - `recall` failures and TOT returns carry `fok` (hidden,
    harness-readable) + one optional rescan when `fok > fok_retry`
    (§5.21). Dialogue uses it for "it's right there…" effort and for
    deciding whether to dig; it is NOT exposed as a number.
  - `encodeEvent` returns/stamps hidden `jol` (§5.21); delayed
    judgments feed `selfReport`'s SelfModel via `metamem_r`.
  - stochastic draws obey the §22 axioms: truncated Gaussians, uniform
    drift steps, integer RNG, `rand(seed, charId, day, opTag, i)`
    namespaced sequencing — probe-safe refactors.

## 11. Formal annex — simOp and the distribution axioms (new in v2.1)

### 11.1 `simOp(a, b, mask)` — the only similarity function

```
simOp(a,b,mask) = Σ_f w_f(mask)·match_f(a_f,b_f) / Σ_f w_f(mask)
match_f: people/topics/sensory = jaccard; place = 1|place_adj|0;
         mood = 1−|Δ|/2; when = exp(−|Δday|/sim_tau_time);
         names = {1.0 equal, 0.7 same phonological key,
                  0.4 same onset+length class, 0 else}
```

Masks (weight vectors, normalized per row): `sim_interf`,
`sim_merge`, `sim_cond`, `sim_rif`, `sim_misinfo`, `sim_source`,
`sim_remind`, `sim_person` — table and per-mask rationale in
formal-model.md §18. Call sites: §4.2 → sim_interf; §4.3/§4.11/§6.23
→ sim_merge; §4.9 → sim_cond; §5.8 → sim_rif; §6.3 → sim_misinfo;
§6.10 → sim_source; §5.17 → sim_remind; §5.10/§6.10 name tier →
sim_person. A callsite running a custom weight vector instead of its
mask is a spec violation (P193 probes mask distinctness).

### 11.2 Distribution axioms (normative, formal-model.md §22)

Truncated-Gaussian draws (±3σ then domain-clamp); drift steps
`drift_k·U(0.5,1.5)`; integer RNG (splitmix64-class) with
`rand(seed_base, charId, worldDay, opTag, i)` — opTag namespaces make
probe harnesses refactor-safe; correlated draws share the first
uniform where the mechanism is causal (one distracted moment → bad
encode AND bad retrieval).
