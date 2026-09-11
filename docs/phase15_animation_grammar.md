# Natura Animation Motion Grammar (Phase 15.2)

## 1. Principles of Pixel Animation
Natura's animation grammar avoids mechanical keyframing in favor of physics-based pixel kinematics.
An animation is not a sequence of disparate images, but a continuous manipulation of a structured skeleton under gravity.

### 1.1 Center of Mass (COM)
The COM must bob vertically (`comBobY`) in all weight-bearing animations to ground the character. Without vertical bobbing, characters appear to "slide" across the terrain.
* **Walking:** The COM is highest during the passing pose and lowest during the recoil (contact) pose.
* **Working:** The COM shifts rhythmically in opposition to the tool strike to maintain balance.

### 1.2 Secondary Motion & Phase Lag
Elements that do not generate their own force must lag behind the driving force.
* **Hair Mass:** Bobs with the head but with a 1-frame delay (Phase Lag = 1).
* **Clothing Hem:** Swings forward when the leg drives forward, but momentum carries it outward for 1 frame after the foot strikes the ground.
* **Tools (Passive):** Hanging lanterns or carried bags swing in opposition to the hip rotation.

### 1.3 Weight Transfer
Animations must convey weight. The time spent in the air versus on the ground dictates the perceived mass of the character and their burden.
* Unburdened Walk: Symmetrical, crisp contact.
* Encumbered (Carrying): Asymmetrical stride, longer ground contact time, deeper COM drop.

## 2. Core Actions

### 2.1 The 6-Frame Kinematic Walk
- **Frame 0 (Contact):** Lead heel strikes ground. Arms at max extension. COM = 0.
- **Frame 1 (Recoil):** Lead foot flat. Knee absorbs impact. COM = -1 (drops).
- **Frame 2 (Passing):** Rear leg lifts and swings forward. Lead leg straightens. COM = +1 (rises).
- **Frame 3 (Contact):** Opposite heel strikes ground.
- **Frame 4 (Recoil):** Opposite foot flat. COM drops.
- **Frame 5 (Passing):** Original lead leg swings forward. COM rises.

### 2.2 Work: Chopping / Mining
- **Frame 0 (Windup):** Tool raised behind head. COM rises +1. Torso leans back slightly.
- **Frame 1 (Apex):** Tool at peak. Tension builds.
- **Frame 2 (Strike / Contact):** Tool hits surface. COM drops -1 violently. Head snaps down (Lag = 1).
- **Frame 3 (Recovery):** Tool bounces or rests. COM returns to 0.

### 2.3 Work: Tilling (Hoe)
- Horizontal emphasis. Legs planted in wide stance.
- Arms drag the tool backward (Frames 0-1) and push forward (Frames 2-3).
- Torso twists rather than simply leaning.

## 3. Structural Stability
During all animations:
* **Facial Identity:** The eyes, nose, and mouth must not change their relative geometric distances. Stretching the face destroys identity.
* **Hair Silhouette:** The primary volume of the hair must remain constant. Only the fringe/tips should flutter.
* **Foot Anchoring:** A foot on the ground must remain locked to its absolute horizontal pixel coordinate during the contact and recoil phases, moving backwards relative to the body (or the body moving forwards) without horizontal jitter.

## 4. Sub-Pixel Implication
Because we are working with integer pixels, a 1px movement can feel overly dramatic.
* **Half-pixel movement** is achieved through anti-aliasing / shading changes on the leading edge of a form, rather than moving the entire form.
* E.g., when the torso leans forward, shift the highlight 1px forward before moving the whole torso block.
