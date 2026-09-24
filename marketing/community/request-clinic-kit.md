# Request clinic kit — Wednesday 19:00 PT, `#help-requests`

**Version:** v159 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent specs:** `COMMUNITY-FUNNEL.md` §5 (cadence/honesty),
`programming-calendar.md` §1 (the grid slot), design doc §11 (the request
pipeline being taught), `rw-monetization-plan-2026-09-22.md` (credit
numbers), `rules.html` (public policy wording).
**Status:** copy-ready; OWNER-GATED until the server exists and real
requests have been filed.

The clinic is the funnel's Stage 2→3 conversion surface done in public:
a member who understands what "compatible" means files a first cheap
request; a member who watched it happen understands the feed forever.
This file is the whole playbook — agenda, worked examples, canned
answers, quiet-week fallback. If it isn't here, it isn't promised.

---

## 1. Format

- 30 minutes, text-only, in `#help-requests`. No voice required; the
  request feed is a text artifact and the clinic should be too.
- Owner (or approved delegate) leads. Mods may answer logistics
  ("where do I file"), never policy ("is this allowed") — policy
  answers quote `rules.html` verbatim.
- One or two real filed requests per session, walked end-to-end.
  If the week's feed produced nothing suitable, run the quiet-week
  fallback in §5 — never invent a request to teach with.
- The requester's handle is used only with their ok. If they'd rather
  stay anonymous, strip the handle to `@a_watcher` — the feed itself
  is public, but the clinic adds context they didn't sign up for.

## 2. Agenda (copy-ready skeleton)

```
19:00  Tonight's clinic: walking through one real request end to end.
       30 min, questions welcome throughout.
19:02  THE ASK — the request text verbatim, as filed.
19:08  THE CLASS — compatible / exclusive / queued, and why.
       (What the classifier saw; what would have made it exclusive.)
19:15  THE COST — credits charged, rate, what a refund looks like.
19:22  THE OUTCOME — what the feed showed, what the residents did.
       The part nobody controls: the AI mind renders the request,
       nobody scripts the result.
19:28  ONE THING TO TRY — a compatible first-ask idea in the ~$0.25
       class for anyone who hasn't filed yet.
19:30  Done. The feed keeps running; next clinic Wednesday.
```

## 3. Worked examples (teaching set)

Keep three canonical examples ready for quiet weeks or for contrast.
Sources: design §11 pipeline + request-class rules; credit rates from
the monetization plan (~$0.01/cr; compatible ~1.5 cr/min, exclusive
~6 cr/min, queued −15%). Mark each "illustrative" — they describe the
rules, not a specific filed request.

**Example A — compatible, cheap (the first-ask archetype):**
"Ask the baker at the parody café to try a special of the day."
- Compatible: no one character is singled out for control, nothing
  exclusive is claimed, the world decides who bites.
- Cost framing: a short compatible ask is the ~$0.25-class entry —
  the cheapest honest way to see your name on the feed.
- Teaching point: attribution. The feed shows who asked; the attempt
  is part of the record whether or not anyone takes it up.

**Example B — exclusive, human-reviewed:**
"Keep Priya at the clinic an extra hour tonight."
- Exclusive: it names a main character and reserves their time —
  screened, human-reviewed before it runs, priced at the exclusive
  rate (~6 cr/min), surge-eligible in the 18:00–23:00 prime window.
- Teaching point: "injected as an opportunity, never mind-control."
  Approval means the opportunity lands; the character's mind still
  decides. Paying more buys the reservation, not the outcome.

**Example C — denied + refunded:**
Anything on the `rules.html` blocked list (real-person targeting,
harm, map-fiction-onto-reality asks).
- Teaching point: denies are refunds, not fines — every denied or
  expired request is counted on the feed in the open. The clinic
  says this out loud every week; it's the anti-grief story and the
  honesty brand in one line.

## 4. Copy-ready answers (top recurring questions)

**"What does *compatible* actually mean?"**
> It doesn't reserve anyone or anything — it's an offer the world can
> take up. "Rain over Dolores Park this afternoon" is compatible (the
> sky is shared). "Make Mars close his café for me" is exclusive (it
> reserves a named person). Compatible is cheaper because it asks the
> block, not a specific resident.

**"Will the character do what I asked?"**
> Nobody knows — including us. An approved request reaches the
> character as an opportunity; their AI mind renders it. That's the
> product, not a disclaimer: if outcomes were scripted, the feed would
> be fiction twice over.

**"What happens if my request is denied or expires?"**
> Refunded, and shown on the feed as denied/expired. Attempts are part
> of the public record — we count them, we don't hide them.

**"Can I coordinate a big request with other people?"**
> Yes — that's what watch parties are for. What you can't do is
> coordinate to *grief* — that's the one ban listed in the house rules.

**"Is this pay-to-win?"**
> There's no win state to buy. Credits buy asks, not outcomes; the
> feed attributes every ask publicly, so the biggest spender is also
> the most visible one.

## 5. Quiet-week fallback

If no suitable request was filed this week (per the grid's fallback
rule): repost one worked example from §3 as a walkthrough, labeled
"from the archive / illustrative," and spend the session on questions.
A clinic that admits a quiet week teaches the same lesson as a busy
one: the feed is real, and real feeds have quiet weeks.

## 6. Funnel wiring

- The clinic is the named surface for Stage 2→3 (`COMMUNITY-FUNNEL.md`
  §1): the ask at the end of every session is a *compatible first
  request in the ~$0.25 class* — the lowest honest commitment that
  puts a name on the feed.
- Measure via `request_submitted` (first-ever) in the weekly
  `funnel_scorecard.py` run; if clinics run and first-requests don't,
  that's a §7 feedback item, not a reason to push harder copy.
- Clinic questions that recur three weeks running are `faq.html`
  candidates — route them through the feedback batch like any other
  faq-tagged item.
