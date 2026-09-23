# Incident & contingency comms — pre-drafted, owner-gated

Channel: X primary, mirrored to Bluesky + a pinned note on the site if the
incident lasts >2 h · Timing: within 30 min of a confirmed problem
Gate: facts only — never post "we're investigating" before confirming
there's something to investigate. Blameless, specific, no promises on
timing beyond "we'll update by {{TIME}}."

The delay variant for launch morning lives in `launch-thread.md`; this
file covers everything after the door is open.

---

## 1. Site/spectator down

> The block is fine; the window into it is broken. The site is down on
> our end — the sim keeps running. Fix is in progress; next update by
> {{TIME}}. If you were mid-request, no credits were taken for anything
> that didn't land.

Rules: "the sim keeps running" is only true if it is — if the sim itself
halted, say "the block is paused, nothing is lost" instead. Never imply
world persistence we don't have.

## 2. Request feed abuse wave (visible griefing)

> You've probably seen it on the feed: someone filed {{N}} requests
> trying to turn the block into a billboard. All of them hit the review
> queue, none ran, all credits refunded — that's the system working as
> designed, and now it's public proof. Their account is flagged. The
> block is itself again.

Rules: post only after moderation actions are actually logged (per
MODERATION-PLAN appeal_flow). Never name or shame the account handle —
the feed already shows attribution; we don't amplify it. If zero
requests were auto-denied, don't claim the wall worked; say which part
(human review) caught it.

## 3. Moderation decision blowback

> A request was {{approved/denied}} yesterday that people are calling
> out. Here's the call we made and why: {{2 sentences, reason code in
> plain English}}. If you think it's wrong, the appeal path is open —
> 72 hours, a different reviewer, and a reversal never costs the denied
> party anything.

Rules: cite the reason code's plain-language meaning, not the code
string. Never argue precedent in replies — one statement, then the
appeal path. Denied requests are always refunded; say so every time.

## 4. "Your characters are suffering / this is creepy" pile-on

> Fair question, straight answer: they're authored fictional agents —
> personalities, memories, routines — not minds. The possession ban
> exists to protect their storylines from players, not their feelings
> from you. If you want the design-doc version, it's public:
> {{URL}}/how-it-works.html

Rules: honest beats cute. Never "they're happy, don't worry" — that's
the creepy answer. One reply per thread; don't chase quote-posts.

## 5. Pricing accusation ("it's a slot machine / NFT scam")

> The money model in one line: credits buy agency, not rent, not loot.
> There's no cash-out, no marketplace, no randomized rewards — a credit
> is worth about a cent (provisional pricing) and buys a defined request
> that's publicly visible on the feed. Full breakdown: {{URL}}/pricing.html

Rules: always lead with the three nevers (no cash-out, no RMT, no loot
boxes) — they're the strongest true sentence we have. PROPOSAL label on
every number. Never promise future pricing.

## 6. Delayed feature / missed date

> We said {{THING}} by {{DATE}}. It's not ready, and we'd rather be late
> than fake. New target: {{DATE|or "we'll say when it's real"}}. What
> shipped instead this week: {{one concrete thing}}.

Rules: every delay post pairs the slip with a shipped fact. Never use
"soon." Never promise a new date we haven't internally committed to.

## 7. Silence is also an option

For single hostile comments with no traction: the reply bank covers
good-faith versions of every attack above. A bad-faith one-off gets
nothing — the feed's own transparency is the argument. Spend the reply
budget on the people asking real questions.
