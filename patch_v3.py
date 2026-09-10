#!/usr/bin/env python3
"""natura-v2.html -> natura-v3.html : first settlement + first villager (Marta).
Her body lives in the sim; her mind will be a subagent driven through window.NV."""
import re, sys

src = open('/home/hatch/workspace/world-sim/natura-v2.html').read()
def rep(old, new):
    global src
    assert old in src, 'ANCHOR NOT FOUND: ' + old[:70].replace('\n','\\n')
    assert src.count(old) == 1, 'ANCHOR NOT UNIQUE: ' + old[:70]
    src = src.replace(old, new)

# ---- A. titles ----
rep('<title>Natura v1 — a living world</title>', '<title>Natura v3 — a living world</title>')
rep('<span class="title">NATURA v2</span>', '<span class="title">NATURA v3</span>')
rep('NATURA v1 — a watchmaker world sim.', 'NATURA v3 — a watchmaker world sim.')

# ---- B. CSS for Marta panel ----
rep('  #hint{position:fixed;left:12px;bottom:10px;',
    '''  #marta{border-top:1px solid #1e2a3a;padding:2px 0 8px}
  #mThought{font-style:italic;color:#d8cfa8;background:#141a10;border-left:2px solid #8a9a5a;
    padding:6px 8px;margin:8px 12px 4px;border-radius:0 8px 8px 0;line-height:1.5;font-size:12.5px}
  #mStats{padding:0 12px;font-size:12.5px;line-height:1.7;color:#b9c8dc}
  #mStats b{color:#e8f0fa}
  #hint{position:fixed;left:12px;bottom:10px;''')

# ---- C. sidebar: Marta section ----
rep("""  <h3>Inspector <span style="color:#5a6f88">(click the land)</span></h3>""",
    """  <h3>Marta <span style="color:#5a6f88">· the first settler</span></h3>
  <div id="marta"><div id="mThought">&ldquo;&hellip;&rdquo;</div><div id="mStats">&mdash;</div></div>
  <h3>Inspector <span style="color:#5a6f88">(click the land)</span></h3>""")

# ---- D. 64x speed ----
rep('<button id="b16">16×</button>', '<button id="b16">16×</button>\n  <button id="b64">64×</button>')
rep("for(const id of ['b1','b4','b16']) document.getElementById(id).classList.remove('on');",
    "for(const id of ['b1','b4','b16','b64']) document.getElementById(id).classList.remove('on');")
rep("document.getElementById('b16').onclick=()=>setSpeed(16);",
    "document.getElementById('b16').onclick=()=>setSpeed(16);\ndocument.getElementById('b64').onclick=()=>setSpeed(64);")

# ---- E. bush field in chunks ----
rep("""    burn:new Float32Array(n), snag:new Float32Array(n),""",
    """    burn:new Float32Array(n), snag:new Float32Array(n), bush:new Float32Array(n),""")

# ---- F. settlement + villager + NV API (insert before input section) ----
rep("/* ---------------- input: pan / zoom / inspect ---------------- */",
r'''/* ---------------- the first settlement + its first inhabitant ---------------- */
const SETTLE={wx:0,wy:0,founded:false};
const BUILD={hut:null,bench:null,pile:null,crate:null};
const items=[]; let itemSeq=1;                 // ground items: {id,type:'log',x,y}
const V={name:'Marta',x:0,y:0,hunger:1,energy:1,hp:1,
  inv:{log:0,timber:0,table:0,berries:0,food:8},
  carry:[],carryMax:2,act:'idle',actLabel:'taking in the new land',
  job:null,thought:'\u2026',speed:70};          // 70 world-px per game-hour
const MILE={};

function foundSettlement(){
  const R=15, sx=SETTLE.wx, sy=SETTLE.wy;
  for(let wy=sy-R;wy<=sy+R;wy++)for(let wx=sx-R;wx<=sx+R;wx++) cellChunk(wx,wy);
  for(let wy=sy-R;wy<=sy+R;wy++)for(let wx=sx-R;wx<=sx+R;wx++){
    const {c,i}=cellChunk(wx,wy);
    const d=Math.hypot(wx-sx,wy-sy);
    if(d<R){
      const t=(d/R)*(d/R);
      c.h[i]=lerp(0.46,c.h[i],t);
      if(d<R-2){ c.tStage[i]=0; c.tHp[i]=0; c.snag[i]=0; c.burn[i]=0; }
      c.moist[i]=Math.max(c.moist[i],0.55);
      if(c.h[i]>=SEA) c.grass[i]=Math.max(c.grass[i],0.7);
    }
  }
  BUILD.hut={wx:sx-3,wy:sy-2,w:3,h:2};
  BUILD.bench={wx:sx+2,wy:sy-1,w:1,h:1};
  BUILD.pile={wx:sx+2,wy:sy+2,w:2,h:1};
  BUILD.crate={wx:sx-3,wy:sy+2,w:1,h:1};
  let placed=0, guard=0;
  while(placed<44&&guard++<6000){
    const a=hash2(guard,placed,SEED+700)*Math.PI*2;
    const r=18+hash2(placed,guard,SEED+701)*42;
    const wx=Math.round(sx+Math.cos(a)*r), wy=Math.round(sy+Math.sin(a)*r);
    const {c,i}=cellChunk(wx,wy);
    if(c.h[i]>=SEA+0.02&&c.h[i]<0.72&&c.tStage[i]<1&&c.bush[i]<0.5){ c.bush[i]=1; placed++; }
  }
  V.x=(sx-1)*CS; V.y=(sy+1)*CS;
  SETTLE.founded=true;
  logEvent('life','A settler raises a hut on the green. Her name is Marta.');
}
function resetVillager(){
  V.x=(SETTLE.wx-1)*CS; V.y=(SETTLE.wy+1)*CS;
  V.hunger=1; V.energy=1; V.hp=1;
  V.inv={log:0,timber:0,table:0,berries:0,food:8};
  V.carry=[]; V.job=null; V.act='idle'; V.actLabel='taking in the new land';
  V.thought='\u2026';
  items.length=0;
  for(const k in MILE) delete MILE[k];
}

/* ---- her body: needs, movement, jobs ---- */
function vMoveTo(tx,ty,dtH){
  const dx=tx-V.x, dy=ty-V.y, d=Math.hypot(dx,dy);
  const step=V.speed*dtH*(V.energy<0.2?0.55:1);
  if(d<=step){ V.x=tx; V.y=ty; return true; }
  V.x+=dx/d*step; V.y+=dy/d*step; return false;
}
function dropLogs(wx,wy,n){
  for(let k=0;k<n;k++)
    items.push({id:itemSeq++,type:'log',
      x:(wx+(hash2(itemSeq,k,SEED+720)-0.5)*2)*CS,
      y:(wy+(hash2(k,itemSeq,SEED+721)-0.5)*2)*CS});
}
function villagerTick(dtH){
  if(!SETTLE.founded) return;
  for(const ch of activeList)for(let i=0;i<256;i++)
    if(ch.bush[i]>0&&ch.bush[i]<1) ch.bush[i]=Math.min(1,ch.bush[i]+dtH/72);
  const sleeping=V.job&&V.job.kind==='sleep', resting=V.job&&V.job.kind==='rest';
  const working=V.job&&!sleeping&&!resting;
  V.hunger=clamp(V.hunger-dtH/72,0,1);
  V.energy=clamp(V.energy+(sleeping?dtH/6:resting?dtH/10:working?-dtH/26:-dtH/48),0,1);
  V.hp=clamp(V.hp+(V.hunger<=0?-dtH/60:V.hunger>0.3?dtH/120:0),0.05,1);
  const J=V.job;
  if(!J){
    V.act='idle';
    V.actLabel=V.hunger<0.25?'stomach growling':V.energy<0.25?'weary':'taking in the land';
    return;
  }
  const at=(wx,wy)=>vMoveTo(wx*CS,wy*CS,dtH);
  if(J.kind==='goto'){
    V.act='walk'; V.actLabel=J.label||'walking';
    if(at(J.wx,J.wy)) V.job=null;
  }else if(J.kind==='fell'){
    const {c,i}=cellChunk(J.wx,J.wy);
    if(c.tStage[i]<2.5){ V.job=null; return; }          // gone (fire, storm)
    const d=Math.hypot(V.x-J.wx*CS,V.y-J.wy*CS);
    if(d>1.7*CS){ V.act='walk'; V.actLabel='going to the tree'; at(J.wx,J.wy); return; }
    V.act='fell'; V.actLabel='felling the tree';
    J.t+=dtH*(V.energy<0.15?0.5:1);
    if(J.t>=2.5){
      c.tStage[i]=0; c.tHp[i]=0; c.snag[i]=0;
      dropLogs(J.wx,J.wy,3);
      V.job=null;
      if(!MILE.fell){ MILE.fell=1; logEvent('life','Marta felled her first tree. Logs lie in the grass.'); }
    }
  }else if(J.kind==='haul'){
    const it=items.find(e=>e.id===J.id);
    if(!it){ V.job=null; return; }
    if(J.phase===0){
      V.act='walk'; V.actLabel='going to the log';
      if(vMoveTo(it.x,it.y,dtH)){ J.phase=1; J.t=0; }
    }else if(J.phase===1){
      V.act='haul'; V.actLabel='lifting the log'; J.t+=dtH;
      if(J.t>=0.25){
        const k=items.indexOf(it); if(k>=0) items.splice(k,1);
        V.carry.push(it.type); J.phase=2;
        if(V.carry.length>=V.carryMax){ J.phase=2; }
      }
    }else{
      V.act='haul'; V.actLabel='hauling logs to the pile';
      const p=BUILD.pile;
      if(at(p.wx,p.wy)){ V.inv.log+=V.carry.length; V.carry=[]; V.job=null;
        if(!MILE.haul&&V.inv.log>0){ MILE.haul=1; logEvent('life','The woodpile grows. Marta is stockpiling timber.'); } }
    }
  }else if(J.kind==='saw'){
    const b=BUILD.bench;
    if(Math.hypot(V.x-b.wx*CS,V.y-b.wy*CS)>1.7*CS){ V.act='walk'; V.actLabel='going to the workbench'; at(b.wx,b.wy); return; }
    if(V.inv.log<=0){ V.job=null; return; }
    V.act='saw'; V.actLabel='sawing timber'; J.t+=dtH;
    while(J.t>=1&&V.inv.log>0){ J.t-=1; V.inv.log--; V.inv.timber+=2; }
    if(!MILE.saw&&V.inv.timber>0){ MILE.saw=1; logEvent('life','First planks sawn at the workbench.'); }
  }else if(J.kind==='build'){
    const b=BUILD.bench;
    if(V.inv.timber<4){ V.job=null; return; }
    if(Math.hypot(V.x-b.wx*CS,V.y-b.wy*CS)>1.7*CS){ V.act='walk'; V.actLabel='going to the workbench'; at(b.wx,b.wy); return; }
    V.act='build'; V.actLabel='building the table'; J.t+=dtH;
    if(J.t>=6){
      V.inv.timber-=4; V.inv.table++; V.job=null;
      logEvent('life','Marta finished a table \u2014 the first thing ever made in this world.');
    }
  }else if(J.kind==='forage'){
    const {c,i}=cellChunk(J.wx,J.wy);
    if(c.bush[i]<0.3){ V.job=null; return; }
    if(Math.hypot(V.x-J.wx*CS,V.y-J.wy*CS)>1.4*CS){ V.act='walk'; V.actLabel='looking for berries'; at(J.wx,J.wy); return; }
    V.act='forage'; V.actLabel='picking berries'; J.t+=dtH;
    if(J.t>=0.5){ c.bush[i]=0; V.inv.berries+=3; V.job=null; }
  }else if(J.kind==='eat'){
    V.act='eat'; V.actLabel='eating'; J.t+=dtH;
    if(J.t>=0.25){
      if(V.inv.food>0){ V.inv.food--; V.hunger=1; }
      else if(V.inv.berries>=2){ V.inv.berries-=2; V.hunger=1; }
      V.job=null;
    }
  }else if(J.kind==='sleep'){
    const h=BUILD.hut, hx=(h.wx+1)*CS, hy=(h.wy+0.5)*CS;
    if(Math.hypot(V.x-hx,V.y-hy)>1.6*CS){ V.act='walk'; V.actLabel='going home to rest'; vMoveTo(hx,hy,dtH); return; }
    V.act='sleep'; V.actLabel='sleeping';
    if(V.energy>=1) V.job=null;
  }else if(J.kind==='rest'){
    V.act='rest'; V.actLabel='resting'; J.t+=dtH;
    if(J.t>=1||V.energy>=1) V.job=null;
  }else{ V.job=null; }
}

/* ---- her senses + the mind link ---- */
function validCell(wx,wy){
  const {c}=cellChunk(wx,wy); return c.h[cellChunk(wx,wy).i]>=SEA;
}
window.NV={
  snap(){
    const wx=Math.round(V.x/CS), wy=Math.round(V.y/CS);
    const {c,i}=cellChunk(wx,wy);
    const trees=[];
    outer: for(let r=4;r<=70;r+=4)for(let a=0;a<16;a++){
      const tx=wx+Math.round(Math.cos(a/16*6.283)*r), ty=wy+Math.round(Math.sin(a/16*6.283)*r);
      const cc=cellChunk(tx,ty);
      if(cc.c.tStage[cc.i]>=2.5&&cc.c.burn[cc.i]<=0) trees.push({wx:tx,wy:ty,st:+cc.c.tStage[cc.i].toFixed(1),d:r});
      if(trees.length>=14) break outer;
    }
    const bushes=[];
    outer2: for(let r=4;r<=70;r+=6)for(let a=0;a<12;a++){
      const tx=wx+Math.round(Math.cos(a/12*6.283)*r), ty=wy+Math.round(Math.sin(a/12*6.283)*r);
      const cc=cellChunk(tx,ty);
      if(cc.c.bush[cc.i]>0.5) bushes.push({wx:tx,wy:ty,d:r});
      if(bushes.length>=8) break outer2;
    }
    const p=BUILD.pile;
    return {
      day:+W.day.toFixed(1), tod:+W.tod.toFixed(2), season:SEASONS[seasonIdx()],
      weather:{temp:+c.temp[i].toFixed(1), rain:c.rain[i]>0.05, storm:c.storm[i]>0,
               cloud:+c.cloud[i].toFixed(2), burning:c.burn[i]>0},
      me:{wx,wy,hunger:+V.hunger.toFixed(2),energy:+V.energy.toFixed(2),hp:+V.hp.toFixed(2),
          act:V.act,doing:V.actLabel,inv:Object.assign({},V.inv),
          carrying:V.carry.slice(),carryMax:V.carryMax,thought:V.thought},
      home:{hut:{wx:BUILD.hut.wx+1,wy:BUILD.hut.wy},bench:{wx:BUILD.bench.wx,wy:BUILD.bench.wy},
            pile:{wx:p.wx,wy:p.wy},crate:{wx:BUILD.crate.wx,wy:BUILD.crate.wy}},
      see:{trees,bushes,logs:items.map(e=>({id:e.id,d:+Math.hypot(e.x-V.x,e.y-V.y)/CS|0}))},
      job:V.job?{kind:V.job.kind,t:+(V.job.t||0).toFixed(2),phase:V.job.phase||0}:null
    };
  },
  order(o){
    if(!o||typeof o.verb!=='string') return 'no verb given';
    const v=o.verb, same=(k,f)=>V.job&&V.job.kind===k&&(!f||f());
    if(v==='wait') return 'waiting';
    if(v==='goto'){
      if(typeof o.wx!=='number'||typeof o.wy!=='number') return 'goto needs wx,wy';
      if(same('goto',()=>V.job.wx===o.wx&&V.job.wy===o.wy)) return 'already going there';
      V.job={kind:'goto',wx:Math.round(o.wx),wy:Math.round(o.wy),label:o.label||'walking'};
      return 'ok';
    }
    if(v==='fell'){
      const {c,i}=cellChunk(o.wx,o.wy);
      if(!(c.h[i]>=SEA)) return 'that is water';
      if(c.tStage[i]<2.5) return 'no mature tree there';
      if(same('fell',()=>V.job.wx===o.wx&&V.job.wy===o.wy)) return 'already felling it';
      V.job={kind:'fell',wx:o.wx,wy:o.wy,phase:0,t:0}; return 'ok';
    }
    if(v==='haul'){
      const it=items.find(e=>e.id===o.id);
      if(!it) return 'no such log';
      if(V.carry.length>=V.carryMax) return 'hands full — drop these first';
      V.job={kind:'haul',id:o.id,phase:0,t:0}; return 'ok';
    }
    if(v==='saw'){
      if(V.inv.log<=0) return 'no logs to saw';
      if(same('saw')) return 'already sawing';
      V.job={kind:'saw',t:0}; return 'ok';
    }
    if(v==='build'){
      if(V.inv.timber<4) return 'need 4 timber to build the table';
      if(same('build')) return 'already building';
      V.job={kind:'build',t:0}; return 'ok';
    }
    if(v==='forage'){
      const {c,i}=cellChunk(o.wx,o.wy);
      if(c.bush[i]<0.3) return 'no berries there';
      if(same('forage',()=>V.job.wx===o.wx&&V.job.wy===o.wy)) return 'already picking there';
      V.job={kind:'forage',wx:o.wx,wy:o.wy,t:0}; return 'ok';
    }
    if(v==='eat'){
      if(V.inv.food<=0&&V.inv.berries<2) return 'nothing to eat';
      V.job={kind:'eat',t:0}; return 'ok';
    }
    if(v==='sleep'){ if(same('sleep')) return 'already sleeping'; V.job={kind:'sleep'}; return 'ok'; }
    if(v==='rest'){ if(same('rest')) return 'already resting'; V.job={kind:'rest',t:0}; return 'ok'; }
    return 'unknown verb '+v;
  },
  say(t){
    V.thought=String(t).slice(0,220);
    const el=document.getElementById('mThought');
    if(el) el.textContent='\u201c'+V.thought+'\u201d';
  }
};

/* ---------------- input: pan / zoom / inspect ---------------- */''')

# ---- G. simTick hook ----
rep("""  if(flash>0) flash-=dtH/3;
  else if(stormCells>0&&Math.random()<0.06) flash=0.5;
  return {rainCells,stormCells,treeCount,fireCount};""",
"""  if(flash>0) flash-=dtH/3;
  else if(stormCells>0&&Math.random()<0.06) flash=0.5;
  villagerTick(dtH);
  return {rainCells,stormCells,treeCount,fireCount};""")

# ---- H. settlement rendering (before night overlay) ----
rep("""  // lightning flash
  if(flash>0){ ctx.fillStyle=`rgba(220,230,255,""",
r'''  // ---- settlement ----
  if(SETTLE.founded){
    const bx=wx0-2, bx1=wx1+2, by=wy0-2, by1=wy1+2;
    const inView=(wx,wy)=>wx>=bx&&wx<=bx1&&wy>=by&&wy<=by1;
    const R=(wx,wy,w,h,fill)=>{ const p=w2s(wx*CS,wy*CS);
      ctx.fillStyle=fill; ctx.fillRect(p.x,p.y,w*cs,h*cs); };
    // berry bushes
    for(let wy=wy0;wy<=wy1;wy++)for(let wx=wx0;wx<=wx1;wx++){
      const {c,i}=cellChunk(wx,wy);
      if(c.bush[i]>0.5&&c.tStage[i]<1){
        const p=w2s(wx*CS,wy*CS), cxp=p.x+cs/2, cyp=p.y+cs/2;
        ctx.fillStyle='#2d5a2d';
        ctx.beginPath(); ctx.arc(cxp,cyp,cs*0.32,0,7); ctx.fill();
        ctx.fillStyle='#c04040';
        for(let k=0;k<3;k++){
          const a=k*2.1+wx;
          ctx.beginPath(); ctx.arc(cxp+Math.cos(a)*cs*0.16,cyp+Math.sin(a)*cs*0.16,Math.max(1,cs*0.05),0,7); ctx.fill();
        }
      }
    }
    // ground items (logs)
    for(const e of items){
      if(e.x<wx0*CS||e.x>wx1*CS||e.y<wy0*CS||e.y>wy1*CS) continue;
      const p=w2s(e.x,e.y);
      ctx.fillStyle='#7a5a38'; ctx.fillRect(p.x-cs*0.3,p.y-cs*0.1,cs*0.6,cs*0.2);
      ctx.fillStyle='#c8a06a'; ctx.fillRect(p.x+cs*0.22,p.y-cs*0.1,cs*0.08,cs*0.2);
    }
    // hut
    if(inView(BUILD.hut.wx,BUILD.hut.wy)){
      R(BUILD.hut.wx,BUILD.hut.wy,3,2,'#8a6a48');
      R(BUILD.hut.wx,BUILD.hut.wy,3,0.7,'#5a4028');
      const p=w2s((BUILD.hut.wx+1.5)*CS,(BUILD.hut.wy+1.4)*CS);
      ctx.fillStyle='#2a1c10'; ctx.fillRect(p.x-cs*0.2,p.y-cs*0.3,cs*0.4,cs*0.6);
    }
    // workbench
    if(inView(BUILD.bench.wx,BUILD.bench.wy)){
      R(BUILD.bench.wx,BUILD.bench.wy,1,1,'#9a7a50');
      const p=w2s(BUILD.bench.wx*CS,BUILD.bench.wy*CS);
      ctx.fillStyle='#6a4f30'; ctx.fillRect(p.x+cs*0.1,p.y+cs*0.35,cs*0.8,cs*0.12);
    }
    // woodpile (grows with stored logs)
    if(inView(BUILD.pile.wx,BUILD.pile.wy)){
      const n=Math.min(12,V.inv.log+V.carry.length);
      for(let k=0;k<n;k++){
        const p=w2s((BUILD.pile.wx+(k%6)*0.32)*CS,(BUILD.pile.wy+Math.floor(k/6)*0.32)*CS);
        ctx.fillStyle='#7a5a38';
        ctx.beginPath(); ctx.arc(p.x+cs*0.16,p.y+cs*0.16,cs*0.14,0,7); ctx.fill();
        ctx.fillStyle='#c8a06a';
        ctx.beginPath(); ctx.arc(p.x+cs*0.16,p.y+cs*0.16,cs*0.06,0,7); ctx.fill();
      }
    }
    // food crate
    if(inView(BUILD.crate.wx,BUILD.crate.wy)) R(BUILD.crate.wx,BUILD.crate.wy,1,1,'#a08050');
    // Marta herself
    {
      const p=w2s(V.x,V.y), u=cam.zoom, cxp=p.x, cyp=p.y;
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(cxp,cyp+6*u,7*u,2.6*u,0,0,7); ctx.fill();
      ctx.fillStyle='#3a5a8a';                                   // dress
      ctx.fillRect(cxp-4*u,cyp-4*u,8*u,10*u);
      ctx.fillStyle='#e8b88a';                                   // head
      ctx.beginPath(); ctx.arc(cxp,cyp-8*u,4.4*u,0,7); ctx.fill();
      ctx.fillStyle='#c8a04a';                                   // straw hat
      ctx.beginPath(); ctx.ellipse(cxp,cyp-9*u,7*u,2.6*u,0,0,7); ctx.fill();
      ctx.fillStyle='#a07830';
      ctx.beginPath(); ctx.arc(cxp,cyp-10*u,3.4*u,0,7); ctx.fill();
      if(V.act==='sleep'){                                        // "z" when asleep
        ctx.fillStyle='#dfe6f2'; ctx.font=`${10*u}px sans-serif`;
        ctx.fillText('z',cxp+8*u,cyp-14*u);
      }
    }
  }
  // lightning flash''')

# ---- I. HUD: marta panel ----
rep("""const clockEl=document.getElementById('clock'), wxEl=document.getElementById('wx'),
      statsEl=document.getElementById('stats'), fpsEl=document.getElementById('fps');""",
"""const clockEl=document.getElementById('clock'), wxEl=document.getElementById('wx'),
      statsEl=document.getElementById('stats'), fpsEl=document.getElementById('fps');
const mThoughtEl=document.getElementById('mThought'), mStatsEl=document.getElementById('mStats');
function renderMarta(){
  if(!SETTLE.founded){ mStatsEl.textContent='—'; return; }
  const bars=b=>{ const f=Math.round(clamp(b,0,1)*8); return '█'.repeat(f)+'░'.repeat(8-f); };
  mStatsEl.innerHTML=
    'doing <b>'+V.actLabel+'</b><br>'+
    'hunger <b>'+bars(V.hunger)+'</b> energy <b>'+bars(V.energy)+'</b><br>'+
    'logs <b>'+V.inv.log+'</b> · timber <b>'+V.inv.timber+'</b> · tables <b>'+V.inv.table+'</b><br>'+
    'food <b>'+V.inv.food+'</b> · berries <b>'+V.inv.berries+'</b> · carrying <b>'+V.carry.length+'</b>';
}""")
rep("  statsEl.innerHTML=",
    "  renderMarta();\n  statsEl.innerHTML=")

# ---- J. genesis: named findSpawn + settlement; bNew resets ----
rep("""(function findSpawn(){ // start the camera on pleasant land, not mid-ocean
  for(let r=0;r<400;r+=8)for(let a=0;a<12;a++){
    const wx=Math.round(Math.cos(a/12*6.283)*r), wy=Math.round(Math.sin(a/12*6.283)*r);
    const {c,i}=cellChunk(wx,wy);
    if(c.h[i]>0.40&&c.h[i]<0.60){ cam.x=wx*CS; cam.y=wy*CS; return; }
  }
})();""",
"""function findSpawn(){ // start the camera on pleasant land, not mid-ocean
  for(let r=0;r<400;r+=8)for(let a=0;a<12;a++){
    const wx=Math.round(Math.cos(a/12*6.283)*r), wy=Math.round(Math.sin(a/12*6.283)*r);
    const {c,i}=cellChunk(wx,wy);
    if(c.h[i]>0.40&&c.h[i]<0.60){ cam.x=wx*CS; cam.y=wy*CS; return; }
  }
}
findSpawn();
SETTLE.wx=Math.round(cam.x/CS); SETTLE.wy=Math.round(cam.y/CS);
foundSettlement();""")
rep("""  logEl.innerHTML=''; W.day=1; W.tod=8; W.dryDays=0; W.logCount=0;""",
"""  logEl.innerHTML=''; W.day=1; W.tod=8; W.dryDays=0; W.logCount=0;
  findSpawn();
  SETTLE.wx=Math.round(cam.x/CS); SETTLE.wy=Math.round(cam.y/CS);
  SETTLE.founded=false; foundSettlement(); resetVillager();""")

open('/home/hatch/workspace/world-sim/natura-v3.html','w').write(src)
print('v3 written, bytes:', len(src))
import re as _re
js = src[src.index('<script>')+8:src.index('</script>')]
print('braces:', js.count('{')-js.count('}'), 'parens:', js.count('(')-js.count(')'))
