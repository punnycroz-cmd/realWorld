/* =====================================================================
   PA-CHARS v8 — complete fresh redesign, chunky storybook style.
   Painted at 2px clusters: art is authored on a 24x32 logical canvas,
   given a thick pure-black outline, then upscaled 2x into the 48x64 game
   frame. Huge heads (~45% of height), minimal dot-eye faces + blush,
   flat 2-tone materials, chunky boots, bold black outlines.
   Interface: buildChars(), paCharDraw(g,v), workFor(name).
   dir: 0=front, 1=back, 2=profile-left (face=3 mirrors at draw time).
   ===================================================================== */

/* contract helpers (must remain) */
function cR(g,x,y,w,h,col){ paR(g,x,y,w,h,col); }
function cP(g,x,y,col){ paPX(g,x,y,col); }
function cBlob(g,cx,cy,r,col){ paBlob(g,cx,cy,r,col); }

/* shared v8 style language */
const N_OUTL='#14100c';   /* pure black outline for everyone */
const N_EYE='#14100c', N_BLUSH='#f28f8f', N_MOUTH='#8a4030', N_MOUTH_O='#5e2818';

/* Skeleton, 24x32 logical units (all villagers share these proportions):
     hat    y 0..7
     head   x 4..20, y 6..18  (hair mass; face skin inside x 5..19 y 8..17)
     torso  x 8..16, y 18..25
     arms   x 5..8 and 16..19, y 18..24 (hands = 2x2 skin squares)
     legs   x 9..11 and 13..15, y 25..28
     boots  y 27..31 (7 wide x 4 tall, chunky)
   Face anchors (relative to dy bob):
     front:   eyes (9,11)+(14,11) 1x2 | blush (7,13)+(16,13) 1x1
              mouth (11,14) 2x1 (open: 2x2 dark)
     profile: eye (4,11) 1x2 | blush (3,13) 1x1 | mouth (3,14) 2x1
   Use nvFaceFront / nvFaceProfile so every face matches. */

/* minimal face, front */
function nvFaceFront(g,dy,blink,open){
  if(blink){ paR(g,9,12+dy,1,1,N_EYE); paR(g,14,12+dy,1,1,N_EYE); }
  else { paR(g,9,11+dy,1,2,N_EYE); paR(g,14,11+dy,1,2,N_EYE); }
  paR(g,7,13+dy,1,1,N_BLUSH); paR(g,16,13+dy,1,1,N_BLUSH);
  if(open) paR(g,11,14+dy,2,2,N_MOUTH_O);
  else paR(g,11,14+dy,2,1,N_MOUTH);
}
/* minimal face, profile facing left */
function nvFaceProfile(g,dy,blink,open){
  if(blink) paR(g,4,12+dy,1,1,N_EYE);
  else paR(g,4,11+dy,1,2,N_EYE);
  paR(g,3,13+dy,1,1,N_BLUSH);
  if(open) paR(g,3,14+dy,2,2,N_MOUTH_O);
  else paR(g,3,14+dy,2,1,N_MOUTH);
}

/* big chunky boot, front view, 7 wide x 4 tall, top-left at (x,y) */
function nvBoot(g,x,y,B,BD){
  paR(g,x,y,5,3,B);
  paR(g,x-1,y+2,7,2,B);
  paR(g,x-1,y+3,7,1,BD);
  paR(g,x+3,y,2,3,BD);
}
/* profile boot, toe pointing left */
function nvBootP(g,x,y,B,BD){
  paR(g,x+1,y,5,3,B);
  paR(g,x,y+2,8,2,B);
  paR(g,x,y+3,8,1,BD);
  paR(g,x+4,y,2,3,BD);
}

/* walk arm swing helper: -1/0/1 by walk frame */
function nvSwing(fr){ return fr===0?-1:(fr===2?1:0); }

/* legs + boots for standing poses; framework-drawn so every walk matches */
function nvLegsBoots(g,dir,act,fr,dy,pal){
  let l1=25,l2=25;
  if(act==='walk'){ if(fr===0)l1=24; else if(fr===2)l2=24; }
  if(dir===2){
    paR(g,8,l1+dy,2,3,pal.pants); paR(g,11,l2+dy,2,3,pal.pants);
    nvBootP(g,5,l1+3+dy,pal.boots,pal.bootsD);
    nvBootP(g,9,l2+3+dy,pal.boots,pal.bootsD);
  } else {
    paR(g,9,l1+dy,2,3,pal.pants); paR(g,13,l2+dy,2,3,pal.pants);
    nvBoot(g,7,l1+3+dy,pal.boots,pal.bootsD);
    nvBoot(g,12,l2+3+dy,pal.boots,pal.bootsD);
  }
}

/* seated pose, shared; headFn = villager's head-front painter */
function nvSit(g,pal,headFn,fr){
  const blink=fr===1;
  paR(g,5,27,14,3,pal.pants);              /* folded legs */
  paEllipse(g,12,28,7,2,pal.pants);
  nvBoot(g,3,27,pal.boots,pal.bootsD);
  nvBoot(g,16,27,pal.boots,pal.bootsD);
  paR(g,8,20,8,7,pal.shirt);               /* torso */
  paR(g,14,21,2,6,pal.shirtD);
  if(pal.apron){ paR(g,9,21,6,6,pal.apron); paR(g,13,22,2,5,pal.apronD); }
  paR(g,5,21,3,4,pal.shirt); paR(g,16,21,3,4,pal.shirt);  /* resting arms */
  paR(g,5,24,2,2,pal.skin); paR(g,17,24,2,2,pal.skin);
  headFn(g,0,2,blink,false);
}

/* sleeping body, shared; pal.sleepHat(g) optional */
function nvSleepPaint(g,pal){
  paR(g,1,18,6,5,'#e8e0d0');               /* pillow */
  paEllipse(g,6,20,4,3,pal.skin);           /* head */
  paR(g,2,17,8,2,pal.hair);                /* hair cap */
  paR(g,3,17,1,2,pal.hairD);
  paR(g,4,20,1,1,N_EYE); paR(g,7,20,1,1,N_EYE);  /* closed eyes */
  paR(g,10,18,8,6,pal.shirt);               /* body */
  paR(g,10,20,11,5,'#7a5c9e');              /* blanket */
  paR(g,10,20,11,1,'#5f4580');
  nvBoot(g,18,19,pal.boots,pal.bootsD);     /* boots peek out */
  if(pal.sleepHat) pal.sleepHat(g);
}

/* ================= MARTA (Farmer, tool: hoe) ================= */
const martaPal={skin:'#f5cfa0',skinD:'#dfa878',hair:'#7a4a2c',hairD:'#5a3520',shirt:'#cf6a26',shirtD:'#a34e1a',pants:'#3b6ea5',pantsD:'#2c4f7d',boots:'#6b4a26',bootsD:'#4e3319',apron:null,apronD:null};

function martaHead(g,dir,dy,blink,open){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=martaPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD;
  const STRAW='#e8c35a',STRAWD='#c9a043',BAND='#a32e2e';
  const hat=()=>{ R(8,1,9,3,STRAW); R(8,3,9,1,BAND); R(15,1,2,2,STRAWD); R(3,4,19,3,STRAW); R(3,6,19,1,STRAWD); };
  if(dir===1){
    R(4,6,17,13,HR); hat();
    for(let i=0;i<8;i++){ R(5,17+i,3,1,i%2?HRD:HR); R(17,17+i,3,1,i%2?HR:HRD); }
    R(5,24,3,1,BAND); R(17,24,3,1,BAND);
    return;
  }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(4,7,3,11,HR); R(18,7,3,11,HR);
    R(4,7,1,11,HRD); R(20,7,1,11,HRD);
    R(5,7,15,2,HR);
    for(let i=0;i<7;i++){ R(4,10+i,3,1,i%2?HR:HRD); R(18,10+i,3,1,i%2?HRD:HR); }
    R(4,17,3,1,BAND); R(18,17,3,1,BAND);
  }else{
    R(11,6,10,13,HR); R(19,7,2,12,HRD);
    R(5,7,8,2,HR);
    for(let i=0;i<7;i++){ R(4,10+i,3,1,i%2?HR:HRD); }
    R(4,17,3,1,BAND);
    for(let i=0;i<5;i++){ R(17,12+i,3,1,i%2?HRD:HR); }
  }
  hat();
  if(dir===0) nvFaceFront(g,dy,blink,open); else nvFaceProfile(g,dy,blink,open);
}

function martaTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const L=(x0,y0,x1,y1,c)=>paLine(g,x0,y0+dy,x1,y1+dy,c);
  const MR=(x,y,w,h,c)=>paR(g,24-x-w,y+dy,w,h,c);
  const ML=(x0,y0,x1,y1,c)=>paLine(g,23-x0,y0+dy,23-x1,y1+dy,c);
  const PX=(x,y,c)=>paPX(g,x,y+dy,c);
  const P=martaPal,SH=P.shirt,SHD=P.shirtD,DN=P.pants,DND=P.pantsD,SK=P.skin;
  const BRASS='#d9a441',HANDLE='#8a5a34',BLADE='#9aa0a8';
  const mir=dir===2;
  const rR=(x,y,w,h,c)=>{ if(mir)MR(x,y,w,h,c); else R(x,y,w,h,c); };
  const rL=(x0,y0,x1,y1,c)=>{ if(mir)ML(x0,y0,x1,y1,c); else L(x0,y0,x1,y1,c); };
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  if(dir===1){ R(8,19,9,7,DN); R(14,19,3,7,DND); R(9,18,2,2,DN); R(14,18,2,2,DN); }
  else{
    R(9,19,7,7,DN); R(14,19,2,7,DND);
    R(9,18,2,2,DN); R(14,18,2,2,DN);
    R(9,19,2,1,BRASS); R(14,19,2,1,BRASS);
    R(11,22,3,3,DND); PX(12,23,BRASS);
  }
  const hoe=(pose,hy)=>{
    if(pose==='high'){ rL(17,hy,22,hy-7,HANDLE); rR(20,hy-9,4,2,BLADE); }
    else if(pose==='mid'){ rL(17,hy,22,hy-4,HANDLE); rR(21,hy-6,3,3,BLADE); }
    else if(pose==='down'){ rL(17,hy+1,20,hy+6,HANDLE); rR(18,hy+6,5,2,BLADE); }
    else { rL(17,hy-2,17,hy+6,HANDLE); rR(15,hy+6,6,2,BLADE); }
  };
  const tArm=(ay,up)=>{ if(up){ R(HX-1,13,4,7,SH); R(HX,13,2,2,SK); } else { R(HX-1,ay,4,7,SH); R(HX,ay+5,2,2,SK); } };
  const oArm=(ay,up)=>{ if(up){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else { R(OX,ay,4,7,OSH); R(OX,ay+5,2,2,SK); } };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO,false); tArm(18+oT,false); hoe('idle',23+oT);
  }else if(act==='talk'){
    if(fr===1) oArm(0,true); else oArm(18,false);
    tArm(18,false); hoe('idle',23);
  }else if(act==='work'){
    oArm(18,false);
    if(fr===0){ tArm(0,true); hoe('high',13); }
    else if(fr===1){ R(HX-1,16,4,7,SH); R(HX,20,2,2,SK); hoe('mid',20); }
    else { tArm(18,false); hoe('down',23); }
  }else{ oArm(18,false); tArm(18,false); hoe('idle',23); }
}

/* ================= BRAM (Blacksmith, tool: hammer) ================= */
const bramPal={skin:'#eab088',skinD:'#cf8f66',hair:'#23201c',hairD:'#171412',shirt:'#4c4c55',shirtD:'#37373e',pants:'#3a3a42',pantsD:'#2b2b31',boots:'#4a3524',bootsD:'#33241a',apron:'#5a3a22',apronD:'#3f2817'};

function bramHead(g,dir,dy,blink,open){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=bramPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD;
  if(dir===1){ R(4,6,17,13,HR); R(4,6,17,1,HRD); return; }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(5,6,15,3,HR); R(4,8,2,4,HR); R(19,8,2,4,HR);
    nvFaceFront(g,dy,blink,open);
    R(6,13,13,6,HR); R(6,16,13,3,HRD); R(16,13,3,6,HRD);
  }else{
    R(12,6,9,7,HR); R(4,6,3,3,HR);
    nvFaceProfile(g,dy,blink,open);
    R(5,13,9,6,HR); R(5,16,9,3,HRD);
  }
}

function bramTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const L=(x0,y0,x1,y1,c)=>paLine(g,x0,y0+dy,x1,y1+dy,c);
  const MR=(x,y,w,h,c)=>paR(g,24-x-w,y+dy,w,h,c);
  const ML=(x0,y0,x1,y1,c)=>paLine(g,23-x0,y0+dy,23-x1,y1+dy,c);
  const PX=(x,y,c)=>paPX(g,x,y+dy,c);
  const P=bramPal,SH=P.shirt,SHD=P.shirtD,AP=P.apron,APD=P.apronD,SK=P.skin;
  const BRASS='#d9a441',HANDLE='#7a5230',STEEL='#8a8f98',LIGHT='#c9ced6';
  const mir=dir===2;
  const rR=(x,y,w,h,c)=>{ if(mir)MR(x,y,w,h,c); else R(x,y,w,h,c); };
  const rL=(x0,y0,x1,y1,c)=>{ if(mir)ML(x0,y0,x1,y1,c); else L(x0,y0,x1,y1,c); };
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  if(dir===1){ R(8,19,9,7,AP); R(14,19,3,7,APD); R(10,18,2,2,AP); R(13,18,2,2,AP); }
  else{
    R(9,19,7,7,AP); R(14,19,2,7,APD);
    R(9,18,2,2,AP); R(14,18,2,2,AP);
    R(10,18,1,2,APD); R(15,18,1,2,APD);
    PX(10,21,BRASS); PX(15,21,BRASS); PX(10,24,BRASS); PX(15,24,BRASS);
  }
  const hammer=(pose,hy)=>{
    if(pose==='high'){ rL(17,hy,21,hy-7,HANDLE); rR(19,hy-10,5,3,STEEL); rR(19,hy-10,5,1,LIGHT); }
    else if(pose==='mid'){ rL(17,hy,22,hy-4,HANDLE); rR(20,hy-7,4,3,STEEL); rR(20,hy-7,4,1,LIGHT); }
    else if(pose==='down'){ rL(17,hy,19,hy+6,HANDLE); rR(17,hy+5,5,3,STEEL); rR(17,hy+7,5,1,LIGHT); }
    else { rL(17,hy-3,17,hy+5,HANDLE); rR(15,hy-5,6,3,STEEL); rR(15,hy-5,6,1,LIGHT); }
  };
  const tArm=(ay,up)=>{ if(up){ R(HX-1,13,4,7,SH); R(HX,13,2,2,SK); } else { R(HX-1,ay,4,7,SH); R(HX,ay+5,2,2,SK); } };
  const oArm=(ay,up)=>{ if(up){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else { R(OX,ay,4,7,OSH); R(OX,ay+5,2,2,SK); } };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO,false); tArm(18+oT,false); hammer('idle',23+oT);
  }else if(act==='talk'){
    if(fr===1) oArm(0,true); else oArm(18,false);
    tArm(18,false); hammer('idle',23);
  }else if(act==='work'){
    oArm(18,false);
    if(fr===0){ tArm(0,true); hammer('high',13); }
    else if(fr===1){ R(HX-1,16,4,7,SH); R(HX,20,2,2,SK); hammer('mid',20); }
    else { tArm(18,false); hammer('down',23); }
  }else{ oArm(18,false); tArm(18,false); hammer('idle',23); }
}

/* ================= SELLA (Shopkeeper, tool: basket) ================= */
const sellaPal={skin:'#f6d3a8',skinD:'#e0a878',hair:'#a34a28',hairD:'#7c3519',shirt:'#3f8a7a',shirtD:'#2e6559',pants:'#5c3a52',pantsD:'#422a3c',boots:'#5a4028',bootsD:'#402c1c',apron:'#efe6d0',apronD:'#d3c6a8'};

function sellaHead(g,dir,dy,blink,open){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const E=(cx,cy,rx,ry,c)=>paEllipse(g,cx,cy+dy,rx,ry,c);
  const P=sellaPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD;
  if(dir===1){ R(4,6,17,13,HR); R(4,14,17,4,HRD); E(12,6,3,2,HR); E(13,7,2,1,HRD); return; }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(5,7,15,2,HR);
    R(4,8,2,5,HR); R(18,8,2,5,HR);
    R(4,8,1,5,HRD); R(19,8,1,5,HRD);
  }else{
    R(11,6,10,13,HR); R(18,7,2,12,HRD);
    R(5,7,7,2,HR);
  }
  E(12,6,3,2,HR); E(13,6,2,1,HRD);
  if(dir===0) nvFaceFront(g,dy,blink,open); else nvFaceProfile(g,dy,blink,open);
}

function sellaTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const MR=(x,y,w,h,c)=>paR(g,24-x-w,y+dy,w,h,c);
  const P=sellaPal,BL=P.shirt,BLD=P.shirtD,AP=P.apron,APD=P.apronD,SK=P.skin;
  const WHITE='#f4f0e8',TAN='#c89a5a',WEAVE='#a3763f';
  const mir=dir===2;
  const rR=(x,y,w,h,c)=>{ if(mir)MR(x,y,w,h,c); else R(x,y,w,h,c); };
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?BLD:BL;
  R(8,18,9,8,BL); R(15,18,2,8,BLD);
  R(10,18,5,1,WHITE); R(11,19,3,1,WHITE);
  if(dir===1){ R(8,20,9,6,AP); R(14,20,3,6,APD); }
  else{ R(9,20,7,6,AP); R(14,20,2,6,APD); R(11,22,3,3,APD); }
  const basket=(bx,by)=>{
    rR(bx,by,6,5,TAN); rR(bx,by,6,1,WEAVE); rR(bx,by+2,6,1,WEAVE);
    rR(bx+2,by,1,5,WEAVE); rR(bx+4,by,1,5,WEAVE);
  };
  const bask=(pose,hy)=>{
    if(pose==='high') basket(15,hy-6);
    else if(pose==='mid') basket(15,hy-5);
    else basket(18,hy);
  };
  const tArm=(ay,up)=>{ if(up){ R(HX-1,13,4,7,BL); R(HX,13,2,2,SK); } else { R(HX-1,ay,4,7,BL); R(HX,ay+5,2,2,SK); } };
  const oArm=(ay,up)=>{ if(up){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else { R(OX,ay,4,7,OSH); R(OX,ay+5,2,2,SK); } };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO,false); tArm(18+oT,false); bask('idle',23+oT);
  }else if(act==='talk'){
    if(fr===1) oArm(0,true); else oArm(18,false);
    tArm(18,false); bask('idle',23);
  }else if(act==='work'){
    oArm(18,false);
    if(fr===0){ tArm(0,true); bask('high',13); }
    else if(fr===1){ R(HX-1,16,4,7,BL); R(HX,20,2,2,SK); bask('mid',20); }
    else { tArm(18,false); bask('idle',23); }
  }else{ oArm(18,false); tArm(18,false); bask('idle',23); }
}

/* ============ TOBIN — Innkeeper (tool: mug) ============ */
const tobinPal={skin:'#f2c294',skinD:'#d69c66',hair:'#6b4423',hairD:'#4e3018',shirt:'#c8963c',shirtD:'#a3772c',pants:'#6b4a26',pantsD:'#4e3319',boots:'#4a3524',bootsD:'#33241a',apron:null,apronD:null};

function tobinHead(g,dir,dy,blink,open){
  const P=tobinPal;
  if(dir===1){
    paEllipse(g,12,12,8,6,P.skin);
    paR(g,4,12,16,6,P.hair);
    paR(g,4,16,16,2,P.hairD);
    return;
  }
  if(dir===2){
    paEllipse(g,11,12,7,6,P.skin);
    paR(g,15,10,3,7,P.hair);
    paR(g,16,10,1,7,P.hairD);
    nvFaceProfile(g,dy,blink,open);
    paR(g,4,13,8,6,P.hair);
    paR(g,4,17,8,2,P.hairD);
    return;
  }
  paEllipse(g,12,12,8,6,P.skin);
  paR(g,4,10,3,7,P.hair);
  paR(g,18,10,3,7,P.hair);
  paR(g,4,10,1,7,P.hairD);
  paR(g,20,10,1,7,P.hairD);
  nvFaceFront(g,dy,blink,open);
  paR(g,6,13,13,6,P.hair);
  paR(g,6,17,13,2,P.hairD);
  paPX(g,9,15,P.hairD); paPX(g,14,16,P.hairD);
}

function tobinTorso(g,dir,act,fr,dy){
  const P=tobinPal;
  const BELT='#4a3524', BUCK='#e8c35a', MUG='#c89058', MUGD='#a3763f', FOAM='#f7f5f1';
  function mug(x,y){
    paR(g,x,y,4,1,FOAM);
    paR(g,x,y+1,4,5,MUG);
    paR(g,x+3,y+1,1,5,MUGD);
  }
  paR(g,8,18,9,8,P.shirt);
  paR(g,15,18,2,8,P.shirtD);
  paR(g,8,25,9,1,P.shirtD);
  paR(g,8,22,9,2,BELT);
  if(dir===2){ paR(g,8,22,2,2,BUCK); } else { paR(g,11,22,2,2,BUCK); }

  if(act==='walk'){
    const sw=nvSwing(fr);
    if(dir===2){
      paR(g,6,18+sw,4,6,P.shirt); paR(g,6,23+sw,2,2,P.skin); mug(4,19+sw);
    }else{
      paR(g,5,18+sw,4,6,P.shirt); paR(g,6,23+sw,2,2,P.skin);
      paR(g,16,18-sw,4,5,P.shirt); paR(g,16,23-sw,2,2,P.skin); mug(17,19-sw);
    }
    return;
  }
  if(act==='talk'&&fr===1){
    if(dir===2){
      paR(g,6,14,4,6,P.shirt); paR(g,6,12,2,2,P.skin); mug(4,11);
    }else{
      paR(g,5,14,4,6,P.shirt); paR(g,5,12,2,2,P.skin);
      paR(g,16,18,4,5,P.shirt); paR(g,16,23,2,2,P.skin); mug(17,19);
    }
    return;
  }
  if(act==='work'){
    if(dir===2){
      if(fr===0){ paR(g,6,13,4,6,P.shirt); paR(g,6,11,2,2,P.skin); mug(4,10); }
      else if(fr===1){ paR(g,6,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin); mug(4,19); }
      else{ paR(g,6,19,4,6,P.shirt); paR(g,6,24,2,2,P.skin); mug(4,20); }
    }else{
      paR(g,5,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin);
      if(fr===0){ paR(g,16,13,4,6,P.shirt); paR(g,16,11,2,2,P.skin); mug(16,10); }
      else if(fr===1){ paR(g,16,18,4,5,P.shirt); paR(g,16,23,2,2,P.skin); mug(17,19); }
      else{ paR(g,16,19,4,6,P.shirt); paR(g,16,24,2,2,P.skin); mug(17,20); }
    }
    return;
  }
  if(dir===2){
    paR(g,6,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin); mug(4,19);
  }else{
    paR(g,5,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin);
    paR(g,16,18,4,5,P.shirt); paR(g,16,23,2,2,P.skin); mug(17,19);
  }
}

/* ============ WREN — Herbalist (tool: broom) ============ */
const wrenPal={skin:'#f2c89e',skinD:'#d6a06c',hair:'#4a2e1a',hairD:'#3a2413',shirt:'#6d7f5c',shirtD:'#54634a',pants:'#414d3c',pantsD:'#2f382b',boots:'#4a3524',bootsD:'#33241a',apron:null,apronD:null};

function wrenHead(g,dir,dy,blink,open){
  const P=wrenPal, HOOD='#3f5a3a', HOODD='#2e422b';
  if(dir===1){
    paEllipse(g,12,11,9,7,HOOD);
    paR(g,18,5,3,12,HOODD);
    paR(g,11,2,3,3,HOOD);
    paR(g,4,14,16,6,P.hair);
    paR(g,4,18,16,2,P.hairD);
    paR(g,6,14,2,6,P.hairD); paR(g,16,14,2,6,P.hairD);
    return;
  }
  if(dir===2){
    paEllipse(g,11,11,9,7,HOOD);
    paR(g,17,5,3,12,HOODD);
    paR(g,10,2,3,3,HOOD);
    paEllipse(g,9,13,4,4.5,P.skin);
    nvFaceProfile(g,dy,blink,open);
    paR(g,16,13,3,8,P.hair);
    paR(g,18,13,1,8,P.hairD);
    return;
  }
  paEllipse(g,12,11,9,7,HOOD);
  paR(g,18,5,3,12,HOODD);
  paR(g,11,2,3,3,HOOD);
  paEllipse(g,12,13,5,4.5,P.skin);
  nvFaceFront(g,dy,blink,open);
  paR(g,5,14,3,7,P.hair);
  paR(g,16,14,3,7,P.hair);
  paR(g,6,14,1,7,P.hairD); paR(g,17,14,1,7,P.hairD);
}

function wrenTorso(g,dir,act,fr,dy){
  const P=wrenPal;
  const HANDLE='#8a5a34', STRAW='#d8b45a', BIND='#a3763f', STRAWD='#c49a48', CLASP='#8aa86a';
  function bristles(x,y){
    paR(g,x,y,6,1,BIND);
    paR(g,x,y+1,6,3,STRAW);
    paR(g,x+4,y+1,2,3,STRAWD);
  }
  paR(g,8,18,9,8,P.shirt);
  paR(g,15,18,2,8,P.shirtD);
  paR(g,8,25,9,1,P.shirtD);
  if(dir===2){ paR(g,8,18,2,2,CLASP); }
  else if(dir!==1){ paR(g,11,18,2,2,CLASP); }

  if(act==='walk'){
    const sw=nvSwing(fr);
    if(dir===2){
      paR(g,6,18+sw,4,3,P.shirt); paR(g,6,20+sw,2,2,P.skin);
      paLine(g,7,11+sw,7,21+sw,HANDLE); bristles(4,21+sw);
    }else{
      paR(g,5,18+sw,4,6,P.shirt); paR(g,6,23+sw,2,2,P.skin);
      paR(g,16,18-sw,4,3,P.shirt); paR(g,17,20-sw,2,2,P.skin);
      paLine(g,18,11-sw,18,21-sw,HANDLE); bristles(15,21-sw);
    }
    return;
  }
  if(act==='talk'&&fr===1){
    if(dir===2){
      paR(g,6,14,4,5,P.shirt); paR(g,6,12,2,2,P.skin);
      paLine(g,7,12,3,5,HANDLE); bristles(0,2);
    }else{
      paR(g,5,14,4,6,P.shirt); paR(g,5,12,2,2,P.skin);
      paR(g,16,18,4,3,P.shirt); paR(g,17,20,2,2,P.skin);
      paLine(g,18,11,18,21,HANDLE); bristles(15,21);
    }
    return;
  }
  if(act==='work'){
    if(dir===2){
      if(fr===0){ paR(g,6,14,4,5,P.shirt); paR(g,6,12,2,2,P.skin);
        paLine(g,6,12,1,6,HANDLE); bristles(0,3); }
      else if(fr===1){ paR(g,6,17,4,4,P.shirt); paR(g,6,17,2,2,P.skin);
        paLine(g,6,17,0,14,HANDLE); bristles(0,12); }
      else{ paR(g,6,18,4,4,P.shirt); paR(g,6,20,2,2,P.skin);
        paLine(g,6,20,2,23,HANDLE); bristles(0,22); }
    }else{
      paR(g,5,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin);
      if(fr===0){ paR(g,16,14,4,5,P.shirt); paR(g,17,12,2,2,P.skin);
        paLine(g,18,12,22,6,HANDLE); bristles(18,3); }
      else if(fr===1){ paR(g,16,17,4,4,P.shirt); paR(g,17,17,2,2,P.skin);
        paLine(g,18,17,23,14,HANDLE); bristles(18,12); }
      else{ paR(g,16,18,4,4,P.shirt); paR(g,17,20,2,2,P.skin);
        paLine(g,18,20,21,23,HANDLE); bristles(17,22); }
    }
    return;
  }
  if(dir===2){
    paR(g,6,18,4,3,P.shirt); paR(g,6,20,2,2,P.skin);
    paLine(g,7,11,7,21,HANDLE); bristles(4,21);
  }else{
    paR(g,5,18,4,6,P.shirt); paR(g,6,23,2,2,P.skin);
    paR(g,16,18,4,3,P.shirt); paR(g,17,20,2,2,P.skin);
    paLine(g,18,11,18,21,HANDLE); bristles(15,21);
  }
}

/* ============ FINN — Fisherman (tool: rod) ============ */
const finnPal={skin:'#f0b880',skinD:'#d6945e',hair:'#5e4028',hairD:'#46301c',shirt:'#2f4a6e',shirtD:'#22344f',pants:'#3a3a44',pantsD:'#2a2a32',boots:'#33333d',bootsD:'#222228',apron:null,apronD:null};

function finnHead(g,dir,dy,blink,open){
  const P=finnPal, CAP='#3f6fb5', CAPD='#2e5288';
  if(dir===1){
    paEllipse(g,12,12,8,6,P.skin);
    paR(g,4,10,16,7,P.hair);
    paEllipse(g,12,4,7,3,CAP);
    paR(g,5,6,14,1,CAPD);
    return;
  }
  if(dir===2){
    paEllipse(g,11,12,7,6,P.skin);
    paR(g,15,10,2,5,P.hair);
    paEllipse(g,11,4,6,3,CAP);
    paR(g,16,3,3,4,CAPD);
    paR(g,3,6,13,2,CAP);
    paR(g,3,7,13,1,CAPD);
    nvFaceProfile(g,dy,blink,open);
    return;
  }
  paEllipse(g,12,12,8,6,P.skin);
  paR(g,4,10,2,5,P.hair); paR(g,18,10,2,5,P.hair);
  paEllipse(g,12,4,7,3,CAP);
  paR(g,17,2,3,4,CAPD);
  paR(g,5,6,14,2,CAP);
  paR(g,5,7,14,1,CAPD);
  nvFaceFront(g,dy,blink,open);
}

function finnTorso(g,dir,act,fr,dy){
  const P=finnPal;
  const ROD='#7a5230', REEL='#5e3d22', FLINE='#cfd4d8', BUCK='#e8c35a';
  function rod(x0,y0,x1,y1){
    paLine(g,x0,y0,x1,y1,ROD);
    paR(g,x0-1,y0,2,2,REEL);
  }
  function armL(sy){
    paR(g,5,sy,4,3,P.shirt); paR(g,5,sy+3,4,1,P.shirtD);
    paR(g,5,sy+4,4,2,P.skin); paR(g,6,sy+5,2,2,P.skin);
  }
  function armR(sy){
    paR(g,16,sy,4,3,P.shirt); paR(g,16,sy+3,4,1,P.shirtD);
    paR(g,16,sy+4,4,2,P.skin); paR(g,16,sy+5,2,2,P.skin);
  }
  function armF(sy){
    paR(g,6,sy,4,3,P.shirt); paR(g,6,sy+3,4,1,P.shirtD);
    paR(g,6,sy+4,4,2,P.skin); paR(g,6,sy+5,2,2,P.skin);
  }
  paR(g,8,18,9,8,P.shirt);
  paR(g,15,18,2,8,P.shirtD);
  paR(g,8,25,9,1,P.shirtD);
  if(dir===2){ paPX(g,9,19,BUCK); paPX(g,9,21,BUCK); paPX(g,9,23,BUCK); }
  else if(dir!==1){
    paPX(g,11,19,BUCK); paPX(g,13,19,BUCK);
    paPX(g,11,21,BUCK); paPX(g,13,21,BUCK);
    paPX(g,11,23,BUCK); paPX(g,13,23,BUCK);
  }

  if(act==='walk'){
    const sw=nvSwing(fr);
    if(dir===2){
      armF(18+sw);
      paLine(g,7,22+sw,1,12+sw,ROD); paR(g,6,20+sw,2,2,REEL);
      paLine(g,1,12+sw,1,18+sw,FLINE);
    }else{
      armL(18+sw); armR(18-sw);
      rod(17,22-sw,23,11-sw);
      paLine(g,23,11-sw,23,17-sw,FLINE);
    }
    return;
  }
  if(act==='talk'&&fr===1){
    if(dir===2){
      armF(14);
      paLine(g,7,19,1,10,ROD); paR(g,6,17,2,2,REEL);
      paLine(g,1,10,1,16,FLINE);
    }else{
      paR(g,5,14,4,4,P.shirt); paR(g,5,17,4,1,P.shirtD);
      paR(g,5,12,4,3,P.skin); paR(g,5,10,2,2,P.skin);
      armR(18); rod(17,22,23,11);
      paLine(g,23,11,23,17,FLINE);
    }
    return;
  }
  if(act==='work'){
    if(dir===2){
      if(fr===0){
        paR(g,6,13,4,3,P.shirt); paR(g,6,16,4,1,P.shirtD);
        paR(g,6,11,4,2,P.skin); paR(g,6,9,2,2,P.skin);
        paLine(g,7,9,14,3,ROD); paR(g,8,7,2,2,REEL);
        paLine(g,14,3,14,9,FLINE);
      }else if(fr===1){
        armF(18);
        paLine(g,7,22,0,13,ROD); paR(g,6,20,2,2,REEL);
        paLine(g,0,13,0,19,FLINE);
      }else{
        armF(19);
        paLine(g,7,23,0,25,ROD); paR(g,6,21,2,2,REEL);
      }
    }else{
      armL(18);
      if(fr===0){
        paR(g,16,13,4,3,P.shirt); paR(g,16,16,4,1,P.shirtD);
        paR(g,16,11,4,2,P.skin); paR(g,16,9,2,2,P.skin);
        rod(17,9,23,3);
        paLine(g,23,3,23,9,FLINE);
      }else if(fr===1){
        armR(18); rod(17,22,23,13);
        paLine(g,23,13,23,19,FLINE);
      }else{
        armR(19); rod(17,24,23,25);
      }
    }
    return;
  }
  if(dir===2){
    armF(18);
    paLine(g,7,22,1,12,ROD); paR(g,6,20,2,2,REEL);
    paLine(g,1,12,1,18,FLINE);
  }else{
    armL(18); armR(18);
    rod(17,22,23,11);
    paLine(g,23,11,23,17,FLINE);
  }
}

// ================= ALDEN (Mayor, tool: scroll) =================
const aldenPal = {
  skin:'#f2c9a2', skinD:'#d9a878',
  hair:'#b8b4ac', hairD:'#8f8b83',
  shirt:'#6b3a4a', shirtD:'#4e2a36',
  pants:'#2e2a33', pantsD:'#201d24',
  boots:'#3a2a1a', bootsD:'#241a10',
  apron:null, apronD:null
};
const A = aldenPal;
const A_HAT = '#3a3a40', A_HATD = '#2b2b30';
const A_CREAM = '#efe0b8', A_RED = '#a32e2e', A_GOLD = '#e8c35a';

function aldenHead(g, dir, dy, blink, open){
  paR(g, 8, 2, 9, 4, A_HAT);
  paR(g, 8, 4, 9, 2, A_HATD);
  paR(g, 6, 5, 13, 2, A_HATD);
  if (dir === 1){
    paR(g, 5, 7, 15, 10, A.hair);
    paR(g, 5, 15, 15, 2, A.hairD);
    return;
  }
  paR(g, 5, 7, 15, 11, A.skin);
  paR(g, 4, 9, 1, 5, A.hair);
  paR(g, 20, 9, 1, 5, A.hair);
  if (dir === 0){
    nvFaceFront(g, dy, blink, open);
    paR(g, 8, 14, 4, 2, A.hair);
    paR(g, 13, 14, 4, 2, A.hair);
  } else {
    nvFaceProfile(g, dy, blink, open);
    paR(g, 5, 14, 4, 2, A.hair);
  }
}

function aldenScroll(g, x, y, open){
  if (open){
    paR(g, x, y, 9, 4, A_CREAM);
    paR(g, x, y, 9, 1, A_RED);
    paR(g, x, y+3, 9, 1, A_RED);
  } else {
    paR(g, x, y, 5, 3, A_CREAM);
    paR(g, x+2, y, 1, 3, A_RED);
  }
}

function aldenTorso(g, dir, act, fr, dy){
  paR(g, 8, 18, 9, 8, A.shirt);
  paR(g, 8, 18, 2, 8, A.shirtD);
  paR(g, 15, 18, 2, 8, A.shirtD);
  if (dir === 0){
    paPX(g, 12, 19, A_GOLD);
    paPX(g, 12, 21, A_GOLD);
    paPX(g, 12, 23, A_GOLD);
  } else if (dir === 1){
    paR(g, 9, 25, 3, 4, A.shirt);
    paR(g, 13, 25, 3, 4, A.shirt);
    paR(g, 12, 25, 1, 4, A.shirtD);
  }
  var sw = (act === 'walk') ? nvSwing(fr) : 0;
  if (act === 'talk' && fr === 1){
    paR(g, 5, 13, 4, 6, A.shirt);
    paR(g, 6, 11, 2, 2, A.skin);
  } else {
    paR(g, 5, 18 - sw, 4, 7, A.shirt);
    paR(g, 6, 23 - sw, 2, 2, A.skin);
  }
  if (act === 'work' && fr === 0){
    paR(g, 16, 12, 4, 8, A.shirt);
    paR(g, 17, 10, 2, 2, A.skin);
    aldenScroll(g, 15, 5, true);
  } else if (act === 'work' && fr === 2){
    paR(g, 16, 18, 4, 7, A.shirt);
    paR(g, 16, 24, 2, 2, A.skin);
    aldenScroll(g, 15, 22, false);
  } else {
    paR(g, 16, 18 + sw, 4, 7, A.shirt);
    paR(g, 16, 23 + sw, 2, 2, A.skin);
    aldenScroll(g, 15, 21 + sw, false);
  }
}

// ================= PIP (Kid, tool: ball) =================
const pipPal = {
  skin:'#f5cfa0', skinD:'#e0a878',
  hair:'#e8c35a', hairD:'#c79a3f',
  shirt:'#e86a8a', shirtD:'#c04e6c',
  pants:'#3b6ea5', pantsD:'#2c4f7d',
  boots:'#6b4a26', bootsD:'#4e3519',
  apron:null, apronD:null
};
const P = pipPal;
const P_W = '#f7f5f1', P_R = '#d33a2e';

function pipBall(g, cx, cy){
  paEllipse(g, cx, cy, 2, 2, P_W);
  paPX(g, cx-2, cy-1, P_R); paPX(g, cx-2, cy, P_R); paPX(g, cx-2, cy+1, P_R);
  paPX(g, cx+2, cy-1, P_R); paPX(g, cx+2, cy, P_R); paPX(g, cx+2, cy+1, P_R);
}

function pipHead(g, dir, dy, blink, open){
  paR(g, 7, 4, 2, 4, P.hair);
  paR(g, 11, 3, 2, 5, P.hair);
  paR(g, 15, 4, 2, 4, P.hair);
  paR(g, 18, 5, 2, 3, P.hair);
  paR(g, 4, 9, 1, 4, P.hair);
  paR(g, 20, 9, 1, 4, P.hair);
  paR(g, 11, 6, 2, 2, P.hairD);
  if (dir === 1){
    paR(g, 5, 8, 15, 9, P.hair);
    paR(g, 5, 15, 15, 2, P.hairD);
    return;
  }
  paR(g, 5, 7, 15, 11, P.skin);
  paR(g, 5, 8, 15, 2, P.hair);
  paR(g, 5, 9, 15, 1, P.hairD);
  if (dir === 0){
    nvFaceFront(g, dy, blink, open);
  } else {
    nvFaceProfile(g, dy, blink, open);
  }
}

function pipTorso(g, dir, act, fr, dy){
  paR(g, 8, 18, 9, 8, P.shirt);
  paR(g, 8, 18, 2, 8, P.shirtD);
  paR(g, 11, 18, 3, 1, P.shirtD);
  var sw = (act === 'walk') ? nvSwing(fr) : 0;
  if (act === 'idle'){
    paR(g, 5, 19, 4, 6, P.shirt);
    paR(g, 16, 19, 4, 6, P.shirt);
    paR(g, 8, 21, 2, 2, P.skin);
    paR(g, 15, 21, 2, 2, P.skin);
    pipBall(g, 12, 22);
  } else if (act === 'work' && fr === 0){
    paR(g, 5, 15, 4, 4, P.shirt);
    paR(g, 16, 14, 4, 5, P.shirt);
    paR(g, 6, 13, 2, 2, P.skin);
    paR(g, 17, 12, 2, 2, P.skin);
    pipBall(g, 19, 9);
  } else if (act === 'work' && fr === 1){
    paR(g, 5, 18, 4, 7, P.shirt);
    paR(g, 6, 23, 2, 2, P.skin);
    paR(g, 16, 18, 4, 7, P.shirt);
    paR(g, 16, 23, 2, 2, P.skin);
    pipBall(g, 12, 16);
  } else if (act === 'work' && fr === 2){
    paR(g, 5, 19, 4, 6, P.shirt);
    paR(g, 16, 19, 4, 6, P.shirt);
    paR(g, 6, 24, 2, 2, P.skin);
    paR(g, 16, 24, 2, 2, P.skin);
    pipBall(g, 12, 23);
  } else if (act === 'talk' && fr === 1){
    paR(g, 5, 13, 4, 6, P.shirt);
    paR(g, 6, 11, 2, 2, P.skin);
    paR(g, 16, 18, 4, 7, P.shirt);
    paR(g, 16, 23, 2, 2, P.skin);
    pipBall(g, 18, 21);
  } else {
    paR(g, 5, 18 - sw, 4, 7, P.shirt);
    paR(g, 6, 23 - sw, 2, 2, P.skin);
    paR(g, 16, 18 + sw, 4, 7, P.shirt);
    paR(g, 16, 23 + sw, 2, 2, P.skin);
    pipBall(g, 18, 21 + sw);
  }
}

/* ---------------- per-villager design registry ----------------
   Each entry: { pal, head(g,dir,dy,blink,open), torso(g,dir,act,fr,dy) }
   pal keys: skin,skinD,hair,hairD,shirt,shirtD,pants,pantsD,boots,bootsD,
             apron,apronD (null when none), sleepHat(g) optional. */
const DESIGNS = {
  Marta:{pal:martaPal,head:martaHead,torso:martaTorso},
  Bram:{pal:bramPal,head:bramHead,torso:bramTorso},
  Sella:{pal:sellaPal,head:sellaHead,torso:sellaTorso},
  Tobin:{pal:tobinPal,head:tobinHead,torso:tobinTorso},
  Wren:{pal:wrenPal,head:wrenHead,torso:wrenTorso},
  Finn:{pal:finnPal,head:finnHead,torso:finnTorso},
  Alden:{pal:aldenPal,head:aldenHead,torso:aldenTorso},
  Pip:{pal:pipPal,head:pipHead,torso:pipTorso},
};

/* ---------------- frame composer: logical -> 48x64 ---------------- */
function nvFrame(spec,dir,act,fr){
  const D=DESIGNS[spec.name]||DESIGNS.Marta;
  const L=paMk(24,32), g=L.g;
  if(act==='sit') nvSit(g,D.pal,D.head,fr);
  else {
    const dy=(act==='walk'&&(fr===1||fr===3))?1:0;
    const blink=act==='idle'&&fr===1;
    const open=act==='talk'&&fr===1;
    nvLegsBoots(g,dir,act,fr,dy,D.pal);
    D.torso(g,dir,act,fr,dy);
    D.head(g,dir,dy,blink,open);
  }
  paOutline(L.c,N_OUTL);
  const s=paMk(48,64), g2=s.g;
  g2.imageSmoothingEnabled=false;
  if(spec.kid){ g2.translate(24,64); g2.scale(0.85,0.85); g2.translate(-24,-64); }
  g2.drawImage(L.c,0,0,48,64);
  return s.c;
}

/* ---------------- sleep frame (48x64, Zzz) ---------------- */
function nvSleepFrame(spec,fr){
  const D=DESIGNS[spec.name]||DESIGNS.Marta;
  const L=paMk(24,32), g=L.g;
  nvSleepPaint(g,D.pal);
  paOutline(L.c,N_OUTL);
  const s=paMk(48,64), g2=s.g;
  g2.imageSmoothingEnabled=false;
  if(spec.kid){ g2.translate(24,64); g2.scale(0.85,0.85); g2.translate(-24,-64); }
  g2.drawImage(L.c,0,0,48,64);
  g2.fillStyle='#ffffff'; g2.font='bold 9px sans-serif';
  const bob=fr?-2:0;
  g2.fillText('Z',36,10+bob); g2.fillText('z',29,19+bob);
  return s.c;
}

/* ---------------- BUILD ALL + DRAW ---------------- */
function workFor(name){
  return {Marta:'hoe',Bram:'hammer',Sella:'basket',Tobin:'mug',Wren:'broom',
          Finn:'rod',Alden:'scroll',Pip:'ball'}[name]||'idle';
}
function buildChars(){
  PA.chars=[];
  for(let i=0;i<G.villagers.length;i++){
    const v=G.villagers[i];
    const D=DESIGNS[v.name]||DESIGNS.Marta;
    const spec={name:v.name, work:workFor(v.name), kid:v.name==='Pip', pal:D.pal};
    const F={};
    for(const dir of [0,1,2]){
      F[dir]={idle:[],walk:[],talk:[],work:[],sit:[],sleep:[]};
      for(let f=0;f<2;f++) F[dir].idle.push(nvFrame(spec,dir,'idle',f));
      for(let f=0;f<4;f++) F[dir].walk.push(nvFrame(spec,dir,'walk',f));
      for(let f=0;f<2;f++) F[dir].talk.push(nvFrame(spec,dir,'talk',f));
      for(let f=0;f<3;f++) F[dir].work.push(nvFrame(spec,dir,'work',f));
      for(let f=0;f<2;f++) F[dir].sit.push(nvFrame(spec,dir,'sit',f));
      F[dir].sleep.push(nvSleepFrame(spec,0));
      F[dir].sleep.push(nvSleepFrame(spec,1));
    }
    PA.chars.push(F);
    v._ci=i;
  }
  /* chunky talk bubble */
  {
    const L=paMk(8,7), g=L.g;
    cBlob(g,4,3,3,'#ffffff');
    cR(g,1,5,2,2,'#ffffff'); cP(g,2,6,'#ffffff');
    cP(g,2,3,'#2b2b2b'); cP(g,4,3,'#2b2b2b'); cP(g,6,3,'#2b2b2b');
    paOutline(L.c,N_OUTL);
    const s=paMk(16,14), g2=s.g;
    g2.imageSmoothingEnabled=false;
    g2.drawImage(L.c,0,0,16,14);
    PA.fx.bubble=s.c;
  }
}

function paCharDraw(g,v){
  const F=PA.chars[v._ci]; if(!F) return;
  const st=v.state, t=G.frame;
  const px0 = st==='sit'&&v.sitAt ? v.sitAt.x : v.x;
  const py0 = st==='sit'&&v.sitAt ? v.sitAt.y : v.y;
  if(st==='sleep'){
    const fr=F[0].sleep[Math.floor(t/90)%2];
    g.imageSmoothingEnabled=false;
    g.drawImage(fr, Math.round(v.x-fr.width/2), Math.round(v.y-6-fr.height));
    return;
  }
  let dir = st==='sit' ? 0 : (v.face===1?1:((v.face===2||v.face===3)?2:0));
  let arr, fi=0;
  if(st==='walk'){ arr=F[dir].walk; fi=Math.floor(v.walkPhase*6.366)%4; }
  else if(st==='talk'){ arr=F[dir].talk; fi=Math.floor(t/18)%2; }
  else if(st==='work'){ arr=F[dir].work; fi=Math.floor(t/16)%3; }
  else if(st==='sit'){ arr=F[dir].sit; fi=Math.floor(t/120)%2; }
  else { arr=F[dir].idle; fi=(((t+Math.floor(v.seed*10))%210)<14)?1:0; }
  const fr=arr[fi%arr.length];
  const dx=Math.round(px0-fr.width/2), dy=Math.round(py0+2-fr.height);
  g.imageSmoothingEnabled=false;
  if(v.face===3&&st!=='sit'){
    g.save(); g.translate(Math.round(px0)*2,0); g.scale(-1,1);
    g.drawImage(fr, dx, dy, fr.width, fr.height);
    g.restore();
  } else {
    g.drawImage(fr, dx, dy);
  }
  if(st==='talk'){
    const b=PA.fx.bubble, bob=Math.sin(t*0.1)*2;
    g.drawImage(b, Math.round(px0+8), Math.round(py0-72+bob));
  }
}

