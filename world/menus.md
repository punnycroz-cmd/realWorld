# The Menu Layer — "The Mission" (world v72)

The counter sells. `world/menus.json` carries the orderable catalog for every
door-having venue: item name, price in **game dollars**, category, availability
condition, signature flag, and one line of counter-voice note. Where the
Storefront layer (`storefronts.md`) is what the sign *says*, this layer is what
the counter *sells* — the machine-readable catalog behind the board copy.

Internal posture tool for now: `world/menus.html` renders the layer with
clock/day/weather scrubbing (same vocabulary as storefront.html). At merge it
is the item/price source for the game side's commerce layer and the future
order-something request type (a request can spend a character's game dollars on
a listed item — never a price invented at runtime).

## 1. Item shape

```json
{ "name": "drip", "price": 3.5, "cat": "drink", "when": null, "sig": false,
  "note": "the volume seller; refills are a negotiation, not a policy" }
```

| Field | Rule |
|---|---|
| `name` | what you'd say at the counter; lowercase, no proper nouns beyond the venue's own parody name |
| `price` | number ≥ 0 in game dollars, **or** the string `"ask"` for market-priced / verbal items. `0` is for things the house gives away on purpose (tasting square, free box, open-mic slot). |
| `cat` | one of `cat_keys`: `drink` / `food` / `goods` / `service` / `counter` |
| `when` | one of the storefront `when_keys` or `null` — a CONDITION the shelf reflects, never a scheduled script |
| `sig` | exactly what the room is known for; **≥ 1 per venue** (the order a stranger should guess first) |
| `note` | one line of counter voice; surface-safe, ≤ ~140 chars |

## 2. Coverage contract (enforced by audit.js `menus` gate)

- **Doors only.** Every business with `tier` `anchor` or `street` carries a
  menu; `offstage` and `reserved` carry none — same rule as storefronts and
  regulars. A blog has no catalog; a restaurant in a notebook has no prices.
- **Board agreement.** Any menu item *named* on the venue's storefront
  `board` must carry the same price there and here — the chalk and the ledger
  never disagree. (The board may list things the menu doesn't — jokes,
  warnings, "ask" lines.)
- **`when` ⊆ `when_keys`** (rain/heat/sat/thu/late/morning/sun/closed).
  `closed` means orderable while the door is shut — pre-orders, drop-offs,
  voice mail.
- **≥ 4 items per venue, ≥ 1 `sig`.**
- **Game dollars only.** No credit figures, no USD framing, no surge or
  dynamic pricing — the price is the price.
- **Surface-safe copy.** Names and notes pass the same banned-vocabulary
  sweep as regulars (no secrets, no seeds, no meta-economy terms).
- `menus.html` inline `MENUS` block is a hand-synced deep mirror of
  `menus.json` — same discipline as STO/REG.

## 3. What the layer is for

- **Game-systems:** the commerce substrate — a character with game dollars
  can buy a listed item; an unlisted thing is a conversation, not a
  transaction. `sig` items give feed copy its nouns ("ordered the usual" is
  renderable only if the usual exists).
- **Requests:** a future "send/buy" request type spends the target's in-world
  money on a listed item at a listed price — no new prices minted at runtime.
- **Art:** `board` copy on storefronts stays the *display*; this is the
  *truth* behind it. Interior menu boards can render from this layer.
- **Marketing:** menu lines are public-clearance copy like storefront lines.

## 4. Boundaries

- Conditions, never scripts — `when` reflects weather/day/hour, and nothing
  obliges a character to order anything.
- No secret stock, no favoritism prices, no requestable mischief items.
- Prices are proposals of *in-world texture*, not the monetization plan —
  credits never appear here.
