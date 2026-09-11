/**
 * Natura Character Generator (Phase 16 - Art-First Modular Architecture)
 * 
 * Orchestration facade connecting Natura Simulation to modular Phase 16 painters:
 * - AnatomyPainter: Form-aware volume, trapezius, limbs, hands, boots
 * - FacePainter: 3D facial planes, expressive eyes with catchlights, blush, lips
 * - HairPainter: Volumetric hair locks, fringe bangs, crown specular sheen
 * - GarmentPainter: Drapery, tension folds, collars, cuffs, hems, layering
 * - MaterialPainter: Tactile material ramps (linen, wool, leather, metal, straw)
 * - AccessoryPainter: Iconic profession gear, hats, and grip-aligned tools
 * - PosePainter: Kinematic weight transfer, breathing, and continuous condition overlays
 * - CharacterCompositor: Multi-pass depth sorting, lighting, and selective contours
 * 
 * 100% backward-compatible with Natura Simulation and legacy testing suites.
 */
'use strict';

let VP, AS, CD, CharacterCompositor;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  AS = require('./animation_system.js');
  CD = require('./character_dna.js');
  CharacterCompositor = require('./character_compositor.js').CharacterCompositor;
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
  AS = (typeof window !== 'undefined' ? window : globalThis);
  CD = (typeof window !== 'undefined' ? window : globalThis);
  CharacterCompositor = (typeof window !== 'undefined' ? window.CharacterCompositor : globalThis.CharacterCompositor);
}

class CharacterGenerator {
  /**
   * Primary Render API (Backward-compatible with simulation & tests).
   * Renders high-fidelity composition, downsampled to 32x48 for legacy callers,
   * or native 64x64 when requested.
   */
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0, condition = {}, outW = 32, outH = 48) {
    if (CharacterCompositor) {
      return CharacterCompositor.render(dna, dir, act, frame, condition, outW, outH);
    }
    // Fallback emergency canvas
    return new VP.PixelCanvas(outW, outH);
  }

  /**
   * Native 64x64 Reference Quality Render API
   */
  static render64(dna, dir = 0, act = 'idle', frame = 0, condition = {}) {
    return CharacterCompositor.render(dna, dir, act, frame, condition, 64, 64);
  }

  /**
   * High-Resolution Frame Render API (for showcase and reference comparison)
   */
  static renderHighResFrame(dna, dir = 0, act = 'idle', frame = 0, condition = {}) {
    return this.render64(dna, dir, act, frame, condition);
  }

  /**
   * Renders a full multi-frame animation strip
   */
  static renderStrip(dna, dir = 0, act = 'walk', frameCount = 6, condition = {}, outW = 64, outH = 64) {
    const strip = new VP.PixelCanvas(outW * frameCount, outH);
    for (let f = 0; f < frameCount; f++) {
      const frameCanvas = this.renderFrame(dna, dir, act, f, condition, outW, outH);
      for (let y = 0; y < outH; y++) {
        for (let x = 0; x < outW; x++) {
          const p = frameCanvas.getPixel(x, y);
          if (p) strip.setPixel(f * outW + x, y, p, 1, 10);
        }
      }
    }
    return strip;
  }
}

if (typeof window !== 'undefined') {
  window.CharacterGenerator = CharacterGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterGenerator };
}
