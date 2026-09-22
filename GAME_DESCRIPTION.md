# WILLOWBROOK NATURA — Game Description
_A game-content description document. No technical discussion. Updated 2026-09-15._

---

## 1. What This Game Is

**Willowbrook Natura** is a **medieval village life simulation** game, where you don't control a protagonist — you **witness and guide an entire community** of 11 villagers living, working, loving, quarreling, falling ill, aging, and dying.

The core differentiator: every villager has a **truly living body**. They hunger, thirst, tire, freeze, suffer heatstroke, drown, bleed, get infected, break bones, fall ill — and all of it follows biological rules, not abstract health bars. An unbandaged wound can become infected. A winter night without warm clothes can kill. A newborn needs to be fed, kept warm, and protected.

This is a **slow, warm, and cruel** game — warm because you will grow attached to every person, cruel because the world shows no mercy: wolves at night, lightning strikes, wildfires, brutal winters.

---

## 2. Vision & Core Emotions

- **"A real village"**: every villager has a name, profession, personality, skills, relationships, and private memories. They aren't NPCs standing around waiting for you to talk to them — they live even when you're not watching.
- **"Real consequences"**: every decision has a price. Hunting at night can get you mauled by wolves. Starve the chickens and the chickens leave. Fight and you break a nose. Wrongs can go to the customary court (witness testimony, restitution, exile — and wrongful convictions breed grudges), and craftsmen organize into guilds with apprenticeships. The world autosaves and reloads deterministically (save/load is a real feature); what villagers can't do is rewind — their consequences persist.
- **"Everyday beauty"**: the joy of the game lives in small moments — Wren gathering herbs to brew tea for the sick, Finn landing a big catch, the village's first child being born, everyone rushing in to douse the fire and save the granary.
- **"Genuinely medieval"**: no magic, no modern technology. Every solution is one the ancients would use: herbal poultices, wooden splints for broken bones, salt-cured meat, fire for warmth, wooden fences against wolves.

---

## 3. The Village of Willowbrook

The village sits in a valley, ringed by forest, with a lake, farmland, and the trail that traveling caravans pass through each season.

**Areas within the village:**
- **Houses** — places to sleep, shelter from cold, shelter from wolves, recover from illness. Houses have durability; damaged by storms/fire/wolves, they must be repaired.
- **Fields** — seasonal farming, 4 growth stages (sowing → sprouting → growing → harvest).
- **Livestock pens** — holding tamed chickens and pigs; fenced against wolves.
- **Granary / stockpile** — storage for food, wood, stone, materials.
- **Well & lake** — drinking water, firefighting water, fishing spot.
- **Campfire / kitchen** — cooking, warmth, smoking meat, night light that drives off wolves.
- **Sella's shop** — the village store.
- **Open ground at the village center** — where caravans pitch camp, where villagers gather, quarrel, and make up.

**Time:** alternating day/night, 4 seasons. Seasons affect everything: winter is bone-chillingly cold, fields can't be planted, hungry wolves grow bolder; summer heat can cause heatstroke, meat spoils 1.5x faster.

**Weather:** sun, rain, storms, lightning. Lightning can strike people or houses and start fires. Rain puts out fires but soaks clothing (reduces warmth retention by 60% — clothing keeps only 40% of its insulation when wetness > 0.4).

---

## 4. The World: What's In It and How It Works

Beyond the village, a whole vast valley operates by its own rules — with no one steering it.

### 4.1. What's In the World

**Terrain:**
- **Forest** ringing the village — many tree types: large timber trees, shrubs, seasonal wild fruit trees. The forest is the source of wood, herbs, wild berries — but also where wolves lurk.
- **Meadows** — wild grass, flowers, rabbits, wild chickens foraging.
- **Lake** — fish, drinking water, firefighting water. Fish bite by the hour (early morning and late afternoon are best) and by the weather.
- **Rocky hills** — exposed stone quarry for breaking stone to build houses.
- **The trail** — cutting across the valley, traveling caravans pass through each season.
- **Village grounds** — the central area: houses, fields, well, campfire, where caravans pitch camp.

**Plants:**
- Timber trees (can be felled, regrow slowly — clear-cut and you wait many seasons)
- Berry bushes (seasonal wild berries, edible when picked)
- Herbs (Wren gathers them for medicine — scattered sparsely through the forest; pick them clean and you wait for regrowth)
- Wild grass, meadow flowers
- Field crops (planted by villagers, 4 growth stages)

**Wild animals:**
- **Wild chickens** — wandering and foraging, laying eggs (eggs are edible, and can be hatched if there's a brooding hen)
- **Rabbits** — timid, fast, huntable for small meat
- **Wild boars** — leave them alone and they leave you alone; approach and they charge; piglets can be tamed
- **Wolves** — travel in packs, hunt at night; by day they hide in the deep forest
- **Bears** — very rare, living at the far forest edge, drawn by the smell of food
- **Fish** — in the lake, limited numbers by season
- **Birds** — herald the morning, flee before storms (villagers of old read the birds to guess the weather)

**Renewable & depletable resources:**
- Wood, herbs, wild berries: harvested bare and they **regrow slowly** — reckless exploitation is slow suicide.
- Stone: break the nearby quarry bare and you must go farther.
- Fish: fish the lake out and you wait for a new school.
- Well water: a long drought dries it up — then you must haul water from the lake.

### 4.2. How the World Works — the Cycles

**Day/night cycle:**
- Morning: birds sing, roosters crow, villagers wake, mist lifts.
- Midday: the summer sun can cause heatstroke if you work the fields without rest.
- Evening: fish bite hard, forest animals start moving.
- Night: pitch dark (only campfire glow and house lamps), villagers sleep, **wolves go hunting**. Fire and light drive wolves away — any night the fires go out is a dangerous night.

**Four seasons:**
- **Spring:** warming, planting, young herbs sprouting, animals breeding. The season of hope and work.
- **Summer:** hot, midday work risks heatstroke, meat and fish spoil 1.5x faster, frequent showers + thunderstorms (wildfire risk).
- **Autumn:** peak harvest, caravans come to buy produce, stockpiling for winter. Leaves fall, nights grow colder.
- **Winter:** snow/bone-chilling cold, fields dead, lake frozen (no fishing), hungry wolves **boldly** prowling right into the village. Surviving winter = living off what was stockpiled since autumn: salt-cured meat, dry firewood, warm clothes, sturdy houses.

**Weather cycle:**
- Sun → Clouds → Rain → Storm → Lightning — unfolding naturally, partly predictable (watch the sky, listen for distant thunder).
- Rain: puts out fires, fills the well, but soaks clothing (loses 60% warmth retention) and turns roads muddy (slower travel).
- Storms: topple weak trees, rip roofs off shaky houses.
- Lightning: strikes trees/houses → fire; strikes people → serious injury or death. After a lightning storm, the whole village must check for fires.

**Fire cycle:**
- Fire needs 3 things: fuel (dry trees, wooden houses, straw), dryness, wind. Dry summer + strong wind = wildfire spreading like a demon.
- Fire spreads tree to tree, to houses, to fields. Smoke drifts with the wind — breathe too much and you suffocate.
- Heavy rain can put out small fires; big fires can only be stopped by felling trees to cut firebreaks or by all-out dousing.
- Burned land turns to ash — saplings regrow the next spring. Nature heals itself, given time.

**Animal ecology cycle:**
- Animals eat, sleep, and breed by season. Chickens lay eggs → eggs hatch (if incubated) → chicks grow.
- Hungry wolves grow bold — in winter, food is scarce and wolves prowl into the village more often.
- Bears follow **scent**: piles of rotting meat, animal carcasses unburied near the village invite bears in.
- Overhunt → game grows scarce → you must go farther or switch to husbandry. That is why animal husbandry was born.

**Water cycle:**
- Rain → streams flow → lake fills → well fills. Long drought → well dries → haul water from the distant lake.
- Water is used for: drinking, cooking, watering fields (dry season), firefighting.

**Human traces left on the world:**
- Felled trees → stumps, then saplings regrow.
- Burned houses → rubble piles (can be cleared and rebuilt).
- Graves — the dead are buried on the hill behind the village; graves last forever, and villagers visit now and then.
- Paths villagers walk often → grass wears into trails.
- Places where wolves once struck → villagers **remember** and avoid walking alone at night (danger memories).

### 4.3. Caravans and the Outside World

The valley is not the whole world — the trail connects the village to distant lands:
- **Each season**, a caravan of 3 (1 merchant + 2 guards) passes through, camping at the village center for half a day, then moving on.
- They bring what the village can't make itself: **salt** (curing meat), **cloth** (sewing warm clothes), **spices**, good **iron tools**.
- They buy: animal hides, smoked meat, eggs, surplus produce.
- The caravan's guards terrify wolves — the days the caravan stays are rare peaceful nights.
- Villagers hear the merchant's tales of faraway lands — their only window onto the wider world. (Later, the AI brain could have merchants tell real stories.)

---

## 5. The Eleven Villagers

Each person has their own **profession, strong/weak skills, personality** — no one is replaceable:

| Name | Role | Strengths |
|---|---|---|
| Marta | Farmer | Farming, strong and healthy |
| Bram | Blacksmith/builder | Building, repairs, strong |
| Sella | Shopkeeper | Trading, calculation |
| Tobin | Innkeeper | Cooking (lavish meals) |
| Wren | Healer | Medicine, herb gathering |
| Finn | Fisherman | Fishing, swimming |
| Alden | Village head | Communication, mediation |
| Pip | Child | Learns fast, runs fast |
| Rowan | Traveling bard | Singing, poetry, wandering |
| Clara | Silk merchant | Trading, communication |
| Gareth | Wandering knight | Swordsmanship, hunting, bravery |

*(Each person's personality details will be developed further by the AI brain later — for now everyone has clear skill aptitudes and roles.)*

**A villager's life cycle:** birth → childhood (needs feeding, protection, grows over time, rendered at correct child proportions) → adulthood (work, love, children) → old age → death (age, illness, accident, wild beasts, starvation...). Corpses decompose over time and are buried with a headstone — the living come to visit and mourn.

---

## 6. The Living Body — the Survival System

This is the heart of the game. Each villager has a truly simulated body:

- **Hunger:** must eat regularly. Long hunger → exhaustion → starvation.
- **Thirst:** must drink water. Dehydration → dizziness → death.
- **Fatigue:** must sleep/rest. Too long awake → collapse unconscious.
- **Body temperature:** cold → shivering → frostbite → freezing to death; heat → heatstroke → heat shock. Clothing, fire, shelter, and weather all matter.
- **Oxygen:** drowning, smoke inhalation.
- **Blood:** bleeding is real blood loss — lose too much and you die. Wounds must be bandaged.
- **Illness:** colds/fevers (wet + cold for too long), food poisoning, raw meat upsets the stomach, wound infections.

**Survival instinct:** when any need hits a danger threshold, villagers **automatically drop what they're doing** to save themselves — fleeing wolves, finding water, going inside to warm up. You don't need to (and can't) micromanage their every breath.

---

## 7. Medieval Medicine

No hospitals, no antibiotics. Instead:

- **Wren the healer** — goes into the forest to gather herbs and brew remedies.
- **Herbal poultices** — stop bleeding, fight infection.
- **Wooden splints + cloth** — set broken bones. A broken leg means crawling only; a broken arm means no tools; full healing requires **splint + enough food + many days of rest**.
- **Fever tea** — cures colds/fevers, needs warm rest.
- **Infection** — open wounds left unbandaged become infected, run high fevers, and can kill.
- **Tending (tend)** — someone with medical skill bandages, administers medicine, quality depending on skill.
- **Rescue (rescue)** — the injured (unconscious, bleeding, broken leg) are carried to bed; kin/friends automatically go rescue when it's safe.

Players must ensure the village always has a herb reserve, someone who can bandage, and sickbeds — because accidents come at any time.

---

## 8. Labor & Skills

**8 skill groups**, each rated 0–10, leveled by **doing real work**:
- Farming, cooking, building, medicine, hunting, fishing, foraging, tailoring.
- Everyone has **aptitudes** (learn fast) matching their profession and **weaknesses** (learn slow).
- High skill → work faster, bigger harvests, tastier food, sturdier houses, better bandaging.

**Village jobs:** tilling fields, sowing, harvesting, felling timber, breaking stone, fishing, hunting, foraging, cooking, curing meat, sewing, building/repairing houses, making fences, tending livestock, hauling water, firefighting, trading, nursing the sick, teaching children (future).

**Assignment:** the player (and later the AI) can assign long-term work by priority to each person — whoever's best at a job does it, but everyone must know basic work to survive.

---

## 9. Food

- **3 meal tiers:** poor / fine / lavish — depending on the cook's skill + ingredient variety. Good food sates longer; poor food only sates briefly.
- **Food poisoning:** spoiled food, sloppy cooking (low skill), raw meat → vomiting, stomach pain, illness.
- **Raw meat causes illness** — it must be cooked through.
- **Food spoils over time**, spoiling 1.5x faster in hot weather.
- **Preservation:** salt-curing, smoking by the kitchen fire — meat keeps for dozens of days, the key to surviving winter.
- **Food sources:** fields (seasonal), fishing, hunting, foraging, chicken eggs, buying from Sella's shop, trading with the caravan.

Players must plan: what to plant, how much to save for winter, who cooks best.

---

## 10. Society — Love & Hate

Villagers aren't work robots — they have social lives:

- **Friendship:** talking, working together, surviving hardship together → growing closer over time.
- **Love & family:** close couples can wed, pregnancy (~20 days), childbirth, raising children.
- **Insults & hostility:** everyone clashes sometimes — crossing someone they hate, competing for food... Insults crack relationships; accumulated grudges become **hostility**: refusing to save each other, refusing to bandage each other.
- **Fighting:** bare-handed brawls — bruises, broken noses, knocked out cold — but **never beating each other to death**. Outsiders intervene. A sincere apology can mend things; grudges also fade with time.
- **Memory:** everyone remembers what they witness — who saved them, who hit them, which places are dangerous (get mauled by a wolf once and you remember for life).

---

## 11. Economy

- **Personal gold** — whoever earns it keeps it.
- **Sella's shop** — daily buying and selling of food and materials within the village.
- **Traveling caravan** — each season a merchant party from far away stops by, camping at the village center for half a day: selling **spices, cloth, tools, salt** (things the village can't make itself), buying **animal hides, smoked meat, eggs**. Prices differ from Sella's shop — bargain well and you profit.
- Players must decide: what to sell, what to buy, what to save. The salt bought from the caravan is what cures meat through winter.

---

## 12. Wild Beasts & Husbandry

**Dangerous beasts** — the world holds more than villagers:
- **Wolves:** travel in packs, hunt at night, stalk lone walkers and chickens. Fear fire, fear crowds. Hungry enough and they'll brave the village itself.
- **Wild boars:** leave them alone and they leave you alone; approach and they charge.
- **Bears:** rarely met, but meeting one is disaster — drawn by the smell of food.

Villagers know fear: seeing wolves they run indoors, cornered they fight back with tools, shouting for others to come save them.

**Husbandry** — turning wild beasts into assets:
- Tame **chickens** and **piglets** with food (adult pigs can't be tamed).
- Pen them in fenced enclosures (wolves can't get in), feed regularly → chickens lay more eggs, pigs farrow litters.
- Starve them → they sicken → go wild again. Raising animals is a responsibility, not decoration.
- Hunting → meat + hides (hides for sewing clothes, selling to the caravan).

---

## 13. Building & Clothing

**Building:**
- Every structure costs **real materials**: wood (felled trees), stone (broken stone), straw.
- Skilled builders work fast, houses sturdy; novices work slow, prone to shoddy work.
- Can build: houses, anti-wolf fences, livestock pens, repairing damaged houses.
- Houses have **durability** — storms, fire, wolves break them down over time; they must be repaired.

**Clothing:**
- Multiple layers: underclothes, jackets, boots, winter cloaks.
- One purpose, and it's vital: **warmth**. Winter without warm clothes means freezing to death.
- Clothes **wet lose 60% of warmth retention** (only 40% insulation left when wetness > 0.4 — code: `clothingInsul` in `14a_medical.js`; after rain, wading, or firefighting, change/hang to dry).
- Worn long they **tear** → must be mended (`mend`) or sewn new (needs cloth bought from the caravan or hides from hunting).

---

## 14. Disaster & Fire

- **Lightning:** strikes people (injured/severely), strikes houses/trees → fire.
- **Wildfire:** spreads with the wind, burns fiercely in dry weather. Fire threatens houses, fields, lives.
- **Firefighting:** villagers no longer just run — the able-bodied fetch water from well/lake to douse it themselves, prioritizing **save houses → save people → save fields**, abandoning fires far in the forest. Firefighters get soaked, breathe too much smoke and they suffocate.
- **Storms:** wreck weak houses, topple trees.
- **Winter:** the greatest enemy — cold, hunger, bold wolves. Surviving the first winter is a real achievement.

---

## 15. What the Player Does in the Game

You are the **village's guide**, not a character:

- **Observe:** watch villagers live, click each one to see body status, skills, relationships, memories.
- **Direct orders:** tell someone to go somewhere, do something, say something — by clicking or typing an intent ("go fell timber for winter", "cook a lavish meal", "go rescue Bram").
- **Work assignment:** assign long-term work matching each person's aptitudes.
- **Decisions:** what to plant, what to build, what to sell to the caravan, how much food to save for winter, whether to tame that piglet.
- **Emergency intervention:** house fire, wolves in the village, injured people — you send people to rescue, douse fires, fight wolves.

**Win/lose:** the game is a sandbox — there's no "YOU WIN" screen. Losing is when the village withers: no people left, no food in midwinter. Winning is yours to define: survive 10 winters? Build a thriving village? Raise the second generation?

---

## 16. Game Features (Summary)

**Already have:**
1. Full body simulation (hunger/thirst/fatigue/temperature/oxygen/blood/illness) + death + corpse decay + burial
2. Automatic survival instinct (survivalGuard)
3. Honest perception (villagers only know what their senses deliver)
4. Multi-step action system (16+ verbs) + plain-language orders (intent)
5. Two-sided society: befriend/love/have children + insult/hostility/fight/make up
6. Memory (witnessed events, danger lessons, "dreams" — things wanted that the game can't do yet)
7. Medieval medicine: detailed wounds, bandaging, bone splints, herbal remedies, rescue
8. 8 skill groups + XP + aptitudes + work assignment
9. Building costs real materials + durability + repairs
10. Multi-layer clothing + warmth + wet/torn + sewing/mending
11. 3-tier food + poisoning + spoilage + salt-cure/smoking
12. Husbandry: taming, pens, feeding, breeding
13. Economy: personal gold, Sella's shop, seasonal caravan
14. Wild beasts: wolves/boars/bears + hunting for meat and hides
15. Disasters: lightning, wildfire, storms + villagers dousing fires themselves
16. Children: born, grow up, rendered at correct proportions
17. Event feed + Pawn Inspector (per-villager detail panel)

**Still to add (saved in backlog, to consider later):**
1. Brewing beer/wine
2. Wooden prosthetic limbs, deeper medicine (amputation)
3. Bows, spears, swords + leather/iron armor
4. Room concept: indoor temperature, beautiful/ugly rooms
5. Animal training (guarding, hauling)
6. Stockpiles: zones, stockpiles, batch production orders
7. Per-tile soil fertility
8. World map: the village's own trading caravans, multiple factions, diplomacy
9. Storyteller modulating drama (RimWorld-style)
10. Starting scenarios / win-lose conditions

**For the future AI brain:**
- Thought/mood (moods, thoughts, mental crises)
- Human-vs-human combat, prisoners
- Dialogue content, complex social events
- (Bridge API ready: perception, action, intent, dreams, events...)

---

## 17. A Day in the Village (Example)

*An autumn morning.* Marta heads to the fields to harvest wheat. Bram fells timber to repair the storm-torn roof. Wren goes into the forest for herbs — the medicine stock is running low. Finn fishes at the lake. Pip chases the chickens. Sella opens the shop. Tobin cooks lunch.

*Afternoon.* Dark clouds roll in. Lightning strikes the ancient tree at the forest's edge — **fire**. The villagers drop their work, fetch water from the well, and run to douse it. Alden shouts orders. The fire is out before it reaches the granary, but Bram's hand is burned — Wren bandages it with a poultice.

*Evening.* The whole village eats the lavish meal Tobin cooked. Marta tells of the wolf prowling outside the fence last night. Night falls, the pack returns — but seeing the campfire and hearing voices, they slink away.

*That is Willowbrook Natura: no dragons, no magic — only people, and survival itself is a story.*

## 18. Assessment: How Close to the Real World Is the Game, in Percent

_An honest assessment, by facet of life. The scale = how close to real life, not "good or bad"._

### Score by Facet

| Life facet | Score | Notes |
|---|---|---|
| Body biology (hunger/thirst/fatigue/temperature/oxygen/blood) | **85%** | Very close. Missing: chronic illness, permanent disability, childbirth complications |
| Medieval medicine | **70%** | Herbs, bone splints, bandaging. Missing: amputation, wooden prosthetics, difficult childbirth, quarantine |
| Labor & skills | **75%** | 8 skills, XP, aptitudes. Missing: apprenticeship, tool tiers, disability affecting work |
| Agriculture | **70%** | Seasonal planting, 4 stages. Missing: soil fertility, crop rotation, manure, pests, seed saving |
| Husbandry | **60%** | Taming, pens, breeding. Missing: milking, sheep shearing, livestock epidemics |
| Society (love/hate/family) | **65%** | Mechanisms sufficient. Missing depth: weddings, funerals, inheritance, jealousy, rumors |
| Economy | **60%** | Gold, shop, caravan. Missing: lord's taxes, debts, fluctuating prices, barter |
| Weather & disasters | **80%** | Rain/storms/lightning/wildfire/winter. Missing: floods, droughts, hail, fog |
| World ecology | **65%** | Renewable resources, animal AI. Missing: full food chain, seasonal migration |
| Building | **70%** | Real materials, durability, repairs. Missing: foundations/roofs, house insulation, dug wells |
| Clothing | **70%** | Layers, warmth, wet/torn. Missing: dyeing, sizes, status factors |
| Government & laws | **15%** | Almost nothing: Alden is village head but there are no laws, punishments, village meetings, taxes |
| Religion & beliefs | **5%** | Nothing yet: no chapel, seasonal rites, harvest festivals, funerals, omens — yet medieval life revolved around this |
| Culture & entertainment | **20%** | Nothing yet: no music, dance, fireside storytelling, festivals, games |
| Education & apprenticeship | **15%** | Children grow but no one teaches — skills come only from doing |
| Old age | **40%** | Aging/death exist but no gradual decline, no elder care |

**Overall score: roughly 60–65%.**

Read carefully and a pattern emerges: **what belongs to "body and matter" the game already mirrors closely (70–85%)** — hunger, cold, illness, fire, wolves, harvests. **What belongs to "people with each other" at community level is still thin (5–20%)** — laws, religion, festivals, teaching, governance. That is precisely what makes "a real medieval society", not just "a group of people surviving".

### What's Still Missing — Concrete List

**A. Society & community (the biggest gap):**
1. **Laws & punishment** — what happens to thieves? Who judges fights? Village meetings, voting.
2. **Taxes & feudal obligations** — every medieval village had a lord collecting grain taxes. Without it, a major survival pressure is missing.
3. **Folk religion** — small chapel, seasonal rites, harvest thanksgiving, ritual funerals, omens (birds, clouds...). No complex ideology system needed, just everyday spiritual life.
4. **Festivals** — spring festival, harvest festival: feasting, dancing, young people meeting (this is also where love blooms, not just "bond rising when working together").
5. **Weddings & funerals** — rituals marking life's turning points, the whole village attending.
6. **Inheritance** — when parents die, who gets the house/gold? Inheritance disputes were real drama in the old days.
7. **Rumors & reputation** — who stole, who bravely saved someone — the whole village knows and remembers, affecting how people are treated.
8. **Teaching** — adults teaching children: trades, letters (if any), ways of life. Children learn fast with a teacher.

**B. Deeper survival:**
9. **Permanent disability** — blind in one eye, lame leg, scars — lasting a lifetime, affecting work and how others see you.
10. **Epidemics** — disease spreading through the village (rashes, mild plague...), patients must be quarantined, Wren becomes a matter of life and death.
11. **Old age** — gradual decline (slower work, frequent illness), cared for by children and grandchildren — or neglected (drama).
12. **Childbirth complications** — difficult labor can take mother or child (commonplace in the old days; the game currently has 100% safe births).
13. **More disasters** — floods (days of rain), droughts (dry wells, dead fields), hail (ruined crops), fog (wolves creep closer).

**C. Deeper economy & crafts:**
14. **Milking & cheese-making** — cows/goats for milk (husbandry currently has no cows/goats/sheep).
15. **Sheep & wool** — shearing, weaving (reducing dependence on buying cloth from the caravan).
16. **Manure & crop rotation** — closed-loop farming: raising animals → manure → fertile fields.
17. **Specialist craftsmen** — blacksmiths making tiered tools (a dull hoe vs a sharp hoe really differ), carpenters, stonemasons.
18. **Fluctuating prices** — bad harvests raise food prices, caravans squeeze prices.

**D. A more living world:**
19. **Food chain** — wolves eating rabbits, bears eating fish, birds eating worms — not just animals "interacting with villagers".
20. **Seasonal migration** — flocks coming and going, herds moving ranges.

### Where These Gaps Fall
- **Doable now, no AI needed:** most of items A, B, C, D (1–20) — all simulation mechanics.
- **Already in backlog:** brewing beer/wine (culture), wooden prosthetics (disability), weapons/armor, world map, storyteller.
- **For the AI brain:** the emotional depth of rituals (prayers, songs, vows) — build the festival mechanics first, let AI write the content later. Thought/mood remains AI's domain.
