/**
 * Walker.tsx — Personnages (Walkers & NPCs).
 * Gère le chargement, les animations, le retargeting et le positionnement dynamique.
 * Updated: 2026-07-27 T-Pose position fix
 */
import { useRef, useLayoutEffect, useEffect, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTFClone } from '@features/scene/useGLTFClone';
import { Famnig27470460 } from './items/Famnig27470460';
import { Wig } from './items/Wig';
import { RiggedWig } from './items/RiggedWig';
import { isRiggedWig } from '@features/inventory/inventoryData';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cameraState } from '@features/scene/cameraState';
import { useSceneStore } from '@features/scene/store/useSceneStore';
import { LAYER_WALKER_DETAIL, LAYER_WALKER } from '@config';
import { applyLaraVariantStyles, type LaraVariant } from './LaraVariants';
import { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES } from './walkerConfig';
export { CHARACTERS, type CharacterConfig, ACCESSORIES_MESH_NAMES };
import { buildHairChain, resolveTargetBoneName, retargetClip, getDepth, _retargetCache } from './retargeting';
import {
  ACTION_FULL_TOUR,
  buildAutonomousScenario
} from './ai/scenarios';
import { buildSmartObjectInstructionSequence } from './ai/smartObjectRegistry';
import type { AgentInstruction } from './ai/aiTypes';


import { useAgentController } from './ai/useAgentController';
import { appLog } from '@features/ui/AppConsole';
import { isAppIdle, resetAppIdle } from './idleState';
import { AUTONOMOUS_NPC_IDS } from './walkerConfig';

import { WALKER_ANIM_OPTIONS } from './animOptions';
export { WALKER_ANIM_OPTIONS };

const EMPTY_SCENARIO: AgentInstruction[] = [];




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

// Dedicated static vectors & quaternions for hair physics (prevents per-node state corruption)
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
const _headW = new THREE.Vector3();
const _hipsW = new THREE.Vector3();
const _lShoulderW = new THREE.Vector3();
const _rShoulderW = new THREE.Vector3();

const silentManager = new THREE.LoadingManager();
const globalGLTFCache: Record<string, Promise<any>> = {};



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
      groupRef.current.visible = customAnimName.current === 'media/sandbox/anims/anim_falling.glb';
    }
  });

  return (
    <group ref={groupRef} position={[0, 270, 0]} visible={false}>
      {/* Corde reliée au personnage */}
      <mesh position={[0, -60, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 120, 8]} />
        <meshStandardMaterial color="#eeeeee" roughness={0.9} />
      </mesh>
      {/* Coussin Cœur FAMNIG HJÄRTA centré */}
      <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
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

  const [localHairColor, setLocalHairColor] = useState<string>('rose');
  const hairColor = isPreview && previewHairColor ? previewHairColor : localHairColor;

  const laraGrid = useSceneStore(state => state.layers.laraGrid);
  const showAllLaraStyles = useSceneStore(state => state.layers.showAllLaraStyles);
  const showWallhack = useSceneStore(state => state.layers.wallhack);
  const showAccessories = useSceneStore(state => state.layers.accessories ?? true);
  const laraPistols = useSceneStore(state => state.layers.laraPistols ?? true);
  const characterShadows = useSceneStore(state => state.layers.characterShadows ?? true);
  const { scene } = useGLTFClone(modelPath);


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

  const hairChainRef = useRef<any[]>([]);
  const customHairChainRef = useRef<any[]>([]);
  const breastChainRef = useRef<any[]>([]);
  const breastImpulseRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const breastVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const prevSpinePosRef = useRef<THREE.Vector3 | null>(null);
  const prevSpineVelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const torsoAccelRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const loadingAnimsRef = useRef<Set<string>>(new Set());

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
      case 'aiGoToilet': return buildSmartObjectInstructionSequence('toilet');
      case 'aiSitDesk1': return buildSmartObjectInstructionSequence('desk-bollsidan-1');
      case 'aiSitOfficeChair': return buildSmartObjectInstructionSequence('chair-office');
      case 'aiSitDesk2': return buildSmartObjectInstructionSequence('desk-bollsidan-2');
      case 'aiBedWest': return buildSmartObjectInstructionSequence('bed-west');
      case 'aiBedEast': return buildSmartObjectInstructionSequence('bed-east');
      case 'aiBathtub': return buildSmartObjectInstructionSequence('bathtub-garden');
      case 'aiShower': return buildSmartObjectInstructionSequence('shower');
      case 'aiGardenSofaEast': return buildSmartObjectInstructionSequence('sofa-garden-east');
      case 'aiGardenSofaWest': return buildSmartObjectInstructionSequence('sofa-garden-west');
      case 'aiCooking': return buildSmartObjectInstructionSequence('cuisine-group');
      case 'aiKallaxNE': return buildSmartObjectInstructionSequence('kallax-ne');
      case 'aiFreshAir': return buildSmartObjectInstructionSequence('garden-fresh-air');
      default: return null;
    }
  }, [activeActionKey]);


  // Le personnage est autonome s'il fait partie des PNJ autonomes (qu'il soit le joueur actif ou un PNJ)
  const isAutonomous = AUTONOMOUS_NPC_IDS.has(id);
  const isGuidedTour = Boolean(activeActionKey && id === activeWalkerId);

  const autonomousScenario = useMemo(() => {
    if (!isAutonomous) return null;
    return buildAutonomousScenario();
  }, [isAutonomous]);

  const finalScenario = isGuidedTour ? activeActionScenario : (isAutonomous ? autonomousScenario : EMPTY_SCENARIO);
  const loopScenario = isAutonomous;

  const { update: updateAgent, setPosition: setAgentPosition, setRotation: setAgentRotation } = useAgentController(
    id,
    finalScenario,
    loopScenario, // Boucle la vie quotidienne
    () => {
      if (groupRef.current) {
        const { x, y, z } = groupRef.current.position;
        // Si l'objet n'a pas encore été positionné (0,0 initial par défaut) on utilise la position de base
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
    isNPC ? (id === 'sandra' || id === 'rajaa' ? 0 : ((characterIndex ?? 0) + 1) * 3.0) : 0
  );



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

    const baseHeight = isLara ? 173.4 : 181.0;
    const scaleFactor = (targetHeight / baseHeight) * 100.0;

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
      if (c.isMesh && !c.userData.isCustomHair) {
        const name = (c.name || '').toLowerCase();
        const isTiny = name.includes('teeth') || name.includes('lash') || name.includes('eye') || name.includes('tongue');
        c.castShadow = characterShadows && !isTiny;
        c.receiveShadow = characterShadows;
        c.frustumCulled = true;
        if (c.geometry) {
          c.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.6);
        }
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



    // Initialize Native Hair Chain (Verlet)
    const nativeHairBones: THREE.Bone[] = [];
    scene.traverse(c => {
      const nLower = (c.name || '').toLowerCase();
      if ((c as any).isBone && (nLower.includes('hair') || nLower.includes('pony') || nLower.includes('braid')) && !(c as any).userData.isCustomHair) {
        nativeHairBones.push(c as THREE.Bone);
      }
    });
    hairChainRef.current = buildHairChain(nativeHairBones);

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


  useEffect(() => {
    if (!scene) return;
    scene.traverse(o => {
      const c = o as any;
      if (c.isMesh) {
        const name = (c.name || '').toLowerCase();
        const isTiny = name.includes('teeth') || name.includes('lash') || name.includes('eye') || name.includes('tongue');
        c.castShadow = characterShadows && !isTiny;
        c.receiveShadow = characterShadows;
        if (c.material) {
          const materials = Array.isArray(c.material) ? c.material : [c.material];
          materials.forEach((mat: any) => {
             mat.depthTest = !showWallhack;
             mat.depthWrite = !showWallhack;
          });
        }
      }
    });
    invalidate();
  }, [scene, characterShadows, showWallhack, invalidate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('walker-ready', { detail: { id } }));
    }, 0);
    return () => clearTimeout(timeout);
  }, [id]);

  useEffect(() => {
    const handleToggleHairColor = (e: any) => {
      if (e.detail.key === 'lara-haircolor') {
        setLocalHairColor(e.detail.value);
      }
    };
    const handleToggleHaircut = (e: any) => {
      if (e.detail.key === 'lara-haircut') {
        setLocalHaircut(e.detail.value || 'original');
        invalidate();
      }
    };

    const onToggle = (e: any) => {
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
                      (!isLara && e.detail?.key === 'walker-anim-xbot') ||
                      (e.detail?.key === `walker-anim-${id}`);

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
        resetAppIdle();
        const path = e.detail.value;

        if (path === 'idle') {
          customAnimName.current = null;
          userAnimOverrideRef.current = false;
          invalidate();
          return;
        }

        const isTPose = path === 'tpose' || path.includes('t_pose') || path.includes('t-pose');
        if (isTPose) {
          customAnimName.current = 'tpose';
          userAnimOverrideRef.current = true;
          invalidate();
          return;
        }

        const handleClip = (clip: THREE.AnimationClip, sourceScene: THREE.Object3D | undefined) => {
          if (clip) {
            clip.name = path;
            const cacheKey = id + '_' + path;
            let finalClip = _retargetCache[cacheKey];
            if (!finalClip) {
               finalClip = retargetClip(clip, scene, sourceScene);
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

            const isSandraOrRajaa = id === 'sandra' || id === 'rajaa';
            if (isSandraOrRajaa || e.detail?.loop === false) {
              action.setLoop(THREE.LoopOnce, 1);
              action.clampWhenFinished = true;
            } else {
              action.setLoop(THREE.LoopRepeat, Infinity);
              action.clampWhenFinished = false;
            }

            customAnimName.current = path;
            userAnimOverrideRef.current = true;
            if (activeActionName.current === path) {
              action.reset().fadeIn(0.2).play();
              action.setEffectiveWeight(1);
            }
            invalidate();
          }
        };

        const existingAnim = animations?.find(a => a.name === path);
        if (existingAnim) {
          handleClip(existingAnim, existingAnim.userData?.animScene as THREE.Object3D | undefined);
        } else {
          const loadCallback = (gltf: any) => {
            let sourceScene = gltf.scene;
            handleClip(gltf.animations[0], sourceScene);
          };

          if (!globalGLTFCache[path]) {
            globalGLTFCache[path] = new Promise((resolve, reject) => {
              const loader = new GLTFLoader(silentManager);
              loader.load(path, resolve, undefined, reject);
            });
          }
          globalGLTFCache[path].then(loadCallback).catch(console.error);
        }
      }
      handleToggleHairColor(e);
      handleToggleHaircut(e);
    };

    document.addEventListener('furniture-toggle', onToggle);
    return () => {
      document.removeEventListener('furniture-toggle', onToggle);
    };
  }, [isActive, isLara, scene, invalidate, id]);

  useEffect(() => {
    const mixer = mixerRef.current;
    if (!mixer) return;
    const onFinished = (e: any) => {
      document.dispatchEvent(new CustomEvent('walker-anim-finished', { detail: { id, path: e.action.getClip().name } }));
    };
    mixer.addEventListener('finished', onFinished);
    return () => mixer.removeEventListener('finished', onFinished);
  }, [id, scene]);




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

        // Clone materials once per instance so visibility doesn't affect other characters
        if (m.material && !m.userData.materialsCloned) {
          if (Array.isArray(m.material)) {
            m.material = m.material.map(mat => mat.clone());
          } else {
            m.material = (m.material as THREE.Material).clone();
          }
          m.userData.materialsCloned = true;
        }

        const meshName = (m.name || '').toLowerCase();
        const mat = m.material;

        if (mat) {
          const mats = Array.isArray(mat) ? mat : [mat];
          mats.forEach((m2: THREE.Material) => {
            const matName = m2.name.toLowerCase();
            const isBraid = meshName.includes('braid') || meshName.includes('pony') || matName.includes('braid') || matName.includes('pony');
            const isOriginalHair = (meshName.includes('hair') || isBraid || matName.includes('hair') || matName.includes('scalp')) && !m.userData.isCustomHair;

            if (isOriginalHair) {
              const show = haircut === 'original' && !(variant === 'angelina' && isBraid);
              m2.visible = show;
              if ((m as any).isMesh || (m as any).isSkinnedMesh) {
                (m as THREE.Mesh).visible = show;
              }
            }
          });
        }
      }
    });

    // 2. Trouver le bone de tête et cacher les attachments existants (legacy)
    const resolvedHName = resolveTargetBoneName(scene, 'Head');
    const headBone = headBoneRef.current || (resolvedHName ? scene.getObjectByName(resolvedHName) as THREE.Bone : null);
    if (!headBone) return;

    if (headBoneState !== headBone) {
      setHeadBoneState(headBone);
    }

    if (haircut === 'original') {
      const ghostWigs = headBone.children.filter((c: any) => c.userData.isWigRoot || /^[0-9]+$/.test(c.name) || c.name.toLowerCase().includes('hair') || c.name.includes('_ARM_'));
      console.log(`[Wig Sweep] haircut=original. headBone children:`, headBone.children.map(c => c.name));
      console.log(`[Wig Sweep] found ghosts:`, ghostWigs.map(w => w.name));
      ghostWigs.forEach((w: any) => headBone.remove(w));
    }

    const existingAttachment = headBone.getObjectByName('lara_custom_hair_attachment');
    if (existingAttachment) {
      headBone.remove(existingAttachment);
    }

    invalidate();
  }, [scene, haircut, invalidate]);

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
        appLog('system', '💤 Moteur 3D suspendu (42s inactif). Bougez pour reprendre.');
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
      groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles;
      // En mode grille, effacer l'animation IA pour que les NPCs restent en idle
      // sauf si l'utilisateur a manuellement choisi une animation
      if (!userAnimOverrideRef.current) {
        customAnimName.current = null;
      }
    } else {
      if (isActive) {
        const isUserManuallyMoving = cameraState.isUserControlling();

        if (isGuidedTour || (!isUserManuallyMoving && isAutonomous)) {
          // Mode autonome / visite guidée : l'IA déplace le joueur
          const agentState = updateAgent(delta);
          groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
          groupRef.current.rotation.y = agentState.rotY;
          customAnimName.current = agentState.animation;
          groupRef.current.visible = !cameraState.walkerHidden;

          // Synchronise la position avec cameraState pour minimap et FPV
          cameraState.walkerX = agentState.x;
          cameraState.walkerZ = agentState.z;
          cameraState.walkYaw = agentState.rotY;
          cameraState.isAIControlled = true;
        } else {
          // Mode contrôle manuel utilisateur (flèches clavier)
          groupRef.current.position.set(cameraState.walkerX, 0, cameraState.walkerZ);
          groupRef.current.rotation.y = cameraState.walkYaw;
          groupRef.current.visible = !cameraState.walkerHidden;
          cameraState.isAIControlled = false;
          customAnimName.current = null;
          
          // Met à jour la position interne de l'agent pour qu'il reprenne depuis la nouvelle position
          setAgentPosition(cameraState.walkerX, 0, cameraState.walkerZ);
          setAgentRotation(cameraState.walkYaw);
        }
      } else if (isNPC) {
        const agentState = updateAgent(delta);
        groupRef.current.position.set(agentState.x, agentState.y, agentState.z);
        groupRef.current.rotation.y = agentState.rotY;
        // Ne pas écraser l'animation choisie par l'utilisateur
        if (!userAnimOverrideRef.current) {
          customAnimName.current = agentState.animation;
        }
        groupRef.current.visible = !cameraState.walkerHidden && showAllLaraStyles && agentState.isSpawned;

        if (agentState.isSpawned) {
          cameraState.positions[id] = { x: agentState.x, y: agentState.y, z: agentState.z, yaw: agentState.rotY };
        } else {
          delete cameraState.positions[id];
        }
      } else {
        groupRef.current.visible = false;
      }

      const isFirstPerson = isActive && cameraState.mode === 'fpv';
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

    if (variant === 'lgbta') {
      const cycle = 15;
      const t = state.clock.elapsedTime % cycle;
      let hue = 0.86; // Pink
      if (t > 10) {
        hue = (0.86 + (t - 10) / 5) % 1.0;
      }
      const c = new THREE.Color().setHSL(hue, 1.0, 0.5);
      const e = new THREE.Color().setHSL(hue, 1.0, 0.15);
      groupRef.current.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          const mesh = o as THREE.Mesh;
          const mat = mesh.material;
          if (!mat) return;
          const matName = Array.isArray(mat) ? mat[0].name.toLowerCase() : (mat as THREE.Material).name.toLowerCase();
          const meshName = mesh.name.toLowerCase();
          const isHair = matName.includes('hair') || matName.includes('pony') || matName.includes('braid') || meshName.includes('hair') || meshName.includes('pony') || meshName.includes('braid');
          if (isHair) {
            const mList = Array.isArray(mat) ? mat : [mat];
            mList.forEach((m: any) => {
              if (m.color) m.color.copy(c);
              if (m.emissive) m.emissive.copy(e);
            });
          }
        }
      });
    }

    const mixer = mixerRef.current;
    const actions = actionsRef.current;

    const isNpcActive = isNPC && (
      (customAnimName.current !== null && customAnimName.current !== 'idle' && !customAnimName.current.includes('idle')) ||
      (!isAutonomous && customIdleAnimPath && customIdleAnimPath.includes('dance')) ||
      Math.abs(groupRef.current.position.x - (groupRef.current.userData.prevX ?? groupRef.current.position.x)) > 0.01 ||
      Math.abs(groupRef.current.position.z - (groupRef.current.userData.prevZ ?? groupRef.current.position.z)) > 0.01
    );
    groupRef.current.userData.prevX = groupRef.current.position.x;
    groupRef.current.userData.prevZ = groupRef.current.position.z;

    // Inactive model is stationary unless active as NPC or autonomous player
    let isMoving = (isActive && cameraState.isUserControlling()) ? cameraState.isMoving : isNpcActive;
    let target = isPreview ? (walkerAnim || 'idle') : (isMoving ? 'walk' : 'idle');

    // Si le joueur reprend le contrôle manuel (flèches clavier), effacer l'animation IA pour marcher ou idle
    if (isActive && !isGuidedTour && cameraState.isUserControlling() && customAnimName.current) {
      customAnimName.current = null;
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
              if (id === 'sandra' || id === 'rajaa') {
                action.setLoop(THREE.LoopOnce, 1);
                action.clampWhenFinished = true;
              } else {
                action.setLoop(THREE.LoopRepeat, Infinity);
                action.clampWhenFinished = false;
              }
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

    if (isNPC && customIdleAnimPath && target === 'idle' && !isAutonomous) {
      target = customIdleAnimPath;
    }


    const isTPose = target === 'tpose' || target.includes('t_pose') || target.includes('t-pose');

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

          const isContinuous = target === 'idle' || target === 'walk' || target === 'run' || (isNPC && target === customIdleAnimPath && id !== 'sandra' && id !== 'rajaa');
          if (isContinuous) {
            to.setLoop(THREE.LoopRepeat, Infinity);
            to.clampWhenFinished = false;
          } else if (id === 'sandra' || id === 'rajaa') {
            to.setLoop(THREE.LoopOnce, 1);
            to.clampWhenFinished = true;
          }

          to.reset().fadeIn(0.2).play();
          to.setEffectiveWeight(1);
          activeActionName.current = target;
      }
    }

    if (!isPaused && !isTPose) {
        mixer.update(delta);

        // Physique réactive & Gravité universelle (sans vent/bruit continu au repos)


        const enableHairPhysics = useSceneStore.getState().layers.hairPhysics;
        const enableBreastPhysics = useSceneStore.getState().layers.breastPhysics;

        // Update world matrices only when physics is active
        if (enableHairPhysics || enableBreastPhysics) {
          scene.updateMatrixWorld(true);
        }

        // Physics simulation timestep (Time-Corrected Verlet)
        let simDt = delta;
        if (simDt > 0.05) simDt = 0.05; // cap to 20fps
        const dtRatio = physicsPrevDt.current > 0 ? (simDt / physicsPrevDt.current) : 1;

        // Ponytail physics simulation (Verlet)
        const activeHairChain = (haircut !== 'original' && customHairChainRef.current.length > 0) ? customHairChainRef.current : hairChainRef.current;

        if (!enableHairPhysics && activeHairChain.length > 0) {
          for (const node of activeHairChain) {
            if (node.restQuat) {
              node.bone.quaternion.copy(node.restQuat);
            }
          }
        }

        if (!(window as any)._hairDebugLogged && activeHairChain.length > 0) {
          console.log(`[HairPhysics] Active chain length: ${activeHairChain.length}, isCustom: ${activeHairChain === customHairChainRef.current}`);
          (window as any)._hairDebugLogged = true;
        }

        if (enableHairPhysics && activeHairChain.length > 0) {
          const firstNode = activeHairChain[0];
          const baseParent = firstNode.bone.parent;
          if (baseParent) {
            baseParent.getWorldQuaternion(_baseParentQuat);

            // Compute torso frame vectors once per character
            if (headBoneRef.current && hipsBoneRef.current && lShoulderRef.current && rShoulderRef.current) {
              const headW = _headW.setFromMatrixPosition(headBoneRef.current.matrixWorld);
              const hipsW = _hipsW.setFromMatrixPosition(hipsBoneRef.current.matrixWorld);
              const lShoulderW = _lShoulderW.setFromMatrixPosition(lShoulderRef.current.matrixWorld);
              const rShoulderW = _rShoulderW.setFromMatrixPosition(rShoulderRef.current.matrixWorld);

              _upDir.subVectors(headW, hipsW).normalize();
              _rightDir.subVectors(lShoulderW, rShoulderW).normalize();
              _backDir.crossVectors(_upDir, _rightDir).normalize();
            }

            for (const node of activeHairChain) {
              const { bone, relQuat, axis, worldLength } = node;
              const parent = bone.parent;
              if (!parent) continue;

              const jointWorld = _jointWorld.setFromMatrixPosition(bone.matrixWorld);
              const restDirWorld = _restDirWorld.copy(axis).applyQuaternion(_boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat)).normalize();
              const restDir = _restDir.copy(_downWorld).lerp(restDirWorld, 0.15).normalize();
              const restTip = _restTip.copy(jointWorld).addScaledVector(restDir, worldLength);

              // Teleportation safety reset
              const dist = jointWorld.distanceTo(node.tipWorld);
              if (dist > Math.max(worldLength * 3, 20.0)) {
                node.tipWorld.copy(restTip);
                node.tipPrev.copy(restTip);
              }

              const isHeadMoving = isMoving || (target !== 'idle') || (walkerAnim && walkerAnim.toLowerCase().includes('walk')) || (walkerAnim && walkerAnim.toLowerCase().includes('run'));
              const dampingFactor = isHeadMoving ? 0.75 : 0.85;

              const vel = _hairVel.subVectors(node.tipWorld, node.tipPrev).multiplyScalar(dtRatio * (1 - dampingFactor));
              const next = _hairNext.copy(node.tipWorld).add(vel).addScaledVector(_tmpG, simDt * simDt);

              // Souplesse d'attraction vers le bas (gravité naturelle)
              const lerpStiffness = isHeadMoving ? 0.05 : 0.12;
              next.lerp(restTip, lerpStiffness);

              // Restitution et frein au repos si la vitesse est faible (immobilisation totale sans bruit)
              if (!isHeadMoving && vel.lengthSq() < 0.1) {
                vel.set(0, 0, 0);
                next.lerp(restTip, 0.8);
              }

              // Resolve constraints iteratively (2 passes)
              for (let i = 0; i < 2; i++) {
                // 1. Length constraint
                const dir = _hairDir.subVectors(next, jointWorld);
                const currentLen = dir.length();
                if (currentLen > 1e-6) {
                  dir.multiplyScalar(worldLength / currentLen);
                } else {
                  dir.copy(restDir).multiplyScalar(worldLength);
                }
                next.copy(jointWorld).add(dir);

                // 2. Colliders géométriques (Tête sphérique + Sac à dos OBB rectangulaire plat)
                // Tête (Sphère douce)
                if (headBoneRef.current && activeHairChain !== customHairChainRef.current) {
                  const center = _colliderCenter.setFromMatrixPosition(headBoneRef.current.matrixWorld).addScaledVector(_backDir, 4);
                  const radius = 13.0;
                  const dCenter = next.distanceTo(center);
                  if (dCenter < radius) {
                    next.add(_colliderOffset.subVectors(next, center).normalize().multiplyScalar(radius - dCenter));
                  }
                }

                // Sac à dos (Collider Rectangulaire Plat OBB)
                if (spine2BoneRef.current && activeHairChain !== customHairChainRef.current) {
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

              // Final exact length constraint
              const finalDir = _hairFinalDir.subVectors(next, jointWorld);
              const finalLen = finalDir.length();
              if (finalLen > 1e-6) {
                finalDir.multiplyScalar(worldLength / finalLen);
              } else {
                finalDir.copy(restDir).multiplyScalar(worldLength);
              }

              node.tipPrev.copy(node.tipWorld);
              node.tipWorld.copy(jointWorld).add(finalDir);

              // Orientation réelle des os de la tresse (ponytail) d'après le résultat physique Verlet
              const currentDirWorld = _hairCurrentDirWorld.copy(finalDir).normalize();
              const parentWQuat = parent.getWorldQuaternion(_parentWQuat);

              // Correct quaternion math: Swing from REST WORLD direction to CURRENT WORLD direction
              const boneRestWorldQuat = _boneRestWorldQuat.copy(_baseParentQuat).multiply(relQuat);
              const swing = _swingQuat.setFromUnitVectors(restDirWorld, currentDirWorld);

              const newWorldQuat = swing.multiply(boneRestWorldQuat);
              bone.quaternion.copy(parentWQuat.invert().multiply(newWorldQuat));

              bone.updateMatrixWorld(true);
            }
          }
        }

        // 1. Détection de la véritable vitesse/accélération du torse en temps réel
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

        // 2. Intégrateur masse-ressort-amortisseur authentique (Physical Spring-Damper)
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
    <group ref={groupRef} userData={{ animUnit: true, noAnim: true }}>
      <primitive ref={modelRef} object={scene} />

      {headBoneState && haircut !== 'original' && (
        isRiggedWig(haircut as string) ? (
          <RiggedWig
            id={haircut.replace('hair_', '')}
            color={hairColor}
            onBonesExtracted={(bones) => {
              console.log(`[RiggedWig] Passing ${bones.length} bones to buildHairChain`);
              customHairChainRef.current = buildHairChain(bones.map(b => b.bone));
              (window as any)._hairDebugLogged = false;
            }}
            attachTo={headBoneState}
          />
        ) : (
          <Wig
            id={haircut.replace('hair_', '')}
            color={hairColor}
            onBonesExtracted={(bones) => {
              console.log(`[Wig] Passing ${bones.length} bones to buildHairChain`);
              customHairChainRef.current = buildHairChain(bones.map(b => b.bone));
              (window as any)._hairDebugLogged = false;
            }}
            attachTo={headBoneState}
          />
        )
      )}
      <HeartParachute customAnimName={customAnimName} />
      {!isPreview && isActive && <GroundPoint />}
    </group>
  );
}
