# Capture plan — turning the live world into social content

**Status: v22 — spec for post-launch clipping. LOCAL ONLY.** Nothing here
runs until the spectator build ships; before that, `social/drafts/
devlog-clips.md` covers pre-launch with still captures. This plan is the
bridge: which live moments are clip-worthy, where to grab them, and how a
clip goes from feed event to posted video.

---

## 1. The clip pipeline

```
public request feed event ──► flag for capture ──► record spectator view
        (live world)              (human picks)         (60–90s raw)
                                                          │
trim to 15–45s ◄── caption card + end card ◄── review vs §8 checklist
        │
   post per calendar (SOCIAL-LAUNCH-PLAN §5) with UTM link
```

- **Flag:** whoever is watching ops tags a feed event as clip-worthy in the
  recap notes (see §3 taxonomy). No automation needed at launch scale.
- **Record:** screen-capture the spectator view. Budget: OBS or equivalent,
  1080p30 is plenty — the art reads at low res.
- **Trim:** keep the moment, cut dead air. Every clip gets the standard
  skeleton from `devlog-clips.md`: 2s text card → footage → end card.
- **Review:** the §8 accuracy checklist applies — footage is real by
  definition, but captions can still overclaim. Two eyes before queue.

## 2. Capture sources

| Source | What it gives | Status |
|---|---|---|
| Spectator view (`demo.html` embed → live build) | Primary footage — the block, pawns, weather, interiors | Pending game build (`data-demo-src` slot) |
| Public request feed | Attribution text for captions + the "feed as content" screenshots | Pending; vocabulary in INFRASTRUCTURE §3 |
| `site/shots/` stills | Cards, end cards, thumbnails, fallback when feed is quiet | Ready (v39 captures) |
| Journal / "This Week on the Block" | Long-form source material for clip scripts | Ready (template) |

## 3. Clip-worthy moment taxonomy

Ranked by expected clip value. When two happen at once, capture both —
raw footage is cheap, recreating a moment is impossible.

1. **Player-requested weather landing** — a viewer's rain request hits a
   crowd scene. Caption: "someone paid for this rain." The single best
   launch-week clip type. (Feed event: weather request → approved → runs.)
2. **Possession handoff** — the moment a player's hired character wakes up
   or hands back to AI at the hard cap. Caption the handoff, not the
   possession: "time's up — the AI takes the wheel again."
3. **Queue drama** — two viewers' requests collide on the same resource;
   one queues, one runs, the feed shows both. This is the multiplayer
   story: people coordinating or competing through requests.
4. **Ambient life caught mid-moment** — drum circle, stoop crowd, someone
   waiting out rain under an awning. No request needed; the block produces
   these itself. Weekly-recap fodder and quiet-day posts.
5. **Season-one teases** — the blog, the Guerrero flyers. Clip the surface
   detail, caption a question, never confirm. (Spoiler rule applies.)
6. **Admin actions** — rare, but a public admin action on the feed is a
   transparency clip: "even our interventions are on the record."

## 4. Production rules

- **Honesty (§7 feed-honesty applies to video):** only real feed events in
  captions. A quiet day gets a quiet-day clip ("2 p.m. on a Tuesday"),
  not a staged request.
- **Attribution stays on:** if a clip shows a player request, the caption
  credits the handle exactly as the feed does. It's both etiquette and the
  product's pitch — "your name goes on the feed."
- **Label:** "live capture" once real; "development build" on anything
  pre-launch. Never blur the line.
- **No secrets:** possession briefings and drama seeds are redacted by
  design — don't narrate what the design deliberately withholds.
- **Volume discipline:** target 1 clip/day max on TikTok/Shorts post-launch;
  bank overflow for quiet weeks rather than flooding.

## 5. Pre-launch dry run

Before the spectator build exists, rehearse the pipeline once with stills:
pick a `site/shots/` capture, run it through the clip skeleton (card →
ken-burns pan → end card), time it under 45s. That output is literally the
T-14 teaser — the pipeline is already exercised in `devlog-clips.md`.
