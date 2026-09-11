/**
 * Natura Simulation Visual State Adapter (Phase 7)
 * Transforms Natura biological/ecological simulation state into declarative visual state.
 *
 * PURE CONSUMER: Never writes back to simulation data structures.
 */
'use strict';

class CharacterVisualState {
  /**
   * Adapts a living villager and environment snapshot into a visual render state.
   */
  static adapt(v, env = {}) {
    const b = v.body || {};
    const job = v.job || {};
    const act = v.act || (job.kind ? job.kind : 'idle');

    // 1. Action Mapping
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

    // 2. Facing Direction (0=front/down, 1=back/up, 2=left, 3=right)
    let dir = 0;
    if (v._dir != null) {
      dir = v._dir;
    } else if (v._lastX != null && v._lastY != null) {
      const dx = v.x - v._lastX;
      const dy = v.y - v._lastY;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx < 0 ? 2 : 3;
        } else {
          dir = dy < 0 ? 1 : 0;
        }
      }
    }

    // 3. Quantized Physiological Conditions (prevents combinatorial explosion)
    // Fatigue (0, 1, 2)
    const rawFatigue = b.fatigue || (v.energy != null ? 1 - v.energy : 0);
    const qFatigue = rawFatigue > 0.75 ? 2 : (rawFatigue > 0.45 ? 1 : 0);

    // Cold (0, 1, 2)
    const coreTemp = b.coreTemp || 37.0;
    const qCold = coreTemp < 35.5 ? 2 : (coreTemp < 36.2 ? 1 : 0);

    // Fever (0, 1)
    const qFever = coreTemp > 38.0 ? 1 : 0;

    // Environmental Wetness (0, 1, 2)
    const isRaining = (env.rain || 0) > 0.15;
    const isGroundWet = env.groundWet > 0.6 || env.wet;
    let qWet = 0;
    if (isRaining && (env.rain || 0) > 0.4) qWet = 2;
    else if (isRaining || isGroundWet) qWet = 1;

    // Dirt / Mud (0, 1, 2)
    let qDirt = 0;
    if (visualAct === 'work' && (act === 'till' || act === 'forage' || isGroundWet)) {
      qDirt = isGroundWet ? 2 : 1;
    }

    // Physical Trauma & Disease
    const qInjury = (b.injury || 0) > 0.3 ? 1 : 0;
    const qIllness = (b.illness || 0) > 0.35 ? 1 : 0;

    // Carrying Items
    let carryingItem = null;
    if (v.carry && v.carry.length > 0) {
      const top = v.carry[0];
      carryingItem = typeof top === 'string' ? top : (top.type || 'log');
    } else if (job.kind === 'haul' || act === 'haul') {
      carryingItem = 'log';
    }

    // Pregnancy
    const pregnant = v.pregnant || 0;

    // 4. Stable Compound Condition Key for Cache Hashing
    const conditionKey = `f${qFatigue}_c${qCold}_v${qFever}_w${qWet}_d${qDirt}_i${qInjury}_p${pregnant > 60 ? 1 : 0}_h${carryingItem || 0}`;

    return {
      act: visualAct,
      dir,
      conditionKey,
      condition: {
        fatigue: qFatigue * 0.5,
        cold: qCold * 0.5,
        fever: qFever,
        wetness: qWet * 0.5,
        dirt: qDirt * 0.5,
        injury: qInjury,
        illness: qIllness,
        pregnant,
        carryingItem
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterVisualState };
}
