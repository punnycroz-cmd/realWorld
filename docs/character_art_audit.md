# Natura Character Art System Audit (Phase 0)

**Date**: 2026-09-11  
**Target System**: Natura Living Valley Simulation (`natura-v9.html` -> `natura-v10.html`)  
**Reference System**: Willowbrook Pixel-Art Pipeline (`willowbrook/dev/`)

---

## 1. Natura Current State

### 1.1 Rendering Pipeline
In `natura-v9.html` (lines 1207–1394), Natura's rendering pipeline operates on a single HTML5 2D canvas (`#cv`):
- **World & Camera Units**: The simulation uses a discrete cell grid where `CS = 16` (16 world pixels per cell). The camera (`cam`) tracks world position `(cam.x, cam.y)` with zoom factor `cam.zoom` ranging from `0.35` to `4.0` (default: `1.0`).
- **World to Screen Mapping**: Screen coordinates are calculated via `w2s(wx, wy) = { x: (wx - cam.x) * cam.zoom + width/2, y: (wy - cam.y) * cam.zoom + height/2 }`.
- **Character Drawing (`drawSoul`)**:
  Character drawing is implemented as a placeholder vector routine:
  ```javascript
  const drawSoul = (x, y, colors, scale, label, sub) => {
    const p = w2s(x, y), u = cam.zoom * scale, cxp = p.x, cyp = p.y;
    if (cxp < -30 || cyp < -30 || cxp > cw + 30 || cyp > chh + 30) return;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(cxp, cyp + 6 * u, 7 * u, 2.6 * u, 0, 0, 7); ctx.fill(); // ground shadow
    ctx.fillStyle = colors.dress;
    ctx.fillRect(cxp - 4 * u, cyp - 4 * u, 8 * u, 10 * u); // torso rectangle
    ctx.fillStyle = colors.skin;
    ctx.beginPath(); ctx.arc(cxp, cyp - 8 * u, 4.4 * u, 0, 7); ctx.fill(); // head circle
    ctx.fillStyle = colors.hair;
    ctx.beginPath(); ctx.arc(cxp, cyp - 9 * u, 4.4 * u, Math.PI, 0); ctx.fill(); // hair semicircle
    if (colors.hat) {
      ctx.fillStyle = colors.hat;
      ctx.beginPath(); ctx.ellipse(cxp, cyp - 9 * u, 7 * u, 2.6 * u, 0, 0, 7); ctx.fill();
    }
    // labels and status characters ('z', '+', '•')
  };
  ```

### 1.2 Simulation Character Schema
Each villager `v` in Natura is a rich biological and social agent:
- **Identity & Demographics**: `id`, `name`, `sex` ('M'/'F'), `age` (float years), `partner`, `childIds`, `colors: { dress, skin, hat, hair }`.
- **Spatial State**: `x`, `y` (world coordinates), `speed() = 70 * (age < 14 ? 0.55 : 1)`.
- **Metabolism & Living Body (`v.body`)**:
  - `hydration`: `0..1` (water reserve)
  - `satiety`: `0..1` (calorie / energy balance)
  - `fatigue`: `0..1` (tiredness)
  - `sleepDebt`: `0..18` (hours of missed restorative sleep)
  - `coreTemp`: `~35.0..39.0` °C (physiological thermal equilibrium)
  - `pain`, `illness`, `injury`, `stress`, `tissue` (physical trauma and disease)
- **Living Environment Awareness (`bodyEnv(v)`)**:
  Reads ambient `temp`, `rain`, `storm`, `wet` ground, shelter in `hut`, campfire warmth `fireWarm`.
- **Actions & Intentions**:
  `job` object (`kind`: 'goto', 'take', 'haul', 'fell', 'saw', 'craft', 'till', 'plant', 'harvest', 'drink', 'eat', 'sleep', 'rest', etc.), `carry` array (up to `carryMax` items), `act`, `actLabel`, `thought`.
- **Reproduction**:
  `pregnant` counter (0..270 days).

### 1.3 Disconnect Between Simulation and Art
Despite having one of the most sophisticated bodily simulations in indie gaming, **none** of this richness appears visually:
- An exhausted villager (`fatigue > 0.9`) looks identical to a fresh one.
- A drenched villager caught in rain has identical clothes and dry hair.
- A freezing villager (`coreTemp < 35.5`) shows no shivering or hunching.
- A severely injured worker (`injury > 0.7`) moves with the same stiff rectangular sprite.
- Tools (axes, saws, hoes, fishing rods, mugs) and carried logs/timber are completely invisible on the villager.

---

## 2. Willowbrook Current State

Willowbrook (`willowbrook/dev/`) represents an earlier modular procedural pixel-art attempt.

### 2.1 Component Structure
- `pa-core.js`: Pixel canvas primitives (`paMk`, `paR`, `paPX`, `paBlob`, `paEllipse`, `paLine`, `paOutline`), deterministic PRNG (`phash`), and 7-tone material ramp generators (`rampOf`, `MAT`).
- `pa-chars.js`: 8 hardcoded villagers (Marta, Bram, Sella, Tobin, Wren, Finn, Alden, Pip) authored at a low logical resolution (24×32), given a post-processed black outline (`paOutline`), and upscaled 2× into a 48×64 frame.
- `pa-veg.js`: Bottom-center anchored vegetation with dithered ground shadows.
- `pa-props.js`: Furniture, workbenches, lighting props.
- `pa-buildings.js`: Layered building structures with roofs, windows, and smoke chimneys.
- `pa-fx.js`: Talk bubbles, particles, weather effects.
- `pa-integrate.js`: Prerendering lifecycle and draw-hook replacements.

---

## 3. Detailed Comparison: Strengths, Weaknesses, and Deficiencies

| Feature / Dimension | Willowbrook Approach | Natura Target Requirement | Assessment & Decision |
| :--- | :--- | :--- | :--- |
| **Resolution & Scale** | 24×32 logical canvas scaled 2× to 48×64. Result: very blocky 2px pixels. | Native 28×38 to 32×48 logical canvas rendered crisp at 1× art px = 1 display px (scaled cleanly by camera zoom). | **Redesign**: Higher pixel density allows proper facial features, hands, and textile folds without giant clumsy pixels. |
| **Proportions & Anatomy** | Chibi / storybook: head is ~45% of total height (1:2 ratio), 2px thick rectangular stick legs, 2×2 square hands. | Balanced expressive proportion: head:body ~1:5, articulated joints, knees, elbows, distinct feet and hands. | **Reject Willowbrook chibi anatomy**: Natura is a realistic causal valley, not a cartoon. Build grounded anatomy. |
| **Facial Features** | 1×2 black dot eyes, 1×1 pink blush, 2×1 mouth. No iris, no sclera, no nose, no brows, no expressions. | 3×2 eyes with sclera, colored iris, specular highlight; brows; nose bridge; expressive mouth; age wrinkles. | **Redesign**: Create rich parametric face grammar with emotions and gaze direction. |
| **Outlines** | Indiscriminate post-process black outline (`paOutline` with `#14100c`) applied uniformly around everything. | Selective colored outlines: outline hues adapt to adjacent material (e.g. deep maroon on red cloth, dark ochre on skin). | **Reject pure black outline**: Selective outline preserves depth and avoids cheap cartoon sticker aesthetic. |
| **Materials & Shading** | 2-tone flat shading inside 7-tone definition (mostly base color + shadow strip). | Full 4-to-6 tone volumetric shading across material ramps with directional key lighting and ambient fill. | **Redesign**: Introduce true volumetric clustering and fold depth. |
| **Clothing & Folds** | Flat rectangular blocks with straight horizontal boundaries. | Natural textile drapery: tension folds, gathering at belts, knee bends, elbow creases, hem flares. | **Redesign**: Implement procedural cloth fold primitives. |
| **Character Construction** | Hardcoded imperative functions for 8 specific people (`martaHead`, `bramHead`, etc.). Cannot generalize. | Parametric `CharacterDNA` compiler: any character generated from seed, age, sex, role, genes. | **Redesign**: True generative procedural compiler replacing rigid hardcoded scripts. |
| **Simulation State Coupling**| Completely decoupled: only reads basic `state: walk/sit/sleep/work`. Zero biological state reflection. | Living `CharacterVisualState` adapter converting `v.body`, weather, and tools into visual conditions. | **Core Innovation**: Natura's living body drives posture, shivering, sweat, pallor, wetness, and mud. |
| **Animation Quality** | 4-frame walk with 1px vertical bob; legs alternate 1px height (`l1=24; l2=25`); rigid arm pendulum. | 6-frame kinematic walk cycle (contact, down/recoil, passing, up/high-point) with torso tilt and hair lag. | **Redesign**: Implement believable weight shift and secondary motion. |

---

## 4. What to Reuse Conceptually

1. **Modular Construction**: Anchoring head, torso, limbs, and accessories at discrete anatomical sockets (neck, shoulder, waist, hip, wrist, ankle).
2. **Deterministic Color Ramps**: Systematic hue-shifting in ramps (cool desaturated shadows, warm luminous highlights).
3. **Lighting Consistency**: Fixed upper-left key light (`~-45°` elevation) with soft ambient sky fill to unify all assets.
4. **Separation of Concerns**: Rendering logic reads state but never writes or mutates game logic.
5. **Sprite Caching Lifecycle**: Prerendering and caching composited frames by stable state keys rather than generating pixels every frame.

---

## 5. What to Redesign

1. **Character Proportions**: Shift from Willowbrook's 1:2 chibi caricature to an elegant 1:5 ratio that fits Natura's contemplative survival tone.
2. **Generative DNA System**: Replace per-character imperative functions with a declarative, composable `CharacterDNA` DSL.
3. **Facial Rendering Architecture**: Build an expressive feature renderer capable of rendering distinct eyes, brows, nose bridge, mouth expressions, and age markers.
4. **Textile and Garment Mechanics**: Build procedural fold, seam, and drape algorithms.
5. **Animation Engine**: Build pose-driven parametric kinematics supporting walk cycles, fatigue drags, asymmetric limps, and purposeful work swings.
6. **Dynamic Simulation State Overlays**: Build procedural condition layers for wetness, mud, hypothermia shivering, illness pallor, and bandages.

---

## 6. What to Reject

1. **Reject Hard Uniform Black Outlines**: Flat black silhouettes destroy subtle lighting and look cheap.
2. **Reject 1×2 Dot Eyes**: Too cartoonish and incapable of showing gaze, fatigue, or emotion.
3. **Reject Hardcoded Villagers**: The system must support arbitrary villagers, travelers, children, and generational descendants procedurally.
4. **Reject 2-Frame Stiff Animations**: Walking must convey physical weight, momentum, and physical condition.

---

## 7. Proposed Architecture

```text
               +----------------------------------------------------+
               |              Natura Living Simulation              |
               | (v.body, v.job, v.carry, v.pregnant, weather, etc.)|
               +-------------------------+--------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |            CharacterVisualState Adapter            |
               | (Derives posture, expression, wetness, mud, tools) |
               +-------------------------+--------------------------+
                                         |
                                         v
+------------------------+     +------------------------+     +------------------------+
|      CharacterDNA      | --> |   CharacterGenerator   | <-- |   Animation System     |
| (Genetics, proportions,|     |  (Composes primitives  |     |  (Kinematic poses,     |
|  hair, clothes, ramps) |     |   into pixel art)      |     |   walk cycles, timing) |
+------------------------+     +-----------+------------+     +------------------------+
                                           |
                                           v
                               +------------------------+
                               |     Composite Cache    |
                               | (Keys: dna_pose_cond)  |
                               +-----------+------------+
                                           |
                                           v
                               +------------------------+
                               |     HTML5 Canvas       |
                               | (Smooth blit into world|
                               +------------------------+
```

---

## 8. Quality Targets & Measurable Metrics

1. **Silhouette Clarity**: Distinct outlines recognizable at 1× zoom across all body types and garment styles.
2. **Facial Expressiveness**: Readably distinguishes neutral, tired, cold, sick, talking, and sleeping states.
3. **Color & Shading Harmony**: 7-tone ramps with mathematically coherent hue-shifting, eliminating flat monochrome fills.
4. **Pixel Discipline**: Zero orphaned noise pixels; clean pixel clustering with selective edge darkening.
5. **Dynamic Responsiveness**: Villagers caught in rain show darkened wet cloth and glistening hair; injured villagers show bandages; exhausted villagers slump.
6. **Animation Fluidity**: 6-frame walk cycle with proper weight transfer, foot contact, and head lag.
7. **Runtime Performance**: Cache hit rate > 98% in active simulation; frame blitting overhead < 0.3ms for 50 villagers.

---

## 9. Risk List & Mitigation Strategies

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Over-complicating generator produces noisy or malformed art** | High | Ground all generation in rigid visual grammar rules; validate pixel clustering through automated critic scoring. |
| **Dynamic conditions cause combinatorial explosion in cache** | Medium | Discretize continuous simulation stats into quantized visual states (e.g. 3 levels of wetness, 3 levels of fatigue). |
| **Higher resolution characters clash with existing terrain tiles** | Medium | Calibrate sprite footprint to exactly match Natura's `CS=16` grid (ground anchor fits standard 1-cell base). |
| **Breaking Natura simulation or AI minds** | Critical | Strict read-only adapter pattern: the art system never writes back to simulation or minds data structures. |
