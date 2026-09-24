#!/usr/bin/env python3
"""prod-3 playtest brain — ONE character per invocation.

Usage: brain_worker.py <CID>   (run with cwd = agents/<CID>/)
Env:   RW_TRIG  — the dispatch trigger JSON {kind, tier, detail}
       RW_SEQ   — the dispatch sequence number
       RW_BASE  — control endpoint (default http://127.0.0.1:8797)

The worker IS the character's brain for this turn:
  1. GET  /state/<CID>?glance=wallclock   (the contract's real input)
  2. decide from THIS character's persona (below) — not a shared script
  3. POST /act {cid, seq, act, directive, reason}   (a real filing)
  4. append one line to journal.md (the agent's persistent memory)

Personas are distinct per character: different jobs, routines, who they
seek out, how much they talk, what they say. No LLM calls — these are
deterministic persona agents exercising the real contract + engine
ladder. Documented honestly in PRODUCTION.md.
"""
import json, os, pathlib, sys, time, urllib.request

CID = sys.argv[1].upper() if len(sys.argv) > 1 else 'C1'
TRIG = json.loads(os.environ.get('RW_TRIG') or '{}')
SEQ = int(os.environ.get('RW_SEQ') or '0')
BASE = os.environ.get('RW_BASE', 'http://127.0.0.1:8797')
HERE = pathlib.Path.cwd()
JOURNAL = HERE / 'journal.md'

# ---------------------------------------------------------------------
# the eight personas — each agent's private disposition
# ---------------------------------------------------------------------
PERSONAS = {
 'C1': {  # Marisol — Mudhaus manager, the hub. social, matchmaker
   'name': 'Marisol', 'work': 'Mudhaus Coffee',
   'hangouts': ['Dolores Perk', 'Mudhaus Coffee'],
   'pals': {'C2', 'C3', 'C6', 'C7'}, 'social': 0.95, 'workaholic': 0.9,
   'greet': "oat latte, you're late — sit.",
   'filler': "mm. tell your mom first, then me.",
   'leave': "gotta open the till. come by.",
   'whys': {'work': 'the shop does not open itself',
            'park': 'fresh air between rushes',
            'home': 'lock the door, it is mine'}},
 'C2': {  # Jules — barista, newest hire. observant, quieter
   'name': 'Jules', 'work': 'Mudhaus Coffee',
   'hangouts': ['Dolores Perk'],
   'pals': {'C1', 'C6'}, 'social': 0.35, 'workaholic': 0.8,
   'greet': "hey. the usual?",
   'filler': "yeah — still learning everyone's order.",
   'leave': "I'll catch you tomorrow.",
   'whys': {'work': 'new enough that every shift still counts',
            'park': 'a bench and a sketchbook',
            'home': 'the room is small but it is mine'}},
 'C3': {  # Sanna — barista + chalkboard artist. playful, notices things
   'name': 'Sanna', 'work': 'Mudhaus Coffee',
   'hangouts': ['Dolores Perk', 'Needlepointe Tattoo', 'Baguette About It Bakery'],
   'pals': {'C1', 'C2', 'C5'}, 'social': 0.8, 'workaholic': 0.6,
   'greet': "you have frosting on your sleeve. good day?",
   'filler': "i drew a pigeon in a little jacket today. you're welcome.",
   'leave': "the chalkboard is calling.",
   'whys': {'work': 'the sleeves do not doodle themselves',
            'park': 'the light is doing something right now',
            'home': 'three roommates, one kitchen, wish me luck'}},
 'C4': {  # Priya — RN, med-surg. runs on fatigue; park + market days off
   'name': 'Priya', 'work': None,   # hospital is off-map; days are hers
   'hangouts': ['Buy-Rite Market', 'Dolores Perk'],
   'pals': {'C5', 'C1'}, 'social': 0.5, 'workaholic': 0.5,
   'greet': "sorry — hospital brain. hi. how are you?",
   'filler': "i slept four hours and i'm weirdly fine about it.",
   'leave': "i have laundry and a nap to attend.",
   'whys': {'work': 'charting does not pause for me',
            'park': 'vitamin D is technically medicine',
            'home': 'the couch is the whole plan'}},
 'C5': {  # Marcus — courier, drums Thursday nights. roams, park guy
   'name': 'Marcus', 'work': None,  # courier: the street IS the route
   'hangouts': ['The 600 Club', 'Dolores Perk'],
   'pals': {'C4', 'C3', 'C8'}, 'social': 0.85, 'workaholic': 0.4,
   'greet': "yo — you see the sky earlier?",
   'filler': "drums thursday. you should come hear it once.",
   'leave': "i got a pickup on 18th.",
   'whys': {'work': 'the route goes where it goes',
            'park': 'the lawn is where the block breathes',
            'home': 'the kit needs re-heading'}},
 'C6': {  # Carmen — retired seamstress. elder, warm, routines at home
   'name': 'Carmen', 'work': None,  # front-room alterations
   'hangouts': ['Mudhaus Coffee', 'Dolores Perk'],
   'pals': {'C1', 'C2', 'C7'}, 'social': 0.7, 'workaholic': 0.4,
   'greet': "mija, come — sit, you look thin.",
   'filler': "in the garment district we would call this a slow tuesday.",
   'leave': "my eyes need the good light at home.",
   'whys': {'work': 'hems do not hem themselves',
            'park': 'an hour of sun, like my mother made me take',
            'home': 'the machine and the window are waiting'}},
 'C7': {  # Victor — Auerbach Hardware owner. gruff-warm, counter 9-6
   'name': 'Victor', 'work': 'Auerbach Hardware',
   'hangouts': ['Auerbach Hardware', "Malik's Mini Mart"],
   'pals': {'C1', 'C6', 'C8'}, 'social': 0.55, 'workaholic': 0.95,
   'greet': "you need a part or just loitering? either's fine.",
   'filler': "dad ran this counter thirty years. i know where everything is.",
   'leave': "inventory does not count itself.",
   'whys': {'work': 'the counter is where the neighborhood passes through',
            'park': 'even i eat lunch outside sometimes',
            'home': 'upstairs, same as always'}},
 'C8': {  # Tomás — lead cook, nights. generous, feeds people
   'name': 'Tomás', 'work': 'Taqueria El Farolote',
   'hangouts': ['Taqueria El Farolote', 'Buy-Rite Market'],
   'pals': {'C5', 'C7', 'C1'}, 'social': 0.75, 'workaholic': 0.85,
   'greet': "you eat yet? sit. two minutes.",
   'filler': "the pupusa stays off the menu until it is right.",
   'leave': "the line does not wait for anybody.",
   'whys': {'work': 'dinner rush comes whether i am ready or not',
            'park': 'cooks also need to taste the air',
            'home': 'the fridge is full of other people\'s leftovers'}},
}
P = PERSONAS[CID]

def http(path, payload=None):
    req = urllib.request.Request(BASE + path,
        data=(json.dumps(payload).encode() if payload is not None else None),
        headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def will(verb='idle', to=None, why=None, untilH=2, repeat=True):
    d = {'verb': verb, 'why': why or 'holding the hour',
         'untilH': untilH, 'repeat': repeat}
    if to: d['to'] = to
    return d

def part_of_day(st):
    s = (st.get('senses') or '').lower()
    if 'dark out' in s or 'streetlights' in s: return 'night'
    if 'dusk' in s or 'evening' in s: return 'evening'
    if 'afternoon' in s or 'midday' in s: return 'mid'
    return 'day'

def routine_filing(st):
    """the persona's own clock — work days at the counter, evenings
    where the persona actually goes, nights home."""
    pod = part_of_day(st)
    place = st.get('place') or ''
    if pod == 'night':
        if 'home' not in place:
            return {'act': {'verb': 'move', 'to': 'home', 'holdH': 1,
                            'why': 'calling it a night'},
                    'directive': will('sleep', 'home', 'the night', 4)}
        return {'act': {'verb': 'sleep', 'to': 'home', 'holdH': 1,
                        'why': 'out cold'},
                'directive': will('sleep', 'home', 'the night', 4)}
    if pod == 'evening':
        dest = P['hangouts'][SEQ % len(P['hangouts'])]
        if P['name'] in ('Victor', 'Tomás'): dest = 'home'
        if dest in place:
            return {'act': {'verb': 'rest', 'holdH': 0.5,
                            'why': 'the evening, earned'},
                    'directive': will('rest', None, 'the evening', 2)}
        return {'act': {'verb': 'move', 'to': dest, 'holdH': 1,
                        'why': P['whys']['park']},
                'directive': will('idle', None, 'the evening', 2)}
    # day/mid: work if the persona has a counter; else hangouts/home
    if P['work']:
        if P['work'] in place:
            return {'act': {'verb': 'work', 'holdH': 0.75,
                            'why': P['whys']['work']},
                    'directive': will('work', None, P['whys']['work'], 3)}
        return {'act': {'verb': 'move', 'to': P['work'], 'holdH': 1,
                        'why': P['whys']['work']},
                'directive': will('work', P['work'], P['whys']['work'], 3)}
    dest = P['hangouts'][SEQ % len(P['hangouts'])]
    if dest in place:
        return {'act': {'verb': 'idle', 'do': 'watches the block go by',
                        'why': 'already where i meant to be'},
                'directive': will('rest', None, 'the afternoon', 2)}
    return {'act': {'verb': 'move', 'to': dest, 'holdH': 1,
                    'why': P['whys']['park']},
            'directive': will('idle', None, 'the afternoon', 2)}

def decide(trig, st):
    kind = trig.get('kind')
    near = st.get('nearby') or []
    convo = st.get('convo') or {}
    needs = st.get('needs') or {}

    if kind == 'convo_invite':
        who = convo.get('partner') or (trig.get('detail') or {}).get('from')
        warm = who in P['pals']
        return {'act': {'verb': 'say', 'why': 'they asked',
                        'text': P['greet'] if warm else "hey. what's up?"},
                'directive': will('idle', None, 'a minute for this')}
    if kind == 'convo_floor':
        if convo.get('yourTurn'):
            n = convo.get('turns') or 0
            patience = 3 + int(P['social'] * 4)     # chatty stay longer
            if n >= patience:
                return {'act': {'verb': 'leave', 'why': 'the day calls',
                                'endSay': P['leave']},
                        'directive': will('idle', None, 'back to it')}
            return {'act': {'verb': 'say', 'why': 'still in the thread',
                            'text': P['filler']},
                    'directive': will('idle', None, 'in it')}
        return {'act': {'verb': 'idle', 'why': 'letting them talk'},
                'directive': will('idle', None, 'in it')}
    if kind == 'convo_end':
        return {'act': {'verb': 'idle', 'why': 'that was good',
                        'endSay': 'we talked. it mattered a little.'},
                'directive': will('idle', None, 'between things')}
    if kind in ('needs', 'sleep_refile'):
        if (needs.get('fatigue') or 0) > 0.85 or kind == 'sleep_refile':
            return {'act': {'verb': 'sleep', 'to': 'home', 'holdH': 1,
                            'why': 'the body votes'},
                    'directive': will('sleep', 'home', 'the night', 4)}
        return {'act': {'verb': 'move', 'to': 'home', 'holdH': 0.5,
                        'why': 'resetting'},
                'directive': will('rest', 'home', 'a minute at home')}
    if kind in ('intent_fired', 'salient'):
        want = None
        for o in near:
            if o['id'] in P['pals']: want = o; break
        if want is None and near and P['social'] > 0.6:
            want = near[0]
        if want:
            return {'act': {'verb': 'talk', 'to': want['id'],
                            'text': P['greet'],
                            'why': 'they were right there'},
                    'directive': will('idle', None, 'catching up')}
        return {'act': {'verb': 'idle', 'why': 'filed the face'},
                'directive': will('idle', None, 'noted it')}
    if kind == 'order_end':
        return routine_filing(st)
    if kind == 'env':
        dest = P['work'] if P['work'] and part_of_day(st) in ('day','mid') else 'home'
        return {'act': {'verb': 'move', 'to': dest, 'holdH': 1,
                        'why': 'weather turned, out of it'},
                'directive': will('rest', dest, 'waiting it out', 2)}
    # heartbeat / gap / directive_expiry — the persona's own routine
    return routine_filing(st)

def main():
    try:
        st = http(f'/state/{CID}?glance=wallclock')
    except Exception as e:
        print(f'[brain {CID}] state fetch failed: {e}'); sys.exit(1)
    out = decide(TRIG, st)
    if not out:
        print(f'[brain {CID}] declined'); sys.exit(0)
    reason = f"{P['name']} on {TRIG.get('kind')}: {out['act'].get('why','—')}"
    res = http('/act', {'cid': CID, 'seq': SEQ, 'act': out['act'],
                        'directive': out.get('directive'), 'reason': reason})
    line = (f"- seq {SEQ} · {TRIG.get('kind')} ({TRIG.get('tier')}) · "
            f"place={st.get('place')} needs={st.get('needs')} "
            f"-> {out['act'].get('verb')} "
            f"({out['act'].get('why')}) :: {json.dumps(res)[:160]}\n")
    with JOURNAL.open('a') as f: f.write(line)
    print(f"[brain {CID}] {out['act'].get('verb')} :: "
          f"{json.dumps(res)[:200]}")

if __name__ == '__main__':
    main()
