# UI-VOICE.md — the register the product speaks in

**Version:** v190 · 2026-09-24 · **Status:** LOCAL — launch-ready reference.
BRAND.md owns voice for marketing copy; BRAND-LEXICON.md owns vocabulary.
This file owns the *product register*: how the surfaces themselves (The Wire,
the request card, the landed-invitation card, toasts, empty states, errors)
are allowed to talk — and how marketing material may quote them.

**Ownership line.** The world track owns the shipped strings (copy decks live
inside each surface spec: `world/request-ui.md`, `world/wire-ui.md`,
`world/feed-ui.md`, …; statuses live in `world/requests.json
→ feed_vocabulary`). Marketing owns the register they conform to. When a
shipped string and this file disagree on a *word*, the shipped string wins
and this file is updated in the same commit — the product is the source of
truth for its own voice. `tools/ui_voice_check.py` enforces the mechanical
half on everything marketing publishes.

---

## 1. Register rules (the ten rules every product string obeys)

R1 — **Facts, not scores.** Endings are reported as events ("the card came
down — nobody obliged"), never graded ("success!", "failed", "+rep").
Uptake on a landed invitation is never scored (design §11; world v130).

R2 — **Statuses are verbatim.** Status chips and feed lines use the
`feed_vocabulary` strings exactly — lowercase, never title-cased,
never paraphrased, never translated for tone. The list (source:
`world/requests.json`, plus the compounds the spec layers on):

| Status | Register meaning |
|---|---|
| `requested` | declared, on the feed before the screen answers |
| `in_review` | held for human review; the card carries the SLA clock |
| `approved` | cleared the screen |
| `approved (modified)` | cleared, changed — the card becomes an offer, not a bill |
| `queued` | waiting on a claim; auto-refunds if the slot never opens |
| `running` | active |
| `booked` | scheduled event held to its window (v88 addition) |
| `resolved` | ended cleanly |
| `resolved · declined` | the ask was heard and refused — an ending, not an error |
| `refunded` | credits returned automatically |
| `not approved` | refused at the screen; the feed shows the outcome, never the screened text |
| `denied` | refused pre-billing at the bus door — renders `not approved · nothing billed` |
| `admin action` | the landlord layer acted; attributed, on the feed |
| `player session ended` | the viewer stepped away mid-session |

R3 — **Decline is an ending, not an error.** `resolved · declined`,
`not approved`, `denied`, and lapsed invitations carry no apology words
(no "sorry", "unfortunately"), no red error chrome beyond the sanctioned
`tag-refund` chip color, and no retry pressure ("try again?").

R4 — **Honesty lines print on the card.** Terms like "a request buys the
posting, never the turnout" and "uptake is never scored" render in the
visible card body — never in tooltips, fine print, or a linked doc.

R5 — **Mechanics inherit the lexicon.** No exclamation marks, no emoji,
no ellipses-as-trailers in product prose. Em dash for asides, en dash for
ranges ("30–60 cr", "5–10 min"). Sentence case everywhere except chips,
which are lowercase verbatim per R2.

R6 — **The audience is never a character.** In-world strings never address
or name viewers inside the fiction; attribution is by filer handle plus the
sanctioned phrase "posted at a viewer's request". Mains can't see the
audience — UI copy never implies otherwise ("X knows you're watching" is
a double violation: voice + accuracy).

R7 — **Refusal language is flat.** "not approved", "declined", "the card
came down" — the register reports. It never cushions ("we're sorry, but…"),
never editorializes ("sadly"), never incentivizes ("want to try something
bigger?").

R8 — **Empty states say what's true.** "Nothing queued — the board is
clear." "A quiet hour on the block." Never filler ("Oops, nothing here!"),
never a sales pitch in an empty state.

R9 — **Confirmations name the fact.** The confirmation/toast pattern is
noun + outcome: "Your request: not approved." (email §16 ships the same
pattern). No "Got it!", no "Success — your request is live!" (that's a
score *and* an exclamation — two violations in one).

R10 — **Lapse is playable, not failed.** A neglected offer, an expired
queue slot, a lapsed invitation all render as honest decay: "nothing is
owed" — never "missed opportunity" framing that pressures the payer.

## 2. String anatomy

| Element | Shape | Example |
|---|---|---|
| Status chip | lowercase verbatim, one `·` compound max | `resolved · declined` |
| Card title | sentence case, may carry an em-dash gloss | "How it landed — a standing invitation" |
| Feed line | `<what happened> — <ref or attribution>` | "an invitation went up at El Farolote — off-req-14" |
| Ending line | "The ending:" + fact + standing | "The ending: the card came down at the end of the week — nobody obliged." |
| Toast/confirm | `<thing>: <status>` | "Your request: queued." |
| Error (real error) | says what broke + what was kept | "The feed dropped. Nothing was billed." |
| Stage/gate tag | which proof stage a paid rail waits behind | `.stage-tag` pills (pricing page) — s1/s2/s3 |

## 3. Quoting product strings in marketing

- **Verbatim or don't quote.** A status, a card line, a feed string quoted
  on a site page, in an email, or in a social draft reproduces the shipped
  string exactly — chips stay lowercase even mid-sentence ("…the feed posts
  <i>requested</i> before the screen has even answered." — demo.html does
  this right).
- **Italic or code, never "translated."** Quoted strings are set off in
  `<i>`/`<code>`/quote marks so readers can tell product voice from
  marketing voice; we never rewrite a status for flow.
- **The lifecycle list is a unit.** Where the full sequence is quoted
  (demo.html, how-it-works.html) it appears as the canonical joined string
  `requested · in_review · approved · approved (modified) · running ·
  queued · resolved · refunded · not approved` — adding, reordering, or
  softening a stage is a factual bug, not a style choice.
- **Simulated strings obey the same register.** demo-sim.js feed rows are
  marketing-authored but product-shaped: they use only canonical statuses
  (`STATUS_CLS` keys ⊆ the §1 table) and the same flat tone.

## 4. On-voice vs off-voice

| Off-voice (never ship) | On-voice | Rules broken |
|---|---|---|
| "Sorry — your request was declined 😔" | "Your request: resolved · declined." | R3, R5, R7 |
| "Success! Your event is live!" | "Your request: approved." | R1, R5, R9 |
| "PENDING REVIEW" | `in_review` | R2 |
| "Nobody showed up — better luck next time!" | "The card came down — nobody obliged. Nothing is owed." | R3, R10 |
| "Marisol noticed you watching!" | (never written — mains can't see the audience) | R6, accuracy |
| "Oops! Nothing on the board rn" | "Nothing queued — the board is clear." | R5, R8 |
| "Request failed — please try again" | "Your request: not approved." (+ "credits returned in full") | R1, R3 |
| "The block loved your invitation!" | "the invitation was taken up — reported as fact, not a score" | R1, R9 |

## 5. Governance

- New status strings are coined in `world/requests.json` by the world/game
  tracks, never by marketing. When one lands, this table and
  `ui_voice_check.py`'s canonical set update in the same commit.
- `tools/ui_voice_check.py` enforces on `site/*.html`, `site/js/demo-sim.js`,
  `templates/`, and `social/drafts/`: (a) every `·`-joined status sequence
  uses only canonical tokens, (b) no apology/hype word or `!` shares a line
  with a status token, (c) `STATUS_CLS` keys ⊆ canonical. UI-VOICE.md and
  brand.html are exempt — they quote off-voice examples deliberately.
- Runs inside `tools/preflight.sh` as step 1d, after the brand audit.
