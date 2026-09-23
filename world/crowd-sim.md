# Crowd Sim — the block's population model (world v15; deepened v29, v43, v57)

How "The Mission" stays populated on the free feed 24/7 without spending a
cent of inference. Two layers, one rule set. **This file specifies
conditions, never scripts** — everything below is spawn budgeting and
reflex gating; nobody is told what to do.

Companion docs: `world/ambients.md` (the named layer), `world/crowd-scenes.md`
(the spectator-facing choreography this model produces),
`world/crowd.json` (machine mirror — the contract). Demo: `world/crowd.html`.

---

## 1. The two layers

### Layer 1 — named ambients (A01–A20)
Thin-AI pawns with routines, reflexes, cards, and names. They are the
*recognizable* crowd — the feed can name them, regulars learn them, they
can be promoted. Everything for this layer already lives in
`world/ambients/` + `SF_AMBIENT_ROUTINES`. This spec doesn't change them;
it adds the water they swim in.

### Layer 2 — extras (new this version)
Unnamed, non-persistent background pawns: the coffee line that isn't
Reyes, the dog walkers who aren't Doro, the dinner queue at El Farolote.
A real Mission block has hundreds of people; 20 named pawns alone reads
as a ghost town at rush hour. Extras fix that while costing nothing —
they have **no brain at all**, only locomotion and four reflexes.

**Extras hard rules (all enforceable by construction):**

1. **No identity.** No name, no id, no card, no ledger entry, no feed
   attribution, no memory records. An extra exists as `pawn{pos, gait,
   intent, skin}` for the duration of one spawn and then stops existing.
2. **Off-camera lifecycle.** Extras spawn and despawn only outside the
   spectator's view — at block edges, through doorways, around corners.
   Nobody ever watches an extra appear or vanish. If the camera jumps,
   stale extras inside the new frame are *kept* (they were "already
   there"); the deficit is filled at the edges.
3. **Never request targets.** The request catalog cannot address an extra
   — there is no handle to name. A request can clear or fill a venue,
   which changes the extras *budget* there, never an extra's orders.
4. **No conversation.** Extras have four reflexes total: `yield`
   (step aside), `queue` (stand in line), `shelter` (rain → awnings/
   indoors), `rubberneck` (pause ≤20 s at a commotion, then move on).
   They never speak; if a character addresses one, it does the human
   minimum (nod, "sorry," keep walking) via canned gesture, not dialogue.
5. **Density-capped around mains.** Per crowd-scenes §5: ≤3 interactive
   pawns within interaction range of any main or player character. Extras
   count toward this cap; the spawner thins around framed characters.
6. **Never carry the story.** Extras never witness for the rumor layer,
   never hold a seed, never appear in the Archive. If the only "people"
   who saw something were extras, then as far as the record is concerned,
   nobody saw it.

### What an extra costs
Position + gait + a drawn sprite. No LLM, no substrate writes, no memory
encoding (memory spec: they are below the `ambient` degraded mode — they
don't encode at all). Compute per extra ≈ one medieval pawn's idle tick.

## 2. Density model

Each zone carries an **extras budget** per daypart — a range the spawner
maintains by spawning/despawning at edges. Ranges are deliberately wide;
the crowd should breathe, not hold a number.

Zones and budgets live in `crowd.json §zones` (weekday + weekend rows,
nine dayparts each). Bands for spectator legibility:

| band | headcount | reads as |
|---|---|---|
| deserted | 0 | lights on, nobody home (00–04 is allowed to be deserted — honest hour) |
| thin | 1–3 | a few souls |
| steady | 4–8 | normal block life |
| busy | 9–15 | rush, lunch line, park afternoon |
| packed | 16+ | event draw, festival weather |

The feed never reports counts — it reports the band word, attached to a
`venue` event, at most once per venue per hour (and only on band change).

## 3. Weather & event deformation

Multipliers apply to the *extras budget* of each zone; named ambients
follow their own reflexes (crowd-scenes §3, unchanged).

| condition | outdoors zones | cafés / library / shops | notes |
|---|---|---|---|
| rain | ×0.15 | ×1.4 | shelter reflex; awnings fill |
| storm | ×0.05 | ×1.2 then ×0.8 | feed should read emptied; that's correct |
| heat wave | park ×1.5, street ×0.8 | stand ×1.3, cafés ×0.9 | Luz sells out earlier |
| dusk (sfLampsLit) | day budgets decay over 45 min | nightlife zones ramp | handled by daypart boundaries, not a flag |
| player event | draw radius pulls extras toward the venue: source zones −30%, event zone up to `packed` | — | extras make a crowd *because a crowd would be there* |
| exclusive venue lock (claim) | extras budget → 0 inside the lock for its duration | — | a locked venue reads cleared, staff ambients stay |

## 4. Recurring scenes as conditions

The eight standing bits from crowd-scenes §4 are now *detectable*, not
performed: each has a `when` clause over (daypart, named presence,
weather). The demo + feed can label a frame "bench parliament" when
Esther and Ray are both on benches 12–18 and it's not raining. If the
conditions don't obtain, the scene doesn't happen — nobody is sent to
fill it. Scenes are descriptions of collision, never goals.

`crowd.json §scenes` carries the condition table; §5 of this file lists
the spectator wording for each.

## 5. Spectator legibility

- Venue rows show the band word + named faces present ("busy — Reyes, Nadia, +4").
- Extras appear in venue reads only as the `+N` tail, never by name.
- Scene labels are the same standing-bit names spectators already learn;
  they surface as `scene` events only when a band change accompanies
  them (otherwise the frame just *is* the scene).
- The 00–04 desertion is protected: no system may pad it to look alive.
  `crowd.json` encodes `allow_deserted: true` on the overnight daypart.

## 6. Spawner contract (for the implementer)

- `crowdBudget(zone, daypart, weather, events) -> [lo, hi]` — pure
  function over crowd.json; the sim maintains count within the range.
- Spawn/despawn only when `!onScreen(point)`; despawn extras oldest-first
  when over budget.
- Extra appearance pool: deterministic `hash(day, zone, spawnIndex)`
  over a palette of silhouettes/gaits — variety without identity.
- Extras respect `SF_PROP_RAD` collisions and crosswalk cells like any
  pawn; they never enter `poi:null` interiors or claimed space.
- Snapshot/ledger: extras are **excluded** from save state. Reloading
  the world repopulates the crowd from budgets — the crowd is
  atmosphere, not state.

## 7. What the crowd must never do (additions to crowd-scenes §5)

- Never spawn in view, never pop. The seam rule: the camera should be
  unable to prove an extra wasn't always there.
- Never be individually addressable — no feed name, no archive row, no
  request handle, no promotion path. The only door from extra to cast is
  deleting the extra and minting a new ambient (A21+).
- Never outnumber the named cast in a *named* read — venue rows always
  lead with who, extras are the tail.

---

## 8. The week has a shape (v29)

`weekday`/`weekend` is a coarse split. Real blocks shade further — a
Tuesday afternoon is not a Friday afternoon. `crowd.json §day_shades`
carries named shades that multiply zone budgets on specific calendar
conditions. Shades stack with weather, never with each other (first
match wins; `first_of_month` beats `fri`).

| shade | when | what it does |
|---|---|---|
| `fri` | Fridays | evening/night swell: club600 ×1.15, elfarolote ×1.1, streets evening ×1.2; Mudhaus dies earlier — nobody lingers Friday afternoon |
| `sun` | Sundays | morning hush: streets commute/rush ×0.5, minimart rush ×0.7; the park owns the day (weekend row already does the work — `sun` adds the *quiet*) |
| `first_of_month` | the 1st | fruteria ×1.5, minimart ×1.3 all day; bench parliament runs long; this is the block's payroll rhythm, visible to regulars of the feed |
| `mon` | Mondays | the closed-sign shade: bakery/bloomdoom/library closed_days already bite; `mon` additionally ×0.8 on cafe budgets — the block exhales |

Shades are budget arithmetic only. No named ambient's routine changes —
Luz doesn't get told it's the 1st; her stand is just busier.

## 9. The flow layer (v29)

Extras don't teleport between venue budgets — they *walk between them*.
`crowd.json §flow_edges` declares pedestrian currents: ordered zone
pairs with a per-daypart transit range. `streets` is the sink and
source; `edge` is the off-map boundary where extras enter and leave the
world.

What the flow layer is for:

- **Sidewalk truth.** A zone going 4→9 shouldn't read as five people
  blinking in — the feed sees the crossing fill first, then the door.
  Spawner drains the deficit along edges: 60–80% of a rising venue's
  new extras arrive via the strongest active edge, on foot.
- **Transit legs.** An extra on a flow edge is walking *through* —
  no queue reflex, minimal dwell (≤90 s inside any zone it crosses).
  `flow` ranges count bodies in transit, distinct from zone budgets.
- **Deformation follows physics.** Rain doesn't lower a flow edge to
  zero while destinations are open — people still walk to dinner; it
  halves the edge and speeds the gait. `storm` does what it does to
  everything.

The flow layer is invisible to the feed — no event type, no counts.
It exists so that motion between zones looks like a city and not a
teleporter.

## 10. Micro-texture (v29)

Below player events and weather sits a third deformation layer: the
block's mundane recurring texture. `crowd.json §micro_events` — small,
named, conditional budget/route effects that regulars learn to expect.
They never appear on the feed as events; they just make the frame right.

| id | condition | effect |
|---|---|---|
| `sweep-tue` | Tuesdays, rush→midday | curb lanes clear on the swept side; streets edge flow ×0.8; parked-car sprites thin where decals say so |
| `school-bell` | weekday 15:00 ±20 min | streets→park edge doubles; park afternoon floor +2 — the release is audible before it's visible |
| `delivery-window` | daily commute+rush | bakery/market curb dwell: 1–2 extras at a truck, handtruck gait — commerce texture, not a scene |
| `last-call-drift` | daily 23:00→close | club600→edge flow spikes; elfarolote night gets the post-bar tail |
| `sunday-stoop` | sun midday→evening | residential stoops read occupied — static extras at doorways, zero flow |

None of these notify anyone. They're the difference between a crowd
model and a neighborhood.

## 11. Continuity without identity (v29)

Extras have no identity — but the eye tracks motion. Two rules keep
the seam invisible *across* zones without giving anyone a self:

- **The walk chain.** When an extra exits a zone toward an adjacent
  zone's edge within a 20-minute window, the spawner may reuse its
  `hash(day, zone, spawnIndex)` silhouette at the destination. This is
  costume continuity, not identity: the pawn carries no state, and a
  reused silhouette is indistinguishable from coincidence — which is
  the point. Chains die at 20 minutes or one intermediate zone.
- **Camera-jump persistence.** Extras already survive a camera cut
  (§1 rule 2). Addition: a cut *within* a walk window prefers keeping
  silhouettes whose last heading pointed into the new frame. Nothing
  persists across reloads — extras remain excluded from save state.

Ledger-level rule unchanged: no id, no name, no archive row. A viewer
can believe they saw the same dog walker twice; the system neither
confirms nor remembers.

## 12. The greeting layer (v29)

Named ambients share zones all day; whether they visibly know each
other is content, not emergence — a stranger should be able to learn
the block's social graph from the feed. `crowd.json §greeting_matrix`
declares familiarity weights between named ambients (and notes where
a main crosses an ambient's routine).

Rules:

- **Weights, not scripts.** A `hi` weight means that when both are in
  the same zone, a ≤15 s visual beat (nod, chin-raise, two-word pause)
  is *likely*, gated on both being in a greetable state (not serve-rush,
  not asleep, not on a minor-guarded beat). A `lo` weight means the beat
  is rare — Kofe does not stop for Omar; that's the joke of
  `wordless-race`.
- **Greetings never move anyone.** No routine changes to make a
  greeting possible. If Esther is at Dolores Perk and Ray is on the
  south bench, there is no parliament — the matrix only fires on
  collision.
- **The matrix is observable-safe.** Every pair it names is a surface
  read a patient spectator could assemble. It holds no seed content and
  never will — secrets live where secrets live.
- **Minors (A04, A20)** only greet in public zones, in groups — the
  pack is the unit, never a lone adult-minor pair.

## 13. Spawner contract — additions (v29)

- `crowdBudget(zone, daypart, weather, shade, events)` — §6 signature
  gains `shade`; shade resolves before weather, first-match-wins.
- `crowdFlow(edge, daypart, weather) -> [lo,hi]` — bodies in transit
  per edge; the rising-venue rule (§9) sources 60–80% of a deficit
  through the strongest live edge.
- `extraLook(day, zone, spawnIndex)` — deterministic pick from
  `appearance_palette` (24 silhouettes × gait set × palette); walk
  chains reuse the pick under the §11 window.
- `microActive(id, day, daypart) -> bool` — micro-events are
  conditions evaluated per tick, never scheduled.
- Greetings: `greetWeight(a, b)` reads §greeting_matrix; the beat is
  a pose exchange ≤15 s attached to the lower-salience pawn.

## 14. Boundary additions (v29)

- Shades and micro-events are **internal vocabulary** — the feed still
  says only band words and scene labels. A spectator never sees
  "first_of_month" on the wire; they see Luz's stand busy on the 1st.
- Flow edges and walk chains carry **no ledger presence** — transit
  extras have exactly the same non-existence as parked ones.
- The greeting matrix is the *only* sanctioned inter-ambient affinity
  layer below promotion. It cannot create a scene, a rumor, or a
  storyline — only a nod.

---

## 15. The ambient work zones (v43)

The crowd map used to end where the extras' day ends — café, park, bar,
shops. But the named layer spends its daylight in places the map didn't
have: June and Zee are inside Mission High, Asha is inside SF General,
Gus and Cole are at the shop and the site. v43 adds six zones so the
board can say where a named pawn *is* instead of pretending the block
is only storefronts:

`school` · `sfgeneral` · `folsom` · `auerbach` · `needlepointe` ·
`doloresperk` (the café the bench parliament defects to in rain).

These zones carry **small extras budgets by design** — a hospital ward,
a classroom, and a garage don't fill like a sidewalk; most of the people
inside are staff, not extras, and the budgets reflect the visible public
edge (the school gate at release, the clinic entrance, the parts
counter). Weather multipliers apply by kind (`civic`/`shop`) as usual.

Two consequences regulars will notice:

- The greeting matrix's `auerbach`/`folsom` pairs finally resolve to
  real zones — Cole and Gus's hardware-counter mornings have a board row.
- Rain defects are visible: Esther and Ray's `rained out` reads now land
  at `doloresperk`, not a generic absence.

## 16. Claimable ambient resources (v43)

A venue lock (claims matrix) is a blunt instrument — it clears the whole
room. Most plausible player asks are smaller: *hold the big table*, *book
the mic*, *save Luz's first crate*. `crowd.json §ambient_resources`
declares five sub-venue resources that a request can claim for a
declared window without touching the venue:

| resource | zone | staffed by | what a claim does |
|---|---|---|---|
| the neighbor table | Mudhaus | A01 Reyes | seats-6 reservation; café keeps serving around it |
| the open-mic slot | The 600 Club | A08 Sam | one 15-min set on the corner rig |
| the north pitch | Dolores Park | A08 Sam | holds the raised pitch, not the grass around it |
| the first box | Frutería Las Palmas | A07 Luz | preorder on the day's first crate — gone by 9 |
| the walk-in chair | Needlepointe | A14 Bex | holds the chair slot; flash only |

Contract (all enforceable):

1. **The claim is on the resource, not the venue.** Extras budget inside
   the resource's radius → 0 for the window; the rest of the zone is
   unaffected. A claimed table in a busy café reads as a reserved sign,
   not an emptied room.
2. **Staff ambients stay on routine.** Reyes works the counter whether
   or not the table is claimed; the claim can borrow her presence as a
   co-star (ambients.md rules) but cannot give her orders.
3. **Exclusive class, human review.** A resource claim is an
   exclusive-class request on that resource id — it enters the §11
   pipeline at step 4 like any exclusive, and shows on the public feed
   attributed as normal.
4. **Minors have no claimable resources.** Nothing in this block is
   staffed by or adjacent to A04/A20.
5. **No seed adjacency.** A claimable resource can never be a discovery
   path — `res-needlepointe-chair` is a chair slot, not a conversation
   about linework.

## 17. The ambient week — per-ambient variants (v43)

Until now every ambient ran one flat routine all week, and the weather
reflexes were prose on their cards. `ambients.json` v43 gives each
ambient three machine-readable variant layers plus a signature:

- **`week.<dow>`** — a full alternate row set for days that differ:
  off-days (Reyes's Sunday sleep-in, Vera's Sunday/Monday closures,
  Cole's flat Sunday), weekend shifts (Kofe's surge, Sam's earlier
  pitches, the kids' all-day park orbit), Asha's Tue/Wed decompression
  loop. When a `week` entry exists for the day it *replaces* the base
  routine; otherwise the base runs.
- **`weather.<cond>`** — alternate rows for `rain`, `storm`, `heat`
  where the condition visibly changes the day (Luz tarps and halves;
  Sam plays doorways; Tom shortens laps but never moves them; Esther
  and Ray defect to Dolores Perk). Indoor workers keep a `note`-only
  entry — their day doesn't move, which is itself the information.
- **`personal[]`** — named recurring conditions too small for the
  calendar: Reyes's Friday lottery ticket, Ray's 8:30/noon pigeon
  schedule, Kofe's Fri/Sat surge, June's exam-week library swap.
  Conditions again — nothing summons anyone.
- **`signature`** — `{silhouette, gait, carry, tell}`: the one-glance
  read that makes a named pawn recognizable on the feed ("warm trays at
  shoulder height", "three leashes, one hand"). Silhouette/gait reuse
  the extras' `appearance_palette` vocabulary so a promoted ambient is
  already legible in the extras' grammar.

Resolution order for the thin tier: `storm` → `rain` → `wind`/`fog` →
`heat` → `week.<dow>` → base `routine`. Exactly one layer applies (a stormy Sunday is a storm
day, not a Sunday); within a layer the row set is a full 24 h — no
partial patching, no drift between spec and sim.

Boundaries: variants change *where* and *when*, never *who*. No variant
may introduce a seed reference, a request affordance, or a
minor-to-adult pairing that the base routine wouldn't produce.

---

## 18. The marine layer (v57)

Rain and storm were honest but incomplete — the condition the Mission
actually lives under most summer mornings is **fog**. `crowd.json
§fog_model` makes fog a depth profile, not a binary:

- **Stages:** `deep → patchy → burned`, keyed by daypart
  (`day_profile`). Overnight through commute runs deep; the burn starts
  in the rush daypart and `burn_hour` (10:30) is where the park's
  budget recovers. Evening re-grays; night is deep again.
- **The fog line.** The marine layer pours over Twin Peaks and dies at
  the park's west edge. Extras thin at the west edge first; the east
  sidewalks keep their sun. A spectator reads the line on the frame —
  never the word "fog" on the wire.
- **All-day fog** (~1 fog day in 4, heavier May–Aug): `patchy` holds
  through midday/lunch/afternoon. The park stays thin and the bench
  parliament defects to Dolores Perk — the same displacement rain
  causes, for a different reason. That's the new scene
  `parliament-in-exile`: it fires on *presence* at the Perk, whatever
  the sky's excuse.
- **No new reflex.** Fog isn't wet — `shelter` never fires, gaits don't
  change, nobody runs. Fog is a gray read, not an empty one. The
  extras multiplier (`open_air ×0.55`, cafés ×1.15) does all the work.

Named ambients carry their own `weather.fog` answers (ambients.json
v57): Esther and Ray hold the Perk window until it burns; Luz opens a
half-hour late and dries the crates; the kids' park orbit compresses to
the Mudhaus awning; Nadia treats a gray morning as a home morning and
comes out when it burns. Indoor workers carry note-only entries — the
shift doesn't move, which is itself the information.

## 19. The wind (v57)

The afternoon westerlies are the second shoulder condition
(`wind_model`): strongest 14–18, felt on stands, stoops, and anyone
holding paper. Open-air budgets drop ×0.75, stands ×0.7, and the
`west-wind` micro-event thins Clarion and the sidewalks in the blow.
Named answers: Luz packs early when gusts argue with the scale; Sam's
pitch moves to the 600 Club doorway (you can't tune a gust); Ray's
crumb bag stays shut until it passes. Wind never empties the block —
it's a texture condition, not a displacement.

## 20. Seasons (v57)

`season_shades` is the climate baseline the calendar rides on — resolved
*before* day shades and weather, and it stacks with both (a shade is a
day; a season is the month it lands in). Three rows:

| shade | months | what it does |
|---|---|---|
| `fog_season` | May–Aug | park/clarion mornings thin — summer is the gray season |
| `indian_summer` | Sep–Oct | the Mission's real summer — warm, clear, fuller park afternoons |
| `wet_season` | Nov–Mar | near-baseline; the storms matter more than the fog |

Season ids are internal vocabulary like shade ids — the wire says band
words; a spectator learns "September is the park's month" by watching,
never by reading it.

Spawner contract addition: `crowdBudget(zone, daypart, weather, shade,
season, events)` — `season` resolves first; `fogStage(hour, all_day) ->
deep|patchy|burned` reads `fog_model.day_profile`, and `all_day` holds
`patchy` through the burned dayparts.
