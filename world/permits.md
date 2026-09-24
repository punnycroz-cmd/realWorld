# The Permit Wall — posted paper + door lineage (world v100)

The registry says what a venue *is*, the storefront layer says what it
*shows*, the supply layer says what arrives at the back door. This layer
says what hangs **behind the counter**: the framed paper every San
Francisco shop accumulates, and the door's memory of who was here before.

Machine mirror: `world/permits.json`. Internal demo: `world/permit.html`
("The Permit Wall"). Registry pointer: `businesses.json → permit_layer`.

## 1. The wall — `walls.<id>.papers`

Every door-having venue (anchor + street tiers — twenty doors) carries a
`papers` array: the certificates, score cards, and permit placards a
camera finds framed or taped near the register. Each paper is
`{kind, text, status?}`:

- `kind` — one of `paper_keys` (business_license, health_score,
  occupancy, workers_notice, resale, liquor_license, entertainment,
  sidewalk_seating, food_handler, weights, auto_repair, tattoo_reg,
  signage). The key list is closed; new paper kinds go through the
  registry update flow like new names.
- `text` — the line the camera reads. Plain, posted, boring on purpose.
- `status` — `posted` (default, omitted), `renewed`, or `pending`.
  **Pending is a receipt, not a violation**: the application is filed and
  the tape holding it up is the whole story (Baguette About It's sidewalk
  tables, The Musket's entertainment permit).

## 2. The rules (enforced by the `perm` gate)

- **Doors only.** `walls` keys equal the anchor+street business ids
  exactly. Offstage orgs (MuleIt, Nimbus9, the Tables…) and reserved
  names have no wall — an app has no counter to hang paper behind.
- **Civic names stay real.** SFDPH, ABC, CDTFA, the Bureau of Automotive
  Repair, SFFD, Public Works, the Entertainment Commission — agencies are
  civic facts, same rule as the library and the post office (registry §3c).
  The parody rule governs *businesses*, not the government that permits
  them.
- **Liquor only where it pours.** `liquor_license` papers may appear only
  on `rules.liquor_venues`. `health_score` only on `rules.food_venues`,
  with the number inside `rules.score_range` — Mission-real scores, no
  fabricated failures.
- **No people.** Papers never name cast or regulars. "Food Handler Cards —
  staff on file" is the whole sentence; a name on a wall would be a leak.
- **No money.** The wall is framed paper, not a ledger — no prices, fees,
  or credit figures.
- **Conditions, never scripts.** A pending status is a readable state the
  sidewalk can notice. Nothing obliges a character to mention it; a
  renewed card is not a story beat.

## 3. The lineage — `walls.<id>.former` + `ghost_sign`

Doors outlive tenants. Each wall records `former`: prior businesses at the
same door as `{name, years, note}` — the note is the physical trace that
survived (the deck oven that came with the lease, the bolt holes in the
awning anchors). `ghost_sign` is the faded painted sign the facade still
carries, or `null` for doors with no wall to paint (the fruit stand, the
market stall).

- **Former names are invented**, parody-adjacent plain names — they are
  the dead businesses of this fictional block, never real SF shops.
- **A ghost needs a tenant.** `ghost_sign` non-null requires ≥1 former
  entry — the wall remembers a tenant, not a rumor.
- **Art handoff.** The ghost_sign strings are the authored copy for the
  render-side ghost-sign pass (art v72+ bakes them; the mapping layer
  still owns POI resolution — this file owns what the faded sign says).
- **Auerbach is the exception that proves it:** its former tenant is
  *itself* under an earlier trade — third-generation continuity is the
  house's whole character.

## 4. What the layer is not

- Not a compliance drama engine. No fabricated violations, no inspection
  horror stories — scores sit in the ordinary Mission range.
- Not a moderation surface. Papers are world texture; the legal backstop
  and §11 request screening are untouched.
- Not player-facing copy. `permit.html` is an internal reference demo,
  same clearance as the Directory and the Back Door.
