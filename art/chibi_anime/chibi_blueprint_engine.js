/**
 * Enhanced Chibi Anime Blueprint Assembly Engine
 *
 * Adds DitheringProcessor, SelectiveOutlineRenderer, FacialDetailEnhancer
 * for >= 85% visual fidelity matching the user's reference illustrations.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const VP = require('../visual_primitives.js');

let blueprints = null;
try {
  const bpPath = path.join(__dirname, 'blueprint_components_64.json');
  if (fs.existsSync(bpPath)) {
    blueprints = JSON.parse(fs.readFileSync(bpPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load blueprint_components_64.json:', e.message);
}

let palette = null;
try {
  const palPath = path.join(__dirname, 'blueprint_palette_enhanced.json');
  if (fs.existsSync(palPath)) {
    palette = JSON.parse(fs.readFileSync(palPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load blueprint_palette_enhanced.json:', e.message);
}

// Bezier helper
function getBezierPoint(p0, p1, p2, t) {
  const invT = 1 - t;
  const x = Math.round(invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x);
  const y = Math.round(invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y);
  return { x, y };
}

function drawBezierStroke(c, p0, p1, p2, colorHex, thickness = 1, z = 0) {
  const steps = Math.max(16, Math.round(Math.hypot(p2.x - p0.x, p2.y - p0.y) * 1.5));
  for (let i = 0; i <= steps; i++) {
    const pt = getBezierPoint(p0, p1, p2, i / steps);
    c.fillRect(pt.x - Math.floor(thickness / 2), pt.y - Math.floor(thickness / 2), thickness, thickness, colorHex, 2, z);
  }
}

// Hex to RGB Helper
function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return { r, g, b };
}

function rgbToHex(r, g, b) {
  return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

// Dithering Processor
class DitheringProcessor {
  static getBayerValue(x, y) {
    if (!palette || !palette.dithering_matrices) return 0;
    const bayer = palette.dithering_matrices.bayer4x4;
    return bayer[y % 4][x % 4] / 16.0;
  }

  // A simple dither application to darken the color slightly based on Bayer matrix
  static apply(hex, x, y, intensity = 0.5) {
    const { r, g, b } = hexToRgb(hex);
    const bayer = this.getBayerValue(x, y);
    const ditherOffset = (bayer - 0.5) * 50 * intensity;
    const nr = Math.min(255, Math.max(0, Math.round(r + ditherOffset)));
    const ng = Math.min(255, Math.max(0, Math.round(g + ditherOffset)));
    const nb = Math.min(255, Math.max(0, Math.round(b + ditherOffset)));
    return rgbToHex(nr, ng, nb);
  }
  static applyToCanvas(c) {
    const w = c.width, h = c.height;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (c.data[idx + 3] > 0) { // If not transparent
          const r = c.data[idx];
          const g = c.data[idx + 1];
          const b = c.data[idx + 2];
          
          if (r > 60 || g > 60 || b > 60) {
            const bayer = this.getBayerValue(x, y);
            const ditherOffset = (bayer - 0.5) * 50 * 0.3; // intensity 0.3
            c.data[idx] = Math.min(255, Math.max(0, Math.round(r + ditherOffset)));
            c.data[idx + 1] = Math.min(255, Math.max(0, Math.round(g + ditherOffset)));
            c.data[idx + 2] = Math.min(255, Math.max(0, Math.round(b + ditherOffset)));
          }
        }
      }
    }
  }
}

class FacialDetailEnhancer {
  static enhance(c, headBounds, bobY) {
    if (!palette || !palette.facial_features) return;
    const feats = palette.facial_features;

    const midX = 33;
    const eyeY = 22 + bobY;
    
    // Left eye (from viewer perspective)
    c.fillRect(midX - 5, eyeY, 2, 3, feats.eye_pupils, 2, 80);
    c.setPixel(midX - 4, eyeY, feats.eye_catchlight, 2, 81); // catchlight
    
    // Right eye
    c.fillRect(midX + 3, eyeY, 2, 3, feats.eye_pupils, 2, 80);
    c.setPixel(midX + 4, eyeY, feats.eye_catchlight, 2, 81); // catchlight

    // Blush
    c.fillRect(midX - 7, eyeY + 3, 2, 1, feats.blush, 2, 79);
    c.fillRect(midX + 5, eyeY + 3, 2, 1, feats.blush, 2, 79);

    // Lips
    c.setPixel(midX, eyeY + 4, feats.lips, 2, 80);
  }
}

class SelectiveOutlineRenderer {
  static reinforce(c, innerOutlineHex = '#3b2518', outerOutlineHex = '#1a110a') {
    const w = c.width, h = c.height;
    const isSolid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (c.data[i * 4 + 3] > 20) isSolid[i] = 1;
    }

    const oInner = hexToRgb(innerOutlineHex);
    const oOuter = hexToRgb(outerOutlineHex);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (isSolid[idx] === 1) continue;

        let solidNeighbors = 0;
        if (isSolid[idx - 1] === 1) solidNeighbors++;
        if (isSolid[idx + 1] === 1) solidNeighbors++;
        if (isSolid[idx - w] === 1) solidNeighbors++;
        if (isSolid[idx + w] === 1) solidNeighbors++;

        if (solidNeighbors > 0) {
          const pIdx = idx * 4;
          // Use softer inner outline if it's deeply surrounded (e.g., inside armpit), outer if it's exposed
          const targetColor = solidNeighbors >= 3 ? oInner : oOuter;
          
          c.data[pIdx] = targetColor.r;
          c.data[pIdx + 1] = targetColor.g;
          c.data[pIdx + 2] = targetColor.b;
          c.data[pIdx + 3] = 255;
        }
      }
    }
  }
}

class ChibiBlueprintEngine {
  static renderFrame(charType = 'farmer', act = 'idle', frame = 0) {
    const c = new VP.PixelCanvas(64, 64);
    const f = frame % 6;

    let bobY = 0;
    let leftFootLift = 0;
    let rightFootLift = 0;

    if (act === 'idle') {
      bobY = (f === 1 || f === 2) ? 1 : 0;
    } else if (act === 'walk') {
      const stride = Math.sin(f * Math.PI / 3) * 2.5;
      if (stride > 0.5) {
        leftFootLift = Math.round(stride);
        bobY = -1;
      } else if (stride < -0.5) {
        rightFootLift = Math.round(-stride);
        bobY = -1;
      } else {
        bobY = 1;
      }
    } else if (act === 'action') {
      bobY = (f === 2 || f === 3) ? 1 : (f === 1 ? -1 : 0);
    }

    if (blueprints && blueprints[charType]) {
      this.assembleFromBlueprints(c, charType, act, f, bobY, leftFootLift, rightFootLift);
    }

    // Enhance facial details
    FacialDetailEnhancer.enhance(c, null, bobY);

    this.renderActionFX(c, charType, act, f, bobY);

    // Apply selective outlining
    SelectiveOutlineRenderer.reinforce(c);

    // Soft Ground Shadow
    const shadowCx = charType === 'farmer' ? 35 : 31;
    c.ellipse(shadowCx, 59, 14, 3.5, 'rgba(40, 20, 15, 0.45)', 0, 0);

    return c;
  }

  static assembleFromBlueprints(c, charType, act, f, bobY, leftFootLift, rightFootLift) {
    const comps = blueprints[charType];
    const midX = charType === 'farmer' ? 35 : 31;

    const layerOrder = (charType === 'farmer')
      ? ['pants', 'boots', 'torso', 'head', 'hat', 'sickle']
      : (charType === 'baker' 
         ? ['pants', 'boots', 'torso', 'head', 'toque', 'bread']
         : Object.keys(comps)); // fallback

    layerOrder.forEach((compName, zIdx) => {
      const pixels = comps[compName];
      if (!pixels) return;

      pixels.forEach(p => {
        let dy = p.y;
        const dx = p.x;

        if (p.y >= 52) {
          const isLeft = (dx < midX);
          dy = p.y - (isLeft ? leftFootLift : rightFootLift);
        } else if (p.y >= 43) {
          const isLeft = (dx < midX);
          const t = (p.y - 43) / 9;
          dy = p.y + Math.round((1 - t) * bobY - t * (isLeft ? leftFootLift : rightFootLift));
        } else {
          dy = p.y + bobY;
        }

        if (dx >= 0 && dx < 64 && dy >= 0 && dy < 64) {
          // Apply gentle dithering to large flat color areas (e.g. skin, clothes)
          // We'll apply dithering based on a simple heuristic (e.g. excluding very dark pixels)
          let finalCol = p.col;
          const { r, g, b } = hexToRgb(finalCol);
          if (r > 60 || g > 60 || b > 60) {
            finalCol = DitheringProcessor.apply(finalCol, dx, dy, 0.3);
          }
          c.setPixel(dx, dy, finalCol, 2, 10 + zIdx * 10);
        }
      });
    });
  }

  static renderActionFX(c, charType, act, f, bobY) {
    if (act !== 'action') return;

    if (charType === 'farmer' && (f === 2 || f === 3)) {
      drawBezierStroke(c, { x: 50, y: 15 + bobY }, { x: 57, y: 28 + bobY }, { x: 42, y: 40 + bobY }, '#ffffff', 2, 95);
      drawBezierStroke(c, { x: 44, y: 28 + bobY }, { x: 52, y: 34 + bobY }, { x: 46, y: 44 + bobY }, '#facc15', 1, 94);
      c.setPixel(54, 34 + bobY, '#fef08a', 4, 96);
      c.setPixel(56, 30 + bobY, '#f59e0b', 4, 96);
      c.setPixel(50, 42 + bobY, '#facc15', 4, 96);
    } else if (charType === 'baker' && (f === 2 || f === 3)) {
      const bx = 16, by = 26 + bobY;
      drawBezierStroke(c, { x: bx - 2, y: by }, { x: bx - 7, y: by - 8 }, { x: bx - 1, y: by - 16 }, '#ffffff', 1, 95);
      drawBezierStroke(c, { x: bx + 8, y: by }, { x: bx + 13, y: by - 8 }, { x: bx + 7, y: by - 16 }, '#ffffff', 1, 95);
      c.setPixel(bx + 3, by - 6, '#fef08a', 4, 96);
    }
  }

  static reinforceOutline(c, outlineHex) {
    const w = c.width, h = c.height;
    const isSolid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (c.data[i * 4 + 3] > 20) isSolid[i] = 1;
    }

    const { r, g, b } = VP.parseHex ? VP.parseHex(outlineHex) : hexToRgb(outlineHex);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (isSolid[idx] === 1) continue;

        if (isSolid[idx - 1] === 1 || isSolid[idx + 1] === 1 ||
            isSolid[idx - w] === 1 || isSolid[idx + w] === 1) {
          const pIdx = idx * 4;
          c.data[pIdx] = r;
          c.data[pIdx + 1] = g;
          c.data[pIdx + 2] = b;
          c.data[pIdx + 3] = 255;
        }
      }
    }
  }
}

module.exports = { ChibiBlueprintEngine, DitheringProcessor, FacialDetailEnhancer, SelectiveOutlineRenderer };
