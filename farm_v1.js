/* Natura food system v1 — farming + scripted animals (no AI minds; pure instinct).
   Injected into page scope. Safe to include once (guarded). */
if(!window.__FARMV1){
window.__FARMV1=true;

const CROPS={
  wheat:{seed:2,growH:130,food:4,seedBack:2,label:'wheat'},
  carrot:{seed:1,growH:90,food:3,seedBack:1,label:'carrot'}
};
const FARM={plots:[]};            // {wx,wy,crop,stage:0..4,t,water}
const ANIM={chicks:[],eggs:[],rabbits:[]};
let reproT=0;

/* ---------- crops ---------- */
function farmTick(dtH){
  const si=seasonIdx();
  const seasonMult=[1,1.25,0.7,0.12][si];
  for(const p of FARM.plots){
    if(!p.crop||p.stage>=3) continue;
    const cc=cellChunk(p.wx,p.wy), c=cc.c, i=cc.i;
    if(c.rain[i]>0.05) p.water=Math.min(1,p.water+dtH/8);
    else p.water=Math.max(0,p.water-dtH/(si===1?26:48));
    if(p.water<0.1&&c.temp[i]>25&&Math.random()<dtH*0.004){ p.stage=4; continue; } // withered
    p.t+=dtH*(0.35+0.65*p.water)*seasonMult;
    const G=CROPS[p.crop].growH;
    p.stage=p.t>=G?3:(p.t>=G*0.55?2:1);
  }
  for(const a of ANIM.chicks) chickTick(a,dtH);
  for(const r of ANIM.rabbits) rabbitTick(r,dtH);
  reproT+=dtH;
  if(reproT>72){ reproT=0; reproduce(); }
}

function nearestVillager(x,y){
  let bv=null,bd=1e9;
  for(const v of villagers){ const d=Math.hypot(v.x-x,v.y-y)/CS; if(d<bd){bd=d;bv=v;} }
  return {v:bv,d:bd};
}

function critterMove(a,dtH,speed){
  const dx=a.tx-a.x, dy=a.ty-a.y, d=Math.hypot(dx,dy);
  if(d>2){ const s=Math.min(d,speed*CS*dtH); a.x+=dx/d*s; a.y+=dy/d*s; a.moving=true; }
  else a.moving=false;
}

function chickTick(a,dtH){
  a.age+=dtH/24; a.t=(a.t||0)+dtH;
  const night=W.tod<0.22||W.tod>0.78;
  const nv=nearestVillager(a.x,a.y);
  if(night){ a.state='sleep'; }
  else if(nv.v&&nv.d<2.2){ a.state='flee';
    const dx=a.x-nv.v.x, dy=a.y-nv.v.y, d=Math.hypot(dx,dy)||1;
    a.tx=a.x+dx/d*4*CS; a.ty=a.y+dy/d*4*CS;
  } else if(a.tx==null||a.t>6){ a.t=0; a.state=Math.random()<0.6?'graze':'wander';
    a.tx=a.x+(Math.random()-0.5)*10*CS; a.ty=a.y+(Math.random()-0.5)*10*CS;
  }
  if(a.state!=='sleep'&&a.state!=='graze') critterMove(a,dtH,a.state==='flee'?4:1.5);
  else a.moving=false;
  const cc=cellChunk(Math.round(a.x/CS),Math.round(a.y/CS));
  if(cc.c.grass[cc.i]>0.3&&cc.c.h[cc.i]>=SEA) a.hunger=Math.min(1,(a.hunger==null?0.7:a.hunger)+dtH*0.06);
  else a.hunger=Math.max(0,(a.hunger==null?0.7:a.hunger)-dtH*0.008);
  a.layT=(a.layT==null?20+Math.random()*15:a.layT)-dtH;
  if(a.sex==='hen'&&a.age>0.3&&a.layT<=0&&a.hunger>0.35&&ANIM.eggs.length<24){
    ANIM.eggs.push({x:a.x+(Math.random()-0.5)*CS,y:a.y+(Math.random()-0.5)*CS});
    a.layT=28+Math.random()*18;
  }
}

function rabbitTick(r,dtH){
  r.age+=dtH/24; r.t=(r.t||0)+dtH;
  const night=W.tod<0.22||W.tod>0.78;
  const nv=nearestVillager(r.x,r.y);
  if(night){ r.state='sleep'; }
  else if(nv.v&&nv.d<4){ r.state='flee';
    const dx=r.x-nv.v.x, dy=r.y-nv.v.y, d=Math.hypot(dx,dy)||1;
    r.tx=r.x+dx/d*6*CS; r.ty=r.y+dy/d*6*CS;
  } else if(r.tx==null||r.t>8){ r.t=0; r.state=Math.random()<0.7?'graze':'wander';
    r.tx=r.x+(Math.random()-0.5)*16*CS; r.ty=r.y+(Math.random()-0.5)*16*CS;
  }
  if(r.state!=='sleep'&&r.state!=='graze') critterMove(r,dtH,r.state==='flee'?6:2);
  else r.moving=false;
}

function reproduce(){
  const hens=ANIM.chicks.filter(a=>a.sex==='hen'&&a.age>0.3);
  const roo=ANIM.chicks.some(a=>a.sex==='roo'&&a.age>0.3);
  if(roo&&hens.length>=2&&ANIM.chicks.length<14){
    const m=hens[Math.floor(Math.random()*hens.length)];
    ANIM.chicks.push(mkChick(m.x+(Math.random()-0.5)*2*CS,m.y+(Math.random()-0.5)*2*CS,
      Math.random()<0.6?'hen':'roo',0));
  }
  if(ANIM.rabbits.length<10&&ANIM.rabbits.length>=2&&Math.random()<0.5){
    const m=ANIM.rabbits[Math.floor(Math.random()*ANIM.rabbits.length)];
    ANIM.rabbits.push({x:m.x+(Math.random()-0.5)*4*CS,y:m.y+(Math.random()-0.5)*4*CS,
      age:0,state:'wander',t:0,tx:null,ty:null});
  }
}

function mkChick(x,y,sex,age){
  return {x,y,sex,age:age||1,state:'wander',t:Math.random()*6,tx:null,ty:null,
    hunger:0.8,layT:20+Math.random()*15,
    col:sex==='roo'?'#8a4a2a':(Math.random()<0.5?'#f2ede2':'#9a6a3a')};
}

/* ---------- villager jobs ---------- */
function farmJobTick(v,dtH){
  const J=v.job;
  if(J.kind==='collect'){
    let bi=-1,bd=1e9;
    ANIM.eggs.forEach((e,idx)=>{ const d=Math.hypot(e.x-v.x,e.y-v.y)/CS; if(d<bd){bd=d;bi=idx;} });
    if(bi<0){ v.job=null; v.lastResult={kind:'collect',got:0}; return; }
    const e=ANIM.eggs[bi];
    if(Math.hypot(e.x-v.x,e.y-v.y)>1.2*CS){ v.act='walk'; v.actLabel='fetching eggs'; vMoveTo(v,e.x,e.y,dtH); return; }
    v.act='gather'; v.actLabel='gathering eggs'; J.t=(J.t||0)+dtH;
    if(J.t>=0.3){ ANIM.eggs.splice(bi,1); v.inv.eggs=(v.inv.eggs||0)+1;
      gainSkill(v,'forage',0.02); v.job=null; v.lastResult={kind:'collect',got:1}; }
    return;
  }
  const plot=FARM.plots.find(p=>p.wx===J.wx&&p.wy===J.wy);
  const px=J.wx*CS, py=J.wy*CS;
  const goFar=()=>Math.hypot(px-v.x,py-v.y)>1.6*CS;
  if(J.kind==='till'){
    if(plot){ v.job=null; return; }
    if(goFar()){ v.act='walk'; v.actLabel='going to the field'; vMoveTo(v,px,py,dtH); return; }
    v.act='till'; v.actLabel='tilling soil'; J.t=(J.t||0)+dtH;
    if(J.t>=2){ FARM.plots.push({wx:J.wx,wy:J.wy,crop:null,stage:0,t:0,water:0.6});
      gainSkill(v,'farm'); v.job=null; v.lastResult={kind:'till',ok:true}; }
  }else if(J.kind==='plant'){
    if(!plot||plot.crop){ v.job=null; v.lastResult={kind:'plant',ok:false,why:'no tilled plot'}; return; }
    const cost=J.crop==='wheat'?2:1;
    if((v.inv.seeds||0)<cost){ v.job=null; v.lastResult={kind:'plant',ok:false,why:'need seeds'}; return; }
    if(goFar()){ v.act='walk'; v.actLabel='going to the field'; vMoveTo(v,px,py,dtH); return; }
    v.act='plant'; v.actLabel='planting '+J.crop; J.t=(J.t||0)+dtH;
    if(J.t>=1){ v.inv.seeds-=cost; plot.crop=J.crop; plot.stage=1; plot.t=0;
      gainSkill(v,'farm'); v.job=null; v.lastResult={kind:'plant',ok:true,crop:J.crop}; }
  }else if(J.kind==='tend'){
    if(!plot||!plot.crop||plot.stage>=3){ v.job=null; return; }
    if(goFar()){ v.act='walk'; v.actLabel='going to the field'; vMoveTo(v,px,py,dtH); return; }
    v.act='tend'; v.actLabel='tending crops'; J.t=(J.t||0)+dtH;
    if(J.t>=1){ plot.water=1; plot.t+=4; gainSkill(v,'farm',0.03);
      v.job=null; v.lastResult={kind:'tend',ok:true}; }
  }else if(J.kind==='harvest'){
    if(!plot||!plot.crop||(plot.stage!==3&&plot.stage!==4)){ v.job=null;
      v.lastResult={kind:'harvest',ok:false,why:'not ready'}; return; }
    if(goFar()){ v.act='walk'; v.actLabel='going to the field'; vMoveTo(v,px,py,dtH); return; }
    v.act='harvest'; v.actLabel='harvesting '+plot.crop; J.t=(J.t||0)+dtH;
    if(J.t>=1){
      const P=CROPS[plot.crop], wasStage=plot.stage;
      if(wasStage===3){ v.inv.food+=P.food; v.inv.seeds=(v.inv.seeds||0)+P.seedBack; }
      else v.inv.seeds=(v.inv.seeds||0)+1;   // withered: salvage seeds
      gainSkill(v,'farm'); v.job=null;
      v.lastResult={kind:'harvest',ok:true,crop:plot.crop,stage:wasStage,yield:wasStage===3?P.food:0};
      plot.crop=null; plot.stage=0; plot.t=0;
    }
  }
}

/* ---------- hooks into the engine ---------- */
function metabolize(v,dtH){   // the body's native upkeep; farming is honest work too
  const drain=v.age<6?48:96;
  v.hunger=clamp(v.hunger-dtH/drain*(v.pregnant>0?1.35:1),0,1);
  v.energy=clamp(v.energy-dtH/26,0,1);
  v.age+=dtH/8760;
  const maxHp=v.age>70?Math.max(0.08,1-(v.age-70)*0.12):1;
  v.hp=clamp(v.hp+(v.hunger<=0?-dtH/60:v.hunger>0.3?dtH/120:0),0.05,1);
  v.hp=Math.min(v.hp,maxHp);
  if(v.hp<=0.06&&(v.age>70||v.hunger<=0)){
    logEvent('life',v.name+' has died at '+Math.floor(v.age)+'. The valley keeps the bones.');
    const k=villagers.indexOf(v); if(k>=0) villagers.splice(k,1);
  }
}
const _soulTickF=soulTick;
soulTick=function(v,dtH){
  if(!v.speed) v.speed=()=>70*(v.age<14?0.55:1);   // bodies always know their pace
  const J=v.job;
  const farmKind=J&&(J.kind==='till'||J.kind==='plant'||J.kind==='tend'||J.kind==='harvest'||J.kind==='collect');
  const eggEat=J&&J.kind==='eat'&&v.inv.food<=0&&v.inv.berries<2&&(v.inv.eggs||0)>=2;
  if(farmKind){ farmJobTick(v,dtH); }
  else if(eggEat){
    v.act='eat'; v.actLabel='eating eggs'; J.t=(J.t||0)+dtH;   // eggs: food of last resort
    if(J.t>=0.25){ v.inv.eggs-=2; v.hunger=1; v.job=null; }
  }else{
    const wasForage=J&&J.kind==='forage';
    _soulTickF(v,dtH);
    if(wasForage&&!v.job&&Math.random()<0.3) v.inv.seeds=(v.inv.seeds||0)+1;  // seed heads
    return;
  }
  if(villagers.indexOf(v)>=0) metabolize(v,dtH);
};

const _orderF=NV.order;
NV.order=function(name,o){
  const v=vByName(name); if(!v) return 'no such soul';
  const vb=o&&o.verb;
  if(vb==='till'||vb==='plant'||vb==='tend'||vb==='harvest'){
    if(typeof o.wx!=='number'||typeof o.wy!=='number') return 'needs wx,wy';
    const wx=Math.round(o.wx), wy=Math.round(o.wy);
    const cc=cellChunk(wx,wy);
    if(!(cc.c.h[cc.i]>=SEA)) return 'that is water';
    const plot=FARM.plots.find(p=>p.wx===wx&&p.wy===wy);
    if(vb==='till'){
      if(cc.c.tStage[cc.i]>=1) return 'tree in the way — fell it first';
      if(FARM.plots.some(p=>Math.hypot(p.wx-wx,p.wy-wy)<1.5)) return 'already tilled here';
      v.job={kind:'till',wx,wy,t:0}; return 'ok';
    }
    if(!plot) return 'till the soil first';
    if(vb==='plant'){
      if(plot.crop) return 'already planted';
      if(o.crop!=='wheat'&&o.crop!=='carrot') return 'unknown crop (wheat|carrot)';
      const cost=o.crop==='wheat'?2:1;
      if((v.inv.seeds||0)<cost) return 'need '+cost+' seeds';
      v.job={kind:'plant',wx,wy,crop:o.crop,t:0}; return 'ok';
    }
    if(!plot.crop) return 'nothing planted here';
    if(vb==='tend'){
      if(plot.stage>=3||plot.stage===4) return 'nothing to tend';
      v.job={kind:'tend',wx,wy,t:0}; return 'ok';
    }
    if(vb==='harvest'){
      if(plot.stage!==3&&plot.stage!==4) return 'not ready yet';
      v.job={kind:'harvest',wx,wy,t:0}; return 'ok';
    }
  }
  if(vb==='collect'){ v.job={kind:'collect',t:0}; return 'ok'; }
  return _orderF.call(this,name,o);
};

const _snapF=NV.snap;
NV.snap=function(name){
  const s=_snapF(name); if(s.error) return s;
  const v=vByName(name), wx=Math.round(v.x/CS), wy=Math.round(v.y/CS);
  s.see.plots=FARM.plots
    .filter(p=>Math.hypot(p.wx-wx,p.wy-wy)<=60)
    .map(p=>({wx:p.wx,wy:p.wy,crop:p.crop,stage:p.stage,water:+p.water.toFixed(2),
      d:Math.round(Math.hypot(p.wx-wx,p.wy-wy))}));
  s.see.animals=[];
  for(const a of ANIM.chicks){ const d=Math.hypot(a.x-v.x,a.y-v.y)/CS;
    if(d<=60) s.see.animals.push({kind:a.age<0.3?'chick':'chicken',sex:a.sex,d:Math.round(d)}); }
  for(const e of ANIM.eggs){ const d=Math.hypot(e.x-v.x,e.y-v.y)/CS;
    if(d<=60) s.see.animals.push({kind:'egg',d:Math.round(d)}); }
  for(const r of ANIM.rabbits){ const d=Math.hypot(r.x-v.x,r.y-v.y)/CS;
    if(d<=60) s.see.animals.push({kind:'rabbit',d:Math.round(d)}); }
  return s;
};

const _simTickF=simTick;
simTick=function(dtH){ farmTick(dtH); return _simTickF(dtH); };

/* ---------- rendering ---------- */
function drawFarm(){
  const z=cam.zoom, cw=cv.width/dpr, chh=cv.height/dpr;
  const onScr=(wx,wy)=>{ const s=w2s(wx,wy); return s.x>-40&&s.y>-40&&s.x<cw+40&&s.y<chh+40; };
  for(const p of FARM.plots){
    const px=p.wx*CS, py=p.wy*CS;
    if(!onScr(px,py)) continue;
    const s=w2s(px,py), cs=CS*z;
    ctx.fillStyle='#4a3423';
    ctx.fillRect(s.x-cs/2,s.y-cs/2,cs,cs);
    ctx.strokeStyle='#2e2013'; ctx.lineWidth=Math.max(1,1.5*z);
    for(let r=0;r<3;r++){ ctx.beginPath();
      ctx.moveTo(s.x-cs/2+3*z,s.y-cs/2+(r+0.7)*cs/3);
      ctx.lineTo(s.x+cs/2-3*z,s.y-cs/2+(r+0.7)*cs/3); ctx.stroke(); }
    if(p.crop&&p.stage>=1){
      const n=p.stage===1?3:(p.stage===2?5:7);
      for(let k=0;k<n;k++){
        const gx=s.x-cs/2+(k+0.5)*cs/n, gy=s.y+cs/2-4*z;
        const hgt=(p.stage===1?4:(p.stage===2?9:14))*z;
        if(p.stage===4){ ctx.strokeStyle='#6a4a2a'; }
        else if(p.crop==='wheat'&&p.stage===3){ ctx.strokeStyle='#d8a83a'; }
        else { ctx.strokeStyle='#3f8a3a'; }
        ctx.lineWidth=Math.max(1,2*z);
        ctx.beginPath(); ctx.moveTo(gx,gy); ctx.lineTo(gx,gy-hgt); ctx.stroke();
        if(p.stage===3){
          if(p.crop==='wheat'){ ctx.fillStyle='#e8c04a';
            ctx.fillRect(gx-2*z,gy-hgt-3*z,4*z,4*z); }
          else { ctx.fillStyle='#c86a2a';
            ctx.beginPath(); ctx.arc(gx,gy-2*z,2.5*z,0,7); ctx.fill(); }
        }
      }
    }
  }
  for(const e of ANIM.eggs){
    if(!onScr(e.x,e.y)) continue;
    const s=w2s(e.x,e.y);
    ctx.fillStyle='#f4f0e4';
    ctx.beginPath(); ctx.ellipse(s.x,s.y,3*z,4*z,0,0,7); ctx.fill();
    ctx.strokeStyle='#b8b0a0'; ctx.lineWidth=Math.max(1,z);
    ctx.beginPath(); ctx.ellipse(s.x,s.y,3*z,4*z,0,0,7); ctx.stroke();
  }
  for(const a of ANIM.chicks){
    if(!onScr(a.x,a.y)) continue;
    const s=w2s(a.x,a.y), sc=(a.age<0.3?0.5:1)*z;
    if(a.state==='sleep'){ /* huddle: draw smaller, no legs */ }
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(s.x,s.y+5*sc,6*sc,2.5*sc,0,0,7); ctx.fill();
    ctx.fillStyle=a.col;
    ctx.beginPath(); ctx.ellipse(s.x,s.y,6*sc,5*sc,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(s.x+5*sc,s.y-4*sc,3.5*sc,0,7); ctx.fill();
    ctx.fillStyle='#e88a2a';
    ctx.beginPath(); ctx.moveTo(s.x+8*sc,s.y-4*sc); ctx.lineTo(s.x+11*sc,s.y-3*sc);
    ctx.lineTo(s.x+8*sc,s.y-2*sc); ctx.fill();
    ctx.fillStyle='#1a1a1a';
    ctx.fillRect(s.x+5*sc,s.y-5*sc,1.6*sc,1.6*sc);
    if(a.sex==='roo'){ ctx.fillStyle='#c83a2a';
      ctx.fillRect(s.x+3*sc,s.y-9*sc,3*sc,3*sc); }
    if(a.moving&&a.state!=='sleep'){
      ctx.strokeStyle='#c8782a'; ctx.lineWidth=Math.max(1,1.5*sc);
      const lp=(performance.now()/180+a.x)%2<1?1:-1;
      ctx.beginPath(); ctx.moveTo(s.x-2*sc,s.y+5*sc); ctx.lineTo(s.x-2*sc+lp*2*sc,s.y+9*sc); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s.x+2*sc,s.y+5*sc); ctx.lineTo(s.x+2*sc-lp*2*sc,s.y+9*sc); ctx.stroke();
    }
  }
  for(const r of ANIM.rabbits){
    if(!onScr(r.x,r.y)) continue;
    const s=w2s(r.x,r.y), sc=z;
    ctx.fillStyle='rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(s.x,s.y+4*sc,5*sc,2*sc,0,0,7); ctx.fill();
    ctx.fillStyle='#8a7a68';
    ctx.beginPath(); ctx.ellipse(s.x,s.y,5*sc,4*sc,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s.x-3*sc,s.y-7*sc,1.6*sc,4*sc,-0.2,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s.x+1*sc,s.y-7*sc,1.6*sc,4*sc,0.2,0,7); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(s.x+4*sc,s.y-1*sc,1.4*sc,0,7); ctx.fill();
    ctx.fillStyle='#1a1a1a'; ctx.fillRect(s.x+3.4*sc,s.y-1.6*sc,1.2*sc,1.2*sc);
  }
}
const _renderF=render;
render=function(){ _renderF(); drawFarm(); };

/* ---------- genesis stock ---------- */
(function(){
  for(const v of villagers){
    v.inv.seeds=(v.inv.seeds||0)+5; v.inv.eggs=v.inv.eggs||0;
    if(v.skills.farm==null) v.skills.farm=0.25;
  }
  const _av=addVillager;
  addVillager=function(n,sx,a,x,y,c,sk){
    const v=_av(n,sx,a,x,y,c,sk);
    v.inv.seeds=(v.inv.seeds||0)+5; v.inv.eggs=v.inv.eggs||0;   // newcomers carry seed grain
    if(v.skills.farm==null) v.skills.farm=0.25;
    return v;
  };
  if(BUILD.huts[0]){
    const hx=(BUILD.huts[0].wx+1)*CS, hy=(BUILD.huts[0].wy+1)*CS;
    const sexes=['hen','hen','hen','roo'];
    for(let k=0;k<4;k++)
      ANIM.chicks.push(mkChick(hx+(Math.random()-0.5)*6*CS,hy+(Math.random()-0.5)*6*CS,sexes[k],1));
  }
  for(let k=0;k<6;k++){
    const a=Math.random()*6.28, r=15+Math.random()*25;
    const wx=SETTLE.wx+Math.round(Math.cos(a)*r), wy=SETTLE.wy+Math.round(Math.sin(a)*r);
    const cc=cellChunk(wx,wy);
    if(cc.c.h[cc.i]>=SEA)
      ANIM.rabbits.push({x:wx*CS,y:wy*CS,age:1,state:'wander',t:Math.random()*8,tx:null,ty:null});
  }
  logEvent('life','Seed grain and half-wild hens come with the new spring.');
})();
}
