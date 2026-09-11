/**
 * Natura Hair Painter (Phase 16)
 * 
 * Rebuilds hair as volumetric locks with directional flow:
 * - Large mass defining outer head silhouette
 * - Structured fringe & bangs framing the face
 * - Secondary locks, twintails, side braids, buns, ponytails
 * - Shadow pockets under fringe onto forehead
 * - Directional crown specular sheen
 */
'use strict';

let VP;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
}

class HairPainter {
  /**
   * Paints hair flowing behind the head/torso (Z < 40)
   */
  static paintBackHair(c, midX, headCenterY, dna, dir = 0, z = 15) {
    const style = dna.hair.style || 'short';
    const hairRamp = VP.makeRamp(
      dna.hair.colorRampKey === 'blonde' ? '#c7923e' :
      (dna.hair.colorRampKey === 'auburn' ? '#9c3d2e' :
      (dna.hair.colorRampKey === 'grey' ? '#7b808c' :
      (dna.hair.colorRampKey === 'black' ? '#22222a' : '#5a331c')))
    );

    if (style === 'long') {
      // Flowing long locks down shoulders
      for (let y = 0; y < 22; y++) {
        const prog = y / 22;
        const w = Math.round(11 + Math.sin(prog * Math.PI) * 3);
        c.fillRect(midX - w, headCenterY - 6 + y, w * 2, 1, hairRamp[1], 2, z);
        // Shadow core in the center of back hair
        c.fillRect(midX - 3, headCenterY - 6 + y, 6, 1, hairRamp[0], 1, z);
      }
    } else if (style === 'braided' || style === 'braid') {
      // Side or central braid with braided cross-hatching
      const braidX = (dir === 2) ? midX - 8 : (dir === 3 ? midX + 6 : midX - 6);
      for (let y = 0; y < 18; y++) {
        const w = (y % 4 < 2) ? 4 : 3;
        c.fillRect(braidX, headCenterY + 4 + y, w, 1, hairRamp[2], 2, z);
        c.setPixel(braidX + 1, headCenterY + 4 + y, hairRamp[0], 1, z + 1); // braid notch
      }
    } else if (style === 'ponytail') {
      // High or mid ponytail gathered at back
      const pyX = (dir === 2) ? midX + 6 : (dir === 3 ? midX - 8 : midX);
      for (let y = 0; y < 16; y++) {
        const prog = y / 16;
        const w = Math.round(3 + Math.sin(prog * 2) * 2);
        c.fillRect(pyX - Math.floor(w / 2), headCenterY - 2 + y, w, 1, hairRamp[1], 2, z);
      }
    } else if (style === 'bun' || style === 'buns') {
      // Round braided buns on left & right
      c.fillRect(midX - 12, headCenterY - 4, 5, 5, hairRamp[2], 2, z);
      c.fillRect(midX + 8, headCenterY - 4, 5, 5, hairRamp[2], 2, z);
      c.fillRect(midX - 11, headCenterY - 3, 3, 3, hairRamp[3], 3, z + 1);
      c.fillRect(midX + 9, headCenterY - 3, 3, 3, hairRamp[3], 3, z + 1);
    }
  }

  /**
   * Paints front hair, crown volume, bangs, and highlights (Z > 65)
   */
  static paintFrontHair(c, midX, headCenterY, dna, dir = 0, z = 70) {
    const style = dna.hair.style || 'short';
    const hairRamp = VP.makeRamp(
      dna.hair.colorRampKey === 'blonde' ? '#c7923e' :
      (dna.hair.colorRampKey === 'auburn' ? '#9c3d2e' :
      (dna.hair.colorRampKey === 'grey' ? '#7b808c' :
      (dna.hair.colorRampKey === 'black' ? '#22222a' : '#5a331c')))
    );

    if (style === 'bald' || style === 'shaved') {
      // Subtle stubble shadow on scalp
      c.fillRect(midX - 8, headCenterY - 9, 16, 3, hairRamp[0], 1, z);
      return;
    }

    // 1. Crown Volume Dome
    const crownTop = headCenterY - 11;
    for (let y = 0; y < 8; y++) {
      const prog = y / 8;
      const w = Math.round(5 + Math.sqrt(prog) * 6);
      c.fillRect(midX - w, crownTop + y, w * 2, 1, hairRamp[2], 2, z);
    }

    // 2. Specular Crown Ring Highlight
    c.fillRect(midX - 6, crownTop + 2, 5, 1, hairRamp[4], 4, z + 1);
    c.fillRect(midX + 1, crownTop + 2, 6, 1, hairRamp[4], 4, z + 1);
    c.setPixel(midX - 4, crownTop + 2, hairRamp[5], 5, z + 2); // bright specular spark

    // 3. Side Framing Locks
    c.fillRect(midX - 10, headCenterY - 4, 3, 9, hairRamp[2], 2, z);
    c.fillRect(midX + 8, headCenterY - 4, 3, 9, hairRamp[1], 2, z);

    // 4. Forehead Bangs / Fringe (Style-specific)
    if (dir === 0) {
      if (style === 'short' || style === 'messy') {
        // Sculpted fringe locks pointing down
        c.fillRect(midX - 7, headCenterY - 5, 3, 3, hairRamp[2], 2, z);
        c.fillRect(midX - 3, headCenterY - 5, 4, 4, hairRamp[3], 3, z + 1);
        c.fillRect(midX + 2, headCenterY - 5, 4, 3, hairRamp[2], 2, z);
        c.setPixel(midX - 1, headCenterY - 1, hairRamp[1], 2, z); // lock tip
      } else if (style === 'bob') {
        // Clean horizontal arched fringe
        c.fillRect(midX - 7, headCenterY - 5, 14, 3, hairRamp[2], 2, z);
        c.fillRect(midX - 5, headCenterY - 4, 10, 1, hairRamp[3], 3, z + 1);
      } else if (style === 'long' || style === 'braided' || style === 'bun') {
        // Swept bangs with loose strands
        c.fillRect(midX - 6, headCenterY - 6, 6, 4, hairRamp[3], 3, z);
        c.fillRect(midX + 1, headCenterY - 6, 6, 3, hairRamp[2], 2, z);
        c.setPixel(midX - 5, headCenterY - 2, hairRamp[2], 2, z); // stray strand
      }
      
      // Shadow cast by bangs onto forehead
      c.fillRect(midX - 6, headCenterY - 2, 12, 1, 'rgba(20, 10, 5, 0.35)', 1, z - 1);
    } else if (dir === 1) {
      // Full back hair cover
      for (let y = 0; y < 14; y++) {
        c.fillRect(midX - 9, headCenterY - 7 + y, 18, 1, hairRamp[1], 2, z);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.HairPainter = HairPainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HairPainter };
}
