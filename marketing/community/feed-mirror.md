# The feed mirror — `#the-feed` manual curation spec

**Version:** v69 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §3 (channel), §5 (cadence/honesty),
`watch-party-playbook.md` §1 (what counts as a beat).
**Status:** copy-ready; OWNER-GATED until the server exists. Launch
dependency — `LAUNCH-CHECKLIST.md` D0.8b starts this mirror on day-0.

`#the-feed` is a **read-only mirror of notable public request-feed entries**,
curated by hand at launch. It is the channel where watchers learn the
vocabulary and learn to talk about *who did what*. It is not a firehose —
if every feed line were mirrored, the channel would be the product's UI
duplicated badly. This spec defines what gets mirrored, in what words, and
when the manual approach has outgrown itself.

---

## 1. What gets mirrored (selection criteria)

Mirror an entry when **one or more** apply:

| Trigger | Why |
|---|---|
| An **exclusive** request is approved and scheduled | Scarce, legible, starts arguments — the good kind |
| A **weather/sky** request lands | Everyone sees it; the most watchable class |
| A request is **denied or approved-modified** in a way worth showing | Proof the screen is real; "screened, not staged" is the brand |
| A **firsts** moment — first community-filed request, first exclusive, first refund | History is content; celebrate events, never population |
| A resident beat the recap will headline | Seeds Sunday's recap discussion |
| A **watch-party-qualifying** entry | Also triggers `watch-party-playbook.md` §2 |

Do **not** mirror:

- Routine compatible requests below the interest bar — they exist in volume;
  the mirror would become noise. Exception: a *clever* cheap request that
  demonstrates the compatible class to newcomers.
- Anything **mid-review** that might still be denied — announce only once
  approved-and-scheduled (same rule as watch parties). A denied request may
  be mirrored *after* the denial is final, as content.
- Anything that requires bible secrets or drama seeds to explain
  (design §7 — secrets stay sealed; recap rules apply verbatim).
- Admin/owner actions presented as player requests. If it's ours, say so.

**Cadence cap:** at most ~4 mirror posts/day. A slow day mirrors nothing —
silence is honest. If the feed produces more than 4 genuinely notable
entries/day for a week straight, that's the bot trigger (§5).

## 2. Post format (verbatim rules)

Every mirror post follows the same shape — the feed vocabulary is the
contract (G15: `world/feed.json` `request_status` is canonical; use its
labels, never paraphrases like "banned" or "zapped"):

```
📡 <status label> · <class> · <attribution>
<one-line factual summary of the request text / outcome>
<optional one-line context — why this one is interesting>
```

Worked examples (illustrative, pre-launch):

```
📡 approved · exclusive · @mara
Private set at El Farolote, Friday 8pm — venue locked for the evening.
First exclusive anyone's filed. #watch-party material?
```

```
📡 denied · compatible · @june_
Requested a scene naming a real street address. Refunded in full.
Reminder: fiction stays on fictional doors (rules #2).
```

```
📡 queued · compatible · @dev-team
Karl the Fog over Dolores Park tomorrow 9–11am (−15% for queuing).
Ours — testing the sky-lock path in the open.
```

Rules:

- **Attribution always.** The feed is attributed; the mirror never strips
  the handle. If the live feed ever shows anonymous attributions, mirror
  them as shown, not guessed.
- **Quote the feed, don't embellish it.** One line of context max, and it
  must be analysis ("first exclusive"), not invented narrative ("she's
  planning a showdown" — unless the feed says so).
- **Resident names from the public record only** — cast-bible public
  profiles, `cast.html` facts. Never want/interior/truth fields beyond what
  the feed itself displayed.
- No emoji-poll engagement bait ("react 🔥 if you'd have filed this").
  Discussion is welcome; we don't farm it.

## 3. Sourcing posts (the daily routine)

At launch the owner runs this once or twice a day, ~5 minutes:

1. Read the public feed (`demo.html` embed when live; the world track's
   `feed.html`/`feed.json` contract meanwhile).
2. Pick entries against §1. When in doubt, skip — under-mirroring is a
   quiet channel, over-mirroring is a dead one.
3. Paste the §2 format into `#the-feed`. No scheduling tool needed.
4. If an entry qualifies as a watch party, hand off to
   `watch-party-playbook.md` §2 — the mirror post doubles as the T−24h
   announcement's source line.

The weekly recap (`tools/build_recap.py`) is independent of the mirror —
it reads the archive, not the channel. The mirror is for *today*; the
recap is for *the week*. Don't let one substitute for the other.

## 4. Member interaction rules

- `#the-feed` is **read-only for members** (Discord permissions: members
  can read, owner/mods post). Discussion happens in `#the-block` — a
  mirror post can end with "discuss in #the-block" when it's a big one.
- If a mirrored entry draws harassment at the filing member, that's a
  §4.1 community-moderation event (ladder: warn → timeout → ban), not a
  feed problem — the attribution stays public by design.
- Never edit a mirror post to soften a denial after discussion starts.
  Post a correction line instead — the channel is a record.

## 5. When manual stops scaling (bot trigger)

Mirror-by-hand is right at launch because curation judgment *is* the
feature. Automate only when **both** are true:

- notable entries consistently exceed ~4/day (the cap is binding, not
  theoretical), AND
- the live feed has a stable machine-readable source (game build emits
  `feed.json`-conforming entries in production — not the demo seeds).

A future bot must implement §1's *filters*, not just repost: status/class
whitelist, mid-review hold, secrets guard, daily cap. Until that exists,
manual stays. A bot that mirrors everything is worse than a human who
mirrors nothing.

## 6. Measurement

Feeds `funnel-scorecard.md` manual rows + `ANALYTICS.md` weekly note:

- Mirror posts/week and member replies generated per post (rough — count
  thread activity in `#the-block` that links back).
- `#the-feed`-driven watch parties (count via playbook §3 metrics).
- `watch_party_rsvp` events on site (spec'd in analytics-events.json) are
  the site-side counterpart; the channel itself has no analytics hooks —
  do not add tracking bots for this.
