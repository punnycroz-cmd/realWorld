/* =====================================================================
   PA-VEG v6 — premium hand-crafted vegetation & crop sprites.
   Bottom-center anchored; every sprite carries a dithered ground shadow.
   Sizes are old_cells x2 px (same on-screen footprint as before).
   Interface: buildVeg() fills PA.veg with:
     tree[4], pine[3], bush[3], flower{pink,yellow,white,purple},
     rock[3], mushroom[2], reeds[2], stump, log, tuft[3],
     herb[3][2], crop[3][2]
   Paint order: shadow (separate layer) <- body <- paOutline silhouette.
   Canopy interiors are painted dark (occlusion), never transparent,
   so the outline hugs only the outer silhouette.
   ===================================================================== */

/* small leaf cluster: base blob, warm UL highlight, cool LR shade */
function vtLeaf(g,x,y,r,leaf){
  paBlob(g,x,y,r,leaf[3]);
  paBlob(g,x-1,y-1,Math.max(1,r-2),leaf[4]);
  paPX(g,x-Math.round(r*0.5),y-Math.round(r*0.5),leaf[5]);
  paBlob(g,x+1,y+1,Math.max(1,r-2),leaf[2]);
}
/* rock cluster with UL light / LR shade / crack */
function vtRockBlob(g,cx,cy,r,st){
  paBlob(g,cx,cy,r,st[3]);
  paBlob(g,cx-1,cy-1,Math.max(1,r-2),st[4]);
  paPX(g,cx-Math.round(r*0.4),cy-Math.round(r*0.5),st[6]);
  paBlob(g,cx+1,cy+1,Math.max(1,r-3),st[2]);
  paLine(g,cx-2,cy-3,cx+1,cy+2,st[1]);
  for(let i=0;i<4;i++)
    paPX(g,cx-Math.round(r/2)+Math.floor(phash(i,cx,101)*r),
           cy-Math.round(r/2)+Math.floor(phash(cy,i,102)*r),st[5]);
}
/* point-up triangle (pine tiers) */
function vtTri(g,cx,yTop,yBot,halfW,col){
  for(let y=yTop;y<=yBot;y++){
    const t=(y-yTop)/Math.max(1,(yBot-yTop)), w=Math.round(halfW*t);
    paR(g,cx-w,y,w*2+1,1,col);
  }
}
/* finish: outline the painted body, then composite over ground shadow */
function vtFinish(w,h,shadowFn,paint){
  const body=paMk(w,h); paint(body.g);
  paOutline(body.c,MAT.outline);
  const s=paMk(w,h), g=s.g;
  if(shadowFn) shadowFn(g);
  g.drawImage(body.c,0,0);
  return s;
}

/* ---------------- TREES: 4 oak variants ---------------- */
function vTree(vi){
  const shapes=[
    {w:52,h:64,can:[[0,-26,13],[-13,-20,9],[13,-21,9],[0,-34,12],[-8,-19,7],[8,-20,7]],apples:true},
    {w:48,h:68,can:[[-8,-24,11],[8,-27,11],[0,-36,12],[0,-20,8]]},
    {w:56,h:60,can:[[-16,-20,10],[16,-20,10],[0,-26,13],[-8,-30,9],[8,-30,9]]},
    {w:48,h:66,can:[[-10,-22,10],[6,-21,11],[4,-34,11],[-12,-28,9]],lean:3},
  ];
  const ts=shapes[vi];
  const cx=ts.w/2+(ts.lean||0), base=ts.h-4;
  const leaf=MAT.leaf, ld=MAT.leafDeep, tk=MAT.trunk;
  const leafDk=[leaf[0],leaf[1],leaf[1],leaf[2],leaf[2],leaf[3],leaf[4]];
  const leafLt=[leaf[1],leaf[2],leaf[2],leaf[3],leaf[4],leaf[5],leaf[6]];
  return vtFinish(ts.w,ts.h,
    (g)=>paGroundShadow(g,ts.w/2,ts.h-3,Math.round(ts.w*0.30),3),
    (g)=>{
      // roots
      paR(g,cx-7,base-3,5,4,tk[2]); paR(g,cx+2,base-3,5,4,tk[2]);
      paR(g,cx-6,base-3,2,4,tk[3]); paR(g,cx+4,base-3,1,4,tk[4]);
      // tapered trunk
      for(let y=0;y<24;y++){
        const wpx=Math.round(8-(y/24)*3);
        paR(g,cx-Math.floor(wpx/2)+(ts.lean?Math.round(ts.lean*y/24):0),base-4-y,wpx,1,tk[3]);
      }
      paR(g,cx-4,base-24,1,18,tk[2]);            // left shade streak
      paR(g,cx+1,base-22,1,16,tk[4]);            // right light streak
      for(let i=0;i<8;i++){ // bark texture
        const bx=cx-4+Math.floor(phash(i,vi,50)*8), by=base-5-Math.floor(phash(vi,i,51)*18);
        paR(g,bx,by,1,3+Math.floor(phash(i,vi,52)*4), i%2?tk[2]:tk[4]);
      }
      paPX(g,cx+2,base-13,tk[1]); paPX(g,cx+3,base-13,tk[1]); // knot
      paPX(g,cx+2,base-14,tk[5]);
      // canopy interior: dark occlusion mass
      for(const c of ts.can) paBlob(g,cx+c[0],base+c[1],c[2],ld[1]);
      for(const c of ts.can) paBlob(g,cx+c[0]-2,base+c[1]-2,Math.max(1,c[2]-4),ld[2]);
      const inside=(x,y)=>{
        for(const c of ts.can){
          const dx=x-(cx+c[0]), dy=y-(base+c[1]);
          if(dx*dx+dy*dy<(c[2]-1)*(c[2]-1)) return true;
        }
        return false;
      };
      // many overlapping leaf clusters; tone follows light (UL warm)
      const n=52+vi*6;
      for(let i=0;i<n;i++){
        const b=ts.can[Math.floor(phash(i,vi,60)*ts.can.length)];
        const ang=phash(i,vi,61)*Math.PI*2, rad=Math.sqrt(phash(vi,i,62))*(b[2]-1);
        const lx=Math.round(cx+b[0]+Math.cos(ang)*rad), ly=Math.round(base+b[1]+Math.sin(ang)*rad*0.85);
        if(!inside(lx,ly)) continue;
        const cr=2+Math.floor(phash(i,vi,63)*3);
        const lit=((cx-lx)+(base-ly))/70;
        vtLeaf(g,lx,ly,cr, lit>0.3?leafLt:(lit<-0.35?leafDk:leaf));
      }
      // dappled light speckles (UL) + deep speckles (low)
      for(let i=0;i<18;i++){
        const b=ts.can[Math.floor(phash(i,vi,64)*ts.can.length)];
        const lx=Math.round(cx+b[0]-Math.abs(phash(i,vi,65)-0.3)*b[2]);
        const ly=Math.round(base+b[1]-Math.abs(phash(vi,i,66)-0.3)*b[2]);
        if(inside(lx,ly)) paPX(g,lx,ly,phash(i,vi,67)<0.5?leaf[5]:leaf[6]);
      }
      for(let i=0;i<12;i++){
        const b=ts.can[Math.floor(phash(i,vi,68)*ts.can.length)];
        const lx=Math.round(cx+b[0]+Math.abs(phash(i,vi,69)-0.5)*b[2]*0.8);
        const ly=Math.round(base+b[1]+Math.abs(phash(vi,i,70)-0.5)*b[2]*0.6);
        if(inside(lx,ly)) paPX(g,lx,ly,ld[0]);
      }
      if(ts.apples){ // apples on variant 0
        const ap=rampOf('#d94f3d');
        for(let i=0;i<6;i++){
          const b=ts.can[Math.floor(phash(i,9,71)*ts.can.length)];
          const ax2=Math.round(cx+b[0]+phash(i,9,72)*b[2]*1.2-b[2]*0.6);
          const ay2=Math.round(base+b[1]+phash(9,i,73)*b[2]-2);
          if(!inside(ax2,ay2)) continue;
          paBlob(g,ax2,ay2,2,ap[3]); paPX(g,ax2-1,ay2-1,ap[5]); paPX(g,ax2,ay2+1,ap[1]);
        }
      }
    });
}

/* ---------------- PINES: 3 variants ---------------- */
function vPine(v){
  const w=44,h=72,cx=w/2,base=h-4,pn=MAT.pine,tk=MAT.trunk;
  const tiers=[
    {hw:17,y:base-10,top:base-28},
    {hw:13,y:base-25,top:base-40},
    {hw:9, y:base-37,top:base-52},
  ];
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,h-3,13,3),
    (g)=>{
      paR(g,cx-3,base-9,6,9,tk[3]);
      paR(g,cx-3,base-9,2,9,tk[2]); paR(g,cx+1,base-9,1,9,tk[4]);
      tiers.forEach((t,ti)=>{
        vtTri(g,cx,t.top,t.y,t.hw,pn[2]);                    // tier mass
        vtTri(g,cx,t.top,t.top+4,Math.round(t.hw*0.25),pn[4]);// crown light
        const n=t.hw*4; // needle strokes
        for(let i=0;i<n;i++){
          const yy=t.top+2+Math.floor(phash(i,v+ti*9,80)*(t.y-t.top-4));
          const tt=(yy-t.top)/Math.max(1,(t.y-t.top)), hw2=t.hw*tt;
          const xx=cx-hw2+Math.floor(phash(v+ti,i,81)*hw2*2);
          const c=phash(i,v+ti,82);
          paPX(g,xx,yy, c<0.35?pn[4]:(c<0.7?pn[3]:pn[2]));
          paPX(g,xx+1,yy+1, c<0.35?pn[3]:pn[1]);
        }
        for(let yy=t.top+2;yy<t.y;yy+=2){ // crisp tier edges
          const tt=(yy-t.top)/Math.max(1,(t.y-t.top)), hw2=Math.round(t.hw*tt);
          paPX(g,cx-hw2,yy,pn[4]); paPX(g,cx-hw2,yy+1,pn[3]);
          paPX(g,cx+hw2,yy,pn[1]);
        }
        vtTri(g,cx,t.y-5,t.y,t.hw,pn[1]);                    // branch shadow under tier
        paR(g,cx-Math.round(t.hw*0.7),t.y-1,Math.round(t.hw*1.4),1,pn[0]); // occlusion line
      });
      paR(g,cx-1,base-58,2,7,pn[3]); paPX(g,cx,base-59,pn[5]); // leader shoot
    });
}

/* ---------------- BUSHES: 3 ---------------- */
function vBush(v){
  const w=36,h=32,cx=w/2,base=h-3;
  const leaf=MAT.leaf, ld=MAT.leafDeep;
  const blobs=v===0?[[-8,-8,9],[8,-8,9],[0,-13,10]]
            :v===1?[[-6,-6,8],[6,-7,8],[0,-10,8]]
            :[[-10,-6,8],[0,-8,11],[10,-6,8]];
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,base,13,2),
    (g)=>{
      for(const b of blobs) paBlob(g,cx+b[0],base+b[1],b[2],ld[1]);
      const inside=(x,y)=>{
        for(const b of blobs){
          const dx=x-(cx+b[0]), dy=y-(base+b[1]);
          if(dx*dx+dy*dy<(b[2]-1)*(b[2]-1)) return true;
        }
        return false;
      };
      for(let i=0;i<26;i++){
        const b=blobs[Math.floor(phash(i,v,90)*blobs.length)];
        const ang=phash(i,v,91)*Math.PI*2, rad=Math.sqrt(phash(v,i,92))*(b[2]-1);
        const lx=Math.round(cx+b[0]+Math.cos(ang)*rad), ly=Math.round(base+b[1]+Math.sin(ang)*rad*0.8);
        if(!inside(lx,ly)) continue;
        vtLeaf(g,lx,ly,2+Math.floor(phash(i,v,93)*2),leaf);
      }
      for(let i=0;i<8;i++){ // speckles
        const lx=Math.round(cx+phash(i,v,94)*20-10), ly=Math.round(base-8+phash(v,i,95)*6-4);
        if(inside(lx,ly)) paPX(g,lx,ly,phash(i,v,96)<0.6?leaf[5]:ld[0]);
      }
      if(v===2){ // berries
        const br=rampOf('#d94f3d');
        for(let i=0;i<7;i++){
          const bx2=Math.round(cx+phash(i,v,97)*18-9), by2=Math.round(base-7+phash(v,i,98)*8-4);
          if(!inside(bx2,by2)) continue;
          paPX(g,bx2,by2,br[3]); paPX(g,bx2,by2-1,br[5]);
        }
      }
    });
}

/* ---------------- FLOWERS ---------------- */
function vFlower(name,col){
  const w=14,h=22,cx=7,base=h-2,pr=rampOf(col),lf=MAT.leaf;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,base,5,2),
    (g)=>{
      paR(g,cx-1,8,2,12,lf[2]);
      paPX(g,cx-1,9,lf[4]); paPX(g,cx-1,12,lf[4]);
      paEllipse(g,cx-3,14,3,2,lf[3]); paEllipse(g,cx+3,16,3,2,lf[2]);
      paPX(g,cx-4,13,lf[5]); paPX(g,cx+2,15,lf[4]);
      const pc=[[0,-3],[-3,-1],[3,-1],[-2,2],[2,2]];
      for(const p of pc) paBlob(g,cx+p[0],6+p[1],2,pr[3]);   // petals
      for(const p of pc) paPX(g,cx+p[0]-1,5+p[1],pr[5]);     // petal glints
      paBlob(g,cx,6,2,pr[2]);                                // throat shade
      paPX(g,cx,6,MAT.glowCore); paPX(g,cx-1,5,pr[1]);
    });
}

/* ---------------- GRASS TUFTS: 3 ---------------- */
function vTuft(v){
  const w=18,h=16;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,9,h-2,7,2),
    (g)=>{
      for(let i=0;i<9;i++){
        const bx=2+Math.floor(phash(i,v,110)*14);
        const ht=4+Math.floor(phash(v,i,111)*7);
        const lean=Math.floor(phash(i,v,112)*5)-2;
        const dry=phash(v,i,113)<0.22;
        const cA=dry?MAT.grassDry[2]:MAT.grass[2], cB=dry?MAT.grassDry[4]:MAT.grass[4];
        const tip=dry?MAT.grassDry[5]:MAT.grass[5];
        for(let k=0;k<ht;k++){
          const x=bx+Math.round(lean*k/ht);
          paPX(g,x,h-3-k, k>ht-3?tip:(k%2?cA:cB));
        }
      }
    });
}

/* ---------------- MUSHROOMS: 2 ---------------- */
function vMushroom(v){
  const cap=rampOf(v===0?'#d94f3d':'#a3703d');
  const w=v===0?14:12, h=v===0?14:12, cx=Math.floor(w/2), base=h-2;
  const cw=v===0?6:5;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,base,5,2),
    (g)=>{
      paR(g,cx-2,base-6,4,6,MAT.plaster[3]);                 // stem
      paR(g,cx-2,base-6,1,6,MAT.plaster[1]);
      paPX(g,cx+1,base-5,MAT.plaster[5]); paPX(g,cx+1,base-3,MAT.plaster[5]);
      paEllipse(g,cx,base-7,cw,4,cap[3]);                    // cap dome
      paR(g,cx-cw,base-7,cw*2,2,cap[2]);                     // underside
      for(let i=-3;i<=3;i++) paPX(g,cx+i,base-6,cap[1]);     // gills
      paEllipse(g,cx-2,base-9,3,2,cap[4]);                   // cap light
      paPX(g,cx-3,base-10,cap[6]);
      paBlob(g,cx+2,base-8,1,cap[2]);                        // cap shade patch
      const spots=v===0?[[-3,-2],[2,-3],[0,-1]]:[[-2,-2],[2,-1]];
      for(const sp of spots) paPX(g,cx+sp[0],base-7+sp[1],'#f4efe2');
    });
}

/* ---------------- REEDS (cattails): 2 ---------------- */
function vReeds(v){
  const w=22,h=30,lf=MAT.leaf,tk=MAT.trunk;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,11,h-2,9,2),
    (g)=>{
      const n=4+(v%2);
      for(let i=0;i<n;i++){
        const bx=3+i*4+(v?1:0);
        const ht=15+Math.floor(phash(i,v,120)*8);
        const lean=Math.floor(phash(v,i,121)*5)-2;
        const top=h-3-ht;
        for(let k=0;k<ht;k++) // stalk
          paPX(g,bx+Math.round(lean*k/ht),h-4-k, k%2?lf[2]:lf[3]);
        paPX(g,bx+Math.round(lean*0.3)-1,top+3,lf[5]);
        const hx=bx+Math.round(lean); // cattail head
        paR(g,hx-1,top-6,3,7,tk[3]);
        paR(g,hx-1,top-6,1,7,tk[5]);
        paR(g,hx+1,top-6,1,7,tk[1]);
        paPX(g,hx,top-7,lf[4]);
      }
      for(let i=0;i<3;i++){ // arching leaves
        const sx=4+Math.floor(phash(i,v,122)*14), dir=phash(v,i,123)<0.5?-1:1;
        for(let k=0;k<8;k++) paPX(g,sx+dir*k,h-4-Math.round(k*0.7),k%2?lf[3]:lf[2]);
      }
    });
}

/* ---------------- STUMP ---------------- */
function vStump(){
  const w=22,h=18,cx=11,base=h-2,tk=MAT.trunk,lf=MAT.leaf;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,base,9,2),
    (g)=>{
      paR(g,cx-8,base-3,5,3,tk[2]); paR(g,cx+3,base-3,5,3,tk[2]); // roots
      paPX(g,cx-7,base-3,tk[3]); paPX(g,cx+6,base-3,tk[3]);
      paR(g,cx-6,base-10,12,8,tk[3]);                            // body
      for(let i=0;i<5;i++){ // bark streaks
        const bx=cx-5+i*2+Math.floor(phash(i,7,130)*2);
        paR(g,bx,base-9,1,6, i%2?tk[2]:tk[4]);
      }
      paEllipse(g,cx,base-10,7,3,MAT.woodDark[2]);                // top rim
      paEllipse(g,cx,base-10,5,2,MAT.woodPale[3]);               // cut face
      paEllipse(g,cx,base-10,3,1,MAT.woodPale[2]);               // inner ring
      paPX(g,cx,base-10,MAT.woodPale[4]);
      paPX(g,cx-6,base-6,lf[3]); paPX(g,cx-5,base-5,lf[2]);      // moss
      paPX(g,cx+5,base-4,lf[3]);
    });
}

/* ---------------- LOG ---------------- */
function vLog(){
  const w=34,h=16,tk=MAT.trunk,lf=MAT.leaf;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,17,h-2,15,2),
    (g)=>{
      paR(g,3,5,28,7,tk[3]);                                    // body
      paR(g,3,5,28,2,tk[4]);                                    // top light
      paR(g,3,10,28,2,tk[1]);                                   // bottom shade
      for(let i=0;i<10;i++){ // bark streaks
        const bx=4+Math.floor(phash(i,3,131)*25);
        paR(g,bx,7,2+Math.floor(phash(3,i,132)*3),1,tk[2]);
        paR(g,bx,9,3,1,tk[4]);
      }
      paEllipse(g,3,8,3,4,MAT.woodDark[2]);                     // end grain
      paEllipse(g,3,8,2,3,MAT.woodPale[3]);
      paPX(g,3,8,MAT.woodPale[2]); paPX(g,2,7,MAT.woodPale[5]);
      paR(g,20,2,3,4,tk[2]); paPX(g,21,2,tk[4]);                // branch stub
      for(let i=0;i<7;i++) paPX(g,6+Math.floor(phash(i,5,133)*20),5,lf[3]); // moss
      paPX(g,9,6,lf[2]); paPX(g,22,5,lf[2]);
    });
}

/* ---------------- ROCKS: 3 ---------------- */
function vRock(v){
  const sizes=[[26,16],[30,22],[32,20]];
  const w=sizes[v][0], h=sizes[v][1], cx=Math.floor(w/2), base=h-2, st=MAT.stone;
  return vtFinish(w,h,
    (g)=>paGroundShadow(g,cx,base,Math.round(w*0.42),2),
    (g)=>{
      if(v===0){
        vtRockBlob(g,9,base-4,6,st);
        vtRockBlob(g,19,base-2,4,st);
      } else if(v===1){
        vtRockBlob(g,cx,base-6,9,st);
        paPX(g,cx-5,base-11,st[5]); paPX(g,cx+4,base-4,st[1]);
      } else {
        vtRockBlob(g,10,base-5,7,st);
        vtRockBlob(g,22,base-4,5,st);
        for(let i=0;i<9;i++) // moss
          paPX(g,5+Math.floor(phash(i,v,134)*10),base-11+Math.floor(phash(v,i,135)*5),
               i%2?MAT.leaf[2]:MAT.leaf[3]);
      }
    });
}

/* ---------------- CROPS & HERBS: 3 stages x 2 sway ---------------- */
function vCropFrames(kind){
  const stages=[];
  for(let st=0;st<3;st++){
    const fr=[];
    for(let f=0;f<2;f++){
      const w=24,h=36,cx=12,base=h-3,sw=f?1:0,lf=MAT.leaf;
      const spr=vtFinish(w,h,
        (g)=>paGroundShadow(g,cx,base,8,2),
        (g)=>{
          if(st===0){ // sprout
            paR(g,cx,base-7,1,7,lf[2]);
            paEllipse(g,cx-3+sw,base-6,3,2,lf[3]);
            paEllipse(g,cx+3+sw,base-8,3,2,lf[4]);
            paPX(g,cx-4+sw,base-7,lf[5]); paPX(g,cx+2+sw,base-9,lf[6]);
          } else if(st===1){ // leafy plant
            paR(g,cx,base-15,2,15,lf[2]);
            paPX(g,cx,base-14,lf[4]);
            const leaves=[[-5,-10,4],[5,-8,4],[-3,-15,3],[4,-13,3]];
            for(const L of leaves){
              paEllipse(g,cx+L[0]+sw,base+L[1],L[2],Math.round(L[2]*0.6),lf[3]);
              paEllipse(g,cx+L[0]+sw-1,base+L[1]-1,Math.max(1,L[2]-2),Math.max(1,Math.round(L[2]*0.4)),lf[4]);
              paPX(g,cx+L[0]+sw-1,base+L[1]-1,lf[5]);
            }
            paBlob(g,cx+sw,base-17,2,lf[4]); // bud
          } else if(kind==='crop'){ // mature: pumpkin + tomato vine
            paR(g,cx-7,base-11,14,2,lf[2]);
            paPX(g,cx-6,base-11,lf[4]); paPX(g,cx+5,base-12,lf[1]);
            paR(g,cx+sw,base-17,2,9,lf[3]);
            paEllipse(g,cx-7+sw,base-12,4,2,lf[3]);
            paEllipse(g,cx+7+sw,base-10,4,2,lf[2]);
            paPX(g,cx-8+sw,base-13,lf[5]);
            const pk=rampOf('#e8862e'); // pumpkin
            paEllipse(g,cx-3+sw,base-7,6,5,pk[3]);
            for(let ri=-1;ri<=1;ri++)
              paLine(g,cx-3+sw+ri*3,base-11,cx-3+sw+ri*3,base-3,pk[2]);
            paEllipse(g,cx-5+sw,base-9,2,2,pk[5]);
            paPX(g,cx-6+sw,base-10,pk[6]);
            paR(g,cx-4+sw,base-13,2,2,pk[2]);
            const tm=rampOf('#d94f3d'); // tomato
            paBlob(g,cx+5+sw,base-5,3,tm[3]);
            paPX(g,cx+4+sw,base-6,tm[5]); paPX(g,cx+6+sw,base-4,tm[1]);
            paPX(g,cx+5+sw,base-8,lf[4]);
          } else { // mature herb: flowering bush
            const bl=[[-4,-8,5],[4,-10,5],[0,-14,5],[-2,-5,4],[3,-6,4]];
            for(const b of bl){
              paBlob(g,cx+b[0]+sw,base+b[1],b[2],lf[3]);
              paBlob(g,cx+b[0]+sw-1,base+b[1]-1,Math.max(1,b[2]-2),lf[4]);
              paPX(g,cx+b[0]+sw-2,base+b[1]-2,lf[5]);
            }
            const fl=rampOf('#b678e0');
            for(let i=0;i<8;i++){
              const hx2=cx+sw+Math.round(prange(-5,5)), hy2=base-12+Math.round(prange(-5,4));
              paPX(g,hx2,hy2,fl[3]); paPX(g,hx2,hy2-1,fl[5]);
            }
          }
        });
      fr.push(spr);
    }
    stages.push(fr);
  }
  return stages;
}

/* ---------------- BUILD ---------------- */
function buildVeg(){
  const V=PA.veg;
  V.tree=[];     for(let i=0;i<4;i++) V.tree.push(vTree(i));
  V.pine=[];     for(let i=0;i<3;i++) V.pine.push(vPine(i));
  V.bush=[];     for(let i=0;i<3;i++) V.bush.push(vBush(i));
  V.flower={
    pink:  vFlower('pink','#e86a8a'),
    yellow:vFlower('yellow','#f2d06b'),
    white: vFlower('white','#f4f4f4'),
    purple:vFlower('purple','#b678e0'),
  };
  V.tuft=[];     for(let i=0;i<3;i++) V.tuft.push(vTuft(i));
  V.mushroom=[vMushroom(0),vMushroom(1)];
  V.reeds=[vReeds(0),vReeds(1)];
  V.stump=vStump();
  V.log=vLog();
  V.rock=[vRock(0),vRock(1),vRock(2)];
  V.crop=vCropFrames('crop');
  V.herb=vCropFrames('herb');
}
