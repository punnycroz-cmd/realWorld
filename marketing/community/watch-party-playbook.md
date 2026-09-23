# Watch-party playbook — community event format

**Version:** v39 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §3 (`#watch-party`, `#rooftop` voice),
§5 (cadence). Copy blocks are OWNER-GATED until the server exists.

A watch party is the community's signature event: the feed makes big requests
visible in advance, so we can *schedule around the world's own drama* instead
of manufacturing events. This is the format Twitch Plays Pokémon proved and
our request feed makes natural — viewers watching attributed interventions
land together.

---

## 1. What qualifies as a watch party

Run one when the feed shows a scheduled request with real stakes — a queued
or exclusive event with a known start time. Typical triggers:

- **Weather override** — someone bought the sky (fog morning, storm over
  Dolores Park). High spectacle, zero spoilers, perfect first party.
- **Exclusive venue hold** — a business rented out (a private set at
  El Farolote, a buyout of Mudhaus' evening). Drama is *who* and *why*.
- **Showtime / crowd moments** — a scheduled gathering request; world-side
  crowd band-words on the feed give it legibility without spoiling counts.
- **Owner-scheduled beats** — only if something real is on the feed. Never
  call a party for a quiet hour; a party that fizzles teaches people to
  skip the next one.

Not a watch party: routine compatible requests, anything requiring secrets
or bible spoilers to explain, anything mid-review that might be denied —
announce only once a request is **approved and scheduled**.

## 2. Event anatomy (copy-ready)

**T−24h — announcement in `#watch-party`** (and cross-post to
`#announcements` only for genuinely big ones):

```
📺 WATCH PARTY — <day> <time PT>
On the feed: <one-line factual summary, e.g. "a queued weather request
puts Karl the Fog over Dolores Park tomorrow morning, exclusive sky lock,
attributed to <handle>">.
We meet in #watch-party; voice in #rooftop for whoever wants it.
Watching is free. Bring opinions about whether it was worth the credits.
```

**T−1h — reminder, one line:**

```
Fog party in an hour. Feed entry: <link/quote>. #rooftop voice is open.
```

**During — owner behavior:**
- Keep `#the-feed` commentary running (what's actually rendering vs what
  was asked for — the gap is the show).
- Never narrate a script; nobody including us knows how the residents take
  an opportunity. Say that out loud — it's the pitch.
- Capture notes for the recap beat (who attended, best feed moments,
  community reactions worth quoting *with permission*).

**T+~2h — close:**

```
That's a wrap — the fog lifted, the residents did whatever they decided to
do about it. Sunday's recap will cover it. If you filed the request:
respect, and the receipt was public the whole time.
```

## 3. Aftermath loop (the part that compounds)

1. The event becomes a **recap beat** (`tools/build_recap.py` picks it up
   from `world/history.json` automatically — attributed requests are its
   headline inputs).
2. One clip/screenshot candidate → `social/drafts/devlog-clips.md` queue
   (real captures only, per honesty rules).
3. `#feedback` prompt the next day: *"Did the party make the block more
   watchable, or was it just a crowd?"* — feeds the funnel §7 loop.
4. Metrics note: attendees (voice peak + text participants), new joins in
   the 24h window, feed-driven →request-filed conversions if the game-side
   `request_submitted` event exists yet.

## 4. Cadence ceiling

**At most one scheduled party per week** at launch scale, plus reactive
pop-ups when the feed surprises us ("someone just bought tomorrow's sky,
party in 20"). Scarcity keeps it an event. If two big requests collide in
one week, run both — the feed sets the calendar, not us.

## 5. What could go wrong (pre-planned)

| Failure | Response |
|---|---|
| Request denied in review after announcement | Post the denial as content — "screened, not staged" is the brand; the recap counts denials |
| The moment underdelivers (characters ignore the opportunity) | That IS the show — narrate the autonomy, quote the debrief if the feed shows one |
| Trolls flood `#watch-party` mid-event | Slow-mode the channel; per §4.1 ladder; never pause the event for moderation theater |
| Nobody shows | Run it anyway as a watch-along note thread; recap covers it; small is honest at launch |
