# incident-postmortem.md — template + log convention

A launch incident is cheap; an unexamined one is expensive twice. Every
SEV-1 and SEV-2 (LAUNCH-CHECKLIST §5 ladder) gets one of these, filed within
48 h, into `deploy/incidents/YYYY-MM-DD-<slug>.md` (create the dir on first
use — don't pre-create empty dirs). SEV-3s go in MARKETINGLOG only.

The drill side is already rehearsed: `tools/incident_drill.sh` proves the
detect→rollback→verify loop works; this file is what happens AFTER the
loop, when the adrenaline is gone.

---

## Template (copy from here)

```
# Postmortem — <slug> — <YYYY-MM-DD>

**Severity:** SEV-1 | SEV-2
**Detected by:** <which detector fired first — uptime_probe / prod_smoke /
  release_manifest --verify / traffic_probe / a human / a user report>
**Detected at:** <timestamp, TZ> · **Resolved at:** <timestamp>
**Duration:** <minutes of user-visible impact>
**Owner:** <who ran the response>

## What happened
<3–6 sentences. What users saw, what was actually wrong. No blame — name
the mechanism, not the person.>

## Timeline
- HH:MM — <first anomaly / deploy / flip that preceded it>
- HH:MM — <detector fired / human noticed>
- HH:MM — <response started: which §5 row or playbook step>
- HH:MM — <mitigated (rollback / maintenance mode / flag revert)>
- HH:MM — <verified green: which check proved it>

## Impact
<Blast radius in user terms: which pages/origins, how many probes failed,
any payment or data consequence. If a claim on the site was wrong during
the window, say so — accuracy debt is impact.>

## Root cause
<The actual mechanism, one level deeper than "a bad deploy". If the root
cause is "we don't know yet", say that and list the next diagnostic step
instead of guessing.>

## What caught it (and what should have caught it sooner)
<Name the check that fired. If a cheaper check would have fired earlier —
e.g. prod_smoke caught what preflight should have — that gap is an action
item, not a footnote.>

## Action items
- [ ] <item> — owner — due — filed where (checklist row / tool change / doc fix)
- [ ] <item> — ...

## What went well
<At least one honest line. The boring parts of the runbook that worked are
the parts worth keeping boring.>
```

---

## Conventions

- **Filename:** `deploy/incidents/YYYY-MM-DD-<slug>.md`, slug = few lowercase
  words (`bad-deploy-css`, `dns-ttl-storm`). No severity in the name — the
  doc carries it.
- **Truth-conditional comms:** if the incident touched users, the matching
  draft in `social/drafts/incident-comms.md` only posts the claims this
  postmortem verifies — the postmortem is the source of truth for them.
- **Comms link-back:** append the incident-comms outcome (posted / not
  needed / still pending) to the action items.
- **Never in a postmortem:** secret values, user handles tied to flagged
  requests (MODERATION-PLAN.md keeps those in the mod console), blame.
- **Review cadence:** open action items get re-read at the next day-7 /
  day-30 checklist pass; a postmortem with all boxes ticked is done, not
  deleted.
