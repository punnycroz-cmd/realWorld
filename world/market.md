# The Market — job churn & housing metabolism (world v31)

The job board (`jobs-housing.md` §2) and housing registry (§3) say *what
exists*. This file is the **depth layer for how it moves**: how an opening
gets posted, screened, trial-shifted, and filled; how a unit goes from
notice to lease-signed; and the channels that never reach the board at
all. Mirror: `world/market.json`. Internal demo: `world/market.html`
("The Board's Metabolism").

Standing rules (inherited, restated once):

- **Conditions, not scripts.** Everything below describes what an employer
  screens for, how long things take, and what a camera can notice. Nothing
  here obliges a character to do anything.
- **jobs-housing.md wins.** Wages, hours, openings counts, rents below are
  convenience duplicates. On drift, that file is canonical — fix this one.
- **Game dollars only.** The only credit-denominated figures anywhere in
  the housing ladder are deed fees (PROPOSAL, monetization §2.4), and they
  do not appear in this layer at all.
- **Rent is texture, not plot** (user-locked). Vacancy mechanics are
  background metabolism, never a storyline engine.
- **No secrets.** Churn texture is surface knowledge — "the café reposts
  the card about once a year" — never why someone quit.

---

## 1. Opening lifecycle

Every open role on the board moves through the same states:

```
posted → screening → trial → filled
                    ↘ reposted (cycle restarts)
                    ↘ withdrawn (rare — budget cut, owner changed mind)
```

- **posted** — the card is up. Channel decides *where* (§2).
- **screening** — someone is reading replies / asking around. For board
  jobs this is informal and fast; for HR-portal jobs it is a queue.
- **trial** — the paid working audition. Almost every food/service job on
  this block hires by watching a shift, not by reading a résumé.
- **filled** — card comes down. The feed never announces a hire; regulars
  just notice a new face.
- **reposted** — the candidate washed out or took something else. A card
  that reappears within a month is itself neighborhood texture (the
  Musket jokes about it).
- **withdrawn** — the employer pulls the slot. Rare; the card just
  disappears.

## 2. Channels — where openings actually live

| Channel | What it is | Who uses it |
|---|---|---|
| `board` | Physical card at Mudhaus + the board page | Most food/service employers |
| `word_of_mouth` | Somebody asks somebody; never a posted card | Room shares, informal gigs, the good jobs |
| `app` | Gig-app signup, always open | MuleIt; churn work |
| `hr_portal` | Institutional process — certs, fingerprints | SF General |

A single opening uses exactly one channel. Word-of-mouth openings are
*invisible to the board* by construction — a spectator learns about them
the way a neighbor does (someone mentions it at the counter), and a
player-hired character finds them by being known, not by searching.

## 3. The churn table (every live opening)

Days-to-fill is the block's observed rhythm, not a promise. `decider` is
who actually says yes — always a person, never "management".

| Opening | Channel | Screen | Trial | Days-to-fill | Repost cadence |
|---|---|---|---|---|---|
| Mudhaus — Barista | board | Marisol reads the card replies herself | one paid Saturday rush; she watches hands | 1–3 wks | ~1/yr — her crew stays |
| El Farolote — Line cook | word_of_mouth | Doña asks around the kitchen network | one dinner service, own knives | 2–4 wks | irregular — cooked-out line cooks leave in twos |
| El Farolote — Counter/closer | board | counter staff vouch-check | one Friday close, sober at 2 a.m. | 1–2 wks | 2–3/yr — the 2 a.m. crowd filters people |
| MuleIt — Rider | app | none — churn by design | first week IS the trial | days | continuous |
| Buy-Rite — Grocery clerk | board | office interview + one reference | two stocking shifts | 2–4 wks | ~2/yr |
| Creamery — Scooper | board | counter asks two questions: weekends? scoop arm? | one sunny Sunday | 1–2 wks in season | every spring + mid-summer attrition |
| Dolores Perk — Counter | board | morning regulars act as informal references | one morning rush | 2–4 wks | ~1/yr |
| Baguette About It — Counter, afternoons | board | the baker hands you the sell-down list | one 13:00–17:00 shift | 1–2 wks | ~1/yr |
| Baguette About It — Counter temp, holiday *(seasonal)* | board | same as counter, faster | two shifts before Thanksgiving | days — posted ~Nov 1 | annually, Nov 15–Dec 24 |
| Il Delfino — Line cook | word_of_mouth | stage culture — they ask kitchens they know | Tuesday stage (unpaid tradition, contested in tone) | 3–6 wks | ~1/yr — they poach, they get poached |
| Il Delfino — Server ×2 | board | floor manager watches you carry plates in the interview | one Tuesday floor | 1–3 wks | 2/yr |
| Auerbach — Counter clerk | word_of_mouth | Victor hands you a bin of screws and talks | half a Saturday | 4+ wks — he's in no hurry | years apart — last hire was 2019 |
| Bloom & Doom — Saturday counter | word_of_mouth | Ida asks at the market | one Saturday | 2–4 wks | intermittent |
| SF General — CNA/tech ×2 | hr_portal | cert + fingerprints + behavioral interview | orientation week | 1–2 mo (HR queue) | continuous — med-surg always short |
| Marooned Records — Weekend counter | word_of_mouth | Sam mentions it at the counter; owner asks what you listen to | one Sunday, the 45 crate | 3–5 wks — it fills by vibe | rare — the last kid stayed three years |
| Golden Hour — Evening attendant | board | owner asks one question: "can you be kind at 22:45?" | one Friday evening | 2–4 wks | ~1/yr |

## 4. Skill ladders — the informal promotion paths

No posting, no application. Each ladder is what the employer actually
responds to — the *conditions* for the next rung.

| From → To | At | What it actually takes | What changes |
|---|---|---|---|
| Barista → shift lead (keys) | Mudhaus | 6+ months of showing up at 6:00; your till count matches Marisol's twice running; you fix group two without being told | +$2/h equiv, first pick of shifts, opens alone |
| Line cook → lead cook | El Farolote | the plancha on a slammed Friday without a single refire; you taste every salsa | lead wage ($30), menu input |
| Counter → keyholder | Buy-Rite | six months gets the good shifts; a year gets keys | opening/closing premium, clipboard access |
| Rider → co-op member | Flying Pannier | not a promotion — an application: 6 mo app-work history + two member sponsors + buy-in | steadier dispatch, vote, profit share |
| Scooper → counter | Dolores Perk / Creamery | surviving one full summer of Sundays | counter wage, year-round hours |
| CNA → RN path | SF General | cert seniority + the hospital's bridge program | the real ladder on this board — $22→$48 |
| Attendant → manager | Golden Hour | the washer-repair guy's number memorized; the binder balanced three months straight | keys + the bulletin board is yours |
| Counter → buyer | Marooned | you can price a crate by flipping it once | Sunday desk, the hold-shelf is your judgment |

## 5. Seasonal labor calendar

Rhythm notes — which months *change the shape* of the board. These deform
hours and posting cadence, never anyone's routine directly.

| Months | Note |
|---|---|
| Mar–Apr | Creamery + park-side jobs post early for the sun swell; MuleIt signup surge |
| May–Sep | Park-season peak: scooper hours stretch past posted, courier work swells, Dolores Perk weekends run long |
| Sep–Oct | Back-to-school: after-school café wave resumes; Creamery keeps its ironic best month (fog-free September) |
| Nov 15–Dec 24 | Baguette holiday temp window; every food job's "nobody quits in December" lull |
| Dec–Feb | Construction weather days pile up — laborer hours get ragged; stand vendors thin |
| Jan–Mar | SF General flu surge — overtime everywhere on med-surg; agency float posts appear |
| Feb | The quiet month: board is thinnest, rents due all the same — texture only |

## 6. Housing vacancy lifecycle

```
notice → listed → showings → pool → lease_signed → filled
              ↘ delisted (rare — owner decides to hold the unit)
```

- **notice** — tenant gives 30 days. Neighbors know before the listing
  exists: hallway texture, not a feed event.
- **listed** — card on the board + word spreads at Mudhaus within days.
- **showings** — the open-house windows in `listings.md` (Sat 11–1 etc.).
- **pool** — applications in hand. Owner-direct buildings move on feel +
  references; manager buildings move on paper.
- **lease_signed / filled** — disappears from the board. The lease ledger
  (leases.json) takes over from here.

### Days-on-board norms by tier

| Tier | Days | Channel reality | Screening | Deposit norm |
|---|---|---|---|---|
| Room in share | 3–7 | almost never the board — the roommates' network picks | roommate interview, vibe + rent math | ~½ month ($350 on $700) |
| Studio | 5–10 | board + walk-bys | first + deposit + references | one month |
| 1BR | 7–14 | board, goes fast near the park | screening + references | one month |
| Upper flat | 10–21 | board + word_of_mouth — Victor hears about interest before the card is dry | owner feel + references | one month |
| Whole house | 30+ | word_of_mouth, agent-adjacent | the household math has to work on paper | one month + pet negotiation |

Rent-controlled units fill faster than the norms — the pricing does the
advertising. 9418-B at $2,100 and 9457-2 at $1,350 will not sit.

## 7. The word-of-mouth room channel

The cheapest real housing on the block is invisible. Rooms in shared
flats trade through who-knows-whom: Jules's room at 9418-A ($700 cash to
Carmen) is the type specimen — informal, unpermitted, normal for the
Mission. Properties of the channel:

- **Roommates choose the person, not the paperwork.** References are a
  kitchen-table conversation.
- **It never reaches the board or the registry.** The lease ledger sees
  the tenant of record only. (9418-A's unpermitted-occupant flag is the
  ledger's one honest record of this world — undiscovered, per the card.)
- **Spectator surface:** texture only. A new face in a hallway is the
  whole announcement.
- **Player path:** a hired character can *hear about* a room only by
  having in-world ties — the funnel deliberately starts them at the
  listed-room tier instead.

## 8. The off-registry ambient ring

The 20 ambients live **one ring out** from the park — the blocks the
camera visits but the registry doesn't enumerate. Spec for when the
simulation promotes one (promotion.md path):

- **Stock shapes:** rooming-house floors, in-law units behind Victorians,
  family duplexes owned by someone's aunt, rent-controlled one-bedrooms
  held since the 90s. Cheaper, older, denser than the park ring.
- **No fixed addresses until promotion.** A promotion mints a real 9xxx
  address per address-spec §6 (landlord-as-clerk), registers it, and adds
  a lease row — the ambient's "home base" note in ambients.md becomes
  registry truth.
- **Why it stays off-registry:** enumerating 20 addresses invites the
  fiction to treat ambients' homes as stages. The ring is texture —
  Luz's building has a stoop, Vera's has a lobby plant she waters, and
  that is all the address system owes them until they promote.

## 9. Move-in math (game $, first month out of pocket)

| Tier | First | Deposit | Total | vs wage band |
|---|---|---|---|---|
| Room | $700 | $350 | $1,050 | 66% of a part-time baseline month — the day-one door |
| Studio | $1,300 | $1,300 | $2,600 | ~1 month's barista gross — needs savings or a mid job |
| 1BR | $2,100 | $2,100 | $4,200 | ~1 month's mid-band gross |
| Upper flat | $3,200 | $3,200 | $6,400 | two-person household math or top-band |
| House | $5,500 | $5,500 | $11,000 | aspiration tier |

Moving is the expensive part, not the rent — the loop's real gate. A
hired character at the room tier banks toward a studio for ~3–5 months
of play at baseline wages, which is the intended pacing.
