/* =====================================================================
   PART 41S: GAME SYSTEMS — THE ERRAND LAYER (possession, v18)

   A possession session stops being a bare flag and becomes a lived
   errand run: the driver can step into a real venue, buy off the
   chalkboard the camera already reads, sit down, and trade a hello
   with a neighbor — then hand the body back with the afternoon's
   trail honestly written into the debrief and the handoff note.

   Everything here obeys the stage-door rule (41F): the verbs act on the
   BODY only. The spoken hello is the shared thin kit's line — a player
   string never reaches a character's mouth, and the greeting can only
   INVITE a conversation (a main's own brain decides whether to talk).
   Purchases move the character's OWN game dollars to the venue's till
   account — the same accounts payroll draws from — never credits.

   The boards mirror world/storefronts.json v44 verbatim: parody names
   only, game-dollar prices only. If the world track re-chalks a board,
   this file needs the same diff — the two stay in lockstep on purpose
   (the board the driver reads is the board the camera reads).
   ===================================================================== */

/* ---- venue boards (world/storefronts.json v44 mirror) ----
   keyed by the name a pawn's `inside` field holds. acct = the ledger
   till; where a job-board employer exists, the till IS that account so
   a good lunch rush shows up in Friday payroll. openAir = no door —
   buy at the stall, no inside required. */
const GS_BOARD_SRC = {
  'Mudhaus Coffee': { acct: 'biz:mudhaus',
    board: ['drip 3.50', 'latte 5.50', 'pour-over 6.50',
            'day-old pastry 2.00', 'the regular — regulars know'] },
  'Taqueria El Farolote': { acct: 'biz:farolote',
    board: ['super burrito 12.00', 'taco 3.75', 'agua fresca 4.00',
            'pupusa — not on the menu. not yet.'] },
  'Auerbach Hardware': { acct: 'biz:auerbach',
    board: ['key cut 4.00', 'tool rental, half-day 18.00',
            'faucet washer 1.50', 'advice — free, worth every penny'] },
  'Dolores Perk': { acct: 'biz:perk',
    board: ['coffee 3.75', 'sandwich 9.50',
            'park cup to go — lid on tight'] },
  'Buy-Rite Market': { acct: 'biz:buyrite',
    board: ['sandwich of the day — ask',
            'peaches (in season): priced accordingly',
            'grocery run for one ≈ 45.00'] },
  'Buy-Rite Creamery': { acct: 'biz:creamery',
    board: ['single scoop 5.50', 'sundae 9.00',
            "flavor board rotates — today's is today's"] },
  'Il Delfino': { acct: 'biz:delfino',
    board: ['pasta 24.00', 'table for two with wine ≈ 110.00',
            'the window two-top is the window two-top'] },
  'Baguette About It Bakery': { acct: 'biz:bai',
    board: ['morning bun 5.00', 'country loaf 11.00', 'croissant 4.75',
            'day-olds to Mudhaus — nothing wasted'] },
  'The 600 Club': { acct: 'biz:600club',
    board: ['beer 6.00', 'well drink 9.00',
            'open-mic slot: free, five minutes, no encores'] },
  'Dandy Lion Chocolate Co.': { acct: 'biz:dandylion',
    board: ['single-origin bar 12.00', 'hot chocolate 6.00',
            'tasting square — one per visitor, honor system'] },
  'Valencia Growers Market': { acct: 'biz:growers', openAir: true,
    board: ['produce bag ≈ 20.00',
            'tomato cases priced by the walk — compare before you buy'] },
  'Needlepointe Tattoo': { acct: 'biz:needlepointe',
    board: ['shop minimum 80.00', 'flash piece 120.00+',
            "custom consult — free, honest, sometimes 'no'"] },
  'Folsom Auto & Sons': { acct: 'biz:folsomauto',
    board: ['oil change 65.00', 'brake job 380.00',
            'diagnostic shrug — free with any nod'] },
  "Malik's Mini Mart": { acct: 'biz:maliks',
    board: ['chips 2.50', 'six-pack 11.00',
            'the usual — Malik already knows'] },
  'Frutería Las Palmas': { acct: 'biz:laspalmas', openAir: true,
    board: ['fruit cup with chile 6.00', 'mango 2.00',
            "whatever's ripe — ask Luz"] },
  'Bloom & Doom Flowers': { acct: 'biz:bloom',
    board: ['bouquet 35.00', 'single stem 4.00',
            'the order book is private — the van is not'] },
  'Golden Hour Laundromat': { acct: 'biz:goldenhour',
    board: ['wash 4.25', 'dry 0.50 / 8 min', 'wash-and-fold 1.75/lb',
            'the folding table is communal territory'] },
  'The Dusty Spine': { acct: 'biz:dustyspine',
    board: ['paperback 6.00', 'staff-pick hardcover 18.00',
            'free box 0.00 — take one, leave the guilt'] },
  'Marooned Records': { acct: 'biz:marooned',
    board: ['45s bin 2.00', 'used LP ≈ 16.00', 'new release 28.00',
            'sell-backs: hold shelf is real, so is the wait'] },
  'The Musket': { acct: 'biz:musket',
    board: ['small plate 14.00', 'cocktail 15.00',
            'bar seats are luck — the window watches it happen'] },
};

/* parse one board line: the trailing money token makes it sellable.
   '≈' and '+' ride the posted price; '/8 min' and '/lb' bill one unit.
   A line with no price is chalk, not stock. */
const GS_BOARDS = {};
(function(){
  const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                     .replace(/^-+|-+$/g, '');
  for(const name in GS_BOARD_SRC){
    const rec = GS_BOARD_SRC[name];
    const items = [];
    for(const line of rec.board){
      const m = String(line)
        .match(/^(.*?)\s*(?:≈\s*)?(\d+(?:\.\d+)?)(\+|\s*\/.*)?$/);
      if(!m || !m[1].trim()) continue;
      const label = m[1].trim().replace(/[—–].*$/, '').replace(/\s+$/, '');
      const usd = parseFloat(m[2]);
      items.push({ id: slug(label) || ('item-' + items.length),
        label: label, usd: usd,
        /* the ledger keeps whole dollars — the register rounds */
        cost: Math.max(0, Math.round(usd)) });
    }
    GS_BOARDS[name] = { name, acct: rec.acct, openAir: !!rec.openAir,
                        board: rec.board.slice(), items };
  }
})();

/* what a bought thing does to the body it was bought with — ordinary
   food logic, honest magnitudes. goods ride home on the character. */
function gsMenuClassify(label){
  const l = String(label || '').toLowerCase();
  if(/drip|latte|pour-over|coffee|agua|hot chocolate|beer|well drink|cocktail|wine|six-pack|soda|tea/.test(l))
    return { hyd: 0.30, sat: 0.05, fat: /coffee|drip|latte|pour-over/.test(l)
             ? -0.08 : 0 };
  if(/burrito|taco|sandwich|pasta|plate|pupusa|grocery|produce bag/
     .test(l))
    return { sat: 0.40, hyd: 0.10 };
  if(/pastry|bun|croissant|loaf|scoop|sundae|fruit|mango|chips|bar|square/
     .test(l))
    return { sat: 0.18, hyd: 0.05 };
  return { good: true };          // a thing, not a meal — it rides home
}

/* ---- venue + door resolution ---- */
function gsErrandVenue(name){
  if(!name || typeof SF_POIS === 'undefined') return null;
  if(typeof sfFindPOI === 'function'){
    const p = sfFindPOI(name);
    if(p) return { name: p.name, kind: p.kind, x: p.x, y: p.y,
                   door: (typeof sfPoiDoor === 'function')
                         ? sfPoiDoor(p) : { wx: p.wx, wy: p.wy } };
  }
  /* building-parody venues (The Dusty Spine, Marooned, …) live in
     SF_BLD — match raw or display name */
  if(typeof SF_BLD !== 'undefined')
    for(const b of SF_BLD){
      const disp = (typeof sfDisplayName === 'function')
        ? sfDisplayName(b.name, b.kind) : b.name;
      if(b.name === name || disp === name){
        const d = (typeof SF_DOOR_OF !== 'undefined' &&
                   SF_DOOR_OF.has && SF_DOOR_OF.has(b.i))
          ? SF_DOOR_OF.get(b.i) : null;
        return { name: disp || b.name, kind: b.kind, x: b.x, y: b.y,
                 door: d || { wx: Math.round(b.x / CS),
                              wy: Math.round(b.y / CS) } };
      }
    }
  return null;
}
function gsErrandBoard(name){
  if(!name) return null;
  if(GS_BOARDS[name]) return GS_BOARDS[name];
  if(typeof sfDisplayName === 'function'){
    const disp = sfDisplayName(name, null);
    if(disp && GS_BOARDS[disp]) return GS_BOARDS[disp];
  }
  /* tolerate exact POI names differing from the inside label */
  for(const k in GS_BOARDS)
    if(k.toLowerCase() === String(name).toLowerCase())
      return GS_BOARDS[k];
  return null;
}

/* shared gate: session live, caller is the driver, body exists */
function gsErrandSess(cid, playerId){
  const sess = GS_POSSESS[cid];
  if(!sess) return { err: 'not_possessed' };
  if(sess.playerId !== playerId) return { err: 'not_driver' };
  const v = (typeof gsVillagerForChar === 'function')
    ? gsVillagerForChar(cid) : null;
  if(!v) return { err: 'no_body' };
  return { sess, v };
}
function gsErrandEmit(sess, cid, extra){
  const r = sess.reqId ? gsRequestById(sess.reqId) : null;
  gsBusEmit('possess', r || { playerId: sess.playerId, kind: 'possess',
    target: cid, id: sess.reqId, _now: gsNowMin() }, extra);
}

/* step through a door — the venue must be a door-having place the pawn
   is standing at. 'home' means their own lease's door. */
function gsPossessEnter(cid, playerId, poiName){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  if(v.inside) return { ok: false, err: 'already_inside', inside: v.inside };
  if(poiName === 'home'){
    if(typeof gsHiredHomeCell !== 'function')
      return { ok: false, err: 'no_home' };
    const hc = gsHiredHomeCell(cid);
    if(!hc) return { ok: false, err: 'no_home' };
    const d = Math.hypot(v.x - (hc.wx * CS + 16), v.y - (hc.wy * CS + 16));
    if(d > 5 * CS) return { ok: false, err: 'too_far', dist: d };
    v.inBuilding = true; v.inside = 'home';
    v.targetX = null; v.targetY = null;
    gsSessAct(cid, 'enter', 'home');
    gsErrandEmit(sess, cid, { action: 'enter', char: cid, venue: 'home' });
    return { ok: true, inside: 'home' };
  }
  const ven = gsErrandVenue(poiName);
  if(!ven || !ven.door) return { ok: false, err: 'unknown_venue' };
  const board = gsErrandBoard(ven.name);
  if(board && board.openAir) return { ok: false, err: 'no_door' };
  const d = Math.hypot(v.x - (ven.door.wx * CS + 16),
                       v.y - (ven.door.wy * CS + 16));
  if(d > 5 * CS) return { ok: false, err: 'too_far', dist: d };
  if(typeof sfEnterPOI === 'function') sfEnterPOI(v, ven.name);
  else { v.inBuilding = true; v.inside = ven.name; }
  v.targetX = null; v.targetY = null;
  gsSessAct(cid, 'enter', ven.name);
  gsErrandEmit(sess, cid, { action: 'enter', char: cid, venue: ven.name });
  return { ok: true, inside: ven.name };
}
function gsPossessExit(cid, playerId){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  if(!v.inside && !v.inBuilding) return { ok: false, err: 'not_inside' };
  const was = v.inside;
  if(typeof sfExitPOI === 'function') sfExitPOI(v);
  else { v.inBuilding = false; v.inside = null; }
  gsSessAct(cid, 'exit', 'stepped out of ' + (was || 'the venue'));
  gsErrandEmit(sess, cid, { action: 'exit', char: cid, venue: was });
  return { ok: true, outside: true };
}

/* the chalkboard the pawn can see from where they stand — inside a
   door venue, or at an open-air stall */
function gsPossessMenu(cid, playerId){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { v } = g;
  let board = v.inside ? gsErrandBoard(v.inside) : null;
  let venue = board ? board.name : null;
  if(!board && typeof SF_POIS !== 'undefined')
    for(const name in GS_BOARDS){
      const b = GS_BOARDS[name];
      if(!b.openAir) continue;
      const ven = gsErrandVenue(name);
      if(ven && Math.hypot(v.x - ven.x, v.y - ven.y) <= 4 * CS){
        board = b; venue = name; break;
      }
    }
  if(!board) return { ok: false, err: 'no_menu' };
  return { ok: true, venue, board: board.board,
           items: board.items.map(i => Object.assign({}, i)),
           balance: gsDollarBalance(cid) };
}

/* buy off the board — character dollars to the venue's till, real item
   effects on the real body, goods ride home on the hire's record. The
   session spend cap counts purchases too — the card has a limit. */
function gsPossessBuy(cid, playerId, itemId, nowMin){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  const menu = gsPossessMenu(cid, playerId);
  if(!menu.ok) return { ok: false, err: menu.err === 'no_menu'
                        ? 'not_inside' : menu.err };
  const it = menu.items.find(i => i.id === itemId || i.label === itemId);
  if(!it) return { ok: false, err: 'no_item', menu: menu.venue };
  const cost = it.cost;
  if(cost > 0){
    if(cost > gsDollarBalance(cid))
      return { ok: false, err: 'insufficient_dollars',
               balance: gsDollarBalance(cid) };
    if(((sess.spent || 0) + cost) > GS_POSSESS_SPEND_MAX)
      return { ok: false, err: 'spend_cap', cap: GS_POSSESS_SPEND_MAX,
               spent: sess.spent || 0 };
    const txn = gsDollarPay(cid, menu.venue && GS_BOARDS[menu.venue]
      ? GS_BOARDS[menu.venue].acct : 'biz:' + menu.venue, cost,
      'buy: ' + it.label);
    if(!txn) return { ok: false, err: 'insufficient_dollars',
                      balance: gsDollarBalance(cid) };
    sess.spent = (sess.spent || 0) + cost;
  }
  /* the body feels it — and the needs layer learns, so the thin brain
     doesn't send them straight back out for lunch after handoff */
  const eff = gsMenuClassify(it.label);
  if(v.body){
    if(eff.sat) v.body.satiety = Math.min(1, (v.body.satiety||0) + eff.sat);
    if(eff.hyd) v.body.hydration =
      Math.min(1, (v.body.hydration||0) + eff.hyd);
    if(eff.fat) v.body.fatigue =
      Math.max(0, Math.min(1, (v.body.fatigue||0) + eff.fat));
  }
  if(eff.sat && typeof gsThinNeeds === 'function'){
    const n = gsThinNeeds(cid);
    n.hunger = Math.max(0, n.hunger - eff.sat);
  }
  if(eff.good){
    sess.goods = sess.goods || [];
    if(sess.goods.indexOf(it.label) < 0) sess.goods.push(it.label);
    const h = (typeof GS_HIRED === 'object') ? GS_HIRED[cid] : null;
    if(h){
      h.belongings = h.belongings || [];
      if(h.belongings.indexOf(it.label) < 0 &&
         h.belongings.length < 20)
        h.belongings.push(it.label);   // public surface — rides roster
    }
  }
  gsSessAct(cid, 'buy', it.label);
  gsErrandEmit(sess, cid, { action: 'buy', char: cid, item: it.label,
                            venue: menu.venue, amt: cost });
  return { ok: true, item: it.label, cost, venue: menu.venue,
           balance: gsDollarBalance(cid),
           effect: eff.good ? 'good' : 'consumed' };
}

/* trade a hello — the ONLY social verb. No text parameter exists: the
   driven pawn's line comes from the shared thin kit, never the player.
   A main is INVITED through the real convo channel (their brain decides);
   a thin neighbor answers from the same kit; a co-driven pawn waves. */
const GS_GREET_LAST = {};          // 'a|b' -> minute (either direction)
const GS_GREET_CD_MIN = 20;
function gsPossessGreet(cid, playerId, targetId, nowMin){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  const now = (nowMin != null) ? nowMin : gsNowMin();
  if(!targetId || targetId === cid)
    return { ok: false, err: 'bad_target' };
  if(typeof gsCharKind !== 'function' || !gsCharKind(targetId))
    return { ok: false, err: 'not_a_character' };
  const t = gsVillagerForChar(targetId);
  if(!t) return { ok: false, err: 'offstage' };
  /* proximity: same room, or sidewalk distance */
  const sameRoom = !!(v.inside && t.inBuilding && v.inside === t.inside);
  const near = Math.hypot(v.x - t.x, v.y - t.y) <= 8 * CS;
  if(!sameRoom && (!near || (v.inside || t.inside) && v.inside !== t.inside))
    return { ok: false, err: 'too_far' };
  const pair = [cid, targetId].sort().join('|');
  const last = GS_GREET_LAST[pair];
  if(last != null && now - last < GS_GREET_CD_MIN)
    return { ok: false, err: 'just_greeted',
             againInMin: +(GS_GREET_CD_MIN - (now - last)).toFixed(1) };
  GS_GREET_LAST[pair] = now;
  sess.greeted = sess.greeted || {};
  sess.greeted[targetId] = now;

  /* the hello — shared kit only. Player text can never reach the mouth
     because there is nowhere to put it. */
  const mine = (typeof gsThinSay === 'function') ? gsThinSay(cid, now)
                                               : null;
  if(typeof sfSay === 'function' && mine) sfSay(v, mine.line);
  v.faceTo = { x: t.x, y: t.y };
  t.faceTo = { x: v.x, y: v.y };
  const tKind = gsCharKind(targetId);
  let via = 'waved', replied = null;
  if(tKind === 'core' && typeof sfConvoOpen === 'function'){
    /* the real convo channel: the invite lands on the main's dispatch —
       they decide whether to talk. No answer = a wave that didn't land,
       which is also a scene. A muted kit (phrase cap) sends no phantom
       invite — it stays a wave. */
    if(mine){
      sfConvoOpen(v, t, mine.line);
      if(typeof sfDispatchTrig === 'function')
        sfDispatchTrig(t, 'convo_invite', 'T1', { from: cid });
      via = 'invited';
    }
  } else if(tKind !== 'core'){
    /* thin + hired AI pawns answer from the same kit — small talk on
       the corner, honest and bounded. A possessed-by-another pawn waves
       back with kit too: nobody puts words in a driven mouth. */
    const theirs = (typeof gsThinSay === 'function')
      ? gsThinSay(targetId, now) : null;
    if(theirs && typeof sfSay === 'function'){
      sfSay(t, theirs.line);
      replied = theirs.line; via = 'answered';
    }
    const otherSess = GS_POSSESS[targetId];
    if(otherSess) gsSessAct(targetId, 'greet',
      gsCharName(cid) + ' said hello');
  }
  gsSessAct(cid, 'greet', 'said hello to ' + gsCharName(targetId));
  gsErrandEmit(sess, cid, { action: 'greet', char: cid, to: targetId,
                            via });
  return { ok: true, to: targetId, toName: gsCharName(targetId), via,
           said: mine ? mine.line : null, replied };
}

/* sit down / take a load off — the body actually recovers (bodyTick
   restores fatigue in 'sit'). The next drive click stands them up. */
function gsPossessRest(cid, playerId){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  v.targetX = null; v.targetY = null; v.sfPath = null; v.moving = false;
  v.state = v.inside ? 'rest' : 'sit';
  gsSessAct(cid, 'rest', v.inside ? 'rested at ' + v.inside
                                  : 'sat down a minute');
  gsErrandEmit(sess, cid, { action: 'rest', char: cid });
  return { ok: true, state: v.state };
}

/* the windshield — everything the driver needs on one card. Driver-only:
   meter + wallet-adjacent fields don't leave the session. */
function gsPossessScene(cid, playerId, nowMin){
  const g = gsErrandSess(cid, playerId);
  if(g.err) return { ok: false, err: g.err };
  const { sess, v } = g;
  const now = (nowMin != null) ? nowMin : gsNowMin();
  const r = sess.reqId ? gsRequestById(sess.reqId) : null;
  const menu = gsPossessMenu(cid, playerId);
  const near = [];
  if(typeof VILLAGERS !== 'undefined')
    for(const o of VILLAGERS){
      if(o === v) continue;
      const oid = o._castId || o.gsCharId;
      if(!oid || !gsCharKind(oid)) continue;
      const sameRoom = !!(v.inside && o.inBuilding &&
                          o.inside === v.inside);
      const d = Math.hypot(o.x - v.x, o.y - v.y);
      if(sameRoom || (!v.inside && !o.inside && d <= 8 * CS))
        near.push({ id: oid, name: gsCharName(oid),
                    kind: gsCharKind(oid) });
      if(near.length >= 8) break;
    }
  const warnings = [];
  if(v.body){
    if(v.body.fatigue >= 0.85) warnings.push('tired');
    if(v.body.satiety <= 0.15) warnings.push('hungry');
    if(v.body.hydration <= 0.15) warnings.push('thirsty');
  }
  return {
    ok: true, char: cid, name: gsCharName(cid),
    pos: { wx: Math.round(v.x / CS), wy: Math.round(v.y / CS) },
    inside: v.inside || null, state: v.state,
    venue: menu && menu.ok ? { name: menu.venue, items: menu.items }
                           : null,
    near,
    body: v.body ? { satiety: +((v.body.satiety||0).toFixed(2)),
                     hydration: +((v.body.hydration||0).toFixed(2)),
                     fatigue: +((v.body.fatigue||0).toFixed(2)) } : null,
    meter: { remainingMin: r ? +Math.max(0, r.endMin - now).toFixed(1)
                             : null,
             extendedMin: (r && r.extendedMin) || 0,
             /* the "+N at this rate" button's truth — same math the
                request meter shows, so the windshield never lies */
             extend: r ? (gsRequestMeter(r.id, now) || {}).extend || null
                       : null },
    acts: (sess.acts || []).slice(-6).map(a => a.t),
    goods: (sess.goods || []).slice(),
    spent: sess.spent || 0,
    rentRisk: gsPossessRentRisk(cid),
    warnings,
  };
}

/* reset for the bus reset path — boards are static, cooldowns are not */
function gsErrandReset(){
  for(const k in GS_GREET_LAST) delete GS_GREET_LAST[k];
}
function gsErrandSnapshot(){
  return { greet: Object.assign({}, GS_GREET_LAST) };
}
function gsErrandLoad(d){
  gsErrandReset();
  if(d && d.greet) Object.assign(GS_GREET_LAST, d.greet);
}

/* ---- bridge surface ---- */
if(typeof window !== 'undefined' && window.__aiBridge){
  const B = window.__aiBridge;
  B.gsPossessEnter = (cid, pid, poi) => gsPossessEnter(cid, pid, poi);
  B.gsPossessExit = (cid, pid) => gsPossessExit(cid, pid);
  B.gsPossessBuy = (cid, pid, item) => gsPossessBuy(cid, pid, item);
  B.gsPossessGreet = (cid, pid, t) => gsPossessGreet(cid, pid, t);
  B.gsPossessRest = (cid, pid) => gsPossessRest(cid, pid);
  B.gsPossessScene = (cid, pid) => gsPossessScene(cid, pid);
  B.gsPossessMenu = (cid, pid) => gsPossessMenu(cid, pid);
  B.gsErrandBoard = (name) => gsErrandBoard(name);
}
