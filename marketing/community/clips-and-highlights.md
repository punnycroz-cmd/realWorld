# Clips & highlights — member sharing spec

**Version:** v84 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §1 (Stage 5 Advocate), §5 (honesty
rules), §4 (moderation scopes), `referral-loop.md`.
**Status:** copy-ready; OWNER-GATED until the server exists.

Stage 5 (Resident → Advocate) currently runs on referrals alone. The
cheaper, more organic advocacy path is members **sharing captures of the
feed and the neighborhood** — the product is watchable, so its best
advertisement is literally watching it. This spec defines the channel,
the rules, and how clips flow upstream into marketing surfaces.

---

## 1. The channel

- `#clips` — created at go per `COMMUNITY-FUNNEL.md` §3 (adds one channel;
  the six-channel launch count becomes seven — still inside "alive not
  sprawling").
- Members post screenshots/short clips of the spectator view, the public
  feed, or their own request outcomes. Self-captured only — no reposts of
  other people's social posts into the channel.
- No ranking, no "clip of the week" contest. Advocacy rewarded with
  visibility mechanics becomes a game with winners, and games get gamed.

## 2. The rules (pin-ready)

> **#clips rules**
> 1. Post what you saw — real captures of the feed or the neighborhood.
>    No staged screenshots, no doctored images. The feed is public; a fake
>    capture is checkable and embarrassing.
> 2. Attribution is public — if a clip shows a request, the requester's
>    handle in it is fine (the feed shows it too). Do not editorialize
>    about the *person*.
> 3. Never map fiction to reality — no identifying real SF addresses or
>    real residents against in-world ones. That's a `#the-block` rule and
>    it applies double here.
> 4. Character secrets stay secret — if a capture seems to reveal
>    something the cast's public profile doesn't, don't post it; flag it
>    to a mod instead. (You may have found a bug.)
> 5. Posting here = OK to re-share — we may repost clips to the socials
>    or the recap with credit to your handle. Not OK? Say so in the post.

## 3. Upstream flow — where clips go

| Source | Destination | Mechanism |
|---|---|---|
| `#clips` standouts | Social drafts (`social/drafts/`) | Owner picks, credits handle, drops into the next scheduled slot — never interrupts the calendar |
| `#clips` standouts | Weekly recap "community saw" line | One line max: "worth a look: @handle's capture of {{BEAT}}" — clips are evidence for beats the recap already reported, never new claims |
| `#clips` volume | `funnel-scorecard.md` | Weekly manual count → manual-counts JSON (`clips_posted`, `clips_reshared`) — feeds the Stage 5 signal |

## 4. Boundary with creators

Member clips are organic advocacy; creator content is §6 outreach. A
member who starts producing coverage-grade content gets treated as a
member (credit, no deals) — the creator lane's disclosure rules apply
only when something was actually provided (early access, credit grants).
Never blur the two: undisclosed provided-assets is the one scandal this
community can't afford.

## 5. Failure modes watched

- **Clip bounty creep** — members asking for credits in exchange for
  posts. Answer is always no; point to `referral-loop.md` (honest
  mechanics only).
- **Faked captures** — rule 1 exists because a viral fake costs more than
  the click gained. Mods remove; repeat = ban ladder §4.1.
- **Spoiler-mining** — members combing captures for cast secrets. Rule 4
  plus mod watch; escalation to owner if a real leak exists.
