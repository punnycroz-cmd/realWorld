# Ambient Cast — 20 NPCs (world v1)

Thin AI: schedules + reflexes, **zero LLM calls while ambient** (design §2).
Pure crowd — they make the block feel lived-in, absorb player requests as
co-stars when summoned, and are **promotable** to full characters later
(`world/promotion.md`). AI-only by default; ambient possession stays off
(design §9 open decision 2).

Names/roles match `willowbrook/dev/pa-chars.js` NV_CAST A01–A20 — the code
is the authority; this file is the index and the shared systems. Schedules
live in code as `SF_AMBIENT_ROUTINES` (`src/sf/33_sf_cast.js`, per-id
overrides falling back to `sfAmbientRoutine` role templates) and in readable
form in `world/ambients.json` — the JSON is the spec, the JS is the
implementation; keep them in sync (v1: they are).

**v1 change:** A09's code name `Priya` → **`Asha`** (landed in pa-chars.js —
the collision with C4 Priya Raman is resolved). Fictional venues are now
real resolvable POIs via `SF_WORLD_POIS` in `30_sf_world.js`, so ambient
routines use canonical parody names directly (`Malik's Mini Mart`,
`Mission High School`, `Clarion Alley`, `SF General`, …).

## Roster & cards

Per-NPC deep cards (who they are, voice, ties, week shape, reflexes,
co-star behavior, promotion packet) live in `world/ambients/`:

| ID | Card | Name | Role | Daytime anchor |
|----|------|------|------|----------------|
| A01 | ambients/a01-reyes.md | Reyes | barista | Mudhaus Coffee 7:30–18 |
| A02 | ambients/a02-doro.md | Doro | dog-walker | park loops 7–11, 16–20 |
| A03 | ambients/a03-malik.md | Malik | corner-shop keeper | Malik's Mini Mart 7:30–18 |
| A04 | ambients/a04-june.md | June | student | Mission High; park/café 15–19 |
| A05 | ambients/a05-esther.md | Esther | retiree | park benches 8–18 |
| A06 | ambients/a06-kofe.md | Kofe | MuleIt delivery rider | delivery spine 8–19 |
| A07 | ambients/a07-luz.md | Luz | fruit vendor | stand, Dolores at 19th, 7–18 |
| A08 | ambients/a08-sam.md | Sam | busker | park pitches 10–18; 600 Club nights |
| A09 | ambients/a09-asha.md | Asha | nurse | SF General shifts; Mudhaus 19:30–21 |
| A10 | ambients/a10-gus.md | Gus | mechanic | Folsom Auto & Sons 6:30–16 |
| A11 | ambients/a11-vera.md | Vera | librarian | Mission Branch Library 7:30–17:30 |
| A12 | ambients/a12-tom.md | Tom | jogger | park laps 6–8, 17–19 |
| A13 | ambients/a13-nadia.md | Nadia | remote tech worker | Mudhaus corner table 9–17 |
| A14 | ambients/a14-bex.md | Bex | tattoo artist | Needlepointe/Clarion 10–18; 600 Club nights |
| A15 | ambients/a15-omar.md | Omar | Flying Pannier courier | paper-run loop 8–19 |
| A16 | ambients/a16-hana.md | Hana | baker | Baguette About It 4–13 |
| A17 | ambients/a17-cole.md | Cole | carpenter | site near Auerbach Hardware 6:30–16 |
| A18 | ambients/a18-ida.md | Ida | florist | Bloom & Doom 7:30–18 |
| A19 | ambients/a19-ray.md | Ray | retired longshoreman | park benches 8–18 |
| A20 | ambients/a20-zee.md | Zee | teenager | Mission High; park/café 15–19 |

Crowd choreography — who's where when, venue crowd profiles, weather and
event modifiers, spectator-facing scenes — lives in `world/crowd-scenes.md`.
The population model beneath it (named ambients + unnamed extras layer,
density budgets, spawn rules, work zones, claimable resources) is
`world/crowd-sim.md` + `world/crowd.json` (v43).

## Signatures & the ambient week (v43)

`ambients.json` v43 adds a machine-readable variant layer per ambient —
the spec the thin resolver consumes; `world/crowd-sim.md` §17 is the
prose contract and `crowd.html` demos the resolution:

- **`signature`** — `{silhouette, gait, carry, tell}`: the one-glance
  read ("three leashes, one hand"). Shares vocabulary with the extras'
  `appearance_palette` so named pawns and extras speak one grammar.
- **`week.<dow>`** — full alternate row sets for days that differ:
  every off-day now has a real day behind it (Reyes sleeps past 9 and
  runs errands; Vera reads in the park on her closed days; Cole's
  Sunday is flat), plus Asha's Tue/Wed decompression loop, Kofe's
  Saturday surge, Sam's weekend pitches, the kids' all-day orbit.
- **`weather.<cond>`** — `rain`/`storm`/`heat` alternate rows where the
  condition visibly changes the day; `note`-only entries where it
  doesn't (the shop doesn't move for rain — that is the read).
- **`personal[]`** — named recurring texture: the Friday lottery ticket,
  the pigeon schedule, exam-week library, surge nights.

Resolution order: `storm` → `rain` → `wind`/`fog` → `heat` →
`week.<dow>` → base `routine`. One layer, full 24 h — variants change
where/when, never who; no seed references, no request affordances, no
minor-adult pairings the base wouldn't produce.

v57 adds the shoulder-condition answers: every ambient carries a
`weather.fog` entry (full rows where the gray actually moves the day —
Esther and Ray's Perk-window mornings, Luz's dew-delayed stand, the
kids' awning orbit, Nadia's home-till-it-burns — and a note where it
doesn't); the stand, the pitch, and the paper-bag routines also carry
`weather.wind`. Fog is the default SF morning, so the audit gate fails
any card without a fog answer.

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

## Co-star rules (player-request interactions)

Ambients are the cast a request can borrow. Constraints that keep them
cheap and safe:

1. **In-role only.** An ambient responds inside its routine and persona —
   Reyes serves drinks, Malik sells things, Ida arranges flowers. Requests
   that need an ambient to *leave* its routine degrade to "that person is
   busy" behavior, not obedience.
2. **No secrets surface.** Ambient knowledge is surface-level by
   construction; they can't leak what they don't carry (their cards carry
   no SECRETS fields at all).
3. **Venue claims still apply.** An exclusive venue lock (per the game
   track's claims matrix) that includes ambient staff means the staff
   stay on-script — the venue works, the people stay background.
4. **Minors (A04 June, A20 Zee):** ambient co-star behavior is limited to
   public-space interactions; they are never request targets, never
   follow a player character out of their routine.

## Home bases

Ambients draw a hashed residential cell near the scenario edge at spawn
(`sfAmbientHome` in `33_sf_cast.js`); treat their housing as off-registry
stock (room-shares and apartments one ring out from the park). When an
ambient is promoted to a full character, assign a real 9xxx address
through the minting rules (address spec §6) and a lease row in
`world/jobs-housing.md` — full procedure in `world/promotion.md`.
