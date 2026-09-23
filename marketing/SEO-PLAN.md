# SEO Plan — Real World ("The Mission")

**Version:** v0 bootstrap · 2026-09-22
**Status:** LOCAL DRAFT — keyword targets and plans, nothing published.
**Sources:** `rw-game-design-2026-09-22.md` (product truth), market/monetization research report of 2026-09-23 (positioning), competitor set: InZOI, The Sims 4, Paralives, Second Life, GTA RP/FiveM, AI Town, Twitch Plays Pokémon.

---

## 1. Positioning (one paragraph, reuse everywhere)

*Real World* is a persistent, browser-based "Truman Show" life simulation set in a
real San Francisco Mission District neighborhood around Dolores Park. 28 fictional
characters live there around the clock — 8 main characters with full AI minds whose
stories can never be taken over by anyone, and 20 ambient neighbors. Watching is
free, always. Players who want to reach into the world — possess their own hired
character, request a weather change, join the cast — pay for **agency**, never for
access.

Search niche we can actually win: "AI life sim you watch", "Truman Show game",
"persistent AI world". We cannot win generic "life sim" / "Sims alternative" head
terms against EA/Krafton budgets — we flank them with the *spectator* angle, which
nobody else sells (research report §2: nobody has shipped paid, time-boxed agency
into a persistent AI society).

## 2. Keyword research

Volumes are directional estimates (no keyword tool access in this environment) —
validate with real tooling (Search Console, Ahrefs/Keyword Planner) before launch.

### Tier 1 — niche head terms (our category, low competition, high intent)

| Keyword | Est. intent | Target page | Notes |
|---|---|---|---|
| truman show game | High — exactly our pitch | index | Nobody owns this; the phrase does our explaining for us |
| AI life sim / AI life simulation game | High | index, features | InZOI made the term mainstream; we ride its wake |
| watch AI villagers / AI villagers game | High | index, features | Smallville/AI Town interest never got a product — we are it |
| persistent AI world | Medium | features, how-it-works | "Runs 24/7 whether you watch or not" |
| AI characters you can't control | Medium-high | features | The possession ban IS the differentiator — own it |
| real time life sim browser | Medium | how-it-works | Browser = zero-install watchability |

### Tier 2 — comparison & adjacent (steal dissatisfied demand)

| Keyword | Est. intent | Target page | Notes |
|---|---|---|---|
| InZOI alternative | Medium | faq (comparison section) + devlog post | InZOI retention complaints = "sterile citizens"; our answer: a written cast with secrets |
| Sims alternative free | Medium | faq + devlog | Careful: we are NOT a Sims clone — pitch "watch, don't decorate" |
| games like Twitch Plays Pokémon | Low-medium | devlog post | Collective agency ancestry — honest lineage post |
| GTA RP browser game | Low | devlog post | "Live a second life with job and rent" is proven demand (FiveM) |
| cozy life sim 2026 | Medium | index copy support | Tone match; pair with "but with stakes" |

### Tier 3 — mechanic & place terms (long tail, cheap wins)

| Keyword | Target page |
|---|---|
| possess an AI character | how-it-works, faq |
| dolores park game / mission district game | index, features (real map hook — press loves it, report §2.5) |
| AI character drama / AI soap opera | devlog recaps |
| virtual neighborhood you can watch | index |
| rent controlled apartment game | devlog (municipal realism posts) |
| public request feed game | how-it-works |

### Negative/avoid list
- Do NOT target "voice AI characters", "AI girlfriend/boyfriend" — voice/TTS is cut,
  and the companion-app lane is a different (and hostile) audience.
- Do NOT target "earn money playing", "cash out game" — no RMT/cash-out, ever.
- Do NOT target "loot box", "gacha" — we sell direct purchases only; say so.

## 3. Page-by-page title & meta plan

Every page: one H1, title ≤60 chars, meta description ≤155 chars, canonical URL,
Open Graph + Twitter card tags, VideoGame schema on index only.

| Page | Title tag | Meta description | Primary keyword |
|---|---|---|---|
| `/index.html` | Real World — A Living Neighborhood You Can Watch | A persistent AI neighborhood in SF's Mission District. 28 characters live here 24/7. Watch free; pay only to reach in. | truman show game, AI life sim |
| `/features.html` | Features — The Cast, The Rules, The Economy | Eight AI main characters nobody can possess. Time-boxed requests. A public feed of every intervention. Meet the world. | AI villagers game, AI life sim |
| `/how-it-works.html` | How It Works — Watch, Request, Move In | Watch free. Buy or earn credits. File a time-boxed request. Create a character, rent a room, climb to landlord. | persistent AI world, possess an AI character |
| `/pricing.html` | Credits & Pricing — Real World | What agency costs: credit packs, request pricing, the Resident subscription. All figures provisional pre-launch. | AI life sim pricing (low comp.) |
| `/faq.html` | FAQ — Real World | Can you possess the main cast? (No.) Is it free to watch? (Yes.) Credits, refunds, ads, moderation — honest answers. | AI life sim questions (snippet bait) |
| `/press-kit.html` | Press Kit — Real World | Facts, boilerplate, screenshots, and key art for Real World, the persistent AI neighborhood set in the Mission. | (press utility, not ranked) |
| Future: `/demo/` | Watch the Neighborhood — Live Demo | — | watch AI villagers |
| Future: `/devlog/` | Devlog — Real World | — | long-tail recaps, comparison posts |
| Future: `/the-mission/` | The Mission — Season One Cast & Map | — | dolores park game, cast names |

**URL naming:** lowercase-hyphen, flat structure, no dates in URLs (devlog posts:
`/devlog/slug/`). Placeholder domain `realworld-game.example` until the user picks
a real one — replace in `sitemap.xml`, `robots.txt`, canonical/OG tags at launch.

## 4. Content calendar skeleton

Cadence target: 1 devlog post/week + 1 in-world recap/week. The recap is our
unfair advantage — the world generates content for free (public request feed +
history browser = built-in content marketing, per research §2.4).

| Slot | Series | Format | SEO job |
|---|---|---|---|
| Mon | "This Week on the Block" | In-world recap: what the cast did, pulled from the event feed | Freshness signal; long-tail drama queries; the TPP-style "watch collective life" hook |
| Wed | Devlog | Build progress, design decisions, honest postmortems | Developer-brand queries; earns links from gamedev communities |
| Fri | "Meet the Cast" | Character spotlight (no drama-seed spoilers — surface profiles only) | Character-name queries once fans search them |
| Ad hoc | Comparison essays | "Real World vs. life sims", "why the cast can't be possessed" | Tier-2 comparison terms |
| Launch | Announcement posts | See LAUNCH-CHECKLIST.md | Launch spike capture |

**First 8 devlog topics (queue):**
1. Why the main cast can never be possessed (the Truman Show contract)
2. Watching a neighborhood is a game now — the Twitch Plays ancestry
3. How a request works: 30 minutes of rain, explained
4. The Mission, mapped: real streets, fictional people
5. Two currencies, one wall: why you can never cash out
6. What the public request feed is for (sunlight as design)
7. Meet Marisol (cast spotlight #1)
8. What we cut and why (voice, loot boxes, cash-out) — honesty post

## 5. Technical SEO checklist (for launch, not yet)

- [ ] PENDING — semantic HTML, one H1/page, alt text on every shot (done in v0 markup)
- [ ] PENDING — `sitemap.xml` + `robots.txt` live at domain root (files exist, placeholder domain)
- [ ] PENDING — OG/Twitter cards validated (og:image = real screenshot, ≥1200×630)
- [ ] PENDING — Core Web Vitals: static site, no frameworks — keep it that way
- [ ] PENDING — Search Console + Bing Webmaster registration (needs real domain + user approval)
- [ ] PENDING — FAQ schema (FAQPage JSON-LD) on faq.html at launch
- [ ] PENDING — hreflang: English only at launch; no localization claimed

## 6. Link earning (earned only — never buy, never spam)

- Press hook #1: "a real Mission block, fictional residents" — SF local press angle.
- Press hook #2: "the AI show where the stars can't be controlled" — games/AI press.
- Community seeding (post-launch, user-approved): r/aiwars-adjacent sim communities,
  life-sim Discords, gamedev/AI-Twitter. Draft posts live in the social-launch
  focus (roadmap v5). Nothing is posted without explicit approval.
