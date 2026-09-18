import * as THREE from 'three';
import { ACCESSORIES_MESH_NAMES } from './walkerConfig';
import { resolveTargetBoneName, getDepth } from './retargeting/index';

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
      if (nLower.includes('breast') && !nLower.includes('end') && !nLower.includes('tip') && !nLower.includes('parent')) {
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
      if (!o.userData.restScale) {
        o.userData.restScale = o.scale.clone();
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

  // 4b. S'assurer que chaque os de buste a un os enfant d'extrémité (tip/end)
  // Indispensable pour que SkeletonHelper ("Voir Squelette") visualise les segments et pour la direction physique
  for (const bone of breastBones) {
    const hasBoneChild = bone.children.some((c: any) => c.isBone);
    if (!hasBoneChild) {
      const tipBone = new THREE.Bone();
      tipBone.name = bone.name.endsWith('_base') ? bone.name.replace('_base', '_end') : `${bone.name}_end`;
      const isMeters = Math.abs(bone.position.y) < 1.0 && Math.abs(bone.position.x) < 1.0;
      const tipDist = isMeters ? 0.08 : 8.0;
      tipBone.position.set(0, tipDist, 0);
      bone.add(tipBone);
      bone.updateMatrixWorld(true);
    }
  }

  // 5. Final Output Object
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
    item.mesh.frustumCulled = false;

    const mat = item.mesh.material;
    if (mat) {
      const mats = Array.isArray(mat) ? mat : [mat];
      for (let j = 0; j < mats.length; j++) {
        const m = mats[j] as any;
        if (m) {
          m.depthTest = !opts.showWallhack;
          m.depthWrite = opts.showWallhack ? false : !m.transparent;
          m.wireframe = opts.characterWireframe;
        }
      }
    }
  }
}

/**
 * Normalise les matériaux des personnages non-Lara (Sophia, Zoe, Gloria, Inyeong, Hayley, etc.)
 * - Supprime/masque les couches d'occlusion ou de larme opaques/parasites (ex: EyeOcclusion sur Sophia)
 * - Rétablit l'opacité et les reflets naturels pour les yeux (pupille + blanc des yeux)
 * - Assure la transparence et le non-blocage Z-buffer pour verres/visières et fards à paupières
 * - Applique alphaTest sur les cils
 */
export function normalizeNonLaraCharacterMaterials(scene: THREE.Object3D) {
  scene.traverse(node => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;

    const meshName = (mesh.name || '').toLowerCase();
    const mat = mesh.material;
    if (!mat) return;

    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach(m => {
      if (!m) return;
      const matName = (m.name || '').toLowerCase();

      // 1. Masquer les maillages d'occlusion oculaire ou de larmes qui créent un dôme noir/terne sur les yeux (ex: Sophia EyeOcclusion)
      if (
        meshName.includes('eyeocclusion') ||
        meshName.includes('eye_occlusion') ||
        matName.includes('eyeocclusion') ||
        matName.includes('eye_occlusion') ||
        matName.includes('eyemoisture') ||
        matName.includes('tear')
      ) {
        mesh.visible = false;
        m.visible = false;
        return;
      }

      // 2. Fards à paupières / maquillage (Zoe eyeshadow) : transparent sans écriture dans le Z-buffer
      if (matName.includes('eyeshadow') || meshName.includes('eyeshadow')) {
        m.transparent = true;
        m.depthWrite = false;
        m.needsUpdate = true;
        return;
      }

      // 4. Verres de lunettes et visières de casque (ex: Hayley, Inyeong)
      if (matName.includes('glass') || meshName.includes('glass') || matName.includes('lens')) {
        m.transparent = true;
        m.depthWrite = false;
        if ('opacity' in m && (m as any).opacity === 1) {
          (m as any).opacity = 0.5;
        }
        m.needsUpdate = true;
        return;
      }

      // 5. Cils, sourcils et cheveux : découpe alpha (alphaTest) OPAQUE pour éliminer les bugs de tri transparents
      const isHairOrLash = matName.includes('hair') ||
                          matName.includes('lash') ||
                          matName.includes('cil') ||
                          matName.includes('scalp') ||
                          meshName.includes('hair') ||
                          meshName.includes('lash') ||
                          meshName.includes('cil') ||
                          meshName.includes('scalp');

      if (isHairOrLash) {
        m.transparent = false;
        (m as any).alphaTest = 0.35;
        m.depthWrite = true;
        m.side = THREE.DoubleSide;
        // Cheveux/cils : diélectriques, pas de métal
        if ('metalness' in m) (m as any).metalness = 0.0;
        if ('metalnessMap' in m) (m as any).metalnessMap = null;
        if ('roughness' in m) (m as any).roughness = 0.85;
        if ('roughnessMap' in m) (m as any).roughnessMap = null;
        if ('specularIntensity' in m) (m as any).specularIntensity = 0.0;
        if ('specularIntensityMap' in m) (m as any).specularIntensityMap = null;
        if ('specularColorMap' in m) (m as any).specularColorMap = null;
        m.needsUpdate = true;
        return;
      }

      // 6. Traitement des yeux (pupille + cornée + blanc des yeux)
      const isEye = (matName.includes('eye') || meshName.includes('eye')) &&
                    !matName.includes('shadow') &&
                    !matName.includes('brow') &&
                    !meshName.includes('shadow') &&
                    !meshName.includes('brow');

      if (isEye) {
        m.visible = true;
        m.transparent = false;
        m.depthWrite = true;
        (m as any).alphaTest = 0;
        if ('color' in m && (m as any).color) {
          (m as any).color.setHex(0xffffff);
        }
        if ('emissive' in m && (m as any).emissive) {
          (m as any).emissive.setHex(0x000000);
        }
        if ('roughness' in m) (m as any).roughness = 0.2;
        if ('metalness' in m) (m as any).metalness = 0;
        if ('metalnessMap' in m) (m as any).metalnessMap = null;
        if ('roughnessMap' in m) (m as any).roughnessMap = null;
        m.needsUpdate = true;
        return;
      }

      // 7. TOUT LE RESTE (Corps, peau, visage, vêtements, chaussures, accessoires)
      // ── Correction du bug de brillance Mixamo ────────────────────────────────────
      // Mixamo exporte en Specular/Glossiness (legacy) converti en glTF PBR :
      //   • metallicFactor = 0.5 au lieu de 0 (peau/tissus sont des diélectriques)
      //   • La texture Glossiness est branchée comme roughnessMap, mais le sens est
      //     INVERSE (Glossiness 1.0 = miroir, Roughness 1.0 = mat) → effet latex/vinyl.
      //   • L'extension KHR_materials_specular ajoute des reflets parasites (hotspots).
      // Solution : forcer metalness=0, supprimer les maps erronées, roughness fixe mat.
      m.transparent = false;
      m.depthWrite = true;
      (m as any).alphaTest = 0;

      // Peau humaine, coton, polyester, cuir = diélectriques → metalness DOIT être 0
      if ('metalness' in m) (m as any).metalness = 0.0;
      // Supprimer la metalnessMap (canal B souvent non nul sur atlas Mixamo)
      if ('metalnessMap' in m) (m as any).metalnessMap = null;
      // Roughness mat : la Glossiness map branchée en roughnessMap donne ~0.25 (miroir)
      // On force une valeur physiquement cohérente pour tissu/peau et on retire la map.
      if ('roughness' in m) (m as any).roughness = 0.82;
      if ('roughnessMap' in m) (m as any).roughnessMap = null;
      // Neutraliser KHR_materials_specular (specularTexture → hotspots blancs brillants)
      if ('specularIntensity' in m) (m as any).specularIntensity = 0.0;
      if ('specularIntensityMap' in m) (m as any).specularIntensityMap = null;
      if ('specularColorMap' in m) (m as any).specularColorMap = null;

      m.needsUpdate = true;
    });
  });
}


