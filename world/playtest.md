# Playtest Harness — "Real World / The Mission" (world v9)

How a human playtests this build today, and how findings get home. Machine-readable
scenario contract: `world/playtest.json`. Runnable harness: `world/playtest.html`
(open it directly — file://-safe, no server, no build step).

## 1. What this harness is (and is not)

The demo surfaces (`feed`, `request`, `mod-console`, `create`, `board`,
`history`, `onboarding`, `lease`, `thinai`, `cast`, `crowd`, `directory`,
`timeclock`)
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
  clocks time-to-first-request, and harvests findings.

## 3. Running a session

1. Open `world/playtest.html` in any browser. Enter tester name + role.
2. Pick a scenario. Read persona + goal aloud — the tester *is* that person.
3. Open the listed surfaces with the ▶ buttons (embedded viewer) or "open in tab".
   Prefer the embedded viewer so instructions and surface share one screen.
4. Tester does the step. Facilitator marks each checkpoint PASS / FAIL / N/A and
   types a one-line note on anything interesting — including passes that felt bad.
5. Anything wrong → **Log finding** with a severity (rubric below). Findings beat
   checkpoint notes; a failed checkpoint without a finding is a missed bug.
6. End of session: **Export report (JSON)** → file lands next to the harness, and
   **Copy report (Markdown)** → paste into the triage note / inbox reply.

Session state persists in localStorage — a crashed browser loses nothing.
**Reset session** clears it for the next tester.

A full pass (PT1–PT8) is ~2.5 h. A smoke pass is PT1 + PT4 + PT7 (~45 min) —
those three cover free-tier, every deny path, and the boundary audit.

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
  block (same convention as history.html/history.json).
- New surfaces get a `surfaces` entry + at least one scenario step that touches
  them. A surface no scenario touches is untested by definition.
- When the game track lands real plumbing, add a `PT9 "merge wiring"` scenario
  rather than rewriting the demos — the demo contracts stay the reference.
