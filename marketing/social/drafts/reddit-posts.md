# Reddit posts — dev-authored, self-promo rules compliant

Channel: Reddit · Timing: launch week only · Assets: linked per post
Gate: posts as the developer, titled as the developer, only in subs that
allow self-promotion, on their self-promo days. No alts, no bought votes,
no "found this cool game." See SOCIAL-LAUNCH-PLAN §7.

`{{URL}}` = landing site. `{{DEMO_URL}}` = spectator view. Every link gets
`utm_source=reddit&utm_medium=organic&utm_campaign=launch` + a per-sub
`utm_content` tag (`indiegames`, `lifesim`, `sanfrancisco`).

---

## Post 1 — r/indiegames (self-promo thread day)

**Title:**
I spent a year building a neighborhood where 28 AI residents live on one
Mission block — you can watch it free, like a feed

**Body:**
The elevator pitch is "The Truman Show, except Truman is the whole
street." Twenty-eight residents — 8 fully authored mains, 20 ambient
neighbors — work jobs, pay rent, fight, gossip, and remember what
happened to them on a procedurally rendered stretch of San Francisco's
Mission District.

The part that's unusual: watching is free, forever. The spectator view
is the front door — the whole neighborhood streams like a feed, with a
public wire of what's happening on the block.

If you want to do more than watch, you file requests — point the camera
at a corner, sponsor an event, nudge a resident's day. Every request is
public and attributed on the feed, and moderation is human-in-the-loop
for anything gray. You never puppet the main characters — the possession
ban is a design rule, not a paywall. If you want a life on the block, you
create and hire your own character; only yours answers to you.

It's a development build and I'm posting it myself, so be as harsh as
you want: {{URL}}

Watch link (free, no account): {{DEMO_URL}}

Happy to answer anything about the sim, the renderer (hand-rolled canvas,
no engine), or the moderation model.

**Flair:** Indie Dev / self-promo per sub rules
**First-comment duty:** reply to every top-level comment for 6 hours.
Money questions get the pricing post link + the honest answer, not a
euphemism.

---

## Post 2 — r/lifesim (launch week, different angle)

**Title:**
A life-sim where you're not the god or the protagonist — you're the
audience (free spectator mode)

**Body:**
Most life sims hand you a family and a cursor. Real World hands you a
block that's already living — 28 residents with jobs, leases, feuds, and
memories — and lets you watch. Free tier is the full spectator view; no
account to just look.

The sim runs a real rent cycle (leases, grace periods, rent-board
disputes), a rumor system where gossip distorts as it travels, and a
public feed where every player intervention is visible and attributed.
You can buy agency — camera requests, event sponsorships, a character of
your own — but you can't buy rent; that's game dollars, earned in-world,
owed in-world.

What I'd love from this sub specifically: what would you *watch for*?
I'm tuning the spectator experience (feed density, follow-a-resident,
weekly recaps) and the life-sim audience is the harshest judge of
whether the lives feel real.

{{URL}} — the "how it works" page is the honest version.

**Flair:** per sub rules (likely "Other" or dev-day thread)
**Do not:** cross-post verbatim to r/TheSims or r/inZOI — those subs ban
self-promo; comment-only participation there, and only where invited.

---

## Post 3 — r/sanfrancisco (local angle, one post only)

**Title:**
I built a fictional Mission block — real streets, parody storefronts,
28 invented neighbors — and you can watch it like a webcam

**Body:**
It's a stretch of the Mission rendered procedurally — Dolores fog, gable
roofs, sodium lamps at dusk — populated by fictional residents. Every
business is a parody name (Mudhaus Coffee, Taqueria El Farolote, The 600
Club — no real shops are in it), and every person is invented, but the
streets and landmarks are the real ones.

It's a game in an odd sense: you watch for free, and if you want in, you
file requests the whole block can see, or create a resident of your own.
Think neighborhood soap opera that runs itself.

Not looking for anything from this sub except locals telling me what I
got wrong about the light. {{URL}}

**Flair:** check current rules; if self-promo is disallowed entirely,
SKIP this post rather than force it — the local angle also works as a
comment on relevant threads.
**Landmine rule:** never claim the residents resemble real people, never
reference real businesses even to say "we parodied X," never geolocate a
character to a real address. Parody names only, per the canonical list
(world/businesses.md → parody-names.json).

---

## Reply rules for Reddit specifically

- Corrections > defenses. If a commenter catches an inaccuracy, fix the
  copy everywhere it appears, then reply with the fix. Never argue.
- "This is just Truman Show" → agree and add one concrete difference
  (whole street, public attributed requests, possession ban).
- "AI slop" → one honest paragraph: authored characters, hand-rolled
  renderer, the LLM/agent layer is the how not the pitch. Don't litigate.
- Anything about money → numbers + PROPOSAL label + pricing post link.
- Never DM anyone from Reddit. Never ask for upvotes. Never link a
  Discord that doesn't exist yet.
