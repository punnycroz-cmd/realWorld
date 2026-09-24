# Crowd Sim — the block's population model (world v15; deepened v29, v43, v57, v71, v85, v99, v113, v127)

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

## 21. The civic year (v71)

`annual_shades` is the layer between the climate and the day: named
calendar-window conditions that resolve **after** `season_shades` and
**before** `day_shades` — and when one matches, the day shades are
suppressed for that day. The holiday owns the day; `fri`/`sun`/`mon`/
`first_of_month` are ordinary-week vocabulary and don't apply when the
calendar has already claimed the date. Weather still stacks on top —
a rainy Carnaval is a thin Carnaval, not a cancelled one.

Window grammar (`when` or `windows` for alternatives, first hit wins):
`months`, `dom` (inclusive day-of-month range), `dow`, and `nth`
(nth occurrence of `dow` in the month — `nth` requires `dow`). All
clauses in a window must match. Evaluation is budget arithmetic only:
`zone_mult`, `daypart_zone_mult`, `edge_mult`, `silhouette_hint`. No
routine is ever changed and no pawn is summoned — Ida opens Bloom &
Doom on November 1st exactly like any day; the `×1.6` budget and the
marigold bags do the storytelling.

The eight shades:

| shade | window | what it does |
|---|---|---|
| `carnaval-weekend` | May, Sat–Sun, 23–31 | park/Clarion ×1.4–1.5, afternoon swell, folding chairs on the sidewalk |
| `game-day` | Apr–Sep, Tue/Wed/Fri/Sat | dinner-hour jersey drift through El Farolote and the 600; a swell, not a scene |
| `muertos` | Nov 1–2 | Bloom & Doom ×1.6, evening procession drift down the corridor, marigold bags |
| `pride-weekend` | Jun, Sat–Sun, 20–30 | Clarion dresses up, the park keeps the spill, the 600 runs late |
| `carfree-sunday` | Mar–Oct, 2nd Sunday | the commercial corridor goes car-free — strollers and folding chairs in the curb lane |
| `labor-day` | first Mon of Sep | the trades stay home (folsom/auerbach/school ×0.3–0.5), the park takes the overflow |
| `holiday-week` | Dec 24–26, Jan 1 | half the block is visiting someone — counters dark, Malik open, the family walk in the park |
| `new-year-lull` | Dec 27–31, Jan 2–8 | no commute front, no lunch line — the quietest honest stretch of the year |

Two scenes and two micro-events ride the layer: `marigold-line` (Ida's
queue under the awning during `muertos`), `game-night-swell` (jerseys
through to dinner on `game-day` evenings when the taqueria is already
busy), `school-dropoff` (the morning mirror of `school-bell` on the new
`f-edge-school` edge), and `marigold-run` (Oct 28–31, the week before —
Bloom & Doom's busiest stretch). Four calendar telltale silhouettes
join the palette: `jersey-cap`, `marigold-bag`, `folding-chair`,
`umbrella-up`. A silhouette can hint the date, never a name.

Ids are internal vocabulary (`civic_vocab`): the wire still says band
words and scene labels — a spectator sees jerseys and marigolds, never
the string "muertos".

## 22. The posture palette (v71)

The fix for "Resting peacefully" everywhere is vocabulary, not
animation. `posture_palette` is the dwell layer: extras inside a zone
budget who aren't in transit or queue hold **one posture** and rotate
on a 45–180 s dwell timer; named ambients whose resolved row is
idle/sit/rest in a public zone pick a legal posture by
`hash(id, daypart, zone)`. The thin tier renders a small human
behavior instead of freezing — and the feed gets an honest label.

- `labels` maps every state id to display copy: `idle` → "Between
  things", `rest` → "Resting", `sit` → "Sitting", `queue` → "Waiting in
  line"… **No default may imply sleep.** The label lies die here.
- Twelve postures, each gated on zone kind and pair availability:
  `phone-check` anywhere public, `window-shop`/`bag-shift` at shops and
  stands, `nurse-cup`/`read-folded` at cafés and civic steps,
  `bench-sprawl`/`watch-street`/`stretch-look` in the open air,
  `lean-wait`/`smoke-stand` at doorways, and the pair postures
  `pair-chat` and `leash-tangle` — two dwellers braided into one beat.
- Postures are **conditions on (zone kind, pair availability), never
  scripts** — nothing is dispatched to fill one. A pair posture
  requires two dwellers already present; the second one isn't sent for.
- Minors pair only within the pack; a lone minor's posture is always
  solo. Postures never render inside `home` and never while sleeping.

Spawner contract addition: `crowdBudget(zone, daypart, weather, shade,
season, events, annual)` — `annual` resolves after `season` and
suppresses `shade` when it matches; `postureFor(zone_kind, pair_ok)`
draws from the palette; `idleLabel(state)` reads `labels` and is the
only legal idle read on the wire.

## 23. The company layer (v85)

Until now every extra spawned solo — a sidewalk of lone particles, which
no real block ever is. `crowd.json §group_profile` makes extras arrive in
**social units**: `lone` (1), `duo` (2), `cluster` (3–4). A unit is one
spawn, one edge entry, one despawn — it never splits mid-frame, never
merges with another unit, and a unit walking a flow chain keeps its
shape end to end.

- **Mix resolution.** `mix(zone, daypart) = normalize(kind_mix[kind] ×
  daypart_mix[daypart])` — element-wise product, renormalized. The kind
  carries the venue's social grammar (a bar leans duo/cluster; a clinic
  corridor leans lone); the daypart carries the hour's (commute is lone
  business; evening is accompanied). Overnight is lone-only by
  construction — a cluster at 3 a.m. reads wrong, so the math makes it
  impossible.
- **Budgets still count bodies.** A cluster is 3–4 bodies toward the
  zone band; the +N tail counts heads, not units. The ≤3-interactive
  cap counts a unit *once* — a family at the counter is one
  interaction, not four.
- **Family shape.** A cluster may roll `shape: family` (share per zone
  kind in `family_share`): ≥1 adult-anchor silhouette plus a `stroller`
  or `kid-backpack`. Family clusters exist only in
  open_air/shop/cafe/civic/stand/restaurant zones, never in bars, never
  overnight or night. **Kid-scale silhouettes never appear lone, never
  pair with a lone adult unit, and never enter a bar.** The kid is a
  shape in a group, never a pawn anyone could follow.
- **Same anonymity.** Units carry the full extras exclusions — no id,
  no ledger, no feed read, no memory encoding. Costume cohesion, not
  identity: the linked-elbows pair is a read, not a relationship.

Spawner contract addition: `groupUnit(day, zone, spawnIndex) ->
{size, shape, gait}` — deterministic under the same hash as
`extraLook`; the spawn draws the unit first, then the silhouettes.

## 24. The counter courtesies (v85)

The greeting matrix says which *named* pawns nod to each other. The
block's warmer texture is what passes between a named ambient and the
anonymous crowd — the cup slid across, the door held. `crowd.json
§courtesies` declares seventeen beats, each a **condition**, never a
dispatch: it can render only while (a) the ambient's resolved row sits
in a listed `during` state, (b) ≥1 extra dwells within arm's reach in
the zone, and (c) the per-ambient cooldown (15–45 min) has elapsed.

The beats are gesture vocabulary — 2–6 seconds, zero dialogue, zero
ledger. Reyes slides a cup rather than handing it; Luz offers the slice
before the sale; Malik counts change into an open palm; Hana wraps the
heel of the loaf a coin lower; Esther passes a newspaper section
sideways to whoever sat down; Kofe braces the box on a hip to hold a
door. Every beat counts as one interactive pawn toward the ≤3 cap, and
beats are suppressed automatically wherever a claim or venue lock
zeroes the extras budget — you cannot hold a door for a cleared room.

Hard bounds, same as everywhere:

- **Minors have no counter.** June and Zee appear in no beat — there is
  no courtesy a teenager can be asked to perform for the camera.
- **The extra stays an extra.** A courtesy creates no handle, no name,
  no memory, no rumor witness. If someone asks "who did Reyes serve?",
  the honest answer is the band word.
- **No beat moves a routine.** Sam's `ctr-chord` can only fire while
  his row already says pitch-work; it never summons him to the corner.

## 25. Boundary additions (v85)

- Unit mix, shapes, and courtesy ids are **internal vocabulary** — the
  wire still says band words and scene labels. A spectator sees a
  stroller pair, never "family cluster"; sees the cup slide, never
  "ctr-cup".
- Groups and courtesies change nothing about persistence: extras
  (alone or in units) are excluded from save state, and a courtesy beat
  writes no history — the Archive never records who held the door.
- The `kid-backpack` silhouette is the only kid-scale vocabulary in the
  palette and it is reachable only through `group_profile.shapes.family`.
  No spawn path produces a lone kid.

## 26. The pull protocol (v99)

Ambients.md says a request may borrow a named ambient as a co-star "in
role, in routine bounds" — but until now nothing defined the loan
itself. `crowd.json §pull_protocol` is the borrow contract: what a pull
is allowed to be, so that co-starring stays cheap, bounded, and legible.

- **Window.** A pull is a 15–90 minute presence loan. Shorter reads as
  teleporting; longer reads as a kidnapping. The window attaches to the
  request's declared hours — never open-ended.
- **Capacity.** One ambient: max 3 pulls/day, ≥60 min cooldown between
  them. The block: max 2 ambients pulled concurrently — a crowd that
  keeps losing its regulars stops reading as a crowd.
- **Bounds.** The loan borrows presence, not geography. A pull may move
  an ambient at most one zone step and only *toward* space the request
  already controls — a claimed resource or a locked venue. Nobody is
  walked across the map; nobody is taken home.
- **States.** Pullable only while the resolved row is a public or
  staffed state (`serve`/`work`/`idle`/`sit`/`rest`/`chat`/`walk`).
  Never from `sleep`, never from `home`, never mid-transit on a flow
  edge — a pawn you can't plausibly stop isn't stoppable.
- **Minors never.** A04 and A20 are not in the pool. A request naming
  them resolves as a decline at screening; their rows never surface to
  the pull resolver at all.
- **Role-bound.** The pull asks the role, not the person — "a barista
  at the counter," never "Reyes running an errand." In-role, in-
  persona, per the co-star rules; the ambient's knowledge stays
  surface-level because it is surface-level.
- **Pipeline.** A pull is an exclusive-class request on the ambient's
  id at the same §11 step as a resource claim — same moderation, same
  review, same attribution rules.

## 27. The coverage layer (v99)

The other half of a loan is the hole it leaves. `crowd.json §coverage`
maps every ambient to the read their post produces while they're
borrowed — three surfaces, all honest:

- **`understudy`** — a working post that can't sit empty gets an extra
  in the silhouette: Malik's register rings under a cousin-shaped
  stranger, Kofe's hot box rides under a second courier, Vera's desk
  answers under a second librarian. The extras layer absorbs the body;
  the signature read (the flat cap, the paring knife) is simply gone —
  a spectator who knows the block notices *who* is missing, not *that*
  someone was dispatched.
- **`sign`** — a post that can't run unattended tells the truth: Luz's
  tarp comes down and the chalk reads "back in 10"; Hana's counter gets
  a ring-bell card; Bex's chair rides a "flash after 4" note. The sign
  is the coverage — no fake labor, no unattended commerce.
- **`open`** — benches, laps, and corner tables just empty. Nobody
  covers a jog; the pigeon bag stays home and the noon feeding falls
  to whoever's nearest (nobody admits who).
- **`pack`** — the minors' row: not a surface, a refusal. The pack
  orbit doesn't bend for a request, and there is no coverage because
  there is never an absence.

Rules the layer enforces:

1. **The post never lies.** A tarped stand reads tarped — never
   "serving." Coverage is the honest-visible counterpart of the
   posture palette's honest labels.
2. **Coverage is a read, not a cost.** Understudy extras come out of
   the zone's existing budget — no +1 spawn, no new identity.
3. **The loan is invisible on the wire.** No feed event names a pull.
   The spectator-facing trace is exactly the coverage read: "back in
   10," a second apron, an empty bench.

## 28. Boundary additions (v99)

- Pull ids, windows, and cooldowns are **internal vocabulary** — the
  wire never says "pulled." What the feed can see is the coverage
  read and, when the scene itself is public, the ambient doing their
  job somewhere a request controls.
- A pull writes **no ledger, no memory, no archive** — ambients stay
  thin while borrowed; the loan is scheduling, not promotion.
- Coverage never covers a seed — there is no coverage surface whose
  read implies a storyline. "Back in 10" is the whole plot.

## 29. The mouths (v113)

Every flow edge so far has ended at a bare `edge` — an unnamed map
boundary. That's where the bookkeeping is thinnest: budgets rise and
bodies appear "at the edges," and an edge could be anything, which is
how ghost towns sneak in. `crowd.json §mouths` names the eight places
a body can actually enter or leave the block — the spawn/despawn
anchors the off-camera rule (§1, extras rule 2) hangs on:

| mouth | kind | reads as |
|---|---|---|
| `m-plaza` | transit | the plaza stairs — the rapid-transit mouth; the block's biggest door |
| `m-stop-22` | transit | the cross-street bus stop — school/worker axis |
| `m-stop-mission` | transit | the corridor bus stop — up-and-down the main drag |
| `m-gate` | institutional | the school gate — weekday windows only, never overnight |
| `m-garage` | vehicle | the garage ramp — cars become pedestrians at the curb |
| `m-curb` | vehicle | the pickup curb — rideshare, drop-offs, the hospital loop |
| `m-stoops` | residential | stoops and courtyard doors — diffuse, the neighbors' own doors |
| `m-west` | edge | the west map edge — the last honest walk-on point |

Mouth rules, all enforceable:

1. **A mouth is a point, not a zone.** It has a position, a direction
   (`in`/`out`/`both`), a live window, and a per-minute cap — no
   budget, no dwell, no scenes. Nobody waits *at* a mouth; they pass
   through it.
2. **Every spawn/despawn cites a mouth.** `flow_edges` entries that
   touch `edge` carry a `mouth` field; a spawn outside a live mouth's
   window is a contract violation, not a style choice.
3. **The gate keeps its shape.** `m-gate` is the only mouth whose
   units may carry `kid-backpack`, and only inside family clusters
   with an adult anchor — the v85 safeguard moved to the doorway,
   where it's enforceable before a body exists.
4. **The stoops are diffuse.** `m-stoops` represents many doors; it
   never produces a crowd of its own, only the trickle of residents
   starting errands — capped low so the block fills from transit, not
   from thin air.
5. **A mouth can go quiet.** `m-gate` outside its windows, `m-curb`
   at 04:00: a live mouth list is a function of daypart and calendar,
   and an idle mouth spawns nothing.

## 30. The pulse clocks (v113)

Mouths are where; pulses are the *when* inside the where. A pulse is a
named, discrete arrival or departure — a train letting out, a bell, a
shift change — that momentarily lifts a mouth's flow above its
background trickle. `crowd.json §pulse_clocks` carries seven:

| pulse | mouth | dir | when | burst |
|---|---|---|---|---|
| `train-discharge` | m-plaza | in | commute, rush, evening, night | 4–9 per cadence (8 min peak / 20 off) |
| `bus-arrival` | m-stop-22 | in | commute, rush, lunch, evening | 2–5 per cadence (10/15 min) |
| `school-bell-am` | m-gate | in | weekday 07:25–08:15 | 6–12 |
| `school-bell-pm` | m-gate | out | weekday 15:05–15:45 | 8–14 |
| `shift-change` | m-curb | both | 06:45–07:15 · 15:00–15:45 · 23:00–23:45 | 3–7 |
| `kitchen-close` | m-curb | out | 22:45–23:30 | 3–6 |
| `last-call` | m-curb | out | 01:30–02:15 | 5–10 |

Rules:

- **A pulse lifts a mouth, never a pawn.** The burst is headcount
  arithmetic at the doorway — the spawner's flow edges then carry the
  bodies into zones per §9. Nothing is routed to a person.
- **Pulses are honest.** `last-call` exists because the bar's open
  hours end at 2; `school-bell-*` exists because the school's open
  hours bound them. A pulse can never fire outside the schedule that
  motivates it — no manufactured rush.
- **The feed never names a pulse.** "train-discharge" is internal
  vocabulary like `fog_season`; a spectator sees the crossing fill.
- **A pulse never moves the named layer.** Ambients arrive by routine
  (§17), mains by their own will. Pulses budget extras only.
- **Departures are pulses too.** `school-bell-pm`, `kitchen-close`,
  `last-call` are `dir:"out"` — mouths admit bodies leaving; the
  despawn side of the ledger is finally as specific as the spawn side.

## 31. The leash (v113)

The last unnamed degree of freedom: what an extra *is doing here*.
`crowd.json §leash` fixes it — every spawned unit draws one entry
intent at its mouth, and the intent bounds the rest of its life:

- **`through`** — passing across the block; ≤2 zones, dwell ≤90 s per
  zone, despawn at a different mouth than entry. The commute's honest
  share.
- **`errand`** — one destination zone, dwell 5–40 min, then out.
  The fruteria line, the minimart run, the pickup order.
- **`dwell`** — the zone itself is the destination; dwell 20–120 min
  under a legal posture (§22), out through any live mouth.
- **`cover`** — an understudy extra under §27; zone-fixed to the
  borrowed post, lifetime equals the pull window, despawn on return.

Leash laws:

1. **The zone set is fixed at spawn.** An extra may visit at most the
   zones its intent declares — it never improvises a new stop. Two
   zones maximum from its entry mouth, matching the §9 flow edge it
   rode in on.
2. **Every mouth keeps a ledger of bodies.** Over any rolling 60-min
   window a mouth's outflow cannot exceed its inflow plus the standing
   resident share — bodies balance at the mouths. The day is a closed
   loop; the spawner reconciles before it spawns.
3. **Despawn honors the unit.** The v85 rule carries: a unit leaves
   together, at a mouth, off-camera. `through` units leave by a
   different mouth than they entered; `errand`/`dwell` units may
   return the way they came.
4. **No re-entry.** A despawned extra stops existing. Walk-chain
   costume continuity (§11) reuses silhouettes, not histories — the
   leash is why the crowd breathes instead of accumulating.

## 32. Boundary additions (v113)

- Mouth ids, pulse ids, and intent names are **internal vocabulary** —
  the wire still says band words and scene labels. A spectator sees
  the stairs let out, never "train-discharge."
- A pulse is a **budget event**, never a dispatch — it can raise a
  mouth's flow; it cannot pick a destination zone for a body, move a
  named pawn, or fire outside its window.
- `m-gate` is the **only** mouth that may emit family-shaped units;
  `m-curb` and the transit mouths never emit kid-scale silhouettes
  overnight. The v85 family rule now binds at the doorway.
- Mouths and pulses write **no ledger, no feed, no archive** — like
  the extras they gate, they are atmosphere plumbing, not state.

## 33. The vacancy layer (v127)

The v99 bench covers *loans*. Promotion is not a loan. When A05, A09,
and A14 became residents S2, S3, S1 (v126), their posts didn't get a
"back in 10" — they stopped being posts at all. `crowd.json §vacancies`
carries the permanent counterpart of `§coverage`:

- **A vacancy never expires and never refills.** The coverage read stays
  up permanently — the bench is occupied when Esther chooses it, the
  counter seat fills when a nurse decides it does — and no new named
  regular is spawned into the hole. `promotion.md` is the only path to
  a named face; the crowd model never mints one.
- **The venue loses the signature, keeps the function.** Mudhaus still
  serves; Needlepointe still inks. What's gone is the one-glance read —
  the folded section, the face-down phone, the flash folder. That's the
  honest cost of promotion: the block loses three fixtures to gain three
  people.
- **Scene conditions re-key to S-ids.** `scenes.when.named` may list a
  resident; the label still describes a *collision*, never a summons.
  Bench parliament now fires when S2 *chooses* the bench next to A19 —
  which means it can genuinely not happen, and a parliament of one (Ray,
  crumbs, no argument) is a true read, not a bug. The evening nurse is
  the same: Asha takes the seat as a person; some evenings she just goes
  home and the scene isn't there.
- **Greetings reroute to the person.** `greeting_matrix` pairs that
  named A05/A09/A14 now name S2/S3/S1 with `resident:true`. The ambient
  still nods — what changed is that the other party is free.
- **Courtesies retire, they don't transfer.** `ctr-section`,
  `ctr-stool`, `ctr-flash` are gone from `courtesies.beats`. A
  resident's gestures are brain-authored; canning them would be the
  costume, not the person. The counters don't get replacement
  choreography.
- **The pull pool shrinks honestly.** `pull_protocol.residents` bars
  S-ids outright — the bench borrows schedules, not people. A request
  about a resident travels the ordinary §11 nudge path and may be
  declined. `res-needlepointe-chair` is retired with it: the chair is
  Bex's appointment book now, and a claim on it would be a claim on a
  person.

## 34. The occasion layer (v127)

`drama.json §bounded_opportunities` owns what an invitation *is*;
`crowd.json §occasions` owns what one does to the *room*. A live public
invitation — a supper table, a wall workday, a cork board — deforms the
extras budget the way weather does: modestly, at the venue, inside its
window. The crowd's job is to make the occasion plausible to walk into,
never to attend it.

- **Budget arithmetic only.** An occasion carries a `zone_mult` ≤1.4 —
  a lift, never a draw. It changes headcount probability, never a route,
  a routine, or a mind.
- **Extras orbit, never attend.** No leash intent becomes "participant."
  An extra may `dwell` near the long table or pause `errand`-pace at the
  cork board; it cannot join, help, applaud, or sign. Attendance is a
  property of people.
- **The named layer answers by routine.** Whether a main, a resident,
  or an ambient is *at* an occasion is their own resolution — the crowd
  model never marks attendance, on the wire or off it.
- **No manufactured rush.** Occasions never touch mouths or pulse
  clocks; they draw from the traffic that exists, like a day shade.
- **The trace is a read, not a residue.** The next daypart may carry
  the aftermath detail — folded leaves stacked by the door, taped edges
  on the wall — as posture/zone flavor. It never scores uptake and
  never names who came. An ignored occasion reads as an untouched room;
  that read is honest texture, not a failure state.
- **Sponsored = organic.** A request-created occasion gets the same
  modesty cap and the same wire silence.

Three standing shapes are authored in `crowd.json §occasions.shapes` —
the Thursday supper table at El Farolote, the Saturday wall workday in
Clarion, the minimart cork board that is always up. They are
*conditions the block may ignore*; the demo's occasion toggle shows the
budget deformation, and the absence of any attendance bookkeeping is
the point.

## 35. Boundary additions (v127)

- Vacancy reads, occasion ids, and shape fields are **internal
  vocabulary** — the wire says band words, scene labels, and (for the
  invitation itself) the public posting. A spectator sees an empty
  north bench, never "vacated_to S2."
- A scene keyed on a resident is still only a **description of
  collision** — if the resident isn't there, nothing is dispatched.
  Promotion made several standing bits *rarer and truer*, which is the
  correct outcome.
- Occasions write **no ledger, no memory, no archive** — the
  opportunity record lives in the drama layer; the crowd contributes
  only room tone and aftermath reads.
