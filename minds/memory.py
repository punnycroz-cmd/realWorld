#!/usr/bin/env python3
"""Multi-system memory for one villager mind.

Four systems, like a real brain:

- EPISODIC: events ("Tomas shared his bread"). Hebbian: retrieval
  strengthens, disuse decays, the weak are pruned. Forgetting is a feature.
- DANGER (flashbulb / urgent): one-trial learning ("the red mushroom made
  me vomit"). Pinned: barely decays, never pruned, generalizes to similar
  stimuli (one bad mushroom -> caution toward all unknown fungi), and
  hijacks the prompt as a WARNING when relevant -- the adrenaline path.
- HABIT (muscle): actions repeated become automatic. Strength follows
  1 - exp(-count/k); the brain is told what the hands know, so it defaults
  to them. Pairs with Natura's skill levels: skill = how well the hands do
  it, habit = how automatically they reach for it.
- INSTINCT (gene): innate priors, never learned. A child who never saw a
  snake still fears it. Static table, never decays.

The brain judges salience via the "remember" field of its JSON answer
(kind "episodic"|"danger", optional tags). This module does the bookkeeping:
deterministic, zero AI tokens. The API stays a pure reasoning engine.
"""
import json
import math
import os
import re

_WORD = re.compile(r"[a-z0-9']+")


def _norm(w):
    """Light plural normalization so 'mushrooms' matches tag 'mushroom'."""
    if w.endswith("ies") and len(w) > 4:
        return w[:-3] + "y"
    if w.endswith("es") and len(w) > 4:
        return w[:-2]
    if w.endswith("s") and len(w) > 3:
        return w[:-1]
    return w


def _words(text):
    return set(_norm(w) for w in _WORD.findall(text.lower()))


# Memory fidelity as a personality trait: two numbers per villager.
TRAITS = {
    "sharp":     {"decay": 0.99,  "reinforce": 0.8, "danger_decay": 0.9995},
    "average":   {"decay": 0.96,  "reinforce": 0.6, "danger_decay": 0.999},
    "forgetful": {"decay": 0.90,  "reinforce": 0.4, "danger_decay": 0.998},
}

# Gene memory: innate human priors. Valence -1 (fear/disgust) .. +1 (drawn to).
# Not learned, never decay. A villager can override/extend per individual.
HUMAN_INSTINCTS = {
    "snake": -0.9,
    "rotting smell": -0.8,
    "baby crying": 0.8,
    "deep water": -0.7,
    "stranger at night": -0.6,
    "heights": -0.5,
    "blood": -0.5,
    "darkness": -0.4,
    "fire": 0.4,
    "warmth": 0.3,
}

# Stimulus generalization: a danger tagged with the key also fires for these.
GENERALIZATION = {
    "mushroom": ["fungus", "toadstool", "mold", "mildew"],
    "snake": ["serpent", "adder", "viper"],
    "berry": ["berries"],
    "wolf": ["wolves"],
    "spoiled": ["rotten", "rotting", "rancid"],
}

_HABIT_K = 8.0  # ~8 repetitions to reach 63% automaticity


def _describe_instinct(key, valence):
    v = valence
    if v <= -0.8:
        return f"you fear {key} deeply"
    if v <= -0.5:
        return f"you are wary of {key}"
    if v <= -0.2:
        return f"{key} unsettles you"
    if v >= 0.8:
        return f"you are drawn to {key}, you must respond"
    if v >= 0.5:
        return f"{key} comforts you"
    return f"you like {key}"


class MemoryStore:
    def __init__(self, path, soul="", trait="average", decay=None,
                 reinforce=None, prune_below=0.08, max_items=150, top_n=6,
                 instincts=None):
        t = TRAITS.get(trait, TRAITS["average"])
        self.path = path
        self.soul = soul
        self.trait = trait
        self.decay_rate = t["decay"] if decay is None else decay
        self.reinforce_amt = t["reinforce"] if reinforce is None else reinforce
        self.danger_decay = t["danger_decay"]
        self.prune_below = prune_below
        self.max_items = max_items
        self.top_n = top_n
        self.instincts = dict(HUMAN_INSTINCTS)
        if instincts:
            self.instincts.update(instincts)
        self.tick = 0
        self.items = []   # dicts: id/text/weight/kind/tags/created/last_hit/salience
        self.habits = {}  # action -> repetition count (muscle memory)
        self._next_id = 1
        self.load()

    # ---- persistence -------------------------------------------------
    def load(self):
        if not os.path.exists(self.path):
            return
        with open(self.path) as f:
            data = json.load(f)
        self.soul = data.get("soul", self.soul)
        self.trait = data.get("trait", self.trait)
        self.tick = data.get("tick", 0)
        self._next_id = data.get("next_id", 1)
        self.items = data.get("items", [])
        self.habits = data.get("habits", {})
        if data.get("instincts"):
            self.instincts.update(data["instincts"])
        for it in self.items:  # backward compatibility with v1 files
            it.setdefault("kind", "episodic")
            it.setdefault("tags", [])

    def save(self):
        tmp = self.path + ".tmp"
        with open(tmp, "w") as f:
            json.dump({"soul": self.soul, "trait": self.trait,
                       "tick": self.tick, "next_id": self._next_id,
                       "items": self.items, "habits": self.habits,
                       "instincts": self.instincts}, f)
        os.replace(tmp, self.path)

    # ---- episodic: add / retrieve / reinforce / decay / prune ---------
    def add(self, text, salience=0.5, kind="episodic", tags=None):
        """Add a memory; exact duplicates reinforce the existing item."""
        text = " ".join(str(text).split())
        if not text:
            return None
        salience = max(0.0, min(1.0, float(salience)))
        kind = kind if kind in ("episodic", "danger") else "episodic"
        norm = text.lower()
        for it in self.items:
            if it["text"].lower() == norm:
                self.reinforce([it["id"]], self.reinforce_amt * (0.5 + salience))
                it["salience"] = max(it["salience"], salience)
                if kind == "danger":
                    it["kind"] = "danger"  # escalation: now it's a danger memory
                return it["id"]
        item = {"id": self._next_id, "text": text,
                "weight": 0.3 + 0.7 * salience,
                "kind": kind, "tags": list(tags or []),
                "created": self.tick, "last_hit": self.tick,
                "salience": salience}
        self._next_id += 1
        self.items.append(item)
        return item["id"]

    def _score(self, item, query_words):
        overlap = len(_words(item["text"]) & query_words) / max(1, len(query_words))
        age = self.tick - item["last_hit"]
        recency = 1.0 / (1.0 + 0.15 * age)
        return item["weight"] * (0.4 + 0.6 * recency) * (1.0 + 2.0 * overlap)

    def retrieve(self, situation, top_n=None):
        """Top episodic memories for a situation, strongest first."""
        qw = _words(situation)
        ranked = sorted((it for it in self.items if it["kind"] == "episodic"),
                        key=lambda it: self._score(it, qw), reverse=True)
        return ranked[:(top_n if top_n is not None else self.top_n)]

    def reinforce(self, ids, amount=None):
        amt = self.reinforce_amt if amount is None else amount
        idset = set(ids)
        for it in self.items:
            if it["id"] in idset:
                it["weight"] = min(2.0, it["weight"] + amt)
                it["last_hit"] = self.tick

    def decay(self):
        for it in self.items:
            rate = self.danger_decay if it["kind"] == "danger" else self.decay_rate
            it["weight"] *= rate

    def prune(self):
        """Drop near-dead episodic items; dangers are pinned (never pruned);
        overflow folds into a summary so nothing vanishes without a trace."""
        self.items = [it for it in self.items
                      if it["kind"] == "danger" or it["weight"] >= self.prune_below]
        episodic = [it for it in self.items if it["kind"] == "episodic"]
        if len(episodic) > self.max_items:
            episodic.sort(key=lambda it: it["weight"])
            excess = episodic[:len(episodic) - self.max_items]
            kept_eps = episodic[len(episodic) - self.max_items:]
            summary = ("Older memories: " +
                       "; ".join(e["text"] for e in excess[:10]))
            if len(excess) > 10:
                summary += f"; (+{len(excess) - 10} more)"
            avg_w = sum(e["weight"] for e in excess) / len(excess)
            kept_eps.append({"id": self._next_id, "text": summary,
                             "weight": avg_w, "kind": "episodic", "tags": [],
                             "created": self.tick, "last_hit": self.tick,
                             "salience": 0.2})
            self._next_id += 1
            self.items = ([it for it in self.items if it["kind"] == "danger"]
                          + kept_eps)

    def heaviest(self, n=5):
        return sorted(self.items, key=lambda it: it["weight"], reverse=True)[:n]

    # ---- danger: flashbulb memory ------------------------------------
    def relevant_dangers(self, situation):
        """Danger memories whose tags (generalized) or text match the
        situation. The adrenaline path: checked before deliberation."""
        qw = _words(situation)
        out = []
        for it in self.items:
            if it["kind"] != "danger":
                continue
            tags = set(it.get("tags") or [])
            expanded = set(tags)
            for tg in tags:
                expanded.update(GENERALIZATION.get(tg, []))
            if expanded & qw:
                out.append(it)
            elif len(_words(it["text"]) & qw) >= 2 and it["weight"] > 0.3:
                out.append(it)  # untagged fallback needs stronger evidence
        return sorted(out, key=lambda it: it["weight"], reverse=True)

    # ---- habit: muscle memory ----------------------------------------
    def record_habit(self, action):
        action = " ".join(str(action).split()).lower()
        if not action:
            return
        self.habits[action] = self.habits.get(action, 0) + 1

    def habit_strength(self, action):
        n = self.habits.get(" ".join(str(action).split()).lower(), 0)
        return 1.0 - math.exp(-n / _HABIT_K)

    def habits_top(self, n=5):
        ranked = sorted(self.habits.items(),
                        key=lambda kv: self.habit_strength(kv[0]), reverse=True)
        return [(a, self.habit_strength(a)) for a, _ in ranked[:n]
                if self.habit_strength(a) > 0.15]

    # ---- instinct: gene memory ---------------------------------------
    def instincts_for(self, situation):
        """(key, valence) relevant now: matching keys plus the 3 strongest,
        strongest first."""
        low = situation.lower()
        matched = [(k, v) for k, v in self.instincts.items() if k in low]
        strong = sorted(self.instincts.items(),
                        key=lambda kv: abs(kv[1]), reverse=True)[:3]
        seen = {k for k, _ in matched}
        combined = matched + [(k, v) for k, v in strong if k not in seen]
        return sorted(combined, key=lambda kv: abs(kv[1]), reverse=True)
