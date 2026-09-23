# The Regulars Layer — "The Mission" (world v58)

The paint on the glass says what a venue sells (`storefronts.json`); this layer
says **who the venue knows**. `world/regulars.json` registers, per door-having
venue, the people whose order starts before they sit down: the standing order,
the usual window, the usual spot, the surface facts the counter carries, the
staff on first-name basis, and the tab.

Internal posture tool: `world/regulars.html` ("The House Knows") renders the
registry with day/hour scrubbing — the same discipline as BIZ/WEB/STO: the
inline `REG` block is a hand-synced deep mirror enforced by audit.js.

## 1. What a regular carries

| Field | What it is |
|---|---|
| `who` | cast/ambient id (`c1`–`c8`, `a01`–`a20`). Never the venue's own staff — the house does not regularize its own. |
| `order` | the standing order the counter starts on sight. May be "nothing" — a regular can be regular about the talk, not the purchase (Cole at Auerbach). |
| `window` | `{days, hours}` — dow abbrevs (`"daily"`, `"weekday"` allowed) + `[open, close]` world-clock hours, may cross midnight. Must overlap the venue's posted hours. |
| `spot` | the seat or station they take — held by tenure, never by sign. |
| `house_knows` | the surface facts the counter carries (see §2). This is the payload. |
| `name_basis` | staff ids who greet them by name — a strict subset of the venue's `staff`. Empty when the venue's counter is anonymous. |
| `tab` | `null`, or `{running, balance, rule}` — a running tab in **game dollars**, with the settlement rule in one line. |

## 2. The surface-knowledge bar

`house_knows` obeys the same bar as a possession briefing (design §7): **public
profile, surface relationships, routine** — nothing a counter worker couldn't
plausibly know by watching. Concretely:

- ALLOWED: orders, schedules, seats, payment habits, who they arrive with,
  courtesies exchanged, moods the counter reads (tips like a union rule).
- NEVER: secrets, seeds, or speculation that resolves one — no Mission
  Unfiltered, no loan ledgers, no health/family/money facts a counter couldn't
  see. "Nobody asks how the shift was" is allowed (it's the *service*, not the
  fact behind it); "she's avoiding her landlord" is not.
- Regulars are a rumor *source*, not a rumor *channel*: the layer records what
  the house knows, not what the house says. Distortion belongs to the memory/
  rumor substrate, not to this file.

## 3. Coverage contract (enforced by the audit `regs` gate)

- Every `anchor` or `street` business carries ≥1 regular; `offstage` and
  `reserved` venues carry none (an app has no counter; a notebook has no
  regulars — La Esperanza mints its first regular the day it opens, if it does).
- `who` is a valid cast id and never a member of the venue's `staff`.
- `name_basis` ⊆ `staff` ids — first names require a named counter.
- `window` must overlap at least one of the venue's posted hour ranges;
  `days` ⊆ `hours.days` where the venue restricts days (Valencia Growers is
  Saturdays only).
- `tab.balance` is a game-dollar number ≥ 0; the `rule` is one line, in-voice.
- `regulars.html` inline `REG` is a deep mirror of `regulars.json`.

## 4. Design intent

Regulars are the cheapest spectator density in the world: a camera parked on a
counter at the right hour gets a known face with a known order — legibility
without a storyline. The layer is **conditions, never scripts**: a window is a
tendency the routine system may satisfy, not a summons. And it is honest about
tenure — the held table, the kept guitar, the set-aside bun are all things the
house does *without being asked*, which is the whole point of a regular.

## 5. Notes for other tracks

- **Game-systems:** `regulars.json` is read-only display/brain texture — feed
  text may say "the usual" but the layer emits no events. A venue's `hires`
  affordance stays on the board, never on the regulars list.
- **Art:** nothing here is painted — `spot` strings name furniture a camera can
  already see; no new signage.
- **Memory:** `house_knows` entries are what a staff brain would carry as
  low-salience repeated-encounter records — genericized by construction.
- **Marketing:** safe to quote — every line is public-clearance surface texture.
