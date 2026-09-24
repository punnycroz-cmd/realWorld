# Counter arc — 4-post series: "Every request leaves a receipt"

Channel: X (+Bluesky mirror) · Timing: T+7 → T+13 (launch week, runs
parallel to Rent Week — this arc is about the *system*, that one is
about the *story*) · Assets: request-feed screenshots taken live
(`{{COUNTER_SHOT}}`), receipt-drawer capture (`{{RECEIPT_SHOT}}`), plus
`site/shots/` stills as fallback.
Gate: **post-launch only.** The Counter reads the live request seam
(`gsRequestSubmit`/`gsExplainRequest`, world-v60 contract). Pre-live,
every feed/receipt shot must say "demo" in copy — same honesty rule as
the Archive arc. Canon source: `world/request-ui.md` §10 (v60),
`world/requests.json` (`live_seam`, `preflight_check`, `receipt`).

Why this arc: the request feed is the product's spine — every paid
intervention is public, attributed, and keeps a receipt with a real
reference id. Most games hide the levers. Ours hands you one and posts
the result on a public board. That's the pitch and the accountability
in the same feature.

---

**Post 1 (Mon) — the counter itself**
> There's a counter on the block. You walk up, file a request — rain on
> Dolores, a slow day at Mudhaus, two residents who should meet — and it
> goes on a public board with your name on it. Every paid request in
> Real World is visible to everyone watching. No hidden levers.

Attach: `{{COUNTER_SHOT}}` — the request board mid-day, real rows
visible. Say "demo" in the caption if shot pre-launch.

**Post 2 (Tue) — the free check**
> Before you spend a credit, the Counter checks your wording for free.
> File the request, get told if it's unclear, off-limits, or pointing at
> the wrong resident — fix it, *then* pay. The meter doesn't run while
> you're still drafting.

Attach: `{{RECEIPT_SHOT}}` alt — the pre-flight panel. Honest detail:
the check screens wording, it does not guarantee the outcome — say
"checks your wording," never "approves your idea."

**Post 3 (Wed) — the receipt**
> Every request on the block ends in a receipt: a reference id, the
> wording as filed, what it cost, and what happened — approved,
> modified, denied, refunded. `rq-` followed by a number you can look
> up. Ask a game where your money went; here you can paste the link.

Attach: `{{RECEIPT_SHOT}}` — the receipt drawer open on a real `rq-`
trail. Never crop the outcome line — denied and refunded receipts are
the best proof the system is honest.

**Post 4 (Thu) — co-sponsoring**
> Some requests are too big for one wallet. The Counter lets viewers
> co-sponsor — you and three strangers split the cost of a block party
> and all four names go on the record. The feed remembers who reached
> in together.

Attach: `{{COUNTER_SHOT}}` showing a multi-sponsor row if the feed has
one; if not, text-only. Do not stage a co-sponsored request to get the
shot — §7 feed-honesty rule applies to sponsor rows too.

---

Fill-at-send tokens: `{{COUNTER_SHOT}}`, `{{RECEIPT_SHOT}}` — real
captures from the live request page, demo-labeled if pre-launch.
`rq-####` references in copy must resolve on the live Archive before
posting; if it isn't live yet, keep the phrasing generic ("a reference
id you can look up").

Pre-send: `python3 tools/social_check.py` clean on this file. §8
checklist applies; spoiler rule doesn't touch this arc (no cast
secrets), but the feed-honesty rule does — every screenshot is a real
board state.
