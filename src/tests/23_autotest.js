/* =====================================================================
   PART 23 AUTOTEST — Phase 4: long-run simulation, economy/balance,
   generations/memory growth, and performance.
   Covers: year/season cycling, crop winter pause/resume, forage-spot
   registry equivalence, bush registry maintenance, dirty-chunk saves,
   transfer-log archiving, W.year persistence, caravan season hook.
   ===================================================================== */
const __runAutoTest23 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest23();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const madeNames = [];
  function mk(name, wx, wy){ const v = mkTestV22(name, wx, wy); madeNames.push(name); return v; }
  function cleanup(){
    for(const n of madeNames){
      const i = VILLAGERS.findIndex(o => o && o.name === n);
      if(i >= 0) VILLAGERS.splice(i, 1);
    }
    madeNames.length = 0;
  }
  function tickH(n){ for(let i = 0; i < n; i++) simTick(1); }

  // 23.1 season/year table: 120-day years cycle forever (no permanent winter)
  const wDay0 = W.day, wSeason0 = W.season, wYear0 = W.year, wTod0 = W.tod;
  const carSnap = JSON.stringify(CARAVAN);
  const table = [[1,'Spring',1],[30,'Spring',1],[31,'Summer',1],[60,'Summer',1],
    [61,'Autumn',1],[90,'Autumn',1],[91,'Winter',1],[120,'Winter',1],
    [121,'Spring',2],[240,'Winter',2],[241,'Spring',3],[480,'Winter',4],
    [481,'Spring',5],[600,'Winter',5]];
  let tableOk = true; const tableFails = [];
  for(const [d, s, y] of table){
    W.day = d; onDayPass();
    if(W.season !== s || W.year !== y){ tableOk = false; tableFails.push('d' + d + ' got ' + W.season + ' Y' + W.year + ' want ' + s + ' Y' + y); }
  }
  W.day = wDay0; W.season = wSeason0; W.year = wYear0; W.tod = wTod0;
  { const co = JSON.parse(carSnap); for(const k of Object.keys(CARAVAN)) delete CARAVAN[k]; Object.assign(CARAVAN, co); }
  log(tableOk, 'year23: season/year table cycles correctly across 5 years (no permanent winter)',
    tableFails.join('; ') || table.length + '/' + table.length);

  // 23.2 real-path rollover: ticking across midnight on day 120 -> Spring Y2
  W.day = 120; W.tod = 23; W.season = 'Winter'; W.year = 1;
  tickH(2);
  const rpOk = W.day === 121 && W.season === 'Spring' && W.year === 2;
  W.day = wDay0; W.tod = wTod0; W.season = wSeason0; W.year = wYear0;
  log(rpOk, 'year23: live tick across day 120 -> 121 rolls to Spring of year 2',
    'day=' + 121 + ' season=Spring year=2');

  // 23.3 crops pause in winter and resume in spring
  const tcrop = { wx: 45, wy: 32, stage: 1, grow: 0 };
  CROPS.push(tcrop);
  const sW0 = W.season;
  W.season = 'Winter'; cropTick(48);
  const winterGrow = tcrop.grow, winterStage = tcrop.stage;
  W.season = 'Spring'; cropTick(48);
  const resumed = tcrop.stage > winterStage || tcrop.grow > winterGrow;
  W.season = sW0;
  CROPS.splice(CROPS.indexOf(tcrop), 1);
  log(winterGrow === 0 && winterStage === 1 && resumed,
    'year23: crops pause in winter and resume growth in spring',
    'winter grow=' + winterGrow + ' spring stage=' + tcrop.stage);

  // 23.4 findForageSpot (registry) matches the old brute-force cell scan
  function oldForageScan(v){
    let best = null, bd = 1e9;
    for(let wy = -25; wy <= 25; wy++) for(let wx = -25; wx <= 30; wx++){
      const r = cellChunk(wx, wy);
      if(r.c.bush && r.c.bush[r.i] > 0){
        const x = wx * CS + 16, y = wy * CS + 16, d = Math.hypot(x - v.x, y - v.y);
        if(d < bd){ bd = d; best = { kind: 'bush', wx, wy, x, y }; }
      }
    }
    if(best && bd < CS * 40) return best;
    for(let wy = -25; wy <= 25; wy++) for(let wx = -25; wx <= 30; wx++){
      const d0 = getWaterDepth(wx, wy);
      if(d0 > 0 && d0 <= 0.05){
        const x = wx * CS + 16, y = wy * CS + 16, d = Math.hypot(x - v.x, y - v.y);
        if(d < bd){ bd = d; best = { kind: 'shore', wx, wy, x, y }; }
      }
    }
    return best;
  }
  const tf = mk('TForage23', 0, 0);
  const fa = findForageSpot(tf), fb = oldForageScan(tf);
  const feq = (fa === null && fb === null) ||
    (fa && fb && fa.kind === fb.kind && fa.wx === fb.wx && fa.wy === fb.wy);
  log(feq, 'year23: findForageSpot registry scan matches brute-force scan',
    fa ? (fa.kind + ' @' + fa.wx + ',' + fa.wy) : 'null/null');

  // 23.5 clearBushCell removes the bush from cells AND the registry, marks dirty
  let bc = null, bi = -1;
  for(const [k, c] of chunks){ if(c.bushCells && c.bushCells.length){ bc = c; bi = c.bushCells[0]; break; } }
  let bushOk = false;
  if(bc){
    const before = bc.bushCells.length;
    clearBushCell(bc, bi);
    bushOk = bc.bush[bi] === 0 && bc.bushCells.indexOf(bi) < 0 &&
             bc.bushCells.length === before - 1 && bc.dirty === true;
    bc.bush[bi] = 1.0; bc.bushCells.unshift(bi); // restore the test bush
  }
  log(!!bc && bushOk, 'year23: clearBushCell keeps the bush registry in sync',
    bc ? 'registry ' + (bc.bushCells.length + 1) + '->' + bc.bushCells.length : 'no bush found');

  // 23.6 save serializes only dirty chunks (pristine chunks regenerate)
  const st23 = collectSaveState();
  let dirtyCount = 0;
  for(const [k, c] of chunks){ if(c.dirty) dirtyCount++; }
  const dirtyOk = st23.chunks.length === dirtyCount && st23.chunks.length <= chunks.size &&
    st23.chunks.every(e => e[1].dirty === true);
  log(dirtyOk, 'year23: save serializes only dirty chunks',
    st23.chunks.length + ' saved / ' + chunks.size + ' generated');

  // 23.7 save/load round-trip preserves chunk data and world hash
  let ck = null, ckey = null;
  for(const [k, c] of chunks){ if(c.dirty){ ck = c; ckey = k; break; } }
  let rtOk = false, rtDesc = 'no dirty chunk';
  if(ck){
    const probeVal = ck.bush[0];
    const hBefore = worldHash();
    const sv = saveGame('t23chunk', { silent: true });
    const ld = loadGame('t23chunk');
    const hAfter = worldHash();
    const ck2 = chunks.get(ckey);
    rtOk = sv.ok && ld.ok && hBefore === hAfter && !!ck2 && ck2.bush[0] === probeVal;
    rtDesc = 'hash ' + hBefore.slice(0, 8) + (hBefore === hAfter ? ' stable' : ' DIVERGED');
  }
  log(rtOk, 'year23: save/load round-trip preserves chunk data and world hash', rtDesc);

  // 23.8 transfer log caps at 300 and archives the overflow per year (no silent drop)
  const logSnap = JSON.parse(JSON.stringify(WORLD_TRANSFER_LOG));
  const archSnap = JSON.parse(JSON.stringify(TRANSFER_ARCHIVE));
  const lenBefore = WORLD_TRANSFER_LOG.length;
  const archBefore = TRANSFER_ARCHIVE.reduce((a, b) => a + b.count, 0);
  for(let i = 0; i < 310; i++) pushWorldTransferLog(mkTransferEvent('buy', 't23item' + i, { timeH: W.day + 0.1 }));
  const archAfter = TRANSFER_ARCHIVE.reduce((a, b) => a + b.count, 0);
  const lastB = TRANSFER_ARCHIVE[TRANSFER_ARCHIVE.length - 1];
  const archOk = WORLD_TRANSFER_LOG.length === 300 &&
    (archAfter - archBefore) === (lenBefore + 310 - 300) &&
    !!lastB && lastB.year === W.year && (lastB.byType.buy || 0) > 0;
  __restoreArrayInto(WORLD_TRANSFER_LOG, logSnap);
  __restoreArrayInto(TRANSFER_ARCHIVE, archSnap);
  log(archOk, 'year23: transfer overflow is archived per year, never silently dropped',
    'log ' + lenBefore + '->' + WORLD_TRANSFER_LOG.length + ' archived +' + (archAfter - archBefore));

  // 23.9 W.year survives save/load
  const yPrev = W.year;
  W.year = 7;
  const svY = saveGame('t23year', { silent: true });
  W.year = 1;
  const ldY = loadGame('t23year');
  const yOk = svY.ok && ldY.ok && W.year === 7;
  W.year = yPrev;
  log(yOk, 'year23: W.year round-trips through save/load', 'year=' + W.year);

  // 23.10 seasonal caravan hook still fires on the Winter->Spring year rollover
  let caravanFired = false;
  const __ac23 = arriveCaravan;
  arriveCaravan = function(){ caravanFired = true; return __ac23.apply(null, arguments); };
  W.day = 121; W.season = 'Winter'; W.year = 1;
  onDayPass();
  const hookOk = caravanFired && W.season === 'Spring' && W.year === 2;
  arriveCaravan = __ac23;
  W.day = wDay0; W.season = wSeason0; W.year = wYear0; W.tod = wTod0;
  log(hookOk, 'year23: caravan arrival hook fires on the year-rollover season change',
    caravanFired ? 'fired' : 'NOT fired');

  // 23.11 shore registry is sound: every entry is shallow shore now, or
  // explicably stale (pier laid over it / landfilled by construction — both
  // skipped by findForageSpot with the getWaterDepth predicate)
  let shoreOk = true, shoreChecked = 0, shoreStale = 0;
  for(const [k, c] of chunks){
    if(!Array.isArray(c.shoreCells)){ shoreOk = false; break; }
    for(const i of c.shoreCells){
      const wx = c.cx * CHN + (i % CHN), wy = c.cy * CHN + (((i / CHN) | 0));
      const rc = cellChunk(wx, wy);
      if(rc.c.tileType[rc.i] === 5 || rc.c.h[rc.i] >= SEA){ shoreStale++; continue; }
      const d0 = getWaterDepth(wx, wy);
      if(!(d0 > 0 && d0 <= 0.05)){ shoreOk = false; break; }
      if(++shoreChecked > 400) break;
    }
    if(!shoreOk || shoreChecked > 400) break;
  }
  log(shoreOk && shoreChecked > 0, 'year23: shore-cell registry matches terrain water depth',
    shoreChecked + ' live entries checked, ' + shoreStale + ' explicably stale');

  // 23.12 perf guard: registry scan stays fast
  const tpv = mk('TPerf23', 0, 0);
  const tP = Date.now();
  for(let i = 0; i < 50; i++) findForageSpot(tpv);
  const pMs = Date.now() - tP;
  log(pMs < 500, 'year23: findForageSpot answers 50 queries quickly', pMs + 'ms');

  // 23.14 Phase 4: clotted-but-anemic villager is NOT re-downed every tick.
  // (Old woundTick downed on blood<0.38 alone; downedTick woke on bleed<=0.05.
  // The oscillation wiped v.plan hourly via setDowned, so the drink/eat/sleep
  // step never executed past its first step — villagers died of thirst/
  // exhaustion standing next to the well.)
  const tdn = mk('TDown23', 0, 0);
  const tdb = ensureBody(tdn);
  tdb.blood = 0.30;
  tdb.wounds = [{ loc: 'arm', sev: 0.25, bleed: 0.015, inf: 0.1, open: false,
                  fracture: false, dressed: false, splint: false, t: 5 }];
  tdb.satiety = 0.5; tdb.hydration = 0.5; tdb.fatigue = 0.5;
  tdn.downed = null; tdn.plan = [{ verb: 'drink', guard: true }];
  woundTick(tdn, 1);
  const noWipe = !tdn.downed && tdn.plan.length === 1 && tdn.plan[0].verb === 'drink';
  log(noWipe, 'med23: clotted-but-anemic villager is not re-downed; plan survives woundTick',
    'downed=' + JSON.stringify(tdn.downed) + ' plan=' + tdn.plan.map(s => s.verb).join(','));

  // 23.15 Phase 4: actively bleeding low-blood villager IS downed (intended).
  const tbl = mk('TBleed23', 0, 0);
  const tbb = ensureBody(tbl);
  tbb.blood = 0.30;
  tbb.wounds = [{ loc: 'arm', sev: 0.3, bleed: 0.15, inf: 0, open: true,
                  fracture: false, dressed: false, splint: false, t: 0 }];
  tbb.satiety = 0.5; tbb.hydration = 0.5; tbb.fatigue = 0.5;
  tbl.downed = null;
  woundTick(tbl, 1);
  const bDown = tbl.downed && tbl.downed.kind === 'bleeding';
  log(bDown, 'med23: actively-bleeding low-blood villager is downed (acute crisis)',
    'downed=' + JSON.stringify(tbl.downed && tbl.downed.kind));

  // 23.16 Phase 4: no orbit around the well — wall-following drops when the
  // only blocker is the target's own unwalkable cell.
  const tor = mk('TOrbit23', 0, 0);
  const well23 = VILLAGE_OBJECTS.find(o => o.kind === 'well');
  tor.x = well23.x - 75; tor.y = well23.y; tor._wf = null; tor.stuckT = 0;
  // Simulate the stuck state: wall-following activated by the well's own
  // exclusion zone while orbiting at ~75px.
  tor._wf = { active: true, hx: tor.x, hy: tor.y, hitDist: 90, side: 1, t: 5 };
  let orbArrived = false;
  for(let i = 0; i < 12 && !orbArrived; i++){
    const r = planMoveToward(tor, well23.x, well23.y, 1);
    if(r === true) orbArrived = true;
    else if(r === 'stuck') break;
  }
  tor._wf = null;
  log(orbArrived, 'move23: villager escapes well orbit and arrives within 12 steps',
    orbArrived ? 'arrived' : 'still orbiting at (' + Math.round(tor.x) + ',' + Math.round(tor.y) + ')');

  // 23.17 Phase 4: lethal triage — exhaustion (9h left) overrides a drink
  // plan (18h left). Fixed order drink>eat>sleep let villagers die of
  // exhaustion while stuck en route to water.
  const ttr = mk('TTriage23', 0, 0);
  const ttb = ensureBody(ttr);
  ttb.fatigue = 1.0; ttb.exhH = 5; ttb.hydration = 0; ttb.dehydH = 2; ttb.satiety = 0.5;
  ttr.downed = null;
  ttr.plan = [{ verb: 'go', place: 'well', guard: true }, { verb: 'drink', guard: true }];
  survivalGuard(ttr);
  const triaged = ttr.plan.length === 1 && ttr.plan[0].verb === 'sleep';
  log(triaged, 'guard23: lethal exhaustion overrides drink plan via time-to-death triage',
    'plan=' + ttr.plan.map(s => s.verb).join(','));

  cleanup();

  // 23.13 no test villagers leak past cleanup
  const leaked = VILLAGERS.filter(o => o && o.name && /T(Forage|Perf)23/.test(o.name));
  log(leaked.length === 0, 'year23: part23 leaves no test villagers behind',
    leaked.length ? leaked.map(o => o.name).join(',') : VILLAGERS.length + ' villagers');
  el.textContent += `part23 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
