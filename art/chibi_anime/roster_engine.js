/**
 * Universal Chibi Anime Character Engine (Direction A - Golden Standard Roster)
 * 
 * Generates 7 authentic, rich character archetypes sharing the exact same
 * hand-sculpted Chibi Anime DNA, 64x64 frame, and artistic fidelity:
 * 1. 🌾 Farmer (Bác Nông Dân)
 * 2. 🥖 Baker (Cô Thợ Bánh)
 * 3. ⚒️ Blacksmith (Thợ Rèn Cường Tráng)
 * 4. 🛡️ Knight (Hiệp Sĩ Hoàng Gia)
 * 5. 🔮 Mage (Pháp Sư Huyền Bí)
 * 6. 🎣 Fisherman (Ngư Dân Biển Khơi)
 * 7. 🏹 Ranger (Cung Thủ Rừng Xanh)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const VP = require('../visual_primitives.js');
const { ChibiBlueprintEngine } = require('./chibi_blueprint_engine.js');

// Load golden blueprints
let bp = null;
try {
  const bpPath = path.join(__dirname, 'blueprint_components_64.json');
  if (fs.existsSync(bpPath)) {
    bp = JSON.parse(fs.readFileSync(bpPath, 'utf8'));
  }
} catch (e) {
  console.warn('Could not load blueprint_components_64.json:', e.message);
}

// Clean Anatomical Blueprint Components (isolated from shadows and stray clusters)
const cleanFarmerBoots = bp ? bp.farmer.boots.filter(p => p.y >= 50) : [];
const cleanFarmerPants = bp ? bp.farmer.pants.filter(p => p.y >= 43 && p.y <= 52) : [];
const cleanFarmerTorso = bp ? bp.farmer.torso.filter(p => p.y >= 25 && p.y <= 46) : [];

// Full Male Head: forehead (from hat) + lower face
const fullMaleHead = bp ? bp.farmer.head.filter(p => p.x >= 23 && p.x <= 38 && p.y >= 20) : [];
if (bp) {
  bp.farmer.hat.forEach(p => {
    if (p.x >= 24 && p.x <= 37 && p.y >= 13 && p.y <= 19) {
      fullMaleHead.push(p);
    }
  });
}

// Full Female Head (without twintails, allowing customized hairstyles)
const fullFemaleHead = [];
if (bp) {
  bp.baker.head.forEach(p => {
    if (p.x >= 25 && p.x <= 39 && p.y >= 16 && p.y <= 27) fullFemaleHead.push(p);
  });
  bp.baker.toque.forEach(p => {
    if (p.x >= 25 && p.x <= 39 && p.y >= 12 && p.y <= 15) fullFemaleHead.push(p);
  });
}

// Quadratic Bezier Helper
function getBezierPoint(p0, p1, p2, t) {
  const invT = 1 - t;
  const x = Math.round(invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x);
  const y = Math.round(invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y);
  return { x, y };
}

function drawBezier(c, p0, p1, p2, colorHex, thickness = 1, z = 0) {
  const steps = Math.max(16, Math.round(Math.hypot(p2.x - p0.x, p2.y - p0.y) * 1.5));
  for (let i = 0; i <= steps; i++) {
    const pt = getBezierPoint(p0, p1, p2, i / steps);
    c.fillRect(pt.x - Math.floor(thickness / 2), pt.y - Math.floor(thickness / 2), thickness, thickness, colorHex, 2, z);
  }
}

// Luminance Tonal Remapper: Preserves 100% of organic folds, lighting, and shadow details
function remapTonalColor(hex, ramp) {
  const { r, g, b } = VP.parseHex(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const idx = Math.min(ramp.length - 1, Math.max(0, lum * (ramp.length - 1)));
  const i0 = Math.floor(idx);
  const i1 = Math.ceil(idx);
  if (i0 === i1) return ramp[i0];
  const t = idx - i0;
  const c0 = VP.parseHex(ramp[i0]);
  const c1 = VP.parseHex(ramp[i1]);
  const nr = Math.round(c0.r * (1 - t) + c1.r * t);
  const ng = Math.round(c0.g * (1 - t) + c1.g * t);
  const nb = Math.round(c0.b * (1 - t) + c1.b * t);
  return '#' + ((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1);
}

// 7 Diverse Archetype Configurations
const ROSTER_CONFIGS = {
  farmer: {
    name: 'Bác Nông Dân',
    role: 'Farmer',
    icon: '🌾',
    base: 'farmer'
  },
  baker: {
    name: 'Cô Thợ Bánh',
    role: 'Baker',
    icon: '🥖',
    base: 'baker'
  },
  blacksmith: {
    name: 'Thợ Rèn Cường Tráng',
    role: 'Blacksmith',
    icon: '⚒️',
    base: 'farmer',
    shirtRamp: ['#1c1917', '#292524', '#44403c', '#57534e', '#78716c', '#a8a29e'],
    pantsRamp: ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'],
    bootsRamp: ['#180e08', '#2a1a10', '#3e281c', '#553928', '#6f4c37', '#8c6249'],
    apronRamp: ['#1c140e', '#2e1c12', '#452a1b', '#5c3924', '#784b30', '#96603e'],
    bandanaRamp: ['#450a0a', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171'],
    metalRamp: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff']
  },
  knight: {
    name: 'Hiệp Sĩ Hoàng Gia',
    role: 'Knight',
    icon: '🛡️',
    base: 'farmer',
    armorRamp: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'],
    pantsRamp: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
    bootsRamp: ['#0f172a', '#1e293b', '#334155', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'],
    goldRamp: ['#78350f', '#b45309', '#d97706', '#f59e0b', '#fef08a'],
    plumeRamp: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
  },
  mage: {
    name: 'Pháp Sư Huyền Bí',
    role: 'Mage',
    icon: '🔮',
    base: 'baker',
    robeRamp: ['#1e1035', '#2e1065', '#3b0764', '#581c87', '#6b21a8', '#7e22ce', '#a855f7', '#d8b4fe'],
    skinRamp: ['#3b180a', '#692812', '#df9575', '#fbc5b0', '#ffece6'],
    hairRamp: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#f1f5f9', '#ffffff'],
    goldRamp: ['#78350f', '#b45309', '#d97706', '#f59e0b', '#fef08a'],
    crystalRamp: ['#083344', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9', '#ffffff']
  },
  fisherman: {
    name: 'Ngư Dân Biển Khơi',
    role: 'Fisherman',
    icon: '🎣',
    base: 'farmer',
    wadersRamp: ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'],
    bootsRamp: ['#09090b', '#18181b', '#27272a', '#3f3f46', '#52525b', '#71717a'],
    hatRamp: ['#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fef08a'],
    fishRamp: ['#0e7490', '#06b6d4', '#22d3ee', '#67e8f9', '#ffffff']
  },
  ranger: {
    name: 'Cung Thủ Rừng Xanh',
    role: 'Ranger',
    icon: '🏹',
    base: 'baker',
    tunicRamp: ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80'],
    leatherRamp: ['#271306', '#451e08', '#632e0e', '#7c3f15', '#9a531e', '#bf763b'],
    hoodRamp: ['#052e16', '#14532d', '#166534', '#15803d', '#16a34a', '#22c55e'],
    hairRamp: ['#2c1404', '#5a2e0e', '#7c431a', '#9c5c2a', '#bf763b', '#dd9955']
  }
};

class UniversalChibiEngine {
  /**
   * Render any character in 64x64 frame with complete Direction A fidelity
   */
  static renderFrame(charKey = 'farmer', act = 'idle', frame = 0) {
    if (charKey === 'farmer' || charKey === 'baker') {
      return ChibiBlueprintEngine.renderFrame(charKey, act, frame);
    }

    const c = new VP.PixelCanvas(64, 64);
    const OUTLINE = '#140c06';
    const cfg = ROSTER_CONFIGS[charKey] || ROSTER_CONFIGS.blacksmith;
    const f = frame % 6;

    // Kinematic Skeletal Offsets
    let bobY = 0, leftFootLift = 0, rightFootLift = 0;
    if (act === 'idle') {
      bobY = (f === 1 || f === 2) ? 1 : 0;
    } else if (act === 'walk') {
      const stride = Math.sin(f * Math.PI / 3) * 2.5;
      if (stride > 0.5) { leftFootLift = Math.round(stride); bobY = -1; }
      else if (stride < -0.5) { rightFootLift = Math.round(-stride); bobY = -1; }
      else { bobY = 1; }
    } else if (act === 'action') {
      bobY = (f === 2 || f === 3) ? 1 : (f === 1 ? -1 : 0);
    }

    // Render Anatomical Blueprint Base with Tonal Remapping & Profession Gear
    if (charKey === 'blacksmith') {
      this.renderBlacksmith(c, act, f, bobY, leftFootLift, rightFootLift, cfg);
    } else if (charKey === 'knight') {
      this.renderKnight(c, act, f, bobY, leftFootLift, rightFootLift, cfg);
    } else if (charKey === 'mage') {
      this.renderMage(c, act, f, bobY, leftFootLift, rightFootLift, cfg);
    } else if (charKey === 'fisherman') {
      this.renderFisherman(c, act, f, bobY, leftFootLift, rightFootLift, cfg);
    } else if (charKey === 'ranger') {
      this.renderRanger(c, act, f, bobY, leftFootLift, rightFootLift, cfg);
    }

    // Dynamic Action Visual FX
    this.renderActionFX(c, charKey, act, f, bobY);

    // Reinforce crisp 1-pixel dark contour
    ChibiBlueprintEngine.reinforceOutline(c, OUTLINE);

    // Soft ground shadow rendered AFTER outline reinforcement
    const shadowCx = 35;
    c.ellipse(shadowCx, 59, 13, 3, 'rgba(40, 20, 15, 0.45)', 0, 0);

    return c;
  }

  // =========================================================================
  // HELPER: Render Clean Blueprint Pixels with Continuous Kinematics
  // =========================================================================
  static renderCleanPixels(c, pixels, ramp, midX, bobY, leftFootLift, rightFootLift, zIdx = 10) {
    pixels.forEach(p => {
      let dy = p.y;
      const dx = p.x;
      if (p.y >= 52) {
        const isLeft = (dx < midX);
        const lift = isLeft ? leftFootLift : rightFootLift;
        dy = p.y - lift;
      } else if (p.y >= 43) {
        const isLeft = (dx < midX);
        const lift = isLeft ? leftFootLift : rightFootLift;
        const t = (p.y - 43) / 9;
        dy = p.y + Math.round((1 - t) * bobY - t * lift);
      } else {
        dy = p.y + bobY;
      }
      if (dx >= 0 && dx < 64 && dy >= 0 && dy < 64) {
        const col = ramp ? remapTonalColor(p.col, ramp) : p.col;
        c.setPixel(dx, dy, col, 2, zIdx);
      }
    });
  }

  // =========================================================================
  // ⚒️ BLACKSMITH (Thợ Rèn Cường Tráng)
  // =========================================================================
  static renderBlacksmith(c, act, f, bobY, lLift, rLift, cfg) {
    this.renderCleanPixels(c, cleanFarmerBoots, cfg.bootsRamp, 35, bobY, lLift, rLift, 10);
    this.renderCleanPixels(c, cleanFarmerPants, cfg.pantsRamp, 35, bobY, lLift, rLift, 15);
    this.renderCleanPixels(c, cleanFarmerTorso, cfg.shirtRamp, 35, bobY, lLift, rLift, 20);
    this.renderCleanPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Leather Apron overlay
    for (let y = 30 + bobY; y <= 47 + bobY; y++) {
      const curW = y < 44 + bobY ? 14 : 12;
      const cx = 35;
      for (let x = cx - Math.floor(curW / 2); x <= cx + Math.floor(curW / 2); x++) {
        const edgeDist = Math.min(Math.abs(x - (cx - Math.floor(curW / 2))), Math.abs(x - (cx + Math.floor(curW / 2))));
        const col = edgeDist === 0 ? cfg.apronRamp[0] : (edgeDist === 1 ? cfg.apronRamp[2] : cfg.apronRamp[3]);
        c.setPixel(x, y, col, 3, 25);
      }
    }
    c.fillRect(32, 28 + bobY, 2, 4, cfg.apronRamp[1], 3, 26);
    c.fillRect(38, 28 + bobY, 2, 4, cfg.apronRamp[1], 3, 26);
    c.setPixel(32, 29 + bobY, '#f59e0b', 4, 27);
    c.setPixel(38, 29 + bobY, '#f59e0b', 4, 27);

    // Crimson Bandana & Spiky Hair
    for (let x = 24; x <= 38; x++) {
      c.setPixel(x, 14 + bobY, cfg.bandanaRamp[5], 3, 40);
      c.setPixel(x, 15 + bobY, cfg.bandanaRamp[4], 3, 40);
      c.setPixel(x, 16 + bobY, cfg.bandanaRamp[2], 3, 40);
    }
    c.fillRect(22, 14 + bobY, 3, 3, cfg.bandanaRamp[3], 4, 41);
    drawBezier(c, { x: 22, y: 15 + bobY }, { x: 19, y: 18 + bobY }, { x: 20, y: 22 + bobY }, cfg.bandanaRamp[4], 2, 42);
    // Hair tufts
    c.fillRect(26, 9 + bobY, 4, 5, '#542618', 3, 38);
    c.fillRect(31, 8 + bobY, 5, 6, '#7c3f15', 3, 38);
    c.fillRect(37, 10 + bobY, 4, 4, '#542618', 3, 38);

    // Sledgehammer
    if (act === 'action' && (f === 2 || f === 3)) {
      c.fillRect(45, 34 + bobY, 3, 14, '#451a03', 4, 80);
      c.fillRect(42, 46 + bobY, 9, 6, cfg.metalRamp[3], 4, 82);
      c.fillRect(42, 46 + bobY, 9, 2, cfg.metalRamp[6], 4, 83);
      c.fillRect(44, 30 + bobY, 4, 4, '#7c3f15', 4, 85);
    } else {
      c.fillRect(47, 18 + bobY, 3, 24, '#451a03', 4, 80);
      c.fillRect(44, 14 + bobY, 9, 6, cfg.metalRamp[3], 4, 82);
      c.fillRect(44, 14 + bobY, 9, 2, cfg.metalRamp[6], 4, 83);
      c.fillRect(43, 26 + bobY, 5, 5, '#7c3f15', 4, 85);
    }
  }

  // =========================================================================
  // 🛡️ KNIGHT (Hiệp Sĩ Hoàng Gia)
  // =========================================================================
  static renderKnight(c, act, f, bobY, lLift, rLift, cfg) {
    this.renderCleanPixels(c, cleanFarmerBoots, cfg.bootsRamp, 35, bobY, lLift, rLift, 10);
    this.renderCleanPixels(c, cleanFarmerPants, cfg.pantsRamp, 35, bobY, lLift, rLift, 15);
    this.renderCleanPixels(c, cleanFarmerTorso, cfg.armorRamp, 35, bobY, lLift, rLift, 20);
    this.renderCleanPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Gold Cross on breastplate
    c.fillRect(32, 33 + bobY, 7, 1, cfg.goldRamp[3], 3, 25);
    c.fillRect(35, 30 + bobY, 1, 7, cfg.goldRamp[3], 3, 25);
    // Pauldrons
    c.fillRect(25, 27 + bobY, 5, 5, cfg.armorRamp[5], 3, 26);
    c.fillRect(40, 27 + bobY, 5, 5, cfg.armorRamp[4], 3, 26);

    // Helmet Brow & Cheekguards
    c.fillRect(24, 13 + bobY, 16, 3, cfg.armorRamp[4], 3, 40);
    c.fillRect(24, 13 + bobY, 16, 1, cfg.armorRamp[6], 3, 41);
    c.fillRect(23, 16 + bobY, 3, 8, cfg.armorRamp[3], 3, 40);
    c.fillRect(39, 16 + bobY, 3, 8, cfg.armorRamp[3], 3, 40);

    // Blue Plume
    drawBezier(c, { x: 32, y: 13 + bobY }, { x: 27, y: 5 + bobY }, { x: 21, y: 4 + bobY }, cfg.plumeRamp[3], 3, 50);
    drawBezier(c, { x: 32, y: 13 + bobY }, { x: 27, y: 5 + bobY }, { x: 21, y: 4 + bobY }, cfg.plumeRamp[4], 1, 51);

    // Shield & Broadsword
    if (act === 'action' && (f === 2 || f === 3)) {
      c.fillRect(44, 28 + bobY, 5, 5, cfg.armorRamp[4], 4, 80);
    } else {
      // Royal Heater Shield (Left)
      for (let y = 27 + bobY; y <= 42 + bobY; y++) {
        const sw = y < 35 + bobY ? 9 : Math.max(3, 9 - (y - (35 + bobY)) * 1.4);
        c.fillRect(20 - Math.floor(sw / 2), y, sw, 1, '#1e3a8a', 4, 70);
      }
      c.fillRect(16, 27 + bobY, 9, 1, cfg.goldRamp[3], 4, 71);
      c.fillRect(20, 31 + bobY, 1, 7, cfg.goldRamp[3], 4, 72);
      c.fillRect(17, 34 + bobY, 7, 1, cfg.goldRamp[3], 4, 72);

      // Broadsword (Right)
      c.fillRect(45, 18 + bobY, 2, 22, cfg.armorRamp[5], 4, 80);
      c.fillRect(45, 18 + bobY, 1, 22, '#ffffff', 4, 81);
      c.fillRect(42, 30 + bobY, 8, 2, cfg.goldRamp[3], 4, 82);
      c.fillRect(45, 32 + bobY, 2, 4, '#451a03', 4, 83);
      c.setPixel(45, 36 + bobY, cfg.goldRamp[3], 4, 84);
      c.fillRect(44, 29 + bobY, 4, 4, cfg.armorRamp[4], 4, 85);
    }
  }

  // =========================================================================
  // 🔮 MAGE (Pháp Sư Huyền Bí)
  // =========================================================================
  static renderMage(c, act, f, bobY, lLift, rLift, cfg) {
    this.renderCleanPixels(c, cleanFarmerTorso, cfg.robeRamp, 35, bobY, lLift, rLift, 20);

    // Flowing Arcane Robe Skirt (y=40..56)
    for (let y = 40; y <= 56; y++) {
      const rw = Math.min(22, 13 + Math.round((y - 40) * 0.55));
      for (let x = 35 - Math.floor(rw / 2); x <= 35 + Math.floor(rw / 2); x++) {
        const edge = (x === 35 - Math.floor(rw / 2) || x === 35 + Math.floor(rw / 2));
        const col = edge ? cfg.robeRamp[1] : (Math.abs(x - 35) < 3 ? cfg.robeRamp[4] : cfg.robeRamp[2]);
        c.setPixel(x, y, col, 2, 15);
      }
    }
    c.fillRect(24, 56, 23, 2, cfg.goldRamp[3], 3, 16);
    c.fillRect(34, 30 + bobY, 2, 26, cfg.goldRamp[3], 3, 22);

    // Face: porcelain skin
    this.renderCleanPixels(c, fullFemaleHead, cfg.skinRamp, 31, bobY, lLift, rLift, 30);

    // Flowing Silver Hair
    for (let y = 16 + bobY; y <= 32 + bobY; y++) {
      c.fillRect(23, y, 4, 1, cfg.hairRamp[4], 3, 35);
      c.fillRect(24, y, 2, 1, cfg.hairRamp[6], 3, 36);
      c.fillRect(37, y, 4, 1, cfg.hairRamp[4], 3, 35);
      c.fillRect(38, y, 2, 1, cfg.hairRamp[6], 3, 36);
    }

    // Wizard Hat
    drawBezier(c, { x: 31, y: 13 + bobY }, { x: 33, y: 6 + bobY }, { x: 39, y: 2 + bobY }, cfg.robeRamp[3], 5, 50);
    drawBezier(c, { x: 31, y: 13 + bobY }, { x: 33, y: 6 + bobY }, { x: 39, y: 2 + bobY }, cfg.robeRamp[5], 2, 51);
    drawBezier(c, { x: 14, y: 15 + bobY }, { x: 31, y: 12 + bobY }, { x: 48, y: 14 + bobY }, cfg.robeRamp[2], 3, 52);
    drawBezier(c, { x: 14, y: 14 + bobY }, { x: 31, y: 11 + bobY }, { x: 48, y: 13 + bobY }, cfg.goldRamp[3], 1, 53);
    c.fillRect(30, 11 + bobY, 3, 3, cfg.goldRamp[4], 4, 54);

    // Staff & Crystal
    if (act === 'action' && (f === 2 || f === 3)) {
      c.fillRect(43, 28 + bobY, 4, 4, cfg.skinRamp[3], 4, 80);
    } else {
      c.fillRect(44, 14 + bobY, 2, 34, '#451a03', 4, 80);
      c.fillRect(42, 28 + bobY, 4, 4, cfg.skinRamp[3], 4, 81);
      c.ellipse(45, 12 + bobY, 3.5, 3.5, cfg.crystalRamp[2], 4, 85);
      c.ellipse(45, 12 + bobY, 2, 2, cfg.crystalRamp[4], 4, 86);
      c.setPixel(44, 11 + bobY, '#ffffff', 4, 87);
    }
  }

  // =========================================================================
  // 🎣 FISHERMAN (Ngư Dân Biển Khơi)
  // =========================================================================
  static renderFisherman(c, act, f, bobY, lLift, rLift, cfg) {
    this.renderCleanPixels(c, cleanFarmerBoots, cfg.bootsRamp, 35, bobY, lLift, rLift, 10);
    this.renderCleanPixels(c, cleanFarmerPants, cfg.wadersRamp, 35, bobY, lLift, rLift, 15);
    this.renderCleanPixels(c, cleanFarmerTorso, cfg.wadersRamp, 35, bobY, lLift, rLift, 20);
    this.renderCleanPixels(c, fullMaleHead, null, 35, bobY, lLift, rLift, 30);

    // Sailor Sweater
    c.fillRect(28, 28 + bobY, 14, 2, '#ffffff', 3, 22);
    c.fillRect(28, 30 + bobY, 14, 2, '#1d4ed8', 3, 23);
    c.fillRect(28, 32 + bobY, 14, 2, '#ffffff', 3, 22);

    // Wader Bib
    c.fillRect(30, 33 + bobY, 10, 8, cfg.wadersRamp[2], 3, 25);
    c.fillRect(31, 28 + bobY, 2, 6, cfg.wadersRamp[1], 3, 26);
    c.fillRect(37, 28 + bobY, 2, 6, cfg.wadersRamp[1], 3, 26);
    c.setPixel(31, 33 + bobY, '#f59e0b', 4, 27);
    c.setPixel(37, 33 + bobY, '#f59e0b', 4, 27);

    // Sou'wester Hat
    for (let y = 6 + bobY; y <= 13 + bobY; y++) {
      const hw = Math.round(7 + (y - (6 + bobY)) * 1.0);
      c.fillRect(35 - hw, y, hw * 2 + 1, 1, cfg.hatRamp[3], 3, 50);
    }
    c.fillRect(30, 7 + bobY, 10, 2, cfg.hatRamp[4], 3, 51);
    drawBezier(c, { x: 18, y: 15 + bobY }, { x: 35, y: 12 + bobY }, { x: 52, y: 14 + bobY }, cfg.hatRamp[2], 3, 52);

    // Rod & Fish
    if (act === 'action' && (f === 2 || f === 3)) {
      c.fillRect(44, 28 + bobY, 4, 4, '#f5b584', 4, 80);
    } else {
      c.fillRect(44, 28 + bobY, 4, 4, '#f5b584', 4, 80);
      drawBezier(c, { x: 46, y: 38 + bobY }, { x: 49, y: 22 + bobY }, { x: 56, y: 6 + bobY }, '#a16207', 2, 85);
      c.fillRect(56, 8 + bobY, 1, 20, '#ffffff', 4, 88);
      c.ellipse(56, 30 + bobY, 3.5, 2.5, cfg.fishRamp[1], 4, 90);
      c.setPixel(54, 30 + bobY, '#ffffff', 4, 91);
      c.setPixel(54, 30 + bobY, '#000000', 4, 92);
      c.fillRect(59, 29 + bobY, 2, 3, cfg.fishRamp[2], 4, 90);
      c.setPixel(56, 28 + bobY, cfg.fishRamp[3], 4, 91);
    }
  }

  // =========================================================================
  // 🏹 RANGER (Cung Thủ Rừng Xanh)
  // =========================================================================
  static renderRanger(c, act, f, bobY, lLift, rLift, cfg) {
    this.renderCleanPixels(c, cleanFarmerBoots, cfg.leatherRamp, 35, bobY, lLift, rLift, 10);
    this.renderCleanPixels(c, cleanFarmerPants, cfg.tunicRamp, 35, bobY, lLift, rLift, 15);
    this.renderCleanPixels(c, cleanFarmerTorso, cfg.tunicRamp, 35, bobY, lLift, rLift, 20);

    // Leather Corslet
    c.fillRect(31, 35 + bobY, 9, 5, cfg.leatherRamp[2], 3, 25);
    drawBezier(c, { x: 30, y: 29 + bobY }, { x: 35, y: 34 + bobY }, { x: 40, y: 39 + bobY }, cfg.leatherRamp[1], 2, 26);
    c.setPixel(35, 34 + bobY, '#f59e0b', 4, 27);

    // Face
    this.renderCleanPixels(c, fullFemaleHead, null, 31, bobY, lLift, rLift, 30);

    // Auburn Braid
    for (let y = 18 + bobY; y <= 32 + bobY; y++) {
      c.fillRect(23, y, 3, 1, cfg.hairRamp[3], 3, 35);
      c.setPixel(24, y, cfg.hairRamp[4], 3, 36);
    }
    c.fillRect(23, 32 + bobY, 3, 2, '#dc2626', 4, 37);

    // Hood & Feather
    drawBezier(c, { x: 31, y: 5 + bobY }, { x: 23, y: 9 + bobY }, { x: 21, y: 16 + bobY }, cfg.hoodRamp[2], 3, 50);
    drawBezier(c, { x: 31, y: 5 + bobY }, { x: 39, y: 9 + bobY }, { x: 41, y: 16 + bobY }, cfg.hoodRamp[2], 3, 50);
    c.fillRect(26, 6 + bobY, 10, 2, cfg.hoodRamp[4], 3, 51);
    c.fillRect(23, 2 + bobY, 2, 6, '#dc2626', 4, 55);

    // Recurve Bow
    if (act === 'action' && (f === 2 || f === 3)) {
      c.fillRect(44, 28 + bobY, 4, 4, '#fbc5b0', 4, 80);
    } else {
      c.fillRect(44, 28 + bobY, 4, 4, '#fbc5b0', 4, 80);
      drawBezier(c, { x: 50, y: 14 + bobY }, { x: 46, y: 28 + bobY }, { x: 50, y: 44 + bobY }, '#713f12', 2, 85);
      c.fillRect(50, 15 + bobY, 1, 28, '#e2e8f0', 4, 86);
      c.fillRect(43, 28 + bobY, 10, 1, '#d4d4d8', 4, 88);
      c.setPixel(43, 28 + bobY, '#dc2626', 4, 89);
    }
  }

  // =========================================================================
  // DYNAMIC ACTION VISUAL FX
  // =========================================================================
  static renderActionFX(c, charKey, act, f, bobY) {
    if (act !== 'action' || (f !== 2 && f !== 3)) return;

    if (charKey === 'blacksmith') {
      c.setPixel(40, 44 + bobY, '#fef08a', 4, 95);
      c.setPixel(38, 41 + bobY, '#f59e0b', 4, 95);
      c.setPixel(53, 43 + bobY, '#fef08a', 4, 95);
      c.setPixel(56, 40 + bobY, '#f97316', 4, 95);
      c.setPixel(48, 49 + bobY, '#fef08a', 4, 95);
    } else if (charKey === 'knight') {
      drawBezier(c, { x: 50, y: 14 + bobY }, { x: 58, y: 28 + bobY }, { x: 44, y: 42 + bobY }, '#60a5fa', 2, 95);
      drawBezier(c, { x: 46, y: 26 + bobY }, { x: 54, y: 32 + bobY }, { x: 47, y: 44 + bobY }, '#ffffff', 2, 96);
      c.setPixel(55, 34 + bobY, '#93c5fd', 4, 97);
    } else if (charKey === 'mage') {
      const sx = 46, sy = 18 + bobY;
      drawBezier(c, { x: sx - 8, y: sy }, { x: sx, y: sy - 10 }, { x: sx + 8, y: sy }, '#67e8f9', 2, 95);
      drawBezier(c, { x: sx + 8, y: sy }, { x: sx, y: sy + 10 }, { x: sx - 8, y: sy }, '#a855f7', 2, 95);
      c.setPixel(sx, sy, '#ffffff', 4, 98);
      c.setPixel(sx - 4, sy - 4, '#c084fc', 4, 96);
      c.setPixel(sx + 4, sy + 4, '#38bdf8', 4, 96);
    } else if (charKey === 'fisherman') {
      drawBezier(c, { x: 46, y: 16 + bobY }, { x: 57, y: 10 + bobY }, { x: 59, y: 38 + bobY }, '#ffffff', 1, 95);
      c.setPixel(57, 38 + bobY, '#38bdf8', 4, 96);
      c.setPixel(61, 36 + bobY, '#38bdf8', 4, 96);
      c.setPixel(59, 42 + bobY, '#e0f2fe', 4, 97);
    } else if (charKey === 'ranger') {
      drawBezier(c, { x: 38, y: 28 + bobY }, { x: 50, y: 26 + bobY }, { x: 62, y: 24 + bobY }, '#ffffff', 2, 95);
      c.setPixel(61, 23 + bobY, '#38bdf8', 4, 96);
      c.setPixel(63, 25 + bobY, '#38bdf8', 4, 96);
    }
  }
}

module.exports = { UniversalChibiEngine, ROSTER_CONFIGS };
