/* =====================================================================
   PA-CORE v6 — premium hand-crafted pixel-art foundation for Willowbrook.
   NATIVE pixels: every module authors at 1 art px = 1 screen px.
   One shared material/shading language for the whole world:
   - 7-tone material ramps: cool deep shadows, warm highlights
   - key light from upper-left (warm), occlusion cool/dark
   - crisp hard pixels, ordered dithering for transitions, no AA, no blur
   ===================================================================== */
'use strict';
const PA = {
  terrain: {},          // tile sprites (32x32 px)
  veg: {},              // vegetation sprites, bottom-center anchored
  props: {},            // prop sprites
  bld: {},              // building sprites by building id
  chars: [],            // per-villager frame tables
  fx: {},               // effect sprites
  waterTiles: [],       // {tx,ty} animated water tiles (filled at prerender)
  glowSpots: [],        // rebuilt per frame in render
  ready: false,
};

/* ---------------- deterministic rng (art only; never touches game rng) */
let _pseed = 987654321;
function prand(){ _pseed = (_pseed*1664525 + 1013904223) >>> 0; return _pseed/4294967296; }
function prange(a,b){ return a + prand()*(b-a); }
function prangei(a,b){ return Math.floor(prange(a,b+1)); }
function pchoice(a){ return a[Math.floor(prand()*a.length)]; }
function phash(x,y,salt){
  let h = (x*73856093) ^ (y*19349663) ^ ((salt|0)*83492791);
  h = (h ^ (h>>>13)) * 1274126177;
  return ((h ^ (h>>>16)) >>> 0) / 4294967295;
}

/* ---------------- color utils ---------------- */
function shade(hex,f){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)&255, g=(n>>8)&255, b=n&255;
  r=Math.max(0,Math.min(255,Math.round(r*f)));
  g=Math.max(0,Math.min(255,Math.round(g*f)));
  b=Math.max(0,Math.min(255,Math.round(b*f)));
  return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}
function mix(h1,h2,t){
  const a=parseInt(h1.slice(1),16), b=parseInt(h2.slice(1),16);
  const r=Math.round(((a>>16)&255)*(1-t)+(((b>>16)&255)*t));
  const g=Math.round(((a>>8)&255)*(1-t)+(((b>>8)&255)*t));
  const bl=Math.round((a&255)*(1-t)+((b&255)*t));
  return '#'+((r<<16)|(g<<8)|bl).toString(16).padStart(6,'0');
}
/* 7-tone material ramp from a base color.
   [0]=deep occlusion (cool) [1]=shadow (cool) [2]=mid-dark [3]=mid(base)
   [4]=light (warm) [5]=highlight (warm) [6]=specular */
function rampOf(base){
  return [
    mix(shade(base,0.38),'#232a44',0.38),
    mix(shade(base,0.58),'#2e3350',0.24),
    shade(base,0.78),
    base,
    mix(shade(base,1.16),'#ffcf90',0.30),
    mix(shade(base,1.36),'#ffe9b8',0.55),
    mix('#ffffff',base,0.30),
  ];
}

/* ---------------- material library (shared world language) ---------------- */
const MAT = {
  outline: '#241a12',
  // skin tones per villager base
  skinLight: rampOf('#f2c49a'), skinMid: rampOf('#e0a878'),
  skinTan: rampOf('#c98a5e'),  skinDeep: rampOf('#a86a44'),
  // hair
  hairBlack: rampOf('#3a3230'), hairBrown: rampOf('#7a4a24'),
  hairBlond: rampOf('#d4a94a'), hairRed: rampOf('#a32e2e'),
  hairGrey: rampOf('#b8b8b8'),  hairAuburn: rampOf('#8a4a2a'),
  // cloth / leather / metal
  leather: rampOf('#8a5c38'), leatherDark: rampOf('#5a3a22'),
  wood: rampOf('#8a6a45'),     woodDark: rampOf('#5a4226'),
  woodPale: rampOf('#c9a06b'),
  metal: ['#33363e','#54585f','#7e848e','#aab0ba','#e2e6ee','#ffffff','#ffffff'],
  ironDark: ['#26262c','#3a3a42','#4e4e58','#66666e','#88888f','#aaaab2','#c8c8d0'],
  gold: ['#6e4410','#9a641c','#c88e2e','#efa93e','#ffd97e','#fff0b8','#fffbe0'],
  brass: ['#7a5a16','#a8842a','#d4a83e','#f2c95e','#ffe89a','#fff6c8','#fffbe8'],
  stone: rampOf('#8d8d94'),    stoneWarm: rampOf('#a89a86'),
  plaster: rampOf('#e8dcc0'),
  // roofs
  tileRed: rampOf('#a34d3a'),  slate: rampOf('#5d6b7d'),
  shingle: rampOf('#7a5c48'),  thatch: rampOf('#d9b96a'),
  // nature
  leaf: rampOf('#4e8a3c'),     leafDeep: rampOf('#2e5a24'),
  pine: rampOf('#2f6b34'),     trunk: rampOf('#6b4f30'),
  grass: rampOf('#79a854'),    grassDry: rampOf('#a8a05a'),
  dirt: rampOf('#c9a26b'),     sand: rampOf('#e0cf9e'),
  water: rampOf('#3f7fc4'),
  // light
  glow: '#ffd98a', glowCore: '#fff6d8', ember: '#ff9a3e',
};
function clothRamp(base){ return rampOf(base||'#888888'); } // per-garment cloth ramps

/* ---------------- native-pixel sprite helpers ---------------- */
function paMk(w,h){
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h));
  const g=c.getContext('2d');
  g.imageSmoothingEnabled=false;
  return {c,g,w:c.width,h:c.height};
}
function paR(g,x,y,w,h,col){ if(col==null) return; g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); }
function paPX(g,x,y,col){ if(col==null) return; g.fillStyle=col; g.fillRect(Math.round(x),Math.round(y),1,1); }
function paBlitBC(g,spr,bx,by){ g.drawImage(spr.c, Math.round(bx-spr.c.width/2), Math.round(by-spr.c.height)); }
function paBlit(g,spr,x,y){ g.drawImage(spr.c, Math.round(x), Math.round(y)); }
function paBlob(g,cx,cy,r,col){
  if(col==null) return; g.fillStyle=col;
  const rr=Math.ceil(r);
  for(let j=-rr;j<=rr;j++) for(let i=-rr;i<=rr;i++)
    if(i*i+j*j<=r*r+0.4) g.fillRect(Math.round(cx+i),Math.round(cy+j),1,1);
}
function paEllipse(g,cx,cy,rx,ry,col){
  if(col==null) return; g.fillStyle=col;
  for(let y=-ry;y<=ry;y++){
    const t=1-(y*y)/(ry*ry); if(t<0) continue;
    const w=Math.round(rx*Math.sqrt(t));
    g.fillRect(Math.round(cx-w),Math.round(cy+y),w*2+1,1);
  }
}
function paLine(g,x0,y0,x1,y1,col){
  if(col==null) return; g.fillStyle=col;
  let dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1, sy=y0<y1?1:-1;
  let err=dx-dy, x=Math.round(x0), y=Math.round(y0), n=0;
  const tx=Math.round(x1), ty=Math.round(y1);
  while(n++<256){ g.fillRect(x,y,1,1); if(x===tx&&y===ty) break;
    const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} }
}
/* dark pixel outline hugging opaque pixels (run AFTER painting) */
function paOutline(c,col){
  const w=c.width,h=c.height,g=c.getContext('2d');
  const src=g.getImageData(0,0,w,h), out=g.createImageData(w,h);
  const s=src.data,o=out.data;
  const pc=document.createElement('canvas').getContext('2d');
  pc.fillStyle=col||MAT.outline; pc.fillRect(0,0,1,1);
  const cd=pc.getImageData(0,0,1,1).data;
  const has=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&s[(y*w+x)*4+3]>10;
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    if(s[i+3]>10){ o[i]=s[i]; o[i+1]=s[i+1]; o[i+2]=s[i+2]; o[i+3]=s[i+3]; }
    else if(has(x-1,y)||has(x+1,y)||has(x,y-1)||has(x,y+1)||has(x-1,y-1)||has(x+1,y-1)||has(x-1,y+1)||has(x+1,y+1)){
      o[i]=cd[0]; o[i+1]=cd[1]; o[i+2]=cd[2]; o[i+3]=255;
    }
  }
  g.putImageData(out,0,0);
}

/* ---------------- dithering & noise (native px) ---------------- */
/* 50/50 checkerboard between two tones */
function paDith(g,x,y,w,h,cA,cB){
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)
    paPX(g,x+i,y+j,((i+j)&1)?cA:cB);
}
/* ordered-bayer blend: ratio 0..1 of cB over cA */
const _BAYER=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]];
function paDithBayer(g,x,y,w,h,cA,cB,ratio){
  const th=Math.round(ratio*16);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++)
    paPX(g,x+i,y+j,(_BAYER[j&3][i&3]<th)?cB:cA);
}
/* vertical gradient through a tone array with dithered steps */
function paGradV(g,x,y,w,h,tones){
  const n=tones.length;
  for(let j=0;j<h;j++){
    const t=j/(h-1)*(n-1), i0=Math.floor(t), f=t-i0;
    const cA=tones[i0], cB=tones[Math.min(n-1,i0+1)];
    for(let i=0;i<w;i++)
      paPX(g,x+i,y+j,(_BAYER[j&3][i&3]<f*16)?cB:cA);
  }
}
/* scattered deterministic pixel noise */
function paNoise(g,x,y,w,h,cols,density,key){
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const r=phash(x+i,y+j,key);
    if(r<density) paPX(g,x+i,y+j,cols[Math.floor(r/density*cols.length)%cols.length]);
  }
}
/* dithered elliptical ground shadow */
function paGroundShadow(g,cx,cy,rx,ry){
  for(let j=-ry;j<=ry;j++)for(let i=-rx;i<=rx;i++){
    const d=(i*i)/(rx*rx)+(j*j)/(ry*ry);
    if(d<=1){
      const th=d<0.5?5:(d<0.8?3:1);
      if(_BAYER[(j+40)&3][(i+40)&3]<th){
        g.fillStyle='rgba(24,18,10,0.28)';
        g.fillRect(Math.round(cx+i),Math.round(cy+j),1,1);
      }
    }
  }
}

/* ---------------- texture painters (native px) ---------------- */
/* horizontal wood planks with grain + knots */
function texPlanksH(g,x,y,w,h,wood,key){
  key=key||1;
  const ph=8;
  for(let py=y;py<y+h;py+=ph){
    const hh=Math.min(ph,y+h-py);
    paR(g,x,py,w,hh,wood[3]);
    paNoise(g,x,py,w,hh,[wood[2],wood[4]],0.10,key+py);
    for(let k=0;k<w/14;k++){ // grain streaks
      const gx=x+Math.floor(phash(k,py,key+7)*w), gl=4+Math.floor(phash(py,k,key+9)*10);
      paR(g,gx,py+2+Math.floor(phash(k,3,key)* (hh-4)),gl,1,wood[2]);
    }
    if(phash(py,x,key+11)<0.5){ // knot
      const kx=x+Math.floor(phash(py,5,key+13)*w);
      paPX(g,kx,py+hh/2,wood[1]); paPX(g,kx+1,py+hh/2,wood[1]);
      paPX(g,kx,py+hh/2-1,wood[4]);
    }
    paR(g,x,py+hh-1,w,1,wood[1]);            // plank gap shadow
    paR(g,x,py,w,1,wood[5]);                // top edge light
  }
}
/* vertical wood planks */
function texPlanksV(g,x,y,w,h,wood,key){
  key=key||2;
  const pw=8;
  for(let px=x;px<x+w;px+=pw){
    const ww=Math.min(pw,x+w-px);
    paR(g,px,y,ww,h,wood[3]);
    paNoise(g,px,y,ww,h,[wood[2],wood[4]],0.10,key+px);
    for(let k=0;k<h/16;k++){
      const gy=y+Math.floor(phash(k,px,key+17)*h), gl=4+Math.floor(phash(px,k,key+19)*10);
      paR(g,px+2+Math.floor(phash(k,7,key)*(ww-4)),gy,1,gl,wood[2]);
    }
    paR(g,px+ww-1,y,1,h,wood[1]);
    paR(g,px,y,1,h,wood[5]);
  }
}
/* roof shingles: individual scalloped tiles, row by row */
function texRoofTiles(g,x,y,w,h,roof,key){
  key=key||3;
  const tw=9, rh=10;
  for(let ry=y, row=0; ry<y+h; ry+=rh, row++){
    const off=(row%2)*Math.floor(tw/2);
    for(let rx=x-tw+off; rx<x+w+tw; rx+=tw){
      const jx=rx+Math.floor(phash(rx,ry,key)*2);
      paR(g,jx,ry,tw-1,rh-2,roof[3]);                       // tile body
      paR(g,jx,ry,tw-1,2,roof[5]);                          // top highlight
      paR(g,jx,ry+rh-4,tw-1,2,roof[2]);                     // bottom shade
      paR(g,jx+tw-2,ry+1,1,rh-3,roof[1]);                   // right gap
      paR(g,jx,ry+rh-2,tw-1,1,roof[0]);                     // row shadow
      if(phash(jx,ry,key+21)<0.3) paR(g,jx+2,ry+3,3,2,roof[4]); // tone variation
    }
  }
}
/* thatch: layered diagonal strokes */
function texThatch(g,x,y,w,h,thatch,key){
  key=key||4;
  paR(g,x,y,w,h,thatch[3]);
  for(let ry=y; ry<y+h; ry+=7){ // layer rows
    paR(g,x,ry,w,2,thatch[2]);
    for(let i=0;i<w/3;i++){
      const sx=x+Math.floor(phash(i,ry,key)*w), sl=4+Math.floor(phash(ry,i,key+1)*5);
      const t=phash(i,ry,key+2);
      const col=t<0.4?thatch[4]:(t<0.7?thatch[5]:thatch[2]);
      paLine(g,sx,ry+6,sx+2,ry+6-sl,col);
    }
    paR(g,x,ry+6,w,1,thatch[1]); // layer shadow
  }
  paNoise(g,x,y,w,h,[thatch[5],thatch[2]],0.08,key+5);
}
/* coursed stone with per-stone tone jitter + dark mortar */
function texStone(g,x,y,w,h,stone,key){
  key=key||5;
  const ch=10;
  paR(g,x,y,w,h,stone[1]); // mortar
  for(let ry=y,row=0; ry<y+h; ry+=ch, row++){
    const off=(row%2)*9;
    for(let rx=x-18+off; rx<x+w; rx+=18){
      const t=phash(rx,ry,key);
      const body=t<0.33?stone[3]:(t<0.66?stone[4]:stone[2]);
      paR(g,rx+1,ry+1,16,ch-2,body);
      paR(g,rx+1,ry+1,16,2,stone[5]);       // top light
      paR(g,rx+1,ry+ch-3,16,2,stone[1]);    // bottom shade
      if(t>0.8) paR(g,rx+4,ry+4,5,3,stone[5]); // bright stone
    }
  }
}
/* plaster with subtle mottling */
function texPlaster(g,x,y,w,h,plaster,key){
  key=key||6;
  paR(g,x,y,w,h,plaster[3]);
  paNoise(g,x,y,w,h,[plaster[4],plaster[2]],0.12,key);
  paNoise(g,x,y,w,h,[plaster[2]],0.05,key+1);
}
/* cloth fold: dark crease line with warm highlight ridge beside it */
function texFold(g,ramp,x0,y0,x1,y1){
  paLine(g,x0,y0,x1,y1,ramp[1]);
  paLine(g,x0+1,y0,x1+1,y1,ramp[1]);
  paLine(g,x0,y0+1,x1,y1+1,ramp[5]);
}
/* warm glow dot cluster (lamp/window light) */
function texGlow(g,cx,cy,r){
  paBlob(g,cx,cy,r,MAT.glow);
  paBlob(g,cx,cy,r*0.6,MAT.glowCore);
}

/* ---------------- global palette (legacy names kept) ---------------- */
const PAL = {
  outline: MAT.outline,
  grass:'#79a854', grassD:'#5d8a42', grassL:'#93c46e', grassDD:'#4c7038',
  dirt:'#c9a26b', dirtD:'#a37f4e', dirtL:'#e0bd85',
  water:'#3f7fc4', waterD:'#2f6fb8', waterDD:'#265a94', waterL:'#6fa8dc', foam:'#eaf6ff',
  wood:'#8a6a45', woodD:'#6b4f30', woodL:'#a37f4e', woodDD:'#4e3822',
  stone:'#8d8d94', stoneD:'#6b6b72', stoneL:'#a5a5ac',
  roofTile:'#a34d3a', roofTileD:'#7e382a', roofTileL:'#c06a52',
  thatch:'#d9b96a', thatchD:'#b8944e', thatchL:'#efd694',
  slate:'#5d6b7d', slateD:'#455061', slateL:'#7b8ba0',
  shingle:'#7a5c48', shingleD:'#5c4436', shingleL:'#96755c',
  plaster:'#e8dcc0', plasterD:'#c4b493',
  leaf:'#4e8a3c', leafD:'#3a6b2e', leafL:'#66a848',
  pine:'#2f6b34', pineD:'#235226', pineL:'#3f8546',
  trunk:'#6b4f30', trunkD:'#4e3822',
  glow:'#ffd98a', glowCore:'#fff2c8',
  nightF:0.52,
};
