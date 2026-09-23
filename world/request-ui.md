# Request UI — spec & copy deck (world v4)

The request lifecycle **as the player experiences it**: declare → classify →
screen → review → run → feed. Companion artifacts:

- `world/request.html` — working demo of this spec (file://-safe, pipeline
  simulated locally). Open it; every state below is reachable in it.
- `world/requests.json` — machine-readable action catalog, rates, feed
  vocabulary, fairness invariants.
- Policy source of truth: `world/moderation-notes.md` (design §11 enforcement).
  Prices: `rw-monetization-plan-2026-09-22` §2.2–2.3 (**PROPOSAL** — copy may
  quote them, never contradict them).

## 1. The request object (what the UI collects)

`action_class` · `target` · `duration` · `free_text` — declared **upfront**,
paid **upfront**, hard cap, no overrun. Free text is where intent lives; it is
the screened surface. The form never offers unpossessable targets (the 8 mains,
the landlord, other players' characters) — but text can still try, so the
screen reads text too.

## 2. Action catalog (player-facing labels)

| Action | Class | Billing | Notes shown in UI |
|---|---|---|---|
| Possess your character | compatible | 1.5 cr/min, 15–120 min | briefing = public profile + surface relationships + routine; mains unpossessable |
| Weather change | exclusive (`sky`) | flat by block: 1 h/40 · 2 h/70 · 4 h/100 cr | global cooldown 4–8 h; feed attributes ("rain called by X") |
| NPC nudge | compatible | 40 cr flat | "an ask, not mind-control"; declined → 50% auto-refund |
| Event trigger | exclusive (`venue:*`/`openair`) | 200 cr flat | one per place per 24 h; drama-manager-mediated |
| Camera director | compatible | 10 cr/30 min | view-layer only — changes nothing in-world |

Queued class = same rate −15%, slot held ≤24 h, expiry auto-refunds.

## 3. State machine

```
declared → classified(compatible|exclusive|queued) → screened(pass|deny|review)
  deny    → "not approved" + full auto-refund → feed
  review  → human queue (exclusive always; gray-zone wording) → approve|deny
  approve → run (session countdown | scheduled event | one-shot nudge)
          → end: graceful AI handoff → feed "player session ended" / refund lines
```

- **Classification is mechanical** (claims matrix `char:*`/`sky`/`venue:*`/
  `openair`/`paper:*`/`listing:*` — game branch `41_game_systems_requests.js`).
  The UI shows the class + why ("locks a shared resource" / "coexists").
- **Queued expiry**: clock starts at activation, not at review — queued
  requests never die waiting for a human; expired-queue = auto-refund.

## 4. Copy deck — every state, every denial path

Neutral, non-shaming, no appeal theater. Denials explain the *class*, never
accuse the person.

| Moment | Copy |
|---|---|
| Quote footer | "Charged upfront · hard cap" |
| Surge line | "Surge ×1.5 — this resource was booked recently — shown before you pay" |
| Low balance | "Heads up — about N min left on this session. Top up to extend." |
| Handoff | "player session ended" (feed); "AI resumed mid-action" (player view) |
| Deny: harm | "Requests that aim to hurt, humiliate, or ruin a character are never run." |
| Deny: secret extraction | "Secrets are discovered by watching, never by request." |
| Deny: possession scope | "The main cast is unpossessable — by anyone. You can only possess a character you hired." |
| Deny: real business | "The world can't see real business names. Try the parody — this neighborhood has its own." |
| Deny: legal backstop | "Request not approved." (nothing more, ever) |
| Nudge declined | "The ask was heard; the answer was no. 50% refunded — you bought the ask, not the outcome." |
| Queued expiry | "Queued request expired before activation — refunded." |
| Admin override | "admin action — <what> · affected players compensated N cr" |

## 5. Public feed vocabulary

`requested · in_review · approved · running · queued · resolved · refunded ·
not approved · admin action · player session ended` — must match
`gsViewerState` event types at merge (marketing's demo page labels are marked
illustrative until this sync lands; `requests.json` carries the list).

## 6. Fairness invariants surfaced in UI

Cooldowns never purchasable · surge shown pre-payment · hard cap, no overrun ·
queued-expiry auto-refund · admin overrides compensate publicly · no auctions —
FCFS within class (queued-priority ties break subscriber-favor *within queued
class only* per plan §2.5).

## 7. Demo limits (what's simulated)

`request.html` ships without the game request bus (it lives on
`sf/game-systems`): classification, review, sessions, and feed are local
simulation. Screening is NOT a demo stub — it calls the shared engine
`world/screen.js` (`RWScreen.screenRequest`), the same function the mod
console (`world/mod-console.html`, v8) runs, implementing the §3 contract +
reason taxonomy in `world/moderation.json`. At merge, the demo's
`run/feedAdd` calls become `gsViewerState` subscriptions and `gsRequest*`
calls; the copy above is final.
