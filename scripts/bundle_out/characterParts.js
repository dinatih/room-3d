"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/features/scene/characterParts.ts
var characterParts_exports = {};
__export(characterParts_exports, {
  applyClothingAndAccessoriesVisibility: () => applyClothingAndAccessoriesVisibility,
  applyRenderProperties: () => applyRenderProperties,
  extractCharacterParts: () => extractCharacterParts,
  isHeadMesh: () => isHeadMesh,
  normalizeNonLaraCharacterMaterials: () => normalizeNonLaraCharacterMaterials,
  setPartVisibility: () => setPartVisibility
});
module.exports = __toCommonJS(characterParts_exports);
var THREE3 = __toESM(require("three"), 1);

// src/features/scene/walkerConfig.ts
var CHARACTERS = [
  // 12 stylized Laras (positions et animations gérées par l'IA sur leur zone d'action)
  { id: "native", name: "Native", emoji: "\u{1F947}", color: "#aaaaaa", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 173.4 },
  { id: "rosanna", name: "Rosanna", emoji: "\u{1F3C0}", color: "#ff8844", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "rosanna", height: 173.4 },
  { id: "marissa", name: "Marissa", emoji: "\u{1F487}\u200D\u2640\uFE0F", color: "#ff6b9d", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "marissa", height: 173.4 },
  { id: "delphina", name: "Delphina", emoji: "\u{1F415}\uFE0F", color: "#00ff88", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "delphina", height: 173.4 },
  { id: "sara", name: "Sara", emoji: "\u{1F9D7}\u200D\u2640\uFE0F", color: "#ff4444", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "sara", height: 173.4 },
  { id: "cha", name: "Cha", emoji: "\u{1F408}\uFE0F", color: "#00ccff", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "cha", height: 173.4 },
  { id: "vivida", name: "ViviDa", emoji: "\u{1FAC0}", color: "#ff4444", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "vivida", height: 173.4 },
  { id: "sabira", name: "Sabira", emoji: "\u{1F338}", color: "#ffff44", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "sabira", height: 173.4 },
  { id: "safa", name: "Safa", emoji: "\u26BD\uFE0F", color: "#88ff44", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "safa", height: 173.4 },
  { id: "romana", name: "Romana", emoji: "\u{1F476}", color: "#ffaacc", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "romana", height: 173.4 },
  { id: "angelina", name: "Angelina", emoji: "\u{1F9D1}\u200D\u{1F3EB}", color: "#00aaff", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "angelina", height: 173.4 },
  { id: "lgbta", name: "Lgbta", emoji: "\u{1F308}", color: "#cc88ff", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "lgbta", height: 173.4 },
  // Exception : Xbot
  { id: "xbot", name: "Xbot", emoji: "\u{1F916}", color: "#aaaaaa", path: "characters/xbot/Xbot_official.glb", pos: [288, 0, 603], rot: 0, variant: "native", height: 173.4, isLara: false },
  { id: "sandra", name: "Sandra", emoji: "\u{1F94A}", color: "#ff4444", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "sandra", height: 173.4 },
  { id: "rajaa", name: "Rajaa", emoji: "\u{1F697}", color: "#aacc44", path: "characters/lara/lara_native.glb", pos: [0, 0, 0], rot: 0, variant: "rajaa", height: 173.4 },
  { id: "hayley", name: "Hayley (Inyeong)", emoji: "\u{1F452}", color: "#ff66aa", path: "characters/hayley/hayley.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 168, isLara: false },
  { id: "gloria", name: "Gloria (Red Hair)", emoji: "\u{1F469}\u200D\u{1F9B0}", color: "#e04040", path: "characters/gloria/gloria.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 168, isLara: false },
  { id: "zoe", name: "Zoe (Red)", emoji: "\u{1F460}", color: "#c02040", path: "characters/zoe/zoe.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 168, isLara: false },
  { id: "sophia", name: "Sophia (Doll)", emoji: "\u{1F380}", color: "#ff77aa", path: "characters/sophia/sophia.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 168, isLara: false },
  { id: "alex", name: "Alex", emoji: "\u{1F9E2}", color: "#4a90e2", path: "characters/alex/alex.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 177.7, isLara: false },
  { id: "david", name: "David", emoji: "\u{1F454}", color: "#357abd", path: "characters/david/david.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 176.7, isLara: false },
  { id: "mannequin", name: "Mannequin", emoji: "\u{1F9CD}", color: "#888888", path: "characters/mannequin/mannequin.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 176.9, isLara: false },
  { id: "jennifer", name: "Jennifer", emoji: "\u{1F469}", color: "#f0932b", path: "characters/jennifer/jennifer.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 178.4, isLara: false },
  { id: "skeleton", name: "Skeleton", emoji: "\u{1F480}", color: "#e0e0e0", path: "characters/skeleton/skeleton.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 175, isLara: false },
  { id: "curious_skeleton", name: "Curious Skeleton", emoji: "\u{1F9B4}", color: "#dcdde1", path: "characters/curious_skeleton/curious_skeleton.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 175, isLara: false },
  { id: "valby", name: "Valby (Nano Suit)", emoji: "\u{1FAE7}", color: "#00d2ff", path: "characters/valby/valby.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 168, isLara: false },
  { id: "james", name: "James", emoji: "\u{1F9D1}", color: "#e74c3c", path: "characters/james/james.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 182, isLara: false },
  { id: "ivy", name: "Ivy", emoji: "\u{1F33F}", color: "#2ecc71", path: "characters/ivy/ivy.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 170.5, isLara: false },
  { id: "lewis", name: "Lewis", emoji: "\u{1F9D1}\u{1F3FE}\u200D\u{1F9B2}", color: "#d63031", path: "characters/lewis/lewis.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 175.6, isLara: false },
  { id: "maynard", name: "Maynard", emoji: "\u{1F47D}", color: "#636e72", path: "characters/maynard/maynard.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 177.2, isLara: false },
  { id: "nurse", name: "Nurse (Elf)", emoji: "\u{1FA7A}", color: "#fd79a8", path: "characters/nurse/nurse.glb", pos: [0, 0, 0], rot: 0, variant: "native", height: 172, isLara: false }
];
function findCharacter(id) {
  return CHARACTERS.find((c) => c.id === id);
}
var ACCESSORIES_MESH_NAMES = /* @__PURE__ */ new Set([
  "backpack",
  "oxygen",
  "binoculars",
  "buckle",
  "camera",
  "goggles",
  "grapple",
  "handgun_left",
  "handgun_right",
  "mp5",
  "mp5_ammo",
  "handgun_left_holster",
  "handgun_right_holster",
  "mp5_holster",
  "holster",
  "headset",
  "pda",
  "personal_light",
  "ribbon",
  "purse",
  "grenades",
  "accessories",
  "handgun_part"
]);
function isExtraCharacter(c) {
  const char = typeof c === "string" ? findCharacter(c) : c;
  if (!char) return false;
  return char.id !== "xbot" && char.isLara === false;
}
var EXTRA_CHARACTERS = CHARACTERS.filter(isExtraCharacter);

// src/features/scene/retargeting/boneMappings.ts
var BONE_SYNONYMS = {
  "Hips": ["hips", "pelvis", "cog", "roothips", "rootground", "hip"],
  "Spine": ["spine01", "spinelower", "spine0", "spine1", "spine"],
  "Spine2": ["spine02", "spineupper", "spine2", "spine03", "spine", "spine3"],
  "Neck": ["neck", "headnecklower"],
  "Head": ["head", "headneckupper"],
  "LeftShoulder": ["leftshoulder", "shoulderl", "claviclel", "armleftshoulder", "larmclavicle", "shlderl", "armleftshoulder1"],
  "LeftArm": ["armleftshoulder2", "upperarml", "larmhumerus", "upperarm.l", "upper_arm.l", "leftarm", "arm.l", "bicepl"],
  "LeftForeArm": ["lowerarml", "larmradius", "forearm.l", "forearm_l", "leftforearm", "armleftelbow", "forarml", "forearml"],
  "LeftHand": ["handl", "larmwrist", "hand.l", "hand_l", "wrist.l", "wrist_l", "lefthand", "armleftwrist", "palml"],
  "RightShoulder": ["rightshoulder", "shoulderr", "clavicler", "armrightshoulder", "rarmclavicle", "shlderr", "armrightshoulder1"],
  "RightArm": ["rightarm", "armrightshoulder2", "upperarmr", "rarmhumerus", "upperarm.r", "upper_arm.r", "arm.r", "bicepr"],
  "RightForeArm": ["lowerarmr", "rarmradius", "forearm.r", "forearm_r", "rightforearm", "armrightelbow", "forarmr", "forearmr"],
  "RightHand": ["handr", "rarmwrist", "hand.r", "hand_r", "wrist.r", "wrist_r", "righthand", "armrightwrist", "palmr"],
  "LeftUpLeg": ["legleftthigh", "thighl", "llegfemur", "thigh.l", "thigh_l", "leftupleg"],
  "LeftLeg": ["legleftknee", "calfl", "shinl", "llegtibia", "shin.l", "shin_l", "calf.l", "calf_l", "leftleg"],
  "LeftFoot": ["legleftankle", "footl", "llegankle", "foot.l", "foot_l", "ankle.l", "ankle_l", "leftfoot"],
  "LeftToeBase": ["leglefttoes", "balll", "toel", "llegball", "toe.l", "toe_l", "ball.l", "ball_l", "lefttoebase"],
  "RightUpLeg": ["legrightthigh", "thighr", "rlegfemur", "thigh.r", "thigh_r", "rightupleg"],
  "RightLeg": ["legrightknee", "calfr", "shinr", "rlegtibia", "shin.r", "shin_r", "calf.r", "calf_r", "rightleg"],
  "RightFoot": ["legrightankle", "footr", "rlegankle", "foot.r", "foot_r", "ankle.r", "ankle_r", "rightfoot"],
  "RightToeBase": ["legrighttoes", "ballr", "toer", "rlegball", "toe.r", "toe_r", "ball.r", "ball_r", "righttoebase"]
};

// src/features/scene/retargeting/hairChain.ts
var THREE = __toESM(require("three"), 1);
function getDepth(node) {
  let depth = 0;
  let curr = node;
  while (curr && curr.parent) {
    depth++;
    curr = curr.parent;
  }
  return depth;
}

// src/features/scene/retargeting/boneResolver.ts
function resolveTargetFingerBoneName(targetInstance, side, type, segment) {
  const sideChar = side.charAt(0).toLowerCase();
  const segmentIndex = parseInt(segment, 10) - 1;
  const segmentLetter = ["a", "b", "c"][segmentIndex] || "a";
  const candidates = [
    new RegExp(`^${type}${segment}_${sideChar}$`, "i"),
    new RegExp(`arm.*${side}.*finger.*${type === "thumb" ? 1 : type === "index" ? 2 : type === "middle" ? 3 : type === "ring" ? 4 : 5}${segmentLetter}`, "i"),
    new RegExp(`${type}_0${segment}_${sideChar}`, "i"),
    new RegExp(`${type === "thumb" ? "thumb" : "f_" + type}\\.0${segment}\\.${sideChar}`, "i"),
    new RegExp(`${sideChar}.*hand.*${type}.*${segmentIndex}`, "i"),
    new RegExp(`mixamorig.*${side}.*hand.*${type}.*${segment}`, "i"),
    new RegExp(`mixamorig_${side}_hand_${type}_${segment}`, "i"),
    new RegExp(`${side}_hand_${type}_${segment}`, "i")
  ];
  let foundName = null;
  targetInstance.traverse((node) => {
    if (node.isBone && !foundName) {
      for (const rx of candidates) {
        if (rx.test(node.name)) {
          foundName = node.name;
          break;
        }
      }
    }
  });
  return foundName;
}
var _targetBoneNameCache = /* @__PURE__ */ new WeakMap();
function resolveTargetBoneName(targetInstance, baseName, sourceHairMap = null) {
  let instanceCache = _targetBoneNameCache.get(targetInstance);
  if (!instanceCache) {
    instanceCache = /* @__PURE__ */ new Map();
    _targetBoneNameCache.set(targetInstance, instanceCache);
  }
  const cacheKey = sourceHairMap ? `${baseName}_withHairMap` : baseName;
  if (instanceCache.has(cacheKey)) {
    return instanceCache.get(cacheKey);
  }
  const baseNameLower = baseName.toLowerCase();
  if (baseNameLower.includes("hair") || baseNameLower.includes("ponytail")) {
    if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
      const targetName = sourceHairMap.get(baseNameLower);
      if (targetName && targetInstance.getObjectByName(targetName)) {
        instanceCache.set(cacheKey, targetName);
        return targetName;
      }
    }
    const numMatch = baseName.match(/(\d+)/);
    if (numMatch) {
      const N = numMatch[1];
      const targetName = `hair_${N}`;
      if (targetInstance.getObjectByName(targetName)) {
        instanceCache.set(cacheKey, targetName);
        return targetName;
      }
    }
  }
  const fingerMatch = baseName.match(/(?:Hand)?(Thumb|Index|Middle|Mid|Ring|Pinky)(\d)/i);
  if (fingerMatch && !baseName.toLowerCase().includes("toe")) {
    let side = baseName.toLowerCase().includes("left") ? "left" : "right";
    if (baseName.includes("_L_")) side = "left";
    if (baseName.includes("_R_")) side = "right";
    let type = fingerMatch[1].toLowerCase();
    if (type === "mid") type = "middle";
    const segment = fingerMatch[2];
    const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
    if (resolvedFinger) {
      instanceCache.set(cacheKey, resolvedFinger);
      return resolvedFinger;
    }
  }
  const synonyms = BONE_SYNONYMS[baseName];
  if (synonyms) {
    for (const syn of synonyms) {
      let foundName = null;
      targetInstance.traverse((node) => {
        if (node.isBone && !foundName) {
          const nameNormalized = node.name.toLowerCase().replace(/[:_ .\-]/g, "");
          if (nameNormalized === syn || nameNormalized.includes(syn) && !nameNormalized.includes(syn + "1") && !nameNormalized.includes(syn + "2") && !nameNormalized.includes(syn + "3") && !nameNormalized.includes(syn + "4")) {
            if (!nameNormalized.includes("twist") && !nameNormalized.includes("muscle") && !nameNormalized.includes("offset")) {
              foundName = node.name;
            }
          }
        }
      });
      if (foundName) {
        instanceCache.set(cacheKey, foundName);
        return foundName;
      }
    }
  }
  const candidates = [
    "mixamorig:" + baseName,
    "mixamorig_" + baseName,
    "mixamorig" + baseName,
    baseName,
    "mixamorig:" + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    "mixamorig_" + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    "mixamorig" + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1)
  ];
  for (const cand of candidates) {
    if (targetInstance.getObjectByName(cand)) {
      instanceCache.set(cacheKey, cand);
      return cand;
    }
  }
  instanceCache.set(cacheKey, null);
  return null;
}

// src/features/scene/retargeting/retargetClip.ts
var THREE2 = __toESM(require("three"), 1);

// src/features/scene/characterParts.ts
var HEAD_KEYWORDS = [
  "head",
  "face",
  "hair",
  "braid",
  "pony",
  "eye",
  "lash",
  "cil",
  "mouth",
  "teeth",
  "dent",
  "tongue",
  "langue",
  "cornea",
  "sclera",
  "pupil",
  "glasses",
  "scalp",
  "brow",
  "wig"
];
function isHeadMesh(mesh) {
  if (mesh.userData?.isHeadPart || mesh.userData?.isCustomHair || mesh.userData?.isWigRoot) return true;
  const meshName = (mesh.name || "").toLowerCase();
  const mat = mesh.material;
  const matNames = [];
  if (mat) {
    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach((m) => {
      if (m?.name) matNames.push(m.name.toLowerCase());
    });
  }
  const matStr = matNames.join(" ");
  return HEAD_KEYWORDS.some((kw) => meshName.includes(kw) || matStr.includes(kw));
}
var INTERNAL_INVISIBLE_KEYWORDS = [
  "teeth",
  "dent",
  "lash",
  "cil",
  "eye",
  "oeil",
  "tongue",
  "langue",
  "cornea",
  "sclera",
  "pupil",
  "mouth_inner"
];
function extractCharacterParts(scene) {
  const targetHairBones = [];
  scene.traverse((c) => {
    if (c.isBone) {
      const nameLower = (c.name || "").toLowerCase();
      if (nameLower.includes("hair") || nameLower.includes("ponytail") || nameLower.includes("braid") || nameLower.includes("pony")) {
        targetHairBones.push({ bone: c, depth: getDepth(c) });
      }
    }
  });
  targetHairBones.sort((a, b) => a.depth - b.depth);
  targetHairBones.forEach((hb, idx) => {
    hb.bone.name = `hair_${idx + 1}`;
  });
  const resolvedHipsName = resolveTargetBoneName(scene, "Hips");
  const hips = resolvedHipsName ? scene.getObjectByName(resolvedHipsName) : null;
  const rSpine2 = resolveTargetBoneName(scene, "Spine2");
  const spine2 = rSpine2 ? scene.getObjectByName(rSpine2) : null;
  const rSpine = resolveTargetBoneName(scene, "Spine");
  const spine = rSpine ? scene.getObjectByName(rSpine) : null;
  const rHead = resolveTargetBoneName(scene, "Head") || resolveTargetBoneName(scene, "Neck");
  const head = rHead ? scene.getObjectByName(rHead) : null;
  const rLShoulder = resolveTargetBoneName(scene, "LeftShoulder");
  const lShoulder = rLShoulder ? scene.getObjectByName(rLShoulder) : null;
  const rRShoulder = resolveTargetBoneName(scene, "RightShoulder");
  const rShoulder = rRShoulder ? scene.getObjectByName(rRShoulder) : null;
  const nativeHairBones = [];
  const breastBones = [];
  const boots = [];
  const feet = [];
  const gloves = [];
  const hands = [];
  const torsoClothed = [];
  const torsoNude = [];
  const legsClothed = [];
  const legsNude = [];
  const bodyFull = [];
  const handPistols = [];
  const holsterPistols = [];
  const holsters = [];
  const backpacks = [];
  const otherAccessories = [];
  const nativeHairMeshes = [];
  const lgbtaHairMaterials = [];
  const allRenderMeshes = [];
  scene.traverse((node) => {
    const o = node;
    if (o.isBone) {
      const nLower = (o.name || "").toLowerCase();
      if ((nLower.includes("hair") || nLower.includes("pony") || nLower.includes("braid")) && !o.userData.isCustomHair) {
        nativeHairBones.push(o);
      }
      if (nLower.includes("breast") && !nLower.includes("end") && !nLower.includes("tip") && !nLower.includes("parent")) {
        breastBones.push(o);
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
      o.restWorldQuaternion = o.getWorldQuaternion(new THREE3.Quaternion());
    }
    if (!o.restWorldPosition) {
      o.restWorldPosition = o.getWorldPosition(new THREE3.Vector3());
    }
    if (o.isMesh && !o.userData.isCustomHair) {
      const mesh = o;
      const name = (mesh.name || "").toLowerCase();
      const mat = mesh.material;
      const matNames = [];
      if (mat) {
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach((m) => {
          if (m?.name) matNames.push(m.name.toLowerCase());
          if (m && !lgbtaHairMaterials.includes(m) && (name.includes("hair") || name.includes("braid") || name.includes("pony") || m.name && (m.name.toLowerCase().includes("hair") || m.name.toLowerCase().includes("braid") || m.name.toLowerCase().includes("pony")))) {
            lgbtaHairMaterials.push(m);
          }
        });
      }
      const matStr = matNames.join(" ");
      const isInternalInvisible = INTERNAL_INVISIBLE_KEYWORDS.some((kw) => name.includes(kw) || matStr.includes(kw));
      allRenderMeshes.push({ mesh, isInternalInvisible });
      const isHairMesh = name.includes("hair") || name.includes("braid") || name.includes("pony") || matStr.includes("hair") || matStr.includes("braid") || matStr.includes("pony");
      if (isHairMesh) {
        nativeHairMeshes.push({ mesh });
      }
      let isAccessory = false;
      for (const accName of ACCESSORIES_MESH_NAMES) {
        const accNameSpace = accName.replace(/_/g, " ");
        if (name.includes(accName) || name.includes(accNameSpace) || matStr.includes(accName) || matStr.includes(accNameSpace)) {
          isAccessory = true;
          break;
        }
      }
      const isHandPistol = name.includes("handgun") && !name.includes("holster");
      const isHolsterPistol = name.includes("handgun") && name.includes("holster") || name === "holster" || name.includes("mp5_holster") || name.endsWith("_holster");
      const isHolster = name.includes("holster") || name.includes("gear") || name.includes("buckle") || matStr.includes("holster") || matStr.includes("gear") || matStr.includes("buckle");
      const isBackpack = name.includes("backpack") || name.includes("bag") || name.includes("pack") || matStr.includes("backpack") || matStr.includes("bag") || matStr.includes("pack");
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
      if (name === "boots" || name.includes("boots")) {
        boots.push({ mesh });
      } else if (name === "body_nude_feet" || name.includes("feet") || name.includes("5_feet")) {
        feet.push({ mesh });
      } else if (name === "gloves" || name === "fingers" || name.includes("gloves") || name.includes("fingers")) {
        gloves.push({ mesh });
      } else if (name === "body_nude_hands" || name.includes("hands") || name.includes("5_hands")) {
        hands.push({ mesh });
      } else if (name === "shirt" || name === "body_torso" || name.includes("torso") && !name.includes("nude") || name.includes("shirt")) {
        torsoClothed.push({ mesh });
      } else if (name === "body_nude_torso" || name.includes("torso") && name.includes("nude") || name.includes("5_body_torso")) {
        torsoNude.push({ mesh });
      } else if (name === "shorts" || name === "body_legs" || name.includes("legs") && !name.includes("nude") || name.includes("shorts")) {
        legsClothed.push({ mesh });
      } else if (name === "body_nude_legs" || name === "body_nude_panties" || name.includes("legs") && name.includes("nude") || name.includes("panties") || name.includes("5_body_legs") || name.includes("5_panties")) {
        legsNude.push({ mesh });
      } else if (name === "body") {
        bodyFull.push({ mesh });
      }
    }
  });
  for (const bone of breastBones) {
    const hasBoneChild = bone.children.some((c) => c.isBone);
    if (!hasBoneChild) {
      const tipBone = new THREE3.Bone();
      tipBone.name = bone.name.endsWith("_base") ? bone.name.replace("_base", "_end") : `${bone.name}_end`;
      const isMeters = Math.abs(bone.position.y) < 1 && Math.abs(bone.position.x) < 1;
      const tipDist = isMeters ? 0.08 : 8;
      tipBone.position.set(0, tipDist, 0);
      bone.add(tipBone);
      bone.updateMatrixWorld(true);
    }
  }
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
function setPartVisibility(partList, visible) {
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
function applyClothingAndAccessoriesVisibility(parts, opts) {
  const isTopNude = opts.laraNude || opts.laraTopOff;
  const isBottomNude = opts.laraNude || opts.laraBottomOff;
  setPartVisibility(parts.boots, opts.laraShoes);
  setPartVisibility(parts.feet, !opts.laraShoes);
  setPartVisibility(parts.gloves, true);
  setPartVisibility(parts.hands, false);
  setPartVisibility(parts.torsoClothed, !isTopNude);
  setPartVisibility(parts.torsoNude, isTopNude);
  setPartVisibility(parts.legsClothed, !isBottomNude);
  setPartVisibility(parts.legsNude, isBottomNude);
  setPartVisibility(parts.bodyFull, !isTopNude && !isBottomNude);
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
function applyRenderProperties(parts, opts) {
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
        const m = mats[j];
        if (m) {
          m.depthTest = !opts.showWallhack;
          m.depthWrite = opts.showWallhack ? false : !m.transparent;
          m.wireframe = opts.characterWireframe;
        }
      }
    }
  }
}
function normalizeNonLaraCharacterMaterials(scene, characterId) {
  scene.traverse((node) => {
    const mesh = node;
    if (!mesh.isMesh) return;
    const meshName = (mesh.name || "").toLowerCase();
    const mat = mesh.material;
    if (!mat) return;
    const mats = Array.isArray(mat) ? mat : [mat];
    mats.forEach((m) => {
      if (!m) return;
      const matName = (m.name || "").toLowerCase();
      if (meshName.includes("eyeocclusion") || meshName.includes("eye_occlusion") || matName.includes("eyeocclusion") || matName.includes("eye_occlusion") || matName.includes("eyemoisture") || matName.includes("tear")) {
        mesh.visible = false;
        m.visible = false;
        return;
      }
      if (matName.includes("eyeshadow") || meshName.includes("eyeshadow")) {
        m.transparent = true;
        m.depthWrite = false;
        m.needsUpdate = true;
        return;
      }
      if (matName.includes("glass") || meshName.includes("glass") || matName.includes("lens")) {
        m.transparent = true;
        m.depthWrite = false;
        if ("opacity" in m && m.opacity === 1) {
          m.opacity = 0.5;
        }
        m.needsUpdate = true;
        return;
      }
      const isHairOrLash = matName.includes("hair") || matName.includes("lash") || matName.includes("cil") || matName.includes("scalp") || meshName.includes("hair") || meshName.includes("lash") || meshName.includes("cil") || meshName.includes("scalp");
      if (isHairOrLash) {
        m.transparent = false;
        m.alphaTest = 0.35;
        m.depthWrite = true;
        m.side = THREE3.DoubleSide;
        if ("metalness" in m) m.metalness = 0;
        if ("metalnessMap" in m) m.metalnessMap = null;
        if ("roughness" in m) m.roughness = 0.85;
        if ("roughnessMap" in m) m.roughnessMap = null;
        if ("specularIntensity" in m) m.specularIntensity = 0;
        if ("specularIntensityMap" in m) m.specularIntensityMap = null;
        if ("specularColorMap" in m) m.specularColorMap = null;
        m.needsUpdate = true;
        return;
      }
      const isEye = (matName.includes("eye") || meshName.includes("eye")) && !matName.includes("shadow") && !matName.includes("brow") && !meshName.includes("shadow") && !meshName.includes("brow");
      if (isEye) {
        m.visible = true;
        m.transparent = false;
        m.depthWrite = true;
        m.alphaTest = 0;
        if ("color" in m && m.color) {
          m.color.setHex(16777215);
        }
        if ("emissive" in m && m.emissive) {
          m.emissive.setHex(0);
        }
        if ("roughness" in m) m.roughness = 0.2;
        if ("metalness" in m) m.metalness = 0;
        if ("metalnessMap" in m) m.metalnessMap = null;
        if ("roughnessMap" in m) m.roughnessMap = null;
        m.needsUpdate = true;
        return;
      }
      m.transparent = false;
      m.depthWrite = true;
      m.alphaTest = 0;
      if ("metalness" in m) m.metalness = 0;
      if ("metalnessMap" in m) m.metalnessMap = null;
      if ("roughness" in m) m.roughness = 0.82;
      if ("roughnessMap" in m) m.roughnessMap = null;
      if ("specularIntensity" in m) m.specularIntensity = 0;
      if ("specularIntensityMap" in m) m.specularIntensityMap = null;
      if ("specularColorMap" in m) m.specularColorMap = null;
      if (characterId === "mannequin" || meshName.includes("mannequin") || matName.includes("ch36")) {
        if ("color" in m && m.color) {
          m.color.set("#7a7068");
        }
      }
      m.needsUpdate = true;
    });
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  applyClothingAndAccessoriesVisibility,
  applyRenderProperties,
  extractCharacterParts,
  isHeadMesh,
  normalizeNonLaraCharacterMaterials,
  setPartVisibility
});
