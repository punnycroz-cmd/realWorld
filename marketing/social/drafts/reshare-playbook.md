# Reshare playbook — amplifying viewers without becoming a parasite

Channel: X / Bluesky (quote-posts), TikTok (duet/stitch by viewer, we
link) · Timing: opportunistic, post-launch only · Assets: the viewer's
own clip/screenshot, embedded or linked — never re-hosted without
permission
Gate: **permission first, always.** A viewer's capture of the public
feed is theirs. The feed being public makes it *visible*, not *ours*.

Why this file exists: the moment someone clips the block and posts it,
the best marketing we can do is amplify their post — but one careless
reshare ("look what our game did!") steals credit, leaks a stranger's
handle, or confirms a spoiler. These rules exist so amplification is a
gift to the viewer, not a harvest.

---

## 1. The four gates (all four, every time)

1. **Permission.** Public reply or DM asks first (templates §3).
   Silence = no. "Sure" to a different post = no. Per-post permission,
   not blanket — unless the viewer volunteers a standing "clip whatever"
   note, which we log in `social/post-review.md`'s consent ledger.
2. **Credit.** Their handle in the first line of our post, native
   quote-post (not a re-uploaded copy). If they ask to be uncredited
   ("don't tag me"), we link the post without the handle or don't
   reshare at all.
3. **Privacy.** Never amplify a capture that shows *another* player's
   request attribution, DM, or moderation action without that second
   player's OK too. The feed is public; our megaphone is a different
   exposure. Screenshots that name a player who didn't consent to the
   spotlight get cropped or skipped.
4. **Spoiler check.** A viewer clip that confirms a season-one secret
   (the anonymous author, Victor's buildings' outcome) is not reshared
   no matter how good it is. Tease-level is fine; confirmation is not.
   Same restraint as the §4 spotlight rule — applied to other people's
   footage.

**Never-reshare list (hard no, no template needed):**
- Anything showing a denied request with the filer's handle visible
  (public ridicule risk — the moderation layer already shields them;
  we don't un-shield).
- Clips captioned to mock a resident ("look at this dumb AI") —
  liking/quoting it endorses the read. Scroll past.
- Mod-console, admin, or interior-camera captures that look like
  surveillance rather than play.
- Anything a minor appears to have posted (unknown-age handles get a
  "thanks, not resharing" — see decline template).
- Clips that pair our footage with another game's branding for a
  comparison hit-piece. Not our fight; don't feed it.

## 2. When to reshare vs. when to just reply

| Signal | Move |
|---|---|
| Viewer clip, good moment, handle is an adult account | Ask → quote-post with caption bank §4 |
| Viewer screenshot, text-only insight | Reply with praise + link the post from ours; no quote needed |
| Creator/streamer running the spectator view live | Quote-post mid-stream ("live right now") — caption bank §5 |
| Clip is great but shows an unconsented third-party handle | Ask the *clipping* viewer; if yes, ask the named player via reply; both yes → go |
| Clip is mediocre but enthusiastic | Reply warmly, don't quote — a weak reshare teaches the algorithm nothing |
| Viewer asks us to reshare | Same four gates; permission is already granted, credit still required |

## 3. Permission templates

**Public reply (default — keeps the exchange visible and honest):**
> This is great — mind if we quote it from the dev account? Credit in
> the first line, obviously.

**DM (when their replies are closed or the post is old):**
> Hey — dev account for Real World here. Loved your clip of
> {{MOMENT}}. OK to quote-post it? We'd credit {{HANDLE}} in the first
> line. Totally fine if not.

**Decline (we asked, they said no — or the never-reshare list applies
and they offered):**
> All good — thanks for posting it anyway. The block appreciates being
> watched.

**Consent ledger:** log granted permissions in `social/post-review.md`
(date, handle, post link, scope). If they delete the original, our
quote-post comes down within a day — their footage, their call,
permanently.

## 4. Reshare caption bank (quote-post text)

Keep it under ~180 chars so their post shows fully on X.

**R1 — the moment:**
> {{HANDLE}} caught this live. Nobody asked for it, nobody scripted it —
> the block just did it. {{WATCH_URL}}

**R2 — the read:**
> {{HANDLE}} gets it. Twenty-eight fictional lives, one shared Tuesday —
> and a feed that shows every intervention. {{WATCH_URL}}

**R3 — the quiet one:**
> The best posts about this game are the ones we didn't write. Thanks
> {{HANDLE}}. {{WATCH_URL}}

**R4 — the mechanic spotted:**
> {{HANDLE}} noticed the receipt — every request, attributed, still on
> the board. That's the whole design in one screenshot. {{WATCH_URL}}

**R5 — newcomer conversion:**
> {{HANDLE}} started watching this morning and is already fluent.
> Free to watch, forever: {{WATCH_URL}}

**R6 — the fan-clip feature (weekly, max 1/week):**
> Clip of the week, from {{HANDLE}}: {{ONE_LINE_WHAT_HAPPENED}}.
> Seen something on the block? Clip it — we ask before we share.
> {{WATCH_URL}}

Rule for R6: "clip of the week" is a real weekly pick, not a slot we
fill — a quiet week with no good viewer clip skips it rather than
lowering the bar. Never more than one a week; scarcity keeps it an honor.

## 5. Creator/streamer quote-post captions

For live streams of the spectator view (the game *is* the content —
§7 of the plan). These fire mid-stream while viewers can still join.

**S1 — live now:**
> {{CREATOR}} is watching the block live right now — come see twenty-
> eight residents improvise an afternoon. {{STREAM_URL}} / {{WATCH_URL}}

**S2 — the discovery:**
> {{CREATOR}} just found the request feed mid-stream and read a whole
> lease dispute out loud. This is what the block is for.
> {{STREAM_URL}}

**S3 — post-stream thanks:**
> Thanks to {{CREATOR}} for spending an evening on the block. The VOD's
> worth it: {{STREAM_URL}} — and the live version is free, always:
> {{WATCH_URL}}

Rule: never promise the streamer anything in the caption ("collab
soon" is a claim). We quote what happened, full stop.

## 6. UTM & measurement

Reshare posts carry `utm_medium=reshare` (added to the §9 enum) so we
can tell earned-media traffic from our own calendar posts. Track
reshare performance in `social/post-review.md` — if R-captions
consistently underperform plain replies, the retro rules say to
prefer replying.

## 7. What this file is not

- Not a UGC program: we don't solicit "post about us and win credits."
  Paying for posts (money, credits, keys) turns viewers into ads and
  we don't run ads.
- Not a rights grab: no terms-of-service language, no "by tagging us
  you agree." A yes to a quote-post is a yes to a quote-post.
- Not a follow-back scheme: we follow creators we quote, not everyone
  who posts. Follows are signal, not reward.
