# Programming calendar — the week on the server

**Version:** v84 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §5 (cadence/honesty rules apply to
every slot below), `welcome-sequence.md`, `watch-party-playbook.md`,
`feed-mirror.md`.
**Status:** copy-ready; OWNER-GATED until the server exists.

Cadence rules scattered across the funnel doc become a single weekly grid
here. The grid is the promise; each linked spec is the how. Rule zero stays
unchanged: **under-promise on schedule** — every slot below has a
quiet-week fallback so the calendar never publishes a dead slot.

---

## 1. The weekly grid

All times owner-local (PT). Slots are small on purpose — a calendar with
six kept promises beats one with twelve aspirational ones.

| Slot | When | Channel | What happens | Quiet-week fallback |
|---|---|---|---|---|
| Recap drop | Sun 18:00 | `#announcements` | "This Week on the Block" — `tools/build_recap.py` draft, owner-edited | "A quiet week on the block" — publish anyway, one paragraph |
| Open-rumor thread | Sun 18:05 | `#the-block` | Reply-thread under the recap ping: "what's still unconfirmed?" — recap's rumor hook is the seed | Skip silently if the recap has no open rumor; never invent one |
| Weekly calls | Sun 18:10 | `#the-block` | Stakeless prediction thread on the week's open beats — spec in `prediction-ledger.md`; resolved calls get a line in next week's recap | Skip if no open beats; carried-over calls still resolve whenever the record moves |
| Request clinic | Wed 19:00 | `#help-requests` | Owner walks 1–2 filed requests end-to-end: text → classification → outcome. Teaching the vocabulary | If no requests were filed, repost a historical example from the archive |
| Watch party | Event-driven | `#watch-party` + `#rooftop` voice | Only when `watch-party-playbook.md` §1 triggers fire — never on a fixed night | None needed; absence is correct behavior |
| `#the-feed` mirror | Daily, ≤4 posts | `#the-feed` | Manual curation per `feed-mirror.md` — not a calendar slot, it's a standing routine | Quiet days mirror nothing; that's the design |
| Feedback triage | Sun (with recap) | internal | `feedback_router.py` batch → shared inbox; "you reported, it's fixed" credit in the recap | "Nothing actionable this week" line in recap |

## 2. Monthly and seasonal slots

| Slot | When | What |
|---|---|---|
| Town hall (text AMA) | First Saturday, monthly, `#the-block` | 60 min owner presence. Ground rules pinned week-of: roadmap questions get honest "don't know / not decided" answers; pricing/policy answers must match `PRICING-PAGE-CONTENT.md` and `rules.html` verbatim — mods never answer these. |
| Scorecard retro | Monthly, internal | `funnel_scorecard.py` four-week review vs `funnel-scorecard.md` §2 targets; re-set targets in writing only at day-30+ (§5.3, no silent goalpost moves). |
| Seasonal beats | Driven by the sim | Fog events, storms, showtime requests are the "holidays" — the calendar leaves room by keeping fixed slots light. |

## 3. Copy-ready prompts

**Open-rumor thread (post under the recap):**
> Still unconfirmed after this week: {{RUMOR_HOOK}} — the archive says
> what happened, not what anyone meant by it. What do you think is going
> on? (Label guesses as guesses; the feed never confirms speculation.)

**Weekly calls opener (post under the recap):**
> Calls for this week — what's still open on the block: {{OPEN_BEATS}}.
> Call what you think the record shows next. Observable outcomes only,
> no stakes, unresolved is honest. We check them against next Sunday's
> recap.

**Request clinic opener:**
> Clinic night. Walking through {{REQUEST_DESC}} start to finish —
> what "compatible" meant here, why it classified the way it did, what
> happened after. Ask anything about how requests work; I can't preview
> pending reviews.

**Town hall pin (week-of):**
> Town hall Saturday {{DATE}} 18:00 PT, here in #the-block. One hour.
> Roadmap, pricing, the rules — fair game. Character secrets and pending
> request reviews — not fair game, asking won't help.

## 4. What the calendar deliberately lacks

- **No daily engagement-bait prompts** ("question of the day"). Manufactured
  chatter reads as manufactured; the feed supplies real material.
- **No fixed watch-party night.** Events the sim doesn't produce on a
  schedule can't be scheduled honestly.
- **No member-spotlight feature.** Spotlighting members invites popularity
  mechanics; spotlight *beats* (clips, recap mentions) instead — see
  `clips-and-highlights.md`.
