# Implementation Plan: Generate 100 LPC Standard Characters & Train/Refine Procedural Code Generator

The user requested:
1. Generate 100 diverse characters and full animation sets (all kinds of animations: Spellcast, Thrust, Walk, Slash, Shoot, Hurt/Collapse) based on the LPC standard.
2. Use the generated 100 characters and their pixel data to "learn" (extract statistical pixel matrices, silhouettes, joint anchor kinematics, dithering color rules, and anatomical ratios).
3. Upgrade and refine our codebase's procedural generator (`character_generator.js` and `character_dna.js`) so our code procedural engine can independently produce the same level of high detail, rich textures, and fluid motion.

## User Review Required
- The 100 character batch is organized into 10 world archetype factions:
  1. Foresters & Woodsmen (Villagers, Hunters, Herbalists, Carpenters)
  2. Mining Guild & Deepdelvers (Miners, Smelters, Geologists, Excavators)
  3. Royal City Artisans & Merchants (Tailors, Jewelers, Bankers, Chefs)
  4. Royal Citadel & Town Guard (Foot Soldiers, Knights, Crossbowmen, Sergeants)
  5. Port & Maritime Fleet (Sailors, Shipwrights, Fishers, Navigators)
  6. High Arcana Academy & Scholars (Mages, Alchemists, Librarians, Enchanters)
  7. High Plateau Monks & Nomads (Monks, Pilgrims, Hermits, Shepherds)
  8. Underworld & Night Thieves (Rogues, Smugglers, Cutpurses, Spies)
  9. Tavern & Entertainment Troupe (Bards, Dancers, Jugglers, Innkeepers)
  10. Civic Magistrates & Nobility (Mayors, Clerks, Judges, Nobles)

## Proposed Changes

### LPC 100 Character & Full Animation Suite
#### [NEW] [generate_100_lpc.js](file:///Users/sema/Downloads/realWorld-main/art/lpc_100/generate_100_lpc.js)
- Batch generator compiling 100 unique, deterministic characters with full animation sets:
  - Row 0-3: Spellcast (4 directions, 7 frames each)
  - Row 4-7: Thrust / Spear attack (4 directions, 8 frames each)
  - Row 8-11: Walk cycle (4 directions, 9 frames each)
  - Row 12-15: Slash / Weapon swing (4 directions, 6 frames each)
  - Row 16-19: Shoot / Bow attack (4 directions, 13 frames each)
  - Row 20: Hurt / Collapse (6 frames)
- Generates master 832x1344 full spritesheets + individual frame bundles + metadata JSONs.

### Knowledge Extraction & Learning System
#### [NEW] [extract_lpc_knowledge.js](file:///Users/sema/Downloads/realWorld-main/art/lpc_100/extract_lpc_knowledge.js)
- Analyzes all 100 characters frame-by-frame:
  - **Silhouette Density & Volume Profiling:** Head/torso/limb distribution per animation phase.
  - **Color Palette Ramps & Dither Probability:** Extract luminosity gradients, Bayer probability matrices, and ambient occlusion rules.
  - **Joint Kinematics & Foot Peg Anchors:** Extract sub-pixel trajectories of center of mass (COM), foot contact points, elbow/wrist pivots across all animations.
- Outputs `art/lpc_100/knowledge/lpc_learned_matrices.json`.

### Engine Upgrade & Training Integration
#### [NEW] [lpc_trained_procedural_generator.js](file:///Users/sema/Downloads/realWorld-main/art/lpc_100/lpc_trained_procedural_generator.js)
- Implements the learned knowledge model into our procedural canvas engine:
  - Replaces rudimentary rectangular blocks with learned anatomical polygon profiles.
  - Injects the statistical Bayer dithering and ambient occlusion shading extracted from the 100 LPC characters.
  - Supports 100% code-driven generation of high-detail 64x64 characters matching LPC visual quality without image dependencies.

### Showcase & Interactive Comparative Viewer
#### [NEW] [viewer/index.html](file:///Users/sema/Downloads/realWorld-main/art/lpc_100/viewer/index.html)
- Interactive web portal showcasing:
  - 100 Character Gallery with search, role filters, and full animation controls (Spellcast, Thrust, Walk, Slash, Shoot, Hurt).
  - Side-by-side comparison: LPC Ground Truth vs. Procedural Learned Output.
  - Inspection mode for statistical joint tracking and dithering heatmaps.

## Verification Plan
### Automated Tests
- Run `node art/lpc_100/generate_100_lpc.js` and verify all 100 characters generate valid 832x1344 master sheets, frames, and JSONs.
- Run `node art/lpc_100/extract_lpc_knowledge.js` and verify matrix generation.
- Run `node art/lpc_100/test_trained_procedural.js` to ensure the upgraded procedural generator runs with 0 errors.

### Manual Verification
- Open `http://localhost:8080/art/lpc_100/viewer/index.html` in browser and test animation playback, character filtering, and learned model quality.
