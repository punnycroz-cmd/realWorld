/* =====================================================================
   PART 22 AUTOTEST — Phase 3: Save/Load, Why-Action Inspector, Debug Overlays
   ===================================================================== */
function mkTestV22(name, wx, wy, extra){
  const v = mkTestV21(name, wx, wy, extra);
  return v;
}

const __runAutoTest22 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest22();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const madeNames = [];
  function mk(name, wx, wy){ const v = mkTestV22(name, wx, wy); madeNames.push(name); return v; }
  // Cleanup is NAME-based, not identity-based: loadGame() restores villagers
  // as fresh clones, so stale object references would make indexOf a no-op.
  function cleanup(){
    for(const n of madeNames){
      const i = VILLAGERS.findIndex(o => o && o.name === n);
      if(i >= 0) VILLAGERS.splice(i, 1);
    }
    madeNames.length = 0;
  }
  function tickH(n){ for(let i = 0; i < n; i++) simTick(1); }
  const stripSavedAt = (blob) => blob.replace(/"savedAt":\d+/, '"savedAt":0');

  // 22.1 saveGame produces a non-empty blob
  const sv1 = saveGame('t22a');
  log(sv1.ok && sv1.bytes > 1000, 'save22: saveGame produces a non-empty blob',
    sv1.ok ? (sv1.bytes / 1024).toFixed(1) + ' KB' : sv1.reason);

  // 22.2 worldHash is stable when nothing ticks
  const hStable1 = worldHash(), hStable2 = worldHash();
  log(hStable1 === hStable2 && hStable1.length === 8, 'save22: worldHash is stable without ticks', hStable1);

  // 22.3 RNG stream state is captured by the save
  const rngBefore = RNGS.s >>> 0;
  saveGame('t22rng');
  const rngDrawn = [srand(), srand(), srand()]; // advance the stream (test-only)
  const ldRng = loadGame('t22rng');
  const rngOk = ldRng.ok && (RNGS.s >>> 0) === rngBefore;
  log(rngOk, 'save22: RNG state restored exactly by load', 's=' + (RNGS.s >>> 0));

  // 22.4 ROUND-TRIP DETERMINISM: save -> tick M -> hashA; load -> tick M -> hashB; A===B
  const tA = mk('TSaveA', 40, 30), tB = mk('TSaveB', 41, 30);
  tickH(12);
  const svRt = saveGame('t22rt');
  const hashAtSave = worldHash();
  tickH(12);
  const hashA = worldHash();
  const ldRt = loadGame('t22rt');
  const hashAfterLoad = worldHash();
  tickH(12);
  const hashB = worldHash();
  const rtOk = svRt.ok && ldRt.ok && hashAfterLoad === hashAtSave && hashA === hashB;
  log(rtOk, 'save22: save->load->continue is bit-identical to uninterrupted run',
    'save=' + hashAtSave + ' A=' + hashA + ' B=' + hashB);

  // 22.5 re-save is byte-identical (minus wall-clock metadata)
  const b1 = stripSavedAt(saveGame('t22re').blob);
  loadGame('t22re');
  const b2 = stripSavedAt(saveGame('t22re').blob);
  log(b1 === b2, 'save22: save -> load -> save is byte-identical', (b1.length / 1024).toFixed(1) + ' KB');

  // 22.6 version rejection: bad version fails cleanly, world untouched
  const hPreBad = worldHash();
  const goodBlob = SaveStore.read('t22re');
  const badState = JSON.parse(goodBlob); badState.version = 999;
  SaveStore.write('t22badver', JSON.stringify(badState));
  const ldBad = loadGame('t22badver');
  const badOk = !ldBad.ok && /incompatible save version 999/.test(ldBad.reason || '') && worldHash() === hPreBad;
  log(badOk, 'save22: incompatible version rejected cleanly, world untouched', ldBad.reason || '');

  // 22.7 identified-item id counters survive (no re-minted furniture_1)
  const seqBefore = ITEM_SEQ;
  const it1 = mintIdentifiedItem('furniture', { creator: tA.name, holder: tA.name, x: tA.x, y: tA.y });
  saveGame('t22id');
  loadGame('t22id');
  const seqOk = ITEM_SEQ === seqBefore + 1 && !!ITEMS[it1.id];
  const it2 = mintIdentifiedItem('furniture', { creator: tA.name, holder: tA.name, x: tA.x, y: tA.y });
  const noCollide = it2.id !== it1.id && !!ITEMS[it1.id] && !!ITEMS[it2.id];
  log(seqOk && noCollide, 'save22: item id counters survive; no id reuse after load', it1.id + ' / ' + it2.id);

  // 22.8 dispute/claim state survives the round trip
  const cA = mk('TSaveC', 42, 30), cB = mk('TSaveD', 42.5, 30);
  const dit = mintIdentifiedItem('plank', { creator: cA.name, holder: cA.name, x: cA.x, y: cA.y });
  raiseItemClaim(cA, dit.id, { text: 'mine, I made it' });
  raiseItemClaim(cB, dit.id, { text: 'no, mine' });
  const dispOpen = !!(ITEMS[dit.id].dispute && ITEMS[dit.id].dispute.status === 'open');
  saveGame('t22disp');
  loadGame('t22disp');
  const dAfter = ITEMS[dit.id] && ITEMS[dit.id].dispute;
  const dispOk = dispOpen && dAfter && dAfter.status === 'open' &&
    dAfter.claimants.indexOf('TSaveC') >= 0 && dAfter.claimants.indexOf('TSaveD') >= 0;
  log(dispOk, 'save22: open dispute with both claimants survives save/load',
    dAfter ? dAfter.claimants.join(',') : 'no dispute');

  // 22.9 why-action: a real utility decision records a trace
  const wv = mk('TSaveW', 43, 30);
  wv.brainControlled = false; // autonomous: the utility brain actually decides
  wv.traits = ['brave']; // exercise the personality-weight path in the trace
  ensurePersonality(wv);
  wv.body.satiety = 0.05; // starving: the trace should show *why* food wins
  evaluateAndApplyUtilityAction(wv);
  const tr = wv.__lastDecision;
  const whyOk = !!tr && !!tr.winner && Array.isArray(tr.top) && tr.top.length > 0 && tr.nCandidates > 0;
  log(whyOk, 'why22: utility decision records a trace with winner + candidates',
    tr && tr.winner ? tr.winner.name + ' (' + tr.winner.score + ')' : 'no trace');

  // 22.10 trace carries real score components (need deficits, personality, distance)
  const inp = tr && tr.inputs;
  const compOk = !!inp && typeof inp.satietyDeficit === 'number' && inp.satietyDeficit > 0.5 &&
    typeof inp.hydrationDeficit === 'number' &&
    ['brave', 'cautious', 'industrious', 'lazy'].every(k => inp[k] === null || typeof inp[k] === 'number') &&
    inp.brave === 1.5 && // the 'brave' trait we gave it shows up in the trace
    tr.top.length > 0 &&
    tr.top.every(c => c.score === 'ruled-out' || typeof c.score === 'number');
  log(compOk, 'why22: trace carries need/personality/distance score components',
    inp ? 'satietyDeficit=' + inp.satietyDeficit : 'no inputs');

  // 22.11 explainAction: structured, belief-scoped, never leaks actualOwner
  const ex = window.__aiBridge.explainAction('TSaveW');
  const exJson = JSON.stringify(ex);
  const exOk = !!ex && ex.name === 'TSaveW' && Array.isArray(ex.plan) && !!ex.decision &&
    Array.isArray(ex.beliefsActedOn) && exJson.indexOf('actualOwner') === -1;
  log(exOk, 'why22: explainAction returns structured belief-scoped data, no truth leak',
    ex && ex.decision && ex.decision.winner ? 'winner=' + ex.decision.winner.name : 'no decision');

  // 22.12 overlays: all-off draws nothing
  const callsBefore = __dbgDrawCalls;
  drawDebugOverlays();
  log(__dbgDrawCalls === callsBefore, 'dbg22: overlays do nothing when all toggled off',
    'draw calls=' + __dbgDrawCalls);

  // 22.13 overlays: toggling needs draws without error, then off again
  let ovErr = null;
  try{
    DEBUG_OVERLAYS.needs = true;
    drawDebugOverlays();
    DEBUG_OVERLAYS.needs = false;
  }catch(e){ ovErr = e.message; }
  const ovOk = !ovErr && __dbgDrawCalls > callsBefore;
  log(ovOk, 'dbg22: needs overlay toggles on, draws, toggles off cleanly',
    ovErr || ('draw calls=' + __dbgDrawCalls));

  // 22.14 autosave writes on day rollover
  __lastAutosaveDay = -999;
  const dayBefore = W.day;
  simTick(0.1);
  const asOk = SaveStore.has('autosave');
  log(asOk, 'save22: autosave fires via the simTick hook', 'day=' + dayBefore + '->' + W.day);

  // 22.15 feed overlay works as a standalone toggle (regression: it was dead
  // unless another overlay was also on)
  let feedOk = false;
  try{
    for(const k of Object.keys(DEBUG_OVERLAYS)) DEBUG_OVERLAYS[k] = false;
    DEBUG_OVERLAYS.feed = true;
    drawDebugOverlays();
    const feedEl = document.getElementById('debug-feed');
    const shown = feedEl && feedEl.style.display === 'block';
    DEBUG_OVERLAYS.feed = false;
    drawDebugOverlays();
    const hidden = feedEl && feedEl.style.display === 'none';
    feedOk = shown && hidden;
  }catch(e){ feedOk = false; }
  log(feedOk, 'dbg22: event feed toggles standalone (shows alone, hides on off)');

  // 22.16 shape-corrupt payload rejected atomically (regression: villagers:42
  // used to return ok:true while zeroing VILLAGERS)
  const hPreShape = worldHash(), nPreShape = VILLAGERS.length;
  const shapeState = JSON.parse(SaveStore.read('t22re'));
  shapeState.villagers = 42;
  SaveStore.write('t22shape', JSON.stringify(shapeState));
  const ldShape = loadGame('t22shape');
  const shapeOk = !ldShape.ok && /wrong shape/.test(ldShape.reason || '') &&
    worldHash() === hPreShape && VILLAGERS.length === nPreShape;
  log(shapeOk, 'save22: shape-corrupt payload rejected atomically, world untouched', ldShape.reason || '');

  // 22.18 element-level atomicity (regression: chunks:[42] used to clear the
  // live chunk map before the restore threw, corrupting the world)
  const hPreChunk = worldHash(), nChunksPre = chunks.size;
  const chunkState = JSON.parse(SaveStore.read('t22re'));
  chunkState.chunks = [42];
  SaveStore.write('t22chunk', JSON.stringify(chunkState));
  const ldChunk = loadGame('t22chunk');
  const chunkOk = !ldChunk.ok && /chunks/.test(ldChunk.reason || '') &&
    worldHash() === hPreChunk && chunks.size === nChunksPre;
  log(chunkOk, 'save22: chunks:[42] rejected with chunk map intact', ldChunk.reason || '');

  // 22.19 villagers:[null] rejected (regression: it was accepted ok:true and
  // then every simTick threw on the null roster entry)
  const hPreNull = worldHash();
  const nullState = JSON.parse(SaveStore.read('t22re'));
  nullState.villagers = [null];
  SaveStore.write('t22null', JSON.stringify(nullState));
  const ldNull = loadGame('t22null');
  let tickOk = false;
  if(!ldNull.ok && worldHash() === hPreNull){
    try{ simTick(0.1); tickOk = true; }catch(e){ tickOk = false; }
  }
  log(!ldNull.ok && tickOk, 'save22: villagers:[null] rejected, world ticks normally after',
    ldNull.reason || '');

  // 22.20 items-map null value rejected (regression: items:{evil_null:null}
  // loaded ok:true, then every simTick threw reading it.actualOwner)
  const hPreEvil = worldHash();
  const evilState = JSON.parse(SaveStore.read('t22re'));
  evilState.items['evil_null'] = null;
  SaveStore.write('t22evil', JSON.stringify(evilState));
  const ldEvil = loadGame('t22evil');
  let evilTickOk = false;
  if(!ldEvil.ok && worldHash() === hPreEvil){
    try{ simTick(0.1); evilTickOk = true; }catch(e){ evilTickOk = false; }
  }
  log(!ldEvil.ok && /items/.test(ldEvil.reason || '') && evilTickOk,
    'save22: items map null value rejected, world ticks normally after',
    ldEvil.reason || '');

  // 22.21 __proto__ key smuggling rejected (regression: items:{"i9":
  // {"__proto__":{...}}} loaded ok:true — saveRevive invoked the prototype
  // setter, yielding an empty-shell record that threw every simTick)
  const hPreProto = worldHash();
  const protoState = JSON.parse(SaveStore.read('t22re'));
  protoState.items['i9'] = JSON.parse('{"__proto__":{"actualOwner":"GHOST"}}');
  SaveStore.write('t22proto', JSON.stringify(protoState));
  const ldProto = loadGame('t22proto');
  let protoTickOk = false;
  if(!ldProto.ok && worldHash() === hPreProto){
    try{ simTick(0.1); protoTickOk = true; }catch(e){ protoTickOk = false; }
  }
  const protoOk = !ldProto.ok && /__proto__/.test(ldProto.reason || '') && protoTickOk;
  // array-element variant: villagers:[{"__proto__":{...}}]
  const protoState2 = JSON.parse(SaveStore.read('t22re'));
  protoState2.villagers = [JSON.parse('{"__proto__":{"dead":false,"name":"GHOSTV"}}')];
  SaveStore.write('t22proto2', JSON.stringify(protoState2));
  const hPreProto2 = worldHash();
  const ldProto2 = loadGame('t22proto2');
  const protoOk2 = !ldProto2.ok && worldHash() === hPreProto2;
  log(protoOk && protoOk2, 'save22: __proto__ smuggling rejected (items + villagers), world untouched',
    ldProto.reason || '');

  // 22.22 Phase-7A registries survive save/load (regression: GUILDS,
  // COURT_RECORDS, Economy demand state and CAPABILITY_GAPS were silently
  // dropped — villagers kept v.guild but the member map was gone, so the
  // 1.6x apprenticeship bonus and demand-driven caravan pricing died on
  // reload). Save -> scramble live state -> load -> verify restored.
  let regOk = false, regDesc = '';
  try{
    const gm = mk('TSaveGuild', 44, 30);
    joinGuild(gm, 'farmer', 'apprentice', 'Marta');
    Economy.recordDemand('bread', 3);
    saveGame('t22reg');
    // scramble the live registries
    leaveGuild('TSaveGuild', 'farmer');
    Economy.resetDemand('bread');
    const ld = loadGame('t22reg');
    const memAfter = isGuildMember('TSaveGuild', 'farmer');
    const gv = findPersonSafe('TSaveGuild');
    const bonusAfter = gv ? getGuildApprenticeshipBonus(gv, 'farming') : -1;
    const demAfter = Economy.getDemand('bread');
    const gapsOk = Array.isArray(CAPABILITY_GAPS);
    regOk = ld.ok && memAfter && bonusAfter === 1.6 && demAfter === 3 && gapsOk;
    regDesc = 'member=' + memAfter + ' bonus=' + bonusAfter + ' demand=' + demAfter;
  }catch(e){ regDesc = 'ERR: ' + e.message; }
  try{ leaveGuild('TSaveGuild', 'farmer'); }catch(e){}
  log(regOk, 'save22: guild membership + apprenticeship bonus + economy demand survive save/load', regDesc);

  cleanup();

  // 22.17 no test villagers leak past cleanup (regression: loadGame replaces
  // object identities, so identity-based removal silently missed them)
  const leaked = VILLAGERS.filter(o => o && o.name && o.name.indexOf('TSave') === 0);
  log(leaked.length === 0, 'save22: part22 leaves no test villagers behind',
    leaked.length ? leaked.map(o => o.name).join(',') : VILLAGERS.length + ' villagers');
  el.textContent += `part22 done ==== ${res.filter(r => r.ok).length}/${res.length} passed ====\n`;
};
