/* =====================================================================
   PART 41N — THE FRIDAY PAYROLL (v13 economy)
   rw-game-design §6 + GAME_SYSTEMS_ROADMAP v13 + world/jobs.json +
   world/budgets.json (v17, INTERNAL tier).

   The gap this closes: until now only HIRED characters drew wages and
   only rent touched the dollar ledger — the twenty-eight residents
   earned and ate for free. This module runs the whole dollar circuit:

   1. CANONICAL PAYROLL (GS_ECON_WORK) — the jobs.json held_by layer as
      live mechanics. Every main and every working ambient draws the
      wage their card says: weekly Friday for entry/informal hustles,
      biweekly Friday for mid/top bands, monthly on the 1st for
      benefits and the owner draw. Variable gigs jitter ±10% by a
      deterministic hash — Marcus's envelope really does vary.
      Employer accounts ('biz:*', 'gov:*') carry the same operating
      float convention as the hiring layer: payroll never bounces, and
      every top-up is a labeled faucet txn the audit counts.
   2. THE INFORMAL ECONOMY (GS_ECON_FLOWS) — cash that moves person to
      person and never touches the lease book: Jules's $700 room share
      to Carmen, Dani's $700 to the Reyes cousins. These are authored
      facts (budgets.md §"unrecorded") — the ledger records them
      faithfully AND the feed stays quiet, because the point of cash
      under the table is that the wire can't see it.
   3. THE NUT — the budgets.json living-cost envelope as an honest
      weekly drain: groceries, transit, utilities shares of each
      household's authored nut (mains) or the $490 baseline (ambients
      and hires). Each resident keeps a deterministic shopping day;
      grocery money lands at Buy-Rite or Malik's by hash. The drain
      PARTIAL-PAYS — food first, then transit, then utilities — and
      what can't be covered accrues as a recorded shortfall, never a
      negative balance.
   4. THE OWNER'S TOOLS — the rent ledger finally has a back office:
      gsEconBooks (the monthly statement: rent billed/collected, payroll
      out the door, informal flows, nut drain, net position),
      gsEconArrears (the collection queue — every owed cent attributed,
      every open notice counted, the next honest step named),
      gsEconPayroll (per-employer audit: headcount, wages, float),
      gsEconStub (one resident's money card), gsEconAudit (full replay
      of the append-only log — derived balances must equal live
      balances to the cent, both currencies, always).

   Currency discipline is absolute: this module never posts to the
   credits side. Feed policy: payroll beats are public texture (Friday
   is a thing the block feels); amounts, balances, and shortfalls are
   INTERNAL — they are logged, audited, and dropped from the wire.
   ===================================================================== */

/* ---------------- canonical payroll (jobs.json held_by layer) ----
   monthly figures are the budgets.json authored envelopes; cadence
   follows the shifts.json convention already coded in 41H: entry and
   informal work pays weekly Friday, mid/top bands biweekly Friday,
   pensions/benefits/owner draws monthly on the 1st. `src` is the
   ledger account the money leaves — shared with the hiring layer so a
   shop's float really is one till. */
const GS_ECON_WORK = [
  /* ---- mains ---- */
  { cid: 'C1', src: 'biz:mudhaus', employer: 'Mudhaus Coffee',
    role: 'Manager', monthly: 5190, cadence: 'biweekly' },
  { cid: 'C2', src: 'biz:mudhaus', employer: 'Mudhaus Coffee',
    role: 'Barista', monthly: 2800, cadence: 'weekly', variable: true },
  { cid: 'C3', src: 'biz:mudhaus', employer: 'Mudhaus Coffee',
    role: 'Barista', monthly: 2700, cadence: 'weekly', variable: true },
  { cid: 'C4', src: 'biz:sfgh', employer: 'SF General',
    role: 'RN, med-surg', monthly: 7490, cadence: 'biweekly' },
  { cid: 'C5', src: 'biz:pannier', employer: 'Flying Pannier Courier Co-op',
    role: 'Bike courier', monthly: 2600, cadence: 'weekly', variable: true },
  { cid: 'C7', src: 'biz:auerbach', employer: 'Auerbach Hardware',
    role: 'Owner draw', monthly: 5500, cadence: 'monthly', variable: true },
  { cid: 'C8', src: 'biz:farolote', employer: 'Taqueria El Farolote',
    role: 'Lead cook', monthly: 5190, cadence: 'biweekly' },
  /* ---- ambients (working) ---- */
  { cid: 'A01', src: 'biz:mudhaus', employer: 'Mudhaus Coffee',
    role: 'Barista', monthly: 3900, cadence: 'weekly', variable: true },
  { cid: 'A02', src: 'biz:dogwalk', employer: 'Dog-walking (independent)',
    role: 'Walker', monthly: 2600, cadence: 'weekly' },
  { cid: 'A03', src: 'biz:maliks', employer: "Malik's Mini Mart",
    role: 'Clerk', monthly: 3100, cadence: 'weekly', variable: true },
  { cid: 'A06', src: 'biz:muleit', employer: 'MuleIt',
    role: 'Delivery rider', monthly: 2200, cadence: 'weekly', variable: true },
  { cid: 'A07', src: 'biz:palmas', employer: 'Frutería Las Palmas',
    role: 'Vendor', monthly: 4000, cadence: 'weekly',
    variable: true, informal: true },
  { cid: 'A08', src: 'biz:busking', employer: 'Busking (park corners)',
    role: 'Musician', monthly: 1800, cadence: 'weekly',
    variable: true, informal: true },
  { cid: 'A09', src: 'biz:sfgh', employer: 'SF General',
    role: 'RN, med-surg', monthly: 7490, cadence: 'biweekly' },
  { cid: 'A10', src: 'biz:autosons', employer: 'Folsom Auto & Sons',
    role: 'Mechanic', monthly: 5880, cadence: 'biweekly' },
  { cid: 'A11', src: 'gov:library', employer: 'Mission Branch Library',
    role: 'Librarian', monthly: 5360, cadence: 'biweekly' },
  { cid: 'A13', src: 'biz:nimbus9', employer: 'Nimbus9 (remote)',
    role: 'Tech worker', monthly: 8650, cadence: 'biweekly' },
  { cid: 'A14', src: 'biz:needlepointe', employer: 'Needlepointe Tattoo',
    role: 'Artist', monthly: 4500, cadence: 'biweekly', variable: true },
  { cid: 'A16', src: 'biz:bai', employer: 'Baguette About It Bakery',
    role: 'Baker', monthly: 5070, cadence: 'biweekly' },
  { cid: 'A17', src: 'biz:folsomlot', employer: 'Construction (Folsom lot)',
    role: 'Laborer', monthly: 6230, cadence: 'biweekly' },
  { cid: 'A18', src: 'biz:bloom', employer: 'Bloom & Doom Flowers',
    role: 'Florist', monthly: 4330, cadence: 'biweekly' },
  /* ---- benefits & fixed income (monthly, on the 1st) ---- */
  { cid: 'C6', src: 'gov:benefits', employer: 'pension/SSI',
    role: 'Pension deposit', monthly: 1650, cadence: 'monthly' },
  { cid: 'C6', src: 'biz:hemming', employer: 'Hemming (word of mouth)',
    role: 'Seamstress', monthly: 300, cadence: 'weekly',
    variable: true, informal: true },
  { cid: 'A05', src: 'gov:benefits', employer: 'retiree benefit',
    role: 'Benefit deposit', monthly: 1600, cadence: 'monthly' },
  { cid: 'A19', src: 'gov:benefits', employer: 'longshore pension',
    role: 'Pension deposit', monthly: 1700, cadence: 'monthly' },
];

/* ---------------- the informal economy (cash, off the books) ----
   Authored in budgets.md as 'unrecorded' — the lease layer knows the
   violations; the ledger moves the money honestly. day = day-of-month. */
const GS_ECON_FLOWS = [
  { from: 'C2', to: 'C6', monthly: 700, day: 1, cat: 'share',
    label: 'room share — cash, off the lease' },
  { from: 'C3', to: 'reyes-cousins', monthly: 700, day: 1, cat: 'share',
    label: 'room share — cash, off the lease' },
];

/* ---------------- the nut (budgets.json living-cost envelope) ----
   Monthly nut per resident; mains use their authored household figure,
   everyone else (incl. hires) uses the nut_baseline total. Split into
   groceries/transit/utilities by the baseline's own proportions. */
const GS_ECON_NUT = { C1: 520, C2: 480, C3: 460, C4: 560,
                      C5: 520, C6: 520, C7: 600, C8: 450 };
const GS_ECON_NUT_BASE = 490;          // nut_baseline.total
const GS_ECON_NUT_SPLIT = { groceries: 0.65, transit: 0.17 };  // utils = rest
const GS_ECON_GROCERS = ['biz:buyrite', 'biz:maliks'];
const GS_ECON_FLOAT = 200000;          // employer operating float (41H convention)

const GS_ECON = {
  rec: {},        // cid -> { marks:{k->dateStr|'YYYY-MM'|'YYYY-Www'},
                //          nutShort:int, earned:int, spentNut:int,
                //          paidOut:int, nutDay:int }
  log: [],        // {n:txn.n, cat, cid, amt, date, label} — the audit index
  lastTickDay: null,
};
const GS_ECON_LOG_CAP = 60000;

function gsEconRec(cid){
  let r = GS_ECON.rec[cid];
  if(!r){
    r = GS_ECON.rec[cid] = { marks: {}, nutShort: 0, earned: 0,
      spentNut: 0, paidOut: 0,
      nutDay: hashString18(cid + '|shop') % 7 };
  }
  return r;
}
function gsEconLog(txn, cat, cid, dateStr, label){
  if(!txn) return;
  GS_ECON.log.push({ n: txn.n, cat, cid, amt: txn.amt,
                     date: dateStr, label });
  if(GS_ECON.log.length > GS_ECON_LOG_CAP)
    GS_ECON.log.splice(0, GS_ECON.log.length - GS_ECON_LOG_CAP);
}

/* deterministic ±10% jitter for variable gigs — same input, same week */
function gsEconVariableAmt(base, cid, dateStr){
  const pct = (hashString18(cid + '|var|' + dateStr) % 21) - 10;
  return Math.max(1, Math.round(base * (100 + pct) / 100));
}
function gsEconWeekly(row){ return Math.round(row.monthly * 12 / 52); }

/* employer float: top the till up before paying — every top-up is a
   labeled faucet txn ('employer float — X'), never hidden mints */
function gsEconFloat(acct, need, label){
  if((GS_LEDGER.dollars[acct] || 0) >= need) return 0;
  const t = gsDollarGrant(acct, GS_ECON_FLOAT,
                          'employer float — ' + label);
  return t ? GS_ECON_FLOAT : 0;
}

function gsEconPay(row, dateStr, amount, tag){
  gsEconFloat(row.src, amount, row.employer);
  const t = gsDollarPay(row.src, row.cid, amount,
      row.role + ' — ' + row.employer + (tag ? ' ' + tag : ''));
  if(!t) return null;
  /* audit categories: gov:benefits deposits are 'benefit' (pension,
     SSI — not payroll), off-book cash is 'informal', everything an
     employer pays out is 'wages' — a city paycheck (gov:library) is
     payroll too, and an owner draw is payroll from the shop */
  const cat = row.src === 'gov:benefits' ? 'benefit'
            : row.informal ? 'informal' : 'wages';
  gsEconLog(t, cat, row.cid, dateStr, row.employer);
  const r = gsEconRec(row.cid);
  r.earned += amount;
  return t;
}

/* ---------------- the daily econ run ----------------
   One pass per real SF day (same convention as gsRentTick). Paychecks
   land BEFORE the week's drains so Friday money covers Saturday
   groceries. Idempotent per marks — re-running a day changes nothing.
   Catch-up is honest: a tick covers every day SINCE the last tick (a
   dark week still pays its Friday), bounded to the trailing 62 days so
   a very long outage lands recent history rather than replaying a year. */
function gsEconTick(dateStr){
  const res = { day: dateStr, days: 0, paid: 0, paidAmt: 0, flows: 0,
                nuts: 0, nutShort: 0, skipped: [] };
  if(!dateStr || !gsDateParse(dateStr)) return res;
  if(GS_ECON.lastTickDay && GS_ECON.lastTickDay >= dateStr) return res;
  let cursor = dateStr;
  if(GS_ECON.lastTickDay){
    const gap = Math.min(gsDateDiff(dateStr, GS_ECON.lastTickDay), 62);
    cursor = gsDateAdd(dateStr, 1 - gap);
  }
  while(gsDateDiff(dateStr, cursor) >= 0){
    gsEconTickDay(cursor, res);
    GS_ECON.lastTickDay = cursor;
    res.days++;
    cursor = gsDateAdd(cursor, 1);
  }
  return res;
}
function gsEconTickDay(dateStr, res){
  const d = gsDateParse(dateStr);
  if(!d) return;
  const dow = new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay();
  const monthKey = d.y + '-' + gsPad2(d.m);
  const weekKey = monthKey + '-W' +
    gsPad2(Math.floor(gsDateDiff(dateStr, '2026-01-05') / 7));
  const friday = gsIsFriday(dateStr);
  let dayPaid = 0, dayPaidAmt = 0;

  /* 1 — payroll */
  GS_ECON_WORK.forEach((row, i) => {
    const key = 'w' + i;
    const r = gsEconRec(row.cid);
    if(row.cadence === 'monthly'){
      /* the 1st when ticked daily; a catch-up day when the books reopen
         after a gap — either way once a month, marked */
      if(r.marks[key] === monthKey) return;
      let amt = row.monthly;
      if(row.variable)
        amt = gsEconVariableAmt(amt, row.cid, monthKey);
      if(gsEconPay(row, dateStr, amt, '· ' + monthKey)){
        r.marks[key] = monthKey; res.paid++; res.paidAmt += amt;
        dayPaid++; dayPaidAmt += amt;
      } else res.skipped.push(row.cid);
      return;
    }
    if(!friday) return;
    if(row.cadence === 'biweekly' &&
       !gsBiweeklyDue(row.cid, dateStr)) return;
    if(r.marks[key] === dateStr) return;
    let amt = gsEconWeekly(row) * (row.cadence === 'biweekly' ? 2 : 1);
    if(row.variable)
      amt = gsEconVariableAmt(amt, row.cid, dateStr);
    if(gsEconPay(row, dateStr, amt, '· ' + dateStr)){
      r.marks[key] = dateStr; res.paid++; res.paidAmt += amt;
      dayPaid++; dayPaidAmt += amt;
    } else res.skipped.push(row.cid);
  });
  if(friday && dayPaid > 0)
    gsEconFeed('payday', { count: dayPaid, amt: dayPaidAmt });

  /* 2 — informal flows (cash, month-start) */
  GS_ECON_FLOWS.forEach((f, i) => {
    const key = 'f' + i;
    if(f.monthly){
      if(d.d < f.day) return;
      const r = gsEconRec(f.from);
      if(r.marks[key] === monthKey) return;
      const t = gsDollarPay(f.from, f.to, f.monthly,
                            f.label + ' · ' + monthKey);
      if(t){
        gsEconLog(t, 'share', f.from, dateStr, f.label);
        r.marks[key] = monthKey; r.paidOut += f.monthly; res.flows++;
      } else {
        /* cash short — the share goes unpaid this month, honestly.
           The feed carries the bare beat only: who and how much is
           INTERNAL money data (the rec marks + books keep it). */
        r.marks[key] = monthKey;
        gsEconFeed('share_short', {});
      }
    }
  });

  /* 3 — the nut: groceries, transit, utilities. Once per week per
     resident, on their own shopping day (or the first tick after it).
     Partial-pays in order — food first — and the unpaid remainder is
     a recorded shortfall, never an overdraft. */
  const nutCids = {};
  for(const row of GS_ECON_WORK) nutCids[row.cid] = true;
  if(typeof NV_CAST !== 'undefined')
    for(const c of NV_CAST) nutCids[c.id] = true;
  for(const cid in GS_HIRED) nutCids[cid] = true;
  for(const cid in nutCids){
    const r = gsEconRec(cid);
    if(r.marks.nut === weekKey) continue;
    if(dow < r.nutDay) continue;
    r.marks.nut = weekKey;
    const monthly = GS_ECON_NUT[cid] || GS_ECON_NUT_BASE;
    const wk = Math.round(monthly * 12 / 52);
    const groc = Math.round(wk * GS_ECON_NUT_SPLIT.groceries);
    const tran = Math.round(wk * GS_ECON_NUT_SPLIT.transit);
    const util = wk - groc - tran;               // remainder lands honest
    const grocer = GS_ECON_GROCERS[
      hashString18(cid + '|' + weekKey) % GS_ECON_GROCERS.length];
    const parts = [
      ['groceries', grocer, 'groceries'],
      ['transit', 'biz:sfmta', 'transit pass + rides'],
      ['utilities', 'biz:utility', 'utilities share'],
    ];
    let short = 0;
    for(const [cat, payee, lbl] of parts){
      const want = { groceries: groc, transit: tran, utilities: util }[cat];
      if(!(want > 0)) continue;
      const bank = GS_LEDGER.dollars[cid] || 0;
      const pay = Math.min(bank, want);
      if(pay > 0){
        const t = gsDollarPay(cid, payee, pay,
                              lbl + ' · ' + weekKey);
        if(t){ gsEconLog(t, 'nut_' + cat, cid, dateStr, payee);
               r.spentNut += pay; }
      }
      const missed = want - pay;
      if(missed > 0){ r.nutShort += missed; short += missed; }
    }
    res.nuts++;
    if(short > 0){
      res.nutShort += short;
      gsEconFeed('nut_short', {});   // bare beat — cid/amt stay INTERNAL
    }
  }
}

function gsEconFeed(action, extra){
  if(typeof gsBusEmit !== 'function') return;
  gsBusEmit('econ', { playerId: 'world', kind: 'econ', id: null,
    _now: (typeof gsNowMin === 'function') ? gsNowMin() : null },
    Object.assign({ action }, extra || {}));
}

/* ---------------- the owner's tools ----------------
   The rent ledger's back office. All derived views over the same two
   sources: GS_LEDGER.txns (the money that moved) and GS_ECON.log (the
   audit index that says what each move was). Nothing here is a second
   ledger — gsEconAudit proves the index faithful. */

/* the monthly statement: what the block's books say happened */
function gsEconBooks(period){
  period = period || (gsTodayStr() || '').slice(0, 7);
  const inP = e => e.date && e.date.slice(0, 7) === period;
  const out = { period,
    payroll: { paid: 0, headcount: 0, byEmployer: {}, floatTopups: 0 },
    benefits: 0, informal: 0,
    flows: { sharesOut: 0, count: 0 },
    nut: { groceries: 0, transit: 0, utilities: 0, shortCum: 0 },
    rent: { billed: 0, collected: 0, owedNow: 0, lateFees: 0 },
  };
  const heads = {};
  for(const e of GS_ECON.log){
    if(!inP(e)) continue;
    if(e.cat === 'wages' || e.cat === 'benefit' || e.cat === 'informal'){
      /* look up the payer from the ledger for the employer rollup */
      const t = GS_LEDGER.txns.find(x => x.n === e.n);
      const src = t ? t.from : '?';
      if(e.cat === 'wages'){
        out.payroll.paid += e.amt; heads[e.cid] = true;
        const b = out.payroll.byEmployer[src] ||
          (out.payroll.byEmployer[src] = { label: e.label, paid: 0,
                                           headcount: 0, _h: {} });
        b.paid += e.amt; b._h[e.cid] = true;
      } else if(e.cat === 'benefit') out.benefits += e.amt;
      else { out.informal += e.amt; heads[e.cid] = true; }
    } else if(e.cat === 'share'){ out.flows.sharesOut += e.amt;
                                  out.flows.count++; }
    else if(e.cat === 'nut_groceries') out.nut.groceries += e.amt;
    else if(e.cat === 'nut_transit')   out.nut.transit += e.amt;
    else if(e.cat === 'nut_utilities') out.nut.utilities += e.amt;
  }
  out.payroll.headcount = Object.keys(heads).length;
  for(const k in out.payroll.byEmployer){
    const b = out.payroll.byEmployer[k];
    b.headcount = Object.keys(b._h).length; delete b._h;
  }
  /* float top-ups are faucet txns — count them honestly */
  for(const t of GS_LEDGER.txns)
    if(t.cur === 'dollars' && t.from === 'mint' &&
       /^employer float/.test(t.reason)) out.payroll.floatTopups++;
  /* rent side: billed/collected live on the lease charges themselves */
  if(typeof gsLeaseBook === 'function')
    for(const row of gsLeaseBook()){
      out.rent.owedNow += row.owed || 0;
      const l = GS_REG.leases.find(x => x.unit_id === row.unit);
      if(!l || !l.charges) continue;
      for(const ch of l.charges){
        if(ch.period !== period) continue;
        if(ch.kind === 'rent') out.rent.billed += ch.amt;
        if(ch.kind === 'latefee') out.rent.lateFees += ch.amt;
        let paid = 0; for(const k in ch.paidBy) paid += ch.paidBy[k];
        if(ch.kind === 'rent') out.rent.collected += paid;
      }
    }
  /* nut shortfall is a cumulative mark per resident — a shortfall is
     the ABSENCE of a txn, so there's nothing dateable to period-scope */
  out.nut.shortCum = 0;
  for(const cid in GS_ECON.rec) out.nut.shortCum += GS_ECON.rec[cid].nutShort;
  return out;
}

/* the collection queue — every owed cent attributed, the next honest
   step named. 'watch' | 'serve_pay_or_quit' | 'executable' */
function gsEconArrears(todayStr){
  const today = todayStr ||
    (typeof gsTodayStr === 'function' ? gsTodayStr() : null);
  const rows = [];
  if(typeof gsLeaseBook !== 'function') return rows;
  for(const row of gsLeaseBook()){
    if(!(row.owed > 0)) continue;
    const l = GS_REG.leases.find(x => x.unit_id === row.unit);
    let oldest = null;
    for(const ch of (l ? l.charges : []))
      if(ch.status !== 'paid')
        for(const cid in ch.owedBy)
          if(ch.owedBy[cid] > 0 && (!oldest || ch.dueOn < oldest))
            oldest = ch.dueOn;
    const exec = (l ? l.notices : []).some(n => n.status === 'executable');
    const open = (l ? l.notices : []).filter(n => n.status === 'open' ||
      n.status === 'executable');
    rows.push({ unit: row.unit, address: row.address,
      tenant: row.tenant, owed: row.owed, owedBy: row.owedBy,
      oldestDue: oldest,
      daysLate: (oldest && today) ? Math.max(0, gsDateDiff(today, oldest))
                                  : null,
      openNotices: open.map(n => ({ kind: n.kind, status: n.status,
                                    deadline: n.deadline })),
      nextStep: exec ? 'executable'
        : (open.length ? 'watch' : 'serve_pay_or_quit') });
  }
  rows.sort((a, b) => b.owed - a.owed);
  return rows;
}

/* payroll audit — per employer: who's on the till, what went out,
   how much float the faucet put in. For hired chars the 41H layer's
   own postings share the same employer accounts. */
function gsEconPayroll(period){
  period = period || (gsTodayStr() || '').slice(0, 7);
  const bySrc = {};
  for(const e of GS_ECON.log){
    if(e.cat !== 'wages' && e.cat !== 'informal') continue;
    if(period && (!e.date || e.date.slice(0, 7) !== period)) continue;
    const t = GS_LEDGER.txns.find(x => x.n === e.n);
    const src = t ? t.from : '?';
    const b = bySrc[src] || (bySrc[src] =
      { employer: e.label, out: 0, headcount: 0, _h: {} });
    b.out += e.amt; b._h[e.cid] = true;
  }
  /* hires' wages post straight to the ledger with reason 'wages —' */
  for(const t of GS_LEDGER.txns){
    if(t.cur !== 'dollars' || !/^wages —/.test(t.reason)) continue;
    const b = bySrc[t.from] || (bySrc[t.from] =
      { employer: t.reason.replace(/^wages — /, ''), out: 0,
        headcount: 0, _h: {} });
    b.out += t.amt; b._h[t.to] = true;
  }
  const rows = [];
  for(const k in bySrc){
    const b = bySrc[k];
    rows.push({ account: k, employer: b.employer, out: b.out,
                headcount: Object.keys(b._h).length,
                float: GS_LEDGER.dollars[k] || 0 });
  }
  rows.sort((a, b) => b.out - a.out);
  return rows;
}

/* one resident's money card — income sources, this month's beats,
   and the runway their bank gives them. INTERNAL tier by contract:
   this is the owner stub, never a spectator surface. */
function gsEconStub(cid){
  const r = GS_ECON.rec[cid] || { marks: {}, nutShort: 0, earned: 0,
                                  spentNut: 0, paidOut: 0 };
  const jobs = GS_ECON_WORK.filter(w => w.cid === cid)
    .map(w => ({ employer: w.employer, role: w.role,
                monthly: w.monthly, cadence: w.cadence }));
  const flowsOut = GS_ECON_FLOWS.filter(f => f.from === cid)
    .map(f => ({ to: f.to, monthly: f.monthly, label: f.label }));
  const flowsIn = GS_ECON_FLOWS.filter(f => f.to === cid)
    .map(f => ({ from: f.from, monthly: f.monthly, label: f.label }));
  const leases = (typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).filter(l => l.status === 'active') : [];
  const rent = leases.reduce((s, l) => s + (l.monthly_rent || 0), 0);
  const owedL = leases.reduce((s, l) => s + gsLeaseOwed(l).total, 0);
  const monthly = GS_ECON_NUT[cid] || GS_ECON_NUT_BASE;
  const income = jobs.reduce((s, j) => s + j.monthly, 0) +
                 flowsIn.reduce((s, f) => s + f.monthly, 0);
  const out = rent + monthly + flowsOut.reduce((s, f) => s + f.monthly, 0);
  const bank = GS_LEDGER.dollars[cid] || 0;
  return { cid, name: (typeof gsCharName === 'function')
      ? gsCharName(cid) : cid,
    bank, income, rent, nut: monthly, flowsOut, flowsIn, owedRent: owedL,
    nutShort: r.nutShort, earned: r.earned, spentNut: r.spentNut,
    net: income - out,
    runwayMonths: out > 0 ? +(bank / out).toFixed(2) : null };
}

/* the full audit — replay the append-only log, prove the balances.
   Every check is an exact integer equality; anything else is a bug. */
function gsEconAudit(){
  const bad = [];
  /* 1 — replay both currencies */
  for(const cur of ['credits', 'dollars']){
    const bal = {};
    for(const t of GS_LEDGER.txns){
      if(t.cur !== cur) continue;
      if(t.from !== 'mint') bal[t.from] = (bal[t.from] || 0) - t.amt;
      if(t.to !== 'burn')   bal[t.to]   = (bal[t.to] || 0) + t.amt;
      if(t.from !== 'mint' && bal[t.from] < 0)
        bad.push('overdraft: ' + t.from + ' @txn' + t.n);
    }
    const live = (cur === 'credits') ? GS_LEDGER.credits
                                     : GS_LEDGER.dollars;
    const keys = new Set(Object.keys(bal).concat(Object.keys(live)));
    for(const k of keys)
      if((bal[k] || 0) !== (live[k] || 0))
        bad.push('balance mismatch ' + cur + ':' + k +
                 ' derived=' + (bal[k] || 0) + ' live=' + (live[k] || 0));
  }
  /* 2 — the econ index must resolve to real txns with matching amts */
  const seen = {};
  for(const e of GS_ECON.log){
    if(seen[e.n]) bad.push('econ log duplicate txn ' + e.n);
    seen[e.n] = true;
    const t = GS_LEDGER.txns.find(x => x.n === e.n);
    if(!t){ bad.push('econ log ' + e.n + ' has no txn'); continue; }
    if(t.amt !== e.amt)
      bad.push('econ log ' + e.n + ' amt ' + e.amt + ' != txn ' + t.amt);
    if(t.cur !== 'dollars')
      bad.push('econ log ' + e.n + ' is not a dollar txn');
  }
  /* 3 — no econ txn may touch the credits side (already covered by 1's
     currency filter, but the rule deserves its own line) */
  for(const e of GS_ECON.log){
    const t = GS_LEDGER.txns.find(x => x.n === e.n);
    if(t && t.cur !== 'dollars') bad.push('currency breach at ' + e.n);
  }
  /* 4 — conservation: minted - burned == held, per currency */
  const cons = {};
  for(const cur of ['credits', 'dollars']){
    let mint = 0, burn = 0;
    for(const t of GS_LEDGER.txns){
      if(t.cur !== cur) continue;
      if(t.from === 'mint') mint += t.amt;
      if(t.to === 'burn') burn += t.amt;
    }
    cons[cur] = { minted: mint, burned: burn,
                  held: gsLedgerTotal(cur),
                  ok: (mint - burn) === gsLedgerTotal(cur) };
    if(!cons[cur].ok) bad.push('conservation broken: ' + cur);
  }
  /* 5 — nut shortfalls are the only sanctioned negative: banks >= 0 */
  for(const k in GS_LEDGER.dollars)
    if(GS_LEDGER.dollars[k] < 0) bad.push('negative bank: ' + k);
  return { ok: bad.length === 0, bad, conservation: cons,
           txns: GS_LEDGER.txns.length, logRows: GS_ECON.log.length };
}

/* ---------------- live wiring ---------------- */
let gsEconLastMs = 0;
function gsEconSysTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  const ms = Date.now();
  if(ms - gsEconLastMs < 30000) return;
  gsEconLastMs = ms;
  const today = (typeof gsTodayStr === 'function') ? gsTodayStr() : null;
  if(today) gsEconTick(today);
}
if(typeof registerSimTick === 'function') registerSimTick(gsEconSysTick);

/* ---------------- persistence ---------------- */
function gsEconSnapshot(){
  return JSON.stringify({ rec: GS_ECON.rec, log: GS_ECON.log,
                          lastTickDay: GS_ECON.lastTickDay });
}
function gsEconLoad(json){
  try{
    const d = JSON.parse(json);
    if(!d) return false;
    GS_ECON.rec = d.rec || {}; GS_ECON.log = d.log || [];
    GS_ECON.lastTickDay = d.lastTickDay || null;
    return true;
  }catch(e){ return false; }
}
function gsEconReset(){
  GS_ECON.rec = {}; GS_ECON.log.length = 0; GS_ECON.lastTickDay = null;
}

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.gsEconTick = (d) => gsEconTick(d);
  window.__aiBridge.gsEconBooks = (p) => gsEconBooks(p);
  window.__aiBridge.gsEconArrears = () => gsEconArrears();
  window.__aiBridge.gsEconPayroll = (p) => gsEconPayroll(p);
  window.__aiBridge.gsEconStub = (c) => gsEconStub(c);
  window.__aiBridge.gsEconAudit = () => gsEconAudit();
}
