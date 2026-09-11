# Phase 15: Natura vs Willowbrook Visual Comparison

## 1. Overall Philosophy
* **Willowbrook** uses a 1:2 "chibi" proportion scheme. Characters have massive heads, 2-pixel legs, and essentially no torso articulation. Visual variations are mostly limited to palette swaps and simple hair attachments.
* **Natura (New)** uses a 1:5 adult proportion scheme grounded in realistic articulation. The multi-scale generator composes character geometry at 64x96 internally and downsamples it, yielding an expressive, layered, and anatomically coherent 32x48 output.

## 2. Head and Face
* **Willowbrook:** Eyes are a solid 1px dot. No facial structure. Faces are a simple 6x6 pixel circle.
* **Natura (New):** Eyes have a defined sclera, iris, and specular highlight. Eyebrows articulate based on age and sex. Noses cast shadows based on their specific geometry (e.g., aquiline). Faces have proper jawlines (soft, angular, jowled).

## 3. Hair
* **Willowbrook:** Hair is a flat blob with a single color.
* **Natura (New):** Hair is simulated as physical masses. Characters have distinct locks, fringes that frame the face, and directional specular highlights calculated against the global key light. 

## 4. Materials and Clothing
* **Willowbrook:** Clothing is a simple `fillRect`. No folds, no material properties.
* **Natura (New):** Clothing layers obey Z-buffering (undershirt beneath vest beneath apron). Materials affect the generator: leather yields sharp specular highlights; wool yields matte, dithered edges. Sleeves and hems show tension folds.

## 5. Animation
* **Willowbrook:** Characters slide rigidly across the ground. Only a 2-frame wobble.
* **Natura (New):** A full 6-frame kinematic cycle. The center of mass bobs. Feet anchor properly to the ground during the contact phase. Hair and clothing hems exhibit physical phase lag. 

## Conclusion
The new Natura generator represents a multi-generational leap over Willowbrook. By employing intermediate high-resolution composition, physics-based pixel kinematics, and a perceptually validated grammar, Natura characters feel like living, breathing inhabitants rather than iconic game pieces.
