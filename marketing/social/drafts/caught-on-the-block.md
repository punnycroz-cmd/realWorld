# Caught on the Block — the viewer-clip prompt series (UGC intake)

Masthead: `site/assets/masthead-caught.svg` (BRAND.md §21 — the sanctioned
Class-B lockup; prompt cards set the same DejaVu Bold / casing / palette).

Channel: X + Bluesky (prompts), TikTok/Shorts (prompt-card variant) ·
Timing: weekly, Saturdays 10:00 PT starting T+3; extra prompts on big
feed days · Assets: none required — text prompts; optional
`site/shots/` still for the weekly card
Gate: post-launch only (needs live spectators). Soliciting clips we
can't reshare is the scam version of community — every prompt below
exists to feed `reshare-playbook.md`'s 4-gate permission flow, and
every granted clip lands in the `post-review.md` consent ledger.

Why this arc: reshare-playbook.md covers *amplifying* clips viewers
already made. This file covers the step before it — *asking* the
audience to watch closely and clip what they catch. "Caught on the
Block" is the standing prompt; it turns lurking into a sport and makes
the spectator view's whole point (you see things residents don't)
explicit. M11 ("first viewer clip reshared") is this arc's first
harvest — see `social/milestones.json`.

---

## The standing prompt (weekly anchor — rotate wording, keep the shape)

**P1 — the canonical version (first use, T+3 Saturday):**
> Saturdays are for catching things. Watch the block, clip a moment
> nobody scripted, and reply with it. Best catch gets quoted next
> week — with permission, credited, on your terms. Watching is free:
> {{SITE_URL}}/?utm_source=x&utm_medium=organic&utm_campaign=ongoing

**P2 — the specificity variant:**
> Catch of the week is open. What we're looking for: a moment that
> only happened because nobody was performing. A look, a detour, two
> residents who clearly have history. Clip it, drop it below.

**P3 — the quiet-hours variant (Sundays or slow weeks):**
> The block at 7am is a different show — the bakers, the runners, the
> ones who didn't sleep. If you're up early this weekend, that's your
> window. Catch something, clip it, post it below.

**P4 — the evening variant (pairs with dusk captures):**
> Lamplight shift starts around six. If the clips so far have all been
> daytime, that's a bias in the audience, not the block. Night catches
> count double in our hearts (and identically in the standings).

**P5 — the new-viewer variant (after any traffic spike):**
> Lot of new faces watching this week, so: the sport here is noticing.
> The residents can't see you, the feed shows everything public, and
> the best moments are the small ones. Clip what you catch. Rules
> below.

**P6 — the seasonal beat (rent week, first storm, a ruling):**
> Big week on the block — {{EVENT_VERBATIM, e.g. "rent came due
> Monday"}}. Weeks like this are when the catches get good: pressure
> makes people interesting. Eyes up, clips below.

## Prompt-card variant (TikTok/Shorts — one per month max)

Caption template for a 10–15s screen-recorded spectator clip:
> POV: you're the only one who saw this. (This is a real moment from
> the block — nobody scripted it, nobody's performing for you.) Clip
> what you catch and tag us. Watching is free — link in bio.

Asset: a real feed/spectator capture from `social/capture-plan.md`'s
clip-worthy taxonomy — never staged, never re-enacted. `{{CLIP}}`
placeholder until a real capture exists; do not substitute a devlog
clip and imply it's a viewer catch.

## Rules (the part that keeps this honest)

1. **Permission before amplification.** A reply with a clip is a
   submission, not a license. Resharing runs the full 4-gate flow in
   `reshare-playbook.md` (consent, privacy, spoiler, quality) and gets
   logged in the consent ledger. Never quote a clip without the grant
   on file.
2. **Credit in the first line, always.** "Caught by {{HANDLE}}" before
   anything else in the reshare post. The clip is theirs.
3. **No prizes, no rankings, no leaderboard.** "Best catch gets
   quoted" is the entire reward structure — a spotlight, not a
   contest. Never offer credits, merch, or money for clips (turns a
   community ritual into paid content and invites manufactured
   moments; also collides with the monetization plan's no-urgency
   rules).
4. **Never mock a resident or a player.** A catch is observed, not
   ridiculed — same voice rule as the recap. Decline to amplify clips
   edited to mislead (see the never-reshare list).
5. **Spoiler gate applies to catches too.** A clip that happens to
   reveal a season-one thread doesn't get amplified no matter how good
   it is — reshare-playbook gate 3.
6. **Feed-honesty, squared.** If a week gets zero submissions, that's
   fine — skip the reshare, keep the prompt. Never fill the slot with
   a dev-captured clip dressed as a viewer's. The audience can smell
   the difference and the receipts are public.
7. **Attribution outward only.** Prompt posts never @-mention players
   or name request-filers; catches are about residents, not people.

## Wiring

- Prompts live in Phase C recurrence (`schedule.json` →
  `C-caught-on-block`, weekly Saturdays, campaign `ongoing`).
- Granted clips feed reshare captions R1–R6 in `reshare-playbook.md`;
  the month's best catch is the clip-of-the-week candidate.
- First granted reshare trips milestone M11 (`milestone-posts.md`).
- Weekly prompt performance is scored in `post-review.md` — if three
  consecutive prompts draw zero clips, kill the cadence, keep the
  format for big weeks only (rerun/keep/kill rule).

Pre-send: `python3 tools/social_check.py` 0-FAIL; every `{{...}}`
filled or the post is skipped.
