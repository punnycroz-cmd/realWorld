#!/usr/bin/env python3
"""demo_two.py -- two different characters, one shared brain (Ask API).

Bram (52, cautious forager, forgetful) and Sella (24, bold trader, sharp)
face the SAME situation. Each has their own memory file, soul card, and API
thread. Shows the brain differentiating by character.
"""
import json
import os
import shutil
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from memory import MemoryStore
from mind import tick

DEMO_DIR = "/tmp/demo_two_minds"
ASK_CLI = "/home/hatch/workspace/skills/ask-api/bin/ask.py"

BRAM_SOUL = ("You are Bram, 52, a cautious forager. You trust your gut, "
             "avoid risks, and speak plainly and briefly. You have seen "
             "people get sick from careless eating.")
SELLA_SOUL = ("You are Sella, 24, a bold young trader. You love a good deal, "
              "talk fast, and take calculated risks. Strangers are customers "
              "you haven't met yet.")

SITUATION = ("A ragged stranger at the edge of the clearing offers you a "
             "handful of unfamiliar red berries, smiling. Your stomach is "
             "half-full.")


def make_char(name, soul, trait, thread):
    path = os.path.join(DEMO_DIR, f"{name}.json")
    store = MemoryStore(path, soul=soul, trait=trait)
    store.thread = thread
    return store


def main():
    shutil.rmtree(DEMO_DIR, ignore_errors=True)
    os.makedirs(DEMO_DIR, exist_ok=True)

    bram = make_char("Bram", BRAM_SOUL, "forgetful", "demo-bram")
    sella = make_char("Sella", SELLA_SOUL, "sharp", "demo-sella")

    # a little lived history so they aren't blank slates
    bram.add("ate red berries from a bush like this once, felt fine",
             salience=0.4, tags=["berries", "food"])
    for _ in range(4):
        bram.record_habit("forage_berries")
    sella.add("once bought strange fruit from a traveler and sold it at "
              "triple price", salience=0.7, tags=["trade", "profit"])
    for _ in range(6):
        sella.record_habit("haggle")
    bram.save()
    sella.save()

    results = {}
    for store, name in ((bram, "Bram"), (sella, "Sella")):
        print(f"--- {name} is thinking... ---", flush=True)
        answer, mems = tick(store, name, store.thread, SITUATION)
        results[name] = {
            "action": answer.get("action"),
            "say": answer.get("say"),
            "remember": [r.get("text") if isinstance(r, dict) else r
                         for r in (answer.get("remember") or [])],
            "memories_used": len(mems),
        }
        print(f"{name}: action={answer.get('action')!r} "
              f"say={answer.get('say')!r}", flush=True)

    print("\n================ RESULT ================")
    print(json.dumps(results, indent=1, ensure_ascii=False))

    # tidy up throwaway demo threads (fast, no AI)
    for t in ("demo-bram", "demo-sella"):
        subprocess.run([sys.executable, ASK_CLI, "--clear-thread", t],
                       capture_output=True)
    shutil.rmtree(DEMO_DIR, ignore_errors=True)
    print("(demo threads cleared, demo files removed)")


if __name__ == "__main__":
    main()
