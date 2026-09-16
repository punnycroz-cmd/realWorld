/* =====================================================================
   PART 21 AUTOTEST — Phase 2F: Ownership, provenance & information layers
   ===================================================================== */
function mkTestV21(name, wx, wy, extra){
  const v = mkTestV20(name, wx, wy, extra);
  return v;
}

const __runAutoTest21 = runAutoTest;
runAutoTest = async function(){
  await __runAutoTest21();
  const el = document.getElementById('autotest');
  const res = [];
  const log = (ok, title, desc) => {
    res.push({ ok: ok, title: title });
    el.textContent += (ok ? 'PASS' : 'FAIL') + ' | ' + title + (desc ? ' — ' + desc : '') + '\n';
  };
  function runPlan(v, ticks){ for(let i = 0; i < ticks; i++){ if(!v.plan || !v.plan.length) break; planTick(v, 0.1); } }
  // Move everyone except `keep` far away so witness logic is deterministic.
  const __savedPos = [];
  function isolate(keep){
    __savedPos.length = 0;
    for(const o of VILLAGERS){
      if(keep.indexOf(o) >= 0) continue;
      __savedPos.push({ v: o, x: o.x, y: o.y });
      o.x = 99999; o.y = 99999;
    }
  }
  function unisolate(){
    for(const s of __savedPos){ s.v.x = s.x; s.v.y = s.y; }
    __savedPos.length = 0;
  }
  const made = [];
  function mk(name, wx, wy){ const v = mkTestV21(name, wx, wy); made.push(v); return v; }
  function cleanup(){ for(const v of made) rmTestV13(v); made.length = 0; }

  // 21.1 stable identified object id
  const t1 = mk('TOwn1', 30, 30);
  isolate([t1]);
  const chair1 = mintIdentifiedItem('furniture', { creator: t1.name, quality: 0.8, holder: t1.name, x: t1.x, y: t1.y });
  const idOk = !!chair1.id && chair1.id.indexOf('furniture_') === 0 &&
    chair1.label === 'Furniture #' + chair1.id.split('_')[1] &&
    chair1.creator === 'TOwn1' && chair1.actualOwner === 'TOwn1' && chair1.currentHolder === 'TOwn1' &&
    chair1.quality === 0.8 && chair1.history.length === 1 && chair1.history[0].type === 'create';
  log(idOk, 'own21: identified object gets a stable id, creator, owner, holder and create event', chair1.id);

  // 21.2 lineage: chair -> plank -> tree through real crafting
  const t2 = mk('TOwn2', 31, 30);
  isolate([t2]);
  VILLAGE_OBJECTS.push({ kind: 'bench', x: t2.x + 10, y: t2.y });
  FELLED_TREES['tree_77'] = { felledBy: 'TOwn2', day: W.day, x: 0, y: 0, stage: 0 };
  const logProv = createProvenance('TOwn2', {}, 0.5, 'TOwn2', W.day);
  logProv.treeId = 'tree_77'; // this log came from tree_77
  t2.inv.log = 1;
  attachItemProvenance(t2, 'log', 1, logProv);
  t2.plan = [{ verb: 'recipe', recipe: 'plank' }];
  runPlan(t2, 200);
  const planksOk = (t2.inv.plank || 0) === 2 && heldIdentifiedOf(t2, 'plank').length === 2;
  t2.plan = [{ verb: 'recipe', recipe: 'furniture' }];
  runPlan(t2, 400);
  const chairs2 = heldIdentifiedOf(t2, 'furniture');
  const lineage = chairs2.length ? getLineage(chairs2[0].id) : [];
  const linOk = planksOk && chairs2.length === 1 && (t2.inv.furniture || 0) === 1 &&
    lineage.length === 3 && lineage[0].kind === 'furniture' &&
    lineage[1].kind === 'plank' && lineage[2].kind === 'tree' && lineage[2].id === 'tree_77' &&
    lineage[2].harvestedBy === 'TOwn2' && lineage[0].parentIds.length === 2 &&
    lineage[0].parentIds.indexOf(lineage[1].id) >= 0;
  log(linOk, 'own21: chair->plank->tree lineage queryable through real crafting',
    lineage.map(n => n.label || n.id).join(' -> '));
  for(let i = VILLAGE_OBJECTS.length - 1; i >= 0; i--)
    if(VILLAGE_OBJECTS[i].kind === 'bench' && Math.abs(VILLAGE_OBJECTS[i].x - (t2.x + 10)) < 1) VILLAGE_OBJECTS.splice(i, 1);

  // 21.3 gift changes owner AND holder, logged in both histories
  const g1 = mk('TOwn3a', 32, 30), g2 = mk('TOwn3b', 32.4, 30);
  isolate([g1, g2]);
  const gift = mintIdentifiedItem('plank', { creator: g1.name, holder: g1.name, x: g1.x, y: g1.y });
  const gr = recordTransfer(gift.id, 'gift', { from: g1.name, to: g2.name, by: g1.name, x: g1.x, y: g1.y, context: 'test gift' });
  const giftOk = gr.ok && gift.actualOwner === 'TOwn3b' && gift.currentHolder === 'TOwn3b' &&
    gift.history.length === 2 && gift.history[1].type === 'gift' &&
    WORLD_TRANSFER_LOG.indexOf(gift.history[1]) >= 0 &&
    (g1.inv.plank || 0) === 0 && (g2.inv.plank || 0) === 1;
  log(giftOk, 'own21: gift changes owner and holder, logged on item and world log',
    'owner=' + gift.actualOwner + ' holder=' + gift.currentHolder);

  // 21.4 theft changes holder but NOT owner (victim asleep: unseen)
  const th = mk('TOwn4t', 33, 30), vic = mk('TOwn4v', 33.4, 30);
  isolate([th, vic]);
  const loot = mintIdentifiedItem('furniture', { creator: vic.name, holder: vic.name, x: vic.x, y: vic.y });
  vic.state = 'sleep';
  th.plan = [{ verb: 'steal', itemId: loot.id, from: vic.name }];
  runPlan(th, 300);
  const thBel = getOwnershipBelief(th, loot.id);
  const stealOk = loot.currentHolder === 'TOwn4t' && loot.actualOwner === 'TOwn4v' && loot.stolenFrom === 'TOwn4v' &&
    loot.history.some(e => e.type === 'steal') &&
    thBel && thBel.knownOwner === 'TOwn4v' && thBel.confidence >= 0.9;
  log(stealOk, 'own21: unseen theft moves holder only; owner stays; thief knows the truth',
    'holder=' + loot.currentHolder + ' owner=' + loot.actualOwner);

  // 21.5 victim notices the missing item (failure -> observation -> belief)
  vic.state = 'idle';
  vic.thoughts = [];
  ownershipTick(0.1);
  const vicBel = getOwnershipBelief(vic, loot.id);
  const missOk = vic.thoughts.length > 0 && vic.thoughts[0].text.indexOf('missing') >= 0 &&
    vicBel && vicBel.knownOwner === 'TOwn4v';
  log(missOk, 'own21: victim notices missing item and keeps true ownership belief',
    vic.thoughts.length ? vic.thoughts[0].text : 'no thought');

  // 21.6 caught theft: no transfer, strong beliefs, bond damage, memory
  const th2 = mk('TOwn6t', 34, 30), vic2 = mk('TOwn6v', 34.4, 30), wit = mk('TOwn6w', 34.8, 30);
  isolate([th2, vic2, wit]);
  wit.bonds = { 'TOwn6t': 0.5 }; vic2.bonds = { 'TOwn6t': 0.6 };
  const item2 = mintIdentifiedItem('plank', { creator: vic2.name, holder: vic2.name, x: vic2.x, y: vic2.y });
  th2.plan = [{ verb: 'steal', itemId: item2.id, from: vic2.name }];
  runPlan(th2, 300);
  const witBond = (wit.bonds && wit.bonds['TOwn6t']) || 0;
  const vicBond = (vic2.bonds && vic2.bonds['TOwn6t']) || 0;
  const memOk = th2.epistemic && th2.epistemic.memories.some(m => m.topic === 'theft_' + item2.id);
  const caughtOk = item2.currentHolder === 'TOwn6v' && item2.actualOwner === 'TOwn6v' &&
    !item2.history.some(e => e.type === 'steal') &&
    th2.thoughts[0].text.indexOf('Caught') >= 0 &&
    vic2.thoughts[0].text.indexOf('tried to steal') >= 0 && witBond < 0.5 && vicBond < 0.6 && memOk;
  log(caughtOk, 'own21: caught theft leaves item in place; victim/witness beliefs, memory, bond damage',
    'thought=' + th2.thoughts[0].text + ' witBond=' + witBond.toFixed(2) + ' vicBond=' + vicBond.toFixed(2));

  // 21.7 borrow records expected return; giveback restores
  const br = mk('TOwn7b', 35, 30), ln = mk('TOwn7l', 35.4, 30);
  isolate([br, ln]);
  br.bonds = { 'TOwn7l': 0.5 }; ln.bonds = { 'TOwn7b': 0.5 };
  const tool = mintIdentifiedItem('plank', { creator: ln.name, holder: ln.name, x: ln.x, y: ln.y });
  br.plan = [{ verb: 'borrow', what: 'plank', from: ln.name }];
  runPlan(br, 400);
  const borOk = tool.currentHolder === 'TOwn7b' && tool.actualOwner === 'TOwn7l' &&
    tool.borrowedFrom === 'TOwn7l' && tool.expectedReturnH > simNowH();
  log(borOk, 'own21: borrow moves holder, keeps owner, records expected return',
    'returnH=' + (tool.expectedReturnH != null ? tool.expectedReturnH.toFixed(2) : '?'));
  br.plan = [{ verb: 'giveback', itemId: tool.id }];
  runPlan(br, 400);
  const retOk = tool.currentHolder === 'TOwn7l' && tool.borrowedFrom === null && tool.expectedReturnH === null &&
    (br.inv.plank || 0) === 0 && (ln.inv.plank || 0) === 1;
  log(retOk, 'own21: giveback restores possession to the lender', 'holder=' + tool.currentHolder);

  // 21.8 borrow refused by a stranger: honest failure, no silent taking
  const br2 = mk('TOwn8b', 36, 30), ln2 = mk('TOwn8l', 36.4, 30);
  isolate([br2, ln2]);
  const tool2 = mintIdentifiedItem('plank', { creator: ln2.name, holder: ln2.name, x: ln2.x, y: ln2.y });
  br2.plan = [{ verb: 'borrow', what: 'plank', from: ln2.name }];
  runPlan(br2, 400);
  const refOk = tool2.currentHolder === 'TOwn8l' && tool2.borrowedFrom === null &&
    br2.thoughts[0].text.indexOf('refused') >= 0;
  log(refOk, 'own21: refused borrow is an honest failure with thought, item untouched',
    br2.thoughts[0].text);

  // 21.9 overdue borrowing query + notices
  br.plan = [{ verb: 'borrow', what: 'plank', from: ln.name }];
  runPlan(br, 400);
  tool.expectedReturnH = simNowH() - 0.5;
  const odOk = getOverdueBorrows().some(x => x.id === tool.id);
  log(odOk, 'own21: overdue borrowing query finds the loan', 'overdue=' + getOverdueBorrows().length);
  ln.thoughts = []; br.thoughts = [];
  ownershipTick(0.1);
  const odNoticeOk = ln.thoughts.length > 0 && ln.thoughts[0].text.indexOf('past return time') >= 0 &&
    br.thoughts.length > 0 && br.thoughts[0].text.indexOf('should return') >= 0;
  log(odNoticeOk, 'own21: overdue loan notifies lender and borrower',
    (ln.thoughts[0] ? ln.thoughts[0].text : '?') + ' / ' + (br.thoughts[0] ? br.thoughts[0].text : '?'));

  // 21.10 lose/find retain actual owner
  const lf = mk('TOwn10a', 37, 30), fd = mk('TOwn10b', 37.5, 30);
  isolate([lf, fd]);
  const lost = mintIdentifiedItem('furniture', { creator: lf.name, holder: lf.name, x: lf.x, y: lf.y });
  recordTransfer(lost.id, 'lose', { from: lf.name, x: lf.x + 5, y: lf.y });
  const loseOk = lost.currentHolder === null && lost.actualOwner === 'TOwn10a' && lost.status === 'lost';
  log(loseOk, 'own21: lose clears holder, keeps owner', 'status=' + lost.status);
  fd.x = lf.x + 5; fd.y = lf.y;
  fd.plan = [{ verb: 'take', what: 'furniture', identifiedId: lost.id }];
  runPlan(fd, 200);
  const findOk = lost.currentHolder === 'TOwn10b' && lost.actualOwner === 'TOwn10a' && (fd.inv.furniture || 0) === 1;
  log(findOk, 'own21: find moves holder only — finding is not owning',
    'holder=' + lost.currentHolder + ' owner=' + lost.actualOwner);

  // 21.11 abandon retains actual owner
  const ab = mk('TOwn11', 38, 30);
  isolate([ab]);
  const abItem = mintIdentifiedItem('plank', { creator: ab.name, holder: ab.name, x: ab.x, y: ab.y });
  recordTransfer(abItem.id, 'abandon', { from: ab.name, x: ab.x, y: ab.y });
  const abOk = abItem.status === 'abandoned' && abItem.currentHolder === null && abItem.actualOwner === 'TOwn11';
  log(abOk, 'own21: abandon marks item abandoned, holder null, owner kept', 'status=' + abItem.status);

  // 21.12 claims never alter actual owner; conflicting claims open a dispute
  const cl1 = mk('TOwn12a', 39, 30), cl2 = mk('TOwn12b', 39.4, 30);
  isolate([cl1, cl2]);
  cl2.bonds = { 'TOwn12a': 0.5 };
  const disp = mintIdentifiedItem('furniture', { creator: cl1.name, holder: cl1.name, x: cl1.x, y: cl1.y });
  raiseItemClaim(cl2, disp.id, { text: 'That chair is mine, I swear' });
  const claimOk = disp.actualOwner === 'TOwn12a' && disp.claims.length === 1 && !disp.dispute;
  log(claimOk, 'own21: a claim records but never alters actual owner', 'owner=' + disp.actualOwner);
  raiseItemClaim(cl1, disp.id, { text: 'I made it with my own hands' });
  const dispOk = disp.dispute && disp.dispute.status === 'open' && disp.dispute.claimants.length === 2 &&
    disp.dispute.claimants.indexOf('TOwn12a') >= 0 && disp.dispute.claimants.indexOf('TOwn12b') >= 0;
  log(dispOk, 'own21: two conflicting claims open a dispute', 'claimants=' + (disp.dispute ? disp.dispute.claimants.join(',') : '?'));

  // 21.13 deterministic evidence-weighted resolution + permanent resolution event
  const disp2 = mintIdentifiedItem('furniture', { creator: cl1.name, holder: cl1.name, x: cl1.x, y: cl1.y });
  raiseItemClaim(cl2, disp2.id, { text: 'That chair is mine, I swear' });
  raiseItemClaim(cl1, disp2.id, { text: 'I made it with my own hands' });
  const rr1 = resolveDispute(disp.id, 'Alden');
  const rr2 = resolveDispute(disp2.id, 'Alden');
  const resEvOk = disp.history.some(e => e.type === 'disputeResolved') &&
    WORLD_TRANSFER_LOG.some(e => e.type === 'disputeResolved' && e.itemId === disp.id);
  const loserBond = (cl2.bonds && cl2.bonds['TOwn12a']) || 0; // started 0.5: assert reduction
  const resOk = rr1.ok && rr2.ok && rr1.winner === 'TOwn12a' && rr2.winner === 'TOwn12a' &&
    rr1.winner === rr2.winner && disp.dispute.status === 'resolved' && resEvOk &&
    cl2.thoughts[0].text.indexOf('Lost the dispute') >= 0 && loserBond < 0.5;
  log(resOk, 'own21: dispute resolves deterministically by evidence weight; loser grudge + permanent event',
    'winner=' + rr1.winner + ' scores=' + JSON.stringify(rr1.scores['TOwn12a'].total) + '/' + JSON.stringify(rr1.scores['TOwn12b'].total));

  // 21.14 bulk goods stay count-based (no identity)
  const bk = mk('TOwn13', 40, 30);
  isolate([bk]);
  bk.inv.grain = 5;
  const noGrainId = Object.keys(ITEMS).every(id => ITEMS[id].kind !== 'grain');
  const bulkOk = !IDENTIFIED_KINDS.grain && noGrainId && (bk.inv.grain || 0) === 5;
  log(bulkOk, 'own21: bulk goods remain count-based with no stable identity', 'grain=' + (bk.inv.grain || 0));

  // 21.15 no silent taking of another's held identified item
  const tk = mk('TOwn14a', 41, 30), own = mk('TOwn14b', 41.4, 30);
  isolate([tk, own]);
  const heldChair = mintIdentifiedItem('furniture', { creator: own.name, holder: own.name, x: own.x, y: own.y });
  tk.plan = [{ verb: 'take', what: 'furniture', identifiedId: heldChair.id }];
  runPlan(tk, 100);
  const guardOk = heldChair.currentHolder === 'TOwn14b' &&
    tk.thoughts[0].text.indexOf('not mine to take') >= 0;
  log(guardOk, 'own21: taking another villager\u2019s held item is honestly refused, never silent',
    tk.thoughts[0].text);

  // 21.16 stranger belief lookup does not leak actualOwner
  const stranger = mk('TOwn15s', 42, 30);
  const gA = mk('TOwn15a', 42.4, 30), gB = mk('TOwn15b', 42.8, 30);
  isolate([stranger, gA, gB]);
  const noLeak = getOwnershipBelief(stranger, heldChair.id) === null;
  log(noLeak, 'own21: stranger with no observation has no ownership belief (no leak of actualOwner)', 'belief=null');
  stranger.x = gA.x + 10; stranger.y = gA.y;
  const pubItem = mintIdentifiedItem('plank', { creator: gA.name, holder: gA.name, x: gA.x, y: gA.y });
  recordTransfer(pubItem.id, 'gift', { from: gA.name, to: gB.name, by: gA.name, x: gA.x, y: gA.y, context: 'public gift' });
  const witBel = getOwnershipBelief(stranger, pubItem.id);
  const witOk = witBel && witBel.knownOwner === 'TOwn15b' && witBel.confidence >= 0.8;
  log(witOk, 'own21: a witness of a public gift forms an honest ownership belief',
    witBel ? ('knownOwner=' + witBel.knownOwner + ' conf=' + witBel.confidence) : 'no belief');

  // 21.17 failed claim on a nonexistent item fails honestly
  const badClaim = raiseItemClaim(cl1, 'furniture_999999', { text: 'x' });
  const badOk = !badClaim.ok && badClaim.reason === 'no such item';
  log(badOk, 'own21: claiming a nonexistent item fails honestly', 'reason=' + badClaim.reason);

  // 21.18 a late third claimant joins an OPEN dispute and is scored in resolution
  const d3a = mk('TOwn18a', 43, 30), d3b = mk('TOwn18b', 43.4, 30), d3c = mk('TOwn18c', 43.8, 30);
  isolate([d3a, d3b, d3c]);
  const dItem = mintIdentifiedItem('furniture', { creator: d3a.name, holder: d3a.name, x: d3a.x, y: d3a.y });
  raiseItemClaim(d3b, dItem.id, { text: 'That chair is mine, I swear' });
  raiseItemClaim(d3a, dItem.id, { text: 'I made it with my own hands' });
  const twoOpen = dItem.dispute && dItem.dispute.status === 'open' && dItem.dispute.claimants.length === 2;
  raiseItemClaim(d3c, dItem.id, { text: 'I bought it fair and square' });
  const joinOk = dItem.dispute.status === 'open' && dItem.dispute.claimants.length === 3 &&
    dItem.dispute.claimants.indexOf('TOwn18c') >= 0 &&
    dItem.history.some(e => e.type === 'dispute' && e.context.indexOf('TOwn18c joins') >= 0) &&
    d3c.thoughts.some(t => t.text.indexOf('Joined the dispute') >= 0);
  const rr3 = resolveDispute(dItem.id, 'Alden');
  const scored3 = rr3.ok && rr3.scores['TOwn18a'] && rr3.scores['TOwn18b'] && rr3.scores['TOwn18c'] &&
    Object.keys(rr3.scores).length === 3;
  log(twoOpen && joinOk && scored3, 'own21: third claimant joins an open dispute and is scored in resolution',
    'claimants=' + dItem.dispute.claimants.join(',') + ' scored=' + Object.keys(rr3.scores || {}).join(','));

  // 21.19 a claim conflicting with a SETTLED dispute reopens a fresh one (history kept)
  const d4a = mk('TOwn19a', 44, 30), d4b = mk('TOwn19b', 44.4, 30), d4c = mk('TOwn19c', 44.8, 30);
  isolate([d4a, d4b, d4c]);
  const dItem2 = mintIdentifiedItem('furniture', { creator: d4a.name, holder: d4a.name, x: d4a.x, y: d4a.y });
  raiseItemClaim(d4b, dItem2.id, { text: 'bare claim of d4b' });
  raiseItemClaim(d4a, dItem2.id, { text: 'I made it with my own hands' });
  const rr4 = resolveDispute(dItem2.id, 'Alden');
  const settledOk = rr4.ok && rr4.winner === 'TOwn19a' && dItem2.dispute.status === 'resolved';
  raiseItemClaim(d4c, dItem2.id, { text: 'Actually I bought it from a traveler' });
  const reOk = dItem2.dispute.status === 'open' && dItem2.dispute.reopens != null &&
    dItem2.dispute.prevWinner === 'TOwn19a' && dItem2.dispute.claimants.length === 3 &&
    dItem2.history.filter(e => e.type === 'dispute').length === 2;
  log(settledOk && reOk, 'own21: conflicting claim after settlement reopens a fresh dispute (history preserved)',
    'status=' + dItem2.dispute.status + ' prevWinner=' + dItem2.dispute.prevWinner);

  // 21.20 the AI bridge never leaks actualOwner; viewers get belief-scoped data only
  const bA = mk('TOwn20a', 45, 30), bB = mk('TOwn20b', 45.4, 30);
  isolate([bA, bB]);
  const bItem = mintIdentifiedItem('furniture', { creator: bA.name, holder: bA.name, x: bA.x, y: bA.y });
  const bg1 = window.__aiBridge.getItem(bItem.id);
  const bg2 = window.__aiBridge.getItem('NobodyHere', bItem.id);
  const noLeak2 = bg1 && bg1.actualOwner === undefined && bg1.currentHolder === 'TOwn20a' &&
    bg2 && bg2.actualOwner === undefined &&
    !window.__aiBridge.listIdentified().some(s => s.actualOwner !== undefined) &&
    !window.__aiBridge.itemsHeldBy(bA.name).some(s => s.actualOwner !== undefined) &&
    !window.__aiBridge.openDisputes().some(s => s.actualOwner !== undefined) &&
    !window.__aiBridge.getOverdueBorrows().some(s => s.actualOwner !== undefined);
  recordOwnershipBelief(bB, bItem.id, { knownOwner: bA.name, suspectedOwner: bA.name, confidence: 0.8,
    evidence: ['test observation'], source: 'direct' });
  const bg7 = window.__aiBridge.getItem(bB.name, bItem.id);
  const scopedOk = bg7 && bg7.actualOwner === undefined && bg7.believedOwner === 'TOwn20a' && bg7.beliefConfidence === 0.8;
  const strangerBelief = window.__aiBridge.getOwnershipBeliefAs('NobodyHere', bItem.id);
  log(noLeak2 && scopedOk && strangerBelief === null,
    'own21: AI bridge never exposes actualOwner; viewers get belief-scoped data only',
    'believedOwner=' + (bg7 && bg7.believedOwner) + ' stranger=' + strangerBelief);

  // 21.21 no borrow/steal candidates when the villager already holds the inputs
  const hA = mk('TOwn21a', 46, 30), hB = mk('TOwn21b', 46.4, 30);
  isolate([hA, hB]);
  hA.bonds = { 'TOwn21b': 0.9 }; hB.bonds = { 'TOwn21a': 0.9 };
  mintIdentifiedItem('plank', { creator: hA.name, holder: hA.name, x: hA.x, y: hA.y });
  mintIdentifiedItem('plank', { creator: hA.name, holder: hA.name, x: hA.x, y: hA.y });
  mintIdentifiedItem('plank', { creator: hB.name, holder: hB.name, x: hB.x, y: hB.y });
  const bsCands = ownershipCandidates(hA).filter(c => c.id.indexOf('borrow_') === 0 || c.id.indexOf('steal_') === 0);
  const guardOk2 = hasCraftInputs(hA, RECIPE_TABLE.furniture) === true && bsCands.length === 0;
  log(guardOk2, 'own21: villager holding enough planks gets no borrow/steal candidates (hasCraftInputs guard)',
    'borrow/steal candidates=' + bsCands.length);

  // 21.22 a claimant mayor cannot decide their own dispute
  const decA = findDecider({ claimants: ['Sella'] });          // mayor not a claimant: decides
  const decB = findDecider({ claimants: ['Alden', 'Sella'] }); // mayor IS a claimant: someone else
  const decOk = decA && decA.name === 'Alden' && decB && decB.name !== 'Alden';
  log(decOk, 'own21: claimant mayor is excluded from deciding their own dispute',
    'decider=' + (decB ? decB.name : 'none'));

  // 21.23 bridge transfer log redacts true ownership; internal history keeps the full record
  const sA = mk('TOwn23a', 48, 30), sB = mk('TOwn23b', 48.4, 30);
  isolate([sA, sB]);
  const sItem = mintIdentifiedItem('furniture', { creator: sB.name, holder: sB.name, x: sB.x, y: sB.y });
  sB.state = 'sleep';
  sA.plan = [{ verb: 'steal', itemId: sItem.id, from: sB.name }];
  runPlan(sA, 300);
  const rawSteal = WORLD_TRANSFER_LOG.filter(e => e.type === 'steal' && e.itemId === sItem.id).slice(-1)[0];
  const bridgedSteal = window.__aiBridge.getTransferLog(300)
    .filter(e => e.id === (rawSteal && rawSteal.id))[0];
  const stealLeakGone = rawSteal && bridgedSteal &&
    rawSteal.result.indexOf('ownership stays') >= 0 &&            // internal truth kept...
    bridgedSteal.result === sA.name + ' stole from ' + sB.name && // ...redacted at the bridge
    bridgedSteal.result.indexOf('ownership stays') < 0 &&
    rawSteal.result.indexOf('ownership stays') >= 0;             // stored event NOT mutated
  // find + abandon carry the same leak family: "(owner still X)" / "(still owned by X)"
  recordTransfer(sItem.id, 'abandon', { from: sA.name, to: null, by: sA.name, x: sA.x, y: sA.y, context: 'test23' });
  const rawAb = WORLD_TRANSFER_LOG.filter(e => e.type === 'abandon' && e.itemId === sItem.id).slice(-1)[0];
  const bridgedAb = window.__aiBridge.getTransferLog(300).filter(e => e.id === (rawAb && rawAb.id))[0];
  const abLeakGone = rawAb && bridgedAb &&
    rawAb.result.indexOf('still owned by') >= 0 &&
    bridgedAb.result.indexOf('still owned by') < 0 &&
    bridgedAb.result.indexOf('abandons') >= 0 &&
    rawAb.result.indexOf('still owned by') >= 0;                 // stored event NOT mutated
  log(stealLeakGone && abLeakGone,
    'own21: bridge transfer log redacts true ownership; internal history keeps it',
    'bridge steal="' + (bridgedSteal && bridgedSteal.result) + '"');

  unisolate();
  cleanup();
  el.textContent += '\n==== part21 ' + res.filter(r => r.ok).length + '/' + res.length + ' passed ====\n';
};
