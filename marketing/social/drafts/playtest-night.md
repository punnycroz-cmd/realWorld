# Community playtest night — recruitment posts + run sheet

Channel: X + Bluesky (recruitment), Discord (the event itself) · Timing:
T-7 → T-3 pre-launch, OR any post-launch feedback push · Assets: none
required — a `site/shots/` still for reach
Gate: **double owner-gate.** (1) Posting the invite is owner-gated like
everything else. (2) The event itself only exists if the owner decides
to distribute the harness — `world/playtest.html` is file://-safe (open
in a browser, no server, no build), so "shipping" it = attaching one
HTML file. Do NOT promise a hosted build, an NDA beta, or accounts —
none of those exist.

Why this file: the playtest harness is the cheapest honest preview we
have — it simulates the real product contracts (request pipeline,
moderation queue, feed vocabulary, character creation) without
pretending to be the live sim. A structured playtest night turns
community energy into filed findings instead of vibes. Canon source:
`world/playtest.md` (world-v23).

---

## Recruitment posts (drafted, fill {{PLACEHOLDERS}} at send)

**Invite (T-7)**
> Want to break our game before it exists? We're running a small
> playtest night on {{DATE}} — you'll walk the request queue, file a
> request that gets denied on purpose, and try to find copy that lies.
> ~1 hour, in Discord, four tester spots. Reply or DM if you want one.
> Honest version: it's a contract harness, not the live sim — you're
> testing the rules and the words, not the AI.

**Reminder (T-2)**
> Playtest night is {{DAY}}. Still {{N}} spots. You get the full
> harness file, a scenario card, and a facilitator (us). What we're
> watching for: whether "watch free, pay to act" is legible in 90
> seconds, and whether a denied request feels fair. Bring opinions.

**After-action (T+1)**
> Playtest night results: {{N}} testers, {{N}} findings filed ({{N}}
> blockers/majors, {{N}} minors, {{N}} "huh, interesting"). Highlights:
> {{one real finding in one sentence}}. All of it goes into the triage
> pile — thanks to {{handles, only with permission}}.

Rule for the after-action post: findings are real or the post doesn't
run. Never soften a blocker for the feed; if the night found a boundary
break, saying "we found a real one and here's the fix coming" is a
stronger post than pretending the harness was clean.

## Run sheet (facilitator = owner or dev account)

1. **T-2:** pick 4 testers from replies; prefer mix — one sim player,
   one SF local, one skeptic, one creator. DM each the harness file +
   the one-line ask: "open the HTML file, pick your assigned role."
2. **Roles** (from `playtest.md` §2): Spectator (free-tier only),
   Player (files requests, hires a character), Reviewer (wears the mod
   hat on the queue). Facilitator runs the smoke set.
3. **Scope — the smoke pass (~50 min):** PT1 (cold read: what is this?),
   PT4 (deny paths — every tester should hit "request not approved" +
   refund), PT7 (boundary sweep), PT21 (`node world/audit.js` — dev
   side, narrate the result).
4. **During:** testers mark checkpoints PASS/FAIL in the harness and log
   findings with severity. Facilitator watches the watch-list:
   first-screen clarity, review trust, deny dignity, scope leaks.
5. **Close:** each tester hits **Export report (JSON)** and DMs it back
   (or pastes **Copy report (Markdown)**). Facilitator imports all
   reports into one session — the cohort panel flags disagreements
   between testers, which are the best findings.
6. **After:** findings route per `playtest.md` §5 — world content to the
   world track via inbox, site-copy contradictions to us, queue-model
   notes filed as merge notes. Facilitator appends a `[world-playtest]`
   note to the shared inbox with blockers/majors only.

## Hard rules for the night
- **Say what it is:** a simulation of product contracts — credits are
  fake, the AI is not running, multiplayer is simulated. The invite post
  already says this; repeat it in the Discord welcome.
- **Five invariants are the test** (from `playtest.md` §1): no
  possession of the 8 mains, moderation scopes to request text only,
  parody business names only, denies always refund, prices match the
  monetization plan. If a tester finds a violation, that's a blocker —
  celebrate finding it.
- **No recording promise we can't keep:** testers may clip the harness
  and post it *if* they label it "playtest harness, not live gameplay."
  Ask in the welcome; don't police beyond a correction reply.
- **Don't promise fixes on the call.** "Filed" is the answer, always.
- **Time-zone reality:** 50 min is the promise. If the night runs long,
  end at the hour and collect reports anyway.

## If nobody signs up
Post the solo variant instead of cancelling: "Playtest night got
deferred — meanwhile, here's the 90-second version of what testers will
poke at" + a clip of the request flow. An empty room is content (§7
feed-honesty rule applies to events too).
