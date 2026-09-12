/* =====================================================================
   PA-TERRAIN v6 — premium hand-crafted tile sprites (32x32 px native).
   Interface: buildTerrain() fills PA.terrain with:
     grass[4], darkgrass[3], dirt[2], path[16], cobble[2], stone, mud,
     sand[2], tilled[2], water[4], shore[16][2], bridge[2], floor
   Mask bits: 1=N 2=S 4=W 8=E
     path:  bit=1 → neighbor IS path-like (open, draw NO edge)
     shore: bit=1 → neighbor is NOT water (draw foam edge on that side)
   Key light upper-left (warm), cool shadows lower-right, dithered
   transitions — no alpha gradients, no flat areas.
   ===================================================================== */

/* small grass blade cluster painter */
function tBlades(g,n,key,cols){
  const gr=MAT.grass;
  for(let i=0;i<n;i++){
    const bx=1+Math.floor(phash(i,key,11)*30), by=2+Math.floor(phash(key,i,12)*29);
    const h=2+Math.floor(phash(i,key,13)*3), lean=phash(key,i,14)<0.5?-1:1;
    const c=cols[Math.floor(phash(i,key,15)*cols.length)%cols.length];
    for(let k=0;k<h;k++)
      paPX(g,bx+Math.round(lean*k*0.4),by-k, k===h-1?gr[5]:c);
  }
}
/* pebble cluster painter */
function tPebbles(g,n,key,stone){
  for(let i=0;i<n;i++){
    const px=2+Math.floor(phash(i,key,21)*27), py=2+Math.floor(phash(key,i,22)*27);
    const w=2+Math.floor(phash(i,key,23)*2);
    paR(g,px,py,w,2,stone[3]);
    paR(g,px,py,w,1,stone[5]);        // top light
    paPX(g,px,py+1,stone[1]);         // corner shade
    if(w>2) paPX(g,px+w-1,py+1,stone[2]);
  }
}
/* grass creeping inward from a closed path edge */
function tEdgeBlades(g,x,y,w,h,key,side){
  const gr=MAT.grass, n=Math.floor((w>h?w:h)/3);
  for(let i=0;i<n;i++){
    let bx,by,dx,dy;
    if(side==='N'){ bx=x+2+Math.floor(phash(i,key,41)*(w-4)); by=y; dx=0; dy=1; }
    else if(side==='S'){ bx=x+2+Math.floor(phash(i,key,41)*(w-4)); by=y+h-1; dx=0; dy=-1; }
    else if(side==='W'){ bx=x; by=y+2+Math.floor(phash(i,key,41)*(h-4)); dx=1; dy=0; }
    else { bx=x+w-1; by=y+2+Math.floor(phash(i,key,41)*(h-4)); dx=-1; dy=0; }
    const hh=2+Math.floor(phash(key,i,42)*4);
    const c=phash(i,key,43)<0.5?gr[3]:gr[2];
    for(let k=0;k<hh;k++) paPX(g,bx+dx*k,by+dy*k, k===hh-1?gr[4]:c);
  }
}

/* ---------------- grass: 4 variants ---------------- */
function tGrassTile(v){
  const s=paMk(32,32), g=s.g, gr=MAT.grass;
  paR(g,0,0,32,32,gr[3]);
  for(let p=0;p<3;p++){ // large soft tonal patches
    const px=Math.floor(phash(p,v,31)*24), py=Math.floor(phash(v,p,32)*24);
    paDithBayer(g,px,py,9,7,gr[3], p%2?gr[4]:gr[2], 0.45);
  }
  paNoise(g,0,0,32,32,[gr[2],gr[4],gr[1]],0.16,100+v);
  tBlades(g,16,200+v,[gr[4],gr[5],gr[3]]);
  tBlades(g,7,210+v,[gr[2],gr[3]]);
  if(v===1) tPebbles(g,3,220,MAT.stone);
  if(v===2){ // wildflowers
    const cols=['#e86a8a','#f2d06b','#ffffff','#b678e0'];
    for(let i=0;i<3;i++){
      const fx=3+Math.floor(phash(i,v,230)*26), fy=5+Math.floor(phash(v,i,231)*22);
      const col=cols[Math.floor(phash(i,v,232)*4)%4];
      paR(g,fx,fy,1,4,gr[2]);
      paPX(g,fx-1,fy-1,col); paPX(g,fx+1,fy-1,col);
      paPX(g,fx,fy-2,col); paPX(g,fx,fy-1,MAT.glowCore);
    }
  }
  if(v===3){ // worn dark patches
    for(let p=0;p<2;p++){
      const px=Math.floor(phash(p,v,240)*25), py=Math.floor(phash(v,p,241)*25);
      paDithBayer(g,px,py,8,6,gr[3],gr[1],0.5);
    }
    tPebbles(g,2,242,MAT.stoneWarm);
  }
  for(let i=0;i<8;i++) // light speckles, upper-left bias
    paPX(g,Math.floor(phash(i,v,250)*20),Math.floor(phash(v,i,251)*20),gr[5]);
  return s;
}

/* ---------------- dark grass (forest floor): 3 ---------------- */
function tDarkGrassTile(v){
  const s=paMk(32,32), g=s.g, gr=MAT.grass, ld=MAT.leafDeep;
  paR(g,0,0,32,32,gr[2]);
  paDithBayer(g,0,0,32,32,gr[2],gr[1],0.35);
  paNoise(g,0,0,32,32,[gr[1],ld[2],'#6b5a35',MAT.dirt[2]],0.20,300+v);
  for(let i=0;i<3;i++){ // twigs
    const x0=2+Math.floor(phash(i,v,310)*26), y0=2+Math.floor(phash(v,i,311)*26);
    paLine(g,x0,y0,x0+5,y0+1,MAT.dirt[2]);
  }
  tBlades(g,8,320+v,[gr[3],gr[2]]);
  for(let p=0;p<2;p++){ // deep cool patches
    const px=Math.floor(phash(p,v,330)*25), py=Math.floor(phash(v,p,331)*25);
    paDithBayer(g,px,py,9,7,gr[2],gr[0],0.4);
  }
  return s;
}

/* ---------------- dirt: 2 ---------------- */
function tDirtTile(v){
  const s=paMk(32,32), g=s.g, d=MAT.dirt;
  paR(g,0,0,32,32,d[3]);
  paDithBayer(g,0,0,32,32,d[3],d[4],0.3);
  paNoise(g,0,0,32,32,[d[2],d[4],d[1]],0.18,400+v);
  tPebbles(g,4,410+v,MAT.stone);
  for(let i=0;i<5;i++){ // clods
    const cx2=2+Math.floor(phash(i,v,420)*28), cy2=2+Math.floor(phash(v,i,421)*28);
    paR(g,cx2,cy2,2,2,d[2]); paPX(g,cx2,cy2,d[4]);
  }
  return s;
}

/* ---------------- path: 16 edge-mask variants ---------------- */
function tPathTile(m){
  const s=paMk(32,32), g=s.g, d=MAT.dirt, gr=MAT.grass;
  paR(g,0,0,32,32,d[3]);
  paDithBayer(g,4,4,24,24,d[3],d[4],0.35);   // trampled center
  paNoise(g,0,0,32,32,[d[2],d[4],d[1]],0.16,500+m);
  tPebbles(g,4,510+m,MAT.stoneWarm);
  for(let i=0;i<4;i++){ // clods
    const cx2=2+Math.floor(phash(i,m,520)*28), cy2=2+Math.floor(phash(m,i,521)*28);
    paR(g,cx2,cy2,2,1,d[2]);
  }
  const rim=(x,y,w,h,key)=>{
    paDithBayer(g,x,y,w,h,d[3],d[2],0.55);
    paNoise(g,x,y,w,h,[gr[2]],0.30,key);
  };
  if(!(m&1)){ rim(0,0,32,4,530+m); tEdgeBlades(g,0,0,32,4,540+m,'N'); }
  if(!(m&2)){ rim(0,28,32,4,550+m); tEdgeBlades(g,0,28,32,4,560+m,'S'); }
  if(!(m&4)){ rim(0,0,4,32,570+m); tEdgeBlades(g,0,0,4,32,580+m,'W'); }
  if(!(m&8)){ rim(28,0,4,32,590+m); tEdgeBlades(g,28,0,4,32,600+m,'E'); }
  return s;
}

/* ---------------- cobble (plaza): 2 ---------------- */
function tCobbleTile(v){
  const s=paMk(32,32), g=s.g, st=MAT.stone;
  paR(g,0,0,32,32,st[1]); // grout
  for(let j=0;j<4;j++){
    const oy=j*8, off=(j%2)*4;
    for(let i=-1;i<5;i++){
      const ox=i*8+off;
      const t=phash(i+10,j+v*7,610);
      const body=t<0.3?st[3]:(t<0.65?st[4]:st[2]);
      for(const sx of [ox,ox-32,ox+32]){ // wrapped offset rows (fillRect clips)
        paR(g,sx+1,oy+1,6,6,body);
        paR(g,sx+1,oy+1,6,2,st[5]);      // top light
        paR(g,sx+1,oy+5,6,2,st[1]);      // bottom shade
        paR(g,sx+1,oy+1,2,5,st[5]);      // left light
        paPX(g,sx+2,oy+2,st[6]);         // specular
        if(t>0.85) paR(g,sx+3,oy+3,2,2,st[5]);
        else if(t<0.12) paPX(g,sx+4,oy+4,st[1]);
      }
    }
  }
  if(v===1) // moss flecks in grout
    for(let i=0;i<14;i++){
      const gx=Math.floor(phash(i,v,620)*32), gy=(Math.floor(phash(v,i,621)*4)*8+7)%32;
      paPX(g,gx,gy,MAT.leaf[2]);
    }
  paNoise(g,0,0,32,32,[st[2]],0.05,630+v);
  return s;
}

/* ---------------- stone & mud (kept for interface) ---------------- */
function tStoneTile(){
  const s=paMk(32,32), g=s.g, st=MAT.stone;
  paR(g,0,0,32,32,st[3]);
  paDithBayer(g,0,0,32,32,st[3],st[2],0.3);
  paNoise(g,0,0,32,32,[st[2],st[4],st[5]],0.22,640);
  paLine(g,4,6,12,14,st[1]); paLine(g,12,14,11,22,st[1]);   // cracks
  paLine(g,22,8,26,18,st[2]);
  for(let i=0;i<6;i++) paPX(g,Math.floor(phash(i,3,641)*32),Math.floor(phash(3,i,642)*32),st[6]);
  return s;
}
function tMudTile(){
  const s=paMk(32,32), g=s.g, mu=rampOf('#7a5f3d');
  paR(g,0,0,32,32,mu[3]);
  for(let p=0;p<3;p++){ // wet patches
    const px=Math.floor(phash(p,9,650)*25), py=Math.floor(phash(9,p,651)*25);
    paDithBayer(g,px,py,9,7,mu[3],mu[1],0.45);
  }
  paNoise(g,0,0,32,32,[mu[2],mu[4]],0.18,652);
  for(let i=0;i<6;i++){ // clods
    const cx2=2+Math.floor(phash(i,4,653)*28), cy2=2+Math.floor(phash(4,i,654)*28);
    paR(g,cx2,cy2,2,2,mu[2]); paPX(g,cx2,cy2,mu[5]);
  }
  return s;
}

/* ---------------- sand: 2 ---------------- */
function tSandTile(v){
  const s=paMk(32,32), g=s.g, sd=MAT.sand;
  paR(g,0,0,32,32,sd[3]);
  paDithBayer(g,0,0,32,32,sd[3],sd[4],0.3);
  paNoise(g,0,0,32,32,[sd[2],sd[4],sd[5]],0.15,660+v);
  tPebbles(g,2,670+v,MAT.stoneWarm);
  for(let i=0;i<2;i++){ // tiny shells
    const sx=3+Math.floor(phash(i,v,680)*26), sy=3+Math.floor(phash(v,i,681)*26);
    paPX(g,sx,sy,'#f4efe2'); paPX(g,sx+1,sy,'#e8b8a8'); paPX(g,sx,sy+1,sd[2]);
  }
  return s;
}

/* ---------------- tilled soil: 2 ---------------- */
function tTilledTile(v){
  const s=paMk(32,32), g=s.g, so=rampOf('#6b4f30');
  paR(g,0,0,32,32,so[3]);
  for(let r=0;r<4;r++){
    const y=r*8, jx=(v*3+r*2)%5;
    paR(g,0,y,32,2,so[4]);          // ridge highlight
    paR(g,0,y+2,32,4,so[3]);
    paDithBayer(g,0,y+4,32,2,so[3],so[2],0.5);
    paR(g,0,y+6,32,2,so[1]);        // furrow shadow
    for(let i=0;i<4;i++){ // clods on ridge
      const cx2=(jx+i*8+Math.floor(phash(i,r,690)*4))%30, cy2=y+1+Math.floor(phash(r,i,691)*2);
      paR(g,cx2,cy2,2,2,so[2]); paPX(g,cx2,cy2,so[5]);
    }
  }
  paNoise(g,0,0,32,32,[so[1]],0.08,700+v);
  return s;
}

/* ---------------- water: 4 animated frames (tileable) ---------------- */
function tWaterFrame(f){
  const s=paMk(32,32), g=s.g, w=MAT.water;
  paR(g,0,0,32,32,w[3]);
  for(let p=0;p<4;p++){ // drifting tonal patches
    const px=Math.floor(phash(p,f,710)*25), py=Math.floor(phash(f,p,711)*25);
    paDithBayer(g,px,py,10,8,w[3], p%2?w[2]:w[4], 0.4);
  }
  paNoise(g,0,0,32,32,[w[2],w[4]],0.10,720+f);
  const off=f*8; // moving diagonal highlight streaks (wrap = tileable)
  for(let b=0;b<3;b++){
    for(let x=0;x<32;x++){
      const y=(x+off+b*11)%32;
      if(((x+b*3+f)&3)<2) paPX(g,x,y,w[4]);          // dashed soft streak
      if(((x*7+b*13+f*5)&7)===0) paPX(g,x,y,w[5]);   // sparse glint
    }
  }
  for(let i=0;i<7;i++){ // sparkles
    const sx=Math.floor(phash(i,f,730)*32), sy=Math.floor(phash(f,i,731)*32);
    if(phash(i,f,732)<0.6){ paPX(g,sx,sy,w[6]); paPX(g,(sx+1)%32,sy,w[5]); }
  }
  for(let i=0;i<8;i++) // deep speckles
    paPX(g,Math.floor(phash(i,f,733)*32),Math.floor(phash(f,i,734)*32),w[1]);
  return s;
}

/* ---------------- shore foam overlays: 16 masks x 2 frames ---------------- */
function tShoreTile(m,f){
  const s=paMk(32,32), g=s.g, w=MAT.water;
  const foamL='#f4fbff', foam='#dceffc', foamD='#a9c9e6';
  const wob=f; // foam creeps 1px on frame 2
  const band=(x,y,bw,bh)=>{
    paDithBayer(g,x,y,bw,bh,w[3],w[2],0.5);      // wet dark band
    const n=Math.floor(bw*bh/5);
    for(let i=0;i<n;i++){ // foam clusters
      const fx2=x+Math.floor(phash(i,m*7+f,740)*bw), fy2=y+Math.floor(phash(m*7+f,i,741)*bh);
      const r=phash(fx2,fy2,742);
      if(r<0.55) paPX(g,fx2,fy2, r<0.15?foamL:(r<0.38?foam:foamD));
    }
  };
  const crest=(x0,y0,len,horiz)=>{
    for(let i=0;i<len;i++){ // broken bright crest on outer edge
      if(phash(i,f,horiz?750:751)<0.72){
        const cx2=horiz?x0+i:x0, cy2=horiz?y0:y0+i;
        paPX(g,cx2,cy2,foamL);
        if(phash(i,f,752)<0.4){ // foam lip toward the water
          if(horiz) paPX(g,cx2,y0===0?cy2+1:cy2-1,foam);
          else paPX(g,x0===0?cx2+1:cx2-1,cy2,foam);
        }
      }
    }
  };
  if(m&1){ band(0,0,32,3+wob); crest(0,0,32,true); }
  if(m&2){ band(0,29-wob,32,3+wob); crest(0,31,32,true); }
  if(m&4){ band(0,0,3+wob,32); crest(0,0,32,false); }
  if(m&8){ band(29-wob,0,3+wob,32); crest(31,0,32,false); }
  return s;
}

/* ---------------- bridge planks: 2 variants ---------------- */
function tBridgeTile(v){
  const s=paMk(32,32), g=s.g, w=MAT.water, wd=MAT.wood;
  paR(g,0,0,32,32,w[2]); // water beneath
  paDithBayer(g,0,0,32,32,w[2],w[3],0.4);
  paNoise(g,0,0,32,32,[w[4]],0.08,760+v);
  texPlanksH(g,0,8,32,16,wd,770+v); // deck
  for(let i=0;i<4;i++){ paPX(g,5+i*8,11,wd[1]); paPX(g,5+i*8,21,wd[1]); } // pegs
  paR(g,0,8,32,1,wd[5]); paR(g,0,23,32,1,wd[1]);
  for(const ry of [1,25]){ // rails
    texPlanksH(g,0,ry,32,6,wd,780+ry+v);
    for(const px of [2,14,26]){
      paR(g,px,ry-2,4,10,wd[3]);
      paR(g,px,ry-2,4,2,wd[4]);
      paR(g,px,ry+6,4,2,wd[1]);
      paR(g,px,ry+3,4,2,MAT.leather[3]); // rope lashing
      paPX(g,px,ry+3,MAT.leather[5]);
    }
  }
  return s;
}

/* ---------------- wood floor ---------------- */
function tFloorTile(){
  const s=paMk(32,32), g=s.g;
  texPlanksV(g,0,0,32,32,MAT.wood,790);
  paNoise(g,0,0,32,32,[MAT.wood[4]],0.05,791);
  return s;
}

/* ---------------- BUILD ---------------- */
function buildTerrain(){
  const T=PA.terrain;
  T.grass=[];     for(let v=0;v<4;v++) T.grass.push(tGrassTile(v));
  T.darkgrass=[]; for(let v=0;v<3;v++) T.darkgrass.push(tDarkGrassTile(v));
  T.dirt=[];      for(let v=0;v<2;v++) T.dirt.push(tDirtTile(v));
  T.path=[];      for(let m=0;m<16;m++) T.path.push(tPathTile(m));
  T.cobble=[];    for(let v=0;v<2;v++) T.cobble.push(tCobbleTile(v));
  T.stone=tStoneTile();
  T.mud=tMudTile();
  T.sand=[];      for(let v=0;v<2;v++) T.sand.push(tSandTile(v));
  T.tilled=[];    for(let v=0;v<2;v++) T.tilled.push(tTilledTile(v));
  T.water=[];     for(let f=0;f<4;f++) T.water.push(tWaterFrame(f));
  T.shore=[];     for(let m=0;m<16;m++){ const fr=[]; for(let f=0;f<2;f++) fr.push(tShoreTile(m,f)); T.shore.push(fr); }
  T.bridge=[];    for(let v=0;v<2;v++) T.bridge.push(tBridgeTile(v));
  T.floor=tFloorTile();
}
