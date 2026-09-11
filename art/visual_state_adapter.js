/**
 * Natura Simulation Visual State Adapter (Phase 15.15)
 * Transforms Natura biological/ecological simulation state into declarative visual state.
 * Passes continuous states for subtle visual interpolation.
 */
'use strict';

class CharacterVisualState {
  static adapt(v, env = {}) {
    const b = v.body || {};
    const job = v.job || {};
    const act = v.act || (job.kind ? job.kind : 'idle');

    // Action Mapping
    let visualAct = 'idle';
    if (act === 'sleep' || job.kind === 'sleep') visualAct = 'sleep';
    else if (act === 'rest' || job.kind === 'rest') visualAct = 'sit';
    else if (act === 'drink' || job.kind === 'drink') visualAct = 'drink';
    else if (act === 'walk' || act === 'goto' || job.kind === 'goto') visualAct = 'walk';
    else if (act === 'say_to' || act === 'talk') visualAct = 'talk';
    else if (['fell', 'saw', 'craft', 'till', 'plant', 'harvest', 'forage', 'fish', 'hunt', 'haul'].includes(act) ||
             ['fell', 'saw', 'craft', 'till', 'plant', 'harvest', 'forage', 'fish', 'hunt', 'haul'].includes(job.kind)) {
      visualAct = 'work';
    }

    // Direction
    let dir = 0;
    if (v._dir != null) {
      dir = v._dir;
    } else if (v._lastX != null && v._lastY != null) {
      const dx = v.x - v._lastX;
      const dy = v.y - v._lastY;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        if (Math.abs(dx) > Math.abs(dy)) dir = dx < 0 ? 2 : 3;
        else dir = dy < 0 ? 1 : 0;
      }
    }

    // Continuous Physiological Conditions
    const rawFatigue = b.fatigue || (v.energy != null ? Math.max(0, 1 - v.energy) : 0);
    const coreTemp = b.coreTemp || 37.0;
    
    // Smooth cold factor (0 to 1 as temp drops below 36.5)
    const coldFactor = Math.max(0, Math.min(1, (36.5 - coreTemp) / 1.5));
    // Fever factor
    const feverFactor = Math.max(0, Math.min(1, (coreTemp - 37.5) / 1.5));

    // Environmental Wetness (0 to 1 continuous)
    const isRaining = env.rain || 0;
    const isGroundWet = env.groundWet || (env.wet ? 1.0 : 0);
    const wetness = Math.max(0, Math.min(1.0, isRaining + (isGroundWet * 0.3)));

    // Dirt accumulation based on work/ground
    let dirt = 0;
    if (visualAct === 'work' && (act === 'till' || act === 'forage' || isGroundWet > 0.5)) {
      dirt = isGroundWet > 0.5 ? 1.0 : 0.5;
    }

    const injury = (b.injury || 0);
    const pregnant = v.pregnant || 0;

    let carryingItem = null;
    if (v.carry && v.carry.length > 0) {
      const top = v.carry[0];
      carryingItem = typeof top === 'string' ? top : (top.type || 'log');
    } else if (job.kind === 'haul' || act === 'haul') {
      carryingItem = 'log';
    }

    // Cache keys are still quantized for performance to prevent explosion, but we provide continuous values for rendering
    const qFatigue = Math.floor(rawFatigue * 4);
    const qCold = Math.floor(coldFactor * 4);
    const qWet = Math.floor(wetness * 4);
    const conditionKey = \`f\${qFatigue}_c\${qCold}_w\${qWet}_p\${pregnant > 60 ? 1 : 0}_h\${carryingItem || 0}\`;

    return {
      act: visualAct,
      dir,
      conditionKey,
      condition: {
        fatigue: rawFatigue,
        cold: coldFactor,
        fever: feverFactor,
        wetness: wetness,
        dirt: dirt,
        injury: injury,
        pregnant,
        carryingItem
      }
    };
  }
}

if (typeof window !== 'undefined') {
  window.CharacterVisualState = CharacterVisualState;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterVisualState };
}
