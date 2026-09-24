# Ambient Promotion Protocol (world v1)

How an ambient NPC (A01–A20, thin AI) becomes a full character. Promotion
is the **only** path by which an ambient gains an LLM brain — requests can
never target an ambient for upgrade (design §9), and promotion is a
world-design decision (admin action, logged on the public feed like every
admin action per design §3).

## 1. When to promote

Good promotion candidates have: (a) a card whose "Promotion packet" names
a real first arc, (b) established surface relationships with mains or the
request pipeline, (c) compute budget headroom (cast cap is open decision
5 — recommend mains 8 + promoted ≤ 4 initially).

Promote for **story pull**, not crowd needs — the crowd's job is coverage,
and removing a pawn thins a venue. Check `world/crowd-scenes.md` §1/§2 for
the coverage hole before promoting (e.g. promoting A01 Reyes leaves
Mudhaus with mains-only staffing — fine; promoting A07 Luz orphans a whole
corner — replace with a new ambient spawn first).

## 2. Promotion steps (in order)

1. **Freeze the card.** The `world/ambients/aNN-*.md` card becomes the
   seed: who-they-are, voice & tells, and surface ties carry over
   verbatim into a new bible. Promoted characters keep their ambient
   history — the block already knows them.
2. **Mint the address.** Per address spec §3/§6: `9000 + hash(street ||
   building_index) mod 900`, register building/unit/lease in the registry
   (`world/jobs-housing.md` seed JSON shape). Ambients previously had
   hashed off-registry homes — the promotion mints their real door.
   Minors (A04, A20): mint the household unit, lease held by an
   off-registry parent/guardian NPC — never a player-facing tenancy.
3. **Write the SECRETS section.** The promoted bible gains the main-cast
   field split (public profile / surface relationships / routine vs
   SECRETS). New secrets are authored fresh at promotion — ambient cards
   carry none, so nothing leaks upward. One rule: a promoted ambient's
   *surface* knowledge stays (Bex's linework observation becomes a
   discovery path, not a fact she states).
4. **Routine upgrade.** The `SF_AMBIENT_ROUTINES` entry becomes the
   character's `SF_CORE_ROUTINES`-style schedule; promote by moving the
   entry, keeping the schedule (the block's rhythm shouldn't notice the
   upgrade — that's the point).
5. **Ledger entry.** Feed event: `ambient_promoted` with character id,
   timestamp — admin transparency per design §3. In-world, nothing
   announces it; the pawn just starts having a richer inner life.

## 3. What promotion must NOT do

- Never grant a promoted ambient knowledge of main-cast SECRETS they
  "should have" overheard — ambient memory is surface-only by
  construction.
- Never promote mid-request-scene; promotion happens between ticks, not
  inside an active exclusive session.
- Never reuse the freed ambient id for a new spawn within a version —
  `A09` always means Asha. New ambients mint new ids (A21+).

## 4. Demotion / reversion

If a promoted character's player-facing role ends (compute pressure,
story completion), the character reverts to ambient with their last
schedule — the card is updated, the bible's SECRETS section is archived
to the world ledger (still never player-facing), and the pawn keeps its
name. Reverted characters keep the "was once more" quality — that's a
feature, not data loss.

## 5. First promotion class — EXECUTED (world v126)

The top three candidates were promoted at v126, per the production-3
direction ("two to four recurring supporting residents"). Their full
bibles live in `world/characters/supporting/`; addresses minted per §2
step 2 and registered in `jobs-housing.md` §3; routines kept per §2
step 4 (same schedules, richer inner lives — the block notices nothing).

| S id | Ambient | Bible | Minted address |
|------|---------|-------|----------------|
| S1 | A14 Bex | `characters/supporting/s1-bex-lindqvist.md` | 9641 Shotwell St, Unit B |
| S2 | A05 Esther | `characters/supporting/s2-esther-goldman.md` | 9388 Dolores St, Unit 1 |
| S3 | A09 Asha | `characters/supporting/s3-asha-nair.md` | 9519 South Van Ness Ave, Unit 4 |

Ambient ids A05/A09/A14 stay frozen (§3). The remaining candidate:

4. **A06 Kofe** — the gig-economy storyline with a built-in Marcus/Omar
   triangle. Next candidate if the supporting tier grows to four.

## 6. Original candidate ranking (superseded by §5)

Archived rationale, kept for the record: Bex = the art-underground
link (chalkboard/Clarion discovery path); Esther = Carmen's peer and
the misremembered-history engine; Asha = Priya's cohort, the ward's-eye
view; Kofe = the gig-economy triangle.
