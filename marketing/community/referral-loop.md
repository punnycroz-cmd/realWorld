# Referral loop — honest member-driven growth

**Version:** v39 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` Stage 5 (Advocate), `ANALYTICS.md`
(UTM session-scoped capture — no persistent ids, no cookies).

The advocate rung converts a resident or watcher into someone who brings
others. The mechanic we can afford is **attribution, not rewards**: the
recap already names who filed what; members share because the world gave
them something worth showing. We make sharing easy and honest — we never
pay for it.

---

## 1. The loop as designed

```
member sees feed beat / their own request lands
  → shares a real artifact (recap post, screenshot, clip, their feed entry)
    → friend arrives with context ("you filed THAT?")
      → friend watches free, joins or lurks — both count
```

The loop's fuel is *provenance*: every shared artifact traces to a real,
attributed feed event. A referral that starts "look what happened" beats
"try this game" because it's a story, not an ad.

## 2. What we build to support it

| Asset | Status | Notes |
|---|---|---|
| Recap post (`build_recap.py` output) | BUILT | The canonical share artifact — it's already "what happened this week" |
| Share button on `demo.html` | BUILT (v22) | `share_click` event exists; web-share/clipboard/manual |
| Screenshots (`press-kit/`, gallery) | BUILT | Real captures only, labeled "development build" |
| Feed-entry permalink | SPEC — game-side | When the live feed exists, each entry should be linkable; the *best* referral unit is the request you filed yourself |
| Clip cutdowns | SPEC | `social/drafts/devlog-clips.md` format; trailer plan for framing |

## 3. UTM convention (attribution without tracking people)

Consistent with `analytics.js` (session-scoped, referrer-HOST only):

```
utm_source=community|recap|discord|creator
utm_medium=share
utm_campaign=launch|<recap-YYYY-MM-DD>|<event-slug>
utm_content=<surface: recap-post|clip|screenshot|feed-entry>
```

Rules: UTMs describe **the artifact, never the member**. No per-member
referral codes, no `?ref=<handle>` tracking, no "who recruited whom"
leaderboard. We count which artifacts travel, not who carries them —
same privacy contract as everything else (no persistent ids).

## 4. What members get (the honest incentive)

- **Recap attribution.** If you filed the request the recap covers, your
  handle is already on it — sharing it is sharing your own move.
- **Quote-inclusion.** Owner may quote a member's best observation in a
  recap — *with explicit permission each time*. Being quoted is the reward.
- **Nothing material.** No credit bonuses for referrals (credits are
  non-transferable anyway — a referral reward would contradict the
  monetization rules), no exclusive roles, no early access for recruiters.

## 5. What we never do

- Invite contests, invite-gated channels, "first X members get Y".
- DM spam scripts or copy-paste shill text handed to members.
- Astroturfed Reddit/Discord seeding — the `reddit-posts.md` drafts are
  owner-posted, disclosed, first-person honest.
- Fake "my friend showed me" testimonials in any copy.

## 6. Measurement (feeds the weekly report)

- `share_click` (demo page) — method breakdown already in the spec.
- UTM-tagged sessions in `analytics_report.py` — utm_source=community
  share of visits, week over week.
- `community_join` event (v39 spec) once the invite link is live —
  joined vs clicked intent.
- Discord "how did you find us" — optional single question in the welcome
  flow, free text, never required.
