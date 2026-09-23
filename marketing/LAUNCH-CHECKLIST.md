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
Last run **2026-09-24 (v68): 36 pass / 2 warn / 0 fail** (warns = placeholder
domain not yet swapped ×2 — expected pre-launch).
**One-command go-gate:** `./tools/preflight.sh` wraps the dry-run plus secret
scan, sitemap parity, press-kit freshness, checklist self-audit, and flip-flag
status. Last run **2026-09-24 (v68): 6 pass / 5 warn / 0 fail** — all warns
are owner-gated flags (G3/G4/G8/G12 + uncommitted work-in-progress).
**One-command gate worksheet:** `./tools/gonogo.sh` prints all 17 gates with
live AUTO status for the mechanical ones and a pre-filled §6 block for the
owner decision thread. Last run **2026-09-24 (v68): 2/17 auto-green** (G5
gallery + G9 zip freshness) — the rest await their owner/track triggers, as
expected pre-launch.
**Checklist self-audit:** `./tools/checklist_audit.py` mechanically verifies
the checklist against the tree it describes — gate contiguity, every gate has
a §11 proof row, every command-card path exists, owner gates have §7 sign-off
rows, gate-count references agree with `gonogo.sh`. Last run **2026-09-24
(v68): 7 pass / 0 warn / 0 fail**.

**Change control:** after any content edit to `site/`, re-run the dry-run and
log the result in §10 before the checklist may cite it.

---

## §1 Pre-launch gates (all must be true before day-0)

| # | Gate | Owner | Status |
|---|------|-------|--------|
| G1 | Owner approves public launch in writing (the go/no-go, §6) | owner | `[ ] PENDING` |
| G2 | Game build verified live and stable enough for spectators | owner + game track | `[ ] PENDING` |
| G3 | Real domain registered; `realworld-game.example` replaced everywhere it ships (canonical links, OG URLs, `sitemap.xml`, `robots.txt`, Caddyfile/netlify DNS+env). One command: `tools/swap_domain.sh <domain>` then `--check` must print CLEAN | owner + mkt | `[ ] PENDING` — swap tool rehearsed v59 (apply→check→revert round-trip clean) |
| G4 | Pricing flip: owner approves final numbers → set `data-pricing="final"` on `pricing.html` `<body>` (one attribute — PRICING-PAGE-CONTENT.md §1). Same-commit sync: `faq.html`, `js/pricing.js` constants, `social/drafts/pricing-post.md`, STORE-COPY.md if numbers changed | owner | `[ ] PENDING` — flip rehearsed, attribute is live CSS |
| G5 | Screenshot gallery refreshed with launch-build captures (current = **v43 dev build** — refreshed v68 — + v16 interior vignettes + v1 early-pass pair; gonogo.sh flags future deltas automatically) | mkt, needs art publish | `[x] REHEARSED` — swap procedure executed end-to-end 2026-09-23; repeat at launch if art publishes newer |
| G6 | Press contact email + social handles registered (placeholders today — no accounts exist) | owner | `[ ] PENDING` — account checklist in SOCIAL-LAUNCH-PLAN.md |
| G7 | Legal pass: payment terms, refund policy (auto-refund on failed requests is a product promise — wording must match), privacy policy, age-gating/COPPA posture | owner | `[ ] PENDING` |
| G8 | Analytics: shim wired on all pages but INERT — set `data-endpoint` on `js/analytics.js` include after owner picks backend (Umami/Plausible CE/first-party sink; ANALYTICS.md §2+§9), then verify events on staging (`tools/analytics_e2e.sh` proves the localhost path today; re-verify against the real backend on staging) | owner + mkt | `[x] REHEARSED` — shim verified inert; e2e PASS 1057/1057 events (2026-09-23) |
| G9 | Press kit zip rebuilt after G3/G4/G5 land: `./build-press-kit.sh` | mkt | `[x] REHEARSED` — one-command rebuild verified 2026-09-23 |
| G10 | Dry-run clean: `tools/staging_dryrun.sh` → 0 fail, 0 placeholder warns | mkt | `[x] REHEARSED` — currently 32/3/0, warns = G3 ×2 + 1 PNG weight |
| G11 | Community surfaces: Discord server created per COMMUNITY-FUNNEL.md §3 checklist; rules + feedback asks pinned; `community.html` placeholder copy swapped to real invite link | owner | `[ ] PENDING` — full spec + setup checklist in COMMUNITY-FUNNEL.md |
| G12 | Demo page live: set `data-demo-src` on `demo.html` `#demo-stage` to the spectator build URL; verify `?embed=` staging pass + `watch_start{mode:"live"}` event; sync feed-preview labels per G15 | owner + game track | `[ ] PENDING` — fallback verified; one-attribute flip at launch |
| G13 | Moderation readiness: owner confirms the shipped feed display-filter default (game-v6 ships `GS_WIRE_CFG.displayFilter='A'`, all three modes implemented; `gsWireSetFilter` flips it in one call — MODERATION-PLAN.md §2.3) and confirms the game build wires the world-v8 contract (`screen.js` verdicts, lane routing, `reason_code` on feed denials, `mod_decision` ledger records — console demo exists at `world/mod-console.html`); confirm the private appeal path is reachable in the request flow (world-v32 `requests.json.appeals` — 72 h, different reviewer, charge re-applies only on approval); record one `gsWireAudit()` → `{ok:true}` on staging data in the rehearsal log | owner + game track | `[ ] PENDING` — full spec in MODERATION-PLAN.md |
| G14 | Infrastructure provisioned per INFRASTRUCTURE.md §5: domain + DNS live, host deployed (`deploy/deploy-site.sh`), TLS issued, analytics backend up (G8), Stripe account + products created (test→live), uptime monitor armed, `maintenance.html` staged on host for rollback | owner + mkt | `[ ] PENDING` — full runbook + configs in `deploy/`; `tools/preflight.sh` is the step-0 go-gate, `tools/ship.sh` runs steps 0–4 as one command; monitor spec in `deploy/monitoring.example`; est. 2–3 h |
| G15 | Feed vocabulary sync: `world/feed.json` `request_status` (canonical: requested, in_review, approved, approved (modified), running, queued, resolved, refunded, "not approved", "player session ended") is the contract. Before launch flip, diff the labels in `demo.html` feed-preview, `journal.html` recap sample, `social/drafts/recap-format.md`, and `analytics-events.json` against it — demo/journal labels are marked "illustrative" today | mkt + game/world track | `[ ] PENDING` — world-v4/v5 shipped the canonical vocab; marketing labels must match the live feed verbatim |
| G16 | Onboarding contract: the shipped build runs the world-v39 flow (persona fork watch/play, handle format + reserved-name check, declined-ask refund lesson, human-review lesson S4c scripted "not approved — refunded", opt-in low-balance sim → "player session ended", post-hire return via `?hired=1` → first-day card S6, parked/returning states — `world/onboarding-ui.md` + `onboarding.json` schema v39, storage key `rw_onboard_v39`) and emits the onboarding hook set to the endpoint configured in G8: the v51 four (`persona_chosen`, `handle_taken_shown`, `decline_lesson_shown`, `returning_session`) plus the v39 five (`review_lesson_shown`, `review_outcome_seen`, `low_balance_simulated`, `handoff_seen`, `hired_return` — all spec'd in `analytics-events.json`). Verify on staging with a scripted watch-persona and play-persona run including a `?hired=1` return | owner + game/world track | `[ ] PENDING` — marketing sink/report/dashboard accept all hooks; the game-side emitters are the missing half |
| G17 | Human playtest: owner (or designate) runs the world-v37 playtest harness end-to-end on the near-launch build (`world/playtest.html`, PT1–PT35, `#pt=` deep links, harness keyboard map, per-scenario timing in `session.time_per_scenario`). Blocker/major findings exported via "Copy inbox note" into the shared inbox; **zero open blockers and every major triaged with an owner-visible disposition** before GO. This is the only gate that proves a human can actually get through the front door — every other gate proves a mechanism | owner + world track | `[ ] PENDING` — harness shipped world-v37; run owed on the launch candidate build |

## §2 Run of show — T-minus schedule

The ordered countdown. Each line is owner-visible; nothing executes early.

| When | What | Depends on |
|------|------|-----------|
| T-7d | Content freeze on `site/` (bugfixes only); social drafts re-read against BRAND.md voice; press list re-confirmed with owner | G6 |
| T-5d | Full local rehearsal: dry-run + press-kit rebuild + animatic review + checklist_audit; log results in §10 | G9, G10 |
| T-4d | Human playtest pass (G17): run `world/playtest.html` PT1–PT35 on the launch candidate; export blocker/major findings via "Copy inbox note"; owner dispositions every major | G17 |
| T-3d | Staging deploy at placeholder domain; run `tools/prod_smoke.sh` against staging; OG card validated in a share-preview tool | G14 (staging half) |
| T-48h | Go/No-Go issued (§6 template); if GO, flip G4 pricing + G15 vocab sync in ONE commit on `sf/marketing`; confirm G16 staging verification is logged | all gates |
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
| D0.8b | Open the house: run COMMUNITY-FUNNEL.md §3 — Discord live, `#the-feed` mirror started (manual curation per `community/feed-mirror.md` §1–§3), welcome post, rules pinned (verbatim from `rules.html` per MODERATION-PLAN.md §3.2), `#mod-log` private channel created, canned responses (`templates/mod-responses.md`) posted to mod channel; swap `community.html` "opens at launch" → invite link | ~45 min | `[ ] PENDING` — gated on G11 + G13 |
| D0.9 | Monitor: uptime, analytics funnel (`visit→watch_start→request_submitted→character_created`) + onboarding hooks (`persona_chosen` split, `handle_taken_shown`, `decline_lesson_shown` — G16), request-feed health, review-queue depth | continuous | `[ ] PENDING` |
| D0.10 | Same-day retro note → MARKETINGLOG.md + shared inbox | ~15 min | `[ ] PENDING` |

**Abort points (built in):** D0.5–D0.8 are spaced ≥20 min apart precisely so
any one can be skipped without pulling the others. If something breaks
mid-announce: stop posting, hold the remaining drafts, run the matching §5
rollback row, and pick the incident-comms draft that matches the symptom
(`social/drafts/incident-comms.md` has 6 pre-written scenarios). A partial
launch is recoverable; a doubled-down bad launch is not.

## §4 Launch command card

Everything mechanical on day-0, copy-pasteable. Fill `<domain>` once.

```sh
cd marketing
./tools/ship.sh                                 # THE go command: preflight→kit→deploy→smoke (bare = rehearsal)
./tools/ship.sh --apply                         # ships for real — needs RW_DEPLOY_* env + RW_DOMAIN
./tools/preflight.sh                            # THE go-gate: dry-run + secret scan + switches
./tools/staging_dryrun.sh                       # expect 0 fail, 0 warns post-G3
./build-press-kit.sh                            # rebuild dist zip post-G3/G4/G5
./deploy/deploy-site.sh                         # pure rsync dry-run — rehearse anytime
./deploy/deploy-site.sh --apply                 # D0.1 — gated deploy (host from infra.env)
./tools/prod_smoke.sh https://<domain>          # D0.2 — live smoke pass (read-only)
./tools/uptime_probe.sh https://<domain>        # health probe — external-monitor stopgap (cron */5)
./tools/swap_domain.sh <domain>                 # G3 — placeholder→domain sweep (site/ + deploy/)
./tools/swap_domain.sh --check <domain>         # must print CLEAN (G3)
./tools/rehearse_host.sh                        # deploy/rollback/retention drill on a local fake host
./tools/stripe_webhook_fixture.py --out /tmp/f.json   # signed test event for the crediting path
grep -n 'data-demo-src' site/demo.html          # must show the live embed URL (G12)
grep -n 'data-pricing' site/pricing.html        # must show "final" post-G4
./tools/analytics_e2e.sh                        # G8 — localhost sink e2e, no args
./tools/gonogo.sh                               # all-17-gate worksheet + pre-filled §6 block
./tools/checklist_audit.py                      # checklist self-consistency — run before citing §10
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

### Severity ladder (which row fires when)

| SEV | Definition | Examples | Response scope |
|-----|-----------|----------|----------------|
| SEV-1 | Product/site unusable or trust breach | site 5xx >5 min, payment page wrong, feed abuse wave | §5 row + incident-comms draft + owner paged; pause remaining announce posts (§3 abort points) |
| SEV-2 | Degraded but watchable | demo embed dead, OG cards broken, analytics dark | §5 row; fix forward; comms only if users notice (incident-comms "missed date"-style honesty) |
| SEV-3 | Cosmetic / single-channel | one social post flopped, minor label mismatch | no rollback; log in MARKETINGLOG; hotfix at leisure |

Draft comms for the six likeliest SEV-1/2 scenarios already exist in
`social/drafts/incident-comms.md` — each is truth-conditional (post only the
draft whose claims are verified true at that moment).

## §6 Go / No-Go template

Copy this block into the owner decision thread at T-48h — or run
`./tools/gonogo.sh`, which prints it pre-filled with live gate status:

```
GO/NO-GO — Real World launch, <date>
Gates: G1..G17 status: <x/17 green>
Blocking items: <list or none>
Known warnings: <dry-run warns accepted as non-blocking>
Feed display-filter option (G13): A / B / C — <confirm shipped default A or flip via gsWireSetFilter>
Onboarding hooks (G16): <staging run logged — 9-hook set incl. ?hired=1 return>
Human playtest (G17): <report logged — 0 open blockers, N majors dispositioned>
Decision: GO / NO-GO — <owner name>, <timestamp>
```

Decision authority: the owner alone. If any gate is red, the default is NO-GO —
the checklist exists so a GO is boring.

## §7 Owner sign-off record

| Gate | Approved by | Date | Notes |
|------|-------------|------|-------|
| Launch approval (G1) | | | |
| Game build stable (G2) | | | owner verifies with game track |
| Domain swap (G3) | | | `swap_domain.sh --check` CLEAN |
| Final pricing (G4) | | | |
| Social/press accounts (G6) | | | handles + press email registered |
| Legal/privacy (G7) | | | |
| Analytics backend (G8) | | | |
| Community surfaces (G11) | | | |
| Demo embed (G12) | | | `data-demo-src` live URL |
| Feed display-filter option (G13) | | | A=redact / B=withhold / C=quarantine |
| Infrastructure (G14) | | | domain + host + Stripe + analytics + uptime |
| Feed vocabulary sync (G15) | | | labels match `world/feed.json` |
| Onboarding contract (G16) | | | world-v39 flow + 9 hooks on staging |
| Human playtest (G17) | | | 0 open blockers on launch candidate |

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
- [ ] PENDING — Onboarding funnel first look: `persona_chosen` watch/play split, `handle_taken_shown` rate, `decline_lesson_shown` rate vs. fixture expectations (ANALYTICS.md §3); leaks → shared inbox for the world track

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
| 2026-09-23 | tools/preflight.sh (v38) | 5 pass / 5 warn / 0 fail — warns: G3 domain, G4 provisional, G8 endpoint, G9 zip freshness, G12 demo-src |
| 2026-09-23 | tools/gonogo.sh (v38, first run) | 0/15 auto-green, 15 pending — correct pre-launch: every gate awaits owner/track trigger; flagged G5 delta (shots v22 < published v26) |
| 2026-09-23 | gallery refresh v22→v26 (v38) | shots + press-kit screenshots swapped, webp regen (4 files, 60–175 KB), keyart rebaked, dist zip rebuilt (42 files), all refs swept |
| 2026-09-23 | staging_dryrun.sh (v38, shots v26) | 33 pass / 2 warn / 0 fail — warns: domain ×2 only (PNG-weight warn cleared) |
| 2026-09-23 | tools/preflight.sh (v38) | 5 pass / 5 warn / 0 fail — warns: G3 domain, G4 provisional, G8 endpoint, G12 demo-src, uncommitted files |
| 2026-09-23 | tools/gonogo.sh (v38, post-refresh) | 2/15 auto-green (G5, G9) — mechanical gates now prove themselves |
| 2026-09-23 | tools/ship.sh (v44, first run, rehearsal mode) | full pipeline green: preflight GO (4 pass / 6 warn / 0 fail) → dist zip rebuilt → deploy dry-run (env unset) → punch list printed |
| 2026-09-23 | tools/uptime_probe.sh (v44, vs localhost staging) | HEALTHY — 4×200 + brand marker; TLS check correctly WARNs on non-HTTPS |
| 2026-09-24 | gallery refresh v26→v28 (v45) | shots + press-kit screenshots swapped, webp regen, keyart+banners rebaked, animatics rebuilt (hero/teaser/vertical), dist zip rebuilt (39 files) |
| 2026-09-24 | staging_dryrun.sh (v45, shots v28) | 33 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-24 | tools/seo_audit.py (v45, extended) | 58 pass / 23 warn / 0 fail — new srcset/og:image/CLS checks active; warns: domain, PNG-fallback weight, thin-desc legacy |
| 2026-09-24 | tools/preflight.sh (v45) | 5 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |
| 2026-09-24 | archive.html page added (v46) + gallery refresh v28→v29 | 14th page wired into navs/footers/sitemap/dry-run/prod-smoke/SEO-PLAN/llms.txt; shots + press-kit screenshots swapped, webp regen, keyart+banners rebaked, animatics rebuilt, dist zip rebuilt (39 files) |
| 2026-09-24 | gallery refresh v29→v30 (v47) + press-kit docs | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked, dist zip rebuilt (41 files); NEW press-kit/context.md + guided-tour.md; staging_dryrun 34 pass / 2 warn / 0 fail; seo_audit 63 pass / 24 warn / 0 fail |
| 2026-09-24 | gallery refresh v30→v31 (v48) + STORE-COPY expansion | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked, all 3 animatics rebuilt on v31 stills, dist zip rebuilt (41 files); STORE-COPY +5 sections (PH card, itch theme, Steam sysreqs, A/B descs, claim ledger); staging_dryrun 34 pass / 2 warn / 0 fail; seo_audit 63 pass / 24 warn / 0 fail; preflight GO |
| 2026-09-24 | gallery refresh v31→v32 (v50) + trailer-plan upgrade | shots + press-kit screenshots swapped, webp regen, captions/alt-text updated for v32 (cured Sept turf, bougainvillea), keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v32 + NEW 6s bumper program, --thumbs renderer, --verify accuracy check; all animatics + boards rebuilt, dist zip rebuilt |
| 2026-09-24 | gallery refresh v32→v36 (v53) + checklist third pass | shots + press-kit screenshots swapped (v34 then v36 — art published twice mid-version), webp regen, captions/alt-text rewritten for the Karl marine-layer set, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v36, all 4 animatics + 3 thumbnails rebuilt; dist zip rebuilt (41 files); NEW gate G16 (world-v25 onboarding contract + 4 hooks), NEW §11 rehearsal coverage matrix, never-do → §12 |
| 2026-09-24 | staging_dryrun.sh (v53, shots v36) | 34 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-24 | gallery refresh v36→v37 (v55) | shots + press-kit screenshots swapped (stale v36 purged from kit dir — cp doesn't clean), webp regen, captions verified fog-accurate + terrain note added, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v37, all 4 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (41 files); NEW BRAND §12 motion + §13 sonic identity, brand.html mirror |
| 2026-09-24 | tools/brand_audit.py (v55) | 0 fail / 0 warn — assets, palette parity, kit copies, icon links |
| 2026-09-24 | staging_dryrun.sh (v55, shots v37) | 34 pass / 2 warn / 0 fail — warns: domain ×2 only; seo_audit 64/24/0 |
| 2026-09-23 | gallery refresh v37→v40 (v60) + seo-plan fourth pass | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked (og-card now generated by make_brand_assets.py); trailer EDL rebased to v40, all 4 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (45 files); FAQ 25→26 (jobs Q, parity-synced); seo_audit +3 checks (title/desc uniqueness, lastmod sanity, llms.txt link+FAQ parity) → 66/24/0; staging_dryrun 34/2/0; preflight GO |
| 2026-09-24 | tools/preflight.sh (v53) | 5 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |
| 2026-09-24 | tools/gonogo.sh (v53, 16 gates) | 2/16 auto-green (G5, G9) — G16 added as TRACK gate |
| 2026-09-23 | tools/rehearse_host.sh (v59, first run) | PASS — 7 deploys on local fake host: symlink flips, 5-release retention, rollback flip to r6 verified by marker, `diff -r` content integrity, maintenance.html staged outside releases |
| 2026-09-23 | tools/swap_domain.sh (v59, apply→check→revert) | PASS — placeholder→test domain across 24 files (site/ + deploy/), `--check` CLEAN 0 leftovers, `--revert` restored the whole tree; git status clean |
| 2026-09-23 | tools/stripe_webhook_fixture.py (v59) | PASS — emits `checkout.session.completed` + `Stripe-Signature`; v1 HMAC independently re-verified against `t.body_raw` |
| 2026-09-24 | tools/checklist_audit.py (v68, first run) | caught real drift: 5 gates missing §11 rows, 5 owner gates missing §7 rows, stale "all-15-gate" — all fixed this version; final 9 pass / 0 warn / 0 fail |
| 2026-09-24 | gallery refresh v40→v43 (v68) | shots + press-kit screenshots swapped (v43 published mid-refresh — rebased straight past v42), webp regen, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v43, all 5 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (42 files) |
| 2026-09-24 | tools/gonogo.sh (v68, 17 gates) | 2/17 auto-green (G5, G9) — G16 label now world-v39/9-hook, G17 added as OWNER gate |
| 2026-09-24 | staging_dryrun.sh (v68, shots v43) | 36 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-24 | tools/preflight.sh (v68, +checklist-audit step) | 6 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |

## §11 Rehearsal coverage matrix

Every gate and every day-0 task, mapped to the artifact or rehearsal that
proves it. "Proof" = a script whose result is logged in §10, or a document
that exists in this tree. A row with no proof column entry is a hole — fix
it before citing the gate.

| Item | Proof of readiness | Last rehearsed |
|------|--------------------|----------------|
| G1 launch approval | §6 go/no-go template + §7 signature row — the artifact IS the decision record | template live in gonogo.sh output |
| G2 game build stable | owner verification against the game track's shipped build; prod_smoke + uptime_probe run against the game URL on staging | owed — needs game build |
| G6 social/press accounts | `SOCIAL-LAUNCH-PLAN.md` account-setup checklist (owner-gated) | spec complete |
| G7 legal pass | payment/refund/privacy/age wording inventory lives in STORE-COPY disclosure matrix + rules.html; owner counsel review owed | spec complete |
| G11 community surfaces | `COMMUNITY-FUNNEL.md` §3 setup checklist + `community.html` placeholder swap | spec complete |
| G3 domain swap | `tools/swap_domain.sh` apply→`--check`→`--revert` + `staging_dryrun.sh` §4 sweep | 2026-09-23 (v59 round-trip) |
| G4 pricing flip | `data-pricing` attribute + `gonogo.sh` AUTO check | flip rehearsed 2026-09-23 |
| G5 gallery freshness | `gonogo.sh` AUTO diff vs `published/VERSION` | v53 (v32→v36) |
| G8 analytics | `tools/analytics_e2e.sh` end-to-end fixture | 2026-09-23 (1057/1057) |
| G9 press-kit zip | `build-press-kit.sh` + `gonogo.sh` freshness check | v53 rebuild |
| G10 dry-run | `tools/staging_dryrun.sh` | every version |
| G12 demo flip | `demo.html` fallback verified; `data-demo-src` grep in command card | fallback rehearsed |
| G13 moderation | `MODERATION-PLAN.md` + `world/mod-console.html` demo; `gsWireAudit()` staging run still owed | spec only — needs game build |
| G14 infra | `deploy/` configs + `tools/ship.sh` rehearsal + `tools/uptime_probe.sh` + `tools/rehearse_host.sh` (deploy/rollback/retention) + `tools/stripe_webhook_fixture.py` (crediting-path fixture) | 2026-09-23 ship.sh + rehearse_host green |
| G15 feed vocab | `world/feed.json` canonical list quoted in gate text | diff owed at flip |
| G16 onboarding | `analytics-events.json` 9-hook set (v51 four + v39 five) + sink/report/dashboard support; staging run incl. `?hired=1` owed | spec only — needs game build |
| G17 human playtest | `world/playtest.html` harness (world-v37: PT1–PT35, `#pt=` deep links, triage export); owner run on launch candidate owed | harness shipped; run owed |
| Checklist integrity | `tools/checklist_audit.py` — gates↔§11↔§7↔command-card↔gonogo consistency | 2026-09-24 (v68): 7/0/0 |
| D0.1 deploy | `deploy/deploy-site.sh` (dry-run rehearsed) | 2026-09-23 |
| D0.2 prod smoke | `tools/prod_smoke.sh` vs localhost staging | rehearsed |
| D0.3/D0.3b flips | documented attributes (`data-pricing`, `data-demo-src`) | attribute greps in §4 |
| D0.4 sitemap submit | sitemap.xml valid + prod_smoke checks it | every dry-run |
| D0.5–D0.8 posts | `social/drafts/` — launch-thread, timeline, pitches, seeds | drafted, not sent |
| D0.8b community | `COMMUNITY-FUNNEL.md` §3 + `community/feed-mirror.md` + `rules.html` + `templates/mod-responses.md` | spec complete |
| D0.9 monitoring | `tools/uptime_probe.sh` + `deploy/monitoring.example` + ANALYTICS dashboard | probe HEALTHY 2026-09-23 |
| §5 rollbacks | `deploy/maintenance.html` + Caddyfile block + incident-comms drafts + `tools/rehearse_host.sh` rollback flip | rollback flip exercised 2026-09-23 (v59) |

## §12 Never-do list (load-bearing)

- No publishing, posting, account registration, ad spend, or press contact without explicit owner approval — ever.
- No fake testimonials or invented quotes. No astroturfing.
- No promises for cut features (voice/TTS v1, cash-out/RMT, loot boxes, ambient-NPC economies).
- No claims the game is playable before a live build exists.
- No real SF business names — parody names only (per user-decision 2026-09-22; canonical list `world/parody-names.json`).
- No spectator copy that leaks character secrets — public surfaces quote SURFACE-tier facts only (design §7; world building-card convention).
