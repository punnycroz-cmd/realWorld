/**
 * Natura Profession Character Generator
 * Renders complete 32x48 sprite frames with profession tools, kinematics, and particle FX.
 */
'use strict';

let VP, AS, PAS, CG;
if (typeof require !== 'undefined') {
  VP = require('./visual_primitives.js');
  AS = require('./animation_system.js').AnimationSystem;
  PAS = require('./profession_animation_system.js').ProfessionAnimationSystem;
  CG = require('./character_generator.js').CharacterGenerator;
} else {
  VP = window;
  AS = window.AnimationSystem;
  PAS = window.ProfessionAnimationSystem;
  CG = window.CharacterGenerator;
}

class ProfessionCharacterGenerator {
  /**
   * Renders any frame: idle, walk, or profession action
   */
  static renderFrame(dna, dir = 0, act = 'idle', frame = 0) {
    if (act === 'idle' || act === 'walk') {
      return CG.renderFrame(dna, dir, act, frame);
    }

    // Profession specific action
    const role = (dna.role || 'farmer').toLowerCase();
    const pose = PAS.getProfessionPose(role, frame, dir);

    // Render base frame with custom pose kinematics
    // We can pass pose overrides to CharacterGenerator
    const baseCanvas = CG.renderFrame(dna, dir, 'work', frame, {
      torsoTiltX: pose.torsoTiltX,
      comBobY: pose.comBobY,
      headBobY: pose.headBobY
    });

    // Draw profession props and visual effects onto the 32x48 canvas
    this.drawProfessionProps(baseCanvas, role, frame, dir, pose, dna);

    return baseCanvas;
  }

  /**
   * Renders props, tools, and visual effects for each profession
   */
  static drawProfessionProps(c, role, frame, dir, pose, dna) {
    const f = frame % 8;

    switch (role) {
      case 'blacksmith': {
        // Anvil
        c.fillRect(20, 37, 8, 7, '#374151');
        c.fillRect(18, 36, 12, 2, '#4b5563'); // Anvil face
        // Glowing billet
        const heatColor = (f === 2 || f === 6) ? '#fde047' : '#ea580c';
        c.fillRect(22, 35, 4, 2, heatColor);
        // Hammer
        const hy = pose.armRight.y + 4;
        c.fillRect(22, hy - 6, 2, 8, '#78350f'); // handle
        c.fillRect(20, hy - 8, 6, 3, '#64748b'); // head
        break;
      }

      case 'farmer': {
        // Soil mound
        c.fillRect(18, 42, 12, 3, '#78350f');
        c.setPixel(19, 41, '#92400e');
        c.setPixel(25, 41, '#92400e');
        // Hoe
        const hy = pose.armRight.y + 4;
        c.fillRect(20, hy - 4, 1, 14, '#92400e');
        c.fillRect(18, hy + 9, 5, 2, '#94a3b8');
        break;
      }

      case 'baker': {
        // Dough table
        c.fillRect(12, 36, 16, 6, '#b45309');
        c.fillRect(11, 35, 18, 2, '#d97706'); // top
        // Dough ball
        const doughY = (f === 1 || f === 5) ? 34 : 33;
        const doughW = (f === 1 || f === 5) ? 8 : 6;
        c.fillRect(20 - Math.floor(doughW / 2), doughY, doughW, 2, '#fef08a');
        // Rolling pin
        if (f === 2 || f === 6) {
          c.fillRect(15, 32, 10, 2, '#92400e');
        }
        break;
      }

      case 'herbalist': {
        // Flower basket in left hand
        c.fillRect(9, 29, 6, 5, '#92400e');
        c.fillRect(8, 28, 8, 1, '#b45309');
        c.setPixel(10, 27, '#a855f7'); // lavender
        c.setPixel(13, 27, '#22c55e'); // herb
        // Herb bush on right
        c.fillRect(22, 40, 8, 5, '#15803d');
        c.setPixel(24, 38, '#a855f7');
        c.setPixel(27, 39, '#eab308');
        break;
      }

      case 'fisherman': {
        // Bamboo fishing rod
        const ry = pose.armRight.y;
        c.fillRect(22, ry - 14, 1, 20, '#ca8a04');
        // Line
        c.fillRect(23, ry - 14, 6, 1, '#e2e8f0');
        c.fillRect(29, ry - 13, 1, 14, '#e2e8f0');
        // Bobber or Catch
        if (f >= 4) {
          // Jumping silver fish
          c.fillRect(27, 32, 4, 3, '#94a3b8');
          c.setPixel(31, 33, '#64748b'); // tail
          c.setPixel(28, 33, '#38bdf8'); // eye glint
        } else {
          c.setPixel(29, 43, '#ef4444'); // red bobber
        }
        break;
      }

      case 'miner': {
        // Rock face
        c.fillRect(23, 34, 8, 11, '#475569');
        c.fillRect(24, 36, 6, 8, '#334155');
        // Pickaxe
        const py = pose.armRight.y;
        c.fillRect(20, py - 4, 2, 14, '#78350f');
        c.fillRect(18, py - 6, 6, 2, '#cbd5e1'); // pick head
        c.setPixel(17, py - 5, '#94a3b8');
        c.setPixel(24, py - 5, '#94a3b8');
        // Helmet lamp
        c.setPixel(16, 12, '#fef08a');
        break;
      }

      case 'lumberjack': {
        // Chopping log
        c.fillRect(20, 39, 10, 6, '#78350f');
        c.fillRect(22, 38, 6, 2, '#92400e');
        // Axe
        const ay = pose.armRight.y;
        c.fillRect(21, ay - 6, 2, 16, '#92400e');
        c.fillRect(19, ay - 8, 6, 3, '#94a3b8'); // double bit
        break;
      }

      case 'guard': {
        // Kite shield (left arm)
        c.fillRect(8, 24, 6, 11, '#1e3a8a');
        c.fillRect(9, 25, 4, 9, '#3b82f6');
        c.setPixel(11, 28, '#fbbf24'); // gold emblem
        // Broadsword (right arm)
        const sy = pose.armRight.y;
        c.fillRect(22, sy - 10, 2, 14, '#e2e8f0');
        c.fillRect(20, sy + 3, 6, 1, '#ca8a04'); // crossguard
        c.setPixel(22, sy + 4, '#78350f'); // hilt
        break;
      }

      case 'hunter': {
        // Recurve bow
        const by = pose.armLeft.y;
        c.fillRect(24, by - 8, 1, 18, '#92400e');
        c.setPixel(23, by - 8, '#ca8a04');
        c.setPixel(23, by + 9, '#ca8a04');
        // String
        c.fillRect(22, by - 7, 1, 16, '#e2e8f0');
        // Arrow
        if (f <= 3) {
          c.fillRect(17, by + 1, 10, 1, '#b45309');
          c.setPixel(27, by + 1, '#94a3b8'); // arrowhead
          c.setPixel(16, by + 1, '#ef4444'); // red fletch
        }
        break;
      }

      case 'merchant': {
        // Coin pouch
        c.fillRect(11, 27, 4, 5, '#92400e');
        c.setPixel(12, 26, '#eab308'); // gold drawstring
        // Gold coin in air
        if (f >= 1 && f <= 5) {
          const cy = (f === 2) ? 16 : (f === 3 ? 20 : 22);
          c.fillRect(21, cy, 3, 3, '#facc15');
          c.setPixel(22, cy + 1, '#fef08a');
        }
        break;
      }

      case 'scholar': {
        // Alchemy flask
        const fy = pose.armRight.y;
        c.fillRect(21, fy - 1, 3, 2, '#94a3b8'); // neck
        c.fillRect(20, fy + 1, 5, 4, '#38bdf8'); // potion body
        c.setPixel(22, fy + 2, '#67e8f9'); // bubble
        // Open scroll in left hand
        c.fillRect(9, 27, 5, 6, '#fef3c7');
        c.fillRect(10, 29, 3, 1, '#78350f'); // text line
        break;
      }

      case 'carpenter': {
        // Sawhorse & plank
        c.fillRect(19, 38, 11, 3, '#b45309');
        c.fillRect(21, 41, 2, 5, '#78350f'); // legs
        c.fillRect(27, 41, 2, 5, '#78350f');
        // Hand saw
        const sy = pose.armRight.y;
        c.fillRect(20, sy + 3, 8, 2, '#94a3b8');
        c.fillRect(18, sy + 2, 2, 4, '#78350f'); // wooden handle
        break;
      }

      case 'tailor': {
        // Bolt of draped cloth
        c.fillRect(9, 31, 8, 7, '#0284c7');
        c.fillRect(10, 32, 6, 5, '#38bdf8');
        // Needle & thread
        const ny = pose.armRight.y;
        c.setPixel(20, ny, '#e2e8f0');
        c.setPixel(21, ny - 1, '#ffffff'); // needle point
        c.fillRect(18, ny + 1, 3, 1, '#facc15'); // gold thread
        break;
      }

      case 'chef': {
        // Copper stew cauldron
        c.fillRect(19, 34, 10, 8, '#b45309');
        c.fillRect(18, 33, 12, 2, '#d97706'); // rim
        c.fillRect(20, 35, 8, 2, '#ea580c'); // broth
        // Big stirring ladle
        const ly = pose.armRight.y;
        c.fillRect(22, ly - 4, 1, 10, '#ca8a04');
        c.fillRect(21, ly + 5, 3, 2, '#a16207');
        break;
      }

      case 'potter': {
        // Potter's wheel
        c.fillRect(13, 40, 14, 4, '#475569');
        c.fillRect(15, 39, 10, 2, '#64748b');
        // Clay vase
        c.fillRect(17, 34, 6, 6, '#d97706');
        c.fillRect(18, 32, 4, 2, '#b45309'); // vase neck
        break;
      }

      case 'innkeeper': {
        // Beer keg on counter
        c.fillRect(19, 33, 11, 10, '#78350f');
        c.fillRect(20, 32, 9, 2, '#92400e');
        c.fillRect(18, 36, 2, 2, '#ca8a04'); // brass spigot
        // Wooden tankard
        c.fillRect(11, 28, 4, 5, '#a16207');
        c.fillRect(11, 27, 4, 1, '#ffffff'); // foam head
        break;
      }

      case 'mason': {
        // Carved stone block
        c.fillRect(19, 36, 10, 8, '#94a3b8');
        c.fillRect(20, 37, 8, 6, '#cbd5e1');
        // Chisel & Mallet
        c.fillRect(21, 33, 2, 5, '#64748b'); // chisel
        const my = pose.armRight.y;
        c.fillRect(23, my - 4, 2, 8, '#78350f'); // mallet handle
        c.fillRect(21, my - 6, 6, 3, '#92400e'); // mallet head
        break;
      }

      case 'shepherd': {
        // Shepherd's crook
        c.fillRect(11, 18, 1, 26, '#78350f');
        c.fillRect(9, 16, 3, 2, '#92400e'); // curved crook
        c.setPixel(9, 18, '#92400e');
        break;
      }

      case 'sailor': {
        // Long pine oar
        const oy = pose.armLeft.y;
        c.fillRect(20, oy - 8, 2, 22, '#92400e');
        c.fillRect(19, oy + 12, 4, 6, '#b45309'); // paddle blade
        break;
      }

      case 'apprentice': {
        // Large leather bellows
        c.fillRect(19, 32, 10, 7, '#92400e');
        c.fillRect(17, 34, 3, 3, '#64748b'); // iron nozzle
        c.fillRect(28, 31, 2, 9, '#78350f'); // handles
        break;
      }

      case 'gardener': {
        // Zinc watering can
        const wy = pose.armRight.y;
        c.fillRect(21, wy, 6, 5, '#64748b');
        c.fillRect(25, wy - 3, 4, 2, '#94a3b8'); // spout
        // Flower pot
        c.fillRect(21, 41, 6, 4, '#b45309');
        c.setPixel(23, 39, '#ec4899'); // blooming flower
        c.setPixel(24, 39, '#f472b6');
        break;
      }

      case 'bard': {
        // Wooden lute
        c.fillRect(18, 24, 6, 8, '#b45309');
        c.fillRect(19, 25, 4, 6, '#d97706'); // soundboard
        c.setPixel(21, 28, '#78350f'); // soundhole
        c.fillRect(16, 21, 3, 4, '#78350f'); // fretboard neck
        break;
      }

      case 'fletcher': {
        // Arrow clamp
        c.fillRect(18, 26, 11, 2, '#b45309');
        c.fillRect(17, 25, 3, 2, '#ef4444'); // red fletching feather
        c.fillRect(28, 26, 2, 2, '#94a3b8'); // arrowhead
        break;
      }

      case 'tanner': {
        // Tanned hide stretched on wooden rack
        c.fillRect(9, 28, 10, 12, '#92400e');
        c.fillRect(10, 29, 8, 10, '#b45309');
        // Curved scraping knife
        const ky = pose.armLeft.y;
        c.fillRect(11, ky + 1, 8, 2, '#cbd5e1');
        break;
      }

      case 'scout': {
        // Brass spyglass
        const sy = pose.armRight.y;
        c.fillRect(22, sy - 2, 7, 2, '#ca8a04');
        c.setPixel(28, sy - 2, '#38bdf8'); // lens
        break;
      }

      case 'apothecary': {
        // Marble mortar & pestle
        c.fillRect(16, 30, 6, 4, '#cbd5e1');
        c.fillRect(17, 31, 4, 2, '#4ade80'); // green herbs
        c.fillRect(19, 28, 2, 4, '#94a3b8'); // pestle
        break;
      }

      case 'scribe': {
        // High desk & ledger
        c.fillRect(11, 31, 8, 9, '#78350f');
        c.fillRect(10, 30, 10, 2, '#92400e');
        c.fillRect(12, 28, 6, 3, '#fef3c7'); // parchment
        // Feather quill
        c.fillRect(20, 22, 1, 6, '#e2e8f0');
        c.setPixel(21, 21, '#ffffff');
        break;
      }

      case 'master_smith': {
        // Water trough
        c.fillRect(18, 36, 12, 8, '#78350f');
        c.fillRect(19, 37, 10, 5, '#38bdf8'); // water
        // Tongs & tempered sword
        const sy = pose.armRight.y;
        c.fillRect(21, sy - 6, 2, 16, '#64748b'); // tongs
        c.fillRect(22, sy, 2, 12, '#94a3b8'); // blade
        break;
      }

      case 'rancher': {
        // Lasso rope loop
        const ly = pose.armRight.y - 4;
        c.fillRect(18, ly - 3, 10, 1, '#d97706');
        c.fillRect(17, ly - 2, 1, 4, '#d97706');
        c.fillRect(28, ly - 2, 1, 4, '#d97706');
        c.fillRect(18, ly + 2, 10, 1, '#d97706');
        break;
      }

      case 'village_elder': {
        // Ornate elder staff
        c.fillRect(24, 13, 2, 31, '#78350f');
        c.fillRect(23, 12, 4, 3, '#ca8a04'); // gold mount
        c.fillRect(24, 10, 2, 3, '#f59e0b'); // amber crystal
        c.setPixel(24, 11, '#fef08a'); // glint
        break;
      }
    }

    // Render animated particles
    for (const fx of pose.fx) {
      this.drawParticleEffect(c, fx, f);
    }
  }

  /**
   * Particle effects drawing helper
   */
  static drawParticleEffect(c, fx, frame) {
    const col = fx.color || '#ffffff';
    const count = fx.count || 3;
    for (let i = 0; i < count; i++) {
      const offsetX = ((i * 7 + frame * 3) % 9) - 4;
      const offsetY = -((frame * 2 + i * 3) % 8);
      const px = fx.x + offsetX;
      const py = fx.y + offsetY;
      if (px >= 0 && px < 32 && py >= 0 && py < 48) {
        c.setPixel(px, py, col);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.ProfessionCharacterGenerator = ProfessionCharacterGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProfessionCharacterGenerator };
}
