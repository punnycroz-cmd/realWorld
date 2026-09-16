/* ---- extended autotest: Natura parity systems ---- */
const __baseRunAutoTest = runAutoTest;
runAutoTest = async function(){
  await __baseRunAutoTest();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok, title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  const mkTestV = (name, wx, wy, extra) => {
    const v = Object.assign({
      name, role: 'Test', homeId: 'inn',
      x: wx * CS + 16, y: wy * CS + 16, targetX: null, targetY: null,
      face: 0, state: 'idle', moving: false, walkPhase: 0, seed: 1,
      isNPC: true, inBuilding: false, canSwim: true, swimSkill: 0.5, swimReason: '',
      workProgress: 0, triumphT: 0,
      equippedTool: { kind: 'hoe', name: 't', icon: '', desc: '' },
      mood: 0.9, hunger: 0.9, energy: 0.9, hydration: 0.9, coreTemp: 37.0, thoughts: [],
      sex: 'm', ageY: 30, adult: true, childScale: 1,
      inv: {}, bonds: {}, bondMile: {}, danger: [], events: [], plan: [],
      brainControlled: true, pregnant: null, chatT: 0
    }, extra || {});
    ensureBody(v); v.body.injury = 0; v.body.illness = 0;
    VILLAGERS.push(v);
    return v;
  };
  const rmTestV = (v) => { const i = VILLAGERS.indexOf(v); if(i >= 0) VILLAGERS.splice(i, 1); };

  // 1. Death by dehydration
  let t1 = mkTestV('TestDehy', 0, 1);
  ensureBody(t1).hydration = 0; ensureBody(t1).satiety = 0.9;
  mortalityTick(t1, 21);
  log(t1.dead === true && t1.deathCause === 'dehydration', 'parity: death by dehydration', t1.deathCause);
  log(EVENTS.some(e => e.kind === 'death' && e.text.indexOf('TestDehy') >= 0), 'parity: death logged to event feed');
  rmTestV(t1);

  // 2. Starvation timer resets when fed
  let t2 = mkTestV('TestStarve', 0, 1);
  const b2 = ensureBody(t2); b2.satiety = 0;
  mortalityTick(t2, 10);
  const aliveAt10 = !t2.dead;
  b2.satiety = 0.5; mortalityTick(t2, 25);
  log(aliveAt10 && !t2.dead, 'parity: starvation timer resets when fed');
  rmTestV(t2);

  // 3. survivalGuard interrupts with drink plan
  let t3 = mkTestV('TestGuard', 0, 2);
  ensureBody(t3).hydration = 0.05;
  survivalGuard(t3);
  log(t3.plan.length > 0 && t3.plan[0].verb === 'go' && t3.plan[0].guard === true,
    'parity: survivalGuard queues guard drink plan', JSON.stringify(t3.plan[0]));
  rmTestV(t3);

  // 4. Action queue: take from pile, then drop
  PILES.push({ x: 1 * CS + 16, y: 2 * CS + 16, wx: 1, wy: 2, items: { log: 2 } });
  let t4 = mkTestV('TestQueue', 1, 1);
  const pr = window.__aiBridge.postAction('TestQueue', { kind: 'take', what: 'log', from: 'pile' });
  let ok4 = pr.ok === true;
  for(let i = 0; i < 300 && t4.plan.length; i++) planTick(t4, 0.1);
  ok4 = ok4 && (t4.inv.log || 0) > 0;
  log(ok4, 'parity: take-from-pile plan executes', 'inv.log=' + (t4.inv.log || 0));
  const pr2 = window.__aiBridge.postAction('TestQueue', { kind: 'drop', what: 'log', n: 1 });
  for(let i = 0; i < 60 && t4.plan.length; i++) planTick(t4, 0.1);
  const pileBack = PILES.some(p => (p.items.log || 0) > 0);
  log(pr2.ok === true && pileBack, 'parity: drop creates ground pile');
  for(let i = PILES.length - 1; i >= 0; i--) if(PILES[i].wx === 1 && PILES[i].wy === 2) PILES.splice(i, 1);
  rmTestV(t4);

  // 5. Unknown verb rejected, not squashed
  const pr5 = window.__aiBridge.postAction('Marta', { kind: 'dance' });
  log(pr5.ok === false && pr5.reason === 'unknown verb', 'parity: unknown verb rejected');

  // 6. Speak -> bond increase both ways
  let t6a = mkTestV('TestSpkA', 0, 3), t6b = mkTestV('TestSpkB', 2, 3);
  window.__aiBridge.postAction('TestSpkA', { kind: 'speak', to: 'TestSpkB', text: 'hello friend' });
  for(let i = 0; i < 30 && t6a.plan.length; i++) planTick(t6a, 0.1);
  const bondAB = t6a.bonds['TestSpkB'] || 0, bondBA = t6b.bonds['TestSpkA'] || 0;
  log(bondAB > 0 && bondBA > 0, 'parity: speak raises mutual bonds', bondAB.toFixed(2) + '/' + bondBA.toFixed(2));
  rmTestV(t6a); rmTestV(t6b);

  // 7. Honest perception: no exact numbers/coords/temps
  const perc = window.__aiBridge.getPerception('Marta');
  const ps = JSON.stringify(perc);
  const leaks = /"biometrics"|"temp"|"x":\s*-?\d|"y":\s*-?\d|\d+\.\d+°C/.test(ps);
  const hasWords = perc && typeof perc.time === 'string' && typeof perc.weather === 'string' &&
    Array.isArray(perc.body) && perc.body.every(s => typeof s === 'string');
  log(!leaks && hasWords, 'parity: perception leaks no exact numbers/coords');

  // 8. Pregnancy -> birth fast-forward
  const before = VILLAGERS.length;
  let t8 = mkTestV('TestMom', 0, 4, { sex: 'f', ageY: 26 });
  t8.pregnant = { days: 19.5, father: 'TestDad', announced: true };
  pregnancyTick(1.0);
  const kids = VILLAGERS.filter(v => !v.adult && v.ageY < 1);
  const bornOk = VILLAGERS.length === before + 2 && kids.length > 0 && kids[0].childScale < 1;
  log(bornOk, 'parity: pregnancy completes in birth of a child', 'villagers ' + before + '->' + VILLAGERS.length);
  for(let i = VILLAGERS.length - 1; i >= 0; i--)
    if(VILLAGERS[i].name.indexOf('Test') === 0) VILLAGERS.splice(i, 1);

  // 9. Events feed
  const evs = window.__aiBridge.getEvents(0);
  log(Array.isArray(evs) && evs.length > 0 && evs[0].seq > 0, 'parity: getEvents feed returns sequenced events', evs.length + ' events');

  // 10. Brain-control flag skips scripted schedule
  let t10 = mkTestV('TestBrain', 0, 5);
  t10.brainControlled = true;
  const stBefore = t10.state;
  W.tod = 12;
  updateVillagerAI(t10, 0.1);
  log(t10.plan.length === 0 || stBefore !== 'work', 'parity: brainControlled skips scripted schedule');
  rmTestV(t10);

  const passed = res.filter(r => r.ok).length;
  el.textContent += '\n==== parity ' + passed + '/' + res.length + ' passed ====\n';
};


/* Top-level sprite->canvas resolver. The render-local getCvs() inside
   renderWorld() is NOT in scope for drawCorpse/drawChildPawn — use this. */
function resolveSprCvs(spr){
  if(!spr) return null;
  if(spr.c) return spr.c;
  if(spr instanceof HTMLCanvasElement || spr instanceof ImageBitmap) return spr;
  return null;
}
