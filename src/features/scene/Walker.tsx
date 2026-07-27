/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { useRef, useLayoutEffect, Suspense, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';

import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };

export interface CharacterConfig {
  id: string;
  name: string;
  path: string;
  pos: [number, number, number];
  rot: number;
  variant?: LaraVariant;
  height: number;
  sittingScenePath?: string;
  customIdleAnimPath?: string;
  isLara?: boolean;
}

export const CHARACTERS: CharacterConfig[] = [
  // 11 stylized Laras
  { id: 'native', name: 'Lara (Native)', path: 'media/lara_native.glb', pos: [140, 0, 30], rot: 1.9, variant: 'native', height: 173.4 },
  { id: 'rosanna', name: 'Rosanna', path: 'media/lara_native.glb', pos: [251, 75, 178], rot: 1.325 + Math.PI, variant: 'rosanna', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sleeping_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sleeping_idle.glb' },
  { id: 'marissa', name: 'Marissa', path: 'media/lara_native.glb', pos: [160, 0, -440], rot: 0, variant: 'marissa', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_belly_dance.glb', customIdleAnimPath: 'media/sandbox/anims/anim_belly_dance.glb' },
  { id: 'delphina', name: 'Delphina', path: 'media/lara_native.glb', pos: [120, 35, -250], rot: 1, variant: 'delphina', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_female_laying_pose_9.glb', customIdleAnimPath: 'media/sandbox/anims/anim_female_laying_pose_9.glb' },
  { id: 'sara', name: 'Sara', path: 'media/lara_native.glb', pos: [340, -40, -310], rot: -Math.PI / 2, variant: 'sara', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_climbing.glb', customIdleAnimPath: 'media/sandbox/anims/anim_climbing.glb' },
  { id: 'cha', name: 'Cha', path: 'media/lara_native.glb', pos: [30, 0, 151], rot: Math.PI / 2, variant: 'cha', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sitting_idle.glb' },
  { id: 'vivid', name: 'Vivid', path: 'media/lara_native.glb', pos: [30, 0, 210], rot: Math.PI / 2, variant: 'vivid', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sitting_idle.glb' },
  { id: 'xbot', name: 'Xbot', path: 'media/sandbox/Xbot_official.glb', pos: [150, 0, -600], rot: 0, variant: 'native', height: 173.4, isLara: false },
  { id: 'sabira', name: 'Sabira', path: 'media/lara_native.glb', pos: [100, 0, 370], rot: Math.atan2(158 - 100, 200 - 370), variant: 'sabira', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_dancing_twerk.glb', sittingScenePath: 'media/sandbox/anims/anim_dancing_twerk.glb' },
  { id: 'safa', name: 'Safa', path: 'media/lara_native.glb', pos: [250, 0, 320], rot: Math.atan2(158 - 250, 200 - 320), variant: 'safa', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_stall_soccerball_1.glb', sittingScenePath: 'media/sandbox/anims/anim_stall_soccerball_1.glb' },
  { id: 'sandra', name: 'Sandra', path: 'media/lara_native.glb', pos: [120, 0, -600], rot: 0, variant: 'sandra', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_body_jab_cross.glb', sittingScenePath: 'media/sandbox/anims/anim_body_jab_cross.glb' }
];

const BONE_SYNONYMS: Record<string, string[]> = {
  'Hips': ['hips', 'pelvis', 'cog', 'roothips', 'rootground', 'hip'],
  'Spine': ['spine01', 'spinelower', 'spine0', 'spine1', 'spine'],
  'Spine2': ['spine02', 'spineupper', 'spine2', 'spine03', 'spine', 'spine3'],
  'Neck': ['neck', 'headnecklower'],
  'Head': ['head', 'headneckupper'],
  'LeftShoulder': ['leftshoulder', 'shoulderl', 'claviclel', 'armleftshoulder', 'larmclavicle', 'shlderl', 'armleftshoulder1'],
  'LeftArm': ['armleftshoulder2', 'upperarml', 'larmhumerus', 'upperarm.l', 'upper_arm.l', 'leftarm', 'armleftelbow', 'arm.l', 'bicepl'],
  'LeftForeArm': ['lowerarml', 'larmradius', 'forearm.l', 'forearm_l', 'leftforearm', 'armleftelbow', 'armleftwrist', 'forarml', 'forearml'],
  'LeftHand': ['handl', 'larmwrist', 'hand.l', 'hand_l', 'wrist.l', 'wrist_l', 'lefthand', 'armleftwrist', 'palml'],
  'RightShoulder': ['rightshoulder', 'shoulderr', 'clavicler', 'armrightshoulder', 'rarmclavicle', 'shlderr', 'armrightshoulder1'],
  'RightArm': ['rightarm', 'armrightshoulder2', 'upperarmr', 'armrightelbow', 'rarmhumerus', 'upperarm.r', 'upper_arm.r', 'arm.r', 'bicepr'],
  'RightForeArm': ['lowerarmr', 'rarmradius', 'forearm.r', 'forearm_r', 'rightforearm', 'armrightelbow', 'armrightwrist', 'forarmr', 'forearmr'],
  'RightHand': ['handr', 'rarmwrist', 'hand.r', 'hand_r', 'wrist.r', 'wrist_r', 'righthand', 'armrightwrist', 'palmr'],
  'LeftUpLeg': ['legleftthigh', 'thighl', 'llegfemur', 'thigh.l', 'thigh_l', 'leftupleg'],
  'LeftLeg': ['legleftknee', 'calfl', 'shinl', 'llegtibia', 'shin.l', 'shin_l', 'calf.l', 'calf_l', 'leftleg'],
  'LeftFoot': ['legleftankle', 'footl', 'llegankle', 'foot.l', 'foot_l', 'ankle.l', 'ankle_l', 'leftfoot'],
  'LeftToeBase': ['leglefttoes', 'balll', 'toel', 'llegball', 'toe.l', 'toe_l', 'ball.l', 'ball_l', 'lefttoebase'],
  'RightUpLeg': ['legrightthigh', 'thighr', 'rlegfemur', 'thigh.r', 'thigh_r', 'rightupleg'],
  'RightLeg': ['legrightknee', 'calfr', 'shinr', 'rlegtibia', 'shin.r', 'shin_r', 'calf.r', 'calf_r', 'rightleg'],
  'RightFoot': ['legrightankle', 'footr', 'rlegankle', 'foot.r', 'foot_r', 'ankle.r', 'ankle_r', 'rightfoot'],
  'RightToeBase': ['legrighttoes', 'ballr', 'toer', 'rlegball', 'toe.r', 'toe_r', 'ball.r', 'ball_r', 'righttoebase']
};

const ACCESSORIES_MESH_NAMES = new Set([
  'backpack', 'oxygen',
  'binoculars', 'buckle', 'camera', 'goggles', 'grapple',
  'handgun_left', 'handgun_right', 'mp5', 'mp5_ammo',
  'handgun_left_holster', 'handgun_right_holster', 'mp5_holster', 'holster',
  'headset', 'pda', 'personal_light', 'ribbon', 'purse',
  'grenades', 'accessories', 'handgun_part'
]);

function resolveTargetFingerBoneName(targetInstance: THREE.Object3D, side: string, type: string, segment: string): string | null {
  const sideChar = side.charAt(0).toLowerCase();
  const segmentIndex = parseInt(segment) - 1;
  const segmentLetter = ['a', 'b', 'c'][segmentIndex] || 'a';

  const candidates = [
    new RegExp(`^${type}${segment}_${sideChar}$`, 'i'),
    new RegExp(`arm.*${side}.*finger.*${type === 'thumb' ? 1 : type === 'index' ? 2 : type === 'middle' ? 3 : type === 'ring' ? 4 : 5}${segmentLetter}`, 'i'),
    new RegExp(`${type}_0${segment}_${sideChar}`, 'i'),
    new RegExp(`${type === 'thumb' ? 'thumb' : 'f_' + type}\\.0${segment}\\.${sideChar}`, 'i'),
    new RegExp(`${sideChar}.*hand.*${type}.*${segmentIndex}`, 'i'),
    new RegExp(`mixamorig.*${side}.*hand.*${type}.*${segment}`, 'i'),
    new RegExp(`mixamorig_${side}_hand_${type}_${segment}`, 'i'),
    new RegExp(`${side}_hand_${type}_${segment}`, 'i')
  ];

  let foundName: string | null = null;
  targetInstance.traverse(node => {
    if ((node as any).isBone && !foundName) {
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

function getDepth(node: THREE.Object3D): number {
  let depth = 0;
  let curr: THREE.Object3D | null = node;
  while (curr && curr.parent) {
    depth++;
    curr = curr.parent;
  }
  return depth;
}

const _retargetCache: Record<string, THREE.AnimationClip> = {};

function resolveTargetBoneName(targetInstance: THREE.Object3D, baseName: string, sourceHairMap: Map<string, string> | null = null): string | null {
  const baseNameLower = baseName.toLowerCase();
  if (baseNameLower.includes('hair') || baseNameLower.includes('ponytail')) {
    if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
      const targetName = sourceHairMap.get(baseNameLower);
      if (targetName && targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
    const numMatch = baseName.match(/(\d+)/);
    if (numMatch) {
      const N = numMatch[1];
      const targetName = `hair_${N}`;
      if (targetInstance.getObjectByName(targetName)) {
        return targetName;
      }
    }
  }

  const fingerMatch = baseName.match(/Hand(Thumb|Index|Middle|Ring|Pinky)(\d)/i);
  if (fingerMatch) {
    const side = baseName.toLowerCase().includes('left') ? 'left' : 'right';
    const type = fingerMatch[1].toLowerCase();
    const segment = fingerMatch[2];
    const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
    if (resolvedFinger) return resolvedFinger;
  }

  const synonyms = BONE_SYNONYMS[baseName];
  if (synonyms) {
    for (const syn of synonyms) {
      let foundName: string | null = null;
      targetInstance.traverse(node => {
        if ((node as any).isBone && !foundName) {
          const nameNormalized = node.name.toLowerCase().replace(/[:_ .\-]/g, '');
          if (nameNormalized === syn || (nameNormalized.includes(syn) &&
              !nameNormalized.includes(syn + '1') &&
              !nameNormalized.includes(syn + '2') &&
              !nameNormalized.includes(syn + '3') &&
              !nameNormalized.includes(syn + '4'))) {
            if (!nameNormalized.includes('twist') && !nameNormalized.includes('muscle') && !nameNormalized.includes('offset')) {
              foundName = node.name;
            }
          }
        }
      });
      if (foundName) return foundName;
    }
  }

  const candidates = [
    'mixamorig:' + baseName,
    'mixamorig_' + baseName,
    'mixamorig' + baseName,
    baseName,
    'mixamorig:' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig_' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1)
  ];

  for (const cand of candidates) {
    if (targetInstance.getObjectByName(cand)) {
      return cand;
    }
  }
  return null;
}

function retargetClip(rawClip: THREE.AnimationClip, targetInstance: THREE.Object3D, animScene: THREE.Object3D | undefined): THREE.AnimationClip {
  const animBones: Record<string, any> = {};
  const sourceHairMap = new Map<string, string>();

  if (animScene) {
    animScene.updateMatrixWorld(true);

    const sourceHairBones: Array<{ bone: THREE.Object3D; baseName: string; depth: number }> = [];
    animScene.traverse(c => {
      if ((c as any).isBone) {
        const nameLower = (c.name || '').toLowerCase();
        if (nameLower.includes('hair') || nameLower.includes('ponytail')) {
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

    animScene.traverse((c: any) => {
      if (c.isBone) {
        const match = c.name.match(/mixamorig[:_]?(.+)/i);
        if (match) {
          animBones[match[1]] = {
            restWorldQuaternion: c.getWorldQuaternion(new THREE.Quaternion()),
            restLocalQuaternion: c.quaternion.clone(),
            parentRestWorldQuaternion: c.parent ? c.parent.getWorldQuaternion(new THREE.Quaternion()) : new THREE.Quaternion(),
            defaultPosition: c.position.clone()
          };
        }
      }
    });
  }

  // Deep clone of rawClip tracks to avoid mutating the source clip
  const clonedTracks: THREE.KeyframeTrack[] = [];
  for (const track of rawClip.tracks) {
    const cl = track.clone();
    cl.times = new Float32Array(track.times);
    cl.values = new Float32Array(track.values);
    clonedTracks.push(cl);
  }
  const workingClip = new THREE.AnimationClip(rawClip.name, rawClip.duration, clonedTracks);

  // Detect and fix centimeter positions (scale to meters)
  for (const track of workingClip.tracks) {
    if (track.name.endsWith('.position')) {
      const firstVal = new THREE.Vector3(track.values[0], track.values[1], track.values[2]);
      if (firstVal.length() > 5.0) {
        for (let i = 0; i < track.values.length; i++) {
          track.values[i] *= 0.01;
        }
      }
    }
  }

  // Combine rootjoint and hips rotations
  const rootRotTrackIndex = workingClip.tracks.findIndex(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.quaternion'));
  const hipsRotTrackIndex = workingClip.tracks.findIndex(t => (t.name.toLowerCase().includes('hips') || t.name.toLowerCase().endsWith('hips.quaternion')) && t.name.endsWith('.quaternion') && !t.name.toLowerCase().includes('rootjoint'));

  if (rootRotTrackIndex !== -1) {
    const rootRotTrack = workingClip.tracks[rootRotTrackIndex];
    if (hipsRotTrackIndex !== -1) {
      const hipsRotTrack = workingClip.tracks[hipsRotTrackIndex];
      const timesSet = new Set<number>([...rootRotTrack.times, ...hipsRotTrack.times]);
      const times = Array.from(timesSet).sort((a, b) => a - b);
      const values = new Float32Array(times.length * 4);

      const evaluateQuaternionTrack = (track: THREE.KeyframeTrack, t: number): THREE.Quaternion => {
        const trackTimes = track.times;
        const trackValues = track.values;
        if (t <= trackTimes[0]) {
          return new THREE.Quaternion(trackValues[0], trackValues[1], trackValues[2], trackValues[3]);
        }
        if (t >= trackTimes[trackTimes.length - 1]) {
          const idx = (trackTimes.length - 1) * 4;
          return new THREE.Quaternion(trackValues[idx], trackValues[idx+1], trackValues[idx+2], trackValues[idx+3]);
        }
        let i = 0;
        while (i < trackTimes.length - 1 && trackTimes[i+1] < t) {
          i++;
        }
        const t0 = trackTimes[i];
        const t1 = trackTimes[i+1];
        const alpha = (t - t0) / (t1 - t0);
        const q0 = new THREE.Quaternion(trackValues[4*i], trackValues[4*i+1], trackValues[4*i+2], trackValues[4*i+3]);
        const q1 = new THREE.Quaternion(trackValues[4*(i+1)], trackValues[4*(i+1)+1], trackValues[4*(i+1)+2], trackValues[4*(i+1)+3]);
        return q0.slerp(q1, alpha);
      };

      for (let i = 0; i < times.length; i++) {
        const t = times[i];
        const qRoot = evaluateQuaternionTrack(rootRotTrack, t);
        const qHips = evaluateQuaternionTrack(hipsRotTrack, t);
        const qCombined = qRoot.multiply(qHips);
        values[4*i] = qCombined.x;
        values[4*i+1] = qCombined.y;
        values[4*i+2] = qCombined.z;
        values[4*i+3] = qCombined.w;
      }
      hipsRotTrack.times = new Float32Array(times);
      hipsRotTrack.values = values;
      workingClip.tracks.splice(rootRotTrackIndex, 1);
    } else {
      const hipsPosTrack = workingClip.tracks.find(t => t.name.toLowerCase().includes('hips') && !t.name.toLowerCase().includes('rootjoint'));
      let hipsName = 'mixamorig:Hips.quaternion';
      if (hipsPosTrack) {
        hipsName = hipsPosTrack.name.split('.')[0] + '.quaternion';
      }
      rootRotTrack.name = hipsName;
    }
  }

  // Determine height translations scale multiplier dynamically
  let srcHipsDefaultY = 0.991;
  let computedHipsRatio = 100.0;
  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (match) {
      const baseName = match[1];
      if (prop === 'position' && baseName.toLowerCase() === 'hips') {
        const resolvedHipsName = resolveTargetBoneName(targetInstance, 'Hips', sourceHairMap);
        const bone = resolvedHipsName ? targetInstance.getObjectByName(resolvedHipsName) as any : null;
        let refSrcY = 0.991;
        if (animBones[baseName] && animBones[baseName].defaultPosition) {
          refSrcY = animBones[baseName].defaultPosition.length();
        } else {
          refSrcY = 0.991;
        }
        if (refSrcY > 5.0) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;

        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = bone.defaultPosition.length();
        }
        if (refSrcY > 0) {
          computedHipsRatio = targetHipsHeight / refSrcY;
        }
      }
    }
  }

  const hasRootTranslation = workingClip.tracks.some(t => t.name.toLowerCase().includes('rootjoint') && t.name.endsWith('.position'));
  const tracks: THREE.KeyframeTrack[] = [];

  for (const tr of workingClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (!match) continue;
    let baseName = match[1];

    if (prop === 'position' && baseName.toLowerCase() === 'hips' && hasRootTranslation) {
      continue;
    }

    let isRootJointTranslation = false;
    if (prop === 'position' && baseName.toLowerCase().includes('rootjoint')) {
      baseName = 'Hips';
      isRootJointTranslation = true;
    }

    const targetBoneName = resolveTargetBoneName(targetInstance, baseName, sourceHairMap);
    if (!targetBoneName) continue;

    if (prop === 'scale') continue;
    const isHips = targetBoneName.toLowerCase().endsWith('hips') || targetBoneName.toLowerCase().includes('pelvis');
    if (prop === 'position' && !isHips) continue;

    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;

    // Retarget position for hips
    if (prop === 'position' && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (isRootJointTranslation) {
          P_src = new THREE.Quaternion();
        } else if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          P_src = new THREE.Quaternion();
        }

        const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
          ? bone.parent.restWorldQuaternion
          : new THREE.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();

        let srcRestPos = null;
        if (isRootJointTranslation) {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY, 0);
        } else if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition.clone();
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        } else {
          srcRestPos = new THREE.Vector3(0, srcHipsDefaultY * 100, 0);
          if (srcRestPos.length() > 5.0) {
            srcRestPos.multiplyScalar(0.01);
          }
        }

        const restX = clone.values[0];
        const restY = clone.values[1];
        const restZ = clone.values[2];

        let isFlat = true;
        for (let j = 1; j < clone.values.length / 3; j++) {
          if (Math.abs(clone.values[3*j] - restX) > 0.001 ||
              Math.abs(clone.values[3*j+1] - restY) > 0.001 ||
              Math.abs(clone.values[3*j+2] - restZ) > 0.001) {
            isFlat = false;
            break;
          }
        }

        const animNameLower = rawClip.name.toLowerCase();
        const isWalk = (animNameLower.includes('walk') ||
                        animNameLower.includes('run') ||
                        animNameLower.includes('step') ||
                        animNameLower.includes('stairs')) &&
                       !animNameLower.includes('dance');

        if (isFlat && isWalk) {
          const duration = workingClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);

          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            const phase = (t / duration) * 2.0 * Math.PI;
            const dx = 0.8 * Math.cos(phase);
            const dy = 0.0;
            const dz = -1.6 * Math.sin(phase * 2.0);

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            newValues[3*f] = resPos.x;
            newValues[3*f+1] = resPos.y;
            newValues[3*f+2] = resPos.z;
          }
          clone.times = newTimes;
          clone.values = newValues;
        } else {
          for (let j = 0; j < clone.values.length / 3; j++) {
            let yVal = clone.values[3*j+1];
            if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
              yVal = 0.12; // Force to ground level (in meters)
            }
            const isTPose = animNameLower.includes('t-pose') || animNameLower.includes('tpose');
            const dx = (isWalk || isTPose) ? 0.0 : (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
            const dy = (isWalk || isTPose) ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
            const dz = (isWalk || isTPose) ? 0.0 : (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;

            const dP = new THREE.Vector3(dx, dy, dz)
              .applyQuaternion(P_src)
              .applyQuaternion(P_tgt_inv);
            const resPos = bone.defaultPosition.clone().add(dP);

            clone.values[3*j] = resPos.x;
            clone.values[3*j+1] = resPos.y;
            clone.values[3*j+2] = resPos.z;
          }
        }
      }
    }

    // Retarget rotations
    if (prop === 'quaternion') {
      if (targetBoneName.includes('shoulder_1')) continue;

      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone) {
        if (bone.restLocalQuaternion && bone.restWorldQuaternion) {
          let B_src = null;
          let P_src = null;
          if (animBones[baseName]) {
            B_src = animBones[baseName].restWorldQuaternion;
            P_src = animBones[baseName].parentRestWorldQuaternion;
          } else {
            B_src = new THREE.Quaternion();
            P_src = new THREE.Quaternion();
          }

          if (B_src && P_src) {
            const B_tgt = bone.restWorldQuaternion;
            const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const P_tgt_inv = P_tgt.clone().invert();
            const B_src_inv = B_src.clone().invert();

            for (let j = 0; j < clone.values.length / 4; j++) {
              const srcLocalQ = new THREE.Quaternion(
                clone.values[4*j],
                clone.values[4*j+1],
                clone.values[4*j+2],
                clone.values[4*j+3]
              );

              const animWorldQ = P_src.clone().multiply(srcLocalQ);
              const deltaQ = animWorldQ.clone().multiply(B_src_inv);
              const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);
              const tgtLocalQ = P_tgt_inv.clone().multiply(tgtAnimWorldQ).normalize();

              clone.values[4*j]   = tgtLocalQ.x;
              clone.values[4*j+1] = tgtLocalQ.y;
              clone.values[4*j+2] = tgtLocalQ.z;
              clone.values[4*j+3] = tgtLocalQ.w;
            }
          } else {
            const parentRestWorldQ = (bone.parent && bone.parent.restWorldQuaternion)
              ? bone.parent.restWorldQuaternion
              : new THREE.Quaternion();
            const parentInv = parentRestWorldQ.clone().invert();
            const boneRestLocalQ = bone.restLocalQuaternion.clone();

            for (let i = 0; i < clone.values.length; i += 4) {
              const q = new THREE.Quaternion(clone.values[i], clone.values[i+1], clone.values[i+2], clone.values[i+3]);
              const resQ = parentInv.clone()
                .multiply(q)
                .multiply(parentRestWorldQ)
                .multiply(boneRestLocalQ);

              clone.values[i] = resQ.x;
              clone.values[i+1] = resQ.y;
              clone.values[i+2] = resQ.z;
              clone.values[i+3] = resQ.w;
            }
          }
        }
      }
    }

    tracks.push(clone);
  }

  return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}

interface WalkerProps {
  showSkeleton?: boolean;
  isPreview?: boolean;
  previewCharacterId?: string;
  characterIndex?: number;
  walkerAnim?: string;
  isPaused?: boolean;
}

function GroundPoint() {
  return (
    <group position={[0, 0.05, 0]} name="GroundPoint">
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4, 5, 32]} />
        <meshBasicMaterial color="#0058a3" transparent opacity={0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 16]} />
        <meshBasicMaterial color="#0058a3" />
      </mesh>
    </group>
  );
}

interface SingleCharacterProps extends WalkerProps {
  id: string;
  name: string;
  modelPath: string;
  isLara: boolean;
  targetHeight: number;
  isActive: boolean;
  animations: THREE.AnimationClip[];

  variant?: LaraVariant;
  isNPC?: boolean;
  npcPosition?: [number, number, number];
  npcRotationY?: number;
  sittingScene?: THREE.Group;
  customIdleAnimPath?: string;
}

function SingleCharacter({
  id,
  name,
  modelPath,
  isLara,
  targetHeight,
  isActive,
  showSkeleton = false,
  isPreview = false,
  characterIndex = 0,
  walkerAnim = 'idle',
  isPaused = false,
  animations,

  variant,
  isNPC = false,
  npcPosition = [0, 0, 0],
  npcRotationY = 0,
  sittingScene,
  customIdleAnimPath
}: SingleCharacterProps) {
  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const characterShadows = useSceneStore(state => state.layers.characterShadows ?? true);
  const { scene } = useGLTFClone(modelPath);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const idleTimerRef = useRef<number>(0);
  const customAnimName = useRef<string | null>(null);
  const prevFirstPersonRef = useRef<boolean | null>(null);
  const animLoopModeRef = useRef<'infinite' | '3x' | '1x'>('infinite');
  const [equipment, setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });

  const hairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);

  // Collision bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spine2BoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const lShoulderRef = useRef<THREE.Bone | null>(null);
  const rShoulderRef = useRef<THREE.Bone | null>(null);

  const physicsPrevDt = useRef<number>(1 / 60);

  const { invalidate } = useThree();

  useEffect(() => {
    const handleActivity = () => {
      if (idleTimerRef.current > 10) {
        invalidate();
      }
      idleTimerRef.current = 0;
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('wheel', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('touchmove', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('wheel', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('touchmove', handleActivity);
    };
  }, [invalidate]);

  useLayoutEffect(() => {
    scene.traverse(node => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        const nameLower = (mesh.name || '').toLowerCase();

        let isAccessoryMesh = false;
        for (const accName of ACCESSORIES_MESH_NAMES) {
          const accNameSpace = accName.replace(/_/g, ' ');
          if (nameLower.includes(accName) || nameLower.includes(accNameSpace)) {
            isAccessoryMesh = true;
            break;
          }
        }

        if (isAccessoryMesh) {
          const isHandPistol = nameLower.includes('handgun') && !nameLower.includes('holster');
          const isHolsterPistol = (nameLower.includes('handgun') && nameLower.includes('holster')) || nameLower === 'holster' || nameLower.includes('mp5_holster') || nameLower.endsWith('_holster');

          if (isHandPistol) {
            mesh.visible = laraPistols ? showAccessories : false;
          } else if (isHolsterPistol) {
            mesh.visible = !laraPistols ? showAccessories : false;
          } else {
            mesh.visible = showAccessories;
          }
        }

        if (mesh.material) {
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach(mat => {
            if (!mat) return;
            const matNameLower = (mat.name || '').toLowerCase();
            let isAccessoryMat = false;
            for (const accName of ACCESSORIES_MESH_NAMES) {
              const accNameSpace = accName.replace(/_/g, ' ');
              if (matNameLower.includes(accName) || matNameLower.includes(accNameSpace)) {
                isAccessoryMat = true;
                break;
              }
            }

            if (isAccessoryMat) {
              const isHandPistolMat = matNameLower.includes('handgun') && !matNameLower.includes('holster');
              const isHolsterPistolMat = (matNameLower.includes('handgun') && matNameLower.includes('holster')) || matNameLower === 'holster' || matNameLower.includes('mp5_holster') || matNameLower.endsWith('_holster');

              if (isHandPistolMat) {
                mat.visible = laraPistols ? showAccessories : false;
              } else if (isHolsterPistolMat) {
                mat.visible = !laraPistols ? showAccessories : false;
              } else {
                mat.visible = showAccessories;
              }
            }
          });
        }
      }
    });
  }, [scene, showAccessories, laraPistols]);

  useLayoutEffect(() => {
    // Rename all hair bones sequentially from base to tip
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

    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const rawSize = box.getSize(new THREE.Vector3());

    const fallbackScale = 100.0;
    const scaleFactor = rawSize.y > 0 ? (targetHeight / rawSize.y) : fallbackScale;

    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.updateMatrixWorld(true);

    const resolvedHipsName = resolveTargetBoneName(scene, 'Hips');
    const hips = resolvedHipsName ? scene.getObjectByName(resolvedHipsName) : null;
    hipsBoneRef.current = hips as THREE.Bone;

    const rSpine2 = resolveTargetBoneName(scene, 'Spine2');
    spine2BoneRef.current = (rSpine2 ? scene.getObjectByName(rSpine2) : null) as THREE.Bone;

    const rSpine = resolveTargetBoneName(scene, 'Spine');
    spineBoneRef.current = (rSpine ? scene.getObjectByName(rSpine) : null) as THREE.Bone;

    const rHead = resolveTargetBoneName(scene, 'Head') || resolveTargetBoneName(scene, 'Neck');
    headBoneRef.current = (rHead ? scene.getObjectByName(rHead) : null) as THREE.Bone;

    const rLShoulder = resolveTargetBoneName(scene, 'LeftShoulder');
    lShoulderRef.current = (rLShoulder ? scene.getObjectByName(rLShoulder) : null) as THREE.Bone;

    const rRShoulder = resolveTargetBoneName(scene, 'RightShoulder');
    rShoulderRef.current = (rRShoulder ? scene.getObjectByName(rRShoulder) : null) as THREE.Bone;

    if (hips) {
        const parent = scene.parent || scene;
        const hipsWorld = new THREE.Vector3();
        hips.getWorldPosition(hipsWorld);
        const hipsLocal = parent.worldToLocal(hipsWorld);
        scene.position.x -= hipsLocal.x;
        scene.position.z -= hipsLocal.z;
    }

    scene.traverse(o => {
      const c = o as any;
      if (c.isMesh) {
        c.castShadow = characterShadows;
        c.receiveShadow = characterShadows;
        c.frustumCulled = false; // Disable culling for SkinnedMesh as bones move vertices far from rest pose bounding box
        if (c.material) {
            const materials = Array.isArray(c.material) ? c.material : [c.material];
            materials.forEach((mat: any) => {
                mat.transparent = false;
                mat.depthWrite = true;
                mat.side = THREE.FrontSide;
            });
        }
      }
      if (!c.restWorldQuaternion) {
        c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
      }
      if (c.isBone) {
        if (!c.defaultPosition) {
          c.defaultPosition = c.position.clone();
        }
        if (!c.restLocalQuaternion) {
          c.restLocalQuaternion = c.quaternion.clone();
        }
        if (!c.userData.restPos) {
          c.userData.restPos = c.position.clone();
        }
        if (!c.userData.restQuat) {
          c.userData.restQuat = c.quaternion.clone();
        }
      }
    });

    if (variant) {
        applyLaraVariantStyles(scene, variant);
    }



    // Initialize Hair Chain (Verlet)
    const hairChain: any[] = [];
    const hairBones: THREE.Bone[] = [];
    scene.traverse(c => {
      const nLower = (c.name || '').toLowerCase();
      if ((c as any).isBone && (nLower.includes('hair') || nLower.includes('pony') || nLower.includes('braid'))) {
        hairBones.push(c as THREE.Bone);
      }
    });
      hairBones.sort((a, b) => getDepth(a) - getDepth(b));

      if (hairBones.length > 0) {
        const baseParent = hairBones[0].parent;
        if (baseParent) {
          baseParent.updateMatrixWorld(true);
          const baseParentRestQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());

          let prevAxis = new THREE.Vector3(0, -1, 0);
          for (const bone of hairBones) {
            let axis = prevAxis.clone();
            let length = 8.0;
            const child = bone.children.find(x => {
              const cnLower = (x.name || '').toLowerCase();
              return (x as any).isBone && (cnLower.includes('hair') || cnLower.includes('pony') || cnLower.includes('braid'));
            });
            if (child && child.position.lengthSq() > 1e-8) {
              length = child.position.length();
              axis = child.position.clone().normalize();
            }
            prevAxis = axis.clone();
            bone.updateMatrixWorld(true);
            const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
            const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
            const worldLength = length * worldScale.y;
            const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
            const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);

            const boneRestQuat = bone.getWorldQuaternion(new THREE.Quaternion());
            const relQuat = baseParentRestQuat.clone().invert().multiply(boneRestQuat);

            hairChain.push({
              bone,
              restQuat: bone.quaternion.clone(),
              relQuat,
              axis,
              length,
              worldLength,
              tipWorld: tipWorld.clone(),
              tipPrev: tipWorld.clone(),
            });
          }
        }
      }
  hairChainRef.current = hairChain;

    // Initialize Breast Chain (Verlet)
    const breastChain: any[] = [];
    const breastBones: THREE.Bone[] = [];
    scene.traverse(c => {
      if ((c as any).isBone && c.name.toLowerCase().includes('breast')) {
        breastBones.push(c as THREE.Bone);
      }
    });

    for (const bone of breastBones) {
      let axis = new THREE.Vector3(0, 1, 0); // point forward along local Y (bone length)
      let length = 15.0;
      const child = bone.children.find(x => (x as any).isBone);
      if (child && child.position.lengthSq() > 1e-8) {
        length = child.position.length();
        axis = child.position.clone().normalize();
      }
      bone.updateMatrixWorld(true);
      const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);
      const worldScale = new THREE.Vector3().setFromMatrixScale(bone.matrixWorld);
      const worldLength = length * worldScale.z;
      const tipDirWorld = axis.clone().transformDirection(bone.matrixWorld).normalize();
      const tipWorld = jointWorld.clone().addScaledVector(tipDirWorld, worldLength);

      breastChain.push({
        bone,
        restQuat: bone.quaternion.clone(),
        axis,
        length,
        worldLength,
        tipWorld: tipWorld.clone(),
        tipPrev: tipWorld.clone(),
      });
    }
    breastChainRef.current = breastChain;

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    mixer.addEventListener('finished', (e) => {
      if (customAnimName.current && actionsRef.current[customAnimName.current] === e.action) {
        customAnimName.current = null;
      }
    });

    actionsRef.current = {};

    animations.forEach(clip => {
      const isExternal = clip.name.endsWith('.glb');
      const actualAnimScene = (clip as any).userData?.animScene || (isExternal ? sittingScene : undefined);
      const cacheKey = id + '_' + clip.name;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        finalClip = retargetClip(clip, scene, actualAnimScene);
        _retargetCache[cacheKey] = finalClip;
      }

      const action = mixer.clipAction(finalClip);
      actionsRef.current[clip.name] = action;
      action.enabled = true;
      action.play();
      action.setEffectiveWeight(0);
    });

    activeActionName.current = '';

    return () => {
        mixer.stopAllAction();
        mixer.uncacheRoot(scene);
    };
  }, [scene, animations, name, isLara, targetHeight, variant, sittingScene, id]);

  const skeletonRef = useHelper(showSkeleton ? modelRef : null, THREE.SkeletonHelper);

  useEffect(() => {
    if (skeletonRef.current) {
        const helper = skeletonRef.current as unknown as THREE.SkeletonHelper;
        const mat = helper.material as THREE.LineBasicMaterial;
        mat.color.set(0x00ffff);
        mat.depthTest = false;
        helper.renderOrder = 99999;
        helper.raycast = () => {};
        helper.traverse(c => { c.raycast = () => {}; });
    }
  }, [skeletonRef, showSkeleton]);

  const poseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'walker-anim-loop') {
        animLoopModeRef.current = e.detail.value || 'infinite';
        return;
      }
      if (e.detail?.key === 'lara-custom-holster' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, holster: !prev.holster }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-pistols' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, pistols: !prev.pistols }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-backpack' && isActive) {
        setEquipment((prev: { holster: boolean; pistols: boolean; backpack: boolean }) => ({ ...prev, backpack: !prev.backpack }));
        invalidate();
        return;
      }
      const isForMe = (isLara && e.detail?.key === 'walker-anim-lara') ||
                      (!isLara && e.detail?.key === 'walker-anim-xbot');
      if (isForMe && e.detail?.value) {
        const path = e.detail.value;

        if (poseTimerRef.current) {
          clearTimeout(poseTimerRef.current);
          poseTimerRef.current = null;
        }

        if (path === 'idle') {
          if (customAnimName.current && actionsRef.current[customAnimName.current]) {
            actionsRef.current[customAnimName.current].stop();
          }
          customAnimName.current = null;
          mixerRef.current?.stopAllAction();
          activeActionName.current = 'idle';
          invalidate();
          return;
        }

        const loader = new GLTFLoader();
        loader.load(path, (gltf: any) => {
          const clip = gltf.animations[0];
          if (clip) {
            clip.name = path;
            const cacheKey = id + '_' + path;
            let finalClip = _retargetCache[cacheKey];
            if (!finalClip) {
               finalClip = retargetClip(clip, scene, gltf.scene);
               _retargetCache[cacheKey] = finalClip;
            }
            finalClip.name = path;

            const mixer = mixerRef.current;
            if (!mixer) return;

            let action = actionsRef.current[path];
            if (!action) {
              action = mixer.clipAction(finalClip);
              action.enabled = true;
              actionsRef.current[path] = action;
            }

            const pathLower = path.toLowerCase();
            const clipNameLower = (clip.name || '').toLowerCase();
            const isPose = (pathLower.includes('pose') || clipNameLower.includes('pose')) && !pathLower.includes('t-pose') && !clipNameLower.includes('t-pose');

            const mode = animLoopModeRef.current;
            if (mode === 'infinite') {
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.clampWhenFinished = false;
            } else if (mode === '3x') {
              action.setLoop(THREE.LoopRepeat, 3);
              action.clampWhenFinished = true;
              if (isPose) {
                poseTimerRef.current = setTimeout(() => {
                  if (customAnimName.current === path) {
                    customAnimName.current = null;
                    invalidate();
                  }
                }, 30000); // 3x 10sec = 30 seconds
              }
            } else {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
              if (isPose) {
                poseTimerRef.current = setTimeout(() => {
                  if (customAnimName.current === path) {
                    customAnimName.current = null;
                    invalidate();
                  }
                }, 10000); // 1x 10sec
              }
            }

            customAnimName.current = path;
            invalidate();
          }
        });
      }
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
      if (poseTimerRef.current) {
        clearTimeout(poseTimerRef.current);
        poseTimerRef.current = null;
      }
    };
  }, [isActive, isLara, scene, invalidate, id]);

  useEffect(() => {
    const resetTimer = () => {
      idleTimerRef.current = 0;
    };
    window.addEventListener('pointermove', resetTimer, { passive: true });
    window.addEventListener('keydown', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    window.addEventListener('wheel', resetTimer, { passive: true });
    return () => {
      window.removeEventListener('pointermove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('wheel', resetTimer);
    };
  }, []);

  useEffect(() => {
    if (!scene) return;
    scene.traverse(c => {
      if (isActive) {
        c.userData.hoverAction = {
          label: `Customiser ${name} 👤`,
          actions: [
            isLara ? 'walker-anim-lara' : 'walker-anim-xbot',
            'lara-custom-holster',
            'lara-custom-pistols',
            'lara-custom-backpack'
          ]
        };
      } else {
        delete c.userData.hoverAction;
      }
    });
  }, [isActive, name, scene, isLara]);

  useEffect(() => {
    if (!scene) return;
    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const meshName = o.name.toLowerCase();
        const mat = (o as THREE.Mesh).material;
        const matName = mat ? (Array.isArray(mat) ? mat[0].name.toLowerCase() : mat.name.toLowerCase()) : '';

        const isHolsterPart = meshName.includes('holster') || meshName.includes('gear') || meshName.includes('buckle') || matName.includes('holster') || matName.includes('gear') || matName.includes('buckle');
        const isPistolPart = meshName.includes('pistol') || meshName.includes('gun') || meshName.includes('weapon') || matName.includes('pistol') || matName.includes('gun') || matName.includes('weapon');
        const isBackpackPart = meshName.includes('backpack') || meshName.includes('bag') || meshName.includes('pack') || matName.includes('backpack') || matName.includes('bag') || matName.includes('pack');

        if (isHolsterPart) o.visible = equipment.holster;
        if (isPistolPart) o.visible = equipment.pistols;
        if (isBackpackPart) o.visible = equipment.backpack;
      }
    });
    invalidate();
  }, [scene, equipment, invalidate]);

  useEffect(() => {
    if (customIdleAnimPath && scene && mixerRef.current && !actionsRef.current[customIdleAnimPath]) {
      const loader = new GLTFLoader();
      loader.load(customIdleAnimPath, (gltf: any) => {
        const clip = gltf.animations[0];
        if (clip) {
          const cacheKey = id + '_' + customIdleAnimPath;
          let finalClip = _retargetCache[cacheKey];
          if (!finalClip) {
            finalClip = retargetClip(clip, scene, gltf.scene);
            _retargetCache[cacheKey] = finalClip;
          }
          finalClip.name = customIdleAnimPath;

          const mixer = mixerRef.current;
          if (!mixer) return;

          let action = actionsRef.current[customIdleAnimPath];
          if (!action) {
            action = mixer.clipAction(finalClip);
            action.enabled = true;
            action.play();
            action.setEffectiveWeight(0);
            actionsRef.current[customIdleAnimPath] = action;
          }
          invalidate();
        }
      });
    }
  }, [customIdleAnimPath, id, scene, invalidate]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    if (!groupRef.current || !mixerRef.current) return;

    if (isPreview) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else if (laraGrid) {
      const row = Math.floor(characterIndex / 5);
      const col = characterIndex % 5;
      const targetX = 150 + (col - 2) * 120;
      const targetY = 400 + row * 220;
      const targetZ = 200;
      groupRef.current.position.set(targetX, targetY, targetZ);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
    } else {
      if (isActive) {
        groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
        groupRef.current.rotation.y = cameraState.walkYaw;
        groupRef.current.visible = !cameraState.walkerHidden;
      } else if (isNPC) {
        const savedPos = cameraState.positions[id];
        const px = savedPos ? savedPos.x : npcPosition[0];
        const py_pos = savedPos ? savedPos.y : npcPosition[1];
        const pz = savedPos ? savedPos.z : npcPosition[2];
        const py_rot = savedPos ? savedPos.yaw : npcRotationY;
        groupRef.current.position.set(px, py_pos, pz);
        groupRef.current.rotation.y = py_rot;
        groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && cameraState.mode === 'walk';
      if (prevFirstPersonRef.current !== isFirstPerson) {
        scene.traverse(o => {
          if ((o as THREE.Mesh).isMesh) {
            const meshName = o.name.toLowerCase();
            const mat = (o as THREE.Mesh).material;
            const matName = mat ? (Array.isArray(mat) ? mat[0].name.toLowerCase() : mat.name.toLowerCase()) : '';

            const isHeadPart = meshName.includes('head') || meshName.includes('hair') || meshName.includes('eye') || meshName.includes('lash') || meshName.includes('mouth') || meshName.includes('teeth') ||
                               matName.includes('head') || matName.includes('hair') || matName.includes('eye') || matName.includes('lash') || matName.includes('mouth');

            if (isFirstPerson && isHeadPart) {
              o.layers.set(LAYER_WALKER_DETAIL);
            } else {
              o.layers.set(LAYER_WALKER);
            }
          }
        });
        prevFirstPersonRef.current = isFirstPerson;
      }
    }

    if (!groupRef.current.visible) {
      return;
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    // Inactive model is always stationary
    let isMoving = isActive ? cameraState.isMoving : false;
    let target = isPreview ? (walkerAnim || 'idle') : (isMoving ? 'walk' : 'idle');

    if (isNPC && customIdleAnimPath && target === 'idle') {
      target = customIdleAnimPath;
    }

    if (customAnimName.current) {
      target = customAnimName.current;
    }

    // Consider rotating as moving to prevent idle timeout freezes
    const isRotating = isActive && useSceneStore.getState().activeWalkerId === id &&
      (Math.abs(cameraState.walkYaw - (groupRef.current.userData.lastYaw || 0)) > 0.001);
    groupRef.current.userData.lastYaw = cameraState.walkYaw;

    if (!isPaused && !isMoving && !isPreview && !isRotating) {
        idleTimerRef.current += delta;
    } else {
        idleTimerRef.current = 0;
    }

    // Both characters time out after 10s of inactivity to save CPU
    const isIdleTimeout = idleTimerRef.current > 10;

    if (target === 'tpose') {
        if (activeActionName.current !== 'tpose') {
            mixer.stopAllAction();
            scene.traverse(o => {
                if ((o as THREE.Bone).isBone) {
                    const b = o as THREE.Bone;
                    if (b.userData.restPos) b.position.copy(b.userData.restPos);
                    if (b.userData.restQuat) b.quaternion.copy(b.userData.restQuat);
                }
            });
            activeActionName.current = 'tpose';
        }
    } else {
        const to = actions[target];
        if (to && activeActionName.current !== target) {
            const from = (activeActionName.current && activeActionName.current !== 'tpose') ? actions[activeActionName.current] : null;
            if (from) from.fadeOut(0.2);
            to.reset().fadeIn(0.2).play();
            to.setEffectiveWeight(1);
            activeActionName.current = target;
            idleTimerRef.current = 0;
        }
    }

    if (activeActionName.current !== 'tpose' && !isPaused && !isIdleTimeout) {
        mixer.update(delta);

        // Lock hair bones to their rest local transforms to completely freeze ponytail movement
        scene.traverse(c => {
          if ((c as any).isBone) {
            const nLower = (c.name || '').toLowerCase();
            if (nLower.includes('hair') || nLower.includes('ponytail') || nLower.includes('braid') || nLower.includes('pony') || nLower.startsWith('hair_')) {
              if ((c as any).restLocalQuaternion) {
                (c as any).quaternion.copy((c as any).restLocalQuaternion);
              }
              if ((c as any).defaultPosition) {
                (c as any).position.copy((c as any).defaultPosition);
              }
            }
          }
        });


        // Update world matrices once per frame per character
        scene.updateMatrixWorld(true);

        // Physics simulation timestep (Time-Corrected Verlet)
        let simDt = delta;
        if (simDt > 0.05) simDt = 0.05; // cap to 20fps
        const dtRatio = physicsPrevDt.current > 0 ? (simDt / physicsPrevDt.current) : 1;

        // Ponytail physics simulation (Verlet)
        const enableHairPhysics = useSceneStore.getState().layers.hairPhysics;
        if (enableHairPhysics && hairChainRef.current.length > 0) {
          const firstNode = hairChainRef.current[0];
          const baseParent = firstNode.bone.parent;
          if (baseParent) {

            const baseParentQuat = baseParent.getWorldQuaternion(new THREE.Quaternion());
            const g = new THREE.Vector3(0, -981, 0); // standard gravity (cm/s^2)

            for (const node of hairChainRef.current) {
              const { bone, restQuat, relQuat, axis, worldLength } = node;
              const parent = bone.parent;
              if (!parent) continue;



              const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

              // Rest dir based on baseParent to break feedback loop of deformed parent bones
              const restQuatWorld = baseParentQuat.clone().multiply(relQuat);
              const restDir = axis.clone().applyQuaternion(restQuatWorld).normalize();
              const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

              // Teleportation safety reset
              const dist = jointWorld.distanceTo(node.tipWorld);
              if (dist > worldLength * 3) {
                node.tipWorld.copy(restTip);
                node.tipPrev.copy(restTip);
              }

              const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - 0.50)); // damping = 0.50
              const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

              next.lerp(restTip, 0.02); // stiffness = 0.02 (almost pure gravity)
              // Resolve constraints iteratively (2 passes) to ensure length and collision are both satisfied
              for (let i = 0; i < 2; i++) {
                // 1. Length constraint
                const dir = new THREE.Vector3().subVectors(next, jointWorld);
                const currentLen = dir.length();
                if (currentLen > 1e-6) {
                  dir.multiplyScalar(worldLength / currentLen);
                } else {
                  dir.copy(restDir).multiplyScalar(worldLength);
                }
                next.copy(jointWorld).add(dir);

                // 2. Collision constraints (Body + Backpack)
                // We use a robust cross-product of (Hips->Head) and (RightShoulder->LeftShoulder)
                // to get the exact "Backward" direction of the torso, independent of the rig's bone axes!
                let backDir = new THREE.Vector3(0, 0, -1);
                if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
                  const headW = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld);
                  const hipsW = new THREE.Vector3().setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
                  const lShoulderW = new THREE.Vector3().setFromMatrixPosition(lShoulderRef.current.matrixWorld);
                  const rShoulderW = new THREE.Vector3().setFromMatrixPosition(rShoulderRef.current.matrixWorld);

                  const up = new THREE.Vector3().subVectors(headW, hipsW).normalize();
                  const right = new THREE.Vector3().subVectors(lShoulderW, rShoulderW).normalize(); // Assuming character faces +Z, left is +X, right is -X. So Right->Left is +X
                  backDir.crossVectors(up, right).normalize(); // Y cross X = -Z (Backward)
                }

                // Head sphere
                if (headBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 5); // push slightly back
                  const radius = 15.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Backpack / Upper Back (Spine2)
                if (spine2BoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(spine2BoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 16); // push into the backpack
                  const radius = 24.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Mid Back (Spine)
                if (spineBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(spineBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 12);
                  const radius = 20.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Lower Back / Butt (Hips)
                if (hipsBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
                  center.addScaledVector(backDir, 10);
                  const radius = 22.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }
              }

              // Final exact length constraint
              const dir = new THREE.Vector3().subVectors(next, jointWorld);
              const currentLen = dir.length();
              if (currentLen > 1e-6) {
                dir.multiplyScalar(worldLength / currentLen);
              } else {
                dir.copy(restDir).multiplyScalar(worldLength);
              }

              node.tipPrev.copy(node.tipWorld);
              node.tipWorld.copy(jointWorld).add(dir);

              const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              const parentQuatInv = parentQuat.clone().invert();
              const localTargetDir = dir.clone().normalize().applyQuaternion(parentQuatInv);

              const restDirParent = axis.clone().applyQuaternion(restQuat);
              const qDelta = new THREE.Quaternion().setFromUnitVectors(restDirParent, localTargetDir);
              bone.quaternion.copy(qDelta).multiply(restQuat);
              bone.updateMatrixWorld(true);
            }
          }
        }

        // Breast physics simulation (Verlet)
        const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;
        if (enableBreastPhysics && breastChainRef.current.length > 0) {
          const g = new THREE.Vector3(0, -700, 0); // moderate gravity for breasts to allow bouncy feel

          for (const node of breastChainRef.current) {
            const { bone, restQuat, axis, worldLength } = node;
            const parent = bone.parent;
            if (!parent) continue;

            const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

            // Teleportation safety reset
            const dist = jointWorld.distanceTo(node.tipWorld);
            if (dist > worldLength * 3) {
              const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              const restDir = axis.clone().applyQuaternion(restQuat).applyQuaternion(parentQuat);
              const tipW = jointWorld.clone().addScaledVector(restDir, worldLength);
              node.tipWorld.copy(tipW);
              node.tipPrev.copy(tipW);
            }

            const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - 0.12)); // damping = 0.12
            const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

            const parentQuat = parent.getWorldQuaternion(new THREE.Quaternion());
            const restDir = axis.clone().applyQuaternion(restQuat).applyQuaternion(parentQuat);
            const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

            next.lerp(restTip, 0.15); // stiffness = 0.15

            const dir = new THREE.Vector3().subVectors(next, jointWorld);
            const currentLen = dir.length();
            if (currentLen > 1e-6) {
              dir.multiplyScalar(worldLength / currentLen);
            } else {
              dir.copy(restDir).multiplyScalar(worldLength);
            }

            node.tipPrev.copy(node.tipWorld);
            node.tipWorld.copy(jointWorld).add(dir);

            const parentQuatInv = parentQuat.clone().invert();
            const localTargetDir = dir.clone().normalize().applyQuaternion(parentQuatInv);

            const restDirParent = axis.clone().applyQuaternion(restQuat);
            const qDelta = new THREE.Quaternion().setFromUnitVectors(restDirParent, localTargetDir);

            let scaledQ = qDelta;
            const breastIntensity = 1.2;
            const w = Math.min(1, Math.max(-1, qDelta.w));
            const angle = 2 * Math.acos(w);
            if (Math.abs(angle) > 1e-5) {
              const sinHalf = Math.sqrt(1 - w * w);
              const rotAxis = new THREE.Vector3();
              if (sinHalf > 1e-5) {
                rotAxis.set(qDelta.x / sinHalf, qDelta.y / sinHalf, qDelta.z / sinHalf).normalize();
              } else {
                rotAxis.set(0, 0, 1);
              }
              scaledQ = new THREE.Quaternion().setFromAxisAngle(rotAxis, angle * breastIntensity);
            }
            bone.quaternion.copy(scaledQ).multiply(restQuat);
          }
        }

        physicsPrevDt.current = simDt;
    }

    if (!isIdleTimeout || isMoving || isPreview) {
        invalidate();
    }
  });

  return (
    <group ref={groupRef}>
      <primitive ref={modelRef} object={scene} />
      {!isPreview && isActive && <GroundPoint />}
    </group>
  );
}

function InternalWalker(props: WalkerProps) {
  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const idleGltf = useGLTF('media/sandbox/anims/anim_idle.glb');
  const walkingGltf = useGLTF('media/sandbox/anims/anim_walking.glb');
  const runningGltf = useGLTF('media/sandbox/anims/anim_running.glb');

  // Preloaded anim paths
  const sittingGltf = useGLTF('media/sandbox/anims/anim_sitting_idle.glb');
  const swimmingGltf = useGLTF('media/sandbox/anims/anim_swimming_to_edge.glb');
  const pushUpGltf = useGLTF('media/sandbox/anims/anim_push_up.glb');
  const laying1Gltf = useGLTF('media/sandbox/anims/anim_laying_idle_1.glb');
  const climbingGltf = useGLTF('media/sandbox/anims/anim_climbing.glb');

  // New character anims
  const bellyDanceGltf = useGLTF('media/sandbox/anims/anim_belly_dance.glb');
  const dancingTwerkGltf = useGLTF('media/sandbox/anims/anim_dancing_twerk.glb');
  const soccerballGltf = useGLTF('media/sandbox/anims/anim_stall_soccerball_1.glb');
  const jabCrossGltf = useGLTF('media/sandbox/anims/anim_body_jab_cross.glb');
  const femaleLayingPose9Gltf = useGLTF('media/sandbox/anims/anim_female_laying_pose_9.glb');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const animGltfs: Record<string, any> = useMemo(() => ({
    'media/sandbox/anims/anim_sitting_idle.glb': sittingGltf,
    'media/sandbox/anims/anim_swimming_to_edge.glb': swimmingGltf,
    'media/sandbox/anims/anim_push_up.glb': pushUpGltf,
    'media/sandbox/anims/anim_climbing.glb': climbingGltf,
    'media/sandbox/anims/anim_laying_idle_1.glb': laying1Gltf,
    'media/sandbox/anims/anim_belly_dance.glb': bellyDanceGltf,
    'media/sandbox/anims/anim_dancing_twerk.glb': dancingTwerkGltf,
    'media/sandbox/anims/anim_stall_soccerball_1.glb': soccerballGltf,
    'media/sandbox/anims/anim_body_jab_cross.glb': jabCrossGltf,
    'media/sandbox/anims/anim_female_laying_pose_9.glb': femaleLayingPose9Gltf,
  }), [sittingGltf, swimmingGltf, pushUpGltf, climbingGltf, laying1Gltf, bellyDanceGltf, dancingTwerkGltf, soccerballGltf, jabCrossGltf, femaleLayingPose9Gltf]);

  const charactersWithAnims = useMemo(() => {
    return CHARACTERS.map(char => {
      const isLara = true;
      const idleAnim = idleGltf.animations[0].clone();
      idleAnim.name = 'idle';
      (idleAnim as any).userData = { animScene: idleGltf.scene };

      const walkAnim = walkingGltf.animations[0].clone();
      walkAnim.name = 'walk';
      (walkAnim as any).userData = { animScene: walkingGltf.scene };

      const runAnim = runningGltf.animations[0].clone();
      runAnim.name = 'run';
      (runAnim as any).userData = { animScene: runningGltf.scene };

      const charAnims = [
        idleAnim,
        walkAnim,
        runAnim,
        ...(char.customIdleAnimPath && animGltfs[char.customIdleAnimPath]?.animations[0]
          ? [Object.assign(animGltfs[char.customIdleAnimPath].animations[0].clone(), {
              name: char.customIdleAnimPath,
              userData: { animScene: animGltfs[char.customIdleAnimPath].scene }
            })]
          : [])
      ];
      const sittingScene = char.sittingScenePath && animGltfs[char.sittingScenePath]?.scene;
      return {
        ...char,
        isLara,
        charAnims,
        sittingScene
      };
    });
  }, [idleGltf, walkingGltf, runningGltf, animGltfs]);

  return (
    <>
      {charactersWithAnims.map((char, index) => {
        const isActive = props.isPreview
          ? char.id === props.previewCharacterId
          : char.id === activeWalkerId;

        if (props.isPreview && char.id !== props.previewCharacterId) {
          return null;
        }

        return (
          <SingleCharacter
            {...props}
            key={char.id}
            id={char.id}
            name={char.name}
            modelPath={char.path}
            isLara={char.isLara ?? true}
            targetHeight={char.height}
            isActive={isActive}
            animations={char.charAnims}

            variant={char.variant}
            isNPC={!isActive}
            npcPosition={char.pos}
            npcRotationY={char.rot}
            sittingScene={char.sittingScene}
            walkerAnim={props.walkerAnim}
            customIdleAnimPath={char.customIdleAnimPath}
            characterIndex={index}
          />
        );
      })}
    </>
  );
}

export function Walker(props: WalkerProps) {
  return (
    <Suspense fallback={null}>
      <InternalWalker {...props} />
    </Suspense>
  );
}

// Preloads
const LARA_PATH = 'media/lara_native.glb';
const ROSANNA_PATH = 'media/rosanna_lara_native.glb';
const VIVID_PATH = 'media/vivid_red_lara_native.glb';

useGLTF.preload(LARA_PATH);
useGLTF.preload(ROSANNA_PATH);
useGLTF.preload(VIVID_PATH);
useGLTF.preload('media/sandbox/anims/anim_sitting_idle.glb');
useGLTF.preload('media/sandbox/anims/anim_swimming_to_edge.glb');
useGLTF.preload('media/sandbox/anims/anim_climbing.glb');
useGLTF.preload('media/sandbox/anims/anim_push_up.glb');
useGLTF.preload('media/sandbox/anims/anim_laying_idle_1.glb');
useGLTF.preload('media/sandbox/anims/anim_woman-solo.glb');
useGLTF.preload('media/sandbox/anims/anim_belly_dance.glb');
useGLTF.preload('media/sandbox/anims/anim_dancing_twerk.glb');
useGLTF.preload('media/sandbox/anims/anim_stall_soccerball_1.glb');
useGLTF.preload('media/sandbox/anims/anim_body_jab_cross.glb');


CHARACTERS.forEach(char => {
  useGLTF.preload(char.path);
});
