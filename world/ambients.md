# Ambient Cast — 20 NPCs (world v0)

Thin AI: schedules + reflexes, **zero LLM calls while ambient** (design §2).
Pure crowd — they make the block feel lived-in, absorb player requests as
co-stars when summoned, and are **promotable** to full characters later.
AI-only by default; ambient possession stays off (design §9 open decision 2).

Names/roles below match `willowbrook/dev/pa-chars.js` NV_CAST A01–A20 — the
code is the authority; this file adds schedule/reflex/home detail. Schedules
follow the role templates in `sfAmbientRoutine` (`src/sf/33_sf_cast.js`);
times are game-local. Home = a hashed residential block near the scenario
edge (see §Home bases); ambients are crowd, so street-level precision is
enough — no fixed 9xxx numbers until one is promoted.

## Shared reflexes (all ambients — cheap condition checks, never scripts)

| Trigger | Reflex |
|---|---|
| Rain / storm | Favor covered routes, `inside` entries, awnings; hurry gait; no park lounging |
| Thunder close | Pause, look up, move to `inside` if within one block |
| `sfLampsLit()` dusk | Head home if role template ends; nightlife roles reverse |
| Event request live nearby (block party, street fair) | Drift toward it, idle-spectate 10–20 min, resume |
| Severe weather + outdoor event clash | Follow the game's claims matrix — they don't occupy contested space |
| Main character greets/passes | Reciprocate greeting; regulars get nods (café staff know the mains' orders) |
| Possessed player-character interaction | Respond in-role, stay in routine bounds; never initiate secrets |
| Crossing street | Use crosswalk cells; yield to pawns mid-crossing |
| Hunger/thirst/fatigue | Covered off-screen by `sfNpcTick` top-ups — ambients never die on camera |
| Possessed character in their venue | Work the room as normal; treat player like any customer |

Promotion hook = what they'd bring if upgraded to a full brain. None leak
main-cast secrets.

---

## A01 — Reyes · barista pulling espresso shifts

- **Schedule:** 0–7:30 sleep → 7:30–18:00 Mudhaus Coffee (serve) → 18–22
  home idle → 22–24 sleep. Six days/week.
- **Reflexes:** shared + café rush-hour tempo (moves faster 7:30–9:30).
- **Promotion hook:** knows the regulars' orders cold — a second insider
  view of the café cluster who isn't Marisol; quietly saving for a nurse
  assistant cert.

## A02 — Doro · dog-walker with a leash hand

- **Schedule:** 0–7 sleep → 7–11 park loop (north → center → south) →
  11–16 home rest → 16–20 second park loop (south → center) → 20–24 sleep.
- **Reflexes:** shared + detours around scooters/bikes; dogs pull toward
  other dogs; rain shortens the loop to blocks with awnings.
- **Promotion hook:** talks to everyone through the dogs — a walking rumor
  relay who crosses every social cluster twice a day.

## A03 — Malik · corner-shop keeper

- **Schedule:** 0–7:30 sleep → 7:30–18:00 Malik's Mini Mart (serve) →
  18–22 home idle → 22–24 sleep.
- **Reflexes:** shared + watches the sidewalk from the counter; flags
  shoplifting-adjacent shoves (reflex = stare, not call).
- **Promotion hook:** the corner store sees cash stress before anyone — who
  switched to cheaper cigarettes, who stopped coming in. Kept neutral.

## A04 — June · student hauling a tote of books

- **Schedule:** 0–7:30 sleep → 7:30–15:00 Mission High School → 15–19
  park center + café (phone/study) → 19–24 sleep.
- **Reflexes:** shared + school-holiday inversion (park all afternoon);
  exams week = library instead of park.
- **Promotion hook:** the block's youngest eyes — a scholarship-and-leaving
  storyline; audience surrogate one generation below Jules.

## A05 — Esther · retiree on a stoop, watching the block

- **Schedule:** 0–8 sleep → 8–12 stoop/park-center sit (Dolores Perk stop)
  → 12–18 park south sit → 18–24 home.
- **Reflexes:** shared + weather gates her whole day; greets every regular
  by name whether she knows it or not.
- **Promotion hook:** Carmen's peer — an alternate, lonelier retirement
  timeline; knows the block's history too but misremembers it differently.

## A06 — Kofe · delivery rider with a hot box

- **Schedule:** 0–8 sleep → 8–19 delivery loop (El Farolote → Il Delfino →
  Buy-Rite Creamery → Dolores Perk → Mudhaus → 9457 Guerrero) → 19–24 sleep.
- **Reflexes:** shared + fastest rider on the block, leans into every
  double-park; surge hours (lunch/dinner) tighten his loop.
- **Promotion hook:** the gig-economy storyline — three apps, one rent;
  crosses paths with Marcus constantly without ever exchanging more than
  a chin nod. Works for MuleIt.

## A07 — Luz · street vendor at a fruit stand

- **Schedule:** 0–7 sleep → 7–18 Frutería Las Palmas stand (Dolores at
  19th corner, serve) → 18–21 home idle → 21–24 sleep.
- **Reflexes:** shared + rain = tarp the stand, half-day; hot days =
  busiest, she stays later; keeps a cooler of cut mango for kids.
- **Promotion hook:** informal-economy heart of the block; knows everyone's
  payday by what they buy; a permit-hassle arc if promoted.

## A08 — Sam · busker with a guitar on the corner

- **Schedule:** 0–10 sleep → 10–18 park edges/corner sets (work) → 18–24
  600 Club / park south (chat).
- **Reflexes:** shared + moves pitch when another busker is established;
  tips spike near café rush; rain = 600 Club doorway set.
- **Promotion hook:** the artist-who-stayed — could open mic nights at 600
  Club as a player event venue; quietly knows who cries on park benches.

## A09 — Asha · nurse in scrubs off a shift

- **Name note:** `pa-chars.js` currently lists A09 as **'Priya'**, which
  collides with C4 Priya Raman — also a nurse. Two same-named nurses on one
  block is a continuity bug, not a feature. **Working name in world content
  is 'Asha'**; flagged for the code update (see inbox entry).
- **Schedule:** 0–8 sleep → 8–19:30 SF General-adjacent work loop →
  19:30–21 Mudhaus / walk home → 21–24 sleep. (Off-shift days: errands.)
- **Reflexes:** shared + instinctive first-responder — drifts toward
  anyone sitting badly on a bench.
- **Promotion hook:** Priya's colleague-cohort — the ward's-eye view of the
  same hospital; could surface what Priya's job actually costs her.

## A10 — Gus · mechanic in oil-stained overalls

- **Schedule:** 0–6:30 sleep → 6:30–16:00 Folsom Auto & Sons (work) →
  16–22 home rest → 22–24 sleep.
- **Reflexes:** shared + the smell test — emerges from the shop for every
  engine that sounds wrong; Victor's ancient pickup is a weekly event.
- **Promotion hook:** the trades-anchored old Mission; has fixed half the
  block's cars and remembers all of them by sound.

## A11 — Vera · librarian shelving returns

- **Schedule:** 0–7:30 sleep → 7:30–17:30 Mission Branch Library (work) →
  17:30–20 park center or café → 20–24 home.
- **Reflexes:** shared + shushes reflexively at loud feed moments; holds a
  reserve pile of "books people like you check out."
- **Promotion hook:** the quiet information broker — who researches what;
  a natural ally for Jules and a foil for Marisol's blog.

## A12 — Tom · jogger doing laps around the park

- **Schedule:** 0–6 sleep → 6–8 park laps → 8–17 off-screen office →
  17–19 second park loop → 19–24 home.
- **Reflexes:** shared + weather barely deters him (rain = shorter loop);
  never walks a crosswalk he can jog through legally.
- **Promotion hook:** background regular who becomes plot-adjacent by
  sheer presence — he was jogging past when everything happened.

## A13 — Nadia · tech worker doom-scrolling on the curb

- **Schedule:** 0–9 sleep → 9–17 Mudhaus (phone/laptop, remote work for
  Nimbus9) → 17–22 home (phone) → 22–24 sleep.
- **Reflexes:** shared + joins café WiFi rush; public-transit glare;
  actually leaves the apartment only when the WiFi dies.
- **Promotion hook:** the gentrifier-with-guilt storyline — reads Mission
  Unfiltered daily, doesn't know its author pours her coffee.

## A14 — Bex · tattoo artist on a smoke break

- **Schedule:** 0–10 sleep → 10–18 Needlepointe Tattoo (work) + Clarion
  Alley wanders → 18–24 600 Club / park south.
- **Reflexes:** shared + smoke breaks are her social surface — the alley
  is her office lobby; recognizes Dani's linework on sight (NOTE: she has
  seen the same hand on the café chalkboard and on Clarion walls —
  ambient, so she never says it; if promoted, she becomes a live discovery
  path for the Marcus/Dani-adjacent art secret).
- **Promotion hook:** the art-underground link — connects café art,
  Clarion walls, and stick-and-poke culture.

## A15 — Omar · bike courier with a messenger bag

- **Schedule:** 0–8 sleep → 8–19 courier loop (same delivery spine as
  A06, biased to paper/doc runs) → 19–24 sleep.
- **Reflexes:** shared + races Marcus wordlessly when routes cross;
  rain = fenders on, pace unchanged.
- **Promotion hook:** Marcus's guild-mate — the courier co-op's internal
  politics (Flying Pannier vs the apps) and the second witness to
  everything Marcus does on a bike.

## A16 — Hana · baker carrying warm trays

- **Schedule:** 0–4 sleep → 4–13 Baguette About It Bakery (bake/serve) →
  13–17 errands/park → 17–24 home.
- **Reflexes:** shared + the 5 a.m. block is hers — greets only delivery
  drivers and Marisol's opening walk; heat waves shorten the bake.
- **Promotion hook:** the pre-dawn neighborhood — sees the block when
  nobody's performing; sourdough economics (flour prices, line length).

## A17 — Cole · construction worker on a scaffold

- **Schedule:** 0–6:30 sleep → 6:30–16:00 site work near Auerbach Hardware
  → 16–22 home rest → 22–24 sleep.
- **Reflexes:** shared + hardhat zone awareness; rain halts exterior work;
  whistles at passersby exactly never — this is the Mission.
- **Promotion hook:** the development-pressure storyline — he builds the
  change that's displacing the block; a sale at Guerrero becomes his job
  site.

## A18 — Ida · florist with a basket of bouquets

- **Schedule:** 0–7:30 sleep → 7:30–18:00 Bloom & Doom Flowers (serve) →
  18–22 home → 22–24 sleep.
- **Reflexes:** shared + funeral rushes and wedding weekends read on her
  face; hands stray blooms to sad-looking strangers.
- **Promotion hook:** the block's ritual supplier — flowers for every
  birth, quarrel, and memorial; she sees the emotional calendar first.

## A19 — Ray · retired longshoreman feeding pigeons

- **Schedule:** 0–8 sleep → 8–12 park center sit (Dolores Perk stop) →
  12–18 park south sit + pigeon rounds → 18–24 home.
- **Reflexes:** shared + weather gates park time; claims the same bench;
  feeds pigeons off a strict personal schedule they obey better than him.
- **Promotion hook:** the port-city memory — pre-gentrification SF, union
  stories, Esther's bench rival/friend.

## A20 — Zee · teenager glued to a phone

- **Schedule:** 0–7:30 sleep → 7:30–15:00 Mission High School → 15–19
  park center + café perimeter (phone) → 19–24 home.
- **Reflexes:** shared + films anything loud for a private channel;
  migrates in a loose pack with other teens when present.
- **Promotion hook:** the native-generation view — grew up on this block,
  fluent in every rumor, allergic to sincerity; June's foil.

---

## Home bases

Ambients draw a hashed residential cell near the scenario edge at spawn
(`sfAmbientRoutine`); treat their housing as off-registry stock (room-shares
and apartments one ring out from the park). When an ambient is promoted to a
full character, assign a real 9xxx address through the minting rules
(address spec §6) and a lease row in `jobs-housing.md`.
