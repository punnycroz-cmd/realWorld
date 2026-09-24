# Real World — Production 3

Truman-Show-style AI village sim set in San Francisco's Mission District /
Dolores Park. One integrated, runnable product on branch `sf/production-3`.
**Local only — no deploy, no accounts, no payments, no publishing.**

## Pinned SHAs

| Branch | SHA | Tip |
|---|---|---|
| sf/production-2 (base) | `1dfc981ae227e53dd2bd1df681a380733f5f4964` | — |
| sf/game-systems | `ff6266d4fba1412761477c012f9545a79f68881c` | game v18 |
| sf/world | `a87e9f64e9233332b86b8778a1bf7775c43beff1` | world v134 |
| sf/full-neighborhood | `4acd5c2e6121190bd2688630e2221b4e3719762d` | art v86 |
| sf/marketing | `567f3c756fd35df74156f5e18e7d89ed6c0f0aa0` | mkt v193 |
| sf/memory | `31a8a61cb83a70d1b1107179459ac723fd9ffd1b` | memory v143 |

All input tips passed the direction gate (newer than art v82 / game v17 /
mkt v167 / memory v123 / world v116). Merge order per plan:
game-systems → world → full-neighborhood → marketing → memory.

## How to run (fresh clone)

```bash
git clone https://github.com/punnycroz-cmd/realWorld.git
cd realWorld && git checkout sf/production-3

# front door (marketing landing) — opens the hub
open marketing/index.html            # or just open the file in a browser

# or go straight to the production hub
open production/hub.html             # game + Wire + Drive + Archive + shell
```

Rebuild after touching sources:

```bash
python3 scripts/build_willowbrook_natura.py   # game bundle(s)
python3 production/build_production.py        # production/hub.html
```

Harnesses:

```bash
GS_TEST_QUERY='?sf&test=1' node devtools/node_harness.js   # GS + SF + BRAIN suites
node devtools/prod_checks.js        # prod invariants incl. possession ban
node devtools/prod3_checks.js       # Phase 3 direction-acceptance checks
~/.venvs/prod3/bin/python production/smoke_hub.py            # headless-Chromium smoke
~/.venvs/prod3/bin/python production/playtest/driver.py --agents --sim-hours 12 \
    --cap-min 30 --speed 8          # 8-agent live playtest
```

## What it is

`production/hub.html` is the single entry point: Mission/Dolores render, the
8 mains living under the brain contract, the Wire, request submission, the
ledger — no dead links on the critical path. The shell adds observer tabs:

- **Wire** — live feed, thread following.
- **Drive** — catalytic actions (enter / exit / buy / greet / rest / scene /
  menu): instant delivery or an honest `{ok:false,err}` refusal, with the
  session trail and per-session debrief readable in the same tab.
- **Archive** — catch-up edition over `gsWireDays`/`gsWireArchiveDay`.
- Multi-camera spectator system (overlook / street / roof / follow).

## Verified (evidence)

- `devtools/node_harness.js` with `GS_TEST_QUERY='?sf&test=1'`:
  **GS 564/564, SF + BRAIN 40/40 green** — schema, ladder fallthrough
  (mains never hit the background scheduler), directive lapse →
  `intention_gap`, outcome feedback, intent arming/firing, tier routing,
  rate caps.
- `devtools/prod_checks.js`: **11/11** — possess-on-main denied
  (`possession_ban`, before billing, owner included).
- `devtools/prod3_checks.js`: **24/24** — real-estate admin absent
  (assessor fns null + symbols gone from bundle), minimal housing present
  and exercised (`gsVacantUnits`), catalytic delivery / refusal / refund
  paths, intervention log written and readable, closed loop
  watch → catalytic action → consequence → ledger conservation.
- `production/smoke_hub.py` (headless Chromium): hub loads with
  **ZERO console errors**; screenshots of hub / game / Wire / drive /
  archive / request flow in `production/smoke/` (8 shots).
- Phase 4 playtest: `production/playtest/` — 8 separate agent processes
  (`agents/C1..C8` + `brain_worker.py`), 41 turns over ~9 sim-hours at 8×
  in the live rendered game; **all 8 mains produced a confirmed visible
  `intention_gap`** after a withheld will at a directive boundary;
  video `video/playtest.webm`, 41 turn screenshots in `turns/`,
  per-character transcripts in `transcripts/`, `replay.html`, journals in
  `agents/*/journal.md`.
- No real-payment paths; prices are proposals. Parody business names only.
- No file over 10 MB in the tree.

## Stubbed / cut / honest gaps

- **Assessor machinery excised**, not stubbed: `41_game_systems_assessor.js`
  deleted; every caller was `typeof`-guarded and now takes the absent path.
  One mortgage `taxMo` impound line survives inside the deed-book
  (self-contained home-loan math, not a county roll) — documented here.
- **Catch-up edition**: Archive tab reads real wire data via
  `gsWireDays`/`gsWireArchiveDay`; days without editions show an honest
  empty message rather than a fake issue.
- **Playtest brains are deterministic persona agents**, not LLMs: no
  `devin`/LLM CLI exists on the build box, so each of the 8 agents is a
  separate `brain_worker.py` process with its own persona, briefing
  (public profile + routine only), and persistent journal — structurally
  8 independent agents answering the real contract input/output, but
  scripted, not generative. Upgrade path: swap `brain_worker.py` for a
  real LLM CLI; the driver's `--agents` plumbing is unchanged.
- `world/archive.html` catch-up app remains standalone; the hub Archive
  tab is the wired surface.

## Playtest assessment

- **Cross-character interaction**: co-presence clustered correctly —
  C1/C2/C3 staffed Mudhaus Coffee, C4/C5/C6 idled at Dolores Perk,
  C7 held the hardware counter, C8 ran the taqueria shift then walked
  home to sleep. No `talk` verbs were dispatched in this window
  (the driver's convo triggers stayed quiet), so conversation quality is
  unexercised live — convo obligations are covered only by harness tests.
- **Routine adherence**: every filing carried an in-fiction `why`
  ("the shop does not open itself", "dinner rush comes whether i am
  ready or not"); directives matched character routines (day-shift vs
  night-shift, Victor's workaholism) with zero schema errors, zero
  `err` results on 46 filings.
- **Ladder honesty**: withholding each brain's turn produced a visible
  `intention_gap` for all 8 mains — no silent busyness, no `sfSched`
  fallback for mains. Dead-brain recovery re-surfaced lapsed triggers and
  the agents refiled.
- **Emergent conflicts / bugs / deadlocks**: none observed; the engine
  never deadlocked across ~9 sim-hours and 41 concurrent-ish turns.
- **CONSEQUENCE CONTINUITY: grade C+ (partial).** Choices visibly
  persisted within the run (directives, positions, session trails,
  journals), and the obligation → open-loop → urge machinery is
  implemented and unit-verified — but no cross-day breach/fulfillment
  arc played out in the ~9 sim-hour window, and conversation-driven
  commitments never fired. A longer multi-day run with convo traffic is
  needed before grading higher.

## Per-track follow-ups (next production)

- **game-systems**: exercise convo obligations end-to-end in a live run;
  surface fulfillment-vs-breach on a Wire card so continuity is visible
  to the observer, not just in `sfObligations`.
- **world**: author catch-up editions for more days so the Archive tab
  has real back-content; extend resident data for 2–4 promoted ambients.
- **art**: renderer gap audit — idle/work states render, but convo and
  errand visuals were never triggered live; confirm sprites for
  talk/greet beats.
- **marketing**: press kit and landing copy still mention pre-direction
  features; re-cut once the archive edition set lands.
- **memory**: the memory research is in-tree but only surface-wired
  (`mind.surface` urges); next pass should validate long-horizon recall
  of commitments across multi-day runs.
- **playtest tooling**: plug a real LLM CLI into `brain_worker.py`
  for generative 8-agent runs; add convo-pressure scenarios so talk
  verbs fire within a 20–30 turn window.
