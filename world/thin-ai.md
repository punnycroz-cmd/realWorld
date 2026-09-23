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

`world/thinai.html` — "The Understudy": three pawns (A01 always thin,
h01 cycling thin→possessed→handoff, C2 showing the degraded path), a
clock stepper, event buttons (log off / return / possess / cap / rain /
brownout / nudge), the live handoff note, and a split log marking which
lines are feed-public vs seam-internal. Playtest: PT11 in
`world/playtest.json`.
