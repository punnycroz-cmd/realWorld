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
Last run **2026-09-23 (v128): 41 pass / 2 warn / 0 fail** (warns = placeholder
domain not yet swapped ×2 — expected pre-launch).
**One-command go-gate:** `./tools/preflight.sh` wraps the dry-run plus secret
scan, sitemap parity, press-kit freshness, checklist self-audit, accuracy
sweep (5c), and flip-flag status. Last run **2026-09-23 (v128): 8 pass /
5 warn / 0 fail** — all warns are owner-gated flags (G3/G4/G8/G12 +
uncommitted work-in-progress).
**One-command gate worksheet:** `./tools/gonogo.sh` prints all 18 gates with
live AUTO status for the mechanical ones and a pre-filled §6 block for the
owner decision thread. Last run **2026-09-23 (v128): 3/18 auto-green** — G5
(gallery at published v71), G9 (zip fresh), G18 (accuracy sweep clean); the
rest await owner/track triggers, as expected pre-launch.
**Checklist self-audit:** `./tools/checklist_audit.py` mechanically verifies
the checklist against the tree it describes — gate contiguity, every gate has
a §11 proof row, every command-card path exists, owner gates have §7 sign-off
rows, gate-count references agree with `gonogo.sh`, and (since v83) the
world-contract pins quoted in G13/G15/G16/G17 are diffed against the live
world-sim-world worktree. Last run **2026-09-23 (v128): 14 pass / 0 warn /
0 fail**.

**Change control:** after any content edit to `site/`, re-run the dry-run and
log the result in §10 before the checklist may cite it.

---

## §1 Pre-launch gates (all must be true before day-0)

| # | Gate | Owner | Status |
|---|------|-------|--------|
| G1 | Owner approves public launch in writing (the go/no-go, §6) | owner | `[ ] PENDING` |
| G2 | Game build verified live and stable enough for spectators | owner + game track | `[ ] PENDING` |
| G3 | Real domain registered; `realworld-game.example` replaced everywhere it ships (canonical links, OG URLs, `sitemap.xml`, `robots.txt`, Caddyfile/netlify DNS+env). One command: `tools/swap_domain.sh <domain>` then `--check` must print CLEAN | owner + mkt | `[ ] PENDING` — swap tool rehearsed v59 (apply→check→revert round-trip clean) |
| G4 | Pricing flip: owner approves final numbers → `tools/flip_flags.sh --set pricing=final` (sets `data-pricing="final"` on `pricing.html` `<body>` — PRICING-PAGE-CONTENT.md §1). Same-commit sync: `faq.html`, `js/pricing.js` constants, `social/drafts/pricing-post.md`, STORE-COPY.md if numbers changed | owner | `[ ] PENDING` — flip rehearsed via flip_flags.sh round-trip v74, attribute is live CSS |
| G5 | Screenshot gallery refreshed with launch-build captures (current = **v71 dev build** — refreshed v143 — + v16 interior vignettes + v1 early-pass pair; gonogo.sh flags future deltas automatically) | mkt, needs art publish | `[x] REHEARSED` — swap procedure executed end-to-end 2026-09-23; repeat at launch if art publishes newer |
| G6 | Press contact email + social handles registered (placeholders today — no accounts exist) | owner | `[ ] PENDING` — account checklist in SOCIAL-LAUNCH-PLAN.md |
| G7 | Legal pass: payment terms, refund policy (auto-refund on failed requests is a product promise — wording must match), privacy policy, age-gating/COPPA posture. Drafts EXIST since v104: `site/terms.html` (credits/cash-out wall, request rules, possession limits, age bands, liability), `site/privacy.html` (cookieless-analytics contract mirrored verbatim from js/analytics.js, Stripe-hosted checkout, u13 posture), `site/refunds.html` (the full refund matrix — deny/expire/trim/revoke/appeal/final). Stripe activation needs these URLs live — they're the answer. Gate = owner/counsel review + removing the "launch draft" pill + effective date; NOT drafting, which is done | owner | `[ ] PENDING` — pages drafted v104; owner review is the gate |
| G8 | Analytics: shim wired on all 20 pages but INERT — `tools/flip_flags.sh --set endpoint=https://stats.<domain>/api/send` sets `data-endpoint`/`data-site` on every `js/analytics.js` include in one pass, after owner picks backend (Umami spec ready at `deploy/umami.compose.example`; ANALYTICS.md §2+§9), then verify events on staging (`tools/analytics_e2e.sh` proves the localhost path today; re-verify against the real backend on staging) | owner + mkt | `[x] REHEARSED` — shim verified inert; e2e PASS 1057/1057 events (2026-09-23); flip_flags endpoint set/revert rehearsed v74 |
| G9 | Press kit zip rebuilt after G3/G4/G5 land: `./build-press-kit.sh` | mkt | `[x] REHEARSED` — one-command rebuild verified 2026-09-23 |
| G10 | Dry-run clean: `tools/staging_dryrun.sh` → 0 fail, 0 placeholder warns | mkt | `[x] REHEARSED` — currently 32/3/0, warns = G3 ×2 + 1 PNG weight |
| G11 | Community surfaces: Discord server created per COMMUNITY-FUNNEL.md §3 checklist; rules + feedback asks pinned; `community.html` placeholder copy swapped to real invite link | owner | `[ ] PENDING` — full spec + setup checklist in COMMUNITY-FUNNEL.md |
| G12 | Demo page live: `tools/flip_flags.sh --set demo=<spectator-url>` sets `data-demo-src` on `demo.html` `#demo-stage`; verify `?embed=` staging pass + `watch_start{mode:"live"}` event; sync feed-preview labels per G15 | owner + game track | `[ ] PENDING` — fallback verified; flip rehearsed via flip_flags.sh v74 |
| G13 | Moderation readiness: owner confirms the shipped feed display-filter default (game-v6 ships `GS_WIRE_CFG.displayFilter='A'`, all three modes implemented; `gsWireSetFilter` flips it in one call — MODERATION-PLAN.md §2.3) and confirms the game build wires the `world/moderation.json` contract (`screen.js` verdicts, lane routing, `reason_code` taxonomy — 4 groups: deny_tier / review_tier / player_wording / public_wording — `mod_decision` ledger records; console demo at `world/mod-console.html`; `moderation.json.display_filter` is still marked OWNER-DECISION upstream — G13 IS that decision) and confirm the private appeal path is reachable in the request flow (`world/requests.json.appeals` — 72 h window, different reviewer via `orig_reviewer`, charge re-applies only on approval, not-appealable: `legal-backstop` + `appeal-resubmit`); record one `gsWireAudit()` → `{ok:true}` on staging data in the rehearsal log; ALSO verify the launch-candidate spectator shell exposes no possession affordance on C1–C8 — the Take-Control bypass was FIXED at art-v57 (button removed, handler a hard no-op under SF_MODE, sf harness asserts the ban holds against a programmatic click); regression-guard it once on the launch build, since the original bug was a stale hub bundle, not missing code (MODERATION-PLAN.md §8 day-0) | owner + game track | `[ ] PENDING` — full spec in MODERATION-PLAN.md |
| G14 | Infrastructure provisioned per INFRASTRUCTURE.md §5: domain + DNS live, host deployed (`deploy/deploy-site.sh`), TLS issued, analytics backend up (G8), Stripe account + products created (test→live), uptime monitor armed, `maintenance.html` staged on host for rollback | owner + mkt | `[ ] PENDING` — full runbook + configs in `deploy/`; `tools/preflight.sh` is the step-0 go-gate, `tools/ship.sh` runs steps 0–4 as one command; monitor spec in `deploy/monitoring.example`; host prep = `tools/bootstrap_host.sh` (`deploy/host-contract.md`); est. 2–3 h |
| G15 | Feed vocabulary sync: `world/feed.json` `request_status` (canonical: requested, in_review, approved, approved (modified), running, queued, resolved, refunded, "not approved", "player session ended") is the contract. Before launch flip, diff the labels in `demo.html` feed-preview, `journal.html` recap sample, `social/drafts/recap-format.md`, and `analytics-events.json` against it — demo/journal labels are marked "illustrative" today | mkt + game/world track | `[ ] PENDING` — world-v4/v5 shipped the canonical vocab; marketing labels must match the live feed verbatim |
| G16 | Onboarding contract: the shipped build runs the world-v95 flow (persona fork watch/play, handle format + reserved-name check, age-band fork S2a → under-13 spectator account S3u / under-18 limits line / adults-only §2.7 sponsored-message card, declined-ask refund lesson, human-review lesson S4c scripted "not approved — refunded", queued-ask lesson S4e, archive-link beat, opt-in low-balance sim → "player session ended", post-hire return via `?hired=1` → first-day card S6, admin-attribution beat on the `feed-admin` anchor, scripted compatible co-ask, surge-range disclosure line, credit-rules line S3 (never run out / never cash out / never move between accounts), subscription line S3 (stated once — Resident $4.99, Director $11.99), first-visit card S7 (possession demo 15 min · 22 cr, cap|stepped_out exits), parked/returning states — `world/onboarding-ui.md` + `onboarding.json` schema v95, storage key `rw_onboard_v95`) and emits the full `analytics_hooks` contract to the endpoint configured in G8 — all 32 hooks (`tour_started`/`tour_beat`/`tour_completed`/`tour_skipped`, `persona_chosen`, `handle_set`/`handle_taken_shown`, `wallet_explained`/`topup_shown`, `first_request_filed`, `decline_lesson_shown`, `onboard_dismissed`, `returning_session`, `review_lesson_shown`/`review_outcome_seen`, `low_balance_simulated`, `handoff_seen`, `hired_return`, `queue_lesson_shown`/`queue_outcome_seen`, `archive_beat_seen`, `band_declared`, `ads_line_shown`, `ad_demo_viewed`, `admin_beat_seen`, `coask_seen`, `surge_line_shown`, `credit_rules_seen`, `subs_line_shown`, `sub_stipend_previewed`, `first_visit_filed`, `visit_ended`) are spec'd in `analytics-events.json`. Verify on staging with a scripted watch-persona and play-persona run including a `?hired=1` return AND the four band paths (u13 → S3u, teen/na → limits line, adult → ads line) | owner + game/world track | `[ ] PENDING` — marketing sink/report/dashboard accept all 32 hooks; the game-side emitters are the missing half |
| G17 | Human playtest: owner (or designate) runs the live playtest harness end-to-end on the near-launch build (`world/playtest.html`, PT1–PT92 (checkpoint count grows with the harness — cite the live count), `#pt=` deep links, harness keyboard map, per-scenario timing in `session.time_per_scenario`). Blocker/major findings exported via "Copy inbox note" into the shared inbox; **zero open blockers and every major triaged with an owner-visible disposition** before GO. This is the only gate that proves a human can actually get through the front door — every other gate proves a mechanism | owner + world track | `[ ] PENDING` — harness pinned live by checklist_audit (PT1–PT92); run owed on the launch candidate build |
| G18 | Public-copy accuracy: `tools/accuracy_sweep.py` → **0 FAIL**. Hard-fail checks: any real business name from the live 155-key `world/parody-names.json` map in public copy, fabricated quotes/testimonials/named-outlet coverage on `site/` pages. Human-read WARNs: cut-feature and possession/cash-out/loot-box mentions without a negation cue (negated phrasing like "never possessed" passes automatically). Caught and fixed 3 real-address leaks at first run (cast.html ×2, demo.html ×1). Wired into `preflight.sh` step 5c so the mechanical go-gate carries it | mkt | `[x] REHEARSED` — first run 2026-09-23 (v113): 0 fail / 32 warn (all human-verified contexts) |

## §2 Run of show — T-minus schedule

The ordered countdown. Each line is owner-visible; nothing executes early.

| When | What | Depends on |
|------|------|-----------|
| T-7d | Content freeze on `site/` (bugfixes only); social drafts re-read against BRAND.md voice; press list re-confirmed with owner | G6 |
| T-5d | Full local rehearsal: dry-run + press-kit rebuild + animatic review + checklist_audit; log results in §10 | G9, G10 |
| T-4d | Human playtest pass (G17): run `world/playtest.html` PT1–PT92 on the launch candidate; export blocker/major findings via "Copy inbox note"; owner dispositions every major | G17 |
| T-3d | Staging deploy at placeholder domain; run `tools/prod_smoke.sh` against staging; OG card validated in a share-preview tool | G14 (staging half) |
| T-48h | Go/No-Go issued (§6 template); if GO, flip G4 pricing + G15 vocab sync in ONE commit on `sf/marketing`; confirm G16 staging verification is logged | all gates |
| T-24h | Final dry-run on the exact commit that will ship; press kit zip rebuilt and staged; day-0 posts loaded into drafts folder in send order | G9, G10 |
| T-2h | Production deploy D0.1 + smoke D0.2; demo flip D0.3b verified end-to-end; traffic probe sequence (`headers`→`warm`→`load`, deploy/traffic-plan.md §3) | §3 |
| T-0 | Announce: devlog post D0.5 → channels D0.6 → press D0.7 → community D0.8/D0.8b, spaced ≥20 min apart so each can be pulled independently | §3 |
| T+2h | First monitoring checkpoint: uptime, `watch_start` firing, request feed healthy, mod queue depth = 0 surprises | D0.9 |
| T+24h | Day-1 metrics snapshot vs. ANALYTICS.md funnel; note anything weird in MARKETINGLOG + shared inbox | D0.10 |
| T+7d / T+30d | §8 / §9 lists | — |

## §3 Day 0 — launch day (in order)

Timings below are measured from local dry-runs; production adds DNS/CDN
latency only. `./tools/launch_day.sh` prints live done/pending status for
every row in this table (the §3 counterpart to runofshow.sh) — read-only.

| # | Task | Est. | Status |
|---|------|------|--------|
| D0.1 | Deploy `marketing/site/` to production hosting at real domain via `deploy/deploy-site.sh --apply` (or git-connected host) | ~15 min | `[ ] PENDING` — script rehearsed dry-run |
| D0.2 | Run production smoke pass: `tools/prod_smoke.sh https://<domain>` — pages 200, sitemap+robots, JSON-LD parses, security headers, served-placeholder sweep; OG card renders in a share validator | ~10 min | `[x] REHEARSED` locally — prod_smoke.sh is the live counterpart of the dry-run |
| D0.3 | Flip "in development" labels → launch copy; CTA → live watch URL | ~20 min | `[ ] PENDING` |
| D0.3b | Demo page flip: `tools/flip_flags.sh --set demo=<spectator-url>` on `demo.html`, redeploy, confirm iframe mounts and `watch_start` fires with `mode:"live"`; confirm feed-preview labels match the live feed (G15) | ~10 min | `[ ] PENDING` — gated on G12 + G15 |
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
./tools/runofshow.sh                            # "where am I in the countdown?" — live status per §2 item (read-only)
./tools/launch_day.sh                           # "where am I on launch day?" — live status per §3 item (read-only)
./tools/ship.sh                                 # THE go command: preflight→kit→deploy→smoke (bare = rehearsal)
./tools/ship.sh --apply                         # ships for real — needs RW_DEPLOY_* env + RW_DOMAIN
./tools/preflight.sh                            # THE go-gate: dry-run + secret scan + switches
./tools/staging_dryrun.sh                       # expect 0 fail, 0 warns post-G3
./build-press-kit.sh                            # rebuild dist zip post-G3/G4/G5
./deploy/deploy-site.sh                         # pure rsync dry-run — rehearse anytime
./deploy/deploy-site.sh --apply                 # D0.1 — gated deploy (host from infra.env)
./tools/prod_smoke.sh https://<domain>          # D0.2 — live smoke pass (read-only)
./tools/uptime_probe.sh https://<domain>        # health probe — external-monitor stopgap (cron */5)
./tools/traffic_probe.sh headers https://<d>    # T-2h — live cache/security-header contract (deploy/traffic-plan.md)
./tools/traffic_probe.sh warm https://<domain>  # T-2h — prime caches via all sitemap URLs
./tools/traffic_probe.sh load https://<d> 16 80 # T-2h — burst probe: expect 80/80 200s, p95 < 1s
./tools/swap_domain.sh <domain>                 # G3 — placeholder→domain sweep (site/ + deploy/)
./tools/swap_domain.sh --check <domain>         # must print CLEAN (G3)
./tools/dns_check.sh <domain> [<apex-ip>]       # G3/G14 — live DNS matches the spec (read-only)
./tools/flip_flags.sh --check                   # report all three launch switches (G4/G8/G12)
./tools/flip_flags.sh --set pricing=final       # G4 — one attribute, same-commit sync still owed
./tools/flip_flags.sh --set endpoint=<url>      # G8 — data-endpoint on all 20 pages
./tools/flip_flags.sh --set demo=<url>          # G12 — data-demo-src on demo.html
./tools/flip_flags.sh --revert                  # all three back to pre-launch state
./tools/bootstrap_host.sh                       # host prep plan — writes nothing (runbook step 3 / DR §12)
./tools/bootstrap_host.sh --emit prov.sh        # write the reviewed-as-root VPS provision script
./tools/bootstrap_host.sh --check               # verify live host vs deploy/host-contract.md (RW_DEPLOY_HOST)
./tools/bootstrap_host.sh --check-local <dir>   # rehearse the FS-layout half locally
./tools/rehearse_host.sh                        # deploy/rollback/retention drill on a local fake host
./tools/incident_drill.sh                       # bad-deploy drill: manifest + smoke must detect, rollback must restore
./tools/release_manifest.py site/               # provenance manifest that deploy-site.sh ships as /release.json
./tools/release_manifest.py --verify <dir>      # re-hash a deployed release vs its manifest (integrity)
./tools/stripe_webhook_fixture.py --out /tmp/f.json   # signed test event for the crediting path
grep -n 'data-demo-src' site/demo.html          # must show the live embed URL (G12)
grep -n 'data-pricing' site/pricing.html        # must show "final" post-G4
./tools/analytics_e2e.sh                        # G8 — localhost sink e2e, no args
./tools/gonogo.sh                               # all-18-gate worksheet + pre-filled §6 block
./tools/gate_freshness.sh                       # §13 — are the logged proofs still inside their windows?
./tools/gate_freshness.sh --at 2026-10-01 --strict  # age every proof vs a target launch date; exit 1 on stale
./tools/checklist_audit.py                      # checklist self-consistency — run before citing §10
./tools/accuracy_sweep.py                       # G18 — parody-map + fabrication + claim-risk scan
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
Gates: G1..G18 status: <x/18 green>
Blocking items: <list or none>
Known warnings: <dry-run warns accepted as non-blocking>
Accuracy sweep (G18): <0 fail — last run <date>>
Feed display-filter option (G13): A / B / C — <confirm shipped default A or flip via gsWireSetFilter>
Onboarding hooks (G16): <staging run logged — 32-hook set incl. ?hired=1 return + S7 first visit + four band paths>
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
| Onboarding contract (G16) | | | world-v95 flow + 32 hooks on staging |
| Human playtest (G17) | | | 0 open blockers on launch candidate · PT1–PT92 |

## §8 Day 7 — first week

- [ ] PENDING — First "This Week on the Block" recap post (from public feed; labels per G15)
- [ ] PENDING — Launch metrics review: visits→watch sessions→credit purchases; funnel leaks → MARKETINGLOG.md
- [ ] PENDING — Search Console coverage check; fix indexing issues
- [ ] PENDING — First query map: export GSC queries CSV → `tools/query_map.py export.csv` — cannibalization hits → internal-link fixes; unregistered queries → `seo/query-register.csv` or SEO-PLAN §16 bank (§22)
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
- [ ] PENDING — Content calendar retro: which posts earned traffic/links; adjust SEO-PLAN tiers with real query data (`tools/query_map.py` owner-page share = the re-score input, §15/§22)
- [ ] PENDING — Community funnel check: Discord health, cadence retro, mod-recruitment decision, subreddit revisit — per COMMUNITY-FUNNEL.md §9 day-30 list
- [ ] PENDING — Press kit v1.1: real earned quotes (attributed), final pricing, launch screenshots, trailer link if produced
- [ ] PENDING — Roadmap review: re-rank remaining marketing focuses against month-1 data; update MARKETING_ROADMAP.md
- [ ] PENDING — Season-2 neighborhood marketing decision only if shard-1 retains (research: do NOT split the audience early)
- [ ] PENDING — Moderation month-1: mod recruitment decision + incident-runbook retro (MODERATION-PLAN.md §3.4/§4); review account-flag distribution (score-9 reviews should be rare)
- [ ] PENDING — Data-rights drill: file one self-submitted access request through `privacy@` and walk `deploy/data-rights.md` end-to-end — every §3 store row still matches reality, ack/done templates send clean

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
| 2026-09-23 | tools/ship.sh (v43, first run, rehearsal mode) | full pipeline green: preflight GO (4 pass / 6 warn / 0 fail) → dist zip rebuilt → deploy dry-run (env unset) → punch list printed |
| 2026-09-23 | tools/uptime_probe.sh (v43, vs localhost staging) | HEALTHY — 4×200 + brand marker; TLS check correctly WARNs on non-HTTPS |
| 2026-09-24 | gallery refresh v26→v28 (v45) | shots + press-kit screenshots swapped, webp regen, keyart+banners rebaked, animatics rebuilt (hero/teaser/vertical), dist zip rebuilt (39 files) |
| 2026-09-24 | staging_dryrun.sh (v45, shots v28) | 33 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-24 | tools/seo_audit.py (v45, extended) | 58 pass / 23 warn / 0 fail — new srcset/og:image/CLS checks active; warns: domain, PNG-fallback weight, thin-desc legacy |
| 2026-09-24 | tools/preflight.sh (v45) | 5 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |
| 2026-09-24 | archive.html page added (v46) + gallery refresh v28→v29 | 14th page wired into navs/footers/sitemap/dry-run/prod-smoke/SEO-PLAN/llms.txt; shots + press-kit screenshots swapped, webp regen, keyart+banners rebaked, animatics rebuilt, dist zip rebuilt (39 files) |
| 2026-09-24 | gallery refresh v29→v30 (v47) + press-kit docs | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked, dist zip rebuilt (41 files); NEW press-kit/context.md + guided-tour.md; staging_dryrun 34 pass / 2 warn / 0 fail; seo_audit 63 pass / 24 warn / 0 fail |
| 2026-09-24 | gallery refresh v30→v31 (v50) + STORE-COPY expansion | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked, all 3 animatics rebuilt on v31 stills, dist zip rebuilt (41 files); STORE-COPY +5 sections (PH card, itch theme, Steam sysreqs, A/B descs, claim ledger); staging_dryrun 34 pass / 2 warn / 0 fail; seo_audit 63 pass / 24 warn / 0 fail; preflight GO |
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
| 2026-09-23 | tools/incident_drill.sh (v89, first run) | PASS — fake host over HTTP: good release baseline 0 fail + manifest PASS; corrupted release (index.html/style.css gutted) caught by BOTH `release_manifest.py --verify` (tree_sha256 MISMATCH) and `prod_smoke.sh` (1 FAIL); rollback flip restored green site |
| 2026-09-23 | tools/swap_domain.sh (v59, apply→check→revert) | PASS — placeholder→test domain across 24 files (site/ + deploy/), `--check` CLEAN 0 leftovers, `--revert` restored the whole tree; git status clean |
| 2026-09-23 | tools/stripe_webhook_fixture.py (v59) | PASS — emits `checkout.session.completed` + `Stripe-Signature`; v1 HMAC independently re-verified against `t.body_raw` |
| 2026-09-24 | tools/checklist_audit.py (v68, first run) | caught real drift: 5 gates missing §11 rows, 5 owner gates missing §7 rows, stale "all-15-gate" — all fixed this version; final 9 pass / 0 warn / 0 fail |
| 2026-09-24 | gallery refresh v40→v43 (v68) | shots + press-kit screenshots swapped (v43 published mid-refresh — rebased straight past v42), webp regen, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v43, all 5 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (42 files) |
| 2026-09-24 | tools/gonogo.sh (v68, 17 gates) | 2/17 auto-green (G5, G9) — G16 label now world-v39/9-hook, G17 added as OWNER gate |
| 2026-09-24 | staging_dryrun.sh (v68, shots v43) | 36 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-24 | tools/preflight.sh (v68, +checklist-audit step) | 6 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |
| 2026-09-24 | gallery refresh v43→v44 (v72) | shots + press-kit screenshots swapped, webp regen, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v44, all 5 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (42 files). NOTE: first copy raced the art publish (truncated PNG mid-write) — always `cmp` against published/ before swapping |
| 2026-09-24 | tools/preflight.sh (v72, post-refresh) | 7 pass / 5 warn / 0 fail — GO; brand_audit + checklist_audit clean |
| 2026-09-24 | tools/flip_flags.sh (v74, first run) | PASS — `--check` reports provisional/empty/unset; `--set` applied all three (pricing→final, endpoint→16 pages, demo→URL), `--check` verified consistency incl. multi-page endpoint parity; `--revert` restored pre-launch state with `git status` clean |
| 2026-09-24 | tools/dns_check.sh (v74, first run) | PASS vs example.com — apex/www/play/stats resolution paths exercised; bad-domain arg rejected; expected-IP mismatch path produces FAIL |
| 2026-09-24 | tools/runofshow.sh (v74, first run) | PASS — countdown dashboard reports live done/pending per §2 item: switches provisional/empty/unset, placeholder domain count, deploy env unset, kit zip staged; exit 0, read-only |
| 2026-09-24 | gallery refresh v44→v46 (v76) | shots + press-kit screenshots swapped (cmp-verified against published/), webp regen, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v46, all 5 animatics + boards + 3 thumbnails rebuilt; dist zip rebuilt (42 files) |
| 2026-09-24 | press-kit pass + gallery refresh v46→v47 (v77) | shots + press-kit screenshots swapped (webp regen), captions/alt-text updated for v47 (sunbreak lanes, crepuscular fan); keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v47 + boards/thumbs/animatics rebuilt; NEW press-kit/{media-alert,interview-prep,CHANGELOG}.md; build-press-kit.sh now ships .webp companions; dist zip rebuilt |
| 2026-09-24 | gallery refresh v47→v50 + store-copy pass (v78) | shots + press-kit screenshots swapped (cmp-verified), webp regen, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v50 + boards/thumbs/animatics rebuilt; NEW STORE-COPY §§20–24 (store FAQ, refund/support, itch community, wishlist posture, storefront audit); dist zip rebuilt (49 files); store_copy_check 0 fail |
| 2026-09-23 | checklist_audit.py +§8 contract freshness (v83, first run) | caught real drift pre-edit: G16 cited world-v39/9-hook while onboarding.json is v53 with 21 analytics_hooks; G17 cited PT1–PT35 while playtest.json is v58/53 scenarios — both fixed + gonogo.sh labels synced; final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | staging_dryrun.sh (v83) | 36 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-23 | tools/preflight.sh (v83) | 6 pass / 6 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G9/G12/uncommitted) |
| 2026-09-23 | tools/gonogo.sh (v83, 17 gates) | 0/17 auto-green — G5 correctly flags gallery v50 < published v49 (held pending art sunbeam rework); G9 zip freshness |
| 2026-09-23 | checklist_audit.py world-contract refresh (v98) | caught live drift: onboarding v53→v67 (storage key + 24 hooks incl. band_declared/ads_line_shown/ad_demo_viewed), playtest PT1–PT61/739→PT1–PT64/775 — all pins + gonogo labels + analytics-events.json resynced; final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | tools/launch_day.sh (v98, first run) | PASS — read-only §3 console: 4 done (D0.5–D0.8 drafts staged) / 7 pending (owner-gated flips, live-domain rows, human retro); correct pre-launch |
| 2026-09-23 | checklist_audit.py world-contract refresh (v103) | caught live drift: playtest PT1–PT64→PT1–PT66 (world-v72 harness); G13 gained the C1–C8 possession-affordance check (open production-feedback item); final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | compare.html page added (v106) + gallery gains v54 facade set | 20th page wired into footers/sitemap/dry-run/prod-smoke/SEO-PLAN(§3,§13)/llms.txt + index cross-link; v54 A–D copied in + webp regen (ffmpeg), ImageGallery schema updated; seo_audit 95/40/0, staging_dryrun 40/2/0 |
| 2026-09-23 | tools/accuracy_sweep.py (v113, first run) | caught 4 REAL-name FAILs: 750/744 Guerrero on cast.html ×2 + demo.html ×1 (→ parody 9457/9418 Guerrero St, canonical per world/businesses.md) + 1 false positive tuned (Teeth idiom → ambiguous tier); final 5 pass / 32 warn / 0 fail |
| 2026-09-23 | NEW gate G18 (v113) | accuracy sweep wired into gonogo (AUTO) + preflight step 5c + command card + §6/§7-area counts; audit bumped G1..G18 throughout |
| 2026-09-23 | checklist_audit.py world-contract refresh (v113) | caught live drift twice mid-version: playtest PT1–PT66→PT70→PT71→PT72 (world-v72→v76 harness — world track shipped four harness versions during this one); all pins + gonogo labels resynced; final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | gallery refresh v56→v59 (v113) + brand lint fix | v58 copied first, v59 published mid-version — rebased straight to it (cmp-verified, webp regen); gallery Latest section rewritten for the wet-afternoon pass (stringcourses, ponding, festoons); og:image + JSON-LD + sitemap image entries bumped; dist zip rebuilt (55 files); compare.html 'Smart Zoi' cell rephrased to satisfy lexicon NPC ban; brand_audit 0/0 |
| 2026-09-23 | tools/bootstrap_host.sh (v119, first run) | plan mode prints contract + writes nothing; `--emit` produced a syntactically valid provision script (bash -n clean); `--check-local` correctly FAILed a fake host missing maintenance.html and PASSed once staged — the host-prep step + DR rebuild path are now code, not folklore |
| 2026-09-23 | tools/staging_dryrun.sh (v113, shots v59) | 40 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-23 | tools/preflight.sh (v113, +accuracy step 5c) | 8 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted) |
| 2026-09-23 | tools/gonogo.sh (v113, 18 gates) | 3/18 auto-green (G5 gallery v59, G9 zip fresh, G18 accuracy clean) — first version where the copy itself is a mechanical gate |
| 2026-09-23 | checklist_audit.py world-contract refresh (v128) | caught live drift twice mid-version: playtest PT1–PT77→PT80→PT82 (world-v89→v91 harness — two world versions shipped during this one); all pins + gonogo labels resynced; final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | NEW §13 + tools/gate_freshness.sh (v128, first run) | proof-freshness windows now code: ages every §10 proof vs its window + structural drift (gallery vs published, zip vs sources, site-edits, uncommitted tree); first run correctly flagged gallery v62<v64 → drove the refresh below; final 13 fresh / 1 stale (uncommitted tree — resolves at commit) / 0 never |
| 2026-09-23 | gallery refresh v61→v65 (v128) | art published twice mid-version — rebased straight past v64 to v65 (parklets, papel-picado garlands, porch flags, tree grate wells, utility lids; v63 impostor atlas underneath); shots + kit screenshots swapped (cmp-verified, webp regen), captions/alt-text rewritten, keyart/banners/capsules/og-card rebaked; trailer EDL rebased to v64 stills (v65 rebase deferred — stills on disk), all 8 animatics rebuilt; dist zip rebuilt (58 files) |
| 2026-09-23 | staging_dryrun.sh (v128, shots v65) | 41 pass / 2 warn / 0 fail — warns: domain ×2 only |
| 2026-09-23 | tools/preflight.sh (v128) | 8 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted); accuracy_sweep 5/32/0, seo_audit 97/49/0, brand_audit 0/0, trailer --check 8 programs/62 shots 0 fail |
| 2026-09-23 | tools/traffic_probe.sh (v134, first run, vs local static staging) | warm 20/20 PASS (all sitemap URLs); load 80/80 200s @ conc=16 (avg 14 ms, p95 ~37 ms — correctness signal only); headers 0 pass / 10 warn / 0 fail — correctly bound to the Caddyfile contract (bare http.server sends none) |
| 2026-09-24 | checklist_audit.py world-contract refresh (v140) | caught live drift: playtest PT1–PT83→PT1–PT84 (world harness grew one scenario); all four pins resynced; final 14 pass / 0 warn / 0 fail |
| 2026-09-23 | gallery refresh v65→v67 (v136) | art-v67 lens rebuild (chromatic fringing / scanline blur / film grain retired; sfVisKm weather-driven visibility; carries art-v66 crown-genome trees + autumn leaf-fall); shots + kit screenshots swapped, captions/alt-text/README/whats-new/deadline-desk/contact-sheet/fact-sheet/one-sheet/b-roll/embargo refs updated, keyart/banners/og-card rebaked on v67-D; v67-A/C PNGs breach the 2MB fallback ceiling → PNG fallback dropped for those two per the v135 rule (webp-only `<img>`, PNGs kept as downloads); dist zip rebuilt (58 files) |
| 2026-09-23 | staging_dryrun.sh + preflight.sh (v136, shots v67) | dry-run 40 pass / 3 warn / 0 fail (domain ×2 + 2 on-disk PNGs >2MB — expected, fallbacks dropped); seo 97/42/0; accuracy 5/32/0; checklist 14/0/0; preflight 8 pass / 5 warn / 0 fail GO (warns all owner-gated) |
| 2026-09-24 | tools/infra_audit.sh (v149, first run) | caught real drift on debut: stale "14 pages" claim (actual 21), `RW_DEPLOY_USER` cited but undefined (user embedded in RW_DEPLOY_HOST), key-scan false-fired on `sk_live_...` placeholders — all fixed; final 75 pass / 0 warn / 0 fail |

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
| G4 pricing flip | `tools/flip_flags.sh --set pricing=final` + `gonogo.sh` AUTO check | flip rehearsed 2026-09-24 (v74 round-trip) |
| G5 gallery freshness | `gonogo.sh` AUTO diff vs `published/VERSION` | v53 (v32→v36) |
| G8 analytics | `tools/flip_flags.sh --set endpoint=` + `deploy/umami.compose.example` + `tools/analytics_e2e.sh` end-to-end fixture | 2026-09-23 e2e (1057/1057); endpoint flip rehearsed 2026-09-24 (v74) |
| G9 press-kit zip | `build-press-kit.sh` + `gonogo.sh` freshness check | v53 rebuild |
| G10 dry-run | `tools/staging_dryrun.sh` | every version |
| G12 demo flip | `demo.html` fallback verified; `tools/flip_flags.sh --set demo=` + `--check` in command card | fallback rehearsed; flip rehearsed 2026-09-24 (v74) |
| G13 moderation | `MODERATION-PLAN.md` + `world/mod-console.html` demo; `gsWireAudit()` staging run still owed | spec only — needs game build |
| G14 infra | `deploy/` configs + `tools/ship.sh` rehearsal + `tools/uptime_probe.sh` + `tools/rehearse_host.sh` (deploy/rollback/retention) + `tools/incident_drill.sh` (detect→rollback→verify) + `tools/release_manifest.py` (release.json provenance, prod_smoke §5b) + `tools/stripe_webhook_fixture.py` (crediting-path fixture) + `tools/dns_check.sh` (DNS verify) + `tools/runofshow.sh` (countdown status) + `tools/bootstrap_host.sh` (host provision + contract check + DR rebuild) + `tools/infra_audit.sh` (infra-doc drift) + `deploy/data-rights.md` (privacy@ runbook) | 2026-09-23 ship.sh + rehearse_host green; dns_check + runofshow rehearsed 2026-09-24 (v74); incident_drill PASS 2026-09-23 (v89); bootstrap emit+check-local rehearsed 2026-09-23 (v119); infra_audit 75/0/0 2026-09-24 (v149) |
| G15 feed vocab | `world/feed.json` canonical list quoted in gate text | diff owed at flip |
| G16 onboarding | `analytics-events.json` — all 32 world-v95 onboarding hooks spec'd incl. band_declared/ads_line_shown/ad_demo_viewed + v95's credit_rules_seen/subs_line_shown/sub_stipend_previewed/first_visit_filed/visit_ended (verified by checklist_audit §8) + sink/report/dashboard support; staging run incl. `?hired=1` + four band paths owed | spec complete — needs game build |
| G17 human playtest | `world/playtest.html` harness (live: PT1–PT92 (checkpoint count grows with the harness — cite the live count), `#pt=` deep links, triage export); owner run on launch candidate owed | harness shipped; run owed |
| G18 accuracy sweep | `tools/accuracy_sweep.py` — 155-key parody map + fabrication markers are hard FAILs, claim-risk-without-negation are human-read WARNs; wired into preflight step 5c | first run 2026-09-23 (v113): 0 fail after 3 real-address fixes |
| Checklist integrity | `tools/checklist_audit.py` — gates↔§11↔§7↔command-card↔gonogo consistency + live world-contract freshness (§8) | 2026-09-23 (v83): 14/0/0 |
| Proof freshness (§13) | `tools/gate_freshness.sh` — ages every §10 proof against its window + structural drift (gallery/zip/site-edits/uncommitted); `--strict` for cron | first run 2026-09-23 (v128): flagged gallery v62<v64 + stale zip pre-refresh |
| D0.1 deploy | `deploy/deploy-site.sh` (dry-run rehearsed) | 2026-09-23 |
| D0.2 prod smoke | `tools/prod_smoke.sh` vs localhost staging | rehearsed |
| D0.3/D0.3b flips | documented attributes (`data-pricing`, `data-demo-src`) | attribute greps in §4 |
| D0.4 sitemap submit | sitemap.xml valid + prod_smoke checks it | every dry-run |
| D0.5–D0.8 posts | `social/drafts/` — launch-thread, timeline, pitches, seeds | drafted, not sent |
| D0.8b community | `COMMUNITY-FUNNEL.md` §3 + `community/feed-mirror.md` + `rules.html` + `templates/mod-responses.md` | spec complete |
| §3 day-0 console | `tools/launch_day.sh` — per-row live status for D0.1–D0.10, incl. optional live prod_smoke/uptime rows when RW_DOMAIN is set | first run 2026-09-23 (v98): 4 done / 7 pending — all pendings owner/live-domain rows |
| D0.9 monitoring | `tools/uptime_probe.sh` + `deploy/monitoring.example` + ANALYTICS dashboard | probe HEALTHY 2026-09-23 |
| §5 rollbacks | `deploy/maintenance.html` + Caddyfile block + incident-comms drafts + `tools/rehearse_host.sh` rollback flip + `tools/incident_drill.sh` (bad deploy detected, rollback restores green) | rollback flip exercised 2026-09-23 (v59); full incident loop 2026-09-23 (v89) |

## §12 Never-do list (load-bearing)

- No publishing, posting, account registration, ad spend, or press contact without explicit owner approval — ever.
- No fake testimonials or invented quotes. No astroturfing.
- No promises for cut features (voice/TTS v1, cash-out/RMT, loot boxes, ambient-NPC economies).
- No claims the game is playable before a live build exists.
- No real SF business names — parody names only (per user-decision 2026-09-22; canonical list `world/parody-names.json`).
- No spectator copy that leaks character secrets — public surfaces quote SURFACE-tier facts only (design §7; world building-card convention).

## §13 Proof freshness windows — the re-go procedure

A §10 entry is evidence about the tree *as it stood that day*. Proofs decay:
a dry-run logged last month says nothing about the tree at T-48h, and after a
NO-GO or a slipped date the §6 block must not cite stale evidence. Each proof
has a window — how long its result may be quoted before it must be re-run.
`./tools/gate_freshness.sh` reads the §10 log and the live tree, then reports
each proof FRESH / STALE / NEVER against today (or `--at YYYY-MM-DD` against a
target launch date; `--strict` exits 1 on any stale row — cron-safe).

| Proof | Window | Re-run command |
|-------|--------|----------------|
| staging dry-run | 1 day | `./tools/staging_dryrun.sh` |
| preflight go-gate | 2 days | `./tools/preflight.sh` |
| accuracy sweep (G18) | 7 days | `./tools/accuracy_sweep.py` |
| checklist self-audit | 7 days | `./tools/checklist_audit.py` |
| flip-flags round-trip | 30 days | `./tools/flip_flags.sh --check` then set/revert |
| analytics e2e | 30 days | `./tools/analytics_e2e.sh` |
| ship.sh rehearsal | 30 days | `./tools/ship.sh` |
| host deploy drill | 30 days | `./tools/rehearse_host.sh` |
| incident drill | 60 days | `./tools/incident_drill.sh` |
| domain-swap round-trip | 90 days | `./tools/swap_domain.sh <domain>` then `--revert` |

Structural checks (drift, not time — the tool reports these too): gallery vs
`published/VERSION` (G5), press-kit zip vs its sources (G9), `site/` edits
since the last logged dry-run, and uncommitted work under `site/`/`deploy/`/
`tools/` — **a logged proof cannot cite an uncommitted tree**, because the
deployed artifact would differ from the rehearsed one.

**Re-go procedure** (after a NO-GO, a slipped date, or any STALE row):
1. `./tools/gate_freshness.sh --at <new launch date>` — list what expired.
2. Re-run each STALE/NEVER row; append results to §10 (newest last, dates verbatim).
3. Re-run `./tools/checklist_audit.py` — world-contract pins (G13/G15/G16/G17)
   may have drifted upstream while the date slipped.
4. Re-issue the §6 block from `gonogo.sh` — never edit a stale block by hand.
The windows here are also compiled into `tools/gate_freshness.sh` — change one,
change the other.
| 2026-09-23 | tools/press_kit_check.py (v137, first run) | NEW gate caught 8 real gaps on first run: manifest self-undeclared, 7 assets uncaptioned (logo rasters, mono lockup, v67 webp companions) — all fixed; rerun 7 pass / 0 warn / 0 fail (54 declared files, 15 index links, zip parity). Wired into preflight.sh step 5d. NEW press-kit/coverage-log.md (post-launch coverage tracker). Preflight rerun: 9 pass / 5 warn / 0 fail GO |
| 2026-09-23 | tools/store_copy_check.py checks 8–9 + preflight 5e (v138, first run) | NEW checks caught 2 real drifts on first run: preview.html screenshot strip pointed at deleted press-kit v61 set (rebased to v67 + §9 captions) and banner src pointed at nonexistent site/assets/banners/ path — both fixed; capsule-dims check verifies all 8 sized PNGs incl. NEW steam-library-hero-3840x1240.png (generated composite, §4 FLAG→Done-interim). Wired into preflight.sh step 5e. Preflight rerun: 9 pass / 6 warn / 0 fail GO |

## §14 The quiet-launch variant (owner's other GO)

GO is not binary. The checklist supports a second, quieter shape: ship the
site and open the door, but hold the announce. Use it when the gates are
green but confidence isn't — e.g. G17 passed with majors fresh in memory,
or the owner wants real spectators on the build before press sees it.

| | Full announce (default) | Quiet launch |
|---|---|---|
| Deploy + smoke (D0.1–D0.3b) | yes | yes — identical |
| Search Console submit (D0.4) | yes | yes — indexing is not announcing |
| Devlog post (D0.5) | T-0 | held — publish as "the door has been open 3 days" |
| Channels/press/community (D0.6–D0.8) | T-0, ≥20 min apart | held 72 h, then run in the same order |
| Community open (D0.8b) | T-0 | held with the rest — Discord opens WITH the announce, not before (a Discord with nobody in it reads dead, not quiet) |
| Monitoring (D0.9) | continuous | continuous — this is the point of the soak |
| Retro (D0.10) | T+24h | two notes: soak-day-1 + post-announce day-1 |

Quiet-launch rules:
- **It's still a launch.** Every gate G1–G18 must be green; the quiet
  variant relaxes timing, never readiness. A quiet launch of an unready
  build is just a launch nobody can roll back from cleanly.
- **72 h is the soak window, not a habit.** Decide the announce date at
  the T-48h block — don't drift. If a SEV-1/2 fires during the soak, fix
  it, then restart the 72 h; the announce drafts stay truth-conditional.
- **Whoever finds it organically, welcomes it.** No delisting tricks, no
  robots-walls — the site is public the moment it deploys. Quiet launch
  means we don't amplify, not that we hide.
- Record the choice in the §6 block: `Shape: FULL / QUIET — announce at
  <date>` and mirror it in §15's event log when it happens.

## §15 Launch-day event log (fill in as it happens)

§10 is rehearsals; this is the performance. One line per real event,
timestamps in UTC — it's the forensic record for the day-7 retro and the
only place "what actually shipped when" is unambiguous. Fill during the
day; it takes seconds per row.

| UTC | Event | Note |
|-----|-------|------|
| | §6 GO issued — shape FULL/QUIET | |
| | deploy applied (D0.1) | release id from /release.json |
| | prod smoke green (D0.2) | pass/warn/fail |
| | launch copy flipped (D0.3) | commit sha |
| | demo embed live (D0.3b) | watch_start mode:"live" seen y/n |
| | devlog posted (D0.5) | url |
| | channel posts sent (D0.6) | which channels |
| | press kit mailed (D0.7) | n outlets |
| | community opened (D0.8b) | invite link live |
| | first organic spectator | source if known |
| | first request_submitted event | |
| | first character_created event | |
| | incidents | link §5 row fired, or "none" |
| | day-1 snapshot taken (D0.10) | vs funnel targets |

## §16 The second go/no-go — post-launch health gates

Launch day proves the door opens. These checkpoints prove it should stay
open. Each has a hold-condition: if tripped, pause the remaining amplify
steps (§3 abort points) and log it here — never silently absorb a red.
Thresholds marked `<owner>` are the owner's to set in the §6 block,
because they're judgment, not mechanics.

| When | Check | Hold-condition |
|------|-------|----------------|
| T+2h | uptime probe green; `watch_start` firing on both personas; request feed moving | any FAIL → §5 row + hold D0.6+ if still running |
| T+24h | funnel: visit→watch_start conversion sane (not zero, not absurd); mod queue depth reviewed; refund events = only legit paths | refund spike or queue backlog > <owner> → hold paid-traffic ideas, keep site up |
| T+72h | quiet-launch soak ends (if QUIET) — all §15 rows filled, no open SEV | announce proceeds only if soak was clean |
| T+7d | §8 list done; payer rate vs projection band <owner>; denial rate first look sane | pricing review owed before any promo push |
| T+30d | §9 list done; month-1 report rendered via `tools/analytics_report.py` | roadmap re-rank before season-2 decisions |

The standing rule from §6 applies here too: a red row defaults to HOLD.
The launch is boring twice, or it isn't done.
| 2026-09-24 | checklist_audit.py world-contract refresh (v143) | caught live drift twice mid-version: onboarding v81→v95 (storage key rw_onboard_v95, 27→32 hooks — spec'd credit_rules_seen/subs_line_shown/sub_stipend_previewed/first_visit_filed/visit_ended in analytics-events.json), playtest PT84→PT92 (world shipped four harness versions during this one); all pins + gonogo labels resynced; final 14 pass / 0 warn / 0 fail |
| 2026-09-24 | gallery refresh v67→v71 (v143) | art published v70 AND v71 mid-version — rebased straight past both (dollhouse interiors: inspected pawn's building ghosts to a real floor plan; top-view block-shadow pass: swept footprint shadows + AO skirts); shots + kit screenshots swapped (cmp-verified, webp regen), captions/alt-text/README/whats-new/deadline-desk/contact-sheet/fact-sheet/one-sheet/b-roll/embargo refs updated, whats-new gained v68/v69/v70/v71 bullets, keyart/banners/capsules/og-card rebaked on v71-D; v71-C PNG (2.02MB) breaches the 2MB ceiling → webp-only per the v135 rule (A/B/D keep PNG fallback); dist zip rebuilt (59 files) |
| 2026-09-24 | staging_dryrun.sh (v143, shots v71) | 40 pass / 3 warn / 0 fail — warns: domain ×2 + 1 on-disk PNG >2MB (expected, fallback dropped) |
| 2026-09-24 | tools/preflight.sh (v143) | 10 pass / 5 warn / 0 fail — GO; warns all owner-gated (G3/G4/G8/G12/uncommitted); accuracy_sweep 5/34/0, seo_audit 97/43/0, brand_audit 0/0, checklist_audit 14/0/0, press_kit 7/0/0, store_copy 0/0 |
| 2026-09-24 | tools/gonogo.sh (v143, 18 gates) | 3/18 auto-green (G5 gallery v71, G9 zip fresh, G18 accuracy clean) — G5 flagged mid-version at v70<v71, cleared by the rebase above |
