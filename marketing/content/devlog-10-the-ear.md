# Devlog 10: "The Ear: complaints climb a ladder."

Status: PUBLISHED (v87) on `site/journal.html`. Source landed at
world-v59: `world/grievances.md` + `world/grievances.json` (schema
grievance-v1) + `world/grievance.html` ("The Ear" demo). Published
text-only per `templates/devlog-post.md`. Also the first copy use of
the two parody orgs cleared at world-v59 (Calle Justa Workers' Table,
The Rent Table) — swept into `site/cast.html` the same version.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v59</p>
  <h2>The Ear: complaints climb a ladder.</h2>
  <!-- body verbatim in site/journal.html (newest post on top) -->
</article>
```

## Accuracy checklist (all passed at v87)

- [x] Five rungs named verbatim — `ladder[]` ids: the_aside,
      the_named_ask, the_third_ear, the_table, the_filing.
- [x] 24 work rows = one per jobs.json employer; 7 housing rows =
      6 registry buildings + ambient-ring — `work`/`housing` coverage
      contract (grievances.md §3).
- [x] Calle Justa table hours Thu 18:00–20:00; Rent Table Wed
      18:30–20:30 library community room — `orgs[]` verbatim. Free,
      bilingual, volunteer-run, files never leave the table — `bounds`.
- [x] Rungs 1–4 print no feed line; grievance goes public only as paper
      — grievances.md §5 merge note verbatim.
- [x] Door-not-name: housing feed lines quoted per game-v11 canonical
      ('a housing dispute filed — <address>'); work lines flagged as a
      PROPOSAL on the game track's desk (`feed_shapes.work_proposal`),
      not claimed shipped.
- [x] Never-list: names, amounts, who filed, archetype, rung —
      `feed_shapes.never` verbatim.
- [x] Money privacy: "senses tightness, never sees figures" —
      `knowledge_bounds.money`.
- [x] Conditions-not-scripts line per grievances.md §1 ("nobody is
      scripted to complain, mediate, or file").
- [x] gsFileDispute/gsResolveDispute attributed to game-v11 per the
      world-v59 inbox entry.
- [x] Internal link present: how-it-works.html (request pipeline).
- [x] No real SF business names; both org names are registered parody
      orgs (businesses.json tier `offstage`, affordances off — stated
      as "no door of their own").
