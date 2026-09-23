# DRAFT — Devlog 8: "The wallet shows its math."

Status: DRAFT (v57). NOT yet on `site/journal.html`. Source landed at
world-v32: `world/requests.json → wallet/appeals/co_sponsor/session_extend`
+ `world/request.html` v3 (wallet sheet UI) + `world/request-ui.md` §8.
Publish text-only per `templates/devlog-post.md` when ready.

Template: `templates/devlog-post.md`. Gate before publish: every number
below must still match `world/requests.json` (the launch pricing contract)
AND `site/pricing.html` — the site already quotes the pack ladder, so the
devlog must not contradict the page.

---

```html
<article class="card journal-post">
  <p class="post-meta">Devlog · {{DATE}} · Development build v{{N}}</p>
  <h2>The wallet shows its math.</h2>
  <p>
    The request form grew a wallet sheet, and it was designed to be
    boring. Six credit packs, $0.99 to $99.99, the same ladder the
    pricing page already publishes. A first-purchase +50% bonus, flagged
    in the sheet before the first buy — not discovered after it. A
    $200-a-day spend cap that applies to everyone, including us. Credits
    that never expire. And an itemized ledger: every debit, every refund,
    every pack buy and ad earn, line by line — because the feed already
    shows refunds publicly, and your own money deserves at least that
    much visibility.
  </p>
  <p>
    The honest parts are the unfashionable ones. Rewarded ads exist —
    2 credits a view, five a day, twenty-five a week — but they're
    opt-in from the wallet sheet only. Never a pre-roll, never a
    mid-session break, never inside the sim view. And when a request is
    declined, the appeal path is private: a different reviewer, an
    answer inside 72 hours, and no public spectacle — the feed counts
    appeals in aggregate, never names them. Two codes can't be appealed
    (legal backstop, appeal resubmit), and a reversal re-charges only
    if the request is then approved.
  </p>
  <p>
    Two smaller courtesies shipped in the same pass. Identical weather
    requests can co-sign a running override instead of queueing — same
    flat block price, every sponsor named on the feed line, cap of
    four. And a running session can buy more minutes at its own rate
    while the class cap allows — 1.5 cr/min for compatible sessions,
    camera time in +30-minute blocks — with a low balance disabling the
    button and pointing at the top-up instead of failing mid-session.
  </p>
  <p class="muted">
    Sources: the wallet contract is <code>world/requests.json → wallet</code>
    (pack ladder, +50% first buy, $200/day cap, ad caps, ledger rule);
    appeal semantics mirror <code>world/moderation.json → appeal_flow</code>;
    co-sponsor rides the game track's <code>GS_WX_OVR.sponsors</code>
    merge target; the numbers adopt the monetization plan verbatim and
    match <a href="pricing.html">the pricing page</a>.
  </p>
</article>
```

## Accuracy checklist (run at publish)

- [ ] Pack ladder still $0.99/100 → $99.99/14000 (`requests.json wallet.packs`
      vs `site/pricing.html` — they must agree or the post doesn't ship).
- [ ] +50% first purchase, once, disclosed before buy — `first_purchase_bonus`.
- [ ] $200/day spend cap; no expiration — `daily_spend_cap_usd`, `no_expiration`.
- [ ] Ad numbers 2cr/view, 5/day, 25/week, opt-in placement wording —
      `rewarded_ads.placement` verbatim.
- [ ] Appeal window 72 h, different reviewer, not-appealable codes
      `legal-backstop` + `appeal-resubmit`, aggregate-only feed visibility,
      reversal re-charges only on approval — `appeals` block.
- [ ] Co-sponsor: compatible class, same flat block price, cap 4, named
      attribution, declared intents only — `co_sponsor` block.
- [ ] Session extend: 1.5 cr/min compatible, camera 10 cr per +30 min,
      class caps hold (120 min compatible) — `session_extend` block.
- [ ] Confirm nothing above is labeled PROPOSAL on the site — pricing.html
      provisional-flag wording must be reused if still provisional.
