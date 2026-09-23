# Social Launch Plan — Real World ("The Mission")

**Status: v64 — launch-ready drafts + reply bank + capture plan + Reddit
posts + incident comms + rent-week arc + alt-text bank + Archive arc +
community playtest night + Move-In Week arc + automated pre-send checker
(`tools/social_check.py`), 2026-09-24.
LOCAL ONLY.** Nothing in this
plan has been posted, scheduled, or registered. Every account creation, every
post, and every DM is owner-gated: a human flips the switch, this file is the
runbook they flip it with. All copy verified against the locked design doc
(`devin-reviews/rw-game-design-2026-09-22.md`) and the monetization plan
(`rw-monetization-plan-2026-09-22.md`, numbers marked PROPOSAL).

Companion files:
- `social/drafts/` — the post bank (copy-paste ready, placeholders marked)
- `social/capture-plan.md` — which live moments to clip and how (v22)
- `STORE-COPY.md` — canonical taglines and descriptions (do not fork wording)
- `PRESS-OUTREACH.md` — press runs parallel to social; same embargo rules
- `BRAND.md` — canonical voice/palette; §8 here is the social-specific subset

---

## 1. Strategy in one paragraph

Real World's marketing asset IS the product: a watchable neighborhood. Every
social beat is built to move a scroller one step — **see a moment → watch the
block live → file a request → move in**. We never ask people to imagine the
game; we show them a resident mid-drama and let the feed do the rest. The
free-watch tier is the top of funnel, so every post's job is to earn a click
to the spectator view, not to sell credits. Credit spend happens after the
world has already hooked them.

## 2. Channel strategy

| Channel | Role | Why | Cadence | Owner-gated? |
|---|---|---|---|---|
| **X/Twitter** | Primary. Announcement thread, devlog clips, request-feed screenshots, banter with followers-as-viewers | Where sim/indie/gamedev audiences live; threads carry the concept | 1/day baseline, 3–5 on launch day | Yes |
| **TikTok** | Reach engine. 15–45s captioned clips: "a resident did X while nobody watched" | Short-form clips of emergent behavior are the product's best ad; algorithm finds niche | 3–5/week | Yes |
| **YouTube** | Trailer + Shorts mirror + devlogs | Trailer lives here permanently; Shorts reuse TikTok cuts | 1 trailer, 1–2 devlogs/mo, Shorts mirror | Yes |
| **Bluesky** | Community mirror for the indie/games crowd that left X | Cheap cross-post, disproportionate dev-community reach | Mirror X, minus reply threads | Yes |
| **Reddit** | Seeding only — r/indiegames, r/lifesim, r/SimDemocracy-adjacent, r/sanfrancisco (local angle) | High-value feedback, zero tolerance for astroturf — see seeding rules §7 | 2–3 posts total, launch week | Yes |
| **Discord** | Retention, not reach. Server spec lives in the future COMMUNITY-FUNNEL doc | Where viewers become regulars; request-feed discussion hub | Always-on once open | Yes (server creation) |
| **itch.io devlog** | Storefront-native updates | itch surfaces devlogs to followers; every social post links back | 1/week | Yes |
| **Instagram Reels** | Optional mirror of TikTok cuts | Only if owner wants it; lowest priority | Mirror only | Yes |

**Explicitly not:** Facebook/Threads (wrong audience for v1), LinkedIn,
paid ads (none planned; all organic), Twitch streaming by us (creators
stream *us* — see §7).

## 3. Account setup checklist (all owner-gated)

Nothing here has been done. Each item is a checkbox for the owner.

### Handles & branding
- [ ] Secure handle `@realworldgame` (or best available) on X, TikTok,
      YouTube, Bluesky, Instagram. Consistent name > perfect name.
- [ ] Display name: **Real World** · bio: **Twenty-eight lives on a real
      Mission block. Watch free.** + site URL (STORE-COPY tagline bank §1.1).
- [ ] Avatar: `site/assets/logo-icon.png`; banner: `site/assets/keyart-16x9.png`
      (already launch-size for YouTube/X headers; crop per platform spec).
- [ ] Link every profile to the landing site `/?utm_source=<channel>&utm_medium=bio&utm_campaign=launch`
      (UTM conventions in §9).
- [ ] Discord server: create per COMMUNITY-FUNNEL spec when it lands; until
      then, "Discord coming soon" is NOT posted — say "watch free" instead.

### Housekeeping
- [ ] Enable 2FA on every account; credentials in owner password manager,
      never in this repo.
- [ ] Content approval gate: owner reviews the first 20 posts in each
      channel; after that, drafts from `social/drafts/` may post without
      re-review (they're pre-approved). New copy still needs review.
- [ ] Verify every post against the accuracy checklist (§8) before queueing.
- [ ] Scheduling tool: optional. Buffer/Mastodon-compatible drafts are plain
      text — the draft bank works pasted by hand.

## 4. The post bank (`social/drafts/`)

Pre-approved drafts. `{{PLACEHOLDER}}` = fill at send time. Each file lists
its channel, timing slot, required asset, and character-count check.

| File | Contents | Count |
|---|---|---|
| `launch-thread.md` | X announcement thread (8 posts) + Bluesky condensed version + pinned-post variant | 3 |
| `cast-spotlights.md` | 8 cards, one per main character, built from the cast bible — spoiler-safe (see note) | 8 |
| `devlog-clips.md` | 6 captioned clip scripts for TikTok/Shorts keyed to existing v40 captures | 6 |
| `recap-format.md` | "This Week on the Block" template — the weekly retention post, filled from the public feed (site long-form version: `templates/weekly-recap.md` on `journal.html`) | 1 template + 1 example |
| `pricing-post.md` | The honesty post: "what a dollar buys" — turns the credit model into a trust signal | 1 |
| `seeded-questions.md` | 10 discussion starters for Discord/Reddit after launch | 10 |
| `reply-bank.md` | Pre-approved answers to the 15 predictable comment types (v22) | 15 |
| `profile-copy.md` | Per-platform bios, pinned posts, video descriptions, tag sets (v22) | 5 platforms |
| `reddit-posts.md` | Dev-authored launch posts for r/indiegames, r/lifesim, r/sanfrancisco + reply rules (v36) | 3 |
| `incident-comms.md` | Pre-drafted contingency posts: outage, feed-abuse wave, mod blowback, creep-factor pile-on, pricing accusation, missed date (v36) | 6 scenarios |
| `rent-week-arc.md` | 7-post narrative series on the lease/rent cycle, keyed to world-v12 canonical feed wording (v36) | 7 |
| `archive-arc.md` | 5-post "the block keeps receipts" series on The Archive — rumor outcomes, permalinks, attributed ledger (v49; post-launch only, canon: world-v20 archive-ui.md) | 5 |
| `playtest-night.md` | Community playtest night — recruitment posts + facilitator run sheet on the world-v23 harness (v49; double owner-gate) | 3 posts + runbook |
| `move-in-arc.md` | 6-post "Move-In Week" series on hiring a character onto the cast — the funnel's last step (v64; canon: world-v35 creation.json/creation-ui.md, design doc possession ban) | 6 |
| `../alt-text.md` | Alt-text bank for every shot/asset + feed-screenshot template (v40) | full asset set |

**Spoiler rule for cast spotlights:** the drama seed (Marisol = anonymous
author of "Mission Unfiltered") is *load-bearing season-one material*. Cards
may tease ("someone on this block is writing about all of them") but never
confirm. Same restraint applies to Victor's buildings — "a flyer says two
Guerrero buildings are quietly for sale" is fair; outcomes are not.

## 5. Content calendar

### Phase A — Pre-launch (T-14 → T-1)
Goal: make the concept legible before asking for attention.

| Day | Post | Channel |
|---|---|---|
| T-14 | Teaser clip: "Somewhere in the Mission, it's always Tuesday for somebody" (v47-D evening shot, slow zoom) | TikTok, X, Shorts |
| T-12 | Cast spotlight 1: Jules Park (the newcomer = the viewer's stand-in) | X, Bluesky |
| T-10 | Devlog clip 1: "How 28 characters share one block" | TikTok, X |
| T-8  | Cast spotlight 2: Marisol (tease, don't confirm) | X, Bluesky |
| T-7  | One week out: launch date + "watch free, forever"; optional playtest-night invite (`playtest-night.md`) if the owner wants a pre-launch cohort | All (invite: X, Bluesky) |
| T-5  | Devlog clip 2: the public request feed — "every intervention is visible" | TikTok, X |
| T-4  | Cast spotlight 3: Victor | X, Bluesky |
| T-3  | Press embargo lifts (per PRESS-OUTREACH); reshare coverage | All |
| T-2  | Devlog clip 3: rain on Dolores (weather requests) | TikTok, X |
| T-1  | "Tomorrow." + 15s teaser | All |

### Phase B — Launch day (T-0)
Full timeline in `launch-thread.md` header. Skeleton:

| Time (PT) | Beat |
|---|---|
| 09:00 | Announcement thread (X) + condensed (Bluesky) + trailer (YouTube) |
| 09:30 | TikTok clip 1 + Shorts mirror |
| 11:00 | Screenshot set: the block at launch hour |
| 13:00 | First cast spotlight rerun (Jules) + "watch now" link |
| 15:00 | Request-feed screenshot: first real player request (if any — see §7 honesty rule) |
| 18:00 | Evening shot + "the block doesn't sleep" |
| 21:00 | Day-one recap: first edition of "This Week on the Block" |

### Phase C — Post-launch (T+1 → T+30)
Sustainable rhythm, fed by the product itself.

- **Weekly anchor:** "This Week on the Block" recap every Sunday — built
  from the public request feed + character activity (template in
  `recap-format.md`). This is the highest-leverage recurring post.
- **Cast spotlights:** remaining 5 mains drip over weeks 1–2.
- **Devlog clips:** remaining 3 drip over weeks 1–3; then clip whatever the
  feed produces — the live-capture pipeline and the clip-worthy moment
  taxonomy are specced in `social/capture-plan.md`.
- **Rent Week arc:** T+7 → T+13, the first in-world rent cycle gets its
  own 7-post series (`rent-week-arc.md`) — the most legible systems
  story the game tells; every post degrades gracefully if the feed is
  quiet.
- **Archive arc:** T+14 → T+20, the "block keeps receipts" series
  (`archive-arc.md`) — rumor outcomes, permalinks, the attributed
  ledger. Gate: post-launch only; pre-live archive shots must carry the
  `demo archive` badge in-frame and say "demo" in copy.
- **Move-In Week arc:** T+21 → T+27, the hire-a-character series
  (`move-in-arc.md`) — covers the funnel's last step once spectators
  already understand the world. Same feed-honesty gate; hire price is
  PROPOSAL-tier until pricing is final.
- **This Week cadence total:** ~7 posts/week across channels, mostly reused
  assets. Target effort after week 1: under 2 h/week for drafting; review
  per §3 gate.

## 6. Launch-day runbook (operational)

1. **T-1 evening:** owner confirms staging URL, loads `launch-thread.md`,
   fills `{{URL}}`/`{{DATE}}` placeholders, queues or pre-drafts all T-0 posts.
2. **09:00 go/no-go:** site loads, spectator view renders, request feed
   public. If any fails → post the *delay variant* in `launch-thread.md`,
   not silence.
3. **Posting:** follow Phase B table. Reply to comments with clip links —
   every reply is a second impression for lurkers.
4. **Log:** screenshot each post's 24-h stats into the metrics log
   (ANALYTICS.md §weekly report format; until the endpoint is live, a
   dated note in MARKETINGLOG.md).
5. **End of day:** write day-0 recap post from real events only.

## 7. Community seeding guidelines

The thin line between seeding and astroturf — we stay on the right side:

- **Reddit:** post as the developer, titled as the developer
  ("I built a neighborhood where..."), in subs that allow self-promo, on
  their self-promo days. No purchased upvotes, no alt accounts, no "found
  this cool game" posts. r/sanfrancisco gets the local angle variant
  (real streets, fictional residents — disclose fully). Full drafted
  posts + per-sub reply rules: `drafts/reddit-posts.md`.
- **Feed-honesty rule:** never screenshot a request feed that isn't real.
  If launch hour has zero player requests, post "the feed is empty — be the
  first" (it's a better post anyway). Absolutely no fake requests to
  manufacture content — the feed is public and attributed; a fake would be
  permanently visible.
- **Discord:** seed with the 10 questions in `seeded-questions.md` posted by
  the dev account, not sockpuppets.
- **Creators/streamers:** a watchable world is a streamable world. Outreach
  pitch lives in PRESS-OUTREACH §pitch-3; on social, the move is quote-
  posting creator streams with the live-link, not cold DMs.
- **Comments:** answer questions about money with the pricing-post link —
  the credit model is defensible and we defend it in public.

## 8. Voice & accuracy checklist

Voice: **neighborly, dry, specific.** We talk about the block like locals,
not like a brand. Short sentences. Concrete details (a name, a street, a
time of day) over adjectives. Never "revolutionary," never "immersive,"
never "AI-powered" as a lead — the tech is the how, not the hook.

Pre-send checklist (every post):
- [ ] Claims match the design doc: free watch tier, request model,
      possession rules (only your own hired character), 8 mains
      unpossessable by anyone.
- [ ] No real SF business names — canonical parody names only (source of
      truth: world track `world/parody-names.json`, generated from
      `world/businesses.md`; e.g. Mudhaus Coffee, Taqueria El Farolote,
      Buy-Rite Market, The 600 Club). Street/landmark names fine.
- [ ] No fake testimonials, invented quotes, or fabricated player behavior.
- [ ] No "coming soon" on cut features (voice/TTS v1, ambient-NPC
      possession/economies, cash-out, loot boxes).
- [ ] Pricing numbers match the monetization plan and carry PROPOSAL status
      where the site does.
- [ ] Screenshots are from `site/shots/` (real captures), labeled
      "development build" pre-launch; every image post carries alt text
      from `social/alt-text.md`.
- [ ] Marisol/season-one secrets teased, not confirmed (§4 spoiler rule).
- [ ] `python3 tools/social_check.py` is clean for the file being sent
      (0 FAIL; every WARN read and accepted — the checker automates the
      mechanical half of this list: banned words, real business names,
      spoiler co-mentions, cut features, char limits, UTMs).

## 9. UTM & measurement conventions

Every link in every post carries UTMs so launch traffic is attributable:

```
utm_source   = x | tiktok | youtube | bluesky | reddit | discord | itch
utm_medium   = organic | bio | thread | clip | recap | spotlight
utm_campaign = launch | week1 | ongoing
```

Funnel we're optimizing: **profile visit → site → spectator view →
request/credit purchase → character creation.** Weekly metrics note goes in
MARKETINGLOG.md (template: ANALYTICS.md weekly report + `analytics_report.py`).

## 10. Risks & notes

- **"Truman Show with extra steps" comparisons:** lean in — the store copy
  already owns the comparison ("except Truman is the whole street"). It's
  the fastest explanation we have.
- **Creep factor questions** ("are the characters suffering?"): answer
  straight — characters are fictional agents with authored personalities;
  the possession ban protects the mains' storylines, not feelings. Honest
  beats cute.
- **Empty-feed risk at launch:** covered in §7 — an empty feed is content.
- **Parody-name dependency:** RESOLVED (v22). The world track published
  `world/parody-names.json` (89 canonical mappings, generated from
  `world/businesses.md`); drafts were swept — the last generic descriptors
  in `recap-format.md` and `devlog-clips.md` now use canonical names, and
  new copy must too. If world adds mappings, mirror them into future copy;
  no re-sweep needed for existing drafts (they only name load-bearing venues).
- **Replies are now pre-approved too:** `reply-bank.md` covers the 15
  predictable comment types; anything outside it still needs the §8
  checklist and (inside the first-20 gate) owner review.
