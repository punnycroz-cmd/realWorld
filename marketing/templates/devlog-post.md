# Template — journal devlog post (`site/journal.html`)

Fill the blanks, then convert to a `<article class="card journal-post">`
block and insert above the previous latest post (newest on top).
Accuracy gate before publish: every claim names a system or a capture.

## Fields

- `post-meta`: `Devlog · {{YYYY-MM-DD}}` · `Development build v{{N}}`
  (or `Launch notes` for the launch/update variant)
- `<h2>` headline: one real change, stated plainly. Not "exciting
  improvements" — what changed and why it matters.
- Body: 2–4 short paragraphs. What / why / what it means for the watcher
  or resident. Name the system (e.g. "the request pipeline",
  "the lease ledger") and quote no numbers that aren't in the build.
- Gallery (optional): real captures only, `shots/v{{N}}-*.png` + `.webp`
  companion, `<figcaption>` dated and labeled "development build".
- Internal link: at least one of demo.html / how-it-works.html /
  features.html where natural.

## Skeleton (HTML)

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · {{DATE}} · Development build v{{N}}</p>
  <h2>{{HEADLINE — the change, plainly}}</h2>
  <p>{{What changed, named system, why it exists.}}</p>
  <p>{{What it means for the player/viewer — accurate scope, no promises.}}</p>
  <div class="gallery" style="margin-top:14px">
    <figure><picture><source srcset="shots/v{{N}}-X.webp" type="image/webp"><img src="shots/v{{N}}-X.png" width="1440" height="900" loading="lazy" decoding="async" alt="{{describe the shot}}"></picture><figcaption>v{{N}} — development build.</figcaption></figure>
  </div>
</article>
```

## Don'ts

- No "coming soon" for cut features (voice/TTS v1, cash-out/RMT,
  loot boxes, ambient-NPC economies).
- No real SF business names — parody names only (world canon).
- No unlabeled mockups: every image is a real capture or explicitly
  marked illustrative.
