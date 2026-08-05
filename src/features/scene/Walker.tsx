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
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';
import {
  ACTION_GO_TO_TOILET,
  ACTION_SIT_DESK_1,
  ACTION_SIT_OFFICE_CHAIR,
  ACTION_SIT_DESK_2,
  ACTION_BED_WEST,
  ACTION_BED_EAST,
  ACTION_BATHTUB,
  ACTION_SHOWER,
  ACTION_GARDEN_SOFA_EAST,
  ACTION_GARDEN_SOFA_WEST,
  ACTION_COOKING,
  ACTION_KALLAX_NE,
  ACTION_FRESH_AIR,
  ACTION_FULL_TOUR
} from './ai/ZoneNodes';
import type { AgentInstruction } from './ai/aiTypes';
import { useAgentController } from './ai/useAgentController';

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
  { id: 'rosanna', name: 'Rosanna', path: 'media/lara_native.glb', pos: [251, 45, 178], rot: 1.325 + Math.PI, variant: 'rosanna', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_sleeping_idle.glb', customIdleAnimPath: 'media/sandbox/anims/anim_sleeping_idle.glb' },
  { id: 'marissa', name: 'Marissa', path: 'media/lara_native.glb', pos: [160, 0, -440], rot: 0, variant: 'marissa', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_belly_dance.glb', customIdleAnimPath: 'media/sandbox/anims/anim_belly_dance.glb' },
  {
    id: 'delphina', name: 'Delphina', path: 'media/lara_native.glb', pos: [120, 35, -250], rot: 1, variant: 'delphina', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['media/sandbox/anims/anim_snake_hip_hop_dance.glb', 'media/sandbox/anims/anim_belly_dance.glb', 'media/sandbox/anims/anim_dancing_twerk.glb', 'media/sandbox/anims/anim_salsa_dancing.glb', 'media/sandbox/anims/anim_salsa_dancing_1.glb', 'media/sandbox/anims/anim_salsa_dancing_3.glb', 'media/sandbox/anims/anim_samba_dancing.glb', 'media/sandbox/anims/anim_samba_dancing_1.glb', 'media/sandbox/anims/anim_hip_hop_dancing_2.glb', 'media/sandbox/anims/anim_hip_hop_dancing_4.glb', 'media/sandbox/anims/anim_house_dancing.glb', 'media/sandbox/anims/anim_breakdance_uprock.glb']; return anims[Math.floor(Math.random() * anims.length)]; })(),
    sittingScenePath: 'media/sandbox/anims/anim_snake_hip_hop_dance.glb'
  },
  { id: 'sara', name: 'Sara', path: 'media/lara_native.glb', pos: [340, -40, -310], rot: -Math.PI / 2, variant: 'sara', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_climbing.glb', customIdleAnimPath: 'media/sandbox/anims/anim_climbing.glb' },
  { id: 'cha', name: 'Cha', path: 'media/lara_native.glb', pos: [150, 0, -150], rot: Math.PI / 2, variant: 'cha', height: 173.4,
    customIdleAnimPath: (() => {
      const valid = WALKER_ANIM_OPTIONS.filter(o => {
        const l = o.label.toLowerCase();
        return o.value.includes('.glb') && !l.includes('dance') && !l.includes('pose') && !l.includes('dancing');
      });
      return valid[Math.floor(Math.random() * valid.length)].value;
    })()
  },
  { id: 'vivida', name: 'ViviDa', path: 'media/lara_native.glb', pos: [200, 0, 215], rot: Math.PI, variant: 'vivida', height: 173.4, sittingScenePath: 'media/sandbox/anims/anim_texting_while_standing.glb', customIdleAnimPath: 'media/sandbox/anims/anim_texting_while_standing.glb' },
  { id: 'xbot', name: 'Xbot', path: 'media/sandbox/Xbot_official.glb', pos: [288, 0, 603], rot: 0, variant: 'native', height: 173.4, isLara: false },
  {
    id: 'sabira', name: 'Sabira', path: 'media/lara_native.glb', pos: [100, 0, 370], rot: Math.atan2(158 - 100, 200 - 370), variant: 'sabira', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['media/sandbox/anims/anim_hip_hop_dancing.glb', 'media/sandbox/anims/anim_hip_hop_dancing_1.glb', 'media/sandbox/anims/anim_hip_hop_dancing_6.glb', 'media/sandbox/anims/anim_hip_hop_dancing_10.glb', 'media/sandbox/anims/anim_locking_hip_hop_dance.glb', 'media/sandbox/anims/anim_robot_hip_hop_dance.glb', 'media/sandbox/anims/anim_samba_dancing.glb', 'media/sandbox/anims/anim_samba_dancing_2.glb', 'media/sandbox/anims/anim_belly_dance.glb', 'media/sandbox/anims/anim_gangnam_style.glb']; return anims[Math.floor(Math.random() * anims.length)]; })(),
    sittingScenePath: 'media/sandbox/anims/anim_snake_hip_hop_dance.glb'
  },
  { id: 'safa', name: 'Safa', path: 'media/lara_native.glb', pos: [150, 0, -400], rot: Math.PI, variant: 'safa', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_stall_soccerball_1.glb', sittingScenePath: 'media/sandbox/anims/anim_stall_soccerball_1.glb' },
  { id: 'sandra', name: 'Sandra', path: 'media/lara_native.glb', pos: [-150, 0, 270], rot: Math.PI, variant: 'sandra', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_best_double_leg_takedown_victim.glb', sittingScenePath: 'media/sandbox/anims/anim_best_double_leg_takedown_victim.glb' },
  { id: 'rajaa', name: 'Rajaa', path: 'media/lara_native.glb', pos: [-150, 0, 0], rot: 0, variant: 'rajaa', height: 173.4, customIdleAnimPath: 'media/sandbox/anims/anim_best_double_leg_takedown_attacker.glb', sittingScenePath: 'media/sandbox/anims/anim_best_double_leg_takedown_attacker.glb' },
  {
    id: 'romana', name: 'Romana', path: 'media/lara_native.glb', pos: [270, 45, -110], rot: Math.PI, variant: 'romana', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['media/sandbox/anims/anim_female_laying_pose_9.glb', 'media/sandbox/anims/anim_female_standing_pose.glb', 'media/sandbox/anims/anim_female_standing_pose_1.glb', 'media/sandbox/anims/anim_female_standing_pose_2.glb', 'media/sandbox/anims/anim_female_sitting_pose.glb', 'media/sandbox/anims/anim_female_dance_pose.glb', 'media/sandbox/anims/anim_female_dynamic_pose.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  },
  {
    id: 'angelina', name: 'Angelina', path: 'media/lara_native.glb',
    pos: [Math.floor(Math.random() * 200) + 50, 0, -(Math.floor(Math.random() * 300) + 300)] as [number, number, number],
    rot: Math.random() * Math.PI * 2, variant: 'angelina', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['media/sandbox/anims/anim_dancing_twerk.glb', 'media/sandbox/anims/anim_belly_dance.glb', 'media/sandbox/anims/anim_hip_hop_dancing.glb', 'media/sandbox/anims/anim_hip_hop_dancing_7.glb', 'media/sandbox/anims/anim_salsa_dancing.glb', 'media/sandbox/anims/anim_salsa_dancing_4.glb', 'media/sandbox/anims/anim_samba_dancing.glb', 'media/sandbox/anims/anim_capoeira.glb', 'media/sandbox/anims/anim_rumba_dancing.glb', 'media/sandbox/anims/anim_twist_dance.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  },
  {
    id: 'lgbta', name: 'Lgbta', path: 'media/lara_native.glb',
    pos: [Math.floor(Math.random() * 200) + 150, 0, -(Math.floor(Math.random() * 300) + 250)] as [number, number, number],
    rot: Math.random() * Math.PI * 2, variant: 'lgbta', height: 173.4,
    customIdleAnimPath: (() => { const anims = ['media/sandbox/anims/anim_belly_dance.glb', 'media/sandbox/anims/anim_dancing_twerk.glb', 'media/sandbox/anims/anim_macarena_dance.glb', 'media/sandbox/anims/anim_macarena_dance_1.glb', 'media/sandbox/anims/anim_hip_hop_dancing_1.glb', 'media/sandbox/anims/anim_swing_dancing.glb', 'media/sandbox/anims/anim_jazz_dancing.glb', 'media/sandbox/anims/anim_can_can.glb', 'media/sandbox/anims/anim_gangnam_style.glb', 'media/sandbox/anims/anim_ymca_dance.glb']; return anims[Math.floor(Math.random() * anims.length)]; })()
  }
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
          let yMinDelta = 0;
          if (animNameLower.includes('takedown')) {
            // Calculer le décalage minimum en Y pour caler le point le plus bas du mouvement pile au niveau du sol
            let minY = Infinity;
            for (let j = 0; j < clone.values.length / 3; j++) {
              if (clone.values[3*j+1] < minY) minY = clone.values[3*j+1];
            }
            // Si le point le plus bas s'enfonce sous le sol d'origine, on recale la base du mouvement
            if (minY < 0) {
              yMinDelta = -minY;
            }
          }

          for (let j = 0; j < clone.values.length / 3; j++) {
            let yVal = clone.values[3*j+1] + yMinDelta;
            if (isRootJointTranslation && (animNameLower.includes('laying') || animNameLower.includes('sleeping'))) {
              yVal = 0.12; // Force to ground level (in meters)
            }
            const isTPose = animNameLower.includes('t-pose') || animNameLower.includes('tpose');
            const dy = (isWalk || isTPose) ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
            const dx = (isWalk || isTPose) ? 0.0 : (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
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
  const [expression, setExpression] = useState<'neutral' | 'smile' | 'wink'>('neutral');
  const expressionRef = useRef<'neutral' | 'smile' | 'wink'>('neutral');
  expressionRef.current = expression;

  const [equipment, setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });

  const [haircut, setHaircut] = useState<string>('original');
  const hairPackGltf = useGLTF('media/hair_pack_part_2.glb');

  const hairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);
  const breastImpulseRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const breastVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const prevSpinePosRef = useRef<THREE.Vector3 | null>(null);
  const prevSpineVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const torsoAccelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const customHairAnimBonesRef = useRef<{ bone: THREE.Bone; restQ: THREE.Quaternion; index: number }[]>([]);
  const wigEnergyRef = useRef(1.0);
  const loadingAnimsRef = useRef<Set<string>>(new Set());

  // Collision bones
  const headBoneRef = useRef<THREE.Bone | null>(null);
  const spine2BoneRef = useRef<THREE.Bone | null>(null);
  const spineBoneRef = useRef<THREE.Bone | null>(null);
  const hipsBoneRef = useRef<THREE.Bone | null>(null);
  const lShoulderRef = useRef<THREE.Bone | null>(null);
  const rShoulderRef = useRef<THREE.Bone | null>(null);

  const physicsPrevDt = useRef<number>(1 / 60);

  const { invalidate } = useThree();

  const activeWalkerId = useSceneStore(state => state.activeWalkerId);
  const extraStates = useSceneStore(state => state.extraStates);

  const activeActionKey = useMemo(() => {
    if (extraStates.aiFullTour) return 'aiFullTour';
    if (extraStates.aiGoToilet) return 'aiGoToilet';
    if (extraStates.aiSitDesk1) return 'aiSitDesk1';
    if (extraStates.aiSitOfficeChair) return 'aiSitOfficeChair';
    if (extraStates.aiSitDesk2) return 'aiSitDesk2';
    if (extraStates.aiBedWest) return 'aiBedWest';
    if (extraStates.aiBedEast) return 'aiBedEast';
    if (extraStates.aiBathtub) return 'aiBathtub';
    if (extraStates.aiShower) return 'aiShower';
    if (extraStates.aiGardenSofaEast) return 'aiGardenSofaEast';
    if (extraStates.aiGardenSofaWest) return 'aiGardenSofaWest';
    if (extraStates.aiCooking) return 'aiCooking';
    if (extraStates.aiKallaxNE) return 'aiKallaxNE';
    if (extraStates.aiFreshAir) return 'aiFreshAir';
    return null;
  }, [extraStates]);

  const activeActionScenario = useMemo(() => {
    switch (activeActionKey) {
      case 'aiFullTour': return ACTION_FULL_TOUR;
      case 'aiGoToilet': return ACTION_GO_TO_TOILET;
      case 'aiSitDesk1': return ACTION_SIT_DESK_1;
      case 'aiSitOfficeChair': return ACTION_SIT_OFFICE_CHAIR;
      case 'aiSitDesk2': return ACTION_SIT_DESK_2;
      case 'aiBedWest': return ACTION_BED_WEST;
      case 'aiBedEast': return ACTION_BED_EAST;
      case 'aiBathtub': return ACTION_BATHTUB;
      case 'aiShower': return ACTION_SHOWER;
      case 'aiGardenSofaEast': return ACTION_GARDEN_SOFA_EAST;
      case 'aiGardenSofaWest': return ACTION_GARDEN_SOFA_WEST;
      case 'aiCooking': return ACTION_COOKING;
      case 'aiKallaxNE': return ACTION_KALLAX_NE;
      case 'aiFreshAir': return ACTION_FRESH_AIR;
      default: return null;
    }
  }, [activeActionKey]);

  const delphinaScenario = useMemo(() => {
    if (id !== 'delphina' && id !== 'vivida' && id !== 'angelina' && id !== 'cha' && id !== 'sabira' && id !== 'lgbta' && id !== 'marissa') return null;
    const actions = [
      ACTION_SIT_DESK_1, ACTION_SIT_OFFICE_CHAIR, ACTION_SIT_DESK_2, ACTION_BED_WEST, ACTION_BED_EAST,
      ACTION_BATHTUB, ACTION_SHOWER, ACTION_GARDEN_SOFA_EAST, ACTION_GARDEN_SOFA_WEST,
      ACTION_COOKING, ACTION_KALLAX_NE, ACTION_FRESH_AIR, ACTION_GO_TO_TOILET
    ];
    // Danses aléatoires disponibles pour intercaler entre les actions
    const danceAnims = [
      'media/sandbox/anims/anim_belly_dance.glb',
      'media/sandbox/anims/anim_dancing_twerk.glb',
      'media/sandbox/anims/anim_hip_hop_dancing.glb',
      'media/sandbox/anims/anim_hip_hop_dancing_2.glb',
      'media/sandbox/anims/anim_salsa_dancing.glb',
      'media/sandbox/anims/anim_samba_dancing.glb',
      'media/sandbox/anims/anim_house_dancing.glb',
      'media/sandbox/anims/anim_capoeira.glb',
      'media/sandbox/anims/anim_rumba_dancing.glb',
      'media/sandbox/anims/anim_gangnam_style.glb',
    ];
    const randomDance = (): AgentInstruction => ({
      type: 'INTERACT',
      animation: danceAnims[Math.floor(Math.random() * danceAnims.length)],
      duration: 8.0 + Math.random() * 7.0, // 8 à 15 secondes de danse
    });
    // Shuffle the array of action groups
    const shuffled = [...actions].sort(() => Math.random() - 0.5);
    // Interposer une danse aléatoire entre chaque action
    const withDances: AgentInstruction[][] = [];
    shuffled.forEach((action, i) => {
      withDances.push(action);
      if (i < shuffled.length - 1) withDances.push([randomDance()]);
    });
    return withDances.flat();
  }, [id]);

  const isGuidedTour = activeActionKey && id === activeWalkerId;
  const isDelphinaNpc = (id === 'delphina' || id === 'vivida' || id === 'angelina' || id === 'cha' || id === 'sabira' || id === 'lgbta' || id === 'marissa') && id !== activeWalkerId;

  const finalScenario = isGuidedTour ? activeActionScenario : (isDelphinaNpc ? delphinaScenario : null);
  const loopScenario = isDelphinaNpc;

  const { update: updateAgent } = useAgentController(
    id,
    finalScenario,
    loopScenario, // Boucle uniquement si c'est le bot aléatoire (Delphina)
    () => {
      if (groupRef.current) {
        return {
          x: groupRef.current.position.x,
          z: groupRef.current.position.z,
          rotY: groupRef.current.rotation.y
        };
      }
      return { x: npcPosition[0], z: npcPosition[2], rotY: npcRotationY };
    },
    () => {
      if (activeActionKey) {
        useSceneStore.setState(s => ({
          extraStates: { ...s.extraStates, [activeActionKey]: false }
        }));
      }
    }
  );

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

      const initialRestQ = (bone as any).restLocalQuaternion ? (bone as any).restLocalQuaternion.clone() : bone.quaternion.clone();
      breastChain.push({
        bone,
        restQuat: initialRestQ,
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

  useEffect(() => {
    if (!scene) return;
    scene.traverse(o => {
      const c = o as any;
      if (c.isMesh) {
        c.castShadow = characterShadows;
        c.receiveShadow = characterShadows;
      }
    });
    invalidate();
  }, [scene, characterShadows, invalidate]);

  const poseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onToggle = (e: any) => {
      if (e.detail?.key === 'walker-anim-loop') {
        animLoopModeRef.current = e.detail.value || 'infinite';
        return;
      }
      if (e.detail?.key === 'lara-expression' && isActive) {
        setExpression(e.detail.value || 'neutral');
        invalidate();
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
          customAnimName.current = null;
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
      if (e.detail.key === 'lara-haircut') {
        setHaircut(e.detail.value || 'original');
        invalidate();
        return;
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
            'lara-expression'
          ]
        };
      } else {
        delete c.userData.hoverAction;
      }
    });
  }, [isActive, name, scene]);

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

  // Dynamic Haircut Swap system (hair_pack_part_2.glb & mira_hair_2026.glb)
  useEffect(() => {
    if (!scene) return;

    // 1. Visibilité de la chevelure et de la tresse (braid) d'origine
    scene.traverse(o => {
      if ((o as THREE.Mesh).isMesh) {
        const m = o as THREE.Mesh;
        const meshName = (m.name || '').toLowerCase();
        const mat = m.material;
        const matName = mat ? (Array.isArray(mat) ? (mat[0]?.name || '').toLowerCase() : (mat.name || '').toLowerCase()) : '';
        const isBraid = meshName.includes('braid') || meshName.includes('pony') || matName.includes('braid') || matName.includes('pony');
        const isOriginalHair = meshName.includes('hair') || isBraid || matName.includes('hair');

        if (isOriginalHair) {
          const show = haircut === 'original' && !(variant === 'angelina' && isBraid);
          m.visible = show;
          if (mat) {
            const mats = Array.isArray(mat) ? mat : [mat];
            mats.forEach(mt => { if (mt) mt.visible = show; });
          }
        }
      }
    });

    // 2. Nettoyage des anciennes coupes personnalisées
    const resolvedHName = resolveTargetBoneName(scene, 'Head');
    const headBone = headBoneRef.current || (resolvedHName ? scene.getObjectByName(resolvedHName) as THREE.Bone : null);
    if (!headBone) return;

    const existingAttachment = headBone.getObjectByName('lara_custom_hair_attachment');
    if (existingAttachment) {
      headBone.remove(existingAttachment);
    }

    if (haircut === 'original') {
      invalidate();
      return;
    }

    // 3. Extrait de la coupe sélectionnée
    let sourceGroup: THREE.Object3D | null = null;

    if (hairPackGltf && hairPackGltf.scene) {
      const hairNumber = haircut.replace('hair_', '');
      const targetGroupName = `Hair${hairNumber}_ARM_`;
      hairPackGltf.scene.traverse(child => {
        if (!sourceGroup && child.name.startsWith(targetGroupName)) {
          sourceGroup = child;
        }
      });
    }

    if (sourceGroup) {
      const clonedHair = SkeletonUtils.clone(sourceGroup as THREE.Object3D);
      clonedHair.name = 'lara_custom_hair_attachment';

      // 1. Configurer la visibilité, les couches de rendu et le tri de transparence des mèches (avec clonage des matériaux et sauvegarde des poses d'origine)
      clonedHair.traverse(child => {
        child.frustumCulled = false;
        child.layers.mask = scene.layers.mask;
        if ((child as any).isBone) {
          (child as any).restLocalQuaternion = (child as THREE.Bone).quaternion.clone();
        }
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          m.visible = true;
          m.renderOrder = 1;
          if (Array.isArray(m.material)) {
            m.material = m.material.map(mat => {
              if (!mat) return mat;
              const clonedMat = mat.clone();
              clonedMat.side = THREE.DoubleSide;
              clonedMat.alphaTest = 0.5;
              clonedMat.depthWrite = true;
              clonedMat.needsUpdate = true;
              return clonedMat;
            });
          } else if (m.material) {
            const clonedMat = m.material.clone();
            clonedMat.side = THREE.DoubleSide;
            clonedMat.alphaTest = 0.5;
            clonedMat.depthWrite = true;
            clonedMat.needsUpdate = true;
            m.material = clonedMat;
          }
        }
      });

      // 2. Trouver l'os bip_head / head propre à cette coupe
      let hairHeadBone: THREE.Object3D | null = null;
      clonedHair.traverse(c => {
        const nLower = (c.name || '').toLowerCase();
        if (nLower.startsWith('bip_head') || nLower.startsWith('head_140') || nLower === 'head') {
          if (!hairHeadBone) hairHeadBone = c;
        }
      });

      // Calcul de la Bounding Box de la coupe pour homogénéiser l'échelle globale
      clonedHair.updateMatrixWorld(true);
      const visibleHairBox = new THREE.Box3();
      clonedHair.traverse(child => {
        if ((child as THREE.Mesh).isMesh && child.visible) {
          const m = child as THREE.Mesh;
          if (m.geometry) {
            m.geometry.computeBoundingBox();
            if (m.geometry.boundingBox) {
              const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
              visibleHairBox.union(b);
            }
          }
        }
      });
      const attachmentGroup = new THREE.Group();
      attachmentGroup.name = 'lara_custom_hair_attachment';

      // Échelle augmentée à 110% (+10%) pour s'adapter à la tête de Lara
      const s = 1.4;
      clonedHair.scale.set(s, s, s);

      // Repositionner le groupe pour que l'os bip_head de la coupe coïncide exactement avec le Head bone de Lara
      if (hairHeadBone) {
        clonedHair.updateMatrixWorld(true);
        const headLocalPos = (hairHeadBone as THREE.Object3D).position.clone();
        // Rehaussement de la perruque sur Y pour couvrir le sommet de la tête
        clonedHair.position.set(
          -headLocalPos.x * s,
          -headLocalPos.y * s + 0.07,
          -headLocalPos.z * s
        );
      } else {
        clonedHair.position.set(0, 0.15, 0);
      }

      attachmentGroup.add(clonedHair);
      headBone.add(attachmentGroup);

      // Pré-filtrer et optimiser en cache la liste exacte des os de mèches de la coupe (customHairAnimBonesRef)
      const animBones: { bone: THREE.Bone; restQ: THREE.Quaternion; index: number }[] = [];
      clonedHair.traverse(c => {
        if ((c as any).isBone) {
          const b = c as THREE.Bone;
          if (!(b as any).restLocalQuaternion) {
            (b as any).restLocalQuaternion = b.quaternion.clone();
          }
          const nLower = (b.name || '').toLowerCase();
          const isRootOrScalpBone = nLower.includes('bip_head') || nLower.includes('bip_neck') || nLower.includes('bip_spine') || nLower.startsWith('head') || nLower.includes('root') || nLower.includes('scalp') || nLower.startsWith('bone3_') || nLower.startsWith('bone4_') || b.parent === clonedHair;

          if (!isRootOrScalpBone) {
            const index = parseInt(nLower.replace(/\D/g, ''), 10) || 1;
            animBones.push({
              bone: b,
              restQ: (b as any).restLocalQuaternion,
              index,
            });
          }
        }
      });
      customHairAnimBonesRef.current = animBones;
    }

    invalidate();
  }, [scene, haircut, hairPackGltf, invalidate]);

  useEffect(() => {
    if (customIdleAnimPath && scene && mixerRef.current && !actionsRef.current[customIdleAnimPath]) {
      const loader = new GLTFLoader();
      loader.load(customIdleAnimPath, (gltf: any) => {
        const clip = gltf.animations[0];
        if (clip) {
          const cacheKey = id + '_' + customIdleAnimPath;
          let finalClip = _retargetCache[cacheKey];
          if (!finalClip) {
            gltf.scene.updateMatrixWorld(true);
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

  useFrame((state, rawDelta) => {
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
        if (isGuidedTour) {
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, 0, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          customAnimName.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden;

          // Synchronise la position IA avec la caméra FPV
          cameraState.walkerX = agentState.x;
          cameraState.walkerZ = agentState.z;
          cameraState.walkYaw = agentState.rotY;
          cameraState.isAIControlled = true;
        } else {
          groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
          groupRef.current.rotation.y = cameraState.walkYaw;
          groupRef.current.visible = !cameraState.walkerHidden;
          cameraState.isAIControlled = false;
        }
      } else if (isNPC) {
        if (isDelphinaNpc) {
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, 0, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          customAnimName.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
        } else {
          const savedPos = cameraState.positions[id];
          const px = savedPos ? savedPos.x : npcPosition[0];
          const py_pos = savedPos ? savedPos.y : npcPosition[1];
          const pz = savedPos ? savedPos.z : npcPosition[2];
          const py_rot = savedPos ? savedPos.yaw : npcRotationY;
          groupRef.current.position.set(px, py_pos, pz);
          groupRef.current.rotation.y = py_rot;
          groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
        }
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

    // Si le joueur reprend le contrôle manuel (plus de visite guidée), effacer l'animation IA
    if (isActive && !isGuidedTour && customAnimName.current) {
      customAnimName.current = null;
    }

    if (isNPC && customIdleAnimPath && target === 'idle') {
      target = customIdleAnimPath;
    }

    if (customAnimName.current) {
      target = customAnimName.current;
      if (!actions[target] && target.endsWith('.glb')) {
        if (!loadingAnimsRef.current.has(target)) {
          loadingAnimsRef.current.add(target);
          const loader = new GLTFLoader();
          loader.load(target, (gltf: any) => {
            const clip = gltf.animations[0];
            if (clip && mixerRef.current) {
              const cacheKey = id + '_' + target;
              let finalClip = _retargetCache[cacheKey];
              if (!finalClip) {
                gltf.scene.updateMatrixWorld(true);
                finalClip = retargetClip(clip, scene, gltf.scene);
                _retargetCache[cacheKey] = finalClip;
              }
              finalClip.name = target;
              const action = mixerRef.current.clipAction(finalClip);
              action.enabled = true;
              action.play();
              action.setEffectiveWeight(0);
              actionsRef.current[target] = action;
              invalidate();
            }
          });
        }
        target = 'idle'; // fallback while loading
      }
    }

    // Consider rotating as moving to prevent idle timeout freezes
    const isRotating = isActive && useSceneStore.getState().activeWalkerId === id &&
      (Math.abs(cameraState.walkYaw - (groupRef.current.userData.lastYaw || 0)) > 0.001);
    groupRef.current.userData.lastYaw = cameraState.walkYaw;

    if (!isPaused && !isMoving && !isPreview && !isRotating && !isGuidedTour) {
        idleTimerRef.current += delta;
    } else {
        idleTimerRef.current = 0;
    }

    // Both characters time out after 10s of inactivity to save CPU
    const isIdleTimeout = idleTimerRef.current > 10;

    const to = actions[target];
    if (to && activeActionName.current !== target) {
        const from = activeActionName.current ? actions[activeActionName.current] : null;
        if (from) from.fadeOut(0.2);
        to.reset().fadeIn(0.2).play();
        to.setEffectiveWeight(1);
        activeActionName.current = target;
        idleTimerRef.current = 0;
    }

    if (!isPaused && !isIdleTimeout) {
        mixer.update(delta);

        // Physique réactive & Gravité universelle (sans vent/bruit continu au repos)
        const isPhysicsActive = useSceneStore.getState().layers.hairPhysics;
        const animBones = customHairAnimBonesRef.current;

        if (animBones.length > 0) {
          const time = state.clock.getElapsedTime();
          const eulerAnim = new THREE.Euler(0, 0, 0, 'YXZ');
          const animQuat = new THREE.Quaternion();
          const gravityWorld = new THREE.Vector3(0, -1, 0); // Gravité universelle vers le bas

          // L'oscillation ("rebond/vent") s'active avec une perte d'énergie progressive au repos
          const isTorsoMoving = target !== 'idle' && torsoAccelRef.current && torsoAccelRef.current.lengthSq() > 0.01;
          const targetEnergy = (isMoving || isTorsoMoving) ? (target.includes('run') ? 1.5 : 1.0) : 0.0;
          wigEnergyRef.current += (targetEnergy - wigEnergyRef.current) * (delta * 3.0);
          const motionFactor = wigEnergyRef.current;

          for (let i = 0; i < animBones.length; i++) {
            const { bone, restQ, index } = animBones[i];
            if (isPhysicsActive) {
              // 1. Gravité monde passive : s'applique toujours (même au repos absolu / couché / debout)
              const parent = bone.parent;
              let gravityQuat = new THREE.Quaternion();
              if (parent) {
                const parentWorldQ = parent.getWorldQuaternion(new THREE.Quaternion());
                const localGravity = gravityWorld.clone().applyQuaternion(parentWorldQ.clone().invert());
                const defaultDir = new THREE.Vector3(0, -1, 0);
                gravityQuat.setFromUnitVectors(defaultDir, localGravity);
              }

              // 2. Oscillations dynamiques : n'existent QUE pendant le mouvement (0 au repos)
              if (motionFactor > 0) {
                const phase = time * 4.0 + index * 0.7;
                // Pour éviter que l'orientation locale chaotique des os annule le gauche/droite,
                // on distribue équitablement le balancier sur les axes X et Z avec un fort Z.
                const swingX = Math.sin(phase) * 0.12 * motionFactor;
                const swingY = Math.sin(phase * 0.6 + 1.2) * 0.12 * motionFactor;
                const swingZ = Math.sin(phase * 0.85 + 2.0) * 0.35 * motionFactor; // <-- Z très prononcé (gauche/droite)

                eulerAnim.set(swingX, swingY, swingZ, 'YXZ');
                animQuat.setFromEuler(eulerAnim);
              } else {
                animQuat.identity();
              }

              // Repos pur = Pose neutre + Gravité monde. Mouvement = Gravité + Rebond dynamique.
              bone.quaternion.copy(restQ).slerp(restQ.clone().multiply(gravityQuat), 0.55).multiply(animQuat);
            } else {
              bone.quaternion.copy(restQ);
            }
          }
        }

        // Reset / Application des expressions faciales dynamiques
        const currentExpr = expressionRef.current as string;
        if (currentExpr === 'neutral') {
          // Remise à zéro explicite de tous les os du visage
          scene.traverse(c => {
            if ((c as any).isBone && c.name.startsWith('head_') && !c.name.includes('ponytail') && !c.name.includes('neck')) {
              if ((c as any).userData.restPos) {
                (c as any).position.copy((c as any).userData.restPos);
              }
              if ((c as any).userData.restQuat) {
                (c as any).quaternion.copy((c as any).userData.restQuat);
              }
            }
          });
        } else if (currentExpr === 'smirk') {
          // Sourire en coin très prononcé (coin droit relevé + étiré)
          const lipRight1 = scene.getObjectByName('head_lip_upper_right_1');
          const lipRight2 = scene.getObjectByName('head_lip_upper_right_2');
          const lipLowerRight2 = scene.getObjectByName('head_lip_lower_right_2');
          const cheekRight = scene.getObjectByName('head_cheek_right');
          const browRight1 = scene.getObjectByName('head_eyebrow_right_1');

          if (lipRight1 && lipRight1.userData.restPos) {
            lipRight1.position.set(lipRight1.userData.restPos.x - 0.008, lipRight1.userData.restPos.y + 0.015, lipRight1.userData.restPos.z + 0.008);
          }
          if (lipRight2 && lipRight2.userData.restPos) {
            lipRight2.position.set(lipRight2.userData.restPos.x - 0.012, lipRight2.userData.restPos.y + 0.022, lipRight2.userData.restPos.z + 0.010);
          }
          if (lipLowerRight2 && lipLowerRight2.userData.restPos) {
            lipLowerRight2.position.set(lipLowerRight2.userData.restPos.x - 0.008, lipLowerRight2.userData.restPos.y + 0.012, lipLowerRight2.userData.restPos.z + 0.006);
          }
          if (cheekRight && cheekRight.userData.restPos) {
            cheekRight.position.set(cheekRight.userData.restPos.x - 0.006, cheekRight.userData.restPos.y + 0.010, cheekRight.userData.restPos.z + 0.005);
          }
          if (browRight1 && browRight1.userData.restPos) {
            browRight1.position.set(browRight1.userData.restPos.x, browRight1.userData.restPos.y + 0.005, browRight1.userData.restPos.z);
          }
        } else if (currentExpr === 'smile') {
          // Vrai sourire symétrique (Coins des lèvres relevés + joues rehaussées)
          const lipRight1 = scene.getObjectByName('head_lip_upper_right_1');
          const lipRight2 = scene.getObjectByName('head_lip_upper_right_2');
          const lipLeft1 = scene.getObjectByName('head_lip_upper_left_1');
          const lipLeft2 = scene.getObjectByName('head_lip_upper_left_2');
          const lipLowerRight2 = scene.getObjectByName('head_lip_lower_right_2');
          const lipLowerLeft2 = scene.getObjectByName('head_lip_lower_left_2');
          const cheekRight = scene.getObjectByName('head_cheek_right');
          const cheekLeft = scene.getObjectByName('head_cheek_left');

          if (lipRight1 && lipRight1.userData.restPos) {
            lipRight1.position.set(lipRight1.userData.restPos.x - 0.006, lipRight1.userData.restPos.y + 0.012, lipRight1.userData.restPos.z + 0.006);
          }
          if (lipRight2 && lipRight2.userData.restPos) {
            lipRight2.position.set(lipRight2.userData.restPos.x - 0.010, lipRight2.userData.restPos.y + 0.018, lipRight2.userData.restPos.z + 0.008);
          }
          if (lipLeft1 && lipLeft1.userData.restPos) {
            lipLeft1.position.set(lipLeft1.userData.restPos.x + 0.006, lipLeft1.userData.restPos.y + 0.012, lipLeft1.userData.restPos.z + 0.006);
          }
          if (lipLeft2 && lipLeft2.userData.restPos) {
            lipLeft2.position.set(lipLeft2.userData.restPos.x + 0.010, lipLeft2.userData.restPos.y + 0.018, lipLeft2.userData.restPos.z + 0.008);
          }
          if (lipLowerRight2 && lipLowerRight2.userData.restPos) {
            lipLowerRight2.position.set(lipLowerRight2.userData.restPos.x - 0.006, lipLowerRight2.userData.restPos.y + 0.010, lipLowerRight2.userData.restPos.z + 0.005);
          }
          if (lipLowerLeft2 && lipLowerLeft2.userData.restPos) {
            lipLowerLeft2.position.set(lipLowerLeft2.userData.restPos.x + 0.006, lipLowerLeft2.userData.restPos.y + 0.010, lipLowerLeft2.userData.restPos.z + 0.005);
          }
          if (cheekRight && cheekRight.userData.restPos) {
            cheekRight.position.set(cheekRight.userData.restPos.x - 0.005, cheekRight.userData.restPos.y + 0.008, cheekRight.userData.restPos.z + 0.004);
          }
          if (cheekLeft && cheekLeft.userData.restPos) {
            cheekLeft.position.set(cheekLeft.userData.restPos.x + 0.005, cheekLeft.userData.restPos.y + 0.008, cheekLeft.userData.restPos.z + 0.004);
          }
        } else if (currentExpr === 'wink') {
          // Clin d'œil très prononcé (œil gauche totalement fermé + sourcil froncé + léger sourire)
          const eyeLUpper = scene.getObjectByName('head_eyelid_left_upper');
          const eyeLLower = scene.getObjectByName('head_eyelid_left_lower');
          const browLeft1 = scene.getObjectByName('head_eyebrow_left_1');
          const browLeft2 = scene.getObjectByName('head_eyebrow_left_2');
          const browLeft3 = scene.getObjectByName('head_eyebrow_left_3');
          const lipRight1 = scene.getObjectByName('head_lip_upper_right_1');
          const lipRight2 = scene.getObjectByName('head_lip_upper_right_2');

          if (eyeLUpper && eyeLUpper.userData.restPos) {
            eyeLUpper.position.set(eyeLUpper.userData.restPos.x, eyeLUpper.userData.restPos.y - 0.018, eyeLUpper.userData.restPos.z + 0.002);
          }
          if (eyeLLower && eyeLLower.userData.restPos) {
            eyeLLower.position.set(eyeLLower.userData.restPos.x, eyeLLower.userData.restPos.y + 0.016, eyeLLower.userData.restPos.z + 0.002);
          }
          if (browLeft1 && browLeft1.userData.restPos) {
            browLeft1.position.set(browLeft1.userData.restPos.x, browLeft1.userData.restPos.y - 0.008, browLeft1.userData.restPos.z);
          }
          if (browLeft2 && browLeft2.userData.restPos) {
            browLeft2.position.set(browLeft2.userData.restPos.x, browLeft2.userData.restPos.y - 0.008, browLeft2.userData.restPos.z);
          }
          if (browLeft3 && browLeft3.userData.restPos) {
            browLeft3.position.set(browLeft3.userData.restPos.x, browLeft3.userData.restPos.y - 0.008, browLeft3.userData.restPos.z);
          }
          if (lipRight1 && lipRight1.userData.restPos) {
            lipRight1.position.set(lipRight1.userData.restPos.x - 0.005, lipRight1.userData.restPos.y + 0.010, lipRight1.userData.restPos.z + 0.005);
          }
          if (lipRight2 && lipRight2.userData.restPos) {
            lipRight2.position.set(lipRight2.userData.restPos.x - 0.008, lipRight2.userData.restPos.y + 0.014, lipRight2.userData.restPos.z + 0.006);
          }
        } else if (currentExpr === 'open_mouth') {
          // Bouche grande ouverte : ouverture par élévation de la lèvre supérieure + léger abaissement mâchoire (lèvre inférieure reste collée à la dentition)
          const jaw = scene.getObjectByName('head_jaw');
          const lipUpperMiddle = scene.getObjectByName('head_lip_upper_middle');
          const lipUpperLeft1 = scene.getObjectByName('head_lip_upper_left_1');
          const lipUpperRight1 = scene.getObjectByName('head_lip_upper_right_1');
          const lipUpperLeft2 = scene.getObjectByName('head_lip_upper_left_2');
          const lipUpperRight2 = scene.getObjectByName('head_lip_upper_right_2');

          if (jaw && jaw.userData.restPos) {
            // Abaissement très modéré de la mâchoire globale
            jaw.position.set(
              jaw.userData.restPos.x,
              jaw.userData.restPos.y - 0.006,
              jaw.userData.restPos.z
            );
          }
          // Lèvre supérieure bien relevée pour ouvrir la bouche par le haut
          if (lipUpperMiddle && lipUpperMiddle.userData.restPos) {
            lipUpperMiddle.position.set(
              lipUpperMiddle.userData.restPos.x,
              lipUpperMiddle.userData.restPos.y + 0.016,
              lipUpperMiddle.userData.restPos.z + 0.005
            );
          }
          if (lipUpperLeft1 && lipUpperLeft1.userData.restPos) {
            lipUpperLeft1.position.set(
              lipUpperLeft1.userData.restPos.x,
              lipUpperLeft1.userData.restPos.y + 0.012,
              lipUpperLeft1.userData.restPos.z + 0.004
            );
          }
          if (lipUpperRight1 && lipUpperRight1.userData.restPos) {
            lipUpperRight1.position.set(
              lipUpperRight1.userData.restPos.x,
              lipUpperRight1.userData.restPos.y + 0.012,
              lipUpperRight1.userData.restPos.z + 0.004
            );
          }
          if (lipUpperLeft2 && lipUpperLeft2.userData.restPos) {
            lipUpperLeft2.position.set(
              lipUpperLeft2.userData.restPos.x,
              lipUpperLeft2.userData.restPos.y + 0.008,
              lipUpperLeft2.userData.restPos.z + 0.003
            );
          }
          if (lipUpperRight2 && lipUpperRight2.userData.restPos) {
            lipUpperRight2.position.set(
              lipUpperRight2.userData.restPos.x,
              lipUpperRight2.userData.restPos.y + 0.008,
              lipUpperRight2.userData.restPos.z + 0.003
            );
          }
        }


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
              const { bone, relQuat, axis, worldLength } = node;
              const parent = bone.parent;
              if (!parent) continue;



              const jointWorld = new THREE.Vector3().setFromMatrixPosition(bone.matrixWorld);

              // Direction de repos verticale de la tresse dirigée vers le sol (-Y monde projeté)
              const downWorld = new THREE.Vector3(0, -1, 0);
              const restDir = downWorld.clone().lerp(axis.clone().applyQuaternion(baseParentQuat.clone().multiply(relQuat)).normalize(), 0.15).normalize();
              const restTip = jointWorld.clone().addScaledVector(restDir, worldLength);

              // Teleportation safety reset
              const dist = jointWorld.distanceTo(node.tipWorld);
              if (dist > worldLength * 3) {
                node.tipWorld.copy(restTip);
                node.tipPrev.copy(restTip);
              }

              const isHeadMoving = isMoving || (target !== 'idle');
              const dampingFactor = isHeadMoving ? 0.35 : 0.65;

              const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - dampingFactor));
              const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);

              // Souplesse d'attraction vers le bas (gravité naturelle)
              const lerpStiffness = isHeadMoving ? 0.05 : 0.12;
              next.lerp(restTip, lerpStiffness);

              // Restitution et frein au repos si la vitesse est faible (immobilisation totale sans bruit)
              if (!isHeadMoving) {
                vel.set(0, 0, 0);
                next.lerp(restTip, 0.8);
              }
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

                // 2. Colliders géométriques (Tête sphérique + Sac à dos OBB rectangulaire plat)
                let backDir = new THREE.Vector3(0, 0, -1);
                let rightDir = new THREE.Vector3(1, 0, 0);
                let upDir = new THREE.Vector3(0, 1, 0);

                if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
                  const headW = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld);
                  const hipsW = new THREE.Vector3().setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
                  const lShoulderW = new THREE.Vector3().setFromMatrixPosition(lShoulderRef.current.matrixWorld);
                  const rShoulderW = new THREE.Vector3().setFromMatrixPosition(rShoulderRef.current.matrixWorld);

                  upDir = new THREE.Vector3().subVectors(headW, hipsW).normalize();
                  rightDir = new THREE.Vector3().subVectors(lShoulderW, rShoulderW).normalize();
                  backDir.crossVectors(upDir, rightDir).normalize();
                }

                // Tête (Sphère douce)
                if (headBoneRef.current) {
                  const center = new THREE.Vector3().setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(backDir, 4);
                  const radius = 13.0;
                  const dist = next.distanceTo(center);
                  if (dist < radius) next.add(new THREE.Vector3().subVectors(next, center).normalize().multiplyScalar(radius - dist));
                }

                // Sac à dos (Collider Rectangulaire Plat OBB)
                if (spine2BoneRef.current) {
                  const backpackCenter = new THREE.Vector3().setFromMatrixPosition(spine2BoneRef.current.matrixWorld).addScaledVector(backDir, 11);
                  // Dimensions du rectangle du sac à dos (Demi-largeur = 14cm, Demi-hauteur = 18cm, Épaisseur arrière = 8cm)
                  const localPos = new THREE.Vector3().subVectors(next, backpackCenter);
                  const px = localPos.dot(rightDir);
                  const py = localPos.dot(upDir);
                  const pz = localPos.dot(backDir);

                  const halfW = 14.0;
                  const halfH = 18.0;
                  const thickness = 7.0;

                  // Si le point de la tresse rentre dans la boîte rectangulaire du sac
                  if (Math.abs(px) < halfW && Math.abs(py) < halfH && pz < thickness && pz > -5.0) {
                    // Pousser le nœud de la tresse à plat sur la surface arrière du sac à dos
                    next.addScaledVector(backDir, thickness - pz);
                  }
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

              // Orientation réelle des os de la tresse (ponytail) d'après le résultat physique Verlet
              const currentDirWorld = dir.clone().normalize();
              const parentWQuat = parent.getWorldQuaternion(new THREE.Quaternion());
              const targetQuatWorld = new THREE.Quaternion().setFromUnitVectors(axis, currentDirWorld);
              bone.quaternion.copy(parentWQuat.invert().multiply(targetQuatWorld));

              bone.updateMatrixWorld(true);
            }
          }
        }

        // 1. Détection de la véritable vitesse/accélération du torse en temps réel
        if (spine2BoneRef.current) {
          const currentSpinePos = new THREE.Vector3();
          spine2BoneRef.current.getWorldPosition(currentSpinePos);
          if (prevSpinePosRef.current) {
            // Vitesse instantanée du torse (delta de déplacement monde)
            const spineVel = currentSpinePos.clone().sub(prevSpinePosRef.current).divideScalar(Math.max(0.001, simDt));
            // Accélération (impulsion de mouvement récurrente)
            const spineAccel = spineVel.clone().sub(prevSpineVelRef.current).divideScalar(Math.max(0.001, simDt));

            // Si l'accélération du torse est quasi nulle (personnage fixe/immobile/T-pose), l'excitation externe F_ext = 0
            if (spineAccel.lengthSq() > 0.01) {
              torsoAccelRef.current.copy(spineAccel);
            } else {
              torsoAccelRef.current.lerp(new THREE.Vector3(0, 0, 0), simDt * 10.0);
            }
            prevSpineVelRef.current.copy(spineVel);
          } else {
            prevSpinePosRef.current = currentSpinePos.clone();
            prevSpineVelRef.current = new THREE.Vector3(0, 0, 0);
          }
          prevSpinePosRef.current.copy(currentSpinePos);
        }

        // 2. Intégrateur masse-ressort-amortisseur authentique (Physical Spring-Damper)
        const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;
        const breastIntensity = useSceneStore.getState().layers.breastIntensity ?? 1.0;
        const breastMass = useSceneStore.getState().layers.breastMass ?? 1.0;
        const breastFirmness = useSceneStore.getState().layers.breastFirmness ?? 1.0;
        const braElasticity = useSceneStore.getState().layers.braElasticity ?? 1.0;
        const braElasticityXZ = useSceneStore.getState().layers.braElasticityXZ ?? 1.0;
        const breastLagDelay = useSceneStore.getState().layers.breastLagDelay ?? 1.0;
        const maxBreastAngleDeg = useSceneStore.getState().layers.maxBreastAngle ?? 25;
        const maxBreastAngleXZDeg = useSceneStore.getState().layers.maxBreastAngleXZ ?? 35;

        const maxBreastAngleRad = (maxBreastAngleDeg * Math.PI) / 180;
        const maxBreastAngleXZRad = (maxBreastAngleXZDeg * Math.PI) / 180;

        if (enableBreastPhysics && breastIntensity > 0 && breastChainRef.current.length > 0) {
          const mass = Math.max(0.2, breastMass);

          // La fermeté (breastFirmness) règle la résistance au déplacement et la force de rappel vers le centre du torse
          const stiffness = (35.0 * braElasticity * breastFirmness);
          const damping = 10.0 * (1.0 + breastLagDelay * 0.4);

          // Moins de fermeté = plus de liberté de débattement horizontal autour du torse (multiplicateur 1.0 / breastFirmness)
          const softnessFactor = 1.0 / Math.max(0.1, breastFirmness);

          const externalForce = torsoAccelRef.current.clone().multiplyScalar((0.2 * breastIntensity * softnessFactor) / mass);
          externalForce.x *= braElasticityXZ * 1.5;
          externalForce.y *= braElasticity * 1.2;
          externalForce.z *= braElasticityXZ * 1.8;

          const accel = externalForce
            .addScaledVector(breastImpulseRef.current, -stiffness / mass)
            .addScaledVector(breastVelRef.current, -damping / mass);

          breastVelRef.current.addScaledVector(accel, simDt);
          breastImpulseRef.current.addScaledVector(breastVelRef.current, simDt);

          if (externalForce.lengthSq() < 0.0001) {
            breastVelRef.current.multiplyScalar(Math.max(0, 1 - simDt * 8.0));
            breastImpulseRef.current.multiplyScalar(Math.max(0, 1 - simDt * 6.0));
          }

          if (breastImpulseRef.current.lengthSq() < 1e-7) {
            breastImpulseRef.current.set(0, 0, 0);
            breastVelRef.current.set(0, 0, 0);
          }

          const eulerBreast = new THREE.Euler(0, 0, 0, 'ZXY');
          const animBreastQ = new THREE.Quaternion();

          for (let i = 0; i < breastChainRef.current.length; i++) {
            const { bone, restQuat } = breastChainRef.current[i];

            // Rebond vertical X et débattement horizontal Y/Z modulés par la fermeté configurée
            let swingX = Math.max(-maxBreastAngleRad, Math.min(maxBreastAngleRad, breastImpulseRef.current.y * 0.25));
            let swingY = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.x * 0.45 * softnessFactor));
            let swingZ = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.z * 0.45 * softnessFactor));

            eulerBreast.set(swingX, swingY, swingZ, 'ZXY');
            animBreastQ.setFromEuler(eulerBreast);

            const baseRest = (bone as any).userData?.restQuat || (bone as any).restLocalQuaternion || restQuat;
            bone.quaternion.copy(baseRest).multiply(animBreastQ);
          }
        }

        physicsPrevDt.current = simDt;
    }

    if (!isIdleTimeout || isMoving || isPreview) {
        invalidate();
    }
  });

  return (
    <group ref={groupRef} userData={{ animUnit: true }}>
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
  const openDoorOutwardsGltf = useGLTF('media/sandbox/anims/anim_open_door_outwards.glb');

  // New character anims
  const bellyDanceGltf = useGLTF('media/sandbox/anims/anim_belly_dance.glb');
  const dancingTwerkGltf = useGLTF('media/sandbox/anims/anim_dancing_twerk.glb');
  const soccerballGltf = useGLTF('media/sandbox/anims/anim_stall_soccerball_1.glb');
  const jabCrossGltf = useGLTF('media/sandbox/anims/anim_body_jab_cross.glb');
  const femaleLayingPose9Gltf = useGLTF('media/sandbox/anims/anim_female_laying_pose_9.glb');

  // Double leg takedown
  const takedownVictimGltf = useGLTF('media/sandbox/anims/anim_best_double_leg_takedown_victim.glb');
  const takedownAttackerGltf = useGLTF('media/sandbox/anims/anim_best_double_leg_takedown_attacker.glb');

  // Random Poses & Dances
  const femaleStandingPoseGltf = useGLTF('media/sandbox/anims/anim_female_standing_pose.glb');
  const femaleStandingPose1Gltf = useGLTF('media/sandbox/anims/anim_female_standing_pose_1.glb');
  const femaleStandingPose2Gltf = useGLTF('media/sandbox/anims/anim_female_standing_pose_2.glb');
  const femaleSittingPoseGltf = useGLTF('media/sandbox/anims/anim_female_sitting_pose.glb');
  const femaleSittingPose1Gltf = useGLTF('media/sandbox/anims/anim_female_sitting_pose_1.glb');
  const femaleSittingPose3Gltf = useGLTF('media/sandbox/anims/anim_female_sitting_pose_3.glb');
  const femaleDancePoseGltf = useGLTF('media/sandbox/anims/anim_female_dance_pose.glb');
  const femaleDynamicPoseGltf = useGLTF('media/sandbox/anims/anim_female_dynamic_pose.glb');
  const shakingHands2Gltf = useGLTF('media/sandbox/anims/anim_shaking_hands_2.glb');
  const handRaisingGltf = useGLTF('media/sandbox/anims/anim_hand_raising.glb');

  const hipHopDanceGltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing.glb');
  const hipHopDance1Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_1.glb');
  const hipHopDance2Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_2.glb');
  const hipHopDance4Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_4.glb');
  const hipHopDance6Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_6.glb');
  const hipHopDance7Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_7.glb');
  const hipHopDance10Gltf = useGLTF('media/sandbox/anims/anim_hip_hop_dancing_10.glb');
  const lockingHipHopGltf = useGLTF('media/sandbox/anims/anim_locking_hip_hop_dance.glb');
  const robotHipHopGltf = useGLTF('media/sandbox/anims/anim_robot_hip_hop_dance.glb');

  const salsaDanceGltf = useGLTF('media/sandbox/anims/anim_salsa_dancing.glb');
  const salsaDance1Gltf = useGLTF('media/sandbox/anims/anim_salsa_dancing_1.glb');
  const salsaDance3Gltf = useGLTF('media/sandbox/anims/anim_salsa_dancing_3.glb');
  const salsaDance4Gltf = useGLTF('media/sandbox/anims/anim_salsa_dancing_4.glb');

  const sambaDanceGltf = useGLTF('media/sandbox/anims/anim_samba_dancing.glb');
  const sambaDance1Gltf = useGLTF('media/sandbox/anims/anim_samba_dancing_1.glb');
  const sambaDance2Gltf = useGLTF('media/sandbox/anims/anim_samba_dancing_2.glb');

  const houseDanceGltf = useGLTF('media/sandbox/anims/anim_house_dancing.glb');
  const breakdanceUprockGltf = useGLTF('media/sandbox/anims/anim_breakdance_uprock.glb');
  const gangnamStyleGltf = useGLTF('media/sandbox/anims/anim_gangnam_style.glb');
  const capoeiraGltf = useGLTF('media/sandbox/anims/anim_capoeira.glb');
  const rumbaDanceGltf = useGLTF('media/sandbox/anims/anim_rumba_dancing.glb');
  const twistDanceGltf = useGLTF('media/sandbox/anims/anim_twist_dance.glb');
  const macarenaDanceGltf = useGLTF('media/sandbox/anims/anim_macarena_dance.glb');
  const macarenaDance1Gltf = useGLTF('media/sandbox/anims/anim_macarena_dance_1.glb');
  const swingDanceGltf = useGLTF('media/sandbox/anims/anim_swing_dancing.glb');
  const jazzDanceGltf = useGLTF('media/sandbox/anims/anim_jazz_dancing.glb');
  const canCanGltf = useGLTF('media/sandbox/anims/anim_can_can.glb');
  const ymcaDanceGltf = useGLTF('media/sandbox/anims/anim_ymca_dance.glb');

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
    'media/sandbox/anims/anim_open_door_outwards.glb': openDoorOutwardsGltf,
    'media/sandbox/anims/anim_laying_idle_1.glb': laying1Gltf,
    'media/sandbox/anims/anim_belly_dance.glb': bellyDanceGltf,
    'media/sandbox/anims/anim_dancing_twerk.glb': dancingTwerkGltf,
    'media/sandbox/anims/anim_stall_soccerball_1.glb': soccerballGltf,
    'media/sandbox/anims/anim_body_jab_cross.glb': jabCrossGltf,
    'media/sandbox/anims/anim_female_laying_pose_9.glb': femaleLayingPose9Gltf,
    'media/sandbox/anims/anim_best_double_leg_takedown_victim.glb': takedownVictimGltf,
    'media/sandbox/anims/anim_best_double_leg_takedown_attacker.glb': takedownAttackerGltf,
    'media/sandbox/anims/anim_female_standing_pose.glb': femaleStandingPoseGltf,
    'media/sandbox/anims/anim_female_standing_pose_1.glb': femaleStandingPose1Gltf,
    'media/sandbox/anims/anim_female_standing_pose_2.glb': femaleStandingPose2Gltf,
    'media/sandbox/anims/anim_female_sitting_pose.glb': femaleSittingPoseGltf,
    'media/sandbox/anims/anim_female_sitting_pose_1.glb': femaleSittingPose1Gltf,
    'media/sandbox/anims/anim_female_sitting_pose_3.glb': femaleSittingPose3Gltf,
    'media/sandbox/anims/anim_female_dance_pose.glb': femaleDancePoseGltf,
    'media/sandbox/anims/anim_female_dynamic_pose.glb': femaleDynamicPoseGltf,
    'media/sandbox/anims/anim_shaking_hands_2.glb': shakingHands2Gltf,
    'media/sandbox/anims/anim_hand_raising.glb': handRaisingGltf,
    'media/sandbox/anims/anim_hip_hop_dancing.glb': hipHopDanceGltf,
    'media/sandbox/anims/anim_hip_hop_dancing_1.glb': hipHopDance1Gltf,
    'media/sandbox/anims/anim_hip_hop_dancing_2.glb': hipHopDance2Gltf,
    'media/sandbox/anims/anim_hip_hop_dancing_4.glb': hipHopDance4Gltf,
    'media/sandbox/anims/anim_hip_hop_dancing_6.glb': hipHopDance6Gltf,
    'media/sandbox/anims/anim_hip_hop_dancing_7.glb': hipHopDance7Gltf,
    'media/sandbox/anims/anim_hip_hop_dancing_10.glb': hipHopDance10Gltf,
    'media/sandbox/anims/anim_locking_hip_hop_dance.glb': lockingHipHopGltf,
    'media/sandbox/anims/anim_robot_hip_hop_dance.glb': robotHipHopGltf,
    'media/sandbox/anims/anim_salsa_dancing.glb': salsaDanceGltf,
    'media/sandbox/anims/anim_salsa_dancing_1.glb': salsaDance1Gltf,
    'media/sandbox/anims/anim_salsa_dancing_3.glb': salsaDance3Gltf,
    'media/sandbox/anims/anim_salsa_dancing_4.glb': salsaDance4Gltf,
    'media/sandbox/anims/anim_samba_dancing.glb': sambaDanceGltf,
    'media/sandbox/anims/anim_samba_dancing_1.glb': sambaDance1Gltf,
    'media/sandbox/anims/anim_samba_dancing_2.glb': sambaDance2Gltf,
    'media/sandbox/anims/anim_house_dancing.glb': houseDanceGltf,
    'media/sandbox/anims/anim_breakdance_uprock.glb': breakdanceUprockGltf,
    'media/sandbox/anims/anim_gangnam_style.glb': gangnamStyleGltf,
    'media/sandbox/anims/anim_capoeira.glb': capoeiraGltf,
    'media/sandbox/anims/anim_rumba_dancing.glb': rumbaDanceGltf,
    'media/sandbox/anims/anim_twist_dance.glb': twistDanceGltf,
    'media/sandbox/anims/anim_macarena_dance.glb': macarenaDanceGltf,
    'media/sandbox/anims/anim_macarena_dance_1.glb': macarenaDance1Gltf,
    'media/sandbox/anims/anim_swing_dancing.glb': swingDanceGltf,
    'media/sandbox/anims/anim_jazz_dancing.glb': jazzDanceGltf,
    'media/sandbox/anims/anim_can_can.glb': canCanGltf,
    'media/sandbox/anims/anim_ymca_dance.glb': ymcaDanceGltf,
  }), [sittingGltf, swimmingGltf, pushUpGltf, climbingGltf, laying1Gltf, openDoorOutwardsGltf, bellyDanceGltf, dancingTwerkGltf, soccerballGltf, jabCrossGltf, femaleLayingPose9Gltf, takedownVictimGltf, takedownAttackerGltf, femaleStandingPoseGltf, femaleStandingPose1Gltf, femaleStandingPose2Gltf, femaleSittingPoseGltf, femaleDancePoseGltf, femaleDynamicPoseGltf, hipHopDanceGltf, hipHopDance1Gltf, hipHopDance2Gltf, hipHopDance4Gltf, hipHopDance6Gltf, hipHopDance7Gltf, hipHopDance10Gltf, lockingHipHopGltf, robotHipHopGltf, salsaDanceGltf, salsaDance1Gltf, salsaDance3Gltf, salsaDance4Gltf, sambaDanceGltf, sambaDance1Gltf, sambaDance2Gltf, houseDanceGltf, breakdanceUprockGltf, gangnamStyleGltf, capoeiraGltf, rumbaDanceGltf, twistDanceGltf, macarenaDanceGltf, macarenaDance1Gltf, swingDanceGltf, jazzDanceGltf, canCanGltf, ymcaDanceGltf, shakingHands2Gltf, femaleSittingPose1Gltf, femaleSittingPose3Gltf, handRaisingGltf]);

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
        // Inclure également toutes les animations de la map pour qu'elles soient prêtes à l'emploi (AI, interact, etc.)
        ...Object.entries(animGltfs)
          .filter(([_, gltf]) => gltf?.animations?.[0])
          .map(([path, gltf]) => {
            return Object.assign(gltf.animations[0].clone(), {
              name: path,
              userData: { animScene: gltf.scene }
            });
          })
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
const VIVID_PATH = 'media/vivida_red_lara_native.glb';

useGLTF.preload(LARA_PATH);
useGLTF.preload(ROSANNA_PATH);
useGLTF.preload(VIVID_PATH);
useGLTF.preload('media/sandbox/anims/anim_sitting_idle.glb');
useGLTF.preload('media/sandbox/anims/anim_swimming_to_edge.glb');
useGLTF.preload('media/sandbox/anims/anim_climbing.glb');
useGLTF.preload('media/sandbox/anims/anim_push_up.glb');
useGLTF.preload('media/sandbox/anims/anim_laying_idle_1.glb');
useGLTF.preload('media/sandbox/anims/anim_shaking_hands_2.glb');
useGLTF.preload('media/sandbox/anims/anim_female_sitting_pose_1.glb');
useGLTF.preload('media/sandbox/anims/anim_female_sitting_pose_3.glb');
useGLTF.preload('media/sandbox/anims/anim_hand_raising.glb');
useGLTF.preload('media/sandbox/anims/anim_woman-solo.glb');
useGLTF.preload('media/sandbox/anims/anim_belly_dance.glb');
useGLTF.preload('media/sandbox/anims/anim_dancing_twerk.glb');
useGLTF.preload('media/sandbox/anims/anim_stall_soccerball_1.glb');
useGLTF.preload('media/sandbox/anims/anim_body_jab_cross.glb');


CHARACTERS.forEach(char => {
  useGLTF.preload(char.path);
});
