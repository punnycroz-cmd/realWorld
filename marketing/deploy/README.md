# deploy/ — launch infrastructure artifacts

Everything here is LOCAL/draft until the owner gates open
(LAUNCH-CHECKLIST G3/G8/G14). No live hosts, keys, or domains exist.

| File | Purpose |
|---|---|
| `Caddyfile` | Recommended host config (VPS + Caddy, auto-TLS). Replace `realworld-game.example` placeholders ×5 incl. CSP `frame-src`/`connect-src`. |
| `netlify.toml` | Zero-ops alternative (Netlify; adaptable to Cloudflare Pages `_headers`). Same headers/CSP. |
| `deploy-site.sh` | rsync → `releases/<ts>` + atomic `current` symlink flip; prints the rollback command and prunes to 5 releases on apply. **Dry-run unless `--apply`.** Needs `RW_DEPLOY_HOST`/`RW_DEPLOY_PATH`. |
| `maintenance.html` | Self-contained 503 page for maintenance mode / full rollback. NOT shipped in `site/`; copy to `/srv/www/realworld/maintenance.html` once during provisioning, enable via the Caddyfile maintenance block. |
| `dns-records.example` | DNS spec: apex + www + `play.` + `stats.` (+ optional mail/verification). |
| `stripe-products.json` | Product/price manifest for Stripe provisioning — numbers = PRICING-PAGE-CONTENT.md §2 (PROPOSAL until G4). |
| `infra.env.example` | Secrets/env inventory. Copy to `infra.env.local` (gitignored) at provisioning; never commit values. |
| `monitoring.example` | Uptime/alert spec: 6 HTTP probes, TLS-expiry alerting, 2-severity routing, per-failure response playbook. Feed to any external monitor, or cron `../tools/uptime_probe.sh` as the self-hosted stopgap. |
| `umami.compose.example` | Self-hosted analytics backend spec (Umami + Postgres) for `stats.<domain>` — matches the Caddyfile `stats.` reverse_proxy block. Fill 2 secrets on the host, `docker compose up -d`, then `../tools/flip_flags.sh --set endpoint=...`. |

Post-deploy verification: `../tools/prod_smoke.sh https://<domain>` — the
production counterpart of `staging_dryrun.sh` (LAUNCH-CHECKLIST D0.2).

The whole go-session is one command: `../tools/ship.sh` (preflight → kit
rebuild → deploy → live smoke). Bare run rehearses read-only; `--apply`
ships. Ongoing health: `../tools/uptime_probe.sh https://<domain>`.

Companion tools (all local, nothing publishes):
- `../tools/swap_domain.sh <domain>` — the G3 placeholder→domain sweep over
  site/ + deploy/; `--check` verifies zero leftovers, `--revert` restores.
- `../tools/rehearse_host.sh` — exercises the releases/current/retention/
  rollback contract on a local fake host (no SSH needed).
- `../tools/stripe_webhook_fixture.py` — emits a correctly-signed
  `checkout.session.completed` + `Stripe-Signature` header so the game-side
  crediting consumer can be rehearsed before a Stripe account exists.
- `../tools/flip_flags.sh` — the three owner-gated launch switches
  (G4 pricing, G8 analytics endpoint, G12 demo embed) as one command:
  `--set key=value`, `--check` reports, `--revert` restores pre-launch state.
- `../tools/dns_check.sh <domain> [apex-ip]` — read-only verification that
  live DNS matches `dns-records.example` (apex/www/play/stats); runbook step 2.
- `../tools/runofshow.sh` — countdown dashboard: live done/pending status for
  every mechanical §2 run-of-show item (switches, domain swap, DNS, deploy
  env, kit zip). Read-only; `RW_DOMAIN=<domain>` adds the live DNS row.
