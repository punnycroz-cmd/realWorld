# Prediction ledger — the stakeless "calls" ritual

**Version:** v174 · 2026-09-24 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §1 (stages), §5 (honesty rules),
`programming-calendar.md` (slot), `funnel-scorecard.md` (measurement).
**Direction source:** Astra concept review §5/§6 — the free observer loop
is *catch up → follow → predict → inspect → revise → return*. This file is
the community surface for the predict/inspect/revise steps; the six
PENDING observer events in `analytics-events.json`
(`catchup_edition_viewed`, `thread_followed`, `prediction_made`,
`outcome_inspected`, `invite_submitted`, `invite_outcome_seen`) are the
future in-product counterpart. The ritual works without the product
feature — predictions live in a thread until the embed exists.
**Status:** copy-ready; OWNER-GATED until the server exists.

The funnel's cheapest retention mechanic is a reason to come back that
costs nothing. A prediction is exactly that: you say what you think
happens next on an open thread, and now the archive owes you an answer.
It is the observer loop made social — and it is deliberately stakeless,
because a wager would be an economy and a motive-claim would be a lie.

---

## 1. The ritual

One pinned thread per week, opened Sunday 18:10 (five minutes after the
open-rumor thread, same post burst) in `#the-block` under the recap:

- Members post **calls** — predictions about *observable* outcomes on
  open threads from the week's recap/archive ("will the shared dinner
  happen again?", "does the mural get finished before Friday?").
- Calls stay open until the question resolves in the public record, or
  until the thread goes stale per §4.
- The next recap carries a **resolved calls** line — which calls the
  week's archive bore out, which it didn't, which are still open.
- Nobody wins anything. The payoff is the return visit itself: you
  predicted, the world answered, you revise.

That's it. No points, no prizes, no bracket. The ledger is a public
memory of who called what — being *seen* to have called it is the whole
reward, and it only works because resolutions link to evidence.

## 2. What a valid call looks like

Pin-ready rules:

> **Weekly calls — the rules**
> 1. Predict something the feed or archive can *show* — an event, a
>    visit, a finished project, a no-show. If the record can't settle
>    it, it's not a call, it's a fan theory.
> 2. Never predict a motive or a feeling. "Jules will skip the dinner"
>    is a call. "Jules is secretly angry" is mind-reading — the archive
>    can't show it and neither can you. (Cast secrets stay secret.)
> 3. One call per open question per person — first call stands, no
>    editing after the fact. Quote your call when it resolves.
> 4. No stakes. Not credits, not favors, not "loser does the recap."
>    The moment something rides on a call, people call safe — and safe
>    calls are boring to check.
> 5. Unresolved is a real outcome. If the week doesn't settle it, the
>    call rolls — the recap says "still open," never guesses.

**Copy-ready thread opener (Sun 18:10, under the recap):**

> Calls for this week — what's still open on the block: {{OPEN_BEATS}}.
> Call what you think the record shows next. Observable outcomes only,
> no stakes, unresolved is honest. We check them against next Sunday's
> recap.

## 3. Resolution rules

- **Evidence or it didn't happen.** A call resolves only against a
  public archive line or feed entry — the recap links the beat it
  already reported. A call can never *create* a claim the record
  doesn't carry (same rule as `#clips` standouts, `clips-and-highlights.md` §3).
- **Three verdicts only:** `borne out` / `not borne out` / `still open`.
  There is no "sort of" — if the record is ambiguous, it stays open.
  Ambiguity is reported, not smoothed.
- **Misses are published.** The resolved-calls line lists calls that
  didn't land with the same prominence as ones that did. A ledger that
  only shows hits is a hype sheet; the honesty is the feature.
- **Self-service.** Members quote their own call to resolve it; the
  owner adjudicates disputes against the archive. If the record
  contradicts a member's read, the record wins — say so plainly.

## 4. Lifecycle and quiet weeks

- **Stale calls:** an open question with no movement for three
  consecutive recaps gets a "gone quiet" tag in the resolution line —
  not closed, just marked. Some threads are slow; that's the sim being
  the sim.
- **Quiet week:** if the recap has no open beats, skip the calls thread
  silently (same rule as the open-rumor thread — never invent material).
  Carried-over open calls still resolve whenever the record moves.
- **Volume cap:** if the thread starts pulling >~30 calls/week, split
  by open question (one sub-thread each) rather than capping people —
  the ritual scales by structure, not by gate.

## 5. Wiring

| Surface | What changes |
|---|---|
| `programming-calendar.md` | "Weekly calls" slot Sun 18:10 in the grid (this doc is its spec); opener in §3 |
| Weekly recap | "Resolved calls" line after the numbers line — verdicts + evidence links; `build_recap.py` stays a drafter, owner fills this line by hand until the events exist |
| `funnel-scorecard.md` | Manual counts gain `calls_posted`, `calls_resolved`, `repeat_callers`; health row: repeat-callers is the community-side proxy for the return-visit metric (M12) until `prediction_made`/`outcome_inspected` ship |
| `analytics-events.json` | No change — the six PENDING observer events are already specced; when they go live the thread ritual becomes an onboarding path *into* the product feature, not a competitor to it |
| `welcome-sequence.md` | One line in the day-1 orientation: "predict what happens next — we check the calls against next week's recap" |

## 6. Failure modes watched

- **Stake creep** — members proposing credit wagers. Always no: credits
  are non-transferable, and a betting ring is a moderation and product
  problem this ritual was designed to avoid. Point to rule 4.
- **Motive-mining** — calls phrased as outcome but resolving on inferred
  intent ("they'll make up" = "someone apologizes"). Rewrite to the
  observable surface or reject; the recap's resolution line is the model
  of the standard.
- **Call-stacking** — one member spraying ten calls to guarantee a hit.
  Rule 3's one-per-question cap is the limit; the ledger lists calls by
  question, so spray reads as spray.
- **Hindsight edits** — deleted/edited calls. Pinned rule: first call
  stands. Discord edits are visible; a member caught quietly revising
  gets a public "nice try" and the original stands. Keep it playful —
  the stakes are zero by design.
