# Natura Character Art System Reference Manual (Phase 13)

**Engine Version**: Natura v10 Living Character Art Compiler  
**System Scope**: Production Procedural Pixel-Art Generation, Animation, and Living Simulation Adaptation

---

## 1. Architecture Overview

Natura's character art system operates as a pure, deterministic compiler and consumer. The biological and causal simulation remains 100% authoritative; the art engine translates simulation state into living visual form without ever mutating simulation truth.

```text
+-------------------------------------------------------------------------+
|                        Natura Authoritative Simulation                  |
|  - Metabolism: v.body (fatigue, coreTemp, pain, illness, injury, etc.)  |
|  - World & Climate: bodyEnv(v) (rain, storm, groundWet, fireWarm, etc.)  |
|  - Action & Intent: v.act, v.job (goto, fell, saw, craft, till, rest)    |
|  - Inventory & Equipment: v.carry, v.inv, pregnant                      |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      CharacterVisualState Adapter                       |
|  - Discretizes continuous body stats into quantized visual conditions   |
|  - Maps jobs & movement velocity into facing directions & action clips  |
|  - Derives compound cache key: f{fatigue}_c{cold}_w{wet}_d{dirt}...     |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                 CharacterDNA Intermediate Representation                |
|  - Deterministic genetic & stylistic profile derived from villager seed |
|  - Proportions, face features, coiffure, garment layers, 7-tone ramps   |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                  AnimationSystem & CharacterGenerator                   |
|  - 6-frame kinematic walk cycle, COM oscillation, weight & momentum     |
|  - Procedural layers: shadow -> legs/boots -> torso -> arms -> head     |
|  - Selective material-aware colored outlining (zero pitch-black rings)   |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                     High-Performance Frame Cache                        |
|  - In-memory Map storing pre-rendered HTML5 canvases                    |
|  - Hit rate > 96%; sub-microsecond blitting (7.8 µs per villager)       |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         HTML5 World Canvas (#cv)                        |
|  - Blits 32x48 native sprites anchored at bottom-center (16, 42)        |
+-------------------------------------------------------------------------+
```

---

## 2. CharacterDNA Specification

`CharacterDNA` is the declarative intermediate representation for all characters. It contains zero raw pixel data; instead, it defines proportions, anatomical scaling, facial attributes, color ramps, and garment layers.

```javascript
{
  id: "dna_1_tomas",
  name: "Tomas",
  seed: 10007,
  ageYears: 35,
  genderPresentation: "masculine",
  role: "simple_worker",
  anatomy: {
    archetype: "broad_heavy",
    heightScale: 1.0,
    widthScale: 1.15,
    shoulderWidth: 12
  },
  face: {
    shape: "broad",
    skinRampKey: "tan",
    eyeColor: "#2b3d4f",
    facialHair: "full_beard",
    blushIntensity: 0.2
  },
  hair: {
    style: "short",
    colorRampKey: "brown"
  },
  clothing: {
    archetype: "simple_worker",
    layers: { trousersOrSkirt: "trousers" }
  },
  palette: {
    shirt: "#4a6a3a",
    pants: "#25395c",
    boots: "#422810"
  },
  heldTool: "felling_axe",
  condition: {}
}
```

### Deterministic Generation
`CharacterDNA.fromVillager(v)` deterministically creates identical DNA from a villager's `id`, `name`, `sex`, `age`, and existing `colors` table. Travelers or children born in the valley receive permanent visual consistency across all sessions.

---

## 3. Rendering Pipeline & Primitives

Every character frame is authored on a **32×48 logical canvas**:
- **Anchor**: Bottom-center `(16, 43)` corresponds to ground foot contact.
- **Layering Order**:
  1. Ground Contact Shadow (soft dithered ellipse `y = 45`)
  2. Back Hair & Mantle (if facing back or wearing long hair)
  3. Legs / Trousers / Skirt (flared drapery with hem light)
  4. Boots (cuffed leather with toe highlight and sole depth)
  5. Torso / Shirt (trapezius shoulder slope, collar notch showing undershirt)
  6. Belt & Buckle (brass highlight at center)
  7. Vest / Apron / Outerwear
  8. Arms & Hands (anchored at shoulder sockets, gripping or open palms)
  9. Neck & Head Mass (4×4 volumetric cluster with upper-left key light)
  10. Face Features (eyes with sclera + iris + specular sparkle, brows, nose bridge, mouth)
  11. Beard / Mustache
  12. Front Coiffure (crown cap, fringe wisps, locks)
  13. Headwear (brim, crown, hat band)
  14. Tools / Carried Timber (haft connected directly to active hand)
  15. Condition Overlays (water glaze, clay mud spatter, linen bandage)
  16. **Selective Outline Post-Process**: Darkens outer silhouette using the material's own shaded hue (e.g. deep maroon on red tunic, dark ochre on skin), completely avoiding cartoonish flat black outlines.

---

## 4. Animation System

The animation system computes skeletal kinematics rather than using disconnected sprites:

| Action | Frame Count | Tempo | Kinematic Keyframes & Motion |
| :--- | :--- | :--- | :--- |
| **Walk** | 6 | 120 ms | 6-frame cycle: Contact L -> Recoil L (COM drops -1px, head lags) -> Passing L (COM rises +1px) -> Contact R -> Recoil R -> Passing R. Profile walk includes true lateral stride offsets and arm counter-swings. |
| **Idle** | 4 | 240 ms | Gentle respiratory cycle with chest expansion, 1px head settling, and natural blinking on frame 2. |
| **Work** | 4 | 150 ms | High windup -> acceleration -> contact strike (1px ground impact compression) -> recovery settle. |
| **Talk** | 4 | 140 ms | Expressive mouth opening cycle with hand emphasis gesture on frame 1. |
| **Sit** | 2 | 400 ms | Folded horizontal legs, relaxed spinal drop (-6px), hands on knees. |
| **Sleep** | 2 | 600 ms | Prone horizontal alignment, head on feathered pillow, woven blanket with cyclic breathing displacement. |
| **Drink** | 4 | 200 ms | Crouched position by water edge, hands dipping to surface, head tilted down. |

---

## 5. Simulation State Adaptation

`CharacterVisualState.adapt(v, env)` maps living bodily numbers to visual features without exposing raw simulation stats:
- **Fatigue (`v.body.fatigue > 0.65`)**: Torso tilts +1px forward, eyelids drop to 1px slit with under-eye shadow, walk speed drops 20%.
- **Cold (`v.body.coreTemp < 35.8`)**: Arms tuck over chest, shoulders hike 1px, lateral shivering jitter on alternate frames.
- **Fever (`v.body.coreTemp > 38.0`)**: Cheek blush intensifies to red flush (`#e87474`), forehead gains specular sweat sparkle.
- **Injury (`v.body.injury > 0.25`)**: Visible clean linen bandage wrap on forearm/leg with subtle bloodstain core.
- **Wetness (`env.rain > 0.15 || env.groundWet`)**: Textile colors darkened by 25% (water saturation), specular water droplets glint on shoulders.
- **Mud (`working in tilled soil`)**: Clay brown spatters cover boots and hem.
- **Pregnancy (`v.pregnant > 60`)**: Profile swell expands 2–4px forward; apron folds adjust over curve.
- **Carrying (`v.carry.length > 0`)**: Carried logs or items rendered in arms with backward counter-lean.

---

## 6. Extension Workflows

### How to Create a New Character
To create a new custom character or traveler:
```javascript
const myVillager = {
  id: 101,
  name: "Gillian",
  sex: "F",
  age: 26,
  colors: { dress: "#bf4f58", skin: "#dda078", hair: "#c7923e" }
};
const dna = CharacterDNA.fromVillager(myVillager);
```

### How to Add a New Clothing Set
1. Define the archetype in `art/character_grammar.json` (e.g. `"blacksmith_apron"`).
2. Add the garment layer branches in `CharacterGenerator.renderFrame()`:
   ```javascript
   if (dna.clothing.archetype === 'blacksmith_apron') {
     c.fillRect(16 - halfShW + 1, torsoY + 2, torsoW - 2, hipY - torsoY + 4, '#5c3a21', 3);
   }
   ```
3. Update `CharacterDNA.fromVillager()` to assign the set to appropriate vocations.

### How to Add an Animation Clip
1. Define kinematic transforms in `AnimationSystem.getPose()`:
   ```javascript
   else if (act === 'fish') {
     pose.tool.active = true;
     pose.armRight.y = 20 + (frame % 2);
   }
   ```
2. Set the frame cycle count in `CharacterGenerator.renderSheet()` and `CharacterCache.getFrame()`.

### How to Add a New Visual Condition
1. Add threshold logic in `CharacterVisualState.adapt()` to populate a quantized flag in `conditionKey`.
2. Implement the pixel overlay in `VP.applyConditionEffects(c, condition)`.
