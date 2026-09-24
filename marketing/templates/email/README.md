# Email templates — the brand in the inbox

**Version:** v100 · **Status:** LOCAL — ready to wire to a sender at launch.
Templates are table-layout HTML with inline styles only (no `<style>`
dependence, no webfonts, no images-required layout — every email reads
clean with images blocked). Paste into any ESP or transactional sender;
`{{handle}}`, `{{request_id}}`, `{{status}}`, `{{item}}`, `{{date}}` are
the only merge fields.

Authority: BRAND.md §16 owns these rules; this directory is the executable
form. Feed-status wording must match `world/feed.json` vocabulary verbatim
(lexicon §4) — never soften `not approved` into "unfortunately declined".

## Files

| File | Use |
|---|---|
| `base.html` | The skeleton: preheader, tile header, body column, footer. Copy it for any new email — never freehand a new layout. |
| `welcome-watch.html` | First-run welcome for a free viewer. Sets the watch→request→move-in ladder without selling. |
| `request-update.html` | Transactional request-status notice (approved / scheduled / resolved · declined / not approved / refunded). Status line is merge-field verbatim from the feed. |
| `launch-announce.html` | Day-0 announcement to the waitlist. One idea, one link. |

## Hard rules (enforced by review, not tooling)

- **Light-first.** Clients force white backgrounds and block remote
  images. Header uses `logo-primary-dark` (dark-ink lockup) on white,
  or a plain-text "REAL WORLD — THE MISSION" fallback in the
  `alt`/text header — the email must survive with zero pixels loaded.
- **One amber element per email** — the CTA button or a single amber
  rule. Amber `#e8a04c` on white needs 18 px+ bold text or a dark
  `#1a1206` label on the fill; never amber body text.
- **No dark-mode tricks.** Don't ship Asphalt `#14161c` full-bleed
  backgrounds — half of clients render it as a black box the user
  didn't ask for. Dark is for the site, not the inbox.
- **Subject lines are sentences, not headlines.** No emoji, no "🚨",
  no ALL-CAPS, no fake replies ("re:"), no urgency ("last chance").
  The block is calm; the inbox is too. Approved pattern:
  `The block is open — Real World` / `Your request: {{status}}`.
- **Preheader text is load-bearing** — it's the second line people
  read. Write it; never leave "View this email in your browser".
- **Footer honesty.** Every email carries: why they got it
  ("you signed up to watch the block"), a real unsubscribe link
  `{{unsubscribe}}`, and the plain postal/studio line. No dark-pattern
  copy ("we'll miss you" guilt screens) on the way out.
- **No screenshots in email.** Dev-build HUD chrome + small type =
  unreadable at inbox scale and a broken-image risk. If an image is
  ever used, it's the icon tile or keyart-16x9 with full alt text —
  and the email must still make sense without it.
- **Merge fields never leak.** If `{{status}}` renders raw in a test
  send, the send is dead — add a fixture check before any launch send.
