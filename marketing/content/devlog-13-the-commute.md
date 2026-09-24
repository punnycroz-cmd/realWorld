# DRAFT → PUBLISHED — Devlog 13: "The block wakes up in waves."

Status: PUBLISHED on `site/journal.html` (v132, dated 2026-09-24), text-only
per the template. Accuracy checklist re-run at publish — twenty-two routes,
six modes (walk / bike / muni / muni_walk / loop / stairs — the Muni lines
named 14, 22, 33, 48, 49, J are public fact per the file), legs + leave
windows + arrive times + per-weather deltas, the ten shared-route overlaps
(pair / where / window / days / share|cross) as incidental-contact
permissions, `building_pulse` last-out/first-back per registry building, the
four stated non-commuters, the "conditions, never scripts" rule (a missed 49
is texture, not a broken script), and the privacy contract (per-person table
is INTERNAL tier — feed texture is anonymous, minors never routed, "a route
says where someone goes, never why they're late") — all verified against
`world/commute.json` + `world/commute.md` (world-v87) on branch `sf/world`,
internal demo `world/commute.html` ("The Getting There").

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v87</p>
  <h2>The block wakes up in waves.</h2>
  <p>
    A neighborhood that's alive whether you're watching or not has to empty
    and fill on schedule — so every working resident now has a route. The
    commute layer is twenty-two rows from registered homes to real
    employers, each with a mode, legs, a leave window, an arrive time, and
    per-weather deltas. Six ways of getting there: on foot, by bike, on the
    real Muni lines (14, 22, 33, 48, 49, J), bus-plus-walk, the courier's
    loop with no single destination — and stairs, because Victor's commute
    to the hardware counter is eighteen interior steps. Dani rides the
    longest one: thirty-five minutes from Geneva on the 49, a different
    weather system at both ends. These are conditions, never scripts — a
    route is a window the routine may satisfy late or early, and a missed
    bus is texture, not a broken script.
  </p>
  <p>
    Where the windows cross, the mornings do too. Ten shared-route overlaps
    name the pairs whose schedules intersect — two openers passing in the
    blue hour, the hospital pair sharing the 48 corridor, the courier depot
    where one rider's loop ends and another's board begins. An overlap is a
    permission for incidental contact the characters may render, never an
    event the feed announces. And every building keeps a pulse — a last-out
    and first-back hour — so "who's home" has a real answer; four residents
    are stated non-commuters, because the honest answer for them is that
    the neighborhood comes to them.
  </p>
  <p>
    The privacy rule is the part worth quoting: the per-person table is
    internal. What a spectator sees on the <a href="demo.html">watch
    surface</a> is anonymous street texture — "the early wave," "a rider
    in the rain" — never named logistics. Minors are never routed (the
    school wave is unnamed extras), ambient homes stay a direction instead
    of an address, and a route says where someone goes, never why they're
    late. Secrets live elsewhere; the commute layer is a leak-free channel.
  </p>
  <p class="muted">
    Sources: the commute layer is the world track's
    <code>world/commute.json</code>/<code>commute.md</code> (v87 — the
    getting-there layer), demoed internally in
    <code>world/commute.html</code> ("The Getting There"). The mode rules,
    overlap contract, and spectator tier are quoted from the file itself.
  </p>
</article>
```
