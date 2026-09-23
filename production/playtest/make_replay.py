#!/usr/bin/env python3
"""build production/playtest/replay.html from turns.jsonl + turns/*.png.

One self-contained page: turn scrubber with the per-turn screenshot,
each agent's action + reason (from their own POSTs — no central script),
the camera in use, the Wire tail, and a positions table. No server needed.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent
LOG = HERE / 'turns.jsonl'
OUT = HERE / 'replay.html'

NAMES = {'C1':'Marisol','C2':'Jules','C3':'Dani','C4':'Priya',
         'C5':'Marcus','C6':'Carmen','C7':'Victor','C8':'Tomás'}

def main():
    turns = {}
    order = []
    for line in LOG.read_text().splitlines():
        r = json.loads(line)
        t = r.get('turn')
        if t is None: continue
        if t not in turns:
            turns[t] = {'acts': [], 'dev': [], 'snap': None}
            order.append(t)
        if 'act' in r:
            turns[t]['acts'].append(r)
        elif 'devin_rc' in r:
            turns[t]['dev'].append(r)
        elif 'pos' in r:
            turns[t]['snap'] = r
    order.sort()
    data = [dict(turn=t, cam=(turns[t]['snap'] or {}).get('cam'),
                 tod=(turns[t]['snap'] or {}).get('tod'),
                 acts=turns[t]['acts'],
                 wire=(turns[t]['snap'] or {}).get('wire', []),
                 pos=(turns[t]['snap'] or {}).get('pos', {}))
            for t in order]

    html = """<!DOCTYPE html><html><head><meta charset=utf-8>
<title>Real World: The Mission — 8-agent playtest replay</title>
<style>
body{margin:0;background:#0d1017;color:#ece7db;font:14px/1.5 'Segoe UI',system-ui,sans-serif}
#top{display:flex;gap:14px;align-items:center;padding:10px 18px;border-bottom:1px solid #2c3440;background:#11141a;position:sticky;top:0}
#top b{color:#e8a04c;letter-spacing:.12em;font-size:12px;text-transform:uppercase}
button{background:#20262f;border:1px solid #333c48;color:#ece7db;border-radius:6px;padding:6px 14px;cursor:pointer;font:inherit}
button:hover{border-color:#e8a04c}
#turnLbl{font-family:ui-monospace,monospace;color:#a89f8a;font-size:12.5px}
#main{display:grid;grid-template-columns:1fr 360px;gap:0;min-height:calc(100vh - 52px)}
#shot{background:#000;display:flex;align-items:center;justify-content:center}
#shot img{max-width:100%;max-height:calc(100vh - 60px)}
#side{border-left:1px solid #2c3440;padding:12px 14px;overflow-y:auto;max-height:calc(100vh - 52px)}
h3{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#a89f8a;margin:14px 0 6px}
.act{border:1px solid #20262f;border-radius:8px;padding:8px 10px;margin:6px 0;background:#141923}
.act .who{color:#6ea8d4;font-weight:600}
.act .v{font-family:ui-monospace,monospace;font-size:12px;color:#e8a04c}
.act .rs{color:#a89f8a;font-size:12px;font-style:italic}
.act .bad{color:#d4695e;font-size:11.5px}
.wi{font-family:ui-monospace,monospace;font-size:11px;color:#a89f8a;border-bottom:1px dashed #20262f;padding:2px 0}
.wi b{color:#5fae7f;font-weight:400}
table{width:100%;border-collapse:collapse;font-size:11px;font-family:ui-monospace,monospace}
td,th{padding:2px 6px;text-align:left;border-bottom:1px solid #1c2129;color:#a89f8a}
th{color:#e8a04c}
</style></head><body>
<div id=top><b>Real World · The Mission — 8-agent playtest</b>
<button onclick="go(-1)">◀ prev</button><span id=turnLbl></span>
<button onclick="go(1)">next ▶</button>
<span id=camLbl style="margin-left:auto;color:#e8a04c;font:12px ui-monospace,monospace"></span></div>
<div id=main><div id=shot></div><div id=side></div></div>
<script>
const DATA = """ + json.dumps(data) + """;
const NAMES = """ + json.dumps(NAMES) + """;
let i = 0;
function fmtT(t){ if(t==null) return '--:--';
  return ('0'+Math.floor(t/60)).slice(-2)+':'+('0'+Math.floor(t%60)).slice(-2); }
function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function go(d){ i = Math.min(DATA.length-1, Math.max(0, i+d)); draw(); }
document.addEventListener('keydown', e => {
  if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
function draw(){
  const t = DATA[i];
  document.getElementById('turnLbl').textContent =
    'turn ' + t.turn + ' / ' + DATA.length + ' · tod ' + (t.tod?t.tod.toFixed(1):'?');
  document.getElementById('camLbl').textContent = 'camera: ' + (t.cam||'—');
  document.getElementById('shot').innerHTML =
    '<img src="turns/turn'+String(t.turn).padStart(2,'0')+'.png">';
  let h = '<h3>what the eight did</h3>';
  for(const a of t.acts){
    const v = a.act||{}; const who = NAMES[a.cid]||a.cid;
    h += '<div class="act"><span class="who">'+esc(who)+'</span> ' +
      '<span class="v">'+esc(v.verb)+(v.to?' → '+esc(v.to):'')+
      (v.text?' — “'+esc(v.text)+'”':'')+'</span>' +
      (a.reason?'<div class="rs">'+esc(a.reason)+'</div>':'') +
      (a.result && a.result.ok===false?'<div class="bad">✗ '+esc(a.result.err)+'</div>':'') +
      '</div>';
  }
  if(!t.acts.length) h += '<div class="rs">no actions posted</div>';
  h += '<h3>positions</h3><table><tr><th>id</th><th>state</th><th>inside</th></tr>';
  for(const cid of Object.keys(t.pos)){
    const p = t.pos[cid];
    h += '<tr><td>'+esc(NAMES[cid]||cid)+'</td><td>'+esc(p.st)+'</td><td>'+esc(p.inside||'')+'</td></tr>';
  }
  h += '</table><h3>the wire</h3>';
  for(const e of (t.wire||[]).slice().reverse())
    h += '<div class="wi"><b>'+fmtT(e.t)+'</b> '+esc((e.who?e.who+': ':'')+e.text)+'</div>';
  document.getElementById('side').innerHTML = h;
}
draw();
</script></body></html>"""
    OUT.write_text(html, encoding='utf-8')
    print('wrote', OUT, f'({len(data)} turns)')

if __name__ == '__main__':
    main()
