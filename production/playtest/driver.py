#!/usr/bin/env python3
"""v16 — the becoming brain: event-driven playtest driver.

One shared world (production/hub.html in Chromium, WebM recorded) runs
CONTINUOUSLY at a fixed sim speed — the driver never writes or rewinds
W.tod. Eight brains (one per main) are invoked ONLY when the engine's
dispatch queue says a trigger is due:

  loop:  poll = __aiBridge.sfDispatchPoll()
         for each main with poll.per[cid].due -> invoke that brain
             (kind + tier + detail ride the invocation)

Tiers: T0 = cheap refile turns (directive_expiry, quiet heartbeat, gap,
         sleep_refile) — prompt says "keep it short"; T1 = the cast
         model (decisions, talk/say/leave, intents, order_end, convo);
         T2 = the single daily reflect, folded into the bedtime filing.

Brain modes:
  default   — `devin -c -p` sessions in agents/C*/ (BRIEF.md ritual:
              curl state -> POST /act -> journal -> stop)
  --scripted — an in-driver honest policy answers every trigger (the
              production-path probe: exercises the contract, ladder,
              convo, intents, gap without LLM calls)

Endpoints (brains use these; the world also answers /ping):
  GET  /state/<CID>?glance=phone|wallclock|ask[&reflect=1]
  POST /act  {cid, seq, act:{verb,...}, directive:{...}, reason}

Run:
  /home/hatch/workspace/village-game/tmp/.venv/bin/python \\
      production/playtest/driver.py --scripted --sim-hours 8
"""
import argparse, json, os, pathlib, queue, sqlite3, subprocess, sys, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent.parent
HUB = 'file://' + str(ROOT / 'production' / 'hub.html')
CHROME = '/opt/meta-chromium/chrome'
PORT = 8797
CAST = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8']

TURNS = HERE / 'turns';      TURNS.mkdir(exist_ok=True)
VIDEO = HERE / 'video';      VIDEO.mkdir(exist_ok=True)
TRANSC = HERE / 'transcripts'; TRANSC.mkdir(exist_ok=True)
LOG = HERE / 'turns.jsonl'

jobs = queue.Queue()
STATE = {'seq': {}, 'last_reflect_day': {}}

class H(BaseHTTPRequestHandler):
    def _reply(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)
    def log_message(self, *a):
        pass
    def do_GET(self):
        if self.path.startswith('/state/'):
            u = urlparse(self.path)
            cid = u.path.split('/')[-1].split('?')[0].upper()
            q = parse_qs(u.query)
            glance = (q.get('glance') or [None])[0]
            reflect = (q.get('reflect') or [None])[0] == '1'
            ev = threading.Event(); box = {}
            jobs.put(('state', cid, box, ev, {'glance': glance,
                                             'reflect': reflect}))
            if not ev.wait(30):
                self._reply(504, {'err': 'world busy'}); return
            self._reply(200, box.get('res', {'err': 'no state'}))
            return
        if self.path == '/ping':
            self._reply(200, {'ok': True}); return
        self._reply(404, {'err': 'unknown path'})
    def do_POST(self):
        if self.path == '/act':
            n = int(self.headers.get('Content-Length') or 0)
            try:
                body = json.loads(self.rfile.read(n) or b'{}')
            except Exception as e:
                self._reply(400, {'err': 'bad json: %s' % e}); return
            ev = threading.Event(); box = {}
            jobs.put(('act', body, box, ev, None))
            if not ev.wait(30):
                self._reply(504, {'err': 'world busy'}); return
            self._reply(200, box.get('res', {'err': 'no result'}))
            return
        self._reply(404, {'err': 'unknown path'})

def log(**row):
    row['ts'] = time.time()
    with LOG.open('a') as f:
        f.write(json.dumps(row) + '\n')

# ---------------------------------------------------------------------
# scripted brain — an honest minimal policy that answers every trigger
# with a real filing. It is a PROBE, not a character: it exists to prove
# the contract/ladder/convo/intent/dispatch paths end-to-end.
# ---------------------------------------------------------------------
def scripted_turn(cid, trig, st):
    """returns {act, directive} for the trigger, or None to decline."""
    kind = trig['kind']
    near = (st.get('nearby') or [])
    convo = st.get('convo')
    def will(verb='idle', to=None, why='holding the hour'):
        d = {'verb': verb, 'why': why, 'untilH': 2, 'repeat': True}
        if to: d['to'] = to
        return d
    if kind == 'convo_invite':
        who = (convo or {}).get('partner') or (trig.get('detail') or {}).get('from')
        return {'act': {'verb': 'say', 'why': 'answering them',
                        'text': 'hey — sorry, head was somewhere else. what\'s up?'},
                'directive': will('idle', None, 'staying a moment')}
    if kind == 'convo_floor':
        if convo and convo.get('yourTurn'):
            n = (st.get('convo') or {}).get('turns', 0)
            if n >= 4:
                return {'act': {'verb': 'leave', 'why': 'got to keep moving'},
                        'directive': will('idle', None, 'back to the day')}
            return {'act': {'verb': 'say', 'why': 'keeping the thread',
                            'text': 'that tracks. anyway — how\'s yours?'},
                    'directive': will('idle', None, 'in conversation')}
    if kind == 'convo_end':
        return {'act': {'verb': 'idle', 'why': 'that was that',
                        'endSay': 'we talked. it was ordinary and fine.'},
                'directive': will('idle', None, 'between things')}
    if kind == 'needs':
        b = st.get('needs') or {}
        if (b.get('fatigue') or 0) > 0.9:
            return {'act': {'verb': 'sleep', 'to': 'home', 'holdH': 1,
                            'why': 'running on empty'},
                    'directive': will('sleep', 'home', 'the night')}
        return {'act': {'verb': 'move', 'to': 'home', 'holdH': 0.5,
                        'why': 'getting something sorted'},
                'directive': will('idle', 'home', 'a minute at home')}
    if kind == 'sleep_refile':
        return {'act': {'verb': 'sleep', 'to': 'home', 'holdH': 0.5,
                        'why': 'still out'},
                'directive': will('sleep', 'home', 'the night')}
    if kind == 'intent_fired':
        deed = ((trig.get('detail') or {}).get('deeds') or ['it'])[0]
        who = next((o['id'] for o in near), None)
        if who:
            return {'act': {'verb': 'talk', 'to': who,
                            'text': 'hey — meant to ask you something',
                            'why': 'the thing i meant to raise'},
                    'directive': will('idle', None, 'after the ask')}
        return {'act': {'verb': 'idle', 'why': 'the moment passed'},
                'directive': will('idle', None, 'the moment passed')}
    if kind == 'order_end':
        lo = st.get('lastOrder') or {}
        return {'act': {'verb': 'idle', 'why': 'that fell through',
                        'do': 'exhales, recalibrates'},
                'directive': will('idle', None, 'regrouping')}
    if kind == 'salient':
        who = (trig.get('detail') or {}).get('who')
        if who and any(o['id'] == who for o in near):
            return {'act': {'verb': 'talk', 'to': who,
                            'text': 'hey — good timing, actually',
                            'why': 'they were right there'},
                    'directive': will('idle', None, 'catching up')}
        return {'act': {'verb': 'idle', 'why': 'filed the face'},
                'directive': will('idle', None, 'noted them')}
    if kind == 'env':
        return {'act': {'verb': 'idle', 'why': 'weather turned',
                        'do': 'pulls her collar up'},
                'directive': will('move', 'home', 'out of the rain')}
    # heartbeat / gap / directive_expiry — refile the will honestly
    return {'act': {'verb': 'idle', 'why': 'still here',
                    'mood': 'even', 'concerns': ['the usual']},
            'directive': will('idle', None, 'holding the hour')}

def scripted_reflect(cid, st):
    """the daily T2 bedtime filing: reflect + sleep directive, one POST."""
    ins = ['the day was mostly other people',
           'i meant to do one thing for me and didn\'t']
    return {'act': {'verb': 'reflect', 'why': 'closing the day',
                    'insights': ins},
            'directive': {'verb': 'sleep', 'to': 'home',
                          'why': 'the night', 'untilH': 6, 'repeat': True}}

CAM_PLAN = ['streetlv', 'overlook', 'roof', 'streetlv', 'follow-last',
            'overlook', 'follow-last', 'roof']

SESSIONS_DB = os.path.expanduser('~/.local/share/devin/cli/sessions.db')

def devin_has_session(cwd):
    """-c/--continue hard-fails ('failed to start ACP agent session')
    when the cwd has no prior session — only pass it once one exists."""
    try:
        con = sqlite3.connect('file:%s?mode=ro' % SESSIONS_DB, uri=True,
                              timeout=2)
        n = con.execute('select count(*) from sessions where '
                        'working_directory=?', (str(cwd),)).fetchone()[0]
        con.close()
        return n > 0
    except Exception:
        return False

def devin_cmd(cid, prompt, export=None):
    cwd = HERE / 'agents' / cid
    cmd = ['devin']
    if devin_has_session(cwd):
        cmd.append('-c')
    cmd += ['-p', prompt, '--permission-mode', 'dangerous',
            '--respect-workspace-trust', 'false']
    if export:
        cmd += ['--export', str(export)]
    return cmd

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--sim-hours', type=float, default=12)
    ap.add_argument('--cap-min', type=float, default=75)
    ap.add_argument('--speed', type=int, default=8)
    ap.add_argument('--scripted', action='store_true',
                    help='in-driver honest policy answers every trigger '
                         '(probe mode — no LLM sessions)')
    ap.add_argument('--max-calls', type=int, default=0,
                    help='stop after N brain calls (0 = unbounded)')
    ap.add_argument('--shot-every', type=float, default=20,
                    help='seconds between screenshots')
    ap.add_argument('--no-withhold', action='store_true',
                    help='skip the failure-honesty probe (default: once '
                         'per main, withhold the brain turn at a '
                         'directive_expiry boundary and confirm the '
                         'visible intention_gap)')
    args = ap.parse_args()

    LOG.write_text('')
    deadline = time.time() + args.cap_min * 60

    srv = ThreadingHTTPServer(('127.0.0.1', PORT), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    print(f'[driver] control on 127.0.0.1:{PORT}', flush=True)

    stats = {c: {'calls': 0, 'ok': 0, 'err': 0, 'by_kind': {}} for c in CAST}

    with sync_playwright() as pw:
        br = pw.chromium.launch(executable_path=CHROME, args=['--no-sandbox'])
        ctx = br.new_context(viewport={'width': 1440, 'height': 900},
                             record_video_dir=str(VIDEO),
                             record_video_size={'width': 1440, 'height': 900})
        pg = ctx.new_page()
        pg.route('**/api.open-meteo.com/**', lambda r: r.fulfill(
            status=200, content_type='application/json',
            body='{"current":{"temperature_2m":21,"relative_humidity_2m":55,'
                 '"precipitation":0,"cloud_cover":30,"wind_speed_10m":9,'
                 '"wind_direction_10m":250,"weather_code":2}}'))
        pg.goto(HUB)
        pg.wait_for_function(
            'typeof VILLAGERS !== "undefined" && VILLAGERS.length > 0',
            timeout=60000)
        # the world runs continuously at a fixed speed — the driver NEVER
        # writes or rewinds W.tod; weather/clock syncs are stubbed so the
        # sim is self-contained for the run
        pg.evaluate(f"""(() => {{
          sfSyncClock = function(){{}};
          sfFetchWeather = function(){{ return Promise.resolve(); }};
          W.rain = 0; W.storm = 0; W.temp = 21;
          W.speed = {args.speed}; W.paused = false;
          __aiBridge.sfCamMake({{ preset:'dolores_overlook', id:'overlook' }});
          __aiBridge.sfCamMake({{ preset:'mission_street',   id:'streetlv' }});
          __aiBridge.sfCamMake({{ preset:'rooftop_park',     id:'roof' }});
          __aiBridge.sfCamWatch('overlook');
        }})()""")
        pg.wait_for_timeout(1200)
        t0 = pg.evaluate('W.day * 24 + W.tod')
        print(f'[driver] world up — dispatch-driven, speed {args.speed}x',
              flush=True)

        seq_of = STATE['seq']
        last_actor = [None]
        cam_i = [0]
        shot_at = time.time()
        calls = [0]
        turn_n = [0]          # global turn counter — one shot per turn
        seq2turn = {}         # (cid, seq) -> turn, joins /act rows to shots
        withheld = set()      # mains whose boundary turn was withheld
        gap_ok = set()        # mains whose gap was then observed

        def take_turn_shot(cid, kind):
            """one screenshot per dispatched turn, rotating the rig."""
            cam = CAM_PLAN[cam_i[0] % len(CAM_PLAN)]; cam_i[0] += 1
            try:
                if cam == 'follow-last':
                    tgt = last_actor[0] or cid
                    pg.evaluate("""(cid) => {
                      const i = VILLAGERS.findIndex(v => v._castId === cid);
                      if(i >= 0){ inspectedPawnIdx = i; SF_VIEW='street';
                        SF_CAM.director=false; SF_CAM._lastPawn=-1;
                        sfCamSnap(); } }""", tgt)
                else:
                    pg.evaluate(f"__aiBridge.sfCamWatch('{cam}')")
            except Exception:
                pass
            name = f'turn{turn_n[0]:04d}-{cid}-{kind}.png'
            try:
                pg.screenshot(path=str(TURNS / name), timeout=30000)
            except Exception as e:
                print(f'[driver] shot fail {name}: {e}', flush=True)
                name = None
            return name, cam

        def pump(timeout=0.25):
            """drain world-bound HTTP jobs (state/act from brain sessions)"""
            try:
                kind, payload, box, ev, extra = jobs.get(timeout=timeout)
            except queue.Empty:
                return False
            if kind == 'state':
                try:
                    st = pg.evaluate(
                        '(a) => __aiBridge.sfAgentState(a.cid, a.opts)',
                        {'cid': payload, 'opts': extra}) or {}
                    st['dispatchSeq'] = seq_of.get(payload, 0)
                    box['res'] = st
                except Exception as e:
                    box['res'] = {'err': str(e)}
                ev.set()
            elif kind == 'act':
                cid = str(payload.get('cid', '?')).upper()
                try:
                    res = pg.evaluate(
                        '(a) => __aiBridge.sfAgentAct(a.cid, a.act,'
                        ' {directive: a.directive, reason: a.reason,'
                        '  seq: a.seq})', payload) or {}
                except Exception as e:
                    res = {'ok': False, 'err': str(e)}
                stats.setdefault(cid, {'calls':0,'ok':0,'err':0,'by_kind':{}})
                stats[cid]['calls'] += 1
                stats[cid]['ok' if res.get('ok') else 'err'] += 1
                last_actor[0] = cid
                log(cid=cid, act=payload.get('act'),
                    directive=payload.get('directive'),
                    reason=payload.get('reason'), result=res,
                    seq=payload.get('seq'),
                    turn=seq2turn.get((cid, payload.get('seq'))))
                box['res'] = res; ev.set()
            return True

        def dispatch(cid, trig):
            """invoke cid's brain for a due trigger; returns reply dict"""
            calls[0] += 1
            seq = seq_of.get(cid, 0) + 1
            seq_of[cid] = seq
            tier = trig.get('tier', 'T1')
            stats[cid]['by_kind'][trig['kind']] = \
                stats[cid]['by_kind'].get(trig['kind'], 0) + 1
            if args.scripted:
                st = pg.evaluate(
                    '(a) => __aiBridge.sfAgentState(a.cid, a.opts)',
                    {'cid': cid, 'opts': {}}) or {}
                out = scripted_turn(cid, trig, st)
                if not out:
                    log(cid=cid, trig=trig, skipped=True); return {}
                res = pg.evaluate(
                    '(a) => __aiBridge.sfAgentAct(a.cid, a.act,'
                    ' {directive: a.directive, seq: a.seq})',
                    {'cid': cid, 'act': out['act'],
                     'directive': out.get('directive'), 'seq': seq}) or {}
                stats[cid]['calls'] += 1
                stats[cid]['ok' if res.get('ok') else 'err'] += 1
                log(cid=cid, seq=seq, tier=tier, trig=trig,
                    act=out['act'], directive=out.get('directive'),
                    result=res)
                return res
            # devin session mode: the trigger is the prompt
            prompt = (f'Dispatch seq={seq} kind={trig["kind"]} tier={tier} '
                      f'detail={json.dumps(trig.get("detail"))}. '
                      + ('Cheap refile turn — keep it short. '
                         if tier == 'T0' else '')
                      + 'Do the ritual in BRIEF.md: curl /state, '
                        'POST /act once (include "seq":' + str(seq) +
                        '), journal one line, stop.')
            p = subprocess.Popen(
                devin_cmd(cid, prompt, TRANSC / f'{cid}.atif.json'),
                cwd=str(HERE/'agents'/cid),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, text=True)
            return {'proc': p}

        pending_procs = {}
        while True:
            sim_now = pg.evaluate('W.day * 24 + W.tod')
            if sim_now - t0 >= args.sim_hours or time.time() > deadline:
                break
            if args.max_calls and calls[0] >= args.max_calls:
                break
            # drain the trigger queue
            try:
                poll = pg.evaluate('() => __aiBridge.sfDispatchPoll()') or {}
            except Exception as e:
                poll = {}; print('[driver] poll err', e, flush=True)
            for cid in CAST:
                slot = (poll.get('per') or {}).get(cid) or {}
                due = slot.get('due')
                if not due:
                    continue
                # failure-honesty probe (user order): once per main,
                # withhold the brain turn AT the directive boundary —
                # the will lapses into a visible intention_gap, never
                # silent busyness, never sfSched.
                if (not args.no_withhold and cid not in withheld
                        and due['kind'] == 'directive_expiry'):
                    withheld.add(cid)
                    turn_n[0] += 1
                    shot, cam = take_turn_shot(cid, 'withheld')
                    log(turn=turn_n[0], cid=cid, withheld='directive_expiry',
                        tier=due.get('tier'), cam=cam, shot=shot,
                        detail=due.get('detail'),
                        note='brain turn withheld at directive boundary')
                    print(f'[driver] {cid} withheld at directive boundary',
                          flush=True)
                    continue
                turn_n[0] += 1
                shot, cam = take_turn_shot(cid, due['kind'])
                seq2turn[(cid, seq_of.get(cid, 0) + 1)] = turn_n[0]
                r = dispatch(cid, due)
                log(turn=turn_n[0], cid=cid, dispatched=due['kind'],
                    tier=due.get('tier'), detail=due.get('detail'),
                    cam=cam, shot=shot)
                if r.get('proc') is not None:
                    pending_procs[cid] = r['proc']
            # retire finished devin sessions
            for cid, p in list(pending_procs.items()):
                if p.poll() is not None:
                    out = (p.stdout.read() if p.stdout else '') or ''
                    log(cid=cid, devin_rc=p.returncode,
                        devin_tail=out[-400:])
                    del pending_procs[cid]
            pump(0.25)
            # ambient cadence: positions + gap scan + a wide shot
            if time.time() >= shot_at:
                shot_at = time.time() + args.shot_every
                pos = pg.evaluate("""() => Object.fromEntries(
                    VILLAGERS.filter(v => v._castId).map(v => [v._castId, {
                      x: Math.round(v.x), y: Math.round(v.y),
                      st: v.state, gap: !!v.sfGap,
                      inside: v.inside || null }]))""")
                gaps = [c for c, s in pos.items()
                        if s.get('gap') and c in CAST]
                for c in gaps:
                    if c in withheld and c not in gap_ok:
                        gap_ok.add(c)
                        log(cid=c, gap_confirmed=True,
                            note='withheld will -> visible intention_gap')
                        print(f'[driver] {c} intention_gap CONFIRMED',
                              flush=True)
                log(sim_now=sim_now, pos=pos, gaps=gaps)
                print(f'[driver] t+{sim_now - t0:.2f}h — '
                      f'calls {calls[0]}, gaps {gaps}', flush=True)

        # drain in-flight brain sessions (their /act POSTs still land)
        t_drain = time.time() + 300
        while pending_procs and time.time() < t_drain:
            pump(0.5)
            for cid, p in list(pending_procs.items()):
                if p.poll() is not None:
                    out = (p.stdout.read() if p.stdout else '') or ''
                    log(cid=cid, devin_rc=p.returncode,
                        devin_tail=out[-400:])
                    del pending_procs[cid]

        # ---- the daily reflect: one T2 turn per main at run end ----
        # (skipped on --max-calls probes — sanity runs shouldn't spawn
        #  eight extra brain sessions)
        for cid in ([] if args.max_calls else CAST):
            st = pg.evaluate(
                '(a) => __aiBridge.sfAgentState(a.cid, {reflect:1})',
                {'cid': cid}) or {}
            seq = seq_of.get(cid, 0) + 1
            seq_of[cid] = seq
            if args.scripted:
                out = scripted_reflect(cid, st)
                res = pg.evaluate(
                    '(a) => __aiBridge.sfAgentAct(a.cid, a.act,'
                    ' {directive: a.directive, seq: a.seq})',
                    {'cid': cid, 'act': out['act'],
                     'directive': out.get('directive'), 'seq': seq}) or {}
                stats[cid]['calls'] += 1
                stats[cid]['ok' if res.get('ok') else 'err'] += 1
                log(cid=cid, seq=seq, tier='T2', trig={'kind':'reflect'},
                    act=out['act'], directive=out.get('directive'),
                    result=res)
            else:
                prompt = (f'Dispatch seq={seq} kind=reflect tier=T2. '
                          'Bedtime: file ONE POST with act.verb=reflect '
                          '(1-3 insights in your own voice) and a sleep '
                          'directive. Check /state?reflect=1 first.')
                turn_n[0] += 1
                shot, cam = take_turn_shot(cid, 'reflect')
                seq2turn[(cid, seq)] = turn_n[0]
                log(turn=turn_n[0], cid=cid, dispatched='reflect',
                    tier='T2', cam=cam, shot=shot)
                pending_procs[cid] = subprocess.Popen(
                    devin_cmd(cid, prompt, TRANSC / f'{cid}.atif.json'),
                    cwd=str(HERE/'agents'/cid),
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    text=True)
        # let the T2 filings land — sessions answer over HTTP, so keep
        # pumping until every reflect session exits (bounded)
        t_end = time.time() + 600
        while pending_procs and time.time() < t_end:
            pump(0.5)
            for cid, p in list(pending_procs.items()):
                if p.poll() is not None:
                    out = (p.stdout.read() if p.stdout else '') or ''
                    log(cid=cid, devin_rc=p.returncode,
                        devin_tail=out[-400:])
                    del pending_procs[cid]
        ctx.close()
        br.close()
    srv.shutdown()

    print('--- per-main stats ---')
    for cid in CAST:
        s = stats[cid]
        print(f"  {cid}: calls {s['calls']} ok {s['ok']} err {s['err']} "
              f"kinds {s['by_kind']}")
    print('[driver] done — video in production/playtest/video/', flush=True)

if __name__ == '__main__':
    main()
