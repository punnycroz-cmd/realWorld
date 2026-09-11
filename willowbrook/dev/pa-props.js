/* =====================================================================
   PA-PROPS v6 — premium hand-crafted prop sprites, bottom-center anchored.
   Native pixels: canvases are old_cells x2 (same on-screen footprint).
   PA.props[kind] = {spr,lift} | {variants:[],lift} | lamp {on,off,lift}
   Light: warm key upper-left, cool occlusion. Order: art -> paOutline -> shadow.
   ===================================================================== */
function buildProps(){
  const P=PA.props;
  const put=(kind,spr,lift)=>{ P[kind]={spr,lift:lift||0}; };
  const putV=(kind,arr,lift)=>{ P[kind]={variants:arr,lift:lift||0}; };
  const WD=MAT.wood, WDD=MAT.woodDark, WP=MAT.woodPale;
  const MT=MAT.metal, IR=MAT.ironDark, BR=MAT.brass;
  const ST=MAT.stone, STW=MAT.stoneWarm, TH=MAT.thatch;
  const LF=MAT.leaf, LFD=MAT.leafDeep;
  const shD=MAT.shingle.map(c=>shade(c,0.78)); // right/dark roof slope

  /* paint art, outline, then dithered ground shadow (shadow last so it
     never gets a hard outline ring) */
  const fin=(s,cx,base,rx,ry)=>{
    paOutline(s.c);
    if(rx) paGroundShadow(s.g,cx,base,rx,ry);
  };
  /* gable roof triangle with individual shingle courses, left slope lit */
  const gable=(g,cx,topY,botY,maxHW,key)=>{
    for(let y=topY;y<botY;y++){
      const hw=Math.max(2,Math.round(maxHW*(y-topY)/(botY-topY)));
      const course=Math.floor((y-topY)/7), off=(course&1)*4;
      for(let x=cx-hw;x<cx+hw;x++){
        const L=x<cx, tx=x+off;
        let col=L?MAT.shingle[3]:shD[3];
        if((((tx%8)+8)%8)===0) col=L?MAT.shingle[1]:shD[1];
        if((y-topY)%7===6) col=L?MAT.shingle[1]:shD[0];
        else if((y-topY)%7===0) col=L?MAT.shingle[5]:shD[4];
        if(phash(x,y,key)<0.07) col=L?MAT.shingle[4]:shD[2];
        paPX(g,x,y,col);
      }
    }
  };
  /* twisted rope: vertical strand, 2px wide */
  const ropeV=(g,x,y0,y1,key)=>{
    for(let y=y0;y<y1;y++){
      const s=phash(x,y,key)<0.5;
      paPX(g,x,y,s?WP[4]:WDD[3]); paPX(g,x+1,y,s?WDD[3]:WP[4]);
      if((y&3)===0) paPX(g,x,y,WDD[1]);
    }
  };
  /* iron band with rivets across a span */
  const band=(g,x0,x1,y)=>{
    paR(g,x0,y,x1-x0,3,IR[3]);
    paR(g,x0,y,x1-x0,1,IR[5]);
    paR(g,x0,y+2,x1-x0,1,IR[1]);
    for(let x=x0+2;x<x1-1;x+=5){ paPX(g,x,y+1,IR[6]); }
  };

  /* ================= WELL (44x84) ================= */
  {
    const s=paMk(44,84), g=s.g, cx=22, base=76;
    // stone ring
    texStone(g,4,50,36,24,STW,101);
    for(let x=4;x<40;x+=9){ // rim cap stones
      paR(g,x,47,8,4,STW[5]); paR(g,x,47,8,1,STW[6]);
      paR(g,x+8,47,1,4,STW[1]);
    }
    paR(g,4,51,36,1,STW[1]); // rim shadow line
    // dark water inside
    paEllipse(g,22,55,12,4,'#1a2430');
    paEllipse(g,20,54,8,2,'#2c465c');
    paPX(g,16,53,'#9fd0e8'); paPX(g,17,54,'#9fd0e8'); paPX(g,27,54,'#5a7a92');
    // moss accents
    for(let i=0;i<10;i++){
      const mx=4+Math.floor(phash(i,7,102)*36), my=50+Math.floor(phash(i,13,102)*22);
      paPX(g,mx,my,phash(i,3,102)<0.5?LFD[3]:LF[4]);
    }
    // posts
    texPlanksV(g,3,18,7,36,WDD,103); texPlanksV(g,34,18,7,36,WDD,103);
    paR(g,3,18,7,2,WDD[5]); paR(g,34,18,7,2,WDD[5]);
    band(g,3,10,30); band(g,34,41,30);
    // windlass bar
    texPlanksH(g,3,24,38,6,WD,104);
    paR(g,3,24,38,1,WD[5]); paR(g,3,29,38,1,WDD[1]);
    // crank handle (right)
    paR(g,40,26,3,10,WDD[3]); paR(g,40,26,1,10,WDD[5]);
    paBlob(g,41,37,3,WDD[3]); paPX(g,40,36,WDD[5]);
    // gable roof
    gable(g,cx,4,22,22,105);
    paR(g,cx-2,2,5,3,WDD[2]); paPX(g,cx-1,2,WDD[5]); // ridge cap
    paR(g,0,22,44,2,shD[0]); // eave shadow
    paR(g,1,20,42,1,MAT.shingle[5]); // eave highlight
    // rope + hanging bucket
    ropeV(g,21,30,44,106);
    // bucket
    texPlanksV(g,16,44,12,12,WD,107);
    paR(g,16,44,12,2,WD[5]);
    band(g,16,28,46); band(g,16,28,54);
    paEllipse(g,22,45,6,2,WDD[1]);
    paEllipse(g,22,45,5,1,'#2c465c'); paPX(g,20,45,'#9fd0e8');
    fin(s,cx,base,22,6);
    put('well',s,6);
  }

  /* ================= LAMP POST (42x54): off + on ================= */
  {
    const mkLamp=(on)=>{
      const s=paMk(42,54), g=s.g, cx=21, base=52;
      // iron post
      paGradV(g,18,16,7,36,[IR[1],IR[2],IR[3],IR[4]]);
      paR(g,18,16,2,36,IR[5]); paR(g,23,16,1,36,IR[1]);
      paNoise(g,18,16,7,36,[IR[2],IR[4]],0.10,201);
      // base flare + collars
      paR(g,14,46,14,6,IR[2]); paR(g,14,46,14,2,IR[4]); paR(g,14,50,14,2,IR[1]);
      paR(g,16,30,10,4,IR[3]); paR(g,16,30,10,1,IR[5]);
      paR(g,16,18,10,3,IR[3]); paR(g,16,18,10,1,IR[5]);
      // lantern frame
      paR(g,11,6,3,20,IR[3]); paR(g,28,6,3,20,IR[3]); // side bars
      paR(g,11,6,3,20,IR[3]);
      paR(g,11,6,1,20,IR[5]); paR(g,28,6,1,20,IR[5]);
      paR(g,11,24,20,3,IR[2]); // bottom rail
      paPX(g,21,27,IR[4]); // drop finial
      // cap: little pyramid roof
      for(let y=0;y<6;y++){
        const hw=Math.round(10*(y/6));
        paR(g,cx-hw,y,cx+hw-(cx-hw),1,IR[3]);
        paR(g,cx-hw,y,1,1,IR[5]);
      }
      paPX(g,cx,0,BR[5]); paBlob(g,cx,1,2,IR[2]); // finial
      // glass
      if(on){
        paGradV(g,14,8,14,16,['#ff9a3e','#ffbe5a','#ffd98a','#fff2c8']);
        texGlow(g,cx,15,6);
        paPX(g,18,10,'#fffbe8'); paPX(g,19,11,'#fffbe8');
      }else{
        paGradV(g,14,8,14,16,['#5a6a7e','#7e90a5','#a5b6c8']);
        paLine(g,16,20,24,10,'#e8f2fa'); paLine(g,18,21,26,13,'#e8f2fa'); // glint
        paR(g,14,8,14,2,'#c8d6e2');
      }
      // mullions
      paR(g,20,8,2,16,IR[3]); paR(g,14,14,14,2,IR[3]);
      paOutline(s.c);
      if(on){ // baked warm halo (after outline so it never gets outlined)
        for(let j=-16;j<=16;j++)for(let i=-16;i<=16;i++){
          const d=(i*i+j*j)/256;
          if(d<1 && _BAYER[(j+40)&3][(i+40)&3] < (1-d)*10){
            g.fillStyle='rgba(255,205,120,0.10)';
            g.fillRect(cx+i,15+j,1,1);
          }
        }
      }
      paGroundShadow(g,cx,base,8,3);
      return s;
    };
    P.lamp={off:mkLamp(false), on:mkLamp(true), lift:0};
  }

  /* ================= BENCH (44x22) ================= */
  {
    const s=paMk(44,22), g=s.g, cx=22, base=20;
    // trestle legs
    for(const lx of [7,32]){
      texPlanksV(g,lx,10,6,10,WDD,202);
      paR(g,lx-1,18,8,2,WDD[2]); // foot
      paR(g,lx,10,6,1,WDD[5]);
      band(g,lx,lx+6,12);
    }
    paR(g,10,15,24,3,WDD[3]); paR(g,10,15,24,1,WDD[5]); // stretcher
    // seat slats
    for(let i=0;i<3;i++){
      const y=4+i*2;
      paR(g,2,y,40,2,WD[3]);
      paR(g,2,y,40,1,WD[5]);
      paNoise(g,2,y,40,1,[WD[4],WD[2]],0.15,203+i);
    }
    paR(g,2,10,40,1,WDD[1]); // under-seat shadow
    paR(g,2,4,1,6,WD[5]); paR(g,41,4,1,6,WDD[2]); // end grain
    fin(s,cx,base,20,4);
    put('bench',s,0);
  }

  /* ================= BARRELS (20x30) x2 ================= */
  {
    const mk=(bands,wood,key)=>{
      const s=paMk(20,30), g=s.g, cx=10, base=28;
      // bulged body, vertical staves
      for(let y=4;y<28;y++){
        const t=(y-4)/24, hw=8+Math.round(Math.sin(t*Math.PI)*1.6);
        paR(g,cx-hw,y,hw*2,1,wood[3]);
        for(let x=cx-hw;x<cx+hw;x+=4) paPX(g,x,y,wood[2]); // stave gaps
        if(phash(7,y,key)<0.12) paPX(g,cx-hw+2,y,wood[4]);
        if(y===4) paR(g,cx-hw,y,hw*2,1,wood[5]);
        if(y===27) paR(g,cx-hw,y,hw*2,1,wood[1]);
      }
      // lid
      paEllipse(g,cx,5,7,2,wood[4]);
      paEllipse(g,cx-1,4,5,1,wood[5]);
      paPX(g,cx,4,wood[2]); // plug
      // iron bands + rivets
      for(const by of bands){
        const t=(by-4)/24, hw=8+Math.round(Math.sin(t*Math.PI)*1.6)+1;
        paR(g,cx-hw,by,hw*2,3,IR[3]);
        paR(g,cx-hw,by,hw*2,1,IR[5]);
        for(let x=cx-hw+2;x<cx+hw-1;x+=4) paPX(g,x,by+1,IR[6]);
      }
      fin(s,cx,base,10,3);
      return s;
    };
    putV('barrel',[mk([8,16,24],WD,301),mk([7,17,23],WP,302)],0);
  }

  /* ================= CRATES (22x24) x2 ================= */
  {
    const mk=(cross,key)=>{
      const s=paMk(22,24), g=s.g, cx=11, base=22;
      // box body
      texPlanksH(g,3,6,16,15,WP,303+key);
      paR(g,3,6,16,1,WP[5]); paR(g,3,20,16,1,WP[1]);
      // corner battens
      texPlanksV(g,3,6,3,15,WDD,305+key); texPlanksV(g,16,6,3,15,WDD,305+key);
      for(const nx of [4,17]) for(const ny of [8,18]) paPX(g,nx,ny,'#2c1f14'); // nails
      // top + bottom rims
      paR(g,3,5,16,2,WDD[3]); paR(g,3,5,16,1,WDD[5]);
      paR(g,3,20,16,2,WDD[2]);
      if(cross){ // X brace
        paLine(g,5,7,15,19,WDD[3]); paLine(g,5,8,15,20,WDD[3]);
        paLine(g,15,7,5,19,WDD[3]); paLine(g,15,8,5,20,WDD[3]);
        paLine(g,5,7,15,19,WDD[5]);
        paPX(g,10,13,'#2c1f14');
      }else{ // horizontal slats
        for(const sy of [9,13,17]){
          paR(g,6,sy,10,2,WP[4]); paR(g,6,sy,10,1,WP[5]); paR(g,6,sy+1,10,1,WP[2]);
        }
      }
      // straw peeking out
      for(let i=0;i<7;i++){
        const sx=5+Math.floor(phash(i,1,key)*12);
        paLine(g,sx,6,sx+(phash(i,2,key)<0.5?-1:1),3,TH[4]);
      }
      fin(s,cx,base,10,3);
      return s;
    };
    putV('crate',[mk(true,0),mk(false,1)],0);
  }

  /* ================= SIGNPOST (26x36) ================= */
  {
    const s=paMk(26,36), g=s.g, cx=13, base=34;
    // post
    texPlanksV(g,11,8,5,26,WDD,401);
    paR(g,11,8,5,2,WDD[5]); paR(g,14,8,1,26,WDD[1]);
    paR(g,10,32,7,2,WDD[2]); // foot
    // arm (extends both ways from post for balance)
    texPlanksH(g,4,5,20,4,WD,402);
    paR(g,4,5,20,1,WD[5]); paR(g,4,8,20,1,WDD[1]);
    // iron bracket curl
    paLine(g,12,14,20,7,IR[3]); paLine(g,12,15,20,8,IR[3]);
    paPX(g,20,7,IR[5]); paBlob(g,12,14,2,IR[3]);
    // hanging rings
    for(const rx of [6,18]){
      paR(g,rx,9,2,3,IR[4]); paPX(g,rx,9,IR[6]);
    }
    // board
    paR(g,2,11,22,14,WP[3]);
    texPlanksH(g,3,12,20,12,WP,403);
    paR(g,2,11,22,2,WDD[4]); paR(g,2,11,22,1,WP[5]); // top trim
    paR(g,2,23,22,2,WDD[2]); // bottom shade
    paR(g,2,11,2,14,WDD[4]); paR(g,22,11,2,14,WDD[2]); // side trims
    // carved inner border
    paR(g,5,14,16,1,WDD[2]); paR(g,5,21,16,1,WDD[2]);
    paR(g,5,14,1,8,WDD[2]); paR(g,20,14,1,8,WDD[2]);
    // painted emblem: little house
    paR(g,10,16,6,4,'#f2e4c2'); paR(g,10,16,6,1,'#fff6d8');
    for(let y=0;y<3;y++) paR(g,11+y,15-y,4,1,'#b8452e');
    paR(g,12,18,2,2,'#7a3a20'); // door
    paPX(g,9,19,'#f2e4c2'); paPX(g,17,19,'#f2e4c2'); // sparkle dots
    fin(s,cx,base,10,3);
    put('sign',s,0);
  }

  /* ================= FENCES ================= */
  {
    // horizontal fence (32x18)
    const h=paMk(32,18), g=h.g;
    for(const ry of [4,10]){
      texPlanksH(g,0,ry,32,3,WD,404+ry);
      paR(g,0,ry,32,1,WD[5]);
    }
    for(const px of [2,13,24]){
      texPlanksV(g,px,0,5,16,WDD,410+px);
      paPX(g,px+1,0,WDD[5]); paPX(g,px+2,0,WDD[5]); paPX(g,px+3,1,WDD[4]); // point
      paPX(g,px+2,6,'#2c1f14'); paPX(g,px+2,12,'#2c1f14'); // nails
    }
    fin(h,16,16,0,0); put('fenceH',h,2);
    // vertical fence (18x32)
    const v=paMk(18,32), g2=v.g;
    for(const ry of [8,20]){
      paR(g2,0,ry,18,3,WD[3]); paR(g2,0,ry,18,1,WD[5]);
      paNoise(g2,0,ry,18,3,[WD[4],WD[2]],0.12,420+ry);
    }
    for(const px of [1,7,13]){
      texPlanksV(g2,px+1,2,4,28,WDD,430+px);
      paPX(g2,px+2,2,WDD[5]); paPX(g2,px+3,3,WDD[4]);
      paPX(g2,px+2,9,'#2c1f14'); paPX(g2,px+2,21,'#2c1f14');
    }
    fin(v,9,30,0,0); put('fenceV',v,2);
    // single post (14x24)
    const p=paMk(14,24), g3=p.g;
    texPlanksV(g3,4,2,6,20,WDD,440);
    paPX(g3,5,2,WDD[5]); paPX(g3,6,2,WDD[5]); paPX(g3,7,3,WDD[4]); // cap point
    band(g3,4,10,8);
    paR(g3,3,20,8,2,WDD[2]);
    fin(p,7,22,0,0); put('fencePost',p,2);
  }

  /* ================= MARKET STALL (76x80) ================= */
  {
    const s=paMk(76,80), g=s.g, cx=38, base=76;
    // posts
    texPlanksV(g,4,22,7,54,WDD,501); texPlanksV(g,65,22,7,54,WDD,501);
    paR(g,4,22,7,2,WDD[5]); paR(g,65,22,7,2,WDD[5]);
    band(g,4,11,40); band(g,65,72,40);
    // striped canopy with scalloped edge
    const stripes=['#f2e4c2','#b8452e'];
    for(let i=0;i<8;i++){
      const x0=i*10, x1=Math.min(76,(i+1)*10);
      paR(g,x0,4,x1-x0,18,i%2?stripes[1]:stripes[0]);
      paR(g,x0,4,x1-x0,2,i%2?'#d96a5a':'#fff6d8'); // top light
      // fold shadows at stripe borders
      paR(g,x0,4,2,18,'rgba(60,20,10,0.25)');
      paR(g,x0+2,4,1,18,'rgba(255,255,255,0.20)');
    }
    // scallops
    for(let i=0;i<8;i++){
      const x0=i*10;
      paBlob(g,x0+5,22,5,i%2?stripes[1]:stripes[0]);
      paBlob(g,x0+5,23,4,i%2?'#8a2e20':'#c9b48a');
    }
    paR(g,0,3,76,2,MAT.outline); // top ridge line (thin, under outline pass)
    // side valances
    paR(g,0,22,6,8,stripes[1]); paR(g,70,22,6,8,stripes[1]);
    paR(g,0,28,6,2,'#8a2e20'); paR(g,70,28,6,2,'#8a2e20');
    // counter
    texPlanksV(g,10,50,56,24,WD,502);
    paR(g,10,50,56,2,WD[1]); // under-slab shadow
    for(let x=10;x<66;x+=8) paPX(g,x,52,WD[2]); // board gaps
    // counter slab
    paR(g,8,44,60,7,WP[3]);
    paR(g,8,44,60,2,WP[5]); paR(g,8,49,60,2,WP[1]);
    paNoise(g,8,44,60,5,[WP[4],WP[2]],0.12,503);
    // goods: apple crate
    paR(g,12,36,14,9,WDD[3]); paR(g,12,36,14,1,WDD[5]);
    const apple=(ax,ay)=>{
      paBlob(g,ax,ay,3,'#d94f3d'); paBlob(g,ax-1,ay-1,2,'#f0785a');
      paPX(g,ax-1,ay-2,'#ffb09a'); paPX(g,ax,ay-3,'#3f7a30');
    };
    apple(16,35); apple(21,35); apple(18,32); apple(23,32);
    // bread loaves
    for(const [bx,bw] of [[32,10],[42,8]]){
      paEllipse(g,bx+bw/2,41,bw/2,3,'#d9a45e');
      paEllipse(g,bx+bw/2-1,40,bw/2-1,2,'#f2d090');
      paLine(g,bx+2,40,bx+5,42,'#a3763a'); paLine(g,bx+5,40,bx+8,42,'#a3763a');
    }
    // potion bottles
    const bottle=(bx,col)=>{
      paR(g,bx,34,5,11,'rgba(200,220,235,0.55)');
      paR(g,bx+1,38,3,6,col); paR(g,bx+1,38,3,1,mix(col,'#ffffff',0.5));
      paPX(g,bx+1,35,'#ffffff');
      paR(g,bx+1,32,3,3,WDD[3]); // cork
    };
    bottle(54,'#7a4fd9'); bottle(61,'#3fae5a');
    // front bunting
    for(let i=0;i<6;i++){
      const x0=12+i*10;
      paR(g,x0,56,8,1,i%2?'#b8452e':'#f2e4c2');
      paLine(g,x0,57,x0+4,63,i%2?'#b8452e':'#e8d4a8');
      paLine(g,x0+8,57,x0+4,63,i%2?'#b8452e':'#e8d4a8');
    }
    fin(s,cx,base,34,6);
    put('stall',s,2);
  }

  /* ================= ANVIL (28x24) ================= */
  {
    const s=paMk(28,24), g=s.g, cx=14, base=22;
    // stump
    paR(g,8,14,12,8,WDD[3]);
    paNoise(g,8,14,12,8,[WDD[4],WDD[2]],0.14,601);
    paR(g,8,14,12,1,WDD[5]);
    paEllipse(g,14,14,6,2,WP[4]); // cut top rings
    paEllipse(g,14,14,4,1,WP[3]); paPX(g,14,14,WDD[2]);
    // anvil feet + waist
    paR(g,9,11,10,3,IR[2]); paR(g,9,11,10,1,IR[4]);
    paR(g,11,7,6,5,IR[3]); paR(g,11,7,2,5,IR[5]);
    // face + horn
    paR(g,4,3,20,5,MT[3]);
    paR(g,4,3,20,2,MT[5]); paR(g,4,6,20,2,MT[1]);
    paPX(g,6,3,MT[6]); paPX(g,8,3,MT[6]); paPX(g,7,4,'#ffffff'); // speculars
    paLine(g,24,3,28,5,MT[3]); paLine(g,24,4,28,6,MT[4]); // horn
    paPX(g,27,5,MT[5]);
    paR(g,4,8,20,1,IR[1]); // under-face shadow
    paPX(g,6,4,'#1c1c22'); paPX(g,7,4,'#1c1c22'); // hardy hole
    fin(s,cx,base,12,4);
    put('anvil',s,0);
  }

  /* ================= GRINDSTONE (24x32) ================= */
  {
    const s=paMk(24,32), g=s.g, cx=12, base=30;
    // A-frame legs
    paLine(g,5,30,9,14,WDD[3]); paLine(g,6,30,10,14,WDD[3]);
    paLine(g,19,30,15,14,WDD[3]); paLine(g,18,30,14,14,WDD[3]);
    paR(g,4,28,5,2,WDD[2]); paR(g,15,28,5,2,WDD[2]); // feet
    paR(g,5,20,14,3,WDD[3]); paR(g,5,20,14,1,WDD[5]); // crossbar
    // wheel
    paBlob(g,12,12,10,ST[2]);
    paBlob(g,12,12,9,ST[3]);
    paBlob(g,11,11,7,ST[4]);
    for(let a=0;a<12;a++){ // tool-mark arcs
      const ang=a/12*Math.PI*2;
      paPX(g,Math.round(12+Math.cos(ang)*6),Math.round(12+Math.sin(ang)*6),ST[5]);
    }
    paBlob(g,10,10,4,ST[5]); // worn hollow highlight
    paBlob(g,12,12,2,IR[3]); paPX(g,12,12,IR[6]); // hub + pin
    // treadle + pitman
    paR(g,14,16,2,8,WDD[3]);
    paR(g,8,26,10,2,WDD[4]);
    // water trough
    paR(g,5,24,14,4,WDD[2]); paR(g,6,24,12,2,'#2c465c');
    paPX(g,8,24,'#9fd0e8');
    fin(s,cx,base,10,3);
    put('grindstone',s,0);
  }

  /* ================= DOCK POST (12x28) ================= */
  {
    const s=paMk(12,28), g=s.g, cx=6, base=26;
    // weathered post
    const grey=MAT.wood.map(c=>mix(c,'#8d8d94',0.35));
    texPlanksV(g,3,2,6,24,grey,701);
    paR(g,3,2,6,2,grey[5]);
    // rounded top
    paBlob(g,6,3,3,grey[4]); paPX(g,5,2,grey[6]);
    // rope wrap
    for(let y=8;y<14;y++){
      const s2=phash(3,y,702)<0.5;
      paR(g,3,y,6,1,s2?WP[4]:WDD[3]);
      if((y&1)===0) paR(g,3,y,6,1,WDD[1]);
    }
    // iron ring
    paBlob(g,10,16,3,IR[3]); paBlob(g,10,16,2,'rgba(0,0,0,0)');
    paPX(g,9,14,IR[5]);
    // algae at waterline
    for(let i=0;i<8;i++){
      const ax=3+Math.floor(phash(i,5,703)*6);
      paPX(g,ax,21+Math.floor(phash(i,9,703)*5),LFD[4]);
    }
    paR(g,3,24,6,2,grey[1]); // base shade
    fin(s,cx,base,0,0);
    put('dockpost',s,2);
  }

  /* ================= FLOWER BOX (30x24) ================= */
  {
    const s=paMk(30,24), g=s.g, cx=15, base=22;
    // soil
    paR(g,5,10,20,4,'#4a3524');
    paNoise(g,5,10,20,4,['#5a422c','#3a2a1c'],0.25,801);
    // box
    texPlanksH(g,3,13,24,9,WD,802);
    paR(g,3,13,24,1,WD[5]); paR(g,3,21,24,1,WDD[1]);
    texPlanksV(g,3,13,3,9,WDD,803); texPlanksV(g,24,13,3,9,WDD,803); // battens
    paPX(g,4,15,'#2c1f14'); paPX(g,25,15,'#2c1f14');
    paR(g,2,12,26,2,WDD[3]); paR(g,2,12,26,1,WDD[5]); // rim
    // flowers
    const flower=(fx,petal,center)=>{
      const fy=4+Math.floor(phash(fx,3,804)*3);
      paR(g,fx,fy+3,1,8,'#3f7a30'); // stem
      paPX(g,fx-1,fy+6,'#4e8a3c'); paPX(g,fx+1,fy+7,'#4e8a3c'); // leaves
      // 5 petals
      paBlob(g,fx,fy,3,shade(petal,0.75));
      paBlob(g,fx-1,fy-1,2,petal);
      paPX(g,fx-1,fy-2,mix(petal,'#ffffff',0.45));
      paBlob(g,fx,fy,1,center);
      paPX(g,fx,fy,'#fff2c8');
    };
    flower(7,'#e86a8a','#f2d06b');
    flower(11,'#f2d06b','#b45a1e');
    flower(15,'#ffffff','#f2d06b');
    flower(19,'#b678e0','#f2e4c2');
    flower(23,'#d94f3d','#7a1e10');
    flower(9,'#f2d06b','#b45a1e');
    fin(s,cx,base,0,0);
    put('flowerbox',s,0);
  }

  /* ================= HAY BALE (28x26) ================= */
  {
    const s=paMk(28,26), g=s.g, cx=14, base=24;
    // bale body
    paBlob(g,cx,16,11,TH[2]);
    paBlob(g,cx-1,15,10,TH[3]);
    paBlob(g,cx-2,14,7,TH[4]);
    // individual straw strokes
    for(let i=0;i<46;i++){
      const a=phash(i,1,901)*Math.PI*2, r=3+phash(i,2,901)*7;
      const sx=cx+Math.round(Math.cos(a)*r*1.1), sy=16+Math.round(Math.sin(a)*r*0.8);
      const t=phash(i,3,901);
      const col=t<0.3?TH[5]:(t<0.55?TH[4]:(t<0.8?TH[2]:TH[1]));
      const dx=phash(i,4,901)<0.5?-2:2, dy=-1-Math.floor(phash(i,5,901)*2);
      paLine(g,sx,sy,sx+dx,sy+dy,col);
    }
    // twine bands
    for(const tx of [9,17]){
      paR(g,tx,7,3,17,WDD[3]); paR(g,tx,7,3,1,WDD[5]);
      for(let y=8;y<23;y+=3) paPX(g,tx+1,y,WDD[1]);
    }
    fin(s,cx,base,12,4);
    put('haybale',s,0);
  }

  /* ================= FIREWOOD STACK (28x20) ================= */
  {
    const s=paMk(28,20), g=s.g, cx=14, base=18;
    const logEnd=(lx,ly)=>{
      paBlob(g,lx,ly,4,WDD[2]); // bark rim
      paBlob(g,lx,ly,3,WP[4]);
      paBlob(g,lx,ly,2,WP[3]);
      paPX(g,lx,ly,WDD[3]); paPX(g,lx-1,ly,'#c9a06b');
      paPX(g,lx-2,ly-2,WP[5]); // light edge
    };
    // bottom row: 4 logs, top row: 3
    for(const lx of [5,11,17,23]) logEnd(lx,13);
    for(const lx of [8,14,20]) logEnd(lx,7);
    // side bark texture between ends
    paR(g,2,10,24,2,WDD[3]); paNoise(g,2,10,24,2,[WDD[4]],0.2,1001);
    fin(s,cx,base,12,3);
    put('firewood',s,0);
  }

  /* ================= BUCKET (16x20) ================= */
  {
    const s=paMk(16,20), g=s.g, cx=8, base=18;
    // handle arc (behind)
    for(let a=0;a<=10;a++){
      const t=a/10*Math.PI;
      paPX(g,Math.round(8+Math.cos(t)*6),Math.round(6-Math.sin(t)*5),WDD[3]);
    }
    // tapered body: staves
    for(let y=5;y<18;y++){
      const t=(y-5)/13, hw=Math.round(6-2*t);
      paR(g,cx-hw,y,hw*2,1,WD[3]);
      for(let x=cx-hw;x<cx+hw;x+=3) paPX(g,x,y,WD[2]);
      if(y===5) paR(g,cx-hw,y,hw*2,1,WD[5]);
      if(y===17) paR(g,cx-hw,y,hw*2,1,WD[1]);
    }
    // iron bands
    band(g,2,14,7); band(g,4,12,14);
    // water top
    paEllipse(g,8,6,5,2,WDD[1]);
    paEllipse(g,8,6,4,1,'#2c465c');
    paPX(g,6,6,'#9fd0e8'); paPX(g,7,6,'#c8e4f2');
    fin(s,cx,base,0,0);
    put('bucket',s,0);
  }
}
