/* =====================================================================
   PART 41D: GAME SYSTEMS — LEASE LIFECYCLE (rent, arrears, notices,
   violations, eviction). Roadmap v3 + rw-game-design §3/§6.

   The registry owns lease RECORDS (who lives where, rent amount); this
   module owns the lease's LIFE: applications, signing enrichment, monthly
   rent charges, late fees, arrears, per-occupant shares, lease violations
   (Jules's unpermitted spare room is the canonical case), CA-style notice
   periods (3-day pay-or-quit / cure-or-quit, 30-day termination), and the
   admin-only eviction flow.

   Realism rules (the boring-real-life-faithful default):
   - Rent is due monthly on the lease's dueDay (day-of-month of signing).
     First month is pro-rated for mid-month move-ins.
   - Payment is per-occupant SHARE (roommates each owe their half — the
     lease remains jointly liable via owedBy accounting). A share may
     carry a pay habit: C5's `lateEvery:3` reproduces the cast bible's
     "his half of the rent is late about every third month" for real.
   - Grace window, then a modest late fee (5%, capped — SF-customary).
   - Notices mirror California instruments: 3-day pay-or-quit needs
     arrears on the books; 3-day cure-or-quit needs a DISCOVERED
     violation (the landlord cannot act on what he doesn't know —
     inspections and neighbor reports surface violations honestly);
     30-day termination is the no-fault path and is flagged `noFault`
     so the reputation pass (v11) can tell it apart.
   - Eviction is ADMIN-ONLY (design §3): no request-bus path exists.
     It requires an executable notice, or an explicit owner override —
     which always runs but posts `noFault` on the public feed.
   - Rent raises respect the unit's rent_controlled flag: ~SF ordinance
     cap (7%/yr) on controlled units, a state-style 10% cap otherwise,
     one raise per 12 months, 30 days' notice before it takes effect.
   - Two currencies never mix: everything below is game dollars.
   - Deterministic: no Math.random; all entry points take an explicit
     'YYYY-MM-DD' date. The live tick derives the real PT date itself.
   ===================================================================== */

const GS_LEASE = {
  apps: [],          // {id, unit_id, applicant_id, occupants, note, appliedOn, status}
  nSeq: 0,           // violation + notice id sequence
  appSeq: 0,
  lastTickDay: null, // live tick dedupe — one rent run per real day
};
const GS_RENT_GRACE_DAYS = 5;      // pay-or-quit window before 'late'
const GS_LATE_FEE_PCT = 0.05;      // customary modest SF late fee
const GS_LATE_FEE_CAP = 75;        // ...capped — reasonableness matters
const GS_NOTICE_DAYS = { pay_or_quit: 3, cure_or_quit: 3, termination: 30 };
const GS_RC_MAX_RAISE = 0.07;      // rent-controlled annual cap (SF-flavored)
const GS_MK_MAX_RAISE = 0.10;      // non-controlled cap (AB1482-flavored)
const GS_RAISE_NOTICE_DAYS = 30;   // <=10% increase: 30 days' notice
const GS_RAISE_MIN_GAP_DAYS = 365; // one raise per 12 months of tenancy

/* ---------------- calendar helpers (UTC math — no TZ drift) ---------------- */
function gsPad2(n){ return (n < 10 ? '0' : '') + n; }
function gsDateParse(s){
  if(s && typeof s === 'object' && s.y != null)
    return { y: s.y, m: s.m, d: s.d };
  const m = typeof s === 'string' && /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
}
function gsDateStr(d){ return d.y + '-' + gsPad2(d.m) + '-' + gsPad2(d.d); }
function gsDateEp(s){ const d = gsDateParse(s); return d ? Date.UTC(d.y, d.m - 1, d.d) / 86400000 : NaN; }
function gsDateAdd(s, n){
  const e = gsDateEp(s);
  if(!isFinite(e)) return null;
  const t = new Date((e + n) * 86400000);
  return gsDateStr({ y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() });
}
function gsDateDiff(a, b){ return gsDateEp(a) - gsDateEp(b); }   // days a - b
function gsPeriodOf(s){ const d = gsDateParse(s); return d ? d.y + '-' + gsPad2(d.m) : null; }
function gsDim(y, m){ return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
/* the show runs on real SF time — lease "today" is America/Los_Angeles */
function gsTodayStr(){
  try{
    const p = {};
    for(const q of new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric',
    }).formatToParts(new Date())) p[q.type] = q.value;
    return p.year + '-' + gsPad2(+p.month) + '-' + gsPad2(+p.day);
  }catch(e){ return null; }
}

/* ---------------- lease enrichment ----------------
   gsSignLease creates the base record; gsLeaseInit (hooked at the end of
   gsSignLease, and run lazily by gsLeaseEnsure for snapshot-restored or
   pre-v3 leases) adds the lifecycle fields. `gsV3` marks enrichment. */
function gsNormShares(l, sh){
  const o = {};
  if(sh && typeof sh === 'object'){
    for(const k in sh){
      const v = sh[k];
      o[k] = (typeof v === 'number')
        ? { amt: v, lateEvery: 0, lateDays: 0 }
        : { amt: v.amt || 0, lateEvery: v.lateEvery || 0, lateDays: v.lateDays || 0 };
    }
    return o;
  }
  o[l.tenant_id] = { amt: l.monthly_rent, lateEvery: 0, lateDays: 0 };
  return o;
}
function gsLeaseInit(l, spec){
  if(!l || l.gsV3) return l;
  spec = spec || {};
  l.gsV3 = 1;
  const st = gsDateParse(l.start);
  l.startOn = st ? l.start : null;
  l.dueDay = spec.dueDay || (st ? st.d : 1);
  if(l.dueDay < 1 || l.dueDay > 28) l.dueDay = 1;
  l.term = spec.term || 'month-to-month';
  l.endOn = spec.endOn || null;              // fixed-term end; null = periodic
  l.deposit = (spec.deposit != null) ? spec.deposit : l.monthly_rent;
  l.shares = gsNormShares(l, spec.shares);   // {cid:{amt,lateEvery,lateDays}}
  l.charges = [];                            // {nSeq,kind,period,dueOn,amt,owedBy,paidBy,status,late,lateFee,catchUp}
  l.notices = [];                            // {id,kind,servedOn,deadline,status,detail,violId,by}
  l.violations = [];                         // {id,kind,who,since,note,discovered,status,curedOn,how}
  l.raiseHist = [];                          // {on,from,to}
  l.pendingRaise = null;                     // {amt,effectiveOn,servedOn}
  l.disputes = [];                           // {kind,by,since,note,status} —
                                           // world-truth disagreements
                                           // (9457's contested raise)
  l.chargeSeq = 0;                           // rent charges posted (habit math)
  l.booksFrom = null;                        // first day the system saw this
                                             // lease — no back-billing before it
  return l;
}
function gsLeaseEnsure(l){ return l ? gsLeaseInit(l) : null; }
function gsLeaseOwner(l){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(l.unit_id) : null;
  const b = u && (typeof gsBldById === 'function') ? gsBldById(u.bld_id) : null;
  return (u && u.owner_id) || (b && b.owner_id) || 'landlord';
}

/* ---------------- public feed ----------------
   every lifecycle/admin event lands on GS_FEED (design §3 transparency).
   UNDiscovered violations deliberately do NOT — they are world truth,
   not public knowledge; the feed learns them when an inspection or a
   neighbor report does. */
function gsLeaseFeed(action, l, extra){
  if(typeof gsBusEmit !== 'function') return null;
  const u = l && (typeof gsUnitById === 'function') ? gsUnitById(l.unit_id) : null;
  return gsBusEmit('lease', { playerId: 'owner', kind: 'lease', id: null,
    target: l && l.unit_id, _now: null },
    Object.assign({ action, unit: l && l.unit_id,
      address: u ? gsAddressOfUnit(u.id) : null,
      tenant: l && l.tenant_id }, extra || {}));
}

/* ---------------- charges + payments (all game dollars) ---------------- */
function gsChargeOwed(ch){
  let s = 0;
  for(const k in ch.owedBy) s += ch.owedBy[k];
  return s;
}
function gsChargeFor(l, period, kind){
  return l.charges.find(c => c.period === period && c.kind === kind) || null;
}
/* post a charge; owedBy splits `amt` across the lease's shares pro-rata
   (single-tenant leases owe it all). Deposits bill the leaseholder. */
function gsPostCharge(l, spec){
  const owedBy = {};
  if(spec.kind === 'rent'){
    let denom = 0;
    for(const k in l.shares) denom += l.shares[k].amt;
    if(denom <= 0){ owedBy[l.tenant_id] = spec.amt; }
    else{
      let rem = spec.amt;
      const keys = Object.keys(l.shares);
      keys.forEach((cid, i) => {
        const share = (i === keys.length - 1)
          ? rem                                    // last share takes the rounding cent
          : Math.round(spec.amt * l.shares[cid].amt / denom);
        owedBy[cid] = share; rem -= share;
      });
    }
  } else {
    owedBy[spec.by || l.tenant_id] = spec.amt;     // deposit/fee -> leaseholder
  }
  const ch = { nSeq: ++GS_LEASE.nSeq, kind: spec.kind || 'rent',
    period: spec.period, dueOn: spec.dueOn, amt: spec.amt,
    owedBy, paidBy: {}, status: 'open', late: false, lateFee: 0 };
  l.charges.push(ch);
  return ch;
}
/* one payer attempts what they owe on a charge — partial payments are
   real (pay what you have; the rest stays owed). */
function gsChargePay(l, ch, cid, date, res){
  const owed = ch.owedBy[cid] || 0;
  if(owed <= 0) return 0;
  const bal = (typeof gsDollarBalance === 'function') ? gsDollarBalance(cid) : 0;
  const pay = Math.min(owed, Math.max(0, bal));
  if(pay <= 0) return 0;
  gsDollarPay(cid, gsLeaseOwner(l), pay,
    (ch.kind === 'rent' ? 'rent ' : ch.kind + ' ') + ch.period);
  ch.owedBy[cid] -= pay;
  ch.paidBy[cid] = (ch.paidBy[cid] || 0) + pay;
  if(res && res.paid) res.paid.push({ unit: l.unit_id, cid, amt: pay, period: ch.period });
  if(gsChargeOwed(ch) <= 0){
    ch.status = 'paid';
    gsLeaseFeed(ch.kind + '_paid', l, { cid, period: ch.period, amt: ch.amt,
      day: date, late: ch.late });
  }
  return pay;
}
/* auto-pay each share at charge posting — except a share with a pay
   habit whose number came up this month (lateEvery/lateDays). */
function gsLeaseAutopay(l, ch, date, res){
  for(const cid in ch.owedBy){
    const spec = l.shares[cid];
    if(ch.kind === 'rent' && spec && spec.lateEvery &&
       l.chargeSeq > 0 && l.chargeSeq % spec.lateEvery === 0){
      (ch.catchUp = ch.catchUp || {})[cid] =
        gsDateAdd(ch.dueOn, spec.lateDays || 10); // e.g. Marcus, every 3rd month
      continue;
    }
    gsChargePay(l, ch, cid, date, res);
  }
}
/* manual payment — the payer covers their own owed first, then a
   roommate's (Priya covering Marcus is a real thing that happens).
   Only what is actually owed moves — no overpayment float. */
function gsPayRent(unitId, cid, amt, date){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  const totalOwed = gsLeaseOwed(l).total;
  const bal = (typeof gsDollarBalance === 'function') ? gsDollarBalance(cid) : 0;
  const pay = Math.min(Math.floor(amt), Math.max(0, bal), totalOwed);
  if(pay <= 0)
    return { ok: false,
             reason: totalOwed <= 0 ? 'nothing_owed' : 'insufficient_dollars',
             paid: 0 };
  gsDollarPay(cid, gsLeaseOwner(l), pay, 'rent payment ' + (date || ''));
  let rem = pay, applied = 0;
  for(const ch of l.charges){
    if(rem <= 0) break;
    if(ch.status === 'paid') continue;
    const order = [cid].concat(Object.keys(ch.owedBy).filter(k => k !== cid));
    for(const k of order){
      if(rem <= 0) break;
      const owe = ch.owedBy[k] || 0;
      if(owe <= 0) continue;
      const a = Math.min(owe, rem);
      ch.owedBy[k] -= a; rem -= a; applied += a;
      ch.paidBy[cid] = (ch.paidBy[cid] || 0) + a;   // books: who PAID
      // owedBy[k] keeps WHO owed — arrears attribution survives covering
    }
    if(gsChargeOwed(ch) <= 0){
      ch.status = 'paid';
      gsLeaseFeed(ch.kind + '_paid', l, { cid, period: ch.period, amt: ch.amt,
        day: date, late: ch.late });
    }
  }
  return { ok: true, paid: applied, applied, left: rem };
}
/* derived arrears view — owedBy is the truth; nothing cached */
function gsLeaseOwed(l){
  const o = { total: 0, rent: 0, deposit: 0, fees: 0, by: {} };
  if(!l || !l.charges) return o;
  for(const ch of l.charges){
    if(ch.status === 'paid') continue;
    for(const cid in ch.owedBy){
      const a = ch.owedBy[cid];
      if(a <= 0) continue;
      o.total += a; o.by[cid] = (o.by[cid] || 0) + a;
      if(ch.kind === 'rent') o.rent += a;
      else if(ch.kind === 'deposit') o.deposit += a;
      else o.fees += a;
    }
  }
  return o;
}

/* ---------------- the daily rent run ----------------
   Idempotent per (lease, period): charges key on period, notices key on
   id. Tests drive it with explicit dates; the live tick feeds it the
   real SF date once per day. Returns a summary for the books/tests. */
function gsRentTick(dateStr){
  const d = gsDateParse(dateStr);
  if(!d) return null;
  const period = gsPeriodOf(dateStr);
  const res = { day: dateStr, posted: [], paid: [], late: [],
                executable: [], cured: [], rolled: [], raised: [] };
  for(const l of GS_REG.leases){
    if(l.status !== 'active' && l.status !== 'owner-occupied') continue;
    gsLeaseEnsure(l);

    /* 1. a served rent raise takes effect on its effective date — BEFORE
       charges post, so the new month's bill lands at the new rent. Shares
       rescale pro-rata (roommates split the increase evenly). */
    if(l.pendingRaise && l.pendingRaise.effectiveOn &&
       dateStr >= l.pendingRaise.effectiveOn){
      const from = l.monthly_rent, to = l.pendingRaise.amt;
      l.raiseHist.push({ on: dateStr, from, to });
      if(from > 0) for(const cid in l.shares)
        l.shares[cid].amt = Math.round(l.shares[cid].amt * to / from);
      l.monthly_rent = to;
      l.pendingRaise = null;
      gsLeaseFeed('rent_raised', l, { from, to, day: dateStr });
      res.raised.push(l.unit_id);
    }

    /* 2. fixed terms roll to month-to-month when they lapse (CA default —
       a lease that ends without renewal keeps running monthly) */
    if(l.term !== 'month-to-month' && l.endOn && dateStr > l.endOn){
      l.term = 'month-to-month'; l.endOn = null;
      gsLeaseFeed('term_rolled', l, { day: dateStr });
      res.rolled.push(l.unit_id);
    }

    /* 3. rent charges: one per period from when the books open
       (booksFrom = the first day the system sees the lease, so a lease
       signed decades before this system existed never back-bills). If
       the tick missed a month (offline), the skipped period posts on
       the next run — rent is owed whether or not anyone ran the books.
       Mid-month move-ins get an honest pro-rated first month. */
    if(l.monthly_rent > 0){
      if(!l.booksFrom) l.booksFrom = dateStr;
      const startP = l.startOn ? gsPeriodOf(l.startOn) : null;
      let p = gsPeriodOf(l.booksFrom);
      if(startP && startP > p) p = startP;         // future-dated start
      while(p && p <= period){
        if(!gsChargeFor(l, p, 'rent')){
          const pd = gsDateParse(p + '-01');
          let dueOn = p + '-' + gsPad2(l.dueDay), amt = l.monthly_rent;
          if(startP === p && gsDateParse(l.startOn).d > 1){
            const sd = gsDateParse(l.startOn).d;
            dueOn = l.startOn;
            amt = Math.round(l.monthly_rent *
                             (gsDim(pd.y, pd.m) - sd + 1) / gsDim(pd.y, pd.m));
          }
          if(dateStr >= dueOn){
            const ch = gsPostCharge(l, { kind: 'rent', period: p, dueOn, amt });
            l.chargeSeq++;
            res.posted.push({ unit: l.unit_id, period: p, amt });
            gsLeaseAutopay(l, ch, dateStr, res);
          }
        }
        const dd = gsDateParse(p + '-01');
        let y = dd.y, m = dd.m + 1;
        if(m > 12){ m = 1; y++; }
        p = y + '-' + gsPad2(m);
      }
    }

    /* 4. open charges: scheduled catch-ups arrive, retried shares pay,
       and anything still owed past grace earns the modest late fee */
    for(const ch of l.charges){
      if(ch.status === 'paid') continue;
      for(const cid in ch.owedBy){
        if((ch.owedBy[cid] || 0) <= 0) continue;
        const cu = ch.catchUp && ch.catchUp[cid];
        if(cu && dateStr < cu) continue;          // habitually late — not yet
        if(cu) delete ch.catchUp[cid];            // the day arrived — pay up
        gsChargePay(l, ch, cid, dateStr, res);
      }
      if(ch.status === 'paid') continue;
      if(!ch.late && gsDateDiff(dateStr, ch.dueOn) > GS_RENT_GRACE_DAYS){
        /* late fee pro-rata over whoever still owes — the delinquent
           share carries its own penalty, the punctual roommate doesn't */
        const owedNow = gsChargeOwed(ch);
        const fee = Math.min(GS_LATE_FEE_CAP, Math.round(owedNow * GS_LATE_FEE_PCT));
        ch.late = true; ch.lateFee = fee; ch.lateOn = dateStr;
        let feeRem = fee;
        const debtors = Object.keys(ch.owedBy).filter(k => ch.owedBy[k] > 0);
        debtors.forEach((cid, i) => {
          const f = (i === debtors.length - 1) ? feeRem
            : Math.round(fee * ch.owedBy[cid] / owedNow);
          ch.owedBy[cid] += f; feeRem -= f;
        });
        gsLeaseFeed('rent_late', l, { period: ch.period, owed: owedNow,
          fee, day: dateStr, debtors });
        res.late.push({ unit: l.unit_id, period: ch.period, owed: owedNow, fee });
      }
    }

    /* 5. notices mature: cure windows close, deadlines make them
       executable (pay arrears in time and a pay-or-quit just cures) */
    gsProcessNotices(l, dateStr, res);
  }
  return res;
}

/* ---------------- applications ----------------
   the paper path in: apply -> landlord approves or denies -> signing.
   Approval signs the lease AND posts the deposit charge (1 month,
   CA-reasonable) — the move-in money that hire's stake covers. */
function gsApplyForLease(unitId, applicantId, spec){
  const u = (typeof gsUnitById === 'function') ? gsUnitById(unitId) : null;
  if(!u) return { ok: false, reason: 'unknown_unit' };
  if(typeof gsUnitLivable === 'function' && !gsUnitLivable(u))
    return { ok: false, reason: 'unit_not_livable' };
  if(GS_LEASE.apps.some(a => a.unit_id === unitId &&
      a.applicant_id === applicantId && a.status === 'pending'))
    return { ok: false, reason: 'already_applied' };
  const app = { id: 'app-' + (++GS_LEASE.appSeq), unit_id: unitId,
    applicant_id: applicantId,
    occupants: (spec && spec.occupants) || [applicantId],
    note: (spec && spec.note) || null,
    /* v8: a hire package or negotiated lease may carry its own deposit
       terms (0 = waived); undefined keeps the 1-month default */
    deposit: spec && spec.deposit,
    appliedOn: (spec && spec.date) || null, status: 'pending' };
  GS_LEASE.apps.push(app);
  gsLeaseFeed('apply', { unit_id: unitId, tenant_id: applicantId },
    { applicant: applicantId, day: app.appliedOn });
  return app;
}
function gsApproveApplication(appId, opts){
  opts = opts || {};
  const app = GS_LEASE.apps.find(a => a.id === appId);
  if(!app || app.status !== 'pending') return { ok: false, reason: 'no_pending_app' };
  if(typeof gsActiveLease === 'function' && gsActiveLease(app.unit_id))
    return { ok: false, reason: 'unit_occupied' };
  const l = gsSignLease(app.unit_id, app.applicant_id, {
    start: opts.date || null, occupants: app.occupants,
    deposit: app.deposit });
  if(!l) return { ok: false, reason: 'unit_not_livable' };
  gsLeaseEnsure(l);
  app.status = 'approved'; app.leaseUnit = l.unit_id;
  if(l.monthly_rent > 0 && l.deposit > 0){
    const ch = gsPostCharge(l, { kind: 'deposit',
      period: gsPeriodOf(opts.date || l.start || '1970-01'),
      dueOn: opts.date || l.start || '1970-01-01', amt: l.deposit });
    gsLeaseAutopay(l, ch, opts.date || l.start, null);   // move-in money
  }
  gsLeaseFeed('sign', l, { rent: l.monthly_rent, deposit: l.deposit,
    occupants: l.occupants, day: opts.date || null });
  return { ok: true, lease: l, app };
}
function gsDenyApplication(appId, opts){
  const app = GS_LEASE.apps.find(a => a.id === appId);
  if(!app || app.status !== 'pending') return { ok: false, reason: 'no_pending_app' };
  app.status = 'denied'; app.deniedOn = (opts && opts.date) || null;
  app.reason = (opts && opts.reason) || 'denied';
  gsLeaseFeed('deny_app', { unit_id: app.unit_id, tenant_id: app.applicant_id },
    { applicant: app.applicant_id, reason: app.reason, day: app.deniedOn });
  return { ok: true, app };
}
function gsPendingApps(unitId){
  return GS_LEASE.apps.filter(a => a.status === 'pending' &&
    (!unitId || a.unit_id === unitId));
}

/* ---------------- violations ----------------
   world-truth records on the lease; `discovered` is the information
   boundary — the landlord can't serve a cure notice on a violation he
   doesn't know about. Jules's spare-room sublet is the canonical seed. */
function gsRecordViolation(unitId, spec){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return null;
  gsLeaseEnsure(l);
  spec = spec || {};
  const v = { id: 'vio-' + (++GS_LEASE.nSeq),
    kind: spec.kind || 'unpermitted_occupant',
    who: spec.who || null, since: spec.since || null,
    note: spec.note || null, discovered: !!spec.discovered,
    status: 'open', curedOn: null, how: null };
  l.violations.push(v);
  if(v.discovered)
    gsLeaseFeed('violation', l, { violId: v.id, kind: v.kind, who: v.who,
      via: 'known', day: spec.since });
  return v;
}
/* admin walk-through — an inspection surfaces every open violation on
   the unit (this is how Victor would find Jules before a sale) */
function gsInspectUnit(unitId, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  const found = [];
  for(const v of l.violations)
    if(v.status === 'open' && !v.discovered){ v.discovered = true; found.push(v); }
  for(const v of found)
    gsLeaseFeed('violation', l, { violId: v.id, kind: v.kind, who: v.who,
      via: 'inspection', day: opts && opts.date });
  gsLeaseFeed('inspection', l, { found: found.length,
    day: opts && opts.date, by: (opts && opts.by) || 'owner' });
  return { ok: true, found };
}
/* a neighbor report (or the substrate later) surfaces one violation */
function gsReportViolation(unitId, who, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return false;
  gsLeaseEnsure(l);
  const v = l.violations.find(x => x.status === 'open' &&
    !x.discovered && (!who || x.who === who));
  if(!v) return false;
  v.discovered = true;
  gsLeaseFeed('violation', l, { violId: v.id, kind: v.kind, who: v.who,
    via: 'report', day: opts && opts.date });
  return true;
}
/* cure paths: 'added_to_lease' puts the occupant on the paperwork;
   'departed' ends the occupancy. Both close the violation. */
function gsCureViolation(unitId, violId, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  const v = l.violations.find(x => x.id === violId && x.status === 'open');
  if(!v) return { ok: false, reason: 'no_open_violation' };
  const how = (opts && opts.how) || 'departed';
  if(how === 'added_to_lease' && v.who &&
     (l.occupants || []).indexOf(v.who) < 0){
    l.occupants.push(v.who);
    if(!l.shares[v.who])
      l.shares[v.who] = { amt: 0, lateEvery: 0, lateDays: 0 }; // leaseholder still pays
  }
  v.status = 'cured'; v.curedOn = (opts && opts.date) || null; v.how = how;
  gsLeaseFeed('violation_cured', l, { violId: v.id, kind: v.kind, who: v.who,
    how, day: v.curedOn });
  return { ok: true, violation: v };
}

/* ---------------- notices + eviction (admin-only — design §3) ---------
   These functions are deliberately NOT reachable through the request
   bus: tenant/landlord matters are owner tooling. Every call posts to
   the public feed, so the power is exercised in the open. */
function gsServeNotice(unitId, kind, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  if(!GS_NOTICE_DAYS[kind]) return { ok: false, reason: 'bad_notice' };
  opts = opts || {};
  let violId = null;
  if(kind === 'pay_or_quit' && !(gsLeaseOwed(l).total > 0))
    return { ok: false, reason: 'nothing_owed' };
  if(kind === 'cure_or_quit'){
    const v = l.violations.find(x => x.status === 'open' && x.discovered &&
      (!opts.violId || x.id === opts.violId));
    if(!v) return { ok: false, reason: 'no_discovered_violation' };
    violId = v.id;
  }
  const date = opts.date || null;
  const n = { id: 'ntc-' + (++GS_LEASE.nSeq), kind, servedOn: date,
    deadline: date ? gsDateAdd(date, GS_NOTICE_DAYS[kind]) : null,
    status: 'open', detail: opts.detail || null, violId,
    by: opts.by || 'owner' };
  l.notices.push(n);
  gsLeaseFeed('notice', l, { noticeId: n.id, kind, deadline: n.deadline,
    detail: n.detail, day: date });
  return { ok: true, notice: n };
}
/* notices mature inside the rent run (also called inline by eviction) */
function gsProcessNotices(l, dateStr, res){
  if(!l.notices) return;
  for(const n of l.notices){
    if(n.status !== 'open') continue;
    let cured = false;
    if(n.kind === 'pay_or_quit') cured = gsLeaseOwed(l).total === 0;
    else if(n.kind === 'cure_or_quit'){
      const v = (l.violations || []).find(x => x.id === n.violId);
      cured = !v || v.status !== 'open';
    }
    if(cured){
      n.status = 'cured';
      gsLeaseFeed('notice_cured', l, { noticeId: n.id, kind: n.kind, day: dateStr });
      if(res && res.cured) res.cured.push(n.id);
    } else if(n.deadline && gsDateDiff(dateStr, n.deadline) > 0){
      n.status = 'executable';
      gsLeaseFeed('notice_executable', l, { noticeId: n.id, kind: n.kind,
        day: dateStr });
      if(res && res.executable) res.executable.push(n.id);
    }
  }
}
/* the end of the line: needs an executable notice, or an explicit owner
   override (no-fault — allowed, but the feed says so and the lease
   record keeps `noFault` for the reputation pass). Ends the lease,
   frees the unit, un-homes displaced hired characters. */
function gsAdminEvict(unitId, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  opts = opts || {};
  if(opts.date) gsProcessNotices(l, opts.date, null);
  const exec = (l.notices || []).find(n => n.status === 'executable');
  if(!exec && !opts.override)
    return { ok: false, reason: 'no_executable_notice' };
  if(exec) exec.status = 'executed';
  for(const n of l.notices) if(n.status === 'open') n.status = 'moot';
  const displaced = [l.tenant_id].concat(l.occupants || []);
  for(const v of l.violations || [])
    if(v.status === 'open' && v.who && displaced.indexOf(v.who) < 0)
      displaced.push(v.who);
  l.status = 'evicted'; l.end = opts.date || null;
  l.evictReason = opts.reason || (exec && exec.kind) || 'eviction';
  l.noFault = !exec;
  /* hired characters lose their registered home — they stay hired and
     possessable, but they're homeless until they land a new lease */
  if(typeof GS_HIRED !== 'undefined')
    for(const cid of displaced) if(GS_HIRED[cid]) GS_HIRED[cid].unitId = null;
  gsLeaseFeed('evict', l, { reason: l.evictReason, noFault: l.noFault,
    notice: exec && exec.id, displaced, day: opts.date || null });
  return { ok: true, tenant: l.tenant_id, unit: l.unit_id,
           address: gsAddressOfUnit(l.unit_id), noFault: l.noFault,
           displaced };
}
/* the peaceful ending — tenant moves out; the address stays (spec §3) */
function gsVacate(unitId, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  const who = (opts && opts.by) || l.tenant_id;
  l.status = 'ended'; l.end = (opts && opts.date) || null; l.vacatedBy = who;
  for(const n of l.notices) if(n.status === 'open') n.status = 'moot';
  gsLeaseFeed('vacate', l, { by: who, day: l.end });
  return { ok: true };
}

/* ---------------- rent raises ---------------- */
function gsRaiseRent(unitId, newRent, opts){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return { ok: false, reason: 'no_active_lease' };
  gsLeaseEnsure(l);
  const u = gsUnitById(l.unit_id);
  opts = opts || {};
  const date = opts.date || null;
  newRent = Math.floor(newRent);
  if(!(newRent > l.monthly_rent)) return { ok: false, reason: 'not_a_raise' };
  const cap = (u && u.rent_controlled) ? GS_RC_MAX_RAISE : GS_MK_MAX_RAISE;
  const maxRent = Math.floor(l.monthly_rent * (1 + cap));
  /* one raise per 12 months, and never inside the first year of tenancy */
  const anchor = l.raiseHist.length ? l.raiseHist[l.raiseHist.length - 1].on
                                  : l.startOn;
  if(anchor && date && gsDateDiff(date, anchor) < GS_RAISE_MIN_GAP_DAYS)
    return { ok: false, reason: 'raise_too_soon', lastOn: anchor };
  if(newRent > maxRent)
    return { ok: false, reason: 'raise_over_cap', max: maxRent, cap };
  l.pendingRaise = { amt: newRent, servedOn: date,
    effectiveOn: date ? gsDateAdd(date, GS_RAISE_NOTICE_DAYS) : null };
  gsLeaseFeed('rent_raise_served', l, { from: l.monthly_rent, to: newRent,
    effectiveOn: l.pendingRaise.effectiveOn, cap, day: date });
  return { ok: true, effectiveOn: l.pendingRaise.effectiveOn, max: maxRent };
}

/* ---------------- who lives where ---------------- */
function gsHomeOf(cid){
  for(const l of GS_REG.leases){
    const live = l.status === 'active' || l.status === 'owner-occupied';
    if(!live) continue;
    const addr = (typeof gsAddressOfUnit === 'function')
      ? gsAddressOfUnit(l.unit_id) : null;
    if(l.tenant_id === cid)
      return { unit_id: l.unit_id, address: addr,
               via: l.status === 'owner-occupied' ? 'owner' : 'lease' };
    if((l.occupants || []).indexOf(cid) >= 0)
      return { unit_id: l.unit_id, address: addr, via: 'occupant' };
    if((l.violations || []).some(v => v.status === 'open' &&
        v.who === cid && v.kind === 'unpermitted_occupant'))
      return { unit_id: l.unit_id, address: addr, via: 'unpermitted' };
  }
  return null;
}
function gsResidentsOf(unitId){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return [];
  const out = [l.tenant_id].concat(l.occupants || []);
  for(const v of l.violations || [])
    if(v.status === 'open' && v.kind === 'unpermitted_occupant' && v.who &&
       out.indexOf(v.who) < 0) out.push(v.who);
  return out.filter((x, i) => x && out.indexOf(x) === i);
}
/* the acceptance audit: every cast member resolves to a registry unit */
function gsCastHousing(){
  const cast = (typeof NV_CAST !== 'undefined') ? NV_CAST : [];
  const map = {}, missing = [];
  for(const c of cast){
    const h = gsHomeOf(c.id);
    map[c.id] = h;
    if(!h) missing.push(c.id);
  }
  return { total: cast.length, housed: cast.length - missing.length,
           missing, map };
}
/* the landlord's rent roll — admin work tool (design §9.4: the rent
   ledger is operational knowledge, not secrets) */
function gsLeaseBook(){
  return GS_REG.leases
    .filter(l => l.status === 'active' || l.status === 'owner-occupied')
    .map(l => {
      gsLeaseEnsure(l);
      const owed = gsLeaseOwed(l);
      return { unit: l.unit_id, address: gsAddressOfUnit(l.unit_id),
        tenant: l.tenant_id, occupants: l.occupants,
        rent: l.monthly_rent, dueDay: l.dueDay, term: l.term,
        owed: owed.total, owedBy: owed.by,
        openCharges: l.charges.filter(c => c.status !== 'paid').length,
        lateCharges: l.charges.filter(c => c.late && c.status !== 'paid').length,
        openNotices: l.notices.filter(n => n.status === 'open' ||
          n.status === 'executable').length,
        openViolations: l.violations.filter(v => v.status === 'open').length,
        status: l.status };
    });
}
function gsLeaseStatement(unitId){
  const l = (typeof gsActiveLease === 'function') ? gsActiveLease(unitId) : null;
  if(!l) return null;
  gsLeaseEnsure(l);
  return { unit: unitId, address: gsAddressOfUnit(unitId),
    tenant: l.tenant_id, occupants: l.occupants, status: l.status,
    rent: l.monthly_rent, dueDay: l.dueDay, term: l.term,
    deposit: l.deposit, start: l.startOn || l.start,
    owed: gsLeaseOwed(l), residents: gsResidentsOf(unitId),
    charges: l.charges.map(c => ({ kind: c.kind, period: c.period,
      dueOn: c.dueOn, amt: c.amt, owed: gsChargeOwed(c), owedBy: c.owedBy,
      paidBy: c.paidBy, status: c.status, late: c.late, lateFee: c.lateFee })),
    notices: l.notices.map(n => ({ id: n.id, kind: n.kind,
      servedOn: n.servedOn, deadline: n.deadline, status: n.status })),
    violations: l.violations.map(v => ({ id: v.id, kind: v.kind,
      who: v.who, discovered: v.discovered, status: v.status })),
    disputes: (l.disputes || []).map(d => ({ kind: d.kind, by: d.by,
      since: d.since, note: d.note, status: d.status })),
    pendingRaise: l.pendingRaise };
}

/* ---------------- SF seed: the whole cast, housed ----------------
   Runs at module load under SF_MODE — by then gsSeedSF has already
   built the canonical cast homes (module order in _order.txt). It
   can't live inside gsSeedSF: that runs during the registry module's
   own evaluation, before GS_LEASE exists. Idempotent: everything is
   state-checked, never blindly re-added. */
function gsAmbientHomeCell(id){
  const lat = 37.7560 + (hashString18(id) % 40) / 2000;
  const lon = -122.4240 + (hashString18(id + 'x') % 60) / 3000;
  if(typeof sfLatLonCell === 'function') return sfLatLonCell(lat, lon);
  const mLon = 111320 * Math.cos(Math.PI * SF_M.lat0 / 180);
  const mx = (lon - SF_M.lon0) * mLon - SF_M.minx;
  const my = -(lat - SF_M.lat0) * 111320 - SF_M.miny;
  return { wx: Math.round(mx / SF_M.cell_m), wy: Math.round(my / SF_M.cell_m) };
}
function gsAmbientStart(id){
  return (2017 + hashString18(id + 's') % 8) + '-' +
    gsPad2(1 + hashString18(id + 'm') % 12) + '-' +
    gsPad2(1 + hashString18(id + 'd') % 28);
}
/* door cell of a registry building via its SF_MAP record (static data —
   no dependence on runtime SF_DOOR_OF, which fills at world init) */
function gsBldDoorCell(b){
  const mb = (typeof SF_MAP !== 'undefined' && SF_MAP.buildings &&
             b.bld_idx != null) ? SF_MAP.buildings[b.bld_idx] : null;
  if(!mb) return null;
  if(mb.door) return { wx: mb.door.cx, wy: mb.door.cy };
  const cm = (typeof SF_M !== 'undefined' && SF_M && SF_M.cell_m) || 2;
  return { wx: Math.round(mb.cx / cm), wy: Math.round(mb.cy / cm) };
}
function gsNearestFreeBld(cell){
  let best = null, bd = Infinity;
  for(const b of GS_REG.buildings){
    if(b.bld_idx == null || b.status !== 'standing') continue;
    if(!b.units.some(uid => gsUnitVacant(gsUnitById(uid)))) continue;  // vacancy
    const dc = gsBldDoorCell(b);
    if(!dc) continue;
    const d = Math.hypot(dc.wx - cell.wx, dc.wy - cell.wy);
    if(d < bd){ bd = d; best = b; }
  }
  return best;
}
function gsLeaseSeedSF(){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return 0;
  for(const l of GS_REG.leases) gsLeaseEnsure(l);          // enrich all
  /* the 9457-3 flat's roommate split — Priya's half is punctual;
     Marcus's is late about every third month (canonical content), which
     the late-fee / arrears machinery now makes real instead of told.
     (Shares are normally set at signing; this is the safety net for
     leases loaded from older snapshots.) */
  const l9457 = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor('C4').find(l => l.status === 'active') : null;
  if(l9457 && (!l9457.shares || !l9457.shares.C5)){
    const half = Math.round(l9457.monthly_rent / 2);
    l9457.shares = { C4: { amt: half, lateEvery: 0, lateDays: 0 },
      C5: { amt: l9457.monthly_rent - half, lateEvery: 3, lateDays: 10 } };
  }
  /* the contested raise (jobs-housing §3): Victor raised 9457-3
     $2600→$3200; Priya disputes the passthrough claim AND reports a
     dead heater. World-truth record — the dispute is a live storyline,
     deliberately left open and ambiguous. */
  if(l9457){
    if(!l9457.raiseHist.some(r => r.to === 3200))
      l9457.raiseHist.push({ on: '2025-08-01', from: 2600, to: 3200,
        note: 'passthrough claim — contested by tenant' });
    if(!(l9457.disputes || []).some(d => d.kind === 'rent_raise'))
      l9457.disputes.push({ kind: 'rent_raise', by: 'C4',
        since: '2025-08-01', status: 'open',
        note: 'raise $2600→$3200 contested: passthrough claim + dead ' +
              'heater (habitability). Ambiguous on purpose.' });
  }
  /* Jules (C2): the spare room at 9418-A — cash, month-to-month,
     deliberately NOT on Carmen's lease. Recorded as the open,
     undiscovered violation it is; gsHomeOf resolves her through it. */
  const lC6 = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor('C6').find(l => l.status === 'active') : null;
  if(lC6 && !(lC6.violations || []).some(v => v.who === 'C2' &&
      v.status === 'open' && v.kind === 'unpermitted_occupant'))
    gsRecordViolation(lC6.unit_id, { kind: 'unpermitted_occupant', who: 'C2',
      since: '2025-11-01',
      note: 'spare-room cash sublet ($700/mo to Carmen) — deliberately ' +
            'off the lease' });
  /* Dani (C3): the Geneva Ave flat is her cousins' lease — she pays a
     $700 informal room share and is not on the paperwork. Same
     off-lease-occupant mechanics as Jules, different flavor. */
  const lCous = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor('reyes-cousins').find(l => l.status === 'active') : null;
  if(lCous && !(lCous.violations || []).some(v => v.who === 'C3' &&
      v.status === 'open' && v.kind === 'unpermitted_occupant'))
    gsRecordViolation(lCous.unit_id, { kind: 'unpermitted_occupant',
      who: 'C3', since: '2023-02-01',
      note: 'pays $700/mo informal room share to the cousins — ' +
            'not on the lease' });
  let n = 0;
  if(typeof NV_CAST !== 'undefined'){
    /* canonical detail: 9457 unit 1 holds "an ambient household" —
     assign whichever still-unhoused ambient lives nearest its door */
    const b9457 = GS_REG.buildings.find(b => b.canon === 'home-c4c5');
    const u9457_1 = b9457 &&
      gsUnitsOf(b9457.id).find(u => u.unit_code === '1');
    if(u9457_1 && gsUnitVacant(u9457_1)){
      const dc = gsBldDoorCell(b9457);
      let pick = null, bd = Infinity;
      for(const c of NV_CAST){
        if(c.tier !== 'ambient' || gsHomeOf(c.id)) continue;
        const cell = gsAmbientHomeCell(c.id);
        const d = dc ? Math.hypot(dc.wx - cell.wx, dc.wy - cell.wy) : 0;
        if(d < bd){ bd = d; pick = c; }
      }
      if(pick){
        gsSignLease(u9457_1.id, pick.id, { start: gsAmbientStart(pick.id),
          monthly_rent: u9457_1.base_rent, occupants: [pick.id] });
        n++;
      }
    }
    /* ambient cast: each resolves their hashed home cell to the nearest
       registered residential building with a free unit, and signs there */
    for(const c of NV_CAST){
      if(c.tier !== 'ambient' || gsHomeOf(c.id)) continue;
      const b = gsNearestFreeBld(gsAmbientHomeCell(c.id));
      const u = b && gsUnitsOf(b.id).find(x => gsUnitVacant(x));
      if(!u) continue;
      gsSignLease(u.id, c.id, { start: gsAmbientStart(c.id),
        monthly_rent: u.base_rent, occupants: [c.id] });
      n++;
    }
    /* in-world dollars: every cast member has a bank balance so the
       rent run moves real money (Victor's is landlord-scale — he
       collects the Guerrero rents, he doesn't pay). Non-cast tenants
       of record (the Reyes cousins) get a balance too — they pay real
       rent through the same books. */
    for(const c of NV_CAST){
      if(gsDollarBalance(c.id) > 0) continue;
      const amt = (c.id === 'C7')
        ? 40000 + hashString18('bank' + c.id) % 20000
        : 3000 + hashString18('bank' + c.id) % 9000;
      gsDollarGrant(c.id, amt, 'household savings (seed)');
    }
    if(gsDollarBalance('reyes-cousins') <= 0)
      gsDollarGrant('reyes-cousins', 6000 +
        hashString18('bank reyes-cousins') % 6000, 'household savings (seed)');
  }
  return n;
}

/* ---------------- live wiring ----------------
   the show runs on real SF days: one rent run per calendar day, checked
   on a slow wall-clock throttle. Inert outside SF_MODE (the registry is
   empty in medieval anyway, but the gate keeps the worlds honest). */
let gsLeaseLastMs = 0;
function gsLeaseSysTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  const ms = Date.now();
  if(ms - gsLeaseLastMs < 30000) return;
  gsLeaseLastMs = ms;
  const today = gsTodayStr();
  if(today && today !== GS_LEASE.lastTickDay){
    GS_LEASE.lastTickDay = today;
    gsRentTick(today);
  }
}
if(typeof registerSimTick === 'function') registerSimTick(gsLeaseSysTick);

/* ---------------- persistence ----------------
   lease lifecycle fields live INSIDE the lease records, so they ride
   gsRegSnapshot/gsRegLoad for free; GS_LEASE (applications, sequences)
   has its own pair. */
function gsLeaseSnapshot(){
  return JSON.stringify({ apps: GS_LEASE.apps, nSeq: GS_LEASE.nSeq,
    appSeq: GS_LEASE.appSeq, lastTickDay: GS_LEASE.lastTickDay });
}
function gsLeaseLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d) return false;
    GS_LEASE.apps = d.apps || []; GS_LEASE.nSeq = d.nSeq || 0;
    GS_LEASE.appSeq = d.appSeq || 0;
    GS_LEASE.lastTickDay = d.lastTickDay || null;
    for(const l of GS_REG.leases) gsLeaseEnsure(l);
    return true;
  }catch(e){ return false; }
}
function gsLeaseReset(){
  GS_LEASE.apps.length = 0; GS_LEASE.nSeq = 0; GS_LEASE.appSeq = 0;
  GS_LEASE.lastTickDay = null;
}

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsHomeOf = (cid) => gsHomeOf(cid);
  window.__aiBridge.gsCastHousing = () => gsCastHousing();
  window.__aiBridge.gsLeaseBook = () => gsLeaseBook();
  window.__aiBridge.gsLeaseStatement = (u) => gsLeaseStatement(u);
  window.__aiBridge.gsApplyForLease = (u, a, s) => gsApplyForLease(u, a, s);
  window.__aiBridge.gsApproveApplication = (id, o) => gsApproveApplication(id, o);
  window.__aiBridge.gsDenyApplication = (id, o) => gsDenyApplication(id, o);
  window.__aiBridge.gsServeNotice = (u, k, o) => gsServeNotice(u, k, o);
  window.__aiBridge.gsAdminEvict = (u, o) => gsAdminEvict(u, o);
  window.__aiBridge.gsRaiseRent = (u, r, o) => gsRaiseRent(u, r, o);
  window.__aiBridge.gsPayRent = (u, c, a, d) => gsPayRent(u, c, a, d);
  window.__aiBridge.gsInspectUnit = (u, o) => gsInspectUnit(u, o);
  window.__aiBridge.gsRentTick = (d) => gsRentTick(d);
  window.__aiBridge.gsResidentsOf = (u) => gsResidentsOf(u);
}

/* auto-seed under SF_MODE at load — gsSeedSF ran earlier in module
   order (registry before leases in _order.txt), so the canonical cast
   homes this enriches already exist */
if(typeof SF_MODE !== 'undefined' && SF_MODE) gsLeaseSeedSF();
