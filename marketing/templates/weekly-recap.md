# Template — "This Week on the Block" journal recap (`site/journal.html`)

Post-launch format. Long-form site version; cut the social version from
the same material via `social/drafts/recap-format.md`.
Source: the public request feed + observed character activity ONLY.
Link rule: every line links to its feed entry — if it can't be linked,
it didn't happen.

## Fields

- `post-meta`: `This Week on the Block · {{YYYY-MM-DD}} (week of {{D}}–{{D}})`
- `<h2>` headline: the week's true shape, one line
  ("A quiet Tuesday, a loud Saturday." — a quiet week says so).
- Feed beats: one `feed-row` per notable event, using the real feed's
  vocabulary for tags: `ran` / `queued` / `refunded` / `resolved`
  (sync with the live feed at launch — DEMO-PAGE.md §7).
  Attributed requests keep their attribution.
- The numbers: requests filed / approved / refunded — real counts.
- Residents beat: what the mains did, soap-opera register, spoiler-aware
  (SOCIAL-LAUNCH-PLAN §4).
- Next-week hook: one open thread.

## Skeleton (HTML)

```html
<article class="card journal-post">
  <p class="post-meta">This Week on the Block · {{DATE}} · week of {{RANGE}}</p>
  <h2>{{HEADLINE}}</h2>
  <div class="feed-preview" aria-label="This week's notable feed events">
    <div class="feed-row"><span class="feed-time">{{DAY}}</span><span class="feed-tag tag-run">ran</span><p>{{event, attributed if requested}} — <a href="{{FEED_ENTRY_URL}}">feed</a></p></div>
    <div class="feed-row"><span class="feed-time">{{DAY}}</span><span class="feed-tag tag-refund">refunded</span><p>{{event}} — <a href="{{FEED_ENTRY_URL}}">feed</a></p></div>
  </div>
  <p>{{Residents beat.}}</p>
  <p class="muted">{{N}} requests filed, {{N}} ran, {{N}} refunded — all on the <a href="demo.html#watch">public feed</a>.</p>
</article>
```

## Notes

- Tag classes today: `tag-run`, `tag-queue`, `tag-refund`, `tag-done` —
  confirm against the live feed's vocabulary at the demo-page flip.
- Break format for a genuinely great emergent week: tell the one story.
- The illustrative preview already on `journal.html` is the shape of this
  template — replace it with real editions at launch, keep it labeled
  until the feed exists.
