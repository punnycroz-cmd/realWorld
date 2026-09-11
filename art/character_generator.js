/**
 * Natura Character Generator (Phase 5)
 * Compiles structured CharacterDNA into high-definition, hand-crafted pixel art.
 */
'use strict';

let VP, AS, CD;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  AS = require('./animation_system.js');
  CD = require('./character_dna.js');
}

class CharacterGenerator {
  /**
   * Renders a single pixel frame of a character given DNA and pose state.
   * Returns a PixelCanvas (32x48).
   */
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0, condition = {}) {
    const c = new VP.PixelCanvas(32, 48);
    const cond = Object.assign({}, dna.condition || {}, condition || {});
    const pose = AS.AnimationSystem.getPose(act, frame, dir, cond, dna.ageYears);

    // Color ramps
    const skinRamp = VP.makeRamp(
      dna.face.skinRampKey === 'deep' ? '#995634' :
      (dna.face.skinRampKey === 'light' ? '#dda078' : '#c47d4e')
    );
    const hairRamp = VP.makeRamp(
      dna.hair.colorRampKey === 'blonde' ? '#c7923e' :
      (dna.hair.colorRampKey === 'auburn' ? '#9c3d2e' :
      (dna.hair.colorRampKey === 'grey' ? '#7b808c' :
      (dna.hair.colorRampKey === 'black' ? '#22222a' : '#5a331c')))
    );
    const shirtRamp = VP.makeRamp(dna.palette.shirt || '#35633f');
    const pantsRamp = VP.makeRamp(dna.palette.pants || '#25395c');
    const bootRamp = VP.makeRamp(dna.palette.boots || '#422810');
    const apronRamp = dna.palette.apron ? VP.makeRamp(dna.palette.apron) : null;
    const vestRamp = dna.palette.vest ? VP.makeRamp(dna.palette.vest) : null;
    const hatRamp = dna.palette.hat ? VP.makeRamp(dna.palette.hat) : null;

    // Proportions and scale
    const anat = dna.anatomy;
    const isChild = dna.ageYears < 7;
    const isTeen = dna.ageYears >= 7 && dna.ageYears < 16;
    const isElder = dna.ageYears > 58;
    const heightScale = anat.heightScale || 1.0;
    const widthScale = anat.widthScale || 1.0;
    const bobY = pose.comBobY;

    // Calibrated ground anchor
    const groundY = 43;
    const totalHeight = Math.round(32 * heightScale);
    const headCenterY = Math.round(groundY - totalHeight + 4 + bobY + pose.headBobY);
    const neckY = headCenterY + 3;
    const torsoY = headCenterY + 4; // Right beneath chin
    const hipY = Math.round(torsoY + Math.round((totalHeight - 8) * 0.44));
    const shW = Math.max(6, Math.round((anat.shoulderWidth || 10) * widthScale));
    const halfShW = Math.floor(shW / 2);

    // 1. Ground Shadow
    if (!pose.sleeping) {
      c.ellipse(16, 45, isChild ? 4 : (halfShW + 1), 2, 'rgba(16, 12, 8, 0.28)', 0);
    }

    // Special Sleeping Pose
    if (pose.sleeping) {
      // Horizontal sleeping roll
      c.fillRect(6, 32, 20, 10, pantsRamp[2], 3); // blanket/quilt
      c.fillRect(6, 30, 8, 5, '#e3dcd0', 3);       // pillow
      c.ellipse(10, 29, 4, 4, skinRamp[3], 2);     // head
      c.ellipse(10, 27, 4, 3, hairRamp[3], 2);     // hair cap
      c.fillRect(9, 29, 2, 1, '#1b1b22', 2);       // closed eye
      c.fillRect(24, 35, 4, 4, bootRamp[2], 4);    // boots peeking out
      VP.applySelectiveOutline(c);
      return c;
    }

    // 2. Back Hair (if long hair and facing front/profile, or facing back)
    if (dna.hair.style === 'long' || dna.hair.style === 'braided' || dir === 1) {
      const hairLen = dna.hair.style === 'long' ? 14 : (dna.hair.style === 'braided' ? 12 : 8);
      c.fillRect(16 - halfShW + 1, headCenterY - 4, (halfShW - 1) * 2, hairLen, hairRamp[1], 2);
      if (dna.hair.style === 'braided') {
        // Twin braids hanging down
        c.fillRect(11, headCenterY + 4, 2, 8, hairRamp[2], 2);
        c.fillRect(19, headCenterY + 4, 2, 8, hairRamp[2], 2);
        c.setPixel(11, headCenterY + 12, '#96333c', 2); // tie ribbon
        c.setPixel(19, headCenterY + 12, '#96333c', 2);
      }
    }

    // 3. Legs & Trousers / Skirt
    const isSkirt = dna.clothing.layers.trousersOrSkirt === 'skirt';
    if (isSkirt && dir !== 2 && dir !== 3) {
      // Skirt flare
      const skirtW = halfShW + 2;
      for (let y = hipY; y <= 40 + bobY; y++) {
        const prog = (y - hipY) / (40 + bobY - hipY);
        const w = Math.round(skirtW * (0.8 + 0.4 * prog));
        c.fillRect(16 - w, y, w * 2, 1, pantsRamp[3], 3);
        // Shadow on right side
        c.fillRect(16 + w - 2, y, 2, 1, pantsRamp[1], 3);
      }
      // Hem highlight
      c.fillRect(16 - skirtW, 40 + bobY, skirtW * 2, 1, pantsRamp[4], 3);
      // Boots visible beneath hem
      VP.drawBoot(c, 12, 41 + bobY, dir, bootRamp);
      VP.drawBoot(c, 18, 41 + bobY, dir, bootRamp);
    } else {
      // Trousers & Legs
      const footLY = pose.legLeft.footY + bobY;
      const footRY = pose.legRight.footY + bobY;
      const legLX = pose.legLeft.x;
      const legRX = pose.legRight.x;

      if (dir === 2 || dir === 3) {
        // Profile view: one leg in front of other
        c.fillRect(legLX - 2, hipY, 4, footLY - hipY, pantsRamp[3], 3);
        c.fillRect(legLX + 1, hipY, 1, footLY - hipY, pantsRamp[1], 3);
        VP.drawBoot(c, legLX - 2, footLY, dir, bootRamp);

        c.fillRect(legRX - 2, hipY, 3, footRY - hipY, pantsRamp[2], 3);
        VP.drawBoot(c, legRX - 2, footRY, dir, bootRamp);
      } else {
        // Front / Back view
        c.fillRect(12, hipY, 3, footLY - hipY, pantsRamp[3], 3);
        c.fillRect(14, hipY, 1, footLY - hipY, pantsRamp[1], 3); // inner shade
        VP.drawBoot(c, 11, footLY, dir, bootRamp);

        c.fillRect(18, hipY, 3, footRY - hipY, pantsRamp[3], 3);
        c.fillRect(20, hipY, 1, footRY - hipY, pantsRamp[1], 3);
        VP.drawBoot(c, 17, footRY, dir, bootRamp);
      }
    }

    // 4. Torso with natural shoulder slope
    const torsoW = halfShW * 2;
    // Sloped trapezius shoulders
    c.fillRect(16 - halfShW + 2, torsoY, (halfShW - 2) * 2, 1, shirtRamp[3], 3);
    c.fillRect(16 - halfShW + 1, torsoY + 1, (halfShW - 1) * 2, 1, shirtRamp[3], 3);
    c.fillRect(16 - halfShW, torsoY + 2, torsoW, hipY - torsoY - 1, shirtRamp[3], 3);

    // Collar notch showing undershirt
    c.setPixel(16, torsoY, skinRamp[2], 2);
    c.setPixel(16, torsoY + 1, '#f7f4ec', 3);

    // Core shadow & highlights
    c.fillRect(16 + halfShW - 2, torsoY + 2, 2, hipY - torsoY - 1, shirtRamp[1], 3);
    c.fillRect(16 - halfShW, torsoY + 2, 2, hipY - torsoY - 1, shirtRamp[4], 3);

    // Belt
    c.fillRect(16 - halfShW, hipY - 2, torsoW, 2, '#23160c', 3);
    c.setPixel(16, hipY - 2, '#edd06d', 5); // Brass buckle sparkle

    // Vest / Apron layers
    if (vestRamp) {
      c.fillRect(16 - halfShW, torsoY + 2, 3, hipY - torsoY - 3, vestRamp[3], 3);
      c.fillRect(16 + halfShW - 3, torsoY + 2, 3, hipY - torsoY - 3, vestRamp[2], 3);
    }
    if (apronRamp && dir !== 1) {
      c.fillRect(16 - halfShW + 2, torsoY + 4, torsoW - 4, hipY - torsoY + 6, apronRamp[3], 3);
      c.fillRect(16 + halfShW - 4, torsoY + 4, 2, hipY - torsoY + 6, apronRamp[1], 3);
    }

    // Pregnancy profile swell
    if (cond.pregnant > 60 && (dir === 2 || dir === 3)) {
      const swell = Math.min(4, Math.floor(cond.pregnant / 50));
      c.fillRect(16 - halfShW - swell, torsoY + 4, swell, 6, shirtRamp[3], 3);
    }

    // 5. Arms & Hands
    const armLX = 16 - halfShW - 1;
    const armRX = 16 + halfShW;
    const handLY = Math.min(hipY + 4, pose.armLeft.y + bobY);
    const handRY = Math.min(hipY + 4, pose.armRight.y + bobY);

    if (dir === 2 || dir === 3) {
      // Profile view: single primary arm in view
      const activeHandY = handRY;
      c.fillRect(15, torsoY + 2, 3, activeHandY - torsoY - 1, shirtRamp[3], 3);
      VP.drawHand(c, 15, activeHandY, skinRamp, pose.tool.active ? 'fist' : 'open');
    } else {
      // Front / Back View
      // Left Arm
      c.fillRect(armLX, torsoY + 2, 2, handLY - torsoY - 1, shirtRamp[3], 3);
      c.fillRect(armLX, torsoY + 2, 1, handLY - torsoY - 1, shirtRamp[4], 3); // highlight
      VP.drawHand(c, armLX, handLY, skinRamp, 'open');

      // Right Arm
      c.fillRect(armRX, torsoY + 2, 2, handRY - torsoY - 1, shirtRamp[3], 3);
      c.fillRect(armRX + 1, torsoY + 2, 1, handRY - torsoY - 1, shirtRamp[1], 3); // shade
      VP.drawHand(c, armRX, handRY, skinRamp, pose.tool.active ? 'fist' : 'open');
    }

    // 6. Neck & Head
    c.fillRect(15, neckY, 3, 2, skinRamp[1], 2); // seamless neck
    // Head shape: centered at (16, headCenterY)
    VP.drawCluster(c, 16, headCenterY, 4, 4, skinRamp, 'UL');

    // 7. Face Features (eyes, nose, mouth)
    const faceBox = {
      x0: 12,
      x1: 20,
      centerY: headCenterY
    };
    VP.drawFaceFeatures(c, faceBox, dna.face, pose.blink, pose.mouthOpen, dir);

    // Facial hair (beard)
    if (dna.face.facialHair === 'full_beard' || dna.face.facialHair === 'long_grey_beard') {
      const beardLen = dna.face.facialHair === 'long_grey_beard' ? 5 : 3;
      c.fillRect(13, headCenterY + 2, 7, beardLen, hairRamp[2], 2);
      c.fillRect(14, headCenterY + 2 + beardLen, 5, 2, hairRamp[1], 2);
    } else if (dna.face.facialHair === 'mustache') {
      c.fillRect(14, headCenterY + 2, 5, 1, hairRamp[2], 2);
    }

    // 8. Front Hair / Coiffure
    if (dir === 1) {
      // Back view: hair covers entire occiput
      c.fillRect(12, headCenterY - 5, 9, 8, hairRamp[3], 2);
      c.fillRect(17, headCenterY - 5, 4, 8, hairRamp[1], 2); // right shadow
    } else {
      // Hair crown & front locks
      c.fillRect(12, headCenterY - 5, 9, 3, hairRamp[3], 2);
      // Highlights on crown
      c.setPixel(14, headCenterY - 5, hairRamp[5], 2);
      c.setPixel(15, headCenterY - 5, hairRamp[5], 2);

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
        VP.drawCurvedLock(c, 12, headCenterY - 4, 12, headCenterY + 1, 2, hairRamp, -1);
        VP.drawCurvedLock(c, 20, headCenterY - 4, 20, headCenterY + 1, 2, hairRamp, 1);
      }
    }

    // 9. Hat (if worn)
    if (hatRamp && dna.palette.hat) {
      // Wide straw brim or felt cap
      c.fillRect(10, headCenterY - 5, 13, 2, hatRamp[3], 3);
      c.fillRect(13, headCenterY - 8, 7, 3, hatRamp[3], 3);
      c.fillRect(13, headCenterY - 6, 7, 1, '#8c2424', 3); // hat band
    }

    // 10. Tools & Carried Items
    if (dna.heldTool && !pose.sleeping) {
      const toolX = dir === 2 ? 15 : armRX;
      const toolY = dir === 2 ? handRY : handRY;
      VP.drawTool(c, dna.heldTool, toolX, toolY, 0, act);
    }
    if (cond.carryingItem === 'log' || (pose.carriedItem && pose.carriedItem.type === 'log')) {
      // Substantial horizontal timber log in arms
      const woodRamp = VP.makeRamp('#8a5a38');
      c.fillRect(8, torsoY + 3, 16, 5, woodRamp[3], 5);
      c.fillRect(8, torsoY + 3, 16, 1, woodRamp[5], 5); // top light
      c.fillRect(8, torsoY + 7, 16, 1, woodRamp[1], 5); // bottom shadow
      c.ellipse(8, torsoY + 5, 2, 2, woodRamp[4], 5);   // cut end
      c.ellipse(24, torsoY + 5, 2, 2, woodRamp[2], 5);
    }

    // 11. Condition Effects (wetness, mud, bandages)
    VP.applyConditionEffects(c, cond);

    // 12. Final Master Touch: Selective Color Outline
    VP.applySelectiveOutline(c);

    return c;
  }

  /**
   * Renders a full animated spritesheet for given directions and animation clips.
   */
  static renderSheet(dna, actions = ['idle', 'walk', 'work', 'talk', 'sit', 'sleep'], dirs = [0, 1, 2]) {
    const sheet = {};
    for (const dir of dirs) {
      sheet[dir] = {};
      for (const act of actions) {
        const frameCount = act === 'walk' ? 6 : (act === 'idle' ? 4 : (act === 'work' ? 4 : (act === 'talk' ? 4 : 2)));
        sheet[dir][act] = [];
        for (let f = 0; f < frameCount; f++) {
          const frameCanvas = this.renderFrame(dna, dir, act, f, dna.condition);
          sheet[dir][act].push(frameCanvas);
        }
      }
    }
    return sheet;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterGenerator };
}
