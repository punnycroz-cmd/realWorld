# Envelopes — household budgets (world v17)

The money layer made personal. `jobs-housing.md` §4 checks the loop at the
tier level; this file is the same arithmetic per household — what actually
lands in each envelope each month. Machine mirror: `world/budgets.json`.
Render demo: `world/timeclock.html` (Envelopes tab, internal tier).

Discipline:

- **All game dollars.** Credits never appear here; the currency wall is
  absolute (design §6). No number on this page is player-facing pricing.
- **INTERNAL tier.** Envelopes are direction/design content. Spectator
  surfaces may show *texture* ("money's tight at the courier place") but
  never a named person's rent, wage, or cushion — the feed and briefings
  must not read this file's numbers verbatim. Registry rents stay
  admin/landlord-context per `housing/_index.md`.
- **No SECRETS.** The numbers rhyme with the fiction but never name it:
  Tomás's line shows disciplined savings, not what he's saving *for*;
  Carmen's shows fragility, not why it matters; Jules's room share is
  listed as "informal" because that's what the hall knows.
- Rent is texture, not plot (user-locked). These are conditions — the
  pressure characters carry, never a storyline assigned to them.
- Figures are gross monthly estimates (`wage × h/wk × 4.33`), the same
  convention as the job board. Variable/informal income is marked.

## The nut (shared baseline, jobs-housing §4)

Groceries ~$320 · transit ~$80 · utilities share ~$90 → **~$490/mo** solo.
Households adjust: shared flats split utilities and some food; cooks
spend less on groceries and more on ingredients. Ambient off-registry
housing is assumed at the room tier (~$700) unless noted.

## The eight mains

### C1 Marisol — manager, Mudhaus ($30/h, 40 h)
Income **~$5,190** → rent $1,150 (9127 Capp C, controlled) → nut ~$520
(lives alone, feeds people) → **cushion ~$3,500/mo**.
The most banked person on the block. Money is not her problem; she is
everyone else's emergency fund and never says so. Stress: **steady**.

### C2 Jules — barista, Mudhaus ($19/h, ~34 h)
Income **~$2,800** → room share $700 cash to Carmen (informal, unrecorded)
→ nut ~$480 → **cushion ~$1,600/mo**.
Genuinely comfortable for the first time in years — which is exactly why
the arrangement's informality doesn't worry her. Stress: **steady**.

### C3 Dani — barista, Mudhaus ($19/h, ~33 h)
Income **~$2,700** → room share $700 to the Reyes cousins (informal, not
on the 9263 Geneva lease) → nut ~$460 (cousins cook) → **cushion
~$1,400/mo**. Sends small amounts home irregularly — not an obligation
anyone tracks but her. Stress: **steady**.

### C4 Priya — RN, SF General ($48/h, 36 h)
Income **~$7,490** → rent share $1,600 (9457-3, contested raise
registered) → nut ~$560 → **cushion ~$5,300/mo**.
The flat is cheap *for her*; the dispute isn't about the money and her
envelope proves it. Stress: **comfortable**.

### C5 Marcus — bike courier, Flying Pannier ($18/h, ~30 h variable)
Income **~$2,300 + tips ≈ $2,600** → rent share $1,600 (same flat, same
raise) → nut ~$520 → **cushion ~$480/mo** — and it doesn't survive a slow
dispatch month, a cracked rim, or a rain week he didn't ride.
His share of 9457-3 runs ~62–70% of income; the ledger knows him as
chronically ~1 month late. Structural, not careless — the math was never
going to work. Stress: **fragile**.

### C6 Carmen — pension + hemming + the spare room
Income **~$2,650** ($1,650 pension/SSI + ~$300 hemming, informal +
$700 Jules's room, cash) → rent $950 (9418-A, controlled since 1989 —
the number that makes the flat irreplaceable) → nut ~$520 (cooks for
two more nights than not) → **cushion ~$230/mo**.
One missed pension check or one discovered occupancy flag from zero.
Stress: **fragile** — she has been fragile for thirty years and manages
it like weather.

### C7 Victor — proprietor, Auerbach Hardware
Draw **~$5,500/mo** net of the store's bills (lumpy — gross runs $6–10k,
inventory eats first) → housing $0 (owner-occupied 9102-2) → nut ~$600 →
**cushion ~$4,900/mo** plus whatever the buildings are worth on paper.
Asset-rich in a way nobody on the block fully prices. Stress:
**comfortable** — and entirely illiquid where it counts.

### C8 Tomás — lead cook, El Farolote ($30/h, 40 h)
Income **~$5,190** → rent $1,275 (9344 Folsom, controlled) → nut ~$450
(eats at the restaurant, lives like a man saving for something) →
**cushion ~$3,400/mo**, saved with a discipline his coworkers read as
austerity. Stress: **steady** — quietly the best saver on the block.

## Ambient texture (off-registry housing assumed ~room tier)

| Who | Income | Housing | Cushion | Stress |
|---|---|---|---|---|
| A01 Reyes | ~$3,900 (63-h weeks, entry wage) | room ~$700 | ~$2,700 — sends most of it home | tight by choice |
| A02 Doro | ~$2,600 | room ~$700 | ~$1,400 | steady |
| A03 Malik | ~$3,100 owner draw (thin) | room ~$700 | ~$1,900 | tight |
| A05 Esther | ~$1,600 fixed | room ~$700 | ~$400 | fragile |
| A06 Kofe | ~$2,200 + tips | room ~$700 | ~$1,100 | tight |
| A07 Luz | ~$4,000 cash | family arrangement | varies | tight |
| A08 Sam | ~$1,800 informal | room ~$700 | ~$600 | fragile |
| A09 Asha | ~$7,490 RN | room ~$700 | ~$6,300 | comfortable |
| A10 Gus | ~$5,880 | room ~$700 | ~$4,700 | comfortable |
| A11 Vera | ~$5,360 city | room ~$700 | ~$4,100 | comfortable |
| A13 Nadia | ~$8,650 remote | room ~$700 | ~$7,400 | comfortable |
| A14 Bex | ~$4,500 commission-weighted | room ~$700 | ~$3,300 lumpy | steady |
| A16 Hana | ~$5,070 | room ~$700 | ~$3,900 | steady |
| A17 Cole | ~$6,230 | room ~$700 | ~$5,000 | comfortable |
| A18 Ida | ~$4,330 | room ~$700 | ~$3,100 | steady |
| A19 Ray | ~$1,700 pension | room ~$700 | ~$500 | tight |

Minors (A04 June, A20 Zee) and the remaining ambients aren't priced —
their money is family money and stays off the ledger.

## What this layer is for

- **Hire flow sanity:** a new h## at an entry job ($2,300–2,800) into a
  $700 room lands at Jules's position — the designed cozy-but-real start.
- **Drama direction** (drama.json adjacency): pressure lives where the
  cushion is thin — Marcus's arrears, Carmen's margin, Sam's moods —
  never as a rent plotline, always as background physics.
- **Feed legibility:** payday Fridays + the rent run give the block a
  weekly and monthly rhythm; spending texture on the Wire follows it.
- **Not** a scoring system. Nobody wins the budget table.
