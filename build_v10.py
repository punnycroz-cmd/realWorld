#!/usr/bin/env python3
"""build_v10.py — natura-v9.html -> natura-v10.html (the living character art compiler).

Patches natura-v9.html -> natura-v10.html:
  - Injects the high-fidelity procedural character art engine:
    * Visual Primitives (7-tone ramps, volumetric clusters, cloth folds, selective outlines)
    * CharacterDNA DSL & deterministic procedural generator
    * Animation System (6-frame walk cycle, poses, kinematics)
    * CharacterVisualState Adapter (connects living body & weather to visuals)
    * CharacterCache (sub-microsecond cached canvas blitting)
  - Patches vMoveTo to track facing direction and walk phase
  - Patches drawSoul in render() to draw living characters while keeping full fallback
  - Leaves 100% of simulation, AI brains, memory, perception, and networking (nv.py) intact
"""
import re, sys

SRC = 'natura-v9.html'
DST = 'natura-v10.html'

s = open(SRC, encoding='utf-8').read()
n0 = len(s)

def rep(old, new, count=1):
    global s
    found = s.count(old)
    assert found == count, f'expected {count}x, found {found}x: {old[:80]!r}'
    s = s.replace(old, new)

# ----------------- 1. Art Engine Bundle -----------------
ART_BUNDLE = r'''
/* ================= NATURA CHARACTER ART COMPILER (v10) ================= */
// Universal Pixel Canvas, Visual Primitives, CharacterDNA, Animation System,
// CharacterVisualState Adapter, and High-Performance Frame Cache.

const _ART_VP = (function(){
  function parseHex(hex) {
    if (!hex || hex[0] !== '#') return { r: 0, g: 0, b: 0, a: 255 };
    let h = hex.slice(1);
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 255 };
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
    return toHex(cA.r * (1 - t) + cB.r * t, cA.g * (1 - t) + cB.g * t, cA.b * (1 - t) + cB.b * t);
  }
  function makeRamp(baseHex) {
    return [
      mix(shade(baseHex, 0.35), '#1a2238', 0.40),
      mix(shade(baseHex, 0.55), '#262d48', 0.25),
      shade(baseHex, 0.78),
      baseHex,
      mix(shade(baseHex, 1.15), '#fff0cc', 0.25),
      mix(shade(baseHex, 1.35), '#fff8e4', 0.45),
      mix('#ffffff', baseHex, 0.20)
    ];
  }
  class PixelCanvas {
    constructor(width, height) {
      this.width = width; this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
      this.matTags = new Uint8Array(width * height);
    }
    setPixel(x, y, colorHex, matTag = 1) {
      const rx = Math.round(x), ry = Math.round(y);
      if (rx < 0 || rx >= this.width || ry < 0 || ry >= this.height || !colorHex) return;
      const { r, g, b, a } = parseHex(colorHex);
      const idx = (ry * this.width + rx) * 4;
      this.data[idx] = r; this.data[idx + 1] = g; this.data[idx + 2] = b; this.data[idx + 3] = a;
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
      for (let py = y0; py < y1; py++)
        for (let px = x0; px < x1; px++) this.setPixel(px, py, colorHex, matTag);
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
      const c = document.createElement('canvas');
      c.width = this.width; c.height = this.height;
      const ctx2 = c.getContext('2d');
      const imgData = ctx2.createImageData(this.width, this.height);
      imgData.data.set(this.data);
      ctx2.putImageData(imgData, 0, 0);
      return c;
    }
  }

  function drawCluster(c, cx, cy, rx, ry, ramp, lightDirection = 'UL') {
    const rxi = Math.ceil(rx), ryi = Math.ceil(ry);
    for (let y = -ryi; y <= ryi; y++) {
      const term = 1 - (y * y) / (ry * ry);
      if (term < 0) continue;
      const halfW = Math.round(rx * Math.sqrt(term));
      for (let x = -halfW; x <= halfW; x++) {
        const distRatio = Math.sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry));
        if (distRatio > 1.0) continue;
        const lightProj = lightDirection === 'UL' ? (-x / rx * 0.6 - y / ry * 0.7) : (x / rx * 0.6 - y / ry * 0.7);
        let toneIdx = 3;
        if (lightProj > 0.55 && distRatio < 0.65) toneIdx = 6;
        else if (lightProj > 0.35) toneIdx = 5;
        else if (lightProj > 0.10) toneIdx = 4;
        else if (lightProj < -0.45) toneIdx = 0;
        else if (lightProj < -0.20) toneIdx = 1;
        else if (lightProj < 0) toneIdx = 2;
        c.setPixel(cx + x, cy + y, ramp[toneIdx], 2);
      }
    }
  }

  function drawCurvedLock(c, x0, y0, x1, y1, width, ramp, dir = 0) {
    const steps = 8;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * (x0 + (dir < 0 ? -2 : 2)) + t * t * x1;
      const by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + (y1 - y0) * 0.5) + t * t * y1;
      const curW = Math.max(1, Math.round(width * (1 - t * 0.65)));
      c.fillRect(bx - Math.floor(curW / 2), by, curW, 1, ramp[i < 2 ? 1 : 3], 2);
      if (i >= 2 && i <= 5 && curW >= 2) c.setPixel(bx - Math.floor(curW / 2), by, ramp[5], 2);
    }
  }

  function drawFaceFeatures(c, faceBox, faceDNA, blink = false, openMouth = false, dir = 0) {
    const skinRamp = makeRamp(faceDNA.skinRampKey === 'deep' ? '#c47d4e' : (faceDNA.skinRampKey === 'light' ? '#f2be9b' : '#dda078'));
    if (dir === 1) return;
    const eyeY = faceBox.centerY - 1;
    const mouthY = faceBox.centerY + 2;

    if (dir === 0) {
      const leftEyeX = 13, rightEyeX = 18;
      const browY = eyeY - 2;
      const browCol = faceDNA.facialHair === 'long_grey_beard' ? '#7b808c' : '#241a14';
      c.fillRect(leftEyeX, browY, 2, 1, browCol, 2);
      c.fillRect(rightEyeX, browY, 2, 1, browCol, 2);
      if (blink) {
        c.fillRect(leftEyeX, eyeY, 2, 1, '#1b1b22', 2);
        c.fillRect(rightEyeX, eyeY, 2, 1, '#1b1b22', 2);
      } else {
        c.setPixel(leftEyeX, eyeY, '#f0f4f8', 2);
        c.setPixel(leftEyeX + 1, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
        c.setPixel(leftEyeX, eyeY - 1, '#ffffff', 2);
        c.setPixel(leftEyeX + 1, eyeY - 1, '#1b1b22', 2);
        c.setPixel(rightEyeX + 1, eyeY, '#f0f4f8', 2);
        c.setPixel(rightEyeX, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
        c.setPixel(rightEyeX, eyeY - 1, '#ffffff', 2);
        c.setPixel(rightEyeX + 1, eyeY - 1, '#1b1b22', 2);
      }
      c.setPixel(16, eyeY + 1, skinRamp[1], 2);
      c.setPixel(15, eyeY + 1, skinRamp[4], 2);
      if (openMouth) { c.fillRect(15, mouthY, 3, 2, '#481919', 2); c.setPixel(16, mouthY + 1, skinRamp[4], 2); }
      else c.fillRect(15, mouthY, 3, 1, skinRamp[1], 2);
      if (faceDNA.blushIntensity > 0.2) {
        const blushCol = faceDNA.skinRampKey === 'deep' ? '#b85642' : '#f28f8f';
        c.setPixel(leftEyeX - 1, eyeY + 1, blushCol, 2);
        c.setPixel(rightEyeX + 2, eyeY + 1, blushCol, 2);
      }
    } else {
      const eyeX = 13;
      c.fillRect(eyeX, eyeY - 2, 2, 1, '#241a14', 2);
      if (blink) c.fillRect(eyeX, eyeY, 2, 1, '#1b1b22', 2);
      else {
        c.setPixel(eyeX, eyeY, faceDNA.eyeColor || '#2b3d4f', 2);
        c.setPixel(eyeX + 1, eyeY, '#f0f4f8', 2);
        c.setPixel(eyeX, eyeY - 1, '#ffffff', 2);
        c.setPixel(eyeX + 1, eyeY - 1, '#1b1b22', 2);
      }
      c.setPixel(eyeX - 1, eyeY + 1, skinRamp[4], 2);
      c.setPixel(eyeX, eyeY + 1, skinRamp[1], 2);
      if (openMouth) c.fillRect(eyeX - 1, mouthY, 2, 2, '#481919', 2);
      else c.fillRect(eyeX - 1, mouthY, 2, 1, skinRamp[1], 2);
    }
  }

  function drawBoot(c, x, y, dir, leatherRamp) {
    c.fillRect(x, y, 4, 3, leatherRamp[3], 4);
    c.fillRect(x + 3, y, 1, 3, leatherRamp[1], 4);
    if (dir === 2) {
      c.fillRect(x - 2, y + 2, 6, 2, leatherRamp[2], 4);
      c.fillRect(x - 2, y + 3, 6, 1, leatherRamp[0], 4);
      c.setPixel(x - 1, y + 2, leatherRamp[5], 4);
    } else if (dir === 3) {
      c.fillRect(x, y + 2, 6, 2, leatherRamp[2], 4);
      c.fillRect(x, y + 3, 6, 1, leatherRamp[0], 4);
      c.setPixel(x + 4, y + 2, leatherRamp[5], 4);
    } else {
      c.fillRect(x - 1, y + 2, 5, 2, leatherRamp[2], 4);
      c.fillRect(x - 1, y + 3, 5, 1, leatherRamp[0], 4);
      c.fillRect(x, y + 2, 2, 1, leatherRamp[4], 4);
    }
  }

  function drawHand(c, x, y, skinRamp, gripState = 'open') {
    if (gripState === 'fist' || gripState === 'grip') {
      c.fillRect(x, y, 3, 3, skinRamp[3], 2);
      c.fillRect(x + 2, y, 1, 3, skinRamp[1], 2);
      c.setPixel(x, y, skinRamp[5], 2);
    } else {
      c.fillRect(x, y, 3, 3, skinRamp[3], 2);
      c.setPixel(x, y + 3, skinRamp[4], 2);
      c.setPixel(x + 1, y + 3, skinRamp[2], 2);
    }
  }

  function drawTool(c, toolName, handX, handY, angle = 0, state = 'idle') {
    const woodRamp = makeRamp('#946028');
    const ironRamp = makeRamp('#616675');
    if (toolName === 'felling_axe') {
      c.line(handX, handY - 8, handX, handY + 6, woodRamp[3], 5);
      c.line(handX + 1, handY - 8, handX + 1, handY + 6, woodRamp[1], 5);
      c.fillRect(handX - 3, handY - 8, 4, 3, ironRamp[3], 5);
      c.fillRect(handX - 4, handY - 9, 2, 5, ironRamp[4], 5);
      c.setPixel(handX - 4, handY - 9, '#ffffff', 5);
    } else if (toolName === 'hoe') {
      c.line(handX, handY - 7, handX + 1, handY + 7, woodRamp[3], 5);
      c.fillRect(handX - 2, handY + 7, 5, 2, ironRamp[3], 5);
      c.fillRect(handX - 2, handY + 8, 5, 1, ironRamp[5], 5);
    } else if (toolName === 'crosscut_saw') {
      c.fillRect(handX, handY - 2, 4, 3, woodRamp[3], 5);
      c.fillRect(handX + 3, handY - 1, 9, 2, ironRamp[4], 5);
      for (let i = 0; i < 9; i += 2) c.setPixel(handX + 3 + i, handY + 1, ironRamp[1], 5);
    } else if (toolName === 'hunting_bow') {
      c.line(handX, handY - 8, handX - 2, handY, woodRamp[3], 5);
      c.line(handX - 2, handY, handX, handY + 8, woodRamp[3], 5);
      c.line(handX, handY - 8, handX, handY + 8, '#dcdcdc', 5);
    } else if (toolName === 'walking_staff') {
      c.line(handX, handY - 10, handX, handY + 9, woodRamp[2], 5);
      c.setPixel(handX, handY - 11, woodRamp[4], 5);
    }
  }

  function applySelectiveOutline(c) {
    const w = c.width, h = c.height;
    const src = new Uint8ClampedArray(c.data);
    const hasOpaque = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        if (src[idx + 3] === 0) {
          let adjX = -1, adjY = -1;
          if (hasOpaque(x + 1, y)) { adjX = x + 1; adjY = y; }
          else if (hasOpaque(x - 1, y)) { adjX = x - 1; adjY = y; }
          else if (hasOpaque(x, y + 1)) { adjX = x; adjY = y + 1; }
          else if (hasOpaque(x, y - 1)) { adjX = x; adjY = y - 1; }
          if (adjX !== -1) {
            const adjIdx = (adjY * w + adjX) * 4;
            const ar = src[adjIdx], ag = src[adjIdx + 1], ab = src[adjIdx + 2];
            const outR = Math.max(12, Math.round(ar * 0.32));
            const outG = Math.max(10, Math.round(ag * 0.30));
            const outB = Math.max(16, Math.round(ab * 0.36 + 4));
            c.setPixel(x, y, toHex(outR, outG, outB), 0);
          }
        }
      }
    }
  }

  function applyConditionEffects(c, condition) {
    if (!condition) return;
    if (condition.wetness > 0.15) {
      const wFactor = 1.0 - condition.wetness * 0.28;
      for (let i = 0; i < c.data.length; i += 4) {
        if (c.data[i + 3] > 0 && c.matTags[i / 4] >= 3) {
          c.data[i] = Math.round(c.data[i] * wFactor);
          c.data[i + 1] = Math.round(c.data[i + 1] * wFactor);
          c.data[i + 2] = Math.round(c.data[i + 2] * wFactor);
        }
      }
      c.setPixel(14, 18, '#ffffff', 2); c.setPixel(18, 19, '#ffffff', 2);
    }
    if (condition.dirt > 0.2) {
      const mudHex = '#3c2414', mudShade = '#241408';
      for (let y = c.height - 7; y < c.height - 2; y++) {
        for (let x = 11; x <= 21; x++) {
          if (c.getPixel(x, y)) {
            if ((x * 7 + y * 13) % 3 === 0) c.setPixel(x, y, mudHex, 4);
            else if ((x * 11 + y * 5) % 5 === 0) c.setPixel(x, y, mudShade, 4);
          }
        }
      }
    }
    if (condition.injury > 0.25) {
      const bandageRamp = makeRamp('#e2ddd0');
      c.fillRect(10, 24, 3, 2, bandageRamp[4], 3);
      c.fillRect(10, 26, 3, 1, bandageRamp[2], 3);
      c.setPixel(11, 25, '#7a1c1c', 3);
    }
  }

  return {
    makeRamp, PixelCanvas, drawCluster, drawCurvedLock, drawFaceFeatures,
    drawBoot, drawHand, drawTool, applySelectiveOutline, applyConditionEffects
  };
})();

/* ---- Animation Kinematics ---- */
const _ART_AS = {
  getPose(act = 'idle', frame = 0, dir = 0, condition = {}, age = 30) {
    const pose = {
      act, frame, dir, comBobY: 0, torsoTiltX: 0, headBobY: 0, headBobX: 0,
      blink: false, mouthOpen: false,
      armLeft: { x: 10, y: 26, up: false }, armRight: { x: 22, y: 26, up: false },
      legLeft: { x: 12, y: 42, footY: 42 }, legRight: { x: 20, y: 42, footY: 42 },
      tool: { active: false }, carriedItem: condition.carryingItem || null,
      sitting: false, sleeping: false
    };
    const fatigue = condition.fatigue || 0;
    const fatigueSlump = fatigue > 0.6 ? 1 : 0;
    pose.torsoTiltX += fatigueSlump; pose.headBobY += fatigueSlump;
    if (condition.cold > 0.5) pose.comBobY += (frame % 2 === 0 ? 0 : 1);

    if (act === 'walk') {
      const f = frame % 6;
      const bobY = [0, 1, -1, 0, 1, -1];
      pose.comBobY += bobY[f];
      pose.headBobY += (f === 1 || f === 4 ? 1 : 0);
      if (dir === 2 || dir === 3) {
        const stride = [-3, -1, 2, 3, 1, -2];
        const armSwing = [3, 1, -2, -3, -1, 2];
        pose.legLeft.footY = (f === 1 || f === 4) ? 41 : 42;
        pose.legLeft.x = 16 + stride[f]; pose.legRight.x = 16 - stride[f];
        pose.armLeft.x = 16 + armSwing[f]; pose.armRight.x = 16 - armSwing[f];
      } else {
        if (f === 1 || f === 2) pose.legLeft.footY = 41;
        else if (f === 4 || f === 5) pose.legRight.footY = 41;
        const swing = [-2, -1, 1, 2, 1, -1];
        pose.armLeft.y = 26 - swing[f]; pose.armRight.y = 26 + swing[f];
      }
    } else if (act === 'idle') {
      const f = frame % 4;
      pose.comBobY += (f === 1 || f === 2 ? -1 : 0);
      pose.blink = (f === 2);
    } else if (act === 'work') {
      const f = frame % 4;
      pose.tool.active = true;
      if (f === 0) { pose.armRight.y = 18; pose.armRight.up = true; pose.comBobY += -1; }
      else if (f === 1) { pose.armRight.y = 24; }
      else if (f === 2) { pose.armRight.y = 28; pose.comBobY += 1; }
      else { pose.armRight.y = 25; }
    } else if (act === 'talk') {
      const f = frame % 4;
      pose.mouthOpen = (f === 1 || f === 3);
      if (f === 1) { pose.armLeft.y = 22; pose.armLeft.up = true; }
    } else if (act === 'sit') {
      pose.sitting = true; pose.comBobY += 6;
      pose.legLeft.footY = 40; pose.legRight.footY = 40;
      pose.armLeft.y = 28; pose.armRight.y = 28;
      pose.blink = (frame % 4 === 1);
    } else if (act === 'sleep') {
      pose.sleeping = true; pose.comBobY += 12; pose.blink = true;
    } else if (act === 'drink') {
      pose.comBobY += 4; pose.armLeft.y = 27; pose.armRight.y = 27; pose.headBobY += 2;
    }
    return pose;
  }
};

/* ---- CharacterDNA ---- */
class _ART_DNA {
  constructor(data) { Object.assign(this, data); }
  static fromVillager(v) {
    const seed = typeof v.id === 'number' ? v.id * 10007 : 42;
    const name = v.name || 'Villager';
    const sex = v.sex === 'F' ? 'feminine' : (v.sex === 'M' ? 'masculine' : 'androgynous');
    const age = typeof v.age === 'number' ? v.age : 30;
    const colors = v.colors || {};

    let anatomyArchetype = 'average_build';
    let heightScale = 1.0, widthScale = 1.0;
    let shoulderWidth = sex === 'masculine' ? 12 : 10;
    if (age < 7) {
      anatomyArchetype = 'child'; heightScale = 0.65; widthScale = 0.7; shoulderWidth = 6;
    } else if (age < 16) {
      anatomyArchetype = 'teenager'; heightScale = 0.85; widthScale = 0.85; shoulderWidth = 8;
    } else if (age > 58) {
      anatomyArchetype = 'elder'; heightScale = 0.95; widthScale = 0.95; shoulderWidth = 10;
    }

    let skinRampKey = 'tan';
    if (colors.skin) {
      if (colors.skin.includes('e8') || colors.skin.includes('f2') || colors.skin.includes('f5')) skinRampKey = 'light';
      else if (colors.skin.includes('c9') || colors.skin.includes('a8')) skinRampKey = 'deep';
    }

    let hairColorKey = 'brown';
    if (age > 60) hairColorKey = 'grey';
    else if (colors.hair) {
      const h = colors.hair.toLowerCase();
      if (h.includes('d4') || h.includes('e8') || h.includes('c7')) hairColorKey = 'blonde';
      else if (h.includes('a3') || h.includes('72')) hairColorKey = 'auburn';
      else if (h.includes('1') || h.includes('2') || h.includes('3')) hairColorKey = 'black';
    }

    let clothingArchetype = 'simple_worker';
    let heldTool = null;
    if (name === 'Tomas') { clothingArchetype = 'simple_worker'; heldTool = 'felling_axe'; }
    else if (name === 'Marta') { clothingArchetype = 'farmer'; heldTool = 'hoe'; }
    else if (name === 'Sanna') { clothingArchetype = 'craftsman'; heldTool = 'crosscut_saw'; }
    else if (name === 'Petr') { clothingArchetype = 'hunter'; heldTool = 'hunting_bow'; }

    let hairStyle = sex === 'feminine' ? 'long' : 'short';
    if (name === 'Marta') hairStyle = 'braided';
    else if (name === 'Sanna') hairStyle = 'tied';
    else if (name === 'Petr') hairStyle = 'messy';
    else if (age > 65) hairStyle = 'bald';

    let facialHair = null;
    if (sex === 'masculine' && age >= 20) {
      if (age > 55) facialHair = 'long_grey_beard';
      else if (name === 'Tomas') facialHair = 'full_beard';
    }

    const palette = {
      shirt: colors.dress || '#35633f',
      pants: '#25395c',
      boots: '#422810',
      vest: clothingArchetype === 'farmer' ? '#7e512f' : null,
      apron: (clothingArchetype === 'craftsman' || clothingArchetype === 'farmer') ? '#c2baa8' : null,
      cloak: clothingArchetype === 'hunter' ? '#24452c' : null,
      hat: colors.hat || (clothingArchetype === 'farmer' ? '#cfa23e' : null)
    };

    return new _ART_DNA({
      id: `dna_${v.id || seed}_${name.toLowerCase()}`,
      name, seed, ageYears: age, genderPresentation: sex,
      anatomy: { archetype: anatomyArchetype, heightScale, widthScale, shoulderWidth },
      face: { shape: 'oval', skinRampKey, eyeColor: '#2b3d4f', facialHair, blushIntensity: age < 12 ? 0.6 : 0.2 },
      hair: { style: hairStyle, colorRampKey: hairColorKey },
      clothing: { archetype: clothingArchetype, layers: { trousersOrSkirt: sex === 'feminine' && age > 14 ? 'skirt' : 'trousers' } },
      palette, heldTool, condition: {}
    });
  }

  hashIdentity() {
    const s = `${this.id}:${this.anatomy.shoulderWidth}:${this.face.skinRampKey}:${this.face.facialHair}:${this.hair.style}:${this.hair.colorRampKey}:${this.clothing.archetype}:${this.palette.shirt}:${this.palette.hat}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 0x01000193) >>> 0; }
    return h.toString(16).padStart(8, '0');
  }
}

/* ---- Character Generator ---- */
const _ART_CG = {
  renderFrame(dna, dir = 0, act = 'idle', frame = 0, condition = {}) {
    const c = new _ART_VP.PixelCanvas(32, 48);
    const cond = Object.assign({}, dna.condition || {}, condition || {});
    const pose = _ART_AS.getPose(act, frame, dir, cond, dna.ageYears);

    const skinRamp = _ART_VP.makeRamp(dna.face.skinRampKey === 'deep' ? '#995634' : (dna.face.skinRampKey === 'light' ? '#dda078' : '#c47d4e'));
    const hairRamp = _ART_VP.makeRamp(
      dna.hair.colorRampKey === 'blonde' ? '#c7923e' : (dna.hair.colorRampKey === 'auburn' ? '#9c3d2e' :
      (dna.hair.colorRampKey === 'grey' ? '#7b808c' : (dna.hair.colorRampKey === 'black' ? '#22222a' : '#5a331c')))
    );
    const shirtRamp = _ART_VP.makeRamp(dna.palette.shirt || '#35633f');
    const pantsRamp = _ART_VP.makeRamp(dna.palette.pants || '#25395c');
    const bootRamp = _ART_VP.makeRamp(dna.palette.boots || '#422810');
    const apronRamp = dna.palette.apron ? _ART_VP.makeRamp(dna.palette.apron) : null;
    const vestRamp = dna.palette.vest ? _ART_VP.makeRamp(dna.palette.vest) : null;
    const hatRamp = dna.palette.hat ? _ART_VP.makeRamp(dna.palette.hat) : null;

    const anat = dna.anatomy;
    const isChild = dna.ageYears < 7;
    const isTeen = dna.ageYears >= 7 && dna.ageYears < 16;
    const heightScale = anat.heightScale || 1.0;
    const widthScale = anat.widthScale || 1.0;
    const bobY = pose.comBobY;

    const groundY = 43;
    const totalHeight = Math.round(32 * heightScale);
    const headCenterY = Math.round(groundY - totalHeight + 4 + bobY + pose.headBobY);
    const neckY = headCenterY + 3;
    const torsoY = headCenterY + 4;
    const hipY = Math.round(torsoY + Math.round((totalHeight - 8) * 0.44));
    const shW = Math.max(6, Math.round((anat.shoulderWidth || 10) * widthScale));
    const halfShW = Math.floor(shW / 2);

    if (!pose.sleeping) c.ellipse(16, 45, isChild ? 4 : (halfShW + 1), 2, 'rgba(16, 12, 8, 0.28)', 0);

    if (pose.sleeping) {
      c.fillRect(6, 32, 20, 10, pantsRamp[2], 3);
      c.fillRect(6, 30, 8, 5, '#e3dcd0', 3);
      c.ellipse(10, 29, 4, 4, skinRamp[3], 2);
      c.ellipse(10, 27, 4, 3, hairRamp[3], 2);
      c.fillRect(9, 29, 2, 1, '#1b1b22', 2);
      c.fillRect(24, 35, 4, 4, bootRamp[2], 4);
      _ART_VP.applySelectiveOutline(c);
      return c;
    }

    // Back Hair
    if (dna.hair.style === 'long' || dna.hair.style === 'braided' || dir === 1) {
      const hairLen = dna.hair.style === 'long' ? 14 : (dna.hair.style === 'braided' ? 12 : 8);
      c.fillRect(16 - halfShW + 1, headCenterY - 4, (halfShW - 1) * 2, hairLen, hairRamp[1], 2);
      if (dna.hair.style === 'braided') {
        c.fillRect(11, headCenterY + 4, 2, 8, hairRamp[2], 2);
        c.fillRect(19, headCenterY + 4, 2, 8, hairRamp[2], 2);
        c.setPixel(11, headCenterY + 12, '#96333c', 2); c.setPixel(19, headCenterY + 12, '#96333c', 2);
      }
    }

    // Legs / Skirt
    const isSkirt = dna.clothing.layers && dna.clothing.layers.trousersOrSkirt === 'skirt';
    if (isSkirt && dir !== 2 && dir !== 3) {
      const skirtW = halfShW + 2;
      for (let y = hipY; y <= 40 + bobY; y++) {
        const prog = (y - hipY) / (40 + bobY - hipY);
        const w = Math.round(skirtW * (0.8 + 0.4 * prog));
        c.fillRect(16 - w, y, w * 2, 1, pantsRamp[3], 3);
        c.fillRect(16 + w - 2, y, 2, 1, pantsRamp[1], 3);
      }
      c.fillRect(16 - skirtW, 40 + bobY, skirtW * 2, 1, pantsRamp[4], 3);
      _ART_VP.drawBoot(c, 12, 41 + bobY, dir, bootRamp);
      _ART_VP.drawBoot(c, 18, 41 + bobY, dir, bootRamp);
    } else {
      const footLY = pose.legLeft.footY + bobY, footRY = pose.legRight.footY + bobY;
      const legLX = pose.legLeft.x, legRX = pose.legRight.x;
      if (dir === 2 || dir === 3) {
        c.fillRect(legLX - 2, hipY, 4, footLY - hipY, pantsRamp[3], 3);
        c.fillRect(legLX + 1, hipY, 1, footLY - hipY, pantsRamp[1], 3);
        _ART_VP.drawBoot(c, legLX - 2, footLY, dir, bootRamp);
        c.fillRect(legRX - 2, hipY, 3, footRY - hipY, pantsRamp[2], 3);
        _ART_VP.drawBoot(c, legRX - 2, footRY, dir, bootRamp);
      } else {
        c.fillRect(12, hipY, 3, footLY - hipY, pantsRamp[3], 3);
        c.fillRect(14, hipY, 1, footLY - hipY, pantsRamp[1], 3);
        _ART_VP.drawBoot(c, 11, footLY, dir, bootRamp);
        c.fillRect(18, hipY, 3, footRY - hipY, pantsRamp[3], 3);
        c.fillRect(20, hipY, 1, footRY - hipY, pantsRamp[1], 3);
        _ART_VP.drawBoot(c, 17, footRY, dir, bootRamp);
      }
    }

    // Torso with natural shoulder slope
    const torsoW = halfShW * 2;
    c.fillRect(16 - halfShW + 2, torsoY, (halfShW - 2) * 2, 1, shirtRamp[3], 3);
    c.fillRect(16 - halfShW + 1, torsoY + 1, (halfShW - 1) * 2, 1, shirtRamp[3], 3);
    c.fillRect(16 - halfShW, torsoY + 2, torsoW, hipY - torsoY - 1, shirtRamp[3], 3);
    c.setPixel(16, torsoY, skinRamp[2], 2);
    c.setPixel(16, torsoY + 1, '#f7f4ec', 3);
    c.fillRect(16 + halfShW - 2, torsoY + 2, 2, hipY - torsoY - 1, shirtRamp[1], 3);
    c.fillRect(16 - halfShW, torsoY + 2, 2, hipY - torsoY - 1, shirtRamp[4], 3);
    c.fillRect(16 - halfShW, hipY - 2, torsoW, 2, '#23160c', 3);
    c.setPixel(16, hipY - 2, '#edd06d', 5);

    if (vestRamp) {
      c.fillRect(16 - halfShW, torsoY + 2, 3, hipY - torsoY - 3, vestRamp[3], 3);
      c.fillRect(16 + halfShW - 3, torsoY + 2, 3, hipY - torsoY - 3, vestRamp[2], 3);
    }
    if (apronRamp && dir !== 1) {
      c.fillRect(16 - halfShW + 2, torsoY + 4, torsoW - 4, hipY - torsoY + 6, apronRamp[3], 3);
      c.fillRect(16 + halfShW - 4, torsoY + 4, 2, hipY - torsoY + 6, apronRamp[1], 3);
    }
    if (cond.pregnant > 60 && (dir === 2 || dir === 3)) {
      const swell = Math.min(4, Math.floor(cond.pregnant / 50));
      c.fillRect(16 - halfShW - swell, torsoY + 4, swell, 6, shirtRamp[3], 3);
    }

    // Arms
    const armLX = 16 - halfShW - 1, armRX = 16 + halfShW;
    const handLY = Math.min(hipY + 4, pose.armLeft.y + bobY), handRY = Math.min(hipY + 4, pose.armRight.y + bobY);
    if (dir === 2 || dir === 3) {
      c.fillRect(15, torsoY + 2, 3, handRY - torsoY - 1, shirtRamp[3], 3);
      _ART_VP.drawHand(c, 15, handRY, skinRamp, pose.tool.active ? 'fist' : 'open');
    } else {
      c.fillRect(armLX, torsoY + 2, 2, handLY - torsoY - 1, shirtRamp[3], 3);
      c.fillRect(armLX, torsoY + 2, 1, handLY - torsoY - 1, shirtRamp[4], 3);
      _ART_VP.drawHand(c, armLX, handLY, skinRamp, 'open');
      c.fillRect(armRX, torsoY + 2, 2, handRY - torsoY - 1, shirtRamp[3], 3);
      c.fillRect(armRX + 1, torsoY + 2, 1, handRY - torsoY - 1, shirtRamp[1], 3);
      _ART_VP.drawHand(c, armRX, handRY, skinRamp, pose.tool.active ? 'fist' : 'open');
    }

    // Head
    c.fillRect(15, neckY, 3, 2, skinRamp[1], 2);
    _ART_VP.drawCluster(c, 16, headCenterY, 4, 4, skinRamp, 'UL');

    // Face features
    const faceBox = { x0: 12, x1: 20, centerY: headCenterY };
    _ART_VP.drawFaceFeatures(c, faceBox, dna.face, pose.blink, pose.mouthOpen, dir);

    // Beard
    if (dna.face.facialHair === 'full_beard' || dna.face.facialHair === 'long_grey_beard') {
      const bLen = dna.face.facialHair === 'long_grey_beard' ? 5 : 3;
      c.fillRect(13, headCenterY + 2, 7, bLen, hairRamp[2], 2);
      c.fillRect(14, headCenterY + 2 + bLen, 5, 2, hairRamp[1], 2);
    } else if (dna.face.facialHair === 'mustache') {
      c.fillRect(14, headCenterY + 2, 5, 1, hairRamp[2], 2);
    }

    // Front Hair
    if (dir === 1) {
      c.fillRect(12, headCenterY - 5, 9, 8, hairRamp[3], 2);
      c.fillRect(17, headCenterY - 5, 4, 8, hairRamp[1], 2);
    } else {
      c.fillRect(12, headCenterY - 5, 9, 3, hairRamp[3], 2);
      c.setPixel(14, headCenterY - 5, hairRamp[5], 2); c.setPixel(15, headCenterY - 5, hairRamp[5], 2);
      if (dna.hair.style === 'bob') {
        c.fillRect(11, headCenterY - 3, 2, 6, hairRamp[2], 2);
        c.fillRect(20, headCenterY - 3, 2, 6, hairRamp[2], 2);
      } else if (dna.hair.style === 'tied') {
        c.fillRect(15, headCenterY - 7, 3, 2, hairRamp[2], 2);
        c.setPixel(16, headCenterY - 6, '#edd06d', 5);
      } else if (dna.hair.style === 'bald') {
        c.fillRect(11, headCenterY - 2, 2, 4, hairRamp[2], 2);
        c.fillRect(20, headCenterY - 2, 2, 4, hairRamp[2], 2);
      } else {
        _ART_VP.drawCurvedLock(c, 12, headCenterY - 4, 12, headCenterY + 1, 2, hairRamp, -1);
        _ART_VP.drawCurvedLock(c, 20, headCenterY - 4, 20, headCenterY + 1, 2, hairRamp, 1);
      }
    }

    // Hat
    if (hatRamp && dna.palette.hat) {
      c.fillRect(10, headCenterY - 5, 13, 2, hatRamp[3], 3);
      c.fillRect(13, headCenterY - 8, 7, 3, hatRamp[3], 3);
      c.fillRect(13, headCenterY - 6, 7, 1, '#8c2424', 3);
    }

    // Tools & Carrying
    if (dna.heldTool && !pose.sleeping) {
      const toolX = dir === 2 ? 15 : armRX;
      const toolY = dir === 2 ? handRY : handRY;
      _ART_VP.drawTool(c, dna.heldTool, toolX, toolY, 0, act);
    }
    if (cond.carryingItem === 'log' || (pose.carriedItem && pose.carriedItem.type === 'log')) {
      const woodRamp = _ART_VP.makeRamp('#8a5a38');
      c.fillRect(8, torsoY + 3, 16, 5, woodRamp[3], 5);
      c.fillRect(8, torsoY + 3, 16, 1, woodRamp[5], 5);
      c.fillRect(8, torsoY + 7, 16, 1, woodRamp[1], 5);
      c.ellipse(8, torsoY + 5, 2, 2, woodRamp[4], 5);
      c.ellipse(24, torsoY + 5, 2, 2, woodRamp[2], 5);
    }

    _ART_VP.applyConditionEffects(c, cond);
    _ART_VP.applySelectiveOutline(c);

    return c;
  }
};

/* ---- Character Visual State Adapter ---- */
const _ART_VIS = {
  adapt(v, env = {}) {
    const b = v.body || {};
    const job = v.job || {};
    const act = v.act || (job.kind ? job.kind : 'idle');

    let visualAct = 'idle';
    if (act === 'sleep' || job.kind === 'sleep') visualAct = 'sleep';
    else if (act === 'rest' || job.kind === 'rest') visualAct = 'sit';
    else if (act === 'drink' || job.kind === 'drink') visualAct = 'drink';
    else if (act === 'walk' || act === 'goto' || job.kind === 'goto') visualAct = 'walk';
    else if (act === 'say_to' || act === 'talk') visualAct = 'talk';
    else if (['fell', 'saw', 'craft', 'till', 'plant', 'harvest', 'forage', 'fish', 'hunt', 'haul'].includes(act) ||
             ['fell', 'saw', 'craft', 'till', 'plant', 'harvest', 'forage', 'fish', 'hunt', 'haul'].includes(job.kind)) {
      visualAct = 'work';
    }

    let dir = 0;
    if (v._dir != null) dir = v._dir;
    else if (v._lastX != null && v._lastY != null) {
      const dx = v.x - v._lastX, dy = v.y - v._lastY;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
      }
    }

    const rawFatigue = b.fatigue || (v.energy != null ? 1 - v.energy : 0);
    const qFatigue = rawFatigue > 0.75 ? 2 : (rawFatigue > 0.45 ? 1 : 0);
    const coreTemp = b.coreTemp || 37.0;
    const qCold = coreTemp < 35.5 ? 2 : (coreTemp < 36.2 ? 1 : 0);
    const qFever = coreTemp > 38.0 ? 1 : 0;
    const isRaining = (env.rain || 0) > 0.15;
    const isGroundWet = env.groundWet > 0.6 || env.wet;
    let qWet = 0;
    if (isRaining && (env.rain || 0) > 0.4) qWet = 2;
    else if (isRaining || isGroundWet) qWet = 1;

    let qDirt = 0;
    if (visualAct === 'work' && (act === 'till' || act === 'forage' || isGroundWet)) qDirt = isGroundWet ? 2 : 1;

    const qInjury = (b.injury || 0) > 0.3 ? 1 : 0;
    const qIllness = (b.illness || 0) > 0.35 ? 1 : 0;

    let carryingItem = null;
    if (v.carry && v.carry.length > 0) {
      const top = v.carry[0];
      carryingItem = typeof top === 'string' ? top : (top.type || 'log');
    } else if (job.kind === 'haul' || act === 'haul') {
      carryingItem = 'log';
    }

    const pregnant = v.pregnant || 0;
    const conditionKey = `f${qFatigue}_c${qCold}_v${qFever}_w${qWet}_d${qDirt}_i${qInjury}_p${pregnant > 60 ? 1 : 0}_h${carryingItem || 0}`;

    return {
      act: visualAct, dir, conditionKey,
      condition: {
        fatigue: qFatigue * 0.5, cold: qCold * 0.5, fever: qFever,
        wetness: qWet * 0.5, dirt: qDirt * 0.5, injury: qInjury,
        illness: qIllness, pregnant, carryingItem
      }
    };
  }
};

/* ---- Runtime High-Performance Frame Cache ---- */
const CharacterCache = {
  frames: new Map(),
  dnaMap: new Map(),
  getDNA(v) {
    let dna = this.dnaMap.get(v.id);
    if (!dna) {
      dna = _ART_DNA.fromVillager(v);
      this.dnaMap.set(v.id, dna);
    }
    return dna;
  },
  getFrame(v, env, nowMs) {
    const dna = this.getDNA(v);
    const vis = _ART_VIS.adapt(v, env);

    let animFrame = 0;
    if (vis.act === 'walk') animFrame = Math.floor(((v._walkT || 0) + (nowMs / 120)) % 6);
    else if (vis.act === 'idle') animFrame = Math.floor(((v.id * 17) + (nowMs / 240)) % 4);
    else if (vis.act === 'work') animFrame = Math.floor((nowMs / 150) % 4);
    else if (vis.act === 'talk') animFrame = Math.floor((nowMs / 140) % 4);
    else if (vis.act === 'sit') animFrame = Math.floor((nowMs / 400) % 2);
    else if (vis.act === 'sleep') animFrame = Math.floor((nowMs / 600) % 2);
    else if (vis.act === 'drink') animFrame = Math.floor((nowMs / 200) % 4);

    const cacheKey = `${dna.hashIdentity()}_${vis.dir}_${vis.act}_${animFrame}_${vis.conditionKey}`;
    let cvs = this.frames.get(cacheKey);
    if (!cvs) {
      const pCanvas = _ART_CG.renderFrame(dna, vis.dir, vis.act, animFrame, vis.condition);
      cvs = pCanvas.toCanvas();
      this.frames.set(cacheKey, cvs);
    }
    return { canvas: cvs, dir: vis.dir, act: vis.act };
  }
};
window.CharacterCache = CharacterCache;
'''

# ----------------- 2. Replace Title -----------------
rep("<title>Natura v9 — the living body</title>", "<title>Natura v10 — living character art compiler</title>")

# ----------------- 3. Inject Art Bundle before render() -----------------
rep("function darkness(){", ART_BUNDLE + "\nfunction darkness(){")

# ----------------- 4. Patch vMoveTo to track facing direction and walk phase -----------------
rep("""function vMoveTo(v,tx,ty,dtH){
  const dx=tx-v.x, dy=ty-v.y, d=Math.hypot(dx,dy);
  const step=v.speed()*dtH*(v.energy<0.2?0.55:1);
  if(d<=step){ v.x=tx; v.y=ty; return true; }
  v.x+=dx/d*step; v.y+=dy/d*step; return false;
}""",
"""function vMoveTo(v,tx,ty,dtH){
  const dx=tx-v.x, dy=ty-v.y, d=Math.hypot(dx,dy);
  const step=v.speed()*dtH*(v.energy<0.2?0.55:1);
  if(d<=step){ v.x=tx; v.y=ty; return true; }
  v._lastX=v.x; v._lastY=v.y;
  v._walkT=(v._walkT||0)+dtH*16;
  if(Math.abs(dx)>Math.abs(dy)) v._dir=dx<0?2:3;
  else v._dir=dy<0?1:0;
  v.x+=dx/d*step; v.y+=dy/d*step; return false;
}""")

# ----------------- 5. Patch drawSoul to use the high-fidelity CharacterCache -----------------
OLD_DRAW_SOUL = r'''    const drawSoul=(x,y,colors,scale,label,sub)=>{
      const p=w2s(x,y), u=cam.zoom*scale, cxp=p.x, cyp=p.y;
      if(cxp<-30||cyp<-30||cxp>cw+30||cyp>chh+30) return;
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(cxp,cyp+6*u,7*u,2.6*u,0,0,7); ctx.fill();
      ctx.fillStyle=colors.dress;
      ctx.fillRect(cxp-4*u,cyp-4*u,8*u,10*u);
      ctx.fillStyle=colors.skin;
      ctx.beginPath(); ctx.arc(cxp,cyp-8*u,4.4*u,0,7); ctx.fill();
      ctx.fillStyle=colors.hair;
      ctx.beginPath(); ctx.arc(cxp,cyp-9*u,4.4*u,Math.PI,0); ctx.fill();
      if(colors.hat){
        ctx.fillStyle=colors.hat;
        ctx.beginPath(); ctx.ellipse(cxp,cyp-9*u,7*u,2.6*u,0,0,7); ctx.fill();
      }
      if(label&&cam.zoom>1.4){
        ctx.fillStyle='rgba(240,235,220,0.9)'; ctx.font=`${11}px sans-serif`;
        ctx.textAlign='center'; ctx.fillText(label,cxp,cyp-16*u); ctx.textAlign='left';
      }
      if(sub){ ctx.fillStyle='#dfe6f2'; ctx.font=`${10*u}px sans-serif`; ctx.fillText(sub,cxp+8*u,cyp-14*u); }
    };
    for(const v of villagers){
      const hasBaby=children.some(ch=>ch.motherId===v.id&&ch.age<2);
      drawSoul(v.x,v.y,v.colors,v.age<14?0.62:1,v.name,
        v.act==='sleep'?'z':(v.pregnant>0?'+':'')+(hasBaby?'•':''));
    }
    for(const ch of children){
      if(ch.age<2) continue;
      const m=vById(ch.motherId);
      drawSoul(ch.x,ch.y+4,ch.colors,ch.age<14?0.45+ch.age*0.02:0.62,ch.name||'…',null);
    }'''

NEW_DRAW_SOUL = r'''    const drawSoul=(x,y,colors,scale,label,sub,vObj)=>{
      const p=w2s(x,y), u=cam.zoom*scale, cxp=p.x, cyp=p.y;
      if(cxp<-40||cyp<-40||cxp>cw+40||cyp>chh+40) return;
      if(vObj && window.CharacterCache){
        const env=window.bodyEnv?window.bodyEnv(vObj):{};
        const frameData=window.CharacterCache.getFrame(vObj,env,performance.now());
        const spr=frameData.canvas;
        if(spr){
          ctx.imageSmoothingEnabled=false;
          const dw=32*u, dh=48*u;
          ctx.drawImage(spr,Math.round(cxp-16*u),Math.round(cyp-42*u),Math.round(dw),Math.round(dh));
          if(label&&cam.zoom>1.2){
            ctx.fillStyle='rgba(240,235,220,0.92)'; ctx.font=`${11}px sans-serif`;
            ctx.textAlign='center'; ctx.fillText(label,cxp,cyp-44*u); ctx.textAlign='left';
          }
          if(sub){ ctx.fillStyle='#dfe6f2'; ctx.font=`${10*u}px sans-serif`; ctx.fillText(sub,cxp+10*u,cyp-40*u); }
          return;
        }
      }
      // fallback
      ctx.fillStyle='rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(cxp,cyp+6*u,7*u,2.6*u,0,0,7); ctx.fill();
      ctx.fillStyle=colors.dress;
      ctx.fillRect(cxp-4*u,cyp-4*u,8*u,10*u);
      ctx.fillStyle=colors.skin;
      ctx.beginPath(); ctx.arc(cxp,cyp-8*u,4.4*u,0,7); ctx.fill();
      ctx.fillStyle=colors.hair;
      ctx.beginPath(); ctx.arc(cxp,cyp-9*u,4.4*u,Math.PI,0); ctx.fill();
      if(colors.hat){
        ctx.fillStyle=colors.hat;
        ctx.beginPath(); ctx.ellipse(cxp,cyp-9*u,7*u,2.6*u,0,0,7); ctx.fill();
      }
      if(label&&cam.zoom>1.4){
        ctx.fillStyle='rgba(240,235,220,0.9)'; ctx.font=`${11}px sans-serif`;
        ctx.textAlign='center'; ctx.fillText(label,cxp,cyp-16*u); ctx.textAlign='left';
      }
      if(sub){ ctx.fillStyle='#dfe6f2'; ctx.font=`${10*u}px sans-serif`; ctx.fillText(sub,cxp+8*u,cyp-14*u); }
    };
    for(const v of villagers){
      const hasBaby=children.some(ch=>ch.motherId===v.id&&ch.age<2);
      drawSoul(v.x,v.y,v.colors,v.age<14?0.62:1,v.name,
        v.act==='sleep'?'z':(v.pregnant>0?'+':'')+(hasBaby?'•':''), v);
    }
    for(const ch of children){
      if(ch.age<2) continue;
      drawSoul(ch.x,ch.y+4,ch.colors,ch.age<14?0.45+ch.age*0.02:0.62,ch.name||'…',null, ch);
    }'''

rep(OLD_DRAW_SOUL, NEW_DRAW_SOUL)

open(DST, 'w', encoding='utf-8').write(s)
print(f'Compiled {SRC} ({n0} bytes) -> {DST} ({len(s)} bytes)')
print('Natura v10 character art compiler successfully integrated!')
