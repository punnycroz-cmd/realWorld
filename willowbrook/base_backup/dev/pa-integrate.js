/* =====================================================================
   PA-INTEGRATE — boot order, replacement renderers, decorative objects.
   Replaces: prerenderGround, drawBuilding, drawObject, drawVillager,
   particle update/draw. Adds: PAinit(), paAddDecor(), paDrawWater().
   ===================================================================== */

/* ---------------- BOOT ---------------- */
function PAinit(){
  buildTerrain(); buildVeg(); buildProps(); buildBuildingArt(); buildChars(); buildFx();
  // stable per-object art variants
  for(const o of objects) o._v=Math.floor(phash(o.x,o.y,42)*100);
  // building glow + chimney world positions (native px: canvas origin + spot)
  for(const b of buildings){
    const P=PA.bld[b.id]; if(!P) continue;
    b._glowSpots=P.dGlow.map(s=>({x:px(b.tx)+P.ox+s.x, y:py(b.ty)+P.oy+s.y}));
    if(P.chimTop) b._chimney={x:px(b.tx)+P.ox+P.chimTop.x, y:py(b.ty)+P.oy+P.chimTop.y};
  }
  paAddDecor();
  buildCollision();
  buildDrawables();
  ctx.imageSmoothingEnabled=false;
  PA.ready=true;
}

/* ---------------- DECORATIVE OBJECTS ----------------
   Positions in tile coords; verified away from door tiles and path spurs. */
function paAddDecor(){
  const addObjL=(kind,tx,ty,opts)=>{
    const o=Object.assign({kind,x:px(tx)+TILE/2,y:py(ty)+TILE,w:TILE,h:TILE,_v:Math.floor(phash(tx,ty,7)*100)},opts||{});
    objects.push(o); return o;
  };
  // farm props
  addObjL('haybale',10.5,26.2); addObjL('haybale',13.6,26.4);
  addObjL('firewood',16.2,18.6); addObjL('firewood',24.6,16.2);
  // flower boxes flanking doors
  addObjL('flowerbox',22.6,13.4); addObjL('flowerbox',41.4,13.4);
  addObjL('flowerbox',29.6,17.4); addObjL('flowerbox',31.6,37.4);
  // bucket by the well
  addObjL('bucket',30.2,24.4);
  // mushrooms at forest edge
  addObjL('mushroom',2.5,8.5); addObjL('mushroom',60.5,12.3); addObjL('mushroom',3.2,40.5);
  // reeds on pond/stream shores
  addObjL('reeds',45.5,33.5); addObjL('reeds',55,30.5);
  addObjL('reeds',46.2,40.5); addObjL('reeds',49.2,44.5);
  // stump + fallen log
  addObjL('stump',5.5,20.5); addObjL('log',58,36.5);
  // scattered grass tufts on plain grass
  let n=0;
  for(let ty=2;ty<MH-2&&n<60;ty++)for(let tx=2;tx<MW-2&&n<60;tx++){
    if(tileAt(tx,ty)!==T_GRASS) continue;
    if(phash(tx,ty,99)<0.72) continue;
    addObjL('tuft',tx+0.15+phash(tx,ty,3)*0.7,ty+0.15+phash(tx,ty,5)*0.7);
    n++;
  }
}

/* ---------------- GROUND PRERENDER (replaces old) ---------------- */
function prerenderGround(){
  groundCanvas = makeCanvas(WORLD_W, WORLD_H);
  const g = groundCanvas.getContext('2d');
  g.imageSmoothingEnabled=false;
  PA.waterTiles=[];
  const pathLike=(x,y)=>{ const t=tileAt(x,y); return t===T_PATH||t===T_BRIDGE; };
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=tiles[y*MW+x], X=x*TILE, Y=y*TILE;
    const hv=phash(x,y,7);
    if(t===T_WATER){ PA.waterTiles.push({tx:x,ty:y,shore:0}); continue; }
    let spr=null;
    if(t===T_GRASS){
      if(x<4||y<4||x>=MW-4||y>=MH-4) spr=PA.terrain.darkgrass[Math.floor(hv*3)%3];
      else spr=PA.terrain.grass[Math.floor(hv*4)%4];
    }else if(t===T_PATH){
      const dx=x-32, dy=y-24;
      if(dx*dx+dy*dy<=26) spr=PA.terrain.cobble[Math.floor(hv*2)%2];
      else{
        let m=0;
        if(pathLike(x,y-1))m|=1; if(pathLike(x,y+1))m|=2;
        if(pathLike(x-1,y))m|=4; if(pathLike(x+1,y))m|=8;
        spr=PA.terrain.path[m];
      }
    }
    else if(t===T_BRIDGE) spr=PA.terrain.bridge[Math.floor(hv*2)%2];
    else if(t===T_TILLED) spr=PA.terrain.tilled[Math.floor(hv*2)%2];
    else if(t===T_SAND) spr=PA.terrain.sand[Math.floor(hv*2)%2];
    else if(t===T_FLOOR) spr=PA.terrain.floor;
    if(spr) g.drawImage(spr.c,X,Y);
  }
  for(const w of PA.waterTiles){
    let m=0;
    if(tileAt(w.tx,w.ty-1)!==T_WATER)m|=1;
    if(tileAt(w.tx,w.ty+1)!==T_WATER)m|=2;
    if(tileAt(w.tx-1,w.ty)!==T_WATER)m|=4;
    if(tileAt(w.tx+1,w.ty)!==T_WATER)m|=8;
    w.shore=m;
  }
  // minimap ground (unchanged logic)
  miniGround=document.createElement('canvas'); miniGround.width=MW; miniGround.height=MH;
  const mg=miniGround.getContext('2d');
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    const t=tiles[y*MW+x];
    mg.fillStyle=t===T_WATER?'#3f7fc4':t===T_PATH||t===T_BRIDGE?'#c9a26b':t===T_SAND?'#e0cf9e':t===T_TILLED?'#6b4a2e':'#5a9e4a';
    mg.fillRect(x,y,1,1);
  }
}

/* ---------------- WATER (per-frame, in world space) ---------------- */
function paDrawWater(g,cx,cy,CW,CH){
  const wf=PA.terrain.water[(G.frame>>3)%4];
  const ff=(G.frame>>4)%2;
  const x0=Math.max(0,Math.floor(cx/TILE)-1), x1=Math.min(MW-1,Math.ceil((cx+CW)/TILE)+1);
  const y0=Math.max(0,Math.floor(cy/TILE)-1), y1=Math.min(MH-1,Math.ceil((cy+CH)/TILE)+1);
  for(const w of PA.waterTiles){
    if(w.tx<x0||w.tx>x1||w.ty<y0||w.ty>y1) continue;
    g.drawImage(wf.c, w.tx*TILE, w.ty*TILE);
    if(w.shore) g.drawImage(PA.terrain.shore[w.shore][ff].c, w.tx*TILE, w.ty*TILE);
  }
}

/* ---------------- BUILDING (replaces old drawBuilding) ---------------- */
function drawBuilding(g,b,dark){
  const P=PA.bld[b.id]; if(!P) return;
  const X=Math.round(px(b.tx)+P.ox), Y=Math.round(py(b.ty)+P.oy);
  g.imageSmoothingEnabled=false;
  g.drawImage(P.day.c,X,Y);
  if(dark>0.02){
    g.globalAlpha=Math.min(1,dark*1.25);
    g.drawImage(P.night.c,X,Y);
    g.globalAlpha=1;
  }
}

/* ---------------- OBJECTS (replaces old drawObject) ---------------- */
const _flowerMap={'#e86a8a':'pink','#f2d06b':'yellow','#ffffff':'white','#b678e0':'purple'};
function drawObject(g,o){
  const night=darkness()>0.45;
  const V=PA.veg, Pp=PA.props;
  const v=o._v||0;
  g.imageSmoothingEnabled=false;
  switch(o.kind){
    case 'tree': paBlitBC(g,V.tree[v%4],o.x,o.y); break;
    case 'pine': paBlitBC(g,V.pine[v%3],o.x,o.y); break;
    case 'bush': paBlitBC(g,V.bush[v%3],o.x,o.y); break;
    case 'flower': paBlitBC(g,V.flower[_flowerMap[o.c]||'yellow'],o.x,o.y); break;
    case 'rock': paBlitBC(g,V.rock[v%3],o.x,o.y); break;
    case 'mushroom': paBlitBC(g,V.mushroom[v%2],o.x,o.y); break;
    case 'reeds': paBlitBC(g,V.reeds[v%2],o.x,o.y); break;
    case 'stump': paBlitBC(g,V.stump,o.x,o.y); break;
    case 'log': paBlitBC(g,V.log,o.x,o.y); break;
    case 'tuft': paBlitBC(g,V.tuft[v%3],o.x,o.y); break;
    case 'well': paBlitBC(g,Pp.well.spr,o.x,o.y,Pp.well.lift); break;
    case 'bench': paBlitBC(g,Pp.bench.spr,o.x,o.y,Pp.bench.lift); break;
    case 'barrel': paBlitBC(g,Pp.barrel.variants[v%2],o.x,o.y); break;
    case 'crate': paBlitBC(g,Pp.crate.variants[v%2],o.x,o.y); break;
    case 'sign': paBlitBC(g,Pp.sign.spr,o.x,o.y,Pp.sign.lift); break;
    case 'stall': paBlitBC(g,Pp.stall.spr,o.x,o.y,Pp.stall.lift); break;
    case 'anvil': paBlitBC(g,Pp.anvil.spr,o.x,o.y,Pp.anvil.lift); break;
    case 'grindstone': paBlitBC(g,Pp.grindstone.spr,o.x,o.y,Pp.grindstone.lift); break;
    case 'dockpost': paBlitBC(g,Pp.dockpost.spr,o.x,o.y,Pp.dockpost.lift); break;
    case 'haybale': paBlitBC(g,Pp.haybale.spr,o.x,o.y,Pp.haybale.lift); break;
    case 'firewood': paBlitBC(g,Pp.firewood.spr,o.x,o.y,Pp.firewood.lift); break;
    case 'flowerbox': paBlitBC(g,Pp.flowerbox.spr,o.x,o.y,Pp.flowerbox.lift); break;
    case 'bucket': paBlitBC(g,Pp.bucket.spr,o.x,o.y,Pp.bucket.lift); break;
    case 'fence': paBlitBC(g,Pp.fenceH.spr,o.x,o.y,Pp.fenceH.lift); break;
    case 'lamp':{
      const on=night;
      paBlitBC(g,on?Pp.lamp.on:Pp.lamp.off,o.x,o.y,Pp.lamp.lift);
      o._glow=on?{x:o.x,y:o.y-37,r:70}:null;
      break;
    }
    case 'crop':{
      const st=o.growth<0.25?0:o.growth<0.85?1:2;
      const sw=o.growth>0.85?(G.frame>>4)%2:0;
      const spr=(o.cropKind==='herb'?V.herb:V.crop)[st][sw];
      paBlitBC(g,spr,o.x,o.y);
      break;
    }
  }
}

/* ---------------- VILLAGER (replaces old drawVillager) ---------------- */
function drawVillager(g,v){
  const sx=v.state==='sit'&&v.sitAt?v.sitAt.x:v.x;
  const sy=v.state==='sit'&&v.sitAt?v.sitAt.y:v.y;
  // soft ground shadow
  g.fillStyle='rgba(0,0,0,0.25)';
  g.beginPath(); g.ellipse(sx,sy+2,11,4.5,0,0,7); g.fill();
  // selection ring
  if(v===controlledVillager()){
    g.save();
    g.strokeStyle='#ffd94a'; g.lineWidth=2;
    g.setLineDash([6,4]); g.lineDashOffset=-G.frame*0.3;
    g.beginPath(); g.ellipse(sx,sy+2,16,7,0,0,7); g.stroke();
    g.restore();
  }
  paCharDraw(g,v);
  // name tag (kept from old renderer)
  const name=v.name+(v.isNPC?'':' (you)');
  ctx.font='11px system-ui'; const tw=ctx.measureText(name).width;
  ctx.fillStyle='rgba(20,16,10,0.65)';
  roundRect(ctx,sx-tw/2-5,sy-84,tw+10,16,7); ctx.fill();
  ctx.fillStyle='#ffe9b8'; ctx.textAlign='center';
  ctx.fillText(name,sx,sy-72);
}
