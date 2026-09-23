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
Last run **2026-09-23: 32 pass / 3 warn / 0 fail** (warns = placeholder domain
not yet swapped ×2 + 1 PNG >2 MB — all expected pre-launch).
**One-command go-gate:** `./tools/preflight.sh` wraps the dry-run plus secret
scan, sitemap parity, press-kit freshness, and flip-flag status. Last run
**2026-09-23: 0 fail, 6 warn** — all warns are owner-gated flags (G3/G4/G8/G9/G12).

**Change control:** after any content edit to `site/`, re-run the dry-run and
log the result in §10 before the checklist may cite it.

---

## §1 Pre-launch gates (all must be true before day-0)

| # | Gate | Owner | Status |
|---|------|-------|--------|
| G1 | Owner approves public launch in writing (the go/no-go, §6) | owner | `[ ] PENDING` |
| G2 | Game build verified live and stable enough for spectators | owner + game track | `[ ] PENDING` |
| G3 | Real domain registered; `realworld-game.example` replaced in all 14 files (canonical links, OG URLs, `sitemap.xml`, `robots.txt`). Sweep: `grep -rIl realworld-game.example site/` must return empty | owner + mkt | `[ ] PENDING` — sweep is automated in dry-run §4 |
| G4 | Pricing flip: owner approves final numbers → set `data-pricing="final"` on `pricing.html` `<body>` (one attribute — PRICING-PAGE-CONTENT.md §1). Same-commit sync: `faq.html`, `js/pricing.js` constants, `social/drafts/pricing-post.md`, STORE-COPY.md if numbers changed | owner | `[ ] PENDING` — flip rehearsed, attribute is live CSS |
| G5 | Screenshot gallery refreshed with launch-build captures (current = v22 dev build + v16 interior vignettes + v1 early-pass pair) | mkt, needs art publish | `[ ] PENDING` — refresh procedure documented in inbox v3/v5 |
| G6 | Press contact email + social handles registered (placeholders today — no accounts exist) | owner | `[ ] PENDING` — account checklist in SOCIAL-LAUNCH-PLAN.md |
| G7 | Legal pass: payment terms, refund policy (auto-refund on failed requests is a product promise — wording must match), privacy policy, age-gating/COPPA posture | owner | `[ ] PENDING` |
| G8 | Analytics: shim wired on all pages but INERT — set `data-endpoint` on `js/analytics.js` include after owner picks backend (Umami/Plausible CE/first-party sink; ANALYTICS.md §2+§9), then verify events on staging (`tools/analytics_e2e.sh` proves the localhost path today; re-verify against the real backend on staging) | owner + mkt | `[x] REHEARSED` — shim verified inert; e2e PASS 1057/1057 events (2026-09-23) |
| G9 | Press kit zip rebuilt after G3/G4/G5 land: `./build-press-kit.sh` | mkt | `[x] REHEARSED` — one-command rebuild verified 2026-09-23 |
| G10 | Dry-run clean: `tools/staging_dryrun.sh` → 0 fail, 0 placeholder warns | mkt | `[x] REHEARSED` — currently 32/3/0, warns = G3 ×2 + 1 PNG weight |
| G11 | Community surfaces: Discord server created per COMMUNITY-FUNNEL.md §3 checklist; rules + feedback asks pinned; `community.html` placeholder copy swapped to real invite link | owner | `[ ] PENDING` — full spec + setup checklist in COMMUNITY-FUNNEL.md |
| G12 | Demo page live: set `data-demo-src` on `demo.html` `#demo-stage` to the spectator build URL; verify `?embed=` staging pass + `watch_start{mode:"live"}` event; sync feed-preview labels per G15 | owner + game track | `[ ] PENDING` — fallback verified; one-attribute flip at launch |
| G13 | Moderation readiness: owner picks feed display-filter option A/B/C (MODERATION-PLAN.md §2.3 — `moderation.json.display_filter` mirrors it) and confirms the game build wires the world-v8 contract (`screen.js` verdicts, lane routing, `reason_code` on feed denials, `mod_decision` ledger records — console demo exists at `world/mod-console.html`); `rules.html` copy is option-neutral until decided | owner + game track | `[ ] PENDING` — full spec in MODERATION-PLAN.md |
| G14 | Infrastructure provisioned per INFRASTRUCTURE.md §5: domain + DNS live, host deployed (`deploy/deploy-site.sh`), TLS issued, analytics backend up (G8), Stripe account + products created (test→live), uptime monitor armed, `maintenance.html` staged on host for rollback | owner + mkt | `[ ] PENDING` — full runbook + configs in `deploy/`; `tools/preflight.sh` is the step-0 go-gate; est. 2–3 h |
| G15 | Feed vocabulary sync: `world/feed.json` `request_status` (canonical: requested, in_review, approved, running, queued, resolved, refunded, "not approved", "player session ended") is the contract. Before launch flip, diff the labels in `demo.html` feed-preview, `journal.html` recap sample, `social/drafts/recap-format.md`, and `analytics-events.json` against it — demo/journal labels are marked "illustrative" today | mkt + game/world track | `[ ] PENDING` — world-v4/v5 shipped the canonical vocab; marketing labels must match the live feed verbatim |

## §2 Run of show — T-minus schedule

The ordered countdown. Each line is owner-visible; nothing executes early.

| When | What | Depends on |
|------|------|-----------|
| T-7d | Content freeze on `site/` (bugfixes only); social drafts re-read against BRAND.md voice; press list re-confirmed with owner | G6 |
| T-5d | Full local rehearsal: dry-run + press-kit rebuild + animatic review; log results in §10 | G9, G10 |
| T-3d | Staging deploy at placeholder domain; run `tools/prod_smoke.sh` against staging; OG card validated in a share-preview tool | G14 (staging half) |
| T-48h | Go/No-Go issued (§6 template); if GO, flip G4 pricing + G15 vocab sync in ONE commit on `sf/marketing` | all gates |
| T-24h | Final dry-run on the exact commit that will ship; press kit zip rebuilt and staged; day-0 posts loaded into drafts folder in send order | G9, G10 |
| T-2h | Production deploy D0.1 + smoke D0.2; demo flip D0.3b verified end-to-end | §3 |
| T-0 | Announce: devlog post D0.5 → channels D0.6 → press D0.7 → community D0.8/D0.8b, spaced ≥20 min apart so each can be pulled independently | §3 |
| T+2h | First monitoring checkpoint: uptime, `watch_start` firing, request feed healthy, mod queue depth = 0 surprises | D0.9 |
| T+24h | Day-1 metrics snapshot vs. ANALYTICS.md funnel; note anything weird in MARKETINGLOG + shared inbox | D0.10 |
| T+7d / T+30d | §8 / §9 lists | — |

## §3 Day 0 — launch day (in order)

Timings below are measured from local dry-runs; production adds DNS/CDN
latency only.

| # | Task | Est. | Status |
|---|------|------|--------|
| D0.1 | Deploy `marketing/site/` to production hosting at real domain via `deploy/deploy-site.sh --apply` (or git-connected host) | ~15 min | `[ ] PENDING` — script rehearsed dry-run |
| D0.2 | Run production smoke pass: `tools/prod_smoke.sh https://<domain>` — pages 200, sitemap+robots, JSON-LD parses, security headers, served-placeholder sweep; OG card renders in a share validator | ~10 min | `[x] REHEARSED` locally — prod_smoke.sh is the live counterpart of the dry-run |
| D0.3 | Flip "in development" labels → launch copy; CTA → live watch URL | ~20 min | `[ ] PENDING` |
| D0.3b | Demo page flip: set `data-demo-src` on `demo.html`, reload, confirm iframe mounts and `watch_start` fires with `mode:"live"`; confirm feed-preview labels match the live feed (G15) | ~10 min | `[ ] PENDING` — gated on G12 + G15 |
| D0.4 | Submit `sitemap.xml` to Search Console + Bing Webmaster | ~10 min | `[ ] PENDING` (owner accounts) |
| D0.5 | Publish launch devlog post ("the door is open") | ~15 min | `[~] DRAFTED` — social/drafts/launch-thread.md |
| D0.6 | Post launch announcement on registered channels (owner approves each post) | ~30 min | `[~] DRAFTED` — SOCIAL-LAUNCH-PLAN.md timeline |
| D0.7 | Send press kit link to owner-approved press list (angle templates in PRESS-OUTREACH.md) | ~30 min | `[~] DRAFTED` — 3 pitch angles ready |
| D0.8 | Community posts where welcome (owner-approved subs/Discords only) | ~30 min | `[~] DRAFTED` — seeded-questions.md |
| D0.8b | Open the house: run COMMUNITY-FUNNEL.md §3 — Discord live, `#the-feed` mirror started (manual), welcome post, rules pinned (verbatim from `rules.html` per MODERATION-PLAN.md §3.2), `#mod-log` private channel created, canned responses (`templates/mod-responses.md`) posted to mod channel; swap `community.html` "opens at launch" → invite link | ~45 min | `[ ] PENDING` — gated on G11 + G13 |
| D0.9 | Monitor: uptime, analytics funnel (`visit→watch_start→request_submitted→character_created`), request-feed health, review-queue depth | continuous | `[ ] PENDING` |
| D0.10 | Same-day retro note → MARKETINGLOG.md + shared inbox | ~15 min | `[ ] PENDING` |

## §4 Launch command card

Everything mechanical on day-0, copy-pasteable. Fill `<domain>` once.

```sh
cd marketing
./tools/preflight.sh                            # THE go-gate: dry-run + secret scan + switches
./tools/staging_dryrun.sh                       # expect 0 fail, 0 warns post-G3
./build-press-kit.sh                            # rebuild dist zip post-G3/G4/G5
./deploy/deploy-site.sh                         # pure rsync dry-run — rehearse anytime
./deploy/deploy-site.sh --apply                 # D0.1 — gated deploy (host from infra.env)
./tools/prod_smoke.sh https://<domain>          # D0.2 — live smoke pass (read-only)
grep -rIl 'realworld-game.example' site/        # must print nothing (G3)
grep -n 'data-demo-src' site/demo.html          # must show the live embed URL (G12)
grep -n 'data-pricing' site/pricing.html        # must show "final" post-G4
./tools/analytics_e2e.sh                        # G8 — localhost sink e2e, no args
```

## §5 Rollback runbook

Trigger conditions and the exact response:

| Symptom | Threshold | Action |
|---------|-----------|--------|
| Site down / 5xx | >5 min | Enable maintenance mode: uncomment the Caddyfile maintenance block (serves `deploy/maintenance.html`, provisioned once to `/srv/www/realworld/maintenance.html`) + `caddy reload`; game world unaffected |
| OG cards broken | any | Revert last deploy; cards are cosmetic — do not hold launch for this alone |
| Pricing page wrong | any | Flip `data-pricing` back to `"provisional"` + revert commit; purchases pause until fixed |
| Demo embed dead | any | Remove `data-demo-src` → page degrades to gallery fallback (verified pre-launch); fix forward |
| Feed labels mismatch live feed | any | Copy is illustrative-only — correct labels to `world/feed.json` vocabulary in a hotfix commit |
| Analytics dead | day-0 | Non-blocking — funnel events buffer in the spec; fix day-1 |
| Request feed abused | any | MODERATION-PLAN.md §4 runbook (cooldowns/denials/refunds); marketing pulls CTA to watch-only copy |
| Discord incident | any | MODERATION-PLAN.md §4 + COMMUNITY-FUNNEL.md §4 escalation; `#mod-log` is the audit trail |

Full rollback = maintenance page + pause posts + note in shared inbox. No data
loss possible: the site is fully static and stateless.

## §6 Go / No-Go template

Copy this block into the owner decision thread at T-48h:

```
GO/NO-GO — Real World launch, <date>
Gates: G1..G15 status: <x/15 green>
Blocking items: <list or none>
Known warnings: <dry-run warns accepted as non-blocking>
Feed display-filter option (G13): A / B / C — <pick>
Decision: GO / NO-GO — <owner name>, <timestamp>
```

Decision authority: the owner alone. If any gate is red, the default is NO-GO —
the checklist exists so a GO is boring.

## §7 Owner sign-off record

| Gate | Approved by | Date | Notes |
|------|-------------|------|-------|
| Launch approval (G1) | | | |
| Final pricing (G4) | | | |
| Legal/privacy (G7) | | | |
| Analytics backend (G8) | | | |
| Community surfaces (G11) | | | |
| Feed display-filter option (G13) | | | A=redact / B=withhold / C=quarantine |
| Infrastructure (G14) | | | domain + host + Stripe + analytics + uptime |
| Feed vocabulary sync (G15) | | | labels match `world/feed.json` |

## §8 Day 7 — first week

- [ ] PENDING — First "This Week on the Block" recap post (from public feed; labels per G15)
- [ ] PENDING — Launch metrics review: visits→watch sessions→credit purchases; funnel leaks → MARKETINGLOG.md
- [ ] PENDING — Search Console coverage check; fix indexing issues
- [ ] PENDING — Triage community questions; recurring ones → `faq.html`; sanitized feedback batch → shared inbox per COMMUNITY-FUNNEL.md §7
- [ ] PENDING — First creator-outreach variant drafted from PRESS-OUTREACH.md angles (COMMUNITY-FUNNEL.md §6); owner approves before any send
- [ ] PENDING — Second devlog post (honest post-launch retrospective)
- [ ] PENDING — Press follow-ups only to outlets that engaged (no spam rounds)
- [ ] PENDING — Trailer greenlight decision based on week-1 spectator retention (TRAILER-PLAN.md + `trailer/` animatics ready to execute)
- [ ] PENDING — Moderation week-1: review-queue depth + denial-rate first look; confirm recap can quote aggregate moderation stats (MODERATION-PLAN.md §6)
- [ ] PENDING — Live-moment capture pipeline check: clips banked per `social/capture-plan.md` taxonomy

## §9 Day 30 — first month

- [ ] PENDING — Month-1 report: MAU, watcher→requester conversion, payer rate, credit burn vs. projections, top entry pages, top queries (render via `tools/analytics_report.py`)
- [ ] PENDING — Pricing review: provisional figures holding? Changes proposed to owner (never silent)
- [ ] PENDING — Content calendar retro: which posts earned traffic/links; adjust SEO-PLAN tiers with real query data
- [ ] PENDING — Community funnel check: Discord health, cadence retro, mod-recruitment decision, subreddit revisit — per COMMUNITY-FUNNEL.md §9 day-30 list
- [ ] PENDING — Press kit v1.1: real earned quotes (attributed), final pricing, launch screenshots, trailer link if produced
- [ ] PENDING — Roadmap review: re-rank remaining marketing focuses against month-1 data; update MARKETING_ROADMAP.md
- [ ] PENDING — Season-2 neighborhood marketing decision only if shard-1 retains (research: do NOT split the audience early)
- [ ] PENDING — Moderation month-1: mod recruitment decision + incident-runbook retro (MODERATION-PLAN.md §3.4/§4); review account-flag distribution (score-9 reviews should be rare)

## §10 Rehearsal log

Every local rehearsal, newest last. A gate may only cite a result logged here.

| Date | Rehearsal | Result |
|------|-----------|--------|
| 2026-09-22 | staging_dryrun.sh (v8) | 25 pass / 3 warn / 0 fail |
| 2026-09-22 | build-press-kit.sh | zip rebuilt, manifest verified |
| 2026-09-22 | analytics shim inert check | PASS — no endpoint configured |
| 2026-09-23 | analytics_e2e.sh (v22) | PASS — 1057/1057 fixture events through sink→report |
| 2026-09-23 | staging_dryrun.sh (v23, shots v22) | 31 pass / 3 warn / 0 fail — warns: domain ×2, 1 PNG weight |
| 2026-09-23 | build-press-kit.sh (v23, shots v22) | zip rebuilt — 32 files, 8.6 MB |
| 2026-09-23 | staging_dryrun.sh (v29) | 32 pass / 3 warn / 0 fail — warns: domain ×2, 1 PNG weight |
| 2026-09-23 | tools/preflight.sh (v29, first run) | 3 pass / 6 warn / 0 fail — warns all owner-gated flags (G3 domain, G4 pricing, G8 endpoint, G9 zip freshness, G12 demo-src, uncommitted files) |

## §11 Never-do list (load-bearing)

- No publishing, posting, account registration, ad spend, or press contact without explicit owner approval — ever.
- No fake testimonials or invented quotes. No astroturfing.
- No promises for cut features (voice/TTS v1, cash-out/RMT, loot boxes, ambient-NPC economies).
- No claims the game is playable before a live build exists.
- No real SF business names — parody names only (per user-decision 2026-09-22; canonical list `world/parody-names.json`).
- No spectator copy that leaks character secrets — public surfaces quote SURFACE-tier facts only (design §7; world building-card convention).
