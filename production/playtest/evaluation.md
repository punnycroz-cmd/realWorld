# Production-2 playtest evaluation — the becoming brain, live

Run: 6 sim-hours at ~4–10× effective speed, `driver.py` (default mode),
8 persistent `devin` sessions (one per main, `agents/C*/`), world = the
production `hub.html` in headless Chromium with WebM recording. Dispatch
was purely engine-side: `sfDispatchPoll()` decided who was invoked and
when; the driver never wrote `W.tod`, never picked an action.

## Raw numbers

| metric | value |
|---|---|
| dispatches served | 25 + 8 T2 reflects = 33 |
| contract POSTs filed | 31 |
| accepted | 26 |
| rejected with honest reason | 5 (retried to acceptance in 3 cases) |
| devin sessions | 18 clean exits, 7 transient ACP start failures (dead-brain re-dispatch covered them) |
| trigger mix | gap 14, heartbeat 6, convo_end 3, order_end 2, reflect 8 |
| tiers exercised | T0 20, T1 5, T2 8 — routing real, all tiers hit |
| verbs | work 7, move 5, talk 4, say 3, idle 3, rest 1, reflect 8 |
| talk opens accepted | 4 (C2→C6, C4→Marcus, C5→Priya, C6→C2) |
| floor passes (accepted `say`) | **0** — see failure below |
| withheld boundary turns | 8/8 (C2 live; all 8 in the scripted supplemental) |
| visible intention_gap confirmed | 8/8 across runs |

## What the day looked like

A storm-front morning on Day 24. Marisol, Dani, and Jules all filed to
Mudhaus Coffee independently — "the shop won't open itself" (C1), "storm
coming down and I am not opening late on Marisol" (C3), Jules talking to
Carmen on the stoop before leaving early (C2). Victor opened Auerbach
("shutters up, awning checked, before the rain"). Tomás held the line at
El Farolito and — unprompted — noticed at reflect that he'd missed his
3 p.m. Mudhaus coffee: *"the one line item I keep off the books, and
today I paid for it anyway."* Priya pulled Marcus in out of the rain at
her doorway; he answered "five minutes of dry before the sky commits"
and she capped it: *"Off. Unless the sky counts as a shift. Five
minutes, then inside — I mean it."* Two years-amicable exes orbiting in
a doorway, written by two separate brains who have never seen each
other's briefings.

## Cross-character interaction quality

- **Initiative**: 4 spontaneous `talk` opens among ~23 non-reflect
  filings — salient/gap-triggered, nobody's script. Storm-aware social
  behavior emerged without an environment rule telling them to be social.
- **Convo channel**: opens landed, invites dispatched, obligations and
  `endSay` POV memories recorded — but **zero accepted floor passes**.
  All three live convos ended `no_answer`. This is the run's biggest
  honest failure, and it's structural: invite TTL is 0.5 sim-h and the
  proximity grace is 0.15 sim-h — at ~10× effective speed that is
  ~3 min / ~54 s of wall-clock, inside which a `devin -c -p` session
  (~60–120 s per ritual: read BRIEF → curl /state → POST /act →
  journal) usually answers *after* the channel dropped. The channel
  works (sf_harness floor-pass tests are green); the cost regime
  doesn't match the cadence.
- **Outcome feedback loop**: C6's `talk` to Jules failed `can't find
  them` twice (Jules had already left for her shift) — surfaced as
  `order_end` dispatches; Carmen's journal reads "talk to Jules already
  moot — took up the hems." The failure propagated to the brain and was
  *written into* her day.
- **Contract rejections worked as designed**: three brains tried `say`
  with no live channel ("say lives on the channel" — they refiled as
  `talk` and were accepted); Marcus filed `idle to:"on the block"` twice
  ("unknown place") then refiled bare. Rejection text reached the brains
  and changed behavior — that's the contract doing its job.

## Routine adherence via directives

Every main filed a standing will each turn; the directive layer carried
them between calls — Marisol/Dani/Jules at Mudhaus, Victor at Auerbach,
Tomás at El Farolito, Priya resting at home through the storm, Carmen
mending by the window. No `repeated_default` spam; wills were restated
with fresh whys. Sleep directives landed at end-of-day via T2 reflects.

## Failure honesty (user-ordered probe)

- **Live run**: C2's turn was withheld at a real `directive_expiry`
  boundary (turn 17); the lapse was covered within seconds by a late
  async POST from her already-running session — honest dead-brain
  behavior, documented as such.
- **Supplemental scripted run** (`--scripted`, same engine path): all 8
  mains withheld at `directive_expiry`. The withheld head was stamped
  dispatched so dead-brain recovery re-surfaced it ~0.75 sim-h later —
  the will ran unrefiled in between. `intention_gap` confirmed for
  C2–C6 via engine `gap` dispatch or position poll; C7/C8 ended the run
  flagged in the gap set; C1 confirmed in the prior supplemental.
  No silent busyness, no sfSched, anywhere.
- Natural gaps also appeared live (C4 lapsed twice mid-run and showed
  on the poll).

## Bugs found

1. **`say` latency vs invite TTL** (design gap, above) — convos can't
   survive async brains at ≥4× speed. Fix direction: park the channel
   while a partner brain turn is in flight, or scale TTLs by sim speed.
2. **ACP session races** — 7 dispatches died on `failed to start ACP
   agent session` (first-dispatch session creation racing `-c`
   continuation). Dead-brain recovery re-dispatched every one; driver
   now checks `sessions.db` before passing `-c`.
3. **Screenshot serialization starved the HTTP pump** — fixed mid-run
   (pump between dispatches, 75 s job wait).
4. **`sfDispatchPoll` re-surfaced withheld triggers instantly** unless
   stamped — fixed by marking `dispatchedAt` on withhold.

## Deadlocks / directive zombies

None. Every lapse produced a visible `gap` or a refile; no main
free-wheeled, none silently froze, none fell back to `sfSched` (the
BRAIN suite asserts this; the run confirmed it behaviorally).

## BECOMING rubric

- **Did intentions form?** Yes — bounded wills with first-person whys,
  restated or deliberately allowed to lapse; one armed `intent` field
  exists in the contract but no brain chose to arm one this run
  (documented, not hidden).
- **Did anyone surprise?** Tomás auditing his own missed ritual at
  reflect; Priya/Marcus's doorstep weather flirtation neither bible
  scripted; Jules converting Carmen's non-answer into a resilience
  story ("probably the wind, not a snub").
- **Relationships/quirks developing?** Jules↔Carmen (missed greeting →
  reflect theme), Priya↔Marcus (mutual doorway orbit), Marisol's blind
  spot intact ("Fed everybody all day and ate nothing").
- **Character-ID distinctness**: strong — voices differ in register,
  concerns, and metaphor without blending.
- **Convo medians**: 0 accepted floor passes — the honest low mark of
  the run.

## Artifacts

- `turns-live.jsonl` (= `turns.jsonl`), `turns/` 34 per-turn shots,
  `video/playtest-live.webm` (~60 MB)
- `transcripts/C*.atif.json` + `C*.md`, `agents/C*/journal.md`
- `replay.html` — scrub all 33 turns: shot + camera + trigger + filing +
  all eight wills side by side
- `turns-withhold-*.jsonl`, `turns-withhold/` — the gap-probe runs
- `archive/prod1/` — production-1's run, preserved
