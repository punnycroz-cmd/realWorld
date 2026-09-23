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

Post-deploy verification: `../tools/prod_smoke.sh https://<domain>` — the
production counterpart of `staging_dryrun.sh` (LAUNCH-CHECKLIST D0.2).
