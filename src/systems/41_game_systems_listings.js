/* =====================================================================
   PART 41J — THE DEED OFFICE (v10 listings)

   In-world real-estate listings for the tenant→owner arc (roadmap v10,
   world/market.json, world/lease-ui.md, monetization §2.4):

   - LISTINGS — a sale or rent card on a real registry address. Unit
     listings live in GS_LISTINGS (the bus owns the map); whole-building
     sale listings live in GS_BLD_LISTINGS. A listing can be quietly
     shopped (a pocket listing — the card exists for the deal flow but
     never reaches the public board or the wire; the block finds out
     when it sells).
   - PURCHASE — offer at asking, first accepted wins, no bidding
     (leases.json purchase rules). Price moves through the dollar ledger;
     a deed fee in credits lands with the county (studio/1br/flat/house
     = 1000/2000/3500/5000 — monetization §2.4). Seller-carried financing
     when the seller offers it (params.finance + listing.carriesNote).
   - TITLE — a sale writes `owner_id` on the unit or building record and
     records a GS_DEEDS entry. It is NOT a lease; a buying tenant's own
     lease flips to 'owner-occupied' and rent stops (lease-ui §power map:
     "purchase transitions an active tenancy to owner occupancy, rent
     replaced by tax/HOA obligations").
   - OBLIGATIONS — gsDeedTick runs the monthly book: seller-carried
     mortgage to the note holder, property tax to 'city', HOA dues to
     the building's fund — all game dollars, all partial-payable, all
     accruing arrears on a miss. Two missed months make a deed
     foreclosable; gsAdminForeclose (admin only) reverts title to the
     note holder and prints the public line.
   - LICENSE — the licensed-landlord tier (leases.json): own a deeded
     door for 30+ days with a clean record, file `license` (2000cr),
     get the capped toolbox (own doors only: notice / band-capped raise /
     statement / eviction FILING — the owner still evicts).
   - THE DRAMA CASE — Victor's two Guerrero buildings (9418 duplex,
     9457 3-flat) are quietly shopped at seed: pocket listings that sit
     invisible until a sale prints. The board cards at 9418-B / 9457-2 /
     9127 Capp-A are the world's live rental listings.

   Listing text never exposes the address-generation rule: cards carry
   the registry address string and generated boilerplate only — no
   hash, index, or formula language, ever. No Math.random anywhere.
   ===================================================================== */

/* ---------------- configuration (real-life-faithful defaults) -------- */
const GS_DEED_CFG = {
  rate: 0.068,          // seller-carried note: fixed 6.8%
  termY: 30,            // years; params.finance.years may narrow 5..30
  minDownPct: 20,       // floor for a carried note
  taxRate: 0.0118,      // ~1.18% of assessed per year, monthly billed
  taxTo: 'city',        // the county's ledger account
  licenseCr: 2000,      // landlord license fee (leases.json)
  licenseOwnDays: 30,   // own a deeded door this long first
  forecloseMisses: 2,   // two missed months before the holder can file
  grm: 144,             // whole-building ask = gross rent x 12 years
};
/* deed fee in CREDITS by ladder tier (monetization §2.4 — the fee is
   agency-layer; the price and the obligations are game dollars). */
const GS_DEED_FEE = { studio: 1000, '1br': 2000, flat: 3500, house: 5000 };
const GS_HOA_MO = { studio: 220, '1br': 320, flat: 480, house: 550 };

/* ---------------- state ----------------
   GS_LISTINGS (unit listings) stays owned by the request bus — the v1
   map key is the unit id. Building-scope sale listings live here.

   GS_LST_ARMED is a `var` on purpose: registry/leases hook into the deed
   office via typeof-guarded calls that CAN fire during load (gsSignLease
   runs inside gsSeedSF, before this module's consts are initialized — a
   hoisted function body would hit TDZ). A var reads `undefined` in that
   window, so the hooks no-op until the office actually exists. */
var GS_LST_ARMED = false;
const GS_BLD_LISTINGS = {};   // bldId -> listing record (sale only)
const GS_DEEDS = {};          // unitId|bldId -> deed record
const GS_DEED_LOG = [];       // append-only transfer record (public book)
const GS_LICENSES = {};       // playerId -> {sinceMin, sinceDay}
const GS_LST_SEQ = { n: 0 };
const GS_DEED_TICK = { lastDay: null };

/* ---------------- listing card copy (generated, formula-free) --------
   Deterministic boilerplate — an honest strength, an honest flaw, and
   only parody/public place names. The address rides as a data field;
   how it was minted is never text. */
const GS_LST_BEDS = ['a studio', 'a one-bedroom flat',
                     'a two-bedroom flat', 'a three-bedroom flat'];
const GS_LST_STRONG = [
  'morning light on the bay windows',
  'quiet rear unit, off the street',
  'fresh paint, old bones',
  'laundry in the building',
  'a shared backyard with a lemon tree',
  'high ceilings, drafty in a good way',
  'the hall smells like bread on Sundays',
  'thick walls — you never hear the neighbors',
];
const GS_LST_FLAW = [
  'the stairs are a climb',
  'street noise on weekend nights',
  'a kitchen you cook in, not entertain in',
  'no parking — this is the Mission',
  'the radiator clangs at five in the morning',
  'garden level — dim at noon',
  'the hall light flickers',
  'one closet, and it is ambitious',
];
const GS_LST_NEAR = [
  'Mudhaus Coffee', 'Dolores Perk', 'Buy-Rite Market', 'El Farolote',
  'the 600 Club', 'Marooned Records', 'Baguette About It',
  'Il Delfino', "Malik's Mini Mart", 'the Mission Branch Library',
  'Dolores Park', 'Clarion Alley', 'Golden Hour Laundromat',
];
function gsLstMoney(n){
  return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function gsListingTier(id){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  if(u){
    const bd = u.bedrooms != null ? u.bedrooms : 1;
    return bd <= 0 ? 'studio' : bd === 1 ? '1br' : bd === 2 ? 'flat'
                                                           : 'house';
  }
  return 'house';                     // whole buildings are the big deed
}
function gsDeedFeeFor(id){ return GS_DEED_FEE[gsListingTier(id)]; }
function gsHoaMoFor(id){ return GS_HOA_MO[gsListingTier(id)] || 0; }
function gsBedsWord(u){
  const bd = u && u.bedrooms != null ? u.bedrooms : 1;
  return GS_LST_BEDS[Math.min(bd, 3)];
}
function gsLstPick(arr, seed, off){
  return arr[(hashString18(seed) + (off || 0)) % arr.length];
}
function gsListingCopy(id, o){
  o = o || {};
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id)
              : ((typeof gsBldById === 'function') ? gsBldById(id) : null);
  const strong = gsLstPick(GS_LST_STRONG, id + '|s');
  const flaw = gsLstPick(GS_LST_FLAW, id + '|f');
  const near = gsLstPick(GS_LST_NEAR, id + '|n');
  let t;
  if(u){
    t = gsBedsWord(u).charAt(0).toUpperCase() + gsBedsWord(u).slice(1) +
        ' — ' + strong + '. Honest flaw: ' + flaw +
        '. Two blocks from ' + near + '.';
  } else {
    const n = b ? b.units.length : 0;
    t = 'A ' + ((b && b.style) || 'building') + ' — ' + n +
        (n === 1 ? ' door' : ' doors') + ' under one deed. ' +
        strong.charAt(0).toUpperCase() + strong.slice(1) +
        '. Honest flaw: ' + flaw + '. Walking distance to ' + near + '.';
  }
  if(o.kind === 'rent')
    t += ' ' + gsLstMoney(o.ask) + '/mo, first month and deposit.';
  else
    t += ' Asking ' + gsLstMoney(o.ask) +
         ' — offer at asking, no bidding' +
         (o.carriesNote ? '; the owner carries a note for the right buyer.'
                        : '; cash sale.');
  return t;
}

/* ---------------- shared lookups ---------------- */
function gsTitleOwnerOf(id){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  if(u){
    const b = gsBldById(u.bld_id);
    return u.owner_id || (b && b.owner_id) || 'landlord';
  }
  const b = (typeof gsBldById === 'function') ? gsBldById(id) : null;
  return (b && b.owner_id) || 'landlord';
}
function gsListingOf(id){
  return GS_LISTINGS[id] || GS_BLD_LISTINGS[id] || null;
}
/* does `pid` control this title? direct ownership, a hired character's
   title, or the admin landlord role (owner acts for 'landlord' stock) */
function gsListingOwns(pid, ownerId){
  if(!ownerId) ownerId = 'landlord';
  if(ownerId === pid) return true;
  if(gsIsAdmin(pid) && ownerId === 'landlord') return true;
  if(typeof gsHiredOwner === 'function' &&
     gsHiredOwner(ownerId) === pid) return true;
  return false;
}
/* structural checks shared by the request lane and the clerk's desk —
   ownership is the caller's problem */
function gsListingCheck(id, kind){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id)
              : ((typeof gsBldById === 'function') ? gsBldById(id) : null);
  if(!u && !b) return 'unknown_unit';
  if(b && b.offmap) return 'unit_offmap';
  if(b && b.status !== 'standing') return 'unit_not_livable';
  if(u){
    if(!gsUnitLivable(u)) return 'unit_not_livable';
    if(GS_LISTINGS[u.id]) return 'already_listed';
    if(GS_BLD_LISTINGS[u.bld_id] && kind !== 'rent')
      return 'bld_listed';           // the whole deed is already shopped
    if(kind === 'rent' && gsActiveLease(u.id)) return 'unit_occupied';
    return true;
  }
  /* whole-building: you sell the deed; the flats inside keep renting
     (a rent card on a member unit coexists with the building listing) */
  if(kind === 'rent') return 'bld_rent';
  if(GS_BLD_LISTINGS[b.id]) return 'already_listed';
  for(const uid of b.units){
    const l = GS_LISTINGS[uid];
    if(l && (!l.kind || l.kind === 'sale')) return 'unit_listed';
  }
  return true;
}
function gsBldAskPrice(b){
  let gross = 0;
  for(const uid of b.units){
    const u = gsUnitById(uid);
    gross += (u && u.base_rent) || 0;
  }
  const ask = Math.round(gross * GS_DEED_CFG.grm / 5000) * 5000;
  return ask > 0 ? ask : 250000;
}
function gsMkListing(id, o){
  o = o || {};
  const kind = o.kind === 'rent' ? 'rent' : 'sale';
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id) : gsBldById(id);
  const ask = (o.ask > 0) ? Math.floor(o.ask)
    : (kind === 'rent' ? ((u && u.base_rent) || 0)
                       : (u ? (u.base_rent || 0) * 150
                            : gsBldAskPrice(b)));
  return {
    scope: u ? 'unit' : 'building',
    kind, ask,
    by: o.by || 'landlord',
    sinceMin: (o.now != null ? o.now
              : (typeof gsNowMin === 'function' ? gsNowMin() : 0)),
    reqId: o.reqId || null,
    address: u ? gsAddressOfUnit(u.id) : (b && b.address),
    quiet: !!o.quiet,
    carriesNote: kind === 'sale' && !!o.carriesNote,
    auto: !!o.auto,
    copy: gsListingCopy(id, { kind, ask,
      carriesNote: kind === 'sale' && !!o.carriesNote }),
    sellerLine: o.sellerLine || null,
  };
}

/* ---------------- feed (housing lines, neutral wording) ------------- */
function gsLstFeed(action, id, extra){
  if(typeof gsBusEmit !== 'function') return null;
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id)
              : ((typeof gsBldById === 'function') ? gsBldById(id) : null);
  return gsBusEmit('lease', { playerId: 'owner', kind: 'lease', id: null,
    target: id, _now: null },
    Object.assign({ action, unit: u ? id : null, bld: u ? null : id,
      address: u ? gsAddressOfUnit(id) : (b && b.address),
      tier: gsListingTier(id) }, extra || {}));
}
/* complete the seller's live listing request (the deal consumed it) */
function gsListingDone(l, now){
  const req = l && l.reqId &&
    (typeof gsRequestById === 'function') && gsRequestById(l.reqId);
  if(req && req.status === 'active'){
    req.status = 'completed'; req._now = now;
    req.usedMin = now != null ? now - (req.startMin || now) : 0;
    req.fxOn = false;
    gsBusEmit('complete', req, { sold: true, usedMin: req.usedMin });
  }
}

/* ---------------- the clerk's desk (world/admin tools) --------------
   These are owner-tooling — a character or the world acts through them,
   never through the request bus. Every public move posts to the feed. */
function gsListUnit(id, opts){
  opts = opts || {};
  const kind = opts.kind === 'rent' ? 'rent' : 'sale';
  const why = gsListingCheck(id, kind);
  if(why !== true) return { ok: false, reason: why };
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const l = gsMkListing(id, {
    kind, ask: opts.ask, by: opts.by || gsTitleOwnerOf(id),
    quiet: opts.quiet, carriesNote: opts.carriesNote, auto: opts.auto,
    sellerLine: opts.sellerLine
      ? ((typeof gsWireRedact === 'function')
         ? gsWireRedact(String(opts.sellerLine).trim())
         : String(opts.sellerLine).trim()) : null,
  });
  if(u) GS_LISTINGS[u.id] = l; else GS_BLD_LISTINGS[id] = l;
  if(!l.quiet) gsLstFeed('listed', id, { lkind: l.kind });
  return { ok: true, listing: l };
}
/* a pocket listing — the card exists for whoever the seller shows it
   to; the board and the wire never see it. The sale reveals it. */
function gsQuietShop(id, opts){
  return gsListUnit(id, Object.assign({ quiet: true, carriesNote: true },
                                      opts || {}));
}
function gsDelist(id, opts){
  opts = opts || {};
  const l = GS_LISTINGS[id] || GS_BLD_LISTINGS[id];
  if(!l) return { ok: false, reason: 'not_listed' };
  if(GS_LISTINGS[id]) delete GS_LISTINGS[id];
  else delete GS_BLD_LISTINGS[id];
  gsListingDone(l, gsNowMin());
  if(!l.quiet) gsLstFeed('delisted', id, {});
  return { ok: true };
}
/* hooks the registry/lease layer calls (typeof-guarded there) — the
   vacancy wheel: turnover posts the card, a signature consumes it. */
function gsListingFulfilled(unitId){
  if(GS_LST_ARMED !== true) return;   // pre-load lease signs (seed) — no board yet
  const l = GS_LISTINGS[unitId];
  if(!l || (l.kind && l.kind !== 'rent')) return;
  delete GS_LISTINGS[unitId];
  gsLstFeed('filled', unitId, {});
  gsListingDone(l, (typeof gsNowMin === 'function') ? gsNowMin() : null);
}
function gsListingTurnover(unitId){
  if(GS_LST_ARMED !== true) return;
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  if(!u || !gsUnitVacant(u)) return;
  const b = gsBldById(u.bld_id);
  if(!b || b.offmap) return;
  if(GS_LISTINGS[unitId]) return;
  /* a rent card appears under the unit's owner — the turnover line that
     just posted IS the announcement; no second wire line. A building
     sale listing (quiet or not) doesn't block the vacancy's card. */
  GS_LISTINGS[unitId] = gsMkListing(unitId, {
    kind: 'rent', by: gsTitleOwnerOf(unitId), auto: true });
}
function gsListingWithdraw(id, why){
  if(GS_LST_ARMED !== true) return;
  /* destructive registry ops pull every affected card. A public card
     prints 'delisted'; a pocket listing disappears silently. */
  const kill = (map, k) => {
    const l = map[k];
    if(!l) return;
    delete map[k];
    if(l.reqId && typeof gsCancelRequest === 'function')
      try{ gsCancelRequest(l.reqId,
        (typeof gsNowMin === 'function') ? gsNowMin() : null,
        'admin'); }catch(e){}
    if(!l.quiet) gsLstFeed('delisted', k, { why: why || null });
  };
  kill(GS_LISTINGS, id); kill(GS_BLD_LISTINGS, id);
}

/* ---------------- the request lane (bus delegates here) ------------- */
function gsListingAllow(r, now){
  const p = r.params || {};
  const kind = p.kind === 'rent' ? 'rent' : 'sale';
  const chk = gsListingCheck(r.target, kind);
  if(chk !== true) return chk;
  const owner = gsTitleOwnerOf(r.target);
  if(!gsListingOwns(r.playerId, owner)) return 'not_owner';
  return true;
}
function gsListingActivate(r, now){
  const why = gsListingAllow(r, now);
  if(why !== true) return { ok: false, reason: why };
  const p = r.params || {};
  const u = (typeof gsUnitById === 'function') ? gsUnitById(r.target) : null;
  const l = gsMkListing(r.target, {
    kind: p.kind === 'rent' ? 'rent' : 'sale', ask: p.ask,
    by: r.playerId, quiet: p.quiet, carriesNote: p.carriesNote,
    reqId: r.id, now,
    sellerLine: (typeof p.note === 'string' && p.note.trim())
      ? ((typeof gsWireRedact === 'function')
         ? gsWireRedact(p.note.trim()) : p.note.trim()) : null,
  });
  if(l.ask <= 0) return { ok: false, reason: 'bad_price' };
  if(u) GS_LISTINGS[u.id] = l; else GS_BLD_LISTINGS[r.target] = l;
  return true;
}
/* bus deactivation: pulls whichever card this request posted */
function gsListingOff(r){
  const bl = GS_BLD_LISTINGS[r.target];
  if(bl && bl.reqId === r.id) delete GS_BLD_LISTINGS[r.target];
  const l = GS_LISTINGS[r.target];
  if(l && l.reqId === r.id) delete GS_LISTINGS[r.target];
}

/* ---------------- purchase ---------------- */
function gsMortgageMath(price, downPct, years){
  const down = Math.round(price * downPct / 100);
  const principal = Math.max(0, price - down);
  const r = GS_DEED_CFG.rate / 12, n = years * 12;
  const f = Math.pow(1 + r, n);
  const monthly = Math.round(principal * r * f / (f - 1));
  return { down, principal, rate: GS_DEED_CFG.rate, termM: n, monthly };
}
/* the seller's own note must clear out of the proceeds before title
   moves — escrow rule. Returns principal still owed (0 = clean). */
function gsDeedPayoff(id){
  const d = GS_DEEDS[id];
  if(!d || d.status !== 'active' || !d.mortgage) return 0;
  return d.mortgage.status === 'active' ? (d.mortgage.remaining || 0) : 0;
}
/* validate + compute the financing a buy filing asks for */
function gsBuyFinance(p, l, price){
  if(!p || !p.finance) return { fin: null };
  if(!l.carriesNote) return { err: 'cash_only' };
  const o = (typeof p.finance === 'object') ? p.finance : {};
  const dp = (o.downPct != null) ? +o.downPct : GS_DEED_CFG.minDownPct;
  if(!(dp >= GS_DEED_CFG.minDownPct && dp <= 100)) return { err: 'low_down' };
  const yrs = (o.years != null) ? +o.years : GS_DEED_CFG.termY;
  if(!(yrs >= 5 && yrs <= 30)) return { err: 'bad_term' };
  return { fin: gsMortgageMath(price, dp, yrs) };
}
function gsBuyAllow(r, now){
  const p = r.params || {};
  const l = gsListingOf(r.target);
  if(!l) return 'not_listed';
  if(l.kind === 'rent') return 'not_for_sale';
  const buyer = p.buyerId;
  if(!buyer || gsHiredOwner(buyer) !== r.playerId) return 'buyer_not_hired';
  if(gsHiredOwner(buyer) === l.by) return 'self_deal';
  if(gsTitleOwnerOf(r.target) === buyer) return 'already_owned';
  if(p.offer != null && Math.floor(p.offer) !== l.ask)
    return 'at_asking_only';
  const f = gsBuyFinance(p, l, l.ask);
  if(f.err) return f.err;
  const due = f.fin ? f.fin.down : l.ask;
  if(gsDollarBalance(buyer) < due) return 'insufficient_dollars';
  if(!gsIsAdmin(r.playerId) &&
     gsCreditBalance(r.playerId) < gsDeedFeeFor(r.target))
    return 'insufficient_credits';
  return true;
}
function gsListingBuy(r, now){
  const p = r.params || {};
  const key = r.target;
  const l = gsListingOf(key);
  if(!l) return { ok: false, reason: 'not_listed' };
  if(l.kind === 'rent') return { ok: false, reason: 'not_for_sale' };
  const u = (typeof gsUnitById === 'function') ? gsUnitById(key) : null;
  const b = u ? gsBldById(u.bld_id) : gsBldById(key);
  if(u && !gsUnitLivable(u)) return { ok: false, reason: 'unit_not_livable' };
  if(b && b.status !== 'standing')
    return { ok: false, reason: 'unit_not_livable' };
  const buyer = p.buyerId;
  if(!buyer || gsHiredOwner(buyer) !== r.playerId)
    return { ok: false, reason: 'buyer_not_hired' };
  const seller = gsTitleOwnerOf(key);
  if(gsHiredOwner(buyer) === l.by || seller === buyer)
    return { ok: false, reason: 'self_deal' };
  if(p.offer != null && Math.floor(p.offer) !== l.ask)
    return { ok: false, reason: 'at_asking_only' };
  const price = l.ask;
  const payoff = gsDeedPayoff(key);
  const f = gsBuyFinance(p, l, price);
  if(f.err) return { ok: false, reason: f.err };
  const due = f.fin ? f.fin.down : price;
  /* the seller's carried note settles out of what lands today —
     an underwater seller cannot close (real escrow honesty) */
  if(payoff > due) return { ok: false, reason: 'seller_underwater' };
  if(gsDollarBalance(buyer) < due)
    return { ok: false, reason: 'insufficient_dollars' };
  const fee = gsIsAdmin(r.playerId) ? 0 : gsDeedFeeFor(key);
  if(fee > 0 && gsCreditBalance(r.playerId) < fee)
    return { ok: false, reason: 'insufficient_credits' };

  /* ---- everything verified; now the escrow performs ---- */
  if(fee > 0) gsCreditSpend(r.playerId, fee, 'deed fee ' + l.address);
  const oldDeed = GS_DEEDS[key];
  const oldHolder = oldDeed && oldDeed.mortgage &&
    oldDeed.mortgage.status === 'active' ? oldDeed.mortgage.holder : null;
  if(payoff > 0 && oldHolder)
    gsDollarPay(buyer, oldHolder, payoff, 'note payoff ' + l.address);
  if(due - payoff > 0)
    gsDollarPay(buyer, seller, due - payoff, 'purchase ' + l.address);

  /* title — owner_id on the record, never a lease */
  if(u) u.owner_id = buyer; else b.owner_id = buyer;

  const today = (typeof gsTodayStr === 'function' && gsTodayStr()) || null;
  const closeDay = (p.date && gsDateParse(p.date)) ? p.date : today;
  const dd = gsDateParse(closeDay);
  const deed = {
    scope: u ? 'unit' : 'building', id: key,
    owner: buyer, seller, price, feeCr: fee,
    sinceMin: now, sinceDay: closeDay,
    dueDay: dd ? dd.d : 1,
    taxMo: Math.round(price * GS_DEED_CFG.taxRate / 12),
    hoaMo: u ? gsHoaMoFor(key) : 0,
    hoaTo: b ? ('hoa:' + b.id) : null,
    mortgage: f.fin ? {
      holder: seller, principal: f.fin.principal,
      remaining: f.fin.principal, rate: f.fin.rate, termM: f.fin.termM,
      monthly: f.fin.monthly, paidN: 0, status: 'active',
    } : null,
    owed: { mortgage: 0, tax: 0, hoa: 0 },
    missedN: 0, lastPeriod: null, status: 'active',
  };
  if(oldDeed && oldDeed.status === 'active'){
    oldDeed.status = 'sold'; oldDeed.soldOn = closeDay;
    oldDeed.soldTo = buyer;
    if(oldDeed.mortgage) oldDeed.mortgage.status = 'closed';
  }
  GS_DEEDS[key] = deed;
  GS_DEED_LOG.push({ n: ++GS_LST_SEQ.n, id: key, scope: deed.scope,
    from: seller, to: buyer, price, day: closeDay,
    quiet: !!l.quiet, financed: !!f.fin });

  /* consume the card — and a building sale pulls its member cards too
     (the new owner decides what goes back on the board) */
  delete GS_LISTINGS[key]; delete GS_BLD_LISTINGS[key];
  if(b && !u)
    for(const uid of b.units){
      const ml = GS_LISTINGS[uid];
      if(ml){ delete GS_LISTINGS[uid]; gsListingDone(ml, now); }
    }
  gsListingDone(l, now);

  /* the buying tenant becomes the owner-occupant — the lease row keeps
     its history, rent stops (lease-ui: purchase transitions the
     tenancy, rent replaced by tax/HOA obligations) */
  const lease = u && (typeof gsActiveLease === 'function') &&
    gsActiveLease(u.id);
  if(lease && lease.tenant_id === buyer){
    lease.wasRent = lease.monthly_rent;
    lease.monthly_rent = 0;
    lease.status = 'owner-occupied';
    lease.ownerOccupied = closeDay;
    if(typeof gsLeaseEnsure === 'function') gsLeaseEnsure(lease);
  }
  if(typeof gsRepNote === 'function')
    gsRepNote(buyer, 'deed', 0, { id: key, price, day: closeDay }, now);
  gsBusEmit('sale', r, { unit: u ? u.id : null, bld: u ? null : key,
    address: l.address, price, buyer, quiet: !!l.quiet });
  return true;
}

/* ---------------- the monthly obligation book ----------------
   One run per period per deed, on the deed's due day: mortgage to the
   note holder first, then the county, then the association fund.
   Partial payment is real — the shortfall lands in the owed buckets,
   and a month with any shortfall counts a miss. Two misses make the
   deed foreclosable; curing arrears resets the clock. All game
   dollars — credits never touch this. */
function gsDeedPayee(deed, kind){
  if(kind === 'mortgage') return deed.mortgage ? deed.mortgage.holder : 'city';
  if(kind === 'tax') return GS_DEED_CFG.taxTo;
  return deed.hoaTo || 'landlord';
}
function gsDeedCharges(deed){
  const out = [];
  if(deed.mortgage && deed.mortgage.status === 'active' &&
     deed.mortgage.remaining > 0)
    out.push({ kind: 'mortgage', amt: deed.mortgage.monthly,
               to: deed.mortgage.holder });
  if(deed.taxMo > 0)
    out.push({ kind: 'tax', amt: deed.taxMo, to: GS_DEED_CFG.taxTo });
  if(deed.hoaMo > 0 && deed.hoaTo){
    const u = (typeof gsUnitById === 'function') ? gsUnitById(deed.id) : null;
    const b = u && gsBldById(u.bld_id);
    /* you don't pay dues to yourself — owning the building makes you
       the association */
    if(b && b.owner_id !== deed.owner)
      out.push({ kind: 'hoa', amt: deed.hoaMo, to: deed.hoaTo });
  }
  return out;
}
function gsDeedArrears(deed){
  const o = deed.owed || {};
  return (o.mortgage || 0) + (o.tax || 0) + (o.hoa || 0);
}
function gsDeedTick(dateStr){
  const d = (typeof gsDateParse === 'function') && gsDateParse(dateStr);
  if(!d) return null;
  const period = gsPeriodOf(dateStr);
  const res = { day: dateStr, period, due: [], paid: [], missed: [],
                foreclosable: [] };
  for(const key in GS_DEEDS){
    const deed = GS_DEEDS[key];
    if(deed.status !== 'active') continue;
    /* one run per period — a back-dated tick can't re-run a month the
       deed already lived through ('YYYY-MM' sorts chronologically) */
    if(deed.lastPeriod && deed.lastPeriod >= period) continue;
    if(d.d < (deed.dueDay || 1)) continue;         // not due yet
    for(const it of gsDeedCharges(deed)){
      const bal = gsDollarBalance(deed.owner);
      const pay = Math.min(it.amt, Math.max(0, bal));
      if(pay > 0)
        gsDollarPay(deed.owner, it.to, pay, it.kind + ' ' + period);
      const short = it.amt - pay;
      if(short > 0)
        deed.owed[it.kind] = (deed.owed[it.kind] || 0) + short;
      res.paid.push({ id: key, kind: it.kind, amt: pay,
                      short: short || 0 });
      if(it.kind === 'mortgage' && deed.mortgage){
        const m = deed.mortgage;
        const interest = Math.round(m.remaining * m.rate / 12);
        const princPaid = Math.min(m.remaining, Math.max(0, pay - interest));
        m.remaining -= princPaid;
        m.paidN = (m.paidN || 0) + 1;
        if(m.remaining <= 0){ m.remaining = 0; m.status = 'paid_off'; }
      }
    }
    if(gsDeedArrears(deed) > 0)
      deed.missedN = (deed.missedN || 0) + 1;
    deed.lastPeriod = period;
    res.due.push(key);
    if((deed.missedN || 0) >= GS_DEED_CFG.forecloseMisses)
      res.foreclosable.push(key);
    if(gsDeedArrears(deed) > 0)
      res.missed.push({ id: key, owed: gsDeedArrears(deed) });
  }
  return res;
}
/* pay down arrears — oldest bucket order: the note, then the county,
   then the association. A full cure resets the miss counter. */
function gsPayDeed(id, amt, dateStr){
  const d = GS_DEEDS[id];
  if(!d || !d.owed) return { ok: false, reason: 'no_deed' };
  const total = gsDeedArrears(d);
  if(!(total > 0)) return { ok: false, reason: 'nothing_owed' };
  const pay = Math.min(Math.floor(amt || 0), gsDollarBalance(d.owner),
                       total);
  if(!(pay > 0)) return { ok: false, reason: 'insufficient_dollars' };
  let rem = pay; const paid = {};
  for(const k of ['mortgage', 'tax', 'hoa']){
    const due = Math.min(rem, d.owed[k] || 0);
    if(due > 0){
      gsDollarPay(d.owner, gsDeedPayee(d, k), due,
                  k + ' arrears ' + (dateStr || ''));
      d.owed[k] -= due; rem -= due; paid[k] = due;
    }
  }
  if(gsDeedArrears(d) === 0) d.missedN = 0;        // cured — clock resets
  return { ok: true, paid, remaining: gsDeedArrears(d) };
}
/* the end of the delinquency path — admin only, always on the record.
   Title reverts to the note holder (or the property bank when the deed
   was clean); an owner-occupant's lease ends with the title. */
function gsAdminForeclose(id, opts){
  opts = opts || {};
  const deed = GS_DEEDS[id];
  if(!deed || deed.status !== 'active')
    return { ok: false, reason: 'no_deed' };
  if((deed.missedN || 0) < GS_DEED_CFG.forecloseMisses && !opts.override)
    return { ok: false, reason: 'not_delinquent' };
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id) : gsBldById(id);
  if(!u && !b) return { ok: false, reason: 'unknown_unit' };
  const holder = (deed.mortgage && deed.mortgage.holder) || 'landlord';
  if(u) u.owner_id = holder; else b.owner_id = holder;
  deed.status = 'foreclosed'; deed.foreclosedTo = holder;
  deed.foreclosedOn = opts.date ||
    ((typeof gsTodayStr === 'function') ? gsTodayStr() : null);
  GS_DEED_LOG.push({ n: ++GS_LST_SEQ.n, id, scope: deed.scope,
    from: deed.owner, to: holder, price: deed.price,
    day: deed.foreclosedOn, via: 'foreclosure' });
  const l = u && (typeof gsActiveLease === 'function') &&
    gsActiveLease(u.id);
  if(l && l.status === 'owner-occupied'){
    l.status = 'ended'; l.end = deed.foreclosedOn;
    if(typeof GS_HIRED !== 'undefined' && GS_HIRED[deed.owner])
      GS_HIRED[deed.owner].unitId = null;
  }
  gsAdminAction('foreclose', {
    address: u ? gsAddressOfUnit(u.id) : b.address,
    unit: u ? id : null, bld: u ? null : id, owner: deed.owner });
  return { ok: true, to: holder, id, owed: gsDeedArrears(deed) };
}

/* ---------------- the landlord license (leases.json earned gate) ----
   own a deeded door for 30+ days, keep a clean record, file `license`
   (2000cr — billed through the bus like any request). The license
   unlocks capped owner-tools scoped to YOUR doors only; the owner's
   review still decides every eviction. */
function gsLicensed(pid){ return !!GS_LICENSES[pid]; }
function gsOwnedDoors(pid){
  const out = [];
  for(const k in GS_DEEDS){
    const d = GS_DEEDS[k];
    if(d.status !== 'active') continue;
    if(d.owner === pid) { out.push(k); continue; }
    if(typeof gsHiredOwner === 'function' &&
       gsHiredOwner(d.owner) === pid) out.push(k);
  }
  return out;
}
function gsLandlordEligible(pid, dateStr, nowMin){
  if(gsIsAdmin(pid)) return { ok: false, reason: 'not_required' };
  if(GS_LICENSES[pid]) return { ok: false, reason: 'already_licensed' };
  const doors = gsOwnedDoors(pid);
  if(!doors.length) return { ok: false, reason: 'no_deed' };
  const today = dateStr ||
    ((typeof gsTodayStr === 'function') ? gsTodayStr() : null);
  const aged = !!(today && doors.some(k => {
    const d = GS_DEEDS[k];
    return d && d.sinceDay &&
      gsDateDiff(today, d.sinceDay) >= GS_DEED_CFG.licenseOwnDays;
  }));
  if(!aged) return { ok: false, reason: 'own_30_days' };
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  if(typeof gsFlagScore === 'function' && gsFlagScore(pid, now) > 0)
    return { ok: false, reason: 'record_not_clean' };
  if(typeof gsRepScore === 'function' && gsRepScore(pid) < 0)
    return { ok: false, reason: 'standing' };
  return { ok: true, doors };
}
function gsLicenseAllow(r, now){
  const el = gsLandlordEligible(r.playerId, null, now);
  return el.ok ? true : el.reason;
}
function gsLicenseActivate(r, now){
  const el = gsLandlordEligible(r.playerId, null, now);
  if(!el.ok) return { ok: false, reason: el.reason };
  GS_LICENSES[r.playerId] = {
    sinceMin: now,
    sinceDay: (typeof gsTodayStr === 'function') ? gsTodayStr() : null,
  };
  gsAdminAction('license', { player: r.playerId });
  return true;
}
/* the licensed toolbox — scope-checked wrappers over the owner tools.
   Every call is public-record (the underlying tool posts its feed
   line); the license only widens WHO can call, never what it says. */
function gsLandlordUnits(pid){
  const out = [];
  if(!GS_LICENSES[pid]) return out;
  for(const u of GS_REG.units){
    const o = gsTitleOwnerOf(u.id);
    if(o === pid ||
       (typeof gsHiredOwner === 'function' && gsHiredOwner(o) === pid))
      out.push(u.id);
  }
  return out;
}
function gsLandlordOwns(pid, unitId){
  return gsLandlordUnits(pid).indexOf(unitId) >= 0;
}
function gsLandlordStatement(pid, unitId){
  if(!GS_LICENSES[pid]) return { ok: false, reason: 'not_licensed' };
  if(!gsLandlordOwns(pid, unitId)) return { ok: false, reason: 'not_your_unit' };
  const s = (typeof gsLeaseStatement === 'function')
    ? gsLeaseStatement(unitId) : null;
  return s ? { ok: true, statement: s } : { ok: false, reason: 'no_active_lease' };
}
function gsLandlordNotice(pid, unitId, kind, opts){
  if(!GS_LICENSES[pid]) return { ok: false, reason: 'not_licensed' };
  if(!gsLandlordOwns(pid, unitId)) return { ok: false, reason: 'not_your_unit' };
  /* the license is capped at for-cause paper (leases.json power_map:
     a licensed landlord posts pay-or-quit / cure-or-quit but NEVER a
     no-fault notice — the 30-day termination stays an owner tool) */
  if(kind === 'termination')
    return { ok: false, reason: 'admin_only' };
  return gsServeNotice(unitId, kind,
                       Object.assign({ by: pid }, opts || {}));
}
function gsLandlordRaise(pid, unitId, newRent, opts){
  if(!GS_LICENSES[pid]) return { ok: false, reason: 'not_licensed' };
  if(!gsLandlordOwns(pid, unitId)) return { ok: false, reason: 'not_your_unit' };
  return gsRaiseRent(unitId, newRent, opts);
}
/* an eviction filing brings the paper — the owner's review still
   decides (lease-ui power map: a landlord never evicts directly). */
function gsLandlordEvictFile(pid, unitId, opts){
  if(!GS_LICENSES[pid]) return { ok: false, reason: 'not_licensed' };
  if(!gsLandlordOwns(pid, unitId)) return { ok: false, reason: 'not_your_unit' };
  const l = (typeof gsActiveLease === 'function')
    ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  l.evictFiled = { by: pid,
    on: (opts && opts.date) ||
        ((typeof gsTodayStr === 'function') ? gsTodayStr() : null),
    note: (opts && opts.note) || null };
  gsLstFeed('evict_filed', unitId, { player: pid });
  return { ok: true };
}

/* ---------------- the board (viewer surfaces) ---------------- */
function gsListingCard(id, opts){
  const l = gsListingOf(id);
  if(!l) return null;
  if(l.quiet && !(opts && opts.internal)) return null;  // pocket listing
  const u = (typeof gsUnitById === 'function') ? gsUnitById(id) : null;
  const b = u ? gsBldById(u.bld_id) : gsBldById(id);
  const tier = gsListingTier(id);
  const c = {
    id, scope: u ? 'unit' : 'building', kind: l.kind || 'sale',
    tier, address: l.address,
    addressShort: l.address
      ? l.address.replace(/, San Francisco, CA.*$/, '') : null,
    ask: l.ask, rent: l.kind === 'rent' ? l.ask : null,
    beds: u ? (u.bedrooms != null ? u.bedrooms : 1) : null,
    doors: b && !u ? b.units.length : null,
    controlled: !!(u && u.rent_controlled),
    carriesNote: !!l.carriesNote, quiet: !!l.quiet,
    copy: l.copy, sellerLine: l.sellerLine || null,
    sinceMin: l.sinceMin, reqId: l.reqId || null,
  };
  if(l.kind !== 'rent'){
    c.deedFeeCr = gsDeedFeeFor(id);
    if(l.carriesNote){
      const f = gsMortgageMath(l.ask, GS_DEED_CFG.minDownPct,
                               GS_DEED_CFG.termY);
      c.financePreview = { downPct: GS_DEED_CFG.minDownPct,
        down: f.down, monthly: f.monthly, rate: f.rate,
        termY: GS_DEED_CFG.termY };
      c.monthlyCost = f.monthly +
        Math.round(l.ask * GS_DEED_CFG.taxRate / 12) +
        (u ? gsHoaMoFor(id) : 0);
    }
  }
  return c;
}
function gsListingsBoard(opts){
  opts = opts || {};
  const out = [];
  for(const k in GS_LISTINGS){
    const l = GS_LISTINGS[k];
    if(l.quiet && !opts.internal) continue;
    if(opts.kind && (l.kind || 'sale') !== opts.kind) continue;
    const c = gsListingCard(k, opts);
    if(c) out.push(c);
  }
  for(const k in GS_BLD_LISTINGS){
    const l = GS_BLD_LISTINGS[k];
    if(l.quiet && !opts.internal) continue;
    if(opts.kind && (l.kind || 'sale') !== opts.kind) continue;
    const c = gsListingCard(k, opts);
    if(c) out.push(c);
  }
  out.sort((a, b2) => a.sinceMin - b2.sinceMin);
  return out;
}
function gsQuietListings(){
  const out = [];
  for(const k in GS_LISTINGS) if(GS_LISTINGS[k].quiet) out.push(k);
  for(const k in GS_BLD_LISTINGS) if(GS_BLD_LISTINGS[k].quiet) out.push(k);
  return out;
}
/* the viewer projection — quiet listings are absent, not redacted */
function gsListingsPublic(){
  const o = {};
  for(const k in GS_LISTINGS)
    if(!GS_LISTINGS[k].quiet) o[k] = GS_LISTINGS[k];
  for(const k in GS_BLD_LISTINGS)
    if(!GS_BLD_LISTINGS[k].quiet) o[k] = GS_BLD_LISTINGS[k];
  return JSON.parse(JSON.stringify(o));
}
/* a player's property sheet: deeds, obligations, arrears — the
   tenant→owner arc's own dashboard (all dollar numbers, no secrets) */
function gsMyProperty(pid){
  const doors = gsOwnedDoors(pid);
  const out = { doors: [], totalMo: 0, arrears: 0,
                licensed: !!GS_LICENSES[pid] };
  for(const k of doors){
    const d = GS_DEEDS[k];
    const ch = gsDeedCharges(d);
    const mo = ch.reduce((s, c) => s + c.amt, 0);
    out.doors.push({
      id: k, scope: d.scope, address:
        (gsUnitById(k) ? gsAddressOfUnit(k)
                       : (gsBldById(k) || {}).address) || null,
      sinceDay: d.sinceDay, price: d.price,
      monthly: { mortgage: d.mortgage ? d.mortgage.monthly : 0,
                 tax: d.taxMo, hoa: d.hoaMo },
      arrears: gsDeedArrears(d), missedN: d.missedN || 0,
      mortgageLeft: d.mortgage ? d.mortgage.remaining : 0,
      status: d.status,
    });
    out.totalMo += mo; out.arrears += gsDeedArrears(d);
  }
  return out;
}
function gsDeedOf(id){ return GS_DEEDS[id] || null; }
function gsDeedLog(){ return GS_DEED_LOG.slice(); }
function gsObligationsOf(id){
  const d = GS_DEEDS[id];
  if(!d) return null;
  return { id, owner: d.owner, status: d.status,
    charges: gsDeedCharges(d), arrears: gsDeedArrears(d),
    owed: Object.assign({}, d.owed), missedN: d.missedN || 0,
    dueDay: d.dueDay, sinceDay: d.sinceDay,
    mortgage: d.mortgage ? { holder: d.mortgage.holder,
      remaining: d.mortgage.remaining, monthly: d.mortgage.monthly,
      paidN: d.mortgage.paidN, status: d.mortgage.status } : null };
}

/* ---------------- the audit ---------------- */
function gsListingAudit(){
  const issues = [];
  const all = {};
  for(const k in GS_LISTINGS) all[k] = GS_LISTINGS[k];
  for(const k in GS_BLD_LISTINGS) all[k] = GS_BLD_LISTINGS[k];
  const FORMULA =
    /hash|addr_idx|9000\s*\+|%\s*900|generation rule|generated by|formula|deterministic/i;
  const REAL_BIZ =
    /bi-rite|farolito|tartine|delfina|foreign cinema|philz |sightglass|ritual coffee|four barrel|wise sons|la taqueria|dandelion|mission chinese/i;
  for(const k in all){
    const l = all[k];
    const u = gsUnitById(k), b = u ? gsBldById(u.bld_id) : gsBldById(k);
    if(!u && !b){ issues.push('orphan listing ' + k); continue; }
    if(b && (b.offmap || b.status !== 'standing'))
      issues.push('listing on off-map/retired stock ' + k);
    if(u && !gsUnitLivable(u)) issues.push('listing on dead unit ' + k);
    const addr = u ? gsAddressOfUnit(k) : (b && b.address);
    if(l.address !== addr) issues.push('stale address on ' + k);
    if(!/^9\d{3} /.test(l.address || ''))
      issues.push('non-registry address on ' + k);
    const txt = JSON.stringify({ copy: l.copy, sellerLine: l.sellerLine });
    if(FORMULA.test(txt)) issues.push('address-rule language in copy ' + k);
    if(REAL_BIZ.test(txt)) issues.push('real business name in copy ' + k);
  }
  for(const c of gsListingsBoard())
    if(c.quiet) issues.push('quiet card on the public board ' + c.id);
  for(const k in GS_DEEDS){
    const d = GS_DEEDS[k];
    if(d.status === 'active' && gsTitleOwnerOf(k) !== d.owner)
      issues.push('deed/title drift ' + k);
    if(d.mortgage && d.mortgage.remaining < 0)
      issues.push('negative note balance ' + k);
  }
  return { ok: issues.length === 0, issues };
}

/* ---------------- the `license` request verb ---------------- */
gsDefineAction('license', {
  scope: 'global', exclusive: false, ratePerMin: GS_DEED_CFG.licenseCr,
  minMin: 1, maxMin: 1, ttlMin: 120,
  effect: 'once',
  allow: (r, now) => gsLicenseAllow(r, now),
  activate: (r, now) => gsLicenseActivate(r, now),
  /* one license filing per player at a time — the paperwork is personal */
  claims: (r) => [{ cls: 'paper', res: 'paper:license:' + r.playerId }],
});

/* ---------------- the canonical seed ----------------
   housing.json listings_live, verbatim rents: 9418 Guerrero B at 2100,
   9457 Guerrero 2 at 1350, 9127 Capp A at 1300 — all vacant at seed.
   The authored flag rides on the unit records (GS_CANON_HOMES) so the
   ambient auto-assign knows to step around them. And the drama case:
   Victor's two Guerrero buildings quietly shopped — pocket listings,
   seller carries the note, invisible until sold. */
function gsListingSeedSF(){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return 0;
  if(typeof gsUnitById !== 'function') return 0;
  let n = 0;
  for(const u of GS_REG.units){
    if(!u.listing || GS_LISTINGS[u.id]) continue;
    if(gsActiveLease(u.id)) continue;        // belt & suspenders
    const spec = u.listing;
    GS_LISTINGS[u.id] = gsMkListing(u.id, {
      kind: spec.kind === 'rent' ? 'rent' : 'sale',
      ask: spec.ask, by: gsTitleOwnerOf(u.id),
      quiet: !!spec.quiet, auto: true,
      sellerLine: spec.voice === 'manager'
        ? 'Managed building — the office answers weekdays.' : null });
    n++;
  }
  for(const k of ['home-c6', 'home-c4c5']){
    const b = GS_REG.buildings.find(x => x.canon === k);
    if(!b || GS_BLD_LISTINGS[b.id]) continue;
    GS_BLD_LISTINGS[b.id] = gsMkListing(b.id, {
      kind: 'sale', ask: gsBldAskPrice(b), by: b.owner_id,
      quiet: true, carriesNote: true, auto: true });
    n++;
  }
  return n;
}
GS_LST_ARMED = true;                  // hooks live from here on
gsListingSeedSF();

/* ---------------- live wiring ----------------
   the obligation book runs once per real SF day on the same slow beat
   as the rent run — obligations accrue while the owner sleeps (the v9
   offline contract holds: the world keeps its promises). */
let gsLstLastMs = 0;
function gsListingSysTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  const ms = Date.now();
  if(ms - gsLstLastMs < 30000) return;
  gsLstLastMs = ms;
  const today = (typeof gsTodayStr === 'function') ? gsTodayStr() : null;
  if(today && today !== GS_DEED_TICK.lastDay){
    GS_DEED_TICK.lastDay = today;
    gsDeedTick(today);
  }
}
if(typeof registerSimTick === 'function') registerSimTick(gsListingSysTick);

/* ---------------- persistence ---------------- */
function gsListingSnapshot(){
  return { bldListings: GS_BLD_LISTINGS, deeds: GS_DEEDS,
           deedLog: GS_DEED_LOG, licenses: GS_LICENSES,
           seq: GS_LST_SEQ.n, lastDay: GS_DEED_TICK.lastDay };
}
function gsListingLoad(d){
  if(!d) return;
  for(const k in GS_BLD_LISTINGS) delete GS_BLD_LISTINGS[k];
  if(d.bldListings) Object.assign(GS_BLD_LISTINGS, d.bldListings);
  for(const k in GS_DEEDS) delete GS_DEEDS[k];
  if(d.deeds) Object.assign(GS_DEEDS, d.deeds);
  GS_DEED_LOG.length = 0;
  if(d.deedLog) GS_DEED_LOG.push.apply(GS_DEED_LOG, d.deedLog);
  for(const k in GS_LICENSES) delete GS_LICENSES[k];
  if(d.licenses) Object.assign(GS_LICENSES, d.licenses);
  GS_LST_SEQ.n = d.seq || 0;
  GS_DEED_TICK.lastDay = d.lastDay || null;
}
function gsListingReset(){
  for(const k in GS_BLD_LISTINGS) delete GS_BLD_LISTINGS[k];
  for(const k in GS_DEEDS) delete GS_DEEDS[k];
  GS_DEED_LOG.length = 0;
  for(const k in GS_LICENSES) delete GS_LICENSES[k];
  GS_LST_SEQ.n = 0;
  GS_DEED_TICK.lastDay = null;
}

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsListingsBoard = (o) => gsListingsBoard(o);
  window.__aiBridge.gsListingCard = (id) => gsListingCard(id);
  window.__aiBridge.gsQuietListings = () => gsQuietListings();
  window.__aiBridge.gsMyProperty = (pid) => gsMyProperty(pid);
  window.__aiBridge.gsDeedOf = (id) => gsDeedOf(id);
  window.__aiBridge.gsDeedLog = () => gsDeedLog();
  window.__aiBridge.gsObligationsOf = (id) => gsObligationsOf(id);
  window.__aiBridge.gsDeedTick = (d) => gsDeedTick(d);
  window.__aiBridge.gsPayDeed = (id, amt, d) => gsPayDeed(id, amt, d);
  window.__aiBridge.gsAdminForeclose = (id, o) => gsAdminForeclose(id, o);
  window.__aiBridge.gsListUnit = (id, o) => gsListUnit(id, o);
  window.__aiBridge.gsQuietShop = (id, o) => gsQuietShop(id, o);
  window.__aiBridge.gsDelist = (id, o) => gsDelist(id, o);
  window.__aiBridge.gsLicensed = (pid) => gsLicensed(pid);
  window.__aiBridge.gsLandlordUnits = (pid) => gsLandlordUnits(pid);
  window.__aiBridge.gsLandlordEligible = (pid, d) =>
    gsLandlordEligible(pid, d);
  window.__aiBridge.gsListingAudit = () => gsListingAudit();
}
