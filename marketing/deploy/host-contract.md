# Host contract — what `deploy-site.sh` requires of the VPS

Everything `deploy/deploy-site.sh`, `tools/ship.sh`, the Caddyfile, and the
rollback runbook assume about the production host, in one place. Satisfied by
`tools/bootstrap_host.sh --apply` on a fresh Debian/Ubuntu VPS, or by hand on
any equivalent box.

## Required

| Requirement | Why | Verified by |
|---|---|---|
| SSH reachability as `deploy` user (key auth) | rsync/ssh deploys; no passwords | `bootstrap_host.sh --check` |
| `${RW_DEPLOY_PATH}` = `/srv/www/realworld` containing `releases/` writable by `deploy` | one dir per deploy, never mutate live | `--check` / `--check-local` |
| `current` symlink inside the path | atomic live-flip; Caddyfile `root` points at it | `--check` / `--check-local` |
| `maintenance.html` staged at the path root (outside `releases/`) | rollback/maintenance mode — must survive release pruning | `--check` / `--check-local` |
| `rsync` installed | deploy transport | `--check` (remote) |
| `caddy` installed + systemd | auto-TLS, headers, `current` root | `--check` (remote) |

## Provisioned by bootstrap (policy, not contract)

- `ufw`: allow OpenSSH + 80 + 443 only.
- `unattended-upgrades`: enabled — the box is single-purpose.
- `deploy` user: key-only; owner adds their pubkey to
  `/home/deploy/.ssh/authorized_keys` after bootstrap.
- Caddyfile installed at `/etc/caddy/Caddyfile` + `systemctl reload caddy`
  (kept manual on purpose — TLS issuance should be a deliberate, watched step).

## Explicitly NOT on this host

- No secrets in the repo or on disk beyond Caddy config; Stripe keys live
  game-side (INFRASTRUCTURE.md §9).
- No databases, no game process. `play.`/`stats.` may reverse-proxy to other
  ports/boxes (Caddyfile optional blocks) but the site itself stays static.
- No internal tools leak in — deploy rsyncs `site/` only; the never-ship
  surfaces (drama/playtest boards) stay off this host (INFRASTRUCTURE.md §3.7).

## Rebuild = re-provision (disaster recovery)

Host loss is not a restore problem — the site is stateless. Full DR runbook:
INFRASTRUCTURE.md §12. Short version: new VPS → `bootstrap_host.sh --apply` →
DNS repoint (or keep DNS, same IP class) → `deploy-site.sh --apply` →
`prod_smoke.sh`. Releases older than the host's 5-release window are
reproduced by redeploying a git tag; provenance is in every `release.json`.
