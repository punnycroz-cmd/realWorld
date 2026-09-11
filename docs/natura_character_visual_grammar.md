# Natura Character Visual Grammar (Phase 2)

**Version**: 1.0.0  
**Authority**: Master artistic specification for all procedural and generative character art in Natura.  
**Canvas Standard**: 32×48 Native Logical Pixel Grid (Footprint: 16×32 world bounding box anchored at bottom-center `(16, 46)`).

---

## 1. Anatomy & Proportions

Unlike Willowbrook's 1:2 chibi proportions (huge cartoon heads on stubby 2px limbs), Natura characters employ an expressive, grounded semi-realistic proportion scheme suitable for a causal living valley:

```text
    y=0  +------------------------------+
         |                              |  [Buffer/Hat Crown]
    y=8  |        .---""""---.          |  [Head Top]
         |       /   HEAD     \         |  Head Height: 8-9 px (Adult)
    y=17 |      |  (x:11..21)  |        |  Chin / Jaw: y=16..17
         |       \____    ____/         |  Neck: 3px wide, y=17..18
    y=19 |      /=====|==|=====\        |  Shoulders: 10-12 px wide (y=19)
         |     |     TORSO      |       |  Torso Height: 9-10 px (y=19..28)
    y=28 |     |___(x:10..22)___|       |  Waist/Hips: 8-11 px wide (y=28)
         |        ||        ||          |  Legs: 3-4 px wide per leg
    y=38 |        ||  LEGS  ||          |  Knee Articulation: y=34
         |        ||        ||          |  Ankles: y=41..42
    y=46 |      [BOOT]    [BOOT]        |  Boots: 5px wide, 4px tall (y=42..46)
    y=48 +------------------------------+
```

### 1.1 Proportions by Life Stage

| Life Stage | Age Range | Total Height | Head Height | Head:Body Ratio | Shoulder Width | Torso:Leg Ratio | Limb Thickness |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Child** | 2–6 yrs | 18–22 px | 6–7 px | **1:3.0 – 1:3.3** | 6–7 px | 1:1.00 | 2 px (soft rounded) |
| **Youth / Teen** | 7–15 yrs | 25–29 px | 7 px | **1:3.8 – 1:4.2** | 8–9 px | 1:1.15 | 2–3 px (lean) |
| **Adult (Female)**| 16–55 yrs | 32–34 px | 8 px | **1:4.8 – 1:5.0** | 10 px | 1:1.20 | 3 px (arms 2px, legs 3px) |
| **Adult (Male)** | 16–55 yrs | 34–36 px | 8–9 px | **1:5.0 – 1:5.2** | 11–13 px | 1:1.22 | 3–4 px (arms 3px, legs 3-4px)|
| **Elder** | 56+ yrs | 30–33 px | 8 px | **1:4.5 – 1:4.8** | 9–11 px | 1:1.10 (hunched) | 2–3 px (lean/gnarled) |

### 1.2 Articulation Anchors
All skeletal transformations hinge on precise pixel coordinates relative to the root anchor `(16, 46)`:
- **Root / Ground**: `(16, 46)`
- **Pelvis / Hips**: `(16, 28)`
- **Spine / Mid-Torso**: `(16, 23)`
- **Shoulder Line**: `y = 19`, left socket `x = 11`, right socket `x = 21`
- **Neck Base**: `(16, 18)`
- **Head Pivot**: `(16, 17)`
- **Hip Sockets**: left `(13, 28)`, right `(19, 28)`
- **Knees**: `y = 35`
- **Ankles**: `y = 42`

---

## 2. Facial Grammar

The face occupies an 11×9 pixel area on the front view (`x: 11..21, y: 9..17`):

```text
    y=9   .---------------.  Hairline / Forehead
    y=11  |   ==     ==   |  Eyebrows (2x1 px each, angle reflects mood)
    y=12  |  [O*]   [*O]  |  Eyes: Sclera (1px) + Iris/Pupil (1px) + Specular Spark
    y=14  |       .       |  Nose Bridge: 1px shadow, 1px highlight
    y=15  |    (_____)    |  Mouth: 2-3px wide, shaded lower lip
    y=16  |       -       |  Chin shadow / Jawline
```

### 2.1 Eye Structure (Front View)
- **Normal Eye**: 2px wide × 2px tall per eye.
  - Left Eye: `(12..13, 12..13)`
  - Right Eye: `(18..19, 12..13)`
  - Inter-pupillary distance: 5 pixels (ensures face readability without wall-eyed or cyclopean look).
  - Upper pixel: dark iris tone (`ramp[0]` or `#1e1e24`).
  - Inner corner: white/off-white sclera (`#e8ecf2`).
  - Specular spark: 1px warm white (`#ffffff` or `#fff6d8`) at upper-left of iris reflecting key light.
- **Blink / Sleeping**: 1px horizontal slit with soft downward eyelash shadow.
- **Fatigued / Sick**: Eyelid droops 1px over top pupil; 1px purplish-mauve shadow beneath eye (`#5a4652` at 40% alpha).

### 2.2 Eyebrows
- 2 pixels wide × 1 pixel tall (`y = 11`).
- Neutral: horizontal at `y=11`.
- Tired / Sad: outer edges droop to `y=12`.
- Stern / Focused (working): inner edges angle downward to `y=12`.
- Surprised: raised to `y=10`.

### 2.3 Nose & Mouth
- **Nose**: Not a giant block. A single warm-shadow pixel at `(16, 14)` with an adjacent 1px highlight at `(15, 14)` suggests the nasal ridge naturally without cartoon exaggeration.
- **Mouth**: 2 to 3 pixels wide at `y = 15`. Neutral closed mouth is `skinRamp[1]` (dark natural rose, not black line). Speaking frame opens mouth to 2×2 dark cavity (`#4a1c1c`) with 1px lower lip highlight.

---

## 3. Hair Design & Cluster Grammar

Hair is treated as **sculpted volumetric masses** rather than individual wireframe strands:
1. **Root Occlusion**: Deep shadow (`ramp[0..1]`) along the scalp attachment, neck junction, and behind ears.
2. **Cluster Mass**: Hair is divided into 3–5 distinct physical locks (e.g. Left Fringe, Center Forelock, Right Fringe, Crown Mass, Back Cascade).
3. **Curved Highlights**: A 1px ribbon highlight (`ramp[5..6]`) arcs across the upper-left crest of each lock, following the skull's spherical contour.
4. **Fringe & Temples**: Wisps taper down to 1px tips framing the jawline, breaking the geometric oval of the head.

---

## 4. Clothing & Drapery Grammar

Garments obey physical tension and gravity:
1. **Seam Lines**: Collar seams (`y=19`), armhole shoulder seams (`x=12, x=20`), and waist belt bands (`y=27..28`).
2. **Tension Folds**:
   - Radiating diagonal fold lines (1px wide `ramp[1]`) at armpits and elbows.
   - Horizontal gathering folds across waistband / belt (`y=27`).
   - Vertical drape folds along skirts and tunics expanding outward toward hems.
3. **Layering Hierarchy**:
   - Layer 0: Skin / Base Body
   - Layer 1: Undergarments (chemise, linen blouse, hose)
   - Layer 2: Main Garment (tunic, kirtle, work trousers)
   - Layer 3: Protective Layer (leather apron, work vest, pinafore)
   - Layer 4: Outerwear (cloak, heavy winter cowl, mantle)
   - Layer 5: Accessories (belts, buckles, satchel straps, tools)
4. **Material Textures**:
   - **Linen**: Crisp, light highlights, subtle 1px weave breaks.
   - **Wool**: Matte surface, deep soft occlusion, low contrast between midtone and highlight.
   - **Leather**: Hard specular points (`ramp[5..6]`), warm amber midtones, dark crease lines.
   - **Metal (Buckles/Tools)**: Sharp contrasting 1px specular sparkle (`#ffffff`) beside deep dark shadow (`#26262e`).

---

## 5. Pixel Grammar & Disciplined Rendering

To achieve handcrafted master-level pixel art:
1. **Cluster Integrity**: Minimum cluster size is 2 pixels. Isolated single "orphan" pixels are prohibited unless they represent an intentional specular glint or fine droplet.
2. **Selective Outlining (Sel-Out)**:
   - **Rule**: NEVER apply a uniform pitch-black outline around character sprites.
   - **Implementation**: Outlines are drawn using the **darkest tone of the specific adjacent material** (`ramp[0]` shifted slightly cool). Skin uses deep ochre (`#6a3a24`), red wool uses dark maroon (`#3a1216`), green linen uses dark spruce (`#142416`).
   - This technique preserves atmospheric depth and allows characters to integrate naturally into Natura's dynamic outdoor lighting.
3. **Controlled Anti-Aliasing (Internal AA)**:
   - Along prominent diagonals (jawline, cloak edges, tool handles), use intermediate tone transition pixels to soften stair-stepping without blurring.
4. **Dithering Policy**:
   - Zero dithering on faces, hair locks, or limbs (keeps features sharp and clean).
   - Light 2×2 Bayer dither permitted only on large cloak surfaces or ground shadows to simulate coarse homespun fabric texture.

---

## 6. Lighting & Shading Model

All sprites conform to a unified environmental light model:
- **Key Light**: Positioned **Upper-Left** (angle: `135°`, roughly `-45°` elevation). Produces warm specular highlights (`#fff4d0` tint) on top and left surfaces.
- **Shadow Direction**: Falls to the **Lower-Right**.
- **Ambient Fill**: Cool skylight fill (`#344258`) reflected into upward-facing occluded crevices.
- **Subsurface Scattering (Skin)**: Warm reddish-orange transition band (`ramp[3..4]`) between direct light and core shadow on cheeks and nose.
- **Ground Contact Shadow**: Smooth dithered ellipse at `y = 44..46` anchored under the feet.

---

## 7. Master Color Ramp System

All color palettes are constructed from 7-tone ramps (`0` = deep occlusion, `3` = base midtone, `6` = specular highlight):

```text
Ramp Index:    [0]          [1]          [2]          [3]          [4]          [5]          [6]
Function:    Occlusion     Shadow      Mid-Dark       Base       Mid-Light    Highlight     Specular
Tone:        Cool/Deep   Cool/Shade   Desaturated   True Base   Warm/Soft    Luminous     Sparkle
```

### Key Ramps (Hex Values)

#### Skin Tones
- **Light / Nordic**: `['#543026', '#8c523c', '#b87656', '#dda078', '#f2be9b', '#fce0cb', '#fff4ec']`
- **Tanned / Warm**: `['#42241a', '#6e3c28', '#9e5a38', '#c47d4e', '#df9f70', '#f4c39b', '#fde5cb']`
- **Deep / Weathered**: `['#2e1a12', '#4e2a1b', '#733e26', '#995634', '#b87248', '#d69368', '#ecc09e']`

#### Hair Tones
- **Raven Black**: `['#121114', '#1f1e24', '#32303a', '#4c4958', '#6a677a', '#9491a3', '#c6c4d4']`
- **Chestnut Brown**: `['#24140c', '#3c2214', '#5a331c', '#7c4828', '#a36239', '#c98654', '#e8b382']`
- **Honey Blonde**: `['#40280e', '#664319', '#966728', '#c7923e', '#e5b65f', '#f7d68a', '#fff2c4']`
- **Autumn Auburn**: `['#2a0e0e', '#4c1a16', '#722920', '#9c3d2e', '#c45945', '#e3816a', '#fab09d']`
- **Silver Grey**: `['#24262b', '#3d4047', '#5a5d66', '#7b808c', '#a1a6b3', '#c8cdd9', '#edf0f7']`

#### Textiles & Dyes
- **Forest Green**: `['#0f1c12', '#182f1f', '#24452c', '#35633f', '#4e855b', '#73ab80', '#a8d4b2']`
- **Madder Red**: `['#240d10', '#42161b', '#6b222a', '#96333c', '#bf4f58', '#dc7880', '#f2b0b5']`
- **Indigo Blue**: `['#0f1626', '#17243d', '#25395c', '#385382', '#5272a8', '#7899cf', '#adc4eb']`
- **Ochre / Leather**: `['#241508', '#422810', '#694119', '#946028', '#be813d', '#dda861', '#f5d194']`
- **Unbleached Linen**: `['#262420', '#423f38', '#6b665a', '#999282', '#c2baa8', '#e3dcd0', '#f7f4ec']`

---

## 8. Kinematic Animation Grammar

Animations are authored via skeletal kinematics rather than disconnected sprites.

### 8.1 The 6-Frame Walk Cycle (Tempo: 120ms per frame)
The walk cycle models true physical locomotion with vertical COM (center-of-mass) oscillation:

```text
Frame 0: Contact (Left heel strike, Right toe push-off, Arms at maximum swing, COM = normal)
Frame 1: Down / Recoil (Left foot flat absorbs weight, Knee flexes, COM drops -1px, Torso tilts forward)
Frame 2: Passing (Right leg swings forward through center, Left leg straightens, COM rises +1px)
Frame 3: Contact (Right heel strike, Left toe push-off, Arms reverse swing, COM = normal)
Frame 4: Down / Recoil (Right foot flat absorbs weight, Knee flexes, COM drops -1px, Torso tilts forward)
Frame 5: Passing (Left leg swings forward through center, Right leg straightens, COM rises +1px)
```

### 8.2 Secondary Motion Rules
- **Hair**: Oscillates vertically with a 1-frame phase lag behind the head bob.
- **Cloth Hem**: Swings forward on the recoil frame and settles on the passing frame.
- **Tool / Heavy Item**: Carried tools maintain inertia—lagging behind hand acceleration on the forward swing.
- **Head Tilt**: Nods subtly downward 1px during the recoil frame.

---

## 9. Simulation State Mapping

The art grammar defines explicit visual rules for bodily and environmental states:

| Simulation Condition | Threshold | Visual Consequence | Implementation Rule |
| :--- | :--- | :--- | :--- |
| **High Fatigue** | `v.body.fatigue > 0.65` | Drooping posture, dragging feet | Torso tilts +1px forward; stride length reduced by 2px; eye height drops to 1px slit with dark under-eye shade. |
| **Severe Cold** | `v.body.coreTemp < 35.8` | Shivering, clutching posture | Arms tuck over chest; shoulders raise 1px; lateral 1px alternating jitter applied every 3 frames; pale bluish lip tint. |
| **Fever / Overheat** | `v.body.coreTemp > 38.0` | Flushed, sweating | Cheek blush intensity set to maximum (`#e85a5a`); forehead gains 1px specular sweat glint; open breathing mouth. |
| **Severe Injury** | `v.body.injury > 0.3` | Bandaged, limping | Bandage wrap (`#dcd6c8` with bloodstain spot) drawn on limb; walk holds 2 frames longer on uninjured leg. |
| **Environmental Wet**| `weather.rain > 0.1 \|\| groundWet` | Soaked clothing, slick hair | All garment colors darkened by 25% (water absorption); hair locks rendered with thin spiked tips; 1px water droplets glint on shoulders. |
| **Mud / Earth** | Working in tilled/wet soil | Muddy boots and hem | Procedural clay-brown spatter (`#4a301a`) painted across boots and lower 3px of trousers/skirt. |
| **Pregnancy** | `v.pregnant > 60` | Abdominal swell | Forward abdominal profile expanded by 2–4px depending on gestation stage; apron gathers over curve. |
| **Carrying** | `v.carry.length > 0` | Rendered load | Held item (log, timber, tool, food bundle) rendered with accurate material ramps, secured in arms with counter-balanced torso posture. |
