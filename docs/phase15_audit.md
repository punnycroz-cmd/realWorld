# Natura Phase 15.0 - Character Art Pipeline Audit

## 1. Current Visual Strengths
* **Structured Proportions**: Avoids the Willowbrook "chibi" look by using a 1:5 scale for adults with a defined neck and sloped trapezius.
* **Master Color Ramps**: Excellent 7-tone material ramps ensure coherent shading, avoiding flat colors or disorganized palettes.
* **Selective Outlining**: Dynamic outlines adapt to the underlying material's darkest tone, rooting characters in the scene better than harsh black outlines.
* **Deterministic Skeleton**: The `AnimationSystem` provides a solid center-of-mass bob and kinematic approach which feels more grounded than standard sprite sheet flipping.
* **State Adapter**: The integration of `fatigue`, `cold`, and `pregnancy` states is a great foundation for "living" characters.

## 2. Current Visual Weaknesses
* **Face Oversimplification**: The current face grammar is too abstract (a 2px eye, 1px slit, 1px nose bridge). It lacks enough fidelity to express diverse identities (jawlines, cheekbones, eyebrow variations). Everyone looks structurally similar.
* **Procedural Blobbing**: Hair and clothing rely too heavily on basic `fillRect` and simple primitives. Hair lacks distinct structural locks and fringe details.
* **Flat Clothing Drapery**: The current generator has minimal fold logic (mostly implied by simple lines) rather than realistic tension points or overlapping layers.
* **Single Resolution Bottleneck**: Hardcoding logic to a 32x48 canvas forces drastic approximations. Detail is inherently lost because the canvas is too restrictive for high-fidelity forms before pixelation.
* **Missing Perceptual Ground Truth**: The current `critic.js` optimizes for internal rule compliance (e.g., cluster size) rather than genuine visual beauty or reference similarity. It validates syntax, not semantics.

## 3. Specific Detail Losses
* **Anatomy**: Hands and feet are practically featureless blocks. Shoulders are mechanically sloped but lack anatomical articulation.
* **Hair**: Currently rendered as a solid mass with a single curve highlight. Lacks directional strands, volume variance, and complex silhouettes (braids are just rectangles).
* **Clothing**: Lacks material-specific rendering logic (e.g., leather vs. linen). Garments feel painted on rather than draped.
* **Animation**: While the 6-frame walk cycle is solid, it lacks secondary motion in clothing (only hair is simulated). Tool-holding is rigid and mechanically mirrored.

## 4. Root Causes
* **Low Resolution**: The 32x48 native canvas restricts eyes to 2 pixels. It is mathematically impossible to convey varied eye shapes or eyelid structures at this scale.
* **Procedural Primitives over Layers**: `character_generator.js` paints directly to the canvas in order (ground, hair, legs, torso) using rectangles and circles, rather than composing high-quality layered assets or resolving occlusion intelligently.
* **CharacterDNA Limitations**: The DNA dictates simple categories (`"broad"`, `"short"`) without giving the renderer enough geometric data (e.g., eye spacing, jaw shape) to sculpt a unique face.
* **Evaluation Limitations**: `critic.js` checks pixel rules (no orphan pixels, proper outlining), but cannot tell if a face looks "beautiful." It has no concept of perceptual similarity to a high-quality reference.
