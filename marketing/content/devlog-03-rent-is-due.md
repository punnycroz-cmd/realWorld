# DRAFT — Devlog 3: "Rent is due on the first."

Status: PUBLISHED on `site/journal.html` (v42, dated 2026-09-24), text-only
per the template. Accuracy checklist below was re-run at publish — wage
bands, 45% target, resident count, and the Carmen/Jules/Victor housing
claims all still match `world/jobs-housing.md` + `world/leases.json`
(Carmen's lease start is 1989-03-01; Victor owns the Guerrero Victorians
and does Tuesday repairs per his bible).

Template: `templates/devlog-post.md`. Gate before publish: every claim below
must still match `world/jobs-housing.md` + `world/housing/` at publish time.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · {{DATE}} · Development build v{{N}}</p>
  <h2>Rent is due on the first.</h2>
  <p>
    A neighborhood where nobody pays rent is a neighborhood where nothing is
    at stake — so the block runs a lease ledger. All twenty-eight residents
    hold real housing: deposits paid up front, rent runs on the first of the
    month, notices when it doesn't clear. Carmen has held her Guerrero
    Street flat since 1989; Jules rents a room; Victor owns the building and
    does the Tuesday repairs himself.
  </p>
  <p>
    The economics are balanced to be cozy, not punishing. Wages run in bands —
    entry shifts (barista, clerk, courier) at $16–20 an hour in game dollars,
    mid trades at $25–35, specialists like Priya's RN shifts at $40–50, and
    the retirees on fixed incomes of about $1,600–1,900 a month. Rent is
    tuned to stay under roughly 45% of the wage it pairs with; groceries,
    transit, and utilities eat most of the rest. Savings rate is the
    difficulty knob.
  </p>
  <p>
    One wall stays up forever: game dollars and viewer credits never
    exchange. You can buy credits to file requests; you cannot buy your way
    into a resident's wallet, and no resident's rent money ever becomes a
    payout. The economy is for stakes, not for cashing out.
  </p>
  <p class="muted">
    Sources: wage bands and the 45% rent target are locked in the world
    track's jobs/housing canon (<code>world/jobs-housing.md</code>);
    per-building detail lives in <code>world/housing/</code>; the
    credit–dollar wall is design doc law.
  </p>
</article>
```

## Accuracy checklist (run at publish)

- [ ] Wage bands still match `world/jobs-housing.md` §1 (PROPOSAL-flag any
      credit-denominated numbers; none quoted here).
- [ ] "28 residents" count still true (8 mains + 20 ambients at last check).
- [ ] Carmen/Jules/Victor housing claims still match their bibles.
- [ ] No real business names; Mudhaus/El Farolote/Auerbach already canonical.
- [ ] If the credit wall's wording changed in the design doc, re-quote it.
