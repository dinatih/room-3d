/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 */
import { useRef, useLayoutEffect, Suspense, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useHelper } from '@react-three/drei';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';

export const WALKER_ANIM_OPTIONS = [
  { value: "idle", label: "Idle / Return to Default" },
  { value: "media/glb-animations/catwalk_sequence_01.glb", label: "Catwalk Sequence 1" },
  { value: "media/glb-animations/catwalk_sequence_02.glb", label: "Catwalk Sequence 2" },
  { value: "media/glb-animations/catwalk_sequence_03.glb", label: "Catwalk Sequence 3" },
  { value: "media/glb-animations/catwalk_sequence_04.glb", label: "Catwalk Sequence 4" },
  { value: "media/glb-animations/catwalk_sequence_05.glb", label: "Catwalk Sequence 5" },
  { value: "media/sandbox/anim_happy_walk_not_in_place.glb", label: "Happy Walk" },
  { value: "media/sandbox/anim_sitting_idle.glb", label: "Sitting Idle" },
  { value: "media/sandbox/anim_sitting_angry.glb", label: "Sitting Angry" },
  { value: "media/sandbox/anim_t_pose.glb", label: "T-Pose de Test" },
  { value: "media/sandbox/anim_jump.glb", label: "Saut" },
  { value: "media/sandbox/anim_sleeping_idle.glb", label: "Dormir" },
  { value: "media/sandbox/anim_laying_idle.glb", label: "Laying Idle" },
  { value: "media/sandbox/anim_skinning_test.glb", label: "Skinning Test" },
  { value: "media/sandbox/anim_samba_dancing.glb", label: "Samba Dancing" },
  { value: "media/sandbox/anim_back_flip_to_uppercut.glb", label: "Back Flip to Uppercut" },
  { value: "media/sandbox/anim_idle.glb", label: "Idle" },
  { value: "media/sandbox/anim_walking.glb", label: "Walking" },
  { value: "media/sandbox/anim_right_turn_90.glb", label: "Right Turn 90" },
  { value: "media/sandbox/anim_left_turn_90.glb", label: "Left Turn 90" },
  { value: "media/sandbox/anim_gangnam_style.glb", label: "Gangnam Style" },
  { value: "media/sandbox/anim_drinking_fountain.glb", label: "Drinking Fountain" },
  { value: "media/sandbox/anim_martelo_do_chau_sem_mao.glb", label: "Martelo Do Chau Sem Mao" },
  { value: "media/sandbox/anim_female_dynamic_pose.glb", label: "Female Dynamic Pose" },
  { value: "media/sandbox/anim_push_up.glb", label: "Push Up" },
  { value: "media/sandbox/anim_laying_idle_1.glb", label: "Laying Idle 1" },
  { value: "media/sandbox/anim_swimming_to_edge.glb", label: "Swimming to Edge" },
  { value: "media/sandbox/anim_dancing_maraschino_step.glb", label: "Dancing Maraschino Step" },
  { value: "media/sandbox/anim_tender_placement.glb", label: "Tender Placement" },
  { value: "media/sandbox/anim_running.glb", label: "Running" },
  { value: "media/sandbox/anim_left_turn.glb", label: "Left Turn" },
  { value: "media/sandbox/anim_right_turn.glb", label: "Right Turn" },
  { value: "media/sandbox/anim_left_turn_2.glb", label: "Left Turn 2" },
  { value: "media/sandbox/anim_right_turn_2.glb", label: "Right Turn 2" },
  { value: "media/sandbox/anim_climbing.glb", label: "Climbing" },
  { value: "media/glb-animations/macarena_dance.glb", label: "Macarena Dance" },
  { value: "media/sandbox/anim_woman-solo.glb", label: "Woman Solo" }
].sort((a, b) => {
  if (a.value === "idle") return -1;
  if (b.value === "idle") return 1;
  return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
});


const LARA_PATH = 'media/lara_native.glb';
const ROSANNA_PATH = 'media/rosanna_lara_native.glb';
const VIVID_PATH = 'media/vivid_red_lara_native.glb';

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
  { id: 'native', name: 'Lara (Native)', path: 'media/lara_native.glb', pos: [251, 0, 178], rot: 1.325 + Math.PI / 2, variant: 'native', height: 173.4 },
  { id: 'rosanna', name: 'Rosanna', path: 'media/lara_native.glb', pos: [251, 75, 178], rot: 1.325 + Math.PI / 2, variant: 'rosanna', height: 173.4, sittingScenePath: 'media/sandbox/anim_push_up.glb', customIdleAnimPath: 'media/sandbox/anim_push_up.glb' },
  { id: 'marissa', name: 'Marissa', path: 'media/lara_native.glb', pos: [160, 0, -440], rot: 0, variant: 'marissa', height: 173.4, sittingScenePath: 'media/glb-animations/macarena_dance.glb', customIdleAnimPath: 'media/glb-animations/macarena_dance.glb' },
  { id: 'delphina', name: 'Delphina', path: 'media/lara_native.glb', pos: [120, 35, -250], rot: 1, variant: 'delphina', height: 173.4, sittingScenePath: 'media/sandbox/anim_swimming_to_edge.glb', customIdleAnimPath: 'media/sandbox/anim_swimming_to_edge.glb' },
  { id: 'sara', name: 'Sara', path: 'media/lara_native.glb', pos: [340, -40, -310], rot: -Math.PI / 2, variant: 'sara', height: 173.4, sittingScenePath: 'media/sandbox/anim_climbing.glb', customIdleAnimPath: 'media/sandbox/anim_climbing.glb' },
  { id: 'cha', name: 'Cha', path: 'media/lara_native.glb', pos: [30, 0, 151], rot: Math.PI / 2, variant: 'cha', height: 173.4, sittingScenePath: 'media/sandbox/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anim_sitting_idle.glb' },
  { id: 'vivid', name: 'Vivid', path: 'media/lara_native.glb', pos: [30, 0, 210], rot: Math.PI / 2, variant: 'vivid', height: 173.4, sittingScenePath: 'media/sandbox/anim_sitting_idle.glb', customIdleAnimPath: 'media/sandbox/anim_sitting_idle.glb' },
  { id: 'sabira', name: 'Sabira', path: 'media/lara_native.glb', pos: [200, 0, -20], rot: Math.PI, variant: 'sabira', height: 173.4 },
  { id: 'safa', name: 'Safa', path: 'media/lara_native.glb', pos: [250, 0, 320], rot: 0, variant: 'safa', height: 173.4 },
  { id: 'rajaa', name: 'Rajaa', path: 'media/lara_native.glb', pos: [80, 0, -320], rot: Math.PI / 4, variant: 'rajaa', height: 173.4 },
  { id: 'xbot', name: 'Xbot', path: 'media/sandbox/Xbot_official.glb', pos: [120, 0, 0], rot: 0, variant: 'native', height: 173.4, isLara: false }
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
            const dx = (clone.values[3*j] - srcRestPos.x) * computedHipsRatio;
            const dy = isWalk ? 0.0 : (yVal - srcRestPos.y) * computedHipsRatio;
            const dz = (clone.values[3*j+2] - srcRestPos.z) * computedHipsRatio;

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
  const { scene } = useGLTFClone(modelPath);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const idleTimerRef = useRef<number>(0);
  const customAnimName = useRef<string | null>(null);
  const prevFirstPersonRef = useRef<boolean | null>(null);

  const hairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);
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
        let isPistolMesh = false;
        for (const accName of ACCESSORIES_MESH_NAMES) {
          const accNameSpace = accName.replace(/_/g, ' ');
          if (nameLower.includes(accName) || nameLower.includes(accNameSpace)) {
            isAccessoryMesh = true;
            if ((accName === 'handgun_left' || accName === 'handgun_right' || accName === 'handgun_part') && !nameLower.includes('holster')) {
              isPistolMesh = true;
            }
            break;
          }
        }
        
        if (isAccessoryMesh) {
          if (isPistolMesh && !laraPistols) {
            mesh.visible = false;
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
            let isPistolMat = false;
            for (const accName of ACCESSORIES_MESH_NAMES) {
              const accNameSpace = accName.replace(/_/g, ' ');
              if (matNameLower.includes(accName) || matNameLower.includes(accNameSpace)) {
                isAccessoryMat = true;
                if ((accName === 'handgun_left' || accName === 'handgun_right' || accName === 'handgun_part') && !matNameLower.includes('holster')) {
                  isPistolMat = true;
                }
                break;
              }
            }
            
            if (isAccessoryMat) {
              if (isPistolMat && !laraPistols) {
                mat.visible = false;
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
        c.castShadow = isActive;
        c.receiveShadow = isActive;
        c.frustumCulled = true;
        if (c.geometry && !c.userData.boundsEnlarged) {
            c.geometry.computeBoundingSphere();
            if (c.geometry.boundingSphere) {
                c.geometry.boundingSphere.radius += 100;
            }
            c.userData.boundsEnlarged = true;
        }
        if (c.material) {
            const materials = Array.isArray(c.material) ? c.material : [c.material];
            materials.forEach((mat: any) => {
                mat.transparent = false;
                mat.depthWrite = true;
                mat.side = THREE.FrontSide;
            });
            delete c.raycast;
            c.userData.hoverAction = { label: name, actionId: 'walker-anim-lara' };
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
    const isScoopOrClone = false;

    if (isScoopOrClone) {
      const hairBones: THREE.Bone[] = [];
      scene.traverse(c => {
        if ((c as any).isBone && c.name.startsWith('hair_')) {
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
            const child = bone.children.find(x => (x as any).isBone && x.name.startsWith('hair_'));
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

  useEffect(() => {
    const onToggle = (e: any) => {
      const expectedKey = isLara ? 'walker-anim-lara' : 'walker-anim-xbot';
      if (e.detail.key === expectedKey) {
        const path = e.detail.value;
        if (!path || path === 'idle') {
          customAnimName.current = null;
          return;
        }

        const loader = new GLTFLoader();
        loader.load(path, (gltf: any) => {
          const clip = gltf.animations[0];
          if (clip) {
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
              actionsRef.current[path] = action;
            }

            // The user wants it to play exactly 2 times and return to idle
            action.setLoop(THREE.LoopRepeat, 2);
            action.clampWhenFinished = true;

            customAnimName.current = path;
            invalidate();
          }
        });
      }
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => document.removeEventListener('furniture-toggle', onToggle);
  }, [isActive, isLara, scene, invalidate, id]);

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
      idleTimerRef.current = 0;
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
        if (hairChainRef.current.length > 0) {
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
              
              const vel = new THREE.Vector3().subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - 0.30)); // damping = 0.30
              const next = new THREE.Vector3().copy(node.tipWorld).add(vel).addScaledVector(g, simDt * simDt);
              
              next.lerp(restTip, 0.25); // stiffness = 0.25
              
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
            const breastIntensity = 5.0;
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
  const idleGltf = useGLTF('media/sandbox/anim_idle.glb');
  const walkingGltf = useGLTF('media/sandbox/anim_walking.glb');
  const runningGltf = useGLTF('media/sandbox/anim_running.glb');

  // Preloaded anim paths
  const sittingGltf = useGLTF('media/sandbox/anim_sitting_idle.glb');
  const swimmingGltf = useGLTF('media/sandbox/anim_swimming_to_edge.glb');
  const marissaGltf = useGLTF('media/glb-animations/macarena_dance.glb');
  const pushUpGltf = useGLTF('media/sandbox/anim_push_up.glb');
  const laying1Gltf = useGLTF('media/sandbox/anim_laying_idle_1.glb');
  const climbingGltf = useGLTF('media/sandbox/anim_climbing.glb');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && /^(input|textarea|select)$/i.test(target.tagName)) return;

    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const animGltfs: Record<string, any> = useMemo(() => ({
    'media/sandbox/anim_sitting_idle.glb': sittingGltf,
    'media/sandbox/anim_swimming_to_edge.glb': swimmingGltf,
    'media/glb-animations/macarena_dance.glb': marissaGltf,
    'media/sandbox/anim_push_up.glb': pushUpGltf,
    'media/sandbox/anim_climbing.glb': climbingGltf,
    'media/sandbox/anim_laying_idle_1.glb': laying1Gltf,
  }), [sittingGltf, swimmingGltf, marissaGltf, pushUpGltf, climbingGltf, laying1Gltf]);

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

useGLTF.preload(LARA_PATH);
useGLTF.preload(ROSANNA_PATH);
useGLTF.preload(VIVID_PATH);
useGLTF.preload('media/sandbox/anim_sitting_idle.glb');
useGLTF.preload('media/sandbox/anim_swimming_to_edge.glb');
useGLTF.preload('media/glb-animations/macarena_dance.glb');
useGLTF.preload('media/sandbox/anim_climbing.glb');
useGLTF.preload('media/sandbox/anim_push_up.glb');
useGLTF.preload('media/sandbox/anim_laying_idle_1.glb');
useGLTF.preload('media/sandbox/anim_woman-solo.glb');


CHARACTERS.forEach(char => {
  useGLTF.preload(char.path);
});
