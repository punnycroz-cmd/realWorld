# deploy/ — launch infrastructure artifacts

Everything here is LOCAL/draft until the owner gates open
(LAUNCH-CHECKLIST G3/G8/G14). No live hosts, keys, or domains exist.

| File | Purpose |
|---|---|
| `Caddyfile` | Recommended host config (VPS + Caddy, auto-TLS). Replace `realworld-game.example` placeholders ×5 incl. CSP `frame-src`/`connect-src`. |
| `netlify.toml` | Zero-ops alternative (Netlify; adaptable to Cloudflare Pages `_headers`). Same headers/CSP. |
| `deploy-site.sh` | rsync → `releases/<ts>` + writes `release.json` (provenance manifest via `../tools/release_manifest.py`) + atomic `current` symlink flip; prints the rollback command and prunes to 5 releases on apply. **Dry-run unless `--apply`.** Needs `RW_DEPLOY_HOST`/`RW_DEPLOY_PATH`. |
| `maintenance.html` | Self-contained 503 page for maintenance mode / full rollback. NOT shipped in `site/`; copy to `/srv/www/realworld/maintenance.html` once during provisioning, enable via the Caddyfile maintenance block. |
| `dns-records.example` | DNS spec: apex + www + `play.` + `stats.` (+ optional mail/verification). |
| `stripe-products.json` | Product/price manifest for Stripe provisioning — numbers = PRICING-PAGE-CONTENT.md §2 (PROPOSAL until G4). |
| `infra.env.example` | Secrets/env inventory. Copy to `infra.env.local` (gitignored) at provisioning; never commit values. |
| `monitoring.example` | Uptime/alert spec: 6 HTTP probes, TLS-expiry alerting, 2-severity routing, per-failure response playbook. Feed to any external monitor, or cron `../tools/uptime_probe.sh` as the self-hosted stopgap. |
| `umami.compose.example` | Self-hosted analytics backend spec (Umami + Postgres) for `stats.<domain>` — matches the Caddyfile `stats.` reverse_proxy block. Fill 2 secrets on the host, `docker compose up -d`, then `../tools/flip_flags.sh --set endpoint=...`. |
| `host-contract.md` | What the VPS must provide (user, layout, caddy, maintenance page) — satisfied by `../tools/bootstrap_host.sh`, also the DR rebuild spec (INFRASTRUCTURE.md §12). |
| `umami-backup.example` | Nightly `pg_dump` cron + restore drill for the self-hosted analytics DB — the one launch artifact git can't reproduce. |
| `traffic-plan.md` | Launch-day traffic & surge plan: load math, the cache-header contract, day-0 probe sequence, severity→action playbook incl. CDN-front flip, bot stance. Companion: `../tools/traffic_probe.sh`. |
| `data-rights.md` | Access/deletion request runbook behind `site/privacy.html`'s `privacy@` promise: intake, proportional verification, per-store data map, 30-day SLA, reply templates. Activates with the G6 mail decision. |
| `secrets-rotation.md` | Rotation & compromise runbook for the `infra.env.example` inventory: per-secret rotate procedure + blast radius + cadence, leak playbook (rotate FIRST, scrub later), quarterly/annual calendar. |
| `incident-postmortem.md` | SEV-1/2 postmortem template + filing convention (`deploy/incidents/YYYY-MM-DD-<slug>.md`, created on first use). The doc that happens after `../tools/incident_drill.sh`'s loop fires for real. |

Post-deploy verification: `../tools/prod_smoke.sh https://<domain>` — the
production counterpart of `staging_dryrun.sh` (LAUNCH-CHECKLIST D0.2);
its §5b provenance check reads the live `/release.json` and compares the
deployed `git_sha` to the local HEAD.

The whole go-session is one command: `../tools/ship.sh` (preflight → kit
rebuild → deploy → live smoke). Bare run rehearses read-only; `--apply`
ships. Ongoing health: `../tools/uptime_probe.sh https://<domain>`.

Companion tools (all local, nothing publishes):
- `../tools/swap_domain.sh <domain>` — the G3 placeholder→domain sweep over
  site/ + deploy/; `--check` verifies zero leftovers, `--revert` restores.
- `../tools/rehearse_host.sh` — exercises the releases/current/retention/
  rollback contract on a local fake host (no SSH needed).
- `../tools/incident_drill.sh` — the detect→rollback→verify loop end-to-end:
  serves a fake host over HTTP, injects a corrupted release, asserts
  `release_manifest.py --verify` + `prod_smoke.sh` catch it, then proves the
  rollback flip restores a green site.
- `../tools/traffic_probe.sh <base>` — traffic readiness: `headers`
  verifies the Caddyfile cache/security contract is actually served,
  `warm` primes caches via sitemap URLs, `load` runs a concurrent-GET
  probe with latency stats. See `traffic-plan.md`.
- `../tools/release_manifest.py` — emits/verifies `release.json`
  (git sha, deploy time, file count, `tree_sha256`); `--verify <dir>`
  re-hashes a deployed release against its own manifest.
- `../tools/stripe_webhook_fixture.py` — emits a correctly-signed
  `checkout.session.completed` + `Stripe-Signature` header so the game-side
  crediting consumer can be rehearsed before a Stripe account exists.
- `../tools/flip_flags.sh` — the three owner-gated launch switches
  (G4 pricing, G8 analytics endpoint, G12 demo embed) as one command:
  `--set key=value`, `--check` reports, `--revert` restores pre-launch state.
- `../tools/dns_check.sh <domain> [apex-ip]` — read-only verification that
  live DNS matches `dns-records.example` (apex/www/play/stats); runbook step 2.
- `../tools/bootstrap_host.sh` — first-time host prep as code: bare = plan,
  `--emit` writes the reviewed-as-root provision script, `--apply` provisions
  over SSH (`RW_BOOTSTRAP_HOST=root@<ip>`), `--check` verifies a live host
  against `host-contract.md`, `--check-local` rehearses the FS layout.
- `../tools/runofshow.sh` — countdown dashboard: live done/pending status for
  every mechanical §2 run-of-show item (switches, domain swap, DNS, deploy
  env, kit zip). Read-only; `RW_DOMAIN=<domain>` adds the live DNS row.
- `../tools/backup_verify.sh` — proves a `umami-*.sql.gz` is a real pg_dump
  (gzip integrity, dump header, core Umami tables, row payload) without
  docker/Postgres; `latest <dir> [h]` also checks the newest dump is fresh —
  pair it with the `umami-backup.example` cron so a hollow backup mails the
  owner instead of failing silently for 30 days.
- `../tools/infra_audit.sh` — doc-drift audit for this directory +
  `INFRASTRUCTURE.md`: every cited path exists and is executable, every
  `deploy/` artifact is documented, page-count claims match `site/`, the §7
  header contract holds in BOTH host configs, env vars are defined, and no
  key-shaped strings leak. Run after any infra-doc or deploy/ edit.
