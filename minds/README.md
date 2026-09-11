# Villager minds — multi-system memory

Long-term memory for Natura villagers. The Ask API stays a pure reasoning
engine; this module is the memory.

## The four systems

Like a real brain, memory is not one thing:

- **EPISODIC** — events ("Tomas shared his bread"). Hebbian dynamics:
  retrieval strengthens, disuse decays, the weak are pruned. Forgetting is
  a feature. The brain nominates entries via the `remember` field, with a
  salience score (the amygdala stamp).
- **DANGER** (flashbulb / urgent) — one-trial learning ("the red mushroom
  made me vomit"). Pinned: barely decays, never pruned, generalizes to
  similar stimuli (one bad mushroom -> caution toward all unknown fungi),
  and hijacks the prompt as a WARNING when relevant — the adrenaline path,
  checked before deliberation. Plural-insensitive matching.
- **HABIT** (muscle) — actions repeated become automatic. Strength follows
  `1 - exp(-count/8)`; the brain is told what the hands know and defaults
  to it. Pairs with Natura's skill levels: skill = how well the hands do
  it, habit = how automatically they reach for it.
- **INSTINCT** (gene) — innate priors, never learned, never decay. A child
  who never saw a snake still fears it. `HUMAN_INSTINCTS` table, per-
  villager overridable.

Imperfection is deliberate: villagers misremember, forget, and diverge —
that is what makes them feel human. The rule is *imperfection in the mind,
transparency in the machinery*: every weight is visible in the JSON file,
so false beliefs can be found and corrected.

## Tick flow

```
decay -> retrieve episodic -> reinforce(retrieved)
       -> relevant dangers (WARNING) -> instincts + habits
       -> ask brain -> record habit -> add(remember) -> prune -> save
```

Short-term context lives in the API thread (`thread_id` per villager);
long-term memory lives here — the hippocampus/cortex split.

## Usage

```python
from memory import MemoryStore
from mind import tick

store = MemoryStore("sanna_memory.json",
                    soul="A weaver's daughter, kind but cautious.",
                    trait="sharp")  # sharp | average | forgetful
answer, used = tick(store, "Sanna", "sanna",
                    "Morning. Hunger 70, sunny. Tomas is nearby.")
print(answer["action"])
```

The store file carries the **soul card** (`soul`): hand-maintained durable
facts prepended to every prompt. If a thread is ever wiped, soul card +
memory file re-seed the brain. Habits and instincts persist in the file too.

Thread hygiene (operational): a villager's short-term thread can be
inspected or wiped with the Ask CLI —
`ask.py --inspect-thread <id>` / `ask.py --clear-thread <id>`.
Use this if a thread ever looks confused: the memory file + soul card
remain the source of truth, and the next tick re-seeds the fresh thread.

## The brain's `remember` contract

Each entry: `{"text", "salience" 0.0-1.0, "kind": "episodic"|"danger",
"tags": [...]}` (a plain string also works; salience defaults to 0.5).
`"kind": "danger"` is for poison, predator, near-death lessons — one trial,
never forgotten. `tags` are categories so the lesson generalizes.

## Tuning

`MemoryStore(path, soul=..., trait="average", decay=None, reinforce=None,
prune_below=0.08, max_items=150, top_n=6, instincts=None)`

- `trait` — `sharp` (slow forgetting), `average`, `forgetful` (fast).
  Memory fidelity as a personality trait.
- `decay` / `reinforce` — override the trait's numbers directly.
- `prune_below` — episodic items under this weight are dropped (dangers exempt).
- `max_items` — episodic overflow folds weakest into one summary item.
- `top_n` — episodic memories sent per question (token budget).
- `instincts` — dict overriding/adding to `HUMAN_INSTINCTS` for this villager.
