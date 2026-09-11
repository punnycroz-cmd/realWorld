#!/usr/bin/env python3
"""One tick of a villager mind.

Flow per tick:
    decay -> retrieve episodic -> reinforce(retrieved)
           -> check dangers (adrenaline) -> instincts + habits
           -> ask brain -> record habit -> add(remember) -> prune

The brain (Ask API) does the judging -- its JSON answer may carry a
``remember`` list of new lasting memories. Each entry can be a plain string
or {"text", "salience" 0-1, "kind": "episodic"|"danger", "tags": [...]}.
This module does the bookkeeping. Short-term context lives in the API
thread; long-term memory lives here.
"""
import json
import subprocess
import sys

from memory import MemoryStore, _describe_instinct

ASK_CLI = "/home/hatch/workspace/skills/ask-api/bin/ask.py"
JSON_HINT = ('{"action": "...", "say": "...", "remember": '
             '[{"text": "a new lasting memory, if any", '
             '"salience": 0.0-1.0, "kind": "episodic|danger", '
             '"tags": ["mushroom"]}]}, '
             'salience: birth of a child ~1.0, ate breakfast ~0.2; '
             'kind "danger" for poison, predator, near-death lessons '
             '(one trial, never forgotten); tags = categories so the lesson '
             'generalizes to similar things.')


def ask_brain(prompt, thread_id, timeout=600):
    cmd = [sys.executable, ASK_CLI, "--wait", "120", "--timeout", str(timeout),
           "--thread", thread_id, "--format", "json",
           "--json-hint", JSON_HINT, prompt]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True,
                             timeout=timeout + 60)
    except subprocess.TimeoutExpired:
        raise RuntimeError("brain call timed out")
    if out.returncode != 0:
        raise RuntimeError(f"brain call failed: {out.stderr[-500:]}")
    raw = out.stdout.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return json.loads(raw.splitlines()[-1])


def compose_prompt(name, soul, situation, memories,
                   dangers=None, instincts=None, habits=None):
    lines = []
    if dangers:  # adrenaline first: the body speaks before thought
        lines.append("DANGER -- your body remembers this, act on it first:")
        lines.extend(f"- {d['text']}" for d in dangers)
    who = f"You are {name}."
    if soul:
        who += f" {soul}"
    lines.append(who)
    if instincts:
        lines.append("Your instincts (born with these, not learned): " +
                     "; ".join(_describe_instinct(k, v) for k, v in instincts))
    if habits:
        lines.append("Your habits (your hands know these, you default to them): " +
                     ", ".join(f"{a}" for a, _ in habits))
    if memories:
        lines.append("What you remember (strongest first):")
        lines.extend(f"- {m['text']}" for m in memories)
    lines.append(f"Right now: {situation}")
    lines.append("Decide your next action. Reply as JSON only.")
    return "\n".join(lines)


def _parse_remember(entry):
    """Normalize a remember entry -> (text, salience, kind, tags)."""
    if isinstance(entry, str):
        return entry, 0.5, "episodic", []
    text = entry.get("text", "")
    sal = float(entry.get("salience", 0.5))
    kind = entry.get("kind", "episodic")
    kind = kind if kind in ("episodic", "danger") else "episodic"
    tags = entry.get("tags", []) or []
    return text, sal, kind, tags


def tick(store, name, thread_id, situation, brain_fn=ask_brain):
    """Run one mind tick. Returns (answer, memories_used)."""
    store.tick += 1
    store.decay()
    mems = store.retrieve(situation)
    store.reinforce([m["id"] for m in mems])   # retrieved -> strengthened
    dangers = store.relevant_dangers(situation)
    instincts = store.instincts_for(situation)
    habits = store.habits_top(5)
    prompt = compose_prompt(name, store.soul, situation, mems,
                            dangers=dangers, instincts=instincts, habits=habits)
    answer = brain_fn(prompt, thread_id)
    if answer.get("action"):
        store.record_habit(answer["action"])   # muscle memory
    for r in answer.get("remember", []) or []:
        text, sal, kind, tags = _parse_remember(r)
        if text:
            store.add(text, salience=sal, kind=kind, tags=tags)
    store.prune()
    store.save()
    return answer, mems
