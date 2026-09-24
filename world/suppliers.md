# The Supply Layer — "the back door" (world v86)

`world/suppliers.json` registers the **offstage wholesale and trade
suppliers** whose trucks make the neighborhood legible: who restocks what,
through which door, in which window. Internal demo: `world/supply.html`.

The directory shows where the neighborhood *spends*; the supply layer shows
where it *comes from*. Every menu item, flyer board, linen cart, and keg on
the corridor is downstream of a run listed here.

## 1. What a supplier is

- **Offstage.** No door, no POI, no interior, no `businesses.json` entry, no
  card, no directory row. Suppliers are vendors, not destinations — the same
  reason the directory stays door-facing while Calle Justa and The Rent
  Table (organizations *of* the neighborhood) appear.
- **Unstaffed by cast.** Drivers are unnamed extras — offscreen labor. No
  cast id may appear in any supplier field. (Flying Pannier and MuleIt are
  *jobs*, not suppliers — they deliver for platforms, and Marcus/a06 are
  neighbors who work them, not vendor staff.)
- **Parody names only.** Same rule as every business name (design §11).
  Nineteen names minted at v86 — see `suppliers.json → suppliers`.

## 2. What a run is

A `runs[]` entry: `{supplier, to[], days[], hours:[a,b], drop, note}`.

- **`to` — door-tier venues only** (anchor + street). Suppliers do not
  deliver to other suppliers, to offstage orgs, or to reserved names.
- **`hours`** is a delivery window in world-clock hours. It may **precede
  open by up to 3h** — pre-open drops are the norm — but must end before
  close, and `days` may only list days the venue actually opens.
- **`drop`** is the physical landing spot (front door, back gate, curb,
  side gate) — the camera-legible part.
- **`note`** is texture: what the run *reads like* from the sidewalk.
- **Conditions, never scripts.** A run is a window the routine system may
  satisfy — it can be late, early, or missed, and a missed Green Crate run
  is a readable anomaly, not a broken script. The truck is texture; the
  door-open is the venue's own behavior.
- **No prices.** Invoices stay offscreen — no game dollars, no credits, no
  contract terms in supply copy.

## 3. The flyer's circuit

`hot-off-press` carries a multi-stop run (`to` is a list): Thursday midday,
one shoulder bag, five counters — Dusty Spine, Marooned, Needlepointe,
Golden Hour, the 600 Club. This is the physical substrate under the
`gossip_route` web edges: the flyer boards those venues keep (storefronts
layer, v44) are restocked by this walk. The circuit is a *route condition* —
it does not oblige anyone to read a flyer.

## 4. Valencia Growers is exempt

`valencia-growers` carries no runs — it *is* the supplier. Its upstream is
farms off the map, and a truck delivering to a farmers' market would be a
delivery to a delivery. The `exempt` table in suppliers.json states this;
the audit gate enforces coverage for every other door.

## 5. Feed vocabulary

`feed_shapes` holds four templated lines under feed kind `venue` — the only
kind a truck may occupy. A supplier is a name on a truck's flank, never a
story beat: no named drivers, no arrival events about people, no secrets.

## 6. Boundaries

- Suppliers never enter `businesses.json`, the directory, or the web edge
  graph (venue↔venue only — the runs *are* the edge layer for supply).
- No fabricated real-world claims: supplier names are fictional; no real
  San Francisco wholesaler is referenced or implied.
- All names/vocabulary are spectator-legible — a truck on the street is
  public texture. Nothing here is secret-tier.
- At merge this layer is the copy source for the art track's delivery
  vehicles and street texture, and the brain layer's invoice/delivery talk.
