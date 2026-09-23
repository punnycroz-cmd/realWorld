# 8-agent playtest evaluation — production-1

Run: 24 turns, 2026-09-23 ~21:10–22:00 UTC. One shared world
(`production/hub.html`, Chromium, file://). Eight independent persistent
`devin` sessions (`devin -c -p`, one per working dir `agents/C1..C8`),
each driving its own main through `window.__aiBridge.sfAgentAct` via a
local control socket. No central script chose actions. WebM video
(`video/playtest-24turn.webm`, 1600s), per-turn screenshots (`turns/`),
machine log (`turns.jsonl`), scrubbable replay (`replay.html`), ATIF
session exports + readable transcripts (`transcripts/`).

## Completion

- **192/192 actions accepted, 0 failures, 0 missed turns, 0 session
  errors.** Every agent acted every turn. One `unknown place` retry
  happened in the earlier dry-run ("744 Guerrero" → fixed by adding
  anchor + street-address resolution to the move verb); the full run had
  zero failed actions.

## What the agents did (verbatim reasons in turns.jsonl)

Verb mix: move 89 · talk 29 · rest 23 · work 18 · idle 6 · request 0.

- **Routines honored**: Marisol/Dani drifted to Haus Coffee on café
  hours, Tomás worked El Farolito 11 turns, Priya worked her RN shift,
  Carmen kept park afternoons and 744 Guerrero evenings, Victor minded
  Auerbach then went for coffee.
- **Real interactions**: 29 talks, several *answered* — Jules↔Marcus
  (T1/T5), Marisol↔Tomás (T11/T18, two-way banter), Dani taking coffee
  orders for Priya/Marcus (T8/T9/T12), Victor↔Jules first-meeting (T16),
  Marcus↔Dani closing scene (T21–24). Speech bubbles render in the scene
  and the video.
- **Emergent arcs**: Marcus's recurring Farolito-burrito hunt (T8→T24,
  ultimately recruiting Dani), Jules the newcomer introducing herself to
  three mains, the Haus Coffee counter becoming the social gravity well.

## Bugs & gaps found

1. **`move` couldn't resolve street addresses** — "744 Guerrero",
   `g744` failed in the dry run. Fixed: the verb now resolves POI →
   anchor key → registry address. Re-verified (C6 entered `g744` this
   run).
2. **Order lifetime vs settle window**: orders hold ≤2 sim-hours; the
   20s settle at 4× runs ~3.2 sim-hours, so an order completes *and
   expires* inside one turn, then the schedule brain reclaims the pawn
   and walks it back. Position snapshots therefore rubber-band (C5
   totals 6.3 km between snaps but repeats endpoints). The motion is in
   the video; the stills capture the aftermath. For a tighter story,
   shorten settle or raise the order cap — documented, not fixed (the
   sim behavior is correct; the harness pacing is what needs tuning).
3. **Zero `request` verbs**: the brief marks them rare; none of the
   eight chose one in 24 turns. The request pipeline is covered by
   proto_harness + smoke instead — noted as untested-by-playtest, not a
   defect.
4. **`talk` while target walks**: a couple of talks landed while the
   target was mid-commute; the speaker walks to the *snapshot* position
   and may arrive at an empty sidewalk. The order still resolves
   (bubble + memory), but a "pursue" mode doesn't exist — acceptable,
   documented.
5. No deadlocks, no stuck paths, no console errors during the run.

## Camera coverage

Rotating plan hit all framings: street-level 18th & Guerrero (×6),
Dolores Park overlook top-down (×7), rooftop-over-the-park street cam
(×6), follow-cam on the last actor (C4, C6, C7, C8 — street third-person).
Video shows ≥3 distinct views; per-turn screenshots carry the cam label.

## Independence & honesty

- Sessions share no state; each saw only `sfAgentState` (observable
  layer — place, nearby cast, needs, wire tail, own routine) plus its
  own journal. The C5 journal shows the mid-run harness restart as a
  "world reset" note — sessions persisted across it, as specified.
- The sessions' choices diverged by character (verb histograms differ;
  Tomás works, Marcus roams, Carmen rests in the park) — evidence they
  weren't centrally scripted.
- All speech rendered via the same `sayText/sayUntil` bubble path the
  schedule brain uses; no text-only actions were left invisible.

## Verdict

The production baseline survives an honest 8-agent visual playtest:
real orders into real NPC brains, visible movement and speech, public
state only, camera rig exercised across modes, zero failures.
