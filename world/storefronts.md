# The Storefront Layer — "The Mission" (world v44)

The copy a camera reads. `world/storefronts.json` carries the literal text on
every door-having venue: fascia sign, window glass, menu/chalk board, sidewalk
A-frame, flyer-board postings, neon, and the closed-door note. Where the
Directory (`directory.html`) is the registry view — hours, staff, affordances —
this layer is the **paint on the glass**: what a paused frame of the spectator
feed actually says.

Internal posture tool for now: `world/storefront.html` renders the layer with
clock/day/weather scrubbing. At merge it is the authoring source for the art
track's fascia/menu-board/flyer draws (art v43 added the storefront glass box,
menu board, and neon OPEN — this file is the copy those surfaces carry).

## 1. What a storefront carries

| Field | What it is | Render target |
|---|---|---|
| `fascia` | the big sign over the door | art fascia bake (`sfDisplayName` side) |
| `window` | painted/decal lines on the glass | street-view window band |
| `board` | the menu or price chalk inside | interior menu board (art v43) |
| `aframe` | sidewalk sign lines, one live at a time | street-view prop text |
| `flyers` | bulletin-board postings | window/board clutter + rumor nodes |
| `neon` | the lit sign, or null | dusk/night glow |
| `closed_note` | the sign when the door is shut | closed-state glass text |

## 2. Condition vocabulary (`when`)

A-frame and flyer lines may carry a `when` key from `when_keys`:
`rain`, `heat`, `sat`, `thu`, `late` (after 22:00), `morning` (before 11:00),
`sun`, `closed`. Resolution: the first matching conditional line wins; if none
match, the base pool (`when: null`) rotates by hour. **Conditions, never
scripts** — a rain line exists because rain is a fact the sidewalk reflects;
nothing schedules it, and the sim owes no beat.

This is the same contract shape as the ambient week (v43): variants resolve
over a base pool, and the resolved read is a display, not a directive.

## 3. Copy rules

- **Parody names only** — every proper noun is a registered parody business or
  a real civic landmark in scenery posture (businesses.md §4). Cross-references
  between venues are welcome when the web already links them (Malik's flyer for
  the Dusty Spine free box; the 600 Club nodding at the Farolote burrito line).
- **Game dollars only.** Board lines may carry prices; they are in-world money.
  No credit figures, no USD framing, ever (prices gate).
- **Doors only.** Anchor + street tiers get storefronts. Offstage (Flying
  Pannier, MuleIt, Nimbus9, Mission Unfiltered) and reserved names (La
  Esperanza, the spares) carry none — a blog has no fascia, and a restaurant
  that exists only in a notebook has no sign yet. If La Esperanza ever opens,
  minting its storefront is part of the earned world-event.
- **Flyer boards are rumor surfaces, not secret channels.** Flyers may gesture
  at public texture (lost cats, drummer wanted, roommate inquiries) but never
  encode a secret or a script — Mission Unfiltered never appears on a board.
- **Closed notes are in-voice.** The door is where a business gets to be a
  little human ("SOLD OUT — the ovens rest. see you 7:00.").

## 4. Coverage contract (enforced by audit.js biz gate)

- Every business with `tier` `anchor` or `street` must have a storefront entry.
- No storefront may exist for `offstage` or `reserved` tiers.
- `when` values ⊆ `when_keys`; `flyers`/`aframe`/`window` may be empty where a
  venue plausibly has no board (Il Delfino keeps a clean window).
- `storefront.html` inline `STO` block is a hand-synced deep mirror of
  `storefronts.json` — same discipline as BIZ/WEB.

## 5. Note for other tracks

- **Art:** `fascia` strings are display names, not code keys — the mapping
  layer (`30a_sf_names.js` → `sfDisplayName`) still owns POI→name resolution.
  This file says what the sign *says*; it does not mint names.
- **Game-systems:** `aframe`/`flyers` are ambient flavor pools — read-only
  display material, never feed events. Flyer boards at Malik's and Golden Hour
  are already named rumor nodes in the web (`gossip_route`); the flyers are
  their visible payload.
- **Marketing:** this file is internal. Copy may quote storefront lines in
  social drafts once they ship — they are public-clearance text by design.
