#!/usr/bin/env python3
"""Offline tests for the Hebbian memory store and tick loop (no API calls)."""
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))
from memory import MemoryStore
from mind import tick, compose_prompt

PASS = []
FAIL = []


def check(name, cond, extra=""):
    (PASS if cond else FAIL).append(name)
    print(("PASS " if cond else "FAIL ") + name + (f" -- {extra}" if extra and not cond else ""))


def fresh(**kw):
    d = tempfile.mkdtemp()
    return MemoryStore(os.path.join(d, "m.json"), **kw)


# 1. add + dedupe
s = fresh()
i1 = s.add("Tomas shared his bread with me", salience=0.8)
i2 = s.add("Tomas shared his bread with me", salience=0.8)
check("dedupe returns same id", i1 == i2)
check("dedupe reinforces instead of duplicating",
      len(s.items) == 1 and s.items[0]["weight"] > 0.3 + 0.7 * 0.8)

# 2. retrieval ranking: keyword + weight
s = fresh()
s.add("The river is dangerous when it rains", salience=0.5)
s.add("I love weaving baskets", salience=0.9)
res = s.retrieve("it is raining, should I cross the river?")
check("keyword match outranks heavier unrelated memory",
      res[0]["text"].startswith("The river"))

# 3. reinforce on retrieve
s = fresh()
i = s.add("Berries grow behind the hut", salience=0.5)
w0 = s.items[0]["weight"]
s.tick += 1
s.decay()
s.reinforce([i])
check("reinforce beats one decay step", s.items[0]["weight"] > w0)

# 4. decay over long disuse
s = fresh(decay=0.9)
s.add("A stranger passed through in spring", salience=0.3)
for _ in range(30):
    s.tick += 1
    s.decay()
s.prune()
check("long-unused weak memory is forgotten", len(s.items) == 0)

# 5. strong memories survive
s = fresh(decay=0.96)
s.add("My child was born at dawn", salience=1.0)
for _ in range(30):
    s.tick += 1
    s.decay()
    s.reinforce([s.items[0]["id"]], 0.6)  # recalled often
s.prune()
check("recalled memory survives", len(s.items) == 1)

# 6. prune folds overflow into a summary
s = fresh(max_items=5)
for k in range(10):
    s.add(f"ordinary day {k}", salience=0.2)
s.prune()
check("overflow folds into summary", len(s.items) <= 6 and
      any("Older memories" in it["text"] for it in s.items))

# 7. save/load roundtrip
s = fresh(soul="weaver's daughter")
s.add("I own a blue shuttle", salience=0.7)
s.save()
s2 = MemoryStore(s.path)
check("save/load roundtrip", s2.soul == "weaver's daughter" and
      len(s2.items) == 1 and s2.items[0]["text"] == "I own a blue shuttle")

# 8. full tick with a fake brain
s = fresh(soul="A weaver's daughter, kind but cautious.")
calls = []


def fake_brain(prompt, thread_id, timeout=600):
    calls.append((prompt, thread_id))
    assert "weaver" in prompt and "What you remember" not in prompt  # first tick: no memories yet
    return {"action": "gather_berries", "say": "I'll pick berries.",
            "remember": ["Found rich berry bushes behind the hut"]}


ans, mems = tick(s, "TestSanna", "testsanna", "Morning. Hunger 70, sunny.", brain_fn=fake_brain)
check("tick returns brain answer", ans["action"] == "gather_berries")
check("remember becomes a memory", any("berry bushes" in it["text"] for it in s.items))
check("prompt included soul", "weaver" in calls[0][0])


def fake_brain2(prompt, thread_id, timeout=600):
    assert "berry bushes" in prompt  # second tick: memory is retrieved
    return {"action": "eat", "say": "Eating.", "remember": []}


w_before = next(it for it in s.items if "berry bushes" in it["text"])["weight"]
ans2, mems2 = tick(s, "TestSanna", "testsanna",
                   "Evening. Hunger 85, near the hut.", brain_fn=fake_brain2)
w_after = next(it for it in s.items if "berry bushes" in it["text"])["weight"]
check("retrieved memory reinforced on use", w_after > w_before * 0.96)
check("thread id passed through", calls[0][1] == "testsanna")

# 9. prompt composition with memories lists strongest first
s = fresh()
s.add("weak old thing", salience=0.1)
s.add("STRONG IMPORTANT THING", salience=1.0)
p = compose_prompt("X", "", "situation", s.retrieve("thing"))
check("strongest memory listed first", p.index("STRONG") < p.index("weak old"))

# ---- new systems: danger / habit / instinct / traits ----
from mind import compose_prompt as cp2, _parse_remember

# 15. trait presets: the forgetful truly forget faster
s_sharp = fresh(trait="sharp")
s_fog = fresh(trait="forgetful")
s_sharp.add("Where I buried the seeds", salience=0.5)
s_fog.add("Where I buried the seeds", salience=0.5)
for _ in range(10):
    s_sharp.tick += 1; s_sharp.decay()
    s_fog.tick += 1; s_fog.decay()
check("forgetful trait decays faster than sharp",
      s_fog.items[0]["weight"] < s_sharp.items[0]["weight"])

# 16. danger is pinned: one trial, (almost) never forgotten
s = fresh()
s.add("Red mushroom made me vomit for a day", salience=1.0,
      kind="danger", tags=["mushroom"])
for _ in range(60):
    s.tick += 1
    s.decay()
s.prune()
check("danger memory survives 60 ticks and prune",
      len(s.items) == 1 and s.items[0]["weight"] > 0.9)

# 17. danger hijacks the prompt, with generalization (toadstool ~ mushroom)
s = fresh()
s.add("Red mushroom made me vomit for a day", salience=1.0,
      kind="danger", tags=["mushroom"])
ds = s.relevant_dangers("I see a toadstool by the path, is it food?")
check("danger generalizes to similar stimuli", len(ds) == 1)
p = cp2("X", "", "I see a toadstool by the path", [], dangers=ds)
check("danger warning leads the prompt",
      p.index("DANGER") < p.index("Right now:"))

# 18. unrelated situations don't trigger the danger
ds2 = s.relevant_dangers("Sunny morning, mending the fence.")
check("danger stays quiet when irrelevant", len(ds2) == 0)

# 19. muscle memory: repetition becomes automaticity
s = fresh()
for _ in range(12):
    s.record_habit("gather_berries")
st = s.habit_strength("gather_berries")
check("habit strength follows 1-exp(-n/k)", abs(st - (1 - 2.718281828**(-12/8.0))) < 1e-9)
p = cp2("X", "", "Morning.", [], habits=s.habits_top(5))
check("habits appear in prompt", "gather_berries" in p and "hands know" in p)

# 20. gene memory: fear without experience
s = fresh()
ins = s.instincts_for("A snake slides through the grass near the child.")
p = cp2("X", "", "A snake slides through the grass.", [], instincts=ins)
check("instinct fires with no prior experience",
      "snake" in p and "born with these" in p)

# 21. full loop: brain learns a danger, next tick the body warns first
s = fresh()
def brain_learns_poison(prompt, thread_id, timeout=600):
    return {"action": "eat_mushroom", "say": "Trying it.",
            "remember": [{"text": "Red mushroom made me vomit",
                          "salience": 1.0, "kind": "danger",
                          "tags": ["mushroom"]}]}
def brain_next_day(prompt, thread_id, timeout=600):
    assert "DANGER" in prompt, "warning must precede deliberation"
    return {"action": "avoid", "say": "Not touching that.", "remember": []}
tick(s, "X", "x", "Found red mushrooms, hungry.", brain_fn=brain_learns_poison)
d = s.items[0]
check("danger stored with kind+tags", d["kind"] == "danger" and d["tags"] == ["mushroom"])
ans, _ = tick(s, "X", "x", "More red mushrooms by the path.", brain_fn=brain_next_day)
check("one-trial learning changes next decision", ans["action"] == "avoid")

# 22. backward compatibility: v1 files without kind/tags still load
import json as _json
d = tempfile.mkdtemp()
p1 = os.path.join(d, "old.json")
_json.dump({"soul": "s", "tick": 3, "next_id": 2,
            "items": [{"id": 1, "text": "old memory", "weight": 0.5,
                       "created": 0, "last_hit": 3, "salience": 0.5}]}, open(p1, "w"))
s = MemoryStore(p1)
check("v1 file loads with defaults", s.items[0]["kind"] == "episodic" and s.items[0]["tags"] == [])

# 23. remember entry parsing
t, sal, k, tg = _parse_remember("plain string")
check("string remember defaults", (t, sal, k, tg) == ("plain string", 0.5, "episodic", []))
t, sal, k, tg = _parse_remember({"text": "x", "salience": 0.9, "kind": "weird", "tags": ["a"]})
check("unknown kind falls back to episodic", k == "episodic" and sal == 0.9)

print(f"\n{len(PASS)} passed, {len(FAIL)} failed")
sys.exit(1 if FAIL else 0)
