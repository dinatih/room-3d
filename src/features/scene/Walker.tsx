/**
 * Walker.tsx — Personnage unique (Xbot Officiel / Lara Native).
 * Gère le chargement, les animations natives, le retargeting et le positionnement.
 */
import { useRef, useLayoutEffect, Suspense, useEffect } from 'react';
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
  const tracks: THREE.KeyframeTrack[] = [];

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

  const hipsRatio = 1.0;

  for (const tr of rawClip.tracks) {
    const [boneFull, prop] = tr.name.split('.');
    
    const match = boneFull.match(/mixamorig[:_]?(.+)/i);
    if (!match) continue;
    const baseName = match[1];

    let targetBoneName = '';
    
    if (isLara) {
      const keyName = `mixamorig:${baseName}`;
      targetBoneName = BONE_MAP[keyName] || getFingerLaraName(keyName);
      if (keyName === 'mixamorig:Hips') {
        targetBoneName = 'mixamorig_root_hips';
      }
    } else {
      targetBoneName = `mixamorig${baseName}`;
    }

    if (!targetBoneName) continue;

    // Skip scale tracks to avoid bone crushing
    if (prop === 'scale') continue;

    // Only translate hips
    const isHips = targetBoneName.toLowerCase().endsWith('hips');
    if (prop === 'position' && !isHips) continue;

    const clone = tr.clone();
    clone.name = `${targetBoneName}.${prop}`;

    // Retarget Hips translation
    if (prop === 'position' && isHips) {
      const bone = targetInstance.getObjectByName(targetBoneName) as any;
      if (bone && bone.defaultPosition) {
        let P_src = null;
        if (animBones[baseName]) {
          P_src = animBones[baseName].parentRestWorldQuaternion;
        } else {
          const srcBone = xbotInstance.getObjectByName('mixamorig' + baseName) as any;
          P_src = (srcBone && srcBone.parent && srcBone.parent.restWorldQuaternion)
            ? srcBone.parent.restWorldQuaternion
            : new THREE.Quaternion();
        }
        
        const P_tgt = (bone.parent && bone.parent.restWorldQuaternion)
          ? bone.parent.restWorldQuaternion
          : new THREE.Quaternion();
        const P_tgt_inv = P_tgt.clone().invert();
        
        let srcRestPos = null;
        if (animBones[baseName]) {
          srcRestPos = animBones[baseName].defaultPosition;
        } else {
          const srcBone = xbotInstance.getObjectByName('mixamorig' + baseName) as any;
          srcRestPos = srcBone && srcBone.defaultPosition ? srcBone.defaultPosition : new THREE.Vector3(0, 99.1, 0);
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
        const isWalk = animNameLower.includes('walk') || 
                       animNameLower.includes('run') || 
                       animNameLower.includes('step') || 
                       animNameLower.includes('stairs') || 
                       animNameLower.includes('layer0');

        if (isFlat && isWalk) {
          // Reconstruct with 30fps keyframes to inject procedural hips movement
          const duration = rawClip.duration;
          const fps = 30;
          const numFrames = Math.ceil(duration * fps) + 1;
          const newTimes = new Float32Array(numFrames);
          const newValues = new Float32Array(numFrames * 3);
          
          for (let f = 0; f < numFrames; f++) {
            const t = Math.min(f / fps, duration);
            newTimes[f] = t;
            
            const phase = (t / duration) * 2.0 * Math.PI;
            
            // Procedural height bobbing (Z in Blender's space)
            // and lateral sway (X in Blender's space)
            const dx = 0.8 * Math.cos(phase); // sway side-to-side (0.8 cm, X)
            const dy = 0.0; // forward progress cancelled (0.0 cm, Y)
            const dz = -1.6 * Math.sin(phase * 2.0); // bob up-and-down (1.6 cm, Z)
            
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
            // In Blender's space: X is sway, Y is forward progress, Z is vertical bobbing/height
            const dx = (clone.values[3*j] - srcRestPos.x) * hipsRatio;
            const dy = isWalk ? 0.0 : (clone.values[3*j+1] - srcRestPos.y) * hipsRatio;
            const dz = (clone.values[3*j+2] - srcRestPos.z) * hipsRatio;
            
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
          const srcBone = xbotInstance.getObjectByName('mixamorig' + baseName) as any;
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

            // Calculate animated world quaternion of source bone
            const animWorldQ = P_src.clone().multiply(srcLocalQ);

            // Compute delta from source's world rest pose
            const deltaQ = animWorldQ.clone().multiply(B_src_inv);

            // Apply delta to target's world rest pose
            const tgtAnimWorldQ = deltaQ.clone().multiply(B_tgt);

            // Convert back to target's local space
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

  return new THREE.AnimationClip(`${rawClip.name}_lara`, rawClip.duration, tracks);
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
  npcRotationY = 0
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
      if (isLara) {
        finalClip = retargetClip(clip, scene, xbotScene, undefined, isLara);
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

    if (customAnimName.current) {
      target = customAnimName.current;
      idleTimerRef.current = 0;
    }

    if (target === 'idle' && !isPaused) {
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

function InternalWalker(props: WalkerProps) {
  const isLaraActive = useSceneStore(state => state.extraStates['walker-lara']);
  const xbotGltf = useGLTF(XBOT_PATH);
  
  return (
    <>
      <SingleCharacter 
        {...props} 
        modelPath={XBOT_PATH} 
        isLara={false} 
        isActive={!isLaraActive}
        animations={xbotGltf.animations}
        xbotScene={xbotGltf.scene}
      />
      <SingleCharacter 
        {...props} 
        modelPath={LARA_PATH} 
        isLara={true} 
        isActive={isLaraActive}
        animations={xbotGltf.animations}
        xbotScene={xbotGltf.scene}
      />
      
      {/* 6 NPC Laras placed randomly around Studio and Garden */}
      <SingleCharacter {...props} modelPath={ROSANNA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="rosanna" isNPC={true} npcPosition={[220, 0, -20]} npcRotationY={-Math.PI / 4} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="marissa" isNPC={true} npcPosition={[180, 0, 160]} npcRotationY={Math.PI / 2} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="delphina" isNPC={true} npcPosition={[50, 0, 320]} npcRotationY={Math.PI} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="sara" isNPC={true} npcPosition={[120, 0, 480]} npcRotationY={0} />
      <SingleCharacter {...props} modelPath={LARA_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="standard" isNPC={true} npcPosition={[280, 0, 380]} npcRotationY={-Math.PI / 2} />
      <SingleCharacter {...props} modelPath={VIVID_PATH} isLara={true} isActive={false} animations={xbotGltf.animations} xbotScene={xbotGltf.scene} variant="vivid" isNPC={true} npcPosition={[150, 0, 50]} npcRotationY={Math.PI / 4} />
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
