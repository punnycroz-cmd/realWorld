#!/usr/bin/env python3
"""natura-v3.html -> natura-v4.html : two villagers, speech, bonding, children, skills, craft."""
import sys

src = open('/home/hatch/workspace/world-sim/natura-v3.html').read()

def rep_span(start_marker, end_marker, new_text):
    """Replace everything from start_marker up to (not incl.) end_marker."""
    global src
    a = src.index(start_marker)
    b = src.index(end_marker)
    assert a < b, 'markers out of order'
    src = src[:a] + new_text + src[b:]

# ============ R1: replace the whole settlement/villager/NV block ============
V4_CORE = r'''/* ---------------- souls: villagers, children, designs ---------------- */
const SETTLE={wx:0,wy:0,founded:false};
const BUILD={huts:[],bench:null,pile:null,crate:null};
const items=[]; let itemSeq=1;                 // ground items: {id,type:'log',x,y}
const BUSHSPOTS=[];
const villagers=[]; let vSeq=1;
const children=[]; let childSeq=1;
const DESIGNS={
  table:{name:'table',timber:4,hours:6,sprite:null,by:'Marta',made:true},
};
const MILE={};

function addVillager(name,sex,age,x,y,colors,skills){
  const v={id:vSeq++,name,sex,age,x,y,hunger:1,energy:1,hp:1,
    inv:{log:0,timber:0,table:0,chair:0,berries:0,food:sex==='F'?8:6},
    skills:Object.assign({fell:0.25,saw:0.25,build:0.25,forage:0.35},skills||{}),
    carry:[],carryMax:2,act:'idle',actLabel:'taking in the land',job:null,
    thought:'\u2026',heard:[],partner:null,bond:{id:0,until:0},pregnant:0,childIds:[],
    lastResult:null,colors};
  villagers.push(v); return v;
}
function vByName(n){ return villagers.find(v=>v.name===n); }
function vById(id){ return villagers.find(v=>v.id===id); }

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
  BUILD.huts=[{wx:sx-3,wy:sy-2,w:3,h:2}];
  BUILD.bench={wx:sx+2,wy:sy-1,w:1,h:1};
  BUILD.pile={wx:sx+2,wy:sy+2,w:2,h:1};
  BUILD.crate={wx:sx-3,wy:sy+2,w:1,h:1};
  let placed=0, guard=0;
  while(placed<44&&guard++<6000){
    const a=hash2(guard,placed,SEED+700)*Math.PI*2;
    const r=18+hash2(placed,guard,SEED+701)*42;
    const wx=Math.round(sx+Math.cos(a)*r), wy=Math.round(sy+Math.sin(a)*r);
    const {c,i}=cellChunk(wx,wy);
    if(c.h[i]>=SEA+0.02&&c.h[i]<0.72&&c.tStage[i]<1&&c.bush[i]<0.5){ c.bush[i]=1; BUSHSPOTS.push({wx,wy}); placed++; }
  }
  addVillager('Marta','F',34,(sx-1)*CS,(sy+1)*CS,
    {dress:'#3a5a8a',skin:'#e8b88a',hat:'#c8a04a',hair:'#5a3a22'});
  SETTLE.founded=true;
  logEvent('life','A settler raises a hut on the green. Her name is Marta.');
}
function spawnTomas(){
  // he walks in from the hills, 25 cells out
  const sx=SETTLE.wx, sy=SETTLE.wy;
  const a=hash2(7,7,SEED+730)*Math.PI*2;
  let wx=sx+Math.round(Math.cos(a)*25), wy=sy+Math.round(Math.sin(a)*25);
  const {c}=cellChunk(wx,wy);
  if(!(c.h[cellChunk(wx,wy).i]>=SEA)){ wx=sx+18; wy=sy; }
  const t=addVillager('Tomas','M',35,wx*CS,wy*CS,
    {dress:'#4a6a3a',skin:'#d8a878',hat:null,hair:'#3a2a1a'},
    {fell:0.35,saw:0.3,build:0.35,forage:0.3});
  t.job={kind:'goto',wx:sx,wy:sy,label:'walking into the valley'};
  logEvent('life','A traveler walks in from the hills. His name is Tomas.');
}
function resetSouls(){
  villagers.length=0; children.length=0; items.length=0; BUSHSPOTS.length=0;
  BUILD.huts=[]; BUILD.bench=null; BUILD.pile=null; BUILD.crate=null;
  for(const k in DESIGNS) if(k!=='table') delete DESIGNS[k];
  DESIGNS.table={name:'table',timber:4,hours:6,sprite:null,by:'Marta',made:true};
  for(const k in MILE) delete MILE[k];
  vSeq=1; childSeq=1;
}

/* ---- bodies: needs, movement, jobs ---- */
function vMoveTo(v,tx,ty,dtH){
  const dx=tx-v.x, dy=ty-v.y, d=Math.hypot(dx,dy);
  const step=v.speed()*dtH*(v.energy<0.2?0.55:1);
  if(d<=step){ v.x=tx; v.y=ty; return true; }
  v.x+=dx/d*step; v.y+=dy/d*step; return false;
}
function dropLogs(wx,wy,n){
  for(let k=0;k<n;k++)
    items.push({id:itemSeq++,type:'log',
      x:(wx+(hash2(itemSeq,k,SEED+720)-0.5)*2)*CS,
      y:(wy+(hash2(k,itemSeq,SEED+721)-0.5)*2)*CS});
}
function gainSkill(v,k,amt){ v.skills[k]=clamp(v.skills[k]+(amt||0.04)*(v.age<14?2:1),0,1); }

function villagerTick(dtH){
  if(!SETTLE.founded) return;
  for(const ch of activeList)for(let i=0;i<256;i++)
    if(ch.bush[i]>0&&ch.bush[i]<1) ch.bush[i]=Math.min(1,ch.bush[i]+dtH/72);
  for(const v of villagers) soulTick(v,dtH);
  for(const ch of children) childTick(ch,dtH);
  // mutual bonding -> the chance of a child
  const nowH=W.day*24+W.tod;
  for(const a of villagers){
    if(!a.bond.id) continue;
    const b=vById(a.bond.id);
    if(b&&b.bond.id===a.id&&nowH<b.bond.until&&b.age>=18&&a.age>=18){
      a.bond.id=0; b.bond.id=0;
      a.actLabel='holding '+b.name; b.actLabel='holding '+a.name;
      a.partner=b.name; b.partner=a.name;
      const f=a.sex==='F'?a:b;
      if(f.pregnant<=0&&f.age<=42&&a.hp>0.4&&b.hp>0.4&&Math.random()<0.5){
        f.pregnant=270;
        f.lastResult={kind:'bond',note:'something has changed'};
      }
    } else if(nowH>=a.bond.until){ a.bond.id=0; }
  }
}

function soulTick(v,dtH){
  v.speed=()=>70*(v.age<14?0.55:1);
  const sleeping=v.job&&v.job.kind==='sleep', resting=v.job&&v.job.kind==='rest';
  const working=v.job&&!sleeping&&!resting;
  const drain=v.age<6?48:96;
  v.hunger=clamp(v.hunger-dtH/drain*(v.pregnant>0?1.35:1),0,1);
  v.energy=clamp(v.energy+(sleeping?dtH/6:resting?dtH/10:working?-dtH/26:-dtH/48),0,1);
  // aging and the long decline
  v.age+=dtH/8760;
  const maxHp=v.age>70?Math.max(0.08,1-(v.age-70)*0.12):1;
  v.hp=clamp(v.hp+(v.hunger<=0?-dtH/60:v.hunger>0.3?dtH/120:0),0.05,1);
  v.hp=Math.min(v.hp,maxHp);
  if(v.hp<=0.06&&(v.age>70||v.hunger<=0)){
    logEvent('life',v.name+' has died at '+Math.floor(v.age)+'. The valley keeps the bones.');
    const k=villagers.indexOf(v); if(k>=0) villagers.splice(k,1);
    return;
  }
  if(v.pregnant>0){
    v.pregnant-=dtH/24;
    if(v.pregnant<=0){ v.pregnant=0; giveBirth(v); }
  }
  // old messages fade
  v.heard=v.heard.filter(m=>W.day-m.day<3);
  const J=v.job;
  if(!J){
    v.act='idle';
    v.actLabel=v.pregnant>0?'resting, hand on her belly':
      v.hunger<0.25?'stomach growling':v.energy<0.25?'weary':'taking in the land';
    return;
  }
  const at=(wx,wy)=>vMoveTo(v,wx*CS,wy*CS,dtH);
  const near=(wx,wy,r)=>Math.hypot(v.x-wx*CS,v.y-wy*CS)<=(r||1.7)*CS;
  if(J.kind==='goto'){
    v.act='walk'; v.actLabel=J.label||'walking';
    if(at(J.wx,J.wy)) v.job=null;
  }else if(J.kind==='fell'){
    const {c,i}=cellChunk(J.wx,J.wy);
    if(c.tStage[i]<2.5){ v.job=null; return; }
    if(!near(J.wx,J.wy)){ v.act='walk'; v.actLabel='going to the tree'; at(J.wx,J.wy); return; }
    v.act='fell'; v.actLabel='felling the tree';
    J.t+=dtH*(v.energy<0.15?0.5:1);
    const need=2.5*(1.7-v.skills.fell);
    if(J.t>=need){
      c.tStage[i]=0; c.tHp[i]=0; c.snag[i]=0;
      const bad=Math.random()>v.skills.fell+0.25;      // it falls badly
      dropLogs(J.wx,J.wy,bad?2:(Math.random()<v.skills.fell?3:2));
      gainSkill(v,'fell');
      v.job=null;
      v.lastResult={kind:'fell',note:bad?'it fell badly — only two good logs':'three good logs'};
      if(!MILE.fell){ MILE.fell=1; logEvent('life',v.name+' felled a tree. Logs lie in the grass.'); }
    }
  }else if(J.kind==='haul'){
    if(J.phase===0){
      const it0=items.find(e=>e.id===J.id);
      if(!it0){ v.job=null; return; }
      v.act='walk'; v.actLabel='going to the log';
      if(vMoveTo(v,it0.x,it0.y,dtH)){ J.phase=1; J.t=0; }
    }else if(J.phase===1){
      v.act='haul'; v.actLabel='lifting the log'; J.t+=dtH;
      if(J.t>=0.25){
        const it=items.find(e=>e.id===J.id);
        if(it){ const k=items.indexOf(it); if(k>=0) items.splice(k,1); v.carry.push(it.type); }
        J.phase=2;
      }
    }else{
      v.act='haul'; v.actLabel='hauling logs to the pile';
      const p=BUILD.pile;
      if(at(p.wx,p.wy)){ v.inv.log+=v.carry.length; v.carry=[]; v.job=null;
        if(!MILE.haul&&v.inv.log>0){ MILE.haul=1; logEvent('life','The woodpile grows. '+v.name+' is stockpiling timber.'); } }
    }
  }else if(J.kind==='saw'){
    const b=BUILD.bench;
    if(!near(b.wx,b.wy)){ v.act='walk'; v.actLabel='going to the workbench'; at(b.wx,b.wy); return; }
    if(v.inv.log<=0){ v.job=null; return; }
    v.act='saw'; v.actLabel='sawing timber'; J.t+=dtH*(0.7+v.skills.saw*0.6);
    let n=0;
    while(J.t>=1&&v.inv.log>0){ J.t-=1; v.inv.log--; v.inv.timber+=2; n++; }
    if(n>0) gainSkill(v,'saw');
    if(!MILE.saw&&v.inv.timber>0){ MILE.saw=1; logEvent('life','First planks sawn at the workbench.'); }
  }else if(J.kind==='craft'){
    const d=DESIGNS[J.design];
    if(!d){ v.job=null; return; }
    if(v.inv.timber<d.timber){ v.job=null; v.lastResult={kind:'craft',note:'not enough timber'}; return; }
    const b=BUILD.bench;
    if(!near(b.wx,b.wy)){ v.act='walk'; v.actLabel='going to the workbench'; at(b.wx,b.wy); return; }
    v.act='build'; v.actLabel='making a '+d.name; J.t+=dtH*(0.7+v.skills.build*0.6);
    if(J.t>=d.hours){
      v.inv.timber-=d.timber;
      const s=v.skills.build, r=Math.random(), isNew=!d.made;
      let q;
      if(isNew&&r<0.20*(1-s)){           // the first attempt can truly fail
        q='failed'; v.inv.timber+=Math.floor(d.timber/2);
      }else if(s+r*0.5<0.38) q='crude';
      else if(s+r*0.5<0.85) q='sturdy';
      else q='fine';
      d.made=true; gainSkill(v,'build',0.06);
      v.job=null;
      if(q==='failed'){
        v.lastResult={kind:'craft',design:J.design,quality:'failed',
          note:'it collapsed — salvaged half the timber'};
        logEvent('life',v.name+' tried to make a '+d.name+' and it fell apart. The wood is salvaged.');
      }else{
        const key=J.design+(q==='crude'?'_crude':'');
        v.inv[key]=(v.inv[key]||0)+1;
        v.lastResult={kind:'craft',design:J.design,quality:q,
          note:q==='crude'?'it stands, barely — a wobbly '+d.name:
               q==='fine'?'a fine '+d.name+', better than the design':'a sturdy '+d.name};
        if(!MILE['craft_'+J.design]){
          MILE['craft_'+J.design]=1;
          logEvent('life',v.name+' made a '+q+' '+d.name+' — the first of its kind in this world.');
        }
      }
    }
  }else if(J.kind==='build_hut'){
    if(v.inv.timber<10){ v.job=null; v.lastResult={kind:'hut',note:'need 10 timber'}; return; }
    if(!near(J.wx,J.wy,2.5)){ v.act='walk'; v.actLabel='going to the building site'; at(J.wx,J.wy); return; }
    v.act='build'; v.actLabel='raising a hut'; J.t+=dtH*(0.7+v.skills.build*0.6);
    if(J.t>=20){
      v.inv.timber-=10;
      BUILD.huts.push({wx:J.wx,wy:J.wy,w:3,h:2});
      gainSkill(v,'build',0.08); v.job=null;
      v.lastResult={kind:'hut',note:'the hut stands'};
      logEvent('life',v.name+' raised a new hut. The settlement grows.');
    }
  }else if(J.kind==='forage'){
    const {c,i}=cellChunk(J.wx,J.wy);
    if(c.bush[i]<0.3){ v.job=null; return; }
    if(!near(J.wx,J.wy,1.4)){ v.act='walk'; v.actLabel='looking for berries'; at(J.wx,J.wy); return; }
    v.act='forage'; v.actLabel='picking berries'; J.t+=dtH;
    if(J.t>=0.5){ c.bush[i]=0; v.inv.berries+=3; gainSkill(v,'forage'); v.job=null; }
  }else if(J.kind==='eat'){
    v.act='eat'; v.actLabel='eating'; J.t+=dtH;
    if(J.t>=0.25){
      if(v.inv.food>0){ v.inv.food--; v.hunger=1; }
      else if(v.inv.berries>=2){ v.inv.berries-=2; v.hunger=1; }
      v.job=null;
    }
  }else if(J.kind==='sleep'){
    const h=BUILD.huts[0], hx=(h.wx+1)*CS, hy=(h.wy+0.5)*CS;
    if(Math.hypot(v.x-hx,v.y-hy)>1.6*CS){ v.act='walk'; v.actLabel='going home to rest'; vMoveTo(v,hx,hy,dtH); return; }
    v.act='sleep'; v.actLabel='sleeping';
    if(v.energy>=1) v.job=null;
  }else if(J.kind==='rest'){
    v.act='rest'; v.actLabel='resting'; J.t+=dtH;
    if(J.t>=1||v.energy>=1) v.job=null;
  }else if(J.kind==='give'){
    const t=vById(J.to);
    if(!t){ v.job=null; return; }
    if(Math.hypot(v.x-t.x,v.y-t.y)>2.5*CS){ v.act='walk'; v.actLabel='going to '+t.name; vMoveTo(v,t.x,t.y,dtH); return; }
    const n=Math.min(J.n,v.inv[J.item]||0);
    if(n>0){ v.inv[J.item]-=n; t.inv[J.item]=(t.inv[J.item]||0)+n;
      t.heard.push({from:v.name,text:'gave you '+n+' '+J.item,day:W.day}); }
    v.job=null;
    v.lastResult={kind:'give',note:n>0?'gave '+n+' '+J.item+' to '+t.name:'nothing to give'};
  }else if(J.kind==='say_to'){
    const t=vById(J.to);
    if(t){ t.heard.push({from:v.name,text:J.text.slice(0,140),day:W.day});
      if(t.heard.length>6) t.heard.shift(); }
    v.thought=J.text.slice(0,140); v.job=null;
  }else if(J.kind==='bond'){
    const t=vById(J.with);
    if(!t){ v.job=null; return; }
    if(Math.hypot(v.x-t.x,v.y-t.y)>2*CS){ v.act='walk'; v.actLabel='going to '+t.name; vMoveTo(v,t.x,t.y,dtH); return; }
    v.act='bond'; v.actLabel='with '+t.name; v.bond={id:t.id,until:W.day*24+W.tod+8}; v.job=null;
  }else if(J.kind==='name_baby'){
    const ch=children.find(c=>c.motherId===v.id&&!c.name);
    if(ch){ ch.name=J.name.slice(0,24); v.job=null;
      logEvent('life',ch.name+' is named. The valley learns a new word.'); }
    else v.job=null;
  }else{ v.job=null; }
}

/* ---- children ---- */
function giveBirth(mother){
  const father=mother.partner?vByName(mother.partner):null;
  const ch={id:childSeq++,name:null,sex:Math.random()<0.5?'F':'M',age:0,
    x:mother.x,y:mother.y,hunger:1,energy:1,hp:1,
    motherId:mother.id,fatherId:father?father.id:0,
    colors:{dress:mother.colors.dress,skin:mother.colors.skin,hat:null,
      hair:father?father.colors.hair:mother.colors.hair}};
  children.push(ch); mother.childIds.push(ch.id);
  mother.lastResult={kind:'birth',note:'a child is born — name it'};
  logEvent('life','A child is born to '+mother.name+(father?' and '+father.name:'')+'.');
}
function childTick(ch,dtH){
  ch.age+=dtH/8760;
  ch.hunger=clamp(ch.hunger-dtH/30,0,1);
  ch.hp=clamp(ch.hp+(ch.hunger<=0?-dtH/48:dtH/120),0.05,1);
  const m=vById(ch.motherId);
  if(ch.age<2){ // babe in arms
    if(m){ ch.x=m.x; ch.y=m.y;
      if(ch.hunger<0.45&&m.inv.food>0){ m.inv.food--; ch.hunger=1; } }
    return;
  }
  if(ch.age>=14){ // grown: becomes a soul
    const v=addVillager(ch.name||'Nameless',ch.sex,14,ch.x,ch.y,ch.colors,{fell:0.3,saw:0.3,build:0.3,forage:0.4});
    v.inv.food=4;
    const k=children.indexOf(ch); if(k>=0) children.splice(k,1);
    logEvent('life',v.name+' is grown — a new adult in the valley.');
    return;
  }
  // toddler/child: stays near mother, nibbles what she's given
  if(m){
    const d=Math.hypot(ch.x-m.x,ch.y-m.y);
    if(d>3*CS){ const s=40*dtH; ch.x+=(m.x-ch.x)/d*s; ch.y+=(m.y-ch.y)/d*s; }
    if(ch.hunger<0.4&&m.inv.berries>0){ m.inv.berries--; ch.hunger=Math.min(1,ch.hunger+0.5); }
  }
}

/* ---- the mind link: one body per name ---- */
function snapFor(v){
  const wx=Math.round(v.x/CS), wy=Math.round(v.y/CS);
  const {c,i}=cellChunk(wx,wy);
  const trees=[];
  outer: for(let r=4;r<=70;r+=4)for(let a=0;a<16;a++){
    const tx=wx+Math.round(Math.cos(a/16*6.283)*r), ty=wy+Math.round(Math.sin(a/16*6.283)*r);
    const cc=cellChunk(tx,ty);
    if(cc.c.tStage[cc.i]>=2.5&&cc.c.burn[cc.i]<=0) trees.push({wx:tx,wy:ty,st:+cc.c.tStage[cc.i].toFixed(1),d:r});
    if(trees.length>=14) break outer;
  }
  const bushes=[];
  for(const s of BUSHSPOTS){
    const cc=cellChunk(s.wx,s.wy);
    if(cc.c.bush[cc.i]>0.5){
      const d=Math.round(Math.hypot(s.wx-wx,s.wy-wy));
      if(d<=90) bushes.push({wx:s.wx,wy:s.wy,d});
    }
    if(bushes.length>=8) break;
  }
  bushes.sort((a,b)=>a.d-b.d);
  const designs={};
  for(const k in DESIGNS) designs[k]={name:DESIGNS[k].name,timber:DESIGNS[k].timber,hours:DESIGNS[k].hours,by:DESIGNS[k].by};
  return {
    day:+W.day.toFixed(1), tod:+W.tod.toFixed(2), season:SEASONS[seasonIdx()],
    weather:{temp:+c.temp[i].toFixed(1), rain:c.rain[i]>0.05, storm:c.storm[i]>0,
             cloud:+c.cloud[i].toFixed(2), burning:c.burn[i]>0},
    me:{name:v.name,sex:v.sex,age:+v.age.toFixed(1),wx,wy,
        hunger:+v.hunger.toFixed(2),energy:+v.energy.toFixed(2),hp:+v.hp.toFixed(2),
        act:v.act,doing:v.actLabel,inv:Object.assign({},v.inv),
        carrying:v.carry.slice(),carryMax:v.carryMax,thought:v.thought,
        skills:Object.assign({},v.skills),
        partner:v.partner,pregnant:v.pregnant>0?+v.pregnant.toFixed(0):0,
        children:v.childIds.map(id=>{const ch=children.find(c=>c.id===id);
          return ch?{name:ch.name||'unnamed',age:+ch.age.toFixed(1)}:null;}).filter(Boolean)},
    others:villagers.filter(o=>o!==v).map(o=>({name:o.name,sex:o.sex,age:Math.floor(o.age),
        wx:Math.round(o.x/CS),wy:Math.round(o.y/CS),doing:o.actLabel,
        d:Math.round(Math.hypot(o.x-v.x,o.y-v.y)/CS)})),
    littleones:children.map(ch=>({name:ch.name||'unnamed',age:+ch.age.toFixed(1),
        mother:vById(ch.motherId)?vById(ch.motherId).name:'?',
        d:Math.round(Math.hypot(ch.x-v.x,ch.y-v.y)/CS)})),
    heard:v.heard.slice(),
    home:{huts:BUILD.huts.map(h=>({wx:h.wx+1,wy:h.wy})),bench:{wx:BUILD.bench.wx,wy:BUILD.bench.wy},
          pile:{wx:BUILD.pile.wx,wy:BUILD.pile.wy},crate:{wx:BUILD.crate.wx,wy:BUILD.crate.wy}},
    see:{trees,bushes,logs:items.map(e=>({id:e.id,d:Math.round(Math.hypot(e.x-v.x,e.y-v.y)/CS)}))},
    designs,
    job:v.job?{kind:v.job.kind,t:+(v.job.t||0).toFixed(2),phase:v.job.phase||0}:null,
    birth:children.some(ch=>ch.motherId===v.id&&!ch.name),
    lastResult:v.lastResult
  };
}
window.NV={
  list(){ return villagers.map(v=>v.name); },
  snap(name){ const v=vByName(name); return v?snapFor(v):{error:'no such soul'}; },
  say(name,t){
    const v=vByName(name); if(!v) return;
    v.thought=String(t).slice(0,220);
  },
  addDesign(id,info){
    DESIGNS[id]={name:info.name||id,timber:info.timber||3,hours:info.hours||4,
      sprite:info.sprite||null,by:info.by||'?',made:false};
    if(info.sprite){
      window.__spr=window.__spr||{};
      const im=new Image();
      im.onload=()=>{ window.__spr[id]=im; };
      im.src=info.sprite;
    }
    logEvent('life','A new design is dreamed: '+DESIGNS[id].name+', by '+DESIGNS[id].by+'.');
    return 'design added: '+id;
  },
  // the visual soul of a thing is attached ONLY when someone finishes building it
  setSprite(id,url){
    if(!DESIGNS[id]) return 'no such design';
    DESIGNS[id].sprite=url; window.__spr=window.__spr||{};
    const im=new Image(); im.onload=()=>{window.__spr[id]=im;}; im.src=url;
    return 'sprite set: '+id;
  },
  pause(){ W.paused=true; return 'world sleeps'; },
  resume(){ W.paused=false; return 'world wakes'; },
  addTraveler(name,sex,age,colors,skills){
    if(vByName(name)) return name+' already here';
    const sx=SETTLE.wx, sy=SETTLE.wy;
    const a=hash2(name.length*13,age,SEED+740)*Math.PI*2;
    let wx=sx+Math.round(Math.cos(a)*25), wy=sy+Math.round(Math.sin(a)*25);
    let cc=cellChunk(wx,wy);
    if(!(cc.c.h[cc.i]>=SEA)){ wx=sx+18; wy=sy; }
    const v=addVillager(name,sex,age,wx*CS,wy*CS,colors,skills);
    v.job={kind:'goto',wx:sx,wy:sy,label:'walking into the valley'};
    logEvent('life','A traveler walks in from the hills. Their name is '+name+'.');
    return 'traveler added: '+name;
  },
  order(name,o){
    const v=vByName(name);
    if(!v) return 'no such soul';
    if(!o||typeof o.verb!=='string') return 'no verb given';
    const vb=o.verb, same=(k,f)=>v.job&&v.job.kind===k&&(!f||f());
    if(vb==='wait'){ return 'waiting'; }
    if(vb==='goto'){
      if(typeof o.wx!=='number'||typeof o.wy!=='number') return 'goto needs wx,wy';
      if(same('goto',()=>v.job.wx===o.wx&&v.job.wy===o.wy)) return 'already going there';
      v.job={kind:'goto',wx:Math.round(o.wx),wy:Math.round(o.wy),label:o.label||'walking'};
      return 'ok';
    }
    if(vb==='fell'){
      const {c,i}=cellChunk(o.wx,o.wy);
      if(!(c.h[i]>=SEA)) return 'that is water';
      if(c.tStage[i]<2.5) return 'no mature tree there';
      if(same('fell',()=>v.job.wx===o.wx&&v.job.wy===o.wy)) return 'already felling it';
      v.job={kind:'fell',wx:o.wx,wy:o.wy,t:0}; return 'ok';
    }
    if(vb==='haul'){
      const it=items.find(e=>e.id===o.id);
      if(!it) return 'no such log';
      if(v.job&&v.job.kind==='haul') return 'already hauling';
      if(v.carry.length>=v.carryMax) return 'hands full';
      v.job={kind:'haul',id:o.id,phase:0,t:0}; return 'ok';
    }
    if(vb==='saw'){
      if(v.inv.log<=0) return 'no logs to saw';
      if(same('saw')) return 'already sawing';
      v.job={kind:'saw',t:0}; return 'ok';
    }
    if(vb==='craft'){
      const d=DESIGNS[o.design];
      if(!d) return 'no such design — dream it first';
      if(v.inv.timber<d.timber) return 'need '+d.timber+' timber for a '+d.name;
      if(same('craft',()=>v.job.design===o.design)) return 'already making it';
      v.job={kind:'craft',design:o.design,t:0}; return 'ok';
    }
    if(vb==='build_hut'){
      if(v.inv.timber<10) return 'need 10 timber for a hut';
      const {c}=cellChunk(o.wx,o.wy);
      if(!(c.h[cellChunk(o.wx,o.wy).i]>=SEA)) return 'that is water';
      v.job={kind:'build_hut',wx:Math.round(o.wx),wy:Math.round(o.wy),t:0}; return 'ok';
    }
    if(vb==='forage'){
      const {c,i}=cellChunk(o.wx,o.wy);
      if(c.bush[i]<0.3) return 'no berries there';
      if(same('forage',()=>v.job.wx===o.wx&&v.job.wy===o.wy)) return 'already picking there';
      v.job={kind:'forage',wx:o.wx,wy:o.wy,t:0}; return 'ok';
    }
    if(vb==='eat'){
      if(v.inv.food<=0&&v.inv.berries<2) return 'nothing to eat';
      v.job={kind:'eat',t:0}; return 'ok';
    }
    if(vb==='sleep'){ if(same('sleep')) return 'already sleeping'; v.job={kind:'sleep'}; return 'ok'; }
    if(vb==='rest'){ if(same('rest')) return 'already resting'; v.job={kind:'rest',t:0}; return 'ok'; }
    if(vb==='give'){
      const t=vById(typeof o.to==='number'?o.to:(vByName(o.to)||{}).id);
      if(!t) return 'no such soul';
      if(!(v.inv[o.item]>0)) return 'you have no '+o.item;
      v.job={kind:'give',to:t.id,item:o.item,n:Math.min(o.n||1,9)}; return 'ok';
    }
    if(vb==='say_to'){
      const t=vByName(o.to);
      if(!t) return 'no such soul';
      if(typeof o.text!=='string'||!o.text.trim()) return 'say what?';
      v.job={kind:'say_to',to:t.id,text:o.text}; return 'ok';
    }
    if(vb==='bond'){
      const t=vByName(o.with);
      if(!t) return 'no such soul';
      if(t.age<18||v.age<18) return 'not grown';
      v.job={kind:'bond',with:t.id}; return 'ok';
    }
    if(vb==='name_baby'){
      if(!children.some(ch=>ch.motherId===v.id&&!ch.name)) return 'no unnamed child';
      if(typeof o.name!=='string'||!o.name.trim()) return 'give a name';
      v.job={kind:'name_baby',name:o.name.trim()}; return 'ok';
    }
    return 'unknown verb '+vb;
  },
  speed(s){ if(s===1||s===4||s===16||s===64) setSpeed(s); return 'speed '+W.speed; }
};

/* ---------------- input: pan / zoom / inspect ---------------- */'''

rep_span('/* ---------------- the first settlement + its first inhabitant ---------------- */',
         '/* ---------------- input: pan / zoom / inspect ---------------- */',
         V4_CORE)

# ============ R2: render block ============
V4_RENDER = r'''  // ---- settlement & souls ----
  if(SETTLE.founded){
    const bx=wx0-2, bx1=wx1+2, by=wy0-2, by1=wy1+2;
    const inView=(wx,wy)=>wx>=bx&&wx<=bx1&&wy>=by&&wy<=by1;
    const R=(wx,wy,w,h,fill)=>{ const p=w2s(wx*CS,wy*CS);
      ctx.fillStyle=fill; ctx.fillRect(p.x,p.y,w*cs,h*cs); };
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
    for(const e of items){
      if(e.x<wx0*CS||e.x>wx1*CS||e.y<wy0*CS||e.y>wy1*CS) continue;
      const p=w2s(e.x,e.y);
      ctx.fillStyle='#7a5a38'; ctx.fillRect(p.x-cs*0.3,p.y-cs*0.1,cs*0.6,cs*0.2);
      ctx.fillStyle='#c8a06a'; ctx.fillRect(p.x+cs*0.22,p.y-cs*0.1,cs*0.08,cs*0.2);
    }
    for(const h of BUILD.huts){
      if(!inView(h.wx,h.wy)) continue;
      R(h.wx,h.wy,3,2,'#8a6a48');
      R(h.wx,h.wy,3,0.7,'#5a4028');
      const p=w2s((h.wx+1.5)*CS,(h.wy+1.4)*CS);
      ctx.fillStyle='#2a1c10'; ctx.fillRect(p.x-cs*0.2,p.y-cs*0.3,cs*0.4,cs*0.6);
    }
    if(BUILD.bench&&inView(BUILD.bench.wx,BUILD.bench.wy)){
      R(BUILD.bench.wx,BUILD.bench.wy,1,1,'#9a7a50');
      const p=w2s(BUILD.bench.wx*CS,BUILD.bench.wy*CS);
      ctx.fillStyle='#6a4f30'; ctx.fillRect(p.x+cs*0.1,p.y+cs*0.35,cs*0.8,cs*0.12);
    }
    if(BUILD.pile&&inView(BUILD.pile.wx,BUILD.pile.wy)){
      const logs=villagers.reduce((n,v)=>n+v.inv.log,0);
      const n=Math.min(12,logs);
      for(let k=0;k<n;k++){
        const p=w2s((BUILD.pile.wx+(k%6)*0.32)*CS,(BUILD.pile.wy+Math.floor(k/6)*0.32)*CS);
        ctx.fillStyle='#7a5a38';
        ctx.beginPath(); ctx.arc(p.x+cs*0.16,p.y+cs*0.16,cs*0.14,0,7); ctx.fill();
        ctx.fillStyle='#c8a06a';
        ctx.beginPath(); ctx.arc(p.x+cs*0.16,p.y+cs*0.16,cs*0.06,0,7); ctx.fill();
      }
    }
    if(BUILD.crate&&inView(BUILD.crate.wx,BUILD.crate.wy)) R(BUILD.crate.wx,BUILD.crate.wy,1,1,'#a08050');
    // furniture owned, shown by the first hut
    {
      const h=BUILD.huts[0];
      if(h&&inView(h.wx,h.wy)){
        const nT=villagers.reduce((n,v)=>n+(v.inv.table||0),0);
        const nC=villagers.reduce((n,v)=>n+(v.inv.chair||0)+(v.inv.chair_crude||0),0);
        const p0=w2s((h.wx+0.4)*CS,(h.wy+2.3)*CS);
        for(let k=0;k<Math.min(4,nT);k++){
          const px=p0.x+k*cs*0.9;
          ctx.fillStyle='#7a5230'; ctx.fillRect(px,p0.y-cs*0.5,cs*0.7,cs*0.12);
          ctx.fillRect(px+cs*0.05,p0.y-cs*0.38,cs*0.1,cs*0.38);
          ctx.fillRect(px+cs*0.55,p0.y-cs*0.38,cs*0.1,cs*0.38);
        }
        for(let k=0;k<Math.min(6,nC);k++){
          const des=DESIGNS.chair, px=p0.x+k*cs*0.55, py=p0.y+cs*0.35;
          if(des&&des.sprite&&window.__spr&&window.__spr.chair){
            const im=window.__spr.chair;
            ctx.drawImage(im,px,py-cs*0.5,cs*0.5,cs*0.5);
          }else{
            ctx.fillStyle='#8a6238'; ctx.fillRect(px,py-cs*0.4,cs*0.32,cs*0.1);
            ctx.fillRect(px+cs*0.03,py-cs*0.3,cs*0.07,cs*0.3);
            ctx.fillRect(px+cs*0.22,py-cs*0.3,cs*0.07,cs*0.3);
            ctx.fillRect(px+cs*0.03,py-cs*0.55,cs*0.26,cs*0.18);
          }
        }
      }
    }
    const drawSoul=(x,y,colors,scale,label,sub)=>{
      const p=w2s(x,y), u=cam.zoom*scale, cxp=p.x, cyp=p.y;
      if(cxp<-30||cyp<-30||cxp>cw+30||cyp>chh+30) return;
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(cxp,cyp+6*u,7*u,2.6*u,0,0,7); ctx.fill();
      ctx.fillStyle=colors.dress;
      ctx.fillRect(cxp-4*u,cyp-4*u,8*u,10*u);
      ctx.fillStyle=colors.skin;
      ctx.beginPath(); ctx.arc(cxp,cyp-8*u,4.4*u,0,7); ctx.fill();
      ctx.fillStyle=colors.hair;
      ctx.beginPath(); ctx.arc(cxp,cyp-9*u,4.4*u,Math.PI,0); ctx.fill();
      if(colors.hat){
        ctx.fillStyle=colors.hat;
        ctx.beginPath(); ctx.ellipse(cxp,cyp-9*u,7*u,2.6*u,0,0,7); ctx.fill();
      }
      if(label&&cam.zoom>1.4){
        ctx.fillStyle='rgba(240,235,220,0.9)'; ctx.font=`${11}px sans-serif`;
        ctx.textAlign='center'; ctx.fillText(label,cxp,cyp-16*u); ctx.textAlign='left';
      }
      if(sub){ ctx.fillStyle='#dfe6f2'; ctx.font=`${10*u}px sans-serif`; ctx.fillText(sub,cxp+8*u,cyp-14*u); }
    };
    for(const v of villagers){
      const hasBaby=children.some(ch=>ch.motherId===v.id&&ch.age<2);
      drawSoul(v.x,v.y,v.colors,v.age<14?0.62:1,v.name,
        v.act==='sleep'?'z':(v.pregnant>0?'+':'')+(hasBaby?'•':''));
    }
    for(const ch of children){
      if(ch.age<2) continue;
      const m=vById(ch.motherId);
      drawSoul(ch.x,ch.y+4,ch.colors,ch.age<14?0.45+ch.age*0.02:0.62,ch.name||'…',null);
    }
  }
  // lightning flash
  if(flash>0){ ctx.fillStyle=`rgba(220,230,255,${(flash*0.5).toFixed(2)})`; ctx.fillRect(0,0,cw,chh); }'''
rep_span('  // ---- settlement ----',
         '  // lightning flash${(flash*0.5).toFixed(2)})`; ctx.fillRect(0,0,cw,chh); }',
         V4_RENDER)

# ============ R3: souls panel ============
old_marta_fn_start = src.index('function renderMarta(){')
old_marta_fn_end = src.index('\n}\n', old_marta_fn_start) + 3
V4_PANEL = '''function renderSouls(){
  if(!SETTLE.founded){ mStatsEl.textContent='—'; return; }
  const bars=b=>{ const f=Math.round(clamp(b,0,1)*8); return '█'.repeat(f)+'░'.repeat(8-f); };
  let html='';
  for(const v of villagers){
    const kids=children.filter(c=>c.motherId===v.id)
      .map(c=>(c.name||'unnamed')+'('+c.age.toFixed(1)+')').join(', ');
    html+='<div style="margin-bottom:6px"><b style="color:#e8d8a8">'+v.name+'</b>'+
      ' <span style="color:#6a7f96">'+Math.floor(v.age)+(v.sex==='F'?'F':'M')+'</span>'+
      (v.pregnant>0?' <span style="color:#e8a8c8">♥ '+Math.ceil(v.pregnant)+'d</span>':'')+'<br>'+
      '<span style="font-style:italic;color:#d8cfa8">&ldquo;'+v.thought+'&rdquo;</span><br>'+
      '<span style="color:#8aa0b8">doing</span> '+v.actLabel+'<br>'+
      'hunger '+bars(v.hunger)+' energy '+bars(v.energy)+'<br>'+
      'log '+v.inv.log+' · timber '+v.inv.timber+' · table '+(v.inv.table||0)+' · chair '+((v.inv.chair||0)+(v.inv.chair_crude||0))+
      ' · food '+v.inv.food+' · berries '+v.inv.berries+
      (kids?'<br><span style="color:#8aa0b8">children:</span> '+kids:'')+'</div>';
  }
  mStatsEl.innerHTML=html||'—';
  const th=villagers[0];
  if(th) mThoughtEl.textContent='\\u201c'+th.thought+'\\u201d';
}'''
src = src[:old_marta_fn_start] + V4_PANEL + src[old_marta_fn_end:]

def rep(old, new):
    global src
    assert src.count(old) == 1, 'ANCHOR: ' + old[:60]
    src = src.replace(old, new)

rep('  renderMarta();\n', '  renderSouls();\n')
rep('const mThoughtEl=document.getElementById(\'mThought\'), mStatsEl=document.getElementById(\'mStats\');',
    'const mThoughtEl=document.getElementById(\'mThought\'), mStatsEl=document.getElementById(\'soulStats\');')
rep('''  <h3>Marta <span style="color:#5a6f88">· the first settler</span></h3>
  <div id="marta"><div id="mThought">&ldquo;&hellip;&rdquo;</div><div id="mStats">&mdash;</div></div>''',
    '''  <h3>Souls <span style="color:#5a6f88">· the living</span></h3>
  <div id="marta"><div id="mThought" style="display:none"></div><div id="soulStats">&mdash;</div></div>''')
rep('<span class="title">NATURA v3</span>', '<span class="title">NATURA v4</span>')
rep('<title>Natura v3 — a living world</title>', '<title>Natura v4 — a living world</title>')
rep('NATURA v3 — a watchmaker world sim.', 'NATURA v4 — a watchmaker world sim.')

# ============ R4: genesis — Tomas arrives; bNew resets souls ============
rep('''findSpawn();
SETTLE.wx=Math.round(cam.x/CS); SETTLE.wy=Math.round(cam.y/CS);
foundSettlement();''',
    '''findSpawn();
SETTLE.wx=Math.round(cam.x/CS); SETTLE.wy=Math.round(cam.y/CS);
foundSettlement(); spawnTomas();''')
rep('''  BUSHSPOTS.length=0;
  SETTLE.founded=false; foundSettlement(); resetVillager();''',
    '''  resetSouls();
  SETTLE.founded=false; foundSettlement(); spawnTomas();''')

# ---- food system v1: farming + scripted animals (inlined verbatim) ----
# inserted after spawnTomas() so the genesis stock (chickens, seeds) finds a founded settlement
farm_js = open('/home/hatch/workspace/world-sim/farm_v1.js').read()
src = src.replace("foundSettlement(); spawnTomas();",
                  "foundSettlement(); spawnTomas();\n" + farm_js, 1)

open('/home/hatch/workspace/world-sim/natura-v4.html','w').write(src)
print('v4 bytes:', len(src))
js = src[src.index('<script>')+8:src.index('</script>')]
print('naive braces:', js.count('{')-js.count('}'))
