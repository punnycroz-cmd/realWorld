/**
 * Natura Pose Painter (Phase 16)
 * 
 * Calculates dynamic kinematic offsets and physiological state modifiers:
 * - Whole-body weight transfer, pelvic sway, foot lift, arm swing
 * - Breathing idle micro-kinematics
 * - Fatigue slump, shivering cold, mud/dirt splatters, rain sheen, pregnancy volume
 */
'use strict';

class PosePainter {
  /**
   * Calculates skeletal transforms for 64x64 frame given action, frame, and continuous condition
   */
  static getTransforms(act = 'idle', frame = 0, dir = 0, condition = {}, ageYears = 30) {
    const f = frame % 6;
    const cond = condition || {};

    let bobY = 0;
    let headBobX = 0;
    let headBobY = 0;
    let torsoTiltX = 0;
    let footLY = 52;
    let footRY = 52;
    let armLY = 36;
    let armRY = 36;
    let handLX = 22;
    let handRX = 42;
    let toolActive = false;
    let toolAngle = 0;

    // 1. Action Kinematics
    if (act === 'idle') {
      // Subtle 4-frame breathing cycle
      bobY = (f === 1 || f === 2) ? 1 : 0;
      headBobY = (f === 2) ? 1 : 0;
    } else if (act === 'walk') {
      // 6-frame kinematic walk
      // Stride offsets
      const stride = Math.sin(f * Math.PI / 3) * 3;
      const bobCycle = [0, 1, -1, 0, 1, -1];
      bobY = bobCycle[f];
      headBobY = (f === 1 || f === 4) ? 1 : 0; // head lag on recoil

      if (dir === 2 || dir === 3) {
        // Profile Walk
        handLX = 32 - Math.round(stride * 1.5);
        handRX = 32 + Math.round(stride * 1.5);
        footLY = 52 + (f === 1 ? -2 : 0);
        footRY = 52 + (f === 4 ? -2 : 0);
      } else {
        // Front / Back Walk
        if (stride > 0.5) {
          footLY = 50; // Lift left foot
          armRY = 34; // Opposite arm forward
        } else if (stride < -0.5) {
          footRY = 50; // Lift right foot
          armLY = 34;
        }
      }
    } else if (act === 'work' || act === 'action') {
      // Dynamic work stroke (swinging sickle/hammer)
      toolActive = true;
      if (f === 0 || f === 1) {
        // Wind-up: arm high
        armRY = 28;
        handRX = 44;
        bobY = -1;
        toolAngle = -45;
      } else if (f === 2 || f === 3) {
        // Impact stroke: body drops, arm strikes down
        armRY = 40;
        handRX = 38;
        bobY = 2;
        headBobY = 1;
        torsoTiltX = 1;
        toolAngle = 30;
      } else {
        // Recovery
        armRY = 36;
        handRX = 40;
        bobY = 0;
        toolAngle = 0;
      }
    }

    // 2. Physiological Modifiers
    // Fatigue
    const fatigue = cond.fatigue || 0;
    if (fatigue > 0.5) {
      bobY += 1;
      headBobY += 1;
      torsoTiltX += 1; // slumping posture
    }

    // Cold Shivering
    const cold = cond.cold || 0;
    if (cold > 0.5 && frame % 2 === 1) {
      bobY += 1; // 1px rapid jitter
      headBobX += 1;
    }

    // Injury limp
    const injury = cond.injury || 0;
    if (injury > 0.3 && act === 'walk') {
      footLY += (f % 2 === 0 ? 1 : -1); // uneven gait
      torsoTiltX += 1;
    }

    return {
      bobY,
      headBobX,
      headBobY,
      torsoTiltX,
      footLY,
      footRY,
      armLY,
      armRY,
      handLX,
      handRX,
      toolActive,
      toolAngle
    };
  }

  /**
   * Applies weather/dirt/status effects on top of the rendered sprite
   */
  static applyStatusOverlays(c, condition, dir = 0) {
    const cond = condition || {};

    // 1. Mud / Dirt accumulation on boots and garment hem
    if (cond.dirt > 0.2) {
      const dirtCol = '#3d2516';
      // Lower boot splatters
      c.setPixel(24, 55, dirtCol, 2, 95);
      c.setPixel(25, 54, dirtCol, 2, 95);
      c.setPixel(39, 55, dirtCol, 2, 95);
      c.setPixel(40, 54, dirtCol, 2, 95);
      if (cond.dirt > 0.6) {
        c.setPixel(23, 53, dirtCol, 2, 95);
        c.setPixel(41, 53, dirtCol, 2, 95);
      }
    }

    // 2. Wetness / Rain Sheen
    if (cond.wetness > 0.4) {
      // Specular sheen glints on shoulders and hat
      c.setPixel(24, 25, '#ffffff', 4, 95);
      c.setPixel(40, 25, '#ffffff', 4, 95);
    }
  }
}

if (typeof window !== 'undefined') {
  window.PosePainter = PosePainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PosePainter };
}
