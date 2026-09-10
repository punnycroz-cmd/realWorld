#!/usr/bin/env python3
"""Souls' nerves: senses and hands for the minds.
Usage: nv.py <name> snap | nv.py <name> order '{"verb":"fell","wx":12,"wy":-5}'
       nv.py <name> say "thought" | nv.py speed 4 | nv.py design chair '{"name":"chair","timber":3,"hours":4,"sprite":"sprites/chair_1.png","by":"Marta"}'
"""
import json, sys, urllib.request
import websocket
PORT = 19830

def conn():
    tabs = json.load(urllib.request.urlopen(
        'http://127.0.0.1:%d/json/list' % PORT, timeout=5))
    pg = [t for t in tabs if t['type'] == 'page' and 'natura-v4' in t.get('url', '')]
    if not pg:
        pg = [t for t in tabs if t['type'] == 'page']
    ws = websocket.create_connection(pg[0]['webSocketDebuggerUrl'], timeout=60)
    seq = [0]
    def ev(expr):
        seq[0] += 1
        ws.send(json.dumps({'id': seq[0], 'method': 'Runtime.evaluate',
                            'params': {'expression': expr, 'returnByValue': True}}))
        while True:
            m = json.loads(ws.recv())
            if m.get('id') == seq[0]:
                r = m['result']['result']
                return r.get('value', 'EVAL:' + json.dumps(r)[:200])
    return ws, ev

ws, ev = conn()
try:
    mode = sys.argv[1]
    if mode == 'speed':
        print(ev('NV.speed(%s)' % sys.argv[2]))
    elif mode == 'design':
        print(ev('NV.addDesign(%s,%s)' % (json.dumps(sys.argv[2]), sys.argv[3])))
    elif mode == 'sprite':
        print(ev('NV.setSprite(%s,%s)' % (json.dumps(sys.argv[2]), json.dumps(sys.argv[3]))))
    elif mode == 'pause':
        print(ev('NV.pause()'))
    elif mode == 'resume':
        print(ev('NV.resume()'))
    elif mode == 'traveler':
        # nv.py traveler <name> <F|M> <age> '<colors json>' '<skills json>'
        print(ev('NV.addTraveler(%s,%s,%s,%s,%s)' % (
            json.dumps(sys.argv[2]), json.dumps(sys.argv[3]), int(sys.argv[4]),
            sys.argv[5], sys.argv[6] if len(sys.argv) > 6 else 'null')))
    elif mode == 'list':
        print(ev('NV.list()'))
    else:
        name = sys.argv[1]
        cmd = sys.argv[2]
        if cmd == 'snap':
            print(json.dumps(ev('NV.snap(%s)' % json.dumps(name))))
        elif cmd == 'order':
            print(ev('NV.order(%s,%s)' % (json.dumps(name), sys.argv[3])))
        elif cmd == 'say':
            ev('NV.say(%s,%s)' % (json.dumps(name), json.dumps(sys.argv[3])))
            print('said')
        else:
            print('unknown')
finally:
    ws.close()
