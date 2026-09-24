/* =====================================================================
   PART 41R: GAME SYSTEMS — THE COUNTY RECORDER (assessor + tax roll)

   Roadmap v17 — the address registry grows its municipal shadow. Every
   building in GS_REG is also a PARCEL on the county's assessment roll:
   a thing with a parcel number, an assessed value, a base year, and a
   tax bill that lands twice a year whether the camera is on it or not.

   - PARCELS — one per standing building (kind 'building'); a unit sold
     through the deed office carves its own condominium parcel (kind
     'condo') — real condo maps work exactly this way. Parcel numbers
     ("APNs") are '9xxx-0xx': the block derives from the street name,
     the lot numbers sequentially. Real SF assessor blocks run < ~8000,
     so the 9xxx space can never collide with a real parcel — the same
     privacy-by-construction rule as the spec §3 house numbers.
   - THE ROLL (Prop 13) — a parcel's assessed value is its factored
     base-year value, not its market value: baseValue set at the last
     change of ownership (or seed), factored +2%/yr, capped at market.
     Long-held buildings carry tiny assessed values — that gap IS the
     California landlord story. Market value derives live from the rent
     roll using the deed office's own conventions (grm × 12yr for
     buildings, base_rent × 150 for units), so a subdivision or a
     demolition moves the number with no extra bookkeeping.
   - NEW CONSTRUCTION — a garage conversion adds a base-year segment at
     its construction cost (real Prop 13: new construction gets a new
     basis without touching the old one). Subdivisions and merges move
     market only — splitting rooms isn't new construction.
   - THE SECURED ROLL — the county bills twice a year on the real
     calendar: installment 1 posts Nov 1 (delinquent after Dec 10),
     installment 2 posts Feb 1 (delinquent after Apr 10). Late
     installments take a 10% penalty; a balance open when the fiscal
     year ends (Jun 30) goes 'defaulted' — a matter of public record.
     Bills auto-collect from the owner's dollar account on posting;
     a partial payment is a real partial payment. gsPayTaxBill is the
     redemption window. Owners paying through an active deed book
     (seller-carried impound style) settle monthly instead — the county
     never double-bills; the deed's taxMo refreshes from the roll so
     Prop-13 drift and reassessment reach the monthly book.
   - THE RENT BOARD — SF's Housing Inventory fee lands as a line on the
     property tax bill ($59 per rent-controlled unit per year — the
     real instrument). A parcel whose fee isn't paid through the current
     fiscal year is 'unregistered': gsRaiseRent refuses rent increases
     on its controlled units (real rule — you must be registered to
     bank the annual allowance).
   - THE PUBLIC RECORD — assessor records are genuinely public in real
     life, so this is a spectator surface: gsParcelView is the record
     card (APN, owner of record, assessed, market, bill status), the
     wire prints the delinquency/default/redemption beats (delinquent
     tax lists really are published), and gsViewerState().county is the
     roll-wide summary.

   Deterministic: no Math.random; every entry point takes an explicit
   date. All money is game dollars — credits never touch this module.
   ===================================================================== */

const GS_CNT_CFG = {
  rate: 0.0118,         // secured property tax ~1.18% of assessed / yr
                        // (same rate the deed office already uses)
  levyYrs: 1.02,        // Prop 13 factored-base growth cap
  apprec: 1.05,         // implied historical appreciation for seed bases
  hox: 7000,            // CA homeowner's exemption off assessed value
  rbFee: 59,            // Rent Board fee per controlled unit per year
  latePct: 0.10,        // penalty on a delinquent installment (real: 10%)
  taxTo: 'city',        // the county's ledger account
  landMin: 250000,      // vacant-land floor (deed office min ask)
  aduCost: 150000,      // construction basis added per garage ADU
  walkCapDays: 370,     // catch-up bound on a long-silent world
};

/* ---------------- state ---------------- */
const GS_PARC = {
  parcels: {},     // key -> parcel record (key = bldId, or unitId for condos)
  apnUsed: {},     // apn -> true (numbers retire with their parcels)
  lots: {},        // block -> next lot counter
  bills: [],       // {id,key,fy,inst,posted,dueBy,amt,fee,paid,penalty,status}
  billSeq: 0,
  lastTickDay: null,
};

function gsPARCof(key){ return GS_PARC.parcels[key] || null; }

/* ---------------- parcel numbers (the assessor's 9xxx space) ---------
   APN format 'block-lot' e.g. "9455-007": block derives deterministically
   from the street (one fictional block per street — the Mission map is a
   district, not the whole city), lot increments per mint. Blocks sit at
   9000+ — above every real SF assessor block — so a parcel number can
   never be a real one, same construction as spec §3. */
function gsApnBlock(street){
  return 9000 + (hashString18('blk|' + street) % 900);
}
function gsApnMint(street){
  const blk = gsApnBlock(street);
  let lot, apn;
  do {
    lot = (GS_PARC.lots[blk] = (GS_PARC.lots[blk] || 0) + 1);
    apn = blk + '-' + (lot < 100 ? (lot < 10 ? '00' : '0') : '') + lot;
  } while(GS_PARC.apnUsed[apn]);
  GS_PARC.apnUsed[apn] = true;
  return apn;
}

/* ---------------- market + assessed values ----------------
   Market is derived live from the registry, so the roll follows every
   clerk op for free: subdivide/merge move the rent roll, demolition
   leaves land. Building valuation reuses the deed office's own grm
   convention when loaded (one number language); units use the v10 unit
   ask convention. A building with carved-off condo parcels counts only
   the units it still owns. */
function gsParcelMarket(key){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(key) : null;
  if(u) return Math.max(0, (u.base_rent || 0) * 150);
  const b = (typeof gsBldById === 'function') ? gsBldById(key) : null;
  if(!b) return 0;
  let gross = 0;
  for(const uid of b.units){
    const uu = gsUnitById(uid);
    if(!uu || (uu.status || 'active') !== 'active') continue;
    if(GS_PARC.parcels[uid]) continue;   // this door answers to its own parcel
    gross += uu.base_rent || 0;
  }
  /* the deed office's own valuation language — gross rent x 12 years,
     rounded to the 5k — so "what it would sell for" and "what the
     county thinks it's worth" stay the same number */
  const grm = (typeof GS_DEED_CFG !== 'undefined') ? GS_DEED_CFG.grm : 144;
  const m = Math.round(gross * grm / 5000) * 5000;
  return Math.max(GS_CNT_CFG.landMin, m);
}
/* the homeowner's exemption: the owner lives in it -> $7,000 off the
   assessed value (the real CA instrument). A building qualifies when
   the title owner occupies a unit in it; a condo parcel qualifies on
   its own door. */
function gsParcelHox(parcel, key){
  if(!parcel || parcel.kind !== 'condo' && parcel.kind !== 'building')
    return 0;
  const owner = (typeof gsTitleOwnerOf === 'function')
    ? gsTitleOwnerOf(key) : null;
  if(!owner) return 0;
  const h = (typeof gsHomeOf === 'function') ? gsHomeOf(owner) : null;
  if(!h || h.via !== 'owner') return 0;
  if(parcel.kind === 'condo') return h.unit_id === key ? GS_CNT_CFG.hox : 0;
  /* building parcel: the owner's own flat must be in it and not carved */
  const u = h.unit_id && (typeof gsUnitById === 'function')
    ? gsUnitById(h.unit_id) : null;
  return (u && u.bld_id === key && !GS_PARC.parcels[h.unit_id])
    ? GS_CNT_CFG.hox : 0;
}
/* Prop 13: assessed = min(market, Σ segment.amt × 1.02^(yr − seg.yr)) − hox.
   The floor-vs-market min is the real rule (a collapsing market reads
   through — Prop 8 style). */
function gsAssessedValue(parcel, yr){
  if(!parcel) return 0;
  const y = (yr != null) ? yr
    : ((typeof gsTodayStr === 'function' && gsTodayStr())
       ? gsDateParse(gsTodayStr()).y : 2026);
  let factored = 0;
  for(const s of parcel.basis)
    factored += s.amt * Math.pow(GS_CNT_CFG.levyYrs, Math.max(0, y - s.yr));
  const m = gsParcelMarket(parcel.key);
  return Math.max(0, Math.round(Math.min(m, factored) -
    gsParcelHox(parcel, parcel.key)));
}
/* the monthly accrual an impound-style deed pays the county */
function gsParcelTaxMo(key){
  const p = gsPARCof(key);
  if(!p || p.status !== 'active') return 0;
  return Math.round(gsAssessedValue(p) * GS_CNT_CFG.rate / 12);
}

/* ---------------- the parcel book ----------------
   key = building id for whole parcels, unit id for condo parcels.
   Minted lazily on first read and eagerly at seed — a registered place
   is always assessable. */
function gsParcelOf(key, opts){
  let p = GS_PARC.parcels[key];
  if(p) return p;
  const u = (typeof gsUnitById === 'function') ? gsUnitById(key) : null;
  const b = u ? gsBldById(u.bld_id)
    : ((typeof gsBldById === 'function') ? gsBldById(key) : null);
  if(!b) return null;
  /* a condo parcel exists only once a door has actually SOLD — minting
     one for an unsold unit would carve value off the building's roll
     for nothing. Sales create theirs in gsAssessSale. */
  if(u && !u.owner_id &&
      !(typeof GS_DEEDS !== 'undefined' && GS_DEEDS[u.id])) return null;
  p = {
    key,
    apn: gsApnMint(b.street),
    kind: u ? 'condo' : 'building',
    bld_id: b.id, unit_id: u ? u.id : null,
    basis: [],
    status: b.status === 'retired' ? 'retired' : 'active',
    rbThrough: null,     // Rent Board fee paid through FY (int year)
    hist: [],
  };
  GS_PARC.parcels[key] = p;
  /* seed basis: an implied historical purchase — today's market walked
     back at the appreciation rate to the (deterministic) base year.
     Canon buildings take their authored years; the rest hash into
     1985–2019 — long-held stock gets the real Prop-13 gap. */
  const seed = gsParcelSeedBasis(b, key);
  p.basis = seed;
  /* registered through the CURRENT fiscal year — the roll bills the
     rent-board fee from next July forward */
  p.rbThrough = gsFyOf((typeof gsTodayStr === 'function' &&
    gsTodayStr()) || '2026-07-01');
  p.hist.push({ on: null, ev: 'enrolled', apn: p.apn });
  return p;
}
function seedFy(){
  const t = (typeof gsTodayStr === 'function') && gsTodayStr();
  return t ? gsDateParse(t).y : 2026;
}
const GS_PARC_BASEYR = {          /* authored base years — the drama
                                     cases read like the real record */
  'home-c6': 1989,                /* Victor bought the duplex the year
                                     Carmen moved in */
  'home-c4c5': 1994,
  'home-c7': 1998,                /* his own flat over the shop */
};
function gsParcelSeedBasis(b, key){
  const yr = GS_PARC_BASEYR[b.canon] ||
    (1985 + hashString18('by|' + b.id) % 35);
  const cur = seedFy();
  const m = gsParcelMarket(key);
  const amt = Math.max(10000,
    Math.round(m / Math.pow(GS_CNT_CFG.apprec, Math.max(0, cur - yr))));
  return [{ yr, amt }];
}

/* a change of ownership rebases the parcel — real CA reassessment on
   sale. Unit sales carve a condo parcel first (its own APN, its own
   bill); the building's roll quietly excludes the sold door from then
   on via gsParcelMarket. */
function gsAssessSale(key, price, day){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(key) : null;
  const b = u ? gsBldById(u.bld_id) : gsBldById(key);
  if(!b) return null;
  let p = GS_PARC.parcels[key];
  if(!p){
    p = {
      key,
      apn: gsApnMint(b.street),
      kind: u ? 'condo' : 'building',
      bld_id: b.id, unit_id: u ? u.id : null,
      basis: [], status: 'active', hist: [],
      rbThrough: gsFyOf((typeof gsTodayStr === 'function' &&
        gsTodayStr()) || '2026-07-01'),
    };
    GS_PARC.parcels[key] = p;
  }
  const yr = gsDateParse(day) ? gsDateParse(day).y : seedFy();
  p.basis = [{ yr, amt: Math.max(1000, Math.round(price || 0)) }];
  if(p.status !== 'active') p.status = 'active';
  p.hist.push({ on: day || null, ev: 'sold', amt: Math.round(price || 0) });
  return p;
}
/* new construction adds a base-year SEGMENT — the old basis keeps its
   factor, the improvement gets its own. (Subdivide/merge add none:
   rearranged rooms aren't new construction.) */
function gsAssessImprove(key, cost, day){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(key) : null;
  const pk = (u && GS_PARC.parcels[u.id]) ? u.id : (u ? u.bld_id : key);
  const p = gsParcelOf(pk);
  if(!p) return null;
  const yr = gsDateParse(day) ? gsDateParse(day).y : seedFy();
  const amt = Math.max(1000, Math.round(cost || GS_CNT_CFG.aduCost));
  p.basis.push({ yr, amt });
  p.hist.push({ on: day || null, ev: 'improved', amt });
  return p;
}
/* the map keeps a retired parcel forever — the number is never
   reassigned, same rule as the registry's own house numbers */
function gsParcelRetire(key){
  const p = gsParcelOf(key);
  if(!p) return false;
  p.status = 'retired';
  p.hist.push({ on: (typeof gsTodayStr === 'function' && gsTodayStr()) || null,
               ev: 'retired' });
  /* bills already issued survive — the county still collects what it's
     owed; nothing new posts against a dead parcel */
  return true;
}

/* ---------------- the secured roll (the county calendar) -----------
   FY runs Jul 1 – Jun 30. Installment 1 posts Nov 1, delinquent after
   Dec 10; installment 2 posts Feb 1, delinquent after Apr 10. A bill
   still open when the year ends is tax-defaulted — the county publishes
   the list (it really does), which is why the wire may print it. */
function gsFyOf(dateStr){
  const d = gsDateParse(dateStr);
  if(!d) return null;
  return d.m >= 7 ? d.y + 1 : d.y;         // FY2027 = Jul 2026..Jun 2027
}
function gsParcelOwner(p){
  return (typeof gsTitleOwnerOf === 'function')
    ? gsTitleOwnerOf(p.key) : 'landlord';
}
/* a parcel on the deed book pays monthly through it (impound) — the
   installment plan skips those doors so nobody pays twice */
function gsParcelImpounded(p){
  return typeof GS_DEEDS !== 'undefined' && GS_DEEDS[p.key] &&
    GS_DEEDS[p.key].status === 'active';
}
function gsRentBoardUnits(p){
  /* count the rent-controlled doors the parcel still answers for */
  if(p.kind === 'condo'){
    const u = gsUnitById(p.unit_id);
    return (u && u.rent_controlled) ? 1 : 0;
  }
  const b = gsBldById(p.bld_id);
  if(!b) return 0;
  let n = 0;
  for(const uid of b.units){
    if(GS_PARC.parcels[uid]) continue;   // carved condo pays its own fee
    const u = gsUnitById(uid);
    if(u && (u.status || 'active') === 'active' && u.rent_controlled) n++;
  }
  return n;
}
/* registration current = the fee was paid through this fiscal year */
function gsRentBoardCurrent(id, dateStr){
  const u = gsUnitById(id);
  const pk = u ? (GS_PARC.parcels[id] ? id : u.bld_id) : id;
  const p = gsParcelOf(pk);
  if(!p) return true;                    // no roll, no rule (unseeded)
  const fy = gsFyOf(dateStr || (typeof gsTodayStr === 'function' &&
    gsTodayStr()) || '2026-01-01');
  return p.rbThrough != null && p.rbThrough >= fy;
}
function gsPostBill(p, fy, inst, posted, dueBy){
  /* both installments of a FY share one assessment — the Jan 1 lien
     date of the calendar year the FY opened (fy − 1) */
  const assessed = gsAssessedValue(p, fy - 1);
  const levy = Math.round(assessed * GS_CNT_CFG.rate);
  const feeN = gsRentBoardUnits(p);
  const fee = feeN * GS_CNT_CFG.rbFee;
  /* the Rent Board fee rides installment 1 in full — paying it is what
     registers the parcel's controlled doors for the year */
  const half = Math.ceil(levy / 2);
  const amt = inst === 1 ? half + fee : levy - half;
  const bill = {
    id: 'tax-' + (++GS_PARC.billSeq),
    key: p.key, fy, inst,
    posted, dueBy, amt, fee: inst === 1 ? fee : 0,
    assessed, paid: 0, penalty: 0, status: 'open',
  };
  GS_PARC.bills.push(bill);
  /* auto-collect on posting — the county debits; a short balance pays
     what it can and the rest waits for the delinquent date */
  gsParcelCollect(bill);
  return bill;
}
function gsParcelCollect(bill){
  const p = GS_PARC.parcels[bill.key];
  if(!p || bill.status === 'paid') return;
  const owner = gsParcelOwner(p);
  const due = bill.amt + bill.penalty - bill.paid;
  if(due <= 0) return;
  const bal = (typeof gsDollarBalance === 'function')
    ? gsDollarBalance(owner) : 0;
  const pay = Math.min(due, Math.max(0, bal));
  if(pay > 0){
    gsDollarPay(owner, GS_CNT_CFG.taxTo, pay,
      'property tax ' + bill.fy + ' inst ' + bill.inst + ' ' + p.apn);
    bill.paid += pay;
  }
  gsBillSettle(bill);
}
/* status/flag bookkeeping after money moves — shared by the
   auto-collect and the manual payment window */
function gsBillSettle(bill){
  const p = GS_PARC.parcels[bill.key];
  if(!p) return;
  if(bill.paid >= bill.amt + bill.penalty){
    bill.status = 'paid';
    /* the rent-board fee rides installment 1 — paying it registers the
       parcel's controlled units through this FY */
    if(bill.fee > 0) p.rbThrough = bill.fy;
    /* redemption clears the flag only when nothing else is defaulted —
       the record stays honest about a stack of unpaid years */
    const still = GS_PARC.bills.some(x =>
      x.key === p.key && x.status === 'defaulted');
    if(p.defaulted && !still) gsCountyFeed('tax_redeemed', p, {});
    p.defaulted = still;
  }
}
/* manual redemption — the owner (or anyone) can pay a bill down */
function gsPayTaxBill(billId, amt){
  const bill = GS_PARC.bills.find(x => x.id === billId);
  if(!bill) return { ok: false, reason: 'unknown_bill' };
  const p = GS_PARC.parcels[bill.key];
  const owner = p ? gsParcelOwner(p) : 'landlord';
  const due = bill.amt + bill.penalty - bill.paid;
  const pay = Math.min(due, Math.max(0, Math.floor(amt == null ? due : amt)));
  if(pay <= 0) return { ok: false, reason: 'nothing_owed' };
  const txn = gsDollarPay(owner, GS_CNT_CFG.taxTo, pay,
    'property tax ' + bill.fy + ' inst ' + bill.inst + ' (payment)');
  if(!txn) return { ok: false, reason: 'insufficient_dollars', due };
  bill.paid += pay;
  gsBillSettle(bill);
  return { ok: true, paid: pay, bill };
}

function gsCountyFeed(action, p, extra){
  if(typeof gsBusEmit !== 'function') return null;
  const b = gsBldById(p.bld_id);
  const u = p.unit_id && gsUnitById(p.unit_id);
  const addr = u ? gsAddressOfUnit(u.id) : (b && b.address);
  return gsBusEmit('county',
    { playerId: 'county', kind: 'county', id: null,
      target: p.key, _now: null },
    Object.assign({ action, address: addr, apn: p.apn }, extra || {}));
}

function gsAssessorDay(dateStr){
  const d = gsDateParse(dateStr);
  if(!d) return;
  /* enrollment sweep: any standing building not yet on the roll joins
     it — the assessor's map closes gaps daily, not just at seed */
  for(const b of GS_REG.buildings)
    if(b.status === 'standing' && !GS_PARC.parcels[b.id])
      gsParcelOf(b.id);
  const isPost1 = (d.m === 11 && d.d === 1);
  const isPost2 = (d.m === 2 && d.d === 1);
  const isDelq1 = (d.m === 12 && d.d === 10);
  const isDelq2 = (d.m === 4 && d.d === 10);
  const isDefault = (d.m === 7 && d.d === 1);
  const fy = gsFyOf(dateStr);
  if(isPost1 || isPost2){
    const inst = isPost1 ? 1 : 2;
    /* inst 1 posts Nov 1 / delinquent Dec 10 of the calendar year the
       FY opened; inst 2 posts Feb 1 / delinquent Apr 10 inside it */
    const dueBy = isPost1 ? (fy - 1) + '-12-10' : fy + '-04-10';
    for(const key in GS_PARC.parcels){
      const p = GS_PARC.parcels[key];
      if(p.status !== 'active') continue;
      if(gsParcelImpounded(p)) continue;   // monthly through the deed book
      if(GS_PARC.bills.some(x => x.key === key && x.fy === fy &&
                                x.inst === inst)) continue;
      gsPostBill(p, fy, inst, dateStr, dueBy);
    }
  }
  if(isDelq1 || isDelq2){
    const inst = isDelq1 ? 1 : 2;
    for(const bill of GS_PARC.bills){
      if(bill.inst !== inst || bill.status !== 'open') continue;
      if(bill.dueBy !== dateStr) continue;
      const short = bill.amt + bill.penalty - bill.paid;
      if(short <= 0){ bill.status = 'paid'; continue; }
      bill.penalty = Math.round(bill.amt * GS_CNT_CFG.latePct);
      bill.status = 'delinquent';
      const p = GS_PARC.parcels[bill.key];
      if(p) gsCountyFeed('tax_delinquent', p, { fy: bill.fy, inst });
      gsParcelCollect(bill);             // one more try on the new total
    }
  }
  if(isDefault){
    for(const bill of GS_PARC.bills){
      /* the fiscal year that just closed carries its defaults forward */
      if(bill.status === 'open' || bill.status === 'delinquent'){
        if(bill.fy < fy){
          bill.status = 'defaulted';
          const p = GS_PARC.parcels[bill.key];
          if(p && !p.defaulted){
            p.defaulted = true;
            gsCountyFeed('tax_defaulted', p, { fy: bill.fy });
          }
        }
      }
    }
  }
  /* the deed book reads the roll — a deed's monthly tax impound tracks
     the parcel's assessed value, so Prop-13 drift and post-sale
     reassessment reach the monthly book without a second ledger */
  if(typeof GS_DEEDS !== 'undefined')
    for(const k in GS_DEEDS){
      const deed = GS_DEEDS[k];
      if(deed.status !== 'active') continue;
      const tm = gsParcelTaxMo(k);
      if(tm > 0) deed.taxMo = tm;
    }
}
function gsAssessorTick(dateStr){
  const d = gsDateParse(dateStr);
  if(!d) return null;
  const res = { day: dateStr, posted: 0, delinquent: 0, defaulted: 0 };
  if(GS_PARC.lastTickDay && GS_PARC.lastTickDay >= dateStr) return res;
  if(!GS_PARC.lastTickDay){
    GS_PARC.lastTickDay = dateStr;
    gsAssessorDay(dateStr);
  } else {
    /* walk the gap day by day, bounded — a world that slept a year
       still posts both installments */
    let cur = GS_PARC.lastTickDay, n = 0;
    while(cur < dateStr && n < GS_CNT_CFG.walkCapDays){
      cur = gsDateAdd(cur, 1); n++;
      gsAssessorDay(cur);
    }
    GS_PARC.lastTickDay = cur;
  }
  res.posted = GS_PARC.bills.filter(b => b.posted === dateStr).length;
  res.delinquent = GS_PARC.bills.filter(b => b.status === 'delinquent').length;
  res.defaulted = GS_PARC.bills.filter(b => b.status === 'defaulted').length;
  return res;
}

/* ---------------- the public record ----------------
   County records are genuinely public — owner of record, assessed
   value, tax status. Nothing private rides the card (no balances, no
   arrears of the *owner's other* accounts, no tenants' names). */
function gsParcelView(ref){
  /* ref: parcel key, apn, unit id, building id, or an address string.
     An unsold unit's parcel IS its building's — the door isn't
     separately assessed until it sells (condo carve at sale). */
  let key = ref;
  let p = GS_PARC.parcels[key];
  if(!p){
    const hit = (typeof gsLookupPlace === 'function')
      ? gsLookupPlace(ref) : null;
    if(hit && hit.unit)
      p = GS_PARC.parcels[hit.unit.id] ||
          (hit.building && GS_PARC.parcels[hit.building.id]) || null;
    else if(hit && hit.building)
      p = GS_PARC.parcels[hit.building.id] || null;
    if(p) key = p.key;
  }
  if(!p) return null;
  const b = gsBldById(p.bld_id);
  const u = p.unit_id ? gsUnitById(p.unit_id) : null;
  const bills = GS_PARC.bills.filter(x => x.key === p.key);
  const owed = bills.reduce((s, x) =>
    s + Math.max(0, x.amt + x.penalty - x.paid), 0);
  return {
    key: p.key, apn: p.apn, kind: p.kind,
    address: u ? gsAddressOfUnit(u.id) : (b && b.address),
    owner: gsParcelOwner(p),
    assessed: gsAssessedValue(p),
    market: gsParcelMarket(p.key),
    baseYears: p.basis.map(s => ({ yr: s.yr, amt: s.amt })),
    hox: gsParcelHox(p, p.key) > 0,
    rentBoard: gsRentBoardUnits(p) > 0
      ? { units: gsRentBoardUnits(p),
          registered: gsRentBoardCurrent(p.key) } : null,
    status: p.status,
    defaulted: !!p.defaulted,
    owed,
    bills: bills.map(x => ({ id: x.id, fy: x.fy, inst: x.inst,
      posted: x.posted, dueBy: x.dueBy, amt: x.amt, fee: x.fee,
      paid: x.paid, penalty: x.penalty, status: x.status })),
    hist: p.hist.map(h => Object.assign({}, h)),
  };
}
function gsParcelByApn(apn){
  for(const k in GS_PARC.parcels)
    if(GS_PARC.parcels[k].apn === apn) return gsParcelView(k);
  return null;
}
function gsTaxRoll(){
  const rows = [];
  for(const k in GS_PARC.parcels){
    const p = GS_PARC.parcels[k];
    if(p.status !== 'active') continue;
    rows.push({ key: k, apn: p.apn,
      owner: gsParcelOwner(p),
      assessed: gsAssessedValue(p),
      market: gsParcelMarket(k),
      defaulted: !!p.defaulted });
  }
  rows.sort((a, b) => a.apn < b.apn ? -1 : 1);
  return rows;
}
function gsCountyStats(){
  let parcels = 0, condos = 0, assessed = 0, owed = 0, delq = 0, def = 0;
  for(const k in GS_PARC.parcels){
    const p = GS_PARC.parcels[k];
    if(p.status !== 'active') continue;
    parcels++;
    if(p.kind === 'condo') condos++;
    assessed += gsAssessedValue(p);
    if(p.defaulted) def++;
  }
  for(const b of GS_PARC.bills){
    owed += Math.max(0, b.amt + b.penalty - b.paid);
    if(b.status === 'delinquent' || b.status === 'defaulted') delq++;
  }
  return { parcels, condos, assessed, owed, openBills: delq,
    defaulted: def };
}
/* the assessor's own integrity scan — runs beside gsRegistryAudit */
function gsAssessorAudit(){
  const issues = [];
  const seenApn = {};
  for(const k in GS_PARC.parcels){
    const p = GS_PARC.parcels[k];
    if(p.key !== k) issues.push('key drift ' + k);
    if(!/^9\d{3}-\d{3}$/.test(p.apn || ''))
      issues.push('bad APN ' + k + ' (' + p.apn + ')');
    if(seenApn[p.apn]) issues.push('dup APN ' + p.apn);
    seenApn[p.apn] = 1;
    const u = p.unit_id ? gsUnitById(p.unit_id) : null;
    const b = gsBldById(p.bld_id);
    if(!b){ issues.push('orphan parcel ' + k); continue; }
    if(p.kind === 'condo' && (!u || u.bld_id !== b.id))
      issues.push('condo parcel not on its building ' + k);
    if(b.status === 'retired' && p.status !== 'retired')
      issues.push('live parcel on a retired building ' + k);
    if(!Array.isArray(p.basis) || !p.basis.length)
      issues.push('parcel with no basis ' + k);
    else for(const s of p.basis)
      if(!(s.amt > 0) || !(s.yr > 1900 && s.yr < 2200))
        issues.push('bad basis segment on ' + k);
    const a = gsAssessedValue(p);
    if(a < 0) issues.push('negative assessed ' + k);
  }
  /* every standing, non-condo building must be assessable */
  if(typeof GS_REG !== 'undefined')
    for(const b of GS_REG.buildings){
      if(b.status !== 'standing') continue;
      if(!GS_PARC.parcels[b.id])
        issues.push('standing building with no parcel ' + b.id);
    }
  for(const bill of GS_PARC.bills){
    const p = GS_PARC.parcels[bill.key];
    if(!p){ issues.push('bill on phantom parcel ' + bill.key); continue; }
    if(bill.paid < 0 || bill.amt <= 0)
      issues.push('bad bill amounts ' + bill.id);
    if(bill.status === 'paid' &&
       bill.paid < bill.amt + bill.penalty)
      issues.push('paid-but-short bill ' + bill.id);
  }
  return { ok: issues.length === 0, issues, counts: gsCountyStats() };
}

/* ---------------- live wiring + persistence ----------------
   same beat as the rent run and the deed book: one county pass per real
   SF day, throttled on wall clock. Inert outside SF_MODE. */
let gsAssessorLastMs = 0;
function gsAssessorSysTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  const ms = Date.now();
  if(ms - gsAssessorLastMs < 30000) return;
  gsAssessorLastMs = ms;
  const today = (typeof gsTodayStr === 'function') ? gsTodayStr() : null;
  if(today) gsAssessorTick(today);
}
if(typeof registerSimTick === 'function')
  registerSimTick(gsAssessorSysTick);

function gsAssessorSnapshot(){
  return { parcels: GS_PARC.parcels, apnUsed: GS_PARC.apnUsed,
    lots: GS_PARC.lots, bills: GS_PARC.bills, billSeq: GS_PARC.billSeq,
    lastTickDay: GS_PARC.lastTickDay };
}
function gsAssessorLoad(d){
  gsAssessorReset();
  if(!d) return;
  GS_PARC.parcels = d.parcels || {};
  GS_PARC.apnUsed = d.apnUsed || {};
  GS_PARC.lots = d.lots || {};
  GS_PARC.bills = d.bills || [];
  GS_PARC.billSeq = d.billSeq || 0;
  GS_PARC.lastTickDay = d.lastTickDay || null;
}
function gsAssessorReset(){
  GS_PARC.parcels = {}; GS_PARC.apnUsed = {}; GS_PARC.lots = {};
  GS_PARC.bills.length = 0; GS_PARC.billSeq = 0; GS_PARC.lastTickDay = null;
}

/* ---------------- the canonical seed ----------------
   every standing building enrolls at load; canonical homes take their
   authored base years so the roll tells the real story — Victor's
   long-held Victorians assess a fraction of market while a fresh sale
   rebases at the price. Runs after the listings module (order file),
   so authored stock is already in place. */
function gsAssessorSeedSF(){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return 0;
  let n = 0;
  for(const b of GS_REG.buildings){
    if(b.status !== 'standing' || GS_PARC.parcels[b.id]) continue;
    gsParcelOf(b.id); n++;
  }
  /* the landlord holding company keeps a county operating float — the
     same convention as the payroll module's employer floats (it holds
     ~200 doors; the roll is real money) */
  if(typeof gsDollarBalance === 'function' &&
     gsDollarBalance('landlord') < 250000)
    gsDollarGrant('landlord', 500000, 'county operating float (seed)');
  return n;
}
gsAssessorSeedSF();

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsParcelView = (r) => gsParcelView(r);
  window.__aiBridge.gsParcelByApn = (a) => gsParcelByApn(a);
  window.__aiBridge.gsTaxRoll = () => gsTaxRoll();
  window.__aiBridge.gsCountyStats = () => gsCountyStats();
  window.__aiBridge.gsAssessorTick = (d) => gsAssessorTick(d);
  window.__aiBridge.gsPayTaxBill = (id, a) => gsPayTaxBill(id, a);
  window.__aiBridge.gsRentBoardCurrent = (id, d) => gsRentBoardCurrent(id, d);
  window.__aiBridge.gsAssessorAudit = () => gsAssessorAudit();
}
