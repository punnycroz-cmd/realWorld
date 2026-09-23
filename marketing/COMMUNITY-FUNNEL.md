# Community Funnel — Real World ("The Mission")

**Version:** v9 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Scope:** spectator → community → player pipeline: surfaces, content strategy,
moderation, creator outreach, feedback loop, launch infrastructure.
**Authority:** design doc `rw-game-design-2026-09-22.md` (esp. §5 participation,
§11 moderation pipeline), market report §2/§7, monetization plan.
**Status legend:** DRAFTED = file exists and is fill-in-ready · SPEC = designed,
needs build · OWNER-GATED = requires an explicit owner decision before use.

---

## 1. The funnel

The product's free core is *watching*, so the funnel starts a stage earlier than
most games: at the spectator, not the player.

```
STAGE 0   STAGE 1     STAGE 2        STAGE 3       STAGE 4        STAGE 5
Visitor → Watcher  →  Community  →  Requester  →  Resident    →  Advocate
(site)    (free        member       (first paid    (owns a       (brings
          observe)     (Discord/     request)      character +   others in)
                      recap reader)               lease)
```

| Stage | Conversion ask | Primary metric (see ANALYTICS.md) |
|---|---|---|
| Visitor → Watcher | Open the neighborhood / demo page | `watch_start` per unique visit |
| Watcher → Community | Join Discord, read a weekly recap | recap open rate, Discord joins/wk |
| Community → Requester | File a first cheap *compatible* request (~$0.25 class) | `request_submitted` (first-ever) |
| Requester → Resident | Create a character, sign a lease | `character_created` |
| Resident → Advocate | Recap mentions, clip shares, referral | UTM-tagged inbound shares |

**Design rules for the funnel:**

- Every rung must be reachable *within one session of curiosity* (market report
  §3 item 4). No rung requires a download, an account with a password manager,
  or a purchase before the previous rung is satisfying.
- The public request feed is the funnel's connective tissue: it is watchable
  content (free), proof that agency is real (conversion evidence), and the raw
  material for the weekly recap (retention). Market copy should treat the feed
  as a product surface, not plumbing.
- Never gate watching behind signup. Observation free and frictionless is the
  differentiator vs. InZOI (paid EA) and every "join the metaverse" funnel that
  died on the signup wall.

---

## 2. Surfaces and their jobs

| Surface | Job in funnel | Status |
|---|---|---|
| `site/` landing pages | Stage 0→1: explain, show real captures | BUILT |
| `site/community.html` | Stage 1→2: describe the community offer honestly pre-launch | BUILT (v9) |
| `site/demo.html` (future, roadmap v12) | Stage 0→1 front door: live spectator view | SPEC — needs game build |
| Weekly recap post | Stage 1→2 retention engine | TEMPLATE EXISTS (`social/drafts/recap-format.md`) |
| Discord server | Stage 2 home: feed discussion, watch parties | OWNER-GATED (create at go) |
| itch.io devlog | Long-form Stage 1→2 + SEO | DRAFTED cadence, OWNER-GATED account |
| Shared inbox (`devin-reviews/sf-shared-inbox.md`) | Stage 2→dev feedback loop | LIVE (internal) |

Deliberately absent: subreddit (we can't mod what we don't seed — revisit at
day-30), forum software (Discord + devlog covers the need at launch scale),
newsletter (no email infra budgeted; recap posts carry the same job).

---

## 3. Discord structure (create-at-go spec)

One server, minimal channels. A quiet 40-channel server reads dead; a busy
6-channel server reads alive.

**Setup checklist (owner-gated, ~1 session):**
1. Create server "Real World — The Mission". Community server toggle ON.
2. Roles: `@owner` (admin), `@mod` (volunteer, appointed post-launch only),
   `@resident` (self-assign via rules acceptance — cosmetic, no gates).
3. Channels:
   - `#the-block` — general chat. The living room.
   - `#the-feed` — read-only mirror of notable public request-feed entries
     (manual curation at launch; a bot is a post-launch nice-to-have, never
     a launch dependency). This is where watchers talk about *who did what*.
   - `#watch-party` — coordinating simultaneous viewing of big requests
     (weather events, showtime requests). Voice channel `#rooftop` attached.
   - `#help-requests` — "how do I file a request / what does compatible mean"
     support. Pinned: how-it-works link + pricing link.
   - `#feedback` — bugs, suggestions. Feeds §7 loop below.
   - `#announcements` — owner-only posts; weekly recap lives here + socials.
4. Bots: none required at launch. (If raid protection becomes needed: a
   verification-gate bot is the only acceptable addition — decide then.)
5. Server rules: see §4.2.

**Naming honesty:** Discord invite links on the site stay as labeled
placeholders (`community.html` shows "opens at launch") until the owner runs
this checklist. Never link a server that doesn't exist.

---

## 4. Moderation plan

Two separate moderation scopes — keep them distinct in docs and tooling.

### 4.1 Community moderation (Discord, comments, socials)

- **Approval gate (lead directive):** nothing goes public without owner sign-off.
  In practice: recap posts, announcements, and replies about pricing/policy are
  drafted in `marketing/social/drafts/` and posted by the owner (or approved
  delegate) only. Mods can answer questions, never set policy.
- **Rules (draft for `#the-block` pins):**
  1. No real-person targeting — the characters are fictional; treat them as
     fiction, treat members as people.
  2. No spoilers-by-doxxing — don't try to map fictional addresses onto real
     residents' doors (design doc §4 exists precisely to prevent this).
  3. No hate, harassment, spam, scams. No "credit trading" offers — credits
     are non-transferable; anyone offering to sell them is scamming.
  4. No AI-prompt-injection bragging rights: discussing request mechanics is
     fine; coordinating to grief the sim is a ban.
- **Escalation ladder:** warn → 24h timeout → ban. Mods log bans in a private
  `#mod-log` channel. Owner reviews weekly during launch month.
- **Volunteer mods:** recruit *from active members after* day-14, never before —
  early appointees are picked blind. 2–3 max at launch scale.

### 4.2 In-world moderation (request feed / UGC filtering)

Per design doc §11 — the community-facing summary the site/mods can quote:

- Moderation applies **only to player requests** (intent screening on request
  text) plus a legal backstop. Emergent AI behavior is inviolable; in-world
  consequences (reputation, shunning) handle ~99% of edge cases.
- Pipeline: auto-classify (exclusive/compatible/queued) → intent screening on
  request text → human review for exclusive/gray-zone → inject-as-opportunity
  (never mind-control) → execute with hard cap → public feed with attribution.
- **Feed-display moderation:** because the request feed is public, displayed
  request text needs a display-side filter (profanity/PII/hate) before render —
  separate from the intent classifier. Owner decision needed at build time on
  whether filtered text shows as redacted or is withheld entirely.
- **Attribution + reputation:** every paid intervention is attributed on the
  feed. Grief attempts are therefore public — community shaming plus cooldowns
  plus surge pricing is the anti-grief design; mods don't need a separate
  in-world tool beyond the owner's existing revoke switch.
- Marketing's promise rule: site copy says "requests are screened" — it never
  promises real-time moderation, never guarantees response times.

---

## 5. Content strategy & cadence (what gets produced, when)

| Cadence | Item | Source material | Template |
|---|---|---|---|
| Weekly (Sun) | "This Week on the Block" recap | public feed + observed events | `social/drafts/recap-format.md` |
| Bi-weekly | Devlog post (itch devlog + blog slot) | track inbox entries, sanitized | `templates/` devlog template (v4 backlog — see §9) |
| Bi-weekly (offset) | Cast spotlight card | cast bible (public-profile fields only — never secrets) | `social/drafts/cast-spotlights.md` |
| Event-driven | Request-feed highlights clip | live captures during notable requests | `social/drafts/devlog-clips.md` |
| Launch day | Announcement thread | — | `social/drafts/launch-thread.md` |
| Launch week | Seeded discussion questions | — | `social/drafts/seeded-questions.md` |

**Cadence rule:** under-promise on schedule. A weekly recap that never misses
beats a daily cadence that dies in week 3. Quiet weeks publish anyway — "a
quiet week on the block" is itself content and reinforces the honesty brand.

**Honesty rules for all community content:**
- Recaps report only real feed/ledger events; invented drama is fiction we
  labeled, never reporting we faked.
- Cast spotlights use public-profile facts only. Drama seeds and secrets are
  redacted even from marketing — leaking them breaks the Truman contract
  (design §7).
- Parody business names only in all copy (user decision 2026-09-22).
  Canonical names are now available from the world track's cast index
  (Mudhaus Coffee, El Farolote, Flying Pannier, Auerbach Hardware);
  `world/businesses.md` becomes the authority when published.
- No fake testimonials, no invented community quotes, ever.

---

## 6. Creator / streamer outreach

**Thesis (market report):** a watchable world is a streamable world. Twitch
Plays Pokémon proved 1M+ people will watch collective agency; our feed makes
every viewer a potential participant — the streamer's chat can *see* requests
live. That is the pitch.

**Target creator profile (not a contact list — categories only):**
- Small/mid variety streamers (5k–50k) who run "chat decides" formats.
- Life-sim YouTubers (Sims/Paralives/InZOI coverage channels).
- Urban-sketch / city-lover niche (the real-Mission angle).
- AI-skeptic commentators — offer honest access, not spin.

**What we offer creators (all free, no paid promo pre-launch):**
- Early spectator access when the build exists (OWNER-GATED).
- A "creator request credit" grant for coverage streams — owner decides amount;
  must be disclosed by creator as provided (standard disclosure applies).
- Embeddable recap assets (screenshots from `press-kit/`, shot list in
  TRAILER-PLAN.md for b-roll framings).

**Rules:** no exclusivity asks, no scripted takes, no review embargo beyond a
mutually agreed go-live time. Creators see the same public feed as everyone —
that transparency *is* the pitch. Outreach email drafts live in
`PRESS-OUTREACH.md` (press angles); a creator-specific variant is a day-7
task in LAUNCH-CHECKLIST.

---

## 7. Feedback loop → dev tracks

`#feedback` + social replies triage weekly:

1. **Collect** — community lead (owner at launch) tags items: bug / balance /
   content-wish / moderation-issue.
2. **Sanitize** — strip handles/PII; a complaint about "the request queue"
   becomes a one-line item.
3. **Route via shared inbox** — append a `[marketing-community]` entry to
   `devin-reviews/sf-shared-inbox.md` addressed to the relevant track:
   - request-system friction, queue/classification confusion → game-systems
   - character/business naming, world content wishes → world-builder
   - visual/camera issues seen in captures → art
4. **Close the loop** — when a shipped change traces to community feedback,
   say so in the recap ("you reported, it's fixed"). This is the cheapest
   retention mechanic that exists.

**Standing feedback asks to seed in #feedback pins:** Is the feed readable to
a newcomer? Did your first request feel like directing a scene or filing a
ticket? (Market report flags this UX question as existential.)

---

## 8. Launch infrastructure (community surfaces only)

| Need | Options | Decision status |
|---|---|---|
| Discord server | free tier; community toggle | OWNER-GATED creation, §3 checklist |
| Devlog host | itch.io devlog (bundled with store presence) | OWNER-GATED account |
| Feed→Discord mirror | manual curation at launch; bot post-launch | SPEC — not a launch dep |
| Moderation tooling | Discord native + rules channel | SUFFICIENT at launch scale |
| Status/comms channel | `#announcements` + recap honesty | BUILT into plan |
| Analytics on joins | Discord member count, manual weekly note | feeds ANALYTICS.md weekly report |

No new spend required for community surfaces at launch. Payments, site
hosting, and game hosting are covered in LAUNCH-CHECKLIST gates, not here.

---

## 9. Day-0 / day-7 / day-30 community tasks

- **Day-0:** run §3 checklist; pin rules + feedback asks; post welcome note;
  publish first recap only if a pre-launch feed existed (else "week zero"
  post). Verify `community.html` invite link swap (placeholder → real).
- **Day-7:** first full recap; creator-variant outreach draft; triage first
  `#feedback` batch into shared inbox; assess #the-feed manual-mirror load.
- **Day-30:** mod recruitment decision; cadence retro (did weekly hold?);
  subreddit/forum revisit; funnel metrics review vs. §1 targets.

## 10. Open dependencies

- Parody business-name list (world track, `world/businesses.md`) — four
  canonical names already in use via the cast index (Mudhaus Coffee, El
  Farolote, Flying Pannier, Auerbach Hardware); sweep remaining generic
  descriptors when the full list publishes.
- Live public feed (game-systems) — `#the-feed` mirror and recaps are manual
  captures until then.
- Spectator build / demo page (roadmap v12) — funnel Stage 1 depends on it.
- Display-side feed text filter decision (§4.2) — owner, at game build time.
