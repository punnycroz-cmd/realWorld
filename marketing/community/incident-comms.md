# Incident comms — community-facing playbook

**Version:** v84 · 2026-09-23 · branch `sf/marketing` · LOCAL ONLY
**Parent spec:** `COMMUNITY-FUNNEL.md` §4 (moderation scopes — this is
community *communications*, not in-world moderation), `MODERATION-PLAN.md`
(in-world incident runbook — owns the fix side).
**Status:** copy-ready; OWNER-GATED until the server exists.

`MODERATION-PLAN.md` covers what happens *inside* the sim during an
incident. This playbook covers what we *say* — where, how fast, in what
words. The brand is honesty ("screened, not staged"), so incident comms
is where the brand either holds or dies.

---

## 1. Incident classes and first-response lanes

| Class | Example | First response | Where | Clock |
|---|---|---|---|---|
| Feed incident | Harmful request text reached the public feed | Holding note + removal confirmation | `#announcements` + pin in `#the-feed` | ≤2h from aware |
| Downtime | Site/feed unreachable | One line, no ETA promises | `#announcements` | ≤1h from confirmed |
| Moderation backlash | Ban/timeout disputed publicly | Logged rationale, no public trial | `#mod-log` internally; one calm reply in-channel | Same day |
| Data/privacy | Any suspicion member data was exposed | Stop, escalate to owner — nothing public before owner | Internal only | Immediate |
| Sim behavior scare | Characters did something disturbing that no request caused | Explain the boundary honestly: emergent behavior is inviolable, requests are screened | `#the-block`, recap line if it lingers | Same day |

**Never:** silent deletion (the feed is attributed; an unexplained
disappearance reads as a cover-up), blame-the-AI framing for things that
were actually our pipeline's fault, ETA promises ("back in ~20 min"
becomes a screenshot at +40).

## 2. Holding statements (copy-ready, edit bracketed bits only)

**Feed incident:**
> A request containing [class of content — e.g. "targeted harassment"]
> appeared on the public feed at [time]. It's been removed and the
> request revoked. The screening pipeline should have caught it before
> render — we're looking at why it didn't. We'll post what changed in
> the recap.

**Downtime:**
> The [site/feed] is down on our end — we're on it. No ETA yet; we'll
> say when it's back. Anything filed in the gap is safe — the queue
> holds requests, it doesn't drop them. *(Only post the queue line if
> the design actually guarantees it — confirm before sending.)*

**Moderation action questioned publicly:**
> We don't relitigate individual moderation calls in-channel, but the
> rules and the ladder are pinned — the call followed [rule N]. If
> someone thinks the *rule* is wrong, `#feedback` is the right place
> and it gets read every week.

**Sim behavior scare:**
> No one requested that — it emerged, and emergent behavior isn't
> something we reach in and edit (that's the deal this world makes).
> What we screen is what *players request*. If it crossed a line the
> rules define, that's ours to answer for — tell us what you saw.

## 3. The decision tree

```
Something wrong? ──→ Is anyone's real-world safety/privacy at stake?
   │                     ├── YES → internal only, owner decides everything.
   │                     │        Never post before owner. This file stops.
   │                     └── NO ↓
   Is it visible to members right now?
   ├── YES → holding statement in-channel (§2) ≤ the class's clock.
   │        Follow-up in recap when resolved.
   └── NO (internal/caught early) → no announcement. Log it. If it
        recurs, it becomes a fix, not a comms event.
```

## 4. Standing rules

- **One voice.** Owner posts incident comms. Mods may post "aware, on it"
  only — never diagnosis, never ETA, never apology wording.
- **Recap is the resolution surface.** Every announced incident gets a
  closing line in the next recap: what happened, what changed. Skipping
  the follow-up is how trust leaks.
- **Honesty over face.** If the screening failed, say the screening
  failed. "Screened, not staged" survives a disclosed failure; it does
  not survive a discovered lie.
- **No off-platform incident comms** — social posts about incidents only
  if the incident itself was public off-platform (e.g. a viral clip of
  the feed). Discord incidents get Discord answers.
