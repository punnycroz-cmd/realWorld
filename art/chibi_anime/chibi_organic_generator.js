/**
 * Chibi Anime Organic Curves Procedural Generator (Phase 17 - Anime Master)
 * 
 * Directly learns and reproduces the artistic DNA of the user's reference images:
 * 1. 1:3.5 Chibi Anime Proportions (Large expressive head, warm rounded cheeks, compact body)
 * 2. Expressive Anime Face:
 *    - 2x3 to 3x5 soft dark pupil with warm chocolate iris + distinct white catchlight
 *    - Cute rounded peach blush (#d57c44 / #f472b6) under cheekbones
 *    - Delicate open smile & visible nose dot
 * 3. Organic Bezier & Spline Curves:
 *    - Tilted broad conical straw hat with curved woven weave lines
 *    - Puffed chef toque and messy hair buns with bezier volume
 *    - Curved sickle blade & golden artisan bread loaf with diagonal crust score marks
 * 4. Crisp 1-Pixel Black Outer Contour (Bold readability on transparent background)
 * 5. Cell-Shaded Anime Volume (Highlights, warm mid-tones, deep drop shadows)
 * 
 * Supports both:
 * - '64x64': Compact game-ready animation sprites
 * - 'master': High-detail canvas (128x128 / 64x128) with procedural layer kinematics
 */
'use strict';

const fs = require('fs');
const path = require('path');
const VP = require('../visual_primitives.js');

// Load learned DNA matrices
let referenceDNA = null;
try {
  const dnaPath = path.join(__dirname, 'chibi_reference_dna.json');
  if (fs.existsSync(dnaPath)) {
    referenceDNA = JSON.parse(fs.readFileSync(dnaPath, 'utf8'));
  }
} catch (e) {
  console.warn('Reference DNA not yet loaded:', e.message);
}

// Quadratic Bezier interpolation helper
function getBezierPoint(p0, p1, p2, t) {
  const invT = 1 - t;
  const x = Math.round(invT * invT * p0.x + 2 * invT * t * p1.x + t * t * p2.x);
  const y = Math.round(invT * invT * p0.y + 2 * invT * t * p1.y + t * t * p2.y);
  return { x, y };
}

// Draw a smooth bezier curved stroke
function drawBezierCurve(c, p0, p1, p2, colorHex, thickness = 1, z = 0) {
  const steps = Math.max(16, Math.round(Math.hypot(p2.x - p0.x, p2.y - p0.y) * 1.5));
  for (let i = 0; i <= steps; i++) {
    const pt = getBezierPoint(p0, p1, p2, i / steps);
    c.fillRect(pt.x - Math.floor(thickness / 2), pt.y - Math.floor(thickness / 2), thickness, thickness, colorHex, 2, z);
  }
}

class ChibiOrganicGenerator {
  /**
   * Renders an authentic Chibi Anime character frame
   * @param {string} charType - 'farmer' | 'baker'
   * @param {string} act - 'idle' | 'walk' | 'action'
   * @param {number} frame - frame index
   * @param {string} mode - '64x64' | 'master'
   */
  static renderFrame(charType = 'farmer', act = 'idle', frame = 0, mode = '64x64') {
    const isMaster = mode === 'master';
    const charW = (isMaster && charType === 'farmer') ? 128 : 64;
    const charH = isMaster ? 128 : 64;
    const c = new VP.PixelCanvas(charW, charH);
    const OUTLINE = '#140c06';

    if (isMaster && referenceDNA && referenceDNA[charType]) {
      this.renderMasterFromDNA(c, charType, act, frame, OUTLINE);
    } else {
      this.render64Frame(c, charType, act, frame, OUTLINE);
    }

    this.reinforceOutline(c, OUTLINE);
    return c;
  }

  // =========================================================================
  // MASTER HIGH-DETAIL ANIMATION WITH LAYER KINEMATICS
  // =========================================================================

  static renderMasterFromDNA(c, charType, act, frame, OUTLINE) {
    const dna = referenceDNA[charType];
    const srcGrid = dna.pixels;
    const srcW = dna.width;
    const srcH = dna.height;
    const f = frame % 6;

    // Kinematic Animation Offsets
    let bobY = 0;
    let leftFootLift = 0;
    let rightFootLift = 0;

    if (act === 'idle') {
      // Gentle breathing bob (1px down on frame 1-2)
      bobY = (f === 1 || f === 2) ? 1 : 0;
    } else if (act === 'walk') {
      // Classical walk cycle: one foot planted firmly on ground (0 lift), other foot swinging (lift > 0)
      const stride = Math.sin(f * Math.PI / 3) * 3.5;
      if (stride > 0.5) {
        // Left foot swings forward & lifts, right foot planted
        leftFootLift = Math.round(stride);
        rightFootLift = 0;
        bobY = -1; // body pushes up
      } else if (stride < -0.5) {
        // Right foot swings forward & lifts, left foot planted
        leftFootLift = 0;
        rightFootLift = Math.round(-stride);
        bobY = -1;
      } else {
        // Both feet touching ground during passing pose
        leftFootLift = 0;
        rightFootLift = 0;
        bobY = 1; // hips dip
      }
    } else if (act === 'action') {
      // Concentrated work pose: deep rooted stance
      bobY = (f === 2 || f === 3) ? 1 : (f === 1 ? -1 : 0);
    }

    // Centering offset for 128 or 64 canvas
    const offsetX = Math.floor((c.width - srcW) / 2);
    const offsetY = Math.floor((c.height - srcH) / 2);
    const midX = charType === 'farmer' ? 46 : 32;

    // Render layers with seamless continuous skinning deformation
    for (let sy = 0; sy < srcH; sy++) {
      for (let sx = 0; sx < srcW; sx++) {
        const color = srcGrid[sy][sx];
        if (!color) continue;

        let dy = sy;
        const dx = sx;

        if (sy >= 118) {
          // Ground shadow stays firmly grounded
          dy = sy;
        } else if (sy >= 102) {
          // Boots/feet: planted foot stays grounded (dy = sy), lifted foot raises
          const isLeft = (sx < midX);
          const lift = isLeft ? leftFootLift : rightFootLift;
          dy = sy - lift;
        } else if (sy >= 84) {
          // Pant legs smoothly interpolate between hips (sy + bobY) and feet (sy - lift)
          const isLeft = (sx < midX);
          const lift = isLeft ? leftFootLift : rightFootLift;
          const t = (sy - 84) / 18; // 0 at hips, 1 at ankle
          const targetOffset = (1 - t) * bobY - t * lift;
          dy = sy + Math.round(targetOffset);
        } else {
          // Upper body: Hips, apron, torso, arms, head, hair, and hat move together
          dy = sy + bobY;
        }

        const targetX = dx + offsetX;
        const targetY = dy + offsetY;
        if (targetX >= 0 && targetX < c.width && targetY >= 0 && targetY < c.height) {
          c.setPixel(targetX, targetY, color, 2, 50);
        }
      }
    }

    // Dynamic Visual FX overlays for Action Animations
    if (act === 'action') {
      if (charType === 'farmer' && (f === 2 || f === 3)) {
        // Glowing Crescent Motion Arc trail
        const cx = 82 + offsetX, cy = 52 + offsetY + bobY;
        drawBezierCurve(c, { x: cx, y: cy - 14 }, { x: cx + 16, y: cy }, { x: cx - 2, y: cy + 18 }, '#ffffff', 2, 70);
        drawBezierCurve(c, { x: cx + 2, y: cy - 12 }, { x: cx + 18, y: cy + 2 }, { x: cx, y: cy + 20 }, '#facc15', 1, 71);
        // Bursting golden wheat grains
        c.fillRect(cx + 12, cy + 8, 2, 2, '#fef08a', 4, 75);
        c.fillRect(cx + 16, cy + 4, 2, 2, '#f59e0b', 4, 75);
        c.fillRect(cx + 8, cy + 16, 2, 2, '#fde047', 4, 75);
      } else if (charType === 'baker' && (f === 2 || f === 3)) {
        // Aromatic Steam Swirls rising from the hot artisan loaf
        const bx = 20 + offsetX, by = 58 + offsetY + bobY;
        drawBezierCurve(c, { x: bx - 4, y: by - 4 }, { x: bx - 10, y: by - 14 }, { x: bx - 3, y: by - 24 }, '#ffffff', 2, 70);
        drawBezierCurve(c, { x: bx + 8, y: by - 4 }, { x: bx + 14, y: by - 14 }, { x: bx + 7, y: by - 24 }, '#ffffff', 2, 70);
        // Golden crust glimmer
        c.fillRect(bx + 2, by - 8, 2, 2, '#fef08a', 4, 75);
      }
    }
  }

  // =========================================================================
  // 64x64 COMPACT GAME SPRITE GENERATION
  // =========================================================================

  static render64Frame(c, charType, act, frame, OUTLINE) {
    const f = frame % 6;
    let bobY = 0;
    let legStride = 0;

    if (act === 'idle') {
      bobY = (f === 1 || f === 2) ? -1 : 0;
    } else if (act === 'walk') {
      bobY = (f === 1 || f === 4) ? -1 : (f === 2 || f === 5 ? 0 : 1);
      legStride = Math.sin(f * Math.PI / 3) * 3;
    } else if (act === 'action') {
      bobY = (f === 2 || f === 3) ? 1 : (f === 1 ? -1 : 0);
    }

    if (charType === 'farmer') {
      this.renderFarmer64(c, bobY, legStride, OUTLINE, act, frame);
    } else if (charType === 'baker') {
      this.renderBaker64(c, bobY, legStride, OUTLINE, act, frame);
    }
  }

  /**
   * 🌾 FARMER (64x64):
   * Tilted curved straw hat with woven texture, curly brown hair bangs,
   * open collar shirt, leather half-apron with front pocket, sturdy boots,
   * and crescent sickle.
   */
  static renderFarmer64(c, bobY, stride, OUTLINE, act, frame) {
    const cx = 31;
    const groundY = 59;
    const f = frame % 6;

    // 1. Soft Oval Ground Shadow
    c.ellipse(cx, groundY + 1, 14, 3.5, 'rgba(40, 20, 15, 0.45)', 0, 0);

    // 2. Chunky Boots (Leather work boots with round toe & sole)
    const bootRamp = ['#281810', '#3c2820', '#584034', '#7c5440'];
    const leftFootY = groundY - Math.max(0, stride);
    const rightFootY = groundY - Math.max(0, -stride);

    // Left Boot (x=21..28)
    c.fillRect(21, leftFootY - 4, 7, 5, bootRamp[1], 4, 10);
    c.fillRect(20, leftFootY - 2, 9, 3, bootRamp[0], 4, 11);
    c.fillRect(21, leftFootY - 4, 6, 1, bootRamp[2], 4, 12);
    // Right Boot (x=33..40)
    c.fillRect(33, rightFootY - 4, 7, 5, bootRamp[1], 4, 10);
    c.fillRect(32, rightFootY - 2, 9, 3, bootRamp[0], 4, 11);
    c.fillRect(33, rightFootY - 4, 6, 1, bootRamp[2], 4, 12);

    // 3. Work Trousers with Rolled Cuffs
    const pantsRamp = ['#382418', '#4c3222', '#64442f', '#7e563d'];
    c.fillRect(22, 45, 6, leftFootY - 48, pantsRamp[1], 3, 20);
    c.fillRect(21, leftFootY - 5, 8, 2, pantsRamp[2], 3, 21); // rolled cuff
    c.fillRect(34, 45, 6, rightFootY - 48, pantsRamp[1], 3, 20);
    c.fillRect(33, rightFootY - 5, 8, 2, pantsRamp[2], 3, 21);

    // 4. Leather Half-Apron with Front Pocket & Stitching
    const apronRamp = ['#452814', '#60391d', '#7c4c20', '#99602a'];
    for (let y = 37 + bobY; y <= 47 + bobY; y++) {
      const curW = y < 44 + bobY ? 14 : 12;
      c.fillRect(cx - Math.floor(curW / 2), y, curW, 1, apronRamp[1], 3, 30);
    }
    // Front patch pocket with stitch detail
    c.fillRect(cx - 3, 40 + bobY, 7, 5, apronRamp[0], 3, 32);
    c.fillRect(cx - 3, 40 + bobY, 7, 1, apronRamp[2], 3, 33);
    // Belt & Brass Buckle
    c.fillRect(cx - 7, 35 + bobY, 15, 2, '#201006', 4, 34);
    c.setPixel(cx, 35 + bobY, '#f59e0b', 4, 35);

    // 5. Caramel Tan Work Shirt with Center Buttons & Open Collar
    const shirtRamp = ['#6e3e18', '#8e5220', '#b06828', '#c87834', '#e2944c'];
    for (let y = 25 + bobY; y <= 35 + bobY; y++) {
      c.fillRect(cx - 7, y, 15, 1, shirtRamp[2], 3, 31);
    }
    // Left chest pocket
    c.fillRect(cx - 5, 28 + bobY, 4, 3, shirtRamp[1], 3, 33);
    c.fillRect(cx - 5, 28 + bobY, 4, 1, shirtRamp[3], 3, 34);
    // Center brass buttons
    [28, 31, 34].forEach(by => {
      c.setPixel(cx, by + bobY, '#f59e0b', 3, 35);
    });
    // Open V-neck showing skin
    c.fillRect(cx - 1, 24 + bobY, 3, 3, '#fcc48c', 2, 33);
    c.setPixel(cx, 26 + bobY, '#e09a60', 2, 34); // collarbone hint
    // Collar flaps
    c.fillRect(cx - 4, 24 + bobY, 3, 2, shirtRamp[3], 3, 36);
    c.fillRect(cx + 2, 24 + bobY, 3, 2, shirtRamp[3], 3, 36);

    // 6. Arms & Hands
    // Left Arm (hanging at side)
    c.fillRect(19, 26 + bobY, 4, 8, shirtRamp[2], 3, 40);
    c.fillRect(18, 33 + bobY, 5, 2, shirtRamp[3], 3, 41); // rolled cuff
    c.fillRect(20, 35 + bobY, 3, 6, '#fcc48c', 2, 42); // forearm
    c.fillRect(19, 41 + bobY, 5, 4, '#fcc48c', 2, 43); // cute hand

    // Right Arm & Sickle (Animated in action!)
    if (act === 'action') {
      this.renderFarmerActionSickle(c, cx, bobY, f, shirtRamp);
    } else {
      // Normal holding pose
      c.fillRect(39, 26 + bobY, 4, 8, shirtRamp[2], 3, 40);
      c.fillRect(38, 33 + bobY, 5, 2, shirtRamp[3], 3, 41);
      c.fillRect(41, 30 + bobY, 5, 5, '#fcc48c', 2, 44); // hand gripping handle

      // Curved Harvesting Sickle
      const handleY = 29 + bobY;
      c.fillRect(43, handleY - 2, 3, 11, '#4e250e', 4, 50); // handle
      c.fillRect(43, handleY - 2, 3, 2, '#281206', 4, 51);
      // Crescent blade
      const p0 = { x: 45, y: handleY - 3 };
      const p1 = { x: 50, y: handleY - 14 };
      const p2 = { x: 55, y: handleY - 1 };
      drawBezierCurve(c, p0, p1, p2, '#94a0b0', 3, 55); // steel blade
      drawBezierCurve(c, p0, p1, p2, '#ffffff', 1, 56); // edge bevel
      c.setPixel(p2.x, p2.y, '#334155', 4, 57); // sharp hook tip
    }

    // 7. Expressive Anime Face
    const headTopY = 12 + bobY;
    const skinBase = '#fcc48c';
    const skinShadow = '#e09a60';
    const blushColor = '#e07050';

    // Rounded face silhouette
    for (let y = headTopY; y <= headTopY + 14; y++) {
      const dy = y - headTopY;
      const hw = dy < 4 ? 7 : (dy < 11 ? 9 : 7 - (dy - 11));
      for (let x = cx - hw; x <= cx + hw; x++) {
        c.setPixel(x, y, skinBase, 2, 60);
      }
    }
    // Jaw shadow
    c.fillRect(cx - 5, headTopY + 13, 11, 2, skinShadow, 2, 61);

    // Cute Left Ear
    c.fillRect(cx - 10, headTopY + 7, 2, 3, skinBase, 2, 62);
    c.setPixel(cx - 9, headTopY + 8, skinShadow, 2, 63);

    // Big Warm Anime Eyes (2x3 with top-left catchlight)
    // Left eye (26..27, 20..22)
    c.fillRect(26, headTopY + 7, 2, 3, '#1a0f08', 1, 65);
    c.setPixel(26, headTopY + 7, '#ffffff', 1, 66); // catchlight
    c.setPixel(27, headTopY + 9, '#78350f', 1, 66); // warm iris
    c.fillRect(25, headTopY + 5, 4, 1, '#3b1d0c', 1, 67); // arched brow

    // Right eye (34..35, 20..22)
    c.fillRect(34, headTopY + 7, 2, 3, '#1a0f08', 1, 65);
    c.setPixel(34, headTopY + 7, '#ffffff', 1, 66);
    c.setPixel(35, headTopY + 9, '#78350f', 1, 66);
    c.fillRect(33, headTopY + 5, 4, 1, '#3b1d0c', 1, 67);

    // Rosy Peach Blush Cheeks!
    c.fillRect(23, headTopY + 9, 3, 1, blushColor, 2, 64);
    c.fillRect(36, headTopY + 9, 3, 1, blushColor, 2, 64);

    // Cute Nose Dot & Smile
    c.setPixel(cx, headTopY + 9, '#d97706', 1, 64); // nose
    c.setPixel(cx - 1, headTopY + 11, '#2c1404', 1, 64);
    c.fillRect(cx, headTopY + 12, 3, 1, '#2c1404', 1, 64);
    c.setPixel(cx + 3, headTopY + 11, '#2c1404', 1, 64);

    // 8. Curly Brown Hair (Fluffy clumps framing forehead, not blocking eyes!)
    const hairDark = '#3b1d0c';
    const hairMid = '#64381b';
    const hairLight = '#8c522a';
    c.fillRect(23, headTopY + 3, 16, 2, hairMid, 2, 70);
    // Tufted bangs
    c.fillRect(24, headTopY + 4, 4, 2, hairLight, 2, 71);
    c.fillRect(29, headTopY + 4, 4, 2, hairMid, 2, 71);
    c.fillRect(34, headTopY + 4, 4, 2, hairLight, 2, 71);

    // 9. Tilted Curved Straw Hat (Woven concentric bands & Bezier curvature)
    const strawDark = '#a47428';
    const strawMid = '#bc882c';
    const strawLight = '#e8bc44';
    const brimY = headTopY + 2;

    // Crown Dome (tilted slightly, y=2..9)
    for (let y = 2 + bobY; y <= 9 + bobY; y++) {
      const cw = Math.round(5 + (y - (2 + bobY)) * 0.9);
      for (let x = cx - cw; x <= cx + cw; x++) {
        const tone = (x + y) % 3 === 0 ? strawLight : ((x - cx) > 1 ? strawDark : strawMid);
        c.setPixel(x, y, tone, 2, 80);
      }
    }

    // Wide Tilted Brim (Sweeping Bezier arc from left x=14 to right x=48)
    const brimP0 = { x: cx - 18, y: brimY + 4 };
    const brimP1 = { x: cx, y: brimY - 2 };
    const brimP2 = { x: cx + 18, y: brimY + 1 };
    for (let dy = -2; dy <= 4; dy++) {
      drawBezierCurve(c, { x: brimP0.x, y: brimP0.y + dy }, { x: brimP1.x, y: brimP1.y + dy }, { x: brimP2.x, y: brimP2.y + dy },
        dy <= 0 ? strawLight : (dy === 1 ? strawMid : strawDark), 2, 82);
    }
    // Under-brim cast shadow onto hair
    c.fillRect(cx - 8, brimY + 2, 16, 1, '#60391d', 2, 83);
  }

  /**
   * Farmer Sickle Slash Action Sequence
   */
  static renderFarmerActionSickle(c, cx, bobY, f, shirtRamp) {
    if (f < 2) {
      c.fillRect(40, 24 + bobY, 4, 8, shirtRamp[2], 3, 40);
      c.fillRect(42, 22 + bobY, 5, 5, '#fcc48c', 2, 44);
      c.fillRect(44, 18 + bobY, 3, 10, '#4e250e', 4, 50);
      drawBezierCurve(c, { x: 45, y: 18 + bobY }, { x: 48, y: 8 + bobY }, { x: 54, y: 16 + bobY }, '#e2e8f0', 3, 55);
    } else if (f < 4) {
      c.fillRect(36, 28 + bobY, 8, 4, shirtRamp[2], 3, 40);
      c.fillRect(43, 30 + bobY, 5, 5, '#fcc48c', 2, 44);
      c.fillRect(44, 32 + bobY, 3, 10, '#4e250e', 4, 50);
      drawBezierCurve(c, { x: 52, y: 16 + bobY }, { x: 56, y: 32 + bobY }, { x: 42, y: 44 + bobY }, '#ffffff', 2, 58);
      drawBezierCurve(c, { x: 45, y: 32 + bobY }, { x: 52, y: 38 + bobY }, { x: 46, y: 48 + bobY }, '#94a0b0', 3, 55);
      c.setPixel(54, 38 + bobY, '#facc15', 4, 60);
      c.setPixel(56, 35 + bobY, '#f59e0b', 4, 60);
      c.setPixel(52, 46 + bobY, '#facc15', 4, 60);
    } else {
      c.fillRect(39, 27 + bobY, 4, 8, shirtRamp[2], 3, 40);
      c.fillRect(41, 31 + bobY, 5, 5, '#fcc48c', 2, 44);
      c.fillRect(43, 30 + bobY, 3, 11, '#4e250e', 4, 50);
      drawBezierCurve(c, { x: 45, y: 28 + bobY }, { x: 50, y: 18 + bobY }, { x: 55, y: 29 + bobY }, '#94a0b0', 3, 55);
    }
  }

  /**
   * 🥖 BAKER (64x64):
   * Billowing chef toque, brunette hair buns with stray strands,
   * sweet anime face with rosy pink blush, pinafore apron, and
   * diagonal scored golden artisan bread loaf.
   */
  static renderBaker64(c, bobY, stride, OUTLINE, act, frame) {
    const cx = 31;
    const groundY = 59;
    const f = frame % 6;

    // 1. Ground Shadow
    c.ellipse(cx, groundY + 1, 13, 3.5, 'rgba(40, 20, 15, 0.45)', 0, 0);

    // 2. Chunky Leather Boots
    const bootRamp = ['#201418', '#382018', '#683018', '#884424'];
    const leftFootY = groundY - Math.max(0, stride);
    const rightFootY = groundY - Math.max(0, -stride);
    c.fillRect(22, leftFootY - 4, 7, 5, bootRamp[1], 4, 10);
    c.fillRect(21, leftFootY - 2, 9, 3, bootRamp[0], 4, 11);
    c.fillRect(33, rightFootY - 4, 7, 5, bootRamp[1], 4, 10);
    c.fillRect(32, rightFootY - 2, 9, 3, bootRamp[0], 4, 11);

    // 3. White Baker Trousers with Rolled Cuffs
    const whiteRamp = ['#cbd5e1', '#e2e8f0', '#f1f5f9', '#ffffff'];
    c.fillRect(23, 44, 6, leftFootY - 48, whiteRamp[2], 3, 20);
    c.fillRect(22, leftFootY - 5, 8, 2, whiteRamp[3], 3, 21);
    c.fillRect(33, 44, 6, rightFootY - 48, whiteRamp[2], 3, 20);
    c.fillRect(32, rightFootY - 5, 8, 2, whiteRamp[3], 3, 21);

    // 4. Cream Blouse with Puffed Sleeves
    const creamRamp = ['#d4c4a8', '#e8dac8', '#fceccc', '#fff8ec'];
    for (let y = 25 + bobY; y <= 45 + bobY; y++) {
      const w = y < 35 + bobY ? 13 : 15;
      c.fillRect(cx - Math.floor(w / 2), y, w, 1, creamRamp[2], 3, 30);
    }
    // Puffed shoulder sleeves
    c.fillRect(cx - 9, 26 + bobY, 4, 5, creamRamp[3], 3, 32);
    c.fillRect(cx + 6, 26 + bobY, 4, 5, creamRamp[3], 3, 32);

    // 5. White Pinafore Apron with Curved Pouch Pockets & Waist Ties
    for (let y = 27 + bobY; y <= 44 + bobY; y++) {
      const aw = y < 36 + bobY ? 11 : 13;
      c.fillRect(cx - Math.floor(aw / 2), y, aw, 1, whiteRamp[2], 3, 31);
    }
    // Curved side pouch pockets
    c.fillRect(cx - 5, 37 + bobY, 4, 4, whiteRamp[1], 3, 33);
    c.fillRect(cx + 2, 37 + bobY, 4, 4, whiteRamp[1], 3, 33);
    // Apron side ties
    c.setPixel(cx - 7, 36 + bobY, whiteRamp[0], 3, 34);
    c.setPixel(cx + 7, 36 + bobY, whiteRamp[0], 3, 34);

    // 6. Arms & Artisan Bread Loaf
    if (act === 'action') {
      this.renderBakerActionBread(c, cx, bobY, f, creamRamp, whiteRamp);
    } else {
      const breadRamp = ['#682c08', '#944414', '#d06818', '#f49438', '#fce0a0'];
      const breadCenter = { x: 21, y: 34 + bobY };

      for (let dy = -3; dy <= 4; dy++) {
        const span = dy === -3 || dy === 4 ? 4 : 6;
        for (let dx = -span; dx <= span; dx++) {
          const px = breadCenter.x + dx;
          const py = breadCenter.y + dy;
          let col = breadRamp[2];
          if (dy < 0) col = breadRamp[3];
          if (dy > 2) col = breadRamp[1];
          if ((dx + dy * 2) % 4 === 0 && dy > -3 && dy < 3) col = breadRamp[4];
          c.setPixel(px, py, col, 4, 50);
        }
      }
      c.fillRect(17, 37 + bobY, 6, 3, '#fccca4', 2, 52);

      c.fillRect(40, 31 + bobY, 3, 8, '#fccca4', 2, 42);
      c.fillRect(39, 39 + bobY, 4, 4, '#fccca4', 2, 43);
    }

    // 7. Charming Anime Face with Rosy Pink Blush
    const headTopY = 12 + bobY;
    const skinBase = '#fccca4';
    const skinShadow = '#e0a87c';
    const pinkBlush = '#f472b6';

    for (let y = headTopY; y <= headTopY + 14; y++) {
      const dy = y - headTopY;
      const hw = dy < 4 ? 7 : (dy < 11 ? 9 : 7 - (dy - 11));
      for (let x = cx - hw; x <= cx + hw; x++) {
        c.setPixel(x, y, skinBase, 2, 60);
      }
    }
    c.fillRect(cx - 5, headTopY + 13, 11, 2, skinShadow, 2, 61);

    // Warm Amber Anime Eyes (2x3 with catchlight)
    [-4, 4].forEach(ex => {
      c.fillRect(cx + ex, headTopY + 7, 2, 3, '#1a0c06', 1, 65);
      c.setPixel(cx + ex, headTopY + 7, '#ffffff', 1, 66); // catchlight
      c.setPixel(cx + ex + 1, headTopY + 9, '#d97706', 1, 66); // amber iris
      c.fillRect(cx + ex - 1, headTopY + 5, 4, 1, '#3a180c', 1, 67); // delicate brow
    });

    // Rosy Pink Blush Patches (#f472b6)
    c.fillRect(23, headTopY + 9, 3, 1, pinkBlush, 2, 64);
    c.fillRect(36, headTopY + 9, 3, 1, pinkBlush, 2, 64);

    // Gentle Smile & Nose Dot
    c.setPixel(cx, headTopY + 9, '#d97706', 1, 64);
    c.fillRect(cx - 1, headTopY + 12, 3, 1, '#2c1404', 1, 64);

    // 8. Brunette Hair with Buns & Framing Bangs
    const hairDark = '#2c1404';
    const hairMid = '#5a2e0e';
    const hairLight = '#7c431a';
    c.fillRect(21, headTopY + 3, 3, 8, hairMid, 2, 70);
    c.fillRect(38, headTopY + 3, 3, 8, hairMid, 2, 70);
    c.fillRect(24, headTopY + 3, 5, 2, hairLight, 2, 71);
    c.fillRect(33, headTopY + 3, 5, 2, hairLight, 2, 71);

    c.ellipse(19, headTopY + 3, 4, 4, hairMid, 2, 69);
    c.setPixel(16, headTopY + 2, hairDark, 2, 69);
    c.setPixel(17, headTopY + 5, hairDark, 2, 69);

    c.ellipse(43, headTopY + 3, 4, 4, hairMid, 2, 69);
    c.setPixel(46, headTopY + 2, hairDark, 2, 69);
    c.setPixel(45, headTopY + 5, hairDark, 2, 69);

    // 9. Billowing Puffy Chef Toque (Hat)
    const hatBaseY = headTopY - 2;
    c.fillRect(cx - 8, hatBaseY, 17, 3, whiteRamp[1], 2, 80);
    c.fillRect(cx - 8, hatBaseY, 17, 1, whiteRamp[3], 2, 81);
    c.ellipse(cx - 6, hatBaseY - 5, 7, 4.5, whiteRamp[2], 2, 82);
    c.ellipse(cx + 6, hatBaseY - 5, 7, 4.5, whiteRamp[2], 2, 82);
    c.ellipse(cx, hatBaseY - 7, 8, 5.5, whiteRamp[3], 2, 83);
  }

  /**
   * Baker Action Animation: Raising the artisan bread proudly with aromatic steam swirls!
   */
  static renderBakerActionBread(c, cx, bobY, f, creamRamp, whiteRamp) {
    const breadRamp = ['#682c08', '#944414', '#d06818', '#f49438', '#fce0a0'];
    const liftY = (f === 2 || f === 3) ? -5 : (f === 1 || f === 4 ? -2 : 0);

    c.fillRect(22, 32 + bobY + liftY, 4, 7, '#fccca4', 2, 42);
    c.fillRect(38, 32 + bobY + liftY, 4, 7, '#fccca4', 2, 42);

    const bx = cx;
    const by = 30 + bobY + liftY;
    for (let dy = -3; dy <= 4; dy++) {
      const span = dy === -3 || dy === 4 ? 5 : 8;
      for (let dx = -span; dx <= span; dx++) {
        let col = breadRamp[2];
        if (dy < 0) col = breadRamp[3];
        if (dy > 2) col = breadRamp[1];
        if ((dx + dy * 2) % 4 === 0) col = breadRamp[4];
        c.setPixel(bx + dx, by + dy, col, 4, 50);
      }
    }

    if (f === 2 || f === 3) {
      drawBezierCurve(c, { x: bx - 6, y: by - 5 }, { x: bx - 10, y: by - 12 }, { x: bx - 4, y: by - 18 }, '#ffffff', 1, 60);
      drawBezierCurve(c, { x: bx + 6, y: by - 5 }, { x: bx + 10, y: by - 12 }, { x: bx + 4, y: by - 18 }, '#ffffff', 1, 60);
      c.setPixel(bx, by - 10, '#fef08a', 4, 61);
    }
  }

  /**
   * Reinforce 1-pixel crisp outer black outline for maximum pop
   */
  static reinforceOutline(c, outlineHex) {
    const w = c.width, h = c.height;
    const isSolid = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      if (c.data[i * 4 + 3] > 20) isSolid[i] = 1;
    }

    const { r, g, b } = VP.parseHex(outlineHex);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        if (isSolid[idx] === 1) continue;

        if (isSolid[idx - 1] === 1 || isSolid[idx + 1] === 1 ||
            isSolid[idx - w] === 1 || isSolid[idx + w] === 1) {
          const pIdx = idx * 4;
          c.data[pIdx] = r;
          c.data[pIdx + 1] = g;
          c.data[pIdx + 2] = b;
          c.data[pIdx + 3] = 255;
        }
      }
    }
  }
}

module.exports = { ChibiOrganicGenerator };
