# The Call — non-wager prediction prompts (free observer loop)

Channel: X + Bluesky (polls where the platform allows, replies
otherwise) · Timing: 1–2/week, always BEFORE a pending thread
resolves — this file exists to open loops, `choice-and-consequence.md`
closes them · Assets: none required; optional one still from
`site/shots/` or a 5s clip of the setup.
Gate: post-launch only (needs a live thread to predict on). Polls are
platform-native — never a wager, never tied to credits or requests.

Why this arc: the free observer loop is catch up → choose someone to
follow → make a NON-WAGER prediction → inspect the outcome → revise
→ return. This file is the "prediction" step made social: we ask the
question out loud so watching becomes having a stake — with no money,
no prizes, and no skin except being right in public.

---

## Rules

- **No stakes, ever.** Nothing is wagered, won, or bought. The only
  payoff is the follow-up post showing who called it. Never tie a
  prediction to a request, a credit, or a prize.
- **Predict outcomes, not inner states.** "Will he show up?" is fair.
  "Is she sorry?" is not — the feed shows what they do, not what they
  feel, and posts must too.
- **Real pending threads only.** The outcome must be genuinely
  undecided in the sim — never ask a question whose answer is already
  on the feed, and never ask about anything we could script.
- **Always close the loop.** Every Call gets a follow-up post when
  the thread resolves (win variant AND loss variant pre-drafted
  below). An unanswered Call is a broken promise.
- **Window honesty.** If the outcome has no natural deadline, say
  "no deadline — the block doesn't run on our schedule" and revisit
  weekly.

---

## Drafts

**TC1 — the canonical first Call (launch week):**
> Make your call. {{RESIDENT}} {{SETUP_ONELINE}}.
>
> Does {{BINARY_QUESTION}}?
> ⬜ Yes — {{YES_CASE}}
> ⬜ No — {{NO_CASE}}
>
> No prize. Just being right in front of everyone. The thread so far:
> {{THREAD_URL}}

**TC2 — the commitment variant:**
> {{RESIDENT}} told {{RESIDENT_2}} they'd {{COMMITMENT}} by {{WHEN}}.
> Track record this month: {{TRACK_RECORD_ONELINE}}.
>
> Your call — do they make it? Poll below. Answer when it lands:
> {{THREAD_URL}}

**TC3 — the open-ended variant (replies, not poll):**
> Open question for the watchers: {{RESIDENT}} has been
> {{PATTERN_ONELINE}}. What breaks the pattern — or does anything?
> Wrong answers welcome. Ours is in the replies.

**TC4 — the fork variant (not binary):**
> Three ways this goes: {{OPTION_A}} / {{OPTION_B}} / something none
> of us called. The third option has won before.
>
> Call it. {{THREAD_URL}}

**TC5 — the new-viewer variant (after traffic spikes):**
> Quick way into the block: pick a resident, watch what they do this
> week, and call what they do next. You don't need the lore — the
> catch-up is {{CATCHUP_URL}} and the current open question is below.

---

## Follow-up posts (close the loop — required)

**TF-yes — the yes-callers were right:**
> Called it. {{RESIDENT}} {{OUTCOME_ONELINE}} — the feed stamped it
> {{TIMESTAMP}}.
>
> {{N}}% of you saw it coming. The other thread nobody called:
> {{NEXT_THREAD_URL}}

**TF-no — the no-callers were right:**
> The block called your bluff — {{RESIDENT}} {{OUTCOME_ONELINE}}.
>
> {{N}}% said yes. The clip of what happened instead:
> {{THREAD_URL}}

**TF-wild — option three won:**
> Nobody called it. Not us either. {{OUTCOME_ONELINE}} —
> {{THREAD_URL}}
>
> This is why the polls are free.

---

## Production notes

- Poll duration: 48h max, or close early if the feed resolves first —
  a Call outliving its outcome is the checker-catchable failure.
- Keep a running scoreboard in `post-review.md`: how many Calls the
  audience got right. "The audience is 6–4 against the block" is a
  great recurring meta-post — and honest, because it's countable.
- Calls double as thread-following onboarding: every Call names the
  resident and links the thread, which is the "choose someone to
  follow" step of the loop.
- Degraded mode: if no thread is pending, don't post. A Call about
  nothing is astrology.
- **Register before posting.** Every Call is a row in
  `social/threads.json` (v184) *before* it goes out — id, residents,
  `thread_url`, `call.posted`. `tools/thread_check.py --report` is the
  audit: it FAILs a resolved called thread with no follow-up, sweeps
  threads open >14d, flags polls that outlived their deadline, and
  keeps the audience scoreboard countable.
