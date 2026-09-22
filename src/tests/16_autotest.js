/* =====================================================================
   PART 16 AUTOTEST — Phase 2A: data-driven recipes + provenance.
   (boot hook lives in sim/11_boot.js — no second DOMContentLoaded here)
   ===================================================================== */
const __runAutoTest16 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest16();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const runPlan = (v, maxIter) => {
    for(let i = 0; i < (maxIter || 400) && v.plan && v.plan.length; i++) planTick(v, 0.1);
  };

  // 16.1 recipe lookup: by id, by output name, aliases; null for unknown
  const rPlank = getRecipe('plank');
  const rBread = getRecipe('bread');           // by output name
  const rSaw = getRecipe('saw_plank');        // alias
  const rNope = getRecipe('bogus_recipe_xyz');
  log(!!rPlank && rPlank.id === 'plank' && !!rBread && rBread.id === 'bread' &&
      !!rSaw && rSaw.id === 'plank' && rNope === null,
    'recipe16: getRecipe finds by id/output/alias, null for unknown',
    'plank=' + !!rPlank + ' bread->' + (rBread && rBread.id) + ' nope=' + rNope);

  // 16.2 plank production through the table: 1 log -> 2 planks (workbench nearby)
  const t = mkTestV15('TRec1', 4, 8);
  const benches = [];
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if(VILLAGE_OBJECTS[i].kind === 'bench') benches.push(VILLAGE_OBJECTS.splice(i, 1)[0]);
  VILLAGE_OBJECTS.push({ kind: 'bench', x: t.x + 10, y: t.y });
  t.inv.log = 1;
  t.plan = [{ verb: 'recipe', recipe: 'plank' }];
  runPlan(t, 200);
  const plankOk = (t.inv.plank || 0) === 2 && (t.inv.log || 0) === 0;
  log(plankOk, 'recipe16: 1 log -> 2 planks via recipe table',
    'plank=' + (t.inv.plank || 0) + ' log=' + (t.inv.log || 0));
  // restore benches
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if(VILLAGE_OBJECTS[i].kind === 'bench' && benches.indexOf(VILLAGE_OBJECTS[i]) < 0) VILLAGE_OBJECTS.splice(i, 1);
  for(const b of benches) VILLAGE_OBJECTS.push(b);

  // 16.3 provenance attached: creator, materials, quality, condition, owner, day, history
  const prov = getItemProvenance(t, 'plank');
  const provOk = !!prov && prov.creator === 'TRec1' && prov.materials && prov.materials.log === 1 &&
    prov.quality > 0 && prov.quality <= 1 && prov.condition === 1.0 &&
    prov.owner === 'TRec1' && prov.createdAt === W.day &&
    prov.history && prov.history.length > 0 && prov.history[0].action === 'crafted';
  log(provOk, 'recipe16: crafted planks carry full provenance',
    prov ? ('creator=' + prov.creator + ' q=' + prov.quality.toFixed(2) + ' day=' + prov.createdAt) : 'no prov');
  rmTestV13(t);

  // 16.4 grain chain: crop -> flour -> bread (bread stays edible, firepit nearby)
  const t2 = mkTestV15('TRec2', 4, 8);
  const f0 = FIRES[0];
  t2.x = f0.x + 20; t2.y = f0.y;
  t2.inv.crop = 1;
  t2.plan = [{ verb: 'recipe', recipe: 'flour' }];
  runPlan(t2, 200);
  const flourOk = (t2.inv.flour || 0) === 1 && (t2.inv.crop || 0) === 0;
  t2.plan = [{ verb: 'recipe', recipe: 'bread' }];
  runPlan(t2, 200);
  const breadOk = (t2.inv.bread || 0) === 1 && (t2.inv.flour || 0) === 0 && FOOD_VAL.bread === 0.35;
  const bProv = getItemProvenance(t2, 'bread');
  const bProvOk = !!bProv && bProv.creator === 'TRec2' && bProv.materials.flour === 1;
  log(flourOk && breadOk && bProvOk, 'recipe16: crop->flour->bread with provenance, bread edible',
    'flour=' + flourOk + ' bread=' + (t2.inv.bread || 0) + ' foodVal=' + FOOD_VAL.bread);

  // 16.5 furniture needs planks + building 1; unknown recipe rejected cleanly
  t2.inv.plank = 2;
  t2.plan = [{ verb: 'recipe', recipe: 'furniture' }];
  runPlan(t2, 200);
  const furnOk = (t2.inv.furniture || 0) === 1;
  const rej = planForVerb(t2, { kind: 'recipe', recipe: 'bogus_recipe_xyz' });
  const t3 = mkTestV15('TRec3', 4, 8);
  t3.plan = [{ verb: 'recipe', recipe: 'bogus_recipe_xyz' }];
  runPlan(t3, 50); // must complete without throwing
  const badDone = !t3.plan || t3.plan.length === 0;
  log(furnOk && rej && rej.ok === false && badDone,
    'recipe16: furniture crafted; unknown recipe rejected, step ends safely',
    'furniture=' + (t2.inv.furniture || 0) + ' rej=' + (rej && rej.ok === false));
  rmTestV13(t2); rmTestV13(t3);

  // 16.6 missing inputs block with a clear thought
  const t4 = mkTestV15('TRec4', 4, 8);
  t4.plan = [{ verb: 'recipe', recipe: 'plank' }]; // no logs
  runPlan(t4, 50);
  const blocked = (t4.inv.plank || 0) === 0 &&
    t4.thoughts.some(th => /need/i.test(th.text || ''));
  log(blocked, 'recipe16: recipe without inputs ends with a "need" thought',
    'thoughts=' + JSON.stringify(t4.thoughts.map(th => th.text)));
  rmTestV13(t4);

  // 16.7 intents compile to the recipe verb
  const ti = mkTestV15('TIntent16', 4, 8);
  const checks = [
    ['saw some planks', 'plank'],
    ['bake bread', 'bread'],
    ['mill flour', 'flour'],
    ['build furniture', 'furniture']
  ];
  let allOk = true; const detail = [];
  for(const [txt, want] of checks){
    ti.plan = [];
    const r = window.__aiBridge.postIntent('TIntent16', txt);
    const got = ti.plan[0] || {};
    const ok = r.ok && got.verb === 'recipe' && got.recipe === want;
    if(!ok) allOk = false;
    detail.push(txt + '->' + got.verb + ':' + got.recipe);
  }
  log(allOk, 'recipe16: saw/mill/bake/build intents compile to recipe verb', detail.join(' | '));
  rmTestV13(ti);

  // 16.8 felled-log provenance survives the pile (tree -> pile -> hands)
  const t5 = mkTestV15('TRec5', 4, 8);
  const p = dropPileAt(t5.x + 40, t5.y, 'log', 3);
  p.felledBy = 'OldBram'; p.felledDay = W.day;
  t5.plan = [{ verb: 'take', what: 'log' }];
  runPlan(t5, 200);
  const lProv = getItemProvenance(t5, 'log');
  const pileOk = (t5.inv.log || 0) > 0 && !!lProv && lProv.creator === 'OldBram' &&
    lProv.history.some(h => h.action === 'felled');
  for(let i = PILES.length - 1; i >= 0; i--) if(PILES[i] === p) PILES.splice(i, 1);
  log(pileOk, 'recipe16: logs taken from a pile keep the feller as creator',
    'logs=' + (t5.inv.log || 0) + ' creator=' + (lProv && lProv.creator));
  rmTestV13(t5);

  // 16.9 provenance survives craft -> drop -> pile -> another villager's hands,
  // and no ghost records remain on the dropper
  const t6 = mkTestV15('TRec6', 4, 8);
  const t7 = mkTestV15('TRec7', 4, 8);
  const benches9 = [];
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if(VILLAGE_OBJECTS[i].kind === 'bench') benches9.push(VILLAGE_OBJECTS.splice(i, 1)[0]);
  VILLAGE_OBJECTS.push({ kind: 'bench', x: t6.x + 10, y: t6.y });
  t6.inv.log = 1;
  t6.plan = [{ verb: 'recipe', recipe: 'plank' }];
  runPlan(t6, 200);
  const pilesBefore = PILES.slice();
  t6.plan = [{ verb: 'drop', what: 'plank', n: 2 }];
  runPlan(t6, 50);
  const droppedOk = (t6.inv.plank || 0) === 0 && !getItemProvenance(t6, 'plank');
  t7.x = t6.x + 5; t7.y = t6.y;
  t7.plan = [{ verb: 'take', what: 'plank' }];
  runPlan(t7, 200);
  const bp2 = getItemProvenance(t7, 'plank');
  const transferOk = (t7.inv.plank || 0) > 0 && !!bp2 && bp2.creator === 'TRec6' &&
    bp2.materials && bp2.materials.log === 1 && bp2.quality > 0 && bp2.quality <= 1 &&
    bp2.history.some(h => h.action === 'crafted');
  for(let i = PILES.length - 1; i >= 0; i--) if(pilesBefore.indexOf(PILES[i]) < 0) PILES.splice(i, 1);
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if(VILLAGE_OBJECTS[i].kind === 'bench' && benches9.indexOf(VILLAGE_OBJECTS[i]) < 0) VILLAGE_OBJECTS.splice(i, 1);
  for(const b of benches9) VILLAGE_OBJECTS.push(b);
  log(droppedOk && transferOk, 'recipe16: plank provenance survives drop->take; no ghost on dropper',
    'dropped=' + droppedOk + ' took=' + (t7.inv.plank || 0) + ' creator=' + (bp2 && bp2.creator));
  rmTestV13(t6); rmTestV13(t7);

  // 16.10 unreachable workstation ends with an explanatory thought, not silence
  const t8 = mkTestV15('TRec8', 4, 8);
  const f8 = FIRES[0];
  t8.x = f8.x + CS * 20; t8.y = f8.y; // far from the firepit
  t8.inv.flour = 1;
  const __pmt = planMoveToward;
  planMoveToward = function(){ return 'stuck'; }; // pathing blocked
  t8.plan = [{ verb: 'recipe', recipe: 'bread' }];
  runPlan(t8, 20);
  planMoveToward = __pmt;
  const stuckThought = t8.thoughts.some(th => /can't reach/i.test(th.text || ''));
  const inputsKept = (t8.inv.bread || 0) === 0 && (t8.inv.flour || 0) === 1;
  log(stuckThought && inputsKept, 'recipe16: unreachable workstation ends with a "can\'t reach" thought',
    'thoughts=' + JSON.stringify(t8.thoughts.map(th => th.text)));
  rmTestV13(t8);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== part16 ' + passed + '/' + res.length + ' passed ====\n';
};
