/**
 * Natura Material Painter (Phase 16)
 * 
 * Provides tactile, material-specific rendering grammar:
 * - skin: sub-surface warmth, smooth tone gradients, blushing cheeks
 * - hair: cohesive directional strands, occlusion shadow pockets, specular sheen
 * - linen & cotton: soft drapery, low-contrast diffuse folds
 * - leather: firm edges, deep creased shadows, sharp corner glints, brass rivets
 * - metal: sharp specular highlights, high-contrast plates, ambient occlusion
 * - straw: fibrous directional texture, warm golden highlights
 * - wood: matte finish with grain-aligned contouring
 */
'use strict';

let VP;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
}

class MaterialPainter {
  /**
   * Generates a 7-tone coherent material ramp calibrated for specific material properties
   */
  static getRamp(type, baseColor) {
    const base = baseColor || this.getDefaultColor(type);
    const ramp = VP.makeRamp(base);

    switch (type) {
      case 'metal':
        // High contrast, deep shadow, pure white specular tip
        return [
          '#10141a', // deep ambient occlusion
          ramp[1],
          ramp[2],
          ramp[3],
          ramp[4],
          '#e2e8f0', // bright sheen
          '#ffffff'  // specular spark
        ];

      case 'leather':
        // Warm, deep shadows, tight specular highlight
        return [
          '#1e1008',
          '#3a2214',
          ramp[2],
          ramp[3],
          ramp[4],
          '#d89b65',
          '#f6c89c'
        ];

      case 'straw':
        // Golden warm sunlit tones with fibrous contrast
        return [
          '#5c3d10',
          '#8a5e18',
          '#b88224',
          '#e0a838',
          '#f5ca56',
          '#ffea85',
          '#fffbeb'
        ];

      case 'linen':
      case 'cotton':
        // Soft matte, restrained highlight (no sharp white glints)
        return [
          ramp[0],
          ramp[1],
          ramp[2],
          ramp[3],
          ramp[4],
          ramp[4], // diffuse softness
          ramp[5]
        ];

      case 'skin':
        return ramp;

      default:
        return ramp;
    }
  }

  static getDefaultColor(type) {
    switch (type) {
      case 'skin': return '#e8ad82';
      case 'hair': return '#533118';
      case 'leather': return '#6d4323';
      case 'metal': return '#8a99a8';
      case 'straw': return '#e5ab3c';
      case 'wood': return '#784824';
      case 'linen': return '#e6dfd1';
      case 'cotton': return '#385e82';
      default: return '#556677';
    }
  }

  /**
   * Applies material-specific specular glints or surface textures
   */
  static applyMaterialFX(c, x, y, materialType, z = 50) {
    if (materialType === 'metal') {
      c.setPixel(x, y, '#ffffff', 5, z);
      c.setPixel(x + 1, y, '#cbd5e1', 4, z);
    } else if (materialType === 'leather') {
      c.setPixel(x, y, '#eab308', 4, z); // Brass rivet
    } else if (materialType === 'straw') {
      c.setPixel(x, y, '#fffbeb', 4, z); // Fiber strand tip
    }
  }
}

if (typeof window !== 'undefined') {
  window.MaterialPainter = MaterialPainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MaterialPainter };
}
