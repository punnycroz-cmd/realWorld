/**
 * Natura Animation System (Phase 6)
 * Kinematic pose-driven animation engine for Natura characters.
 * Calculates joint transforms, weight shift, secondary motion, and state modifiers.
 */
'use strict';

class AnimationSystem {
  /**
   * Calculates skeletal pose kinematics for given action, frame, direction, and condition.
   */
  static getPose(act = 'idle', frame = 0, dir = 0, condition = {}, age = 30) {
    const isChild = age < 7;
    const isTeen = age >= 7 && age < 16;
    const isElder = age > 58;

    // Base kinematics container
    const pose = {
      act,
      frame,
      dir, // 0=front, 1=back, 2=profile_left, 3=profile_right
      comBobY: 0,
      torsoTiltX: 0,
      headBobY: 0,
      headBobX: 0,
      blink: false,
      mouthOpen: false,
      armLeft: { x: 10, y: 26, up: false, angle: 0 },
      armRight: { x: 22, y: 26, up: false, angle: 0 },
      legLeft: { x: 12, y: 42, footY: 42, lifted: false },
      legRight: { x: 20, y: 42, footY: 42, lifted: false },
      tool: { active: false, hand: 'right', angle: 0 },
      carriedItem: condition.carryingItem || null,
      sitting: false,
      sleeping: false
    };

    // 1. Fatigue modifier
    const fatigue = condition.fatigue || 0;
    const fatigueSlump = fatigue > 0.6 ? 1 : 0;
    pose.torsoTiltX += fatigueSlump;
    pose.headBobY += fatigueSlump;

    // 2. Cold shivering modifier
    if (condition.cold > 0.5) {
      // 1px lateral jitter on alternate frames
      pose.comBobY += (frame % 2 === 0 ? 0 : 1);
    }

    // 3. Action Kinematics
    if (act === 'walk') {
      const f = frame % 6;
      // 6-frame kinematic cycle
      // f=0: Contact L, f=1: Recoil L, f=2: Passing L, f=3: Contact R, f=4: Recoil R, f=5: Passing R
      const bobY = [0, 1, -1, 0, 1, -1];
      pose.comBobY += bobY[f];
      pose.headBobY += (f === 1 || f === 4 ? 1 : 0); // Head lag on recoil

      if (dir === 2 || dir === 3) {
        // Profile Walk
        const stride = [ -3, -1, 2, 3, 1, -2 ];
        const armSwing = [ 3, 1, -2, -3, -1, 2 ];

        pose.legLeft.footY = (f === 1 || f === 4) ? 41 : 42;
        pose.legLeft.x = 16 + stride[f];
        pose.legRight.x = 16 - stride[f];
        pose.armLeft.y = 26 + (f % 2 === 1 ? -1 : 0);
        pose.armRight.y = 26 + (f % 2 === 1 ? 1 : 0);
        pose.armLeft.x = 16 + armSwing[f];
        pose.armRight.x = 16 - armSwing[f];
      } else {
        // Front / Back Walk
        // Stride lifts feet alternately
        if (f === 1 || f === 2) {
          pose.legLeft.footY = 41;
          pose.legLeft.lifted = true;
        } else if (f === 4 || f === 5) {
          pose.legRight.footY = 41;
          pose.legRight.lifted = true;
        }
        // Arm counter-swing
        const swing = [ -2, -1, 1, 2, 1, -1 ];
        pose.armLeft.y = 26 - swing[f];
        pose.armRight.y = 26 + swing[f];
      }
    } else if (act === 'idle') {
      const f = frame % 4;
      // Gentle breathing cycle: chest rises on f=1,2
      pose.comBobY += (f === 1 || f === 2 ? -1 : 0);
      pose.blink = (f === 2); // Occasional blink on frame 2
    } else if (act === 'work') {
      const f = frame % 4;
      // Work cycle: swing high -> strike contact -> recover
      pose.tool.active = true;
      if (f === 0) {
        // Windup: arms raised
        pose.armRight.y = 18;
        pose.armRight.up = true;
        pose.comBobY += -1;
      } else if (f === 1) {
        // Downward swing
        pose.armRight.y = 24;
        pose.comBobY += 0;
      } else if (f === 2) {
        // Contact strike
        pose.armRight.y = 28;
        pose.comBobY += 1; // Impact compression
      } else {
        // Settle
        pose.armRight.y = 25;
        pose.comBobY += 0;
      }
    } else if (act === 'talk') {
      const f = frame % 4;
      pose.mouthOpen = (f === 1 || f === 3);
      if (f === 1) {
        // Expressive hand gesture
        pose.armLeft.y = 22;
        pose.armLeft.up = true;
      }
    } else if (act === 'sit') {
      pose.sitting = true;
      pose.comBobY += 6; // Seated hip drop
      pose.legLeft.footY = 40;
      pose.legRight.footY = 40;
      pose.armLeft.y = 28;
      pose.armRight.y = 28;
      pose.blink = (frame % 4 === 1);
    } else if (act === 'sleep') {
      pose.sleeping = true;
      pose.comBobY += 12; // Horizontal prone resting
      pose.blink = true;  // Eyes closed permanently during sleep
    } else if (act === 'drink') {
      // Crouching drinking pose
      pose.comBobY += 4;
      pose.armLeft.y = 27;
      pose.armRight.y = 27;
      pose.headBobY += 2;
    }

    return pose;
  }
}

if (typeof window !== 'undefined') {
  window.AnimationSystem = AnimationSystem;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationSystem };
}
