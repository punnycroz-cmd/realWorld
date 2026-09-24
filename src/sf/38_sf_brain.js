/* =====================================================================
   PART 38 — SF BRAIN: interiority surface + conversation channel +
   event-driven dispatch (v16 "the becoming brain")

   The engine owns logistics and the sensorium; the brain owns every
   intention. This module provides:

   - sfDispatchTick / sfDispatchPoll: the per-main trigger queue the
     driver drains. Triggers (cost-research B1): order_end, gap,
     directive_expiry, convo_invite / convo_floor / convo_end, salient,
     intent_fired, needs, env, heartbeat, sleep_refile. Tier routing:
     T0 = cheap refills on unchanged context (directive_expiry, mild
     needs, quiet heartbeat, obvious gap), T1 = the cast model (all
     decisions/speech/intents/recovery), T2 = reflect offer only.
     Rate caps: min spacing 0.25 sim-h per main EXCEPT inside convos
     (floor pass ~0.04 sim-h); max 10 calls/sim-h hard stop. Heartbeat
     floor ~3.5 waking sim-h. Sleepers queue event triggers for wake;
     only cueType:"time" intents + ONE mid-sleep refile fire in sleep.

   - Conversation channel (design §4.3): invited → participating →
     ended|dropped. Floor bookkeeping (yourTurn), '?'-line obligations,
     caps (16 utterances / 1.5 sim-h), asymmetric leave, per-party POV
     endSay memory writes, thinned overhear records.

   - Armed intentions (design §2.1 act.intent / §4.1): v.sfIntents[],
     cue-matched each brain tick — event cues on perceived `who`/
     place, time cues as alarms (the only intents that fire in sleep).

   - sfMindScan (design §4.2): the `mind` block — mood echo, concerns,
     surface (fired intentions, open loops, cue-matched recalls —
     intrinsic weight order, never curated), people models, lastTurn.

   - sfReflectArchive (design §4.4): ?reflect=1 raw material — top
     salient records since last reflect + open obligations + intents.
   ===================================================================== */

/* ---------------- dispatch ledger ---------------- */

const SF_MIN_SPACE_H  = 0.25;   // min sim-h between brain calls per main
const SF_MAX_CALLS_H  = 10;     // hard stop per sim-hour
const SF_HEARTBEAT_H  = 3.5;    // waking floor: ~1 pulse per 3–4 sim-h
const SF_CONVO_FLOOR_H = 0.04;  // ~2.4 sim-min per floor pass
const SF_DIR_EARLY_H  = 0.25;   // directive expiry lookahead
const SF_INVITE_TTL_H = 0.5;    // ~30 sim-min to answer an invitation
const SF_CONVO_MAX_UTT = 16;
const SF_CONVO_MAX_H   = 1.5;

function sfDispOf(v){
  if(!v.sfDisp)
    v.sfDisp = { pending: [], callsAt: [], lastCallAt: null,
                 sleepStart: null, sleepRefiled: false,
                 needsBand: false, envSig: -1, viewSet: [] };
  return v.sfDisp;
}

/* enqueue a trigger (deduped by kind); tier is the routing decision —
   the driver reads it to pick the model */
function sfDispatchTrig(v, kind, tier, detail){
  const d = sfDispOf(v);
  for(const p of d.pending) if(p.kind === kind) return;
  d.pending.push({ kind, tier, detail: detail || null,
                   at: sfAbsNow(), dispatchedAt: null });
}

/* a brain filing IS the call — record it, clear the served triggers */
function sfDispatchServed(v){
  const d = sfDispOf(v);
  const now = sfAbsNow();
  d.lastCallAt = now;
  d.callsAt.push(now);
  d.callsAt = d.callsAt.filter(t => now - t < 1);
  d.pending = [];
}

/* does the current moment carry anything a T0 shouldn't decide on? —
   fresh non-completed outcome, live convo, freshly fired intent, or
   needs already in the felt band */
function sfSurfaceBusy(v){
  const r = v.sfAgentResult;
  if(r && !r._disp && (r.status === 'failed' || r.status === 'interrupted'))
    return true;
  if(v.sfConvo && v.sfConvo.state !== 'ended' && v.sfConvo.state !== 'dropped')
    return true;
  const now = sfAbsNow();
  for(const it of (v.sfIntents || []))
    if(it.firedAt && now - it.firedAt < 0.5) return true;
  const b = v.body || {};
  if((b.satiety != null && b.satiety < 0.35) ||
     (b.hydration != null && b.hydration < 0.35) ||
     (b.fatigue != null && b.fatigue > 0.7)) return true;
  return false;
}

/* ---------------- per-main trigger scan (runs on the sim tick) ------ */
function sfDispatchTick(v, dtH){
  const d = sfDispOf(v);
  const now = sfAbsNow();
  const asleep = v.state === 'sleep';

  if(asleep){
    if(d.sleepStart == null){ d.sleepStart = now; d.sleepRefiled = false; }
    /* exactly one mid-sleep refile per night — the untilH≤6 bound makes
       a 7–9h sleep outlive its will; the refile is the honest fix */
    if(!d.sleepRefiled && now - d.sleepStart >= 2){
      d.sleepRefiled = true;
      sfDispatchTrig(v, 'sleep_refile', 'T0', null);
    }
    /* only cueType:"time" intents fire in sleep — the alarm clock */
    sfIntentScan(v, true);
    return;   // event triggers queue until wake — never wake a sleeper
  }
  d.sleepStart = null;

  /* 1 — order ended badly: interruption/failure forces a re-decide.
     A 'new_order' interruption is the brain's own filing superseding
     itself — it already knows; no re-dispatch. */
  const r = v.sfAgentResult;
  if(r && !r._disp && (r.status === 'failed' || r.status === 'interrupted')){
    r._disp = true;
    if(r.interruptedBy !== 'new_order')
      sfDispatchTrig(v, 'order_end', 'T1',
        { verb: r.verb, status: r.status,
          interruptedBy: r.interruptedBy || null, err: r.err || null });
  }
  if(r && !r._disp && r.status === 'completed' && !v.sfAgent &&
     !v.sfDirective) r._disp = true;   // quiet completion → gap covers it

  /* 2 — the intention gap: the will lapsed publicly */
  if(v.sfGap)
    sfDispatchTrig(v, 'gap', sfSurfaceBusy(v) ? 'T1' : 'T0', null);

  /* 3 — the will is about to lapse while it should keep running */
  if(v.sfDirective){
    const left = v.sfDirective.until - now;
    if(left > 0 && left <= SF_DIR_EARLY_H)
      sfDispatchTrig(v, 'directive_expiry', 'T0',
        { verb: v.sfDirective.verb, leftH: +left.toFixed(2) });
  }

  /* 4 — conversation channel: invite, floor pass, end/drop */
  const cv = v.sfConvo;
  if(cv){
    if(cv.state === 'invited')
      sfDispatchTrig(v, 'convo_invite', 'T1', { from: cv.partner });
    else if(cv.state === 'participating' && cv.yourTurn &&
            (d.lastCallAt == null || now - d.lastCallAt >= SF_CONVO_FLOOR_H))
      sfDispatchTrig(v, 'convo_floor', 'T1', { with: cv.partner });
  }

  /* 5 — salient perception: a bonded main or armed-intent `who` entering
     view, or someone collapsing in view */
  const seen = [];
  for(const o of VILLAGERS){
    if(o === v || !o._castId || !sfIsMain(o)) continue;
    if(sfPerceived(v, o)) seen.push(o._castId);
  }
  for(const cid of seen){
    if(d.viewSet.indexOf(cid) >= 0) continue;
    const o = sfPawnOf(cid);
    const bond = (v.bonds && o && v.bonds[o.name]) || 0;
    const isIntentWho = (v.sfIntents || []).some(it =>
      !it.firedAt && it.cueType !== 'time' && it.who &&
      (it.who === cid || (o && it.who === o.name)));
    if(bond >= 0.4 || isIntentWho)
      sfDispatchTrig(v, 'salient', 'T1',
        { kind: 'arrival', who: cid });
  }
  d.viewSet = seen;
  for(const o of VILLAGERS){
    if(o === v || o.dead) continue;
    if(o.state === 'downed' && sfPerceived(v, o)){
      sfDispatchTrig(v, 'salient', 'T1',
        { kind: 'collapse', who: o._castId || o.name });
      break;
    }
  }

  /* 6 — armed intentions firing (event + time cues while awake) */
  sfIntentScan(v, false);

  /* 7 — needs crossing the felt band (mild → T0, severe → T1) */
  const b = v.body || {};
  const inBand = (b.satiety != null && b.satiety < 0.35) ||
                 (b.hydration != null && b.hydration < 0.35) ||
                 (b.fatigue != null && b.fatigue > 0.7);
  const severe = (b.satiety != null && b.satiety < 0.15) ||
                 (b.hydration != null && b.hydration < 0.15) ||
                 (b.fatigue != null && b.fatigue > 0.9);
  if(inBand && !d.needsBand)
    sfDispatchTrig(v, 'needs', severe ? 'T1' : 'T0',
      { satiety: +(b.satiety || 0).toFixed(2),
        hydration: +(b.hydration || 0).toFixed(2),
        fatigue: +(b.fatigue || 0).toFixed(2) });
  if(!inBand) d.needsBand = false;
  else d.needsBand = true;

  /* environment is a TRIGGER CLASS, never a behavior: weather/crowd
     transitions surface salience — the brain decides what to do */
  const envSig = (W.rain > 0.15 ? 1 : 0) | (W.storm > 0.2 ? 2 : 0);
  if(d.envSig >= 0 && envSig !== d.envSig)
    sfDispatchTrig(v, 'env', 'T1',
      { rain: +(W.rain || 0).toFixed(2), storm: +(W.storm || 0).toFixed(2) });
  d.envSig = envSig;

  /* 9 — heartbeat floor: ~1 pulse per 3–4 waking sim-h. Honest: the
     brain refiles the will or files a real why/do — never fake-busy */
  if(d.lastCallAt == null || now - d.lastCallAt >= SF_HEARTBEAT_H)
    sfDispatchTrig(v, 'heartbeat', sfSurfaceBusy(v) ? 'T1' : 'T0', null);
}

/* the driver-facing dispatch surface: per main, the next due trigger
   (rate-capped), the queued kinds, and why a pending head is blocked */
function sfDispatchPoll(){
  const out = { now: +sfAbsNow().toFixed(3), tod: +W.tod.toFixed(2),
                day: W.day, per: {} };
  for(const v of VILLAGERS){
    if(!sfIsMain(v)) continue;
    const cid = v._castId || v.name;
    const d = sfDispOf(v);
    const now = sfAbsNow();
    d.callsAt = d.callsAt.filter(t => now - t < 1);
    const inConvo = !!(v.sfConvo && v.sfConvo.state !== 'ended' &&
                       v.sfConvo.state !== 'dropped');
    const minSpace = inConvo ? SF_CONVO_FLOOR_H : SF_MIN_SPACE_H;
    const spacingOk = d.lastCallAt == null || (now - d.lastCallAt) >= minSpace;
    const capOk = d.callsAt.length < SF_MAX_CALLS_H;
    let due = null, blocked = null;
    for(const p of d.pending){
      /* already dispatched and the brain hasn't answered — re-surface
         after ~0.75 sim-h (dead-brain recovery) */
      if(p.dispatchedAt != null && now - p.dispatchedAt < 0.75) continue;
      if(!spacingOk){ blocked = 'spacing'; break; }
      if(!capOk){ blocked = 'cap'; break; }
      p.dispatchedAt = now;
      due = { kind: p.kind, tier: p.tier, detail: p.detail, at: p.at };
      break;
    }
    out.per[cid] = { due, queued: d.pending.map(p => p.kind),
                     blocked,
                     lastCallAgoH: d.lastCallAt == null ? null
                       : +(now - d.lastCallAt).toFixed(2),
                     callsLastH: d.callsAt.length,
                     asleep: v.state === 'sleep', gap: !!v.sfGap };
  }
  return out;
}

/* ---------------- the conversation channel (design §4.3) ------------ */

const SF_CONVOS = {};
let SF_CONVO_N = 0;

function sfConvoGet(v){
  if(!v.sfConvo) return null;
  return SF_CONVOS[v.sfConvo.id] || null;
}

/* talk contact opens the channel: speaker participates with the floor
   passed; the target is invited (their say/talk accepts, leave declines,
   silence drops it in ~0.5 sim-h) */
function sfConvoOpen(v, t, openerText){
  /* one convo per pawn — a fresh opener ends a stale one honestly */
  if(v.sfConvo) sfConvoLeave(v, 'superseded');
  if(t.sfConvo) sfConvoLeave(t, 'superseded');
  const id = 'cv-' + W.day + '-' + (++SF_CONVO_N);
  const aId = v._castId || v.name, bId = t._castId || t.name;
  const cv = { id, a: aId, b: bId, since: sfAbsNow(), sinceDay: W.day,
               tail: [{ who: aId, text: String(openerText).slice(0, 90),
                        at: sfAbsNow() }],
               obligations: [], utt: 1, turns: 1, endedHow: null };
  SF_CONVOS[id] = cv;
  v.sfConvo = { id, partner: bId, state: 'participating',
                yourTurn: false, since: cv.since };
  t.sfConvo = { id, partner: aId, state: 'invited',
                yourTurn: true, since: cv.since };
  if(/\?\s*$/.test(String(openerText).trim()))
    cv.obligations.push({ from: aId, to: bId,
      gist: String(openerText).trim().slice(-70), at: sfAbsNow(),
      satisfied: false });
  return cv;
}

/* a `say` filing: the utterance lands — bubble, tail, floor pass,
   obligation bookkeeping, overhear thinning */
function sfConvoSay(v, text){
  const mine = v.sfConvo, cv = sfConvoGet(v);
  if(!mine || !cv) return false;
  const cid = v._castId || v.name;
  if(mine.state === 'invited') mine.state = 'participating';
  const partner = sfPawnOf(mine.partner);
  const partnerSlot = partner && partner.sfConvo &&
                      partner.sfConvo.id === cv.id ? partner : null;

  cv.tail.push({ who: cid, text: String(text).slice(0, 90), at: sfAbsNow() });
  if(cv.tail.length > 12) cv.tail = cv.tail.slice(-12);
  cv.utt++; cv.turns++;
  /* the floor passes on every utterance */
  mine.yourTurn = false;
  if(partnerSlot) partnerSlot.sfConvo.yourTurn = true;
  /* a '?' opens an obligation on the partner */
  if(/\?\s*$/.test(String(text).trim()))
    cv.obligations.push({ from: cid, to: mine.partner,
      gist: String(text).trim().slice(-70), at: sfAbsNow(),
      satisfied: false });
  /* speaking settles obligations the partner put on me */
  for(const ob of cv.obligations)
    if(ob.to === cid && !ob.satisfied) ob.satisfied = true;

  sfSay(v, text);
  if(typeof observe === 'function'){
    observe(v, 'I said to ' + (partner ? partner.name : mine.partner) +
      ': "' + String(text).slice(0, 70) + '"',
      { kind: 'convo', topic: 'convo_' + cv.id, source: 'direct',
        confidence: 0.95, salience: 0.6, bypassAttention: true });
    if(partner)
      observe(partner, (v.name || cid) + ' said: "' +
        String(text).slice(0, 70) + '"',
        { kind: 'convo', topic: 'convo_' + cv.id, source: 'direct',
          confidence: 0.9, salience: 0.65, bypassAttention: true });
    /* overhearers in earshot get the thinned version — presence, not
       transcript */
    for(const o of VILLAGERS){
      if(o === v || o === partner || !o._castId) continue;
      if(sfPerceived(v, o) && Math.hypot(v.x - o.x, v.y - o.y) <= CS * 5)
        observe(o, 'heard ' + (v.name || cid) + ' and ' +
          (partner ? partner.name : mine.partner) + ' talking',
          { kind: 'convo', topic: 'overheard_' + cv.id, source: 'direct',
            confidence: 0.5, salience: 0.25 });
    }
  }
  /* the floor pass is itself a dispatch trigger on the partner */
  if(partnerSlot && typeof sfDispatchTrig === 'function')
    sfDispatchTrig(partner, 'convo_floor', 'T1', { with: cid });
  /* caps: ≤16 utterances or ~1.5 sim-h — then it ends, cleanly */
  if(cv.utt >= SF_CONVO_MAX_UTT || sfAbsNow() - cv.since >= SF_CONVO_MAX_H)
    sfConvoEnd(cv, 'cap');
  return true;
}

/* a served brain turn while holding the floor but not saying anything:
   the pause IS the reply — the floor still passes, and a `do` beat
   rides the tail so the partner sees the gesture */
function sfConvoPass(v, doText){
  const mine = v.sfConvo, cv = sfConvoGet(v);
  if(!mine || !cv) return;
  const cid = v._castId || v.name;
  const partner = sfPawnOf(mine.partner);
  mine.yourTurn = false;
  if(partner && partner.sfConvo && partner.sfConvo.id === cv.id)
    partner.sfConvo.yourTurn = true;
  cv.turns++;
  if(doText)
    cv.tail.push({ who: cid, do: String(doText).slice(0, 60),
                   at: sfAbsNow() });
}

/* asymmetric leave — always allowed, by either party, from any state */
function sfConvoLeave(v, how){
  const mine = v.sfConvo, cv = sfConvoGet(v);
  if(!mine) return null;
  if(cv) sfConvoEnd(cv, how || 'left');
  else v.sfConvo = null;   // dangling slot — record already gone
  return cv ? cv.id : mine.id;
}

/* shared convo teardown: both parties get lastConvo + open obligations
   carry into mind.surface urges; a partner's live talk order reports
   'convo_ended' */
function sfConvoEnd(cv, how){
  if(!cv || cv.endedHow) return;
  cv.endedHow = how;
  const now = sfAbsNow();
  for(const pid of [cv.a, cv.b]){
    const p = sfPawnOf(pid);
    if(!p) continue;
    p.sfConvo = null;
    p.sfLastConvo = { with: pid === cv.a ? cv.b : cv.a,
                     turns: cv.turns, endedHow: how, at: now };
    /* unsatisfied obligations owed TO me become open loops */
    p.sfObligations = (p.sfObligations || []).concat(
      cv.obligations.filter(ob => ob.to === pid && !ob.satisfied)
        .map(ob => ({ from: ob.from, gist: ob.gist, at: ob.at,
                      satisfied: false })));
    p.sfObligations = (p.sfObligations || []).slice(-6);
    if(p.sfAgent && !p.sfAgent.done &&
       (p.sfAgent.verb === 'talk' || p.sfAgent.verb === 'say')){
      /* the parked order is interrupted, not silently completed — tag
         it so the natural end-write reports the same interruption */
      p.sfAgent.done = true;
      p.sfAgent.interrupted =
        how === 'no_answer' ? 'no_answer' : 'convo_ended';
      p.sfAgentResult = { verb: p.sfAgent.verb, status: 'interrupted',
        interruptedBy: p.sfAgent.interrupted,
        seq: p.sfAgent.seq, at: W.tod, day: W.day };
    }
    if(typeof sfDispatchTrig === 'function')
      sfDispatchTrig(p, 'convo_end', 'T1', { with: p.sfLastConvo.with,
                                             how });
  }
  delete SF_CONVOS[cv.id];
}

/* per-tick convo maintenance: invited expiry, proximity gate, caps */
function sfConvoTick(v, dtH){
  const mine = v.sfConvo;
  if(!mine) return;
  const cv = sfConvoGet(v);
  if(!cv){ v.sfConvo = null; return; }
  const now = sfAbsNow();
  if(mine.state === 'invited' && now - mine.since > SF_INVITE_TTL_H){
    sfConvoEnd(cv, 'no_answer');   // inviter's order interrupts no_answer
    return;
  }
  const partner = sfPawnOf(mine.partner);
  if(!partner || partner.dead || partner.state === 'downed'){
    sfConvoEnd(cv, 'dropped'); return;
  }
  if(mine.state === 'participating' || mine.state === 'invited'){
    /* proximity gates the channel — a partner who walks off ends it,
       after a short grace so a doorway shuffle doesn't kill it */
    const near = sfSameSpace(v, partner) &&
                 Math.hypot(v.x - partner.x, v.y - partner.y) <= CS * 10;
    mine.apartH = near ? 0 : (mine.apartH || 0) + dtH;
    if(mine.apartH > 0.15){ sfConvoEnd(cv, 'dropped'); return; }
  }
}

/* the state-facing convo view (design §4.3 shape) */
function sfConvoState(v){
  const mine = v.sfConvo, cv = sfConvoGet(v);
  if(!mine || !cv) return null;
  const cid = v._castId || v.name;
  return {
    id: cv.id, state: mine.state,
    partner: mine.partner,
    yourTurn: !!mine.yourTurn,
    tail: cv.tail.slice(-4).map(e =>
      e.who + ': ' + (e.text ? '"' + e.text + '"' : '(' + e.do + ')')),
    obligations: cv.obligations.filter(ob => ob.to === cid && !ob.satisfied)
      .map(ob => ob.gist),
    since: 'd' + cv.sinceDay + ' t' + (cv.since % 24).toFixed(1),
    turns: cv.turns };
}

/* ---------------- armed intentions (design §2.1 intent / §4.1) ------ */

function sfIntentArm(v, spec){
  v.sfIntents = v.sfIntents || [];
  if(v.sfIntents.length >= 8) v.sfIntents.shift();
  let when = null;
  if(typeof spec.when === 'number') when = spec.when;
  else if(typeof spec.when === 'string'){
    const m = spec.when.trim().match(/^(\d{1,2})(?::(\d{2}))?/);
    if(m) when = (+m[1]) + (m[2] ? (+m[2]) / 60 : 0);
  }
  const it = { id: 'i' + Math.floor(sfAbsNow() * 100) + '-' +
                   (v.sfIntents.length + 1),
    deed: String(spec.deed || '').slice(0, 90),
    condition: String(spec.condition || '').slice(0, 90),
    cueType: spec.cueType === 'time' ? 'time' : 'event',
    when, who: spec.who || null,
    armedAt: sfAbsNow(), armedDay: W.day, firedAt: null };
  v.sfIntents.push(it);
  return it.id;
}

/* cue-match armed intentions. timeOnly=true while asleep (alarms only);
   event cues need the target in the perceptual field. Returns the
   intents that fired this scan. */
function sfIntentScan(v, timeOnly){
  const now = sfAbsNow();
  const fired = [];
  for(const it of (v.sfIntents || [])){
    if(it.firedAt != null) continue;
    if(it.cueType === 'time'){
      if(it.when != null && W.tod >= it.when && W.tod < it.when + 0.5){
        it.firedAt = now; fired.push(it);
      }
      continue;
    }
    if(timeOnly) continue;   // event cues queue until wake
    if(it.who){
      const t = sfPawnOf(it.who);
      if(t && sfPerceived(v, t)){ it.firedAt = now; fired.push(it); }
      continue;
    }
    /* no anchor — a place-named condition fires on arrival at a venue
       whose name appears in the condition text */
    if(it.condition && v.inside){
      const nm = String(v.inside).toLowerCase();
      const cond = String(it.condition).toLowerCase();
      if(nm.split(/\s+/).some(w => w.length > 3 && cond.includes(w))){
        it.firedAt = now; fired.push(it);
      }
    }
  }
  if(fired.length && typeof sfDispatchTrig === 'function')
    sfDispatchTrig(v, 'intent_fired', 'T1',
      { deeds: fired.map(i => i.deed) });
  return fired;
}

/* ---------------- the mind surface (design §4.2) ------------------- */

function sfMindScan(v){
  const now = sfAbsNow();
  const cid = v._castId || v.name;
  const surface = [];

  /* fired intentions — prospective memory surfacing, freshest first */
  for(const it of (v.sfIntents || []))
    if(it.firedAt != null && now - it.firedAt < 1.0)
      surface.push({ kind: 'fired_intention', deed: it.deed,
                     condition: it.condition, w: 0.9 });

  /* open loops — unanswered obligations carried out of convos */
  for(const ob of (v.sfObligations || []))
    if(!ob.satisfied && now - ob.at < 24)
      surface.push({ kind: 'urge', about: ob.gist, who: ob.from,
                     w: 0.7 });

  /* stale armed intents nag — armed >6 sim-h ago, never fired */
  for(const it of (v.sfIntents || []))
    if(it.firedAt == null && now - it.armedAt > 6)
      surface.push({ kind: 'urge', about: it.deed,
                     condition: it.condition, w: 0.5 });

  /* recalls — recent-salient epistemic records cue-matched to what's
     actually around: a nearby name/id in the record, or this place */
  const nearNames = new Set();
  for(const o of VILLAGERS){
    if(o === v || !o._castId) continue;
    if(sfPerceived(v, o)){ nearNames.add(o._castId);
      if(o.name) nearNames.add(o.name); }
  }
  if(v.epistemic && v.epistemic.memories){
    const dayNow = W.day + W.tod / 24;
    const hits = [];
    for(const m of v.epistemic.memories){
      if(m.superseded) continue;
      if(dayNow - (m.when || 0) > 2) continue;
      const hay = (String(m.topic || '') + ' ' +
                   (typeof m.content === 'string' ? m.content : '') + ' ' +
                   String(m.who || '')).toLowerCase();
      let cue = null;
      for(const nm of nearNames)
        if(hay.includes(String(nm).toLowerCase())){ cue = nm; break; }
      if(!cue && v.inside && hay.includes(String(v.inside).toLowerCase()))
        cue = v.inside;
      if(!cue) continue;
      hits.push({ kind: 'recall',
        gist: (typeof m.content === 'string' ? m.content : m.topic)
              .slice(0, 80),
        about: m.topic, w: +(m.salience * (m.confidence || 0.5)).toFixed(3) });
    }
    hits.sort((a, b) => b.w - a.w);
    for(const h of hits.slice(0, 2)) surface.push(h);
  }

  /* intrinsic weight order, capped — never ranked for drama */
  surface.sort((a, b) => (b.w || 0) - (a.w || 0));
  const surf = surface.slice(0, 4).map(s => { delete s.w; return s; });

  /* nearby-person models — bonds + open obligations, nothing invented */
  const people = {};
  for(const o of VILLAGERS){
    if(o === v || !o._castId || !sfIsMain(o)) continue;
    if(!sfPerceived(v, o)) continue;
    const bond = (v.bonds && o.name && v.bonds[o.name]) || 0;
    const open = (v.sfObligations || [])
      .filter(ob => !ob.satisfied && (ob.from === o._castId || ob.from === o.name))
      .map(ob => ob.gist)[0] || null;
    people[o._castId] = {
      stance: bond >= 0.65 ? 'close' : bond >= 0.4 ? 'warm'
            : bond >= 0.15 ? 'easy' : bond > 0 ? 'familiar' : 'a stranger',
      open, vibe: +bond.toFixed(2) };
  }

  return {
    mood: v.sfMood ? { text: v.sfMood.text,
      since: 'd' + v.sfMood.day + ' t' + (v.sfMood.since % 24).toFixed(1) }
      : null,
    concerns: (v.sfConcerns || []).slice(0, 5),
    surface: surf,
    people,
    lastTurn: v.sfLastWhy || null,
    intentions: (v.sfIntents || [])
      .filter(i => i.firedAt == null)
      .map(i => ({ deed: i.deed, condition: i.condition,
                   cueType: i.cueType })) };
}

/* ---------------- reflection archive (design §4.4) ----------------- */

function sfReflectArchive(v){
  const nowDay = W.day + W.tod / 24;
  const sinceDay = (v.sfLastReflectAt != null)
    ? v.sfLastReflectAt / 24 : nowDay - 1;
  const records = [];
  if(v.epistemic && v.epistemic.memories){
    for(const m of v.epistemic.memories){
      if(m.superseded) continue;
      if((m.when || 0) < sinceDay) continue;
      records.push({ kind: m.kind, topic: m.topic,
        gist: (typeof m.content === 'string' ? m.content
              : JSON.stringify(m.content)).slice(0, 90),
        salience: m.salience, when: +(m.when || 0).toFixed(2) });
    }
    records.sort((a, b) => (b.salience || 0) - (a.salience || 0));
  }
  return {
    since: 'd' + Math.floor(sinceDay) + ' t' +
           ((sinceDay % 1) * 24).toFixed(1),
    records: records.slice(0, 6),
    obligations: (v.sfObligations || [])
      .filter(o => !o.satisfied)
      .map(o => ({ from: o.from, gist: o.gist })),
    intentions: (v.sfIntents || []).map(i => ({
      deed: i.deed, condition: i.condition,
      fired: i.firedAt != null })) };
}

/* ---------------- the brain tick ----------------------------------
   Runs on the sim tick (registered, never wrapped): per main, convo
   maintenance + dispatch trigger scan. Detection is code; every
   decision is the brain's. */
function sfBrainTick(dtH){
  if(typeof SF_MODE === 'undefined' || !SF_MODE) return;
  for(const v of VILLAGERS){
    if(!sfIsMain(v)) continue;
    sfConvoTick(v, dtH);
    sfDispatchTick(v, dtH);
  }
}
if(typeof registerSimTick === 'function') registerSimTick(sfBrainTick);

/* bridge surface for the driver + probes */
if(typeof window !== 'undefined'){
  window.__aiBridge = window.__aiBridge || {};
  window.__aiBridge.sfDispatchPoll = sfDispatchPoll;
  window.__aiBridge.sfMindScan = sfMindScan;
  window.__aiBridge.sfConvoState = sfConvoState;
  window.__aiBridge.sfReflectArchive = sfReflectArchive;
}
