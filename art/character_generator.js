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
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
  AS = (typeof window !== 'undefined' ? window : globalThis);
  CD = (typeof window !== 'undefined' ? window : globalThis);
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

    // 4. Torso & Overalls/Vests/Coats
    const torsoW = halfShW * 2;
    const isHeavy = dna.anatomy.archetype === 'broad_heavy';
    const isOveralls = !!dna.palette.overalls;
    const overallsRamp = isOveralls ? VP.makeRamp(dna.palette.overalls) : null;
    const vestRamp = dna.palette.vest ? VP.makeRamp(dna.palette.vest) : null;
    const coatRamp = dna.palette.coat ? VP.makeRamp(dna.palette.coat) : null;

    c.fillRect(16*scale - halfShW + 2*scale, torsoY, (halfShW - 2*scale) * 2, 1*scale, shirtRamp[3], 3, Z_TORSO);
    c.fillRect(16*scale - halfShW, torsoY + 2*scale, torsoW, hipY - torsoY, shirtRamp[3], 3, Z_TORSO);

    // Overalls (e.g. Blacksmith, Farmer)
    if (overallsRamp && dir !== 1) {
      // Bib & Straps
      c.fillRect(16*scale - halfShW + 2*scale, torsoY + 2*scale, torsoW - 4*scale, hipY - torsoY, overallsRamp[2], 3, Z_TORSO+1);
      // Straps with buckles
      c.fillRect(16*scale - halfShW + 2*scale, torsoY, 2*scale, hipY - torsoY, overallsRamp[1], 4, Z_TORSO+2);
      c.fillRect(16*scale + halfShW - 4*scale, torsoY, 2*scale, hipY - torsoY, overallsRamp[1], 4, Z_TORSO+2);
      c.setPixel(16*scale - halfShW + 2*scale, torsoY + 3*scale, '#d4a359', 4, Z_TORSO+3); // Brass buckle
      c.setPixel(16*scale + halfShW - 3*scale, torsoY + 3*scale, '#d4a359', 4, Z_TORSO+3);
      // Cargo pockets on thighs for heavy worker
      if (isHeavy) {
        c.fillRect(16*scale - halfShW - 1*scale, hipY + 2*scale, 2*scale, 5*scale, overallsRamp[1], 4, Z_FRONT_LEG+1);
        c.fillRect(16*scale + halfShW - 1*scale, hipY + 2*scale, 2*scale, 5*scale, overallsRamp[1], 4, Z_FRONT_LEG+1);
      }
    } else if (vestRamp && dir !== 1) {
      c.fillRect(16*scale - halfShW + 1*scale, torsoY + 2*scale, torsoW - 2*scale, hipY - torsoY, vestRamp[2], 3, Z_TORSO+1);
      // Center buttons
      c.setPixel(16*scale, torsoY + 4*scale, '#d4a359', 4, Z_TORSO+2);
      c.setPixel(16*scale, torsoY + 8*scale, '#d4a359', 4, Z_TORSO+2);
    }

    // Belt
    c.fillRect(16*scale - halfShW, hipY - 2*scale, torsoW, 2*scale, '#23160c', 4, Z_TORSO+2);
    c.setPixel(16*scale, hipY - 2*scale, '#edd06d', 4, Z_TORSO+3); // Buckle

    // Mayor Sash
    if (dna.palette.sash && dir === 0) {
      for (let s = 0; s < 14*scale; s++) {
        c.fillRect(16*scale - halfShW + 1*scale + Math.floor(s * 0.7), torsoY + s, 2*scale, 1*scale, '#e5a828', 4, Z_TORSO+4);
      }
      c.fillRect(16*scale + 2*scale, torsoY + 12*scale, 3*scale, 3*scale, '#ffd700', 4, Z_TORSO+5); // Medal
    }

    // Apron
    if (apronRamp && dir !== 1) {
      c.fillRect(16*scale - halfShW + 2*scale, torsoY + 4*scale, torsoW - 4*scale, hipY - torsoY + 6*scale, apronRamp[3], 3, Z_TORSO+3);
      // Flour dust on baker apron
      if (dna.role === 'baker') {
        c.setPixel(16*scale - 2*scale, torsoY + 7*scale, '#ffffff', 5, Z_TORSO+4);
        c.setPixel(16*scale + 1*scale, torsoY + 9*scale, '#ffffff', 5, Z_TORSO+4);
      }
    }

    // Coat / Cloak
    if (coatRamp) {
      c.fillRect(16*scale - halfShW - 1*scale, torsoY + 1*scale, 2*scale, hipY - torsoY + 8*scale, coatRamp[2], 3, Z_TORSO+4);
      c.fillRect(16*scale + halfShW - 1*scale, torsoY + 1*scale, 2*scale, hipY - torsoY + 8*scale, coatRamp[2], 3, Z_TORSO+4);
    }

    // 5. Arms & Hands / Gauntlets
    const armLX = (16 - halfShW/scale - 1) * scale;
    const armRX = (16 + halfShW/scale) * scale;
    const handLY = Math.min(hipY + 4*scale, (pose.armLeft.y + bobY) * scale);
    const handRY = Math.min(hipY + 4*scale, (pose.armRight.y + bobY) * scale);
    const armThick = isHeavy ? 3*scale : 2*scale;

    let lArmZ = (dir === 3) ? Z_FRONT_ARM : Z_BACK_ARM;
    let rArmZ = (dir === 2) ? Z_FRONT_ARM : Z_BACK_ARM;
    if (dir === 0 || dir === 1) { lArmZ = Z_FRONT_ARM; rArmZ = Z_FRONT_ARM; }

    // Bare muscular arms for blacksmith/workers
    const armColor = isHeavy ? skinRamp[3] : shirtRamp[3];
    c.fillRect(armLX, torsoY + 2*scale, armThick, handLY - torsoY - 1*scale, armColor, isHeavy ? 2 : 3, lArmZ);
    c.fillRect(armRX, torsoY + 2*scale, armThick, handRY - torsoY - 1*scale, armColor, isHeavy ? 2 : 3, rArmZ);

    // Bicep specular glint for muscular build
    if (isHeavy && dir === 0) {
      VP.drawGlint(c, armLX + 1*scale, torsoY + 4*scale, '#ffffff', lArmZ+1);
      VP.drawGlint(c, armRX + 1*scale, torsoY + 4*scale, '#ffffff', rArmZ+1);
    }

    // Gauntlets or Hands
    const gloveRamp = VP.makeRamp('#9c663b');
    if (dna.role === 'blacksmith' || dna.palette.heldAccessory === 'leather_gauntlets') {
      VP.drawGauntlet(c, armLX + 1*scale, handLY - 2*scale, armThick + 2*scale, 5*scale, gloveRamp, lArmZ+1);
      VP.drawGauntlet(c, armRX + 1*scale, handRY - 2*scale, armThick + 2*scale, 5*scale, gloveRamp, rArmZ+1);
    } else {
      VP.drawHand(c, armLX, handLY, skinRamp, 'open', lArmZ);
      VP.drawHand(c, armRX, handRY, skinRamp, pose.tool.active ? 'fist' : 'open', rArmZ);
    }

    // 6. Neck & Head
    c.fillRect(15*scale, neckY, 2*scale, 3*scale, skinRamp[1], 2, Z_HEAD);
    VP.drawCluster(c, 16*scale, headCenterY, 4*scale, 4*scale, skinRamp, Z_HEAD, 'UL');

    // 7. Face (High Fidelity)
    if (dir === 0 || dir === 2 || dir === 3) {
      const fX = 16*scale;
      const fY = headCenterY;
      
      // Eyes
      if (dir === 0) {
        c.fillRect(fX - 4, fY - 2, 2, 2, '#f0f4f8', 2, Z_HEAD+1);
        c.fillRect(fX - 3, fY - 2, 2, 2, skinRamp[0], 2, Z_HEAD+2);
        c.setPixel(fX - 3, fY - 2, '#ffffff', 2, Z_HEAD+3);
        
        c.fillRect(fX + 2, fY - 2, 2, 2, '#f0f4f8', 2, Z_HEAD+1);
        c.fillRect(fX + 3, fY - 2, 2, 2, skinRamp[0], 2, Z_HEAD+2);
        c.setPixel(fX + 3, fY - 2, '#ffffff', 2, Z_HEAD+3);
        
        // Brows
        c.fillRect(fX - 5, fY - 4, isHeavy ? 4 : 3, 1, hairRamp[0], 2, Z_HEAD+1);
        c.fillRect(fX + 2, fY - 4, isHeavy ? 4 : 3, 1, hairRamp[0], 2, Z_HEAD+1);
        
        // Nose
        c.fillRect(fX, fY, 1, 2, skinRamp[1], 2, Z_HEAD+1);
        
        // Mouth or Beard
        if (dna.face.facialHair === 'full_beard') {
          c.fillRect(fX - 4, fY + 2, 8, 4, hairRamp[1], 2, Z_HEAD+2);
          c.fillRect(fX - 3, fY + 6, 6, 2, hairRamp[0], 2, Z_HEAD+2);
        } else if (dna.face.facialHair === 'mustache' || dna.face.facialHair === 'handlebar_mustache') {
          c.fillRect(fX - 3, fY + 2, 6, 2, hairRamp[1], 2, Z_HEAD+2);
          if (dna.face.facialHair === 'handlebar_mustache') {
            c.setPixel(fX - 4, fY + 1, hairRamp[0], 2, Z_HEAD+2);
            c.setPixel(fX + 3, fY + 1, hairRamp[0], 2, Z_HEAD+2);
          }
        } else {
          c.fillRect(fX - 1, fY + 4, 3, 1, skinRamp[1], 2, Z_HEAD+1);
        }
      }
    }

    // 8. Front Hair & Headwear
    if (dna.hair.style === 'afro_curls') {
      VP.drawAfroClusters(c, 16*scale, headCenterY - 4*scale, 5*scale, 4*scale, hairRamp, Z_FRONT_HAIR);
    } else if (dna.hair.style !== 'bald') {
      const hX = 16*scale;
      const hY = headCenterY - 4*scale;
      VP.drawCluster(c, hX, hY, 4*scale, 2*scale, hairRamp, Z_FRONT_HAIR, 'UL');
      VP.drawCurvedLock(c, hX - 2*scale, hY, hX - 4*scale, hY + 4*scale, 2*scale, hairRamp, -1, Z_FRONT_HAIR+1);
      VP.drawCurvedLock(c, hX + 2*scale, hY, hX + 4*scale, hY + 4*scale, 2*scale, hairRamp, 1, Z_FRONT_HAIR+1);
    }

    // Headwear (Hats, Hoods, Toques, Beanies)
    if (dna.palette.hood) {
      const hoodRamp = VP.makeRamp(dna.palette.hood);
      // Hood surrounding face
      c.fillRect(16*scale - 6*scale, headCenterY - 6*scale, 12*scale, 2*scale, hoodRamp[3], 3, Z_FRONT_HAIR+2);
      c.fillRect(16*scale - 6*scale, headCenterY - 4*scale, 2*scale, 8*scale, hoodRamp[2], 3, Z_FRONT_HAIR+2);
      c.fillRect(16*scale + 4*scale, headCenterY - 4*scale, 2*scale, 8*scale, hoodRamp[2], 3, Z_FRONT_HAIR+2);
    } else if (dna.palette.hat) {
      const hatRamp = VP.makeRamp(dna.palette.hat);
      const hatY = headCenterY - 6*scale;
      if (dna.palette.heldAccessory === 'chef_toque') {
        // Baker pleated chef hat
        c.fillRect(16*scale - 5*scale, hatY - 4*scale, 10*scale, 6*scale, hatRamp[4], 3, Z_FRONT_HAIR+2);
        c.fillRect(16*scale - 4*scale, hatY + 2*scale, 8*scale, 2*scale, hatRamp[2], 3, Z_FRONT_HAIR+2);
      } else if (dna.palette.heldAccessory === 'tophat_sash') {
        // Mayor top hat with feather
        c.fillRect(16*scale - 6*scale, hatY + 1*scale, 12*scale, 1*scale, hatRamp[1], 4, Z_FRONT_HAIR+2); // Brim
        c.fillRect(16*scale - 4*scale, hatY - 5*scale, 8*scale, 6*scale, hatRamp[2], 4, Z_FRONT_HAIR+2);
        c.fillRect(16*scale - 4*scale, hatY, 8*scale, 1*scale, '#d4a359', 4, Z_FRONT_HAIR+3); // Gold ribbon
      } else if (dna.palette.heldAccessory === 'beanie') {
        // Fisherman knit beanie with pom-pom
        c.fillRect(16*scale - 5*scale, hatY - 1*scale, 10*scale, 4*scale, hatRamp[3], 3, Z_FRONT_HAIR+2);
        c.ellipse(16*scale, hatY - 2*scale, 2*scale, 2*scale, hatRamp[4], 3, Z_FRONT_HAIR+3); // Pom-pom
      } else {
        // Farmer straw hat
        c.fillRect(16*scale - 8*scale, hatY + 1*scale, 16*scale, 2*scale, hatRamp[3], 4, Z_FRONT_HAIR+2); // Brim
        c.fillRect(16*scale - 4*scale, hatY - 3*scale, 8*scale, 4*scale, hatRamp[4], 4, Z_FRONT_HAIR+2); // Crown
      }
    }

    // 9. Held Tools & Accessories
    if (dna.heldTool === 'sledgehammer' || dna.role === 'blacksmith') {
      // Sledgehammer resting on shoulder or held
      const hammerX = armRX + 1*scale;
      const hammerY = handRY - 12*scale;
      // Handle (Wood)
      c.fillRect(hammerX - 2*scale, hammerY, 2*scale, 14*scale, '#82522c', 4, Z_ACCESSORY);
      // Heavy Steel Head with Bevel and Specular
      const steelRamp = VP.makeRamp('#9ba3b8');
      VP.drawBevelBox(c, hammerX - 5*scale, hammerY - 4*scale, 8*scale, 5*scale, steelRamp, Z_ACCESSORY+1);
      VP.drawGlint(c, hammerX - 4*scale, hammerY - 4*scale, '#ffffff', Z_ACCESSORY+2);
    } else if (dna.heldTool === 'fishing_rod') {
      const rodX = armRX + 1*scale;
      c.fillRect(rodX, handRY - 16*scale, 1*scale, 20*scale, '#a16538', 4, Z_ACCESSORY);
      c.fillRect(rodX - 2*scale, handRY - 12*scale, 1*scale, 16*scale, '#e0e8f5', 4, Z_ACCESSORY+1); // Line
    } else if (dna.palette.heldAccessory === 'flower_basket') {
      // Herbalist basket of lavender and herbs
      const bX = 16*scale;
      const bY = hipY + 1*scale;
      const wickerRamp = VP.makeRamp('#966336');
      VP.drawBevelBox(c, bX - 5*scale, bY, 10*scale, 6*scale, wickerRamp, Z_ACCESSORY);
      // Lavender purple flowers & green herbs
      c.fillRect(bX - 4*scale, bY - 2*scale, 3*scale, 2*scale, '#8e7cc3', 5, Z_ACCESSORY+1);
      c.fillRect(bX + 1*scale, bY - 2*scale, 4*scale, 2*scale, '#45813f', 5, Z_ACCESSORY+1);
    } else if (dna.palette.heldAccessory === 'coin_pouch') {
      // Merchant coin pouch
      c.ellipse(armRX - 1*scale, hipY + 1*scale, 2*scale, 3*scale, '#8c5932', 4, Z_ACCESSORY);
      c.setPixel(armRX - 1*scale, hipY - 1*scale, '#f1c232', 5, Z_ACCESSORY+1); // Gold coin
    } else if (pose.tool.active) {
      if (dna.heldTool === 'hoe' || dna.heldTool === 'felling_axe') {
        c.fillRect(armRX - 2*scale, handRY - 6*scale, 1*scale, 14*scale, '#7e512f', 4, Z_ACCESSORY);
        c.fillRect(armRX - 3*scale, handRY - 7*scale, 3*scale, 2*scale, '#83899c', 4, Z_ACCESSORY+1);
      }
    }

    // 10. Conditions (Wet, Mud, Dirt)
    if (cond.wetness > 0.5) {
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

if (typeof window !== 'undefined') {
  window.CharacterGenerator = CharacterGenerator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterGenerator };
}
