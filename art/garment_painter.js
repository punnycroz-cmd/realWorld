/**
 * Natura Garment Painter (Phase 16)
 * 
 * Reusable garment grammar:
 * - Shirts, tunics, coats, vests, aprons, overalls, trousers, skirts
 * - Volumetric drapery, tension creases, collars, cuffs, and hem ruffles
 * - Material-aware tactile shading (soft linen vs creased leather vs wool)
 */
'use strict';

let VP, MaterialPainter;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  MaterialPainter = require('./material_painter.js').MaterialPainter;
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
  MaterialPainter = (typeof window !== 'undefined' ? window.MaterialPainter : globalThis.MaterialPainter);
}

class GarmentPainter {
  /**
   * Paints a shirt or tunic with collar and sleeve cuffs
   */
  static paintShirt(c, midX, torsoY, width, height, ramp, dir = 0, z = 42) {
    const halfW = Math.floor(width / 2);

    // Main Torso Fabric
    for (let y = 0; y < height; y++) {
      const prog = y / height;
      const foldIndent = (y > 4 && y % 3 === 0) ? 1 : 0;
      const w = width - foldIndent;
      const x = midX - Math.floor(w / 2);

      c.fillRect(x, torsoY + y, w, 1, ramp[3], 3, z);
      // Left key light highlight
      if (dir !== 1 && w > 4) {
        c.fillRect(x + 1, torsoY + y, Math.floor(w * 0.35), 1, ramp[4], 4, z + 1);
      }
    }

    // Collar / V-neck notch
    if (dir === 0) {
      c.fillRect(midX - 2, torsoY, 4, 3, ramp[1], 2, z + 2); // neck opening shadow
      c.setPixel(midX, torsoY + 2, ramp[0], 1, z + 2); // collar point
    }
  }

  /**
   * Paints trousers with knee tension folds and bottom cuffs
   */
  static paintTrousers(c, legLX, legRX, hipY, footLY, footRY, ramp, dir = 0, z = 28) {
    // Left leg
    const leftH = Math.max(1, footLY - hipY);
    for (let y = 0; y < leftH; y++) {
      const isKnee = (y === Math.floor(leftH * 0.5));
      const w = isKnee ? 6 : 5;
      c.fillRect(legLX - 2, hipY + y, w, 1, isKnee ? ramp[2] : ramp[3], 3, z);
      // Highlight on front shin
      if (dir === 0 && !isKnee) {
        c.fillRect(legLX - 1, hipY + y, 2, 1, ramp[4], 4, z + 1);
      }
    }
    // Bottom cuff band above boot
    c.fillRect(legLX - 2, footLY - 1, 5, 1, ramp[1], 2, z + 2);

    // Right leg
    const rightH = Math.max(1, footRY - hipY);
    for (let y = 0; y < rightH; y++) {
      const isKnee = (y === Math.floor(rightH * 0.5));
      const w = isKnee ? 6 : 5;
      c.fillRect(legRX - 2, hipY + y, w, 1, isKnee ? ramp[2] : ramp[3], 3, z);
      if (dir === 0 && !isKnee) {
        c.fillRect(legRX - 1, hipY + y, 2, 1, ramp[4], 4, z + 1);
      }
    }
    c.fillRect(legRX - 2, footRY - 1, 5, 1, ramp[1], 2, z + 2);
  }

  /**
   * Paints a flared skirt with natural undulating folds
   */
  static paintSkirt(c, midX, hipY, bottomY, width, ramp, dir = 0, z = 28) {
    const height = Math.max(1, bottomY - hipY);
    for (let y = 0; y < height; y++) {
      const prog = y / height;
      // Exponential flare toward hem
      const w = Math.round(width * (0.85 + 0.45 * prog));
      const x = midX - Math.floor(w / 2);

      c.fillRect(x, hipY + y, w, 1, ramp[3], 3, z);

      // Fluting pleats/folds
      if (dir !== 1 && w > 8) {
        const pleatInterval = 5;
        for (let pX = x + 3; pX < x + w - 3; pX += pleatInterval) {
          c.fillRect(pX, hipY + y, 1, 1, ramp[2], 2, z + 1); // fold shadow
          c.fillRect(pX + 1, hipY + y, 1, 1, ramp[4], 4, z + 1); // fold peak
        }
      }
    }
    // Darker underside hem
    const finalW = Math.round(width * 1.3);
    c.fillRect(midX - Math.floor(finalW / 2), bottomY, finalW, 1, ramp[1], 1, z);
  }

  /**
   * Paints a work apron (Farmer, Baker, Blacksmith)
   */
  static paintApron(c, midX, torsoY, hipY, width, ramp, role = 'farmer', dir = 0, z = 46) {
    if (dir === 1) return; // Not visible from directly behind

    const halfW = Math.floor(width / 2);
    // Apron Bib (Chest)
    c.fillRect(midX - halfW + 3, torsoY + 2, width - 6, hipY - torsoY, ramp[3], 3, z);
    
    // Neck strap
    c.fillRect(midX - halfW + 4, torsoY - 1, 2, 3, ramp[2], 2, z);
    c.fillRect(midX + halfW - 6, torsoY - 1, 2, 3, ramp[2], 2, z);

    // Lower Apron Skirt
    const skirtH = 10;
    c.fillRect(midX - halfW + 1, hipY, width - 2, skirtH, ramp[3], 3, z);
    // Pocket
    c.fillRect(midX - 4, hipY + 2, 8, 5, ramp[2], 2, z + 1);
    c.fillRect(midX - 4, hipY + 2, 8, 1, ramp[1], 1, z + 2); // pocket seam

    // Role-specific surface textures
    if (role === 'baker') {
      // White flour dust spots
      c.setPixel(midX - 2, hipY + 4, '#ffffff', 4, z + 3);
      c.setPixel(midX - 1, hipY + 5, '#ffffff', 4, z + 3);
      c.setPixel(midX + 2, hipY + 3, '#f1f5f9', 3, z + 3);
    } else if (role === 'blacksmith') {
      // Leather apron brass rivets
      c.setPixel(midX - halfW + 3, hipY, '#eab308', 4, z + 3);
      c.setPixel(midX + halfW - 4, hipY, '#eab308', 4, z + 3);
    }
  }

  /**
   * Paints a waist belt with metallic buckle
   */
  static paintBelt(c, midX, beltY, width, beltColor = '#24140a', buckleColor = '#eab308', z = 48) {
    const halfW = Math.floor(width / 2);
    // Leather belt strap
    c.fillRect(midX - halfW, beltY, width, 2, beltColor, 3, z);
    // Metallic buckle
    c.fillRect(midX - 2, beltY - 1, 4, 3, buckleColor, 4, z + 1);
    c.setPixel(midX - 1, beltY, '#180e06', 2, z + 2); // buckle tongue
  }
}

if (typeof window !== 'undefined') {
  window.GarmentPainter = GarmentPainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GarmentPainter };
}
