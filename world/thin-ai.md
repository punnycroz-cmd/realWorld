# Thin-AI Fallback — spec (world v13; second pass v41; third pass v55; fourth pass v69; fifth pass v83; sixth pass v97)

The cheap brain that keeps the block alive when the expensive brain isn't
there. Design basis: §2 (ambients run "schedules + reflexes, zero LLM calls
while ambient"), §6 ("a player-owned character whose player is offline drops
to thin AI (cheap); it 'wakes up' to a full brain when the player returns"),
§7 ("while possessed, the character's LLM brain is suspended; on release or
timeout, the AI resumes seamlessly"). This file is canonical for behavior
and copy; `world/thinai.json` is the machine mirror; `world/thinai.html`
("The Understudy") is the demo.

## 1. Brain modes

Every character pawn carries one of four brain modes at any instant:

| mode | who | brain | cost |
|------|-----|-------|------|
| `thin` | A01–A20 always; h## hired chars whose owner is offline | schedule + reflexes | ~0 (no LLM) |
| `full` | C1–C8 always; h## while owner is online | LLM | paid compute |
| `possessed` | h## during an approved session only | the player | suspended brain — cheapest |
| `degraded` | C1–C8 only, during brain-service outage | thin posture on a main | ~0 |

`degraded` is a resilience posture, not a feature: if the brain service
stalls, a main falls back to their **public routine** (the same schedule a
briefing would show) until service resumes. The show never freezes. Because
the thin layer has no access to SECRETS at all (§5), a degraded main cannot
advance or leak a drama seed — it can only live its ordinary day.

## 2. The seam rule

Transitions are **invisible in-world**. The pawn never freezes mid-action:
thin AI always finishes the current micro-beat (pour ends, doorway reached,
bench sat on) before the mode swaps. Budget: ≤90 s of game time to complete
a beat. If a forced handoff would land mid-sentence, the sentence finishes —
hard cap governs *billing*, the seam governs *dignity*.

Spectator legibility: none. The Wire shows `running` → `player session
ended` for possession (feed.json vocabulary, already locked) and **nothing**
for offline drop, wake, or degraded posture. A neighbor can't tell whether
Jules is "on autopilot"; the feed doesn't break the illusion either. Admin
actions stay feed-public as always — brain-mode transitions are not admin
actions.

## 3. Transitions

```
            owner online          owner offline (+linger 90 s)
  thin  ──────────────────▶  full  ──────────────────▶  thin
   ▲                            │                          ▲
   │  session end / cap /       │ possess request          │
   │  revoke (graceful)         ▼ (approved + screened)    │
   └──────────────  handoff ◀── possessed                   │
              (finish beat)                                 │
  degraded ◀── brain service stalls (mains only) ──▶ resumes to full
```

- **Offline drop:** on owner disconnect/close, a 90 s linger grace covers
  refreshes and blips. Then thin. The linger is invisible — the pawn simply
  keeps doing what it was doing.
- **Wake:** owner returns → full brain resumes with the **handoff note**
  (§4) as context. From inside, the character just lived their day; there is
  no "while you were away" framing — thin time is their own time.
- **Possession:** approved session → brain suspends, `possessed` begins.
  At cap/revoke/end → `handoff` micro-beat → `full` (owner still online) or
  `thin` (owner gone). Feed already shows `player session ended`.
- **Degraded:** mains only. Auto-entered on brain-service stall, auto-exited
  on recovery. Internal metric, never a feed line, never a spectator badge.

## 4. The handoff note

Written on every exit from `possessed`, `full`, or `degraded` → `thin`/`full`.
The continuity seam: the receiving brain reads it as "what I was just doing."

```json
{ "char": "h01", "from": "possessed", "to": "thin", "at_min": 1312,
  "place": "Mudhaus Coffee", "doing": "finishing a shift side-work list",
  "pending": "owed Omar a favor-trade reply", "near": ["A01", "C3"],
  "mood_hint": "tired, fine" }
```

Fields: place, current action, one open thread if any, who was nearby,
one-word mood. No secrets field exists — thin can't carry them and the note
never needs them. `pending` is how a possession session leaves a believable
loose end instead of a cliff-edge.

## 5. What thin can and cannot do

**Can:**
- Run the character's routine (schedule cells per `ambients.json` /
  the bible's public routine) — arrive, work, eat, sleep, go home.
- Fire reflexes — shared table (rain, dusk, commotion) + per-card personal
  reflexes (A01's `rush-tempo`, etc.). Reflexes are condition → posture
  checks, never scripts.
- Cover needs: hunger, rest, and **routine obligations** — auto-shift wages
  at baseline rate (plan §2.4) and scheduled payments. An offline tenant
  does not mysteriously skip work or rent.
- Small talk from a **phrase kit**: short generic bubbles ("morning",
  "big line today"), capped per hour, never character-voice-specific
  enough to impersonate the full brain. Thin dialogue is weather-talk.
- **Co-star mode:** a screened request may summon an ambient/hired pawn as
  scene support. Bounded compliance check — accept if the ask fits the role
  card and no reflex vetoes it; otherwise decline. Declined nudges keep the
  plan's 50% auto-refund. Co-star is time-boxed to the request; it never
  persists new obligations.

**Cannot:**
- Start or advance a drama seed. Seeds live in the full brain; thin has no
  seed state at all — not withheld, *absent* (same construction as briefing
  redaction).
- Form, deepen, or damage relationships. Relationship writes are full-brain
  only; thin can only be *seen* (spectators and characters can still note
  "Reyes was there").
- Make commitments: no leases, no purchases beyond routine needs, no
  promises that outlive the day.
- Dialogue beyond the phrase kit. If a full-brain character presses a thin
  pawn on something real, thin deflects generically — the full brain's
  memory records it as an ordinary non-conversation.
- Be possessed (ambients) or take admin power (anyone). Unchanged bans.

## 6. Why this is safe

The worst-case thin character is boring, not wrong. Thin cannot leak a
secret (no access), cannot break a boundary (no possession/admin surface),
cannot spend money it shouldn't (routine needs only), and cannot improvise
a story beat (no seed state). The failure mode of the whole fallback layer
is "the neighborhood got quieter" — which is also the honest degraded
posture for the mains.

## 7. Compute posture (context, not pricing)

Thin ticks are schedule lookups + reflex condition checks: effectively free
next to an LLM brain. This is what makes the economics work — 20 ambients
and every offline hire cost ~nothing, mains degrade gracefully under budget
pressure, and a possession session *saves* compute (the human brain replaces
the model) — matching plan §0's "possession minutes are nearly cost-free to
serve."

## 8. Demo & playtest

`world/thinai.html` — "The Understudy" (v6, world v83): four pawns
(A01 always thin; h01 cycling thin→possessed→handoff; C2 *and* C6
showing the salience-ordered degrade ladder — Carmen alone at home
thins before Jules mid-scene), a clock stepper, service-capacity
buttons (incl. the 0% blackout floor), event buttons (log off /
return / possess / cap / rain / press / ask / co-star classes /
scene-at-C6 / routine-fit + off-routine asks on a degraded main),
needs meters, a baseline-wage ledger, a compute ledger
(llm_min / thin_min / player_min), an owner report, the live handoff
note + stale-note archive, the authored phrase kit with the
repetition guard, the per-main `deg_min` outage-credit ledger driving
rotation swaps, a split log marking which lines are feed-public
vs seam-internal, and the v83 fallback-surface layer: a per-surface
posture panel (unaffected / hold / static) with the held press
backlog + recovery trickle, and the day-hash jitter shown on each
pawn's next cell edge. The page carries a LIVE SEAM badge: when
`window.__aiBridge` exposes the game-v9 offline surfaces it reads
them; otherwise it runs on the inline mirror. Playtests: PT11 + PT25
+ PT37 + PT64 + PT75 in `world/playtest.json`.

## 9. Degrade ladder (mains, brain-service capacity)

`degraded` isn't a switch, it's a ladder keyed on brain-service
capacity — the share of LLM tick budget currently available:

| capacity | posture |
|----------|---------|
| 100–60% | all mains `full` |
| <60% | mains degrade **lowest scene-salience first** (a main alone at home thins before a main mid-scene at a crowded venue) |
| <30% | all mains degraded |

- Order is salience-ranked, never alphabetic, never player-visible.
  Salience = is anyone watching / is a scene live — the same signal the
  camera director would use.
- **Ambients are unaffected** — they were never on the service.
- **Possessed pawns are unaffected** — the player IS the brain; a
  brownout cannot interrupt a paid session. If the service stalls during
  a possession, the session runs to its normal cap.
- Recovery walks the ladder back up in the same order. Every step is
  seam-internal: no feed line, no badge, no spectator tell (§2).
- A degraded main still fires reflexes and still writes a handoff note
  when it drops back to `full` or the pawn goes home — the note is how
  the returning brain inherits the evening.

## 10. Needs model (what thin actually runs)

Thin isn't a pose; it runs a minimal homeostatic loop so the pawn still
makes sense on camera hour over hour:

- **hunger** — rises while awake, faster on work cells; resets on the
  character's routine meal windows. A hungry thin pawn detours to a
  routine food stop on the way home, never to a new place.
- **rest** — falls while awake, restores on `sleep` cells. A depleted
  pawn cuts evening cells short; it never skips sleep entirely (that
  would be a story beat, and story beats are the full brain's job).
- **routine obligations** — the thin layer keeps the character's
  standing commitments on autopilot: auto-shift wages at **baseline
  rate** (plan §2.4 — possessed play can earn bonuses, thin never can),
  scheduled payments (rent autopay, standing tabs) draft on schedule in
  game dollars. An offline tenant's ledger is indistinguishable from an
  online one's — that's the point.
- Needs are posture inputs only. Thin never *complains* about a need in
  dialogue (phrase kit has no vocabulary for it) and never lets a need
  override a schedule obligation unless the reflex table says so.

## 11. Phrase-kit contract

Thin small talk exists so a scene doesn't go silent when an ambient is
in frame. The kit is deliberately impoverished:

- **Cap:** ≤3 bubbles per character per hour. When the cap hits, thin
  goes quiet — a nod, a gesture, silence. Silence is cheaper than a
  fourth generic line and less uncanny.
- **Register:** weather, queues, the game on the bar TV, "morning",
  "big line today". Bubbles are interchangeable across characters —
  if a line could only come from Reyes, it doesn't belong in the kit.
- **Never:** character-voice catchphrases, opinions about named
  characters, references to events that aren't on the public feed, any
  answer to a direct question. A direct question gets a generic deflect
  ("can't complain", shrug) — the full brain's memory logs it as an
  ordinary non-conversation.
- The kit is a shared resource, not a personality. Per-card reflexes
  (§5) shape posture, not speech.

## 12. Handoff-note lifecycle

- **Written** on every exit into `thin` or `full` (from `possessed`,
  `full`, or `degraded`). One note per pawn — newest wins.
- **Read once** by the receiving brain as "what I was just doing", then
  held as recent context only. A wake does not re-read a note the brain
  already consumed.
- **Stale after 24 h of game time** — a note older than a day describes
  a yesterday, and yesterday's loose ends are the full brain's memory
  problem, not the seam's. Stale notes archive silently (seam line in
  the demo; nothing in-world).
- The schema's forbidden fields (`secrets`, `seeds`,
  `relationship_deltas`) are absent *by construction*: the note writer
  has no access to seed state, so there is nothing to withhold.

## 13. Co-star bounds (screened requests on thin pawns)

A screened request may summon an ambient or offline hired pawn as scene
support (the "NPC nudge"/co-star path of the request matrix). Thin-side
rules:

- **Bounded compliance check:** accept iff the ask fits the role card
  *and* no reflex vetoes it (off-shift + sleep cell → decline; a
  request to "stay" past shift end → decline; routine obligations win).
- **Time-boxed to the request window.** When the window ends the role
  card is released mid-beat-clean — the pawn returns to schedule at the
  next seam. Nothing persists: no obligation, no relationship write, no
  memory the thin layer could carry.
- **Decline keeps the 50% auto-refund** (plan §2.3 — we sell the ask,
  not the outcome). The feed line reads `resolved · declined`, verbatim.
- A co-star turn is not possession: the player directs a *situation*,
  never the pawn's dialogue or limbs. Same rule as mains, cheaper brain.

## 14. Scheduled obligations ledger

Everything thin does that touches game dollars lands on the same
ledger the full brain would use — baseline rates, scheduled dates, no
surprises:

| obligation | thin behavior | rate |
|-----------|---------------|------|
| work shift | attends per schedule; auto-shift wage | baseline $/h (plan §2.4) |
| rent | autopay drafts on due date | lease amount, game dollars |
| standing tab | settles at the routine stop | posted price |
| possessions/fines/fees | **cannot originate** — thin never incurs a new obligation | — |

If an obligation can't be met (balance short), thin does not improvise:
the obligation lapses into the normal ledger path (late fee ladder,
plan §2.4 / lease rules) exactly as if the player had been online and
chose not to pay. Fallback is never a shield.

## 15. Edge cases (decided, not deferred)

- **Owner logs off mid-possession:** impossible by construction — a
  live session holds the connection open; disconnect ends the session
  first (cap semantics), then linger applies to the now-`full` brain.
- **Brownout during possession:** session unaffected; the player is the
  compute. Degrade queue skips `possessed` pawns.
- **Request lands on a thin hired char (owner offline):** co-star rules
  apply — the pawn can be summoned, never possessed (possession needs
  the owner online to bill and to drive).
- **Request lands on an ambient:** same co-star path; ambients are
  never possessable and the request UI never offers it.
- **Thin pawn addressed by a main mid-scene:** generic deflect; the
  main's full brain records a non-conversation. No memory write on the
  thin side (thin has no memory to write).
- **Admin action on a thin char** (eviction filing, ledger correction):
  unaffected — admin tools act on the lease/registry layer, not the
  brain layer. The pawn's day continues; the paperwork lands where it
  lands.
- **Clock rollover / day boundary:** scheduled obligations tick once at
  their scheduled minute; needs continue; nothing resets that shouldn't.

## 16. What the demo proves

The Understudy v2 exercises, with a DOM stub or a human hand: linger →
offline drop with note; wake on note; possess → cap → graceful handoff
with the wire pair `running` / `player session ended`; the capacity
ladder degrading C2 while a possessed h01 keeps driving; rain reflexes;
the 3/hr phrase cap going quiet; an on-shift co-star accept with
time-box release and an off-shift decline with the 50% refund line;
baseline wage accrual and a scheduled rent draft on the day boundary;
and a 24-h-old handoff note archiving itself. Every one of those lines
is seam-internal except the locked feed vocabulary — which is the whole
argument of this file.

## 17. Presence model (who counts as "online")

Presence is a three-state signal on the *owner*, not the pawn:

| state | meaning |
|-------|---------|
| `online` | an open session/heartbeat exists |
| `lingering` | connection lost ≤ 90 s ago — refresh-safe grace |
| `offline` | no session, linger expired |

- **Filing a request stamps presence** — a filed request is a sign of
  life; the owner can't be billed for a session they aren't around to
  drive. (`gsPresenceSeen` on the game side.)
- **Possession requires `online`** — deny code `owner_offline` is
  checked at file *and* at promote (the owner may have dropped between
  approval and activation). Denied-at-file requests never bill;
  denied-at-promote resolves with the standard refund path.
- **Disconnect order is fixed:** a live session holds the connection
  open, so "owner logs off mid-possession" can't happen — disconnect
  ends the session first (cap semantics), then linger applies to the
  now-`full` brain.

## 18. Compute ledger — the honest split

Every tick, every pawn lands in exactly one bucket:

| bucket | modes | cost |
|--------|-------|------|
| `llm_min` | `full` | paid compute |
| `thin_min` | `thin`, `degraded` | ~free — schedule + reflexes |
| `player_min` | `possessed` | ~free — the human is the compute |

This split is the product's cost story, not decoration: 20 ambients
and every offline hire run on `thin_min`, degraded mains stay honest
(they're still thin compute — resilience, not a feature), and
possession minutes are nearly cost-free to serve, matching plan §0.
Surfaced internally via `gsComputeStats()`; never a spectator surface.

## 19. Owner report

A player who owns a hired character gets an `owner report` — the
offline analogue of a baby monitor:

- **Scope:** own hired pawns only. Never another player's pawn, never
  a main, never an ambient.
- **Fields:** mode-agnostic place + doing, wages accrued since last
  visit (baseline rate), scheduled obligations met or lapsed, open
  co-star windows.
- **Never:** the handoff note verbatim, other characters' state, or
  anything seed-adjacent (absent by construction — thin never had it).
- **Tone:** a ledger, not a diary. "Your courier worked the loop, rent
  drafted, one favor-thread pending" is mechanics, not narration.

## 20. Salience ordering (degrade ladder detail)

§9's "lowest scene-salience first" is now concrete:

- **Salience factors:** watchers on the venue/scene; a live scene in
  progress; mid-conversation.
- **Tie-break:** deterministic — fewer watchers, then longer idle,
  then id order. Never random, never alphabetic, never player-visible.
- **Recovery** restores in the same order as capacity returns.
- Example the demo exercises: Carmen (C6) alone at home on a Tuesday
  evening is the lowest-salience main on the block; Jules (C2)
  mid-scene at a crowded cafe is near the top. At 60% capacity, Carmen
  thins first; at 30%, both. Neither gets a feed line.

## 21. Phrase kit — the authored vocabulary

§11's contract is now stocked. The full kit lives in
`thinai.json → phrase_kit.lines`, mirrored in the demo:

- **greeting:** morning / hey / how's it
- **queue:** big line today / they're backed up again / worth the
  wait, probably
- **weather:** fog came in early / sun finally burned through /
  supposed to clear up later / cold for September
- **game:** heard the game last night / they blew it in the ninth /
  big one this weekend
- **closing:** take it easy / see you around / have a good one
- **deflect** (direct questions only): can't complain / you know how
  it is / we'll see
- **silence** (at cap): a nod / a half-wave / a shrug and a smile

Every line passes the interchangeability test — any of the 20
ambients could say any of them. The kit is deliberately boring:
weather-talk is the whole point. Adding a line requires it to survive
the §11 never-list; a character-voice catchphrase in the kit is a bug.

## 22. Reflex registry

Two layers, both condition → posture, never scripts:

- **Shared reflexes** (every pawn): `rain-shelter` (covered routes,
  awnings), `dusk-home` (drift toward home cells when the lights come
  on), `commotion-look` (pause, look, resume — rubberneck, never
  investigate), `cold-hunch` (hunched walk, shorter outdoor cells).
- **Per-card reflexes** live on the ambient cards
  (`ambients.json → reflexes`): A01's `rush-tempo`, Doro's
  `off-leash-interpose`, Esther's `weather-gated-day`, etc.
- A reflex can *veto* a co-star ask (off-shift, sleep cell, past shift
  end). A reflex can never *create* an obligation — reflexes shape
  posture, not commitments.

## 23. Handoff-note archive

Stale notes (≥24 h game time) no longer vanish — they move to a
note archive: read-only, seam-internal, never feed. Purpose is
audit/replay (did the seam drop something?) — a stale note is a
yesterday, not a loose end, so archive entries are never re-read by a
waking brain. The demo renders the archive under the log.

## 24. Live seam (demo ↔ game-v9)

The demo reads the game-v9 offline module through `window.__aiBridge`
when present: `gsBrainMode`, `gsThinScheduleView`, `gsNeedsView`,
`gsObligations`, `gsComputeStats`, `gsServiceEval`, `gsOfflineReport`.
Two hard rules: **`gsHandoffRead` is never called** (the one-time read
belongs to the receiving brain — the demo mirrors notes instead) and
**no `gs*` mutator is ever invoked** (the demo is a mirror, never a
driver). Off-bridge, the inline mirror runs and the badge says MIRROR.

## 25. Coverage contract — the never-freeze ladder (v55)

Thin resolution is a **total function**: for every character, every
game minute resolves to a routine cell. There is no "no cell" state —
the worst cell in the world is `home · idle`, and it is always
reachable. Resolution walks a ladder, first hit wins:

| class | ladder |
|-------|--------|
| ambient (A##) | variant row for today (`week`/`weather`/`personal` on the card) → base `routine` rows → role template → `home · idle` |
| main (C#) | the main thin-routine registry (§27, mirror of `SF_CORE_ROUTINES`) → `home · idle` |
| hired (h##) | the routine authored at creation → owner's last-set routine → role template → `home · idle` |

Rules:

- **A variant row set covers the full 24 h when present** — variants
  replace the day whole, never splice mid-cell (ambients.json
  `variant_rows` convention). A partial variant is a build error, not
  a runtime case.
- **Corrupt or missing data falls, never freezes.** A malformed row,
  an unknown venue key, a gap between `h1` and the next `h0` — all
  resolve to the next rung, and the fall is a seam line, never a
  world event. A pawn standing somewhere its ladder no longer covers
  finishes the current micro-beat, then walks home — the seam rule
  (§2) still governs the transition.
- **`home · idle` is the floor, not a failure.** If every rung is
  missing, the pawn lives a quiet day at home. Boring, not wrong —
  the same guarantee as §6.
- **Coverage is checkable.** The audit gate verifies every ambient
  routine and every registry row covers 0–24 contiguously (first
  `h0` = 0, each `h0` = prior `h1`, last `h1` = 24). A character
  whose ladder can't reach a cell is a build failure, caught before
  it ever runs.
- Hired pawns keep their created routine when the owner is offline —
  offline is a brain-mode change, never a schedule change.

## 26. Flap guard — the degrade deadband (v55)

§9's ladder gets hysteresis, because real services flap:

- **Deadband:** degrade when capacity drops **below 60%**; recover
  only when it holds **≥ 70%**. Between 60–69% the ladder holds its
  current posture — a main who thinned at 55% does not bounce back at
  62% and thin again at 58%.
- **Minimum dwell:** a degraded main stays degraded for at least
  **30 min of game time** before it is eligible to recover, even if
  capacity is healthy. Recovery is a mode transition; mode
  transitions cost a handoff beat, and churning them is how seams
  show.
- **One step per beat:** the ladder walks one pawn per evaluation
  tick in each direction — degrade lowest-salience-first, recover in
  the same order (§20). A deep crash still converges, just beat by
  beat; nothing teleports, nothing skips the seam.
- **Skipped as always:** `possessed` pawns and ambients are not on
  the ladder at all — the guard can't reach them (§9).
- The guard is seam-internal like the rest of the ladder: no feed
  line, no badge, no spectator tell. Its only visible product is the
  *absence* of mode churn on the pawn badges in the demo.

## 27. Mains thin-routine registry (v55)

A degraded main runs their **public routine** — the same schedule a
briefing would show (§1). That routine is now concrete:
`thinai.json → main_routines` mirrors `SF_CORE_ROUTINES` (the
implementation in `src/sf/33_sf_cast.js`) into world-readable spec,
one cell set per main, each covering 0–24 contiguously.

- **Canonical order:** `src/sf/33_sf_cast.js` is the implementation;
  `thinai.json → main_routines` is the readable mirror; each bible's
  "Daily routine" section is the prose. Edit them together — the
  audit gate checks the mirror's coverage and the bibles carry the
  matching section header.
- **Parody names only.** The mirror writes venue references in their
  canonical parody names — Mudhaus Coffee (parody of Haus Coffee),
  Buy-Rite Market (parody of Bi-Rite Market), Taqueria El Farolote
  (parody of Taqueria El Farolito), Baguette About It Bakery (parody
  of Tartine Bakery), The 600 Club (parody of 500 Club), Dandy Lion
  Chocolate Co. (parody of Dandelion Chocolate), Dolores Perk (parody
  of Dolores Park Cafe), Valencia Growers Market (parody of Valencia
  Farmers Market). Anchors (`g744`, `g750`, `park_center` …) resolve
  through the address registry — 9418 Guerrero St, 9457 Guerrero St.
- **Degraded means public.** A main on this registry can only do
  what a stranger could already watch them do — open the café, run
  the park path, sit on the stoop. No seed state exists at this
  layer (§5), so the registry is also the *ceiling*: nothing a
  degraded main does can advance or hint a storyline.
- **Personal weather rules still apply.** Carmen's cafecito moves
  inside in rain (her card's `weather-gated-day`); the registry
  carries each main's degrade-time reflexes alongside the cells.

## 28. Failure matrix — coverage cases (v55)

Extends §15. Decided, not deferred:

- **Corrupt row mid-day** (bad `h1`, unknown venue, unresolvable
  anchor): the row falls to the next rung at the next seam — the pawn
  finishes the micro-beat, then follows the fallback cell. Seam line;
  nothing in-world.
- **Whole authored routine missing:** straight to role template /
  `home · idle`. The pawn has a boring day, not a broken one.
- **Variant set partial** (covers 14 h, not 24): build error — the
  coverage gate fails it before it ships. At runtime, a partial
  variant is ignored whole (base routine wins), never spliced.
- **Capacity flapping around the band** (55% ↔ 65% ↔ 58%): the
  deadband holds posture (§26); the ladder does not re-evaluate
  inside the band.
- **Recovery queued during dwell:** a healthy service at minute 10 of
  a 30-min dwell waits. The pawn recovers on the first evaluation
  tick after dwell elapses — recovery still walks lowest-salience
  last-degraded first (§20 order).
- **Degrade lands while a handoff beat is open:** the beat completes
  first (§2 is older and outranks); the degrade posture applies to
  the mode the pawn lands in.
- **Coverage gap in a hired pawn's owner-set routine:** treated like
  a partial variant — ignored whole, role template wins, and the
  owner report flags "routine repaired to template" on next visit
  (mechanics, not narration — §19 tone).

## 29. Wake parity — the first beat back (v69)

When a pawn leaves `thin`/`degraded` for `full` (owner wake, service
recovery), the resumed brain inherits the day, not a reset:

- **Place continuity:** the pawn wakes where thin left it — the
  receiving brain's first beat continues the handoff note's `doing`
  ("finishing a shift side-work list"), then normal priority resumes.
- **Ledger continuity:** wages accrued and obligations drafted while
  thin are already on the books — there is nothing to reconcile,
  nothing to re-earn, nothing to refund.
- **Needs continuity:** the needs meters carry over. A pawn that ran
  thin all day wakes hungry per the meter, not refreshed — needs are
  posture inputs the whole time, so nothing changes hands at the seam.
- **Temporal continuity:** thin time is the character's own time. The
  resumed brain reads the interval as "the day I just lived" — never
  "while you were away". There is no gap to narrate and no recap
  surface (the owner report §19 is mechanics for the owner, not a
  memory the character consults).

The parity rule is the seam rule one level up: if a wake *feels* like
a wake — to the character or to a spectator — the layer failed.

## 30. Outage rotation — fairness under a long brownout (v69)

§26's dwell keeps a degraded main down ≥30 min. Without more, a
day-long brownout parks the same low-salience main on the bench while
the others stay full — the outage has a *bearer*, and it would always
be Carmen. Rotation fixes that without touching the seam:

- **Outage credit:** every minute a main runs `degraded` accrues to a
  rolling 24-h `deg_min` ledger (internal, never a feed line).
- **The swap:** once per evaluation beat, a dwell-eligible degraded
  main carrying the largest credit may swap places with the
  lowest-salience `full` main **when their salience is within
  tolerance Δ ≤ 1** — the tired understudy steps up, a peer steps
  down. The swap is one pawn each way, still between beats, still
  invisible.
- **A swap is not a recovery.** The main who steps down starts their
  own 30-min dwell; the main who steps up is simply full again (their
  dwell was already served). Credits never decay mid-outage — they
  roll off on the 24-h window.
- **Determinism:** ties break the §20 way — fewer watchers, then
  longer idle, then id order. Rotation never overrides salience by
  more than the tolerance; a main mid-scene with watchers is never
  swapped down to free a bored one.
- **Possessed pawns and ambients** are not on the ladder — the credit
  ledger doesn't even track them (§9).

## 31. Scene-yield posture (v69)

When a live scene forms around a `degraded` main — a real
conversation, a crowd moment, anything a full brain is carrying — the
degraded pawn **yields**:

- It contributes phrase-kit lines only (the 3/hr cap still governs —
  §11) and drifts to the background of its own cell: at the café it
  wipes the counter; at the park it stays on the palm but goes quiet.
- It never initiates and never leads. The scene's full-brain
  participants carry it; to a spectator the degraded main reads as
  "the quiet one tonight", not as a broken puppet.
- A direct press still earns the generic deflect (§5) — under
  scene-yield that's the *only* register available, so a scene built
  on a degraded main simply doesn't form: the pawn's routine cell
  resolves and the moment passes to whoever else is there.
- Yield ends with the scene or the degrade, whichever first. Nothing
  persists — no obligation, no relationship write, no memory on the
  thin side (thin has none to write).

## 32. Co-star ask classes (v69)

§13's bounded compliance gets a fixed taxonomy. Every screened co-star
ask resolves to exactly one class — thin never improvises a new one:

| class | the ask | accept bounds | example veto |
|-------|---------|---------------|--------------|
| `be-present` | "be at V for N min" (default) | venue fits the current or next routine cell | sleep cell, off-shift elsewhere |
| `hold-space` | "keep the table / spot" | inside a venue cell, window ≤ cell end | window past shift end |
| `walk-with` | "come along a while" | route stays inside the pawn's current route/loop | off-route destination |
| `carry-item` | "take this to X" | X is on the routine route within the window | destination off-route, sealed/unknown parcel |

- An ask matching **no class** declines — the taxonomy is closed.
- Declines keep `resolved · declined` + the 50% auto-refund (§13);
  accepts run `running` — the locked feed vocabulary never grows.
- All four classes are still time-boxed to the request window and
  still end mid-beat-clean; nothing persists past release.

## 33. Repetition guard (v69)

The phrase kit's weakness is the loop — the same bubble twice in an
hour reads as a glitch, and seams show through glitches:

- **No repeat inside the hour window:** a line used at minute m can't
  recur before m+60, per pawn. The kit rotates through its categories
  before it repeats a word.
- **No consecutive echo:** even across hour boundaries, a pawn never
  emits the identical line twice in a row — the next pick skips the
  last line used.
- **Silence is exempt** — a nod can repeat; gestures don't loop badly
  the way words do.
- At cap, silence — unchanged (§11). The guard makes the capped
  vocabulary go further, never wider.

## 34. Blackout floor — 0% capacity (v69)

The ladder's bottom rung is a posture, not an outage screen:

- At **0% brain-service capacity** all mains are `degraded`; the block
  runs entirely on schedule + reflexes. Ambients are unaffected (they
  were never on the service); possessed pawns finish their sessions
  (the player is the compute).
- The spectator-facing product of a blackout is **a quiet day** —
  every routine still resolves (§25), reflexes still fire, wages and
  autopays still draft. The Wire shows nothing; there is no "the AI
  is down" surface anywhere in-world.
- Convergence is still stepwise: the ladder walks one pawn per beat
  on the way down and back up (§26), and rotation (§30) spreads the
  bench time if the blackout outlasts a dwell.
- A blackout is a `thin_min` day on the compute ledger — the honest
  split (§18) already accounts for it.

## 35. Failure matrix — the long-outage cases (v69)

Extends §§15/28. Decided, not deferred:

- **Rotation swap mid-dwell:** can't happen — the degraded pawn must
  be dwell-eligible (≥30 min down) to step up. The pawn stepping down
  starts a fresh dwell.
- **Two mains with equal credit:** deterministic §20 order breaks the
  tie — fewer watchers, then longer idle, then id. Never random.
- **Salience gap > tolerance:** no swap. Credit accrues; the ladder
  waits for the par — fairness never makes a live scene lose its
  lead mid-beat.
- **Blackout during possession:** session unaffected; the pawn skips
  the ladder entirely (§9). If the owner's session ends inside a
  blackout, the handoff lands `thin` (owner offline) or `degraded`
  (owner online, mains-only posture applies to mains — a hired pawn
  lands `thin`).
- **Wake during a scene-yield:** the yield ends with the degrade; the
  first beat back (§29) continues the note's `doing`, and the full
  brain re-enters the scene as itself — the yield is posture, never
  an exit.
- **Co-star ask spanning a mode change** (owner returns mid-window):
  the window runs to its box regardless — a hired pawn waking to
  `full` finishes the co-star window, then the full brain takes over.
  The ask was screened; the mode change is the owner's business.
- **Repetition guard vs. an empty category:** if every line in the
  only fitting category is spent, thin defaults to silence — a nod
  over a stutter, always.

## 36. Surface fallback matrix — what 0% does to every surface (v83)

The brain service isn't the only generator that can stall. Every
surface a spectator or player reads answers the same question — what
shows when the model isn't there? — with one of three postures. No
surface ever gets generated filler: the choices are template,
authored backlog, or honest absence.

| surface | generator | posture at 0% |
|---------|-----------|---------------|
| Wire event text (`feed.json` `event_kinds`) | fixed template vocabulary | **unaffected** — it was never model text |
| request status lines | locked vocabulary | **unaffected** |
| `quiet` honest-empty markers | daypart table | **unaffected** |
| ledgers / owner report / mod queue copy | canned wording + reason codes | **unaffected** — mechanics were never prose |
| speech bubbles | the phrase kit | **unaffected** — thin register is the whole register |
| Mission Unfiltered posts (`press`) | authored releases | **hold** — the blog goes quiet; a blogger who doesn't file. Held posts trickle back ≤1/daypart on recovery (§39). Never auto-write a post. |
| character briefings | model prose over the static card | **static** — the card alone ships: public profile + surface relationships + routine is already the whole contract (possession-ban §4). No "degraded" label; a shorter card, not an apology. |
| archive thread labels (`history.json` chrome) | generated at archive time | **static** — the day archives with untitled threads; labels are chrome, never narration |

Rules:

- **The matrix is closed.** A new surface must declare its posture at
  build time; "the model writes it and there is no fallback" is not an
  allowed answer.
- **Honest absence beats filler.** A held press day and an untitled
  thread are both legible to a spectator as ordinary quiet; a fake
  post would be a fabricated claim about the world.
- **Never labeled in-world.** "Static" and "hold" are internal
  postures. The Wire shows nothing; the Archive stores the day like
  any other. There is no "the AI is down" surface anywhere.

## 37. Requests under degrade — the routine-fit rule (v83)

Co-star bounds (§13/§32) cover ambients and offline hired pawns. A
screened request aimed at a **degraded main** resolves through the
same closed taxonomy plus one extra gate — the ask must fit the main's
*own public routine* (the §27 registry):

- **Routine-fit accept:** the ask maps to an ask-class AND its
  venue+window sit inside the main's current or next routine cell →
  it runs **posture-only**: presence in place, phrase-kit register
  (cap still governs), scene-yield still applies, never authored
  dialogue, never leads. The deliverable is "they were where you
  asked" — which is all a public-routine pawn can honestly sell.
- **Anything else declines** — off-routine venue, a window outside
  the cell, an ask needing dialogue or a carried scene:
  `resolved · declined` + the 50% auto-refund, same locked vocabulary
  as every other decline. Sell the ask, refund the miss.
- **Review happens at activation** (requests.json queue model): a
  queued request that reaches the front during a degrade is judged
  against the *current* posture — it resolves, it doesn't park hoping
  the service recovers. If the main recovers before activation, the
  normal full-brain path applies.
- **Booked windows still bind.** A booked window claiming a main
  during a blackout delivers posture-only if routine-fit; otherwise it
  declines at activation — the claim was real, the posture is honest.
- At 0% every main is in this posture: the request product shrinks to
  "be where they already were." That is the honest degraded offer —
  the Wire's vocabulary never grows to describe it.
- Mains remain unpossessable throughout — degrade changes the brain,
  never the ban.

## 38. Quiet-week variety — deterministic jitter (v83)

A fixed routine replayed N days straight reads mechanical — a real
person's Tuesday is never a replay of Monday. The fix is
deterministic variation, not new content:

- **Day hash:** `H = hash(day_index, char_id)` — deterministic, so
  every client computes the same block; never random, never seeded
  per-viewer.
- **Boundary jitter:** each routine cell edge may shift ±≤15 min.
  The shift applies to the *shared* boundary — both neighbors move
  together, so coverage stays contiguous and no gap ever opens. The
  authored card remains the contract; jitter is an execution detail.
- **Stop-order rotation:** inside a multi-stop cell (`stops` arrays),
  the visit order rotates by `H mod len(stops)`. The cell's venue set
  is unchanged — same errands, different order.
- **Never jittered:** scheduled-obligation minutes (autopay drafts at
  its minute — ledgers don't jitter), cell *kind* (a sleep edge can't
  become a work edge), co-star window bounds (windows bind the
  authored cell, §40), and anything a co-star ask or reflex keys on.
- Ambients stack this on top of whichever row set resolved
  (week/weather/personal → base → template); mains apply it to the
  §27 registry rows. The coverage gate still checks the *authored*
  0–24 coverage — jitter can never produce a partial day.
- Jitter is honesty, not a variety promise: if the hash yields the
  same stop order two days running, that's allowed. Nobody promised a
  different day — only a non-identical one.

## 39. Surface recovery — no recap, no backfill (v83)

When the service recovers, surfaces resume the way the pawns do
(§29): inheriting the day, not announcing the return.

- **No recap surface.** Nothing summarizes "what thin did" — thin
  days are real days; the Wire and the Archive already carry them.
- **No backfill.** Static-fallback artifacts (untitled threads,
  card-only briefings) are never rewritten after the fact. A day
  archived quiet stays archived quiet.
- **Held press backlog trickles** — at most one Mission Unfiltered
  post per daypart on recovery; a returning blogger, not a content
  dump.
- **Briefings resume fresh prose** on the next pull; nothing
  annotates the gap, and a briefing pulled mid-outage is simply the
  static card (§36).
- **The internal record is the only historian.** The compute ledger
  (§18) records the outage honestly — thin_min days are the audit
  trail the feed never shows.

## 40. Failure matrix — the degraded-request cases (v83)

Extends §§15/28/35. Decided, not deferred:

- **Routine-fit ask lands mid-scene-yield:** runs posture-only inside
  the yield — the main is present where asked, the scene still
  belongs to the full brains.
- **Off-routine ask on a degraded main:** declines at activation;
  the queue never holds a request the current posture can't serve.
- **Ask window straddles a degrade:** runs to its box posture-only —
  same rule as a co-star window spanning a mode change (§35).
- **Ask window straddles a recovery:** the full brain inherits
  mid-window — the ask was screened; the pawn simply becomes able to
  lead. Nothing re-reviews, nothing re-bills.
- **Jittered edge vs. a hold-space window:** windows bind the
  *authored* cell bounds; a boundary that jittered late never extends
  a window, and a co-star release still lands mid-beat-clean.
- **Blackout spanning a booked window:** the claim holds (§37) —
  posture-only delivery if routine-fit, `resolved · declined` +
  refund otherwise.
- **Week-long blackout:** the press backlog stays held the whole
  time — the blog's silence is honest, and there is no filler switch.
- **Degrade hits between screen-pass and activation:** judged at
  activation (§37) — a pass on a full brain doesn't obligate a
  degraded one to deliver what it can't.

## 41. What the demo v6 proves

The Understudy v6 adds, on top of v5's seam and ladder proof: the
surface-fallback panel — every surface's posture (unaffected / hold /
static) moving with the capacity slider, including the press backlog
counter holding under degrade and trickling ≤1/daypart after
recovery; a routine-fit ask on degraded Carmen running posture-only
with the locked `running` line; an off-routine ask resolving
`resolved · declined` with the 50% auto-refund; and the day-hash
jitter shown on each pawn's next cell edge — changing across a +24 h
step while authored coverage stays contiguous. The claim from §36
holds end to end: at 0% brain service the product gets quieter, and
nowhere does it get fake.

## 42. Thin-to-thin encounters — the nod economy (v97)

§5 covers a full brain pressing a thin pawn. The case it didn't name:
what happens when the only brains in the room are cheap ones — two
thin pawns sharing a cell.

- **The register is gesture, not dialogue.** Two thin pawns on the
  same cell co-exist convincingly — share the counter, queue
  together, hold a door, sit the same bench — and interact only in
  the silence register plus the phrase kit. They never stage a
  conversation and never perform a relationship beat.
- **Two thin pawns cannot create a scene.** A scene needs at least
  one full brain or one player driving. A spectator watching two
  ambients share a stoop sees two neighbors sharing a stoop — the
  block's quiet is honest, never a puppet show.
- **The cap is per-pawn and unchanged.** Co-presence doesn't raise
  the 3/hr ceiling; a room full of thin pawns gets quieter, never
  weirder.
- **The familiarity floor is posture, not relationship.** Ambients on
  overlapping routines may carry a *standing gesture* — the nod
  between regulars — declared as a per-card reflex flag
  (`ambients.json → reflexes`), not a relationship write. Thin can
  recognize; it cannot befriend. Recognition is a posture the card
  already owned.
- Nothing an encounter produces persists: no obligation, no memory,
  no thread the full brain later inherits. The nod economy pays in
  nods.

## 43. Player contact — pressing the understudy (v97)

The second unnamed case: a **possessed** pawn (player-driven) is not
a full brain, but it is a live mind pressing a thin one. The rule is
the same one §5 gives full brains, stated so no one can bill it as a
loophole:

- A player talking at a thin pawn gets the phrase-kit register —
  capped 3/hr, then the silence arc. A direct question gets the
  generic deflect, including "are you AI?": there is no answer
  register, so the question resolves like any other.
- **Thin never initiates toward a possessed pawn.** Co-presence is
  posture; the player drives their own scene.
- **Attention can't wake a pawn.** Mode changes come from owner
  presence and service capacity only — never from being spoken to.
  A player cannot spend their way into a smarter understudy
  mid-session; they bought the world's attention, not the pawn's
  depth.
- **Nothing writes thin-side memory.** On handoff, the *player's*
  note may carry "talked at Reyes — he nodded along" as an ordinary
  loose end (§4 `pending`), the same as any possession leftover; the
  thin pawn keeps no record. There is no interrogation surface — a
  seam probe finds only the kit, because there is nothing behind the
  counter to find.
- Co-star bounds still apply if the player files a request instead of
  just talking (§13/§32) — presence is cheap, a directed ask is a
  request.

## 44. World-bound requests under degrade — the split matrix (v97)

§37 covered requests aimed *at* a degraded main. The matrix splits
cleaner than that: some requests were never brain products at all.

| request class | needs a brain? | at 0% service |
|---------------|----------------|----------------|
| weather / ambience (rain, fog, evening) | no — the world | **delivers in full** — and thin reflexes are the reaction layer: rain-shelter fires block-wide |
| venue / open-air claims (bookings, hold-space on a place) | no — the ledger | **delivers** — the claim binds the address, not a mind |
| co-star on ambient / offline hire | bounded — thin side carries it | delivers posture-only per §13/§32 |
| routine-fit ask on a degraded main | bounded — the public routine | posture-only per §37 |
| scene-dependent asks ("start a conversation between X and Y", anything needing a carried scene) | **yes** | **declines** when every participant is thin/degraded — `resolved · declined` + 50% auto-refund |
| possession | the owner is the brain | unaffected — mains were never possessable; hired sessions need the owner online (§17) |

- **A scene needs at least one full brain or one player.** That is
  the whole test. A request whose deliverable is a scene between two
  thin pawns declines — thin can be *watched* together, never
  *directed* together into dialogue.
- **The world doesn't go down with the brains.** A rain request
  during a blackout is the honest case: the weather was never model
  output, and the reflexes that answer it were never model output
  either. The Wire shows the ordinary locked vocabulary — nothing
  announces the outage underneath.
- **Booked world windows still bind under blackout** — a claim on a
  place is a ledger fact; the degrade changes brains, not deeds.
- The split is declared per request kind at build time (requests.json
  `kind → class`), never inferred at runtime. A kind that hasn't
  declared its class defaults to brain-bound — the conservative side.

## 45. Failure matrix — the encounter cases (v97)

Extends §§15/28/35/40. Decided, not deferred:

- **Two thin pawns named in a scene request:** declines at
  classification — no brain to carry it; the 50% refund applies, the
  queue never parks it.
- **Player monologues at a thin pawn for an hour:** the cap runs out
  at three bubbles and the silence register carries the rest — a nod,
  a shrug. The session bought presence, not a scene partner.
- **"Are you AI?" and other seam probes:** generic deflect — the
  question is a direct question like any other; the probe finds the
  kit and nothing else.
- **Rain request lands mid-blackout:** delivers in full; rain-shelter
  and the per-card weather reflexes fire on schedule. The world
  reacts without a single brain online.
- **Scene request names a thin pawn + a full main:** judged on the
  participants — one full brain is enough to carry a scene; the thin
  pawn attends in kit register.
- **Co-star window, third party talks at the summoned pawn:** kit-only
  — co-star sells presence, never dialogue; the bystander's press is
  §43, not the request's problem.
- **Standing-gesture reflex between regulars:** fires as posture
  (the nod), never as a line that implies history — a gesture can't
  leak a relationship thin doesn't have.
- **Undeclared request kind hits the split:** defaults brain-bound —
  a kind that can't show it doesn't need a brain is treated like it
  does.

## 46. What the demo v7 proves

The Understudy v7 adds the encounter layer on top of v6: A15 drifting
into A01's counter cell to show the nod economy (co-presence in
gesture register — no conversation, cap unchanged, a scene unable to
form with zero brains); the player-contact path (possess h01, talk at
A01 — kit then deflect then silence; "are you AI?" resolves like any
other question; attention never changes a mode); the request split
live (a rain request delivering at 0% with reflexes firing while a
scene request naming two thin pawns declines `resolved · declined` +
50% refund); and the encounter panel showing who's awake in the room
— the count of live minds, which is the only thing the split ever
keys on.
