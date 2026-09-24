# secrets-rotation.md — rotation & compromise runbook

Companion to `infra.env.example` (the inventory) and INFRASTRUCTURE.md §9.
That file lists WHAT the secrets are; this one is the HOW — per-secret
rotation procedure, blast radius if it leaks, and the compromise playbook.
All LOCAL/draft until provisioning (G14); nothing here is live.

**The one rule that outranks everything else:** when a secret is suspected
compromised, ROTATE FIRST, investigate second. Rotation is minutes;
a leaked Stripe key or SSH key is not. The investigation happens on the
old key's corpse.

## 1. Per-secret rotation table

| Secret | Lives in | Rotate by | If leaked | Cadence |
|---|---|---|---|---|
| Deploy SSH key (`RW_DEPLOY_HOST`'s keypair) | owner's `~/.ssh`, host `authorized_keys` | generate new pair; add pubkey to `deploy` user's `authorized_keys`; verify `deploy-site.sh --apply` once; remove old key | full host write access — assume releases tampered; rebuild host per INFRASTRUCTURE.md §12 if any sign of use | on suspicion, or annually |
| `STRIPE_SECRET_KEY` | game backend env | Stripe Dashboard → Developers → API keys → roll key (old key dies on YOUR schedule — roll it, update game env, then expire the old one) | full account control incl. refunds/payouts — call Stripe support + roll immediately | annually; on any repo/log sighting, immediately |
| `STRIPE_WEBHOOK_SECRET` | game backend env | Dashboard → Webhooks → endpoint → roll signing secret; update game env | forged `checkout.session.completed` = free credits — roll + audit the credit ledger for forged grants | annually; on suspicion immediately |
| `STRIPE_PUBLISHABLE_KEY` | public by design | n/a — not a secret; rotate only as a side-effect of secret-key roll | none (publishable) | with secret-key roll |
| `RW_ANALYTICS_DB_URL` (self-hosted Umami) | host env / compose file | reset Postgres role password; update compose; `docker compose up -d` | funnel data read/write — private but low-toxicity; rotate + review access logs | annually |
| Umami admin login | Umami DB | change in dashboard | dashboard defacement only | annually |
| Uptime monitor token/webhook | monitor service + cron env | rotate in the monitor's settings; update cron env | alert spam/suppression — rotate + verify probes still fire (test alert) | annually |
| Registrar / DNS account | the registrar | password + 2FA reset; confirm registrar lock still on | the worst case — domain theft takes days to recover; enable lock + 2FA at registration (INFRASTRUCTURE.md §2) | password annually; review locks quarterly |
| `RW_ANALYTICS_ENDPOINT` | public `data-endpoint` attribute | not secret — flip via `tools/flip_flags.sh --set endpoint=` | none (public URL) | n/a |

## 2. Compromise playbook (key-shaped thing in a bad place)

Ordered. Steps 1–3 are minutes; do not skip ahead.

1. **Rotate the credential** at its issuer (table above). The leaked copy is
   dead weight the moment the issuer forgets it.
2. **Verify the new one works** — e.g. `deploy-site.sh` dry-run for SSH,
   `tools/stripe_webhook_fixture.py` round-trip for the webhook secret.
3. **Audit the exposure window** — Stripe Dashboard event log (charges,
   refunds, webhook deliveries), host `~deploy/.ssh/authorized_keys` +
   `journalctl -u ssh`, Umami access logs. What did the key touch while live?
4. **Then clean the leak.** If it hit git: the commit history still carries
   it — history scrubbing (filter-repo / BFG) is cosmetic and can wait;
   it NEVER substitutes for step 1. If it hit logs, rotate anyway — logs
   get copied places you forget.
5. **File the postmortem** — `deploy/incident-postmortem.md` template;
   the severity is SEV-1 per LAUNCH-CHECKLIST §5's ladder if the secret
   granted write/payment capability, SEV-2 otherwise.
6. **Add the detector** — preflight's secret scan covers `site/`+`deploy/`;
   if the leak path was elsewhere (CI log, screenshot, chat paste), write
   it down so the same path can't leak the NEXT secret.

## 3. Cadence calendar

- **Annually:** every table row marked "annually" — one sitting, ~1 h.
  Suggested anchor: launch-date anniversary, run alongside the day-30-style
  ops review.
- **Quarterly:** registrar lock/2FA review; confirm `tools/preflight.sh`
  secret scan still exits clean on the live tree.
- **On suspicion:** the relevant row, immediately, no meeting.
- **On personnel/contractor change:** deploy key + any shared admin
  credential — same day.

## 4. What is deliberately NOT here

- No secret VALUES (ever — `infra.env.example` is the inventory, values
  live in the owner's password manager / host env).
- No game-backend secrets beyond the Stripe three — the game track owns
  its own inventory; this file covers what the marketing surface touches
  or depends on (§9 of INFRASTRUCTURE.md).
- No automated rotation scripts — every rotation is an owner action at an
  issuer dashboard or over SSH; automating it would need the very secrets
  this file refuses to store.
