import * as THREE from 'three';
import { ACCESSORIES_MESH_NAMES } from './walkerConfig';
import { resolveTargetBoneName, getDepth } from './retargeting';

export interface CharacterMeshPart {
  mesh: THREE.Mesh;
}

export interface CharacterBones {
  hips: THREE.Bone | null;
  spine: THREE.Bone | null;
  spine2: THREE.Bone | null;
  head: THREE.Bone | null;
  lShoulder: THREE.Bone | null;
  rShoulder: THREE.Bone | null;
  nativeHairBones: THREE.Bone[];
  breastBones: THREE.Bone[];
}

export interface CharacterRenderMesh {
  mesh: THREE.Mesh;
  isInternalInvisible: boolean;
}

export interface CharacterParts {
  bones: CharacterBones;

  // Clothing parts
  boots: CharacterMeshPart[];
  feet: CharacterMeshPart[];
  gloves: CharacterMeshPart[];
  hands: CharacterMeshPart[];
  torsoClothed: CharacterMeshPart[];
  torsoNude: CharacterMeshPart[];
  legsClothed: CharacterMeshPart[];
  legsNude: CharacterMeshPart[];
  bodyFull: CharacterMeshPart[];

  // Accessories
  handPistols: CharacterMeshPart[];
  holsterPistols: CharacterMeshPart[];
  holsters: CharacterMeshPart[];
  backpacks: CharacterMeshPart[];
  otherAccessories: CharacterMeshPart[];

  // Native hair & materials
  nativeHairMeshes: CharacterMeshPart[];
  lgbtaHairMaterials: THREE.Material[];

  // Render & shadows
  allRenderMeshes: CharacterRenderMesh[];
}

const HEAD_KEYWORDS = [
  'head', 'face', 'hair', 'braid', 'pony', 'eye', 'lash', 'cil',
  'mouth', 'teeth', 'dent', 'tongue', 'langue', 'cornea', 'sclera',
  'pupil', 'glasses', 'scalp', 'brow', 'wig'
];

export function isHeadMesh(mesh: THREE.Object3D): boolean {
  if (mesh.userData?.isHeadPart || mesh.userData?.isCustomHair || mesh.userData?.isWigRoot) return true;
  const meshName = (mesh.name || '').toLowerCase();
  const mat = (mesh as THREE.Mesh).material;
  const matNames: string[] = [];
  if (mat) {
    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach(m => { if (m?.name) matNames.push(m.name.toLowerCase()); });
  }
  const matStr = matNames.join(' ');
  return HEAD_KEYWORDS.some(kw => meshName.includes(kw) || matStr.includes(kw));
}

const INTERNAL_INVISIBLE_KEYWORDS = [
  'teeth', 'dent', 'lash', 'cil', 'eye', 'oeil', 'tongue', 'langue',
  'cornea', 'sclera', 'pupil', 'mouth_inner'
];

export function extractCharacterParts(scene: THREE.Object3D): CharacterParts {
  // 1. Rename hair bones sequentially from base to tip
  const targetHairBones: Array<{ bone: THREE.Object3D; depth: number }> = [];
  scene.traverse(c => {
    if ((c as any).isBone) {
      const nameLower = (c.name || '').toLowerCase();
      if (nameLower.includes('hair') || nameLower.includes('ponytail') || nameLower.includes('braid') || nameLower.includes('pony')) {
        targetHairBones.push({ bone: c, depth: getDepth(c) });
      }
    }
  });
  targetHairBones.sort((a, b) => a.depth - b.depth);
  targetHairBones.forEach((hb, idx) => {
    hb.bone.name = `hair_${idx + 1}`;
  });

  // 2. Resolve Skeleton Bones
  const resolvedHipsName = resolveTargetBoneName(scene, 'Hips');
  const hips = resolvedHipsName ? (scene.getObjectByName(resolvedHipsName) as THREE.Bone | null) : null;
  const rSpine2 = resolveTargetBoneName(scene, 'Spine2');
  const spine2 = rSpine2 ? (scene.getObjectByName(rSpine2) as THREE.Bone | null) : null;
  const rSpine = resolveTargetBoneName(scene, 'Spine');
  const spine = rSpine ? (scene.getObjectByName(rSpine) as THREE.Bone | null) : null;
  const rHead = resolveTargetBoneName(scene, 'Head') || resolveTargetBoneName(scene, 'Neck');
  const head = rHead ? (scene.getObjectByName(rHead) as THREE.Bone | null) : null;
  const rLShoulder = resolveTargetBoneName(scene, 'LeftShoulder');
  const lShoulder = rLShoulder ? (scene.getObjectByName(rLShoulder) as THREE.Bone | null) : null;
  const rRShoulder = resolveTargetBoneName(scene, 'RightShoulder');
  const rShoulder = rRShoulder ? (scene.getObjectByName(rRShoulder) as THREE.Bone | null) : null;

  const nativeHairBones: THREE.Bone[] = [];
  const breastBones: THREE.Bone[] = [];

  // 3. Prepare collection lists
  const boots: CharacterMeshPart[] = [];
  const feet: CharacterMeshPart[] = [];
  const gloves: CharacterMeshPart[] = [];
  const hands: CharacterMeshPart[] = [];
  const torsoClothed: CharacterMeshPart[] = [];
  const torsoNude: CharacterMeshPart[] = [];
  const legsClothed: CharacterMeshPart[] = [];
  const legsNude: CharacterMeshPart[] = [];
  const bodyFull: CharacterMeshPart[] = [];

  const handPistols: CharacterMeshPart[] = [];
  const holsterPistols: CharacterMeshPart[] = [];
  const holsters: CharacterMeshPart[] = [];
  const backpacks: CharacterMeshPart[] = [];
  const otherAccessories: CharacterMeshPart[] = [];

  const nativeHairMeshes: CharacterMeshPart[] = [];
  const lgbtaHairMaterials: THREE.Material[] = [];
  const allRenderMeshes: CharacterRenderMesh[] = [];

  // 4. Single Traverse to classify everything
  scene.traverse(node => {
    const o = node as any;

    if (o.isBone) {
      const nLower = (o.name || '').toLowerCase();
      if ((nLower.includes('hair') || nLower.includes('pony') || nLower.includes('braid')) && !o.userData.isCustomHair) {
        nativeHairBones.push(o as THREE.Bone);
      }
      if (nLower.includes('breast')) {
        breastBones.push(o as THREE.Bone);
      }
      if (!o.defaultPosition) {
        o.defaultPosition = o.position.clone();
      }
      if (!o.restLocalQuaternion) {
        o.restLocalQuaternion = o.quaternion.clone();
      }
      if (!o.userData.restPos) {
        o.userData.restPos = o.position.clone();
      }
      if (!o.userData.restQuat) {
        o.userData.restQuat = o.quaternion.clone();
      }
    }

    if (!o.restWorldQuaternion) {
      o.restWorldQuaternion = o.getWorldQuaternion(new THREE.Quaternion());
    }

    if (o.isMesh && !o.userData.isCustomHair) {
      const mesh = o as THREE.Mesh;
      const name = (mesh.name || '').toLowerCase();
      const mat = mesh.material;
      const matNames: string[] = [];
      if (mat) {
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach(m => {
          if (m?.name) matNames.push(m.name.toLowerCase());
          if (m && !lgbtaHairMaterials.includes(m) && (name.includes('hair') || name.includes('braid') || name.includes('pony') || (m.name && (m.name.toLowerCase().includes('hair') || m.name.toLowerCase().includes('braid') || m.name.toLowerCase().includes('pony'))))) {
            lgbtaHairMaterials.push(m);
          }
        });
      }
      const matStr = matNames.join(' ');

      const isInternalInvisible = INTERNAL_INVISIBLE_KEYWORDS.some(kw => name.includes(kw) || matStr.includes(kw));
      allRenderMeshes.push({ mesh, isInternalInvisible });

      // Hair meshes
      const isHairMesh = name.includes('hair') || name.includes('braid') || name.includes('pony') || matStr.includes('hair') || matStr.includes('braid') || matStr.includes('pony');
      if (isHairMesh) {
        nativeHairMeshes.push({ mesh });
      }

      // Check accessories
      let isAccessory = false;
      for (const accName of ACCESSORIES_MESH_NAMES) {
        const accNameSpace = accName.replace(/_/g, ' ');
        if (name.includes(accName) || name.includes(accNameSpace) || matStr.includes(accName) || matStr.includes(accNameSpace)) {
          isAccessory = true;
          break;
        }
      }

      const isHandPistol = name.includes('handgun') && !name.includes('holster');
      const isHolsterPistol = (name.includes('handgun') && name.includes('holster')) || name === 'holster' || name.includes('mp5_holster') || name.endsWith('_holster');
      const isHolster = name.includes('holster') || name.includes('gear') || name.includes('buckle') || matStr.includes('holster') || matStr.includes('gear') || matStr.includes('buckle');
      const isBackpack = name.includes('backpack') || name.includes('bag') || name.includes('pack') || matStr.includes('backpack') || matStr.includes('bag') || matStr.includes('pack');

      if (isHandPistol) {
        handPistols.push({ mesh });
      } else if (isHolsterPistol) {
        holsterPistols.push({ mesh });
      } else if (isHolster) {
        holsters.push({ mesh });
      } else if (isBackpack) {
        backpacks.push({ mesh });
      } else if (isAccessory) {
        otherAccessories.push({ mesh });
      }

      // Clothing / Body classification
      if (name === 'boots' || name.includes('boots')) {
        boots.push({ mesh });
      } else if (name === 'body_nude_feet' || name.includes('feet') || name.includes('5_feet')) {
        feet.push({ mesh });
      } else if (name === 'gloves' || name === 'fingers' || name.includes('gloves') || name.includes('fingers')) {
        gloves.push({ mesh });
      } else if (name === 'body_nude_hands' || name.includes('hands') || name.includes('5_hands')) {
        hands.push({ mesh });
      } else if (name === 'shirt' || name === 'body_torso' || (name.includes('torso') && !name.includes('nude')) || name.includes('shirt')) {
        torsoClothed.push({ mesh });
      } else if (name === 'body_nude_torso' || (name.includes('torso') && name.includes('nude')) || name.includes('5_body_torso')) {
        torsoNude.push({ mesh });
      } else if (name === 'shorts' || name === 'body_legs' || (name.includes('legs') && !name.includes('nude')) || name.includes('shorts')) {
        legsClothed.push({ mesh });
      } else if (name === 'body_nude_legs' || name === 'body_nude_panties' || (name.includes('legs') && name.includes('nude')) || name.includes('panties') || name.includes('5_body_legs') || name.includes('5_panties')) {
        legsNude.push({ mesh });
      } else if (name === 'body') {
        bodyFull.push({ mesh });
      }
    }
  });

  return {
    bones: {
      hips,
      spine,
      spine2,
      head,
      lShoulder,
      rShoulder,
      nativeHairBones,
      breastBones
    },

    boots,
    feet,
    gloves,
    hands,
    torsoClothed,
    torsoNude,
    legsClothed,
    legsNude,
    bodyFull,

    handPistols,
    holsterPistols,
    holsters,
    backpacks,
    otherAccessories,

    nativeHairMeshes,
    lgbtaHairMaterials,
    allRenderMeshes
  };
}

export function setPartVisibility(partList: CharacterMeshPart[], visible: boolean) {
  for (let i = 0; i < partList.length; i++) {
    const mesh = partList[i].mesh;
    mesh.visible = visible;
    const mat = mesh.material;
    if (mat) {
      if (Array.isArray(mat)) {
        for (let j = 0; j < mat.length; j++) {
          if (mat[j]) mat[j].visible = true;
        }
      } else {
        mat.visible = true;
      }
    }
  }
}

export interface ClothingAndAccessoriesOptions {
  laraNude: boolean;
  laraTopOff: boolean;
  laraBottomOff: boolean;
  laraShoes: boolean;
  showAccessories: boolean;
  laraPistols: boolean;
  equipment: { holster: boolean; pistols: boolean; backpack: boolean };
}

export function applyClothingAndAccessoriesVisibility(parts: CharacterParts, opts: ClothingAndAccessoriesOptions) {
  const isTopNude = opts.laraNude || opts.laraTopOff;
  const isBottomNude = opts.laraNude || opts.laraBottomOff;

  // Boots / Feet / Gloves / Hands
  setPartVisibility(parts.boots, opts.laraShoes);
  setPartVisibility(parts.feet, !opts.laraShoes);
  setPartVisibility(parts.gloves, true);
  setPartVisibility(parts.hands, false);

  // Torso / Legs
  setPartVisibility(parts.torsoClothed, !isTopNude);
  setPartVisibility(parts.torsoNude, isTopNude);
  setPartVisibility(parts.legsClothed, !isBottomNude);
  setPartVisibility(parts.legsNude, isBottomNude);
  setPartVisibility(parts.bodyFull, !isTopNude && !isBottomNude);

  // Weapons & Accessories
  const showHandPistols = opts.showAccessories && opts.equipment.pistols && opts.laraPistols;
  const showHolsterPistols = opts.showAccessories && opts.equipment.pistols && !opts.laraPistols;
  const showHolsters = opts.showAccessories && opts.equipment.holster;
  const showBackpacks = opts.showAccessories && opts.equipment.backpack;
  const showOtherAcc = opts.showAccessories;

  setPartVisibility(parts.handPistols, showHandPistols);
  setPartVisibility(parts.holsterPistols, showHolsterPistols);
  setPartVisibility(parts.holsters, showHolsters);
  setPartVisibility(parts.backpacks, showBackpacks);
  setPartVisibility(parts.otherAccessories, showOtherAcc);
}

export interface RenderPropertiesOptions {
  characterShadows: boolean;
  showWallhack: boolean;
  characterWireframe: boolean;
}

export function applyRenderProperties(parts: CharacterParts, opts: RenderPropertiesOptions) {
  for (let i = 0; i < parts.allRenderMeshes.length; i++) {
    const item = parts.allRenderMeshes[i];
    const canCastShadow = opts.characterShadows && !item.isInternalInvisible;
    item.mesh.castShadow = canCastShadow;
    item.mesh.receiveShadow = canCastShadow;
    item.mesh.frustumCulled = true;

    const mat = item.mesh.material;
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (let j = 0; j < mats.length; j++) {
        const m = mats[j] as any;
        if (m) {
          m.depthTest = !opts.showWallhack;
          m.depthWrite = !opts.showWallhack;
          m.wireframe = opts.characterWireframe;
        }
      }
    }
  }
}
