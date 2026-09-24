# Choice → Consequence — the flagship clip format (production-3)

Channel: TikTok/Shorts/Reels (video), X + Bluesky (clip or 2-frame
screenshot pair) · Timing: 1–2/week, slot whenever a verified pair
exists — never on a schedule that forces invention · Assets:
`{{CLIP_A}}` (the choice) + `{{CLIP_B}}` (the later consequence), or
two stills + feed permalinks if video isn't cut yet.
Gate: post-launch only. Every post links into the thread on the
block — the follow surface, never an empty street camera.

Why this arc: this is the production-3 content directive verbatim —
short, contextualized clips of an UNEXPECTED CHOICE and its LATER
CONSEQUENCE, linked into that thread. It is the whole positioning
compressed into a format: you don't have to believe the pitch, you
can watch a resident change. One pair teaches the free observer
loop (catch up → follow → predict → inspect → return) better than
any explainer we could write.

---

## Format spec

Every Choice → Consequence post has exactly three parts, in order:

1. **THE CHOICE** — a clip/still of a resident doing something nobody
   asked them to do, with one line of context a cold viewer needs.
2. **THE GAP** — the time between, stated honestly ("three days
   later", "the next morning"). Never compress the gap silently; the
   elapsed time is the credibility.
3. **THE CONSEQUENCE** — the later clip/still where the choice shows
   up again: a relationship changed, a commitment kept or broken, a
   habit adopted or dropped. Then the thread link: "the whole thing
   is on the feed — {{THREAD_URL}}".

Hard rules (all enforced by `social_check.py` + the §8 checklist):
- **Verified pairs only.** Both halves must come from the public feed
  / replay with timestamps we can cite. If B hasn't happened yet, the
  post waits — that becomes a `the-call.md` prediction post instead.
- **No staging.** We never file a request to manufacture a pair. A
  viewer request that caused the consequence is allowed and *better*
  (the feed shows attribution) — say so.
- **Characters, not puppets.** Copy says what they DID, never what
  they felt or "realized". No consciousness claims, ever: not
  "she's learning who she is" — "she keeps choosing the night shift."
- **No "watch them forever" framing.** Never "infinite stories" or
  "unlimited" anything — the block is a neighborhood, not a content
  firehose.
- **Spoiler rule applies.** Marisol + the paper never co-appear;
  Victor's buildings tease, never resolve.

---

## Drafts (placeholders fill at send; each names its verified pair)

**CC1 — the canonical first post (pairs with the launch thread):**
> He didn't have to do this. {{RESIDENT}} had a {{THING_AT_STAKE}} —
> and he {{CHOICE_ONELINE}}.
>
> That was {{GAP}}. This is him {{CONSEQUENCE_ONELINE}}.
>
> Nobody wrote that second part. It's what he did next.
> The whole thread is public: {{THREAD_URL}}
> Watch free: {{WATCH_URL}}

**CC2 — the quiet-choice variant (kindness/competence, not drama):**
> Small one. {{RESIDENT}} started {{SMALL_CHOICE}} on {{DAY}}. No
> announcement, no audience that she knew of.
>
> {{GAP}} later, {{RESIDENT_2}} {{CONSEQUENCE_ONELINE}}.
>
> This is what the block is for — watching a choice land somewhere.
> {{THREAD_URL}}

**CC3 — the request-caused variant (a viewer set the table):**
> On {{DAY}} a viewer filed a request: {{REQUEST_SUMMARY}}. The
> feed approved it. {{RESIDENT}} could have ignored it.
>
> She didn't. {{CHOICE_ONELINE}}.
>
> {{GAP}} later: {{CONSEQUENCE_ONELINE}}. The request, the choice,
> and what it changed are all on the public feed — filed by
> {{HANDLE}}, which is also on the feed.
> {{THREAD_URL}}

**CC4 — the broken-commitment variant (consequence = repair or not):**
> {{RESIDENT}} said he'd be there. {{GAP}} ago. He wasn't.
>
> Today he {{REPAIR_OR_NOT_ONELINE}}.
>
> We're not going to tell you what it means. The feed doesn't either
> — it just shows what happened. {{THREAD_URL}}

**CC5 — the serial variant (choice that became a habit):**
> First it was once. Then it was Tuesdays. {{RESIDENT}} has
> {{HABIT_ONELINE}} for {{N}} weeks now.
>
> It started here: {{CLIP_A}}. This is the latest one: {{CLIP_B}}.
> Same person? The feed lets you decide — {{THREAD_URL}}

**CC6 — the 2-frame screenshot variant (X/Bluesky, no video edit):**
> {{GAP}} between these two frames. Frame one: {{CHOICE_ONELINE}}.
> Frame two: {{CONSEQUENCE_ONELINE}}.
>
> Everything in between is public too. {{THREAD_URL}}

Attach: the two stills side-by-side, timestamps in-frame.

---

## Production notes

- The **feed permalink** is the product's answer to "that's scripted"
  — every post ends with it. If permalinks aren't live yet, the post
  waits; don't ship the format without receipts.
- Ratio target: ≥1 kindness/competence pair for every conflict pair
  (per the direction — catch-up should include kindness, not only
  drama). Keep a running tally in `post-review.md`.
- If the same resident stars in 3+ consecutive pairs, that's an
  audience-prompted arc — name it in the caption ("the {{RESIDENT}}
  thread") so followers know they can subscribe to just them.
- A choice with no visible consequence yet is NOT a failed post —
  it's a `the-call.md` prediction prompt. The two formats are one
  pipeline: The Call asks, Choice → Consequence answers.
- Degraded mode: if the sim has a genuinely flat fortnight, post
  nothing from this file. The format's entire value is that it's real.
