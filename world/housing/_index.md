# Housing — building cards (world v3)

`world/jobs-housing.md` §3 is the canonical registry table + JSON seed.
This directory is the **depth layer**: what each building is like to live
in — quirks, neighbors, sound, light, maintenance texture — written so an
AI can play a resident, a visitor, or the landlord's Tuesday-repair loop
consistently.

Field discipline:

- **SURFACE** — what anyone who visits/lives there knows: the stairs, the
  smell, the quirks, the neighbors as seen from the hall. Briefing-safe.
- **REGISTRY NOTES** — lease-facing facts (rent amounts, control status,
  landlord-view flags). These mirror `jobs-housing.md` §3; on conflict,
  that file wins. Registry notes are *admin/landlord-context*, not
  spectator broadcast — a resident's rent is their business, though
  neighbors always half-know.
- **No SECRETS.** Tenant drama seeds live in bibles, not here. A building
  card may say "Unit 3's tenants dispute a rent raise" (it's on the lease
  ledger) but never why a marriage is strained.
- All addresses are fictional 9xxx per `rw-address-system-spec.md` —
  place, not person. Tenants change; the building's character persists.

## Files

| File | Address | Units | Tenants (registry) |
|---|---|---|---|
| `9418-guerrero.md` | 9418 Guerrero St | A (2BR), B (1BR, LISTED) | A: Carmen (+Jules's room); B: listed |
| `9457-guerrero.md` | 9457 Guerrero St | 1, 2 (LISTED), 3 | 3: Priya + Marcus |
| `9127-capp.md` | 9127 Capp St | A–D studios | C: Marisol; A: listed |
| `9263-geneva.md` | 9263 Geneva Ave | Unit 4 (2BR) | Reyes cousins; Dani's room share |
| `9344-folsom.md` | 9344 Folsom St | Unit 1 studio | Tomás |
| `9102-mission.md` | 9102 Mission St | Unit 2 (1BR) | Victor (owner-occupied) |
| `listings.md` | — | — | Player-facing listing copy for all LISTED units + the 5-tier listing ladder |

## Living-there rules (apply everywhere)

- Victor owns the two Guerrero buildings + his own Mission St building;
  the other buildings are owned by the landlord game-role (registry
  `owner_id: "landlord"`). **Formal landlord casting stays TBD** — cards
  never assume it.
- Rent is texture, not plot (user-locked). Cards describe buildings, not
  payment drama — the contested raise at 9457-3 is registered once, as a
  ledger fact, and not dwelled on.
- The maintenance loop is real texture: Victor's Tuesday repair table
  serves his own buildings; other buildings' fixes go through the
  landlord admin layer. A dead heater is a real object with a real
  timeline.
- Player-hired characters enter housing through `listings.md` — the
  apartment hunt is a first-week flow, not a scene.
