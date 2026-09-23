/* SF scenario autotest — appends SF assertions to the in-page ?test suite.
   Runs only when SF_MODE (?sf&test). Wraps runAutoTest (permitted hook point:
   the no-new-wraps law only covers planTick/simTick/bodyTick/updateVillagerAI). */
const _sfBaseAutoTest = runAutoTest;
runAutoTest = async function(){
  if(!SF_MODE) return _sfBaseAutoTest();
  const el = document.getElementById('autotest');
  el.style.display = 'block';
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok, title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  await new Promise(r => setTimeout(r, 400));

  log(VILLAGERS.length === 28, 'sf: 28 cast members spawned', VILLAGERS.length + ' pawns');
  log(SF_GRID && SF_GRID.length === SF_M.gw * SF_M.gh, 'sf: OSM grid decoded',
      SF_M.gw + 'x' + SF_M.gh);
  log(SF_POIS.length >= 150, 'sf: named POIs registered', SF_POIS.length + ' pois');
  log(SF_DOORS.size > 1000, 'sf: building entrances computed', SF_DOORS.size + ' doors');
  log(!!sfFindPOI('Haus Coffee'), 'sf: Haus Coffee anchor resolves');
  log(!!sfFindPOI('Taqueria El Farolito'), 'sf: El Farolito resolves');
  log(!!sfFindPOI('Auerbach Hardware'), 'sf: Auerbach Hardware resolves');

  // tile-based collision: building blocks, sidewalk allows
  const g744 = SF_MAP.anchors.g744;
  if(g744){
    const b = SF_BLD[g744.bld];
    const inCell = { wx: Math.floor(b.x / CS), wy: Math.floor(b.y / CS) };
    const bc = canMoveTo(inCell.wx * CS + 16, inCell.wy * CS + 16, VILLAGERS[0]);
    log(!bc.ok && bc.reason === 'building_wall', 'sf: building interiors block movement');
  }
  const door = SF_DOOR_OF.get(g744 ? g744.bld : -1);
  log(!!door && canMoveTo(door.wx * CS + 16, door.wy * CS + 16, VILLAGERS[0]).ok,
      'sf: door threshold walkable');

  // pathing between two named POIs on sidewalks
  const a = sfFindPOI('Haus Coffee'), b2 = sfFindPOI('Dolores Park Cafe');
  if(a && b2){
    const da = sfPoiDoor(a), db = sfPoiDoor(b2);
    const path = sfPathfind(da.wx, da.wy, db.wx, db.wy);
    log(!!path && path.length > 10, 'sf: path Haus Coffee -> Dolores Park Cafe',
        path ? path.length + ' waypoints' : 'NO PATH');
    if(path){
      const onStreet = path.filter(([x, y]) => sfTile(x, y) === 10).length;
      log(onStreet / path.length < 0.7, 'sf: path prefers sidewalks/paths over roadway',
          Math.round(onStreet / path.length * 100) + '% on street');
    }
  }

  // door-teleport into Haus Coffee
  const mars = VILLAGERS.find(v => v._castId === 'C1');
  if(mars){
    sfEnterPOI(mars, 'Haus Coffee');
    log(mars.inBuilding === true && mars.inside === 'Haus Coffee',
        'sf: villager can enter Haus Coffee (door-teleport interior)');
    sfExitPOI(mars);
    log(mars.inBuilding === false, 'sf: villager can exit again');
  }

  // all 22 animation states reachable in-world
  const STATES = ['idle','walk','run','wade','swim','drown_panic','work','serve',
    'chat','greet','eat','drink','phone','sleep','sit','bathe','play','argue',
    'fight','stalk','sad','laugh','carry','downed'];
  let okStates = 0;
  const F = PA.chars[0];
  for(const s of STATES){
    const fr = paActFrame(F, 0, { state: s, walkPhase: 0.4 }, G.frame);
    if(fr) okStates++;
  }
  log(okStates === STATES.length, 'sf: all animation states render in-world',
      okStates + '/' + STATES.length);

  const passed = res.filter(r => r.ok).length;
  el.textContent += `\n==== SF ${passed}/${res.length} passed ====\n`;
  document.title = `SFTEST ${passed}/${res.length}`;
};
