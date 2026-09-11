/**
 * Natura Anatomy Painter (Phase 16)
 * 
 * Renders form-aware anatomical planes with believable volume:
 * - Trapezius slope & neck articulation
 * - Torso volume: chest ribcage mass, waist taper, and pelvic base
 * - Tapered limbs (bicep to forearm, thigh to calf curve)
 * - Articulated hands with gripping knuckle mass
 * - Grounded feet/boots with sole thickness and arch
 */
'use strict';

let VP;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
}

class AnatomyPainter {
  /**
   * Paints the neck with proper trapezius slope
   */
  static paintNeck(c, midX, neckY, width, height, skinRamp, z = 55) {
    const halfW = Math.floor(width / 2);
    // Deep shadow under chin
    c.fillRect(midX - halfW, neckY, width, 1, skinRamp[1], 1, z);
    // Neck base
    for (let y = 1; y < height; y++) {
      const slope = Math.floor(y * 0.5);
      c.fillRect(midX - halfW - slope, neckY + y, width + slope * 2, 1, skinRamp[2], 2, z);
    }
  }

  /**
   * Paints the torso volume with chest/waist plane differentiation
   */
  static paintTorso(c, midX, torsoY, width, height, ramp, dir = 0, z = 40) {
    const halfW = Math.floor(width / 2);
    const chestH = Math.round(height * 0.55);
    const waistH = height - chestH;

    // 1. Chest / Ribcage volume
    for (let y = 0; y < chestH; y++) {
      // Rounded clavicle transition at top
      const inset = y === 0 ? 2 : (y === 1 ? 1 : 0);
      const w = width - inset * 2;
      const x = midX - halfW + inset;
      
      // Upper-left light, right shadow
      const col = dir === 1 ? ramp[2] : ramp[3];
      c.fillRect(x, torsoY + y, w, 1, col, 3, z);
      
      // Key light highlight on left breast/pectoral
      if (dir === 0 && w > 4) {
        c.fillRect(x + 1, torsoY + y, Math.floor(w * 0.35), 1, ramp[4], 4, z + 1);
      }
    }

    // 2. Waist taper to pelvis
    for (let y = 0; y < waistH; y++) {
      const taperProg = y / waistH;
      // Slight inward taper at waist, expanding slightly at hips
      const taper = Math.round(Math.sin(taperProg * Math.PI) * 1.5);
      const w = width - taper;
      const x = midX - Math.floor(w / 2);
      
      c.fillRect(x, torsoY + chestH + y, w, 1, ramp[2], 3, z);
      if (dir === 0 && w > 4) {
        c.fillRect(x + 1, torsoY + chestH + y, Math.floor(w * 0.3), 1, ramp[3], 3, z + 1);
      }
    }
  }

  /**
   * Paints a tapered limb (arm or leg) with muscle volume
   */
  static paintLimb(c, startX, startY, endX, endY, startWidth, endWidth, ramp, dir = 0, z = 30) {
    const steps = Math.max(1, Math.abs(endY - startY));
    const dx = (endX - startX) / steps;
    
    for (let i = 0; i <= steps; i++) {
      const y = Math.round(startY + i);
      const prog = i / steps;
      const x = Math.round(startX + dx * i);
      const w = Math.round(startWidth * (1 - prog) + endWidth * prog);
      const halfW = Math.floor(w / 2);
      
      // Shadow underside, highlighted top-left
      c.fillRect(x - halfW, y, w, 1, ramp[2], 2, z);
      if (w >= 3 && dir !== 1) {
        c.fillRect(x - halfW, y, Math.max(1, Math.floor(w * 0.4)), 1, ramp[3], 3, z + 1);
      }
    }
  }

  /**
   * Paints an articulated hand with thumb/grip volume
   */
  static paintHand(c, x, y, skinRamp, gripState = 'open', dir = 0, z = 85) {
    if (gripState === 'fist') {
      // Clenched fist: rounded compact block with knuckle crease
      c.fillRect(x - 1, y, 4, 4, skinRamp[3], 2, z);
      c.fillRect(x, y, 2, 2, skinRamp[4], 3, z + 1); // knuckle highlight
      c.setPixel(x + 1, y + 2, skinRamp[1], 1, z + 2); // finger crease
    } else {
      // Open / relaxed hand: palm with thumb protrusion
      c.fillRect(x - 1, y, 4, 3, skinRamp[3], 2, z);
      c.fillRect(x, y + 3, 3, 2, skinRamp[2], 2, z); // fingertips
      c.setPixel(dir === 2 ? x - 2 : x + 3, y + 1, skinRamp[4], 3, z + 1); // thumb
    }
  }

  /**
   * Paints a grounded boot with arch, sole thickness, and toe cap
   */
  static paintBoot(c, x, y, bootRamp, dir = 0, z = 25) {
    // Ankle cuff
    c.fillRect(x - 2, y, 5, 2, bootRamp[2], 3, z);
    
    // Foot body
    if (dir === 2) {
      // Profile Left: toe pointing left
      c.fillRect(x - 4, y + 2, 7, 3, bootRamp[2], 3, z);
      c.fillRect(x - 3, y + 2, 2, 2, bootRamp[3], 4, z + 1); // toe cap highlight
      c.fillRect(x - 4, y + 4, 7, 1, bootRamp[0], 1, z + 2); // heavy dark sole
    } else if (dir === 3) {
      // Profile Right: toe pointing right
      c.fillRect(x - 2, y + 2, 7, 3, bootRamp[2], 3, z);
      c.fillRect(x + 2, y + 2, 2, 2, bootRamp[3], 4, z + 1); // toe cap highlight
      c.fillRect(x - 2, y + 4, 7, 1, bootRamp[0], 1, z + 2); // heavy dark sole
    } else {
      // Front (dir === 0) or Back (dir === 1)
      c.fillRect(x - 3, y + 2, 6, 3, bootRamp[2], 3, z);
      if (dir === 0) {
        c.fillRect(x - 2, y + 2, 3, 2, bootRamp[3], 4, z + 1); // front shin/toe highlight
      }
      c.fillRect(x - 3, y + 4, 6, 1, bootRamp[0], 1, z + 2); // sole
    }
  }
}

if (typeof window !== 'undefined') {
  window.AnatomyPainter = AnatomyPainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnatomyPainter };
}
