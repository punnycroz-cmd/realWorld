# Supporting Residents — "The Mission" (world v126)

The promoted tier between the 8 mains and the 20 ambients (production-3
direction, 2026-09-24: "promote two to four recurring supporting
residents to persistent memory and brain-authored consequential
interactions"). First promotion class: **S1 Bex, S2 Esther, S3 Asha**
(A14 / A05 / A09 — the top three of `world/promotion.md` §5's ranked
candidates; A06 Kofe remains the standing next candidate, unpromoted).

## What a supporting resident is

- **Full brain + persistent memory**, same as a main — the thin era ends
  at promotion (`world/thin-ai.md` §§53–58: the promoted tier's degrade
  ladder, era seam, and held-threads rules are already canon).
- **POSSESSION BAN applies.** They are cast, not hireable — promotion is
  an admin action, and a promoted resident is as unpossessable as a main
  (the ban's logic — authorial storylines, unleakable seeds — applies
  identically once secrets exist).
- **Ambient ids stay frozen.** `A05`/`A09`/`A14` always mean Esther,
  Asha, Bex (promotion.md §3). The ambient cards remain on file as the
  thin-era record; these bibles supersede them as the live reference.
- **Era seam is real.** Records minted while ambient carry
  `ambient:true` and surface only as TOLD-tier gist (thinai.json
  era_seam). Their bibles therefore describe a person the block already
  knows by sight — the depth is new to the character, not the face.

## Promotion picks and why (relationships, not camera time)

| S | Ambient | Name | Why this one |
|---|---------|------|--------------|
| S1 | A14 | Rebecca "Bex" Lindqvist, 29, tattoo artist | The art-underground link: carries the chalkboard/Clarion discovery path (surface knowledge → discovery, never a stated fact); trades with half the block; her shop-succession drawer letter is consequence-rich |
| S2 | A05 | Esther Goldman, 78, retired school secretary | Carmen's peer and the block's memory layer made flesh — unequal knowledge as a *character*: she edits history on purpose; Walnut Creek is a leave-taking the block would feel |
| S3 | A09 | Asha Nair, 33, RN at SF General | Priya's ward-mate mirror — interdependence down the same hallway; burnout + a submitted exit application = self-chosen-project stakes with a body clock |

The three also triangulate the four load-bearing dimensions: Bex =
self-chosen projects + unequal knowledge (the letter, the bio); Esther =
unequal knowledge + limited capacity (the drawer, the bench vs the move);
Asha = interdependence + limited capacity (Priya, the shift offers).

## Field discipline

Same fixed 27-section order as the mains (see `characters/_index.md`):
header facts → Look → Personality → Voice → Mannerisms → Under pressure
→ Notices/misses → Won't do → Backstory (five beats) → The room → With
strangers → Wants (three clocks) → The cast, privately → Truth and lies
→ Money → Alone → Edges → A good day / a bad day → Keepsakes → Listening
→ The day off → Repairs → Weather → Being helped → The phone → First
impressions → Public profile → Surface relationships → Daily routine →
SECRETS & SEEDS (always last).

Two adaptations vs. the mains:

- **"The cast, privately"** covers *known* ids, not the other seven —
  a supporting resident's interior ledger maps the people their ambient
  era actually touched (mains, other supporting residents, ambients).
  The gate checks keys ⊆ the declared `knows` set, not all-others.
- **Secrets are supporting-scale.** No detonating bombs on the mains'
  order — a drawer letter, a revised history, a submitted application.
  Real consequences, neighborhood stakes, repairable worlds. The rule
  stands: SECRETS never appear in briefings, feeds, or nudge surfaces.

`world/characters.json` mirrors supporting entries under a parallel
`supporting` array (same `roleplay_fields`, same `briefing_safe` block,
`seed_lock: true`, plus `promoted_from` + `knows`). `cast.html` renders
them in a supporting strip beneath the mains — briefing-safe fields only.
