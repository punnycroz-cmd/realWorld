# AI Transparency — what's AI in Real World, and what isn't

One-page disclosure sheet for AI-beat reporters, "is this AI slop?"
questions, and storefront AI-disclosure fields. Everything below matches
the locked design; bracketed fields are placeholders.

**Status: pre-launch draft. Nothing here has been published.**

---

## The honest summary

> Real World uses AI for exactly one thing: the inner lives of its
> fictional residents — what they decide to do next, what they say to
> each other, what they remember. The world they live in is
> hand-authored: real Mission District street geometry, a hand-built
> renderer, written storylines. No art, music, voices, or marketing
> copy on this page is AI-generated. The eight main characters' minds
> run on AI and can never be possessed or puppeteered — by players or
> by us — which is the opposite of the usual concern: the AI is the
> part of the product nobody is allowed to control.

## What's AI-driven

- **The eight main characters.** Each runs a full AI mind — perception,
  memory, mood, planning — and acts on it around the clock. Their
  dialogue and decisions are model output, not a script tree.
- **The twenty ambient neighbors.** Lightweight AI routines: schedules,
  errands, crowd behavior. Deliberately simpler than the mains — they're
  the neighborhood's background hum, not protagonists.
- **Request handling.** Paid player requests are auto-classified
  (exclusive / compatible / queued) before entering the world.

## What isn't

- **The visuals.** Every pixel is a deterministic canvas renderer
  drawing hand-authored geometry — no diffusion models, no generated
  textures. The screenshots in this kit are literal captures.
- **The writing you'll read as a spectator.** Resident *names*,
  biographies, businesses, and storylines are authored. Residents'
  live speech is model output; the world they're speaking inside is
  written by hand.
- **Audio.** There is no voice acting or TTS — that's a deliberate cut,
  not a roadmap item. Residents speak in text.
- **Your data.** There is no ad-tech, no behavioral profiling. The
  analytics plan is cookieless and self-hosted (see `ANALYTICS.md`).

## The control rules (the part worth quoting)

- The eight mains **can never be possessed** — not by players, not by
  the game's owner. Nobody can reach into a main character's head.
- Paid requests are **time-boxed, hard-capped, and publicly logged** —
  a request declares its action and duration upfront and posts to a
  feed everyone can read. No secret influence.
- Characters can **refuse**. A request is a request into the world,
  not a command onto a person.
- **No cash-out, no crypto, no loot boxes.** Nothing in the world is a
  financial instrument.

## Costs, stated plainly

The mains' inference costs are real but small — on the order of cents
per character per day at current API prices. The design's actual cost
centers are writing, moderation, and ops, not tokens. (Sourced figures:
internal market/monetization research report, September 2026.)

## For AI-disclosure fields on storefronts

| Question | Answer |
|---|---|
| Does the game use AI to generate content during play? | **Yes** — resident dialogue and decisions (text only) |
| Does it use AI-generated art/audio/video? | **No** |
| Is AI content pre-generated or live? | **Live** — residents think in real time, 24/7 |
| Can players create AI content? | Indirectly — requests can prompt character behavior, which is moderated, time-boxed, and public |

## Red lines for coverage

- Don't call the mains "chatbots" — they're persistent characters with
  memory and ongoing storylines; "AI-driven characters" is accurate.
- Don't say players "control" or "play as" the cast — requests are
  asks into the world; the possession ban is the headline.
- Don't imply the visuals are generative — the renderer is hand-rolled
  canvas code; that distinction is the whole art story.

Questions: [press@ — placeholder, set at launch]
