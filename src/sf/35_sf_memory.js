/* =====================================================================
   PART 35 — SF MEMORY WIRING (production-1)

   Sources: memory/memory-model-spec.md (v5.4) +
   memory/character-memory-profiles.md (archetype table §1) +
   memory/cast-profiles.md (compiled C1–C8 discriminatives + ambient
   template §10) — all on sf/memory @5988a78.

   WIRED (the sim already has these mechanisms):
     beta_episodic    -> decayEpistemic() decay multiplier (knowledge.js),
                         replacing the coarse sharp/average/forgetful trait
     forget_thresh    -> the epistemic-store prune floor for memory records
     misinfo_suscept  -> observe()'s hearsay prior (how strongly
                         heard-but-unverified accounts land)
   Profiles attach to the pawn at cast spawn as v.memProfile
   (sfInitCast in 33_sf_cast.js).

   SPEC-ONLY (no consumer exists in the SF brain yet — stored on the
   profile for the future implementer, never claimed as wired):
     theta, enc_base, att_min, beta_semantic, beta_source, k_verbatim,
     drift_p, confab_fill, sleepFactor, bump_windows, and every per-main
     discriminative (sti_prob, cred_step, share_k, self_share_pen,
     secret_mindwander, vivid_detail, imagine_gain, attach_encode_loss,
     pm_monitor_p, mnem_neg, defens, script_redeem …). Epistemic
     records form only where code calls observe()/witnessEvent() — under
     the v16 contract that is talk-contact (36), convo speech (38),
     reflection insights + endSay archival (36), hire arrival beats, and
     medieval-path verbs. Routine order steps (walking, idling, working a
     shift) still write nothing — memory is event-shaped, not lifelogged.
   ===================================================================== */

/* Age-band archetypes — character-memory-profiles.md §1 verbatim values
   for the four wired params. */
const SF_MEM_ARCHETYPES = {
  A: { beta_episodic: 0.65, forget_thresh: 0.10, misinfo_suscept: 0.60,
       theta: 0.40, label: 'child' },        // ≈6–12
  B: { beta_episodic: 0.45, forget_thresh: 0.07, misinfo_suscept: 0.45,
       theta: 0.42, label: 'teen' },        // ≈13–19
  C: { beta_episodic: 0.42, forget_thresh: 0.07, misinfo_suscept: 0.30,
       theta: 0.40, label: 'young adult' }, // ≈20–35
  D: { beta_episodic: 0.55, forget_thresh: 0.09, misinfo_suscept: 0.35,
       theta: 0.47, label: 'midlife' },     // ≈40–60
  E: { beta_episodic: 0.72, forget_thresh: 0.12, misinfo_suscept: 0.50,
       theta: 0.52, label: 'older adult' }, // ≈65+
};

/* Canonical ages — mains per cast-profiles.md §§C1–C8, ambients per
   world/ambients.json v57 (the readable registry 33_sf_cast.js mirrors). */
const SF_MEM_AGES = {
  C1: 29, C2: 26, C3: 24, C4: 31, C5: 34, C6: 74, C7: 58, C8: 36,
  A01: 27, A02: 41, A03: 52, A04: 16, A05: 78, A06: 29, A07: 45,
  A08: 38, A09: 33, A10: 61, A11: 44, A12: 35, A13: 31, A14: 29,
  A15: 27, A16: 47, A17: 36, A18: 55, A19: 71, A20: 17,
};

function sfMemArchetype(age){
  if(age < 13) return 'A';
  if(age < 20) return 'B';
  if(age < 36) return 'C';   // cast-profiles C8 pins 36 -> 'D early edge'
  if(age < 65) return 'D';
  return 'E';
}

/* Per-main compiled discriminatives (cast-profiles.md §§C1–C8 + §9 delta
   block). All spec-only today; carried so tools/briefings can surface
   them honestly as "profiled, not yet simulated". */
const SF_MEM_DISC = {
  C1: { sti_prob: 0.85, cred_step: 0.14, share_k: 1.1, self_share_pen: 0.8,
        audience_tune: 0.15, secret_mindwander: 0.14, dest_mem: 0.85,
        mnem_neg: 0.20, defens: 0.5, script_redeem: 0.4,
        signature: 'the archive that forgets itself' },
  C2: { vivid_detail: 0.9, concrete_gain: 0.25, imagine_gain: 0.3,
        common_ground_conf: 'low-side', mnem_neg: 0.10, defens: 0.0,
        script_redeem: 0.3, signature: 'the dense newcomer' },
  C3: { secret_mindwander: 0.16, open_loop_gain: 0.20, share_k: 0.9,
        self_share_pen: 0.85, share_shame_pen: 0.7, gen_gain: 0.25,
        mnem_neg: 0.15, defens: 0.3, script_redeem: -0.1,
        signature: 'compartments' },
  C4: { attach_encode_loss: 0.25, pm_focal_hit: 0.9, da_encode_mult: 0.7,
        specificity: 0.9, mnem_neg: 0.30, defens: 0.4, script_redeem: -0.2,
        signature: 'precise about you, vague about herself' },
  C5: { pm_monitor_p: 0.2, pm_clock_p: 0.05, pm_focal_hit: 0.9,
        chain_gain: 'high', enact_gain: 'high', w_sensory: 'high',
        mnem_neg: 0.05, defens: -0.2, script_redeem: 0.5,
        signature: 'spatial giant, temporal sieve' },
  C6: { reserve: 0.65, bump_windows: [[10, 30], [27, 37]],
        mnem_neg: 0.20, defens: 0.2, script_redeem: 0.8,
        signature: 'deep roots, thin leaves — bimodal archive' },
  C7: { mnem_neg: 0.45, defens: 1.2, script_redeem: -0.5,
        selfdef_spec_mult: 'vague-anchors',
        signature: 'brittle: criticism of Victor-as-person fails at recall' },
  C8: { attach_avoid: 0.9, bump_windows: [[10, 30], [10, 20]],
        langs: [{ l: 'es', l1_until: 12 }, { l: 'en' }],
        mnem_neg: 0.10, defens: 0.1, script_redeem: 0.6,
        signature: 'behavioral silence, memory intact' },
};

/* Ambient template (cast-profiles.md §10): archetype params + the 2-DOF
   jitter the spec allows — enc_base ±10%, theta ±0.05, seeded per id so
   identical ambients stay deterministic. No SelfModel/secret machinery. */
function sfMemProfileFor(cid){
  const age = SF_MEM_AGES[cid] || 30;
  const archKey = SF_MEM_AGES[cid] != null && cid === 'C8' ? 'D'
                : sfMemArchetype(age);         // C8: 'D early edge (36)'
  const a = SF_MEM_ARCHETYPES[archKey];
  const p = {
    archetype: archKey, age,
    beta_episodic: a.beta_episodic,
    forget_thresh: a.forget_thresh,
    misinfo_suscept: a.misinfo_suscept,
    theta: a.theta,
  };
  if(cid[0] === 'A'){
    // seeded 2-DOF jitter inside ambient_trait_sigma
    const j1 = ((hashString18('memA:' + cid) % 21) - 10) / 100; // ±0.10
    const j2 = ((hashString18('memB:' + cid) % 11) - 5) / 100;  // ±0.05
    p.enc_base_jitter = j1;               // applied to enc_base if it
    p.theta = +(a.theta + j2).toFixed(2); // ever gets a consumer
    p.individ_rate = 0.05;
    p.ambient = true;
  } else if(SF_MEM_DISC[cid]){
    p.disc = SF_MEM_DISC[cid];
    p.signature = SF_MEM_DISC[cid].signature;
  }
  return p;
}

/* bridge: let tools/briefings read what a character's memory profile is
   and which fields are wired vs spec-only. */
if(typeof window !== 'undefined' && window.__aiBridge){
  window.__aiBridge.sfMemProfile = (cid) =>
    (typeof SF_MEM_AGES !== 'undefined' && SF_MEM_AGES[cid] != null)
      ? sfMemProfileFor(cid) : null;
  window.__aiBridge.sfMemWired = () =>
    ['beta_episodic', 'forget_thresh', 'misinfo_suscept'];
}
