/**
 * Natura Visual Primitive Library (Phase 15 - High Fidelity)
 * High-performance, deterministic pixel-art rendering primitives.
 */
'use strict';

// Shared color utility functions
function parseHex(hex) {
  if (!hex || hex[0] !== '#') return { r: 0, g: 0, b: 0, a: 255 };
  let h = hex.slice(1);
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a: 255
  };
}

function toHex(r, g, b) {
  const cr = Math.max(0, Math.min(255, Math.round(r)));
  const cg = Math.max(0, Math.min(255, Math.round(g)));
  const cb = Math.max(0, Math.min(255, Math.round(b)));
  return '#' + ((cr << 16) | (cg << 8) | cb).toString(16).padStart(6, '0');
}

function shade(hex, factor) {
  const { r, g, b } = parseHex(hex);
  return toHex(r * factor, g * factor, b * factor);
}

function mix(hexA, hexB, t) {
  const cA = parseHex(hexA), cB = parseHex(hexB);
  return toHex(
    cA.r * (1 - t) + cB.r * t,
    cA.g * (1 - t) + cB.g * t,
    cA.b * (1 - t) + cB.b * t
  );
}

function makeRamp(baseHex) {
  return [
    mix(shade(baseHex, 0.35), '#1a2238', 0.40), // deep cool occlusion
    mix(shade(baseHex, 0.55), '#262d48', 0.25), // shadow
    shade(baseHex, 0.78),                       // mid-dark
    baseHex,                                    // base
    mix(shade(baseHex, 1.15), '#fff0cc', 0.25), // mid-light (warm key)
    mix(shade(baseHex, 1.35), '#fff8e4', 0.45), // highlight
    mix('#ffffff', baseHex, 0.20)               // specular
  ];
}

class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
    this.matTags = new Uint8Array(width * height);
    this.zBuffer = new Float32Array(width * height); // New: Z-buffering for proper layering
    this.zBuffer.fill(-9999);
  }

  setPixel(x, y, colorHex, matTag = 1, z = 0) {
    const rx = Math.round(x), ry = Math.round(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height || !colorHex) return;
    const pIdx = ry * this.width + rx;
    
    // Depth test
    if (z < this.zBuffer[pIdx]) return;
    
    const { r, g, b, a } = parseHex(colorHex);
    const idx = pIdx * 4;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
    this.matTags[pIdx] = matTag;
    this.zBuffer[pIdx] = z;
  }

  getPixel(x, y) {
    const rx = Math.round(x), ry = Math.round(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height) return null;
    const idx = (ry * this.width + rx) * 4;
    if (this.data[idx + 3] === 0) return null;
    return toHex(this.data[idx], this.data[idx + 1], this.data[idx + 2]);
  }

  fillRect(x, y, w, h, colorHex, matTag = 1, z = 0) {
    const x0 = Math.max(0, Math.round(x)), x1 = Math.min(this.width, Math.round(x + w));
    const y0 = Math.max(0, Math.round(y)), y1 = Math.min(this.height, Math.round(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, colorHex, matTag, z);
      }
    }
  }

  line(x0, y0, x1, y1, colorHex, matTag = 1, z = 0) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, px = Math.round(x0), py = Math.round(y0);
    const tx = Math.round(x1), ty = Math.round(y1);
    let guard = 0;
    while (guard++ < 256) {
      this.setPixel(px, py, colorHex, matTag, z);
      if (px === tx && py === ty) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; px += sx; }
      if (e2 < dx) { err += dx; py += sy; }
    }
  }

  ellipse(cx, cy, rx, ry, colorHex, matTag = 1, z = 0) {
    const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
    for (let y = -ryi; y <= ryi; y++) {
      const term = 1 - (y * y) / (ry * ry);
      if (term < 0) continue;
      const w = Math.round(rx * Math.sqrt(term));
      this.fillRect(cx - w, cy + y, w * 2 + 1, 1, colorHex, matTag, z);
    }
  }

  // Downsample high-res canvas to native resolution, preserving outlines and structure
  downsample(targetW, targetH) {
    const out = new PixelCanvas(targetW, targetH);
    const scaleX = this.width / targetW;
    const scaleY = this.height / targetH;
    
    for (let y = 0; y < targetH; y++) {
      for (let x = 0; x < targetW; x++) {
        const srcX = Math.floor(x * scaleX);
        const srcY = Math.floor(y * scaleY);
        
        // Sample block
        let rSum = 0, gSum = 0, bSum = 0, hits = 0;
        let maxZ = -9999;
        let domMatTag = 0;
        
        for (let sy = 0; sy < scaleY; sy++) {
          for (let sx = 0; sx < scaleX; sx++) {
            const px = srcX + sx;
            const py = srcY + sy;
            if (px >= this.width || py >= this.height) continue;
            
            const idx = (py * this.width + px) * 4;
            if (this.data[idx+3] > 0) {
              rSum += this.data[idx];
              gSum += this.data[idx+1];
              bSum += this.data[idx+2];
              hits++;
              const z = this.zBuffer[py * this.width + px];
              if (z > maxZ) {
                maxZ = z;
                domMatTag = this.matTags[py * this.width + px];
              }
            }
          }
        }
        
        if (hits > (scaleX * scaleY * 0.3)) { // Threshold for keeping a pixel
          const r = Math.round(rSum / hits);
          const g = Math.round(gSum / hits);
          const b = Math.round(bSum / hits);
          out.setPixel(x, y, toHex(r, g, b), domMatTag, maxZ);
        }
      }
    }
    return out;
  }

  toCanvas() {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = this.width;
    c.height = this.height;
    const ctx = c.getContext('2d');
    const imgData = ctx.createImageData(this.width, this.height);
    imgData.data.set(this.data);
    ctx.putImageData(imgData, 0, 0);
    return c;
  }
}

// ---------------- High-Level Art Primitives ---------------- //

function drawCluster(c, cx, cy, rx, ry, ramp, z = 0, lightDirection = 'UL') {
  const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
  for (let y = -ryi; y <= ryi; y++) {
    const term = 1 - (y * y) / (ry * ry);
    if (term < 0) continue;
    const halfW = Math.round(rx * Math.sqrt(term));
    for (let x = -halfW; x <= halfW; x++) {
      const distRatio = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
      if (distRatio > 1.0) continue;

      const lightProj = lightDirection === 'UL'
        ? (-x / rx * 0.6 - y / ry * 0.7)
        : (x / rx * 0.6 - y / ry * 0.7);

      let toneIdx = 3;
      if (lightProj > 0.55 && distRatio < 0.65) toneIdx = 6;
      else if (lightProj > 0.35) toneIdx = 5;
      else if (lightProj > 0.10) toneIdx = 4;
      else if (lightProj < -0.45) toneIdx = 0;
      else if (lightProj < -0.20) toneIdx = 1;
      else if (lightProj < 0) toneIdx = 2;

      c.setPixel(cx + x, cy + y, ramp[toneIdx], 2, z);
    }
  }
}

function drawCurvedLock(c, x0, y0, x1, y1, width, ramp, dir = 0, z = 0) {
  const steps = Math.max(8, Math.abs(y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + (dir < 0 ? -4 : 4)) + t * t * x1;
    const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + (y1 - y0) * 0.5) + t * t * y1;
    const curW = Math.max(1, Math.round(width * (1 - t * 0.65)));

    c.fillRect(bx - Math.floor(curW / 2), by, curW, 1, ramp[i < steps*0.2 ? 1 : 3], 2, z);
    if (i >= steps*0.2 && i <= steps*0.6 && curW >= 2) {
      c.setPixel(bx - Math.floor(curW / 2), by, ramp[5], 2, z+1);
    }
  }
}

function drawHand(c, x, y, skinRamp, state = 'open', z = 0) {
  if (state === 'fist') {
    c.fillRect(x - 1, y, 3, 3, skinRamp[2], 2, z);
    c.setPixel(x - 1, y, skinRamp[4], 2, z); 
    c.setPixel(x + 1, y + 2, skinRamp[0], 2, z); 
  } else {
    c.fillRect(x - 1, y, 3, 4, skinRamp[3], 2, z);
    c.fillRect(x - 1, y + 2, 1, 2, skinRamp[4], 2, z+1); // Thumb/Index 
    c.setPixel(x + 1, y + 3, skinRamp[1], 2, z); // Pinky shade
  }
}

function drawBoot(c, x, y, dir, ramp, z = 0) {
  c.fillRect(x, y - 2, 4, 3, ramp[2], 4, z); // ankle
  c.fillRect(x, y - 1, 1, 2, ramp[4], 4, z+1); // heel highlight
  if (dir === 2) {
    // left facing
    c.fillRect(x - 2, y, 4, 2, ramp[3], 4, z);
    c.setPixel(x - 2, y, ramp[5], 4, z+1); // toe glint
  } else if (dir === 3) {
    // right facing
    c.fillRect(x, y, 4, 2, ramp[3], 4, z);
    c.setPixel(x + 3, y, ramp[5], 4, z+1);
  } else {
    // front/back
    c.fillRect(x, y, 4, 2, ramp[3], 4, z);
    c.fillRect(x + 1, y, 2, 1, ramp[5], 4, z+1);
  }
}
function drawAfroClusters(c, cx, cy, rx, ry, ramp, z = 0) {
  const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
  for (let y = -ryi; y <= ryi; y += 2) {
    const term = 1 - (y * y) / (ry * ry);
    if (term < 0) continue;
    const halfW = Math.round(rx * Math.sqrt(term));
    for (let x = -halfW; x <= halfW; x += 2) {
      const distRatio = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
      if (distRatio > 1.05) continue;
      // Dithered cluster index based on grid and position
      const n = ((x ^ (y * 3)) & 3);
      const lightProj = (-x / rx * 0.6 - y / ry * 0.7);
      let toneIdx = 1;
      if (lightProj > 0.3) toneIdx = n === 0 ? 4 : 3;
      else if (lightProj > 0.0) toneIdx = n === 0 ? 3 : 2;
      else toneIdx = n === 0 ? 1 : 0;
      
      c.fillRect(cx + x, cy + y, 2, 2, ramp[toneIdx], 2, z);
    }
  }
}

function drawBevelBox(c, x, y, w, h, baseRamp, z = 0) {
  // Beveled rectangular block with highlight at top/left and shadow at bottom/right
  c.fillRect(x, y, w, h, baseRamp[3], 4, z);
  // Top highlight
  c.fillRect(x, y, w, 1, baseRamp[5], 4, z + 1);
  // Left highlight
  c.fillRect(x, y, 1, h, baseRamp[4], 4, z + 1);
  // Right shadow
  c.fillRect(x + w - 1, y, 1, h, baseRamp[1], 4, z + 1);
  // Bottom dark shadow
  c.fillRect(x, y + h - 1, w, 1, baseRamp[0], 4, z + 1);
}

function drawGlint(c, x, y, color = '#ffffff', z = 100) {
  c.setPixel(x, y, color, 5, z);
}

function drawGauntlet(c, x, y, w, h, ramp, z = 0) {
  c.fillRect(x - Math.floor(w/2), y, w, h, ramp[3], 4, z);
  // Cuff highlight & fold
  c.fillRect(x - Math.floor(w/2) - 1, y, w + 2, 2, ramp[4], 4, z + 1);
  c.fillRect(x - Math.floor(w/2), y + h - 2, w, 2, ramp[1], 4, z + 1);
}

function drawLimbCylinder(c, x0, y0, x1, y1, radius, ramp, z = 0, hasMuscleBulge = false) {
  const steps = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.round(x0 + (x1 - x0) * t);
    const cy = Math.round(y0 + (y1 - y0) * t);
    // Muscle bulge in the middle (bicep / calf)
    const bulge = hasMuscleBulge ? Math.sin(t * Math.PI) * 2.5 : 0;
    const r = Math.round(radius + bulge);
    
    // Horizontal or perpendicular scanline
    for (let dx = -r; dx <= r; dx++) {
      const dist = Math.abs(dx) / r;
      // Cylindrical light projection: key light from left (dx < 0 is highlight)
      let tone = 3;
      if (dx < -r * 0.4) tone = 5; // Highlight
      else if (dx < 0) tone = 4;   // Mid-light
      else if (dx > r * 0.5) tone = 1; // Shadow
      else if (dx > r * 0.2) tone = 2; // Mid-dark
      c.setPixel(cx + dx, cy, ramp[tone], 2, z);
    }
  }
}

function drawFabricFolds(c, x, y, w, h, ramp, z = 0) {
  // Renders subtle diagonal wrinkle folds on cloth
  for (let i = 0; i < w; i++) {
    const foldOffset = Math.sin((x + i) * 0.4) * 1.5;
    c.setPixel(x + i, Math.round(y + foldOffset), ramp[4], 3, z + 1);
    c.setPixel(x + i, Math.round(y + foldOffset + 1), ramp[1], 3, z + 1);
  }
}
function applySelectiveOutline(c) {
  const tagToTone = {
    1: '#2a1e16', // default dark organic
    2: '#3a1216', // hair/skin dark organic
    3: '#1a2238', // cloth cool dark
    4: '#160e08', // leather/boot dark
    5: '#5e4b44'  // light element outline (pale)
  };
  
  const w = c.width, h = c.height;
  const newData = new Uint8ClampedArray(c.data);
  const getAlpha = (x, y) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return 0;
    return c.data[(y * w + x) * 4 + 3];
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (c.data[idx + 3] === 0) {
        // Find adjacent solid pixel to steal matTag
        let bestTag = 0;
        if (getAlpha(x-1, y) > 0) bestTag = c.matTags[y * w + (x-1)];
        else if (getAlpha(x+1, y) > 0) bestTag = c.matTags[y * w + (x+1)];
        else if (getAlpha(x, y-1) > 0) bestTag = c.matTags[(y-1) * w + x];
        else if (getAlpha(x, y+1) > 0) bestTag = c.matTags[(y+1) * w + x];
        
        if (bestTag > 0) {
          const {r, g, b} = parseHex(tagToTone[bestTag] || '#111118');
          newData[idx] = r;
          newData[idx+1] = g;
          newData[idx+2] = b;
          newData[idx+3] = 255; // Set solid
        }
      }
    }
  }
  c.data = newData;
}

const VisualPrimitives = {
  PixelCanvas,
  makeRamp,
  drawCluster,
  drawCurvedLock,
  drawAfroClusters,
  drawBevelBox,
  drawGlint,
  drawGauntlet,
  drawLimbCylinder,
  drawFabricFolds,
  drawHand,
  drawBoot,
  applySelectiveOutline,
  parseHex,
  toHex,
  shade,
  mix
};

if (typeof window !== 'undefined') {
  Object.assign(window, VisualPrimitives);
  window.VP = VisualPrimitives;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = VisualPrimitives;
}
