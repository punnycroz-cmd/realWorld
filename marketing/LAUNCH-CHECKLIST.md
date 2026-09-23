# Launch Checklist — Real World ("The Mission")

**Status: ALL PENDING — nothing on this list may be executed without the
owner's explicit approval.** Publishing, posting, account registration, ad
spend, and press contact are all owner-gated actions. This file is the plan so
that "go" takes one decision, not a scramble.

Legend: `[ ] PENDING` = awaiting owner gate · `[x] REHEARSED` = verified
locally via `tools/staging_dryrun.sh`, still gated · `[~] DRAFTED` = artifact
exists locally, unpublished.

**One-command rehearsal:** `./tools/staging_dryrun.sh` — serves `site/` on
127.0.0.1, checks every page/asset/meta/budget item, prints pass/warn/fail.
Last run **2026-09-22 22:39 PDT: 21 pass / 3 warn / 0 fail** (warns =
placeholder domain not yet swapped + 1 PNG >2 MB — both expected pre-launch).

---

## §1 Pre-launch gates (all must be true before day-0)

| # | Gate | Owner | Status |
|---|------|-------|--------|
| G1 | Owner approves public launch in writing (the go/no-go, §4) | owner | `[ ] PENDING` |
| G2 | Game build verified live and stable enough for spectators | owner + game track | `[ ] PENDING` |
| G3 | Real domain registered; `realworld-game.example` replaced in all 8 files (canonical links, OG URLs, `sitemap.xml`, `robots.txt`). Sweep: `grep -rIl realworld-game.example site/` must return empty | owner + mkt | `[ ] PENDING` — sweep is automated in dry-run §4 |
| G4 | Pricing flip: owner approves final numbers → set `data-pricing="final"` on `pricing.html` `<body>` (one attribute — PRICING-PAGE-CONTENT.md §1). Same-commit sync: `faq.html`, `social/drafts/pricing-post.md`, STORE-COPY.md if numbers changed | owner | `[ ] PENDING` — flip rehearsed, attribute is live CSS |
| G5 | Screenshot gallery refreshed with launch-build captures (current = v15 dev build) | mkt, needs art publish | `[ ] PENDING` — refresh procedure documented in inbox v3/v5 |
| G6 | Press contact email + social handles registered (placeholders today — no accounts exist) | owner | `[ ] PENDING` — account checklist in SOCIAL-LAUNCH-PLAN.md |
| G7 | Legal pass: payment terms, refund policy (auto-refund on failed requests is a product promise — wording must match), privacy policy, age-gating/COPPA posture | owner | `[ ] PENDING` |
| G8 | Analytics: shim wired on all pages but INERT — set `data-endpoint` on `js/analytics.js` include after owner picks backend (Umami/Plausible CE/first-party sink; ANALYTICS.md §2+§9), then verify events on staging | owner + mkt | `[x] REHEARSED` — shim verified inert 2026-09-22 |
| G9 | Press kit zip rebuilt after G3/G4/G5 land: `./build-press-kit.sh` | mkt | `[x] REHEARSED` — one-command rebuild verified |
| G10 | Dry-run clean: `tools/staging_dryrun.sh` → 0 fail, 0 placeholder warns | mkt | `[x] REHEARSED` — currently 21/3/0, warns = G3 |

## §2 Day 0 — launch day (in order)

Timings below are measured from the 2026-09-22 local dry-run; production adds
DNS/CDN latency only.

| # | Task | Est. | Status |
|---|------|------|--------|
| D0.1 | Deploy `marketing/site/` to production hosting at real domain | ~15 min | `[ ] PENDING` |
| D0.2 | Run production smoke pass (same checks as dry-run, against live URL): all pages 200, sitemap+robots reachable, JSON-LD parses, OG card renders in a share validator | ~10 min | `[x] REHEARSED` locally — 0.001s TTFB/page |
| D0.3 | Flip "in development" labels → launch copy; CTA → live watch URL | ~20 min | `[ ] PENDING` |
| D0.4 | Submit `sitemap.xml` to Search Console + Bing Webmaster | ~10 min | `[ ] PENDING` (owner accounts) |
| D0.5 | Publish launch devlog post ("the door is open") | ~15 min | `[~] DRAFTED` — social/drafts/launch-thread.md |
| D0.6 | Post launch announcement on registered channels (owner approves each post) | ~30 min | `[~] DRAFTED` — SOCIAL-LAUNCH-PLAN.md timeline |
| D0.7 | Send press kit link to owner-approved press list (angle templates in PRESS-OUTREACH.md) | ~30 min | `[~] DRAFTED` — 3 pitch angles ready |
| D0.8 | Community posts where welcome (owner-approved subs/Discords only) | ~30 min | `[~] DRAFTED` — seeded-questions.md |
| D0.9 | Monitor: uptime, analytics funnel (`visit→watch_start→request_submitted→character_created`), request-feed health | continuous | `[ ] PENDING` |
| D0.10 | Same-day retro note → MARKETINGLOG.md + shared inbox | ~15 min | `[ ] PENDING` |

## §3 Rollback runbook

Trigger conditions and the exact response:

| Symptom | Threshold | Action |
|---------|-----------|--------|
| Site down / 5xx | >5 min | Point DNS/hosting to static maintenance page (`404.html` restyled); game world unaffected |
| OG cards broken | any | Revert last deploy; cards are cosmetic — do not hold launch for this alone |
| Pricing page wrong | any | Flip `data-pricing` back to `"provisional"` + revert commit; purchases pause until fixed |
| Analytics dead | day-0 | Non-blocking — funnel events buffer in the spec; fix day-1 |
| Request feed abused | any | Game-side moderation (owner decision); marketing pulls CTA to watch-only copy |

Full rollback = maintenance page + pause posts + note in shared inbox. No data
loss possible: the site is fully static and stateless.

## §4 Go / No-Go template

Copy this block into the owner decision thread at T-24h:

```
GO/NO-GO — Real World launch, <date>
Gates: G1..G10 status: <x/10 green>
Blocking items: <list or none>
Known warnings: <dry-run warns accepted as non-blocking>
Decision: GO / NO-GO — <owner name>, <timestamp>
```

## §5 Owner sign-off record

| Gate | Approved by | Date | Notes |
|------|-------------|------|-------|
| Launch approval (G1) | | | |
| Final pricing (G4) | | | |
| Legal/privacy (G7) | | | |
| Analytics backend (G8) | | | |

## §6 Day 7 — first week

- [ ] PENDING — First "This Week on the Block" recap post (from public feed)
- [ ] PENDING — Launch metrics review: visits→watch sessions→credit purchases; funnel leaks → MARKETINGLOG.md
- [ ] PENDING — Search Console coverage check; fix indexing issues
- [ ] PENDING — Triage community questions; recurring ones → `faq.html`
- [ ] PENDING — Second devlog post (honest post-launch retrospective)
- [ ] PENDING — Press follow-ups only to outlets that engaged (no spam rounds)
- [ ] PENDING — Trailer greenlight decision based on week-1 spectator retention (TRAILER-PLAN.md ready to execute)

## §7 Day 30 — first month

- [ ] PENDING — Month-1 report: MAU, watcher→requester conversion, payer rate, credit burn vs. projections, top entry pages, top queries
- [ ] PENDING — Pricing review: provisional figures holding? Changes proposed to owner (never silent)
- [ ] PENDING — Content calendar retro: which posts earned traffic/links; adjust SEO-PLAN tiers with real query data
- [ ] PENDING — Community funnel check: Discord/forum health if created
- [ ] PENDING — Press kit v1.1: real earned quotes (attributed), final pricing, launch screenshots, trailer link if produced
- [ ] PENDING — Roadmap review: re-rank remaining marketing focuses against month-1 data; update MARKETING_ROADMAP.md
- [ ] PENDING — Season-2 neighborhood marketing decision only if shard-1 retains (research: do NOT split the audience early)

## §8 Never-do list (load-bearing)

- No publishing, posting, account registration, ad spend, or press contact without explicit owner approval — ever.
- No fake testimonials or invented quotes. No astroturfing.
- No promises for cut features (voice/TTS v1, cash-out/RMT, loot boxes, ambient-NPC economies).
- No claims the game is playable before a live build exists.
- No real SF business names — parody names only (per user-decision 2026-09-22).
