# Scale plan — community growth tiers, shrink rules, sunset

**Version:** v144 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §3 (server structure), §4 (moderation),
§9 (day-0/7/30). Sibling specs: `mod-ramp.md`, `incident-comms.md`,
`feed-mirror.md`, `feed-mirror-bot-spec.md`, `server-blueprint.json`.
**Status:** copy-ready; every threshold below is a *planning hypothesis* (same
honesty rule as `funnel-scorecard.md`) — re-set from real counts at the
day-30 retro, never silently.

The blueprint's design rule — "a quiet 40-channel server reads dead; a busy
6-channel server reads alive" — has a missing second half: what happens when
the 6 channels get *too* busy, or when they never do. This file is that half.
It covers growth in both directions plus the one thing a community plan owes
its members: an honest ending.

---

## 1. The stay-small covenant

The funnel does not need a big Discord. Stage 2's job is *belonging and
recap readership*, not headcount — a 200-member server where the recap
thread fills is worth more than a 5,000-member server where `#the-block`
is a scroll-back firehose nobody moderates. So:

- **No growth targets for member count.** `funnel-scorecard.md` tracks
  `discord_members` as a denominator for the active/members ratio, never
  as a goal line. A version of the scorecard that celebrates raw joins is
  a bug — fix the scorecard, not the community.
- **Growth levers we will never pull:** invite contests, member-count
  milestones as marketing copy, "X members strong" badges, paid member
  acquisition, cross-server promo spam. These select for drive-by joins,
  which is exactly the population a 6-channel server can't absorb.
- **Big is a workload, not a win.** Every tier below is defined by
  *moderation load and readability*, not vanity numbers.

## 2. Growth tiers

Tier assignment is a judgment call by the owner using the scorecard's
manual counts — announce tier changes in `#announcements` ("we're
splitting a channel") so growth is legible, never a silent remodel.

### T0 — Launch (day 0 → first steady week)
Blueprint as shipped: 6 public channels + `#mod-log`, owner-only mod team,
manual feed mirror, no slow mode. All triggers below are checked weekly
from the scorecard's manual-counts JSON (`discord_members`,
`discord_active_posters`, `member_initiated_threads`).

### T1 — Busy (trigger: any two of)
- `discord_active_posters` ≥ ~100/wk sustained two scorecard weeks, OR
- `#the-block` regularly scrolls a day's conversation in under an hour
  during peak (owner eyeball — "I missed the morning" becomes routine), OR
- mod actions (warn/timeout/ban rows in `#mod-log`) exceed ~5/wk for two
  consecutive weeks.

Changes at T1 (apply individually as the matching symptom appears — never
remodel pre-emptively):
- **Slow mode** on `#the-block` at 10s during event windows only (watch
  parties, big-request storms). Permanent slow mode is a T2 decision.
- **Channel split #1:** `#clips` traffic that drowns `#the-block` moves
  to forum-style posts — keep the channel, enable Discord forum channels
  inside it rather than adding channels. (Server supports forums once
  Community toggle is on — blueprint already requires it.)
- **Mod ramp early:** `mod-ramp.md` §1's day-14 need check runs *now*
  regardless of the calendar. Mod count scales by **actions, not
  members**: roughly 1 mod per ~10 mod-actions/wk beyond the first 5,
  capped at 3 until T2.
- **Feed mirror load check:** `feed-mirror.md` §5's bot-scaling trigger
  gets re-scored; a T1 server is usually where manual curation starts
  missing entries.

### T2 — Crowded (trigger: any of)
- `discord_members` ≥ ~2,000 with `discord_active_posters` ≥ ~300/wk, OR
- T1 measures applied and `#the-block` is still unreadable at peak, OR
- a raid or pile-on that required incident-comms §3 clocks twice in a
  month (raids scale with visibility — see §4).

Changes at T2:
- **Channel split #2:** `#the-block` splits into `#the-block` (world/feed
  talk) and `#off-the-block` (everything else). This is the *only*
  approved split — every other "we need a channel for X" resolves to a
  forum post or a thread. Channel count is a readability budget, not a
  feature list.
- **Slow mode** becomes a standing tool: 5–10s on `#the-block` during
  recap hour and watch parties, off otherwise.
- **Verification gate:** if raids have occurred, enable Discord's native
  membership screening + a join-delay before posting. This is the "decide
  then" bot from `COMMUNITY-FUNNEL.md` §3 item 4 — decide *at T2*, not
  before, because gates cost real joins.
- **Mods:** up to ~5, still recruited per `mod-ramp.md` (from members,
  never applicants-by-DM). At T2 the `#mod-log` review cadence moves from
  weekly to per-incident.

### T3 — Rethink (trigger: `discord_members` ≥ ~10,000 or T2 measures
insufficient)
Stop and write a new plan — do not improvise channel #9. T3 questions for
the owner: second server vs. forum software vs. "Discord is announcement-
only and the community lives elsewhere." This file deliberately has no
T3 spec: a community that size is a different product, and the honest
move is designing it with the data T0–T2 produced, not guessing now.

## 3. Shrink and quiet — the downward path

Quiet is not failure (a quiet week publishes anyway — the recap rule
applies to the community itself). But two states need written rules:

- **Quiet server** (`discord_active_posters` < ~10/wk for a month):
  consolidate, don't proliferate. Merge nothing — the channels are
  already minimal — but *reduce cadence pressure*: the programming
  calendar's quiet-week fallbacks become the default grid, the request
  clinic pauses until requests exist, and the town hall goes quarterly.
  Never manufacture activity with engagement bait; the feed produces
  the activity or nothing does.
- **Dead server** (~zero active posters for a quarter): the honest move
  is a smaller surface, not a zombie one. Collapse to `#announcements`
  + `#the-feed` read-only (the world keeps running; the recap still
  posts — watchers without chatters is still a working funnel: Stage 1
  never required Stage 2 to be loud). Say so in one announcement, keep
  the server open, revisit at next seasonal beat.

## 4. Raids and pile-ons

Raid response is **not** a scale tier — it can happen at T0 the day a
clip goes viral. The response itself lives in `incident-comms.md`
(holding statements, response clocks, one-voice rule). This file only
owns the *scale decisions raids force*:

- During a raid: slow mode on, verification gate on if available,
  `#mod-log` entries per action — no exceptions for volume.
- After a raid: log it as a T1/T2 trigger input (two raids/month ⇒ T2
  gate decision). A raid is a load signal, not a community failure.
- Never publicize raid counts — "we got raided X times" is engagement
  bait wearing a security costume.

## 5. Sunset — the honest ending

If the product itself winds down (owner decision, never this file's
call), the community gets the same honesty the recaps promised:

1. Announce in `#announcements` + a final recap issue that says what
   happened and when the lights go off — no "pause," no vague "see you
   soon."
2. Keep `#the-feed` mirrored and read-only until the world actually
   stops; a feed that goes dark before the world does is a broken
   promise.
3. Leave the archive (`world/history.json`-conforming) and the recap
   back-catalog linked — the community's record of what it watched is
   the thing worth preserving.
4. Set a real date for the server to go read-only, meet it, and let the
   last word be a recap entry — the block's own format saying goodbye.

## 6. Standing rules (apply at every tier)

- **Lurkers are converted members** (welcome-sequence §1). No tier adds
  a post-to-stay mechanic, an activity purge, or a "react to keep your
  role" gate. The `@regular` program (`regulars-program.md`) is the only
  recognition layer, and it stays opt-in at every scale.
- **Every structural change is announced.** Channels never appear,
  split, or lock silently — the community watches a world where nothing
  is hidden from them; the server runs on the same rule.
- **The blueprint is T0 truth.** `server_blueprint.py --check` validates
  the day-0 server; tier changes past T0 are documented *here*, not by
  editing the blueprint — the blueprint stays the launch contract.
- **Numbers in §2–§3 are hypotheses.** Re-set them at the day-30 retro
  and every quarter after, in writing, in this file — same no-silent-
  goalposts rule as `funnel-scorecard.md` §5.3.
