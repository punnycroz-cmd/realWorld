# Mod ramp — recruiting and onboarding community moderators

**Version:** v69 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §4.1 (community moderation ladder),
`MODERATION-PLAN.md` (canonical policy), `templates/mod-responses.md`
(canned replies).
**Status:** runnable spec; nothing executes before day-14 per §4.1, and
every appointment is an explicit owner decision.

At launch the owner is the only moderator — correct at small scale. (Mod
count scales by *action load*, not member count — the ratio rule lives in
`scale-plan.md` §2; this file owns who and how, that file owns how many
and when.) Around
day-14, if the server is active enough to need it, recruit 1–2 volunteer
mods *from the membership*. This file is the whole job: who to pick, what
to hand them, and what they may never do.

---

## 1. When to recruit (day-14 gate)

Recruit only when the day-14 check shows a real need:

- Owner can't greet/answer within a waking day for two+ days running, OR
- An incident window (watch party, launch-week spike) showed gaps, OR
- `#the-feed`/`#the-block` has member-initiated threads the owner is
  becoming the bottleneck on — a good problem, still worth staffing.

If none apply at day-14, defer and re-check at day-30 (`first-100.md` §5
retro). Zero mods at day-30 is a fine outcome, not a failure.

## 2. Who to pick

From *active* members only — never applicants-by-DM, never friends imported
for the role:

- Present since week 1–2; reads before posting; already answers newcomer
  questions correctly (the strongest signal — they're doing the job).
- Never on the escalation ladder's receiving end. No exceptions, even for
  "reformed" members — the sample size is too small to forgive on.
- Reads the fiction contract correctly: treats residents as fiction,
  members as people; has never mapped fiction onto real doors.
- Timezone spread is a bonus (coverage), never a requirement.

**Do not pick:** the most active poster (volume ≠ judgment), anyone who
asked for the role, anyone whose appeal is "I'll keep order" — the job is
*hospitality with a ban hammer they rarely touch*.

## 3. The ask (copy-ready, DM)

```
Hey <name> — you've been answering questions in #the-block better than I
could. Want the @mod role? Scope is small: welcome people, enforce the
three rules, flag the rest to me. No policy setting, no pay, no perks —
the role is cosmetic plus the ladder. Totally fine to say no; I'll keep
appreciating the answers either way.
```

If they decline, that's final — no recruiting pitch, no second ask.

## 4. Onboarding checklist (one short session)

- [ ] Role `@mod` granted; they re-read the three rules + `rules.html`.
- [ ] Walk the escalation ladder (warn → 24h timeout → ban) and the
      **log-everything** rule: every action gets a `#mod-log` line.
- [ ] Point them at `templates/mod-responses.md` — canned replies exist
      for the recurring situations; they may adapt tone, never substance.
- [ ] Scope talk (§5) — what they decide vs. what they escalate.
- [ ] Shadow week: for the first 7 days they flag-and-suggest in
      `#mod-log` before acting on anything above a warning. Owner reviews.

## 5. Scope — what mods decide, what they escalate

| Situation | Mod acts? |
|---|---|
| Spam, scams, credit-trading offers | Yes — timeout/ban on sight, log it |
| Rule 1/2 violations (fiction→real doors, harassment) | Yes — ladder, log it |
| Request-mechanics vs grief-coordination line | Judgment call — when unsure, timeout + escalate |
| Pricing, refunds, monetization questions | Never — link `pricing.html`, escalate to owner |
| Policy anything ("why is X allowed") | Never — canned response + escalate |
| In-world request denials/appeals | Never touch — that's the game's §11 pipeline; point to `rules.html`, escalate if pressed |
| Editing/pinning `#the-feed` mirrors | Owner only — mods never curate the record |

**The one-line rule:** mods answer *questions* and enforce *the three
rules*. Everything else is an escalation.

## 6. `#mod-log` entry format

```
[<date> <time PT>] @<mod> — <action: warn|timeout|ban|note> — @<member> — <one-line reason + link/screenshot ref>
```

Owner reviews the log weekly during launch month (funnel §4.1). The log
is the audit trail for the checklist's "Discord incident" rollback row —
no log line means the action didn't happen, and it gets reverted.

## 7. Offboarding and review

- Mods step down any time, no questions — thank them publicly only if
  they want it.
- Owner may remove the role any time; say why in `#mod-log`, not in
  public, unless the removal is itself a safety matter.
- Day-30 retro (`COMMUNITY-FUNNEL.md` §9) includes a mod-system check:
  is the ladder holding? Is `#mod-log` complete? Right-size the team
  (0–3 at launch scale, never more).

## 8. What we never do

- Never pay mods, never compensate in credits (non-transferable anyway).
- Never give mods game-side powers — the owner revoke switch and the §11
  review pipeline are not community-moderation surfaces.
- Never recruit before day-14, never appoint outsiders, never let a mod
  speak as the project (owner-only announcements stay owner-only).
