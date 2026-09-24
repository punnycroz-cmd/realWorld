# traffic-plan.md — launch-day traffic & surge plan

Everything here is LOCAL/draft until the owner gates open (LAUNCH-CHECKLIST
G3/G8/G14). No live hosts, keys, or domains exist. Companion tool:
`../tools/traffic_probe.sh` (headers / warm / load modes).

## 1. What launch day actually sends us

The marketing site is static, ~small MB total, and deliberately boring —
the load question is "how many GETs," not "can the app scale."

| Driver | Expected shape | Site cost |
|---|---|---|
| Announce posts (devlog → channels → press, spaced ≥20 min per checklist §3) | 3–5 stepped bursts, each decaying over ~hours | page views only |
| OG-card unfurls (every link pasted anywhere) | crawler hits on `og:image` + page HTML | 1 image + 1 HTML per share |
| Search + direct | long tail | trivial |
| The game itself | **not our problem** — spectator traffic lives on `play.`, game track owns that origin and its scaling (INFRASTRUCTURE.md §2) | none |

Order-of-magnitude planning number: a front-page HN/Reddit moment is
~10–50k page views on day 0. At ~500 KB–1 MB per first view (hero shots
dominate) that is **5–50 GB egress, <1 request/ms average, ~10–100 req/s
at burst peak**. A single VPS + Caddy serves this from disk cache without
trying; the free-tier static hosts (Pages/Netlify) eat it for breakfast.
The failure modes that matter are *not* capacity — they are config
(cache headers wrong, TLS rate-limit, origin down) and the one real
capacity scenario (a sustained >100 req/s hot-linking or scraper wave
on the VPS path).

## 2. The cache contract (what must be true before T-0)

`deploy/Caddyfile` sets: assets/shots `max-age=86400`, HTML `max-age=300`,
sitemap `max-age=3600`, `encode zstd gzip`, security headers on `/`.
Pages/Netlify equivalents live in `netlify.toml`. Verify on the LIVE
origin — not by reading the config:

```sh
./tools/traffic_probe.sh headers https://<domain>   # all PASS, 0 FAIL
```

This is a D0.2 follow-up to `prod_smoke.sh` (which checks header
*presence* on `/` only); traffic_probe checks the *values* per asset
class, including a real `/shots/*.webp` file and gzip negotiation.

## 3. Day-0 sequence (slots into checklist §3)

| When | Action |
|---|---|
| T-2h, right after D0.2 smoke | `traffic_probe.sh headers https://<domain>` — cache contract green |
| T-2h | `traffic_probe.sh warm https://<domain>` — GET all 20 sitemap URLs; primes host/CDN cache so first real visitors never hit a cold disk |
| T-2h | `traffic_probe.sh load https://<domain> 16 80` — expect 80/80 200s, p95 well under 1 s; a bad number here is an abort-pair candidate with the §5 ladder |
| Each announce burst (T-0, +20m, +40m…) | `uptime_probe.sh` between posts; latency creep = see §4 |
| T+24h | re-run `headers` — confirms nobody "fixed" cache config mid-day |

## 4. Surge playbook (severity → action)

Trigger inputs: `uptime_probe.sh` / external monitor (monitoring.example),
`traffic_probe.sh load` re-runs, host `journalctl -u caddy`.

| Symptom | Severity | Action |
|---|---|---|
| p95 > 2 s but all 200s | S2 | warm again; check if one asset (hero webp) is hot — consider CDN-front (below) |
| non-200s in load probe, site up in browser | S2 | `caddy reload`; check `journalctl -u caddy` for fd/memory limits |
| Site down / 5xx > 5 min | S1 | checklist §5: maintenance mode (Caddyfile maintenance block) — already rehearsed in `incident_drill.sh` |
| Sustained scraper/hot-link wave (>100 req/s, few URLs, junk UA) | S2 | CDN-front absorbs it (below); on Pages/Netlify path this is their problem, not ours |
| TLS expiry alert | S2 | monitoring.example playbook — LE rate-limit/firewall check, don't wait |

**CDN-front procedure (VPS path only):** if DNS is at Cloudflare
(dns-records.example option A), flip the apex/`www` records from
"DNS only" to "Proxied" — ~2 min, no code change, cache rules already
correct because the contract above was verified pre-flip. Keep `play.`
and `stats.` DNS-only (they're app origins, not static). Revert = flip
back. If DNS is registrar-only, the equivalent is a planned provider
change — do it as a day-2 task, not mid-incident.

## 5. Bot/scraper stance

- `robots.txt` + `llms.txt` already publish the crawl policy; legitimate
  crawlers are *wanted* (SEO-PLAN is built on organic).
- No rate limiting on the site — static GETs are cheap and limits risk
  blocking OG unfurls during the exact burst we want (INFRASTRUCTURE.md
  §7 already reasons this for the game API boundary).
- AI-crawler posture: allowed; `llms.txt` is the welcome mat. If a
  single UA ever dominates, CDN-front (§4) is the answer — do not add
  UA-blocking rules on launch day; log and decide day-2.

## 6. Rehearsal record

- `traffic_probe.sh` vs local `python3 -m http.server` staging
  (2026-09-23, v134): warm 20/20 PASS (all sitemap URLs), load 80/80
  200s conc=16 (avg 14 ms, p95 ~37 ms — localhost numbers, correctness
  signal only), headers correctly WARNs 10/10 on a bare static server —
  proving the check is bound to the Caddyfile contract, not to "any
  HTTP 200." Full green run expected only behind real Caddy config.
