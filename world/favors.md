# The Favors Layer — "The Counter Tab" (world v128)

The business web (`businesses.json → web`, v30) says how venues' rooms *flow* —
supplies, spillover, rivalry, gossip routes. The regulars layer says who the
house *knows*. This layer says **who owes whom**. `world/favors.json` registers,
per door-having venue, the informal arrangements that run on memory rather than
invoices: spare keys held, shifts covered, running tabs, standing holds, lent
equipment, watched doors, passed culls, favors owed.

Internal posture tool: `world/favor.html` ("The Counter Tab") renders the
registry with a clearance toggle — the same discipline as BIZ/WEB/REG: the
inline `FAV` block is a hand-synced deep mirror enforced by the audit `favs`
gate.

## 1. Why this layer exists (production-3 mapping)

The Astra review's four load-bearing dimensions land on businesses here:

- **Interdependence** — every arrangement names `carries`: the party bearing
  the standing cost. Another character's choice (keeping the held table, or
  letting it go) materially changes someone else's day.
- **Unequal knowledge** — `visibility` stratifies who knows: `open` is readable
  from the room, `counter` is staff-side, `quiet` is between the parties. A
  regular may know Carmen's tab exists without ever knowing the drawer holds
  Folsom's key.
- **Limited capacity** — a lent projector, a covered shift, a held booth are
  time and money. The `carries` field is the cost made legible.
- **Self-chosen projects** — several arrangements *are* projects-in-miniature:
  Dani's chalkboard tab, the cull crate chain, the venue chairs at the Workers'
  Table. Each can be honored, renegotiated, or allowed to lapse.

Every entry is a **condition, never a script**. An arrangement is a standing
invitation someone may honor or drop; the shared-meal test applies — if the
day-old crate sits untouched at open, that is a readable anomaly, and whether
the miss is repaired is the character's call, not this file's.

## 2. Schema

```json
"arrangements": {
  "<venue-id>": [ {
    "id": "fav-<tag>-NN",          // unique; <tag> is a short venue tag
    "kind": "key_holding|shift_cover|tab_line|lend|hold|watch|pass|favor_owed",
    "between": ["<venue-or-person>", "<venue-or-person>"],  // ≥2 parties
    "carries": "<party in between>" | "staff" | "both",
    "since": "one line — the origin a counter would tell",
    "terms": "the arrangement as the house would state it",
    "balance": 14.5,               // tab_line only; game dollars ≥ 0
    "note": "what a camera could notice — the texture",
    "visibility": "open|counter|quiet"
  } ]
}
```

- **`between`** may mix business ids (any registered business, including
  offstage orgs — a clinic can borrow chairs even though it has no door) and
  person ids (`c1`–`c8`, `s1`–`s3`, `a01`–`a20`). The keyed venue must appear
  in `between`. Obligations attach to **people**, not roles: `fav-ndl-01` names
  `s1` (Bex), not "the shop."
- **`carries`** names who bears the standing cost — the float risk on a tab,
  the schedule a borrowed lift wrecks, the drawer a key sleeps in. `"staff"` =
  the keyed venue collectively; `"both"` = genuinely mutual (a key swap).
- **`since`** is required. An obligation has a past — consequence continuity
  starts with the date the kindness happened.
- **`balance`** — game dollars, `tab_line` only. No credit figures, no USD,
  no prices elsewhere in the layer.

## 3. Visibility contract (enforced by the audit `favs` gate)

| Visibility | Who plausibly knows | Surfaces |
|---|---|---|
| `open` | a regular would know | any clearance |
| `counter` | the staff side; a customer would not | internal + staff-brain contexts |
| `quiet` | the parties only | internal only — **redacted on public clearance**, same rule as `secret` web edges |

`quiet` entries are obligations, not drama seeds — the wording bar bans
`secret`/`seed`/`unfiltered`/`possess` vocabulary and all money figures
outside `balance`. A quiet arrangement is discoverable in-world by watching
(the drawer, the key run), never by reading a feed.

## 4. Coverage contract (enforced by the audit `favs` gate)

- `arrangements` keys ⊆ door-tier business ids; **every anchor and street
  venue carries ≥1 arrangement**; offstage and reserved venues carry none —
  but they may appear *inside* `between` (Calle Justa borrows chairs).
- `id` matches `^fav-[a-z0-9]+-\d+$` and is globally unique.
- `between` has ≥2 distinct parties; the keyed venue ∈ `between`.
- `carries` ∈ `between` ∪ `{staff, both}`; `both` only when `|between| == 2`.
- `kind` ∈ `kind_keys`; `visibility` ∈ `visibility_keys`.
- `since`, `terms`, `note` are non-empty strings; banned vocabulary and
  money figures (`$`, `cr`, `USD`) never appear in them.
- `tab_line` ⇒ `balance` present, number ≥ 0; no other kind carries `balance`.
- `favor.html` inline `FAV` is a deep mirror of `favors.json`; the public
  clearance path redacts `quiet` rows.

## 5. Relationship to existing layers

- **`web` edges** describe flows; **arrangements** describe obligations. Many
  ride an existing edge (Farolote↔Delfino shift cover on the rivalry edge,
  Malik's↔Golden Hour watching on the gossip route) but neither requires the
  other — an edge can be pure traffic, an arrangement can live between a shop
  and a person.
- **`regulars`** is who the house knows; **`favors`** is what the house is
  committed to. A regular's `tab` and a favor's `tab_line` coexist
  deliberately: the regulars layer is customer-side texture, this layer is
  the ledger of the ask.
- **`occasions`** (crowd.json v127) are public invitations at room scale;
  arrangements are bilateral and persistent — an occasion lapses at the end
  of its window, a favor lapses when someone lets it.

## 6. Notes for other tracks

- **Game-systems:** read-only brain texture. A `carries` party under pressure
  (a missed crate, a called-in key) is a legitimate consequence surface —
  the arrangement must never be *auto-satisfied*; honoring it is a choice.
- **Memory:** arrangements are exactly the "who keeps track of what"
  `holder` material — the counter that holds a key is a directory node.
- **Art:** nothing painted — `note` strings describe objects a camera can
  already see (the crate by the back door, the hook rail, the vase count).
- **Marketing:** `open` rows are safe to quote; `counter`/`quiet` are not.
