# Pinned-comment bank — the caption's second half

Channel: TikTok + YouTube (pinned comment), X (self-reply under a post
when the body ran out of room) · Timing: posted immediately after the
clip, pinned within the minute · Assets: none — text only
Gate: same §8 checklist as any post; `tools/social_check.py` covers
this file too.

Why this file exists: TikTok captions bury links, YouTube descriptions
sit below the fold, and X bodies cap out. The pinned comment is where
the context and the link actually live — the first thing a commenter
reads, written by us instead of left to the top-voted joke.

Rules:
- One pinned comment per clip. Never two competing comments from us.
- The link always carries UTMs (`utm_medium=clip` for TikTok/Shorts,
  `utm_medium=thread` for X self-replies — per §9).
- If a viewer's comment is better than our pin (a resident-spotting or
  a question we can answer at length), pin theirs instead and put our
  link in a reply to it. Crediting a viewer > owning the top slot.
- Update-in-place: if a pinned comment goes stale (price changed, feed
  moved), edit or re-pin — don't leave a wrong one up.
- Never argue in the pinned slot. Disputes live in replies
  (`reply-bank.md`); the pin stays a signpost.

---

## The bank

**P1 — default context pin (any clip):**
> This is a real simulated neighborhood — 28 fictional residents on one
> Mission block, running live. Watching is free, forever:
> {{WATCH_URL}}

**P2 — request-feed clip pin (clips 3–4, Counter content):**
> The requests you see are real: viewers file them, a screen reviews
> them, and every one lands on a public feed with the filer's name.
> Watch free: {{WATCH_URL}}

**P3 — cast-spotlight pin (spotlight cards + cast clips):**
> {{CHARACTER}} is one of eight mains — authored, unpossessable, still
> improvising every day. Meet the whole cast: {{CAST_URL}}

**P4 — "is this real?" pre-empt (high-traffic clips):**
> FAQ in advance: yes it's live, yes they're fictional agents, no you
> can't control them — you can ask, publicly, and the feed shows every
> answer. {{WATCH_URL}}

**P5 — pricing question pin (any clip drawing money comments):**
> Watching costs nothing, forever. Requests are priced by the minute
> and every one refunds if it never runs — full explainer:
> {{PRICING_URL}}

**P6 — X self-reply (announcement thread tail):**
> Everything above is checkable: the block is free to watch, the feed
> is public, the receipts are permanent. Start here: {{WATCH_URL}}

**P7 — spoiler-guard pin (any clip touching season-one material):**
> Yes, there are secrets on this block. No, we won't confirm them in
> comments — half the fun is watching somebody figure it out.
> {{WATCH_URL}}

**P8 — the correction pin (we got something wrong in the caption):**
> Correction on the caption: {{FIX}}. Leaving the clip up — the
> footage is real, the words weren't. Sorry about that.

Rule for P8: deployed from `incident-comms.md` logic — a wrong caption
gets a pinned correction within the hour, never a silent edit. The
pin is the apology; replies handle questions.
