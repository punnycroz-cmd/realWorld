/**
 * LPC-Trained Procedural Character Generator (V4 - Micro-Pixel Anatomical Accuracy)
 * 
 * Re-engineered to match the EXACT sub-pixel anatomical measurements of LPC:
 * 1. Head: 16px high, 20px wide (down from 18x18 bloated oval)
 * 2. Eyes: Micro-scaled to 1x2 and 2x2 pixels with sub-pixel iris gleam (at y=28..30)
 * 3. Arms: Slender 4-5px silhouette along natural torso gap (x=17..22, x=41..46)
 * 4. Legs: Clean 6-7px tapered column per leg with 6px gap in-between (y=51..61)
 * 5. Fabric & Gear: Form-fitted double-stitched tunic, leather apron, belt, and boots
 * 6. 100% Pure Code JavaScript (zero external dependencies)
 */
'use strict';

const VP = require('../visual_primitives.js');
const { LPC_ANATOMY_SILHOUETTE } = require('./knowledge/lpc_anatomy_silhouette.js');

// 4x4 Bayer Matrix
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

function isDither(x, y, thresh) {
  return BAYER_4X4[Math.abs(y) % 4][Math.abs(x) % 4] < thresh;
}

class LpcTrainedProceduralGenerator {
  static renderFrame(charDef, animType = 'walk_down', frameIdx = 0) {
    const c = new VP.PixelCanvas(64, 64);
    const S = LPC_ANATOMY_SILHOUETTE;
    const role = (charDef.role || 'farmer').toLowerCase();

    // Ramps
    const skinBase = charDef.skin === 'dark' ? '#8d5438' : (charDef.skin === 'tanned' ? '#c47d4e' : '#dda078');
    const skinRamp = [
      VP.shade(skinBase, 0.40), // 0: Deep shade / chin AO
      VP.shade(skinBase, 0.62), // 1: Shadow
      VP.shade(skinBase, 0.80), // 2: Mid-shadow
      skinBase,                 // 3: Base tone
      VP.mix(skinBase, '#fff0dd', 0.25), // 4: Soft highlight
      VP.mix(skinBase, '#fff8ee', 0.50), // 5: Highlight
      '#ffffff'                          // 6: Catchlight
    ];

    const hairHex = charDef.hair && charDef.hair.includes('blonde') ? '#c7923e' :
      (charDef.hair && charDef.hair.includes('red') ? '#9c3d2e' :
      (charDef.hair && charDef.hair.includes('brunette') ? '#5a331c' : '#22222a'));
    const hairRamp = VP.makeRamp(hairHex);

    const shirtHex = charDef.shirt && charDef.shirt.includes('teal') ? '#0d9488' :
      (charDef.shirt && charDef.shirt.includes('maroon') ? '#991b1b' :
      (charDef.shirt && charDef.shirt.includes('brown') ? '#78350f' :
      (charDef.shirt && charDef.shirt.includes('plate') ? '#475569' :
      (charDef.shirt && charDef.shirt.includes('leather') ? '#854d0e' : '#e2e8f0'))));
    const shirtRamp = VP.makeRamp(shirtHex);

    const pantsHex = charDef.pants && charDef.pants.includes('red') ? '#b91c1c' :
      (charDef.pants && charDef.pants.includes('teal') ? '#0f766e' : '#f1f5f9');
    const pantsRamp = VP.makeRamp(pantsHex);

    const leatherRamp = VP.makeRamp('#5c3014');
    const metalRamp = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#e2e8f0'];
    const brassRamp = ['#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fef08a'];

    // Kinematics: bobY and legStride
    const f = frameIdx % 9;
    const isWalk = animType.startsWith('walk');
    const bobY = isWalk ? (f === 0 || f === 4 ? 0 : (f === 2 || f === 6 ? -1 : 0)) : 0;
    const stride = isWalk ? Math.sin(f * Math.PI / 4) * 3 : 0;

    // --- 1. Soft Ground Contact Shadow ---
    c.ellipse(32, 61, 14, 2.5, 'rgba(10, 15, 26, 0.45)', 0, 0);

    // --- 2. Legs & Boots (Exact Silhouette Matching y=51..61) ---
    for (let y = S.legs.topY; y <= S.legs.groundY; y++) {
      const leftRange = S.legs.leftLeg[y];
      const rightRange = S.legs.rightLeg[y];
      const t = (y - S.legs.topY) / (S.legs.groundY - S.legs.topY);
      const leftOff = Math.round(stride * t);
      const rightOff = Math.round(-stride * t);

      // Left Leg
      if (leftRange) {
        for (let x = leftRange[0] + leftOff; x <= leftRange[1] + leftOff; x++) {
          let tone = pantsRamp[3];
          if (x === leftRange[0] + leftOff) tone = pantsRamp[4]; // Left keylight
          else if (x === leftRange[1] + leftOff) tone = pantsRamp[1]; // Right self-shadow
          if (y >= 58) tone = leatherRamp[3]; // Boot
          if (y === 58 && x === leftRange[0] + leftOff + 1) tone = brassRamp[5]; // Boot buckle
          c.setPixel(x, y, tone, 3, 20);
        }
      }

      // Right Leg
      if (rightRange) {
        for (let x = rightRange[0] + rightOff; x <= rightRange[1] + rightOff; x++) {
          let tone = pantsRamp[3];
          if (x === rightRange[0] + rightOff) tone = pantsRamp[4];
          else if (x === rightRange[1] + rightOff) tone = pantsRamp[1];
          if (y >= 58) tone = leatherRamp[3]; // Boot
          if (y === 58 && x === rightRange[0] + rightOff + 1) tone = brassRamp[5];
          c.setPixel(x, y, tone, 3, 21);
        }
      }
    }

    // --- 3. Torso & Fitted Tunic (Exact Silhouette y=34..50) ---
    for (let y = S.torso.topY; y <= S.torso.crotchY; y++) {
      const range = S.torso.rows[y];
      if (!range) continue;
      const curY = y + bobY;
      for (let x = range[0]; x <= range[1]; x++) {
        let tone = shirtRamp[3];
        // Volume falloff
        if (x <= range[0] + 2) tone = shirtRamp[4];
        else if (x >= range[1] - 2) tone = shirtRamp[2];

        // Bayer fabric dither
        if (isDither(x, curY, 4)) {
          if (tone === shirtRamp[3]) tone = shirtRamp[4];
          else if (tone === shirtRamp[2]) tone = shirtRamp[1];
        }
        c.setPixel(x, curY, tone, 3, 30);
      }
      // V-neck and double-stitched center seam
      if (curY <= 38 + bobY) {
        c.setPixel(31, curY, skinRamp[3], 2, 31);
        c.setPixel(32, curY, skinRamp[4], 2, 31);
      } else {
        c.setPixel(31, curY, shirtRamp[1], 3, 31);
        c.setPixel(32, curY, shirtRamp[4], 3, 31);
      }
    }

    // Leather Apron / Armor for Craftsmen
    if (charDef.shirt && charDef.shirt.includes('plate')) {
      // Plate Armor Breastplate (Fitted)
      for (let y = 35 + bobY; y <= 44 + bobY; y++) {
        for (let x = 25; x <= 38; x++) {
          let tone = metalRamp[3];
          if (x === 25) tone = metalRamp[5];
          else if (x === 38) tone = metalRamp[1];
          if (x === 31 || x === 32) tone = metalRamp[6]; // Specular center ridge
          c.setPixel(x, y, tone, 4, 35);
        }
      }
    } else if (role === 'blacksmith' || role === 'miner') {
      // Form-fitted leather work apron
      for (let y = 36 + bobY; y <= 48 + bobY; y++) {
        const halfW = y < 42 + bobY ? 5 : 6;
        for (let x = 32 - halfW; x <= 31 + halfW; x++) {
          let tone = leatherRamp[3];
          if (x === 32 - halfW) tone = leatherRamp[4];
          else if (x === 31 + halfW) tone = leatherRamp[1];
          c.setPixel(x, y, tone, 4, 35);
        }
      }
      // Brass rivets
      c.setPixel(27, 37 + bobY, brassRamp[5], 4, 36);
      c.setPixel(36, 37 + bobY, brassRamp[5], 4, 36);
    }

    // Fitted Leather Belt & Brass Buckle (y=44..46)
    for (let x = 23; x <= 40; x++) {
      c.setPixel(x, 44 + bobY, '#1c1917', 4, 37);
      c.setPixel(x, 45 + bobY, '#292524', 4, 37);
    }
    // Micro buckle (3x3 at center)
    c.fillRect(30, 43 + bobY, 4, 3, brassRamp[5], 4, 38);
    c.setPixel(31, 44 + bobY, '#1c1917', 4, 39);
    c.setPixel(30, 43 + bobY, '#ffffff', 4, 40); // Buckle glint

    // Side Pouch on right hip
    c.fillRect(38, 45 + bobY, 4, 4, leatherRamp[2], 4, 38);
    c.setPixel(40, 46 + bobY, brassRamp[5], 4, 39);

    // --- 4. Slender Arms (Exact Silhouette x=17..22, x=41..46) ---
    const armOff = Math.round(stride * 0.7);
    for (let y = 34; y <= 48; y++) {
      const curY = y + bobY;
      const leftRange = S.arms.leftArm[y];
      const rightRange = S.arms.rightArm[y];

      // Left Arm
      if (leftRange) {
        for (let x = leftRange[0]; x <= leftRange[1]; x++) {
          let tone = shirtRamp[3];
          if (x === leftRange[0]) tone = shirtRamp[4];
          else if (x === leftRange[1]) tone = shirtRamp[1];
          if (y >= 46) tone = skinRamp[3]; // Hand
          c.setPixel(x, curY + armOff, tone, 3, 40);
        }
      }

      // Right Arm
      if (rightRange) {
        for (let x = rightRange[0]; x <= rightRange[1]; x++) {
          let tone = shirtRamp[3];
          if (x === rightRange[0]) tone = shirtRamp[4];
          else if (x === rightRange[1]) tone = shirtRamp[1];
          if (y >= 46) tone = skinRamp[3]; // Hand
          c.setPixel(x, curY - armOff, tone, 3, 41);
        }
      }
    }

    // --- 5. Neck & Slender Head Silhouette (y=15..33) ---
    // Neck
    c.fillRect(28, 32 + bobY, 8, 2, skinRamp[2], 2, 45);

    // Head base silhouette
    for (let y = S.head.topY; y <= S.head.chinY; y++) {
      const range = S.head.rows[y];
      if (!range) continue;
      const curY = y + bobY;
      for (let x = range[0]; x <= range[1]; x++) {
        let tone = skinRamp[3];
        // Volumetric face shading
        if (x <= range[0] + 1) tone = skinRamp[4];
        else if (x >= range[1] - 1) tone = skinRamp[2];
        if (y >= 30) tone = skinRamp[1]; // Chin shadow
        c.setPixel(x, curY, tone, 2, 50);
      }
    }

    // --- 6. Micro-Eyes & Expressive Face (Sub-pixel precise) ---
    const eyeY = 28 + bobY;
    // Left Eye (x=25..27)
    c.setPixel(25, eyeY, '#ffffff', 1, 52);
    c.setPixel(26, eyeY, '#1e293b', 1, 53); // Pupil
    c.setPixel(27, eyeY, '#ffffff', 1, 52);
    c.setPixel(26, eyeY + 1, '#38bdf8', 1, 54); // Iris highlight
    c.setPixel(25, eyeY, '#ffffff', 1, 55); // Catchlight
    // Eyebrow
    c.fillRect(25, eyeY - 2, 3, 1, hairRamp[1], 2, 56);

    // Right Eye (x=36..38)
    c.setPixel(36, eyeY, '#ffffff', 1, 52);
    c.setPixel(37, eyeY, '#1e293b', 1, 53); // Pupil
    c.setPixel(38, eyeY, '#ffffff', 1, 52);
    c.setPixel(37, eyeY + 1, '#38bdf8', 1, 54);
    c.setPixel(36, eyeY, '#ffffff', 1, 55);
    // Eyebrow
    c.fillRect(36, eyeY - 2, 3, 1, hairRamp[1], 2, 56);

    // Nose (x=31..32, y=29..30)
    c.setPixel(31, 29 + bobY, skinRamp[5], 2, 53);
    c.setPixel(32, 30 + bobY, skinRamp[1], 2, 53); // Nostril shadow

    // Mouth (x=30..33, y=31)
    c.fillRect(30, 31 + bobY, 4, 1, skinRamp[1], 2, 53);

    // Blacksmith Full Rugged Beard
    if (role === 'blacksmith' || role === 'miner') {
      for (let y = 30 + bobY; y <= 36 + bobY; y++) {
        const bw = y < 34 + bobY ? 8 : 6;
        for (let x = 32 - bw; x <= 31 + bw; x++) {
          let tone = hairRamp[2];
          if (x === 32 - bw) tone = hairRamp[3];
          c.setPixel(x, y, tone, 2, 57);
        }
      }
      c.setPixel(29, 32 + bobY, hairRamp[4], 2, 58);
      c.setPixel(34, 33 + bobY, hairRamp[4], 2, 58);
    }

    // --- 7. Flowing Hair Locks & Fringe ---
    for (let y = 14 + bobY; y <= 24 + bobY; y++) {
      const hw = Math.round(9 - Math.abs(y - (18 + bobY)) * 0.7);
      for (let x = 32 - hw; x <= 31 + hw; x++) {
        let tone = hairRamp[3];
        if (x <= 32 - hw + 2) tone = hairRamp[4];
        else if (x >= 31 + hw - 2) tone = hairRamp[1];
        c.setPixel(x, y, tone, 2, 60);
      }
    }
    // Side locks
    c.fillRect(21, 23 + bobY, 2, 6, hairRamp[2], 2, 61);
    c.fillRect(41, 23 + bobY, 2, 6, hairRamp[1], 2, 61);

    // --- 8. Handheld Weapon / Tool ---
    if (charDef.weapon && charDef.weapon.includes('spear')) {
      const sx = 45;
      const sy = 48 + bobY - 24;
      c.fillRect(sx, sy, 2, 36, '#78350f', 4, 70);
      c.fillRect(sx - 2, sy - 8, 6, 8, metalRamp[4], 4, 72);
      c.setPixel(sx - 1, sy - 6, '#ffffff', 5, 75);
    } else if (charDef.weapon && charDef.weapon.includes('dagger') || role === 'blacksmith') {
      // Slender Hammer for Blacksmith
      const hx = 44;
      const hy = 46 + bobY;
      c.fillRect(hx, hy - 8, 2, 14, '#78350f', 4, 70);
      c.fillRect(hx - 3, hy - 12, 8, 5, metalRamp[4], 4, 72);
      c.setPixel(hx - 2, hy - 11, '#ffffff', 5, 75); // Glint
    }

    // --- 9. Selective Outlining (Sel-out) ---
    VP.applySelectiveOutline(c);

    return c;
  }
}

module.exports = { LpcTrainedProceduralGenerator };
