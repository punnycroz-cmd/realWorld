/* =====================================================================
   PART 41M — THE WELCOME WAGON (v12 onboarding)

   The viewer→player path as a real game system (world contract
   onboarding.json v53 / onboarding-ui.md copy deck — the demo's
   scripted outcomes are demo-only; here every ask files through the
   REAL request bus and whatever the world answers is what the card
   reports):

   - FREE OBSERVE is a complete product. Watching needs no account, no
     credits, no dismissal — a player record exists only once they knock
     (gsOnbStart). Nothing here gates, dims, or nags the feed.
   - PERSONA FORK (S0f): 'watch' | 'play' — emphasis and checklist
     labeling only. It never unlocks, hides, or prices anything.
   - TOUR (S1): seven click-driven beats anchored to real Wire
     elements; every beat skippable; never auto-plays.
   - HANDLE (S2): the spectator's public attribution name. Format +
     reservation only (handles are NOT request text — §11 screening
     does not apply). Reserved = every cast name (NV_CAST mains +
     ambients, hired names included) + system words; impersonation is
     blocked at input. The Wire prints the handle via gsWireWho.
   - WALLET (S3): two currencies stay separate — credits buy agency,
     game dollars are rent and wages, they never convert. The pack
     ladder is the contract's six packs verbatim; +50% on the first
     purchase once, disclosed on the card not sprung at checkout; a
     disclosed $200/PT-day spend cap sits on top as consumer
     protection. Ads remain the non-purchase mint (gsWatchAd).
   - FIRST ASK (S4): the camera pass — 'camera' is a new catalogue
     action, compatible class, view-layer only (it claims no in-world
     resource, so it auto-clears screening and never queues). 10 cr /
     30 min per the contract's recommendation.
   - THE HONEST "NO"s (S4b/c/e): guided lessons that file REAL requests
     — a co-star ask a thin pawn may decline (half back), an exclusive
     weather ask that parks for human review, a weather ask filed into
     a claimed sky that queues at −15%. Outcomes are never scripted:
     the bus answers, the card reports.
   - RESIDENT FORK (S5): equal-weight exits — hire (the real hire lane:
     500 cr after screening, unit + job + name through gsHireQuote) or
     keep watching (settles, nothing granted).
   - FIRST DAY (S6): the hired-return card — briefing = public profile
     + surface relationships + routine only (the same redacted packet
     possession gets); rent owed in game dollars; possession is a visit
     (compatible rate), never ownership; closing the tab drops them to
     thin AI — a fact, never a guilt line.
   - LOW-BALANCE LESSON: opt-in only, on a live session card — the
     meter preview says exactly what happens at the cap. Never fires
     uninvited, never moves a credit.

   THE NEVER-LIST (contract §never, enforced by gsOnbAudit):
   no paywall copy, no C1–C8 possession offers, no invented prices or
   urgency, no completion rewards, no impersonation handles, no denial
   reasons or appeal UI inside onboarding, no uninvited low-balance
   lesson, no queue-position sales, no thin-AI guilt.

   Deterministic: no Math.random; every entry point takes explicit
   minutes; persistence rides the bus snapshot under key 'onb'.
   ===================================================================== */

const GS_ONB = {
  players: {},     // pid -> journey record (created on first knock)
  handles: {},     // lc handle -> pid (attribution registry)
  events: [],      // analytics ledger — whitelisted hooks only
  seq: 0,
  deepLink: null,  // 'returning' | 'hired' once consumed
};
const GS_ONB_EVENT_CAP = 600;

/* the contract's analytics whitelist (onboarding.json analytics_hooks +
   marketing's spec'd action events) — the ONLY keys the ledger takes */
const GS_ONB_HOOKS = {
  tour_started: 1, tour_beat: 1, tour_completed: 1, tour_skipped: 1,
  persona_chosen: 1, handle_set: 1, handle_taken_shown: 1,
  wallet_explained: 1, topup_shown: 1, first_request_filed: 1,
  decline_lesson_shown: 1, onboard_dismissed: 1, returning_session: 1,
  review_lesson_shown: 1, review_outcome_seen: 1, low_balance_simulated: 1,
  handoff_seen: 1, hired_return: 1, queue_lesson_shown: 1,
  queue_outcome_seen: 1, archive_beat_seen: 1, watch_start: 1,
  request_submitted: 1, character_created: 1,
};
function gsOnbEmit(hook, pid, opts){
  if(!GS_ONB_HOOKS[hook]) return null;
  const o = opts || {};
  const e = { n: ++GS_ONB.seq, hook, pid: pid || null,
    stage: (GS_ONB.players[pid] || {}).stage || null,
    opted_out: !!o.opted_out,
    min: (o.now != null ? o.now
      : ((typeof gsNowMin === 'function') ? gsNowMin() : 0)) };
  /* stage + opted_out only — the envelope never carries content,
     balances, or anything the feed wouldn't print */
  GS_ONB.events.push(e);
  if(GS_ONB.events.length > GS_ONB_EVENT_CAP)
    GS_ONB.events.splice(0, GS_ONB.events.length - GS_ONB_EVENT_CAP);
  return e;
}
function gsOnbEvents(pid){
  return GS_ONB.events.filter(e => !pid || e.pid === pid);
}

/* ---------------- the camera pass (catalogue addition) --------------
   the contract's recommended first ask: 'camera director', compatible
   class, view-layer only — it steers the SPECTATOR's cut of the world,
   so it claims no in-world resource (never conflicts, never queues,
   auto-clears screening). 1/3 cr/min → the canonical 10 cr / 30 min. */
const GS_CAMERA = {};   // reqId -> {playerId, sinceMin, untilMin}
function gsFxCameraOn(r, now){
  GS_CAMERA[r.id] = { playerId: r.playerId, sinceMin: now,
                      untilMin: r.endMin };
  return true;
}
function gsFxCameraOff(r){
  if(GS_CAMERA[r.id]) delete GS_CAMERA[r.id];
}
function gsCameraSessions(nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  return Object.keys(GS_CAMERA).map(id => ({
    req: id, player: GS_CAMERA[id].playerId,
    leftMin: +(GS_CAMERA[id].untilMin - now).toFixed(1),
  }));
}
if(typeof gsDefineAction === 'function')
  gsDefineAction('camera', {
    scope: 'global', exclusive: false, ratePerMin: 1 / 3,
    minMin: 15, maxMin: 120, ttlMin: 30,
    /* v18: +30 blocks at the session's own rate — requests.json sells
       camera extends uncapped (the class cap binds the filing, not the
       renewal); a clip wall still bounds it when the book holds the hour */
    extendMin: 30, extendUncapped: true,
    effect: 'maintained',
    /* the director's view is always permitted — it touches nothing */
    allow: () => true,
    activate: gsFxCameraOn, deactivate: gsFxCameraOff,
    claims: () => [],   // no in-world resource — compatible by construction
  });

/* ---------------- handles (S2) ----------------
   Attribution identity: the feed prints your handle on anything you
   file. Format + reservation only — never screened as request text,
   never a strike. Reserved = cast names/surnames + system words +
   every hired name (a spectator named 'Victor' would read as the
   landlord). */
const GS_HANDLE_RE = /^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/;
const GS_HANDLE_SYS = ['admin', 'mod', 'landlord', 'system', 'support',
  'owner', 'realworld', 'thewire', 'rw', 'staff'];
function gsHandleReservedSet(){
  const s = {};
  for(const w of GS_HANDLE_SYS) s[w] = 1;
  if(typeof NV_CAST !== 'undefined')
    for(const c of NV_CAST)
      for(const tok of String(c.name || '').toLowerCase().split(/[^a-z0-9]+/))
        if(tok) s[tok] = 1;
  if(typeof GS_HIRED === 'object')
    for(const cid in GS_HIRED)
      for(const tok of String(GS_HIRED[cid].name || '')
            .toLowerCase().split(/[^a-z0-9]+/))
        if(tok) s[tok] = 1;
  return s;
}
function gsHandleSuggest(name){
  /* deterministic variants — contract on_taken: inline suggestions,
     never an error page */
  const base = String(name || 'watcher').toLowerCase()
    .replace(/[^a-z0-9_-]/g, '').replace(/^[^a-z]+/, '') || 'watcher';
  const h = hashString18(base);
  const cands = [base + '_sf', base + '-watch',
                 base + (10 + h % 89), base + '-' + (10 + (h >> 4) % 89)];
  const taken = gsHandleReservedSet();
  return cands.filter(c => GS_HANDLE_RE.test(c) &&
    !taken[c.toLowerCase()] && !GS_ONB.handles[c.toLowerCase()]);
}
function gsHandleCheck(name){
  if(typeof name !== 'string' || !GS_HANDLE_RE.test(name))
    return { ok: false, reason: 'handle_format',
      note: '3–20 characters, starts with a letter; letters, digits, - and _' };
  const lc = name.toLowerCase();
  if(gsHandleReservedSet()[lc])
    return { ok: false, reason: 'handle_reserved',
      note: 'that name belongs to the block — pick one the feed can tell apart',
      suggest: gsHandleSuggest(name) };
  if(GS_ONB.handles[lc])
    return { ok: false, reason: 'handle_taken',
      note: 'taken — here are close variants',
      suggest: gsHandleSuggest(name) };
  return { ok: true, name };
}
function gsSetHandle(pid, name, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  const chk = gsHandleCheck(name);
  if(!chk.ok){
    /* taken and reserved both render the same inline message +
       suggestions — the hook fires whenever that card is shown */
    if(chk.reason === 'handle_taken' || chk.reason === 'handle_reserved')
      gsOnbEmit('handle_taken_shown', pid, { now: nowMin });
    return chk;
  }
  if(j.handle) delete GS_ONB.handles[j.handle.toLowerCase()];
  j.handle = name; j.handleSkipped = false;
  GS_ONB.handles[name.toLowerCase()] = pid;
  gsOnbEmit('handle_set', pid, { now: nowMin });
  return { ok: true, handle: name };
}
function gsHandleOf(pid){
  const j = GS_ONB.players[pid];
  return (j && j.handle) || null;
}
function gsPlayerOfHandle(name){
  return GS_ONB.handles[String(name || '').toLowerCase()] || null;
}

/* ---------------- the wallet (S3) ----------------
   the six-pack ladder verbatim (onboarding.json pack_ladder) — no
   'best value' styling lives in data, the UI renders them flat.
   +50% on the first purchase ONCE, disclosed on the card. A disclosed
   $200/PT-day cap is consumer protection, not a price — it rides the
   same PT clock as the ad cap. */
const GS_ONB_PACKS = [
  { id: 'pocket',  usd: 0.99,  cr: 100 },
  { id: 'starter', usd: 4.99,  cr: 550 },
  { id: 'regular', usd: 9.99,  cr: 1150 },
  { id: 'plus',    usd: 19.99, cr: 2500 },
  { id: 'pro',     usd: 49.99, cr: 6750 },
  { id: 'mogul',   usd: 99.99, cr: 14000 },
];
const GS_ONB_BONUS = 0.5;            // +50% extra credits, first purchase only
const GS_ONB_SPEND_CAP_USD = 200;    // per PT day, disclosed
function gsOnbDay(now){
  return (typeof gsGriefClock === 'function')
    ? gsGriefClock(now).day
    : ('e' + Math.floor((now || 0) / 1440));
}
function gsBuyPack(pid, packId, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const pack = GS_ONB_PACKS.find(p => p.id === packId);
  if(!pack) return { ok: false, reason: 'unknown_pack' };
  const j = gsOnbPlayer(pid, now);
  const day = gsOnbDay(now);
  if(j.spentDay !== day){ j.spentDay = day; j.spentUsd = 0; }
  if(j.spentUsd + pack.usd > GS_ONB_SPEND_CAP_USD)
    return { ok: false, reason: 'spend_cap',
      note: 'the till rests at $' + GS_ONB_SPEND_CAP_USD +
            ' a day — the block will still be here tomorrow',
      capUsd: GS_ONB_SPEND_CAP_USD, spentTodayUsd: +j.spentUsd.toFixed(2) };
  const bonus = j.bonusUsed ? 0 : Math.ceil(pack.cr * GS_ONB_BONUS);
  const total = pack.cr + bonus;
  j.spentUsd += pack.usd; j.bonusUsed = true;
  gsCreditGrant(pid, total,
    'pack:' + pack.id + (bonus ? ' (+50% first purchase)' : ''));
  return { ok: true, pack: pack.id, usd: pack.usd, credits: total,
    bonusCr: bonus, balance: gsCreditBalance(pid),
    spentTodayUsd: +j.spentUsd.toFixed(2) };
}
function gsWallet(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  if(!j.walletSeen){
    j.walletSeen = true;
    gsOnbEmit('wallet_explained', pid, { now });
    gsOnbEmit('topup_shown', pid, { now });
  }
  const day = gsOnbDay(now);
  if(j.spentDay !== day){ j.spentDay = day; j.spentUsd = 0; }
  return {
    credits: gsCreditBalance(pid),
    low: gsLowCredit(pid), lowAt: GS_LOW_CREDIT,
    packs: GS_ONB_PACKS.map(p => Object.assign({}, p)),
    bonusLeft: j.bonusUsed ? 0 : GS_ONB_BONUS,
    spentTodayUsd: +j.spentUsd.toFixed(2), capUsd: GS_ONB_SPEND_CAP_USD,
    ads: (typeof gsAdStatus === 'function') ? gsAdStatus(pid, now) : null,
    honesty: 'credits buy agency; game dollars are rent and wages — ' +
             'the two never convert in either direction',
  };
}
/* the itemized credit ledger for one player — the wallet's receipts */
function gsWalletLedger(pid){
  return GS_LEDGER.txns.filter(t => t.cur === 'credits' &&
    (t.to === pid || t.from === pid)).map(t => ({
      n: t.n, dir: t.to === pid ? 'in' : 'out', amt: t.amt,
      reason: t.reason, stamp: t.stamp }));
}

/* ---------------- the journey ----------------
   One record per player id, created on the first knock (gsOnbStart or
   any onboarding call). Watching alone never creates one. */
const GS_ONB_TOUR = [
  { n: 1, anchor: 'feed-clock', key: 'tour.clock',
    copy: "This is the block's real clock. It runs whether you're " +
          "here or not — the neighborhood doesn't wait for viewers." },
  { n: 2, anchor: 'feed-venues', key: 'tour.venues',
    copy: "Who's where, right now. Names you see are the main cast — " +
          "eight people with full lives, plus twenty neighbors." },
  { n: 3, anchor: 'feed-cast', key: 'tour.possession_ban',
    copy: "One honest limit up front: the eight mains can't be " +
          "possessed — not by you, not by the people who run this. " +
          "Their lives are theirs. If you want a person in the world, " +
          "you hire a new one." },
  { n: 4, anchor: 'feed-request', key: 'tour.public_agency',
    copy: "Everything a player does is public. This line is someone " +
          "paying to reach in — attributed, priced, and visible to " +
          "everyone." },
  { n: 5, anchor: 'feed-follow', key: 'tour.follow',
    copy: "Follow a face to filter the stream. Watching closer is " +
          "always free — following is a lens, never a leash." },
  { n: 6, anchor: 'feed-reachin', key: 'tour.reach_in',
    copy: "Watching is free forever. If you ever want to act — call " +
          "weather, nudge a neighbor, hire your own character — that's " +
          "what credits buy. No action is hidden behind anything else." },
  { n: 7, anchor: 'feed-archive', key: 'tour.archive',
    copy: "Nobody can watch twenty-four hours a day — you're not " +
          "meant to. The Archive keeps the block's week, day by day. " +
          "Catching up is free, always." },
];
function gsOnbPlayer(pid, nowMin){
  let j = GS_ONB.players[pid];
  if(!j){
    const now = (nowMin != null) ? nowMin
      : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
    j = GS_ONB.players[pid] = {
      pid, createdMin: now, sessions: 0, persona: null,
      tour: { started: false, beat: 0, done: false, skipped: false },
      signals: { watchMin: 0, scrolled: false, archiveSeen: false },
      handle: null, handleSkipped: false,
      walletSeen: false, walletSkipped: false,
      asks: [], askSkipped: false, firstAskSeen: false,
      lessons: {}, hires: [], hiredCardFor: null, hiredShown: {},
      settled: false, exit: null, stage: 'S0_watch',
      forkRequested: false,
      spentDay: null, spentUsd: 0, bonusUsed: false,
    };
  }
  /* snapshot-loaded records may predate a field — fill, never fail */
  if(!j.asks) j.asks = [];
  if(!j.lessons) j.lessons = {};
  if(!j.hires) j.hires = [];
  if(!j.hiredShown) j.hiredShown = {};
  if(!j.signals)
    j.signals = { watchMin: 0, scrolled: false, archiveSeen: false };
  if(!j.tour)
    j.tour = { started: false, beat: 0, done: false, skipped: false };
  return j;
}
/* derived, never stored — the stage is whatever the record says now */
function gsOnbStageOf(j){
  if(j.exit === 'dismissed') return 'dismissed';
  if(j.exit === 'completed') return 'completed';
  if(j.exit === 'parked') return 'parked';
  if(!j.persona) return 'S0f_fork';
  if(j.tour.started && !j.tour.done && !j.tour.skipped) return 'S1_orient';
  if(j.persona === 'watch')
    /* the watch path still gets the tour OFFER — it ends at the
       'you're set' landing, never pushed past it */
    return (j.tour.done || j.tour.skipped)
      ? (j.settled ? 'completed' : 'S1w_watch_done') : 'S1_orient';
  /* play path — optional steps fall through once done or skipped */
  if(j.hiredCardFor) return 'S6_hired';
  if(!(j.tour.done || j.tour.skipped)) return 'S1_orient';
  if(!j.handle && !j.handleSkipped) return 'S2_name';
  if(gsCreditBalance(j.pid) === 0 && !j.walletSkipped &&
     !(j.asks.length || j.hires.length)) return 'S3_wallet';
  if(!j.firstAskSeen && !j.askSkipped) return 'S4_first_ask';
  return 'S5_resident';
}
function gsOnbStart(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  j.sessions++;
  /* returning sessions never re-see the welcome card — a quiet
     'welcome back' at most, footer link only; dismissed/parked
     exits persist across sessions (the checklist stays collapsed) */
  if(j.sessions > 1) gsOnbEmit('returning_session', pid, { now });
  else gsOnbEmit('watch_start', pid, { now });
  j.stage = gsOnbStageOf(j);
  return gsOnbCard(pid, now);
}
/* the persona fork — emphasis and labeling only */
function gsOnbFork(pid, persona, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(persona !== 'watch' && persona !== 'play')
    return { ok: false, reason: 'unknown_persona' };
  j.persona = persona;
  j.exit = null;
  j.stage = gsOnbStageOf(j);
  gsOnbEmit('persona_chosen', pid, { now: nowMin });
  return { ok: true, persona, stage: j.stage };
}
/* the tour — click-driven, every beat skippable, never auto-plays */
function gsOnbTourStart(pid, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  j.tour.started = true; j.tour.beat = 0;
  j.tour.done = false; j.tour.skipped = false;
  j.stage = 'S1_orient';
  gsOnbEmit('tour_started', pid, { now: nowMin });
  return gsOnbTourBeat(pid, nowMin);
}
function gsOnbTourBeat(pid, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(!j.tour.started) return { ok: false, reason: 'tour_not_started' };
  if(j.tour.done || j.tour.skipped)
    return { ok: false, reason: 'tour_over' };
  if(j.tour.beat >= GS_ONB_TOUR.length){
    j.tour.done = true;
    gsOnbEmit('tour_completed', pid, { now: nowMin });
    j.stage = gsOnbStageOf(j);
    return { ok: true, done: true, stage: j.stage };
  }
  const b = GS_ONB_TOUR[j.tour.beat++];
  gsOnbEmit('tour_beat', pid, { now: nowMin });
  if(b.anchor === 'feed-archive'){
    j.signals.archiveSeen = true;
    gsOnbEmit('archive_beat_seen', pid, { now: nowMin });
  }
  return { ok: true, done: false, n: b.n, of: GS_ONB_TOUR.length,
           anchor: b.anchor, key: b.key, copy: b.copy };
}
function gsOnbTourEnd(pid, completed, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(!j.tour.started) return { ok: false, reason: 'tour_not_started' };
  if(completed === false){                    // 'Skip' ends the whole tour
    j.tour.skipped = true;
    gsOnbEmit('tour_skipped', pid, { now: nowMin, opted_out: true });
  } else {
    j.tour.done = true;
    j.tour.beat = GS_ONB_TOUR.length;
    gsOnbEmit('tour_completed', pid, { now: nowMin });
  }
  j.stage = gsOnbStageOf(j);
  return { ok: true, stage: j.stage };
}
/* free-observe signals — watching is the product, these only mark the
   checklist honest; nothing here unlocks anything */
function gsOnbSignal(pid, sig, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(sig === 'watch_min') j.signals.watchMin += 1;
  else if(sig === 'feed_scroll') j.signals.scrolled = true;
  else if(sig === 'archive_seen'){
    if(!j.signals.archiveSeen){
      j.signals.archiveSeen = true;
      gsOnbEmit('archive_beat_seen', pid, { now: nowMin });
    }
  }
  else return { ok: false, reason: 'unknown_signal' };
  return { ok: true, signals: Object.assign({}, j.signals) };
}
/* skip the current optional step — 'skipping is free', never an error */
function gsOnbSkip(pid, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  const st = gsOnbStageOf(j);
  if(st === 'S1_orient'){
    if(!j.tour.started){                 // skipping the offer itself
      j.tour.skipped = true;
      gsOnbEmit('tour_skipped', pid, { now: nowMin, opted_out: true });
      j.stage = gsOnbStageOf(j);
      return { ok: true, skipped: st, stage: j.stage };
    }
    return gsOnbTourEnd(pid, false, nowMin);
  }
  if(st === 'S2_name'){ j.handleSkipped = true; }
  else if(st === 'S3_wallet'){ j.walletSkipped = true; }
  else if(st === 'S4_first_ask'){ j.askSkipped = true; }
  else return { ok: false, reason: 'nothing_to_skip' };
  j.stage = gsOnbStageOf(j);
  return { ok: true, skipped: st, stage: j.stage };
}
/* exit states — dismiss/park collapse the card; the footer link is the
   only way back. 'completed' thanks once and collapses permanently. */
function gsOnbDismiss(pid, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  j.exit = 'dismissed'; j.stage = 'dismissed';
  gsOnbEmit('onboard_dismissed', pid, { now: nowMin, opted_out: true });
  return { ok: true, exit: 'dismissed' };
}
function gsOnbPark(pid, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(j.exit !== 'dismissed' && j.exit !== 'completed'){
    j.exit = 'parked'; j.stage = 'parked';
  }
  return { ok: true, exit: j.exit };
}
function gsOnbReopen(pid, nowMin){
  /* the footer link — dismissal is forgiven, not remembered as a
     penalty: a dismissed player gets the full fork back */
  const j = gsOnbPlayer(pid, nowMin);
  j.exit = null; j.settled = false; j.forkRequested = true;
  j.stage = gsOnbStageOf(j);
  return { ok: true, stage: j.stage };
}
/* the settle fork — S5 'keep watching' or the watch path's
   'you're set': both land here. Nothing is granted. */
function gsOnbSettle(pid, choice, nowMin){
  const j = gsOnbPlayer(pid, nowMin);
  if(choice === 'hire'){                 // points at the real hire lane
    j.stage = 'S5_resident';
    return { ok: true, choice: 'hire', path: gsOnbHirePath(pid, nowMin) };
  }
  j.settled = true; j.exit = 'completed'; j.stage = 'completed';
  return { ok: true, choice: 'watch', exit: 'completed',
    note: 'Settled. The block keeps running — see you around.' };
}

/* ---------------- the checklist ----------------
   contract §checklist — six items, honest completion conditions,
   optional items relabeled on the watch path, percent counts only
   chosen (non-skipped) items. */
function gsOnbChecklist(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  const optLabel = j.persona === 'watch'
    ? 'only if you ever want to act' : 'optional';
  const askReached = j.asks.some(id => {
    const r = (typeof gsRequestById === 'function') && gsRequestById(id);
    return r && r.status !== 'denied';
  }) || (typeof GS_REQ === 'object' &&
         GS_REQ.reqs.some(r => r.playerId === pid &&
                             r.status !== 'denied'));
  const items = [
    { n: 1, id: 'watch', optional: false,
      done: j.signals.watchMin >= 1 || j.signals.scrolled },
    { n: 2, id: 'tour', optional: false,
      done: j.tour.done || j.tour.skipped },
    { n: 3, id: 'handle', optional: true, done: !!j.handle,
      skipped: j.handleSkipped },
    { n: 4, id: 'wallet', optional: true,
      done: gsCreditBalance(pid) > 0, skipped: j.walletSkipped },
    { n: 5, id: 'first_ask', optional: true, done: askReached,
      skipped: j.askSkipped },
    { n: 6, id: 'settle', optional: false,
      done: j.settled || j.exit === 'completed' },
  ];
  for(const it of items) if(it.optional) it.label = optLabel;
  const chosen = items.filter(i => !i.optional || !i.skipped);
  const pct = chosen.length
    ? Math.round(chosen.filter(i => i.done).length / chosen.length * 100)
    : 100;
  return { items, pct, done: items.every(i => i.done || i.skipped) };
}

/* ---------------- the card ----------------
   the ONE card a UI should render now — stage-derived, all copy from
   the contract deck. Returns null when collapsed (parked/dismissed/
   completed render the footer link only). */
function gsOnbCard(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  const st = gsOnbStageOf(j);
  j.stage = st;
  if(st === 'dismissed' || st === 'parked' || st === 'completed')
    return null;                        // footer link only, ever
  /* pre-fork (S0_watch first arrival, S0f_fork once they've watched):
     one card — welcome the first time, quiet hello on return */
  if(!j.persona && (st === 'S0_watch' || st === 'S0f_fork')){
    if(j.sessions > 1 && !j.forkRequested)
      return { stage: st, kind: 'welcome_back', quiet: true,
        lines: ['welcome back — the block kept running.'],
        actions: ['dismiss'] };
    return { stage: st, kind: 'welcome',
      title: "You're watching a real neighborhood",
      lines: ["eight people living their day around Dolores Park, " +
              "twenty neighbors, all of it live.",
              "Watch as long as you like; it costs nothing."],
      fork: [
        { id: 'watch', label: "I'm just watching" },
        { id: 'play', label: 'I might reach in' }],
      equalWeight: true };
  }
  if(st === 'S1_orient'){
    if(!j.tour.started)
      return { stage: st, kind: 'tour_offer',
        title: 'Want the two-minute tour?',
        lines: ['Seven stops along the feed you already have. ' +
                'Skip any time — skipping is free.'],
        actions: ['start_tour', 'skip'] };
    const b = GS_ONB_TOUR[Math.min(j.tour.beat, GS_ONB_TOUR.length - 1)];
    return { stage: st, kind: 'tour_beat', n: b.n, of: GS_ONB_TOUR.length,
      anchor: b.anchor, key: b.key, copy: b.copy,
      actions: ['next', 'skip'] };
  }
  if(st === 'S1w_watch_done')
    return { stage: st, kind: 'watch_landing',
      title: "That's the whole job",
      lines: ["The block keeps human hours — the morning rush, the " +
              "bench parliament at dusk. Nothing here is on a timer " +
              "for you.",
              "Setup stays under the footer link if you ever want to " +
              "act — identical prices, identical steps, whenever."],
      actions: ['settle_watch', 'set_up_anyway'] };
  if(st === 'S2_name')
    return { stage: st, kind: 'handle', optional: true,
      title: 'Pick a handle',
      lines: ["The name the feed attaches to anything you do. " +
              "Requests are public — your asks carry your name, same " +
              "as everyone."],
      rules: 'starts with a letter; 3–20 chars; letters, digits, - and _',
      actions: ['set_handle', 'skip'] };
  if(st === 'S3_wallet'){
    const w = gsWallet(pid, now);   // first render marks it explained
    return { stage: st, kind: 'wallet', optional: true,
      title: 'Two kinds of money',
      lines: ["Credits buy agency — requests, hires. That's what you " +
              "top up here.",
              "Game dollars are the world's money — rent and wages. " +
              "Your characters earn them by working.",
              'They never convert into each other.',
              'Roughly 100 credits ≈ $1. A 30-minute camera pass is ' +
              '10 cr — about a dime. A first purchase adds +50% once.'],
      wallet: w,
      actions: ['buy_pack', 'watch_ad', 'skip'] };
  }
  if(st === 'S4_first_ask'){
    const q = (typeof gsPriceQuote === 'function')
      ? gsPriceQuote({ playerId: pid, kind: 'camera', durationMin: 30 },
                     now) : null;
    return { stage: st, kind: 'first_ask', optional: true,
      title: 'The cheapest way to reach in',
      lines: ["Camera director, 10 cr for 30 min. It changes nothing " +
              "in the world — just your view.",
              "Watch the request land on the public feed with your " +
              "handle on it."],
      recommended: { kind: 'camera', durationMin: 30,
                     quote: (q && q.ok !== false) ? q : null },
      lessons: ['decline', 'review', 'queue'],
      balance: gsCreditBalance(pid),
      actions: ['file_camera', 'lesson', 'skip'] };
  }
  if(st === 'S5_resident')
    return { stage: st, kind: 'resident_fork',
      title: 'Ready for a person of your own?',
      lines: ["Hiring a character is 500 cr, and they arrive owing " +
              "rent like everyone — you set who they are; who they " +
              "become is theirs."],
      fork: [
        { id: 'hire', label: 'hire a character' },
        { id: 'watch', label: 'keep watching' }],
      equalWeight: true,
      hire: gsOnbHirePath(pid, now) };
  if(st === 'S6_hired')
    return gsOnbHiredReturn(pid, j.hiredCardFor, now);
  return null;
}

/* ---------------- the guided asks ----------------
   every one files through gsSubmitRequest — the real bus, the real
   screen, the real bill. Onboarding composes; it never bypasses. */
const GS_ONB_FIRST_ASK = { kind: 'camera', durationMin: 30 };
function gsOnbFirstAsk(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  const q = (typeof gsPriceQuote === 'function')
    ? gsPriceQuote({ playerId: pid, kind: GS_ONB_FIRST_ASK.kind,
                     durationMin: GS_ONB_FIRST_ASK.durationMin }, now)
    : { ok: true };
  if(q && q.ok === false)
    return { ok: false, reason: q.deny || 'cannot_file', quote: q };
  const price = (q && q.total != null) ? q.total : 10;
  if(gsCreditBalance(pid) < price)
    return { ok: false, reason: 'insufficient_credits', need: price,
      have: gsCreditBalance(pid),
      note: 'Balance too low — the pack ladder or the ad path tops ' +
            'up; nothing was filed.' };
  const r = gsSubmitRequest({ playerId: pid, kind: GS_ONB_FIRST_ASK.kind,
    durationMin: GS_ONB_FIRST_ASK.durationMin }, now);
  j.asks.push(r.id);
  gsOnbEmit('request_submitted', pid, { now });
  return { ok: r.status !== 'denied', req: r.id, status: r.status,
    billed: r.billed, quote: q,
    note: r.status === 'active'
      ? 'Filed. Compatible requests auto-clear screening — yours is ' +
        'the simple kind.'
      : 'Filed — ' + r.status + '.' };
}
/* the hand-back beat (contract lifecycle_demo's 'jump ahead'): the
   player ends their own live session early through the ordinary
   release path — unused whole minutes refund, the wire prints
   'player session ended', the world takes over mid-motion. Same
   rule as the cap, just sooner. */
function gsOnbEndAsk(pid, reqId, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const r = (typeof gsRequestById === 'function')
    ? gsRequestById(reqId) : null;
  if(!r || r.playerId !== pid)
    return { ok: false, reason: 'not_your_ask' };
  if(r.status !== 'active')
    return { ok: false, reason: 'not_running',
      note: 'only a live session hands back — queued and settled ' +
            'requests leave through their own doors' };
  const before = r.refunded || 0;
  if(!(typeof gsCancelRequest === 'function' &&
       gsCancelRequest(reqId, now, 'player')))
    return { ok: false, reason: 'release_failed' };
  const back = (r.refunded || 0) - before;
  return { ok: true, req: reqId, refunded: back,
    note: 'Handed back early — the unused minutes came home with ' +
          'you. The feed reads "player session ended" and the world ' +
          'keeps its own time from here.' };
}
/* the honest "no"s — real filings, real outcomes:
   'decline' — a co-star ask a thin pawn may refuse (half back)
   'review'  — an exclusive weather ask parks for a human
   'queue'   — a weather ask into a claimed sky waits at −15%      */
function gsOnbLesson(pid, kind, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  let spec = null, hook = null;
  if(kind === 'decline'){
    /* aim at the first thin pawn — ambients are always thin; a hired
       pawn qualifies only while its owner is offline */
    let cid = null;
    if(typeof NV_CAST !== 'undefined')
      for(const c of NV_CAST)
        if(c.tier === 'ambient' &&
           (typeof gsBrainMode !== 'function' ||
            gsBrainMode(c.id, now) === 'thin')){ cid = c.id; break; }
    if(!cid && typeof GS_HIRED === 'object')
      for(const h in GS_HIRED)
        if(typeof gsBrainMode === 'function' &&
           gsBrainMode(h, now) === 'thin'){ cid = h; break; }
    if(!cid) return { ok: false, reason: 'no_thin_neighbor' };
    spec = { playerId: pid, kind: 'costar', target: cid,
             durationMin: 5, params: { task: 'greet' } };
    hook = 'decline_lesson_shown';
  } else if(kind === 'review'){
    spec = { playerId: pid, kind: 'weather', durationMin: 10,
             params: { wx: 'fog' } };
    hook = 'review_lesson_shown';
  } else if(kind === 'queue'){
    /* honesty: a queue needs a REAL blocker on the same claim —
       probe the exact filing through gsFindBlockers (an identical
       forecast co-sponsors instead of clashing, so 'sky busy' alone
       isn't enough). If the line is clear the lesson says so. */
    const probe = { playerId: pid, kind: 'weather',
                    params: { wx: 'fog' }, n: Infinity };
    if(!(typeof gsFindBlockers === 'function' &&
         gsFindBlockers(probe).length))
      return { ok: false, reason: 'sky_free',
        note: 'the sky is unclaimed right now — a weather ask would ' +
              'go to review, not the queue. The queue lesson waits ' +
              'for a real hold.' };
    spec = { playerId: pid, kind: 'weather', durationMin: 10,
             params: { wx: 'fog' } };
    hook = 'queue_lesson_shown';
  } else return { ok: false, reason: 'unknown_lesson' };
  const q = gsPriceQuote(spec, now);
  if(q && q.ok === false)
    return { ok: false, reason: q.deny || 'cannot_file', quote: q };
  const price = (q && q.total != null) ? q.total : 0;
  if(gsCreditBalance(pid) < price)
    return { ok: false, reason: 'insufficient_credits', need: price,
      have: gsCreditBalance(pid),
      note: 'Balance too low — nothing was filed.' };
  /* the lesson registers BEFORE the filing — feed events fire inside
     gsSubmitRequest (a declined co-star resolves during activation),
     so the subscriber binds the first event it sees to this lesson */
  const L = j.lessons[kind] =
    { reqId: null, filedMin: now, status: null, outcome: null,
      filing: true };
  const r = gsSubmitRequest(spec, now);
  L.reqId = r.id; L.filing = false;
  if(r.status === 'denied' && !L.outcome) L.outcome = 'not approved';
  j.asks.push(r.id);
  gsOnbEmit(hook, pid, { now });
  gsOnbEmit('request_submitted', pid, { now });
  return { ok: r.status !== 'denied', req: r.id, status: r.status,
    billed: r.billed, discount: r.discount || null, quote: q,
    promise: kind === 'decline'
      ? 'You pay for the ask, never the outcome.'
      : kind === 'review'
        ? "Exclusive asks get a human look before they run; a 'not " +
          "approved' costs you nothing — the refund is automatic."
        : '−15% off the tier rate, and a lapsed slot refunds every ' +
          'credit on its own.' };
}

/* ---------------- the hire pointer + first day (S5/S6) --------------
   the real hire lane read end-to-end: job board, vacant stock, slots,
   and the disclosure card — so the fork card can quote true numbers. */
function gsOnbHirePath(pid, nowMin){
  const jobs = (typeof gsJobBoard === 'function') ? gsJobBoard() : [];
  const units = (typeof gsVacantUnits === 'function')
    ? gsVacantUnits({}) : [];
  /* gsVacantUnits hands back {unit, building, address} wrappers */
  const livable = units.filter(w =>
    (typeof gsUnitLivable === 'function') ? gsUnitLivable(w.unit) : true);
  const slots = (typeof gsHireSlots === 'function')
    ? gsHireSlots(pid) : null;
  return {
    fee: (typeof GS_HIRE === 'object') ? GS_HIRE.feeCr : 500,
    billing: 'charged once, after screening passes — a denied ' +
             'application never bills',
    jobs, vacancies: livable.map(w => ({
      id: w.unit.id, address: w.address, rent: w.unit.base_rent })),
    slots,
    truth: ['you set who they are; who they become is theirs',
            'they arrive owing rent like everyone — in game dollars',
            'possession is a visit at the compatible rate, never ' +
              'ownership',
            'closing the tab drops them to thin AI — present, ' +
              'sleeping-light, no "miss you" notes'],
  };
}
/* the S6 first-day card — briefing is the SAME redacted packet
   possession gets: public profile + surface relationships + routine.
   Secrets stay redacted even for the hirer. One-time per hire. */
function gsOnbHiredReturn(pid, cid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = gsOnbPlayer(pid, now);
  if(cid == null) cid = j.hires[j.hires.length - 1];
  const h = (typeof GS_HIRED === 'object') ? GS_HIRED[cid] : null;
  if(!h) return { ok: false, reason: 'not_your_hire' };
  const brief = (typeof gsPossessBrief === 'function')
    ? gsPossessBrief(cid) : null;
  const ob = (typeof gsObligations === 'function')
    ? gsObligations(cid) : null;
  const lease = (h.unitId && typeof gsLeasesFor === 'function')
    ? gsLeasesFor(cid).find(l => l.status === 'active' ||
        l.status === 'owner-occupied') : null;
  /* one-time per hire — the card dismisses into the checklist,
     never into a second funnel */
  if(!j.hiredShown) j.hiredShown = {};
  if(!j.hiredShown[cid]){
    j.hiredShown[cid] = true;
    if(j.hiredCardFor === cid) j.hiredCardFor = null;
    gsOnbEmit('hired_return', pid, { now });
    gsOnbEmit('handoff_seen', pid, { now });
  }
  return { stage: 'S6_hired', kind: 'first_day', ok: true,
    char: cid, name: h.name,
    title: h.name + ' — day one',
    briefing: brief && {
      name: brief.name, role: brief.role, home: brief.home,
      routine: brief.routine || null,
      people: brief.people || null,          // surface relationships
      redacted: brief.redacted || null },
    briefingNote: 'public profile, surface relationships, daily ' +
      'routine — secrets are redacted for everyone, including you. ' +
      'You learn the block by playing, same as a viewer learns it ' +
      'by watching.',
    costs: {
      rent: lease ? { owed: (typeof gsLeaseOwed === 'function')
          ? gsLeaseOwed(lease).total : null,
          monthly: lease.monthly_rent, currency: 'game dollars' } : null,
      possess: 'compatible rate — a visit, not ownership; release or ' +
               'timeout hands them back mid-motion',
      obligations: ob },
    offline: 'when you close the tab they go back to their own ' +
      'brain, thinner but present — no "miss you" notes. The block ' +
      'is just here when you come back.',
    handleHint: j.handle ? null
      : 'pick a handle if you want the feed to name your asks' };
}

/* ---------------- the low-balance lesson ----------------
   opt-in ONLY — a preview on the player's own live session card.
   Reads the meter, moves nothing. */
function gsOnbLowBal(pid, reqId, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const r = (typeof gsRequestById === 'function')
    ? gsRequestById(reqId) : null;
  if(!r || r.playerId !== pid || r.status !== 'active')
    return { ok: false, reason: 'no_live_session' };
  const m = (typeof gsRequestMeter === 'function')
    ? gsRequestMeter(reqId, now) : null;
  gsOnbEmit('low_balance_simulated', pid, { now });
  return { ok: true, simulated: true,
    fundedMinLeft: m ? +m.remainingMin.toFixed(1) : null,
    warning: 'a warning posts as the funded minutes run low',
    atCap: "the session ends — 'player session ended' on the feed",
    resume: 'the AI resumes mid-motion — nothing billed past the cap',
    debt: false,
    note: "When the wallet empties mid-session the world doesn't " +
      "stop — your character (or your camera) just hands back to the " +
      "AI, mid-motion. No debt, no overrun, no shame line on the " +
      "feed." };
}

/* ---------------- bus subscriber ----------------
   outcome tracking: the player's own filings move the checklist and
   the lesson records; a hire queues the first-day card. No secrets
   cross — only what the feed itself prints. */
function gsOnbOnEvent(evt){
  if(!evt || evt.n == null) return;
  const r = evt.req && (typeof gsRequestById === 'function')
    ? gsRequestById(evt.req) : null;
  const pid = (r && r.playerId) || evt.player || null;
  const j = pid && GS_ONB.players[pid];
  if(!j) return;
  const now = evt.min;
  /* feed events fire INSIDE gsSubmitRequest — before the caller can
     record the req id — so 'first ask' keys on the player, not the
     filing list: any own request that reaches the feed counts */
  if((evt.type === 'approve' || evt.type === 'queue' ||
      (evt.type === 'review' && evt.action === 'in_review')) &&
     !j.firstAskSeen){
    j.firstAskSeen = true;
    gsOnbEmit('first_request_filed', pid, { now });
  }
  if(evt.type === 'hire' && evt.charId){
    if(j.hires.indexOf(evt.charId) < 0) j.hires.push(evt.charId);
    j.hiredCardFor = evt.charId;
    gsOnbEmit('character_created', pid, { now });
  }
  /* lesson outcomes — the card reports what the bus answered.
     (a reviewed request emits BOTH a 'review' event with the verdict
     and, on denial, a 'deny' event marked via:'review' — the review
     outcome hook keys on the human verdict, not the door.) */
  for(const kind in j.lessons){
    const L = j.lessons[kind];
    /* a lesson mid-filing binds its first feed event — the emit beat
       lands inside gsSubmitRequest, before the caller sees the id */
    if(L.filing && evt.req) L.reqId = evt.req;
    if(L.reqId !== evt.req || L.outcome) continue;
    if(evt.type === 'queue') L.status = 'queued';
    else if(evt.type === 'review' && evt.action === 'in_review')
      L.status = 'in review';
    else if(evt.type === 'review' &&
            (evt.action === 'approved' ||
             evt.action === 'approved_modified'))
      L.reviewed = true;            /* cleared — the run/queue beat follows */
    else if(evt.type === 'complete' && evt.declined != null){
      L.outcome = 'declined';
      if(kind === 'decline') L.refund = evt.refund || 0;
    }
    else if(evt.type === 'deny'){
      L.outcome = 'not approved';
      if(kind === 'review' && evt.via === 'review')
        gsOnbEmit('review_outcome_seen', pid, { now });
    }
    else if(evt.type === 'expire'){
      L.outcome = 'lapsed';
      if(kind === 'queue')
        gsOnbEmit('queue_outcome_seen', pid, { now });
      if(kind === 'review')
        gsOnbEmit('review_outcome_seen', pid, { now });
    }
    else if(evt.type === 'approve') L.status = 'running';
    else if(evt.type === 'complete'){
      L.outcome = L.reviewed ? 'approved, ran' : 'ran';
      if(kind === 'queue')
        gsOnbEmit('queue_outcome_seen', pid, { now });
      if(kind === 'review')
        gsOnbEmit('review_outcome_seen', pid, { now });
    }
  }
}
if(typeof gsBusOnEvent === 'function') gsBusOnEvent(gsOnbOnEvent);

/* ---------------- the read model ----------------
   one call, everything the onboarding UI binds — never the ledger,
   never moderation internals. */
function gsOnbState(pid, nowMin){
  const now = (nowMin != null) ? nowMin
    : ((typeof gsNowMin === 'function') ? gsNowMin() : 0);
  const j = GS_ONB.players[pid] || null;
  if(!j)
    return { fresh: true, stage: 'S0_watch',
      note: 'watching needs nothing — no account, no credits, ' +
            'no dismissal' };
  return {
    fresh: false, pid, stage: gsOnbStageOf(j),
    persona: j.persona, handle: j.handle,
    sessions: j.sessions, settled: j.settled, exit: j.exit,
    checklist: gsOnbChecklist(pid, now),
    card: gsOnbCard(pid, now),
    asks: j.asks.slice(), lessons: JSON.parse(JSON.stringify(j.lessons)),
    hires: j.hires.slice(),
    wallet: { credits: gsCreditBalance(pid), low: gsLowCredit(pid) },
  };
}
/* the contract's two deep links — the only two, ever */
function gsOnbDeepLink(pid, search){
  let q = (typeof search === 'string') ? search : null;
  if(q == null && typeof location !== 'undefined' && location)
    q = location.search || '';
  q = q || '';
  /* no record until a real link knocks — a plain visit stays a viewer */
  if(!/[?&](returning|hired)=1\b/.test(q))
    return { ok: false, reason: 'no_deep_link' };
  const j = gsOnbPlayer(pid);
  if(/[?&]returning=1\b/.test(q)){
    j.sessions = Math.max(j.sessions, 2);
    GS_ONB.deepLink = 'returning';
    return { ok: true, link: 'returning' };
  }
  if(/[?&]hired=1\b/.test(q)){
    GS_ONB.deepLink = 'hired';
    /* stage is derived — re-raise the first-day card through the
       record so the link survives the derivation honestly */
    if(j.hires.length) j.hiredCardFor = j.hires[j.hires.length - 1];
    j.exit = null; j.stage = gsOnbStageOf(j);
    return { ok: true, link: 'hired',
      card: j.hires.length ? gsOnbHiredReturn(pid) :
        { stage: 'S6_hired', kind: 'first_day', ok: false,
          reason: 'no_hire_yet',
          note: 'the card still renders — the hire carries its own name' } };
  }
  return { ok: false, reason: 'no_deep_link' };
}

/* ---------------- the never-list audit ----------------
   the contract's §never as executable checks — a drift alarm for
   every future version, not a promise. */
function gsOnbAudit(){
  const issues = [];
  /* the ladder verbatim — ids, usd, cr */
  const want = [['pocket',0.99,100],['starter',4.99,550],
    ['regular',9.99,1150],['plus',19.99,2500],['pro',49.99,6750],
    ['mogul',99.99,14000]];
  if(GS_ONB_PACKS.length !== want.length ||
     !want.every((w, i) => GS_ONB_PACKS[i].id === w[0] &&
       GS_ONB_PACKS[i].usd === w[1] && GS_ONB_PACKS[i].cr === w[2]))
    issues.push('pack_ladder drifted from the contract');
  if(String(GS_HANDLE_RE) !== '/^[a-zA-Z][a-zA-Z0-9_-]{2,19}$/')
    issues.push('handle pattern drifted');
  /* every cast member's name is reserved — mains AND ambients */
  if(typeof NV_CAST !== 'undefined'){
    const res = gsHandleReservedSet();
    for(const c of NV_CAST)
      for(const tok of String(c.name || '').toLowerCase()
            .split(/[^a-z0-9]+/))
        if(tok && !res[tok])
          issues.push('cast name not reserved: ' + tok);
  }
  for(const w of GS_HANDLE_SYS)
    if(!gsHandleReservedSet()[w])
      issues.push('system word not reserved: ' + w);
  /* the camera pass stays the honest first ask: compatible, claims
     nothing, 10 cr for 30 min */
  const cam = (typeof GS_REQ === 'object' && GS_REQ.actions) &&
              GS_REQ.actions.camera;
  if(!cam) issues.push('camera action missing');
  else{
    if(cam.exclusive) issues.push('camera must stay compatible-class');
    if(cam.claims({}).length)
      issues.push('camera must never claim an in-world resource');
    if(Math.ceil(cam.ratePerMin * 30) !== 10)
      issues.push('camera must stay 10 cr / 30 min');
  }
  /* no completion rewards: nothing mints for watching, touring, or
     finishing the checklist */
  if(GS_LEDGER.txns.some(t => t.cur === 'credits' &&
       /onboard|tour|checklist|welcome|settle/i.test(t.reason || '')))
    issues.push('a completion reward leaked into the ledger');
  /* analytics: whitelisted hooks, stage+opted_out envelope only */
  for(const e of GS_ONB.events){
    if(!GS_ONB_HOOKS[e.hook]) issues.push('unlisted hook: ' + e.hook);
    for(const k in e)
      if(['n','hook','pid','stage','opted_out','min'].indexOf(k) < 0)
        issues.push('analytics field out of envelope: ' + k);
  }
  /* the possession ban holds for every main, owner included */
  if(typeof gsPossessDeny === 'function' &&
     typeof GS_CORE_CAST === 'object')
    for(const cid in GS_CORE_CAST)
      if(gsPossessDeny(cid, 'owner') !== 'possession_ban')
        issues.push('possession ban broken for ' + cid);
  /* the free tier is intact: viewer state never asks for a journey */
  const vs = (typeof gsViewerState === 'function') && gsViewerState();
  if(!vs || !Array.isArray(vs.feed))
    issues.push('the free feed must stand alone');
  /* tour: exactly the contract's beats, anchored, click-driven */
  if(GS_ONB_TOUR.length !== 7 ||
     GS_ONB_TOUR[6].anchor !== 'feed-archive')
    issues.push('tour beats drifted');
  return { ok: issues.length === 0, issues };
}

/* ---------------- persistence (rides the bus snapshot) ------------- */
function gsOnbSnapshot(){
  return { players: GS_ONB.players, handles: GS_ONB.handles,
    events: GS_ONB.events.slice(-GS_ONB_EVENT_CAP), seq: GS_ONB.seq,
    camera: GS_CAMERA };
}
function gsOnbLoad(d){
  for(const k in GS_ONB.players) delete GS_ONB.players[k];
  for(const k in GS_ONB.handles) delete GS_ONB.handles[k];
  for(const k in GS_CAMERA) delete GS_CAMERA[k];
  GS_ONB.events.length = 0; GS_ONB.seq = 0; GS_ONB.deepLink = null;
  if(!d) return;
  if(d.players) Object.assign(GS_ONB.players, d.players);
  if(d.handles) Object.assign(GS_ONB.handles, d.handles);
  if(Array.isArray(d.events)) GS_ONB.events.push.apply(GS_ONB.events, d.events);
  GS_ONB.seq = d.seq || GS_ONB.events.length;
  if(d.camera) Object.assign(GS_CAMERA, d.camera);
}
function gsOnbReset(){ gsOnbLoad(null); }

/* ---------------- bridge surface ---------------- */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsOnbStart = (pid) => gsOnbStart(pid);
  B.gsOnbState = (pid) => gsOnbState(pid);
  B.gsOnbCard = (pid) => gsOnbCard(pid);
  B.gsOnbFork = (pid, p) => gsOnbFork(pid, p);
  B.gsOnbTourStart = (pid) => gsOnbTourStart(pid);
  B.gsOnbTourBeat = (pid) => gsOnbTourBeat(pid);
  B.gsOnbTourEnd = (pid, done) => gsOnbTourEnd(pid, done);
  B.gsOnbSignal = (pid, s) => gsOnbSignal(pid, s);
  B.gsOnbSkip = (pid) => gsOnbSkip(pid);
  B.gsOnbDismiss = (pid) => gsOnbDismiss(pid);
  B.gsOnbReopen = (pid) => gsOnbReopen(pid);
  B.gsOnbSettle = (pid, c) => gsOnbSettle(pid, c);
  B.gsOnbChecklist = (pid) => gsOnbChecklist(pid);
  B.gsSetHandle = (pid, n) => gsSetHandle(pid, n);
  B.gsHandleCheck = (n) => gsHandleCheck(n);
  B.gsHandleOf = (pid) => gsHandleOf(pid);
  B.gsBuyPack = (pid, id) => gsBuyPack(pid, id);
  B.gsWallet = (pid) => gsWallet(pid);
  B.gsWalletLedger = (pid) => gsWalletLedger(pid);
  B.gsOnbFirstAsk = (pid) => gsOnbFirstAsk(pid);
  B.gsOnbEndAsk = (pid, id) => gsOnbEndAsk(pid, id);
  B.gsOnbLesson = (pid, k) => gsOnbLesson(pid, k);
  B.gsOnbHirePath = (pid) => gsOnbHirePath(pid);
  B.gsOnbHiredReturn = (pid, cid) => gsOnbHiredReturn(pid, cid);
  B.gsOnbLowBal = (pid, id) => gsOnbLowBal(pid, id);
  B.gsOnbDeepLink = (pid, q) => gsOnbDeepLink(pid, q);
  B.gsOnbAudit = () => gsOnbAudit();
  B.gsOnbEvents = (pid) => gsOnbEvents(pid);
  B.gsCameraSessions = () => gsCameraSessions();
}
