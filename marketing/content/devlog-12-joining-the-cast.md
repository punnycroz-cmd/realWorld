# DRAFT → PUBLISHED — Devlog 12: "Joining the cast means signing a lease."

Status: PUBLISHED on `site/journal.html` (v117, dated 2026-09-24), text-only
per the template. Accuracy checklist re-run at publish — six-step flow,
screened-surface list (name / goes_by / bio / arrival), shared `RWScreen`
engine, taken-names inventory (8 cast + 20 faces + 3 role words), the
structured look pickers + casting-office sketch, the filled-posts fold
("13 posts are filled"), arrival bank ($1,600), deposit rule (1× rent /
0.5× room share) with the stated payment plan, payday cadence (weekly
Friday EOD entry/informal; every other Friday mid/top), the 500 cr
bill-on-approval charge with full auto-refund on post-review denial,
account slot caps (1/2/3, hard max 3), the block carry limit (proposal
number 12, stated verbatim), the free 48-hour seat waitlist with no paid
expedite, and the second-character-is-a-stranger rule — all verified
against `world/creation-ui.md` + `world/creation.json` (v25) on branch
`sf/world` (world-v77), demo `world/create.html`.

Template: `templates/devlog-post.md`.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · 2026-09-24 · Development build v77</p>
  <h2>Joining the cast means signing a lease.</h2>
  <p>
    The third step of the funnel — after watching, after requesting — is
    hiring a character, and the flow now behaves like the block itself:
    six steps, and the paperwork is real. Step one is a name checked
    against the registry on every keystroke, with the whole taken-names
    list on the table (eight cast, twenty faces, three role words) so a
    collision is never a surprise denial. Step two's bio is the public
    profile spectators will read — and it's screened by the same engine
    the <a href="how-it-works.html">request pipeline</a> runs. The look
    pickers are structured data, not prose: a casting-office sketch draws
    your picks, because rendering data doesn't need screening.
  </p>
  <p>
    Then the sim's math, out loud. The job step reads the real board —
    wages, projected income, payday cadence — and the posts that are
    already filled sit behind a labeled fold ("13 posts are filled")
    instead of vanishing. The home step signs a lease at creation: first
    month plus deposit leave the $1,600 arrival bank on day one, and when
    the bank can't carry both, a stated payment plan rides the first
    paychecks — never a waived deposit presented as paid. "Arrives
    without work" stays selectable; the honesty is the runway number,
    not a locked door.
  </p>
  <p>
    The price is flat and the timing is the promise: <b>500 credits,
    charged on approval only</b> — denied applications never bill, and a
    post-review denial auto-refunds in full. Accounts carry one slot
    (two on Resident, three on Director — three is the hard max), and the
    block itself states its carry limit on the roster — the demo runs
    the proposal number, twelve hired faces. When the card is full, the
    sign button becomes a free seat waitlist: a 48-hour offer when a
    seat opens, and no way to pay for a sooner one. And a second
    character is a stranger to your first — said out loud on the review
    step, because what you know, neither of them does.
  </p>
  <p class="muted">
    Sources: the creation flow is the world track's
    <code>world/creation-ui.md</code>/<code>creation.json</code> (v77 —
    the sketch & the seats layer), demoed in
    <code>world/create.html</code>; billing rides the game track's
    bill-on-approval seam. Pricing is the published proposal — see
    <a href="pricing.html">pricing</a>.
  </p>
</article>
```

## Accuracy checklist (run at publish, v117)

- [x] 500 cr flat / charged on approval only / denied never bills /
  post-review denial auto-refunds — `creation.json price` + creation-ui
  §"bill on approval" (game-v8 `billOnApproval`).
- [x] Slot caps 1 / 2 / 3, hard max 3/account — `creation.json
  price.slot_cap`; matches `site/pricing.html` ("max 3 per account").
- [x] Block carry limit = proposal number 12, shown verbatim —
  `creation.json` v77 block (`cap: 12`, open design §9.5); copy says
  "the proposal number," not a promise.
- [x] Seat waitlist free, 48 h offer, no paid expedite — creation-ui
  v77 "The seat waitlist".
- [x] Taken names 8 cast + 20 faces + 3 role words; keystroke
  availability — creation-ui v49/v21.
- [x] Screened surface = name/goes_by/bio/arrival on the shared
  `RWScreen.screenRequest` engine — `creation.json screening`.
- [x] $1,600 arrival bank; deposit 1× rent (0.5× room share); stated
  payment plan, never waived — creation-ui v35.
- [x] Payday: weekly Friday EOD (entry/informal), every other Friday
  (mid/top) — creation-ui v35 per `world/shifts.md`.
- [x] "13 posts are filled" fold quote — creation-ui v35 verbatim.
- [x] Second character a stranger — creation-ui v77 "Your other one."
- [x] No real SF business names; no cut-feature promises; no invented
  quotes. Adult-only (18+) rule accurate but not needed in copy.
