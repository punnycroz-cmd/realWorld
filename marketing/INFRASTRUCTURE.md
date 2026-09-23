# Launch Infrastructure — Real World ("The Mission")

**Version:** v74 · 2026-09-23 · branch `sf/marketing` · LOCAL BUILD ONLY.
**Status:** planned + rehearsed locally. **Nothing below is provisioned or live.**
Every account creation, DNS change, and paid service is owner-gated. This file is
the plan so that "go" is a provisioning session, not an architecture debate.

**Scope note:** this track owns launch *readiness*. Game-server internals belong
to the game-systems track; this doc only specifies what the game build must
*expose* for the marketing surface to work (§3, §8).

---

## 1. Architecture map

```
                         ┌─────────────────────────────┐
   player/press ──HTTPS─▶│  CDN + static site host      │  marketing/site/ as-is
                         │  (realworld-game.example)    │  14 pages, zero build step
                         └──────────────┬──────────────┘
                                        │ iframe (sandboxed)
                                        ▼
                         ┌─────────────────────────────┐
                         │  spectator feed origin       │  game build serves the
                         │  (play.<domain> subdomain)   │  embeddable world view
                         └──────────────┬──────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
 ┌─────────────┐               ┌────────────────┐              ┌────────────────┐
 │ Stripe      │               │ analytics      │              │ status/uptime  │
 │ + Stripe Tax│──webhooks──▶  │ backend        │              │ monitor        │
 │ (payments)  │  to game API  │ (cookieless)   │              │ (external ping)│
 └─────────────┘               └────────────────┘              └────────────────┘
```

Principles:

- **Static site is static.** The whole marketing surface deploys as files —
  no framework, no build step, no server code we own. Any static host works;
  the deploy configs in `deploy/` cover the two recommended targets.
- **The game is a separate origin.** Spectator traffic is heavy and
  stateful; it must never take down the front door. Subdomain isolation
  also keeps cookies/CSP clean.
- **Payments touch the site minimally.** Checkout happens on Stripe-hosted
  pages (Stripe Checkout) — no card data ever touches our origins. The site
  links out; the game backend consumes webhooks to credit accounts.
- **Privacy posture is load-bearing** (ANALYTICS.md §1): cookieless
  analytics, no third-party pixels, DNT/GPC honored. Infrastructure choices
  must not silently add tracking (no host-injected scripts).

## 2. Component decisions

All options are OWNER-GATED. "Recommended" = lowest ops burden consistent
with the brand and the budget; swap freely — the site is portable.

| Component | Recommended | Alternatives | Why / notes |
|---|---|---|---|
| Domain registrar | any major registrar | — | owner registers; enable registrar lock + 2FA. Domain name itself is an owner decision (all copy uses `realworld-game.example` placeholder until then) |
| DNS | registrar DNS or Cloudflare (free) | Route53 | needs apex → host + `play.` + `stats.` records; spec in `deploy/dns-records.example` |
| Static site host | **VPS + Caddy** (`deploy/Caddyfile`) | Cloudflare Pages / Netlify (`deploy/netlify.toml`), S3+CDN | Caddy = auto-TLS, zero vendor lock, full header control. Pages/Netlify = zero-ops; both configs ship ready |
| CDN | host-builtin (Pages/Netlify) or Cloudflare in front of Caddy | — | site is ~small MB; CDN mainly buys TLS edge + DDoS absorption |
| Game/spectator server | game track owns the process; marketing needs one HTTPS origin `play.<domain>` | same box as site (Caddy `reverse_proxy`) or separate host | requirements for the embed in §3 |
| Payments | **Stripe + Stripe Tax** (monetization plan §4.4) | Paddle/Lemon Squeezy (MoR) when EU/UK volume justifies | Checkout-hosted → no PCI scope on our servers; product/price manifest in `deploy/stripe-products.json` |
| Analytics | self-hosted **Umami** or the existing `tools/analytics_sink.py` first-party collector | Plausible CE | cookieless; `data-endpoint` flip documented in ANALYTICS.md §4 |
| Transactional email | none at launch (site has no accounts) | game-side receipts come from Stripe's built-in emails | revisit when game accounts exist |
| Status/uptime | any external ping monitor (free tier) hitting `/` + `play.` health | self-hosted status page later | launch needs alerting, not a status page |
| Secrets | host env vars / owner's password manager | Doppler/1Password | inventory in `deploy/infra.env.example` — **no real values ever committed** |

## 3. What the game build must expose (contract for game/world tracks)

Marketing-side surfaces already built; these are the integration points:

1. **Spectator embed** — `site/demo.html` mounts `<iframe data-demo-src>`.
   Requirements: HTTPS, `frame-ancestors` allowing the site origin (or no
   X-Frame-Options blocking), reasonable initial payload (<5 MB target).
   Until the URL exists the page shows the fallback gallery — verified.
2. **Feed vocabulary** — demo feed-preview + journal recap labels use
   `ran / queued / resolved / refunded`; sync with real `gsViewerState`
   event names before launch (DEMO-PAGE.md §7, MODERATION-PLAN.md §2.3).
3. **Analytics events** — game emits `watch_start`, `request_submitted`,
   `character_created` per `marketing/analytics-events.json` to the same
   endpoint the site uses.
4. **Stripe webhook consumer** — game backend receives
   `checkout.session.completed` to credit accounts; signature verification
   with `STRIPE_WEBHOOK_SECRET`. Non-transferable credits → webhook is the
   ONLY crediting path; never expose a client-callable grant.
5. **Public request feed endpoint** (design §5) — read-only JSON for
   `#the-feed` mirror + journal recaps; display-filter pass applied per the
   owner's option-A/B/C decision (MODERATION-PLAN.md §2.3) before serving.
6. **Moderation contract is already canonical** — world-v8 shipped
   `world/moderation.json` + `screen.js` (`RWScreen.screenRequest`): the
   game's classifier plumbing must never be MORE permissive than the
   reference on identical inputs, and feed denials carry `reason_code`
   verbatim. Marketing copy hard-cites these codes — changes there require
   a copy sweep (see MODERATION-PLAN.md §9).
7. **Never-ship surfaces stay off this host** — `world/drama.html` (internal
   direction board) and `world/playtest.html` are explicitly internal;
   nothing under `site/` links or mirrors them, and the deploy script only
   ever rsyncs `site/`. Keep it that way. Playtest findings tagged
   `triage_owner: marketing` (world-v9 `playtest.json`) route to this track.

## 4. Environments

| Env | URL | Purpose | State today |
|---|---|---|---|
| local | `127.0.0.1:8123` | `tools/staging_dryrun.sh` rehearsal | ✅ 32 pass / 3 warn / 0 fail; `tools/preflight.sh` GO (0 fail, warns = owner-gated flags) |
| staging | `staging.<domain>` (owner-gated) | pre-launch full dress rehearsal incl. real DNS + TLS | not provisioned |
| production | `<domain>` + `play.` + `stats.` | launch | not provisioned |

No separate staging *site* pipeline is needed — the site is identical files;
staging exists mainly to rehearse DNS/TLS/headers and the demo embed.

## 5. Provisioning runbook (the "go" session)

Ordered; each step maps to a LAUNCH-CHECKLIST gate. Est. total: ~2–3 h.
**The whole session is now one command:** `tools/ship.sh` runs steps 0–4
plus the kit rebuild and prints the post-deploy punch list — `--apply`
ships for real, bare invocation rehearses it read-only (§6).
**Step 0, always:** `tools/preflight.sh` — runs the dry-run, a secret scan
over `site/`+`deploy/`, sitemap parity, press-kit freshness, and reports the
three owner-gated flip flags (pricing/demo/analytics). Exit 0 = mechanically
GO; it never publishes anything.

| # | Step | Gate | Est. |
|---|---|---|---|
| 0 | `tools/preflight.sh` clean (0 fail) on the commit that will ship | G10 | 2 min |
| 1 | Owner registers domain; point nameservers (or keep registrar DNS) | G3 | 15 min |
| 2 | Create DNS records per `deploy/dns-records.example` (apex + `www` redirect + `play.` + `stats.`); verify with `tools/dns_check.sh <domain> [apex-ip]` — exits 1 until every record resolves correctly | G3/G14 | 15 min |
| 3 | Provision host (VPS+Caddy or Pages/Netlify project); deploy via `deploy/deploy-site.sh --apply` or git-connected host | G14 | 30 min |
| 4 | Verify TLS auto-issued; run `tools/prod_smoke.sh https://<domain>` | G14/D0.2 | 10 min |
| 5 | Stand up analytics backend on `stats.<domain>` — `deploy/umami.compose.example` is the ready Umami+Postgres spec matching the Caddyfile `stats.` block; then `tools/flip_flags.sh --set endpoint=https://stats.<domain>/api/send` sets `data-endpoint`/`data-site` on all 16 pages in one pass; confirm events in dashboard | G8 | 30 min |
| 6 | Stripe: create account → `deploy/stripe-products.json` → create products/prices (Dashboard or CLI) → test-mode purchase → webhook to game crediting path. The consumer itself can be rehearsed BEFORE the account exists: `tools/stripe_webhook_fixture.py` emits a correctly-signed `checkout.session.completed` + `Stripe-Signature` header (HMAC-SHA256 over `t.body`) for a local endpoint | G14 | 45 min |
| 7 | Arm uptime monitoring per `deploy/monitoring.example` (external monitor, or cron `tools/uptime_probe.sh` as the self-hosted stopgap); alert → owner email/SMS | G14 | 10 min |
| 8 | `tools/swap_domain.sh <domain>` — automated G3 sweep (site/ + deploy/, 24 files today; `--check` verifies zero leftovers, `--revert` restores the placeholder for continued iteration). Dry-run §4 + preflight §3 must go clean after | G3 | 5 min |
| 9 | Rebuild press kit (`./build-press-kit.sh`), rerun dry-run | G9/G10 | 10 min |

The remaining owner-gated flips are also one command each — `tools/flip_flags.sh`
(`--check` reports all three; `--revert` restores pre-launch state):
G4 `pricing=final` (T-48h, one commit with the same-commit sync list — LAUNCH-CHECKLIST G4),
G8 `endpoint=<url>` (step 5 above), G12 `demo=<url>` (T-2h, D0.3b).
At any point in the countdown, `tools/runofshow.sh` prints live done/pending
status for every mechanical §2 run-of-show item (read-only; set `RW_DOMAIN`
to include the live DNS row).

## 6. Deploy & rollback

- **Deploy:** `deploy/deploy-site.sh` — `rsync --delete` to a host path, or
  `caddy` reload. Defaults to `--dry-run`; requires `--apply` and
  `RW_DEPLOY_HOST`. Static + atomic: rsync to a `releases/<ts>/` dir and
  flip a symlink. On apply it prints the exact rollback command (previous
  release path) and prunes the host to the 5 newest releases.
- **Rollback:** symlink flip back using the printed command, or redeploy a
  prior git tag. Worst case = maintenance mode (below). No state to lose —
  the site is stateless. Full table: LAUNCH-CHECKLIST §5.
  **Rehearsed:** `tools/rehearse_host.sh` exercises the whole contract on a
  local fake host — 7 deploys, symlink flips, 5-release retention, the
  printed-style rollback flip, `diff -r` content integrity, and
  maintenance-page staging. Run it any time deploy logic changes.
- **Maintenance mode:** `deploy/maintenance.html` is a self-contained page
  (inline styles, zero asset deps — renders even if a release is broken).
  It lives OUTSIDE `site/` so it never ships in a deploy; copy it to
  `/srv/www/realworld/maintenance.html` once at provisioning. Enable/disable
  = comment flip in `deploy/Caddyfile` + `caddy reload`.
- **Never deployed:** secrets, `.env`, live keys — `.gitignore` covers
  `deploy/*.local`, `deploy/.env*`; `preflight.sh` §2 re-scans for
  key-shaped strings as a second line of defense.

## 7. Security baseline (enforced by `deploy/Caddyfile` headers)

- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; img-src 'self' data:; frame-src https://play.*` — tighten `frame-src` to the real play origin at launch; `analytics.js` posts via `connect-src`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` deny-list
- Custom 404 → `/404.html`; `sitemap.xml`/`robots.txt` at root
- Rate limiting on the game API is game-track scope; site needs none.
- Stripe: webhook signature verification mandatory; Radar on; 3-DS on
  orders >$30 (monetization plan §4.4). Chargeback → claw credits per ToS.

## 8. Cost estimate (launch scale, monthly)

| Item | $0–low option | Typical |
|---|---|---|
| Domain | — | $12–20/yr |
| Static host | Cloudflare Pages / Netlify free tier | VPS $5–10 |
| Analytics (Umami self-hosted) | on same VPS | incl. above |
| Uptime monitor | free tier | $0 |
| Stripe | — | 2.9% + 30¢/txn (no fixed cost) |
| Game server | game track owns | dominates infra cost (streaming) — see monetization plan §4.3: ~$1–1.5k/mo at 10k MAU incl. LLM |
| **Marketing surface total** | **≈ $0–15/mo** | the site is deliberately boring |

## 9. Secrets inventory (values never committed)

`deploy/infra.env.example` is the canonical list. Highlights:

- `RW_DEPLOY_HOST`, `RW_DEPLOY_PATH`, `RW_DEPLOY_USER` — deploy script
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` —
  game-side; site never sees them
- `RW_ANALYTICS_ENDPOINT` — the only value the *site* needs, and it ships
  as a public `data-endpoint` attribute (not secret)
- Uptime-monitor webhook/email — owner config

## 10. Owner decisions still open

1. Real domain name (drives G3 sweep, DNS, OG URLs, email addresses).
2. Hosting choice: VPS+Caddy vs Pages/Netlify — both configs ready.
3. Analytics backend pick (ANALYTICS.md §2).
4. Stripe account + whether to start Stripe-only (recommended) or MoR.
5. Whether `play.` lives on the same box as the site (Caddy
   `reverse_proxy` block already sketched in `deploy/Caddyfile`).

## 11. Day-2 operations (post-launch)

What keeps the surface healthy after D0.1 — all runnable from this repo.

- **The go command:** `tools/ship.sh` orchestrates preflight → kit rebuild →
  deploy → live smoke → punch list. Rehearse bare (`./tools/ship.sh`,
  read-only); ship with `--apply` + deploy env set. It hard-stops on any
  preflight FAIL — owner-gated warns pass through by design.
- **Monitoring:** `deploy/monitoring.example` is the probe/alert spec —
  six HTTP probes (apex pages, sitemap, `play.` + `stats.` health), TLS
  expiry at 14 days, two-severity alert routing, and a short response
  playbook per failure class. Until the owner picks an external monitor,
  `tools/uptime_probe.sh https://<domain>` (cron `*/5`) is the self-hosted
  stopgap — same checks, exits non-zero on failure.
- **Backups:** the site is stateless — there is nothing to back up beyond
  what git already holds. Host keeps the 5 newest releases
  (`deploy-site.sh` retention); rollback = symlink flip. The only
  irreplaceable host artifact is `/srv/www/realworld/maintenance.html`
  (re-copyable from `deploy/`). Analytics DB (if self-hosted Umami) is
  game-adjacent — backup policy is set when the backend is picked (G8).
- **TLS:** Caddy auto-renews ~30 days out; the 14-day monitor alert means
  renewal already failed once — check 80/443 reachability and LE
  rate-limits, don't wait for day 0.
- **Logs:** Caddy access/error logs live on the host (`journalctl -u caddy`);
  nothing is shipped back. Uptime probes should retain 30 days of
  status history (any free monitor does this).
- **Post-launch verification cadence:** `prod_smoke.sh` after every
  deploy (ship.sh runs it automatically); `uptime_probe.sh` failures →
  LAUNCH-CHECKLIST §5 severity ladder.
