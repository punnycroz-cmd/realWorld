/**
 * Natura Visual Primitive Library (Phase 4)
 * High-performance, deterministic pixel-art rendering primitives.
 * Works seamlessly in both Node.js (via mockable buffer) and Browser (HTML5 Canvas).
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

/**
 * 7-tone mathematically balanced material ramp from base color.
 * [0]=occlusion (cool), [1]=shadow, [2]=mid-dark, [3]=base, [4]=mid-light (warm), [5]=highlight, [6]=specular
 */
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

/**
 * PixelCanvas: universal pixel manipulation buffer.
 */
class PixelCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4); // RGBA
    // Material tag buffer for selective outlining (records material category)
    this.matTags = new Uint8Array(width * height);
  }

  setPixel(x, y, colorHex, matTag = 1) {
    const rx = Math.round(x), ry = Math.round(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height || !colorHex) return;
    const { r, g, b, a } = parseHex(colorHex);
    const idx = (ry * this.width + rx) * 4;
    this.data[idx] = r;
    this.data[idx + 1] = g;
    this.data[idx + 2] = b;
    this.data[idx + 3] = a;
    this.matTags[ry * this.width + rx] = matTag;
  }

  getPixel(x, y) {
    const rx = Math.round(x), ry = Math.round(y);
    if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height) return null;
    const idx = (ry * this.width + rx) * 4;
    if (this.data[idx + 3] === 0) return null;
    return toHex(this.data[idx], this.data[idx + 1], this.data[idx + 2]);
  }

  fillRect(x, y, w, h, colorHex, matTag = 1) {
    const x0 = Math.max(0, Math.round(x)), x1 = Math.min(this.width, Math.round(x + w));
    const y0 = Math.max(0, Math.round(y)), y1 = Math.min(this.height, Math.round(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        this.setPixel(px, py, colorHex, matTag);
      }
    }
  }

  line(x0, y0, x1, y1, colorHex, matTag = 1) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy, px = Math.round(x0), py = Math.round(y0);
    const tx = Math.round(x1), ty = Math.round(y1);
    let guard = 0;
    while (guard++ < 256) {
      this.setPixel(px, py, colorHex, matTag);
      if (px === tx && py === ty) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; px += sx; }
      if (e2 < dx) { err += dx; py += sy; }
    }
  }

  ellipse(cx, cy, rx, ry, colorHex, matTag = 1) {
    const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
    for (let y = -ryi; y <= ryi; y++) {
      const term = 1 - (y * y) / (ry * ry);
      if (term < 0) continue;
      const w = Math.round(rx * Math.sqrt(term));
      this.fillRect(cx - w, cy + y, w * 2 + 1, 1, colorHex, matTag);
    }
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

/**
 * Renders a volumetric sculpted cluster (e.g. hair lock, head sphere, shoulder cap).
 */
function drawCluster(c, cx, cy, rx, ry, ramp, lightDirection = 'UL') {
  const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
  for (let y = -ryi; y <= ryi; y++) {
    const term = 1 - (y * y) / (ry * ry);
    if (term < 0) continue;
    const halfW = Math.round(rx * Math.sqrt(term));
    for (let x = -halfW; x <= halfW; x++) {
      const distRatio = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
      if (distRatio > 1.0) continue;

      // Project along key light vector (UL = -1, -1)
      const lightProj = lightDirection === 'UL'
        ? (-x / rx * 0.6 - y / ry * 0.7)
        : (x / rx * 0.6 - y / ry * 0.7);

      let toneIdx = 3; // base
      if (lightProj > 0.55 && distRatio < 0.65) toneIdx = 6; // specular
      else if (lightProj > 0.35) toneIdx = 5;               // highlight
      else if (lightProj > 0.10) toneIdx = 4;               // mid-light
      else if (lightProj < -0.45) toneIdx = 0;              // occlusion
      else if (lightProj < -0.20) toneIdx = 1;              // shadow
      else if (lightProj < 0) toneIdx = 2;                  // mid-dark

      c.setPixel(cx + x, cy + y, ramp[toneIdx], 2);
    }
  }
}

/**
 * Draws a flowing curved hair lock with volumetric highlights.
 */
function drawCurvedLock(c, x0, y0, x1, y1, width, ramp, dir = 0) {
  const steps = 8;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Quadratic bezier with organic outward curve
    const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + (dir < 0 ? -2 : 2)) + t * t * x1;
    const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + (y1 - y0) * 0.5) + t * t * y1;
    const curW = Math.max(1, Math.round(width * (1 - t * 0.65)));

    // Dark root & core
    c.fillRect(bx - Math.floor(curW / 2), by, curW, 1, ramp[i < 2 ? 1 : 3], 2);
    // Crest highlight
    if (i >= 2 && i <= 5 && curW >= 2) {
      c.setPixel(bx - Math.floor(curW / 2), by, ramp[5], 2);
    }
  }
}

/**
 * Draws realistic textile folds (elbows, waist, knees).
 */
function drawClothFold(c, x, y, len, angle, tension, ramp) {
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad), dy = Math.sin(rad);
  // Deep crease line
  for (let i = 0; i < len; i++) {
    c.setPixel(x + i * dx, y + i * dy, ramp[1], 3);
  }
  // Highlighted ridge beside crease
  if (tension > 0.3) {
    for (let i = 1; i < len - 1; i++) {
      c.setPixel(x + i * dx, y + i * dy - 1, ramp[4], 3);
    }
  }
}

/**
 * Draws expressive face features (eyes, nose, mouth).
 */
function drawFaceFeatures(c, faceBox, faceDNA, blink = false, openMouth = false, dir = 0) {
  const { skinRampKey } = faceDNA;
  const skinRamp = makeRamp(skinRampKey === 'deep' ? '#c47d4e' : (skinRampKey === 'light' ? '#f2be9b' : '#dda078'));

  if (dir === 1) return; // Back view: face occluded

  const eyeY = faceBox.centerY - 1;
  const mouthY = faceBox.centerY + 2;

  if (dir === 0) {
    // Front View
    const leftEyeX = 13;
    const rightEyeX = 18;

    // Eyebrows
    const browY = eyeY - 2;
    const browCol = faceDNA.facialHair === 'long_grey_beard' ? '#7b808c' : '#241a14';
    c.fillRect(leftEyeX, browY, 2, 1, browCol, 2);
    c.fillRect(rightEyeX, browY, 2, 1, browCol, 2);

    // Eyes
    if (blink) {
      c.fillRect(leftEyeX, eyeY, 2, 1, '#1b1b22', 2);
      c.fillRect(rightEyeX, eyeY, 2, 1, '#1b1b22', 2);
    } else {
      // Left eye: Sclera + Iris + Sparkle
      c.setPixel(leftEyeX, eyeY, '#f0f4f8', 2);
      c.setPixel(leftEyeX + 1, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
      c.setPixel(leftEyeX, eyeY - 1, '#ffffff', 2); // Specular spark
      c.setPixel(leftEyeX + 1, eyeY - 1, '#1b1b22', 2); // Eyelid/upper iris

      // Right eye: Sclera + Iris + Sparkle
      c.setPixel(rightEyeX + 1, eyeY, '#f0f4f8', 2);
      c.setPixel(rightEyeX, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
      c.setPixel(rightEyeX, eyeY - 1, '#ffffff', 2); // Specular spark
      c.setPixel(rightEyeX + 1, eyeY - 1, '#1b1b22', 2); // Eyelid/upper iris
    }

    // Nose bridge
    c.setPixel(16, eyeY + 1, skinRamp[1], 2);
    c.setPixel(15, eyeY + 1, skinRamp[4], 2);

    // Mouth
    if (openMouth) {
      c.fillRect(15, mouthY, 3, 2, '#481919', 2);
      c.setPixel(16, mouthY + 1, skinRamp[4], 2); // lower lip highlight
    } else {
      c.fillRect(15, mouthY, 3, 1, skinRamp[1], 2);
    }

    // Cheek blush
    if (faceDNA.blushIntensity > 0.2) {
      const blushCol = skinRampKey === 'deep' ? '#b85642' : '#f28f8f';
      c.setPixel(leftEyeX - 1, eyeY + 1, blushCol, 2);
      c.setPixel(rightEyeX + 2, eyeY + 1, blushCol, 2);
    }
  } else {
    // Profile View (facing left; mirror if facing right)
    const eyeX = 13;
    c.fillRect(eyeX, eyeY - 2, 2, 1, '#241a14', 2);
    if (blink) {
      c.fillRect(eyeX, eyeY, 2, 1, '#1b1b22', 2);
    } else {
      c.setPixel(eyeX, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
      c.setPixel(eyeX + 1, eyeY, '#f0f4f8', 2);
      c.setPixel(eyeX, eyeY - 1, '#ffffff', 2);
      c.setPixel(eyeX + 1, eyeY - 1, '#1b1b22', 2);
    }
    // Nose
    c.setPixel(eyeX - 1, eyeY + 1, skinRamp[4], 2);
    c.setPixel(eyeX, eyeY + 1, skinRamp[1], 2);
    // Mouth
    if (openMouth) c.fillRect(eyeX - 1, mouthY, 2, 2, '#481919', 2);
    else c.fillRect(eyeX - 1, mouthY, 2, 1, skinRamp[1], 2);
  }
}

/**
 * Draws footwear / boots anchored at foot positions.
 */
function drawBoot(c, x, y, dir, leatherRamp) {
  // Upper boot shaft
  c.fillRect(x, y, 4, 3, leatherRamp[3], 4);
  c.fillRect(x + 3, y, 1, 3, leatherRamp[1], 4); // right side shadow
  // Sole & Toe
  if (dir === 2) {
    // Left profile: toe points left
    c.fillRect(x - 2, y + 2, 6, 2, leatherRamp[2], 4);
    c.fillRect(x - 2, y + 3, 6, 1, leatherRamp[0], 4); // sole
    c.setPixel(x - 1, y + 2, leatherRamp[5], 4);        // toe highlight
  } else if (dir === 3) {
    // Right profile: toe points right
    c.fillRect(x, y + 2, 6, 2, leatherRamp[2], 4);
    c.fillRect(x, y + 3, 6, 1, leatherRamp[0], 4);
    c.setPixel(x + 4, y + 2, leatherRamp[5], 4);
  } else {
    // Front view
    c.fillRect(x - 1, y + 2, 5, 2, leatherRamp[2], 4);
    c.fillRect(x - 1, y + 3, 5, 1, leatherRamp[0], 4);
    c.fillRect(x, y + 2, 2, 1, leatherRamp[4], 4);      // instep highlight
  }
}

/**
 * Draws hand gripping or resting.
 */
function drawHand(c, x, y, skinRamp, gripState = 'open') {
  if (gripState === 'fist' || gripState === 'grip') {
    c.fillRect(x, y, 3, 3, skinRamp[3], 2);
    c.fillRect(x + 2, y, 1, 3, skinRamp[1], 2); // shadow
    c.setPixel(x, y, skinRamp[5], 2);            // knuckle highlight
  } else {
    // Open relaxed hand
    c.fillRect(x, y, 3, 3, skinRamp[3], 2);
    c.setPixel(x, y + 3, skinRamp[4], 2); // thumb/finger separation
    c.setPixel(x + 1, y + 3, skinRamp[2], 2);
  }
}

/**
 * Draws tools held in hands (felling axe, hoe, saw, bow, staff).
 */
function drawTool(c, toolName, handX, handY, angle = 0, state = 'idle') {
  const woodRamp = makeRamp('#946028');
  const ironRamp = makeRamp('#616675');

  if (toolName === 'felling_axe') {
    // Haft
    c.line(handX, handY - 8, handX, handY + 6, woodRamp[3], 5);
    c.line(handX + 1, handY - 8, handX + 1, handY + 6, woodRamp[1], 5);
    // Axe head
    c.fillRect(handX - 3, handY - 8, 4, 3, ironRamp[3], 5);
    c.fillRect(handX - 4, handY - 9, 2, 5, ironRamp[4], 5); // bit/edge
    c.setPixel(handX - 4, handY - 9, '#ffffff', 5);         // edge sparkle
  } else if (toolName === 'hoe') {
    c.line(handX, handY - 7, handX + 1, handY + 7, woodRamp[3], 5);
    // Blade
    c.fillRect(handX - 2, handY + 7, 5, 2, ironRamp[3], 5);
    c.fillRect(handX - 2, handY + 8, 5, 1, ironRamp[5], 5);
  } else if (toolName === 'crosscut_saw') {
    // Saw blade & handle
    c.fillRect(handX, handY - 2, 4, 3, woodRamp[3], 5);
    c.fillRect(handX + 3, handY - 1, 9, 2, ironRamp[4], 5);
    for (let i = 0; i < 9; i += 2) c.setPixel(handX + 3 + i, handY + 1, ironRamp[1], 5); // teeth
  } else if (toolName === 'hunting_bow') {
    // Curved bow stave
    c.line(handX, handY - 8, handX - 2, handY, woodRamp[3], 5);
    c.line(handX - 2, handY, handX, handY + 8, woodRamp[3], 5);
    // String
    c.line(handX, handY - 8, handX, handY + 8, '#dcdcdc', 5);
  } else if (toolName === 'walking_staff') {
    c.line(handX, handY - 10, handX, handY + 9, woodRamp[2], 5);
    c.setPixel(handX, handY - 11, woodRamp[4], 5); // gnarled knob
  }
}

/**
 * Selective Color Outliner:
 * Inspects all transparent pixels touching an opaque pixel,
 * and sets their color to the cooled, darkened tone of the adjacent material.
 * This guarantees zero harsh pitch-black comic outlines.
 */
function applySelectiveOutline(c) {
  const w = c.width, h = c.height;
  const src = new Uint8ClampedArray(c.data);
  const tags = new Uint8Array(c.matTags);

  const hasOpaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      if (src[idx + 3] === 0) {
        // Transparent pixel: check 4-connected neighbors
        let adjX = -1, adjY = -1;
        if (hasOpaque(x + 1, y)) { adjX = x + 1; adjY = y; }
        else if (hasOpaque(x - 1, y)) { adjX = x - 1; adjY = y; }
        else if (hasOpaque(x, y + 1)) { adjX = x; adjY = y + 1; }
        else if (hasOpaque(x, y - 1)) { adjX = x; adjY = y - 1; }

        if (adjX !== -1) {
          const adjIdx = (adjY * w + adjX) * 4;
          const ar = src[adjIdx], ag = src[adjIdx + 1], ab = src[adjIdx + 2];
          // Tinted darkening: reduce brightness by 65%, add slight cool blue tone
          const outR = Math.max(12, Math.round(ar * 0.32));
          const outG = Math.max(10, Math.round(ag * 0.30));
          const outB = Math.max(16, Math.round(ab * 0.36 + 4));
          c.setPixel(x, y, toHex(outR, outG, outB), 0);
        }
      }
    }
  }
}

/**
 * Applies procedural condition overlays (wetness, mud, bandages, shivering).
 */
function applyConditionEffects(c, condition) {
  if (!condition) return;

  // 1. Wetness: darken pixels & add specular droplet sparkles
  if (condition.wetness > 0.15) {
    const wFactor = 1.0 - condition.wetness * 0.28;
    for (let i = 0; i < c.data.length; i += 4) {
      if (c.data[i + 3] > 0 && c.matTags[i / 4] >= 3) { // textiles
        c.data[i] = Math.round(c.data[i] * wFactor);
        c.data[i + 1] = Math.round(c.data[i + 1] * wFactor);
        c.data[i + 2] = Math.round(c.data[i + 2] * wFactor);
      }
    }
    // Water droplets
    c.setPixel(14, 18, '#ffffff', 2);
    c.setPixel(18, 19, '#ffffff', 2);
  }

  // 2. Mud: spatter clay tone on feet and hem
  if (condition.dirt > 0.2) {
    const mudHex = '#3c2414';
    const mudShade = '#241408';
    for (let y = c.height - 7; y < c.height - 2; y++) {
      for (let x = 11; x <= 21; x++) {
        if (c.getPixel(x, y)) {
          if ((x * 7 + y * 13) % 3 === 0) c.setPixel(x, y, mudHex, 4);
          else if ((x * 11 + y * 5) % 5 === 0) c.setPixel(x, y, mudShade, 4);
        }
      }
    }
  }

  // 3. Injury: bandage dressing on forearm or leg
  if (condition.injury > 0.25) {
    const bandageRamp = makeRamp('#e2ddd0');
    // Arm bandage at (x: 10..12, y: 24..26)
    c.fillRect(10, 24, 3, 2, bandageRamp[4], 3);
    c.fillRect(10, 26, 3, 1, bandageRamp[2], 3);
    c.setPixel(11, 25, '#7a1c1c', 3); // subtle bloodstain core
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseHex,
    toHex,
    shade,
    mix,
    makeRamp,
    PixelCanvas,
    drawCluster,
    drawCurvedLock,
    drawClothFold,
    drawFaceFeatures,
    drawBoot,
    drawHand,
    drawTool,
    applySelectiveOutline,
    applyConditionEffects
  };
}
