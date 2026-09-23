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
/* upscale a logical canvas 2x (24x32 -> 48x64 game frame) */
function cUp(L){
  const s=paMk(L.c.width*2, L.c.height*2), g2=s.g;
  g2.imageSmoothingEnabled=false;
  g2.drawImage(L.c,0,0,s.c.width,s.c.height);
  return s.c;
}
/* auto dark outline around all opaque pixels */
function cAutoOutline(c,col){ paOutline(c, col||N_OUTL); }

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

/* expressive face, front (Direction A specular catchlight + 2-tone blush) */
function nvFaceFront(g,dy,blink,open){
  if(blink){
    paR(g,9,12+dy,1,1,N_EYE); paR(g,14,12+dy,1,1,N_EYE);
  } else {
    paR(g,9,11+dy,1,2,N_EYE); paR(g,14,11+dy,1,2,N_EYE);
    paPX(g,9,11+dy,'#ffffff'); paPX(g,14,11+dy,'#ffffff'); /* Direction A Specular Catchlight */
  }
  paR(g,7,13+dy,1,1,N_BLUSH); paR(g,16,13+dy,1,1,N_BLUSH);
  paPX(g,6,13+dy,'#fde2e4'); paPX(g,17,13+dy,'#fde2e4'); /* soft peach blush halo */
  if(open) paR(g,11,14+dy,2,2,N_MOUTH_O);
  else paR(g,11,14+dy,2,1,N_MOUTH);
}
/* expressive face, profile facing left */
function nvFaceProfile(g,dy,blink,open){
  if(blink){
    paR(g,4,12+dy,1,1,N_EYE);
  } else {
    paR(g,4,11+dy,1,2,N_EYE);
    paPX(g,4,11+dy,'#ffffff'); /* Direction A Specular Catchlight */
  }
  paR(g,3,13+dy,1,1,N_BLUSH);
  paPX(g,2,13+dy,'#fde2e4'); /* soft peach blush halo */
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
  if(act==='walk'||act==='carry'){ if(fr===0)l1=24; else if(fr===2)l2=24; }
  else if(act==='run'){ if(fr===0||fr===1){l1=22;l2=26;} else {l1=26;l2=22;} }
  else if(act==='stalk'){ l1=26; l2=26; }
  else if(act==='panic'){ if(fr===0)l1=24; else l2=24; }
  if(act==='fight'||act==='argue'){
    /* wide combat stance */
    if(dir===2){
      paR(g,7,l1+dy,2,3,pal.pants); paR(g,13,l2+dy,2,3,pal.pants);
      nvBootP(g,4,l1+3+dy,pal.boots,pal.bootsD);
      nvBootP(g,12,l2+3+dy,pal.boots,pal.bootsD);
    } else {
      paR(g,8,l1+dy,2,3,pal.pants); paR(g,15,l2+dy,2,3,pal.pants);
      nvBoot(g,6,l1+3+dy,pal.boots,pal.bootsD);
      nvBoot(g,14,l2+3+dy,pal.boots,pal.bootsD);
    }
    return;
  }
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
  headFn(g,0,2,blink,false,{sit:true});
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

function martaHead(g,dir,dy,blink,open,opt){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=martaPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD;
  const STRAW='#e8c35a',STRAWD='#c9a043',BAND='#a32e2e';
  const showHat = !(opt && (opt.sit || opt.noHat));
  const hat=()=>{ if(showHat){ R(8,1,9,3,STRAW); R(8,3,9,1,BAND); R(15,1,2,2,STRAWD); R(3,4,19,3,STRAW); R(3,6,19,1,STRAWD); } };
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
    paR(g,7,7+dy,4,1,'#a86c44'); /* crown sheen highlight */
    for(let i=0;i<7;i++){ R(4,10+i,3,1,i%2?HR:HRD); R(18,10+i,3,1,i%2?HRD:HR); }
    R(4,17,3,1,BAND); R(18,17,3,1,BAND);
  }else{
    R(11,6,10,13,HR); R(19,7,2,12,HRD);
    R(5,7,8,2,HR);
    paR(g,7,7+dy,3,1,'#a86c44'); /* crown sheen highlight */
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
    R(5,6,15,3,HR); R(7,6,5,1,'#443f38'); /* crown highlight */
    R(4,8,2,4,HR); R(19,8,2,4,HR);
    nvFaceFront(g,dy,blink,open);
    R(6,13,13,6,HR); R(6,16,13,3,HRD); R(16,13,3,6,HRD);
  }else{
    R(12,6,9,7,HR); R(13,6,4,1,'#443f38'); /* crown highlight */
    R(4,6,3,3,HR);
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

/* ================= ROWAN (Traveling Bard, tool: lute) ================= */
const rowanPal={
  skin:'#fcd3b6',skinD:'#e0a98b',
  hair:'#d97706',hairD:'#92400e',hairH:'#f59e0b',
  shirt:'#15803d',shirtD:'#166534',
  pants:'#78350f',pantsD:'#451a03',
  boots:'#3f2817',bootsD:'#2b1b10',
  hat:'#047857',feather:'#f59e0b',
  apron:null,apronD:null
};

function rowanHead(g,dir,dy,blink,open,opt){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=rowanPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD,HRH=P.hairH;
  if(dir===1){
    R(4,6,17,13,HR); R(4,6,17,2,HRD);
    if(!(opt&&opt.sit)){ R(5,2,14,5,P.hat); R(12,0,2,4,P.feather); }
    return;
  }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(5,7,15,3,HR); R(7,7,4,1,HRH);
    R(4,9,3,7,HR); R(18,9,3,7,HR);
    R(4,13,2,3,HRD); R(19,13,2,3,HRD);
    if(!(opt&&opt.sit)){
      R(5,2,14,5,P.hat); R(13,0,2,4,P.feather); R(5,5,14,2,'#065f46');
    }
    nvFaceFront(g,dy,blink,open);
  }else{
    R(11,6,10,13,HR); R(18,7,2,12,HRD);
    R(5,7,7,2,HR); R(7,7,3,1,HRH);
    if(!(opt&&opt.sit)){
      R(5,2,14,5,P.hat); R(11,0,2,4,P.feather); R(5,5,14,2,'#065f46');
    }
    nvFaceProfile(g,dy,blink,open);
  }
}

function rowanTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=rowanPal,SH=P.shirt,SHD=P.shirtD,DN=P.pants,DND=P.pantsD,SK=P.skin;
  const GOLD='#fbbf24',BELT='#451a03';
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  R(8,23,9,2,BELT); R(11,23,3,2,GOLD);
  R(9,25,7,2,DN); R(14,25,2,2,DND);
  const mir=dir===2;
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
  const tArm=(ay)=> { R(HX-1,ay,4,7,SH); R(HX,ay+5,2,2,SK); };
  const oArm=(ay)=> { R(OX,ay,4,7,OSH); R(OX,ay+5,2,2,SK); };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO); tArm(18+oT);
  }else if(act==='talk'){
    if(fr===1){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else oArm(18);
    tArm(18);
  }else{
    oArm(18); tArm(18);
  }
}

/* ================= CLARA (Silk Merchant, tool: basket) ================= */
const claraPal={
  skin:'#eab088',skinD:'#cf8f66',
  hair:'#27272a',hairD:'#18181b',hairH:'#52525b',
  shirt:'#7e22ce',shirtD:'#581c87',
  pants:'#4338ca',pantsD:'#312e81',
  boots:'#713f12',bootsD:'#502c0d',
  turban:'#e0e7ff',turbanD:'#c7d2fe',jewel:'#facc15',
  apron:null,apronD:null
};

function claraHead(g,dir,dy,blink,open,opt){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=claraPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD,HRH=P.hairH;
  if(dir===1){
    R(4,6,17,13,HR); R(4,14,17,4,HRD);
    if(!(opt&&opt.sit)){ R(5,2,15,6,P.turban); R(5,6,15,2,P.turbanD); }
    return;
  }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(5,7,15,3,HR); R(7,7,4,1,HRH);
    R(4,9,3,8,HR); R(18,9,3,8,HR);
    if(!(opt&&opt.sit)){
      R(5,2,15,6,P.turban); R(5,6,15,2,P.turbanD);
      paPX(g,12,4+dy,P.jewel); paPX(g,13,4+dy,P.jewel);
    }
    nvFaceFront(g,dy,blink,open);
  }else{
    R(11,6,10,13,HR); R(18,7,2,12,HRD);
    R(5,7,7,2,HR); R(7,7,3,1,HRH);
    if(!(opt&&opt.sit)){
      R(5,2,15,6,P.turban); R(5,6,15,2,P.turbanD);
      paPX(g,8,4+dy,P.jewel);
    }
    nvFaceProfile(g,dy,blink,open);
  }
}

function claraTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=claraPal,SH=P.shirt,SHD=P.shirtD,DN=P.pants,DND=P.pantsD,SK=P.skin;
  const GOLD='#facc15',SASH='#e0e7ff';
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  R(9,19,2,6,GOLD); R(14,19,2,6,GOLD);
  R(8,23,9,2,SASH);
  R(9,25,7,2,DN); R(14,25,2,2,DND);
  const mir=dir===2;
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
  const tArm=(ay)=> { R(HX-1,ay,4,7,SH); R(HX,ay+5,2,2,SK); };
  const oArm=(ay)=> { R(OX,ay,4,7,OSH); R(OX,ay+5,2,2,SK); };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO); tArm(18+oT);
  }else if(act==='talk'){
    if(fr===1){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else oArm(18);
    tArm(18);
  }else{
    oArm(18); tArm(18);
  }
}

/* ================= GARETH (Wandering Knight, tool: sword) ================= */
const garethPal={
  skin:'#fed7aa',skinD:'#fba96b',
  hair:'#71717a',hairD:'#3f3f46',hairH:'#a1a1aa',
  shirt:'#94a3b8',shirtD:'#64748b',
  pants:'#475569',pantsD:'#334155',
  boots:'#1e293b',bootsD:'#0f172a',
  cape:'#dc2626',capeD:'#991b1b',
  helm:'#cbd5e1',helmD:'#94a3b8',
  apron:null,apronD:null
};

function garethHead(g,dir,dy,blink,open,opt){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=garethPal,SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD,HRH=P.hairH;
  if(dir===1){
    R(4,6,17,13,HR); R(4,6,17,2,HRD);
    if(!(opt&&opt.sit)){ R(5,2,14,6,P.helm); R(5,5,14,3,P.helmD); R(11,0,3,4,P.cape); }
    return;
  }
  R(4,6,17,13,SK); R(19,8,2,10,SKD);
  if(dir===0){
    R(5,7,15,3,HR); R(7,7,4,1,HRH);
    R(4,9,2,5,HR); R(19,9,2,5,HR);
    if(!(opt&&opt.sit)){
      R(5,2,15,6,P.helm); R(5,6,15,2,P.helmD); R(11,0,3,4,P.cape);
    }
    nvFaceFront(g,dy,blink,open);
  }else{
    R(11,6,10,13,HR); R(18,7,2,12,HRD);
    R(5,7,7,2,HR); R(7,7,3,1,HRH);
    if(!(opt&&opt.sit)){
      R(5,2,15,6,P.helm); R(5,6,15,2,P.helmD); R(10,0,3,4,P.cape);
    }
    nvFaceProfile(g,dy,blink,open);
  }
}

function garethTorso(g,dir,act,fr,dy){
  const R=(x,y,w,h,c)=>paR(g,x,y+dy,w,h,c);
  const P=garethPal,SH=P.shirt,SHD=P.shirtD,DN=P.pants,DND=P.pantsD,SK=P.skin;
  const GOLD='#fbbf24',STEEL='#cbd5e1';
  R(6,18,3,9,P.cape); R(16,18,3,9,P.capeD);
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  R(12,19,2,6,GOLD); R(10,21,6,2,GOLD);
  R(9,25,7,2,DN); R(14,25,2,2,DND);
  const mir=dir===2;
  const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
  const tArm=(ay)=> { R(HX-1,ay,4,7,STEEL); R(HX,ay+5,2,2,SK); };
  const oArm=(ay)=> { R(OX,ay,4,7,SHD); R(OX,ay+5,2,2,SK); };
  if(act==='walk'){
    const s=nvSwing(fr),oT=mir?s:-s,oO=mir?-s:s;
    oArm(18+oO); tArm(18+oT);
  }else if(act==='talk'){
    if(fr===1){ R(OX,12,4,7,OSH); R(OX,12,2,2,SK); } else oArm(18);
    tArm(18);
  }else{
    oArm(18); tArm(18);
  }
}

/* =====================================================================
   ANIMATION STATE MACHINE (2026-09-22)
   Every sim-side v.state maps through PA_STATE_ANIM to a named animation
   clip (act). Data-side table so a future low-angle/street-level renderer
   can reuse the same mapping. act names index F[dir][act] frame lists.
   Fields: act = clip name, wp = frame driven by v.walkPhase,
   wpm = walkPhase multiplier, tick = G.frame ticks per frame (0 = hold
   frame 0), desc = human-readable summary for docs/gallery labels.
   ===================================================================== */
const PA_STATE_ANIM = {
  idle:        {act:'idle',  tick:0,  desc:'standing, occasional blink'},
  walk:        {act:'walk',  wp:1, wpm:4, desc:'walk cycle, arm swing'},
  wander:      {act:'walk',  wp:1, wpm:4, desc:'stroll = walk cycle'},
  run:         {act:'run',   wp:1, wpm:6, desc:'run cycle, big stride + bounce'},
  flee:        {act:'run',   wp:1, wpm:6, desc:'fleeing = run cycle'},
  wade:        {act:'walk',  wp:1, wpm:4, desc:'wading = walk + water fx'},
  swim:        {act:'walk',  wp:1, wpm:4, desc:'swim = walk + submerged clip'},
  drown_panic: {act:'panic', tick:6,  desc:'arms flailing overhead, kicking'},
  work:        {act:'work',  tick:16, desc:'work swing (tool/prop arc)'},
  serve:       {act:'serve', tick:18, desc:'behind counter, handing items'},
  chat:        {act:'talk',  tick:18, desc:'talking gesture + open mouth'},
  talk:        {act:'talk',  tick:18, desc:'talking gesture + open mouth'},
  teach:       {act:'talk',  tick:18, desc:'teaching = talking gesture'},
  claim:       {act:'talk',  tick:18, desc:'claiming = talking gesture'},
  greet:       {act:'wave',  tick:16, desc:'raised waving arm'},
  wave:        {act:'wave',  tick:16, desc:'raised waving arm'},
  eat:         {act:'eat',   tick:16, desc:'hand-to-mouth eating cycle'},
  drink:       {act:'drink', tick:20, desc:'head back, cup at mouth'},
  phone:       {act:'phone', tick:40, desc:'head down at phone in both hands'},
  sleep:       {act:'sleep', tick:90, desc:'lying in bed, Zzz'},
  rest:        {act:'sit',   tick:120,desc:'seated rest'},
  sit:         {act:'sit',   tick:120,desc:'seated'},
  bathe:       {act:'bathe', tick:30, desc:'seated in water, splashing'},
  play:        {act:'play',  tick:14, desc:'jumping, arms up'},
  argue:       {act:'argue', tick:14, desc:'leaning jab gestures, anger mark'},
  fight:       {act:'fight', tick:12, desc:'alternating punches + impact'},
  brawl:       {act:'fight', tick:12, desc:'brawl = punches'},
  attack:      {act:'fight', tick:12, desc:'attacking = punches'},
  hunt:        {act:'stalk', tick:30, desc:'crouched stalking'},
  stalk:       {act:'stalk', tick:30, desc:'crouched stalking'},
  sad:         {act:'sad',   tick:40, desc:'slumped, head bowed, tears'},
  cry:         {act:'sad',   tick:40, desc:'crying = slumped + tears'},
  laugh:       {act:'laugh', tick:12, desc:'head back, open laugh, shaking'},
  carry:       {act:'carry', wp:1, wpm:3, desc:'walking, box/bag in arms'},
  downed:      {act:'downed',tick:60, desc:'collapsed on ground, breathing'},
  dead:        {act:'downed',tick:0,  desc:'corpse uses downed base frame'},
};
function paStateAnim(state){ return PA_STATE_ANIM[state] || PA_STATE_ANIM.idle; }
/* pick the frame canvas for a villager's current state */
function paActFrame(F, dir, v, t){
  const A = paStateAnim(v.state);
  const arr = (F[dir] && F[dir][A.act]) || F[dir].idle;
  let fi = 0;
  if(A.wp) fi = Math.floor(v.walkPhase * (A.wpm || 4)) % arr.length;
  else if(A.tick) fi = Math.floor((t || 0) / A.tick) % arr.length;
  return arr[fi % arr.length];
}

/* clips built for every character (in addition to idle/walk/talk/work/sit/sleep) */
const NV_ACTS = [
  ['idle',2],['walk',4],['talk',2],['work',3],['sit',2],
  ['run',4],['wave',2],['eat',3],['drink',2],['phone',2],
  ['argue',2],['fight',2],['sad',2],['laugh',2],['carry',4],
  ['serve',3],['bathe',2],['play',2],['panic',2],['stalk',2],['downed',2],
];
const NV_NEW_ACTS = {};
['run','wave','eat','drink','phone','argue','fight','sad','laugh','carry','serve','play','panic','stalk']
  .forEach(a=>{ NV_NEW_ACTS[a]=true; });

/* ---------- generic arm helpers for pose clips ---------- */
function nvArmDn(g,x,y,shirt,skin){ paR(g,x,y,3,7,shirt); paR(g,x,y+5,3,2,skin); }   /* arm hanging down */
function nvArmUp(g,x,y,shirt,skin){ paR(g,x,y,3,6,shirt); paR(g,x,y-1,3,2,skin); }   /* arm raised */
function nvArmFw(g,x,y,shirt,skin){ paR(g,x,y,6,3,shirt); paR(g,x+6,y,2,3,skin); }   /* arm forward (right) */
function nvArmFwL(g,x,y,shirt,skin){ paR(g,x,y,6,3,shirt); paR(g,x-2,y,2,3,skin); }  /* arm forward (left) */
function nvArmBent(g,x,y,shirt,skin){ paR(g,x,y,4,4,shirt); paR(g,x,y-2,4,3,skin); } /* bent up to face */

/* hand props for the modern pose clips (24x32 logical canvas) */
function nvPropPhone(g,x,y){ paR(g,x,y,4,5,'#1c1c22'); paR(g,x+1,y+1,2,3,'#7dd3fc'); }
function nvPropCup(g,x,y){ paR(g,x,y,4,4,'#f4f0e8'); paR(g,x,y,4,1,'#c27829'); }
function nvPropFood(g,x,y){ paBlob(g,x+1,y+1,2,'#c27829'); paPX(g,x,y,'#f5c369'); }
function nvPropBox(g,x,y){ paR(g,x,y,9,6,'#b07a45'); paR(g,x,y,9,1,'#8a5c30'); paR(g,x+4,y,1,6,'#8a5c30'); }
function nvAngerMark(g,x,y){ paR(g,x,y,1,4,'#ef4444'); paR(g,x+2,y,1,4,'#ef4444'); paR(g,x-1,y+1,4,1,'#ef4444'); paR(g,x-1,y+2,4,1,'#ef4444'); }
function nvStar(g,x,y){ paPX(g,x,y,'#fde047'); paPX(g,x-2,y,'#fde047'); paPX(g,x+2,y,'#fde047'); paPX(g,x,y-2,'#fde047'); paPX(g,x,y+2,'#fde047'); paPX(g,x-1,y-1,'#f97316'); paPX(g,x+1,y+1,'#f97316'); }
function nvTear(g,x,y){ paPX(g,x,y,'#7dd3fc'); paPX(g,x,y+1,'#38bdf8'); }

/* ---------- generic pose torso for the new clips ----------
   Draws a base torso + per-clip arms/props for ANY design via D.pal.
   Optional D.mid(g,dir,dy) paints outfit detail between torso and arms. */
function nvPoseTorso(g,dir,act,fr,dy,D){
  const P=D.pal, SH=P.shirt, SHD=P.shirtD, SK=P.skin;
  const mir=dir===2;
  const R=(x,y,w,h,c)=>{ if(mir) paR(g,24-x-w,y+dy,w,h,c); else paR(g,x,y+dy,w,h,c); };
  const RX=(x)=>mir?24-x-4:x;      /* x of a 4-wide arm on the character's right */
  const OX=(x)=>mir?24-x-4:x;
  /* base torso */
  R(8,18,9,8,SH); R(15,18,2,8,SHD);
  if(P.apron){ R(9,20,7,6,P.apron); R(14,20,2,6,P.apronD); }
  if(D.mid) D.mid(g,dir,dy);
  const hx=mir?6:17, ox=mir?15:5, osh=mir?SHD:SH; /* hx=right arm x, ox=left arm x */
  switch(act){
    case 'run':{
      /* pumping arms, opposite to stride */
      if(fr===0||fr===1){ nvArmBent(g,ox+dy*0,15,osh,SK); nvArmDn(g,hx,19,SH,SK); }
      else { nvArmDn(g,ox,19,osh,SK); nvArmBent(g,hx-1,15,SH,SK); }
      break;
    }
    case 'wave':{
      nvArmDn(g,ox,18,osh,SK);
      const wx = fr? hx-2 : hx;
      paR(g,wx,11+dy,3,7,SH); paR(g,wx-1,9+dy,4,2,SK);   /* waving forearm */
      break;
    }
    case 'eat':{
      nvArmDn(g,ox,18,osh,SK);
      if(fr===0){ nvArmDn(g,hx,18,SH,SK); nvPropFood(g,hx-1,24+dy); }
      else { nvArmBent(g,hx-1,17,SH,SK); nvPropFood(g,hx-1,13+dy); }
      break;
    }
    case 'drink':{
      nvArmDn(g,ox,18,osh,SK);
      nvArmBent(g,hx-1,16,SH,SK); nvPropCup(g,hx-1,12+dy);
      break;
    }
    case 'phone':{
      /* both hands forward at chest, phone between them */
      R(5,19,5,3,osh); R(15,19,5,3,SH);
      R(9,20,2,2,SK); R(14,20,2,2,SK);
      nvPropPhone(g,mir?12:11,18+dy);
      break;
    }
    case 'argue':{
      if(fr===0){ nvArmFw(g,14,16,SH,SK); nvArmDn(g,ox,18,osh,SK); }
      else { nvArmDn(g,hx,18,SH,SK); nvArmDn(g,ox,18,osh,SK); R(10,18,2,2,SK); }
      nvAngerMark(g,mir?3:20,3+dy);
      break;
    }
    case 'fight':{
      if(fr===0){ nvArmFw(g,14,16,SH,SK); nvStar(g,mir?2:21,16+dy); nvArmDn(g,ox,18,osh,SK); }
      else { nvArmDn(g,hx,18,SH,SK); nvArmFwL(g,4,17,osh,SK); nvStar(g,mir?20:2,17+dy); }
      break;
    }
    case 'sad':{
      nvArmDn(g,ox,19,osh,SK); nvArmDn(g,hx,19,SH,SK);
      /* tears under the eyes (front view only) */
      if(dir===0){ nvTear(g,9,16+dy+1); if(fr===1) nvTear(g,15,17+dy); }
      break;
    }
    case 'laugh':{
      paR(g,ox-1,16+dy,4,4,osh); paR(g,ox-1,15+dy,2,2,SK);
      paR(g,hx,16+dy,4,4,SH); paR(g,hx+2,15+dy,2,2,SK);
      if(fr===1){ paPX(g,mir?3:20,10+dy,'#f4f0e8'); paPX(g,mir?2:21,12+dy,'#f4f0e8'); }
      break;
    }
    case 'carry':{
      /* box held in front with both hands */
      nvPropBox(g,8,19+dy);
      R(5,19,4,3,osh); R(5,21,2,2,SK);
      R(16,19,4,3,SH); R(17,21,2,2,SK);
      break;
    }
    case 'serve':{
      nvArmDn(g,ox,18,osh,SK);
      if(fr===0){ nvArmFw(g,14,17,SH,SK); nvPropCup(g,mir?3:19,14+dy); }
      else if(fr===1){ nvArmDn(g,hx,18,SH,SK); }
      else { nvArmFw(g,14,17,SH,SK); nvPropFood(g,mir?3:19,14+dy); }
      /* counter across the front */
      paR(g,3,27,18,4,'#7a5230'); paR(g,3,27,18,1,'#a37b4f');
      break;
    }
    case 'play':{
      nvArmUp(g,ox,13,osh,SK); nvArmUp(g,hx,13,SH,SK);
      break;
    }
    case 'panic':{
      const j1=fr?-1:0, j2=fr?1:0;
      paR(g,ox+j1,11+dy,3,8,osh); paR(g,ox+j1,9+dy,3,2,SK);
      paR(g,hx+j2,11+dy,3,8,SH); paR(g,hx+j2,9+dy,3,2,SK);
      paPX(g,mir?20:3,8+dy,'#f4f0e8'); paPX(g,mir?21:2,10+dy,'#f4f0e8');
      break;
    }
    case 'stalk':{
      /* arms forward and low, sneaking */
      R(5,21,5,3,osh); R(8,22,2,2,SK);
      R(15,21,5,3,SH); R(14,22,2,2,SK);
      break;
    }
    default:{
      nvArmDn(g,ox,18,osh,SK); nvArmDn(g,hx,18,SH,SK);
    }
  }
}

/* collapsed on the ground, shared; breathes faintly on fr===1 */
function nvDownedPaint(g,pal,fr){
  const up=fr===1?-1:0;
  paR(g,3,26,5,4,'#7a6a55');                 /* ground shadow blob */
  paEllipse(g,7,24,4,4,pal.skin);            /* head on the ground */
  paR(g,3,21,8,3,pal.hair);                  /* hair cap */
  paR(g,3,23,2,3,pal.hairD);
  paR(g,5,24,2,1,N_EYE); paR(g,8,25,2,1,N_EYE); /* closed eyes */
  paR(g,11,22+up,9,5,pal.shirt);             /* torso (breathing) */
  paR(g,11,26,9,2,pal.shirtD);
  paR(g,12,20+up,4,3,pal.shirt);             /* arm flopped over chest */
  paR(g,12,20+up,2,2,pal.skin);
  paR(g,20,23,3,5,pal.pants);                /* legs */
  paR(g,21,27,4,2,pal.pants);
  paR(g,20,29,4,2,pal.boots);                /* boot soles */
  paR(g,22,29,2,1,pal.bootsD);
}

/* seated in water (bathe), shared */
function nvBathePaint(g,pal,fr){
  const blink=fr===1;
  paR(g,8,17,8,7,pal.skin);                  /* bare shoulders/chest */
  paR(g,8,17,8,1,pal.skinD);
  paR(g,5,19,3,3,pal.skin); paR(g,16,19,3,3,pal.skin); /* arms on water */
  paEllipse(g,12,25,10,4,'#6fa8dc');         /* water */
  paEllipse(g,12,25,10,2,'#3f7fc4');
  paEllipse(g,8,24,3,1,'#eaf6ff');           /* foam */
  if(fr===1){ paPX(g,18,21,'#eaf6ff'); paPX(g,4,22,'#eaf6ff'); paPX(g,19,23,'#6fa8dc'); }
  /* head */
  paR(g,6,7,12,10,pal.skin);
  paR(g,6,7,12,3,pal.hair);
  paR(g,6,7,2,6,pal.hair); paR(g,16,7,2,6,pal.hair);
  if(blink){ paR(g,8,11,1,1,N_EYE); paR(g,14,11,1,1,N_EYE); }
  else { paR(g,8,10,1,2,N_EYE); paR(g,14,10,1,2,N_EYE); }
  paR(g,6,12,1,1,N_BLUSH); paR(g,17,12,1,1,N_BLUSH);
  paR(g,10,13,3,1,N_MOUTH);
  paR(g,7,6,10,2,'#e8e0d0');                 /* towel wrap */
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
  Rowan:{pal:rowanPal,head:rowanHead,torso:rowanTorso},
  Clara:{pal:claraPal,head:claraHead,torso:claraTorso},
  Gareth:{pal:garethPal,head:garethHead,torso:garethTorso},
};

/* =====================================================================
   MODERN CAST — 28 parameterized characters for the Mission District
   ("Truman Show") scenario. 8 CORE placeholders (C1..C8, names arrive
   with the cast bible) + 20 AMBIENT named roles. Each entry is a full
   parameter set; nvCastHead/nvCastTorso compile them into DESIGNS so the
   same state machine, frame builder and renderer serve everyone.
   hairStyle: buzz|short|bob|long|bun|ponytail|mohawk|afro|curly|bald|hijab
   hat: none|cap|beanie|bandana|hardhat    acc: none|glasses|headphones|
   beard|stache|headband
   outfit: tee|hoodie|apron|dress|overalls|jacket|vest|sweater|scrubs
   prop: tool key drawn in hand (see workFor/buildTools)
   ===================================================================== */
const NV_CAST = [
  /* ---- CORE (placeholder ids; cast bible supplies names/personality) ---- */
  /* CORE — looks per cast-bible-2026-09-22.md (the bible is the authority) */
  {id:'C1', tier:'core', name:'Marisol', role:'café manager — the hub',
   skin:'#c98a5e', skinD:'#a86a44', hair:'#241c14', hairD:'#120e0a',
   hairStyle:'curly', hat:'none', acc:'none',
   shirt:'#a34a3a', shirtD:'#7e352a', pants:'#3a3f4a', pantsD:'#2a2e38',
   boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'jacket', prop:'coffee'},
  {id:'C2', tier:'core', name:'Jules', role:'new barista — the newcomer',
   skin:'#f0c49a', skinD:'#d6a06c', hair:'#171412', hairD:'#0a0908',
   hairStyle:'bob', hat:'none', acc:'glasses', accCol:'#3a3a44',
   shirt:'#4a6a9a', shirtD:'#38527a', pants:'#2b2b33', pantsD:'#1d1d22',
   boots:'#6b5a48', bootsD:'#4e4234', outfit:'jacket', prop:'tote'},
  {id:'C3', tier:'core', name:'Dani', role:'barista & chalkboard artist',
   skin:'#c98a5e', skinD:'#a86a44', hair:'#1c1a18', hairD:'#c96a32',
   hairStyle:'bob', hat:'none', acc:'none',
   shirt:'#d8d2c4', shirtD:'#b0a894', pants:'#23232a', pantsD:'#141418',
   boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'tee', prop:'coffee'},
  {id:'C4', tier:'core', name:'Priya', role:'RN at SF General',
   skin:'#a86a44', skinD:'#8a5230', hair:'#14100c', hairD:'#000000',
   hairStyle:'ponytail', hat:'none', acc:'glasses', accCol:'#5a3020',
   shirt:'#8a2a2a', shirtD:'#6b1f1f', pants:'#5a5a62', pantsD:'#44444c',
   boots:'#e8e2d4', bootsD:'#c9c4b8', outfit:'hoodie', prop:'coffee'},
  {id:'C5', tier:'core', name:'Marcus', role:'bike courier & drummer',
   skin:'#54341f', skinD:'#402818', hair:'#14100c', hairD:'#000000',
   hairStyle:'bun', hat:'cap', hatCol:'#1c1a18', acc:'beard',
   shirt:'#e8782f', shirtD:'#b85c1f', pants:'#2b2b33', pantsD:'#1d1d22',
   boots:'#23232a', bootsD:'#141418', outfit:'jacket', prop:'tote'},
  {id:'C6', tier:'core', name:'Carmen', role:'retired seamstress, 744 Guerrero',
   skin:'#e8b88a', skinD:'#c69868', hair:'#e8e6e0', hairD:'#c0bcb2',
   hairStyle:'bun', hat:'none', acc:'glasses', accCol:'#3a3a44',
   shirt:'#7a5a8c', shirtD:'#5e4470', pants:'#4a4a52', pantsD:'#36363d',
   boots:'#3a2a1a', bootsD:'#241a10', outfit:'dress', prop:'coffee'},
  {id:'C7', tier:'core', name:'Victor', role:'hardware owner & landlord',
   skin:'#eab088', skinD:'#cf8f66', hair:'#8a7a6a', hairD:'#6a5c4e',
   hairStyle:'buzz', hat:'cap', hatCol:'#e8622f', acc:'stache',
   shirt:'#8a7a5c', shirtD:'#6b5e45', pants:'#3b4a5a', pantsD:'#2c3844',
   boots:'#4a3524', bootsD:'#33241a', outfit:'vest', prop:'box'},
  {id:'C8', tier:'core', name:'Tomás', role:'lead cook at El Farolito',
   skin:'#a86a44', skinD:'#8a5230', hair:'#14100c', hairD:'#000000',
   hairStyle:'buzz', hat:'none', acc:'stache',
   shirt:'#f4f1ea', shirtD:'#c9c4b8', pants:'#2b2d33', pantsD:'#1c1e24',
   boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'tee', prop:'coffee'},
  /* ---- AMBIENT: name + one-line role + distinct look ---- */
  {id:'A01', tier:'ambient', name:'Reyes', role:'barista pulling espresso shifts',
   skin:'#c98a5e', skinD:'#a86a44', hair:'#2a1c10', hairD:'#1a1008', hairStyle:'bun',
   hat:'none', acc:'none', shirt:'#3f8a7a', shirtD:'#2e6559', pants:'#2b2b33', pantsD:'#1d1d22',
   boots:'#33241a', bootsD:'#241a10', outfit:'apron', prop:'coffee'},
  {id:'A02', tier:'ambient', name:'Doro', role:'dog-walker with a leash hand',
   skin:'#f0b880', skinD:'#d6945e', hair:'#c94f32', hairD:'#a03a24', hairStyle:'ponytail',
   hat:'none', acc:'none', shirt:'#4a7ec2', shirtD:'#36609a', pants:'#3a3a44', pantsD:'#2a2a32',
   boots:'#6b4a26', bootsD:'#4e3319', outfit:'tee', prop:'leash'},
  {id:'A03', tier:'ambient', name:'Malik', role:'corner-shop keeper',
   skin:'#a86a44', skinD:'#8a5230', hair:'#1c1a18', hairD:'#0e0d0c', hairStyle:'buzz',
   hat:'none', acc:'stache', shirt:'#e8e2d4', shirtD:'#bdb5a4', pants:'#4a4a52', pantsD:'#36363d',
   boots:'#4a3524', bootsD:'#33241a', outfit:'apron', prop:'box'},
  {id:'A04', tier:'ambient', name:'June', role:'student hauling a tote of books',
   skin:'#f5cfa0', skinD:'#dfa878', hair:'#23201c', hairD:'#171412', hairStyle:'bob',
   hat:'none', acc:'glasses', accCol:'#5a3020', shirt:'#d4a94a', shirtD:'#a8823a',
   pants:'#3b6ea5', pantsD:'#2c4f7d', boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'sweater', prop:'tote'},
  {id:'A05', tier:'ambient', name:'Esther', role:'retiree on a stoop, watching the block',
   skin:'#e8b88a', skinD:'#c69868', hair:'#c9c9c6', hairD:'#a0a09c', hairStyle:'bun',
   hat:'none', acc:'glasses', accCol:'#3a3a44', shirt:'#8a5a8c', shirtD:'#6b456d',
   pants:'#4a4a52', pantsD:'#36363d', boots:'#3a2a1a', bootsD:'#241a10', outfit:'sweater', prop:'coffee'},
  {id:'A06', tier:'ambient', name:'Kofe', role:'delivery rider with a hot box',
   skin:'#54341f', skinD:'#402818', hair:'#14100c', hairD:'#000000', hairStyle:'buzz',
   hat:'cap', hatCol:'#d4a017', acc:'none', shirt:'#d4a017', shirtD:'#a87c10',
   pants:'#2b2b33', pantsD:'#1d1d22', boots:'#14100c', bootsD:'#000000', outfit:'jacket', prop:'box'},
  {id:'A07', tier:'ambient', name:'Luz', role:'street vendor at a fruit stand',
   skin:'#c98a5e', skinD:'#a86a44', hair:'#3a2214', hairD:'#281709', hairStyle:'long',
   hat:'bandana', hatCol:'#c94f32', acc:'none', shirt:'#e86a8a', shirtD:'#c04e6c',
   pants:'#3c3a44', pantsD:'#2c2a32', boots:'#5a4028', bootsD:'#402c1c', outfit:'apron', prop:'box'},
  {id:'A08', tier:'ambient', name:'Sam', role:'busker with a guitar on the corner',
   skin:'#eab088', skinD:'#cf8f66', hair:'#6b4423', hairD:'#4e3018', hairStyle:'curly',
   hat:'none', acc:'beard', shirt:'#5a4a8c', shirtD:'#443a6d', pants:'#3a3a44', pantsD:'#2a2a32',
   boots:'#4a3524', bootsD:'#33241a', outfit:'vest', prop:'lute'},
  {id:'A09', tier:'ambient', name:'Asha', role:'nurse in scrubs off a shift',
   skin:'#a86a44', skinD:'#8a5230', hair:'#1c1a18', hairD:'#0e0d0c', hairStyle:'ponytail',
   hat:'none', acc:'none', shirt:'#3a8a9e', shirtD:'#2c6b7b', pants:'#3a8a9e', pantsD:'#2c6b7b',
   boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'scrubs', prop:'phone'},
  {id:'A10', tier:'ambient', name:'Gus', role:'mechanic in oil-stained overalls',
   skin:'#f2c294', skinD:'#d69c66', hair:'#4a4a4a', hairD:'#303030', hairStyle:'bald',
   hat:'none', acc:'stache', shirt:'#4a5a6e', shirtD:'#384556', pants:'#3a4a5e', pantsD:'#2b3847',
   boots:'#33241a', bootsD:'#241a10', outfit:'overalls', prop:'hammer'},
  {id:'A11', tier:'ambient', name:'Vera', role:'librarian shelving returns',
   skin:'#f0c49a', skinD:'#d6a06c', hair:'#8a5a3b', hairD:'#6e452c', hairStyle:'bob',
   hat:'none', acc:'glasses', accCol:'#14100c', shirt:'#6e5a44', shirtD:'#55452f',
   pants:'#5c3a52', pantsD:'#422a3c', boots:'#4a3524', bootsD:'#33241a', outfit:'sweater', prop:'box'},
  {id:'A12', tier:'ambient', name:'Tom', role:'jogger doing laps around the park',
   skin:'#f5cfa0', skinD:'#dfa878', hair:'#d4a94a', hairD:'#a8823a', hairStyle:'short',
   hat:'none', acc:'headband', accCol:'#e8542f', shirt:'#e8542f', shirtD:'#b8401f',
   pants:'#2b2d42', pantsD:'#1f2130', boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'tee', prop:'none'},
  {id:'A13', tier:'ambient', name:'Nadia', role:'tech worker doom-scrolling on the curb',
   skin:'#d6a878', skinD:'#b3855a', hair:'#23201c', hairD:'#171412', hairStyle:'long',
   hat:'none', acc:'headphones', accCol:'#14100c', shirt:'#4a4a52', shirtD:'#36363d',
   pants:'#23232a', pantsD:'#141418', boots:'#14100c', bootsD:'#000000', outfit:'hoodie', prop:'laptop'},
  {id:'A14', tier:'ambient', name:'Bex', role:'tattoo artist on a smoke break',
   skin:'#eab088', skinD:'#cf8f66', hair:'#2a9e8f', hairD:'#1e7a6e', hairStyle:'buzz',
   hat:'none', acc:'none', shirt:'#23232a', shirtD:'#141418', pants:'#4a4a52', pantsD:'#36363d',
   boots:'#14100c', bootsD:'#000000', outfit:'jacket', prop:'coffee'},
  {id:'A15', tier:'ambient', name:'Omar', role:'bike courier with a messenger bag',
   skin:'#8a5a3b', skinD:'#6e452c', hair:'#14100c', hairD:'#000000', hairStyle:'short',
   hat:'beanie', hatCol:'#2f6b4f', acc:'none', shirt:'#2f6b4f', shirtD:'#23523c',
   pants:'#3a3a44', pantsD:'#2a2a32', boots:'#33241a', bootsD:'#241a10', outfit:'hoodie', prop:'tote'},
  {id:'A16', tier:'ambient', name:'Hana', role:'baker carrying warm trays',
   skin:'#f0b880', skinD:'#d6945e', hair:'#5e4028', hairD:'#46301c', hairStyle:'bun',
   hat:'bandana', hatCol:'#e8e2d4', acc:'none', shirt:'#e8e2d4', shirtD:'#bdb5a4',
   pants:'#8a5a3b', pantsD:'#6e452c', boots:'#4a3524', bootsD:'#33241a', outfit:'apron', prop:'rollingpin'},
  {id:'A17', tier:'ambient', name:'Cole', role:'construction worker on a scaffold',
   skin:'#c98a5e', skinD:'#a86a44', hair:'#3a2214', hairD:'#281709', hairStyle:'buzz',
   hat:'hardhat', hatCol:'#e8c35a', acc:'none', shirt:'#e8782f', shirtD:'#b85c1f',
   pants:'#4a4a52', pantsD:'#36363d', boots:'#4e3319', bootsD:'#38250f', outfit:'vest', prop:'hammer'},
  {id:'A18', tier:'ambient', name:'Ida', role:'florist with a basket of bouquets',
   skin:'#f2c294', skinD:'#d69c66', hair:'#b8b4ac', hairD:'#8f8b83', hairStyle:'curly',
   hat:'none', acc:'none', shirt:'#7a9e5a', shirtD:'#5e7d45', pants:'#6b4a26', pantsD:'#4e3319',
   boots:'#4a3524', bootsD:'#33241a', outfit:'dress', prop:'basket'},
  {id:'A19', tier:'ambient', name:'Ray', role:'retired longshoreman feeding pigeons',
   skin:'#e8b88a', skinD:'#c69868', hair:'#8f8b83', hairD:'#6b685f', hairStyle:'bald',
   hat:'none', acc:'beard', shirt:'#5d6b7d', shirtD:'#455061', pants:'#3c3a44', pantsD:'#2c2a32',
   boots:'#33241a', bootsD:'#241a10', outfit:'sweater', prop:'coffee'},
  {id:'A20', tier:'ambient', name:'Zee', role:'teenager glued to a phone',
   skin:'#f5cfa0', skinD:'#dfa878', hair:'#4a2e6e', hairD:'#362152', hairStyle:'bob',
   hat:'cap', hatCol:'#e86a8a', acc:'none', shirt:'#e86a8a', shirtD:'#c04e6c',
   pants:'#3b6ea5', pantsD:'#2c4f7d', boots:'#f4f1ea', bootsD:'#c9c4b8', outfit:'hoodie', prop:'phone'},
];

/* palette object in the same shape every design uses */
function nvCastPal(c){
  return {skin:c.skin, skinD:c.skinD, hair:c.hair, hairD:c.hairD,
    shirt:c.shirt, shirtD:c.shirtD, pants:c.pants, pantsD:c.pantsD,
    boots:c.boots, bootsD:c.bootsD, apron:c.outfit==='apron'?'#efe6d0':null,
    apronD:c.outfit==='apron'?'#d3c6a8':null};
}

/* parameterized head painter for cast members */
function nvCastHead(c){
  const P=nvCastPal(c);
  const SK=P.skin,SKD=P.skinD,HR=P.hair,HRD=P.hairD;
  const hs=c.hairStyle, hat=c.hat, hc=c.hatCol||'#3a3a44';
  return function(g,dir,dy,blink,open,opt){
    const R=(x,y,w,h,col)=>paR(g,x,y+dy,w,h,col);
    const noHat=opt&&(opt.sit||opt.noHat);
    if(dir===1){ /* back */
      switch(hs){
        case 'bald': case 'buzz': R(4,6,17,13,SK); R(4,6,17,4,hs==='buzz'?HR:SKD); break;
        case 'hijab': R(3,4,19,15,c.accCol||'#5a6e8c'); R(3,16,19,3,shade(c.accCol||'#5a6e8c',0.8)); break;
        case 'afro': paEllipse(g,12,7+dy,9,6,HR); R(4,13,17,6,SK); break;
        case 'mohawk': R(4,6,17,13,SK); R(11,2,3,9,HR); R(11,2,3,2,HRD); break;
        case 'ponytail': R(4,6,17,13,HR); R(16,12,5,9,HR); R(16,19,5,2,HRD); break;
        case 'bun': R(4,6,17,13,HR); paEllipse(g,12,4+dy,3,2,HR); paPX(g,12,3+dy,HRD); break;
        case 'long': R(4,6,17,14,HR); R(4,17,17,3,HRD); break;
        case 'bob': R(4,6,17,12,HR); R(4,15,17,3,HRD); break;
        case 'curly': R(4,5,17,13,HR); for(let i=0;i<6;i++) paPX(g,4+i*3,5+dy+(i%2),HRD); break;
        default: R(4,6,17,13,HR); R(4,6,17,2,HRD);
      }
      if(hat==='cap'&&!noHat){ R(5,4,15,4,hc); R(5,7,15,1,shade(hc,0.75)); }
      else if(hat==='beanie'&&!noHat){ R(5,3,15,5,hc); R(5,7,15,1,shade(hc,0.75)); }
      else if(hat==='bandana'&&!noHat){ R(4,5,17,3,hc); R(18,7,3,2,hc); }
      else if(hat==='hardhat'&&!noHat){ paEllipse(g,12,5+dy,9,4,hc); R(3,7,19,2,shade(hc,0.8)); }
      return;
    }
    R(4,6,17,13,SK); R(19,8,2,10,SKD);
    if(dir===0){
      switch(hs){
        case 'bald': R(5,6,15,1,SKD); break;
        case 'buzz': R(5,6,15,3,HR); R(5,6,15,1,HRD); break;
        case 'hijab': R(3,4,19,15,c.accCol||'#5a6e8c'); R(4,6,17,13,SK); R(19,8,2,10,SKD);
                      R(4,6,17,2,shade(c.accCol||'#5a6e8c',0.8)); break;
        case 'afro': paEllipse(g,12,5+dy,9,5,HR); paEllipse(g,12,4+dy,7,3,HRD); break;
        case 'mohawk': R(5,6,15,3,HR); R(11,1,3,7,HR); R(11,1,3,2,HRD); break;
        case 'ponytail': R(5,6,15,3,HR); R(4,7,3,6,HR); R(18,7,3,6,HR); R(19,12,2,7,HR); break;
        case 'bun': R(5,6,15,3,HR); R(4,7,3,6,HR); R(18,7,3,6,HR); paEllipse(g,12,3+dy,3,2,HR); break;
        case 'long': R(5,6,15,3,HR); R(4,7,3,12,HR); R(18,7,3,12,HR); R(4,7,1,12,HRD); R(20,7,1,12,HRD); break;
        case 'bob': R(5,6,15,3,HR); R(4,7,3,9,HR); R(18,7,3,9,HR); R(4,14,3,2,HRD); R(18,14,3,2,HRD); break;
        case 'curly': R(4,5,17,4,HR); R(4,7,3,7,HR); R(18,7,3,7,HR);
                      for(let i=0;i<5;i++) paPX(g,5+i*3,5+dy,HRD); break;
        default: R(5,6,15,3,HR); R(4,8,2,4,HR); R(19,8,2,4,HR);
      }
    } else {
      switch(hs){
        case 'bald': case 'buzz': R(11,6,10,4,hs==='buzz'?HR:SK); R(12,6,9,2,hs==='buzz'?HRD:SKD); break;
        case 'hijab': R(4,4,18,15,c.accCol||'#5a6e8c'); R(4,7,10,12,SK); R(13,6,8,13,shade(c.accCol||'#5a6e8c',0.9)); break;
        case 'afro': paEllipse(g,12,5+dy,9,5,HR); break;
        case 'mohawk': R(11,6,10,3,HR); R(9,1,3,7,HR); R(9,1,3,2,HRD); break;
        case 'ponytail': R(11,6,10,3,HR); R(16,9,5,10,HR); R(17,17,4,2,HRD); break;
        case 'bun': R(11,6,10,3,HR); R(13,7,8,6,HR); paEllipse(g,17,4+dy,3,2,HR); break;
        case 'long': case 'bob': R(11,6,10,4,HR); R(17,8,4,hs==='long'?12:9,HR); R(19,8,2,hs==='long'?12:9,HRD); break;
        case 'curly': R(10,5,11,4,HR); R(16,7,5,8,HR); break;
        default: R(11,6,10,4,HR); R(12,6,8,2,HRD); R(19,8,2,4,HR);
      }
    }
    if(!noHat){
      if(hat==='cap'){ paEllipse(g,12,4+dy,8,3,hc); R(dir===0?3:16,6,dir===0?8:6,2,hc); R(5,7,14,1,shade(hc,0.75)); }
      else if(hat==='beanie'){ R(4,3,17,5,hc); R(4,7,17,1,shade(hc,0.75)); paPX(g,12,2+dy,shade(hc,1.2)); }
      else if(hat==='bandana'){ R(4,5,17,3,hc); R(dir===0?18:16,7,3,3,hc); }
      else if(hat==='hardhat'){ paEllipse(g,12,4+dy,9,4,hc); R(3,6,19,2,shade(hc,0.8)); paR(g,11,1+dy,3,2,shade(hc,1.15)); }
    }
    if(dir===0) nvFaceFront(g,dy,blink,open); else nvFaceProfile(g,dy,blink,open);
    /* accessories over the face */
    if(c.acc==='glasses'&&dir===0){ R(8,11,3,1,c.accCol||'#2b2b33'); R(14,11,3,1,c.accCol||'#2b2b33'); R(11,11,2,1,c.accCol||'#2b2b33'); }
    else if(c.acc==='glasses'){ R(3,11,3,1,c.accCol||'#2b2b33'); }
    if(c.acc==='headphones'){ R(3,9,2,4,c.accCol||'#14100c'); R(20,9,2,4,c.accCol||'#14100c'); R(4,4,17,1,c.accCol||'#14100c'); }
    if(c.acc==='headband'){ R(4,8,17,1,c.accCol||'#e8542f'); }
    if(c.acc==='beard'&&dir===0){ R(6,15,13,4,HR); R(6,17,13,2,HRD); R(9,14,7,1,HR); }
    else if(c.acc==='beard'&&dir===2){ R(3,14,9,5,HR); R(3,17,9,2,HRD); }
    if(c.acc==='stache'&&dir===0){ R(9,14,7,1,HR); }
    else if(c.acc==='stache'&&dir===2){ R(3,14,4,1,HR); }
  };
}

/* parameterized torso painter: outfit detail + standard arms + hand prop */
function nvCastTorso(c){
  const P=nvCastPal(c);
  const SH=P.shirt,SHD=P.shirtD,SK=P.skin;
  return function(g,dir,act,fr,dy){
    const R=(x,y,w,h,col)=>paR(g,x,y+dy,w,h,col);
    const mir=dir===2;
    const rR=(x,y,w,h,col)=>{ if(mir) paR(g,24-x-w,y+dy,w,h,col); else paR(g,x,y+dy,w,h,col); };
    R(8,18,9,8,SH); R(15,18,2,8,SHD);
    const o=c.outfit;
    if(o==='hoodie'){ R(9,18,7,1,SHD); R(10,23,5,3,SHD); R(8,17,9,2,SHD); }
    else if(o==='apron'){ R(9,19,7,7,'#efe6d0'); R(14,19,2,7,'#d3c6a8'); R(10,18,1,2,'#d3c6a8'); R(15,18,1,2,'#d3c6a8'); }
    else if(o==='dress'){ R(7,24,11,4,SH); R(7,27,11,1,SHD); }
    else if(o==='overalls'){ R(9,18,2,8,P.pants); R(14,18,2,8,P.pants); R(9,22,7,4,P.pants); R(9,18,1,1,'#d9a441'); R(15,18,1,1,'#d9a441'); }
    else if(o==='jacket'){ R(11,18,3,8,'#efe6d0'); R(11,18,3,1,SHD); R(8,18,9,1,SHD); }
    else if(o==='vest'){ R(8,18,9,8,c.accCol&&c.outfit==='vest'&&c.hat==='hardhat'?'#e8782f':SHD); R(11,18,3,8,SH); }
    else if(o==='sweater'){ R(8,20,9,1,SHD); R(8,23,9,1,SHD); }
    else if(o==='scrubs'){ R(11,18,3,3,SHD); rR(9,19,2,2,'#f4f0e8'); }
    /* arms */
    const sw=(act==='walk')?nvSwing(fr):0;
    const oT=mir?sw:-sw, oO=mir?-sw:sw;
    const HX=mir?6:17, OX=mir?14:5, OSH=mir?SHD:SH;
    const propX=mir?3:18;
    if(act==='talk'&&fr===1){
      paR(g,OX,12+dy,4,7,OSH); paR(g,OX,12+dy,2,2,SK);
      paR(g,HX-1,18+dy,4,7,SH); paR(g,HX,23+dy,2,2,SK);
    } else if(act==='work'){
      paR(g,OX,18+dy,4,7,OSH); paR(g,OX,23+dy,2,2,SK);
      if(fr===0){ paR(g,HX-1,12+dy,4,7,SH); paR(g,HX,12+dy,2,2,SK); }
      else if(fr===1){ paR(g,HX-1,16+dy,4,7,SH); paR(g,HX,20+dy,2,2,SK); }
      else { paR(g,HX-1,18+dy,4,7,SH); paR(g,HX,23+dy,2,2,SK); }
    } else {
      paR(g,OX,18+dy+oO,4,7,OSH); paR(g,OX,23+dy+oO,2,2,SK);
      paR(g,HX-1,18+dy+oT,4,7,SH); paR(g,HX,23+dy+oT,2,2,SK);
    }
    /* hand prop (not while gesturing) */
    if(act!=='work'&&act!=='talk'){
      const py=22+dy+oT;
      if(c.prop==='coffee'){ paR(g,propX,py,3,4,'#f4f0e8'); paR(g,propX,py,3,1,'#c27829'); }
      else if(c.prop==='phone'){ paR(g,propX,py,3,4,'#1c1c22'); paPX(g,propX+1,py+1,'#7dd3fc'); }
      else if(c.prop==='tote'){ paR(g,propX-1,py+2,5,5,'#c9b08a'); paR(g,propX,py,3,1,'#8a6a45'); }
      else if(c.prop==='box'){ paR(g,propX-2,py-1,7,6,'#b07a45'); paR(g,propX-2,py-1,7,1,'#8a5c30'); }
      else if(c.prop==='laptop'){ paR(g,propX-2,py,6,4,'#3a3a44'); paR(g,propX-1,py+1,4,2,'#7dd3fc'); }
      else if(c.prop==='leash'){ paR(g,propX,py,2,2,SK); paLine(g,propX+1,py+2,propX+3,py+9,'#8a5c30'); paBlob(g,propX+4,py+10,2,'#6b4a26'); }
      else if(c.prop==='skate'){ paR(g,propX-2,py,7,2,'#5a4028'); paPX(g,propX,py+3,'#23232a'); paPX(g,propX+3,py+3,'#23232a'); }
    }
  };
}

/* register cast designs so spec.name='C1' etc. resolves in nvFrame */
NV_CAST.forEach(c=>{
  DESIGNS[c.id]={pal:nvCastPal(c),head:nvCastHead(c),torso:nvCastTorso(c)};
  if(c.name) DESIGNS[c.name]=DESIGNS[c.id];
});

/* ---------------- frame composer: logical -> 48x64 ---------------- */
function nvFrame(spec,dir,act,fr){
  const D=DESIGNS[spec.name]||DESIGNS.Marta;
  const L=paMk(24,32), g=L.g;
  if(act==='sit') nvSit(g,D.pal,D.head,fr);
  else if(act==='downed') nvDownedPaint(g,D.pal,fr);
  else if(act==='bathe') nvBathePaint(g,D.pal,fr);
  else {
    let dy=0, hdy=0, blink=false, open=false;
    if(act==='walk'&&(fr===1||fr===3)) dy=1;
    else if(act==='run'&&(fr===1||fr===3)) dy=2;
    else if(act==='play'&&fr===1) dy=-2;
    else if(act==='stalk') dy=2;              /* crouch */
    else if(act==='laugh'&&fr===1) dy=-1;
    if(act==='idle') blink=fr===1;
    else if(act==='talk') open=fr===1;
    else if(act==='phone') hdy=2;             /* chin down at the screen */
    else if(act==='sad'){ hdy=1; blink=fr===1; }
    else if(act==='laugh'){ hdy=-1; open=true; }
    else if(act==='eat') open=fr===2;
    else if(act==='drink'){ hdy=-1; open=true; }
    else if(act==='argue'||act==='fight'||act==='panic') open=true;
    else if(act==='wave') open=fr===1;
    nvLegsBoots(g,dir,act,fr,dy,D.pal);
    if(NV_NEW_ACTS[act]) nvPoseTorso(g,dir,act,fr,dy,D);
    else D.torso(g,dir,act,fr,dy);
    D.head(g,dir,dy+hdy,blink,open);
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
  const legacy={Marta:'hoe',Bram:'hammer',Sella:'rollingpin',Tobin:'mug',Wren:'broom',
          Finn:'rod',Alden:'scroll',Pip:'ball',
          Rowan:'lute',Clara:'basket',Gareth:'sword'};
  if(legacy[name]) return legacy[name];
  const c=NV_CAST.find(cc=>cc.id===name||cc.name===name);
  return (c && c.prop && c.prop!=='none') ? c.prop : 'idle';
}

function paLine(g,x0,y0,x1,y1,col){
  const dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1, sy=y0<y1?1:-1;
  let err=dx-dy, x=x0, y=y0;
  while(true){
    paPX(g,x,y,col);
    if(x===x1&&y===y1) break;
    const e2=2*err;
    if(e2>-dy){ err-=dy; x+=sx; }
    if(e2<dx){ err+=dx; y+=sy; }
  }
}

function buildTools(){
  PA.tools={};
  function mkTool(drawFn){
    const L=paMk(14,14), g=L.g;
    drawFn(g);
    paOutline(L.c,N_OUTL);
    const s=paMk(28,28), g2=s.g;
    g2.imageSmoothingEnabled=false;
    g2.drawImage(L.c,0,0,28,28);
    return s.c;
  }

  PA.tools.hoe = mkTool(g=>{
    paLine(g,2,12,10,4,'#8a5229');
    cR(g,8,2,5,3,'#64748b'); cR(g,10,4,3,4,'#475569'); cP(g,9,3,'#94a3b8');
  });

  PA.tools.hammer = mkTool(g=>{
    paLine(g,3,12,9,5,'#8a5229');
    cR(g,7,2,6,4,'#334155'); cR(g,8,3,4,2,'#64748b'); cP(g,8,2,'#94a3b8');
  });

  PA.tools.rollingpin = mkTool(g=>{
    cR(g,3,5,8,4,'#e2b17a'); cR(g,4,6,6,2,'#fde68a');
    cR(g,1,6,2,2,'#92400e'); cR(g,11,6,2,2,'#92400e');
  });

  PA.tools.mug = mkTool(g=>{
    cR(g,4,5,6,6,'#78350f'); cR(g,5,6,4,4,'#92400e');
    cR(g,4,6,6,1,'#94a3b8'); cR(g,4,9,6,1,'#94a3b8');
    cBlob(g,7,4,3,'#ffffff'); cBlob(g,5,4,2,'#fef3c7');
    cR(g,2,6,2,4,'#78350f'); cP(g,3,7,'#14100c');
  });

  PA.tools.broom = mkTool(g=>{
    paLine(g,3,12,11,3,'#8a5229');
    cR(g,2,9,4,4,'#ca8a04'); cR(g,1,11,5,2,'#eab308');
  });

  PA.tools.rod = mkTool(g=>{
    paLine(g,2,12,12,2,'#ca8a04'); cP(g,5,9,'#854d0e'); cP(g,9,5,'#854d0e');
    cBlob(g,4,10,1,'#64748b');
  });

  PA.tools.scroll = mkTool(g=>{
    paLine(g,5,12,9,4,'#451a03');
    cBlob(g,10,3,2,'#fbbf24'); cP(g,10,2,'#fef08a');
  });

  PA.tools.ball = mkTool(g=>{
    cR(g,6,8,2,4,'#8a5229'); cP(g,4,5,'#8a5229'); cP(g,8,5,'#8a5229');
    paLine(g,4,5,8,5,'#ef4444');
  });

  PA.tools.lute = mkTool(g=>{
    paLine(g,2,12,8,6,'#92400e'); /* neck */
    cBlob(g,9,4,3,'#d97706'); /* pear body */
    cBlob(g,9,4,2,'#b45309');
    cP(g,9,4,'#1e1b18'); /* sound hole */
    paLine(g,4,11,8,5,'#fde68a'); /* strings */
  });

  PA.tools.basket = mkTool(g=>{
    cR(g,3,5,8,6,'#b45309'); /* wicker basket body */
    cR(g,4,6,6,4,'#d97706');
    paLine(g,4,5,10,5,'#f472b6'); /* silk rolls inside: pink */
    paLine(g,4,4,8,4,'#38bdf8'); /* cyan silk */
    paLine(g,4,3,10,3,'#78350f'); /* handle */
  });

  PA.tools.sword = mkTool(g=>{
    paLine(g,2,12,11,3,'#94a3b8'); /* blade */
    paLine(g,3,11,10,4,'#e2e8f0'); /* blade fuller highlight */
    cR(g,3,10,4,2,'#d97706'); /* crossguard */
    cR(g,1,12,2,2,'#451a03'); /* grip */
    cP(g,1,13,'#fbbf24'); /* pommel */
  });

  /* modern props for the Mission District cast */
  PA.tools.coffee = mkTool(g=>{
    cR(g,4,4,6,7,'#f4f0e8'); cR(g,4,4,6,2,'#c27829'); /* sleeve */
    cR(g,5,2,4,2,'#e8e2d4'); cR(g,10,6,2,3,'#f4f0e8'); /* lid + handle */
  });
  PA.tools.phone = mkTool(g=>{
    cR(g,5,3,5,9,'#1c1c22'); cR(g,6,4,3,6,'#7dd3fc'); cP(g,7,11,'#f4f0e8');
  });
  PA.tools.tote = mkTool(g=>{
    cR(g,3,6,9,7,'#c9b08a'); cR(g,4,7,7,5,'#b39a74');
    paLine(g,5,6,5,3,'#8a6a45'); paLine(g,10,6,10,3,'#8a6a45');
    paLine(g,5,3,10,3,'#8a6a45');
  });
  PA.tools.box = mkTool(g=>{
    cR(g,2,4,11,8,'#b07a45'); cR(g,2,4,11,1,'#8a5c30'); cR(g,7,4,1,8,'#8a5c30');
    cP(g,3,6,'#8a5c30'); cP(g,11,6,'#8a5c30');
  });
  PA.tools.laptop = mkTool(g=>{
    cR(g,3,3,9,7,'#3a3a44'); cR(g,4,4,7,5,'#7dd3fc');
    cR(g,2,10,11,2,'#54585f'); cR(g,6,10,3,1,'#2b2b33');
  });
  PA.tools.leash = mkTool(g=>{
    paLine(g,3,3,10,10,'#8a5c30'); cBlob(g,11,11,2,'#6b4a26'); cP(g,12,10,'#f4f0e8');
  });
  PA.tools.skate = mkTool(g=>{
    cR(g,2,6,11,2,'#5a4028'); cR(g,3,5,9,1,'#8a6a45');
    cP(g,4,9,'#23232a'); cP(g,11,9,'#23232a');
    paLine(g,4,8,4,9,'#54585f'); paLine(g,11,8,11,9,'#54585f');
  });
}

function buildThoughtBubbles(){
  PA.fx.bubbles={};
  function mkBubble(drawIcon){
    const L=paMk(10,9), g=L.g;
    cBlob(g,5,4,4,'#ffffff');
    cR(g,2,7,2,2,'#ffffff'); cP(g,3,8,'#ffffff');
    drawIcon(g);
    paOutline(L.c,N_OUTL);
    const s=paMk(20,18), g2=s.g;
    g2.imageSmoothingEnabled=false;
    g2.drawImage(L.c,0,0,20,18);
    return s.c;
  }

  PA.fx.bubbles.talk = mkBubble(g=>{
    cP(g,3,4,'#2b2b2b'); cP(g,5,4,'#2b2b2b'); cP(g,7,4,'#2b2b2b');
  });
  PA.fx.bubbles.food = mkBubble(g=>{
    cR(g,3,3,5,3,'#c27829'); cR(g,4,2,3,1,'#f5c369'); cP(g,4,3,'#fef08a'); cP(g,6,3,'#fef08a');
  });
  PA.fx.bubbles.sleep = mkBubble(g=>{
    cR(g,3,2,3,1,'#7c3aed'); cP(g,5,3,'#7c3aed'); cP(g,4,4,'#7c3aed'); cR(g,3,5,3,1,'#7c3aed'); cP(g,7,5,'#a855f7');
  });
  PA.fx.bubbles.heart = mkBubble(g=>{
    cR(g,3,2,2,2,'#e11d48'); cR(g,6,2,2,2,'#e11d48'); cR(g,3,4,5,2,'#e11d48'); cR(g,4,6,3,1,'#e11d48'); cP(g,5,7,'#e11d48');
  });
  PA.fx.bubbles.work = mkBubble(g=>{
    cR(g,3,2,4,2,'#64748b'); cR(g,4,4,2,3,'#92400e');
  });
  PA.fx.bubbles.idea = mkBubble(g=>{
    cBlob(g,5,3,2,'#facc15'); cR(g,5,5,2,2,'#f59e0b'); cP(g,5,7,'#64748b');
  });
  PA.fx.bubbles.cold = mkBubble(g=>{
    cP(g,5,2,'#38bdf8'); cP(g,5,6,'#38bdf8'); cP(g,3,4,'#38bdf8'); cP(g,7,4,'#38bdf8'); cP(g,5,4,'#0284c7');
  });
  PA.fx.bubbles.happy = mkBubble(g=>{
    cP(g,3,3,'#2b2b2b'); cP(g,7,3,'#2b2b2b'); cP(g,3,5,'#dc2626'); cR(g,4,6,3,1,'#2b2b2b');
  });

  PA.fx.bubble = PA.fx.bubbles.talk;
}

/* full frame table for one character spec: F[dir][act] = [canvas,...] */
function nvBuildFrameSet(spec){
  const F={};
  for(const dir of [0,1,2]){
    F[dir]={};
    for(const [act,n] of NV_ACTS){
      F[dir][act]=[];
      for(let f=0;f<n;f++) F[dir][act].push(nvFrame(spec,dir,act,f));
    }
    F[dir].sleep=[nvSleepFrame(spec,0), nvSleepFrame(spec,1)];
  }
  return F;
}

function buildChars(){
  PA.chars=[];
  for(let i=0;i<G.villagers.length;i++){
    const v=G.villagers[i];
    const D=DESIGNS[v.name]||DESIGNS.Marta;
    const spec={name:v.name, work:workFor(v.name), kid:v.name==='Pip', pal:D.pal};
    PA.chars.push(nvBuildFrameSet(spec));
    v._ci=i;
  }
  buildTools();
  buildThoughtBubbles();
}

/* build frame tables for the 28-member modern cast; PA.cast[id] = frameset */
function buildCastChars(){
  PA.cast={};
  for(const c of NV_CAST){
    PA.cast[c.id]=nvBuildFrameSet({name:c.id, work:workFor(c.id), kid:false, pal:nvCastPal(c)});
  }
  return PA.cast;
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
  const A=paStateAnim(st);
  let arr, fi=0;
  if(st==='walk'){ arr=F[dir].walk; fi=Math.floor(v.walkPhase*6.366)%4; }
  else if(A.act==='idle'){ arr=F[dir].idle; fi=(((t+Math.floor(v.seed*10))%210)<14)?1:0; }
  else {
    arr=F[dir][A.act]||F[dir].idle;
    fi=A.wp ? Math.floor(v.walkPhase*(A.wpm||4))%arr.length
            : Math.floor(t/(A.tick||18))%arr.length;
  }
  const fr=arr[fi%arr.length];
  let dyOffset = 0;
  if(v.triumphT > 0){
    dyOffset = -Math.sin(v.triumphT * Math.PI) * 4; /* celebratory mini-jump! */
  } else if(v.needs && v.needs.rest < 0.25){
    dyOffset = 1; /* low energy slump */
  }
  const dx=Math.round(px0-fr.width/2), dy=Math.round(py0+2-fr.height + dyOffset);
  g.imageSmoothingEnabled=false;
  if(v.face===3&&st!=='sit'){
    g.save(); g.translate(Math.round(px0)*2,0); g.scale(-1,1);
    g.drawImage(fr, dx, dy, fr.width, fr.height);
    g.restore();
  } else {
    g.drawImage(fr, dx, dy);
  }

  // RimWorld-Style Dynamic Attached Tool
  const toolKey = (v.equippedTool && v.equippedTool.kind) || workFor(v.name);
  const sprTool = PA.tools && PA.tools[toolKey];
  if(sprTool && st!=='sleep'){
    let hx = px0, hy = py0 - 18 + dyOffset;
    const isRight = v.face === 3;
    const isLeft = v.face === 2;
    const isBack = v.face === 1;
    let toolAngle = 0;

    if(v.triumphT > 0){
      toolAngle = -1.2; /* raising tool high in triumph! */
    } else if(st === 'work'){
      if(toolKey === 'hammer'){
        const swing = Math.sin(t * 0.22);
        toolAngle = swing < 0 ? swing * 0.9 : swing * 1.3;
      } else if(toolKey === 'hoe'){
        const swing = Math.sin(t * 0.18);
        toolAngle = swing * 0.85;
      } else if(toolKey === 'rollingpin'){
        toolAngle = Math.sin(t * 0.28) * 0.35;
      } else if(toolKey === 'rod'){
        toolAngle = -0.35 + Math.sin(t * 0.08) * 0.08;
      } else if(toolKey === 'mug'){
        toolAngle = Math.sin(t * 0.15) * 0.25;
      } else if(toolKey === 'lute'){
        toolAngle = -0.3 + Math.sin(t * 0.25) * 0.15; /* strumming lute */
      } else if(toolKey === 'sword'){
        toolAngle = Math.sin(t * 0.12) * 0.3; /* gleaming knight stance */
      } else if(toolKey === 'basket'){
        toolAngle = Math.sin(t * 0.1) * 0.12; /* displaying wares */
      } else {
        toolAngle = Math.sin(t * 0.2) * 0.4;
      }
    } else if(st === 'walk'){
      toolAngle = Math.sin(v.walkPhase * 6.366) * 0.25;
    } else {
      toolAngle = Math.sin((t + v.seed * 10) * 0.05) * 0.08;
    }

    if(isLeft){
      hx = px0 - 7; hy = py0 - 17;
    } else if(isRight){
      hx = px0 + 7; hy = py0 - 17;
    } else if(isBack){
      hx = px0 + 8; hy = py0 - 18;
    } else {
      hx = px0 + 8; hy = py0 - 17;
    }

    g.save();
    g.translate(hx, hy);
    if(isRight){ g.scale(-1, 1); }
    g.rotate(toolAngle);
    g.drawImage(sprTool, -6, -20);

    // Finn's fishing line
    if(toolKey === 'rod' && (st === 'work' || st === 'idle')){
      const rodTipX = -6 + 22, rodTipY = -20 + 4;
      const waterTargetY = py0 + 14 - hy;
      g.strokeStyle = 'rgba(224, 242, 254, 0.75)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(rodTipX, rodTipY);
      g.quadraticCurveTo(rodTipX + 8, waterTargetY * 0.5, rodTipX + 4, waterTargetY);
      g.stroke();
      g.fillStyle = '#ef4444';
      g.fillRect(rodTipX + 3, waterTargetY - 2, 3, 3);
      g.fillStyle = '#ffffff';
      g.fillRect(rodTipX + 4, waterTargetY - 1, 1, 1);
    }
    g.restore();
  }

  // RimWorld-Style Floating Thought / Need Bubble
  let activeBubble = null;
  if(st === 'talk'){
    activeBubble = (Math.sin(v.seed * 10) > 0.3) ? PA.fx.bubbles.heart : PA.fx.bubbles.talk;
  } else if(v.currentBubble && PA.fx.bubbles && PA.fx.bubbles[v.currentBubble]){
    activeBubble = PA.fx.bubbles[v.currentBubble];
  } else if(v.needs && v.needs.food < 0.35 && PA.fx.bubbles){
    activeBubble = PA.fx.bubbles.food;
  } else if(v.needs && v.needs.rest < 0.35 && PA.fx.bubbles){
    activeBubble = PA.fx.bubbles.sleep;
  } else if(st === 'work' && PA.fx.bubbles){
    activeBubble = (Math.floor(t / 80) % 3 === 0) ? PA.fx.bubbles.work : (Math.floor(t / 140) % 2 === 0 ? PA.fx.bubbles.idea : null);
  }

  if(activeBubble){
    const bob = Math.sin((t + v.seed * 15) * 0.08) * 2;
    g.drawImage(activeBubble, Math.round(px0 + 6), Math.round(py0 - 74 + bob));
  }
}

