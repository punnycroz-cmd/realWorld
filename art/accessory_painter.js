/**
 * Natura Accessory Painter (Phase 16)
 * 
 * Renders iconic, high-fidelity profession gear and headwear:
 * - Farmer: Tilted straw hat with woven brim, crescent sickle, harvest satchel
 * - Baker: Puffy chef toque, artisan scored bread loaf, rolling pin
 * - Blacksmith: Knotted headband, heavy iron sledgehammer, leather gauntlets
 * - Fisherman: Sou'wester rain hat, bamboo fishing rod with fish, wicker creel
 * - Ranger: Hooded cowl with feather, yew recurve bow, leather quiver
 * - Knight: Steel greathelm with plume, heraldic heater shield, broadsword
 * - Mage: Wide-brim pointed wizard hat, crystal mana staff
 */
'use strict';

let VP, MaterialPainter;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  MaterialPainter = require('./material_painter.js').MaterialPainter;
} else {
  VP = (typeof window !== 'undefined' ? window : globalThis);
  MaterialPainter = (typeof window !== 'undefined' ? window.MaterialPainter : globalThis.MaterialPainter);
}

class AccessoryPainter {
  /**
   * Paints profession-defining headwear
   */
  static paintHeadwear(c, midX, headCenterY, role, dir = 0, z = 75) {
    switch (role) {
      case 'farmer':
        this.paintStrawHat(c, midX, headCenterY - 7, dir, z);
        break;
      case 'baker':
        this.paintBakerToque(c, midX, headCenterY - 8, dir, z);
        break;
      case 'blacksmith':
        this.paintBandana(c, midX, headCenterY - 6, dir, z);
        break;
      case 'fisherman':
        this.paintRainHat(c, midX, headCenterY - 7, dir, z);
        break;
      case 'ranger':
      case 'hunter':
        this.paintHoodedCowl(c, midX, headCenterY - 6, dir, z);
        break;
      case 'knight':
        this.paintKnightHelm(c, midX, headCenterY - 6, dir, z);
        break;
      case 'mage':
        this.paintWizardHat(c, midX, headCenterY - 8, dir, z);
        break;
    }
  }

  /**
   * Farmer's Tilted Woven Straw Hat
   */
  static paintStrawHat(c, midX, crownY, dir = 0, z = 75) {
    const strawRamp = MaterialPainter.getRamp('straw');
    
    // Crown Dome
    for (let y = 0; y < 7; y++) {
      const w = 11 - Math.floor(y * 0.7);
      c.fillRect(midX - w, crownY + y, w * 2, 1, strawRamp[3], 3, z);
    }
    // Crown Highlight (sunlit top-left)
    c.fillRect(midX - 7, crownY + 1, 6, 2, strawRamp[5], 5, z + 1);

    // Crimson Hatband
    c.fillRect(midX - 11, crownY + 6, 22, 2, '#9c2424', 2, z + 1);
    c.fillRect(midX - 8, crownY + 6, 6, 1, '#c93b3b', 3, z + 2); // band highlight

    // Wide Woven Brim with natural curve
    for (let y = 0; y < 4; y++) {
      const drop = (y === 0) ? -1 : (y === 3 ? 1 : 0);
      const brimW = 20 - y;
      c.fillRect(midX - brimW, crownY + 8 + y + drop, brimW * 2, 1, (y >= 2) ? strawRamp[2] : strawRamp[4], 4, z);
    }
    // Deep shadow cast by brim onto upper face
    c.fillRect(midX - 12, crownY + 12, 24, 2, 'rgba(30, 15, 5, 0.45)', 1, z - 2);
  }

  /**
   * Baker's Billowing Chef Toque
   */
  static paintBakerToque(c, midX, crownY, dir = 0, z = 75) {
    const toqueWhite = ['#475569', '#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff'];

    // Puffy cloud lobes
    c.fillRect(midX - 11, crownY - 6, 22, 9, toqueWhite[3], 3, z);
    c.fillRect(midX - 8, crownY - 9, 16, 4, toqueWhite[4], 4, z + 1);
    // Pleat shadow folds
    c.fillRect(midX - 5, crownY - 5, 2, 8, toqueWhite[1], 2, z + 1);
    c.fillRect(midX + 2, crownY - 5, 2, 8, toqueWhite[1], 2, z + 1);

    // Headband
    c.fillRect(midX - 9, crownY + 3, 18, 3, toqueWhite[2], 3, z + 1);
    c.fillRect(midX - 7, crownY + 3, 8, 1, toqueWhite[4], 4, z + 2);
  }

  /**
   * Blacksmith's Knotted Crimson Bandana
   */
  static paintBandana(c, midX, crownY, dir = 0, z = 75) {
    // Crimson band around forehead
    c.fillRect(midX - 9, crownY + 2, 18, 3, '#9c1c1c', 2, z);
    c.fillRect(midX - 6, crownY + 2, 7, 1, '#dc2626', 3, z + 1);
    // Knotted tails trailing on left side
    c.fillRect(midX - 11, crownY + 3, 3, 6, '#7f1d1d', 2, z + 1);
    c.fillRect(midX - 12, crownY + 7, 2, 4, '#9c1c1c', 2, z + 1);
  }

  /**
   * Fisherman's Sou'wester Rain Hat
   */
  static paintRainHat(c, midX, crownY, dir = 0, z = 75) {
    const yellowRamp = ['#5a4200', '#8c6800', '#c29200', '#f5bc00', '#ffde59', '#fff3b0'];
    // Dome
    c.fillRect(midX - 8, crownY, 16, 6, yellowRamp[3], 3, z);
    c.fillRect(midX - 6, crownY + 1, 6, 2, yellowRamp[4], 4, z + 1);
    // Asymmetrical Brim (longer in back to shed rain)
    c.fillRect(midX - 13, crownY + 6, 26, 3, yellowRamp[3], 3, z + 1);
    c.fillRect(midX - 14, crownY + 8, 8, 5, yellowRamp[2], 2, z - 5); // back flap
  }

  /**
   * Ranger / Hunter Hooded Cowl
   */
  static paintHoodedCowl(c, midX, crownY, dir = 0, z = 75) {
    const greenRamp = ['#142416', '#213a24', '#315535', '#45774a', '#60a367'];
    // Cowl dome framing head
    c.fillRect(midX - 10, crownY - 2, 20, 10, greenRamp[2], 3, z);
    c.fillRect(midX - 7, crownY - 4, 14, 3, greenRamp[3], 4, z + 1);
    // Hawk feather tucked in side
    c.fillRect(midX + 7, crownY - 6, 2, 6, '#dc2626', 4, z + 2);
    c.setPixel(midX + 8, crownY - 7, '#ffffff', 5, z + 3);
  }

  /**
   * Knight Greathelm
   */
  static paintKnightHelm(c, midX, crownY, dir = 0, z = 75) {
    const steelRamp = MaterialPainter.getRamp('metal');
    // Dome
    c.fillRect(midX - 9, crownY - 2, 18, 9, steelRamp[3], 3, z);
    c.fillRect(midX - 6, crownY - 1, 5, 2, steelRamp[5], 5, z + 1); // glint
    // Visor horizontal eye slit
    if (dir === 0) {
      c.fillRect(midX - 6, crownY + 6, 12, 1, '#090d16', 1, z + 2);
      c.fillRect(midX - 1, crownY + 4, 2, 6, '#eab308', 4, z + 3); // gold cross
    }
    // Blue plume
    c.fillRect(midX - 2, crownY - 7, 5, 6, '#2563eb', 4, z + 4);
    c.setPixel(midX, crownY - 8, '#60a5fa', 5, z + 5);
  }

  /**
   * Mage Wizard Hat
   */
  static paintWizardHat(c, midX, crownY, dir = 0, z = 75) {
    const violetRamp = ['#1e1438', '#382268', '#5836a0', '#7b4ecc', '#a77bf5'];
    // Wide brim
    c.fillRect(midX - 15, crownY + 6, 30, 3, violetRamp[2], 3, z);
    // Tall tapering conical peak
    for (let y = 0; y < 12; y++) {
      const w = 9 - Math.floor(y * 0.7);
      const tipCurve = Math.floor((y * y) / 25);
      c.fillRect(midX - w + tipCurve, crownY + 5 - y, w * 2, 1, violetRamp[3], 3, z);
    }
    // Gold Moon Buckle
    c.fillRect(midX - 3, crownY + 4, 5, 3, '#eab308', 4, z + 1);
    c.setPixel(midX - 1, crownY + 5, '#1e1438', 1, z + 2);
  }

  /**
   * Paints hand-held tool or weapon directly aligned with grip
   */
  static paintHeldTool(c, handX, handY, role, dir = 0, z = 90) {
    switch (role) {
      case 'farmer':
        // Crescent Sickle
        c.fillRect(handX, handY - 4, 2, 8, '#784824', 3, z); // wood handle
        // Curved metal blade
        c.fillRect(handX - 4, handY - 8, 6, 2, '#e2e8f0', 4, z + 1);
        c.fillRect(handX - 6, handY - 6, 3, 3, '#ffffff', 5, z + 1);
        break;

      case 'baker':
        // Artisan scored sourdough loaf
        c.fillRect(handX - 3, handY - 2, 8, 6, '#b45309', 3, z);
        c.fillRect(handX - 2, handY - 1, 6, 4, '#d97706', 4, z + 1);
        c.setPixel(handX, handY, '#ffffff', 5, z + 2); // flour dusting in slash cut
        break;

      case 'blacksmith':
        // Heavy Iron Sledgehammer
        c.fillRect(handX - 1, handY - 8, 3, 16, '#5c3519', 3, z); // heavy haft
        c.fillRect(handX - 5, handY - 11, 11, 5, '#475569', 3, z + 1); // iron head
        c.fillRect(handX - 4, handY - 10, 4, 2, '#94a3b8', 4, z + 2); // bevel highlight
        c.setPixel(handX - 5, handY - 11, '#ffffff', 5, z + 3); // glint
        break;

      case 'fisherman':
        // Bamboo fishing rod with line
        c.fillRect(handX, handY - 16, 2, 22, '#ca8a04', 3, z);
        // Line drooping down
        c.fillRect(handX + 1, handY + 6, 1, 8, '#cbd5e1', 2, z - 1);
        // Caught turquoise fish
        c.fillRect(handX, handY + 14, 4, 3, '#06b6d4', 3, z);
        c.setPixel(handX + 3, handY + 15, '#22d3ee', 4, z + 1);
        break;

      case 'ranger':
      case 'hunter':
        // Yew recurve bow
        for (let y = -8; y <= 8; y++) {
          const bend = Math.floor((64 - y * y) / 16);
          c.setPixel(handX + bend, handY + y, '#78350f', 3, z);
        }
        // Taut bowstring
        c.fillRect(handX, handY - 8, 1, 17, '#f8fafc', 2, z + 1);
        break;

      case 'knight':
        // Steel Broadsword
        c.fillRect(handX, handY - 14, 2, 18, '#e2e8f0', 4, z); // blade
        c.setPixel(handX, handY - 15, '#ffffff', 5, z + 1); // tip glint
        c.fillRect(handX - 3, handY + 4, 8, 2, '#eab308', 4, z + 1); // gold guard
        c.fillRect(handX, handY + 6, 2, 4, '#78350f', 3, z); // hilt
        c.fillRect(handX - 1, handY + 10, 4, 2, '#eab308', 4, z + 1); // pommel
        break;

      case 'mage':
        // Crystal Mana Staff
        c.fillRect(handX, handY - 18, 2, 26, '#451a03', 3, z); // dark ash wood staff
        // Glowing mana orb
        c.fillRect(handX - 2, handY - 22, 6, 5, '#8b5cf6', 4, z + 1);
        c.fillRect(handX - 1, handY - 21, 4, 3, '#c084fc', 5, z + 2);
        c.setPixel(handX, handY - 20, '#ffffff', 5, z + 3); // core gleam
        break;
    }
  }
}

if (typeof window !== 'undefined') {
  window.AccessoryPainter = AccessoryPainter;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessoryPainter };
}
