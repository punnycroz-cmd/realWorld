# DRAFT → PUBLISHED — Devlog 16: "The meter runs itemized."

Status: PUBLISHED on `site/journal.html` (v162, dated 2026-09-24),
text-only per the template. Accuracy checklist re-run at publish — all
five instruments verified against `world/leases.json` (version 110,
+`utilities` +`rent_board_fee` +`abandoned_property` +`change_of_terms`
+`last_month_proration`) + `world/lease-ui.md` §§55–61 (world-v110,
"the meter & leftovers layer"), internal demo `world/lease.html` v7:

- **Utilities** — tenant-paid services post as their own itemized ledger
  line each 1st (`utilities — <services>`), beside rent, never inside
  it; "a posted rent stays the posted rent". An unpaid line is a balance
  like any other and climbs the same ladder, but is never folded into
  the rent number. Billing a service the lease makes landlord-paid is a
  `contested_charge` dispute ground — "the lease term is the evidence".
- **Rent Board fee pass-through** — $59/unit annual fee on the owner's
  file (mirrors game v17's assessor module); landlord may pass up to
  50%, rounded down to the dollar, as an itemized annual `RBF` line
  naming the year and the split. Once per 12 months — "a second posting
  inside 12 months is refused outright". Never stacked with a raise.
- **Abandoned property** — move-out walkthrough writes an itemized
  notice; 15-day claim window; a dated claim doc ends it with no
  deduction; past the window a disposal doc posts and storage cost is a
  *stated* deduction cited to the notice. Nevers: disposing inside the
  window, a disposal fee not itemized, any feed event — "the block never
  sees someone's things".
- **Change of terms** — dated doc, effective ≥30 days out, month-to-month
  only (refused inside a fixed term), house terms only — "a rent change
  wearing a change-of-terms doc is refused outright". The tenant's
  `respondCOT` files the answer; a contested change can go to the board.
- **Last-month proration** — `round(rent × days-occupied / 30)`,
  itemized "last month — prorated to day N", computed at the recorded
  move-out, never rounded up; deposit clock untouched.

All five surfaces are file + ledger only — every block carries the
never-feed rule, and every new landlord tool carries the own-unit guard.

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v110</p>
  <h2>The meter runs itemized.</h2>
  <p>
    Rent was never the only number on a lease, and now the Rent Book
    says so. Tenant-paid utilities post as their own line on the first
    of the month — "utilities — &lt;services&gt;", itemized by service —
    beside rent, never inside it. A posted rent stays the posted rent;
    an unpaid utility line is a balance like any other and climbs the
    same ladder, but it is never folded into the rent number. And a bill
    for a service the lease makes landlord-paid is a contested_charge
    ground on sight — the lease term is the evidence.
  </p>
  <p>
    The block's own costs pass through on the same rules. The annual
    Rent Board fee — $59 a unit on the owner's file, the same figure the
    assessor keeps — may pass up to half to the tenant, rounded down to
    the dollar, as an itemized RBF line that names the year and the
    split. Once per twelve months; a second posting inside the window is
    refused outright, and the pass-through never stacks with a raise
    posting. When a tenancy ends mid-month, the last month prorates —
    rent times days occupied over thirty, itemized, never rounded up.
  </p>
  <p>
    The leftovers get paper too. Belongings left at move-out are a
    notice, not trash: a fifteen-day claim window, a dated claim doc
    that ends it clean, or a disposal doc whose storage cost is a stated
    deduction cited back to the notice. And house terms can change only
    on paper — a dated change-of-terms doc, thirty days out, on a
    month-to-month lease; a rent change wearing that doc is refused.
    The tenant's answer files the same way, and a contested change can
    go to the board like anything else.
  </p>
  <p>
    None of it performs. Every one of these surfaces is file and ledger
    only — the feed never sees a utility balance, a fee split, or
    someone's things. The meter runs where the meter lives.
  </p>
  <p class="muted">
    Sources: all five instruments are the world track's
    <code>world/leases.json</code> (v110) + <code>lease-ui.md</code>
    §§55–61, demoed internally in <code>world/lease.html</code> v7
    ("Rent Book"). Caps, codes, windows, and refusal rules are quoted
    from the file itself; the $59 figure mirrors game-v17's
    <code>41_game_systems_assessor.js</code>.
  </p>
</article>
```
