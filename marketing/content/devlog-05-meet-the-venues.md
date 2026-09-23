# DRAFT — Devlog 5: "Meet the venues."

Status: DRAFT (v42). NOT yet on `site/journal.html`. Source unblocked at
world-v16: `world/businesses.json` (22-entry machine registry: tiers,
hours, staff, affordances, game-$ prices, hooks) + 22 per-venue cards at
`world/businesses/*.md` + internal demo `world/directory.html`
("The Directory" — open/closed by clock). Publish text-only or paired with
a directory/venue capture if one lands in `published/`.

Template: `templates/devlog-post.md`. Gate before publish: every named
venue and claim below must still match `world/businesses.md` +
`world/businesses.json`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · {{DATE}} · Development build v{{N}}</p>
  <h2>Meet the venues.</h2>
  <p>
    The block's twenty-two businesses are people now — at least on paper.
    Every parody storefront on the map graduated from a name on a fascia to
    a registry entry: what it is, when it opens, who works it, what you can
    do there, what things cost in game dollars. Mudhaus Coffee, Taqueria El
    Farolote, Auerbach Hardware, Buy-Rite Market, The 600 Club, Baguette
    About It Bakery — each has its own card in the world canon.
  </p>
  <p>
    It matters because the world keeps venue hours. The Directory — the
    internal demo over the registry — shows which doors are open at whatever
    time you look, by the block's own clock. A 2 a.m. request aimed at a
    closed bakery behaves like a 2 a.m. request aimed at a closed bakery:
    it queues or it waits. Venues aren't set dressing; they're resources
    with schedules the request pipeline respects.
  </p>
  <p>
    And a standing reminder of the naming law: every business on the block
    is a parody — GTA-style imitation, never a real Mission business.
    Streets and landmarks stay real (Dolores Park doesn't need a stage
    name); businesses get fictional ones. If a request names a real
    business, the form suggests the parody instead.
  </p>
  <p class="muted">
    Sources: the venue registry is <code>world/businesses.json</code> +
    the per-venue cards in <code>world/businesses/</code>; the naming
    policy is <code>world/businesses.md</code>; the full cast of regulars
    is on the <a href="cast.html">cast page</a>.
  </p>
</article>
```

## Accuracy checklist (run at publish)

- [ ] "twenty-two businesses" count still matches `businesses.json` entries.
- [ ] Venue names quoted still canonical (Mudhaus, El Farolote, Auerbach,
      Buy-Rite, The 600 Club, Baguette About It — check `businesses.md` §1).
- [ ] "opens/closes by the block's clock" still true of `directory.html`.
- [ ] Queued-request wording matches current request pipeline (queued path
      −15%, ≤24 h — `world/requests.json`, design §11).
- [ ] Real-business screening claim still matches `moderation.json`.
