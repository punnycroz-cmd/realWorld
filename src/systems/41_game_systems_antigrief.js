/* =====================================================================
   PART 41G: GAME SYSTEMS — THE DOOR POLICY (anti-grief, v7)

   Every venue has a door policy: who gets in, how often, what it costs
   tonight, and who the door remembers. This module is the show's — a
   deterministic account layer in front of the request bus, built to
   world/moderation.json + world/requests.json:

   - ACCOUNT FLAGS (moderation.json flag_weights + account_flags): deny
     verdicts accrue a rolling score. >=3: every filing human-reviewed
     for 7 days. >=6: request privileges suspended 72h. >=9: owner hold.
     Score decays -1 per clean 30 days; gsFlagClear is the owner tool.
     Flags are INTERNAL — never on the wire, never in viewerState.
   - RATE CAPS: 20 filings/hour + 8 live requests per player, pre-billing.
     A script can file forever; the door just says no.
   - FLOOD OF QUEUE: live cap counts active + queued + in_review.
   - APPEALS (moderation.json): a denied request may be appealed once
     within 72h — free to file, re-bills only if approved (the appeal
     itself is never charged), routes to a DIFFERENT reviewer (enforced),
     and a second denial is final for that request text (refiling it is
     refused outright as 'appeal_final'). Feed visibility is aggregate:
     the wire counts appeals, never prints them.
   - THE LEGAL LANE: gsEscalateLegal kills a request pre-run or
     mid-flight — full refund (ledger reason 'legal-deny'), +3 flag via
     the normal deny event, public wording identical to any denial.
   - ADS: gsWatchAd mints the honest trickle (2cr/view, 5/day PT) — the
     only non-purchase mint, capped so it can never fund a flood.
   - REPUTATION NOTEBOOK: gsRepNote is the v11 hook — flags, fixations,
     suspensions, owner overrides, review backlog land as dated notes on
     players, characters, and 'owner'.
   - RESOURCE BOARD: gsResourceBoard projects claims + cooldowns into
     the contract's free/cool/locked/queued surface.
   - gsPriceQuote: the pre-payment receipt — same math the submit path
     bills, nothing mutates.
   - gsModMetrics: review depth, oldest wait, median decision, denials
     by code, appeal record, compensation paid — the owner dashboard.

   Nothing here decides what the CAST does — it decides what gets filed,
   what it costs, and what the door remembers. Deterministic throughout:
   no Math.random, ever.
   ===================================================================== */

/* ---------------- PT clock (the show's day) ---------------- */
function gsGriefClock(now){
  if(typeof gsWireClock === 'function'){
    const c = gsWireClock(now);
    if(c && (c.t != null || c.day != null)) return c;
  }
  const t = ((Math.floor(now) % 1440) + 1440) % 1440;
  return { t: t, day: 'e' + Math.floor(now / 1440) };
}

/* ---------------- rate caps ----------------
   perHour counts EVERY filing in the rolling window (denied included —
   a probe script is still a flood); liveMax counts requests that still
   hold a seat (active | queued | in_review). */
const GS_RATE_CFG = { perHour: 20, liveMax: 8, windowMin: 60 };
function gsRateCheck(pid, now){
  let filings = 0, live = 0;
  for(const r of GS_REQ.reqs){
    if(r.playerId !== pid || r.submittedMin == null) continue;
    if(now - r.submittedMin <= GS_RATE_CFG.windowMin) filings++;
    if(r.status === 'active' || r.status === 'queued' ||
       r.status === 'in_review') live++;
  }
  if(live >= GS_RATE_CFG.liveMax) return 'too_many_live';
  if(filings >= GS_RATE_CFG.perHour) return 'rate_limited';
  return null;
}

/* ---------------- accounts ----------------
   an account exists from its first knock on the door — first-week
   exclusive filings carry the 'first-time-exclusive' review code. */
const GS_ACCOUNTS = {};   // pid -> {firstMin, filings}
function gsAccountSeen(pid, now){
  const a = GS_ACCOUNTS[pid] ||
    (GS_ACCOUNTS[pid] = { firstMin: now, filings: 0 });
  a.filings++;
  return a;
}
function gsAcctAgeDays(pid, now){
  const a = GS_ACCOUNTS[pid];
  if(!a || a.firstMin == null) return 0;
  return (now - a.firstMin) / 1440;
}

/* ---------------- account flags (moderation.json, verbatim) ---------
   flag_weights: a DENY VERDICT accrues score. Review-tier codes weight
   0 — a flag is a punishment record, not a hunch. Structural denials
   (cooldown, possession_ban, rate_limited...) are not verdicts and never
   flag — the wire maps a few onto codes for display only. */
const GS_FLAG_W = {
  'harm-targeting': 2, 'secret-extraction': 1, 'possession-scope': 1,
  'admin-domain': 1, 'real-business': 0, 'identity-fraud': 2,
  'legal-backstop': 3, 'gray-zone': 0, 'surface-relationship': 0,
  'venue-lock': 0, 'repeat-pattern': 1, 'real-person-mention': 0,
  'appeal-resubmit': 0, 'first-time-exclusive': 0,
};
const GS_FLAG_DECAY_MIN = 30 * 1440;      // -1 per clean 30 days
const GS_FLAGS = {};   /* pid -> {score, lastFlagMin, reviewUntil,
                           suspendUntil, ownerHold, log[]}              */
function gsFlagScore(pid, now){
  const f = GS_FLAGS[pid];
  if(!f) return 0;
  if(f.lastFlagMin == null) return f.score;
  const clean = Math.floor((now - f.lastFlagMin) / GS_FLAG_DECAY_MIN);
  return Math.max(0, f.score - clean);
}
function gsFlagBump(pid, w, code, now){
  const f = GS_FLAGS[pid] || (GS_FLAGS[pid] = {
    score: 0, lastFlagMin: null, reviewUntil: 0, suspendUntil: 0,
    ownerHold: false, log: [] });
  f.score = gsFlagScore(pid, now);     // decay applies before the new mark
  f.score += w; f.lastFlagMin = now;
  f.log.push({ min: now, w: w, code: code });
  /* the ladder (moderation.json account_flags) — windows are absolute
     from the crossing; a fresh verdict refreshes them */
  if(f.score >= 3) f.reviewUntil = Math.max(f.reviewUntil, now + 7 * 1440);
  if(f.score >= 6) f.suspendUntil = Math.max(f.suspendUntil, now + 72 * 60);
  if(f.score >= 9) f.ownerHold = true;
  gsRepNote(pid, 'flag', w, { code: code, score: f.score }, now);
}
/* the submit-time gate: {deny:'...'} refuses outright, {review:true}
   forces the human lane, null lets the filing through */
function gsAccountGate(pid, now){
  const f = GS_FLAGS[pid];
  if(!f) return null;
  if(f.ownerHold) return { deny: 'account_review' };
  if(f.suspendUntil > now)
    return { deny: 'account_suspended', untilMin: f.suspendUntil };
  if(f.reviewUntil > now) return { review: true };
  return null;
}
/* INTERNAL — account state is never public (moderation.json: flags are
   never shown). Bridge-exposed for the owner console only. */
function gsFlagStatus(pid, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const f = GS_FLAGS[pid];
  if(!f) return { score: 0, clean: true };
  return {
    score: gsFlagScore(pid, now),
    reviewUntil: f.reviewUntil > now ? f.reviewUntil : null,
    suspendedUntil: f.suspendUntil > now ? f.suspendUntil : null,
    ownerHold: !!f.ownerHold,
    flags: f.log.slice(),
  };
}
/* the owner tool — clears score and all windows (account review end) */
function gsFlagClear(pid, by, nowMin){
  const f = GS_FLAGS[pid];
  if(!f) return false;
  const now = (nowMin != null) ? nowMin : gsNowMin();
  f.score = 0; f.reviewUntil = 0; f.suspendUntil = 0; f.ownerHold = false;
  /* the owner closed the case — the repeat-pattern ledger starts fresh
     from this minute. Denials filed AFTER the clear still count. */
  f.forgivenMin = now;
  gsRepNote(pid, 'cleared', 0, { by: by || 'owner' }, now);
  return true;
}

/* ---------------- appeal finality ----------------
   a twice-denied request TEXT is closed — keyed on the normalized
   authored text so rewording is a new request, refiling is not. */
const GS_FINAL = {};   // 'pid|texthash' -> {min}
function gsTextHash(s){
  let h = 0x811c9dc5;                    // FNV-1a — deterministic key
  for(let i = 0; i < s.length; i++){
    h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36);
}
function gsSpecText(spec){
  const p = (spec && spec.params) || {};
  return [spec && spec.note, p.note, p.intent, p.text, p.plan, p.goal,
          p.name]
    .filter(s => typeof s === 'string').join('\n')
    .trim().toLowerCase().replace(/\s+/g, ' ');
}
function gsFinalKey(pid, spec){
  const t = gsSpecText(spec);
  return t ? pid + '|' + gsTextHash(t) : null;
}
function gsFinalText(pid, spec){
  const k = gsFinalKey(pid, spec);
  return !!(k && GS_FINAL[k]);
}
function gsAppealFinal(r, now){
  const k = gsFinalKey(r.playerId, r);
  if(k) GS_FINAL[k] = { min: now };
}

/* ---------------- appeals (moderation.json) ----------------
   the appeal lane: a denied request may be appealed ONCE, within 72h of
   the denial, by the player who filed it. Legal-backstop is never
   appealable; structural denials aren't verdicts and can't be appealed
   (there is nothing to appeal — the cooldown is a fact). The appeal
   record is a parked request — billed 0; approval re-bills the original
   price once (the appeal is free, the run is not). */
const GS_APPEAL_STATS = { filed: 0, overturned: 0, denied: 0, refused: 0 };
const GS_APPEAL_WINDOW_MIN = 72 * 60;
function gsAppealRequest(origId, opts){
  opts = opts || {};
  const now = (opts.nowMin != null) ? opts.nowMin : gsNowMin();
  const bad = (err) => { GS_APPEAL_STATS.refused++;
                         return { ok: false, err: err }; };
  const o = (typeof gsRequestById === 'function')
    ? gsRequestById(origId) : null;
  if(!o || o.status !== 'denied') return bad('not_denied');
  if(o.playerId !== opts.playerId) return bad('not_your_request');
  if(o.appealOf) return bad('appeal_final');        // second denial is final
  if(o.appealed) return bad('already_appealed');    // one appeal per request
  if(o.reason === 'legal-backstop') return bad('not_appealable');
  if(!o.screenDenied) return bad('not_appealable'); // structural, not a verdict
  const deniedMin = (o._now != null) ? o._now : o.submittedMin;
  if(now - deniedMin > GS_APPEAL_WINDOW_MIN) return bad('window_closed');
  o.appealed = true;
  GS_APPEAL_STATS.filed++;
  const r = { id: 'req-' + (++GS_REQ.seq), n: GS_REQ.seq,
    playerId: o.playerId, kind: o.kind, target: o.target,
    durationMin: o.durationMin, params: o.params, price: o.price,
    billed: 0, surge: o.surge || 1, discount: 0,
    resKey: o.resKey, claims: o.claims,
    submittedMin: now, status: 'in_review', appealOf: origId,
    origReviewer: o.reviewedBy || null,
    screen: 'appeal-resubmit', lane: 'appeal',
    reviewExpireMin: now + GS_REVIEW_TTL_MIN,
    usedMin: 0, refunded: 0, fxOn: false, _now: now };
  GS_REQ.reqs.push(r);
  /* aggregate-only on the public side: the wire suppresses 'appeal'
     events by schema — the recap counts them, the street never reads one */
  gsBusEmit('appeal', r, { of: origId });
  return { ok: true, request: r };
}
function gsAppealStats(){
  const s = GS_APPEAL_STATS;
  return { filed: s.filed, overturned: s.overturned, denied: s.denied,
           refused: s.refused,
           reversalRate: s.filed ?
             +(s.overturned / s.filed).toFixed(3) : null };
}

/* ---------------- the ad trickle ----------------
   design §6 — ads are the non-purchase mint. 2cr/view, 5/views per PT
   day: enough to keep a free player honest, never enough to fund a
   flood. The cap is on the PT day, deterministic. */
const GS_AD_CFG = { perView: 2, perDay: 5 };
const GS_ADS = {};   // pid -> {day, views, earned}
function gsWatchAd(pid, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const day = gsGriefClock(now).day;
  const a = GS_ADS[pid] || (GS_ADS[pid] = { day: day, views: 0, earned: 0 });
  if(a.day !== day){ a.day = day; a.views = 0; }
  if(a.views >= GS_AD_CFG.perDay)
    return { ok: false, capHit: true, viewsToday: a.views,
             earnedToday: a.views * GS_AD_CFG.perView };
  a.views++; a.earned += GS_AD_CFG.perView;
  gsCreditGrant(pid, GS_AD_CFG.perView, 'ad view');
  return { ok: true, credits: GS_AD_CFG.perView, viewsToday: a.views,
           capLeft: GS_AD_CFG.perDay - a.views };
}
function gsAdStatus(pid, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const day = gsGriefClock(now).day;
  const a = GS_ADS[pid];
  const views = (a && a.day === day) ? a.views : 0;
  return { viewsToday: views, capLeft: GS_AD_CFG.perDay - views,
           perView: GS_AD_CFG.perView };
}

/* ---------------- the reputation notebook (the v11 hook) -------------
   dated, weighted notes on entities — players, characters, 'owner'.
   Internal only; the wire never carries it. v11 (player-facing
   reputation) reads this ledger. */
const GS_REP = [];
const GS_REP_SEQ = { n: 0 };
function gsRepNote(entity, kind, w, detail, now){
  GS_REP.push({ n: ++GS_REP_SEQ.n, entity: entity, kind: kind, w: w,
    min: (now != null ? now : gsNowMin()), detail: detail || null });
}
function gsRepLedger(id){ return GS_REP.filter(e => e.entity === id); }
function gsRepScore(id, sinceMin){
  let s = 0;
  for(const e of GS_REP)
    if(e.entity === id && (sinceMin == null || e.min >= sinceMin))
      s += e.w;
  return s;
}

/* ---------------- the legal lane ----------------
   moderation.json: the legal backstop may kill a request pre-run or
   mid-flight. Full refund (ledger reason 'legal-deny'), +3 flag via the
   ordinary deny event, and the public wording is identical to any
   denial — 'request not approved' is the whole story the street gets.
   The owner is notified on the internal rep notebook. */
function gsEscalateLegal(id, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = gsRequestById(id);
  if(!r || (r.status !== 'queued' && r.status !== 'active' &&
            r.status !== 'in_review')) return false;
  const wasActive = r.status === 'active';
  if(wasActive) gsFxDeactivate(r, now, 'legal');
  r.usedMin = wasActive
    ? Math.max(0, Math.min(r.durationMin, now - (r.startMin || now))) : 0;
  r.status = 'denied'; r._now = now;
  r.reason = 'legal-backstop'; r.screenDenied = 'legal-backstop';
  r.by = 'legal';
  if(r.billed > 0){ gsCreditRefund(r.playerId, r.billed, 'legal-deny');
                    r.refunded = (r.refunded || 0) + r.billed; }
  gsBusEmit('deny', r, { reason: 'legal-backstop', via: 'legal',
                         refund: r.billed });
  gsRepNote('owner', 'legal_kill', 0, { req: id }, now);
  gsPromoteAll(now);                 // freed resources hand off honestly
  return true;
}

/* ---------------- the resource board (requests.json) ----------------
   public per-resource state — free | cool | locked | queued:
   locked shows holder + minutes left, queued shows depth as a count
   (never a position auction), cool shows minutes left. Read-only. */
const GS_REVIEW_DEPTH_ALERT = 20;   // alert the owner; NEVER auto-approve
function gsResourceBoard(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const board = {};
  const mark = (res, st, o) => {
    const b = board[res] || (board[res] = { res: res, state: 'free',
                                            depth: 0 });
    if(st === 'locked'){
      b.state = 'locked'; if(o) Object.assign(b, o);
    } else if(st === 'queued'){
      b.depth++;
      if(b.state === 'free') b.state = 'queued';
    } else if(st === 'cool' && b.state === 'free'){
      b.state = 'cool'; if(o) Object.assign(b, o);
    }
  };
  for(const r of GS_REQ.reqs){
    if(r.status !== 'active' && r.status !== 'queued') continue;
    for(const c of gsClaimsOf(r)){
      if(r.status === 'active')
        mark(c.res, 'locked', { holder: r.id, player: r.playerId,
          leftMin: +((r.endMin != null ? r.endMin - now : 0)).toFixed(1) });
      else mark(c.res, 'queued');
    }
  }
  for(const res in GS_REQ.cdClaim){
    const left = GS_REQ.cdClaim[res] - now;
    if(left > 0) mark(res, 'cool', { leftMin: +left.toFixed(1) });
  }
  /* kind-level cooldowns read as a cool marker on the shared key */
  for(const kind in GS_REQ.cdG){
    const left = GS_REQ.cdG[kind] - now;
    if(left > 0) mark('g:' + kind, 'cool', { leftMin: +left.toFixed(1) });
  }
  return board;
}

/* ---------------- the pre-payment receipt ----------------
   gsPriceQuote mirrors the submit path's math without mutating anything
   — the request form shows the real total before a credit moves
   (requests.json: surge shown before payment; marketing-v37: class x
   min, surge, queue discount, refund terms itemized). */
function gsPriceQuote(spec, nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const a = spec && GS_REQ.actions[spec.kind];
  const pid = spec && spec.playerId;
  if(!a) return { ok: false, deny: 'unknown_action' };
  const target = spec.target || null;
  const dur = spec.durationMin;
  const params = spec.params || null;
  if(a.scope === 'target' && !target)
    return { ok: false, deny: 'missing_target' };
  if(!(dur >= a.minMin && dur <= a.maxMin))
    return { ok: false, deny: 'bad_duration' };
  const gate = (!gsIsAdmin(pid) && typeof gsAccountGate === 'function')
    ? gsAccountGate(pid, now) : null;
  if(gate && gate.deny) return { ok: false, deny: gate.deny };
  var screened = null;
  if(typeof gsIntentScreen === 'function'){
    const scr = gsIntentScreen({ playerId: pid, kind: spec.kind, target,
      params, note: spec.note, appeal_of: spec.appeal_of, now });
    if(scr && scr.verdict === 'deny') return { ok: false, deny: scr.code };
    if(scr && scr.verdict === 'review') screened = scr;
  }
  if(!gsIsAdmin(pid) && gsFinalText(pid, spec))
    return { ok: false, deny: 'appeal_final' };
  if(a.allow){
    const why = a.allow({ playerId: pid, target, kind: spec.kind,
                          params }, now);
    if(why !== true) return { ok: false, deny: why };
  }
  if((GS_REQ.cdP[pid + '|' + spec.kind] || 0) > now)
    return { ok: false, deny: 'cooldown',
             untilMin: GS_REQ.cdP[pid + '|' + spec.kind] };
  if((GS_REQ.cdG[spec.kind] || 0) > now)
    return { ok: false, deny: 'global_cooldown',
             untilMin: GS_REQ.cdG[spec.kind] };
  const cand = { playerId: pid, kind: spec.kind, target, params,
                 n: Infinity };
  const claims = gsClaimsOf(cand);
  const blockers = gsFindBlockers(cand);
  const wouldQueue = blockers.length > 0;
  const lane = gsIsAdmin(pid) ? null :
    (screened ? 'screen' :
     a.review === 'always' ? 'exclusive' :
     (gate && gate.review) ? 'flagged' :
     (spec.kind === 'hire' && params && typeof params.name === 'string' &&
      params.name.trim()) ? 'naming' : null);
  const surge = gsSurgeFactor(cand, now);
  const base = Math.ceil(a.ratePerMin * dur);
  const list = Math.ceil(a.ratePerMin * dur * surge);
  const queueTotal = Math.ceil(list * (1 - GS_QUEUE_DISCOUNT));
  return {
    ok: true, kind: spec.kind, target: target, minutes: dur,
    ratePerMin: a.ratePerMin, base: base,
    surge: surge, surgePressure: gsSurgePressure(cand, now),
    primetime: gsBusPrimetime(now),
    list: list,
    queueDiscount: (wouldQueue && !lane) ? GS_QUEUE_DISCOUNT : 0,
    total: (wouldQueue && !lane) ? queueTotal : list,
    wouldQueue: wouldQueue,
    blockedBy: wouldQueue ? blockers.map(b => b.id) : [],
    wouldReview: !!lane, lane: lane,
    adminFree: gsIsAdmin(pid),
    refundNote: 'queued or in-review requests that never run refund in ' +
      'full; a player-cancel refunds whole unused minutes; admin ' +
      'overrides always compensate in full',
  };
}

/* ---------------- the owner dashboard ----------------
   moderation.json metrics: queue depth, oldest wait, median decision,
   denial rate by code, appeal reversal, compensation paid. */
function gsModMetrics(nowMin){
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const q = gsReviewQueue();
  let oldest = 0;
  const decided = [];
  const denials = {};
  let compCr = 0;
  for(const r of GS_REQ.reqs){
    if(r.status === 'in_review' && r.submittedMin != null)
      oldest = Math.max(oldest, now - r.submittedMin);
    if(r.reviewedMin != null && r.submittedMin != null)
      decided.push(r.reviewedMin - r.submittedMin);
    if(r.status === 'denied' && r.reason)
      denials[r.reason] = (denials[r.reason] || 0) + 1;
  }
  for(const e of GS_FEED)
    if(e.type === 'cancel' && (e.by === 'admin' || e.by === 'owner'))
      compCr += e.refund || 0;
  decided.sort((x, y) => x - y);
  return {
    reviewDepth: q.length,
    oldestWaitMin: +oldest.toFixed(1),
    medianDecisionMin: decided.length
      ? +decided[Math.floor(decided.length / 2)].toFixed(1) : null,
    denialsByCode: denials,
    appeals: gsAppealStats(),
    compensatedCr: compCr,
    suppressedFeed: (typeof GS_WIRE_SUP !== 'undefined')
      ? GS_WIRE_SUP.n : null,
  };
}

/* ---------------- the bus hook ----------------
   one subscriber feeds both ledgers off the same feed events:
   - deny VERDICTS accrue flag weight (moderation.json flag_w)
   - verdicts aimed at a character mark the character as targeted
   - rate/gate refusals leave a rep note (flood bookkeeping)
   - appeal resolutions count toward the aggregate stats
   - review depth over threshold alerts the owner once — internal only
   - admin overrides are owner reputation events (the landlord's hand
     is public, so the notebook records it too)                     */
var gsDepthAlerted = false;
function gsGriefOnEvent(evt){
  if(!evt || evt.n == null) return;
  const now = (evt.min != null) ? evt.min : gsNowMin();
  if(evt.type === 'deny'){
    const w = GS_FLAG_W[evt.reason];
    if(w != null && evt.player){
      if(w > 0) gsFlagBump(evt.player, w, evt.reason, now);
      gsRepNote(evt.player, 'denied', w, { code: evt.reason }, now);
      if(evt.target && typeof gsCharKind === 'function' &&
         gsCharKind(evt.target))
        gsRepNote(evt.target, 'targeted', 1,
          { by: evt.player, code: evt.reason }, now);
    }
    if(evt.reason === 'rate_limited' || evt.reason === 'too_many_live')
      gsRepNote(evt.player, 'rate', 0, { reason: evt.reason }, now);
    else if(evt.reason === 'account_suspended' ||
            evt.reason === 'account_review')
      gsRepNote(evt.player, 'gate', 0, { reason: evt.reason }, now);
  }
  if(evt.type === 'review'){
    if(evt.action === 'in_review' && !gsDepthAlerted &&
       gsReviewQueue().length > GS_REVIEW_DEPTH_ALERT){
      gsDepthAlerted = true;
      gsRepNote('owner', 'review_backlog', 0,
        { depth: gsReviewQueue().length }, now);
    }
    if(evt.req){
      const r = gsRequestById(evt.req);
      if(r && r.appealOf){
        if(evt.action === 'approved' || evt.action === 'approved_modified')
          GS_APPEAL_STATS.overturned++;
        else if(evt.action === 'denied') GS_APPEAL_STATS.denied++;
      }
    }
  }
  if(evt.type === 'admin')
    gsRepNote('owner', 'admin', 0, { action: evt.action }, now);
}
if(typeof gsBusOnEvent === 'function') gsBusOnEvent(gsGriefOnEvent);

/* ---------------- persistence (rides the bus snapshot) ------------- */
function gsGriefSnapshot(){
  return { flags: GS_FLAGS, accounts: GS_ACCOUNTS, ads: GS_ADS,
           final: GS_FINAL, rep: GS_REP.slice(), repN: GS_REP_SEQ.n,
           appealStats: Object.assign({}, GS_APPEAL_STATS),
           depthAlerted: gsDepthAlerted };
}
function gsGriefLoad(d){
  for(const k in GS_FLAGS) delete GS_FLAGS[k];
  for(const k in GS_ACCOUNTS) delete GS_ACCOUNTS[k];
  for(const k in GS_ADS) delete GS_ADS[k];
  for(const k in GS_FINAL) delete GS_FINAL[k];
  GS_REP.length = 0;
  GS_APPEAL_STATS.filed = 0; GS_APPEAL_STATS.overturned = 0;
  GS_APPEAL_STATS.denied = 0; GS_APPEAL_STATS.refused = 0;
  gsDepthAlerted = false;
  GS_REP_SEQ.n = 0;
  if(!d) return;
  if(d.flags) Object.assign(GS_FLAGS, d.flags);
  if(d.accounts) Object.assign(GS_ACCOUNTS, d.accounts);
  if(d.ads) Object.assign(GS_ADS, d.ads);
  if(d.final) Object.assign(GS_FINAL, d.final);
  if(Array.isArray(d.rep)) GS_REP.push.apply(GS_REP, d.rep);
  GS_REP_SEQ.n = d.repN || GS_REP.length;
  if(d.appealStats) Object.assign(GS_APPEAL_STATS, d.appealStats);
  gsDepthAlerted = !!d.depthAlerted;
}
function gsGriefReset(){ gsGriefLoad(null); }
