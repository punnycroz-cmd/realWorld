# Weekly feedback batch — TEMPLATE

**How to use (COMMUNITY-FUNNEL.md §7):** during the week, paste each
`#feedback` / social-reply item below as ONE bullet, already sanitized —
no handles, no PII, no screenshots, one line each. On triage day run:

```bash
python3 marketing/tools/feedback_router.py this-batch.md > inbox-entry.txt
```

and paste the output into `devin-reviews/sf-shared-inbox.md` (the tool
prints, never appends). Tags: `bug` `balance` → game-systems ·
`content-wish` → world-builder · `moderation-issue` → owner-review ·
`faq` → recurring question, candidate for `site/faq.html`.

Delete this header block before routing, or leave it — only `- tag | text`
lines are parsed; everything else is ignored.

---

- bug | example: request queue showed "queued" but feed never listed it
- balance | example: showtime-class surcharge surprised three separate watchers
- content-wish | example: watchers keep asking for a marina-fog venue
- moderation-issue | example: request text tried to name a real SF address
- faq | example: "is watching really free" asked 4× this week
