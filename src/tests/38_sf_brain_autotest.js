/* =====================================================================
   v16 — THE BECOMING BRAIN: contract + dispatch + interiority suite.
   Runs only under SF_MODE (?sf&test). Wraps runAutoTest like every test
   module — appends `brain:` lines and a `==== BRAIN x/y ====` summary.

   What's asserted:
   - spawn: all 8 mains driven + isNPC + sfGap, NO sfSched; ambients
     keep their thin schedules; no possessed pawn at boot
   - contract: unknown verb / missing why / say-leave-reflect gates /
     request params / directive exclusions all named at filing
   - ladder: order → directive → visible gap; mains never wander
   - interiority: mood/concerns/do/intent/endSay/insights ride a filing
   - conversation channel: invite → floor pass → obligations → caps →
     leave/drop/no_answer, per-party POV records
   - intents: arm, event-cue fire, time-cue fire, sleep alarm-only
   - dispatch: trigger queue, tiers, spacing + hourly caps, heartbeat,
     sleep refile-once, stale re-dispatch
   - save/load: possession of a main cannot be resurrected
   ===================================================================== */
const __runAutoTest38 = runAutoTest;
runAutoTest = async function(){
  let baseErr = null;
  try { await __runAutoTest38(); } catch(e){ baseErr = e; }
  const out = document.getElementById('autotest');
  if(out) out.style.display = 'block';
  const res = [];
  function log(ok, name, detail){
    res.push({ ok, name });
    const line = (ok ? 'PASS: ' : 'FAIL: ') + name + (detail ? ' — ' + detail : '');
    try { console.log(line); } catch(e){}
    if(out) out.textContent += line + '\n';
  }
  if(baseErr) log(false, 'brain: inner autotest threw',
    String(baseErr && baseErr.message || baseErr));

  if(!(typeof SF_MODE !== 'undefined' && SF_MODE) ||
     typeof sfAgentAct !== 'function' || typeof sfBrainTick !== 'function'){
    const passed = res.filter(r => r.ok).length;
    if(out) out.textContent += '\n==== BRAIN ' + passed + '/' + res.length +
      ' passed ====\n';
    return;
  }

  const pv0 = VILLAGERS.find(v => v._castId === 'C2');   // Jules
  const pt0 = VILLAGERS.find(v => v._castId === 'C6');   // Carmen
  const cid = 'C2', tid = 'C6';
  const keepTod = W.tod, keepRain = W.rain, keepStorm = W.storm;
  /* snapshot every mutable field the suite touches — both pawns and the
     dispatch/convok registries */
  const snap = new Map();
  const snapV = v => snap.set(v, {
    x: v.x, y: v.y, inB: v.inBuilding, ins: v.inside, st: v.state,
    ag: v.sfAgent, drv: v.sfAgentDriven, dir: v.sfDirective,
    gap: v.sfGap, res: v.sfAgentResult, rfx: v.sfReflex,
    seq: v._agentSeq, ds: v._dirStreak, dg: v._dirSig,
    convo: v.sfConvo, lastConvo: v.sfLastConvo, intents: v.sfIntents,
    obs: v.sfObligations, mood: v.sfMood, concerns: v.sfConcerns,
    why: v.sfLastWhy, disp: v.sfDisp, mind: v.sfMind,
    fat: v.body ? v.body.fatigue : null, npc: v.isNPC,
    bonds: v.bonds ? Object.assign({}, v.bonds) : v.bonds,
    memN: v.epistemic && v.epistemic.memories
      ? v.epistemic.memories.length : 0,
    sayT: v.sayText, sayU: v.sayUntil });
  const resetV = v => {
    v.sfAgent = null; v.sfDirective = null; v.sfGap = false;
    v.sfAgentResult = null; v.sfReflex = null; v.sfConvo = null;
    v.sfDisp = null; v.sfPath = null; v.moving = false;
    v.sfAgentDriven = true;
  };
  try{
    /* ---------- spawn contract (Phase 1) ---------- */
    const mains = VILLAGERS.filter(v => /^C[1-8]$/.test(v._castId || ''));
    const ambients = VILLAGERS.filter(v => !/^C[1-8]$/.test(v._castId || ''));
    log(mains.length === 8 && mains.every(v =>
        v.sfAgentDriven === true && v.isNPC === true &&
        !v.sfSched && v.sfGap === true),
        'brain: all 8 mains spawn driven, unpossessable, schedule-free, in the gap');
    log(ambients.length === 20 && ambients.every(v =>
        Array.isArray(v.sfSched) && v.sfSched.length > 0 &&
        v.sfAgentDriven !== true),
        'brain: the 20 ambients keep thin schedules — furniture stays lit');
    log(controlledPawnIdx === -1,
        'brain: no pawn is player-controlled at boot');
    log(mains.every(v => sfIsMain(v)) && ambients.every(v => !sfIsMain(v)),
        'brain: sfIsMain splits the cast cleanly');

    /* ---------- filing contract ---------- */
    const pv = pv0, pt = pt0;
    snapV(pv); snapV(pt);
    resetV(pv); resetV(pt);
    W.tod = 14; W.rain = 0; W.storm = 0;

    const rej = [
      sfAgentAct(cid, { verb: 'fly', why: 'x' }),
      sfAgentAct(cid, { verb: 'idle' }),
      sfAgentAct(cid, { verb: 'say', text: 'hi', why: 'x' }),
      sfAgentAct(cid, { verb: 'leave', why: 'x' }),
      sfAgentAct(cid, { verb: 'reflect', why: 'x' }),
      sfAgentAct(cid, { verb: 'request', why: 'x' }),
      sfAgentAct(cid, { verb: 'request', kind: 'weather', why: 'x' }),
      sfAgentAct(cid, { verb: 'move', why: 'x' }) ];
    log(rej.every(r => r.ok === false && r.err),
        'brain: bad verb, why-less, convo-less, reflect-less, ' +
        'param-less, to-less filings all name their error',
        rej.map(r => r.err).filter(Boolean)[0]);

    const okIdle = sfAgentAct(cid, { verb: 'idle', holdH: 0.5,
                                     why: 'watching the street' });
    log(okIdle.ok === true && pv.sfAgent && pv.sfAgent.verb === 'idle' &&
        pv.sfAgent.why === 'watching the street',
        'brain: a well-formed filing parks the order with its why');

    /* ---------- the ladder: order → directive → gap ---------- */
    pv.sfAgent = null; pv.sfDirective = null; pv.sfGap = false;
    const px = pv.x, pyv = pv.y;
    sfNpcTick(pv, 0.016);
    log(pv.sfGap === true && pv.state === 'idle' &&
        pv.x === px && pv.y === pyv,
        'brain: a will-less main stands in the gap — never wanders');

    /* ---------- interiority fields ride a filing ---------- */
    const inr = sfAgentAct(cid, { verb: 'idle', holdH: 0.5,
      why: 'needed a minute', mood: 'wired and tired',
      concerns: ['rent friday', 'carmen\'s cough'],
      do: 'rubs her temples',
      insights: ['i keep dodging the landlord talk'],
      endSay: 'i said too much at the door' });
    log(inr.ok === true && pv.sfMood && pv.sfMood.text === 'wired and tired' &&
        pv.sfConcerns[0] === 'rent friday' && pv.doText === 'rubs her temples' &&
        pv.sfLastWhy === 'needed a minute',
        'brain: mood/concerns/do/why land on the pawn');
    const memKinds = (pv.epistemic.memories || []).slice(-3).map(m => m.kind);
    log(memKinds.indexOf('reflection') >= 0 && memKinds.indexOf('convo') >= 0,
        'brain: insights + endSay write real POV memory records',
        memKinds.join(','));

    /* ---------- intent arming + firing ---------- */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS * 40; pt.y = pv.y;    // carmen NOT in view yet
    pt.inBuilding = false; pv.inBuilding = false;
    pv.inside = null; pt.inside = null;
    const armR = sfAgentAct(cid, { verb: 'idle', holdH: 0.25, why: 'wait',
      intent: { deed: 'ask carmen about the notice',
                condition: 'when carmen is around', who: 'C6',
                cueType: 'event' } });
    log(armR.ok === true && pv.sfIntents.length === 1 &&
        armR.intentArmed,
        'brain: act.intent arms an implementation intention');
    /* not yet perceived → not fired */
    sfIntentScan(pv, false);
    log(pv.sfIntents[0].firedAt == null,
        'brain: an event intent stays armed while its cue is absent');
    /* bring carmen into view → fires */
    pt.x = pv.x + CS; pt.y = pv.y; pt.inBuilding = false;
    pv.inBuilding = false; pv.inside = null; pt.inside = null;
    const fired = sfIntentScan(pv, false);
    log(fired.length === 1 && pv.sfIntents[0].firedAt != null &&
        sfDispOf(pv).pending.some(p => p.kind === 'intent_fired'),
        'brain: perceiving the cue-who fires the intent + dispatches T1');
    const mindNow = sfMindScan(pv);
    log(mindNow.surface.some(s => s.kind === 'fired_intention' &&
        /carmen/i.test(s.deed)),
        'brain: the fired intention surfaces on mind.surface');

    /* time-cued intent = alarm; event intents do NOT fire in sleep */
    pv.sfIntents = [];
    pv.state = 'sleep';
    sfIntentArm(pv, { deed: 'meet jules', condition: 'when jules is near',
                      who: 'C1', cueType: 'event' });
    sfIntentArm(pv, { deed: 'wake for the shift', condition: 'alarm',
                      cueType: 'time', when: (W.tod + 0.2) });
    sfIntentScan(pv, true);   // the asleep path scans time-only
    log(pv.sfIntents[0].firedAt == null,
        'brain: event intents stay parked while asleep');
    W.tod += 0.3;
    sfIntentScan(pv, true);
    log(pv.sfIntents[1].firedAt != null,
        'brain: a cueType:time intent fires in sleep — the alarm');
    pv.state = 'idle'; pv.sfIntents = [];

    /* ---------- conversation channel ---------- */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS; pt.y = pv.y;   // perceived, adjacent
    const t0 = sfAgentAct(cid, { verb: 'talk', to: tid,
      text: 'carmen — did the notice say friday?',
      why: 'the rent notice', holdH: 0.5 });
    log(t0.ok === true && pv.sfAgent && pv.sfAgent.verb === 'talk',
        'brain: a perceived talk files and seeks');
    sfNpcTick(pv, 0.016);
    log(pv.sfConvo && pv.sfConvo.state === 'participating' &&
        pt.sfConvo && pt.sfConvo.state === 'invited' &&
        pt.sfConvo.yourTurn === true &&
        pv.sayText === 'carmen — did the notice say friday?',
        'brain: contact opens the channel — invitee holds the floor');
    /* '?' opened an obligation on carmen */
    const cv1 = SF_CONVOS[pv.sfConvo.id];
    log(cv1.obligations.length === 1 && cv1.obligations[0].to === tid,
        'brain: a question opens an obligation on the listener');
    /* invitee answers → both participating, floor passes back */
    const s1 = sfAgentAct(tid, { verb: 'say', text: 'friday, yeah',
                                 why: 'answering jules' });
    log(s1.ok === true && pt.sfConvo.state === 'participating' &&
        pv.sfConvo.yourTurn === true &&
        cv1.utt === 2,
        'brain: the reply accepts the convo and passes the floor');
    /* her reply settled the obligation — it did not, she asked nothing;
       jules's question obligation on carmen is satisfied by her speech */
    log(cv1.obligations.every(o => o.satisfied || o.to !== tid),
        'brain: answering speech settles the obligation');
    /* the inviter's lingering talk order ends at lingerH, convo lives on */
    log(pv.sfAgent && pv.sfAgent.phase === 'linger',
        'brain: contact parks the talk order in linger — convo outlives it');

    /* leave is asymmetric and always available */
    sfAgentAct(tid, { verb: 'leave', why: 'soup\'s boiling over' });
    log(pt.sfConvo === null && pv.sfConvo === null &&
        pt.sfLastConvo && pt.sfLastConvo.endedHow === 'left' &&
        pv.sfLastConvo && pv.sfLastConvo.with === tid,
        'brain: leave ends the channel for both, lastConvo recorded');

    /* invitation expiry → no_answer interrupts the inviter's order */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS; pt.y = pv.y;
    sfAgentAct(cid, { verb: 'talk', to: tid, text: 'got a sec?',
                      why: 'checking in', holdH: 1 });
    sfNpcTick(pv, 0.016);
    const cvId2 = pv.sfConvo.id;
    W.tod += 0.6;                 // past the 0.5h invite TTL
    sfConvoTick(pt, 0.016);
    log(pt.sfConvo === null && pv.sfConvo === null &&
        pv.sfAgentResult && pv.sfAgentResult.status === 'interrupted' &&
        pv.sfAgentResult.interruptedBy === 'no_answer',
        'brain: an unanswered invite drops — the inviter reads no_answer');
    log(!!SF_CONVOS[cvId2] === false,
        'brain: dropped convos are torn down');

    /* proximity gates participation — partner walking off drops it */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS; pt.y = pv.y;
    sfAgentAct(cid, { verb: 'talk', to: tid, text: 'walk with me',
                      why: 'company', holdH: 1 });
    sfNpcTick(pv, 0.016);
    sfAgentAct(tid, { verb: 'say', text: 'sure', why: 'why not' });
    pt.x = pv.x + CS * 30;        // carmen leaves the field
    for(let i = 0; i < 12 && pv.sfConvo; i++) sfConvoTick(pv, 0.016);
    log(pv.sfConvo === null && pv.sfLastConvo &&
        pv.sfLastConvo.endedHow === 'dropped',
        'brain: a partner out of proximity drops the channel');

    /* utterance cap ends a live convo */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS; pt.y = pv.y;
    sfAgentAct(cid, { verb: 'talk', to: tid, text: 'one more thing',
                      why: 'lingering', holdH: 1 });
    sfNpcTick(pv, 0.016);
    sfAgentAct(tid, { verb: 'say', text: 'go on', why: 'listening' });
    const cv3 = SF_CONVOS[pt.sfConvo.id];
    cv3.utt = SF_CONVO_MAX_UTT - 1;
    sfAgentAct(cid, { verb: 'say', text: 'nevermind', why: 'drops it' });
    log(cv3.endedHow === 'cap' && pt.sfConvo === null &&
        pv.sfConvo === null,
        'brain: the utterance cap ends a convo cleanly');

    /* ---------- dispatch engine ---------- */
    resetV(pv); resetV(pt);
    pv.sfGap = true;   // the ladder's honest empty state
    /* gap trigger fires at first scan; heartbeat rides after spacing */
    sfDispatchTick(pv, 0.016);
    let d = sfDispOf(pv);
    log(d.pending.some(p => p.kind === 'gap'),
        'brain: the intention gap dispatches a brain call');
    /* served filing clears the queue and starts the ledger */
    sfAgentAct(cid, { verb: 'idle', holdH: 0.25, why: 'settling' });
    log(d.lastCallAt != null && d.pending.length === 0 &&
        d.callsAt.length === 1,
        'brain: a filing is the call — served, queued, ledgered');
    /* spacing: a fresh trigger inside 0.25h reports blocked, not lost */
    sfDispatchTrig(pv, 'gap', 'T0');
    let poll = sfDispatchPoll();
    log(poll.per[cid].due === null && poll.per[cid].blocked === 'spacing',
        'brain: sub-0.25h re-dispatch is capped, the trigger survives');
    W.tod += 0.3;
    poll = sfDispatchPoll();
    log(poll.per[cid].due && poll.per[cid].due.kind === 'gap' &&
        poll.per[cid].due.tier === 'T0',
        'brain: the trigger re-surfaces after spacing — quiet gap → T0');
    /* hourly hard cap — a fresh trigger behind a full ledger */
    d.callsAt = new Array(10).fill(sfAbsNow());
    sfDispatchTrig(pv, 'heartbeat', 'T0');
    poll = sfDispatchPoll();
    log(poll.per[cid].blocked === 'cap' && poll.per[cid].due === null,
        'brain: 10 calls/sim-h is a hard stop');
    d.callsAt = [];
    /* order_end: a failed order dispatches a T1 re-decide — carmen
       beyond perception with no `at` fails honestly at tick */
    resetV(pv); d = sfDispOf(pv);
    pt.x = pv.x + CS * 60; pt.y = pv.y; pt.inBuilding = false;
    sfAgentAct(cid, { verb: 'talk', to: tid, why: 'looking',
                      text: 'carmen?', holdH: 0.25 });
    sfNpcTick(pv, 0.016);
    log(pv.sfAgentResult && pv.sfAgentResult.status === 'failed',
        'brain: an unlocatable talk fails honestly at tick');
    sfDispatchTick(pv, 0.016);
    sfDispatchTick(pv, 0.016);
    log(d.pending.some(p => p.kind === 'order_end' && p.tier === 'T1'),
        'brain: a failed order dispatches an order_end T1');
    /* heartbeat after ~3.5 waking sim-h */
    resetV(pv); d = sfDispOf(pv); d.lastCallAt = sfAbsNow() - 3.6;
    sfDispatchTick(pv, 0.016);
    log(d.pending.some(p => p.kind === 'heartbeat'),
        'brain: the heartbeat floor fires ~1 pulse per 3.5 waking h');
    /* directive nearing expiry → T0 refile trigger */
    resetV(pv); d = sfDispOf(pv);
    sfAgentAct(cid, { verb: 'idle', holdH: 0.25, why: 'x' },
      { directive: { verb: 'work', untilH: 0.5, why: 'the shift' } });
    W.tod += 0.3;   // inside the 0.25h lookahead of the 0.5h will
    sfDispatchTick(pv, 0.016);
    log(d.pending.some(p => p.kind === 'directive_expiry' &&
                            p.tier === 'T0'),
        'brain: a lapsing will dispatches a cheap T0 refile');
    /* sleep: exactly one mid-sleep T0 refile per night */
    resetV(pv); d = sfDispOf(pv);
    pv.state = 'sleep';
    sfDispatchTick(pv, 0.016);                    // sleepStart marks
    W.tod += 2.2;
    sfDispatchTick(pv, 0.016);
    const nRef = d.pending.filter(p => p.kind === 'sleep_refile').length;
    W.tod += 2;
    sfDispatchTick(pv, 0.016);
    log(nRef === 1 &&
        d.pending.filter(p => p.kind === 'sleep_refile').length === 1,
        'brain: exactly one mid-sleep refile per night — never two');
    pv.state = 'idle';
    /* env transition is a trigger class, never a behavior */
    resetV(pv); d = sfDispOf(pv); d.envSig = 0;
    W.rain = 0.5;
    sfDispatchTick(pv, 0.016);
    log(d.pending.some(p => p.kind === 'env' && p.tier === 'T1' &&
                            p.detail.rain > 0),
        'brain: weather onset dispatches env — the brain decides');
    W.rain = 0;

    /* ---------- mind surface ---------- */
    resetV(pv); resetV(pt);
    pt.x = pv.x + CS; pt.y = pv.y;
    pv.bonds = pv.bonds || {}; pv.bonds[pt.name] = 0.7;
    pv.sfObligations = [{ from: tid, gist: 'did you sign the lease?',
                          at: sfAbsNow(), satisfied: false }];
    const m1 = sfMindScan(pv);
    log(m1.people[tid] && m1.people[tid].stance === 'close' &&
        m1.people[tid].open === 'did you sign the lease?' &&
        m1.surface.some(s => s.kind === 'urge'),
        'brain: mind.people models stance + open loops; urges surface');
    const st1 = sfAgentState(cid, {});
    log(st1.mind && st1.convo === null && st1.gap !== undefined &&
        st1.directive !== undefined && !st1.routine,
        'brain: state carries mind/convo/gap/directive — no routine field');

    /* ---------- save/load: possession cannot be resurrected ---------- */
    const sv = collectSaveState();
    const jIdx = VILLAGERS.findIndex(v => v._castId === 'C2');
    sv.ui = sv.ui || {}; sv.ui.controlledPawnIdx = jIdx;
    if(sv.villagers[jIdx]) sv.villagers[jIdx].isNPC = false;
    const ap = applySaveState(sv);
    const pvR = VILLAGERS.find(v => v._castId === 'C2');
    log(ap.ok === true && controlledPawnIdx === -1 &&
        pvR.isNPC === true && pvR.sfAgentDriven === true,
        'brain: save/load cannot resurrect possession of a main');

  }catch(e){
    log(false, 'brain: suite threw', String(e && e.message || e));
  }finally{
    W.tod = keepTod; W.rain = keepRain; W.storm = keepStorm;
    for(const [v, s] of snap){
      v.x = s.x; v.y = s.y; v.inBuilding = s.inB; v.inside = s.ins;
      v.state = s.st; v.sfAgent = s.ag; v.sfAgentDriven = s.drv;
      v.sfDirective = s.dir; v.sfGap = s.gap; v.sfAgentResult = s.res;
      v.sfReflex = s.rfx; v._agentSeq = s.seq; v._dirStreak = s.ds;
      v._dirSig = s.dg; v.sfConvo = s.convo; v.sfLastConvo = s.lastConvo;
      v.sfIntents = s.intents; v.sfObligations = s.obs;
      v.sfMood = s.mood; v.sfConcerns = s.concerns; v.sfLastWhy = s.why;
      v.sfDisp = s.disp; v.sfMind = s.mind; v.isNPC = s.npc;
      if(s.bonds) v.bonds = Object.assign({}, s.bonds);
      if(v.epistemic && v.epistemic.memories)
        v.epistemic.memories.length = s.memN;
      v.sayText = s.sayT; v.sayUntil = s.sayU;
      if(v.body && s.fat != null) v.body.fatigue = s.fat;
      v.sfPath = null; v.moving = false;
    }
    /* tear down any convo records the suite left */
    for(const k of Object.keys(SF_CONVOS)) delete SF_CONVOS[k];
  }

  const passed = res.filter(r => r.ok).length;
  if(out) out.textContent += '\n==== BRAIN ' + passed + '/' + res.length +
    ' passed ====\n';
};
