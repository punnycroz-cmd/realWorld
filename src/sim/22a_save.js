/* =====================================================================
   PHASE 3A — SAVE / LOAD (localStorage)
   Serialize the ACTUAL simulation state so a reload restores the world
   faithfully: world clock/weather, chunks (terrain is mutated at runtime:
   felled trees, fire burn, paths, fields, buildings), villagers (full body,
   needs, skills, bonds, inventory, plans, pregnancy, wounds, memories,
   epistemic stores, thoughts), identified-item registry + id counters,
   transfer log, tree ids, piles/fires/crops/chickens, wildlife, caravan,
   shop/inn stock, households, event log, pressure systems, and the RNG
   stream state (RNGS.s) so a reloaded world continues bit-identically.

   Design notes:
   - No functions are serialized (sim state holds none — verified by probe;
     saveClone drops any function defensively and guards against cycles).
   - Typed arrays (chunk fields) are packed as {__ta, d} and revived exactly.
   - Const-bound registries are restored IN PLACE (length=0 + push / key clear
     + assign) so every existing reference to the array/object stays valid.
   - SaveStore abstracts the backend: localStorage in the browser, injectable
     in-memory backend for the node harness (which has no localStorage).
   - SAVE_VERSION: the loader rejects anything else with a clear reason,
     never a crash.
   ===================================================================== */
const SAVE_VERSION = 1;
const SAVE_PREFIX = 'willowbrook_natura_save_';

/* ---- Storage backend abstraction ---- */
var SaveStore = {
  _backend: null,
  _mem: {},
  setBackend(b){ this._backend = b || null; },
  _ls(){
    if(this._backend) return this._backend;
    try{
      if(typeof localStorage !== 'undefined'){
        localStorage.setItem('__wn_probe', '1');
        localStorage.removeItem('__wn_probe');
        return localStorage;
      }
    }catch(e){ /* storage unavailable (private mode, file:// restrictions) */ }
    return null;
  },
  write(slot, str){
    const b = this._ls();
    if(b){ try{ b.setItem(SAVE_PREFIX + slot, str); return true; }catch(e){ return false; } }
    try{ this._mem[SAVE_PREFIX + slot] = str; return true; }catch(e){ return false; }
  },
  read(slot){
    const b = this._ls();
    if(b){ try{ return b.getItem(SAVE_PREFIX + slot); }catch(e){ return null; } }
    const v = this._mem[SAVE_PREFIX + slot];
    return (v === undefined) ? null : v;
  },
  has(slot){
    const b = this._ls();
    if(b){ try{ return b.getItem(SAVE_PREFIX + slot) != null; }catch(e){ return false; } }
    return (SAVE_PREFIX + slot) in this._mem;
  }
};

/* ---- Typed-array-aware deep clone (save direction) ---- */
const __TA_CTOR = { f32: Float32Array, u8: Uint8Array, u16: Uint16Array, i32: Int32Array, c8: Uint8ClampedArray };
function __taTag(a){
  if(a instanceof Float32Array) return 'f32';
  if(a instanceof Uint8ClampedArray) return 'c8';
  if(a instanceof Uint8Array) return 'u8';
  if(a instanceof Uint16Array) return 'u16';
  if(a instanceof Int32Array) return 'i32';
  return null;
}
function saveClone(v, seen){
  if(v === null || v === undefined) return v;
  const t = typeof v;
  if(t === 'number' || t === 'string' || t === 'boolean') return v;
  if(t === 'function') return undefined; // never serialize behavior
  if(t !== 'object') return undefined;
  const tag = __taTag(v);
  if(tag) return { __ta: tag, d: Array.from(v) }; // typed arrays hold no refs
  seen = seen || new WeakSet();
  // Ancestor-set semantics: only a TRUE back-reference (an object that
  // contains itself through the current path) is dropped. A merely SHARED
  // reference (e.g. two villagers seen through different branches) is cloned
  // fresh at each occurrence — never nulled.
  if(seen.has(v)) return undefined;
  seen.add(v);
  let out;
  if(Array.isArray(v)){
    out = new Array(v.length);
    for(let i = 0; i < v.length; i++) out[i] = saveClone(v[i], seen);
  }else{
    out = {};
    for(const k of Object.keys(v)){
      const cv = saveClone(v[k], seen);
      if(cv !== undefined) out[k] = cv;
    }
  }
  seen.delete(v);
  return out;
}
function saveRevive(v){
  if(v === null || v === undefined) return v;
  const t = typeof v;
  if(t !== 'object') return v;
  if(Array.isArray(v)) return v.map(saveRevive);
  if(v.__ta && __TA_CTOR[v.__ta] && Array.isArray(v.d)) return new (__TA_CTOR[v.__ta])(v.d);
  const out = {};
  for(const k of Object.keys(v)){
    // SECURITY: never assign "__proto__" via [[Set]] — out[k] = … would invoke
    // the prototype setter instead of creating an own property, silently
    // re-prototyping the revived record (phantom data / per-tick crashes).
    // Validation rejects such payloads outright; this is defense in depth.
    if(k === '__proto__') continue;
    out[k] = saveRevive(v[k]);
  }
  return out;
}

/* ---- Canonical (key-sorted) stringify for hashing & byte-compare ---- */
function stableStringify(v){
  if(v === null || v === undefined) return 'null';
  const t = typeof v;
  if(t === 'number'){
    if(!isFinite(v)) return 'null';
    return JSON.stringify(Math.round(v * 1e6) / 1e6);
  }
  if(t === 'string' || t === 'boolean') return JSON.stringify(v);
  if(t !== 'object') return 'null';
  if(Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
  const keys = Object.keys(v).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
}
function fnv1aHex(str){
  let h = 0x811c9dc5;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ('0000000' + (h >>> 0).toString(16)).slice(-8);
}

/* ---- State collection ---- */
function collectSaveState(){
  // currentAction is transient (recomputed by the utility brain every AI
  // tick from v.plan + needs) and may hold live object references
  // (otherPerson) — it is never part of the durable save.
  const villagers = saveClone(VILLAGERS);
  if(Array.isArray(villagers)) for(const vc of villagers){
    if(vc && typeof vc === 'object') delete vc.currentAction;
  };
  return {
    version: SAVE_VERSION,
    seed: SEED,
    rng: RNGS.s >>> 0,
    W: saveClone(W),
    // Phase 4: chunks are a pure function of (cx, cy, SEED); only mutated
    // (dirty) chunks are serialized — pristine chunks regenerate on demand.
    chunks: (() => { const d = []; for(const [k, ch] of chunks){ if(ch.dirty) d.push([k, saveClone(ch)]); } return d; })(),
    villagers: villagers,
    villageBuildings: saveClone(VILLAGE_BUILDINGS),
    villageObjects: saveClone(VILLAGE_OBJECTS),
    piles: saveClone(PILES),
    fires: saveClone(FIRES),
    crops: saveClone(CROPS),
    chickens: saveClone(CHICKENS),
    burning: saveClone(BURNING),
    wildtrees: saveClone(WILDTREES),
    foodStock: saveClone(FOOD_STOCK),
    events: saveClone(EVENTS),
    eventSeq: EVENT_SEQ,
    animals: saveClone(ANIMALS),
    carcasses: saveClone(CARCASSES),
    fences: saveClone(FENCES),
    coops: saveClone(COOPS),
    animSlowAcc: animSlowAcc,
    items: saveClone(ITEMS),
    itemSeq: ITEM_SEQ,
    transferSeq: TRANSFER_SEQ,
    worldTransferLog: saveClone(WORLD_TRANSFER_LOG),
    transferArchive: saveClone(TRANSFER_ARCHIVE),
    treeSeq: TREE_SEQ,
    felledTrees: saveClone(FELLED_TREES),
    caravan: saveClone(CARAVAN),
    shop: saveClone(SHOP),
    inn: saveClone(INN),
    households: saveClone(HOUSEHOLDS),
    systems: saveClone(systems),
    parityAcc: parityAcc,
    // Phase 7A registries — previously dropped silently by save/load:
    // guild membership map, court records, economy demand state, and
    // capability gaps must survive reload (v.guild alone was saved, which
    // left GUILDS.members empty and killed bonuses/pricing quietly).
    guilds: (typeof GUILDS !== 'undefined') ? saveClone(GUILDS) : {},
    courtRecords: (typeof COURT_RECORDS !== 'undefined') ? saveClone(COURT_RECORDS) : [],
    economy: (typeof Economy !== 'undefined') ? {
      demands: saveClone(Economy.demands),
      demandLog: saveClone(Economy.demandLog),
      trackedWeeklyConsumption: saveClone(Economy.trackedWeeklyConsumption),
      recentTransactions: saveClone(Economy.recentTransactions)
    } : {},
    capabilityGaps: (typeof CAPABILITY_GAPS !== 'undefined') ? saveClone(CAPABILITY_GAPS) : [],
    epistemicSeq: (typeof _nextEpistemicId !== 'undefined') ? _nextEpistemicId : 0,
    gFrame: (typeof G !== 'undefined' && G) ? (G.frame | 0) : 0,
    ui: { controlledPawnIdx: controlledPawnIdx | 0, inspectedPawnIdx: inspectedPawnIdx | 0 }
  };
}

/* ---- State restore (in place; returns {ok, reason}) ---- */
function __restoreArrayInto(arr, data){
  arr.length = 0;
  if(Array.isArray(data)) for(const x of data) arr.push(saveRevive(x));
}
function __restoreObjectInto(obj, data){
  for(const k of Object.keys(obj)) delete obj[k];
  if(data && typeof data === 'object') Object.assign(obj, saveRevive(data));
}
/* ---- Payload shape validation (atomicity: runs BEFORE any mutation) ----
   A version-1 blob with wrong shapes (hand-edited, truncated, or from a
   divergent build) must be rejected cleanly, not half-applied. This checks
   FIELD shapes and, critically, ELEMENT shapes: applySaveState mutates live
   registries as it restores (chunks.clear(), VILLAGERS.length = 0, ...), so a
   field that merely "is an array" is not enough — every entry must be a
   revivable container, otherwise a mid-restore throw would leave the world
   half-restored despite the rejection. */
function __isPlainObject(v){ return v !== null && typeof v === 'object' && !Array.isArray(v); }
/* Deep scan for "__proto__" own-keys. JSON.parse creates them as ordinary own
   properties, but any later out[k] = … assignment would invoke the prototype
   setter instead — silently re-prototyping records (phantom ownership data,
   per-tick crashes). Legitimate saves can never contain such keys (item ids
   are kind_seq, chunk keys are "cx,cy", villager names come from fixed lists),
   so rejection cannot false-positive. */
function __hasProtoKey(v){
  if(v === null || typeof v !== 'object') return false;
  if(Array.isArray(v)){
    for(const x of v) if(__hasProtoKey(x)) return true;
    return false;
  }
  for(const k of Object.keys(v)){
    if(k === '__proto__') return true;
    if(__hasProtoKey(v[k])) return true;
  }
  return false;
}
const __SAVE_ARRAY_FIELDS = [
  'villagers', 'villageBuildings', 'villageObjects', 'piles', 'fires', 'crops',
  'chickens', 'burning', 'wildtrees', 'events', 'animals', 'carcasses',
  'fences', 'coops', 'households', 'systems', 'worldTransferLog'
];
const __SAVE_SHAPE = [
  ['W', 'object'], ['chunks', 'array'], ['villagers', 'array'],
  ['villageBuildings', 'array'], ['villageObjects', 'array'],
  ['piles', 'array'], ['fires', 'array'], ['crops', 'array'],
  ['chickens', 'array'], ['burning', 'array'], ['wildtrees', 'array'],
  ['foodStock', 'object'], ['events', 'array'],
  ['animals', 'array'], ['carcasses', 'array'], ['fences', 'array'], ['coops', 'array'],
  ['items', 'object'], ['worldTransferLog', 'array'], ['felledTrees', 'object'],
  ['caravan', 'object'], ['shop', 'object'], ['inn', 'object'],
  ['households', 'array'], ['systems', 'array']
];
function __checkSaveShape(s){
  if(__hasProtoKey(s)) return 'payload contains forbidden "__proto__" key';
  for(const pair of __SAVE_SHAPE){
    const k = pair[0], kind = pair[1], v = s[k];
    const ok = (kind === 'array') ? Array.isArray(v)
      : (v !== null && typeof v === 'object' && !Array.isArray(v));
    if(!ok) return 'field "' + k + '" has wrong shape';
  }
  for(const k of ['seed', 'rng', 'eventSeq', 'itemSeq', 'transferSeq', 'treeSeq']){
    if(typeof s[k] !== 'number') return 'field "' + k + '" is not a number';
  }
  // W must carry the clock the restore depends on.
  if(!__isPlainObject(s.W) || typeof s.W.day !== 'number' || typeof s.W.tod !== 'number')
    return 'field "W" is missing its clock';
  // Element-level: every entry of every array field must be a plain object.
  // (A null or primitive entry would either throw mid-restore after earlier
  // registries were already cleared, or be accepted and then crash simTick.)
  for(const k of __SAVE_ARRAY_FIELDS){
    const arr = s[k];
    for(let i = 0; i < arr.length; i++){
      if(!__isPlainObject(arr[i])) return 'field "' + k + '" entry ' + i + ' has wrong shape';
    }
  }
  // Object-map fields: every VALUE must have its legitimate shape. A null
  // value here restores without throwing (Object.assign copies it) and then
  // crashes per-tick loops that dereference entries unconditionally — e.g.
  // ownershipCandidates reads it.actualOwner for every id in ITEMS, so a
  // single null item is accepted ok:true and then throws every simTick.
  for(const k of ['items', 'felledTrees']){
    const m = s[k];
    for(const key of Object.keys(m)){
      if(!__isPlainObject(m[key])) return 'field "' + k + '" value "' + key + '" has wrong shape';
    }
  }
  // FOOD_STOCK is kind -> count: numbers are legitimate, null/objects are not.
  for(const key of Object.keys(s.foodStock)){
    if(typeof s.foodStock[key] !== 'number') return 'field "foodStock" value "' + key + '" is not a number';
  }
  // Chunk entries are [key, chunkObject] pairs; the restore destructures them.
  for(let i = 0; i < s.chunks.length; i++){
    const e = s.chunks[i];
    if(!Array.isArray(e) || e.length !== 2 || typeof e[0] !== 'string' || !__isPlainObject(e[1]))
      return 'field "chunks" entry ' + i + ' has wrong shape';
  }
  // Phase 4: transferArchive is optional (absent in older saves); when
  // present it must be an array of plain summary objects.
  if(s.transferArchive !== undefined){
    if(!Array.isArray(s.transferArchive)) return 'field "transferArchive" has wrong shape';
    for(let i = 0; i < s.transferArchive.length; i++){
      if(!__isPlainObject(s.transferArchive[i])) return 'field "transferArchive" entry ' + i + ' has wrong shape';
    }
  }
  // Phase 7A registries are OPTIONAL (absent in pre-7A saves) but when
  // present must have the right shapes — restore mutates the live
  // const-bound registries, so a bad shape must be rejected before that.
  if(s.guilds !== undefined && !__isPlainObject(s.guilds)) return 'field "guilds" has wrong shape';
  if(s.courtRecords !== undefined){
    if(!Array.isArray(s.courtRecords)) return 'field "courtRecords" has wrong shape';
    for(let i = 0; i < s.courtRecords.length; i++){
      if(!__isPlainObject(s.courtRecords[i])) return 'field "courtRecords" entry ' + i + ' has wrong shape';
    }
  }
  if(s.economy !== undefined){
    if(!__isPlainObject(s.economy)) return 'field "economy" has wrong shape';
    if(s.economy.demands !== undefined && !__isPlainObject(s.economy.demands)) return 'field "economy.demands" has wrong shape';
    if(s.economy.trackedWeeklyConsumption !== undefined && !__isPlainObject(s.economy.trackedWeeklyConsumption)) return 'field "economy.trackedWeeklyConsumption" has wrong shape';
    for(const lk of ['demandLog', 'recentTransactions']){
      if(s.economy[lk] !== undefined && !Array.isArray(s.economy[lk])) return 'field "economy.' + lk + '" has wrong shape';
    }
  }
  if(s.capabilityGaps !== undefined){
    if(!Array.isArray(s.capabilityGaps)) return 'field "capabilityGaps" has wrong shape';
    for(let i = 0; i < s.capabilityGaps.length; i++){
      if(typeof s.capabilityGaps[i] !== 'string') return 'field "capabilityGaps" entry ' + i + ' has wrong shape';
    }
  }
  return null;
}
function applySaveState(s){
  if(!s || typeof s !== 'object') return { ok: false, reason: 'empty or corrupt save data' };
  if(s.version !== SAVE_VERSION)
    return { ok: false, reason: 'incompatible save version ' + s.version + ' (this build reads version ' + SAVE_VERSION + ')' };
  const shapeErr = (() => { try{ return __checkSaveShape(s); }catch(e){ return 'validator crashed: ' + e.message; } })();
  if(shapeErr) return { ok: false, reason: 'corrupt save data: ' + shapeErr };
  try{
    SEED = s.seed >>> 0;
    RNGS.s = s.rng >>> 0;

    __restoreObjectInto(W, s.W);

    chunks.clear();
    if(Array.isArray(s.chunks)) for(const [k, ch] of s.chunks){
      const rc = saveRevive(ch);
      // Anything restored from a save was dirty by definition (old full
      // saves: possibly dirty; new saves: dirty). Mark so the next save
      // keeps it; pristine chunks regenerate deterministically on demand.
      if(rc && typeof rc === 'object') rc.dirty = true;
      chunks.set(k, rc);
    }

    __restoreArrayInto(VILLAGERS, s.villagers);
    // NOTE: _ci (pixel-art character index) is boot-assigned and positional;
    // it is preserved exactly as saved, NOT recomputed, so post-boot
    // villagers (newborns, test spawns) keep their live value (undefined).
    __restoreArrayInto(VILLAGE_BUILDINGS, s.villageBuildings);
    __restoreArrayInto(VILLAGE_OBJECTS, s.villageObjects);
    __restoreArrayInto(PILES, s.piles);
    __restoreArrayInto(FIRES, s.fires);
    __restoreArrayInto(CROPS, s.crops);
    __restoreArrayInto(CHICKENS, s.chickens);
    __restoreArrayInto(BURNING, s.burning);
    WILDTREES = saveRevive(s.wildtrees) || [];
    __restoreObjectInto(FOOD_STOCK, s.foodStock);
    __restoreArrayInto(EVENTS, s.events);
    EVENT_SEQ = s.eventSeq | 0;
    __restoreArrayInto(ANIMALS, s.animals);
    __restoreArrayInto(CARCASSES, s.carcasses);
    __restoreArrayInto(FENCES, s.fences);
    __restoreArrayInto(COOPS, s.coops);
    animSlowAcc = +s.animSlowAcc || 0;

    __restoreObjectInto(ITEMS, s.items);
    ITEM_SEQ = s.itemSeq | 0;
    TRANSFER_SEQ = s.transferSeq | 0;
    __restoreArrayInto(WORLD_TRANSFER_LOG, s.worldTransferLog);
    __restoreArrayInto(TRANSFER_ARCHIVE, s.transferArchive);
    TREE_SEQ = s.treeSeq | 0;
    __restoreObjectInto(FELLED_TREES, s.felledTrees);

    __restoreObjectInto(CARAVAN, s.caravan);
    __restoreObjectInto(SHOP, s.shop);
    __restoreObjectInto(INN, s.inn);
    __restoreArrayInto(HOUSEHOLDS, s.households);
    __restoreArrayInto(systems, s.systems);
    parityAcc = +s.parityAcc || 0;
    // Phase 7A registries — optional fields; absent (older saves) leaves the
    // live registries as they are, present restores them IN PLACE so the
    // const bindings and every module reference stay valid.
    if(s.guilds && typeof GUILDS !== 'undefined') __restoreObjectInto(GUILDS, s.guilds);
    if(Array.isArray(s.courtRecords) && typeof COURT_RECORDS !== 'undefined') __restoreArrayInto(COURT_RECORDS, s.courtRecords);
    if(s.economy && typeof Economy !== 'undefined'){
      if(s.economy.demands) __restoreObjectInto(Economy.demands, s.economy.demands);
      if(Array.isArray(s.economy.demandLog)) __restoreArrayInto(Economy.demandLog, s.economy.demandLog);
      if(s.economy.trackedWeeklyConsumption) __restoreObjectInto(Economy.trackedWeeklyConsumption, s.economy.trackedWeeklyConsumption);
      if(Array.isArray(s.economy.recentTransactions)) __restoreArrayInto(Economy.recentTransactions, s.economy.recentTransactions);
    }
    if(Array.isArray(s.capabilityGaps) && typeof CAPABILITY_GAPS !== 'undefined') __restoreArrayInto(CAPABILITY_GAPS, s.capabilityGaps);
    if(typeof _nextEpistemicId !== 'undefined' && s.epistemicSeq != null) _nextEpistemicId = s.epistemicSeq | 0;

    if(typeof G !== 'undefined' && G){
      G.villagers = VILLAGERS;
      G.frame = s.gFrame | 0;
    }
    const n = VILLAGERS.length;
    controlledPawnIdx = n ? clamp(s.ui ? (s.ui.controlledPawnIdx | 0) : 0, 0, n - 1) : 0;
    inspectedPawnIdx = n ? clamp(s.ui ? (s.ui.inspectedPawnIdx | 0) : 0, 0, n - 1) : 0;
    if(typeof G !== 'undefined' && G) G.inspectedVillager = VILLAGERS[inspectedPawnIdx] || null;

    return { ok: true };
  }catch(e){
    return { ok: false, reason: 'restore failed: ' + e.message };
  }
}

/* ---- Public API ---- */
function saveGame(slot, opt){
  slot = slot || 'manual';
  const state = collectSaveState();
  state.savedAt = Date.now(); // wall-clock display metadata only; excluded from hashes
  let blob;
  try{ blob = JSON.stringify(state); }
  catch(e){ return { ok: false, reason: 'serialize failed: ' + e.message }; }
  const kept = SaveStore.write(slot, blob);
  if(!kept) return { ok: false, reason: 'no writable storage backend' };
  if(!(opt && opt.silent) && typeof showToast === 'function')
    showToast('💾 Saved — Day ' + W.day + ' (' + (blob.length / 1024).toFixed(0) + ' KB)');
  return { ok: true, bytes: blob.length, blob: blob };
}
function loadGame(slot){
  slot = slot || 'manual';
  const blob = SaveStore.read(slot);
  if(blob == null) return { ok: false, reason: 'no save in slot "' + slot + '"' };
  let state;
  try{ state = JSON.parse(blob); }
  catch(e){ return { ok: false, reason: 'save data is not valid JSON' }; }
  const r = applySaveState(state);
  if(!r.ok) return r;
  if(typeof updateHUD === 'function'){ try{ updateHUD(); }catch(e){} }
  if(typeof showToast === 'function') showToast('📂 Loaded — Day ' + W.day + ', ' + W.season);
  return { ok: true };
}

/* ---- Deterministic world hash (for round-trip tests & debugging) ----
   Hashes the full canonical save state minus wall-clock metadata. Two runs
   that reach the same sim state produce the same hash, bit for bit. */
function worldHash(){
  const s = collectSaveState();
  return fnv1aHex(stableStringify(s));
}

/* ---- Autosave: once per in-game day, via the simTick wrap chain ---- */
const __st22save = simTick;
let __lastAutosaveDay = -1;
simTick = function(dtH){
  const r = __st22save(dtH);
  try{
    const d = Math.floor(W.day);
    if(d !== __lastAutosaveDay){
      __lastAutosaveDay = d;
      saveGame('autosave', { silent: true });
    }
  }catch(e){ /* autosave must never break the tick */ }
  return r;
};

/* ---- Bridge: save/load for the future AI brain & debug tooling ---- */
window.__aiBridge.saveGame = function(slot){ return saveGame(slot || 'manual'); };
window.__aiBridge.loadGame = function(slot){ return loadGame(slot || 'manual'); };
window.__aiBridge.worldHash = function(){ return worldHash(); };
window.__aiBridge.hasSave = function(slot){ return SaveStore.has(slot || 'manual'); };

/* ---- Browser UI wiring (save/load buttons live in the top bar) ---- */
(function wireSaveUI(){
  try{
    if(typeof document === 'undefined' || !document.getElementById) return;
    const bs = document.getElementById('btn-save');
    if(bs && !bs.__wnWired){ bs.__wnWired = true; bs.onclick = () => { const r = saveGame('manual'); if(!r.ok) showToast('⚠️ Save failed: ' + r.reason); }; }
    const bl = document.getElementById('btn-load');
    if(bl && !bl.__wnWired){ bl.__wnWired = true; bl.onclick = () => { const r = loadGame('manual'); if(!r.ok) showToast('⚠️ Load failed: ' + r.reason); }; }
  }catch(e){}
})();
