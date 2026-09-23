# Main Cast Index — "The Mission" (world v56)

The 8 main characters. Full LLM brains, running 24/7. **POSSESSION BAN: nobody
may possess any of them — not players, not the game owner** (design doc §2, §9;
address spec §9). Their drama seeds are unleakable by construction.

Source of truth upstream: `devin-reviews/cast-bible-2026-09-22.md` (personality,
ties, seeds — unchanged here) + `rw-address-system-spec.md` (all residential
numbers regenerated to fictional 9xxx per spec §8 — the bible's 744/750
Guerrero etc. are superseded by the numbers below).

## Field discipline

Every bible uses the same fields:

- **PUBLIC PROFILE** — spectator-facing blurb. Safe for the app, the feed,
  marketing copy.
- **POSSESSION-BRIEFING SAFE** — the only fields a hypothetical briefing may
  ever draw on: public profile, surface relationships, daily routine. (The ban
  means no briefing ever ships for the mains; the field split exists so the
  rule is structural, not procedural.)
- **SECRETS** — drama seeds. NEVER in briefings, profiles, feeds, nudge
  responses, or any player-facing surface. The possession pipeline (§7) redacts
  these by omission: they are simply not in the briefing schema.
- **SURFACE RELATIONSHIPS** — ties other people could plausibly observe.
- **SECRETS & SEEDS** — what's actually going on.

## Roleplay layer (v14, deepened v28, v42, v56)

Added sections per bible — enough that a stranger could play the
character consistently on day one. Field order is fixed:

1. header facts (age/ethnicity/pronouns, job, home)
2. Look
3. Personality (with core contradiction)
4. **Voice** — speech register + 3 sample lines
5. **Mannerisms** — camera-legible habits and tells
6. **Under pressure** — stress signature
7. **Notices / misses** — perception profile (what the brain sees vs. skips)
8. **Won't do** — hard behavioral boundaries
9. **Backstory (five beats)** — dated biography (v28). Public-history only:
   the beats may foreshadow a seed's *terrain* (a face-down laptop, a
   face-down notebook) but never state the seed. Think of these as the
   parts a patient viewer could assemble from months of watching.
10. **The room** — camera-legible home description (v28): what the viewer
    actually sees if the feed ever looks inside. Observable objects only;
    a telling detail is allowed ("two drawers never open at once"), its
    explanation is not.
11. **With strangers** — default posture toward tourists, newcomers, and
    player-hired characters (v28). Written as tendencies, never rules —
    the brain decides in the moment; this is the prior.
12. **Wants (three clocks)** — v42. Desires on three timescales: this
    week / this season / the long one. Written as pressures and pulls,
    never plans — a want is a condition the brain weighs, not a script
    it follows. The long one may gesture at seed terrain (a life of her
    own, a kitchen with his name on the door) without stating the seed.
13. **The cast, privately** — v42. Exactly one line per other main
    (seven entries): the interior valence of each surface tie — what
    that person *is* to them. Interiority, not intel: it may carry a
    feeling the feed would agree with ("he knows how thin the folder
    is") but never a hidden fact (no amounts, no statuses, no names of
    what isn't named).
14. **Truth and lies** — v42. The honesty register: what they never
    fudge, what they fudge reflexively, and the tell. Written as a
    speech habit, not a rulebook — the memory layer's per-character
    distortion priors read this section.
15. **Money** — v56. The economy signature: how they earn it, how it
    shows, what they'd never spend on, what they'd go broke for.
    Posture and habits only — no ledger facts, no amounts, no seed
    bookkeeping (a savings jar is texture; a specific debt is a seed).
16. **Alone** — v56. What the feed catches when they think nobody's
    watching: the private, camera-legible texture of an unwatched hour.
    Written as observable behavior only — the feed could film every
    line of it. It may orbit a seed (a face-down notebook opening, a
    phone thread reread) but never names what it orbits.
17. **Edges** — v56. The anger/grudge register: what genuinely angers
    them, what they forgive instantly, and the grudge policy. Written
    as emotional perimeter, not trigger conditions — the brain weighs
    it; nothing here fires a behavior.
18. Public profile · surface relationships · daily routine (briefing-safe)
19. Secrets & seeds (never surfaces — always the LAST section)

`world/characters.json` mirrors sections 4–8 plus compressed backstory/room/
strangers/wants/interior/truth/money/alone/edges fields and the
briefing-safe block for the brain/prompt layer.
Section placement note: the roleplay layer sits between personality and the
briefing-safe block — mannerisms and voice are *public-observable* (safe for
thin-AI phrase kits per thinai.json), while "under pressure" and
"notices/misses" are written as perception habits — they gesture at blind
spots without stating the seed behind them; the v42 interior ledger holds
valence only (the gate sweeps it for seed/meta vocabulary); seed content
stays in the final section only. The `bible` gate in `world/audit.js`
enforces the section list and order mechanically.

## Roster

| ID | File | Name | Age | Job | Home (9xxx fictional) |
|----|------|------|-----|-----|------------------------|
| C1 | c1-marisol-delgado.md | Marisol "Mars" Delgado | 29 | Manager, Mudhaus Coffee | 9127 Capp St, Unit C |
| C2 | c2-jules-park.md | Jules Park | 26 | Barista, Mudhaus Coffee | 9418 Guerrero St, Unit A (Carmen's spare room) |
| C3 | c3-dani-reyes.md | Dani Reyes | 24 | Barista, Mudhaus Coffee | 9263 Geneva Ave, Unit 4 (cousins' flat) |
| C4 | c4-priya-raman.md | Priya Raman | 31 | RN, SF General | 9457 Guerrero St, Unit 3 |
| C5 | c5-marcus-bell.md | Marcus Bell | 34 | Bike courier, Flying Pannier | 9457 Guerrero St, Unit 3 |
| C6 | c6-carmen-echeverria.md | Carmen Echeverría | 74 | Retired seamstress (cash hemming) | 9418 Guerrero St, Unit A |
| C7 | c7-victor-auerbach.md | Victor Auerbach | 58 | Owner, Auerbach Hardware | 9102 Mission St, Unit 2 (above the store) |
| C8 | c8-tomas-herrera.md | Tomás Herrera | 36 | Lead cook, El Farolote | 9344 Folsom St, Unit 1 |

## Landlord casting — TBD, do not decide here

The design locks: one of the 8 mains **is** the landlord character
(rational, kind-hearted but not soft, unemotional in decisions), and the game
owner exercises landlord power through admin tools, never possession
(design §3, §9 open decision 1). **Casting among the 8 is officially open.**

C7 Victor Auerbach's *fiction* already owns the two Guerrero buildings and the
hardware store — that is established cast fact and stays. Whether the formal
landlord game-role lands on Victor or is deliberately cast against type is a
user decision; every bible below is written so either outcome works.

## Business names

All business names in these bibles are the canonical **parody names** from
`world/businesses.md` (e.g. the café is **Mudhaus Coffee**, the taqueria is
**El Farolote**). Current code POI keys still carry pre-parody names — mapping
table lives in businesses.md §1.
