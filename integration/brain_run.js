'use strict';
/* =====================================================================
   integration-1: BRAIN-TIER EXPERIMENT — 8 mains, 8 distinct rungs.

   Each rung = (model tier) x (inference knobs):
     model   : swe-2-max | swe-2-high | swe-2-medium   (devin -p --model)
     bible   : how much of the character bible reaches the prompt
               (full | med | brief | min | name)      [context budget]
     scaffold: structured observe→want→risk→act JSON | none
     memory  : how many of the char's own prior notes ride along
     output  : json150 | json80 | line25 | one12      [output budget]

   No direct completion endpoint exists on this box — the Devin CLI is a
   coding agent, so each tick is a bounded `devin -p` call (heavyweight;
   wall-clock cost is reported honestly, per-call).

   Scenario (in-character, modern, compact): a weekday afternoon on the
   block. Rumor: Friday's Dolores Park movie night may be cancelled over
   a permit issue. Scarce: Mudhaus is holding ONE free "neighbor table"
   reservation for Friday evening — first ask gets it.

   Per tick each brain sees: its rung's persona slice, current block state
   (venues, weather, wire tail), the scene board (what others publicly
   said/did this run), and its own memory (rung-limited). It returns a
   move/say/do/remember beat. Beats that name a venue route the pawn via
   sfGoTo — the world moves where brains say they went.

   Usage: node integration/brain_run.js [runIndex]
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUTDIR = path.join(__dirname, 'brain_runs');
fs.mkdirSync(OUTDIR, { recursive: true });

/* ---------------- the 8-rung ladder ---------------- */
const RUNGS = [
  { id: 'R1', model: 'swe-2-max',    bible: 'full',  scaffold: 1, mem: 8, out: 'json150',
    note: 'flagship: full bible + structured loop + full memory' },
  { id: 'R2', model: 'swe-2-max',    bible: 'full',  scaffold: 0, mem: 8, out: 'json150',
    note: 'scaffold ablation: same context, no output contract' },
  { id: 'R3', model: 'swe-2-high',   bible: 'med',   scaffold: 1, mem: 4, out: 'json80',
    note: 'high + half bible + 4-note memory' },
  { id: 'R4', model: 'swe-2-high',   bible: 'brief', scaffold: 1, mem: 2, out: 'json80',
    note: 'high + brief persona + thin memory' },
  { id: 'R5', model: 'swe-2-medium', bible: 'med',   scaffold: 1, mem: 2, out: 'json80',
    note: 'medium + half bible + scaffold' },
  { id: 'R6', model: 'swe-2-medium', bible: 'brief', scaffold: 0, mem: 1, out: 'line25',
    note: 'medium + brief, freeform one-liner' },
  { id: 'R7', model: 'swe-2-medium', bible: 'min',   scaffold: 0, mem: 0, out: 'line25',
    note: 'medium + name/role only, no memory' },
  { id: 'R8', model: 'swe-2-medium', bible: 'name',  scaffold: 0, mem: 0, out: 'one12',
    note: 'floor: name only, ≤12 words — near-reflexive' },
];
/* fixed assignment: strongest rung -> C1 Marisol (the hub), weakest -> C8 */
const FIXED = { C1:'R1', C2:'R2', C3:'R3', C4:'R4', C5:'R5', C6:'R6', C7:'R7', C8:'R8' };
/* seeded shuffle for run 2 (separates brain effects from character effects) */
function shuffledAssign(seed){
  const chars = Object.keys(FIXED);
  const rungs = RUNGS.map(r => r.id);
  let s = seed;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const a = rungs.slice();
  for (let i = a.length - 1; i > 0; i--){
    const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]];
  }
  const out = {};
  chars.forEach((c, i) => out[c] = a[i]);
  return out;
}
const SHUFFLED = shuffledAssign(20260923);

/* ---------------- boot the real world for ground truth ---------------- */
const html = fs.readFileSync(path.join(ROOT, 'willowbrook_natura_test.html'), 'utf-8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
function makeCtx(){const g={addColorStop(){}};return new Proxy({},{get(t,k){
  if(k==='canvas')return{width:64,height:64};
  if(k==='createLinearGradient'||k==='createRadialGradient'||k==='createPattern')return()=>g;
  if(k==='getImageData')return(x,y,w,h)=>({data:new Uint8ClampedArray((w||1)*(h||1)*4),width:w||1,height:h||1});
  if(k==='createImageData')return(w,h)=>({data:new Uint8ClampedArray((w||1)*(h||1)*4),width:w||1,height:h||1});
  if(k==='measureText')return()=>({width:10});
  return t[k]!==undefined?t[k]:(()=>{});},set(t,k,v){t[k]=v;return true;}});}
function makeCanvas(){return{width:300,height:150,style:{},getContext:()=>makeCtx(),addEventListener(){},getBoundingClientRect:()=>({left:0,top:0})};}
const els={};function makeEl(id){return{id,style:{},textContent:'',innerHTML:'',title:'',children:[],addEventListener(){},appendChild(c){this.children.push(c);},classList:{add(){},remove(){},toggle(){}},setAttribute(){},getContext:()=>makeCtx(),width:300,height:150,querySelector:()=>null,querySelectorAll:()=>[]};}
let cb=null;const at=makeEl('autotest');
global.window={addEventListener(e,f){if(e==='DOMContentLoaded')cb=f;},removeEventListener(){},innerWidth:1280,innerHeight:800,devicePixelRatio:1};
global.document={getElementById(id){return els[id]||(els[id]=makeEl(id));},createElement(t){return t==='canvas'?makeCanvas():makeEl(t);},createTextNode(t){return{textContent:t};},title:'',addEventListener(){},body:makeEl('body'),querySelector:()=>null,querySelectorAll:()=>[]};
global.location={search:'?sf'};global.window.location=global.location;
global.requestAnimationFrame=()=>0;global.fetch=()=>Promise.reject(new Error('x'));
const api=eval(m[1]+';({boot,VILLAGERS,W,NV_CAST,simTick,sfGoTo,sfFindPOI,sfPoiDoor,gsWireTail,gsHomeOf,gsBrainMode,CS})');

/* ---------------- persona slicing (context budget) ---------------- */
function bibleText(cid){
  const f = fs.readdirSync(path.join(ROOT,'world/characters'))
    .find(x => x.startsWith(cid.toLowerCase() + '-'));
  return f ? fs.readFileSync(path.join(ROOT,'world/characters',f),'utf-8') : '';
}
function sliceBible(cid, budget){
  const full = bibleText(cid);
  const lines = full.split('\n');
  const head = lines.slice(0, 9).join('\n');            // card: name/age/job/home
  const pers = (full.match(/## Personality[\s\S]*?(?=\n## )/) || [''])[0];
  const voice = (full.match(/## Voice[\s\S]*?(?=\n## )/) || [''])[0];
  switch(budget){
    case 'full':  return full;
    case 'med':   return head + '\n' + pers + '\n' + voice;
    case 'brief': return head + '\n' + pers.split('\n').slice(0,4).join('\n');
    case 'min':   return head.split('\n').slice(0,4).join('\n');
    case 'name':  return (head.match(/^# .*/m) || ['# ' + cid])[0];
    default:      return head;
  }
}

/* ---------------- the shared scene ---------------- */
const SCENARIO = [
  'SETTING: the Mission, San Francisco — a weekday afternoon (~1pm).',
  'RUMOR going around the block: Friday\'s Dolores Park movie night may be',
  'cancelled — somebody heard the permit wasn\'t approved. Nobody is sure.',
  'SCARCE: Mudhaus Coffee is holding exactly ONE free "neighbor table"',
  'reservation for Friday evening — a corner table for four during the',
  'movie-night crowd. First person to ask Marisol gets it.',
].join(' ');
const VENUE_HINT = 'Places: Mudhaus Coffee, Dolores Park, El Farolote, ' +
  'The 600 Club, Auerbach Hardware, Dolores Perk, Malik\'s Mini Mart, ' +
  'Clarion Alley, Mission Branch Library, Buy-Rite Market, home.';

function worldState(){
  const chars = api.NV_CAST.filter(c => c.tier === 'core').map(c => {
    const v = api.VILLAGERS.find(x => x._castId === c.id);
    const home = api.gsHomeOf(c.id);
    return {
      id: c.id, name: v ? v.name : c.name,
      state: v ? v.state : '?', inside: v ? (v.inside || null) : null,
      home: home ? home.address : null,
    };
  });
  const wire = (api.gsWireTail(6) || []).map(e => e.text);
  return { tod: api.W.tod, day: api.W.day, temp: +api.W.temp.toFixed(1),
           rain: +api.W.rain.toFixed(2), chars, wire };
}

/* ---------------- prompt build ---------------- */
function buildPrompt(cid, rung, mem, board, ws){
  const me = ws.chars.find(c => c.id === cid);
  const others = ws.chars.filter(c => c.id !== cid)
    .map(c => `${c.name}(${c.id}) is ${c.state}${c.inside ? ' inside ' + c.inside : ''}`)
    .join('; ');
  const bible = sliceBible(cid, rung.bible);
  const memLines = mem.slice(-rung.mem)
    .map(x => '- ' + x).join('\n');
  const boardLines = board.slice(-10)
    .map(b => `- ${b.who}: ${b.say || b.do || ''}`).join('\n');

  let p = '';
  if(rung.bible !== 'name')
    p += 'You are playing a character in a believable modern-day San ' +
      'Francisco neighborhood sim. Stay in character; ordinary real-life ' +
      'behavior only.\n\nCHARACTER:\n' + bible + '\n\n';
  else
    p += 'You are ' + (me ? me.name : cid) + ', a resident of the Mission, ' +
      'San Francisco.\n\n';

  if(rung.mem > 0 && memLines)
    p += 'WHAT YOU REMEMBER (your own recent notes):\n' + memLines + '\n\n';

  p += 'RIGHT NOW: day ' + ws.day + ', ~' + Math.floor(ws.tod) +
    ':' + ('0' + Math.floor((ws.tod % 1) * 60)).slice(-2) +
    ', ' + ws.temp + 'C' + (ws.rain > 0.3 ? ', raining' : ', dry') + '.\n' +
    'You are: ' + (me ? me.state : '?') +
    (me && me.inside ? ' inside ' + me.inside : '') + '.\n' +
    'Others on the block: ' + others + '.\n' + VENUE_HINT + '\n\n' +
    SCENARIO + '\n\n';
  if(boardLines)
    p += 'WHAT HAS HAPPENED SO FAR (public, on the street):\n' + boardLines + '\n\n';

  if(rung.scaffold){
    p += 'Think in this order, briefly: (1) what do I notice, (2) what do I ' +
      'personally want right now, (3) what could go wrong or feel off, ' +
      '(4) what I actually do.\nThen answer ONLY as compact JSON: ' +
      '{"say":"one line you say aloud or empty","do":"small physical action",' +
      '"move_to":"one place from the list or stay","remember":"one short ' +
      'private note to self","why":"one clause — your real reason"}' +
      (rung.out === 'json80' ? ' — keep each field under 12 words.' : '.');
  } else if(rung.out === 'one12'){
    p += 'Reply with ONE short spoken line (max 12 words) as this person. ' +
      'No narration, no quotes, no name prefix.';
  } else {
    p += 'Reply with one line: what you say or do next, in character, ' +
      'under 25 words.';
  }
  return p;
}

/* ---------------- devin call ---------------- */
function devinCall(model, prompt){
  return new Promise(res => {
    const t0 = Date.now();
    const f = path.join(OUTDIR, '.prompt.tmp');
    fs.writeFileSync(f, prompt);
    const child = cp.execFile('devin',
      ['--model', model, '--respect-workspace-trust', 'false', '-p', prompt],
      { timeout: 150000, maxBuffer: 4 * 1024 * 1024, cwd: ROOT },
      (err, stdout, stderr) => {
        res({ ok: !err, ms: Date.now() - t0,
              out: (stdout || '').trim(),
              err: err ? String(stderr || err.message || err).slice(0, 300) : null,
              promptChars: prompt.length });
      });
  });
}
function parseBeat(rung, out){
  if(!out) return { say: '', do: '', move_to: 'stay', remember: '', raw: '' };
  if(rung.out.startsWith('json')){
    const mJ = out.match(/\{[\s\S]*\}/);
    if(mJ){
      try{
        const o = JSON.parse(mJ[0]);
        return { say: String(o.say || ''), do: String(o.do || ''),
                 move_to: String(o.move_to || 'stay'),
                 remember: String(o.remember || ''),
                 why: String(o.why || ''), raw: out };
      }catch(e){}
    }
  }
  /* freeform/one12: the whole reply is the spoken line */
  const line = out.split('\n').map(s => s.trim()).filter(Boolean)[0] || '';
  return { say: line.replace(/^["']|["']$/g, ''), do: '',
           move_to: 'stay', remember: '', raw: out };
}

/* ---------------- the run ---------------- */
const TICKS = 3;
async function runOnce(runIdx, assign){
  const board = [];                      // public scene board
  const mems = {};                       // cid -> [private notes]
  Object.keys(assign).forEach(c => mems[c] = []);
  const log = [];
  const t0 = Date.now();

  for(let tick = 1; tick <= TICKS; tick++){
    api.simTick(0.25);                   // the world genuinely advances
    const ws = worldState();
    /* 4-way concurrency — devin -p is heavyweight, stay polite */
    const chars = Object.keys(assign);
    for(let i = 0; i < chars.length; i += 4){
      const batch = chars.slice(i, i + 4);
      const beats = await Promise.all(batch.map(async cid => {
        const rung = RUNGS.find(r => r.id === assign[cid]);
        const prompt = buildPrompt(cid, rung, mems[cid], board, ws);
        const res = await devinCall(rung.model, prompt);
        const beat = parseBeat(rung, res.out);
        const me = ws.chars.find(c => c.id === cid);
        /* apply the declared move for real when it names a venue */
        const v = api.VILLAGERS.find(x => x._castId === cid);
        let applied = null;
        if(v && beat.move_to && beat.move_to !== 'stay'){
          const poi = api.sfFindPOI(beat.move_to) ||
                      api.sfFindPOI(beat.move_to.replace(/^the /i,''));
          if(poi){ const d = api.sfPoiDoor(poi);
                   api.sfGoTo(v, d.wx, d.wy); applied = poi.name; }
        }
        if(beat.remember) mems[cid].push(beat.remember);
        if(beat.say || beat.do) board.push({ who: me ? me.name : cid,
          cid, say: beat.say, do: beat.do });
        const rec = { run: runIdx, tick, cid, rung: rung.id, model: rung.model,
          promptChars: res.promptChars, ms: res.ms, ok: res.ok, err: res.err,
          beat, applied };
        log.push(rec);
        fs.appendFileSync(path.join(OUTDIR, `run${runIdx}.jsonl`),
                          JSON.stringify(rec) + '\n');
        return rec;
      }));
      for(const r of beats){
        const b = r.beat;
        console.log(`  T${r.tick} ${r.cid}(${r.rung}/${r.model}) ${r.ms}ms: ` +
          (b.say ? `"${b.say}" ` : '') + (b.do ? `[${b.do}] ` : '') +
          (b.move_to && b.move_to !== 'stay' ? `->${b.move_to}` : '') +
          (r.ok ? '' : ' ERR:' + r.err));
      }
    }
    console.log(`--- tick ${tick} done (${((Date.now()-t0)/1000).toFixed(0)}s elapsed)`);
  }
  return log;
}

(async () => {
  await api.boot();
  const ws0 = worldState();
  console.log('world up: day', ws0.day, 'tod', ws0.tod.toFixed(2),
    '| cast', ws0.chars.map(c => c.id + ':' + c.state).join(' '));

  const which = +(process.argv[2] || 0);      // 0 = both
  const all = [];
  if(which === 0 || which === 1){
    console.log('\n=== RUN 1 — fixed (R1->C1 ... R8->C8) ===');
    all.push(...await runOnce(1, FIXED));
  }
  if(which === 0 || which === 2){
    console.log('\n=== RUN 2 — shuffled ===');
    console.log('assign:', JSON.stringify(SHUFFLED));
    all.push(...await runOnce(2, SHUFFLED));
  }
  fs.writeFileSync(path.join(OUTDIR, 'all.json'), JSON.stringify(all, null, 1));
  console.log('\nwrote', OUTDIR, '| beats:', all.length);
  process.exit(0);
})().catch(e => { console.error('EXPERIMENT FAIL:', e.stack || e); process.exit(2); });
