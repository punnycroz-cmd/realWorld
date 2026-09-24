# Milestone posts — trigger-fired posts, not calendar posts

Channel: X (+Bluesky mirror; TikTok/Shorts only where noted) · Timing:
whenever the counter actually trips — never on a schedule · Assets:
`social/cards/` where named, live feed screenshots otherwise
Gate: **numbers only.** Every post below fires when a real counter from
the live feed / analytics hits its threshold (table:
`social/milestones.json`, checker: `tools/milestone_check.py`). If the
counter hasn't tripped, the post does not exist. Round numbers come
from the feed itself — never estimate, never round up.

Why this file exists: the arcs in the calendar are stories we tell on
schedule. Milestones are the opposite — the block does a thing, and the
post is the receipt. They only work because they're true: a public,
attributed feed means anyone can check. That's the whole pitch.

---

## The bank

**M1 — first request filed (fires once)**
> First request on the public board: "{{REQUEST_SUMMARY}}" — filed by
> {{HANDLE}}, stamped {{TIME}} PT. It's on the feed, attributed, like
> every one after it. The Counter is open.

Attach: live feed screenshot of the `rq-` line (never a mock).
Rule: if it's a camera ask, still post it — small is fine; first is first.

**M2 — 100 watchers at once (fires once)**
> {{N}} of you watching the block right now. Nobody scripted anything
> you're looking at. {{WATCH_URL}}

Attach: `cards/card-watchfree.png`.
Rule: N = concurrent spectator count at post time, verbatim.

**M3 — first character hired (fires once)**
> Someone just hired a resident onto the cast. Character creation is a
> lease, not a costume — the newcomer signs, gets a flat, and starts
> owing rent like everybody else. Day one, page one.

Attach: none needed; text post. Do NOT name the hire's player handle
unless they posted about it first (attribution is public on the feed,
but we don't amplify a stranger's name into marketing).

**M4 — first co-sponsored request (fires once)**
> First split bill: {{N}} viewers just co-sponsored one request on the
> Counter. The receipt names all of them. Crowdfunding a plot beat is
> apparently a thing people do on day {{D}}.

Attach: live feed screenshot showing the sponsor list.

**M5 — first declined request (fires once)**
> First decline on the board. The request screened out — reason code
> posted, credits refunded in full. The door is real: asks knock, not
> every ask gets in.

Attach: live feed screenshot of the declined entry.
Rule: neutral wording only — never name the denied player, never
editorialize the reason code. If the decline is still under review
(pending appeal window), hold the post until it resolves.

**M6 — first rent cycle closed (fires once per cycle — post cycle 1 only)**
> Rent week one, closed: {{N}} leases ran, {{N}} paid on time, {{N}}
> disputes filed. The numbers are on the feed; the ledger is public.
> Next cycle starts on the 1st.

Attach: recap-format masthead (`cards/card-recap.png`).
Rule: counts pulled from the history browser, not vibes. If the feed
shows zero disputes, "0 disputes filed" is the line — zeros count.

**M7 — 1,000 requests filed (repeatable at 5k, 10k)**
> {{N}} requests since launch. Every one is still on the board — filed,
> screened, approved or declined, attributed. The block keeps receipts.

Attach: `cards/card-receipt.png`.
Rule: posts at 1,000 / 5,000 / 10,000 only — no "almost at" posts.

**M8 — first week-2 retention note (fires once, owner-gated)**
> A week in: {{N}} people watched the block today, {{N}} have filed a
> request, {{N}} characters hired. Small numbers, real ones. The feed
> is the audit.

Attach: none; text post.
Rule: this is the honesty post for whatever the real week-one numbers
are. If the numbers are embarrassing, post it anyway and own it — the
pricing-post already set the tone. Never skip by silence after teasing
transparency.

**M9 — first dispute/ruling on the public feed (fires once)**
> First rent-board ruling on the public feed — filed {{DATE}}, ruled
> {{DATE}}. No amounts, no reasons in public; the ledger keeps those.
> The block saw the shape of it, which is the point.

Attach: live feed screenshot.
Rule: only if a `housing`/`admin` ruling actually lands on the public
feed (late notices stay private — do not leak them into marketing).

**M10 — quiet-week honesty card (repeatable, max 1/month)**
> Slow week on the block. {{N}} requests filed, none dramatic. That's
> the deal: it's a neighborhood, not a show — the quiet weeks are real
> too.

Attach: `cards/card-empty-feed.png`.
Rule: this is the anti-hype post. It exists so we never have to invent
drama; deploy when the weekly recap would be thin.

---

## Rules that apply to every milestone

1. **Counter-verbatim.** Numbers are copied from the feed/analytics at
   post time. If the counter and the draft disagree, the counter wins.
2. **Fires once means once.** After posting, log the date in
   MARKETINGLOG.md's weekly note (or the metrics log per ANALYTICS.md)
   so a later version doesn't re-fire it.
3. **Feed-honesty rule applies double.** A milestone post about a
   public feed that doesn't show the event is worse than no post —
   anyone can check.
4. **Attribution outward only.** Milestone posts may quote the feed's
   public attribution ("filed by {{HANDLE}}") but never tag, @-mention,
   or amplify a player's account from the dev account. Their name is on
   the board; that's enough.
5. **Checker before send.** `python3 tools/milestone_check.py --show`
   prints which milestones are currently unlocked from a counters file;
   `python3 tools/social_check.py` still vets the finished post body.
