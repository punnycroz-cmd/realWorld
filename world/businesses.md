# Parody Business Registry — "The Mission" (world v0)

Canonical business names for the living world. **Locked rule (design §11,
user 2026-09-22):** business names are parody — GTA-style imitation — never
real SF business names. Street names and public landmarks (Dolores Park,
Clarion Alley, SF General, Mission High, the library, post office, police
station) stay real — they are geographic facts with no defamation surface.

This file is the **maintained parody-name list** the other tracks consume:
- **Art track** — signage art and painted storefronts use these names only.
- **Game-systems** — feed text, request types, venue locks use these names.
- **Marketing** — site/social/store copy uses these names only (inbox
  user-decision 2026-09-22). No real SF business names anywhere public.

---

## 1. Code-name → canonical-name mapping

`src/data/sf_map.js` carries ~800 POIs with real OSM names, and
`src/sf/30_sf_world.js` + `src/sf/33_sf_cast.js` key routines and lookups on
those strings (e.g. `sfFindPOI('Tartine Bakery')`). **Do not rename the code
keys** — routines, tests, and interiors depend on them. The fix is a
display layer: `SF_PARODY_NAMES[codeKey] -> displayName`, consulted wherever
a name reaches a player (signage bake, map labels, feed text, briefings,
UI). World-builder owns the map's *contents*; game-systems/art own the
lookup plumbing (world v3 wires this; until then this table is the spec).

Story-adjacent mappings (locked — bibles and ambients already use the
canonical side):

| Code key (SF_POIS / routines) | OSM reality | Canonical display name | Used by |
|---|---|---|---|
| `Haus Coffee` (anchor `haus`) | alias of Cafe La Boheme | **Mudhaus Coffee** | C1 mgr, C2/C3 baristas, A01, A13, routines |
| `Taqueria El Farolito` (anchor `farolito`) | real business | **Taqueria El Farolote** | C8 lead cook, A06 loop |
| `Auerbach Hardware` (anchor `auerbach`) | alias of U-Save Plumbing & Hardware | **Auerbach Hardware** (already fictional — Victor's family name) | C7, A17-adjacent |
| `Bi-Rite Market` | real business | **Buy-Rite Market** | C1 rounds, C5, C8 supplier loop |
| `Bi-Rite Creamery` | real business | **Buy-Rite Creamery** | A06 loop, leisure stops |
| `Delfina` | real business | **Il Delfino** | A06 loop |
| `Dolores Park Cafe` | real business | **Dolores Perk** | A05/A19 stops, C5 leisure |
| `Tartine Bakery` | real business | **Baguette About It Bakery** | A16 works bake shift, C5 leisure |
| `500 Club` | real bar (500 Guerrero) | **The 600 Club** | A08/A14 nights, C5 leisure |
| `Dandelion Chocolate` | real business | **Dandy Lion Chocolate Co.** | C5 leisure stop |
| `Valencia Farmers Market` | market name | **Valencia Growers Market** | C8 supplier loop |

Kept real (public institutions / landmarks — not businesses):

| Code key | Display | Why |
|---|---|---|
| `SF General` | SF General | public hospital; C4/A09 workplace |
| `Mission High School` | Mission High School | public school; A04/A20 |
| `Clarion Alley` | Clarion Alley | public alley/mural landmark |
| `Mission Branch Library` (library POI) | Mission Branch Library | public library; A11 workplace |
| `Mission Police Station`, post offices | real | civic, geographic fact |
| `Dolores Park` (all park anchors) | Dolores Park | the stage itself |

---

## 2. Registered businesses (story-adjacent, canonical)

Every business a character works at, owns, owes money to, or spends story
time in. Details beyond the name are world content — safe for briefings.

### Anchor venues (interior-capable, request-targetable)

- **Mudhaus Coffee** — 24th St. Café; the cast's nerve center. Absentee
  owner (off-screen); **C1 Marisol manages**, **C2 Jules** and **C3 Dani**
  barista, **A01 Reyes** pulls shifts. Interior exists (`INTERIOR_NAMES`).
  Venue lock target for exclusive requests; daily crowd scene 7:30–9:30.
- **Taqueria El Farolote** — Mission at 24th. Late-night taqueria;
  **C8 Tomás** is lead cook. Interior exists. Salsa-bar counter scene,
  post-bar rush. (Parody: farolito = little lantern; farolote reads as the
  big, slightly goofy version.)
- **Auerbach Hardware** — Mission St. Victor's family store (third
  generation); residential flat upstairs (9102 Mission St, Unit 2 — his
  home). Interior exists. Tuesday-repair staging ground for the landlord
  storyline.
- **Dolores Perk** — park edge. Park-adjacent café tables; interior
  registered. Ambient sit-spot (A05 Esther, A19 Ray).

### Street-facing businesses (no interior yet — signage + counter window)

- **Buy-Rite Market** — 18th St grocer; cast grocery runs. (Parody of
  Bi-Rite: same cadence, blunt spelling.)
- **Buy-Rite Creamery** — sister ice-cream window; perpetual line, park
  spillover.
- **Il Delfino** — California-Italian dinner spot on 18th; date-night
  venue, delivery-loop stop.
- **Baguette About It Bakery** — 18th/Guerrero-side bakery; **A16 Hana**
  bakes 4–13. Pre-dawn block anchor.
- **The 600 Club** — Guerrero-side bar; **A08 Sam**'s rain pitch, **A14
  Bex**'s nights, C5 leisure stop. Open-mic-capable venue for player event
  requests. (Parody of the 500 Club — same number-play, different door.)
- **Dandy Lion Chocolate Co.** — Valencia-side chocolatier; treat stop.
- **Valencia Growers Market** — weekly produce market; **C8 Tomás** prices
  suppliers here.
- **Needlepointe Tattoo** — **A14 Bex**'s shop, Clarion-adjacent. (Stitch
  pun; not a real SF shop.)
- **Folsom Auto & Sons** — **A10 Gus**'s garage. (Riffs on the real
  "F. Lofrano and Son" shape — genericized past recognition.)
- **Malik's Mini Mart** — corner store, **A03 Malik**'s counter.
- **Frutería Las Palmas** — **A07 Luz**'s fruit stand, Dolores at 19th.
- **Bloom & Doom Flowers** — **A18 Ida**'s florist; weddings and funerals
  both, which is the joke.

### Off-stage organizations (names only — no venue needed)

- **Flying Pannier Courier Co-op** — **C5 Marcus**'s employer; worker-owned
  courier co-op, rival energy vs the apps. Dispatch is a locker wall, not
  a storefront.
- **MuleIt** — the delivery app **A06 Kofe** rides for. (Stubborn,
  load-bearing, underpaid — the name does the work.)
- **Nimbus9** — **A13 Nadia**'s remote employer; generic cloud-tech
  company, deliberately faceless.
- **Mission Unfiltered** — the anonymous neighborhood blog **C1 Marisol**
  secretly writes. In-world media, not a business with a door; its posts
  are a feed surface. SECRET-adjacent: the blog is public, the author is
  not.

### Reserved fictional names (claimed, not yet on the map)

- **Pupusería La Esperanza** — Tomás's dream restaurant (his notebook
  name). Exists only as a plan + a $6,000 handshake loan from Victor. If
  it ever opens, it's an earned world-event, not a spawn.
- **The Watchbird** — spare bar/lounge name, unassigned.
- **Café Cometa** — spare café name, unassigned.
- **Golden Hour Laundromat** — spare, unassigned.

---

## 3. The long tail — generic signage policy (the ~780 remaining POIs)

The map is real OSM data: ~800 named POIs (136 restaurants, 45
hairdressers, 28 bars, 28 clothes shops, 21 convenience…). Three tiers:

1. **Story-adjacent** (the tables above) — bespoke parody names.
2. **Named national/local chains & notable local businesses** — parody via
   the chain bank below, or fall back to generic.
3. **Everything else** — **generic kind signage**, the GTA look anyway:
   storefronts labeled by what they sell, not a fake proper noun.

### 3a. Chain / notable-name parody bank

| Real name seen in POI data | Parody display |
|---|---|
| Whole Foods Market | **Hole Paycheck Market** |
| Walgreens | **Wallgreen's** |
| McDonald's | **McClucky's** |
| Bi-Rite (any remaining) | **Buy-Rite** variants |
| Starbucks-class coffee | covered by **Mudhaus** / **Dolores Perk** |
| Philz-class coffee | **Buzz Cup Coffee** |
| Bank of America-class banks | **First Merchants Bank of America** → prefer generic "BANK" |
| Chase/Wells Fargo-class | **Goldenvault Bank** → prefer generic "BANK" |
| Dollar/variety chains | **99¢ Plus Ultra** |
| USPS-alike shipping shops | **Mail These Things** |

Chain names drift per neighborhood; treat the bank as examples, and prefer
generic labels whenever the joke isn't carrying the scene.

### 3b. Generic kind-signage table (art track: use verbatim)

For any business POI without a mapped parody name, render signage as its
kind label — uppercase, no proper noun:

| OSM kind | Signage | OSM kind | Signage |
|---|---|---|---|
| restaurant | TAQUERIA / COMIDA / DINER (pick per cuisine tag) | hairdresser | CUTS / SALON |
| cafe | CAFÉ / COFFEE | bar, pub | BAR / CANTINA |
| fast_food | BURGERS / FRIED / SLICES | bakery | PANADERÍA / BAKERY |
| ice_cream | ICE CREAM | convenience | MARKET / LIQUOR |
| supermarket | GROCERY | clothes, boutique | VINTAGE / THREADS |
| tattoo | TATTOO | florist | FLOWERS |
| car_repair | AUTO REPAIR | pharmacy, chemist | PHARMACY |
| books | USED BOOKS | laundry, dry_cleaning | LAUNDRY |
| dentist, doctors, clinic | DENTAL / CLINIC | hardware | HARDWARE |
| gym/fitness/sports_centre | GYM | bank, atm | BANK / ATM |
| hotel, guest_house | HOTEL | jewelry | JEWELRY |
| nightclub | CLUB | cannabis | DISPENSARY |
| massage, spa | SPA | pet*, veterinary | PET SUPPLY / VET |
| gift | GIFTS | second_hand | THRIFT |
| funeral_directors | (no signage — never rendered comedic; leave facade blank) | tobacco | SMOKE |
| other/unknown | SHOP or none | | |

### 3c. Civic & worship

Schools, library, post office, police, hospital, and places of worship keep
their real names as map labels (public facts). Rule: **they may be scenery,
never story targets** — no fiction attaches to a named real church, school,
or civic office (a wedding "at a church" is fine; a scandal "at St. N" is
not). If a storyline needs an institution with a personality, mint a
fictional one per §4.

---

## 4. Rules for adding new business names (the style guide)

GTA-style imitation, applied to the Mission:

- **Sound-alike mutation:** keep the rhythm, swap the payload — Bi-Rite →
  Buy-Rite, El Farolito → El Farolote, 500 Club → 600 Club.
- **Pun-forward:** Baguette About It, Bloom & Doom, Needlepointe — the name
  is the joke and the category is legible.
- **Blunt poetry:** Dolores Perk, MuleIt, Hole Paycheck — flat affect reads
  realer than cleverness.
- **Never:** a real SF business's actual name; a real person's name on a
  business (unless the person is fictional — Auerbach is C7's surname and
  no real "Auerbach Hardware" exists); a defamatory twist on a real shop
  (parody transforms, it doesn't accuse); real trademark characters/logos.
- **Verify before use:** a two-minute web check that the parody name
  doesn't collide with another real SF business. (Checked at v0: Mudhaus,
  El Farolote, Buy-Rite, Dolores Perk, Baguette About It, The 600 Club,
  Dandy Lion, Needlepointe, Folsom Auto & Sons, Bloom & Doom, Frutería Las
  Palmas, Malik's Mini Mart, Flying Pannier, MuleIt, Nimbus9, La Esperanza,
  The Watchbird, Café Cometa, Golden Hour, Buzz Cup, McClucky's,
  Wallgreen's, Hole Paycheck, 99¢ Plus Ultra, Mail These Things,
  Goldenvault — none are real SF businesses.)
- New story businesses enter through this file first — update the registry,
  then signage. Naming-rights sales to players (monetization plan §3.9)
  use the moderator pre-approval queue and obey this same section.

## 5. Known debt / flags for other tracks

- `SF_POIS`/`SF_MAP` still hold real names internally — intentional; add
  the `SF_PARODY_NAMES` display layer rather than editing map data
  (world v3 task; art signage bake + game feed text must both consult it).
- `INTERIOR_NAMES` in `30_sf_world.js` keys on real names — display labels
  only; keys stay.
- A09's code name is `Priya` in `NV_CAST` (`pa-chars.js`) — collides with
  C4 Priya Raman. World content calls her **Asha**; code rename flagged
  (see `world/ambients.md` A09 note).
- Cast-bible-era addresses (744/750 Guerrero, Capp St studio, Geneva Ave
  flat) are superseded by 9xxx numbers per the address spec — see
  `world/characters/_index.md` and `world/jobs-housing.md`.
