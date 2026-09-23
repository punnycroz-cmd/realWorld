# Crowd Sim — the block's population model (world v15)

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
