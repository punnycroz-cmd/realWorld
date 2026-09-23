# Crowd Scenes — ambient choreography for "The Mission" (world v1)

The ambient crowd's job is to make the block read as *lived-in* on the
free spectator feed at any hour — without a single LLM call. This file
is the daypart choreography: who's where when, which venues hold crowds,
how weather and events deform the pattern, and which recurring "scenes"
a spectator can learn to look for. It describes **conditions**, never
scripts — the pawns follow routines + reflexes; the table below is what
those routines produce, not orders they obey.

Spectator-facing companion to `world/ambients.md` + `world/ambients/`.

---

## 1. The daypart map (weekday baseline, clear weather)

| Hours | Where the life is | Who's in frame |
|---|---|---|
| 04–06 | **The pre-dawn shift.** Bakery lights, delivery vans, one café opening. The quietest good hour on the feed. | A16 Hana (bake), A06 Kofe (first pickups), C1 Marisol (opening walk) |
| 06–08 | **Commute front.** Park laps, dog packs, counters opening. | A12 Tom (laps), A02 Doro (north loop), A10 Gus + A17 Cole (shop/site open), A19 Ray arriving |
| 08–10 | **Rush.** Mudhaus line, fruit stand up, couriers loading. | A01 Reyes + C1/C2/C3 (Mudhaus), A07 Luz (stand), A06/A15 (loops), A03 Malik (door open), C5 Marcus |
| 10–13 | **Working block.** Shops staffed, park thin, Clarion active. | A10, A17, A14 Bex (alley), A11 Vera (desk), A18 Ida; park: A05 Esther, A19 Ray, A08 Sam (north pitch) |
| 13–15 | **Lunch + lull.** Taqueria prep, courier surge, school release coming. | A06/A15 (lunch surge), A16 Hana (afternoon errands), C8 Tomás arriving |
| 15–19 | **The after-school hour.** Park center fills, café second rush, teens on the perimeter. | A04 June + A20 Zee (park/café), A13 Nadia (still at Mudhaus), A02 Doro (second loop), A12 Tom (laps 17–19), benches still held |
| 18–21 | **Night shift.** 600 Club corner, El Farolote dinner line, nurses decompressing at Mudhaus. | A08 Sam + A14 Bex (600 Club), C8 Tomás (line), A09 Asha (Mudhaus counter seat), A05/A19 home |
| 21–24 | **Close-down.** Bar stragglers, late kitchen, courier last runs. | A08/A14 (park south drift), C8 (post-service), A06 last orders |
| 00–04 | **The empty block.** Streetlights, a cat, nothing. (The honestest hour — don't fill it.) | nobody |

Weekend deltas: June/Zee's school block becomes all-day park; Sam's
pitches get crowds; Kofe/Omar work longer; Gus/Cole's venues go quiet
Sunday; Luz's stand shortens.

## 2. Venue crowd profiles

| Venue | Holds | Peak | Scene quality |
|---|---|---|---|
| **Mudhaus Coffee** | 3 mains (C1–C3) + A01 behind bar; A13 all day; A09 evenings; everyone passing | 7:30–9:30, 15–19 | The block's nerve center — the default "watch here" frame |
| **Dolores Park (center)** | Benches (A05, A19), dog loops (A02), laps (A12), pitches (A08), teens (A04/A20) | 15–19 clear days | The stage itself; crowd is weather-made |
| **The 600 Club** | A08, A14 nights; C5 leisure | 20–24 | Nightlife pool; open-mic-capable venue |
| **Malik's Mini Mart** | A03 behind counter; steady drip of everyone | 8:00, 17:30 rushes | The block's rumor interface, one transaction at a time |
| **Frutería Las Palmas** | A07 + whoever's buying | 1st of month; hot days | Informal-economy counter; kid traffic |
| **El Farolote** | C8 + A06 pickup window | 13–15, 19–23 | Dinner line; post-bar rush |
| **Mission Branch Library** | A11 + June exam weeks | Tue–Sat days | Quiet crowd; rain fills it |
| **Clarion Alley** | A14 on breaks; visitors drifting | afternoons | The art corridor; smoke-break lobby |

## 3. Weather & event modifiers

| Condition | Crowd deformation |
|---|---|
| Rain | Park empties (A05/A19 stay home, Doro shortens loops, Sam → 600 Club doorway); Luz tarps and halves the day; library + cafés absorb the overflow; Kofe/Omar keep pace (work doesn't care) |
| Storm / thunder | All outdoor states → `inside` within a block; the feed should read as *emptied*, that's fine |
| Heat wave | Park fills; Luz stays late and sells out; Hana's bake shortens; 600 Club spills earlier |
| Dusk (`sfLampsLit`) | Day roles head home; A08/A14 reverse direction; lit windows become the crowd |
| Player event (block party, street fair) | Ambients within earshot drift toward it, spectate 10–20 min, resume routines — crowd appears *because a crowd would*; Sam plays the edge, Ida reads the flyer |
| Severe weather × outdoor event | Claims matrix rules (game v2) — ambients vacate contested space |

## 4. Recurring scenes (spectator-facing — the "oh, *this* again" layer)

These emerge from the routines colliding. They're the block's standing
bits — the things regulars of the feed learn to wait for:

- **The 4 a.m. handoff** — Hana's rack, Marisol's opening walk, Kofe's
  first pickup: three people who never talk, running the same dark hour.
- **Rush hour at Mudhaus** — Reyes at double tempo, the line, Nadia's
  headphones going on.
- **Bench parliament** — Esther and Ray, adjacent bench sections,
  arguing about pigeons and the port; Tom's laps as the metronome;
  Carmen's palm within sight.
- **The wordless race** — Marcus and Omar, one block at full pace,
  whenever routes cross. Kofe does not participate. Officially.
- **The 15:00 release** — school lets out; June heads to the park with
  books, Zee's pack materializes on the perimeter; the café refills.
- **The evening nurse** — Asha's counter seat at Mudhaus, 19:30, phone
  face-down; Priya some nights on the other side of the same tired.
- **Victor's pickup at Gus's** — weekly; the argument about whether the
  truck is worth keeping, continued from last week.
- **Doorway sets** — Sam under the 600 Club awning when it rains:
  smaller crowd, better music.

## 5. What the crowd must never do

- **Never crowd a scene.** Ambients spectate events; they don't mob
  mains or player characters. A pawn density cap around any main (≈3
  within interaction range) keeps frames readable.
- **Never perform.** They do their jobs; spectacle is a byproduct. If a
  scene needs a crowd reaction, the reaction is "people nearby noticed,"
  not choreography.
- **Never be request targets.** Ambients can be *around* requests, work
  a venue during one, deliver to one — but a request can't turn an
  ambient into a protagonist (design §9; promotion is the only path).
- **Minors stay public-space** (see ambients.md co-star rule 4).

## 6. Cross-references

- Per-NPC detail: `world/ambients/a01..a20`
- Machine-readable registry: `world/ambients.json` (routines keyed to
  `SF_AMBIENT_ROUTINES` in `src/sf/33_sf_cast.js`)
- Crowd model (v15, deepened v29 + v43): `world/crowd-sim.md` +
  `world/crowd.json` — the two-layer population contract (named ambients +
  unnamed extras), density bands, weather/event deformation, scene
  conditions, day shades, the flow layer, micro-texture, walk-chain
  continuity, the greeting matrix, the six ambient work zones, claimable
  sub-venue resources, and the per-ambient week/weather variant layer
  (`ambients.json` v43); `world/crowd.html` demos it; the `crowd` audit
  gate enforces json↔demo agreement
- Venue names: `world/businesses.md` (canonical parody names; code-side
  resolution via `SF_WORLD_POIS` in `src/sf/30_sf_world.js`)
- Upgrade path: `world/promotion.md`
