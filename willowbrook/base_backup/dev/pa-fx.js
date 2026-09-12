/* =====================================================================
   PA-FX v6 — ambient effects: chimney smoke, fireflies, dust.
   Particle kinds: 'smoke' | 'firefly' | 'dust' | undefined (legacy).
   Logic identical to previous version; only the smoke sprite ART was
   upgraded to the v6 hand-crafted style (layered cool-grey puffs with
   warm upper-left rim light and crisp dithered edges).
   ===================================================================== */
function buildFx(){
  // smoke puffs: 3 hand-crafted pixel blobs (14x14 native)
  PA.fx.smoke=[];
  const puffs=[
    {blobs:[[7,7,5],[6,6,4],[5,5,3]], hi:[[4,3],[5,4]], dk:[[9,9,2]]},
    {blobs:[[7,8,5],[8,6,4],[6,5,3]], hi:[[5,3],[6,4]], dk:[[9,10,2],[4,10,1]]},
    {blobs:[[7,7,6],[6,6,4],[8,7,3]], hi:[[4,4],[5,3]], dk:[[10,9,2]]},
  ];
  for(let v=0;v<3;v++){
    const s=document.createElement('canvas'); s.width=14; s.height=14;
    const g=s.getContext('2d');
    g.imageSmoothingEnabled=false;
    const pf=puffs[v];
    // cool grey body, darker underneath
    paBlob(g,pf.blobs[0][0],pf.blobs[0][1],pf.blobs[0][2],'#8f959e');
    for(const [bx,by,br] of pf.dk) paBlob(g,bx,by,br,'#7a8088');
    paBlob(g,pf.blobs[1][0],pf.blobs[1][1],pf.blobs[1][2],'#b4b9c1');
    paBlob(g,pf.blobs[2][0],pf.blobs[2][1],pf.blobs[2][2],'#d8dbe0');
    // dithered ragged edge (crisp, no blur)
    paDithBayer(g,1,1,12,12,'#8f959e','#a8adb5',0.5);
    paBlob(g,pf.blobs[1][0],pf.blobs[1][1],pf.blobs[1][2]-1,'#bcc1c9');
    // warm rim light upper-left
    for(const [hx,hy] of pf.hi) paPX(g,hx,hy,'#fff2d8');
    paPX(g,pf.hi[0][0],pf.hi[0][1]+1,'#e8d9b8');
    PA.fx.smoke.push(s);
  }
}
function paBlobPx(g,cx,cy,r,col){
  g.fillStyle=col;
  for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)
    if(i*i+j*j<=r*r) g.fillRect(cx+i,cy+j,1,1);
}

function paFxUpdate(dt){
  paFxUpdate._t=(paFxUpdate._t||0)+dt;
  if(paFxUpdate._t>0.4){
    paFxUpdate._t=0;
    // chimney smoke
    for(const b of buildings){
      if(b._chimney&&G.particles.length<200&&Math.random()<0.55){
        G.particles.push({kind:'smoke',x:b._chimney.x+rand(-3,3),y:b._chimney.y,
          vx:rand(-5,5),vy:rand(-26,-16),life:rand(1.8,2.6),maxLife:2.6,size:rand(4,6)});
      }
    }
    // fireflies at night over grass
    if(darkness()>0.55&&G.particles.length<230){
      for(let i=0;i<3;i++){
        G.particles.push({kind:'firefly',x:rand(60,WORLD_W-60),y:rand(60,WORLD_H-60),
          vx:rand(-12,12),vy:rand(-10,10),life:rand(4,7),maxLife:7,seed:Math.random()*10});
      }
    }
  }
  // footstep dust for the controlled villager
  const cv=(typeof controlledVillager==='function')?controlledVillager():null;
  if(cv&&cv.state==='walk'&&Math.random()<dt*5&&G.particles.length<240){
    G.particles.push({kind:'dust',x:cv.x+rand(-6,6),y:cv.y,
      vx:rand(-8,8),vy:rand(-14,-4),life:rand(0.4,0.8),maxLife:0.8});
  }
}

function paUpdateParticles(dt){
  for(let i=G.particles.length-1;i>=0;i--){
    const p=G.particles[i];
    if(p.kind==='smoke'){
      p.x+=p.vx*dt+Math.sin(p.life*5)*10*dt;
      p.y+=p.vy*dt; p.vy=Math.max(p.vy-8*dt,-34);
      p.life-=dt*0.5; p.size+=dt*3.2;
    }else if(p.kind==='firefly'){
      p.seed+=dt;
      p.x+=p.vx*dt+Math.sin(p.seed*2.1)*16*dt;
      p.y+=p.vy*dt+Math.cos(p.seed*1.7)*12*dt;
      if(Math.random()<dt*0.7){ p.vx=rand(-14,14); p.vy=rand(-10,10); }
      p.life-=dt*0.25;
    }else if(p.kind==='dust'){
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt*1.25;
    }else{
      p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=160*dt; p.life-=dt*1.4;
    }
    if(p.life<=0) G.particles.splice(i,1);
  }
}

function paDrawParticles(g){
  for(const p of G.particles){
    if(p.kind==='smoke'){
      const a=clamp(p.life/(p.maxLife||2),0,1)*0.32;
      const spr=PA.fx.smoke[Math.floor(p.life*3)%3];
      g.globalAlpha=a;
      const s=p.size*2;
      g.drawImage(spr, p.x-s/2, p.y-s/2, s, s);
      g.globalAlpha=1;
    }else if(p.kind==='firefly'){
      const bl=0.45+0.55*Math.sin(p.seed*6);
      g.globalAlpha=clamp(p.life,0,1)*bl;
      g.fillStyle='#eaffa0';
      g.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,2,2);
      g.fillStyle='rgba(234,255,160,0.35)';
      g.fillRect(Math.round(p.x)-2,Math.round(p.y)-2,5,5);
      g.globalAlpha=1;
    }else if(p.kind==='dust'){
      g.globalAlpha=clamp(p.life/(p.maxLife||0.8),0,1)*0.5;
      g.fillStyle='#d9c9a0';
      g.fillRect(Math.round(p.x)-1,Math.round(p.y)-1,3,2);
      g.globalAlpha=1;
    }else{
      g.globalAlpha=clamp(p.life,0,1);
      g.fillStyle=p.color; g.fillRect(p.x-2,p.y-2,4,4);
      g.globalAlpha=1;
    }
  }
}
