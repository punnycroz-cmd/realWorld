# Transparency report — <MONTH YYYY>

> Template for the monthly public moderation report (MODERATION-PLAN.md §6a).
> Publish in the recap post on journal.html; mirror a copy to Discord
> `#announcements`. Aggregate counts only — never a named player, never
> screened request text, never a drama seed. Every number should be
> pullable from the mod-console audit strip, the ledger, or `gsWireAudit`
> counters. If a number can't be sourced, delete the row — don't estimate.
>
> Fill rule: replace every `<...>`. Delete optional rows that are all zeros.

## The month on the block

- Requests filed: **<n>** — <compatible> compatible auto-ran,
  <exclusive> exclusive, <queued> queued.
- Requests that ran to completion: **<n>**. Refunded before activation:
  **<n>** (queued-expired <n>, denied <n>, revoked-with-compensation <n> —
  <cr> credits compensated total).

## Screening & review

- Denied at intent screening: **<n>** — top reason codes:
  `<code>` <n>, `<code>` <n>, `<code>` <n>. (Full code list:
  site/rules.html.)
- Human-reviewed: **<n>** — approved <n>, approved-trimmed <n>
  (<cr> credits returned), denied <n>.
- Median time in review: **<n> min**. (Internal target 15; we publish the
  real number, not the target.)

## Appeals & flags

- Appeals filed: **<n>** — overturned <n>, upheld <n>. Every appeal went to
  a different reviewer than the original decision; window is 72 h.
- Account flags: <n> accounts flagged; <n> reached the 7-day all-review
  threshold; <n> reached the 72-h suspension threshold; <n> owner reviews.

## The feed itself

- Display filter mode: **<A|B|C>**. Text spans filtered on the public feed:
  **<n>** (`░░░` redactions / withheld notes per mode).
- Wire audit (`gsWireAudit`): **ok — <n> issues** this month
  (0 expected; nonzero means a bug, and we'd say so here).
- Denied-request text on the feed: **0** — by construction; the audit
  greps for it.

## What we're changing

<One to three honest sentences: a threshold tuned, a canned response
rewritten, a filter gap closed — or "nothing this month," which is also a
fine report. Never promise a response time or a safety absolute.>

---
*Every paid intervention and every admin action is public on the feed with
attribution — this report is the monthly arithmetic of that ledger.
Questions: <contact address from press kit>.*
