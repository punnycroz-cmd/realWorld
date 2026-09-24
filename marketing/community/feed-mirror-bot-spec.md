# Feed-mirror bot — post-launch spec (not a launch dependency)

**Version:** v99 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `community/feed-mirror.md` (manual mirror — §1 filters, §2
format, §5 bot trigger), `COMMUNITY-FUNNEL.md` §8 (last SPEC row — this file
closes it as *designed*, still OWNER-GATED to build).
**Status:** DESIGN COMPLETE · build is OWNER-GATED and blocked on the
§5 trigger — do not write this bot before both conditions hold.

The manual `#the-feed` mirror is right at launch because curation judgment is
the feature. This spec exists so that when volume forces automation, the bot
is built once, correctly, and never becomes a firehose.

---

## 1. Activation gate (both must hold, per feed-mirror.md §5)

- Notable entries (per §1 filters) consistently exceed ~4/day for a week
  straight — the cap is binding, not theoretical, AND
- the live feed emits `world/feed.json`-conforming entries in production
  (game build), not the demo seeds.

Until both hold, manual stays. A bot that mirrors everything is worse than
a human who mirrors nothing.

## 2. Source contract

- Poll the production feed endpoint (same `feed.json` schema the recap and
  wire archive already consume): stable `id`, `kind`, `status`, `class`,
  `who`/`attribution`, `text`, `venue`, `ts`. Poll interval 5 min; the feed
  is not a race — nobody notices a 5-minute-old mirror post.
- **Dedup on stable event id** — keep a local seen-ids file; never mirror
  the same id twice, including across restarts.
- **Status latch:** mirror only terminal/approved states — `approved`,
  `scheduled`, `executed`, `denied`, `refunded`, `expired`. Never mirror
  `pending`/mid-review entries (feed-mirror.md §1: announce only once
  approved-and-scheduled). If an entry's status later changes
  (approved → executed), post a *new* line referencing the first — never
  edit the old post; the channel is a record (feed-mirror.md §4).

## 3. Filter implementation (= §1 as code)

Whitelist, not blacklist — the bot implements the *triggers*, silently
dropping everything else:

| Code trigger | §1 source |
|---|---|
| `class == "exclusive"` AND `status == approved|scheduled` | exclusive approved/scheduled |
| `kind == "weather"` or `class == "sky"` | weather/sky lands |
| `status == denied` OR `approved-modified` flag | denial/approval-modified worth showing |
| first-seen flags (`first_community_request`, etc.) if the feed exposes them; else the human posts firsts by hand | firsts |
| watch-party-qualifying flag → also emits the playbook hand-off line | watch-party trigger |

Plus the hard guards §1 demands:

- **Secrets guard:** if an entry carries any field outside the public-feed
  schema (bible references, `want`/`interior`/`truth`-shaped fields), drop
  it and log — never mirror.
- **Display filter before post:** request text passes through the same
  display-side filter the public feed uses (profanity/PII/hate — the §4.2
  owner decision governs redact-vs-withhold; the bot inherits whichever
  the feed already applies and adds nothing new).
- **Daily cap:** 4 posts/day, same as manual. If the cap binds, hold a
  ranked queue (weather > exclusive > denial > other) and post the top 4
  at spacing ≥ 90 min; overflow rolls to tomorrow or dies — silence is
  honest.

## 4. Post format

Identical to feed-mirror.md §2, verbatim:

```
📡 <status label> · <class> · <attribution>
<one-line factual summary>
<optional one-line context>
```

- Status labels come from `world/feed.json` `request_status` vocabulary —
  never paraphrased (G15 contract).
- Attribution always shown exactly as the feed shows it.
- The bot adds ONE machine line the manual posts don't carry: the feed
  event's stable id (as footer text, e.g. `archive: e-2026-10-04-0317`),
  so members can pull the full record in `wire-archive.html`. Deep-link
  when the archive exposes `#e=<id>` anchors; plain text id until then.
- No emoji-poll bait, ever. Discussion happens in `#the-block`.

## 5. Failure modes & kill switch

| Failure | Behavior |
|---|---|
| Feed endpoint down/stale | Post nothing. Staleness > 30 min → log only, no "feed is down" post (channel is a record, not a status page) |
| Schema drift (missing `status`/`id`) | Stop mirroring, log, require human restart — never guess at a new shape |
| Posting error (rate limit, perms) | Retry once after 10 min, then drop the entry and log |
| Owner revoke / abuse wave | `BOT OFF` — a single env/flag the owner flips; the manual mirror is the fallback and this spec never removes it |
| Screened-text regression upstream | Post withheld by display filter counts toward the 4/day cap (a withheld post is still a decision, not a free retry) |

## 6. Rollout (when built)

1. **Shadow week:** bot drafts to a private channel/`#mod-log`; owner
   compares drafts against what they would have hand-picked. ≥ 80%
   agreement on pick/skip before any public post.
2. **Supervised week:** bot posts publicly; every post gets a human
   eyeball within the hour for the first 7 days.
3. **Steady state:** owner spot-checks weekly; the mod team can always
   post manual lines alongside (a great human-curated line beats the bot's
   queue position).
4. The approval gate (FUNNEL §4.1) applies to the *context line* wording
   — keep a fixed, pre-approved context-line vocabulary ("First exclusive
   anyone's filed.", "Screened, not staged.") rather than free-generation.

## 7. Explicit non-goals

- Not a recap bot — the weekly recap stays `tools/build_recap.py` + human
  edit (§5a).
- Not a two-way bot — no commands, no replies, no DMs. It only posts.
- Not analytics — do not add tracking to `#the-feed` (feed-mirror.md §6).
- Not real-time — 5-min polling is a feature; a sub-second mirror would
  make Discord a competing UI instead of a community surface.
