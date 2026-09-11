/**
 * Natura Face Painter (Phase 16)
 * 
 * Rebuilds facial identity with layered anatomical construction:
 * 1. Head silhouette & jaw geometry (oval, round, broad, angular, weathered)
 * 2. Facial plane lighting (recessed sockets, prominent cheekbones, chin shelf)
 * 3. Expressive eyes with specular catchlights and pupil/iris definition
 * 4. Distinct eyebrows reflecting emotion and archetype
 * 5. Sculpted nose bridge and nostril detail
 * 6. Articulated lips and natural blush patches
 */
'use strict';

let VP;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
}

class FacePainter {
  /**
   * Paints a full layered face
   */
  static paintFace(c, midX, headCenterY, dna, dir = 0, blink = false, talk = false, zBase = 60) {
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

    const faceShape = dna.face.shape || 'oval';
    const isElder = dna.ageYears > 58;
    const isChild = dna.ageYears < 7;

    // 1. Head Cranium & Jaw Silhouette
    this.paintHeadBase(c, midX, headCenterY, faceShape, skinRamp, zBase);

    // If viewing from the back (dir === 1), face features are hidden
    if (dir === 1) return;

    const eyeY = headCenterY - 1;
    const noseY = headCenterY + 3;
    const mouthY = headCenterY + 6;

    if (dir === 0) {
      // -------------------------------------------------------------
      // FRONT VIEW (dir === 0)
      // -------------------------------------------------------------
      
      // 2. Orbital Sockets (soft shadow where eyes sit)
      c.fillRect(midX - 7, eyeY - 1, 4, 1, skinRamp[1], 1, zBase + 1);
      c.fillRect(midX + 3, eyeY - 1, 4, 1, skinRamp[1], 1, zBase + 1);

      // 3. Eyes & Catchlights
      if (blink) {
        // Closed / Blinking eye: curved eyelid slit
        c.fillRect(midX - 7, eyeY + 1, 4, 1, '#1b120c', 2, zBase + 2);
        c.fillRect(midX + 3, eyeY + 1, 4, 1, '#1b120c', 2, zBase + 2);
      } else {
        // Expressive Eye: 3x4 to 4x4 matrix
        this.paintEye(c, midX - 7, eyeY, true, skinRamp, isElder, zBase + 2);
        this.paintEye(c, midX + 3, eyeY, false, skinRamp, isElder, zBase + 2);
      }

      // 4. Eyebrows
      const browY = eyeY - 2;
      const browThick = dna.anatomy.archetype === 'broad_heavy' ? 2 : 1;
      c.fillRect(midX - 8, browY, 5, browThick, hairRamp[0], 2, zBase + 3);
      c.fillRect(midX + 3, browY, 5, browThick, hairRamp[0], 2, zBase + 3);

      // 5. Nose
      // Bridge shadow + subtle specular tip
      c.fillRect(midX - 1, noseY - 2, 1, 3, skinRamp[2], 2, zBase + 2);
      c.setPixel(midX, noseY, skinRamp[4], 3, zBase + 3); // tip highlight
      c.setPixel(midX - 1, noseY + 1, skinRamp[1], 1, zBase + 3); // nostril shadow

      // 6. Blush Cheeks
      const blushCol = dna.face.skinRampKey === 'deep' ? 'rgba(180, 50, 40, 0.45)' : '#f28f8f';
      c.fillRect(midX - 9, eyeY + 3, 3, 1, blushCol, 2, zBase + 1);
      c.fillRect(midX + 6, eyeY + 3, 3, 1, blushCol, 2, zBase + 1);

      // 7. Mouth & Lips
      if (dna.face.facialHair === 'full_beard' || dna.face.facialHair === 'mustache') {
        this.paintBeard(c, midX, mouthY, hairRamp, dna.face.facialHair, zBase + 4);
      } else {
        if (talk) {
          // Open talking mouth
          c.fillRect(midX - 2, mouthY, 4, 2, '#4a1515', 2, zBase + 3);
          c.setPixel(midX - 1, mouthY, '#ffffff', 3, zBase + 4); // upper teeth
        } else {
          // Soft smile / natural lips
          c.fillRect(midX - 2, mouthY, 4, 1, '#8a4030', 2, zBase + 3);
          c.setPixel(midX - 1, mouthY - 1, skinRamp[4], 3, zBase + 3); // philtrum highlight
        }
      }

    } else if (dir === 2 || dir === 3) {
      // -------------------------------------------------------------
      // PROFILE VIEW (dir === 2 Left, dir === 3 Right)
      // -------------------------------------------------------------
      const facingLeft = dir === 2;
      const eyeX = facingLeft ? midX - 6 : midX + 3;
      const noseX = facingLeft ? midX - 8 : midX + 7;
      const mouthX = facingLeft ? midX - 6 : midX + 4;

      // Profile Eye
      if (blink) {
        c.fillRect(eyeX, eyeY + 1, 3, 1, '#1b120c', 2, zBase + 2);
      } else {
        c.fillRect(eyeX, eyeY, 3, 3, '#1b120c', 2, zBase + 2);
        c.setPixel(facingLeft ? eyeX : eyeX + 2, eyeY, '#ffffff', 4, zBase + 3); // catchlight
      }

      // Profile Nose protrusion
      c.fillRect(noseX, noseY - 1, 2, 2, skinRamp[3], 2, zBase + 2);

      // Profile Mouth
      c.fillRect(mouthX, mouthY, 2, 1, '#8a4030', 2, zBase + 3);

      // Profile Cheek blush
      c.fillRect(eyeX + (facingLeft ? 2 : -2), eyeY + 3, 2, 1, '#f28f8f', 2, zBase + 1);
    }
  }

  /**
   * Paints the base cranial skull and jawline with 3D facial planes
   */
  static paintHeadBase(c, midX, centerY, shape, skinRamp, z) {
    const rX = shape === 'round' ? 9 : (shape === 'broad' ? 10 : 8);
    const rY = shape === 'long' ? 11 : 9;

    // Skull volume with upper-left light bias
    for (let y = -rY; y <= rY; y++) {
      const progY = y / rY;
      const widthAtY = Math.round(rX * Math.sqrt(Math.max(0, 1 - progY * progY * 0.85)));
      
      // Jawline taper for chin
      let w = widthAtY;
      if (y > rY * 0.4) {
        const chinTaper = (y - rY * 0.4) / (rY * 0.6);
        w = Math.max(3, Math.round(widthAtY * (1 - chinTaper * 0.45)));
      }

      const xStart = midX - w;
      const totalW = w * 2;

      // Fill plane
      c.fillRect(xStart, centerY + y, totalW, 1, skinRamp[2], 2, z);
      // Upper-left highlight on forehead/cheek
      if (y < 2 && totalW > 4) {
        c.fillRect(xStart + 1, centerY + y, Math.floor(totalW * 0.4), 1, skinRamp[3], 3, z + 1);
      }
    }
  }

  /**
   * High-fidelity eye with iris, dark lash line, and bright catchlight
   */
  static paintEye(c, x, y, isLeft, skinRamp, isElder, z) {
    // Upper dark lash line
    c.fillRect(x, y - 1, 4, 1, '#180e08', 2, z);

    // Eye white (sclera)
    c.fillRect(x, y, 4, 3, '#f1f5f9', 2, z);

    // Dark Pupil & Iris
    const irisOffset = isLeft ? 1 : 0;
    c.fillRect(x + irisOffset, y, 3, 3, '#1e1b18', 2, z + 1);

    // White Specular Catchlight (Upper Left)
    c.setPixel(x + irisOffset, y, '#ffffff', 4, z + 2);

    // Lower subtle eyelid definition
    c.fillRect(x, y + 3, 4, 1, skinRamp[1], 1, z);
  }

  /**
   * Volumetric beard or mustache
   */
  static paintBeard(c, midX, mouthY, hairRamp, style, z) {
    if (style === 'mustache') {
      c.fillRect(midX - 4, mouthY - 1, 8, 2, hairRamp[1], 2, z);
      c.setPixel(midX - 2, mouthY - 1, hairRamp[2], 3, z + 1);
      c.setPixel(midX + 1, mouthY - 1, hairRamp[2], 3, z + 1);
    } else {
      // Full Beard
      c.fillRect(midX - 5, mouthY - 1, 10, 3, hairRamp[1], 2, z);
      c.fillRect(midX - 4, mouthY + 2, 8, 4, hairRamp[0], 2, z);
      c.fillRect(midX - 2, mouthY + 6, 4, 2, hairRamp[0], 1, z);
      // Mustache highlight over beard
      c.fillRect(midX - 3, mouthY - 1, 6, 1, hairRamp[2], 3, z + 1);
    }
  }
}

if (typeof window !== 'undefined') {
  window.FacePainter = FacePainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FacePainter };
}
