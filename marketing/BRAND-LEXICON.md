# BRAND-LEXICON.md — the Real World vocabulary standard

**Version:** v130 · 2026-09-23 · **Status:** LOCAL — launch-ready reference.
v130 adds the becoming-AI vocabulary (locked direction 2026-09-23 — BRAND.md
§1a): what the mains know about themselves, and the claims we never make.
**Scope:** the word-level layer of the brand. BRAND.md owns voice, palette,
logo, and motion; this file owns *which words we use* — canonical terms,
casing, banned drift words with their approved replacements, the in-world
lexicon, and grammar mechanics. `tools/brand_audit.py` check 7 enforces the
mechanical subset on `site/*.html`.

When this file and `press-kit/copy-deck.md` disagree on a phrase, this file
wins — the copy deck quotes from it. When either disagrees with the design
doc on a *fact*, the design doc wins.

---

## 1. Canonical product terms

| Term | Casing | Meaning | Notes |
|---|---|---|---|
| **Real World** | title case, two words | the product | never "RW", "RealWorld", or "The Real World" (BRAND.md §2) |
| **The Mission** | title case | the first neighborhood; subtitle after an em dash | "Real World — The Mission" on first formal reference |
| **the block** | lowercase | the neighborhood, in voice | how neighbors talk; never a trademark |
| **The Wire** | title case, leading "The" | the live spectator feed surface | never "the feed page" |
| **The Archive** | title case, leading "The" | the public history browser | never "the history page" |
| **request** | lowercase | the paid unit of agency | time-boxed, screened, public; never "command", "order", "wish" |
| **session** | lowercase | an active request's runtime | "a 30-minute session" |
| **credits** | lowercase plural | the non-transferable meta currency | amounts: "30–60 cr" (en dash, "cr" suffix) |
| **game dollars** | lowercase | the in-world currency | earned in-world only; never "money" alone in paid-context copy |
| **NPC nudge** | "NPC" uppercase + lowercase "nudge" | the request type that suggests a course of action to a main character | canonical feature name — the *only* place "NPC" appears in our copy |
| **tenant / owner / landlord** | lowercase | the participation ladder | "the block's oldest ladder" |
| **reach in** | lowercase, two words | the verb for paid agency | never "reach into the game" |
| **move in / join the cast** | lowercase | creating a player resident | never "buy a character" (BRAND.md §10) |
| **the possession ban** | lowercase | the rule that the 8 mains can never be possessed | state it plainly; it's a selling point |
| **development build** | lowercase | caption/label on every capture | required until launch |
| **know they're AI** | lowercase | the mains' self-knowledge (locked direction) | always paired with "unaware it's a simulation" when precision matters |
| **no assigned purpose** | lowercase | the mains' starting condition | never "no purpose" alone — they *choose* one; never "soulless", "blank" |

## 2. People words — who is who

| Word | Use for | Rules |
|---|---|---|
| **resident(s)** | anyone living in the world (28 at launch: 8 mains + 20 ambients) | default noun; "residents", never "characters" when precision matters is fine — "characters" is also approved |
| **the cast / the mains / main characters** | the 8 bible-founded leads | "the eight mains" — always with the count; bibles are starting circumstances, not scripts (§1) |
| **ambients / ambient neighbors** | the 20 supporting residents | "ambient neighbors" on first use in a piece |
| **viewer(s)** | people watching free | the funnel's widest ring |
| **player(s)** | people with a paid account | players have agency, never control of mains |
| **creator** | streamers/video people covering us | "creator", never "influencer" |
| — | ~~users~~, ~~customers~~, ~~players of the AI~~, ~~NPCs~~ (standalone) | banned; see §3 |

"NPC" survives only inside **NPC nudge**. Everywhere else the people in the
world are residents or characters — "NPC" as a bare noun flattens the exact
thing the brand sells (they're written people, not background objects).

## 3. Drift table — banned word → say this instead

| Never write | Say instead | Why |
|---|---|---|
| users, userbase | viewers, players, the audience | "users" is SaaS language; we're a neighborhood |
| customers | players | transactions are credit purchases, not a storefront relationship |
| NPCs, bots, AI bots | residents, characters | they have names, routines, secrets |
| virtual people / virtual world | AI residents / the neighborhood | "virtual" says tech demo; we sell a place |
| AI-powered, powered by AI | (nothing — describe what it does) | BRAND.md §4: we don't advertise the plumbing |
| immersive, revolutionary, next-gen | (delete; show a concrete detail) | hype ban, BRAND.md §4 |
| gameplay, playthrough | a session, a stretch on the block | spectating-first; "gameplay" implies hands-on control |
| content | posts, recaps, clips | "content" is filler-speak; name the artifact |
| community (as verb) | "talk with the neighborhood", "join the Discord" | no engagement-speak verbs |
| puppet, control (of mains) | nudge, ask, reach in | possession-ban accuracy, BRAND.md §10 |
| influencer | creator | precision + tone |
| sentient, conscious, self-aware | developing, written, deciding | unverifiable mind-claims; BRAND.md §1a rubric is "developing" |
| they think they're human | they know they're AI | the vision is inverted — never imply they believe they're people |
| they know you're watching | they can't see the audience | mains are unaware it's a simulation (§1a) |
| human-like, indistinguishable from people | developing, changing over weeks | we sell becoming, not mimicry |

## 4. In-world lexicon

Real names we may use, with their authorities:

- **Residents:** first names from the world-track cast bibles (Tomás, …) —
  cite `world/characters/`; never invent a resident name.
- **Venues:** parody business names only, canonical list at
  `world/businesses.md` + `world/parody-names.json` (Mudhaus Coffee,
  Taqueria El Farolote, Auerbach Hardware, Buy-Rite Market, The 600 Club).
  Real SF business names are banned everywhere (audit check 6).
- **Places:** real street/landmark names allowed and encouraged — Dolores
  Park, Valencia St, the Mission. House numbers are always fictional
  (generated above real block ranges).
- **Karl the Fog:** the fog's name, capitalized, first reference may add
  "(the fog's name — locals named it)"; never just "fog" when Karl is the
  subject.
- **Feed vocabulary (verbatim strings — reuse exactly, never soften):**
  `resolved · declined`, `not approved`, `queued`, `watching`, `requested`.
  These are the same strings the product UI ships; drift between marketing
  and product is a bug (gate G15 checks it).

## 5. Grammar & mechanics

- **Sentence case** everywhere except the lockup and ≤4-word UI labels.
- **The em dash** is the brand's signature punctuation (title form
  "Real World — The Mission"); spaced em dashes in prose are fine, never
  use double hyphens.
- **Numbers:** spell out one–nine in prose; numerals for prices, counts
  of residents ("28 residents"), durations, and percentages.
- **Time:** "24/7" approved shorthand; hours as "6 pm" / "16:30" only in
  capture captions; durations as "30 minutes" or "30-minute session".
- **Ranges:** en dash, no spaces — "30–60 cr", "5–10 minutes".
- **Prices:** "$0.99", "about a cent each" — always flagged *provisional*
  until launch (copy-deck §pricing phrasing).
- **Ellipses:** the feed uses "…" for truncation; our prose avoids them
  (the brand doesn't trail off).
- **No exclamation marks** in brand copy. None. The block is calm.
- **Oxford comma:** yes, always — clarity over style points.

## 6. Calibration — the same fact, three registers

| Register | Line |
|---|---|
| Landing (inviting) | "Tomás closes El Farolote at eleven. What he does after that is his." |
| Pricing (clerk-clear) | "An NPC nudge runs 30–60 credits. If Tomás declines, half come back automatically." |
| FAQ (literal) | "You cannot possess the eight main characters. Neither can we." |
| Vision (inviting) | "They know they're AI. Nobody handed them a purpose — watching them choose one is the show." |
| Vision (literal) | "The mains are AIs that know they're AI. They're unaware it's a simulation and can't see the audience." |

Same fact, same nouns, three temperatures. If a draft can't pass through
all three registers without changing terminology, the terminology is wrong.

---

## 7. Governance

- New terms need a canonical source: a world-track artifact (surface names),
  the design doc (mechanics), or this file (voice). Marketing never coins
  in-world names.
- `tools/brand_audit.py` check 7 lints the §3 drift table + the NPC rule
  against every `site/*.html` page (brand.html exempt — it quotes banned
  forms deliberately). Keep the lint table and §3 in sync.
- Social drafts are covered by `tools/social_check.py` — when adding a
  banned term here, mirror it there.
