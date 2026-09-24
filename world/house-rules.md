# The Fine Print — house rules layer (world v114)

> **Layer position:** the parody-business registry (`businesses.md`) says what
> a venue *is*; storefronts (v44) say what the glass *shows*; menus (v72) say
> what it *sells*; permits (v100) say what paper it *hangs*. This layer says
> how the room *behaves* — the policies and posted signs a camera reads
> taped to the door, and the structured facts a brain needs before it writes
> anyone walking through that door.

Machine mirror: `world/house-rules.json`. Internal demo:
`world/rules.html` ("The Fine Print"). Naming authority is unchanged —
every venue referenced is a registered parody business; the layer invents
no new names.

## 1. What the layer is for

Real venues run on unglamorous policy: cash only, $5 card minimum, restroom
code on the receipt, no laptops on weekends, dogs on the patio side. These
are the lines that make a simulated room feel *run* rather than rendered —
and they are exactly the constraints an AI brain needs when a character
reaches for a laptop, a dog leash, a card, or a restroom door.

Two surfaces per door:

- **`house`** — structured facts, closed vocabularies, machine-readable.
  This is the layer the brains consume: `wifi:"receipt"` is a fact about
  the world, not a line of dialogue.
- **`posted`** — the literal sign copy a camera can read, each line pinned
  to where it hangs (`where` ∈ `where_keys`). This is the layer the art
  track and storefront pass consume: real taped-sign texture, authored
  once, consistent forever.

## 2. Coverage and keys

- **Doors only.** `doors` keys equal the anchor+street tier business ids
  exactly — all 20. Offstage organizations (Flying Pannier, MuleIt,
  Nimbus9, Mission Unfiltered, Calle Justa, The Rent Table) have no door.
  Reserved names (La Esperanza, The Watchbird, Café Cometa) have no door
  yet — if one earns a door, it earns rules in the same version.
- **Full house.** Every door carries every `fact_key` exactly once. A
  venue with no wifi policy still says `wifi:"none"` — silence is not a
  policy.
- **Closed vocabularies.** `fact_keys` and `where_keys` are the only legal
  values. New vocabulary enters through this file first, same flow as new
  business names (registry → signage → cards).

## 3. Consistency rules (audit-enforced)

The two surfaces must agree with each other and with the layers beneath:

- `pay:"card_min"` requires `pay_min` (a game-dollar number) **and** a
  posted sign naming the minimum — a policy nobody posts doesn't exist.
- `pay:"cash_only"` requires a posted CASH sign.
- `restroom:"code"` requires a sign at `restroom_door` or `register`.
- `wifi:"receipt"` requires a posted sign pointing at the receipt.
- `tab:"regulars"` requires at least one tab row for that venue in
  `regulars.json` — the fine print can't invent a tab the house doesn't
  already keep.

## 4. Bars

- **No people.** Signs and facts never name cast or regulars. "Ask the
  counter" is the whole sentence. (The one tolerated genre: the wearily
  specific "YES, YOU." — addressed to the reader, never to a neighbor.)
- **No scripts.** A rule is a condition on the room — what the space
  permits or charges. It never instructs a character, never predicts an
  outcome, never carries a `when X then Y`. `linger:"rush_limit"` bounds
  the room during the rush; whether anyone is asked to move is the brain's
  call.
- **Money policy only.** The only money figure in the layer is `pay_min`.
  Card minimums are policy, not prices — menu prices live in `menus.json`,
  board lines live in `storefronts.json`, and the three never disagree
  because each owns a different surface of the same door.
- **Sign tone.** Posted copy reads like a real taped sign: terse, slightly
  weary, occasionally funny. No legalese, no numbered policies, no brand
  voice.

## 5. What the layer is NOT

- Not pricing. Not a menu. Not a permit. Not a script.
- Not the rumor layer — a posted rule is public knowledge with zero
  knowledge cost; it never feeds `house_knows` or the gossip routes.
- Not editable by characters. Avenues for change (a venue going card-only,
  a laptop policy softening) are world events authored here first, the
  same way La Esperanza must earn its door.
