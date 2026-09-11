/**
 * Natura Profession Animation System
 * Kinematic poses and visual effect definitions for 30 distinct professions.
 */
'use strict';

class ProfessionAnimationSystem {
  /**
   * Returns kinematic pose and prop/particle state for a profession action.
   * @param {string} profession - e.g. 'blacksmith', 'farmer', etc.
   * @param {number} frame - 0 to 7
   * @param {number} dir - 0=front, 1=back, 2=left, 3=right
   */
  static getProfessionPose(profession, frame = 0, dir = 0) {
    const f = frame % 8;
    // Base pose defaulted from idle
    const pose = {
      act: profession,
      frame: f,
      dir,
      comBobY: 0,
      torsoTiltX: 0,
      headBobY: 0,
      headBobX: 0,
      armLeft: { x: 10, y: 26, up: false, angle: 0 },
      armRight: { x: 22, y: 26, up: false, angle: 0 },
      legLeft: { x: 12, y: 42, footY: 42 },
      legRight: { x: 20, y: 42, footY: 42 },
      tool: { active: true, name: profession, frame: f },
      fx: [] // particle / visual effect list
    };

    switch (profession) {
      case 'blacksmith': // Hammer on anvil
        if (f === 0) { pose.armRight.y = 16; pose.armRight.up = true; pose.comBobY = -1; }
        else if (f === 1) { pose.armRight.y = 22; pose.comBobY = 0; }
        else if (f === 2) {
          pose.armRight.y = 29; pose.comBobY = 1;
          pose.fx.push({ type: 'sparks', x: 24, y: 31, count: 6, color: '#ffb703' });
        }
        else if (f === 3) { pose.armRight.y = 24; pose.comBobY = 0; }
        else if (f === 4) { pose.armRight.y = 17; pose.armRight.up = true; pose.comBobY = -1; }
        else if (f === 5) { pose.armRight.y = 23; pose.comBobY = 0; }
        else if (f === 6) {
          pose.armRight.y = 29; pose.comBobY = 1;
          pose.fx.push({ type: 'sparks', x: 24, y: 31, count: 7, color: '#fb8500' });
        }
        else { pose.armRight.y = 26; pose.armLeft.y = 22; } // Wipe brow
        break;

      case 'farmer': // Till with hoe
        if (f === 0) { pose.armRight.y = 18; pose.armLeft.y = 20; pose.comBobY = -1; }
        else if (f === 1) { pose.armRight.y = 24; pose.armLeft.y = 24; pose.torsoTiltX = 1; }
        else if (f === 2) {
          pose.armRight.y = 30; pose.armLeft.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'dirt', x: 22, y: 43, count: 5, color: '#6f4e37' });
        }
        else if (f === 3) { pose.armRight.y = 27; pose.armLeft.y = 26; pose.comBobY = 0; }
        else if (f === 4) { pose.armRight.y = 20; pose.armLeft.y = 20; }
        else if (f === 5) {
          pose.armRight.y = 30; pose.armLeft.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'dirt', x: 22, y: 43, count: 5, color: '#593e2b' });
        }
        else if (f === 6) { pose.armRight.y = 25; pose.armLeft.y = 22; }
        else { pose.armRight.y = 26; pose.armLeft.y = 26; }
        break;

      case 'baker': // Knead dough & roll
        pose.torsoTiltX = 1;
        if (f === 0 || f === 4) { pose.armLeft.y = 27; pose.armRight.y = 27; pose.comBobY = 0; }
        else if (f === 1 || f === 5) {
          pose.armLeft.y = 30; pose.armRight.y = 30; pose.comBobY = 1;
          pose.fx.push({ type: 'flour', x: 16, y: 34, count: 4, color: '#f8fafc' });
        }
        else if (f === 2 || f === 6) { pose.armLeft.y = 26; pose.armRight.y = 28; pose.comBobY = 0; }
        else { pose.armLeft.y = 28; pose.armRight.y = 26; pose.comBobY = 0; }
        break;

      case 'herbalist': // Gather herbs
        if (f === 0) { pose.armLeft.y = 25; pose.armRight.y = 25; }
        else if (f === 1 || f === 2 || f === 3) {
          pose.comBobY = 3; pose.torsoTiltX = 2; // crouch
          pose.armRight.y = 36; pose.armLeft.y = 31;
          if (f === 2) pose.fx.push({ type: 'leaves', x: 22, y: 42, count: 4, color: '#84cc16' });
        }
        else if (f === 4) {
          pose.comBobY = 1; pose.armRight.y = 28; pose.armLeft.y = 26;
          pose.fx.push({ type: 'petals', x: 19, y: 30, count: 3, color: '#c084fc' });
        }
        else { pose.comBobY = 0; pose.armRight.y = 25; pose.armLeft.y = 26; }
        break;

      case 'fisherman': // Cast and reel rod
        if (f === 0) { pose.armRight.y = 16; pose.armRight.up = true; }
        else if (f === 1) {
          pose.armRight.y = 26;
          pose.fx.push({ type: 'splash', x: 28, y: 43, count: 4, color: '#38bdf8' });
        }
        else if (f === 2 || f === 3) { pose.armRight.y = 24; pose.armLeft.y = 27; }
        else if (f === 4 || f === 5) {
          pose.armRight.y = 19; pose.armLeft.y = 25; // hook catch
          pose.fx.push({ type: 'splash', x: 27, y: 38, count: 5, color: '#7dd3fc' });
        }
        else { pose.armRight.y = 22; pose.armLeft.y = 24; }
        break;

      case 'miner': // Pickaxe strike
        if (f === 0 || f === 1) { pose.armLeft.y = 16; pose.armRight.y = 15; pose.comBobY = -1; }
        else if (f === 2) {
          pose.armLeft.y = 29; pose.armRight.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'sparks', x: 25, y: 34, count: 6, color: '#fde047' });
          pose.fx.push({ type: 'debris', x: 26, y: 35, count: 4, color: '#64748b' });
        }
        else if (f === 3) { pose.armLeft.y = 24; pose.armRight.y = 24; pose.comBobY = 0; }
        else if (f === 4) { pose.armLeft.y = 16; pose.armRight.y = 15; pose.comBobY = -1; }
        else if (f === 5) {
          pose.armLeft.y = 29; pose.armRight.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'gem_glint', x: 26, y: 34, count: 3, color: '#38bdf8' });
        }
        else { pose.armLeft.y = 23; pose.armRight.y = 24; }
        break;

      case 'lumberjack': // Chop tree with axe
        if (f === 0 || f === 1) { pose.armLeft.y = 17; pose.armRight.y = 16; pose.comBobY = -1; }
        else if (f === 2) {
          pose.armLeft.y = 29; pose.armRight.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'wood_chips', x: 24, y: 36, count: 6, color: '#d97706' });
        }
        else if (f === 3) { pose.armLeft.y = 24; pose.armRight.y = 25; }
        else if (f === 4) { pose.armLeft.y = 17; pose.armRight.y = 16; pose.comBobY = -1; }
        else if (f === 5) {
          pose.armLeft.y = 29; pose.armRight.y = 28; pose.comBobY = 1;
          pose.fx.push({ type: 'wood_chips', x: 24, y: 36, count: 6, color: '#b45309' });
        }
        else { pose.armLeft.y = 25; pose.armRight.y = 26; }
        break;

      case 'guard': // Shield bash and sword slash
        if (f === 0) { pose.armLeft.y = 25; pose.armRight.y = 26; }
        else if (f === 1) { pose.armLeft.y = 22; pose.armRight.y = 28; } // Shield thrust
        else if (f === 2) { pose.armLeft.y = 24; pose.armRight.y = 18; } // Sword back
        else if (f === 3) {
          pose.armLeft.y = 24; pose.armRight.y = 26; // Slash
          pose.fx.push({ type: 'slash_arc', x: 23, y: 26, count: 5, color: '#e2e8f0' });
        }
        else if (f === 4) {
          pose.armLeft.y = 23; pose.armRight.y = 24;
          pose.fx.push({ type: 'glint', x: 27, y: 22, count: 2, color: '#ffffff' });
        }
        else { pose.armLeft.y = 25; pose.armRight.y = 26; }
        break;

      case 'hunter': // Bow pull and release
        if (f === 0) { pose.armLeft.y = 24; pose.armRight.y = 28; } // Reach arrow
        else if (f === 1) { pose.armLeft.y = 22; pose.armRight.y = 23; } // Nock
        else if (f === 2 || f === 3) { pose.armLeft.y = 21; pose.armRight.y = 21; } // Draw string
        else if (f === 4) {
          pose.armLeft.y = 21; pose.armRight.y = 24; // Release!
          pose.fx.push({ type: 'arrow_trail', x: 26, y: 21, count: 4, color: '#cbd5e1' });
        }
        else { pose.armLeft.y = 24; pose.armRight.y = 26; }
        break;

      case 'merchant': // Appraise gold coin
        if (f === 0) { pose.armRight.y = 27; pose.armLeft.y = 27; }
        else if (f === 1) { pose.armRight.y = 22; } // Flip coin
        else if (f === 2) {
          pose.armRight.y = 19;
          pose.fx.push({ type: 'gold_glint', x: 22, y: 17, count: 3, color: '#facc15' });
        }
        else if (f === 3) { pose.armRight.y = 24; } // Catch
        else if (f === 4 || f === 5) {
          pose.armRight.y = 21; pose.headBobY = 1;
          pose.fx.push({ type: 'gold_glint', x: 22, y: 20, count: 2, color: '#fde047' });
        }
        else { pose.armRight.y = 26; pose.armLeft.y = 26; }
        break;

      case 'scholar': // Swirling flask & alchemy reaction
        if (f === 0 || f === 1) { pose.armRight.y = 22; pose.armLeft.y = 25; }
        else if (f === 2) {
          pose.armRight.y = 21; pose.armLeft.y = 21;
          pose.fx.push({ type: 'bubbles', x: 23, y: 22, count: 4, color: '#38bdf8' });
        }
        else if (f === 3 || f === 4) {
          pose.armRight.y = 20; pose.armLeft.y = 24;
          pose.fx.push({ type: 'magic_smoke', x: 23, y: 17, count: 5, color: '#c084fc' });
        }
        else { pose.armRight.y = 23; pose.armLeft.y = 26; }
        break;

      case 'carpenter': // Push-pull wood saw
        pose.torsoTiltX = 1;
        if (f === 0 || f === 2 || f === 4 || f === 6) {
          pose.armRight.y = 27; pose.armLeft.y = 25; pose.comBobY = 0;
        } else {
          pose.armRight.y = 31; pose.armLeft.y = 25; pose.comBobY = 1;
          pose.fx.push({ type: 'sawdust', x: 22, y: 36, count: 4, color: '#fed7aa' });
        }
        break;

      case 'tailor': // Needle stitch cloth
        if (f === 0 || f === 4) { pose.armRight.y = 22; pose.armLeft.y = 28; }
        else if (f === 1 || f === 5) {
          pose.armRight.y = 26; pose.armLeft.y = 28;
          pose.fx.push({ type: 'stitch', x: 19, y: 29, count: 2, color: '#e2e8f0' });
        }
        else if (f === 2 || f === 6) { pose.armRight.y = 20; pose.armLeft.y = 27; }
        else { pose.armRight.y = 24; pose.armLeft.y = 28; }
        break;

      case 'chef': // Stir cauldron & taste spoon
        if (f === 0 || f === 1 || f === 2) {
          pose.armRight.y = 26 + (f % 2); pose.armLeft.y = 27;
          pose.fx.push({ type: 'steam', x: 21, y: 23, count: 3, color: '#e2e8f0' });
        } else if (f === 3 || f === 4) {
          pose.armRight.y = 20; pose.headBobY = 1; // Taste
        } else {
          pose.armRight.y = 25; pose.armLeft.y = 26;
          pose.fx.push({ type: 'steam', x: 21, y: 22, count: 4, color: '#f1f5f9' });
        }
        break;

      case 'potter': // Shape spinning clay vase
        pose.torsoTiltX = 1;
        if (f % 2 === 0) {
          pose.armLeft.y = 30; pose.armRight.y = 30;
          pose.fx.push({ type: 'clay_slip', x: 16, y: 36, count: 3, color: '#ca8a04' });
        } else {
          pose.armLeft.y = 29; pose.armRight.y = 29;
        }
        break;

      case 'innkeeper': // Pour foaming tankard
        if (f === 0) { pose.armRight.y = 25; pose.armLeft.y = 28; }
        else if (f === 1 || f === 2) {
          pose.armRight.y = 22; pose.armLeft.y = 28; // Tap
          pose.fx.push({ type: 'ale_stream', x: 21, y: 25, count: 4, color: '#eab308' });
        }
        else if (f === 3 || f === 4) {
          pose.armLeft.y = 26;
          pose.fx.push({ type: 'foam', x: 21, y: 28, count: 3, color: '#ffffff' });
        }
        else { pose.armRight.y = 26; pose.armLeft.y = 24; } // Raise mug
        break;

      case 'mason': // Tap stone chisel
        if (f === 0 || f === 3) { pose.armRight.y = 19; pose.armLeft.y = 28; }
        else if (f === 1 || f === 4) {
          pose.armRight.y = 27; pose.armLeft.y = 28;
          pose.fx.push({ type: 'stone_dust', x: 20, y: 35, count: 5, color: '#cbd5e1' });
        }
        else { pose.armRight.y = 23; pose.armLeft.y = 28; }
        break;

      case 'shepherd': // Whistle and wave crook
        if (f === 0 || f === 1) {
          pose.armLeft.y = 21; pose.armRight.y = 26; // Whistle
          pose.fx.push({ type: 'notes', x: 14, y: 18, count: 2, color: '#93c5fd' });
        } else if (f === 2 || f === 3) {
          pose.armRight.y = 19; pose.armRight.up = true; // Wave crook
        } else {
          pose.armLeft.y = 25; pose.armRight.y = 25;
        }
        break;

      case 'sailor': // Row wooden oar
        if (f === 0 || f === 1) {
          pose.comBobY = 1; pose.torsoTiltX = 2;
          pose.armLeft.y = 28; pose.armRight.y = 28;
          pose.fx.push({ type: 'splash', x: 24, y: 40, count: 4, color: '#38bdf8' });
        } else if (f === 2 || f === 3) {
          pose.comBobY = 0; pose.torsoTiltX = -1;
          pose.armLeft.y = 22; pose.armRight.y = 22;
        } else {
          pose.comBobY = 0; pose.armLeft.y = 25; pose.armRight.y = 25;
        }
        break;

      case 'apprentice': // Pump forge bellows
        if (f === 0 || f === 1) {
          pose.armLeft.y = 20; pose.armRight.y = 20; pose.comBobY = -1;
        } else if (f === 2 || f === 3) {
          pose.armLeft.y = 29; pose.armRight.y = 29; pose.comBobY = 1;
          pose.fx.push({ type: 'ember_burst', x: 23, y: 33, count: 6, color: '#f97316' });
        } else {
          pose.armLeft.y = 24; pose.armRight.y = 24; pose.comBobY = 0;
        }
        break;

      case 'gardener': // Water plants with can
        if (f === 0) { pose.armRight.y = 24; }
        else if (f === 1 || f === 2 || f === 3) {
          pose.armRight.y = 21; // Tilt can
          pose.fx.push({ type: 'water_drops', x: 25, y: 29, count: 5, color: '#60a5fa' });
        }
        else if (f === 4 || f === 5) {
          pose.armRight.y = 24;
          pose.fx.push({ type: 'blossom', x: 23, y: 40, count: 2, color: '#f472b6' });
        }
        else { pose.armRight.y = 26; }
        break;

      case 'bard': // Strum lute with music notes
        if (f % 2 === 0) {
          pose.armRight.y = 25; pose.armLeft.y = 23;
          pose.fx.push({ type: 'notes', x: 23, y: 19, count: 2, color: '#f59e0b' });
        } else {
          pose.armRight.y = 27; pose.armLeft.y = 22;
          pose.fx.push({ type: 'notes', x: 24, y: 16, count: 2, color: '#ec4899' });
        }
        break;

      case 'fletcher': // Carve and sight arrow
        if (f === 0 || f === 1) { pose.armRight.y = 26; pose.armLeft.y = 25; }
        else if (f === 2 || f === 3) {
          pose.armRight.y = 20; pose.armLeft.y = 21; pose.headBobY = 1; // Sight down
          pose.fx.push({ type: 'glint', x: 25, y: 20, count: 1, color: '#ffffff' });
        }
        else { pose.armRight.y = 25; pose.armLeft.y = 26; }
        break;

      case 'tanner': // Scrape stretched hide
        pose.torsoTiltX = 1;
        if (f % 2 === 0) {
          pose.armLeft.y = 27; pose.armRight.y = 27; pose.comBobY = 0;
        } else {
          pose.armLeft.y = 31; pose.armRight.y = 31; pose.comBobY = 1;
          pose.fx.push({ type: 'shavings', x: 20, y: 37, count: 4, color: '#e5e7eb' });
        }
        break;

      case 'scout': // Scan with spyglass
        if (f === 0) { pose.armRight.y = 26; }
        else if (f === 1 || f === 2 || f === 3 || f === 4) {
          pose.armRight.y = 19; pose.armRight.up = true; // Spyglass to eye
          pose.headBobX = (f % 2 === 0 ? -1 : 1);
          if (f === 2) pose.fx.push({ type: 'glint', x: 25, y: 17, count: 2, color: '#38bdf8' });
        }
        else { pose.armRight.y = 25; }
        break;

      case 'apothecary': // Mortar & pestle grind
        if (f % 2 === 0) {
          pose.armLeft.y = 27; pose.armRight.y = 24;
          pose.fx.push({ type: 'herb_dust', x: 18, y: 29, count: 3, color: '#4ade80' });
        } else {
          pose.armLeft.y = 27; pose.armRight.y = 26;
        }
        break;

      case 'scribe': // Dip quill and write scroll
        if (f === 0 || f === 1) { pose.armRight.y = 27; pose.armLeft.y = 26; } // Dip ink
        else if (f === 2 || f === 3 || f === 4) {
          pose.armRight.y = 23; pose.armLeft.y = 25; // Write
          pose.fx.push({ type: 'script_spark', x: 19, y: 27, count: 2, color: '#1e293b' });
        }
        else { pose.armRight.y = 21; pose.headBobY = -1; } // Flourish
        break;

      case 'master_smith': // Quench blade with steam
        if (f === 0 || f === 1) { pose.armRight.y = 20; pose.armLeft.y = 22; }
        else if (f === 2 || f === 3 || f === 4) {
          pose.armRight.y = 29; pose.armLeft.y = 26; // Submerge
          pose.fx.push({ type: 'hiss_steam', x: 23, y: 24, count: 7, color: '#f1f5f9' });
          pose.fx.push({ type: 'bubbles', x: 23, y: 35, count: 4, color: '#60a5fa' });
        }
        else {
          pose.armRight.y = 22; pose.armLeft.y = 24; // Lift tempered steel
          pose.fx.push({ type: 'glint', x: 23, y: 21, count: 3, color: '#93c5fd' });
        }
        break;

      case 'rancher': // Twirl lasso
        if (f === 0 || f === 4) { pose.armRight.y = 16; pose.armRight.up = true; }
        else if (f === 1 || f === 5) { pose.armRight.y = 15; pose.armRight.up = true; }
        else if (f === 2 || f === 6) { pose.armRight.y = 17; pose.armRight.up = true; }
        else { pose.armRight.y = 16; pose.armRight.up = true; }
        pose.fx.push({ type: 'lasso_loop', x: 22, y: 13, frame: f });
        break;

      case 'village_elder': // Bless with staff & sacred aura
        if (f === 0 || f === 1) { pose.armRight.y = 24; pose.armLeft.y = 24; }
        else if (f === 2 || f === 3 || f === 4) {
          pose.armRight.y = 15; pose.armRight.up = true; // Raise staff
          pose.fx.push({ type: 'holy_aura', x: 24, y: 13, count: 6, color: '#fbbf24' });
          pose.fx.push({ type: 'amber_glow', x: 24, y: 14, count: 4, color: '#f59e0b' });
        }
        else {
          pose.armRight.y = 23; pose.armLeft.y = 24;
          pose.fx.push({ type: 'ground_ripple', x: 16, y: 44, count: 5, color: '#fde68a' });
        }
        break;

      default:
        // Generic work
        pose.armRight.y = (f % 2 === 0 ? 20 : 28);
        break;
    }

    return pose;
  }
}

if (typeof window !== 'undefined') {
  window.ProfessionAnimationSystem = ProfessionAnimationSystem;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProfessionAnimationSystem };
}
