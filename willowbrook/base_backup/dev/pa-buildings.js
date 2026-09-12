/* =====================================================================
   PA-BUILDINGS v7 — chunky cozy storybook buildings (native px).
   Style: 2px-cluster painting, thick dark-brown outlines, per-tile
   shaded roofs, brick chimneys, warm lit windows at night.
   Same 11 buildings, footprints & door/window placement preserved.
   ===================================================================== */

const V7_LINE = '#3a2418'; // dark brown outline (not pure black)

/* night-aware palette: darkened cool bases, ramps regenerated */
function bldPal(base, night){
  const dk = c => night ? mix(shade(c,0.40),'#2a3350',0.38) : c;
  return {
    night,
    wall: rampOf(dk(base.wall)),
    roof: rampOf(dk(base.roof)),
    trim: dk(base.trim),
    wood: night ? rampOf(dk('#8a6a45')) : MAT.wood,
    stone: night ? rampOf(dk('#8d8d94')) : MAT.stone,
    brick: rampOf(dk('#a34d3a')),
  };
}
/* chunky 2px-cluster rect (snaps to even grid) */
function v7R(g,x,y,w,h,col){
  if(col==null) return;
  x=Math.round(x/2)*2; y=Math.round(y/2)*2;
  w=Math.max(2,Math.round(w/2)*2); h=Math.max(2,Math.round(h/2)*2);
  g.fillStyle=col; g.fillRect(x,y,w,h);
}
function v7Outline(c){ paOutline(c, V7_LINE); }

/* ---- chunky scalloped roof tiles, clipped to the gable triangle ----
   style: 'tile' | 'thatch' | 'slate' | 'shingle' */
function v7Roof(g, apexX, apexY, roofH, hwMax, ramp, style, key, night){
  // dark base under the tiles (shows through scallop gaps as tile shadow)
  for(let ry=0; ry<roofH; ry+=2){
    const hw=Math.max(2, Math.round(hwMax*(ry+2)/roofH));
    v7R(g, apexX-hw, apexY+ry, hw*2, 2, ramp[1]);
  }
  const TWH=12, TH=12;
  for(let ry=0; ry<roofH; ry+=2){
    const hw=Math.max(2, Math.round(hwMax*(ry+2)/roofH));
    const row=Math.floor(ry/TH), off=(row%2)*(TWH/2);
    for(let rx=apexX-hw; rx<apexX+hw; rx+=2){
      const tileX=Math.floor((rx+off)/TWH), tx0=tileX*TWH-off;
      const dx=(rx-tx0)/TWH, dy=(ry-row*TH)/TH;
      if(dy>0.70 && (dx<0.20||dx>0.80)) continue; // scalloped bottom edge
      const j=phash(tileX,row,key), left=rx<apexX;
      let col=j<0.30?ramp[3]:(j<0.62?ramp[4]:ramp[2]);
      if(dy<0.24) col=left?ramp[5]:ramp[4];        // tile top highlight
      else if(dy>0.76) col=left?ramp[2]:ramp[1];   // tile bottom shade
      else if(dx>0.84) col=ramp[1];               // right gap
      else if(dx<0.14) col=left?ramp[5]:ramp[3];   // left edge light
      if(style==='thatch'){                        // straw strokes
        const s=phash(tileX*7+Math.floor(dx*6), row*3+Math.floor(dy*4), key+5);
        if(s<0.28) col=ramp[5]; else if(s>0.86) col=ramp[2];
      } else if(style==='slate'){
        if(j>0.85 && dy>0.30 && dy<0.62) col=ramp[5];
      }
      if(!left) col=mix(col, ramp[1], 0.22);       // right slope cooler/darker
      if(night) col=mix(col, '#1a2038', 0.12);
      v7R(g,rx,apexY+ry,2,2,col);
    }
  }
  // apex cap: short ridge cap + flashing at the apex point ONLY.
  // The roof face itself stays clean, uninterrupted tile courses.
  v7R(g,apexX-8,apexY-2,16,6,ramp[3]);
  v7R(g,apexX-8,apexY-2,16,2,ramp[5]);
  v7R(g,apexX-8,apexY+2,16,2,ramp[1]);
  paBlob(g,apexX,apexY+6,3,ramp[4]);
  paPX(g,apexX-1,apexY-1,ramp[6]);
}

/* ---- chunky walls: plaster / wood / stone ---- */
function v7Walls(g, spec, pal, R){
  const {ox,W,wallY,wallB}=R, wallH=wallB-wallY;
  const kind=spec.wallKind||'plaster';
  if(kind==='plaster'){
    v7R(g,ox+2,wallY+2,W-4,wallH-4,pal.wall[3]);
    for(let y=wallY+4;y<wallB-6;y+=4) for(let x=ox+6;x<ox+W-8;x+=4){
      const t=phash(x,y,spec.key||8);
      if(t<0.16) v7R(g,x,y,4,4,pal.wall[4]);
      else if(t>0.86) v7R(g,x,y,4,4,pal.wall[2]);
    }
  } else if(kind==='wood'){
    for(let py=wallY+2; py<wallB-2; py+=10){
      v7R(g,ox+2,py,W-4,10,pal.wall[3]);
      v7R(g,ox+2,py,W-4,2,pal.wall[5]);
      v7R(g,ox+2,py+8,W-4,2,pal.wall[1]);
      const t=phash(py,ox,spec.key||8);
      if(t<0.40){
        const gx=ox+6+Math.floor(phash(py,3,81)*(W-20));
        v7R(g,gx,py+4,8+Math.floor(phash(3,py,82)*14),2,pal.wall[2]);
      }
      if(t>0.70){
        const kx=ox+8+Math.floor(phash(py,5,83)*(W-24));
        v7R(g,kx,py+4,4,4,pal.wall[1]); v7R(g,kx,py+4,4,2,pal.wall[4]);
      }
    }
  } else { // stone: chunky blocks with dark mortar
    v7R(g,ox+2,wallY+2,W-4,wallH-4,pal.stone[1]);
    for(let ry=wallY+2,row=0; ry<wallB-2; ry+=12, row++){
      const off=(row%2)*10;
      for(let rx=ox+2-20+off; rx<ox+W-2; rx+=20){
        const t=phash(rx,ry,spec.key||8);
        const body=t<0.35?pal.stone[3]:(t<0.70?pal.stone[4]:pal.stone[2]);
        v7R(g,rx+2,ry+2,16,8,body);
        v7R(g,rx+2,ry+2,16,2,t<0.70?pal.stone[5]:pal.stone[3]);
        v7R(g,rx+2,ry+8,16,2,pal.stone[1]);
      }
    }
  }
  // form: warm light band on top, cool shade at bottom-right
  v7R(g,ox+2,wallY+2,W-4,4,mix(pal.wall[4],'#ffffff',0.12));
  v7R(g,ox+2,wallB-6,W-4,4,pal.wall[1]);
  for(let y=wallY+8;y<wallB-8;y+=4) v7R(g,ox+W-8,y,6,4,pal.wall[1]);
  // timber framing
  if(spec.timber){
    const T=pal.wood;
    for(let i=1;i<4;i++){
      const tx=Math.round((ox+4+i*(W-8)/4)/2)*2;
      v7R(g,tx-3,wallY+2,6,wallH-4,T[2]);
      v7R(g,tx-3,wallY+2,2,wallH-4,T[4]);
      v7R(g,tx+1,wallY+2,2,wallH-4,T[1]);
      paBlob(g,tx,wallY+10,2,'#2e2118'); paBlob(g,tx,wallB-10,2,'#2e2118');
      paPX(g,tx-1,wallY+9,T[5]);
    }
    const my=Math.round((wallY+wallH/2)/2)*2;
    v7R(g,ox+2,my-3,W-4,6,T[2]);
    v7R(g,ox+2,my-3,W-4,2,T[4]);
  }
  // chunky stone foundation
  v7R(g,ox+2,wallB-8,W-4,10,pal.stone[2]);
  for(let rx=ox+4; rx<ox+W-8; rx+=16){
    const t=phash(rx,wallB,spec.key||11);
    v7R(g,rx,wallB-6,12,6,t<0.5?pal.stone[3]:pal.stone[4]);
    v7R(g,rx,wallB-6,12,2,pal.stone[5]);
  }
}

/* ---- chunky window; returns glass center for glow spots ---- */
function v7Window(g,x,y,pal,shutCol){
  const w=20, h=24;
  v7R(g,x-6,y-6,w+12,h+14,pal.trim);
  v7R(g,x-6,y-6,w+12,4,mix(pal.trim,'#ffffff',0.20));
  v7R(g,x-8,y+h+6,w+16,6,pal.stone[3]);
  v7R(g,x-8,y+h+6,w+16,2,pal.stone[5]);
  v7R(g,x,y,w,h,V7_LINE);
  if(pal.night){
    paGradV(g,x+2,y+2,w-4,h-4,['#ffe9a8','#ffca6a','#e89a3e']);
    v7R(g,x+2,y+2,6,h-4,'#8a5a2e'); v7R(g,x+w-8,y+2,6,h-4,'#8a5a2e');
    paBlob(g,x+w/2,y+h/2,4,'#fff6d8');
  } else {
    paGradV(g,x+2,y+2,w-4,h-4,['#b8d8f0','#7aa8cc','#4e7a9e']);
    paLine(g,x+4,y+h-4,x+w-4,y+4,'#eaf6ff');
    v7R(g,x+2,y+2,6,h-4,'#e8dcc0'); v7R(g,x+w-8,y+2,6,h-4,'#e8dcc0');
  }
  v7R(g,x+w/2-2,y+2,4,h-4,pal.trim);
  v7R(g,x+2,y+h/2-2,w-4,4,pal.trim);
  if(shutCol){
    const dk=pal.night?mix(shade(shutCol,0.40),'#2a3350',0.38):shutCol;
    const S=rampOf(dk);
    for(const s of [-1,1]){
      const sx=s<0?x-6-12:x+w+6;
      v7R(g,sx,y-4,12,h+10,S[2]);
      for(let py=y-2;py<y+h+2;py+=8) v7R(g,sx,py,12,2,S[1]);
      v7R(g,sx,y-4,12,2,S[4]);
      paBlob(g,sx+6,y+2,2,'#2e2118'); paBlob(g,sx+6,y+h-2,2,'#2e2118');
    }
  }
  return {x:x+w/2, y:y+h/2};
}

/* ---- chunky door ---- */
function v7Door(g,cx,baseY,w,h,pal,lit){
  const x=Math.round(cx-w/2), y=baseY-h;
  const Wd=pal.wood;
  v7R(g,x-4,y-6,w+8,6,pal.trim);
  v7R(g,x-4,y-6,w+8,2,mix(pal.trim,'#ffffff',0.20));
  v7R(g,x-2,y,w+4,h+2,V7_LINE);
  for(let px=x;px<x+w;px+=8){
    v7R(g,px,y,8,h,Wd[3]);
    v7R(g,px,y,2,h,Wd[4]); v7R(g,px+6,y,2,h,Wd[1]);
  }
  for(const by of [y+6,y+h-8]){
    v7R(g,x,by,w,4,MAT.ironDark[2]);
    v7R(g,x,by,w,2,MAT.ironDark[4]);
    for(let sx=x+6;sx<x+w-2;sx+=10) paBlob(g,sx,by+2,2,MAT.metal[4]);
  }
  paBlob(g,x+w-8,y+Math.round(h/2),4,MAT.ironDark[1]);
  paBlob(g,x+w-8,y+Math.round(h/2),2.5,MAT.metal[4]);
  paPX(g,x+w-9,y+Math.round(h/2)-1,MAT.metal[6]);
  v7R(g,x-6,baseY,w+12,6,pal.stone[3]);
  v7R(g,x-6,baseY,w+12,2,pal.stone[5]);
  if(lit&&pal.night){
    v7R(g,x+w/2-2,y+2,4,h-4,'#ffca6a');
  } else if(lit){
    v7R(g,x+w/2-2,y+2,4,h-4,'#3a2c1c');
  }
}

/* ---- brick chimney; returns top pos for smoke ---- */
function v7Chimney(g,chx,topY,botY,pal){
  const w=18, B=pal.brick;
  v7R(g,chx-w/2,topY,w,botY-topY,B[1]);
  for(let ry=topY,row=0; ry<botY; ry+=6, row++){
    const off=(row%2)*5;
    for(let rx=chx-w/2+off; rx<chx+w/2; rx+=10){
      const t=phash(rx,ry,15);
      v7R(g,rx+1,ry+1,8,4,t<0.5?B[3]:B[4]);
      v7R(g,rx+1,ry+1,8,2,B[5]);
    }
  }
  v7R(g,chx-w/2-2,topY-8,w+4,8,pal.stone[2]);
  v7R(g,chx-w/2-2,topY-8,w+4,2,pal.stone[5]);
  v7R(g,chx-5,topY-18,10,10,MAT.ironDark[2]);
  v7R(g,chx-5,topY-18,10,2,MAT.ironDark[4]);
  return {x:chx, y:topY-18};
}
/* ---- chunky lantern; pushes glow spot at night ---- */
function v7Lantern(g,x,y,pal,glowSpots){
  v7R(g,x-2,y-10,4,8,MAT.ironDark[2]);
  v7R(g,x-6,y-4,12,4,MAT.ironDark[1]);
  v7R(g,x-6,y-4,12,2,MAT.ironDark[4]);
  v7R(g,x-4,y,8,10,MAT.ironDark[2]);
  if(pal.night){ texGlow(g,x,y+5,5); glowSpots.push({x:x,y:y+5}); }
  else { v7R(g,x-3,y+1,6,8,'#8a94a0'); v7R(g,x-3,y+1,2,8,'#c8d4e0'); }
  v7R(g,x-6,y+10,12,2,MAT.ironDark[1]);
}
function v7Finial(g,x,y,pal){
  v7R(g,x-2,y-12,4,12,MAT.ironDark[2]);
  paBlob(g,x,y-14,4,MAT.brass[3]); paPX(g,x-1,y-15,MAT.brass[6]);
}

/* ---------------- master composer (native px) ---------------- */
function composeBuilding(spec){
  const out={};
  for(const night of [false,true]){
    const pal=bldPal(spec.base,night);
    const W=spec.tw*32, H=spec.th*32;
    const s=paMk(W+32,H+80), g=s.g;
    const ox=16, oy=60;
    paGroundShadow(g,ox+W/2,oy+H-2,W/2+10,7);
    const wallY=Math.round(oy+H*0.36), wallB=oy+H-4, wallH=wallB-wallY;
    const roofBase=Math.round(oy+H*0.40), roofH=Math.round(H*0.44);
    const R={ox,W,wallY,wallB,wallH,roofBase,roofH,apexX:ox+W/2,apexY:roofBase-roofH};
    // chimney behind roof
    let chimTop=null;
    if(spec.chimneyX!=null){
      const chx=ox+spec.chimneyX*2;
      chimTop=v7Chimney(g,chx,roofBase-roofH-10,roofBase+6,pal);
    }
    v7Walls(g,spec,pal,R);
    v7Roof(g,R.apexX,R.apexY,roofH,Math.round(W/2+8),pal.roof,spec.roofStyle,spec.key||7,night);
    // eave beam + shadow on wall top
    v7R(g,R.apexX-Math.round(W/2+8),roofBase,Math.round(W/2+8)*2,6,pal.wood[2]);
    v7R(g,R.apexX-Math.round(W/2+8),roofBase,Math.round(W/2+8)*2,2,pal.wood[4]);
    // door
    const doorW=(spec.doorW||11)*2, doorH=32;
    const dcx=ox+W/2, dBase=wallB+2;
    v7Door(g,dcx,dBase,doorW,doorH,pal,spec.litDoor);
    // windows + lantern
    const glowSpots=[];
    if(spec.lantern) v7Lantern(g,dcx+doorW/2+14,dBase-24,pal,glowSpots);
    for(const wspec of spec.winOff){
      const off=(typeof wspec==='number'?wspec:wspec.off)*2;
      const wx=ox+W/2+off-10, wy=wallY+Math.round(wallH*0.20);
      const c2=v7Window(g,wx,wy,pal,typeof wspec==='object'?wspec.shut:null);
      glowSpots.push({x:c2.x,y:c2.y});
    }
    if(spec.litDoor) glowSpots.push({x:dcx,y:dBase-doorH/2});
    if(spec.finial) v7Finial(g,R.apexX,R.apexY,pal);
    if(spec.extras) spec.extras(g,pal,{ox,oy,W,H,wallY,wallB,wallH,roofBase,roofH,apexX:R.apexX,apexY:R.apexY,night,glowSpots,chimTop});
    // chunky grass tufts + tiny flowers at the base
    for(let i=0;i<W/16;i++){
      const bx=Math.round((ox+8+i*16+Math.floor(phash(i,spec.key||0,71)*8))/2)*2;
      if(Math.abs(bx-dcx)<doorW/2+10) continue;
      const t=phash(i,7,72);
      v7R(g,bx-4,wallB-2,4,6,MAT.leaf[2]);
      v7R(g,bx,wallB-4,4,8,MAT.leaf[3]);
      v7R(g,bx+4,wallB-2,4,6,MAT.leaf[2]);
      if(t<0.35) paPX(g,bx+1,wallB-6,pchoice(['#e86a8a','#f2d06b','#ffffff']));
    }
    v7Outline(s.c);
    out[night?'night':'day']=s;
    out[night?'nGlow':'dGlow']=glowSpots;
    if(!night&&chimTop) out.chimTop=chimTop;
  }
  out.ox=-16; out.oy=-60;
  return out;
}

/* ---- chunky base props shared by extras ---- */
function v7Barrel(g,x,y,pal){
  const Wd=pal.wood;
  v7R(g,x,y,20,26,Wd[2]);
  for(let px=x+2;px<x+18;px+=4) v7R(g,px,y,2,26,Wd[3]);
  v7R(g,x,y,20,4,Wd[4]); v7R(g,x,y+22,20,4,Wd[1]);
  v7R(g,x,y+7,20,3,MAT.ironDark[2]); v7R(g,x,y+16,20,3,MAT.ironDark[2]);
}
function v7Crate(g,x,y,s,pal){
  const Wd=pal.wood;
  v7R(g,x,y,s,s,Wd[3]);
  v7R(g,x,y,s,3,Wd[5]); v7R(g,x,y+s-3,s,3,Wd[1]);
  v7R(g,x,y,3,s,Wd[5]); v7R(g,x+s-3,y,3,s,Wd[1]);
  v7R(g,x+3,y+3,s-6,3,Wd[2]); v7R(g,x+3,y+s-6,s-6,3,Wd[2]);
  v7R(g,x+3,y+3,3,s-6,Wd[2]); v7R(g,x+s-6,y+3,3,s-6,Wd[2]);
}
function v7Haybale(g,cx,baseY){
  paEllipse(g,cx,baseY-8,12,9,MAT.thatch[3]);
  paEllipse(g,cx-3,baseY-10,7,5,MAT.thatch[5]);
  for(let i=0;i<8;i++){
    const sx=cx-10+Math.floor(phash(i,3,301)*20);
    v7R(g,sx,baseY-14,2,10,phash(i,4,302)<0.5?MAT.thatch[4]:MAT.thatch[2]);
  }
  v7R(g,cx-10,baseY-9,20,2,MAT.leatherDark[2]);
}
function v7FlowerBox(g,x,y,w,pal){
  const Wd=pal.wood;
  v7R(g,x,y,w,10,Wd[2]);
  v7R(g,x,y,w,2,Wd[4]); v7R(g,x,y+8,w,2,Wd[1]);
  for(let i=0;i<w/5;i++){
    const fx=x+2+i*5;
    v7R(g,fx,y-6,2,6,MAT.leaf[2]);
    paPX(g,fx,y-7,pchoice(['#e86a8a','#f2d06b','#ffffff']));
    paPX(g,fx,y-8,pchoice(['#e86a8a','#f2d06b']));
  }
}

/* ---------------- the 11 buildings ---------------- */
function buildBuildingArt(){
  const B=PA.bld;
  const woodBase={wall:'#c9a06b',roof:'#b8543e',trim:'#f2e4c2'};
  const stoneBase={wall:'#b8b2a4',roof:'#5d6b7d',trim:'#f2e4c2'};
  const plasterBase={wall:'#f0e2c4',roof:'#b8543e',trim:'#fff6e0'};

  /* ---- Town Hall: stone, slate roof, banner, clock, quoins, ivy ---- */
  B.townhall=composeBuilding({tw:6,th:5,key:101,base:stoneBase,roofStyle:'slate',wallKind:'stone',timber:false,
    doorW:17,winOff:[{off:-30,shut:'#5d6b7d'},{off:-15,shut:'#5d6b7d'},{off:15,shut:'#5d6b7d'},{off:30,shut:'#5d6b7d'}],
    chimneyX:70,finial:true,lantern:true,litDoor:true,
    extras(g,pal,c){
      const T=pal.trim;
      // banner pole + banner with gold emblem
      v7R(g,c.ox+14,c.roofBase-c.roofH-30,4,34,pal.wood[2]);
      v7R(g,c.ox+14,c.roofBase-c.roofH-30,4,4,MAT.brass[4]);
      const bx=c.ox+18, by=c.roofBase-c.roofH-30;
      v7R(g,bx,by,26,20,'#6b3a4a');
      paGradV(g,bx,by,26,20,['#8a4a5c','#6b3a4a','#4e2a34']);
      v7R(g,bx,by+18,26,2,'#3a1e26');
      paBlob(g,bx+13,by+9,6,MAT.brass[3]); paPX(g,bx+12,by+8,MAT.brass[6]);
      paBlob(g,bx+13,by+10,3,'#6b3a4a');
      // clock on the gable
      paBlob(g,c.apexX,c.apexY+26,12,V7_LINE);
      paBlob(g,c.apexX,c.apexY+26,10,T);
      paBlob(g,c.apexX,c.apexY+26,8,pal.night?'#3a3a40':'#f6f0e0');
      if(pal.night) texGlow(g,c.apexX,c.apexY+26,5);
      v7R(g,c.apexX-2,c.apexY+19,4,8,'#2b2118');
      v7R(g,c.apexX,c.apexY+24,8,4,'#2b2118');
      if(pal.night) c.glowSpots.push({x:c.apexX,y:c.apexY+26});
      // stone quoins
      for(let y=c.wallY+4;y<c.wallB-4;y+=10){
        v7R(g,c.ox+2,y,6,8,pal.stone[4]); v7R(g,c.ox+2,y,6,2,pal.stone[5]);
        v7R(g,c.ox+c.W-8,y,6,8,pal.stone[4]); v7R(g,c.ox+c.W-8,y,6,2,pal.stone[5]);
      }
      // ivy creeping up the corner
      for(let i=0;i<12;i++){
        const vx=c.ox+10+Math.floor(phash(i,1,91)*6), vy=c.wallB-10-i*6;
        v7R(g,vx,vy,4,4,MAT.leaf[2]); v7R(g,vx+4,vy-4,2,2,MAT.leaf[4]);
      }
    }});

  /* ---- Inn: wood + golden thatch, porch, hanging mug sign ---- */
  B.inn=composeBuilding({tw:6,th:5,key:102,base:{wall:'#c9a06b',roof:'#e0b95e',trim:'#f2e4c2'},
    roofStyle:'thatch',wallKind:'wood',timber:true,doorW:11,litDoor:true,
    winOff:[{off:-28,shut:'#6b3a4a'},{off:28,shut:'#6b3a4a'}],chimneyX:20,lantern:true,
    extras(g,pal,c){
      const Wd=pal.wood;
      // porch posts + thatch porch roof
      for(const px of [c.ox+10,c.ox+c.W-16]){
        v7R(g,px,c.wallB-38,6,38,Wd[2]);
        v7R(g,px,c.wallB-38,6,4,Wd[4]); v7R(g,px+4,c.wallB-38,2,38,Wd[1]);
      }
      v7R(g,c.ox+4,c.wallB-44,c.W-8,8,Wd[2]);
      for(let rx=c.ox+4;rx<c.ox+c.W-4;rx+=4)
        v7R(g,rx,c.wallB-44,2,8,phash(rx,1,103)<0.5?pal.roof[4]:pal.roof[3]);
      v7R(g,c.ox+4,c.wallB-44,c.W-8,2,pal.roof[5]);
      // hanging sign: iron bracket + board + painted mug
      const sx=c.ox+c.W-52;
      v7R(g,sx,c.wallB-44,4,20,MAT.ironDark[2]);
      v7R(g,sx-2,c.wallB-26,24,4,MAT.ironDark[2]);
      v7R(g,sx-18,c.wallB-22,38,26,Wd[3]);
      v7R(g,sx-18,c.wallB-22,38,4,Wd[5]);
      paEllipse(g,sx+1,c.wallB-9,8,8,'#e8dcc0');
      paEllipse(g,sx+1,c.wallB-12,6,4,'#f7f0dc');
      v7R(g,sx+8,c.wallB-12,4,6,'#c9b896');
      paPX(g,sx-1,c.wallB-13,'#ffffff'); paPX(g,sx+2,c.wallB-14,'#ffffff');
      // flower boxes under windows
      for(const off of [-28,28]){
        const wx=c.ox+c.W/2+off*2-10;
        v7FlowerBox(g,wx-4,c.wallY+46,28,pal);
      }
    }});

  /* ---- General store: plaster, striped awning, coin sign, crates ---- */
  B.store=composeBuilding({tw:5,th:4,key:107,base:plasterBase,roofStyle:'tile',wallKind:'plaster',timber:false,
    doorW:11,litDoor:true,winOff:[{off:-22,shut:'#4e7a5c'},{off:22,shut:'#4e7a5c'}],chimneyX:60,finial:true,lantern:true,
    extras(g,pal,c){
      // striped awning with scalloped edge
      const aw=c.wallY+32, cols=['#b8452e','#f2e4c2'], ax0=c.ox+10, ax1=c.ox+c.W-10;
      for(let i=0,ax=ax0; ax<ax1; i++,ax+=14){
        const cw=Math.min(14,ax1-ax), cr=rampOf(cols[i%2]);
        v7R(g,ax,aw,cw,14,cr[3]);
        v7R(g,ax,aw,cw,3,cr[5]);
        paEllipse(g,ax+cw/2,aw+14,cw/2,4,cr[3]);
        v7R(g,ax,aw+11,cw,3,cr[1]);
      }
      v7R(g,ax0,aw,ax1-ax0,3,pal.wood[2]);
      // sign board with gold coin (mounted on the roof slope, clear of the ridge)
      const sy=c.roofBase-c.roofH+30;
      v7R(g,c.ox+c.W/2-38,sy,76,22,pal.wood[3]);
      v7R(g,c.ox+c.W/2-38,sy,76,4,pal.wood[5]);
      paBlob(g,c.ox+c.W/2-18,sy+12,8,MAT.gold[3]);
      paBlob(g,c.ox+c.W/2-19,sy+11,5,MAT.gold[5]);
      paPX(g,c.ox+c.W/2-19,sy+10,MAT.gold[6]);
      v7R(g,c.ox+c.W/2-4,sy+9,26,3,pal.trim);
      v7R(g,c.ox+c.W/2-4,sy+15,20,3,mix(pal.trim,'#000000',0.2));
      // crates + barrel outside
      v7Crate(g,c.ox+12,c.wallB-20,20,pal);
      v7Crate(g,c.ox+34,c.wallB-18,18,pal);
      v7Barrel(g,c.ox+c.W-34,c.wallB-26,pal);
    }});

  /* ---- Smithy: stone, dark slate roof, forge window, horseshoe, anvil ---- */
  B.smithy=composeBuilding({tw:5,th:4,key:112,base:{wall:'#9a8a78',roof:'#4c4c55',trim:'#f2e4c2'},
    roofStyle:'slate',wallKind:'stone',timber:true,doorW:13,litDoor:true,
    winOff:[{off:-24,shut:'#3a3a40'}],chimneyX:62,lantern:true,
    extras(g,pal,c){
      // wide forge window with fire glow
      const fx=c.ox+c.W/2+26, fy=c.wallY+16;
      v7R(g,fx-6,fy-6,42,30,pal.trim);
      v7R(g,fx-4,fy-4,38,26,V7_LINE);
      if(pal.night){
        paGradV(g,fx,fy,30,18,['#ffd98a','#ff9a3d','#c46a2e']);
        paBlob(g,fx+10,fy+10,5,'#fff2c8'); paBlob(g,fx+21,fy+8,4,'#ffd98a');
        v7R(g,fx+6,fy+13,18,5,'#7a3a1a');
        paNoise(g,fx,fy+13,30,5,['#ffca6a','#3a1e10'],0.5,113);
      } else {
        v7R(g,fx,fy,30,18,'#2b2118');
        v7R(g,fx+2,fy+2,10,6,'#5a7a9a'); v7R(g,fx+4,fy+2,4,6,'#9fc4e8');
      }
      v7R(g,fx+14,fy,2,18,pal.trim); v7R(g,fx,fy+8,30,2,pal.trim);
      c.glowSpots.push({x:fx+15,y:fy+9});
      // horseshoe emblem with nails (small, centered on the eave)
      const hhx=c.ox+c.W/2, hhy=c.wallY+10;
      paEllipse(g,hhx,hhy,8,8,MAT.metal[3]);
      paEllipse(g,hhx-2,hhy-1,6,6,MAT.metal[5]);
      paEllipse(g,hhx,hhy+1,4,4,pal.wall[3]);
      paPX(g,hhx-5,hhy-3,MAT.ironDark[0]); paPX(g,hhx+5,hhy-3,MAT.ironDark[0]);
      paPX(g,hhx-6,hhy+1,MAT.ironDark[0]); paPX(g,hhx+6,hhy+1,MAT.ironDark[0]);
      // anvil silhouette by the wall
      const ax=c.ox+14;
      v7R(g,ax,c.wallB-20,24,6,MAT.metal[3]);
      v7R(g,ax,c.wallB-20,24,2,MAT.metal[5]);
      v7R(g,ax+20,c.wallB-22,8,4,MAT.metal[3]);   // horn
      v7R(g,ax+9,c.wallB-14,6,8,MAT.metal[2]);    // waist
      v7R(g,ax+5,c.wallB-6,14,6,MAT.ironDark[1]); // base
    }});

  /* ---- Farmhouse: wood, terracotta roof, hayloft window, porch, hay ---- */
  B.farmhouse=composeBuilding({tw:4,th:4,key:114,base:woodBase,roofStyle:'tile',wallKind:'wood',timber:true,
    doorW:11,winOff:[{off:-18,shut:'#7a5c38'},{off:18,shut:'#7a5c38'}],chimneyX:44,lantern:true,
    extras(g,pal,c){
      // round hayloft window in the gable
      paBlob(g,c.apexX,c.apexY+20,11,V7_LINE);
      paBlob(g,c.apexX,c.apexY+20,9,pal.trim);
      if(pal.night){
        paBlob(g,c.apexX,c.apexY+20,7,'#ffca6a');
        paBlob(g,c.apexX,c.apexY+20,4,'#fff6d8');
        c.glowSpots.push({x:c.apexX,y:c.apexY+20});
      } else {
        paBlob(g,c.apexX,c.apexY+20,7,'#7aa8cc');
        paLine(g,c.apexX-5,c.apexY+25,c.apexX+5,c.apexY+15,'#eaf6ff');
      }
      v7R(g,c.apexX-2,c.apexY+13,4,14,pal.trim);
      v7R(g,c.apexX-7,c.apexY+18,14,4,pal.trim);
      // porch with railing
      v7R(g,c.ox+c.W/2-30,c.wallB-24,60,8,pal.wood[2]);
      v7R(g,c.ox+c.W/2-30,c.wallB-24,60,2,pal.wood[4]);
      for(let i=0;i<6;i++) v7R(g,c.ox+c.W/2-28+i*10,c.wallB-32,4,8,pal.wood[2]);
      v7R(g,c.ox+c.W/2-34,c.wallB-30,4,30,pal.wood[2]);
      v7R(g,c.ox+c.W/2+30,c.wallB-30,4,30,pal.wood[2]);
      // hay bale
      v7Haybale(g,c.ox+18,c.wallB);
    }});

  /* ---- Herbalist hut: green plaster, mossy thatch, planters ---- */
  B.herbhut=composeBuilding({tw:4,th:4,key:118,base:{wall:'#a8bf8e',roof:'#c9a94e',trim:'#f2e4c2'},
    roofStyle:'thatch',wallKind:'plaster',timber:false,doorW:10,winOff:[{off:0,shut:'#4e7a3c'}],chimneyX:12,lantern:true,
    extras(g,pal,c){
      // moss patches on the thatch
      for(let i=0;i<18;i++){
        const mx=c.ox+24+Math.floor(phash(i,3,950)*(c.W-48));
        const my=c.roofBase-14-Math.floor(phash(3,i,951)*c.roofH*0.6);
        v7R(g,mx,my,4,4,MAT.leaf[2]); v7R(g,mx+4,my,2,2,MAT.leaf[3]);
      }
      // vine creeping up the wall
      for(let i=0;i<14;i++){
        const vx=c.ox+c.W-18-Math.floor(phash(i,5,952)*8), vy=c.wallB-10-i*7;
        v7R(g,vx,vy,4,4,MAT.leaf[2]); v7R(g,vx+4,vy-2,2,2,MAT.leaf[4]);
      }
      // herb planters flanking the door
      for(const sgn of [-1,1]){
        const px2=c.ox+c.W/2+sgn*36;
        v7R(g,px2-12,c.wallB-18,24,16,pal.wood[2]);
        v7R(g,px2-12,c.wallB-18,24,2,pal.wood[4]);
        for(let i=0;i<5;i++){
          const fx2=px2-10+i*5;
          v7R(g,fx2,c.wallB-28,2,10,MAT.leaf[2]);
          paPX(g,fx2,c.wallB-29,pchoice(['#b678e0','#e86a8a','#f2d06b']));
        }
      }
      // hanging herb bundle by the door
      v7R(g,c.ox+c.W/2+20,c.wallY+14,12,18,MAT.leafDeep[2]);
      paNoise(g,c.ox+c.W/2+20,c.wallY+14,12,18,[MAT.leaf[3],MAT.leafDeep[3]],0.4,120);
      v7R(g,c.ox+c.W/2+22,c.wallY+8,8,6,MAT.wood[2]);
    }});

  /* ---- Cottages: 5 variants ---- */
  const cottage=(id,base,roofStyle,wallKind,timber,winOff,extra,key)=>{
    B[id]=composeBuilding(Object.assign({tw:4,th:4,key,base,roofStyle,wallKind,timber,doorW:10,
      winOff,chimneyX:prangei(10,44),lantern:true}, extra||{}));
  };
  cottage('house1',plasterBase,'tile','plaster',true,[{off:-18,shut:'#b8452e'},{off:18,shut:'#b8452e'}],
    {finial:true,extras(g,pal,c){
      for(const off of [-18,18]){
        const wx=c.ox+c.W/2+off*2-10;
        v7FlowerBox(g,wx-4,c.wallY+48,28,pal);
      }
    }},121);
  cottage('house2',{wall:'#c9a06b',roof:'#7a5c48',trim:'#f2e4c2'},'shingle','wood',true,
    [{off:-16,shut:'#4e3822'},{off:16,shut:'#4e3822'}],
    {extras(g,pal,c){
      // log stack by the wall
      for(let r2=0;r2<3;r2++) for(let i=0;i<3-r2;i++){
        const lx=c.ox+10+i*12+r2*6, ly=c.wallB-10-r2*10;
        paBlob(g,lx+5,ly+5,6,pal.wood[2]);
        paBlob(g,lx+5,ly+5,4,pal.wood[4]);
        paBlob(g,lx+5,ly+5,2,pal.wood[2]);
      }
    }},122);
  cottage('house3',{wall:'#f0e2c4',roof:'#e0b95e',trim:'#fff6e0'},'thatch','plaster',false,
    [{off:-18},{off:18}],
    {chimneyX:null,extras(g,pal,c){
      for(const off of [-18,18]){
        const wx=c.ox+c.W/2+off*2-10;
        v7R(g,wx-4,c.wallY+48,28,10,pal.wood[2]);
        v7R(g,wx-4,c.wallY+48,28,2,pal.wood[4]);
        for(let i=0;i<5;i++) paLine(g,wx+i*6,c.wallY+56,wx+i*6+4,c.wallY+46,MAT.leaf[2]);
      }
    }},123);
  cottage('house4',{wall:'#b09a72',roof:'#5d6b7d',trim:'#f2e4c2'},'slate','stone',true,
    [{off:-20,shut:'#455061'},{off:0},{off:20,shut:'#455061'}],{doorW:11,finial:true},124);
  cottage('house5',{wall:'#f0e2c4',roof:'#b8543e',trim:'#fff6e0'},'tile','plaster',true,
    [{off:-18,shut:'#6b3a4a'},{off:18,shut:'#6b3a4a'}],
    {extras(g,pal,c){
      // climbing rose by the door
      for(let i=0;i<12;i++){
        const vx=c.ox+c.W/2-30+Math.floor(phash(i,2,953)*8), vy=c.wallB-10-i*6;
        v7R(g,vx,vy,4,4,MAT.leafDeep[2]); v7R(g,vx+4,vy-2,2,2,MAT.leaf[3]);
      }
      paPX(g,c.ox+c.W/2-28,c.wallB-46,'#e86a8a'); paPX(g,c.ox+c.W/2-26,c.wallB-54,'#e86a8a');
      paPX(g,c.ox+c.W/2-29,c.wallB-62,'#f2d06b');
      v7FlowerBox(g,c.ox+c.W/2+18,c.wallY+48,28,pal);
    }},125);
}
