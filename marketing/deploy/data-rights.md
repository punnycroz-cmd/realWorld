# Data-rights runbook — access & deletion requests

**Version:** v149 · 2026-09-24 · LOCAL/draft — activates when `privacy@<domain>`
is provisioned (LAUNCH-CHECKLIST G6 mail decision). Nothing here is live.

`site/privacy.html` makes two promises this runbook has to keep:

1. "To ask about access or deletion of **account-level data**, write to the
   contact below" (`privacy@<domain>`).
2. The boundaries it discloses: spectator watching needs no account; the
   public feed is permanent ("assume everything you file is public");
   analytics per-visitor hash rotates daily; card data lives at Stripe, never
   on our servers.

The runbook exists so a request is a 15-minute procedure, not an invention.
Everything below must stay verbatim-consistent with privacy.html — if the
policy page changes, change this file in the same commit.

---

## 1. Intake

- **Channel:** `privacy@<domain>` only (set at G6; placeholder today). No
  in-product form at launch — there are no site accounts to hang one on.
- **Acknowledge within 72 h** with the ack template (§5). **Resolve within
  30 days** — the conservative reading of GDPR/CCPA windows; we adopt it for
  all requesters regardless of jurisdiction rather than running a residency
  check we have no data to run.
- **Log:** one line per request in the launch-day event log convention —
  date, request class (access/deletion/question), stores touched,
  resolution. No personal details in the log beyond what's needed to find
  the thread again.

## 2. Verification — proportional, not theatrical

We hold almost nothing that identifies anyone, which cuts both ways: it also
means we usually cannot verify a requester beyond the channel they used.

- **Site/analytics requests:** there is nothing to verify against (§3) —
  answer the question, don't ask for identity.
- **Stripe/payment requests:** verify via the **email on the Stripe receipt**
  — ask the requester to write from, or forward, the receipt email. Never
  ask for card numbers; the last-4 + receipt date is enough to find the
  Checkout session in the Dashboard.
- **Game account requests (post-launch):** verify via the account's
  registered contact once game accounts exist (game-track scope to add that
  field). Until then, handle-level requests are answered from the public
  record only — anyone can already read the feed.

If verification fails: say so plainly, produce nothing, done. Never hand
over records on a guess.

## 3. Per-store data map (what exists to produce or delete)

| Store | What it holds | Access answer | Deletion answer |
|---|---|---|---|
| Marketing site | Nothing per-visitor — static files, no accounts, no cookies, no forms | "There is no record to produce." | Nothing to delete |
| Analytics (Umami self-hosted, or first-party sink) | Aggregate counts + per-visitor hash that **rotates daily** (privacy.html) | Aggregate-only; per-visitor history is already gone by design | Already rotation-deleted; say so |
| Host logs (Caddy access/error) | IPs in standard access logs, host-side retention | Produce the requester's own lines if they supply IP + timeframe; rotated per host log policy | Log lines age out; don't surgically edit logs — disclose retention instead |
| Stripe | Receipts, email, tax/billing fields, last-4 — **we never see card numbers** | Export the customer's objects from Dashboard (receipts, invoices) | Stripe-side retention follows tax law; anonymize what Dashboard allows, disclose what legally must persist |
| Game — public request feed | Handle + request text + status + attribution, **permanent by design** | Point at the feed itself — it is already the access report | **Not deleted.** privacy.html says "permanently" twice; the honest answer is disclosure + handle change, not erasure. Offer handle rotation so future reads stop resolving to them |
| Game — account-level (handle record, credits ledger, moderation decisions) | Ledger kept "while the world runs" for auditability | Produce handle record + ledger entries + moderation decisions on their account | Delete/anonymize account-level fields on verified request; ledger rows are anonymized (handle → tombstone), not erased — the money audit trail is disclosed in privacy.html |
| Email inbox itself | The request thread | — | Delete the thread after the retention note (90 days) unless a dispute is open |

**The rule that makes this honest:** deletion applies to *account-level
data* — the exact phrase privacy.html uses. The public feed is not
account-level; it's the game's published record, disclosed as permanent
before a request is ever filed. We do not retro-edit the feed. If a user
is upset by that, the answer is empathy + the disclosure, never a silent
edit — a feed that rewrites itself breaks the product's core claim.

## 4. Procedure per request class

**Access ("what do you have on me")**
1. Ack (§5a).
2. Walk §3 top to bottom; produce what exists (usually: nothing + Stripe
   receipt export if they paid + their public feed entries which they can
   already see).
3. Send the done template (§5b) with the findings enumerated per store.

**Deletion ("delete my data")**
1. Ack.
2. Verify per §2 where a store has something to verify.
3. Delete/anonymize account-level rows (game track executes DB-side; this
   runbook owns the request lifecycle, not their SQL).
4. Disclose plainly what persists and why: feed entries (permanent by
   design), Stripe tax records (legal retention), ledger tombstones
   (auditability). These disclosures are the privacy policy working as
   intended — quote the page, don't apologize for it.

**Question ("how does X work")** — answer from privacy.html; no procedure.

**Complaint / dispute** — escalate to owner immediately; the 30-day clock
still runs.

## 5. Reply templates (plain text; house voice = calm, plain, no legalese)

**(a) Acknowledgment**
```
Thanks for writing. We got your request about [access/deletion] and
will resolve it within 30 days — usually much faster, because we store
very little. Short version of what we hold: the marketing site keeps no
visitor accounts; analytics counts rotate daily; payments live at
Stripe; the game's public feed is permanent by design (that was
disclosed before you filed anything). I'll come back with specifics per
system.
```

**(b) Done — access**
```
Here's everything we hold that maps to you, system by system:
[list per §3 — be literal, include "nothing" where true]
If any row surprises you, tell me which and I'll dig further.
```

**(c) Done — deletion**
```
Done, with one honest boundary. Deleted/anonymized: [list].
Retained, exactly as the privacy policy discloses: your attributed
entries on the public request feed (the feed is the game's permanent
record — we don't rewrite it), Stripe's tax-required billing records,
and anonymized ledger rows (handle removed, amounts kept for audit).
Your handle is now [tombstone/rotated] so nothing new resolves to you.
```

## 6. Consistency hooks

- **privacy.html is the contract.** Any edit to retention/deletion wording
  there requires a same-commit update here (and vice versa).
- `MODERATION-PLAN.md` owns conduct/content decisions; this file owns data
  lifecycle. A moderation action that touches account data (ban →
  anonymize?) crosses both — the plan's runbook cites this file for the
  data half.
- `deploy/infra.env.example` gains `RW_PRIVACY_CONTACT` when the mailbox is
  provisioned; until then every template says "the contact below".
- **First drill:** LAUNCH-CHECKLIST §9 day-30 — run one self-filed access
  request end-to-end and confirm every §3 row still matches reality.
