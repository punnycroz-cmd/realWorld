# The Ear — the grievance layer (world v59)

Machine mirror: `world/grievances.json` (schema `grievance-v1`).
Internal demo: `world/grievance.html` ("The Ear" — file://-safe).

How the block complains. v45 wrote how a character *asks* for a job or a
room; this layer writes what happens after they're inside and something is
wrong — the informal ladder every workplace and every building actually
runs on, who holds the ear, where the paper route starts, and what shape a
grievance takes when it finally reaches the public feed.

This is the content layer for game-v11's dispute verbs
(`gsFileDispute`/`gsResolveDispute`) and reputation journal: the game track
owns the mechanics; this file owns what a dispute *is made of* — archetypes,
ears, rungs, and the bounds on who hears what.

## 1. The ladder

Five rungs, universal across work and housing (per-row `live_rungs` say
which are reachable where — a solo gig has no rung 2, an app has no rung 1):

| rung | name | what it looks like |
|---|---|---|
| 1 | the aside | a quiet word where it happened; half of everything dies here, healthily |
| 2 | the named ask | the complaint restated as a request with a number or a date on it |
| 3 | the third ear | a neutral both sides already nod to carries it — tenure, not title |
| 4 | the table | Calle Justa (work, Thu) or The Rent Table (housing, Wed) — free, bilingual, drop-in |
| 5 | the filing | paper — the formal dispute; the feed prints the door, never the name |

Conditions, not scripts: the ladder describes where a complaint *can* go.
Whether a character climbs it is an in-character decision — nobody is
scripted to complain, mediate, or file.

## 2. The two tables (parody orgs, registered in businesses.md §2)

- **Calle Justa Workers' Table** — Thursday 18:00–20:00 drop-in worker
  clinic. Reads check stubs, writes the demand letter the worker hands over
  themselves, coaches the named ask. Volunteer-run, free, bilingual. Parody
  of Mission worker-center culture; offstage org, no door.
- **The Rent Table** — Wednesday 18:30–20:30 tenant counseling in the
  library community room. Reads notices, checks raise math against the
  calendar, starts paper clocks (habitability, the 21-day deposit rule from
  v54). Vera (a11) staffs the sign-in most weeks — a public volunteer fact.
  Parody of tenant-counseling orgs; offstage org, no door.

Both appear in `businesses.json` at tier `offstage` with all affordances
off — they are recourse texture, never request targets. Their files stay
private: the tables' whole reputation rests on discretion.

## 3. Coverage contract

- `work[]` — one row per distinct employer in `jobs.json` (24 rows: every
  door employer, the offstage employers, and the independent/cash gigs).
  Fields: `employer` (exact jobs.json string), `venue_id` (businesses.json
  id or null for civic/independent work), `ear` (who absorbs the complaint —
  named cast where the fiction has one), `live_rungs`, `archetypes`
  (⊆ `work_archetypes`), `usual_fix`, `paper_route` (org id or null),
  `bounds`, `texture`.
- `housing[]` — one row per `housing.json` building-card key (6 registry
  buildings) plus `ambient-ring` for the off-registry stock. Fields mirror
  work rows; `building_id` keys match `building_cards`.
- An employer with no paper route (`paper_route: null`) is a feature:
  the smallest gigs genuinely have nowhere to file — the ladder is the
  whole recourse.

## 4. The surface bar

Same standard as possession briefings and `regulars.md`:

- **Allowed:** who hears complaints, what the usual fix is, archetypes,
  timelines, what the hallway/shift can observe.
- **Forbidden:** seeds, secrets, private money figures (rent amounts are
  registry/ledger knowledge — the bounds text may say "a raise is
  contested" because the filing is public, never what Priya pays), credit
  figures, anything that resolves a storyline.
- `bounds` fields exist precisely to mark what *doesn't* travel — they are
  leak guards, not leaks.

## 5. Feed shapes

Canonical housing lines come from game-v11 (`a housing dispute filed —
<addr>`, `resolved`, `a tenant gave notice`, `neighbors comparing notes` —
kind `housing`, names never print). `feed_shapes.work_proposal` offers the
work analog (`a workplace complaint raised — <venue>`, kind `work`) for the
game track to adopt or adjust at merge; the door-not-name rule is the
contract either way. Rungs 1–4 produce **no feed line** — a grievance only
becomes public when it becomes paper.

## 6. Knowledge bounds

`knowledge_bounds` mirrors game-v11's bounded-knowledge model so the
content and the mechanics tell the same story: parties day-0, same
shift/hallway end of day, same street in a day or two, table files never
travel. Rumor can carry the *venue* ("someone at the creamery is fighting
about hours") — never the name, never the figure.

## 7. Wiring notes (merge)

- `gsFileDispute`/`gsResolveDispute` are the rung-5 verbs; rungs 1–4 are
  routine/AI texture and need no mechanics.
- `paper_route` values key on the new offstage org ids — both registered in
  `businesses.json` (tier `offstage`) this version.
- Rows are conditions for the AI brain and feed copy — none of it is a
  quest. "Usual fix" describes the world's texture of resolution, never an
  outcome guarantee.
