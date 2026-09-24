# Launch watchalong — the live-narration runbook for launch day

Channel: X (primary) + Bluesky mirror · Timing: T-0, 08:45 → 23:00 PT,
then reusable for any big day (rent-cycle close, season beat, first
ruling) · Assets: none required — text-first, attach live feed
screenshots only when the moment earns it
Gate: **everything narrated here is real.** The watchalong reports what
the block is actually doing while it does it. If the block is quiet,
the quiet IS the post (see "silence rules"). Never stage, never
exaggerate, never narrate a feed event that isn't public — the feed is
attributed, a lie is a permanent receipt.

Why this exists: Phase B (SOCIAL-LAUNCH-PLAN §5) is the broadcast
skeleton — announcement, clips, screenshots on a schedule. The
watchalong is the *other* half of launch day: the dev account watching
the block with everyone else and saying what it sees, in real time.
It converts "come look at our game" into "we're watching too." That is
the product's whole pitch performed live.

---

## Format

- One **watchalong thread** per day, opened at 08:45 and added to all
  day. Replies to our own thread, not new top-level posts — the thread
  is the ticker tape. Bluesky mirrors each beat as standalone posts
  (no threads there).
- Every beat post starts with a **clock stamp** (`09:14 PT —`) so
  latecomers can reconstruct the day. The stamp is the format.
- Frequency: only when something happened OR a scheduled beat is due
  (table below). Target 8–14 beats across the day. Dead air >90 min in
  prime hours gets a quiet-block beat, not filler.

## Scheduled beats (the spine — fill `{{...}}` at send time)

**08:45 — thread opener**
> 08:45 PT — Doors open in fifteen minutes. The block is already awake:
> {{FIRST_MORNING_DETAIL — e.g. "Mudhaus has its chairs out"}}. Today
> we narrate what happens on one Mission block, live, all day. Watch
> along: {{SITE_URL}}/?utm_source=x&utm_medium=thread&utm_campaign=launch

**09:00 — doors open** (pairs with the announcement thread — this is
the *watcher's* version, not the pitch)
> 09:00 PT — And we're live. 28 residents, one block, zero script.
> Everything they do from here is theirs. Watching is free, forever.
> {{SITE_URL}}/?utm_source=x&utm_medium=thread&utm_campaign=launch

**~10:00 — first real feed event** (whenever it lands)
> {{HH:MM}} PT — First request on the public feed: {{REQUEST_SUMMARY
> verbatim from the feed}}. Filed by a viewer, visible to everyone,
> decided by the block. That's the whole game in one line.

If no request has landed by 11:00, post the empty-feed beat instead
(see silence rules) — never narrate a request that didn't happen.

**12:30 — midday check-in**
> 12:30 PT — Lunch hour on the block. {{MIDDAY_DETAIL — pick one real
> thing: who ate where, a queue at the counter, rain starting}}.
> Nobody's performing. That's the point.

**15:00 — the spectator beat** (pairs with Phase B 15:00 feed post —
this one is about the *watching*)
> 15:00 PT — {{WATCHER_COUNT}} people watching the block right now.
> The residents don't know — there's no "audience" in their world.
> You're the weather they can't feel.

**18:30 — evening shift**
> 18:30 PT — The night shift of the block: {{EVENING_DETAIL}}. Day
> residents head home; the ones who live at night come out. Same
> streets, different cast.

**21:00 — hand to the recap** (last beat; the recap post takes over)
> 21:00 PT — Calling it here. Day one, honestly: {{ONE-SENTENCE
> VERDICT, numbers verbatim}}. Full recap in tonight's This Week on
> the Block. The block keeps going — it doesn't need us to watch.
> {{SITE_URL}}/?utm_source=x&utm_medium=thread&utm_campaign=launch

## Event beats (unscheduled — post when the feed produces them)

**A viewer request lands:**
> {{HH:MM}} PT — Someone just asked for {{REQUEST_TYPE}} on the feed.
> It goes in the queue like everyone's. Watch whether the block takes
> it: {{SITE_URL}}/?utm_source=x&utm_medium=thread&utm_campaign=launch

**A request is declined:**
> {{HH:MM}} PT — The desk said no to one. It's on the feed, with the
> reason. Declined requests are public too — that's the deal.

**A character moment worth narrating** (max 3/day — pick the best):
> {{HH:MM}} PT — {{CHARACTER_FIRST_NAME}} {{ONE_CLAUSE_VERBATIM_DETAIL}}.
> Nobody asked for that. Nobody scripted it. It's just Tuesday for them.

**The block pushes back on weather/a request outcome:**
> {{HH:MM}} PT — The request landed, and the block is reacting to it —
> {{REACTION_DETAIL}}. Viewers ask; residents decide what it means.

## Silence rules (the honest part)

- **Quiet >90 min in prime time (09:00–21:00 PT):** post one
  quiet-block beat, then stop forcing it:
  > {{HH:MM}} PT — Honest ticker: quiet stretch. {{QUIET_DETAIL — e.g.
  > "everyone's at work, the parrots own the corner"}}. The block isn't
  > a slot machine — lulls are part of a real place. Evening shift
  > starts around six.
- **Zero player requests all day:** that IS the story, post it once
  around 17:00:
  > 17:00 PT — Request feed's still empty and that's fine: the block
  > runs without us. The desk is open, wording checks are free — the
  > world's first request is unclaimed.
- **Technical trouble mid-day:** stop the thread, post the outage
  variant from `incident-comms.md`, resume only when the public feed
  is verifiably live again. A watchalong that narrates through an
  outage is a lie with timestamps.
- **Nothing verified, nothing posted:** every detail above must come
  from the live feed or the spectator view, not memory or assumption.
  If you didn't see it, don't stamp it.

## Hard rules

- Never name a resident doing something the feed can't corroborate —
  the Archive keeps receipts (world-v20+; permanence is the feature).
- Never narrate a request's *outcome* before the feed shows it —
  queued ≠ granted, and the post would age into a lie.
- Never @-mention or quote a player who filed a request — attribution
  points outward to the feed, not at a person (same rule as
  milestone-posts.md).
- Season-one secrets: narrate what residents *do*, never what it
  *means* (§4 spoiler rule). "Marisol was at Mudhaus for two hours"
  if seen; never why it matters.
- Max 14 beats/day including the opener — the ticker informs, it
  doesn't flood. A slow honest day beats a busy inflated one.
- Char limit: X 280 / Bluesky 300. Every template above is sized for
  X; Bluesky gets the same text.

## Reuse after launch day

Same runbook, retitled, for any day that earns it: first rent-cycle
close, first public ruling, first hire's first day, a storm request
the whole block feels. Rule of thumb: watchalong when the day has a
story the feed is already telling — our job is to read it aloud, not
to write it.

Pre-send: `python3 tools/social_check.py` must stay 0-FAIL; every
`{{...}}` filled or the beat is skipped, never shipped with blanks.
