/**
 * Natura Procedural 64x64 Character Generator
 * Native 64x64 resolution procedural synthesis with fine facial anatomy,
 * cloth creases, realistic muscle cylinders, specular glints, and tools.
 */
'use strict';

const VP = require('../visual_primitives.js');
const AS = require('../animation_system.js');
const PAS = require('../profession_animation_system.js').ProfessionAnimationSystem;

class Procedural64Generator {
  /**
   * Renders a 64x64 frame for a given character DNA and animation state
   */
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0) {
    const c = new VP.PixelCanvas(64, 64);
    
    // Resolve pose from animation system
    let pose;
    const role = (dna.role || 'farmer').toLowerCase();
    if (act === 'profession' || act === 'work' || act === 'action') {
      pose = PAS.getProfessionPose(role, frame, dir);
    } else {
      pose = AS.AnimationSystem.getPose(act, frame, dir, dna.condition || {}, dna.ageYears || 30);
    }

    // Color ramps
    const skinToneHex = dna.colors && dna.colors.skin ? dna.colors.skin :
      (dna.face && dna.face.skinRampKey === 'deep' ? '#995634' :
      (dna.face && dna.face.skinRampKey === 'tanned' ? '#c47d4e' : '#dda078'));
    const skinRamp = VP.makeRamp(skinToneHex);

    const hairColorHex = dna.colors && dna.colors.hair ? dna.colors.hair :
      (dna.hair && dna.hair.colorRampKey === 'blonde' ? '#c7923e' :
      (dna.hair && dna.hair.colorRampKey === 'auburn' ? '#9c3d2e' :
      (dna.hair && dna.hair.colorRampKey === 'grey' ? '#7b808c' :
      (dna.hair && dna.hair.colorRampKey === 'black' ? '#22222a' : '#5a331c'))));
    const hairRamp = VP.makeRamp(hairColorHex);

    const shirtHex = (dna.palette && dna.palette.shirt) || (dna.colors && dna.colors.dress) || '#35633f';
    const shirtRamp = VP.makeRamp(shirtHex);

    const pantsHex = (dna.palette && dna.palette.pants) || '#25395c';
    const pantsRamp = VP.makeRamp(pantsHex);

    const bootHex = (dna.palette && dna.palette.boots) || '#3e2723';
    const bootRamp = VP.makeRamp(bootHex);

    const metalRamp = ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1', '#ffffff'];
    const woodRamp = ['#271202', '#451e06', '#632e0c', '#78350f', '#9a3412', '#b45309', '#d97706'];

    // Anatomy & coordinates at 64x64
    const cx = 32;
    const groundBaselineY = 58; // Ground contact point
    const bobY = Math.round(pose.comBobY * 1.6);
    const headBobY = Math.round((pose.headBobY || 0) * 1.6);

    const isHeavy = dna.anatomy && dna.anatomy.archetype === 'broad_heavy';
    const shoulderHalfW = isHeavy ? 12 : 9;
    const torsoW = shoulderHalfW * 2;
    const waistW = isHeavy ? 18 : 14;

    const headY = 16 + bobY + headBobY;
    const chestY = 24 + bobY;
    const hipY = 38 + bobY;

    // --- 1. Soft Ground Shadow ---
    c.ellipse(cx, groundBaselineY + 1, shoulderHalfW + 3, 3, 'rgba(12, 16, 26, 0.35)', 0, 0);

    // --- 2. Back Hair (if long or facing away) ---
    if (dir === 1 || (dna.hair && (dna.hair.style === 'long' || dna.hair.style === 'braided'))) {
      VP.drawCluster(c, cx, headY - 1, 11, 10, hairRamp, 10, 'UL');
      if (dna.hair && dna.hair.style === 'long') {
        VP.drawCurvedLock(c, cx - 6, headY + 2, cx - 8, headY + 18, 5, hairRamp, -1, 12);
        VP.drawCurvedLock(c, cx + 6, headY + 2, cx + 8, headY + 18, 5, hairRamp, 1, 12);
      }
    }

    // --- 3. Legs & Boots (Detailed with cloth folds & knee joints) ---
    const legSwing = (act === 'walk') ? Math.sin(frame * Math.PI / 3) * 6 : 0;
    const leftFootY = groundBaselineY - Math.max(0, legSwing);
    const rightFootY = groundBaselineY - Math.max(0, -legSwing);

    // Left Leg
    const legLX = cx - (isHeavy ? 6 : 5) - (dir === 2 ? 3 : (dir === 3 ? -3 : 0));
    VP.drawLimbCylinder(c, legLX, hipY, legLX - (dir === 2 ? legSwing : 0), leftFootY - 3, 3.5, pantsRamp, 20, true);
    VP.drawBoot(c, legLX - 2, leftFootY - 1, dir, bootRamp, 22);

    // Right Leg
    const legRX = cx + (isHeavy ? 6 : 5) + (dir === 2 ? -3 : (dir === 3 ? 3 : 0));
    VP.drawLimbCylinder(c, legRX, hipY, legRX + (dir === 3 ? legSwing : 0), rightFootY - 3, 3.5, pantsRamp, 21, true);
    VP.drawBoot(c, legRX - 2, rightFootY - 1, dir, bootRamp, 23);

    // --- 4. Torso & Tunic with Wrinkles & Belt ---
    // Upper Chest & Shoulders
    c.fillRect(cx - shoulderHalfW, chestY, torsoW, 7, shirtRamp[3], 3, 30);
    // Shoulder highlight
    c.fillRect(cx - shoulderHalfW + 1, chestY, torsoW - 2, 1, shirtRamp[4], 3, 31);
    // Tapered abdomen / waist
    for (let y = chestY + 7; y <= hipY; y++) {
      const t = (y - (chestY + 7)) / (hipY - (chestY + 7));
      const curHalfW = Math.round(shoulderHalfW - t * (shoulderHalfW - waistW / 2));
      c.fillRect(cx - curHalfW, y, curHalfW * 2, 1, shirtRamp[t > 0.6 ? 2 : 3], 3, 30);
      // Subtle cloth fold line
      if (y === chestY + 9) {
        c.fillRect(cx - curHalfW + 2, y, curHalfW * 2 - 4, 1, shirtRamp[1], 3, 32);
      }
    }

    // Heavy Leather Apron / Overalls for Craftsmen
    if (role === 'blacksmith' || role === 'miner') {
      const apronRamp = VP.makeRamp('#451e06');
      c.fillRect(cx - 6, chestY + 2, 12, hipY - chestY + 4, apronRamp[3], 4, 33);
      c.fillRect(cx - 6, chestY + 2, 12, 1, apronRamp[4], 4, 34); // Apron top fold
      c.fillRect(cx - 8, hipY + 1, 16, 2, '#271202', 4, 35); // Apron hem
    }

    // Belt & Buckle
    c.fillRect(cx - Math.floor(waistW / 2), hipY - 2, waistW, 3, '#1c1917', 4, 35);
    c.fillRect(cx - 2, hipY - 2, 4, 3, metalRamp[5], 4, 36); // Metallic Buckle
    c.setPixel(cx - 1, hipY - 1, '#ffffff', 5, 37); // Buckle glint

    // --- 5. Arms & Hands ---
    const armSwing = (act === 'walk') ? Math.sin(frame * Math.PI / 3) * 6 : 0;
    const armLX = cx - shoulderHalfW - 1;
    const armRX = cx + shoulderHalfW + 1;
    const handLY = hipY + 2 - armSwing;
    const handRY = hipY + 2 + armSwing;

    // Left Arm
    VP.drawLimbCylinder(c, armLX, chestY + 2, armLX - 1, handLY, 3, shirtRamp, 40, true);
    VP.drawHand(c, armLX - 1, handLY, skinRamp, 'open', 42);

    // Right Arm
    VP.drawLimbCylinder(c, armRX, chestY + 2, armRX + 1, handRY, 3, shirtRamp, 41, true);
    VP.drawHand(c, armRX + 1, handRY, skinRamp, 'fist', 43);

    // --- 6. Head, Facial Anatomy & Eyes ---
    // Neck
    c.fillRect(cx - 3, headY + 5, 6, 4, skinRamp[2], 2, 48);

    // Cranium / Face shape
    VP.drawCluster(c, cx, headY, 8, 7, skinRamp, 50, 'UL');

    if (dir === 0) {
      // Facing Down / Front
      // Jawline shading
      c.fillRect(cx - 5, headY + 5, 10, 2, skinRamp[1], 2, 51);

      // Detailed Eyes (White sclera + dark iris + glint)
      // Left eye
      c.fillRect(cx - 5, headY - 1, 3, 2, '#ffffff', 1, 52);
      c.fillRect(cx - 4, headY - 1, 2, 2, '#1e293b', 1, 53);
      c.setPixel(cx - 4, headY - 1, '#38bdf8', 1, 54); // Iris highlight
      // Right eye
      c.fillRect(cx + 2, headY - 1, 3, 2, '#ffffff', 1, 52);
      c.fillRect(cx + 2, headY - 1, 2, 2, '#1e293b', 1, 53);
      c.setPixel(cx + 2, headY - 1, '#38bdf8', 1, 54);

      // Eyebrows
      c.fillRect(cx - 5, headY - 3, 3, 1, hairRamp[1], 2, 55);
      c.fillRect(cx + 2, headY - 3, 3, 1, hairRamp[1], 2, 55);

      // Nose bridge & tip
      c.setPixel(cx, headY + 1, skinRamp[4], 2, 52);
      c.setPixel(cx, headY + 2, skinRamp[1], 2, 52);

      // Mouth / Lips
      c.fillRect(cx - 2, headY + 4, 4, 1, skinRamp[1], 2, 52);

      // Beard for adult craftsmen
      if (role === 'blacksmith' || role === 'miner') {
        c.fillRect(cx - 5, headY + 4, 10, 5, hairRamp[2], 2, 56);
        c.fillRect(cx - 4, headY + 9, 8, 3, hairRamp[1], 2, 56);
      }
    } else if (dir === 2) {
      // Facing Left (Profile)
      c.fillRect(cx - 7, headY - 1, 3, 2, '#ffffff', 1, 52);
      c.fillRect(cx - 7, headY - 1, 2, 2, '#1e293b', 1, 53);
      c.setPixel(cx - 8, headY + 1, skinRamp[4], 2, 52); // Nose bump
      c.fillRect(cx - 6, headY + 4, 2, 1, skinRamp[1], 2, 52); // Mouth
    } else if (dir === 3) {
      // Facing Right (Profile)
      c.fillRect(cx + 4, headY - 1, 3, 2, '#ffffff', 1, 52);
      c.fillRect(cx + 5, headY - 1, 2, 2, '#1e293b', 1, 53);
      c.setPixel(cx + 7, headY + 1, skinRamp[4], 2, 52);
      c.fillRect(cx + 4, headY + 4, 2, 1, skinRamp[1], 2, 52);
    }

    // --- 7. Front Hair Locks & Volume ---
    VP.drawCluster(c, cx, headY - 4, 9, 5, hairRamp, 60, 'UL');
    VP.drawCurvedLock(c, cx - 6, headY - 3, cx - 8, headY + 4, 3, hairRamp, -1, 62);
    VP.drawCurvedLock(c, cx + 6, headY - 3, cx + 8, headY + 4, 3, hairRamp, 1, 62);

    // --- 8. Profession Tool (Weapon/Hammer/Staff) ---
    if (role === 'blacksmith') {
      // Heavy Steel Hammer
      const hx = armRX + 3;
      const hy = handRY - (act === 'profession' ? 12 : 6);
      c.fillRect(hx, hy - 4, 2, 16, woodRamp[3], 4, 70); // Handle
      VP.drawBevelBox(c, hx - 4, hy - 8, 10, 6, metalRamp, 72); // Hammerhead
      VP.drawGlint(c, hx - 3, hy - 7, '#ffffff', 75);
    } else if (role === 'guard') {
      // Guard Spear
      const sx = armRX + 2;
      const sy = handRY - 22;
      c.fillRect(sx, sy, 2, 34, woodRamp[2], 4, 70);
      c.fillRect(sx - 2, sy - 8, 6, 8, metalRamp[4], 4, 72);
      VP.drawGlint(c, sx - 1, sy - 6, '#ffffff', 75);
    }

    // Final Outline Pass for crisp pixel coherence
    VP.applySelectiveOutline(c);
    return c;
  }
}

module.exports = { Procedural64Generator };
