#!/usr/bin/env python3
"""natura8_runner.py — the body-model bells of the valley.

Each bell:
    snap (NV) -> perceive (sense model: tiers, attention, estimated
    distances; NO coordinates, NO cell counts, NO stat numbers)
    -> memory retrieve -> ask brain (Ask API) for INTENT in plain words
    -> planner: intent -> steps of real verbs/primitives
    -> survival guard -> NV.order -> diary append -> big-event watch

The brain never picks verbs. It says what it wants ("dam the creek",
"stoke the fire"); the planner translates into what the body can do:
go / take / drop / use / speak / eat / sleep / rest / wait, plus the
old routines the hands already know (fell, forage, build, farm, ...).
Multi-step intents become plans that unfold over bells.
Novel attempts the world can't resolve become dreams (logged); the
world answers back through the senses next bell, so the mind can try
again — the lifelike loop.

Logs: minds/lena_diary.md, minds/joren_diary.md,
       minds/natura_events.md, minds/dreams.md
Plans: minds/<name>_plan.json
"""
import json
import os
import re
import subprocess
import sys
import time
import traceback
import urllib.request

import websocket

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from memory import MemoryStore, _describe_instinct
from mind import _parse_remember
from perceive import perceive, build_labels, carry_words, daypart

PORT = 19830
BELL_GAP = 15            # politeness pause between bells
SLICE_HOURS = 4          # game-hours the world advances after each bell
DIARY_DIR = os.path.dirname(os.path.abspath(__file__))

JSON_HINT8 = ('{"intent": "plain words: what you will do in the next few hours", '
              '"say": "words you speak aloud, if any", '
              '"remember": [{"text": "a new lasting memory, if any", '
              '"salience": 0.0-1.0, "kind": "episodic|danger", "tags": []}], '
              '"focus": "what holds your attention, if anything"}; '
              'salience: birth of a child ~1.0, ate breakfast ~0.2; '
              'kind "danger" for poison, predator, near-death (one trial, never '
              'forgotten); tags generalize the lesson.')
ASK_CLI = '/home/hatch/workspace/skills/ask-api/bin/ask.py'


def ask_brain8(prompt, thread_id, timeout=600):
    cmd = [sys.executable, ASK_CLI, '--wait', '120', '--timeout', str(timeout),
           '--thread', thread_id, '--format', 'json',
           '--json-hint', JSON_HINT8, prompt]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True,
                             timeout=timeout + 60)
    except subprocess.TimeoutExpired:
        raise RuntimeError('brain call timed out')
    if out.returncode != 0:
        raise RuntimeError('brain call failed: %s' % out.stderr[-500:])
    raw = out.stdout.strip()
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return json.loads(raw.splitlines()[-1])


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
        return self.ev('simTick(%s)' % json.dumps(hours))

    def close(self):
        self.ws.close()


# ---------- the planner: intent (words) -> steps (verbs) ----------
def carrying(me, what):
    return what in me.get('carrying', []) or (me.get('inv', {}).get(what, 0) > 0)


def item_by_id(snap, iid):
    for e in snap['see']['logs']:
        if e['id'] == iid:
            return e
    return None


def ensure_have(what, ctx):
    """Steps to get `what` into hand, or [] if already carried / none seen."""
    me, snap = ctx['me'], ctx['snap']
    if carrying(me, what):
        return []
    cands = [e for e in snap['see']['logs'] if e['type'] == what]
    if not cands:
        return []
    e = min(cands, key=lambda e: e['d'])
    return [('goto', {'wx': e['wx'], 'wy': e['wy'], 'label': 'a loose ' + what}),
            ('take', {'id': e['id']})]


def parse_step(p, ctx):
    """One intent fragment -> list of (verb, params). [] = cannot do (dream)."""
    t = ' ' + p.lower().strip() + ' '
    me, snap, P = ctx['me'], ctx['snap'], ctx['places']
    others = [o['name'] for o in snap.get('others', [])]
    target = next((o for o in others if o.lower() in t), None)

    def place(*names):
        for nm in names:
            if nm in P:
                return P[nm]
        return None

    def goto(c, label):
        return ('goto', {'wx': c[0], 'wy': c[1], 'label': label})

    # -- direct body states --
    if re.search(r'\b(eat|food|meal|hungry|starving)\b', t):
        return [('eat', {})]
    if re.search(r'\b(drink|thirst|thirsty)\b', t):
        return [('drink', {})]
    if re.search(r'\b(sleep|nap)\b', t):
        return [('sleep', {})]
    if re.search(r'\b(rest)\b', t):
        return [('rest', {})]
    if re.search(r'\b(wait|watch|look around|nothing|stay put)\b', t):
        return [('wait', {})]

    # -- speak (before everything else: "tell Joren about the dam") --
    if target and re.search(r'\b(say|tell|ask|talk|speak|call|shout|warn)\b', t):
        return [('say_to', {'to': target, 'text': (ctx.get('say') or p.strip())[:200]})]

    # -- fire: stoke / feed / warm --
    if 'stoke' in t or re.search(r'\bfeed\b.*\bfire\b|\bfire\b.*\b(wood|log|burn|flame)', t) \
            or re.search(r'\btend\b.*\bfire\b', t):
        steps = ensure_have('log', ctx)
        steps.append(('use', {'what': 'log', 'on': 'firepit'}))
        return steps
    if 'warm' in t and 'fire' in t:
        c = place('the firepit')
        if c:
            return [goto(c, 'the firepit'), ('rest', {})]
        return []

    # -- dam the creek --
    if 'dam' in t or ('stone' in t and ('creek' in t or 'water' in t)):
        steps = ensure_have('stone', ctx)
        c = place('the creek')
        if c:
            steps += [goto(c, 'the creek'), ('use', {'what': 'stone', 'on': 'creek'})]
        return steps

    # -- routines the hands already know --
    if re.search(r'\b(fell|chop|cut down)\b', t):
        c = place('a mature tree')
        return [('fell', {'wx': c[0], 'wy': c[1]})] if c else []
    if re.search(r'\bforag|berr|pick\b', t):
        c = place('the berry bushes')
        return [('forage', {'wx': c[0], 'wy': c[1]})] if c else []
    if re.search(r'\b(build|hut|shelter)\b', t):
        if 'hut' in t or 'shelter' in t:
            c = place('the hut')
            return [('build_hut', {'wx': c[0] + 3, 'wy': c[1]})] if c else []
        d = next((k for k in snap.get('designs', {}) if k in t), None)
        if d:
            return [('craft', {'design': d})]
        return []  # dream: wants to build something the world has no design for
    if re.search(r'\bsaw\b', t):
        return [('saw', {})]
    if re.search(r'\bcraft\b|\bmake a\b|\bcarve\b', t):
        d = next((k for k in snap.get('designs', {}) if k in t), None)
        return [('craft', {'design': d})] if d else []
    if re.search(r'\btill\b', t):
        c = place('the hut')
        return [('till', {'wx': c[0] + 2, 'wy': c[1] + 2})] if c else []
    if re.search(r'\bplant\b', t):
        crop = 'wheat' if 'wheat' in t else 'carrot'
        c = place('the hut')
        return [('plant', {'wx': c[0] + 2, 'wy': c[1] + 2, 'crop': crop})] if c else []
    if re.search(r'\btend\b|\bwater\b.*\bcrop', t):
        c = place('the hut')
        return [('tend', {'wx': c[0] + 2, 'wy': c[1] + 2})] if c else []
    if re.search(r'\bharvest\b', t):
        c = place('the hut')
        return [('harvest', {'wx': c[0] + 2, 'wy': c[1] + 2})] if c else []
    if re.search(r'\bhunt\b', t):
        return [('hunt', {})]
    if re.search(r'\bfish\b', t):
        return [('fish', {})]
    if re.search(r'\bcollect\b', t):
        return [('collect', {})]
    if re.search(r'\bslaughter\b', t):
        return [('slaughter', {})]
    if re.search(r'\bhaul\b|\bcarry\b', t):
        cands = [e for e in snap['see']['logs'] if e['type'] == 'log']
        if cands:
            e = min(cands, key=lambda e: e['d'])
            return [('haul', {'id': e['id']})]
        return []
    if 'bond' in t and target:
        return [('bond', {'with': target})]
    if re.search(r'\bgive\b', t) and target:
        what = next((k for k in ('food', 'berries', 'log', 'timber', 'stone') if k in t), 'food')
        return [('give', {'to': target, 'what': what})]
    if re.search(r'\bname\b', t) and 'baby' in t:
        return [('name_baby', {})]

    # -- primitives --
    if re.search(r'\b(take|pick up|grab)\b', t):
        what = 'stone' if 'stone' in t else ('log' if 'log' in t else None)
        if what:
            cands = [e for e in snap['see']['logs'] if e['type'] == what]
            if cands:
                e = min(cands, key=lambda e: e['d'])
                return [goto((e['wx'], e['wy']), 'a loose ' + what),
                        ('take', {'id': e['id']})]
        return []
    m = re.search(r'\b(go|walk|head|run|check|look at|inspect|visit|join|find|meet)\b.{0,4}(to|at|on|over to)?\s+(.+)', t)
    if m:
        dest = m.group(3).strip()
        c = P.get(dest)
        if not c:
            for label, xy in P.items():
                if label in dest or dest in label:
                    c = xy
                    break
        if c:
            return [goto(c, dest)]
        if target:
            c = P.get(target.lower())
            if c:
                return [goto(c, target)]
        return []
    if re.search(r'\b(drop|place|put down|lay|set down)\b', t):
        what = 'stone' if 'stone' in t else ('log' if 'log' in t else None)
        if what and carrying(me, what):
            if what == 'stone' and 'creek' in t:
                c = place('the creek')
                if c:
                    return [goto(c, 'the creek'), ('use', {'what': 'stone', 'on': 'creek'})]
            return [('drop', {'what': what})]
        return []
    if re.search(r'\buse\b', t):
        what = next((k for k in ('stone', 'log', 'timber') if k in t), None)
        on = ('firepit' if 'fire' in t
              else ('creek' if ('creek' in t or 'water' in t or 'dam' in t) else None))
        if what and on:
            return [('use', {'what': what, 'on': on})]
        return []

    return []


def parse_intent(intent, ctx):
    parts = re.split(r'\s+then\s+|\s*;\s*|\s+and then\s+', intent.strip())
    steps = []
    for p in parts:
        if p.strip():
            steps.extend(parse_step(p, ctx))
    return steps


# ---------- plans & dreams ----------
def plan_path(name):
    return os.path.join(DIARY_DIR, '%s_plan.json' % name.lower())


def load_plan(name):
    try:
        return json.load(open(plan_path(name)))
    except Exception:
        return {'steps': [], 'focus': '', 'keys': []}


def save_plan(name, plan):
    json.dump(plan, open(plan_path(name), 'w'))


def log_dream(name, intent, stamp):
    with open(os.path.join(DIARY_DIR, 'dreams.md'), 'a') as f:
        f.write('- %s — %s dreams of "%s" (no way to do it yet)\n'
                % (stamp, name, intent[:120]))
    # capability gap: same dream 3+ times -> flag for the world-builder
    try:
        txt = open(os.path.join(DIARY_DIR, 'dreams.md')).read()
    except Exception:
        return False
    key = intent[:40].lower()
    if txt.lower().count(key) >= 3:
        return True
    return False


# ---------- prompt ----------
def compose(name, soul, ptext, carry, mems, dangers, instincts, habits, plan):
    L = []
    if dangers:
        L.append('DANGER — your body remembers this, act on it first:')
        L.extend('- %s' % d['text'] for d in dangers)
    L.append('You are %s. %s' % (name, soul))
    if instincts:
        L.append('Instincts (born with these): ' +
                 '; '.join(_describe_instinct(k, v) for k, v in instincts))
    if habits:
        L.append('Habits (your hands know these): ' + ', '.join(a for a, _ in habits))
    if mems:
        L.append('You remember:')
        L.extend('- %s' % m['text'] for m in mems)
    L.append('RIGHT NOW — what your senses tell you:\n' + ptext)
    L.append('You carry: %s.' % carry)
    L.append('YOUR BODY: in the next few hours you can move, take things within '
              'reach, drop what you carry, use one thing on another, speak, eat, drink, '
              'sleep, rest, or wait. Your hands already know how to fell trees, '
              'saw timber, build, forage, farm, hunt and fish — old skills, quick '
              'and sure. Anything else, you must attempt with your body and see '
              'what the world does.')
    if plan.get('intent') and plan.get('steps'):
        L.append('Your ongoing plan: "%s" (%d steps left).'
                 % (plan['intent'][:100], len(plan['steps'])))
    L.append('Reply as JSON only.')
    L.append('RULES: "intent" is plain words about what you will do — never '
             'coordinates, never counts of cells. Name things as you sense them '
             '("the creek", "a loose stone", "Joren"). For several things in order, '
             'join them with " then ". Only the first happens now; the rest waits '
             'as your plan. "say" is words you speak aloud, if any.')
    return '\n'.join(L)


# ---------- the bell ----------
def bell(nv, char):
    name, store, thread = char['name'], char['store'], char['thread']
    snap = nv.snap(name)
    if snap.get('error'):
        return None, '%s is gone from the valley.' % name

    places, items = build_labels(snap)
    plan = load_plan(name)
    focus = plan.get('focus', '')
    ptext, keys = perceive(name, snap, focus, plan.get('keys', ()))
    ctx = {'me': snap['me'], 'snap': snap, 'places': places,
           'items': items, 'say': ''}

    store.tick += 1
    store.decay()
    mems = store.retrieve(ptext)
    store.reinforce([m['id'] for m in mems])
    dangers = store.relevant_dangers(ptext)
    instincts = store.instincts_for(ptext)
    habits = store.habits_top(5)
    prompt = compose(name, store.soul, ptext, carry_words(snap['me']),
                     mems, dangers, instincts, habits, plan)

    answer = ask_brain8(prompt, thread, timeout=600)
    intent = str(answer.get('intent') or '').strip()
    say = str(answer.get('say') or '')[:220]
    ctx['say'] = say
    focus = str(answer.get('focus') or '').strip()[:80]

    stamp = 'Day %d, %.1fh' % (snap['day'], snap['tod'])
    vague = intent.lower() in ('continue', 'keep going', 'carry on', 'same',
                               'keep it up', '')
    steps = []
    dream_gap = False
    if not vague:
        steps = parse_intent(intent, ctx)
        if steps:
            step = steps[0]
            plan = {'intent': intent, 'steps': [list(s) for s in steps[1:]],
                    'focus': focus, 'keys': list(keys)}
        else:
            dream_gap = log_dream(name, intent, stamp)
            step = ('wait', {})
            plan['keys'] = list(keys)
            plan['focus'] = focus
    elif plan.get('steps'):
        step = tuple(plan['steps'].pop(0))
    else:
        step = ('wait', {})
        plan['keys'] = list(keys)
    save_plan(name, plan)

    verb, params = step
    # survival guard: starving with food in hand -> eat, whatever the mind said
    guard = None
    me = snap['me']
    if me['hunger'] < 0.15 and (me['inv'].get('food', 0) > 0 or me['inv'].get('berries', 0) >= 2) \
            and verb != 'eat':
        guard = "guard overrode '%s' -> eat (hunger %s)" % (verb, me['hunger'])
        verb, params = 'eat', {}

    result = nv.order(name, verb, params)
    if say:
        nv.say(name, say)
    if verb != 'wait':
        store.record_habit(verb)
    new_danger = False
    for r in answer.get('remember', []) or []:
        text, sal, kind, tags = _parse_remember(r)
        if text:
            store.add(text, salience=sal, kind=kind, tags=tags)
            if kind == 'danger':
                new_danger = True
    store.prune()
    store.save()

    lines = ['## %s — bell %d' % (stamp, store.tick),
             'Senses: %s' % ptext.split('\n')[0][:120],
             'Intent: "%s"' % intent[:140],
             'Plan left: %d steps' % len(plan.get('steps', [])),
             'Action: %s %s -> %s' % (verb, json.dumps(params)[:100], result)]
    if guard:
        lines.append('GUARD: %s' % guard)
    if say:
        lines.append('Said: "%s"' % say)
    rems = [(_parse_remember(r)[0]) for r in (answer.get('remember', []) or [])]
    rems = [t for t in rems if t]
    if rems:
        lines.append('Remembered: ' + ' | '.join(rems[:3]))
    lines.append('')
    with open(os.path.join(DIARY_DIR, '%s_diary.md' % name.lower()), 'a') as f:
        f.write('\n'.join(lines) + '\n')

    events = []
    if new_danger:
        events.append('%s learned a DANGER: %s' % (name, (rems[-1][:100] if rems else '?')))
    if dream_gap:
        events.append('🧩 %s keeps dreaming of "%s" — the world has no way to do it yet'
                      % (name, intent[:60]))
    return {'action': verb, 'result': result, 'say': say, 'guard': guard,
            'stamp': stamp, 'snap': snap, 'intent': intent}, events


# ---------- big-event watch ----------
def watch(prev, name, info, nv):
    events = []
    snap = info['snap']
    me = snap['me']
    p = prev.get(name, {})
    nkids = len(snap.get('littleones', []))
    if nkids > p.get('kids', 0):
        events.append('🍼 A child was born! (%s line)' % name)
    if me['pregnant'] and not p.get('pregnant'):
        events.append('🤰 %s is pregnant.' % me['name'])
    nhuts = len(snap['home']['huts'])
    if nhuts > p.get('huts', 1):
        events.append('🏠 A new hut stands (%d total).' % nhuts)
    if me['partner'] and not p.get('partner'):
        events.append('💞 %s and %s are bonded.' % (name, me['partner']))
    if snap['water']['dammed'] and not p.get('dammed'):
        events.append('🪨 The creek is dammed — a still pool forms behind the stones.')
    prev[name] = {'alive': True, 'kids': nkids, 'pregnant': bool(me['pregnant']),
                  'huts': nhuts, 'partner': me['partner'],
                  'dammed': snap['water']['dammed']}
    return events


def log_events(events):
    if not events:
        return
    line = '- %s ' % time.strftime('%Y-%m-%d %H:%M') + '\n- '.join(events)
    with open(os.path.join(DIARY_DIR, 'natura_events.md'), 'a') as f:
        f.write(line + '\n')
    print('EVENT:', ' | '.join(events), flush=True)


def main():
    chars = [
        {'name': 'Lena', 'thread': 'natura-lena',
         'store': MemoryStore(os.path.join(DIARY_DIR, 'lena.json'))},
        {'name': 'Joren', 'thread': 'natura-joren',
         'store': MemoryStore(os.path.join(DIARY_DIR, 'joren.json'))},
    ]
    for c in chars:
        if not c['store'].soul:
            raise RuntimeError('no soul for %s' % c['name'])
    nv = NV()
    nv.pause()  # time moves only when the runner advances it: bells stay honest
    print('runner v8: the valley hears the bells (bodies, not verbs)', flush=True)
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
                    print('%s %s: "%s" -> %s -> %s'
                          % (info['stamp'], char['name'], info['intent'][:60],
                             info['action'], info['result'])
                          + (' [%s]' % info['guard'] if info['guard'] else ''),
                          flush=True)
                    seen.add(char['name'])
                alive = set(nv.list() or [])
                for nm in seen - alive:
                    log_events(['💀 %s has DIED.' % nm])
                    seen.discard(nm)
                nv.advance(SLICE_HOURS)
            except Exception:
                print('bell failed for %s:' % char['name'], flush=True)
                traceback.print_exc()
            time.sleep(BELL_GAP)
    finally:
        nv.close()


if __name__ == '__main__':
    main()
