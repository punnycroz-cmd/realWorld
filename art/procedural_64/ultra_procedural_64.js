/**
 * Natura Ultra-Detailed Procedural 64x64 Character Generator (Phase 16 - Mastercraft)
 * 
 * Implements advanced master pixel-art techniques:
 * 1. Bayer Ordered Dithering (2x2 & 4x4) for fabric weave & volumetric skin/leather texture
 * 2. Selective Outlining (Sel-out) & Sub-pixel Anti-Aliasing (soft transitions, zero harsh black frames)
 * 3. Micro-anatomy: detailed irises with catchlights, eyelids, jaw ambient occlusion, collarbones
 * 4. Micro-accessories: brass buttons, leather side-pouches with buckle studs, knee-creases, boots with cuffs
 * 5. Dynamic Rim-lighting & Specular edge sheens on metal/tools
 */
'use strict';

const VP = require('../visual_primitives.js');
const AS = require('../animation_system.js');
const PAS = require('../profession_animation_system.js').ProfessionAnimationSystem;

// 4x4 Bayer Matrix for ordered dithering
const BAYER_4X4 = [
  [ 0,  8,  2, 10],
  [12,  4, 14,  6],
  [ 3, 11,  1,  9],
  [15,  7, 13,  5]
];

function isDitherPixel(x, y, threshold) {
  const bx = Math.abs(x) % 4;
  const by = Math.abs(y) % 4;
  return BAYER_4X4[by][bx] < threshold;
}

class UltraDetailProcedural64 {
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0) {
    const c = new VP.PixelCanvas(64, 64);

    // Resolve kinematic pose
    let pose;
    const role = (dna.role || 'farmer').toLowerCase();
    if (act === 'profession' || act === 'work' || act === 'action') {
      pose = PAS.getProfessionPose(role, frame, dir);
    } else {
      pose = AS.AnimationSystem.getPose(act, frame, dir, dna.condition || {}, dna.ageYears || 30);
    }

    // Extended 9-Tone Palette Ramps (Deep Ambient Occlusion -> Base -> Key Light -> Specular Peak)
    const skinTone = (dna.colors && dna.colors.skin) || (dna.face && dna.face.skinRampKey === 'deep' ? '#995634' : '#dda078');
    const skinRamp = [
      VP.shade(skinTone, 0.35), // 0: Deep Occlusion
      VP.shade(skinTone, 0.52), // 1: Shadow
      VP.shade(skinTone, 0.72), // 2: Mid-shadow
      skinTone,                 // 3: Base skin
      VP.mix(skinTone, '#fff0dd', 0.25), // 4: Soft light
      VP.mix(skinTone, '#fff8ee', 0.45), // 5: Highlight
      '#ffffff'                          // 6: Specular catchlight
    ];

    const hairHex = (dna.colors && dna.colors.hair) || (dna.hair && dna.hair.colorRampKey === 'blonde' ? '#c7923e' : '#3e2723');
    const hairRamp = VP.makeRamp(hairHex);

    const shirtHex = (dna.palette && dna.palette.shirt) || (dna.colors && dna.colors.dress) || '#35633f';
    const shirtRamp = VP.makeRamp(shirtHex);

    const pantsHex = (dna.palette && dna.palette.pants) || '#25395c';
    const pantsRamp = VP.makeRamp(pantsHex);

    const leatherRamp = VP.makeRamp('#5c3014');
    const woodRamp = ['#271202', '#451e06', '#632e0c', '#78350f', '#9a3412', '#b45309', '#d97706'];
    const metalRamp = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#e2e8f0'];
    const brassRamp = ['#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fef08a'];

    // Coordinates & Scale
    const cx = 32;
    const groundBaselineY = 58;
    const bobY = Math.round(pose.comBobY * 1.5);
    const headBobY = Math.round((pose.headBobY || 0) * 1.5);

    const isHeavy = dna.anatomy && dna.anatomy.archetype === 'broad_heavy';
    const shoulderHalfW = isHeavy ? 13 : 10;
    const torsoW = shoulderHalfW * 2;
    const waistW = isHeavy ? 20 : 15;

    const headY = 16 + bobY + headBobY;
    const chestY = 24 + bobY;
    const hipY = 38 + bobY;

    // --- 1. Realistic Cast Contact Shadow with Soft Falloff ---
    c.ellipse(cx, groundBaselineY + 1, shoulderHalfW + 4, 3.5, 'rgba(10, 15, 26, 0.45)', 0, 0);
    c.ellipse(cx, groundBaselineY + 1, shoulderHalfW + 1, 2, 'rgba(5, 8, 15, 0.3)', 0, 0);

    // --- 2. Flowing Back Hair (Layered strands & volumetric occlusion) ---
    if (dir === 1 || (dna.hair && (dna.hair.style === 'long' || dna.hair.style === 'braided'))) {
      VP.drawCluster(c, cx, headY - 1, 11, 10, hairRamp, 10, 'UL');
      // Dithered strands cascading down back
      for (let hy = headY + 5; hy <= headY + 20; hy++) {
        const spread = Math.round(8 * (1 - (hy - headY - 5) / 25));
        for (let hx = cx - spread; hx <= cx + spread; hx++) {
          const tone = isDitherPixel(hx, hy, 8) ? hairRamp[2] : hairRamp[1];
          c.setPixel(hx, hy, tone, 2, 11);
        }
      }
    }

    // --- 3. Legs with Knee Wrinkles, Fabric Weave Dithering & Cuff Straps ---
    const legSwing = (act === 'walk') ? Math.sin(frame * Math.PI / 3) * 6 : 0;
    const leftFootY = groundBaselineY - Math.max(0, legSwing);
    const rightFootY = groundBaselineY - Math.max(0, -legSwing);

    const legLX = cx - (isHeavy ? 6 : 5) - (dir === 2 ? 3 : (dir === 3 ? -3 : 0));
    const legRX = cx + (isHeavy ? 6 : 5) + (dir === 2 ? -3 : (dir === 3 ? 3 : 0));

    // Helper: Draw Pant Leg with Fabric Creases
    function drawPantLeg(lx, topY, botY, swingOff, zOrder) {
      const legW = 3.5;
      for (let y = topY; y <= botY; y++) {
        const t = (y - topY) / (botY - topY);
        const curX = Math.round(lx + swingOff * t);
        for (let dx = -Math.floor(legW); dx <= Math.floor(legW); dx++) {
          let tone = pantsRamp[3];
          // Cylindrical lighting from left
          if (dx < -1) tone = pantsRamp[4];
          else if (dx > 1) tone = pantsRamp[2];
          
          // Knee fold crease at t ~ 0.5
          if (Math.abs(t - 0.5) < 0.08 && y % 2 === 0) {
            tone = pantsRamp[1]; // shadow crease
          } else if (Math.abs(t - 0.52) < 0.05) {
            tone = pantsRamp[5]; // highlight ridge
          }
          // Micro-dither fabric weave texture
          if (isDitherPixel(curX + dx, y, 3) && tone === pantsRamp[3]) {
            tone = pantsRamp[4];
          }
          c.setPixel(curX + dx, y, tone, 3, zOrder);
        }
      }
      // Ankle Cuff & Boot
      c.fillRect(lx + swingOff - 3, botY - 3, 7, 2, leatherRamp[1], 4, zOrder + 1); // Ankle strap
      c.setPixel(lx + swingOff + 1, botY - 2, brassRamp[5], 4, zOrder + 2); // Tiny brass buckle
      VP.drawBoot(c, lx + swingOff - 2, botY, dir, leatherRamp, zOrder + 1);
    }

    drawPantLeg(legLX, hipY, leftFootY - 2, (dir === 2 ? -legSwing : 0), 20);
    drawPantLeg(legRX, hipY, rightFootY - 2, (dir === 3 ? legSwing : 0), 21);

    // --- 4. Torso with Double-Stitched Seams, Buttons, Leather Apron & Side Pouch ---
    // Under-tunic base with Bayer Dithering
    for (let y = chestY; y <= hipY; y++) {
      const t = (y - chestY) / (hipY - chestY);
      const curHalfW = Math.round(shoulderHalfW - t * (shoulderHalfW - waistW / 2));
      for (let x = cx - curHalfW; x <= cx + curHalfW; x++) {
        let tone = shirtRamp[3];
        // Volume: left lit, right shadowed
        const distFromCenter = (x - cx) / curHalfW;
        if (distFromCenter < -0.45) tone = shirtRamp[4];
        else if (distFromCenter > 0.45) tone = shirtRamp[2];

        // Cloth texture dither
        if (isDitherPixel(x, y, 4)) {
          if (tone === shirtRamp[3]) tone = shirtRamp[4];
          else if (tone === shirtRamp[2]) tone = shirtRamp[1];
        }
        c.setPixel(x, y, tone, 3, 30);
      }
      // Double stitched vertical center hem
      if (dir === 0) {
        c.setPixel(cx, y, shirtRamp[1], 3, 31);
        c.setPixel(cx + 1, y, shirtRamp[4], 3, 31);
      }
    }

    // Brass Buttons along tunic center (dir === 0)
    if (dir === 0) {
      [chestY + 3, chestY + 7, chestY + 11].forEach(by => {
        c.setPixel(cx, by, brassRamp[5], 4, 33);
        c.setPixel(cx, by + 1, brassRamp[1], 4, 33); // drop shadow below button
      });
    }

    // Role-Specific Apron / Heavy Armor Overlays
    if (role === 'blacksmith' || role === 'miner') {
      // Textured Hammered Leather Apron
      const apronHalfW = 7;
      for (let ay = chestY + 2; ay <= hipY + 5; ay++) {
        const apronW = Math.min(16, Math.round(apronHalfW * 2 + (ay - chestY) * 0.3));
        const ax0 = cx - Math.floor(apronW / 2);
        for (let ax = ax0; ax < ax0 + apronW; ax++) {
          let tone = leatherRamp[3];
          if (ax < ax0 + 3) tone = leatherRamp[4]; // Top-left sheen
          else if (ax > ax0 + apronW - 3) tone = leatherRamp[1]; // Shade
          // Worn leather crackle dither
          if (isDitherPixel(ax, ay, 5)) tone = leatherRamp[2];
          c.setPixel(ax, ay, tone, 4, 35);
        }
      }
      // Crossed brass rivets on bib
      c.setPixel(cx - 5, chestY + 3, brassRamp[5], 4, 36);
      c.setPixel(cx + 4, chestY + 3, brassRamp[5], 4, 36);
    }

    // Ornate Sturdy Belt with Metal Buckle & Side Leather Pouch
    c.fillRect(cx - Math.floor(waistW / 2) - 1, hipY - 2, waistW + 2, 4, '#1c1917', 4, 37);
    c.fillRect(cx - Math.floor(waistW / 2) - 1, hipY - 2, waistW + 2, 1, '#3a3434', 4, 38); // Belt top edge
    // Heavy Double-Frame Buckle
    c.fillRect(cx - 3, hipY - 3, 6, 5, brassRamp[2], 4, 39);
    c.fillRect(cx - 2, hipY - 2, 4, 3, brassRamp[5], 4, 40);
    c.setPixel(cx, hipY - 1, '#1c1917', 4, 41); // Buckle prong
    c.setPixel(cx - 2, hipY - 2, '#ffffff', 4, 42); // Buckle specular shine

    // Micro-accessory: Adventurer / Craftsman Side Pouch hanging on right hip
    c.fillRect(cx + Math.floor(waistW / 2) - 3, hipY + 1, 5, 5, leatherRamp[2], 4, 38);
    c.fillRect(cx + Math.floor(waistW / 2) - 3, hipY + 1, 5, 2, leatherRamp[3], 4, 39); // Pouch flap
    c.setPixel(cx + Math.floor(waistW / 2) - 1, hipY + 3, brassRamp[5], 4, 40); // Flap clasp stud

    // --- 5. Volumetric Arms with Bicep Bulge & Leather Cuffs ---
    const armSwing = (act === 'walk') ? Math.sin(frame * Math.PI / 3) * 6 : 0;
    const armLX = cx - shoulderHalfW - 1;
    const armRX = cx + shoulderHalfW + 1;
    const handLY = hipY + 2 - armSwing;
    const handRY = hipY + 2 + armSwing;

    // Left Arm & Wristband
    VP.drawLimbCylinder(c, armLX, chestY + 2, armLX - 1, handLY - 2, 3.2, shirtRamp, 40, true);
    c.fillRect(armLX - 3, handLY - 3, 4, 2, leatherRamp[1], 4, 41); // Leather wrist brace
    VP.drawHand(c, armLX - 1, handLY, skinRamp, 'open', 42);

    // Right Arm & Wristband
    VP.drawLimbCylinder(c, armRX, chestY + 2, armRX + 1, handRY - 2, 3.2, shirtRamp, 40, true);
    c.fillRect(armRX, handRY - 3, 4, 2, leatherRamp[1], 4, 41);
    VP.drawHand(c, armRX + 1, handRY, skinRamp, 'fist', 43);

    // --- 6. Expressive Head, Jawline Ambient Occlusion & Micro-Eyes ---
    // Neck with Sternocleidomastoid shadow
    c.fillRect(cx - 3, headY + 5, 6, 4, skinRamp[2], 2, 48);
    c.setPixel(cx - 2, headY + 7, skinRamp[1], 2, 49); // Collarbone shadow dip

    // Cranium with volumetric lighting
    VP.drawCluster(c, cx, headY, 8.5, 7.5, skinRamp, 50, 'UL');

    if (dir === 0) {
      // Under-chin cast shadow
      c.fillRect(cx - 5, headY + 5, 10, 2, skinRamp[1], 2, 51);

      // Micro-Eyes with Upper Eyelid, Colored Iris & Catchlight
      // Left Eye
      c.fillRect(cx - 6, headY - 2, 4, 1, skinRamp[1], 1, 52); // Upper eyelid crease
      c.fillRect(cx - 6, headY - 1, 4, 2, '#ffffff', 1, 52); // Sclera
      c.fillRect(cx - 5, headY - 1, 2, 2, '#0f172a', 1, 53); // Deep pupil
      c.setPixel(cx - 5, headY, '#38bdf8', 1, 54); // Iris lower glow
      c.setPixel(cx - 6, headY - 1, '#ffffff', 1, 55); // Eye catchlight!

      // Right Eye
      c.fillRect(cx + 2, headY - 2, 4, 1, skinRamp[1], 1, 52);
      c.fillRect(cx + 2, headY - 1, 4, 2, '#ffffff', 1, 52);
      c.fillRect(cx + 2, headY - 1, 2, 2, '#0f172a', 1, 53);
      c.setPixel(cx + 3, headY, '#38bdf8', 1, 54);
      c.setPixel(cx + 2, headY - 1, '#ffffff', 1, 55);

      // Arched Eyebrows with highlight edge
      c.fillRect(cx - 6, headY - 3, 4, 1, hairRamp[1], 2, 56);
      c.fillRect(cx + 2, headY - 3, 4, 1, hairRamp[1], 2, 56);

      // Nose: highlighted bridge + shaded nostril
      c.setPixel(cx, headY, skinRamp[5], 2, 53);
      c.fillRect(cx - 1, headY + 1, 2, 1, skinRamp[4], 2, 53);
      c.setPixel(cx + 1, headY + 2, skinRamp[1], 2, 53); // nostril shadow

      // Mouth & Cupid's Bow
      c.fillRect(cx - 2, headY + 4, 4, 1, skinRamp[1], 2, 52);
      c.setPixel(cx, headY + 3, skinRamp[5], 2, 52);

      // Blacksmith Rugged Full Beard with strand highlights
      if (role === 'blacksmith' || role === 'miner') {
        c.fillRect(cx - 6, headY + 4, 12, 6, hairRamp[2], 2, 57);
        c.fillRect(cx - 5, headY + 9, 10, 4, hairRamp[1], 2, 57);
        // Beard hair strand highlights
        c.setPixel(cx - 3, headY + 6, hairRamp[4], 2, 58);
        c.setPixel(cx + 2, headY + 7, hairRamp[4], 2, 58);
        c.setPixel(cx, headY + 10, hairRamp[4], 2, 58);
      }
    }

    // --- 7. Front Layered Hair with Strand Dithering & Fringe Volumetrics ---
    VP.drawCluster(c, cx, headY - 4, 9.5, 6, hairRamp, 60, 'UL');
    VP.drawCurvedLock(c, cx - 7, headY - 3, cx - 9, headY + 5, 3.5, hairRamp, -1, 62);
    VP.drawCurvedLock(c, cx + 7, headY - 3, cx + 9, headY + 5, 3.5, hairRamp, 1, 62);
    // Forehead bangs fringes with highlights
    for (let bx = cx - 5; bx <= cx + 4; bx++) {
      if (isDitherPixel(bx, headY - 3, 8)) {
        c.setPixel(bx, headY - 2, hairRamp[5], 2, 63); // Golden sheen on hair crest
      }
    }

    // --- 8. Handcrafted Heavy Forge Hammer with Damascus Texture & Glint ---
    if (role === 'blacksmith') {
      const hx = armRX + 3;
      const hy = handRY - (act === 'profession' ? 12 : 6);
      
      // Carved wooden haft with grip wraps
      for (let wy = hy - 4; wy <= hy + 14; wy++) {
        c.fillRect(hx, wy, 2, 1, (wy % 3 === 0) ? '#1c1917' : woodRamp[3], 4, 70); // leather grip wraps
      }
      // Forged Steel Sledge Head with Bevels
      VP.drawBevelBox(c, hx - 5, hy - 9, 12, 7, metalRamp, 72);
      // Hard specular glint on hammer corner
      c.setPixel(hx - 4, hy - 8, '#ffffff', 5, 75);
      c.setPixel(hx - 3, hy - 8, '#cbd5e1', 5, 75);
      // Red-hot tempered face (sparking heat!)
      if (act === 'profession') {
        c.fillRect(hx + 5, hy - 8, 2, 5, '#f97316', 5, 76);
        c.setPixel(hx + 6, hy - 7, '#fef08a', 5, 77); // Sparking core
      }
    }

    // --- 9. Selective Outlining (Sel-out: soften light-facing edges, avoid harsh comic lines) ---
    VP.applySelectiveOutline(c);

    // Apply Rim-Lighting pass along the left contour
    for (let y = 8; y < 58; y++) {
      for (let x = 8; x < 56; x++) {
        const idx = (y * 64 + x) * 4;
        const leftIdx = (y * 64 + (x - 1)) * 4;
        // Edge transition from transparent to opaque on left
        if (c.data[idx + 3] > 0 && c.data[leftIdx + 3] === 0) {
          // Add subtle atmospheric rim highlight on shoulder/head
          if (y < 35) {
            c.data[idx] = Math.min(255, c.data[idx] + 40);
            c.data[idx + 1] = Math.min(255, c.data[idx + 1] + 40);
            c.data[idx + 2] = Math.min(255, c.data[idx + 2] + 60);
          }
        }
      }
    }

    return c;
  }
}

module.exports = { UltraDetailProcedural64 };
