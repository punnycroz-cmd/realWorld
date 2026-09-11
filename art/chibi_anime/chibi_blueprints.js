/**
 * Chibi Anime 64x64 Micro-Matrix Blueprints (Direction A Engine)
 * 
 * Hand-sculpted pixel blueprints capturing the exact artistic DNA of the user's reference images:
 * - 1:3.5 Chibi proportions in 64x64 grid
 * - Sculpted face with 3x4 anime eyes (catchlight, warm iris), peach/pink blush, and open smile
 * - Organic Bezier-sculpted tilted straw hat, billowing chef toque, crescent sickle, and scored bread batard
 * - Discrete color indices (0: transparent, 1-5: ramp tones, 9: outline, 8: highlight, 7: special)
 */
'use strict';

/**
 * Helper to parse multi-line ASCII/symbol pixel maps into compact 2D coordinate arrays
 */
function parseMap(asciiLines, charToTag) {
  const pixels = [];
  asciiLines.forEach((line, y) => {
    for (let x = 0; x < line.length; x++) {
      const ch = line[x];
      if (ch === ' ' || ch === '.') continue;
      const tag = charToTag[ch];
      if (tag !== undefined) {
        pixels.push({ x, y, tag });
      }
    }
  });
  return pixels;
}

// =========================================================================
// 1. BASE BODY & SKELETON (64x64) - 1:3.5 Chibi Anime Proportions
// =========================================================================

// Head center: x=31, y=20 (radius ~10)
// Torso center: x=31, y=34 (width 16, height 12)
// Hips & Legs: y=42..58 (hips width 14, boots ground at y=58)
// Ground Shadow: y=59..62

const SKELETON_FRAMES = {
  // Idle: 4 frames, subtle breathing bob (0, 1, 1, 0)
  idle: [
    { bobY: 0, lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 38 },
    { bobY: 1, lFootY: 58, rFootY: 58, lHandY: 39, rHandY: 39 },
    { bobY: 1, lFootY: 58, rFootY: 58, lHandY: 39, rHandY: 39 },
    { bobY: 0, lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 38 }
  ],
  // Walk: 6 frames, alternating stride with knee flexion & body bob
  walk: [
    { bobY: 1,  lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 38, stride: 0 },
    { bobY: -1, lFootY: 55, rFootY: 58, lHandY: 36, rHandY: 40, stride: 2 },
    { bobY: 0,  lFootY: 56, rFootY: 58, lHandY: 37, rHandY: 39, stride: 1 },
    { bobY: 1,  lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 38, stride: 0 },
    { bobY: -1, lFootY: 58, rFootY: 55, lHandY: 40, rHandY: 36, stride: -2 },
    { bobY: 0,  lFootY: 58, rFootY: 56, lHandY: 39, rHandY: 37, stride: -1 }
  ],
  // Action: 6 frames
  action: [
    { bobY: 0,  lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 34, pose: 'windup1' },
    { bobY: -1, lFootY: 58, rFootY: 58, lHandY: 36, rHandY: 30, pose: 'windup2' },
    { bobY: 2,  lFootY: 58, rFootY: 58, lHandY: 40, rHandY: 42, pose: 'strike' },
    { bobY: 2,  lFootY: 58, rFootY: 58, lHandY: 40, rHandY: 42, pose: 'impact' },
    { bobY: 1,  lFootY: 58, rFootY: 58, lHandY: 39, rHandY: 39, pose: 'follow' },
    { bobY: 0,  lFootY: 58, rFootY: 58, lHandY: 38, rHandY: 38, pose: 'recover' }
  ]
};

// =========================================================================
// 2. BLUEPRINTS: FACE & HEAD (Sculpted Anime 3/4 Perspective)
// =========================================================================

// Face skin mask & shadow (rel to head center cx=31, cy=20)
// Width: 20px (x=21..41), Height: 16px (y=13..28)
const BLUEPRINT_FACE = {
  // Rounded cheeks, tapered chin, jawline shadow
  skinPixels: [
    // y=13..15 (forehead)
    { x: 25, y: 13, t: 3 }, { x: 26, y: 13, t: 3 }, { x: 27, y: 13, t: 3 }, { x: 28, y: 13, t: 3 }, { x: 29, y: 13, t: 3 }, { x: 30, y: 13, t: 3 }, { x: 31, y: 13, t: 3 }, { x: 32, y: 13, t: 3 }, { x: 33, y: 13, t: 3 }, { x: 34, y: 13, t: 3 }, { x: 35, y: 13, t: 3 }, { x: 36, y: 13, t: 3 },
    // y=14..18 (temples to cheeks)
    { x: 23, y: 14, t: 3 }, { x: 24, y: 14, t: 3 }, { x: 37, y: 14, t: 3 }, { x: 38, y: 14, t: 3 },
    { x: 22, y: 15, t: 3 }, { x: 39, y: 15, t: 3 },
    { x: 21, y: 16, t: 3 }, { x: 40, y: 16, t: 3 },
    { x: 21, y: 17, t: 3 }, { x: 40, y: 17, t: 3 },
    { x: 21, y: 18, t: 3 }, { x: 40, y: 18, t: 3 },
    { x: 21, y: 19, t: 3 }, { x: 40, y: 19, t: 3 },
    { x: 21, y: 20, t: 3 }, { x: 40, y: 20, t: 3 },
    { x: 22, y: 21, t: 3 }, { x: 39, y: 21, t: 3 },
    { x: 22, y: 22, t: 3 }, { x: 39, y: 22, t: 3 },
    // Chin taper (y=23..26)
    { x: 23, y: 23, t: 3 }, { x: 38, y: 23, t: 3 },
    { x: 24, y: 24, t: 3 }, { x: 37, y: 24, t: 3 },
    { x: 25, y: 25, t: 3 }, { x: 36, y: 25, t: 3 },
    { x: 27, y: 26, t: 2 }, { x: 28, y: 26, t: 2 }, { x: 29, y: 26, t: 2 }, { x: 30, y: 26, t: 2 }, { x: 31, y: 26, t: 2 }, { x: 32, y: 26, t: 2 }, { x: 33, y: 26, t: 2 }, { x: 34, y: 26, t: 2 }
  ],
  // Left Ear at x=19..21, y=19..22
  ear: [
    { x: 20, y: 19, t: 3 }, { x: 21, y: 19, t: 3 },
    { x: 19, y: 20, t: 3 }, { x: 20, y: 20, t: 2 }, { x: 21, y: 20, t: 3 },
    { x: 19, y: 21, t: 3 }, { x: 20, y: 21, t: 1 }, { x: 21, y: 21, t: 3 },
    { x: 20, y: 22, t: 2 }
  ],
  // Expressive Anime Eyes (3x4 capsule, catchlight, amber iris, upper brow)
  eyes: {
    // Left Eye (character's right): x=26..28, y=18..21
    left: [
      // Brow at y=16
      { x: 25, y: 16, t: 'brow' }, { x: 26, y: 16, t: 'brow' }, { x: 27, y: 16, t: 'brow' }, { x: 28, y: 16, t: 'brow' },
      // Upper dark eyelid at y=17
      { x: 26, y: 17, t: 'pupil' }, { x: 27, y: 17, t: 'pupil' }, { x: 28, y: 17, t: 'pupil' },
      // Pupil core with catchlight at y=18..20
      { x: 26, y: 18, t: 'white' }, { x: 27, y: 18, t: 'pupil' }, { x: 28, y: 18, t: 'pupil' }, // (26,18) is pure white specular!
      { x: 26, y: 19, t: 'pupil' }, { x: 27, y: 19, t: 'iris'  }, { x: 28, y: 19, t: 'iris'  }, // warm amber iris glow
      { x: 26, y: 20, t: 'pupil' }, { x: 27, y: 20, t: 'pupil' }
    ],
    // Right Eye (character's left): x=34..36, y=18..21
    right: [
      { x: 33, y: 16, t: 'brow' }, { x: 34, y: 16, t: 'brow' }, { x: 35, y: 16, t: 'brow' }, { x: 36, y: 16, t: 'brow' },
      { x: 34, y: 17, t: 'pupil' }, { x: 35, y: 17, t: 'pupil' }, { x: 36, y: 17, t: 'pupil' },
      { x: 34, y: 18, t: 'white' }, { x: 35, y: 18, t: 'pupil' }, { x: 36, y: 18, t: 'pupil' },
      { x: 34, y: 19, t: 'pupil' }, { x: 35, y: 19, t: 'iris'  }, { x: 36, y: 19, t: 'iris'  },
      { x: 34, y: 20, t: 'pupil' }, { x: 35, y: 20, t: 'pupil' }
    ],
    // Cute Blush Patches on Cheeks: x=23..25 and x=36..38, y=20..22
    blush: [
      { x: 23, y: 20, t: 'blush' }, { x: 24, y: 20, t: 'blush' },
      { x: 23, y: 21, t: 'blush' }, { x: 24, y: 21, t: 'blush' }, { x: 25, y: 21, t: 'blush' },
      { x: 36, y: 20, t: 'blush' }, { x: 37, y: 20, t: 'blush' },
      { x: 36, y: 21, t: 'blush' }, { x: 37, y: 21, t: 'blush' }, { x: 38, y: 21, t: 'blush' }
    ],
    // Nose dot at x=31, y=20
    nose: [
      { x: 31, y: 19, t: 'nose_hi' },
      { x: 31, y: 20, t: 'nose_dot' }
    ],
    // Open Cute Smile at y=23..24
    mouth: [
      { x: 29, y: 23, t: 'mouth_lip' },
      { x: 30, y: 24, t: 'mouth_lip' }, { x: 31, y: 24, t: 'mouth_in' }, { x: 32, y: 24, t: 'mouth_lip' },
      { x: 33, y: 23, t: 'mouth_lip' }
    ]
  }
};

// =========================================================================
// 3. BLUEPRINTS: HATS (Tilted Straw Hat & Billowing Chef Toque)
// =========================================================================

// 🌾 FARMER'S TILTED STRAW HAT:
// Tilted by ~25 degrees (lower on left x=11, y=18; higher on right x=51, y=12)
// Concentric woven straw bands (Highlight 4, Midtone 3, Shadow 2, Deep Underside 1)
const BLUEPRINT_STRAW_HAT = {
  // Conical Crown (y=3..12, x=22..40)
  crown: [
    // Tip at (30..32, 3..4)
    { x: 30, y: 3, t: 4 }, { x: 31, y: 3, t: 4 }, { x: 32, y: 3, t: 4 },
    { x: 29, y: 4, t: 4 }, { x: 30, y: 4, t: 4 }, { x: 31, y: 4, t: 3 }, { x: 32, y: 4, t: 3 }, { x: 33, y: 4, t: 2 },
    // Middle tiers (concentric weave)
    { x: 28, y: 5, t: 4 }, { x: 29, y: 5, t: 4 }, { x: 30, y: 5, t: 3 }, { x: 31, y: 5, t: 3 }, { x: 32, y: 5, t: 2 }, { x: 33, y: 5, t: 2 }, { x: 34, y: 5, t: 2 },
    { x: 27, y: 6, t: 4 }, { x: 28, y: 6, t: 3 }, { x: 29, y: 6, t: 4 }, { x: 30, y: 6, t: 3 }, { x: 31, y: 6, t: 2 }, { x: 32, y: 6, t: 3 }, { x: 33, y: 6, t: 2 }, { x: 34, y: 6, t: 2 }, { x: 35, y: 6, t: 2 },
    { x: 26, y: 7, t: 4 }, { x: 27, y: 7, t: 4 }, { x: 28, y: 7, t: 3 }, { x: 29, y: 7, t: 3 }, { x: 30, y: 7, t: 2 }, { x: 31, y: 7, t: 3 }, { x: 32, y: 7, t: 2 }, { x: 33, y: 7, t: 2 }, { x: 34, y: 7, t: 2 }, { x: 35, y: 7, t: 2 }, { x: 36, y: 7, t: 2 },
    { x: 25, y: 8, t: 4 }, { x: 26, y: 8, t: 3 }, { x: 27, y: 8, t: 4 }, { x: 28, y: 8, t: 3 }, { x: 29, y: 8, t: 3 }, { x: 30, y: 8, t: 2 }, { x: 31, y: 8, t: 2 }, { x: 32, y: 8, t: 3 }, { x: 33, y: 8, t: 2 }, { x: 34, y: 8, t: 2 }, { x: 35, y: 8, t: 2 }, { x: 36, y: 8, t: 2 }, { x: 37, y: 8, t: 2 }
  ],
  // Wide Tilted Oval Brim (x=12..50, y=9..19)
  // Generates concentric curved weave rings
  brimCenter: { x: 31, y: 14 },
  tiltAngle: -0.22 // ~13 degrees upward to right
};

// 🥖 BAKER'S PUFFY CHEF TOQUE:
// Headband base (x=22..40, y=10..13) + 3 Billowing Cloud Lobes (Left, Center, Right)
const BLUEPRINT_CHEF_TOQUE = {
  // Headband band with gold/cream crease
  band: [
    { x: 22, y: 10, t: 3 }, { x: 40, y: 10, t: 3 },
    { x: 22, y: 11, t: 2 }, { x: 40, y: 11, t: 2 },
    { x: 23, y: 12, t: 2 }, { x: 39, y: 12, t: 2 }
  ],
  // 3 Cloud Puffs:
  // Center: radius x=9, y=6 at (31, 5)
  // Left: radius x=7, y=5 at (24, 7)
  // Right: radius x=8, y=5 at (38, 7)
  lobes: [
    { cx: 31, cy: 5, rx: 9, ry: 6, tone: 4 },
    { cx: 24, cy: 7, rx: 7, ry: 5, tone: 3 },
    { cx: 38, cy: 7, rx: 8, ry: 5, tone: 3 }
  ]
};

// =========================================================================
// 4. BLUEPRINTS: HAIR & BUNS
// =========================================================================

// Curly Brown Bangs & Locks (Farmer)
const BLUEPRINT_HAIR_FARMER = {
  // Sweeping curly locks framing forehead without covering eyes (y=12..16)
  locks: [
    // Forehead curl 1 (left): x=23..26, y=14..16
    { x: 24, y: 14, t: 3 }, { x: 25, y: 14, t: 4 }, { x: 26, y: 14, t: 3 },
    { x: 23, y: 15, t: 2 }, { x: 24, y: 15, t: 4 }, { x: 25, y: 15, t: 3 },
    { x: 24, y: 16, t: 1 },
    // Forehead curl 2 (center-left): x=28..31, y=13..15
    { x: 28, y: 13, t: 3 }, { x: 29, y: 13, t: 4 }, { x: 30, y: 13, t: 4 }, { x: 31, y: 13, t: 3 },
    { x: 29, y: 14, t: 3 }, { x: 30, y: 14, t: 4 },
    { x: 29, y: 15, t: 1 },
    // Forehead curl 3 (center-right): x=33..37, y=13..16
    { x: 33, y: 13, t: 3 }, { x: 34, y: 13, t: 4 }, { x: 35, y: 13, t: 4 }, { x: 36, y: 13, t: 3 },
    { x: 34, y: 14, t: 3 }, { x: 35, y: 14, t: 4 }, { x: 36, y: 14, t: 3 },
    { x: 35, y: 15, t: 2 }, { x: 36, y: 15, t: 1 }
  ]
};

// Brunette Hair Buns & Side Locks (Baker)
const BLUEPRINT_HAIR_BAKER = {
  // Face framing side strands
  sideLocks: [
    { x: 21, y: 15, t: 2 }, { x: 21, y: 16, t: 3 }, { x: 21, y: 17, t: 2 }, { x: 21, y: 18, t: 1 },
    { x: 39, y: 15, t: 2 }, { x: 39, y: 16, t: 3 }, { x: 39, y: 17, t: 2 }, { x: 39, y: 18, t: 1 }
  ],
  // Big Bun on back-right of head (3/4 perspective! x=41..48, y=11..18)
  backBun: [
    { cx: 44, cy: 14, rx: 4.5, ry: 4.5, t: 2 }
  ],
  // Stray hair flyaway strands
  flyaways: [
    { x: 47, y: 11, t: 1 }, { x: 48, y: 13, t: 1 }, { x: 47, y: 17, t: 1 }
  ]
};

// =========================================================================
// 5. BLUEPRINTS: CLOTHING & APRONS
// =========================================================================

// Farmer Shirt, Apron, Belt & Work Boots
const BLUEPRINT_OUTFIT_FARMER = {
  // Open Collar with V-Neck showing skin at (30..32, 25..27)
  collar: [
    { x: 26, y: 24, t: 4 }, { x: 27, y: 24, t: 4 }, { x: 28, y: 24, t: 3 }, // Left lapel
    { x: 27, y: 25, t: 3 }, { x: 28, y: 25, t: 2 },
    { x: 34, y: 24, t: 4 }, { x: 35, y: 24, t: 4 }, { x: 36, y: 24, t: 3 }, // Right lapel
    { x: 34, y: 25, t: 3 }, { x: 35, y: 25, t: 2 }
  ],
  // Shirt chest pocket at x=26..29, y=28..31
  chestPocket: [
    { x: 26, y: 28, t: 4 }, { x: 27, y: 28, t: 4 }, { x: 28, y: 28, t: 4 }, { x: 29, y: 28, t: 4 }, // flap
    { x: 26, y: 29, t: 2 }, { x: 27, y: 29, t: 3 }, { x: 28, y: 29, t: 3 }, { x: 29, y: 29, t: 2 },
    { x: 26, y: 30, t: 2 }, { x: 27, y: 30, t: 2 }, { x: 28, y: 30, t: 2 }, { x: 29, y: 30, t: 2 }
  ],
  // Center brass buttons at y=28, 31, 34
  buttons: [
    { x: 31, y: 28, col: '#f59e0b' },
    { x: 31, y: 31, col: '#f59e0b' },
    { x: 31, y: 34, col: '#f59e0b' }
  ],
  // Leather Half-Apron with Rounded Front Patch Pocket (x=28..34, y=38..44)
  apronPocket: [
    { x: 28, y: 38, t: 4 }, { x: 29, y: 38, t: 4 }, { x: 30, y: 38, t: 4 }, { x: 31, y: 38, t: 4 }, { x: 32, y: 38, t: 4 }, { x: 33, y: 38, t: 4 }, { x: 34, y: 38, t: 4 },
    { x: 28, y: 39, t: 2 }, { x: 29, y: 39, t: 3 }, { x: 30, y: 39, t: 3 }, { x: 31, y: 39, t: 3 }, { x: 32, y: 39, t: 3 }, { x: 33, y: 39, t: 3 }, { x: 34, y: 39, t: 2 },
    { x: 28, y: 40, t: 2 }, { x: 34, y: 40, t: 2 },
    { x: 29, y: 41, t: 2 }, { x: 30, y: 41, t: 2 }, { x: 31, y: 41, t: 2 }, { x: 32, y: 41, t: 2 }, { x: 33, y: 41, t: 2 } // rounded bottom
  ],
  // Belt with Gold Buckle at y=35
  belt: [
    { x: 24, y: 35, t: 1 }, { x: 38, y: 35, t: 1 },
    { x: 30, y: 35, col: '#f59e0b' }, { x: 31, y: 35, col: '#fef08a' }, { x: 32, y: 35, col: '#f59e0b' } // buckle
  ],
  // Boots with laces and tread soles
  boots: {
    left: { x: 21, y: 53, w: 8, h: 6 },
    right: { x: 33, y: 53, w: 9, h: 6 }
  }
};

// Baker Pinafore Apron, Blouse & Boots
const BLUEPRINT_OUTFIT_BAKER = {
  // Puffed Blouse Sleeves
  puffedSleeves: [
    { x: 22, y: 26, w: 4, h: 5 },
    { x: 37, y: 26, w: 4, h: 5 }
  ],
  // White Pinafore Bib & Apron with Side Pouch Pockets (x=26..29 and x=33..36, y=36..41)
  sidePockets: [
    { x: 26, y: 36, t: 4 }, { x: 27, y: 36, t: 4 }, { x: 28, y: 36, t: 4 },
    { x: 26, y: 37, t: 2 }, { x: 29, y: 37, t: 2 },
    { x: 26, y: 38, t: 2 }, { x: 29, y: 38, t: 2 },
    { x: 27, y: 39, t: 2 }, { x: 28, y: 39, t: 2 },

    { x: 34, y: 36, t: 4 }, { x: 35, y: 36, t: 4 }, { x: 36, y: 36, t: 4 },
    { x: 33, y: 37, t: 2 }, { x: 36, y: 37, t: 2 },
    { x: 33, y: 38, t: 2 }, { x: 36, y: 38, t: 2 },
    { x: 34, y: 39, t: 2 }, { x: 35, y: 39, t: 2 }
  ]
};

// =========================================================================
// 6. BLUEPRINTS: TOOLS & PROPS (Crescent Sickle & Scored Bread Batard)
// =========================================================================

// 🌾 SICKLE (Harvesting Crescent)
const BLUEPRINT_PROP_SICKLE = {
  // Wooden handle held upright at x=43..45, y=27..38
  handle: [
    { x: 44, y: 27, t: 'cap' },
    { x: 44, y: 28, t: 'grip' }, { x: 45, y: 28, t: 'grip_hi' },
    { x: 44, y: 29, t: 'grip' }, { x: 45, y: 29, t: 'grip_hi' },
    { x: 44, y: 30, t: 'grip' }, { x: 45, y: 30, t: 'grip_hi' },
    { x: 44, y: 31, t: 'grip' }, { x: 45, y: 31, t: 'grip_hi' },
    { x: 44, y: 32, t: 'grip' }, { x: 45, y: 32, t: 'grip_hi' },
    { x: 44, y: 33, t: 'grip' }, { x: 45, y: 33, t: 'grip_hi' },
    { x: 44, y: 34, t: 'grip' }, { x: 45, y: 34, t: 'grip_hi' },
    { x: 44, y: 35, t: 'grip' }, { x: 45, y: 35, t: 'grip_hi' },
    { x: 44, y: 36, t: 'grip' }, { x: 45, y: 36, t: 'grip_hi' },
    { x: 44, y: 37, t: 'pommel' }
  ],
  // Crescent Blade (Arcs from handle top x=45, y=26 up to x=50, y=16 and hooks down to x=56, y=28)
  bladeBezier: {
    p0: { x: 45, y: 26 },
    p1: { x: 51, y: 14 },
    p2: { x: 56, y: 28 }
  }
};

// 🥖 ARTISAN BREAD BATARD (Scored Oval Loaf)
const BLUEPRINT_PROP_BREAD = {
  // Cradled diagonally at ~30 degrees: center (21, 34)
  center: { x: 21, y: 34 },
  rx: 7.5,
  ry: 4.5,
  // 4 Diagonal score slash cuts across the top crust
  scoreAngles: [ -0.6, -0.2, 0.2, 0.6 ]
};

module.exports = {
  SKELETON_FRAMES,
  BLUEPRINT_FACE,
  BLUEPRINT_STRAW_HAT,
  BLUEPRINT_CHEF_TOQUE,
  BLUEPRINT_HAIR_FARMER,
  BLUEPRINT_HAIR_BAKER,
  BLUEPRINT_OUTFIT_FARMER,
  BLUEPRINT_OUTFIT_BAKER,
  BLUEPRINT_PROP_SICKLE,
  BLUEPRINT_PROP_BREAD
};
