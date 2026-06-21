/**
 * Walker.tsx — Personnage unique (Xbot Officiel / Lara Native).
 * Gère le chargement, les animations natives, le retargeting et le positionnement.
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

const XBOT_PATH = 'media/sandbox/Xbot_official.glb';
const LARA_PATH = 'media/sandbox/lara_native.glb';
const ROSANNA_PATH = 'media/sandbox/rosanna_lara_native.glb';
const VIVID_PATH = 'media/sandbox/vivid_red_lara_native.glb';

const BONE_MAP: Record<string, string> = {
  "mixamorig:Hips": "mixamorig_root_hips",
  "mixamorig:Spine": "mixamorig_spine_lower",
  "mixamorig:Spine2": "mixamorig_spine_upper",
  "mixamorig:Neck": "mixamorig_head_neck_lower",
  "mixamorig:Head": "mixamorig_head_neck_upper",
  "mixamorig:LeftShoulder": "",
  "mixamorig:LeftArm": "mixamorig_arm_left_shoulder_2",
  "mixamorig:LeftForeArm": "mixamorig_arm_left_elbow",
  "mixamorig:LeftHand": "mixamorig_arm_left_wrist",
  "mixamorig:LeftUpLeg": "mixamorig_leg_left_thigh",
  "mixamorig:LeftLeg": "mixamorig_leg_left_knee",
  "mixamorig:LeftFoot": "mixamorig_leg_left_ankle",
  "mixamorig:LeftToeBase": "mixamorig_leg_left_toes",
  "mixamorig:RightShoulder": "",
  "mixamorig:RightArm": "mixamorig_arm_right_shoulder_2",
  "mixamorig:RightForeArm": "mixamorig_arm_right_elbow",
  "mixamorig:RightHand": "mixamorig_arm_right_wrist",
  "mixamorig:RightUpLeg": "mixamorig_leg_right_thigh",
  "mixamorig:RightLeg": "mixamorig_leg_right_knee",
  "mixamorig:RightFoot": "mixamorig_leg_right_ankle",
  "mixamorig:RightToeBase": "mixamorig_leg_right_toes"
};

function getFingerLaraName(mixName: string): string {
  const match = mixName.match(/mixamorig:(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)(\d)/i);
  if (match) {
    const side = match[1].toLowerCase();
    const type = match[2];
    const seg = match[3];

    const typeIdx: Record<string, number> = { "Thumb": 1, "Index": 2, "Middle": 3, "Ring": 4, "Pinky": 5 };
    const segLet: Record<string, string> = { "1": "a", "2": "b", "3": "c" };

    const fIdx = typeIdx[type];
    const sLet = segLet[seg];

    if (fIdx && sLet) {
      return `mixamorig_arm_${side}_finger_${fIdx}${sLet}`;
    }
  }
  return "";
}

function retargetClip(rawClip: THREE.AnimationClip, targetInstance: THREE.Object3D, xbotInstance: THREE.Object3D, animScene: THREE.Object3D | undefined, isLara: boolean): THREE.AnimationClip {
  const animBones: Record<string, any> = {};
  if (animScene) {
    animScene.updateMatrixWorld(true);
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
        const bone = targetInstance.getObjectByName(
          isLara ? 'mixamorig_root_hips' :
          targetInstance.name.toLowerCase().includes('ybot') ? 'mixamorig_Hips' : 'mixamorigHips'
        ) as any;
        let refSrcY = 0.991;
        if (animBones[baseName]) {
          refSrcY = animBones[baseName].defaultPosition.y;
        } else {
          const srcBone = xbotInstance.getObjectByName('mixamorig:Hips') as any;
          if (srcBone && srcBone.defaultPosition) {
            refSrcY = srcBone.defaultPosition.y;
          }
        }
        if (refSrcY > 5.0) {
          refSrcY *= 0.01;
        }
        srcHipsDefaultY = refSrcY;

        let targetHipsHeight = 99.1;
        if (bone && bone.defaultPosition) {
          targetHipsHeight = isLara ? bone.defaultPosition.z : bone.defaultPosition.y;
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

    let targetBoneName = '';
    if (isLara) {
      const keyName = `mixamorig:${baseName}`;
      targetBoneName = BONE_MAP[keyName] || getFingerLaraName(keyName);
      if (keyName === 'mixamorig:Hips') {
        targetBoneName = 'mixamorig_root_hips';
      }
    } else {
      const targetHasUnderscore = targetInstance.getObjectByName(`mixamorig_${baseName}`) !== undefined;
      targetBoneName = targetHasUnderscore ? `mixamorig_${baseName}` : `mixamorig${baseName}`;
    }

    if (!targetBoneName) continue;

    if (prop === 'scale') continue;
    const isHips = targetBoneName.toLowerCase().endsWith('hips');
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
          const srcBone = xbotInstance.getObjectByName('mixamorig:' + baseName) as any;
          P_src = (srcBone && srcBone.parent && srcBone.parent.restWorldQuaternion)
            ? srcBone.parent.restWorldQuaternion
            : new THREE.Quaternion();
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
          const srcBone = xbotInstance.getObjectByName('mixamorig:' + baseName) as any;
          srcRestPos = srcBone && srcBone.defaultPosition ? srcBone.defaultPosition.clone() : new THREE.Vector3(0, srcHipsDefaultY * 100, 0);
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
      if (bone && bone.restLocalQuaternion && bone.restWorldQuaternion) {
        let B_src = null;
        let P_src = null;
        if (animBones[baseName]) {
          B_src = animBones[baseName].restWorldQuaternion;
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          const srcBone = xbotInstance.getObjectByName('mixamorig:' + baseName) as any;
          B_src = srcBone ? srcBone.restWorldQuaternion : null;
          P_src = (srcBone && srcBone.parent && srcBone.parent.restWorldQuaternion)
            ? srcBone.parent.restWorldQuaternion
            : new THREE.Quaternion();
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

    tracks.push(clone);
  }

  return new THREE.AnimationClip(`${workingClip.name}_retargeted`, workingClip.duration, tracks);
}

interface WalkerProps {
  showSkeleton?: boolean;
  isPreview?: boolean;
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
  modelPath: string;
  isLara: boolean;
  isActive: boolean;
  animations: THREE.AnimationClip[];
  xbotScene: THREE.Group;
  variant?: LaraVariant;
  isNPC?: boolean;
  npcPosition?: [number, number, number];
  npcRotationY?: number;
  sittingScene?: THREE.Group;
}

function SingleCharacter({
  modelPath,
  isLara,
  isActive,
  showSkeleton = false,
  isPreview = false,
  walkerAnim = 'idle',
  isPaused = false,
  animations,
  xbotScene,
  variant,
  isNPC = false,
  npcPosition = [0, 0, 0],
  npcRotationY = 0,
  sittingScene
}: SingleCharacterProps) {
  const { scene } = useGLTFClone(modelPath);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const idleTimerRef = useRef<number>(0);
  const customAnimName = useRef<string | null>(null);

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
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const rawSize = box.getSize(new THREE.Vector3());

    const targetHeight = isLara ? 173.4 : 181.0;
    const fallbackScale = 100.0;
    const scaleFactor = rawSize.y > 0 ? (targetHeight / rawSize.y) : fallbackScale;

    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.updateMatrixWorld(true);
    const hipsName = isLara ? 'mixamorig_root_hips' : 'mixamorig:Hips';
    const hips = scene.getObjectByName(hipsName);
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
        c.castShadow = c.receiveShadow = true;
        c.frustumCulled = false;
        if (c.material) {
            const materials = Array.isArray(c.material) ? c.material : [c.material];
            materials.forEach((mat: any) => {
                mat.transparent = false;
                mat.depthWrite = true;
                mat.side = THREE.FrontSide;
            });
            delete c.raycast;
            const labelStr = variant ? variant.charAt(0).toUpperCase() + variant.slice(1) : (isLara ? 'Lara' : 'X-Bot');
            c.userData.hoverAction = { label: labelStr, actionId: isLara ? 'walker-anim-lara' : 'walker-anim-xbot' };
        }
      }
      c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
      if (c.isBone) {
        c.defaultPosition = c.position.clone();
        c.restLocalQuaternion = c.quaternion.clone();
        c.userData.restPos = c.position.clone();
        c.userData.restQuat = c.quaternion.clone();
      }
    });

    if (variant) {
        applyLaraVariantStyles(scene, variant);
    }

    // Populate source rest poses on X-Bot template
    xbotScene.updateMatrixWorld(true);
    xbotScene.traverse(o => {
      const c = o as any;
      if (!c.restWorldQuaternion) {
        c.restWorldQuaternion = c.getWorldQuaternion(new THREE.Quaternion());
      }
      if (c.isBone && !c.restLocalQuaternion) {
        c.defaultPosition = c.position.clone();
        c.restLocalQuaternion = c.quaternion.clone();
      }
    });

    const mixer = new THREE.AnimationMixer(scene);
    mixerRef.current = mixer;

    mixer.addEventListener('finished', (e) => {
      if (customAnimName.current && actionsRef.current[customAnimName.current] === e.action) {
        customAnimName.current = null;
      }
    });

    actionsRef.current = {};

    animations.forEach(clip => {
      let finalClip = clip;
      const isExternal = clip.name.endsWith('.glb');
      if (isLara) {
        finalClip = retargetClip(clip, scene, xbotScene, isExternal ? sittingScene : undefined, true);
      } else if (isExternal) {
        finalClip = retargetClip(clip, scene, xbotScene, sittingScene, false);
      } else {
        const cleanTracks = clip.tracks.filter(track => !track.name.endsWith('.scale'));
        finalClip = new THREE.AnimationClip(clip.name, clip.duration, cleanTracks);
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
  }, [scene, animations, isLara, xbotScene]);

  const skeletonRef = useHelper(showSkeleton ? modelRef : null, THREE.SkeletonHelper);

  useEffect(() => {
    if (skeletonRef.current) {
        const helper = skeletonRef.current as THREE.SkeletonHelper;
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
            let finalClip = clip;
            finalClip = retargetClip(clip, scene, xbotScene, gltf.scene, isLara);
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
  }, [isActive, isLara, scene, xbotScene]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    if (!groupRef.current || !mixerRef.current) return;

    if (isPreview) {
      groupRef.current.position.set(0, 0, 0);
      groupRef.current.rotation.y = 0;
      groupRef.current.visible = true;
    } else {
      if (isActive) {
        groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
        groupRef.current.rotation.y = cameraState.walkYaw;
        groupRef.current.visible = !cameraState.walkerHidden;
      } else if (isNPC) {
        groupRef.current.position.set(npcPosition[0], npcPosition[1], npcPosition[2]);
        groupRef.current.rotation.y = npcRotationY;
        groupRef.current.visible = true;
      } else {
        // Inactive character stays at its last 'other' position
        groupRef.current.position.set(cameraState.otherX, 0, cameraState.otherZ);
        groupRef.current.rotation.y = cameraState.otherYaw;
        groupRef.current.visible = true;
      }

      const isFirstPerson = isActive && cameraState.mode === 'walk';
      scene.traverse(o => {
        if ((o as THREE.Mesh).isMesh) {
          o.layers.set(isFirstPerson ? LAYER_WALKER_DETAIL : LAYER_WALKER);
        }
      });
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    // Inactive model is always stationary
    let isMoving = isActive ? cameraState.isMoving : false;
    let target = isPreview ? (walkerAnim || 'idle') : (isMoving ? 'walk' : 'idle');

    if (isNPC && (variant === 'cha' || variant === 'vivid') && target === 'idle') {
      target = 'media/sandbox/anim_sitting_idle.glb';
    }
    if (isNPC && variant === 'delphina' && target === 'idle') {
      target = 'media/sandbox/anim_swimming_to_edge.glb';
    }
    if (isNPC && variant === 'marissa' && target === 'idle') {
      target = 'media/sandbox/anim_gangnam_style.glb';
    }
    if (isNPC && variant === 'rosanna' && target === 'idle') {
      target = 'media/sandbox/anim_push_up.glb';
    }
    if (isNPC && variant === 'sara' && target === 'idle') {
      target = 'media/sandbox/anim_climbing.glb';
    }
    if (!isActive && !isNPC && !isLara && target === 'idle') {
      target = 'media/sandbox/anim_laying_idle_1.glb';
    }

    if (customAnimName.current) {
      target = customAnimName.current;
      idleTimerRef.current = 0;
    }

    if (!isPaused && !isMoving && !isPreview) {
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

const ALL_LARA_NPC_DEFS = [
  { path: 'media/all_lara/lara_croft_324_rigged.glb', pos: [120, 0, 250], rot: 0.5 },
  { path: 'media/all_lara/lara_croft_43254_rigged.glb', pos: [220, 0, 180], rot: 2.1 },
  { path: 'media/all_lara/lara_croft_4543.glb', pos: [80, 0, 310], rot: -1.2 },
  { path: 'media/all_lara/lara_croft_motorcycle_gear.glb', pos: [150, 0, -50], rot: 0 },
  { path: 'media/all_lara/lara_croft_spy_gear.glb', pos: [60, 0, 110], rot: 1.5 },
  { path: 'media/all_lara/lara_croft_suit.glb', pos: [240, 0, 50], rot: -0.5 },
  { path: 'media/all_lara/lara_croft_brown_jacket.glb', pos: [190, 0, 290], rot: 0.8 },
  { path: 'media/all_lara/lara_croft_swim_gear.glb', pos: [110, 0, -150], rot: -2.3 },
  { path: 'media/all_lara/lara_croft_swim_gear_1.glb', pos: [260, 0, -220], rot: 1.1 },
  { path: 'media/all_lara/lara_croft_dress_345.glb', pos: [40, 0, -180], rot: 3.0 },
  { path: 'media/all_lara/lara_croft_red_dress.glb', pos: [170, 0, 120], rot: -0.2 },
  { path: 'media/all_lara/lara_croft_swim_gear_243.glb', pos: [130, 0, -280], rot: 0.9 },
  { path: 'media/all_lara/lara_croft_black_tank_top.glb', pos: [280, 0, 210], rot: -1.8 },
  { path: 'media/all_lara/lara_croft_4259.glb', pos: [50, 0, 40], rot: 0.4 },
  { path: 'media/all_lara/lara_croft_3254_rigged.glb', pos: [210, 0, -80], rot: 2.7 },
  { path: 'media/all_lara/lara_croft_gold_shades.glb', pos: [90, 0, 190], rot: -0.9 },
  { path: 'media/all_lara/lara_original_88_bones.glb', pos: [230, 0, 340], rot: 0.1 },
  { path: 'media/all_lara/lara_croft_zip.glb', pos: [140, 0, 30], rot: 1.9 },
  { path: 'media/all_lara/lara_croft_543i.glb', pos: [70, 0, -110], rot: -2.5 },
  { path: 'media/all_lara/xbot_studio.glb', pos: [180, 0, -200], rot: 1.4 }
];

function InternalWalker(props: WalkerProps) {
  const isLaraActive = useSceneStore(state => state.extraStates['walker-lara']);
  const showAllLaraNPCs = useSceneStore(state => state.extraStates['walker-all-lara']);
  const xbotGltf = useGLTF(XBOT_PATH);
  const sittingGltf = useGLTF('media/sandbox/anim_sitting_idle.glb');
  const swimmingGltf = useGLTF('media/sandbox/anim_swimming_to_edge.glb');
  const marissaGltf = useGLTF('media/sandbox/anim_gangnam_style.glb');
  const pushUpGltf = useGLTF('media/sandbox/anim_push_up.glb');
  const laying1Gltf = useGLTF('media/sandbox/anim_laying_idle_1.glb');
  const climbingGltf = useGLTF('media/sandbox/anim_climbing.glb');

  const chaAnims = useMemo(() => {
    if (!sittingGltf.animations[0]) return xbotGltf.animations;
    const sittingClip = sittingGltf.animations[0].clone();
    sittingClip.name = 'media/sandbox/anim_sitting_idle.glb';
    return [...xbotGltf.animations, sittingClip];
  }, [xbotGltf.animations, sittingGltf.animations]);

  const delphinaAnims = useMemo(() => {
    if (!swimmingGltf.animations[0]) return xbotGltf.animations;
    const swimmingClip = swimmingGltf.animations[0].clone();
    swimmingClip.name = 'media/sandbox/anim_swimming_to_edge.glb';
    return [...xbotGltf.animations, swimmingClip];
  }, [xbotGltf.animations, swimmingGltf.animations]);

  const marissaAnims = useMemo(() => {
    if (!marissaGltf.animations[0]) return xbotGltf.animations;
    const clip = marissaGltf.animations[0].clone();
    clip.name = 'media/sandbox/anim_gangnam_style.glb';
    return [...xbotGltf.animations, clip];
  }, [xbotGltf.animations, marissaGltf.animations]);

  const rosannaAnims = useMemo(() => {
    if (!pushUpGltf.animations[0]) return xbotGltf.animations;
    const clip = pushUpGltf.animations[0].clone();
    clip.name = 'media/sandbox/anim_push_up.glb';
    return [...xbotGltf.animations, clip];
  }, [xbotGltf.animations, pushUpGltf.animations]);

  const saraAnims = useMemo(() => {
    if (!climbingGltf.animations[0]) return xbotGltf.animations;
    const clip = climbingGltf.animations[0].clone();
    clip.name = 'media/sandbox/anim_climbing.glb';
    return [...xbotGltf.animations, clip];
  }, [xbotGltf.animations, climbingGltf.animations]);

  const xbotAnims = useMemo(() => {
    if (!laying1Gltf.animations[0]) return xbotGltf.animations;
    const clip = laying1Gltf.animations[0].clone();
    clip.name = 'media/sandbox/anim_laying_idle_1.glb';
    return [...xbotGltf.animations, clip];
  }, [xbotGltf.animations, laying1Gltf.animations]);

  return (
    <>
      <SingleCharacter
        {...props}
        modelPath={XBOT_PATH}
        isLara={false}
        isActive={!isLaraActive}
        animations={xbotAnims}
        xbotScene={xbotGltf.scene}
        sittingScene={laying1Gltf.scene}
      />
      <SingleCharacter
        {...props}
        modelPath={LARA_PATH}
        isLara={true}
        isActive={isLaraActive}
        animations={xbotGltf.animations}
        xbotScene={xbotGltf.scene}
      />

      {/* 9 NPC Laras placed randomly around Studio and Garden */}
      <SingleCharacter {...props} modelPath={ROSANNA_PATH} isLara={true} isActive={false} animations={rosannaAnims} xbotScene={xbotGltf.scene} variant="rosanna" isNPC={true} npcPosition={[251, 75, 178]} npcRotationY={1.325 + Math.PI / 2} sittingScene={pushUpGltf.scene} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={marissaAnims} xbotScene={xbotGltf.scene} variant="marissa" isNPC={true} npcPosition={[160, 0, -440]} npcRotationY={0} sittingScene={marissaGltf.scene} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={delphinaAnims} xbotScene={xbotGltf.scene} variant="delphina" isNPC={true} npcPosition={[120, 35, -250]} npcRotationY={1} sittingScene={swimmingGltf.scene} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={saraAnims} xbotScene={xbotGltf.scene} variant="sara" isNPC={true} npcPosition={[340, -40, -310]} npcRotationY={-Math.PI / 2} sittingScene={climbingGltf.scene} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={chaAnims} xbotScene={xbotGltf.scene} variant="cha" isNPC={true} npcPosition={[30, 0, 151]} npcRotationY={Math.PI / 2} sittingScene={sittingGltf.scene} />
      <SingleCharacter {...props} modelPath={VIVID_PATH} isLara={true} isActive={false} animations={chaAnims} xbotScene={xbotGltf.scene} variant="vivid" isNPC={true} npcPosition={[30, 0, 210]} npcRotationY={Math.PI / 2} sittingScene={sittingGltf.scene} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="sabira" isNPC={true} npcPosition={[200, 0, -20]} npcRotationY={Math.PI} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="safa" isNPC={true} npcPosition={[250, 0, 320]} npcRotationY={0} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="rajaa" isNPC={true} npcPosition={[80, 0, -320]} npcRotationY={Math.PI / 4} />

      {showAllLaraNPCs && ALL_LARA_NPC_DEFS.map((npc, idx) => (
        <SingleCharacter
          {...props}
          key={`all-lara-npc-${idx}`}
          modelPath={npc.path}
          isLara={true}
          isActive={false}
          animations={xbotGltf.animations}
          xbotScene={xbotGltf.scene}
          isNPC={true}
          npcPosition={npc.pos as [number, number, number]}
          npcRotationY={npc.rot}
        />
      ))}
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

useGLTF.preload(XBOT_PATH);
useGLTF.preload(LARA_PATH);
useGLTF.preload(ROSANNA_PATH);
useGLTF.preload(VIVID_PATH);
useGLTF.preload('media/sandbox/anim_sitting_idle.glb');
useGLTF.preload('media/sandbox/anim_swimming_to_edge.glb');
useGLTF.preload('media/sandbox/anim_gangnam_style.glb');
useGLTF.preload('media/sandbox/anim_climbing.glb');
useGLTF.preload('media/sandbox/anim_push_up.glb');
useGLTF.preload('media/sandbox/anim_laying_idle_1.glb');
