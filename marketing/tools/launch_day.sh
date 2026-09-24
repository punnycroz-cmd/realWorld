#!/usr/bin/env bash
# launch_day.sh — "where am I on launch day?" — live status for every item in
# LAUNCH-CHECKLIST §3 (D0.1–D0.10), the day-0 companion to runofshow.sh
# (which covers §2's T-minus countdown).
#
# READ-ONLY: it inspects the worktree and reports; it never flips a switch,
# never deploys, never posts. The ONLY network access is OPTIONAL live smoke/
# probe rows when RW_DOMAIN is set to a real (non-placeholder) domain.
#
# Usage:
#   ./tools/launch_day.sh                       # status of every day-0 item
#   RW_DOMAIN=example.com ./tools/launch_day.sh # + live smoke/probe rows
#
# Exit 0 always (this is a dashboard, not a gate — preflight/gonogo gate).
set -u
cd "$(dirname "$0")/.."
SITE="site"
GREEN=0; PEND=0

g() { GREEN=$((GREEN+1)); printf '  [done]    %s\n' "$1"; }
p() { PEND=$((PEND+1));  printf '  [pending] %s\n' "$1"; }
i() {                    printf '  [info]    %s\n' "$1"; }

LIVE_DOMAIN=0
if [ -n "${RW_DOMAIN:-}" ] && [ "${RW_DOMAIN:-}" != "realworld-game.example" ]; then
  LIVE_DOMAIN=1
fi

echo "=== Real World LAUNCH DAY — $(date '+%Y-%m-%d %H:%M %Z') ==="
echo "    live status vs LAUNCH-CHECKLIST §3 — read-only"
echo
echo "Deploy & verify"
# D0.1 — deploy to production
if [ -n "${RW_DEPLOY_HOST:-}" ] && [ -n "${RW_DEPLOY_PATH:-}" ] && [ "$LIVE_DOMAIN" -eq 1 ]; then
  g "D0.1 deploy ready — ship.sh --apply has host+path+domain ($RW_DOMAIN)"
else
  p "D0.1 deploy — needs RW_DEPLOY_HOST/RW_DEPLOY_PATH + RW_DOMAIN (infra.env.example); run ./tools/ship.sh --apply"
fi
# D0.2 — production smoke
if [ "$LIVE_DOMAIN" -eq 1 ]; then
  OUT=$(./tools/prod_smoke.sh "https://$RW_DOMAIN" 2>/dev/null)
  FAILS=$(printf '%s' "$OUT" | grep -c 'FAIL' || true)
  if [ "$FAILS" -eq 0 ]; then
    g "D0.2 prod_smoke https://$RW_DOMAIN — 0 fail"
  else
    p "D0.2 prod_smoke https://$RW_DOMAIN — $FAILS FAIL row(s): ./tools/prod_smoke.sh https://$RW_DOMAIN"
  fi
else
  i "D0.2 prod smoke — set RW_DOMAIN=<domain> to run prod_smoke.sh live"
fi
echo
echo "Copy & embed flips"
# D0.3 — launch-copy flip (the 'pre-launch draft site' footer on every page)
DRAFT=$(grep -rl 'pre-launch draft site' "$SITE"/*.html 2>/dev/null | wc -l)
if [ "$DRAFT" -eq 0 ]; then
  g "D0.3 launch copy live — no 'pre-launch draft site' footers remain"
else
  p "D0.3 launch copy — $DRAFT page(s) still carry the 'pre-launch draft site' footer"
fi
# D0.3b — demo embed flip
DEMO=$(grep -oE 'data-demo-src="[^"]*"' "$SITE/demo.html" | head -1 | cut -d'"' -f2)
if [ -n "$DEMO" ]; then
  g "D0.3b demo embed -> $DEMO — confirm watch_start fires mode:live + feed labels (G15)"
else
  p "D0.3b demo flip — ./tools/flip_flags.sh --set demo=<spectator-url> (gated on G12+G15)"
fi
# D0.4 — sitemap submit (owner accounts — always a human row)
p "D0.4 sitemap submit — Search Console + Bing Webmaster (owner accounts; sitemap.xml is valid per dry-run)"
echo
echo "Announce sequence — spacing ≥20 min so any post can be pulled alone"
# D0.5–D0.8 — staged drafts
[ -f social/drafts/launch-thread.md ] && g "D0.5 launch devlog drafted (social/drafts/launch-thread.md)" \
                                     || p "D0.5 launch devlog draft missing"
[ -f SOCIAL-LAUNCH-PLAN.md ] && g "D0.6 channel posts staged per SOCIAL-LAUNCH-PLAN.md timeline" \
                             || p "D0.6 SOCIAL-LAUNCH-PLAN.md missing"
if [ -f PRESS-OUTREACH.md ] && [ -f dist/real-world-press-kit.zip ]; then
  g "D0.7 press kit + pitch angles staged (PRESS-OUTREACH.md, dist zip)"
elif [ -f PRESS-OUTREACH.md ]; then
  p "D0.7 pitch angles ready but dist zip missing — ./build-press-kit.sh"
else
  p "D0.7 PRESS-OUTREACH.md missing"
fi
[ -f social/drafts/seeded-questions.md ] && g "D0.8 community seeds drafted (seeded-questions.md)" \
                                         || p "D0.8 seeded-questions.md missing"
# D0.8b — community surfaces open
if grep -q 'open at launch\|opens at launch\|opens on launch' "$SITE/community.html" 2>/dev/null; then
  p "D0.8b community — community.html still says 'open at launch'; swap real invite link after Discord is live (G11/G13)"
else
  g "D0.8b community.html invite link swapped"
fi
echo
echo "Monitor & close"
# D0.9 — monitoring
if [ "$LIVE_DOMAIN" -eq 1 ]; then
  if ./tools/uptime_probe.sh "https://$RW_DOMAIN" >/dev/null 2>&1; then
    g "D0.9 uptime probe HEALTHY vs https://$RW_DOMAIN — funnel events still owner-verified"
  else
    p "D0.9 uptime probe not HEALTHY — ./tools/uptime_probe.sh https://$RW_DOMAIN"
  fi
else
  p "D0.9 monitoring — set RW_DOMAIN=<domain> for probe row; funnel review is human (ANALYTICS.md)"
fi
# D0.10 — retro note is a human row
p "D0.10 same-day retro → MARKETINGLOG.md + shared inbox (human row)"
echo
echo "=== $GREEN done / $PEND pending ==="
echo "REMEMBER: D0.5–D0.8 carry built-in abort points — if anything breaks,"
echo "stop posting, run the matching §5 rollback row, pick the incident-comms"
echo "draft whose claims are true (social/drafts/incident-comms.md)."
exit 0
