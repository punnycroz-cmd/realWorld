# Thin-AI Fallback — spec (world v13)

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

`world/thinai.html` — "The Understudy" (v2, world v27): three pawns
(A01 always thin, h01 cycling thin→possessed→handoff, C2 showing the
degraded path), a clock stepper, a service-capacity slider, event
buttons (log off / return / possess / cap / rain / press / co-star),
needs meters, a baseline-wage ledger, the live handoff note with
staleness, and a split log marking which lines are feed-public vs
seam-internal. Playtests: PT11 + PT25 in `world/playtest.json`.

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
