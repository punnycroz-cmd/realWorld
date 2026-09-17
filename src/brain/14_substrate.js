/* =====================================================================
   src/brain/14_substrate.js — FeelingSubstrate Interface & Core Couplings
   Phase 6E Slice E1: S1 (Substrate Interface), A3 (Event->Signal Table),
   D1 (3 Decay Accumulators: hunger->stress, fear->fatigue, pain->patience).
   
   ADR-001 (Decision 1B): FeelingSubstrate is the mandatory single channel
   for cognitive feeling reads. Cognitive/AI code reads feel(v), getLayers(v),
   getFeelingScape(v) instead of poking raw body fields.
   
   ADR-002: Beta scope (Quota discipline — no state machine for 9 organs).
   ADAPT_D1-D4_DETAIL: Option 1 — keep C3 body state + explicit decay accumulators.
   ===================================================================== */
// Top-level declarations (shared script scope)

  // --- D1 Accumulator Constants (Explicit conditions, dt-scaled decay) ---
  const HUNGER_THRESHOLD = 0.35;        // Satiety below this triggers hunger stress
  const HUNGER_STRESS_RATE = 0.25;      // Inflow rate of hunger stress
  const HUNGER_STRESS_DECAY = 0.50;     // Hourly decay rate (~0.5/hour; ~0 in ~6h after eating)

  const FEAR_FATIGUE_BOOST_RATE = 0.15; // Extra fatigue rate per unit of fear accumulator
  const FEAR_FATIGUE_DECAY = 0.215;     // Hourly decay: 0.215^3 ≈ 0.0099 <= 0.01 (active ~3h then expires)

  const PAIN_THRESHOLD = 0.15;          // Pain level above which patience is impaired
  const PAIN_PATIENCE_RATE = 0.80;      // Inflow rate of patience impairment
  const PAIN_PATIENCE_DECAY = 0.50;     // Hourly decay rate of pain patience impairment

  // Analytical dt-scaled integration:
  // da/dt = rate - k*a, where k = -ln(decayRate).
  // a(t + dt) = a(t) * decayRate^dt + rate * (1 - decayRate^dt) / (-ln(decayRate))
  // Guarantees EXACT tick-size independence and absolute determinism.
  function decayIntegrate(acc, decayRate, rate, dtH){
    if(dtH <= 0) return acc;
    const decayFactor = Math.pow(decayRate, dtH);
    if(decayRate >= 0.999999 || decayRate <= 0){
      return (acc * decayFactor) + (rate * dtH);
    }
    const effectiveDt = (1.0 - decayFactor) / (-Math.log(decayRate));
    return (acc * decayFactor) + (rate * effectiveDt);
  }

  // --- A3: Canonical World-Event -> Normalized Signal Table ---
  // Every world event passes through this single mapping before entering the substrate.
  // Examiner Tier-3 auditable: explicit causal arrows from events to standardized signals.
  const WORLD_EVENT_SIGNAL_TABLE = {
    // Fire / Wildfire
    fire:              { signalKind: 'threat_fire',    baseIntensity: 0.80, domain: 'danger',      affect: 'fear' },
    wildfire:          { signalKind: 'threat_fire',    baseIntensity: 0.90, domain: 'danger',      affect: 'fear' },
    lightning:         { signalKind: 'threat_storm',   baseIntensity: 0.60, domain: 'danger',      affect: 'fear' },
    // Beasts / Wildlife
    wolf:              { signalKind: 'threat_wolf',    baseIntensity: 0.90, domain: 'danger',      affect: 'fear' },
    bear:              { signalKind: 'threat_bear',    baseIntensity: 1.00, domain: 'danger',      affect: 'fear' },
    hunt:              { signalKind: 'action_hunt',    baseIntensity: 0.50, domain: 'activity',    affect: 'vigilant' },
    // Weather / Environment
    storm:             { signalKind: 'hazard_storm',   baseIntensity: 0.60, domain: 'environment', affect: 'stress' },
    cold_snap:         { signalKind: 'hazard_cold',    baseIntensity: 0.70, domain: 'environment', affect: 'stress' },
    // Mortality & Life
    death:             { signalKind: 'grief_death',    baseIntensity: 1.00, domain: 'social',      affect: 'sorrow' },
    birth:             { signalKind: 'joy_birth',      baseIntensity: 0.80, domain: 'social',      affect: 'content' },
    marriage:          { signalKind: 'joy_bond',       baseIntensity: 0.75, domain: 'social',      affect: 'content' },
    // Social friction & Gossip
    gossip:            { signalKind: 'friction_gossip',baseIntensity: 0.45, domain: 'social',      affect: 'distrust' },
    insult:            { signalKind: 'friction_insult',baseIntensity: 0.50, domain: 'social',      affect: 'anger' },
    fight:             { signalKind: 'threat_brawl',   baseIntensity: 0.70, domain: 'danger',      affect: 'fear' },
    rivalry:           { signalKind: 'friction_rival', baseIntensity: 0.60, domain: 'social',      affect: 'anger' },
    // Economy & Ownership
    price_shock:       { signalKind: 'shock_price',    baseIntensity: 0.50, domain: 'economic',    affect: 'stress' },
    theft:             { signalKind: 'violation_theft',baseIntensity: 0.70, domain: 'social',      affect: 'anger' },
    dispute:           { signalKind: 'friction_dispute',baseIntensity: 0.55,domain: 'social',      affect: 'stress' },
    // Somatic / Crisis
    fear_event:        { signalKind: 'fear',           baseIntensity: 1.00, domain: 'danger',      affect: 'fear' },
    downed:            { signalKind: 'crisis_downed',  baseIntensity: 0.95, domain: 'somatic',     affect: 'suffering' },
    injury:            { signalKind: 'pain_injury',    baseIntensity: 0.80, domain: 'somatic',     affect: 'pain' },
    starvation:        { signalKind: 'hunger_starving',baseIntensity: 0.85, domain: 'somatic',     affect: 'hunger' },
    scream:            { signalKind: 'acoustic_scream',baseIntensity: 0.70, domain: 'acoustic',    affect: 'fear' }
  };

  // Standardize any world event into { kind, intensity, source, tick, metadata }
  function normalizeEventToSignal(rawEvent, tick, params){
    let rawKind = 'unknown';
    let source = 'world';
    let intensity = null;
    let meta = {};

    if(typeof rawEvent === 'string'){
      rawKind = rawEvent.toLowerCase();
      if(params && typeof params === 'object'){
        source = params.source || source;
        intensity = params.intensity != null ? params.intensity : null;
        meta = params;
      }
    } else if(rawEvent && typeof rawEvent === 'object'){
      rawKind = (rawEvent.kind || rawEvent.type || 'unknown').toLowerCase();
      source = rawEvent.source || rawEvent.by || rawEvent.from || source;
      intensity = rawEvent.intensity != null ? rawEvent.intensity : null;
      meta = rawEvent;
    }

    // Match against canonical table or derive fallback
    const entry = WORLD_EVENT_SIGNAL_TABLE[rawKind] || {
      signalKind: 'event_' + rawKind,
      baseIntensity: 0.40,
      domain: 'general',
      affect: 'neutral'
    };

    const finalIntensity = +(clamp(intensity != null ? intensity : entry.baseIntensity, 0.0, 1.0).toFixed(3));
    const currentTick = tick != null ? tick : (typeof W !== 'undefined' && W.day != null ? +(W.day * 24 + (W.tod || 0)).toFixed(2) : 0);

    return {
      kind: entry.signalKind,
      intensity: finalIntensity,
      source: source,
      tick: currentTick,
      domain: entry.domain,
      affect: entry.affect,
      rawKind: rawKind,
      metadata: meta
    };
  }

  // --- S1: FeelingSubstrate Interface & Engine ---
  const FeelingSubstrate = {
    SIGNAL_TABLE: WORLD_EVENT_SIGNAL_TABLE,

    // Normalize any world event into standardized signal
    normalizeEvent: function(rawEvent, tick, params){
      return normalizeEventToSignal(rawEvent, tick, params);
    },

    // Ensure all 3 D1 accumulators exist on villager
    ensureSubstrate: function(v){
      if(!v) return;
      if(v.hungerStressAcc == null) v.hungerStressAcc = 0.0;
      if(v.fearFatigueAcc == null) v.fearFatigueAcc = 0.0;
      if(v.painPatienceAcc == null) v.painPatienceAcc = 0.0;
      if(!v._recentSignals) v._recentSignals = [];
    },

    // Ingest normalized signal into villager substrate
    receiveSignal: function(v, rawSignal){
      if(!v) return null;
      this.ensureSubstrate(v);
      const signal = (rawSignal && rawSignal.kind && rawSignal.intensity != null && rawSignal.tick != null)
        ? rawSignal
        : normalizeEventToSignal(rawSignal);

      // Explicit causal routing into D1 accumulators & substrate:
      if(signal.affect === 'fear' || signal.kind === 'fear' || signal.domain === 'danger'){
        // Fear event -> boosts fearFatigueAcc
        v.fearFatigueAcc = clamp((v.fearFatigueAcc || 0) + signal.intensity, 0.0, 1.0);
      } else if(signal.affect === 'hunger' || signal.kind === 'hunger_starving'){
        // Acute hunger signal -> boosts hungerStressAcc
        v.hungerStressAcc = clamp((v.hungerStressAcc || 0) + signal.intensity * 0.4, 0.0, 1.0);
      } else if(signal.affect === 'pain' || signal.kind === 'pain_injury'){
        // Acute pain signal -> boosts painPatienceAcc
        v.painPatienceAcc = clamp((v.painPatienceAcc || 0) + signal.intensity * 0.5, 0.0, 1.0);
      } else if(signal.affect === 'suffering' || signal.kind === 'crisis_downed'){
        // Downed crisis -> severe somatic crisis: boosts pain/patience and shock/fear exhaustion
        v.painPatienceAcc = clamp((v.painPatienceAcc || 0) + signal.intensity * 0.8, 0.0, 1.0);
        v.fearFatigueAcc = clamp((v.fearFatigueAcc || 0) + signal.intensity * 0.6, 0.0, 1.0);
      } else if(signal.affect === 'sorrow' || signal.kind === 'grief_death'){
        // Death / grief -> shock & emotional exhaustion
        v.fearFatigueAcc = clamp((v.fearFatigueAcc || 0) + signal.intensity * 0.5, 0.0, 1.0);
        v.hungerStressAcc = clamp((v.hungerStressAcc || 0) + signal.intensity * 0.2, 0.0, 1.0);
      } else if(signal.affect === 'distrust' || signal.kind === 'friction_gossip'){
        // Social friction/gossip -> impairs social patience
        v.painPatienceAcc = clamp((v.painPatienceAcc || 0) + signal.intensity * 0.3, 0.0, 1.0);
      } else if(signal.affect === 'content' || signal.kind === 'joy_birth' || signal.kind === 'joy_bond'){
        // Joy / milestones -> relieves acute fear hangover
        v.fearFatigueAcc = clamp((v.fearFatigueAcc || 0) - signal.intensity * 0.4, 0.0, 1.0);
      }

      // Record in recent signals ring buffer for auditing / getLayers
      v._recentSignals.push(signal);
      if(v._recentSignals.length > 8) v._recentSignals.shift();

      return signal;
    },

    // Compute total pain from body without brain code poking raw fields
    getPain: function(v){
      if(!v) return 0.0;
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v.body || {});
      let pain = (b.injury || 0) * 0.5;
      if(b.wounds && b.wounds.length){
        for(let i = 0; i < b.wounds.length; i++){
          const w = b.wounds[i];
          pain += (w.sev || 0) * (w.dressed ? 0.4 : 1.0);
        }
      }
      return +pain.toFixed(3);
    },

    // Coupling 3: Social Patience getter (0..1)
    getPatience: function(v){
      if(!v) return 1.0;
      this.ensureSubstrate(v);
      return +clamp(1.0 - (v.painPatienceAcc || 0), 0.0, 1.0).toFixed(3);
    },

    // Getter for 3 D1 accumulators
    getAccumulators: function(v){
      this.ensureSubstrate(v);
      return {
        hungerStress: +v.hungerStressAcc.toFixed(4),
        fearFatigue: +v.fearFatigueAcc.toFixed(4),
        painPatience: +v.painPatienceAcc.toFixed(4)
      };
    },

    // Per-tick update: runs dt-scaled decay & cross-couplings
    update: function(v, dtH){
      if(!v || v.dead) return;
      this.ensureSubstrate(v);
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v.body || {});
      const dt = dtH != null ? dtH : 0.5;

      // 1. Coupling 1: hunger↑ -> stress↑ (hungerStressAcc)
      // Condition: satiety < 0.35 produces hunger stress; eating full decays it to ~0.
      const satiety = b.satiety != null ? b.satiety : 1.0;
      let hungerRate = 0.0;
      if(satiety < HUNGER_THRESHOLD){
        hungerRate = ((HUNGER_THRESHOLD - satiety) / HUNGER_THRESHOLD) * HUNGER_STRESS_RATE;
      }
      v.hungerStressAcc = decayIntegrate(v.hungerStressAcc, HUNGER_STRESS_DECAY, hungerRate, dt);
      if(v.hungerStressAcc < 0.005) v.hungerStressAcc = 0.0;
      v.hungerStressAcc = clamp(v.hungerStressAcc, 0.0, 1.0);

      // Hunger stress adds to body stress
      if(v.hungerStressAcc > 0 && b.stress != null){
        b.stress = clamp(b.stress + v.hungerStressAcc * 0.15 * dt, 0.0, 1.0);
        v.mood = clamp(1.0 - b.stress * 0.85, 0.05, 1.0);
      }

      // 2. Coupling 2: fear↑↑ -> exhaustion (fearFatigueAcc)
      // After fear event, fatigue rate is boosted for ~3 hours, then decays to ~0.
      if(v.fearFatigueAcc > 0){
        const extraFatigueRate = v.fearFatigueAcc * FEAR_FATIGUE_BOOST_RATE;
        b.fatigue = clamp((b.fatigue != null ? b.fatigue : 0) + extraFatigueRate * dt, 0.0, 1.0);
        v.energy = clamp(1.0 - b.fatigue, 0.0, 1.0);

        v.fearFatigueAcc = decayIntegrate(v.fearFatigueAcc, FEAR_FATIGUE_DECAY, 0.0, dt);
        if(v.fearFatigueAcc <= 0.01){
          v.fearFatigueAcc = 0.0;
        }
      }

      // 3. Coupling 3: pain↑ -> patience↓ (painPatienceAcc)
      // Condition: pain > 0.15 produces patience impairment; healing decays it.
      const pain = this.getPain(v);
      let painRate = 0.0;
      if(pain > PAIN_THRESHOLD){
        painRate = (pain - PAIN_THRESHOLD) * PAIN_PATIENCE_RATE;
      }
      v.painPatienceAcc = decayIntegrate(v.painPatienceAcc, PAIN_PATIENCE_DECAY, painRate, dt);
      if(v.painPatienceAcc < 0.005) v.painPatienceAcc = 0.0;
      v.painPatienceAcc = clamp(v.painPatienceAcc, 0.0, 1.0);
    },

    // Contract Method 1: feel(v) -> holistic feeling state
    feel: function(v){
      if(!v) return null;
      this.ensureSubstrate(v);
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v.body || {});
      const acc = this.getAccumulators(v);
      const pain = this.getPain(v);
      const patience = this.getPatience(v);
      const emotions = v.emotions ? v.emotions.slice() : [];

      return {
        // Biological sensations delegated to C3
        satiety: b.satiety != null ? +b.satiety.toFixed(2) : 1.0,
        hydration: b.hydration != null ? +b.hydration.toFixed(2) : 1.0,
        fatigue: b.fatigue != null ? +b.fatigue.toFixed(2) : 0.0,
        energy: v.energy != null ? +v.energy.toFixed(2) : 1.0,
        pain: pain,
        stress: b.stress != null ? +b.stress.toFixed(2) : 0.0,
        mood: v.mood != null ? +v.mood.toFixed(2) : 1.0,
        // D1 Couplings
        hungerStress: acc.hungerStress,
        fearFatigue: acc.fearFatigue,
        painPatience: acc.painPatience,
        patience: patience,
        // C3 Emotions list
        emotions: emotions,
        // Scape view
        scape: this.getFeelingScape(v)
      };
    },

    // Contract Method 2: getLayers(v) -> breakdown of contributing layers
    getLayers: function(v){
      if(!v) return null;
      this.ensureSubstrate(v);
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v.body || {});
      const acc = this.getAccumulators(v);

      return {
        body: {
          satiety: b.satiety != null ? +b.satiety.toFixed(3) : 1.0,
          hydration: b.hydration != null ? +b.hydration.toFixed(3) : 1.0,
          fatigue: b.fatigue != null ? +b.fatigue.toFixed(3) : 0.0,
          injury: b.injury != null ? +b.injury.toFixed(3) : 0.0,
          blood: b.blood != null ? +b.blood.toFixed(3) : 1.0,
          wetness: b.wetness != null ? +b.wetness.toFixed(3) : 0.0,
          coreTemp: b.coreTemp != null ? +b.coreTemp.toFixed(1) : 37.0,
          stress: b.stress != null ? +b.stress.toFixed(3) : 0.0
        },
        couplings: {
          hungerStress: acc.hungerStress,
          fearFatigue: acc.fearFatigue,
          painPatience: acc.painPatience,
          patience: this.getPatience(v)
        },
        emotions: (v.emotions || []).map(function(e){ return { tag: e.tag, intensity: e.intensity }; }),
        recentSignals: (v._recentSignals || []).slice()
      };
    },

    // --- Slice E2: Core Feeling-Scape (12 Qualities) & D2 Vocabulary ---
    // Qualities: hollow, parched, heavy, burning, anxious, terrified, enraged, content, lonely, revered, confused, vigilant.
    // Quota quota cap: exactly 12 qualities, no more.
    getFeelingScape: function(v){
      if(!v) return { dominant: 'content', secondary: null, tone: 'neutral' };
      this.ensureSubstrate(v);
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v && v.body ? v.body : {});
      const acc = this.getAccumulators(v);
      const patience = this.getPatience(v);

      // 1. Conditions & Wounds extraction (D2 vocabulary-only reading conditions[])
      const conditions = [];
      if(v && Array.isArray(v.conditions)){
        for(let i = 0; i < v.conditions.length; i++) conditions.push(v.conditions[i]);
      }
      if(b && Array.isArray(b.conditions)){
        for(let i = 0; i < b.conditions.length; i++) conditions.push(b.conditions[i]);
      }
      if(b && Array.isArray(b.wounds)){
        for(let i = 0; i < b.wounds.length; i++) conditions.push(b.wounds[i]);
      }
      if(b && Array.isArray(b.illnesses)){
        for(let i = 0; i < b.illnesses.length; i++) conditions.push(b.illnesses[i]);
      }

      // Condition pattern matchers (N3: narrowed regex avoiding generic throat matches)
      let hasThroatBurn = false;
      let hasBurnCondition = false;
      let hasHeadTrauma = false;

      for(let i = 0; i < conditions.length; i++){
        const c = conditions[i];
        let isThroat = false;
        if(typeof c === 'string'){
          if(/throat.*burn|burn.*throat|throat.*scorch|scorch.*throat|throat_burn|burnt_throat|scorched_throat/i.test(c)){
            hasThroatBurn = true;
            isThroat = true;
          }
          if(!isThroat && /burn|scorch/i.test(c)) hasBurnCondition = true;
          if(/concussion|delirium|daze|head_trauma/i.test(c)) hasHeadTrauma = true;
        } else if(c && typeof c === 'object'){
          const id = String(c.id || c.name || c.type || c.kind || c.condition || '');
          const loc = String(c.loc || '');
          const desc = String(c.desc || c.description || '');
          if(/throat_burn|burnt_throat|scorched_throat/i.test(id) || ((/throat/i.test(id) || /throat/i.test(loc) || /throat/i.test(desc)) && (/burn|scorch/i.test(id) || /burn|scorch/i.test(desc) || c.type === 'burn')) || c.blocksAction === 'drink'){
            hasThroatBurn = true;
            isThroat = true;
          }
          if(!isThroat && (loc === 'burn' || (/burn|scorch/i.test(id) && !/throat/i.test(id)) || c.type === 'burn')) hasBurnCondition = true;
          if(loc === 'head' && (c.sev == null || c.sev > 0.3)) hasHeadTrauma = true;
          if(/concussion|delirium|daze/i.test(id)) hasHeadTrauma = true;
        }
      }

      // 2. Recent A3 Signals extraction (Acute window ~1.5h; persistent impact handled by D1 accumulators)
      let recentThreatFire = 0;
      let recentThreatDanger = 0;
      let recentSocialFriction = 0;
      let recentHuntVigilant = 0;
      let recentHazardStress = 0;
      let recentGriefDeath = 0;
      let recentCrisisDowned = 0;
      let recentSocialDistrust = 0;
      let recentJoyBond = 0;
      let recentJoyBirth = 0;
      const curTick = (typeof W !== 'undefined' && W.day != null)
        ? +(W.day * 24 + (W.tod || 0)).toFixed(2)
        : (v && v._tick != null ? v._tick : 0);

      if(v._recentSignals && v._recentSignals.length){
        for(let i = 0; i < v._recentSignals.length; i++){
          const s = v._recentSignals[i];
          if(curTick > 0 && s.tick != null && (curTick - s.tick) > 1.5){
            // Signal is past the acute 1.5h window; emotional hangover is now in D1 accumulators
            continue;
          }
          if(s.kind === 'threat_fire' || s.rawKind === 'fire' || s.rawKind === 'wildfire'){
            recentThreatFire = Math.max(recentThreatFire, s.intensity != null ? s.intensity : 0.85);
          }
          if(s.domain === 'danger' || s.affect === 'fear' || s.kind === 'threat_wolf' || s.kind === 'threat_bear' || s.kind === 'acoustic_scream'){
            recentThreatDanger = Math.max(recentThreatDanger, s.intensity != null ? s.intensity : 0.75);
          }
          if(s.domain === 'social' && (s.affect === 'anger' || s.kind === 'friction_insult' || s.kind === 'violation_theft' || s.kind === 'friction_dispute')){
            recentSocialFriction = Math.max(recentSocialFriction, s.intensity != null ? s.intensity : 0.55);
          }
          if(s.kind === 'action_hunt' || s.affect === 'vigilant'){
            recentHuntVigilant = Math.max(recentHuntVigilant, s.intensity != null ? s.intensity : 0.50);
          }
          if(s.affect === 'stress' || s.domain === 'environment' || s.domain === 'economic'){
            recentHazardStress = Math.max(recentHazardStress, (s.intensity != null ? s.intensity : 0.50) * 0.6);
          }
          if(s.kind === 'grief_death' || s.rawKind === 'death' || s.affect === 'sorrow'){
            recentGriefDeath = Math.max(recentGriefDeath, s.intensity != null ? s.intensity : 1.00);
          }
          if(s.kind === 'crisis_downed' || s.rawKind === 'downed' || s.affect === 'suffering'){
            recentCrisisDowned = Math.max(recentCrisisDowned, s.intensity != null ? s.intensity : 0.95);
          }
          if(s.kind === 'friction_gossip' || s.rawKind === 'gossip' || s.affect === 'distrust'){
            recentSocialDistrust = Math.max(recentSocialDistrust, s.intensity != null ? s.intensity : 0.45);
          }
          if(s.kind === 'joy_bond' || s.rawKind === 'marriage'){
            recentJoyBond = Math.max(recentJoyBond, s.intensity != null ? s.intensity : 0.75);
          }
          if(s.kind === 'joy_birth' || s.rawKind === 'birth'){
            recentJoyBirth = Math.max(recentJoyBirth, s.intensity != null ? s.intensity : 0.80);
          }
        }
      }

      if(v.downed){
        recentCrisisDowned = Math.max(recentCrisisDowned, 0.95);
      }

      // 3. Emotions extraction
      let emoFear = 0, emoAnger = 0, emoAnxious = 0, emoContent = 0, emoProud = 0, emoLonely = 0;
      if(v.emotions && v.emotions.length){
        for(let i = 0; i < v.emotions.length; i++){
          const e = v.emotions[i];
          const tag = e.tag || '';
          const intVal = e.intensity || 0;
          if(tag === 'fear' || tag === 'terror') emoFear = Math.max(emoFear, intVal);
          else if(tag === 'anger' || tag === 'enraged') emoAnger = Math.max(emoAnger, intVal);
          else if(tag === 'anxious') emoAnxious = Math.max(emoAnxious, intVal);
          else if(tag === 'content') emoContent = Math.max(emoContent, intVal);
          else if(tag === 'pride' || tag === 'tired-but-proud' || tag === 'honored') emoProud = Math.max(emoProud, intVal);
          else if(tag === 'lonely' || tag === 'isolated') emoLonely = Math.max(emoLonely, intVal);
        }
      }

      // 4. Raw activation levels for the 12 core qualities
      // Quality 1: parched (hydration deficit OR burnt throat condition)
      let rawParched = (b.hydration != null && b.hydration < 0.35) ? (0.35 - b.hydration) / 0.35 : 0.0;
      if(hasThroatBurn){
        // Differential requirement: villager with burnt throat drinks water -> still parched!
        rawParched = Math.max(rawParched, 0.85);
      }

      // Quality 2: hollow (satiety deficit or chronic hunger)
      let rawHollow = (b.satiety != null && b.satiety < 0.35) ? (0.35 - b.satiety) / 0.35 : 0.0;
      rawHollow = Math.max(rawHollow, (acc.hungerStress || 0) * 0.75);

      // Quality 3: heavy (physical fatigue, fear hangover, exhaustion, grief/sorrow, downed)
      let rawHeavy = (b.fatigue != null && b.fatigue > 0.55) ? (b.fatigue - 0.55) / 0.45 : 0.0;
      rawHeavy = Math.max(
        rawHeavy,
        (acc.fearFatigue || 0) * 0.75,
        (b.illness || 0) * 0.5,
        recentGriefDeath * 0.95,
        recentCrisisDowned * 0.95
      );

      // Quality 4: burning (fever, burn injuries, fire heat)
      let rawBurning = (b.fever || (b.coreTemp != null && b.coreTemp > 38.0)) ? clamp((b.coreTemp - 37.5) / 2.5, 0.2, 1.0) : 0.0;
      if(hasBurnCondition) rawBurning = Math.max(rawBurning, 0.85);
      if(recentThreatFire > 0) rawBurning = Math.max(rawBurning, recentThreatFire * 0.8);

      // Quality 5: terrified (fear accumulator, danger/fire signals, downed crisis, panic)
      let rawTerrified = Math.max(
        acc.fearFatigue || 0,
        recentThreatDanger,
        recentThreatFire,
        recentCrisisDowned * 0.90,
        emoFear,
        v.state === 'drown_panic' ? 1.0 : 0.0
      );

      // Quality 6: anxious (stress, hunger stress, threat anticipation, social gossip/distrust)
      let rawAnxious = (b.stress != null && b.stress > 0.35) ? (b.stress - 0.35) / 0.65 : 0.0;
      rawAnxious = Math.max(rawAnxious, acc.hungerStress || 0, emoAnxious, recentHazardStress, recentSocialDistrust * 0.70);

      // Quality 7: enraged (anger emotion, social friction, pain+impatience)
      let painImpatience = ((1.0 - patience) > 0.35 && (b.injury || 0) > 0.15) ? 0.65 : 0.0;
      let rawEnraged = Math.max(emoAnger, recentSocialFriction, painImpatience);

      // Quality 8: lonely (isolation, lack of social contact, grief/loss)
      let rawLonely = (v.chatT != null && v.chatT > 8.0) ? clamp((v.chatT - 8.0) / 12.0, 0.1, 1.0) : 0.0;
      rawLonely = Math.max(rawLonely, emoLonely, recentGriefDeath * 0.70);

      // Quality 9: vigilant (hunting, guard watch, post-fear lingering tension, social distrust)
      let isGuardingNight = (v.role === 'guard' && typeof W !== 'undefined' && W.tod != null && (W.tod >= 20 || W.tod < 6));
      let rawVigilant = (v.state === 'hunt' || recentHuntVigilant > 0 || isGuardingNight) ? 0.70 : 0.0;
      if(acc.fearFatigue > 0.05 && acc.fearFatigue <= 0.35){
        rawVigilant = Math.max(rawVigilant, 0.55);
      }
      if(recentSocialDistrust > 0){
        rawVigilant = Math.max(rawVigilant, recentSocialDistrust * 0.85);
      }

      // Quality 10: confused (fever delirium, extreme exhaustion microsleep, head trauma, downed crisis)
      let feverDelirium = (b.coreTemp != null && b.coreTemp >= 39.5) ? 0.90 : 0.0;
      let microsleepDelirium = (b.fatigue != null && b.fatigue >= 0.92) ? 0.85 : 0.0;
      let rawConfused = Math.max(feverDelirium, microsleepDelirium, hasHeadTrauma ? 0.80 : 0.0, recentCrisisDowned * 0.85);

      // Quality 11: revered (social pride, high reputation, elder/priest status, life milestones)
      let isHighStatus = ((v.reputation != null && v.reputation > 0.65) || v.role === 'elder' || v.role === 'priest');
      let recentLifeJoy = Math.max(recentJoyBond, recentJoyBirth);
      let rawRevered = Math.max(emoProud, isHighStatus ? 0.60 : 0.0, recentLifeJoy * 0.85);

      // Quality 12: content (baseline equilibrium, comfort, safety)
      let isEquilibrium = (b.satiety == null || b.satiety >= 0.50) &&
                          (b.hydration == null || b.hydration >= 0.50) &&
                          (b.fatigue == null || b.fatigue <= 0.45) &&
                          (b.stress == null || b.stress < 0.25) &&
                          (b.injury == null || b.injury < 0.15) &&
                          !hasThroatBurn && !hasBurnCondition &&
                          !v.downed &&
                          recentThreatFire === 0 && recentThreatDanger === 0 &&
                          recentGriefDeath === 0 && recentCrisisDowned === 0 &&
                          recentSocialDistrust === 0;
      let rawContent = isEquilibrium ? Math.max(0.55, emoContent, recentLifeJoy * 0.40) : emoContent * 0.35;

      // 5. Urgency Multipliers (Survival threats > high discomfort > cognitive/social > baseline)
      const candidates = [
        { quality: 'terrified', raw: rawTerrified, score: rawTerrified * 2.00 },
        { quality: 'burning',   raw: rawBurning,   score: rawBurning * 1.80 },
        { quality: 'parched',   raw: rawParched,   score: rawParched * 1.70 },
        { quality: 'hollow',    raw: rawHollow,    score: rawHollow * 1.60 },
        { quality: 'confused',  raw: rawConfused,  score: rawConfused * 1.50 },
        { quality: 'enraged',   raw: rawEnraged,   score: rawEnraged * 1.30 },
        { quality: 'heavy',     raw: rawHeavy,     score: rawHeavy * 1.20 },
        { quality: 'anxious',   raw: rawAnxious,   score: rawAnxious * 1.10 },
        { quality: 'vigilant',  raw: rawVigilant,  score: rawVigilant * 0.95 },
        { quality: 'lonely',    raw: rawLonely,    score: rawLonely * 0.85 },
        { quality: 'revered',   raw: rawRevered,   score: rawRevered * 0.75 },
        { quality: 'content',   raw: rawContent,   score: rawContent * 0.50 }
      ];

      // Filter active qualities and sort deterministically
      const active = candidates.filter(function(c){ return c.raw >= 0.10 && c.score > 0.05; });
      active.sort(function(a, b){
        if(Math.abs(b.score - a.score) > 1e-4) return b.score - a.score;
        return a.quality < b.quality ? -1 : (a.quality > b.quality ? 1 : 0);
      });

      let dominant = 'content';
      let secondary = null;

      if(active.length === 0){
        dominant = 'content';
        secondary = null;
      } else if(active.length === 1){
        dominant = active[0].quality;
        secondary = null;
      } else {
        dominant = active[0].quality;
        secondary = active[1].quality;
      }

      // 6. Tone determination
      let tone = 'positive';
      if(dominant === 'content' || dominant === 'revered'){
        tone = 'positive';
      } else if(dominant === 'vigilant'){
        let hasThreat = active.some(function(c){ return c.quality !== 'vigilant' && c.quality !== 'content' && c.quality !== 'revered'; });
        if(recentSocialDistrust > 0) hasThreat = true;
        tone = hasThreat ? 'negative' : 'neutral';
      } else {
        // hollow, parched, heavy, burning, anxious, terrified, enraged, lonely, confused
        tone = 'negative';
      }

      return { dominant: dominant, secondary: secondary, tone: tone };
    },

    // --- S2: Lint Rule Checker ---
    // Checks source code for forbidden 'v.body' accesses (dot, bare, and bracket accesses v['body']).
    lintBrainCode: function(codeString, allowlist){
      if(typeof codeString !== 'string') return { passed: true, violations: [] };
      const lines = codeString.split('\n');
      const violations = [];
      const allowSet = Array.isArray(allowlist) ? allowlist : [];

      for(let i = 0; i < lines.length; i++){
        const line = lines[i];
        if(/\bv\.body\b/.test(line) || /\bv\s*\[\s*['"]body['"]\s*\]/.test(line)){
          const trimmed = line.trim();
          let allowed = false;
          for(let a = 0; a < allowSet.length; a++){
            if(trimmed.includes(allowSet[a])){
              allowed = true;
              break;
            }
          }
          if(!allowed){
            violations.push({ line: i + 1, text: trimmed });
          }
        }
      }
      return {
        passed: violations.length === 0,
        violations: violations
      };
    }
  };


