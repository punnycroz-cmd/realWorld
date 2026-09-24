#!/usr/bin/env python3
"""build production/playtest/replay.html from turns.jsonl + turns/*.png.

production-2 schema: one row per dispatched turn {turn, cid, dispatched,
tier, cam, shot}, /act filings joined by `turn`, ambient snapshots
{sim_now, pos{cid:{x,y,st,gap,order,dir,convo}}}, withheld + gap_confirmed
markers, devin_rc rows.

Replay = turn scrubber: that turn's screenshot + camera, the filing
brain's trigger/order/directive/why, and ALL EIGHT mains' standing will
(order/directive/gap/convo) side by side at the nearest snapshot.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
LOG = HERE / 'turns.jsonl'
OUT = HERE / 'replay.html'

NAMES = {'C1':'Marisol','C2':'Jules','C3':'Dani','C4':'Priya',
         'C5':'Marcus','C6':'Carmen','C7':'Victor','C8':'Tomás'}
CAST = list(NAMES)

def main():
    rows = [json.loads(l) for l in LOG.read_text().splitlines()
            if l.strip()]
    turns = {}   # turn -> merged record
    order = []
    snaps = []   # (ts, pos, gaps)
    wire_at = {} # unused placeholder for future wire tails
    for r in rows:
        t = r.get('turn')
        if 'pos' in r:
            snaps.append({'ts': r.get('ts', 0), 'pos': r['pos'],
                          'gaps': r.get('gaps', []),
                          'sim_now': r.get('sim_now')})
        if t is None:
            continue
        rec = turns.setdefault(t, {'acts': [], 'rcs': []})
        if t not in order:
            order.append(t)
        for k in ('cid', 'dispatched', 'tier', 'detail', 'cam', 'shot',
                  'withheld', 'note', 'ts'):
            if k in r:
                rec.setdefault(k, r[k])
        if 'act' in r:
            rec['acts'].append(r)
        if 'devin_rc' in r:
            rec['rcs'].append(r)
        if 'gap_confirmed' in r:
            rec['gap_confirmed'] = True
    order.sort()

    # attach the ambient snapshot nearest BEFORE each turn's dispatch
    data = []
    for t in order:
        rec = turns[t]
        ts = rec.get('ts', 0)
        snap = None
        for s in snaps:
            if s['ts'] <= ts:
                snap = s
            else:
                break
        if snap is None and snaps:
            snap = snaps[0]
        data.append({'turn': t, 'cid': rec.get('cid'),
                     'kind': rec.get('withheld') or rec.get('dispatched'),
                     'tier': rec.get('tier'), 'cam': rec.get('cam'),
                     'shot': rec.get('shot'), 'note': rec.get('note'),
                     'withheld': bool(rec.get('withheld')),
                     'gap_confirmed': bool(rec.get('gap_confirmed')),
                     'acts': rec['acts'], 'rcs': rec['rcs'],
                     'pos': (snap or {}).get('pos', {}),
                     'gaps': (snap or {}).get('gaps', []),
                     'sim_now': (snap or {}).get('sim_now')})

    html = """<!DOCTYPE html><html><head><meta charset=utf-8>
<title>Real World: The Mission — production-2 brain playtest</title>
<style>
body{margin:0;background:#0d1017;color:#ece7db;font:14px/1.5 'Segoe UI',system-ui,sans-serif}
#top{display:flex;gap:14px;align-items:center;padding:10px 18px;border-bottom:1px solid #2c3440;background:#11141a;position:sticky;top:0;z-index:5}
#top b{color:#e8a04c;letter-spacing:.12em;font-size:12px;text-transform:uppercase}
button{background:#20262f;border:1px solid #333c48;color:#ece7db;border-radius:6px;padding:6px 14px;cursor:pointer;font:inherit}
button:hover{border-color:#e8a04c}
#turnLbl{font-family:ui-monospace,monospace;color:#a89f8a;font-size:12.5px}
#main{display:grid;grid-template-columns:1fr 400px;gap:0;min-height:calc(100vh - 52px)}
#shot{background:#000;display:flex;align-items:center;justify-content:center}
#shot img{max-width:100%;max-height:calc(100vh - 60px)}
#side{border-left:1px solid #2c3440;padding:12px 14px;overflow-y:auto;max-height:calc(100vh - 52px)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a89f8a;margin:14px 0 6px}
.trig{border:1px solid #3a3520;border-left:3px solid #e8a04c;border-radius:8px;padding:8px 10px;margin:6px 0;background:#181a14;font-size:12.5px}
.trig .k{font-family:ui-monospace,monospace;color:#e8a04c}
.trig.w{border-left-color:#d4695e;background:#1c1215}
.act{border:1px solid #20262f;border-radius:8px;padding:8px 10px;margin:6px 0;background:#141923}
.act .who{color:#6ea8d4;font-weight:600}
.act .v{font-family:ui-monospace,monospace;font-size:12px;color:#e8a04c}
.act .rs{color:#a89f8a;font-size:12px;font-style:italic}
.act .dr{color:#7fa88a;font-size:11.5px;font-family:ui-monospace,monospace}
.act .bad{color:#d4695e;font-size:11.5px}
table{width:100%;border-collapse:collapse;font-size:11px;font-family:ui-monospace,monospace}
td,th{padding:2px 5px;text-align:left;border-bottom:1px solid #1c2129;color:#a89f8a;vertical-align:top}
th{color:#e8a04c}
.gap{color:#d4695e;font-weight:700}
.cv{color:#b48adf}
</style></head><body>
<div id=top><b>Real World · The Mission — becoming-brain playtest</b>
<button onclick="go(-1)">◀ prev</button><span id=turnLbl></span>
<button onclick="go(1)">next ▶</button>
<span id=camLbl style="margin-left:auto;color:#e8a04c;font:12px ui-monospace,monospace"></span></div>
<div id=main><div id=shot></div><div id=side></div></div>
<script>
const DATA = """ + json.dumps(data) + """;
const NAMES = """ + json.dumps(NAMES) + """;
const CAST = """ + json.dumps(CAST) + """;
let i = 0;
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function go(d){ i = Math.min(DATA.length-1, Math.max(0, i+d)); draw(); }
document.addEventListener('keydown', e => {
  if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
function draw(){
  const t = DATA[i];
  document.getElementById('turnLbl').textContent =
    'turn ' + t.turn + ' / ' + DATA.length +
    (t.sim_now!=null ? ' · t+' + t.sim_now.toFixed(1) + 'h' : '');
  document.getElementById('camLbl').textContent = 'camera: ' + (t.cam||'—');
  document.getElementById('shot').innerHTML = t.shot
    ? '<img src="turns/' + t.shot + '">' : '<div style="color:#665">no shot</div>';
  let h = '<h3>trigger</h3><div class="trig' + (t.withheld?' w':'') + '">' +
    '<span class="k">' + esc(t.kind||'?') + '</span> → <b>' +
    esc(NAMES[t.cid]||t.cid||'?') + '</b> <span style="color:#665">[' +
    esc(t.tier||'') + ']</span>' +
    (t.withheld ? ' <span style="color:#d4695e">WITHHELD — brain never called</span>' : '') +
    (t.gap_confirmed ? ' <span style="color:#d4695e">→ intention_gap seen</span>' : '') +
    (t.note ? '<div class="rs" style="font-style:italic;color:#a89f8a">' + esc(t.note) + '</div>' : '') +
    '</div>';
  for(const a of t.acts){
    const v = a.act||{}; const d = a.directive||{}; const who = NAMES[a.cid]||a.cid;
    h += '<div class="act"><span class="who">'+esc(who)+'</span> ' +
      '<span class="v">'+esc(v.verb)+(v.to?' → '+esc(v.to):'')+'</span>' +
      (v.text?'<div>“'+esc(v.text)+'”</div>':'') +
      (v.do?'<div class="rs">('+esc(v.do)+')</div>':'') +
      (v.why?'<div class="rs">why: '+esc(v.why)+'</div>':'') +
      (d.verb?'<div class="dr">will: '+esc(d.verb)+(d.to?' → '+esc(d.to):'')+
        ' · “'+esc(d.why||'')+'” · '+(d.untilH||'?')+'h'+
        (d.repeat===false?' · once':'')+'</div>':'') +
      (a.result && a.result.ok===false
        ?'<div class="bad">✗ '+esc(a.result.err)+'</div>':'') +
      '</div>';
  }
  for(const r of t.rcs)
    h += '<div class="act"><div class="bad">devin session rc=' + r.devin_rc +
      '</div><div class="rs">' + esc((r.devin_tail||'').slice(-160)) + '</div></div>';
  h += '<h3>all eight, right then</h3><table><tr><th></th><th>state</th>' +
       '<th>order</th><th>will</th><th>convo</th></tr>';
  for(const cid of CAST){
    const p = (t.pos||{})[cid] || {};
    h += '<tr><td>'+esc(NAMES[cid])+'</td><td' +
      (p.gap ? ' class="gap"' : '') + '>' + esc(p.st||'—') +
      (p.gap?' ·GAP':'') + (p.inside?' ·'+esc(p.inside):'') + '</td><td>' +
      esc(p.order||'') + '</td><td>' + esc(p.dir||'') + '</td><td class="cv">' +
      esc(p.convo||'') + '</td></tr>';
  }
  h += '</table>';
  document.getElementById('side').innerHTML = h;
}
draw();
</script></body></html>"""
    OUT.write_text(html, encoding='utf-8')
    print('wrote', OUT, f'({len(data)} turns)')

if __name__ == '__main__':
    main()
