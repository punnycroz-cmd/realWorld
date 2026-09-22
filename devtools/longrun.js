'use strict';
/* =====================================================================
   Phase 4 long-run harness for Willowbrook Natura.
   Boots the built page headless WITHOUT the autotest (?test not set),
   then advances the sim in 1-hour steps (never simTick(24)).
   Usage: node devtools/longrun.js <smoke|d30|y1|y5|pop20|pop50|all>
   ===================================================================== */
const fs = require('fs');
const { spawnSync } = require('child_process');

const SCENARIOS = {
  smoke: { days: 2,   extraPop: 0 },
  d30:   { days: 30,  extraPop: 0 },
  y1:    { days: 120, extraPop: 0 },
  y5:    { days: 600, extraPop: 0 },
  pop20: { days: 30,  extraPop: 9 },
  pop50: { days: 30,  extraPop: 39 },
};
const ALL_ORDER = ['d30', 'y1', 'pop20', 'pop50', 'y5'];

function buildStubs() {
  function makeCtx() {
    const grad = { addColorStop(){} };
    return new Proxy({}, {
      get(t, k) {
        if (k === 'canvas') return { width: 64, height: 64 };
        if (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern') return () => grad;
        if (k === 'getImageData') return (x,y,w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
        if (k === 'createImageData') return (w,h) => ({ data: new Uint8ClampedArray((w||1)*(h||1)*4), width: w||1, height: h||1 });
        if (k === 'measureText') return () => ({ width: 10 });
        return t[k] !== undefined ? t[k] : (() => {});
      },
      set(t, k, v) { t[k] = v; return true; }
    });
  }
  function makeCanvas() {
    return { width: 300, height: 150, style: {}, getContext: () => makeCtx(),
             addEventListener(){}, getBoundingClientRect: () => ({left:0,top:0}) };
  }
  const elements = {};
  function makeEl(id) {
    return { id, style: {}, textContent: '', innerHTML: '', title: '',
             addEventListener(){}, appendChild(){}, classList: { add(){}, remove(){} },
             getContext: () => makeCtx(), width: 300, height: 150 };
  }
  global.window = {
    addEventListener(){}, removeEventListener(){},
    __aiBridge: undefined,
    innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1,
  };
  global.document = {
    getElementById(id) { return elements[id] || (elements[id] = makeEl(id)); },
    createElement(tag) { return tag === 'canvas' ? makeCanvas() : makeEl(tag); },
    title: '', addEventListener(){}, body: makeEl('body'),
  };
  global.location = { search: '' };  // no ?test -> boot() skips the autotest
  global.requestAnimationFrame = () => 0;
  try { global.navigator = { userAgent: 'node' }; } catch (e) {}
}

/* The driver runs INSIDE the eval scope (same scope as the page's top-level
   consts), wrapped in an IIFE so its own vars never collide with page names. */
function driverJS(cfg) {
  return `;(function(){
  var cfg = ${JSON.stringify(cfg)};
  var out = { name: cfg.name, log: [], fail: [], metrics: {}, error: null };
  function say(s){ out.log.push(String(s)); }
  var FOOD_KEYS = ['fish','rawMeat','egg','berries','bread','crop','cookedFish','cookedMeat',
    'mealPoor','mealFine','mealLavish','smokedMeat','smokedFish','saltedMeat'];
  function foodTotal(){
    var t = 0, i, j, k, v;
    for (i = 0; i < VILLAGERS.length; i++){
      v = VILLAGERS[i]; if (v.dead) continue;
      for (j = 0; j < FOOD_KEYS.length; j++){ k = FOOD_KEYS[j]; t += (v.inv[k] || 0); }
    }
    for (j = 0; j < FOOD_KEYS.length; j++){
      k = FOOD_KEYS[j];
      if (typeof INN !== 'undefined' && INN.stock) t += (INN.stock[k] || 0);
      if (typeof SHOP !== 'undefined' && SHOP.stock) t += (SHOP.stock[k] || 0);
    }
    if (typeof FOOD_STOCK !== 'undefined'){ t += (FOOD_STOCK.inn || 0) + (FOOD_STOCK.shop || 0); }
    return Math.round(t * 10) / 10;
  }
  try {
    boot();
    var i, v;
    for (i = 0; i < (cfg.extraPop || 0); i++) mkTestV22('LRPop' + i, 2 + (i % 10), 4 + ((i / 10) | 0));
    var popStart = VILLAGERS.length;
    say('booted pop=' + popStart + ' day=' + W.day + ' season=' + W.season + ' year=' + W.year);
    // Deaths are recorded by wrapping killVillager: burial can remove a
    // villager from VILLAGERS the same day, so daily polling alone can miss.
    var deaths = [];
    var __kv = killVillager;
    killVillager = function(v, cause){
      if (v && !v.dead) deaths.push({ name: v.name, cause: cause || '?', day: W.day });
      return __kv.apply(null, arguments);
    };
    var births = [], knownNames = {};
    for (i = 0; i < VILLAGERS.length; i++) knownNames[VILLAGERS[i].name] = 1;
    var days = cfg.days, d, h;
    var totalMs = 0, maxMsDay = 0;
    var seasonsSeen = [], yearsSeen = [];
    var foodSeries = [foodTotal()];
    var saveSizes = [];
    var rtChecks = [];   // year-boundary save/load round-trip hash checks
    var maxCouples = 0, maxDisputes = 0, maxTransferLog = 0, maxArchive = 0;
    var hashStart = (typeof worldHash === 'function') ? worldHash() : null;
    for (d = 0; d < days; d++){
      var t0 = Date.now();
      for (h = 0; h < 24; h++) simTick(1);
      var ms = Date.now() - t0; totalMs += ms; if (ms > maxMsDay) maxMsDay = ms;
      for (i = 0; i < VILLAGERS.length; i++){
        v = VILLAGERS[i];
        if (!isFinite(v.x) || !isFinite(v.y)) out.fail.push('NaN position: ' + v.name + ' day ' + W.day);
        if (!v.dead && !knownNames[v.name]){ knownNames[v.name] = 1; births.push({ name: v.name, day: W.day }); }
      }
      var couples = 0;
      for (i = 0; i < VILLAGERS.length; i++) if (!VILLAGERS[i].dead && VILLAGERS[i].spouseId) couples++;
      if (couples > maxCouples) maxCouples = couples;
      var dp = 0, id;
      for (id in ITEMS){ if (ITEMS[id].dispute && ITEMS[id].dispute.status === 'open') dp++; }
      if (dp > maxDisputes) maxDisputes = dp;
      if (WORLD_TRANSFER_LOG.length > maxTransferLog) maxTransferLog = WORLD_TRANSFER_LOG.length;
      var archLen = (typeof TRANSFER_ARCHIVE !== 'undefined') ? TRANSFER_ARCHIVE.reduce(function(a,b){return a+b.count;},0) : 0;
      if (archLen > maxArchive) maxArchive = archLen;
      var yr = (typeof W.year !== 'undefined') ? W.year : 1;
      if (seasonsSeen.length === 0 || seasonsSeen[seasonsSeen.length - 1] !== W.season + ' Y' + yr)
        seasonsSeen.push(W.season + ' Y' + yr);
      if (yearsSeen.length === 0 || yearsSeen[yearsSeen.length - 1] !== yr) yearsSeen.push(yr);
      foodSeries.push(foodTotal());
      var isYearEnd = (W.day % 120 === 0);
      if ((d + 1) % 30 === 0 || d === days - 1 || isYearEnd){
        var tS = Date.now();
        var sv = (typeof saveGame === 'function') ? saveGame('lrprobe', { silent: true }) : null;
        var svMs = Date.now() - tS;
        saveSizes.push({ day: W.day, bytes: (sv && sv.ok) ? sv.bytes : -1, ms: svMs });
      }
      // Year-boundary save/load round-trip: serialize, restore into the live
      // world, and confirm the world hash is unchanged.
      if (isYearEnd && typeof collectSaveState === 'function' && typeof applySaveState === 'function'){
        var hh1 = (typeof worldHash === 'function') ? worldHash() : null;
        var blob = JSON.stringify(collectSaveState());
        var rr = applySaveState(JSON.parse(blob));
        var hh2 = (typeof worldHash === 'function') ? worldHash() : null;
        rtChecks.push({ day: W.day, ok: !!(rr && rr.ok), hashMatch: hh1 === hh2,
                        bytes: blob.length, reason: (rr && rr.reason) || null });
        if (!rr || !rr.ok) out.fail.push('save/load round-trip FAILED at day ' + W.day + ': ' + ((rr && rr.reason) || '?'));
        else if (hh1 !== hh2) out.fail.push('save/load round-trip DIVERGED at day ' + W.day);
      }
    }
    // debug overlays must stay off during headless runs (zero-cost contract)
    var overlaysOff = true;
    if (typeof DEBUG_OVERLAYS !== 'undefined'){
      for (var ok in DEBUG_OVERLAYS) if (DEBUG_OVERLAYS[ok]) overlaysOff = false;
    }
    if (!overlaysOff) out.fail.push('debug overlays were ON during headless run');
    // final belief/memory stats over living villagers
    var memTot = 0, belTot = 0, ownTot = 0, alive = 0, memMax = 0;
    for (i = 0; i < VILLAGERS.length; i++){
      v = VILLAGERS[i]; if (v.dead) continue; alive++;
      var ep = v.epistemic || { memories: [], beliefs: {}, ownership: {} };
      var ml = (ep.memories || []).length, bl = Object.keys(ep.beliefs || {}).length, ol = Object.keys(ep.ownership || {}).length;
      memTot += ml; belTot += bl; ownTot += ol; if (ml > memMax) memMax = ml;
    }
    // lineage still queryable?
    var lineageOk = true, identCount = 0, lid = null;
    for (var iid in ITEMS){ identCount++; if (lid === null) lid = iid; }
    if (lid && typeof getLineage === 'function'){
      try { var ch = getLineage(lid); lineageOk = Array.isArray(ch) && ch.length >= 1; }
      catch (e){ lineageOk = false; }
    }
    out.metrics = {
      days: days, popStart: popStart, popEnd: alive,
      deaths: deaths, births: births.length,
      marriages: maxCouples / 2, maxOpenDisputes: maxDisputes,
      transferLogLen: WORLD_TRANSFER_LOG.length, maxTransferLog: maxTransferLog,
      transferArchived: maxArchive,
      graves: (typeof GRAVES !== 'undefined') ? GRAVES.length : -1,
      identifiedItems: identCount, lineageOk: lineageOk,
      seasons: seasonsSeen, years: yearsSeen, dayEnd: W.day,
      yearEnd: (typeof W.year !== 'undefined') ? W.year : null,
      foodStart: foodSeries[0], foodEnd: foodSeries[foodSeries.length - 1],
      foodMin: Math.min.apply(null, foodSeries), foodMax: Math.max.apply(null, foodSeries),
      foodSeries: foodSeries, saveSizes: saveSizes, roundTrips: rtChecks,
      overlaysOff: overlaysOff,
      msTotal: totalMs, msPerDay: Math.round((totalMs / days) * 10) / 10,
      msMaxDay: maxMsDay,
      avgMemories: alive ? Math.round((memTot / alive) * 10) / 10 : 0,
      maxMemories: memMax,
      avgBeliefs: alive ? Math.round((belTot / alive) * 10) / 10 : 0,
      avgOwnershipBeliefs: alive ? Math.round((ownTot / alive) * 10) / 10 : 0,
      hashStart: hashStart,
      hashEnd: (typeof worldHash === 'function') ? worldHash() : null
    };
    say('done pop_end=' + alive + ' deaths=' + deaths.length + ' births=' + births.length +
        ' day=' + W.day + ' season=' + W.season + ' year=' + W.year);
  } catch (e){
    out.error = (e && e.message) + '\\\\n' + ((e && e.stack) || '').split('\\\\n').slice(0, 8).join('\\\\n');
  }
  globalThis.__lrResult = JSON.stringify(out);
})();`;
}

function runScenario(name) {
  const cfg = Object.assign({ name }, SCENARIOS[name]);
  buildStubs();
  global.__lrConfig = cfg;
  const html = fs.readFileSync('/home/hatch/workspace/world-sim/willowbrook_natura_test.html', 'utf-8');
  const m = html.match(/<script>([\s\S]*)<\/script>/);
  if (!m) { console.error('NO SCRIPT BLOCK'); process.exit(2); }
  try {
    eval(m[1] + driverJS(cfg));
  } catch (e) {
    console.error('EVAL FAILED:', e.message);
    process.exit(2);
  }
  const out = JSON.parse(global.__lrResult);
  // ---- report ----
  console.log('=== scenario ' + name + ' (' + cfg.days + 'd, +' + cfg.extraPop + ' pop) ===');
  out.log.forEach(l => console.log('  ' + l));
  if (out.error) { console.log('ERROR:\n' + out.error); process.exitCode = 1; return; }
  const M = out.metrics;
  console.log('  perf: ' + M.msPerDay + ' ms/day avg, ' + M.msMaxDay + ' ms max day, ' + M.msTotal + ' ms total');
  console.log('  pop: ' + M.popStart + ' -> ' + M.popEnd + ' alive; births ' + M.births +
              '; deaths ' + M.deaths.length +
              (M.deaths.length ? ' [' + M.deaths.map(d => d.name + ':' + d.cause + '@d' + d.day).join(', ') + ']' : ''));
  console.log('  marriages peak: ' + M.marriages + '; open disputes peak: ' + M.maxOpenDisputes +
              '; transfer log: ' + M.transferLogLen + ' (peak ' + M.maxTransferLog + '); archived: ' + M.transferArchived +
              '; graves: ' + M.graves);
  console.log('  identified items: ' + M.identifiedItems + '; lineage ok: ' + M.lineageOk);
  console.log('  seasons: ' + M.seasons.join(' > ') + ' (end day ' + M.dayEnd + ' year ' + M.yearEnd + ')');
  console.log('  food: start ' + M.foodStart + ' end ' + M.foodEnd + ' min ' + M.foodMin + ' max ' + M.foodMax);
  console.log('  save sizes: ' + M.saveSizes.map(s => 'd' + s.day + ':' + (s.bytes / 1024).toFixed(0) + 'KB/' + s.ms + 'ms').join(' '));
  console.log('  round-trips: ' + M.roundTrips.map(r => 'd' + r.day + ':' + (r.ok ? (r.hashMatch ? 'OK' : 'DIVERGED') : 'FAIL')).join(' '));
  console.log('  beliefs: avg memories ' + M.avgMemories + ' (max ' + M.maxMemories + '), avg beliefs ' +
              M.avgBeliefs + ', avg ownership ' + M.avgOwnershipBeliefs + '; overlays off: ' + M.overlaysOff);
  console.log('  hash: ' + String(M.hashStart || '?').slice(0, 12) + ' -> ' + String(M.hashEnd || '?').slice(0, 12));
  // ---- fail policy ----
  const fails = out.fail.slice();
  const NEEDS = ['starvation', 'dehydration', 'collapse from exhaustion'];
  for (const d of M.deaths) {
    if (d.day > 3 && NEEDS.indexOf(d.cause) >= 0)
      fails.push('NEEDS-DEATH after day 3: ' + d.name + ' died of ' + d.cause + ' on day ' + d.day + ' (balance bug?)');
  }
  if (fails.length) {
    console.log('  FAILURES:');
    fails.forEach(f => console.log('   - ' + f));
    process.exitCode = 1;
  } else {
    console.log('  -> scenario ' + name + ': OK');
  }
  // machine-readable summary for the metrics table
  fs.writeFileSync('/tmp/lr_' + name + '.json', JSON.stringify({ name, metrics: M, fails }, null, 1));
}

const arg = process.argv[2] || 'smoke';
if (arg === 'all') {
  for (const s of ALL_ORDER) {
    const r = spawnSync(process.execPath, [__filename, s], { stdio: 'inherit' });
    if (r.status !== 0) { console.error('scenario ' + s + ' FAILED (exit ' + r.status + ')'); process.exitCode = 1; }
  }
} else if (SCENARIOS[arg]) {
  runScenario(arg);
} else {
  console.error('unknown scenario: ' + arg + ' (smoke|d30|y1|y5|pop20|pop50|all)');
  process.exit(2);
}
