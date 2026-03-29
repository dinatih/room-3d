/**
 * dance.js — animation de danse procédurale partageable entre GLBs
 *
 * Utilisation :
 *   import { attachDance } from './dance.js';
 *   const ok = attachDance(model);   // true si des bones ont été trouvés
 *
 * Fonctionne sur tout rig humanoïde standard (Mixamo, Blender, Unreal, VRM…).
 * La danse tourne dans le ticker global de cameraManager — zéro overhead quand
 * aucun modèle n'est enregistré.
 */

import { registerAnimTicker, requestRender } from '../cameraManager.js';

// ─── Mapping noms de bones par convention ────────────────────────────────────
// Chaque entrée liste les variantes connues, matching insensible à la casse.
const BONE_ALIASES = {
  hips:     ['hips', 'pelvis', 'hip', 'bip001 pelvis', 'root', 'b_pelvis', 'cog'],
  spine:    ['spine', 'spine01', 'spine_01', 'spine1', 'bip001 spine', 'b_spine'],
  chest:    ['spine2', 'spine02', 'spine_02', 'chest', 'upperchest', 'spine2', 'b_chest'],
  neck:     ['neck', 'neck01', 'neck_01', 'b_neck'],
  head:     ['head', 'head_01', 'b_head', 'bip001 head'],
  armL:     ['leftarm', 'upperarm_l', 'arm_l', 'arm.l', 'bip001 l upperarm', 'b_upperarm_l', 'l_upperarm', 'shoulder_l'],
  armR:     ['rightarm', 'upperarm_r', 'arm_r', 'arm.r', 'bip001 r upperarm', 'b_upperarm_r', 'r_upperarm', 'shoulder_r'],
  forearmL: ['leftforearm', 'lowerarm_l', 'forearm_l', 'forearm.l', 'bip001 l forearm', 'b_lowerarm_l', 'l_forearm'],
  forearmR: ['rightforearm', 'lowerarm_r', 'forearm_r', 'forearm.r', 'bip001 r forearm', 'b_lowerarm_r', 'r_forearm'],
  legL:     ['leftupleg', 'thigh_l', 'leg_l', 'upperleg_l', 'upleg.l', 'bip001 l thigh', 'b_thigh_l', 'l_thigh'],
  legR:     ['rightupleg', 'thigh_r', 'leg_r', 'upperleg_r', 'upleg.r', 'bip001 r thigh', 'b_thigh_r', 'r_thigh'],
  kneeL:    ['leftleg', 'calf_l', 'shin_l', 'lowerleg_l', 'knee.l', 'bip001 l calf', 'b_calf_l'],
  kneeR:    ['rightleg', 'calf_r', 'shin_r', 'lowerleg_r', 'knee.r', 'bip001 r calf', 'b_calf_r'],
};

// Mixamo préfixe tous ses bones avec "mixamorig:" — on les ajoute dynamiquement
const MIXAMO_PREFIX = 'mixamorig:';
for (const [key, aliases] of Object.entries(BONE_ALIASES)) {
  // Cherche la variante "propre" (sans préfixe) pour construire la version Mixamo
  const base = aliases[0];
  const mixamoName = MIXAMO_PREFIX + base.charAt(0).toUpperCase() + base.slice(1);
  aliases.unshift(mixamoName.toLowerCase());
}

// ─── Danse procédurale ────────────────────────────────────────────────────────
function applyDance(bones, t, phase) {
  const p = phase;
  const { hips, spine, chest, neck, head, armL, armR, forearmL, forearmR, legL, legR, kneeL, kneeR } = bones;

  // Bassin : balancement latéral + léger rebond sur Y
  if (hips) {
    hips.rotation.y = Math.sin(t * 2 + p) * 0.40;
    hips.rotation.z = Math.sin(t * 4 + p) * 0.08;
    hips.rotation.x = Math.abs(Math.sin(t * 4 + p)) * 0.06;
  }
  // Colonne
  if (spine) spine.rotation.z = Math.sin(t * 2 + p + 0.6) * 0.18;
  if (chest) chest.rotation.z = Math.sin(t * 2 + p + 1.0) * 0.12;
  // Tête
  if (neck) neck.rotation.y = Math.sin(t * 1.8 + p) * 0.15;
  if (head) head.rotation.y  = Math.sin(t * 1.5 + p + 0.3) * 0.20;
  // Bras
  if (armL) {
    armL.rotation.z = Math.sin(t * 2 + p) * 0.65 + 0.35;
    armL.rotation.x = Math.cos(t * 2 + p) * 0.20;
  }
  if (armR) {
    armR.rotation.z = -(Math.sin(t * 2 + p) * 0.65 + 0.35);
    armR.rotation.x = Math.cos(t * 2 + p) * 0.20;
  }
  // Avant-bras
  if (forearmL) forearmL.rotation.y =  Math.sin(t * 3 + p) * 0.45;
  if (forearmR) forearmR.rotation.y = -Math.sin(t * 3 + p) * 0.45;
  // Jambes
  if (legL) legL.rotation.x =  Math.sin(t * 2 + p) * 0.22;
  if (legR) legR.rotation.x = -Math.sin(t * 2 + p) * 0.22;
  if (kneeL) kneeL.rotation.x = Math.max(0, Math.sin(t * 2 + p)) * 0.30;
  if (kneeR) kneeR.rotation.x = Math.max(0, -Math.sin(t * 2 + p)) * 0.30;
}

// ─── Collecte tous les bones du modèle ───────────────────────────────────────
function collectBones(model) {
  const all = [];
  model.traverse(c => { if (c.isBone) all.push(c); });
  return all;
}

// ─── Lookup bone : exact d'abord, puis contains ───────────────────────────────
function findBone(allBones, aliases) {
  const lc = aliases.map(a => a.toLowerCase());
  // 1. match exact
  for (const b of allBones) {
    if (lc.includes(b.name.toLowerCase())) return b;
  }
  // 2. match partiel (le nom du bone contient un alias ou vice-versa)
  for (const b of allBones) {
    const bn = b.name.toLowerCase();
    if (lc.some(a => bn.includes(a) || a.includes(bn))) return b;
  }
  return null;
}

function resolveBones(model) {
  const allBones = collectBones(model);
  if (allBones.length === 0) return {};
  const bones = {};
  for (const [key, aliases] of Object.entries(BONE_ALIASES)) {
    bones[key] = findBone(allBones, aliases);
  }
  return bones;
}

// ─── Ticker global ───────────────────────────────────────────────────────────
const _dancers = []; // { bones, phase, active }
let _t = 0;

registerAnimTicker((dt) => {
  if (_dancers.length === 0) return;
  _t += dt;
  let any = false;
  for (const d of _dancers) {
    if (d.active) { applyDance(d.bones, _t, d.phase); any = true; }
  }
  if (any) requestRender();
});

// ─── API publique ─────────────────────────────────────────────────────────────
/**
 * Attache la danse procédurale à un modèle GLB.
 * @param {THREE.Object3D} model  - la scène du GLB chargé
 * @param {number} phaseOffset    - décalage de phase (0..2π) pour varier entre modèles
 * @returns {{ stop, start, toggle } | null} contrôleur, ou null si aucun bone trouvé
 */
export function attachDance(model, phaseOffset = 0) {
  const allBones = collectBones(model);
  if (allBones.length === 0) {
    console.log('[dance] aucun bone trouvé dans ce modèle');
    return null;
  }
  const bones = resolveBones(model);
  const found = Object.values(bones).filter(Boolean).length;
  if (found === 0) {
    console.log('[dance] bones présents mais aucun reconnu. Noms disponibles :', allBones.map(b => b.name).join(', '));
    return null;
  }
  const dancer = { bones, phase: phaseOffset, active: true };
  _dancers.push(dancer);
  console.log(`[dance] ${found} bones :`, Object.entries(bones).filter(([,v])=>v).map(([k,v])=>`${k}=${v.name}`).join(', '));
  return {
    stop:   () => { dancer.active = false; },
    start:  () => { dancer.active = true;  },
    toggle: () => { dancer.active = !dancer.active; return dancer.active; },
  };
}
