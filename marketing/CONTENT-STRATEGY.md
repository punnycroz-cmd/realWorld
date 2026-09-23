# Content Strategy — Real World ("The Mission")

Canonical source for **what we publish, on what cadence, from what source
material, and through which gate.** Owned by the marketing track
(`sf/marketing`, `marketing/` only). Local-build only: nothing in this file
executes publicly without explicit owner approval.

Related docs: BRAND.md (voice/palette), SOCIAL-LAUNCH-PLAN.md (channels +
launch calendar), COMMUNITY-FUNNEL.md (Discord/recap pipeline),
SEO-PLAN.md (search), ANALYTICS.md (measurement), DEMO-PAGE.md (watch
surface). Journal page: `site/journal.html` ("The Dispatch").

---

## 1. The one rule

**Everything we publish is sourced.** The product's differentiator is an
honest, observable world — the marketing is the same. Every post, recap,
screenshot caption, and devlog claim must trace to:

- the design doc (`devin-reviews/rw-game-design-2026-09-22.md`),
- the shipped build (real captures from `site/shots/`, copied — never
  hotlinked — from the art track's `published/`),
- the public request feed (post-launch), or
- the world track's canon (`world/characters/_index.md`; parody business
  names — naming authority `world/businesses.md`, generated mirror
  `world/parody-names.json`, ~89 mappings; canonical names preferred over
  generic descriptors in all copy since the v22/v27 sweeps), or
- the request-pipeline/moderation contract (`world/moderation.json` +
  `world/moderation-tooling.md`, world v8) — the source for any claim about
  screening, deny codes, SLAs, or appeals.

If it can't be linked or pointed to, it isn't said. Quiet weeks get
reported as quiet weeks. Never-do list lives in LAUNCH-CHECKLIST §8.

## 2. Content pillars

| Pillar | Claim (verbatim-safe per BRAND §10) | Content it feeds |
|---|---|---|
| **Alive always** | "A neighborhood that's alive whether you're watching or not." | weekly recaps, watch-now posts, evening/night shots |
| **Agency, not control** | Requests are opportunities the world can accept, queue, or refuse — never mind control; every intervention appears on the public feed with attribution. | devlogs on the request pipeline, feed screenshots, FAQ/pricing explainers |
| **The honest build** | Dev-build captures, labeled; provisional pricing, labeled; cut features named as cut. | devlog series, launch notes, press angles |

## 3. Formats and cadence

| Format | Where | Cadence | Source | Template |
|---|---|---|---|---|
| **Devlog** | site/journal.html → syndicated to social | Irregular pre-launch — only when a real change ships (never on quota) | shared-inbox entries from art/game/world tracks + real captures | `templates/devlog-post.md` |
| **This Week on the Block** | site/journal.html (long-form) → social recap (short) | Sundays, post-launch | public request feed + character activity | `templates/weekly-recap.md` (site), `social/drafts/recap-format.md` (social) |
| **Cast spotlight** | X/Bluesky card | 8 mains: T-12/T-8/T-4 pre-launch, then every other day post-launch | world/characters bibles (tease, never confirm spoilers — SOCIAL §4) | `social/drafts/cast-spotlights.md` |
| **Devlog clip** (15–45s) | TikTok/X/Shorts | ~weekly pre-launch, then feed-driven | build captures, trailer shot list | `social/drafts/devlog-clips.md`, TRAILER-PLAN.md |
| **Launch notes** | site/journal.html | at launch + each major update | changelog-equivalent: what changed, what it costs, what was cut | `templates/devlog-post.md` (variant flag) |
| **Press pitch** | email (owner-gated) | per PRESS-OUTREACH angles | press kit | `PRESS-OUTREACH.md` |

### Weekly effort budget (post-launch steady state)

~2 h/week drafting: 1 recap (≈45 min — pull feed, pick beats, write),
1–2 social posts cut from the recap, journal publish. Everything else is
reactive (a genuinely great emergent moment breaks format — see
recap-format.md production notes).

## 4. Production pipelines

### Devlog (pre-launch journal posts)

1. Read the shared inbox since the last post — art/game/world entries are
   the raw material (renames, new systems, new captures).
2. Pull fresh captures from `your_files/sf-art-evolution/published/` when
   the build is meaningfully better; copy into `site/shots/` + webp.
3. Write per `templates/devlog-post.md`; every claim must name the system
   or capture it describes.
4. Gate: BRAND §10 accuracy checklist → owner approval → publish with the
   site deploy (one command, see LAUNCH-CHECKLIST).

### This Week on the Block (post-launch)

1. Export the week's public request feed (approved / queued / refunded /
   attributed requests) + notable character activity.
2. Fill `templates/weekly-recap.md`: headline event, feed beats with
   attribution, resident beats, the numbers, next-week hook.
3. **Link rule:** every recap line links to its feed entry. If we can't
   link it, it didn't happen. The mechanics landed with game-v6 +
   world-v19: feed entries carry stable `d<MMDD>-<feedN>` ids that deep-link
   as `#e=<id>` on the spectator app and still resolve in the day Archive
   (`history.json`-shaped day objects keep ids live→archive). Recap links
   point at `<site>/watch#e=<id>` (or the domain equivalent); ids are also
   the citation format for press/creators quoting an event.
4. Cut the social version from the same material (`recap-format.md`).
5. Gate: same as devlog. Until the live feed exists, the journal shows the
   illustrative-format preview only — already on `journal.html`, labeled.

### Journal page mechanics (`site/journal.html`)

- Newest post on top; devlogs and recaps share the `journal-post` card
  style; `post-meta` line carries type + date + build tag.
- `data-page="journal"` for analytics; no embed, no JS dependency —
  renders on `file://` and with JS off.
- RSS: declared intent on the page ("ships with the live site") — add
  `feed.xml` when the domain lands; it's a static file, same pipeline.

## 5. SEO role of the journal

Journal is the keyword surface the landing pages can't be: devlogs target
long-tail ("AI life sim devlog", "Truman Show game", "persistent AI
village"), recaps target branded/community queries. Rules:

- One primary query per post (SEO-PLAN tiers); descriptive `<title>` via
  post headline, not clickbait.
- Posts link back to demo.html / how-it-works.html (internal-link audit,
  SEO-PLAN §internal).
- Recap titles stay dated and factual — they're also the linkable archive
  press and creators cite.

## 6. Approval gates (all content)

| Gate | What | Owner |
|---|---|---|
| Accuracy | BRAND §10 verbatim-safe list; no cut features, no invented quotes, parody names only | self-check, then owner |
| Spoilers | tease season-one material, never confirm (SOCIAL §4) | self-check |
| Publication | any public surface — site deploy, social post, press send | **owner, explicitly** |
| Sourcing | recaps only report linkable feed events | self-check |

## 7. Gap register (what this strategy still needs)

- **Live public request feed** — gates real recaps (game/world tracks).
- **Production domain** — gates RSS, canonical URLs, OG absolute URLs
  (currently `realworld-game.example` placeholders, dry-run warns on them
  by design).
- **Spectator build URL** — gates `demo.html` flip (one attribute,
  DEMO-PAGE.md §1) and "watch now" CTAs resolving to a live view.
- **`world/businesses.md`** — RESOLVED (v27). The dedicated file + generated
  `parody-names.json` are published; site pages, press-kit captions, brand
  samples, and trailer shot notes were swept to canonical names. Remaining
  generic descriptors are deliberate voice choices, not placeholders.

## 8. Published & drafted register

| Piece | State | Source |
|---|---|---|
| Devlog 1 — "How the block learned to look like the Mission" | live on `journal.html` | art v1→v28 inbox history + game lease/request systems |
| Devlog 2 — "Every request knocks before it enters" | live on `journal.html` | world-v8 `screen.js`/`moderation.json`/`mod-console.html` |
| Devlog 3 — "Rent is due on the first" | live on `journal.html` (v42) | world `jobs-housing.md`, `leases.json`, `housing/` |
| Devlog 4 — "The Wire: every event gets a permalink" | live on `journal.html` (v42); record at `marketing/content/devlog-04-the-wire.md` | game-v6 `41_game_systems_feed.js`, world-v19 `wire.html`/`wire-ui.md`/`feed.json` |
| Devlog 5 — "Meet the venues" | drafted, `marketing/content/devlog-05-meet-the-venues.md` | world `businesses.json` + `businesses/` + `directory.html` (world-v16) |
| Recap format preview | live on `journal.html`, labeled illustrative | feed-vocabulary contract (`world/feed.json`) |

Backlog (write when the source lands — never ahead of it): lease-ledger
devlog deep-dive (devlog-3 covers the intro; a ledger-mechanics follow-up
still has room), a transparency note format for moderation stats once the
live feed emits `moderation.json`-shaped events, a wire.html-screenshot
post if the world/art tracks publish a spectator-app capture, memory-model
explainer once game-systems implements the memory spec (research-only
today — do not preview).
