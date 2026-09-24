# Deck template — Real World ("The Mission")

The sanctioned slide skeleton for pitches, press briefings, partner meetings,
and festival submissions. Brand rules: `marketing/BRAND.md` §18. This file is
the enforcement doc — same role `templates/email/README.md` plays for §16.

## Files

| File | Role |
|---|---|
| `base.html` | The only sanctioned skeleton. Duplicate it per deck; never restyle a copy. |

## Using it

1. `cp base.html my-deck.html` — one file per deck, self-contained.
2. Fill the slides. Slide kinds are fixed: `s-title`, `s-statement`,
   `s-split`, `s-stats`, `s-shot`, `s-end`. Delete kinds you don't need;
   don't invent new ones without a BRAND.md §18 edit.
3. Screenshots: real captures from `site/shots/` only, on the `.shot` plate,
   captioned "development build" (BRAND.md §8). Swap the placeholder `div`
   for the `<img>` line that's already in the file.
4. Navigate with arrow keys / click; `#N` deep-links. Export to PDF with the
   browser's print dialog — one slide per landscape page is built in.

## Hard rules

- **Dark-first.** Asphalt `#14161c` background, Paper `#ece7dc` text. No
  light variant exists — if a venue demands one, use the email palette rules
  (§16): Paper-warm background, dark ink, `logo-primary-dark`.
- **One amber per slide.** The `.amber` class appears once per slide at most —
  a number, a rule line, one word. Amber is the lit window, not decoration.
- **Contrast is certified.** Only use the pairs in the BRAND.md §5 matrix
  (Paper/Fog on darks; Ink on amber). `tools/brand_audit.py` check 8 pins the
  hexes in `base.html` to `brand-tokens.json` — a palette change requires
  regenerating `:root` here in the same commit.
- **Numbers answer to §10.** Every stat traces to the design doc, the shipped
  product, or is labeled PROPOSAL (monetization projections). No invented
  metrics — same as site copy.
- **Cut transitions.** The deck advances on hard cuts only — the file ships
  with none. If you port the deck to Keynote/Slides, turn transitions off.
- **End card is the end card.** `s-end` = icon + one approved tagline
  (BRAND.md §3). No URL cramming, no "questions?" slide — contacts go in the
  follow-up email.

## Sizing

Projector-safe by construction: title wordmark ~7.5vh, statements ~6.2vh,
bullets ~2.3vh — all viewport-relative so 1080p projectors and laptop screens
get the same composition. Keep bullets ≤ 6 words, ≤ 5 per slide (§18).
