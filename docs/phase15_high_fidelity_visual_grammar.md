# Natura High-Fidelity Visual Grammar (Phase 15.3)

## 1. Detail Hierarchy
Not all areas of a character deserve equal visual attention. Detail must be clustered where humans naturally look, and sparse where the eye should glide over.

**Priority Hierarchy (Highest to Lowest):**
1. **Face & Eyes:** The soul of the character. Expressive structure (jawlines, eye shapes) takes priority.
2. **Hair Silhouette & Fringe:** Frames the face. Must have directional locks and highlights.
3. **Hands & Tools:** Critical for conveying action and interaction with the Natura world.
4. **Upper Torso (Collar/Shoulders):** Defines the build and posture.
5. **Clothing Folds (Tension points):** Convey the material weight (e.g. elbows, knees, belt gather).
6. **Legs & Boots:** Lower contrast, anchors to the ground, mostly in shadow.
7. **Micro-decoration:** Belt buckles, buttons, trim (used sparingly to add sparkle).

## 2. Forms & Anatomy
- **Primary Forms:** The overall silhouette. Is the character pear-shaped, top-heavy, or wiry? The silhouette alone must distinguish a lumberjack from an elder weaver.
- **Secondary Forms:** The structure within the silhouette (the curve of a sleeve, the split of a tunic).
- **Tertiary Detail:** Material textures, 1px highlight glints, folds, and seams.

## 3. High-Resolution Considerations (Multi-Scale)
As we explore higher intermediate resolutions (e.g., 48x72 or 64x96 before downscaling), the grammar dictates that we use this extra space to define *structure*, not just noise.
- **Eyes:** Instead of a 2x2 block, an eye can have an arched lid, an iris, a sclera corner, and an under-eye bag.
- **Hair:** We can define overlapping locks rather than just a bumpy edge.

## 4. Materials
Different materials must read differently through shading logic, not just color:
- **Linen/Cotton:** Soft folds, matte finish, wide mid-tones.
- **Leather/Metal:** High contrast, sharp localized specular highlights, deep core shadows.
- **Wool/Fur:** Dithered edges, low contrast, absorbs light.

## 5. Pixel Clustering
Strict adherence to the 2px minimum cluster rule still applies to core forms to prevent the image from looking "noisy." Single pixels are reserved strictly for:
- Specular highlights (eyes, metal, water).
- Extreme tapering edges (hair tips).
- Tension creases in clothing.
