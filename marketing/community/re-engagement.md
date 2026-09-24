# Re-engagement — the lapsed-member path

**Version:** v159 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent specs:** `COMMUNITY-FUNNEL.md` (the funnel, §1; honesty rules,
§5), `scale-plan.md` (stay-small covenant), `regulars-program.md`
(recognition layer), `funnel-scorecard.md` (measurement).
**Status:** copy-ready; OWNER-GATED until the server exists.

Every funnel doc so far covers the forward path — visitor to advocate.
This one covers the leak: the member who joined, watched, and drifted.
The constraint that shapes everything below is the brand's own rule —
**the product gives people a reason to come back; the community never
manufactures one.** Re-engagement here means surfacing real hooks the
world already produces, not pinging people for their own good.

---

## 1. What "lapsed" means here (observable only)

No email list exists (deliberate — COMMUNITY-FUNNEL.md §2), so lapse is
measured only on surfaces we actually run:

| Signal | Observable on | Lapse reads as |
|---|---|---|
| Last message / reaction | Discord native | 30+ days silent |
| Recap thread engagement | `#announcements` replies/reactions | 3+ consecutive recaps with no engagement |
| First-request never filed | `request_submitted` absence in scorecard | Stage 2 stall — clinic is the fix, not a ping |
| `@regular` gone quiet | regulars roster | same 30-day read, handled per §4 |

Never tracked: read-receipts, DM opens, lurker detection. A member who
only ever reads recaps is a *successful* member per the stay-small
covenant — silence alone is not a problem to solve. Lapse flags exist
to decide **what we post**, never **who we chase**.

## 2. The honest hooks (all real, all already produced)

The world generates re-entry reasons continuously; the job is
formatting, not inventing:

- **Open rumors.** The recap's unconfirmed hook is the canonical
  cliffhanger. When a rumor carries week-to-week, one line in the next
  recap ("still unconfirmed — the block is still arguing") is the
  whole re-engagement spend.
- **Watch-party triggers.** `watch-party-playbook.md` §1 events are
  the legitimate "@everyone-adjacent" moments: something is *about to
  happen on the feed*. One announcement post, then silence.
- **"You reported, it's fixed."** The §7 close-the-loop line doubles
  as re-engagement for the reporter — say the handle only if they
  reported publicly; sanitize otherwise.
- **Seasonal sim beats.** Fog events, storms, showtime requests — the
  programming calendar leaves room for these; they're the honest
  "something changed" posts.
- **Recap continuity.** Multi-week arcs (a lease cycle, a venue saga)
  get a "previously" line in the recap — returning members can catch
  up in one paragraph instead of feeling locked out.

## 3. Never-do list (the covenant applied to lapse)

- No streak mechanics, attendance counters, or "don't lose your X."
- No "we miss you" DMs — ever. No re-engagement DMs at all; every
  hook posts to a channel, never to a person.
- No lapse-based pings, role-removal threats, or activity requirements
  (including for `@regular` — the role is a record of having been
  seen, not a subscription to keep).
- No inflated drama to lure people back; a quiet stretch is reported
  as a quiet stretch, and that's the pitch ("the block is real —
  that's why it has quiet weeks").
- No guilt framing ("the block misses you"). If the honest sentence
  is boring, we post the boring sentence.

## 4. The playbook

**Weekly (with the scorecard run):** no action item — lapse data is
context for interpreting stage conversion, not a to-do list. If
recap-engagement drops three weeks running while joins hold, that's a
content-quality signal → `community/funnel-scorecard.md` retro, not a
re-engagement campaign.

**When a real hook lands (open rumor heating up, watch-party trigger,
a credited fix):** post it in `#announcements` or the feed thread in
the normal formats. That *is* the re-engagement mechanism — the same
post serves current and lapsed members alike.

**Member-initiated return:** someone posts after weeks away — the
welcome-back norm is a normal reply to what they said, not a
"welcome back!" callout (singling out absence is mild guilt; the
covenant applies). If they ask what they missed: the answer is the
recap archive link + the current open-rumor thread. One reply, done.

**`@regular` gone quiet:** nothing to do. The roster lists who earned
it; it doesn't delist the quiet. If they return, the role never left.

## 5. Wiring & measurement

- Scorecard: add one manual weekly count — *returning posters*
  (members whose first post in ≥30 days landed this week). It sits
  next to the Stage-2 number in `funnel-scorecard.md`'s weekly block;
  it's a health line, never a target.
- The only "campaign" this file permits: when a genuinely big feed
  event resolves a multi-week arc, the recap's headline + one social
  post is the whole push. Scheduled "win-back" sends don't exist here.
- If lapse becomes structural (server quiet for a month), the
  downward path is `scale-plan.md` §4 — consolidate honestly rather
  than re-engage artificially.
