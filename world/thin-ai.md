# Thin-AI Fallback — spec (world v13; second pass v41)

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

`world/thinai.html` — "The Understudy" (v3, world v41): four pawns
(A01 always thin; h01 cycling thin→possessed→handoff; C2 *and* C6
showing the salience-ordered degrade ladder — Carmen alone at home
thins before Jules mid-scene), a clock stepper, service-capacity
buttons, event buttons (log off / return / possess / cap / rain /
press / ask / co-star), needs meters, a baseline-wage ledger, a
compute ledger (llm_min / thin_min / player_min), an owner report,
the live handoff note + stale-note archive, the authored phrase kit,
and a split log marking which lines are feed-public vs seam-internal.
The page carries a LIVE SEAM badge: when `window.__aiBridge` exposes
the game-v9 offline surfaces it reads them; otherwise it runs on the
inline mirror. Playtests: PT11 + PT25 + PT37 in `world/playtest.json`.

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
