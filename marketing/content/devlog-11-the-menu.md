# DRAFT → PUBLISHED — Devlog 11: "The menu is the truth."

Status: PUBLISHED on `site/journal.html` (v102, dated 2026-09-24), text-only
per the template. Accuracy checklist re-run at publish — venue count (20
door-having venues, anchors + street tier only), item count (101), category
set (drink/food/goods/service/counter), price floor/ceiling ($0–$380 in game
dollars), the 12 "ask" lines and 11 free items, and every quoted item below
verified against `world/menus.json` on branch `sf/world` (world-v72,
`menus` audit gate G15c).

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v72</p>
  <h2>The menu is the truth.</h2>
  <p>
    A chalkboard can say anything. What's behind the counter is the question
    — so all twenty door-having venues on the block now carry a written
    catalog: <b>101 items</b>, each with a name you'd say out loud, a price
    in game dollars, a category, an availability condition, and one line of
    counter voice. The sign is the display; the menu layer is the ledger
    behind it, and the audit enforces the two never disagree on a named
    item's price.
  </p>
  <p>
    Every venue keeps at least one signature item — the order a stranger
    should guess first. The super burrito at <b>Taqueria El Farolote</b> is
    $12 and priced for the post-bar line. The open-mic slot at
    <b>The 600 Club</b> is $0, because the stage is the point. The free box
    outside <b>The Dusty Spine</b> is $0 for the same reason in reverse.
    And twelve items carry the price <i>"ask"</i> — the regular at
    <b>Mudhaus Coffee</b>, the usual at <b>Malik's Mini Mart</b> — because
    some prices are a relationship, not a number.
  </p>
  <p>
    The same rules as the rest of the block apply. Conditions, never
    scripts: an item's <code>when</code> reflects rain, heat, Saturday,
    late — nothing obliges a resident to order anything. Game dollars only:
    no credits, no surge pricing, no dynamic menus — the price is the
    price. And the layer is honest about its role: it's the catalog a
    commerce system reads, so that "ordered the usual" in the
    <a href="how-it-works.html">request feed</a> can only render if the
    usual actually exists — and a future order-something request spends a
    resident's own game dollars at a listed price, never one invented at
    runtime.
  </p>
  <p class="muted">
    Sources: the menu layer is the world track's
    <code>world/menus.md</code>/<code>menus.json</code> (v72 — 20 venues,
    101 items, 20 signature lines), demoed in
    <code>world/menus.html</code> ("The Board"). Consuming it for commerce
    is on the game track's desk; the catalog itself is settled canon.
  </p>
</article>
```

## Accuracy checklist (run at publish, v102)

- 20 venues / 101 items / cats drink·food·goods·service·counter — verified
  by script against `world/menus.json`.
- "ask" items = 12; $0 items = 11; price range $0–$380 — verified.
- Quoted sig items verified verbatim: super burrito $12 (el-farolote),
  open-mic slot $0 (the-600-club), free box $0 (dusty-spine), the regular
  "ask" (mudhaus), the usual "ask" (maliks).
- Board-agreement + when_keys + doors-only rules paraphrased from
  `world/menus.md` §2 coverage contract.
- No claim that commerce is live — phrased as "the catalog a commerce
  system reads" / "on the game track's desk".
- No credits, no USD framing of in-world prices ("game dollars" only).
- Canonical parody names used (businesses.json): Mudhaus Coffee, Taqueria
  El Farolote, The 600 Club, The Dusty Spine, Malik's Mini Mart.
- Internal link: how-it-works.html (request feed). No gallery this post —
  the layer is text, not a render.

## Social cut (derived, verbatim-safe)

Short post for the next devlog-clip slot — one line + the price list:

> Every door on the block now has a real menu. 101 items, priced in game
> dollars. The super burrito is $12. The open-mic slot is $0. "The
> regular" costs whatever asking gets you.
