# Devlog 9: "Every door has a tryout."

Status: PUBLISHED (v72) on `site/journal.html`. Source landed at
world-v45: `world/applications.md` + `world/applications.json` (schema
apps-v1) + `world/apply.html` ("The Tryout" demo). Published text-only per
`templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v45</p>
  <h2>Every door has a tryout.</h2>
  <!-- body verbatim in site/journal.html (newest post on top) -->
</article>
```

## Accuracy checklist (all passed at v72)

- [x] 16 job arcs with apply/screen/trial/decline — `job_apps` length.
- [x] 3 live units + 5 ladder tiers (8 housing rows) — `housing_apps` keys.
- [x] Mudhaus barista example verbatim: reply card / "ask for Marisol
      before 9:00", screen who=`c1-marisol`, trial = one paid Saturday
      rush 7:30–13:00 at $19/hr — `job_apps[0]`.
- [x] 9418 Guerrero Unit B viewing "Saturday 11–1, shown by Victor
      himself" — `housing_apps[0]` (`bld-g9418-B`, `shown_by c7-victor`).
- [x] Decline rule: voiced in-world per channel; spectator sees at most
      the card coming down — never the applicant, never the reason —
      `decline_rule` verbatim.
- [x] Never-list quoted: no fee above real screening cost, no rent
      bidding, no pay-to-interview, trials paid unless stated, no secret
      leakage — `never` block.
- [x] Decline line "Card'll stay up — try the next one." — Mudhaus
      `decline.voiced` verbatim.
- [x] No credit figures, no USD framing in the layer (gate-enforced) —
      post makes no price claims.
- [x] Internal link present: how-it-works.html (request pipeline).
