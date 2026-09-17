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

      // Explicit causal routing into D1 accumulators:
      if(signal.affect === 'fear' || signal.kind === 'fear' || signal.domain === 'danger'){
        // Fear event -> boosts fearFatigueAcc
        v.fearFatigueAcc = clamp((v.fearFatigueAcc || 0) + signal.intensity, 0.0, 1.0);
      } else if(signal.affect === 'hunger' || signal.kind === 'hunger_starving'){
        // Acute hunger signal -> boosts hungerStressAcc
        v.hungerStressAcc = clamp((v.hungerStressAcc || 0) + signal.intensity * 0.4, 0.0, 1.0);
      } else if(signal.affect === 'pain' || signal.kind === 'pain_injury'){
        // Acute pain signal -> boosts painPatienceAcc
        v.painPatienceAcc = clamp((v.painPatienceAcc || 0) + signal.intensity * 0.5, 0.0, 1.0);
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

    // Contract Method 3: getFeelingScape(v) -> {dominant, secondary, tone}
    // Minimal placeholder for Slice E1; Slice E2 will implement full 12-quality merge.
    getFeelingScape: function(v){
      if(!v) return { dominant: 'content', secondary: null, tone: 'neutral' };
      this.ensureSubstrate(v);
      const b = (typeof ensureBody === 'function') ? ensureBody(v) : (v.body || {});
      const acc = this.getAccumulators(v);

      let dominant = 'content';
      let secondary = null;
      let tone = 'positive';

      if(acc.fearFatigue > 0.3){
        dominant = 'terrified';
        secondary = 'heavy';
        tone = 'negative';
      } else if((b.stress || 0) > 0.6 || acc.hungerStress > 0.25){
        dominant = 'anxious';
        secondary = (b.satiety || 1.0) < 0.35 ? 'hollow' : null;
        tone = 'negative';
      } else if((b.fatigue || 0) > 0.7){
        dominant = 'heavy';
        secondary = null;
        tone = 'negative';
      } else if(v.emotions && v.emotions.length > 0){
        const top = v.emotions.slice().sort(function(e1, e2){ return (e2.intensity || 0) - (e1.intensity || 0); })[0];
        if(top){
          dominant = top.tag;
          tone = (top.tag === 'content') ? 'positive' : 'negative';
        }
      }

      return { dominant: dominant, secondary: secondary, tone: tone };
    },

    // --- S2: Lint Rule Checker ---
    // Checks source code for forbidden 'v.body.' accesses.
    lintBrainCode: function(codeString, allowlist){
      if(typeof codeString !== 'string') return { passed: true, violations: [] };
      const lines = codeString.split('\n');
      const violations = [];
      const allowSet = Array.isArray(allowlist) ? allowlist : [];

      for(let i = 0; i < lines.length; i++){
        const line = lines[i];
        if(/\bv\.body\./.test(line)){
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


