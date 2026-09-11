#!/usr/bin/env python3
"""natura_runner.py -- the bells of the valley.

Round-robin mind ticks for the founding couple. Each bell:
    snap (NV) -> situation -> memory retrieve -> ask brain (Ask API)
    -> survival guard -> NV.order -> diary append -> big-event watch

The brain chooses ONE verb from the sim's real verb list; params.wx/wy must
be copied from the situation's lists. Deterministic survival guard (eat when
starving) is separate from the brain's reasoning.

Logs: minds/lena_diary.md, minds/joren_diary.md, minds/natura_events.md
"""
import json
import os
import sys
import time
import traceback
import urllib.request

import websocket

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from memory import MemoryStore, _describe_instinct
from mind import ask_brain, _parse_remember

PORT = 19830
BELL_GAP = 15            # politeness pause between bells; pacing is by game-hours, not wall time
SLICE_HOURS = 4          # game-hours the world advances after each bell
DIARY_DIR = os.path.dirname(os.path.abspath(__file__))

VERBS = ("wait, goto, fell, haul, saw, craft, build_hut, forage, eat, sleep, rest, "
         "give, say_to, bond, name_baby, till, plant, tend, harvest, collect, "
         "slaughter, hunt, fish")

HINT = ('{"action": "<one verb>", "params": {"wx": 0, "wy": 0}, '
        '"say": "short spoken line", "remember": [{"text": "...", '
        '"salience": 0.0-1.0, "kind": "episodic|danger", "tags": []}]}. '
        'Verbs: ' + VERBS + '. '
        'params.wx/wy MUST be integers copied from the trees/bushes/home lists. '
        'plant needs params.crop ("wheat" or "carrot"). give needs params.to (name) '
        'and params.what. say_to needs params.to and params.text. bond needs '
        'params.with (name). eat/sleep/rest/wait/hunt/fish/collect/slaughter/saw '
        'need no params. remember: lasting memories only (birth ~1.0, a meal ~0.2); '
        'kind "danger" for poison/predator/near-death (never forgotten); '
        'tags generalize the lesson.')


# ---------- NV bridge ----------
class NV:
    def __init__(self):
        tabs = json.load(urllib.request.urlopen(
            'http://127.0.0.1:%d/json/list' % PORT, timeout=5))
        pg = [t for t in tabs if t['type'] == 'page' and 'natura-v' in t.get('url', '')]
        if not pg:
            raise RuntimeError('no natura tab')
        self.ws = websocket.create_connection(pg[0]['webSocketDebuggerUrl'], timeout=60)
        self.seq = 0

    def ev(self, expr):
        self.seq += 1
        self.ws.send(json.dumps({'id': self.seq, 'method': 'Runtime.evaluate',
                                 'params': {'expression': expr, 'returnByValue': True}}))
        while True:
            m = json.loads(self.ws.recv())
            if m.get('id') == self.seq:
                r = m['result']['result']
                return r.get('value', 'EVAL:' + json.dumps(r)[:200])

    def snap(self, name):
        v = self.ev('NV.snap(%s)' % json.dumps(name))
        return v if isinstance(v, dict) else json.loads(v)

    def order(self, name, verb, params):
        o = dict(params or {})
        o['verb'] = verb
        return self.ev('NV.order(%s,%s)' % (json.dumps(name), json.dumps(o)))

    def say(self, name, text):
        self.ev('NV.say(%s,%s)' % (json.dumps(name), json.dumps(text[:220])))

    def list(self):
        return self.ev('NV.list()')

    def pause(self):
        self.ev('NV.pause()')

    def advance(self, hours):
        """Advance the world exactly `hours` game-hours while paused."""
        return self.ev('simTick(%s)' % json.dumps(hours))

    def close(self):
        self.ws.close()


# ---------- situation ----------
def daypart(tod):
    if 5 <= tod < 8: return 'dawn'
    if 8 <= tod < 12: return 'morning'
    if 12 <= tod < 15: return 'midday'
    if 15 <= tod < 18: return 'afternoon'
    if 18 <= tod < 21: return 'dusk'
    return 'night'


def describe(snap):
    me = snap['me']
    L = []
    L.append(f"Day {snap['day']:.0f}, {snap['tod']:.1f}h ({daypart(snap['tod'])}), {snap['season']}.")
    w = snap['weather']
    L.append(f"Weather: {w['temp']}C" + (", raining" if w['rain'] else "") +
             (", STORM" if w['storm'] else "") + (", FIRE NEARBY" if w['burning'] else "") + ".")
    inv = me['inv']
    inv_s = ", ".join(f"{k} {v}" for k, v in inv.items() if v) or "empty hands"
    L.append(f"You: hunger {me['hunger']}, energy {me['energy']}, hp {me['hp']}. "
             f"Doing: {me['doing']}. Carrying: {inv_s}.")
    if me['pregnant']:
        L.append(f"You are pregnant ({me['pregnant']} days left).")
    if snap.get('job'):
        L.append(f"Current job: {snap['job']['kind']}.")
    if snap.get('lastResult'):
        L.append(f"Last outcome: {json.dumps(snap['lastResult'])[:160]}.")
    for o in snap.get('others', []):
        L.append(f"{o['name']} ({o['sex']}{o['age']}) is {o['d']} cells away, {o['doing']}.")
    for ch in snap.get('littleones', []):
        L.append(f"Child {ch['name']}, age {ch['age']}, {ch['d']} cells away.")
    for m in snap.get('heard', [])[-3:]:
        L.append(f"You heard {m.get('from','?')}: \"{m.get('text','')[:80]}\"")
    trees = snap['see']['trees'][:8]
    if trees:
        L.append("Mature trees at: " + ", ".join(f"({t['wx']},{t['wy']})" for t in trees) + ".")
    bushes = snap['see']['bushes'][:6]
    if bushes:
        L.append("Berry bushes at: " + ", ".join(f"({b['wx']},{b['wy']})" for b in bushes) + ".")
    h = snap['home']
    L.append(f"Home: hut {h['huts'][0] if h['huts'] else 'none'}, "
             f"firepit bench ({h['bench']['wx']},{h['bench']['wy']}).")
    logs = snap['see'].get('logs', [])[:4]
    if logs:
        L.append(f"Loose logs (id,d): " + ", ".join(f"({l['id']},{l['d']})" for l in logs) + ".")
    if snap.get('designs'):
        L.append("Known designs: " + ", ".join(
            f"{k} (needs {d['timber']} timber)" for k, d in snap['designs'].items()) + ".")
    return "\n".join(L)


def compose(name, soul, situation, mems, dangers, instincts, habits):
    L = []
    if dangers:
        L.append("DANGER — your body remembers this, act on it first:")
        L.extend(f"- {d['text']}" for d in dangers)
    L.append(f"You are {name}. {soul}")
    if instincts:
        L.append("Instincts (born with these): " +
                 "; ".join(_describe_instinct(k, v) for k, v in instincts))
    if habits:
        L.append("Habits (your hands know these): " + ", ".join(a for a, _ in habits))
    if mems:
        L.append("You remember:")
        L.extend(f"- {m['text']}" for m in mems)
    L.append("Right now:\n" + situation)
    L.append("Choose your ONE next action. Reply as JSON only.")
    L.append('RULES: "action" must be EXACTLY one word copied letter-for-letter '
             'from the verb list — never invent an action. If you want to eat, '
             'the action is "eat". To rest by the fire use "rest", or "goto" '
             'with the bench coords. To do nothing but watch, use "wait".')
    return "\n".join(L)


NEEDS_COORDS = {'goto', 'fell', 'haul', 'build_hut', 'forage', 'till', 'plant',
                'tend', 'harvest'}
KEYWORD_FALLBACK = [
    ('eat', 'eat'), ('food', 'eat'), ('meal', 'eat'), ('sleep', 'sleep'),
    ('nap', 'sleep'), ('rest', 'rest'), ('forage', 'forage'), ('berr', 'forage'),
    ('fell', 'fell'), ('chop', 'fell'), ('build_hut', 'build_hut'),
    ('hut', 'build_hut'), ('craft', 'craft'), ('saw', 'saw'), ('hunt', 'hunt'),
    ('fish', 'fish'), ('till', 'till'), ('plant', 'plant'), ('harvest', 'harvest'),
    ('tend', 'tend'), ('water', 'tend'), ('collect', 'collect'),
    ('slaughter', 'slaughter'), ('bond', 'bond'), ('talk', 'say_to'),
    ('speak', 'say_to'), ('give', 'give'), ('wait', 'wait'), ('stay', 'wait'),
    ('watch', 'wait'),
]


def map_action(action, params):
    """Map the brain's action to a real verb, with keyword fallback."""
    a = str(action or 'wait').strip().lower().replace(' ', '_')
    if a in VERBS.split(', '):
        verb = a
    else:
        verb = 'wait'
        for v in VERBS.split(', '):
            if v in a or a in v:
                verb = v
                break
        else:
            for kw, v in KEYWORD_FALLBACK:
                if kw in a:
                    verb = v
                    break
    if verb in NEEDS_COORDS and not (
            isinstance(params.get('wx'), int) and isinstance(params.get('wy'), int)):
        return 'wait', {}, f"brain said '{action}' — no coords given, waiting instead"
    note = None if verb == a else f"brain said '{action}' — mapped to '{verb}'"
    return verb, params, note


# ---------- the bell ----------
def bell(nv, char):
    name, store, thread = char['name'], char['store'], char['thread']
    snap = nv.snap(name)
    if snap.get('error'):
        return None, f"{name} is gone from the valley."
    situation = describe(snap)

    store.tick += 1
    store.decay()
    mems = store.retrieve(situation)
    store.reinforce([m['id'] for m in mems])
    dangers = store.relevant_dangers(situation)
    instincts = store.instincts_for(situation)
    habits = store.habits_top(5)
    prompt = compose(name, store.soul, situation, mems, dangers, instincts, habits)

    answer = ask_brain(prompt, thread, timeout=600)
    action, params, diary_note = map_action(answer.get('action'), answer.get('params'))
    say = str(answer.get('say', '') or '')[:220]

    # survival guard: starving with food in hand -> eat, whatever the brain said
    guard = None
    me = snap['me']
    if me['hunger'] < 0.15 and (me['inv'].get('food', 0) > 0 or me['inv'].get('berries', 0) >= 2) \
            and action != 'eat':
        guard = f"guard overrode '{action}' -> eat (hunger {me['hunger']})"
        action, params = 'eat', {}

    result = nv.order(name, action, params)
    if say:
        nv.say(name, say)
    if action != 'wait':
        store.record_habit(action)
    new_danger = False
    for r in answer.get('remember', []) or []:
        text, sal, kind, tags = _parse_remember(r)
        if text:
            store.add(text, salience=sal, kind=kind, tags=tags)
            if kind == 'danger':
                new_danger = True
    store.prune()
    store.save()

    # diary
    stamp = f"Day {snap['day']:.0f}, {snap['tod']:.1f}h"
    lines = [f"## {stamp} — bell {store.tick}",
             f"Doing: {me['doing']} | hunger {me['hunger']} energy {me['energy']} hp {me['hp']}",
             f"Action: {action} {json.dumps(params)[:120]} -> {result}"]
    if guard:
        lines.append(f"GUARD: {guard}")
    if diary_note:
        lines.append(f"NOTE: {diary_note}")
    if say:
        lines.append(f"Said: \"{say}\"")
    rems = [(_parse_remember(r)[0]) for r in (answer.get('remember', []) or [])]
    rems = [t for t in rems if t]
    if rems:
        lines.append("Remembered: " + " | ".join(rems[:3]))
    lines.append("")
    with open(os.path.join(DIARY_DIR, f"{name.lower()}_diary.md"), 'a') as f:
        f.write("\n".join(lines) + "\n")

    events = []
    if new_danger:
        events.append(f"{name} learned a DANGER: {rems[-1][:100] if rems else '?'}")
    return {'action': action, 'result': result, 'say': say, 'guard': guard,
            'stamp': stamp, 'snap': snap}, events


# ---------- big-event watch ----------
def watch(prev, name, info, nv):
    events = []
    snap = info['snap']
    me = snap['me']
    p = prev.get(name, {})
    if p and p.get('alive') and not info:
        events.append(f"💀 {name} has DIED.")
    nkids = len(snap.get('littleones', []))
    if nkids > p.get('kids', 0):
        events.append(f"🍼 A child was born! ({name} line)")
    if me['pregnant'] and not p.get('pregnant'):
        events.append(f"🤰 {me['name']} is pregnant.")
    nhuts = len(snap['home']['huts'])
    if nhuts > p.get('huts', 1):
        events.append(f"🏠 A new hut stands ({nhuts} total).")
    if me['partner'] and not p.get('partner'):
        events.append(f"💞 {name} and {me['partner']} are bonded.")
    prev[name] = {'alive': True, 'kids': nkids, 'pregnant': bool(me['pregnant']),
                  'huts': nhuts, 'partner': me['partner']}
    return events


def log_events(events):
    if not events:
        return
    line = f"- {time.strftime('%Y-%m-%d %H:%M')} " + "\n- ".join(events)
    with open(os.path.join(DIARY_DIR, 'natura_events.md'), 'a') as f:
        f.write(line + "\n")
    print("EVENT:", " | ".join(events), flush=True)


def main():
    chars = [
        {'name': 'Lena', 'thread': 'natura-lena',
         'store': MemoryStore(os.path.join(DIARY_DIR, 'lena.json'))},
        {'name': 'Joren', 'thread': 'natura-joren',
         'store': MemoryStore(os.path.join(DIARY_DIR, 'joren.json'))},
    ]
    for c in chars:
        if not c['store'].soul:
            raise RuntimeError(f"no soul for {c['name']}")
    nv = NV()
    nv.pause()  # time moves only when the runner advances it: bells stay honest
    print("runner: valley hears the bells (paused world, 4h slices)", flush=True)
    prev = {}
    seen = set()
    i = 0
    try:
        while True:
            char = chars[i % len(chars)]
            i += 1
            try:
                info, evs = bell(nv, char)
                if info is None:
                    log_events([evs])
                else:
                    log_events(evs + watch(prev, char['name'], info, nv))
                    print(f"{info['stamp']} {char['name']}: {info['action']} "
                          f"-> {info['result']}" +
                          (f" [{info['guard']}]" if info['guard'] else ""), flush=True)
                    seen.add(char['name'])
                # death watch: who is missing from the valley?
                alive = set(nv.list() or [])
                for name in seen - alive:
                    log_events([f"💀 {name} has DIED."])
                    seen.discard(name)
                # the world turns — exactly SLICE_HOURS game-hours, no more
                nv.advance(SLICE_HOURS)
            except Exception:
                print(f"bell failed for {char['name']}:", flush=True)
                traceback.print_exc()
            time.sleep(BELL_GAP)
    finally:
        nv.close()


if __name__ == '__main__':
    main()
