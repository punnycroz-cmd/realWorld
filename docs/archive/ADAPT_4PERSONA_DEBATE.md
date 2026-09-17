# MINUTES OF THE 4-PERSONA COUNCIL DEBATE: ADAPTATION D1–D4
**Project:** Willowbrook / World-Sim  
**Date:** 2026-09-16  
**Recorder:** Robin (Junior Developer)  
**Reference documents:** `ADAPT_MASTER_DOC.md`, `ADAPT_D1-D4_DETAIL.md`, `thinking-process.md` (Parts 3 & 6), `SPEC_PHASE6.md`  
**Council rules:** Speak bluntly, defend your professional viewpoint to the end, no false harmony, stay grounded in code reality and execution capacity.

---

## PARTICIPANTS

1. **Master Artisan (Lead Persona):** The pragmatic builder. Catchphrase: *"How much does this cost? What breaks? Who maintains it? Can it be automated-tested?"* Has a pathological hatred of dead code (the bug #13 `calcOccupationBonus` trauma).
2. **The Scholar (Lead Persona):** The humanist lens and the reality of lived life. Catchphrase: *"Do real people actually work like that? Where are the depths of the heart, pain, pride, and dignity in this pile of formulas?"*
3. **The Ecologist (Robin/agy Persona):** Systems and emergence. Catchphrase: *"Do two-way interactions conserve matter/energy? Does it create living stories, or just staged scripts?"*
4. **The Epistemologist (Robin/agy Persona):** The boundary of knowing. Catchphrase: *"What do villagers actually know through finite senses? How is the mind's model distorted? Where is the line between genuine perception and fake omniscience?"*

---

## PART I: DETAILED DEBATE BY 5 TOPICS

```
+-------------------------------------------------------------------------------+
|                             4-PERSONA CONFLICT MAP                            |
|                                                                               |
|   [Master Artisan] ---------- (Cost / Dead code) ----------> [The Scholar]    |
|      |  \                                                       /     |       |
|      |   \--- (Bug #13) ---> [The Presentation Boundary] <-----/      |       |
|      |                                                                |       |
| (Test quota)                                                   (Human psyche) |
|      |                                                                |       |
|      v                                                                v       |
| [The Epistemologist] <---- (A2 Signal / Feedback) ----> [The Ecologist]       |
+-------------------------------------------------------------------------------+
```

---

### TOPIC 1: D1 — Chemical Substrate: Option 1 (C3 + Decay Accumulators) + the `FeelingSubstrate` Interface
*The question:* Does Option 1 combined with the `FeelingSubstrate` interface genuinely keep the upgrade path to 12 chemicals (Phase 7), or is this interface just a "polite fiction"? What would turn this interface into a farce?

**Master Artisan:**
> "I'll open. You all love painting fancy phrases like 'abstract interface contract' or 'future-ready architecture'. But to me, an interface is only a **polite lie** when its two endpoints don't share the same dynamical nature!
> Look at the guts of Option 1: the current C3 is just a few direct mappings from `body` to `emotions` (`satiety < 0.35 -> anxious`). The lead proposes adding a few decaying accumulators (`dt`-scaled) like prolonged hunger breeds stress, fear breeds exhaustion. Fine — that's cheap, a few dozen lines of code, controllable.
> But then you insist on wrapping it in a grandiose class called `FeelingSubstrate` with `getFeelingScape(v)` and `getLayers(v)`, promising that in Phase 7 we just 'swap in' the 12 real chemicals and the AI brain won't break.
> I warn you: **the interface becomes a lie the day Phase 7's handover arrives and the entire signal probability distribution and sensitivity gets turned upside down!** On one side, 3 simple linear accumulators I hand-tuned; on the other, 12 nonlinear chemicals with 17 tangled cross-effect pairs pulling against each other. An AI brain that learned to survive on Option 1's signals will go mad or freeze when the real 12 chemicals are plugged in! If the interface promises a flawless, seamless swap, that's classic architecture snake oil."

**The Ecologist:**
> "The Artisan sees the technical-debt risk, but he hasn't seen the root of why it will break: **the total absence of closed-loop feedback!**
> In the source doc's 12 chemicals, the body is a dynamic-equilibrium ecological network: hunger generates ghrelin -> stimulates cortisol -> cortisol suppresses immunity and accelerates glycogen burn -> hunger comes faster; oxytocin from social contact quenches cortisol -> helps the body recover. That is two-way interaction!
> And what is your Option 1? All **one-way arrows (feed-forward)**: hunger -> stress accumulator; fear -> fatigue accumulator. Does that stress accumulator ever turn back and strangle the stomach so the villager's gut aches too much to eat? Does fatigue ever slow the heart and reduce healing rate? No!
> You're just stacking up 'penalty points' and slapping a 'substrate' label on them. If `FeelingSubstrate` only spits out a pile of one-way accumulations, it's not a biological substrate — it's an administrative fines table! Come Phase 7, when a real ecosystem demands closed-loop interaction, this interface will crack open at the root."

**The Epistemologist:**
> "The Ecologist scoffs at one-way arrows, but he's standing in the biological basement demanding to judge the cognitive floor!
> Master Doc Principle A4 is explicit: **the AI brain lives only on Layer 3 and never sees numbers!**
> Does a human brain ever read 'my cortisol is currently 42.5 ng/mL'? Absolutely not! Human cognition only receives synthesized signals: 'chest tightening', 'a gnawing gut', 'vague unease'.
> Therefore `FeelingSubstrate` is NOT a lie IN COGNITIVE TERMS, if and only if it commits to one single thing: **whether underneath it are 4 crude accumulators or 12 complex chemicals, what passes through the Layer 3 window up to the AI brain and onto the WHY HUD must be THE SAME SET OF FEELING VOCABULARY (Feeling Qualities)!**
> So what would turn this interface into a farce?
> **It becomes a farce when we violate bug #13 discipline: writing the interface while all surrounding code still sneakily pokes straight into `v.emotions` or `v.body`!** If `02_body.js` or `utility.js` still checks `b.satiety < 0.2` instead of asking the substrate 'what scape does this villager have', then that interface is decorative garbage. It's only honest when it's the single mandatory path for the entire cognitive system!"

**The Scholar:**
> "You're all busy arguing whether the interface is real or fake, one-way or two-way, and forgetting the most important question: **does Option 1 truly reflect the inner heart of a flesh-and-blood human?**
> The current C3 plus accumulators has a fatal human flaw: **it treats emotions as momentary oscillating pendulums — the stimulus ends, and they switch off (decay)!**
> Hungry means anxious, eat a bowl of porridge and 2 hours later you're content. Meet a wolf means fear, escape and 3 hours later fatigue has dissolved and you're at peace again. Real human life is never that cheap!
> An old potter who lost his child in a famine winter — that grief and emptiness soaks into the marrow and lasts months, years. At least the source doc's 12-chemical version imagined chronic baselines through week-long serotonin/dopamine depletion.
> Option 1, with its 'gradually dissolving by the hour' (`dtH`) accumulators, has ruthlessly thrown out all chronic psychological states. If a mother who buried her child yesterday flips to `content` today because her hunger numbers stabilized, that is not a human being — it's a soulless biological machine!
> If Option 1 turns humans into shallow creatures with no depth of torment, then calling it a 'solid stepping stone' for Phase 7 psychology is the studio's greatest self-deception."

---
### TOPIC 2: D2 — Organ Qualities: Vocabulary-Only vs 9-Organ Simulation
*The question:* Does the decision to take only vocabulary (vocabulary-only), mapped from existing body fields without simulating 9 discrete organs, miss any stories? What is the concrete counterexample where body fields surrender but simulated organs can tell the story?

**The Scholar:**
> "Let me give the first lethal counterexample right away: **Local Functional Dissociation!**
> Picture Alden the woodcutter, trapped in the West-edge forest fire. He escapes death, but toxic smoke and ash have scorched his throat lining.
> In real life: a scorched throat (`throat.scorched`), swollen, unable to swallow. His body is severely dehydrated, `hydration` bottoming out at 0.1. A fellow villager brings a bowl of clear spring water to his lips. The will to live urges him to drink; but the moment he sips, his throat spasms violently, water pours out his nose, and he chokes in excruciating pain. He dies of thirst beside a full water barrel!
> Now look at the Artisan's current body-field system: what do we have? `hydration = 0.1`, `pain = 0.4`, `injury = 0.3`.
> With no independent `throat` organ, the system only sees: extreme thirst + water available = DRINK! Water slides straight into the stomach, `hydration` shoots up to 0.8, and the farmer is hale and hearty!
> A gut-wrenching tragedy about the helplessness of one locally broken organ has been flattened into trivial arithmetic. How do you answer this case?"

**The Ecologist:**
> "Let me add a second ecological counterexample: **the excretion cycle and bladder pressure (`bladder.urgent`)!**
> A living body isn't just input; a living body must also have output. The bladder is an independent mechanical pressure balloon, completely unrelated to whether the body is thirsty.
> A guard stands watch on a rainy night. He's drunk lots of hot tea against the cold. His body has excess water; his bladder is stretched to its limit. Just then, a strange noise comes from the village gate.
> With bladder simulation: the extreme physical pressure shatters concentration — he's restless, trembling, perhaps even abandoning his post to find cover, opening a gap for the wolves to slip through. Or a child startled by a wolf, bladder spasming out of control, wets himself — a classic biological marker of extreme fear.
> With your body fields: there's only `hydration`. High hydration means... nothing happens — just a state of perfectly hydrated bliss! Never any loss of bodily control, never any seeking of private cover, never the shame of the bedwetting child. A world clean and sterile as a laboratory!"

**Master Artisan:**
> "You two just told two very moving literary tales, but from a game-building engineer's view, you're committing a fatal error: **using a rare edge case to justify erecting a garbage castle!**
> Count the price of those two stories: 9 organs × 100 villagers = **900 state machines running in the background every tick!**
> 900 state machines with dozens of discrete variables: how many ml the bladder holds, how the stomach churns, how narrow the bronchi are, how many beats per minute the heart pounds...
> And who writes the tests? The Examiner will make Robin write: panic-bladder-leak tests, food-choking-on-scorched-throat tests, cardiac-local-ischemia tests... How many thousands of test lines for things the player would never glimpse in 99% of playtime?
> As for the Scholar's counterexample: why give birth to an entire `throat` organ? The `02_body.js` system in 6C already has a `conditions` array (wounds, illnesses)!
> If Alden choked on smoke, just assign one condition: `{ id: 'throat_burn', blocksAction: 'drink', duration: 48 }`.
> Done! Exactly 3 lines of code! 100% of the tragic effect, without feeding 9 hollow organ machines for nothing! Never use a cannon to shoot a sparrow!"

**The Epistemologist:**
> "The Artisan's cost-hacking is very practical, but I want to point out the cognitive essence of the matter: **humans never experience their internal organs as independent mechanical machines.**
> Does anyone sitting here know how many enzymes their liver is filtering right now, or exactly how many milliliters of water their bladder holds? Not at all!
> We only perceive our bodies when an organ **fires an emergency signal that hijacks attention (somatic attention)**: a cramp in the lower belly, a choking tightness in the throat, a heartbeat thudding against the eardrum.
> So modeling 9 organs as 9 continuously running independent state machines is epistemologically naive. That's mechanical-simulation thinking, not human cognition!
> The D2 'Vocabulary-only' decision is COMPLETELY CORRECT. What we need isn't simulating the heart or stomach, but a **feeling-quality vocabulary (Qualities) capable of seizing attention.**
> However, I warn the Artisan: the current vocabulary only reads from 6 generic survival stats (`satiety`, `fatigue`, `hydration`...). To tell the Scholar's story, the vocabulary mapping MUST also read the `conditions` array (local injuries) to produce words like `choked`, `scorched`, `stabbing`. Without that, the vocabulary is just a useless synonym swapper!"

---

### TOPIC 3: D3 — Intensity-Fragmenting Voice: Presentation vs Dead Decoration (Bug #13)
*The question:* Intensity-fragmented voice lines (full sentence -> short sentence -> fragments -> a single word) only serve memory text and the dev WHY HUD. Where is the line between a "useful presentation layer" and "bug-#13-style dead decoration"?

**Master Artisan:**
> "This is the trap I hate most. Let me repeat the hard-won lesson: **what is Bug #13?**
> Bug #13 is the function `calcOccupationBonus`, laboriously written, computing occupation stacking multipliers with exquisite care — but no line of code in the game ever bothered to read its return value! It lay dead there across so many phases, consuming resources while nobody knew.
> Now look at D3: the lead proposes writing a sentence-shredding algorithm across 4 intensity levels:
> - Low intensity: *'My belly feels a little empty. I should eat soon.'*
> - Extreme intensity: *'Bread. Bread. Bread.'*
> And where does that string get stored? In `v.memories[i].text`!
> I ask you straight: **is there any gameplay system, any bot, any utility logic that READS that 'Bread. Bread. Bread.' string to branch an action?**
> Not at all! 'Presentation must not drive behavior' — you yourselves just declared that boldly!
> So if behavior doesn't read it, and the in-game player has no screen to look at, and only devs open the `#pi-why` console to pat each other on the back for beautiful writing — then THAT IS THE TEXTBOOK DEFINITION OF DEAD DECORATION!
> Robin's quota is limited. Making him write a string-generator function, write regex tests checking whether the string got cut into exactly 3 pieces... for what? To worship?"

**The Epistemologist:**
> "Artisan, you're looking at cognition through the eyes of a scrap-metal lathe operator! You only see bytes and `if/else` branches; you don't understand what **semantic compression** is!
> Why do humans speak in fragments under extreme pressure?
> When adrenaline floods the cortex, Broca's language area is inhibited and complex syntax collapses completely. People can no longer assemble subjects, predicates, conjunctions. The fragmentation of language isn't a writer's word game — it's the **only physical evidence of cognitive collapse**!
> If your memory only stores a dry enum: `{ event: 'HUNGER', level: 0.9 }`, then when the AI brain in Phase 7/9 rereads memories, it will see the past as a soulless accounting ledger.
> But if memory records: *'Dark. Cold. Hungry. Bread. Bread.'*, then that fragmented structure itself already carries affective weight!
> HOWEVER, I agree with the Artisan on one lethal point for drawing the line against bug #13:
> **The line is this: does that fragmented text CARRY METADATA THAT FEEDS BACK INTO MEMORY?**
> If the fragmenting function only spits out a useless string, then yes, it's trash. But if the fragmented string comes with a rule: *'a memory with level-4 fragmented voice has 5× the retention (salience retention) of an intact-sentence memory, and resists fading (forgetting curve) for 30 days'* — then it instantly becomes a character-shaping engine! That is the line between living code and dead code!"

**The Ecologist:**
> "The Epistemologist just saved an obvious losing goal for D3, but I want to pull D3 out of the 'inner monologue' shell and turn it into a **living ecological entity**!
> Why lock the voice inside the villager's head and then argue about whether it's dead code?
> The Master Doc just approved **A2: Hearing with range and weather modifiers**!
> Human voice in nature is a form of acoustic signaling.
> - When mildly hungry (subtle), people mutter to themselves: base range = 2 meters. Only someone standing right beside them hears it.
> - But in extreme panic (overwhelming: *'Wolf! Wolf! Wolf!'*), that's a heart-tearing scream: base range = 40 meters!
> That scream pierces the night, crosses the 40m radius, and slams straight into the Selective Attention Gateway 1 of guards and neighbors, jolting them upright out of bed!
> **This is the strongest possible answer to the Artisan: voice intensity is NOT decoration if it directly determines Acoustic Amplitude in A2!**
> It drives behavior not by interfering with internal utility, but by emitting a physical impulse that changes the surrounding world. If we can do this, D3 is a shining ecological gem!"

**The Scholar:**
> "The Ecologist's idea is magnificent — turning screams into village-saving sound waves. But I must pull you back to a real pain in D3's current form:
> The lead decided to **completely cut the personality matrix (introvert/extrovert) and the life-stage matrix (child/elder)** out of D3!
> Do you understand the consequence of that pruning?
> With all personality and age cut away, this fragmenting algorithm is just a soulless stamping machine:
> - An 80-year-old elder, when hungry, also cries: *'Bread. Bread.'*
> - A 5-year-old child, when hungry, also cries: *'Bread. Bread.'*
> - The sullen blacksmith and the talkative songstress, when terrified, both spit out the exact same 3 vocabulary fragments!
> A language stripped of personhood, stripped of cultural roots — no matter how mathematically correct the fragmentation — still feels fake, mechanical, and creepy (uncanny valley).
> If we only keep 4 mechanical fragmentation levels without a hint of personality's flavor, we'd be better off keeping the plain memory templates than draping a stamped theatrical mask over the villagers' heads!"

---
### TOPIC 4: D4 — Functional-Core Dream: Is Consolidation + Morning Mood Enough?
*The question:* Is a dream reduced to its functional core (memory consolidation + next-morning mood effect: nightmare -> morning anxiety) enough? Does deferring nightmare -> trauma (psychological injury) while also deferring PTSD create an unrealistic black hole in villager psychology?

**The Scholar:**
> "I'll say it straight, no dodging: **this is the cruelest cut and creates the deepest human hole in the entire Adaptation document!**
> Picture this scenario:
> A young woman watches her father get mauled to pieces by a bear at the forest gate. By day she endures extreme panic (`suffering` = 1.0, `anxious` = 1.0). Night comes, and she sinks into sleep.
> Under the lead's D4 scenario: the system sees high daytime stress -> labels the dream `nightmare` -> the next morning she wakes with mild `anxious` (intensity 0.4).
> By noon, thanks to a potato and warm sunshine, C3's decay does its job: `anxious` drops below 0.01 and VANISHES COMPLETELY! By afternoon, the girl is cheerfully hauling water from the well, whistling like an amnesiac!
> You call that 'modeling real life'? That's an insult to human psychology!
> In real life, such a horrific event leaves recurring nightmares, forms a psychological scar (trauma), makes people fear the dark, fear growls, even collapse for months (PTSD).
> If you defer trauma, defer PTSD, and keep only a 'morning mood' that fades after a few hours, then your game's dreams are nothing more than a dice machine dispensing morning buffs/debuffs!"

**The Epistemologist:**
> "I fully share the Scholar's outrage at the machine's coldness, but I demand we examine the dream mechanism through cognitive science, not just compassion:
> What are dreams for?
> In neuroscience, REM and slow-wave sleep are not a cinema for the soul to enjoy theater. **Sleep is the only mechanism that converts Hot Short-term Memory (Episodic Buffer) into Long-term Identity (Autobiographical Identity & Semantic Beliefs)!**
> In Phase 6C we agreed on the rule: each villager has 3–5 `identity tags` crystallized from extreme-salience events (like nearly burning to death, saving the village, witnessing a loved one's death).
> So what crucible forges those daytime events into permanent identity? **Sleep and dreams themselves!**
> If D4 only does the trivial job of assigning a fleeting morning mood and stops there, without fulfilling the mission: *'if the night brings nightmares about wolves -> carve a belief scar (belief bias): wolves are eternal horror'*, then the cognitive chain is completely severed!
> Deferring clinical PTSD is right (we're not running a psychiatric hospital), but deferring the **cognitive scarring** mechanism too turns dreams into a headless, tailless system!"

**Master Artisan:**
> "You two scholars are back at it, demanding we turn a survival sim into a Dostoevsky psychoanalytic novel!
> Do you know why the lead and I firmly swept trauma and PTSD into Phase 7?
> **Because the village's current social and economic system HAS NO HEALING MECHANISM!**
> Think like a game balancer: if a girl carries permanent trauma, chronic panic, refuses to go to the fields, refuses to bake bread — who heals her? Does the village have a therapist yet? Is there a community-comfort mechanism, a shared-grief mechanism yet? No! The social Phase 6D hasn't even started!
> If you stuff in a mechanism of 'sinking deeper into despair with no way out', then after just 3 winters of blizzards and wolves, 80% of villagers will have PTSD, huddled crying in corners, and the whole economy will collapse in a pathological death spiral!
> What will players do then? They'll curse the game as buggy and delete it!
> D4's current functional core is: sleep to free memory (consolidation: compressing trivial memories, keeping important ones), restoring physical strength, and leaving a faint echo of morning mood.
> It's simple, it's self-contained, it's testable in 5 clean test cases, and most importantly: **it doesn't blow up the survival balance we just bled to achieve in Phase 4 and 6C!**"

**The Ecologist:**
> "The Artisan's fear of economic collapse is completely justified. A system with no way out destroys itself.
> But the Artisan's solution — turning dreams into something utterly inconsequential — is another wrong extreme.
> I propose a purely ecological escape route, without a single word of 'clinical mental illness', that still fills the Scholar's black hole:
> **That's the ASYMMETRY BETWEEN INJURY AND RECOVERY mechanism (Asymmetric Stress Residue)!**
> The physical body: a broken leg takes 7 days before you can walk again. Why should a mental wound sleep one night and wash clean as first snow?
> The ecological rule is extremely simple:
> - A nightmare needn't produce complex mental illness. A nightmare just needs to leave a **stress residue (= 15%)** that can't decay in a day or two.
> - If the second night brings another nightmare, the stress residue accumulates to 30%.
> - High stress residue reduces work performance (workFactor drops) and makes the villager more easily startled by strange sounds.
> - What is the healing path? Simple and natural: 3 consecutive peaceful days — eating well, sleeping warm by the hearth — and the stress residue dissolves on its own!
> With just one variable, `stressResidue`, accumulating and conditionally dissolving, we get the Scholar's tragic depth, keep my energy conservation, and the Artisan spends exactly 10 lines of code to implement it. Why not?"

---

### TOPIC 5: Cross-Cutting — Test Burden vs Robin's Limited Quota: What Gets Cut First? What Does a Minimal Phase 6E Mean?
*The question:* With Robin's finite execution capacity and quota, plus the strict Examiner Tier-3 review, if quota runs dry midway through Phase 6E (A1, A2, A3, A5, D1, D2, D3, D4), what gets beheaded first? What is the SMALLEST yet STILL MEANINGFUL version of 6E?

**Master Artisan:**
> "This is the moment we face the starkest truth: **Robin is a junior dev, tokens are limited, prompt counts are limited, and Examiner Tier-3 is a beast ready to maul any PR lacking a deterministic test suite!**
> Look at the Phase 6E list the lead proposed:
> A1 (Feeling-scape composition pipeline + 40 vocabulary words), A2 (Hearing/Smell range + weather modifiers), A3 (canonical event->signal table), A5 (AIContext/Response contract), D1 (Option 1 accumulators + substrate interface), D2 (Organ vocabulary), D3 (Intensity voice), D4 (Dream functional core).
> EIGHT ITEMS! This isn't a thin phase — it's a collective suicide by quota overload!
> If Robin plows headfirst into all 8, I guarantee he'll collapse midway: half-written code, untested tests, a shattered bundle, and a whole wasted week!
> If quota gets squeezed, I order the MERCILESS BEHEADING of the following:
> 1. **BEHEAD D3 (Intensity voice):** As I've proven, it's pure presentation. Without fragmented dialogue lines, villagers still live, the game still runs perfectly.
> 2. **BEHEAD D4 (Dream):** 6C's basic sleep-restores-fatigue is running very smoothly. Don't tangle with dreams before the senses are done.
> 3. **BEHEAD A5 (AIContext contract):** Keep it on paper as a direction doc; not a single line of code for A5 in this phase.
> **SO WHAT IS MY MINIMAL 6E?**
> Exactly 3 things: **A3 (normalize the event -> signal table) + D1 (3 decaying hunger/fear/pain accumulators spliced into C3) + A2 basic Hearing (drop Smell)**!
> Why? Because A3 cleans up the tech debt of scattered updates; D1 gives emotions a process; and A2 gives 6A's attention sound to hear. Exactly 3 modules, tightly tested, 100% passing the Examiner!"

**The Ecologist:**
> "The Artisan beheads with gusto, but his blade just severed Phase 6E's heart!
> He demands keeping A2 (Hearing) but throws away A1 (Feeling-scape)?
> Ask yourself: if the world emits wolf growls, thunderclaps, people's cries, traveling through A2 into villager ears... but inside the villager there is NO A1 to gather those sensations into a whole picture (scape) determining what is dominant and what is secondary — then where do those sounds fall? Into the void!
> Drop A1 and villagers regress to the stone age: each sense triggering its own isolated flag, trampling over each other!
> But I agree with the Artisan on beheading the superfluous.
> My cut proposal:
> 1. **CUT SMELL in A2:** Right now the game has no detailed reversing-wind system, no real smoke propagation. Keeping smell now is just drawing more meaningless range constants. Keep Hearing only!
> 2. **CUT D4 (Dream narrative):** Agreed to defer dreams.
> **THE ECOLOGIST'S MINIMAL 6E:**
> It must be a three-legged tripod: **A3 (signal conservation) -> A2 (physical sound propagation) -> A1 (feeling-scape sensation merging)**.
> Missing any one of these 3 legs, the sensory ecosystem is crippled goods!"

**The Epistemologist:**
> "You both have a point, but you haven't seen the hidden quota-devouring tumor: **it's the number '40 Qualities' in A1 and D2!**
> 40 feeling words: burning, numbness, emptiness, choking, tingling...
> To get the Examiner to approve these 40 words, how many mapping test cases must Robin write? He must guarantee no two words overlap, check determinism for each quality... That's a black hole swallowing the quota!
> Meanwhile, at this point, do we even have an AI brain refined enough to distinguish 'tingling' from 'stabbing pain'?
> My epistemological scissors:
> **TRIM A1 AND D2 DOWN TO EXACTLY 12 CORE QUALITIES (Core Qualities Set)!**
> - Body (4): `hollow` (hunger), `parched` (thirst), `heavy` (fatigue), `burning` (pain/fever).
> - Emotion (4): `anxious` (worry), `terrified` (fear), `enraged` (anger), `content` (peace).
> - Social/Cognitive (4): `lonely` (loneliness), `revered` (pride), `confused` (bewilderment), `vigilant` (vigilance).
> Exactly 12 words! Enough to cover 95% of the village's survival and psychological states. The Examiner tests them as lightly as feathers!
> And I back the Artisan: **completely cut D3 (Voice lines)**. Let these 12 qualities display starkly on the WHY HUD. Devs seeing `Dominant: hollow | Secondary: terrified, heavy` will be moved to tears compared to reading `satiety: 0.18, fear: 0.8`! No need for sentence-crafting when quota is on fire!"

**The Scholar:**
> "I'm the one who most ardently loves dreams and the human voice, but before the project's survival and young Robin's quota, I bow and concede:
> I agree to defer D3 (Voice lines) and defer D4 (the full Dream). Better a sturdy single-story house than a half-built cardboard castle swept away by the Examiner storm!
> However, I set **TWO NON-NEGOTIABLE CONDITIONS TO PROTECT THE PROJECT'S SOUL** for the Smallest 6E:
> 1. **Condition 1: the WHY HUD must purge float numbers!** At all costs, after Phase 6E, the `#pi-why` debug interface must no longer display soulless numbers. It must print feeling qualities as words (even just the Epistemologist's trimmed 12 qualities). That is the honor-bound commitment to Master Doc Principle 2: understand characters through feelings and behavior, not by peeking at data tables.
> 2. **Condition 2: keep an overnight emotional residue seed!** Even without building the D4 dream system, when a villager wakes, the sleep function must not wipe everything back to an ideal state. It must keep at least a stress-residue coefficient if the previous day brought bereavement or fire. Don't turn sleep into a memory-wiping blade!"

---
## PART II: CONSENSUS

After 5 fiery rounds of debate, the 4 personas agreed on the following foundational principles:

1. **Strict adherence to Principle A4 (Layering Discipline):**
   - The AI Brain lives only on Layer 3 (feeling-quality cognition), never reading biological numbers directly.
   - Decision systems (utility/action) must gradually switch to reading `FeelingScape` instead of poking straight into `v.body`.
2. **Drop the 9-discrete-organ simulation (D2 locked = Vocabulary-only):**
   - No building 9 independent state machines. Zero new state may be created just to serve organ names.
   - All body-feeling vocabulary must be inferred directly from existing `body fields` combined with the `conditions` array (wounds, illnesses).
3. **Purge Bug-#13-style dead-code risk at D3:**
   - Firm decision: **DEFER D3 (intensity-fragmenting voice lines)** out of Phase 6E's implementation scope.
   - Reason: currently no consumer (AI brain or gameplay mechanics) reads these dialogue strings to branch decisions. Building now is 100% the bug #13 dead-decoration trap.
4. **Protect test capacity and the quota budget (Quota Defense):**
   - Phase 6E may not swallow all 8 items (A1, A2, A3, A5, D1, D2, D3, D4).
   - The vocabulary must shrink from 40 qualities to a **trimmed set of ~12–16 core qualities** so Examiner Tier-3 can test comprehensively, reaching absolute determinism without draining Robin's quota.

---

## PART III: OPEN DISAGREEMENTS

Deep design-philosophy conflicts that couldn't be reconciled internally, requiring leadership arbitration:

```
+---------------------------------------------------------------------------------------------+
| 3 CORE BOTTLENECKS OF DISAGREEMENT                                                          |
+---------------------------------------------------------------------------------------------+
| 1. D1'S NATURE: One-Way Linear Accumulators vs a Substrate with Closed-Loop Feedback        |
|    - Artisan / Lead: 3 simple accumulators (hunger->stress), no feedback, cheap, easy test. |
|    - Ecologist: missing two-way feedback is biological fakery; breaks in Phase 7.           |
+---------------------------------------------------------------------------------------------+
| 2. SMALLEST 6E SCOPE: The Battle between A1 (Scape) and A2 (Senses)                         |
|    - Artisan camp: keep A3 + D1 + A2 (Hearing). Cut A1 as too heavy.                        |
|    - Epistemologist & Ecologist camp: A1 (Core Scape) is mandatory, cut Smell from A2.      |
|      Without A1 the whole "AI lives on Layer 3" philosophy collapses.                       |
+---------------------------------------------------------------------------------------------+
| 3. HANDLING THE D4 GAP: Cut Dreams Entirely vs Keep Overnight Emotional Residue             |
|    - Artisan: cut D4 entirely; sleep only restores fatigue as in 6C to protect 6D economy.  |
|    - Scholar & Ecologist: cutting everything turns villagers into soulless robots; a single |
|      asymmetric overnight `stressResidue` (10-15%) variable must be kept.                   |
+---------------------------------------------------------------------------------------------+
```

---

## PART IV: DECISION QUESTIONS FOR THE EXECUTIVE PRODUCER / LEAD

So that Robin can start detailed implementation planning without guessing, we respectfully request EP and the Lead to answer these 3 questions decisively:

### Question 1 (On D1 & the Interface Contract):
> **In what spirit does EP approve Option 1?**
> - **Option 1A (Maximum pragmatism):** Implement only the 3 concrete accumulators (`hunger->stress`, `fear->fatigue`, `pain->patience`) running directly in C3. **No separate `FeelingSubstrate` class/interface** at this time, to avoid premature-abstraction overhead (YAGNI, anti-architecture-fraud).
> - **Option 1B (Strict architectural preparation):** Build the standalone `FeelingSubstrate` interface right now; C3 and the WHY HUD must call through this interface. Accept the cost of writing adapters/test mocks to secure the path to Phase 7.

### Question 2 (On the Smallest Phase 6E Scope):
> **If Robin's quota is strictly limited, which scope package does EP choose for Phase 6E?**
> - **Package Alpha (Signal infrastructure & physical senses):** `A3` (signal table) + `D1` (Option 1) + `A2` (basic Hearing). *Defer A1, D2, D3, D4 to Phase 7.*
> - **Package Beta (Complete feeling loop — the Council's recommendation):** `A3` (signal table) + `D1` (Option 1) + `A1/D2` (Core Feeling-scape trimmed to exactly 12 qualities) + `A2` (basic Hearing, drop Smell). *Defer D3 (Voice) and D4 (Dream narrative).*

### Question 3 (On Sleep Handling & the D4 Gap):
> **In Phase 6E, how do we treat sleep?**
> - **Option 3A (Full cut, per the Artisan):** Keep 6C's sleep logic as-is (only lowers fatigue/adenosine). No morning mood, no stress residue, no touching sleep until Phase 7.
> - **Option 3B (Minimal biological core, per the Scholar & Ecologist):** No dream narrative yet, but add exactly **1 residue-accumulation mechanism (`stressResidue`)**: if the previous day had extreme stress/suffering, sleep restores only 80% of physical condition, leaving a light anxiety residue the next morning; this residue needs 2–3 consecutive peaceful days to fully dissolve.

---
*Minutes concluded. Recorder: Robin — Junior Developer.*
