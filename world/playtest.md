# Playtest Harness — "Real World / The Mission" (world v23)

How a human playtests this build today, and how findings get home. Machine-readable
scenario contract: `world/playtest.json`. Runnable harness: `world/playtest.html`
(open it directly — file://-safe, no server, no build step). Machine boundary
gate: `node world/audit.js` (see §3a).

## 1. What this harness is (and is not)

The demo surfaces (`feed`, `request`, `mod-console`, `create`, `board`,
`history`, `onboarding`, `lease`, `thinai`, `cast`, `crowd`, `directory`,
`timeclock`, `screen-lab`)
plus `screen.js` are **local simulations of the product contracts** —
the request pipeline, the moderation queue, the spectator feed vocabulary. A
playtest here validates *content, copy, flow, and the locked boundary rules*.
It does NOT validate:

- **LLM behavior** — the persistent-society sim is STOPPED by standing order;
  nothing here exercises a real character brain. "Would the AI render this well"
  is out of scope and always will be in this harness.
- **Real payments, real concurrency, real persistence** — credits are simulated;
  multiplayer conflict is simulated; state lives in the page.
- **Game-track plumbing** — `gsViewerState`/`gsRequest*` live on sf/game-systems;
  a failure that only exists at merge is a merge note, not a playtest finding.

What IS under test — the five invariants, checked on every scenario:

1. Possession ban on C1–C8 (incl. the landlord) — no surface may offer it.
2. Moderation scope = player request text + legal backstop. No "report the AI".
3. Parody business names only; real streets/landmarks are fine; 9xxx addresses.
4. Denied requests: neutral "request not approved" + full refund, always.
5. Prices = monetization-plan §2 PROPOSAL verbatim. Any invented price = finding.

## 2. Roles

One person can wear every hat; four real testers is the intended shape.

- **Spectator** — PT1, PT6, PT8. Free-tier only; never touches a wallet.
- **Player** — PT2, PT3 (first half), PT4, PT5. Files requests, hires a character.
- **Reviewer** — PT3 (second half), PT4. Wears the mod hat; judges queue honesty.
- **Facilitator** — PT7 + session stewardship. Owns the boundary checklist,
  runs the machine audit (PT21), merges cohort reports (PT22), clocks
  time-to-first-request, and harvests findings.

## 3. Running a session

1. Open `world/playtest.html` in any browser. Enter tester name + role.
2. Pick a scenario. Read persona + goal aloud — the tester *is* that person.
3. Open the listed surfaces with the ▶ buttons (embedded viewer) or "open in tab".
   Prefer the embedded viewer so instructions and surface share one screen.
4. Tester does the step. Facilitator marks each checkpoint PASS / FAIL / N/A and
   types a one-line note on anything interesting — including passes that felt bad.
5. Anything wrong → **Log finding** with a severity (rubric below). Findings beat
   checkpoint notes; a failed checkpoint without a finding is a missed bug.
   Findings are auto-tagged with the open scenario (`ref: PT#`) — logged from
   the scenario you were in when you noticed it.
6. If PT8 ran, the facilitator types the measured minutes into the **ttfr min**
   field in the header; it lands in the report as `time_to_first_request_min`.
7. End of session: **Export report (JSON)** → file lands next to the harness, and
   **Copy report (Markdown)** → paste into the triage note / inbox reply.
8. Multiple testers? **Import report…** loads earlier exports into the current
   session (v23): a cohort panel lists every imported session, a per-scenario
   verdict matrix, and **disagreements** — checkpoints where two sessions
   verdicted differently are flagged, never averaged. Findings merge with
   attribution. The Markdown export includes the cohort summary.

Session state persists in localStorage — a crashed browser loses nothing.
**Reset session** clears verdicts, findings, and imports for the next tester.
The **smoke set only** checkbox filters the rail to PT1·PT4·PT7·PT21.

A full pass (PT1–PT8) is ~2.5 h. A smoke pass is PT1 + PT4 + PT7 + PT21
(~50 min) — free-tier, every deny path, the boundary audit, and the machine gate.

## 3a. The machine audit — `world/audit.js`

PT7 is a manual sweep; PT21 runs the machine-checkable half as an executable
gate. From the repo root:

```bash
node world/audit.js          # human-readable, exits 1 on any FAIL
node world/audit.js --json   # machine report: build tag, timestamp, per-gate status+hits
```

Eight gates: **corpus** (screen.js × screen-corpus.json — engine version,
expected-vs-actual per case, ≥3 cases + near-miss per non-pass code), **names**
(no real SF businesses in world content), **addresses** (residential = 9xxx),
**prices** (proposal §2 numbers only; on in-world surfaces only deed fees may
bill credits), **copy** (deny wording "request not approved"; no
gambling/dark-pattern vocabulary), **internal** (internal-tier surfaces carry a
never-ship marker), **mirror** (playtest.html inline data == playtest.json,
field-level drift reported as `PT# drifted: <fields>`), **coverage** (every
surface file exists; no untracked demo pages).

REVIEW hits are contexts a regex can't adjudicate (e.g. a parody-name mapping
table that legitimately cites the real name). They print with `file:line` and
are eyeballed by a human — REVIEW alone does not fail the gate. Only FAIL sets
a nonzero exit code, so the audit can hang on a hook or CI step later.

## 4. Severity rubric (mirrors playtest.json)

| Severity | Use when |
|----------|----------|
| blocker | Boundary broken: possess-a-main affordance, real business name, leaked secret, scripted-AI affordance — or a surface is unusable. **Stop; report immediately.** |
| major | Core flow needs a workaround, or copy contradicts a locked rule (price, refund, review promise). |
| minor | Works, but a real user stumbles: confusion, dead-end, cosmetic defect. |
| nit | Typos, alignment, tone drift. Batch them. |
| question | Not a bug — an open decision the test surfaced (e.g. feed display-filter A/B/C). Route to the owning track, don't silently decide. |

## 5. Triage — where findings go

| Surface / area | Owner |
|---|---|
| All `world/*` surfaces, content, copy, scenario data | **world** (this branch) |
| Queue data model, classifier plumbing, `gsViewerState` vocabulary, ledger writes | **game-systems** (at merge — file as merge note) |
| Neighborhood rendering | **art** (out of scope here) |
| Public/site copy contradictions | **marketing** (flag via inbox) |

Report format: the exported JSON conforms to `playtest.json →
session_report_schema`. Facilitator appends a `[world-playtest]` note to the
shared inbox after each session with blockers/majors only.

## 6. Facilitator watch-list (things to probe, not to script)

- **First-screen clarity**: does a cold tester understand "watch free, pay to
  act" inside 90 seconds? (PT1/PT8)
- **Review trust**: does the queue card make a reviewer *faster* — trace,
  whitelist card, SLA clock — or do they ignore it? (PT3)
- **Deny dignity**: denied players should feel refunded and un-shamed. If any
  deny copy reads as accusation, that's a major. (PT4)
- **Invisible seams**: surfaces simulate independently — the same request won't
  literally appear on both pages. Judge the *vocabulary*, not the plumbing.
- **Scope leaks**: any UI that implies controlling a main, moderating AI
  behavior, or spending real money is a blocker on sight.

## 7. Maintenance

- `playtest.json` is the contract; `playtest.html`'s inline `PTS`/`SURF` mirror
  it — when scenarios change, edit the JSON first, then hand-sync the inline
  block (same convention as history.html/history.json). The `mirror` gate in
  `audit.js` enforces this — run it after any scenario edit.
- `screen-corpus.json` and screen-lab.html's inline `CORPUS` are likewise
  hand-synced; the corpus gate catches case-count drift but not content drift —
  when adding a case, update both.
- New surfaces get a `surfaces` entry + at least one scenario step that touches
  them. A surface no scenario touches is untested by definition. Tool surfaces
  (no HTML to embed) declare `tool` + a `run` string — see `audit` in SURF.
- New gates in `audit.js` should follow the existing shape: `gate(name, desc,
  fn)` returning hits with `file:line` refs; REVIEW for eyeballed contexts,
  FAIL for violations.
- When the game track lands real plumbing, add a `PT9 "merge wiring"` scenario
  rather than rewriting the demos — the demo contracts stay the reference.
