# DRAFT → PUBLISHED — Devlog 14: "The paper cuts both ways."

Status: PUBLISHED on `site/journal.html` (v147, dated 2026-09-24), text-only
per the template. Accuracy checklist re-run at publish — four tenant-side
instruments verified against `world/leases.json` + `world/lease-ui.md`
§§49–54 (world-v96, "the counter-paper layer", key `rw_lease_v96`), internal
demo `world/lease.html` v6:

- **Assignment** — permanent hand-off (vs. sublet's temporary one); named
  assignee screened on the same published checklist; decline needs a stated
  reason on the file ("approval not unreasonably withheld"); a balance
  blocks it (clean-ledger gate); assignee inherits terms, rent-control
  flag, and deposit verbatim — no second deposit, no reset; file scars
  stay with the unit's file, not the departing name; file-only, never a
  feed event.
- **Buyout** — cash-for-keys as an *offer* the tenant decides; offerable
  only while the lease is active (never under a live rung, never during an
  open dispute — "not a shortcut around the ladder"); a decline locks
  re-offer for 30 days and costs nothing — no fee, no mark; accepting
  posts a distinct BUYOUT credit line (same legibility rule as NOFAULT)
  plus ordinary move-out paper and the 21-day itemized deposit clock;
  offer/amount/decline are file-only — at most the neutral "Unit turning
  over —" feed line.
- **Prepaid rent credit** — voluntary; capped at 3× rent ("a bridge,
  never a deposit substitute or a favor economy"); on the 1st the charge
  posts and prepaid credit applies oldest-first before any balance — a
  prepaid month never sees a day-6 fee; never required, never a waiver of
  protections, never a screening factor, never a feed event.
- **History letter** — one per tenancy; neutral ledger terms (term dates,
  months paid, scars stated as scars, deposit disposition); portable to
  the next screening; file doc, never a feed event.

`feed_wording.never` gains `buyout_offers`/`assignments`/`prepayments`/
`history_letters` — verified verbatim in the file.

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v96</p>
  <h2>The paper cuts both ways.</h2>
  <p>
    The Rent Book was always the block's accounting of what a tenant owes.
    This week it grew counter-paper — four instruments the tenant holds,
    not the landlord. An <b>assignment</b> is the permanent hand-off a
    sublet never was: the outgoing tenant names an assignee, the assignee
    faces the same published screening checklist, a decline needs a stated
    reason on the file, and the ledger must be clean to hand over. What
    transfers is the whole thing — same terms, same rent-control flag,
    deposit carried to the new name with no second deposit and no reset.
    File scars stay with the unit's file, not the departing name.
  </p>
  <p>
    A <b>buyout</b> — cash-for-keys — is an offer, not an instruction. It
    can only be made while the lease is in good standing: never under a
    live rung, never while a dispute is open, so it can't shortcut the
    ladder. The stated amount sits on the file and the tenant decides.
    Declining costs nothing — no fee, no mark — and locks the landlord out
    of re-offering for thirty days. Accepting writes a distinct BUYOUT
    credit line, legible in the ledger like the NOFAULT code before it.
    <b>Prepaid rent</b> is voluntary credit capped at three months — a
    bridge, not a deposit substitute — that draws down oldest-first on the
    first of the month, so a prepaid month never sees a late fee. And any
    tenant can ask for a <b>history letter</b>: one per tenancy, the same
    numbers the ledger keeps in neutral terms — scars stated as scars —
    formatted to hand to the next screening.
  </p>
  <p>
    The wire rule is the quiet part: all four are file-only. The
    never-on-the-feed list gained buyout offers, assignments, prepayments,
    and history letters — tenant names and amounts never reach the
    <a href="wire.html">public feed</a>. An accepted buyout surfaces at
    most as the neutral turnover line the feed already knows. The paper
    is real; the privacy is the same as every other ledger event.
  </p>
  <p class="muted">
    Sources: the counter-paper layer is the world track's
    <code>world/leases.json</code>/<code>lease-ui.md</code> §§49–54
    (v96 — key <code>rw_lease_v96</code>), demoed internally in
    <code>world/lease.html</code> v6. Screening gate, cooldowns, caps,
    and feed wording are quoted from the file itself.
  </p>
</article>
```
