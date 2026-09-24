# Thread following — the `#beats` forum (community-funnel Stage 1→2 follow layer)

**Version:** v189 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY ·
OWNER-GATED to run (the server itself is create-at-go).
**Parent spec:** `COMMUNITY-FUNNEL.md` §1–§3. Blueprint data:
`community/server-blueprint.json` → `#beats` (forum channel).
**Why it exists:** the Production-3 free observer loop is
*catch up → choose someone to follow → make a non-wager prediction →
inspect the outcome → revise your understanding → return*. The recap
covers catch-up, `prediction-ledger.md` covers the prediction and the
inspection. This spec covers the two steps that had no surface:
**following** one ongoing situation over weeks, and **revising** — saying
out loud what you got wrong. A forum channel is the right shape because a
beat is a durable thread, not a chat message.

---

## 1. What a beat is

A **beat** is one open, observable situation on the block, followed over
time by whoever subscribes to its thread. One forum post = one beat.

A beat is a *situation*, not a character profile and not a shipping lane:

- **Good beats:** the standing offer on the Flying Pannier cork board
  (who picks it up, does it lapse, does the venue quietly repost it); a
  request that landed as a bounded invitation (`lands_as` — did anyone
  take it; refusal is a result, not a failure); an open rumor the recap
  flagged; a resident's self-chosen project that keeps showing up in the
  feed; two residents who stopped eating together after a visible
  argument.
- **Not beats:** "the Jules fan thread" (a character, not a situation —
  use `#the-block`), "drama predictions general" (that is the weekly
  calls thread's job), anything whose resolution requires reading a
  character's mind (see §2).

The world hands us natural beat seeds: standing offers
(`world/offers.json`), landed requests (`world/requests.json` `lands_as`),
open rumors, and the recap's unconfirmed hook. A beat should name its
seed — "the cork-board offer" is followable; "vibes" is not.

## 2. The rules (pin-ready)

1. **Observable outcomes only.** Posts report what the feed/archive
   shows: who showed up, what got posted, what expired. Inference is
   allowed *only when labeled as a guess* — "she looked angry" is a
   guess, "she left before the set ended" is the record. The feed never
   confirms motives; neither do we.
2. **No hidden-knowledge claims.** If it is not in the public feed, the
   archive, or a recap, it is not evidence. Character secrets stay sealed
   (design §7); a beat must never try to unseal one.
3. **Every beat opens with a falsifier.** The first post ends with "we'd
   know this mattered if…" — an observable sign that would resolve it.
   Beats without one are chat, and belong in `#the-block`.
4. **Went quiet is an honest ending.** Most real situations fizzle. A
   beat whose falsifier never fires closes with "went quiet" — that is a
   result, not a failed thread.
5. **Follows are free and silent.** Subscribing is the whole mechanic. No
   points, no follower counts displayed, no role for posting in a beat.
6. **Follow counts feed nothing upstream.** How many members watch a beat
   is never a signal to the world — residents do not get promoted,
   nudged, or written toward popular threads. (The build's rule is the
   same: recurring relationships decide who becomes a persistent
   supporting resident, not camera or community popularity.) The
   community watches; it does not cast.

## 3. Post format

**Opening post (copy-ready skeleton):**

```
Beat: {{SHORT NAME — e.g. "the cork-board offer"}}
Seed: {{feed event / archive link / recap line that opened this}}
What we're watching: {{one sentence, observable}}
We'd know this mattered if… {{falsifier — the observable sign}}
First seen: {{date}}
```

**Update posts:** a line of evidence — timestamped, linked to the feed or
archive entry. No editorializing longer than the evidence. Replies are
discussion; guesses carry the guess label.

**Closing post (copy-ready):**

```
Beat closed: {{NAME}}
Outcome: {{resolved — the record shows X | went quiet — falsifier never fired}}
What we got wrong: {{what the thread predicted vs what the record showed}}
Calls settled: {{weekly calls that resolved on this beat, if any}}
```

The "what we got wrong" line is the *revise* step of the observer loop
made public — it is the part of the ritual that teaches members the world
doesn't owe anyone the obvious story.

## 4. Lifecycle and cadence

- **Opening beats:** owner opens the first few from recap hooks at
  launch; members may propose beats by posting the §3 skeleton — an
  owner/mod approval turns it into a tracked thread (keeps the forum
  sparse and real). Target at launch scale: **2–5 open beats**, never
  more; a forum of forty dead threads reads worse than none.
- **Beat sweep — Sundays 18:15 PT** (after recap 18:00 / rumor 18:05 /
  calls 18:10): the owner walks the open beats against the week's
  record. Resolves what's resolvable, posts one-line evidence updates,
  closes what closed. Quiet week = the sweep posts nothing; that is the
  design, not a missed slot.
- **Closing:** any week the record settles it. Closed threads stay
  readable — the archive of called-it-wrong beats is itself the pitch.

## 5. Wiring into the rest of the funnel

| Surface | Connection |
|---|---|
| Recap (`build_recap.py` issues) | Open-rumor hook seeds beats; resolved beats get a one-line "settled this week" mention alongside resolved calls |
| `prediction-ledger.md` (weekly calls) | A call attaches to a beat when both exist — the beat is where the evidence accrues; the calls thread is where it's scored |
| `feed-mirror.md` (`#the-feed`) | A mirrored entry that keeps developing is the signal to propose a beat |
| `clips-and-highlights.md` (`#clips`) | Before/after captures of a resolved beat are the strongest member clips — the choice→consequence pair standard already applies |
| `funnel-scorecard.md` §3 | `open_beats`, `beats_resolved`, `repeat_beat_followers` — manual counts; the follower count is the community-side proxy for the `thread_followed` event until it ships |
| `scale-plan.md` | Beats stay 2–5 at every tier; if the forum can't hold focus, that is a quiet-server symptom, handled by the downward path |

## 6. Failure modes

- **Beat-as-fandom:** a thread that becomes cheering for a resident
  fails rule 1/6 — mods re-point it to a situation or move it to
  `#the-block`. Watching *someone* is fine; the channel watches
  *situations*.
- **Motive creep:** threads drift toward "what she really meant."
  The correction is the ritual's own question — "what does the record
  show?" — applied by anyone, not just mods.
- **Influence illusion:** members believe a popular beat steers the
  world. Rule 6 exists because it doesn't, and saying so plainly is
  cheaper than letting the rumor grow.
- **Ghost forum:** zero open beats for a month → collapse the channel
  into the calls thread per `scale-plan.md`; a folded surface is a
  healthy honest outcome.
