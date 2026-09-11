/**
 * Natura Character Compositor (Phase 16 - Art-First Renderer)
 * 
 * Orchestrates all modular painters into a cohesive, high-fidelity pixel-art sprite:
 * 1. Pose kinematics & Center-of-Mass bobbing
 * 2. Ground shadow
 * 3. Back hair
 * 4. Lower body: legs, trousers/skirt, boots
 * 5. Torso: ribcage, shirt/tunic, overalls/apron, belt
 * 6. Upper limbs: arms, sleeves, articulated hands
 * 7. Head: neck, facial planes, expressive eyes, brows, nose, blush, mouth
 * 8. Front hair: crown volume, fringe locks, specular sheen
 * 9. Accessories: iconic hats, held tools with grip alignment
 * 10. Status overlays & selective adaptive contouring
 */
'use strict';

let VP, MaterialPainter, AnatomyPainter, FacePainter, HairPainter, GarmentPainter, AccessoryPainter, PosePainter;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  MaterialPainter = require('./material_painter.js').MaterialPainter;
  AnatomyPainter = require('./anatomy_painter.js').AnatomyPainter;
  FacePainter = require('./face_painter.js').FacePainter;
  HairPainter = require('./hair_painter.js').HairPainter;
  GarmentPainter = require('./garment_painter.js').GarmentPainter;
  AccessoryPainter = require('./accessory_painter.js').AccessoryPainter;
  PosePainter = require('./pose_painter.js').PosePainter;
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
  MaterialPainter = (typeof window !== 'undefined' ? window.MaterialPainter : globalThis.MaterialPainter);
  AnatomyPainter = (typeof window !== 'undefined' ? window.AnatomyPainter : globalThis.AnatomyPainter);
  FacePainter = (typeof window !== 'undefined' ? window.FacePainter : globalThis.FacePainter);
  HairPainter = (typeof window !== 'undefined' ? window.HairPainter : globalThis.HairPainter);
  GarmentPainter = (typeof window !== 'undefined' ? window.GarmentPainter : globalThis.GarmentPainter);
  AccessoryPainter = (typeof window !== 'undefined' ? window.AccessoryPainter : globalThis.AccessoryPainter);
  PosePainter = (typeof window !== 'undefined' ? window.PosePainter : globalThis.PosePainter);
}

class CharacterCompositor {
  /**
   * Renders a complete high-fidelity character frame (default 64x64)
   */
  static render(dna, dir = 0, act = 'idle', frame = 0, condition = {}, outW = 64, outH = 64) {
    const c = new VP.PixelCanvas(64, 64);
    const cond = Object.assign({}, dna.condition || {}, condition || {});
    const transforms = PosePainter.getTransforms(act, frame, dir, cond, dna.ageYears);

    // Anatomical Anchors
    const midX = 32 + transforms.torsoTiltX;
    const bobY = transforms.bobY;
    const headCenterY = 22 + bobY + transforms.headBobY;
    const neckY = headCenterY + 8;
    const torsoY = headCenterY + 11;
    const hipY = torsoY + 14;
    const groundY = 56;

    // Palette & Material Ramps
    const skinRamp = MaterialPainter.getRamp('skin', 
      dna.face.skinRampKey === 'deep' ? '#995634' :
      (dna.face.skinRampKey === 'light' ? '#dda078' : '#c47d4e')
    );
    const shirtRamp = MaterialPainter.getRamp(dna.clothing.fabric || 'linen', dna.palette.shirt || '#35633f');
    const pantsRamp = MaterialPainter.getRamp('cotton', dna.palette.pants || '#25395c');
    const bootRamp = MaterialPainter.getRamp('leather', dna.palette.boots || '#422810');
    const apronRamp = dna.palette.apron ? MaterialPainter.getRamp('linen', dna.palette.apron) : null;

    // Width Scales
    const isChild = dna.ageYears < 7;
    const isHeavy = dna.anatomy.archetype === 'broad_heavy';
    const torsoW = isHeavy ? 18 : (isChild ? 12 : 16);
    const halfTorsoW = Math.floor(torsoW / 2);

    // 1. Soft Elliptical Ground Shadow
    c.ellipse(midX, groundY + 1, isChild ? 9 : 13, 3, 'rgba(20, 14, 10, 0.45)', 0, 0);

    // 2. Back Hair (Z = 15)
    HairPainter.paintBackHair(c, midX, headCenterY, dna, dir, 15);

    // 3. Lower Body: Legs & Trousers / Skirt (Z = 25 - 35)
    const isSkirt = dna.clothing.layers && dna.clothing.layers.trousersOrSkirt === 'skirt';
    const legLX = midX - 4;
    const legRX = midX + 4;

    if (isSkirt && dir !== 2 && dir !== 3) {
      GarmentPainter.paintSkirt(c, midX, hipY, transforms.footLY - 2, torsoW + 2, pantsRamp, dir, 28);
      AnatomyPainter.paintBoot(c, legLX - 1, transforms.footLY, bootRamp, dir, 25);
      AnatomyPainter.paintBoot(c, legRX + 1, transforms.footRY, bootRamp, dir, 25);
    } else {
      GarmentPainter.paintTrousers(c, legLX, legRX, hipY, transforms.footLY, transforms.footRY, pantsRamp, dir, 28);
      AnatomyPainter.paintBoot(c, legLX, transforms.footLY, bootRamp, dir, 25);
      AnatomyPainter.paintBoot(c, legRX, transforms.footRY, bootRamp, dir, 25);
    }

    // 4. Torso & Upper Garments (Z = 40 - 50)
    GarmentPainter.paintShirt(c, midX, torsoY, torsoW, 14, shirtRamp, dir, 42);

    // Work Apron
    if (apronRamp || dna.role === 'farmer' || dna.role === 'baker' || dna.role === 'blacksmith') {
      const aRamp = apronRamp || MaterialPainter.getRamp('leather', '#8b5a2b');
      GarmentPainter.paintApron(c, midX, torsoY, hipY, torsoW, aRamp, dna.role, dir, 46);
    }

    // Belt
    GarmentPainter.paintBelt(c, midX, hipY - 1, torsoW + 1, '#24140a', '#eab308', 48);

    // 5. Upper Limbs: Arms & Hands (Z = 50 - 55 and 80 - 85)
    const armLX = midX - halfTorsoW - 2;
    const armRX = midX + halfTorsoW + 2;
    const handLY = transforms.armLY;
    const handRY = transforms.armRY;

    // Left Arm (Back limb if facing left)
    const lArmZ = (dir === 2) ? 80 : 50;
    const rArmZ = (dir === 3) ? 80 : 82;

    const armColor = (isHeavy && dir === 0 && dna.role === 'blacksmith') ? skinRamp : shirtRamp;
    AnatomyPainter.paintLimb(c, armLX + 1, torsoY + 2, transforms.handLX, handLY, 4, 3, armColor, dir, lArmZ);
    AnatomyPainter.paintHand(c, transforms.handLX, handLY, skinRamp, 'open', dir, lArmZ + 2);

    // Right Arm (Tool-holding arm)
    AnatomyPainter.paintLimb(c, armRX - 1, torsoY + 2, transforms.handRX, handRY, 4, 3, armColor, dir, rArmZ);
    AnatomyPainter.paintHand(c, transforms.handRX, handRY, skinRamp, transforms.toolActive ? 'fist' : 'open', dir, rArmZ + 2);

    // 6. Neck & Head Anatomy (Z = 55 - 65)
    AnatomyPainter.paintNeck(c, midX, neckY - 1, 6, 4, skinRamp, 55);
    FacePainter.paintFace(c, midX, headCenterY, dna, dir, (frame % 4 === 1 && act === 'idle'), (act === 'talk'), 60);

    // 7. Front Hair (Z = 70)
    HairPainter.paintFrontHair(c, midX, headCenterY, dna, dir, 70);

    // 8. Headwear & Held Accessories (Z = 75 - 90)
    AccessoryPainter.paintHeadwear(c, midX, headCenterY, dna.role || dna.profession, dir, 75);
    AccessoryPainter.paintHeldTool(c, transforms.handRX, handRY, dna.role || dna.profession, dir, 90);

    // 9. Status Overlays
    PosePainter.applyStatusOverlays(c, cond, dir);

    // 10. Selective Adaptive Contouring (Dark 1px crisp outer boundary)
    this.applySelectiveContour(c);

    // Downsample if a smaller legacy output resolution is requested
    if (outW < 64 || outH < 64) {
      return this.downsampleToLegacy(c, outW, outH);
    }

    return c;
  }

  /**
   * Applies selective, adaptive contouring:
   * Creates a crisp 1-pixel dark perimeter without muddying internal micro-details.
   */
  static applySelectiveContour(c) {
    const w = c.width, h = c.height;
    const isSolid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (c.data[i * 4 + 3] > 25) isSolid[i] = 1;
    }

    const OUTLINE_COLOR = { r: 20, g: 14, b: 10 }; // Rich dark charcoal

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (isSolid[idx] === 1) continue; // Skip solid interior pixels

        // Check if adjacent to solid character pixel
        if (
          isSolid[idx - 1] === 1 ||
          isSolid[idx + 1] === 1 ||
          isSolid[idx - w] === 1 ||
          isSolid[idx + w] === 1
        ) {
          const pIdx = idx * 4;
          c.data[pIdx] = OUTLINE_COLOR.r;
          c.data[pIdx + 1] = OUTLINE_COLOR.g;
          c.data[pIdx + 2] = OUTLINE_COLOR.b;
          c.data[pIdx + 3] = 255;
        }
      }
    }
  }

  /**
   * Contrast-preserving downsampling for legacy 32x48 canvas targets
   */
  static downsampleToLegacy(sourceCanvas, targetW, targetH) {
    const target = new VP.PixelCanvas(targetW, targetH);
    const scaleX = sourceCanvas.width / targetW;
    const scaleY = sourceCanvas.height / targetH;

    for (let dy = 0; dy < targetH; dy++) {
      for (let dx = 0; dx < targetW; dx++) {
        const sx = Math.floor(dx * scaleX);
        const sy = Math.floor(dy * scaleY);
        const sIdx = (sy * sourceCanvas.width + sx) * 4;
        
        if (sourceCanvas.data[sIdx + 3] > 30) {
          const dIdx = (dy * targetW + dx) * 4;
          target.data[dIdx] = sourceCanvas.data[sIdx];
          target.data[dIdx + 1] = sourceCanvas.data[sIdx + 1];
          target.data[dIdx + 2] = sourceCanvas.data[sIdx + 2];
          target.data[dIdx + 3] = sourceCanvas.data[sIdx + 3];
        }
      }
    }
    return target;
  }
}

if (typeof window !== 'undefined') {
  window.CharacterCompositor = CharacterCompositor;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CharacterCompositor };
}
