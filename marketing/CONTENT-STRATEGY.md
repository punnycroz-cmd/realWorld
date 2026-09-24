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
  screening, deny codes, SLAs, or appeals, or
- the locked user-direction (`user-decision` shared-inbox entries — e.g.
  PRODUCTION-2 becoming-AI, 2026-09-23). Direction entries may be cited as
  *intent* only, and only where BRAND §1a permits; claims about what the
  build *does* still require shipped code on a pinned branch.

If it can't be linked or pointed to, it isn't said. Quiet weeks get
reported as quiet weeks. Never-do list lives in LAUNCH-CHECKLIST §8.

### 1a. Production-3 direction (absorbed v177)

Per the Astra concept review adopted 2026-09-24: the product is an
**observable social sandbox about AIs becoming somebody together**, and
the audience is AI-curious viewers + emergent-story fans — not the whole
life-sim market. Consequences for this strategy:

- **Clips lead with consequence, not ambience.** Publish short,
  contextualized clips of an *unexpected choice* and its *later
  consequence*, linking into that thread — never an empty street camera
  (the pair format lives in `community/clips-and-highlights.md` §3a).
- **The content model mirrors the free observer loop** — catch up →
  choose someone to follow → make a non-wager prediction → inspect the
  outcome → return. Surfaces that carry it: the journal (catch up),
  cast spotlights + thread following (follow), the Call-it card and the
  prediction ledger (predict), The Wire/The Archive (inspect). Every
  new format should name which step it serves.
- **Money copy follows the proof order.** Return visits are being
  proven first; pricing/credits copy stays provisional and labeled,
  subscriptions and sponsorships are sequenced *after* retention —
  never sell "unlimited living worlds," never a consciousness claim,
  no elaborate credit-economy pitch before repeat interest exists
  (PRICING-PAGE-CONTENT.md keeps its provisional labels).

## 2. Content pillars

| Pillar | Claim (verbatim-safe per BRAND §10) | Content it feeds |
|---|---|---|
| **Alive always** | "A neighborhood that's alive whether you're watching or not." | weekly recaps, watch-now posts, evening/night shots |
| **Agency, not control** | Requests are opportunities the world can accept, queue, or refuse — never mind control; every intervention appears on the public feed with attribution. | devlogs on the request pipeline, feed screenshots, FAQ/pricing explainers |
| **The honest build** | Dev-build captures, labeled; provisional pricing, labeled; cut features named as cut. | devlog series, launch notes, press angles |
| **Becoming** (live since v177 — production-2 shipped, BRAND §1a gate lifted) | "They know they're AI. The rest is up to them." — a cast that forms intentions, changes over weeks, surprises us. "Developing," never "human-like"; no consciousness claims. | devlog 18, cast spotlights, choice→consequence clips, press angles |

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
- RSS: `site/feed.xml` ships in the tree (v117) — RSS 2.0, one `<item>`
  per published devlog (17 today), placeholder domain swept by
  `tools/swap_domain.sh` like every other URL; journal.html carries the
  `rel=alternate` link. Rule: item count must equal devlog count on the
  page — add an item in the same commit as the post.

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
| Direction | becoming-AI framing was held off public pages until production-2 shipped — RESOLVED (v177, `1980949` merged); §1a claims now require the shipped-build check like everything else | self-check vs BRAND |

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
| Devlog 5 — "Meet the venues" | live on `journal.html` (v57); record at `marketing/content/devlog-05-meet-the-venues.md` | world `businesses.json` (25 live venues + `web` mesh) + `businesses/` + `directory.html` (world-v16/v30) |
| Devlog 6 — "The Archive: the block keeps its receipts" | live on `journal.html` (v46); record at `marketing/content/devlog-06-the-archive.md` | world-v20 `archive.html`/`archive-ui.md`/`history.json`, game-v6 `gsWireDays`/`gsWireArchiveDay` |
| Devlog 7 — "Now hiring: the block posts real jobs" | live on `journal.html` (v57); record at `marketing/content/devlog-07-now-hiring.md` | world-v31 `market.md`/`market.json`, game-v8 `41_game_systems_hiring.js`, `requests.json` hire row |
| Devlog 8 — "The wallet shows its math" | live on `journal.html` (v72); record at `marketing/content/devlog-08-the-wallet.md` | world-v32 `requests.json → wallet/appeals/co_sponsor/session_extend` + `request-ui.md` §8 |
| Devlog 9 — "Every door has a tryout" | live on `journal.html` (v72); record at `marketing/content/devlog-09-every-door-has-a-tryout.md` | world-v45 `applications.md`/`applications.json` (16 job arcs, 8 housing rows, decline bank, never-list) + `apply.html` |
| Devlog 10 — "The Ear: complaints climb a ladder" | live on `journal.html` (v87); record at `marketing/content/devlog-10-the-ear.md` | world-v59 `grievances.md`/`grievances.json` (5-rung ladder, 24 work + 7 housing rows, 2 offstage parody orgs) + `grievance.html`; game-v11 `gsFileDispute`/`gsResolveDispute` |
| Devlog 11 — "The menu is the truth." | live on `journal.html` (v102); record at `marketing/content/devlog-11-the-menu.md` | world-v72 `menus.md`/`menus.json` (20 door venues, 101 items, sig/`ask`/`when` rules, board-agreement gate G15c) + `menus.html` ("The Board") |
| Devlog 12 — "Joining the cast means signing a lease." | live on `journal.html` (v117); record at `marketing/content/devlog-12-joining-the-cast.md` | world-v77 `creation-ui.md`/`creation.json` v25 (6 steps, shared `RWScreen`, bill-on-approval 500 cr, seat waitlist, BLOCK_CAP proposal 12) + `create.html`; game-v8 `billOnApproval` |
| Devlog 13 — "The block wakes up in waves." | live on `journal.html` (v132); record at `marketing/content/devlog-13-the-commute.md` | world-v87 `commute.json`/`commute.md` (22 routes, 6 modes incl. real Muni lines, leave windows + weather deltas, 10 overlaps, `building_pulse`, 4 non-commuters, INTERNAL-tier privacy contract) + `commute.html` |
| Devlog 14 — "The paper cuts both ways." | live on `journal.html` (v147); record at `marketing/content/devlog-14-the-counter-paper.md` | world-v96 `leases.json`/`lease-ui.md` §§49–54 (`rw_lease_v96`: assignments w/ clean-ledger gate + deposit carry, buyouts as offers w/ 30-day cooldown + BUYOUT code, prepaid credit cap 3× w/ oldest-first drawdown, history letter once-per-tenancy; `feed_wording.never` +4) + `lease.html` v6 |
| Devlog 15 — "The bench takes requests." | live on `journal.html` (v147); record at `marketing/content/devlog-15-the-bench.md` | world-v99 `crowd.json` (`pull_protocol`: 15–90 min, ≤3/day, ≤2 concurrent, ≥60 min cooldown, one-zone-step bounds, role-bound, minors never pullable, wire-invisible) + `coverage` A01–A20 (understudy/sign/open/pack reads) + `crowd-sim.md` §§26–28, `crowd.html` |
| Devlog 16 — "The meter runs itemized." | live on `journal.html` (v162); record at `marketing/content/devlog-16-the-meter.md` | world-v110 `leases.json` v110 (`utilities` itemized-beside-rent + contested_charge ground, `rent_board_fee` $59/unit ≤50% RBF pass-through once/12mo, `abandoned_property` 15-day claim + cited storCost, `change_of_terms` MTM-only ≥30d never-rent + respondCOT, `last_month_proration` round(rent×days/30)) + `lease-ui.md` §§55–61, `lease.html` v7; $59 mirrors game-v17 `41_game_systems_assessor.js` |
| Devlog 17 — "Nobody performs for an empty room." | live on `journal.html` (v162); record at `marketing/content/devlog-17-the-empty-room.md` | world-v111 `thinai.json` v111 (`observation_tiers` watched/shadowed/dark attention-driven, `lazy_thin` closed-form resolve + eager obligations + observational-equivalence claim, `witness_record` mode-blind seen-fact schema "X was at Y", `compute_soak` watched/shadowed/dark_min split) + `thin-ai.md` §§47–52, `thinai.html` Understudy v8 — spec + internal demo, framed as contract not shipped spectator surface |
| Devlog 18 — "They know they're AI. The rest is up to them." | live on `journal.html` (v177); record at `marketing/content/devlog-18-the-becoming.md` | production-2 integration report (shared inbox 2026-09-24): becoming brain contract (order/directive/why, reflex→order→directive→intention_gap), possession checks 11/11, 8-agent playtest (33 dispatches, named surprises), stated gaps — one model, convo no_answer floor, no lifelogged routines, file:// only |
| Recap format preview | live on `journal.html`, labeled illustrative | feed-vocabulary contract (`world/feed.json`) |

Backlog (write when the source lands — never ahead of it):
storefront-layer devlog (world-v44 `storefronts.json` fascia/window/
aframe/flyers/neon copy — still gated: art-v43 shipped the storefront
glass/menu-board/neon render *boxes* but not the authored text on them;
draft once the render draws the authored copy so the post can show it);
commerce-layer devlog (devlog-11 covered the catalog; the "order-
something" request type + character commerce are gated on the game
track consuming `menus.json` — draft when it lands);
lease-ledger deep-dive is now PARTIALLY covered — devlog-14
shipped the counter-paper instruments and devlog-16 the meter &
leftovers layer; a pure ledger-mechanics
follow-up (scars, NOFAULT/BUYOUT legibility coding) still has room;
onboarding-privacy devlog candidate (world-v109 `onboarding.json`
privacy beat 6, S2b data card, S4g silent-flag lesson — "the flag is
quiet" is a strong moderation story; draft when it pairs naturally
with a public surface),
a wire.html-screenshot
post if the world/art tracks publish a spectator-app capture,
memory-model explainer once game-systems implements
the memory spec (research-only today — do not preview).
RESOLVED (v177): the production-2 / becoming-AI announcement shipped
as devlog 18 the version the pinned baseline merged. The moderation
transparency-note format is no longer backlog — the template ships at
`templates/transparency-report.md` (fill when the live feed emits
`moderation.json`-shaped stats).
