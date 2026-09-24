# Regulars — the recognition layer (community-funnel Stage 2→5 glue)

**Version:** v129 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY · OWNER-GATED to run
**Status:** BUILT (spec) — nothing here runs before launch; the program activates
no earlier than day-30, after `mod-ramp.md`'s day-14 checkpoint has happened.

Every neighborhood has people who were just *always there*. The regulars
program is how the community recognizes them — visibly, honestly, and without
selling anything.

## 1. What it is (and is not)

A regular is a community member the mod team has noticed showing up: reading
recaps, helping newcomers in `#help-requests`, posting good clips, arguing
about rumors in good faith. Recognition is:

- A cosmetic `@regular` role (name color + a spot on the "regulars" section of
  the community page, with consent — see §4).
- A mention in the recap when a regular's clip or question shaped the week
  (same consent rule — first ask, then print).
- First-notice of watch parties: regulars get the `#watch-party` ping a few
  minutes early. That's it. It costs nothing and means something.

Recognition is **not**:

- Not purchasable. Credits buy requests and leases, never standing. The store
  page and pricing page already promise credits are non-transferable — this
  program must never blur that line.
- Not a reward tier. No points, no streaks, no "level up" announcements —
  streak mechanics turn watching into a chore and fake the thing the program
  is supposed to notice.
- Not early access to game features. Regulars see the same public feed and
  the same request queue as everyone; jumping the queue would break the
  attribution contract the whole product runs on (design doc §11).
- Not a path to power by itself. `@regular` is **not** `@mod`. Mod selection
  stays governed by `mod-ramp.md` — being a regular is *eligibility signal*,
  never a shortcut. A regular who wants to mod waits for the day-14+ need
  check like everyone else.

## 2. Eligibility — observable, no points

The owner (later: owner + mods) confers `@regular` during the weekly
scorecard/session review (`funnel-scorecard.md`). Signal checklist — all
observable from public channel behavior, none measured by counters:

- Has been around roughly a month (lurking counts — a regular who never posts
  but is in every watch party is still a regular).
- Helps without being asked: answers "what does compatible mean" correctly,
  points newcomers at how-it-works, shares clips that credit the moment.
- Never needed a warning (§4.1 ladder — one warn and the clock resets; a ban
  is permanent disqualification).
- Wants it. Conferral is opt-in: the mod DMs "we'd like to mark you as a
  regular — want the role?" A no is respected and not re-asked for 90 days.

Cap: no fixed number. If half the server qualifies, half the server is
regulars — scarcity is not the mechanism, honesty is. In practice at launch
scale (first-100 seeding, `first-100.md`) expect 3–8 by day-60.

## 3. Copy-ready conferral + retirement

**The ask (DM, from owner/mod):**
> Hey — you've been around basically since the block opened and you keep
> making this place better (the request-clinic answers, that clip last
> Sunday). We'd like to mark you as a regular: a name color, early
> watch-party pings, and a spot on the community page if you want it.
> No duties attached. Want it?

**Retirement:** the role is removed for (a) a rules violation per the §4.1
ladder, (b) 60 days fully inactive — quietly, no announcement, and they're
welcomed back as a normal member, or (c) on request. Removal for (a) is
logged in `#mod-log` like any other action.

**Never do:** don't announce regulars like winners ("congrats @x!") in a
public channel without consent — some people lurk precisely because they
don't want a spotlight. Private ask first, always.

## 4. The site hook

`site/community.html` carries a "Regulars" line inside the Join rung and a
short honesty statement — *names appear only with consent; the role can't be
bought*. When the server is live and the first regulars consent, their
display names (Discord handles, nothing else) are edited into a list on that
section. Before that, the section says the roster opens with the community.

## 5. Why this exists (funnel logic)

Stage 5 (advocate) currently runs on clips and referrals — both *output*
behaviors. Regulars is the *identity* layer: it gives a long-time watcher a
name for what they already are, which is what turns "I check the recap" into
"I should show my friend the block." It also creates the trust pool that
`mod-ramp.md` and future watch-party hosts draw from — recruited from people
already behaving like the place matters, which is the only recruitment
signal that has ever worked.

## 6. Acceptance checks

- [ ] Program doc reviewed by owner before activation (OWNER-GATED).
- [ ] First conferral uses the §3 DM verbatim (adapt names only).
- [ ] `community.html` regulars section shows consented names only; the
      "can't be bought" line stays as long as the program exists.
- [ ] Weekly scorecard review includes a 2-minute regulars scan (signal
      checklist §2) — add to the scorecard session agenda at activation.
