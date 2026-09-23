/* =====================================================================
   PART 41B: GAME SYSTEMS — TWO-CURRENCY LEDGER
   rw-game-design-2026-09-22 §6: two currencies that NEVER mix.

   - credits  (meta): player agency. Bought with real money / earned via
     ads. Accounts keyed by player id ('p:*' convention, not enforced).
   - dollars  (in-world): rent, wages, groceries. Accounts keyed by entity
     id — cast id ('C6'), hired-character id, business id ('landlord',
     'haus-coffee').

   Rules:
   - Append-only transaction log GS_LEDGER.txns; balances are derived views.
   - Dollars are conserved: moves go account->account except explicit
     'mint'/'burn' admin faucets (marked in the log; admin-only).
   - Credits are likewise conserved; refunds are explicit txns.
   - No fractional units — integers only. Deterministic, no Math.random.
   ===================================================================== */

const GS_LEDGER = {
  credits: {},   // playerId -> int balance
  dollars: {},   // entityId -> int balance
  txns: [],      // {n, cur, from, to, amt, reason, stamp}
  seq: 0,
};
const GS_LOW_CREDIT = 50;  // low-balance warning threshold (design §5.4)

function gsLedgerReset(){
  GS_LEDGER.credits = {}; GS_LEDGER.dollars = {};
  GS_LEDGER.txns.length = 0; GS_LEDGER.seq = 0;
}

function gsBalance(cur, id){
  const T = (cur === 'credits') ? GS_LEDGER.credits : GS_LEDGER.dollars;
  return T[id] || 0;
}
function gsCreditBalance(pid){ return gsBalance('credits', pid); }
function gsDollarBalance(id){ return gsBalance('dollars', id); }
function gsLowCredit(pid){ return gsCreditBalance(pid) < GS_LOW_CREDIT; }

/* internal: append a txn and update balances. from/to may be 'mint'/'burn'. */
function gsPostTxn(cur, from, to, amt, reason){
  amt = Math.floor(amt);
  if(!(amt > 0) || !to) return null;
  const T = (cur === 'credits') ? GS_LEDGER.credits : GS_LEDGER.dollars;
  if(from !== 'mint'){
    if((T[from] || 0) < amt) return null;      // insufficient: atomic no-op
    T[from] -= amt;
  }
  if(to !== 'burn') T[to] = (T[to] || 0) + amt;
  const txn = { n: ++GS_LEDGER.seq, cur, from, to, amt,
                reason: reason || '', stamp: gsStamp() };
  GS_LEDGER.txns.push(txn);
  return txn;
}

/* ---- credits (player agency) ---- */
function gsCreditGrant(pid, amt, reason){   // purchase / ad reward / admin top-up
  return gsPostTxn('credits', 'mint', pid, amt, reason || 'grant');
}
function gsCreditSpend(pid, amt, reason){   // returns txn or null (insufficient)
  return gsPostTxn('credits', pid, 'burn', amt, reason || 'spend');
}
function gsCreditRefund(pid, amt, reason){
  return gsPostTxn('credits', 'mint', pid, amt, reason || 'refund');
}

/* ---- game dollars (rent / wages / in-world) ---- */
function gsDollarGrant(id, amt, reason){    // admin faucet — wages enter via employers
  return gsPostTxn('dollars', 'mint', id, amt, reason || 'grant');
}
function gsDollarPay(from, to, amt, reason){
  return gsPostTxn('dollars', from, to, amt, reason || 'payment');
}

/* rent collection through the registry: active lease -> tenant pays the
   building's owner_id in dollars. Admin tooling calls this. */
function gsCollectRent(unitId, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l || l.status !== 'active' || !(l.monthly_rent > 0))
    return { ok: false, reason: 'no_active_lease' };
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  const b = u && (typeof gsBldById === 'function' ? gsBldById(u.bld_id) : null);
  const owner = (u && u.owner_id) || (b && b.owner_id) || 'landlord';
  const txn = gsDollarPay(l.tenant_id, owner, l.monthly_rent,
                          'rent ' + (opts && opts.period || ''));
  if(!txn) return { ok: false, reason: 'insufficient_dollars',
                    tenant: l.tenant_id, due: l.monthly_rent };
  return { ok: true, txn, tenant: l.tenant_id, owner, amt: l.monthly_rent };
}

/* conservation probes for tests/audit */
function gsLedgerTotal(cur){
  const T = (cur === 'credits') ? GS_LEDGER.credits : GS_LEDGER.dollars;
  let s = 0; for(const k in T) s += T[k];
  return s;
}
function gsLedgerSnapshot(){
  return JSON.stringify({ credits: GS_LEDGER.credits, dollars: GS_LEDGER.dollars,
                          txns: GS_LEDGER.txns, seq: GS_LEDGER.seq });
}
function gsLedgerLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d || !d.credits || !d.dollars || !Array.isArray(d.txns)) return false;
    GS_LEDGER.credits = d.credits; GS_LEDGER.dollars = d.dollars;
    GS_LEDGER.txns = d.txns; GS_LEDGER.seq = d.seq || d.txns.length;
    return true;
  }catch(e){ return false; }
}
