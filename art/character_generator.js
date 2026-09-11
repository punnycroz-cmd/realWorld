/**
 * Natura Character Generator (Phase 15 - High Fidelity)
 * Compiles structured CharacterDNA into high-definition, hand-crafted pixel art.
 * Employs multi-scale rendering (64x96 -> 32x48) and Z-buffering for proper layering.
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
   * Renders at 2x scale internally, then downsamples for high-fidelity structures.
   */
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0, condition = {}) {
    const scale = 2; // High-res internal composition
    const c = new VP.PixelCanvas(32 * scale, 48 * scale);
    const cond = Object.assign({}, dna.condition || {}, condition || {});
    const pose = AS.AnimationSystem.getPose(act, frame, dir, cond, dna.ageYears);

    // Core Ramps
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
    
    // Proportions
    const anat = dna.anatomy;
    const isChild = dna.ageYears < 7;
    const heightScale = anat.heightScale || 1.0;
    const widthScale = anat.widthScale || 1.0;
    const bobY = pose.comBobY;

    // Calibrated ground anchor at 2x scale
    const groundY = 43 * scale;
    const totalHeight = Math.round(32 * scale * heightScale);
    const headCenterY = Math.round(groundY - totalHeight + 4*scale + bobY*scale + pose.headBobY*scale);
    const neckY = headCenterY + 3*scale;
    const torsoY = headCenterY + 4*scale;
    const hipY = Math.round(torsoY + Math.round((totalHeight - 8*scale) * 0.44));
    
    // Z-Layers
    const Z_BACK_HAIR = 10;
    const Z_BACK_LEG = 20;
    const Z_FRONT_LEG = 30;
    const Z_TORSO = 40;
    const Z_BACK_ARM = 50;
    const Z_HEAD = 60;
    const Z_FRONT_HAIR = 70;
    const Z_FRONT_ARM = 80;
    const Z_ACCESSORY = 90;

    const shW = Math.max(6*scale, Math.round((anat.shoulderWidth || 10) * widthScale * scale));
    const halfShW = Math.floor(shW / 2);

    // 1. Ground Shadow
    if (!pose.sleeping) {
      c.ellipse(16*scale, 45*scale, isChild ? 4*scale : (halfShW + 1*scale), 2*scale, 'rgba(16, 12, 8, 0.28)', 0, 0);
    }

    // Special Sleeping Pose
    if (pose.sleeping) {
      c.fillRect(6*scale, 32*scale, 20*scale, 10*scale, pantsRamp[2], 3, Z_TORSO);
      c.ellipse(10*scale, 29*scale, 4*scale, 4*scale, skinRamp[3], 2, Z_HEAD);
      VP.applySelectiveOutline(c);
      return scale > 1 ? c.downsample(32, 48) : c;
    }

    // 2. Back Hair
    if (dna.hair.style === 'long' || dna.hair.style === 'braided' || dir === 1) {
      const hairLen = dna.hair.style === 'long' ? 14*scale : 10*scale;
      c.fillRect(16*scale - halfShW + 1*scale, headCenterY - 4*scale, (halfShW - 1*scale) * 2, hairLen, hairRamp[1], 2, Z_BACK_HAIR);
    }

    // 3. Legs & Trousers / Skirt
    const isSkirt = dna.clothing.layers.trousersOrSkirt === 'skirt';
    if (isSkirt && dir !== 2 && dir !== 3) {
      const skirtW = halfShW + 2*scale;
      for (let y = hipY; y <= (40 + bobY)*scale; y++) {
        const prog = (y - hipY) / ((40 + bobY)*scale - hipY);
        const w = Math.round(skirtW * (0.8 + 0.4 * prog));
        c.fillRect(16*scale - w, y, w * 2, 1, pantsRamp[3], 3, Z_BACK_LEG);
      }
      VP.drawBoot(c, 12*scale, (41 + bobY)*scale, dir, bootRamp, Z_BACK_LEG);
      VP.drawBoot(c, 18*scale, (41 + bobY)*scale, dir, bootRamp, Z_BACK_LEG);
    } else {
      const footLY = (pose.legLeft.footY + bobY) * scale;
      const footRY = (pose.legRight.footY + bobY) * scale;
      const legLX = pose.legLeft.x * scale;
      const legRX = pose.legRight.x * scale;

      // Profile logic for legs
      let leftZ = (dir === 3) ? Z_FRONT_LEG : Z_BACK_LEG;
      let rightZ = (dir === 2) ? Z_FRONT_LEG : Z_BACK_LEG;
      if (dir === 0 || dir === 1) { leftZ = Z_FRONT_LEG; rightZ = Z_FRONT_LEG; }

      // Left Leg
      c.fillRect(legLX - 2*scale, hipY, 3*scale, footLY - hipY, pantsRamp[3], 3, leftZ);
      VP.drawBoot(c, legLX - 2*scale, footLY, dir, bootRamp, leftZ);

      // Right Leg
      c.fillRect(legRX - 2*scale, hipY, 3*scale, footRY - hipY, pantsRamp[3], 3, rightZ);
      VP.drawBoot(c, legRX - 2*scale, footRY, dir, bootRamp, rightZ);
    }

    // 4. Torso
    const torsoW = halfShW * 2;
    c.fillRect(16*scale - halfShW + 2*scale, torsoY, (halfShW - 2*scale) * 2, 1*scale, shirtRamp[3], 3, Z_TORSO);
    c.fillRect(16*scale - halfShW, torsoY + 2*scale, torsoW, hipY - torsoY, shirtRamp[3], 3, Z_TORSO);
    // Belt
    c.fillRect(16*scale - halfShW, hipY - 2*scale, torsoW, 2*scale, '#23160c', 4, Z_TORSO+1);
    c.setPixel(16*scale, hipY - 2*scale, '#edd06d', 4, Z_TORSO+2); // Buckle
    if (apronRamp && dir !== 1) {
      c.fillRect(16*scale - halfShW + 2*scale, torsoY + 4*scale, torsoW - 4*scale, hipY - torsoY + 6*scale, apronRamp[3], 3, Z_TORSO+3);
    }

    // 5. Arms
    const armLX = (16 - halfShW/scale - 1) * scale;
    const armRX = (16 + halfShW/scale) * scale;
    const handLY = Math.min(hipY + 4*scale, (pose.armLeft.y + bobY) * scale);
    const handRY = Math.min(hipY + 4*scale, (pose.armRight.y + bobY) * scale);

    let lArmZ = (dir === 3) ? Z_FRONT_ARM : Z_BACK_ARM;
    let rArmZ = (dir === 2) ? Z_FRONT_ARM : Z_BACK_ARM;
    if (dir === 0 || dir === 1) { lArmZ = Z_FRONT_ARM; rArmZ = Z_FRONT_ARM; }

    c.fillRect(armLX, torsoY + 2*scale, 2*scale, handLY - torsoY - 1*scale, shirtRamp[3], 3, lArmZ);
    VP.drawHand(c, armLX, handLY, skinRamp, 'open', lArmZ);

    c.fillRect(armRX, torsoY + 2*scale, 2*scale, handRY - torsoY - 1*scale, shirtRamp[3], 3, rArmZ);
    VP.drawHand(c, armRX, handRY, skinRamp, pose.tool.active ? 'fist' : 'open', rArmZ);

    // 6. Neck & Head
    c.fillRect(15*scale, neckY, 2*scale, 3*scale, skinRamp[1], 2, Z_HEAD);
    VP.drawCluster(c, 16*scale, headCenterY, 4*scale, 4*scale, skinRamp, Z_HEAD, 'UL');

    // 7. Face (High Fidelity)
    if (dir === 0 || dir === 2 || dir === 3) {
      const fX = 16*scale;
      const fY = headCenterY;
      
      // Eyes (more complex at 2x scale)
      if (dir === 0) {
        // Left eye
        c.fillRect(fX - 4, fY - 2, 2, 2, '#f0f4f8', 2, Z_HEAD+1); // Sclera
        c.fillRect(fX - 3, fY - 2, 2, 2, skinRamp[0], 2, Z_HEAD+2); // Iris
        c.setPixel(fX - 3, fY - 2, '#ffffff', 2, Z_HEAD+3); // Specular
        
        // Right eye
        c.fillRect(fX + 2, fY - 2, 2, 2, '#f0f4f8', 2, Z_HEAD+1);
        c.fillRect(fX + 3, fY - 2, 2, 2, skinRamp[0], 2, Z_HEAD+2);
        c.setPixel(fX + 3, fY - 2, '#ffffff', 2, Z_HEAD+3);
        
        // Eyebrows
        c.fillRect(fX - 5, fY - 4, 3, 1, hairRamp[1], 2, Z_HEAD+1);
        c.fillRect(fX + 2, fY - 4, 3, 1, hairRamp[1], 2, Z_HEAD+1);
        
        // Nose (geometry dependent)
        if (dna.face.noseGeometry === 'aquiline') {
           c.fillRect(fX - 1, fY, 2, 3, skinRamp[1], 2, Z_HEAD+1); // Shadow bridge
           c.fillRect(fX - 2, fY + 1, 1, 2, skinRamp[4], 2, Z_HEAD+2); // Highlight
        } else {
           c.fillRect(fX, fY, 1, 2, skinRamp[1], 2, Z_HEAD+1);
        }
        
        // Mouth
        c.fillRect(fX - 1, fY + 4, 3, 1, skinRamp[1], 2, Z_HEAD+1);
        if (dna.face.mouthShape === 'smile') {
           c.setPixel(fX - 2, fY + 3, skinRamp[1], 2, Z_HEAD+1);
           c.setPixel(fX + 2, fY + 3, skinRamp[1], 2, Z_HEAD+1);
        }
      }
    }

    // 8. Front Hair (Locks and Fringe)
    if (dna.hair.style !== 'bald') {
      const hX = 16*scale;
      const hY = headCenterY - 4*scale;
      // Main crown
      VP.drawCluster(c, hX, hY, 4*scale, 2*scale, hairRamp, Z_FRONT_HAIR, 'UL');
      // Fringe lock left
      VP.drawCurvedLock(c, hX - 2*scale, hY, hX - 4*scale, hY + 4*scale, 2*scale, hairRamp, -1, Z_FRONT_HAIR+1);
      // Fringe lock right
      VP.drawCurvedLock(c, hX + 2*scale, hY, hX + 4*scale, hY + 4*scale, 2*scale, hairRamp, 1, Z_FRONT_HAIR+1);
    }

    // 9. Tools
    if (pose.tool.active) {
      if (dna.heldTool === 'hoe' || dna.heldTool === 'felling_axe') {
         c.fillRect(armRX - 2*scale, handRY - 6*scale, 1*scale, 14*scale, '#7e512f', 4, Z_ACCESSORY);
         c.fillRect(armRX - 3*scale, handRY - 7*scale, 3*scale, 2*scale, '#83899c', 4, Z_ACCESSORY+1); // Iron head
      }
    }

    // 10. Conditions
    if (cond.wetness > 0.5) {
      // Darken overall
      for(let i=0; i<c.data.length; i+=4) {
        if(c.data[i+3] > 0) {
          c.data[i] = Math.max(0, c.data[i] * 0.8);
          c.data[i+1] = Math.max(0, c.data[i+1] * 0.8);
          c.data[i+2] = Math.max(0, c.data[i+2] * 0.8);
        }
      }
    }

    // Downsample & Outline
    const out = scale > 1 ? c.downsample(32, 48) : c;
    VP.applySelectiveOutline(out);
    return out;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterGenerator };
}
