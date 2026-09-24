# Funnel scorecard — weekly community-funnel measurement

**Version:** v54 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §1 (stages), `ANALYTICS.md` §7/§8.
**Tool:** `marketing/tools/funnel_scorecard.py` — computes this scorecard
from an `events.ndjson` capture plus a small manual-counts JSON.
**Honesty note:** every target below is a *planning hypothesis*, not a
promise and not a researched benchmark. They exist so week-over-week
movement has something to be compared against. The day-30 retro
(`COMMUNITY-FUNNEL.md` §9, `community/first-100.md` §5) is where targets
get re-set from real data — do not "defend" a target the data rejects.

---

## 1. What the scorecard measures

The funnel (`COMMUNITY-FUNNEL.md` §1) as six countable stages:

```
pageview → engaged → community → watch_start → request_submitted → character_created
```

Stage membership is session-joined on `sid` (per-tab nonce — counts are
*session* counts, not unique humans; see `ANALYTICS.md` §1 for the
daily-unique caveat). Event→stage mapping is identical to
`tools/analytics_report.py` — the two tools must never disagree:

| Stage | Events that count |
|---|---|
| pageview | `pageview` |
| engaged | `cta_click`, `scroll_depth`, `screenshot_view`, `share_click`, `price_calc`, `request_simulated` |
| community | `community_join`, `recap_open`, `watch_party_rsvp` |
| watch_start | `watch_start` (game embed emits at first feed render) |
| request_submitted | `request_submitted` |
| character_created | `character_created` |

A session is "at" a stage if it emitted any event in that stage's set.
Conversion is computed between *consecutive* stages only — the funnel is
not strictly ordered in real use (a watcher can join Discord before ever
scrolling features), so each ratio is "of sessions that reached stage N,
how many also reached stage N+1", not a waterfall claim.

## 2. Stage targets (planning hypotheses, launch month)

| Transition | Target | Rationale |
|---|---|---|
| pageview → engaged | ≥ 40% | Real captures + free watch are the hook; below this the landing copy is failing |
| engaged → community | ≥ 12% | community.html + recap CTAs sit mid-funnel; the offer must read as a next step, not a detour |
| community → watch_start | ≥ 50% | Joining for the feed means watching the feed; a big miss = joins for the wrong reason |
| watch_start → request_submitted | ≥ 10% | Market report §3: the ask must feel like directing, not ticketing. This is the existential number |
| request_submitted → character_created | ≥ 20% | A paying requester who won't commit a character is a pricing/product signal, not a funnel bug |
| engaged → watch_start (site-only) | ≥ 25% | demo page conversion — the free front door |

**Reading rule:** a missed target is a *question*, never a verdict. Note
which segment broke (source, page, device) in the weekly metrics report
before proposing fixes. Two consecutive red weeks on one transition =
escalate to a named fix proposal in the recap/retro, not a quiet tweak.

## 3. Community-health rows (manual counts, same report)

The events file can't see inside Discord. Each week the owner records
three numbers in a JSON file (shape below) and the scorecard prints them
alongside the computed rows:

```json
{
  "week": "2026-W40",
  "discord_members": 87,
  "discord_active_posters": 14,
  "member_initiated_threads": 9,
  "watch_party_rsvps": 11,
  "recap_mentions_of_members": 2,
  "calls_posted": 8,
  "calls_resolved": 5,
  "repeat_callers": 3
}
```

| Metric | Healthy signal | Source |
|---|---|---|
| `discord_active_posters` / `discord_members` | ≥ 15–25% at launch scale | `first-100.md` §2 |
| `member_initiated_threads` (in `#the-feed`) | trending up; ≥1 unprompted thread/wk by W2 | `first-100.md` §2 W2–3 row |
| `watch_party_rsvps` | >0 within first month; qualifies event per playbook §1 | `watch-party-playbook.md` |
| `recap_mentions_of_members` | ≥1/wk once members exist — the cheapest retention mechanic | `first-100.md` §3, funnel §7.4 |
| `repeat_callers` (calls ritual) | >0 by W2; trending up — community-side proxy for the return-visit metric until `prediction_made`/`outcome_inspected` ship | `prediction-ledger.md` §5 |

Anti-vanity rule (unchanged): member count is reported *only* as the
denominator of the activity ratio. Never headline the raw number
(`first-100.md` §4).

## 4. Running it

```bash
# events only (pre-launch / site-only weeks)
python3 marketing/tools/funnel_scorecard.py marketing/analytics/sample-events.ndjson

# with the manual Discord counts
python3 marketing/tools/funnel_scorecard.py events.ndjson --counts community/counts/2026-W40.json

# week filter + json for the metrics archive
python3 marketing/tools/funnel_scorecard.py events.ndjson --week 2026-W40 --json
```

Output is a paste-ready markdown block for the weekly metrics report
(`ANALYTICS.md` §8): stage table, conversion vs. target, health rows,
and a verdict line per red transition. `--json` emits the same data
machine-readable for a future dashboard.

## 5. Where results go

1. Weekly metrics report block → `ANALYTICS.md` §8 template → appended
   to the marketing log.
2. Any red transition two weeks running → named fix proposal in the
   day-30 retro or an immediate `## [marketing-community]` inbox note if
   it's clearly a product bug (e.g., watch→request collapses after a
   request-flow change — route to game-systems).
3. Target revisions happen *only* at retro, in writing, with the old
   target kept in the log — no silent goalpost moves.
