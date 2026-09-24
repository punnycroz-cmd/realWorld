# What's New — build highlights for coverage

For "what changed" pieces, update posts, and second-look coverage. Each
entry names the renderer build the screenshots encode — the filename is
the build (`screenshots/v75-*.png` = build v75). Everything below is
verifiable in the current captures; nothing here is a promise about
future work.

Current development build: **v75** (September 2026).

---

## The short version

Since the v55 editorial set, ten more passes landed:

- **v56 — the far field.** The skyline got a sky: a stratus deck and
  far-field cloud layer behind the rooftops, so the neighborhood sits
  inside weather instead of under a flat backdrop.
- **v59 — after the rain.** The wet-weather pass: speckled damp
  pavement, ponding on flat roofs, stringcourses catching light at
  every floor line. The block reads like it just rained, because it did.
- **v61 — weather you can see coming.** Distant cumulus shower cells
  render on the skyline — columns, downwind anvils, wind-leaned rain
  shafts, virga when the rain never reaches the ground. Heavy marine
  intrusion now wets pavement even when it isn't raining (fog drip).
  And the Dolores Park overlook was re-framed: perimeter streets and
  two rows of facades now ring the lawns, so the park reads as a park
  inside a neighborhood.
- **v64 — the sidewalk gets its furniture.** Cast-iron tree grate
  wells — frame, soil slot, grate bars, a sun-side rim glint — under
  every street tree in both views, plus round water-meter covers and
  rectangular vault panels set into the sidewalk decal cells. This set
  also carries the v63 wall-impostor atlas: facades bake to a cached
  atlas and draw from it on the street pass, same painted fronts at
  roughly half the per-frame canvas work.
- **v65 — the street dresses up.** Parklets in the parking lane by
  select doorways, bin rows on a sixth of the frontages, papel-picado
  catenary garlands and wall-bracket porch flags on the facades — all
  of it wind-driven off the same W.windAng/W.windSpd the weather uses,
  so the bunting flutters when the wind picks up.
- **v68 — the rig gets a monitor.** Picture-in-picture: a parked
  camera rig composites its live feed into the corner of the main frame
  with LIVE/REC chrome — rooftop over the park, the Dolores overlook,
  the Mission street — so a spectator can keep one eye on a second angle
  without leaving the shot they're watching. And a footprint that
  straddles the near camera plane now dissolves into a cutaway wire rim
  instead of hanging a roof wedge in the gate.
- **v69 — light through the leaves.** Canopy dapple: leaf-gap sun flecks
  clipped inside each tree's thrown shade, jittering with the gust
  envelope, in both the top-down crown shade and the street elevation.
  The same weather gates it as everything else — cloud shadow, canyon
  shade, day, night.
- **v70 — the dollhouse pass.** Inspect a resident who's indoors and
  their building ghosts to a quarter of itself while a real floor plan
  draws inside the footprint — door-anchored rooms, per-archetype floors
  and furniture, party walls on wide buildings, a sun patch through the
  sun-facing wall, lamp pools after dark. Occupants stay the same chibi
  pawns, still tagged, still readable; the spectator just gets a closer
  set.
- **v71 — the block stands on its shadows.** The top view gains a
  per-building shadow pass: each footprint throws a real swept shadow
  along the sun vector — penumbra layers, a displaced roofprint fill,
  an AO contact skirt at the base — culled against the view and gated
  by night, day, and cloud cover like everything else. Buildings stop
  floating on the map; the block reads planted.
- **v72 — the walls declare a material.** Facades stopped being one
  painted skin: a material registry now tags each wall — brick, painted
  brick, clinker, scored stucco — and the street pass renders what the
  bake declares: masonry bond joints, stone quoins and soldier-arch
  lintels, wrought-iron balconies, canvas awnings, and ghost signs
  faded into the brick. The fronts read like different buildings now,
  not one texture with different colors.
- **v73 — the sidewalk earned its scars.** The ground pass gains wear:
  joint grids and mid-scores on the walk cells, gum-spot constellations
  clustered at doors and crosswalk funnels, hairline cracks, threshold
  polish where feet actually land, and trench-scar patches running
  along the road. The pavement looks walked on because the sim knows
  where people walk.
- **v74 — wash day, simulated.** Sagging laundry lines on hashed
  residential fronts, garments penduluming per-phase in the wind with
  sun-shifted shade quads; open parlor sashes with breathing curtains;
  cornice-pigeon roosts that ground themselves in rain and at night.
  The v65 pennants and flags now swing per-phase instead of holding a
  frozen wave.
- **v75 — the fronts went green, and the wind learned to travel.**
  Living walls: ivy and bougainvillea strands climb the residential
  fronts — magenta bracts where the sun hits — with balcony gardens
  trailing inside the balcony gate. Wildflower "meadow" decals stipple
  poppy and lupine drifts across the free grass. And the breeze is now
  a field: a gust crest advects downwind through trees and leaning
  facades as one traveling wave instead of each element swaying to its
  own phase.

The v67 pass that came just before is worth its own line:

- **v67 — the lens rebuild.** The camera stopped showing off: lateral
  chromatic fringing, the scanline blur pass, and film grain are all
  retired, and the vignette is softened. What remains is one honest
  number — a visibility distance computed live from the weather — that
  now drives the haze, the marine band on the horizon, and the veil
  over the skyline. The frame is cleaner and cheaper to draw (about
  five fewer full-frame passes). The trees got their own upgrade along
  the way: every crown is grown from a genome atlas, turned by the
  in-world calendar and flipped per instance, so no two read alike —
  and in the current captures the autumn leaf-fall is drifting over the
  block.

Earlier arc (still in the before/after shots):

- **v53 — street furniture & lawn life.** Hydrants, trash cans, news
  boxes, bike racks at the curb; picnic blankets on the Dolores lawns;
  the palm allée and worn desire-lines.
- **v54 — the facade pass.** Window boxes with geraniums, sleeve AC
  units with rust weeps, Juliet rails, house-number plates, mailbox
  rows, stoop pots, sidewalk A-boards.
- **v55 — the September turn.** Ginkgo crowns go gold while others rust
  and wine, mow stripes follow the lawn contours, gusts shake loose a
  drizzle of leaves, litter speckles the sidewalks.

## Why the weather pass matters (the quotable bit)

> In this neighborhood you can watch a storm decide whether to visit.
> Shower cells stand on the skyline twenty minutes out — you can see
> the rain shaft lean with the wind, watch the virga evaporate mid-air,
> and know the block is staying dry before the residents do. The weather
> isn't a backdrop swap; it's a field that moves.

The cell field is simulated (moisture-driven, ~25-minute buckets) — a
distant shower is a thing happening over there, not a skybox texture.

## For before/after coverage

- Pair `screenshots/v1-A.png` (first art pass) against
  `screenshots/v75-A.png` (current) — same top-down framing of the
  block, seventy iterations apart.
- `screenshots/v75-C.png` is the Dolores Park overhead: the telling
  details are the ring of streets and facades — a maintained city park,
  not open field — the crown-genome trees, no two alike, and the new
  poppy/lupine meadow drifts stippled across the lawns.
- `screenshots/v75-A.png` carries the dollhouse headline: the Mudhaus
  Coffee cutaway open on the overhead — the building ghosted, a real
  floor plan inside the footprint, residents still tagged inside it.
- `screenshots/v75-D.png` is the v72–v75 street-level arc in one frame:
  declared wall materials, awnings and ghost signs, living-wall ivy and
  bougainvillea, laundry lines riding the traveling gust field.

## Still true (unchanged by these passes)

- Watching is free; paid agency is time-boxed, publicly logged requests.
- The eight main characters can never be possessed by anyone.
- No voice acting, no loot boxes, no cash-out, no crypto.
- All screenshots are development-build captures — label them
  "in development" when publishing.

Filenames, captions, and credit lines: `captions.txt`. Kit freshness:
`CHANGELOG.md`.
