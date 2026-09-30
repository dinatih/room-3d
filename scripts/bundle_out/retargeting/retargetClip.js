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

// src/features/scene/retargeting/retargetClip.ts
var retargetClip_exports = {};
__export(retargetClip_exports, {
  retargetClip: () => retargetClip
});
module.exports = __toCommonJS(retargetClip_exports);
var THREE2 = __toESM(require("three"), 1);

// src/features/scene/retargeting/boneMappings.ts
var CC3_TO_MIXAMO = {
  "CC_Base_Waist": "Spine",
  "CC_Base_Spine01": "Spine1",
  "CC_Base_Spine02": "Spine2",
  "CC_Base_NeckTwist01": "Neck",
  "CC_Base_NeckTwist02": "Neck",
  "CC_Base_Head": "Head",
  "CC_Base_L_Clavicle": "LeftShoulder",
  "CC_Base_L_Upperarm": "LeftArm",
  "CC_Base_L_Forearm": "LeftForeArm",
  "CC_Base_L_Hand": "LeftHand",
  "CC_Base_R_Clavicle": "RightShoulder",
  "CC_Base_R_Upperarm": "RightArm",
  "CC_Base_R_Forearm": "RightForeArm",
  "CC_Base_R_Hand": "RightHand",
  "CC_Base_L_Thigh": "LeftUpLeg",
  "CC_Base_L_Calf": "LeftLeg",
  "CC_Base_L_Foot": "LeftFoot",
  "CC_Base_L_ToeBase": "LeftToeBase",
  "CC_Base_R_Thigh": "RightUpLeg",
  "CC_Base_R_Calf": "RightLeg",
  "CC_Base_R_Foot": "RightFoot",
  "CC_Base_R_ToeBase": "RightToeBase",
  "CC_Base_L_Thumb1": "LeftHandThumb1",
  "CC_Base_L_Thumb2": "LeftHandThumb2",
  "CC_Base_L_Thumb3": "LeftHandThumb3",
  "CC_Base_L_Index1": "LeftHandIndex1",
  "CC_Base_L_Index2": "LeftHandIndex2",
  "CC_Base_L_Index3": "LeftHandIndex3",
  "CC_Base_L_Mid1": "LeftHandMiddle1",
  "CC_Base_L_Mid2": "LeftHandMiddle2",
  "CC_Base_L_Mid3": "LeftHandMiddle3",
  "CC_Base_L_Ring1": "LeftHandRing1",
  "CC_Base_L_Ring2": "LeftHandRing2",
  "CC_Base_L_Ring3": "LeftHandRing3",
  "CC_Base_L_Pinky1": "LeftHandPinky1",
  "CC_Base_L_Pinky2": "LeftHandPinky2",
  "CC_Base_L_Pinky3": "LeftHandPinky3",
  "CC_Base_R_Thumb1": "RightHandThumb1",
  "CC_Base_R_Thumb2": "RightHandThumb2",
  "CC_Base_R_Thumb3": "RightHandThumb3",
  "CC_Base_R_Index1": "RightHandIndex1",
  "CC_Base_R_Index2": "RightHandIndex2",
  "CC_Base_R_Index3": "RightHandIndex3",
  "CC_Base_R_Mid1": "RightHandMiddle1",
  "CC_Base_R_Mid2": "RightHandMiddle2",
  "CC_Base_R_Mid3": "RightHandMiddle3",
  "CC_Base_R_Ring1": "RightHandRing1",
  "CC_Base_R_Ring2": "RightHandRing2",
  "CC_Base_R_Ring3": "RightHandRing3",
  "CC_Base_R_Pinky1": "RightHandPinky1",
  "CC_Base_R_Pinky2": "RightHandPinky2",
  "CC_Base_R_Pinky3": "RightHandPinky3"
};
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
function retargetClip(rawClip, targetInstance, animScene) {
  const animBones = {};
  const sourceHairMap = /* @__PURE__ */ new Map();
  if (animScene) {
    animScene.updateMatrixWorld(true);
    animScene.traverse((c) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = CC3_TO_MIXAMO[name];
        const match = name.match(/mixamorig[:_]?(.+)/i);
        const baseName = match ? match[1] : name;
        if (baseName === "LeftArm" || baseName === "RightArm") {
          const wQ = c.getWorldQuaternion(new THREE2.Quaternion());
          const dir = new THREE2.Vector3(0, 1, 0).applyQuaternion(wQ);
          if (dir.y < -0.1) {
            const targetDir = name === "LeftArm" ? new THREE2.Vector3(1, 0, 0) : new THREE2.Vector3(-1, 0, 0);
            const offsetQ = new THREE2.Quaternion().setFromUnitVectors(dir.normalize(), targetDir);
            const pWQ = c.parent ? c.parent.getWorldQuaternion(new THREE2.Quaternion()) : new THREE2.Quaternion();
            const newWorldQ = offsetQ.clone().multiply(wQ);
            c.quaternion.copy(pWQ.invert().multiply(newWorldQ));
          }
        }
      }
    });
    animScene.updateMatrixWorld(true);
    const sourceHairBones = [];
    animScene.traverse((c) => {
      if (c.isBone) {
        const nameLower = (c.name || "").toLowerCase();
        if (nameLower.includes("hair") || nameLower.includes("ponytail")) {
          const match = c.name.match(/mixamorig[:_]?(.+)/i);
          const base = match ? match[1] : c.name;
          sourceHairBones.push({ bone: c, baseName: base, depth: getDepth(c) });
        }
      }
    });
    sourceHairBones.sort((a, b) => a.depth - b.depth);
    sourceHairBones.forEach((hb, idx) => {
      sourceHairMap.set(hb.baseName.toLowerCase(), `hair_${idx + 1}`);
    });
    animScene.traverse((c) => {
      if (c.isBone) {
        let name = c.name;
        if (CC3_TO_MIXAMO[name]) name = "mixamorig:" + CC3_TO_MIXAMO[name];
        const match = name.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          animBones[match[1]] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE2.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE2.Quaternion()) : new THREE2.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
        } else if (name.toLowerCase() === "cc_base_boneroot" || name.toLowerCase() === "rootjoint") {
          animBones["RootJoint"] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE2.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE2.Quaternion()) : new THREE2.Quaternion(),
            defaultPosition: c.position.clone(),
            bone: c
          };
        }
      }
    });
  }
  const clonedTracks = [];
  for (const track of rawClip.tracks) {
    const cl = track.clone();
    cl.times = new Float32Array(track.times);
    cl.values = new Float32Array(track.values);
    clonedTracks.push(cl);
  }
  const workingClip = new THREE2.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);
  for (const track of workingClip.tracks) {
    if (track.name.endsWith(".position")) {
      let maxVal = 0;
      for (let i = 0; i < track.values.length; i++) {
        if (Math.abs(track.values[i]) > maxVal) {
          maxVal = Math.abs(track.values[i]);
        }
      }
      if (maxVal > 5) {
        for (let i = 0; i < track.values.length; i++) {
          track.values[i] *= 0.01;
        }
      }
    }
  }
  const rootRotTrackIndex = workingClip.tracks.findIndex((t) => (t.name.toLowerCase().includes("rootjoint") || t.name.toLowerCase().includes("cc_base_boneroot")) && t.name.endsWith(".quaternion"));
  const hipsRotTrackIndex = workingClip.tracks.findIndex((t) => (t.name.toLowerCase().includes("hips") || t.name.toLowerCase().includes("hip") || t.name.toLowerCase().includes("pelvis")) && t.name.endsWith(".quaternion") && !(t.name.toLowerCase().includes("rootjoint") || t.name.toLowerCase().includes("cc_base_boneroot")));
  const evaluateQuaternionTrack = (track, t) => {
    const trackTimes = track.times;
    const trackValues = track.values;
    if (t <= trackTimes[0]) {
      return new THREE2.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
    }
    if (t >= trackTimes[trackTimes.length - 1]) {
      const idx = (trackTimes.length - 1) * 4;
      return new THREE2.Quaternion(trackValues[idx], trackValues[idx + 1], trackValues[idx + 2], trackValues[idx + 3]);
    }
    let i = 0;
    while (i < trackTimes.length - 1 && trackTimes[i + 1] < t) {
      i++;
    }
    const t0 = trackTimes[i];
    const t1 = trackTimes[i + 1];
    const alpha = (t - t0) / (t1 - t0);
    const q0 = new THREE2.Quaternion(trackValues[4 * i], trackValues[4 * i + 1], trackValues[4 * i + 2], trackValues[4 * i + 3]);
    const q1 = new THREE2.Quaternion(trackValues[4 * (i + 1)], trackValues[4 * (i + 1) + 1], trackValues[4 * (i + 1) + 2], trackValues[4 * (i + 1) + 3]);
    return q0.slerp(q1, alpha);
  };
  if (rootRotTrackIndex !== -1) {
    const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
    if (hipsRotTrackIndex !== -1) {
      const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
      const timesSet = /* @__PURE__ */ new Set([...rootRotTrack.times, ...hipsRotTrack.times]);
      const times = Array.from(timesSet).sort((a, b) => a - b);
      const values = new Float32Array(times.length * 4);
      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
        const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
        const qCombined = qRoot.clone().multiply(qHips);
        values[4 * i] = qCombined.x;
        values[4 * i + 1] = qCombined.y;
        values[4 * i + 2] = qCombined.z;
        values[4 * i + 3] = qCombined.w;
      }
      const newHipsRotTrack = new THREE2.QuaternionKeyframeTrack("mixamorig:Hips.quaternion", new Float32Array(times), values);
      workingClip.tracks.splice(hipsRotTrackIndex, 1, newHipsRotTrack);
      const updatedRootRotTrackIndex = workingClip.tracks.indexOf(rootRotTrack);
      if (updatedRootRotTrackIndex !== -1) {
        workingClip.tracks.splice(updatedRootRotTrackIndex, 1);
      }
    } else {
      rootRotTrack.name = "mixamorig:Hips.quaternion";
    }
  }
  const rootPosTrackIndex = workingClip.tracks.findIndex((t) => (t.name.toLowerCase().includes("rootjoint") || t.name.toLowerCase().includes("cc_base_boneroot")) && t.name.endsWith(".position"));
  const hipsPosTrackIndex = workingClip.tracks.findIndex((t) => (t.name.toLowerCase().includes("hips") || t.name.toLowerCase().includes("hip") || t.name.toLowerCase().includes("pelvis") || t.name.toLowerCase().endsWith("hips.position")) && t.name.endsWith(".position") && !(t.name.toLowerCase().includes("rootjoint") || t.name.toLowerCase().includes("cc_base_boneroot")));
  if (rootPosTrackIndex !== -1) {
    const rootPosTrack = workingClip.tracks[rootPosTrackIndex];
    let hipsPosTrack = hipsPosTrackIndex !== -1 ? workingClip.tracks[hipsPosTrackIndex] : null;
    if (!hipsPosTrack && animBones["Hips"]) {
      const defPos = animBones["Hips"].defaultPosition.clone();
      if (defPos.length() > 5) defPos.multiplyScalar(0.01);
      hipsPosTrack = new THREE2.VectorKeyframeTrack(
        "mixamorig:Hips.position",
        [0],
        [defPos.x, defPos.y, defPos.z]
      );
    }
    if (hipsPosTrack) {
      const rootRotTrack = rawClip.tracks.find((t) => (t.name.toLowerCase().includes("rootjoint") || t.name.toLowerCase().includes("cc_base_boneroot")) && t.name.endsWith(".quaternion"));
      if (rootRotTrack) {
        const posTimes = rootPosTrack.times;
        const posValues = new Float32Array(posTimes.length * 3);
        const evaluateVectorTrack = (track, t) => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE2.Vector3(trackValues[0], trackValues[1], trackValues[2]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 3;
            return new THREE2.Vector3(trackValues[idx], trackValues[idx + 1], trackValues[idx + 2]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i + 1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i + 1] - trackTimes[i]);
          const v0 = new THREE2.Vector3(trackValues[3 * i], trackValues[3 * i + 1], trackValues[3 * i + 2]);
          const v1 = new THREE2.Vector3(trackValues[3 * (i + 1)], trackValues[3 * (i + 1) + 1], trackValues[3 * (i + 1) + 2]);
          return v0.lerp(v1, alpha);
        };
        const evaluateQuaternionTrack2 = (track, t) => {
          const trackTimes = track.times;
          const trackValues = track.values;
          if (t <= trackTimes[0]) return new THREE2.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
          if (t >= trackTimes[trackTimes.length - 1]) {
            const idx = (trackTimes.length - 1) * 4;
            return new THREE2.Quaternion(trackValues[idx], trackValues[idx + 1], trackValues[idx + 2], trackValues[idx + 3]);
          }
          let i = 0;
          while (i < trackTimes.length - 1 && trackTimes[i + 1] < t) i++;
          const alpha = (t - trackTimes[i]) / (trackTimes[i + 1] - trackTimes[i]);
          const q0 = new THREE2.Quaternion(trackValues[4 * i], trackValues[4 * i + 1], trackValues[4 * i + 2], trackValues[4 * i + 3]);
          const q1 = new THREE2.Quaternion(trackValues[4 * (i + 1)], trackValues[4 * (i + 1) + 1], trackValues[4 * (i + 1) + 2], trackValues[4 * (i + 1) + 3]);
          return q0.slerp(q1, alpha);
        };
        const pRootRest = evaluateVectorTrack(rootPosTrack, posTimes[0]);
        for (let i = 0; i < posTimes.length; i++) {
          const t = posTimes[i];
          const pRoot = evaluateVectorTrack(rootPosTrack, t);
          const pHips = evaluateVectorTrack(hipsPosTrack, t);
          const qRoot = evaluateQuaternionTrack2(rootRotTrack, t);
          const pHipsWorld = pHips.clone().applyQuaternion(qRoot);
          const pRootDelta = pRoot.clone().sub(pRootRest);
          const pFinalWorld = pRootDelta.add(pHipsWorld);
          posValues[3 * i] = pFinalWorld.x;
          posValues[3 * i + 1] = pFinalWorld.y;
          posValues[3 * i + 2] = pFinalWorld.z;
        }
        const newHipsPosTrack = new THREE2.VectorKeyframeTrack("mixamorig:Hips.position", new Float32Array(posTimes), posValues);
        if (hipsPosTrackIndex !== -1) {
          workingClip.tracks.splice(hipsPosTrackIndex, 1, newHipsPosTrack);
        } else {
          workingClip.tracks.push(newHipsPosTrack);
        }
        const updatedRootPosTrackIndex = workingClip.tracks.indexOf(rootPosTrack);
        if (updatedRootPosTrackIndex !== -1) {
          workingClip.tracks.splice(updatedRootPosTrackIndex, 1);
        }
      }
    }
  }
  let srcHipsDefaultY = 0.991;
  let computedHipsRatio = 100;
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split(".");
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (match) {
      const baseName = match[1];
      if (prop === "position" && baseName.toLowerCase() === "hips") {
        const resolvedHipsName = resolveTargetBoneName(targetInstance, "Hips", sourceHairMap);
        const bone = resolvedHipsName ? targetInstance.getObjectByName(resolvedHipsName) : null;
        let refSrcY = 0.991;
        if (animBones[baseName] && animBones[baseName].defaultPosition) {
          refSrcY = animBones[baseName].defaultPosition.length();
        } else {
          refSrcY = 0.991;
        }
        if (refSrcY > 5) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;
        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = bone.defaultPosition.length();
        }
        if (Math.abs(refSrcY) > 0) {
          computedHipsRatio = targetHipsHeight / Math.abs(refSrcY);
        }
      }
    }
  }
  const tracks = [];
  const targetHasLeftClavicle = Boolean(resolveTargetBoneName(targetInstance, "LeftShoulder", sourceHairMap));
  const targetHasRightClavicle = Boolean(resolveTargetBoneName(targetInstance, "RightShoulder", sourceHairMap));
  const targetHasSpine1 = Boolean(resolveTargetBoneName(targetInstance, "Spine1", sourceHairMap));
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split(".");
    let mappedBoneFull = boneFull;
    if (CC3_TO_MIXAMO[boneFull]) mappedBoneFull = "mixamorig:" + CC3_TO_MIXAMO[boneFull];
    let match = mappedBoneFull.match(/mixamorig[:_]?(.+)/i);
    let baseName = match ? match[1] : "";
    if (mappedBoneFull.toLowerCase() === "cc_base_boneroot" || mappedBoneFull.toLowerCase() === "rootjoint") {
      baseName = "Hips";
      match = ["Hips", "Hips"];
    }
    if (!match) continue;
    let isRootJointTranslation = false;
    if (prop === "position" && (boneFull.toLowerCase().includes("rootjoint") || boneFull.toLowerCase().includes("cc_base_boneroot"))) {
      baseName = "Hips";
      isRootJointTranslation = true;
    }
    const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
    if (!targetBoneName) continue;
    if (prop === "scale") continue;
    const isHips = targetBoneName.toLowerCase().endsWith("hips") || targetBoneName.toLowerCase().includes("pelvis");
    if (prop === "position" && !isHips) continue;
    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;
    if (prop === "position" && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName);
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (isRootJointTranslation) {
          P_src = new THREE2.Quaternion();
        } else if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          P_src = new THREE2.Quaternion();
        }
        const P_tgt = bone.parent && bone.parent.restWorldQuaternion ? bone.parent.restWorldQuaternion : new THREE2.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();
        let srcRestPos = null;
        if (isRootJointTranslation) {
          srcRestPos = new THREE2.Vector3(0, srcHipsDefaultY, 0);
        } else if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition.clone();
          if (srcRestPos.length() > 5) {
            srcRestPos.multiplyScalar(0.01);
          }
        } else {
          srcRestPos = new THREE2.Vector3(0, srcHipsDefaultY * 100, 0);
          if (srcRestPos.length() > 5) {
            srcRestPos.multiplyScalar(0.01);
          }
        }
        const restX = clone.values[0];
        const restY = clone.values[1];
        const restZ = clone.values[2];
        let isFlat = true;
        for (let j = 1; j < clone.values.length / 3; j++) {
          if (Math.abs(clone.values[3 * j] - restX) > 1e-3 || Math.abs(clone.values[3 * j + 1] - restY) > 1e-3 || Math.abs(clone.values[3 * j + 2] - restZ) > 1e-3) {
            isFlat = false;
            break;
          }
        }
        const animNameLower = rawClip.name.toLowerCase();
        const isYoga = animNameLower.includes("yoga");
        const isWalk = !isYoga && (animNameLower.includes("walk") || animNameLower.includes("run") || animNameLower.includes("step") || animNameLower.includes("stairs")) && !animNameLower.includes("dance");
        if (isFlat && isWalk) {
          const duration = workingClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);
          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            const phase = t / duration * 2 * Math.PI;
            const dx = 0.5 * Math.cos(phase);
            const dy = 0;
            const dz = 0;
            const dP = new THREE2.Vector3(dx, dy, dz).applyQuaternion(P_src).applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);
            newValues[3 * f] = resPos.x;
            newValues[3 * f + 1] = resPos.y;
            newValues[3 * f + 2] = resPos.z;
          }
          clone.times = newTimes;
          clone.values = newValues;
        } else {
          let yMinDelta = 0;
          if (animNameLower.includes("takedown")) {
            let minY = Infinity;
            for (let j = 0; j < clone.values.length / 3; j++) {
              if (clone.values[3 * j + 1] < minY) minY = clone.values[3 * j + 1];
            }
            if (minY < 0) {
              yMinDelta = -minY;
            }
          }
          const isLayingAnim = animNameLower.includes("laying") || animNameLower.includes("sleeping") || animNameLower.includes("situps");
          if (isLayingAnim) {
            const isBoneInMeters = bone.defaultPosition && bone.defaultPosition.length() < 5;
            const targetHipsHeight = bone.defaultPosition ? bone.defaultPosition.length() : isBoneInMeters ? 0.991 : 99.1;
            const groundHipsY = isBoneInMeters ? 0.12 : 12;
            const f0Raw = new THREE2.Vector3(clone.values[0], clone.values[1], clone.values[2]);
            const f0World = f0Raw.applyQuaternion(P_src).multiplyScalar(computedHipsRatio);
            for (let j = 0; j < clone.values.length / 3; j++) {
              const rawPos = new THREE2.Vector3(clone.values[3 * j], clone.values[3 * j + 1], clone.values[3 * j + 2]);
              const worldPos = rawPos.applyQuaternion(P_src).multiplyScalar(computedHipsRatio);
              const animDeltaX = worldPos.x - f0World.x;
              const animDeltaY = worldPos.y - f0World.y;
              const animDeltaZ = worldPos.z - f0World.z;
              const deltaWorld = new THREE2.Vector3(
                animDeltaX,
                groundHipsY + animDeltaY - targetHipsHeight,
                animDeltaZ
              );
              const dP = deltaWorld.applyQuaternion(P_tgt_inv);
              const resPos = bone.defaultPosition.clone().add(dP);
              clone.values[3 * j] = resPos.x;
              clone.values[3 * j + 1] = resPos.y;
              clone.values[3 * j + 2] = resPos.z;
            }
          } else {
            for (let j = 0; j < clone.values.length / 3; j++) {
              let yVal = clone.values[3 * j + 1] + yMinDelta;
              const isTPose = animNameLower.includes("t-pose") || animNameLower.includes("t_pose");
              const dy = isWalk || isTPose ? 0 : (yVal - srcRestPos.y) * computedHipsRatio;
              const dx = isWalk || isTPose ? 0 : (clone.values[3 * j] - srcRestPos.x) * computedHipsRatio;
              const dz = isWalk || isTPose ? 0 : (clone.values[3 * j + 2] - srcRestPos.z) * computedHipsRatio;
              const dP = new THREE2.Vector3(dx, dy, dz).applyQuaternion(P_src).applyQuaternion(P_tgt_inv);
              const resPos = bone.defaultPosition.clone().add(dP);
              clone.values[3 * j] = resPos.x;
              clone.values[3 * j + 1] = resPos.y;
              clone.values[3 * j + 2] = resPos.z;
            }
          }
        }
      }
    }
    if (prop === "quaternion") {
      const bone = targetInstance.getObjectByName(targetBoneName);
      if (bone) {
        if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
          let B_src = null;
          let P_src = null;
          let parentBakeTrack = null;
          let parentBakeRestWorld = new THREE2.Quaternion();
          if (animBones[baseName]) {
            B_src = animBones[baseName].restWorldQuaternion.clone();
            P_src = animBones[baseName].parentRestWorldQuaternion.clone();
            if (isHips) {
              B_src = new THREE2.Quaternion();
            }
            if (baseName === "LeftArm" || baseName === "RightArm") {
              const targetHasClavicle = baseName === "LeftArm" ? targetHasLeftClavicle : targetHasRightClavicle;
              if (!targetHasClavicle) {
                const clavicleSourceNode = animBones[baseName].bone.parent;
                if (clavicleSourceNode) {
                  const sNodeName = clavicleSourceNode.name.toLowerCase().replace(/[:_]/g, "");
                  parentBakeTrack = rawClip.tracks.find((t) => {
                    if (!t.name.endsWith(".quaternion")) return false;
                    const bName = t.name.split(".")[0].toLowerCase().replace(/[:_]/g, "");
                    return bName === sNodeName || bName.endsWith(baseName === "LeftArm" ? "leftshoulder" : "rightshoulder");
                  }) || null;
                  if (parentBakeTrack) {
                    const clavicleRestLocal = clavicleSourceNode.quaternion.clone();
                    parentBakeRestWorld = P_src.clone().multiply(clavicleRestLocal.invert());
                  }
                }
              }
            } else if (baseName === "Spine2" && !targetHasSpine1) {
              const spine1SourceNode = animBones[baseName].bone.parent;
              if (spine1SourceNode) {
                const sNodeName = spine1SourceNode.name.toLowerCase().replace(/[:_]/g, "");
                parentBakeTrack = rawClip.tracks.find((t) => {
                  if (!t.name.endsWith(".quaternion")) return false;
                  const bName = t.name.split(".")[0].toLowerCase().replace(/[:_]/g, "");
                  return bName === sNodeName || bName.endsWith("spine1");
                }) || null;
                if (parentBakeTrack) {
                  const spine1RestLocal = spine1SourceNode.quaternion.clone();
                  parentBakeRestWorld = P_src.clone().multiply(spine1RestLocal.invert());
                }
              }
            }
          } else {
            B_src = new THREE2.Quaternion();
            P_src = new THREE2.Quaternion();
          }
          if (B_src && P_src) {
            let B_tgt = bone.restWorldQuaternion;
            if (baseName === "LeftArm" || baseName === "RightArm") {
              const childBone = bone.children.find((c) => c.isBone);
              if (childBone) {
                const boneWorldPos = bone.restWorldPosition || bone.getWorldPosition(new THREE2.Vector3());
                const childWorldPos = childBone.restWorldPosition || childBone.getWorldPosition(new THREE2.Vector3());
                const worldArmDir = childWorldPos.clone().sub(boneWorldPos).normalize();
                if (worldArmDir.y < -0.15) {
                  const targetDir = baseName === "LeftArm" ? new THREE2.Vector3(1, 0, 0) : new THREE2.Vector3(-1, 0, 0);
                  const aPoseOffset = new THREE2.Quaternion().setFromUnitVectors(worldArmDir, targetDir);
                  B_tgt = aPoseOffset.multiply(bone.restWorldQuaternion.clone());
                }
              }
            }
            const P_tgt = bone.parent && bone.parent.restWorldQuaternion ? bone.parent.restWorldQuaternion : new THREE2.Quaternion();
            const P_tgt_inv = P_tgt.clone().invert();
            const B_src_inv = B_src.clone().invert();
            for (let j = 0; j < clone.values.length / 4; j++) {
              const srcLocalQ = new THREE2.Quaternion(
                clone.values[4 * j],
                clone.values[4 * j + 1],
                clone.values[4 * j + 2],
                clone.values[4 * j + 3]
              );
              let currentP_src = P_src.clone();
              if (parentBakeTrack) {
                const t = clone.times[j];
                const parentAnimatedLocal = evaluateQuaternionTrack(parentBakeTrack, t);
                currentP_src = parentBakeRestWorld.clone().multiply(parentAnimatedLocal);
              }
              const animWorldQ = currentP_src.multiply(srcLocalQ);
              const deltaQ = animWorldQ.clone().multiply(B_src_inv);
              const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
              const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();
              clone.values[4 * j] = tgtLocalQ.x;
              clone.values[4 * j + 1] = tgtLocalQ.y;
              clone.values[4 * j + 2] = tgtLocalQ.z;
              clone.values[4 * j + 3] = tgtLocalQ.w;
            }
          } else {
            const parentRestWorldQ = bone.parent && bone.parent.restWorldQuaternion ? bone.parent.restWorldQuaternion : new THREE2.Quaternion();
            const parentInv = parentRestWorldQ.clone().invert();
            const boneRestLocalQ = bone.restLocalQuaternion.clone();
            for (let i = 0; i < clone.values.length; i += 4) {
              const q = new THREE2.Quaternion(clone.values[i], clone.values[i + 1], clone.values[i + 2], clone.values[i + 3]);
              const resQ = parentInv.clone().multiply(q).multiply(parentRestWorldQ).multiply(boneRestLocalQ);
              clone.values[i] = resQ.x;
              clone.values[i + 1] = resQ.y;
              clone.values[i + 2] = resQ.z;
              clone.values[i + 3] = resQ.w;
            }
          }
        }
      }
    }
    tracks.push(clone);
  }
  return new THREE2.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  retargetClip
});
