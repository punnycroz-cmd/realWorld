# The Application — how work and rooms actually get asked for (world v45)

The job board (`jobs-housing.md` §2) says what exists; `market.md` says how
openings move; the workplace and building cards say what the inside is like.
This file is the **actor-facing layer**: what a character — cast or
player-hired — physically does to ask, who reads them, what gets watched,
and how a no sounds. Mirror: `world/applications.json`. Demo:
`world/apply.html` ("The Tryout").

Standing rules (inherited, restated once):

- **Conditions, not scripts.** Every entry describes the shape of the ask —
  the room it happens in, what the decider watches for, the honest ways it
  fails. Nothing here obliges a character to do or say anything, and no
  entry is a promise to the applicant.
- **jobs-housing.md + market.md win.** Wages, channels, days-to-fill below
  are convenience duplicates of those tables; on drift, fix this file.
- **Game dollars only.** No credit figure appears anywhere in this layer —
  deposits, wages, and move-in costs are all in-world money.
- **No secrets, no feed spectacle.** Applications are private business. The
  Wire never carries "X applied for Y" as an event; the spectator surface
  is texture — a card coming down, a new face behind a counter. Declines
  are never announced at all.
- **Honest-sim rules hold:** no application fees above real screening cost,
  no rent bidding, no pay-to-interview. Trial shifts are paid unless the
  entry says otherwise, and when it doesn't it says so plainly.

---

## 1. The shape of an ask

Every opening resolves through the same arc, but the texture differs by
channel (market.md §2):

```
apply → screen → trial → filled
              ↘ decline (silent or voiced — see §4)
```

- **board** openings: you write your name on the reply card or ask at the
  counter. The screen is a conversation that already happened by the time
  you realize it was one.
- **word_of_mouth** openings: you are *brought*. Somebody says your name in
  the room first — the ask is having a reputation someone repeats.
- **app** openings: there is no ask. The signup is the job's first filter
  and its last courtesy.
- **hr_portal** openings: the packet is the ask — certs, fingerprints, the
  behavioral interview. Slowest channel on the board.

## 2. Job applications — every live opening

### Mudhaus Coffee — Barista (board)

- **Apply:** the reply card pinned under the listing, or ask for Marisol
  at the counter before 9:00 — after the rush she's inventorying and the
  answer is "write the card."
- **Screen:** Marisol reads the card replies herself, then watches how you
  wait for her. She asks three questions: what shift you last closed, why
  you left it, and whether you can start a Saturday. She is screening for
  someone who shows up at 6:00 for a month straight; she will train the
  machine herself.
- **Trial:** one paid Saturday rush, 7:30–13:00, $19/h. She watches hands —
  do you bus a table without being asked, do you flush the group-two
  gasket or let it squeal.
- **Passes on:** unhurried competence under the line; a clean till count.
- **Fails on:** talking through the rush; asking to leave the floor for a
  phone call; treating the regulars as audience.

### Taqueria El Farolote — Line cook (word_of_mouth)

- **Apply:** you don't — the kitchen network brings you. A supplier, a
  cousin, another cook says your name where Doña Ocampo can hear it. The
  card never goes up.
- **Screen:** Doña watches one dinner service, silent, from the corner
  stool. She is screening for knife safety and whether you taste the salsa
  before it goes out. She does not care about résumés; she cares about
  the rice.
- **Trial:** one dinner service on the plancha, own knives, paid $26/h.
  Thursday is the honest version — the kitchen runs ten percent tighter
  and everyone knows why.
- **Passes on:** the plancha held on a slammed ticket rail without a
  refire; you tasted everything.
- **Fails on:** touching Tomás's knife roll; a plate going out untasted;
  speed that costs the salsa bar its restock.

### Taqueria El Farolote — Counter/closer (board)

- **Apply:** reply card or ask at the counter early in the week — the
  closers collect names, not the manager.
- **Screen:** the counter staff vouch-check. Real Spanish — the 2 a.m.
  crowd talks fast and drunk — and patience. The screen question is
  usually some version of "what do you do when a guy orders the same
  burrito three times and pays once."
- **Trial:** one Friday close, register through 2 a.m., paid $18/h.
- **Passes on:** sober at 2 a.m., still kind, drawer counts out.
- **Fails on:** escalating a drunk; freezing on Spanish; short drawer
  with a story.

### MuleIt — Delivery rider (app)

- **Apply:** the app. License photo, bank routing, orientation video —
  twenty minutes and you're on the map. There is no decider; churn is
  the design.
- **Screen / trial:** none as such — the first week IS the screen. The
  algorithm learns your zone, the good riders learn the hill shortcuts,
  and everyone learns that surge hours pay for the dead ones.
- **Texture:** the work is real and the pay is real ($17/h baseline +
  tips); what's absent is a person who knows your name. Riders who want
  a name graduate to the Pannier co-op intake when it opens.

### Buy-Rite Market — Grocery clerk (board)

- **Apply:** reply card, then the office interview — a real one, fifteen
  minutes upstairs with the shift manager and a clipboard.
- **Screen:** availability honesty and one reference they actually call.
  The manager is screening for someone who will still be here in six
  months; the pay ($19/h) doesn't reward ambition, so they ask about
  stability instead.
- **Trial:** two stocking shifts, paid. They watch whether you rotate
  stock — oldest forward — without being told twice.
- **Passes on:** the back-room aisle left cleaner than you found it.
- **Fails on:** chronic phone-out on the floor; the one reference who
  hesitates.

### Buy-Rite Creamery — Scooper (board)

- **Apply:** ask at the counter. The interview is two questions: can you
  work weekends, and have you got a scoop arm — the second asked
  seriously.
- **Screen:** the lead scooper, not the office. They watch you hold a
  cone over the case and whether you smile at kids without it looking
  like labor.
- **Trial:** one sunny Sunday, paid $17/h — the whole job in miniature:
  the line out the door, the toddler meltdown, the "what's good" loop.
- **Passes on:** steady wrist through a rush; you offer tastes before
  being asked.
- **Fails on:** the wrist; treating samples as negotiation.

### Dolores Perk — Counter (board)

- **Apply:** reply card. The screen is unusual: the morning regulars
  function as informal references — if nobody at the counter has ever
  seen you, the pool assumes you're a walk-through.
- **Screen:** the owner asks about mornings, because mornings are the
  job. The regulars' verdict arrives unrequested and unoverridable.
- **Trial:** one morning rush, paid $18/h.
- **Passes on:** remembering two orders by the second visit.
- **Fails on:** treating the regulars as furniture.

### Baguette About It Bakery — Counter, afternoons (board)

- **Apply:** reply card or ask the counter lead at 14:00 — never during
  the morning sell-down.
- **Screen:** the baker hands you the sell-down list and watches you
  read it. He's screening for someone who understands what the numbers
  mean — what's gone by 15:00, what moves on grey days.
- **Trial:** one 13:00–17:00 shift, paid $18/h. Real test: the 16:00
  slump and what you do with it — restock, crumb sweep, front-face the
  case.
- **Passes on:** the case fronted during the dead hour, unasked.
- **Fails on:** standing behind the counter waiting to be used.

### Baguette About It Bakery — Counter temp, holiday (board · seasonal Nov 15–Dec 24)

- **Apply:** same as the afternoon counter, faster — the card goes up
  around Nov 1 and comes down when it fills.
- **Screen:** abbreviated — two questions and a date check: can you work
  Dec 23rd. Everyone can say yes; the screen is for the ones who mean it.
- **Trial:** two shifts before Thanksgiving, paid $18/h. The holiday
  crowd is the whole exam.
- **Passes on:** warmth under line pressure; the ribbon-and-box skills
  are teachable in an afternoon.
- **Fails on:** the December 23rd answer turning out to be negotiable.

### Il Delfino — Line cook (word_of_mouth)

- **Apply:** they ask kitchens they know. The stage tradition — a working
  Tuesday, unpaid — is how the kitchen reads you; the tone of it is
  contested on the block and the file says so plainly.
- **Screen:** stage culture. The chef watches your prep list, your
  station reset, whether you taste. Nobody explains the rules; the
  kitchen assumes you know them or know how to look like you do.
- **Trial:** the Tuesday stage IS the trial — one service, plancha-adjacent
  station, judged at the pass.
- **Passes on:** mise en place squared away before tickets; questions
  asked once.
- **Fails on:** station clutter mid-service; the second asking of any
  question.

### Il Delfino — Server ×2 (board)

- **Apply:** reply card. The floor manager's interview trick is to watch
  you carry plates across the room — applied for or not, you'll be asked
  to walk a tray.
- **Screen:** table sense. They screen for someone who reads a four-top's
  mood in the approach, not someone who recites the menu.
- **Trial:** one Tuesday floor, paid $18/h + share of tips — the slow
  night, deliberately: anyone can survive Saturday; Tuesday shows whether
  you keep the room warm.
- **Passes on:** the room's energy held; sidework done without the list.
- **Fails on:** camping a tipped-out table while another sits dirty.

### Auerbach Hardware — Counter clerk (word_of_mouth)

- **Apply:** Victor hears about interest before the card is dry — the
  building-listing effect applies to his counter too. Someone mentions
  you're looking; he says "send them Saturday."
- **Screen:** he hands you a bin of screws to sort and talks while you
  do it. He's screening for hands that sort without sorting being the
  conversation — and for someone who asks which bin before guessing.
- **Trial:** half a Saturday, paid $21/h. The test is the contractor
  morning: a pro asks for "a box of 8s, two-inch" and the clock is
  already running.
- **Passes on:** you find it, or ask where it lives without apologizing.
- **Fails on:** guessing confidently; retail voice with the regulars.

### Marooned Records — Weekend counter (word_of_mouth)

- **Apply:** there is no card, ever. Sam mentions the opening at the
  counter; the owner asks what you listen to — and means the question.
- **Screen:** taste as biography. Not "name the right bands" — the owner
  is screening for someone whose listening is real, whatever it is, and
  who can talk a customer toward a record instead of at one.
- **Trial:** one Sunday, paid $17/h — the 45 crate test: a customer with
  ten dollars and no plan. The counter exists for them.
- **Passes on:** the browser leaves with something they love, not
  something they were sold.
- **Fails on:** condescension, of any genre.

### Golden Hour Laundromat — Evening attendant (board)

- **Apply:** reply card. The owner asks one question: "can you be kind
  at 22:45?" The applicant who asks what that means gets interviewed;
  the one who answers gets the trial.
- **Screen:** temperament for the last hour — the laundromat's loneliest
  shift, when the machines are loud and the company isn't.
- **Trial:** one Friday evening, paid $17/h. Coin machine, lint traps,
  the fold counter, and whoever's still drying at close.
- **Passes on:** the close done gently — lights down section by section,
  not all at once.
- **Fails on:** rushing the last customer; treating the chair row as
  a problem.

### Bloom & Doom Flowers — Saturday counter help (word_of_mouth)

- **Apply:** Ida asks at the market — the produce vendors, the Growers
  stall people, the regulars who buy the funeral arrangements. Someone
  says your name.
- **Screen:** she watches your hands around the stems — whether you
  strip thorns without mangling the rose, whether you carry a bouquet
  like it's going somewhere.
- **Trial:** one Saturday, paid $18/h. Wedding season Saturdays are the
  honest version.
- **Passes on:** ribbon work that holds; asking "who's it for" before
  "how much."
- **Fails on:** crushed stems; a sympathy arrangement treated as inventory.

### SF General — CNA/tech ×2 (hr_portal)

- **Apply:** the hospital portal — cert number, immunization records,
  fingerprints, the behavioral interview. Slowest channel on the board:
  one to two months through the HR queue.
- **Screen:** the packet first, then the unit. The interview screens for
  what the ward actually needs — reliability under load, charting
  honesty, and the answer to "tell me about a patient you got wrong."
- **Trial:** orientation week, paid $22/h — supervised shifts on
  med-surg where the preceptor writes the real evaluation.
- **Passes on:** vitals charted honestly at 3 a.m.; asking the nurse
  instead of guessing.
- **Fails on:** a chart that rounds itself; the preceptor's name for
  you being a sigh.

## 3. Housing applications — the viewing, the packet, the decision

The vacancy lifecycle (market.md §6) ends here: the showing, the paper,
the yes or no. Days-on-board norms and deposits live in market.md and are
not duplicated — this is the *scene* of it.

### Live registry listings

**9418 Guerrero St, Unit B (1BR, $2,100) — owner-direct**

- **Viewing:** Saturday 11–1, shown by Victor himself. He opens the door,
  says the rent, and lets the flat do the talking. He watches how people
  treat the stair — the runner is older than every tenant — and notices
  who asks about the downstairs neighbor.
- **Packet:** two references he actually calls, first month + one month
  deposit ready to move. No fee for the viewing; he pays for his own
  screening calls.
- **Decision:** 3–7 days. Victor decides on feel backed by the calls —
  "somebody who'll still be here" is the whole rubric.
- **The no:** a text, short and honest — "went with an earlier
  application." He does not ghost; ghosting is the manager buildings'
  sin.

**9457 Guerrero St, Unit 2 (studio, $1,350) — owner-direct**

- **Viewing:** same Saturday window. Victor discloses the stair noise
  himself — "the building's sounds are part of the deal" — because it
  will be discovered either way.
- **Packet:** same as Unit B. The cheapest legal rent in the file draws
  a bigger pool; references matter more than the talk.
- **Decision:** under a week — the rent does the advertising.
- **The no:** same short honest text.

**9127 Capp St, Unit A (studio, $1,300) — manager-run**

- **Viewing:** weekday evening window, shown by the building manager —
  a clipboard walk-through, not a conversation.
- **Packet:** application form, proof of income ~2.5× rent, screening
  charge at actual cost (disclosed on the form), references optional.
  Paper moves here, not feel.
- **Decision:** 5–10 days through the manager's queue.
- **The no:** silence, usually. The listing disappears and that's the
  answer — documented so the sim stays honest about what the channel
  feels like, not because it's endorsed.

### Tier norms (the ladder stock)

| Tier | Who shows it | The packet | Decision | The no |
|---|---|---|---|---|
| Room in share | the roommates, kitchen table | yourself + rent math talk | days — the vibe decides | a text from whichever roommate drew the short straw |
| Studio | owner or manager | income ~2.5×, first+deposit | ~1 wk | silence (manager) / short text (owner) |
| 1BR | owner-direct mostly | same + references | 1–2 wks | short text |
| Upper flat | Victor-tier owner feel | references + the household math | 1–3 wks | honest call, sometimes in person |
| Whole house | by appointment | the math has to work on paper; pet negotiation real | 3+ wks | a letter, strangely formal |

### The room-share interview

The cheapest door in the world runs on the channel that never reaches
the board (market.md §7). The interview is a kitchen-table conversation:
the roommates are picking a person, not an application. What it screens
for, in practice: whether your schedule collides with the bathroom,
whether "clean" means the same thing to all of you, and whether $700 +
$350 deposit moves without drama. References are "who can vouch" asked
casually and followed up seriously. The no is a text from one roommate;
the yes is a key on a ring with a supermarket loyalty tag still on it.

## 4. The decline texture — how the block says no

Honest refusals, in the voices they'd arrive in. Spectator surfaces get
the neutral line; the voiced ones are what a character hears.

| Context | Voiced (in-world) | Spectator surface |
|---|---|---|
| Board job | "We went with someone with Saturday open. Card'll stay up — try the next one." | *(nothing — the card just comes down or stays)* |
| Word-of-mouth | a pause, then "they filled it." You learn who told you. | *(nothing — the opening never existed publicly)* |
| App gig | *(nothing — the silence is the answer)* | *(nothing)* |
| HR portal | "We are moving forward with other candidates" — the system's own voice | *(nothing)* |
| Owner-direct rental | "Went with an earlier application. I'll keep your number if B opens up." | *(nothing — listing delisted is the tell)* |
| Manager rental | *(silence; the listing disappearing is the answer)* | "Listing — delisted" |
| Room share | "hey — we went with my coworker's friend, sorry! we'll keep you posted if anything changes" | *(nothing)* |

A card that reappears within a month is itself neighborhood texture —
the Musket jokes about it. The decline bank in `applications.json` is
the canonical wording set.

## 5. Wiring notes

- `applications.json` row keys (`employer|role`, `unit_id`/tier) are
  asserted against `jobs.json` openings and `housing.json` listings by
  the audit gate — coverage is mechanical, not aspirational.
- Channels agree with `market.json` churn rows verbatim; the gate fails
  on disagreement.
- The hire flow (creation.json v22/v35) consumes this layer read-only:
  an application is the in-world walk the new character takes; the
  ledger stays blind to it until a lease or payroll row exists.
- Declines never hit the feed; "card came down" is the only spectator
  tell, riding existing `venue`/`quiet` texture — no new event kinds.
