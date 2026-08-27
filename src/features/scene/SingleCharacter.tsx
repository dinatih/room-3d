/**
 * SingleCharacter.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting, l'indexation structurée et le positionnement dynamique.
 */
import { useRef, useLayoutEffect, useEffect, useMemo, useState, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { Famnig27470460 } from './items/Famnig27470460';
import { Wig } from './items/Wig';
import { RiggedWig, HAIR_COLORS } from './items/RiggedWig';
import { isRiggedWig } from '@features/inventory/inventoryData';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, disposeLaraVariantMaterials, type LaraVariant } from './LaraVariants';
import { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES, isCharacterVisibleInMode } from './walkerConfig';
export { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES, isCharacterVisibleInMode };
import { buildHairChain, retargetClip, _retargetCache } from './retargeting';
import {
  extractCharacterParts,
  applyClothingAndAccessoriesVisibility,
  applyRenderProperties,
  isHeadMesh
} from './characterParts';
export { isHeadMesh };
import {
  ACTION_FULL_TOUR,
  buildAutonomousScenario
} from './ai/scenarios';
import type { AgentInstruction } from './ai/aiTypes';

import { useAgentController } from './ai/useAgentController';
import { appLog } from '@features/ui/AppConsole';
import { APP_IDLE_TIMEOUT_SECONDS, isAppIdle } from './idleState';
import { AUTONOMOUS_NPC_IDS } from './walkerConfig';

import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };

const EMPTY_SCENARIO: AgentInstruction[] = [];

/** Met à jour les layers Three.js de l'ensemble du personnage (corps vs tête/visage pour FPV vs miroir) */
export function updateCharacterLayers(root: THREE.Object3D, isFirstPerson: boolean) {
  root.traverse(o => {
    if ((o as THREE.Mesh).isMesh) {
      if (isFirstPerson && isHeadMesh(o)) {
        o.layers.set(LAYER_WALKER_DETAIL);
      } else {
        o.layers.set(LAYER_WALKER);
      }
    }
  });
}

// Static temp vectors for zero-allocation per-frame physics & transforms
const _tmpV1 = new THREE.Vector3();
const _tmpV2 = new THREE.Vector3();
const _tmpV3 = new THREE.Vector3();
const _tmpV4 = new THREE.Vector3();
const _tmpG  = new THREE.Vector3(0, -981, 0);
const _downWorld = new THREE.Vector3(0, -1, 0);
const _upDir = new THREE.Vector3(0, 1, 0);
const _rightDir = new THREE.Vector3(1, 0, 0);
const _backDir = new THREE.Vector3(0, 0, -1);
const _eulerBreast = new THREE.Euler(0, 0, 0, 'ZXY');
const _animBreastQ = new THREE.Quaternion();

// Dedicated static vectors & quaternions for hair physics
const _baseParentQuat = new THREE.Quaternion();
const _boneRestWorldQuat = new THREE.Quaternion();
const _swingQuat = new THREE.Quaternion();
const _parentWQuat = new THREE.Quaternion();
const _jointWorld = new THREE.Vector3();
const _restDirWorld = new THREE.Vector3();
const _restDir = new THREE.Vector3();
const _restTip = new THREE.Vector3();
const _hairVel = new THREE.Vector3();
const _hairNext = new THREE.Vector3();
const _hairDir = new THREE.Vector3();
const _hairFinalDir = new THREE.Vector3();
const _hairCurrentDirWorld = new THREE.Vector3();
const _colliderCenter = new THREE.Vector3();
const _colliderOffset = new THREE.Vector3();
const _rotAxis = new THREE.Vector3();
const _clampedSwingQuat = new THREE.Quaternion();
const _headW = new THREE.Vector3();
const _hipsW = new THREE.Vector3();
const _lShoulderW = new THREE.Vector3();
const _rShoulderW = new THREE.Vector3();

const silentManager = new THREE.LoadingManager();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
const MAX_DYNAMIC_GLTF_CACHE = 12;
const MAX_RETARGETED_CLIPS = 48;
const globalGLTFCache = new Map<string, Promise<any>>();

function cacheDynamicGLTF(path: string): Promise<any> {
  const cached = globalGLTFCache.get(path);
  if (cached) {
    globalGLTFCache.delete(path);
    globalGLTFCache.set(path, cached);
    return cached;
  }
  const pending = new Promise((resolve, reject) => {
    const loader = new GLTFLoader(silentManager);
    loader.setDRACOLoader(dracoLoader);
    loader.load(path, resolve, undefined, reject);
  });
  globalGLTFCache.set(path, pending);
  while (globalGLTFCache.size > MAX_DYNAMIC_GLTF_CACHE) {
    globalGLTFCache.delete(globalGLTFCache.keys().next().value!);
  }
  return pending;
}

function cacheRetargetedClip(key: string, clip: THREE.AnimationClip) {
  if (!_retargetCache[key] && Object.keys(_retargetCache).length >= MAX_RETARGETED_CLIPS) {
    delete _retargetCache[Object.keys(_retargetCache)[0]];
  }
  _retargetCache[key] = clip;
}

export interface WalkerProps {
  isPreview?: boolean;
  previewCharacterId?: string;
  previewHaircut?: string;
  previewHairColor?: string;
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

export interface SingleCharacterProps extends WalkerProps {
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

function HeartParachute({ customAnimName }: { customAnimName: React.MutableRefObject<string | null> }) {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.visible = customAnimName.current === 'animations/locomotion/anim_falling.glb';
    }
  });

  return (
    <group ref={groupRef} name="Parachute Coeur" userData={{ itemName: 'Parachute Coeur' }} position={[0, 270, 0]} visible={false}>
      <mesh position={[0, -60, 0]} userData={{ itemName: 'Parachute Coeur' }}>
        <cylinderGeometry args={[0.5, 0.5, 120, 8]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]} userData={{ itemName: 'Parachute Coeur' }}>
        <Famnig27470460 item={{} as any} actionState={{} as any} onSize={() => {}} />
      </group>
    </group>
  );
}

export function SingleCharacter({
  id,
  name,
  modelPath,
  isLara,
  targetHeight,
  isActive,
  isPreview = false,
  characterIndex = 0,
  walkerAnim = 'idle',
  isPaused = false,
  previewHaircut,
  previewHairColor,
  animations,

  variant,
  isNPC = false,
  npcPosition = [0, 0, 0],
  npcRotationY = 0,
  sittingScene,
  customIdleAnimPath
}: SingleCharacterProps) {
  const [localHaircut, setLocalHaircut] = useState<string>('original');
  const haircut = isPreview && previewHaircut ? previewHaircut : localHaircut;

  const [localHairColor, setLocalHairColor] = useState<string | undefined>(undefined);
  const hairColor = isPreview ? previewHairColor : localHairColor;

  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const laraCount = useSceneStore(state => state.layers.laraCount ?? (typeof window !== 'undefined' && window.innerWidth <= 768 ? 2 : 15));
  const showWallhack = useSceneStore(state => state.layers.wallhack);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const laraNude = useSceneStore(state => state.layers.laraNude ?? false);
  const laraTopOff = useSceneStore(state => state.layers.laraTopOff ?? false);
  const laraBottomOff = useSceneStore(state => state.layers.laraBottomOff ?? false);
  const laraShoes = useSceneStore(state => state.layers.laraShoes ?? true);
  const characterShadows = useSceneStore(state => state.layers.characterShadows ?? true);
  const characterWireframe = useSceneStore(state => state.layers.characterWireframe ?? false);
  const { scene } = useGLTFClone(modelPath);
  const charLabel = name || (isNPC ? `PNJ (${id})` : `Personnage (${id})`);

  useLayoutEffect(() => {
    if (!scene) return;
    scene.name = charLabel;
    scene.userData = { ...scene.userData, name: charLabel, itemName: charLabel };
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.userData = { ...child.userData, itemName: charLabel };
      }
    });
  }, [scene, charLabel]);

  useEffect(() => () => disposeLaraVariantMaterials(scene), [scene]);

  // Extraction structurée des maillages et des os
  const parts = useMemo(() => extractCharacterParts(scene), [scene]);

  const groupRef = useRef<THREE.Group>(null!);
  const modelRef = useRef<THREE.Object3D>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const activeActionName = useRef<string>('');
  const customAnimName = useRef<string | null>(null);
  const userAnimOverrideRef = useRef<boolean>(false);
  const prevFirstPersonRef = useRef<boolean | null>(null);
  const hasLoggedIdleRef = useRef<boolean>(false);

  const [equipment, setEquipment] = useState<{ holster: boolean; pistols: boolean; backpack: boolean }>({
    holster: true,
    pistols: true,
    backpack: true,
  });

  useEffect(() => {
    if (variant === 'lgbta') {
      const interval = setInterval(() => {
        const index = Math.floor(Math.random() * 13);
        if (index >= 0 && index <= 12) {
          setLocalHaircut('hair_' + (100 + index));
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [variant]);

  const cameraMode = useSceneStore(state => state.cameraMode);

  useEffect(() => {
    if (groupRef.current) {
      const isFirstPerson = isActive && (cameraMode === 'fpv' || cameraState.mode === 'fpv');
      updateCharacterLayers(groupRef.current, isFirstPerson);
      prevFirstPersonRef.current = isFirstPerson;
    }
  }, [cameraMode, isActive]);

  const hairChainRef = useRef<any[]>([]);
  const customHairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);
  const breastImpulseRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const breastVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const prevSpinePosRef = useRef<THREE.Vector3 | null>(null);
  const prevSpineVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const torsoAccelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  const [headBoneState, setHeadBoneState] = useState<THREE.Bone | null>(null);

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
    return null;
  }, [extraStates]);

  const activeActionScenario = useMemo(() => {
    if (activeActionKey === 'aiFullTour') return ACTION_FULL_TOUR;
    return null;
  }, [activeActionKey]);

  // Le personnage est autonome s'il fait partie des PNJ autonomes
  const isAutonomous = !isPreview && AUTONOMOUS_NPC_IDS.has(id);
  const isGuidedTour = !isPreview && Boolean(activeActionKey && id === activeWalkerId);

  const autonomousScenario = useMemo(() => {
    if (!isAutonomous) return null;
    return buildAutonomousScenario(id);
  }, [isAutonomous, id]);

  const finalScenario = isGuidedTour ? activeActionScenario : (isAutonomous ? autonomousScenario : EMPTY_SCENARIO);
  const loopScenario = isAutonomous;

  const isExcepted = id === 'sandra' || id === 'rajaa' || id === 'xbot';
  const hasSkyDrop = isNPC && !isExcepted && isAutonomous;
  const spawnDelay = hasSkyDrop ? ((characterIndex ?? 0) * 1.0) : 0;

  const { update: updateAgent, setPosition: setAgentPosition, setRotation: setAgentRotation } = useAgentController(
    id,
    finalScenario,
    loopScenario,
    () => {
      if (groupRef.current) {
        const { x, y, z } = groupRef.current.position;
        if (x !== 0 || z !== 0) {
          return {
            x,
            y,
            z,
            rotY: groupRef.current.rotation.y
          };
        }
      }
      return {
        x: npcPosition[0],
        y: npcPosition[1] || 0,
        z: npcPosition[2],
        rotY: npcRotationY
      };
    },
    () => {
      if (activeActionKey) {
        useSceneStore.setState(s => ({
          extraStates: { ...s.extraStates, [activeActionKey]: false }
        }));
      }
    },
    spawnDelay,
    hasSkyDrop
  );

  useLayoutEffect(() => {
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);
    scene.rotation.set(0, 0, 0);
    scene.updateMatrixWorld(true);

    const baseHeight = isLara ? 173.4 : 181.0;
    const scaleFactor = (targetHeight / baseHeight) * 100.0;
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    scene.updateMatrixWorld(true);

    // Sync bone references
    hipsBoneRef.current = parts.bones.hips;
    spine2BoneRef.current = parts.bones.spine2;
    spineBoneRef.current = parts.bones.spine;
    headBoneRef.current = parts.bones.head;
    lShoulderRef.current = parts.bones.lShoulder;
    rShoulderRef.current = parts.bones.rShoulder;

    if (parts.bones.hips) {
      const parent = scene.parent || scene;
      const hipsWorld = new THREE.Vector3();
      parts.bones.hips.getWorldPosition(hipsWorld);
      const hipsLocal = parent.worldToLocal(hipsWorld);
      scene.position.x -= hipsLocal.x;
      scene.position.z -= hipsLocal.z;
    }

    if (variant) {
      applyLaraVariantStyles(scene, variant);
    }

    // Build Verlet chains AFTER scale and transform have been updated
    hairChainRef.current = buildHairChain(parts.bones.nativeHairBones);

    const breastChain: any[] = [];
    for (const bone of parts.bones.breastBones) {
      let axis = new THREE.Vector3(0, 1, 0);
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
        userAnimOverrideRef.current = false;
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
        cacheRetargetedClip(cacheKey, finalClip);
      }

      const action = mixer.clipAction(finalClip);
      actionsRef.current[clip.name] = action;
      action.enabled = true;
      action.play();
      action.setEffectiveWeight(0);
    });

    applyClothingAndAccessoriesVisibility(parts, {
      laraNude,
      laraTopOff,
      laraBottomOff,
      laraShoes,
      showAccessories,
      laraPistols,
      equipment
    });
    applyRenderProperties(parts, {
      characterShadows,
      showWallhack,
      characterWireframe
    });

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
    };
  }, [scene, parts, animations, name, isLara, targetHeight, variant, sittingScene, id, laraNude, laraTopOff, laraBottomOff, laraShoes, showAccessories, laraPistols, equipment, characterShadows, showWallhack, characterWireframe]);

  // Visibilité des vêtements et des accessoires (ciblée, zéro traversée)
  useEffect(() => {
    if (!scene) return;
    applyClothingAndAccessoriesVisibility(parts, {
      laraNude,
      laraTopOff,
      laraBottomOff,
      laraShoes,
      showAccessories,
      laraPistols,
      equipment
    });
    invalidate();
  }, [parts, scene, equipment, laraNude, laraTopOff, laraBottomOff, laraShoes, showAccessories, laraPistols, invalidate]);

  // Propriétés de rendu : ombres, wallhack, fil de fer
  useEffect(() => {
    if (!scene) return;
    applyRenderProperties(parts, {
      characterShadows,
      showWallhack,
      characterWireframe
    });
    invalidate();
  }, [parts, scene, characterShadows, showWallhack, characterWireframe, invalidate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('walker-ready', { detail: { id } }));
    }, 0);
    return () => clearTimeout(timeout);
  }, [id]);

  const loadAndPlayClip = useCallback((path: string, loop = true, isUserOverride = false) => {
    if (!scene || !mixerRef.current) return;
    const isTPose = path === 'tpose' || path === 'animations/poses_idles/anim_t_pose.glb';
    if (isTPose) {
      customAnimName.current = 'tpose';
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
      return;
    }

    if (path === 'idle') {
      customAnimName.current = null;
      userAnimOverrideRef.current = false;
      invalidate();
      return;
    }

    const handleClip = (clip: THREE.AnimationClip, sourceScene: THREE.Object3D | undefined) => {
      if (!clip) return;
      const mixer = mixerRef.current;
      if (!mixer) return;

      clip.name = path;
      const cacheKey = id + '_' + path;
      let finalClip = _retargetCache[cacheKey];
      if (!finalClip) {
        if (sourceScene) sourceScene.updateMatrixWorld(true);
        finalClip = retargetClip(clip, scene, sourceScene);
        cacheRetargetedClip(cacheKey, finalClip);
      }
      finalClip.name = path;

      let action = actionsRef.current[path];
      if (!action) {
        action = mixer.clipAction(finalClip);
        action.enabled = true;
        actionsRef.current[path] = action;
      }

      const isSandraOrRajaa = id === 'sandra' || id === 'rajaa';
      if (isSandraOrRajaa || !loop) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      }

      customAnimName.current = path;
      if (isUserOverride) userAnimOverrideRef.current = true;
      invalidate();
    };

    const existingAnim = animations?.find(a => a.name === path);
    if (existingAnim) {
      handleClip(existingAnim, existingAnim.userData?.animScene as THREE.Object3D | undefined);
    } else {
      const loadCallback = (gltf: any) => {
        let sourceScene = gltf.scene;
        if (sourceScene) sourceScene.updateMatrixWorld(true);
        handleClip(gltf.animations[0], sourceScene);
      };

      cacheDynamicGLTF(path).then(loadCallback).catch(console.error);
    }
  }, [id, scene, animations, invalidate]);

  useEffect(() => {
    if (!isPreview) return;
    if (!walkerAnim || walkerAnim === 'idle') {
      customAnimName.current = null;
      userAnimOverrideRef.current = false;
      invalidate();
      return;
    }
    loadAndPlayClip(walkerAnim);
  }, [walkerAnim, isPreview, loadAndPlayClip, invalidate]);

  useEffect(() => {
    const handleToggleHairColor = (e: any) => {
      if (id === 'native') return;
      if (e.detail?.key === 'lara-haircolor') {
        setLocalHairColor(e.detail.value);
      }
    };
    const handleToggleHaircut = (e: any) => {
      if (id === 'native') return;
      if (e.detail?.key === 'lara-haircut') {
        setLocalHaircut(e.detail.value || 'original');
        invalidate();
      }
    };

    const onToggle = (e: any) => {
      const isForMe = (isLara && e.detail?.key === 'walker-anim-lara') ||
                      (!isLara && e.detail?.key === 'walker-anim-xbot') ||
                      (e.detail?.key === `walker-anim-${id}`);

      if (e.detail?.key === 'lara-custom-holster' && isActive) {
        setEquipment(prev => ({ ...prev, holster: !prev.holster }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-pistols' && isActive) {
        setEquipment(prev => ({ ...prev, pistols: !prev.pistols }));
        invalidate();
        return;
      }
      if (e.detail?.key === 'lara-custom-backpack' && isActive) {
        setEquipment(prev => ({ ...prev, backpack: !prev.backpack }));
        invalidate();
        return;
      }

      if (e.detail?.key === `walker-pos-${id}`) {
        if (Array.isArray(e.detail.value) && e.detail.value.length === 3) {
          setAgentPosition(e.detail.value[0], e.detail.value[1], e.detail.value[2]);
          invalidate();
        }
        return;
      }

      if (e.detail?.key === `walker-rot-${id}`) {
        if (typeof e.detail.value === 'number') {
          setAgentRotation(e.detail.value);
          invalidate();
        }
        return;
      }

      if (isForMe && e.detail?.value) {
        const path = e.detail.value;
        loadAndPlayClip(path, e.detail?.loop !== false, true);
      }
      handleToggleHairColor(e);
      handleToggleHaircut(e);
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
    };
  }, [isActive, isLara, id, loadAndPlayClip, invalidate]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    const onFinished = (e: any) => {
      document.dispatchEvent(new CustomEvent('walker-anim-finished', { detail: { id, path: e.action.getClip().name } }));
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [id, scene]);

  // Dynamic Haircut Swap system
  useEffect(() => {
    if (!scene) return;

    // 1. Visibilité et coloration de la chevelure d'origine
    const isNativeLara = id === 'native' || variant === 'native';
    const showNativeHair = isNativeLara || haircut === 'original';
    const targetColor = !isNativeLara && hairColor && HAIR_COLORS[hairColor] ? HAIR_COLORS[hairColor] : null;

    for (const item of parts.nativeHairMeshes) {
      const meshName = (item.mesh.name || '').toLowerCase();
      const isBraid = meshName.includes('braid') || meshName.includes('pony');
      
      // Si perruque custom, on masque tous les cheveux natifs pour éviter les débordements
      const visible = showNativeHair ? !(variant === 'angelina' && isBraid) : false;
      item.mesh.visible = visible;
      const mat = item.mesh.material;
      if (mat) {
        const mats = Array.isArray(mat) ? mat : [mat];
        mats.forEach(m => {
          if (!m) return;
          m.visible = visible;
          if (targetColor && 'color' in m) {
            (m as any).map = null; // Supprime la texture sombre par défaut pour afficher la couleur vive
            (m as any).color.copy(targetColor);
            if ('emissive' in m) {
              (m as any).emissive.copy(targetColor);
              (m as any).emissiveIntensity = 0.15;
            }
            m.needsUpdate = true;
          }
        });
      }
    }

    // 2. Bone de tête
    const headBone = parts.bones.head;
    if (!headBone) return;

    if (headBoneState !== headBone) {
      setHeadBoneState(headBone);
    }

    if (haircut === 'original') {
      const ghostWigs = headBone.children.filter((c: any) => c.userData.isWigRoot || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_'));
      ghostWigs.forEach((w: any) => headBone.remove(w));
    }

    const existingAttachment = headBone.getObjectByName('lara_custom_hair_attachment');
    if (existingAttachment) {
      headBone.remove(existingAttachment);
    }

    if (groupRef.current) {
      updateCharacterLayers(groupRef.current, isActive && cameraState.mode === 'fpv');
    }

    invalidate();
  }, [scene, parts, haircut, hairColor, variant, isActive, headBoneState, invalidate]);

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
            cacheRetargetedClip(cacheKey, finalClip);
          }
          finalClip.name = customIdleAnimPath;

          const mixer = mixerRef.current;
          if (!mixer) return;

          let action = actionsRef.current[customIdleAnimPath];
          if (!action) {
            action = mixer.clipAction(finalClip);
            action.setLoop(THREE.LoopRepeat, Infinity);
            action.clampWhenFinished = false;
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

    const isIdleTimeout = isAppIdle();
    if (isIdleTimeout) {
      if (!hasLoggedIdleRef.current && isActive) {
        hasLoggedIdleRef.current = true;
        appLog('system', `💤 Moteur 3D suspendu (${APP_IDLE_TIMEOUT_SECONDS}s inactif). Bougez pour reprendre.`);
      }
      return;
    } else if (hasLoggedIdleRef.current) {
      hasLoggedIdleRef.current = false;
    }

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
      const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeWalkerId);
      groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles && isVisibleInCountMode;
      if (!userAnimOverrideRef.current) {
        customAnimName.current = null;
      }
    } else {
      if (isActive) {
        const isUserManuallyMoving = cameraState.isUserControlling();

        if (isGuidedTour || (!isUserManuallyMoving && isAutonomous)) {
          // Mode autonome / visite guidée
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          customAnimName.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden;

          cameraState.walkerX = agentState.x;
          cameraState.walkerZ = agentState.z;
          cameraState.walkYaw = agentState.rotY;
          cameraState.isAIControlled = true;
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY };
        } else {
          // Mode contrôle manuel utilisateur (flèches clavier)
          groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
          groupRef.current.rotation.y = cameraState.walkYaw;
          groupRef.current.visible = !cameraState.walkerHidden;
          cameraState.isAIControlled = false;
          customAnimName.current = null;
          cameraState.positions[id] = { x: cameraState.walkerX, y: 0, z: cameraState.walkerZ, yaw: cameraState.walkYaw };
          
          setAgentPosition(cameraState.walkerX, 0, cameraState.walkerZ);
          setAgentRotation(cameraState.walkYaw);
        }
      } else if (isNPC) {
        const agentState = updateAgent(delta);
        groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
        groupRef.current.rotation.y = agentState.rotY;
        if (!userAnimOverrideRef.current) {
          customAnimName.current = agentState.animation;
        }
        const isVisibleInCountMode = isCharacterVisibleInMode(id, laraCount, activeWalkerId);
        groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles && isVisibleInCountMode && agentState.isSpawned;

        if (agentState.isSpawned && isVisibleInCountMode) {
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY };
        } else {
          delete cameraState.positions[id];
        }
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && cameraState.mode === 'fpv';
      if (prevFirstPersonRef.current !== isFirstPerson) {
        if (groupRef.current) {
          updateCharacterLayers(groupRef.current, isFirstPerson);
        }
        prevFirstPersonRef.current = isFirstPerson;
      }
    }

    if (!groupRef.current.visible) {
      return;
    }

    // Animation dynamique LGBT+ (directement sur les matériaux indexés, zéro traversée)
    if (variant === 'lgbta' && parts.lgbtaHairMaterials.length > 0) {
      const cycle = 15;
      const t = state.clock.elapsedTime % cycle;
      let hue = 0.86;
      if (t > 10) {
        hue = (0.86 + (t - 10) / 5) % 1.0;
      }
      const c = new THREE.Color().setHSL(hue, 1.0, 0.5);
      const e = new THREE.Color().setHSL(hue, 1.0, 0.15);
      for (let i = 0; i < parts.lgbtaHairMaterials.length; i++) {
        const m = parts.lgbtaHairMaterials[i] as any;
        if (m.color) m.color.copy(c);
        if (m.emissive) m.emissive.copy(e);
      }
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    const isMoving = !isPreview && isActive && cameraState.isUserControlling() && cameraState.isMoving;
    let target = isPreview
      ? (walkerAnim || 'idle')
      : (customAnimName.current || (isMoving ? 'walk' : (isNPC && customIdleAnimPath && !isAutonomous ? customIdleAnimPath : 'idle')));

    if (isActive && !isGuidedTour && cameraState.isUserControlling() && customAnimName.current) {
      customAnimName.current = null;
    }

    if (!actions[target] && target.endsWith('.glb')) {
      loadAndPlayClip(target);
      target = 'idle';
    }

    const isTPose = target === 'tpose' || target === 'animations/poses_idles/anim_t_pose.glb';

    if (isTPose) {
      if (activeActionName.current && actions[activeActionName.current]) {
        actions[activeActionName.current].fadeOut(0.15);
      }
      activeActionName.current = 'tpose';
      scene.traverse((c: any) => {
        if (c.isBone) {
          if (c.userData.restPos) c.position.copy(c.userData.restPos);
          if (c.userData.restQuat) c.quaternion.copy(c.userData.restQuat);
        }
      });
    } else {
      const to = actions[target];
      if (to && activeActionName.current !== target) {
        const from = (activeActionName.current && activeActionName.current !== 'tpose') ? actions[activeActionName.current] : null;
        if (from) from.fadeOut(0.2);

        if (id === 'sandra' || id === 'rajaa') {
          to.setLoop(THREE.LoopOnce, 1);
          to.clampWhenFinished = true;
        } else {
          to.setLoop(THREE.LoopRepeat, Infinity);
          to.clampWhenFinished = false;
        }

        to.reset().fadeIn(0.2).play();
        to.setEffectiveWeight(1);
        activeActionName.current = target;
      }
    }

    if (!isPaused && !isTPose) {
      mixer.update(delta);

      const enableHairPhysics = useSceneStore.getState().layers.hairPhysics;
      const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;

      if (enableHairPhysics || enableBreastPhysics) {
        scene.updateMatrixWorld(true);
      }

      let simDt = delta;
      if (simDt > 0.05) simDt = 0.05;
      const dtRatio = physicsPrevDt.current > 0 ? (simDt / physicsPrevDt.current) : 1;

      // Ponytail & Wig physics simulation (Verlet) - Même moteur physique unifié
      const activeHairChain = (haircut !== 'original' && customHairChainRef.current.length > 0)
        ? customHairChainRef.current
        : hairChainRef.current;

      if (!enableHairPhysics && activeHairChain.length > 0) {
        for (const node of activeHairChain) {
          if (node.restQuat) {
            node.bone.quaternion.copy(node.restQuat);
          }
        }
      }

      if (enableHairPhysics && activeHairChain.length > 0) {
        const firstNode = activeHairChain[0];
        const baseParent = firstNode.bone.parent;
        if (baseParent) {
          baseParent.getWorldQuaternion(_baseParentQuat);

          if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
            const headW = _headW.setFromMatrixPosition(headBoneRef.current.matrixWorld);
            const hipsW = _hipsW.setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
            const lShoulderW = _lShoulderW.setFromMatrixPosition(lShoulderRef.current.matrixWorld);
            const rShoulderW = _rShoulderW.setFromMatrixPosition(rShoulderRef.current.matrixWorld);

            _upDir.subVectors(headW, hipsW).normalize();
            _rightDir.subVectors(lShoulderW, rShoulderW).normalize();
            _backDir.crossVectors(_upDir, _rightDir).normalize();
          }

          const isWig = (haircut !== 'original');
          const isHeadMoving = isMoving || (target !== 'idle') || (walkerAnim && walkerAnim.toLowerCase().includes('walk')) || (walkerAnim && walkerAnim.toLowerCase().includes('run'));

          const userWigStiffness = useSceneStore.getState().layers.wigStiffness ?? 1.0;
          const userWigDamping = useSceneStore.getState().layers.wigDamping ?? 0.80;
          const userWigGravity = useSceneStore.getState().layers.wigGravity ?? 1.0;
          const userWigInertia = useSceneStore.getState().layers.wigInertia ?? 1.0;
          const userWigTipWeight = useSceneStore.getState().layers.wigTipWeight ?? 1.2;
          const userWigWind = useSceneStore.getState().layers.wigWind ?? 0.0;
          const userWigHeadRadius = useSceneStore.getState().layers.wigHeadCollisionRadius ?? 13.0;

          const baseDamping = isHeadMoving ? 0.70 : 0.85;
          const dampingFactor = isWig 
            ? (isHeadMoving ? (userWigDamping * 0.90) : userWigDamping)
            : baseDamping;

          const baseStiffness = isHeadMoving ? 0.038 : 0.12;
          const lerpStiffness = isWig
            ? Math.min(1.0, baseStiffness * userWigStiffness)
            : baseStiffness;

          const gravMultiplier = isWig ? userWigGravity : 1.0;
          const headColliderRadius = isWig ? userWigHeadRadius : 13.0;

          for (let nodeIdx = 0; nodeIdx < activeHairChain.length; nodeIdx++) {
            const node = activeHairChain[nodeIdx];
            const { bone, relQuat, axis, worldLength } = node;
            const parent = bone.parent;
            if (!parent) continue;

            const jointWorld = _jointWorld.setFromMatrixPosition(bone.matrixWorld);
            const restDirWorld = _restDirWorld.copy(axis).applyQuaternion(_boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat)).normalize();
            const restDir = _restDir.copy(_downWorld).lerp(restDirWorld, 0.10).normalize();
            const restTip = _restTip.copy(jointWorld).addScaledVector(restDir, worldLength);

            // Teleportation safety reset
            const dist = jointWorld.distanceTo(node.tipWorld);
            if (dist > Math.max(worldLength * 3, 20.0)) {
              node.tipWorld.copy(restTip);
              node.tipPrev.copy(restTip);
            }

            // Normalized position along the chain (0 = root, 1 = tip)
            const pChain = nodeIdx / Math.max(1, activeHairChain.length - 1);

            // 1. Damping: progressively increase damping towards the tip for wigs to kill whip vibrations
            const nodeDamping = isWig
              ? Math.min(0.98, dampingFactor + (0.96 - dampingFactor) * pChain * 0.5)
              : dampingFactor;

            // 2. Velocity computation with anti-flick clamping
            const vel = _hairVel.subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - nodeDamping));
            if (isWig) {
              const maxTipTravel = worldLength * (0.6 + (1 - pChain) * 0.6);
              if (vel.length() > maxTipTravel) {
                vel.setLength(maxTipTravel);
              }
            }

            // 3. Tip weight anchor (acts like a small stabilizing weight at the tip of each strand)
            const tipAnchorStrength = isWig ? (userWigTipWeight * pChain * pChain) : 0;

            const tipWeightFactor = isWig
              ? (1.0 + (userWigInertia - 1.0) * (1.0 - pChain * 0.5))
              : (1.0 + pChain * 0.40);

            const next = _hairNext.copy(node.tipWorld)
              .add(vel)
              .addScaledVector(_tmpG, simDt * simDt * tipWeightFactor * gravMultiplier);

            if (tipAnchorStrength > 0) {
              next.addScaledVector(_downWorld, simDt * 80.0 * tipAnchorStrength);
            }

            // Ambient wind breeze for wigs
            if (isWig && userWigWind > 0) {
              const tWind = (state.clock.elapsedTime * 3.0) + (nodeIdx * 0.5);
              const wX = Math.sin(tWind) * 0.25 * userWigWind;
              const wZ = Math.cos(tWind * 0.7) * 0.25 * userWigWind;
              next.x += wX * simDt * 60;
              next.z += wZ * simDt * 60;
            }

            // Spring return to natural rest orientation
            const effectiveStiffness = isWig
              ? Math.min(1.0, lerpStiffness * (1.0 + tipAnchorStrength * 0.5))
              : lerpStiffness;
            next.lerp(restTip, effectiveStiffness);

            // Anti-vibration sleep filter when velocity is low
            const sleepThreshold = isWig ? (0.25 + pChain * 0.35) : 0.1;
            if (!isHeadMoving && vel.lengthSq() < sleepThreshold) {
              vel.multiplyScalar(0.2);
              next.lerp(restTip, isWig ? 0.90 : 0.80);
            }

            // Constraints pass (2 passes)
            for (let i = 0; i < 2; i++) {
              const dir = _hairDir.subVectors(next, jointWorld);
              const currentLen = dir.length();
              if (currentLen > 1e-6) {
                dir.multiplyScalar(worldLength / currentLen);
              } else {
                dir.copy(restDir).multiplyScalar(worldLength);
              }
              next.copy(jointWorld).add(dir);

              // Tête (Sphère douce)
              if (headBoneRef.current) {
                const center = _colliderCenter.setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(_backDir, isWig ? 2 : 4);
                const radius = headColliderRadius;
                const dCenter = next.distanceTo(center);
                if (dCenter < radius) {
                  next.add(_colliderOffset.subVectors(next, center).normalize().multiplyScalar(radius - dCenter));
                }
              }

              // Sac à dos (Collider OBB)
              if (spine2BoneRef.current) {
                const backpackCenter = _colliderCenter.setFromMatrixPosition(spine2BoneRef.current.matrixWorld).addScaledVector(_backDir, 11);
                const localPos = _colliderOffset.subVectors(next, backpackCenter);
                const px = localPos.dot(_rightDir);
                const py = localPos.dot(_upDir);
                const pz = localPos.dot(_backDir);

                const halfW = 14.0;
                const halfH = 18.0;
                const thickness = 7.0;

                if (Math.abs(px) < halfW && Math.abs(py) < halfH && pz < thickness && pz > -5.0) {
                  next.addScaledVector(_backDir, thickness - pz);
                }
              }
            }

            const finalDir = _hairFinalDir.subVectors(next, jointWorld);
            const finalLen = finalDir.length();
            if (finalLen > 1e-6) {
              finalDir.multiplyScalar(worldLength / finalLen);
            } else {
              finalDir.copy(restDir).multiplyScalar(worldLength);
            }

            const currentDirWorld = _hairCurrentDirWorld.copy(finalDir).normalize();

            // ── Cône de déviation angulaire stricte (Perruques UNIQUEMENT - max 15° par rapport au repos) ──
            if (isWig) {
              const maxAngleDeg = useSceneStore.getState().layers.wigMaxAngle ?? 15;
              const maxAngleRad = (maxAngleDeg * Math.PI) / 180;
              const cosAngle = Math.max(-1.0, Math.min(1.0, restDirWorld.dot(currentDirWorld)));
              const currentAngle = Math.acos(cosAngle);

              if (currentAngle > maxAngleRad) {
                _rotAxis.crossVectors(restDirWorld, currentDirWorld);
                if (_rotAxis.lengthSq() > 1e-6) {
                  _rotAxis.normalize();
                  _clampedSwingQuat.setFromAxisAngle(_rotAxis, maxAngleRad);
                  currentDirWorld.copy(restDirWorld).applyQuaternion(_clampedSwingQuat).normalize();
                  finalDir.copy(currentDirWorld).multiplyScalar(worldLength);
                }
              }
            }

            node.tipPrev.copy(node.tipWorld);
            node.tipWorld.copy(jointWorld).add(finalDir);

            const parentWQuat = parent.getWorldQuaternion(_parentWQuat);
            const boneRestWorldQuat = _boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat);
            const swing = _swingQuat.setFromUnitVectors(restDirWorld, currentDirWorld);

            const newWorldQuat = swing.multiply(boneRestWorldQuat);
            bone.quaternion.copy(parentWQuat.invert().multiply(newWorldQuat));
            bone.updateMatrixWorld(true);
          }
        }
      }

      // Vitesse & accélération du torse
      if (spine2BoneRef.current) {
        spine2BoneRef.current.getWorldPosition(_tmpV1);
        if (prevSpinePosRef.current) {
          _tmpV2.subVectors(_tmpV1, prevSpinePosRef.current).divideScalar(Math.max(0.001, simDt));
          _tmpV3.subVectors(_tmpV2, prevSpineVelRef.current).divideScalar(Math.max(0.001, simDt));

          if (_tmpV3.lengthSq() > 0.01) {
            torsoAccelRef.current.copy(_tmpV3);
          } else {
            torsoAccelRef.current.lerp(_tmpV4.set(0, 0, 0), simDt * 10.0);
          }
          prevSpineVelRef.current.copy(_tmpV2);
        } else {
          prevSpinePosRef.current = new THREE.Vector3().copy(_tmpV1);
          prevSpineVelRef.current.set(0, 0, 0);
        }
        prevSpinePosRef.current.copy(_tmpV1);
      }

      // Physique poitrine
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
        const stiffness = (35.0 * braElasticity * breastFirmness);
        const damping = 10.0 * (1.0 + breastLagDelay * 0.4);
        const softnessFactor = 1.0 / Math.max(0.1, breastFirmness);

        const externalForce = _tmpV1.copy(torsoAccelRef.current).multiplyScalar((0.2 * breastIntensity * softnessFactor) / mass);
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

        for (let i = 0; i < breastChainRef.current.length; i++) {
          const { bone, restQuat } = breastChainRef.current[i];

          let swingX = Math.max(-maxBreastAngleRad, Math.min(maxBreastAngleRad, breastImpulseRef.current.y * 0.25));
          let swingY = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.x * 0.45 * softnessFactor));
          let swingZ = Math.max(-maxBreastAngleXZRad, Math.min(maxBreastAngleXZRad, breastImpulseRef.current.z * 0.45 * softnessFactor));

          _eulerBreast.set(swingX, swingY, swingZ, 'ZXY');
          _animBreastQ.setFromEuler(_eulerBreast);

          const baseRest = (bone as any).userData?.restQuat || (bone as any).restLocalQuaternion || restQuat;
          bone.quaternion.copy(baseRest).multiply(_animBreastQ);
        }
      }

      physicsPrevDt.current = simDt;
    }

    if (!isPaused) {
      invalidate();
    }
  });

  return (
    <group ref={groupRef} name={charLabel} userData={{ name: charLabel, itemName: charLabel, animUnit: true, noAnim: true }}>
      <primitive ref={modelRef} object={scene} />

      {headBoneState && id !== 'native' && variant !== 'native' && haircut !== 'original' && (
        isRiggedWig(haircut as string) ? (
          <RiggedWig
            id={haircut.replace('hair_', '')}
            color={hairColor}
            onBonesExtracted={(bones) => {
              customHairChainRef.current = buildHairChain(bones.map(b => b.bone));
            }}
            attachTo={headBoneState}
          />
        ) : (
          <Wig
            id={haircut.replace('hair_', '')}
            color={hairColor}
            onBonesExtracted={(bones) => {
              customHairChainRef.current = buildHairChain(bones.map(b => b.bone));
            }}
            attachTo={headBoneState}
          />
        )
      )}
      {!isPreview && <HeartParachute customAnimName={customAnimName} />}
      {!isPreview && isActive && <GroundPoint />}
    </group>
  );
}
