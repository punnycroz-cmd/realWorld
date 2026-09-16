/* ============================================================
   21a_ownership.js — Phase 2F: Ownership, provenance & information layers
   ------------------------------------------------------------
   Stable identity for important persistent objects; layered ownership
   (actualOwner world truth vs currentHolder possession vs per-character
   beliefs); full transfer event log; material lineage; claims/disputes;
   steal / borrow / return verbs; honest failures; utility integration.

   IDENTITY BOUNDARY (documented):
   - IDENTIFIED (stable id, full history): tools, furniture, weapons, and
     other persistent crafted objects (kinds in IDENTIFIED_KINDS). These
     live in the ITEMS registry AND keep a count mirror in v.inv[kind] so
     legacy count semantics (inv.furniture === 1) keep working.
   - BULK (count-based, no identity): food, grain, flour, bread, firewood,
     logs, crops and other commodities. They scale by count and never get
     stable ids.

   OWNERSHIP LAYERS (never confuse them):
   - actualOwner: world truth. Only legitimate transfer (gift/sell/buy/
     inherit/mediation) changes it. Never exposed as universally known.
   - currentHolder: physical possession. Steal/borrow/find change this only.
   - knownOwner / suspectedOwner / confidence / evidence / claims: per-
     character beliefs, via the Phase 2D epistemic APIs (brain/knowledge.js).
     Utility and behavior consult beliefs, never world truth.

   No Math.random anywhere in this module. All dispute resolution is
   deterministic. No mood engine (reserved for the future AI brain).
   ============================================================ */

/* ---------- stable item registry ---------- */
let ITEM_SEQ = 0;                 // global stable id counter
const ITEMS = {};                 // id -> item record
const IDENTIFIED_KINDS = { plank: 1, furniture: 1 }; // identity boundary
let TRANSFER_SEQ = 0;
const WORLD_TRANSFER_LOG = [];    // every transfer event, world-level (capped at 300 recent)
const TRANSFER_ARCHIVE = [];      // Phase 4: per-year summaries of events evicted from the log above — history is archived, never silently dropped
let TREE_SEQ = 0;
const FELLED_TREES = {};          // treeId -> { felledBy, day, x, y }

function simNowH(){
  return (typeof W !== 'undefined' && W.day != null) ? (W.day + (W.tod || 0) / 24) : 1.0;
}
function findPersonSafe(name){
  if(!name || typeof findPerson !== 'function') return null;
  return findPerson(name) || null;
}
function summarizeItem(it){
  if(!it) return null;
  // NOTE: actualOwner (world truth) is NEVER included in summaries. Anything
  // that leaves this module — bridge getters, lineage views — carries only
  // possession (currentHolder, observable) and belief-scoped data supplied
  // separately per viewer. Sim internals read it.actualOwner directly.
  return {
    id: it.id, kind: it.kind, label: it.label, creator: it.creator,
    quality: +it.quality.toFixed(2), condition: +it.condition.toFixed(2),
    currentHolder: it.currentHolder, status: it.status,
    borrowedFrom: it.borrowedFrom, expectedReturnH: it.expectedReturnH, stolenFrom: it.stolenFrom,
    dispute: it.dispute ? it.dispute.status : null, historyEvents: it.history.length,
    parentIds: (it.parentIds || []).slice()
  };
}

/* ---------- stable tree identity (material lineage roots) ---------- */
function ensureTreeId(t){
  if(!t) return null;
  if(t.treeId) return t.treeId;
  t.treeId = 'tree_' + (++TREE_SEQ);
  return t.treeId;
}
function recordFelledTree(t, byName){
  const tid = ensureTreeId(t);
  if(!tid || FELLED_TREES[tid]) return tid;
  FELLED_TREES[tid] = { felledBy: byName || 'Unknown', day: simNowH(), x: t.wx, y: t.wy, stage: t.stage };
  return tid;
}
function extractTreeIds(provRecs){
  const out = [];
  for(const rc of (provRecs || [])){
    if(rc && rc.treeId && out.indexOf(rc.treeId) < 0) out.push(rc.treeId);
  }
  return out;
}

/* ---------- item creation ---------- */
function mintIdentifiedItem(kind, o){
  o = o || {};
  const seq = ++ITEM_SEQ;
  const id = kind + '_' + seq;
  const now = simNowH();
  const item = {
    id, kind,
    label: capName(kind) + ' #' + seq,
    quality: Math.min(1, Math.max(0.05, o.quality != null ? o.quality : 0.5)),
    condition: o.condition != null ? o.condition : 1.0,
    creator: o.creator || 'Unknown',
    createdAt: o.createdAt != null ? o.createdAt : now,
    materials: o.materials ? Object.assign({}, o.materials) : {},
    parentIds: (o.parentIds || []).slice(),   // identified material parents
    treeIds: (o.treeIds || []).slice(),       // lineage roots for plank-class goods
    marks: o.marks ? o.marks.slice() : [],
    actualOwner: null, currentHolder: null, holderType: null,
    x: o.x, y: o.y,
    stolenFrom: null, borrowedFrom: null, expectedReturnH: null,
    status: 'held',
    history: [], dispute: null, claims: [],
    noticedMissingBy: [], overdueNoticedBy: []
  };
  if(item.creator && item.creator !== 'Unknown') item.marks.push('Maker mark of ' + item.creator);
  ITEMS[id] = item;
  // initial ownership: creator owns; holder defaults to creator
  const holder = o.holder || item.creator;
  item.actualOwner = item.creator;
  if(holder && holder !== 'Unknown'){
    item.currentHolder = holder; item.holderType = 'villager';
    const hv = findPersonSafe(holder);
    if(hv){ hv.heldItems = hv.heldItems || []; if(hv.heldItems.indexOf(id) < 0) hv.heldItems.push(id); }
  }
  item.history.push(mkTransferEvent('create', id, { from: null, to: holder !== 'Unknown' ? holder : null, by: item.creator, timeH: now, x: o.x, y: o.y, context: o.context || 'crafted', witnesses: [] }));
  // creator knows (privately, via beliefs) that this is theirs
  const cv = findPersonSafe(item.creator);
  if(cv && typeof recordOwnershipBelief === 'function' && item.creator !== 'Unknown'){
    recordOwnershipBelief(cv, id, { knownOwner: item.creator, suspectedOwner: item.creator, confidence: 1.0, evidence: ['I made it'], source: 'direct' });
  }
  return item;
}
function getItem(id){ return ITEMS[id] || null; }
function heldIdentifiedOf(v, kind){
  const out = [];
  if(!v || !v.heldItems) return out;
  for(const hid of v.heldItems){
    const it = ITEMS[hid];
    if(it && (!kind || it.kind === kind) && it.currentHolder === v.name && it.holderType === 'villager' && it.status === 'held') out.push(it);
  }
  return out;
}
function itemsHeldBy(name){
  const v = findPersonSafe(name);
  return v ? heldIdentifiedOf(v, null) : [];
}
function openDisputes(){
  const out = [];
  for(const id in ITEMS){ const it = ITEMS[id]; if(it.dispute && it.dispute.status === 'open') out.push(it); }
  return out;
}
function getOverdueBorrows(){
  const now = simNowH(); const out = [];
  for(const id in ITEMS){
    const it = ITEMS[id];
    if(it.borrowedFrom && it.expectedReturnH != null && now > it.expectedReturnH &&
       it.currentHolder && it.currentHolder !== it.borrowedFrom) out.push(it);
  }
  return out;
}
/* Chair #104 -> Plank #57 -> Tree #12 : primary chain, all parentIds listed per node */
function getLineage(itemId){
  const chain = []; const seen = {};
  let cur = ITEMS[itemId] || null;
  while(cur && !seen[cur.id]){
    seen[cur.id] = true;
    const s = summarizeItem(cur);
    chain.push(s);
    let next = null;
    if(cur.parentIds && cur.parentIds.length){
      for(const pid of cur.parentIds){ if(ITEMS[pid]){ next = ITEMS[pid]; break; } }
    }
    if(!next && cur.treeIds && cur.treeIds.length){
      for(const tid of cur.treeIds){
        const ft = FELLED_TREES[tid];
        chain.push({ id: tid, kind: 'tree', label: 'Tree #' + String(tid).replace(/^tree_/, ''),
          status: 'felled', harvestedBy: ft ? ft.felledBy : 'unknown', day: ft ? ft.day : null });
      }
      break;
    }
    cur = next;
  }
  return chain;
}

/* ---------- transfer events ---------- */
/* Phase 4: when the recent-event log exceeds its cap, the oldest event is
   folded into a per-year summary (counts by transfer type and item kind
   only — no names, no ownership assertions, so the archive is safe to
   expose). The item's own full history[] is untouched: provenance stays. */
function archiveTransferEvent(ev){
  const yr = (typeof W !== 'undefined' && W.year) ? W.year
    : Math.floor(((ev.timeH || 1) - 1) / 120) + 1;
  let b = TRANSFER_ARCHIVE.length ? TRANSFER_ARCHIVE[TRANSFER_ARCHIVE.length - 1] : null;
  if(!b || b.year !== yr){
    b = { year: yr, count: 0, byType: {}, byKind: {}, firstDay: null, lastDay: null };
    TRANSFER_ARCHIVE.push(b);
  }
  b.count++;
  const t = ev.type || 'unknown';
  b.byType[t] = (b.byType[t] || 0) + 1;
  let k = 'unknown';
  try{ const it = (typeof ITEMS !== 'undefined') ? ITEMS[ev.itemId] : null; if(it && it.kind) k = it.kind; }catch(e){}
  b.byKind[k] = (b.byKind[k] || 0) + 1;
  const d = (ev.timeH != null) ? Math.floor(ev.timeH) : null;
  if(d != null){
    if(b.firstDay == null || d < b.firstDay) b.firstDay = d;
    if(b.lastDay == null || d > b.lastDay) b.lastDay = d;
  }
}
function pushWorldTransferLog(ev){
  WORLD_TRANSFER_LOG.push(ev);
  while(WORLD_TRANSFER_LOG.length > 300) archiveTransferEvent(WORLD_TRANSFER_LOG.shift());
}
function mkTransferEvent(type, itemId, o){
  o = o || {};
  return {
    id: 'tevt_' + (++TRANSFER_SEQ),
    type, itemId,
    from: o.from || null, to: o.to || null, by: o.by || null,
    timeH: o.timeH != null ? o.timeH : simNowH(),
    x: o.x, y: o.y,
    context: o.context || '',
    witnesses: (o.witnesses || []).slice(),
    result: o.result || ''
  };
}
function transferWitnesses(x, y, exclude){
  const out = [];
  if(x == null || typeof VILLAGERS === 'undefined') return out;
  for(const o of VILLAGERS){
    if(o.dead || o.downed || (typeof isConscious === 'function' && !isConscious(o))) continue;
    if(exclude && exclude.indexOf(o.name) >= 0) continue;
    if(typeof distCells === 'function'){
      if(distCells({ x, y }, o) <= 12) out.push(o.name);
    } else out.push(o.name);
  }
  return out;
}
function syncIdentifiedInvKind(v, kind){
  if(!v || !v.inv || !IDENTIFIED_KINDS[kind]) return;
  v.inv[kind] = heldIdentifiedOf(v, kind).length;
}
/* Legacy Phase 2A provenance mirror so count-based stores stay consistent */
function syncProvFromItem(v, it){
  if(!v || !it || typeof attachItemProvenance !== 'function') return;
  const prov = {
    creator: it.creator, materials: Object.assign({}, it.materials || {}),
    quality: it.quality, condition: it.condition, owner: it.actualOwner,
    createdAt: it.createdAt, history: [{ action: 'crafted', by: it.creator, day: it.createdAt }]
  };
  for(const ev of it.history) prov.history.push({ action: ev.type, by: ev.by, day: ev.timeH });
  attachItemProvenance(v, it.kind, 1, prov);
}
/* ============================================================
   21a_ownership.js (part 2) — the transfer engine + claims/disputes
   ============================================================ */

/* Exact transfer semantics:
   gift/sell/buy/inherit : holder AND actualOwner change
   steal                  : holder changes ONLY; actualOwner stays; stolenFrom set
   borrow                 : holder changes; actualOwner stays; expectedReturnH recorded
   return                 : holder restored to lender
   lose                   : holder -> null (lost); owner stays
   find                   : holder -> finder; owner stays (finding is not owning)
   abandon                : holder -> null, marked abandoned; owner stays
   place                  : set down deliberately (unattended); owner stays
   recover                : mediation-ordered possession change; owner stays
   consume                : item destroyed in crafting
   Claims never prove ownership and never alter actualOwner. */
function recordTransfer(itemId, type, o){
  o = o || {};
  const it = ITEMS[itemId];
  if(!it) return { ok: false, reason: 'no such item' };
  const now = simNowH();
  const x = o.x != null ? o.x : it.x, y = o.y != null ? o.y : it.y;
  const witnesses = o.witnesses || transferWitnesses(x, y, [o.from, o.to].filter(Boolean));
  const ev = mkTransferEvent(type, itemId, { from: o.from, to: o.to, by: o.by, timeH: now, x, y, context: o.context, witnesses });
  const prevHolder = it.currentHolder;
  function detach(name){
    const hv = findPersonSafe(name);
    if(hv && hv.heldItems){ const i = hv.heldItems.indexOf(itemId); if(i >= 0) hv.heldItems.splice(i, 1); }
  }
  function attach(name){
    const hv = findPersonSafe(name);
    if(hv){ hv.heldItems = hv.heldItems || []; if(hv.heldItems.indexOf(itemId) < 0) hv.heldItems.push(itemId); }
  }
  switch(type){
    case 'gift': case 'sell': case 'buy': case 'trade': case 'inherit':
      detach(prevHolder);
      it.actualOwner = o.to; it.currentHolder = o.to; it.holderType = o.to ? 'villager' : 'placed';
      it.stolenFrom = null; it.borrowedFrom = null; it.expectedReturnH = null;
      it.noticedMissingBy = [];
      if(it.status !== 'destroyed') it.status = o.to ? 'held' : 'unattended';
      attach(o.to);
      ev.result = (o.from || '?') + ' -> ' + (o.to || 'none') + ' (' + type + ')';
      break;
    case 'steal':
      detach(prevHolder);
      it.currentHolder = o.to; it.holderType = 'villager';
      it.stolenFrom = o.from; it.status = 'held';
      /* actualOwner UNCHANGED — this is the law of 2F */
      attach(o.to);
      ev.result = o.to + ' stole from ' + o.from + '; ownership stays ' + it.actualOwner;
      break;
    case 'borrow':
      detach(prevHolder);
      it.currentHolder = o.to; it.holderType = 'villager';
      it.borrowedFrom = o.from;
      it.expectedReturnH = o.expectedReturnH != null ? o.expectedReturnH : now + 24;
      it.status = 'held';
      attach(o.to);
      ev.result = o.to + ' borrows from ' + o.from + ' until day ' + it.expectedReturnH.toFixed(2);
      break;
    case 'return': case 'giveback':
      detach(prevHolder);
      it.currentHolder = o.to; it.holderType = 'villager';
      it.borrowedFrom = null; it.expectedReturnH = null;
      it.status = 'held';
      attach(o.to);
      ev.result = 'returned to ' + o.to;
      break;
    case 'recover':
      detach(prevHolder);
      it.currentHolder = o.to; it.holderType = 'villager';
      it.stolenFrom = null; it.status = 'held';
      attach(o.to);
      ev.result = o.to + ' recovers ' + it.label;
      break;
    case 'lose':
      detach(prevHolder);
      it.currentHolder = null; it.holderType = 'placed';
      it.status = 'lost'; it.x = x; it.y = y;
      ev.result = 'lost at (' + Math.round(x) + ',' + Math.round(y) + ')';
      break;
    case 'find':
      detach(prevHolder);
      it.currentHolder = o.to; it.holderType = 'villager';
      if(it.status === 'lost' || it.status === 'abandoned' || it.status === 'unattended') it.status = 'held';
      /* actualOwner UNCHANGED — finding is not owning */
      attach(o.to);
      ev.result = o.to + ' picks up ' + it.label + ' (owner still ' + it.actualOwner + ')';
      break;
    case 'abandon':
      detach(prevHolder);
      it.currentHolder = null; it.holderType = 'placed';
      it.status = 'abandoned'; it.x = x; it.y = y;
      ev.result = (o.from || '?') + ' abandons ' + it.label + ' (still owned by ' + it.actualOwner + ')';
      break;
    case 'place':
      detach(prevHolder);
      it.currentHolder = null; it.holderType = 'placed';
      it.status = 'unattended'; it.x = x; it.y = y;
      ev.result = (o.from || '?') + ' sets down ' + it.label;
      break;
    case 'consume':
      detach(prevHolder);
      it.currentHolder = null; it.holderType = null; it.status = 'consumed';
      ev.result = 'consumed: ' + (o.context || '');
      break;
    default:
      return { ok: false, reason: 'unknown transfer type ' + type };
  }
  it.history.push(ev);
  pushWorldTransferLog(ev);
  // keep count mirrors truthful on both sides
  if(prevHolder) syncIdentifiedInvKind(findPersonSafe(prevHolder), it.kind);
  if(o.to && o.to !== prevHolder) syncIdentifiedInvKind(findPersonSafe(o.to), it.kind);
  updateTransferBeliefs(it, type, o, witnesses);
  if(typeof logEvent === 'function') logEvent('transfer', it.label + ': ' + ev.result);
  return { ok: true, event: ev };
}
/* Belief updates after a transfer. Participants get direct-observation
   beliefs; witnesses saw the handover, not its legitimacy. actualOwner is
   NEVER broadcast: each mind only learns what it honestly observed. */
function updateTransferBeliefs(it, type, o, witnesses){
  const label = it.label;
  // The victim of a theft learns nothing until they notice it missing.
  const informed = (type === 'steal') ? [o.to] : [o.from, o.to];
  for(const pname of informed){
    if(!pname) continue;
    const pv = findPersonSafe(pname);
    if(!pv || pv.dead) continue;
    let det;
    if(type === 'steal'){
      det = { knownOwner: it.actualOwner, suspectedOwner: it.actualOwner, confidence: 1.0,
              evidence: ['I stole ' + label + ' from ' + o.from], source: 'direct' };
    } else if(type === 'find'){
      det = { suspectedOwner: it.actualOwner, confidence: 0.7,
              evidence: ['I found ' + label + ' (not mine)'], source: 'direct' };
    } else if(type === 'borrow'){
      det = { knownOwner: o.from, suspectedOwner: o.from, confidence: 0.9,
              evidence: ['Direct participation: borrow of ' + label], source: 'direct' };
    } else {
      det = { knownOwner: it.actualOwner, suspectedOwner: it.actualOwner, confidence: 0.95,
              evidence: ['Direct participation: ' + type + ' of ' + label], source: 'direct' };
    }
    if(typeof recordOwnershipBelief === 'function') recordOwnershipBelief(pv, it.id, det);
    if(typeof observe === 'function') observe(pv, { targetId: it.id, transfer: type, holder: it.currentHolder },
      { topic: 'ownership_' + it.id, source: 'direct', confidence: 0.9, salience: 0.7, evidence: det.evidence });
  }
  for(const wname of (witnesses || [])){
    if(wname === o.from || wname === o.to) continue;
    const wv = findPersonSafe(wname);
    if(!wv || wv.dead) continue;
    const evText = 'Witnessed ' + type + ' of ' + label;
    if(typeof observe === 'function') observe(wv, { targetId: it.id, transfer: type, holder: it.currentHolder },
      { topic: 'ownership_' + it.id, source: 'direct', confidence: 0.7, salience: 0.6, evidence: [evText] });
    if(typeof recordOwnershipBelief === 'function'){
      const det = { suspectedOwner: it.currentHolder, confidence: 0.65, evidence: [evText], source: 'direct' };
      if(type !== 'steal' && type !== 'borrow' && type !== 'find'){
        det.knownOwner = it.actualOwner; det.confidence = 0.85;
      }
      recordOwnershipBelief(wv, it.id, det);
    }
    if(typeof witnessEvent === 'function') witnessEvent(wv, 'Saw ' + type + ' of ' + label);
  }
}

/* Consume identified inputs for crafting: oldest held first; anonymous
   fallback keeps the count math honest when legacy/test inventories hold
   bulk counts without identity (their parentage is then "unknown"). */
function consumeIdentifiedInputs(v, kind, n, intoWhat){
  const ids = [];
  if(v.heldItems){
    for(const hid of v.heldItems.slice()){
      if(ids.length >= n) break;
      const it = ITEMS[hid];
      if(it && it.kind === kind && it.currentHolder === v.name && it.holderType === 'villager' && it.status === 'held'){
        it.history.push(mkTransferEvent('consume', hid, { from: v.name, to: null, by: v.name, timeH: simNowH(), x: v.x, y: v.y, context: 'crafted into ' + (intoWhat || 'goods') }));
        it.status = 'consumed'; it.currentHolder = null; it.holderType = null;
        ids.push(hid);
      }
    }
    v.heldItems = v.heldItems.filter(hid => ids.indexOf(hid) < 0);
  }
  while(ids.length < n){
    // anonymous material: recorded honestly as creator Unknown, no lineage
    const anon = mintIdentifiedItem(kind, { creator: 'Unknown', quality: 0.4, holder: null, x: v.x, y: v.y, context: 'anonymous bulk material' });
    anon.status = 'consumed'; anon.currentHolder = null; anon.holderType = null;
    anon.history.push(mkTransferEvent('consume', anon.id, { from: v.name, to: null, by: v.name, timeH: simNowH(), x: v.x, y: v.y, context: 'crafted into ' + (intoWhat || 'goods') }));
    if(v.heldItems){ const i = v.heldItems.indexOf(anon.id); if(i >= 0) v.heldItems.splice(i, 1); }
    ids.push(anon.id);
  }
  return ids;
}

/* ---------- claims & disputes ---------- */
function raiseItemClaim(v, itemId, basis){
  if(!v || v.dead) return { ok: false, reason: 'no claimant' };
  const it = ITEMS[itemId];
  if(!it) return { ok: false, reason: 'no such item' };
  const now = simNowH();
  const text = (basis && basis.text) || (v.name + ' claims ' + it.label);
  // Phase 2D machinery: per-character claim + witness beliefs. Does NOT touch actualOwner.
  if(typeof claimOwnership === 'function') claimOwnership(v, itemId, { text });
  const witnesses = transferWitnesses(v.x, v.y, [v.name]);
  it.claims.push({ claimant: v.name, timeH: now, basis: text, witnesses: witnesses.slice() });
  it.history.push(mkTransferEvent('claim', itemId, { from: v.name, to: null, by: v.name, timeH: now, x: v.x, y: v.y, context: text, witnesses }));
  const distinct = [...new Set(it.claims.map(c => c.claimant))];
  if(distinct.length >= 2){
    const d = it.dispute;
    if(!d || d.status !== 'open'){
      // A settled dispute (resolved/deadlocked) is history, never overwritten:
      // a new claim that conflicts with the settlement opens a FRESH dispute
      // referencing the old one. The winner merely re-affirming their own
      // claim is recorded but opens nothing new.
      const settlement = d && (d.status === 'resolved' || d.status === 'deadlocked');
      if(settlement && d.winner && v.name === d.winner){
        if(typeof logEvent === 'function') logEvent('dispute', it.label + ': ' + v.name + ' re-affirms the settled claim; no new dispute');
      } else {
        it.dispute = { claimants: distinct.slice(), raisedH: now, status: 'open' };
        if(settlement){
          it.dispute.reopens = d.resolvedH != null ? d.resolvedH : d.raisedH;
          if(d.winner) it.dispute.prevWinner = d.winner;
        }
        it.history.push(mkTransferEvent('dispute', itemId, { from: null, to: null, timeH: now, x: v.x, y: v.y,
          context: (settlement ? 'Reopened dispute' : 'Conflicting claims') + ': ' + distinct.join(' vs '), witnesses }));
        if(typeof logEvent === 'function') logEvent('dispute', it.label + ': dispute ' + (settlement ? 'reopened' : 'opened') + ' (' + distinct.join(' vs ') + ')');
        for(const cn of distinct){
          const cv = findPersonSafe(cn);
          if(cv && !cv.dead){
            cv.thoughts = [{ text: 'Dispute over ' + it.label + ' with ' + distinct.filter(nn => nn !== cn).join(', '), val: -2 }];
            if(typeof observe === 'function') observe(cv, { targetId: itemId, dispute: 'open' },
              { topic: 'dispute_' + itemId, source: 'direct', confidence: 0.9, salience: 0.85, evidence: ['Dispute opened over ' + it.label] });
          }
        }
      }
    } else {
      // OPEN dispute: admit any new distinct claimant as a full party.
      // A claimant who followed the rules is never shut out of the resolution;
      // resolveDispute scores d.claimants, so every party is heard.
      for(const cn of distinct){
        if(d.claimants.indexOf(cn) >= 0) continue;
        d.claimants.push(cn);
        it.history.push(mkTransferEvent('dispute', itemId, { from: null, to: null, timeH: now, x: v.x, y: v.y,
          context: cn + ' joins the open dispute over ' + it.label, witnesses }));
        if(typeof logEvent === 'function') logEvent('dispute', it.label + ': ' + cn + ' joins the dispute (' + d.claimants.join(' vs ') + ')');
        const cv = findPersonSafe(cn);
        if(cv && !cv.dead){
          cv.thoughts = [{ text: 'Joined the dispute over ' + it.label + ' with ' + d.claimants.filter(nn => nn !== cn).join(', '), val: -2 }];
          if(typeof observe === 'function') observe(cv, { targetId: itemId, dispute: 'open' },
            { topic: 'dispute_' + itemId, source: 'direct', confidence: 0.9, salience: 0.85, evidence: ['Joined the dispute over ' + it.label] });
          if(typeof witnessEvent === 'function') witnessEvent(cv, 'Joined the dispute over ' + it.label);
        }
      }
    }
  }
  if(typeof witnessEvent === 'function') witnessEvent(v, 'Claimed ' + it.label + ': ' + text);
  return { ok: true, dispute: it.dispute && it.dispute.status === 'open' ? it.dispute : null };
}
/* Evidence reliability ladder (deterministic, no RNG):
   direct observation / creation > possession & transaction history >
   hearsay > bare claim. A thief's own admission counts against them. */
function evidenceWeight(s){
  const t = String(s || '');
  if(/i made it|i built|i crafted|my work|maker mark/i.test(t)) return 1.0;
  if(/direct observation|direct participation/i.test(t)) return 1.0;
  if(/witnessed claim|heard .* claim/i.test(t)) return 0.4; // witnessing speech is hearsay, not event-witnessing
  if(/witnessed|saw .* (buy|sell|give|take|make|carry|hold|steal)/i.test(t)) return 0.7;
  if(/possession history|previous owner|held it for|used it for/i.test(t)) return 0.7;
  if(/told me|heard that|hearsay|said that|rumor/i.test(t)) return 0.4;
  if(/bare claim|self-declared|^claimed /i.test(t)) return 0.1;
  if(/claim/i.test(t)) return 0.15;
  return 0.3;
}
function findDecider(d){
  if(typeof VILLAGERS === 'undefined') return null;
  const claimants = (d && d.claimants) || [];
  // No one decides their own dispute: claimants are excluded BEFORE the mayor
  // check, so a claimant mayor never judges their own case.
  const eligible = (v) => !v.dead && claimants.indexOf(v.name) < 0;
  const mayor = VILLAGERS.find(v => eligible(v) && /mayor/i.test(v.role || ''));
  if(mayor) return mayor;
  // otherwise the oldest living adult who is not a claimant
  let best = null;
  for(const v of VILLAGERS){
    if(!eligible(v) || !v.adult) continue;
    if(!best || (v.ageY || 0) > (best.ageY || 0)) best = v;
  }
  return best;
}
function resolveDispute(itemId, deciderName){
  const it = ITEMS[itemId];
  if(!it) return { ok: false, reason: 'no such item' };
  const d = it.dispute;
  if(!d || d.status !== 'open') return { ok: false, reason: 'no open dispute' };
  const now = simNowH();
  let decider = deciderName ? findPersonSafe(deciderName) : null;
  if(!decider || decider.dead) decider = findDecider(d);
  if(!decider || decider.dead){
    return { ok: false, reason: 'no valid decider; holder keeps pending' };
  }
  // gather & score evidence per claimant from their own ownership beliefs
  const scores = {};
  for(const cn of d.claimants){
    const cv = findPersonSafe(cn);
    let sc = 0; const parts = [];
    if(cv && typeof getOwnershipBelief === 'function'){
      const ob = getOwnershipBelief(cv, it.id);
      if(ob && ob.evidence) for(const e of ob.evidence){
        let w = evidenceWeight(e);
        if(it.stolenFrom === cn && /steal|stole|theft/i.test(e)) w = -1.0; // admission against interest
        sc += w; parts.push(e + ' [' + w.toFixed(1) + ']');
      }
    }
    if(!parts.length){ sc += 0.1; parts.push('bare claim [0.1]'); }
    scores[cn] = { total: +sc.toFixed(2), parts };
  }
  let winner = null, best = -Infinity, tie = false;
  for(const cn of d.claimants){
    if(scores[cn].total > best + 1e-9){ best = scores[cn].total; winner = cn; tie = false; }
    else if(Math.abs(scores[cn].total - best) <= 1e-9){ tie = true; }
  }
  const reasoning = d.claimants.map(cn => cn + '=' + scores[cn].total.toFixed(2)).join(', ');
  let outcome;
  if(tie){
    d.status = 'deadlocked';
    outcome = 'deadlock (' + reasoning + '); holder keeps pending';
  } else {
    d.status = 'resolved';
    d.winner = winner;
    // mediation orders POSSESSION only — actualOwner is never rewritten silently
    if(it.currentHolder !== winner){
      recordTransfer(it.id, 'recover', { from: it.currentHolder, to: winner, by: decider.name, x: decider.x, y: decider.y,
        context: 'dispute resolved by ' + decider.name + ' (' + reasoning + ')' });
      outcome = winner + ' awarded possession (' + reasoning + ')';
    } else {
      outcome = winner + ' confirmed in possession (' + reasoning + ')';
    }
  }
  d.resolvedH = now; d.decider = decider.name; d.scores = scores; d.reasoning = reasoning;
  const rev = mkTransferEvent('disputeResolved', it.id, { from: null, to: tie ? null : winner, by: decider.name, timeH: now,
    context: 'decider=' + decider.name + '; ' + outcome, witnesses: d.claimants.slice() });
  it.history.push(rev); pushWorldTransferLog(rev);
  for(const cn of d.claimants){
    const cv = findPersonSafe(cn);
    if(!cv || cv.dead) continue;
    if(!tie && cn === winner){
      cv.thoughts = [{ text: 'Won the dispute over ' + it.label, val: 3 }];
    } else if(!tie){
      cv.thoughts = [{ text: 'Lost the dispute over ' + it.label + ' to ' + winner, val: -3 }];
      if(typeof observe === 'function') observe(cv, { targetId: it.id, dispute: d.status, winner },
        { topic: 'dispute_' + it.id, source: 'direct', confidence: 0.95, salience: 0.9, evidence: [decider.name + ' ruled for ' + winner] });
      // bond reduction; addBond clamps bonds to [0,1] so the grudge itself persists
      // as the hostile memory + thought above, not as a negative bond
      if(typeof addBond === 'function'){
        const wv = findPersonSafe(winner); if(wv) addBond(cv, wv, -0.15);
        addBond(cv, decider, -0.05);
      }
    }
    if(typeof witnessEvent === 'function') witnessEvent(cv, 'Dispute over ' + it.label + ' ' + d.status + ' (' + outcome + ')');
  }
  if(typeof logEvent === 'function') logEvent('dispute', it.label + ': ' + outcome);
  return { ok: true, winner: tie ? null : winner, tie, scores, decider: decider.name, outcome };
}
/* ============================================================
   21a_ownership.js (part 3) — verbs, take/drop, tick, utility, wiring
   ============================================================ */

/* ---------- verb step executors ---------- */
function doStealStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  let it = step.itemId ? ITEMS[step.itemId] : null;
  let victim = step.from ? findPersonSafe(step.from) : null;
  if(!it && victim) it = heldIdentifiedOf(victim, step.what || null)[0] || null;
  if(it && !victim && it.currentHolder) victim = findPersonSafe(it.currentHolder);
  function failSteal(text, memText){
    v.thoughts = [{ text, val: -2 }];
    if(typeof observe === 'function') observe(v, { action: 'steal', result: 'failed', reason: text },
      { topic: 'steal_fail', source: 'direct', confidence: 0.9, salience: 0.6, evidence: [memText || text] });
    if(typeof witnessEvent === 'function') witnessEvent(v, memText || text);
    return true;
  }
  if(!it || !victim || victim.dead || victim.name === v.name)
    return failSteal('Nothing worth stealing there');
  if(it.currentHolder !== victim.name || it.holderType !== 'villager' || it.status !== 'held')
    return failSteal(victim.name + ' no longer holds ' + it.label);
  if(typeof distCells === 'function' && distCells(v, victim) > 1.6){
    const r = planMoveToward(v, victim.x, victim.y, dtH);
    if(r === 'stuck') return failSteal('Could not reach ' + victim.name);
    return false;
  }
  // conscious nearby witnesses — deterministic
  const seers = [];
  for(const o of VILLAGERS){
    if(o === v || o.dead || o.downed) continue;
    if(typeof isConscious === 'function' && !isConscious(o)) continue;
    if(typeof distCells === 'function' && distCells(v, o) > 12) continue;
    seers.push(o);
  }
  const victimSees = (typeof isConscious !== 'function' || isConscious(victim));
  if(victimSees && seers.indexOf(victim) < 0) seers.push(victim);
  v.state = 'work'; v.moving = false;
  if(seers.length){
    // CAUGHT — the item stays; beliefs, memories, bonds all move
    for(const s of seers){
      s.thoughts = [{ text: (s === victim ? v.name + ' tried to steal my ' + it.label + '!' : 'Caught ' + v.name + ' trying to steal ' + it.label + '!'), val: -3 }];
      if(typeof observe === 'function') observe(s, { targetId: it.id, thief: v.name, victim: victim.name },
        { topic: 'theft_' + it.id, source: 'direct', confidence: 0.95, salience: 0.95,
          evidence: ['Saw ' + v.name + ' try to steal ' + it.label + ' from ' + victim.name] });
      if(typeof recordOwnershipBelief === 'function')
        recordOwnershipBelief(s, it.id, { knownOwner: it.actualOwner, suspectedOwner: it.actualOwner, confidence: 0.9,
          evidence: ['Saw ' + v.name + ' try to steal ' + it.label], source: 'direct' });
      if(typeof witnessEvent === 'function') witnessEvent(s, 'Caught ' + v.name + ' stealing from ' + victim.name);
      if(typeof addBond === 'function') addBond(s, v, s === victim ? -0.3 : -0.1);
    }
    v.thoughts = [{ text: 'Caught trying to steal ' + it.label + '!', val: -4 }];
    if(typeof observe === 'function') observe(v, { targetId: it.id, result: 'caught' },
      { topic: 'theft_' + it.id, source: 'direct', confidence: 1.0, salience: 0.95,
        evidence: ['Caught stealing by ' + seers.map(s => s.name).join(', ')] });
    if(typeof witnessEvent === 'function') witnessEvent(v, 'Was caught trying to steal ' + it.label);
    if(typeof logEvent === 'function') logEvent('theft', v.name + ' caught trying to steal ' + it.label + ' from ' + victim.name);
    return true;
  }
  // UNSEEN — holder changes, actualOwner does NOT
  recordTransfer(it.id, 'steal', { from: victim.name, to: v.name, by: v.name, x: v.x, y: v.y, context: 'unseen theft', witnesses: [] });
  v.thoughts = [{ text: 'Took ' + victim.name + "'s " + it.label + ' unseen', val: 1 }];
  if(typeof observe === 'function') observe(v, { targetId: it.id, holder: v.name, stolenFrom: victim.name },
    { topic: 'theft_' + it.id, source: 'direct', confidence: 1.0, salience: 0.9, evidence: ['I stole ' + it.label + ' from ' + victim.name] });
  return true;
}
function doBorrowStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  let it = step.itemId ? ITEMS[step.itemId] : null;
  let lender = step.from ? findPersonSafe(step.from) : null;
  if(it && !lender && it.currentHolder) lender = findPersonSafe(it.currentHolder);
  if(!it && lender) it = heldIdentifiedOf(lender, step.what || null)[0] || null;
  function failBorrow(text){
    v.thoughts = [{ text, val: -2 }];
    if(typeof observe === 'function') observe(v, { action: 'borrow', result: 'failed', reason: text },
      { topic: 'borrow_fail', source: 'direct', confidence: 0.9, salience: 0.6, evidence: [text] });
    if(typeof witnessEvent === 'function') witnessEvent(v, text);
    return true;
  }
  if(!it || !lender || lender.dead || lender.name === v.name) return failBorrow('No one to borrow from');
  if(typeof isConscious === 'function' && !isConscious(lender)) return failBorrow(lender.name + ' is not awake to lend');
  if(it.currentHolder !== lender.name || it.holderType !== 'villager') return failBorrow(lender.name + ' no longer holds ' + it.label);
  if(typeof distCells === 'function' && distCells(v, lender) > 4){
    const r = planMoveToward(v, lender.x, lender.y, dtH);
    if(r === 'stuck') return failBorrow('Could not reach ' + lender.name);
    return false;
  }
  v.state = 'chat'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog < 0.2) return false;
  const bond = (v.bonds && v.bonds[lender.name]) || 0;
  const bondBack = (lender.bonds && lender.bonds[v.name]) || 0;
  if(Math.max(bond, bondBack) < 0.2){
    v.thoughts = [{ text: lender.name + ' refused to lend ' + it.label, val: -2 }];
    lender.thoughts = [{ text: "Didn't trust " + v.name + ' with my ' + it.label, val: -1 }];
    if(typeof observe === 'function'){
      observe(v, { targetId: it.id, result: 'refused' },
        { topic: 'borrow_' + it.id, source: 'direct', confidence: 0.9, salience: 0.6, evidence: [lender.name + ' refused the loan'] });
      observe(lender, { targetId: it.id, result: 'refused' },
        { topic: 'borrow_' + it.id, source: 'direct', confidence: 0.9, salience: 0.6, evidence: ['Refused to lend ' + it.label + ' to ' + v.name] });
    }
    if(typeof witnessEvent === 'function'){ witnessEvent(v, lender.name + ' refused to lend ' + it.label); }
    if(typeof logEvent === 'function') logEvent('borrow', lender.name + ' refused ' + v.name + "'s request for " + it.label);
    return true;
  }
  recordTransfer(it.id, 'borrow', { from: lender.name, to: v.name, by: v.name, x: v.x, y: v.y,
    context: 'borrowed for a day', expectedReturnH: simNowH() + 24,
    witnesses: transferWitnesses(v.x, v.y, [v.name, lender.name]) });
  v.thoughts = [{ text: 'Borrowed ' + it.label + ' from ' + lender.name, val: 2 }];
  lender.thoughts = [{ text: 'Lent ' + it.label + ' to ' + v.name, val: 1 }];
  return true;
}
function doGivebackStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  let it = step.itemId ? ITEMS[step.itemId] : null;
  if(!it) it = heldIdentifiedOf(v, step.what || null).filter(x => x.borrowedFrom)[0] || null;
  if(!it || !it.borrowedFrom){
    v.thoughts = [{ text: 'Nothing borrowed to return', val: -1 }];
    return true;
  }
  const lender = findPersonSafe(it.borrowedFrom);
  if(!lender || lender.dead){
    it.borrowedFrom = null; it.expectedReturnH = null;
    it.history.push(mkTransferEvent('return', it.id, { from: v.name, to: v.name, by: v.name, timeH: simNowH(), x: v.x, y: v.y, context: 'lender gone; loan dissolved' }));
    v.thoughts = [{ text: 'Kept ' + it.label + ' — ' + (lender ? lender.name + ' is gone' : 'lender is gone'), val: -1 }];
    return true;
  }
  if(typeof distCells === 'function' && distCells(v, lender) > 4){
    const r = planMoveToward(v, lender.x, lender.y, dtH);
    if(r === 'stuck'){ v.thoughts = [{ text: 'Could not reach ' + lender.name, val: -2 }]; return true; }
    return false;
  }
  v.state = 'chat'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog < 0.2) return false;
  recordTransfer(it.id, 'return', { from: v.name, to: lender.name, by: v.name, x: v.x, y: v.y, context: 'returned loan' });
  v.thoughts = [{ text: 'Returned ' + it.label + ' to ' + lender.name, val: 2 }];
  lender.thoughts = [{ text: v.name + ' returned my ' + it.label, val: 2 }];
  return true;
}
function doMediateStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  const it = step.itemId ? ITEMS[step.itemId] : openDisputes()[0];
  if(!it || !it.dispute || it.dispute.status !== 'open'){
    v.thoughts = [{ text: 'No open dispute to mediate', val: -1 }];
    return true;
  }
  const first = findPersonSafe(it.dispute.claimants[0]);
  if(first && typeof distCells === 'function' && distCells(v, first) > 4){
    const r = planMoveToward(v, first.x, first.y, dtH);
    if(r === 'stuck'){ v.thoughts = [{ text: 'Could not reach the disputants', val: -2 }]; return true; }
    return false;
  }
  v.state = 'chat'; v.moving = false;
  step.prog = (step.prog || 0) + dtH;
  if(step.prog < 0.3) return false;
  const r = resolveDispute(it.id, v.name);
  if(!r.ok){
    v.thoughts = [{ text: 'Could not resolve the dispute over ' + it.label + ': ' + r.reason, val: -2 }];
    if(typeof observe === 'function') observe(v, { targetId: it.id, result: 'unresolved', reason: r.reason },
      { topic: 'dispute_' + it.id, source: 'direct', confidence: 0.9, salience: 0.6, evidence: [r.reason] });
    return true;
  }
  v.thoughts = [{ text: 'Mediated the dispute over ' + it.label + ': ' + r.outcome, val: 2 }];
  return true;
}

/* ---------- identified take / drop ---------- */
function takeSpecificIdentified(v, step, it, dtH){
  // NEVER silently take another person's held identified item
  if(it.holderType === 'villager' && it.currentHolder && it.currentHolder !== v.name){
    let believedOwner = it.currentHolder;
    if(typeof getOwnershipBelief === 'function'){
      const ob = getOwnershipBelief(v, it.id);
      if(ob) believedOwner = ob.knownOwner || ob.suspectedOwner || believedOwner;
    }
    v.thoughts = [{ text: 'That ' + it.label + ' belongs to ' + believedOwner + ' — not mine to take', val: -1 }];
    if(typeof observe === 'function') observe(v, { targetId: it.id, refused: true },
      { topic: 'take_' + it.id, source: 'direct', confidence: 0.9, salience: 0.6, evidence: ['Would not take ' + believedOwner + "'s " + it.label] });
    if(typeof witnessEvent === 'function') witnessEvent(v, 'Left ' + believedOwner + "'s " + it.label + ' alone');
    return true;
  }
  if(it.holderType !== 'placed' || it.x == null){
    v.thoughts = [{ text: it.label + ' is not here to take', val: -1 }];
    return true;
  }
  if(Math.hypot(v.x - it.x, v.y - it.y) > CS * 1.6){
    const r = planMoveToward(v, it.x, it.y, dtH);
    return r === 'stuck' ? true : false;
  }
  v.state = 'idle'; v.moving = false;
  recordTransfer(it.id, 'find', { from: null, to: v.name, by: v.name, x: v.x, y: v.y, context: 'picked up ' + it.status + ' item' });
  syncProvFromItem(v, it);
  if(typeof witnessEvent === 'function') witnessEvent(v, 'Picked up ' + it.label);
  return true;
}
function doTakeIdentifiedStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  const what = step.what || 'plank';
  if(step.identifiedId){
    const it = ITEMS[step.identifiedId];
    if(!it){ v.thoughts = [{ text: 'It is gone', val: -1 }]; return true; }
    return takeSpecificIdentified(v, step, it, dtH);
  }
  if(!step._targetId){
    let best = null, bd = 1e9;
    for(const id in ITEMS){
      const it = ITEMS[id];
      if(it.kind !== what || it.holderType !== 'placed') continue;
      if(it.status !== 'unattended' && it.status !== 'lost' && it.status !== 'abandoned') continue;
      const d = Math.hypot((it.x || 0) - v.x, (it.y || 0) - v.y);
      if(d < bd){ bd = d; best = it; }
    }
    if(best && bd < CS * 8) step._targetId = best.id;
    else { v.thoughts = [{ text: 'No ' + what + ' to take', val: -1 }]; return true; }
  }
  const it = ITEMS[step._targetId];
  if(!it){ v.thoughts = [{ text: 'It is gone', val: -1 }]; return true; }
  return takeSpecificIdentified(v, step, it, dtH);
}
function doDropIdentifiedStep(v, step, dtH){
  if(v.dead || v.downed) return true;
  const what = step.what;
  const n = Math.min(step.n || 1, v.inv[what] || 0);
  const held = heldIdentifiedOf(v, what).slice(0, n);
  for(const it of held){
    recordTransfer(it.id, 'place', { from: v.name, to: null, x: v.x, y: v.y, context: 'set down' });
    if(typeof stripItemProvenance === 'function') stripItemProvenance(v, what, 1);
  }
  v.state = 'idle';
  return true;
}
const __doTakeStep21 = doTakeStep;
doTakeStep = function(v, step, dtH){
  const what = step.what || 'log';
  if(IDENTIFIED_KINDS[what]) return doTakeIdentifiedStep(v, step, dtH);
  return __doTakeStep21(v, step, dtH);
};
const __doDropStep21 = doDropStep;
doDropStep = function(v, step, dtH){
  const what = step.what || 'log';
  if(IDENTIFIED_KINDS[what]) return doDropIdentifiedStep(v, step, dtH);
  return __doDropStep21(v, step, dtH);
};

/* ---------- ownership tick (missing items, dead holders, overdue loans) ---------- */
function ownershipTick(dtH){
  if(typeof VILLAGERS === 'undefined') return;
  for(const id in ITEMS){
    const it = ITEMS[id];
    if(it.status === 'consumed' || it.status === 'destroyed') continue;
    // dead/vanished holder: set the item down honestly where they fell
    if(it.holderType === 'villager' && it.currentHolder){
      const hv = findPersonSafe(it.currentHolder);
      if(!hv || hv.dead){
        recordTransfer(id, 'place', { from: it.currentHolder, to: null, x: hv ? hv.x : it.x, y: hv ? hv.y : it.y, context: 'holder died or vanished; set down' });
        continue;
      }
    }
    const lastEv = it.history.length ? it.history[it.history.length - 1] : null;
    // missing-item notice: someone took it without the owner's participation
    if(it.actualOwner && lastEv && (lastEv.type === 'steal' || lastEv.type === 'find') &&
       it.currentHolder !== it.actualOwner && !it.borrowedFrom){
      const ov = findPersonSafe(it.actualOwner);
      if(ov && !ov.dead && (typeof isConscious !== 'function' || isConscious(ov)) &&
         it.noticedMissingBy.indexOf(ov.name) < 0){
        it.noticedMissingBy.push(ov.name);
        ov.thoughts = [{ text: 'My ' + it.label + ' is missing!', val: -3 }];
        if(typeof observe === 'function') observe(ov, { targetId: id, missing: true },
          { topic: 'missing_' + id, source: 'direct', confidence: 0.85, salience: 0.85, evidence: ['Noticed ' + it.label + ' gone'] });
        if(typeof recordOwnershipBelief === 'function')
          recordOwnershipBelief(ov, id, { knownOwner: ov.name, suspectedOwner: null, confidence: 0.9, evidence: ['I owned it and it is gone'], source: 'direct' });
        if(typeof witnessEvent === 'function') witnessEvent(ov, 'Noticed ' + it.label + ' missing');
      }
    }
    // overdue borrow notices (lender + borrower)
    if(it.borrowedFrom && it.expectedReturnH != null && simNowH() > it.expectedReturnH &&
       it.currentHolder && it.currentHolder !== it.borrowedFrom){
      const lender = findPersonSafe(it.borrowedFrom);
      const borrower = findPersonSafe(it.currentHolder);
      if(lender && !lender.dead && (typeof isConscious !== 'function' || isConscious(lender)) &&
         it.overdueNoticedBy.indexOf('L:' + lender.name) < 0){
        it.overdueNoticedBy.push('L:' + lender.name);
        lender.thoughts = [{ text: (borrower ? borrower.name : 'Someone') + ' still has my ' + it.label + ' past return time', val: -2 }];
        if(typeof observe === 'function') observe(lender, { targetId: id, overdue: true },
          { topic: 'borrow_' + id, source: 'direct', confidence: 0.9, salience: 0.7, evidence: ['Loan of ' + it.label + ' overdue'] });
      }
      if(borrower && !borrower.dead && (typeof isConscious !== 'function' || isConscious(borrower)) &&
         it.overdueNoticedBy.indexOf('B:' + borrower.name) < 0){
        it.overdueNoticedBy.push('B:' + borrower.name);
        borrower.thoughts = [{ text: 'I should return ' + it.label + ' to ' + it.borrowedFrom, val: -1 }];
      }
    }
  }
}

/* ---------- utility integration (beliefs, never world truth) ---------- */
const IDENTIFIED_CRAFT_NEEDS = { furniture: 'plank' };
/* Honest local guard: does v already hold enough of every recipe input?
   (The old code referenced a global hasInputs that does not exist anywhere
   in the bundle — typeof hasInputs was never 'function', so the guard never
   fired and borrow/steal candidates were generated even when the villager
   already held the inputs. This local check replaces it.) */
function hasCraftInputs(v, r){
  if(!v || !r || !r.inputs) return false;
  for(const k in r.inputs){
    const need = r.inputs[k] || 0;
    if(need <= 0) continue;
    const haveInv = (v.inv && v.inv[k]) || 0;
    const haveIdent = heldIdentifiedOf(v, k).length;
    if(Math.max(haveInv, haveIdent) < need) return false;
  }
  return true;
}
function ownershipCandidates(v){
  const out = [];
  if(!v || v.dead) return out;
  const now = simNowH();
  // 1. return borrowed tools (overdue first)
  for(const hid of (v.heldItems || [])){
    const it = ITEMS[hid];
    if(!it || it.borrowedFrom == null || it.currentHolder !== v.name || it.status !== 'held') continue;
    const overdue = it.expectedReturnH != null && now > it.expectedReturnH;
    out.push({ id: 'giveback_' + it.id, category: 'social', name: (overdue ? 'Return overdue ' : 'Return borrowed ') + it.label,
      targetKey: 'giveback_' + it.id, tx: v.x, ty: v.y, overdue,
      plan: [{ verb: 'giveback', itemId: it.id }] });
  }
  // 2. recover my own unattended/lost/abandoned items (legitimate pickup)
  for(const id in ITEMS){
    const it = ITEMS[id];
    if(it.actualOwner !== v.name || it.holderType !== 'placed' || it.x == null) continue;
    if(it.status !== 'unattended' && it.status !== 'lost' && it.status !== 'abandoned') continue;
    out.push({ id: 'recover_' + id, category: 'work', name: 'Recover my ' + it.label,
      targetKey: 'recover_' + id, tx: it.x, ty: it.y,
      plan: [{ verb: 'take', what: it.kind, identifiedId: id }] });
  }
  // 3. mediate open disputes (the mayor, or anyone who knows of one)
  for(const id in ITEMS){
    const it = ITEMS[id];
    if(!it.dispute || it.dispute.status !== 'open') continue;
    const isMayor = /mayor/i.test(v.role || '');
    const knows = typeof knowsAbout === 'function' && knowsAbout(v, 'dispute_' + id);
    if(!isMayor && !knows) continue;
    out.push({ id: 'mediate_' + id, category: 'social', name: 'Mediate dispute over ' + it.label,
      targetKey: 'mediate_' + id, tx: v.x, ty: v.y,
      plan: [{ verb: 'mediate', itemId: id }] });
  }
  // 4. borrow an identified input I lack for crafting (friends only)
  for(const output in IDENTIFIED_CRAFT_NEEDS){
    const r = (typeof RECIPE_TABLE !== 'undefined') ? RECIPE_TABLE[output] : null;
    if(!r || !r.inputs) continue;
    const input = IDENTIFIED_CRAFT_NEEDS[output];
    if(hasCraftInputs(v, r)) continue; // skip borrow/steal when inputs are already held
    let bestLender = null, bestScore = -1;
    for(const o of VILLAGERS){
      if(o === v || o.dead || o.downed) continue;
      if(typeof isConscious === 'function' && !isConscious(o)) continue;
      const held = heldIdentifiedOf(o, input);
      if(!held.length) continue;
      const b1 = (v.bonds && v.bonds[o.name]) || 0, b2 = (o.bonds && o.bonds[v.name]) || 0;
      const trust = Math.max(b1, b2);
      if(trust < 0.2) continue;
      const sc = trust - (typeof distCells === 'function' ? distCells(v, o) / 200 : 0);
      if(sc > bestScore){ bestScore = sc; bestLender = { o, item: held[0] }; }
    }
    if(bestLender){
      out.push({ id: 'borrow_' + input, category: 'work', name: 'Borrow ' + bestLender.item.label + ' from ' + bestLender.o.name,
        targetKey: 'borrow_' + input, tx: bestLender.o.x, ty: bestLender.o.y,
        plan: [{ verb: 'borrow', what: input, from: bestLender.o.name, itemId: bestLender.item.id }] });
    }
  }
  // 5. steal — gated HARD: only the bold, or those with a real grudge, and only to craft
  const bold = v.personality && v.personality.brave > 1.2;
  for(const output in IDENTIFIED_CRAFT_NEEDS){
    const r = (typeof RECIPE_TABLE !== 'undefined') ? RECIPE_TABLE[output] : null;
    if(!r || !r.inputs) continue;
    const input = IDENTIFIED_CRAFT_NEEDS[output];
    if(hasCraftInputs(v, r)) continue; // skip borrow/steal when inputs are already held
    for(const o of VILLAGERS){
      if(o === v || o.dead || o.downed) continue;
      if(typeof isConscious === 'function' && !isConscious(o)) continue;
      const held = heldIdentifiedOf(o, input);
      if(!held.length) continue;
      const bond = (v.bonds && v.bonds[o.name]) || 0;
      if(!bold && bond > -0.3) continue;
      out.push({ id: 'steal_' + held[0].id, category: 'social', name: 'Steal ' + held[0].label + ' from ' + o.name,
        targetKey: 'steal_' + held[0].id, tx: o.x, ty: o.y,
        plan: [{ verb: 'steal', itemId: held[0].id, from: o.name }] });
      break;
    }
  }
  return out;
}
const __enum21 = enumerateCandidateActions;
enumerateCandidateActions = function(v){
  return __enum21(v).concat(ownershipCandidates(v));
};
const __score21 = scoreCandidateAction;
scoreCandidateAction = function(v, c){
  // Survival suppression: when a core need is critical, non-survival actions
  // are suppressed so the villager prioritizes staying alive. Without this, a
  // flat-scored leisure action (e.g. child's play at 65) can outscore food
  // acquisition while the villager starves to death.
  if(c.category !== 'survival' && c.category !== 'safety'){
    const b = v.body || {};
    if((b.satiety != null && b.satiety < 0.25) ||
       (b.hydration != null && b.hydration < 0.25) ||
       (b.fatigue != null && b.fatigue > 0.90)){
      return 0;
    }
  }
  const dc = (c.tx != null && typeof distCells === 'function') ? Math.hypot(c.tx - v.x, c.ty - v.y) / CS : 0;
  const distCost = dc * 0.8;
  if(c.id.indexOf('giveback_') === 0) return (c.overdue ? 55 : 15) - distCost * 0.2;
  if(c.id.indexOf('recover_') === 0) return 28 - distCost * 0.5;
  if(c.id.indexOf('mediate_') === 0) return (/mayor/i.test(v.role || '') ? 35 : 20) - distCost * 0.2;
  if(c.id.indexOf('borrow_') === 0 && c.id !== 'borrow_fail') return 20 - distCost * 0.4;
  if(c.id.indexOf('steal_') === 0) return 10 - distCost * 0.3;
  return __score21(v, c);
};

/* ---------- chain wiring ---------- */
if(typeof VERBS !== 'undefined'){
  for(const vb of ['steal', 'borrow', 'giveback', 'mediate']) if(VERBS.indexOf(vb) < 0) VERBS.push(vb);
}
const __pfv21 = planForVerb;
planForVerb = function(v, action){
  const A = action || {};
  if(A.kind === 'steal' || A.kind === 'borrow' || A.kind === 'giveback' || A.kind === 'mediate'){
    if(A.kind === 'steal' || A.kind === 'borrow'){
      let it = A.itemId ? ITEMS[A.itemId] : null;
      let holderName = A.from || null;
      if(it && !holderName) holderName = it.currentHolder;
      if(!it && holderName){
        const hv = findPersonSafe(holderName);
        it = hv ? heldIdentifiedOf(hv, A.what || null)[0] || null : null;
      }
      if(!it || !holderName || holderName === v.name) return { ok: false, reason: 'no target to ' + A.kind };
      return { ok: true, steps: [{ verb: A.kind, itemId: it.id, from: holderName, what: A.what || it.kind }] };
    }
    if(A.kind === 'giveback') return { ok: true, steps: [{ verb: 'giveback', itemId: A.itemId, what: A.what || null }] };
    const dit = A.itemId ? ITEMS[A.itemId] : openDisputes()[0];
    if(!dit || !dit.dispute || dit.dispute.status !== 'open') return { ok: false, reason: 'no open dispute' };
    return { ok: true, steps: [{ verb: 'mediate', itemId: dit.id }] };
  }
  return __pfv21(v, action);
};
const __pt21 = planTick;
planTick = function(v, dtH){
  const step = v.plan && v.plan[0];
  if(step && (step.verb === 'steal' || step.verb === 'borrow' || step.verb === 'giveback' || step.verb === 'mediate')){
    let done = true;
    if(step.verb === 'steal') done = doStealStep(v, step, dtH);
    else if(step.verb === 'borrow') done = doBorrowStep(v, step, dtH);
    else if(step.verb === 'giveback') done = doGivebackStep(v, step, dtH);
    else done = doMediateStep(v, step, dtH);
    step.t = (step.t || 0) + dtH;
    if(done) v.plan.shift();
    return;
  }
  __pt21(v, dtH);
};

/* ---------- simTick hook: missing items, dead holders, overdue loans ---------- */
const __st21 = simTick;
simTick = function(dtH){
  __st21(dtH);
  ownershipTick(dtH);
};

/* ---------- intents: novel ownership verbs are real verbs, not mappings ---------- */
if(typeof INTENT_PATTERNS !== 'undefined'){
  INTENT_PATTERNS.unshift(
    { re: /\bsteal\b(?:\s+the)?\s+([a-z]+)(?:\s+from\s+([a-z]+))?/i,
      plan: (m) => [{ verb: 'steal', what: m[1].toLowerCase(), from: m[2] ? capName(m[2]) : null }] },
    { re: /\bborrow\b(?:\s+the)?\s+([a-z]+)(?:\s+from\s+([a-z]+))?/i,
      plan: (m) => [{ verb: 'borrow', what: m[1].toLowerCase(), from: m[2] ? capName(m[2]) : null }] },
    { re: /\b(?:return|give\s+back)\b(?:\s+the)?\s+([a-z]+)(?:\s+to\s+([a-z]+))?/i,
      plan: (m) => [{ verb: 'giveback', what: m[1].toLowerCase() }] },
    { re: /\bmediat(?:e|ion|or)\b/i,
      plan: (m) => [{ verb: 'mediate' }] }
  );
}

/* ---------- AI bridge: query ownership without leaking world truth ---------- */
/* Bridge boundary for the world transfer log: stored events are world truth
   (sim internals keep reading them raw), but the future AI brain must never
   learn true ownership from them — e.g. an UNWITNESSED theft's result string
   "X stole from Y; ownership stays Y" names the true owner. Sanitize COPIES
   at the bridge; the stored events are never mutated. */
const OWNERSHIP_LEAK_PATTERNS = [
  /;\s*ownership stays\b[^;]*/i,    /* steal: "; ownership stays X" */
  /\s*\(owner still\b[^)]*\)/i,      /* find:  " (owner still X)" */
  /\s*\(still owned by\b[^)]*\)/i   /* abandon: " (still owned by X)" */
];
function sanitizeTransferEventForBridge(ev){
  const c = Object.assign({}, ev);
  if(Array.isArray(ev.witnesses)) c.witnesses = ev.witnesses.slice();
  if(typeof c.result === 'string'){
    for(const re of OWNERSHIP_LEAK_PATTERNS) c.result = c.result.replace(re, '');
    c.result = c.result.replace(/\s+/g, ' ').trim();
  }
  return c;
}
if(typeof window !== 'undefined' && window.__aiBridge){
  /* Public summary: NEVER carries actualOwner (world truth). Only possession
     (currentHolder — observable in-world) and, when a viewer name is passed,
     that character's own belief about ownership. Sim internals keep using the
     raw ITEMS registry directly; the bridge is for the future external brain,
     which must know exactly what its character knows — never the truth. */
  const pubSummary = (it, viewerName) => {
    const s = summarizeItem(it);
    if(!s) return null;
    s.believedOwner = null; s.beliefConfidence = 0;
    if(viewerName && typeof getOwnershipBelief === 'function'){
      const vv = findPersonSafe(viewerName);
      const ob = vv ? getOwnershipBelief(vv, it.id) : null;
      if(ob){ s.believedOwner = ob.knownOwner || ob.suspectedOwner || null; s.beliefConfidence = ob.confidence || 0; }
    }
    return s;
  };
  window.__aiBridge.getItem = (a, b) => {
    // getItem(itemId) — viewer-less public summary (never has actualOwner), or
    // getItem(viewerName, itemId) — belief-scoped for that character
    let viewerName = null, id = a;
    if(b != null){ viewerName = a; id = b; }
    const it = id ? ITEMS[id] : null;
    return it ? pubSummary(it, viewerName) : null;
  };
  window.__aiBridge.getLineage = (id) => getLineage(id); // material ancestry only; no ownership fields
  window.__aiBridge.listIdentified = (viewerName) => Object.keys(ITEMS).map(id => pubSummary(ITEMS[id], viewerName));
  window.__aiBridge.itemsHeldBy = (holderName, viewerName) => itemsHeldBy(holderName).map(it => pubSummary(it, viewerName));
  window.__aiBridge.getTransferLog = (n) =>
    WORLD_TRANSFER_LOG.slice(-(n || 20)).map(sanitizeTransferEventForBridge);
  window.__aiBridge.openDisputes = (viewerName) => openDisputes().map(it => pubSummary(it, viewerName));
  window.__aiBridge.getOverdueBorrows = (viewerName) => getOverdueBorrows().map(it => pubSummary(it, viewerName));
  window.__aiBridge.raiseItemClaim = (name, itemId, text) => {
    const cv = findPersonSafe(name);
    return cv ? raiseItemClaim(cv, itemId, { text }) : { ok: false, reason: 'no claimant' };
  };
  window.__aiBridge.resolveItemDispute = (itemId, decider) => resolveDispute(itemId, decider);
  /* Belief-scoped lookup: what THIS character believes. A stranger's lookup
     never reveals actualOwner — only their own (possibly empty) beliefs. */
  window.__aiBridge.getOwnershipBeliefAs = (viewerName, itemId) => {
    const vv = findPersonSafe(viewerName);
    if(!vv || typeof getOwnershipBelief !== 'function') return null;
    const ob = getOwnershipBelief(vv, itemId);
    if(!ob) return null;
    return { targetId: ob.targetId, knownOwner: ob.knownOwner, suspectedOwner: ob.suspectedOwner,
             confidence: ob.confidence, evidence: (ob.evidence || []).slice(), claims: (ob.claims || []).length };
  };
}
