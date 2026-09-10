// NATURA wild ecology v1 — sky, water, and land beyond the farm.
// Birds, fish, frogs, deer, boar, squirrels, butterflies; reeds, lilies, kelp,
// wild herbs, mushrooms, meadow flowers. All deterministic instinct/state-machine:
// zero AI, zero tokens. Villagers can fish, hunt deer/boar, forage herbs/mushrooms.
// (built 2026-09-10; bakes into natura-v6+)
if(!window.__WILDV1){
window.__WILDV1=true;

// ---- species roster ----
// hab: sky | water | shore | land. yield: food when hunted. life: days.
const SPECIES={
  songbird:{hab:'sky',  size:0.55,speed:9,  fleeD:3,cap:12,life:4*365, col:'#c8a04a'},
  crow:    {hab:'sky',  size:0.8, speed:10, fleeD:4,cap:6, life:6*365, col:'#2b2b33'},
  duck:    {hab:'water',size:0.9, speed:2.5,fleeD:4,cap:6, life:6*365, col:'#7a6a4a'},
  hawk:    {hab:'sky',  size:1.2, speed:7,  fleeD:0,cap:3, life:8*365, col:'#5a4a3a',soar:1},
  riverfish:{hab:'water',size:0.6,speed:3,  fleeD:5,cap:20,life:3*365, col:'#6a9aaa'},
  seafish: {hab:'water',size:1.0,speed:3.5,fleeD:5,cap:12,life:5*365,  col:'#3f7a9e',deep:1},
  frog:    {hab:'shore',size:0.5,speed:2,  fleeD:2.5,cap:8,life:3*365, col:'#4a8a3a'},
  deer:    {hab:'land', size:1.6,speed:7,  fleeD:6,cap:8, life:8*365,  col:'#8a6a4a',yield:4},
  boar:    {hab:'land', size:1.2,speed:5,  fleeD:4,cap:6, life:7*365,  col:'#5a4a38',yield:3},
  squirrel:{hab:'land', size:0.6,speed:6,  fleeD:3,cap:8, life:4*365,  col:'#a06a3a'},
  butterfly:{hab:'sky', size:0.3,speed:1.2,fleeD:0,cap:10,life:60,    col:'#c86aaa',drift:1},
};
const PLANTS={
  reed:{cap:40}, lily:{cap:30}, kelp:{cap:30},
  herb:{cap:25}, mushroom:{cap:20}, flower:{cap:40},
};
const WILD={animals:[],plants:[]};

// ---- habitat helpers ----
function isWaterAt(wx,wy){ return cellChunk(wx,wy).c.h[cellChunk(wx,wy).i]<SEA; }
function nearWater(wx,wy,r){
  for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)
    if(isWaterAt(wx+dx,wy+dy)) return true;
  return false;
}
function findTree(x,y,maxR){
  for(let k=0;k<14;k++){
    const a=Math.random()*6.283, r=3+Math.random()*maxR;
    const wx=Math.round(x/CS+Math.cos(a)*r), wy=Math.round(y/CS+Math.sin(a)*r);
    const cc=cellChunk(wx,wy);
    if(cc.c.h[cc.i]>=SEA&&cc.c.tStage[cc.i]>=2) return {x:wx*CS,y:wy*CS};
  }
  return null;
}
function findShore(x,y){
  for(let k=0;k<16;k++){
    const wx=Math.round(x/CS+(Math.random()-0.5)*14), wy=Math.round(y/CS+(Math.random()-0.5)*14);
    if(!isWaterAt(wx,wy)&&nearWater(wx,wy,1)) return {x:wx*CS,y:wy*CS};
  }
  return null;
}
function wMove(a,dtH,speed){
  const dx=a.tx-a.x, dy=a.ty-a.y, d=Math.hypot(dx,dy);
  if(d>2){ const s=Math.min(d,speed*CS*dtH); a.x+=dx/d*s; a.y+=dy/d*s; a.moving=true; }
  else a.moving=false;
}
function wGraze(a,dtH){
  const cc=cellChunk(Math.round(a.x/CS),Math.round(a.y/CS));
  if(cc.c.grass[cc.i]>0.3&&cc.c.h[cc.i]>=SEA)
    a.hunger=Math.min(1,(a.hunger==null?0.8:a.hunger)+dtH*0.06);
  else a.hunger=Math.max(0,(a.hunger==null?0.8:a.hunger)-dtH*0.008);
  if(a.hunger<=0) a.starve=(a.starve||0)+dtH; else a.starve=0;
}
function wTire(a,dtH){
  if(a.state==='flee') a.stamT=(a.stamT||0)+dtH;
  else a.stamT=Math.max(0,(a.stamT||0)-dtH*2);
  return a.state==='flee'?Math.max(0.32,1-(a.stamT||0)/2.2):1;
}
function isNight(){ return W.tod<0.22||W.tod>0.78; }

// ---- animals ----
function mkWild(sp,x,y,age){
  const S=SPECIES[sp];
  const adult=S.life*0.15;
  return {sp,x,y,tx:null,ty:null,state:sp==='songbird'||sp==='crow'?'perch':'idle',
    t:Math.random()*4,age:age==null?adult*1.6:age,adult,sex:Math.random()<0.5?'M':'F',
    hunger:0.8,yield:S.yield||0,dead:false,stamT:0,
    cx:x,cy:y,cr:6*CS,ca:Math.random()*6.283};
}
function wildSpawnSpot(sp){
  const S=SPECIES[sp], cx=SETTLE.wx*CS, cy=SETTLE.wy*CS;
  for(let k=0;k<20;k++){
    const x=cx+(Math.random()-0.5)*90*CS, y=cy+(Math.random()-0.5)*90*CS;
    const wx=Math.round(x/CS), wy=Math.round(y/CS);
    const cc=cellChunk(wx,wy), h=cc.c.h[cc.i], land=h>=SEA;
    if(S.deep&&!land&&h<SEA-0.12) return {x,y};
    if(!land&&(S.hab==='water')){ if(!S.deep||h>=SEA-0.12) return {x,y}; else continue; }
    if(S.hab==='sky'&&!S.drift){ const t=findTree(x,y,20); if(t) return t; }
    if(sp==='butterfly'&&land&&cc.c.grass[cc.i]>0.4) return {x,y};
    if(S.hab==='land'&&land) return {x,y};
    if(S.hab==='shore'){ const s=findShore(x,y); if(s) return s; }
  }
  return null;
}
function landTick(a,dtH,sp){
  a.t=(a.t||0)+dtH;
  const nv=window.nearVillager(a.x,a.y);
  if(isNight()) a.state='sleep';
  else if(sp.fleeD&&nv.v&&nv.d<sp.fleeD){
    a.state='flee';
    const dx=a.x-nv.v.x, dy=a.y-nv.v.y, d=Math.hypot(dx,dy)||1;
    a.tx=a.x+dx/d*6*CS; a.ty=a.y+dy/d*6*CS;
  } else if(a.tx==null||a.t>9){
    a.t=0; a.state=Math.random()<0.65?'graze':'wander';
    a.tx=a.x+(Math.random()-0.5)*14*CS; a.ty=a.y+(Math.random()-0.5)*14*CS;
  }
  const tire=wTire(a,dtH);
  if(a.state!=='sleep'&&a.state!=='graze') wMove(a,dtH,(a.state==='flee'?sp.speed:sp.speed*0.35)*tire);
  else a.moving=false;
  wGraze(a,dtH);
}
function skyTick(a,dtH,sp){
  a.t-=dtH;
  const nv=window.nearVillager(a.x,a.y);
  if(a.state==='perch'){
    a.moving=false;
    if((sp.fleeD&&nv.v&&nv.d<sp.fleeD)||a.t<=0){
      const p=findTree(a.x,a.y,32);
      if(p){ a.tx=p.x; a.ty=p.y; }
      else { const an=Math.random()*6.283; a.tx=a.x+Math.cos(an)*22*CS; a.ty=a.y+Math.sin(an)*22*CS; }
      a.state='fly';
    }
  } else {
    wMove(a,dtH,sp.speed); a.moving=true;
    if(!a.moving){ a.state='perch'; a.t=2+Math.random()*5; }
  }
}
function driftTick(a,dtH,sp){  // butterfly
  a.t=(a.t||0)+dtH;
  if(isNight()){ a.state='sleep'; a.moving=false; return; }
  if(a.tx==null||a.t>10||!a.moving){
    a.t=0; a.state='drift';
    a.tx=a.x+(Math.random()-0.5)*16*CS; a.ty=a.y+(Math.random()-0.5)*16*CS;
  }
  wMove(a,dtH,sp.speed);
}
function soarTick(a,dtH,sp){  // hawk circles its thermal
  a.ca+=dtH*0.45; a.cr+= (Math.random()-0.5)*CS*dtH*0.2;
  a.cr=Math.max(4*CS,Math.min(10*CS,a.cr));
  const nx=a.cx+Math.cos(a.ca)*a.cr, ny=a.cy+Math.sin(a.ca)*a.cr;
  a.moving=Math.hypot(nx-a.x,ny-a.y)>1;
  a.x=nx; a.y=ny; a.state='soar';
  if(Math.random()<dtH*0.01){ a.cx+=(Math.random()-0.5)*20*CS; a.cy+=(Math.random()-0.5)*20*CS; }
}
function setWaterTarget(a,tx,ty){
  const sp=SPECIES[a.sp];
  for(let k=0;k<8;k++){
    const jx=tx+(k?(Math.random()-0.5)*8*CS:0), jy=ty+(k?(Math.random()-0.5)*8*CS:0);
    const wx=Math.round(jx/CS), wy=Math.round(jy/CS);
    const h=cellChunk(wx,wy).c.h[cellChunk(wx,wy).i];
    if(h<SEA&&(!sp.deep||h<SEA-0.12)){ a.tx=jx; a.ty=jy; return; }
  }
  a.tx=a.x; a.ty=a.y;
}
function waterTick(a,dtH,sp){
  a.t=(a.t||0)+dtH;
  const nv=window.nearVillager(a.x,a.y);
  if(isNight()){ a.state='rest'; a.moving=false; return; }
  if(sp.fleeD&&nv.v&&nv.d<sp.fleeD){
    a.state='dart';
    const dx=a.x-nv.v.x, dy=a.y-nv.v.y, d=Math.hypot(dx,dy)||1;
    setWaterTarget(a,a.x+dx/d*10*CS,a.y+dy/d*10*CS);
  } else if(a.tx==null||a.t>7){
    a.t=0; a.state='swim';
    setWaterTarget(a,a.x+(Math.random()-0.5)*16*CS,a.y+(Math.random()-0.5)*16*CS);
  }
  if(a.state==='swim'||a.state==='dart') wMove(a,dtH,a.state==='dart'?sp.speed*3:sp.speed);
  else a.moving=false;
}
function shoreTick(a,dtH,sp){  // frog: sits, hops, flees by hopping
  a.t=(a.t||0)+dtH;
  const nv=window.nearVillager(a.x,a.y);
  if(isNight()){ a.state='sleep'; a.moving=false; return; }
  if(a.hop){
    wMove(a,dtH,sp.speed*3);
    if(!a.moving){ a.hop=null; a.state='sit'; a.t=0; }
    return;
  }
  a.moving=false; a.state='sit';
  const flee=sp.fleeD&&nv.v&&nv.d<sp.fleeD;
  if(flee||a.t>5){
    a.t=0;
    let hx,hy;
    if(flee){ const dx=a.x-nv.v.x, dy=a.y-nv.v.y, d=Math.hypot(dx,dy)||1;
      const s=findShore(a.x+dx/d*8*CS,a.y+dy/d*8*CS); hx=s?s.x:a.x+dx/d*6*CS; hy=s?s.y:a.y+dy/d*6*CS; }
    else { const s=findShore(a.x+(Math.random()-0.5)*8*CS,a.y+(Math.random()-0.5)*8*CS);
      if(!s) return; hx=s.x; hy=s.y; }
    a.tx=hx; a.ty=hy; a.hop=true; a.state='hop';
  }
}
function wTick(a,dtH){
  if(a.dead) return;
  const sp=SPECIES[a.sp];
  a.age+=dtH/24;
  if((a.age>sp.life&&Math.random()<dtH*0.004)||((a.starve||0)>150&&Math.random()<dtH*0.06)){
    a.dead=true; return;
  }
  if(sp.soar) return soarTick(a,dtH,sp);
  if(sp.drift) return driftTick(a,dtH,sp);
  if(sp.hab==='sky') return skyTick(a,dtH,sp);
  if(sp.hab==='water') return waterTick(a,dtH,sp);
  if(sp.hab==='shore') return shoreTick(a,dtH,sp);
  return landTick(a,dtH,sp);
}

// ---- wild plants ----
function plantSpot(kind){
  const cx=SETTLE.wx, cy=SETTLE.wy;
  for(let k=0;k<26;k++){
    const wx=cx+Math.round((Math.random()-0.5)*130), wy=cy+Math.round((Math.random()-0.5)*130);
    const cc=cellChunk(wx,wy), i=cc.i, c=cc.c;
    const h=c.h[i], land=h>=SEA;
    if(kind==='reed'&&land&&nearWater(wx,wy,1)&&c.tStage[i]<1) return {wx,wy};
    if(kind==='lily'&&!land&&h>SEA-0.06) return {wx,wy};
    if(kind==='kelp'&&!land&&h<SEA-0.12) return {wx,wy};
    if(kind==='herb'&&land&&c.grass[i]>0.5&&c.tStage[i]<1) return {wx,wy};
    if(kind==='mushroom'&&land&&c.tStage[i]>=1) return {wx,wy};
    if(kind==='flower'&&land&&c.grass[i]>0.4&&c.tStage[i]<1) return {wx,wy};
  }
  return null;
}
const FCOL=['#d86a8a','#e8c04a','#a87ad8','#e88a4a','#7ab8d8'];
function seedWildPlants(){
  for(const kind in PLANTS){
    const P=PLANTS[kind];
    if(WILD.plants.filter(p=>p.kind===kind).length>=P.cap) continue;
    for(let k=0;k<6;k++){
      const s=plantSpot(kind);
      if(s){ WILD.plants.push({kind,wx:s.wx,wy:s.wy,stage:0,t:Math.random()*24,
        col:kind==='flower'?FCOL[Math.floor(Math.random()*FCOL.length)]:null}); break; }
    }
  }
}
let plantT=0;
function wildPlantTick(dtH){
  for(const p of WILD.plants){
    p.t+=dtH;
    if(p.stage<1&&p.t>48) p.stage=1;
  }
  plantT+=dtH;
  if(plantT>24){ plantT=0; seedWildPlants(); }
}

// ---- breeding (spring): pairs make young, never from nothing ----
let wildReproT=0;
function wildBreed(){
  if(seasonIdx()!==0) return;
  let total=WILD.animals.filter(a=>!a.dead).length;
  for(const sp in SPECIES){
    const S=SPECIES[sp];
    const pop=WILD.animals.filter(a=>!a.dead&&a.sp===sp);
    if(pop.length>=S.cap||total>=70) continue;
    const fs=pop.filter(a=>a.sex==='F'&&a.age>S.life*0.15);
    for(const f of fs){
      const m=pop.find(a=>a.sex==='M'&&a.age>S.life*0.15&&Math.hypot(a.x-f.x,a.y-f.y)/CS<30);
      if(m){
        const n=(sp==='riverfish'||sp==='seafish'||sp==='frog')?2:1;
        for(let k=0;k<n;k++){
          WILD.animals.push(mkWild(sp,f.x+(Math.random()-0.5)*3*CS,f.y+(Math.random()-0.5)*3*CS,0));
          total++;
        }
        break;
      }
    }
  }
}
function wildTick(dtH){
  for(const a of WILD.animals) wTick(a,dtH);
  for(let i=WILD.animals.length-1;i>=0;i--) if(WILD.animals[i].dead) WILD.animals.splice(i,1);
  wildPlantTick(dtH);
  wildReproT+=dtH;
  if(wildReproT>72){ wildReproT=0; wildBreed(); }
}

// ---- villager jobs: fish, gather wild herbs/mushrooms ----
function wildJobTick(v,dtH){
  const J=v.job;
  if(J.kind==='fish'){
    if(!J.sx){
      const s=findShore(J.wx*CS,J.wy*CS);
      if(!s){ v.job=null; v.lastResult={kind:'fish',ok:false,why:'no shore'}; return; }
      J.sx=s.x; J.sy=s.y;
    }
    if(Math.hypot(J.sx-v.x,J.sy-v.y)>1.4*CS){
      v.act='walk'; v.actLabel='going to fish'; vMoveTo(v,J.sx,J.sy,dtH); return;
    }
    v.act='fish'; v.actLabel='fishing'; J.t=(J.t||0)+dtH;
    const need=Math.max(0.8,2.2-(v.skills.fish||0)*1.2);
    if(J.t>=need){
      const h=cellChunk(J.wx,J.wy).c.h[cellChunk(J.wx,J.wy).i];
      const y=h<SEA-0.12?3:2;
      v.inv.food=(v.inv.food||0)+y; gainSkill(v,'fish',0.06);
      v.job=null; v.lastResult={kind:'fish',ok:true,yield:y,deep:y===3};
    }
    return;
  }
  if(J.kind==='gather_wild'){
    const p=WILD.plants.find(q=>q.wx===J.wx&&q.wy===J.wy);
    if(!p||p.stage<1){ v.job=null; v.lastResult={kind:'gather_wild',ok:false,why:'gone'}; return; }
    const px=J.wx*CS, py=J.wy*CS;
    if(Math.hypot(px-v.x,py-v.y)>1.4*CS){
      v.act='walk'; v.actLabel='going to forage'; vMoveTo(v,px,py,dtH); return;
    }
    v.act='forage'; v.actLabel=p.kind==='herb'?'gathering herbs':'picking mushrooms';
    J.t=(J.t||0)+dtH;
    if(J.t>=0.5){
      p.stage=0; p.t=0;
      v.inv.food=(v.inv.food||0)+1; gainSkill(v,'forage',0.03);
      v.job=null; v.lastResult={kind:'gather_wild',ok:true,got:p.kind,yield:1};
    }
    return;
  }
}

// ---- hooks ----
const _soulTickW=soulTick;
soulTick=function(v,dtH){
  const J=v.job;
  if(J&&(J.kind==='fish'||J.kind==='gather_wild')){
    if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);
    wildJobTick(v,dtH);
    if(villagers.indexOf(v)>=0&&window.metabolize) window.metabolize(v,dtH);
    return;
  }
  return _soulTickW(v,dtH);
};
const _simTickW=simTick;
simTick=function(dtH){ wildTick(dtH); return _simTickW(dtH); };
const _orderW=NV.order;
NV.order=function(name,o){
  const v=vByName(name); if(!v) return 'no such soul';
  const vb=o&&o.verb;
  if(vb==='fish'){
    const vx=Math.round(v.x/CS), vy=Math.round(v.y/CS);
    let bw=null;
    outer: for(let r=0;r<=4;r++) for(let k=0;k<12;k++){
      const wx=vx+Math.round(Math.cos(k/12*6.283)*r), wy=vy+Math.round(Math.sin(k/12*6.283)*r);
      if(isWaterAt(wx,wy)){ bw={wx,wy}; break outer; }
    }
    if(!bw) return 'no water near';
    v.job={kind:'fish',wx:bw.wx,wy:bw.wy,t:0}; return 'ok';
  }
  if(vb==='forage'&&o&&typeof o.wx==='number'){
    const p=WILD.plants.find(q=>(q.kind==='herb'||q.kind==='mushroom')&&q.stage>=1
      &&q.wx===Math.round(o.wx)&&q.wy===Math.round(o.wy));
    if(p){ v.job={kind:'gather_wild',wx:p.wx,wy:p.wy,t:0}; return 'ok'; }
  }
  return _orderW.call(this,name,o);
};
const _snapW=NV.snap;
NV.snap=function(name){
  const s=_snapW(name); if(s.error) return s;
  const v=vByName(name), vx=v.x, vy=v.y;
  const agg={};
  for(const a of WILD.animals){
    const d=Math.hypot(a.x-vx,a.y-vy)/CS; if(d>60) continue;
    agg[a.sp]=agg[a.sp]||{n:0,d:1e9};
    agg[a.sp].n++; agg[a.sp].d=Math.min(agg[a.sp].d,Math.round(d));
  }
  s.see.wildlife=Object.keys(agg).map(k=>({sp:k,n:agg[k].n,d:agg[k].d}));
  s.see.wildplants=WILD.plants
    .filter(p=>(p.kind==='herb'||p.kind==='mushroom')&&p.stage>=1
      &&Math.hypot(p.wx*CS-vx,p.wy*CS-vy)/CS<=60)
    .map(p=>({kind:p.kind,wx:p.wx,wy:p.wy,d:Math.round(Math.hypot(p.wx*CS-vx,p.wy*CS-vy)/CS)}));
  return s;
};

// ---- genesis ----
function wildGenesis(){
  WILD.animals.length=0; WILD.plants.length=0; wildReproT=0; plantT=0;
  const S0={songbird:8,crow:4,duck:4,hawk:2,riverfish:12,seafish:8,frog:5,
            deer:5,boar:4,squirrel:5,butterfly:6};
  for(const sp in S0) for(let k=0;k<S0[sp];k++){
    const p=wildSpawnSpot(sp);
    if(p) WILD.animals.push(mkWild(sp,p.x,p.y));
  }
  for(let k=0;k<120;k++) seedWildPlants();
  for(const p of WILD.plants){ p.stage=1; p.t=60; }
  logEvent('life','The wilds teem: birds in the trees, fish in the water, deer at the treeline.');
}
window.wildGenesis=wildGenesis;
window.WILD=WILD; window.SPECIES=SPECIES; window.mkWild=mkWild; window.wTick=wTick;

// ---- drawing ----
function drawWild(){
  const z=cam.zoom, cw=cv.width/dpr, chh=cv.height/dpr;
  const onScr=(wx,wy)=>{ const s=w2s(wx,wy); return s.x>-60&&s.y>-60&&s.x<cw+60&&s.y<chh+60; };
  const now=performance.now();
  // wild plants first (under animals)
  for(const p of WILD.plants){
    const px=p.wx*CS, py=p.wy*CS;
    if(!onScr(px,py)) continue;
    const s=w2s(px,py), sc=z, ox=(p.wx*7+p.wy*13)%10*sc*0.6-3*sc;
    if(p.kind==='reed'){
      ctx.strokeStyle='#3f7a3a'; ctx.lineWidth=Math.max(1,1.6*z);
      for(let k=0;k<3;k++){ const gx=s.x+ox+(k-1)*4*z;
        ctx.beginPath(); ctx.moveTo(gx,s.y); ctx.lineTo(gx+(k-1)*z,s.y-(10+k*3)*z); ctx.stroke(); }
      ctx.fillStyle='#6a4a2a';
      ctx.fillRect(s.x+ox-1.5*z,s.y-16*z,3*z,6*z);
    } else if(p.kind==='lily'){
      ctx.fillStyle='#2a7a4a';
      ctx.beginPath(); ctx.ellipse(s.x+ox,s.y,7*z,3.5*z,0,0,7); ctx.fill();
      if(p.stage>=1){ ctx.fillStyle='#e89ab8';
        ctx.beginPath(); ctx.arc(s.x+ox,s.y-2*z,2.5*z,0,7); ctx.fill();
        ctx.fillStyle='#f8d8e8'; ctx.beginPath(); ctx.arc(s.x+ox,s.y-2*z,1*z,0,7); ctx.fill(); }
    } else if(p.kind==='kelp'){
      ctx.strokeStyle='#2a6a3a'; ctx.lineWidth=Math.max(1,2.4*z);
      for(let k=0;k<2;k++){ const gx=s.x+ox+(k-0.5)*6*z;
        ctx.beginPath(); ctx.moveTo(gx,s.y);
        for(let sg=1;sg<=4;sg++) ctx.lineTo(gx+Math.sin(now/900+sg+p.wx)*3*z,s.y-sg*4*z);
        ctx.stroke(); }
    } else if(p.kind==='herb'){
      ctx.fillStyle='#4a9a4a';
      for(let k=0;k<4;k++){ const gx=s.x+ox+(k-1.5)*3.4*z, gy=s.y-(k%2)*3*z;
        ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx-2*z,gy-5*z); ctx.lineTo(gx+2*z,gy-5*z); ctx.fill(); }
    } else if(p.kind==='mushroom'){
      ctx.fillStyle='#e8dcc8'; ctx.fillRect(s.x+ox-1.6*z,s.y-6*z,3.2*z,6*z);
      ctx.fillStyle='#c84a3a';
      ctx.beginPath(); ctx.arc(s.x+ox,s.y-6*z,4.6*z,Math.PI,0); ctx.fill();
      ctx.fillStyle='#f8f0e0';
      ctx.fillRect(s.x+ox-2.6*z,s.y-8.6*z,1.6*z,1.6*z);
      ctx.fillRect(s.x+ox+1*z,s.y-7.4*z,1.4*z,1.4*z);
    } else if(p.kind==='flower'){
      ctx.strokeStyle='#3f7a3a'; ctx.lineWidth=Math.max(1,1.2*z);
      ctx.beginPath(); ctx.moveTo(s.x+ox,s.y); ctx.lineTo(s.x+ox,s.y-7*z); ctx.stroke();
      ctx.fillStyle=p.col||'#d86a8a';
      ctx.beginPath(); ctx.arc(s.x+ox,s.y-8.5*z,2.6*z,0,7); ctx.fill();
      ctx.fillStyle='#f8e86a'; ctx.beginPath(); ctx.arc(s.x+ox,s.y-8.5*z,1*z,0,7); ctx.fill();
    }
  }
  // animals
  for(const a of WILD.animals){
    if(!onScr(a.x,a.y)) continue;
    const s=w2s(a.x,a.y), sp=SPECIES[a.sp], sc=sp.size*z, col=sp.col;
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(s.x,s.y+3*sc,6*sc,2.2*sc,0,0,7); ctx.fill();
    const dir=a.moving&&a.tx!=null?(a.tx>=a.x?1:-1):1;
    ctx.save(); ctx.translate(s.x,s.y); ctx.scale(dir,1);
    if(a.sp==='songbird'||a.sp==='crow'){
      const flying=a.state==='fly';
      if(!flying){ // perched on a branch
        ctx.strokeStyle='#4a3423'; ctx.lineWidth=Math.max(1,1.8*z);
        ctx.beginPath(); ctx.moveTo(-7*sc,4*sc); ctx.lineTo(7*sc,4*sc); ctx.stroke();
      }
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,flying?-2*sc:0,5*sc,3.6*sc,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(4.4*sc,flying?-4*sc:-2.6*sc,2.6*sc,0,7); ctx.fill();
      ctx.fillStyle='#e8a83a';
      ctx.beginPath(); ctx.moveTo(6.6*sc,flying?-4*sc:-2.6*sc);
      ctx.lineTo(8.6*sc,flying?-3.4*sc:-2*sc); ctx.lineTo(6.6*sc,flying?-2.8*sc:-1.4*sc); ctx.fill();
      ctx.fillStyle='#14141a'; ctx.beginPath(); ctx.arc(5*sc,flying?-4.6*sc:-3.2*sc,0.7*sc,0,7); ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,2.4*z);
      ctx.beginPath(); ctx.moveTo(-4.6*sc,flying?-1*sc:1*sc); ctx.lineTo(-9*sc,flying?2*sc:4*sc); ctx.stroke();
      if(flying){ const f=Math.sin(now/70)*3*sc;
        ctx.fillStyle=col;
        ctx.beginPath(); ctx.ellipse(-1*sc,-4*sc+f,4.4*sc,1.8*sc,-0.5,0,7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-1*sc,-4*sc-f,4.4*sc,1.8*sc,0.5,0,7); ctx.fill();
      } else {
        ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(-1*sc,-3*sc,3.6*sc,1.6*sc,0.3,0,7); ctx.fill();
      }
    } else if(a.sp==='duck'){
      ctx.fillStyle='rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.ellipse(0,2.6*sc,6.4*sc,1.8*sc,0,0,7); ctx.fill();
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,0,5.6*sc,3.4*sc,0,0,7); ctx.fill();
      ctx.fillStyle='#4a5a6a'; ctx.beginPath(); ctx.ellipse(-1*sc,-1*sc,3.4*sc,2*sc,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(4.6*sc,-2.6*sc,2.4*sc,0,7); ctx.fill();
      ctx.fillStyle='#e88a2a';
      ctx.beginPath(); ctx.moveTo(6.6*sc,-2.6*sc); ctx.lineTo(8.8*sc,-2*sc); ctx.lineTo(6.6*sc,-1.4*sc); ctx.fill();
      ctx.fillStyle='#14141a'; ctx.beginPath(); ctx.arc(5.2*sc,-3.2*sc,0.6*sc,0,7); ctx.fill();
    } else if(a.sp==='hawk'){
      const f=Math.sin(now/240)*1.6*sc;
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(-7*sc,-3*sc+f,7*sc,2*sc,-0.35,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(7*sc,-3*sc-f,7*sc,2*sc,0.35,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0,0,4.6*sc,2.6*sc,0,0,7); ctx.fill();
      ctx.fillStyle='#d8c8a8'; ctx.beginPath(); ctx.arc(4.4*sc,-1*sc,1.8*sc,0,7); ctx.fill();
      ctx.fillStyle='#c86a2a'; ctx.beginPath();
      ctx.moveTo(5.8*sc,-1*sc); ctx.lineTo(7.4*sc,-0.4*sc); ctx.lineTo(5.8*sc,0.2*sc); ctx.fill();
    } else if(a.sp==='riverfish'||a.sp==='seafish'){
      const w=Math.sin(now/160+a.x*0.1)*1.6*sc;
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,0,5*sc,2.2*sc,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4.6*sc,0);
      ctx.lineTo(-8*sc,-2.4*sc+w); ctx.lineTo(-8*sc,2.4*sc+w); ctx.fill();
      ctx.fillStyle='#14141a'; ctx.beginPath(); ctx.arc(3*sc,-0.6*sc,0.7*sc,0,7); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath(); ctx.ellipse(0.6*sc,-1*sc,2.4*sc,0.8*sc,-0.3,0,7); ctx.fill();
    } else if(a.sp==='frog'){
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,0,4.6*sc,3*sc,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(2.6*sc,-2.6*sc,1.6*sc,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(0.2*sc,-2.9*sc,1.6*sc,0,7); ctx.fill();
      ctx.fillStyle='#14141a';
      ctx.beginPath(); ctx.arc(2.6*sc,-2.9*sc,0.7*sc,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(0.2*sc,-3.2*sc,0.7*sc,0,7); ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,2*z);
      ctx.beginPath(); ctx.moveTo(-3*sc,1*sc); ctx.lineTo(-6.4*sc,3.4*sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(3*sc,1*sc); ctx.lineTo(6.4*sc,3.4*sc); ctx.stroke();
    } else if(a.sp==='deer'){
      ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,2.6*z);
      const lp=a.moving?Math.sin(now/110)*2.4*sc:0;
      for(const lx of [-3.4,-1.2,1.2,3.4]){
        ctx.beginPath(); ctx.moveTo(lx*sc,1*sc); ctx.lineTo((lx+(lx<0?-lp:lp))*sc,7*sc); ctx.stroke(); }
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,-2*sc,6.4*sc,3.8*sc,0,0,7); ctx.fill();
      ctx.fillStyle='#f0e8d8';
      ctx.beginPath(); ctx.ellipse(0,0.4*sc,3.6*sc,1.8*sc,0,0,7); ctx.fill();
      ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,3*z);
      ctx.beginPath(); ctx.moveTo(4.6*sc,-3*sc); ctx.lineTo(7.6*sc,-9*sc); ctx.stroke();
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(8.2*sc,-10*sc,2.6*sc,2*sc,0.3,0,7); ctx.fill();
      ctx.fillStyle='#2a2018'; ctx.beginPath(); ctx.arc(9.4*sc,-10.4*sc,0.6*sc,0,7); ctx.fill();
      if(a.sex==='M'){ ctx.strokeStyle='#d8c8a8'; ctx.lineWidth=Math.max(1,1.6*z);
        for(const s2 of [-1,1]){ ctx.beginPath(); ctx.moveTo((8.2+s2*1.2)*sc,-11.6*sc);
          ctx.lineTo((8.2+s2*2.6)*sc,-15*sc); ctx.stroke();
          ctx.beginPath(); ctx.moveTo((8.2+s2*2.2)*sc,-14*sc);
          ctx.lineTo((8.2+s2*3.6)*sc,-14.6*sc); ctx.stroke(); } }
      ctx.fillStyle='#f0e8d8';
      for(let k=0;k<4;k++){ ctx.beginPath();
        ctx.arc((-3+k*2)*sc,-3.4*sc,0.9*sc,0,7); ctx.fill(); }
    } else if(a.sp==='boar'){
      ctx.strokeStyle='#3a2f24'; ctx.lineWidth=Math.max(1,2.6*z);
      const lp=a.moving?Math.sin(now/120)*2*sc:0;
      for(const lx of [-3,-1,1,3]){
        ctx.beginPath(); ctx.moveTo(lx*sc,1*sc); ctx.lineTo((lx+(lx<0?-lp:lp))*sc,6*sc); ctx.stroke(); }
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,-1*sc,5.6*sc,3.8*sc,0,0,7); ctx.fill();
      ctx.fillStyle='#6a5648';
      for(let k=0;k<5;k++){ ctx.beginPath();
        ctx.arc((-3.4+k*1.7)*sc,-2.6*sc,1*sc,0,7); ctx.fill(); }
      ctx.fillStyle=col; ctx.beginPath(); ctx.ellipse(5.6*sc,-1.6*sc,2.8*sc,2.6*sc,0,0,7); ctx.fill();
      ctx.fillStyle='#d8a8a0'; ctx.beginPath(); ctx.arc(8*sc,-1*sc,1.2*sc,0,7); ctx.fill();
      ctx.fillStyle='#14141a'; ctx.beginPath(); ctx.arc(6*sc,-2.6*sc,0.6*sc,0,7); ctx.fill();
      if(a.sex==='M'){ ctx.fillStyle='#e8e0d0';
        ctx.beginPath(); ctx.moveTo(7*sc,1*sc); ctx.lineTo(8.4*sc,2.6*sc); ctx.lineTo(6.6*sc,2.2*sc); ctx.fill(); }
    } else if(a.sp==='squirrel'){
      const hop=a.moving?Math.abs(Math.sin(now/130))*-2*sc:0;
      ctx.strokeStyle=col; ctx.lineWidth=Math.max(1,3*z);
      ctx.beginPath(); ctx.moveTo(-4*sc,-1*sc+hop);
      ctx.quadraticCurveTo(-8*sc,-8*sc+hop,-3*sc,-10*sc+hop); ctx.stroke();
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(0,hop,4.4*sc,3*sc,0,0,7); ctx.fill();
      ctx.beginPath(); ctx.arc(3.8*sc,-2.4*sc+hop,2.2*sc,0,7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2.6*sc,-4*sc+hop); ctx.lineTo(3.4*sc,-6.4*sc+hop); ctx.lineTo(4.4*sc,-4*sc+hop); ctx.fill();
      ctx.fillStyle='#14141a'; ctx.beginPath(); ctx.arc(4.6*sc,-2.8*sc+hop,0.6*sc,0,7); ctx.fill();
    } else if(a.sp==='butterfly'){
      const f=Math.abs(Math.sin(now/90))*4*sc;
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.ellipse(-2.4*sc,-f*0.4,2.6*sc,3.6*sc,-0.5,0,7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(2.4*sc,-f*0.4,2.6*sc,3.6*sc,0.5,0,7); ctx.fill();
      ctx.fillStyle='#2a2a30'; ctx.fillRect(-0.6*sc,-2.4*sc,1.2*sc,4.8*sc);
    }
    ctx.restore();
  }
}
const _renderW=render;
render=function(){ _renderW(); drawWild(); };

}
