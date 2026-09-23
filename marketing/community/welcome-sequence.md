# Welcome sequence — new-member journey (Discord)

**Version:** v39 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §3 (server structure), §4 (moderation).
**Status:** copy-ready; every message below is OWNER-GATED until the server exists.

The funnel's Stage 1→2 conversion happens in the first ten minutes after a
join. This file is the exact path a new member walks and the exact words the
owner pastes. Design rule throughout: **no engagement bait.** Every touchpoint
points at something real to watch — never at "post to unlock" mechanics.

---

## 1. The first ten minutes

| T+ | Member sees | Job it does |
|---|---|---|
| join | `#rules` gate (Discord membership screening): 3 rules + accept button | Sets the fiction/respect contract before any channel opens |
| +0 | `#the-block` welcome post (pinned) answers "what is this place" in 4 lines | Orients without a wall of text |
| +0 | Self-assign `@resident` role via emoji on the rules post | Cosmetic belonging, zero gates |
| +2min | They wander into `#the-feed` — pinned "how to read the feed" note | The feed is the product; teach the vocabulary early |
| later | `#help-requests` pinned "your first request" walkthrough link | Seeds the Stage 2→3 conversion without pushing it |

No welcome-bot DM. No "say hi to unlock" gate. A lurker who never posts is a
successful conversion — watching is the product.

## 2. Copy-ready blocks

### 2a. Rules-gate text (Discord membership screening, ~4 lines)

```
Welcome to Real World — The Mission. Three rules before you're in:
1. The 28 residents are fictional people on real streets. Treat them as
   fiction; treat members as people. Never map fiction onto real doors.
2. No hate, harassment, spam, or credit-trading offers — credits are
   non-transferable, so anyone selling them is scamming.
3. Discuss request mechanics all you like; coordinating to grief the sim
   is a ban.
React ✅ to enter the block.
```

### 2b. `#the-block` welcome post (pinned)

```
Welcome to the block. This is the community for Real World — a simulated
Mission District neighborhood where 28 AI residents live their own lives,
and watching is free.

Start here:
• #the-feed — notable entries from the public request feed, with attribution
• #watch-party — when something big is scheduled, we watch it together
• #help-requests — how to file a request, what "compatible" means
• #announcements — the Sunday recap, "This Week on the Block"

Nothing here is scripted. Every event you discuss actually ran.
```

### 2c. `#the-feed` pinned note ("how to read the feed")

```
The feed shows every request anyone filed — yours, theirs, ours — with a
name on it. Vocabulary:
• compatible — runs alongside whatever's happening (cheap, cents-level)
• exclusive — locks a venue or the sky for its duration (human-reviewed first)
• queued — runs in the next compatible window (−15% credits)
• denied/expired/refunded — counted in the recap, not hidden
The characters still decide what to do with a request. We inject
opportunities, never mind control.
```

### 2d. `#help-requests` pinned note

```
Your first request, in 3 steps:
1. Watch the block until you have an opinion about it.
2. File something small and compatible — "it's Market's day off, send him
   to Dolores Park" is a ~25-credit request, about a quarter.
3. Read the pre-payment receipt before confirming — class, minutes, surge,
   refund terms. No charge appears that wasn't on that screen.
Denied requests refund in full. Screened, not staged.
```

(Verify amounts against `PRICING-PAGE-CONTENT.md` at go time — 25 cr ≈ $0.25
is the current proposal.)

### 2e. Owner's first-week nudge (manual, not a bot)

Post in `#the-block` whenever the feed has a genuine beat worth watching —
at most once a day, and skip quiet days rather than inventing one:

```
Something's on the feed worth watching: <one line — e.g. "someone just
requested fog over the park for tomorrow morning, attributed, exclusive
sky lock pending review">. #the-feed has it.
```

## 3. First-week touchpoints (owner manual cadence)

| Day | Action |
|---|---|
| 0 | Welcome post live; rules gate on; greet joins in `#the-block` by name — small enough to be human, that's the advantage |
| 1–3 | One feed-highlight note/day max; answer every `#help-requests` question within a waking day |
| 4–6 | First `#feedback` sweep → sanitize → shared inbox (funnel §7) |
| 7 | First real recap post in `#announcements`; pin it; note in `#the-block` |

**Anti-patterns (do not):** reaction-role reward ladders, XP bots, "member
count" milestones posts, ping-everyone announcements, fake scarcity. The
product's pitch is honesty; the community surface can't contradict it.

## 4. Health signals vs vanity signals

Watch (weekly note, feeds `ANALYTICS.md` report):
- Joins/week, and % of joins still present at day-7 (approximate via
  member list — no tracking needed beyond eyeballing at launch scale).
- `#the-feed` posts-per-week from *members* (not owner) — the leading
  indicator that watchers became community.
- `#help-requests` question themes → funnel §7 routing.

Ignore: total member count, message volume, emoji velocity. A 60-person
server where 15 people argue about a fog request beats a 600-person server
of lurkers — and both are fine at launch.
